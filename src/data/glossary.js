// Glosario unificado v2 (validado con GlossaryTermSchema) y export compatible GLOSSARY_CONCEPTS_2026
export const GLOSSARY_TERMS = [
  {
    "id": "c01-grain-fanout",
    "term": "Granularidad (Grain) y Trampa del Fan-Out",
    "englishTerm": "DuckDB 1.2 / SQL Estándar (Auditoría de cardinalidad previa al JOIN)",
    "track": "core",
    "definition": "La granularidad define qué representa exactamente una fila en una tabla (por ejemplo, un pedido completo frente a un producto dentro del pedido). La trampa del Fan-Out ocurre cuando unes una tabla maestra con una tabla de detalle 1-a-muchos y sumas importes de la cabecera: las filas se multiplican silenciosamente e inflan los ingresos sin arrojar.",
    "formula": "-- Verificar si la clave es única antes de cruzar tablas:",
    "relatedLessons": [
      "c1-sql-joins-02-grano-fanout",
      "l1-joins-fanout"
    ],
    "relatedTerms": [
      "c02-cte-preagg",
      "c06-star-vs-obt",
      "c21-semantic-layer"
    ],
    "sources": [
      {
        "title": "The Data Warehouse Toolkit (3rd Edition), Chapter 2: Dimensional Modeling Techniques — Declare the Grain",
        "url": "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/grain/",
        "publisher": "Kimball Group",
        "accessed": "2026-10-29",
        "supports": "Declaración explícita del grano antes de diseñar tablas o escribir consultas de agregación."
      }
    ]
  },
  {
    "id": "c02-cte-preagg",
    "term": "Pre-agregación Simétrica en CTEs",
    "englishTerm": "dbt Core / SQLMesh (CTEs modulares por grano de entidad)",
    "track": "core",
    "definition": "Patrón de diseño SQL que consiste en agrupar cada tabla hija dentro de una expresión de tabla común (CTE) hasta igualar la clave primaria exacta de la tabla principal antes de realizar el JOIN. Así garantizas una relación 1-a-1 donde ningún importe monetario se multiplica.",
    "formula": "WITH items_por_pedido AS (",
    "relatedLessons": [
      "c1-sql-joins-02-grano-fanout",
      "l1-joins-fanout"
    ],
    "relatedTerms": [
      "c01-grain-fanout",
      "c20-sqlmesh-dbt-dag"
    ],
    "sources": [
      {
        "title": "The Data Warehouse Toolkit (3rd Edition), Chapter 2: Dimensional Modeling Techniques — Declare the Grain",
        "url": "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/grain/",
        "publisher": "Kimball Group",
        "accessed": "2026-10-29",
        "supports": "Declaración explícita del grano antes de diseñar tablas o escribir consultas de agregación."
      }
    ]
  },
  {
    "id": "c03-window-qualify",
    "term": "Funciones de Ventana y Cláusula QUALIFY",
    "englishTerm": "DuckDB / Snowflake / BigQuery / Databricks SQL",
    "track": "core",
    "definition": "Las funciones de ventana calculan rankings, acumulados o diferencias entre filas vecinas sin colapsar la tabla como hace GROUP BY. La cláusula QUALIFY actúa como el filtro directo de las funciones de ventana, permitiendo quedarse con la versión más reciente de cada evento sin escribir subconsultas anidadas.",
    "formula": "-- Deduplicación idempotente de eventos recibidos por webhook:",
    "relatedLessons": [
      "c2-sql-analitico-01-window-functions",
      "l2-window-functions"
    ],
    "relatedTerms": [
      "c04-asof-join",
      "c05-window-frames",
      "c17-medallion-architecture"
    ],
    "sources": [
      {
        "title": "PostgreSQL 17 Documentation — Section 3.5: Window Functions",
        "url": "https://www.postgresql.org/docs/current/tutorial-window.html",
        "publisher": "PostgreSQL Global Development Group",
        "accessed": "2026-10-29",
        "supports": "Comportamiento de PARTITION BY, ORDER BY y marcos de ventana ROWS frente a RANGE."
      }
    ]
  },
  {
    "id": "c04-asof-join",
    "term": "Cruce Temporal de Precisión (ASOF JOIN y LATERAL)",
    "englishTerm": "DuckDB 1.x / Polars (`join_asof`) / ClickHouse",
    "track": "core",
    "definition": "Operador especializado para unir dos series de tiempo cuyos relojes no coinciden al milisegundo exacto. Para cada evento de la izquierda (como una venta a las 10:14:22), busca automáticamente el registro válido inmediatamente anterior o igual en la tabla derecha (como la cotización de divisa vigente a las 10:12:05).",
    "formula": "SELECT",
    "relatedLessons": [
      "c2-sql-analitico-02-asof-lateral-ctes",
      "l3-asof-lateral-ctes"
    ],
    "relatedTerms": [
      "c03-window-qualify",
      "c07-scd-type-2",
      "c08-point-in-time"
    ],
    "sources": [
      {
        "title": "DuckDB Documentation — ASOF Join",
        "url": "https://duckdb.org/docs/sql/query_syntax/from.html#asof-join",
        "publisher": "DuckDB Foundation",
        "accessed": "2026-10-29",
        "supports": "Sintaxis y algoritmo de emparejamiento temporal de ASOF JOIN en DuckDB."
      }
    ]
  },
  {
    "id": "c05-window-frames",
    "term": "Marcos de Ventana Temporal (RANGE vs. ROWS)",
    "englishTerm": "SQL Estándar 2026 en DuckDB / PostgreSQL / Trino",
    "track": "core",
    "definition": "Al calcular una media móvil de 7 días en SQL, ROWS cuenta 6 filas físicas hacia atrás (lo que distorsiona el promedio si el domingo no hubo ventas y falta esa fila), mientras que RANGE con INTERVAL mira exactamente los últimos 6 días del calendario, respetando los huecos temporales.",
    "formula": "SELECT",
    "relatedLessons": [
      "c2-sql-analitico-01-window-functions",
      "l2-window-functions"
    ],
    "relatedTerms": [
      "c03-window-qualify",
      "c22-cohort-retention-ltv",
      "c25-tufte-visual-perception"
    ],
    "sources": [
      {
        "title": "PostgreSQL 17 Documentation — Section 3.5: Window Functions",
        "url": "https://www.postgresql.org/docs/current/tutorial-window.html",
        "publisher": "PostgreSQL Global Development Group",
        "accessed": "2026-10-29",
        "supports": "Comportamiento de PARTITION BY, ORDER BY y marcos de ventana ROWS frente a RANGE."
      }
    ]
  },
  {
    "id": "c06-star-vs-obt",
    "term": "Esquema en Estrella (Star Schema) vs. One Big Table (OBT)",
    "englishTerm": "Arquitectura Híbrida Kimball Silver + OBT Gold sobre Parquet",
    "track": "core",
    "definition": "El Esquema en Estrella separa los eventos numéricos (Tablas de Hechos) de los atributos descriptivos (Tablas de Dimensión) para facilitar el gobierno y el historial. One Big Table (OBT) pre-une todo en una sola tabla ancha para acelerar lecturas columnares. En 2026 se combinan: Estrella en capa Silver y OBT en capa Gold.",
    "formula": "-- Materialización de OBT en capa Gold desde Star Schema en Silver:",
    "relatedLessons": [
      "c2-dimensional-02-star-schema-obt",
      "l4-star-schema-obt"
    ],
    "relatedTerms": [
      "c01-grain-fanout",
      "c07-scd-type-2",
      "c12-parquet-columnar"
    ],
    "sources": [
      {
        "title": "The Data Warehouse Toolkit (3rd Edition) — Star Schemas and OLAP Cubes",
        "url": "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/star-schema-olap-cube/",
        "publisher": "Kimball Group",
        "accessed": "2026-10-29",
        "supports": "Separación entre tablas de hechos y dimensiones y uso de dimensiones conformadas."
      }
    ]
  },
  {
    "id": "c07-scd-type-2",
    "term": "Dimensión Lentamente Cambiante Tipo 2 (SCD Tipo 2)",
    "englishTerm": "SQLMesh (`SCD_TYPE_2_BY_TIME`) / dbt Snapshots",
    "track": "core",
    "definition": "Técnica de modelado que evita sobrescribir el pasado cuando un atributo cambia (por ejemplo, cuando un cliente pasa del plan Pyme al plan Enterprise). En vez de borrar el valor anterior, cierra la fila vieja con una fecha de fin (valid_to) y abre una fila nueva con fecha de inicio (valid_from) y una nueva clave subrogada.",
    "formula": "MODEL (",
    "relatedLessons": [
      "c2-dimensional-03-scd2-history",
      "l5-scd2-history"
    ],
    "relatedTerms": [
      "c04-asof-join",
      "c06-star-vs-obt",
      "c08-point-in-time"
    ],
    "sources": [
      {
        "title": "Kimball Group — Slowly Changing Dimensions (Types 0, 1, 2, 3, 4, 6)",
        "url": "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/type-2-slowly-changing-dimension/",
        "publisher": "Kimball Group",
        "accessed": "2026-10-29",
        "supports": "Diseño de dimensiones lentamente cambiantes Tipo 2 con claves sustitutas y fechas de vigencia."
      }
    ]
  },
  {
    "id": "c08-point-in-time",
    "term": "Integridad Point-in-Time y Prevención de Data Leakage",
    "englishTerm": "Unión por intervalo de validez SCD2 / Feature Store Point-in-Time",
    "track": "core",
    "definition": "Garantía de que, al analizar una decisión pasada o entrenar un modelo predictivo de bajas (Churn), solo utilizas la información que existía en ese segundo exacto del pasado. Usar una tabla sobrescrita con el estado de hoy introduce \"fuga del futuro\" (Data Leakage) y hace que los modelos fracasen en producción.",
    "formula": "SELECT f.order_id, f.order_ts, d.segment AS segmento_en_el_momento_de_compra",
    "relatedLessons": [
      "c2-dimensional-03-scd2-history",
      "l5-scd2-history"
    ],
    "relatedTerms": [
      "c04-asof-join",
      "c07-scd-type-2",
      "c18-iceberg-v3"
    ],
    "sources": [
      {
        "title": "Kimball Group — Slowly Changing Dimensions (Types 0, 1, 2, 3, 4, 6)",
        "url": "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/type-2-slowly-changing-dimension/",
        "publisher": "Kimball Group",
        "accessed": "2026-10-29",
        "supports": "Diseño de dimensiones lentamente cambiantes Tipo 2 con claves sustitutas y fechas de vigencia."
      }
    ]
  },
  {
    "id": "c09-kpi-trees-guardrails",
    "term": "Árboles de KPIs, Métrica North Star y Guardrails",
    "englishTerm": "MetricFlow / Cube Semantic Layer (Grafo de métricas derivadas)",
    "track": "core",
    "definition": "Estructura jerárquica que descompone la métrica principal del negocio (North Star) en sus palancas operativas mediante una fórmula matemática (por ejemplo, Ingresos = Tráfico x Conversión x Ticket Medio), acompañada siempre de Métricas Guardia (Guardrails) que vigilan que optimizar una palanca no destruya otra (como el margen o las devoluciones).",
    "formula": "metrics:",
    "relatedLessons": [
      "c2-dimensional-04-metrics-simpson",
      "l6-metrics-simpson"
    ],
    "relatedTerms": [
      "c10-simpsons-paradox",
      "c11-additivity-hll",
      "c21-semantic-layer"
    ],
    "sources": [
      {
        "title": "Stanford Encyclopedia of Philosophy — Simpson’s Paradox",
        "url": "https://plato.stanford.edu/entries/paradox-simpson/",
        "publisher": "Stanford University",
        "accessed": "2026-10-29",
        "supports": "Fundamento matemático de la inversión de asociaciones al agregar subpoblaciones con pesos cambiantes."
      }
    ]
  },
  {
    "id": "c10-simpsons-paradox",
    "term": "Paradoja de Simpson y Descomposición Mix vs. Tasa",
    "englishTerm": "SQL Analítico (Descomposición de Kitagawa / Oaxaca-Blinder)",
    "track": "core",
    "definition": "Fenómeno estadístico donde una métrica mejora en absolutamente todos los segmentos por separado (por ejemplo, sube la conversión tanto en Web como en App Móvil), pero el promedio global cae porque creció mucho el volumen de tráfico del segmento con menor tasa base. La descomposición de Kitagawa separa el efecto rendimiento real del efecto cambio de.",
    "formula": "SELECT",
    "relatedLessons": [
      "c2-dimensional-04-metrics-simpson",
      "l6-metrics-simpson"
    ],
    "relatedTerms": [
      "c09-kpi-trees-guardrails",
      "c11-additivity-hll",
      "c23-srm-ab-testing"
    ],
    "sources": [
      {
        "title": "Stanford Encyclopedia of Philosophy — Simpson’s Paradox",
        "url": "https://plato.stanford.edu/entries/paradox-simpson/",
        "publisher": "Stanford University",
        "accessed": "2026-10-29",
        "supports": "Fundamento matemático de la inversión de asociaciones al agregar subpoblaciones con pesos cambiantes."
      }
    ]
  },
  {
    "id": "c11-additivity-hll",
    "term": "Aditividad de Métricas y Sketches HyperLogLog",
    "englishTerm": "DuckDB / Snowflake / Apache DataSketches (`approx_count_distinct`)",
    "track": "core",
    "definition": "Clasificación que determina cómo se puede resumir un número: las métricas aditivas (ventas) se suman en cualquier eje; las semi-aditivas (saldo bancario, inventario) se suman entre sucursales pero jamás entre días; y las no aditivas (tasas, conteos únicos de usuarios) requieren recalcularse desde sus componentes o mediante estructuras HyperLogLog.",
    "formula": "-- Incorrecto: AVG(conversion_diaria). Correcto: razón de sumas aditivas",
    "relatedLessons": [
      "c2-dimensional-04-metrics-simpson",
      "l6-metrics-simpson"
    ],
    "relatedTerms": [
      "c09-kpi-trees-guardrails",
      "c10-simpsons-paradox",
      "c21-semantic-layer"
    ],
    "sources": [
      {
        "title": "Stanford Encyclopedia of Philosophy — Simpson’s Paradox",
        "url": "https://plato.stanford.edu/entries/paradox-simpson/",
        "publisher": "Stanford University",
        "accessed": "2026-10-29",
        "supports": "Fundamento matemático de la inversión de asociaciones al agregar subpoblaciones con pesos cambiantes."
      }
    ]
  },
  {
    "id": "c12-parquet-columnar",
    "term": "Almacenamiento Columnar Apache Parquet y Row Groups",
    "englishTerm": "Apache Parquet con compresión ZSTD y Dictionary Encoding",
    "track": "de",
    "definition": "A diferencia de las bases transaccionales que guardan todos los campos de una fila juntos, Parquet divide la tabla en bloques horizontales (Row Groups de ~128 MB) y dentro de ellos guarda cada columna por separado (Column Chunks). Esto permite leer únicamente las 3 columnas que pide tu consulta e ignorar las otras 80 columnas en.",
    "formula": "COPY (",
    "relatedLessons": [
      "de2-formatos-01-columnar-parquet",
      "l7-columnar-parquet"
    ],
    "relatedTerms": [
      "c06-star-vs-obt",
      "c13-zone-maps-skipping",
      "c18-iceberg-v3"
    ],
    "sources": [
      {
        "title": "Apache Parquet Official Documentation — File Format and Internal Layout",
        "url": "https://parquet.apache.org/docs/file-format/",
        "publisher": "Apache Software Foundation",
        "accessed": "2026-10-29",
        "supports": "Arquitectura interna de Row Groups, Column Chunks, Pages y metadatos en el Footer."
      }
    ]
  },
  {
    "id": "c13-zone-maps-skipping",
    "term": "Zone Maps (Min/Max), Bloom Filters y Data Skipping",
    "englishTerm": "Parquet Page Index + Bloom Filters para alta cardinalidad",
    "track": "de",
    "definition": "Metadatos guardados en el pie de cada archivo Parquet que registran el valor mínimo y máximo de cada columna por bloque. Si los datos se escribieron ordenados por fecha y filtras por hoy, el motor revisa esos límites y salta el 98% de los bloques sin siquiera abrirlos (Data Skipping).",
    "formula": "-- Predicado SARGable que aprovecha Zone Maps al 100%:",
    "relatedLessons": [
      "de2-formatos-01-columnar-parquet",
      "l7-columnar-parquet"
    ],
    "relatedTerms": [
      "c12-parquet-columnar",
      "c15-duckdb-polars-lazy",
      "c18-iceberg-v3"
    ],
    "sources": [
      {
        "title": "Apache Parquet Official Documentation — File Format and Internal Layout",
        "url": "https://parquet.apache.org/docs/file-format/",
        "publisher": "Apache Software Foundation",
        "accessed": "2026-10-29",
        "supports": "Arquitectura interna de Row Groups, Column Chunks, Pages y metadatos en el Footer."
      }
    ]
  },
  {
    "id": "c14-apache-arrow-zerocopy",
    "term": "Apache Arrow Zero-Copy, SIMD y Formatos Lance / Vortex",
    "englishTerm": "Apache Arrow / ADBC / Formatos Columnar Lance y Vortex",
    "track": "de",
    "definition": "Apache Arrow define cómo se representan tablas columnares en memoria RAM para que DuckDB, Polars y PyArrow compartan el mismo puntero sin copiar bytes (Zero-Copy) y procesen lotes en la caché L1/L2 con instrucciones SIMD. Los formatos modernos Lance y Vortex extienden Arrow hacia acceso aleatorio O(1) e índices vectoriales.",
    "formula": "import polars as pl",
    "relatedLessons": [
      "de2-formatos-02-arrow-lance-vortex",
      "l8-arrow-lance-vortex"
    ],
    "relatedTerms": [
      "c12-parquet-columnar",
      "c15-duckdb-polars-lazy",
      "c28-mcp-semantic-rag-evals"
    ],
    "sources": [
      {
        "title": "Apache Arrow Official Specification — Columnar Format and Memory Layout",
        "url": "https://arrow.apache.org/docs/format/Columnar.html",
        "publisher": "Apache Software Foundation",
        "accessed": "2026-10-29",
        "supports": "Disposición física de búferes de validez, offsets y valores en memoria RAM."
      }
    ]
  },
  {
    "id": "c15-duckdb-polars-lazy",
    "term": "Polars Lazy API, DuckDB Out-of-Core y Cuadernos Marimo",
    "englishTerm": "Polars 1.x LazyFrame (`scan_parquet`) + DuckDB 1.x + Marimo `.py`",
    "track": "de",
    "definition": "En lugar de cargar archivos enteros en memoria o sufrir el estado oculto de los notebooks clásicos, Polars Lazy construye un plan lógico con Predicate/Projection Pushdown, DuckDB 1.x ejecuta en paralelo con volcado a disco Out-of-Core y Marimo garantiza reactividad determinista en archivos Python puros.",
    "formula": "import polars as pl",
    "relatedLessons": [
      "de2-formatos-03-duckdb-polars-marimo",
      "l9-duckdb-polars-marimo"
    ],
    "relatedTerms": [
      "c13-zone-maps-skipping",
      "c14-apache-arrow-zerocopy",
      "c26-bi-as-code"
    ],
    "sources": [
      {
        "title": "DuckDB Documentation — Why DuckDB and Out-of-Core Execution",
        "url": "https://duckdb.org/why_duckdb.html",
        "publisher": "DuckDB Foundation",
        "accessed": "2026-10-29",
        "supports": "Ejecución vectorizada en proceso y gestión de memoria más allá de la RAM en un solo nodo."
      }
    ]
  },
  {
    "id": "c16-duckdb-wasm-bi",
    "term": "Analítica en el Navegador con DuckDB-Wasm",
    "englishTerm": "DuckDB-Wasm + Mosaic / Observable Framework / Evidence",
    "track": "de",
    "definition": "Versión del motor analítico DuckDB compilada a WebAssembly que se ejecuta directamente dentro de la pestaña del navegador del usuario. Permite que un dashboard interactivo filtre, agrupe y cruce millones de filas desde archivos Parquet estáticos a 60 cuadros por segundo sin latencia de red ni servidores costosos.",
    "formula": "// Consulta analítica ejecutada en el navegador vía DuckDB-Wasm:",
    "relatedLessons": [
      "de2-formatos-03-duckdb-polars-marimo",
      "l9-duckdb-polars-marimo"
    ],
    "relatedTerms": [
      "c14-apache-arrow-zerocopy",
      "c15-duckdb-polars-lazy",
      "c26-bi-as-code"
    ],
    "sources": [
      {
        "title": "DuckDB Documentation — Why DuckDB and Out-of-Core Execution",
        "url": "https://duckdb.org/why_duckdb.html",
        "publisher": "DuckDB Foundation",
        "accessed": "2026-10-29",
        "supports": "Ejecución vectorizada en proceso y gestión de memoria más allá de la RAM en un solo nodo."
      }
    ]
  },
  {
    "id": "c17-medallion-architecture",
    "term": "Arquitectura Medallion (Capas Bronze, Silver y Gold)",
    "englishTerm": "Open Lakehouse sobre S3 / GCS con catálogo REST (Apache Polaris / Unity)",
    "track": "de",
    "definition": "Patrón de organización del Lakehouse en tres niveles de madurez: Bronze guarda el dato crudo e inmutable tal como llegó de la fuente para poder reprocesar ante cualquier fallo; Silver limpia, deduplica, tipa y modela entidades conformadas; Gold entrega tablas agregadas y gobernadas listas para decisiones ejecutivas.",
    "formula": "-- Promoción de Bronze (crudo) a Silver (tipado, validado y deduplicado):",
    "relatedLessons": [
      "de3-lakehouse-01-iceberg-v3-medallion",
      "l10-iceberg-v3-medallion"
    ],
    "relatedTerms": [
      "c03-window-qualify",
      "c18-iceberg-v3",
      "c20-sqlmesh-dbt-dag"
    ],
    "sources": [
      {
        "title": "Apache Iceberg Official Specification — Table Format v2 and v3",
        "url": "https://iceberg.apache.org/spec/",
        "publisher": "Apache Software Foundation",
        "accessed": "2026-10-29",
        "supports": "Jerarquía de metadatos, aislamiento de instantáneas, vectores de borrado y evolución de esquema."
      }
    ]
  },
  {
    "id": "c18-iceberg-v3",
    "term": "Apache Iceberg v3: Snapshots, Deletion Vectors, Tipo VARIANT y Patrón WAP",
    "englishTerm": "Apache Iceberg v3 + Catálogo REST Apache Polaris / Nessie",
    "track": "de",
    "definition": "Formato abierto de tablas que añade transacciones ACID, evolución de particiones y viajes en el tiempo encima de archivos Parquet. En su especificación v3 (2026), incorpora Deletion Vectors binarios en archivos Puffin, el tipo VARIANT para datos semi-estructurados y el patrón Write-Audit-Publish (WAP).",
    "formula": "-- Viaje en el tiempo exacto en Apache Iceberg v3:",
    "relatedLessons": [
      "de3-lakehouse-01-iceberg-v3-medallion",
      "l10-iceberg-v3-medallion"
    ],
    "relatedTerms": [
      "c08-point-in-time",
      "c12-parquet-columnar",
      "c17-medallion-architecture"
    ],
    "sources": [
      {
        "title": "Apache Iceberg Official Specification — Table Format v2 and v3",
        "url": "https://iceberg.apache.org/spec/",
        "publisher": "Apache Software Foundation",
        "accessed": "2026-10-29",
        "supports": "Jerarquía de metadatos, aislamiento de instantáneas, vectores de borrado y evolución de esquema."
      }
    ]
  },
  {
    "id": "c19-data-contracts-odcs",
    "term": "Contratos de Datos Ejecutables (Estándar ODCS v3)",
    "englishTerm": "Open Data Contract Standard (ODCS v3.0) en CI/CD",
    "track": "de",
    "definition": "Acuerdo formal escrito en código YAML bajo el estándar Open Data Contract Standard (ODCS v3.0) entre el equipo de software que produce un evento y el equipo de datos que lo consume. Define columnas obligatorias, tipos, reglas de calidad y SLAs, validándose en el CI/CD antes de que un cambio rompa los pipelines.",
    "formula": "apiVersion: v3.0.0",
    "relatedLessons": [
      "de3-transformacion-03-contracts-semantic-layer",
      "l12-contracts-semantic-layer"
    ],
    "relatedTerms": [
      "c17-medallion-architecture",
      "c20-sqlmesh-dbt-dag",
      "c21-semantic-layer"
    ],
    "sources": [
      {
        "title": "Bitol / Linux Foundation AI & Data — Open Data Contract Standard (ODCS v3)",
        "url": "https://bitol-io.github.io/open-data-contract-standard/latest/",
        "publisher": "Linux Foundation AI & Data",
        "accessed": "2026-10-29",
        "supports": "Especificación abierta de contratos de datos con esquema, reglas de calidad y acuerdos de servicio."
      }
    ]
  },
  {
    "id": "c20-sqlmesh-dbt-dag",
    "term": "Grafos de Transformación (DAGs), AST SQLGlot y Entornos Virtuales en SQLMesh / dbt",
    "englishTerm": "SQLMesh + SQLGlot / dbt Core 1.9+",
    "track": "de",
    "definition": "Herramientas que convierten tus consultas SQL en un grafo ordenado de dependencias (DAG) con pruebas automáticas y linaje por columna. SQLMesh analiza el árbol sintáctico (AST vía SQLGlot) de tus consultas y crea entornos virtuales de desarrollo que solo recalculan los intervalos afectados y promueven cambios mediante punteros de vistas.",
    "formula": "MODEL (",
    "relatedLessons": [
      "de3-transformacion-01-dbt-sqlmesh-dag",
      "l11-dbt-sqlmesh-dag"
    ],
    "relatedTerms": [
      "c02-cte-preagg",
      "c19-data-contracts-odcs",
      "c21-semantic-layer"
    ],
    "sources": [
      {
        "title": "dbt Labs Best Practices — How We Structure Our dbt Projects (Staging, Intermediate, Marts)",
        "url": "https://docs.getdbt.com/best-practices/how-we-structure/1-guide-overview",
        "publisher": "dbt Labs",
        "accessed": "2026-10-29",
        "supports": "Organización modular del DAG en capas staging, intermediate y marts."
      }
    ]
  },
  {
    "id": "c21-semantic-layer",
    "term": "Capa Semántica Gobernada (MetricFlow / Cube)",
    "englishTerm": "dbt MetricFlow / Cube Cloud / Malloy",
    "track": "de",
    "definition": "Traductor centralizado que vive encima de las tablas Gold donde se define una única vez en código la fórmula oficial de cada métrica (como MRR, Churn o Clientes Activos) y sus entidades primarias/foráneas. Cualquier herramienta (tableros BI, cuadernos Python de DA o agentes IA) consulta la Capa Semántica y recibe exactamente el mismo resultado sin riesgo.",
    "formula": "semantic_models:",
    "relatedLessons": [
      "de3-transformacion-03-contracts-semantic-layer",
      "l12-contracts-semantic-layer"
    ],
    "relatedTerms": [
      "c01-grain-fanout",
      "c09-kpi-trees-guardrails",
      "c28-mcp-semantic-rag-evals"
    ],
    "sources": [
      {
        "title": "Bitol / Linux Foundation AI & Data — Open Data Contract Standard (ODCS v3)",
        "url": "https://bitol-io.github.io/open-data-contract-standard/latest/",
        "publisher": "Linux Foundation AI & Data",
        "accessed": "2026-10-29",
        "supports": "Especificación abierta de contratos de datos con esquema, reglas de calidad y acuerdos de servicio."
      }
    ]
  },
  {
    "id": "c22-cohort-retention-ltv",
    "term": "Análisis de Cohortes, Censura por la Derecha y LTV:CAC con Margen Bruto",
    "englishTerm": "SQL Analítico (Matriz triangular con `FIRST_VALUE` y `DATE_DIFF`)",
    "track": "da",
    "definition": "Agrupación de usuarios según su mes de primera activación (cohorte) para medir qué porcentaje sigue activo (Logo Retention) y cuánto ingreso neto conserva (NRR) tras M1, M3 o M12, respetando la censura por la derecha (manteniendo NULL en meses futuros aún no vividos) y ajustando el LTV por el margen bruto real.",
    "formula": "SELECT",
    "relatedLessons": [
      "da3-producto-02-cohorts-retention-ltv",
      "l13-cohorts-retention-ltv"
    ],
    "relatedTerms": [
      "c05-window-frames",
      "c09-kpi-trees-guardrails",
      "c25-tufte-visual-perception"
    ],
    "sources": [
      {
        "title": "Statsig Documentation — Retention and Cohort Analysis Methodology",
        "url": "https://docs.statsig.com/pulse/retention/",
        "publisher": "Statsig",
        "accessed": "2026-10-29",
        "supports": "Cálculo de curvas de retención por cohorte y manejo de ventanas completas de observación."
      }
    ]
  },
  {
    "id": "c23-srm-ab-testing",
    "term": "Sample Ratio Mismatch (SRM) y Pruebas Secuenciales en A/B Testing",
    "englishTerm": "Test Chi-cuadrado de SRM + Pruebas Secuenciales mSPRT en SQL / Python",
    "track": "da",
    "definition": "El Sample Ratio Mismatch (SRM) ocurre cuando diseñas un experimento 50%/50%, pero la proporción real de usuarios asignados se desvía significativamente (por ejemplo, 51.7% vs 48.3%). Es la señal inequívoca de un fallo técnico o sesgo de supervivencia en la instrumentación que invalida por completo el experimento antes de mirar cualquier métrica.",
    "formula": "-- Verificación automática de Sample Ratio Mismatch (SRM) 50/50:",
    "relatedLessons": [
      "da3-experimentos-01-ab-testing-cuped",
      "l14-ab-testing-cuped"
    ],
    "relatedTerms": [
      "c10-simpsons-paradox",
      "c24-cuped-variance"
    ],
    "sources": [
      {
        "title": "Deng, Xu, Kohavi & Walker (WSDM 2013) — Improving the Sensitivity of Online Controlled Experiments by Utilizing Pre-Experiment Data (CUPED)",
        "url": "https://exp-platform.com/Documents/2013-02-CUPED-ImprovingSensitivityOfControlledExperiments.pdf",
        "publisher": "Microsoft Research / Experimentation Platform",
        "accessed": "2026-10-29",
        "supports": "Derivación matemática del estimador CUPED y factor de reducción de varianza (1 - r²)."
      }
    ]
  },
  {
    "id": "c24-cuped-variance",
    "term": "Reducción de Varianza Pre-Experimental (CUPED)",
    "englishTerm": "Ajuste lineal por covariable en SQL (`COVAR_SAMP / VAR_SAMP`)",
    "track": "da",
    "definition": "Técnica estadística (Controlled-experiment Using Pre-Experiment Data) que utiliza el comportamiento de cada usuario durante las dos semanas previas al inicio del experimento para descontar la varianza natural entre clientes. Permite detectar impactos reales con hasta un 50% menos de tráfico y en la mitad de tiempo sin introducir sesgo.",
    "formula": "WITH theta_calc AS (",
    "relatedLessons": [
      "da3-experimentos-01-ab-testing-cuped",
      "l14-ab-testing-cuped"
    ],
    "relatedTerms": [
      "c08-point-in-time",
      "c23-srm-ab-testing",
      "c25-tufte-visual-perception"
    ],
    "sources": [
      {
        "title": "Deng, Xu, Kohavi & Walker (WSDM 2013) — Improving the Sensitivity of Online Controlled Experiments by Utilizing Pre-Experiment Data (CUPED)",
        "url": "https://exp-platform.com/Documents/2013-02-CUPED-ImprovingSensitivityOfControlledExperiments.pdf",
        "publisher": "Microsoft Research / Experimentation Platform",
        "accessed": "2026-10-29",
        "supports": "Derivación matemática del estimador CUPED y factor de reducción de varianza (1 - r²)."
      }
    ]
  },
  {
    "id": "c25-tufte-visual-perception",
    "term": "Percepción Visual (Tufte / Few), Small Multiples y BI-as-Code",
    "englishTerm": "Evidence.dev / Observable Framework / Rill + Jerarquía de Cleveland & McGill",
    "track": "bi",
    "definition": "Principios de diseño cuantitativo basados en cómo el ojo humano decodifica longitudes alineadas con diez veces más precisión que ángulos en gráficos circulares, combinados con BI-as-Code (Evidence, Observable, Rill) para versionar reportes en Markdown + SQL dentro de Git con validación en CI/CD.",
    "formula": "<!-- reports/resumen-ejecutivo.md (BI-as-Code versionado en Git) -->",
    "relatedLessons": [
      "bi3-dashboards-01-bi-tufte-code",
      "l15-bi-tufte-code"
    ],
    "relatedTerms": [
      "c05-window-frames",
      "c16-duckdb-wasm-bi",
      "c24-cuped-variance"
    ],
    "sources": [
      {
        "title": "Cleveland & McGill (JASA 1984) — Graphical Perception: Theory, Experimentation, and Application to the Development of Graphical Methods",
        "url": "https://www.jstor.org/stable/2288400",
        "publisher": "Journal of the American Statistical Association",
        "accessed": "2026-10-29",
        "supports": "Jerarquía experimental de precisión en la percepción de atributos gráficos."
      }
    ]
  },
  {
    "id": "c26-bi-as-code",
    "term": "CDC Basado en Logs (Debezium), Transactional Outbox y WarpStream",
    "englishTerm": "Debezium CDC + Patrón Outbox + Kafka Tiered Storage / WarpStream",
    "track": "de",
    "definition": "Change Data Capture (CDC) lee directamente el registro binario de transacciones (WAL en Postgres o Binlog en MySQL) para capturar inserciones, cambios y borrados físicos en milisegundos sin sobrecargar la base OLTP, apoyándose en el patrón Transactional Outbox y colas Zero-Disk sobre S3 como WarpStream.",
    "formula": "WITH latest_cdc AS (",
    "relatedLessons": [
      "de4-streaming-01-cdc-kafka-streaming",
      "l16-cdc-kafka-streaming"
    ],
    "relatedTerms": [
      "c03-window-qualify",
      "c18-iceberg-v3",
      "c27-cdc-flink-watermarks"
    ],
    "sources": [
      {
        "title": "Debezium Official Documentation — Architecture and PostgreSQL Connector (WAL Logical Decoding)",
        "url": "https://debezium.io/documentation/reference/stable/architecture.html",
        "publisher": "Debezium / Red Hat",
        "accessed": "2026-10-29",
        "supports": "Lectura del registro de transacciones y estructura de sobres de eventos CDC (before, after, op)."
      }
    ]
  },
  {
    "id": "c27-cdc-flink-watermarks",
    "term": "Event Time, Watermarks, Interval Joins y Vistas Materializadas en Flink",
    "englishTerm": "Apache Flink SQL / Arroyo + Materialize / ClickHouse",
    "track": "de",
    "definition": "Al procesar flujos en tiempo real cuyos eventos llegan desordenados por la red móvil, Apache Flink y Arroyo agrupan por la hora real del suceso (Event Time) mediante un Watermark (reloj con holgura que indica hasta qué segundo ya no se esperan retrasos) y acotan el estado en RocksDB mediante Interval Joins.",
    "formula": "CREATE TABLE payments_stream (",
    "relatedLessons": [
      "de4-streaming-03-flink-watermarks-mv",
      "l17-flink-watermarks-mv"
    ],
    "relatedTerms": [
      "c03-window-qualify",
      "c26-bi-as-code",
      "c28-mcp-semantic-rag-evals"
    ],
    "sources": [
      {
        "title": "Apache Flink Official Documentation — Event Time and Generating Watermarks",
        "url": "https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/time/",
        "publisher": "Apache Software Foundation",
        "accessed": "2026-10-29",
        "supports": "Semántica de Event Time, propagación de watermarks entre particiones y manejo de fuentes inactivas."
      }
    ]
  },
  {
    "id": "c28-mcp-semantic-rag-evals",
    "term": "Servidores MCP, Text-to-Semantic-Layer, RAG Híbrido (BM25 + HNSW) y Golden Evals",
    "englishTerm": "Model Context Protocol (MCP) + MetricFlow + RAG Híbrido (BM25 + RRF)",
    "track": "core",
    "definition": "Arquitectura estándar en producción para conectar agentes de IA a los datos de la empresa sin alucinaciones. En lugar de dejar que el LLM invente SQL crudo con JOINs peligrosos, el modelo invoca herramientas gobernadas mediante Model Context Protocol (MCP) sobre la Capa Semántica, recupera contexto con búsqueda híbrida (BM25 léxico + vectores HNSW) y se.",
    "formula": "// Invocación gobernada desde un Agente IA hacia el Servidor MCP Semántico:",
    "relatedLessons": [
      "x4-ia-datos-01-mcp-semantic-ai-rag",
      "l18-mcp-semantic-ai-rag"
    ],
    "relatedTerms": [
      "c19-data-contracts-odcs",
      "c21-semantic-layer",
      "c27-cdc-flink-watermarks"
    ],
    "sources": [
      {
        "title": "Model Context Protocol (MCP) Official Specification — Architecture, Resources, and Tools",
        "url": "https://modelcontextprotocol.io/specification/2025-03-26",
        "publisher": "Model Context Protocol Project",
        "accessed": "2026-10-29",
        "supports": "Arquitectura cliente-servidor MCP y exposición segura de herramientas tipadas hacia modelos."
      }
    ]
  }
];

export const GLOSSARY_BY_ID = Object.fromEntries(GLOSSARY_TERMS.map((t) => [t.id, t]));

export const GLOSSARY_CONCEPTS_2026 = [
  {
    "id": "c01-grain-fanout",
    "number": 1,
    "term": "Granularidad (Grain) y Trampa del Fan-Out",
    "discipline": "Análisis DA",
    "primaryRole": "DA",
    "stageId": "stage-1",
    "lessonId": "l1-joins-fanout",
    "fallbackLessonId": "l1-joins-fanout",
    "lessonNumber": 1,
    "lessonTitle": "El peligro oculto de los JOINs: Granularidad y el Fan-Out Trap",
    "plainDefinition": "La granularidad define qué representa exactamente una fila en una tabla (por ejemplo, un pedido completo frente a un producto dentro del pedido). La trampa del Fan-Out ocurre cuando unes una tabla maestra con una tabla de detalle 1-a-muchos y sumas importes de la cabecera: las filas se multiplican silenciosamente e inflan los ingresos sin arrojar ningún error de sintaxis.",
    "crossRoleConnections": {
      "DE": "Separa físicamente cabeceras y líneas de detalle en la capa Silver o prorratea los importes al nivel más atómico con tests de reconciliación financiera.",
      "BI": "Declara relaciones de cardinalidad exacta y medidas asimétricas en la Capa Semántica para impedir que un usuario sume importes duplicados en un tablero."
    },
    "tool2026": "DuckDB 1.2 / SQL Estándar (Auditoría de cardinalidad previa al JOIN)",
    "syntaxExample": "-- Verificar si la clave es única antes de cruzar tablas:\nSELECT\n  COUNT(*) AS total_filas,\n  COUNT(DISTINCT order_id) AS pedidos_unicos,\n  COUNT(*) - COUNT(DISTINCT order_id) AS filas_duplicadas_potenciales\nFROM silver.order_items;",
    "connectedIds": [
      "c02-cte-preagg",
      "c06-star-vs-obt",
      "c21-semantic-layer"
    ]
  },
  {
    "id": "c02-cte-preagg",
    "number": 2,
    "term": "Pre-agregación Simétrica en CTEs",
    "discipline": "Ingeniería DE",
    "primaryRole": "DE",
    "stageId": "stage-1",
    "lessonId": "l1-joins-fanout",
    "fallbackLessonId": "l1-joins-fanout",
    "lessonNumber": 1,
    "lessonTitle": "El peligro oculto de los JOINs: Granularidad y el Fan-Out Trap",
    "plainDefinition": "Patrón de diseño SQL que consiste en agrupar cada tabla hija dentro de una expresión de tabla común (CTE) hasta igualar la clave primaria exacta de la tabla principal antes de realizar el JOIN. Así garantizas una relación 1-a-1 donde ningún importe monetario se multiplica.",
    "crossRoleConnections": {
      "DA": "Utiliza CTEs pre-agregadas al construir datasets de entrenamiento o embudos de usuario que cruzan sesiones, pagos y tickets de soporte.",
      "BI": "Aprovecha modelos intermedios ya consolidados al mismo grano para que las vistas ejecutivas respondan en milisegundos sin recalcular subconsultas."
    },
    "tool2026": "dbt Core / SQLMesh (CTEs modulares por grano de entidad)",
    "syntaxExample": "WITH items_por_pedido AS (\n  SELECT order_id, SUM(quantity) AS total_unidades\n  FROM silver.order_items\n  GROUP BY order_id\n)\nSELECT o.order_id, o.order_total_usd, COALESCE(i.total_unidades, 0) AS unidades\nFROM silver.orders o\nLEFT JOIN items_por_pedido i ON o.order_id = i.order_id;",
    "connectedIds": [
      "c01-grain-fanout",
      "c20-sqlmesh-dbt-dag"
    ]
  },
  {
    "id": "c03-window-qualify",
    "number": 3,
    "term": "Funciones de Ventana y Cláusula QUALIFY",
    "discipline": "Ingeniería DE",
    "primaryRole": "DE",
    "stageId": "stage-1",
    "lessonId": "l2-window-functions",
    "fallbackLessonId": "l2-window-functions",
    "lessonNumber": 2,
    "lessonTitle": "Window Functions, QUALIFY y ASOF JOIN: SQL Analítico sin Subconsultas",
    "plainDefinition": "Las funciones de ventana calculan rankings, acumulados o diferencias entre filas vecinas sin colapsar la tabla como hace GROUP BY. La cláusula QUALIFY actúa como el filtro directo de las funciones de ventana, permitiendo quedarse con la versión más reciente de cada evento sin escribir subconsultas anidadas.",
    "crossRoleConnections": {
      "DA": "Emplea LAG, LEAD y ROW_NUMBER con QUALIFY para aislar la primera compra de cada cliente o calcular el cambio de gasto entre meses consecutivos.",
      "BI": "Alimenta tablas limpias de duplicados donde cada transacción aparece una única vez, garantizando cuadres contables exactos."
    },
    "tool2026": "DuckDB / Snowflake / BigQuery / Databricks SQL",
    "syntaxExample": "-- Deduplicación idempotente de eventos recibidos por webhook:\nSELECT event_id, customer_id, mrr_usd, updated_at\nFROM raw.subscription_events\nQUALIFY ROW_NUMBER() OVER (\n  PARTITION BY customer_id, DATE_TRUNC('month', updated_at)\n  ORDER BY updated_at DESC\n) = 1;",
    "connectedIds": [
      "c04-asof-join",
      "c05-window-frames",
      "c17-medallion-architecture"
    ]
  },
  {
    "id": "c04-asof-join",
    "number": 4,
    "term": "Cruce Temporal de Precisión (ASOF JOIN y LATERAL)",
    "discipline": "Análisis DA",
    "primaryRole": "DA",
    "stageId": "stage-1",
    "lessonId": "l3-asof-lateral-ctes",
    "fallbackLessonId": "l2-window-functions",
    "lessonNumber": 3,
    "lessonTitle": "Cruces Temporales Exactos con ASOF JOIN y CTEs Modulares",
    "plainDefinition": "Operador especializado para unir dos series de tiempo cuyos relojes no coinciden al milisegundo exacto. Para cada evento de la izquierda (como una venta a las 10:14:22), busca automáticamente el registro válido inmediatamente anterior o igual en la tabla derecha (como la cotización de divisa vigente a las 10:12:05).",
    "crossRoleConnections": {
      "DE": "Sustituye costosos joins de desigualdad (BETWEEN con producto cartesiano parcial) por el algoritmo lineal de ASOF JOIN en pipelines financieros.",
      "BI": "Permite convertir ventas multimoneda al tipo de cambio oficial del minuto exacto de cada operación sin distorsiones cambiarias."
    },
    "tool2026": "DuckDB 1.x / Polars (`join_asof`) / ClickHouse",
    "syntaxExample": "SELECT\n  p.payment_id,\n  p.amount_local,\n  ROUND(p.amount_local * fx.usd_rate, 2) AS amount_usd_exacto\nFROM silver.payments p\nASOF JOIN silver.fx_rates fx\n  ON p.currency = fx.currency\n  AND p.payment_ts >= fx.rate_timestamp;",
    "connectedIds": [
      "c03-window-qualify",
      "c07-scd-type-2",
      "c08-point-in-time"
    ]
  },
  {
    "id": "c05-window-frames",
    "number": 5,
    "term": "Marcos de Ventana Temporal (RANGE vs. ROWS)",
    "discipline": "Business Intelligence BI",
    "primaryRole": "BI",
    "stageId": "stage-1",
    "lessonId": "l2-window-functions",
    "fallbackLessonId": "l2-window-functions",
    "lessonNumber": 2,
    "lessonTitle": "Window Functions y QUALIFY: Particiones, Rankings y Marcos Móviles",
    "plainDefinition": "Al calcular una media móvil de 7 días en SQL, ROWS cuenta 6 filas físicas hacia atrás (lo que distorsiona el promedio si el domingo no hubo ventas y falta esa fila), mientras que RANGE con INTERVAL mira exactamente los últimos 6 días del calendario, respetando los huecos temporales.",
    "crossRoleConnections": {
      "DE": "Genera tablas de calendario continuo (Date Spine) en el Lakehouse para que las series temporales no tengan fechas ausentes.",
      "DA": "Utiliza marcos RANGE para suavizar la estacionalidad semanal antes de detectar anomalías estadísticas en métricas operativas."
    },
    "tool2026": "SQL Estándar 2026 en DuckDB / PostgreSQL / Trino",
    "syntaxExample": "SELECT\n  sale_date,\n  daily_revenue_usd,\n  AVG(daily_revenue_usd) OVER (\n    ORDER BY sale_date\n    RANGE BETWEEN INTERVAL 6 DAYS PRECEDING AND CURRENT ROW\n  ) AS media_movil_7d_calendario\nFROM gold.daily_store_sales;",
    "connectedIds": [
      "c03-window-qualify",
      "c22-cohort-retention-ltv",
      "c25-tufte-visual-perception"
    ]
  },
  {
    "id": "c06-star-vs-obt",
    "number": 6,
    "term": "Esquema en Estrella (Star Schema) vs. One Big Table (OBT)",
    "discipline": "Business Intelligence BI",
    "primaryRole": "BI",
    "stageId": "stage-2",
    "lessonId": "l4-star-schema-obt",
    "fallbackLessonId": "l3-dimensional-modeling",
    "lessonNumber": 4,
    "lessonTitle": "OLTP vs. OLAP: Star Schema de Kimball y One Big Table (OBT)",
    "plainDefinition": "El Esquema en Estrella separa los eventos numéricos (Tablas de Hechos) de los atributos descriptivos (Tablas de Dimensión) para facilitar el gobierno y el historial. One Big Table (OBT) pre-une todo en una sola tabla ancha para acelerar lecturas columnares. En 2026 se combinan: Estrella en capa Silver y OBT en capa Gold.",
    "crossRoleConnections": {
      "DE": "Mantiene la integridad referencial y las claves subrogadas en el esquema en estrella de Silver, y materializa OBT en Parquet donde Dictionary Encoding comprime las cadenas repetidas.",
      "DA": "Consulta la OBT de Gold para exploraciones rápidas en Polars o notebooks sin tener que escribir cinco JOINs repetitivos en cada análisis."
    },
    "tool2026": "Arquitectura Híbrida Kimball Silver + OBT Gold sobre Parquet",
    "syntaxExample": "-- Materialización de OBT en capa Gold desde Star Schema en Silver:\nCREATE OR REPLACE TABLE gold.obt_orders AS\nSELECT\n  f.order_id, f.order_ts, f.net_amount_usd,\n  c.customer_segment, c.country_code,\n  p.product_category, p.brand_name\nFROM silver.fct_orders f\nJOIN silver.dim_customer_scd2 c ON f.customer_sk = c.customer_sk\nJOIN silver.dim_product p ON f.product_sk = p.product_sk;",
    "connectedIds": [
      "c01-grain-fanout",
      "c07-scd-type-2",
      "c12-parquet-columnar"
    ]
  },
  {
    "id": "c07-scd-type-2",
    "number": 7,
    "term": "Dimensión Lentamente Cambiante Tipo 2 (SCD Tipo 2)",
    "discipline": "Ingeniería DE",
    "primaryRole": "DE",
    "stageId": "stage-2",
    "lessonId": "l5-scd2-history",
    "fallbackLessonId": "l3-dimensional-modeling",
    "lessonNumber": 5,
    "lessonTitle": "Historia Auditable con SCD Tipo 2 y Prevención de Data Leakage",
    "plainDefinition": "Técnica de modelado que evita sobrescribir el pasado cuando un atributo cambia (por ejemplo, cuando un cliente pasa del plan Pyme al plan Enterprise). En vez de borrar el valor anterior, cierra la fila vieja con una fecha de fin (valid_to) y abre una fila nueva con fecha de inicio (valid_from) y una nueva clave subrogada.",
    "crossRoleConnections": {
      "DA": "Cruza los eventos con la versión exacta de la dimensión vigente en esa fecha para reconstruir cohortes históricas sin contaminar los datos con cambios futuros.",
      "BI": "Permite responder en el comité ejecutivo tanto \"qué vendió cada segmento según la clasificación de aquel mes\" como \"qué vendió según la clasificación actual\"."
    },
    "tool2026": "SQLMesh (`SCD_TYPE_2_BY_TIME`) / dbt Snapshots",
    "syntaxExample": "MODEL (\n  name silver.dim_customer_scd2,\n  kind SCD_TYPE_2_BY_TIME (\n    unique_key customer_id,\n    updated_at_name updated_at,\n    valid_from_name valid_from,\n    valid_to_name valid_to\n  )\n);\nSELECT customer_id, segment, country_code, updated_at FROM staging.customers;",
    "connectedIds": [
      "c04-asof-join",
      "c06-star-vs-obt",
      "c08-point-in-time"
    ]
  },
  {
    "id": "c08-point-in-time",
    "number": 8,
    "term": "Integridad Point-in-Time y Prevención de Data Leakage",
    "discipline": "Análisis DA",
    "primaryRole": "DA",
    "stageId": "stage-2",
    "lessonId": "l5-scd2-history",
    "fallbackLessonId": "l3-dimensional-modeling",
    "lessonNumber": 5,
    "lessonTitle": "Historia Auditable con SCD Tipo 2 y Prevención de Data Leakage",
    "plainDefinition": "Garantía de que, al analizar una decisión pasada o entrenar un modelo predictivo de bajas (Churn), solo utilizas la información que existía en ese segundo exacto del pasado. Usar una tabla sobrescrita con el estado de hoy introduce \"fuga del futuro\" (Data Leakage) y hace que los modelos fracasen en producción.",
    "crossRoleConnections": {
      "DE": "Proporciona tablas SCD Tipo 2 e instantáneas inmutables en Iceberg para que cualquier estado pasado sea reproducible al 100%.",
      "BI": "Garantiza que los cierres financieros de trimestres anteriores no cambien retroactivamente cuando un cliente actualiza su perfil meses después."
    },
    "tool2026": "Unión por intervalo de validez SCD2 / Feature Store Point-in-Time",
    "syntaxExample": "SELECT f.order_id, f.order_ts, d.segment AS segmento_en_el_momento_de_compra\nFROM silver.fct_orders f\nJOIN silver.dim_customer_scd2 d\n  ON f.customer_id = d.customer_id\n  AND f.order_ts >= d.valid_from\n  AND f.order_ts < COALESCE(d.valid_to, TIMESTAMP '9999-12-31');",
    "connectedIds": [
      "c04-asof-join",
      "c07-scd-type-2",
      "c18-iceberg-v3"
    ]
  },
  {
    "id": "c09-kpi-trees-guardrails",
    "number": 9,
    "term": "Árboles de KPIs, Métrica North Star y Guardrails",
    "discipline": "Business Intelligence BI",
    "primaryRole": "BI",
    "stageId": "stage-2",
    "lessonId": "l6-metrics-simpson",
    "fallbackLessonId": "l4-metrics-simpson",
    "lessonNumber": 6,
    "lessonTitle": "Diseño de Métricas, Árboles de KPIs y la Paradoja de Simpson",
    "plainDefinition": "Estructura jerárquica que descompone la métrica principal del negocio (North Star) en sus palancas operativas mediante una fórmula matemática (por ejemplo, Ingresos = Tráfico x Conversión x Ticket Medio), acompañada siempre de Métricas Guardia (Guardrails) que vigilan que optimizar una palanca no destruya otra (como el margen o las devoluciones).",
    "crossRoleConnections": {
      "DE": "Modela las tablas Gold para que todos los componentes del árbol de métricas compartan dimensiones conformadas (tiempo, región, canal, segmento).",
      "DA": "Cuantifica la sensibilidad de cada rama del árbol y define los umbrales estadísticos de alerta para las métricas guardia en experimentos A/B."
    },
    "tool2026": "MetricFlow / Cube Semantic Layer (Grafo de métricas derivadas)",
    "syntaxExample": "metrics:\n  - name: net_new_mrr_usd\n    type: derived\n    label: \"MRR Neto Nuevo (North Star)\"\n    type_params:\n      expr: new_mrr + expansion_mrr - churned_mrr\n      metrics:\n        - name: new_mrr\n        - name: expansion_mrr\n        - name: churned_mrr",
    "connectedIds": [
      "c10-simpsons-paradox",
      "c11-additivity-hll",
      "c21-semantic-layer"
    ]
  },
  {
    "id": "c10-simpsons-paradox",
    "number": 10,
    "term": "Paradoja de Simpson y Descomposición Mix vs. Tasa",
    "discipline": "Análisis DA",
    "primaryRole": "DA",
    "stageId": "stage-2",
    "lessonId": "l6-metrics-simpson",
    "fallbackLessonId": "l4-metrics-simpson",
    "lessonNumber": 6,
    "lessonTitle": "Diseño de Métricas, Árboles de KPIs y la Paradoja de Simpson",
    "plainDefinition": "Fenómeno estadístico donde una métrica mejora en absolutamente todos los segmentos por separado (por ejemplo, sube la conversión tanto en Web como en App Móvil), pero el promedio global cae porque creció mucho el volumen de tráfico del segmento con menor tasa base. La descomposición de Kitagawa separa el efecto rendimiento real del efecto cambio de mix.",
    "crossRoleConnections": {
      "DE": "Persiste tanto numeradores como denominadores desglosados por las dimensiones clave de confusión (canal, país, dispositivo) para permitir el cálculo a mix constante.",
      "BI": "Incorpora en los tableros ejecutivos el indicador de \"Conversión a Mix Constante\" junto al promedio observado para evitar falsas alarmas en dirección."
    },
    "tool2026": "SQL Analítico (Descomposición de Kitagawa / Oaxaca-Blinder)",
    "syntaxExample": "SELECT\n  ROUND(100.0 * SUM(orders_oct) / SUM(sessions_oct), 2) AS conv_observada_oct_pct,\n  ROUND(100.0 * SUM((1.0 * orders_oct / sessions_oct) * weight_sep), 2) AS conv_mix_fijo_sep_pct\nFROM gold.channel_mix_comparison;",
    "connectedIds": [
      "c09-kpi-trees-guardrails",
      "c11-additivity-hll",
      "c23-srm-ab-testing"
    ]
  },
  {
    "id": "c11-additivity-hll",
    "number": 11,
    "term": "Aditividad de Métricas y Sketches HyperLogLog",
    "discipline": "Business Intelligence BI",
    "primaryRole": "BI",
    "stageId": "stage-2",
    "lessonId": "l6-metrics-simpson",
    "fallbackLessonId": "l4-metrics-simpson",
    "lessonNumber": 6,
    "lessonTitle": "Diseño de Métricas, Árboles de KPIs y la Paradoja de Simpson",
    "plainDefinition": "Clasificación que determina cómo se puede resumir un número: las métricas aditivas (ventas) se suman en cualquier eje; las semi-aditivas (saldo bancario, inventario) se suman entre sucursales pero jamás entre días; y las no aditivas (tasas, conteos únicos de usuarios) requieren recalcularse desde sus componentes o mediante estructuras HyperLogLog.",
    "crossRoleConnections": {
      "DE": "Almacena estructuras binarias HyperLogLog (HLL) o Theta Sketches en las tablas agregadas para poder unir conteos de usuarios únicos en milisegundos sin reescanear eventos crudos.",
      "DA": "Evita el error matemático de promediar porcentajes o sumar usuarios únicos diarios para estimar usuarios mensuales."
    },
    "tool2026": "DuckDB / Snowflake / Apache DataSketches (`approx_count_distinct`)",
    "syntaxExample": "-- Incorrecto: AVG(conversion_diaria). Correcto: razón de sumas aditivas\nSELECT\n  region,\n  SUM(orders_count) * 1.0 / NULLIF(SUM(sessions_count), 0) AS conversion_ponderada_real,\n  APPROX_COUNT_DISTINCT(user_id) AS usuarios_unicos_hll\nFROM gold.fct_daily_funnel\nGROUP BY region;",
    "connectedIds": [
      "c09-kpi-trees-guardrails",
      "c10-simpsons-paradox",
      "c21-semantic-layer"
    ]
  },
  {
    "id": "c12-parquet-columnar",
    "number": 12,
    "term": "Almacenamiento Columnar Apache Parquet y Row Groups",
    "discipline": "Ingeniería DE",
    "primaryRole": "DE",
    "stageId": "stage-3",
    "lessonId": "l7-columnar-parquet",
    "fallbackLessonId": "l5-columnar-parquet",
    "lessonNumber": 7,
    "lessonTitle": "Almacenamiento por Filas vs. por Columnas: Parquet, Row Groups y Zone Maps",
    "plainDefinition": "A diferencia de las bases transaccionales que guardan todos los campos de una fila juntos, Parquet divide la tabla en bloques horizontales (Row Groups de ~128 MB) y dentro de ellos guarda cada columna por separado (Column Chunks). Esto permite leer únicamente las 3 columnas que pide tu consulta e ignorar las otras 80 columnas en disco.",
    "crossRoleConnections": {
      "DA": "Selecciona explícitamente solo las columnas necesarias en sus scripts (Projection Pushdown) para reducir el uso de RAM y multiplicar la velocidad por 20x.",
      "BI": "Obtiene respuestas sub-segundo sobre cientos de millones de registros gracias a la compresión por diccionarios (Dictionary Encoding) de columnas categóricas."
    },
    "tool2026": "Apache Parquet con compresión ZSTD y Dictionary Encoding",
    "syntaxExample": "COPY (\n  SELECT event_date, country_code, customer_id, net_revenue_usd\n  FROM silver.events\n  ORDER BY event_date, country_code\n) TO 's3://lakehouse/gold/events_sorted.parquet'\n(FORMAT PARQUET, COMPRESSION ZSTD, ROW_GROUP_SIZE 1000000);",
    "connectedIds": [
      "c06-star-vs-obt",
      "c13-zone-maps-skipping",
      "c18-iceberg-v3"
    ]
  },
  {
    "id": "c13-zone-maps-skipping",
    "number": 13,
    "term": "Zone Maps (Min/Max), Bloom Filters y Data Skipping",
    "discipline": "Ingeniería DE",
    "primaryRole": "DE",
    "stageId": "stage-3",
    "lessonId": "l7-columnar-parquet",
    "fallbackLessonId": "l5-columnar-parquet",
    "lessonNumber": 7,
    "lessonTitle": "Almacenamiento por Filas vs. por Columnas: Parquet, Row Groups y Zone Maps",
    "plainDefinition": "Metadatos guardados en el pie de cada archivo Parquet que registran el valor mínimo y máximo de cada columna por bloque. Si los datos se escribieron ordenados por fecha y filtras por hoy, el motor revisa esos límites y salta el 98% de los bloques sin siquiera abrirlos (Data Skipping).",
    "crossRoleConnections": {
      "DA": "Escribe filtros limpios sobre columnas crudas (predicados SARGables como `event_ts >= ...`) en vez de envolver la columna en funciones de texto que anulan los Zone Maps.",
      "BI": "Diseña selectores de fecha por defecto en cada tablero para activar el podado automático de bloques y reducir la factura de cómputo en la nube."
    },
    "tool2026": "Parquet Page Index + Bloom Filters para alta cardinalidad",
    "syntaxExample": "-- Predicado SARGable que aprovecha Zone Maps al 100%:\nSELECT country_code, SUM(net_revenue_usd) AS ingresos\nFROM read_parquet('s3://lakehouse/gold/events_sorted.parquet')\nWHERE event_date >= DATE '2026-10-01'\n  AND event_date <  DATE '2026-11-01'\nGROUP BY country_code;",
    "connectedIds": [
      "c12-parquet-columnar",
      "c15-duckdb-polars-lazy",
      "c18-iceberg-v3"
    ]
  },
  {
    "id": "c14-apache-arrow-zerocopy",
    "number": 14,
    "term": "Apache Arrow Zero-Copy, SIMD y Formatos Lance / Vortex",
    "discipline": "Ingeniería DE",
    "primaryRole": "DE",
    "stageId": "stage-3",
    "lessonId": "l8-arrow-lance-vortex",
    "fallbackLessonId": "l6-duckdb-polars-arrow",
    "lessonNumber": 8,
    "lessonTitle": "Apache Arrow Zero-Copy, Ejecución Vectorizada SIMD y Formatos Lance / Vortex",
    "plainDefinition": "Apache Arrow define cómo se representan tablas columnares en memoria RAM para que DuckDB, Polars y PyArrow compartan el mismo puntero sin copiar bytes (Zero-Copy) y procesen lotes en la caché L1/L2 con instrucciones SIMD. Los formatos modernos Lance y Vortex extienden Arrow hacia acceso aleatorio O(1) e índices vectoriales.",
    "crossRoleConnections": {
      "DA": "Alterna libremente entre SQL en DuckDB y expresiones en Polars o modelos en Python dentro del mismo flujo sin sufrir cuellos de botella de memoria.",
      "BI": "Conecta servidores de datos con clientes visuales mediante Arrow Flight SQL y ADBC a velocidades de gigabytes por segundo."
    },
    "tool2026": "Apache Arrow / ADBC / Formatos Columnar Lance y Vortex",
    "syntaxExample": "import polars as pl\nimport duckdb\n\n# 1. Polars expone el flujo columnar en formato Arrow\nlf_clientes = pl.scan_parquet(\"silver/customers.parquet\")\n\n# 2. DuckDB consulta lf_clientes directamente con Zero-Copy (0 copias en RAM)\ntabla_arrow = duckdb.sql(\"SELECT segment, COUNT(*) AS n FROM lf_clientes GROUP BY 1\").arrow()",
    "connectedIds": [
      "c12-parquet-columnar",
      "c15-duckdb-polars-lazy",
      "c28-mcp-semantic-rag-evals"
    ]
  },
  {
    "id": "c15-duckdb-polars-lazy",
    "number": 15,
    "term": "Polars Lazy API, DuckDB Out-of-Core y Cuadernos Marimo",
    "discipline": "Análisis DA",
    "primaryRole": "DA",
    "stageId": "stage-3",
    "lessonId": "l9-duckdb-polars-marimo",
    "fallbackLessonId": "l6-duckdb-polars-arrow",
    "lessonNumber": 9,
    "lessonTitle": "DuckDB 1.x, Polars Lazy API y Notebooks Reactivos con Marimo",
    "plainDefinition": "En lugar de cargar archivos enteros en memoria o sufrir el estado oculto de los notebooks clásicos, Polars Lazy construye un plan lógico con Predicate/Projection Pushdown, DuckDB 1.x ejecuta en paralelo con volcado a disco Out-of-Core y Marimo garantiza reactividad determinista en archivos Python puros.",
    "crossRoleConnections": {
      "DE": "Reemplaza clústeres pesados y costosos por contenedores ligeros en un solo nodo para el 90% de los pipelines que procesan menos de 500 GB.",
      "BI": "Usa DuckDB-Wasm en el navegador y aplicaciones Marimo versionadas en Git para ofrecer simuladores ejecutivos instantáneos."
    },
    "tool2026": "Polars 1.x LazyFrame (`scan_parquet`) + DuckDB 1.x + Marimo `.py`",
    "syntaxExample": "import polars as pl\n\nq = (\n    pl.scan_parquet(\"s3://lakehouse/silver/orders/*.parquet\")\n    .filter(pl.col(\"order_date\") >= pl.date(2026, 10, 1))\n    .group_by(\"region\")\n    .agg(\n        pl.len().alias(\"pedidos\"),\n        pl.col(\"net_amount_usd\").sum().alias(\"ingresos_usd\"),\n    )\n)\ndf_resultado = q.collect(engine=\"streaming\")",
    "connectedIds": [
      "c13-zone-maps-skipping",
      "c14-apache-arrow-zerocopy",
      "c26-bi-as-code"
    ]
  },
  {
    "id": "c16-duckdb-wasm-bi",
    "number": 16,
    "term": "Analítica en el Navegador con DuckDB-Wasm",
    "discipline": "Business Intelligence BI",
    "primaryRole": "BI",
    "stageId": "stage-3",
    "lessonId": "l9-duckdb-polars-marimo",
    "fallbackLessonId": "l6-duckdb-polars-arrow",
    "lessonNumber": 9,
    "lessonTitle": "DuckDB 1.x, Polars Lazy API y Notebooks Reactivos con Marimo",
    "plainDefinition": "Versión del motor analítico DuckDB compilada a WebAssembly que se ejecuta directamente dentro de la pestaña del navegador del usuario. Permite que un dashboard interactivo filtre, agrupe y cruce millones de filas desde archivos Parquet estáticos a 60 cuadros por segundo sin latencia de red ni servidores costosos.",
    "crossRoleConnections": {
      "DE": "Publica extractos Parquet optimizados y particionados en un CDN seguro con cabeceras HTTP Range Requests para que el navegador descargue solo los bloques necesarios.",
      "DA": "Comparte cuadernos interactivos reproducibles que se ejecutan en el navegador del lector sin requerir instalación de Python."
    },
    "tool2026": "DuckDB-Wasm + Mosaic / Observable Framework / Evidence",
    "syntaxExample": "// Consulta analítica ejecutada en el navegador vía DuckDB-Wasm:\nconst conn = await db.connect();\nawait conn.query(`\n  CREATE VIEW ventas_oct AS\n  SELECT * FROM read_parquet('https://cdn.empresa.com/gold/ventas_2026_10.parquet');\n`);\nconst arrowResult = await conn.query(\"SELECT region, SUM(mrr) FROM ventas_oct GROUP BY 1\");",
    "connectedIds": [
      "c14-apache-arrow-zerocopy",
      "c15-duckdb-polars-lazy",
      "c26-bi-as-code"
    ]
  },
  {
    "id": "c17-medallion-architecture",
    "number": 17,
    "term": "Arquitectura Medallion (Capas Bronze, Silver y Gold)",
    "discipline": "Ingeniería DE",
    "primaryRole": "DE",
    "stageId": "stage-4",
    "lessonId": "l10-iceberg-v3-medallion",
    "fallbackLessonId": "l7-iceberg-lakehouse",
    "lessonNumber": 10,
    "lessonTitle": "Arquitectura Medallion y Apache Iceberg v3: Snapshots, Deletion Vectors y Tipo Variant",
    "plainDefinition": "Patrón de organización del Lakehouse en tres niveles de madurez: Bronze guarda el dato crudo e inmutable tal como llegó de la fuente para poder reprocesar ante cualquier fallo; Silver limpia, deduplica, tipa y modela entidades conformadas; Gold entrega tablas agregadas y gobernadas listas para decisiones ejecutivas.",
    "crossRoleConnections": {
      "DA": "Trabaja principalmente sobre la capa Silver (datos limpios al nivel más granular y con historia SCD2) para explorar hipótesis y entrenar modelos.",
      "BI": "Conecta los reportes y la Capa Semántica exclusivamente a la capa Gold, donde las reglas de negocio y SLAs están certificados."
    },
    "tool2026": "Open Lakehouse sobre S3 / GCS con catálogo REST (Apache Polaris / Unity)",
    "syntaxExample": "-- Promoción de Bronze (crudo) a Silver (tipado, validado y deduplicado):\nINSERT INTO lakehouse.silver.orders\nSELECT\n  CAST(payload.order_id AS VARCHAR) AS order_id,\n  CAST(payload.amount_cents AS DECIMAL(12,2)) / 100.0 AS amount_usd,\n  CAST(payload.created_at AS TIMESTAMP) AS order_ts\nFROM lakehouse.bronze.raw_webhooks\nWHERE payload.order_id IS NOT NULL\nQUALIFY ROW_NUMBER() OVER (PARTITION BY payload.order_id ORDER BY _ingested_at DESC) = 1;",
    "connectedIds": [
      "c03-window-qualify",
      "c18-iceberg-v3",
      "c20-sqlmesh-dbt-dag"
    ]
  },
  {
    "id": "c18-iceberg-v3",
    "number": 18,
    "term": "Apache Iceberg v3: Snapshots, Deletion Vectors, Tipo VARIANT y Patrón WAP",
    "discipline": "Ingeniería DE",
    "primaryRole": "DE",
    "stageId": "stage-4",
    "lessonId": "l10-iceberg-v3-medallion",
    "fallbackLessonId": "l7-iceberg-lakehouse",
    "lessonNumber": 10,
    "lessonTitle": "Arquitectura Medallion y Apache Iceberg v3: Snapshots, Deletion Vectors y Tipo Variant",
    "plainDefinition": "Formato abierto de tablas que añade transacciones ACID, evolución de particiones y viajes en el tiempo encima de archivos Parquet. En su especificación v3 (2026), incorpora Deletion Vectors binarios en archivos Puffin, el tipo VARIANT para datos semi-estructurados y el patrón Write-Audit-Publish (WAP).",
    "crossRoleConnections": {
      "DA": "Utiliza consultas Time Travel (`FOR SYSTEM_TIME AS OF`) para reproducir exactamente el estado de los datos de cualquier fecha pasada.",
      "BI": "Lee las tablas Gold en modo Direct Lake sin sufrir nunca lecturas a medias ni bloqueos mientras ingeniería actualiza los pipelines."
    },
    "tool2026": "Apache Iceberg v3 + Catálogo REST Apache Polaris / Nessie",
    "syntaxExample": "-- Viaje en el tiempo exacto en Apache Iceberg v3:\nSELECT\n  region,\n  SUM(net_revenue_usd) AS ingresos_snapshot_cierre\nFROM lakehouse.gold.fct_orders\nFOR SYSTEM_TIME AS OF TIMESTAMP '2026-10-01 00:00:00'\nGROUP BY region;",
    "connectedIds": [
      "c08-point-in-time",
      "c12-parquet-columnar",
      "c17-medallion-architecture"
    ]
  },
  {
    "id": "c19-data-contracts-odcs",
    "number": 19,
    "term": "Contratos de Datos Ejecutables (Estándar ODCS v3)",
    "discipline": "Ingeniería DE",
    "primaryRole": "DE",
    "stageId": "stage-4",
    "lessonId": "l12-contracts-semantic-layer",
    "fallbackLessonId": "l8-semantic-contracts",
    "lessonNumber": 12,
    "lessonTitle": "Data Contracts (ODCS v3) y Capa Semántica Unificada con MetricFlow y Cube",
    "plainDefinition": "Acuerdo formal escrito en código YAML bajo el estándar Open Data Contract Standard (ODCS v3.0) entre el equipo de software que produce un evento y el equipo de datos que lo consume. Define columnas obligatorias, tipos, reglas de calidad y SLAs, validándose en el CI/CD antes de que un cambio rompa los pipelines.",
    "crossRoleConnections": {
      "DA": "Confía en que las variables críticas de sus modelos no cambiarán de significado ni empezarán a llegar con valores nulos silenciosos tras un despliegue de backend.",
      "BI": "Elimina las mañanas de lunes con dashboards rotos por columnas renombradas sin aviso en las bases de producción."
    },
    "tool2026": "Open Data Contract Standard (ODCS v3.0) en CI/CD",
    "syntaxExample": "apiVersion: v3.0.0\nkind: DataContract\nid: urn:datacontract:checkout:orders_v2\nschema:\n  - name: order_id\n    type: string\n    required: true\n    unique: true\n  - name: net_amount_usd\n    type: decimal(12,2)\n    quality:\n      - type: sql\n        query: \"SELECT COUNT(*) FROM orders WHERE net_amount_usd < 0\"\n        mustBe: 0",
    "connectedIds": [
      "c17-medallion-architecture",
      "c20-sqlmesh-dbt-dag",
      "c21-semantic-layer"
    ]
  },
  {
    "id": "c20-sqlmesh-dbt-dag",
    "number": 20,
    "term": "Grafos de Transformación (DAGs), AST SQLGlot y Entornos Virtuales en SQLMesh / dbt",
    "discipline": "Ingeniería DE",
    "primaryRole": "DE",
    "stageId": "stage-4",
    "lessonId": "l11-dbt-sqlmesh-dag",
    "fallbackLessonId": "l8-semantic-contracts",
    "lessonNumber": 11,
    "lessonTitle": "Transformación Moderna con dbt y SQLMesh: AST SQL y Entornos Virtuales",
    "plainDefinition": "Herramientas que convierten tus consultas SQL en un grafo ordenado de dependencias (DAG) con pruebas automáticas y linaje por columna. SQLMesh analiza el árbol sintáctico (AST vía SQLGlot) de tus consultas y crea entornos virtuales de desarrollo que solo recalculan los intervalos afectados y promueven cambios mediante punteros de vistas.",
    "crossRoleConnections": {
      "DA": "Promueve sus hallazgos y nuevas variables analíticas directamente al repositorio compartido con control de versiones Git y tests unitarios.",
      "BI": "Rastrea el linaje completo de cualquier columna del dashboard hasta su tabla origen para auditar de dónde sale cada cifra."
    },
    "tool2026": "SQLMesh + SQLGlot / dbt Core 1.9+",
    "syntaxExample": "MODEL (\n  name gold.fct_monthly_retention,\n  kind INCREMENTAL_BY_TIME_RANGE (\n    time_column cohort_month\n  ),\n  audits (\n    not_null(columns := (cohort_month, active_customers)),\n    positive_values(column := active_customers)\n  )\n);",
    "connectedIds": [
      "c02-cte-preagg",
      "c19-data-contracts-odcs",
      "c21-semantic-layer"
    ]
  },
  {
    "id": "c21-semantic-layer",
    "number": 21,
    "term": "Capa Semántica Gobernada (MetricFlow / Cube)",
    "discipline": "Business Intelligence BI",
    "primaryRole": "BI",
    "stageId": "stage-4",
    "lessonId": "l12-contracts-semantic-layer",
    "fallbackLessonId": "l8-semantic-contracts",
    "lessonNumber": 12,
    "lessonTitle": "Data Contracts (ODCS v3) y Capa Semántica Unificada con MetricFlow y Cube",
    "plainDefinition": "Traductor centralizado que vive encima de las tablas Gold donde se define una única vez en código la fórmula oficial de cada métrica (como MRR, Churn o Clientes Activos) y sus entidades primarias/foráneas. Cualquier herramienta (tableros BI, cuadernos Python de DA o agentes IA) consulta la Capa Semántica y recibe exactamente el mismo resultado sin riesgo de Fan-Out.",
    "crossRoleConnections": {
      "DE": "Integra la validación de la Capa Semántica con el grafo de transformación para garantizar que ninguna tabla cambie sin actualizar sus métricas.",
      "DA": "Importa las métricas oficiales desde Python mediante el SDK semántico en lugar de reescribir filtros de negocio a mano en cada notebook."
    },
    "tool2026": "dbt MetricFlow / Cube Cloud / Malloy",
    "syntaxExample": "semantic_models:\n  - name: subscriptions\n    model: ref('fct_subscriptions')\n    entities:\n      - name: subscription_id\n        type: primary\n      - name: customer_id\n        type: foreign\n    measures:\n      - name: active_mrr_usd\n        agg: sum\n        expr: CASE WHEN status = 'ACTIVE' THEN mrr_usd ELSE 0 END",
    "connectedIds": [
      "c01-grain-fanout",
      "c09-kpi-trees-guardrails",
      "c28-mcp-semantic-rag-evals"
    ]
  },
  {
    "id": "c22-cohort-retention-ltv",
    "number": 22,
    "term": "Análisis de Cohortes, Censura por la Derecha y LTV:CAC con Margen Bruto",
    "discipline": "Análisis DA",
    "primaryRole": "DA",
    "stageId": "stage-5",
    "lessonId": "l13-cohorts-retention-ltv",
    "fallbackLessonId": "l9-ab-testing-cuped",
    "lessonNumber": 13,
    "lessonTitle": "Análisis de Cohortes, Curvas de Retención, Supervivencia y LTV/CAC",
    "plainDefinition": "Agrupación de usuarios según su mes de primera activación (cohorte) para medir qué porcentaje sigue activo (Logo Retention) y cuánto ingreso neto conserva (NRR) tras M1, M3 o M12, respetando la censura por la derecha (manteniendo NULL en meses futuros aún no vividos) y ajustando el LTV por el margen bruto real.",
    "crossRoleConnections": {
      "DE": "Materializa tablas de actividad mensual por cliente con su fecha de primera activación inmutable y un Date Spine acotado a la fecha actual.",
      "BI": "Visualiza la matriz triangular de retención de logos y de ingresos netos (NRR > 100%) junto al periodo de recuperación del CAC (Payback)."
    },
    "tool2026": "SQL Analítico (Matriz triangular con `FIRST_VALUE` y `DATE_DIFF`)",
    "syntaxExample": "SELECT\n  c.cohort_month,\n  DATE_DIFF('month', c.cohort_month, a.activity_month) AS mes_relativo,\n  COUNT(DISTINCT a.customer_id) AS clientes_activos,\n  SUM(a.mrr_usd * a.gross_margin_pct) AS margen_bruto_cohorte_usd\nFROM silver.user_cohorts c\nJOIN silver.monthly_activity a ON c.customer_id = a.customer_id\nGROUP BY 1, 2;",
    "connectedIds": [
      "c05-window-frames",
      "c09-kpi-trees-guardrails",
      "c25-tufte-visual-perception"
    ]
  },
  {
    "id": "c23-srm-ab-testing",
    "number": 23,
    "term": "Sample Ratio Mismatch (SRM) y Pruebas Secuenciales en A/B Testing",
    "discipline": "Análisis DA",
    "primaryRole": "DA",
    "stageId": "stage-5",
    "lessonId": "l14-ab-testing-cuped",
    "fallbackLessonId": "l9-ab-testing-cuped",
    "lessonNumber": 14,
    "lessonTitle": "Experimentación A/B Científica: Sample Ratio Mismatch (SRM), Potencia y Ajuste CUPED",
    "plainDefinition": "El Sample Ratio Mismatch (SRM) ocurre cuando diseñas un experimento 50%/50%, pero la proporción real de usuarios asignados se desvía significativamente (por ejemplo, 51.7% vs 48.3%). Es la señal inequívoca de un fallo técnico o sesgo de supervivencia en la instrumentación que invalida por completo el experimento antes de mirar cualquier métrica.",
    "crossRoleConnections": {
      "DE": "Implementa asignación determinista mediante MurmurHash3(`user_id + experiment_salt`) y audita pérdidas de telemetría en el pipeline de eventos.",
      "BI": "Bloquea automáticamente la visualización de ganadores en el dashboard de experimentación si el p-valor del test Chi-cuadrado de SRM es menor a 0.001."
    },
    "tool2026": "Test Chi-cuadrado de SRM + Pruebas Secuenciales mSPRT en SQL / Python",
    "syntaxExample": "-- Verificación automática de Sample Ratio Mismatch (SRM) 50/50:\nSELECT\n  COUNT_IF(variant = 'control') AS n_control,\n  COUNT_IF(variant = 'treatment') AS n_treatment,\n  POWER(COUNT_IF(variant = 'control') - COUNT_IF(variant = 'treatment'), 2)\n    / NULLIF(COUNT(*)::DOUBLE, 0) AS chi_square_stat\nFROM gold.experiment_exposures\nWHERE experiment_id = 'exp_checkout_2026_10';",
    "connectedIds": [
      "c10-simpsons-paradox",
      "c24-cuped-variance"
    ]
  },
  {
    "id": "c24-cuped-variance",
    "number": 24,
    "term": "Reducción de Varianza Pre-Experimental (CUPED)",
    "discipline": "Análisis DA",
    "primaryRole": "DA",
    "stageId": "stage-5",
    "lessonId": "l14-ab-testing-cuped",
    "fallbackLessonId": "l9-ab-testing-cuped",
    "lessonNumber": 14,
    "lessonTitle": "Experimentación A/B Científica: Sample Ratio Mismatch (SRM), Potencia y Ajuste CUPED",
    "plainDefinition": "Técnica estadística (Controlled-experiment Using Pre-Experiment Data) que utiliza el comportamiento de cada usuario durante las dos semanas previas al inicio del experimento para descontar la varianza natural entre clientes. Permite detectar impactos reales con hasta un 50% menos de tráfico y en la mitad de tiempo sin introducir sesgo.",
    "crossRoleConnections": {
      "DE": "Construye el pipeline automatizado que congela las covariables pre-experimento de cada usuario en el segundo exacto previo a su primera exposición.",
      "BI": "Muestra los intervalos de confianza al 95% ajustados por CUPED junto a la estimación puntual para acelerar la toma de decisiones de producto."
    },
    "tool2026": "Ajuste lineal por covariable en SQL (`COVAR_SAMP / VAR_SAMP`)",
    "syntaxExample": "WITH theta_calc AS (\n  SELECT\n    COVAR_SAMP(post_rev, pre_rev_14d) / NULLIF(VAR_SAMP(pre_rev_14d), 0) AS theta,\n    AVG(pre_rev_14d) AS mean_pre\n  FROM gold.experiment_users\n)\nSELECT\n  u.variant,\n  AVG(u.post_rev - t.theta * (u.pre_rev_14d - t.mean_pre)) AS media_cuped_usd\nFROM gold.experiment_users u CROSS JOIN theta_calc t\nGROUP BY u.variant;",
    "connectedIds": [
      "c08-point-in-time",
      "c23-srm-ab-testing",
      "c25-tufte-visual-perception"
    ]
  },
  {
    "id": "c25-tufte-visual-perception",
    "number": 25,
    "term": "Percepción Visual (Tufte / Few), Small Multiples y BI-as-Code",
    "discipline": "Business Intelligence BI",
    "primaryRole": "BI",
    "stageId": "stage-5",
    "lessonId": "l15-bi-tufte-code",
    "fallbackLessonId": "l10-bi-viz-code",
    "lessonNumber": 15,
    "lessonTitle": "Business Intelligence de Alto Impacto: Percepción Visual (Tufte/Few) y BI-as-Code",
    "plainDefinition": "Principios de diseño cuantitativo basados en cómo el ojo humano decodifica longitudes alineadas con diez veces más precisión que ángulos en gráficos circulares, combinados con BI-as-Code (Evidence, Observable, Rill) para versionar reportes en Markdown + SQL dentro de Git con validación en CI/CD.",
    "crossRoleConnections": {
      "DA": "Aporta bandas de incertidumbre, metas explícitas y narrativa activa (Pirámide de Minto) para que cada visualización comunique magnitud y significancia.",
      "DE": "Ejecuta la compilación del proyecto BI-as-Code en el pipeline de CI/CD para impedir que cambios de esquema rompan reportes ejecutivos."
    },
    "tool2026": "Evidence.dev / Observable Framework / Rill + Jerarquía de Cleveland & McGill",
    "syntaxExample": "<!-- reports/resumen-ejecutivo.md (BI-as-Code versionado en Git) -->\n## La retención neta en LATAM subió al 114.8% (+320 bps vs meta)\n\n```sql kpi_latam\nSELECT country, mrr_actual_usd, nrr_pct, vs_target_bps\nFROM gold.fct_executive_summary\nWHERE region = 'LATAM' ORDER BY mrr_actual_usd DESC\n```\n\n<DataTable data={kpi_latam} rows=10 />",
    "connectedIds": [
      "c05-window-frames",
      "c16-duckdb-wasm-bi",
      "c24-cuped-variance"
    ]
  },
  {
    "id": "c26-bi-as-code",
    "number": 26,
    "term": "CDC Basado en Logs (Debezium), Transactional Outbox y WarpStream",
    "discipline": "Ingeniería DE",
    "primaryRole": "DE",
    "stageId": "stage-6",
    "lessonId": "l16-cdc-kafka-streaming",
    "fallbackLessonId": "l11-streaming-watermarks",
    "lessonNumber": 16,
    "lessonTitle": "Ingesta CDC Basada en Logs (Debezium), Kafka Tiered Storage / WarpStream y Cuándo Usar Streaming",
    "plainDefinition": "Change Data Capture (CDC) lee directamente el registro binario de transacciones (WAL en Postgres o Binlog en MySQL) para capturar inserciones, cambios y borrados físicos en milisegundos sin sobrecargar la base OLTP, apoyándose en el patrón Transactional Outbox y colas Zero-Disk sobre S3 como WarpStream.",
    "crossRoleConnections": {
      "DA": "Aprovecha los estados anterior y posterior (`before` y `after`) del flujo CDC para medir tiempos exactos de transición de embudo y filtrar órdenes eliminadas (`op = \"d\"`).",
      "BI": "Distingue entre tableros operativos en vivo y tableros financieros auditados mostrando el indicador de latencia extremo a extremo del flujo CDC."
    },
    "tool2026": "Debezium CDC + Patrón Outbox + Kafka Tiered Storage / WarpStream",
    "syntaxExample": "WITH latest_cdc AS (\n  SELECT\n    COALESCE(after_order_id, before_order_id) AS order_id,\n    after_amount_usd AS amount_usd,\n    op,\n    source_lsn\n  FROM bronze.orders_cdc_stream\n  QUALIFY ROW_NUMBER() OVER (\n    PARTITION BY COALESCE(after_order_id, before_order_id)\n    ORDER BY source_lsn DESC\n  ) = 1\n)\nSELECT * FROM latest_cdc WHERE op != 'd';",
    "connectedIds": [
      "c03-window-qualify",
      "c18-iceberg-v3",
      "c27-cdc-flink-watermarks"
    ]
  },
  {
    "id": "c27-cdc-flink-watermarks",
    "number": 27,
    "term": "Event Time, Watermarks, Interval Joins y Vistas Materializadas en Flink",
    "discipline": "Ingeniería DE",
    "primaryRole": "DE",
    "stageId": "stage-6",
    "lessonId": "l17-flink-watermarks-mv",
    "fallbackLessonId": "l11-streaming-watermarks",
    "lessonNumber": 17,
    "lessonTitle": "Apache Flink, Arroyo y Vistas Materializadas: Event Time, Watermarks y Estado Acotado",
    "plainDefinition": "Al procesar flujos en tiempo real cuyos eventos llegan desordenados por la red móvil, Apache Flink y Arroyo agrupan por la hora real del suceso (Event Time) mediante un Watermark (reloj con holgura que indica hasta qué segundo ya no se esperan retrasos) y acotan el estado en RocksDB mediante Interval Joins.",
    "crossRoleConnections": {
      "DA": "Estudia la distribución estadística del retraso de red (lateness p99) para definir cuántos segundos debe esperar el Watermark sin perder precisión ni frescura.",
      "BI": "Conecta tableros operativos en vivo a vistas materializadas incrementales (Materialize / ClickHouse) diferenciando ventanas ya cerradas de minutos en curso."
    },
    "tool2026": "Apache Flink SQL / Arroyo + Materialize / ClickHouse",
    "syntaxExample": "CREATE TABLE payments_stream (\n  payment_id STRING,\n  amount_usd DECIMAL(10, 2),\n  event_time TIMESTAMP(3),\n  WATERMARK FOR event_time AS event_time - INTERVAL '30' SECOND\n) WITH ('connector' = 'kafka', 'topic' = 'prod.payments.cdc');",
    "connectedIds": [
      "c03-window-qualify",
      "c26-bi-as-code",
      "c28-mcp-semantic-rag-evals"
    ]
  },
  {
    "id": "c28-mcp-semantic-rag-evals",
    "number": 28,
    "term": "Servidores MCP, Text-to-Semantic-Layer, RAG Híbrido (BM25 + HNSW) y Golden Evals",
    "discipline": "Business Intelligence BI",
    "primaryRole": "BI",
    "stageId": "stage-6",
    "lessonId": "l18-mcp-semantic-ai-rag",
    "fallbackLessonId": "l12-mcp-ai-agents",
    "lessonNumber": 18,
    "lessonTitle": "IA + Datos en Actual: Servidores MCP, Text-to-Semantic-Layer, RAG Híbrido (BM25 + HNSW) y Golden Evals",
    "plainDefinition": "Arquitectura estándar en producción para conectar agentes de IA a los datos de la empresa sin alucinaciones. En lugar de dejar que el LLM invente SQL crudo con JOINs peligrosos, el modelo invoca herramientas gobernadas mediante Model Context Protocol (MCP) sobre la Capa Semántica, recupera contexto con búsqueda híbrida (BM25 léxico + vectores HNSW) y se audita continuamente contra un conjunto de preguntas verificadas (Golden Evals).",
    "crossRoleConnections": {
      "DE": "Desarrolla el Servidor MCP en modo solo lectura con límites de costo, enmascaramiento de PII, validación sintáctica en SQLGlot e índices híbridos en DuckDB/Lance.",
      "DA": "Diseña el benchmark de Golden Evals y equipa al agente con herramientas de verificación estadística para que no confunda ruido aleatorio con hallazgos causales."
    },
    "tool2026": "Model Context Protocol (MCP) + MetricFlow + RAG Híbrido (BM25 + RRF)",
    "syntaxExample": "// Invocación gobernada desde un Agente IA hacia el Servidor MCP Semántico:\nconst respuesta = await mcpClient.callTool(\"query_governed_metrics\", {\n  metrics: [\"net_revenue_retention_pct\", \"active_paying_customers\"],\n  dimensions: [\"customer__segment\", \"region\"],\n  time_grain: \"month\",\n  where: \"metric_time >= '2026-07-01' AND metric_time < '2026-10-01'\"\n});",
    "connectedIds": [
      "c19-data-contracts-odcs",
      "c21-semantic-layer",
      "c27-cdc-flink-watermarks"
    ]
  }
];

export default GLOSSARY_TERMS;
