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
    "front": "¿En qué escenarios de 2026 es más eficiente ejecutar DuckDB en un solo nodo (Single-Node Vectorized Engine) en lugar de levantar un clúster distribuido de Apache Spark?",
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
    "back": "El protocolo MCP expone herramientas tipadas (Tools) y recursos (Resources) de solo lectura donde el agente descubre las métricas oficiales y dimensiones certificadas de la Capa Semántica. En lugar de alucinar nombres de tablas o olvidar filtros de órdenes canceladas (Text-to-SQL crudo), el agente invoca la herramienta MCP query_semantic_metric con parámetros validados y credenciales acotadas con Row-Level Security.",
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
    "back": "Los embeddings densos (HNSW) capturan similitud semántica pero suelen fallar al buscar códigos exactos de SKUs, errores SQL o acrónimos internos; por su parte, BM25 domina la coincidencia exacta de términos raros (TF-IDF con saturación). Hybrid RAG ejecuta ambas búsquedas en paralelo y fusiona los rankings sin necesidad de calibrar escalas de scores usando Reciprocal Rank Fusion: RRF(d) = Σ 1 / (k + rank_i(d)), con k ≈ 60.",
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
    "front": "¿Por qué nunca debes listar directorios en S3 (`ls s3://...`) para descubrir qué archivos pertenecen a una tabla Iceberg?",
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
    "codeSnippet": "-- ❌ INCORRECTO: Fan-out duplica el monto_orden por cada ítem del pedido\nSELECT SUM(o.monto_total) AS ingresos_inflados\nFROM ordenes o\nJOIN orden_items i ON o.orden_id = i.orden_id;\n\n-- ✅ CORRECTO: Pre-agregar al mismo grano (orden_id) antes del JOIN\nWITH items_por_orden AS (\n  SELECT orden_id, COUNT(*) AS total_items\n  FROM orden_items\n  GROUP BY orden_id\n)\nSELECT SUM(o.monto_total) AS ingresos_reales, SUM(i.total_items) AS unidades\nFROM ordenes o\nLEFT JOIN items_por_orden i ON o.orden_id = i.orden_id;"
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
    "codeSnippet": "-- ❌ INCORRECTO: Promediar el ticket promedio diario distorsiona el resultado mensual\nSELECT AVG(ticket_promedio_diario) FROM resumen_diario;\n\n-- ✅ CORRECTO: Sumar componentes aditivos (numerador / denominador)\nSELECT\n  SUM(ingresos_totales) / NULLIF(SUM(total_ordenes), 0) AS aov_ponderado_real\nFROM gold.resumen_diario_ventas;"
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
    "question": "¿En qué escenarios de 2026 es más eficiente ejecutar DuckDB en un solo nodo (Single-Node Vectorized Engine) en lugar de levantar un clúster distribuido de Apache Spark?",
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
    "codeSnippet": "from scipy.stats import chisquare\n\n# Diseño esperado 50/50 sobre 100,000 usuarios vs conteos observados\nobservados = [50450, 49550]\nesperados = [50000, 50000]\nstat, p_val_srm = chisquare(f_obs=observados, f_exp=esperados)\n\nif p_val_srm < 0.001:\n    raise RuntimeError(f\"🚨 SRM detectado (p={p_val_srm:.6f}): Experimento INVÁLIDO.\")"
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
    "answer": "El protocolo MCP expone herramientas tipadas (Tools) y recursos (Resources) de solo lectura donde el agente descubre las métricas oficiales y dimensiones certificadas de la Capa Semántica. En lugar de alucinar nombres de tablas o olvidar filtros de órdenes canceladas (Text-to-SQL crudo), el agente invoca la herramienta MCP query_semantic_metric con parámetros validados y credenciales acotadas con Row-Level Security.",
    "codeSnippet": "// Definición de Tool en un servidor MCP conectado a la Capa Semántica\nserver.tool(\n  \"consultar_metrica_certificada\",\n  {\n    metrica: z.enum([\"revenue_neto_oficial\", \"churn_mensual_pct\", \"ltv_cac_ratio\"]),\n    dimensiones: z.array(z.enum([\"region\", \"canal\", \"segmento\"])),\n    fecha_inicio: z.string().date(),\n    fecha_fin: z.string().date(),\n  },\n  async ({ metrica, dimensiones, fecha_inicio, fecha_fin }) => {\n    return await semanticLayer.query({ metrica, dimensiones, fecha_inicio, fecha_fin });\n  }\n);"
  },
  {
    "id": "fc-24",
    "stageId": "stage-6",
    "discipline": "DA",
    "bloomLevel": "Evaluar",
    "question": "¿Cómo combina un sistema Hybrid RAG la búsqueda léxica (BM25) y la búsqueda vectorial densa (HNSW) mediante Reciprocal Rank Fusion (RRF)?",
    "answer": "Los embeddings densos (HNSW) capturan similitud semántica pero suelen fallar al buscar códigos exactos de SKUs, errores SQL o acrónimos internos; por su parte, BM25 domina la coincidencia exacta de términos raros (TF-IDF con saturación). Hybrid RAG ejecuta ambas búsquedas en paralelo y fusiona los rankings sin necesidad de calibrar escalas de scores usando Reciprocal Rank Fusion: RRF(d) = Σ 1 / (k + rank_i(d)), con k ≈ 60.",
    "codeSnippet": "-- Hybrid Search en DuckDB / Postgres (pgvector + FTS) usando Reciprocal Rank Fusion (k=60)\nWITH semantica AS (\n  SELECT doc_id, ROW_NUMBER() OVER (ORDER BY array_cosine_distance(embedding, $query_vec)) AS r_vec\n  FROM docs_conocimiento LIMIT 50\n),\nlexica AS (\n  SELECT doc_id, ROW_NUMBER() OVER (ORDER BY fts_main_docs.match_bm25(doc_id, $query_text) DESC) AS r_bm25\n  FROM docs_conocimiento LIMIT 50\n)\nSELECT\n  COALESCE(s.doc_id, l.doc_id) AS doc_id,\n  COALESCE(1.0 / (60 + s.r_vec), 0) + COALESCE(1.0 / (60 + l.r_bm25), 0) AS rrf_score\nFROM semantica s\nFULL OUTER JOIN lexica l ON s.doc_id = l.doc_id\nORDER BY rrf_score DESC\nLIMIT 10;"
  }
];

export default FLASHCARDS;
