// Flashcards unificadas v2 (validadas con FlashcardSchema) y exports compatibles INITIAL_FLASHCARDS / CARD_LESSON_MAP
export const FLASHCARDS = [
  {
    "id": "fc-01",
    "lessonId": "c1-sql-joins-02-grano-fanout",
    "legacyLessonId": "l1-joins-fanout",
    "moduleId": "c1-sql-joins",
    "track": "core",
    "front": "¿Qué es la trampa de Fan-out (explosión de filas) en un JOIN y cómo distorsiona las métricas en un dashboard de BI?",
    "back": "Ocurre cuando se realiza un JOIN entre una tabla de grano fino y otra que no es única en la llave de cruce (relación 1:N o N:M) y luego se aplica SUM() o COUNT() sobre la tabla izquierda. Las filas del lado \"1\" se duplican N veces, inflando artificialmente ingresos o conteos. Se previene pre-agregando la tabla detalle en una CTE al mismo grano antes del JOIN o usando métricas semi-aditivas gobernadas.",
    "tags": [
      "c1-sql-joins",
      "datos"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-02",
    "lessonId": "c2-sql-analitico-01-window-functions",
    "legacyLessonId": "l2-window-functions",
    "moduleId": "c2-sql-analitico",
    "track": "core",
    "front": "¿Cómo funciona la cláusula QUALIFY en motores SQL modernos (DuckDB, Snowflake, BigQuery, Databricks) y en qué fase del orden lógico de evaluación se ejecuta?",
    "back": "QUALIFY filtra el resultado de funciones de ventana (ROW_NUMBER, RANK, LAG, SUM OVER) sin necesidad de envolver la consulta en una subconsulta o CTE adicional. En el orden lógico de evaluación SQL se ejecuta después de WINDOW (y por tanto después de WHERE, GROUP BY y HAVING), pero antes de ORDER BY y LIMIT.",
    "tags": [
      "c2-sql-analitico",
      "datos"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-03",
    "lessonId": "c2-sql-analitico-02-asof-lateral-ctes",
    "legacyLessonId": "l3-asof-lateral-ctes",
    "moduleId": "c2-sql-analitico",
    "track": "core",
    "front": "¿Qué problema resuelve un ASOF JOIN en series temporales financieras o de telemetría y por qué evita el Data Leakage (fuga de datos del futuro)?",
    "back": "Un ASOF JOIN empareja cada fila de una tabla izquierda con la fila más cercana en el tiempo de la tabla derecha que sea anterior o igual (<=) a la marca temporal del evento. Evita el Data Leakage porque garantiza que una transacción o feature de ML solo se cruce con la cotización o estado vigente en ese milisegundo exacto, sin usar valores futuros.",
    "tags": [
      "c2-sql-analitico",
      "datos"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-04",
    "lessonId": "c2-dimensional-02-star-schema-obt",
    "legacyLessonId": "l4-star-schema-obt",
    "moduleId": "c2-dimensional",
    "track": "core",
    "front": "¿Cuándo conviene diseñar un Esquema Estrella (Star Schema) frente a una One Big Table (OBT) desnormalizada en motores columnares modernos?",
    "back": "La OBT elimina el costo de JOINs en tiempo de consulta y aprovecha la compresión RLE/Diccionario de Parquet en escaneos de una sola tabla, ideal para cargas intensivas en CPU. El Star Schema sigue siendo superior cuando existen múltiples tablas de hechos con diferente granularidad (ventas vs. presupuesto mensual), dimensiones SCD Tipo 2 compartidas (Conformed Dimensions) o gobierno en Capa Semántica.",
    "tags": [
      "c2-dimensional",
      "datos"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-05",
    "lessonId": "c2-dimensional-03-scd2-history",
    "legacyLessonId": "l5-scd2-history",
    "moduleId": "c2-dimensional",
    "track": "core",
    "front": "¿Cómo preserva la historia una Dimensión Lentamente Cambiante Tipo 2 (SCD Type 2) y qué columnas técnicas son indispensables?",
    "back": "SCD Tipo 2 crea una nueva fila cada vez que cambia un atributo rastreado (ej. segmento o país del cliente), manteniendo intacta la atribución histórica. Requiere una llave subrogada única (surrogate key, ej. cliente_sk), la llave natural (cliente_id), marcas de vigencia (valid_from, valid_to) y una bandera booleana is_current para consultas del estado actual.",
    "tags": [
      "c2-dimensional",
      "datos"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-06",
    "lessonId": "c2-dimensional-04-metrics-simpson",
    "legacyLessonId": "l6-metrics-simpson",
    "moduleId": "c2-dimensional",
    "track": "core",
    "front": "¿Qué es la Paradoja de Simpson en el análisis de KPIs y cómo se detecta antes de presentar conclusiones ejecutivas?",
    "back": "Es un fenómeno estadístico donde una tendencia observada en varios segmentos desaparece o se invierte al combinar los datos en un único agregado global. Ocurre cuando existe una variable de confusión (confounder) correlacionada tanto con la métrica como con el peso/volumen de cada grupo. Se detecta desglosando por variables de mezcla (canal, dispositivo, país) y aplicando estandarización por pesos fijos.",
    "tags": [
      "c2-dimensional",
      "datos"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-07",
    "lessonId": "c2-dimensional-04-metrics-simpson",
    "legacyLessonId": "l6-metrics-simpson",
    "moduleId": "c2-dimensional",
    "track": "core",
    "front": "¿Por qué las métricas no aditivas (ratios, tasas de conversión, ticket promedio, COUNT DISTINCT) nunca deben promediarse ni sumarse a partir de tablas pre-agregadas diarias?",
    "back": "Porque el promedio de promedios no pondera el volumen de cada día (un día con 10 visitas pesa igual que Black Friday con 1 millón), y la suma de usuarios únicos diarios (DAU) cuenta múltiples veces al mismo usuario recurrente en el mes (MAU). En BI siempre deben almacenarse numerador y denominador por separado (SUM(ingresos) / SUM(ordenes)) o usar HyperLogLog / sketches para cardinalidades.",
    "tags": [
      "c2-dimensional",
      "datos"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-08",
    "lessonId": "de2-formatos-01-columnar-parquet",
    "legacyLessonId": "l7-columnar-parquet",
    "moduleId": "de2-formatos",
    "track": "de",
    "front": "¿Cómo interactúan los Row Groups, Column Chunks y Zone Maps (estadísticas min/max) dentro de un archivo Apache Parquet para acelerar consultas?",
    "back": "Parquet divide la tabla horizontalmente en Row Groups (típicamente 128 MB o ~1M filas) y dentro de cada uno almacena un Column Chunk contiguo por columna. El Footer guarda Zone Maps (min, max, null_count) y Bloom Filters por cada Column Chunk. Mediante Projection Pushdown solo se leen las columnas pedidas, y con Predicate Pushdown el motor salta Row Groups enteros si el filtro WHERE cae fuera del rango [min, max].",
    "tags": [
      "de2-formatos",
      "datos"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-09",
    "lessonId": "de2-formatos-02-arrow-lance-vortex",
    "legacyLessonId": "l8-arrow-lance-vortex",
    "moduleId": "de2-formatos",
    "track": "de",
    "front": "¿Qué significa que Apache Arrow permita transferencia Zero-Copy entre DuckDB, Polars, PySpark y Python?",
    "back": "Tradicionalmente, pasar datos entre motores requería serializar filas a bytes y deserializarlas (gastando hasta 70% de CPU). Apache Arrow define un formato estándar de buffers columnares contiguos en memoria RAM (con bitmaps de nulos y offsets alineados para SIMD). Con Zero-Copy, Polars y DuckDB comparten el mismo puntero de memoria RAM sin copiar ni transformar un solo byte.",
    "tags": [
      "de2-formatos",
      "datos"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-10",
    "lessonId": "de2-formatos-03-duckdb-polars-marimo",
    "legacyLessonId": "l9-duckdb-polars-marimo",
    "moduleId": "de2-formatos",
    "track": "de",
    "front": "¿En qué escenarios operativos es más eficiente ejecutar DuckDB en un solo nodo (Single-Node Vectorized Engine) en lugar de levantar un clúster distribuido de Apache Spark?",
    "back": "Para datasets de hasta 100 GB - 1 TB comprimidos (que representan más del 90% de las cargas analíticas reales), un nodo moderno con 64-128 GB de RAM y NVMe procesa datos en DuckDB más rápido y barato que un clúster Spark porque elimina el arranque de máquinas virtuales, la serialización de red (Shuffle) entre nodos y la sobrecarga de la JVM, usando ejecución vectorizada por lotes de caché L1/L2 y Out-of-Core spilling a disco.",
    "tags": [
      "de2-formatos",
      "datos"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-11",
    "lessonId": "de2-formatos-03-duckdb-polars-marimo",
    "legacyLessonId": "l9-duckdb-polars-marimo",
    "moduleId": "de2-formatos",
    "track": "de",
    "front": "¿Cuál es la diferencia arquitectónica entre la API Eager (pl.read_parquet) y la API Lazy (pl.scan_parquet) en Polars?",
    "back": "La API Eager carga todo el archivo en RAM inmediatamente y ejecuta cada paso secuencialmente creando copias intermedias. La API Lazy construye un grafo lógico ( Logical Plan ) y antes de ejecutar (.collect()) aplica un optimizador de consultas en Rust que realiza Predicate Pushdown (filtra al leer), Projection Pushdown (solo carga las columnas necesarias), Common Subplan Elimination y ejecución streaming multihilo.",
    "tags": [
      "de2-formatos",
      "datos"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-12",
    "lessonId": "de3-lakehouse-01-iceberg-v3-medallion",
    "legacyLessonId": "l10-iceberg-v3-medallion",
    "moduleId": "de3-lakehouse",
    "track": "de",
    "front": "¿Qué aportan los Deletion Vectors (Roaring Bitmaps) y el tipo de dato binario Variant en la especificación Apache Iceberg v3?",
    "back": "En Iceberg v3, los Deletion Vectors reemplazan los antiguos archivos de borrado posicional por bitmaps compactos (Roaring Bitmaps) en formato Puffin que marcan qué filas fueron actualizadas o borradas (Merge-on-Read), acelerando los MERGE INTO y el cumplimiento GDPR sin reescribir archivos Parquet de cientos de megabytes. El tipo Variant almacena JSON semiestructurado en formato binario columnar tipado, permitiendo lectura rápida con sub-columnarización automática.",
    "tags": [
      "de3-lakehouse",
      "datos"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-13",
    "lessonId": "de3-lakehouse-01-iceberg-v3-medallion",
    "legacyLessonId": "l10-iceberg-v3-medallion",
    "moduleId": "de3-lakehouse",
    "track": "de",
    "front": "¿Cómo funciona el patrón Write-Audit-Publish (WAP) sobre ramas de catálogo en Apache Iceberg para evitar que datos corruptos lleguen a los dashboards?",
    "back": "Con WAP, el pipeline escribe los nuevos datos en una rama aislada del catálogo Iceberg (ej. audit_branch) sin tocar la rama main que consumen los usuarios. Luego se ejecutan pruebas de calidad deterministas (unicidad, nulos, reconciliación de totales, anomalías de volumen) contra esa rama. Si todas pasan, se realiza un fast-forward atómico de metadatos hacia main; si fallan, se aborta sin haber contaminado producción.",
    "tags": [
      "de3-lakehouse",
      "datos"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-14",
    "lessonId": "de3-transformacion-01-dbt-sqlmesh-dag",
    "legacyLessonId": "l11-dbt-sqlmesh-dag",
    "moduleId": "de3-transformacion",
    "track": "de",
    "front": "¿Por qué los Entornos Virtuales de Datos en SQLMesh evitan reconstruir tablas completas en staging a diferencia del enfoque tradicional de dbt?",
    "back": "SQLMesh parsea el SQL mediante un AST (SQLGlot) y calcula una huella criptográfica (fingerprint) semántica de cada modelo y sus dependencias. Al crear un entorno dev, solo materializa físicamente las tablas cuyo código o lógica cambió, y para el resto crea vistas ligeras (Zero-Copy Virtual Layer) apuntando a las tablas físicas de producción. Al promover a prod, simplemente intercambia punteros de vistas sin recalcular terabytes.",
    "tags": [
      "de3-transformacion",
      "datos"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-15",
    "lessonId": "de3-transformacion-03-contracts-semantic-layer",
    "legacyLessonId": "l12-contracts-semantic-layer",
    "moduleId": "de3-transformacion",
    "track": "de",
    "front": "¿Qué es un Data Contract bajo el estándar ODCS v3 (Open Data Contract Standard) y cómo previene roturas silenciosas entre microservicios y el Lakehouse?",
    "back": "Es un acuerdo formal en código (YAML/JSON) entre el equipo productor del servicio (Software Engineering) y los consumidores de datos (DE/DA/BI). Define esquema estricto, semántica de negocio, reglas de calidad (ej. moneda en ISO-4217), SLAs de frescura y propietarios. Se valida en el CI/CD del productor y en el gateway de ingesta, enviando registros inválidos a una Dead-Letter Queue antes de romper el pipeline.",
    "tags": [
      "de3-transformacion",
      "datos"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-16",
    "lessonId": "de3-transformacion-03-contracts-semantic-layer",
    "legacyLessonId": "l12-contracts-semantic-layer",
    "moduleId": "de3-transformacion",
    "track": "de",
    "front": "¿Qué rol cumple una Capa Semántica (MetricFlow / Cube) entre el Lakehouse y las herramientas de BI o agentes de IA?",
    "back": "Centraliza las definiciones de métricas de negocio (Ingresos Netos Recurrentes, Churn, Margen Bruto) en código declarativo versionado en Git, separando las medidas (measures) de las dimensiones y entidades. Evita el \"SQL Drift\" donde Finanzas y Marketing calculan el mismo KPI con filtros distintos, y expone una API gobernada para que tanto dashboards como servidores MCP consulten exactamente la misma fórmula.",
    "tags": [
      "de3-transformacion",
      "datos"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-17",
    "lessonId": "da3-experimentos-01-ab-testing-cuped",
    "legacyLessonId": "l14-ab-testing-cuped",
    "moduleId": "da3-experimentos",
    "track": "da",
    "front": "¿Qué es el Sample Ratio Mismatch (SRM) en un experimento A/B y por qué invalida cualquier p-valor o lift observado?",
    "back": "El SRM ocurre cuando la proporción real de usuarios asignados a Control y Tratamiento difiere estadísticamente de la proporción diseñada (ej. se planeó 50%/50% pero llegaron 50.4%/49.6% con un p-valor de Chi-cuadrado < 0.001). Indica un sesgo grave de selección o pérdida asimétrica de telemetría (ej. la variante B tarda más en cargar y pierde eventos en móviles lentos), invalidando por completo la inferencia causal del test.",
    "tags": [
      "da3-experimentos",
      "datos"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-18",
    "lessonId": "da3-experimentos-01-ab-testing-cuped",
    "legacyLessonId": "l14-ab-testing-cuped",
    "moduleId": "da3-experimentos",
    "track": "da",
    "front": "¿Cómo logra la técnica CUPED (Controlled-experiment Using Pre-Experiment Data) reducir la varianza y acortar el tiempo necesario de un A/B test?",
    "back": "CUPED utiliza una covariable X medida ANTES de iniciar el experimento (ej. el gasto del mismo usuario en los 14 días previos) que esté correlacionada con la métrica objetivo Y. Como X no pudo ser afectada por el tratamiento, sustrae la variabilidad preexistente mediante Y_cuped = Y - θ(X - media(X)), donde θ = Cov(Y, X) / Var(X). La varianza se reduce en un factor (1 - r²), permitiendo detectar efectos pequeños con mucha menor muestra.",
    "tags": [
      "da3-experimentos",
      "datos"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-19",
    "lessonId": "bi3-dashboards-01-bi-tufte-code",
    "legacyLessonId": "l15-bi-tufte-code",
    "moduleId": "bi3-dashboards",
    "track": "bi",
    "front": "¿Qué establece el principio de Data-Ink Ratio de Edward Tufte y cómo se aplica con atributos preatentivos en el diseño de dashboards ejecutivos?",
    "back": "El Data-Ink Ratio es la proporción de tinta (píxeles) del gráfico dedicada a representar datos reales frente al total de píxeles usados. Tufte prescribe eliminar todo el \"chartjunk\" (rejillas oscuras, fondos 3D, bordes redundantes, leyendas separadas) y usar atributos preatentivos (color de acento único para anomalías, posición en escala común y Small Multiples) para que la dirección detecte desviaciones en menos de 2 segundos.",
    "tags": [
      "bi3-dashboards",
      "datos"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-20",
    "lessonId": "bi3-dashboards-01-bi-tufte-code",
    "legacyLessonId": "l15-bi-tufte-code",
    "moduleId": "bi3-dashboards",
    "track": "bi",
    "front": "¿Qué ventajas aporta el paradigma BI-as-Code (Evidence.dev, Lightdash, Rill, Malloy) frente a construir reportes manualmente con clics en herramientas legadas?",
    "back": "Con BI-as-Code, las consultas SQL, métricas y componentes visuales se definen en archivos Markdown/YAML versionados en Git. Esto habilita revisiones por Pull Request, entornos de previsualización por rama, pruebas automáticas de CI que verifican que ningún cambio en dbt/SQLMesh rompa un gráfico antes de fusionar a producción, y trazabilidad de linaje de extremo a extremo (Data-to-Dashboard Lineage).",
    "tags": [
      "bi3-dashboards",
      "datos"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-21",
    "lessonId": "de4-streaming-01-cdc-kafka-streaming",
    "legacyLessonId": "l16-cdc-kafka-streaming",
    "moduleId": "de4-streaming",
    "track": "de",
    "front": "¿Por qué el Change Data Capture (CDC) basado en logs (Debezium leyendo el WAL de PostgreSQL o Binlog de MySQL) supera a la extracción por consultas SELECT con updated_at?",
    "back": "El CDC basado en el Write-Ahead Log (WAL) lee secuencialmente el registro de transacciones físicas ya confirmado por el motor OLTP sin ejecutar consultas pesadas contra los índices de producción. Además, captura el 100% de las transiciones intermedias de una fila y detecta los borrados físicos (Hard Deletes) como eventos explícitos (op: \"d\"), algo imposible cuando solo se hace polling por WHERE updated_at > last_run.",
    "tags": [
      "de4-streaming",
      "datos"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-22",
    "lessonId": "de4-streaming-03-flink-watermarks-mv",
    "legacyLessonId": "l17-flink-watermarks-mv",
    "moduleId": "de4-streaming",
    "track": "de",
    "front": "¿Cuál es la diferencia entre Event Time y Processing Time en streaming (Apache Flink / Spark Structured Streaming) y para qué sirven los Watermarks?",
    "back": "Event Time es el instante en que ocurrió realmente el hecho en el dispositivo del usuario; Processing Time es cuando el servidor de streaming procesa el mensaje (que puede llegar minutos u horas tarde si el móvil estuvo sin cobertura). Un Watermark W(t) es un umbral monotónico que le indica al motor que no espera más eventos con timestamp < t, permitiendo cerrar ventanas de agregación con tolerancia controlada a datos tardíos (Bounded Out-of-Orderness).",
    "tags": [
      "de4-streaming",
      "datos"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-23",
    "lessonId": "x4-ia-datos-01-mcp-semantic-ai-rag",
    "legacyLessonId": "l18-mcp-semantic-ai-rag",
    "moduleId": "x4-ia-datos",
    "track": "core",
    "front": "¿Por qué conectar agentes de IA mediante un servidor Model Context Protocol (MCP) a la Capa Semántica es mucho más seguro que pedirle al LLM que invente SQL libre sobre tablas crudas?",
    "back": "El protocolo MCP expone herramientas tipadas (Tools) y recursos (Resources) de solo lectura donde el agente consulta las métricas oficiales y dimensiones certificadas de la Capa Semántica. En lugar de alucinar nombres de tablas o olvidar filtros de órdenes canceladas (Text-to-SQL crudo), el agente invoca la herramienta MCP query_semantic_metric con parámetros validados y credenciales acotadas con Row-Level Security.",
    "tags": [
      "x4-ia-datos",
      "datos"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-24",
    "lessonId": "x4-ia-datos-01-mcp-semantic-ai-rag",
    "legacyLessonId": "l18-mcp-semantic-ai-rag",
    "moduleId": "x4-ia-datos",
    "track": "core",
    "front": "¿Cómo combina un sistema Hybrid RAG la búsqueda léxica (BM25) y la búsqueda vectorial densa (HNSW) mediante Reciprocal Rank Fusion (RRF)?",
    "back": "Los embeddings densos (HNSW) capturan similitud semántica pero suelen fallar al buscar códigos exactos de SKUs, errores SQL o acrónimos internos; por su parte, BM25 sobresale en la coincidencia exacta de términos raros (TF-IDF con saturación). Hybrid RAG ejecuta ambas búsquedas en paralelo y fusiona los rankings sin necesidad de calibrar escalas de scores usando Reciprocal Rank Fusion: RRF(d) = Σ 1 / (k + rank_i(d)), con k ≈ 60.",
    "tags": [
      "x4-ia-datos",
      "datos"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c1-joins-01",
    "lessonId": "c1-sql-joins-02-grano-fanout",
    "legacyLessonId": "l1-joins-fanout",
    "moduleId": "c1-sql-joins",
    "track": "core",
    "front": "¿Qué es el grano (grain) de una tabla y cómo se verifica en SQL?",
    "back": "Es lo que representa una fila física. Se verifica comprobando que COUNT(*) coincida con COUNT(DISTINCT clave_candidata).",
    "tags": [
      "c1-sql-joins",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-joins-02",
    "lessonId": "c1-sql-joins-02-grano-fanout",
    "legacyLessonId": "l1-joins-fanout",
    "moduleId": "c1-sql-joins",
    "track": "core",
    "front": "¿Por qué un JOIN 1:N infla SUM(order_total) pero no altera COUNT(DISTINCT order_id)?",
    "back": "Porque cada fila de cabecera se repite N veces por sus hijos; SUM suma las repeticiones, mientras COUNT(DISTINCT) colapsa IDs duplicados.",
    "tags": [
      "c1-sql-joins",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-joins-03",
    "lessonId": "c1-sql-joins-02-grano-fanout",
    "legacyLessonId": "l1-joins-fanout",
    "moduleId": "c1-sql-joins",
    "track": "core",
    "front": "¿Qué es una trampa de abismo (chasm trap) al unir dos tablas de detalle?",
    "back": "Ocurre al unir dos relaciones 1:N independientes sobre la misma entidad padre (N:1:M), generando N×M filas por entidad.",
    "tags": [
      "c1-sql-joins",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c2-win-01",
    "lessonId": "c2-sql-analitico-01-window-functions",
    "legacyLessonId": "l2-window-functions",
    "moduleId": "c2-sql-analitico",
    "track": "core",
    "front": "¿En qué se diferencia ROW_NUMBER(), RANK() y DENSE_RANK() ante empates?",
    "back": "ROW_NUMBER asigna números únicos (1,2,3); RANK empata y salta huecos (1,1,3); DENSE_RANK empata sin dejar huecos (1,1,2).",
    "tags": [
      "c2-sql-analitico",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-win-02",
    "lessonId": "c2-sql-analitico-01-window-functions",
    "legacyLessonId": "l2-window-functions",
    "moduleId": "c2-sql-analitico",
    "track": "core",
    "front": "¿Por qué RANGE BETWEEN INTERVAL 6 DAYS PRECEDING es más seguro que ROWS BETWEEN 6 PRECEDING en series diarias?",
    "back": "Porque si falta un día sin ventas, ROWS retrocede 6 filas físicas (7 o más días reales), mientras RANGE respeta la ventana calendario.",
    "tags": [
      "c2-sql-analitico",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-win-03",
    "lessonId": "c2-sql-analitico-01-window-functions",
    "legacyLessonId": "l2-window-functions",
    "moduleId": "c2-sql-analitico",
    "track": "core",
    "front": "¿Qué problema causa PARTITION BY session_id cuando el 60 % de las filas tienen session_id IS NULL?",
    "back": "Todas las filas NULL van al mismo nodo trabajador durante el hash shuffle, causando sesgo de datos (data skew) y posible falta de memoria.",
    "tags": [
      "c2-sql-analitico",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-asof-01",
    "lessonId": "c2-sql-analitico-02-asof-lateral-ctes",
    "legacyLessonId": "l3-asof-lateral-ctes",
    "moduleId": "c2-sql-analitico",
    "track": "core",
    "front": "¿Qué resuelve un ASOF JOIN frente a un JOIN con desigualdad (a.ts >= b.ts)?",
    "back": "Un JOIN con desigualdad devuelve todas las filas pasadas (fan-out); ASOF JOIN devuelve como máximo una fila: la inmediatamente anterior o igual.",
    "tags": [
      "c2-sql-analitico",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-asof-02",
    "lessonId": "c2-sql-analitico-02-asof-lateral-ctes",
    "legacyLessonId": "l3-asof-lateral-ctes",
    "moduleId": "c2-sql-analitico",
    "track": "core",
    "front": "¿Cuándo prefieres LEFT JOIN LATERAL sobre ASOF JOIN?",
    "back": "Cuando necesitas las N filas previas (LIMIT 3) en lugar de una sola, o cuando trabajas en PostgreSQL donde ASOF JOIN no es nativo.",
    "tags": [
      "c2-sql-analitico",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-asof-03",
    "lessonId": "c2-sql-analitico-02-asof-lateral-ctes",
    "legacyLessonId": "l3-asof-lateral-ctes",
    "moduleId": "c2-sql-analitico",
    "track": "core",
    "front": "¿Qué riesgo introduce usar a.ts <= b.ts por error en un cruce histórico para entrenamiento ML?",
    "back": "Asigna estados futuros a eventos pasados (fuga de datos del futuro o data leakage), invalidando las métricas del modelo.",
    "tags": [
      "c2-sql-analitico",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-star-01",
    "lessonId": "c2-dimensional-02-star-schema-obt",
    "legacyLessonId": "l4-star-schema-obt",
    "moduleId": "c2-dimensional",
    "track": "core",
    "front": "¿Por qué se usan claves sustitutas (surrogate keys) en lugar de IDs de producción en dimensiones?",
    "back": "Aíslan el almacén de cambios en sistemas origen, integran múltiples fuentes y permiten versionar filas históricas en SCD Tipo 2.",
    "tags": [
      "c2-dimensional",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-star-02",
    "lessonId": "c2-dimensional-02-star-schema-obt",
    "legacyLessonId": "l4-star-schema-obt",
    "moduleId": "c2-dimensional",
    "track": "core",
    "front": "¿Qué ventaja aporta una dimensión conformada (`dim_customer`) frente a varias OBT aisladas?",
    "back": "Garantiza que Ventas, Soporte y Logística filtren y agrupen por los mismos atributos de cliente y permite cruzar hechos mediante drill-across.",
    "tags": [
      "c2-dimensional",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-star-03",
    "lessonId": "c2-dimensional-02-star-schema-obt",
    "legacyLessonId": "l4-star-schema-obt",
    "moduleId": "c2-dimensional",
    "track": "core",
    "front": "¿Qué ocurre en una OBT de 2 000 millones de filas cuando cambia el nombre de una categoría de producto?",
    "back": "Obliga a reescribir todos los archivos Parquet donde aparece esa categoría, mientras que en estrella solo se actualiza `dim_product`.",
    "tags": [
      "c2-dimensional",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-scd-01",
    "lessonId": "c2-dimensional-03-scd2-history",
    "legacyLessonId": "l5-scd2-history",
    "moduleId": "c2-dimensional",
    "track": "core",
    "front": "¿Por qué se prefiere el intervalo semiabierto [valid_from, valid_to) sobre BETWEEN en SCD Tipo 2?",
    "back": "Porque con BETWEEN, si el cierre de una versión coincide al segundo con el inicio de la siguiente, el JOIN empareja ambas filas y duplica el hecho.",
    "tags": [
      "c2-dimensional",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-scd-02",
    "lessonId": "c2-dimensional-03-scd2-history",
    "legacyLessonId": "l5-scd2-history",
    "moduleId": "c2-dimensional",
    "track": "core",
    "front": "¿Cómo provoca una dimensión SCD Tipo 1 fuga de datos (data leakage) al entrenar un modelo de abandono?",
    "back": "Inyecta en el pasado atributos o estados que el cliente adquirió meses después del evento de entrenamiento.",
    "tags": [
      "c2-dimensional",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-scd-03",
    "lessonId": "c2-dimensional-03-scd2-history",
    "legacyLessonId": "l5-scd2-history",
    "moduleId": "c2-dimensional",
    "track": "core",
    "front": "¿Para qué sirve almacenar valid_to = 9999-12-31 en la versión actual de una dimensión SCD Tipo 2?",
    "back": "Permite escribir condiciones de rango limpias (event_ts < valid_to) sin evaluar OR valid_to IS NULL, mejorando el uso de índices y zone maps.",
    "tags": [
      "c2-dimensional",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-simp-01",
    "lessonId": "c2-dimensional-04-metrics-simpson",
    "legacyLessonId": "l6-metrics-simpson",
    "moduleId": "c2-dimensional",
    "track": "core",
    "front": "¿Por qué es un error calcular la conversión mensual como AVG(daily_conversion_rate)?",
    "back": "Porque pondera igual un martes de 500 visitas que un sábado de 50 000 visitas; debe calcularse como SUM(orders) / SUM(sessions).",
    "tags": [
      "c2-dimensional",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-simp-02",
    "lessonId": "c2-dimensional-04-metrics-simpson",
    "legacyLessonId": "l6-metrics-simpson",
    "moduleId": "c2-dimensional",
    "track": "core",
    "front": "¿Cómo se explica que la conversión suba en Web y suba en App pero baje en el total de la empresa?",
    "back": "Por un cambio de mezcla (mix shift): creció mucho el peso de tráfico en el canal con menor conversión base (App), arrastrando la media ponderada.",
    "tags": [
      "c2-dimensional",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-simp-03",
    "lessonId": "c2-dimensional-04-metrics-simpson",
    "legacyLessonId": "l6-metrics-simpson",
    "moduleId": "c2-dimensional",
    "track": "core",
    "front": "¿Por qué una métrica de inventario (stock_on_hand) se clasifica como semi-aditiva?",
    "back": "Se puede sumar entre productos y almacenes en una fecha fija, pero no se puede sumar a lo largo del tiempo (se promedia o se toma el cierre).",
    "tags": [
      "c2-dimensional",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-parq-01",
    "lessonId": "de2-formatos-01-columnar-parquet",
    "legacyLessonId": "l7-columnar-parquet",
    "moduleId": "de2-formatos",
    "track": "de",
    "front": "¿Por qué los zone maps (min/max) dejan de saltar bloques cuando escribes filas en orden aleatorio?",
    "back": "Porque cada Row Group acaba conteniendo casi todo el rango de fechas o valores, solapándose el min y el max en todos los bloques.",
    "tags": [
      "de2-formatos",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-parq-02",
    "lessonId": "de2-formatos-01-columnar-parquet",
    "legacyLessonId": "l7-columnar-parquet",
    "moduleId": "de2-formatos",
    "track": "de",
    "front": "¿Para qué sirve un filtro de Bloom en el encabezado de un Row Group de Parquet?",
    "back": "Para responder con certeza si un valor de alta cardinalidad (como un order_id o UUID) NO está en ese Row Group sin leer las páginas.",
    "tags": [
      "de2-formatos",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-parq-03",
    "lessonId": "de2-formatos-01-columnar-parquet",
    "legacyLessonId": "l7-columnar-parquet",
    "moduleId": "de2-formatos",
    "track": "de",
    "front": "¿Qué combinación de codificación aplica Parquet sobre una columna de texto con pocos valores distintos (país)?",
    "back": "Codificación por diccionario (sustituye cadenas por enteros pequeños) seguida de Run-Length Encoding (RLE) y empaquetado de bits.",
    "tags": [
      "de2-formatos",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-arr-01",
    "lessonId": "de2-formatos-02-arrow-lance-vortex",
    "legacyLessonId": "l8-arrow-lance-vortex",
    "moduleId": "de2-formatos",
    "track": "de",
    "front": "¿Cuál es la diferencia de propósito entre Apache Parquet y Apache Arrow?",
    "back": "Parquet es un formato de archivo en disco orientado a alta compresión; Arrow es un formato de tablas en memoria RAM orientado a CPU SIMD e intercambio zero-copy.",
    "tags": [
      "de2-formatos",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-arr-02",
    "lessonId": "de2-formatos-02-arrow-lance-vortex",
    "legacyLessonId": "l8-arrow-lance-vortex",
    "moduleId": "de2-formatos",
    "track": "de",
    "front": "¿Por qué convertir un resultado de DuckDB a pandas con `.df()` puede agotar la memoria frente a `.arrow()`?",
    "back": "Porque `.df()` materializa objetos Python y copias de memoria para textos, mientras `.arrow()` expone los búferes columnares directamente sin duplicarlos.",
    "tags": [
      "de2-formatos",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-arr-03",
    "lessonId": "de2-formatos-02-arrow-lance-vortex",
    "legacyLessonId": "l8-arrow-lance-vortex",
    "moduleId": "de2-formatos",
    "track": "de",
    "front": "¿Por qué Parquet es ineficiente cuando necesitas recuperar 500 filas específicas por índice tras una búsqueda vectorial?",
    "back": "Porque obliga a descomprimir páginas o Row Groups enteros por cada fila buscada (amplificación de lectura), mientras Lance ofrece acceso directo O(1) por desplazamiento.",
    "tags": [
      "de2-formatos",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-local-01",
    "lessonId": "de2-formatos-03-duckdb-polars-marimo",
    "legacyLessonId": "l9-duckdb-polars-marimo",
    "moduleId": "de2-formatos",
    "track": "de",
    "front": "¿Por qué `pl.scan_parquet()` consume mucha menos RAM que `pl.read_parquet()` antes de un filtro y selección?",
    "back": "Porque `scan_parquet` construye un plan lógico y empuja el filtro y las columnas al lector Parquet; `read_parquet` materializa toda la tabla primero.",
    "tags": [
      "de2-formatos",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-local-02",
    "lessonId": "de2-formatos-03-duckdb-polars-marimo",
    "legacyLessonId": "l9-duckdb-polars-marimo",
    "moduleId": "de2-formatos",
    "track": "de",
    "front": "¿Qué es la ejecución guiada por fragmentos (morsel-driven parallelism) en DuckDB?",
    "back": "Divide las tablas en lotes de ~100 000 filas que los hilos de CPU toman dinámicamente con robo de trabajo y vuelcan a disco si superan la RAM.",
    "tags": [
      "de2-formatos",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-local-03",
    "lessonId": "de2-formatos-03-duckdb-polars-marimo",
    "legacyLessonId": "l9-duckdb-polars-marimo",
    "moduleId": "de2-formatos",
    "track": "de",
    "front": "¿Cómo impide Marimo el problema del estado oculto que ocurre en los cuadernos Jupyter tradicionales?",
    "back": "Analiza estáticamente qué variables define y consume cada celda, prohíbe redefinir variables globales y reejecuta en orden topológico las celdas dependientes.",
    "tags": [
      "de2-formatos",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de3-ice-01",
    "lessonId": "de3-lakehouse-01-iceberg-v3-medallion",
    "legacyLessonId": "l10-iceberg-v3-medallion",
    "moduleId": "de3-lakehouse",
    "track": "de",
    "front": "¿Por qué nunca debes listar directorios en S3 (`ls s3://...`) para identificar qué archivos pertenecen a una tabla Iceberg?",
    "back": "Porque en S3 pueden coexistir archivos de instantáneas pasadas o escrituras en curso; solo el árbol que cuelga del metadata.json actual define la tabla.",
    "tags": [
      "de3-lakehouse",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de3-ice-02",
    "lessonId": "de3-lakehouse-01-iceberg-v3-medallion",
    "legacyLessonId": "l10-iceberg-v3-medallion",
    "moduleId": "de3-lakehouse",
    "track": "de",
    "front": "¿Qué ventaja aportan los vectores de borrado (Merge-on-Read) frente a Copy-on-Write ante borrados frecuentes?",
    "back": "Evitan reescribir archivos Parquet de cientos de megabytes por borrar unas pocas filas; escriben un bitmap ligero y difieren la reescritura a la compactación.",
    "tags": [
      "de3-lakehouse",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de3-ice-03",
    "lessonId": "de3-lakehouse-01-iceberg-v3-medallion",
    "legacyLessonId": "l10-iceberg-v3-medallion",
    "moduleId": "de3-lakehouse",
    "track": "de",
    "front": "¿Qué es el particionado oculto (hidden partitioning) en Apache Iceberg?",
    "back": "Iceberg calcula internamente la partición (mes, día, bucket) a partir de la columna timestamp sin exigir que el usuario añada columnas artificiales en el WHERE.",
    "tags": [
      "de3-lakehouse",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de3-dbt-01",
    "lessonId": "de3-transformacion-01-dbt-sqlmesh-dag",
    "legacyLessonId": "l11-dbt-sqlmesh-dag",
    "moduleId": "de3-transformacion",
    "track": "de",
    "front": "¿Qué operaciones están permitidas y cuáles deben evitarse en la capa `staging` (`stg_`)?",
    "back": "Permitidas: renombrar columnas, castear tipos, limpiar cadenas y deduplicar 1:1. Evitar: JOINs entre fuentes o agregaciones que cambien el grano.",
    "tags": [
      "de3-transformacion",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de3-dbt-02",
    "lessonId": "de3-transformacion-01-dbt-sqlmesh-dag",
    "legacyLessonId": "l11-dbt-sqlmesh-dag",
    "moduleId": "de3-transformacion",
    "track": "de",
    "front": "¿Por qué `WHERE event_ts > (SELECT MAX(event_ts) FROM destino)` pierde datos en la vida real?",
    "back": "Porque si un evento con timestamp de las 09:50 llega a las 10:05 después de que ya entró un evento de las 10:00, queda por debajo del MAX y se ignora para siempre.",
    "tags": [
      "de3-transformacion",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de3-dbt-03",
    "lessonId": "de3-transformacion-01-dbt-sqlmesh-dag",
    "legacyLessonId": "l11-dbt-sqlmesh-dag",
    "moduleId": "de3-transformacion",
    "track": "de",
    "front": "¿Para qué sirve parsear el árbol sintáctico (AST) con SQLGlot antes de ejecutar un modelo en la nube?",
    "back": "Detecta errores de sintaxis, extrae el linaje exacto de columnas y calcula una huella semántica para saber qué modelos aguas abajo se ven afectados.",
    "tags": [
      "de3-transformacion",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de3-sem-01",
    "lessonId": "de3-transformacion-03-contracts-semantic-layer",
    "legacyLessonId": "l12-contracts-semantic-layer",
    "moduleId": "de3-transformacion",
    "track": "de",
    "front": "¿Qué diferencia un contrato de datos ejecutable de una página de documentación en un wiki?",
    "back": "El contrato ejecutable es un archivo YAML/JSON validado automáticamente en el CI del productor y en la ingesta; un wiki queda desactualizado sin bloquear despliegues.",
    "tags": [
      "de3-transformacion",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de3-sem-02",
    "lessonId": "de3-transformacion-03-contracts-semantic-layer",
    "legacyLessonId": "l12-contracts-semantic-layer",
    "moduleId": "de3-transformacion",
    "track": "de",
    "front": "¿Qué hace un patrón de corte de circuito (circuit breaker) cuando el 15 % de un lote incumple el contrato?",
    "back": "Detiene la publicación hacia las tablas Silver/Gold, desvía las filas inválidas a cuarentena (dead-letter) y mantiene visible la última versión íntegra.",
    "tags": [
      "de3-transformacion",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de3-sem-03",
    "lessonId": "de3-transformacion-03-contracts-semantic-layer",
    "legacyLessonId": "l12-contracts-semantic-layer",
    "moduleId": "de3-transformacion",
    "track": "de",
    "front": "¿Cómo evita MetricFlow o Cube el fan-out cuando pides métricas de dos tablas con distinto grano?",
    "back": "Usa el grafo de entidades primarias y foráneas para agregar cada medida a su nivel común en subconsultas separadas antes de combinarlas.",
    "tags": [
      "de3-transformacion",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da3-coh-01",
    "lessonId": "da3-producto-02-cohorts-retention-ltv",
    "legacyLessonId": "l13-cohorts-retention-ltv",
    "moduleId": "da3-producto",
    "track": "da",
    "front": "¿Qué es la censura por la derecha (right censoring) en una matriz de retención por cohortes?",
    "back": "Es el hecho de que las cohortes recientes aún no han vivido los meses futuros (M3, M6); incluirlas como 0 en el promedio hunde artificialmente la retención.",
    "tags": [
      "da3-producto",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da3-coh-02",
    "lessonId": "da3-producto-02-cohorts-retention-ltv",
    "legacyLessonId": "l13-cohorts-retention-ltv",
    "moduleId": "da3-producto",
    "track": "da",
    "front": "¿Por qué es peligroso calcular LTV usando ingreso bruto en lugar de margen bruto en un supermercado en línea?",
    "back": "Porque si el margen bruto es del 25 %, usar ingreso bruto infla 4 veces el LTV y lleva a aprobar costos de adquisición (CAC) que generan pérdidas por cada cliente.",
    "tags": [
      "da3-producto",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da3-coh-03",
    "lessonId": "da3-producto-02-cohorts-retention-ltv",
    "legacyLessonId": "l13-cohorts-retention-ltv",
    "moduleId": "da3-producto",
    "track": "da",
    "front": "¿Qué diferencia hay entre retención de usuarios (Logo Retention) y retención neta de ingresos (NRR)?",
    "back": "Logo Retention mide el porcentaje de clientes que siguen activos (<= 100 %); NRR mide el ingreso retenido más expansiones de la cohorte (puede superar el 100 %).",
    "tags": [
      "da3-producto",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da3-ab-01",
    "lessonId": "da3-experimentos-01-ab-testing-cuped",
    "legacyLessonId": "l14-ab-testing-cuped",
    "moduleId": "da3-experimentos",
    "track": "da",
    "front": "¿Qué indica un p-valor < 0.001 en una prueba de Sample Ratio Mismatch (SRM)?",
    "back": "Que la asignación o el registro de telemetría entre Control y Tratamiento está sesgado; las métricas del experimento no deben interpretarse.",
    "tags": [
      "da3-experimentos",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da3-ab-02",
    "lessonId": "da3-experimentos-01-ab-testing-cuped",
    "legacyLessonId": "l14-ab-testing-cuped",
    "moduleId": "da3-experimentos",
    "track": "da",
    "front": "¿Qué requisito debe cumplir la covariable X en CUPED para no introducir sesgo en la estimación del tratamiento?",
    "back": "Debe medirse estrictamente ANTES de la asignación al experimento (o ser completamente independiente del tratamiento) para que E[X_B] = E[X_A].",
    "tags": [
      "da3-experimentos",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da3-ab-03",
    "lessonId": "da3-experimentos-01-ab-testing-cuped",
    "legacyLessonId": "l14-ab-testing-cuped",
    "moduleId": "da3-experimentos",
    "track": "da",
    "front": "¿Cuánto se reduce la varianza de Y_cuped si la correlación entre la métrica pre y post experimento es r = 0.8?",
    "back": "La varianza se multiplica por (1 - r²) = (1 - 0.64) = 0.36, es decir, una reducción del 64 % en la varianza (y en el tamaño muestral requerido).",
    "tags": [
      "da3-experimentos",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-viz-01",
    "lessonId": "bi3-dashboards-01-bi-tufte-code",
    "legacyLessonId": "l15-bi-tufte-code",
    "moduleId": "bi3-dashboards",
    "track": "bi",
    "front": "Según la jerarquía de Cleveland y McGill, ¿por qué un gráfico de barras horizontales supera a un gráfico de pastel para comparar 8 categorías?",
    "back": "Porque la posición a lo largo de una escala común se juzga con mucha menor tasa de error perceptual que los ángulos o las áreas.",
    "tags": [
      "bi3-dashboards",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-viz-02",
    "lessonId": "bi3-dashboards-01-bi-tufte-code",
    "legacyLessonId": "l15-bi-tufte-code",
    "moduleId": "bi3-dashboards",
    "track": "bi",
    "front": "¿Qué propone la regla del uso intencional del color en un tablero operativo?",
    "back": "Mantener el 90 % de las series contextuales en tonos neutros y reservar el color de acento o semántico solo para las anomalías o metas incumplidas.",
    "tags": [
      "bi3-dashboards",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-viz-03",
    "lessonId": "bi3-dashboards-01-bi-tufte-code",
    "legacyLessonId": "l15-bi-tufte-code",
    "moduleId": "bi3-dashboards",
    "track": "bi",
    "front": "¿Qué es un título activo (Action Title) en la parte superior de un gráfico ejecutivo?",
    "back": "Un encabezado que enuncia el hallazgo cuantitativo (\"El margen cayó 180 pb en Norte por costo de flete\") en vez de describir los ejes (\"Margen por región\").",
    "tags": [
      "bi3-dashboards",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de4-cdc-01",
    "lessonId": "de4-streaming-01-cdc-kafka-streaming",
    "legacyLessonId": "l16-cdc-kafka-streaming",
    "moduleId": "de4-streaming",
    "track": "de",
    "front": "¿Cuáles son las dos fallas técnicas del polling por `WHERE updated_at > ...` frente al CDC basado en el WAL?",
    "back": "1) Impone carga de lectura repetida sobre el motor OLTP y 2) no detecta filas eliminadas con DELETE físico (no dejan updated_at).",
    "tags": [
      "de4-streaming",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de4-cdc-02",
    "lessonId": "de4-streaming-01-cdc-kafka-streaming",
    "legacyLessonId": "l16-cdc-kafka-streaming",
    "moduleId": "de4-streaming",
    "track": "de",
    "front": "¿Qué resuelve el patrón Transactional Outbox en un microservicio?",
    "back": "Evita la escritura doble inconsistente (guardar en Postgres y publicar en Kafka por separado); escribe ambos en la misma transacción de base de datos y CDC publica la tabla outbox.",
    "tags": [
      "de4-streaming",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de4-cdc-03",
    "lessonId": "de4-streaming-01-cdc-kafka-streaming",
    "legacyLessonId": "l16-cdc-kafka-streaming",
    "moduleId": "de4-streaming",
    "track": "de",
    "front": "¿Qué representan los códigos `op` = `c`, `u`, `d`, `r` en un mensaje de Debezium?",
    "back": "c = create (INSERT), u = update (UPDATE con before y after), d = delete (DELETE con los datos previos en before), r = read (snapshot inicial).",
    "tags": [
      "de4-streaming",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de4-flk-01",
    "lessonId": "de4-streaming-03-flink-watermarks-mv",
    "legacyLessonId": "l17-flink-watermarks-mv",
    "moduleId": "de4-streaming",
    "track": "de",
    "front": "¿Cómo calcula Flink el watermark de un operador que consume de 16 particiones de Kafka en paralelo?",
    "back": "Toma el MÍNIMO de los watermarks de las 16 particiones de entrada, porque el reloj global solo puede avanzar al ritmo de la fuente más atrasada.",
    "tags": [
      "de4-streaming",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de4-flk-02",
    "lessonId": "de4-streaming-03-flink-watermarks-mv",
    "legacyLessonId": "l17-flink-watermarks-mv",
    "moduleId": "de4-streaming",
    "track": "de",
    "front": "¿Por qué un `LEFT JOIN` estándar sin ventana temporal en Flink termina agotando el disco de estado (RocksDB)?",
    "back": "Porque para saber si algún día futuro llegará una pareja para una fila izquierda, Flink tendría que conservar todas las filas en estado para siempre.",
    "tags": [
      "de4-streaming",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de4-flk-03",
    "lessonId": "de4-streaming-03-flink-watermarks-mv",
    "legacyLessonId": "l17-flink-watermarks-mv",
    "moduleId": "de4-streaming",
    "track": "de",
    "front": "¿Qué ocurre con un evento cuyo timestamp es anterior al watermark actual cuando ya expiró también el `allowedLateness`?",
    "back": "No se descarta en silencio si configuras un Side Output (salida lateral): se envía a un flujo separado para conciliación o alerta.",
    "tags": [
      "de4-streaming",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-x4-mcp-01",
    "lessonId": "x4-ia-datos-01-mcp-semantic-ai-rag",
    "legacyLessonId": "l18-mcp-semantic-ai-rag",
    "moduleId": "x4-ia-datos",
    "track": "core",
    "front": "¿Por qué es más fiable que un agente invoque `query_semantic_layer(metrics, dimensions)` en vez de generar SQL libre sobre tablas crudas?",
    "back": "Porque el motor semántico ya tiene codificadas las fórmulas auditadas, los filtros de exclusión y las pre-agregaciones contra fan-out.",
    "tags": [
      "x4-ia-datos",
      "core"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-x4-mcp-02",
    "lessonId": "x4-ia-datos-01-mcp-semantic-ai-rag",
    "legacyLessonId": "l18-mcp-semantic-ai-rag",
    "moduleId": "x4-ia-datos",
    "track": "core",
    "front": "¿Por qué la búsqueda híbrida (BM25 + Embeddings con RRF) supera a la búsqueda vectorial pura al buscar metadatos de tablas?",
    "back": "Porque los embeddings capturan sinónimos conceptuales, pero BM25 es exacto para identificadores técnicos literales como `sku_id_v2` o códigos de error.",
    "tags": [
      "x4-ia-datos",
      "core"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-x4-mcp-03",
    "lessonId": "x4-ia-datos-01-mcp-semantic-ai-rag",
    "legacyLessonId": "l18-mcp-semantic-ai-rag",
    "moduleId": "x4-ia-datos",
    "track": "core",
    "front": "¿Por qué una instrucción en el prompt del sistema (\"No leas la tabla de salarios\") NO es un control de seguridad válido?",
    "back": "Porque es vulnerable a inyección de prompts; la seguridad real exige credenciales de base de datos de solo lectura, RLS y vistas restringidas en el servidor.",
    "tags": [
      "x4-ia-datos",
      "core"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-c2-dim-02-01",
    "lessonId": "c2-dimensional-02-star-schema-obt",
    "legacyLessonId": "l4-star-schema-obt",
    "moduleId": "c2-dimensional",
    "track": "core",
    "front": "¿Qué diferencia a un esquema en estrella de un esquema en copo de nieve (Snowflake)?",
    "back": "En el esquema en estrella cada dimensión es una sola tabla plana desnormalizada; en el copo de nieve las jerarquías de la dimensión se separan en subtablas normalizadas en 3FN.",
    "tags": [
      "c2-dimensional",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-dim-02-02",
    "lessonId": "c2-dimensional-02-star-schema-obt",
    "legacyLessonId": "l4-star-schema-obt",
    "moduleId": "c2-dimensional",
    "track": "core",
    "front": "¿Por qué los archivos Parquet comprimen tan bien las columnas de texto repetidas en una OBT?",
    "back": "Porque emplean codificación por diccionario (sustituyendo textos por enteros) y Run-Length Encoding (RLE) sobre secuencias de valores idénticos.",
    "tags": [
      "c2-dimensional",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-dim-02-03",
    "lessonId": "c2-dimensional-02-star-schema-obt",
    "legacyLessonId": "l4-star-schema-obt",
    "moduleId": "c2-dimensional",
    "track": "core",
    "front": "¿Qué ocurre si sumas `o.shipping_usd` o `o.total_usd` directamente en una OBT construida a grano de `order_items`?",
    "back": "El importe de cabecera se repite en cada línea del pedido y su suma se infla proporcionalmente al número de artículos por orden.",
    "tags": [
      "c2-dimensional",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-dim-02-04",
    "lessonId": "c2-dimensional-02-star-schema-obt",
    "legacyLessonId": "l4-star-schema-obt",
    "moduleId": "c2-dimensional",
    "track": "core",
    "front": "¿Cuál es el patrón híbrido recomendado entre esquema en estrella y OBT?",
    "back": "Gobernar y versionar las entidades maestras y hechos en un esquema en estrella central, y derivar tablas anchas (OBT) solo en la frontera de consumo.",
    "tags": [
      "c2-dimensional",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-dim-03-01",
    "lessonId": "c2-dimensional-03-scd2-history",
    "legacyLessonId": "l5-scd2-history",
    "moduleId": "c2-dimensional",
    "track": "core",
    "front": "¿Qué diferencia a un reporte As-Is (SCD Tipo 1) de un reporte As-Was (SCD Tipo 2)?",
    "back": "As-Is agrupa todos los hechos históricos según el valor actual del atributo; As-Was agrupa cada hecho según el valor exacto que tenía la dimensión en el instante en que ocurrió el evento.",
    "tags": [
      "c2-dimensional",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-dim-03-02",
    "lessonId": "c2-dimensional-03-scd2-history",
    "legacyLessonId": "l5-scd2-history",
    "moduleId": "c2-dimensional",
    "track": "core",
    "front": "¿Por qué un cruce Point-in-Time usa `>= valid_from` y `< valid_to` en lugar de `BETWEEN`?",
    "back": "Porque el intervalo semiabierto `[valid_from, valid_to)` impide que un evento ocurrido en el segundo exacto del cambio coincida con dos versiones a la vez.",
    "tags": [
      "c2-dimensional",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-dim-03-03",
    "lessonId": "c2-dimensional-03-scd2-history",
    "legacyLessonId": "l5-scd2-history",
    "moduleId": "c2-dimensional",
    "track": "core",
    "front": "¿Qué ocurre si olvidas la condición `OR cc.valid_to IS NULL` al unir `orders` con `customer_changes`?",
    "back": "Se descartan o quedan sin atributo todas las órdenes ocurridas durante la versión vigente actual de cada cliente.",
    "tags": [
      "c2-dimensional",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-dim-03-04",
    "lessonId": "c2-dimensional-03-scd2-history",
    "legacyLessonId": "l5-scd2-history",
    "moduleId": "c2-dimensional",
    "track": "core",
    "front": "En Mercado Brisa, ¿cuál es el impacto de usar `customers.current_tier` en lugar de `customer_changes` sobre las órdenes completadas?",
    "back": "El nivel `bronce` pierde `$628,099.05` de ingresos históricos porque las compras iniciales de clientes que luego ascendieron se reasignan a `oro`, `plata` y `platino`.",
    "tags": [
      "c2-dimensional",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-dim-04-01",
    "lessonId": "c2-dimensional-04-metrics-simpson",
    "legacyLessonId": "l6-metrics-simpson",
    "moduleId": "c2-dimensional",
    "track": "core",
    "front": "¿Cuál es la diferencia entre un hecho aditivo, semiaditivo y no aditivo?",
    "back": "Aditivo se suma en todas las dimensiones (`total_usd`); semiaditivo se suma entre entidades pero no en el tiempo (saldos); no aditivo no puede sumarse en ninguna dimensión (`CPA`, `COUNT DISTINCT`).",
    "tags": [
      "c2-dimensional",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-dim-04-02",
    "lessonId": "c2-dimensional-04-metrics-simpson",
    "legacyLessonId": "l6-metrics-simpson",
    "moduleId": "c2-dimensional",
    "track": "core",
    "front": "¿Por qué es un error calcular `AVG(spend_usd / attributed_conversions)` para obtener el CPA de un canal?",
    "back": "Porque otorga el mismo peso a días con volumen mínimo que a días de alto tráfico; la fórmula correcta es `SUM(spend_usd) / NULLIF(SUM(attributed_conversions), 0)`.",
    "tags": [
      "c2-dimensional",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-dim-04-03",
    "lessonId": "c2-dimensional-04-metrics-simpson",
    "legacyLessonId": "l6-metrics-simpson",
    "moduleId": "c2-dimensional",
    "track": "core",
    "front": "¿Qué es la paradoja de Simpson en analítica de negocios?",
    "back": "Es el fenómeno estadístico en el que una tendencia presente en cada segmento individual se invierte o desaparece al agregar los datos por efecto de una variable de confusión.",
    "tags": [
      "c2-dimensional",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-dim-04-04",
    "lessonId": "c2-dimensional-04-metrics-simpson",
    "legacyLessonId": "l6-metrics-simpson",
    "moduleId": "c2-dimensional",
    "track": "core",
    "front": "¿Qué dos componentes separa la descomposición de Kitagawa-Oaxaca?",
    "back": "Separa la diferencia global entre dos tasas o promedios en el efecto tasa (cambio de rendimiento dentro de cada estrato) y el efecto mezcla (cambio en la proporción de volumen entre estratos).",
    "tags": [
      "c2-dimensional",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-01-a",
    "lessonId": "de2-formatos-01-columnar-parquet",
    "legacyLessonId": "l7-columnar-parquet",
    "moduleId": "de2-formatos",
    "track": "de",
    "front": "¿Por qué un lector Parquet abre siempre los últimos bytes del archivo (el Footer) antes de leer los datos?",
    "back": "Porque el Footer contiene el FileMetaData con el esquema, los desplazamientos en bytes de cada Column Chunk y las estadísticas min/max (zone maps).",
    "tags": [
      "de2-formatos",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-01-b",
    "lessonId": "de2-formatos-01-columnar-parquet",
    "legacyLessonId": "l7-columnar-parquet",
    "moduleId": "de2-formatos",
    "track": "de",
    "front": "¿Qué diferencia operativa hay entre un zone map y un Split Block Bloom Filter en Parquet?",
    "back": "El zone map guarda el rango [min, max] y sirve para columnas ordenadas o rangos; el filtro de Bloom usa hashes xxHash64 para igualdades en alta cardinalidad no ordenada.",
    "tags": [
      "de2-formatos",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-01-c",
    "lessonId": "de2-formatos-01-columnar-parquet",
    "legacyLessonId": "l7-columnar-parquet",
    "moduleId": "de2-formatos",
    "track": "de",
    "front": "¿Por qué un filtro como `WHERE strftime(order_date, '%Y-%m') = '2025-10'` impide podar Row Groups?",
    "back": "Porque transforma cada fila antes de comparar (no es SARGable); escribir `order_date >= DATE '2025-10-01' AND order_date < DATE '2025-11-01'` sí aprovecha los zone maps.",
    "tags": [
      "de2-formatos",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-02-a",
    "lessonId": "de2-formatos-02-arrow-lance-vortex",
    "legacyLessonId": "l8-arrow-lance-vortex",
    "moduleId": "de2-formatos",
    "track": "de",
    "front": "¿Cuántos bytes ocupa el mapa de bits de validez (validity bitmap) de Apache Arrow para una columna de 65 000 filas?",
    "back": "Ocupa exactamente 8 125 bytes (65 000 / 8 bits), usando 1 bit por fila para indicar si el valor es válido (1) o NULL (0).",
    "tags": [
      "de2-formatos",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-02-b",
    "lessonId": "de2-formatos-02-arrow-lance-vortex",
    "legacyLessonId": "l8-arrow-lance-vortex",
    "moduleId": "de2-formatos",
    "track": "de",
    "front": "¿En qué consiste la materialización tardía (late materialization) al consultar archivos columnares?",
    "back": "En evaluar primero los predicados WHERE sobre columnas escalares angostas y leer o reconstruir las columnas anchas solo en las filas que sobrevivieron al filtro.",
    "tags": [
      "de2-formatos",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-02-c",
    "lessonId": "de2-formatos-02-arrow-lance-vortex",
    "legacyLessonId": "l8-arrow-lance-vortex",
    "moduleId": "de2-formatos",
    "track": "de",
    "front": "¿Qué ventaja clave aportan Lance y Vortex frente a Parquet en cargas de aprendizaje automático y búsqueda vectorial?",
    "back": "Permiten acceso aleatorio puntual O(1) en microsegundos y evaluación de operaciones sobre vectores comprimidos sin descomprimir Data Pages enteras.",
    "tags": [
      "de2-formatos",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-03-a",
    "lessonId": "de2-formatos-03-duckdb-polars-marimo",
    "legacyLessonId": "l9-duckdb-polars-marimo",
    "moduleId": "de2-formatos",
    "track": "de",
    "front": "¿Por qué el tamaño de DataChunk en DuckDB es de 2 048 tuplas?",
    "back": "Porque ese volumen cabe dentro de las cachés rápidas L1 y L2 de la CPU, permitiendo procesar bucles vectorizados SIMD sin esperar a la memoria RAM principal.",
    "tags": [
      "de2-formatos",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-03-b",
    "lessonId": "de2-formatos-03-duckdb-polars-marimo",
    "legacyLessonId": "l9-duckdb-polars-marimo",
    "moduleId": "de2-formatos",
    "track": "de",
    "front": "¿Qué diferencia de ejecución hay entre `pl.read_parquet()` y `pl.scan_parquet()` en Polars?",
    "back": "`read_parquet()` lee y materializa el archivo de inmediato en RAM; `scan_parquet()` devuelve un LazyFrame que optimiza proyecciones y filtros antes de ejecutar `.collect()`.",
    "tags": [
      "de2-formatos",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-03-c",
    "lessonId": "de2-formatos-03-duckdb-polars-marimo",
    "legacyLessonId": "l9-duckdb-polars-marimo",
    "moduleId": "de2-formatos",
    "track": "de",
    "front": "¿Cómo impide Marimo el problema de estado oculto típico de Jupyter?",
    "back": "Construye un DAG estático de referencias entre celdas, prohíbe redefinir una misma variable global en dos celdas y reejecuta en orden topológico las celdas dependientes.",
    "tags": [
      "de2-formatos",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-1",
    "lessonId": "de3-lakehouse-01-iceberg-v3-medallion",
    "legacyLessonId": "l10-iceberg-v3-medallion",
    "moduleId": "de3-lakehouse",
    "track": "de",
    "front": "¿Qué estructura almacena un Deletion Vector en Apache Iceberg v3 y cuál es su invariante por archivo de datos?",
    "back": "Almacena un bitmap Roaring de 64 bits dentro de un archivo Puffin y garantiza que exista a lo sumo un Deletion Vector activo por archivo Parquet.",
    "tags": [
      "de3-lakehouse",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-2",
    "lessonId": "de3-lakehouse-01-iceberg-v3-medallion",
    "legacyLessonId": "l10-iceberg-v3-medallion",
    "moduleId": "de3-lakehouse",
    "track": "de",
    "front": "¿Qué diferencia existe entre una manifest list y un manifest file en Apache Iceberg?",
    "back": "La manifest list indexa una instantánea completa con rangos de partición por manifiesto, mientras el manifest file lista archivos Parquet individuales y sus estadísticas min/max por columna.",
    "tags": [
      "de3-lakehouse",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-3",
    "lessonId": "de3-lakehouse-01-iceberg-v3-medallion",
    "legacyLessonId": "l10-iceberg-v3-medallion",
    "moduleId": "de3-lakehouse",
    "track": "de",
    "front": "¿En qué consiste el particionado oculto (hidden partitioning) de Iceberg?",
    "back": "En almacenar la función de partición (como month o bucket) en metadata.json para que el motor derive el filtro de partición directamente desde la columna base.",
    "tags": [
      "de3-lakehouse",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-4",
    "lessonId": "de3-lakehouse-01-iceberg-v3-medallion",
    "legacyLessonId": "l10-iceberg-v3-medallion",
    "moduleId": "de3-lakehouse",
    "track": "de",
    "front": "¿Cuáles son las tres etapas del patrón Write-Audit-Publish (WAP)?",
    "back": "Escribir los datos en una rama aislada (audit_branch), ejecutar pruebas de calidad sobre esa rama y promover el puntero main (fast-forward) si pasan.",
    "tags": [
      "de3-lakehouse",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de3-t01-01",
    "lessonId": "de3-transformacion-01-dbt-sqlmesh-dag",
    "legacyLessonId": "l11-dbt-sqlmesh-dag",
    "moduleId": "de3-transformacion",
    "track": "de",
    "front": "¿Por qué un modelo incremental con estrategia APPEND y filtro `ts > MAX(ts)` no es idempotente ni tolerante a eventos tardíos?",
    "back": "Porque reejecutar el lote duplica filas al no verificar claves únicas, y cualquier evento que llegue con retraso tiene un timestamp menor al máximo y se ignora.",
    "tags": [
      "de3-transformacion",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de3-t01-02",
    "lessonId": "de3-transformacion-01-dbt-sqlmesh-dag",
    "legacyLessonId": "l11-dbt-sqlmesh-dag",
    "moduleId": "de3-transformacion",
    "track": "de",
    "front": "¿Qué contiene el archivo `manifest.json` en dbt y cómo habilita despliegues eficientes en CI/CD?",
    "back": "Contiene la representación completa del proyecto (nodos, código compilado, tests y linaje); permite comparar estados (`state:modified+`) para ejecutar solo los modelos alterados y sus descendientes.",
    "tags": [
      "de3-transformacion",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de3-t01-03",
    "lessonId": "de3-transformacion-01-dbt-sqlmesh-dag",
    "legacyLessonId": "l11-dbt-sqlmesh-dag",
    "moduleId": "de3-transformacion",
    "track": "de",
    "front": "¿Cómo evita SQLMesh reconstruir las tablas físicas al promover un entorno `dev` a `prod`?",
    "back": "Guarda los datos en tablas físicas nombradas según el hash semántico de su AST SQL y en producción solo actualiza la vista (`CREATE OR REPLACE VIEW`) hacia dicha tabla.",
    "tags": [
      "de3-transformacion",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de3-t01-04",
    "lessonId": "de3-transformacion-01-dbt-sqlmesh-dag",
    "legacyLessonId": "l11-dbt-sqlmesh-dag",
    "moduleId": "de3-transformacion",
    "track": "de",
    "front": "En Mercado Brisa, ¿por qué debemos ordenar por `payment_ts DESC, payment_id DESC` dentro de `ROW_NUMBER()` al deduplicar pagos?",
    "back": "Porque dos reintentos pueden compartir el mismo segundo en `payment_ts`; añadir `payment_id DESC` como desempate hace que la elección de la fila ganadora sea 100 % determinista.",
    "tags": [
      "de3-transformacion",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de3-t03-01",
    "lessonId": "de3-transformacion-03-contracts-semantic-layer",
    "legacyLessonId": "l12-contracts-semantic-layer",
    "moduleId": "de3-transformacion",
    "track": "de",
    "front": "¿En qué se diferencia `contract: { enforced: true }` de un test `not_null` convencional en dbt?",
    "back": "El contrato valida tipos de datos exactos, nombres de columna y restricciones `NOT NULL` en tiempo de compilación y DDL antes de publicar la tabla, mientras que el test convencional consulta la tabla después de creada.",
    "tags": [
      "de3-transformacion",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de3-t03-02",
    "lessonId": "de3-transformacion-03-contracts-semantic-layer",
    "legacyLessonId": "l12-contracts-semantic-layer",
    "moduleId": "de3-transformacion",
    "track": "de",
    "front": "¿Qué elementos estandariza la especificación Open Data Contract Standard (ODCS v3) de Bitol?",
    "back": "Estandariza en formato YAML declarativo el esquema físico, las reglas de calidad de datos, los niveles de servicio (SLA de frescura y disponibilidad) y la propiedad del activo.",
    "tags": [
      "de3-transformacion",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de3-t03-03",
    "lessonId": "de3-transformacion-03-contracts-semantic-layer",
    "legacyLessonId": "l12-contracts-semantic-layer",
    "moduleId": "de3-transformacion",
    "track": "de",
    "front": "¿Cuándo se considera que un cambio en un modelo contratado es destructivo (*breaking change*)?",
    "back": "Cuando se elimina o renombra una columna existente, se cambia su tipo de dato físico o se altera la semántica de su grano, obligando a emitir una nueva versión mayor (`v2`).",
    "tags": [
      "de3-transformacion",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de3-t03-04",
    "lessonId": "de3-transformacion-03-contracts-semantic-layer",
    "legacyLessonId": "l12-contracts-semantic-layer",
    "moduleId": "de3-transformacion",
    "track": "de",
    "front": "¿Por qué una métrica de razón como `net_arpu_usd` o `net_retention_pct` debe declararse en la capa semántica como cociente de agregaciones?",
    "back": "Porque los ratios no son aditivos: promediar porcentajes o tickets individuales sesga el resultado; siempre debe calcularse `SUM(numerador) / NULLIF(SUM_o_COUNT_DISTINCT(denominador), 0)` al nivel de agrupación consultado.",
    "tags": [
      "de3-transformacion",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da3-prod-02-01",
    "lessonId": "da3-producto-02-cohorts-retention-ltv",
    "legacyLessonId": "l13-cohorts-retention-ltv",
    "moduleId": "da3-producto",
    "track": "da",
    "front": "¿Qué es la censura por la derecha en una matriz de cohortes y cómo se representa en SQL?",
    "back": "Es la falta de observación de periodos futuros cuando la edad de la cohorte supera la fecha de corte de los datos; se representa con NULL para no sesgar los promedios.",
    "tags": [
      "da3-producto",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da3-prod-02-02",
    "lessonId": "da3-producto-02-cohorts-retention-ltv",
    "legacyLessonId": "l13-cohorts-retention-ltv",
    "moduleId": "da3-producto",
    "track": "da",
    "front": "¿Por qué no debes unir orders directamente con order_items y refunds al calcular el LTV?",
    "back": "Porque ambas tablas tienen relación 1:N con orders y provocan un fan-out multiplicativo que infla SUM(orders.total_usd).",
    "tags": [
      "da3-producto",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da3-prod-02-03",
    "lessonId": "da3-producto-02-cohorts-retention-ltv",
    "legacyLessonId": "l13-cohorts-retention-ltv",
    "moduleId": "da3-producto",
    "track": "da",
    "front": "¿Cómo puede una cohorte tener un 60 % de retención de clientes pero superar el 100 % de retención neta de ingresos (NRR)?",
    "back": "Cuando la expansión de gasto de los clientes que permanecen activos supera los ingresos perdidos por los clientes que abandonaron.",
    "tags": [
      "da3-producto",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "f1",
    "lessonId": "da3-experimentos-01-ab-testing-cuped",
    "legacyLessonId": "l14-ab-testing-cuped",
    "moduleId": "da3-experimentos",
    "track": "da",
    "front": "¿Cuándo se declara alerta de Sample Ratio Mismatch (SRM) en un diseño 50/50?",
    "back": "Cuando el estadístico chi-cuadrado de bondad de ajuste supera el umbral crítico (por ejemplo chi2 > 10.83 para p < 0.001), indicando pérdida selectiva o fallo de asignación.",
    "tags": [
      "da3-experimentos",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "f2",
    "lessonId": "da3-experimentos-01-ab-testing-cuped",
    "legacyLessonId": "l14-ab-testing-cuped",
    "moduleId": "da3-experimentos",
    "track": "da",
    "front": "¿Cuál es la fórmula de la métrica ajustada por usuario en CUPED?",
    "back": "Y_CUPED = Y - theta * (X - media_X), donde theta = Cov(Y, X) / Var(X) se estima sobre la muestra combinada del experimento.",
    "tags": [
      "da3-experimentos",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "f3",
    "lessonId": "da3-experimentos-01-ab-testing-cuped",
    "legacyLessonId": "l14-ab-testing-cuped",
    "moduleId": "da3-experimentos",
    "track": "da",
    "front": "¿Por qué una covariable post-asignación invalida el ajuste CUPED?",
    "back": "Porque si el tratamiento afecta a X, la diferencia esperada E[X_T - X_C] deja de ser cero y restar theta*(X - media_X) absorbe parte del efecto causal verdadero.",
    "tags": [
      "da3-experimentos",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "f4",
    "lessonId": "da3-experimentos-01-ab-testing-cuped",
    "legacyLessonId": "l14-ab-testing-cuped",
    "moduleId": "da3-experimentos",
    "track": "da",
    "front": "¿A cuántos usuarios de un análisis crudo equivale una muestra de 1,600 usuarios cuando r_XY = 0.9678?",
    "back": "Como la varianza cae en (1 - r^2) = 0.0634, la precisión equivale a multiplicar el tamaño muestral efectivo por 1 / 0.0634 ≈ 15.8 veces (unos 25,200 usuarios).",
    "tags": [
      "da3-experimentos",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-01-1",
    "lessonId": "bi3-dashboards-01-bi-tufte-code",
    "legacyLessonId": "l15-bi-tufte-code",
    "moduleId": "bi3-dashboards",
    "track": "bi",
    "front": "¿Qué mide la razón dato-tinta (data-ink ratio) de Edward Tufte y cuál es su límite práctico?",
    "back": "Mide la fracción de tinta del gráfico dedicada a datos no redundantes. Su límite práctico es no borrar nunca los ejes, unidades ni referencias necesarias para interpretar la escala.",
    "tags": [
      "bi3-dashboards",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-01-2",
    "lessonId": "bi3-dashboards-01-bi-tufte-code",
    "legacyLessonId": "l15-bi-tufte-code",
    "moduleId": "bi3-dashboards",
    "track": "bi",
    "front": "¿Cuáles son los 5 componentes de un gráfico de bala (bullet graph) según Stephen Few?",
    "back": "Etiqueta de texto, escala cuantitativa lineal, barra central de medida principal, marcador perpendicular de comparación (meta) y bandas cualitativas de fondo.",
    "tags": [
      "bi3-dashboards",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-01-3",
    "lessonId": "bi3-dashboards-01-bi-tufte-code",
    "legacyLessonId": "l15-bi-tufte-code",
    "moduleId": "bi3-dashboards",
    "track": "bi",
    "front": "¿Qué diferencia a un título de acción (IBCS / Minto) de un título descriptivo?",
    "back": "El título descriptivo solo nombra las variables (\"Ventas por región\"), mientras el título de acción enuncia la conclusión cuantificada (\"Cono Sur lidera el cumplimiento con 45,6 % en 2024\").",
    "tags": [
      "bi3-dashboards",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-01-4",
    "lessonId": "bi3-dashboards-01-bi-tufte-code",
    "legacyLessonId": "l15-bi-tufte-code",
    "moduleId": "bi3-dashboards",
    "track": "bi",
    "front": "¿Por qué debe calcularse la meta anual de stores en una CTE separada antes de unirla con orders?",
    "back": "Porque stores tiene grano de tienda y orders tiene grano de pedido; unir primero y sumar después multiplica la meta de cada tienda por su número de pedidos (fan-out).",
    "tags": [
      "bi3-dashboards",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de4-01-wal",
    "lessonId": "de4-streaming-01-cdc-kafka-streaming",
    "legacyLessonId": "l16-cdc-kafka-streaming",
    "moduleId": "de4-streaming",
    "track": "de",
    "front": "¿Por qué el CDC por consulta (SELECT ... WHERE updated_at > X) pierde eliminaciones físicas?",
    "back": "Porque una sentencia DELETE elimina la fila de la tabla antes del siguiente barrido; en cambio, esa eliminación sí queda registrada como evento en el WAL.",
    "tags": [
      "de4-streaming",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de4-01-slot",
    "lessonId": "de4-streaming-01-cdc-kafka-streaming",
    "legacyLessonId": "l16-cdc-kafka-streaming",
    "moduleId": "de4-streaming",
    "track": "de",
    "front": "¿Qué riesgo operativo implica un replication slot de PostgreSQL cuyo conector Debezium queda detenido?",
    "back": "PostgreSQL retiene todos los segmentos WAL desde el último LSN confirmado por el slot; sin max_slot_wal_keep_size, el disco del servidor primario puede llenarse por completo.",
    "tags": [
      "de4-streaming",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de4-01-outbox",
    "lessonId": "de4-streaming-01-cdc-kafka-streaming",
    "legacyLessonId": "l16-cdc-kafka-streaming",
    "moduleId": "de4-streaming",
    "track": "de",
    "front": "¿En qué consiste el patrón Transactional Outbox?",
    "back": "En insertar el evento de dominio en una tabla outbox dentro de la misma transacción ACID local que modifica la entidad de negocio, para que Debezium lo publique en Kafka desde el WAL.",
    "tags": [
      "de4-streaming",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de4-01-tombstone",
    "lessonId": "de4-streaming-01-cdc-kafka-streaming",
    "legacyLessonId": "l16-cdc-kafka-streaming",
    "moduleId": "de4-streaming",
    "track": "de",
    "front": "¿Qué es un mensaje tombstone en Kafka y por qué lo emite Debezium tras un evento op = \"d\"?",
    "back": "Es un mensaje con la clave primaria del registro eliminado y payload nulo (value = null) que permite al compactador de Kafka borrar definitivamente esa clave.",
    "tags": [
      "de4-streaming",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de4-03-event-vs-proc",
    "lessonId": "de4-streaming-03-flink-watermarks-mv",
    "legacyLessonId": "l17-flink-watermarks-mv",
    "moduleId": "de4-streaming",
    "track": "de",
    "front": "¿Por qué Processing Time produce conteos incorrectos cuando se reprocesa un incidente de red ocurrido horas atrás?",
    "back": "Porque agrupa los eventos según el reloj actual del servidor que los lee, mezclando horas históricas distintas en la ventana del momento de ejecución.",
    "tags": [
      "de4-streaming",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de4-03-min-watermark",
    "lessonId": "de4-streaming-03-flink-watermarks-mv",
    "legacyLessonId": "l17-flink-watermarks-mv",
    "moduleId": "de4-streaming",
    "track": "de",
    "front": "¿Cómo calcula un operador de Apache Flink su watermark cuando recibe datos de múltiples particiones o canales de entrada?",
    "back": "Toma el valor mínimo entre los watermarks de todos los canales de entrada activos: W_op = min(W_1, W_2, ..., W_k).",
    "tags": [
      "de4-streaming",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de4-03-idleness",
    "lessonId": "de4-streaming-03-flink-watermarks-mv",
    "legacyLessonId": "l17-flink-watermarks-mv",
    "moduleId": "de4-streaming",
    "track": "de",
    "front": "¿Qué problema resuelve el método .withIdleness() en la estrategia de watermarks de Flink?",
    "back": "Evita que una partición que deja de recibir eventos congele el mínimo global de watermarks, marcándola temporalmente como inactiva tras superar el umbral configurado.",
    "tags": [
      "de4-streaming",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de4-03-interval-vs-regular",
    "lessonId": "de4-streaming-03-flink-watermarks-mv",
    "legacyLessonId": "l17-flink-watermarks-mv",
    "moduleId": "de4-streaming",
    "track": "de",
    "front": "¿Qué diferencia de uso de memoria en RocksDB existe entre un Regular Join y un Interval Join en Flink SQL?",
    "back": "El Regular Join retiene todos los registros de ambos flujos de forma indefinida (salvo que se configure TTL), mientras que el Interval Join purga automáticamente los registros en cuanto el watermark supera el límite superior del intervalo.",
    "tags": [
      "de4-streaming",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-x4-01-1",
    "lessonId": "x4-ia-datos-01-mcp-semantic-ai-rag",
    "legacyLessonId": "l18-mcp-semantic-ai-rag",
    "moduleId": "x4-ia-datos",
    "track": "core",
    "front": "¿Por qué un agente Text-to-SQL directo sobreestima el GMV capturado en Mercado Brisa en 168,674.63 USD?",
    "back": "Porque suma directamente las 16,605 filas de payments con status captured sin deduplicar los 405 reintentos de webhook sobre las 16,200 órdenes pagadas.",
    "tags": [
      "x4-ia-datos",
      "core"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-x4-01-2",
    "lessonId": "x4-ia-datos-01-mcp-semantic-ai-rag",
    "legacyLessonId": "l18-mcp-semantic-ai-rag",
    "moduleId": "x4-ia-datos",
    "track": "core",
    "front": "¿Cuál es la diferencia operativa entre un resource y una tool en un servidor MCP?",
    "back": "Un resource expone metadatos o esquemas de solo lectura identificados por URI sin efectos secundarios; una tool ejecuta una función parametrizada y validada por JSON Schema.",
    "tags": [
      "x4-ia-datos",
      "core"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-x4-01-3",
    "lessonId": "x4-ia-datos-01-mcp-semantic-ai-rag",
    "legacyLessonId": "l18-mcp-semantic-ai-rag",
    "moduleId": "x4-ia-datos",
    "track": "core",
    "front": "¿Qué componentes integran la topología tripartita del Model Context Protocol?",
    "back": "El Host (aplicación de usuario), el Client (conector de protocolo dentro del host) y el Server (proceso que gobierna el acceso a datos y herramientas).",
    "tags": [
      "x4-ia-datos",
      "core"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-x4-01-4",
    "lessonId": "x4-ia-datos-01-mcp-semantic-ai-rag",
    "legacyLessonId": "l18-mcp-semantic-ai-rag",
    "moduleId": "x4-ia-datos",
    "track": "core",
    "front": "¿Por qué debe usarse COUNT(DISTINCT o.order_id) al calcular métricas de órdenes sobre order_items?",
    "back": "Porque order_items tiene grano de línea de pedido (1:N respecto a orders), y usar COUNT(*) contaría líneas de artículos en lugar de órdenes únicas.",
    "tags": [
      "x4-ia-datos",
      "core"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-c0-datos-01-a",
    "lessonId": "c0-datos-01-tipos-dato",
    "moduleId": "c0-datos",
    "track": "core",
    "front": "¿Por qué no debes usar DOUBLE o FLOAT para sumar importes de dinero?",
    "back": "Porque representan los números en binario (IEEE 754), donde fracciones como 0.1 o 0.2 son inexactas y acumulan errores de centavos. Para dinero se usa DECIMAL(p, s).",
    "tags": [
      "c0-datos",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-datos-01-b",
    "lessonId": "c0-datos-01-tipos-dato",
    "moduleId": "c0-datos",
    "track": "core",
    "front": "¿Qué ocurre si ordenas de menor a mayor los valores \"100\", \"20\" y \"3\" en una columna VARCHAR?",
    "back": "Se ordenan carácter por carácter como en un diccionario: \"100\", luego \"20\" y al final \"3\".",
    "tags": [
      "c0-datos",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-datos-01-c",
    "lessonId": "c0-datos-01-tipos-dato",
    "moduleId": "c0-datos",
    "track": "core",
    "front": "¿Por qué el formato de fecha ISO 8601 (YYYY-MM-DD) es el estándar en bases de datos?",
    "back": "Porque va de la unidad mayor (año) a la menor (día), evita confundir día con mes y su orden alfabético coincide con el cronológico.",
    "tags": [
      "c0-datos",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-datos-02-a",
    "lessonId": "c0-datos-02-null-vacio",
    "moduleId": "c0-datos",
    "track": "core",
    "front": "¿Por qué `WHERE postal_code = NULL` devuelve siempre 0 filas aunque existan nulos?",
    "back": "Porque en la lógica de tres valores de SQL cualquier comparación con `=` frente a `NULL` evalúa a `UNKNOWN`, y `WHERE` solo conserva filas con resultado `TRUE`.",
    "tags": [
      "c0-datos",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-datos-02-b",
    "lessonId": "c0-datos-02-null-vacio",
    "moduleId": "c0-datos",
    "track": "core",
    "front": "¿Cuál es la diferencia entre `COUNT(*)` y `COUNT(postal_code)`?",
    "back": "`COUNT(*)` cuenta todas las filas de la tabla; `COUNT(postal_code)` cuenta únicamente las filas donde `postal_code` no es `NULL`.",
    "tags": [
      "c0-datos",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-datos-02-c",
    "lessonId": "c0-datos-02-null-vacio",
    "moduleId": "c0-datos",
    "track": "core",
    "front": "¿Qué hace la expresión `COALESCE(campaign_id, 'ORGANICO')`?",
    "back": "Devuelve el valor de `campaign_id` si está presente, o el texto `'ORGANICO'` cuando `campaign_id` es `NULL`.",
    "tags": [
      "c0-datos",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-datos-03-a",
    "lessonId": "c0-datos-03-formatos-archivo",
    "moduleId": "c0-datos",
    "track": "core",
    "front": "¿Por qué un archivo CSV pierde códigos postales como \"08001\" cuando se abre sin cuidado?",
    "back": "Porque CSV no guarda el tipo de dato de cada columna; si el programa infiere que \"08001\" es un entero, elimina el cero a la izquierda y deja 8001.",
    "tags": [
      "c0-datos",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-datos-03-b",
    "lessonId": "c0-datos-03-formatos-archivo",
    "moduleId": "c0-datos",
    "track": "core",
    "front": "¿Qué ventaja principal tiene Parquet frente a CSV cuando ejecutas `SELECT total_usd FROM orders`?",
    "back": "Al ser columnar, Parquet lee del disco únicamente los bloques de la columna `total_usd` e ignora las otras 13 columnas de la tabla.",
    "tags": [
      "c0-datos",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-datos-03-c",
    "lessonId": "c0-datos-03-formatos-archivo",
    "moduleId": "c0-datos",
    "track": "core",
    "front": "¿Cuándo es preferible JSON frente a una tabla plana CSV?",
    "back": "Cuando los registros tienen estructura jerárquica (listas u objetos anidados) o atributos opcionales que cambian entre eventos.",
    "tags": [
      "c0-datos",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-datos-04-a",
    "lessonId": "c0-datos-04-utf8-separadores",
    "moduleId": "c0-datos",
    "track": "core",
    "front": "¿Por qué la palabra \"Bogotá\" tiene 6 caracteres pero ocupa 7 bytes en UTF-8?",
    "back": "Porque las primeras cinco letras son ASCII (1 byte cada una) y la vocal acentuada \"á\" se codifica con 2 bytes en UTF-8 (5 + 2 = 7 bytes).",
    "tags": [
      "c0-datos",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-datos-04-b",
    "lessonId": "c0-datos-04-utf8-separadores",
    "moduleId": "c0-datos",
    "track": "core",
    "front": "¿Qué causa que aparezcan textos como \"MedellÃ­n\" o \"CancÃºn\" (mojibake)?",
    "back": "Leer con una codificación de 1 byte (como Windows-1252 o ISO-8859-1) un archivo cuyos caracteres acentuados fueron guardados en UTF-8 (2 bytes).",
    "tags": [
      "c0-datos",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-datos-04-c",
    "lessonId": "c0-datos-04-utf8-separadores",
    "moduleId": "c0-datos",
    "track": "core",
    "front": "¿Qué tres reglas evitan errores regionales al exportar un archivo de datos?",
    "back": "Guardar el texto en codificación UTF-8, usar siempre punto (.) como separador decimal sin separador de miles, y formatear fechas en ISO 8601 (AAAA-MM-DD).",
    "tags": [
      "c0-datos",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-datos-05-a",
    "lessonId": "c0-datos-05-tablas-grano",
    "moduleId": "c0-datos",
    "track": "core",
    "front": "¿Qué significa declarar el grano de una tabla?",
    "back": "Definir con exactitud qué representa una sola fila de esa tabla (por ejemplo: \"una fila por pedido\" en orders frente a \"una fila por línea de pedido\" en order_items).",
    "tags": [
      "c0-datos",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-datos-05-b",
    "lessonId": "c0-datos-05-tablas-grano",
    "moduleId": "c0-datos",
    "track": "core",
    "front": "¿Cómo compruebas con SQL si la columna `order_id` es única en una tabla?",
    "back": "Comparando `COUNT(*)` con `COUNT(DISTINCT order_id)`: si el total de filas es mayor que los valores distintos, `order_id` se repite.",
    "tags": [
      "c0-datos",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-datos-05-c",
    "lessonId": "c0-datos-05-tablas-grano",
    "moduleId": "c0-datos",
    "track": "core",
    "front": "¿Cuál es la diferencia entre clave primaria y clave foránea?",
    "back": "La clave primaria identifica de forma única cada fila en su propia tabla (sin NULL ni repetidos); la clave foránea referencia la clave primaria de otra tabla para relacionarlas.",
    "tags": [
      "c0-datos",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-herr-01-a",
    "lessonId": "c0-herramientas-01-terminal-rutas",
    "moduleId": "c0-herramientas",
    "track": "core",
    "front": "¿Por qué una ruta relativa (`public/datasets/stores.csv`) es preferible a una ruta absoluta (`/Users/ana/proyecto/...`) en un proyecto de datos?",
    "back": "Porque la ruta relativa parte de la carpeta del proyecto y funciona en el equipo de cualquier compañero o servidor sin depender del nombre de usuario local.",
    "tags": [
      "c0-herramientas",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-herr-01-b",
    "lessonId": "c0-herramientas-01-terminal-rutas",
    "moduleId": "c0-herramientas",
    "track": "core",
    "front": "¿Cómo cuentas las filas de datos de un archivo CSV con cabecera usando `tail` y `wc`?",
    "back": "Con `tail -n +2 archivo.csv | wc -l`, que salta la primera línea de nombres de columna antes de contar los saltos de línea.",
    "tags": [
      "c0-herramientas",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-herr-01-c",
    "lessonId": "c0-herramientas-01-terminal-rutas",
    "moduleId": "c0-herramientas",
    "track": "core",
    "front": "¿Qué diferencia hay entre la tubería `|` y la redirección `>` en la terminal?",
    "back": "La tubería `|` envía la salida como entrada a otro comando en memoria; `>` escribe la salida en un archivo en disco sobrescribiendo su contenido previo.",
    "tags": [
      "c0-herramientas",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-herr-02-a",
    "lessonId": "c0-herramientas-02-git-commits-ramas",
    "moduleId": "c0-herramientas",
    "track": "core",
    "front": "¿Cuáles son las tres zonas por las que pasa un cambio en Git antes de quedar en el historial local?",
    "back": "1) Directorio de trabajo (edición), 2) Área de preparación o staging area (`git add`) y 3) Repositorio local (`git commit`).",
    "tags": [
      "c0-herramientas",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-herr-02-b",
    "lessonId": "c0-herramientas-02-git-commits-ramas",
    "moduleId": "c0-herramientas",
    "track": "core",
    "front": "¿Qué es un commit atómico y por qué facilita revertir errores en un equipo de datos?",
    "back": "Es un commit que contiene un único cambio lógico completo y funcional; si falla o cambia el criterio, se puede revertir sin deshacer otros arreglos.",
    "tags": [
      "c0-herramientas",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-herr-02-c",
    "lessonId": "c0-herramientas-02-git-commits-ramas",
    "moduleId": "c0-herramientas",
    "track": "core",
    "front": "¿Qué diferencia hay entre `git diff` y `git diff --staged`?",
    "back": "`git diff` muestra los cambios aún no agregados con `git add`; `git diff --staged` muestra exactamente lo que entrará en el próximo `git commit`.",
    "tags": [
      "c0-herramientas",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-herr-03-a",
    "lessonId": "c0-herramientas-03-python-inicial-uv",
    "moduleId": "c0-herramientas",
    "track": "core",
    "front": "¿Cuándo conviene usar un diccionario (`dict`) y cuándo un conjunto (`set`) al procesar datos en Python?",
    "back": "Usa `dict` para representar un registro con pares clave-valor (como una fila con nombres de columna) y `set` para guardar valores únicos y comprobar pertenencia rápido.",
    "tags": [
      "c0-herramientas",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-herr-03-b",
    "lessonId": "c0-herramientas-03-python-inicial-uv",
    "moduleId": "c0-herramientas",
    "track": "core",
    "front": "¿Qué diferencia hay entre `pyproject.toml` y `uv.lock`?",
    "back": "`pyproject.toml` declara las dependencias que pide tu proyecto; `uv.lock` registra las versiones exactas y hashes de todos los paquetes instalados.",
    "tags": [
      "c0-herramientas",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-herr-03-c",
    "lessonId": "c0-herramientas-03-python-inicial-uv",
    "moduleId": "c0-herramientas",
    "track": "core",
    "front": "¿Por qué es más seguro leer una clave opcional de un diccionario con `d.get(\"campo\")` que con `d[\"campo\"]`?",
    "back": "Porque si la clave no existe, `d[\"campo\"]` lanza un `KeyError` que detiene la ejecución, mientras que `d.get(\"campo\")` devuelve `None` o el valor por defecto indicado.",
    "tags": [
      "c0-herramientas",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-herr-04-a",
    "lessonId": "c0-herramientas-04-cuadernos-jupyter-marimo",
    "moduleId": "c0-herramientas",
    "track": "core",
    "front": "¿Qué es el estado oculto en un cuaderno interactivo `.ipynb`?",
    "back": "Ocurre cuando las variables en la memoria del kernel provienen de celdas borradas o ejecutadas fuera de orden y ya no coinciden con el código visible.",
    "tags": [
      "c0-herramientas",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-herr-04-b",
    "lessonId": "c0-herramientas-04-cuadernos-jupyter-marimo",
    "moduleId": "c0-herramientas",
    "track": "core",
    "front": "¿Qué paso de verificación es obligatorio antes de dar por bueno un análisis en Jupyter (`.ipynb`)?",
    "back": "Reiniciar el kernel y ejecutar todas las celdas de principio a fin (\"Restart Kernel and Run All Cells\").",
    "tags": [
      "c0-herramientas",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-herr-04-c",
    "lessonId": "c0-herramientas-04-cuadernos-jupyter-marimo",
    "moduleId": "c0-herramientas",
    "track": "core",
    "front": "¿Cómo sabe Marimo qué celdas debe volver a ejecutar cuando modificas una variable?",
    "back": "Analiza estáticamente qué variables define y lee cada celda para construir un grafo acíclico dirigido (DAG) y ejecuta las dependientes en orden topológico.",
    "tags": [
      "c0-herramientas",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-herr-05-a",
    "lessonId": "c0-herramientas-05-trazas-error-documentacion",
    "moduleId": "c0-herramientas",
    "track": "core",
    "front": "¿Cuáles son los tres datos que debes buscar al leer una traza de error (traceback) de abajo hacia arriba?",
    "back": "1) El tipo de excepción y mensaje en la última línea, 2) el nombre de tu archivo y número de línea, y 3) la expresión señalada por el cursor `^`.",
    "tags": [
      "c0-herramientas",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-herr-05-b",
    "lessonId": "c0-herramientas-05-trazas-error-documentacion",
    "moduleId": "c0-herramientas",
    "track": "core",
    "front": "¿Qué diferencia hay entre `KeyError` y `TypeError` al procesar un diccionario que representa una fila de datos?",
    "back": "`KeyError` ocurre cuando pides un nombre de columna que no existe; `TypeError` ocurre cuando el valor existe pero su tipo es incompatible (como aplicar `len()` a `None`).",
    "tags": [
      "c0-herramientas",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-herr-05-c",
    "lessonId": "c0-herramientas-05-trazas-error-documentacion",
    "moduleId": "c0-herramientas",
    "track": "core",
    "front": "En una firma de documentación de Python como `func(a, b=10, *, c=True)`, ¿qué indican `=10` y el asterisco `*`?",
    "back": "`=10` indica que `b` es opcional con valor por defecto `10`; el `*` obliga a pasar los argumentos siguientes (`c=True`) por nombre explícito.",
    "tags": [
      "c0-herramientas",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-hojas-01-a",
    "lessonId": "c0-hojas-01-tablas-referencias",
    "moduleId": "c0-hojas",
    "track": "core",
    "front": "¿Qué ventaja aporta convertir un rango en tabla estructurada frente a dejar celdas sueltas?",
    "back": "Expande el rango automáticamente al añadir filas nuevas, propaga las columnas calculadas e impide desalinear columnas al ordenar.",
    "tags": [
      "c0-hojas",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-hojas-01-b",
    "lessonId": "c0-hojas-01-tablas-referencias",
    "moduleId": "c0-hojas",
    "track": "core",
    "front": "¿Cómo se interpreta `=[@qty] * [@unit_price_usd]` en una tabla estructurada y cuál es su equivalente en SQL?",
    "back": "Multiplica `qty` por `unit_price_usd` en la fila actual (`@`). En SQL equivale a escribir `SELECT qty * unit_price_usd FROM order_items`.",
    "tags": [
      "c0-hojas",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-hojas-01-c",
    "lessonId": "c0-hojas-01-tablas-referencias",
    "moduleId": "c0-hojas",
    "track": "core",
    "front": "¿Por qué `=SUMA(TablaPedidos[total_usd])` no cambia su resultado al filtrar la tabla en pantalla?",
    "back": "Porque el filtro solo oculta filas visualmente y `SUMA` agrega tanto celdas visibles como ocultas; para respetar el filtro se usa `SUBTOTALES(109; ...)`.",
    "tags": [
      "c0-hojas",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-hojas-02-a",
    "lessonId": "c0-hojas-02-tablas-dinamicas",
    "moduleId": "c0-hojas",
    "track": "core",
    "front": "¿A qué cláusulas de SQL corresponden los cuadrantes `Filtros`, `Filas` y `Valores` de una tabla dinámica?",
    "back": "`Filtros` corresponde a `WHERE`, `Filas` corresponde a `GROUP BY` y `Valores` corresponde a funciones de agregación como `SUM()`, `COUNT()` o `AVG()`.",
    "tags": [
      "c0-hojas",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-hojas-02-b",
    "lessonId": "c0-hojas-02-tablas-dinamicas",
    "moduleId": "c0-hojas",
    "track": "core",
    "front": "¿Por qué una tabla dinámica a veces aplica `CUENTA` en vez de `SUMA` al arrastrar una columna de importes?",
    "back": "Porque si la columna contiene al menos una celda vacía o con texto, la hoja no la reconoce como 100 % numérica y elige contar celdas por defecto.",
    "tags": [
      "c0-hojas",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-hojas-02-c",
    "lessonId": "c0-hojas-02-tablas-dinamicas",
    "moduleId": "c0-hojas",
    "track": "core",
    "front": "¿Por qué es peligroso apuntar con `=C5` a una celda dentro de una tabla dinámica?",
    "back": "Porque al actualizar datos o añadir categorías nuevas la posición de las filas se desplaza; debe usarse `IMPORTARDATOSDINAMICOS` (`GETPIVOTDATA`).",
    "tags": [
      "c0-hojas",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-hojas-03-a",
    "lessonId": "c0-hojas-03-buscarx-cruces",
    "moduleId": "c0-hojas",
    "track": "core",
    "front": "¿Cuáles son las tres ventajas de `BUSCARX` (`XLOOKUP`) frente a `BUSCARV` (`VLOOKUP`)?",
    "back": "Usa coincidencia exacta por defecto, puede buscar hacia la izquierda o derecha, y referencia la columna devuelta sin un número de columna fijo.",
    "tags": [
      "c0-hojas",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-hojas-03-b",
    "lessonId": "c0-hojas-03-buscarx-cruces",
    "moduleId": "c0-hojas",
    "track": "core",
    "front": "¿Qué diferencia hay entre `BUSCARX` y `LEFT JOIN` cuando la clave buscada aparece 2 veces en la tabla destino?",
    "back": "`BUSCARX` devuelve silenciosamente solo la primera coincidencia (1 fila), mientras que `LEFT JOIN` genera 2 filas y duplica los importes de la tabla izquierda.",
    "tags": [
      "c0-hojas",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-hojas-03-c",
    "lessonId": "c0-hojas-03-buscarx-cruces",
    "moduleId": "c0-hojas",
    "track": "core",
    "front": "¿A qué expresión SQL equivale el cuarto argumento (`\"Sin catálogo\"`) de `BUSCARX` tras hacer un `LEFT JOIN`?",
    "back": "Equivale a envolver la columna de la tabla derecha en `COALESCE(p.category, 'Sin catálogo')` para reemplazar los valores `NULL`.",
    "tags": [
      "c0-hojas",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-hojas-04-a",
    "lessonId": "c0-hojas-04-errores-fechas-celdas",
    "moduleId": "c0-hojas",
    "track": "core",
    "front": "¿Por qué el formato de fecha ISO 8601 (`YYYY-MM-DD`) es superior a `DD/MM/YYYY` o `MM/DD/YYYY` al intercambiar datos?",
    "back": "Porque elimina la ambigüedad regional entre día y mes y hace que el orden alfabético coincida exactamente con el orden cronológico.",
    "tags": [
      "c0-hojas",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-hojas-04-b",
    "lessonId": "c0-hojas-04-errores-fechas-celdas",
    "moduleId": "c0-hojas",
    "track": "core",
    "front": "¿Qué les ocurre en memoria a las celdas `A3`, `A4` y `A5` cuando combinas el rango `A2:A5` en una hoja de cálculo?",
    "back": "Pierden su contenido y quedan vacías (`NULL`), conservándose únicamente el valor de la celda superior izquierda (`A2`).",
    "tags": [
      "c0-hojas",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-hojas-04-c",
    "lessonId": "c0-hojas-04-errores-fechas-celdas",
    "moduleId": "c0-hojas",
    "track": "core",
    "front": "¿Por qué un código postal como `\"01000\"` o `\"08001\"` nunca debe guardarse en una columna de tipo entero?",
    "back": "Porque los tipos numéricos descartan los ceros a la izquierda y truncan el código postal a `\"1000\"` u `\"8001\"`.",
    "tags": [
      "c0-hojas",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-negocio-01-a",
    "lessonId": "c0-negocio-01-ingreso-costo-margen",
    "moduleId": "c0-negocio",
    "track": "core",
    "front": "¿Qué diferencia hay entre ingreso bruto, ingreso neto y margen bruto?",
    "back": "El ingreso bruto es el valor de venta antes de deducciones; el ingreso neto descuenta rebajas y devoluciones; el margen bruto resta además el costo directo del producto (COGS).",
    "tags": [
      "c0-negocio",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-negocio-01-b",
    "lessonId": "c0-negocio-01-ingreso-costo-margen",
    "moduleId": "c0-negocio",
    "track": "core",
    "front": "¿Por qué no se debe usar AVG(margen_pct) para calcular el margen bruto total de varias categorías?",
    "back": "Porque el porcentaje de margen es un hecho no aditivo: promediar porcentajes da el mismo peso a ventas pequeñas y grandes. Debe calcularse como SUM(margen_usd) / SUM(ingreso_usd).",
    "tags": [
      "c0-negocio",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-negocio-01-c",
    "lessonId": "c0-negocio-01-ingreso-costo-margen",
    "moduleId": "c0-negocio",
    "track": "core",
    "front": "¿Por qué los impuestos sobre las ventas (`tax_usd`) y los pedidos `cancelled` se excluyen del ingreso?",
    "back": "Porque los impuestos se recaudan por cuenta del Estado y los pedidos cancelados no transfieren bienes ni generan derecho de cobro.",
    "tags": [
      "c0-negocio",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-negocio-02-a",
    "lessonId": "c0-negocio-02-embudos-conversion",
    "moduleId": "c0-negocio",
    "track": "core",
    "front": "¿Por qué un embudo sobre tablas de eventos debe usar COUNT(DISTINCT session_id) en lugar de COUNT(*)?",
    "back": "Porque un usuario puede disparar varias veces el mismo evento en una sesión o la red puede reenviar duplicados; COUNT(DISTINCT) cuenta cada sesión una sola vez por paso.",
    "tags": [
      "c0-negocio",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-negocio-02-b",
    "lessonId": "c0-negocio-02-embudos-conversion",
    "moduleId": "c0-negocio",
    "track": "core",
    "front": "¿Qué diferencia matemática hay entre conversión del paso k y conversión global al paso k?",
    "back": "La conversión del paso k divide entre los que llegaron al paso k-1; la conversión global divide entre todos los que iniciaron en el paso 1.",
    "tags": [
      "c0-negocio",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-negocio-02-c",
    "lessonId": "c0-negocio-02-embudos-conversion",
    "moduleId": "c0-negocio",
    "track": "core",
    "front": "¿Qué diferencia a un embudo cerrado de un embudo abierto?",
    "back": "El embudo cerrado exige que la entidad haya entrado por el paso 1 en orden secuencial, mientras que el abierto admite entradas directas en pasos intermedios.",
    "tags": [
      "c0-negocio",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-negocio-03-a",
    "lessonId": "c0-negocio-03-kpi-metrica-vanidad",
    "moduleId": "c0-negocio",
    "track": "core",
    "front": "¿Qué prueba rápida distingue a un KPI de una métrica de vanidad?",
    "back": "Preguntar: \"¿Qué decisión concreta cambiaremos mañana si este indicador sube o baja de su umbral?\". Si no cambia ninguna acción, es vanidad.",
    "tags": [
      "c0-negocio",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-negocio-03-b",
    "lessonId": "c0-negocio-03-kpi-metrica-vanidad",
    "moduleId": "c0-negocio",
    "track": "core",
    "front": "¿Cuáles son los cinco elementos de la ficha formal de un KPI?",
    "back": "Fórmula matemática (numerador/denominador), grano de entidad, filtro canónico de exclusión, ventana temporal comparativa y umbral de acción con propietario.",
    "tags": [
      "c0-negocio",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-negocio-03-c",
    "lessonId": "c0-negocio-03-kpi-metrica-vanidad",
    "moduleId": "c0-negocio",
    "track": "core",
    "front": "¿Para qué sirve una métrica guardia (guardrail metric)?",
    "back": "Para asegurar que al optimizar el KPI principal (como volumen de ventas) no se deterioren la rentabilidad o la calidad (como la tasa de reembolso).",
    "tags": [
      "c0-negocio",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-negocio-04-a",
    "lessonId": "c0-negocio-04-pregunta-a-decision",
    "moduleId": "c0-negocio",
    "track": "core",
    "front": "¿Qué elementos convierten una pregunta ambigua de negocio en una hipótesis refutable?",
    "back": "La palanca o causa evaluada, el segmento dimensional, la métrica objetivo con su métrica guardia y el umbral numérico esperado.",
    "tags": [
      "c0-negocio",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-negocio-04-b",
    "lessonId": "c0-negocio-04-pregunta-a-decision",
    "moduleId": "c0-negocio",
    "track": "core",
    "front": "¿Por qué es obligatorio fijar el umbral de decisión antes de ejecutar la consulta o el experimento?",
    "back": "Porque evita cambiar el criterio a conveniencia tras ver los resultados (sesgo de confirmación) y vincula cada resultado con una acción clara.",
    "tags": [
      "c0-negocio",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-negocio-04-c",
    "lessonId": "c0-negocio-04-pregunta-a-decision",
    "moduleId": "c0-negocio",
    "track": "core",
    "front": "¿Por qué no se debe aprobar un experimento con sesgo SRM (Sample Ratio Mismatch) aunque su métrica principal suba?",
    "back": "Porque la diferencia de tamaño entre control y tratamiento demuestra que los grupos no son comparables y el resultado está contaminado por sesgo de selección.",
    "tags": [
      "c0-negocio",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-num-01-a",
    "lessonId": "c0-numeros-01-media-mediana-moda",
    "moduleId": "c0-numeros",
    "track": "core",
    "front": "¿Qué diferencia hay entre lo que mide la media (`AVG`) y lo que mide la mediana (`MEDIAN`) en `orders.total_usd`?",
    "back": "La media (426.10 USD) es el punto de equilibrio del dinero total (`SUM / COUNT`); la mediana (350.16 USD) es el importe central que deja al 50 % de los pedidos por debajo y al 50 % por encima.",
    "tags": [
      "c0-numeros",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-num-01-b",
    "lessonId": "c0-numeros-01-media-mediana-moda",
    "moduleId": "c0-numeros",
    "track": "core",
    "front": "¿Cómo afectan un valor `NULL` y un valor `0` al resultado de `AVG(discount_usd)` en SQL?",
    "back": "`AVG` ignora por completo las filas con `NULL` (no entran ni al numerador ni al denominador), mientras que el `0` suma cero pero incrementa el denominador, reduciendo la media.",
    "tags": [
      "c0-numeros",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-num-01-c",
    "lessonId": "c0-numeros-01-media-mediana-moda",
    "moduleId": "c0-numeros",
    "track": "core",
    "front": "¿Cuándo debes preferir la media sobre la mediana en un reporte financiero?",
    "back": "Cuando necesitas que el indicador multiplicado por el total de pedidos reconstruya exactamente la facturación total (`media × N = SUM(total_usd)`).",
    "tags": [
      "c0-numeros",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-num-02-a",
    "lessonId": "c0-numeros-02-dispersion-iqr-percentiles",
    "moduleId": "c0-numeros",
    "track": "core",
    "front": "¿Cómo se calcula el rango intercuartílico (`IQR`) en SQL y qué fracción de los datos abarca?",
    "back": "Se calcula como `QUANTILE_CONT(x, 0.75) - QUANTILE_CONT(x, 0.25)` (`p75 - p25`) y abarca exactamente el 50 % central de las observaciones ordenadas.",
    "tags": [
      "c0-numeros",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-num-02-b",
    "lessonId": "c0-numeros-02-dispersion-iqr-percentiles",
    "moduleId": "c0-numeros",
    "track": "core",
    "front": "¿Por qué el `IQR` de `products.list_price_usd` en Accesorios no se altera por el SKU con precio `-9.99` USD y el rango total sí?",
    "back": "Porque el rango total usa `MAX - MIN` (afectado por el mínimo `-9.99`), mientras que el `IQR` solo mira las posiciones 25 % y 75 %, ignorando el 25 % más bajo y el 25 % más alto.",
    "tags": [
      "c0-numeros",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-num-02-c",
    "lessonId": "c0-numeros-02-dispersion-iqr-percentiles",
    "moduleId": "c0-numeros",
    "track": "core",
    "front": "¿Dónde se ubican las cercas de Tukey para señalar posibles valores atípicos?",
    "back": "La cerca inferior está en `Q1 - 1.5 × IQR` y la cerca superior en `Q3 + 1.5 × IQR`. Los valores fuera de ellas se auditan, nunca se borran sin investigar su origen.",
    "tags": [
      "c0-numeros",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-num-03-a",
    "lessonId": "c0-numeros-03-asimetria-sesgo",
    "moduleId": "c0-numeros",
    "track": "core",
    "front": "¿Por qué los importes de compra y los tiempos de entrega suelen tener asimetría positiva (cola derecha)?",
    "back": "Porque están acotados por debajo en cero (no hay precios ni tiempos negativos), pero abiertos por arriba a pedidos mayoristas o demoras largas.",
    "tags": [
      "c0-numeros",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-num-03-b",
    "lessonId": "c0-numeros-03-asimetria-sesgo",
    "moduleId": "c0-numeros",
    "track": "core",
    "front": "Si en una columna numérica observas que `AVG(x) > MEDIAN(x)` y `SKEWNESS(x) > 0`, ¿hacia qué lado se estira la cola?",
    "back": "Hacia la derecha (valores altos): un grupo de observaciones grandes arrastra la media por encima de la mediana.",
    "tags": [
      "c0-numeros",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-num-03-c",
    "lessonId": "c0-numeros-03-asimetria-sesgo",
    "moduleId": "c0-numeros",
    "track": "core",
    "front": "¿Cuál es la diferencia entre asimetría (*skewness*) y sesgo estadístico (*bias*)?",
    "back": "La asimetría es la forma geométrica no simétrica de una distribución real; el sesgo estadístico es un error sistemático al muestrear o medir la población.",
    "tags": [
      "c0-numeros",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-num-04-a",
    "lessonId": "c0-numeros-04-proporciones-tasas-bps",
    "moduleId": "c0-numeros",
    "track": "core",
    "front": "Si la tasa de rechazo de pagos baja del `10.0 %` al `8.0 %`, ¿cuánto bajó en puntos porcentuales (`pp`), en puntos base (`bps`) y en porcentaje relativo (`%`)?",
    "back": "Bajó `2.0` puntos porcentuales (`-2.0 pp`), equivalentes a `-200` puntos base (`-200 bps`), lo que representa una reducción relativa del `-20.0 %` (`-2 / 10`).",
    "tags": [
      "c0-numeros",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-num-04-b",
    "lessonId": "c0-numeros-04-proporciones-tasas-bps",
    "moduleId": "c0-numeros",
    "track": "core",
    "front": "¿Por qué es incorrecto calcular el porcentaje de descuento global de una tienda como `AVG(discount_usd / subtotal_usd)`?",
    "back": "Porque promediar razones fila por fila asigna el mismo peso a un pedido de 15 USD que a uno de 1500 USD; debe calcularse como `SUM(discount_usd) / SUM(subtotal_usd)`.",
    "tags": [
      "c0-numeros",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-num-04-c",
    "lessonId": "c0-numeros-04-proporciones-tasas-bps",
    "moduleId": "c0-numeros",
    "track": "core",
    "front": "¿A cuántos puntos porcentuales y a qué fracción decimal equivalen `75` puntos base (`75 bps`)?",
    "back": "Equivalen a `0.75` puntos porcentuales (`0.75 %`) y a la fracción decimal `0.0075`.",
    "tags": [
      "c0-numeros",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-num-05-a",
    "lessonId": "c0-numeros-05-correlacion-causalidad",
    "moduleId": "c0-numeros",
    "track": "core",
    "front": "¿Qué es una variable de confusión (confusor) entre una variable `X` y un resultado `Y`?",
    "back": "Es una tercera variable `C` que influye simultáneamente sobre `X` y sobre `Y`, haciendo que parezcan asociadas o distorsionando su relación real.",
    "tags": [
      "c0-numeros",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-num-05-b",
    "lessonId": "c0-numeros-05-correlacion-causalidad",
    "moduleId": "c0-numeros",
    "track": "core",
    "front": "¿Por qué `CORR(spend_usd, attributed_conversions)` baja de `0.912` a `~0.55` cuando agrupas `marketing_spend` por `channel`?",
    "back": "Porque `channel` confunde la relación global: al mezclar canales de alto presupuesto y alto volumen con canales pequeños, los grupos extremos crean una línea artificialmente recta.",
    "tags": [
      "c0-numeros",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c0-num-05-c",
    "lessonId": "c0-numeros-05-correlacion-causalidad",
    "moduleId": "c0-numeros",
    "track": "core",
    "front": "¿Cómo bloqueas en SQL el efecto de una variable de confusión conocida y medida en la tabla?",
    "back": "Estratificando la consulta mediante `GROUP BY` (o filtrando con `WHERE`) sobre la variable de confusión para comparar observaciones dentro del mismo estrato.",
    "tags": [
      "c0-numeros",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-modelo-01-a",
    "lessonId": "c1-modelo-01-claves-primarias-foraneas",
    "moduleId": "c1-modelo",
    "track": "core",
    "front": "¿Qué dos propiedades simultáneas debe cumplir toda clave primaria en SQL?",
    "back": "Unicidad (`UNIQUE`, ningún valor repetido) y obligatoriedad (`NOT NULL`, ningún valor nulo).",
    "tags": [
      "c1-modelo",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-modelo-01-b",
    "lessonId": "c1-modelo-01-claves-primarias-foraneas",
    "moduleId": "c1-modelo",
    "track": "core",
    "front": "¿Por qué se prefiere una clave subrogada (`product_id`) sobre una clave natural (`sku`) para unir tablas?",
    "back": "Porque la clave subrogada es un entero inmutable y compacto, mientras la clave natural puede cambiar en el negocio o repetirse si se guarda historial.",
    "tags": [
      "c1-modelo",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-modelo-01-c",
    "lessonId": "c1-modelo-01-claves-primarias-foraneas",
    "moduleId": "c1-modelo",
    "track": "core",
    "front": "¿Cómo distingues con SQL si `customer_id` es clave primaria o clave foránea en `orders`?",
    "back": "Comparando `COUNT(*)` (18 000 pedidos) con `COUNT(DISTINCT customer_id)` (2 400 clientes): al repetirse, actúa como clave foránea del lado \"muchos\".",
    "tags": [
      "c1-modelo",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-modelo-02-a",
    "lessonId": "c1-modelo-02-normalizacion-1fn-3fn",
    "moduleId": "c1-modelo",
    "track": "core",
    "front": "¿Qué es una dependencia funcional X -> Y en un esquema relacional?",
    "back": "Es una relación donde cada valor de X determina un único valor de Y en todo momento (por ejemplo, `store_id -> store_name`).",
    "tags": [
      "c1-modelo",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-modelo-02-b",
    "lessonId": "c1-modelo-02-normalizacion-1fn-3fn",
    "moduleId": "c1-modelo",
    "track": "core",
    "front": "¿Cuál es la diferencia exacta entre violar la 2FN y violar la 3FN?",
    "back": "En 2FN una columna depende solo de una parte de una clave primaria compuesta; en 3FN una columna depende de otra columna que tampoco es clave (dependencia transitiva).",
    "tags": [
      "c1-modelo",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-modelo-02-c",
    "lessonId": "c1-modelo-02-normalizacion-1fn-3fn",
    "moduleId": "c1-modelo",
    "track": "core",
    "front": "¿Cómo compruebas en SQL si la columna A determina funcionalmente a la columna B en una tabla?",
    "back": "Ejecutando `SELECT A FROM tabla GROUP BY A HAVING COUNT(DISTINCT B) > 1;`. Si devuelve cero filas, la dependencia funcional se cumple.",
    "tags": [
      "c1-modelo",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-modelo-03-a",
    "lessonId": "c1-modelo-03-integridad-huerfanos",
    "moduleId": "c1-modelo",
    "track": "core",
    "front": "¿Qué es un registro huérfano en una base de datos o lago de datos?",
    "back": "Es una fila en una tabla hija cuya clave foránea apunta a un identificador que no existe en la tabla padre.",
    "tags": [
      "c1-modelo",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-modelo-03-b",
    "lessonId": "c1-modelo-03-integridad-huerfanos",
    "moduleId": "c1-modelo",
    "track": "core",
    "front": "¿Por qué `WHERE id NOT IN (SELECT id FROM t2)` devuelve 0 filas si `t2.id` contiene un `NULL`?",
    "back": "Porque `id NOT IN (..., NULL)` equivale a `id <> ... AND id <> NULL`, que evalúa a `UNKNOWN` en lógica de tres valores y es descartado por `WHERE`.",
    "tags": [
      "c1-modelo",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-modelo-03-c",
    "lessonId": "c1-modelo-03-integridad-huerfanos",
    "moduleId": "c1-modelo",
    "track": "core",
    "front": "¿Cuáles son las tres formas seguras en SQL para encontrar registros de `hija` sin padre en `padre`?",
    "back": "1) `FROM hija ANTI JOIN padre ON ...`, 2) `WHERE NOT EXISTS (SELECT 1 FROM padre WHERE ...)`, y 3) `LEFT JOIN padre ... WHERE padre.pk IS NULL`.",
    "tags": [
      "c1-modelo",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-modelo-04-a",
    "lessonId": "c1-modelo-04-auditoria-calidad",
    "moduleId": "c1-modelo",
    "track": "core",
    "front": "¿Cuáles son las cuatro dimensiones operativas que debe cubrir una auditoría de calidad en SQL?",
    "back": "Unicidad (sin duplicados), completitud (sin nulos inesperados), validez de formato/dominio y validez de rango/consistencia aritmética.",
    "tags": [
      "c1-modelo",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-modelo-04-b",
    "lessonId": "c1-modelo-04-auditoria-calidad",
    "moduleId": "c1-modelo",
    "track": "core",
    "front": "¿Cómo distingues en `payments` un reintento legítimo de cobro de un duplicado técnico de webhook?",
    "back": "El reintento legítimo incrementa `attempt_number` y genera una nueva `idempotency_key`; el duplicado de webhook repite exactamente la misma `idempotency_key`.",
    "tags": [
      "c1-modelo",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-modelo-04-c",
    "lessonId": "c1-modelo-04-auditoria-calidad",
    "moduleId": "c1-modelo",
    "track": "core",
    "front": "¿Qué ventaja tiene usar `COUNT(*) FILTER (WHERE condicion)` para perfilar calidad en DuckDB o PostgreSQL?",
    "back": "Permite evaluar decenas de reglas de nulos, longitudes y rangos en una sola lectura secuencial de la tabla sin subconsultas.",
    "tags": [
      "c1-modelo",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-modelo-05-a",
    "lessonId": "c1-modelo-05-validacion-bloqueante",
    "moduleId": "c1-modelo",
    "track": "core",
    "front": "¿En qué consiste el contrato de aserción de cero filas en pruebas de calidad SQL?",
    "back": "La consulta se escribe para devolver únicamente las filas que rompen la regla; si devuelve 0 filas la prueba aprueba, y si devuelve 1 o más filas falla.",
    "tags": [
      "c1-modelo",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-modelo-05-b",
    "lessonId": "c1-modelo-05-validacion-bloqueante",
    "moduleId": "c1-modelo",
    "track": "core",
    "front": "¿Qué significan las tres siglas del patrón WAP y por qué previenen incidentes en tableros?",
    "back": "Write (escribir en tabla/rama aislada), Audit (ejecutar validaciones bloqueantes) y Publish (exponer a usuarios solo si todas las auditorías devuelven 0 fallos).",
    "tags": [
      "c1-modelo",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-modelo-05-c",
    "lessonId": "c1-modelo-05-validacion-bloqueante",
    "moduleId": "c1-modelo",
    "track": "core",
    "front": "¿Por qué al reconciliar `subtotal_usd` con `SUM(line_total_usd)` se usa `ABS(a - b) >= 0.01` en vez de `a <> b`?",
    "back": "Porque las columnas `DOUBLE` en coma flotante binaria pueden presentar diferencias de redondeo en el décimo decimal (como `0.0000000001`) que no son errores contables.",
    "tags": [
      "c1-modelo",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-py-01-a",
    "lessonId": "c1-python-01-polars-pandas-cow",
    "moduleId": "c1-python",
    "track": "core",
    "front": "¿Qué garantiza Copy-on-Write (CoW) en pandas 3.0 al filtrar un DataFrame?",
    "back": "Garantiza que el subconjunto se comporte siempre como una copia aislada: comparte memoria al leer, pero clona el búfer si modificas una columna.",
    "tags": [
      "c1-python",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-py-01-b",
    "lessonId": "c1-python-01-polars-pandas-cow",
    "moduleId": "c1-python",
    "track": "core",
    "front": "¿Por qué falla `df[\"precio\"][df[\"activo\"]] = 10` en pandas 3.0 y cómo se corrige?",
    "back": "Falla con ChainedAssignmentError porque intenta escribir sobre una selección temporal. Se corrige con `df.loc[df[\"activo\"], \"precio\"] = 10`.",
    "tags": [
      "c1-python",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-py-01-c",
    "lessonId": "c1-python-01-polars-pandas-cow",
    "moduleId": "c1-python",
    "track": "core",
    "front": "¿Qué diferencia estructural existe entre Polars y pandas respecto al índice de filas (`Index`)?",
    "back": "Polars no tiene `Index`; identifica las filas únicamente por su posición entera o mediante columnas explícitas de datos.",
    "tags": [
      "c1-python",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-py-01-d",
    "lessonId": "c1-python-01-polars-pandas-cow",
    "moduleId": "c1-python",
    "track": "core",
    "front": "¿Cómo almacena pandas 3.0 las columnas de texto por defecto frente a pandas 1.x?",
    "back": "Usa el tipo `str` respaldado por búferes contiguos UTF-8 de PyArrow en lugar de arrays `object` llenos de punteros a objetos Python.",
    "tags": [
      "c1-python",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-py-02-a",
    "lessonId": "c1-python-02-io-csv-json-parquet",
    "moduleId": "c1-python",
    "track": "core",
    "front": "¿Qué ocurre si un lector CSV infiere `postal_code` como `Int64` sobre clientes de México (`06102`) y Argentina (`C1051`)?",
    "back": "Pierde el cero inicial en México (convirtiendo `06102` en `6102`) y lanza un error de conversión al encontrar la letra `C` en Argentina.",
    "tags": [
      "c1-python",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-py-02-b",
    "lessonId": "c1-python-02-io-csv-json-parquet",
    "moduleId": "c1-python",
    "track": "core",
    "front": "¿Por qué los registros de eventos se intercambian en NDJSON (`.jsonl`) en lugar de un único arreglo JSON `[...]`?",
    "back": "Porque en NDJSON cada línea es un objeto independiente que se puede leer en paralelo y por lotes sin cargar todo el archivo en RAM.",
    "tags": [
      "c1-python",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-py-02-c",
    "lessonId": "c1-python-02-io-csv-json-parquet",
    "moduleId": "c1-python",
    "track": "core",
    "front": "¿Dónde guarda un archivo Apache Parquet los tipos de datos y las estadísticas `min`/`max` de sus bloques?",
    "back": "En el pie del archivo (Footer), lo que permite al motor conocer el esquema al instante y saltar bloques sin descomprimirlos.",
    "tags": [
      "c1-python",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-py-02-d",
    "lessonId": "c1-python-02-io-csv-json-parquet",
    "moduleId": "c1-python",
    "track": "core",
    "front": "¿Cuándo debes usar `.sink_parquet()` en lugar de `.collect().write_parquet()` en Polars?",
    "back": "Cuando el `LazyFrame` resultante es más grande que la memoria RAM disponible y necesitas volcar el flujo directamente a disco por lotes.",
    "tags": [
      "c1-python",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-py-03-a",
    "lessonId": "c1-python-03-expresiones-vectorizadas",
    "moduleId": "c1-python",
    "track": "core",
    "front": "¿Por qué `df.with_columns(pl.when(...).then(...).otherwise(...))` es mucho más rápido que `df.apply(lambda r: ..., axis=1)`?",
    "back": "Porque `pl.when` opera sobre vectores contiguos de Arrow en paralelo en Rust, mientras `.apply` invoca una función de Python fila por fila.",
    "tags": [
      "c1-python",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-py-03-b",
    "lessonId": "c1-python-03-expresiones-vectorizadas",
    "moduleId": "c1-python",
    "track": "core",
    "front": "¿Cómo impides en Polars que unir `orders` con `order_items` duplique el importe `total_usd` de la cabecera?",
    "back": "Pre-agrupando primero `order_items` por `order_id` y ejecutando `.join(..., on=\"order_id\", validate=\"1:1\")`.",
    "tags": [
      "c1-python",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-py-03-c",
    "lessonId": "c1-python-03-expresiones-vectorizadas",
    "moduleId": "c1-python",
    "track": "core",
    "front": "¿Para qué sirve `.over(\"category\")` al final de una expresión en Polars?",
    "back": "Calcula una expresión de ventana particionada por `category` y devuelve el resultado alineado con cada fila original sin colapsar la tabla.",
    "tags": [
      "c1-python",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-py-03-d",
    "lessonId": "c1-python-03-expresiones-vectorizadas",
    "moduleId": "c1-python",
    "track": "core",
    "front": "¿Qué método de Polars 2.0 reemplazó al antiguo `.melt()` para convertir columnas en filas?",
    "back": "El método `.unpivot(index=..., on=...)`.",
    "tags": [
      "c1-python",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-py-04-a",
    "lessonId": "c1-python-04-limpieza-texto-fechas-tz",
    "moduleId": "c1-python",
    "track": "core",
    "front": "¿Por qué es un error obtener la fecha diaria con `pl.col(\"event_ts_raw\").str.slice(0, 10)` cuando hay varios husos horarios?",
    "back": "Porque ignora el desplazamiento (`-06:00`, `-03:00`, `+01:00`) y mezcla fechas locales distintas sin llevarlas primero a un mismo instante UTC.",
    "tags": [
      "c1-python",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-py-04-b",
    "lessonId": "c1-python-04-limpieza-texto-fechas-tz",
    "moduleId": "c1-python",
    "track": "core",
    "front": "¿Cuál es la diferencia entre `.dt.replace_time_zone(\"UTC\")` y `.dt.convert_time_zone(\"UTC\")`?",
    "back": "`replace_time_zone` etiqueta una fecha sin zona conservando la misma hora del reloj; `convert_time_zone` ajusta la hora de un timestamp que ya tenía zona.",
    "tags": [
      "c1-python",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-py-04-c",
    "lessonId": "c1-python-04-limpieza-texto-fechas-tz",
    "moduleId": "c1-python",
    "track": "core",
    "front": "¿Por qué debes preferir nombres IANA (`America/Mexico_City`, `Europe/Madrid`) sobre desplazamientos fijos (`-06:00`, `+01:00`) al reportar?",
    "back": "Porque la base de datos IANA conoce las reglas históricas y vigentes de cambio de horario de verano e invierno de cada región.",
    "tags": [
      "c1-python",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-py-04-d",
    "lessonId": "c1-python-04-limpieza-texto-fechas-tz",
    "moduleId": "c1-python",
    "track": "core",
    "front": "¿Qué diferencia hay entre `.str.len_chars()` y `.str.len_bytes()` en Polars sobre texto en español?",
    "back": "`len_chars()` cuenta caracteres reales (en `\"Café\"` devuelve 4), mientras `len_bytes()` cuenta bytes UTF-8 (en `\"Café\"` devuelve 5 por la tilde).",
    "tags": [
      "c1-python",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-py-05-a",
    "lessonId": "c1-python-05-cuaderno-a-script-cli",
    "moduleId": "c1-python",
    "track": "core",
    "front": "¿Qué es una función pura de transformación tabular y por qué facilita las pruebas?",
    "back": "Es una función que recibe DataFrames/LazyFrames y devuelve otro sin hacer I/O en disco ni mutar variables globales, lo que permite probarla en RAM con pytest.",
    "tags": [
      "c1-python",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-py-05-b",
    "lessonId": "c1-python-05-cuaderno-a-script-cli",
    "moduleId": "c1-python",
    "track": "core",
    "front": "¿Por qué debes usar `pathlib.Path` en lugar de concatenar rutas con `\"\\\"` o `\"/\"`?",
    "back": "Porque `Path` construye rutas multiplataforma que funcionan igual en Windows local y en contenedores Linux de producción.",
    "tags": [
      "c1-python",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-py-05-c",
    "lessonId": "c1-python-05-cuaderno-a-script-cli",
    "moduleId": "c1-python",
    "track": "core",
    "front": "¿Qué ventaja tiene `polars.testing.assert_frame_equal` frente a un `assert` común en `pytest`?",
    "back": "Verifica nombres de columnas, tipos exactos de Arrow (`Int64`, `Float64`, `String`) y tolerancia numérica, detallando la diferencia exacta si falla.",
    "tags": [
      "c1-python",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-py-05-d",
    "lessonId": "c1-python-05-cuaderno-a-script-cli",
    "moduleId": "c1-python",
    "track": "core",
    "front": "¿Por qué un script de datos debe lanzar una excepción (`exit code != 0`) si el resultado queda vacío antes de escribir el Parquet?",
    "back": "Para impedir que sobrescriba silenciosamente la tabla buena con un archivo vacío y para que el orquestador detecte y alerte el fallo.",
    "tags": [
      "c1-python",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-sql-01-a",
    "lessonId": "c1-sql-base-01-select-from-where",
    "moduleId": "c1-sql-base",
    "track": "core",
    "front": "¿En qué orden lógico evalúa un motor SQL las cláusulas SELECT, FROM y WHERE?",
    "back": "Primero FROM (identifica la tabla), segundo WHERE (filtra las filas que cumplen la condición) y tercero SELECT (proyecta columnas y calcula alias).",
    "tags": [
      "c1-sql-base",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-sql-01-b",
    "lessonId": "c1-sql-base-01-select-from-where",
    "moduleId": "c1-sql-base",
    "track": "core",
    "front": "¿Qué ocurre si combinas `A OR B AND C` sin paréntesis en una cláusula WHERE?",
    "back": "Como AND tiene mayor precedencia que OR, el motor evalúa `A OR (B AND C)`, aprobando cualquier fila que cumpla A aunque no cumpla C.",
    "tags": [
      "c1-sql-base",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-sql-01-c",
    "lessonId": "c1-sql-base-01-select-from-where",
    "moduleId": "c1-sql-base",
    "track": "core",
    "front": "¿A qué expresión equivale exactamente `precio BETWEEN 50 AND 100` en SQL?",
    "back": "Equivale al intervalo cerrado `precio >= 50 AND precio <= 100`, incluyendo ambos valores extremos.",
    "tags": [
      "c1-sql-base",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-sql-02-a",
    "lessonId": "c1-sql-base-02-orderby-limit-distinct",
    "moduleId": "c1-sql-base",
    "track": "core",
    "front": "¿Sobre qué actúa SELECT DISTINCT cuando seleccionas tres columnas (`SELECT DISTINCT a, b, c`)?",
    "back": "Actúa sobre la combinación completa `(a, b, c)`: solo elimina una fila si coincide en las tres columnas a la vez con otra fila.",
    "tags": [
      "c1-sql-base",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-sql-02-b",
    "lessonId": "c1-sql-base-02-orderby-limit-distinct",
    "moduleId": "c1-sql-base",
    "track": "core",
    "front": "¿Por qué `ORDER BY` sí puede usar un alias creado en `SELECT`, mientras que `WHERE` en SQL estándar no puede?",
    "back": "Porque en el orden lógico de evaluación `ORDER BY` se ejecuta después de `SELECT`, cuando los alias ya fueron creados.",
    "tags": [
      "c1-sql-base",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-sql-02-c",
    "lessonId": "c1-sql-base-02-orderby-limit-distinct",
    "moduleId": "c1-sql-base",
    "track": "core",
    "front": "¿Qué riesgo tiene ejecutar `LIMIT 10` sin cláusula `ORDER BY` (o con empates sin desempatar)?",
    "back": "El motor devuelve un subconjunto arbitrario que puede cambiar entre ejecuciones según el orden en que los hilos lean los bloques en disco.",
    "tags": [
      "c1-sql-base",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-sql-03-a",
    "lessonId": "c1-sql-base-03-null-logica-coalesce",
    "moduleId": "c1-sql-base",
    "track": "core",
    "front": "¿Por qué `WHERE campaign_id <> 'CMP-VERANO'` excluye también las filas donde `campaign_id` es `NULL`?",
    "back": "Porque `NULL <> 'CMP-VERANO'` evalúa a `UNKNOWN`, y la cláusula `WHERE` descarta todas las filas cuyo resultado no sea `TRUE`.",
    "tags": [
      "c1-sql-base",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-sql-03-b",
    "lessonId": "c1-sql-base-03-null-logica-coalesce",
    "moduleId": "c1-sql-base",
    "track": "core",
    "front": "¿Qué predicado SQL estándar permite comparar dos expresiones tratando `NULL` como un valor comparable (sin dar `UNKNOWN`)?",
    "back": "`IS DISTINCT FROM` (para desigualdad) e `IS NOT DISTINCT FROM` (para igualdad segura ante nulos).",
    "tags": [
      "c1-sql-base",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-sql-03-c",
    "lessonId": "c1-sql-base-03-null-logica-coalesce",
    "moduleId": "c1-sql-base",
    "track": "core",
    "front": "¿Cómo evitas un error de división por cero al calcular `descuento / subtotal` en SQL?",
    "back": "Usando `NULLIF` en el denominador: `descuento / NULLIF(subtotal, 0)`, que convierte el cero en `NULL` y devuelve `NULL` sin fallar.",
    "tags": [
      "c1-sql-base",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-sql-04-a",
    "lessonId": "c1-sql-base-04-groupby-having",
    "moduleId": "c1-sql-base",
    "track": "core",
    "front": "¿Cuál es la diferencia exacta de orden lógico entre `WHERE` y `HAVING`?",
    "back": "`WHERE` filtra filas individuales antes de `GROUP BY`; `HAVING` filtra grupos ya formados después de `GROUP BY` usando funciones agregadas.",
    "tags": [
      "c1-sql-base",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-sql-04-b",
    "lessonId": "c1-sql-base-04-groupby-having",
    "moduleId": "c1-sql-base",
    "track": "core",
    "front": "¿Qué hace `GROUP BY` cuando la columna por la que agrupas contiene varios registros con `NULL`?",
    "back": "Reúne todos los registros con `NULL` en un único grupo propio dentro del resultado.",
    "tags": [
      "c1-sql-base",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-sql-04-c",
    "lessonId": "c1-sql-base-04-groupby-having",
    "moduleId": "c1-sql-base",
    "track": "core",
    "front": "¿Qué hace `GROUP BY ALL` en DuckDB y qué precaución debes tener al cambiar de motor?",
    "back": "Agrupa automáticamente por todas las columnas del `SELECT` que no tengan función agregada; es una extensión de DuckDB y no existe en PostgreSQL 17.",
    "tags": [
      "c1-sql-base",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-sql-05-a",
    "lessonId": "c1-sql-base-05-case-when-filter",
    "moduleId": "c1-sql-base",
    "track": "core",
    "front": "¿Qué valor devuelve una expresión `CASE WHEN ... END` para una fila que no cumple ningún `WHEN` y no tiene cláusula `ELSE`?",
    "back": "Devuelve `NULL`.",
    "tags": [
      "c1-sql-base",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-sql-05-b",
    "lessonId": "c1-sql-base-05-case-when-filter",
    "moduleId": "c1-sql-base",
    "track": "core",
    "front": "¿Por qué `COUNT(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)` cuenta todas las filas en lugar de solo las completadas?",
    "back": "Porque `COUNT(expresion)` cuenta cualquier valor que no sea `NULL`, y el número `0` no es `NULL`. Debe usarse `COUNT(*) FILTER (WHERE ...)` o `SUM(CASE ... ELSE 0 END)`.",
    "tags": [
      "c1-sql-base",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-sql-05-c",
    "lessonId": "c1-sql-base-05-case-when-filter",
    "moduleId": "c1-sql-base",
    "track": "core",
    "front": "¿Por qué es peligroso poner `ELSE 0` dentro de `AVG(CASE WHEN condicion THEN importe ELSE 0 END)`?",
    "back": "Porque los ceros artificiales se incluyen en el denominador del promedio y hunden el valor resultante.",
    "tags": [
      "c1-sql-base",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-sql-06-a",
    "lessonId": "c1-sql-base-06-fechas-date-trunc",
    "moduleId": "c1-sql-base",
    "track": "core",
    "front": "¿Por qué debes usar `DATE_TRUNC('month', fecha)` en lugar de `EXTRACT(MONTH FROM fecha)` para construir una serie mensual de varios años?",
    "back": "Porque `DATE_TRUNC` conserva el año (`2025-01-01`), mientras que `EXTRACT(MONTH ...)` devuelve solo `1..12` y suma juntos los mismos meses de años diferentes.",
    "tags": [
      "c1-sql-base",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-sql-06-b",
    "lessonId": "c1-sql-base-06-fechas-date-trunc",
    "moduleId": "c1-sql-base",
    "track": "core",
    "front": "¿Qué problema causa filtrar una columna `TIMESTAMP` con `WHERE order_ts BETWEEN '2025-01-01' AND '2025-01-31'`?",
    "back": "El límite superior se evalúa como `2025-01-31 00:00:00` y descarta todos los registros ocurridos durante el día 31 de enero después de la medianoche.",
    "tags": [
      "c1-sql-base",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-sql-06-c",
    "lessonId": "c1-sql-base-06-fechas-date-trunc",
    "moduleId": "c1-sql-base",
    "track": "core",
    "front": "¿Cómo se escribe en SQL el intervalo semiabierto para filtrar todo el mes de marzo de 2025 sobre una columna `TIMESTAMP`?",
    "back": "`WHERE col >= TIMESTAMP '2025-03-01 00:00:00' AND col < TIMESTAMP '2025-04-01 00:00:00'`.",
    "tags": [
      "c1-sql-base",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-sql-07-a",
    "lessonId": "c1-sql-base-07-count-variantes",
    "moduleId": "c1-sql-base",
    "track": "core",
    "front": "¿Qué diferencia exacta hay entre `COUNT(*)` y `COUNT(campaign_id)`?",
    "back": "`COUNT(*)` cuenta todas las filas de la tabla; `COUNT(campaign_id)` ignora las filas donde `campaign_id` es `NULL`.",
    "tags": [
      "c1-sql-base",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-sql-07-b",
    "lessonId": "c1-sql-base-07-count-variantes",
    "moduleId": "c1-sql-base",
    "track": "core",
    "front": "¿Cómo verificas en una sola línea SQL si la columna `order_id` tiene duplicados o nulos en una tabla?",
    "back": "Comprobando si `COUNT(*)` es exactamente igual a `COUNT(DISTINCT order_id)`.",
    "tags": [
      "c1-sql-base",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-sql-07-c",
    "lessonId": "c1-sql-base-07-count-variantes",
    "moduleId": "c1-sql-base",
    "track": "core",
    "front": "¿Por qué `COUNT(DISTINCT customer_id)` se considera una métrica no aditiva?",
    "back": "Porque sumar los conteos únicos de varios días o categorías vuelve a contar a las personas que aparecen en más de un grupo.",
    "tags": [
      "c1-sql-base",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-joins-01-a",
    "lessonId": "c1-sql-joins-01-tipos-join",
    "moduleId": "c1-sql-joins",
    "track": "core",
    "front": "¿Qué ocurre si aplicas `WHERE d.estado = 'activo'` después de hacer `FROM izq LEFT JOIN der d ON ...`?",
    "back": "Las filas sin pareja tienen `d.estado = NULL`; el `WHERE` las descarta y convierte el `LEFT JOIN` en un `INNER JOIN`.",
    "tags": [
      "c1-sql-joins",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-joins-01-b",
    "lessonId": "c1-sql-joins-01-tipos-join",
    "moduleId": "c1-sql-joins",
    "track": "core",
    "front": "¿Dónde debes escribir el filtro sobre la tabla derecha en un `LEFT JOIN` para no perder las filas sin pareja de la izquierda?",
    "back": "Dentro de la cláusula `ON` (`LEFT JOIN der d ON izq.id = d.id AND d.estado = 'activo'`).",
    "tags": [
      "c1-sql-joins",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-joins-01-c",
    "lessonId": "c1-sql-joins-01-tipos-join",
    "moduleId": "c1-sql-joins",
    "track": "core",
    "front": "¿Por qué es preferible `SEMI JOIN` (o `EXISTS`) frente a `INNER JOIN` cuando solo quieres filtrar una tabla por presencia en otra?",
    "back": "Porque `SEMI JOIN` devuelve cada fila de la tabla izquierda como máximo una vez, evitando duplicados cuando la tabla derecha tiene relación 1:N.",
    "tags": [
      "c1-sql-joins",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-joins-01-d",
    "lessonId": "c1-sql-joins-01-tipos-join",
    "moduleId": "c1-sql-joins",
    "track": "core",
    "front": "¿Qué devuelve `A ANTI JOIN B ON A.id = B.id`?",
    "back": "Devuelve únicamente las filas de la tabla izquierda `A` que no tienen ninguna coincidencia en la tabla derecha `B`.",
    "tags": [
      "c1-sql-joins",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-joins-03-a",
    "lessonId": "c1-sql-joins-03-subconsultas",
    "moduleId": "c1-sql-joins",
    "track": "core",
    "front": "¿Por qué `WHERE id NOT IN (SELECT id FROM tabla)` devuelve 0 filas si `tabla.id` tiene un solo `NULL`?",
    "back": "Porque `id <> NULL` evalúa a `UNKNOWN`, y en una cadena de `AND` cualquier `UNKNOWN` impide que el `WHERE` sea `TRUE`.",
    "tags": [
      "c1-sql-joins",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-joins-03-b",
    "lessonId": "c1-sql-joins-03-subconsultas",
    "moduleId": "c1-sql-joins",
    "track": "core",
    "front": "¿Qué es una subconsulta escalar y qué pasa si devuelve 2 filas?",
    "back": "Es una subconsulta que devuelve como máximo 1 fila y 1 columna; si devuelve más de 1 fila, el motor lanza un error en tiempo de ejecución.",
    "tags": [
      "c1-sql-joins",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-joins-03-c",
    "lessonId": "c1-sql-joins-03-subconsultas",
    "moduleId": "c1-sql-joins",
    "track": "core",
    "front": "¿Cuándo necesitas una subconsulta de tabla en `FROM` (tabla derivada)?",
    "back": "Cuando necesitas agregar en dos etapas con distinto grano, como calcular el promedio por segmento del gasto total acumulado por cliente.",
    "tags": [
      "c1-sql-joins",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-joins-04-a",
    "lessonId": "c1-sql-joins-04-ctes-legibles",
    "moduleId": "c1-sql-joins",
    "track": "core",
    "front": "¿Cómo se encadenan varias CTEs en una misma consulta SQL?",
    "back": "Escribiendo `WITH cte_1 AS (...), cte_2 AS (...) SELECT ...`, sin repetir la palabra `WITH`.",
    "tags": [
      "c1-sql-joins",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-joins-04-b",
    "lessonId": "c1-sql-joins-04-ctes-legibles",
    "moduleId": "c1-sql-joins",
    "track": "core",
    "front": "¿Cuáles son las tres etapas recomendadas al estructurar CTEs en una consulta analítica?",
    "back": "1) CTEs de entrada/limpieza (filtros y deduplicación), 2) CTEs de pre-agregación por grano, y 3) `SELECT` final de unión.",
    "tags": [
      "c1-sql-joins",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-joins-04-c",
    "lessonId": "c1-sql-joins-04-ctes-legibles",
    "moduleId": "c1-sql-joins",
    "track": "core",
    "front": "¿Para qué sirve añadir `AS MATERIALIZED` a una CTE en DuckDB o PostgreSQL 17?",
    "back": "Para indicar al motor que calcule y guarde en memoria el resultado de la CTE una sola vez en lugar de fusionarla.",
    "tags": [
      "c1-sql-joins",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-joins-05-a",
    "lessonId": "c1-sql-joins-05-conjuntos-union",
    "moduleId": "c1-sql-joins",
    "track": "core",
    "front": "¿Por qué es peligroso usar `UNION` en vez de `UNION ALL` al apilar tablas de transacciones sin incluir el ID primario?",
    "back": "Porque `UNION` elimina filas idénticas y borrará transacciones reales distintas que coincidan en fecha, categoría e importe.",
    "tags": [
      "c1-sql-joins",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-joins-05-b",
    "lessonId": "c1-sql-joins-05-conjuntos-union",
    "moduleId": "c1-sql-joins",
    "track": "core",
    "front": "¿Cómo comparan los valores `NULL` los operadores `UNION`, `INTERSECT` y `EXCEPT`?",
    "back": "Tratan dos valores `NULL` en la misma columna como iguales (`IS NOT DISTINCT FROM`), a diferencia del operador `=` en `WHERE` o `JOIN`.",
    "tags": [
      "c1-sql-joins",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-joins-05-c",
    "lessonId": "c1-sql-joins-05-conjuntos-union",
    "moduleId": "c1-sql-joins",
    "track": "core",
    "front": "¿Qué hace `UNION ALL BY NAME` en DuckDB?",
    "back": "Apila las filas de dos consultas emparejando las columnas por su nombre en lugar de por su posición, rellenando con `NULL` las columnas faltantes.",
    "tags": [
      "c1-sql-joins",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-viz-01-1",
    "lessonId": "c1-viz-01-geometria-grafico",
    "moduleId": "c1-viz",
    "track": "core",
    "front": "Según Cleveland y McGill (1984), ¿cuál es el canal visual más preciso para comparar cantidades numéricas?",
    "back": "La posición a lo largo de una escala común alineada, como en un gráfico de barras simples o de puntos sobre el mismo eje.",
    "tags": [
      "c1-viz",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-viz-01-2",
    "lessonId": "c1-viz-01-geometria-grafico",
    "moduleId": "c1-viz",
    "track": "core",
    "front": "¿Por qué un gráfico de barras apiladas dificulta comparar las series intermedias a lo largo del tiempo?",
    "back": "Porque solo la serie inferior descansa sobre la línea base común; las series superiores cambian de punto de partida en cada columna.",
    "tags": [
      "c1-viz",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-viz-01-3",
    "lessonId": "c1-viz-01-geometria-grafico",
    "moduleId": "c1-viz",
    "track": "core",
    "front": "¿Qué criterio de ordenamiento debe aplicarse en el eje de un gráfico de barras según el tipo de categoría?",
    "back": "Ordenar de mayor a menor magnitud si la categoría es nominal (tiendas, productos) y mantener la secuencia natural si es ordinal o temporal.",
    "tags": [
      "c1-viz",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-viz-01-4",
    "lessonId": "c1-viz-01-geometria-grafico",
    "moduleId": "c1-viz",
    "track": "core",
    "front": "¿Qué expresión SQL permite calcular en la misma consulta agregada el porcentaje de cada categoría sobre el total general?",
    "back": "100.0 * SUM(metrica) / SUM(SUM(metrica)) OVER (), combinando la agregación de grupo con una función de ventana sobre el conjunto completo.",
    "tags": [
      "c1-viz",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-viz-02-1",
    "lessonId": "c1-viz-02-ejes-escalas-cero",
    "moduleId": "c1-viz",
    "track": "core",
    "front": "¿Qué establece el principio de tinta proporcional de Claus Wilke?",
    "back": "Cuando una zona rellena (como una barra o un área sombreada) representa una magnitud numérica, su superficie visual debe ser proporcional al valor y partir de cero.",
    "tags": [
      "c1-viz",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-viz-02-2",
    "lessonId": "c1-viz-02-ejes-escalas-cero",
    "moduleId": "c1-viz",
    "track": "core",
    "front": "¿Por qué un gráfico de líneas puede no incluir el cero en el eje vertical sin distorsionar la lectura?",
    "back": "Porque codifica los datos mediante posición y pendiente entre puntos, sin usar el área rellena bajo la curva como medida de magnitud.",
    "tags": [
      "c1-viz",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-viz-02-3",
    "lessonId": "c1-viz-02-ejes-escalas-cero",
    "moduleId": "c1-viz",
    "track": "core",
    "front": "¿Por qué los gráficos con doble eje vertical (dual-scaled axes) inducen conclusiones falsas?",
    "back": "Porque al cambiar de forma independiente el mínimo o el máximo de cualquiera de los dos ejes se fabrican cruces y pendientes aparentes.",
    "tags": [
      "c1-viz",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-viz-02-4",
    "lessonId": "c1-viz-02-ejes-escalas-cero",
    "moduleId": "c1-viz",
    "track": "core",
    "front": "¿Cómo se transforma una serie temporal a índice base 100 en SQL?",
    "back": "Dividiendo cada valor entre el valor del primer período con FIRST_VALUE(metrica) OVER (ORDER BY fecha) y multiplicando por 100.0.",
    "tags": [
      "c1-viz",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-viz-03-1",
    "lessonId": "c1-viz-03-color-accesibilidad",
    "moduleId": "c1-viz",
    "track": "core",
    "front": "¿Cuándo debes elegir una paleta de color divergente en lugar de una secuencial?",
    "back": "Cuando la variable numérica tiene un punto central con significado analítico propio (como 0 % de variación contra la meta) y se desvía en dos sentidos opuestos.",
    "tags": [
      "c1-viz",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-viz-03-2",
    "lessonId": "c1-viz-03-color-accesibilidad",
    "moduleId": "c1-viz",
    "track": "core",
    "front": "¿Qué exigen los criterios WCAG 2.2 1.4.1 y 1.4.11 en un gráfico de datos?",
    "back": "No usar el color como único medio para transmitir información (1.4.1) y asegurar una razón de contraste de al menos 3:1 en los elementos gráficos frente al fondo (1.4.11).",
    "tags": [
      "c1-viz",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-viz-03-3",
    "lessonId": "c1-viz-03-color-accesibilidad",
    "moduleId": "c1-viz",
    "track": "core",
    "front": "¿Por qué debe evitarse la combinación rojo-verde pura en indicadores de estado?",
    "back": "Porque cerca del 8 % de los hombres y el 0.5 % de las mujeres presentan deuteranopía o protanopía y perciben ambos tonos como indistinguibles si tienen luminancia parecida.",
    "tags": [
      "c1-viz",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-viz-03-4",
    "lessonId": "c1-viz-03-color-accesibilidad",
    "moduleId": "c1-viz",
    "track": "core",
    "front": "¿Qué haces en SQL cuando un gráfico categórico tiene 14 tiendas y solo quieres destacar las 4 principales?",
    "back": "Numeras con ROW_NUMBER() OVER (ORDER BY metrica DESC) y agrupas con CASE WHEN rn <= 4 THEN tienda ELSE 'Otras tiendas' en tono gris de contexto.",
    "tags": [
      "c1-viz",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-viz-04-1",
    "lessonId": "c1-viz-04-tablas-numericas",
    "moduleId": "c1-viz",
    "track": "core",
    "front": "¿Cuándo es preferible presentar los datos en una tabla numérica en lugar de un gráfico?",
    "back": "Cuando se necesita buscar cifras exactas al centavo o comparar simultáneamente varias métricas con unidades distintas (tiendas, pedidos, dólares, porcentajes).",
    "tags": [
      "c1-viz",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-viz-04-2",
    "lessonId": "c1-viz-04-tablas-numericas",
    "moduleId": "c1-viz",
    "track": "core",
    "front": "¿Por qué nunca deben centrarse las columnas de importes o cantidades en una tabla?",
    "back": "Porque los números de distinta longitud quedan con sus unidades, decenas y puntos decimales desalineados, impidiendo comparar órdenes de magnitud al escanear verticalmente.",
    "tags": [
      "c1-viz",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-viz-04-3",
    "lessonId": "c1-viz-04-tablas-numericas",
    "moduleId": "c1-viz",
    "track": "core",
    "front": "¿Qué resuelve la propiedad tipográfica `font-variant-numeric: tabular-nums`?",
    "back": "Asigna exactamente el mismo ancho horizontal a cada dígito (0–9) para que las cifras de distintas filas se alineen dígito a dígito como en una fuente monoespaciada.",
    "tags": [
      "c1-viz",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-c1-viz-04-4",
    "lessonId": "c1-viz-04-tablas-numericas",
    "moduleId": "c1-viz",
    "track": "core",
    "front": "¿Qué es la \"falsa precisión\" en una tabla de datos y cómo se previene en SQL?",
    "back": "Es mostrar muchos decimales irrelevantes producto de divisiones en coma flotante (p. ej. 336.61876644); se previene aplicando ROUND(expresion, decimales) según la escala de decisión.",
    "tags": [
      "c1-viz",
      "core"
    ],
    "difficulty": 1
  },
  {
    "id": "fc-bi2-dax-01-a",
    "lessonId": "bi2-dax-01-contexto-fila-filtro",
    "moduleId": "bi2-dax",
    "track": "bi",
    "front": "¿Qué diferencia hay entre el contexto de filtro y el contexto de fila en DAX?",
    "back": "El contexto de filtro filtra subconjuntos de tablas antes de agregar y viaja por las relaciones 1:N; el contexto de fila apunta al registro actual durante una iteración.",
    "tags": [
      "bi2-dax",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-dax-01-b",
    "lessonId": "bi2-dax-01-contexto-fila-filtro",
    "moduleId": "bi2-dax",
    "track": "bi",
    "front": "¿Por qué `SUM(order_items[qty]) * SUM(products[unit_cost_usd])` da un resultado erróneo?",
    "back": "Porque suma primero todas las unidades y todos los costos por separado y luego multiplica ambos totales, en lugar de multiplicar fila por fila con `SUMX`.",
    "tags": [
      "bi2-dax",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-dax-01-c",
    "lessonId": "bi2-dax-01-contexto-fila-filtro",
    "moduleId": "bi2-dax",
    "track": "bi",
    "front": "¿Cuándo se utiliza `RELATED` frente a `RELATEDTABLE` en DAX?",
    "back": "`RELATED` se usa en el lado muchos (N) para traer un valor escalar del lado uno (1); `RELATEDTABLE` se usa en el lado 1 para obtener las filas relacionadas del lado N.",
    "tags": [
      "bi2-dax",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-dax-02-a",
    "lessonId": "bi2-dax-02-calculate-transicion-contexto",
    "moduleId": "bi2-dax",
    "track": "bi",
    "front": "¿Qué diferencia hay entre `CALCULATE([Ventas], products[category] = \"Molinos\")` y la misma fórmula con `KEEPFILTERS`?",
    "back": "Sin `KEEPFILTERS` sobrescribe cualquier categoría de la fila del visual mostrando siempre Molinos; con `KEEPFILTERS` intersecta ambos filtros y devuelve `BLANK` en las demás categorías.",
    "tags": [
      "bi2-dax",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-dax-02-b",
    "lessonId": "bi2-dax-02-calculate-transicion-contexto",
    "moduleId": "bi2-dax",
    "track": "bi",
    "front": "¿Qué es la transición de contexto en DAX y qué la activa?",
    "back": "Es la transformación del contexto de fila actual en un contexto de filtro equivalente; la activa `CALCULATE` (explícito o implícito al llamar a una medida).",
    "tags": [
      "bi2-dax",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-dax-02-c",
    "lessonId": "bi2-dax-02-calculate-transicion-contexto",
    "moduleId": "bi2-dax",
    "track": "bi",
    "front": "¿Por qué se prefiere `REMOVEFILTERS` frente a `ALL` como modificador directo de `CALCULATE`?",
    "back": "Ambos generan el mismo plan de consulta al quitar filtros, pero `REMOVEFILTERS` comunica sin ambigüedad que se limpia un filtro y no que se materializa una tabla.",
    "tags": [
      "bi2-dax",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-dax-03-a",
    "lessonId": "bi2-dax-03-inteligencia-tiempo",
    "moduleId": "bi2-dax",
    "track": "bi",
    "front": "¿Qué requisito debe cumplir la tabla `calendar` para que `SAMEPERIODLASTYEAR` y `TOTALYTD` funcionen bien?",
    "back": "Debe tener una fila por cada día natural desde el 1 de enero hasta el 31 de diciembre, sin fechas duplicadas ni días faltantes.",
    "tags": [
      "bi2-dax",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-dax-03-b",
    "lessonId": "bi2-dax-03-inteligencia-tiempo",
    "moduleId": "bi2-dax",
    "track": "bi",
    "front": "¿Por qué `SAMEPERIODLASTYEAR` puede mostrar una caída falsa en el año en curso si se selecciona el año entero?",
    "back": "Porque desplaza todo el año calendario (hasta el 31 de diciembre del año previo) aunque el año actual solo tenga ventas hasta la fecha de hoy.",
    "tags": [
      "bi2-dax",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-dax-03-c",
    "lessonId": "bi2-dax-03-inteligencia-tiempo",
    "moduleId": "bi2-dax",
    "track": "bi",
    "front": "¿Cómo se construye una media móvil de 7 días en DAX respetando los días sin ventas?",
    "back": "Con `CALCULATE(AVERAGEX(VALUES('calendar'[calendar_date]), [Ventas]), DATESINPERIOD('calendar'[calendar_date], MAX('calendar'[calendar_date]), -7, DAY))`.",
    "tags": [
      "bi2-dax",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-dax-04-a",
    "lessonId": "bi2-dax-04-funciones-iteradoras",
    "moduleId": "bi2-dax",
    "track": "bi",
    "front": "¿Cuándo debes escribir `SUM(tabla[col])` en lugar de `SUMX(tabla, tabla[col])`?",
    "back": "Siempre que sumes una única columna física sin operaciones adicionales; ambas son equivalentes pero `SUM` es más clara.",
    "tags": [
      "bi2-dax",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-dax-04-b",
    "lessonId": "bi2-dax-04-funciones-iteradoras",
    "moduleId": "bi2-dax",
    "track": "bi",
    "front": "¿Qué diferencia hay entre `AVERAGE(orders[total_usd])` y `AVERAGEX(VALUES('calendar'[month]), [Ventas USD])`?",
    "back": "La primera calcula el ticket promedio por pedido individual; la segunda calcula el promedio de facturación mensual.",
    "tags": [
      "bi2-dax",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-dax-04-c",
    "lessonId": "bi2-dax-04-funciones-iteradoras",
    "moduleId": "bi2-dax",
    "track": "bi",
    "front": "¿Cuáles son las dos causas por las que `RANKX` devuelve `1` en todas las filas de un visual?",
    "back": "No remover el filtro en el primer argumento (usar `VALUES` en vez de `ALL`) o pasar en el segundo argumento un `SUM(...)` sin transición de contexto.",
    "tags": [
      "bi2-dax",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-dax-05-a",
    "lessonId": "bi2-dax-05-variables-divide-formato",
    "moduleId": "bi2-dax",
    "track": "bi",
    "front": "¿En qué momento se evalúa el contexto de filtro de una variable `VAR` en DAX?",
    "back": "En el momento y ámbito exactos en que se define el `VAR`; después su resultado es una constante que no cambia aunque se pase dentro de `CALCULATE`.",
    "tags": [
      "bi2-dax",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-dax-05-b",
    "lessonId": "bi2-dax-05-variables-divide-formato",
    "moduleId": "bi2-dax",
    "track": "bi",
    "front": "¿Por qué es preferible `DIVIDE(A, B)` frente a `IF(B = 0, BLANK(), A / B)`?",
    "back": "Porque `DIVIDE` evalúa la expresión `B` una sola vez y maneja automáticamente tanto el cero como `BLANK` en el denominador.",
    "tags": [
      "bi2-dax",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-dax-05-c",
    "lessonId": "bi2-dax-05-variables-divide-formato",
    "moduleId": "bi2-dax",
    "track": "bi",
    "front": "¿Por qué nunca debes escribir el nombre de la tabla delante de una medida (`'orders'[Ventas USD]`)?",
    "back": "Para distinguirla visualmente de una columna física y recordar que toda medida incluye un `CALCULATE` implícito con transición de contexto.",
    "tags": [
      "bi2-dax",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-dax-06-a",
    "lessonId": "bi2-dax-06-antipatrones-rendimiento-dax",
    "moduleId": "bi2-dax",
    "track": "bi",
    "front": "¿Por qué `CALCULATE([Ventas], FILTER('orders', 'orders'[status] = \"completed\"))` es un antipatrón de rendimiento?",
    "back": "Porque obliga a iterar toda la tabla de hechos `orders` expandida en lugar de filtrar únicamente los valores únicos de la columna `'orders'[status]` en el Storage Engine.",
    "tags": [
      "bi2-dax",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-dax-06-b",
    "lessonId": "bi2-dax-06-antipatrones-rendimiento-dax",
    "moduleId": "bi2-dax",
    "track": "bi",
    "front": "¿Por qué la fila Total de una matriz en Power BI muestra menos clientes que la suma de los 12 meses cuando usas `DISTINCTCOUNT`?",
    "back": "Porque un cliente que compró en varios meses cuenta una vez en cada mes, pero en el contexto del Total Anual se cuenta una sola vez.",
    "tags": [
      "bi2-dax",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-dax-06-c",
    "lessonId": "bi2-dax-06-antipatrones-rendimiento-dax",
    "moduleId": "bi2-dax",
    "track": "bi",
    "front": "¿Por qué no debes usar `FORMAT([Medida], \"$#,##0\")` dentro del código DAX de una medida?",
    "back": "Porque transforma el número en texto (`STRING`), rompiendo el ordenamiento numérico y los gráficos de ejes continuos.",
    "tags": [
      "bi2-dax",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-01-01",
    "lessonId": "bi2-metricas-01-anatomia-metrica",
    "moduleId": "bi2-metricas",
    "track": "bi",
    "front": "¿Cuáles son los 5 componentes obligatorios del contrato de una métrica canónica?",
    "back": "1) Fórmula matemática exacta, 2) Grano atómico de evaluación, 3) Filtros canónicos de inclusión/exclusión, 4) Ventana y columna temporal rectora, y 5) Propietario o responsable de negocio.",
    "tags": [
      "bi2-metricas",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-01-02",
    "lessonId": "bi2-metricas-01-anatomia-metrica",
    "moduleId": "bi2-metricas",
    "track": "bi",
    "front": "¿Por qué ocurre fan-out al unir orders directamente con refunds en Mercado Brisa?",
    "back": "Porque orders tiene grano de 1 fila por pedido (18,000 filas) y refunds tiene grano de evento de reembolso (1,450 filas en 1,150 pedidos), duplicando el subtotal de los 300 pedidos con dos devoluciones.",
    "tags": [
      "bi2-metricas",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-01-03",
    "lessonId": "bi2-metricas-01-anatomia-metrica",
    "moduleId": "bi2-metricas",
    "track": "bi",
    "front": "¿Por qué el filtro canónico de Ingreso Neto Realizado incluye status IN ('completed', 'refunded') y excluye 'cancelled' y 'pending'?",
    "back": "Porque los pedidos pendientes o cancelados no consolidaron venta contable, mientras que los pedidos con estado refunded son transacciones realizadas cuyos reembolsos parciales o totales deben restarse explícitamente.",
    "tags": [
      "bi2-metricas",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-01-04",
    "lessonId": "bi2-metricas-01-anatomia-metrica",
    "moduleId": "bi2-metricas",
    "track": "bi",
    "front": "¿Para qué sirve la cláusula FILTER (WHERE ...) dentro de una función de agregación en SQL?",
    "back": "Permite aplicar el filtro canónico específico de una métrica dentro de SUM, COUNT o AVG sin filtrar las demás métricas calculadas en el mismo SELECT.",
    "tags": [
      "bi2-metricas",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-02-01",
    "lessonId": "bi2-metricas-02-arboles-kpis-palancas",
    "moduleId": "bi2-metricas",
    "track": "bi",
    "front": "¿Cuál es la diferencia entre una descomposición aditiva y una multiplicativa en un árbol de KPIs?",
    "back": "La aditiva suma subconjuntos disjuntos (como ingresos por región o segmento), mientras que la multiplicativa encadena factores causales (Clientes Activos × Frecuencia × Ticket Promedio).",
    "tags": [
      "bi2-metricas",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-02-02",
    "lessonId": "bi2-metricas-02-arboles-kpis-palancas",
    "moduleId": "bi2-metricas",
    "track": "bi",
    "front": "¿En qué se diferencia una métrica rezagada (lagging) de una palanca operativa adelantada (leading)?",
    "back": "La métrica rezagada confirma el resultado final acumulado (ej. ingreso trimestral); la palanca adelantada mide un factor temprano y accionable (ej. unidades por pedido o frecuencia) que mueve ese resultado.",
    "tags": [
      "bi2-metricas",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-02-03",
    "lessonId": "bi2-metricas-02-arboles-kpis-palancas",
    "moduleId": "bi2-metricas",
    "track": "bi",
    "front": "¿Cómo se descompone multiplicativamente el Ticket Neto Promedio por pedido en comercio electrónico?",
    "back": "Ticket Neto por Pedido = (Unidades por Pedido) × (Precio Neto Realizado por Unidad).",
    "tags": [
      "bi2-metricas",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-02-04",
    "lessonId": "bi2-metricas-02-arboles-kpis-palancas",
    "moduleId": "bi2-metricas",
    "track": "bi",
    "front": "¿Por qué debes preagregar order_items por order_id antes de unir con orders al construir un árbol de KPIs?",
    "back": "Porque cada pedido tiene múltiples líneas de producto; unir directamente multiplicaría las filas de orders e inflaría el subtotal_usd y el conteo de pedidos.",
    "tags": [
      "bi2-metricas",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-03-01",
    "lessonId": "bi2-metricas-03-metricas-guardia",
    "moduleId": "bi2-metricas",
    "track": "bi",
    "front": "¿Qué es un umbral de guardia (guardrail threshold) y por qué debe fijarse ex ante?",
    "back": "Es el límite numérico máximo o mínimo tolerable en una métrica guardia que actúa como condición de veto. Se fija antes de medir para evitar racionalizar daños colaterales cuando la métrica primaria sube.",
    "tags": [
      "bi2-metricas",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-03-02",
    "lessonId": "bi2-metricas-03-metricas-guardia",
    "moduleId": "bi2-metricas",
    "track": "bi",
    "front": "¿Cuáles son las dos familias principales de métricas guardia en analítica y experimentación?",
    "back": "1) Guardias organizacionales de negocio (margen neto, tasa de devolución, latencia) y 2) Guardias de confiabilidad del dato o validez experimental (como Sample Ratio Mismatch, SRM).",
    "tags": [
      "bi2-metricas",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-03-03",
    "lessonId": "bi2-metricas-03-metricas-guardia",
    "moduleId": "bi2-metricas",
    "track": "bi",
    "front": "¿Qué indica un srm_p_value < 0.001 en una tabla de experimentos como EXP-PUSH-CART?",
    "back": "Indica un Sample Ratio Mismatch severo: la proporción de usuarios entre control (980) y tratamiento (620) viola el diseño aleatorio, señalando un sesgo de instrumentación que invalida los resultados.",
    "tags": [
      "bi2-metricas",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-03-04",
    "lessonId": "bi2-metricas-03-metricas-guardia",
    "moduleId": "bi2-metricas",
    "track": "bi",
    "front": "¿Qué requisito deben cumplir el numerador y el denominador de una tasa guardia en SQL?",
    "back": "Ambos deben evaluarse exactamente sobre el mismo universo y filtro canónico (por ejemplo, status IN ('completed', 'refunded')) para no mezclar poblaciones incompatibles.",
    "tags": [
      "bi2-metricas",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-04-01",
    "lessonId": "bi2-metricas-04-north-star-goodhart",
    "moduleId": "bi2-metricas",
    "track": "bi",
    "front": "¿Qué establece la ley de Goodhart en el contexto del diseño de KPIs?",
    "back": "Que cuando una medida se convierte en una meta de control o incentivo único, deja de ser una buena medida porque los equipos manipulan el indicador superficial a costa del objetivo real.",
    "tags": [
      "bi2-metricas",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-04-02",
    "lessonId": "bi2-metricas-04-north-star-goodhart",
    "moduleId": "bi2-metricas",
    "track": "bi",
    "front": "¿Qué tres condiciones debe cumplir una Métrica Estrella Polar (North Star Metric) bien diseñada?",
    "back": "1) Reflejar el valor real entregado al cliente, 2) Ser un indicador adelantado de la sostenibilidad y retención futura, y 3) Descomponerse en palancas operativas accionables.",
    "tags": [
      "bi2-metricas",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-04-03",
    "lessonId": "bi2-metricas-04-north-star-goodhart",
    "moduleId": "bi2-metricas",
    "track": "bi",
    "front": "¿Por qué la Métrica Estrella Polar de Mercado Brisa exige status = 'completed' Y COALESCE(devuelto_usd, 0) = 0?",
    "back": "Porque un pedido cancelado, pendiente o con devolución de mercancía no entregó la experiencia prometida al cliente ni consolidó valor sano para la empresa.",
    "tags": [
      "bi2-metricas",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-04-04",
    "lessonId": "bi2-metricas-04-north-star-goodhart",
    "moduleId": "bi2-metricas",
    "track": "bi",
    "front": "¿Por qué la Métrica Estrella Polar nunca debe gobernarse sin una métrica guardia financiera como el margen bruto neto?",
    "back": "Porque sin guardia de margen, un equipo podría inflar el conteo de pedidos completados sin devolución regalando precios por debajo del costo.",
    "tags": [
      "bi2-metricas",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-ms-01-a",
    "lessonId": "bi2-modelo-semantico-01-estrella-vertipaq",
    "moduleId": "bi2-modelo-semantico",
    "track": "bi",
    "front": "¿Qué factor determina principalmente el consumo de memoria RAM de una columna en el motor VertiPaq?",
    "back": "Su cardinalidad (número de valores distintos), porque define el tamaño del diccionario y la longitud de los códigos enteros por fila.",
    "tags": [
      "bi2-modelo-semantico",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-ms-01-b",
    "lessonId": "bi2-modelo-semantico-01-estrella-vertipaq",
    "moduleId": "bi2-modelo-semantico",
    "track": "bi",
    "front": "¿Qué dos roles exclusivos de tabla existen en un modelo semántico en estrella dentro de Power BI?",
    "back": "Tablas de dimensión (claves únicas y atributos descriptivos para filtrar/agrupar) y tablas de hechos (claves foráneas y números para agregar).",
    "tags": [
      "bi2-modelo-semantico",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-ms-01-c",
    "lessonId": "bi2-modelo-semantico-01-estrella-vertipaq",
    "moduleId": "bi2-modelo-semantico",
    "track": "bi",
    "front": "¿Por qué debe eliminarse `order_item_id` al importar `order_items` en un modelo semántico si ninguna otra tabla se relaciona con ella?",
    "back": "Porque tiene 100 % de cardinalidad (un valor distinto por fila), no aporta ningún filtro ni medida y genera el diccionario más pesado de la tabla.",
    "tags": [
      "bi2-modelo-semantico",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-ms-02-a",
    "lessonId": "bi2-modelo-semantico-02-relaciones-cardinalidad",
    "moduleId": "bi2-modelo-semantico",
    "track": "bi",
    "front": "¿Qué es la Blank Row que genera automáticamente el motor VertiPaq en una relación 1:N?",
    "back": "Una fila virtual en blanco añadida a la dimensión para agrupar todas las filas de la tabla de hechos cuyas claves foráneas no existen en la dimensión.",
    "tags": [
      "bi2-modelo-semantico",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-ms-02-b",
    "lessonId": "bi2-modelo-semantico-02-relaciones-cardinalidad",
    "moduleId": "bi2-modelo-semantico",
    "track": "bi",
    "front": "¿Por qué falla una relación 1:N si conectas `orders[customer_id]` directamente con `customer_changes[customer_id]` sin filtrar?",
    "back": "Porque `customer_changes` es una tabla SCD Tipo 2 donde un mismo `customer_id` se repite en varias versiones históricas (4 100 filas para 2 400 clientes).",
    "tags": [
      "bi2-modelo-semantico",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-ms-02-c",
    "lessonId": "bi2-modelo-semantico-02-relaciones-cardinalidad",
    "moduleId": "bi2-modelo-semantico",
    "track": "bi",
    "front": "¿Qué anomalía visual provoca en un reporte una relación muchos a muchos donde una entidad pertenece a dos grupos a la vez?",
    "back": "El importe de la entidad aparece completo en ambos grupos, por lo que la suma manual de las filas supera al Total general del visual.",
    "tags": [
      "bi2-modelo-semantico",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-ms-03-a",
    "lessonId": "bi2-modelo-semantico-03-direccion-filtro-cruzado",
    "moduleId": "bi2-modelo-semantico",
    "track": "bi",
    "front": "¿En qué dirección fluyen los filtros por defecto en una relación 1:N bien modelada en Power BI?",
    "back": "En dirección única (Single): desde el lado 1 (la tabla de dimensión) hacia el lado N (la tabla de hechos).",
    "tags": [
      "bi2-modelo-semantico",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-ms-03-b",
    "lessonId": "bi2-modelo-semantico-03-direccion-filtro-cruzado",
    "moduleId": "bi2-modelo-semantico",
    "track": "bi",
    "front": "¿Qué problema de modelado aparece cuando activas filtros bidireccionales en un modelo con dos o más tablas de hechos y dimensiones compartidas?",
    "back": "Ambigüedad de rutas: existen dos o más caminos para que un filtro se propague de una tabla a otra, produciendo errores o recortes inesperados.",
    "tags": [
      "bi2-modelo-semantico",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-ms-03-c",
    "lessonId": "bi2-modelo-semantico-03-direccion-filtro-cruzado",
    "moduleId": "bi2-modelo-semantico",
    "track": "bi",
    "front": "¿Qué función DAX permite habilitar el filtrado bidireccional únicamente durante el cálculo de una medida sin tocar la relación física?",
    "back": "La función `CROSSFILTER(columna1, columna2, Both)` utilizada como modificador dentro de `CALCULATE`.",
    "tags": [
      "bi2-modelo-semantico",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-ms-04-a",
    "lessonId": "bi2-modelo-semantico-04-tablas-fechas-userelationship",
    "moduleId": "bi2-modelo-semantico",
    "track": "bi",
    "front": "¿Cuáles son las cuatro condiciones que exige Power BI en la columna de fecha para marcar una tabla como tabla de fechas oficial?",
    "back": "Tipo de dato Date, valores únicos, ausencia de nulos y continuidad de fechas sin días faltantes cubriendo años completos.",
    "tags": [
      "bi2-modelo-semantico",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-ms-04-b",
    "lessonId": "bi2-modelo-semantico-04-tablas-fechas-userelationship",
    "moduleId": "bi2-modelo-semantico",
    "track": "bi",
    "front": "¿Para qué sirve la función `USERELATIONSHIP(calendar[calendar_date], refunds[refund_date])` dentro de `CALCULATE`?",
    "back": "Activa temporalmente una relación inactiva durante la evaluación de esa medida y desactiva la relación activa entre ambas tablas.",
    "tags": [
      "bi2-modelo-semantico",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-ms-04-c",
    "lessonId": "bi2-modelo-semantico-04-tablas-fechas-userelationship",
    "moduleId": "bi2-modelo-semantico",
    "track": "bi",
    "front": "¿Cómo evitas que un gráfico en Power BI ordene los meses alfabéticamente (Abril, Agosto, Diciembre...)?",
    "back": "Seleccionando la columna `month_name` y asignándole la columna numérica `month` (1 a 12) en la propiedad Ordenar por columna (Sort by column).",
    "tags": [
      "bi2-modelo-semantico",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-ms-05-a",
    "lessonId": "bi2-modelo-semantico-05-medidas-vs-columnas-calculadas",
    "moduleId": "bi2-modelo-semantico",
    "track": "bi",
    "front": "¿Cuándo se calcula una columna calculada frente a una medida en Power BI?",
    "back": "La columna calculada se evalúa durante el refresco de datos y se guarda en RAM; la medida se evalúa en tiempo de consulta según los filtros activos.",
    "tags": [
      "bi2-modelo-semantico",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-ms-05-b",
    "lessonId": "bi2-modelo-semantico-05-medidas-vs-columnas-calculadas",
    "moduleId": "bi2-modelo-semantico",
    "track": "bi",
    "front": "¿Por qué es un error crear una columna calculada `margen / ingreso` y promediarla en un visual?",
    "back": "Porque el promedio de los porcentajes por fila otorga el mismo peso a ventas minúsculas y grandes; debe usarse una medida `DIVIDE(SUM(margen), SUM(ingreso))`.",
    "tags": [
      "bi2-modelo-semantico",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi2-ms-05-c",
    "lessonId": "bi2-modelo-semantico-05-medidas-vs-columnas-calculadas",
    "moduleId": "bi2-modelo-semantico",
    "track": "bi",
    "front": "¿Qué dice la máxima de Roche sobre dónde crear una columna necesaria para un segmentador?",
    "back": "Transformar los datos tan arriba hacia el origen (SQL / almacén) como sea posible, porque las columnas de origen comprimen mejor en VertiPaq que las columnas DAX.",
    "tags": [
      "bi2-modelo-semantico",
      "bi"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-dim-01-01",
    "lessonId": "c2-dimensional-01-hechos-dimensiones-bus",
    "moduleId": "c2-dimensional",
    "track": "core",
    "front": "¿Cuáles son los 4 pasos en orden del diseño dimensional de Kimball?",
    "back": "1) Seleccionar el proceso de negocio, 2) Declarar el grano atómico, 3) Identificar las dimensiones descriptivas y 4) Identificar los hechos medibles.",
    "tags": [
      "c2-dimensional",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-dim-01-02",
    "lessonId": "c2-dimensional-01-hechos-dimensiones-bus",
    "moduleId": "c2-dimensional",
    "track": "core",
    "front": "¿Qué es una dimensión degenerada y qué ejemplo existe en Mercado Brisa?",
    "back": "Es una clave de documento operativo (como `order_id` en `order_items`) que reside en la tabla de hechos sin tabla de dimensión propia y sirve para agrupar líneas o contar transacciones únicas.",
    "tags": [
      "c2-dimensional",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-dim-01-03",
    "lessonId": "c2-dimensional-01-hechos-dimensiones-bus",
    "moduleId": "c2-dimensional",
    "track": "core",
    "front": "¿Qué función cumple la matriz de bus empresarial (Enterprise Bus Matrix)?",
    "back": "Cruza los procesos de negocio (filas) con las dimensiones conformadas compartidas (columnas) para garantizar integración técnica y semántica entre distintos esquemas en estrella.",
    "tags": [
      "c2-dimensional",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-dim-01-04",
    "lessonId": "c2-dimensional-01-hechos-dimensiones-bus",
    "moduleId": "c2-dimensional",
    "track": "core",
    "front": "¿Cómo evita el patrón Drill-Across el abismo de multiplicación (Chasm Trap)?",
    "back": "Agrega cada tabla de hechos en una CTE independiente hasta el grano de los atributos de la dimensión conformada común y luego une los resultados ya resumidos en relación 1:1.",
    "tags": [
      "c2-dimensional",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-dim-05-01",
    "lessonId": "c2-dimensional-05-hechos-instantanea-acumulativos",
    "moduleId": "c2-dimensional",
    "track": "core",
    "front": "¿Cuáles son los tres patrones principales de tablas de hechos según Ralph Kimball?",
    "back": "1) Tablas de hechos transaccionales (eventos atómicos), 2) Tablas de instantánea periódica (saldos a intervalos regulares) y 3) Tablas de instantánea acumulativa (ciclo de vida con múltiples hitos).",
    "tags": [
      "c2-dimensional",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-dim-05-02",
    "lessonId": "c2-dimensional-05-hechos-instantanea-acumulativos",
    "moduleId": "c2-dimensional",
    "track": "core",
    "front": "¿Por qué no se debe usar `SUM()` a lo largo del tiempo en una tabla de instantánea periódica?",
    "back": "Porque sus medidas representan niveles o saldos acumulados (semiaditivos); sumar los saldos de varios meses contaría múltiples veces el mismo capital o inventario.",
    "tags": [
      "c2-dimensional",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-dim-05-03",
    "lessonId": "c2-dimensional-05-hechos-instantanea-acumulativos",
    "moduleId": "c2-dimensional",
    "track": "core",
    "front": "¿Qué es una dimensión con rol múltiple (Role-Playing Dimension) en una instantánea acumulativa?",
    "back": "Es una misma dimensión física (como `calendar`) que se une varias veces a la tabla de hechos bajo distintos alias semánticos (`order_date`, `capture_date`, `refund_date`).",
    "tags": [
      "c2-dimensional",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-dim-05-04",
    "lessonId": "c2-dimensional-05-hechos-instantanea-acumulativos",
    "moduleId": "c2-dimensional",
    "track": "core",
    "front": "En Mercado Brisa, ¿qué pasa si unes `orders` con `payments` y `refunds` sin preagregar por `order_id` al armar la instantánea acumulativa?",
    "back": "Los reintentos de pago, los 405 webhooks duplicados y los reembolsos parciales multiplican las filas de órdenes (por ejemplo, `Cono Sur` sube de `6,001` a `6,510` filas).",
    "tags": [
      "c2-dimensional",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-03-01",
    "lessonId": "c2-sql-analitico-03-zonas-horarias-date-spine",
    "moduleId": "c2-sql-analitico",
    "track": "core",
    "front": "¿Por qué no debes aplicar DATE_TRUNC('day', event_ts) directamente sobre un timestamp en UTC para reportes de tiendas en Latinoamérica?",
    "back": "Porque las ventas ocurridas después de las 18:00 (en UTC-06:00) ya cruzaron las 00:00 UTC y se contabilizan en el día calendario siguiente.",
    "tags": [
      "c2-sql-analitico",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-03-02",
    "lessonId": "c2-sql-analitico-03-zonas-horarias-date-spine",
    "moduleId": "c2-sql-analitico",
    "track": "core",
    "front": "¿Qué es una espina de calendario (Date Spine) y qué problema resuelve?",
    "back": "Es una tabla o serie continua con una fila por cada unidad de tiempo que, unida con LEFT JOIN y COALESCE, materializa los días con cero eventos.",
    "tags": [
      "c2-sql-analitico",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-03-03",
    "lessonId": "c2-sql-analitico-03-zonas-horarias-date-spine",
    "moduleId": "c2-sql-analitico",
    "track": "core",
    "front": "¿Qué error ocurre si calculas AVG(v.ventas_usd) en lugar de AVG(COALESCE(v.ventas_usd, 0)) tras hacer LEFT JOIN con calendar?",
    "back": "AVG() ignora los valores NULL, por lo que divide solo entre los días con ventas activas y sobreestima el promedio diario.",
    "tags": [
      "c2-sql-analitico",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-04-01",
    "lessonId": "c2-sql-analitico-04-explain-analyze",
    "moduleId": "c2-sql-analitico",
    "track": "core",
    "front": "¿En qué dirección se lee el árbol de un plan de ejecución en EXPLAIN ANALYZE?",
    "back": "De abajo hacia arriba: las hojas inferiores son los escaneos de tablas (READ_PARQUET), el centro son uniones y agregaciones, y la raíz es la salida final.",
    "tags": [
      "c2-sql-analitico",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-04-02",
    "lessonId": "c2-sql-analitico-04-explain-analyze",
    "moduleId": "c2-sql-analitico",
    "track": "core",
    "front": "¿Qué es un predicado SARGable y por qué acelera las consultas sobre Parquet?",
    "back": "Es una condición que compara la columna cruda sin envolverla en funciones, permitiendo empujar el filtro (Filter Pushdown) y saltar bloques con zonemaps.",
    "tags": [
      "c2-sql-analitico",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-c2-04-03",
    "lessonId": "c2-sql-analitico-04-explain-analyze",
    "moduleId": "c2-sql-analitico",
    "track": "core",
    "front": "¿Qué diferencia hay entre el lado Build y el lado Probe de un operador HASH_JOIN?",
    "back": "El lado Build construye una tabla hash en memoria con la tabla más pequeña; el lado Probe recorre la tabla más grande buscando coincidencias en esa tabla hash.",
    "tags": [
      "c2-sql-analitico",
      "core"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-da2-eda-01-01",
    "lessonId": "da2-eda-01-hipotesis-preguntas-refutables",
    "moduleId": "da2-eda",
    "track": "da",
    "front": "¿Qué cuatro elementos distinguen a una hipótesis analítica refutable de una pregunta abierta?",
    "back": "1) Población y estado válido, 2) variable o grupos comparados, 3) métrica estadística resistente (como mediana e IQR) y 4) umbral o dirección numérica que refutaría la afirmación.",
    "tags": [
      "da2-eda",
      "da"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-da2-eda-01-02",
    "lessonId": "da2-eda-01-hipotesis-preguntas-refutables",
    "moduleId": "da2-eda",
    "track": "da",
    "front": "¿Por qué probar 20 cortes independientes sin hipótesis previa al 5 % de significancia invalida un hallazgo casual?",
    "back": "Porque la probabilidad de obtener al menos una diferencia aparente por puro azar muestral sube a 1 - (0.95)^20 = 64.15 % (pesca de correlaciones o falacia del francotirador).",
    "tags": [
      "da2-eda",
      "da"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-da2-eda-01-03",
    "lessonId": "da2-eda-01-hipotesis-preguntas-refutables",
    "moduleId": "da2-eda",
    "track": "da",
    "front": "¿Cómo permite la cláusula FILTER (WHERE ...) de DuckDB auditar variables de confusión en una sola consulta?",
    "back": "Calcula métricas condicionales (como MEDIAN(total_usd) FILTER (WHERE device_type = 'desktop')) en columnas paralelas para cada estrato del GROUP BY sin alterar el grano.",
    "tags": [
      "da2-eda",
      "da"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-da2-eda-01-04",
    "lessonId": "da2-eda-01-hipotesis-preguntas-refutables",
    "moduleId": "da2-eda",
    "track": "da",
    "front": "En Mercado Brisa, ¿qué ocurre al contrastar la hipótesis de que el nivel platino lidera la mediana neta por pedido?",
    "back": "Queda refutada: el nivel oro lidera la mediana neta (347.99 USD frente a 326.08 USD en platino), y bronce supera a plata en mediana neta (308.55 USD frente a 299.93 USD) por menor tasa de reembolso.",
    "tags": [
      "da2-eda",
      "da"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-da2-eda-02-01",
    "lessonId": "da2-eda-02-perfilado-tablas",
    "moduleId": "da2-eda",
    "track": "da",
    "front": "¿Qué información aporta la razón de unicidad COUNT(DISTINCT col) * 1.0 / COUNT(*) durante el perfilado?",
    "back": "Si vale 1.0 identifica una clave candidata sin duplicados; si es menor a 1.0 en una supuesta clave primaria revela duplicados técnicos; y si es muy cercana a 0 señala un dominio categórico discreto.",
    "tags": [
      "da2-eda",
      "da"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-da2-eda-02-02",
    "lessonId": "da2-eda-02-perfilado-tablas",
    "moduleId": "da2-eda",
    "track": "da",
    "front": "¿En qué se diferencia un nulo estructural de un nulo por fallo de captura en Mercado Brisa?",
    "back": "El nulo estructural ocurre porque el dato no aplica al proceso (como product_id nulo en las 9 400 filas de page_view); el fallo de captura es un dato real omitido o truncado (como los 347 códigos postales incompletos en customers).",
    "tags": [
      "da2-eda",
      "da"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-da2-eda-02-03",
    "lessonId": "da2-eda-02-perfilado-tablas",
    "moduleId": "da2-eda",
    "track": "da",
    "front": "¿Por qué COUNT(postal_code) sobreestima la completitud en la tabla customers?",
    "back": "Porque COUNT(columna) solo ignora los 218 valores NULL y cuenta como válidas las 129 filas cuyo código postal quedó truncado a 2 caracteres, pasando por alto 129 registros incompletos.",
    "tags": [
      "da2-eda",
      "da"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-da2-eda-02-04",
    "lessonId": "da2-eda-02-perfilado-tablas",
    "moduleId": "da2-eda",
    "track": "da",
    "front": "¿Cuándo conviene usar SUMMARIZE frente a una consulta SQL explícita con COUNT(DISTINCT) en DuckDB?",
    "back": "SUMMARIZE es ideal para una primera exploración rápida de todas las columnas, pero usa HyperLogLog (approx_unique); para auditar duplicados exactos de clave primaria se requiere COUNT(*) - COUNT(DISTINCT pk).",
    "tags": [
      "da2-eda",
      "da"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-da2-eda-03-01",
    "lessonId": "da2-eda-03-outliers-errores-extremos",
    "moduleId": "da2-eda",
    "track": "da",
    "front": "¿Cómo se calcula el puntaje Z modificado de Iglewicz y Hoaglin y qué umbral sugiere inspección?",
    "back": "Se calcula como M_i = 0.6745 * |x_i - mediana| / MAD, donde MAD es la desviación absoluta mediana. Un valor |M_i| > 3.5 señala una observación candidata a revisión.",
    "tags": [
      "da2-eda",
      "da"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-da2-eda-03-02",
    "lessonId": "da2-eda-03-outliers-errores-extremos",
    "moduleId": "da2-eda",
    "track": "da",
    "front": "¿Por qué la cerca inferior de Tukey no detecta el precio -9.99 USD de SKU-TEST-NEG en la categoría Accesorios?",
    "back": "Porque el rango intercuartílico de Accesorios (17.90 USD) ubica la cerca inferior en -10.76 USD; solo la regla de dominio físico list_price_usd <= 0 identifica que -9.99 USD es imposible.",
    "tags": [
      "da2-eda",
      "da"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-da2-eda-03-03",
    "lessonId": "da2-eda-03-outliers-errores-extremos",
    "moduleId": "da2-eda",
    "track": "da",
    "front": "¿Qué diferencia existe entre recortar (trimming) y winsorizar al percentil 99?",
    "back": "El recorte elimina las filas mayores al p99 reduciendo la muestra; la winsorización conserva todas las filas pero reemplaza los valores superiores al p99 por el valor exacto del p99 (LEAST(x, p99)).",
    "tags": [
      "da2-eda",
      "da"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-da2-eda-03-04",
    "lessonId": "da2-eda-03-outliers-errores-extremos",
    "moduleId": "da2-eda",
    "track": "da",
    "front": "En Mercado Brisa, ¿qué formato de tienda presenta la mayor mediana y mayor proporción de pedidos sobre la cerca de Tukey?",
    "back": "El formato warehouse, con una mediana de 480.75 USD, media original de 532.53 USD y 65 pedidos de 2 626 por encima de la cerca superior de Tukey.",
    "tags": [
      "da2-eda",
      "da"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-da2-eda-04-01",
    "lessonId": "da2-eda-04-diario-analisis-reproducible",
    "moduleId": "da2-eda",
    "track": "da",
    "front": "¿Qué es una tabla de atrición en el análisis exploratorio de datos?",
    "back": "Es una consulta secuencial (construida con CTEs encadenadas y UNION ALL) que registra cuántas filas, entidades e importe permanecen y cuántos se descartan tras cada filtro aplicado desde la tabla cruda.",
    "tags": [
      "da2-eda",
      "da"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-da2-eda-04-02",
    "lessonId": "da2-eda-04-diario-analisis-reproducible",
    "moduleId": "da2-eda",
    "track": "da",
    "front": "¿Por qué cada CTE de una tabla de atrición debe consultar únicamente a la CTE inmediata anterior?",
    "back": "Para garantizar que los recortes sean estrictamente acumulativos y que la diferencia entre el paso k y el paso k-1 mida el efecto aislado de una sola regla.",
    "tags": [
      "da2-eda",
      "da"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-da2-eda-04-03",
    "lessonId": "da2-eda-04-diario-analisis-reproducible",
    "moduleId": "da2-eda",
    "track": "da",
    "front": "En Mercado Brisa, ¿cuánto dinero inflaba la conciliación de pagos al omitir el paso de deduplicación de webhooks en payments?",
    "back": "Inflaba el resultado en 154 053.92 USD (369 pagos duplicados en estado captured asociados a pedidos completados: 6 423 516.34 USD frente a los 6 269 462.42 USD reales).",
    "tags": [
      "da2-eda",
      "da"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-da2-eda-04-04",
    "lessonId": "da2-eda-04-diario-analisis-reproducible",
    "moduleId": "da2-eda",
    "track": "da",
    "front": "¿Qué problema técnico de los cuadernos tradicionales resuelve un cuaderno reactivo basado en un DAG como Marimo?",
    "back": "Elimina el estado oculto de celdas ejecutadas fuera de orden al almacenar el cuaderno como script .py puro y recalcular automáticamente en orden determinista todas las celdas dependientes.",
    "tags": [
      "da2-eda",
      "da"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-da2-01-a",
    "lessonId": "da2-inferencia-01-probabilidad-bayes",
    "moduleId": "da2-inferencia",
    "track": "da",
    "front": "¿Qué diferencia operativa hay entre P(Fallo | Método) y P(Método | Fallo)?",
    "back": "P(Fallo | Método) divide los fallos del método entre todos los intentos de ese método (riesgo interno); P(Método | Fallo) los divide entre todos los fallos de la empresa (participación en el problema).",
    "tags": [
      "da2-inferencia",
      "da"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-da2-01-b",
    "lessonId": "da2-inferencia-01-probabilidad-bayes",
    "moduleId": "da2-inferencia",
    "track": "da",
    "front": "¿En qué consiste la falacia de la tasa base al evaluar un sistema de alertas?",
    "back": "En juzgar la probabilidad de que una alerta sea verdadera mirando solo la sensibilidad del detector e ignorando cuán raro es el evento real P(A) en la población.",
    "tags": [
      "da2-inferencia",
      "da"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-da2-01-c",
    "lessonId": "da2-inferencia-01-probabilidad-bayes",
    "moduleId": "da2-inferencia",
    "track": "da",
    "front": "¿Por qué las frecuencias naturales facilitan la aplicación del teorema de Bayes en SQL?",
    "back": "Porque convierten probabilidades anidadas en conteos enteros de casos totales y casos positivos sobre una misma tabla base.",
    "tags": [
      "da2-inferencia",
      "da"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-da2-02-a",
    "lessonId": "da2-inferencia-02-distribuciones-probabilidad",
    "moduleId": "da2-inferencia",
    "track": "da",
    "front": "¿Cuándo se prefiere la distribución de Poisson frente a la binomial?",
    "back": "Cuando contamos eventos independientes en un intervalo continuo de tiempo o espacio (como devoluciones por día) sin un número fijo y pequeño de ensayos n.",
    "tags": [
      "da2-inferencia",
      "da"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-da2-02-b",
    "lessonId": "da2-inferencia-02-distribuciones-probabilidad",
    "moduleId": "da2-inferencia",
    "track": "da",
    "front": "¿Qué propiedad caracteriza a una variable X con distribución log-normal?",
    "back": "X solo toma valores positivos y su logaritmo natural Y = ln(X) sigue una distribución normal simétrica.",
    "tags": [
      "da2-inferencia",
      "da"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-da2-02-c",
    "lessonId": "da2-inferencia-02-distribuciones-probabilidad",
    "moduleId": "da2-inferencia",
    "track": "da",
    "front": "¿Cómo se calcula la media geométrica de una variable positiva X en SQL?",
    "back": "Mediante EXP(AVG(LN(X))), que exponencia el promedio de los logaritmos naturales.",
    "tags": [
      "da2-inferencia",
      "da"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-da2-03-a",
    "lessonId": "da2-inferencia-03-muestreo-tlc-error-estandar",
    "moduleId": "da2-inferencia",
    "track": "da",
    "front": "¿Cuál es la fórmula del error estándar de la media muestral y qué mide?",
    "back": "EE(x̄) = s / √n. Mide la desviación estándar de la distribución muestral del promedio, es decir, cuánto fluctuaría x̄ entre muestras repetidas de tamaño n.",
    "tags": [
      "da2-inferencia",
      "da"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-da2-03-b",
    "lessonId": "da2-inferencia-03-muestreo-tlc-error-estandar",
    "moduleId": "da2-inferencia",
    "track": "da",
    "front": "¿Por qué necesitamos cuadruplicar la muestra para reducir el error estándar a la mitad?",
    "back": "Porque el tamaño muestral n actúa dentro de una raíz cuadrada en el denominador (√(4n) = 2√n).",
    "tags": [
      "da2-inferencia",
      "da"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-da2-03-c",
    "lessonId": "da2-inferencia-03-muestreo-tlc-error-estandar",
    "moduleId": "da2-inferencia",
    "track": "da",
    "front": "¿El teorema del límite central vuelve normales los pedidos individuales de una tienda?",
    "back": "No. Los pedidos individuales conservan su distribución original (por ejemplo, log-normal); lo que se vuelve normal es la distribución del promedio muestral x̄.",
    "tags": [
      "da2-inferencia",
      "da"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-da2-04-a",
    "lessonId": "da2-inferencia-04-intervalos-confianza",
    "moduleId": "da2-inferencia",
    "track": "da",
    "front": "¿Cómo se construye un intervalo de confianza al 95 % para la media en muestras grandes?",
    "back": "IC_95% = x̄ ± 1.96 · (s / √n), donde x̄ es la media muestral, s la desviación estándar muestral y n el tamaño de la muestra.",
    "tags": [
      "da2-inferencia",
      "da"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-da2-04-b",
    "lessonId": "da2-inferencia-04-intervalos-confianza",
    "moduleId": "da2-inferencia",
    "track": "da",
    "front": "¿Por qué es falso decir que el IC 95 % de la media contiene al 95 % de los pedidos de una tienda?",
    "back": "Porque el IC de la media utiliza el error estándar s / √n para acotar el promedio poblacional μ, no la desviación estándar individual s.",
    "tags": [
      "da2-inferencia",
      "da"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-da2-04-c",
    "lessonId": "da2-inferencia-04-intervalos-confianza",
    "moduleId": "da2-inferencia",
    "track": "da",
    "front": "¿Cuál es el error estándar de una proporción muestral p̂ sobre n ensayos?",
    "back": "EE(p̂) = √[ p̂ · (1 - p̂) / n ].",
    "tags": [
      "da2-inferencia",
      "da"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-da2-05-a",
    "lessonId": "da2-inferencia-05-pruebas-hipotesis-valor-p",
    "moduleId": "da2-inferencia",
    "track": "da",
    "front": "¿Por qué en el error estándar de la diferencia de dos medias se suman las varianzas (s1²/n1 + s2²/n2)?",
    "back": "Porque al restar dos variables aleatorias independientes sus incertidumbres muestrales se acumulan: Var(A - B) = Var(A) + Var(B).",
    "tags": [
      "da2-inferencia",
      "da"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-da2-05-b",
    "lessonId": "da2-inferencia-05-pruebas-hipotesis-valor-p",
    "moduleId": "da2-inferencia",
    "track": "da",
    "front": "¿Qué diferencia existe entre significancia estadística (valor p) y tamaño del efecto (d de Cohen)?",
    "back": "El valor p indica si hay evidencia para distinguir el efecto del azar (y depende de n); la d de Cohen mide qué tan grande es la diferencia en desviaciones estándar (sin depender de n).",
    "tags": [
      "da2-inferencia",
      "da"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-da2-05-c",
    "lessonId": "da2-inferencia-05-pruebas-hipotesis-valor-p",
    "moduleId": "da2-inferencia",
    "track": "da",
    "front": "¿Qué falacia comete quien afirma que \"p = 0.04 significa 4 % de probabilidad de que H0 sea cierta\"?",
    "back": "La falacia de la condicional transpuesta: confunde P(Datos extremos | H0) con P(H0 | Datos).",
    "tags": [
      "da2-inferencia",
      "da"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-da2-06-a",
    "lessonId": "da2-inferencia-06-errores-potencia-tamano-muestra",
    "moduleId": "da2-inferencia",
    "track": "da",
    "front": "¿Qué diferencia hay entre el error Tipo I (α) y el error Tipo II (β) en una prueba de negocio?",
    "back": "El error Tipo I (α) consiste en declarar ganador un cambio que en realidad no tiene efecto (falso positivo); el error Tipo II (β) consiste en descartar un cambio que sí tenía un efecto real (falso negativo).",
    "tags": [
      "da2-inferencia",
      "da"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-da2-06-b",
    "lessonId": "da2-inferencia-06-errores-potencia-tamano-muestra",
    "moduleId": "da2-inferencia",
    "track": "da",
    "front": "¿Por qué reducir el MDE a la mitad obliga a multiplicar por 4 el tamaño de muestra por brazo?",
    "back": "Porque en la ecuación n = 2(z_α/2 + z_β)² · σ² / Δ², el MDE (Δ) aparece elevado al cuadrado en el denominador.",
    "tags": [
      "da2-inferencia",
      "da"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-da2-06-c",
    "lessonId": "da2-inferencia-06-errores-potencia-tamano-muestra",
    "moduleId": "da2-inferencia",
    "track": "da",
    "front": "¿Por qué es peligroso revisar el valor p todos los días y detener la prueba apenas baje de 0.05?",
    "back": "Porque el monitoreo continuo con parada temprana (peeking) acumula múltiples oportunidades de cruce azaroso e infla drásticamente la tasa real de falsos positivos (error Tipo I).",
    "tags": [
      "da2-inferencia",
      "da"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-04-a",
    "lessonId": "de2-formatos-04-codificacion-compresion-zstd",
    "moduleId": "de2-formatos",
    "track": "de",
    "front": "¿En qué orden se aplican RLE_DICTIONARY y Zstandard al escribir una página de datos en Parquet?",
    "back": "Primero RLE_DICTIONARY reemplaza valores repetidos por índices enteros y agrupa rachas; después Zstandard comprime los bytes de esa página codificada.",
    "tags": [
      "de2-formatos",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-04-b",
    "lessonId": "de2-formatos-04-codificacion-compresion-zstd",
    "moduleId": "de2-formatos",
    "track": "de",
    "front": "¿Para qué tipo de columnas está diseñada la codificación DELTA_BINARY_PACKED de Parquet v2?",
    "back": "Para columnas de enteros o marcas temporales secuenciales donde la diferencia entre filas consecutivas es pequeña.",
    "tags": [
      "de2-formatos",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-04-c",
    "lessonId": "de2-formatos-04-codificacion-compresion-zstd",
    "moduleId": "de2-formatos",
    "track": "de",
    "front": "¿Por qué `campaign_id` y `status` en `orders.parquet` alcanzan razones de compresión superiores a 32x?",
    "back": "Porque tienen muy baja cardinalidad (4 valores posibles) y se codifican como índices de 2 bits en PLAIN_DICTIONARY antes de comprimirse con ZSTD.",
    "tags": [
      "de2-formatos",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-05-a",
    "lessonId": "de2-formatos-05-particionado-archivos-pequenos",
    "moduleId": "de2-formatos",
    "track": "de",
    "front": "¿Qué es el particionado estilo Hive (Hive partitioning)?",
    "back": "Es una convención de directorios clave=valor/ que permite a los motores analíticos aplicar partition pruning y omitir carpetas completas según el filtro WHERE.",
    "tags": [
      "de2-formatos",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-05-b",
    "lessonId": "de2-formatos-05-particionado-archivos-pequenos",
    "moduleId": "de2-formatos",
    "track": "de",
    "front": "¿Qué causa el problema de los archivos pequeños (small files problem) en un lago de datos?",
    "back": "Particionar por columnas de alta cardinalidad o escribir micro-lotes sin compactación, generando miles de archivos donde la latencia HTTP y los footers superan a la lectura útil.",
    "tags": [
      "de2-formatos",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-05-c",
    "lessonId": "de2-formatos-05-particionado-archivos-pequenos",
    "moduleId": "de2-formatos",
    "track": "de",
    "front": "¿Por qué ordenar físicamente (ORDER BY) al escribir un archivo Parquet acelera las consultas?",
    "back": "Porque agrupa los valores similares en páginas contiguas, estrechando los estadísticos [min, max] (zone maps) y alargando las rachas de valores repetidos para RLE.",
    "tags": [
      "de2-formatos",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-pip-01-a",
    "lessonId": "de2-pipelines-01-etl-vs-elt",
    "moduleId": "de2-pipelines",
    "track": "de",
    "front": "¿Por qué el patrón ELT facilita recalcular métricas históricas cuando cambia una regla de negocio?",
    "back": "Porque conserva los lotes crudos inmutables en la capa Bronce, permitiendo reejecutar las vistas SQL hacia Plata y Oro sin volver a extraer del origen.",
    "tags": [
      "de2-pipelines",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-pip-01-b",
    "lessonId": "de2-pipelines-01-etl-vs-elt",
    "moduleId": "de2-pipelines",
    "track": "de",
    "front": "¿Cuándo es obligatorio aplicar una transformación antes de guardar en la capa Bronce (ETL)?",
    "back": "Cuando una norma legal o de seguridad (como GDPR o PCI-DSS) prohíbe almacenar datos personales o financieros en claro en el almacenamiento de objetos.",
    "tags": [
      "de2-pipelines",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-pip-01-c",
    "lessonId": "de2-pipelines-01-etl-vs-elt",
    "moduleId": "de2-pipelines",
    "track": "de",
    "front": "¿Qué responsabilidad cumple cada capa de la arquitectura Medallion (Bronce, Plata, Oro)?",
    "back": "Bronce guarda el dato crudo inmutable con metadatos de ingesta; Plata limpia tipos, duplicados y reglas de calidad; Oro agrega métricas de negocio para BI.",
    "tags": [
      "de2-pipelines",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-pip-02-a",
    "lessonId": "de2-pipelines-02-idempotencia-backfill",
    "moduleId": "de2-pipelines",
    "track": "de",
    "front": "¿Qué significa que una tarea de un pipeline de datos sea idempotente?",
    "back": "Que ejecutarla una vez o múltiples veces con los mismos parámetros de entrada deja la tabla destino exactamente con las mismas filas y valores.",
    "tags": [
      "de2-pipelines",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-pip-02-b",
    "lessonId": "de2-pipelines-02-idempotencia-backfill",
    "moduleId": "de2-pipelines",
    "track": "de",
    "front": "¿Por qué debe evitarse CURRENT_DATE o NOW() en las cláusulas WHERE de un pipeline por lotes?",
    "back": "Porque acoplan el resultado al reloj físico del servidor e impiden reprocesar ventanas históricas (backfill) de forma determinista.",
    "tags": [
      "de2-pipelines",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-pip-02-c",
    "lessonId": "de2-pipelines-02-idempotencia-backfill",
    "moduleId": "de2-pipelines",
    "track": "de",
    "front": "¿Qué cláusula de DuckDB permite filtrar directamente el resultado de ROW_NUMBER() sin envolver la consulta en otra subconsulta?",
    "back": "La cláusula QUALIFY, por ejemplo QUALIFY ROW_NUMBER() OVER (PARTITION BY order_id, attempt_number ORDER BY processed_at DESC, payment_id ASC) = 1.",
    "tags": [
      "de2-pipelines",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-pip-03-a",
    "lessonId": "de2-pipelines-03-cargas-incrementales-merge",
    "moduleId": "de2-pipelines",
    "track": "de",
    "front": "¿Qué es una marca de agua de lote (high-water mark) en una carga incremental?",
    "back": "Es el valor máximo de la columna de tiempo o secuencia procesado en la última corrida exitosa, usado como punto de partida del siguiente lote.",
    "tags": [
      "de2-pipelines",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-pip-03-b",
    "lessonId": "de2-pipelines-03-cargas-incrementales-merge",
    "moduleId": "de2-pipelines",
    "track": "de",
    "front": "¿Por qué un bloque USING en MERGE INTO falla si el lote origen contiene dos filas con el mismo order_id?",
    "back": "Porque una sentencia MERGE no puede decidir de forma determinista cuál de las dos filas origen aplicar sobre la única fila correspondiente en la tabla destino.",
    "tags": [
      "de2-pipelines",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-pip-03-c",
    "lessonId": "de2-pipelines-03-cargas-incrementales-merge",
    "moduleId": "de2-pipelines",
    "track": "de",
    "front": "¿Para qué sirve restar una ventana de solapamiento (lookback window) a la marca de agua incremental?",
    "back": "Para capturar datos de llegada tardía (late-arriving data) que se generaron antes del corte anterior pero se confirmaron minutos después.",
    "tags": [
      "de2-pipelines",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-pip-04-a",
    "lessonId": "de2-pipelines-04-ingesta-apis-http",
    "moduleId": "de2-pipelines",
    "track": "de",
    "front": "¿Qué es la deriva de página (page drift) en la paginación por offset?",
    "back": "Es el desplazamiento de filas entre páginas cuando se insertan o borran registros en vivo mientras el cliente recorre la colección, provocando duplicados o saltos.",
    "tags": [
      "de2-pipelines",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-pip-04-b",
    "lessonId": "de2-pipelines-04-ingesta-apis-http",
    "moduleId": "de2-pipelines",
    "track": "de",
    "front": "¿Cómo debe responder un extractor de datos cuando recibe HTTP 429 Too Many Requests con encabezado Retry-After?",
    "back": "Debe pausar las peticiones durante el número de segundos indicado en Retry-After (o aplicar espera exponencial con jitter) antes de reintentar la misma página.",
    "tags": [
      "de2-pipelines",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-pip-04-c",
    "lessonId": "de2-pipelines-04-ingesta-apis-http",
    "moduleId": "de2-pipelines",
    "track": "de",
    "front": "¿Por qué conviene guardar payload_json completo en la capa Bronce al ingerir desde una API REST?",
    "back": "Porque permite extraer en el futuro nuevos atributos anidados usando funciones SQL como json_extract_string sin tener que reextraer el historial desde la API.",
    "tags": [
      "de2-pipelines",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-pip-05-a",
    "lessonId": "de2-pipelines-05-orquestacion-airflow-dagster",
    "moduleId": "de2-pipelines",
    "track": "de",
    "front": "¿Qué ventaja ofrece disparar un pipeline por actualización de un Data Asset frente a un horario cron fijo?",
    "back": "Evita que el reporte o transformación aguas abajo corra con datos incompletos si la ingesta previa se retrasa unos minutos.",
    "tags": [
      "de2-pipelines",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-pip-05-b",
    "lessonId": "de2-pipelines-05-orquestacion-airflow-dagster",
    "moduleId": "de2-pipelines",
    "track": "de",
    "front": "En Apache Airflow 3, ¿desde qué módulo se importan @dag, @task y Asset, y qué variable reemplaza a execution_date?",
    "back": "Se importan desde airflow.sdk y se utiliza logical_date (junto al parámetro schedule en lugar de schedule_interval).",
    "tags": [
      "de2-pipelines",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-pip-05-c",
    "lessonId": "de2-pipelines-05-orquestacion-airflow-dagster",
    "moduleId": "de2-pipelines",
    "track": "de",
    "front": "¿Por qué no deben enviarse tablas de millones de filas a través de XCom entre tareas de un orquestador?",
    "back": "Porque XCom almacena metadatos en la base del orquestador; pasar datos pesados agota la RAM y debe reemplazarse por URIs en almacenamiento de objetos.",
    "tags": [
      "de2-pipelines",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-pip-06-a",
    "lessonId": "de2-pipelines-06-contenedores-docker-compose",
    "moduleId": "de2-pipelines",
    "track": "de",
    "front": "¿Qué aporta un Dockerfile multietapa (multi-stage build) al empaquetar un pipeline en Python?",
    "back": "Permite compilar e instalar dependencias en una imagen builder y copiar únicamente el entorno virtual limpio a una imagen runtime pequeña y segura.",
    "tags": [
      "de2-pipelines",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-pip-06-b",
    "lessonId": "de2-pipelines-06-contenedores-docker-compose",
    "moduleId": "de2-pipelines",
    "track": "de",
    "front": "¿Por qué es necesario combinar depends_on con healthcheck y condition: service_healthy en compose.yaml?",
    "back": "Porque depends_on por sí solo únicamente espera al arranque del contenedor, no a que la base de datos haya terminado de inicializar y acepte conexiones SQL.",
    "tags": [
      "de2-pipelines",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-de2-pip-06-c",
    "lessonId": "de2-pipelines-06-contenedores-docker-compose",
    "moduleId": "de2-pipelines",
    "track": "de",
    "front": "¿Qué es un smoke test de datos al finalizar la ejecución de un contenedor de ingesta?",
    "back": "Es una consulta SQL de verificación que comprueba invariantes (conteo de filas, llaves no nulas y cuadratura de sumas) antes de publicar el activo.",
    "tags": [
      "de2-pipelines",
      "de"
    ],
    "difficulty": 2
  },
  {
    "id": "fc-bi3-02-1",
    "lessonId": "bi3-dashboards-02-jerarquia-visual-reticula-10s",
    "moduleId": "bi3-dashboards",
    "track": "bi",
    "front": "¿Qué establece la regla de los 10 segundos en el diseño de tableros?",
    "back": "Que el usuario debe identificar el estado general del negocio y detectar cualquier anomalía crítica en menos de 10 segundos dentro de una sola pantalla sin hacer scroll.",
    "tags": [
      "bi3-dashboards",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-02-2",
    "lessonId": "bi3-dashboards-02-jerarquia-visual-reticula-10s",
    "moduleId": "bi3-dashboards",
    "track": "bi",
    "front": "¿Cómo influyen los patrones de lectura en F y en Z en la distribución de una retícula de 12 columnas?",
    "back": "Ambos patrones inician la fijación ocular en la esquina superior izquierda y barren horizontalmente la fila superior, por lo que allí deben colocarse los KPIs globales más importantes.",
    "tags": [
      "bi3-dashboards",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-02-3",
    "lessonId": "bi3-dashboards-02-jerarquia-visual-reticula-10s",
    "moduleId": "bi3-dashboards",
    "track": "bi",
    "front": "¿Qué tres datos mínimos debe contener una tarjeta KPI en la franja superior de un tablero?",
    "back": "La cifra del periodo actual, el valor de referencia (meta o periodo anterior) y la variación explícita (porcentual o absoluta).",
    "tags": [
      "bi3-dashboards",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-02-4",
    "lessonId": "bi3-dashboards-02-jerarquia-visual-reticula-10s",
    "moduleId": "bi3-dashboards",
    "track": "bi",
    "front": "En Mercado Brisa 2024, ¿qué formato de tienda lidera la productividad en dólares por metro cuadrado?",
    "back": "El formato retail con $602,78/m² ($1.519.007,30 en 2.520 m²), superando a flagship ($292,16/m²) y warehouse ($54,65/m²).",
    "tags": [
      "bi3-dashboards",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-03-1",
    "lessonId": "bi3-dashboards-03-color-contraste-wcag-daltonismo",
    "moduleId": "bi3-dashboards",
    "track": "bi",
    "front": "¿En qué consiste la regla 90/10 del color en el diseño de tableros?",
    "back": "En construir el 90 % de los elementos de contexto con tonos neutros (grises o desaturados) y reservar el 10 % de color saturado exclusivamente para alertas o datos que requieren acción.",
    "tags": [
      "bi3-dashboards",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-03-2",
    "lessonId": "bi3-dashboards-03-color-contraste-wcag-daltonismo",
    "moduleId": "bi3-dashboards",
    "track": "bi",
    "front": "¿Qué umbrales de contraste exigen los criterios 1.4.3 y 1.4.11 de W3C WCAG 2.2 Nivel AA?",
    "back": "Al menos 4,5:1 para texto normal (3:1 para texto grande >= 18pt o >= 14pt negrita) bajo SC 1.4.3, y al menos 3:1 para objetos gráficos y controles activos bajo SC 1.4.11.",
    "tags": [
      "bi3-dashboards",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-03-3",
    "lessonId": "bi3-dashboards-03-color-contraste-wcag-daltonismo",
    "moduleId": "bi3-dashboards",
    "track": "bi",
    "front": "¿Por qué debe evitarse el semáforo rojo-verde y qué alternativa proponen Masataka Okabe y Kei Ito?",
    "back": "Porque cerca del 8 % de los hombres padece deuteranopía o protanopía y confunde rojo y verde de igual luminancia; Okabe e Ito proponen combinar azul (#0072B2) y naranja/bermellón (#D55E00).",
    "tags": [
      "bi3-dashboards",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-03-4",
    "lessonId": "bi3-dashboards-03-color-contraste-wcag-daltonismo",
    "moduleId": "bi3-dashboards",
    "track": "bi",
    "front": "¿Qué exige el Criterio 1.4.1 (Use of Color) de WCAG 2.2 en una tabla o gráfico de estados?",
    "back": "Que el color nunca sea el único medio visual para transmitir información; debe acompañarse de doble codificación como etiquetas textuales (\"[ALERT]\"), signos (+/-) o iconos (▲/●).",
    "tags": [
      "bi3-dashboards",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-04-1",
    "lessonId": "bi3-dashboards-04-interaccion-filtros-drill-tooltips",
    "moduleId": "bi3-dashboards",
    "track": "bi",
    "front": "¿Cuál es el mantra de búsqueda de información visual de Ben Shneiderman y cómo guía el diseño de un tablero?",
    "back": "\"Overview first, zoom and filter, then details-on-demand\": mostrar primero el estado global, ofrecer filtros acotados después y desplegar el grano fino solo bajo demanda.",
    "tags": [
      "bi3-dashboards",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-04-2",
    "lessonId": "bi3-dashboards-04-interaccion-filtros-drill-tooltips",
    "moduleId": "bi3-dashboards",
    "track": "bi",
    "front": "¿Qué diferencia práctica existe entre un report page tooltip y una página de drill-through?",
    "back": "El tooltip aparece al pasar el cursor (hover) para un vistazo rápido sin interacción interna; el drill-through navega a una página completa filtrada por la entidad para auditar detalles.",
    "tags": [
      "bi3-dashboards",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-04-3",
    "lessonId": "bi3-dashboards-04-interaccion-filtros-drill-tooltips",
    "moduleId": "bi3-dashboards",
    "track": "bi",
    "front": "¿Por qué es peligroso filtrar una columna de la tabla de hechos en el WHERE externo después de un LEFT JOIN desde la dimensión?",
    "back": "Porque en las entidades sin hechos esa columna vale NULL, y el predicado WHERE descarta esas filas convirtiendo el LEFT JOIN en un INNER JOIN silencioso.",
    "tags": [
      "bi3-dashboards",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-04-4",
    "lessonId": "bi3-dashboards-04-interaccion-filtros-drill-tooltips",
    "moduleId": "bi3-dashboards",
    "track": "bi",
    "front": "¿Qué elementos componen un estado vacío informativo (informative empty state) en un tablero?",
    "back": "Un valor numérico explícito (0 mediante COALESCE en lugar de blanco), un mensaje que explique que no hubo eventos para ese filtro y una acción clara para restablecer los filtros.",
    "tags": [
      "bi3-dashboards",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-05-1",
    "lessonId": "bi3-dashboards-05-tablero-ejecutivo-vs-operativo",
    "moduleId": "bi3-dashboards",
    "track": "bi",
    "front": "¿Cuáles son los tres tipos de tableros según Stephen Few y qué objetivo persigue cada uno?",
    "back": "Estratégico (monitorear objetivos ejecutivos a largo plazo), Analítico (investigar causas y tendencias con mayor interactividad) y Operativo (supervisar procesos en curso y resolver excepciones inmediatas).",
    "tags": [
      "bi3-dashboards",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-05-2",
    "lessonId": "bi3-dashboards-05-tablero-ejecutivo-vs-operativo",
    "moduleId": "bi3-dashboards",
    "track": "bi",
    "front": "¿En qué se diferencian el grano y la latencia de refresco de un tablero ejecutivo frente a uno operativo?",
    "back": "El tablero ejecutivo usa grano agregado (mes/región) con refresco diario o semanal; el operativo usa grano de entidad o transacción (tienda/pedido) con refresco intradía o en tiempo real.",
    "tags": [
      "bi3-dashboards",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-05-3",
    "lessonId": "bi3-dashboards-05-tablero-ejecutivo-vs-operativo",
    "moduleId": "bi3-dashboards",
    "track": "bi",
    "front": "¿Por qué un monitor operativo debe mostrar tanto la tasa porcentual de excepción como el importe en dólares afectado?",
    "back": "Porque la tasa porcentual detecta fallos agudos en tiendas medianas sin sesgo de volumen, mientras el importe en dólares cuantifica el impacto financiero a recuperar.",
    "tags": [
      "bi3-dashboards",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-05-4",
    "lessonId": "bi3-dashboards-05-tablero-ejecutivo-vs-operativo",
    "moduleId": "bi3-dashboards",
    "track": "bi",
    "front": "En Mercado Brisa 2024, ¿qué tienda presenta la mayor tasa de excepción operativa (cancelled + pending) y cuál es su valor?",
    "back": "Tienda Polanco Sur (store_id = 2, Norteamérica) con 14,80 % de sus pedidos en excepción (41 de 277 pedidos, por un valor de $19.367,51).",
    "tags": [
      "bi3-dashboards",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-gob-01-01",
    "lessonId": "bi3-gobierno-01-capa-semantica-metricflow-cube",
    "moduleId": "bi3-gobierno",
    "track": "bi",
    "front": "¿Qué diferencia existe entre una `measure` y una `metric` en dbt MetricFlow?",
    "back": "Una `measure` es una agregación atómica (`sum`, `count`, `count_distinct`) definida dentro de un único `semantic_model`, mientras que una `metric` es el indicador expuesto al negocio (`simple`, `ratio`, `derived`, `cumulative` o `conversion`) que puede combinar una o varias medidas.",
    "tags": [
      "bi3-gobierno",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-gob-01-02",
    "lessonId": "bi3-gobierno-01-capa-semantica-metricflow-cube",
    "moduleId": "bi3-gobierno",
    "track": "bi",
    "front": "¿Cómo resuelve el planificador de MetricFlow o Cube una consulta que pide medidas de `orders`, `order_items` y `refunds` agrupadas por `region`?",
    "back": "Genera una CTE de preagregación independiente para cada tabla de hechos agrupada por `region` y luego une las CTEs por `region` en una relación 1:1 antes de evaluar métricas derivadas o ratios.",
    "tags": [
      "bi3-gobierno",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-gob-01-03",
    "lessonId": "bi3-gobierno-01-capa-semantica-metricflow-cube",
    "moduleId": "bi3-gobierno",
    "track": "bi",
    "front": "¿Por qué `SUM(DISTINCT o.total_usd)` no es una solución válida frente al fan-out de un JOIN 1:N?",
    "back": "Porque si dos pedidos distintos tienen legítimamente el mismo importe en `total_usd`, la cláusula `DISTINCT` colapsa ambos importes en uno solo y subestima el ingreso total.",
    "tags": [
      "bi3-gobierno",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-gob-01-04",
    "lessonId": "bi3-gobierno-01-capa-semantica-metricflow-cube",
    "moduleId": "bi3-gobierno",
    "track": "bi",
    "front": "¿Qué tipos de relación (`relationship`) declara Cube en su bloque `joins` para construir el grafo dirigido entre cubos?",
    "back": "Declara `has_many` (uno a muchos), `belongs_to` (muchos a uno) y `has_one` (uno a uno), utilizando `primary_key: true` para identificar el grano de cada cubo.",
    "tags": [
      "bi3-gobierno",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-gob-02-01",
    "lessonId": "bi3-gobierno-02-rls-estatica-dinamica-columnas",
    "moduleId": "bi3-gobierno",
    "track": "bi",
    "front": "¿Qué ventaja aporta la RLS dinámica con `USERPRINCIPALNAME()` frente a la RLS estática?",
    "back": "Permite mantener un único rol de seguridad cuya cobertura se actualiza automáticamente al modificar las filas de la tabla de permisos (`entitlements`), sin reeditar ni republicar el modelo semántico.",
    "tags": [
      "bi3-gobierno",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-gob-02-02",
    "lessonId": "bi3-gobierno-02-rls-estatica-dinamica-columnas",
    "moduleId": "bi3-gobierno",
    "track": "bi",
    "front": "¿Por qué un usuario con permiso `Contributor` o `Member` en un área de trabajo de Power BI ve todas las filas aunque exista un rol de RLS activo?",
    "back": "Porque en Power BI y Microsoft Fabric las reglas de RLS y OLS solo restringen a los usuarios con permiso de solo lectura (`Viewer`); los roles con capacidad de edición tienen acceso completo al modelo subyacente.",
    "tags": [
      "bi3-gobierno",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-gob-02-03",
    "lessonId": "bi3-gobierno-02-rls-estatica-dinamica-columnas",
    "moduleId": "bi3-gobierno",
    "track": "bi",
    "front": "¿Cuál es la diferencia de seguridad entre marcar una columna como `IsHidden = true` y aplicar Object-Level Security (OLS)?",
    "back": "`IsHidden = true` solo oculta la columna en la interfaz visual pero permite consultarla mediante DAX o Excel; OLS (`metadataPermission: none`) bloquea el acceso a los datos y elimina la columna de los metadatos para el rol restringido.",
    "tags": [
      "bi3-gobierno",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-gob-03-01",
    "lessonId": "bi3-gobierno-03-certificacion-metricas-obsolescencia",
    "moduleId": "bi3-gobierno",
    "track": "bi",
    "front": "¿Qué diferencia de responsabilidades existe entre el propietario funcional (*Data Steward*) y el propietario técnico de una métrica certificada?",
    "back": "El propietario funcional define y aprueba la regla de negocio (qué eventos e importes entran o salen de la fórmula), mientras que el propietario técnico codifica el modelo semántico, automatiza los tests de calidad y mantiene el SLA de actualización.",
    "tags": [
      "bi3-gobierno",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-gob-03-02",
    "lessonId": "bi3-gobierno-03-certificacion-metricas-obsolescencia",
    "moduleId": "bi3-gobierno",
    "track": "bi",
    "front": "¿Por qué no se debe sobrescribir en caliente la fórmula de una métrica pública cuando cambia una regla contable?",
    "back": "Porque altera sin previo aviso las cifras históricas de los paneles existentes y rompe la comparabilidad; debe publicarse una versión `v2` y fijar una `deprecation_date` sobre `v1`.",
    "tags": [
      "bi3-gobierno",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-gob-03-03",
    "lessonId": "bi3-gobierno-03-certificacion-metricas-obsolescencia",
    "moduleId": "bi3-gobierno",
    "track": "bi",
    "front": "¿Para qué sirve declarar recursos `exposures` en dbt dentro del gobierno de métricas?",
    "back": "Permite registrar en el grafo de linaje qué paneles ejecutivos, informes o aplicaciones dependen de cada métrica y quién es su propietario (`owner`) para notificarles antes de retirar una versión obsoleta.",
    "tags": [
      "bi3-gobierno",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-gob-04-01",
    "lessonId": "bi3-gobierno-04-import-directquery-direct-lake",
    "moduleId": "bi3-gobierno",
    "track": "bi",
    "front": "¿Qué función cumple el modo de almacenamiento `Dual` en un modelo compuesto de Power BI?",
    "back": "Permite que una tabla de dimensión se almacene simultáneamente en memoria (VertiPaq) y en el origen SQL, actuando como Import al filtrar agregaciones en caché y como DirectQuery al filtrar tablas de detalle remotas.",
    "tags": [
      "bi3-gobierno",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-gob-04-02",
    "lessonId": "bi3-gobierno-04-import-directquery-direct-lake",
    "moduleId": "bi3-gobierno",
    "track": "bi",
    "front": "¿Qué causas provocan que un modelo en modo `Direct Lake` haga repliegue (`fallback`) hacia `DirectQuery`?",
    "back": "Construir el modelo sobre vistas SQL en lugar de tablas Delta/Parquet físicas, superar los límites de memoria o número de filas de la capacidad (guardrails), o aplicar reglas de seguridad SQL en el endpoint analítico.",
    "tags": [
      "bi3-gobierno",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-gob-04-03",
    "lessonId": "bi3-gobierno-04-import-directquery-direct-lake",
    "moduleId": "bi3-gobierno",
    "track": "bi",
    "front": "¿Por qué un rollup mensual por tienda (`store_id`, `month`) no puede responder directamente una consulta de `COUNT(DISTINCT customer_id)` anual sin preconfiguración especial?",
    "back": "Porque el conteo distinto no es aditivo a través del tiempo: un mismo cliente que compra en enero y en febrero se contaría dos veces al sumar los conteos distintos mensuales.",
    "tags": [
      "bi3-gobierno",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-gob-05-01",
    "lessonId": "bi3-gobierno-05-equivalencia-lookml-tableau-pbi",
    "moduleId": "bi3-gobierno",
    "track": "bi",
    "front": "¿Cuál es el equivalente en Power BI (DAX) y en SQL de la expresión de Tableau `{ FIXED [region] : SUM([total_usd]) }` cuando el visual está desglosado por `region` y `store_type`?",
    "back": "En DAX equivale a `CALCULATE(SUM(orders[total_usd]), ALLEXCEPT(stores, stores[region]))` (o `REMOVEFILTERS(stores[store_type])`), y en SQL a una CTE agrupada por `region` o a la función de ventana `SUM(SUM(total_usd)) OVER (PARTITION BY region)`.",
    "tags": [
      "bi3-gobierno",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-gob-05-02",
    "lessonId": "bi3-gobierno-05-equivalencia-lookml-tableau-pbi",
    "moduleId": "bi3-gobierno",
    "track": "bi",
    "front": "¿Cómo evita Looker que una medida `type: sum` se multiplique al cruzar una vista padre con una vista hija en una relación `one_to_many`?",
    "back": "Utiliza `symmetric_aggregates: yes`, apoyándose en la dimensión marcada con `primary_key: yes` para generar una expresión `SUM(DISTINCT ...)` con desplazamiento hash por clave primaria.",
    "tags": [
      "bi3-gobierno",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi3-gob-05-03",
    "lessonId": "bi3-gobierno-05-equivalencia-lookml-tableau-pbi",
    "moduleId": "bi3-gobierno",
    "track": "bi",
    "front": "¿Cómo se implementa la seguridad a nivel de fila (RLS) dinámica por atributo de usuario en LookML, Tableau y Power BI?",
    "back": "En LookML mediante `access_filter` vinculado a un `user_attribute`; en Tableau cruzando una tabla de permisos con `USERNAME()` o `ISMEMBEROF()`; y en Power BI filtrando la tabla de permisos con `USERPRINCIPALNAME()`.",
    "tags": [
      "bi3-gobierno",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da3-prod-01-01",
    "lessonId": "da3-producto-01-embudos-conversion-ventana",
    "moduleId": "da3-producto",
    "track": "da",
    "front": "¿Por qué debe filtrarse event_date >= signup_date antes de aplicar MIN(event_date) en un embudo de activación post-registro?",
    "back": "Porque los eventos anónimos previos al alta se vinculan retroactivamente al customer_id; sin ese filtro, MIN() devuelve una fecha anterior al registro y rompe el cálculo de la ventana.",
    "tags": [
      "da3-producto",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da3-prod-01-02",
    "lessonId": "da3-producto-01-embudos-conversion-ventana",
    "moduleId": "da3-producto",
    "track": "da",
    "front": "¿Qué diferencia existe entre la tasa de conversión global y la tasa de conversión por paso en un embudo?",
    "back": "La tasa global divide el paso k entre el paso 1 inicial (N_k / N_1), mientras la tasa por paso divide el paso k entre el paso inmediato anterior (N_k / N_{k-1}) para localizar el cuello de botella.",
    "tags": [
      "da3-producto",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da3-prod-01-03",
    "lessonId": "da3-producto-01-embudos-conversion-ventana",
    "moduleId": "da3-producto",
    "track": "da",
    "front": "¿Por qué cada paso k de un embudo estricto en SQL debe repetir las condiciones booleanas de los pasos 1 a k-1?",
    "back": "Para garantizar monotonicidad (N_1 >= N_2 >= ... >= N_k) y asegurar que solo cuenten en el paso k quienes completaron todos los pasos previos en orden y en plazo.",
    "tags": [
      "da3-producto",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da3-prod-03-01",
    "lessonId": "da3-producto-03-segmentacion-conductual-rfm",
    "moduleId": "da3-producto",
    "track": "da",
    "front": "¿Por qué debemos usar una fecha de corte explícita (como DATE '2025-12-01') en lugar de CURRENT_DATE al calcular recency_days?",
    "back": "Para garantizar que el análisis sea determinista y reproducible en cualquier fecha en que se reejecute la consulta.",
    "tags": [
      "da3-producto",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da3-prod-03-02",
    "lessonId": "da3-producto-03-segmentacion-conductual-rfm",
    "moduleId": "da3-producto",
    "track": "da",
    "front": "¿Por qué es obligatorio envolver entre paréntesis (f_score >= 3 OR m_score >= 4) al combinarlo con r_score <= 2 AND ... en SQL?",
    "back": "Porque en SQL el operador AND tiene mayor precedencia que OR; sin paréntesis se evaluaría (r_score <= 2 AND f_score >= 3) OR m_score >= 4.",
    "tags": [
      "da3-producto",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da3-prod-03-03",
    "lessonId": "da3-producto-03-segmentacion-conductual-rfm",
    "moduleId": "da3-producto",
    "track": "da",
    "front": "¿Qué acción comercial corresponde al segmento 1_Campeones frente al segmento 3_En_Riesgo_Alto_Valor?",
    "back": "A Campeones se les ofrece acceso anticipado o fidelización sin erosionar margen; los descuentos de reactivación se reservan para En Riesgo de Alto Valor.",
    "tags": [
      "da3-producto",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da3-prod-04-01",
    "lessonId": "da3-producto-04-atribucion-marketing-incrementalidad",
    "moduleId": "da3-producto",
    "track": "da",
    "front": "¿Por qué es necesario añadir un filtro DATEDIFF('hour', tp.event_ts, o.order_ts) <= 24 después de un ASOF LEFT JOIN de atribución?",
    "back": "Porque ASOF LEFT JOIN devuelve el evento previo más cercano aunque haya ocurrido meses atrás; la ventana evita atribuir el pedido a un toque caducado.",
    "tags": [
      "da3-producto",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da3-prod-04-02",
    "lessonId": "da3-producto-04-atribucion-marketing-incrementalidad",
    "moduleId": "da3-producto",
    "track": "da",
    "front": "¿Por qué la campaña CMP-VERANO pasa de un ROAS de 0,96 en primer toque a 1,53 en último toque?",
    "back": "Porque intercepta el último clic previo al pago de clientes que ya habían sido originados y fidelizados por otras campañas.",
    "tags": [
      "da3-producto",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da3-prod-04-03",
    "lessonId": "da3-producto-04-atribucion-marketing-incrementalidad",
    "moduleId": "da3-producto",
    "track": "da",
    "front": "¿Qué indica un srm_p_value = 0,0001 en un experimento como EXP-PUSH-CART y qué decisión implica?",
    "back": "Indica un desbalance severo en la asignación aleatoria (Sample Ratio Mismatch: 980 control vs 620 tratamiento), por lo que el experimento debe invalidarse.",
    "tags": [
      "da3-producto",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de3-t02-01",
    "lessonId": "de3-transformacion-02-tests-unitarios-auditorias-dag",
    "moduleId": "de3-transformacion",
    "track": "de",
    "front": "¿Cuándo aprueba una prueba de datos (`data test` en dbt o `audit` en SQLMesh)?",
    "back": "Aprueba únicamente cuando la consulta SQL de validación devuelve cero filas (`COUNT(*) = 0`); cualquier fila devuelta representa un registro que viola la invariante.",
    "tags": [
      "de3-transformacion",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de3-t02-02",
    "lessonId": "de3-transformacion-02-tests-unitarios-auditorias-dag",
    "moduleId": "de3-transformacion",
    "track": "de",
    "front": "¿Por qué las pruebas de datos sobre tablas reales no sustituyen a las pruebas unitarias SQL?",
    "back": "Porque las pruebas de datos solo evalúan los valores presentes hoy en el almacén; las pruebas unitarias inyectan casos borde sintéticos para verificar la lógica antes de que ocurra el fallo en producción.",
    "tags": [
      "de3-transformacion",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de3-t02-03",
    "lessonId": "de3-transformacion-02-tests-unitarios-auditorias-dag",
    "moduleId": "de3-transformacion",
    "track": "de",
    "front": "¿Qué diferencia operativa existe entre `blocking: true` (`severity: error`) y `blocking: false` (`severity: warn`) en una auditoría?",
    "back": "Una auditoría bloqueante aborta el intercambio de la vista productiva y detiene los nodos descendientes del DAG; una no bloqueante registra la alerta pero permite publicar el modelo.",
    "tags": [
      "de3-transformacion",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de3-t02-04",
    "lessonId": "de3-transformacion-02-tests-unitarios-auditorias-dag",
    "moduleId": "de3-transformacion",
    "track": "de",
    "front": "En Mercado Brisa, ¿qué diferencia hay entre una orden con `failed_count > 0 AND captured_count = 1` y una con `captured_count > 1`?",
    "back": "La primera es una recuperación legítima tras un reintento fallido (1 solo cobro efectivo); la segunda es una anomalía crítica de doble cobro que requiere deduplicación o bloqueo.",
    "tags": [
      "de3-transformacion",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de3-t04-01",
    "lessonId": "de3-transformacion-04-observabilidad-openlineage",
    "moduleId": "de3-transformacion",
    "track": "de",
    "front": "¿Cuáles son los cuatro pilares de la observabilidad de datos y qué problema resuelven frente a los tests binarios?",
    "back": "Frescura, volumen, distribución y esquema/linaje; permiten detectar degradaciones graduales y anomalías silenciosas que no rompen una regla fija de nulidad o clave única.",
    "tags": [
      "de3-transformacion",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de3-t04-02",
    "lessonId": "de3-transformacion-04-observabilidad-openlineage",
    "moduleId": "de3-transformacion",
    "track": "de",
    "front": "¿Cuáles son las tres entidades centrales del modelo de objetos de OpenLineage?",
    "back": "`Job` (definición del proceso o consulta), `Dataset` (tabla o activo de entrada/salida) y `Run` (ejecución individual que transita por estados `START`, `COMPLETE` o `FAIL`).",
    "tags": [
      "de3-transformacion",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de3-t04-03",
    "lessonId": "de3-transformacion-04-observabilidad-openlineage",
    "moduleId": "de3-transformacion",
    "track": "de",
    "front": "En `ColumnLineageDatasetFacet` de OpenLineage, ¿qué diferencia hay entre una transformación `DIRECT` y una `INDIRECT`?",
    "back": "`DIRECT` indica que el campo de entrada alimenta directamente el valor de la columna de salida; `INDIRECT` indica que condiciona el resultado mediante un filtro `WHERE`, `JOIN`, `GROUP BY` o `QUALIFY`.",
    "tags": [
      "de3-transformacion",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de3-t04-04",
    "lessonId": "de3-transformacion-04-observabilidad-openlineage",
    "moduleId": "de3-transformacion",
    "track": "de",
    "front": "¿Para qué sirve combinar análisis aguas arriba (*upstream*) y aguas abajo (*downstream*) en un grafo de linaje?",
    "back": "El recorrido upstream localiza la tabla o microservicio origen que causó el incidente (causa raíz), y el recorrido downstream enumera todos los modelos y dashboards afectados (análisis de impacto).",
    "tags": [
      "de3-transformacion",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi4-01-a",
    "lessonId": "bi4-operacion-01-bi-como-codigo-evidence-observable-rill",
    "moduleId": "bi4-operacion",
    "track": "bi",
    "front": "¿Qué es un data loader en Observable Framework?",
    "back": "Es un script o consulta que se ejecuta en tiempo de compilación (build-time) para generar una instantánea estática (como un archivo Parquet) que el navegador consulta localmente con DuckDB-Wasm.",
    "tags": [
      "bi4-operacion",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi4-01-b",
    "lessonId": "bi4-operacion-01-bi-como-codigo-evidence-observable-rill",
    "moduleId": "bi4-operacion",
    "track": "bi",
    "front": "¿Cómo funciona el encadenamiento de consultas (Universal SQL) en Evidence?",
    "back": "Permite que un bloque SQL dentro de una página Markdown consulte el resultado de otro bloque SQL previo referenciándolo como `${nombre_bloque}` sobre DuckDB-Wasm.",
    "tags": [
      "bi4-operacion",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi4-01-c",
    "lessonId": "bi4-operacion-01-bi-como-codigo-evidence-observable-rill",
    "moduleId": "bi4-operacion",
    "track": "bi",
    "front": "¿Qué tres carpetas estructuran un proyecto declarativo en Rill Data?",
    "back": "`sources/` (conectores de ingesta en YAML), `models/` (transformaciones SQL en DuckDB) y `metrics_views/` (definición YAML de dimensiones y medidas).",
    "tags": [
      "bi4-operacion",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi4-01-d",
    "lessonId": "bi4-operacion-01-bi-como-codigo-evidence-observable-rill",
    "moduleId": "bi4-operacion",
    "track": "bi",
    "front": "¿Por qué ocurre una trampa de abismo al unir orders, order_items y refunds en un solo SELECT?",
    "back": "Porque `order_items` (1:N) y `refunds` (1:M) son relaciones independientes hacia `orders`; unirlas sin preagregar por `order_id` multiplica las filas de ambas tablas entre sí.",
    "tags": [
      "bi4-operacion",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi4-02-a",
    "lessonId": "bi4-operacion-02-pbip-tmdl-versionado-git",
    "moduleId": "bi4-operacion",
    "track": "bi",
    "front": "¿Qué dos carpetas principales genera al guardarse un proyecto Power BI (PBIP)?",
    "back": "`<Nombre>.SemanticModel` (que contiene la definición del modelo tabular en TMDL) y `<Nombre>.Report` (que contiene la definición visual en formato PBIR).",
    "tags": [
      "bi4-operacion",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi4-02-b",
    "lessonId": "bi4-operacion-02-pbip-tmdl-versionado-git",
    "moduleId": "bi4-operacion",
    "track": "bi",
    "front": "¿Qué archivo dentro de un proyecto PBIP contiene la caché en memoria de VertiPaq y nunca debe subirse a Git?",
    "back": "El archivo `.pbi/cache.abf` (junto con `.pbi/localSettings.json`), que debe excluirse siempre en `.gitignore`.",
    "tags": [
      "bi4-operacion",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi4-02-c",
    "lessonId": "bi4-operacion-02-pbip-tmdl-versionado-git",
    "moduleId": "bi4-operacion",
    "track": "bi",
    "front": "¿Dónde se almacenan las medidas DAX cuando un modelo semántico utiliza el formato TMDL?",
    "back": "Dentro del archivo `.tmdl` de la tabla anfitriona, bajo la ruta `*.SemanticModel/definition/tables/<nombre_tabla>.tmdl`.",
    "tags": [
      "bi4-operacion",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi4-02-d",
    "lessonId": "bi4-operacion-02-pbip-tmdl-versionado-git",
    "moduleId": "bi4-operacion",
    "track": "bi",
    "front": "¿Qué función cumple la propiedad lineageTag en un archivo TMDL?",
    "back": "Identifica de forma inmutable cada objeto del modelo (tabla, columna o medida) para que renombrarlo no rompa los objetos visuales que lo referencian en `.Report`.",
    "tags": [
      "bi4-operacion",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi4-03-a",
    "lessonId": "bi4-operacion-03-cicd-pruebas-promocion-entornos",
    "moduleId": "bi4-operacion",
    "track": "bi",
    "front": "¿Qué tres validaciones componen un pipeline de integración continua (CI) para un proyecto BI como código?",
    "back": "1) Validación sintáctica y de referencias PBIR/TMDL, 2) análisis estático de metadatos con reglas BPA, y 3) pruebas automatizadas de reconciliación numérica en SQL.",
    "tags": [
      "bi4-operacion",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi4-03-b",
    "lessonId": "bi4-operacion-03-cicd-pruebas-promocion-entornos",
    "moduleId": "bi4-operacion",
    "track": "bi",
    "front": "¿Por qué una prueba CI que compara SUM(orders.total_usd) contra SUM(payments.amount_usd) en un JOIN directo puede dar un falso positivo?",
    "back": "Porque los pedidos con más de un cobro capturado duplican la fila de `orders` en el `JOIN`, inflando `SUM(orders.total_usd)` al mismo ritmo que `payments`.",
    "tags": [
      "bi4-operacion",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi4-03-c",
    "lessonId": "bi4-operacion-03-cicd-pruebas-promocion-entornos",
    "moduleId": "bi4-operacion",
    "track": "bi",
    "front": "¿Cómo se evita editar archivos .tmdl manualmente al promover un modelo de Test a Production?",
    "back": "Declarando parámetros de conexión en `expressions.tmdl` y aplicando reglas de despliegue (deployment rules) en el pipeline de promoción.",
    "tags": [
      "bi4-operacion",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi4-03-d",
    "lessonId": "bi4-operacion-03-cicd-pruebas-promocion-entornos",
    "moduleId": "bi4-operacion",
    "track": "bi",
    "front": "En Mercado Brisa, ¿por qué difieren orders.discount_usd y SUM(order_items.discount_usd) aunque orders.subtotal_usd coincide exactamente con SUM(order_items.line_total_usd)?",
    "back": "Porque `order_items.line_total_usd` ya deduce el descuento de línea (`order_items.discount_usd`), mientras que `orders.discount_usd` registra cupones o descuentos adicionales aplicados a la cabecera del pedido.",
    "tags": [
      "bi4-operacion",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi4-04-a",
    "lessonId": "bi4-operacion-04-telemetria-adopcion-retiro-tableros",
    "moduleId": "bi4-operacion",
    "track": "bi",
    "front": "¿Qué es un tablero zombi dentro de la operación de BI?",
    "back": "Un reporte cuyo modelo semántico consume recursos diarios de cómputo en refrescos programados pero registra cero lectores únicos durante una ventana prolongada (por ejemplo, 60 o 90 días).",
    "tags": [
      "bi4-operacion",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi4-04-b",
    "lessonId": "bi4-operacion-04-telemetria-adopcion-retiro-tableros",
    "moduleId": "bi4-operacion",
    "track": "bi",
    "front": "¿Qué indica una proporción alta de eventos ExportArtifact frente a ViewReport en un tablero?",
    "back": "Que los usuarios utilizan el reporte como puente de extracción manual hacia hojas de cálculo porque la vista actual no responde directamente su pregunta analítica.",
    "tags": [
      "bi4-operacion",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi4-04-c",
    "lessonId": "bi4-operacion-04-telemetria-adopcion-retiro-tableros",
    "moduleId": "bi4-operacion",
    "track": "bi",
    "front": "¿Cuáles son las cuatro fases del protocolo de retiro ordenado de tableros?",
    "back": "1) Detección por telemetría, 2) aviso previo de deprecación al propietario y lectores, 3) cuarentena de 30 días (ocultamiento y pausa de refresco) y 4) retiro definitivo con respaldo en Git.",
    "tags": [
      "bi4-operacion",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi4-04-d",
    "lessonId": "bi4-operacion-04-telemetria-adopcion-retiro-tableros",
    "moduleId": "bi4-operacion",
    "track": "bi",
    "front": "¿Por qué es insuficiente usar COUNT(*) sin COUNT(DISTINCT user_id) para medir la adopción de un reporte?",
    "back": "Porque un único usuario o su propio autor recargando la página decenas de veces infla `COUNT(*)`, aparentando adopción organizacional donde solo hay un lector.",
    "tags": [
      "bi4-operacion",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi4-05-a",
    "lessonId": "bi4-operacion-05-genbi-auditable-sinonimos-mcp",
    "moduleId": "bi4-operacion",
    "track": "bi",
    "front": "¿Por qué un agente text-to-SQL libre sobreestima los ingresos de Mercado Brisa en 2024 cuando se le pide \"ventas netas\"?",
    "back": "Porque suma `orders.total_usd` sobre todos los estados (incluyendo cancelados, pendientes y reembolsados, más impuestos y envío) e ignora la resta de `refunds`.",
    "tags": [
      "bi4-operacion",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi4-05-b",
    "lessonId": "bi4-operacion-05-genbi-auditable-sinonimos-mcp",
    "moduleId": "bi4-operacion",
    "track": "bi",
    "front": "¿Qué es la desambiguación de sinónimos semánticos en GenBI?",
    "back": "Es la asignación unívoca de cada término coloquial de negocio a una sola medida certificada, ocultando las columnas físicas para impedir colisiones léxicas.",
    "tags": [
      "bi4-operacion",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi4-05-c",
    "lessonId": "bi4-operacion-05-genbi-auditable-sinonimos-mcp",
    "moduleId": "bi4-operacion",
    "track": "bi",
    "front": "¿Qué dos primitivas de Model Context Protocol (MCP) estructuran la consulta a una capa semántica?",
    "back": "`Resources` (para leer el catálogo de métricas, dimensiones, grano y sinónimos) y `Tools` (para ejecutar consultas parametrizadas sobre métricas certificadas).",
    "tags": [
      "bi4-operacion",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-bi4-05-d",
    "lessonId": "bi4-operacion-05-genbi-auditable-sinonimos-mcp",
    "moduleId": "bi4-operacion",
    "track": "bi",
    "front": "¿Qué elementos integran una cita verificable en una respuesta de GenBI?",
    "back": "El `metric_id`, la versión o commit del modelo semántico (`semantic_version`), las dimensiones y filtros aplicados, y la consulta de reconciliación reproducible.",
    "tags": [
      "bi4-operacion",
      "bi"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-01-1",
    "lessonId": "da4-causalidad-01-diferencias-en-diferencias-did",
    "moduleId": "da4-causalidad",
    "track": "da",
    "front": "¿Qué dos fuentes de sesgo elimina el estimador DiD 2x2?",
    "back": "Elimina las diferencias permanentes de nivel entre el grupo tratado y el de control (mediante la resta pre/post) y los choques temporales comunes a ambos grupos (mediante la resta entre cohortes).",
    "tags": [
      "da4-causalidad",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-01-2",
    "lessonId": "da4-causalidad-01-diferencias-en-diferencias-did",
    "moduleId": "da4-causalidad",
    "track": "da",
    "front": "¿En qué consiste una prueba de placebo temporal en un estudio DiD?",
    "back": "Consiste en calcular el estimador DiD entre dos periodos anteriores a la intervención (por ejemplo, FY24-Q1 y FY24-Q2) donde ninguna unidad estaba tratada y el efecto debe ser cercano a cero.",
    "tags": [
      "da4-causalidad",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-01-3",
    "lessonId": "da4-causalidad-01-diferencias-en-diferencias-did",
    "moduleId": "da4-causalidad",
    "track": "da",
    "front": "¿Cómo se construye el valor contrafactual postintervención del grupo tratado en DiD?",
    "back": "Sumando a la media preintervención del grupo tratado la variación temporal media experimentada por el grupo de control entre el preperiodo y el postperiodo.",
    "tags": [
      "da4-causalidad",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-01-4",
    "lessonId": "da4-causalidad-01-diferencias-en-diferencias-did",
    "moduleId": "da4-causalidad",
    "track": "da",
    "front": "¿Qué es un confusor variante en el tiempo en un diseño de diferencias en diferencias?",
    "back": "Es un factor externo, como un aumento regional del gasto en marketing_spend, que cambia al mismo tiempo que el tratamiento pero afecta solo a uno de los grupos.",
    "tags": [
      "da4-causalidad",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-02-1",
    "lessonId": "da4-causalidad-02-regresion-discontinua-rdd",
    "moduleId": "da4-causalidad",
    "track": "da",
    "front": "¿Qué es la variable de asignación (running variable) en un diseño RDD?",
    "back": "Es la métrica continua observable (como subtotal_usd en orders) cuyo cruce por un umbral fijo c determina si una unidad es elegible para el tratamiento.",
    "tags": [
      "da4-causalidad",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-02-2",
    "lessonId": "da4-causalidad-02-regresion-discontinua-rdd",
    "moduleId": "da4-causalidad",
    "track": "da",
    "front": "¿Por qué es indispensable centrar la variable de asignación como X - c antes de usar REGR_INTERCEPT?",
    "back": "Porque REGR_INTERCEPT evalúa la recta donde la variable explicativa vale cero; al usar X - c, el cero corresponde exactamente al punto de corte X = c.",
    "tags": [
      "da4-causalidad",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-02-3",
    "lessonId": "da4-causalidad-02-regresion-discontinua-rdd",
    "moduleId": "da4-causalidad",
    "track": "da",
    "front": "¿Qué diferencia a un RDD nítido (Sharp) de un RDD difuso (Fuzzy)?",
    "back": "En el RDD nítido la probabilidad de tratamiento salta de 0 a 1 en el corte; en el RDD difuso salta en menos de 1 y el salto del resultado se divide entre el salto de cumplimiento.",
    "tags": [
      "da4-causalidad",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-02-4",
    "lessonId": "da4-causalidad-02-regresion-discontinua-rdd",
    "moduleId": "da4-causalidad",
    "track": "da",
    "front": "¿Qué busca detectar el chequeo de densidad alrededor del umbral en un estudio RDD?",
    "back": "Busca detectar manipulación estratégica (bunching), es decir, si los usuarios o agentes fuerzan sus valores justo por encima del umbral y rompen la comparabilidad local.",
    "tags": [
      "da4-causalidad",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-03-1",
    "lessonId": "da4-causalidad-03-control-sintetico-emparejamiento",
    "moduleId": "da4-causalidad",
    "track": "da",
    "front": "¿Qué es la condición de soporte común en el emparejamiento por celdas?",
    "back": "Es el requisito de que en cada estrato o celda de covariables donde existan unidades tratadas haya también al menos una unidad de control para poder calcular la diferencia.",
    "tags": [
      "da4-causalidad",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-03-2",
    "lessonId": "da4-causalidad-03-control-sintetico-emparejamiento",
    "moduleId": "da4-causalidad",
    "track": "da",
    "front": "¿Cómo se ponderan las diferencias de cada celda para obtener el efecto medio sobre los tratados (ATT)?",
    "back": "Cada celda con soporte común se pondera por la proporción de unidades tratadas que caen en ella respecto al total de unidades tratadas (N_{T,s} / N_T).",
    "tags": [
      "da4-causalidad",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-03-3",
    "lessonId": "da4-causalidad-03-control-sintetico-emparejamiento",
    "moduleId": "da4-causalidad",
    "track": "da",
    "front": "¿Qué dos restricciones matemáticas cumplen los pesos de un control sintético?",
    "back": "Todos los pesos de las unidades donantes son mayores o iguales a cero (w_j >= 0) y la suma de todos los pesos es exactamente igual a uno.",
    "tags": [
      "da4-causalidad",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-03-4",
    "lessonId": "da4-causalidad-03-control-sintetico-emparejamiento",
    "moduleId": "da4-causalidad",
    "track": "da",
    "front": "¿Qué mide el RMSPE preintervención en un estudio de control sintético?",
    "back": "Mide la raíz del error cuadrático medio entre la serie real de la unidad tratada y su gemelo sintético antes del tratamiento; si es grande, el contrafactual no es fiable.",
    "tags": [
      "da4-causalidad",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-04-1",
    "lessonId": "da4-causalidad-04-memo-analitico-supuestos",
    "moduleId": "da4-causalidad",
    "track": "da",
    "front": "¿Qué significan las siglas SCQA en la apertura de un memo analítico?",
    "back": "Situación (hecho estable acordado), Complicación (cambio o riesgo que exige actuar), Pregunta (dilema central) y Respuesta (tesis gobernante y recomendación cuantificada).",
    "tags": [
      "da4-causalidad",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-04-2",
    "lessonId": "da4-causalidad-04-memo-analitico-supuestos",
    "moduleId": "da4-causalidad",
    "track": "da",
    "front": "¿Por qué la tabla de evidencia de un memo debe incluir una columna de validez interna junto al intervalo de confianza?",
    "back": "Porque un intervalo de confianza estrecho (como [4.72, 6.82] USD en EXP-PUSH-CART) carece de valor causal si el experimento sufrió un fallo de asignación como SRM.",
    "tags": [
      "da4-causalidad",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-04-3",
    "lessonId": "da4-causalidad-04-memo-analitico-supuestos",
    "moduleId": "da4-causalidad",
    "track": "da",
    "front": "¿Qué diferencia existe entre una amenaza de validez interna y un límite de validez externa?",
    "back": "La validez interna evalúa si el efecto es cierto dentro de la muestra estudiada; la validez externa evalúa si ese efecto puede transportarse a otras tiendas, canales o umbrales.",
    "tags": [
      "da4-causalidad",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-04-4",
    "lessonId": "da4-causalidad-04-memo-analitico-supuestos",
    "moduleId": "da4-causalidad",
    "track": "da",
    "front": "¿Cómo debe presentarse un supuesto de identificación en un memo dirigido a dirección?",
    "back": "Traducido a una condición comercial concreta y acompañado del resultado numérico de la prueba de falsación (por ejemplo, el placebo temporal o el cruce con marketing_spend).",
    "tags": [
      "da4-causalidad",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-05-1",
    "lessonId": "da4-causalidad-05-presentacion-direccion-decisiones",
    "moduleId": "da4-causalidad",
    "track": "da",
    "front": "¿Cómo se calculan los tres escenarios financieros (conservador, central y optimista) en una matriz de decisión?",
    "back": "Restando el costo umbral unitario de la intervención al límite inferior del IC 95 %, a la estimación puntual y al límite superior del IC 95 %.",
    "tags": [
      "da4-causalidad",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-05-2",
    "lessonId": "da4-causalidad-05-presentacion-direccion-decisiones",
    "moduleId": "da4-causalidad",
    "track": "da",
    "front": "¿Qué representan el Error Tipo I y el Error Tipo II en una decisión de inversión sobre un programa?",
    "back": "El Error Tipo I (falso positivo) es escalar un programa deficitario asumiendo sus costos hundidos; el Error Tipo II (falso negativo) es descartar un programa rentable perdiendo su margen incremental.",
    "tags": [
      "da4-causalidad",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-05-3",
    "lessonId": "da4-causalidad-05-presentacion-direccion-decisiones",
    "moduleId": "da4-causalidad",
    "track": "da",
    "front": "¿Qué es una métrica de guardarrail (guardrail metric) y cómo se audita en Mercado Brisa?",
    "back": "Es un indicador operativo o financiero (como la tasa de reembolsos en refunds y el ingreso neto posdevolución) que no debe deteriorarse al mejorar la métrica primaria.",
    "tags": [
      "da4-causalidad",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-05-4",
    "lessonId": "da4-causalidad-05-presentacion-direccion-decisiones",
    "moduleId": "da4-causalidad",
    "track": "da",
    "front": "¿Cuándo prescribe la matriz de decisión un piloto acotado (2_piloto_acotado) en lugar de un despliegue general?",
    "back": "Cuando la estimación central supera el costo de equilibrio (margen central >= 0), pero el límite inferior del IC 95 % arroja pérdida neta (margen conservador < 0).",
    "tags": [
      "da4-causalidad",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-01-01",
    "lessonId": "da4-modelos-01-regresion-lineal-multiple",
    "moduleId": "da4-modelos",
    "track": "da",
    "front": "¿Qué orden de argumentos reciben REGR_SLOPE y REGR_INTERCEPT en DuckDB?",
    "back": "Reciben primero la variable dependiente o respuesta y, y en segundo lugar la variable explicativa o regresor x: REGR_SLOPE(y, x).",
    "tags": [
      "da4-modelos",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-01-02",
    "lessonId": "da4-modelos-01-regresion-lineal-multiple",
    "moduleId": "da4-modelos",
    "track": "da",
    "front": "¿Cómo se interpreta una pendiente en una regresión lineal múltiple?",
    "back": "Representa el cambio esperado en la respuesta y cuando ese predictor aumenta en una unidad, manteniendo constantes todas las demás variables explicativas.",
    "tags": [
      "da4-modelos",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-01-03",
    "lessonId": "da4-modelos-01-regresion-lineal-multiple",
    "moduleId": "da4-modelos",
    "track": "da",
    "front": "¿Qué mide el factor de inflación de la varianza (VIF) y qué umbral alerta de peligro?",
    "back": "Mide cuánto se multiplica la varianza del coeficiente estimado por colinealidad con otros predictores (1 / (1 - R²_j)). Valores superiores a 5 indican colinealidad severa.",
    "tags": [
      "da4-modelos",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-01-04",
    "lessonId": "da4-modelos-01-regresion-lineal-multiple",
    "moduleId": "da4-modelos",
    "track": "da",
    "front": "¿Qué ocurre cuando los residuos de una regresión presentan heterocedasticidad?",
    "back": "La dispersión del error cambia según el nivel del predictor, por lo que los errores estándar ordinarios y sus valores p dejan de ser fiables.",
    "tags": [
      "da4-modelos",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-02-01",
    "lessonId": "da4-modelos-02-regresion-logistica-calibracion",
    "moduleId": "da4-modelos",
    "track": "da",
    "front": "¿Qué diferencia hay entre la probabilidad p de un evento y sus momios (odds)?",
    "back": "La probabilidad p es la proporción de casos positivos sobre el total, mientras que los momios son el cociente p / (1 - p) entre que ocurra y que no ocurra.",
    "tags": [
      "da4-modelos",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-02-02",
    "lessonId": "da4-modelos-02-regresion-logistica-calibracion",
    "moduleId": "da4-modelos",
    "track": "da",
    "front": "¿Cómo se obtiene la razón de momios (odds ratio) a partir de un coeficiente logístico beta?",
    "back": "Aplicando la función exponencial OR = exp(beta). Si beta = 0, entonces OR = 1 y el predictor no altera los momios del evento.",
    "tags": [
      "da4-modelos",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-02-03",
    "lessonId": "da4-modelos-02-regresion-logistica-calibracion",
    "moduleId": "da4-modelos",
    "track": "da",
    "front": "¿Qué evalúa el puntaje de Brier en clasificación probabilística?",
    "back": "Calcula el promedio de (p_predicha - y_real)^2 entre todas las observaciones; valores cercanos a cero indican probabilidades bien calibradas y discriminativas.",
    "tags": [
      "da4-modelos",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-02-04",
    "lessonId": "da4-modelos-02-regresion-logistica-calibracion",
    "moduleId": "da4-modelos",
    "track": "da",
    "front": "¿Cómo se calcula el umbral de probabilidad óptimo con costes de error asimétricos?",
    "back": "Se divide el coste de un falso positivo entre la suma del coste de falso positivo y falso negativo: C_FP / (C_FP + C_FN).",
    "tags": [
      "da4-modelos",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-03-01",
    "lessonId": "da4-modelos-03-series-temporales-descomposicion",
    "moduleId": "da4-modelos",
    "track": "da",
    "front": "¿Cuáles son los tres componentes de una descomposición aditiva de series temporales?",
    "back": "Tendencia-ciclo (T_t), estacionalidad periódica (S_t) y residuo irregular (R_t), relacionados mediante Y_t = T_t + S_t + R_t.",
    "tags": [
      "da4-modelos",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-03-02",
    "lessonId": "da4-modelos-03-series-temporales-descomposicion",
    "moduleId": "da4-modelos",
    "track": "da",
    "front": "¿Por qué se elige una ventana de exactamente 7 días para suavizar una serie diaria comercial?",
    "back": "Porque el ciclo estacional principal es semanal; al promediar 7 días consecutivos se incluye un día de cada tipo y el efecto estacional se cancela.",
    "tags": [
      "da4-modelos",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-03-03",
    "lessonId": "da4-modelos-03-series-temporales-descomposicion",
    "moduleId": "da4-modelos",
    "track": "da",
    "front": "¿Cuándo se debe usar ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING y cuándo está prohibido?",
    "back": "Se usa en descomposición histórica descriptiva para no desfasar la tendencia; está prohibido al predecir hacia el futuro porque lee datos posteriores (FOLLOWING).",
    "tags": [
      "da4-modelos",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-03-04",
    "lessonId": "da4-modelos-03-series-temporales-descomposicion",
    "moduleId": "da4-modelos",
    "track": "da",
    "front": "¿Por qué es mejor disparar alertas operativas sobre el residuo R_t que sobre la venta bruta Y_t?",
    "back": "Porque R_t ya descontó la tendencia y el día de la semana, evitando falsas alarmas en días valle y detectando caídas reales en días pico.",
    "tags": [
      "da4-modelos",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-04-01",
    "lessonId": "da4-modelos-04-pronostico-backtesting-mae-mase",
    "moduleId": "da4-modelos",
    "track": "da",
    "front": "¿Por qué no se debe usar validación cruzada aleatoria en series temporales?",
    "back": "Porque mezcla observaciones futuras en el conjunto de entrenamiento para predecir el pasado, provocando fuga temporal y subestimando el error real.",
    "tags": [
      "da4-modelos",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-04-02",
    "lessonId": "da4-modelos-04-pronostico-backtesting-mae-mase",
    "moduleId": "da4-modelos",
    "track": "da",
    "front": "¿Qué es el pronóstico ingenuo (naive) a un paso y cómo se escribe en SQL?",
    "back": "Consiste en usar como predicción para el período t el último valor observado en t-1; en SQL se calcula con LAG(y, 1) OVER (ORDER BY fecha).",
    "tags": [
      "da4-modelos",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-04-03",
    "lessonId": "da4-modelos-04-pronostico-backtesting-mae-mase",
    "moduleId": "da4-modelos",
    "track": "da",
    "front": "¿Cómo se define el MASE y qué significa obtener MASE = 0.82?",
    "back": "Es el cociente MAE_modelo / MAE_ingenuo. Un MASE de 0.82 indica que el modelo reduce el error absoluto medio en un 18% frente al pronóstico ingenuo.",
    "tags": [
      "da4-modelos",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-04-04",
    "lessonId": "da4-modelos-04-pronostico-backtesting-mae-mase",
    "moduleId": "da4-modelos",
    "track": "da",
    "front": "¿Por qué se prefiere MASE frente a MAPE al evaluar demanda de productos?",
    "back": "Porque el MAPE divide entre la venta real de cada período y explota cuando hay ceros, mientras que el MASE escala con el error medio ingenuo y es simétrico.",
    "tags": [
      "da4-modelos",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-05-01",
    "lessonId": "da4-modelos-05-clustering-segmentacion-perfiles",
    "moduleId": "da4-modelos",
    "track": "da",
    "front": "¿Por qué es obligatorio estandarizar las variables antes de aplicar k-medias?",
    "back": "Porque k-medias minimiza distancias euclidianas al cuadrado; sin escalar, las columnas con unidades grandes (como dólares) anulan a las de unidades pequeñas (como conteos).",
    "tags": [
      "da4-modelos",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-05-02",
    "lessonId": "da4-modelos-05-clustering-segmentacion-perfiles",
    "moduleId": "da4-modelos",
    "track": "da",
    "front": "¿Cómo se calcula el puntaje z de una columna en DuckDB usando funciones de ventana?",
    "back": "Restando el promedio global y dividiendo por la desviación estándar muestral: (x - AVG(x) OVER ()) / STDDEV_SAMP(x) OVER ().",
    "tags": [
      "da4-modelos",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-05-03",
    "lessonId": "da4-modelos-05-clustering-segmentacion-perfiles",
    "moduleId": "da4-modelos",
    "track": "da",
    "front": "¿Por qué no debemos elegir el número de grupos k buscando simplemente la menor inercia?",
    "back": "Porque la inercia siempre disminuye al aumentar k y llega a cero cuando cada observación es su propio grupo, produciendo sobreajuste sin valor operativo.",
    "tags": [
      "da4-modelos",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-da4-05-04",
    "lessonId": "da4-modelos-05-clustering-segmentacion-perfiles",
    "moduleId": "da4-modelos",
    "track": "da",
    "front": "¿Qué indica un coeficiente de silueta cercano a +1 frente a uno cercano a 0?",
    "back": "Un valor cercano a +1 indica que las observaciones están muy cohesionadas dentro de su grupo y lejos del grupo vecino; cerca de 0 indica solapamiento en la frontera.",
    "tags": [
      "da4-modelos",
      "da"
    ],
    "difficulty": 3
  },
  {
    "id": "de4-plataforma-01-spark-4-shuffles-skew-ansi-fc-1",
    "lessonId": "de4-plataforma-01-spark-4-shuffles-skew-ansi",
    "moduleId": "de4-plataforma",
    "track": "de",
    "front": "¿Qué diferencia física existe entre una transformación estrecha (narrow) y una ancha (wide) en Apache Spark?",
    "back": "En una transformación estrecha cada partición de salida se calcula en memoria local a partir de una sola partición de entrada; en una ancha los datos deben serializarse, escribirse en disco y redistribuirse por red mediante un shuffle.",
    "tags": [
      "de4-plataforma",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "de4-plataforma-01-spark-4-shuffles-skew-ansi-fc-2",
    "lessonId": "de4-plataforma-01-spark-4-shuffles-skew-ansi",
    "moduleId": "de4-plataforma",
    "track": "de",
    "front": "¿Qué tres optimizaciones aplica Adaptive Query Execution (AQE) al finalizar una etapa de shuffle?",
    "back": "Fusiona particiones post-shuffle pequeñas (coalescePartitions), convierte cruces a Broadcast Hash Join cuando una tabla resulta pequeña tras filtrar y divide particiones sesgadas en sub-tareas (skewJoin).",
    "tags": [
      "de4-plataforma",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "de4-plataforma-01-spark-4-shuffles-skew-ansi-fc-3",
    "lessonId": "de4-plataforma-01-spark-4-shuffles-skew-ansi",
    "moduleId": "de4-plataforma",
    "track": "de",
    "front": "¿En qué consiste la técnica de salado de llaves (key salting) para mitigar el data skew?",
    "back": "En añadir un sufijo entero entre 0 y N-1 a las llaves muy frecuentes en la tabla grande (y replicar esas llaves N veces en la tabla pequeña si hay un cruce) para repartir su procesamiento entre N particiones.",
    "tags": [
      "de4-plataforma",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "de4-plataforma-01-spark-4-shuffles-skew-ansi-fc-4",
    "lessonId": "de4-plataforma-01-spark-4-shuffles-skew-ansi",
    "moduleId": "de4-plataforma",
    "track": "de",
    "front": "¿Qué cambia en Apache Spark 4.0 respecto a la propiedad spark.sql.ansi.enabled?",
    "back": "Pasa a estar activada (true) por defecto: las divisiones por cero, desbordamientos numéricos y conversiones inválidas con CAST lanzan excepciones en vez de devolver NULL silenciosamente.",
    "tags": [
      "de4-plataforma",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "de4-plataforma-02-arquitectura-integral-plataforma-fc-1",
    "lessonId": "de4-plataforma-02-arquitectura-integral-plataforma",
    "moduleId": "de4-plataforma",
    "track": "de",
    "front": "¿Cuáles son los cuatro planos independientes en el diseño integral de una plataforma de datos?",
    "back": "Plano de ingesta (captura CDC, eventos y lotes), plano de almacenamiento abierto (Parquet/Iceberg en capas Bronze, Silver, Gold), plano de cómputo efímero (Flink, Spark, DuckDB) y plano de consumo (BI, analítica y servicios).",
    "tags": [
      "de4-plataforma",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "de4-plataforma-02-arquitectura-integral-plataforma-fc-2",
    "lessonId": "de4-plataforma-02-arquitectura-integral-plataforma",
    "moduleId": "de4-plataforma",
    "track": "de",
    "front": "¿Bajo qué criterios se elige entre Apache Flink, Apache Spark 4.0 y DuckDB dentro del plano de cómputo?",
    "back": "Flink para latencias sub-minuto y procesamiento de flujo con estado; Spark 4.0 para trabajos por lotes que redistribuyen cientos de gigabytes o terabytes; DuckDB para cargas por lotes que caben en la RAM y NVMe de un nodo único.",
    "tags": [
      "de4-plataforma",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "de4-plataforma-02-arquitectura-integral-plataforma-fc-3",
    "lessonId": "de4-plataforma-02-arquitectura-integral-plataforma",
    "moduleId": "de4-plataforma",
    "track": "de",
    "front": "¿Por qué el total de pagos capturados ($6 423 516.34) supera al total de órdenes completadas ($6 269 462.42) en Mercado Brisa?",
    "back": "Porque la tabla payments registra múltiples intentos de cobro por orden y contiene 405 cobros capturados duplicados producto de reintentos de pasarela.",
    "tags": [
      "de4-plataforma",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "de4-plataforma-02-arquitectura-integral-plataforma-fc-4",
    "lessonId": "de4-plataforma-02-arquitectura-integral-plataforma",
    "moduleId": "de4-plataforma",
    "track": "de",
    "front": "¿Cómo se previene un chasm trap al construir una tabla Gold que combina orders, payments y refunds?",
    "back": "Pre-agregando payments y refunds en CTEs independientes hasta el grano exacto de order_id antes de realizar los LEFT JOIN con orders.",
    "tags": [
      "de4-plataforma",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "de4-plataforma-03-seguridad-pii-enmascaramiento-fc-1",
    "lessonId": "de4-plataforma-03-seguridad-pii-enmascaramiento",
    "moduleId": "de4-plataforma",
    "track": "de",
    "front": "¿Cuál es la diferencia entre un identificador directo y un cuasi-identificador según NIST SP 800-122?",
    "back": "Un identificador directo identifica a una persona por sí solo (como email o documento fiscal), mientras que un cuasi-identificador (ciudad, código postal, segmento) parece anónimo aislado pero permite reidentificar personas al combinarse con otros atributos.",
    "tags": [
      "de4-plataforma",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "de4-plataforma-03-seguridad-pii-enmascaramiento-fc-2",
    "lessonId": "de4-plataforma-03-seguridad-pii-enmascaramiento",
    "moduleId": "de4-plataforma",
    "track": "de",
    "front": "¿Qué garantiza que una vista analítica cumpla con k-anonimato para k = 50?",
    "back": "Que cada combinación distinta de cuasi-identificadores presente en la vista aparezca en al menos 50 registros individuales.",
    "tags": [
      "de4-plataforma",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "de4-plataforma-03-seguridad-pii-enmascaramiento-fc-3",
    "lessonId": "de4-plataforma-03-seguridad-pii-enmascaramiento",
    "moduleId": "de4-plataforma",
    "track": "de",
    "front": "¿En qué se diferencian el enmascaramiento dinámico de datos (DDM) y la seguridad a nivel de fila (RLS)?",
    "back": "DDM actúa sobre columnas transformando u ocultando valores sensibles en tiempo de lectura según el rol; RLS actúa sobre filas filtrando qué registros devuelve la tabla según el usuario o sesión.",
    "tags": [
      "de4-plataforma",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "de4-plataforma-03-seguridad-pii-enmascaramiento-fc-4",
    "lessonId": "de4-plataforma-03-seguridad-pii-enmascaramiento",
    "moduleId": "de4-plataforma",
    "track": "de",
    "front": "¿Por qué las tablas SCD Tipo 2 y los formatos como Apache Iceberg requieren atención especial ante el derecho al olvido (GDPR)?",
    "back": "Porque las filas históricas cerradas (is_current = false) y las instantáneas pasadas conservan versiones anteriores del cliente que también deben purgarse y expirarse físicamente.",
    "tags": [
      "de4-plataforma",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "de4-plataforma-04-iac-terraform-cicd-datos-fc-1",
    "lessonId": "de4-plataforma-04-iac-terraform-cicd-datos",
    "moduleId": "de4-plataforma",
    "track": "de",
    "front": "¿Qué es la deriva de infraestructura (infrastructure drift) y cómo se detecta en Terraform?",
    "back": "Es la diferencia entre la configuración real en la nube (alterada manualmente o por fallos externos) y el código declarativo en Git; se detecta al ejecutar terraform plan y comparar el estado remoto con la infraestructura real.",
    "tags": [
      "de4-plataforma",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "de4-plataforma-04-iac-terraform-cicd-datos-fc-2",
    "lessonId": "de4-plataforma-04-iac-terraform-cicd-datos",
    "moduleId": "de4-plataforma",
    "track": "de",
    "front": "¿Por qué es crítico incluir prevent_destroy = true en los recursos de almacenamiento de datos en Terraform?",
    "back": "Porque ciertos cambios de configuración obligan a reemplazar el recurso (destruirlo y crearlo de nuevo), lo que borraría irreversiblemente las tablas Parquet e Iceberg si no existe esa salvaguarda.",
    "tags": [
      "de4-plataforma",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "de4-plataforma-04-iac-terraform-cicd-datos-fc-3",
    "lessonId": "de4-plataforma-04-iac-terraform-cicd-datos",
    "moduleId": "de4-plataforma",
    "track": "de",
    "front": "¿Para qué sirven los módulos en Terraform dentro de una plataforma de datos?",
    "back": "Para encapsular un conjunto coherente de recursos (cubeta, catálogo, roles IAM) y reutilizarlo con distintos parámetros en los entornos dev, staging y prod sin copiar ni pegar código.",
    "tags": [
      "de4-plataforma",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "de4-plataforma-04-iac-terraform-cicd-datos-fc-4",
    "lessonId": "de4-plataforma-04-iac-terraform-cicd-datos",
    "moduleId": "de4-plataforma",
    "track": "de",
    "front": "¿Qué diferencia existe entre una prueba de esquema estática y una compuerta de invariante de negocio en CI/CD de datos?",
    "back": "La prueba estática solo revisa nombres y tipos de columna, mientras que la compuerta de invariante ejecuta consultas sobre los datos (por ejemplo, verificar que toda orden con reembolso tenga estado refunded) antes de publicar.",
    "tags": [
      "de4-plataforma",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "de4-plataforma-05-finops-atribucion-retencion-fc-1",
    "lessonId": "de4-plataforma-05-finops-atribucion-retencion",
    "moduleId": "de4-plataforma",
    "track": "de",
    "front": "¿Qué problema resuelve la especificación abierta FOCUS en ingeniería de datos y FinOps?",
    "back": "Normaliza los datos de facturación y uso entre distintos proveedores de nube y plataformas bajo un esquema común de columnas (como BilledCost, EffectiveCost, ResourceId y ChargeCategory).",
    "tags": [
      "de4-plataforma",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "de4-plataforma-05-finops-atribucion-retencion-fc-2",
    "lessonId": "de4-plataforma-05-finops-atribucion-retencion",
    "moduleId": "de4-plataforma",
    "track": "de",
    "front": "¿Por qué omitir columnas de texto extensas como payload_json reduce directamente el costo en una consulta sobre Apache Parquet?",
    "back": "Porque Parquet almacena cada columna en bloques contiguos independientes; si una columna no aparece en la consulta, el motor nunca descarga ni descomprime sus bytes desde el almacenamiento de objetos.",
    "tags": [
      "de4-plataforma",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "de4-plataforma-05-finops-atribucion-retencion-fc-3",
    "lessonId": "de4-plataforma-05-finops-atribucion-retencion",
    "moduleId": "de4-plataforma",
    "track": "de",
    "front": "¿Qué criterio define el paso de una tabla o partición entre las capas Hot, Warm y Cold?",
    "back": "La antigüedad y frecuencia de lectura: los datos recientes de consulta diaria residen en Hot, el historial del último año de acceso ocasional pasa a Warm y los años anteriores para auditoría legal se archivan en Cold.",
    "tags": [
      "de4-plataforma",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "de4-plataforma-05-finops-atribucion-retencion-fc-4",
    "lessonId": "de4-plataforma-05-finops-atribucion-retencion",
    "moduleId": "de4-plataforma",
    "track": "de",
    "front": "¿Qué es una métrica de economía unitaria (unit economics) en una plataforma de datos?",
    "back": "Es el cociente entre el costo efectivo de la plataforma y una unidad de valor del negocio (por ejemplo, costo de cómputo y almacenamiento por cada 1 000 órdenes completadas).",
    "tags": [
      "de4-plataforma",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "de4-plataforma-06-entrevista-system-design-de-fc-1",
    "lessonId": "de4-plataforma-06-entrevista-system-design-de",
    "moduleId": "de4-plataforma",
    "track": "de",
    "front": "¿Cuáles son las cuatro etapas ordenadas para resolver una entrevista de System Design en Ingeniería de Datos?",
    "back": "1) Clarificar requisitos y SLOs (latencia, frescura, entrega, PII); 2) Estimar capacidad (media, pico y escala 10x); 3) Trazar los cuatro planos arquitectónicos; 4) Profundizar en cuellos de botella, fallos y compromisos FinOps.",
    "tags": [
      "de4-plataforma",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "de4-plataforma-06-entrevista-system-design-de-fc-2",
    "lessonId": "de4-plataforma-06-entrevista-system-design-de",
    "moduleId": "de4-plataforma",
    "track": "de",
    "front": "¿Por qué es un error dimensionar el plano de ingesta y cómputo usando únicamente el promedio diario de eventos?",
    "back": "Porque el tráfico real presenta picos horarios y estacionales; dimensionar para la media provoca saturación de colas, contrapresión e incumplimiento de SLOs durante las horas de mayor actividad.",
    "tags": [
      "de4-plataforma",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "de4-plataforma-06-entrevista-system-design-de-fc-3",
    "lessonId": "de4-plataforma-06-entrevista-system-design-de",
    "moduleId": "de4-plataforma",
    "track": "de",
    "front": "¿Cómo se evita el problema de archivos pequeños (small files) cuando un flujo de streaming aterriza datos en Apache Iceberg?",
    "back": "Agrupando las confirmaciones (commits) en micro-lotes de 1 a 5 minutos y ejecutando trabajos asíncronos periódicos de compactación (bin-packing) y expiración de instantáneas.",
    "tags": [
      "de4-plataforma",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "de4-plataforma-06-entrevista-system-design-de-fc-4",
    "lessonId": "de4-plataforma-06-entrevista-system-design-de",
    "moduleId": "de4-plataforma",
    "track": "de",
    "front": "¿Cómo se ejecuta un reprocesamiento histórico (backfill) masivo sin afectar la latencia de los tableros ejecutivos conectados a la capa Gold?",
    "back": "Aprovisionando un clúster de cómputo aislado que escribe sobre una rama o tabla candidata en Iceberg (patrón Write-Audit-Publish) y conmutando el puntero del catálogo solo tras validar las compuertas de calidad.",
    "tags": [
      "de4-plataforma",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de4-02-skew",
    "lessonId": "de4-streaming-02-kafka-kraft-tiered-storage",
    "moduleId": "de4-streaming",
    "track": "de",
    "front": "¿Qué ocurre si un productor de Kafka reemplaza customer_id = NULL por la constante \"GUEST\" antes de enviar el mensaje?",
    "back": "Todos los mensajes sin cliente producen el mismo hash murmur2(\"GUEST\") y aterrizan en una única partición caliente, saturando un broker del clúster.",
    "tags": [
      "de4-streaming",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de4-02-kraft",
    "lessonId": "de4-streaming-02-kafka-kraft-tiered-storage",
    "moduleId": "de4-streaming",
    "track": "de",
    "front": "¿Cómo almacena y replica los metadatos del clúster el protocolo KRaft en Apache Kafka 4.x?",
    "back": "Mediante un quórum de controladores Raft que registra cada cambio de topología como un evento en el tópico interno __cluster_metadata.",
    "tags": [
      "de4-streaming",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de4-02-isr",
    "lessonId": "de4-streaming-02-kafka-kraft-tiered-storage",
    "moduleId": "de4-streaming",
    "track": "de",
    "front": "¿Qué combinación de parámetros garantiza que un mensaje confirmado en Kafka no se pierda aunque falle el broker líder inmediatamente después?",
    "back": "Configurar acks=all en el productor junto con min.insync.replicas >= 2 y replication.factor >= 3 en el tópico.",
    "tags": [
      "de4-streaming",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de4-02-tiered",
    "lessonId": "de4-streaming-02-kafka-kraft-tiered-storage",
    "moduleId": "de4-streaming",
    "track": "de",
    "front": "¿Qué diferencia existe entre local.retention.ms y retention.ms cuando se activa Tiered Storage (KIP-405)?",
    "back": "local.retention.ms define cuánto tiempo permanece un segmento cerrado en el disco local del broker, mientras que retention.ms define la retención total incluyendo el almacenamiento de objetos remoto.",
    "tags": [
      "de4-streaming",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de4-04-barriers",
    "lessonId": "de4-streaming-04-entrega-at-least-once-exactly-once",
    "moduleId": "de4-streaming",
    "track": "de",
    "front": "¿Para qué sirven las barreras de checkpoint basadas en el algoritmo de Chandy-Lamport en Apache Flink?",
    "back": "Dividen el flujo de eventos en épocas consecutivas para que todos los operadores guarden una instantánea de estado mutuamente consistente sin detener el procesamiento global.",
    "tags": [
      "de4-streaming",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de4-04-2pc",
    "lessonId": "de4-streaming-04-entrega-at-least-once-exactly-once",
    "moduleId": "de4-streaming",
    "track": "de",
    "front": "¿En qué momento exacto hace visible un sumidero 2PC de Flink los mensajes escritos en una transacción de Kafka?",
    "back": "En la fase de commit, después de que el JobManager confirma que absolutamente todos los operadores del grafo completaron el checkpoint correspondiente.",
    "tags": [
      "de4-streaming",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de4-04-isolation",
    "lessonId": "de4-streaming-04-entrega-at-least-once-exactly-once",
    "moduleId": "de4-streaming",
    "track": "de",
    "front": "¿Por qué un consumidor de Kafka debe usar isolation.level = read_committed cuando lee de un tópico escrito con transacciones 2PC?",
    "back": "Porque el modo por defecto read_uncommitted entrega mensajes de transacciones abiertas que podrían abortarse si el productor falla antes del commit.",
    "tags": [
      "de4-streaming",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de4-04-idempotency",
    "lessonId": "de4-streaming-04-entrega-at-least-once-exactly-once",
    "moduleId": "de4-streaming",
    "track": "de",
    "front": "En la tabla payments de Mercado Brisa, ¿cómo se distingue un reintento bancario legítimo de un webhook duplicado?",
    "back": "El reintento bancario legítimo incrementa attempt_number a 2 y genera una nueva idempotency_key, mientras que el webhook duplicado repite exactamente la misma idempotency_key 4 segundos después.",
    "tags": [
      "de4-streaming",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de4-05-ivm-retraction",
    "lessonId": "de4-streaming-05-vistas-materializadas-streaming-olap",
    "moduleId": "de4-streaming",
    "track": "de",
    "front": "¿Qué es una retracción (diff = -1) en un motor de vistas materializadas en streaming como Materialize o RisingWave?",
    "back": "Es un registro interno que resta o anula el estado anterior de una tupla antes de sumar la nueva versión (diff = +1), permitiendo actualizar agregados y joins de forma incremental.",
    "tags": [
      "de4-streaming",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de4-05-replacingmergetree",
    "lessonId": "de4-streaming-05-vistas-materializadas-streaming-olap",
    "moduleId": "de4-streaming",
    "track": "de",
    "front": "¿Cuándo elimina las filas duplicadas una tabla con motor ReplacingMergeTree en ClickHouse?",
    "back": "De forma asíncrona durante las fusiones de partes de datos en segundo plano (background merges), no en el instante de la inserción.",
    "tags": [
      "de4-streaming",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de4-05-ch-mv",
    "lessonId": "de4-streaming-05-vistas-materializadas-streaming-olap",
    "moduleId": "de4-streaming",
    "track": "de",
    "front": "¿Qué datos observa el SELECT de una vista materializada incremental en ClickHouse cuando se ejecuta?",
    "back": "Observa únicamente el lote o bloque de filas recién insertado en la tabla origen, actuando como un disparador en tiempo de inserción.",
    "tags": [
      "de4-streaming",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-de4-05-fanout",
    "lessonId": "de4-streaming-05-vistas-materializadas-streaming-olap",
    "moduleId": "de4-streaming",
    "track": "de",
    "front": "¿Por qué es obligatorio agrupar refunds por order_id antes de unirlo con payments al calcular ingresos netos?",
    "back": "Porque un pedido puede tener múltiples reembolsos parciales (relación 1:N), y unirlo directamente multiplicaría el importe del pago por cada fila de reembolso.",
    "tags": [
      "de4-streaming",
      "de"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-x4-02-1",
    "lessonId": "x4-carrera-02-entrevista-tecnica-sql-caso-arquitectura",
    "moduleId": "x4-carrera",
    "track": "core",
    "front": "¿Cuáles son los 5 pasos del protocolo para resolver un ejercicio de SQL en vivo?",
    "back": "1) Declarar el grano de entrada y salida, 2) identificar llaves y cardinalidad del JOIN, 3) definir filtros de dominio y casos borde, 4) modularizar en CTEs y 5) añadir desempate determinista y verificar conteos.",
    "tags": [
      "x4-carrera",
      "core"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-x4-02-2",
    "lessonId": "x4-carrera-02-entrevista-tecnica-sql-caso-arquitectura",
    "moduleId": "x4-carrera",
    "track": "core",
    "front": "¿Por qué es obligatorio añadir una columna única (como `payment_id ASC` o `category ASC`) al final del `ORDER BY` de `ROW_NUMBER()`?",
    "back": "Porque si dos filas empatan en la métrica principal o en la marca temporal, el motor podría asignarles el número 1 de forma no determinista entre ejecuciones distintas.",
    "tags": [
      "x4-carrera",
      "core"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-x4-02-3",
    "lessonId": "x4-carrera-02-entrevista-tecnica-sql-caso-arquitectura",
    "moduleId": "x4-carrera",
    "track": "core",
    "front": "¿Cuál es el primer paso al responder un estudio de caso del tipo \"la métrica X cayó un 10 % ayer\"?",
    "back": "Descartar un fallo de instrumentación o pipeline (retraso de carga, caída de un webhook, cambio en la versión de la app o duplicación de eventos) antes de buscar causas comerciales.",
    "tags": [
      "x4-carrera",
      "core"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-x4-02-4",
    "lessonId": "x4-carrera-02-entrevista-tecnica-sql-caso-arquitectura",
    "moduleId": "x4-carrera",
    "track": "core",
    "front": "¿Qué diferencia práctica hay entre `ROW_NUMBER()` y `DENSE_RANK()` al pedir un Top-N por partición?",
    "back": "`ROW_NUMBER()` asigna números consecutivos únicos (1, 2, 3) rompiendo empates; `DENSE_RANK()` asigna la misma posición a los empatados sin dejar huecos en la numeración siguiente.",
    "tags": [
      "x4-carrera",
      "core"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-x4-03-1",
    "lessonId": "x4-carrera-03-explicar-proyecto-2-minutos",
    "moduleId": "x4-carrera",
    "track": "core",
    "front": "¿Cuántas palabras caben en una explicación técnica de 2 minutos a ritmo profesional y cómo se reparten?",
    "back": "Entre 260 y 300 palabras repartidas en 4 bloques: 0:00–0:20 Tesis e impacto (~40 palabras), 0:20–0:45 Problema (~65 palabras), 0:45–1:25 Acción y compensación (~95 palabras) y 1:25–2:00 Matriz antes/después (~70 palabras).",
    "tags": [
      "x4-carrera",
      "core"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-x4-03-2",
    "lessonId": "x4-carrera-03-explicar-proyecto-2-minutos",
    "moduleId": "x4-carrera",
    "track": "core",
    "front": "¿En qué consiste el Principio de la Pirámide de Minto aplicado a una entrevista técnica?",
    "back": "En abrir la respuesta con la conclusión cuantificada y la decisión de negocio (comunicación answer-first) antes de desglosar las causas metodológicas y el detalle del código.",
    "tags": [
      "x4-carrera",
      "core"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-x4-03-3",
    "lessonId": "x4-carrera-03-explicar-proyecto-2-minutos",
    "moduleId": "x4-carrera",
    "track": "core",
    "front": "¿Qué estructura verbal de una frase permite articular una compensación técnica (trade-off)?",
    "back": "\"Ante la restricción X, evalué la opción A frente a la opción B; elegí B porque ganábamos el beneficio Y, asumiendo de forma controlada el costo Z\".",
    "tags": [
      "x4-carrera",
      "core"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-x4-03-4",
    "lessonId": "x4-carrera-03-explicar-proyecto-2-minutos",
    "moduleId": "x4-carrera",
    "track": "core",
    "front": "¿Qué sesgo financiero corrige el modelo SCD Tipo 2 (`customer_changes`) frente a `current_tier` en los pedidos completados de Mercado Brisa?",
    "back": "Corrige una sobreasignación de +412 601.01 USD en el nivel `oro` y +198 246.41 USD en `platino`, que en realidad ocurrieron cuando esos clientes aún tenían nivel `bronce` (-628 099.05 USD subestimados).",
    "tags": [
      "x4-carrera",
      "core"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-x4-04-1",
    "lessonId": "x4-ia-datos-04-golden-evals-barreras-ast-sqlglot",
    "moduleId": "x4-ia-datos",
    "track": "core",
    "front": "¿Qué ventaja ofrece inspeccionar un árbol AST con SQLGlot frente a buscar palabras prohibidas con expresiones regulares?",
    "back": "SQLGlot descompone la gramática SQL en nodos tipados (Select, Table, Column, Star), permitiendo bloquear acceso a PII o comandos destructivos sin importar alias ni comentarios.",
    "tags": [
      "x4-ia-datos",
      "core"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-x4-04-2",
    "lessonId": "x4-ia-datos-04-golden-evals-barreras-ast-sqlglot",
    "moduleId": "x4-ia-datos",
    "track": "core",
    "front": "¿Qué es la Exactitud de Ejecución (Execution Accuracy, EX) en un conjunto Golden Evals?",
    "back": "Es la proporción de consultas generadas por el agente cuyo resultado tabular al ejecutarse en el motor coincide exactamente (dentro de tolerancia) con el SQL canónico de referencia.",
    "tags": [
      "x4-ia-datos",
      "core"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-x4-04-3",
    "lessonId": "x4-ia-datos-04-golden-evals-barreras-ast-sqlglot",
    "moduleId": "x4-ia-datos",
    "track": "core",
    "front": "¿Por qué un juez basado en LLM (LLM-as-a-judge) aprueba consultas financieramente erróneas en Mercado Brisa?",
    "back": "Porque evalúa la coherencia superficial del código SQL sin ejecutarlo ni comprobar si omite deduplicar payments o filtrar SKU-TEST-NEG.",
    "tags": [
      "x4-ia-datos",
      "core"
    ],
    "difficulty": 3
  },
  {
    "id": "fc-x4-04-4",
    "lessonId": "x4-ia-datos-04-golden-evals-barreras-ast-sqlglot",
    "moduleId": "x4-ia-datos",
    "track": "core",
    "front": "¿Qué columnas de la tabla customers de Mercado Brisa debe bloquear obligatoriamente la barrera AST por contener PII?",
    "back": "Debe bloquear full_name, email y postal_code, además de prohibir comodines SELECT * sobre tablas con datos personales.",
    "tags": [
      "x4-ia-datos",
      "core"
    ],
    "difficulty": 3
  }
];

export const FLASHCARDS_BY_ID = Object.fromEntries(FLASHCARDS.map((c) => [c.id, c]));

export const CARD_LESSON_MAP = {
  "fc-01": "l1-joins-fanout",
  "fc-02": "l2-window-functions",
  "fc-03": "l3-asof-lateral-ctes",
  "fc-04": "l4-star-schema-obt",
  "fc-05": "l5-scd2-history",
  "fc-06": "l6-metrics-simpson",
  "fc-07": "l6-metrics-simpson",
  "fc-08": "l7-columnar-parquet",
  "fc-09": "l8-arrow-lance-vortex",
  "fc-10": "l9-duckdb-polars-marimo",
  "fc-11": "l9-duckdb-polars-marimo",
  "fc-12": "l10-iceberg-v3-medallion",
  "fc-13": "l10-iceberg-v3-medallion",
  "fc-14": "l11-dbt-sqlmesh-dag",
  "fc-15": "l12-contracts-semantic-layer",
  "fc-16": "l12-contracts-semantic-layer",
  "fc-17": "l14-ab-testing-cuped",
  "fc-18": "l14-ab-testing-cuped",
  "fc-19": "l15-bi-tufte-code",
  "fc-20": "l15-bi-tufte-code",
  "fc-21": "l16-cdc-kafka-streaming",
  "fc-22": "l17-flink-watermarks-mv",
  "fc-23": "l18-mcp-semantic-ai-rag",
  "fc-24": "l18-mcp-semantic-ai-rag"
};

export const INITIAL_FLASHCARDS = [
  {
    "id": "fc-01",
    "stageId": "stage-1",
    "discipline": "BI",
    "bloomLevel": "Analizar",
    "question": "¿Qué es la trampa de Fan-out (explosión de filas) en un JOIN y cómo distorsiona las métricas en un dashboard de BI?",
    "answer": "Ocurre cuando se realiza un JOIN entre una tabla de grano fino y otra que no es única en la llave de cruce (relación 1:N o N:M) y luego se aplica SUM() o COUNT() sobre la tabla izquierda. Las filas del lado \"1\" se duplican N veces, inflando artificialmente ingresos o conteos. Se previene pre-agregando la tabla detalle en una CTE al mismo grano antes del JOIN o usando métricas semi-aditivas gobernadas.",
    "codeSnippet": "-- [INCORRECTO] Fan-out duplica el monto_orden por cada ítem del pedido\nSELECT SUM(o.monto_total) AS ingresos_inflados\nFROM ordenes o\nJOIN orden_items i ON o.orden_id = i.orden_id;\n\n-- [CORRECTO] Pre-agregar al mismo grano (orden_id) antes del JOIN\nWITH items_por_orden AS (\n  SELECT orden_id, COUNT(*) AS total_items\n  FROM orden_items\n  GROUP BY orden_id\n)\nSELECT SUM(o.monto_total) AS ingresos_reales, SUM(i.total_items) AS unidades\nFROM ordenes o\nLEFT JOIN items_por_orden i ON o.orden_id = i.orden_id;"
  },
  {
    "id": "fc-02",
    "stageId": "stage-1",
    "discipline": "DA",
    "bloomLevel": "Aplicar",
    "question": "¿Cómo funciona la cláusula QUALIFY en motores SQL modernos (DuckDB, Snowflake, BigQuery, Databricks) y en qué fase del orden lógico de evaluación se ejecuta?",
    "answer": "QUALIFY filtra el resultado de funciones de ventana (ROW_NUMBER, RANK, LAG, SUM OVER) sin necesidad de envolver la consulta en una subconsulta o CTE adicional. En el orden lógico de evaluación SQL se ejecuta después de WINDOW (y por tanto después de WHERE, GROUP BY y HAVING), pero antes de ORDER BY y LIMIT.",
    "codeSnippet": "-- Deduplicación determinista del último evento por usuario usando QUALIFY\nSELECT\n  usuario_id,\n  evento_id,\n  estado_suscripcion,\n  actualizado_en\nFROM raw.eventos_suscripcion\nWHERE fecha_particion >= DATE '2026-10-01'\nQUALIFY ROW_NUMBER() OVER (\n  PARTITION BY usuario_id\n  ORDER BY actualizado_en DESC, evento_id DESC\n) = 1;"
  },
  {
    "id": "fc-03",
    "stageId": "stage-1",
    "discipline": "DA",
    "bloomLevel": "Aplicar",
    "question": "¿Qué problema resuelve un ASOF JOIN en series temporales financieras o de telemetría y por qué evita el Data Leakage (fuga de datos del futuro)?",
    "answer": "Un ASOF JOIN empareja cada fila de una tabla izquierda con la fila más cercana en el tiempo de la tabla derecha que sea anterior o igual (<=) a la marca temporal del evento. Evita el Data Leakage porque garantiza que una transacción o feature de ML solo se cruce con la cotización o estado vigente en ese milisegundo exacto, sin usar valores futuros.",
    "codeSnippet": "-- DuckDB / Snowflake: Cruzar ventas con la tasa de cambio vigente en ese instante\nSELECT\n  v.venta_id,\n  v.moneda,\n  v.monto_local,\n  fx.tasa_usd,\n  ROUND(v.monto_local * fx.tasa_usd, 2) AS monto_usd\nFROM fact_ventas v\nASOF JOIN dim_tasas_fx fx\n  ON v.moneda = fx.moneda\n  AND v.timestamp_venta >= fx.timestamp_cotizacion;"
  },
  {
    "id": "fc-04",
    "stageId": "stage-2",
    "discipline": "BI",
    "bloomLevel": "Evaluar",
    "question": "¿Cuándo conviene diseñar un Esquema Estrella (Star Schema) frente a una One Big Table (OBT) desnormalizada en motores columnares modernos?",
    "answer": "La OBT elimina el costo de JOINs en tiempo de consulta y aprovecha la compresión RLE/Diccionario de Parquet en escaneos de una sola tabla, ideal para cargas intensivas en CPU. El Star Schema sigue siendo superior cuando existen múltiples tablas de hechos con diferente granularidad (ventas vs. presupuesto mensual), dimensiones SCD Tipo 2 compartidas (Conformed Dimensions) o gobierno en Capa Semántica.",
    "codeSnippet": "-- Star Schema: Hechos a nivel línea de pedido + Dimensión conformada con llave subrogada\nSELECT\n  d_prod.categoria,\n  d_cli.segmento_historico,\n  SUM(f.ingreso_neto) AS ingresos\nFROM gold.fact_ordenes f\nJOIN gold.dim_producto d_prod ON f.producto_sk = d_prod.producto_sk\nJOIN gold.dim_cliente_scd2 d_cli ON f.cliente_sk = d_cli.cliente_sk\nGROUP BY ALL;"
  },
  {
    "id": "fc-05",
    "stageId": "stage-2",
    "discipline": "DE",
    "bloomLevel": "Aplicar",
    "question": "¿Cómo preserva la historia una Dimensión Lentamente Cambiante Tipo 2 (SCD Type 2) y qué columnas técnicas son indispensables?",
    "answer": "SCD Tipo 2 crea una nueva fila cada vez que cambia un atributo rastreado (ej. segmento o país del cliente), manteniendo intacta la atribución histórica. Requiere una llave subrogada única (surrogate key, ej. cliente_sk), la llave natural (cliente_id), marcas de vigencia (valid_from, valid_to) y una bandera booleana is_current para consultas del estado actual.",
    "codeSnippet": "-- Cruce histórico Point-in-Time contra una dimensión SCD Tipo 2\nSELECT\n  f.orden_id,\n  f.fecha_orden,\n  d.segmento_cliente AS segmento_en_fecha_compra,\n  f.monto_usd\nFROM silver.ordenes f\nJOIN gold.dim_cliente_scd2 d\n  ON f.cliente_id = d.cliente_id\n  AND f.fecha_orden >= d.valid_from\n  AND f.fecha_orden < COALESCE(d.valid_to, TIMESTAMP '9999-12-31');"
  },
  {
    "id": "fc-06",
    "stageId": "stage-2",
    "discipline": "DA",
    "bloomLevel": "Analizar",
    "question": "¿Qué es la Paradoja de Simpson en el análisis de KPIs y cómo se detecta antes de presentar conclusiones ejecutivas?",
    "answer": "Es un fenómeno estadístico donde una tendencia observada en varios segmentos desaparece o se invierte al combinar los datos en un único agregado global. Ocurre cuando existe una variable de confusión (confounder) correlacionada tanto con la métrica como con el peso/volumen de cada grupo. Se detecta desglosando por variables de mezcla (canal, dispositivo, país) y aplicando estandarización por pesos fijos.",
    "codeSnippet": "-- Comparar conversión global vs. estratificada por dispositivo (variable de confusión)\nSELECT\n  canal_adquisicion,\n  dispositivo,\n  COUNT(*) AS sesiones,\n  ROUND(100.0 * SUM(convirtio) / COUNT(*), 2) AS tasa_conversion_pct,\n  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (PARTITION BY canal_adquisicion), 1) AS peso_mix_pct\nFROM gold.eventos_funnel\nGROUP BY GROUPING SETS ((canal_adquisicion, dispositivo), (canal_adquisicion));"
  },
  {
    "id": "fc-07",
    "stageId": "stage-2",
    "discipline": "BI",
    "bloomLevel": "Evaluar",
    "question": "¿Por qué las métricas no aditivas (ratios, tasas de conversión, ticket promedio, COUNT DISTINCT) nunca deben promediarse ni sumarse a partir de tablas pre-agregadas diarias?",
    "answer": "Porque el promedio de promedios no pondera el volumen de cada día (un día con 10 visitas pesa igual que Black Friday con 1 millón), y la suma de usuarios únicos diarios (DAU) cuenta múltiples veces al mismo usuario recurrente en el mes (MAU). En BI siempre deben almacenarse numerador y denominador por separado (SUM(ingresos) / SUM(ordenes)) o usar HyperLogLog / sketches para cardinalidades.",
    "codeSnippet": "-- [INCORRECTO] Promediar el ticket promedio diario distorsiona el resultado mensual\nSELECT AVG(ticket_promedio_diario) FROM resumen_diario;\n\n-- [CORRECTO] Sumar componentes aditivos (numerador / denominador)\nSELECT\n  SUM(ingresos_totales) / NULLIF(SUM(total_ordenes), 0) AS aov_ponderado_real\nFROM gold.resumen_diario_ventas;"
  },
  {
    "id": "fc-08",
    "stageId": "stage-3",
    "discipline": "DE",
    "bloomLevel": "Analizar",
    "question": "¿Cómo interactúan los Row Groups, Column Chunks y Zone Maps (estadísticas min/max) dentro de un archivo Apache Parquet para acelerar consultas?",
    "answer": "Parquet divide la tabla horizontalmente en Row Groups (típicamente 128 MB o ~1M filas) y dentro de cada uno almacena un Column Chunk contiguo por columna. El Footer guarda Zone Maps (min, max, null_count) y Bloom Filters por cada Column Chunk. Mediante Projection Pushdown solo se leen las columnas pedidas, y con Predicate Pushdown el motor salta Row Groups enteros si el filtro WHERE cae fuera del rango [min, max].",
    "codeSnippet": "-- Al ordenar físicamente por fecha_evento al escribir Parquet, maximizamos el Data Skipping\nCOPY (\n  SELECT *\n  FROM eventos_crudos\n  ORDER BY fecha_evento, pais_codigo\n) TO 's3://lakehouse/eventos_optimizados.parquet'\n(FORMAT PARQUET, COMPRESSION ZSTD, ROW_GROUP_SIZE 100000);"
  },
  {
    "id": "fc-09",
    "stageId": "stage-3",
    "discipline": "DE",
    "bloomLevel": "Comprender",
    "question": "¿Qué significa que Apache Arrow permita transferencia Zero-Copy entre DuckDB, Polars, PySpark y Python?",
    "answer": "Tradicionalmente, pasar datos entre motores requería serializar filas a bytes y deserializarlas (gastando hasta 70% de CPU). Apache Arrow define un formato estándar de buffers columnares contiguos en memoria RAM (con bitmaps de nulos y offsets alineados para SIMD). Con Zero-Copy, Polars y DuckDB comparten el mismo puntero de memoria RAM sin copiar ni transformar un solo byte.",
    "codeSnippet": "import duckdb\nimport polars as pl\n\n# Zero-Copy: DuckDB consulta un LazyFrame de Polars vía punteros de memoria Apache Arrow\ndf_polars = pl.scan_parquet(\"ventas_2026.parquet\")\nresultado_arrow = duckdb.sql(\"\"\"\n  SELECT region, SUM(monto_neto) AS total\n  FROM df_polars\n  WHERE estado = 'COMPLETADO'\n  GROUP BY region\n\"\"\").pl()  # Retorna a Polars sin serialización"
  },
  {
    "id": "fc-10",
    "stageId": "stage-3",
    "discipline": "DA",
    "bloomLevel": "Evaluar",
    "question": "¿En qué escenarios operativos es más eficiente ejecutar DuckDB en un solo nodo (Single-Node Vectorized Engine) en lugar de levantar un clúster distribuido de Apache Spark?",
    "answer": "Para datasets de hasta 100 GB - 1 TB comprimidos (que representan más del 90% de las cargas analíticas reales), un nodo moderno con 64-128 GB de RAM y NVMe procesa datos en DuckDB más rápido y barato que un clúster Spark porque elimina el arranque de máquinas virtuales, la serialización de red (Shuffle) entre nodos y la sobrecarga de la JVM, usando ejecución vectorizada por lotes de caché L1/L2 y Out-of-Core spilling a disco.",
    "codeSnippet": "-- DuckDB 1.x consultando archivos Parquet en S3 en paralelo con Out-of-Core activo\nSET memory_limit = '16GB';\nSET temp_directory = '/tmp/duckdb_spill';\n\nSELECT\n  date_trunc('month', fecha_compra) AS mes,\n  APPROX_COUNT_DISTINCT(usuario_id) AS usuarios_unicos,\n  SUM(importe_usd) AS revenue\nFROM read_parquet('s3://mi-lakehouse/gold/fact_ventas/**/*.parquet')\nGROUP BY ALL;"
  },
  {
    "id": "fc-11",
    "stageId": "stage-3",
    "discipline": "DE",
    "bloomLevel": "Aplicar",
    "question": "¿Cuál es la diferencia arquitectónica entre la API Eager (pl.read_parquet) y la API Lazy (pl.scan_parquet) en Polars?",
    "answer": "La API Eager carga todo el archivo en RAM inmediatamente y ejecuta cada paso secuencialmente creando copias intermedias. La API Lazy construye un grafo lógico ( Logical Plan ) y antes de ejecutar (.collect()) aplica un optimizador de consultas en Rust que realiza Predicate Pushdown (filtra al leer), Projection Pushdown (solo carga las columnas necesarias), Common Subplan Elimination y ejecución streaming multihilo.",
    "codeSnippet": "import polars as pl\n\n# API Lazy: El optimizador empuja el filtro y las 3 columnas hasta el lector Parquet\nq = (\n    pl.scan_parquet(\"transacciones_100M.parquet\")\n    .filter(pl.col(\"pais\") == \"MX\", pl.col(\"monto\") > 500)\n    .group_by(\"categoria\")\n    .agg(\n        pl.col(\"monto\").sum().alias(\"ingresos_mx\"),\n        pl.col(\"cliente_id\").n_unique().alias(\"clientes_unicos\")\n    )\n)\ndf_final = q.collect(streaming=True)"
  },
  {
    "id": "fc-12",
    "stageId": "stage-4",
    "discipline": "DE",
    "bloomLevel": "Analizar",
    "question": "¿Qué aportan los Deletion Vectors (Roaring Bitmaps) y el tipo de dato binario Variant en la especificación Apache Iceberg v3?",
    "answer": "En Iceberg v3, los Deletion Vectors reemplazan los antiguos archivos de borrado posicional por bitmaps compactos (Roaring Bitmaps) en formato Puffin que marcan qué filas fueron actualizadas o borradas (Merge-on-Read), acelerando los MERGE INTO y el cumplimiento GDPR sin reescribir archivos Parquet de cientos de megabytes. El tipo Variant almacena JSON semiestructurado en formato binario columnar tipado, permitiendo lectura rápida con sub-columnarización automática.",
    "codeSnippet": "-- Tabla Apache Iceberg v3 con Deletion Vectors (Merge-on-Read) y columna Variant\nCREATE TABLE catalog.silver.eventos_plataforma (\n  evento_id STRING,\n  usuario_id BIGINT,\n  payload_evento VARIANT,\n  evento_ts TIMESTAMP\n)\nUSING iceberg\nPARTITIONED BY (days(evento_ts))\nTBLPROPERTIES (\n  'format-version' = '3',\n  'write.merge.mode' = 'merge-on-read'\n);"
  },
  {
    "id": "fc-13",
    "stageId": "stage-4",
    "discipline": "DE",
    "bloomLevel": "Aplicar",
    "question": "¿Cómo funciona el patrón Write-Audit-Publish (WAP) sobre ramas de catálogo en Apache Iceberg para evitar que datos corruptos lleguen a los dashboards?",
    "answer": "Con WAP, el pipeline escribe los nuevos datos en una rama aislada del catálogo Iceberg (ej. audit_branch) sin tocar la rama main que consumen los usuarios. Luego se ejecutan pruebas de calidad deterministas (unicidad, nulos, reconciliación de totales, anomalías de volumen) contra esa rama. Si todas pasan, se realiza un fast-forward atómico de metadatos hacia main; si fallan, se aborta sin haber contaminado producción.",
    "codeSnippet": "-- 1. Crear rama aislada y escribir cambios\nALTER TABLE prod.gold.fact_ventas CREATE BRANCH audit_run_20261028;\nINSERT INTO prod.gold.fact_ventas.branch_audit_run_20261028\nSELECT * FROM staging.ventas_validadas;\n\n-- 2. Auditar invariantes (cero nulos en PK y monto >= 0)\n-- 3. Publicación atómica (Fast-Forward) tras pasar los tests\nCALL system.fast_forward('prod.gold.fact_ventas', 'main', 'audit_run_20261028');"
  },
  {
    "id": "fc-14",
    "stageId": "stage-4",
    "discipline": "DE",
    "bloomLevel": "Evaluar",
    "question": "¿Por qué los Entornos Virtuales de Datos en SQLMesh evitan reconstruir tablas completas en staging a diferencia del enfoque tradicional de dbt?",
    "answer": "SQLMesh parsea el SQL mediante un AST (SQLGlot) y calcula una huella criptográfica (fingerprint) semántica de cada modelo y sus dependencias. Al crear un entorno dev, solo materializa físicamente las tablas cuyo código o lógica cambió, y para el resto crea vistas ligeras (Zero-Copy Virtual Layer) apuntando a las tablas físicas de producción. Al promover a prod, simplemente intercambia punteros de vistas sin recalcular terabytes.",
    "codeSnippet": "MODEL (\n  name gold.ventas_mensuales,\n  kind INCREMENTAL_BY_TIME_RANGE (\n    time_column fecha_orden,\n    lookback 3\n  ),\n  grain (fecha_orden, region_id),\n  audits (\n    not_null(columns := (fecha_orden, region_id)),\n    positive_values(column := ingresos_netos)\n  )\n);\n\nSELECT fecha_orden, region_id, SUM(monto_usd) AS ingresos_netos\nFROM silver.ordenes\nWHERE fecha_orden BETWEEN @start_ds AND @end_ds\nGROUP BY ALL;"
  },
  {
    "id": "fc-15",
    "stageId": "stage-4",
    "discipline": "DE",
    "bloomLevel": "Aplicar",
    "question": "¿Qué es un Data Contract bajo el estándar ODCS v3 (Open Data Contract Standard) y cómo previene roturas silenciosas entre microservicios y el Lakehouse?",
    "answer": "Es un acuerdo formal en código (YAML/JSON) entre el equipo productor del servicio (Software Engineering) y los consumidores de datos (DE/DA/BI). Define esquema estricto, semántica de negocio, reglas de calidad (ej. moneda en ISO-4217), SLAs de frescura y propietarios. Se valida en el CI/CD del productor y en el gateway de ingesta, enviando registros inválidos a una Dead-Letter Queue antes de romper el pipeline.",
    "codeSnippet": "apiVersion: v3.0.0\nkind: DataContract\nid: urn:datacontract:checkout:orders-v2\ninfo:\n  title: Eventos de Ordenes de Checkout\n  owner: checkout-platform-team\nschema:\n  - name: order_id\n    type: string\n    required: true\n    unique: true\n  - name: total_amount_cents\n    type: int64\n    quality:\n      - type: sql\n        query: \"SELECT COUNT(*) FROM orders WHERE total_amount_cents < 0\"\n        mustBe: 0\nslaProperties:\n  - property: freshness\n    value: 15m"
  },
  {
    "id": "fc-16",
    "stageId": "stage-4",
    "discipline": "BI",
    "bloomLevel": "Crear",
    "question": "¿Qué rol cumple una Capa Semántica (MetricFlow / Cube) entre el Lakehouse y las herramientas de BI o agentes de IA?",
    "answer": "Centraliza las definiciones de métricas de negocio (Ingresos Netos Recurrentes, Churn, Margen Bruto) en código declarativo versionado en Git, separando las medidas (measures) de las dimensiones y entidades. Evita el \"SQL Drift\" donde Finanzas y Marketing calculan el mismo KPI con filtros distintos, y expone una API gobernada para que tanto dashboards como servidores MCP consulten exactamente la misma fórmula.",
    "codeSnippet": "semantic_models:\n  - name: ordenes_semantica\n    model: ref('fact_ordenes')\n    entities:\n      - name: orden\n        type: primary\n        expr: orden_id\n    dimensions:\n      - name: fecha_orden\n        type: time\n        type_params: { time_granularity: day }\n    measures:\n      - name: ingresos_netos_aprobados\n        agg: sum\n        expr: CASE WHEN estado = 'APROBADA' THEN monto_neto_usd ELSE 0 END\n\nmetrics:\n  - name: revenue_neto_oficial\n    type: simple\n    type_params:\n      measure: ingresos_netos_aprobados"
  },
  {
    "id": "fc-17",
    "stageId": "stage-5",
    "discipline": "DA",
    "bloomLevel": "Evaluar",
    "question": "¿Qué es el Sample Ratio Mismatch (SRM) en un experimento A/B y por qué invalida cualquier p-valor o lift observado?",
    "answer": "El SRM ocurre cuando la proporción real de usuarios asignados a Control y Tratamiento difiere estadísticamente de la proporción diseñada (ej. se planeó 50%/50% pero llegaron 50.4%/49.6% con un p-valor de Chi-cuadrado < 0.001). Indica un sesgo grave de selección o pérdida asimétrica de telemetría (ej. la variante B tarda más en cargar y pierde eventos en móviles lentos), invalidando por completo la inferencia causal del test.",
    "codeSnippet": "from scipy.stats import chisquare\n\n# Diseño esperado 50/50 sobre 100,000 usuarios vs conteos observados\nobservados = [50450, 49550]\nesperados = [50000, 50000]\nstat, p_val_srm = chisquare(f_obs=observados, f_exp=esperados)\n\nif p_val_srm < 0.001:\n    raise RuntimeError(f\"[ALERTA] SRM detectado (p={p_val_srm:.6f}): Experimento INVÁLIDO.\")"
  },
  {
    "id": "fc-18",
    "stageId": "stage-5",
    "discipline": "DA",
    "bloomLevel": "Aplicar",
    "question": "¿Cómo logra la técnica CUPED (Controlled-experiment Using Pre-Experiment Data) reducir la varianza y acortar el tiempo necesario de un A/B test?",
    "answer": "CUPED utiliza una covariable X medida ANTES de iniciar el experimento (ej. el gasto del mismo usuario en los 14 días previos) que esté correlacionada con la métrica objetivo Y. Como X no pudo ser afectada por el tratamiento, sustrae la variabilidad preexistente mediante Y_cuped = Y - θ(X - media(X)), donde θ = Cov(Y, X) / Var(X). La varianza se reduce en un factor (1 - r²), permitiendo detectar efectos pequeños con mucha menor muestra.",
    "codeSnippet": "import numpy as np\n\n# Reducción de varianza CUPED: Y = gasto durante test, X = gasto pre-experimento\ntheta = np.cov(y_post, x_pre)[0, 1] / np.var(x_pre)\ny_cuped = y_post - theta * (x_pre - np.mean(x_pre))\n\nreduccion_pct = (1 - np.var(y_cuped) / np.var(y_post)) * 100\nprint(f\"Varianza reducida en {reduccion_pct:.1f}% sin sesgar el estimador ATE\")"
  },
  {
    "id": "fc-19",
    "stageId": "stage-5",
    "discipline": "BI",
    "bloomLevel": "Evaluar",
    "question": "¿Qué establece el principio de Data-Ink Ratio de Edward Tufte y cómo se aplica con atributos preatentivos en el diseño de dashboards ejecutivos?",
    "answer": "El Data-Ink Ratio es la proporción de tinta (píxeles) del gráfico dedicada a representar datos reales frente al total de píxeles usados. Tufte prescribe eliminar todo el \"chartjunk\" (rejillas oscuras, fondos 3D, bordes redundantes, leyendas separadas) y usar atributos preatentivos (color de acento único para anomalías, posición en escala común y Small Multiples) para que la dirección detecte desviaciones en menos de 2 segundos.",
    "codeSnippet": "// Configuración Vega-Lite / BI-as-Code: alto Data-Ink Ratio + color preatentivo\n{\n  \"mark\": { \"type\": \"bar\", \"cornerRadiusEnd\": 2 },\n  \"encoding\": {\n    \"x\": { \"field\": \"ingresos_m\", \"type\": \"quantitative\", \"axis\": { \"grid\": false } },\n    \"y\": { \"field\": \"region\", \"type\": \"nominal\", \"sort\": \"-x\", \"axis\": { \"domain\": false } },\n    \"color\": {\n      \"condition\": { \"test\": \"datum.cumple_meta === false\", \"value\": \"#DC2626\" },\n      \"value\": \"#94A3B8\"\n    }\n  }\n}"
  },
  {
    "id": "fc-20",
    "stageId": "stage-5",
    "discipline": "BI",
    "bloomLevel": "Aplicar",
    "question": "¿Qué ventajas aporta el paradigma BI-as-Code (Evidence.dev, Lightdash, Rill, Malloy) frente a construir reportes manualmente con clics en herramientas legadas?",
    "answer": "Con BI-as-Code, las consultas SQL, métricas y componentes visuales se definen en archivos Markdown/YAML versionados en Git. Esto habilita revisiones por Pull Request, entornos de previsualización por rama, pruebas automáticas de CI que verifican que ningún cambio en dbt/SQLMesh rompa un gráfico antes de fusionar a producción, y trazabilidad de linaje de extremo a extremo (Data-to-Dashboard Lineage).",
    "codeSnippet": "<!-- Reporte ejecutivo versionado en Git con Evidence.dev (BI-as-Code) -->\n```sql kpi_mensual\nSELECT\n  mes,\n  ingresos_netos_usd,\n  margen_bruto_pct,\n  ingresos_netos_usd - LAG(ingresos_netos_usd) OVER (ORDER BY mes) AS delta_mom\nFROM gold.metricas_ejecutivas\n```\n\n<BigValue data={kpi_mensual} value=\"ingresos_netos_usd\" comparison=\"delta_mom\" fmt=\"usd0\" />"
  },
  {
    "id": "fc-21",
    "stageId": "stage-6",
    "discipline": "DE",
    "bloomLevel": "Analizar",
    "question": "¿Por qué el Change Data Capture (CDC) basado en logs (Debezium leyendo el WAL de PostgreSQL o Binlog de MySQL) supera a la extracción por consultas SELECT con updated_at?",
    "answer": "El CDC basado en el Write-Ahead Log (WAL) lee secuencialmente el registro de transacciones físicas ya confirmado por el motor OLTP sin ejecutar consultas pesadas contra los índices de producción. Además, captura el 100% de las transiciones intermedias de una fila y detecta los borrados físicos (Hard Deletes) como eventos explícitos (op: \"d\"), algo imposible cuando solo se hace polling por WHERE updated_at > last_run.",
    "codeSnippet": "{\n  \"op\": \"u\",\n  \"ts_ms\": 1761682200125,\n  \"source\": { \"connector\": \"postgresql\", \"db\": \"core_prod\", \"table\": \"suscripciones\", \"lsn\": 94827162 },\n  \"before\": { \"id\": 4821, \"plan\": \"PRO\", \"mrr_usd\": 49 },\n  \"after\":  { \"id\": 4821, \"plan\": \"ENTERPRISE\", \"mrr_usd\": 199 }\n}"
  },
  {
    "id": "fc-22",
    "stageId": "stage-6",
    "discipline": "DE",
    "bloomLevel": "Aplicar",
    "question": "¿Cuál es la diferencia entre Event Time y Processing Time en streaming (Apache Flink / Spark Structured Streaming) y para qué sirven los Watermarks?",
    "answer": "Event Time es el instante en que ocurrió realmente el hecho en el dispositivo del usuario; Processing Time es cuando el servidor de streaming procesa el mensaje (que puede llegar minutos u horas tarde si el móvil estuvo sin cobertura). Un Watermark W(t) es un umbral monotónico que le indica al motor que no espera más eventos con timestamp < t, permitiendo cerrar ventanas de agregación con tolerancia controlada a datos tardíos (Bounded Out-of-Orderness).",
    "codeSnippet": "-- Apache Flink SQL: Ventana de 5 min por Event Time con Watermark de 30s de tolerancia\nCREATE TABLE pagos_stream (\n  pago_id STRING,\n  comercio_id STRING,\n  monto_usd DECIMAL(10, 2),\n  evento_ts TIMESTAMP(3),\n  WATERMARK FOR evento_ts AS evento_ts - INTERVAL '30' SECOND\n) WITH ('connector' = 'kafka', 'topic' = 'pagos.cdc', 'format' = 'avro-confluent');"
  },
  {
    "id": "fc-23",
    "stageId": "stage-6",
    "discipline": "BI",
    "bloomLevel": "Crear",
    "question": "¿Por qué conectar agentes de IA mediante un servidor Model Context Protocol (MCP) a la Capa Semántica es mucho más seguro que pedirle al LLM que invente SQL libre sobre tablas crudas?",
    "answer": "El protocolo MCP expone herramientas tipadas (Tools) y recursos (Resources) de solo lectura donde el agente consulta las métricas oficiales y dimensiones certificadas de la Capa Semántica. En lugar de alucinar nombres de tablas o olvidar filtros de órdenes canceladas (Text-to-SQL crudo), el agente invoca la herramienta MCP query_semantic_metric con parámetros validados y credenciales acotadas con Row-Level Security.",
    "codeSnippet": "// Definición de Tool en un servidor MCP conectado a la Capa Semántica\nserver.tool(\n  \"consultar_metrica_certificada\",\n  {\n    metrica: z.enum([\"revenue_neto_oficial\", \"churn_mensual_pct\", \"ltv_cac_ratio\"]),\n    dimensiones: z.array(z.enum([\"region\", \"canal\", \"segmento\"])),\n    fecha_inicio: z.string().date(),\n    fecha_fin: z.string().date(),\n  },\n  async ({ metrica, dimensiones, fecha_inicio, fecha_fin }) => {\n    return await semanticLayer.query({ metrica, dimensiones, fecha_inicio, fecha_fin });\n  }\n);"
  },
  {
    "id": "fc-24",
    "stageId": "stage-6",
    "discipline": "DA",
    "bloomLevel": "Evaluar",
    "question": "¿Cómo combina un sistema Hybrid RAG la búsqueda léxica (BM25) y la búsqueda vectorial densa (HNSW) mediante Reciprocal Rank Fusion (RRF)?",
    "answer": "Los embeddings densos (HNSW) capturan similitud semántica pero suelen fallar al buscar códigos exactos de SKUs, errores SQL o acrónimos internos; por su parte, BM25 sobresale en la coincidencia exacta de términos raros (TF-IDF con saturación). Hybrid RAG ejecuta ambas búsquedas en paralelo y fusiona los rankings sin necesidad de calibrar escalas de scores usando Reciprocal Rank Fusion: RRF(d) = Σ 1 / (k + rank_i(d)), con k ≈ 60.",
    "codeSnippet": "-- Hybrid Search en DuckDB / Postgres (pgvector + FTS) usando Reciprocal Rank Fusion (k=60)\nWITH semantica AS (\n  SELECT doc_id, ROW_NUMBER() OVER (ORDER BY array_cosine_distance(embedding, $query_vec)) AS r_vec\n  FROM docs_conocimiento LIMIT 50\n),\nlexica AS (\n  SELECT doc_id, ROW_NUMBER() OVER (ORDER BY fts_main_docs.match_bm25(doc_id, $query_text) DESC) AS r_bm25\n  FROM docs_conocimiento LIMIT 50\n)\nSELECT\n  COALESCE(s.doc_id, l.doc_id) AS doc_id,\n  COALESCE(1.0 / (60 + s.r_vec), 0) + COALESCE(1.0 / (60 + l.r_bm25), 0) AS rrf_score\nFROM semantica s\nFULL OUTER JOIN lexica l ON s.doc_id = l.doc_id\nORDER BY rrf_score DESC\nLIMIT 10;"
  }
];

export default FLASHCARDS;
