const lesson = {
  id: 'c1-modelo-04-auditoria-calidad',
  moduleId: 'c1-modelo',
  tracks: ['core'],
  level: 1,
  order: 4,
  title: 'Auditoría SQL: duplicados, nulos y valores fuera de rango',
  minutes: 20,
  prerequisites: ['c1-modelo-03-integridad-huerfanos'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), el cierre financiero del trimestre arrojó 168 674.63 USD más en la tabla `payments` que en los extractos bancarios de Stripe y Conekta, mientras el equipo de logística reportó 347 envíos retenidos por códigos postales vacíos o incompletos en `customers`. Además, apareció en el catálogo un producto con precio `-9.99 USD`. ¿Cómo escribes una auditoría sistemática en SQL que detecte duplicados de red, nulos inesperados y valores fuera de dominio en una sola lectura?',

  objectives: [
    'Distinguir entre un reintento legítimo de negocio y un registro duplicado por reenvío de webhook usando claves de idempotencia.',
    'Perfilar completitud (nulos) y validez de formato en múltiples columnas con COUNT(*) FILTER (WHERE ...) en una sola pasada.',
    'Detectar valores numéricos fuera de rango o contradictorios en catálogos y transacciones antes de agregarlos.',
  ],

  sections: [
    {
      id: 'cuatro-dimensiones-de-auditoria-sql',
      heading: 'Las cuatro dimensiones operativas de una auditoría de calidad',
      body: 'Cuando auditas una tabla antes de usarla en un análisis o en un tablero, no basta con mirar diez filas con `LIMIT 10`. Una auditoría sistemática evalúa cuatro dimensiones medibles mediante consultas SQL:\n\n1. **Unicidad**: que ni la clave primaria ni la clave de idempotencia del evento tengan copias repetidas.\n\n2. **Completitud**: que las columnas requeridas por el proceso no contengan valores `NULL` ni cadenas vacías.\n\n3. **Validez de formato y dominio**: que los códigos cumplan la longitud o patrón esperado (`LENGTH(postal_code) = 5`) y los estados pertenezcan al conjunto permitido (`status IN (\'completed\', \'refunded\', \'cancelled\', \'pending\')`).\n\n4. **Validez de rango y consistencia interna**: que los precios y cantidades sean positivos (`list_price_usd > 0`, `qty > 0`) y que las columnas de una misma fila respeten la aritmética del negocio (`subtotal_usd - discount_usd + shipping_usd + tax_usd = total_usd`).',
    },
    {
      id: 'duplicados-webhook-frente-a-reintentos-legitimos',
      heading: 'Duplicados de red frente a reintentos reales en payments y events',
      body: 'Un error frecuente al auditar `payments` (19 200 filas para 18 000 pedidos) es agrupar por `order_id` y asumir que las 1 200 filas adicionales son duplicados. En un sistema de pagos real existen dos fenómenos muy distintos:\n\n- **Reintentos legítimos de cobro** (`750` filas en Mercado Brisa): el primer intento con tarjeta falla (`attempt_number = 1`, `status = \'failed\'`) y un minuto después el cliente vuelve a intentar el pago (`attempt_number = 2`, `status = \'captured\'`), generando una nueva clave `idempotency_key` (`idem-ord-10001-a2`).\n- **Duplicados técnicos de webhook** (`450` filas en Mercado Brisa): la pasarela de pagos envía el mismo mensaje dos veces con 4 segundos de diferencia porque la red tardó en confirmar recepción. Ambas filas tienen exactamente el mismo `idempotency_key` (`idem-ord-10751-a1`).\n\nPor eso la auditoría de duplicados técnicos en `payments` no se agrupa por `order_id`, sino por `idempotency_key`. Del mismo modo, en `events` (65 000 filas) existen 1 200 eventos duplicados que repiten el mismo `event_id`.',
      example: {
        language: 'sql',
        code: `WITH claves_duplicadas AS (
  SELECT
    idempotency_key,
    order_id,
    status,
    COUNT(*) AS veces_registrado,
    SUM(amount_usd) - MIN(amount_usd) AS importe_excedente_usd
  FROM payments
  GROUP BY idempotency_key, order_id, status
  HAVING COUNT(*) > 1
)
SELECT
  status,
  COUNT(*) AS claves_afectadas,
  SUM(veces_registrado - 1) AS filas_duplicadas,
  ROUND(SUM(importe_excedente_usd), 2) AS monto_inflado_usd
FROM claves_duplicadas
GROUP BY status
ORDER BY filas_duplicadas DESC;`,
        expectedOutput: [
          {
            status: 'captured',
            claves_afectadas: 405,
            filas_duplicadas: 405,
            monto_inflado_usd: 168674.63,
          },
          {
            status: 'failed',
            claves_afectadas: 27,
            filas_duplicadas: 27,
            monto_inflado_usd: 12168.63,
          },
          {
            status: 'pending',
            claves_afectadas: 18,
            filas_duplicadas: 18,
            monto_inflado_usd: 7720.58,
          },
        ],
      },
    },
    {
      id: 'perfilado-de-nulos-y-formato-con-filter',
      heading: 'Perfilar nulos y cadenas truncadas con COUNT(*) FILTER (WHERE ...)',
      body: 'Para auditar completitud y formato sin escanear la tabla una vez por cada regla, DuckDB y PostgreSQL ofrecen la cláusula estándar `COUNT(*) FILTER (WHERE condicion)`. Dentro de un único `SELECT`, cada métrica evalúa su propio predicado booleano.\n\nEn la tabla `customers` de Mercado Brisa (2 400 clientes), si solo revisas `WHERE postal_code IS NULL` encontrarás 218 registros sin código postal (~9.1 %). Pero si además inspeccionas la longitud de las cadenas no nulas con `LENGTH(postal_code) < 5`, detectarás otros 129 clientes cuyo código postal quedó truncado a solo 2 caracteres (`"06"`, `"11"`, `"28"`) durante la captura del formulario.\n\nEn total, 347 clientes (`218 + 129`, el 14.46 % del padrón) tienen una dirección postal incompleta para logística.',
    },
    {
      id: 'valores-fuera-de-rango-y-registros-de-prueba',
      heading: 'Valores fuera de rango: precios negativos y datos de calibración',
      body: 'La cuarta dimensión busca valores que son sintácticamente válidos para el tipo de dato (`DOUBLE` o `INTEGER`), pero imposibles en las reglas del negocio. El origen más frecuente en empresas de comercio electrónico son los **datos de prueba en producción**: ingenieros o técnicos de tiendas físicas crean un producto o pedido ficticio para calibrar las cajas registradoras (POS) y olvidan excluirlo de la exportación analítica.\n\nEn la tabla `products` de Mercado Brisa, el registro `product_id = 180` tiene `sku = \'SKU-TEST-NEG\'`, nombre `"Producto de prueba calibración POS (no vender)"`, `unit_cost_usd = 0.0` y un precio de lista negativo `list_price_usd = -9.99`. Una simple consulta de dominio `WHERE list_price_usd <= 0 OR unit_cost_usd < 0 OR list_price_usd < unit_cost_usd` lo aísla de inmediato antes de que distorsione el precio medio del catálogo.',
    },
  ],

  workedExample: {
    title: 'Perfilado de completitud en customers y detección de precios negativos en products',
    description:
      'Ejecuta en una sola consulta el perfilado de códigos postales nulos y truncados por país en customers, y localiza el producto fuera de rango en products.',
    steps: [
      {
        label: 'Paso 1: Auditar códigos postales nulos y truncados por país con FILTER',
        explanation:
          'Con `COUNT(*) FILTER (WHERE ...)` contamos por cada país los clientes con `postal_code IS NULL` (218 en total) y los que tienen menos de 5 caracteres (129 en total), obteniendo el porcentaje exacto de registros defectuosos.',
        code: `SELECT
  country_code,
  COUNT(*) AS total_clientes,
  COUNT(*) FILTER (WHERE postal_code IS NULL) AS cp_nulos,
  COUNT(*) FILTER (WHERE postal_code IS NOT NULL AND LENGTH(postal_code) < 5) AS cp_truncados,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE postal_code IS NULL OR LENGTH(postal_code) < 5) / COUNT(*),
    2
  ) AS pct_defectuoso
FROM customers
GROUP BY country_code
ORDER BY country_code ASC;`,
        expectedOutput: [
          {
            country_code: 'AR',
            total_clientes: 400,
            cp_nulos: 36,
            cp_truncados: 22,
            pct_defectuoso: 14.5,
          },
          {
            country_code: 'CL',
            total_clientes: 400,
            cp_nulos: 36,
            cp_truncados: 21,
            pct_defectuoso: 14.25,
          },
          {
            country_code: 'CO',
            total_clientes: 400,
            cp_nulos: 36,
            cp_truncados: 21,
            pct_defectuoso: 14.25,
          },
          {
            country_code: 'ES',
            total_clientes: 400,
            cp_nulos: 37,
            cp_truncados: 22,
            pct_defectuoso: 14.75,
          },
          {
            country_code: 'MX',
            total_clientes: 400,
            cp_nulos: 36,
            cp_truncados: 21,
            pct_defectuoso: 14.25,
          },
          {
            country_code: 'PE',
            total_clientes: 400,
            cp_nulos: 37,
            cp_truncados: 22,
            pct_defectuoso: 14.75,
          },
        ],
      },
      {
        label: 'Paso 2: Aislar productos que violan las reglas de dominio de precios y costos',
        explanation:
          'Buscamos en `products` cualquier fila con precio de lista menor o igual a cero, costo negativo o precio inferior al costo. El filtro localiza el SKU de calibración `SKU-TEST-NEG` (`-9.99 USD`) y confirma que tiene 0 líneas en `order_items`.',
        code: `SELECT
  p.product_id,
  p.sku,
  p.product_name,
  p.unit_cost_usd,
  p.list_price_usd,
  COUNT(oi.order_item_id) AS lineas_en_pedidos,
  ROUND(SUM(oi.line_total_usd), 2) AS total_lineas_usd
FROM products p
LEFT JOIN order_items oi ON p.product_id = oi.product_id
WHERE p.list_price_usd <= 0
   OR p.unit_cost_usd < 0
   OR p.list_price_usd < p.unit_cost_usd
GROUP BY p.product_id, p.sku, p.product_name, p.unit_cost_usd, p.list_price_usd;`,
        expectedOutput: [
          {
            product_id: 180,
            sku: 'SKU-TEST-NEG',
            product_name: 'Producto de prueba calibración POS (no vender)',
            unit_cost_usd: 0,
            list_price_usd: -9.99,
            lineas_en_pedidos: 0,
            total_lineas_usd: null,
          },
        ],
      },
    ],
  },

  checks: [
    {
      id: 'c1-modelo-04-chk1',
      type: 'mcq',
      prompt:
        'En la tabla `payments` de Mercado Brisa (19 200 filas para 18 000 pedidos), ¿por qué es un error eliminar duplicados quedándote solo con una fila por cada `order_id`?',
      options: [
        {
          id: 'a',
          text: 'Porque existen 750 pedidos con un primer intento `failed` (`attempt_number = 1`) seguido de un segundo intento `captured` (`attempt_number = 2`); deduplicar debe hacerse por `idempotency_key`.',
          correct: true,
          feedback:
            'Exacto. Agrupar por `order_id` sin mirar `idempotency_key` ni `status` confundiría los reintentos reales de pago con los 450 envíos duplicados de webhook.',
        },
        {
          id: 'b',
          text: 'Porque `order_id` contiene valores `NULL` en la mitad de las filas de `payments`.',
          correct: false,
          feedback:
            'Incorrecto. Todos los registros de `payments` tienen `order_id` no nulo; la diferencia está entre reintentos de cobro y duplicados de webhook.',
        },
        {
          id: 'c',
          text: 'Porque SQL no permite agrupar por una columna que sea clave foránea.',
          correct: false,
          feedback:
            'Incorrecto. SQL permite agrupar por cualquier columna; el problema es semántico y de grano del evento de pago.',
        },
      ],
      explanation:
        'En una tabla de intentos de pago, un pedido puede tener varios intentos legítimos (`attempt_number` 1 y 2). Los duplicados de red se identifican porque repiten la misma `idempotency_key`.',
    },
    {
      id: 'c1-modelo-04-chk2',
      type: 'predict-output',
      prompt:
        'En `customers` (2 400 filas), 218 filas tienen `postal_code IS NULL` y 129 filas tienen un código postal truncado de 2 caracteres (el resto tiene 5 caracteres). ¿Qué devuelve `SELECT COUNT(postal_code) FROM customers;`?',
      options: [
        {
          id: 'a',
          text: '2 182, porque `COUNT(columna)` ignora únicamente los 218 valores `NULL`, pero sí cuenta las 129 cadenas truncadas de 2 caracteres.',
          correct: true,
          feedback:
            'Correcto. `2 400 - 218 = 2 182`. `COUNT(postal_code)` solo excluye `NULL`; no valida que el texto tenga los 5 caracteres requeridos.',
        },
        {
          id: 'b',
          text: '2 053, porque `COUNT(postal_code)` descarta automáticamente tanto los nulos como los códigos postales incompletos.',
          correct: false,
          feedback:
            'Incorrecto. Para excluir también los truncados necesitas `COUNT(*) FILTER (WHERE LENGTH(postal_code) >= 5)`.',
        },
        {
          id: 'c',
          text: '2 400, porque `COUNT(columna)` cuenta todas las filas igual que `COUNT(*)`.',
          correct: false,
          feedback:
            'Incorrecto. `COUNT(*)` devuelve 2 400, pero `COUNT(postal_code)` omite las 218 filas donde `postal_code IS NULL`.',
        },
      ],
      explanation:
        'La función `COUNT(columna)` mide ausencia de `NULL`, pero no mide validez de formato. Para detectar las 129 cadenas de 2 caracteres debes comprobar explícitamente `LENGTH(postal_code) < 5`.',
    },
    {
      id: 'c1-modelo-04-chk3',
      type: 'fill-code',
      prompt:
        'Completa la consulta para encontrar todas las claves `idempotency_key` que aparecen más de una vez en `payments`:',
      template: `SELECT
  idempotency_key,
  COUNT(*) AS repeticiones
FROM payments
GROUP BY idempotency_key
{{b1}} COUNT(*) > {{b2}};`,
      blanks: [
        { id: 'b1', accepted: ['HAVING', 'having'] },
        { id: 'b2', accepted: ['1'] },
      ],
      explanation:
        'Para filtrar grupos después de aplicar `GROUP BY idempotency_key`, se utiliza la cláusula `HAVING COUNT(*) > 1`, ya que `WHERE` filtra filas individuales antes de agrupar y no admite funciones de agregación.',
    },
  ],

  practice: {
    type: 'sql',
    title: 'Reporte consolidado de las 4 anomalías de calidad en Mercado Brisa',
    language: 'sql',
    prompt:
      'Construye una consulta con cuatro bloques `UNION ALL` que resuma las anomalías sembradas en Mercado Brisa con las columnas `regla`, `tabla_auditada` y `filas_afectadas`: 1) `\'1_webhooks_duplicados\'` sobre `\'payments\'` (`COUNT(*) - COUNT(DISTINCT idempotency_key)`), 2) `\'2_eventos_duplicados\'` sobre `\'events\'` (`COUNT(*) - COUNT(DISTINCT event_id)`), 3) `\'3_codigos_postales_incompletos\'` sobre `\'customers\'` (`COUNT(*) FILTER (WHERE postal_code IS NULL OR LENGTH(postal_code) < 5)`), y 4) `\'4_productos_precio_negativo\'` sobre `\'products\'` (`COUNT(*) FILTER (WHERE list_price_usd <= 0)`). Ordena por `regla ASC`.',
    starterCode: `SELECT
  '1_webhooks_duplicados' AS regla,
  'payments' AS tabla_auditada,
  COUNT(*) - COUNT(DISTINCT idempotency_key) AS filas_afectadas
FROM payments
UNION ALL
SELECT
  '2_eventos_duplicados' AS regla,
  'events' AS tabla_auditada,
  COUNT(*) - COUNT(DISTINCT event_id) AS filas_afectadas
FROM events
UNION ALL
SELECT
  '3_codigos_postales_incompletos' AS regla,
  'customers' AS tabla_auditada,
  COUNT(*) FILTER (WHERE postal_code IS NULL OR LENGTH(postal_code) < 5) AS filas_afectadas
FROM customers
UNION ALL
SELECT
  '4_productos_precio_negativo' AS regla,
  'products' AS tabla_auditada,
  -- Reemplaza el 0 por el conteo con FILTER de productos donde list_price_usd <= 0
  0 AS filas_afectadas
FROM products
ORDER BY regla ASC;`,
    expected: `SELECT
  '1_webhooks_duplicados' AS regla,
  'payments' AS tabla_auditada,
  COUNT(*) - COUNT(DISTINCT idempotency_key) AS filas_afectadas
FROM payments
UNION ALL
SELECT
  '2_eventos_duplicados' AS regla,
  'events' AS tabla_auditada,
  COUNT(*) - COUNT(DISTINCT event_id) AS filas_afectadas
FROM events
UNION ALL
SELECT
  '3_codigos_postales_incompletos' AS regla,
  'customers' AS tabla_auditada,
  COUNT(*) FILTER (WHERE postal_code IS NULL OR LENGTH(postal_code) < 5) AS filas_afectadas
FROM customers
UNION ALL
SELECT
  '4_productos_precio_negativo' AS regla,
  'products' AS tabla_auditada,
  COUNT(*) FILTER (WHERE list_price_usd <= 0) AS filas_afectadas
FROM products
ORDER BY regla ASC;`,
    orderMatters: true,
    hints: [
      'En el cuarto bloque (`products`), reemplaza `0 AS filas_afectadas` por `COUNT(*) FILTER (WHERE list_price_usd <= 0) AS filas_afectadas`.',
      'También puedes escribir `SUM(CASE WHEN list_price_usd <= 0 THEN 1 ELSE 0 END) AS filas_afectadas`.',
      'Verifica que los cuatro bloques estén unidos con `UNION ALL` y terminen con `ORDER BY regla ASC`.',
    ],
    solution: `SELECT
  '1_webhooks_duplicados' AS regla,
  'payments' AS tabla_auditada,
  COUNT(*) - COUNT(DISTINCT idempotency_key) AS filas_afectadas
FROM payments
UNION ALL
SELECT
  '2_eventos_duplicados' AS regla,
  'events' AS tabla_auditada,
  COUNT(*) - COUNT(DISTINCT event_id) AS filas_afectadas
FROM events
UNION ALL
SELECT
  '3_codigos_postales_incompletos' AS regla,
  'customers' AS tabla_auditada,
  COUNT(*) FILTER (WHERE postal_code IS NULL OR LENGTH(postal_code) < 5) AS filas_afectadas
FROM customers
UNION ALL
SELECT
  '4_productos_precio_negativo' AS regla,
  'products' AS tabla_auditada,
  COUNT(*) FILTER (WHERE list_price_usd <= 0) AS filas_afectadas
FROM products
ORDER BY regla ASC;`,
    solutionExplanation:
      'La consulta consolida en una sola tabla el diagnóstico de las cuatro anomalías del dataset: 450 cobros duplicados por reenvío de webhook en `payments`, 1 200 eventos duplicados en `events`, 347 códigos postales nulos o truncados en `customers` y 1 producto de calibración con precio negativo (`-9.99 USD`) en `products`.',
    expectedOutputTable: [
      {
        regla: '1_webhooks_duplicados',
        tabla_auditada: 'payments',
        filas_afectadas: 450,
      },
      {
        regla: '2_eventos_duplicados',
        tabla_auditada: 'events',
        filas_afectadas: 1200,
      },
      {
        regla: '3_codigos_postales_incompletos',
        tabla_auditada: 'customers',
        filas_afectadas: 347,
      },
      {
        regla: '4_productos_precio_negativo',
        tabla_auditada: 'products',
        filas_afectadas: 1,
      },
    ],
  },

  roleNotes: {
    de: 'Deduplica siempre los flujos de webhooks y eventos en el paso de Bronze a Silver usando `idempotency_key` o `event_id` antes de exponer la tabla a los analistas. Registra el conteo de filas descartadas como métrica de observabilidad del pipeline.',
    da: 'Antes de calcular promedios o regresiones sobre un dataset nuevo, ejecuta un perfilado de rangos (`MIN`, `MAX`, `COUNT(*) FILTER (WHERE col <= 0)`). Un solo producto de prueba como `SKU-TEST-NEG` sesga las estadísticas descriptivas.',
    bi: 'Crea una página oculta o vista de control de calidad en tu modelo de BI que muestre los conteos de anomalías no bloqueantes (como los 347 clientes sin código postal completo) para que el equipo operativo los corrija en el CRM.',
  },

  summary: [
    'Una auditoría SQL revisa cuatro dimensiones: unicidad, completitud, validez de formato y validez de rango.',
    'En tablas de pagos, distingue reintentos reales (`attempt_number = 2`) de duplicados de webhook (`idempotency_key` repetida).',
    'Usa `COUNT(*) FILTER (WHERE ...)` para perfilar nulos, longitudes inválidas y valores fuera de rango en una sola lectura.',
    'Verifica siempre los límites `MIN` y `MAX` para detectar SKUs o registros de prueba con precios negativos.',
  ],

  flashcards: [
    {
      id: 'fc-c1-modelo-04-a',
      front: '¿Cuáles son las cuatro dimensiones operativas que debe cubrir una auditoría de calidad en SQL?',
      back: 'Unicidad (sin duplicados), completitud (sin nulos inesperados), validez de formato/dominio y validez de rango/consistencia aritmética.',
    },
    {
      id: 'fc-c1-modelo-04-b',
      front: '¿Cómo distingues en `payments` un reintento legítimo de cobro de un duplicado técnico de webhook?',
      back: 'El reintento legítimo incrementa `attempt_number` y genera una nueva `idempotency_key`; el duplicado de webhook repite exactamente la misma `idempotency_key`.',
    },
    {
      id: 'fc-c1-modelo-04-c',
      front: '¿Qué ventaja tiene usar `COUNT(*) FILTER (WHERE condicion)` para perfilar calidad en DuckDB o PostgreSQL?',
      back: 'Permite evaluar decenas de reglas de nulos, longitudes y rangos en una sola lectura secuencial de la tabla sin subconsultas.',
    },
  ],

  glossaryTerms: ['idempotencia-duplicados', 'clave-primaria-subrogada'],

  sources: [
    {
      title: 'DuckDB Documentation — FILTER Clause in Aggregate Functions',
      url: 'https://duckdb.org/docs/sql/query_syntax/filter.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports:
        'Sintaxis y evaluación de agregaciones condicionales con FILTER (WHERE ...) para perfilado de datos en una pasada.',
    },
    {
      title: 'PostgreSQL 17 Documentation — Section 9.18: Conditional Expressions (CASE, COALESCE, NULLIF)',
      url: 'https://www.postgresql.org/docs/current/functions-conditional.html',
      publisher: 'PostgreSQL Global Development Group',
      accessed: '2026-10-29',
      supports:
        'Clasificación condicional de registros defectuosos y manejo seguro de valores nulos en SQL.',
    },
    {
      title: 'dbt Labs Documentation — Generic Data Tests (unique, not_null, accepted_values)',
      url: 'https://docs.getdbt.com/docs/build/data-tests',
      publisher: 'dbt Labs',
      accessed: '2026-10-29',
      supports:
        'Estandarización de pruebas de unicidad, no nulidad y valores aceptados sobre tablas analíticas.',
    },
  ],

  aiNotes:
    'Vigila que la persona no use `COUNT(postal_code)` creyendo que detecta códigos truncados de 2 caracteres (solo ignora `NULL`), y que en `payments` no agrupe por `order_id` para contar duplicados de red, sino por `idempotency_key`.',
};

export default lesson;
