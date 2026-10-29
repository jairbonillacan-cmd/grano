export const lesson = {
  id: 'de3-transformacion-03-contracts-semantic-layer',
  legacyId: 'l12-contracts-semantic-layer',
  title: 'Contratos de datos ejecutables (ODCS v3) y capa semántica',
  subtitle: 'Contratos de datos ejecutables (ODCS v3) y puente semántico sobre Mercado Brisa',
  module: 'de3-transformacion',
  moduleId: 'de3-transformacion',
  contentVersion: 2,
  order: 3,
  legacyOrder: 12,
  minutes: 30,
  tracks: ['de', 'bi'],
  level: 3,
  prerequisites: [
    'de3-transformacion-02-tests-unitarios-auditorias-dag',
    'c2-dimensional-04-metrics-simpson',
  ],
  needsReview: false,
  hook: 'El martes por la mañana, el equipo de catálogo de Mercado Brisa inserta un SKU de prueba con precio negativo (-$15.00) y el comité comercial presenta dos informes contradictorios: Marketing reporta el ingreso bruto de pedidos mientras que Finanzas descuenta todas las devoluciones de la tabla refunds sin cruzar el grano por pedido. ¿Cómo blindas la frontera técnica con un contrato de datos ejecutable (ODCS v3) y unificas las fórmulas de negocio en una capa semántica gobernada?',
  objectives: [
    'Especificar contratos de datos ejecutables bajo el estándar Bitol ODCS v3 y model contracts en dbt con verificación física de tipos y nulidad.',
    'Gobernar la evolución de esquemas aplicando versionado de modelos (`v1` a `v2`) y cuarentena de registros que violan las garantías contractuales.',
    'Construir consultas canónicas de capa semántica (MetricFlow / Cube) que calculen ingresos netos, retención e ingreso promedio por comprador sin fan-out.',
  ],
  sections: [
    {
      id: 'sec-de3-t03-odcs',
      heading: 'Contratos de datos ejecutables: ODCS v3 y model contracts',
      body: 'Una prueba de datos tradicional evalúa una tabla después de haberla construido. Por el contrario, un **contrato de datos ejecutable** (*Data Contract*) es un acuerdo técnico vinculante entre productor y consumidores. Este acuerdo se compila directamente en las restricciones físicas del almacén antes de exponer la tabla.\n\nEl estándar **Open Data Contract Standard (ODCS v3.x)**, mantenido por Bitol dentro de la Linux Foundation AI & Data, formaliza cuatro compromisos en un archivo declarativo (`kind: DataContract`). Primero, define el esquema físico exacto con nombres de columna, tipos y restricciones `NOT NULL`. Segundo, declara las reglas de calidad de dominio. Tercero, fija acuerdos de nivel de servicio (SLA de frescura y disponibilidad). Cuarto, asigna el equipo propietario responsable.\n\nEn **dbt**, activar `contract: { enforced: true }` en un modelo público inyecta tipos explícitos y cláusulas `NOT NULL` dentro de la sentencia DDL (`CREATE TABLE`). Si una columna cambia de `DECIMAL(12,2)` a `VARCHAR` o entra un nulo prohibido, el almacén rechaza la escritura en el acto.',
      callout: 'Un test de datos avisa que una columna cambió; un contrato ejecutable impide a nivel de DDL que una tabla incompatible llegue a crearse.',
      example: {
        language: 'sql',
        code: `-- Verificación de violaciones de contrato en dim_products y dim_customers
SELECT
  'dim_products_contract' AS contract_name,
  COUNT(*) AS total_rows,
  SUM(CASE WHEN list_price_usd <= 0 OR sku IS NULL THEN 1 ELSE 0 END) AS contract_violations
FROM products
UNION ALL
SELECT
  'dim_customers_contract',
  COUNT(*),
  SUM(CASE WHEN postal_code IS NULL OR email IS NULL THEN 1 ELSE 0 END)
FROM customers
ORDER BY contract_name;`,
        explanation:
          'Al auditar ambos contratos sobre Mercado Brisa, detectamos 1 violación bloqueante en `products` (`list_price_usd <= 0`) y 218 códigos postales ausentes en `customers`.',
      },
    },
    {
      id: 'sec-de3-t03-versioning',
      heading: 'Evolución de esquemas, cuarentena y versionado de modelos',
      body: 'Los sistemas transaccionales cambian con frecuencia, pero los consumidores analíticos necesitan estabilidad. Por ello los contratos dividen cualquier cambio de esquema en dos categorías. Los **cambios compatibles** añaden columnas opcionales sin romper consultas existentes. Los **cambios destructivos** (*breaking changes*) eliminan columnas, renombran atributos o alteran tipos físicos.\n\nCuando un cambio destructivo resulta obligatorio, el contrato prohíbe sobrescribir el modelo vigente. En su lugar, se publica una **nueva versión del modelo** (`fct_orders_v2`) manteniendo activa la versión previa (`fct_orders_v1`) durante una ventana de deprecación acordada. Así los tableros y pipelines consumidores migran de forma programada sin interrupciones.\n\nA nivel de filas, una fuente externa puede enviar registros que violen el dominio del contrato, como el SKU con `list_price_usd = -15.0` en `products`. El pipeline aplica entonces el patrón de **cuarentena** (*dead-letter table*). Separa las filas infractoras en una tabla de auditoría y publica el modelo oficial únicamente con los registros válidos.',
      callout: 'Renombrar una columna en una tabla Gold sin publicar una versión v2 equivale a romper una API pública en producción.',
      example: {
        language: 'sql',
        code: `-- Patrón de cuarentena: aislar SKUs que violan el contrato de precios
WITH valid_products AS (
  SELECT product_id, sku, category, list_price_usd, unit_cost_usd
  FROM products
  WHERE list_price_usd > 0 AND unit_cost_usd > 0
),
quarantined_products AS (
  SELECT product_id, sku, category, list_price_usd, unit_cost_usd
  FROM products
  WHERE list_price_usd <= 0 OR unit_cost_usd <= 0
)
SELECT
  (SELECT COUNT(*) FROM valid_products) AS published_skus,
  (SELECT COUNT(*) FROM quarantined_products) AS quarantined_skus,
  (SELECT ROUND(MIN(list_price_usd), 2) FROM valid_products) AS min_valid_price_usd;`,
        explanation:
          'El contrato publica los 179 SKUs válidos (`min_valid_price_usd = 12.16`) y desvía el único SKU corrupto a cuarentena sin contaminar los márgenes.',
      },
    },
    {
      id: 'sec-de3-t03-semantic',
      heading: 'Puente hacia la capa semántica: MetricFlow y Cube',
      body: 'Incluso con tablas contratadas, las discrepancias regresan si cada herramienta BI escribe sus propias fórmulas SQL. Si un analista calcula el ingreso neto uniendo `orders` con `refunds` (`1:N`) y otro suma `orders.total_usd` sin restar devoluciones, la dirección recibirá dos cifras opuestas.\n\nLa **capa semántica** (implementada en motores como dbt MetricFlow y Cube) actúa como traductor central entre las tablas físicas y todos los consumidores. En ella declaras tres bloques: las entidades (`order_id`, `customer_id`, `store_id`), las dimensiones de corte (`region`, `segment`, `category`) y las **métricas gobernadas** (`SUM`, `COUNT DISTINCT` y razones como `net_retention_pct`).\n\nCuando un usuario consulta una métrica que cruza dos tablas de distinto grano (`orders` y `refunds`), el motor semántico genera automáticamente una consulta multipaso (*Drill-Across*). Primero preagrega cada hecho por separado en CTEs y luego los une por su entidad común, impidiendo cualquier multiplicación de filas (*fan-out*).',
      callout: 'En una capa semántica nunca promedias porcentajes ni unes tablas 1:N antes de sumar: preagregas cada hecho a su entidad común y calculas las razones al final con NULLIF.',
      example: {
        language: 'sql',
        code: `-- Consulta generada por la capa semántica para Ingreso Neto por región
WITH valid_orders AS (
  SELECT order_id, store_id, customer_id, total_usd
  FROM orders
  WHERE status IN ('completed', 'refunded')
),
order_refunds AS (
  SELECT order_id, SUM(refund_amount_usd) AS refunded_usd
  FROM refunds
  GROUP BY order_id
)
SELECT
  s.region,
  COUNT(vo.order_id) AS completed_orders,
  ROUND(SUM(vo.total_usd), 2) AS gross_revenue_usd,
  ROUND(SUM(COALESCE(rf.refunded_usd, 0.0)), 2) AS refunded_usd,
  ROUND(SUM(vo.total_usd - COALESCE(rf.refunded_usd, 0.0)), 2) AS net_revenue_usd
FROM valid_orders vo
INNER JOIN stores s ON vo.store_id = s.store_id
LEFT JOIN order_refunds rf ON vo.order_id = rf.order_id
GROUP BY s.region
ORDER BY net_revenue_usd DESC;`,
        explanation:
          'Al preagregar `refunds` por `order_id` antes de unir con `valid_orders`, la capa semántica garantiza que órdenes con múltiples reembolsos parciales jamás dupliquen `vo.total_usd`.',
      },
      interactive: {
        type: 'semantic-contract-sim',
        component: 'semantic-contract-sim',
        title: 'Simulador de Contrato ODCS v3 y Capa Semántica',
        description:
          'Explora cómo un contrato ejecutable intercepta violaciones de esquema y cómo la capa semántica distribuye la misma definición de Ingreso Neto hacia BI, notebooks y APIs.',
      },
    },
  ],
  workedExample: {
    title: 'Certificación de contrato ODCS v3 y métricas semánticas en Mercado Brisa',
    scenario:
      'La dirección de Mercado Brisa requiere certificar el contrato semántico de ingresos regionales (`sem_regional_revenue_v1`). Debes verificar primero las violaciones de contrato en las tablas maestras, cuantificar los reembolsos huérfanos de estado y finalmente materializar la tabla de métricas semánticas por región con tasa de retención neta.',
    steps: [
      {
        label: 'Paso 1: Auditar el cumplimiento de contrato en productos y clientes',
        explanation:
          'Verificamos cuántas filas violan las restricciones de dominio (`list_price_usd <= 0`) en `products` y cuántas incumplen la completitud de dirección postal (`postal_code IS NULL`) en `customers`.',
        code: `SELECT
  'dim_products_contract' AS contract_name,
  COUNT(*) AS total_rows,
  SUM(CASE WHEN list_price_usd <= 0 OR sku IS NULL THEN 1 ELSE 0 END) AS contract_violations
FROM products
UNION ALL
SELECT
  'dim_customers_contract',
  COUNT(*),
  SUM(CASE WHEN postal_code IS NULL OR email IS NULL THEN 1 ELSE 0 END)
FROM customers
ORDER BY contract_name;`,
        expectedOutput: [
          {
            contract_name: 'dim_customers_contract',
            total_rows: 2400,
            contract_violations: 218,
          },
          {
            contract_name: 'dim_products_contract',
            total_rows: 180,
            contract_violations: 1,
          },
        ],
      },
      {
        label: 'Paso 2: Aislar reembolsos elegibles según el contrato de órdenes válidas',
        explanation:
          'El contrato financiero estipula que solo pueden descontarse reembolsos de órdenes cuyo estado sea `completed` o `refunded`. Comparamos el total bruto de `refunds` frente a los reembolsos que cumplen el contrato.',
        code: `SELECT
  CASE
    WHEN o.status IN ('completed', 'refunded') THEN 'eligible_by_contract'
    ELSE 'quarantined_invalid_order_status'
  END AS contract_bucket,
  COUNT(r.refund_id) AS refund_rows,
  ROUND(SUM(r.refund_amount_usd), 2) AS refund_amount_usd
FROM refunds r
INNER JOIN orders o ON r.order_id = o.order_id
GROUP BY 1
ORDER BY refund_rows DESC;`,
        expectedOutput: [
          {
            contract_bucket: 'eligible_by_contract',
            refund_rows: 1305,
            refund_amount_usd: 274534.52,
          },
          {
            contract_bucket: 'quarantined_invalid_order_status',
            refund_rows: 145,
            refund_amount_usd: 46562.73,
          },
        ],
      },
      {
        label: 'Paso 3: Calcular las métricas gobernadas de la capa semántica por región',
        explanation:
          'Con las órdenes válidas y los reembolsos preagregados por `order_id`, calculamos para cada `region` el ingreso bruto, el monto reembolsado elegible, el ingreso neto (`net_revenue_usd`) y el porcentaje de retención neta (`net_retention_pct`).',
        code: `WITH valid_orders AS (
  SELECT
    order_id,
    store_id,
    customer_id,
    total_usd
  FROM orders
  WHERE status IN ('completed', 'refunded')
),
order_refunds AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS refunded_usd
  FROM refunds
  GROUP BY order_id
)
SELECT
  s.region,
  COUNT(vo.order_id) AS completed_orders,
  COUNT(DISTINCT vo.customer_id) AS active_customers,
  ROUND(SUM(vo.total_usd), 2) AS gross_revenue_usd,
  ROUND(SUM(COALESCE(rf.refunded_usd, 0.0)), 2) AS refunded_usd,
  ROUND(SUM(vo.total_usd - COALESCE(rf.refunded_usd, 0.0)), 2) AS net_revenue_usd,
  ROUND(
    100.0 * SUM(vo.total_usd - COALESCE(rf.refunded_usd, 0.0)) / NULLIF(SUM(vo.total_usd), 0),
    2
  ) AS net_retention_pct
FROM valid_orders vo
INNER JOIN stores s ON vo.store_id = s.store_id
LEFT JOIN order_refunds rf ON vo.order_id = rf.order_id
GROUP BY s.region
ORDER BY net_revenue_usd DESC;`,
        expectedOutput: [
          {
            region: 'Cono Sur',
            completed_orders: 5401,
            active_customers: 780,
            gross_revenue_usd: 2256477.18,
            refunded_usd: 77991.82,
            net_revenue_usd: 2178485.36,
            net_retention_pct: 96.54,
          },
          {
            region: 'Andina',
            completed_orders: 5400,
            active_customers: 780,
            gross_revenue_usd: 2180511.86,
            refunded_usd: 115379.23,
            net_revenue_usd: 2065132.63,
            net_retention_pct: 94.71,
          },
          {
            region: 'Iberia',
            completed_orders: 3085,
            active_customers: 400,
            gross_revenue_usd: 1482611.35,
            refunded_usd: 43170.94,
            net_revenue_usd: 1439440.41,
            net_retention_pct: 97.09,
          },
          {
            region: 'Norteamérica',
            completed_orders: 2314,
            active_customers: 380,
            gross_revenue_usd: 954887.61,
            refunded_usd: 37992.53,
            net_revenue_usd: 916895.08,
            net_retention_pct: 96.02,
          },
        ],
      },
    ],
  },
  checks: [
    {
      type: 'mcq',
      id: 'chk-de3-t03-contract',
      prompt:
        '¿Qué ocurre en dbt cuando un modelo tiene configurado `contract: { enforced: true }` y la consulta SQL intenta devolver una columna cuyo tipo de dato no coincide con el declarado en el archivo YAML o incluye un valor nulo en un campo `not_null`?',
      options: [
        {
          id: 'a',
          text: 'El motor convierte automáticamente los valores nulos en cadenas vacías y publica la tabla sin avisar.',
          correct: false,
          feedback:
            'Incorrecto. Un contrato ejecutable jamás muta silenciosamente los datos para ocultar un incumplimiento.',
        },
        {
          id: 'b',
          text: 'La compilación o la sentencia DDL falla explícitamente y aborta la materialización del modelo antes de sobrescribir la tabla pública.',
          correct: true,
          feedback:
            'Correcto. `contract: { enforced: true }` compila los tipos físicos y restricciones `NOT NULL` en el DDL, impidiendo que la tabla inválida se materialice.',
        },
        {
          id: 'c',
          text: 'La tabla se publica normalmente en producción y se envía un correo resumen a final de mes.',
          correct: false,
          feedback:
            'Incorrecto. La garantía clave de un contrato ejecutable es el bloqueo preventivo antes de afectar a los consumidores.',
        },
      ],
      explanation:
        'A diferencia de los tests post-hoc, los contratos de modelo (`model contracts`) verifican la firma de columnas, tipos de datos y restricciones `NOT NULL` en el momento mismo de construir la tabla.',
    },
    {
      type: 'mcq',
      id: 'chk-de3-t03-semantic-fanout',
      prompt:
        '¿Cómo evita una capa semántica (como MetricFlow o Cube) que se duplique `orders.total_usd` cuando un analista pide en el mismo reporte el total de ventas brutas de `orders` y el monto reembolsado de `refunds`?',
      options: [
        {
          id: 'a',
          text: 'Prohíbe consultar dos tablas distintas en el mismo dashboard.',
          correct: false,
          feedback:
            'Incorrecto. La función principal de la capa semántica es permitir combinar métricas de múltiples tablas de hechos con seguridad.',
        },
        {
          id: 'b',
          text: 'Preagrega cada tabla de hechos a su entidad o dimensión conformada en CTEs separadas (Drill-Across) antes de unirlas.',
          correct: true,
          feedback:
            'Exacto. Al resumir primero `refunds` por `order_id` (o por dimensión compartida) y luego hacer `LEFT JOIN`, preserva el grano 1:1 y elimina el fan-out.',
        },
        {
          id: 'c',
          text: 'Divide el resultado final entre dos de forma aproximada.',
          correct: false,
          feedback:
            'Incorrecto. Una heurística aproximada rompería la exactitud contable.',
        },
      ],
      explanation:
        'El motor semántico conoce la cardinalidad de las entidades declaradas y genera automáticamente subconsultas preagregadas (*Drill-Across*) para que nunca se sumen cabeceras multiplicadas por líneas o eventos hijos.',
    },
    {
      type: 'predict-output',
      id: 'chk-de3-t03-predict',
      prompt:
        'En el segmento `cafeteria_b2b` de Mercado Brisa, el ingreso neto total (`net_revenue_usd`) es `$1,402,650.90` generado por `447` clientes únicos (`distinct_buyers`) a lo largo de `2,843` órdenes. Según la definición semántica de `net_arpu_usd` (Ingreso Neto Promedio por Comprador Único), ¿qué operación produce el valor correcto de `$3,137.92`?',
      options: [
        {
          id: 'a',
          text: 'ROUND(1402650.90 / NULLIF(447, 0), 2)',
          correct: true,
          feedback:
            'Correcto. El ARPU neto divide la suma del ingreso neto entre el conteo de clientes únicos (`COUNT(DISTINCT customer_id) = 447`), dando `$3,137.92`.',
        },
        {
          id: 'b',
          text: 'ROUND(1402650.90 / NULLIF(2843, 0), 2)',
          correct: false,
          feedback:
            'Incorrecto. Dividir entre el número de órdenes (`2,843`) calcula el ticket neto promedio por pedido (`AOV`), no el ingreso por comprador único (`ARPU`).',
        },
        {
          id: 'c',
          text: 'AVG(total_usd) agrupado sin descontar reembolsos.',
          correct: false,
          feedback:
            'Incorrecto. Eso calcularía el ticket bruto por orden sin deducir reembolsos ni agrupar por cliente.',
        },
      ],
      explanation:
        '`net_arpu_usd` es una métrica de razón no aditiva que divide la medida agregada `SUM(net_revenue_usd)` (`$1,402,650.90`) entre la medida `COUNT(DISTINCT customer_id)` (`447`), resultando en `$3,137.92`.',
    },
  ],
  practice: {
    type: 'sql',
    title: 'Métricas gobernadas de la capa semántica por segmento de cliente',
    prompt:
      'Construye la consulta canónica de la capa semántica de Mercado Brisa agrupada por segmento de cliente (`c.segment`). Primero define una CTE `valid_orders` con las órdenes cuyo `status IN (\'completed\', \'refunded\')` y una segunda CTE `order_refunds` que preagregue `refunds` por `order_id` (`SUM(refund_amount_usd) AS refunded_usd`). Luego une `valid_orders` (`vo`) con `customers` (`c`) mediante `INNER JOIN` y con `order_refunds` (`rf`) mediante `LEFT JOIN` para calcular por `c.segment`: `total_orders` (`COUNT(vo.order_id)`), `distinct_buyers` (`COUNT(DISTINCT vo.customer_id)`), `gross_revenue_usd` (`ROUND(SUM(vo.total_usd), 2)`), `total_refunded_usd` (`ROUND(SUM(COALESCE(rf.refunded_usd, 0.0)), 2)`), `net_revenue_usd` (`ROUND(SUM(vo.total_usd - COALESCE(rf.refunded_usd, 0.0)), 2)`) y `net_arpu_usd` (`ROUND(SUM(vo.total_usd - COALESCE(rf.refunded_usd, 0.0)) / NULLIF(COUNT(DISTINCT vo.customer_id), 0), 2)`). Ordena por `net_revenue_usd DESC`.',
    starterCode: `-- Corrige el cálculo semántico por segmento evitando fan-out y filtrando órdenes válidas
SELECT
  c.segment,
  COUNT(o.order_id) AS total_orders,
  COUNT(DISTINCT o.customer_id) AS distinct_buyers,
  ROUND(SUM(o.total_usd), 2) AS gross_revenue_usd,
  0.0 AS total_refunded_usd,
  ROUND(SUM(o.total_usd), 2) AS net_revenue_usd,
  0.0 AS net_arpu_usd
FROM orders o
INNER JOIN customers c ON o.customer_id = c.customer_id
GROUP BY c.segment
ORDER BY net_revenue_usd DESC;`,
    expected: `WITH valid_orders AS (
  SELECT
    order_id,
    customer_id,
    total_usd
  FROM orders
  WHERE status IN ('completed', 'refunded')
),
order_refunds AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS refunded_usd
  FROM refunds
  GROUP BY order_id
)
SELECT
  c.segment,
  COUNT(vo.order_id) AS total_orders,
  COUNT(DISTINCT vo.customer_id) AS distinct_buyers,
  ROUND(SUM(vo.total_usd), 2) AS gross_revenue_usd,
  ROUND(SUM(COALESCE(rf.refunded_usd, 0.0)), 2) AS total_refunded_usd,
  ROUND(SUM(vo.total_usd - COALESCE(rf.refunded_usd, 0.0)), 2) AS net_revenue_usd,
  ROUND(
    SUM(vo.total_usd - COALESCE(rf.refunded_usd, 0.0)) / NULLIF(COUNT(DISTINCT vo.customer_id), 0),
    2
  ) AS net_arpu_usd
FROM valid_orders vo
INNER JOIN customers c ON vo.customer_id = c.customer_id
LEFT JOIN order_refunds rf ON vo.order_id = rf.order_id
GROUP BY c.segment
ORDER BY net_revenue_usd DESC;`,
    solution: `WITH valid_orders AS (
  SELECT
    order_id,
    customer_id,
    total_usd
  FROM orders
  WHERE status IN ('completed', 'refunded')
),
order_refunds AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS refunded_usd
  FROM refunds
  GROUP BY order_id
)
SELECT
  c.segment,
  COUNT(vo.order_id) AS total_orders,
  COUNT(DISTINCT vo.customer_id) AS distinct_buyers,
  ROUND(SUM(vo.total_usd), 2) AS gross_revenue_usd,
  ROUND(SUM(COALESCE(rf.refunded_usd, 0.0)), 2) AS total_refunded_usd,
  ROUND(SUM(vo.total_usd - COALESCE(rf.refunded_usd, 0.0)), 2) AS net_revenue_usd,
  ROUND(
    SUM(vo.total_usd - COALESCE(rf.refunded_usd, 0.0)) / NULLIF(COUNT(DISTINCT vo.customer_id), 0),
    2
  ) AS net_arpu_usd
FROM valid_orders vo
INNER JOIN customers c ON vo.customer_id = c.customer_id
LEFT JOIN order_refunds rf ON vo.order_id = rf.order_id
GROUP BY c.segment
ORDER BY net_revenue_usd DESC;`,
    solutionExplanation:
      'Al filtrar primero `valid_orders` (`completed` y `refunded`) y preagregar `refunds` por `order_id` antes del `LEFT JOIN`, excluimos automáticamente los 145 reembolsos huérfanos de órdenes canceladas/pendientes y calculamos sin fan-out el ingreso neto y el ARPU neto exacto de cada segmento.',
    expectedOutputTable: [
      {
        segment: 'pro_barista',
        total_orders: 6835,
        distinct_buyers: 950,
        gross_revenue_usd: 2754749.75,
        total_refunded_usd: 120090.47,
        net_revenue_usd: 2634659.28,
        net_arpu_usd: 2773.33,
      },
      {
        segment: 'retail',
        total_orders: 6522,
        distinct_buyers: 943,
        gross_revenue_usd: 2668605.9,
        total_refunded_usd: 105962.6,
        net_revenue_usd: 2562643.3,
        net_arpu_usd: 2717.54,
      },
      {
        segment: 'cafeteria_b2b',
        total_orders: 2843,
        distinct_buyers: 447,
        gross_revenue_usd: 1451132.35,
        total_refunded_usd: 48481.45,
        net_revenue_usd: 1402650.9,
        net_arpu_usd: 3137.92,
      },
    ],
    hints: [
      'Crea `WITH valid_orders AS (SELECT order_id, customer_id, total_usd FROM orders WHERE status IN (\'completed\', \'refunded\'))` y `order_refunds AS (SELECT order_id, SUM(refund_amount_usd) AS refunded_usd FROM refunds GROUP BY order_id)`.',
      'Une `valid_orders vo INNER JOIN customers c ON vo.customer_id = c.customer_id LEFT JOIN order_refunds rf ON vo.order_id = rf.order_id`.',
      'Usa `COALESCE(rf.refunded_usd, 0.0)` para órdenes sin devoluciones y calcula `net_arpu_usd` dividiendo `SUM(vo.total_usd - COALESCE(rf.refunded_usd, 0.0))` entre `NULLIF(COUNT(DISTINCT vo.customer_id), 0)`.',
    ],
    orderMatters: true,
  },
  pipelineChallenge: {
    id: 'challenge-de3-t03-contracts',
    title: 'Flujo de gobernanza desde el contrato ODCS v3 hasta el consumo semántico',
    prompt:
      'Ordena los 5 pasos arquitectónicos para blindar un activo de datos con un contrato ejecutable y exponer sus métricas en la capa semántica.',
    steps: [
      {
        id: 'step-define-odcs',
        text: 'Declarar el contrato ODCS v3 especificando columnas, tipos físicos exactos, restricciones NOT NULL, reglas de dominio y SLA.',
      },
      {
        id: 'step-enforce-ddl',
        text: 'Compilar y validar el contrato en el motor de transformación (contract: enforced) bloqueando cambios destructivos de esquema.',
      },
      {
        id: 'step-quarantine-rows',
        text: 'Aislar en tablas de cuarentena los registros que violan las invariantes de negocio (como precios negativos o estados inválidos).',
      },
      {
        id: 'step-declare-semantic',
        text: 'Definir entidades, dimensiones y medidas aditivas o de razón en el modelo semántico (MetricFlow / Cube) sobre las tablas contratadas.',
      },
      {
        id: 'step-serve-consumers',
        text: 'Servir consultas multipaso (Drill-Across) consistentes hacia tableros de BI, hojas de cálculo y agentes analíticos.',
      },
    ],
    correctOrder: [
      'step-define-odcs',
      'step-enforce-ddl',
      'step-quarantine-rows',
      'step-declare-semantic',
      'step-serve-consumers',
    ],
    hint: 'Primero se acuerda el contrato ODCS v3, luego se impone en DDL, se ponen en cuarentena las filas inválidas, se modela la capa semántica y finalmente se sirve a los consumidores.',
    explanation:
      'La capa semántica solo puede garantizar cifras consistentes si descansa sobre tablas Gold cuyos tipos físicos, nulidad y dominios están protegidos previamente por contratos de datos ejecutables.',
  },
  roleNotes: {
    de: 'Como Ingeniero de Datos, activarás `contract: { enforced: true }` en todos los modelos `marts` públicos, gestionarás el versionado `v1`/`v2` ante cambios destructivos y mantendrás los flujos de cuarentena para filas fuera de contrato.',
    da: 'Como Analista de Datos, codificarás las fórmulas de ingresos netos, retención y ARPU directamente en el repositorio de la capa semántica en lugar de mantener definiciones aisladas dentro de cada libro de trabajo.',
    bi: 'Como especialista en BI, conectarás tus visualizaciones a las métricas certificadas del motor semántico, asegurando que cualquier corte por región, tienda o segmento respete el grano y aplique `Drill-Across` automáticamente.',
  },
  summary: [
    'Un contrato de datos ejecutable (ODCS v3 / dbt model contract) impone tipos físicos, restricciones `NOT NULL` y acuerdos de servicio antes de publicar.',
    'Los cambios destructivos de esquema exigen publicar una nueva versión del modelo (`v2`) con una ventana de migración para no romper consumidores.',
    'Las filas que violan invariantes de dominio (como el SKU negativo en `products`) deben aislarse en tablas de cuarentena.',
    'La capa semántica centraliza entidades, dimensiones y métricas, generando consultas `Drill-Across` que evitan el fan-out entre `orders` y `refunds`.',
  ],
  flashcards: [
    {
      id: 'fc-de3-t03-01',
      front: '¿En qué se diferencia `contract: { enforced: true }` de un test `not_null` convencional en dbt?',
      back: 'El contrato valida tipos de datos exactos, nombres de columna y restricciones `NOT NULL` en tiempo de compilación y DDL antes de publicar la tabla, mientras que el test convencional consulta la tabla después de creada.',
    },
    {
      id: 'fc-de3-t03-02',
      front: '¿Qué elementos estandariza la especificación Open Data Contract Standard (ODCS v3) de Bitol?',
      back: 'Estandariza en formato YAML declarativo el esquema físico, las reglas de calidad de datos, los niveles de servicio (SLA de frescura y disponibilidad) y la propiedad del activo.',
    },
    {
      id: 'fc-de3-t03-03',
      front: '¿Cuándo se considera que un cambio en un modelo contratado es destructivo (*breaking change*)?',
      back: 'Cuando se elimina o renombra una columna existente, se cambia su tipo de dato físico o se altera la semántica de su grano, obligando a emitir una nueva versión mayor (`v2`).',
    },
    {
      id: 'fc-de3-t03-04',
      front: '¿Por qué una métrica de razón como `net_arpu_usd` o `net_retention_pct` debe declararse en la capa semántica como cociente de agregaciones?',
      back: 'Porque los ratios no son aditivos: promediar porcentajes o tickets individuales sesga el resultado; siempre debe calcularse `SUM(numerador) / NULLIF(SUM_o_COUNT_DISTINCT(denominador), 0)` al nivel de agrupación consultado.',
    },
  ],
  glossaryTerms: [
    'contrato-datos-odcs',
    'capa-semantica-metricas',
  ],
  sources: [
    {
      title: 'dbt Labs — Model contracts',
      url: 'https://docs.getdbt.com/docs/collaborate/govern/model-contracts',
      publisher: 'dbt Labs',
      accessed: '2026-10-29',
      supports:
        'Imposición en compilación y DDL de nombres de columna, tipos de datos físicos, restricciones NOT NULL y versionado de modelos.',
    },
    {
      title: 'Bitol — Open Data Contract Standard (ODCS)',
      url: 'https://bitol-io.github.io/open-data-contract-standard/latest/',
      publisher: 'Bitol / Linux Foundation AI & Data',
      accessed: '2026-10-29',
      supports:
        'Estructura estándar ODCS v3.x (`apiVersion`, `kind: DataContract`, `schema`, `quality`, `slaProperties`) para contratos entre productores y consumidores.',
    },
    {
      title: 'dbt Labs — Semantic models & MetricFlow',
      url: 'https://docs.getdbt.com/docs/build/semantic-models',
      publisher: 'dbt Labs',
      accessed: '2026-10-29',
      supports:
        'Modelado de entidades, dimensiones, medidas y métricas de razón gobernadas con prevención automática de fan-out.',
    },
    {
      title: 'Cube Documentation — Data Modeling Overview',
      url: 'https://cube.dev/docs/product/data-modeling/overview',
      publisher: 'Cube Dev',
      accessed: '2026-10-29',
      supports:
        'Arquitectura de capa semántica independiente para servir definiciones de negocio consistentes hacia herramientas de BI y APIs.',
    },
  ],
  aiNotes:
    'En la práctica SQL, verifica que el estudiante filtre `orders` con `WHERE status IN (\'completed\', \'refunded\')` en la primera CTE y que haga `LEFT JOIN` hacia `order_refunds` preagregada por `order_id`. Si une `orders` y `refunds` con `INNER JOIN`, perderá todas las órdenes sin devoluciones y su conteo caerá drásticamente.',
};
export default lesson;
