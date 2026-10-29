export const STAGE_3_LESSONS = [
  {
    id: 'l7-columnar-parquet',
    stageId: 'stage-3',
    order: 7,
    title: 'Formato físico Parquet y zone maps',
    subtitle: 'Organización por grupos de filas, codificación por diccionario y salto de bloques en disco.',
    duration: '30 min',
    level: 'Intermedio',
    bloomLevel: 'understand',
    coreFocus: ['DE', 'DA', 'BI'],
    goal: 'Comprender la arquitectura física de un archivo Apache Parquet v2 (Row Groups, Column Chunks, Data Pages, Zone Maps y Split-Block Bloom Filters) y cómo el ordenamiento físico permite saltar hasta el 98% del I/O.',
    visualType: 'row-vs-columnar-storage',
    storyContext:
      'Caso real en RetailStream: La tabla de eventos `fact_telemetry` tiene 60 columnas y 100 millones de filas (120 GB sin comprimir). El dashboard ejecutivo de BI solo necesita ejecutar `SELECT country_code, SUM(revenue_usd) FROM fact_telemetry WHERE event_date = \'2026-10-28\'`. En una réplica PostgreSQL orientada a filas, el disco lee los 120 GB completos porque cada fila guarda las 60 columnas contiguas. Al migrar a Parquet v2 ordenado por fecha y con Bloom Filters, la consulta lee apenas 42 MB y responde en 80 milisegundos.',
    sections: [
      {
        heading: 'Almacenamiento por filas (NSM) frente a formato híbrido columnar (PAX)',
        body: 'En bases de datos transaccionales como PostgreSQL o MySQL (modelo NSM, N-ary Storage Model), todos los atributos de una fila (`event_id, user_id, email, device_os, country_code, revenue_usd...`) se escriben contiguos en páginas de 8 KB. Esto es ideal para insertar o actualizar un pedido individual (`INSERT INTO orders`), pero desastroso para analítica: sumar una sola columna obliga al disco y a la RAM a transferir las otras 59 columnas irrelevantes.\nApache Parquet implementa la arquitectura híbrida PAX (Partition Attributes Across): primero divide la tabla horizontalmente en **Row Groups** (bloques de 128 MB a 512 MB o ~1 millón de filas) y, dentro de cada Row Group, almacena cada columna de forma vertical y contigua en un **Column Chunk** dividido en **Data Pages**.',
      },
      {
        heading: 'Codificaciones en Parquet: diccionario, RLE y empaquetado delta',
        body: 'Cuando millones de valores de la misma columna viven juntos en un Column Chunk, su entropía cae drásticamente y permite aplicar codificaciones especializadas antes de la compresión general (Zstandard):\n- **Dictionary Encoding + RLE / Bit-Packing**: Si `country_code` tiene solo 40 países repetidos en 1 millón de filas, Parquet crea un diccionario local (`0 = MX, 1 = CO, 2 = ES...`) y reemplaza las cadenas por enteros de 6 bits; si además las filas están ordenadas, agrupa secuencias idénticas con Run-Length Encoding (`[MX, 14500 veces]`).\n- **Delta Binary Packed y Byte Stream Split (Parquet v2)**: Para timestamps y secuencias enteras almacena únicamente la diferencia (`delta`) entre valores consecutivos, y para números de punto flotante (`FLOAT`/`DOUBLE`) separa los bytes de signo, exponente y mantisa para maximizar la compresión ZSTD.',
      },
      {
        heading: 'Zone maps, índice de páginas y efecto del ordenamiento físico',
        body: 'En el **Footer** del archivo Parquet y en el **ColumnIndex** de cada página se guardan estadísticas exactas por bloque: `min_value`, `max_value` y `null_count` (conocidos como **Zone Maps**). Cuando ejecutas `WHERE event_date = \'2026-10-28\'` (**Predicate Pushdown**), el motor lee primero el Footer de pocos kilobytes: si un Row Group reporta `min = 2026-10-01` y `max = 2026-10-05`, el motor salta esos 128 MB sin siquiera solicitarlos a S3/GCS (**Data Skipping**).\nAtención al matiz crítico: si insertas datos en orden aleatorio respecto a `event_date`, todos los Row Groups tendrán `min = 2026-01-01` y `max = 2026-10-28`, inutilizando por completo los Zone Maps. Ordenar físicamente (`ORDER BY event_date, country_code` o curvas espaciales **Z-Order / Hilbert** cuando filtras por varias dimensiones) es lo que activa el salto de bloques.',
      },
      {
        heading: 'Filtros de Bloom por bloques y el problema de los archivos pequeños',
        body: '¿Qué ocurre cuando un analista busca un identificador puntual de alta cardinalidad como `WHERE order_id = \'ORD-8841209\'`? Como los UUIDs o hashes se distribuyen en todo el rango alfanumérico, el `min` y `max` de cada Row Group siempre cubrirán desde `ORD-000...` hasta `ORD-999...`, haciendo que los Zone Maps no descarten nada.\nPara resolverlo, Parquet v2 incorpora **Split-Block Bloom Filters (SBBF)**: estructuras probabilísticas ultracompactas en bits que responden con **0% de falsos negativos** si un `order_id` NO existe en ese Row Group, permitiendo saltar el 99% de los bloques en búsquedas de aguja en un pajar. Finalmente, evita siempre el **Small Files Problem** (miles de archivos de 2 MB en Object Storage): la latencia de red HTTP por abrir cada archivo destruye el rendimiento; compacta siempre en archivos de 128 MB a 512 MB.',
      },
    ],
    triadPerspectives: {
      DE: {
        title: 'Qué construye y optimiza ingeniería (DE)',
        points: [
          'Configura compresión `ZSTD` (mejor balance ratio/velocidad en 2026 que Snappy o Gzip) y ordena las tablas (`ORDER BY` o `Z-ORDER`) por las claves de filtro más frecuentes antes de escribir Parquet.',
          'Habilita `bloom_filter_columns` sobre llaves de alta cardinalidad (`user_id`, `order_id`, `trace_id`) y ejecuta jobs de compactación para mantener archivos entre 128 MB y 512 MB.',
          'Garantiza tipos numéricos y temporales nativos (`TIMESTAMP`, `DECIMAL(12,2)`, `INT32`) en lugar de guardar todo como `VARCHAR` que arruina los Zone Maps.',
        ],
      },
      DA: {
        title: 'Qué aplica análisis de datos (DA)',
        points: [
          'Destierra por completo el hábito de `SELECT *`: selecciona explícitamente solo las 3 o 5 columnas necesarias (**Projection Pushdown**) para reducir el I/O en un 90%.',
          'Escribe predicados **SARGables** (Search Argument Able): filtra con `WHERE event_ts >= \'2026-10-28\'` en lugar de envolver la columna en funciones como `WHERE CAST(event_ts AS VARCHAR) LIKE \'2026-10-28%\'` que ciegan los Zone Maps.',
          'Aprovecha la lectura directa de metadatos (`parquet_metadata()` en DuckDB) para diagnosticar el tamaño de Row Groups y el ratio de compresión por columna.',
        ],
      },
      BI: {
        title: 'Qué gobierna business intelligence (BI)',
        points: [
          'Diseña dashboards con filtros obligatorios por rango de fecha predeterminado (ej. últimos 30 días) alineados con la clave de ordenamiento física del archivo Parquet.',
          'Monitorea los bytes escaneados por consulta en el motor del Lakehouse: un salto repentino en gigabytes leídos por reporte suele indicar que un filtro dejó de aprovechar el podado de bloques.',
          'Reemplaza extractos propietarios duplicados conectando la capa semántica en modo lectura directa sobre tablas columnares bien compactadas.',
        ],
      },
    },
    relatedLessons: [
      { id: 'l4-star-schema-obt', reason: 'Comprende por qué las tablas anchas (One Big Table) comprimen tan bien gracias a Dictionary Encoding y RLE en Parquet.' },
      { id: 'l8-arrow-lance-vortex', reason: 'Descubre qué ocurre cuando los bloques de Parquet pasan del disco a la memoria RAM con Apache Arrow y SIMD.' },
      { id: 'l10-iceberg-v3-medallion', reason: 'Aprende cómo Apache Iceberg v3 coordina miles de archivos Parquet con transacciones ACID y Deletion Vectors.' },
    ],
    playground: {
      description: 'Compara el impacto físico en I/O entre una consulta con antipatrones (`SELECT *` y función sobre la columna filtrada) frente a una consulta con Projection y Predicate Pushdown sobre Parquet v2 ordenado:',
      badQueryLabel: 'Antipatrón: SELECT * y predicado con función envolvente',
      badQuery: `-- MAL: 1) SELECT * obliga a descomprimir las 60 columnas de todos los Row Groups.
-- 2) Aplicar STRFTIME() sobre la columna impide comparar directamente contra el min/max del Footer.
SELECT *
FROM read_parquet('s3://lakehouse/gold/events_2026_unsorted.parquet')
WHERE STRFTIME(event_ts, '%Y-%m-%d') = '2026-10-28';`,
      badResult: [
        {
          columnas_leidas: '60 / 60 (100%)',
          row_groups_escaneados: '100 / 100 (Sin podado)',
          datos_transferidos: '18.40 GB',
          latencia_consulta: '14.20 seg',
        },
      ],
      goodQueryLabel: 'Solución óptima: proyección selectiva, rango directo y ZSTD',
      goodQuery: `-- EXCELENTE: 1) Escribir el Parquet ordenado físicamente con ZSTD y Row Groups de 1M filas
COPY (
  SELECT * FROM silver.events ORDER BY event_ts, country_code
) TO 's3://lakehouse/gold/events_2026_sorted.parquet'
  (FORMAT PARQUET, PARQUET_VERSION V2, COMPRESSION ZSTD, ROW_GROUP_SIZE 1000000);

-- 2) Consultar proyectando solo 2 columnas y un rango de comparación directa sobre event_ts
SELECT
  country_code,
  SUM(revenue_usd) AS total_revenue_usd
FROM read_parquet('s3://lakehouse/gold/events_2026_sorted.parquet')
WHERE event_ts >= TIMESTAMP '2026-10-28 00:00:00'
  AND event_ts <  TIMESTAMP '2026-10-29 00:00:00'
GROUP BY country_code;`,
      goodResult: [
        {
          columnas_leidas: '2 / 60 (3.3%)',
          row_groups_escaneados: '2 / 100 (98% saltados)',
          datos_transferidos: '42.10 MB',
          latencia_consulta: '0.08 seg',
        },
      ],
    },
    codeChallenge: {
      title: 'Escritura ordenada y lectura con zone maps',
      instruction:
        'Completa el pipeline en DuckDB SQL para: 1) Ordenar físicamente la tabla por fecha y país al exportar a Parquet v2 con compresión `ZSTD`, y 2) Consultar únicamente las columnas requeridas usando un predicado temporal directo que aproveche los Zone Maps.',
      templateCode: `-- Paso 1: Materializar el archivo Parquet optimizado para lectura analítica
COPY (
  SELECT event_ts, country_code, order_id, revenue_usd
  FROM silver.fact_telemetry
  {{b1}}
) TO 'gold_telemetry_opt.parquet'
  (FORMAT PARQUET, COMPRESSION {{b2}}, ROW_GROUP_SIZE 1000000);

-- Paso 2: Consulta con Projection Pushdown y Predicate Pushdown
SELECT
  country_code,
  COUNT(order_id) AS total_orders,
  SUM(revenue_usd) AS net_revenue_usd
FROM read_parquet('gold_telemetry_opt.parquet')
WHERE {{b3}} >= TIMESTAMP '2026-10-01 00:00:00'
GROUP BY country_code;`,
      blanks: [
        {
          id: 'b1',
          placeholder: 'Cláusula de ordenamiento físico',
          acceptedAnswers: [
            'ORDER BY event_ts, country_code',
            'ORDER BY event_ts',
            'ORDER BY 1, 2',
          ],
          hint: 'Ordena las filas por `event_ts, country_code` antes de escribir el Parquet para que cada Row Group tenga un rango min/max estrecho.',
        },
        {
          id: 'b2',
          placeholder: 'Algoritmo de compresión moderno',
          acceptedAnswers: ['ZSTD', "'ZSTD'"],
          hint: 'En 2026 el estándar recomendado por su ratio de compresión y velocidad de descompresión es `ZSTD` (Zstandard).',
        },
        {
          id: 'b3',
          placeholder: 'Columna temporal sin funciones envolventes',
          acceptedAnswers: ['event_ts'],
          hint: 'Compara directamente la columna `event_ts` sin aplicar funciones `CAST` o `STRFTIME` para que el motor evalúe los Zone Maps del Footer.',
        },
      ],
      expectedOutputTable: [
        {
          country_code: 'MX',
          total_orders: 142500,
          net_revenue_usd: '$4,987,500.00',
        },
        {
          country_code: 'CO',
          total_orders: 89400,
          net_revenue_usd: '$2,860,800.00',
        },
        {
          country_code: 'ES',
          total_orders: 118200,
          net_revenue_usd: '$5,319,000.00',
        },
      ],
      rubricCriteria: [
        'Aplica `ORDER BY event_ts, country_code` al escribir el archivo para maximizar la localidad de datos en los Zone Maps.',
        'Selecciona compresión `ZSTD` con un tamaño de Row Group equilibrado (~1 millón de filas).',
        'Usa un predicado SARGable directo sobre `event_ts` y proyecta únicamente las columnas requeridas por la agregación.',
      ],
    },
    pipelineChallenge: {
      title: 'Secuencia física de escaneo en Parquet',
      scenario:
        'Ordena los 4 pasos exactos que ocurren desde que Ingeniería de Datos escribe una tabla columnar en el Lakehouse hasta que un reporte de BI recibe el resultado saltando el 98% del disco.',
      steps: [
        {
          id: 'step-1',
          label: '1. Compactación y ordenamiento físico en escritura',
          role: 'DE',
          detail: 'Agrupar lotes pequeños en archivos de 256 MB, ordenar filas por `event_date, country_code` y generar estadísticas `min/max` y Bloom Filters en el Footer.',
        },
        {
          id: 'step-2',
          label: '2. Inspección del pie de archivo y podado de grupos de filas',
          role: 'DE',
          detail: 'El motor de consulta lee primero los últimos kilobytes del archivo Parquet (Footer) y descarta todos los Row Groups cuyo rango `min/max` o Bloom Filter no coincide con el `WHERE`.',
        },
        {
          id: 'step-3',
          label: '3. Lectura selectiva de bloques de columnas',
          role: 'DA',
          detail: 'Mediante peticiones HTTP Range Requests a S3/GCS, el motor descarga únicamente los bytes de las 2 columnas solicitadas en el `SELECT` dentro de los Row Groups sobrevivientes.',
        },
        {
          id: 'step-4',
          label: '4. Descompresión tardía y agregación para el tablero',
          role: 'BI',
          detail: 'El motor evalúa filtros sobre códigos de diccionario enteros y entrega la tabla agregada en milisegundos al panel ejecutivo de BI.',
        },
      ],
      explanation:
        'El rendimiento extremo de Parquet no es magia: requiere que DE ordene y compacte en la escritura (Paso 1) para que el motor pueda podar bloques leyendo solo el Footer (Paso 2), transferir solo los bytes de las columnas proyectadas por DA (Paso 3) y entregar agregaciones instantáneas a BI (Paso 4).',
    },
    checkpoint: {
      question:
        'Tienes 200 millones de pedidos guardados en archivos Parquet ordenados únicamente por `event_date`. Si un analista ejecuta frecuentemente `SELECT * FROM orders WHERE order_id = \'ORD-7729104\'` (un UUID aleatorio), ¿por qué los Zone Maps (`min/max`) de `order_id` no logran saltar ningún Row Group y qué debes activar?',
      options: [
        {
          id: 'a',
          text: 'Porque al ser `order_id` un identificador de alta cardinalidad distribuido uniformemente en todas las fechas, cada Row Group tiene un `min` cercano a `0000...` y un `max` cercano a `ffff...`; debes activar Split-Block Bloom Filters sobre `order_id` (y proyectar solo las columnas necesarias en lugar de `SELECT *`).',
          correct: true,
          feedback:
            'Exacto. Los Zone Maps (`min/max`) brillan en columnas ordenadas o correlacionadas con el orden físico, pero para búsquedas puntuales en columnas de alta cardinalidad no ordenadas los Bloom Filters son indispensables.',
        },
        {
          id: 'b',
          text: 'Porque Parquet no soporta cadenas de texto en la cláusula `WHERE`.',
          correct: false,
          feedback:
            'Parquet soporta perfectamente cadenas de texto (`BYTE_ARRAY` con UTF-8) y estadísticas sobre ellas; el problema es el traslape del rango `[min, max]` cuando los valores son aleatorios.',
        },
        {
          id: 'c',
          text: 'Debes dividir los 200 millones de filas en 200 millones de archivos Parquet de 1 fila cada uno.',
          correct: false,
          feedback:
            'Eso crearía el peor caso posible del "Small Files Problem", colapsando el almacenamiento de objetos por millones de llamadas de metadatos.',
        },
      ],
    },
  },
  {
    id: 'l8-arrow-lance-vortex',
    stageId: 'stage-3',
    order: 8,
    title: 'Memoria columnar con Apache Arrow y Lance',
    subtitle: 'Intercambio de datos sin serialización en RAM, vectorización SIMD y formatos con acceso aleatorio.',
    duration: '30 min',
    level: 'Intermedio',
    bloomLevel: 'analyze',
    coreFocus: ['DE', 'DA', 'BI'],
    goal: 'Analizar el layout de memoria columnar de Apache Arrow (Zero-Copy e IPC/Flight), comprender por qué la ejecución vectorizada SIMD multiplica por 20x el rendimiento en CPU, y evaluar cuándo usar Parquet v2 frente a Lance o Vortex.',
    visualType: 'arrow-zero-copy-sim',
    storyContext:
      'Caso real en QuantBio AI: Un pipeline lee 40 millones de transacciones en DuckDB, las pasa a Python (Polars) para ingeniería de variables, y luego alimenta un motor de inferencia y un servidor de visualización BI. En la arquitectura antigua basada en conectores JDBC/ODBC y `pandas.DataFrame`, el 78% del tiempo total de CPU y el 65% de la RAM se desperdiciaban serializando, copiando y convirtiendo bytes de un formato a otro. Al estandarizar sobre Apache Arrow Zero-Copy y almacenar vectores multimodales en formato Lance, el intercambio entre motores bajó a 0.2 milisegundos con 0 bytes copiados.',
    sections: [
      {
        heading: 'Costo de serialización y memoria compartida con Apache Arrow',
        body: 'Mientras que Parquet es el estándar para guardar datos comprimidos en **disco**, **Apache Arrow** es el estándar universal para representar tablas columnares en **memoria RAM**.\nAntes de Arrow, cada herramienta tenía un diseño de memoria incompatible: pasar datos de un motor SQL a Python, de ahí a R o a un motor de visualización obligaba a serializar y deserializar fila por fila, consumiendo hasta el 80% del tiempo de CPU.\nCon Apache Arrow, los datos se organizan en buffers contiguos estandarizados en RAM (un buffer de **Validity Bitmap** para nulos, un buffer de **Offsets** para longitudes variables y un buffer de **Values**). Gracias a la **Arrow C Data Interface** (en el mismo proceso) y a **Arrow Flight RPC / ADBC** (por red), DuckDB, Polars, PyArrow y DataFusion leen exactamente el mismo puntero de memoria RAM sin copiar un solo byte (**Zero-Copy**).',
      },
      {
        heading: 'Jerarquía de caché del procesador y ejecución vectorizada SIMD',
        body: '¿Por qué un bucle tradicional o una base orientada a filas desperdicia un procesador moderno? Porque al evaluar `price * (1 - discount)` fila por fila, el CPU salta entre direcciones de memoria dispersas (*pointer chasing*), provocando fallos constantes de caché (**Cache Misses**) y predicciones erróneas de salto (**Branch Mispredictions**).\nLos motores columnares modernos (DuckDB, Polars, Velox, DataFusion) procesan datos en **vectores columnares de 1,024 o 2,048 valores contiguos** que caben íntegros dentro de la caché ultrarrápida **L1/L2** del núcleo. Sobre esos buffers contiguos de Arrow, el compilador aplica instrucciones **SIMD (Single Instruction, Multiple Data)** como AVX-512 o ARM NEON: en un único ciclo de reloj, el procesador multiplica o filtra 8 o 16 números de 64 bits en paralelo.',
      },
      {
        heading: 'Limitaciones de Parquet en cargas multimodales y diseño de Lance y Vortex',
        body: 'Aunque Parquet v2 es imbatible para escaneos analíticos clásicos de tablas estructuradas, fue diseñado en 2013 y sufre en tres cargas de trabajo modernas de 2026:\n1) **Acceso aleatorio puntual (`Random Access O(1)`)**: Para leer la fila #482,910 en Parquet debes localizar y descomprimir una página entera de varios megabytes.\n2) **Columnas anchas y Embeddings IA**: Guardar vectores de 1,536 dimensiones (`float32`), imágenes o textos largos para entrenar LLMs hace que los Row Groups de Parquet se fragmenten y el Footer explote en tamaño.\nAquí entran dos formatos abiertos de nueva generación totalmente compatibles con Apache Arrow:\n- **Lance**: Formato columnar diseñado para IA multimodal, búsqueda vectorial (HNSW/DiskANN nativo) y acceso aleatorio en tiempo constante $O(1)$. Calcula los desplazamientos de byte exactos sin descomprimir bloques vecinos, siendo hasta 100x más rápido que Parquet al recuperar lotes aleatorios para entrenamiento o RAG.\n- **Vortex** (incubado en Linux Foundation): Formato columnar extensible con **compresión ligera en cascada** (*BtrBlocks / FastLanes*) que permite evaluar filtros directamente sobre los datos comprimidos en RAM y GPU sin pagar el costo de descompresión previa.',
      },
      {
        heading: 'Criterios de elección entre Parquet, Lance y Vortex',
        body: '- Usa **Apache Parquet v2 (sobre Iceberg v3)** para tu Lakehouse analítico central: tablas de hechos y dimensiones (Bronze/Silver/Gold), agregaciones SQL masivas y reportes de Business Intelligence.\n- Usa **Lance** cuando tu tabla combine columnas analíticas con **embeddings vectoriales**, documentos largos, audio/imagen para pipelines de IA/RAG o cuando necesites recuperar miles de filas específicas por índice en milisegundos.\n- Usa **Vortex** cuando tengas tablas con miles de columnas dispersas, esquemas altamente anidados o pipelines de alto rendimiento que transfieren datos comprimidos directamente a memoria Arrow o GPUs.',
      },
    ],
    triadPerspectives: {
      DE: {
        title: 'Qué diseña ingeniería de datos (DE)',
        points: [
          'Sustituye conectores legacy ODBC/JDBC (que serializan fila por fila) por **ADBC (Arrow Database Connectivity)** y **Arrow Flight SQL**, multiplicando por 10x-25x el ancho de banda entre motores.',
          'Almacena tablas de hechos financieras en Parquet v2 (Iceberg) y materializa índices vectoriales y corpus de documentos para agentes IA en tablas **Lance**.',
          'Monitorea que los tipos de datos se mantengan compatibles con buffers nativos de Arrow (`int64`, `float64`, `utf8_view`, `fixed_size_list`) evitando objetos Python (`dtype=object`).',
        ],
      },
      DA: {
        title: 'Qué aprovecha análisis de datos (DA)',
        points: [
          'Intercambia tablas de decenas de gigabytes entre DuckDB, Polars y PyArrow usando `.to_arrow()` o consultas directas sobre punteros de memoria sin sufrir errores de `Out Of Memory (OOM)`.',
          'Evita iterar con `for` o `.apply(lambda row: ...)` en Python (que rompe la vectorización SIMD y vuelve al intérprete lento byte a byte); utiliza siempre expresiones nativas columnares.',
          'Realiza muestreos aleatorios y búsquedas híbridas (filtros SQL + similitud coseno vectorial) en milisegundos sobre datasets Lance.',
        ],
      },
      BI: {
        title: 'Qué potencia business intelligence (BI)',
        points: [
          'Alimenta motores BI en el navegador y servidores de métricas mediante **Arrow IPC Streams**, eliminando el parseo lento de archivos JSON gigantes en los dashboards.',
          'Permite que tableros ejecutivos crucen métricas estructuradas de ventas con clasificaciones semánticas de tickets de soporte almacenadas en columnas vectoriales.',
          'Garantiza latencias sub-segundo en filtros interactivos gracias a que los motores en memoria operan directamente sobre vectores SIMD.',
        ],
      },
    },
    relatedLessons: [
      { id: 'l7-columnar-parquet', reason: 'Contrasta el almacenamiento comprimido en disco de Parquet con la representación en memoria RAM de Apache Arrow.' },
      { id: 'l9-duckdb-polars-marimo', reason: 'Aplica este intercambio Zero-Copy en la práctica uniendo DuckDB 1.x, Polars Lazy y cuadernos Marimo.' },
      { id: 'l18-mcp-semantic-ai-rag', reason: 'Verás cómo Lance y DuckDB impulsan el RAG Híbrido (BM25 + HNSW) para agentes de IA conectados por MCP.' },
    ],
    playground: {
      description: 'Compara el antipatrón de conversión por filas y funciones Python escalares frente al flujo Zero-Copy con Apache Arrow y ejecución vectorizada SIMD:',
      badQueryLabel: 'Antipatrón: conversión por filas y función escalar en Python',
      badQuery: `# MAL: 1) Convertir de SQL a lista de diccionarios/filas duplica la RAM y serializa cada valor.
# 2) Usar .apply(axis=1) ejecuta un bucle en el intérprete de Python fila por fila (sin SIMD).
import pandas as pd

rows = cursor.fetchall()  # Copia 1: tuplas Python en memoria
df = pd.DataFrame(rows, columns=["order_id", "amount_usd", "tax_rate"])  # Copia 2

# Rompe la caché L1/L2 del CPU e invoca una función Python 50 millones de veces:
df["net_usd"] = df.apply(lambda r: r["amount_usd"] * (1.0 - r["tax_rate"]), axis=1)`,
      badResult: [
        {
          copias_en_ram: '3 copias completas (+14.8 GB RAM)',
          uso_simd_cpu: '0% (Bucle interpretado fila a fila)',
          tiempo_50m_filas: '46.40 seg',
        },
      ],
      goodQueryLabel: 'Solución óptima: puntero Apache Arrow y vectorización SIMD',
      goodQuery: `# EXCELENTE: 1) Lectura como tabla Apache Arrow en memoria contigua (0 copias).
# 2) DuckDB y Polars comparten el mismo buffer de memoria vía Arrow C Data Interface.
import duckdb
import polars as pl

# DuckDB genera directamente un flujo Apache Arrow Zero-Copy
arrow_tbl = duckdb.sql("""
  SELECT order_id, amount_usd, tax_rate
  FROM read_parquet('s3://lakehouse/silver/orders_50m.parquet')
""").arrow()

# Polars envuelve el puntero Arrow en 0 ms (Zero-Copy) y ejecuta instrucciones SIMD AVX-512
df_pl = pl.from_arrow(arrow_tbl).with_columns(
  (pl.col("amount_usd") * (1.0 - pl.col("tax_rate"))).alias("net_usd")
)`,
      goodResult: [
        {
          copias_en_ram: '0 copias (Puntero Arrow compartido)',
          uso_simd_cpu: '100% (Vectores contiguos en caché L1/L2)',
          tiempo_50m_filas: '0.31 seg (150x más rápido)',
        },
      ],
    },
    codeChallenge: {
      title: 'Transferencia sin copias con Arrow y Polars',
      instruction:
        'Completa el código Python para: 1) Exportar el resultado de una consulta DuckDB como una tabla Apache Arrow en memoria sin serializar a filas, 2) Importarla en Polars con Zero-Copy, y 3) Calcular la columna `margin_usd` usando una expresión vectorizada SIMD.',
      templateCode: `import duckdb
import polars as pl

# 1. Ejecutar consulta en DuckDB y obtener puntero de memoria Apache Arrow
arrow_buffer = duckdb.sql("""
  SELECT product_id, revenue_usd, cost_usd
  FROM 'gold_sales_2026.parquet'
  WHERE quarter = '2026-Q4'
""").{{b1}}()

# 2. Construir el DataFrame de Polars apuntando al mismo buffer Arrow (Zero-Copy)
df = pl.{{b2}}(arrow_buffer)

# 3. Calcular el margen de forma vectorizada SIMD (sin bucles ni .apply)
resultado = df.with_columns(
  ({{b3}} - pl.col("cost_usd")).alias("margin_usd")
)`,
      blanks: [
        {
          id: 'b1',
          placeholder: 'Método DuckDB para exportar a Arrow',
          acceptedAnswers: ['arrow', 'fetch_arrow_table'],
          hint: 'En la API de DuckDB 1.x, el método `.arrow()` (o `.fetch_arrow_table()`) entrega el resultado directamente en formato Apache Arrow.',
        },
        {
          id: 'b2',
          placeholder: 'Constructor Zero-Copy de Polars',
          acceptedAnswers: ['from_arrow'],
          hint: 'Usa `pl.from_arrow(...)` para crear un DataFrame de Polars leyendo los buffers de memoria de Arrow sin clonar los bytes.',
        },
        {
          id: 'b3',
          placeholder: 'Expresión columnar de ingresos',
          acceptedAnswers: ['pl.col("revenue_usd")', "pl.col('revenue_usd')"],
          hint: 'Referencia la columna de ingresos con `pl.col("revenue_usd")` para que Polars ejecute la resta sobre el vector contiguo con instrucciones SIMD.',
        },
      ],
      expectedOutputTable: [
        {
          product_id: 'SKU-901',
          revenue_usd: '$125,000.00',
          cost_usd: '$75,000.00',
          margin_usd: '$50,000.00',
        },
        {
          product_id: 'SKU-902',
          revenue_usd: '$84,200.00',
          cost_usd: '$50,520.00',
          margin_usd: '$33,680.00',
        },
      ],
      rubricCriteria: [
        'Extrae los resultados desde DuckDB directamente en buffers columnares Apache Arrow (`.arrow()`).',
        'Usa `pl.from_arrow()` para lograr transferencia Zero-Copy en memoria RAM.',
        'Reemplaza funciones escalares lentas por expresiones vectorizadas `pl.col()` compatibles con SIMD.',
      ],
    },
    pipelineChallenge: {
      title: 'Flujo en memoria con Arrow y SIMD',
      scenario:
        'Ordena el flujo de datos de una plataforma moderna que combina tablas transaccionales y embeddings de IA sin pagar impuestos de serialización entre procesos.',
      steps: [
        {
          id: 'step-1',
          label: '1. Almacenamiento físico especializado por carga en Parquet y Lance',
          role: 'DE',
          detail: 'Persistir hechos tabulares masivos en Parquet v2 (optimizado para escaneos por rango) y embeddings/documentos multimodales en formato Lance (optimizado para acceso aleatorio O(1)).',
        },
        {
          id: 'step-2',
          label: '2. Proyección a bloques contiguos de Apache Arrow en RAM',
          role: 'DE',
          detail: 'Cargar únicamente las columnas solicitadas en buffers estandarizados de Arrow (Validity Bitmap + Offsets + Values) alineados a 64 bytes.',
        },
        {
          id: 'step-3',
          label: '3. Procesamiento vectorizado SIMD e intercambio de punteros',
          role: 'DA',
          detail: 'Ejecutar joins y transformaciones por lotes de 2,048 valores en la caché L1/L2 del CPU compartiendo el puntero de memoria entre DuckDB y Polars en 0 copias.',
        },
        {
          id: 'step-4',
          label: '4. Transporte de baja latencia mediante Arrow Flight hacia BI',
          role: 'BI',
          detail: 'Entregar los lotes columnares directamente al cliente visual o servicio de métricas sin serializar ni parsear cadenas JSON intermedias.',
        },
      ],
      explanation:
        'Esta arquitectura elimina los cuellos de botella históricos: cada formato en disco (Parquet/Lance) cumple su propósito físico, Apache Arrow unifica la memoria RAM sin copias y las instrucciones SIMD procesan los vectores a la velocidad máxima del silicio.',
    },
    checkpoint: {
      question:
        'Tu equipo está construyendo un sistema que almacena 50 millones de reseñas de clientes junto con sus vectores de embeddings (`float32[1536]`) y necesita recuperar en menos de 10 ms las 20 filas exactas más similares a una consulta (acceso aleatorio por índice de fila). ¿Por qué el formato **Lance** supera a **Apache Parquet** en este caso específico?',
      options: [
        {
          id: 'a',
          text: 'Porque Parquet fue diseñado para escaneos secuenciales por lotes y obliga a descomprimir páginas enteras para llegar a una fila individual, mientras que Lance garantiza acceso aleatorio puntual en tiempo O(1) e integra índices vectoriales nativos sobre Apache Arrow.',
          correct: true,
          feedback:
            'Exacto. Parquet es extraordinario para agregaciones OLAP secuenciales, pero Lance está diseñado físicamente para acceso aleatorio ultrarrápido y columnas vectoriales/multimodales sin el overhead de descomprimir Row Groups enteros.',
        },
        {
          id: 'b',
          text: 'Porque Parquet solo permite guardar un máximo de 3 columnas por tabla.',
          correct: false,
          feedback:
            'Parquet soporta miles de columnas; su limitación ante vectores y búsquedas puntuales radica en el costo de lectura aleatoria de páginas y el tamaño de metadatos.',
        },
        {
          id: 'c',
          text: 'Porque Lance guarda todos los datos como texto plano CSV sin tipos.',
          correct: false,
          feedback:
            'Al contrario: Lance es un formato binario columnar fuertemente tipado y 100% compatible con Apache Arrow.',
        },
      ],
    },
  },
  {
    id: 'l9-duckdb-polars-marimo',
    stageId: 'stage-3',
    order: 9,
    title: 'Ejecución local con DuckDB, Polars y Marimo',
    subtitle: 'Procesamiento analítico en un solo nodo, evaluación perezosa y cuadernos reactivos reproducibles en Git.',
    duration: '30 min',
    level: 'Intermedio',
    bloomLevel: 'apply',
    coreFocus: ['DA', 'DE', 'BI'],
    goal: 'Aplicar la API Lazy de Polars (`scan_parquet`) junto con el motor SQL paralelizado de DuckDB 1.x para procesar datasets mayores que la RAM, y estructurar análisis reproducibles en cuadernos reactivos con Marimo.',
    visualType: 'row-vs-columnar-storage',
    storyContext:
      'Caso real en Finanzas de AndesTech: Un job diario que procesaba 45 GB de transacciones corría en un clúster distribuido de 8 nodos porque el script original en `pandas` moría con `MemoryError` en un servidor individual. Además, el análisis exploratorio del equipo vivía en un archivo `.ipynb` donde las celdas se habían ejecutado en orden `1 → 5 → 2 → 4`, produciendo un reporte imposible de reproducir. Al migrar el pipeline a Polars Lazy + DuckDB 1.x en un solo contenedor de 16 GB de RAM y los análisis a cuadernos reactivos **Marimo**, la factura cloud cayó un 82% y el job pasó de 18 minutos a 24 segundos.',
    sections: [
      {
        heading: 'Escalamiento vertical en un nodo: cuándo no hace falta un clúster distribuido',
        body: 'Durante una década se asumió que cualquier dataset de más de 5 GB requería un clúster distribuido (Spark, Presto) con toda su complejidad de red, serialización JVM y tiempos de arranque. Pero el hardware cambió: hoy una sola instancia en la nube o estación de trabajo lee discos NVMe a **7 GB/s** y cuenta con entre 16 y 64 núcleos con instrucciones SIMD.\nPara el **90% de las cargas analíticas corporativas** (datasets activos de hasta 100 GB – 500 GB por ejecución), un motor columnar in-process escrito en C++ o Rust (**DuckDB 1.x** o **Polars**) corriendo en un solo nodo es más rápido, más simple de depurar y hasta un 85% más barato porque elimina el *Network Shuffle* entre servidores.',
      },
      {
        heading: 'Paralelismo guiado por fragmentos (morsel-driven) y volcado a disco en DuckDB',
        body: '**DuckDB** es un motor SQL OLAP embebido (corre dentro de tu proceso Python, Node, R o directamente en el navegador vía **DuckDB-Wasm** sin instalar servidores). Su arquitectura se basa en **Morsel-Driven Parallelism**: divide el trabajo en fragmentos de ~100,000 filas (*morsels*) que reparte dinámicamente entre todos los hilos del CPU evitando bloqueos.\nSi una consulta (un `GROUP BY` o `JOIN` masivo) supera la memoria RAM disponible, el gestor de buffers de DuckDB 1.x vuelca automáticamente las particiones intermedias a disco (**Out-of-Core Spilling**) y las procesa en streaming, permitiéndote agregar un archivo Parquet de 120 GB en una portátil con solo 16 GB de RAM.',
      },
      {
        heading: 'Evaluación inmediata frente a evaluación perezosa en Polars',
        body: 'En `pandas` (o en Polars modo Eager `pl.read_parquet()`), cada línea de código se ejecuta de inmediato a ciegas: primero carga toda la tabla en RAM, luego filtra, luego borra columnas, creando múltiples copias pesadas en el camino.\nEn **Polars Lazy API (`pl.scan_parquet()`)**, escribir `.filter(...)`, `.with_columns(...)` y `.select(...)` no toca ni un byte del disco: construye un **Grafo Lógico de Consulta**. Cuando finalmente llamas a `.collect(engine="streaming")`, el optimizador de consultas de Polars:\n1) Empuja los filtros `WHERE` hasta el lector Parquet (**Predicate Pushdown**).\n2) Descarta todas las columnas que no se usan al final (**Projection Pushdown**).\n3) Fusiona expresiones en una sola pasada por lotes en streaming.',
      },
      {
        heading: 'Cuadernos reactivos como grafos acíclicos en Marimo',
        body: 'El talón de Aquiles de los notebooks tradicionales (`.ipynb`) en Análisis de Datos y BI es el **estado oculto**: si defines `umbral = 100` en la Celda 1, calculas `clientes_vip` en la Celda 2, y luego cambias `umbral = 500` en la Celda 1 sin volver a ejecutar la Celda 2, la pantalla muestra números contradictorios. Además, los archivos `.ipynb` son bloques JSON gigantes con imágenes incrustadas que producen conflictos imposibles de revisar en `git diff`.\n**Marimo** resuelve ambos problemas de raíz:\n- **Reactividad determinista (DAG de celdas)**: Marimo analiza qué variables define y consume cada celda. Cuando cambias un parámetro o un slider interactivo en una celda, Marimo **re-ejecuta automáticamente en orden topológico todas las celdas dependientes** (igual que una hoja de cálculo reactiva o un DAG de dbt).\n- **Archivos `.py` puros versionables en Git**: Un notebook Marimo se guarda como un script Python limpio (`.py`), ejecutable como pipeline desde la terminal (`python analisis.py`), como app interactiva (`marimo run analisis.py`) y 100% auditable en Pull Requests.',
      },
    ],
    triadPerspectives: {
      DE: {
        title: 'Qué construye ingeniería de datos (DE)',
        points: [
          'Ejecuta transformaciones Silver/Gold ligeras y medianas (<500 GB) en contenedores serverless usando DuckDB o Polars Lazy, eliminando costos ociosos de clústeres JVM.',
          'Integra scripts de Marimo (`.py`) directamente en el CI/CD y en el orquestador (Dagster / Airflow) sin tener que reescribir el código de los analistas.',
          'Configura límites explícitos de memoria y directorio temporal (`SET memory_limit = \'12GB\'`, `SET temp_directory = \'/nvme/tmp\'`) para garantizar ejecuciones Out-of-Core seguras.',
        ],
      },
      DA: {
        title: 'Qué aplica análisis de datos (DA)',
        points: [
          'Inicia siempre sus pipelines con `pl.scan_parquet()` en lugar de `read_parquet()`, encadenando filtros y transformaciones antes de materializar con `.collect(engine="streaming")`.',
          'Combina en un mismo cuaderno **Marimo** expresiones programáticas de Polars con bloques SQL nativos de DuckDB sobre el mismo LazyFrame sin duplicar memoria.',
          'Garantiza reproducibilidad científica total: ningún análisis entregado a negocio depende del orden manual en que se presionó `Shift+Enter`.',
        ],
      },
      BI: {
        title: 'Qué despliega business intelligence (BI)',
        points: [
          'Publica cuadernos Marimo en modo aplicación (`marimo run --headless`) o compila tableros con **DuckDB-Wasm** para ofrecer simuladores de escenarios de negocio en vivo.',
          'Audita en Pull Requests de Git la lógica exacta de las consultas que alimentan los reportes ejecutivos gracias a que viven en archivos `.py` y `.sql` limpios.',
          'Pre-calcula cubos Parquet compactos con DuckDB para que los dashboards carguen en menos de 100 milisegundos.',
        ],
      },
    },
    relatedLessons: [
      { id: 'l7-columnar-parquet', reason: 'El optimizador Lazy de Polars y DuckDB empuja tus filtros directamente a los Zone Maps de Parquet.' },
      { id: 'l8-arrow-lance-vortex', reason: 'Apache Arrow es el puente Zero-Copy que permite a DuckDB consultar un LazyFrame de Polars sin copiar RAM.' },
      { id: 'l15-bi-tufte-code', reason: 'Conecta el flujo reproducible de DuckDB y Marimo con las herramientas declarativas de BI-as-Code.' },
    ],
    playground: {
      description: 'Compara el enfoque tradicional Eager en Pandas (que agota la RAM cargando todo el archivo) frente al pipeline híbrido Polars Lazy + DuckDB 1.x en streaming:',
      badQueryLabel: 'Antipatrón: lectura inmediata completa en memoria RAM',
      badQuery: `# MAL: 1) pd.read_parquet() intenta descomprimir las 50 columnas completas en RAM de golpe.
# 2) Crea copias intermedias del DataFrame en cada paso antes de agrupar.
import pandas as pd

df_all = pd.read_parquet("s3://lakehouse/silver/eventos_80gb.parquet")
df_filtered = df_all[df_all["event_year"] == 2026]
df_clean = df_filtered[["region", "channel", "net_revenue_usd"]]
res = df_clean.groupby(["region", "channel"])["net_revenue_usd"].sum()`,
      badResult: [
        {
          consumo_pico_ram: '92.0 GB (Crash por OOM en nodo de 16 GB)',
          optimizacion_previa: 'Ninguna (Lee 50 columnas antes de filtrar)',
          estado_ejecucion: 'MemoryError',
        },
      ],
      goodQueryLabel: 'Solución óptima: escaneo perezoso en Polars y flujo en DuckDB',
      goodQuery: `# EXCELENTE: 1) pl.scan_parquet() solo registra el plan lógico (0 MB leídos aún).
# 2) El optimizador empuja el filtro y las 3 columnas hasta el archivo Parquet.
# 3) DuckDB o Polars ejecutan en streaming respetando el límite de RAM.
import polars as pl
import duckdb

lf_eventos = (
    pl.scan_parquet("s3://lakehouse/silver/eventos_80gb.parquet")
    .filter(pl.col("event_year") == 2026)
    .select(["region", "channel", "net_revenue_usd"])
)

# Consulta SQL en DuckDB directamente sobre el LazyFrame de Polars (Zero-Copy):
res_pl = duckdb.sql("""
    SELECT
      region,
      channel,
      SUM(net_revenue_usd) AS revenue_total_usd,
      APPROX_QUANTILE(net_revenue_usd, 0.95) AS p95_ticket_usd
    FROM lf_eventos
    GROUP BY ALL
    ORDER BY revenue_total_usd DESC
""").pl()`,
      goodResult: [
        {
          consumo_pico_ram: '680 MB (Ejecución por lotes en streaming)',
          optimizacion_previa: 'Predicate + Projection Pushdown activos',
          estado_ejecucion: 'Completado en 1.85 seg',
        },
      ],
    },
    codeChallenge: {
      title: 'Evaluación perezosa en Polars sin agotar RAM',
      instruction:
        'Completa el código para construir un plan perezoso (`LazyFrame`) sobre un dataset masivo en Parquet, aplicar el filtro de estado activo y materializar el resumen en modo `streaming` para que pueda ejecutarse en un contenedor ligero.',
      templateCode: `import polars as pl

# 1. Iniciar escaneo perezoso (Lazy) sin cargar el archivo completo en RAM
plan_optimo = (
    pl.{{b1}}("s3://lakehouse/silver/subscriptions_2026.parquet")
    .filter(pl.col("status") == "ACTIVE")
    .group_by("plan_tier")
    .agg([
        pl.len().alias("active_subs"),
        pl.col("mrr_usd").{{b2}}().alias("total_mrr_usd")
    ])
)

# 2. Ejecutar el plan optimizado en modo streaming (Out-of-Core)
df_resultado = plan_optimo.{{b3}}(engine="streaming")`,
      blanks: [
        {
          id: 'b1',
          placeholder: 'Función de lectura perezosa en Polars',
          acceptedAnswers: ['scan_parquet'],
          hint: 'A diferencia de `read_parquet` (Eager), `scan_parquet` crea un `LazyFrame` que optimiza toda la consulta antes de tocar el disco.',
        },
        {
          id: 'b2',
          placeholder: 'Agregación de suma en Polars',
          acceptedAnswers: ['sum'],
          hint: 'Usa el método `.sum()` sobre la expresión `pl.col("mrr_usd")` para sumar el ingreso recurrente mensual.',
        },
        {
          id: 'b3',
          placeholder: 'Método para materializar el LazyFrame',
          acceptedAnswers: ['collect'],
          hint: 'En Polars Lazy, el grafo de consulta se compila y ejecuta al invocar `.collect(engine="streaming")`.',
        },
      ],
      expectedOutputTable: [
        {
          plan_tier: 'Enterprise',
          active_subs: 1420,
          total_mrr_usd: '$708,580.00',
        },
        {
          plan_tier: 'Growth',
          active_subs: 8650,
          total_mrr_usd: '$856,350.00',
        },
        {
          plan_tier: 'Starter',
          active_subs: 24100,
          total_mrr_usd: '$698,900.00',
        },
      ],
      rubricCriteria: [
        'Inicia el pipeline con `pl.scan_parquet()` para habilitar el optimizador de consultas (Predicate y Projection Pushdown).',
        'Expresa las agregaciones con métodos nativos vectorizados de Polars (`.sum()`, `pl.len()`).',
        'Materializa el `LazyFrame` con `.collect(engine="streaming")` para acotar el uso de memoria RAM.',
      ],
    },
    pipelineChallenge: {
      title: 'Consulta perezosa reactiva en Marimo y DuckDB',
      scenario:
        'Ordena los 4 pasos que ocurren cuando un analista modifica un filtro en un cuaderno reactivo Marimo conectado a Polars Lazy y DuckDB sobre un archivo Parquet de 80 GB.',
      steps: [
        {
          id: 'step-1',
          label: '1. Actualización reactiva del grafo de celdas en Marimo',
          role: 'DA',
          detail: 'Al cambiar el selector de fecha o región, Marimo identifica mediante su grafo estático qué celdas dependen del parámetro y las marca para re-ejecución determinista.',
        },
        {
          id: 'step-2',
          label: '2. Construcción y optimización del plan lógico de consulta',
          role: 'DA',
          detail: 'Polars y DuckDB combinan los filtros y selecciones en un árbol lógico, eliminando columnas no referenciadas y empujando predicados hacia la fuente.',
        },
        {
          id: 'step-3',
          label: '3. Ejecución paralela por fragmentos y volcado a disco',
          role: 'DE',
          detail: 'El motor lee únicamente los Row Groups válidos en lotes pequeños que caben en RAM, usando todos los núcleos del CPU y volcando a disco NVMe si una agregación excede el límite.',
        },
        {
          id: 'step-4',
          label: '4. Renderizado inmediato de la tabla y métricas certificadas',
          role: 'BI',
          detail: 'El resultado agregado final (pocas filas) actualiza automáticamente los gráficos y tablas del cuaderno o app sin discrepancias de estado oculto.',
        },
      ],
      explanation:
        'La combinación de reactividad determinista (Marimo), optimización perezosa de consultas (Polars Lazy) y ejecución paralelizada Out-of-Core (DuckDB 1.x) permite que un solo nodo ofrezca rendimiento de supercomputadora con reproducibilidad garantizada.',
    },
    checkpoint: {
      question:
        '¿Qué problema crítico resuelve un cuaderno reactivo basado en un grafo acíclico dirigido (como **Marimo**) frente a un notebook tradicional `.ipynb` cuando un equipo de Datos y BI colabora en un análisis financiero?',
      options: [
        {
          id: 'a',
          text: 'Elimina el estado oculto re-ejecutando automáticamente en orden topológico todas las celdas dependientes cuando cambia una variable, y guarda el código como un archivo `.py` puro limpio para control de versiones en Git y ejecución en producción.',
          correct: true,
          feedback:
            'Exacto. En un `.ipynb` tradicional, ejecutar celdas desordenadas deja variables en memoria que ya no corresponden al código visible. En Marimo el estado en memoria siempre es una función pura y determinista del código visible.',
        },
        {
          id: 'b',
          text: 'Impide usar SQL o gráficos dentro del cuaderno.',
          correct: false,
          feedback:
            'Al contrario: Marimo integra celdas SQL nativas (con DuckDB) y componentes visuales interactivos que actualizan variables de Python automáticamente.',
        },
        {
          id: 'c',
          text: 'Obliga a subir todos los datos privados de la empresa a un servidor público.',
          correct: false,
          feedback:
            'Marimo se ejecuta 100% localmente en tu entorno Python o contenedor privado sobre tus propios archivos `.py`.',
        },
      ],
    },
  },
];

export default STAGE_3_LESSONS;
