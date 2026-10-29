export const DISCIPLINES = {
  DE: {
    id: 'DE',
    short: 'DE',
    name: 'Ingeniería de Datos',
    color: '#0F62FE',
    bgLight: '#E8F0FE',
    border: '#93B8FE',
    role: 'Arquitectura, Almacenamiento, Pipelines & Contratos',
  },
  DA: {
    id: 'DA',
    short: 'DA',
    name: 'Análisis de Datos',
    color: '#059669',
    bgLight: '#E6F6F0',
    border: '#6EE7B7',
    role: 'Exploración, Estadística, Cohortes & Inferencia Causal',
  },
  BI: {
    id: 'BI',
    short: 'BI',
    name: 'Business Intelligence',
    color: '#D97706',
    bgLight: '#FEF3C7',
    border: '#FCD34D',
    role: 'Capa Semántica, KPIs, BI-as-Code & Decisión Ejecutiva',
  },
};

export const MODULES_2026 = [
  {
    id: 'mod-1-sql-modeling',
    number: 1,
    shortTitle: '1. SQL & Dimensional Modeling',
    title: 'Modelado Dimensional Híbrido y SQL Analítico Moderno',
    subtitle: 'Star Schema, One Big Table (OBT), SCD Tipo 2 y SQL 2026 (QUALIFY, ASOF JOIN, GROUPING SETS)',
    eraTag: 'Fundamento Estructural · Actual',
    defaultSim: {
      partitionGranularity: 72,
      compressionRatio: 84,
      sampleSizeK: 150,
      cacheHitRate: 78,
    },
    diagram: {
      title: 'Flujo del Modelo Dimensional al Dashboard: OBT vs. Star Schema en Motores Columnar',
      sourceLabel: 'OLTP / Eventos CDC',
      engineLabel: 'Star Schema (Silver)',
      partitions: [
        { id: 'p1', name: 'dim_customers (SCD2)', rows: '4.2M', status: 'scanned', detail: ' validez temporal valid_from / valid_to con ASOF JOIN' },
        { id: 'p2', name: 'fact_orders (2026-Q4)', rows: '128M', status: 'scanned', detail: 'Hechos granulares particionados por mes de evento' },
        { id: 'p3', name: 'fact_orders (2025 Hist)', rows: '410M', status: 'pruned', detail: 'Podado automáticamente por predicado temporal' },
        { id: 'p4', name: 'obt_revenue_wide', rows: '128M', status: 'scanned', detail: 'Tabla ancha desnormalizada para escaneo columnar rápido' },
      ],
      sinkLabel: 'Capa Semántica & BI',
    },
    perspectives: {
      '360': {
        heading: 'Cómo el modelo de datos une Ingeniería, Análisis y BI',
        summary:
          'En 2026, el debate entre Kimball (Star Schema) y One Big Table (OBT) ya no es dogmático: los equipos mantienen dimensiones conformadas y tablas de hechos auditables en la capa Silver (DE), exponen vistas o tablas anchas pre-unidas para exploración estadística ultrarrápida en DuckDB/Polars (DA), y gobiernan las métricas con joins seguros en la Capa Semántica para evitar errores de fan-out o agregaciones falsas en los dashboards (BI).',
        bulletPoints: [
          'DE diseña claves subrogadas deterministas (hashes SHA-256/xxHash64) y tablas SCD Tipo 2 para preservar la historia exacta de cada cliente.',
          'DA aprovecha cláusulas modernas como QUALIFY (filtrar window functions sin subconsultas) y ASOF JOIN (cruzar eventos con el estado vigente en ese milisegundo).',
          'BI consume el modelo mediante métricas semánticas no aditivas bien definidas (ratios, clientes únicos, retención neta) evitando promediar promedios.',
        ],
      },
      DE: {
        heading: 'Ingeniería (DE): Star Schema vs. OBT y claves subrogadas en motores columnares',
        summary:
          'Los motores columnares modernos con compresión diccionario y Run-Length Encoding (RLE) hacen que repetir cadenas en una One Big Table (OBT) cueste apenas un 8-12% más de almacenamiento en Parquet, ahorrando costosos Shuffle Joins en lecturas masivas. Sin embargo, cuando una dimensión cambia frecuentemente (SCD Tipo 2), actualizar cientos de millones de filas en una OBT es mucho más caro que actualizar solo una tabla dim_customer.',
        bulletPoints: [
          'Regla híbrida 2026: Mantén Star Schema en Silver para gobernanza y actualizaciones SCD2 baratas; materializa OBT en Gold solo para tablas de consumo intensivo.',
          'Usa xxHash64 sobre claves naturales concatenadas con separador nulo para generar surrogate keys idempotentes en cargas paralelas.',
          'Ordena físicamente (Z-Order o Hilbert Curve) por customer_id y event_date para maximizar el salto de bloques (min/max zone maps).',
        ],
      },
      DA: {
        heading: 'Análisis (DA): Window Functions avanzadas, ASOF JOIN y Paradoja de Simpson',
        summary:
          'Un analista senior no extrae millones de filas a Pandas para hacer cruces temporales: delega el trabajo pesado al motor SQL analítico usando marcos de ventana basados en rangos temporales (RANGE BETWEEN INTERVAL 7 DAYS PRECEDING) y ASOF JOIN para atribuir conversiones al último toque de marketing previo al pago.',
        bulletPoints: [
          'QUALIFY elimina el boilerplate de CTEs intermedias al filtrar directamente por ROW_NUMBER() o RANK().',
          'Cuidado con la Paradoja de Simpson: una tasa de conversión global puede parecer caer mientras sube en todos los segmentos individuales si cambia el mix de tráfico móvil vs. desktop.',
          'Usa GROUPING SETS y CUBE para calcular subtotales multidimensionales en una sola pasada de escaneo.',
        ],
      },
      BI: {
        heading: 'Business Intelligence (BI): Prevención del Fan-out Trap y Métricas No Aditivas',
        summary:
          'El error más destructivo en BI ocurre cuando un dashboard une una tabla de órdenes (cabecera) con líneas de detalle (ítems) y suma el costo de envío de la cabecera, multiplicándolo por el número de productos. La Capa Semántica previene esto declarando la granularidad (grain) explícita de cada entidad.',
        bulletPoints: [
          'Métricas Aditivas (Ingresos brutos), Semi-Aditivas (Inventario al cierre del mes: se suma entre almacenes, nunca entre meses) y No Aditivas (Margen %, Usuarios Activos).',
          'Nunca calcules un ratio ejecutivo haciendo AVG(orden_margen); calcula siempre SUM(margen_total) / NULLIF(SUM(ingreso_total), 0).',
          'Diseña árboles de descomposición de KPIs: Ingreso Neto = Usuarios Activos × Frecuencia de Compra × Ticket Promedio × (1 - Tasa de Devolución).',
        ],
      },
    },
    relatedConnections: [
      {
        targetModuleId: 'mod-4-dbt-semantic',
        discipline: 'BI',
        title: 'Capa Semántica y MetricFlow',
        connection: 'Cómo las dimensiones conformadas y tablas de hechos del Módulo 1 se convierten en métricas gobernadas sin riesgo de fan-out.',
      },
      {
        targetModuleId: 'mod-6-statistical-da',
        discipline: 'DA',
        title: 'Cohortes y Paradoja de Simpson',
        connection: 'Cómo auditar estadísticamente las agregaciones SQL para no tomar decisiones ejecutivas erróneas por cambios de mix.',
      },
      {
        targetModuleId: 'mod-2-duckdb-arrow',
        discipline: 'DE',
        title: 'Compresión RLE y Diccionario en Parquet',
        connection: 'Por qué las tablas anchas (OBT) comprimen tan bien gracias al layout físico columnar.',
      },
    ],
    codeSamples: {
      DE: `-- [DE] DuckDB / Iceberg SQL: Construcción SCD2 + ASOF JOIN sin fugas temporales
WITH deduplicated_events AS (
  SELECT
    event_id,
    customer_id,
    event_ts,
    net_amount_usd,
    channel
  FROM bronze.commerce_events
  QUALIFY ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY ingested_at DESC) = 1
)
SELECT
  e.event_id,
  e.customer_id,
  c.tier_segment AS customer_tier_at_purchase,
  e.channel,
  e.net_amount_usd
FROM deduplicated_events e
ASOF JOIN silver.dim_customer_scd2 c
  ON e.customer_id = c.customer_id
  AND e.event_ts >= c.valid_from;`,
      DA: `-- [DA] Análisis de Retención de Cohortes y Detección de Cambio de Mix
WITH user_cohorts AS (
  SELECT
    customer_id,
    DATE_TRUNC('month', MIN(event_ts)) AS cohort_month,
    FIRST(channel ORDER BY event_ts) AS acquisition_channel
  FROM silver.fact_orders
  GROUP BY ALL
),
monthly_activity AS (
  SELECT
    c.cohort_month,
    c.acquisition_channel,
    DATE_DIFF('month', c.cohort_month, DATE_TRUNC('month', o.event_ts)) AS month_number,
    COUNT(DISTINCT o.customer_id) AS active_users,
    SUM(o.net_amount_usd) AS cohort_revenue
  FROM user_cohorts c
  JOIN silver.fact_orders o USING (customer_id)
  GROUP BY ALL
)
SELECT
  cohort_month,
  acquisition_channel,
  month_number,
  active_users,
  ROUND(100.0 * active_users / FIRST_VALUE(active_users) OVER (
    PARTITION BY cohort_month, acquisition_channel ORDER BY month_number
  ), 2) AS retention_pct
FROM monthly_activity
ORDER BY cohort_month, acquisition_channel, month_number;`,
      BI: `# [BI] dbt Semantic Layer / MetricFlow (YAML 2026) — Prevención de Fan-Out
semantic_models:
  - name: orders_fact
    model: ref('fact_orders')
    defaults:
      agg_time_dimension: order_date
    entities:
      - name: order
        type: primary
        expr: order_id
      - name: customer
        type: foreign
        expr: customer_id
    measures:
      - name: net_revenue
        agg: sum
        expr: net_amount_usd
      - name: paying_customers
        agg: count_distinct
        expr: customer_id

metrics:
  - name: arpu_net_usd
    type: ratio
    label: "ARPU Neto (USD)"
    type_params:
      numerator: net_revenue
      denominator: paying_customers`,
    },
    cohortData: [
      { label: 'M0 (Alta)', value: 100.0, segmentA: 100, segmentB: 100 },
      { label: 'Mes 1', value: 76.4, segmentA: 82, segmentB: 68 },
      { label: 'Mes 2', value: 58.2, segmentA: 67, segmentB: 46 },
      { label: 'Mes 3', value: 44.8, segmentA: 55, segmentB: 31 },
      { label: 'Mes 6', value: 31.5, segmentA: 42, segmentB: 19 },
      { label: 'Mes 12', value: 24.9, segmentA: 36, segmentB: 12 },
    ],
    kpis: [
      { label: 'Podado de Particiones', baseValue: 91.4, unit: '%', series: [72, 76, 81, 85, 89, 88, 91.4] },
      { label: 'Ratio Compresión OBT', baseValue: 6.4, unit: 'x', series: [4.1, 4.5, 5.0, 5.2, 5.8, 6.1, 6.4] },
      { label: 'Retención Neta (NRR)', baseValue: 114.2, unit: '%', series: [104, 106, 108, 111, 110, 113, 114.2] },
      { label: 'Latencia Consulta BI p95', baseValue: 142, unit: 'ms', series: [320, 280, 240, 210, 185, 160, 142] },
    ],
    quiz: {
      question:
        'Un dashboard ejecutivo muestra que la tasa de conversión total cayó del 4.8% al 4.1% esta semana, pero al filtrar por Web y por App Móvil por separado, ambas subieron. ¿Qué ocurre y cómo deben actuar DE, DA y BI?',
      options: [
        {
          id: 'a',
          text: 'Es un caso clásico de Paradoja de Simpson por cambio en el mix de tráfico (ej. entró mucho más volumen en el canal de menor conversión base). DA debe cuantificar el efecto mix vs. efecto tasa; BI debe exponer métricas normalizadas por mix en la capa semántica; DE debe asegurar que la dimensión de canal esté completa sin nulos.',
          correct: true,
        },
        {
          id: 'b',
          text: 'Es un error de corrupción de archivos Parquet. DE debe reconstruir todo el clúster Spark desde cero.',
          correct: false,
        },
        {
          id: 'c',
          text: 'Debemos promediar los porcentajes de Web y App Móvil con AVG(conversion_rate) para que el número global suba.',
          correct: false,
        },
      ],
    },
  },
  {
    id: 'mod-2-duckdb-arrow',
    number: 2,
    shortTitle: '2. DuckDB, Polars & Arrow',
    title: 'Motores Columnar In-Process, Apache Arrow y Formatos de Nueva Generación',
    subtitle: 'DuckDB 1.x+, Polars, Apache Arrow Zero-Copy, Parquet v2, Lance y Vortex para Cargas Mixtas',
    eraTag: 'Motor Vectorizado · Actual',
    defaultSim: {
      partitionGranularity: 85,
      compressionRatio: 90,
      sampleSizeK: 250,
      cacheHitRate: 88,
    },
    diagram: {
      title: 'Ejecución Vectorizada SIMD y Intercambio Zero-Copy vía Apache Arrow',
      sourceLabel: 'Parquet v2 / Vortex / Lance',
      engineLabel: 'Apache Arrow (RAM Columnar)',
      partitions: [
        { id: 'p1', name: 'RowGroup_01 (ZoneMap Min/Max)', rows: '1.04M', status: 'scanned', detail: 'Vectorizado en lotes de 2048 tuplas en caché L1/L2 CPU' },
        { id: 'p2', name: 'RowGroup_02 (Bloom Filter)', rows: '1.04M', status: 'pruned', detail: 'Saltado sin descomprimir gracias al Bloom Filter en cabecera' },
        { id: 'p3', name: 'Arrow IPC Buffer (Zero-Copy)', rows: '2.08M', status: 'scanned', detail: 'Compartido entre DuckDB y Polars sin serialización' },
        { id: 'p4', name: 'DuckDB-Wasm Browser Cache', rows: '520K', status: 'scanned', detail: 'Subconjunto servido por HTTP Range Requests al cliente BI' },
      ],
      sinkLabel: 'Polars DA / DuckDB-Wasm BI',
    },
    perspectives: {
      '360': {
        heading: 'La revolución Single-Node y Zero-Copy entre DE, DA y BI',
        summary:
          'El 95% de los data warehouses corporativos tienen menos de 1 TB de datos calientes. En 2026, levantar un clúster distribuido pesado para procesar 50 GB es un antipatrón costoso: DuckDB y Polars procesan cientos de millones de filas en segundos en una sola máquina usando ejecución vectorizada SIMD, fuera de memoria (out-of-core) y buffers de memoria compartida Apache Arrow.',
        bulletPoints: [
          'DE utiliza DuckDB y Polars en contenedores ligeros (sin JVM ni overhead de red shuffle) para transformar archivos Parquet/Iceberg a una fracción del costo cloud.',
          'DA reemplaza Pandas tradicional por Polars (LazyFrames optimizados en Rust) y cuadernos reactivos Marimo sin estado oculto.',
          'BI aprovecha DuckDB-Wasm en el navegador para filtrar, agrupar y renderizar millones de puntos a 60 FPS con latencia de red cero.',
        ],
      },
      DE: {
        heading: 'Ingeniería (DE): Anatomía interna de Parquet v2, Vortex y Lance',
        summary:
          'Para que un motor columnar vuele, el ingeniero de datos debe diseñar el layout físico de los archivos. Un archivo Parquet mal escrito (sin ordenamiento previo o con Row Groups gigantes de 1 GB) impide el predicate pushdown. Además, en 2026 han emergido formatos como Vortex (compresión extensible ultra-rápida) y Lance (acceso aleatorio O(1) ideal para tensores, imágenes y embeddings de IA).',
        bulletPoints: [
          'Tamaño óptimo de Row Group en Parquet: entre 128 MB y 256 MB (o ~1 millón de filas) con Page Index y Bloom Filters activados para columnas de alta cardinalidad (UUIDs).',
          'Apache Arrow elimina el costo de serialización/deserialización (que antes consumía hasta el 70% del CPU entre procesos Python, R y motores SQL).',
          'Out-of-core execution en DuckDB permite ejecutar joins y agregaciones mayores que la RAM disponible volcando bloques comprimidos a NVMe local.',
        ],
      },
      DA: {
        heading: 'Análisis (DA): Polars Lazy API, Expresiones Paralelas y Notebooks Marimo',
        summary:
          'El mayor problema de los notebooks tradicionales (Jupyter + Pandas) era el estado mutable oculto (ejecutar la celda 8 antes que la 3) y la ejecución fila por fila en un solo hilo. En 2026, el estándar para análisis en Python es Polars (modo Lazy con optimizador de planes de consulta) dentro de notebooks reactivos Marimo (donde cambiar una variable recalcula automáticamente el DAG de celdas dependientes).',
        bulletPoints: [
          'Usa siempre pl.scan_parquet() en lugar de pl.read_parquet() para permitir projection pushdown (leer solo las columnas necesarias) y predicate pushdown.',
          'Interoperabilidad instantánea: duckdb.sql("SELECT * FROM mi_polars_df") lee el DataFrame de Polars en cero copias vía punteros de memoria Arrow.',
          'Expresiones vectorizadas (.over() en Polars) equivalen a Window Functions SQL con paralelismo automático multi-core.',
        ],
      },
      BI: {
        heading: 'Business Intelligence (BI): BI In-Browser con DuckDB-Wasm y Mosaic',
        summary:
          '¿Por qué esperar 4 segundos a que un servidor BI remoto ejecute una consulta cada vez que el ejecutivo mueve un deslizador de fechas? Las herramientas modernas de BI (Observable Framework, Evidence.dev, Rill, Mosaic) descargan fragmentos Parquet compactos al navegador y ejecutan cruces cruzados (cross-filtering) localmente en milisegundos con DuckDB-Wasm.',
        bulletPoints: [
          'HTTP Range Requests permiten a DuckDB-Wasm leer únicamente el footer del Parquet remoto y descargar solo los megabytes de las columnas y particiones solicitadas.',
          'Arquitectura híbrida: agregaciones pesadas de terabytes en el servidor DuckDB/ClickHouse; cubos agregados de 5-50 MB en el cliente para interactividad instantánea.',
          'Ahorro drástico en facturación de almacenes cloud (Snowflake/BigQuery) al evitar miles de micro-consultas repetitivas de dashboards.',
        ],
      },
    },
    relatedConnections: [
      {
        targetModuleId: 'mod-3-iceberg-lakehouse',
        discipline: 'DE',
        title: 'Apache Iceberg v3 sobre Parquet/Vortex',
        connection: 'Cómo organizar miles de archivos Parquet individuales en una tabla transaccional ACID con snapshots y metadatos.',
      },
      {
        targetModuleId: 'mod-7-bi-as-code',
        discipline: 'BI',
        title: 'BI-as-Code con Evidence y Observable',
        connection: 'Cómo construir reportes interactivos versionados en Git impulsados por DuckDB-Wasm.',
      },
      {
        targetModuleId: 'mod-8-ai-mcp-agents',
        discipline: 'DA',
        title: 'Formato Lance para Embeddings e IA Multimodal',
        connection: 'Por qué Parquet sufre en búsquedas vectoriales aleatorias y cómo Lance/Vortex aceleran los pipelines de IA.',
      },
    ],
    codeSamples: {
      DE: `-- [DE] DuckDB 1.x: Escritura Parquet optimizada con ZSTD, Bloom Filters y Row Group preciso
PRAGMA memory_limit = '12GB';
PRAGMA threads = 8;

COPY (
  SELECT
    order_id,
    customer_id,
    region_code,
    order_timestamp,
    total_usd
  FROM read_parquet('s3://raw-zone/orders_2026_*.parquet')
  ORDER BY region_code, DATE_TRUNC('day', order_timestamp), customer_id
) TO 's3://lakehouse-silver/orders_optimized.parquet' (
  FORMAT PARQUET,
  COMPRESSION 'ZSTD',
  COMPRESSION_LEVEL 3,
  ROW_GROUP_SIZE 1048576
);`,
      DA: `# [DA] Python 2026: Polars LazyFrame + DuckDB Zero-Copy vía Apache Arrow
import polars as pl
import duckdb

# 1. Lazy scan con pushdown de predicados y columnas (no carga todo en RAM)
lf_events = (
    pl.scan_parquet("s3://lakehouse-silver/orders_optimized.parquet")
    .filter(pl.col("order_timestamp") >= pl.lit("2026-01-01").str.to_datetime())
    .with_columns([
        (pl.col("total_usd") - pl.col("total_usd").mean().over("region_code"))
        .alias("diff_from_regional_mean")
    ])
)

# 2. Consulta directa desde DuckDB sobre el flujo Arrow sin copiar memoria
arrow_rel = lf_events.collect(engine="streaming").to_arrow()
res = duckdb.sql("""
    SELECT region_code,
           COUNT(*) AS n_orders,
           QUANTILE_CONT(total_usd, [0.5, 0.9, 0.99]) AS p50_p90_p99
    FROM arrow_rel
    GROUP BY region_code
""").pl()
print(res)`,
      BI: `-- [BI] Consulta Cross-Filter en DuckDB-Wasm para Dashboard Interactivo a 60 FPS
SELECT
  DATE_TRUNC('week', order_timestamp) AS week_start,
  region_code,
  COUNT(*) AS orders_count,
  SUM(total_usd) AS revenue_usd,
  AVG(total_usd) FILTER (WHERE is_repeat_buyer) AS repeat_aov_usd
FROM 'https://cdn.empresa.internal/gold/orders_2026_cube.parquet'
WHERE order_timestamp BETWEEN '2026-07-01' AND '2026-10-28'
GROUP BY ALL
ORDER BY week_start ASC;`,
    },
    cohortData: [
      { label: '1 Columna (Proj)', value: 98.5, segmentA: 99, segmentB: 94 },
      { label: 'Filtro ZoneMap', value: 92.1, segmentA: 95, segmentB: 86 },
      { label: 'Bloom Filter UUID', value: 86.4, segmentA: 90, segmentB: 78 },
      { label: 'Arrow Zero-Copy', value: 79.0, segmentA: 84, segmentB: 71 },
      { label: 'Vectorizado SIMD', value: 68.5, segmentA: 73, segmentB: 60 },
      { label: 'Out-of-Core NVMe', value: 45.2, segmentA: 52, segmentB: 38 },
    ],
    kpis: [
      { label: 'Throughput Escaneo SIMD', baseValue: 14.8, unit: 'GB/s', series: [4.2, 6.8, 8.9, 10.5, 12.1, 13.6, 14.8] },
      { label: 'Ahorro RAM Zero-Copy', baseValue: 74.0, unit: '%', series: [40, 48, 55, 62, 68, 71, 74.0] },
      { label: 'Tiempo Cross-Filter BI', baseValue: 18, unit: 'ms', series: [180, 120, 85, 52, 34, 24, 18] },
      { label: 'Reducción Costo Cloud', baseValue: 68.5, unit: '%', series: [25, 38, 46, 54, 60, 65, 68.5] },
    ],
    quiz: {
      question:
        'Un analista ejecuta pl.read_parquet("s3://bucket/tabla_80gb.parquet") en su máquina de 16 GB de RAM para filtrar solo las ventas de ayer de 2 columnas, y el proceso muere por Out-Of-Memory (OOM). ¿Cuál es la solución correcta?',
      options: [
        {
          id: 'a',
          text: 'Cambiar pl.read_parquet() por pl.scan_parquet() (o usar DuckDB directo sobre S3) para activar Projection Pushdown (leer solo las 2 columnas) y Predicate Pushdown (usar los Zone Maps de Parquet para descargar solo los Row Groups de ayer).',
          correct: true,
        },
        {
          id: 'b',
          text: 'Convertir primero el archivo Parquet de 80 GB a formato CSV para que ocupe menos memoria al parsear.',
          correct: false,
        },
        {
          id: 'c',
          text: 'Hacer un bucle for fila por fila en Python puro leyendo el archivo completo.',
          correct: false,
        },
      ],
    },
  },
  {
    id: 'mod-3-iceberg-lakehouse',
    number: 3,
    shortTitle: '3. Apache Iceberg v3 Lakehouse',
    title: 'Open Lakehouse 2026: Apache Iceberg v3, UniForm y Catálogos REST',
    subtitle: 'Deletion Vectors, Row-Level Lineage, Tipo Variant, Hidden Partitioning y Catálogos Polaris / Unity',
    eraTag: 'Estándar Lakehouse · Actual',
    defaultSim: {
      partitionGranularity: 92,
      compressionRatio: 88,
      sampleSizeK: 500,
      cacheHitRate: 85,
    },
    diagram: {
      title: 'Arquitectura Apache Iceberg v3: Catálogo REST → Metadata Tree → Deletion Vectors',
      sourceLabel: 'Catálogo REST (Polaris/Unity)',
      engineLabel: 'Iceberg v3 Snapshot #409',
      partitions: [
        { id: 'p1', name: 'Manifest List (Avro)', rows: '14 Manifests', status: 'scanned', detail: 'Filtra particiones enteras usando rangos de resumen' },
        { id: 'p2', name: 'DataFile_A.parquet + DV.puffin', rows: '4.1M (-12K DV)', status: 'scanned', detail: 'Deletion Vector bitmap en archivo Puffin evita reescribir Parquet' },
        { id: 'p3', name: 'DataFile_B.parquet (2026-08)', rows: '3.8M', status: 'pruned', detail: 'Podado por Hidden Partitioning days(event_ts)' },
        { id: 'p4', name: 'Variant Column (Semi-Struct)', rows: '4.1M', status: 'scanned', detail: 'JSON sub-columnarizado nativo en especificación Iceberg v3' },
      ],
      sinkLabel: 'Spark / DuckDB / Trino / BI Directo',
    },
    perspectives: {
      '360': {
        heading: 'Apache Iceberg v3: Un único almacenamiento abierto para todos los motores',
        summary:
          'Hasta hace pocos años, cada almacén de datos encerraba tus tablas en un formato propietario. En producción, Apache Iceberg v3 (junto con Delta Lake UniForm) ha consolidado la era del Open Lakehouse: almacenas los datos una sola vez en almacenamiento de objetos (S3/GCS/ADLS) y cualquier motor —Spark, Flink, DuckDB, Trino, Snowflake, BigQuery o Power BI Direct Lake— los lee y escribe con garantías ACID.',
        bulletPoints: [
          'DE gestiona el ciclo de vida con especificaciones Iceberg v3: Deletion Vectors binarios (en archivos Puffin), linaje a nivel de fila (_row_id) y evolución de particiones sin reescribir tablas.',
          'DA utiliza Time Travel (FOR SYSTEM_TIME AS OF) para reproducir exactamente el estado de los datos con el que se entrenó un modelo o se presentó un análisis mensual.',
          'BI se conecta en modo Direct Lake / Zero-Copy al catálogo REST (Apache Polaris, Unity Catalog o Gravitino) eliminando los extractos obsoletos.',
        ],
      },
      DE: {
        heading: 'Ingeniería (DE): Novedades clave de la especificación Apache Iceberg v3',
        summary:
          'La especificación v3 de Apache Iceberg resuelve los mayores cuellos de botella de v2: reemplaza los positional delete files dispersos por Deletion Vectors (bitmaps Roaring almacenados en archivos Puffin con garantía de cuando mucho un vector por archivo de datos), introduce el tipo de dato Variant para JSON semi-estructurado rápido, valores por defecto en evolución de esquema y Row-Level Lineage nativo para cambios incrementales.',
        bulletPoints: [
          'Hidden Partitioning y Partition Evolution: el usuario filtra por WHERE event_ts >= "2026-10-01" sin saber si la tabla estuvo particionada por mes en 2025 y por día en 2026.',
          'Mantenimiento automatizado: compactación bin-packing, ordenamiento Z-Order y expiración de snapshots antiguos (expire_snapshots) para controlar costos de S3.',
          'Catálogos REST con credenciales efímeras (Vended Credentials) y soporte de ramas tipo Git (WAP: Write-Audit-Publish).',
        ],
      },
      DA: {
        heading: 'Análisis (DA): Reproducibilidad Científica con Time Travel y Tipo Variant',
        summary:
          '¿Alguna vez un director preguntó por qué el reporte del martes pasado daba un número distinto al de hoy? Con Iceberg v3, el analista puede consultar cualquier snapshot histórico o comparar con un solo diff qué filas cambiaron gracias al seguimiento nativo de linaje por fila (_row_id y _last_updated_sequence_number).',
        bulletPoints: [
          'Consulta de auditoría temporal: SELECT * FROM gold.subscriptions FOR SYSTEM_TIME AS OF TIMESTAMP "2026-10-15 09:00:00".',
          'Exploración de payloads JSON de eventos móviles o webhooks usando el tipo Variant sin sufrir la lentitud de parsear strings de texto completo.',
          'Aislamiento en ramas de análisis: crear un branch ligero sin copiar archivos físicos para probar hipótesis de limpieza de datos.',
        ],
      },
      BI: {
        heading: 'Business Intelligence (BI): Direct Lake y el fin de los cubos desconectados',
        summary:
          'Tradicionalmente, BI requería programar recargas nocturnas ("Import Mode" o "Extracts") que duplicaban los datos del Lakehouse en servidores propietarios de BI. En 2026, arquitecturas como Direct Lake y motores aceleradores leen directamente las tablas Iceberg v3 desde el catálogo REST, respetando las políticas de seguridad a nivel de fila (RLS) y columna (CLS) definidas en un solo lugar.',
        bulletPoints: [
          'Gobernanza unificada en el Catálogo REST: un permiso revocado en Unity Catalog o Apache Polaris se aplica instantáneamente en SQL, Python y BI.',
          'La compactación frecuente de Deletion Vectors por parte de DE mantiene los tiempos de respuesta del dashboard BI por debajo de 200ms.',
          'Patrón Write-Audit-Publish (WAP): los dashboards de producción nunca ven datos a medio cargar porque el nuevo snapshot solo se publica en la rama main tras pasar todos los tests de calidad.',
        ],
      },
    },
    relatedConnections: [
      {
        targetModuleId: 'mod-2-duckdb-arrow',
        discipline: 'DE',
        title: 'Archivos Parquet y Estadísticas Puffin',
        connection: 'Iceberg v3 utiliza archivos Parquet/Vortex como capa de datos y archivos Puffin para índices secundarios y Deletion Vectors.',
      },
      {
        targetModuleId: 'mod-5-streaming-flink',
        discipline: 'DE',
        title: 'Streaming Upserts hacia Iceberg v3',
        connection: 'Cómo Apache Flink escribe flujos continuos en Iceberg usando Deletion Vectors sin degradar las lecturas de BI.',
      },
      {
        targetModuleId: 'mod-4-dbt-semantic',
        discipline: 'BI',
        title: 'Patrón Write-Audit-Publish con SQLMesh/dbt',
        connection: 'Cómo validar contratos de datos antes de hacer merge de la rama de ingesta en el catálogo Iceberg.',
      },
    ],
    codeSamples: {
      DE: `-- [DE] DDL Apache Iceberg v3 (Format Version 3) con Hidden Partitioning y Variant
CREATE TABLE catalog_polaris.silver.telemetry_events (
  event_id UUID NOT NULL,
  customer_id BIGINT NOT NULL,
  event_ts TIMESTAMP WITH TIME ZONE NOT NULL,
  device_payload VARIANT,
  revenue_cents BIGINT DEFAULT 0
)
USING iceberg
PARTITIONED BY (days(event_ts), bucket(16, customer_id))
TBLPROPERTIES (
  'format-version' = '3',
  'write.delete.mode' = 'merge-on-read',
  'write.update.mode' = 'merge-on-read',
  'write.parquet.compression-codec' = 'zstd',
  'commit.retry.num-retries' = '8'
);`,
      DA: `-- [DA] Auditoría Reproducible con Time Travel y Extracción Semi-Estructurada Variant
WITH snapshot_before AS (
  SELECT customer_id, SUM(revenue_cents) / 100.0 AS rev_usd
  FROM catalog_polaris.silver.telemetry_events
  FOR SYSTEM_TIME AS OF TIMESTAMP '2026-10-20 00:00:00Z'
  GROUP BY customer_id
),
snapshot_now AS (
  SELECT
    customer_id,
    device_payload:os_version::STRING AS os_version,
    SUM(revenue_cents) / 100.0 AS rev_usd
  FROM catalog_polaris.silver.telemetry_events
  GROUP BY customer_id, device_payload:os_version::STRING
)
SELECT
  n.os_version,
  COUNT(*) AS affected_customers,
  ROUND(SUM(n.rev_usd - COALESCE(b.rev_usd, 0)), 2) AS net_delta_usd
FROM snapshot_now n
LEFT JOIN snapshot_before b USING (customer_id)
GROUP BY n.os_version
ORDER BY net_delta_usd DESC;`,
      BI: `-- [BI] Consulta Zero-Copy sobre Rama Auditada (WAP) con Estadísticas Puffin
SELECT
  DATE_TRUNC('day', event_ts) AS metric_date,
  device_payload:country_iso::STRING AS country,
  APPROX_COUNT_DISTINCT(customer_id) AS dau_theta_sketch,
  SUM(revenue_cents) / 100.0 AS daily_gross_revenue_usd
FROM catalog_polaris.silver.telemetry_events
WHERE event_ts >= CURRENT_DATE - INTERVAL '30' DAY
GROUP BY 1, 2
ORDER BY metric_date DESC, daily_gross_revenue_usd DESC;`,
    },
    cohortData: [
      { label: 'Metadata Pruning', value: 96.2, segmentA: 98, segmentB: 91 },
      { label: 'Deletion Vectors v3', value: 89.4, segmentA: 93, segmentB: 79 },
      { label: 'Variant Shredding', value: 83.1, segmentA: 87, segmentB: 72 },
      { label: 'Row Lineage Diff', value: 78.5, segmentA: 82, segmentB: 68 },
      { label: 'Branch WAP Isolation', value: 74.0, segmentA: 78, segmentB: 65 },
      { label: 'REST Vended Creds', value: 69.8, segmentA: 74, segmentB: 61 },
    ],
    kpis: [
      { label: 'Archivos Parquet Podados', baseValue: 96.2, unit: '%', series: [78, 82, 86, 90, 93, 95, 96.2] },
      { label: 'Overhead Merge-on-Read', baseValue: 4.1, unit: '%', series: [19.5, 15.2, 11.4, 8.8, 6.2, 4.9, 4.1] },
      { label: 'Reproducibilidad Auditoría', baseValue: 100, unit: '%', series: [100, 100, 100, 100, 100, 100, 100] },
      { label: 'Frescura Direct Lake BI', baseValue: 12, unit: 'seg', series: [180, 120, 65, 38, 24, 16, 12] },
    ],
    quiz: {
      question:
        'Necesitas cambiar la estrategia de particionado de una tabla de 40 TB de mensual (months(ts)) a diaria (days(ts)) porque las consultas de BI filtran por rangos de 3 días. En Apache Iceberg v3, ¿qué ocurre al ejecutar ALTER TABLE ... ADD PARTITION FIELD days(ts)?',
      options: [
        {
          id: 'a',
          text: 'Gracias a Partition Evolution y Hidden Partitioning, es una operación de metadatos instantánea: no hay que reescribir los 40 TB históricos; los datos antiguos se siguen leyendo con el layout mensual y los nuevos se escriben por día de forma transparente para DA y BI.',
          correct: true,
        },
        {
          id: 'b',
          text: 'La tabla queda bloqueada durante 18 horas mientras se reescriben todos los archivos Parquet desde el año 2021.',
          correct: false,
        },
        {
          id: 'c',
          text: 'Todas las consultas SQL de los dashboards de BI se rompen porque hay que añadir una columna física nueva en el WHERE.',
          correct: false,
        },
      ],
    },
  },
  {
    id: 'mod-4-dbt-semantic',
    number: 4,
    shortTitle: '4. dbt, SQLMesh & Semantic Layer',
    title: 'Transformación Semántica, Data Contracts (ODCS) y Gobernanza Activa',
    subtitle: 'SQLMesh Virtual Data Environments, dbt Core/Cloud, Contratos ODCS v3, OpenLineage y MetricFlow',
    eraTag: 'Gobernanza & Semántica · Actual',
    defaultSim: {
      partitionGranularity: 88,
      compressionRatio: 82,
      sampleSizeK: 320,
      cacheHitRate: 91,
    },
    diagram: {
      title: 'Pipeline Gobernado: Data Contract (ODCS) → SQLMesh / dbt DAG → Capa Semántica Unificada',
      sourceLabel: 'Data Contract (ODCS v3)',
      engineLabel: 'SQLMesh / dbt Transform DAG',
      partitions: [
        { id: 'p1', name: 'contract_checkout_v2.yaml', rows: 'SLA 99.9%', status: 'scanned', detail: 'Valida esquema, semántica y umbrales de nulos antes de ingerir' },
        { id: 'p2', name: 'stg_payments (Incremental)', rows: '18.4M', status: 'scanned', detail: 'Entorno virtual SQLMesh mediante punteros de vista sin clonar tabla' },
        { id: 'p3', name: 'int_churn_historical', rows: '94M', status: 'pruned', detail: 'No recalculado: AST SQL detecta que el cambio es no-destructivo' },
        { id: 'p4', name: 'semantic_metrics (MetricFlow)', rows: '42 KPIs', status: 'scanned', detail: 'Expuesto por igual a BI, Notebooks DA y Agentes MCP' },
      ],
      sinkLabel: 'BI + Notebooks DA + Agentes IA',
    },
    perspectives: {
      '360': {
        heading: 'El puente definitivo entre productores de software, ingenieros, analistas y BI',
        summary:
          'Dos revoluciones definen la capa de transformación en 2026: primero, los Data Contracts (bajo el estándar abierto ODCS - Open Data Contract Standard) impiden que un cambio en un microservicio rompa silenciosamente los reportes financieros; segundo, herramientas como SQLMesh y dbt con su Capa Semántica garantizan que cambios de código se prueben sin duplicar terabytes y que cada métrica de negocio tenga una única definición matemática.',
        bulletPoints: [
          'DE implementa Data Contracts ejecutables en CI/CD y utiliza SQLMesh / dbt para orquestar transformaciones incrementales por rangos de tiempo idempotentes.',
          'DA consume datasets certificados con linaje a nivel de columna (OpenLineage) sabiendo exactamente qué supuestos de limpieza se aplicaron.',
          'BI y los Agentes IA consultan la Capa Semántica (MetricFlow / Cube), eliminando las discrepancias donde Marketing y Finanzas reportan cifras distintas de ingresos.',
        ],
      },
      DE: {
        heading: 'Ingeniería (DE): SQLMesh vs. dbt y Data Contracts (ODCS)',
        summary:
          'Mientras dbt popularizó tratar las transformaciones SQL como ingeniería de software, SQLMesh introdujo en la industria el análisis del árbol sintáctico abstracto (AST) del SQL (vía SQLGlot) y los Entornos Virtuales de Datos. Cuando creas una rama dev, SQLMesh comprende semánticamente qué columnas cambiaste, recalcula únicamente los intervalos afectados una sola vez y promueve a producción intercambiando punteros de vistas en milisegundos.',
        bulletPoints: [
          'Prevención de brechas y duplicados en modelos incrementales mediante seguimiento de intervalos temporales (State-based interval tracking).',
          'Transpilación automática SQLGlot: escribe un modelo en dialecto DuckDB para tests unitarios locales instantáneos y despliega en Spark/Snowflake/Trino sin cambiar una línea.',
          'Data Contracts (ODCS v3): acuerdo formal versionado en Git entre el equipo de backend y el de datos que define esquema, SLAs de frescura y reglas de calidad.',
        ],
      },
      DA: {
        heading: 'Análisis (DA): Linaje a nivel de columna y Tests de Anomalías Estadísticas',
        summary:
          'Los tests unitarios simples (not_null, unique) no bastan cuando la tasa de conversión cae un 40% porque una pasarela de pago en Brasil dejó de enviar eventos. Los analistas colaboran con ingeniería definiendo pruebas estadísticas de distribución (Z-score móvil, divergencia KL, volumen por segmento) directamente en el pipeline.',
        bulletPoints: [
          'Antes de modificar una lógica de atribución, el linaje a nivel de columna (Column-Level Lineage) muestra qué modelos de ML, notebooks y dashboards de BI dependen de esa columna.',
          'Uso de semillas y tests unitarios deterministas en SQL para validar casos borde (reembolsos parciales, cambios de huso horario, años bisiestos).',
          'Acceso programático desde Python a las métricas de la Capa Semántica para garantizar que el análisis ad-hoc parta de las mismas cifras oficiales del comité.',
        ],
      },
      BI: {
        heading: 'Business Intelligence (BI): La Capa Semántica como Fuente Única de Verdad',
        summary:
          'Cuando la lógica de negocio vive copiada dentro de 80 archivos .pbix de Power BI o tableros aislados, la organización sufre de "caos métrico". La Capa Semántica (dbt Semantic Layer / MetricFlow o Cube) extrae las medidas, dimensiones, jerarquías temporales y joins hacia un servidor central consultable vía SQL, REST, GraphQL o MCP.',
        bulletPoints: [
          'Cero lógica duplicada: si la definición de "Cliente Activo" cambia de 30 a 28 días, se actualiza en un solo archivo YAML y todos los dashboards de BI y bots de IA se actualizan al instante.',
          'Pre-agregaciones declarativas (Rollups/Caching): acelera dashboards ejecutivos reduciendo la carga sobre el Lakehouse en un 90%.',
          'Auditoría transparente: cada tarjeta de KPI en el dashboard muestra un tooltip con la fórmula exacta, el propietario del contrato y la hora del último test superado.',
        ],
      },
    },
    relatedConnections: [
      {
        targetModuleId: 'mod-1-sql-modeling',
        discipline: 'DE',
        title: 'Dimensiones Conformadas y Hechos',
        connection: 'La Capa Semántica requiere un modelo dimensional limpio (Módulo 1) para construir su grafo de entidades.',
      },
      {
        targetModuleId: 'mod-8-ai-mcp-agents',
        discipline: 'BI',
        title: 'Text-to-Semantic-Layer vía MCP',
        connection: 'Por qué conectar un Agente IA a la Capa Semántica reduce las alucinaciones de datos del 35% a menos del 1%.',
      },
      {
        targetModuleId: 'mod-7-bi-as-code',
        discipline: 'BI',
        title: 'Dashboards Versionados en Git',
        connection: 'Cómo integrar los tests de contratos y la capa semántica con el despliegue continuo de reportes BI-as-Code.',
      },
    ],
    codeSamples: {
      DE: `-- [DE] Modelo SQLMesh Incremental por Rango de Tiempo con Auditoría Integrada
MODEL (
  name silver.fct_subscription_mrr,
  kind INCREMENTAL_BY_TIME_RANGE (
    time_column event_date,
    batch_size 30
  ),
  owner 'data-platform@empresa.io',
  cron '@hourly',
  audits (
    not_null(columns := (subscription_id, customer_id, mrr_cents)),
    positive_values(column := mrr_cents)
  )
);

SELECT
  subscription_id,
  customer_id,
  CAST(event_ts AS DATE) AS event_date,
  plan_tier,
  mrr_cents
FROM bronze.stripe_subscription_events
WHERE event_ts BETWEEN @start_ts AND @end_ts;`,
      DA: `-- [DA] Test de Anomalía Estadística (Z-Score Robusto con Mediana y MAD) sobre Ingesta
WITH daily_stats AS (
  SELECT
    event_date,
    COUNT(*) AS daily_rows,
    SUM(mrr_cents) / 100.0 AS daily_mrr_usd
  FROM silver.fct_subscription_mrr
  WHERE event_date >= CURRENT_DATE - INTERVAL '60' DAY
  GROUP BY event_date
),
baseline AS (
  SELECT
    MEDIAN(daily_mrr_usd) AS med_mrr,
    MEDIAN(ABS(daily_mrr_usd - MEDIAN(daily_mrr_usd) OVER ())) AS mad_mrr
  FROM daily_stats
)
SELECT
  d.event_date,
  d.daily_mrr_usd,
  ROUND((d.daily_mrr_usd - b.med_mrr) / NULLIF(1.4826 * b.mad_mrr, 0), 2) AS robust_z_score
FROM daily_stats d
CROSS JOIN baseline b
ORDER BY d.event_date DESC
LIMIT 10;`,
      BI: `# [BI] Open Data Contract Standard (ODCS v3.0) + Métrica Gobernada
apiVersion: v3.0.0
kind: DataContract
id: urn:datacontract:billing:subscription_mrr
info:
  title: Contrato Oficial de MRR y Suscripciones
  version: 2.4.0
  owner: FinOps & Revenue Data Team
slaProperties:
  - property: latency
    value: 15
    unit: minutes
  - property: completeness
    value: 99.95
    unit: percent
schema:
  - name: subscription_id
    logicalType: string
    primaryKey: true
  - name: mrr_cents
    logicalType: integer
    quality:
      - type: sql
        query: "SELECT COUNT(*) FROM {table} WHERE mrr_cents < 0"
        mustBe: 0`,
    },
    cohortData: [
      { label: 'Contratos ODCS Pass', value: 99.8, segmentA: 100, segmentB: 99 },
      { label: 'Ahorro Compute Dev', value: 87.5, segmentA: 91, segmentB: 82 },
      { label: 'Cobertura Linaje Col', value: 95.0, segmentA: 97, segmentB: 91 },
      { label: 'Consistencia KPI BI', value: 100.0, segmentA: 100, segmentB: 100 },
      { label: 'Detección Anomalías', value: 91.2, segmentA: 94, segmentB: 86 },
      { label: 'Tests Unitarios SQL', value: 84.6, segmentA: 89, segmentB: 78 },
    ],
    kpis: [
      { label: 'Incidentes de Esquema Roto', baseValue: 0, unit: '/mes', series: [14, 11, 7, 4, 2, 0, 0] },
      { label: 'Tiempo Deploy Staging→Prod', baseValue: 1.4, unit: 'seg', series: [420, 180, 45, 12, 4.5, 2.1, 1.4] },
      { label: 'Métricas Certificadas BI', baseValue: 98.4, unit: '%', series: [62, 71, 79, 86, 92, 96, 98.4] },
      { label: 'Ahorro Clones Entorno Dev', baseValue: 87.5, unit: '%', series: [30, 45, 60, 72, 80, 84, 87.5] },
    ],
    quiz: {
      question:
        'Un desarrollador quiere probar un cambio en un modelo SQL intermedio del que dependen 25 tablas downstream de 2 TB cada una. ¿Cómo evita SQLMesh tener que reconstruir 50 TB en el entorno de desarrollo y volver a reconstruirlos al hacer merge a producción?',
      options: [
        {
          id: 'a',
          text: 'Analiza el AST de la consulta con SQLGlot para detectar el impacto exacto por columna, crea un Entorno Virtual basado en vistas/punteros sobre tablas versionadas por huella digital, y al hacer deploy a producción simplemente apunta la vista de producción a las tablas ya calculadas en dev.',
          correct: true,
        },
        {
          id: 'b',
          text: 'Copia los 50 TB a una carpeta temporal en el disco duro del portátil del desarrollador.',
          correct: false,
        },
        {
          id: 'c',
          text: 'Desactiva todas las pruebas en desarrollo y ejecuta directamente el código sin probar en producción.',
          correct: false,
        },
      ],
    },
  },
  {
    id: 'mod-5-streaming-flink',
    number: 5,
    shortTitle: '5. Flink, Arroyo & Streaming',
    title: 'Streaming Real-Time, CDC Zero-ETL y Vistas Materializadas Incrementales',
    subtitle: 'Kafka con Tiered Storage / WarpStream, Debezium CDC, Apache Flink, Arroyo (Rust) y Materialize / RisingWave',
    eraTag: 'Tiempo Real · Actual',
    defaultSim: {
      partitionGranularity: 80,
      compressionRatio: 79,
      sampleSizeK: 420,
      cacheHitRate: 93,
    },
    diagram: {
      title: 'Pipeline Streaming 2026: CDC Debezium → Kafka/WarpStream → Flink/Arroyo → Vista Materializada & Iceberg',
      sourceLabel: 'Postgres WAL (Debezium CDC)',
      engineLabel: 'Flink / Arroyo (State + Watermarks)',
      partitions: [
        { id: 'p1', name: 'Tumbling Window (5m EventTime)', rows: '84K ev/s', status: 'scanned', detail: 'Watermark con tolerancia out-of-order de 15 segundos' },
        { id: 'p2', name: 'RocksDB / SlateDB State Store', rows: '12 GB', status: 'scanned', detail: 'Checkpoints incrementales asíncronos hacia S3' },
        { id: 'p3', name: 'Late Events (>Watermark + TTL)', rows: '0.04%', status: 'pruned', detail: 'Desviados a Side Output de auditoría para reconciliación' },
        { id: 'p4', name: 'Materialize / RisingWave Sink', rows: 'Sub-100ms', status: 'scanned', detail: 'Mantenimiento diferencial de vistas SQL para BI operativo' },
      ],
      sinkLabel: 'Dashboard Operativo + Iceberg v3',
    },
    perspectives: {
      '360': {
        heading: 'Cuándo usar Streaming Real-Time y cómo conectarlo con Análisis y BI',
        summary:
          'El mayor error arquitectónico es construir streaming complejo para un reporte que nadie mira más que los lunes a las 9 AM. En 2026, aplicamos la regla de oro: usa Micro-Batch / Lakehouse incremental cuando la latencia aceptable sea >5 minutos, y usa Streaming con Estado (Apache Flink, Arroyo en Rust o bases de datos de vistas materializadas como Materialize y RisingWave) cuando una acción automatizada o un panel operativo requiera latencia sub-segundo.',
        bulletPoints: [
          'DE captura cambios desde las bases transaccionales sin impactar el rendimiento usando CDC basado en logs (Debezium sobre Postgres WAL / MySQL Binlog) y buses sin discos locales como WarpStream o Kafka Tiered Storage.',
          'DA distingue rigurosamente entre Event Time (cuándo ocurrió la acción en el móvil del usuario) y Processing Time (cuándo llegó al servidor tras recuperar cobertura), evitando sesgos en series temporales.',
          'BI conecta tableros operativos en vivo (Rill, Superset, Grafana, ClickHouse/Pinot) sobre vistas materializadas actualizadas diferencialmente.',
        ],
      },
      DE: {
        heading: 'Ingeniería (DE): Event Time, Watermarks, Estado y Buses BYOC (WarpStream)',
        summary:
          'En sistemas distribuidos, los eventos siempre llegan desordenados. Los Watermarks son el reloj lógico que indica al motor (Flink o Arroyo) que "no se esperan más eventos anteriores al instante T". Mientras tanto, arquitecturas de transporte como WarpStream y Kafka con Tiered Storage escriben directamente en S3/GCS eliminando los costos de replicación entre zonas de disponibilidad (AZ) y los discos EBS caros.',
        bulletPoints: [
          'Tipos de ventanas: Tumbling (fijas sin solape), Hopping/Sliding (con solape para medias móviles), Session (agrupadas por periodos de inactividad del usuario).',
          'Garantías Exactly-Once de extremo a extremo combinando offsets transaccionales de Kafka con checkpoints de dos fases (2PC) en el sink.',
          'Control del tamaño del estado (State TTL): un JOIN entre dos streams sin límite temporal agotará el disco o la memoria en días.',
        ],
      },
      DA: {
        heading: 'Análisis (DA): Detección de Anomalías Online y Sesgo por Eventos Tardíos',
        summary:
          'Si un analista mide las ventas de la última hora usando Processing Time en lugar de Event Time, cada caída temporal de una antena móvil o reintento de cola generará un falso valle seguido de un falso pico artificial. El análisis de series temporales en tiempo real exige algoritmos online de memoria acotada (T-Digest para percentiles, HyperLogLog para cardinalidad, EWMA para tendencias).',
        bulletPoints: [
          'Usa bocetos probabilísticos (DataSketches: Theta Sketch, HLL++, KLL Quantiles) para calcular usuarios únicos y percentiles p99 en tiempo real con <1% de error y memoria constante.',
          'Evalúa el trade-off entre completitud y latencia: esperar 2 minutos extra de watermark puede subir la completitud de eventos del 97.5% al 99.9%.',
          'Reconciliación híbrida (Lambda moderna simplificada sobre Iceberg): la vista en vivo sirve el último minuto y la tabla Iceberg consolida los eventos tardíos.',
        ],
      },
      BI: {
        heading: 'Business Intelligence (BI): BI Operativo vs. BI Estratégico',
        summary:
          'Un dashboard estratégico de dirección no debe parpadear cada medio segundo (genera fatiga cognitiva y reacciones impulsivas al ruido estadístico). El BI en tiempo real está diseñado para operaciones: centros logísticos, detección de fraude en pagos, equilibrio de oferta/demanda dinámica y monitoreo de campañas flash.',
        bulletPoints: [
          'Bases de datos de vistas materializadas en streaming (Materialize, RisingWave) permiten escribir SQL estándar complejo (con múltiples joins y subconsultas) y mantener el resultado actualizado al milisegundo.',
          'Para analítica interactiva de alta concurrencia (miles de usuarios filtrando a la vez), motores OLAP en tiempo real como ClickHouse, Apache Pinot o StarRocks complementan al Lakehouse.',
          'Incluye siempre en el dashboard un indicador visual de "Watermark / Frescura de Datos" para que el operador sepa hasta qué segundo exacto está completa la ventana.',
        ],
      },
    },
    relatedConnections: [
      {
        targetModuleId: 'mod-3-iceberg-lakehouse',
        discipline: 'DE',
        title: 'Streaming Sink hacia Apache Iceberg v3',
        connection: 'Cómo aterrizar el mismo flujo de Kafka/Flink en tablas Iceberg v3 mediante Deletion Vectors y compactación continua.',
      },
      {
        targetModuleId: 'mod-6-statistical-da',
        discipline: 'DA',
        title: 'Detección de Anomalías y Ruido Estadístico',
        connection: 'Cómo distinguir una caída real del negocio de una fluctuación aleatoria normal en ventanas de 5 minutos.',
      },
      {
        targetModuleId: 'mod-7-bi-as-code',
        discipline: 'BI',
        title: 'Diseño de Alertas y Tableros Operativos',
        connection: 'Cómo presentar flujos en vivo sin sobrecarga visual usando bandas de control estadístico.',
      },
    ],
    codeSamples: {
      DE: `-- [DE] Flink SQL / Arroyo 2026: Ventana Tumbling con Watermark y Estado Acotado
CREATE TABLE kafka_checkout_stream (
  order_id STRING,
  user_id BIGINT,
  merchant_id INT,
  amount_usd DECIMAL(10, 2),
  event_time TIMESTAMP(3),
  WATERMARK FOR event_time AS event_time - INTERVAL '15' SECOND
) WITH (
  'connector' = 'kafka',
  'topic' = 'prod.commerce.checkouts.v2',
  'scan.startup.mode' = 'latest-offset',
  'format' = 'avro-confluent'
);

SELECT
  window_start,
  window_end,
  merchant_id,
  COUNT(*) AS tx_count,
  SUM(amount_usd) AS window_gmv_usd
FROM TABLE(
  TUMBLE(TABLE kafka_checkout_stream, DESCRIPTOR(event_time), INTERVAL '5' MINUTES)
)
GROUP BY window_start, window_end, merchant_id;`,
      DA: `-- [DA] Materialize / RisingWave: Detección Continua de Anomalías en Pagos por Canal
CREATE MATERIALIZED VIEW mv_payment_anomaly_monitor AS
WITH window_metrics AS (
  SELECT
    payment_method,
    COUNT(*) FILTER (WHERE status = 'APPROVED') AS approved_cnt,
    COUNT(*) AS total_cnt,
    ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'APPROVED') / NULLIF(COUNT(*), 0), 2) AS approval_rate_pct
  FROM cdc_payments_stream
  WHERE mz_now() <= event_ts + INTERVAL '10 minutes'
  GROUP BY payment_method
)
SELECT
  payment_method,
  approved_cnt,
  total_cnt,
  approval_rate_pct,
  CASE
    WHEN total_cnt >= 50 AND approval_rate_pct < 75.0 THEN 'CRITICAL_DROP'
    WHEN total_cnt >= 50 AND approval_rate_pct < 85.0 THEN 'WARNING'
    ELSE 'HEALTHY'
  END AS operational_state
FROM window_metrics;`,
      BI: `-- [BI] ClickHouse / Pinot: Consulta Sub-50ms para Dashboard Operativo con Quantiles
SELECT
  toStartOfFiveMinutes(event_time) AS bucket_5m,
  country_code,
  uniqCombined64(user_id) AS active_buyers_hll,
  sum(amount_usd) AS gmv_usd,
  quantilesTDigest(0.5, 0.95, 0.99)(checkout_latency_ms) AS latency_p50_p95_p99
FROM realtime.checkout_events
WHERE event_time >= now() - INTERVAL 6 HOUR
GROUP BY bucket_5m, country_code
ORDER BY bucket_5m DESC;`,
    },
    cohortData: [
      { label: 'Watermark ≤ 5s', value: 94.2, segmentA: 96, segmentB: 89 },
      { label: 'Watermark ≤ 15s', value: 99.1, segmentA: 99, segmentB: 97 },
      { label: 'Checkpoint Incr.', value: 91.5, segmentA: 94, segmentB: 85 },
      { label: 'Vista Diferencial', value: 88.0, segmentA: 92, segmentB: 81 },
      { label: 'Ahorro Red BYOC', value: 82.4, segmentA: 86, segmentB: 75 },
      { label: 'State TTL Activo', value: 76.8, segmentA: 81, segmentB: 69 },
    ],
    kpis: [
      { label: 'Latencia End-to-End p99', baseValue: 210, unit: 'ms', series: [850, 620, 440, 330, 275, 235, 210] },
      { label: 'Completitud Ventana 15s', baseValue: 99.4, unit: '%', series: [92.1, 94.8, 96.5, 97.9, 98.6, 99.1, 99.4] },
      { label: 'Ahorro Tráfico Cross-AZ', baseValue: 82.4, unit: '%', series: [20, 42, 58, 69, 75, 79, 82.4] },
      { label: 'Throughput Eventos', baseValue: 125, unit: 'K/s', series: [45, 62, 78, 94, 108, 118, 125] },
    ],
    quiz: {
      question:
        'En un pipeline de Flink/Arroyo haces un INNER JOIN entre el stream de "clics en anuncios" y el stream de "compras completadas" sin definir una condición de ventana temporal ni un State TTL. ¿Qué ocurrirá en producción al cabo de unos días?',
      options: [
        {
          id: 'a',
          text: 'El estado interno crecerá indefinidamente porque el motor debe recordar cada clic de la historia por si algún día llega una compra asociada, agotando el almacenamiento de estado y haciendo fallar los checkpoints.',
          correct: true,
        },
        {
          id: 'b',
          text: 'Flink borrará automáticamente los datos al azar cada 3 segundos sin necesidad de configurarlo.',
          correct: false,
        },
        {
          id: 'c',
          text: 'El JOIN se convertirá automáticamente en una tabla de Excel.',
          correct: false,
        },
      ],
    },
  },
  {
    id: 'mod-6-statistical-da',
    number: 6,
    shortTitle: '6. Statistical A/B Testing & DA',
    title: 'Análisis de Datos Avanzado, Experimentación A/B (CUPED / Bayesiano) e Inferencia Causal',
    subtitle: 'Diseño Experimental, Reducción de Varianza CUPED, A/B Testing Bayesiano, Diff-in-Diff y Cohortes de LTV',
    eraTag: 'Rigor Analítico · Actual',
    defaultSim: {
      partitionGranularity: 86,
      compressionRatio: 81,
      sampleSizeK: 280,
      cacheHitRate: 89,
    },
    diagram: {
      title: 'Pipeline de Experimentación Científica: Asignación Determinista → Ajuste CUPED → Decisión con Métricas Guardia',
      sourceLabel: 'Hash Asignación (Murmur3)',
      engineLabel: 'Motor Experimental (CUPED + Bayes)',
      partitions: [
        { id: 'p1', name: 'Sample Ratio Mismatch (SRM Check)', rows: 'p = 0.84 (OK)', status: 'scanned', detail: 'Test Chi-cuadrado verifica división exacta 50.0% / 50.0%' },
        { id: 'p2', name: 'Covariable Pre-Experimento (CUPED)', rows: '-42% Varianza', status: 'scanned', detail: 'Usa actividad de los 14 días previos para acelerar convergencia' },
        { id: 'p3', name: 'Usuarios Bot / Outliers (>p99.9)', rows: '0.12% Winsorized', status: 'pruned', detail: 'Acotados para evitar que una sola cuenta distorsione la media' },
        { id: 'p4', name: 'Guardrail Metrics (Latencia & Cancel)', rows: 'Sin degradación', status: 'scanned', detail: 'Verifica que subir conversión no dañe retención ni latencia' },
      ],
      sinkLabel: 'Decisión Producto & BI',
    },
    perspectives: {
      '360': {
        heading: 'Por qué la experimentación rigurosa requiere a DE, DA y BI trabajando juntos',
        summary:
          'Lanzar una funcionalidad y mirar si "las ventas subieron esta semana" confunde correlación con causalidad (estacionalidad, campañas externas, clima). En 2026, las plataformas de experimentación modernas (como GrowthBook, Eppo o pipelines propios sobre el Lakehouse) unen a las tres disciplinas: DE construye el pipeline de asignación y exposición de eventos; DA aplica reducción de varianza (CUPED), pruebas secuenciales/bayesianas e inferencia causal; BI integra los resultados certificados en el cuadro de mando de producto.',
        bulletPoints: [
          'DE garantiza asignaciones deterministas sin fugas y registra eventos de exposición reales (solo contar usuarios que efectivamente vieron la variante).',
          'DA verifica primero Sample Ratio Mismatch (SRM), aplica CUPED para necesitar hasta un 50% menos de tráfico y usa Diferencias en Diferencias (Diff-in-Diff) cuando no es posible aleatorizar.',
          'BI presenta tanto la métrica objetivo (North Star) como las Métricas Guardia (Guardrails: tiempo de carga, tasa de reembolso, tickets de soporte) con intervalos de credibilidad.',
        ],
      },
      DE: {
        heading: 'Ingeniería (DE): Tablas de Exposición, Hashing Determinista y Velocidad de Cálculo',
        summary:
          'Si el pipeline de datos tarda 3 días en cruzar las exposiciones de experimentos con las métricas de ingresos, o si pierde el 2% de los eventos de telemetría en la variante B porque el nuevo código pesa más, el experimento queda invalidado por Sample Ratio Mismatch (SRM). DE automatiza el cálculo diario de matrices de covariables pre-experimento en el Lakehouse.',
        bulletPoints: [
          'Usa funciones hash rápidas y uniformes (MurmurHash3 o xxHash) con un salt único por experimento para evitar correlaciones entre experimentos simultáneos.',
          'Pre-computa una tabla silver.user_pre_experiment_covariates para que el ajuste CUPED se ejecute en SQL en segundos sobre decenas de millones de usuarios.',
          'Aísla los eventos de telemetría de experimentación con contratos estrictos para detectar SRM en las primeras 2 horas de lanzamiento.',
        ],
      },
      DA: {
        heading: 'Análisis (DA): El pecado del Peeking, CUPED e Inferencia Causal',
        summary:
          'Mirar el p-valor todos los días y detener el test A/B en cuanto baja de 0.05 ("peeking") infla la tasa de falsos positivos del 5% a más del 25%. Un analista de datos domina tres herramientas clave: Tests Secuenciales (mSPRT) o Bayesianos (Probabilidad de ser el mejor + Pérdida Esperada), reducción de varianza CUPED (Controlled-experiment Using Pre-Experiment Data) y métodos cuasi-experimentales (Diff-in-Diff, Synthetic Control) para mercados donde no puedes dividir usuarios.',
        bulletPoints: [
          'Fórmula CUPED: Y_ajustada = Y - θ(X - media(X)), donde X es la métrica del usuario antes del experimento y θ = Cov(Y, X) / Var(X). Reduce drásticamente el error estándar.',
          'Chequeo obligatorio #1: Test Chi-cuadrado de Sample Ratio Mismatch (SRM). Si planeaste 50/50 y observas 50.4% vs 49.6% con p < 0.001, hay un bug técnico y el resultado no es válido.',
          'Cuando evalúes métricas sesgadas (gasto por usuario), combina transformación logarítmica, winsorización o bootstrap estratificado.',
        ],
      },
      BI: {
        heading: 'Business Intelligence (BI): Visualización de Incertidumbre y Árboles de Impacto',
        summary:
          'Un gráfico de barras en BI que muestra "Variante B: +2.1%" sin barras de error ni intervalo de confianza engaña a los ejecutivos haciéndoles celebrar ruido aleatorio. Los dashboards de experimentación modernos representan distribuciones de densidad, intervalos de confianza al 95% y el impacto anualizado proyectado con su banda de incertidumbre.',
        bulletPoints: [
          'Nunca ocultes el intervalo de confianza: mostrar [+0.4%, +3.8%] comunica mucha más verdad ejecutiva que un único número aislado.',
          'Panel de Métricas Guardia obligatorio junto al KPI principal: ningún experimento se aprueba en el comité si sube conversión +1% pero aumenta las cancelaciones +3%.',
          'Registro histórico de experimentos en BI (Institutional Memory): documentar qué hipótesis funcionaron y cuáles fracasaron para guiar la hoja de ruta.',
        ],
      },
    },
    relatedConnections: [
      {
        targetModuleId: 'mod-1-sql-modeling',
        discipline: 'DA',
        title: 'Paradoja de Simpson y Cohortes',
        connection: 'Por qué los resultados de un experimento deben analizarse por cohortes y segmentos para detectar efectos heterogéneos (HTE).',
      },
      {
        targetModuleId: 'mod-4-dbt-semantic',
        discipline: 'BI',
        title: 'Métricas Certificadas en Capa Semántica',
        connection: 'Los experimentos A/B deben reutilizar exactamente las mismas definiciones de métricas de la Capa Semántica oficial.',
      },
      {
        targetModuleId: 'mod-7-bi-as-code',
        discipline: 'BI',
        title: 'Gráficos de Intervalos e Incertidumbre',
        connection: 'Cómo representar visualmente distribuciones posteriores bayesianas y bandas de confianza sin chartjunk.',
      },
    ],
    codeSamples: {
      DE: `-- [DE] Pipeline SQL para Matriz de Exposición y Covariable Pre-Experimento (CUPED)
CREATE OR REPLACE TABLE silver.exp_checkout_v4_users AS
WITH first_exposure AS (
  SELECT
    user_id,
    ARG_MIN(variant_id, exposure_ts) AS variant,
    MIN(exposure_ts) AS first_exposed_at
  FROM bronze.experiment_exposures
  WHERE experiment_key = 'checkout_one_click_2026_q4'
  GROUP BY user_id
)
SELECT
  e.user_id,
  e.variant,
  e.first_exposed_at,
  COALESCE(SUM(o.net_amount_usd) FILTER (
    WHERE o.event_ts BETWEEN e.first_exposed_at - INTERVAL '14' DAY AND e.first_exposed_at
  ), 0.0) AS pre_exp_revenue_14d,
  COALESCE(SUM(o.net_amount_usd) FILTER (
    WHERE o.event_ts > e.first_exposed_at
      AND o.event_ts <= e.first_exposed_at + INTERVAL '14' DAY
  ), 0.0) AS post_exp_revenue_14d
FROM first_exposure e
LEFT JOIN silver.fact_orders o ON e.user_id = o.customer_id
GROUP BY e.user_id, e.variant, e.first_exposed_at;`,
      DA: `-- [DA] Cálculo de Ajuste CUPED y Estadístico t en SQL Analítico (DuckDB)
WITH stats AS (
  SELECT
    COVAR_SAMP(post_exp_revenue_14d, pre_exp_revenue_14d)
      / NULLIF(VAR_SAMP(pre_exp_revenue_14d), 0) AS theta,
    AVG(pre_exp_revenue_14d) AS global_pre_mean
  FROM silver.exp_checkout_v4_users
),
cuped_users AS (
  SELECT
    u.variant,
    u.post_exp_revenue_14d AS raw_y,
    u.post_exp_revenue_14d - s.theta * (u.pre_exp_revenue_14d - s.global_pre_mean) AS cuped_y
  FROM silver.exp_checkout_v4_users u
  CROSS JOIN stats s
)
SELECT
  variant,
  COUNT(*) AS n_users,
  ROUND(AVG(raw_y), 4) AS mean_raw_usd,
  ROUND(AVG(cuped_y), 4) AS mean_cuped_usd,
  ROUND(STDDEV_SAMP(raw_y) / SQRT(COUNT(*)), 4) AS se_raw,
  ROUND(STDDEV_SAMP(cuped_y) / SQRT(COUNT(*)), 4) AS se_cuped_reduced
FROM cuped_users
GROUP BY variant;`,
      BI: `-- [BI] Tabla Resumen Ejecutiva del Experimento con Intervalos de Confianza 95%
WITH variant_agg AS (
  SELECT
    variant,
    COUNT(*) AS n,
    AVG(cuped_y) AS mean_val,
    VAR_SAMP(cuped_y) AS var_val
  FROM analytics.exp_checkout_v4_cuped
  GROUP BY variant
)
SELECT
  t.mean_val - c.mean_val AS absolute_lift_usd,
  ROUND(100.0 * (t.mean_val - c.mean_val) / c.mean_val, 2) AS relative_lift_pct,
  ROUND((t.mean_val - c.mean_val) - 1.96 * SQRT(t.var_val/t.n + c.var_val/c.n), 3) AS ci95_low_usd,
  ROUND((t.mean_val - c.mean_val) + 1.96 * SQRT(t.var_val/t.n + c.var_val/c.n), 3) AS ci95_high_usd
FROM variant_agg t
CROSS JOIN variant_agg c
WHERE t.variant = 'treatment' AND c.variant = 'control';`,
    },
    cohortData: [
      { label: 'Control (Base)', value: 100.0, segmentA: 100, segmentB: 100 },
      { label: 'Lift Bruto (+4.8%)', value: 84.5, segmentA: 88, segmentB: 79 },
      { label: 'Varianza c/ CUPED', value: 58.0, segmentA: 62, segmentB: 53 },
      { label: 'Prob. Bayes (B>A)', value: 97.4, segmentA: 98, segmentB: 95 },
      { label: 'Potencia (1 - β)', value: 91.0, segmentA: 93, segmentB: 87 },
      { label: 'Salud Guardrails', value: 99.2, segmentA: 99, segmentB: 98 },
    ],
    kpis: [
      { label: 'Reducción Varianza CUPED', baseValue: 42.6, unit: '%', series: [18, 24, 29, 34, 38, 40.5, 42.6] },
      { label: 'Probabilidad Bayes (B > A)', baseValue: 97.4, unit: '%', series: [54, 68, 79, 86, 92, 95.8, 97.4] },
      { label: 'Lift Relativo Ingreso/Usuario', baseValue: 4.82, unit: '%', series: [3.1, 3.9, 4.2, 4.5, 4.6, 4.75, 4.82] },
      { label: 'Ahorro Duración Experimento', baseValue: 11, unit: 'días', series: [3, 5, 6, 8, 9, 10, 11] },
    ],
    quiz: {
      question:
        'Lanzas un test A/B configurado al 50% Control y 50% Tratamiento sobre 200,000 usuarios. Al tercer día ves que Control tiene 103,400 usuarios y Tratamiento 96,600 (p-valor del test SRM = 0.00001), pero Tratamiento muestra +8% más ingresos por usuario. ¿Qué debes hacer?',
      options: [
        {
          id: 'a',
          text: 'Invalidar el resultado y detener el análisis de negocio inmediatamente: hay un Sample Ratio Mismatch (SRM) severo, lo que indica que un bug técnico o sesgo de supervivencia está filtrando usuarios en Tratamiento (por ejemplo, solo se registran los usuarios más rápidos o con navegadores modernos).',
          correct: true,
        },
        {
          id: 'b',
          text: 'Desplegar Tratamiento al 100% hoy mismo porque +8% de ingresos es un éxito rotundo.',
          correct: false,
        },
        {
          id: 'c',
          text: 'Borrar al azar 6,800 filas de la tabla de Control para que ambos grupos queden con 96,600 usuarios.',
          correct: false,
        },
      ],
    },
  },
  {
    id: 'mod-7-bi-as-code',
    number: 7,
    shortTitle: '7. BI-as-Code & Executive Dashboards',
    title: 'Business Intelligence Moderno, BI-as-Code y Diseño Visual sin Chartjunk',
    subtitle: 'Evidence.dev, Observable Framework, Rill, Power BI Direct Lake, Principios de Tufte/Few y Storytelling Ejecutivo',
    eraTag: 'Excelencia BI · Actual',
    defaultSim: {
      partitionGranularity: 90,
      compressionRatio: 86,
      sampleSizeK: 190,
      cacheHitRate: 95,
    },
    diagram: {
      title: 'Ciclo de Vida BI-as-Code: Repositorio Git → Compilación SQL/Parquet → Dashboard de Alta Densidad (Tufte)',
      sourceLabel: 'Markdown + SQL (Git PR)',
      engineLabel: 'Evidence / Observable Build',
      partitions: [
        { id: 'p1', name: 'CI Check: Test de Consultas SQL', rows: '24 Queries OK', status: 'scanned', detail: 'Ningún PR se fusiona si una consulta del reporte falla contra el esquema' },
        { id: 'p2', name: 'Pre-Cálculo Parquet Estático', rows: '14.2 MB Total', status: 'scanned', detail: 'Extractos columnares comprimidos servidos desde CDN global' },
        { id: 'p3', name: 'Gráficos Circular 3D / Gauges', rows: '0 (Bloqueados)', status: 'pruned', detail: 'Rechazados por política de diseño: baja relación dato-tinta' },
        { id: 'p4', name: 'Small Multiples & Sparklines', rows: '12 Paneles', status: 'scanned', detail: 'Comparación paralela con escalas compartidas y contexto de objetivo' },
      ],
      sinkLabel: 'Comité Ejecutivo (Desktop & Móvil)',
    },
    perspectives: {
      '360': {
        heading: 'BI-as-Code y la muerte del dashboard lento, roto y engañoso',
        summary:
          'Durante una década, los equipos de BI sufrieron herramientas de arrastrar y soltar donde los cambios no se podían revisar en Pull Requests, las consultas se rompían en silencio y las pantallas se llenaban de velocímetros y gráficos circulares 3D ilegibles. En 2026, el movimiento BI-as-Code (Evidence.dev, Observable Framework, Rill, Visivo) trata los reportes y dashboards como código versionado en Git, alimentado por pipelines DE verificados y diseñado con la precisión estadística de DA.',
        bulletPoints: [
          'DE integra el build del proyecto BI-as-Code en el pipeline de CI/CD: si un cambio en una tabla rompe un gráfico ejecutivo, el test falla antes de llegar a producción.',
          'DA aporta contexto estadístico a cada visualización: bandas de normalidad, desestacionalización y comparativas YoY/MoM ajustadas por días hábiles.',
          'BI aplica los principios de Edward Tufte y Stephen Few: maximizar la relación dato-tinta (Data-Ink Ratio), usar Small Multiples, tablas con micro-gráficos integrados y narrativa escrita.',
        ],
      },
      DE: {
        heading: 'Ingeniería (DE): Arquitectura de Entrega para BI a Escala (CDN + DuckDB-Wasm + Direct Lake)',
        summary:
          'Para que un dashboard ejecutivo cargue en menos de 150ms para 5,000 usuarios simultáneos sin disparar la factura del almacén de datos, DE implementa una capa de compilación de datos: al finalizar el pipeline horario de dbt/SQLMesh, se generan cubos Parquet pre-validados o se refresca el puntero Direct Lake sobre Iceberg v3.',
        bulletPoints: [
          'Versionado en Git del BI: revisión por pares (code review), historial de cambios con git blame y reversión instantánea (rollback).',
          'Seguridad a nivel de fila (Row-Level Security) mediante tokens JWT firmados o vistas parametrizadas en el catálogo.',
          'Monitoreo de telemetría de uso: detectar qué dashboards no han sido abiertos en 60 días para deprecarlos y ahorrar cómputo.',
        ],
      },
      DA: {
        heading: 'Análisis (DA): Cómo elegir la codificación visual correcta según la pregunta analítica',
        summary:
          'El ojo humano juzga longitudes sobre una base común (barras alineadas, posición en eje X/Y) con muchísima mayor precisión que áreas o ángulos (gráficos de pastel o burbujas). Un analista diseña visualizaciones que revelan causalidad y anomalías en menos de 3 segundos.',
        bulletPoints: [
          'Desviación respecto a objetivo: usa Bullet Graphs (Stephen Few) o barras divergentes en lugar de medidores circulares (gauges) que desperdician el 80% del espacio.',
          'Comparación de múltiples categorías a lo largo del tiempo: usa Small Multiples (cuadrícula de minigráficos con el mismo eje Y) en lugar de un "gráfico saturado" de 15 líneas superpuestas.',
          'Contexto numérico tabular: alinea siempre los números a la derecha con font-variant-numeric: tabular-nums y la misma cantidad de decimales.',
        ],
      },
      BI: {
        heading: 'Business Intelligence (BI): Narrativa Ejecutiva (Pirámide de Minto) y Árboles de Decisión',
        summary:
          'Un buen producto de BI no termina lanzando 40 filtros a la pantalla para que el usuario "busque por su cuenta". Sigue el principio de la Pirámide de Minto: abre con la conclusión accionable respaldada por datos, presenta las 3 palancas causales que explican la variación y ofrece el desglose granular debajo.',
        bulletPoints: [
          'Título activo vs. pasivo: En lugar de titular un gráfico "Ingresos Mensuales por Región", titúlalo "EMEA impulsó el 74% del sobrecumplimiento de octubre (+1.2M USD vs plan)".',
          'Jerarquía de color con propósito: usa tonos neutros para el contexto histórico y reserva el color saturado (ámbar, esmeralda o cobalto) exclusivamente para la serie o anomalía que requiere atención.',
          'Métricas accionables vs. métricas de vanidad: reemplaza "Visitas acumuladas históricas" por "Tasa de activación en los primeros 7 días por cohorte".',
        ],
      },
    },
    relatedConnections: [
      {
        targetModuleId: 'mod-2-duckdb-arrow',
        discipline: 'DE',
        title: 'Motor DuckDB-Wasm en el Navegador',
        connection: 'La tecnología subyacente que permite a Evidence y Observable Framework filtrar millones de filas localmente.',
      },
      {
        targetModuleId: 'mod-4-dbt-semantic',
        discipline: 'BI',
        title: 'Consumo desde la Capa Semántica',
        connection: 'Cómo los reportes BI-as-Code importan métricas certificadas directamente desde MetricFlow / Cube.',
      },
      {
        targetModuleId: 'mod-8-ai-mcp-agents',
        discipline: 'BI',
        title: 'GenBI y Resúmenes Ejecutivos Auditados',
        connection: 'Cómo combinar plantillas BI-as-Code con agentes IA que redactan análisis de varianza verificados.',
      },
    ],
    codeSamples: {
      DE: `# [DE] GitHub Actions CI/CD: Verificación de Contratos SQL + Build BI-as-Code
name: Verify & Deploy Executive BI
on:
  push:
    branches: [main]
jobs:
  build-bi:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run SQLMesh Data Audits
        run: sqlmesh audit --start 2026-10-01 --end 2026-10-28
      - name: Compile Parquet Data Sources & Validate BI Queries
        run: |
          npm ci
          npm run sources -- --strict
          npm run build`,
      DA: `-- [DA] Descomposición de Varianza de Ingresos (Efecto Volumen vs. Precio vs. Mix)
WITH period_comparison AS (
  SELECT
    product_category,
    SUM(units) FILTER (WHERE month = '2026-09') AS q0,
    SUM(units) FILTER (WHERE month = '2026-10') AS q1,
    SUM(rev_usd) FILTER (WHERE month = '2026-09') / NULLIF(SUM(units) FILTER (WHERE month = '2026-09'), 0) AS p0,
    SUM(rev_usd) FILTER (WHERE month = '2026-10') / NULLIF(SUM(units) FILTER (WHERE month = '2026-10'), 0) AS p1
  FROM gold.category_monthly_sales
  GROUP BY product_category
)
SELECT
  product_category,
  ROUND((q1 - q0) * p0, 2) AS volume_effect_usd,
  ROUND((p1 - p0) * q1, 2) AS price_effect_usd,
  ROUND((q1 * p1) - (q0 * p0), 2) AS total_delta_usd
FROM period_comparison
ORDER BY ABS(total_delta_usd) DESC;`,
      BI: `<!-- [BI] Evidence.dev / Observable Markdown + SQL Versionado en Git -->
# Informe Ejecutivo de Ingresos — Actual

\`\`\`sql revenue_by_region
SELECT
  region_name,
  SUM(net_revenue_usd) AS actual_rev,
  SUM(target_revenue_usd) AS target_rev,
  (SUM(net_revenue_usd) - SUM(target_revenue_usd)) / SUM(target_revenue_usd) AS attainment_diff_pct
FROM semantic.regional_performance
WHERE fiscal_month = '2026-10'
GROUP BY region_name
ORDER BY actual_rev DESC
\`\`\`

<DataTable data={revenue_by_region} rows=all>
  <Column id=region_name title="Región" />
  <Column id=actual_rev title="Real (USD)" fmt=usd0 contentType=bar />
  <Column id=target_rev title="Meta (USD)" fmt=usd0 />
  <Column id=attainment_diff_pct title=" vs. Meta" fmt=pct1 contentType=delta />
</DataTable>`,
    },
    cohortData: [
      { label: 'Data-Ink Ratio (Tufte)', value: 94.0, segmentA: 96, segmentB: 88 },
      { label: 'Small Multiples', value: 89.5, segmentA: 92, segmentB: 84 },
      { label: 'Bullet Graphs KPI', value: 86.2, segmentA: 90, segmentB: 79 },
      { label: 'Tablas c/ Sparklines', value: 82.8, segmentA: 87, segmentB: 75 },
      { label: 'Cobertura Tests PR', value: 100.0, segmentA: 100, segmentB: 100 },
      { label: 'Carga < 100ms CDN', value: 96.4, segmentA: 98, segmentB: 92 },
    ],
    kpis: [
      { label: 'Relación Dato-Tinta', baseValue: 94.0, unit: '%', series: [55, 64, 72, 81, 87, 91, 94.0] },
      { label: 'Tiempo Carga Dashboard', baseValue: 64, unit: 'ms', series: [1850, 920, 410, 190, 115, 82, 64] },
      { label: 'Consultas Rotas en Prod', baseValue: 0, unit: 'errores', series: [9, 6, 4, 2, 1, 0, 0] },
      { label: 'Adopción Semanal Comité', baseValue: 92.8, unit: '%', series: [48, 59, 68, 76, 84, 89, 92.8] },
    ],
    quiz: {
      question:
        'Necesitas mostrar en un dashboard ejecutivo la evolución mensual de ventas de 12 líneas de producto durante los últimos 24 meses y cómo se sitúa cada una frente a su presupuesto anual. ¿Cuál es el diseño con mayor claridad analítica y cero slop?',
      options: [
        {
          id: 'a',
          text: 'Una tabla analítica o matriz de Small Multiples alineada: cada fila/panel muestra la línea de producto, una micro-serie temporal (sparkline) de los 24 meses, un Bullet Graph comparando el acumulado real contra el presupuesto y cifras tabulares alineadas a la derecha.',
          correct: true,
        },
        {
          id: 'b',
          text: 'Un único gráfico de pastel 3D con 288 rebanadas (12 productos × 24 meses) y colores neón.',
          correct: false,
        },
        {
          id: 'c',
          text: 'Doce velocímetros gigantes (gauges) ocupando tres pantallas de scroll sin contexto histórico.',
          correct: false,
        },
      ],
    },
  },
  {
    id: 'mod-8-ai-mcp-agents',
    number: 8,
    shortTitle: '8. MCP Agents & GenBI (Actual)',
    title: 'IA + Datos 2026: Servidores MCP, Text-to-Semantic-Layer, GraphRAG y Agentes Analíticos',
    subtitle: 'Model Context Protocol (MCP) para Datos, Agentes con Verificación Determinista, RAG Híbrido sobre Lakehouse y Evals',
    eraTag: 'Frontera IA · 28 Actual',
    defaultSim: {
      partitionGranularity: 95,
      compressionRatio: 91,
      sampleSizeK: 480,
      cacheHitRate: 96,
    },
    diagram: {
      title: 'Arquitectura Agéntica de Datos 2026: Usuario → Agente IA Ultra → Servidor MCP → Capa Semántica & Lakehouse',
      sourceLabel: 'Consulta Lenguaje Natural',
      engineLabel: 'Servidor MCP (Catálogo + Semántica)',
      partitions: [
        { id: 'p1', name: 'mcp://semantic/list_metrics', rows: '42 KPIs Gobernados', status: 'scanned', detail: 'El LLM descubre definiciones oficiales en lugar de adivinar tablas crudas' },
        { id: 'p2', name: 'SQL AST Validator (SQLGlot)', rows: '100% Read-Only', status: 'scanned', detail: 'Valida permisos, sintaxis, límite de costo y ausencia de fan-out' },
        { id: 'p3', name: 'Raw Table Hallucination Path', rows: 'Bloqueado', status: 'pruned', detail: 'Se prohíbe al agente inventar JOINS sobre tablas Bronze sin documentar' },
        { id: 'p4', name: 'Lance / DuckDB Vector + FTS', rows: 'HNSW + BM25', status: 'scanned', detail: 'Búsqueda híbrida sobre documentación de contratos y glosario de negocio' },
      ],
      sinkLabel: 'Respuesta Auditada + Chart BI',
    },
    perspectives: {
      '360': {
        heading: 'La convergencia de IA y Datos a finales de producción',
        summary:
          'En 2023-2024, conectar un LLM directamente a un esquema de 500 tablas SQL crudas ("Text-to-SQL ingenuo") fracasó en producción porque los modelos alucinaban joins, ignoraban filtros de registros borrados y calculaban métricas distintas cada vez. En producción, la arquitectura ganadora combina tres piezas: el Model Context Protocol (MCP) como interfaz estándar de herramientas de datos, Text-to-Semantic-Layer para precisión matemática del 99%+, y almacenamiento multimodal (Lance/Iceberg) para RAG híbrido.',
        bulletPoints: [
          'DE expone el catálogo de datos, los contratos ODCS y el motor DuckDB/Iceberg a través de servidores MCP seguros de solo lectura con límites de costo.',
          'DA diseña conjuntos de evaluación (Golden Evals) con pares pregunta-SQL-resultado estadístico y construye pipelines de búsqueda híbrida (BM25 + Vectores HNSW + Reranking).',
          'BI evoluciona hacia GenBI Gobernado: el ejecutivo hace preguntas complejas de seguimiento y el agente consulta MetricFlow/Cube, ejecuta el análisis de varianza y renderiza visualizaciones auditables.',
        ],
      },
      DE: {
        heading: 'Ingeniería (DE): Servidores MCP de Datos, Índices HNSW en Lance/DuckDB y Guardrails SQL',
        summary:
          'El Model Context Protocol (MCP) estandariza cómo los modelos (como Google AI Ultra / Gemini) descubren recursos y ejecutan herramientas locales o empresariales. Para un ingeniero de datos en 2026, construir un Servidor MCP implica exponer tres primitivas: Recursos (esquemas, contratos YAML, linaje), Herramientas (query_semantic_layer, explain_plan, profile_column) y Prompts de sistema auditados.',
        bulletPoints: [
          'Nunca otorgues credenciales de escritura o acceso a tablas con PII sin enmascaramiento dinámico a un agente autónomo.',
          'Usa SQLGlot antes de ejecutar cualquier SQL generado por IA para verificar que sea un SELECT puro, que no exceda el umbral de particiones escaneadas y que aplique LIMIT.',
          'Para RAG sobre millones de documentos y tablas, almacena los embeddings junto a los datos tabulares en formato Lance o tablas Iceberg con índices vectoriales disk-based (DiskANN / HNSW).',
        ],
      },
      DA: {
        heading: 'Análisis (DA): Evaluación Sistemática (Evals) de Agentes Analíticos y RAG Híbrido',
        summary:
          'Un pipeline de IA sin métricas de evaluación continua es una caja negra peligrosa. Los analistas de datos aplican su rigor estadístico para medir la precisión de ejecución (Execution Accuracy), la fidelidad a los datos (Faithfulness) y la relevancia de recuperación en sistemas RAG.',
        bulletPoints: [
          'Búsqueda Híbrida con Reciprocal Rank Fusion (RRF): combina búsqueda léxica exacta BM25 (clave para códigos SKU, IDs de tablas y acrónimos) con similitud semántica densa (embeddings).',
          'GraphRAG sobre el catálogo de metadatos: permite al agente recorrer el grafo de relaciones entre tablas, propietarios, glosario de negocio y reportes existentes.',
          'Agentes de Análisis Exploratorio: en lugar de responder en un solo paso, el agente formula una hipótesis, ejecuta una consulta de perfilado en DuckDB, verifica valores atípicos y presenta la conclusión con el código adjunto.',
        ],
      },
      BI: {
        heading: 'Business Intelligence (BI): Por qué Text-to-Semantic-Layer vence al Text-to-SQL crudo',
        summary:
          'Cuando un director pregunta "¿Cuál fue el NRR del segmento Enterprise en Q3?", un sistema Text-to-SQL crudo intenta adivinar cómo unir 7 tablas de facturación. Un sistema Text-to-Semantic-Layer traduce la pregunta a una llamada simple: metrics=["net_revenue_retention"], group_by=["customer_segment"], where="quarter = 2026-Q3". La Capa Semántica genera el SQL determinista garantizado.',
        bulletPoints: [
          'Trazabilidad total en GenBI: cada respuesta generada por IA en el dashboard incluye la pestaña "Inspeccionar Métrica Semántica y SQL Ejecutado".',
          'Narrativas automatizadas de anomalías: cuando un KPI cruza un umbral de control estadístico, el agente ejecuta automáticamente el árbol de descomposición dimensional y adjunta las 3 causas principales.',
          'Interacción conversacional sobre el lienzo: el chat con Google AI Ultra no reemplaza a los gráficos; los filtra, anota y complementa con explicaciones técnicas verificadas.',
        ],
      },
    },
    relatedConnections: [
      {
        targetModuleId: 'mod-4-dbt-semantic',
        discipline: 'BI',
        title: 'Capa Semántica como Motor de Verdad para IA',
        connection: 'La Capa Semántica del Módulo 4 es el ingrediente secreto que elimina las alucinaciones en consultas de negocio con IA.',
      },
      {
        targetModuleId: 'mod-2-duckdb-arrow',
        discipline: 'DE',
        title: 'DuckDB + Lance para Ejecución Local de Agentes',
        connection: 'Cómo los agentes MCP ejecutan consultas analíticas y búsquedas híbridas en milisegundos usando motores in-process.',
      },
      {
        targetModuleId: 'mod-6-statistical-da',
        discipline: 'DA',
        title: 'Validación Estadística de Respuestas IA',
        connection: 'Cómo evitar que un agente IA reporte ruido aleatorio como si fuera un hallazgo significativo.',
      },
    ],
    codeSamples: {
      DE: `// [DE] Servidor MCP (Model Context Protocol) 2026 exponiendo Capa Semántica y DuckDB
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const server = new McpServer({
  name: "lakehouse-semantic-mcp",
  version: "2026.10.28"
});

server.tool(
  "query_governed_metrics",
  "Consulta métricas oficiales certificadas sin riesgo de alucinación de joins",
  {
    metrics: z.array(z.string()).describe("IDs de métricas en MetricFlow, ej. ['arpu_net_usd', 'nrr_pct']"),
    dimensions: z.array(z.string()).describe("Dimensiones conformadas, ej. ['region_code', 'plan_tier']"),
    startDate: z.string(),
    endDate: z.string()
  },
  async ({ metrics, dimensions, startDate, endDate }) => {
    const sql = compileSemanticQuery({ metrics, dimensions, startDate, endDate });
    const rows = await executeReadOnlyDuckDB(sql, { maxScannedBytes: 2_000_000_000 });
    return { content: [{ type: "text", text: JSON.stringify({ sql, rows }, null, 2) }] };
  }
);`,
      DA: `-- [DA] Búsqueda Híbrida en DuckDB (BM25 Full-Text + Similitud Coseno Vectorial con RRF)
WITH lexical_bm25 AS (
  SELECT
    doc_id,
    metric_name,
    ROW_NUMBER() OVER (ORDER BY fts_main_glossary.match_bm25(doc_id, 'retencion neta enterprise') DESC) AS rank_bm25
  FROM catalog.business_glossary
  WHERE fts_main_glossary.match_bm25(doc_id, 'retencion neta enterprise') IS NOT NULL
  LIMIT 20
),
semantic_vec AS (
  SELECT
    doc_id,
    metric_name,
    ROW_NUMBER() OVER (ORDER BY array_cosine_distance(embedding, $query_vec::FLOAT[768]) ASC) AS rank_vec
  FROM catalog.business_glossary
  LIMIT 20
)
SELECT
  COALESCE(l.doc_id, s.doc_id) AS doc_id,
  COALESCE(l.metric_name, s.metric_name) AS metric_name,
  ROUND(COALESCE(1.0 / (60 + l.rank_bm25), 0) + COALESCE(1.0 / (60 + s.rank_vec), 0), 5) AS rrf_score
FROM lexical_bm25 l
FULL OUTER JOIN semantic_vec s USING (doc_id)
ORDER BY rrf_score DESC
LIMIT 5;`,
      BI: `# [BI] Especificación de Agente GenBI Gobernado con Verificación Determinista
agent_contract:
  id: executive_variance_analyst_2026
  model_provider: google_ai_ultra_local_bridge
  allowed_mcp_tools:
    - lakehouse-semantic-mcp:list_metrics
    - lakehouse-semantic-mcp:query_governed_metrics
    - lakehouse-semantic-mcp:run_variance_decomposition
  guardrails:
    forbid_raw_table_joins: true
    require_confidence_intervals: true
    attach_compiled_sql_in_ui: true
    max_query_cost_usd: 0.05`,
    },
    cohortData: [
      { label: 'Text-to-Semantic', value: 99.1, segmentA: 99, segmentB: 98 },
      { label: 'Hybrid RRF (BM25+Vec)', value: 94.6, segmentA: 96, segmentB: 91 },
      { label: 'Guardrail AST SQL', value: 100.0, segmentA: 100, segmentB: 100 },
      { label: 'GraphRAG Linaje', value: 89.2, segmentA: 92, segmentB: 84 },
      { label: 'Golden Evals Pass', value: 95.8, segmentA: 97, segmentB: 93 },
      { label: 'Text-to-SQL Crudo', value: 58.4, segmentA: 64, segmentB: 49 },
    ],
    kpis: [
      { label: 'Precisión Text-to-Semantic', baseValue: 99.1, unit: '%', series: [61, 72, 83, 91, 95, 98.2, 99.1] },
      { label: 'Reducción Alucinación Joins', baseValue: 98.5, unit: '%', series: [45, 62, 78, 88, 94, 97, 98.5] },
      { label: 'Latencia Agente MCP + DuckDB', baseValue: 680, unit: 'ms', series: [3400, 2200, 1600, 1150, 890, 740, 680] },
      { label: 'Cobertura Golden Evals', baseValue: 95.8, unit: '%', series: [50, 65, 74, 82, 89, 93, 95.8] },
    ],
    quiz: {
      question:
        '¿Por qué en 2026 conectar un Agente IA a un Servidor MCP sobre la Capa Semántica (Text-to-Semantic-Layer) supera drásticamente al enfoque tradicional de pedirle al LLM que escriba SQL directo contra 300 tablas crudas?',
      options: [
        {
          id: 'a',
          text: 'Porque el agente selecciona métricas y dimensiones gobernadas de alto nivel, delegando al compilador determinista de la Capa Semántica la generación exacta de JOINS, filtros de negocio y prevención de fan-out, reduciendo las alucinaciones matemáticas a casi cero.',
          correct: true,
        },
        {
          id: 'b',
          text: 'Porque los modelos de IA de 2026 no conocen la palabra SELECT.',
          correct: false,
        },
        {
          id: 'c',
          text: 'Porque la Capa Semántica borra todas las bases de datos y guarda todo en archivos de texto sin estructura.',
          correct: false,
        },
      ],
    },
  },
];
