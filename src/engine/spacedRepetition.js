/**
 * Motor de Repetición Espaciada Leitner de 5 Cajas (Actual)
 * Diseñado para Ingeniería de Datos (DE), Análisis de Datos (DA) y Business Intelligence (BI).
 * Basado en principios de ciencia del aprendizaje (Recuerdo Activo + Taxonomía de Bloom + Intervalos Crecientes).
 */

export const BOX_INTERVALS_DAYS = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30,
};

const STORAGE_KEY = 'ruta_datos_2026_leitner_state_v1';
const DAY_IN_MS = 24 * 60 * 60 * 1000;

/**
 * 24 Flashcards de alto rigor técnico cubriendo las 6 etapas de la Ruta Integrada (Actual).
 * Cada tarjeta contiene: { id, stageId, discipline: 'DE'|'DA'|'BI', bloomLevel, question, answer, codeSnippet }
 */
export const INITIAL_FLASHCARDS = [
  // ==========================================
  // ETAPA 1: Fundamentos y SQL Analítico
  // ==========================================
  {
    id: 'fc-01',
    stageId: 'stage-1',
    discipline: 'BI',
    bloomLevel: 'Analizar',
    question:
      '¿Qué es la trampa de Fan-out (explosión de filas) en un JOIN y cómo distorsiona las métricas en un dashboard de BI?',
    answer:
      'Ocurre cuando se realiza un JOIN entre una tabla de grano fino y otra que no es única en la llave de cruce (relación 1:N o N:M) y luego se aplica SUM() o COUNT() sobre la tabla izquierda. Las filas del lado "1" se duplican N veces, inflando artificialmente ingresos o conteos. Se previene pre-agregando la tabla detalle en una CTE al mismo grano antes del JOIN o usando métricas semi-aditivas gobernadas.',
    codeSnippet: `-- ❌ INCORRECTO: Fan-out duplica el monto_orden por cada ítem del pedido
SELECT SUM(o.monto_total) AS ingresos_inflados
FROM ordenes o
JOIN orden_items i ON o.orden_id = i.orden_id;

-- ✅ CORRECTO: Pre-agregar al mismo grano (orden_id) antes del JOIN
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

  // ==========================================
  // ETAPA 2: Modelado de Datos y Diseño de Métricas
  // ==========================================
  {
    id: 'fc-04',
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
    stageId: 'stage-2',
    discipline: 'BI',
    bloomLevel: 'Evaluar',
    question:
      '¿Por qué las métricas no aditivas (ratios, tasas de conversión, ticket promedio, COUNT DISTINCT) nunca deben promediarse ni sumarse a partir de tablas pre-agregadas diarias?',
    answer:
      'Porque el promedio de promedios no pondera el volumen de cada día (un día con 10 visitas pesa igual que Black Friday con 1 millón), y la suma de usuarios únicos diarios (DAU) cuenta múltiples veces al mismo usuario recurrente en el mes (MAU). En BI siempre deben almacenarse numerador y denominador por separado (SUM(ingresos) / SUM(ordenes)) o usar HyperLogLog / sketches para cardinalidades.',
    codeSnippet: `-- ❌ INCORRECTO: Promediar el ticket promedio diario distorsiona el resultado mensual
SELECT AVG(ticket_promedio_diario) FROM resumen_diario;

-- ✅ CORRECTO: Sumar componentes aditivos (numerador / denominador)
SELECT
  SUM(ingresos_totales) / NULLIF(SUM(total_ordenes), 0) AS aov_ponderado_real
FROM gold.resumen_diario_ventas;`,
  },

  // ==========================================
  // ETAPA 3: Motores Columnares y Formatos Modernos
  // ==========================================
  {
    id: 'fc-08',
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
    stageId: 'stage-3',
    discipline: 'DE',
    bloomLevel: 'Comprender',
    question:
      '¿Qué significa que Apache Arrow permita transferencia Zero-Copy entre DuckDB, Polars, PySpark y Python?',
    answer:
      'Tradicionalmente, pasar datos entre motores requería serializar filas a bytes y deserializarlas (gastando hasta 70% de CPU). Apache Arrow define un formato estándar de buffers columnares contiguos en memoria RAM (con bitmaps de nulos y offsets alineados para SIMD). Con Zero-Copy, Polars y DuckDB comparten el mismo puntero de memoria RAM sin copiar ni transformar un solo byte.',
    codeSnippet: `import duckdb
import polars as pl

# Zero-Copy: DuckDB consulta un LazyFrame de Polars vía punteros de memoria Apache Arrow
df_polars = pl.scan_parquet("ventas_2026.parquet")
resultado_arrow = duckdb.sql("""
  SELECT region, SUM(monto_neto) AS total
  FROM df_polars
  WHERE estado = 'COMPLETADO'
  GROUP BY region
""").pl()  # Retorna a Polars sin serialización`,
  },
  {
    id: 'fc-10',
    stageId: 'stage-3',
    discipline: 'DA',
    bloomLevel: 'Evaluar',
    question:
      '¿En qué escenarios de 2026 es más eficiente ejecutar DuckDB en un solo nodo (Single-Node Vectorized Engine) en lugar de levantar un clúster distribuido de Apache Spark?',
    answer:
      'Para datasets de hasta 100 GB - 1 TB comprimidos (que representan más del 90% de las cargas analíticas reales), un nodo moderno con 64-128 GB de RAM y NVMe procesa datos en DuckDB más rápido y barato que un clúster Spark porque elimina el arranque de máquinas virtuales, la serialización de red (Shuffle) entre nodos y la sobrecarga de la JVM, usando ejecución vectorizada por lotes de caché L1/L2 y Out-of-Core spilling a disco.',
    codeSnippet: `-- DuckDB 1.x consultando archivos Parquet en S3 en paralelo con Out-of-Core activo
SET memory_limit = '16GB';
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
    stageId: 'stage-3',
    discipline: 'DE',
    bloomLevel: 'Aplicar',
    question:
      '¿Cuál es la diferencia arquitectónica entre la API Eager (pl.read_parquet) y la API Lazy (pl.scan_parquet) en Polars?',
    answer:
      'La API Eager carga todo el archivo en RAM inmediatamente y ejecuta cada paso secuencialmente creando copias intermedias. La API Lazy construye un grafo lógico ( Logical Plan ) y antes de ejecutar (.collect()) aplica un optimizador de consultas en Rust que realiza Predicate Pushdown (filtra al leer), Projection Pushdown (solo carga las columnas necesarias), Common Subplan Elimination y ejecución streaming multihilo.',
    codeSnippet: `import polars as pl

# API Lazy: El optimizador empuja el filtro y las 3 columnas hasta el lector Parquet
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

  // ==========================================
  // ETAPA 4: Open Lakehouse, Transformación y Capa Semántica
  // ==========================================
  {
    id: 'fc-12',
    stageId: 'stage-4',
    discipline: 'DE',
    bloomLevel: 'Analizar',
    question:
      '¿Qué aportan los Deletion Vectors (Roaring Bitmaps) y el tipo de dato binario Variant en la especificación Apache Iceberg v3?',
    answer:
      'En Iceberg v3, los Deletion Vectors reemplazan los antiguos archivos de borrado posicional por bitmaps compactos (Roaring Bitmaps) en formato Puffin que marcan qué filas fueron actualizadas o borradas (Merge-on-Read), acelerando los MERGE INTO y el cumplimiento GDPR sin reescribir archivos Parquet de cientos de megabytes. El tipo Variant almacena JSON semiestructurado en formato binario columnar tipado, permitiendo lectura rápida con sub-columnarización automática.',
    codeSnippet: `-- Tabla Apache Iceberg v3 con Deletion Vectors (Merge-on-Read) y columna Variant
CREATE TABLE catalog.silver.eventos_plataforma (
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
    stageId: 'stage-4',
    discipline: 'DE',
    bloomLevel: 'Aplicar',
    question:
      '¿Cómo funciona el patrón Write-Audit-Publish (WAP) sobre ramas de catálogo en Apache Iceberg para evitar que datos corruptos lleguen a los dashboards?',
    answer:
      'Con WAP, el pipeline escribe los nuevos datos en una rama aislada del catálogo Iceberg (ej. audit_branch) sin tocar la rama main que consumen los usuarios. Luego se ejecutan pruebas de calidad deterministas (unicidad, nulos, reconciliación de totales, anomalías de volumen) contra esa rama. Si todas pasan, se realiza un fast-forward atómico de metadatos hacia main; si fallan, se aborta sin haber contaminado producción.',
    codeSnippet: `-- 1. Crear rama aislada y escribir cambios
ALTER TABLE prod.gold.fact_ventas CREATE BRANCH audit_run_20261028;
INSERT INTO prod.gold.fact_ventas.branch_audit_run_20261028
SELECT * FROM staging.ventas_validadas;

-- 2. Auditar invariantes (cero nulos en PK y monto >= 0)
-- 3. Publicación atómica (Fast-Forward) tras pasar los tests
CALL system.fast_forward('prod.gold.fact_ventas', 'main', 'audit_run_20261028');`,
  },
  {
    id: 'fc-14',
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
  grain (fecha_orden, region_id),
  audits (
    not_null(columns := (fecha_orden, region_id)),
    positive_values(column := ingresos_netos)
  )
);

SELECT fecha_orden, region_id, SUM(monto_usd) AS ingresos_netos
FROM silver.ordenes
WHERE fecha_orden BETWEEN @start_ds AND @end_ds
GROUP BY ALL;`,
  },
  {
    id: 'fc-15',
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
info:
  title: Eventos de Ordenes de Checkout
  owner: checkout-platform-team
schema:
  - name: order_id
    type: string
    required: true
    unique: true
  - name: total_amount_cents
    type: int64
    quality:
      - type: sql
        query: "SELECT COUNT(*) FROM orders WHERE total_amount_cents < 0"
        mustBe: 0
slaProperties:
  - property: freshness
    value: 15m`,
  },
  {
    id: 'fc-16',
    stageId: 'stage-4',
    discipline: 'BI',
    bloomLevel: 'Crear',
    question:
      '¿Qué rol cumple una Capa Semántica (MetricFlow / Cube) entre el Lakehouse y las herramientas de BI o agentes de IA?',
    answer:
      'Centraliza las definiciones de métricas de negocio (Ingresos Netos Recurrentes, Churn, Margen Bruto) en código declarativo versionado en Git, separando las medidas (measures) de las dimensiones y entidades. Evita el "SQL Drift" donde Finanzas y Marketing calculan el mismo KPI con filtros distintos, y expone una API gobernada para que tanto dashboards como servidores MCP consulten exactamente la misma fórmula.',
    codeSnippet: `semantic_models:
  - name: ordenes_semantica
    model: ref('fact_ordenes')
    entities:
      - name: orden
        type: primary
        expr: orden_id
    dimensions:
      - name: fecha_orden
        type: time
        type_params: { time_granularity: day }
    measures:
      - name: ingresos_netos_aprobados
        agg: sum
        expr: CASE WHEN estado = 'APROBADA' THEN monto_neto_usd ELSE 0 END

metrics:
  - name: revenue_neto_oficial
    type: simple
    type_params:
      measure: ingresos_netos_aprobados`,
  },

  // ==========================================
  // ETAPA 5: Estadística Aplicada, Experimentación A/B y BI Efectivo
  // ==========================================
  {
    id: 'fc-17',
    stageId: 'stage-5',
    discipline: 'DA',
    bloomLevel: 'Evaluar',
    question:
      '¿Qué es el Sample Ratio Mismatch (SRM) en un experimento A/B y por qué invalida cualquier p-valor o lift observado?',
    answer:
      'El SRM ocurre cuando la proporción real de usuarios asignados a Control y Tratamiento difiere estadísticamente de la proporción diseñada (ej. se planeó 50%/50% pero llegaron 50.4%/49.6% con un p-valor de Chi-cuadrado < 0.001). Indica un sesgo grave de selección o pérdida asimétrica de telemetría (ej. la variante B tarda más en cargar y pierde eventos en móviles lentos), invalidando por completo la inferencia causal del test.',
    codeSnippet: `from scipy.stats import chisquare

# Diseño esperado 50/50 sobre 100,000 usuarios vs conteos observados
observados = [50450, 49550]
esperados = [50000, 50000]
stat, p_val_srm = chisquare(f_obs=observados, f_exp=esperados)

if p_val_srm < 0.001:
    raise RuntimeError(f"🚨 SRM detectado (p={p_val_srm:.6f}): Experimento INVÁLIDO.")`,
  },
  {
    id: 'fc-18',
    stageId: 'stage-5',
    discipline: 'DA',
    bloomLevel: 'Aplicar',
    question:
      '¿Cómo logra la técnica CUPED (Controlled-experiment Using Pre-Experiment Data) reducir la varianza y acortar el tiempo necesario de un A/B test?',
    answer:
      'CUPED utiliza una covariable X medida ANTES de iniciar el experimento (ej. el gasto del mismo usuario en los 14 días previos) que esté correlacionada con la métrica objetivo Y. Como X no pudo ser afectada por el tratamiento, sustrae la variabilidad preexistente mediante Y_cuped = Y - θ(X - media(X)), donde θ = Cov(Y, X) / Var(X). La varianza se reduce en un factor (1 - r²), permitiendo detectar efectos pequeños con mucha menor muestra.',
    codeSnippet: `import numpy as np

# Reducción de varianza CUPED: Y = gasto durante test, X = gasto pre-experimento
theta = np.cov(y_post, x_pre)[0, 1] / np.var(x_pre)
y_cuped = y_post - theta * (x_pre - np.mean(x_pre))

reduccion_pct = (1 - np.var(y_cuped) / np.var(y_post)) * 100
print(f"Varianza reducida en {reduccion_pct:.1f}% sin sesgar el estimador ATE")`,
  },
  {
    id: 'fc-19',
    stageId: 'stage-5',
    discipline: 'BI',
    bloomLevel: 'Evaluar',
    question:
      '¿Qué establece el principio de Data-Ink Ratio de Edward Tufte y cómo se aplica con atributos preatentivos en el diseño de dashboards ejecutivos?',
    answer:
      'El Data-Ink Ratio es la proporción de tinta (píxeles) del gráfico dedicada a representar datos reales frente al total de píxeles usados. Tufte prescribe eliminar todo el "chartjunk" (rejillas oscuras, fondos 3D, bordes redundantes, leyendas separadas) y usar atributos preatentivos (color de acento único para anomalías, posición en escala común y Small Multiples) para que la dirección detecte desviaciones en menos de 2 segundos.',
    codeSnippet: `// Configuración Vega-Lite / BI-as-Code: alto Data-Ink Ratio + color preatentivo
{
  "mark": { "type": "bar", "cornerRadiusEnd": 2 },
  "encoding": {
    "x": { "field": "ingresos_m", "type": "quantitative", "axis": { "grid": false } },
    "y": { "field": "region", "type": "nominal", "sort": "-x", "axis": { "domain": false } },
    "color": {
      "condition": { "test": "datum.cumple_meta === false", "value": "#DC2626" },
      "value": "#94A3B8"
    }
  }
}`,
  },
  {
    id: 'fc-20',
    stageId: 'stage-5',
    discipline: 'BI',
    bloomLevel: 'Aplicar',
    question:
      '¿Qué ventajas aporta el paradigma BI-as-Code (Evidence.dev, Lightdash, Rill, Malloy) frente a construir reportes manualmente con clics en herramientas legadas?',
    answer:
      'Con BI-as-Code, las consultas SQL, métricas y componentes visuales se definen en archivos Markdown/YAML versionados en Git. Esto habilita revisiones por Pull Request, entornos de previsualización por rama, pruebas automáticas de CI que verifican que ningún cambio en dbt/SQLMesh rompa un gráfico antes de fusionar a producción, y trazabilidad de linaje de extremo a extremo (Data-to-Dashboard Lineage).',
    codeSnippet: `<!-- Reporte ejecutivo versionado en Git con Evidence.dev (BI-as-Code) -->
\`\`\`sql kpi_mensual
SELECT
  mes,
  ingresos_netos_usd,
  margen_bruto_pct,
  ingresos_netos_usd - LAG(ingresos_netos_usd) OVER (ORDER BY mes) AS delta_mom
FROM gold.metricas_ejecutivas
\`\`\`

<BigValue data={kpi_mensual} value="ingresos_netos_usd" comparison="delta_mom" fmt="usd0" />`,
  },

  // ==========================================
  // ETAPA 6: Streaming en Tiempo Real e IA Conectada a Datos (Actual)
  // ==========================================
  {
    id: 'fc-21',
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
  "source": { "connector": "postgresql", "db": "core_prod", "table": "suscripciones", "lsn": 94827162 },
  "before": { "id": 4821, "plan": "PRO", "mrr_usd": 49 },
  "after":  { "id": 4821, "plan": "ENTERPRISE", "mrr_usd": 199 }
}`,
  },
  {
    id: 'fc-22',
    stageId: 'stage-6',
    discipline: 'DE',
    bloomLevel: 'Aplicar',
    question:
      '¿Cuál es la diferencia entre Event Time y Processing Time en streaming (Apache Flink / Spark Structured Streaming) y para qué sirven los Watermarks?',
    answer:
      'Event Time es el instante en que ocurrió realmente el hecho en el dispositivo del usuario; Processing Time es cuando el servidor de streaming procesa el mensaje (que puede llegar minutos u horas tarde si el móvil estuvo sin cobertura). Un Watermark W(t) es un umbral monotónico que le indica al motor que no espera más eventos con timestamp < t, permitiendo cerrar ventanas de agregación con tolerancia controlada a datos tardíos (Bounded Out-of-Orderness).',
    codeSnippet: `-- Apache Flink SQL: Ventana de 5 min por Event Time con Watermark de 30s de tolerancia
CREATE TABLE pagos_stream (
  pago_id STRING,
  comercio_id STRING,
  monto_usd DECIMAL(10, 2),
  evento_ts TIMESTAMP(3),
  WATERMARK FOR evento_ts AS evento_ts - INTERVAL '30' SECOND
) WITH ('connector' = 'kafka', 'topic' = 'pagos.cdc', 'format' = 'avro-confluent');`,
  },
  {
    id: 'fc-23',
    stageId: 'stage-6',
    discipline: 'BI',
    bloomLevel: 'Crear',
    question:
      '¿Por qué conectar agentes de IA mediante un servidor Model Context Protocol (MCP) a la Capa Semántica es mucho más seguro que pedirle al LLM que invente SQL libre sobre tablas crudas?',
    answer:
      'El protocolo MCP expone herramientas tipadas (Tools) y recursos (Resources) de solo lectura donde el agente descubre las métricas oficiales y dimensiones certificadas de la Capa Semántica. En lugar de alucinar nombres de tablas o olvidar filtros de órdenes canceladas (Text-to-SQL crudo), el agente invoca la herramienta MCP query_semantic_metric con parámetros validados y credenciales acotadas con Row-Level Security.',
    codeSnippet: `// Definición de Tool en un servidor MCP conectado a la Capa Semántica
server.tool(
  "consultar_metrica_certificada",
  {
    metrica: z.enum(["revenue_neto_oficial", "churn_mensual_pct", "ltv_cac_ratio"]),
    dimensiones: z.array(z.enum(["region", "canal", "segmento"])),
    fecha_inicio: z.string().date(),
    fecha_fin: z.string().date(),
  },
  async ({ metrica, dimensiones, fecha_inicio, fecha_fin }) => {
    return await semanticLayer.query({ metrica, dimensiones, fecha_inicio, fecha_fin });
  }
);`,
  },
  {
    id: 'fc-24',
    stageId: 'stage-6',
    discipline: 'DA',
    bloomLevel: 'Evaluar',
    question:
      '¿Cómo combina un sistema Hybrid RAG la búsqueda léxica (BM25) y la búsqueda vectorial densa (HNSW) mediante Reciprocal Rank Fusion (RRF)?',
    answer:
      'Los embeddings densos (HNSW) capturan similitud semántica pero suelen fallar al buscar códigos exactos de SKUs, errores SQL o acrónimos internos; por su parte, BM25 domina la coincidencia exacta de términos raros (TF-IDF con saturación). Hybrid RAG ejecuta ambas búsquedas en paralelo y fusiona los rankings sin necesidad de calibrar escalas de scores usando Reciprocal Rank Fusion: RRF(d) = Σ 1 / (k + rank_i(d)), con k ≈ 60.',
    codeSnippet: `-- Hybrid Search en DuckDB / Postgres (pgvector + FTS) usando Reciprocal Rank Fusion (k=60)
WITH semantica AS (
  SELECT doc_id, ROW_NUMBER() OVER (ORDER BY array_cosine_distance(embedding, $query_vec)) AS r_vec
  FROM docs_conocimiento LIMIT 50
),
lexica AS (
  SELECT doc_id, ROW_NUMBER() OVER (ORDER BY fts_main_docs.match_bm25(doc_id, $query_text) DESC) AS r_bm25
  FROM docs_conocimiento LIMIT 50
)
SELECT
  COALESCE(s.doc_id, l.doc_id) AS doc_id,
  COALESCE(1.0 / (60 + s.r_vec), 0) + COALESCE(1.0 / (60 + l.r_bm25), 0) AS rrf_score
FROM semantica s
FULL OUTER JOIN lexica l ON s.doc_id = l.doc_id
ORDER BY rrf_score DESC
LIMIT 10;`,
  },
];

/**
 * Construye el estado inicial por defecto de una tarjeta en la Caja 1 (vencida hoy para estudio inmediato).
 */
function createDefaultCardProgress(cardId) {
  return {
    cardId,
    box: 1,
    intervalDays: BOX_INTERVALS_DAYS[1],
    nextReviewAt: 0, // 0 = disponible inmediatamente para revisión
    lastReviewedAt: null,
    reviewCount: 0,
    streak: 0,
    lapses: 0,
    lastQuality: null,
  };
}

/**
 * Calcula estadísticas agregadas del sistema Leitner a partir del mapa de tarjetas.
 */
function computeLeitnerStats(cardsMap, prevStats = {}) {
  const boxCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const now = Date.now();
  let dueCount = 0;
  let reviewedAtLeastOnce = 0;

  for (const card of INITIAL_FLASHCARDS) {
    const progress = cardsMap[card.id] || createDefaultCardProgress(card.id);
    const box = Math.min(5, Math.max(1, Number(progress.box) || 1));
    boxCounts[box] = (boxCounts[box] || 0) + 1;
    if ((progress.nextReviewAt ?? 0) <= now) {
      dueCount += 1;
    }
    if ((progress.reviewCount || 0) > 0) {
      reviewedAtLeastOnce += 1;
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

  return {
    totalCards: INITIAL_FLASHCARDS.length,
    dueCount,
    reviewedAtLeastOnce,
    masteredCount,
    masteryPercentage,
    totalReviews: prevStats.totalReviews || 0,
    lastReviewedAt: prevStats.lastReviewedAt || null,
    boxCounts,
  };
}

/**
 * Normaliza un objeto de estado Leitner garantizando que las 24 tarjetas existan
 * tanto en `state.cards[cardId]` como en acceso directo `state[cardId]` para máxima compatibilidad.
 */
function normalizeLeitnerState(rawState = {}) {
  const sourceCards = rawState?.cards && typeof rawState.cards === 'object' ? rawState.cards : rawState;
  const cardsMap = {};

  for (const card of INITIAL_FLASHCARDS) {
    const existing = sourceCards?.[card.id];
    if (existing && typeof existing === 'object' && 'box' in existing) {
      const validBox = Math.min(5, Math.max(1, Number(existing.box) || 1));
      cardsMap[card.id] = {
        cardId: card.id,
        box: validBox,
        intervalDays: existing.intervalDays ?? BOX_INTERVALS_DAYS[validBox],
        nextReviewAt: typeof existing.nextReviewAt === 'number' ? existing.nextReviewAt : 0,
        lastReviewedAt: existing.lastReviewedAt ?? null,
        reviewCount: Number(existing.reviewCount) || 0,
        streak: Number(existing.streak) || 0,
        lapses: Number(existing.lapses) || 0,
        lastQuality: existing.lastQuality ?? null,
      };
    } else {
      cardsMap[card.id] = createDefaultCardProgress(card.id);
    }
  }

  const stats = computeLeitnerStats(cardsMap, rawState?.stats);

  const normalized = {
    version: '2026.10',
    updatedAt: rawState?.updatedAt || Date.now(),
    cards: cardsMap,
    stats,
    boxCounts: stats.boxCounts,
  };

  // Exponer también cada cardId en la raíz para consumidores que indexen state[cardId]
  for (const [cardId, progress] of Object.entries(cardsMap)) {
    normalized[cardId] = progress;
  }

  return normalized;
}

/**
 * Carga el estado Leitner desde localStorage o inicializa las 24 tarjetas en la Caja 1.
 */
export function loadLeitnerState() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return normalizeLeitnerState(parsed);
      }
    }
  } catch {
    // En caso de almacenamiento bloqueado o JSON corrupto, retornar estado limpio
  }
  return normalizeLeitnerState({});
}

/**
 * Persiste el estado Leitner en localStorage y devuelve el estado normalizado.
 */
export function saveLeitnerState(state) {
  const normalized = normalizeLeitnerState(state);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const payload = {
        version: normalized.version,
        updatedAt: Date.now(),
        cards: normalized.cards,
        stats: normalized.stats,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }
  } catch {
    // Ignorar errores de cuota en ambientes sin localStorage
  }
  return normalized;
}

/**
 * Registra la revisión de una tarjeta según la calidad de respuesta:
 * - 'again': regresa a la Caja 1 (1 día) y reinicia la racha de aciertos.
 * - 'hard': se mantiene en la caja actual (o baja 1 si estaba en caja alta, mín. Caja 1) para reforzar.
 * - 'good': avanza +1 caja (hasta Caja 5) y programa el intervalo correspondiente.
 * - 'easy': avanza +2 cajas (hasta Caja 5) por dominio fluido e inmediato.
 *
 * @param {Object} state Estado actual del sistema Leitner
 * @param {string} cardId ID de la tarjeta ('fc-01' .. 'fc-24')
 * @param {'again'|'hard'|'good'|'easy'} quality Calidad del recuerdo activo
 * @returns {Object} Nuevo estado inmutable actualizado y persistido
 */
export function reviewCard(state, cardId, quality) {
  const current = normalizeLeitnerState(state);
  const prevCard = current.cards[cardId] || createDefaultCardProgress(cardId);
  const currentBox = Math.min(5, Math.max(1, Number(prevCard.box) || 1));
  const now = Date.now();

  let nextBox = currentBox;
  let nextStreak = prevCard.streak || 0;
  let nextLapses = prevCard.lapses || 0;

  switch (quality) {
    case 'again':
      nextBox = 1;
      nextStreak = 0;
      nextLapses += 1;
      break;
    case 'hard':
      nextBox = Math.max(1, currentBox);
      nextStreak = Math.max(0, nextStreak);
      break;
    case 'good':
      nextBox = Math.min(5, currentBox + 1);
      nextStreak += 1;
      break;
    case 'easy':
      nextBox = Math.min(5, currentBox + 2);
      nextStreak += 2;
      break;
    default:
      nextBox = Math.min(5, currentBox + 1);
      nextStreak += 1;
      break;
  }

  const intervalDays = BOX_INTERVALS_DAYS[nextBox] || BOX_INTERVALS_DAYS[1];
  const nextReviewAt = now + intervalDays * DAY_IN_MS;

  const updatedCards = {
    ...current.cards,
    [cardId]: {
      ...prevCard,
      cardId,
      box: nextBox,
      intervalDays,
      lastReviewedAt: now,
      nextReviewAt,
      reviewCount: (prevCard.reviewCount || 0) + 1,
      streak: nextStreak,
      lapses: nextLapses,
      lastQuality: quality,
    },
  };

  const nextState = normalizeLeitnerState({
    ...current,
    updatedAt: now,
    cards: updatedCards,
    stats: {
      ...current.stats,
      totalReviews: (current.stats?.totalReviews || 0) + 1,
      lastReviewedAt: now,
    },
  });

  return saveLeitnerState(nextState);
}

/**
 * Obtiene la cola priorizada de tarjetas pendientes de repaso (nextReviewAt <= ahora),
 * filtrada opcionalmente por disciplina ('DE' | 'DA' | 'BI' | 'ALL') o etapa ('stage-1'..'stage-6').
 *
 * @param {Object} state Estado actual Leitner
 * @param {string} [disciplineFilter] Filtro opcional ('DE', 'DA', 'BI', 'ALL' o stageId)
 * @returns {Array} Lista de flashcards enriquecidas con su metadato de caja e intervalo
 */
export function getDueCards(state, disciplineFilter = 'ALL') {
  const current = normalizeLeitnerState(state || loadLeitnerState());
  const now = Date.now();
  const normalizedFilter =
    typeof disciplineFilter === 'string' ? disciplineFilter.trim().toUpperCase() : 'ALL';

  const enrichedCards = INITIAL_FLASHCARDS.map((card) => {
    const progress = current.cards[card.id] || createDefaultCardProgress(card.id);
    const isDue = (progress.nextReviewAt ?? 0) <= now;
    return {
      ...card,
      box: progress.box,
      intervalDays: progress.intervalDays,
      nextReviewAt: progress.nextReviewAt,
      lastReviewedAt: progress.lastReviewedAt,
      reviewCount: progress.reviewCount,
      streak: progress.streak,
      lapses: progress.lapses,
      lastQuality: progress.lastQuality,
      isDue,
    };
  });

  const filtered = enrichedCards.filter((card) => {
    if (!card.isDue) return false;
    if (
      !normalizedFilter ||
      normalizedFilter === 'ALL' ||
      normalizedFilter === 'TODOS' ||
      normalizedFilter === 'TODAS'
    ) {
      return true;
    }
    if (normalizedFilter.startsWith('STAGE-')) {
      return card.stageId.toUpperCase() === normalizedFilter;
    }
    return card.discipline.toUpperCase() === normalizedFilter;
  });

  // Ordenar pedagógicamente: primero las cajas más bajas (Caja 1 -> 5), luego las más vencidas
  return filtered.sort((a, b) => {
    if (a.box !== b.box) return a.box - b.box;
    if ((a.nextReviewAt || 0) !== (b.nextReviewAt || 0)) {
      return (a.nextReviewAt || 0) - (b.nextReviewAt || 0);
    }
    return a.id.localeCompare(b.id);
  });
}
