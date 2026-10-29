# Investigación curricular y mapa de conceptos · `de2-formatos` (Formas físicas y motores locales)

- **Módulo:** `de2-formatos` — *Formas físicas y motores locales*
- **Área y nivel:** `de` (Ingeniería de datos) · Nivel 2 (*Intermedio*)
- **Prerrequisitos de módulo:** `c2-sql-analitico`
- **Duración total:** 140 minutos (5 lecciones: 30 + 30 + 30 + 25 + 25 min)
- **Fecha de consulta y verificación:** `2026-10-29`

---

## 1. Investigación de fuentes por lección (Paso 1)

Cada una de las cinco lecciones cuenta con al menos tres fuentes verificadas (`https://...` con respuesta `HTTP 200`), de las cuales como mínimo dos son fuentes primarias oficiales (especificaciones de Apache Parquet, Apache Arrow, DuckDB, Polars, Vortex, Lance, Marimo e IETF RFC 8878).

### Lección 1 · `de2-formatos-01-columnar-parquet` (heredada `l7-columnar-parquet`, orden legado 7)
**Título:** *Formato físico Parquet v2, zone maps y filtros de Bloom* (`30 min`)

| # | Tipo | Fuente y título | Editorial / Autor | URL | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|---|
| 1 | Primaria | Apache Parquet — File Format Specification | Apache Software Foundation | https://parquet.apache.org/docs/file-format/ | `2026-10-29` | Disposición física híbrida de Parquet: partición horizontal en *Row Groups*, partición vertical en *Column Chunks* y *Data Pages*, y almacenamiento de `FileMetaData` en el pie del archivo (*Footer*). |
| 2 | Primaria | Apache Parquet — Page Index (`ColumnIndex` & `OffsetIndex`) | Apache Software Foundation | https://parquet.apache.org/docs/file-format/pageindex/ | `2026-10-29` | Estadísticas `min`, `max` y `null_count` por página en `ColumnIndex` y desplazamientos de bytes en `OffsetIndex` para saltar páginas sin descomprimir todo el *Row Group*. |
| 3 | Primaria | Apache Parquet — Split Block Bloom Filter Specification | Apache Software Foundation | https://parquet.apache.org/docs/file-format/bloomfilter/ | `2026-10-29` | Estructura de filtros de Bloom por bloques divididos (*Split Block Bloom Filters*, 256 bits por bloque alineado a línea de caché SIMD) con hash `xxHash64` para descartar valores puntuales de alta cardinalidad con cero falsos negativos. |
| 4 | Primaria | DuckDB Documentation — Reading and Writing Parquet Metadata | DuckDB Foundation | https://duckdb.org/docs/stable/data/parquet/metadata.html | `2026-10-29` | Inspección de metadatos físicos de archivos Parquet mediante `parquet_metadata()`, `parquet_schema()`, `parquet_file_metadata()` y `parquet_bloom_probe()`. |

### Lección 2 · `de2-formatos-02-arrow-lance-vortex` (heredada `l8-arrow-lance-vortex`, orden legado 8)
**Título:** *Memoria columnar con Apache Arrow, Lance y Vortex* (`30 min`)

| # | Tipo | Fuente y título | Editorial / Autor | URL | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|---|
| 1 | Primaria | Apache Arrow — Columnar Format and Memory Layout | Apache Software Foundation | https://arrow.apache.org/docs/format/Columnar.html | `2026-10-29` | Disposición en memoria RAM alineada a 64 bytes con tres búferes por vector de longitud variable: mapa de bits de validez (*validity bitmap*), búfer de desplazamientos (*offsets*) y búfer contiguo de bytes (*values*). |
| 2 | Primaria | Apache Arrow — C Data Interface Specification | Apache Software Foundation | https://arrow.apache.org/docs/format/CDataInterface.html | `2026-10-29` | Intercambio de lotes columnares (`RecordBatch`) en memoria con costo cero de copia (*zero-copy*) entre motores heterogéneos mediante las estructuras C `ArrowSchema` y `ArrowArray`. |
| 3 | Primaria | Vortex Documentation — Extensible Columnar File & In-Memory Format | Linux Foundation / SpiralDB | https://docs.vortex.dev/ | `2026-10-29` | Arquitectura de codificaciones en cascada (*cascading encodings*: FastLanes, ALP, FSST) que permite filtrar y tomar muestras sobre vectores aún comprimidos sin materializar páginas completas. |
| 4 | Primaria | Lance Columnar Format — Specification and Repository | LanceDB | https://github.com/lancedb/lance | `2026-10-29` | Diseño sin grupos de filas rígidos con tablas de desplazamiento para acceso aleatorio $O(1)$ en microsegundos y materialización tardía de columnas pesadas. |

### Lección 3 · `de2-formatos-03-duckdb-polars-marimo` (heredada `l9-duckdb-polars-marimo`, orden legado 9)
**Título:** *Ejecución local con DuckDB, Polars perezoso y Marimo* (`30 min`)

| # | Tipo | Fuente y título | Editorial / Autor | URL | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|---|
| 1 | Primaria | DuckDB Documentation — SQL on Apache Arrow | DuckDB Foundation | https://duckdb.org/docs/stable/guides/python/sql_on_arrow.html | `2026-10-29` | Consulta directa de tablas Arrow y DataFrames de Polars desde DuckDB mediante transferencia *zero-copy* y empuje de filtros y proyecciones hacia el lector Arrow. |
| 2 | Primaria | Polars User Guide — Lazy API and Query Optimization | Polars Project | https://docs.pola.rs/user-guide/lazy/ | `2026-10-29` | Construcción de planes lógicos con `pl.scan_parquet()`, optimización automática (*predicate pushdown*, *projection pushdown*, *common subplan elimination*) y ejecución en streaming fuera de memoria (`engine="streaming"`). |
| 3 | Primaria | Marimo Documentation — Reactivity and DAG Execution | Marimo Team | https://docs.marimo.io/guides/reactivity/ | `2026-10-29` | Ejecución determinista basada en un grafo acíclico dirigido (DAG) estático de variables entre celdas almacenadas como código Python puro versionable en Git. |
| 4 | Primaria | DuckDB — Why DuckDB: Vectorized Push-Based Execution | DuckDB Foundation | https://duckdb.org/why_duckdb.html | `2026-10-29` | Procesamiento por lotes vectorizados (*DataChunks* de 2 048 tuplas), paralelismo *morsel-driven* y gestión automática de derrame a disco (*out-of-core spilling*). |

### Lección 4 · `de2-formatos-04-codificacion-compresion-zstd` (nueva, orden 4)
**Título:** *Codificación diccionario, RLE, delta y compresión Zstandard* (`25 min`)

| # | Tipo | Fuente y título | Editorial / Autor | URL | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|---|
| 1 | Primaria | Apache Parquet — Encodings Specification (`RLE_DICTIONARY`, `DELTA_BINARY_PACKED`, `BYTE_STREAM_SPLIT`) | Apache Software Foundation | https://parquet.apache.org/docs/file-format/data-pages/encodings/ | `2026-10-29` | Separación entre codificación lógica de página (diccionario + RLE/Bit-Packing híbrido, empaquetado binario de deltas para enteros y timestamps, y división de flujos de bytes para coma flotante) y compresión de bloque posterior. |
| 2 | Primaria | IETF RFC 8878 — Zstandard Compression and the `application/zstd` Media Type | IETF (Y. Collet & M. Kucherawy) | https://datatracker.ietf.org/doc/html/rfc8878 | `2026-10-29` | Especificación del algoritmo Zstandard (`ZSTD`) que combina coincidencia de ventanas LZ77 con codificación de entropía ANS (*Asymmetric Numeral Systems* / FSE) y Huffman, alcanzando velocidad de descompresión superior a GZIP con mejor razón de compresión que Snappy. |
| 3 | Primaria | DuckDB Documentation — Parquet Tips & Compression Options | DuckDB Foundation | https://duckdb.org/docs/stable/data/parquet/tips.html | `2026-10-29` | Parámetros de escritura en `COPY ... TO ... (FORMAT PARQUET, COMPRESSION ZSTD, COMPRESSION_LEVEL, DICTIONARY_SIZE_LIMIT)` y caída automática a `PLAIN` cuando el diccionario supera el límite de cardinalidad. |

### Lección 5 · `de2-formatos-05-particionado-archivos-pequenos` (nueva, orden 5)
**Título:** *Particionado Hive, archivos pequeños y ordenamiento físico* (`25 min`)

| # | Tipo | Fuente y título | Editorial / Autor | URL | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|---|
| 1 | Primaria | DuckDB Documentation — Hive Partitioning and Partitioned Writes | DuckDB Foundation | https://duckdb.org/docs/stable/data/partitioning/hive_partitioning.html | `2026-10-29` | Estructura de directorios `clave=valor/`, poda de particiones antes de abrir archivos con `hive_partitioning = true` y escritura particionada con `COPY ... TO ... (FORMAT PARQUET, PARTITION_BY (...))`. |
| 2 | Primaria | DuckDB Documentation — Parquet Tips & Row Group Sizing | DuckDB Foundation | https://duckdb.org/docs/stable/data/parquet/tips.html | `2026-10-29` | Control del tamaño de grupo de filas (`ROW_GROUP_SIZE`), paralelización por grupo de filas e impacto de ordenar la tabla (`ORDER BY`) antes de exportar para concentrar los rangos `min`/`max` y elevar la compresión RLE. |
| 3 | Primaria | Apache Parquet — File Format and Page Index Configuration | Apache Software Foundation | https://parquet.apache.org/docs/file-format/configurations/ | `2026-10-29` | Recomendaciones de tamaño de bloque y página para amortizar metadatos y optimizar lecturas en almacenamiento distribuido. |

---

## 2. Mapa de conceptos y progresión del módulo (Paso 2)

El módulo `de2-formatos` parte del prerrequisito `c2-sql-analitico` (funciones de ventana, `QUALIFY`, `GROUPING SETS`, `ASOF JOIN` y lectura de planes `EXPLAIN` / `EXPLAIN ANALYZE` en DuckDB) y lleva a la persona del diseño lógico de consultas al diseño físico de almacenamiento en disco y memoria.

### Progresión secuencial de las 5 lecciones

| Orden | ID de lección | Conceptos nuevos que introduce | Conceptos previos que reutiliza | Tablas y cifras reales de Mercado Brisa |
|---|---|---|---|---|
| 1 | `de2-formatos-01-columnar-parquet` | Anatomía física de Parquet (*Row Groups*, *Column Chunks*, *Data Pages* y *Footer*), poda de columnas (*projection pushdown*), *zone maps* (`min`/`max` por bloque y página) y filtros de Bloom por bloques divididos (`xxHash64`, 256 bits) para atributos de alta cardinalidad. | Tipos de datos y formatos (`c0-datos-03`), lectura de planes de ejecución (`c2-sql-analitico-04`). | `events.parquet` (`65 000` filas, `1 099 791 bytes` en disco, 12 columnas) y `orders.parquet` (`18 000` filas, `393 310 bytes` en disco, 14 columnas): proyección de 3 columnas (`event_type`, `device_type`, `campaign_id`) que reduce la lectura de `1 089 111 bytes` comprimidos a solo `7 478 bytes` (**ahorro del 99.31 %**), y comparación de 7 *Row Groups* donde ordenar por `event_ts` salta 6 de los 7 bloques al filtrar octubre de 2025. |
| 2 | `de2-formatos-02-arrow-lance-vortex` | Disposición en memoria de Apache Arrow (mapa de validez, desplazamientos y valores alineados a 64 bytes), `Arrow C Data Interface` (*zero-copy* entre procesos/motores), penalización de acceso aleatorio por fila en Parquet, y formatos de nueva generación (Lance con índice de desplazamientos $O(1)$ y materialización tardía; Vortex con ejecución sobre vectores comprimidos). | Memoria columnar y PyArrow (`c1-python-01`), *Row Groups* y *Data Pages* en Parquet (`de2-formatos-01`). | `events.parquet` (`65 000` filas, con `6 715` nulos en `customer_id` y `17 750` nulos en `campaign_id` representados en mapas de bits de `8 125 bytes`), y cruce vectorizado en `order_items`, `orders` y `products` en las 5 categorías (`Molinos`, `Cafeteras`, `Accesorios`, `Suscripciones`, `Café en grano`). |
| 3 | `de2-formatos-03-duckdb-polars-marimo` | Ejecución vectorizada por lotes en DuckDB (*DataChunks* de 2 048 filas), optimizador de `LazyFrame` en Polars (`scan_parquet` → `.explain()` → `.collect(engine="streaming")`), puente *zero-copy* bidireccional DuckDB ↔ Polars vía Arrow, y cuadernos reactivos deterministas en Marimo (DAG estático sin estado oculto). | Cuadernos Jupyter/Marimo (`c0-herramientas-04`), expresiones en Polars (`c1-python-03`), `EXPLAIN` en DuckDB (`c2-sql-analitico-04`), Arrow C Data Interface (`de2-formatos-02`). | Cruce local entre `orders.parquet` (`18 000` filas), `customers.parquet` (`2 400` filas) y `stores.parquet` (`14` tiendas): agregación con `MEDIAN`, `FILTER` y `GROUP BY ALL` sobre los 3 segmentos (`pro_barista`, `retail`, `cafeteria_b2b`) y las 4 regiones (`Iberia`, `Andina`, `Cono Sur`, `Norteamérica`). |
| 4 | `de2-formatos-04-codificacion-compresion-zstd` | Diferencia entre codificación lógica de datos (*encoding*) y compresión de bloques de bytes (*codec*), diccionario + RLE híbrido (`PLAIN_DICTIONARY` / `RLE_DICTIONARY`) y límite de cardinalidad (caída a `PLAIN`), empaquetado binario de diferencias (`DELTA_BINARY_PACKED`) y equilibrio entre Snappy, GZIP y Zstandard (`ZSTD`, RFC 8878). | Estructura de páginas de Parquet (`de2-formatos-01`), memoria Arrow (`de2-formatos-02`). | Auditoría real de `orders.parquet` y `events.parquet`: en `orders.parquet`, `campaign_id` alcanza razón **38.96x** (`5 533` → `142 bytes`), `store_id` **34.52x** (`9 252` → `268 bytes`), `status` **32.48x** (`4 223` → `130 bytes`) y `device_type` **21.33x** (`4 693` → `220 bytes`), frente a columnas `PLAIN` como `total_usd` (**2.45x**) u `order_ts` (**1.32x**). |
| 5 | `de2-formatos-05-particionado-archivos-pequenos` | Particionado físico de directorios estilo Hive (`clave=valor/`), explosión combinatoria de cardinalidad y el **problema de los archivos pequeños** (*Small Files Problem*), tamaño óptimo de *Row Group* y archivo, e impacto de ordenar las filas (`ORDER BY`) antes de escribir Parquet sobre la selectividad de *zone maps* y las rachas RLE. | *Zone maps* y *Row Groups* (`de2-formatos-01`), codificación RLE y Zstandard (`de2-formatos-04`). | Diagnóstico sobre `events.parquet` (`65 000` filas en `1 055` días distintos) y `orders.parquet` (`18 000` filas entre 2023 y 2025 en 4 regiones): particionar `events` por `(fecha, event_type, device_type)` genera miles de archivos diminutos de `4 a 6` eventos por día, mientras que particionar `orders` por `(order_year, region)` produce 12 particiones equilibradas. |

---

## 3. Especificación y rúbrica del proyecto del módulo (Paso 6)

### Enunciado y entregable en `src/data/catalog/modules.js`
- **Prompt en catálogo:** *Tomar las tablas de eventos y órdenes de Mercado Brisa, reescribirlas en Parquet con compresión Zstandard y particionado óptimo, y medir el tamaño y tiempo de consulta con DuckDB.*
- **Dataset:** *Mercado Brisa (`events` y `orders`)*
- **Entregable:** *Script reproducible y tabla comparativa de tamaño en bytes, filas leídas y tiempo de ejecución antes y después.*

### Cifras reales de referencia sobre Mercado Brisa para corrección del proyecto
1. **Línea base de los archivos originales (`public/datasets/`):**
   - `events.parquet`: `65 000` filas, `12` columnas, `1 099 791 bytes` en disco (`1 089 111 bytes` comprimidos en páginas y `4 933 709 bytes` descomprimidos). Las columnas `event_ts_raw` (`468 754 bytes`, `43.04 %`) y `event_ts` (`423 601 bytes`, `38.89 %`) absorben el `81.93 %` del peso comprimido.
   - `orders.parquet`: `18 000` filas, `14` columnas, `393 310 bytes` en disco (`380 895 bytes` comprimidos en páginas y `783 766 bytes` descomprimidos).
2. **Impacto medido al ordenar (`ORDER BY`) y comprimir con `ZSTD` en DuckDB:**
   - Al escribir `events` en 7 *Row Groups* de `10 000` filas ordenados por `(event_ts, event_type)` con `PARQUET_VERSION V2, COMPRESSION ZSTD`, el peso comprimido baja de `1 740 784 bytes` (orden aleatorio por hash) a `1 480 584 bytes` (razón `2.71x` frente a `2.37x`), y una consulta sobre octubre de 2025 salta **6 de los 7 Row Groups** (`1` bloque candidato frente a `7` en la tabla desordenada).
   - En `orders`, agrupar u ordenar por `(order_year, region)` o `(status, store_id)` concentra los `14 760` pedidos `completed` y evita la explosión de archivos pequeños que ocurriría al particionar por `order_date` (`1 055` fechas distintas).

### Rúbrica verificable de 4 criterios (escala 0–4)

| Criterio | 0–1 (Insuficiente) | 2 (Básico) | 3 (Competente) | 4 (Excelente) |
|---|---|---|---|---|
| **1. Auditoría física inicial con `parquet_metadata()`** | No inspecciona los metadatos físicos de `events.parquet` ni `orders.parquet`; solo reporta el tamaño total del archivo en el sistema operativo. | Consulta `parquet_metadata()` pero no desglosa el peso comprimido y descomprimido por columna ni identifica las columnas dominantes. | Desglosa `total_compressed_size`, `total_uncompressed_size`, razón de compresión y codificaciones (`encodings`) de las 12 columnas de `events` y las 14 de `orders`. | Audita además la cardinalidad y los límites `stats_min_value` / `stats_max_value` por columna, demostrando que `event_ts_raw` (`43.04 %`) y `event_ts` (`38.89 %`) concentran el `81.93 %` de los bytes de `events.parquet`. |
| **2. Diseño de ordenamiento (`ORDER BY`) y codificación/compresión `ZSTD`** | Reescribe las tablas sin ordenar ni configurar versión/compresión, obteniendo los mismos *zone maps* solapados. | Aplica `COMPRESSION ZSTD` en `COPY ... TO`, pero no ordena las filas por las columnas de filtro más frecuentes (`event_ts`, `event_type`, `status`, `order_date`). | Exporta ambas tablas ordenadas por sus atributos de filtrado con `FORMAT PARQUET, PARQUET_VERSION V2, COMPRESSION ZSTD`. | Compara experimentalmente el diseño desordenado frente al ordenado (`ORDER BY event_ts, event_type`) y demuestra con `parquet_metadata()` que se omiten 6 de 7 *Row Groups* al filtrar un mes. |
| **3. Prevención del problema de archivos pequeños (*Small Files*)** | Particiona `events` o `orders` por columnas de alta cardinalidad (como `order_date` con más de 1 000 días), generando miles de archivos de pocos kilobytes. | Reconoce que no debe particionar por `customer_id`, pero particiona en decenas de archivos menores de 50 KB sin calcular el tamaño medio resultante. | Calcula la cardinalidad combinada antes de escribir, justifica mantener archivos compactos o particionar solo por año/región y verifica el promedio de filas y bytes por partición. | Cuantifica en SQL la relación `filas_totales / combinaciones_distintas` para al menos 2 esquemas de particionado y establece una regla explícita de umbral mínimo de tamaño por archivo y *Row Group*. |
| **4. Benchmark reproducible y tabla comparativa en DuckDB / Polars** | Entrega cifras manuales sin script reproducible o usa consultas con `SELECT *` sin poda de columnas ni predicados. | Incluye un script que mide tiempo de ejecución de una sola corrida sin comparar bytes leídos ni grupos de filas omitidos. | Entrega un script reproducible que ejecuta consultas analíticas con poda de columnas y filtros sobre las tablas antes y después, reportando una tabla comparativa con tamaño en bytes, *Row Groups* leídos y mediana de tiempo. | Incluye verificación con `EXPLAIN ANALYZE` en DuckDB y `.explain()` en Polars `LazyFrame`, contrastando el escaneo completo frente a la lectura con poda de columnas y *zone maps*. |
