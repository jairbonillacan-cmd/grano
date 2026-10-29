export const lesson = {
  id: 'de3-lakehouse-04-costos-bigquery-snowflake-databricks',
  moduleId: 'de3-lakehouse',
  tracks: ['de'],
  level: 3,
  order: 4,
  title: 'Costos y arquitectura: BigQuery, Snowflake y Databricks',
  subtitle: 'Arquitectura y modelo de costos en BigQuery, Snowflake y Databricks',
  minutes: 25,
  contentVersion: 1,
  needsReview: false,
  prerequisites: ['de3-lakehouse-03-catalogos-polaris-unity'],
  hook: 'En Mercado Brisa, un tablero ejecutivo refrescado cada diez minutos disparó la factura mensual de nube tras escanear repetidamente los 65.000 eventos web y las 42.000 líneas de detalle sin podar particiones ni proyectar columnas. Aunque Google BigQuery, Snowflake y Databricks desacoplan el almacenamiento del cómputo, cada plataforma mide y cobra las unidades de procesamiento con reglas distintas. ¿Cómo funcionan internamente los slots de BigQuery, los Virtual Warehouses de Snowflake y los SQL Warehouses con Photon en Databricks, y qué decisiones SQL reducen de inmediato el gasto operativo?',
  objectives: [
    'Comparar la arquitectura interna de almacenamiento y ejecución en BigQuery (Colossus/Dremel), Snowflake (micro-particiones/Virtual Warehouses) y Databricks (Parquet/Photon).',
    'Contrastar los modelos de facturación por bytes escaneados (On-Demand), reserva de capacidad (Slots) y cómputo por segundo con mínimo de 60 segundos (Créditos y DBUs).',
    'Cuantificar mediante SQL el ahorro de lectura obtenido al aplicar poda de particiones (partition pruning) y proyección columnar sobre las tablas de Mercado Brisa.'
  ],
  sections: [
    {
      id: 'google-bigquery-colossus-dremel-slots',
      heading: 'Google BigQuery: Colossus, Capacitor y slots de ejecución Dremel',
      body: '**Google BigQuery** opera como un almacén sin servidor (*serverless*). El almacenamiento distribuido en **Colossus** guarda las tablas en formato columnar Capacitor. Ese almacenamiento se separa de los árboles de ejecución **Dremel**, que son orquestados por Borg y conectados mediante la red Jupiter.\n\nBigQuery ofrece dos modalidades de facturación de cómputo. Primero, **On-Demand (por TiB leído)** cobra según los bytes leídos en las columnas y particiones que la consulta toca. Existe un mínimo de 10 MB por tabla referenciada. Aquí un `SELECT *` que incluya columnas extensas como `payload_json` multiplica directamente el costo. Segundo, **Capacity / Editions (por Slots-hora)** reserva unidades virtuales de CPU y RAM llamadas **slots** con autoescalado. En este modelo, una consulta sin poda satura los slots y encola al resto de la empresa.\n\nEn la tabla `events` de **Mercado Brisa**, limitar la lectura al último trimestre de 2025 reduce el texto JSON procesado de `2.977.400` a `161.696` caracteres.',
      interactive: {
        component: 'partition-pruning',
        caption: 'Impacto del Partition Pruning y Data Skipping en la reducción de bytes facturados en la nube.'
      },
      example: {
        language: 'sql',
        code: `SELECT
  event_type,
  COUNT(*) AS total_events,
  SUM(STRLEN(payload_json)) AS payload_chars,
  COUNT(*) FILTER (WHERE event_ts >= TIMESTAMP '2025-10-01 00:00:00') AS q4_2025_events,
  SUM(STRLEN(payload_json)) FILTER (WHERE event_ts >= TIMESTAMP '2025-10-01 00:00:00') AS q4_2025_payload_chars
FROM events
GROUP BY event_type
ORDER BY total_events DESC, event_type ASC;`,
        expectedOutput: [
          { event_type: 'add_to_cart', total_events: 15400, payload_chars: 716800, q4_2025_events: 796, q4_2025_payload_chars: 39330 },
          { event_type: 'checkout_completed', total_events: 15400, payload_chars: 830600, q4_2025_events: 833, q4_2025_payload_chars: 47866 },
          { event_type: 'checkout_started', total_events: 15400, payload_chars: 790800, q4_2025_events: 849, q4_2025_payload_chars: 45570 },
          { event_type: 'page_view', total_events: 9400, payload_chars: 282000, q4_2025_events: 426, q4_2025_payload_chars: 12780 },
          { event_type: 'product_view', total_events: 9400, payload_chars: 357200, q4_2025_events: 425, q4_2025_payload_chars: 16150 }
        ]
      }
    },
    {
      id: 'snowflake-micro-particiones-virtual-warehouses',
      heading: 'Snowflake: micro-particiones inmutables y Virtual Warehouses',
      body: '**Snowflake** estructura su arquitectura en tres capas independientes. La primera es el almacenamiento en objetos cloud dividido en **micro-particiones** columnares inmutables de 50 MB a 500 MB sin comprimir. La segunda son los clústeres de cómputo llamados **Virtual Warehouses**. La tercera es la capa Cloud Services, que mantiene el optimizador y los metadatos `min`/`max` de cada micro-partición.\n\nLos Virtual Warehouses se dimensionan en tallas geométricas (`X-Small`, `Small`, `Medium`, `Large`). Cada incremento duplica los nodos y los **créditos por hora** consumidos (1, 2, 4, 8 créditos/hora). La regla financiera crítica de Snowflake es que cada encendido factura por segundo pero con un **mínimo de 60 segundos**.\n\nSi configuras `AUTO_SUSPEND = 5` segundos en un almacén que recibe una consulta de 2 segundos cada minuto, el clúster se apaga y reanuda sesenta veces por hora. Pagarás 60 mínimos de un minuto y perderás la **caché SSD local** en cada suspensión.',
      example: {
        language: 'sql',
        code: `SELECT
  device_type,
  COUNT(DISTINCT order_date) AS active_days,
  COUNT(DISTINCT DATE_TRUNC('hour', order_ts)) AS active_hours,
  COUNT(*) AS completed_orders,
  ROUND(SUM(total_usd), 2) AS revenue_usd
FROM orders
WHERE status = 'completed'
GROUP BY device_type
ORDER BY revenue_usd DESC;`,
        expectedOutput: [
          { device_type: 'desktop', active_days: 976, active_hours: 5037, completed_orders: 6327, revenue_usd: 2867799 },
          { device_type: 'mobile', active_days: 970, active_hours: 4604, completed_orders: 5624, revenue_usd: 2199394.23 },
          { device_type: 'pos_tienda', active_days: 893, active_hours: 2581, completed_orders: 2809, revenue_usd: 1202269.19 }
        ]
      }
    },
    {
      id: 'databricks-sql-warehouses-photon-dbu',
      heading: 'Databricks SQL Warehouses, motor Photon y unidades DBU',
      body: 'En **Databricks**, los datos permanecen en archivos Parquet abiertos en el bucket del cliente. Esas tablas son gobernadas por Delta Lake o Apache Iceberg con Unity Catalog. El procesamiento analítico recae en los **SQL Warehouses** acelerados por **Photon**. Photon es un motor vectorizado escrito en C++ que procesa lotes de columnas aprovechando instrucciones SIMD del procesador.\n\nEl consumo se mide en **DBUs (*Databricks Units*)** facturadas por segundo de actividad. En almacenes **Classic o Pro**, la empresa paga las DBUs a Databricks más el costo de las máquinas virtuales en AWS, Azure o GCP. En **Serverless SQL Warehouses**, Databricks administra un pool compartido con arranque rápido y una tarifa DBU unificada que incluye la infraestructura.\n\nEn los tres motores, la palanca universal de **FinOps** consiste en minimizar los bloques leídos. Esto se logra combinando **poda de particiones**, estadísticas de salto (*data skipping*) y **tablas preagregadas en la capa Oro**.',
      example: {
        language: 'sql',
        code: `SELECT
  channel,
  COUNT(*) AS campaign_days,
  SUM(impressions) AS total_impressions,
  SUM(clicks) AS total_clicks,
  ROUND(SUM(spend_usd), 2) AS total_spend_usd,
  ROUND(SUM(spend_usd) / NULLIF(SUM(clicks), 0), 2) AS cpc_usd
FROM marketing_spend
GROUP BY channel
ORDER BY total_spend_usd DESC;`,
        expectedOutput: [
          { channel: 'paid_social', campaign_days: 146, total_impressions: 3213897, total_clicks: 79925, total_spend_usd: 63080.29, cpc_usd: 0.79 },
          { channel: 'display_video', campaign_days: 146, total_impressions: 2319080, total_clicks: 58708, total_spend_usd: 46759.04, cpc_usd: 0.8 },
          { channel: 'organic_search', campaign_days: 146, total_impressions: 1377667, total_clicks: 33785, total_spend_usd: 26703.45, cpc_usd: 0.79 },
          { channel: 'referral', campaign_days: 146, total_impressions: 1131587, total_clicks: 28511, total_spend_usd: 22306.35, cpc_usd: 0.78 },
          { channel: 'email_campaign', campaign_days: 146, total_impressions: 720737, total_clicks: 17651, total_spend_usd: 14102.07, cpc_usd: 0.8 }
        ]
      }
    }
  ],
  workedExample: {
    title: 'Auditoría del costo de un escaneo completo sin poda en Mercado Brisa',
    description: 'Un analista conectó un tablero regional directamente a la unión de stores, orders y order_items sin filtrar por fecha ni por estado de la orden.',
    audit: 'La consulta sin predicado escanea las 42.000 líneas históricas e infla el monto con órdenes reembolsadas y canceladas, mientras que podar al año 2025 completado ahorra un 65% de lectura.',
    steps: [
      {
        label: 'Paso 1 — Medir el volumen de líneas y órdenes leídas en un escaneo sin filtros',
        explanation: 'Unimos stores, orders y order_items sin predicado WHERE para cuantificar las 42.000 líneas históricas y las 18.000 órdenes que el motor lee en cada ejecución del tablero.',
        code: `SELECT
  s.region,
  COUNT(*) AS scanned_lines,
  COUNT(DISTINCT o.order_id) AS scanned_orders,
  ROUND(SUM(oi.line_total_usd), 2) AS unpruned_line_usd
FROM stores s
JOIN orders o ON s.store_id = o.store_id
JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY s.region
ORDER BY unpruned_line_usd DESC;`,
        expectedOutput: [
          { region: 'Cono Sur', scanned_lines: 13714, scanned_orders: 6001, unpruned_line_usd: 2195524.92 },
          { region: 'Andina', scanned_lines: 13714, scanned_orders: 6000, unpruned_line_usd: 2119891.45 },
          { region: 'Iberia', scanned_lines: 8570, scanned_orders: 3428, unpruned_line_usd: 1438103.86 },
          { region: 'Norteamérica', scanned_lines: 6002, scanned_orders: 2571, unpruned_line_usd: 928944.08 }
        ]
      },
      {
        label: 'Paso 2 — Analizar el desperdicio de lectura y la distorsión financiera',
        explanation: 'Además de leer las 42.000 líneas completas de los tres años (2023, 2024 y 2025), la consulta sin filtro incluye pedidos reembolsados, cancelados y pendientes, inflando los montos regionales por encima de las ventas liquidadas.'
      },
      {
        label: 'Paso 3 — Aplicar predicados de poda sobre order_date y status',
        explanation: 'Al restringir la consulta al año 2025 y a status = completed sobre tablas particionadas por order_date y agrupadas por status, el motor descarta dos tercios de los bloques antes de abrir los archivos Parquet o micro-particiones.'
      }
    ]
  },
  checks: [
    {
      id: 'chk-1',
      type: 'mcq',
      prompt: 'En Google BigQuery bajo el modelo de precios On-Demand, ¿qué ocurre con el costo si ejecutas `SELECT * FROM events LIMIT 10` sobre una tabla sin filtro `WHERE` de partición?',
      options: [
        {
          id: 'a',
          text: 'BigQuery cobra únicamente los bytes correspondientes a las primeras 10 filas devueltas en pantalla.',
          correct: false,
          feedback: 'Incorrecto. En BigQuery On-Demand, la cláusula LIMIT no reduce los bytes escaneados ni el monto facturado.'
        },
        {
          id: 'b',
          text: 'BigQuery factura el escaneo completo de todas las columnas y particiones de la tabla, porque `SELECT *` proyecta todo el esquema y `LIMIT` no poda particiones.',
          correct: true,
          feedback: 'Correcto. Para reducir los bytes facturados en On-Demand debes seleccionar solo las columnas necesarias y filtrar por la columna de partición o clustering.'
        },
        {
          id: 'c',
          text: 'La consulta no tiene ningún costo porque toca menos de 100.000 filas.',
          correct: false,
          feedback: 'Incorrecto. BigQuery On-Demand factura por bytes leídos (con mínimo de 10 MB por tabla), no por umbral de filas.'
        },
        {
          id: 'd',
          text: 'BigQuery convierte automáticamente la cuenta al modelo de Slots reservados durante esa consulta.',
          correct: false,
          feedback: 'Incorrecto. El cambio entre On-Demand y Capacity Editions es una configuración administrativa de reservas, no ocurre por consulta.'
        }
      ],
      explanation: 'En BigQuery On-Demand el cobro se calcula sobre los bytes leídos en las columnas referenciadas de las particiones activas; ni SELECT * ni LIMIT reducen las particiones leídas.'
    },
    {
      id: 'chk-2',
      type: 'mcq',
      prompt: 'Un Virtual Warehouse en Snowflake recibe una consulta de 3 segundos cada minuto y tiene configurado `AUTO_SUSPEND = 5` segundos. ¿Por qué esta configuración resulta contraproducente en costos y rendimiento?',
      options: [
        {
          id: 'a',
          text: 'Porque Snowflake cobra un mínimo de 60 segundos cada vez que el almacén se reanuda y además vacía la caché SSD local en cada suspensión.',
          correct: true,
          feedback: 'Correcto. Suspender y reanudar cada minuto hace pagar los 60 segundos completos en cada arranque y destruye la localidad de caché.'
        },
        {
          id: 'b',
          text: 'Porque Snowflake borra las micro-particiones de S3 cuando un Virtual Warehouse se suspende antes de diez minutos.',
          correct: false,
          feedback: 'Incorrecto. Las micro-particiones residen en el almacenamiento persistente; lo que se pierde al suspender es la caché temporal de los nodos.'
        },
        {
          id: 'c',
          text: 'Porque Snowflake prohíbe usar valores de AUTO_SUSPEND menores a 3.600 segundos.',
          correct: false,
          feedback: 'Incorrecto. Snowflake permite valores bajos de AUTO_SUSPEND, pero causan sobre-facturación por el mínimo de 60s al reanudar.'
        },
        {
          id: 'd',
          text: 'Porque al suspenderse el almacén cambia automáticamente de talla X-Small a 4X-Large.',
          correct: false,
          feedback: 'Incorrecto. La suspensión apaga el cómputo sin modificar la talla configurada del Virtual Warehouse.'
        }
      ],
      explanation: 'Cada reanudación de un Virtual Warehouse en Snowflake conlleva un cargo mínimo de 60 segundos y pierde la caché SSD de los nodos de cómputo.'
    },
    {
      id: 'chk-3',
      type: 'mcq',
      prompt: '¿Qué combinación representa la arquitectura de ejecución de un Serverless SQL Warehouse en Databricks?',
      options: [
        {
          id: 'a',
          text: 'Almacenamiento propietario cerrado sin acceso a Parquet y facturación por terabyte descargado a disco local.',
          correct: false,
          feedback: 'Incorrecto. Databricks opera sobre formatos abiertos (Delta Lake / Iceberg sobre Parquet) en el bucket del cliente.'
        },
        {
          id: 'b',
          text: 'Ejecución vectorizada en C++ con el motor Photon sobre tablas abiertas Parquet/Delta/Iceberg y facturación en DBUs por segundo que incluyen el cómputo subyacente.',
          correct: true,
          feedback: 'Correcto. Serverless SQL Warehouses combinan el motor vectorizado Photon con aprovisionamiento instantáneo facturado en DBUs.'
        },
        {
          id: 'c',
          text: 'Ejecución exclusiva mediante MapReduce en disco magnético sin estadísticas de salto de datos.',
          correct: false,
          feedback: 'Incorrecto. Photon ejecuta en memoria de forma vectorizada y aprovecha estadísticas min/max y Liquid Clustering.'
        },
        {
          id: 'd',
          text: 'Facturación mensual fija por usuario registrado independientemente de si los clústeres están encendidos o apagados.',
          correct: false,
          feedback: 'Incorrecto. Los SQL Warehouses se facturan por capacidad de cómputo consumida en DBUs mientras procesan cargas.'
        }
      ],
      explanation: 'Los Serverless SQL Warehouses en Databricks ejecutan consultas mediante el motor vectorizado Photon sobre tablas abiertas y se facturan en DBUs por segundo de uso.'
    }
  ],
  practice: {
    type: 'sql',
    title: 'Auditoría FinOps de ahorro por poda de partición en Mercado Brisa',
    language: 'sql',
    prompt: 'Cuantifica el ahorro de lectura por región (`region`) al aplicar poda de partición y estado (`o.order_date >= DATE \'2025-01-01\' AND o.order_date <= DATE \'2025-12-31\' AND o.status = \'completed\'`) sobre la unión de `stores`, `orders` y `order_items`. Devuelve `region`, el total histórico de líneas (`full_scan_lines`), las líneas leídas tras aplicar el filtro de 2025 y estado completado (`pruned_2025_lines`), el porcentaje de líneas ahorradas redondeado a 2 decimales (`scan_saved_pct`, calculado como `ROUND((1.0 - pruned_2025_lines * 1.0 / full_scan_lines) * 100, 2)`) y el monto neto de líneas de 2025 completadas redondeado a 2 decimales (`net_2025_line_usd`). Ordena por `net_2025_line_usd DESC`.',
    starterCode: `-- Auditoría FinOps de poda de escaneo (Partition Pruning) por región
-- Corrige scan_saved_pct y net_2025_line_usd aplicando el filtro del año 2025 y órdenes completadas.
SELECT
  s.region,
  COUNT(*) AS full_scan_lines,
  COUNT(*) FILTER (
    WHERE o.order_date >= DATE '2025-01-01'
      AND o.order_date <= DATE '2025-12-31'
      AND o.status = 'completed'
  ) AS pruned_2025_lines,
  0.0 AS scan_saved_pct,
  ROUND(SUM(oi.line_total_usd), 2) AS net_2025_line_usd
FROM stores s
JOIN orders o ON s.store_id = o.store_id
JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY s.region
ORDER BY net_2025_line_usd DESC;`,
    expected: `SELECT
  s.region,
  COUNT(*) AS full_scan_lines,
  COUNT(*) FILTER (
    WHERE o.order_date >= DATE '2025-01-01'
      AND o.order_date <= DATE '2025-12-31'
      AND o.status = 'completed'
  ) AS pruned_2025_lines,
  ROUND(
    (
      1.0 - COUNT(*) FILTER (
        WHERE o.order_date >= DATE '2025-01-01'
          AND o.order_date <= DATE '2025-12-31'
          AND o.status = 'completed'
      ) * 1.0 / COUNT(*)
    ) * 100,
    2
  ) AS scan_saved_pct,
  ROUND(
    SUM(oi.line_total_usd) FILTER (
      WHERE o.order_date >= DATE '2025-01-01'
        AND o.order_date <= DATE '2025-12-31'
        AND o.status = 'completed'
    ),
    2
  ) AS net_2025_line_usd
FROM stores s
JOIN orders o ON s.store_id = o.store_id
JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY s.region
ORDER BY net_2025_line_usd DESC;`,
    orderMatters: true,
    hints: [
      'Para scan_saved_pct usa ROUND((1.0 - COUNT(*) FILTER (WHERE o.order_date >= DATE \'2025-01-01\' AND o.order_date <= DATE \'2025-12-31\' AND o.status = \'completed\') * 1.0 / COUNT(*)) * 100, 2).',
      'Para net_2025_line_usd usa ROUND(SUM(oi.line_total_usd) FILTER (WHERE o.order_date >= DATE \'2025-01-01\' AND o.order_date <= DATE \'2025-12-31\' AND o.status = \'completed\'), 2).',
      'Verifica que el resultado esté agrupado por s.region y ordenado por net_2025_line_usd DESC.'
    ],
    solution: `SELECT
  s.region,
  COUNT(*) AS full_scan_lines,
  COUNT(*) FILTER (
    WHERE o.order_date >= DATE '2025-01-01'
      AND o.order_date <= DATE '2025-12-31'
      AND o.status = 'completed'
  ) AS pruned_2025_lines,
  ROUND(
    (
      1.0 - COUNT(*) FILTER (
        WHERE o.order_date >= DATE '2025-01-01'
          AND o.order_date <= DATE '2025-12-31'
          AND o.status = 'completed'
      ) * 1.0 / COUNT(*)
    ) * 100,
    2
  ) AS scan_saved_pct,
  ROUND(
    SUM(oi.line_total_usd) FILTER (
      WHERE o.order_date >= DATE '2025-01-01'
        AND o.order_date <= DATE '2025-12-31'
        AND o.status = 'completed'
    ),
    2
  ) AS net_2025_line_usd
FROM stores s
JOIN orders o ON s.store_id = o.store_id
JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY s.region
ORDER BY net_2025_line_usd DESC;`,
    solutionExplanation: 'Al aplicar el predicado sobre order_date (año 2025) y status = \'completed\', las cuatro regiones ahorran cerca del 65% de las líneas escaneadas y reportan únicamente ingresos completados.',
    expectedOutputTable: [
      { region: 'Cono Sur', full_scan_lines: 13714, pruned_2025_lines: 4775, scan_saved_pct: 65.18, net_2025_line_usd: 760714.73 },
      { region: 'Andina', full_scan_lines: 13714, pruned_2025_lines: 4864, scan_saved_pct: 64.53, net_2025_line_usd: 754302.39 },
      { region: 'Iberia', full_scan_lines: 8570, pruned_2025_lines: 2935, scan_saved_pct: 65.75, net_2025_line_usd: 490912.12 },
      { region: 'Norteamérica', full_scan_lines: 6002, pruned_2025_lines: 2107, scan_saved_pct: 64.9, net_2025_line_usd: 334760.05 }
    ]
  },
  roleNotes: {
    de: 'Define claves de partición y clustering alineadas con los filtros de fecha y estado más frecuentes, y establece monitores de cuota (Resource Monitors en Snowflake o cuotas de bytes/slots en BigQuery).',
    da: 'Reemplaza SELECT * por la lista explícita de columnas necesarias e incluye siempre predicados de rango sobre la columna de partición antes de ejecutar exploraciones ad-hoc.',
    bi: 'Apunta los tableros de alta concurrencia hacia tablas Oro preagregadas y ajusta los intervalos de refresco para no despertar almacenes de cómputo cada pocos segundos.'
  },
  summary: [
    'BigQuery separa Colossus del motor Dremel, facturando por TiB escaneado (On-Demand) o por capacidad reservada en Slots (Editions).',
    'Snowflake usa micro-particiones inmutables y factura sus Virtual Warehouses por segundo con un mínimo de 60 segundos por encendido.',
    'Databricks ejecuta consultas con el motor vectorizado Photon sobre formatos abiertos Parquet/Delta/Iceberg y mide el consumo en unidades DBU.',
    'La poda de particiones y la proyección columnar ahorran cerca del 65% de las lecturas analíticas en Mercado Brisa.'
  ],
  flashcards: [
    {
      id: 'fc-1',
      front: '¿Cuáles son los dos modelos de facturación de cómputo en Google BigQuery y qué mide cada uno?',
      back: 'On-Demand, que factura por TiB de datos leídos en las columnas y particiones consultadas; y Capacity (Editions), que factura por capacidad de cómputo en Slots-hora.'
    },
    {
      id: 'fc-2',
      front: '¿Qué es una micro-partición en Snowflake y qué metadatos almacena la capa Cloud Services sobre ella?',
      back: 'Es un bloque columnar inmutable de 50 a 500 MB sin comprimir del cual Cloud Services guarda el rango min/max, conteo de nulos y valores distintos de cada columna.'
    },
    {
      id: 'fc-3',
      front: '¿Por qué un AUTO_SUSPEND de 5 segundos puede encarecer un Virtual Warehouse de Snowflake con consultas cada minuto?',
      back: 'Porque cada reanudación factura un mínimo de 60 segundos de créditos y además borra la caché SSD local de los nodos de cómputo.'
    },
    {
      id: 'fc-4',
      front: '¿Qué función cumple el motor Photon dentro de los Databricks SQL Warehouses?',
      back: 'Es un motor de ejecución vectorizado escrito en C++ que acelera lecturas Parquet, filtros, uniones y agregaciones aprovechando instrucciones SIMD de CPU.'
    }
  ],
  glossaryTerms: [
    'bigquery-slots-pruning',
    'snowflake-micro-partitions',
    'liquid-clustering',
    'hidden-partitioning'
  ],
  sources: [
    {
      title: 'Google Cloud BigQuery Pricing (On-Demand vs Capacity Editions)',
      url: 'https://cloud.google.com/bigquery/pricing',
      publisher: 'Google Cloud',
      accessed: '2026-10-29',
      supports: 'Facturación On-Demand por bytes leídos frente a capacidad reservada en Slots con autoescalado.'
    },
    {
      title: 'Snowflake Documentation: Understanding Compute Cost',
      url: 'https://docs.snowflake.com/en/user-guide/cost-understanding-compute',
      publisher: 'Snowflake',
      accessed: '2026-10-29',
      supports: 'Facturación por segundo con mínimo de 60 segundos en Virtual Warehouses y efecto de AUTO_SUSPEND en la caché.'
    },
    {
      title: 'Databricks SQL Warehouses and Serverless Compute Architecture',
      url: 'https://docs.databricks.com/aws/en/compute/sql-warehouse/',
      publisher: 'Databricks',
      accessed: '2026-10-29',
      supports: 'Arquitectura de SQL Warehouses, motor vectorizado Photon y facturación en unidades DBU.'
    }
  ],
  aiNotes: 'Guía al estudiante para conectar las estructuras físicas estudiadas en las lecciones 1 y 2 (particionado oculto, Liquid Clustering, estadísticas min/max) con el impacto directo en la factura de BigQuery, Snowflake y Databricks. En la práctica SQL, resalta cómo el filtro sobre order_date y status ahorra cerca del 65% de las líneas escaneadas en las cuatro regiones.'
};

export default lesson;
