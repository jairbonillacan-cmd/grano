export const lesson = {
  id: 'de3-lakehouse-01-iceberg-v3-medallion',
  moduleId: 'de3-lakehouse',
  tracks: ['de'],
  level: 3,
  order: 1,
  legacyId: 'l10-iceberg-v3-medallion',
  legacyOrder: 10,
  title: 'Apache Iceberg v3 y arquitectura Medallion',
  subtitle: 'Apache Iceberg v3, vectores de borrado y la arquitectura Medallion',
  minutes: 30,
  contentVersion: 2,
  needsReview: false,
  prerequisites: ['de2-pipelines-06-contenedores-docker-compose'],
  hook: 'En Mercado Brisa llegan cada día miles de órdenes desde seis países, pero 1.440 pedidos terminan reembolsados y 1.080 cancelados después del cierre contable. Si tus tablas analíticas residen en archivos Parquet inmutables sobre almacenamiento en la nube, reescribir bloques de varios gigabytes por cada devolución multiplica el gasto de cómputo y bloquea a los lectores concurrentes. ¿Cómo logra Apache Iceberg v3 aplicar borrados en milisegundos, evolucionar particiones sin reescribir archivos históricos y auditar cambios entre las capas Bronce, Plata y Oro?',
  objectives: [
    'Distinguir las responsabilidades del árbol de metadatos en Apache Iceberg (catálogo, metadata.json, manifest list y manifest files) para garantizar aislamiento de instantáneas.',
    'Evaluar el impacto de los Deletion Vectors en archivos Puffin, el linaje por fila (_row_id) y el particionado oculto de la especificación Iceberg v3 frente a la reescritura de Parquet.',
    'Implementar consultas de reconciliación Medallion (Bronce, Plata y Oro) y auditorías Write-Audit-Publish (WAP) sobre las tablas transaccionales de Mercado Brisa.'
  ],
  sections: [
    {
      id: 'arbol-metadatos-iceberg',
      heading: 'Árbol de metadatos en Apache Iceberg: del catálogo al Parquet',
      body: 'Un lago de datos clásico que agrupa archivos Parquet en directorios carece de atomicidad. Si un proceso falla a mitad de escritura, las consultas leen archivos incompletos. **Apache Iceberg** resuelve este problema separando la ubicación física de los archivos de su estado lógico mediante un árbol jerárquico de cuatro niveles.\n\nEn la cima, el **catálogo** mantiene un puntero atómico hacia el archivo `metadata.json` activo. Este documento define el esquema por identificador numérico (`field-id`), las especificaciones de partición y el historial de instantáneas (`snapshots`). Cada instantánea apunta a una **manifest list** en formato Avro que resume los rangos de partición. A su vez, esa lista referencia múltiples *manifest files* donde se guardan las rutas de cada archivo Parquet junto con sus límites `lower_bound` y `upper_bound` por columna.\n\nEn **Mercado Brisa**, mientras la capa **Bronce** conserva las 18.000 órdenes crudas tal como llegan, la promoción hacia Plata y **Oro** ocurre publicando una nueva instantánea atómica en el catálogo sin bloquear a los lectores concurrentes.',
      interactive: {
        component: 'medallion-flow',
        caption: 'Flujo transaccional Medallion (Bronce, Plata y Oro) gobernado por instantáneas de Apache Iceberg v3.'
      },
      example: {
        language: 'sql',
        code: `SELECT
  status,
  COUNT(*) AS order_count,
  ROUND(SUM(total_usd), 2) AS gross_usd
FROM orders
GROUP BY status
ORDER BY order_count DESC;`,
        expectedOutput: [
          { status: 'completed', order_count: 14760, gross_usd: 6269462.42 },
          { status: 'refunded', order_count: 1440, gross_usd: 605025.58 },
          { status: 'cancelled', order_count: 1080, gross_usd: 489003.49 },
          { status: 'pending', order_count: 720, gross_usd: 306326.28 }
        ]
      }
    },
    {
      id: 'iceberg-v3-deletion-vectors-puffin',
      heading: 'Novedades de Iceberg v3: Deletion Vectors en Puffin y linaje',
      body: 'Actualizar o borrar registros sobre Parquet exige elegir entre dos estrategias. Con **Copy-on-Write (CoW)**, borrar una sola orden obliga a reescribir el archivo Parquet entero. Con **Merge-on-Read (MoR)**, el archivo original permanece intacto y las bajas se registran aparte para reconciliarse al leer.\n\nEn la versión 2 de Iceberg, múltiples borrados generaban decenas de archivos de borrado posicional que degradaban la lectura. La especificación **Apache Iceberg v3** introduce **Deletion Vectors (DVs)**: mapas de bits comprimidos (*Roaring bitmaps* de 64 bits) almacenados en archivos laterales Puffin. La regla v3 garantiza a lo sumo un vector de borrado activo por archivo de datos. Si ocurre otro `DELETE`, el motor fusiona el bitmap anterior con las nuevas posiciones.\n\nAdemás, Iceberg v3 incorpora **linaje por fila** mediante las columnas internas `_row_id` y `_last_updated_sequence_number`. También añade el tipo semiestructurado `variant`, precisión `timestamp_ns` y valores por defecto (`initial-default`, `write-default`) que permiten añadir columnas sin tocar archivos históricos.',
      example: {
        language: 'sql',
        code: `SELECT
  COUNT(*) AS bronze_total_orders,
  COUNT(*) FILTER (WHERE status IN ('refunded', 'cancelled')) AS dv_marked_rows,
  COUNT(*) FILTER (WHERE status = 'completed') AS silver_valid_orders,
  ROUND(SUM(total_usd) FILTER (WHERE status = 'completed'), 2) AS silver_net_usd
FROM orders;`,
        expectedOutput: [
          {
            bronze_total_orders: 18000,
            dv_marked_rows: 2520,
            silver_valid_orders: 14760,
            silver_net_usd: 6269462.42
          }
        ]
      }
    },
    {
      id: 'particionado-oculto-evolucion-layout',
      heading: 'Particionado oculto y evolución de layout sin reescritura física',
      body: 'En las tablas Hive tradicionales, particionar por mes obligaba a crear una columna física `order_month` y exigía que cada analista recordara incluirla en el `WHERE`. Si un usuario filtraba solo por `order_ts`, el motor escaneaba toda la tabla.\n\n**Apache Iceberg** implementa **particionado oculto (*hidden partitioning*)**: el archivo `metadata.json` guarda la transformación matemática aplicada a la columna original, como `month(order_ts)`, `day(order_ts)`, `bucket(16, customer_id)` o `truncate(2, country_code)`. Cuando el analista escribe `WHERE order_ts >= TIMESTAMP \'2025-01-01\'`, Iceberg calcula internamente qué particiones mensuales corresponden y poda los manifiestos irrelevantes.\n\nSi el volumen de **Mercado Brisa** crece y el equipo decide cambiar el particionado de mensual a diario, Iceberg registra un nuevo `partition-spec` en los metadatos (*split planning*). Los archivos Parquet de 2023 y 2024 conservan el `spec-id` mensual, mientras los datos nuevos se escriben con el `spec-id` diario sin migrar terabytes de almacenamiento.',
      example: {
        language: 'sql',
        code: `SELECT
  EXTRACT(YEAR FROM order_ts) AS order_year,
  COUNT(*) AS completed_orders,
  COUNT(DISTINCT DATE_TRUNC('month', order_ts)) AS hidden_month_partitions,
  ROUND(SUM(total_usd), 2) AS net_revenue_usd
FROM orders
WHERE status = 'completed'
GROUP BY EXTRACT(YEAR FROM order_ts)
ORDER BY order_year;`,
        expectedOutput: [
          { order_year: 2023, completed_orders: 1981, hidden_month_partitions: 12, net_revenue_usd: 851117.35 },
          { order_year: 2024, completed_orders: 6497, hidden_month_partitions: 12, net_revenue_usd: 2731516.5 },
          { order_year: 2025, completed_orders: 6282, hidden_month_partitions: 11, net_revenue_usd: 2686828.57 }
        ]
      }
    },
    {
      id: 'arquitectura-medallion-patron-wap',
      heading: 'Arquitectura Medallion y patrón Write-Audit-Publish (WAP)',
      body: 'La **arquitectura Medallion** organiza el Lakehouse en tres niveles de calidad: **Bronce** almacena la ingesta cruda e inmutable; **Plata** aplica deduplicación, vectores de borrado y tipado estricto; y Oro entrega agregaciones de negocio listas para BI. Sin embargo, publicar directamente en Plata u Oro expone a los usuarios al riesgo de leer lotes con anomalías silenciosas.\n\nGracias al soporte de ramas (*branches*) y etiquetas (*tags*) en el árbol de instantáneas de Iceberg, implementamos el patrón **Write-Audit-Publish (WAP)**. Primero, en la etapa **Write**, el pipeline escribe los nuevos registros sobre una rama aislada llamada `audit_branch` sin mover el puntero `main`. Segundo, en la etapa **Audit**, se ejecutan pruebas SQL automáticas contra `audit_branch` para verificar invariantes de negocio. Finalmente, si la auditoría aprueba, el catálogo ejecuta un *fast-forward* del puntero `main` hacia la instantánea validada.\n\nAl auditar el catálogo de productos de **Mercado Brisa**, una validación WAP detecta un SKU inactivo con precio negativo (`list_price_usd < 0`), bloqueando su paso a producción.',
      example: {
        language: 'sql',
        code: `SELECT
  p.is_active,
  CASE WHEN p.list_price_usd <= 0 THEN 'NEGATIVE_PRICE' ELSE 'VALID_PRICE' END AS price_audit,
  COUNT(DISTINCT p.product_id) AS sku_count,
  COUNT(oi.order_item_id) AS line_items_count,
  ROUND(COALESCE(SUM(oi.line_total_usd), 0), 2) AS line_total_usd
FROM products p
LEFT JOIN order_items oi ON p.product_id = oi.product_id
GROUP BY p.is_active, price_audit
ORDER BY sku_count DESC;`,
        expectedOutput: [
          { is_active: true, price_audit: 'VALID_PRICE', sku_count: 170, line_items_count: 39894, line_total_usd: 6338369.18 },
          { is_active: false, price_audit: 'VALID_PRICE', sku_count: 9, line_items_count: 2106, line_total_usd: 344095.13 },
          { is_active: false, price_audit: 'NEGATIVE_PRICE', sku_count: 1, line_items_count: 0, line_total_usd: 0 }
        ]
      }
    }
  ],
  workedExample: {
    title: 'Auditoría de impacto de Deletion Vectors por región en Mercado Brisa',
    description: 'El equipo de finanzas de Mercado Brisa nota una discrepancia entre las ventas brutas registradas en la capa Bronce y el ingreso neto liquidado en la capa Plata.',
    audit: 'En las cuatro regiones, exactamente 2.520 pedidos (14% del volumen bruto) corresponden a reembolsos o cancelaciones marcados mediante Deletion Vectors, dejando 14.760 órdenes completadas por 6.269.462,42 USD.',
    steps: [
      {
        label: 'Paso 1 — Cruzar tiendas y órdenes separando vectores de borrado y ventas netas',
        explanation: 'Agrupamos por la región de la tienda y usamos cláusulas FILTER para aislar en una sola pasada las órdenes marcadas en archivos Puffin (refunded y cancelled) frente a las órdenes vigentes (completed).',
        code: `SELECT
  s.region,
  COUNT(*) AS bronze_orders,
  COUNT(*) FILTER (WHERE o.status IN ('refunded', 'cancelled')) AS dv_deleted_orders,
  COUNT(*) FILTER (WHERE o.status = 'completed') AS silver_completed_orders,
  ROUND(SUM(o.total_usd) FILTER (WHERE o.status = 'completed'), 2) AS gold_net_revenue_usd
FROM stores s
JOIN orders o ON s.store_id = o.store_id
GROUP BY s.region
ORDER BY gold_net_revenue_usd DESC;`,
        expectedOutput: [
          { region: 'Cono Sur', bronze_orders: 6001, dv_deleted_orders: 840, silver_completed_orders: 4920, gold_net_revenue_usd: 2059786.39 },
          { region: 'Andina', bronze_orders: 6000, dv_deleted_orders: 840, silver_completed_orders: 4921, gold_net_revenue_usd: 1990554.12 },
          { region: 'Iberia', bronze_orders: 3428, dv_deleted_orders: 480, silver_completed_orders: 2811, gold_net_revenue_usd: 1348369.68 },
          { region: 'Norteamérica', bronze_orders: 2571, dv_deleted_orders: 360, silver_completed_orders: 2108, gold_net_revenue_usd: 870752.23 }
        ]
      },
      {
        label: 'Paso 2 — Evaluar la proporción de registros filtrados por Deletion Vectors',
        explanation: 'En las cuatro regiones de Mercado Brisa, el 14% de los pedidos brutos (2.520 de 18.000) corresponden a reembolsos o cancelaciones. Mantenerlos en un único Deletion Vector por archivo Parquet evita reescribir los bloques donde residen las 14.760 órdenes completadas.'
      },
      {
        label: 'Paso 3 — Publicar la instantánea auditada hacia la capa Oro',
        explanation: 'Una vez verificado que la suma regional de gold_net_revenue_usd cuadra con los 6.269.462,42 USD de la capa Plata, el catálogo promueve la rama de auditoría hacia main mediante un cambio atómico de puntero.'
      }
    ]
  },
  checks: [
    {
      id: 'chk-1',
      type: 'mcq',
      prompt: '¿Qué ventaja técnica aportan los Deletion Vectors (DVs) en archivos Puffin de Apache Iceberg v3 frente a los archivos de borrado posicional de Iceberg v2?',
      options: [
        {
          id: 'a',
          text: 'Reescriben de inmediato el archivo Parquet original en cada operación DELETE para evitar lecturas combinadas.',
          correct: false,
          feedback: 'Incorrecto. Eso describe la estrategia Copy-on-Write (CoW), no los Deletion Vectors bajo Merge-on-Read.'
        },
        {
          id: 'b',
          text: 'Consolidan las posiciones borradas en a lo sumo un bitmap Roaring64 activo por archivo Parquet, evitando reconciliar decenas de archivos de borrado al leer.',
          correct: true,
          feedback: 'Correcto. Iceberg v3 garantiza como máximo un Deletion Vector activo por archivo de datos al fusionar el bitmap previo con las nuevas bajas.'
        },
        {
          id: 'c',
          text: 'Eliminan la necesidad de mantener el archivo metadata.json y delegan el control de transacciones al sistema de archivos.',
          correct: false,
          feedback: 'Incorrecto. El archivo metadata.json y el catálogo siguen siendo indispensables para la atomicidad en Iceberg v3.'
        },
        {
          id: 'd',
          text: 'Convierten todos los archivos Parquet al formato Avro para permitir actualizaciones en sitio.',
          correct: false,
          feedback: 'Incorrecto. Los datos permanecen en archivos columnares inmutables como Parquet; solo el bitmap se guarda en el archivo Puffin.'
        }
      ],
      explanation: 'En Iceberg v3, los Deletion Vectors almacenan un bitmap Roaring64 en un archivo Puffin y aseguran que exista como máximo un vector activo por archivo Parquet, reduciendo la amplificación de lectura en cargas Merge-on-Read.'
    },
    {
      id: 'chk-2',
      type: 'mcq',
      prompt: 'Una tabla Iceberg está particionada mediante `month(order_ts)`. ¿Cómo debe escribir su consulta un analista para aprovechar la poda de particiones?',
      options: [
        {
          id: 'a',
          text: 'Debe crear una columna física adicional llamada `order_month` e incluirla obligatoriamente en el filtro WHERE.',
          correct: false,
          feedback: 'Incorrecto. Crear columnas derivadas físicas es un requisito heredado de Hive que el particionado oculto de Iceberg elimina.'
        },
        {
          id: 'b',
          text: 'Debe filtrar directamente sobre la columna base `order_ts` (por ejemplo, `WHERE order_ts >= TIMESTAMP \'2025-01-01\'`), dejando que Iceberg aplique la relación con la partición.',
          correct: true,
          feedback: 'Correcto. El particionado oculto traduce los predicados sobre la columna base hacia los rangos del partition-spec.'
        },
        {
          id: 'c',
          text: 'Debe transformar la columna a texto con `WHERE SUBSTR(CAST(order_ts AS VARCHAR), 1, 7) = \'2025-01\'`.',
          correct: false,
          feedback: 'Incorrecto. Envolver la columna en funciones de cadena opacas impide que el planificador derive el rango del partition-spec.'
        },
        {
          id: 'd',
          text: 'Debe especificar manualmente la ruta del archivo manifest list en la cláusula FROM.',
          correct: false,
          feedback: 'Incorrecto. El motor resuelve la instantánea y los manifiestos a través del catálogo sin exponer rutas internas en el SQL.'
        }
      ],
      explanation: 'El particionado oculto almacena la transformación en el partition-spec de metadata.json, por lo que filtrar directamente por la columna base order_ts permite podar manifiestos sin columnas auxiliares.'
    },
    {
      id: 'chk-3',
      type: 'mcq',
      prompt: 'En el patrón Write-Audit-Publish (WAP) sobre Apache Iceberg, ¿qué ocurre si la consulta de auditoría detecta un SKU con `list_price_usd < 0` en la rama `audit_branch`?',
      options: [
        {
          id: 'a',
          text: 'Los consumidores de la rama `main` leen el precio negativo hasta que se ejecute un DELETE manual.',
          correct: false,
          feedback: 'Incorrecto. Los lectores de main están aislados de los commits realizados en audit_branch.'
        },
        {
          id: 'b',
          text: 'El pipeline aborta la promoción (fast-forward) hacia `main`, dejando intacta la instantánea de producción para todos los usuarios.',
          correct: true,
          feedback: 'Correcto. Al fallar la validación en la rama aislada, el puntero main nunca avanza hacia la instantánea defectuosa.'
        },
        {
          id: 'c',
          text: 'Iceberg borra automáticamente todas las instantáneas históricas de la tabla para liberar espacio.',
          correct: false,
          feedback: 'Incorrecto. Las instantáneas previas se conservan hasta que se ejecute una expiración controlada (expire_snapshots).'
        },
        {
          id: 'd',
          text: 'El catálogo bloquea las lecturas sobre la rama `main` hasta que el archivo Parquet sea reparado.',
          correct: false,
          feedback: 'Incorrecto. Las lecturas sobre main continúan sin bloqueo leyendo la última instantánea válida.'
        }
      ],
      explanation: 'El patrón WAP aísla la escritura en una rama secundaria; si las reglas de calidad fallan, no se realiza el fast-forward hacia main y producción nunca ve los datos corruptos.'
    }
  ],
  practice: {
    type: 'sql',
    title: 'Reconciliación Medallion por región sin fan-out en Mercado Brisa',
    language: 'sql',
    prompt: 'Construye la consulta de reconciliación Medallion por región (`region`) uniendo `stores`, `orders` y `order_items` (agregado previamente por `order_id` para evitar fan-out). Devuelve `region`, el conteo total de órdenes en Bronce (`bronze_orders`), las órdenes completadas en Plata (`silver_completed_orders`), el ingreso bruto en Bronce (`bronze_gross_usd`), el ingreso neto de órdenes completadas en Plata (`silver_net_usd`) y el total de unidades vendidas en órdenes completadas (`gold_completed_units`), todo redondeado a 2 decimales donde aplique y ordenado por `silver_net_usd DESC`.',
    starterCode: `-- Reconciliación Medallion (Bronce -> Plata -> Oro) por región
-- Corrige las métricas silver_completed_orders, silver_net_usd y gold_completed_units aplicando el filtro de órdenes completadas.
WITH items_by_order AS (
  SELECT
    order_id,
    SUM(qty) AS order_units
  FROM order_items
  GROUP BY order_id
)
SELECT
  s.region,
  COUNT(*) AS bronze_orders,
  COUNT(*) AS silver_completed_orders,
  ROUND(SUM(o.total_usd), 2) AS bronze_gross_usd,
  ROUND(SUM(o.total_usd), 2) AS silver_net_usd,
  SUM(ibo.order_units) AS gold_completed_units
FROM stores s
JOIN orders o ON s.store_id = o.store_id
LEFT JOIN items_by_order ibo ON o.order_id = ibo.order_id
GROUP BY s.region
ORDER BY silver_net_usd DESC;`,
    expected: `WITH items_by_order AS (
  SELECT
    order_id,
    SUM(qty) AS order_units
  FROM order_items
  GROUP BY order_id
)
SELECT
  s.region,
  COUNT(*) AS bronze_orders,
  COUNT(*) FILTER (WHERE o.status = 'completed') AS silver_completed_orders,
  ROUND(SUM(o.total_usd), 2) AS bronze_gross_usd,
  ROUND(SUM(o.total_usd) FILTER (WHERE o.status = 'completed'), 2) AS silver_net_usd,
  SUM(ibo.order_units) FILTER (WHERE o.status = 'completed') AS gold_completed_units
FROM stores s
JOIN orders o ON s.store_id = o.store_id
LEFT JOIN items_by_order ibo ON o.order_id = ibo.order_id
GROUP BY s.region
ORDER BY silver_net_usd DESC;`,
    orderMatters: true,
    hints: [
      'Preagrega order_items por order_id usando SUM(qty) en la CTE items_by_order para que cada fila de orders conserve su granularidad al sumar total_usd.',
      'Usa COUNT(*) FILTER (WHERE o.status = \'completed\') para calcular silver_completed_orders.',
      'Aplica ROUND(SUM(o.total_usd) FILTER (WHERE o.status = \'completed\'), 2) para silver_net_usd y SUM(ibo.order_units) FILTER (WHERE o.status = \'completed\') para gold_completed_units.'
    ],
    solution: `WITH items_by_order AS (
  SELECT
    order_id,
    SUM(qty) AS order_units
  FROM order_items
  GROUP BY order_id
)
SELECT
  s.region,
  COUNT(*) AS bronze_orders,
  COUNT(*) FILTER (WHERE o.status = 'completed') AS silver_completed_orders,
  ROUND(SUM(o.total_usd), 2) AS bronze_gross_usd,
  ROUND(SUM(o.total_usd) FILTER (WHERE o.status = 'completed'), 2) AS silver_net_usd,
  SUM(ibo.order_units) FILTER (WHERE o.status = 'completed') AS gold_completed_units
FROM stores s
JOIN orders o ON s.store_id = o.store_id
LEFT JOIN items_by_order ibo ON o.order_id = ibo.order_id
GROUP BY s.region
ORDER BY silver_net_usd DESC;`,
    solutionExplanation: 'La CTE preagrega las unidades por pedido evitando duplicar filas de orders al hacer JOIN; luego FILTER (WHERE o.status = \'completed\') aísla las órdenes y montos netos de las capas Plata y Oro frente al bruto de Bronce.',
    expectedOutputTable: [
      { region: 'Cono Sur', bronze_orders: 6001, silver_completed_orders: 4920, bronze_gross_usd: 2517001.37, silver_net_usd: 2059786.39, gold_completed_units: 23467 },
      { region: 'Andina', bronze_orders: 6000, silver_completed_orders: 4921, bronze_gross_usd: 2434901.41, silver_net_usd: 1990554.12, gold_completed_units: 22502 },
      { region: 'Iberia', bronze_orders: 3428, silver_completed_orders: 2811, bronze_gross_usd: 1651332.57, silver_net_usd: 1348369.68, gold_completed_units: 15211 },
      { region: 'Norteamérica', bronze_orders: 2571, silver_completed_orders: 2108, bronze_gross_usd: 1066582.42, silver_net_usd: 870752.23, gold_completed_units: 9870 }
    ]
  },
  roleNotes: {
    de: 'Configura write.delete.mode = merge-on-read con format-version = 3 para que las bajas generen Deletion Vectors en Puffin y programa trabajos periódicos de compactación y expire_snapshots.',
    da: 'Filtra siempre directamente sobre las columnas de fecha o marca temporal base (como order_ts) para activar el particionado oculto y consulta las instantáneas por ID cuando necesites reproducibilidad.',
    bi: 'Conecta tus modelos semánticos únicamente a la rama principal (main) de la capa Oro, asegurando que los reportes consuman instantáneas que superaron las pruebas Write-Audit-Publish.'
  },
  summary: [
    'Apache Iceberg garantiza transacciones ACID mediante un árbol jerárquico que va desde el catálogo y metadata.json hasta las manifest lists y manifest files.',
    'La especificación Iceberg v3 introduce Deletion Vectors en archivos Puffin (a lo sumo uno activo por archivo Parquet) y linaje nativo por fila (_row_id).',
    'El particionado oculto almacena transformaciones en los metadatos y permite evolucionar el layout físico sin reescribir archivos históricos.',
    'El patrón Write-Audit-Publish (WAP) aísla la ingesta en ramas secundarias y solo promueve la instantánea a producción tras superar auditorías SQL.'
  ],
  flashcards: [
    {
      id: 'fc-1',
      front: '¿Qué estructura almacena un Deletion Vector en Apache Iceberg v3 y cuál es su invariante por archivo de datos?',
      back: 'Almacena un bitmap Roaring de 64 bits dentro de un archivo Puffin y garantiza que exista a lo sumo un Deletion Vector activo por archivo Parquet.'
    },
    {
      id: 'fc-2',
      front: '¿Qué diferencia existe entre una manifest list y un manifest file en Apache Iceberg?',
      back: 'La manifest list indexa una instantánea completa con rangos de partición por manifiesto, mientras el manifest file lista archivos Parquet individuales y sus estadísticas min/max por columna.'
    },
    {
      id: 'fc-3',
      front: '¿En qué consiste el particionado oculto (hidden partitioning) de Iceberg?',
      back: 'En almacenar la función de partición (como month o bucket) en metadata.json para que el motor derive el filtro de partición directamente desde la columna base.'
    },
    {
      id: 'fc-4',
      front: '¿Cuáles son las tres etapas del patrón Write-Audit-Publish (WAP)?',
      back: 'Escribir los datos en una rama aislada (audit_branch), ejecutar pruebas de calidad sobre esa rama y promover el puntero main (fast-forward) si pasan.'
    }
  ],
  glossaryTerms: [
    'c17-medallion-architecture',
    'c18-iceberg-v3',
    'iceberg-deletion-vectors',
    'hidden-partitioning',
    'write-audit-publish'
  ],
  sources: [
    {
      title: 'Apache Iceberg Table Spec (Format Version 3)',
      url: 'https://iceberg.apache.org/spec/',
      publisher: 'Apache Software Foundation',
      accessed: '2026-10-29',
      supports: 'Especificación del árbol de metadatos Iceberg, Deletion Vectors, Row Lineage (_row_id) y tipos v3.'
    },
    {
      title: 'Apache Iceberg Puffin File Specification',
      url: 'https://iceberg.apache.org/puffin-spec/',
      publisher: 'Apache Software Foundation',
      accessed: '2026-10-29',
      supports: 'Formato de archivo lateral Puffin para almacenar bitmaps Roaring64 de Deletion Vectors e índices.'
    },
    {
      title: 'Apache Iceberg Partitioning and Hidden Partitioning',
      url: 'https://iceberg.apache.org/docs/latest/partitioning/',
      publisher: 'Apache Software Foundation',
      accessed: '2026-10-29',
      supports: 'Particionado oculto y evolución del partition-spec sin reescribir archivos Parquet históricos.'
    },
    {
      title: 'Apache Iceberg Branching and Tagging (WAP)',
      url: 'https://iceberg.apache.org/docs/latest/branching/',
      publisher: 'Apache Software Foundation',
      accessed: '2026-10-29',
      supports: 'Ramas a nivel de instantánea para implementar el patrón de calidad Write-Audit-Publish.'
    }
  ],
  aiNotes: 'Guía al estudiante para distinguir entre archivos de datos Parquet inmutables y archivos Puffin con Deletion Vectors. En la práctica SQL, verifica que comprenda por qué order_items debe preagregarse por order_id antes del JOIN con orders (evitar fan-out al sumar total_usd) y cómo la cláusula FILTER (WHERE o.status = \'completed\') separa las métricas Bronce de las capas Plata y Oro.'
};

export default lesson;
