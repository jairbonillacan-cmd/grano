import {
  fsrs,
  createEmptyCard,
  Rating,
  State,
  TypeConvert,
  generatorParameters,
} from 'ts-fsrs';

export { Rating, State };

export const BOX_INTERVALS_DAYS = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30,
};

const MINUTE_IN_MS = 60 * 1000;
const HOUR_IN_MS = 60 * MINUTE_IN_MS;
const DAY_IN_MS = 24 * HOUR_IN_MS;

const schedulerParams = generatorParameters({
  enable_fuzz: false,
  enable_short_term: true,
});

const scheduler = fsrs(schedulerParams);

let externalStateProvider = null;

export function setReviewStateProvider(providerFn) {
  externalStateProvider = typeof providerFn === 'function' ? providerFn : null;
}

export const CARD_LESSON_MAP = {
  'fc-01': 'l1-joins-fanout',
  'fc-02': 'l2-window-functions',
  'fc-03': 'l3-asof-lateral-ctes',
  'fc-04': 'l4-star-schema-obt',
  'fc-05': 'l5-scd2-history',
  'fc-06': 'l6-metrics-simpson',
  'fc-07': 'l6-metrics-simpson',
  'fc-08': 'l7-columnar-parquet',
  'fc-09': 'l8-arrow-lance-vortex',
  'fc-10': 'l9-duckdb-polars-marimo',
  'fc-11': 'l9-duckdb-polars-marimo',
  'fc-12': 'l10-iceberg-v3-medallion',
  'fc-13': 'l10-iceberg-v3-medallion',
  'fc-14': 'l11-dbt-sqlmesh-dag',
  'fc-15': 'l12-contracts-semantic-layer',
  'fc-16': 'l12-contracts-semantic-layer',
  'fc-17': 'l14-ab-testing-cuped',
  'fc-18': 'l14-ab-testing-cuped',
  'fc-19': 'l15-bi-tufte-code',
  'fc-20': 'l15-bi-tufte-code',
  'fc-21': 'l16-cdc-kafka-streaming',
  'fc-22': 'l17-flink-watermarks-mv',
  'fc-23': 'l18-mcp-semantic-ai-rag',
  'fc-24': 'l18-mcp-semantic-ai-rag',
};

export const LESSON_ID_ALIASES = {
  'c1-sql-joins-02-grano-fanout': 'l1-joins-fanout',
  'c1-sql-joins-02': 'l1-joins-fanout',
  'c2-sql-analitico-01': 'l2-window-functions',
  'c2-sql-analitico-02': 'l3-asof-lateral-ctes',
  'c2-dimensional-02': 'l4-star-schema-obt',
  'c2-dimensional-03': 'l5-scd2-history',
  'c2-dimensional-04': 'l6-metrics-simpson',
  'de2-formatos-01': 'l7-columnar-parquet',
  'de2-formatos-02': 'l8-arrow-lance-vortex',
  'de2-formatos-03': 'l9-duckdb-polars-marimo',
  'de3-lakehouse-01': 'l10-iceberg-v3-medallion',
  'de3-transformacion-01': 'l11-dbt-sqlmesh-dag',
  'de3-transformacion-03': 'l12-contracts-semantic-layer',
  'da3-producto-02': 'l13-cohorts-retention-ltv',
  'da3-experimentos-01': 'l14-ab-testing-cuped',
  'bi3-dashboards-01': 'l15-bi-tufte-code',
  'de4-streaming-01': 'l16-cdc-kafka-streaming',
  'de4-streaming-03': 'l17-flink-watermarks-mv',
  'x4-ia-datos-01': 'l18-mcp-semantic-ai-rag',
};

export const INITIAL_FLASHCARDS = [
  {
    id: 'fc-01',
    lessonId: 'l1-joins-fanout',
    stageId: 'stage-1',
    discipline: 'BI',
    bloomLevel: 'Analizar',
    question:
      '¿Qué es la trampa de Fan-out (explosión de filas) en un JOIN y cómo distorsiona las métricas en un dashboard de BI?',
    answer:
      'Ocurre cuando se realiza un JOIN entre una tabla de grano fino y otra que no es única en la llave de cruce (relación 1:N o N:M) y luego se aplica SUM() o COUNT() sobre la tabla izquierda. Las filas del lado "1" se duplican N veces, inflando artificialmente ingresos o conteos. Se previene pre-agregando la tabla detalle en una CTE al mismo grano antes del JOIN o usando métricas semi-aditivas gobernadas.',
    codeSnippet: `-- INCORRECTO: Fan-out duplica el monto_orden por cada ítem del pedido
SELECT SUM(o.monto_total) AS ingresos_inflados
FROM ordenes o
JOIN orden_items i ON o.orden_id = i.orden_id;

-- CORRECTO: Pre-agregar al mismo grano (orden_id) antes del JOIN
WITH items_por_orden AS (
  SELECT orden_id, COUNT(*) AS total_items
  FROM orden_items
  GROUP BY orden_id
)
SELECT SUM(o.monto_total) AS ingresos_reales, SUM(i.total_items) AS unidades
FROM ordenes o
LEFT JOIN items_por_orden i ON o.orden_id = i.orden_id;`,
  },
  {
    id: 'fc-02',
    lessonId: 'l2-window-functions',
    stageId: 'stage-1',
    discipline: 'DA',
    bloomLevel: 'Aplicar',
    question:
      '¿Cómo funciona la cláusula QUALIFY en motores SQL modernos (DuckDB, Snowflake, BigQuery, Databricks) y en qué fase del orden lógico de evaluación se ejecuta?',
    answer:
      'QUALIFY filtra el resultado de funciones de ventana (ROW_NUMBER, RANK, LAG, SUM OVER) sin necesidad de envolver la consulta en una subconsulta o CTE adicional. En el orden lógico de evaluación SQL se ejecuta después de WINDOW (y por tanto después de WHERE, GROUP BY y HAVING), pero antes de ORDER BY y LIMIT.',
    codeSnippet: `-- Deduplicación determinista del último evento por usuario usando QUALIFY
SELECT
  usuario_id,
  evento_id,
  estado_suscripcion,
  actualizado_en
FROM raw.eventos_suscripcion
WHERE fecha_particion >= DATE '2026-10-01'
QUALIFY ROW_NUMBER() OVER (
  PARTITION BY usuario_id
  ORDER BY actualizado_en DESC, evento_id DESC
) = 1;`,
  },
  {
    id: 'fc-03',
    lessonId: 'l3-asof-lateral-ctes',
    stageId: 'stage-1',
    discipline: 'DA',
    bloomLevel: 'Aplicar',
    question:
      '¿Qué problema resuelve un ASOF JOIN en series temporales financieras o de telemetría y por qué evita el Data Leakage (fuga de datos del futuro)?',
    answer:
      'Un ASOF JOIN empareja cada fila de una tabla izquierda con la fila más cercana en el tiempo de la tabla derecha que sea anterior o igual (<=) a la marca temporal del evento. Evita el Data Leakage porque garantiza que una transacción o feature de ML solo se cruce con la cotización o estado vigente en ese milisegundo exacto, sin usar valores futuros.',
    codeSnippet: `-- DuckDB / Snowflake: Cruzar ventas con la tasa de cambio vigente en ese instante
SELECT
  v.venta_id,
  v.moneda,
  v.monto_local,
  fx.tasa_usd,
  ROUND(v.monto_local * fx.tasa_usd, 2) AS monto_usd
FROM fact_ventas v
ASOF JOIN dim_tasas_fx fx
  ON v.moneda = fx.moneda
  AND v.timestamp_venta >= fx.timestamp_cotizacion;`,
  },
  {
    id: 'fc-04',
    lessonId: 'l4-star-schema-obt',
    stageId: 'stage-2',
    discipline: 'BI',
    bloomLevel: 'Evaluar',
    question:
      '¿Cuándo conviene diseñar un Esquema Estrella (Star Schema) frente a una One Big Table (OBT) desnormalizada en motores columnares modernos?',
    answer:
      'La OBT elimina el costo de JOINs en tiempo de consulta y aprovecha la compresión RLE/Diccionario de Parquet en escaneos de una sola tabla, ideal para cargas intensivas en CPU. El Star Schema sigue siendo superior cuando existen múltiples tablas de hechos con diferente granularidad (ventas vs. presupuesto mensual), dimensiones SCD Tipo 2 compartidas (Conformed Dimensions) o gobierno en Capa Semántica.',
    codeSnippet: `-- Star Schema: Hechos a nivel línea de pedido + Dimensión conformada con llave subrogada
SELECT
  d_prod.categoria,
  d_cli.segmento_historico,
  SUM(f.ingreso_neto) AS ingresos
FROM gold.fact_ordenes f
JOIN gold.dim_producto d_prod ON f.producto_sk = d_prod.producto_sk
JOIN gold.dim_cliente_scd2 d_cli ON f.cliente_sk = d_cli.cliente_sk
GROUP BY ALL;`,
  },
  {
    id: 'fc-05',
    lessonId: 'l5-scd2-history',
    stageId: 'stage-2',
    discipline: 'DE',
    bloomLevel: 'Aplicar',
    question:
      '¿Cómo preserva la historia una Dimensión Lentamente Cambiante Tipo 2 (SCD Type 2) y qué columnas técnicas son indispensables?',
    answer:
      'SCD Tipo 2 crea una nueva fila cada vez que cambia un atributo rastreado (ej. segmento o país del cliente), manteniendo intacta la atribución histórica. Requiere una llave subrogada única (surrogate key, ej. cliente_sk), la llave natural (cliente_id), marcas de vigencia (valid_from, valid_to) y una bandera booleana is_current para consultas del estado actual.',
    codeSnippet: `-- Cruce histórico Point-in-Time contra una dimensión SCD Tipo 2
SELECT
  f.orden_id,
  f.fecha_orden,
  d.segmento_cliente AS segmento_en_fecha_compra,
  f.monto_usd
FROM silver.ordenes f
JOIN gold.dim_cliente_scd2 d
  ON f.cliente_id = d.cliente_id
  AND f.fecha_orden >= d.valid_from
  AND f.fecha_orden < COALESCE(d.valid_to, TIMESTAMP '9999-12-31');`,
  },
  {
    id: 'fc-06',
    lessonId: 'l6-metrics-simpson',
    stageId: 'stage-2',
    discipline: 'DA',
    bloomLevel: 'Analizar',
    question:
      '¿Qué es la Paradoja de Simpson en el análisis de KPIs y cómo se detecta antes de presentar conclusiones ejecutivas?',
    answer:
      'Es un fenómeno estadístico donde una tendencia observada en varios segmentos desaparece o se invierte al combinar los datos en un único agregado global. Ocurre cuando existe una variable de confusión (confounder) correlacionada tanto con la métrica como con el peso/volumen de cada grupo. Se detecta desglosando por variables de mezcla (canal, dispositivo, país) y aplicando estandarización por pesos fijos.',
    codeSnippet: `-- Comparar conversión global vs. estratificada por dispositivo (variable de confusión)
SELECT
  canal_adquisicion,
  dispositivo,
  COUNT(*) AS sesiones,
  ROUND(100.0 * SUM(convirtio) / COUNT(*), 2) AS tasa_conversion_pct,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (PARTITION BY canal_adquisicion), 1) AS peso_mix_pct
FROM gold.eventos_funnel
GROUP BY GROUPING SETS ((canal_adquisicion, dispositivo), (canal_adquisicion));`,
  },
  {
    id: 'fc-07',
    lessonId: 'l6-metrics-simpson',
    stageId: 'stage-2',
    discipline: 'BI',
    bloomLevel: 'Evaluar',
    question:
      '¿Por qué las métricas no aditivas (ratios, tasas de conversión, ticket promedio, COUNT DISTINCT) nunca deben promediarse ni sumarse a partir de tablas pre-agregadas diarias?',
    answer:
      'Porque el promedio de promedios no pondera el volumen de cada día (un día con 10 visitas pesa igual que Black Friday con 1 millón), y la suma de usuarios únicos diarios (DAU) cuenta múltiples veces al mismo usuario recurrente en el mes (MAU). En BI siempre deben almacenarse numerador y denominador por separado (SUM(ingresos) / SUM(ordenes)) o usar HyperLogLog / sketches para cardinalidades.',
    codeSnippet: `-- INCORRECTO: Promediar el ticket promedio diario distorsiona el resultado mensual
SELECT AVG(ticket_promedio_diario) FROM resumen_diario;

-- CORRECTO: Sumar componentes aditivos (numerador / denominador)
SELECT
  SUM(ingresos_totales) / NULLIF(SUM(total_ordenes), 0) AS aov_ponderado_real
FROM gold.resumen_diario_ventas;`,
  },
  {
    id: 'fc-08',
    lessonId: 'l7-columnar-parquet',
    stageId: 'stage-3',
    discipline: 'DE',
    bloomLevel: 'Analizar',
    question:
      '¿Cómo interactúan los Row Groups, Column Chunks y Zone Maps (estadísticas min/max) dentro de un archivo Apache Parquet para acelerar consultas?',
    answer:
      'Parquet divide la tabla horizontalmente en Row Groups (típicamente 128 MB o ~1M filas) y dentro de cada uno almacena un Column Chunk contiguo por columna. El Footer guarda Zone Maps (min, max, null_count) y Bloom Filters por cada Column Chunk. Mediante Projection Pushdown solo se leen las columnas pedidas, y con Predicate Pushdown el motor salta Row Groups enteros si el filtro WHERE cae fuera del rango [min, max].',
    codeSnippet: `-- Al ordenar físicamente por fecha_evento al escribir Parquet, maximizamos el Data Skipping
COPY (
  SELECT *
  FROM eventos_crudos
  ORDER BY fecha_evento, pais_codigo
) TO 's3://lakehouse/eventos_optimizados.parquet'
(FORMAT PARQUET, COMPRESSION ZSTD, ROW_GROUP_SIZE 100000);`,
  },
  {
    id: 'fc-09',
    lessonId: 'l8-arrow-lance-vortex',
    stageId: 'stage-3',
    discipline: 'DE',
    bloomLevel: 'Comprender',
    question:
      '¿Qué significa que Apache Arrow permita transferencia Zero-Copy entre DuckDB, Polars, PySpark y Python?',
    answer:
      'Tradicionalmente, pasar datos entre motores requería serializar filas a bytes y deserializarlas (gastando hasta 70% de CPU). Apache Arrow define un formato estándar de buffers columnares contiguos en memoria RAM (con bitmaps de nulos y offsets alineados para SIMD). Con Zero-Copy, Polars y DuckDB comparten el mismo puntero de memoria RAM sin copiar ni transformar un solo byte.',
    codeSnippet: `import duckdb
import polars as pl

df_polars = pl.scan_parquet("ventas_2026.parquet")
resultado_arrow = duckdb.sql("""
  SELECT region, SUM(monto_neto) AS total
  FROM df_polars
  WHERE estado = 'COMPLETADO'
  GROUP BY region
""").pl()`,
  },
  {
    id: 'fc-10',
    lessonId: 'l9-duckdb-polars-marimo',
    stageId: 'stage-3',
    discipline: 'DA',
    bloomLevel: 'Evaluar',
    question:
      '¿En qué escenarios es más eficiente ejecutar DuckDB en un solo nodo (Single-Node Vectorized Engine) en lugar de levantar un clúster distribuido de Apache Spark?',
    answer:
      'Para datasets de hasta 100 GB - 1 TB comprimidos (que representan más del 90% de las cargas analíticas reales), un nodo moderno con 64-128 GB de RAM y NVMe procesa datos en DuckDB más rápido y barato que un clúster Spark porque elimina el arranque de máquinas virtuales, la serialización de red (Shuffle) entre nodos y la sobrecarga de la JVM, usando ejecución vectorizada por lotes de caché L1/L2 y Out-of-Core spilling a disco.',
    codeSnippet: `SET memory_limit = '16GB';
SET temp_directory = '/tmp/duckdb_spill';

SELECT
  date_trunc('month', fecha_compra) AS mes,
  APPROX_COUNT_DISTINCT(usuario_id) AS usuarios_unicos,
  SUM(importe_usd) AS revenue
FROM read_parquet('s3://mi-lakehouse/gold/fact_ventas/**/*.parquet')
GROUP BY ALL;`,
  },
  {
    id: 'fc-11',
    lessonId: 'l9-duckdb-polars-marimo',
    stageId: 'stage-3',
    discipline: 'DE',
    bloomLevel: 'Aplicar',
    question:
      '¿Cuál es la diferencia arquitectónica entre la API Eager (pl.read_parquet) y la API Lazy (pl.scan_parquet) en Polars?',
    answer:
      'La API Eager carga todo el archivo en RAM inmediatamente y ejecuta cada paso secuencialmente creando copias intermedias. La API Lazy construye un grafo lógico (Logical Plan) y antes de ejecutar (.collect()) aplica un optimizador de consultas en Rust que realiza Predicate Pushdown (filtra al leer), Projection Pushdown (solo carga las columnas necesarias), Common Subplan Elimination y ejecución streaming multihilo.',
    codeSnippet: `import polars as pl

q = (
    pl.scan_parquet("transacciones_100M.parquet")
    .filter(pl.col("pais") == "MX", pl.col("monto") > 500)
    .group_by("categoria")
    .agg(
        pl.col("monto").sum().alias("ingresos_mx"),
        pl.col("cliente_id").n_unique().alias("clientes_unicos")
    )
)
df_final = q.collect(streaming=True)`,
  },
  {
    id: 'fc-12',
    lessonId: 'l10-iceberg-v3-medallion',
    stageId: 'stage-4',
    discipline: 'DE',
    bloomLevel: 'Analizar',
    question:
      '¿Qué aportan los Deletion Vectors (Roaring Bitmaps) y el tipo de dato binario Variant en la especificación Apache Iceberg v3?',
    answer:
      'En Iceberg v3, los Deletion Vectors reemplazan los antiguos archivos de borrado posicional por bitmaps compactos (Roaring Bitmaps) en formato Puffin que marcan qué filas fueron actualizadas o borradas (Merge-on-Read), acelerando los MERGE INTO y el cumplimiento GDPR sin reescribir archivos Parquet de cientos de megabytes. El tipo Variant almacena JSON semiestructurado en formato binario columnar tipado, permitiendo lectura rápida con sub-columnarización automática.',
    codeSnippet: `CREATE TABLE catalog.silver.eventos_plataforma (
  evento_id STRING,
  usuario_id BIGINT,
  payload_evento VARIANT,
  evento_ts TIMESTAMP
)
USING iceberg
PARTITIONED BY (days(evento_ts))
TBLPROPERTIES (
  'format-version' = '3',
  'write.merge.mode' = 'merge-on-read'
);`,
  },
  {
    id: 'fc-13',
    lessonId: 'l10-iceberg-v3-medallion',
    stageId: 'stage-4',
    discipline: 'DE',
    bloomLevel: 'Aplicar',
    question:
      '¿Cómo funciona el patrón Write-Audit-Publish (WAP) sobre ramas de catálogo en Apache Iceberg para evitar que datos corruptos lleguen a los dashboards?',
    answer:
      'Con WAP, el pipeline escribe los nuevos datos en una rama aislada del catálogo Iceberg (ej. audit_branch) sin tocar la rama main que consumen los usuarios. Luego se ejecutan pruebas de calidad deterministas (unicidad, nulos, reconciliación de totales, anomalías de volumen) contra esa rama. Si todas pasan, se realiza un fast-forward atómico de metadatos hacia main; si fallan, se aborta sin haber contaminado producción.',
    codeSnippet: `ALTER TABLE prod.gold.fact_ventas CREATE BRANCH audit_run_20261028;
INSERT INTO prod.gold.fact_ventas.branch_audit_run_20261028
SELECT * FROM staging.ventas_validadas;

CALL system.fast_forward('prod.gold.fact_ventas', 'main', 'audit_run_20261028');`,
  },
  {
    id: 'fc-14',
    lessonId: 'l11-dbt-sqlmesh-dag',
    stageId: 'stage-4',
    discipline: 'DE',
    bloomLevel: 'Evaluar',
    question:
      '¿Por qué los Entornos Virtuales de Datos en SQLMesh evitan reconstruir tablas completas en staging a diferencia del enfoque tradicional de dbt?',
    answer:
      'SQLMesh parsea el SQL mediante un AST (SQLGlot) y calcula una huella criptográfica (fingerprint) semántica de cada modelo y sus dependencias. Al crear un entorno dev, solo materializa físicamente las tablas cuyo código o lógica cambió, y para el resto crea vistas ligeras (Zero-Copy Virtual Layer) apuntando a las tablas físicas de producción. Al promover a prod, simplemente intercambia punteros de vistas sin recalcular terabytes.',
    codeSnippet: `MODEL (
  name gold.ventas_mensuales,
  kind INCREMENTAL_BY_TIME_RANGE (
    time_column fecha_orden,
    lookback 3
  ),
  grain (fecha_orden, region_id)
);

SELECT fecha_orden, region_id, SUM(monto_usd) AS ingresos_netos
FROM silver.ordenes
WHERE fecha_orden BETWEEN @start_ds AND @end_ds
GROUP BY ALL;`,
  },
  {
    id: 'fc-15',
    lessonId: 'l12-contracts-semantic-layer',
    stageId: 'stage-4',
    discipline: 'DE',
    bloomLevel: 'Aplicar',
    question:
      '¿Qué es un Data Contract bajo el estándar ODCS v3 (Open Data Contract Standard) y cómo previene roturas silenciosas entre microservicios y el Lakehouse?',
    answer:
      'Es un acuerdo formal en código (YAML/JSON) entre el equipo productor del servicio (Software Engineering) y los consumidores de datos (DE/DA/BI). Define esquema estricto, semántica de negocio, reglas de calidad (ej. moneda en ISO-4217), SLAs de frescura y propietarios. Se valida en el CI/CD del productor y en el gateway de ingesta, enviando registros inválidos a una Dead-Letter Queue antes de romper el pipeline.',
    codeSnippet: `apiVersion: v3.0.0
kind: DataContract
id: urn:datacontract:checkout:orders-v2
schema:
  - name: order_id
    type: string
    required: true
    unique: true`,
  },
  {
    id: 'fc-16',
    lessonId: 'l12-contracts-semantic-layer',
    stageId: 'stage-4',
    discipline: 'BI',
    bloomLevel: 'Crear',
    question:
      '¿Qué rol cumple una Capa Semántica (MetricFlow / Cube) entre el Lakehouse y las herramientas de BI o agentes de IA?',
    answer:
      'Centraliza las definiciones de métricas de negocio (Ingresos Netos Recurrentes, Churn, Margen Bruto) en código declarativo versionado en Git, separando las medidas (measures) de las dimensiones y entidades. Evita el "SQL Drift" donde Finanzas y Marketing calculan el mismo KPI con filtros distintos, y expone una API gobernada para que tanto dashboards como servidores MCP consulten exactamente la misma fórmula.',
    codeSnippet: `metrics:
  - name: revenue_neto_oficial
    type: simple
    type_params:
      measure: ingresos_netos_aprobados`,
  },
  {
    id: 'fc-17',
    lessonId: 'l14-ab-testing-cuped',
    stageId: 'stage-5',
    discipline: 'DA',
    bloomLevel: 'Evaluar',
    question:
      '¿Qué es el Sample Ratio Mismatch (SRM) en un experimento A/B y por qué invalida cualquier p-valor o lift observado?',
    answer:
      'El SRM ocurre cuando la proporción real de usuarios asignados a Control y Tratamiento difiere estadísticamente de la proporción diseñada (ej. se planeó 50%/50% pero llegaron 50.4%/49.6% con un p-valor de Chi-cuadrado < 0.001). Indica un sesgo grave de selección o pérdida asimétrica de telemetría (ej. la variante B tarda más en cargar y pierde eventos en móviles lentos), invalidando por completo la inferencia causal del test.',
    codeSnippet: `from scipy.stats import chisquare
observados = [50450, 49550]
esperados = [50000, 50000]
stat, p_val_srm = chisquare(f_obs=observados, f_exp=esperados)`,
  },
  {
    id: 'fc-18',
    lessonId: 'l14-ab-testing-cuped',
    stageId: 'stage-5',
    discipline: 'DA',
    bloomLevel: 'Aplicar',
    question:
      '¿Cómo logra la técnica CUPED (Controlled-experiment Using Pre-Experiment Data) reducir la varianza y acortar el tiempo necesario de un A/B test?',
    answer:
      'CUPED utiliza una covariable X medida ANTES de iniciar el experimento (ej. el gasto del mismo usuario en los 14 días previos) que esté correlacionada con la métrica objetivo Y. Como X no pudo ser afectada por el tratamiento, sustrae la variabilidad preexistente mediante Y_cuped = Y - theta * (X - media(X)), donde theta = Cov(Y, X) / Var(X). La varianza se reduce en un factor (1 - r^2), permitiendo detectar efectos pequeños con mucha menor muestra.',
    codeSnippet: `import numpy as np
theta = np.cov(y_post, x_pre)[0, 1] / np.var(x_pre)
y_cuped = y_post - theta * (x_pre - np.mean(x_pre))`,
  },
  {
    id: 'fc-19',
    lessonId: 'l15-bi-tufte-code',
    stageId: 'stage-5',
    discipline: 'BI',
    bloomLevel: 'Evaluar',
    question:
      '¿Qué establece el principio de Data-Ink Ratio de Edward Tufte y cómo se aplica con atributos preatentivos en el diseño de dashboards ejecutivos?',
    answer:
      'El Data-Ink Ratio es la proporción de tinta (píxeles) del gráfico dedicada a representar datos reales frente al total de píxeles usados. Tufte prescribe eliminar todo el "chartjunk" (rejillas oscuras, fondos 3D, bordes redundantes, leyendas separadas) y usar atributos preatentivos (color de acento único para anomalías, posición en escala común y Small Multiples) para que la dirección detecte desviaciones en menos de 2 segundos.',
    codeSnippet: `{
  "mark": { "type": "bar", "cornerRadiusEnd": 2 },
  "encoding": {
    "x": { "field": "ingresos_m", "type": "quantitative", "axis": { "grid": false } },
    "y": { "field": "region", "type": "nominal", "sort": "-x", "axis": { "domain": false } }
  }
}`,
  },
  {
    id: 'fc-20',
    lessonId: 'l15-bi-tufte-code',
    stageId: 'stage-5',
    discipline: 'BI',
    bloomLevel: 'Aplicar',
    question:
      '¿Qué ventajas aporta el paradigma BI-as-Code (Evidence.dev, Lightdash, Rill, Malloy) frente a construir reportes manualmente con clics en herramientas legadas?',
    answer:
      'Con BI-as-Code, las consultas SQL, métricas y componentes visuales se definen en archivos Markdown/YAML versionados en Git. Esto habilita revisiones por Pull Request, entornos de previsualización por rama, pruebas automáticas de CI que verifican que ningún cambio en dbt/SQLMesh rompa un gráfico antes de fusionar a producción, y trazabilidad de linaje de extremo a extremo (Data-to-Dashboard Lineage).',
    codeSnippet: `SELECT
  mes,
  ingresos_netos_usd,
  ingresos_netos_usd - LAG(ingresos_netos_usd) OVER (ORDER BY mes) AS delta_mom
FROM gold.metricas_ejecutivas`,
  },
  {
    id: 'fc-21',
    lessonId: 'l16-cdc-kafka-streaming',
    stageId: 'stage-6',
    discipline: 'DE',
    bloomLevel: 'Analizar',
    question:
      '¿Por qué el Change Data Capture (CDC) basado en logs (Debezium leyendo el WAL de PostgreSQL o Binlog de MySQL) supera a la extracción por consultas SELECT con updated_at?',
    answer:
      'El CDC basado en el Write-Ahead Log (WAL) lee secuencialmente el registro de transacciones físicas ya confirmado por el motor OLTP sin ejecutar consultas pesadas contra los índices de producción. Además, captura el 100% de las transiciones intermedias de una fila y detecta los borrados físicos (Hard Deletes) como eventos explícitos (op: "d"), algo imposible cuando solo se hace polling por WHERE updated_at > last_run.',
    codeSnippet: `{
  "op": "u",
  "ts_ms": 1761682200125,
  "before": { "id": 4821, "plan": "PRO", "mrr_usd": 49 },
  "after":  { "id": 4821, "plan": "ENTERPRISE", "mrr_usd": 199 }
}`,
  },
  {
    id: 'fc-22',
    lessonId: 'l17-flink-watermarks-mv',
    stageId: 'stage-6',
    discipline: 'DE',
    bloomLevel: 'Aplicar',
    question:
      '¿Cuál es la diferencia entre Event Time y Processing Time en streaming (Apache Flink / Spark Structured Streaming) y para qué sirven los Watermarks?',
    answer:
      'Event Time es el instante en que ocurrió realmente el hecho en el dispositivo del usuario; Processing Time es cuando el servidor de streaming procesa el mensaje (que puede llegar minutos u horas tarde si el móvil estuvo sin cobertura). Un Watermark W(t) es un umbral monotónico que le indica al motor que no espera más eventos con timestamp < t, permitiendo cerrar ventanas de agregación con tolerancia controlada a datos tardíos (Bounded Out-of-Orderness).',
    codeSnippet: `CREATE TABLE pagos_stream (
  pago_id STRING,
  monto_usd DECIMAL(10, 2),
  evento_ts TIMESTAMP(3),
  WATERMARK FOR evento_ts AS evento_ts - INTERVAL '30' SECOND
);`,
  },
  {
    id: 'fc-23',
    lessonId: 'l18-mcp-semantic-ai-rag',
    stageId: 'stage-6',
    discipline: 'BI',
    bloomLevel: 'Crear',
    question:
      '¿Por qué conectar agentes de IA mediante un servidor Model Context Protocol (MCP) a la Capa Semántica es mucho más seguro que pedirle al LLM que invente SQL libre sobre tablas crudas?',
    answer:
      'El protocolo MCP expone herramientas tipadas (Tools) y recursos (Resources) de solo lectura donde el agente descubre las métricas oficiales y dimensiones certificadas de la Capa Semántica. En lugar de alucinar nombres de tablas o olvidar filtros de órdenes canceladas (Text-to-SQL crudo), el agente invoca la herramienta MCP query_semantic_metric con parámetros validados y credenciales acotadas con Row-Level Security.',
    codeSnippet: `server.tool(
  "consultar_metrica_certificada",
  { metrica: z.enum(["revenue_neto_oficial", "churn_mensual_pct"]) },
  async ({ metrica }) => semanticLayer.query({ metrica })
);`,
  },
  {
    id: 'fc-24',
    lessonId: 'l18-mcp-semantic-ai-rag',
    stageId: 'stage-6',
    discipline: 'DA',
    bloomLevel: 'Evaluar',
    question:
      '¿Cómo combina un sistema Hybrid RAG la búsqueda léxica (BM25) y la búsqueda vectorial densa (HNSW) mediante Reciprocal Rank Fusion (RRF)?',
    answer:
      'Los embeddings densos (HNSW) capturan similitud semántica pero suelen fallar al buscar códigos exactos de SKUs, errores SQL o acrónimos internos; por su parte, BM25 domina la coincidencia exacta de términos raros (TF-IDF con saturación). Hybrid RAG ejecuta ambas búsquedas en paralelo y fusiona los rankings sin necesidad de calibrar escalas de scores usando Reciprocal Rank Fusion: RRF(d) = sum(1 / (k + rank_i(d))), con k = 60.',
    codeSnippet: `SELECT
  COALESCE(s.doc_id, l.doc_id) AS doc_id,
  COALESCE(1.0 / (60 + s.r_vec), 0) + COALESCE(1.0 / (60 + l.r_bm25), 0) AS rrf_score
FROM semantica s
FULL OUTER JOIN lexica l ON s.doc_id = l.doc_id
ORDER BY rrf_score DESC
LIMIT 10;`,
  },
];

export const RATING_METADATA = {
  [Rating.Again]: { rating: Rating.Again, key: 'again', label: 'Otra vez', shortcut: '1' },
  [Rating.Hard]: { rating: Rating.Hard, key: 'hard', label: 'Difícil', shortcut: '2' },
  [Rating.Good]: { rating: Rating.Good, key: 'good', label: 'Bien', shortcut: '3' },
  [Rating.Easy]: { rating: Rating.Easy, key: 'easy', label: 'Fácil', shortcut: '4' },
};

export function toDate(value, fallback = new Date()) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value);
  }
  if (typeof value === 'string' && value.length > 0) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return fallback instanceof Date ? fallback : new Date(fallback);
}

export function normalizeRating(rating) {
  if (typeof rating === 'number') {
    if (rating === 1) return Rating.Again;
    if (rating === 2) return Rating.Hard;
    if (rating === 3) return Rating.Good;
    if (rating === 4) return Rating.Easy;
  }
  if (typeof rating === 'string') {
    const clean = rating.trim().toLowerCase();
    if (clean === 'again' || clean === '1' || clean === 'otra vez') return Rating.Again;
    if (clean === 'hard' || clean === '2' || clean === 'difícil' || clean === 'dificil') {
      return Rating.Hard;
    }
    if (clean === 'good' || clean === '3' || clean === 'bien') return Rating.Good;
    if (clean === 'easy' || clean === '4' || clean === 'fácil' || clean === 'facil') {
      return Rating.Easy;
    }
  }
  return Rating.Good;
}

export function deriveCompatBox(card) {
  if (!card || card.state === State.New || !card.reps) return 1;
  if (card.state === State.Relearning) return 1;
  if (card.state === State.Learning) return 2;
  const days = Number(card.scheduled_days ?? 0);
  const stability = Number(card.stability ?? 0);
  const effectiveDays = Math.max(days, stability);
  if (effectiveDays >= 21) return 5;
  if (effectiveDays >= 7) return 4;
  if (effectiveDays >= 2) return 3;
  return 2;
}

export function formatInterval(diffMs) {
  const safeMs = Math.max(0, Number(diffMs) || 0);
  const minutes = Math.round(safeMs / MINUTE_IN_MS);

  if (minutes <= 1) {
    return '1 min';
  }
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.round(safeMs / HOUR_IN_MS);
  if (hours < 24) {
    return `${hours} h`;
  }
  const days = Math.round(safeMs / DAY_IN_MS);
  if (days < 30) {
    return `${Math.max(1, days)} d`;
  }
  if (days < 365) {
    const months = Math.max(1, Math.round(days / 30));
    return months === 1 ? '1 mes' : `${months} meses`;
  }
  const years = Math.round((days / 365) * 10) / 10;
  return `${years} a`;
}

export function serializeFSRSCard(card, cardId = undefined) {
  const dueDate = toDate(card?.due, new Date(0));
  const lastReviewDate =
    card?.last_review !== undefined && card?.last_review !== null
      ? toDate(card.last_review, null)
      : null;

  const reps = Math.max(0, Math.floor(Number(card?.reps ?? card?.reviewCount ?? 0)));
  const lapses = Math.max(0, Math.floor(Number(card?.lapses ?? 0)));
  const scheduledDays = Math.max(0, Number(card?.scheduled_days ?? card?.intervalDays ?? 0));
  const elapsedDays = Math.max(0, Number(card?.elapsed_days ?? 0));
  const learningSteps = Math.max(0, Math.floor(Number(card?.learning_steps ?? 0)));
  const state = Math.min(3, Math.max(0, Math.floor(Number(card?.state ?? 0))));
  const stability = Math.max(0, Number(card?.stability ?? 0));
  const difficulty = Math.max(0, Number(card?.difficulty ?? 0));

  const serialized = {
    due: dueDate.toISOString(),
    stability,
    difficulty,
    elapsed_days: elapsedDays,
    scheduled_days: scheduledDays,
    learning_steps: learningSteps,
    reps,
    lapses,
    state,
    last_review: lastReviewDate ? lastReviewDate.toISOString() : null,
  };

  if (cardId || card?.cardId) {
    serialized.cardId = cardId || card.cardId;
  }

  // Campos derivados de compatibilidad para vistas de Fase 2 (SpacedRepetitionView / LearningAnalyticsView)
  const box = deriveCompatBox(serialized);
  serialized.box = box;
  serialized.intervalDays = Math.max(1, Math.round(scheduledDays || BOX_INTERVALS_DAYS[box] || 1));
  serialized.nextReviewAt = dueDate.getTime();
  serialized.lastReviewedAt = lastReviewDate ? lastReviewDate.getTime() : null;
  serialized.reviewCount = reps;

  return serialized;
}

export function createFSRSCard(now = new Date(), cardId = undefined) {
  const refDate = toDate(now, new Date());
  const empty = createEmptyCard(refDate);
  return serializeFSRSCard(empty, cardId);
}

export function leitnerCardToFSRS(legacyCard, cardId = undefined, now = new Date()) {
  if (!legacyCard || typeof legacyCard !== 'object') {
    return createFSRSCard(now, cardId);
  }

  // Si ya es una tarjeta FSRS con stability, difficulty y due válido:
  if (
    typeof legacyCard.stability === 'number' &&
    typeof legacyCard.difficulty === 'number' &&
    legacyCard.due !== undefined &&
    !('box' in legacyCard && legacyCard.stability === undefined)
  ) {
    return serializeFSRSCard(legacyCard, cardId || legacyCard.cardId);
  }

  const reps = Math.max(
    0,
    Math.floor(Number(legacyCard.reps ?? legacyCard.reviewCount ?? 0))
  );
  const lapses = Math.max(0, Math.floor(Number(legacyCard.lapses ?? 0)));
  const box = Math.min(5, Math.max(1, Math.floor(Number(legacyCard.box) || 1)));
  const lastRaw = legacyCard.last_review ?? legacyCard.lastReviewedAt ?? legacyCard.lastReviewedIso ?? null;
  const hasBeenReviewed = reps > 0 || box > 1 || Boolean(lastRaw);

  if (!hasBeenReviewed) {
    const freshDue =
      typeof legacyCard.nextReviewAt === 'number' && legacyCard.nextReviewAt > 0
        ? new Date(legacyCard.nextReviewAt)
        : toDate(now, new Date());
    return createFSRSCard(freshDue, cardId || legacyCard.cardId);
  }

  const scheduledDays = Math.max(
    0,
    Number(legacyCard.scheduled_days ?? legacyCard.intervalDays ?? BOX_INTERVALS_DAYS[box] ?? 1)
  );
  const stability =
    typeof legacyCard.stability === 'number' && legacyCard.stability > 0
      ? legacyCard.stability
      : Math.max(0.5, scheduledDays);
  const difficulty =
    typeof legacyCard.difficulty === 'number' && legacyCard.difficulty > 0
      ? legacyCard.difficulty
      : Math.min(10, Math.max(1, Number((6 - (box - 1) * 0.8 + lapses * 0.5).toFixed(2))));

  const state =
    typeof legacyCard.state === 'number'
      ? legacyCard.state
      : box === 1 && lapses > 0
        ? State.Relearning
        : box === 1
          ? State.Learning
          : State.Review;

  const dueRaw =
    legacyCard.due ??
    (typeof legacyCard.nextReviewAt === 'number' && legacyCard.nextReviewAt > 0
      ? legacyCard.nextReviewAt
      : legacyCard.nextReviewIso);

  const dueDate = dueRaw ? toDate(dueRaw, now) : toDate(now, new Date());
  const lastReviewDate = lastRaw ? toDate(lastRaw, now) : toDate(now, new Date());

  return serializeFSRSCard(
    {
      due: dueDate,
      stability,
      difficulty,
      elapsed_days: 0,
      scheduled_days: scheduledDays,
      learning_steps: 0,
      reps: Math.max(1, reps),
      lapses,
      state,
      last_review: lastReviewDate,
    },
    cardId || legacyCard.cardId
  );
}

export function toFSRSCardInput(card, now = new Date()) {
  const refDate = toDate(now, new Date());
  if (!card || typeof card !== 'object') {
    return createEmptyCard(refDate);
  }
  const normalized = leitnerCardToFSRS(card, card.cardId, refDate);
  return TypeConvert.card({
    due: toDate(normalized.due, refDate),
    stability: normalized.stability,
    difficulty: normalized.difficulty,
    elapsed_days: normalized.elapsed_days ?? 0,
    scheduled_days: normalized.scheduled_days ?? 0,
    learning_steps: normalized.learning_steps ?? 0,
    reps: normalized.reps ?? 0,
    lapses: normalized.lapses ?? 0,
    state: normalized.state ?? State.New,
    last_review: normalized.last_review ? toDate(normalized.last_review, refDate) : undefined,
  });
}

export function previewCardRatings(card, now = new Date()) {
  const refDate = toDate(now, new Date());
  const fsrsInput = toFSRSCardInput(card, refDate);
  const outcomes = scheduler.repeat(fsrsInput, refDate);

  const buildEntry = (ratingEnum) => {
    const item = outcomes[ratingEnum];
    const nextCard = serializeFSRSCard(item.card, card?.cardId);
    const dueMs = new Date(nextCard.due).getTime();
    const intervalMs = Math.max(0, dueMs - refDate.getTime());
    const meta = RATING_METADATA[ratingEnum];
    return {
      rating: ratingEnum,
      key: meta.key,
      label: meta.label,
      shortcut: meta.shortcut,
      due: nextCard.due,
      intervalMs,
      intervalLabel: formatInterval(intervalMs),
      card: nextCard,
      log: item.log,
    };
  };

  const again = buildEntry(Rating.Again);
  const hard = buildEntry(Rating.Hard);
  const good = buildEntry(Rating.Good);
  const easy = buildEntry(Rating.Easy);

  return {
    again,
    hard,
    good,
    easy,
    Again: again,
    Hard: hard,
    Good: good,
    Easy: easy,
    [Rating.Again]: again,
    [Rating.Hard]: hard,
    [Rating.Good]: good,
    [Rating.Easy]: easy,
  };
}

export const getNextIntervals = previewCardRatings;

export function gradeCard(card, rating, now = new Date()) {
  const ratingEnum = normalizeRating(rating);
  const previews = previewCardRatings(card, now);
  return previews[ratingEnum];
}

export function resolveCardLessonId(cardOrId) {
  if (!cardOrId) return null;
  if (typeof cardOrId === 'string') {
    const mapped = CARD_LESSON_MAP[cardOrId] || cardOrId;
    return LESSON_ID_ALIASES[mapped] || mapped;
  }
  const rawLessonId = cardOrId.lessonId || CARD_LESSON_MAP[cardOrId.id];
  if (!rawLessonId) return null;
  return LESSON_ID_ALIASES[rawLessonId] || rawLessonId;
}

export function extractStartedLessonIds(source) {
  const started = new Set();

  const addLessonId = (id) => {
    if (!id || typeof id !== 'string') return;
    if (id === 'lastLessonId' || id === 'activeLessonId') return;
    started.add(id);
    if (LESSON_ID_ALIASES[id]) {
      started.add(LESSON_ID_ALIASES[id]);
    }
    for (const [alias, canonical] of Object.entries(LESSON_ID_ALIASES)) {
      if (canonical === id) {
        started.add(alias);
      }
    }
  };

  if (!source) return started;

  if (source instanceof Set || Array.isArray(source)) {
    for (const id of source) addLessonId(id);
    return started;
  }

  if (typeof source === 'object') {
    if (source.startedLessonIds) {
      for (const id of extractStartedLessonIds(source.startedLessonIds)) started.add(id);
    }
    if (source.completedIds) {
      for (const id of extractStartedLessonIds(source.completedIds)) started.add(id);
    }
    if (source.unlockedLessonIds) {
      for (const id of extractStartedLessonIds(source.unlockedLessonIds)) started.add(id);
    }

    const lessonsMap =
      source.progress?.lessons && typeof source.progress.lessons === 'object'
        ? source.progress.lessons
        : source.lessons && typeof source.lessons === 'object' && !Array.isArray(source.lessons)
          ? source.lessons
          : null;

    if (lessonsMap) {
      for (const [lessonId, entry] of Object.entries(lessonsMap)) {
        if (!entry) continue;
        if (typeof entry === 'number') {
          addLessonId(lessonId);
          continue;
        }
        if (typeof entry === 'object') {
          const isStarted =
            entry.status === 'in_progress' ||
            entry.status === 'completed' ||
            entry.status === 'known' ||
            Boolean(entry.startedAt) ||
            Boolean(entry.completedAt) ||
            (typeof entry.stepIndex === 'number' && entry.stepIndex > 0) ||
            (entry.checks && Object.keys(entry.checks).length > 0) ||
            Boolean(entry.practice?.solved);
          if (isStarted) {
            addLessonId(lessonId);
          }
        }
      }
    }
  }

  return started;
}

function readFallbackStartedLessonIds() {
  if (externalStateProvider) {
    try {
      const storeState = externalStateProvider();
      if (storeState?.progress?.lessons) {
        return extractStartedLessonIds(storeState);
      }
    } catch {
      // ignore provider errors
    }
  }

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const rawGrano = window.localStorage.getItem('grano:v1');
      if (rawGrano) {
        const parsed = JSON.parse(rawGrano);
        return extractStartedLessonIds(parsed);
      }
    }
  } catch {
    // ignore storage errors
  }

  return new Set();
}

export function isCardDue(card, now = new Date()) {
  const refMs = toDate(now, new Date()).getTime();
  if (!card || card.due === undefined || card.due === null) {
    return true;
  }
  const dueMs = toDate(card.due, new Date(0)).getTime();
  return dueMs <= refMs;
}

/**
 * Obtiene las tarjetas FSRS vencidas (due <= now) filtradas únicamente a las lecciones
 * iniciadas o completadas por la persona.
 */
export function getDueCards(stateOrCards = {}, optionsOrFilter = 'ALL', nowArg = undefined) {
  let disciplineFilter = 'ALL';
  let explicitLessonsProvided = false;
  let startedLessonIds = new Set();
  let now = nowArg ? toDate(nowArg, new Date()) : new Date();
  let customCatalog = INITIAL_FLASHCARDS;

  // Caso 1: primer argumento es el estado completo grano:v1
  if (
    stateOrCards &&
    typeof stateOrCards === 'object' &&
    stateOrCards.progress?.lessons &&
    stateOrCards.review?.cards
  ) {
    explicitLessonsProvided = true;
    startedLessonIds = extractStartedLessonIds(stateOrCards);
  }

  // Analizar segundo argumento (filtro string, Array/Set de lessonIds, u objeto de opciones)
  if (typeof optionsOrFilter === 'string') {
    disciplineFilter = optionsOrFilter.trim().toUpperCase() || 'ALL';
  } else if (optionsOrFilter instanceof Set || Array.isArray(optionsOrFilter)) {
    explicitLessonsProvided = true;
    startedLessonIds = extractStartedLessonIds(optionsOrFilter);
  } else if (optionsOrFilter instanceof Date) {
    now = optionsOrFilter;
  } else if (optionsOrFilter && typeof optionsOrFilter === 'object') {
    if (typeof optionsOrFilter.filter === 'string') {
      disciplineFilter = optionsOrFilter.filter.trim().toUpperCase();
    } else if (typeof optionsOrFilter.disciplineFilter === 'string') {
      disciplineFilter = optionsOrFilter.disciplineFilter.trim().toUpperCase();
    }
    if (optionsOrFilter.now !== undefined) {
      now = toDate(optionsOrFilter.now, now);
    }
    if (Array.isArray(optionsOrFilter.catalog)) {
      customCatalog = optionsOrFilter.catalog;
    }
    if (
      'startedLessonIds' in optionsOrFilter ||
      'completedIds' in optionsOrFilter ||
      'unlockedLessonIds' in optionsOrFilter ||
      'lessons' in optionsOrFilter ||
      'progress' in optionsOrFilter
    ) {
      explicitLessonsProvided = true;
      startedLessonIds = extractStartedLessonIds(optionsOrFilter);
    }
  }

  if (!explicitLessonsProvided) {
    if (
      stateOrCards &&
      typeof stateOrCards === 'object' &&
      ('startedLessonIds' in stateOrCards || 'lessons' in stateOrCards)
    ) {
      explicitLessonsProvided = true;
      startedLessonIds = extractStartedLessonIds(stateOrCards);
    } else {
      startedLessonIds = readFallbackStartedLessonIds();
    }
  }

  // Las tarjetas solo aparecen como pendientes para lecciones iniciadas o completadas
  if (startedLessonIds.size === 0) {
    return [];
  }

  const rawCardsMap =
    stateOrCards?.review?.cards && typeof stateOrCards.review.cards === 'object'
      ? stateOrCards.review.cards
      : stateOrCards?.cards && typeof stateOrCards.cards === 'object'
        ? stateOrCards.cards
        : stateOrCards && typeof stateOrCards === 'object'
          ? stateOrCards
          : {};

  const nowMs = now.getTime();

  const dueList = [];
  for (const flashcard of customCatalog) {
    const lessonId = resolveCardLessonId(flashcard);
    const rawLessonId = flashcard.lessonId || CARD_LESSON_MAP[flashcard.id];
    const isLessonStarted =
      (lessonId && startedLessonIds.has(lessonId)) ||
      (rawLessonId && startedLessonIds.has(rawLessonId));

    if (!isLessonStarted) continue;

    if (
      disciplineFilter &&
      disciplineFilter !== 'ALL' &&
      disciplineFilter !== 'TODOS' &&
      disciplineFilter !== 'TODAS'
    ) {
      if (disciplineFilter.startsWith('STAGE-')) {
        if ((flashcard.stageId || '').toUpperCase() !== disciplineFilter) continue;
      } else if ((flashcard.discipline || '').toUpperCase() !== disciplineFilter) {
        continue;
      }
    }

    const storedCard = rawCardsMap[flashcard.id];
    const fsrsCard = storedCard
      ? leitnerCardToFSRS(storedCard, flashcard.id, new Date(0))
      : createFSRSCard(new Date(0), flashcard.id);

    const dueMs = toDate(fsrsCard.due, new Date(0)).getTime();
    const isDue = dueMs <= nowMs;
    if (!isDue) continue;

    const intervals = previewCardRatings(fsrsCard, now);

    dueList.push({
      ...flashcard,
      lessonId: rawLessonId || lessonId,
      ...fsrsCard,
      isDue: true,
      intervals: {
        again: intervals.again.intervalLabel,
        hard: intervals.hard.intervalLabel,
        good: intervals.good.intervalLabel,
        easy: intervals.easy.intervalLabel,
      },
    });
  }

  return dueList.sort((a, b) => {
    if (a.state !== b.state) return a.state - b.state;
    const dueA = toDate(a.due, new Date(0)).getTime();
    const dueB = toDate(b.due, new Date(0)).getTime();
    if (dueA !== dueB) return dueA - dueB;
    return a.id.localeCompare(b.id);
  });
}

export function normalizeReviewState(rawState = {}, now = new Date()) {
  const sourceCards =
    rawState?.review?.cards && typeof rawState.review.cards === 'object'
      ? rawState.review.cards
      : rawState?.cards && typeof rawState.cards === 'object'
        ? rawState.cards
        : rawState && typeof rawState === 'object'
          ? rawState
          : {};

  const cardsMap = {};
  const boxCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const nowMs = toDate(now, new Date()).getTime();
  let dueCount = 0;
  let reviewedAtLeastOnce = 0;

  for (const fc of INITIAL_FLASHCARDS) {
    const existing = sourceCards[fc.id];
    const card = existing
      ? leitnerCardToFSRS(existing, fc.id, new Date(0))
      : createFSRSCard(new Date(0), fc.id);
    cardsMap[fc.id] = card;
    const box = card.box || 1;
    boxCounts[box] = (boxCounts[box] || 0) + 1;
    if (toDate(card.due, new Date(0)).getTime() <= nowMs) {
      dueCount += 1;
    }
    if ((card.reps || 0) > 0) {
      reviewedAtLeastOnce += 1;
    }
  }

  // Preservar también cualquier tarjeta adicional fuera de las 24 iniciales
  for (const [cardId, existing] of Object.entries(sourceCards)) {
    if (!cardsMap[cardId] && existing && typeof existing === 'object' && ('due' in existing || 'box' in existing)) {
      cardsMap[cardId] = leitnerCardToFSRS(existing, cardId, new Date(0));
    }
  }

  const masteredCount = boxCounts[4] + boxCounts[5];
  const masteryPercentage = Math.round(
    (Object.entries(boxCounts).reduce(
      (acc, [box, count]) => acc + ((Number(box) - 1) / 4) * count,
      0
    ) /
      INITIAL_FLASHCARDS.length) *
      100
  );

  const stats = {
    totalCards: INITIAL_FLASHCARDS.length,
    dueCount,
    reviewedAtLeastOnce,
    masteredCount,
    masteryPercentage,
    totalReviews: rawState?.stats?.totalReviews || reviewedAtLeastOnce,
    lastReviewedAt: rawState?.stats?.lastReviewedAt || null,
    boxCounts,
  };

  const normalized = {
    version: 1,
    updatedAt: toDate(now, new Date()).getTime(),
    cards: cardsMap,
    stats,
    boxCounts,
  };

  for (const [cardId, cardProgress] of Object.entries(cardsMap)) {
    normalized[cardId] = cardProgress;
  }

  return normalized;
}

export function reviewCard(stateOrCards = {}, cardId, qualityOrRating, now = new Date()) {
  const current = normalizeReviewState(stateOrCards, now);
  const existing = current.cards[cardId] || createFSRSCard(new Date(0), cardId);
  const outcome = gradeCard(existing, qualityOrRating, now);

  const updatedCards = {
    ...current.cards,
    [cardId]: outcome.card,
  };

  return normalizeReviewState(
    {
      ...current,
      cards: updatedCards,
      stats: {
        ...current.stats,
        totalReviews: (current.stats?.totalReviews || 0) + 1,
        lastReviewedAt: toDate(now, new Date()).getTime(),
      },
    },
    now
  );
}

export function loadLeitnerState() {
  if (externalStateProvider) {
    try {
      const storeState = externalStateProvider();
      if (storeState?.review?.cards) {
        return normalizeReviewState(storeState.review.cards);
      }
    } catch {
      // ignore provider errors
    }
  }
  return normalizeReviewState({});
}

export function saveLeitnerState(state) {
  return normalizeReviewState(state);
}
