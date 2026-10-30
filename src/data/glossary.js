// Glosario unificado v2 (validado con GlossaryTermSchema) y export compatible legacy
export const GLOSSARY_TERMS = [
  {
    "id": "c01-grain-fanout",
    "term": "Granularidad (Grain) y Trampa del Fan-Out",
    "englishTerm": "DuckDB 1.2 / SQL Estándar (Auditoría de cardinalidad previa al JOIN)",
    "track": "core",
    "definition": "La granularidad define qué representa exactamente una fila en una tabla (por ejemplo, un pedido completo frente a un producto dentro del pedido). La trampa del Fan-Out ocurre cuando unes una tabla maestra con una tabla de detalle 1-a-muchos y sumas importes de la cabecera: las filas se multiplican silenciosamente e inflan los ingresos sin arrojar errores de sintaxis.",
    "formula": "-- Verificar si la clave es única antes de cruzar tablas:\nSELECT\n  COUNT(*) AS total_filas,\n  COUNT(DISTINCT order_id) AS pedidos_unicos,\n  COUNT(*) - COUNT(DISTINCT order_id) AS filas_duplicadas_potenciales\nFROM silver.order_items;",
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
    "formula": "WITH items_por_pedido AS (\n  SELECT order_id, SUM(quantity) AS total_unidades\n  FROM silver.order_items\n  GROUP BY order_id\n)\nSELECT o.order_id, o.order_total_usd, COALESCE(i.total_unidades, 0) AS unidades\nFROM silver.orders o\nLEFT JOIN items_por_pedido i ON o.order_id = i.order_id;",
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
    "formula": "-- Deduplicación idempotente de eventos recibidos por webhook:\nSELECT event_id, customer_id, mrr_usd, updated_at\nFROM raw.subscription_events\nQUALIFY ROW_NUMBER() OVER (\n  PARTITION BY customer_id, DATE_TRUNC('month', updated_at)\n  ORDER BY updated_at DESC\n) = 1;",
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
    "formula": "SELECT\n  p.payment_id,\n  p.amount_local,\n  ROUND(p.amount_local * fx.usd_rate, 2) AS amount_usd_exacto\nFROM silver.payments p\nASOF JOIN silver.fx_rates fx\n  ON p.currency = fx.currency\n  AND p.payment_ts >= fx.rate_timestamp;",
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
    "englishTerm": "SQL Estándar en DuckDB / PostgreSQL / Trino",
    "track": "core",
    "definition": "Al calcular una media móvil de 7 días en SQL, ROWS cuenta 6 filas físicas hacia atrás (lo que distorsiona el promedio si el domingo no hubo ventas y falta esa fila), mientras que RANGE con INTERVAL mira exactamente los últimos 6 días del calendario, respetando los huecos temporales.",
    "formula": "SELECT\n  sale_date,\n  daily_revenue_usd,\n  AVG(daily_revenue_usd) OVER (\n    ORDER BY sale_date\n    RANGE BETWEEN INTERVAL 6 DAYS PRECEDING AND CURRENT ROW\n  ) AS media_movil_7d_calendario\nFROM gold.daily_store_sales;",
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
    "definition": "El Esquema en Estrella separa los eventos numéricos (Tablas de Hechos) de los atributos descriptivos (Tablas de Dimensión) para facilitar el gobierno y el historial. One Big Table (OBT) pre-une todo en una sola tabla ancha para acelerar lecturas columnares. En arquitecturas híbridas se combinan: Estrella en capa Silver y OBT en capa Gold.",
    "formula": "-- Materialización de OBT en capa Gold desde Star Schema en Silver:\nCREATE OR REPLACE TABLE gold.obt_orders AS\nSELECT\n  f.order_id, f.order_ts, f.net_amount_usd,\n  c.customer_segment, c.country_code,\n  p.product_category, p.brand_name\nFROM silver.fct_orders f\nJOIN silver.dim_customer_scd2 c ON f.customer_sk = c.customer_sk\nJOIN silver.dim_product p ON f.product_sk = p.product_sk;",
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
    "formula": "MODEL (\n  name silver.dim_customer_scd2,\n  kind SCD_TYPE_2_BY_TIME (\n    unique_key customer_id,\n    updated_at_name updated_at,\n    valid_from_name valid_from,\n    valid_to_name valid_to\n  )\n);\nSELECT customer_id, segment, country_code, updated_at FROM staging.customers;",
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
    "formula": "SELECT f.order_id, f.order_ts, d.segment AS segmento_en_el_momento_de_compra\nFROM silver.fct_orders f\nJOIN silver.dim_customer_scd2 d\n  ON f.customer_id = d.customer_id\n  AND f.order_ts >= d.valid_from\n  AND f.order_ts < COALESCE(d.valid_to, TIMESTAMP '9999-12-31');",
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
    "formula": "metrics:\n  - name: net_new_mrr_usd\n    type: derived\n    label: \"MRR Neto Nuevo (North Star)\"\n    type_params:\n      expr: new_mrr + expansion_mrr - churned_mrr\n      metrics:\n        - name: new_mrr\n        - name: expansion_mrr\n        - name: churned_mrr",
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
    "definition": "Fenómeno estadístico donde una métrica mejora en absolutamente todos los segmentos por separado (por ejemplo, sube la conversión tanto en Web como en App Móvil), pero el promedio global cae porque creció mucho el volumen de tráfico del segmento con menor tasa base. La descomposición de Kitagawa separa el efecto rendimiento real del efecto cambio de mix.",
    "formula": "SELECT\n  ROUND(100.0 * SUM(orders_oct) / SUM(sessions_oct), 2) AS conv_observada_oct_pct,\n  ROUND(100.0 * SUM((1.0 * orders_oct / sessions_oct) * weight_sep), 2) AS conv_mix_fijo_sep_pct\nFROM gold.channel_mix_comparison;",
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
    "formula": "-- Incorrecto: AVG(conversion_diaria). Correcto: razón de sumas aditivas\nSELECT\n  region,\n  SUM(orders_count) * 1.0 / NULLIF(SUM(sessions_count), 0) AS conversion_ponderada_real,\n  APPROX_COUNT_DISTINCT(user_id) AS usuarios_unicos_hll\nFROM gold.fct_daily_funnel\nGROUP BY region;",
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
    "definition": "A diferencia de las bases transaccionales que guardan todos los campos de una fila juntos, Parquet divide la tabla en bloques horizontales (Row Groups de ~128 MB) y dentro de ellos guarda cada columna por separado (Column Chunks). Esto permite leer únicamente las 3 columnas que pide tu consulta e ignorar las otras 80 columnas en disco.",
    "formula": "COPY (\n  SELECT event_date, country_code, customer_id, net_revenue_usd\n  FROM silver.events\n  ORDER BY event_date, country_code\n) TO 's3://lakehouse/gold/events_sorted.parquet'\n(FORMAT PARQUET, COMPRESSION ZSTD, ROW_GROUP_SIZE 1000000);",
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
    "formula": "-- Predicado SARGable que aprovecha Zone Maps al 100%:\nSELECT country_code, SUM(net_revenue_usd) AS ingresos\nFROM read_parquet('s3://lakehouse/gold/events_sorted.parquet')\nWHERE event_date >= DATE '2026-10-01'\n  AND event_date <  DATE '2026-11-01'\nGROUP BY country_code;",
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
    "formula": "import polars as pl\nimport duckdb\n\n# 1. Polars expone el flujo columnar en formato Arrow\nlf_clientes = pl.scan_parquet(\"silver/customers.parquet\")\n\n# 2. DuckDB consulta lf_clientes directamente con Zero-Copy (0 copias en RAM)\ntabla_arrow = duckdb.sql(\"SELECT segment, COUNT(*) AS n FROM lf_clientes GROUP BY 1\").arrow()",
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
    "formula": "import polars as pl\n\nq = (\n    pl.scan_parquet(\"s3://lakehouse/silver/orders/*.parquet\")\n    .filter(pl.col(\"order_date\") >= pl.lit(\"2026-10-01\").str.to_date())\n    .group_by(\"region\")\n    .agg(\n        pl.len().alias(\"pedidos\"),\n        pl.col(\"net_amount_usd\").sum().alias(\"ingresos_usd\"),\n    )\n)\ndf_resultado = q.collect(engine=\"streaming\")",
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
    "formula": "// Consulta analítica ejecutada en el navegador vía DuckDB-Wasm:\nconst conn = await db.connect();\nawait conn.query(`\n  CREATE VIEW ventas_oct AS\n  SELECT * FROM read_parquet('https://cdn.empresa.com/gold/ventas_2026_10.parquet');\n`);\nconst arrowResult = await conn.query(\"SELECT region, SUM(mrr) FROM ventas_oct GROUP BY 1\");",
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
    "formula": "-- Promoción de Bronze (crudo) a Silver (tipado, validado y deduplicado):\nINSERT INTO lakehouse.silver.orders\nSELECT\n  CAST(payload.order_id AS VARCHAR) AS order_id,\n  CAST(payload.amount_cents AS DECIMAL(12,2)) / 100.0 AS amount_usd,\n  CAST(payload.created_at AS TIMESTAMP) AS order_ts\nFROM lakehouse.bronze.raw_webhooks\nWHERE payload.order_id IS NOT NULL\nQUALIFY ROW_NUMBER() OVER (PARTITION BY payload.order_id ORDER BY _ingested_at DESC) = 1;",
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
    "definition": "Formato abierto de tablas que añade transacciones ACID, evolución de particiones y consultas históricas (Time Travel) encima de archivos Parquet. En su especificación v3, incorpora Deletion Vectors binarios en archivos Puffin, el tipo VARIANT para datos semi-estructurados y el patrón Write-Audit-Publish (WAP).",
    "formula": "-- Consulta histórica exacta (Time Travel) en Apache Iceberg v3:\nSELECT\n  region,\n  SUM(net_revenue_usd) AS ingresos_snapshot_cierre\nFROM lakehouse.gold.fct_orders\nFOR SYSTEM_TIME AS OF TIMESTAMP '2026-10-01 00:00:00'\nGROUP BY region;",
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
    "formula": "apiVersion: v3.0.0\nkind: DataContract\nid: urn:datacontract:checkout:orders_v2\nschema:\n  - name: order_id\n    type: string\n    required: true\n    unique: true\n  - name: net_amount_usd\n    type: decimal(12,2)\n    quality:\n      - type: sql\n        query: \"SELECT COUNT(*) FROM orders WHERE net_amount_usd < 0\"\n        mustBe: 0",
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
    "formula": "MODEL (\n  name gold.fct_monthly_retention,\n  kind INCREMENTAL_BY_TIME_RANGE (\n    time_column cohort_month\n  ),\n  audits (\n    not_null(columns := (cohort_month, active_customers)),\n    positive_values(column := active_customers)\n  )\n);",
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
    "definition": "Traductor centralizado que vive encima de las tablas Gold donde se define una única vez en código la fórmula oficial de cada métrica (como MRR, Churn o Clientes Activos) y sus entidades primarias/foráneas. Cualquier herramienta (tableros BI, cuadernos Python de DA o agentes IA) consulta la Capa Semántica y recibe exactamente el mismo resultado sin riesgo de Fan-Out.",
    "formula": "semantic_models:\n  - name: subscriptions\n    model: ref('fct_subscriptions')\n    entities:\n      - name: subscription_id\n        type: primary\n      - name: customer_id\n        type: foreign\n    measures:\n      - name: active_mrr_usd\n        agg: sum\n        expr: CASE WHEN status = 'ACTIVE' THEN mrr_usd ELSE 0 END",
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
    "formula": "SELECT\n  c.cohort_month,\n  DATE_DIFF('month', c.cohort_month, a.activity_month) AS mes_relativo,\n  COUNT(DISTINCT a.customer_id) AS clientes_activos,\n  SUM(a.mrr_usd * a.gross_margin_pct) AS margen_bruto_cohorte_usd\nFROM silver.user_cohorts c\nJOIN silver.monthly_activity a ON c.customer_id = a.customer_id\nGROUP BY 1, 2;",
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
    "formula": "-- Verificación automática de Sample Ratio Mismatch (SRM) 50/50:\nSELECT\n  COUNT_IF(variant = 'control') AS n_control,\n  COUNT_IF(variant = 'treatment') AS n_treatment,\n  POWER(COUNT_IF(variant = 'control') - COUNT_IF(variant = 'treatment'), 2)\n    / NULLIF(COUNT(*)::DOUBLE, 0) AS chi_square_stat\nFROM gold.experiment_exposures\nWHERE experiment_id = 'exp_checkout_2026_10';",
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
    "formula": "WITH theta_calc AS (\n  SELECT\n    COVAR_SAMP(post_rev, pre_rev_14d) / NULLIF(VAR_SAMP(pre_rev_14d), 0) AS theta,\n    AVG(pre_rev_14d) AS mean_pre\n  FROM gold.experiment_users\n)\nSELECT\n  u.variant,\n  AVG(u.post_rev - t.theta * (u.pre_rev_14d - t.mean_pre)) AS media_cuped_usd\nFROM gold.experiment_users u CROSS JOIN theta_calc t\nGROUP BY u.variant;",
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
    "formula": "<!-- reports/resumen-ejecutivo.md (BI-as-Code versionado en Git) -->\n## La retención neta en LATAM subió al 114.8% (+320 bps vs meta)\n\n```sql kpi_latam\nSELECT country, mrr_actual_usd, nrr_pct, vs_target_bps\nFROM gold.fct_executive_summary\nWHERE region = 'LATAM' ORDER BY mrr_actual_usd DESC\n```\n\n<DataTable data={kpi_latam} rows=10 />",
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
    "formula": "WITH latest_cdc AS (\n  SELECT\n    COALESCE(after_order_id, before_order_id) AS order_id,\n    after_amount_usd AS amount_usd,\n    op,\n    source_lsn\n  FROM bronze.orders_cdc_stream\n  QUALIFY ROW_NUMBER() OVER (\n    PARTITION BY COALESCE(after_order_id, before_order_id)\n    ORDER BY source_lsn DESC\n  ) = 1\n)\nSELECT * FROM latest_cdc WHERE op != 'd';",
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
    "formula": "CREATE TABLE payments_stream (\n  payment_id STRING,\n  amount_usd DECIMAL(10, 2),\n  event_time TIMESTAMP(3),\n  WATERMARK FOR event_time AS event_time - INTERVAL '30' SECOND\n) WITH ('connector' = 'kafka', 'topic' = 'prod.payments.cdc');",
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
    "definition": "Arquitectura de producción para conectar agentes de IA a los datos de la empresa sin alucinaciones. En lugar de inventar SQL crudo con JOINs peligrosos, el modelo invoca herramientas gobernadas mediante Model Context Protocol (MCP) sobre la Capa Semántica, recupera contexto con búsqueda híbrida (BM25 + vectores HNSW) y se audita con Golden Evals.",
    "formula": "// Invocación gobernada desde un Agente IA hacia el Servidor MCP Semántico:\nconst respuesta = await mcpClient.callTool(\"query_governed_metrics\", {\n  metrics: [\"net_revenue_retention_pct\", \"active_paying_customers\"],\n  dimensions: [\"customer__segment\", \"region\"],\n  time_grain: \"month\",\n  where: \"metric_time >= '2026-07-01' AND metric_time < '2026-10-01'\"\n});",
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
  },
  {
    "id": "bi2-dax-contexto-evaluacion",
    "term": "Contexto de fila y contexto de filtro en DAX",
    "englishTerm": "Row Context & Filter Context",
    "track": "bi",
    "definition": "Los dos entornos que determinan el valor de una fórmula DAX. El contexto de fila identifica el registro actual al iterar una tabla, pero no propaga filtros por las relaciones; se confunde con el contexto de filtro, que restringe las filas activas del modelo antes de agregar una medida.",
    "formula": "Costo Directo USD = SUMX( order_items, order_items[qty] * RELATED( products[unit_cost_usd] ) )",
    "relatedLessons": [
      "bi2-dax-01-contexto-fila-filtro",
      "bi2-dax-02-calculate-transicion-contexto"
    ],
    "relatedTerms": [
      "bi2-dax-calculate-transicion",
      "bi2-dax-funciones-iteradoras"
    ],
    "sources": [
      {
        "title": "Microsoft Learn — Context in DAX Formulas (Row Context and Filter Context)",
        "url": "https://learn.microsoft.com/en-us/dax/dax-overview#context",
        "publisher": "Microsoft Learn",
        "accessed": "2026-10-29",
        "supports": "Definición y separación semántica entre el contexto de fila y el contexto de filtro en DAX."
      }
    ]
  },
  {
    "id": "bi2-dax-calculate-transicion",
    "term": "Función CALCULATE y transición de contexto",
    "englishTerm": "CALCULATE & Context Transition",
    "track": "bi",
    "definition": "CALCULATE evalúa una expresión dentro de un contexto de filtro modificado por sus argumentos. Cuando se invoca dentro de un contexto de fila, ejecuta la transición de contexto convirtiendo los valores de la fila actual en un filtro equivalente. Se confunde con FILTER, que es un iterador de tabla.",
    "formula": "Ventas Desktop USD = CALCULATE( [Ventas Completadas USD], orders[device_type] = \"desktop\" )",
    "relatedLessons": [
      "bi2-dax-02-calculate-transicion-contexto",
      "bi2-dax-01-contexto-fila-filtro"
    ],
    "relatedTerms": [
      "bi2-dax-contexto-evaluacion",
      "bi2-dax-modificadores-filtro"
    ],
    "sources": [
      {
        "title": "Microsoft Learn — CALCULATE Function (DAX)",
        "url": "https://learn.microsoft.com/en-us/dax/calculate-function-dax",
        "publisher": "Microsoft Learn",
        "accessed": "2026-10-29",
        "supports": "Orden de evaluación de CALCULATE, modificación de filtros y transición automática de contexto."
      }
    ]
  },
  {
    "id": "bi2-dax-modificadores-filtro",
    "term": "Modificadores de filtro (REMOVEFILTERS, ALL y KEEPFILTERS)",
    "englishTerm": "Filter Modifiers (REMOVEFILTERS / ALL / KEEPFILTERS)",
    "track": "bi",
    "definition": "Funciones que controlan cómo CALCULATE altera el contexto de filtro existente. REMOVEFILTERS y ALL limpian los filtros de una tabla o columna para calcular denominadores globales; se confunden con KEEPFILTERS, que intersecta el nuevo predicado con el filtro externo en lugar de sobrescribirlo.",
    "formula": "Participacion Region % = DIVIDE( [Ventas Completadas USD], CALCULATE( [Ventas Completadas USD], REMOVEFILTERS( stores[region] ) ) )",
    "relatedLessons": [
      "bi2-dax-02-calculate-transicion-contexto",
      "bi2-dax-04-funciones-iteradoras"
    ],
    "relatedTerms": [
      "bi2-dax-calculate-transicion",
      "bi2-dax-funciones-iteradoras"
    ],
    "sources": [
      {
        "title": "Microsoft Learn — REMOVEFILTERS and KEEPFILTERS Functions (DAX)",
        "url": "https://learn.microsoft.com/en-us/dax/removefilters-function-dax",
        "publisher": "Microsoft Learn",
        "accessed": "2026-10-29",
        "supports": "Eliminación de filtros con REMOVEFILTERS y preservación de intersección con KEEPFILTERS."
      }
    ]
  },
  {
    "id": "bi2-dax-inteligencia-tiempo",
    "term": "Inteligencia de tiempo y comparativa a días equivalentes",
    "englishTerm": "Time Intelligence (YTD, SAMEPERIODLASTYEAR & DATESINPERIOD)",
    "track": "bi",
    "definition": "Conjunto de patrones DAX que desplazan o acumulan ventanas de fechas sobre una dimensión calendario continua (`TOTALYTD`, `SAMEPERIODLASTYEAR`, `DATESINPERIOD`). Se confunde comparar un año en curso incompleto contra el año previo entero con la comparativa a días equivalentes, que acota ambos periodos hasta la última fecha con ventas.",
    "formula": "Ventas YTD USD = TOTALYTD( [Ventas Completadas USD], 'calendar'[calendar_date] )",
    "relatedLessons": [
      "bi2-dax-03-inteligencia-tiempo"
    ],
    "relatedTerms": [
      "bi2-dax-calculate-transicion",
      "bi2-dax-variables-divide"
    ],
    "sources": [
      {
        "title": "Microsoft Learn — Time Intelligence Functions (DAX)",
        "url": "https://learn.microsoft.com/en-us/dax/time-intelligence-functions-dax",
        "publisher": "Microsoft Learn",
        "accessed": "2026-10-29",
        "supports": "Requisitos de tabla de fechas contigua y desplazamiento de intervalos con funciones de tiempo."
      }
    ]
  },
  {
    "id": "bi2-dax-funciones-iteradoras",
    "term": "Funciones iteradoras en DAX (SUMX, AVERAGEX y RANKX)",
    "englishTerm": "Iterator Functions (SUMX / AVERAGEX / RANKX)",
    "track": "bi",
    "definition": "Funciones que recorren una tabla física o virtual fila por fila, evalúan una expresión en ese contexto de fila y luego agregan o clasifican los resultados. `AVERAGEX(VALUES('calendar'[month]), [Ventas USD])` promedia los totales mensuales; se confunde con `AVERAGE(orders[total_usd])`, que promedia pedidos individuales.",
    "formula": "Promedio Mensual USD = AVERAGEX( VALUES( 'calendar'[month] ), [Ventas Completadas USD] )",
    "relatedLessons": [
      "bi2-dax-04-funciones-iteradoras",
      "bi2-dax-06-antipatrones-rendimiento-dax"
    ],
    "relatedTerms": [
      "bi2-dax-contexto-evaluacion",
      "bi2-dax-modificadores-filtro"
    ],
    "sources": [
      {
        "title": "Microsoft Learn — SUMX, AVERAGEX and RANKX Functions (DAX)",
        "url": "https://learn.microsoft.com/en-us/dax/averagex-function-dax",
        "publisher": "Microsoft Learn",
        "accessed": "2026-10-29",
        "supports": "Evaluación fila a fila sobre tablas y granularidades virtuales con iteradores DAX."
      }
    ]
  },
  {
    "id": "bi2-dax-variables-divide",
    "term": "Variables inmutables (VAR / RETURN) y función DIVIDE",
    "englishTerm": "DAX Variables (VAR / RETURN) & Safe Division (DIVIDE)",
    "track": "bi",
    "definition": "VAR almacena el resultado de una expresión evaluada una sola vez en el contexto donde se declara, evitando recalcular subárboles repetidos. Se confunde con una macro que reevalúa el filtro después. DIVIDE resuelve cocientes devolviendo BLANK o un valor alternativo cuando el denominador es cero.",
    "formula": "Margen Neto % = VAR _Neto = [Ingreso Neto USD] VAR _Costo = [Costo Directo USD] RETURN DIVIDE( _Neto - _Costo, _Neto )",
    "relatedLessons": [
      "bi2-dax-05-variables-divide-formato",
      "bi2-dax-06-antipatrones-rendimiento-dax"
    ],
    "relatedTerms": [
      "bi2-dax-calculate-transicion",
      "bi2-dax-inteligencia-tiempo"
    ],
    "sources": [
      {
        "title": "Microsoft Learn — Use variables to improve your DAX formulas",
        "url": "https://learn.microsoft.com/en-us/dax/best-practices/dax-variables",
        "publisher": "Microsoft Learn",
        "accessed": "2026-10-29",
        "supports": "Evaluación única de variables VAR en su contexto de definición y mejora de legibilidad."
      }
    ]
  },
  {
    "id": "metrica-canonica",
    "term": "Métrica canónica",
    "englishTerm": "Canonical Metric",
    "track": "bi",
    "definition": "Definición única, gobernada y auditable de un indicador de negocio dentro de la organización. Especifica sin ambigüedad su fórmula matemática, su grano atómico, sus filtros canónicos de inclusión y exclusión, su ventana temporal de atribución y el responsable de aprobar cambios en su contrato semántico.",
    "formula": "Contrato = (Fórmula, Grano, Filtros Canónicos, Ventana Temporal, Responsable)",
    "relatedLessons": [
      "bi2-metricas-01-anatomia-metrica",
      "bi2-metricas-02-arboles-kpis-palancas"
    ],
    "relatedTerms": [
      "filtro-canonico",
      "c01-grain-fanout",
      "ingreso-neto"
    ],
    "sources": [
      {
        "title": "dbt Labs — Creating Metrics Overview",
        "url": "https://docs.getdbt.com/docs/build/metrics-overview",
        "publisher": "dbt Labs",
        "accessed": "2026-10-29",
        "supports": "Definición declarativa de métricas gobernadas en la capa semántica para evitar cálculos divergentes entre tableros."
      },
      {
        "title": "Cube.dev — Measures Reference",
        "url": "https://cube.dev/docs/product/data-modeling/reference/measures",
        "publisher": "Cube Dev, Inc.",
        "accessed": "2026-10-29",
        "supports": "Especificación de medidas agregadas con tipo de agregación, filtros asociados y propiedad semántica."
      }
    ]
  },
  {
    "id": "filtro-canonico",
    "term": "Filtro canónico",
    "englishTerm": "Canonical Filter",
    "track": "bi",
    "definition": "Condición lógica obligatoria incorporada en la definición semántica de una métrica para acotar qué registros del conjunto de datos pertenecen legítimamente al fenómeno medido. Evita que cada analista aplique criterios distintos sobre estados de pedido, cuentas de prueba o transacciones anuladas.",
    "formula": "SUM(medida) FILTER (WHERE condicion_canonica)",
    "relatedLessons": [
      "bi2-metricas-01-anatomia-metrica",
      "bi2-metricas-03-metricas-guardia"
    ],
    "relatedTerms": [
      "metrica-canonica",
      "c02-cte-preagg"
    ],
    "sources": [
      {
        "title": "dbt Labs — Measures and Filters in MetricFlow",
        "url": "https://docs.getdbt.com/docs/build/measures",
        "publisher": "dbt Labs",
        "accessed": "2026-10-29",
        "supports": "Inclusión de predicados WHERE obligatorios en la definición de una medida o métrica semántica."
      },
      {
        "title": "DuckDB — FILTER Clause Documentation",
        "url": "https://duckdb.org/docs/sql/query_syntax/filter.html",
        "publisher": "DuckDB Foundation",
        "accessed": "2026-10-29",
        "supports": "Sintaxis SQL estándar FILTER (WHERE ...) para aislar condiciones por función de agregación."
      }
    ]
  },
  {
    "id": "arbol-de-kpis",
    "term": "Árbol de KPIs",
    "englishTerm": "KPI Tree / Driver Tree",
    "track": "bi",
    "definition": "Estructura jerárquica y matemática que descompone una métrica de resultado de alto nivel en sus componentes causales mediante relaciones aditivas (suma de segmentos o regiones) o multiplicativas (clientes activos por frecuencia por ticket promedio), permitiendo aislar qué palanca explica una variación.",
    "formula": "Ingreso Neto = Clientes Activos × (Pedidos / Cliente) × (Unidades / Pedido) × (Ingreso Neto / Unidad)",
    "relatedLessons": [
      "bi2-metricas-02-arboles-kpis-palancas",
      "bi2-metricas-04-north-star-goodhart"
    ],
    "relatedTerms": [
      "palanca-operativa",
      "metrica-rezagada-vs-adelantada",
      "ingreso-neto"
    ],
    "sources": [
      {
        "title": "dbt Labs — dbt Semantic Layer",
        "url": "https://docs.getdbt.com/docs/use-dbt-semantic-layer/dbt-sl",
        "publisher": "dbt Labs",
        "accessed": "2026-10-29",
        "supports": "Composición jerárquica de métricas derivadas y de razón sobre medidas atómicas consistentes."
      },
      {
        "title": "Cube.dev — Data Modeling Concepts",
        "url": "https://cube.dev/docs/product/data-modeling/concepts",
        "publisher": "Cube Dev, Inc.",
        "accessed": "2026-10-29",
        "supports": "Descomposición de medidas de negocio por dimensiones conformadas y factores operativos."
      }
    ]
  },
  {
    "id": "palanca-operativa",
    "term": "Palanca operativa",
    "englishTerm": "Operational Lever / Input Driver",
    "track": "bi",
    "definition": "Nodo hoja o intermedio de un árbol de KPIs sobre el cual un equipo de producto, operaciones o marketing puede intervenir directamente mediante una iniciativa concreta, como aumentar las unidades por carrito o reducir los días de entrega, para mover un resultado financiero.",
    "formula": "Δ Resultado ≈ Sensibilidad × Δ Palanca Operativa",
    "relatedLessons": [
      "bi2-metricas-02-arboles-kpis-palancas",
      "bi2-metricas-04-north-star-goodhart"
    ],
    "relatedTerms": [
      "arbol-de-kpis",
      "metrica-rezagada-vs-adelantada"
    ],
    "sources": [
      {
        "title": "Amplitude — Funnel Analysis Interpretation",
        "url": "https://amplitude.com/docs/analytics/charts/funnel-analysis/funnel-analysis-interpret",
        "publisher": "Amplitude",
        "accessed": "2026-10-29",
        "supports": "Identificación de factores de conversión y frecuencia accionables por equipos de producto."
      },
      {
        "title": "Kimball Group — Conformed Dimensions",
        "url": "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/conformed-dimension/",
        "publisher": "Kimball Group",
        "accessed": "2026-10-29",
        "supports": "Desglose consistente de indicadores operativos a través de dimensiones compartidas."
      }
    ]
  },
  {
    "id": "metrica-rezagada-vs-adelantada",
    "term": "Métrica rezagada vs. adelantada",
    "englishTerm": "Lagging vs. Leading Metric",
    "track": "bi",
    "definition": "Contraste temporal y causal entre un indicador rezagado, que confirma el resultado acumulado al cierre de un ciclo (como el margen trimestral o la retención anual), y un indicador adelantado, que mide conductas tempranas capaces de predecir y modificar ese resultado a tiempo.",
    "formula": "Palanca Adelantada (t) → Métrica de Resultado Rezagada (t + Δt)",
    "relatedLessons": [
      "bi2-metricas-02-arboles-kpis-palancas",
      "bi2-metricas-04-north-star-goodhart"
    ],
    "relatedTerms": [
      "arbol-de-kpis",
      "palanca-operativa"
    ],
    "sources": [
      {
        "title": "Kohavi, Tang & Xu — Trustworthy Online Controlled Experiments",
        "url": "https://experimentguide.com/",
        "publisher": "Cambridge University Press",
        "accessed": "2026-10-29",
        "supports": "Distinción entre métricas de resultado a largo plazo e indicadores tempranos sensibles en evaluación de iniciativas."
      },
      {
        "title": "Amplitude — Funnel Analysis Interpretation",
        "url": "https://amplitude.com/docs/analytics/charts/funnel-analysis/funnel-analysis-interpret",
        "publisher": "Amplitude",
        "accessed": "2026-10-29",
        "supports": "Relación entre comportamientos tempranos del usuario y resultados de conversión y retención."
      }
    ]
  },
  {
    "id": "umbral-de-guardia",
    "term": "Umbral de guardia",
    "englishTerm": "Guardrail Threshold",
    "track": "bi",
    "definition": "Límite numérico explícito asignado a una métrica guardia que actúa como condición de veto operativo o experimental. Si una campaña o experimento cruza este umbral en devoluciones, margen neto o desbalance muestral (SRM), el despliegue se detiene aunque la métrica primaria mejore.",
    "formula": "Decisión = Lanzar SI (Métrica Primaria > Meta) Y (Métrica Guardia ≤ Umbral Máximo)",
    "relatedLessons": [
      "bi2-metricas-03-metricas-guardia",
      "bi2-metricas-04-north-star-goodhart"
    ],
    "relatedTerms": [
      "filtro-canonico",
      "ley-de-goodhart"
    ],
    "sources": [
      {
        "title": "Kohavi, Tang & Xu — Trustworthy Online Controlled Experiments",
        "url": "https://experimentguide.com/",
        "publisher": "Cambridge University Press",
        "accessed": "2026-10-29",
        "supports": "Uso de métricas guardia organizacionales y de confiabilidad muestral (SRM) con umbrales de bloqueo."
      },
      {
        "title": "dbt Labs — Measures Documentation",
        "url": "https://docs.getdbt.com/docs/build/measures",
        "publisher": "dbt Labs",
        "accessed": "2026-10-29",
        "supports": "Definición consistente de medidas de control y calidad junto con indicadores de volumen."
      }
    ]
  },
  {
    "id": "metrica-estrella-polar",
    "term": "Métrica Estrella Polar",
    "englishTerm": "North Star Metric (NSM)",
    "track": "bi",
    "definition": "Indicador compuesto que captura el punto de encuentro entre el valor real recibido por el cliente y la sostenibilidad económica de la empresa. Alinea a producto, operaciones y crecimiento alrededor de unidades de valor completadas y sin defectos, en lugar de ingresos brutos aislados.",
    "formula": "NSM = Pedidos Completados con Valor Entregado (status = 'completed' Y devuelto_usd = 0)",
    "relatedLessons": [
      "bi2-metricas-04-north-star-goodhart",
      "bi2-metricas-02-arboles-kpis-palancas"
    ],
    "relatedTerms": [
      "ley-de-goodhart",
      "umbral-de-guardia",
      "arbol-de-kpis"
    ],
    "sources": [
      {
        "title": "Amplitude — Product Analytics & Funnel Interpretation",
        "url": "https://amplitude.com/docs/analytics/charts/funnel-analysis/funnel-analysis-interpret",
        "publisher": "Amplitude",
        "accessed": "2026-10-29",
        "supports": "Diseño de métricas centradas en valor entregado al usuario y su desglose en métricas de entrada."
      },
      {
        "title": "dbt Labs — Semantic Models Governance",
        "url": "https://docs.getdbt.com/docs/build/semantic-models",
        "publisher": "dbt Labs",
        "accessed": "2026-10-29",
        "supports": "Gobernanza de indicadores compuestos dentro del modelo semántico empresarial."
      }
    ]
  },
  {
    "id": "ley-de-goodhart",
    "term": "Ley de Goodhart",
    "englishTerm": "Goodhart's Law",
    "track": "bi",
    "definition": "Principio formulado por el economista Charles Goodhart según el cual toda regularidad estadística o métrica tiende a colapsar cuando se utiliza como meta de control o incentivo único, pues los equipos optimizan el indicador superficial a costa del objetivo real del negocio.",
    "formula": "Si Meta = Maximizar(Indicador Aislado) sin Guardias ⇒ Correlación(Indicador, Valor Real) → 0",
    "relatedLessons": [
      "bi2-metricas-04-north-star-goodhart",
      "bi2-metricas-03-metricas-guardia"
    ],
    "relatedTerms": [
      "metrica-estrella-polar",
      "umbral-de-guardia"
    ],
    "sources": [
      {
        "title": "Goodhart's Law — Historical Formulation and Strathern's Restatement",
        "url": "https://en.wikipedia.org/wiki/Goodhart%27s_law",
        "publisher": "Wikipedia / Monetary History Reference",
        "accessed": "2026-10-29",
        "supports": "Formulación original de Charles Goodhart (1975) y síntesis de Marilyn Strathern (1997) sobre distorsión de metas."
      },
      {
        "title": "Kohavi, Tang & Xu — Trustworthy Online Controlled Experiments",
        "url": "https://experimentguide.com/",
        "publisher": "Cambridge University Press",
        "accessed": "2026-10-29",
        "supports": "Prevención de incentivos perversos combinando métricas objetivo con métricas guardia."
      }
    ]
  },
  {
    "id": "motor-vertipaq",
    "term": "Motor VertiPaq (almacenamiento columnar en memoria)",
    "englishTerm": "VertiPaq In-Memory Columnar Engine",
    "track": "bi",
    "definition": "Motor analítico en memoria de Power BI y Analysis Services Tabular que almacena cada columna por separado usando codificación por diccionario, compresión por longitud de racha (RLE) y empaquetado de bits. Ejemplo: `orders.store_id` comprime 18 000 filas en 14 entradas. No se confunde con DirectQuery, que traduce consultas al motor SQL externo.",
    "formula": "SELECT COUNT(*) AS filas, COUNT(DISTINCT store_id) AS entradas_diccionario FROM orders;",
    "relatedLessons": [
      "bi2-modelo-semantico-01-estrella-vertipaq",
      "bi2-modelo-semantico-05-medidas-vs-columnas-calculadas"
    ],
    "relatedTerms": [
      "esquema-estrella-semantico",
      "medida-vs-columna-calculada",
      "c12-parquet-columnar"
    ],
    "sources": [
      {
        "title": "Microsoft Learn — Data reduction techniques for Import modeling",
        "url": "https://learn.microsoft.com/en-us/power-bi/guidance/import-modeling-data-reduction",
        "publisher": "Microsoft Learn",
        "accessed": "2026-10-29",
        "supports": "Arquitectura en memoria de VertiPaq, diccionarios por columna y técnicas de reducción de cardinalidad."
      }
    ]
  },
  {
    "id": "esquema-estrella-semantico",
    "term": "Esquema en estrella en el modelo semántico",
    "englishTerm": "Star Schema in Semantic Models",
    "track": "bi",
    "definition": "Diseño recomendado en Power BI que separa tablas de dimensión (atributos únicos para filtrar y agrupar) y tablas de hechos (claves foráneas e importes numéricos para resumir). Ejemplo: dimensiones `products` y `stores` filtrando `order_items`. No se confunde con una tabla ancha (OBT) importada sin separar, que duplica importes de cabecera.",
    "formula": "SELECT s.region, SUM(oi.line_total_usd) FROM order_items oi JOIN orders o USING (order_id) JOIN stores s USING (store_id) GROUP BY s.region;",
    "relatedLessons": [
      "bi2-modelo-semantico-01-estrella-vertipaq",
      "bi2-modelo-semantico-02-relaciones-cardinalidad"
    ],
    "relatedTerms": [
      "motor-vertipaq",
      "cardinalidad-relaciones-bi",
      "c06-star-vs-obt"
    ],
    "sources": [
      {
        "title": "Microsoft Learn — Understand star schema and the importance for Power BI",
        "url": "https://learn.microsoft.com/en-us/power-bi/guidance/star-schema",
        "publisher": "Microsoft Learn",
        "accessed": "2026-10-29",
        "supports": "Separación de tablas de dimensión y tablas de hechos para optimizar rendimiento y usabilidad en Power BI."
      }
    ]
  },
  {
    "id": "cardinalidad-relaciones-bi",
    "term": "Cardinalidad de relación (1:N, 1:1 y N:M)",
    "englishTerm": "Model Relationship Cardinality",
    "track": "bi",
    "definition": "Propiedad de una relación semántica que define si la columna de enlace contiene valores únicos (lado `1`, dimensión) o repetidos (lado `N`, hechos). Ejemplo: `customers.customer_id` (`1`) hacia `orders.customer_id` (`N`). No se confunde con la dirección de filtro cruzado, que controla hacia qué tabla se propagan los filtros.",
    "formula": "SELECT COUNT(*) = COUNT(DISTINCT customer_id) AS es_lado_uno FROM customers;",
    "relatedLessons": [
      "bi2-modelo-semantico-02-relaciones-cardinalidad",
      "bi2-modelo-semantico-03-direccion-filtro-cruzado"
    ],
    "relatedTerms": [
      "esquema-estrella-semantico",
      "tabla-puente-bridge",
      "filtro-cruzado-bidireccional"
    ],
    "sources": [
      {
        "title": "Microsoft Learn — Create and manage relationships in Power BI Desktop",
        "url": "https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-create-and-manage-relationships",
        "publisher": "Microsoft Learn",
        "accessed": "2026-10-29",
        "supports": "Opciones de cardinalidad 1:N, N:1, 1:1 y muchos a muchos en modelos tabulares."
      }
    ]
  },
  {
    "id": "tabla-puente-bridge",
    "term": "Tabla puente (Bridge Table)",
    "englishTerm": "Bridge Table for Many-to-Many Relationships",
    "track": "bi",
    "definition": "Tabla intermedia con claves únicas o pares de asociación que resuelve relaciones muchos a muchos entre dos tablas mediante dos relaciones `1:N` controladas. Ejemplo: extraer los `customer_id` únicos antes de cruzar `orders` con versiones históricas en `customer_changes`. No se confunde con una relación `N:M` directa sin dimensión común.",
    "formula": "WITH puente_clientes AS (SELECT DISTINCT customer_id FROM customers) SELECT COUNT(*) FROM puente_clientes;",
    "relatedLessons": [
      "bi2-modelo-semantico-02-relaciones-cardinalidad"
    ],
    "relatedTerms": [
      "cardinalidad-relaciones-bi",
      "filtro-cruzado-bidireccional"
    ],
    "sources": [
      {
        "title": "Microsoft Learn — Many-to-many relationship guidance",
        "url": "https://learn.microsoft.com/en-us/power-bi/guidance/relationships-many-to-many",
        "publisher": "Microsoft Learn",
        "accessed": "2026-10-29",
        "supports": "Patrones con tabla puente frente a relaciones de cardinalidad muchos a muchos en Power BI."
      }
    ]
  },
  {
    "id": "filtro-cruzado-bidireccional",
    "term": "Dirección de filtro cruzado (única vs bidireccional)",
    "englishTerm": "Single vs Bi-directional Cross-Filtering",
    "track": "bi",
    "definition": "Regla que determina cómo se propagan los filtros a través de una relación: en dirección única (`Single`) fluyen solo del lado `1` al lado `N`; en bidireccional (`Both`) regresan de los hechos a la dimensión. Ejemplo: activar `CROSSFILTER` solo dentro de una medida. No se confunde con un `INNER JOIN` permanente.",
    "formula": "CALCULATE(DISTINCTCOUNT(customers[customer_id]), CROSSFILTER(orders[customer_id], customers[customer_id], Both))",
    "relatedLessons": [
      "bi2-modelo-semantico-03-direccion-filtro-cruzado"
    ],
    "relatedTerms": [
      "cardinalidad-relaciones-bi",
      "tabla-puente-bridge"
    ],
    "sources": [
      {
        "title": "Microsoft Learn — Bi-directional relationship guidance",
        "url": "https://learn.microsoft.com/en-us/power-bi/guidance/relationships-bidirectional-filtering",
        "publisher": "Microsoft Learn",
        "accessed": "2026-10-29",
        "supports": "Riesgos de ambigüedad y degradación de rendimiento al habilitar filtros bidireccionales en el modelo."
      }
    ]
  },
  {
    "id": "tabla-fechas-marcada",
    "term": "Tabla de fechas marcada (Mark as date table)",
    "englishTerm": "Marked Date Table & Auto Date/Time",
    "track": "bi",
    "definition": "Dimensión de calendario validada en Power BI cuya columna de tipo `Date` es única, sin valores nulos y sin días faltantes entre el inicio y fin de cada año. Ejemplo: la tabla `calendar` con `calendar_date` y `fiscal_quarter`. No se confunde con `Auto date/time`, que crea tablas ocultas por cada columna de fecha.",
    "formula": "SELECT COUNT(*) = DATEDIFF('day', MIN(calendar_date), MAX(calendar_date)) + 1 AS sin_huecos FROM calendar;",
    "relatedLessons": [
      "bi2-modelo-semantico-04-tablas-fechas-userelationship"
    ],
    "relatedTerms": [
      "relacion-inactiva-userelationship",
      "esquema-estrella-semantico"
    ],
    "sources": [
      {
        "title": "Microsoft Learn — Model date tables in Power BI Desktop",
        "url": "https://learn.microsoft.com/en-us/power-bi/guidance/model-date-tables",
        "publisher": "Microsoft Learn",
        "accessed": "2026-10-29",
        "supports": "Requisitos técnicos de continuidad, unicidad y tipo Date para marcar una tabla de fechas e inteligencia de tiempo."
      }
    ]
  },
  {
    "id": "relacion-inactiva-userelationship",
    "term": "Relación inactiva y dimensión de rol (USERELATIONSHIP)",
    "englishTerm": "Inactive Relationship & USERELATIONSHIP",
    "track": "bi",
    "definition": "Enlace secundario entre dos tablas que permanece dormido por defecto para evitar rutas ambiguas y se activa puntualmente dentro de una medida DAX con `USERELATIONSHIP`. Ejemplo: conectar `calendar[calendar_date]` con `orders[order_date]` (activa) y con `refunds[refund_date]` (inactiva). No se confunde con duplicar físicamente toda la tabla de calendario por cada fecha.",
    "formula": "CALCULATE(SUM(refunds[refund_amount_usd]), USERELATIONSHIP(calendar[calendar_date], refunds[refund_date]))",
    "relatedLessons": [
      "bi2-modelo-semantico-04-tablas-fechas-userelationship"
    ],
    "relatedTerms": [
      "tabla-fechas-marcada",
      "filtro-cruzado-bidireccional"
    ],
    "sources": [
      {
        "title": "Microsoft Learn — Active vs inactive relationship guidance",
        "url": "https://learn.microsoft.com/en-us/power-bi/guidance/relationships-active-inactive",
        "publisher": "Microsoft Learn",
        "accessed": "2026-10-29",
        "supports": "Restricción de una única relación activa entre dos tablas y activación dinámica con USERELATIONSHIP."
      }
    ]
  },
  {
    "id": "medida-vs-columna-calculada",
    "term": "Medida dinámica frente a columna calculada",
    "englishTerm": "DAX Measure vs Calculated Column",
    "track": "bi",
    "definition": "Una columna calculada evalúa su fórmula fila por fila durante el refresco y consume memoria RAM en VertiPaq; una medida se evalúa en tiempo de consulta sobre el contexto filtrado sin ocupar almacenamiento. Ejemplo: calcular el margen porcentual como `DIVIDE(SUM(margen), SUM(ingreso))`. No se confunde con promediar porcentajes precalculados por fila.",
    "formula": "SELECT ROUND(SUM(discount_usd) * 100.0 / SUM(subtotal_usd), 2) AS tasa_descuento_medida_pct FROM orders;",
    "relatedLessons": [
      "bi2-modelo-semantico-05-medidas-vs-columnas-calculadas"
    ],
    "relatedTerms": [
      "motor-vertipaq",
      "esquema-estrella-semantico",
      "c11-additivity-hll"
    ],
    "sources": [
      {
        "title": "SQLBI — Calculated Columns and Measures in DAX",
        "url": "https://www.sqlbi.com/articles/calculated-columns-and-measures-in-dax/",
        "publisher": "SQLBI",
        "accessed": "2026-10-29",
        "supports": "Diferencia de evaluación entre tiempo de refresco (columna calculada en RAM) y tiempo de consulta (medida agregada)."
      }
    ]
  },
  {
    "id": "bi3-razon-dato-tinta",
    "term": "Razón dato-tinta",
    "englishTerm": "Data-ink ratio",
    "track": "bi",
    "definition": "Proporción de la tinta total de un gráfico dedicada a representar valores cuantitativos no redundantes (por ejemplo, la longitud de las barras de ventas por región). Se confunde con dejar el lienzo sin contexto, cuando obliga a borrar adornos preservando ejes y etiquetas.",
    "formula": "Razón dato-tinta = Tinta de datos / Tinta total impresa en el gráfico",
    "relatedLessons": [
      "bi3-dashboards-01-bi-tufte-code"
    ],
    "relatedTerms": [
      "bi3-grafico-de-bala",
      "tinta-proporcional"
    ],
    "sources": [
      {
        "title": "Fundamentals of Data Visualization — Cap. 23: Balance the data and the context",
        "url": "https://clauswilke.com/dataviz/balance-data-context.html",
        "publisher": "Claus O. Wilke (O'Reilly)",
        "accessed": "2026-10-29",
        "supports": "Definición de razón dato-tinta de Edward Tufte y equilibrio entre tinta de datos y ejes de contexto."
      }
    ]
  },
  {
    "id": "bi3-grafico-de-bala",
    "term": "Gráfico de bala",
    "englishTerm": "Bullet graph",
    "track": "bi",
    "definition": "Visualización lineal diseñada por Stephen Few que combina una barra central de valor real, un marcador perpendicular de meta y bandas de fondo cualitativas (por ejemplo, ingreso neto regional frente a cuota anual). Se confunde con una barra apilada, donde los segmentos suman un total.",
    "relatedLessons": [
      "bi3-dashboards-01-bi-tufte-code",
      "bi3-dashboards-02-jerarquia-visual-reticula-10s"
    ],
    "relatedTerms": [
      "bi3-razon-dato-tinta",
      "bi3-sparkline"
    ],
    "sources": [
      {
        "title": "Bullet Graph Design Specification",
        "url": "https://www.perceptualedge.com/articles/misc/Bullet_Graph_Design_Spec.pdf",
        "publisher": "Stephen Few (Perceptual Edge)",
        "accessed": "2026-10-29",
        "supports": "Especificación de los cinco componentes del gráfico de bala como alternativa compacta a los velocímetros."
      }
    ]
  },
  {
    "id": "bi3-sparkline",
    "term": "Minigráfico en línea",
    "englishTerm": "Sparkline",
    "track": "bi",
    "definition": "Gráfico temporal del tamaño de una palabra integrado dentro de una fila de tabla o tarjeta para mostrar la forma de la tendencia reciente (por ejemplo, doce semanas de pedidos por tienda). Se confunde con un gráfico de líneas completo con ejes y leyendas.",
    "relatedLessons": [
      "bi3-dashboards-01-bi-tufte-code"
    ],
    "relatedTerms": [
      "bi3-grafico-de-bala",
      "cifras-tabulares"
    ],
    "sources": [
      {
        "title": "Fundamentals of Data Visualization — Cap. 21: Multi-panel figures",
        "url": "https://clauswilke.com/dataviz/multi-panel-figures.html",
        "publisher": "Claus O. Wilke (O'Reilly)",
        "accessed": "2026-10-29",
        "supports": "Uso de micro-series y paneles múltiples con escalas consistentes para comparar tendencias."
      }
    ]
  },
  {
    "id": "bi3-titulo-accion",
    "term": "Título de acción",
    "englishTerm": "Action title",
    "track": "bi",
    "definition": "Encabezado declarativo que resume el hallazgo cuantificado y su alcance en una oración (por ejemplo, \"Cono Sur lidera el cumplimiento anual con 45,6 % en 2024\"). Se confunde con una etiqueta descriptiva de ejes como \"Ventas por región\", que obliga al lector a deducir la conclusión.",
    "relatedLessons": [
      "bi3-dashboards-01-bi-tufte-code",
      "bi3-dashboards-02-jerarquia-visual-reticula-10s"
    ],
    "relatedTerms": [
      "bi3-jerarquia-visual"
    ],
    "sources": [
      {
        "title": "International Business Communication Standards (IBCS) Version 2.0",
        "url": "https://www.ibcs.com/ibcs-version-2-0/",
        "publisher": "IBCS Association",
        "accessed": "2026-10-29",
        "supports": "Estructura de títulos de mensaje activo con sujeto, métrica, variación y horizonte temporal."
      }
    ]
  },
  {
    "id": "bi3-jerarquia-visual",
    "term": "Jerarquía visual",
    "englishTerm": "Visual hierarchy",
    "track": "bi",
    "definition": "Ordenamiento deliberado de los elementos de un tablero mediante tamaño, peso tipográfico, posición y espacio en blanco para guiar la atención en menos de diez segundos (por ejemplo, KPIs globales arriba y tabla de detalle abajo). Se confunde con resaltar todo el lienzo en negrita.",
    "relatedLessons": [
      "bi3-dashboards-02-jerarquia-visual-reticula-10s"
    ],
    "relatedTerms": [
      "bi3-patron-lectura-f-z",
      "bi3-titulo-accion"
    ],
    "sources": [
      {
        "title": "Visual Hierarchy in UX: Definition",
        "url": "https://www.nngroup.com/articles/visual-hierarchy-ux-definition/",
        "publisher": "Nielsen Norman Group",
        "accessed": "2026-10-29",
        "supports": "Principios de escala, contraste y agrupación espacial para dirigir la inspección ocular."
      }
    ]
  },
  {
    "id": "bi3-patron-lectura-f-z",
    "term": "Patrón de escaneo en F y Z",
    "englishTerm": "F-pattern and Z-pattern scanning",
    "track": "bi",
    "definition": "Trayectorias oculares donde el usuario inicia la lectura en la esquina superior izquierda, barre horizontalmente la fila superior de métricas y desciende por el margen izquierdo o en diagonal. Se confunde con una lectura secuencial exhaustiva de cada celda del tablero.",
    "relatedLessons": [
      "bi3-dashboards-02-jerarquia-visual-reticula-10s"
    ],
    "relatedTerms": [
      "bi3-jerarquia-visual"
    ],
    "sources": [
      {
        "title": "F-Shaped Pattern of Reading on the Web",
        "url": "https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/",
        "publisher": "Nielsen Norman Group",
        "accessed": "2026-10-29",
        "supports": "Evidencia de seguimiento ocular sobre anclaje superior izquierdo y escaneo horizontal-vertical."
      }
    ]
  },
  {
    "id": "bi3-contraste-wcag",
    "term": "Razón de contraste WCAG",
    "englishTerm": "WCAG contrast ratio",
    "track": "bi",
    "definition": "Relación matemática de luminancia relativa entre primer plano y fondo que exige al menos 4,5:1 para texto normal y 3:1 para marcas gráficas en nivel AA (por ejemplo, etiquetas oscuras sobre tarjetas claras). Se confunde con usar colores saturados de igual luminancia como rojo sobre verde.",
    "formula": "Contraste = (L1 + 0,05) / (L2 + 0,05)",
    "relatedLessons": [
      "bi3-dashboards-03-color-contraste-wcag-daltonismo"
    ],
    "relatedTerms": [
      "bi3-doble-codificacion",
      "contraste-no-textual"
    ],
    "sources": [
      {
        "title": "Understanding Success Criterion 1.4.3: Contrast (Minimum) (WCAG 2.2)",
        "url": "https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html",
        "publisher": "W3C Web Accessibility Initiative",
        "accessed": "2026-10-29",
        "supports": "Umbrales normativos de contraste 4,5:1 para texto normal y 3:1 para texto grande."
      }
    ]
  },
  {
    "id": "bi3-doble-codificacion",
    "term": "Doble codificación redundante",
    "englishTerm": "Redundant double encoding",
    "track": "bi",
    "definition": "Práctica de accesibilidad que transmite un estado combinando al menos dos canales independientes como color más icono o prefijo textual (por ejemplo, \"[ALERT] Crítico\" junto a un marcador naranja). Se confunde con duplicar dos gráficos distintos para la misma métrica.",
    "relatedLessons": [
      "bi3-dashboards-03-color-contraste-wcag-daltonismo"
    ],
    "relatedTerms": [
      "bi3-contraste-wcag",
      "paleta-divergente"
    ],
    "sources": [
      {
        "title": "Understanding Success Criterion 1.4.1: Use of Color (WCAG 2.2)",
        "url": "https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html",
        "publisher": "W3C Web Accessibility Initiative",
        "accessed": "2026-10-29",
        "supports": "Obligación de no emplear el color como único medio visual para transmitir estados o categorías."
      }
    ]
  },
  {
    "id": "bi3-perforacion-drill-through",
    "term": "Perforación contextual",
    "englishTerm": "Drill-through",
    "track": "bi",
    "definition": "Navegación que lleva al usuario desde una marca agregada (por ejemplo, una región o tienda) hacia una página dedicada de detalle filtrada automáticamente por esa entidad. Se confunde con un tooltip emergente, que solo muestra un micro-resumen temporal al pasar el cursor.",
    "relatedLessons": [
      "bi3-dashboards-04-interaccion-filtros-drill-tooltips"
    ],
    "relatedTerms": [
      "bi3-estado-vacio-informativo"
    ],
    "sources": [
      {
        "title": "Set up drillthrough in Power BI reports",
        "url": "https://learn.microsoft.com/en-us/power-bi/create-reports/desktop-drillthrough",
        "publisher": "Microsoft Learn",
        "accessed": "2026-10-29",
        "supports": "Configuración de páginas de destino de perforación filtradas por el contexto de la entidad seleccionada."
      }
    ]
  },
  {
    "id": "bi3-estado-vacio-informativo",
    "term": "Estado vacío informativo",
    "englishTerm": "Informative empty state",
    "track": "bi",
    "definition": "Respuesta visual y de datos que informa explícitamente cuando un filtro produce cero eventos (por ejemplo, mostrar 0 devoluciones con LEFT JOIN y COALESCE en Tienda El Poblado). Se confunde con un lienzo en blanco o con un fallo de carga del motor SQL.",
    "relatedLessons": [
      "bi3-dashboards-04-interaccion-filtros-drill-tooltips"
    ],
    "relatedTerms": [
      "bi3-perforacion-drill-through",
      "coalesce-nullif"
    ],
    "sources": [
      {
        "title": "Slicers in Power BI",
        "url": "https://learn.microsoft.com/en-us/power-bi/visuals/power-bi-visualization-slicers",
        "publisher": "Microsoft Learn",
        "accessed": "2026-10-29",
        "supports": "Comportamiento de filtros combinados y manejo explícito de selecciones sin registros coincidentes."
      }
    ]
  },
  {
    "id": "bi3-tablero-ejecutivo-vs-operativo",
    "term": "Tablero estratégico frente a operativo",
    "englishTerm": "Executive vs. operational dashboard",
    "track": "bi",
    "definition": "Separación arquitectónica entre vistas ejecutivas de grano mensual o regional orientadas a metas de largo plazo y monitores operativos de grano diario o por pedido orientados a resolver colas de excepción. Se confunde con entregar el mismo tablero con más filtros a toda la empresa.",
    "relatedLessons": [
      "bi3-dashboards-05-tablero-ejecutivo-vs-operativo"
    ],
    "relatedTerms": [
      "bi3-jerarquia-visual",
      "arbol-de-kpis"
    ],
    "sources": [
      {
        "title": "Dashboards for business users of the Power BI service",
        "url": "https://learn.microsoft.com/en-us/power-bi/explore-reports/end-user-dashboards",
        "publisher": "Microsoft Learn",
        "accessed": "2026-10-29",
        "supports": "Diferencias de grano, frecuencia de actualización y propósito entre tableros ejecutivos y operativos."
      }
    ]
  },
  {
    "id": "capa-semantica-declarativa",
    "term": "Capa semántica declarativa (MetricFlow y Cube)",
    "englishTerm": "Declarative Semantic Layer (MetricFlow & Cube)",
    "track": "bi",
    "definition": "Capa intermedia que define en código YAML entidades, dimensiones, medidas y métricas de negocio sobre las tablas del almacén para generar consultas SQL consistentes hacia cualquier herramienta de consumo. Ejemplo: declarar `net_revenue_usd` una sola vez en MetricFlow o Cube. No se confunde con vistas SQL aisladas por cada informe.",
    "formula": "metrics: [{ name: net_revenue_usd, type: derived, expr: gross_revenue_usd - refunded_usd }]",
    "relatedLessons": [
      "bi3-gobierno-01-capa-semantica-metricflow-cube",
      "bi3-gobierno-05-equivalencia-lookml-tableau-pbi"
    ],
    "relatedTerms": [
      "agregacion-simetrica",
      "pre-agregacion-cube",
      "c21-semantic-layer"
    ],
    "sources": [
      {
        "title": "dbt Documentation — About MetricFlow",
        "url": "https://docs.getdbt.com/docs/build/about-metricflow",
        "publisher": "dbt Labs",
        "accessed": "2026-10-29",
        "supports": "Arquitectura de grafo semántico declarativo que traduce peticiones de métricas y dimensiones en planes SQL optimizados."
      }
    ]
  },
  {
    "id": "agregacion-simetrica",
    "term": "Agregación simétrica y prevención de fan-out",
    "englishTerm": "Symmetric Aggregates & Fan-Out Prevention",
    "track": "bi",
    "definition": "Técnica empleada por motores semánticos (Looker, MetricFlow, Cube) para calcular sumas y promedios exactos cuando un `JOIN` uno a muchos multiplica las filas de la tabla padre. Ejemplo: sumar `orders.total_usd` sin triplicarlo al unir con `order_items`. No se confunde con `SUM(DISTINCT importe)`, que descarta pedidos distintos con igual monto.",
    "formula": "WITH orders_agg AS (SELECT store_id, SUM(total_usd) AS rev FROM orders GROUP BY store_id) SELECT * FROM orders_agg;",
    "relatedLessons": [
      "bi3-gobierno-01-capa-semantica-metricflow-cube",
      "bi3-gobierno-05-equivalencia-lookml-tableau-pbi"
    ],
    "relatedTerms": [
      "capa-semantica-declarativa",
      "expresion-lod-tableau"
    ],
    "sources": [
      {
        "title": "Google Cloud Looker — symmetric_aggregates parameter",
        "url": "https://docs.cloud.google.com/looker/docs/reference/param-explore-symmetric-aggregates",
        "publisher": "Google Cloud",
        "accessed": "2026-10-29",
        "supports": "Protección matemática basada en claves primarias para evitar que joins uno a muchos inflen sumas, conteos y promedios."
      }
    ]
  },
  {
    "id": "pre-agregacion-cube",
    "term": "Pre-agregación declarativa (Cube Rollups)",
    "englishTerm": "Declarative Pre-Aggregation (Cube Rollups)",
    "track": "bi",
    "definition": "Tabla resumida materializada y gestionada automáticamente por la capa semántica que almacena medidas agrupadas por un subconjunto de dimensiones y granularidad temporal para responder consultas en milisegundos. Ejemplo: un rollup mensual por `store_id` reduce 42 000 líneas de `order_items` a 486 filas. No se confunde con el caché efímero de resultados idénticos.",
    "formula": "SELECT store_id, DATE_TRUNC('month', order_date) AS mes, SUM(line_total_usd) FROM orders JOIN order_items USING (order_id) GROUP BY 1, 2;",
    "relatedLessons": [
      "bi3-gobierno-01-capa-semantica-metricflow-cube",
      "bi3-gobierno-04-import-directquery-direct-lake"
    ],
    "relatedTerms": [
      "capa-semantica-declarativa",
      "modelo-compuesto-dual"
    ],
    "sources": [
      {
        "title": "Cube Documentation — Using Pre-Aggregations",
        "url": "https://docs.cube.dev/docs/pre-aggregations/using-pre-aggregations",
        "publisher": "Cube Dev",
        "accessed": "2026-10-29",
        "supports": "Definición declarativa de rollups materializados por medidas, dimensiones y granularidad de tiempo con refresco incremental."
      }
    ]
  },
  {
    "id": "seguridad-nivel-fila-rls",
    "term": "Seguridad a nivel de fila (RLS) estática y dinámica",
    "englishTerm": "Static and Dynamic Row-Level Security (RLS)",
    "track": "bi",
    "definition": "Mecanismo del modelo semántico que filtra las filas visibles según el rol o la identidad del usuario autenticado. En modo estático usa predicados fijos por rol (`region = 'Andina'`); en modo dinámico cruza `USERPRINCIPALNAME()` con una tabla de permisos. No se confunde con ocultar páginas visuales, que no bloquea consultas directas al modelo.",
    "formula": "stores[region] IN SELECTCOLUMNS(FILTER(rls_policy, rls_policy[user_email] = USERPRINCIPALNAME()), \"reg\", rls_policy[allowed_region])",
    "relatedLessons": [
      "bi3-gobierno-02-rls-estatica-dinamica-columnas",
      "bi3-gobierno-05-equivalencia-lookml-tableau-pbi",
      "de4-plataforma-03-seguridad-pii-enmascaramiento"
    ],
    "relatedTerms": [
      "seguridad-nivel-objeto-ols",
      "filtro-cruzado-bidireccional",
      "clasificacion-pii-nist",
      "enmascaramiento-dinamico-ddm"
    ],
    "sources": [
      {
        "title": "Microsoft Learn — Row-level security (RLS) with Power BI",
        "url": "https://learn.microsoft.com/en-us/fabric/security/service-admin-row-level-security",
        "publisher": "Microsoft Learn",
        "accessed": "2026-10-29",
        "supports": "Configuración de reglas estáticas y dinámicas con USERPRINCIPALNAME() para restringir filas por usuario en modelos semánticos."
      },
      {
        "title": "PostgreSQL Documentation — Row Security Policies",
        "url": "https://www.postgresql.org/docs/current/ddl-rowsecurity.html",
        "publisher": "The PostgreSQL Global Development Group",
        "accessed": "2026-10-29",
        "supports": "Políticas declarativas de filtrado por fila mediante expresiones USING y WITH CHECK."
      }
    ]
  },
  {
    "id": "seguridad-nivel-objeto-ols",
    "term": "Seguridad a nivel de objeto (OLS) y enmascaramiento de columnas",
    "englishTerm": "Object-Level Security (OLS) & Column Masking",
    "track": "bi",
    "definition": "Control de seguridad que restringe el acceso a tablas o columnas sensibles. La OLS elimina la columna y sus metadatos para roles no autorizados (como `products.unit_cost_usd`), mientras que el enmascaramiento dinámico ofusca parcialmente valores PII (`customers.email`). No se confunde con la propiedad visual `IsHidden`, que permite seguir consultando la columna por DAX.",
    "formula": "SELECT customer_id, CONCAT(LEFT(full_name, 1), '***') AS masked_name, CONCAT('***@', SPLIT_PART(email, '@', 2)) AS email_domain FROM customers;",
    "relatedLessons": [
      "bi3-gobierno-02-rls-estatica-dinamica-columnas"
    ],
    "relatedTerms": [
      "seguridad-nivel-fila-rls"
    ],
    "sources": [
      {
        "title": "Microsoft Learn — Object-level security (OLS)",
        "url": "https://learn.microsoft.com/en-us/fabric/security/service-admin-object-level-security",
        "publisher": "Microsoft Learn",
        "accessed": "2026-10-29",
        "supports": "Ocultación estricta de datos y metadatos de columnas o tablas confidenciales mediante permisos de rol en modelos tabulares."
      }
    ]
  },
  {
    "id": "certificacion-metricas-endorsement",
    "term": "Certificación de métricas y respaldo (Promoted vs Certified)",
    "englishTerm": "Metric Certification & Endorsement (Promoted vs Certified)",
    "track": "bi",
    "definition": "Proceso formal mediante el cual una organización distingue entre activos analíticos promocionados (`Promoted`, compartidos por el propio creador) y certificados (`Certified`, auditados en su fórmula, pruebas, linaje y propietario funcional por un comité autorizado). Ejemplo: certificar `net_revenue_usd` descontando devoluciones procesadas. No se confunde con publicar un informe sin revisión de contrato.",
    "formula": "SUM(CASE WHEN o.status = 'completed' THEN o.total_usd - COALESCE(r.refund_usd, 0) ELSE 0 END)",
    "relatedLessons": [
      "bi3-gobierno-03-certificacion-metricas-obsolescencia"
    ],
    "relatedTerms": [
      "deprecacion-versionado-metricas",
      "capa-semantica-declarativa"
    ],
    "sources": [
      {
        "title": "Microsoft Learn — Endorsement: Promoting and certifying Fabric and Power BI content",
        "url": "https://learn.microsoft.com/en-us/fabric/governance/endorsement-overview",
        "publisher": "Microsoft Learn",
        "accessed": "2026-10-29",
        "supports": "Niveles de respaldo institucional Promoted y Certified y gobernanza de revisores autorizados en el catálogo analítico."
      }
    ]
  },
  {
    "id": "deprecacion-versionado-metricas",
    "term": "Control de obsolescencia y versionado semántico de métricas",
    "englishTerm": "Metric Deprecation & Semantic Versioning",
    "track": "bi",
    "definition": "Práctica de gobierno que gestiona cambios incompatibles en la lógica de una métrica publicando una nueva versión (`v2`), declarando una fecha de retiro (`deprecation_date`) en la versión anterior (`v1`) y notificando a los propietarios de paneles aguas abajo (`exposures`). Ejemplo: migrar de ingresos brutos a ingresos netos sin romper paneles existentes.",
    "formula": "ROUND(100.0 * (legacy_v1_revenue_usd - certified_v2_net_usd) / certified_v2_net_usd, 2) AS drift_pct",
    "relatedLessons": [
      "bi3-gobierno-03-certificacion-metricas-obsolescencia"
    ],
    "relatedTerms": [
      "certificacion-metricas-endorsement",
      "c19-data-contracts-odcs"
    ],
    "sources": [
      {
        "title": "dbt Documentation — Model versions and deprecation",
        "url": "https://docs.getdbt.com/docs/mesh/govern/model-versions",
        "publisher": "dbt Labs",
        "accessed": "2026-10-29",
        "supports": "Gestión de versiones coexistentes, ventanas de migración y propiedad deprecation_date para evolucionar definiciones analíticas sin rupturas."
      }
    ]
  },
  {
    "id": "modelo-compuesto-dual",
    "term": "Modelo compuesto y almacenamiento Dual",
    "englishTerm": "Composite Model & Dual Storage Mode",
    "track": "bi",
    "definition": "Arquitectura de modelo semántico que combina tablas almacenadas en memoria (`Import`) con tablas consultadas en vivo (`DirectQuery`). Las dimensiones compartidas (`stores`, `calendar`) se configuran en modo `Dual` para actuar en memoria cuando se cruzan con agregaciones Import y en SQL nativo cuando filtran hechos DirectQuery, evitando transferencias intermedias lentas.",
    "formula": "StorageMode(stores) = Dual; StorageMode(agg_monthly_sales) = Import; StorageMode(order_items) = DirectQuery",
    "relatedLessons": [
      "bi3-gobierno-04-import-directquery-direct-lake"
    ],
    "relatedTerms": [
      "direct-lake-parquet",
      "motor-vertipaq",
      "pre-agregacion-cube"
    ],
    "sources": [
      {
        "title": "Microsoft Learn — Use composite models in Power BI Desktop",
        "url": "https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-composite-models",
        "publisher": "Microsoft Learn",
        "accessed": "2026-10-29",
        "supports": "Arquitectura de modelos compuestos, tablas de agregación en memoria y dimensiones en modo Dual para optimizar consultas híbridas."
      }
    ]
  },
  {
    "id": "direct-lake-parquet",
    "term": "Modo Direct Lake sobre archivos Parquet y Delta",
    "englishTerm": "Direct Lake Mode over Parquet & Delta",
    "track": "bi",
    "definition": "Modo de almacenamiento semántico que carga bajo demanda únicamente las columnas necesarias desde archivos Parquet/Delta del lago de datos hacia la memoria de VertiPaq sin ejecutar un refresco completo de importación ni traducir las consultas a SQL. Si una consulta viola restricciones del motor o usa vistas SQL, aplica repliegue (`fallback`) a DirectQuery.",
    "formula": "Delta/Parquet ColumnChunk -> Transcodificación en memoria VertiPaq (con fallback condicional a DirectQuery)",
    "relatedLessons": [
      "bi3-gobierno-04-import-directquery-direct-lake"
    ],
    "relatedTerms": [
      "modelo-compuesto-dual",
      "motor-vertipaq",
      "c12-parquet-columnar"
    ],
    "sources": [
      {
        "title": "Microsoft Learn — Direct Lake overview",
        "url": "https://learn.microsoft.com/en-us/fabric/fundamentals/direct-lake-overview",
        "publisher": "Microsoft Learn",
        "accessed": "2026-10-29",
        "supports": "Carga directa de columnas desde archivos Delta Parquet en memoria VertiPaq y comportamiento de fallback hacia DirectQuery."
      }
    ]
  },
  {
    "id": "expresion-lod-tableau",
    "term": "Expresión de nivel de detalle (LOD: FIXED, INCLUDE, EXCLUDE)",
    "englishTerm": "Level of Detail (LOD) Expression",
    "track": "bi",
    "definition": "Sintaxis de Tableau que permite calcular una agregación a una granularidad distinta de las dimensiones presentes en la visualización: `FIXED` evalúa el cálculo únicamente por las dimensiones listadas, `INCLUDE` añade dimensiones al grano visual y `EXCLUDE` las retira. Equivale en DAX a combinar `CALCULATE` con `ALLEXCEPT`, `SUMX` o `REMOVEFILTERS`.",
    "formula": "{ FIXED [region] : SUM([total_usd]) }  <=>  CALCULATE(SUM(orders[total_usd]), ALLEXCEPT(stores, stores[region]))",
    "relatedLessons": [
      "bi3-gobierno-05-equivalencia-lookml-tableau-pbi"
    ],
    "relatedTerms": [
      "agregacion-simetrica",
      "capa-semantica-declarativa"
    ],
    "sources": [
      {
        "title": "Tableau Help — Overview: Level of Detail (LOD) Expressions",
        "url": "https://help.tableau.com/current/pro/desktop/en-us/calculations_calculatedfields_lod.htm",
        "publisher": "Salesforce / Tableau",
        "accessed": "2026-10-29",
        "supports": "Definición y semántica de evaluación de expresiones FIXED, INCLUDE y EXCLUDE frente al grano de la visualización."
      }
    ]
  },
  {
    "id": "bi-data-loader",
    "term": "Cargador de datos en compilación",
    "englishTerm": "Build-Time Data Loader",
    "track": "bi",
    "definition": "Script o consulta declarativa ejecutada durante el empaquetado de un sitio de BI como código para extraer, preagregar y materializar instantáneas en formato Parquet o Arrow. Permite que el navegador consulte datos locales con DuckDB-Wasm en milisegundos sin saturar el almacén de datos con peticiones repetitivas por cada lector.",
    "formula": "Loader (Build-Time SQL) -> Instantánea Parquet (CDN) -> Consulta reactiva en DuckDB-Wasm",
    "relatedLessons": [
      "bi4-operacion-01-bi-como-codigo-evidence-observable-rill",
      "bi3-dashboards-01-bi-tufte-code"
    ],
    "relatedTerms": [
      "c16-duckdb-wasm-bi",
      "c26-bi-as-code",
      "c12-parquet-columnar"
    ],
    "sources": [
      {
        "title": "Observable Framework — Static site generator for data apps",
        "url": "https://github.com/observablehq/framework",
        "publisher": "Observable",
        "supports": "Arquitectura de data loaders en tiempo de compilación y generación de instantáneas estáticas tipadas.",
        "type": "docs",
        "accessed": "2026-10-29"
      },
      {
        "title": "Evidence Documentation — SQL Queries in Markdown",
        "url": "https://docs.evidence.dev/core-concepts/queries/",
        "publisher": "Evidence",
        "supports": "Extracción SQL declarativa y ejecución en el cliente sobre DuckDB-Wasm.",
        "type": "docs",
        "accessed": "2026-10-29"
      }
    ]
  },
  {
    "id": "pbip-project",
    "term": "Proyecto Power BI (PBIP)",
    "englishTerm": "Power BI Desktop Project (PBIP)",
    "track": "bi",
    "definition": "Formato de desarrollo en texto plano que reemplaza el archivo binario opaco .pbix por un árbol de directorios separado en modelo semántico (.SemanticModel) y definición visual (.Report). Permite versionar artefactos en Git, comparar cambios línea por línea en Pull Requests y automatizar despliegues sin herramientas manuales.",
    "formula": "Artefacto.pbip -> Artefacto.SemanticModel/definition/ + Artefacto.Report/definition/",
    "relatedLessons": [
      "bi4-operacion-02-pbip-tmdl-versionado-git",
      "bi4-operacion-03-cicd-pruebas-promocion-entornos"
    ],
    "relatedTerms": [
      "tmdl-language",
      "pbir-format",
      "c26-bi-as-code"
    ],
    "sources": [
      {
        "title": "Power BI Desktop projects (PBIP)",
        "url": "https://learn.microsoft.com/en-us/power-bi/developer/projects/projects-overview",
        "publisher": "Microsoft Learn",
        "supports": "Separación de artefactos Power BI en carpetas .SemanticModel y .Report en texto plano.",
        "type": "docs",
        "accessed": "2026-10-29"
      },
      {
        "title": "Power BI Desktop projects Git integration",
        "url": "https://learn.microsoft.com/en-us/power-bi/developer/projects/projects-git",
        "publisher": "Microsoft Learn",
        "supports": "Control de versiones en Git, trabajo en ramas y exclusiones de caché en proyectos PBIP.",
        "type": "docs",
        "accessed": "2026-10-29"
      }
    ]
  },
  {
    "id": "tmdl-language",
    "term": "Lenguaje de definición de modelos tabulares (TMDL)",
    "englishTerm": "Tabular Model Definition Language (TMDL)",
    "track": "bi",
    "definition": "Sintaxis declarativa legible por humanos y basada en sangría que describe el modelo de objetos tabulares (TOM) en proyectos Power BI y Analysis Services. Sustituye el archivo JSON monolítico model.bim por archivos modulares para cada tabla, relación, rol y expresión, reduciendo conflictos de fusión en equipos colaborativos.",
    "formula": "definition/ -> model.tmdl + relationships.tmdl + tables/{tabla}.tmdl",
    "relatedLessons": [
      "bi4-operacion-02-pbip-tmdl-versionado-git",
      "bi4-operacion-03-cicd-pruebas-promocion-entornos",
      "bi4-operacion-05-genbi-auditable-sinonimos-mcp"
    ],
    "relatedTerms": [
      "pbip-project",
      "c21-semantic-layer",
      "bpa-static-analysis"
    ],
    "sources": [
      {
        "title": "Tabular Model Definition Language (TMDL) overview",
        "url": "https://learn.microsoft.com/en-us/analysis-services/tmdl/tmdl-overview",
        "publisher": "Microsoft Learn",
        "supports": "Sintaxis declarativa con sangría y estructura modular por tabla del modelo tabular.",
        "type": "docs",
        "accessed": "2026-10-29"
      }
    ]
  },
  {
    "id": "pbir-format",
    "term": "Formato de definición de reporte PBIR",
    "englishTerm": "Power BI Enhanced Report Format (PBIR)",
    "track": "bi",
    "definition": "Representación estructurada en carpetas y archivos JSON de la capa visual de un reporte dentro de un proyecto PBIP. Organiza páginas, objetos visuales, filtros, marcadores y temas en ficheros independientes para facilitar la auditoría de referencias a medidas del modelo semántico y la validación estática en pipelines.",
    "formula": "Artefacto.Report/definition/ -> report.json + pages/{page_id}/visuals/{visual_id}/visual.json",
    "relatedLessons": [
      "bi4-operacion-02-pbip-tmdl-versionado-git",
      "bi4-operacion-03-cicd-pruebas-promocion-entornos"
    ],
    "relatedTerms": [
      "pbip-project",
      "tmdl-language"
    ],
    "sources": [
      {
        "title": "Power BI Desktop projects (PBIP)",
        "url": "https://learn.microsoft.com/en-us/power-bi/developer/projects/projects-overview",
        "publisher": "Microsoft Learn",
        "supports": "Organización de la carpeta .Report/definition en ficheros JSON modulares.",
        "type": "docs",
        "accessed": "2026-10-29"
      }
    ]
  },
  {
    "id": "bpa-static-analysis",
    "term": "Analizador de buenas prácticas (BPA)",
    "englishTerm": "Best Practice Analyzer (BPA)",
    "track": "bi",
    "definition": "Motor de inspección estática de metadatos que evalúa reglas declarativas sobre un modelo semántico tabular antes de compilarlo o desplegarlo. Detecta automáticamente defectos estructurales en integración continua, como columnas numéricas o claves foráneas con suma implícita activa, medidas sin cadena de formato o relaciones bidireccionales innecesarias.",
    "formula": "Reglas BPA (JSON) + Modelo TMDL -> Severidad (Error / Warning) -> Código de salida CI",
    "relatedLessons": [
      "bi4-operacion-03-cicd-pruebas-promocion-entornos",
      "bi4-operacion-02-pbip-tmdl-versionado-git"
    ],
    "relatedTerms": [
      "tmdl-language",
      "pbip-project",
      "semantic-reconciliation-test"
    ],
    "sources": [
      {
        "title": "Best Practice Analyzer Documentation",
        "url": "https://docs.tabulareditor.com/te2/Best-Practice-Analyzer.html",
        "publisher": "Tabular Editor",
        "supports": "Definición y evaluación de reglas estáticas sobre metadatos del modelo tabular.",
        "type": "docs",
        "accessed": "2026-10-29"
      },
      {
        "title": "Power BI Desktop projects Azure DevOps build pipelines",
        "url": "https://learn.microsoft.com/en-us/power-bi/developer/projects/projects-azdo",
        "publisher": "Microsoft Learn",
        "supports": "Ejecución automatizada de reglas BPA desde línea de comandos en pipelines CI.",
        "type": "docs",
        "accessed": "2026-10-29"
      }
    ]
  },
  {
    "id": "deployment-pipeline-bi",
    "term": "Pipeline de promoción de entornos BI",
    "englishTerm": "BI Deployment Pipeline",
    "track": "bi",
    "definition": "Flujo automatizado que promueve modelos semánticos y reportes validados a través de espacios de trabajo aislados de desarrollo, pruebas y producción. Aplica reglas de despliegue parametrizadas para reasignar orígenes de datos y cadenas de conexión en cada etapa sin alterar manualmente el código fuente versionado en Git.",
    "formula": "Dev (Rama PR) -> Test (Reglas de conexión + Pruebas de cuadre) -> Prod (Publicación gobernada)",
    "relatedLessons": [
      "bi4-operacion-03-cicd-pruebas-promocion-entornos"
    ],
    "relatedTerms": [
      "pbip-project",
      "bpa-static-analysis",
      "semantic-reconciliation-test"
    ],
    "sources": [
      {
        "title": "Introduction to deployment pipelines in Microsoft Fabric",
        "url": "https://learn.microsoft.com/en-us/fabric/cicd/deployment-pipelines/intro-to-deployment-pipelines",
        "publisher": "Microsoft Learn",
        "supports": "Etapas de promoción entre entornos y aplicación de reglas de despliegue parametrizadas.",
        "type": "docs",
        "accessed": "2026-10-29"
      },
      {
        "title": "CI/CD best practices in Microsoft Fabric",
        "url": "https://learn.microsoft.com/en-us/fabric/cicd/best-practices-cicd",
        "publisher": "Microsoft Learn",
        "supports": "Aislamiento de espacios de trabajo y validación automatizada previa a producción.",
        "type": "docs",
        "accessed": "2026-10-29"
      }
    ]
  },
  {
    "id": "semantic-reconciliation-test",
    "term": "Prueba de reconciliación semántica",
    "englishTerm": "Semantic Reconciliation Test",
    "track": "bi",
    "definition": "Aserción automatizada ejecutada en integración continua que contrasta el resultado numérico de una métrica de la capa semántica frente a una consulta SQL de referencia sobre tablas base preagregadas al mismo grano. Bloquea el despliegue cuando la deriva absoluta supera una tolerancia estricta de redondeo.",
    "formula": "|Métrica_Capa_Semántica - SQL_Referencia_Grano_Base| < 0.01",
    "relatedLessons": [
      "bi4-operacion-03-cicd-pruebas-promocion-entornos",
      "bi4-operacion-01-bi-como-codigo-evidence-observable-rill"
    ],
    "relatedTerms": [
      "c01-grain-fanout",
      "c19-data-contracts-odcs",
      "bpa-static-analysis"
    ],
    "sources": [
      {
        "title": "CI/CD best practices in Microsoft Fabric",
        "url": "https://learn.microsoft.com/en-us/fabric/cicd/best-practices-cicd",
        "publisher": "Microsoft Learn",
        "supports": "Verificación automatizada de calidad y exactitud de consultas antes de promover artefactos.",
        "type": "docs",
        "accessed": "2026-10-29"
      }
    ]
  },
  {
    "id": "report-sprawl",
    "term": "Proliferación descontrolada de tableros",
    "englishTerm": "Report Sprawl",
    "track": "bi",
    "definition": "Acumulación progresiva de reportes duplicados, huérfanos o abandonados en los espacios de trabajo de una organización. Incrementa el consumo innecesario de cómputo por refrescos programados sin lectores activos y erosiona la confianza ejecutiva al exponer múltiples versiones contradictorias de una misma métrica de negocio.",
    "formula": "Tasa de artefactos zombi = Tableros con 0 lectores únicos en 60 días / Total de tableros con refresco activo",
    "relatedLessons": [
      "bi4-operacion-04-telemetria-adopcion-retiro-tableros"
    ],
    "relatedTerms": [
      "dashboard-quarantine",
      "c21-semantic-layer"
    ],
    "sources": [
      {
        "title": "Fabric adoption roadmap: Content ownership and management",
        "url": "https://learn.microsoft.com/en-us/power-bi/guidance/fabric-adoption-roadmap-content-ownership-and-management",
        "publisher": "Microsoft Learn",
        "supports": "Gestión de propiedad de contenido y mitigación de la proliferación de artefactos analíticos.",
        "type": "docs",
        "accessed": "2026-10-29"
      },
      {
        "title": "Monitor usage metrics in workspaces",
        "url": "https://learn.microsoft.com/en-us/power-bi/collaborate-share/service-modern-usage-metrics",
        "publisher": "Microsoft Learn",
        "supports": "Medición de vistas y espectadores únicos por reporte.",
        "type": "docs",
        "accessed": "2026-10-29"
      }
    ]
  },
  {
    "id": "dashboard-quarantine",
    "term": "Cuarentena de tableros",
    "englishTerm": "Dashboard Quarantine",
    "track": "bi",
    "definition": "Fase intermedia del protocolo de retiro de artefactos analíticos en la que un tablero sin adopción reciente se oculta del catálogo activo y se pausa su refresco programado durante un periodo de gracia, conservando su código en Git para restaurarlo de inmediato si un proceso legítimo lo reclama.",
    "formula": "Detección (Inactividad > umbral) -> Aviso de deprecación -> Cuarentena (30 días sin refresco) -> Retiro",
    "relatedLessons": [
      "bi4-operacion-04-telemetria-adopcion-retiro-tableros"
    ],
    "relatedTerms": [
      "report-sprawl",
      "pbip-project"
    ],
    "sources": [
      {
        "title": "Fabric adoption roadmap: Governance",
        "url": "https://learn.microsoft.com/en-us/power-bi/guidance/fabric-adoption-roadmap-governance",
        "publisher": "Microsoft Learn",
        "supports": "Políticas de ciclo de vida, auditoría de obsolescencia y retiro controlado de contenido.",
        "type": "docs",
        "accessed": "2026-10-29"
      },
      {
        "title": "Track user activities in Microsoft Fabric",
        "url": "https://learn.microsoft.com/en-us/fabric/admin/track-user-activities",
        "publisher": "Microsoft Learn",
        "supports": "Extracción del registro de eventos de actividad para auditar inactividad prolongada.",
        "type": "docs",
        "accessed": "2026-10-29"
      }
    ]
  },
  {
    "id": "semantic-synonym-disambiguation",
    "term": "Desambiguación de sinónimos semánticos",
    "englishTerm": "Semantic Synonym Disambiguation",
    "track": "bi",
    "definition": "Práctica de gobierno en capas semánticas y servidores MCP que asigna cada término coloquial de negocio a una única medida certificada, ocultando columnas físicas homónimas. Evita que un asistente GenBI confunda ingresos netos de órdenes completadas con facturación bruta o sumas de pedidos cancelados.",
    "formula": "Término de usuario ('ingresos netos') -> Mapa unívoco de sinónimos -> metric_id certificado + Cita verificable",
    "relatedLessons": [
      "bi4-operacion-05-genbi-auditable-sinonimos-mcp"
    ],
    "relatedTerms": [
      "c28-mcp-semantic-rag-evals",
      "c21-semantic-layer",
      "tmdl-language"
    ],
    "sources": [
      {
        "title": "Update your data model to work well with Copilot",
        "url": "https://learn.microsoft.com/en-us/power-bi/create-reports/copilot-evaluate-data",
        "publisher": "Microsoft Learn",
        "supports": "Configuración de descripciones, sinónimos y ocultamiento de columnas para asistentes de IA.",
        "type": "docs",
        "accessed": "2026-10-29"
      },
      {
        "title": "Best practices to optimize Q&A in Power BI",
        "url": "https://learn.microsoft.com/en-us/power-bi/natural-language/q-and-a-best-practices",
        "publisher": "Microsoft Learn",
        "supports": "Prevención de colisiones léxicas en sinónimos de negocio.",
        "type": "docs",
        "accessed": "2026-10-29"
      },
      {
        "title": "Model Context Protocol (MCP) — Specification 2025-03-26",
        "url": "https://modelcontextprotocol.io/specification/2025-03-26",
        "publisher": "Model Context Protocol",
        "supports": "Exposición estandarizada de recursos y herramientas semánticas hacia modelos de lenguaje.",
        "type": "spec",
        "accessed": "2026-10-29"
      }
    ]
  },
  {
    "id": "c0-tipo-dato",
    "term": "Tipo de dato",
    "englishTerm": "Data Type (INTEGER, DECIMAL, VARCHAR, DATE, BOOLEAN)",
    "track": "core",
    "definition": "Contrato que define qué valores puede almacenar una columna, cuántos bytes ocupa en memoria y qué operaciones admite. Impide errores como sumar textos o aceptar fechas inexistentes. Se confunde a menudo con el formato visual de una celda en una hoja de cálculo, que solo cambia la apariencia sin restringir el valor real.",
    "formula": "SELECT CAST('2024-05-18' AS DATE) AS fecha_tipada, CAST('39.76' AS DECIMAL(10, 2)) AS precio_exacto;",
    "relatedLessons": [
      "c0-datos-01-tipos-dato"
    ],
    "relatedTerms": [
      "c0-decimal-exacto",
      "c0-valor-null"
    ],
    "sources": [
      {
        "title": "PostgreSQL 17 Documentation — Chapter 8: Data Types",
        "url": "https://www.postgresql.org/docs/current/datatype.html",
        "publisher": "PostgreSQL Global Development Group",
        "accessed": "2026-10-29",
        "supports": "Clasificación y propiedades de tipos numéricos, de texto, temporales y booleanos."
      }
    ]
  },
  {
    "id": "c0-decimal-exacto",
    "term": "Decimal exacto frente a coma flotante",
    "englishTerm": "DECIMAL / NUMERIC vs. DOUBLE (IEEE 754)",
    "track": "core",
    "definition": "Los tipos DECIMAL(p,s) o NUMERIC guardan cifras en base 10 sin error de redondeo, por lo que son obligatorios para dinero y contabilidad. En cambio, DOUBLE o FLOAT usan fracciones binarias IEEE 754 donde 0.1 + 0.2 produce 0.30000000000000004. Se confunden porque ambos muestran decimales en pantalla, pero difieren al sumar miles de filas.",
    "formula": "SELECT ROUND(SUM(CAST(list_price_usd AS DECIMAL(10, 2))), 2) FROM products WHERE is_active = true;",
    "relatedLessons": [
      "c0-datos-01-tipos-dato"
    ],
    "relatedTerms": [
      "c0-tipo-dato"
    ],
    "sources": [
      {
        "title": "IEEE Standard for Floating-Point Arithmetic (IEEE 754-2019)",
        "url": "https://ieeexplore.ieee.org/document/8766229",
        "publisher": "IEEE Computer Society",
        "accessed": "2026-10-29",
        "supports": "Representación binaria de coma flotante y origen del error de redondeo en fracciones decimales."
      }
    ]
  },
  {
    "id": "c0-valor-null",
    "term": "Valor NULL",
    "englishTerm": "NULL Marker (Missing or Inapplicable Value)",
    "track": "core",
    "definition": "Marcador especial del modelo relacional que indica que un dato es desconocido, aún no ha ocurrido o no aplica a esa fila. No es el número cero (0) ni una cadena vacía (''). Se confunde con cero al calcular promedios: AVG ignora las filas con NULL, mientras que un cero reduce artificialmente el resultado.",
    "formula": "SELECT COUNT(*) AS total, COUNT(postal_code) AS presentes, COUNT(*) - COUNT(postal_code) AS nulos FROM customers;",
    "relatedLessons": [
      "c0-datos-02-null-vacio"
    ],
    "relatedTerms": [
      "c0-logica-trivalente",
      "c0-tipo-dato"
    ],
    "sources": [
      {
        "title": "DuckDB Documentation — Null Values",
        "url": "https://duckdb.org/docs/sql/data_types/nulls.html",
        "publisher": "DuckDB Foundation",
        "accessed": "2026-10-29",
        "supports": "Comportamiento de NULL en expresiones aritméticas, comparaciones y funciones de agregación."
      }
    ]
  },
  {
    "id": "c0-logica-trivalente",
    "term": "Lógica de tres valores (3VL)",
    "englishTerm": "Three-Valued Logic (TRUE, FALSE, UNKNOWN)",
    "track": "core",
    "definition": "Sistema lógico de SQL donde toda comparación puede evaluar a verdadero (TRUE), falso (FALSE) o desconocido (UNKNOWN). Cualquier igualdad o desigualdad directa contra NULL (como postal_code = NULL) devuelve UNKNOWN y la cláusula WHERE descarta la fila. Por eso los nulos se evalúan siempre con IS NULL, IS NOT NULL o COALESCE.",
    "formula": "SELECT customer_id, COALESCE(postal_code, 'SIN_CP') AS cp_limpio FROM customers WHERE postal_code IS NULL;",
    "relatedLessons": [
      "c0-datos-02-null-vacio"
    ],
    "relatedTerms": [
      "c0-valor-null"
    ],
    "sources": [
      {
        "title": "PostgreSQL 17 Documentation — Section 9.2: Comparison Functions and Operators",
        "url": "https://www.postgresql.org/docs/current/functions-comparison.html",
        "publisher": "PostgreSQL Global Development Group",
        "accessed": "2026-10-29",
        "supports": "Evaluación trivalente de predicados con NULL y uso de IS NULL y COALESCE."
      }
    ]
  },
  {
    "id": "c0-formato-csv",
    "term": "Archivo CSV (valores separados por delimitador)",
    "englishTerm": "Comma-Separated Values (RFC 4180)",
    "track": "core",
    "definition": "Formato de texto plano que almacena datos tabulares fila por fila separando las columnas con comas o puntos y comas. Es legible por humanos y universal, pero no guarda el tipo de dato de cada columna ni comprime valores repetidos. Se confunde a menudo con un libro nativo de Excel (.xlsx).",
    "formula": "SELECT * FROM read_csv('customers.csv', header = true, encoding = 'UTF-8');",
    "relatedLessons": [
      "c0-datos-03-formatos-archivo",
      "c0-datos-04-utf8-separadores"
    ],
    "relatedTerms": [
      "c0-formato-json",
      "c12-parquet-columnar",
      "c0-codificacion-utf8"
    ],
    "sources": [
      {
        "title": "RFC 4180 — Common Format and MIME Type for Comma-Separated Values (CSV) Files",
        "url": "https://datatracker.ietf.org/doc/html/rfc4180",
        "publisher": "IETF",
        "accessed": "2026-10-29",
        "supports": "Especificación del formato CSV en texto plano, delimitadores y escape de comillas."
      }
    ]
  },
  {
    "id": "c0-formato-json",
    "term": "Formato JSON",
    "englishTerm": "JavaScript Object Notation (RFC 8259)",
    "track": "core",
    "definition": "Formato de texto que representa datos como pares clave-valor y listas que pueden anidarse a varios niveles. Es el estándar para respuestas de APIs web y eventos de navegación, pero resulta ineficiente para agregaciones masivas porque repite el nombre de cada atributo en todos los registros. Se complementa extrayendo sus campos hacia Parquet.",
    "formula": "SELECT event_id, json_extract_string(payload_json, '$.campaign') AS campana FROM events LIMIT 5;",
    "relatedLessons": [
      "c0-datos-03-formatos-archivo"
    ],
    "relatedTerms": [
      "c0-formato-csv",
      "c12-parquet-columnar"
    ],
    "sources": [
      {
        "title": "RFC 8259 — The JavaScript Object Notation (JSON) Data Interchange Format",
        "url": "https://datatracker.ietf.org/doc/html/rfc8259",
        "publisher": "IETF",
        "accessed": "2026-10-29",
        "supports": "Gramática, tipos primitivos y anidamiento de objetos y arreglos en JSON."
      }
    ]
  },
  {
    "id": "c0-codificacion-utf8",
    "term": "Codificación UTF-8",
    "englishTerm": "UTF-8 Variable-Width Character Encoding (RFC 3629)",
    "track": "core",
    "definition": "Estándar universal que traduce cada carácter Unicode a una secuencia de 1 a 4 bytes. Las letras inglesas y dígitos ASCII ocupan 1 byte, mientras que las vocales con tilde y la letra ñ en español ocupan 2 bytes. Se distingue al comparar el número de caracteres (LENGTH) con el número de bytes (STRLEN).",
    "formula": "SELECT city, LENGTH(city) AS caracteres, STRLEN(city) AS bytes_utf8 FROM stores WHERE STRLEN(city) > LENGTH(city);",
    "relatedLessons": [
      "c0-datos-04-utf8-separadores"
    ],
    "relatedTerms": [
      "c0-mojibake",
      "c0-formato-csv"
    ],
    "sources": [
      {
        "title": "RFC 3629 — UTF-8, a transformation format of ISO 10646",
        "url": "https://datatracker.ietf.org/doc/html/rfc3629",
        "publisher": "IETF",
        "accessed": "2026-10-29",
        "supports": "Codificación multibyte de puntos de código Unicode en secuencias de 1 a 4 octetos."
      }
    ]
  },
  {
    "id": "c0-mojibake",
    "term": "Caracteres rotos (Mojibake)",
    "englishTerm": "Mojibake (Character Encoding Mismatch)",
    "track": "core",
    "definition": "Distorsión del texto que aparece cuando un archivo guardado en una codificación (como UTF-8) se abre asumiendo otra distinta (como Windows-1252 o Latin-1). Como la letra ñ ocupa dos bytes en UTF-8 (0xC3 y 0xB1), un lector de un byte por carácter muestra Ã± en lugar de ñ. No es un fallo de fuente tipográfica.",
    "formula": "-- Ejemplo: 'EspaÃ±a' ocurre al leer los 2 bytes UTF-8 de 'ñ' (C3 B1) como Latin-1.",
    "relatedLessons": [
      "c0-datos-04-utf8-separadores"
    ],
    "relatedTerms": [
      "c0-codificacion-utf8",
      "c0-formato-csv"
    ],
    "sources": [
      {
        "title": "The Unicode Standard, Core Specification — Chapter 2: General Structure",
        "url": "https://www.unicode.org/versions/latest/",
        "publisher": "Unicode Consortium",
        "accessed": "2026-10-29",
        "supports": "Esquemas de codificación Unicode e interoperabilidad frente a tablas de código heredadas de 8 bits."
      }
    ]
  },
  {
    "id": "c0-clave-primaria",
    "term": "Clave primaria y clave foránea",
    "englishTerm": "Primary Key (PK) & Foreign Key (FK)",
    "track": "core",
    "definition": "La clave primaria es la columna o combinación de columnas cuyo valor identifica de forma única cada fila de una tabla y no admite nulos (como order_id en orders). La clave foránea es una columna que guarda el valor de la clave primaria de otra tabla (como customer_id en orders) para conectar ambas entidades.",
    "formula": "SELECT COUNT(*) AS filas, COUNT(DISTINCT order_id) AS claves_unicas FROM orders;",
    "relatedLessons": [
      "c0-datos-05-tablas-grano"
    ],
    "relatedTerms": [
      "c0-grano-tabla",
      "c01-grain-fanout"
    ],
    "sources": [
      {
        "title": "PostgreSQL 17 Documentation — Section 5.4: Constraints (Primary Keys and Foreign Keys)",
        "url": "https://www.postgresql.org/docs/current/ddl-constraints.html",
        "publisher": "PostgreSQL Global Development Group",
        "accessed": "2026-10-29",
        "supports": "Unicidad y ausencia de nulos en claves primarias y vínculo referencial en claves foráneas."
      }
    ]
  },
  {
    "id": "c0-grano-tabla",
    "term": "Grano de una tabla",
    "englishTerm": "Table Grain (Granularity Declaration)",
    "track": "core",
    "definition": "Respuesta exacta a la pregunta: ¿qué hecho o entidad del mundo real representa una sola fila de esta tabla? En orders una fila es un pedido completo; en order_items una fila es un producto dentro de un pedido. Confundir el grano lleva a sumar o contar unidades equivocadas al cruzar tablas.",
    "formula": "-- Grano de orders: 1 fila = 1 pedido (order_id). Grano de order_items: 1 fila = 1 línea (order_item_id).",
    "relatedLessons": [
      "c0-datos-05-tablas-grano",
      "c1-sql-joins-02-grano-fanout"
    ],
    "relatedTerms": [
      "c0-clave-primaria",
      "c01-grain-fanout"
    ],
    "sources": [
      {
        "title": "Kimball Group — Dimensional Modeling Techniques: Declare the Grain",
        "url": "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/grain/",
        "publisher": "Kimball Group",
        "accessed": "2026-10-29",
        "supports": "Declaración atómica del grano antes de definir dimensiones, medidas o consultas."
      }
    ]
  },
  {
    "id": "ruta-relativa-absoluta",
    "term": "Ruta relativa frente a ruta absoluta",
    "englishTerm": "Relative Path vs. Absolute Path (POSIX)",
    "track": "core",
    "definition": "Una ruta relativa parte de la carpeta actual del proyecto (`datos/stores.parquet`), mientras una absoluta empieza en la raíz del disco (`/Users/ana/...`). Se confunde con el nombre del archivo; usar rutas absolutas rompe el código en otras máquinas.",
    "formula": "head -n 5 ./public/datasets/stores.csv",
    "relatedLessons": [
      "c0-herramientas-01-terminal-rutas"
    ],
    "relatedTerms": [
      "tuberia-unix",
      "entorno-virtual-python"
    ],
    "sources": [
      {
        "title": "The Open Group Base Specifications Issue 8 (POSIX.1-2024) — Pathname Resolution",
        "url": "https://pubs.opengroup.org/onlinepubs/9799919799/utilities/V3_chap02.html",
        "publisher": "IEEE / The Open Group",
        "accessed": "2026-10-29",
        "supports": "Resolución de rutas relativas al directorio de trabajo frente a rutas absolutas desde la raíz."
      }
    ]
  },
  {
    "id": "tuberia-unix",
    "term": "Tubería de comandos (Pipe)",
    "englishTerm": "Unix Pipeline (`|`)",
    "track": "core",
    "definition": "El operador `|` conecta la salida estándar (`stdout`) de un comando con la entrada estándar (`stdin`) del siguiente sin crear archivos intermedios. Por ejemplo, `grep flagship stores.csv | wc -l`. Se confunde con la redirección a archivo `>`.",
    "formula": "grep 'flagship' stores.csv | wc -l",
    "relatedLessons": [
      "c0-herramientas-01-terminal-rutas"
    ],
    "relatedTerms": [
      "ruta-relativa-absoluta"
    ],
    "sources": [
      {
        "title": "The Unix Shell: Pipes and Filters",
        "url": "https://swcarpentry.github.io/shell-novice/04-pipefilter.html",
        "publisher": "The Carpentries",
        "accessed": "2026-10-29",
        "supports": "Encadenamiento de filtros de texto mediante tuberías estándar sin almacenar archivos temporales."
      }
    ]
  },
  {
    "id": "commit-atomico",
    "term": "Commit atómico en Git",
    "englishTerm": "Atomic Commit",
    "track": "core",
    "definition": "Instantánea en Git que agrupa un único cambio lógico completo y verificable (por ejemplo, excluir almacenes del cálculo de tiendas) con un mensaje claro. Se confunde con guardar todo el trabajo del viernes en un solo commit.",
    "formula": "git add consultas/tiendas.sql && git commit -m 'Excluye almacenes WH del objetivo retail'",
    "relatedLessons": [
      "c0-herramientas-02-git-commits-ramas"
    ],
    "relatedTerms": [
      "area-preparacion-git"
    ],
    "sources": [
      {
        "title": "Pro Git Book (2nd Edition) — Chapter 2.2: Recording Changes to the Repository",
        "url": "https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository",
        "publisher": "Git Project (git-scm.com)",
        "accessed": "2026-10-29",
        "supports": "Registro incremental de cambios verificables y descriptivos en el historial del repositorio."
      }
    ]
  },
  {
    "id": "area-preparacion-git",
    "term": "Área de preparación en Git",
    "englishTerm": "Staging Area / Index",
    "track": "core",
    "definition": "Zona intermedia donde seleccionas con `git add` qué archivos o líneas exactas entrarán en el próximo commit antes de confirmarlo. Permite separar dos arreglos distintos hechos en la misma tarde. Se confunde con el directorio de trabajo.",
    "formula": "git add archivo.py && git diff --staged",
    "relatedLessons": [
      "c0-herramientas-02-git-commits-ramas"
    ],
    "relatedTerms": [
      "commit-atomico"
    ],
    "sources": [
      {
        "title": "Pro Git Book (2nd Edition) — Chapter 2.2: Recording Changes to the Repository",
        "url": "https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository",
        "publisher": "Git Project (git-scm.com)",
        "accessed": "2026-10-29",
        "supports": "Separación entre directorio de trabajo, área de preparación (staging area) e historial confirmado."
      }
    ]
  },
  {
    "id": "entorno-virtual-python",
    "term": "Entorno virtual y archivo de bloqueo",
    "englishTerm": "Virtual Environment & Lockfile (`uv.lock`)",
    "track": "core",
    "definition": "Carpeta aislada (`.venv`) que contiene el intérprete Python y las bibliotecas de un proyecto sin mezclarlas con el sistema. El archivo `uv.lock` fija las versiones exactas instaladas; se confunde con `pyproject.toml`, que solo declara rangos.",
    "formula": "uv add polars duckdb && uv run validar_tiendas.py",
    "relatedLessons": [
      "c0-herramientas-03-python-inicial-uv"
    ],
    "relatedTerms": [
      "ruta-relativa-absoluta",
      "cuaderno-reactivo-dag"
    ],
    "sources": [
      {
        "title": "Astral uv Documentation — Working on Projects",
        "url": "https://docs.astral.sh/uv/guides/projects/",
        "publisher": "Astral",
        "accessed": "2026-10-29",
        "supports": "Creación de entornos virtuales aislados y resolución determinista en uv.lock."
      }
    ]
  },
  {
    "id": "estado-oculto-cuaderno",
    "term": "Estado oculto en cuadernos interactivos",
    "englishTerm": "Hidden State in Notebooks",
    "track": "core",
    "definition": "Desfase en un cuaderno tradicional (`.ipynb`) cuando la memoria del kernel conserva variables de celdas borradas o ejecutadas fuera de orden (`In [12]` antes de `In [3]`). Se confunde con un error del motor de datos.",
    "formula": "# Celda ejecutada fuera de orden -> resultado no reproducible al reiniciar el kernel",
    "relatedLessons": [
      "c0-herramientas-04-cuadernos-jupyter-marimo",
      "de2-formatos-03-duckdb-polars-marimo"
    ],
    "relatedTerms": [
      "cuaderno-reactivo-dag"
    ],
    "sources": [
      {
        "title": "Marimo Documentation — Reactive Execution and Hidden State Prevention",
        "url": "https://docs.marimo.io/guides/reactivity/",
        "publisher": "Marimo Team",
        "accessed": "2026-10-29",
        "supports": "Explicación de cómo la ejecución arbitraria de celdas genera estado oculto en memoria."
      }
    ]
  },
  {
    "id": "cuaderno-reactivo-dag",
    "term": "Cuaderno reactivo basado en grafo (DAG)",
    "englishTerm": "Reactive Notebook (Directed Acyclic Graph)",
    "track": "core",
    "definition": "Cuaderno (como Marimo) que analiza qué variables define y consume cada celda para construir un grafo acíclico dirigido. Al cambiar un filtro, recalcula automáticamente las celdas dependientes y se guarda como `.py`. Se confunde con `.ipynb`.",
    "formula": "uv run marimo edit analisis_tiendas.py",
    "relatedLessons": [
      "c0-herramientas-04-cuadernos-jupyter-marimo",
      "de2-formatos-03-duckdb-polars-marimo"
    ],
    "relatedTerms": [
      "estado-oculto-cuaderno",
      "entorno-virtual-python"
    ],
    "sources": [
      {
        "title": "Marimo Documentation — Reactive Execution",
        "url": "https://docs.marimo.io/guides/reactivity/",
        "publisher": "Marimo Team",
        "accessed": "2026-10-29",
        "supports": "Orden topológico de ejecución mediante un grafo acíclico dirigido de celdas en archivos Python puros."
      }
    ]
  },
  {
    "id": "traza-error-traceback",
    "term": "Traza de error (Traceback)",
    "englishTerm": "Stack Traceback",
    "track": "core",
    "definition": "Reporte que imprime Python o un motor SQL cuando falla la ejecución. Muestra la cadena de llamadas de arriba abajo y coloca en la última línea el tipo exacto de excepción (`KeyError`, `TypeError`) y su causa.",
    "formula": "KeyError: 'target_usd'  # La columna real se llama 'monthly_target_usd'",
    "relatedLessons": [
      "c0-herramientas-05-trazas-error-documentacion"
    ],
    "relatedTerms": [
      "entorno-virtual-python"
    ],
    "sources": [
      {
        "title": "Python 3.14 Official Tutorial — Chapter 8: Errors and Exceptions",
        "url": "https://docs.python.org/3/tutorial/errors.html",
        "publisher": "Python Software Foundation",
        "accessed": "2026-10-29",
        "supports": "Lectura de trazas de pila (Most recent call last) y clasificación de excepciones."
      }
    ]
  },
  {
    "id": "c0-hojas-tabla-estructurada",
    "term": "Tabla estructurada",
    "englishTerm": "Structured Table (Excel Table)",
    "track": "core",
    "definition": "Rango rectangular de hoja de cálculo con encabezados únicos que expande sus filas automáticamente y propaga fórmulas por columna sin romper referencias.",
    "formula": "=[@qty]*[@unit_price_usd]-[@discount_usd] -- Ejemplo: TablaPedidos en Excel. Se confunde con: un rango suelto con bordes pintados (A2:F500).",
    "relatedLessons": [
      "c0-hojas-01-tablas-referencias",
      "c0-hojas-02-tablas-dinamicas"
    ],
    "relatedTerms": [
      "c0-hojas-referencia-estructurada",
      "c0-hojas-tabla-dinamica"
    ],
    "sources": [
      {
        "title": "Overview of Excel tables",
        "url": "https://support.microsoft.com/en-us/office/overview-of-excel-tables-7ab0bb7d-3a9e-4b56-a3c9-6c94334e492c",
        "publisher": "Microsoft Support",
        "accessed": "2026-10-29",
        "supports": "Comportamiento de expansión automática de filas y columnas calculadas en tablas estructuradas."
      }
    ]
  },
  {
    "id": "c0-hojas-referencia-estructurada",
    "term": "Referencia estructurada",
    "englishTerm": "Structured Reference",
    "track": "core",
    "definition": "Notación de fórmulas que apunta a tablas y nombres de columna entre corchetes en lugar de usar coordenadas fijas de celdas como C2:C500.",
    "formula": "=SUMA(TablaPedidos[total_usd]) -- Ejemplo: [@unit_price_usd] para la fila actual. Se confunde con: referencia absoluta por coordenadas ($C$2:$C$500).",
    "relatedLessons": [
      "c0-hojas-01-tablas-referencias",
      "c0-hojas-03-buscarx-cruces"
    ],
    "relatedTerms": [
      "c0-hojas-tabla-estructurada",
      "c0-hojas-buscarx"
    ],
    "sources": [
      {
        "title": "Using structured references with Excel tables",
        "url": "https://support.microsoft.com/en-us/office/using-structured-references-with-excel-tables-f5ed2452-2337-4f71-bed3-c8ae6d2b276e",
        "publisher": "Microsoft Support",
        "accessed": "2026-10-29",
        "supports": "Sintaxis Tabla[Columna] y especificador de fila actual [@Columna] en hojas de cálculo."
      }
    ]
  },
  {
    "id": "c0-hojas-tabla-dinamica",
    "term": "Tabla dinámica",
    "englishTerm": "PivotTable",
    "track": "core",
    "definition": "Resumen interactivo que agrupa filas, cruza categorías en columnas y calcula sumas o conteos en una hoja separada sin modificar los datos originales.",
    "formula": "Filas = GROUP BY | Valores = SUM() / COUNT() | Filtros = WHERE -- Se confunde con: insertar filas de subtotales manuales dentro de la tabla cruda.",
    "relatedLessons": [
      "c0-hojas-02-tablas-dinamicas"
    ],
    "relatedTerms": [
      "c0-hojas-tabla-estructurada",
      "c01-grain-fanout"
    ],
    "sources": [
      {
        "title": "Create a PivotTable to analyze worksheet data",
        "url": "https://support.microsoft.com/en-us/office/create-a-pivottable-to-analyze-worksheet-data-a9a84538-bfe9-40a9-a8e9-f99134456576",
        "publisher": "Microsoft Support",
        "accessed": "2026-10-29",
        "supports": "Estructura de cuatro áreas (Filas, Columnas, Valores y Filtros) para resumir datos tabulares."
      }
    ]
  },
  {
    "id": "c0-hojas-buscarx",
    "term": "BUSCARX (XLOOKUP)",
    "englishTerm": "XLOOKUP Function",
    "track": "core",
    "definition": "Función de búsqueda que localiza una clave en una columna y devuelve el valor correspondiente de otra columna usando coincidencia exacta por defecto.",
    "formula": "=BUSCARX([@product_id]; TablaProductos[product_id]; TablaProductos[category]; \"Sin catálogo\") -- Se confunde con: BUSCARV (VLOOKUP) con número de columna fijo.",
    "relatedLessons": [
      "c0-hojas-03-buscarx-cruces"
    ],
    "relatedTerms": [
      "c0-hojas-referencia-estructurada",
      "c01-grain-fanout"
    ],
    "sources": [
      {
        "title": "XLOOKUP function",
        "url": "https://support.microsoft.com/en-us/office/xlookup-function-b7fd680e-6d10-43e6-84f9-88eae8bf5929",
        "publisher": "Microsoft Support",
        "accessed": "2026-10-29",
        "supports": "Argumentos de XLOOKUP, coincidencia exacta por defecto y retorno de la primera coincidencia."
      }
    ]
  },
  {
    "id": "c0-hojas-fecha-iso",
    "term": "Fecha en formato ISO 8601",
    "englishTerm": "ISO 8601 Date (YYYY-MM-DD)",
    "track": "core",
    "definition": "Estándar internacional que escribe las fechas de mayor a menor unidad (año, mes y día) para eliminar la ambigüedad entre formatos regionales.",
    "formula": "2025-03-04 (4 de marzo de 2025) -- Ejemplo: order_date en orders. Se confunde con: cadenas ambiguas como 04/03/2025 o 03/04/2025.",
    "relatedLessons": [
      "c0-hojas-04-errores-fechas-celdas"
    ],
    "relatedTerms": [
      "c0-hojas-celdas-combinadas"
    ],
    "sources": [
      {
        "title": "RFC 3339: Date and Time on the Internet: Timestamps (ISO 8601 Profile)",
        "url": "https://datatracker.ietf.org/doc/html/rfc3339",
        "publisher": "IETF",
        "accessed": "2026-10-29",
        "supports": "Notación estándar YYYY-MM-DD y marcas de tiempo con sufijo de zona horaria explícito."
      }
    ]
  },
  {
    "id": "c0-hojas-celdas-combinadas",
    "term": "Celdas combinadas",
    "englishTerm": "Merged Cells",
    "track": "core",
    "definition": "Unión visual de varias celdas contiguas que conserva únicamente el valor superior izquierdo y convierte el resto del bloque en celdas vacías.",
    "formula": "COALESCE(postal_code, 'SIN_CODIGO') -- Ejemplo: agrupar visualmente regiones en Excel dejando filas con NULL. Se confunde con: agrupar en tabla dinámica.",
    "relatedLessons": [
      "c0-hojas-04-errores-fechas-celdas"
    ],
    "relatedTerms": [
      "c0-hojas-fecha-iso",
      "c0-hojas-tabla-estructurada"
    ],
    "sources": [
      {
        "title": "Merge and unmerge cells in Excel",
        "url": "https://support.microsoft.com/en-us/office/merge-and-unmerge-cells-5cbd15d5-9375-4540-907f-c673a93fcedf",
        "publisher": "Microsoft Support",
        "accessed": "2026-10-29",
        "supports": "Pérdida de valores en celdas secundarias al combinar un rango y pasos para descombinar."
      }
    ]
  },
  {
    "id": "ingreso-neto",
    "term": "Ingreso bruto frente a ingreso neto",
    "englishTerm": "Gross Revenue vs. Net Revenue (IFRS 15 / ASC 606)",
    "track": "core",
    "definition": "El ingreso bruto suma el valor de los bienes vendidos antes de deducciones. El ingreso neto resta los descuentos comerciales y las devoluciones procesadas sobre pedidos efectivamente entregados, excluyendo siempre los impuestos recaudados para el fisco. Es la base real sobre la que se mide la rentabilidad.",
    "formula": "ingreso_neto_usd = SUM(subtotal_usd - discount_usd - COALESCE(devoluciones_usd, 0))",
    "relatedLessons": [
      "c0-negocio-01-ingreso-costo-margen"
    ],
    "relatedTerms": [
      "margen-bruto",
      "c01-grain-fanout"
    ],
    "sources": [
      {
        "title": "IFRS 15 Revenue from Contracts with Customers",
        "url": "https://www.ifrs.org/issued-standards/list-of-standards/ifrs-15-revenue-from-contracts-with-customers/",
        "publisher": "IFRS Foundation / IASB",
        "accessed": "2026-10-29",
        "supports": "Reconocimiento de ingresos netos de descuentos, devoluciones e impuestos recaudados por cuenta de terceros."
      }
    ]
  },
  {
    "id": "margen-bruto",
    "term": "Margen bruto y costo directo (COGS)",
    "englishTerm": "Gross Margin & Cost of Goods Sold (Non-Additive Ratio)",
    "track": "core",
    "definition": "El costo directo (COGS) es lo que cuesta fabricar o adquirir los productos vendidos. El margen bruto en dinero es el ingreso neto menos ese costo directo. Expresado en porcentaje, es una métrica no aditiva: se calcula dividiendo la suma del margen entre la suma del ingreso.",
    "formula": "margen_bruto_pct = SUM(ingreso_neto_usd - costo_directo_usd) * 100.0 / SUM(ingreso_neto_usd)",
    "relatedLessons": [
      "c0-negocio-01-ingreso-costo-margen"
    ],
    "relatedTerms": [
      "ingreso-neto",
      "c10-simpsons-paradox"
    ],
    "sources": [
      {
        "title": "Additive, Semi-Additive, and Non-Additive Facts",
        "url": "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/additive-semi-additive-non-additive-fact/",
        "publisher": "Kimball Group",
        "accessed": "2026-10-29",
        "supports": "Regla de agregación de razones y márgenes porcentuales mediante la suma del numerador entre la suma del denominador."
      }
    ]
  },
  {
    "id": "embudo-conversion",
    "term": "Embudo de conversión",
    "englishTerm": "Conversion Funnel (Product & Marketing Analytics)",
    "track": "core",
    "definition": "Secuencia ordenada de etapas que recorre una persona desde el primer contacto hasta completar una acción objetivo, como pagar y recibir un pedido. Exige contar entidades únicas (sesiones, clientes o pedidos con COUNT DISTINCT) para evitar que los eventos repetidos o reintentos distorsionen los porcentajes.",
    "formula": "conversion_global_pct = COUNT(DISTINCT id_paso_final) * 100.0 / COUNT(DISTINCT id_paso_inicial)",
    "relatedLessons": [
      "c0-negocio-02-embudos-conversion"
    ],
    "relatedTerms": [
      "tasa-caida-dropoff",
      "kpi-vs-metrica-vanidad"
    ],
    "sources": [
      {
        "title": "Interpret your Funnel Analysis: Conversion Rate, Drop-off & Time to Convert",
        "url": "https://amplitude.com/docs/analytics/charts/funnel-analysis/funnel-analysis-interpret",
        "publisher": "Amplitude Documentation",
        "accessed": "2026-10-29",
        "supports": "Cálculo de conversión acumulada y por etapa sobre unidades únicas de análisis."
      }
    ]
  },
  {
    "id": "tasa-caida-dropoff",
    "term": "Tasa de caída y conversión paso a paso",
    "englishTerm": "Step Conversion & Drop-off Rate",
    "track": "core",
    "definition": "La conversión paso a paso mide qué porcentaje de quienes alcanzaron una etapa avanzan a la inmediata siguiente. Su complemento a cien es la tasa de caída (drop-off), que localiza el cuello de botella exacto donde se pierden usuarios o pedidos dentro del flujo operativo.",
    "formula": "dropoff_paso_k_pct = 100.0 - (entidades_paso_k * 100.0 / entidades_paso_k_menos_1)",
    "relatedLessons": [
      "c0-negocio-02-embudos-conversion"
    ],
    "relatedTerms": [
      "embudo-conversion",
      "umbral-decision"
    ],
    "sources": [
      {
        "title": "GA4 Funnel Exploration: Open vs. Closed Funnels",
        "url": "https://support.google.com/analytics/answer/9327974",
        "publisher": "Google Analytics Help",
        "accessed": "2026-10-29",
        "supports": "Medición de tasas de continuación y abandono entre pasos consecutivos de un embudo."
      }
    ]
  },
  {
    "id": "kpi-vs-metrica-vanidad",
    "term": "Indicador de desempeño (KPI) frente a métrica de vanidad",
    "englishTerm": "Key Performance Indicator (KPI) vs. Vanity Metric",
    "track": "core",
    "definition": "Una métrica de vanidad acumula volumen bruto (impresiones, clics o registros históricos) y aparenta éxito aunque el negocio pierda dinero. Un KPI mide el progreso hacia un objetivo operativo mediante una fórmula con denominador claro, grano explícito, ventana temporal, responsable y umbral de acción.",
    "formula": "cpa_usd = SUM(spend_usd) / SUM(attributed_conversions)",
    "relatedLessons": [
      "c0-negocio-03-kpi-metrica-vanidad"
    ],
    "relatedTerms": [
      "metrica-guardia",
      "ingreso-neto"
    ],
    "sources": [
      {
        "title": "Key Performance Indicators: Developing, Implementing, and Using Winning KPIs (4th Edition)",
        "url": "https://www.wiley.com/en-us/Key+Performance+Indicators+%28KPI%29%3A+Developing%2C+Implementing%2C+and+Using+Winning+KPIs%2C+4th+Edition-p-9781119620778",
        "publisher": "John Wiley & Sons (David Parmenter)",
        "accessed": "2026-10-29",
        "supports": "Criterios para distinguir un KPI accionable de un contador de volumen sin contexto."
      }
    ]
  },
  {
    "id": "metrica-guardia",
    "term": "Métrica guardia",
    "englishTerm": "Guardrail Metric",
    "track": "core",
    "definition": "Indicador de control que acompaña a un KPI principal para vigilar que perseguir una meta de crecimiento no deteriore la salud del negocio. Por ejemplo, al optimizar las ventas de una campaña promocional, la tasa de reembolso y el margen bruto actúan como métricas guardia.",
    "formula": "tasa_reembolso_pct = SUM(devuelto_usd) * 100.0 / SUM(subtotal_usd - discount_usd)",
    "relatedLessons": [
      "c0-negocio-03-kpi-metrica-vanidad",
      "c0-negocio-04-pregunta-a-decision"
    ],
    "relatedTerms": [
      "kpi-vs-metrica-vanidad",
      "umbral-decision"
    ],
    "sources": [
      {
        "title": "Trustworthy Online Controlled Experiments: A Practical Guide to A/B Testing",
        "url": "https://experimentguide.com/",
        "publisher": "Cambridge University Press (Kohavi, Tang & Xu)",
        "accessed": "2026-10-29",
        "supports": "Diseño de métricas guardia para proteger márgenes, calidad y experiencia del usuario al optimizar un indicador."
      }
    ]
  },
  {
    "id": "hipotesis-refutable",
    "term": "Hipótesis de negocio refutable",
    "englishTerm": "Refutable Business Hypothesis (CRISP-DM)",
    "track": "core",
    "definition": "Afirmación cuantitativa y específica que traduce una duda vaga en una comprobación que los datos pueden confirmar o desmentir. Incluye la palanca o segmento evaluado, la métrica afectada, la dirección del cambio esperado y el corte de comparación antes de ejecutar la consulta.",
    "formula": "Si aplicamos [palanca] en [segmento], entonces [métrica] cambiará en al menos [delta]",
    "relatedLessons": [
      "c0-negocio-04-pregunta-a-decision",
      "da2-eda-01-hipotesis-preguntas-refutables"
    ],
    "relatedTerms": [
      "umbral-decision",
      "metrica-guardia",
      "pesca-correlaciones",
      "perfilado-datos"
    ],
    "sources": [
      {
        "title": "CRISP-DM 1.0 Guide — Phase 1: Business Understanding",
        "url": "https://www.ibm.com/docs/en/spss-modeler/saas?topic=dm-crisp-help-overview",
        "publisher": "IBM Documentation / CRISP-DM Consortium",
        "accessed": "2026-10-29",
        "supports": "Traducción de objetivos de negocio ambiguos en preguntas analíticas verificables con criterios de éxito."
      },
      {
        "title": "R for Data Science (2nd Edition) — Chapter 10: Exploratory Data Analysis",
        "url": "https://r4ds.hadley.nz/EDA.html",
        "publisher": "O'Reilly Media",
        "accessed": "2026-10-29",
        "supports": "Formulación de preguntas estructuradas sobre variación y covariación para contrastar expectativas con datos reales."
      }
    ]
  },
  {
    "id": "umbral-decision",
    "term": "Umbral de decisión",
    "englishTerm": "Decision Threshold & Action Rule",
    "track": "core",
    "definition": "Valor numérico acordado antes de mirar el reporte que separa dos cursos de acción distintos. Evita que un equipo adapte su interpretación a conveniencia después de conocer el resultado y conecta directamente el número obtenido en SQL con una decisión operativa concreta.",
    "formula": "CASE WHEN margen_con_descuento >= margen_sin_descuento THEN 'Mantener' ELSE 'Retirar' END",
    "relatedLessons": [
      "c0-negocio-04-pregunta-a-decision"
    ],
    "relatedTerms": [
      "hipotesis-refutable",
      "kpi-vs-metrica-vanidad"
    ],
    "sources": [
      {
        "title": "Trustworthy Online Controlled Experiments: A Practical Guide to A/B Testing",
        "url": "https://experimentguide.com/",
        "publisher": "Cambridge University Press (Kohavi, Tang & Xu)",
        "accessed": "2026-10-29",
        "supports": "Fijación previa de reglas y umbrales de lanzamiento para tomar decisiones objetivas basadas en datos."
      }
    ]
  },
  {
    "id": "media-aritmetica",
    "term": "Media aritmética",
    "englishTerm": "Arithmetic Mean — AVG(x)",
    "track": "core",
    "definition": "Suma de todos los valores numéricos dividida entre el número de observaciones no nulas. En Mercado Brisa, el pedido medio es 426.10 USD. Se confunde con la mediana cuando existen valores extremos que arrastran el promedio hacia la cola alta.",
    "formula": "AVG(total_usd) = SUM(total_usd) / COUNT(total_usd)",
    "relatedLessons": [
      "c0-numeros-01-media-mediana-moda",
      "c0-numeros-03-asimetria-sesgo"
    ],
    "relatedTerms": [
      "mediana",
      "asimetria-distribucion"
    ],
    "sources": [
      {
        "title": "NIST/SEMATECH e-Handbook of Statistical Methods — Section 1.3.5.1: Measures of Location",
        "url": "https://www.itl.nist.gov/div898/handbook/eda/section3/eda351.htm",
        "publisher": "National Institute of Standards and Technology",
        "accessed": "2026-10-29",
        "supports": "Definición matemática de la media aritmética y sensibilidad ante valores atípicos."
      }
    ]
  },
  {
    "id": "mediana",
    "term": "Mediana (p50)",
    "englishTerm": "Median — MEDIAN(x) / QUANTILE_CONT(x, 0.50)",
    "track": "core",
    "definition": "Valor central que divide una columna ordenada en dos mitades con el mismo número de filas. En Mercado Brisa, la mediana de pedido es 350.16 USD. Se confunde con la media aritmética o con la moda en distribuciones asimétricas.",
    "formula": "MEDIAN(total_usd) = QUANTILE_CONT(total_usd, 0.50)",
    "relatedLessons": [
      "c0-numeros-01-media-mediana-moda",
      "c0-numeros-02-dispersion-iqr-percentiles"
    ],
    "relatedTerms": [
      "media-aritmetica",
      "percentil",
      "rango-intercuartilico"
    ],
    "sources": [
      {
        "title": "NIST/SEMATECH e-Handbook of Statistical Methods — Section 1.3.5.1: Measures of Location",
        "url": "https://www.itl.nist.gov/div898/handbook/eda/section3/eda351.htm",
        "publisher": "National Institute of Standards and Technology",
        "accessed": "2026-10-29",
        "supports": "Definición de la mediana como estimador de centro con punto de ruptura del 50 %."
      }
    ]
  },
  {
    "id": "rango-intercuartilico",
    "term": "Rango intercuartílico (IQR)",
    "englishTerm": "Interquartile Range — Q3 - Q1",
    "track": "core",
    "definition": "Distancia entre el percentil 75 (Q3) y el percentil 25 (Q1), que abarca el 50 % central de los datos. En pedidos de Mercado Brisa vale 454.65 USD (621.35 menos 166.71). Se confunde con el rango total (máximo menos mínimo).",
    "formula": "QUANTILE_CONT(x, 0.75) - QUANTILE_CONT(x, 0.25)",
    "relatedLessons": [
      "c0-numeros-02-dispersion-iqr-percentiles",
      "c0-numeros-03-asimetria-sesgo"
    ],
    "relatedTerms": [
      "percentil",
      "mediana"
    ],
    "sources": [
      {
        "title": "NIST/SEMATECH e-Handbook of Statistical Methods — Section 1.3.3.7: Box Plot",
        "url": "https://www.itl.nist.gov/div898/handbook/eda/section3/eda337.htm",
        "publisher": "National Institute of Standards and Technology",
        "accessed": "2026-10-29",
        "supports": "Definición del rango intercuartílico y cercas de Tukey para detectar valores atípicos."
      }
    ]
  },
  {
    "id": "percentil",
    "term": "Percentil (p50, p90, p99)",
    "englishTerm": "Percentile / Quantile — QUANTILE_CONT(x, p)",
    "track": "core",
    "definition": "Cota por debajo de la cual se sitúa un porcentaje dado de observaciones ordenadas. Un p90 de 876.17 USD en pedidos indica que el 90 % cuesta eso o menos. Se confunde con el porcentaje del ingreso total acumulado.",
    "formula": "QUANTILE_CONT(total_usd, 0.90)",
    "relatedLessons": [
      "c0-numeros-02-dispersion-iqr-percentiles",
      "c0-numeros-03-asimetria-sesgo"
    ],
    "relatedTerms": [
      "mediana",
      "rango-intercuartilico"
    ],
    "sources": [
      {
        "title": "DuckDB Documentation — Statistical Aggregate Functions (quantile_cont)",
        "url": "https://duckdb.org/docs/sql/functions/aggregates",
        "publisher": "DuckDB Foundation",
        "accessed": "2026-10-29",
        "supports": "Cálculo de cuantiles continuos interpolados en SQL sobre columnas numéricas."
      }
    ]
  },
  {
    "id": "asimetria-distribucion",
    "term": "Asimetría de una distribución",
    "englishTerm": "Skewness — SKEWNESS(x)",
    "track": "core",
    "definition": "Falta de simetría de una variable respecto a su centro. Es positiva cuando la cola derecha se alarga y empuja la media por encima de la mediana, como en reembolsos (SKEWNESS = 1.63). Se confunde con el sesgo de muestreo.",
    "formula": "SKEWNESS(refund_amount_usd)",
    "relatedLessons": [
      "c0-numeros-03-asimetria-sesgo",
      "c0-numeros-01-media-mediana-moda"
    ],
    "relatedTerms": [
      "sesgo-estadistico",
      "media-aritmetica",
      "mediana"
    ],
    "sources": [
      {
        "title": "NIST/SEMATECH e-Handbook of Statistical Methods — Section 1.3.5.11: Measures of Skewness and Kurtosis",
        "url": "https://www.itl.nist.gov/div898/handbook/eda/section3/eda35b.htm",
        "publisher": "National Institute of Standards and Technology",
        "accessed": "2026-10-29",
        "supports": "Definición del coeficiente de asimetría de Fisher-Pearson e interpretación de colas."
      }
    ]
  },
  {
    "id": "sesgo-estadistico",
    "term": "Sesgo estadístico",
    "englishTerm": "Statistical Bias / Selection Bias",
    "track": "core",
    "definition": "Error sistemático en la captura, muestreo o estimación que aleja el resultado del valor real de la población, como encuestar solo a clientes activos. En español suele traducirse desde skewness, por lo que se confunde con la asimetría geométrica.",
    "formula": "Sesgo = E[estimador] - parametro_real",
    "relatedLessons": [
      "c0-numeros-03-asimetria-sesgo",
      "c0-numeros-05-correlacion-causalidad"
    ],
    "relatedTerms": [
      "asimetria-distribucion",
      "variable-confusion"
    ],
    "sources": [
      {
        "title": "Causal Inference: What If — Part I: Selection Bias and Confounding",
        "url": "https://miguelhernan.org/whatifbook",
        "publisher": "Harvard T.H. Chan School of Public Health / CRC Press",
        "accessed": "2026-10-29",
        "supports": "Diferencia entre sesgo sistemático de selección o medición y variabilidad aleatoria."
      }
    ]
  },
  {
    "id": "punto-porcentual",
    "term": "Punto porcentual (pp)",
    "englishTerm": "Percentage Point (pp)",
    "track": "core",
    "definition": "Diferencia aritmética directa entre dos porcentajes. Pasar de una tasa de fallo del 7.73 % al 11.60 % supone un aumento de 3.87 puntos porcentuales (pp). Se confunde con la variación relativa porcentual, que en ese mismo caso es +50.1 %.",
    "formula": "diferencia_pp = tasa_final_pct - tasa_inicial_pct",
    "relatedLessons": [
      "c0-numeros-04-proporciones-tasas-bps"
    ],
    "relatedTerms": [
      "punto-base"
    ],
    "sources": [
      {
        "title": "Eurostat Statistics Explained — Percentage Change and Percentage Points",
        "url": "https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Beginners:Statistical_concept_-_Percentage_change_and_percentage_points",
        "publisher": "European Commission / Eurostat",
        "accessed": "2026-10-29",
        "supports": "Distinción entre diferencia aritmética en puntos porcentuales y tasa de variación relativa."
      }
    ]
  },
  {
    "id": "punto-base",
    "term": "Punto base (bps)",
    "englishTerm": "Basis Point (bps — 1/100 of 1%)",
    "track": "core",
    "definition": "Centésima parte de un punto porcentual: 1 punto porcentual equivale a 100 puntos base (0.01 % = 1 bps). Una tasa de reembolso del 8.00 % se expresa como 800 bps. Se confunde con el porcentaje relativo de cambio.",
    "formula": "bps = porcentaje * 100 = proporcion * 10000",
    "relatedLessons": [
      "c0-numeros-04-proporciones-tasas-bps"
    ],
    "relatedTerms": [
      "punto-porcentual"
    ],
    "sources": [
      {
        "title": "Eurostat Statistics Explained — Percentage Change and Percentage Points",
        "url": "https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Beginners:Statistical_concept_-_Percentage_change_and_percentage_points",
        "publisher": "European Commission / Eurostat",
        "accessed": "2026-10-29",
        "supports": "Conversión exacta entre proporciones decimales, puntos porcentuales y puntos base."
      }
    ]
  },
  {
    "id": "correlacion-pearson",
    "term": "Coeficiente de correlación de Pearson (r)",
    "englishTerm": "Pearson Correlation Coefficient — CORR(y, x)",
    "track": "core",
    "definition": "Medida adimensional entre -1 y +1 que cuantifica la fuerza y dirección de la asociación lineal entre dos variables numéricas. En marketing_spend, CORR(spend_usd, attributed_conversions) dentro de paid_social es 0.585. Se confunde con pendiente o con relación causal directa.",
    "formula": "CORR(y, x) = COVAR_POP(y, x) / (STDDEV_POP(y) * STDDEV_POP(x))",
    "relatedLessons": [
      "c0-numeros-05-correlacion-causalidad"
    ],
    "relatedTerms": [
      "variable-confusion"
    ],
    "sources": [
      {
        "title": "DuckDB Documentation — Statistical Aggregate Functions (corr)",
        "url": "https://duckdb.org/docs/sql/functions/aggregates",
        "publisher": "DuckDB Foundation",
        "accessed": "2026-10-29",
        "supports": "Cálculo del coeficiente de correlación lineal de Pearson sobre pares no nulos en SQL."
      }
    ]
  },
  {
    "id": "variable-confusion",
    "term": "Variable de confusión (confusor)",
    "englishTerm": "Confounding Variable / Confounder",
    "track": "core",
    "definition": "Tercera variable que influye tanto en la variable explicativa como en el resultado, creando una correlación espuria o distorsionada. En marketing_spend, el canal (channel) fija tanto el presupuesto base como el volumen de conversiones. Se confunde con una variable mediadora.",
    "formula": "Estratificar con GROUP BY variable_confusora",
    "relatedLessons": [
      "c0-numeros-05-correlacion-causalidad"
    ],
    "relatedTerms": [
      "correlacion-pearson",
      "sesgo-estadistico",
      "c10-simpsons-paradox"
    ],
    "sources": [
      {
        "title": "Causal Inference: What If — Part I: Confounding and Causal Diagrams",
        "url": "https://miguelhernan.org/whatifbook",
        "publisher": "Harvard T.H. Chan School of Public Health / CRC Press",
        "accessed": "2026-10-29",
        "supports": "Definición de confusor como causa común y control mediante estratificación o ajuste."
      }
    ]
  },
  {
    "id": "clave-primaria-subrogada",
    "term": "Clave primaria, natural y subrogada",
    "englishTerm": "Primary Key, Natural Key & Surrogate Key",
    "track": "core",
    "definition": "Una clave primaria identifica cada fila sin admitir nulos ni duplicados. La clave natural nace del negocio (`products.sku`), mientras la clave subrogada es un entero secuencial sin significado (`product_id`, `change_id`). No se confunde con un índice secundario, que acelera búsquedas pero permite valores repetidos.",
    "formula": "SELECT COUNT(*) = COUNT(DISTINCT product_id) AS pk_valida FROM products;",
    "relatedLessons": [
      "c1-modelo-01-claves-primarias-foraneas",
      "c1-modelo-02-normalizacion-1fn-3fn"
    ],
    "relatedTerms": [
      "clave-foranea",
      "c01-grain-fanout",
      "c07-scd-type-2"
    ],
    "sources": [
      {
        "title": "Kimball Group — Dimensional Modeling Techniques: Surrogate Keys",
        "url": "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/surrogate-key/",
        "publisher": "Kimball Group",
        "accessed": "2026-10-29",
        "supports": "Distinción entre claves naturales operativas y claves subrogadas enteras para mantener la estabilidad del modelo e historizar cambios."
      }
    ]
  },
  {
    "id": "clave-foranea",
    "term": "Clave foránea (Foreign Key)",
    "englishTerm": "Foreign Key Constraint",
    "track": "core",
    "definition": "Columna o conjunto de columnas en una tabla hija (`orders.customer_id`) cuyos valores apuntan a la clave primaria de una tabla padre (`customers.customer_id`). En una relación uno a muchos la clave foránea se repite legítimamente en la tabla hija; no debe confundirse con la clave primaria de la propia tabla hija.",
    "formula": "SELECT COUNT(*) AS pedidos, COUNT(DISTINCT customer_id) AS clientes_con_pedido FROM orders;",
    "relatedLessons": [
      "c1-modelo-01-claves-primarias-foraneas",
      "c1-modelo-03-integridad-huerfanos"
    ],
    "relatedTerms": [
      "clave-primaria-subrogada",
      "integridad-referencial-huerfanos"
    ],
    "sources": [
      {
        "title": "PostgreSQL 17 Documentation — Section 5.4: Constraints (Primary and Foreign Keys)",
        "url": "https://www.postgresql.org/docs/current/ddl-constraints.html",
        "publisher": "PostgreSQL Global Development Group",
        "accessed": "2026-10-29",
        "supports": "Definición y semántica de claves foráneas entre tabla referenciante (hija) y tabla referenciada (padre)."
      }
    ]
  },
  {
    "id": "dependencia-funcional",
    "term": "Dependencia funcional y Tercera Forma Normal (3FN)",
    "englishTerm": "Functional Dependency & Third Normal Form (3NF)",
    "track": "core",
    "definition": "Existe una dependencia funcional `X -> Y` cuando cada valor de `X` determina un único valor de `Y` (como `store_id -> store_name`). Una tabla está en Tercera Forma Normal (3FN) cuando cada columna que no es clave depende solo de la clave primaria completa y no transitivamente de otra columna.",
    "formula": "SELECT store_id, COUNT(DISTINCT store_name) AS nombres_por_id FROM stores GROUP BY store_id HAVING COUNT(DISTINCT store_name) > 1;",
    "relatedLessons": [
      "c1-modelo-02-normalizacion-1fn-3fn"
    ],
    "relatedTerms": [
      "anomalia-actualizacion",
      "clave-primaria-subrogada",
      "c06-star-vs-obt"
    ],
    "sources": [
      {
        "title": "E. F. Codd (1970) — A Relational Model of Data for Large Shared Data Banks",
        "url": "https://www.seas.upenn.edu/~zives/03f/cis550/codd.pdf",
        "publisher": "Communications of the ACM",
        "accessed": "2026-10-29",
        "supports": "Formulación original de la normalización relacional y eliminación de dependencias redundantes."
      }
    ]
  },
  {
    "id": "anomalia-actualizacion",
    "term": "Anomalía de actualización, inserción y borrado",
    "englishTerm": "Update, Insertion & Deletion Anomalies",
    "track": "core",
    "definition": "Inconsistencia que ocurre en una tabla desnormalizada cuando un dato maestro se repite en miles de filas transaccionales: cambiar el nombre de una tienda exige actualizar miles de pedidos (`update anomaly`), y borrar el último pedido de una tienda borraría también los datos de la tienda (`deletion anomaly`).",
    "formula": "SELECT store_id, COUNT(order_id) AS filas_a_reescribir_sin_3fn FROM orders GROUP BY store_id;",
    "relatedLessons": [
      "c1-modelo-02-normalizacion-1fn-3fn"
    ],
    "relatedTerms": [
      "dependencia-funcional",
      "clave-primaria-subrogada"
    ],
    "sources": [
      {
        "title": "E. F. Codd (1970) — A Relational Model of Data for Large Shared Data Banks",
        "url": "https://www.seas.upenn.edu/~zives/03f/cis550/codd.pdf",
        "publisher": "Communications of the ACM",
        "accessed": "2026-10-29",
        "supports": "Demostración de las anomalías de actualización, inserción y borrado provocadas por redundancia en tablas no normalizadas."
      }
    ]
  },
  {
    "id": "integridad-referencial-huerfanos",
    "term": "Integridad referencial y registro huérfano",
    "englishTerm": "Referential Integrity & Orphan Records",
    "track": "core",
    "definition": "Propiedad que garantiza que todo valor no nulo de una clave foránea en una tabla hija existe como clave primaria en su tabla padre. Un registro huérfano es una fila hija que apunta a una entidad padre inexistente o dada de baja. No debe confundirse con una clave foránea legítimamente nula, como un visitante web sin sesión iniciada.",
    "formula": "SELECT COUNT(*) AS huerfanos FROM order_items oi ANTI JOIN orders o ON oi.order_id = o.order_id;",
    "relatedLessons": [
      "c1-modelo-03-integridad-huerfanos",
      "c1-modelo-05-validacion-bloqueante"
    ],
    "relatedTerms": [
      "clave-foranea",
      "anti-join"
    ],
    "sources": [
      {
        "title": "PostgreSQL 17 Documentation — Section 5.4.5: Foreign Keys",
        "url": "https://www.postgresql.org/docs/current/ddl-constraints.html",
        "publisher": "PostgreSQL Global Development Group",
        "accessed": "2026-10-29",
        "supports": "Garantía de integridad referencial entre tablas relacionadas y prevención de referencias huérfanas."
      }
    ]
  },
  {
    "id": "anti-join",
    "term": "ANTI JOIN y exclusión segura ante valores NULL",
    "englishTerm": "Relational Anti-Join (ANTI JOIN / NOT EXISTS)",
    "track": "core",
    "definition": "Operación relacional que devuelve únicamente las filas de la tabla izquierda que no tienen ninguna coincidencia en la tabla derecha (`FROM a ANTI JOIN b ON a.id = b.id` o `WHERE NOT EXISTS`). A diferencia de `NOT IN`, no colapsa a cero filas cuando la tabla derecha contiene valores `NULL`.",
    "formula": "SELECT e.event_id FROM events e ANTI JOIN customers c ON e.customer_id = c.customer_id;",
    "relatedLessons": [
      "c1-modelo-03-integridad-huerfanos"
    ],
    "relatedTerms": [
      "integridad-referencial-huerfanos",
      "clave-foranea"
    ],
    "sources": [
      {
        "title": "DuckDB Documentation — FROM & JOIN Clauses (ANTI JOIN and SEMI JOIN)",
        "url": "https://duckdb.org/docs/sql/query_syntax/from.html",
        "publisher": "DuckDB Foundation",
        "accessed": "2026-10-29",
        "supports": "Sintaxis y comportamiento de ANTI JOIN en DuckDB para filtrar filas sin correspondencia en la tabla derecha."
      }
    ]
  },
  {
    "id": "idempotencia-duplicados",
    "term": "Clave de idempotencia y auditoría de duplicados",
    "englishTerm": "Idempotency Key & Duplicate Detection",
    "track": "core",
    "definition": "Identificador único generado por el emisor de una operación (`payments.idempotency_key`) para garantizar que, si la red falla y el mensaje se reenvía varias veces, el sistema receptor detecte las copias repetidas. No se confunde con un reintento legítimo de negocio (`attempt_number = 2`), que posee su propia clave de idempotencia distinta.",
    "formula": "SELECT idempotency_key, COUNT(*) AS copias FROM payments GROUP BY idempotency_key HAVING COUNT(*) > 1;",
    "relatedLessons": [
      "c1-modelo-04-auditoria-calidad",
      "c1-modelo-05-validacion-bloqueante"
    ],
    "relatedTerms": [
      "clave-primaria-subrogada",
      "validacion-bloqueante-wap"
    ],
    "sources": [
      {
        "title": "dbt Labs Documentation — Add Data Tests to Your DAG (unique, not_null, accepted_values)",
        "url": "https://docs.getdbt.com/docs/build/data-tests",
        "publisher": "dbt Labs",
        "accessed": "2026-10-29",
        "supports": "Auditoría sistemática de unicidad, nulos y valores aceptados sobre tablas analíticas."
      }
    ]
  },
  {
    "id": "validacion-bloqueante-wap",
    "term": "Validación bloqueante y patrón Write-Audit-Publish (WAP)",
    "englishTerm": "Blocking Data Quality Gate & Write-Audit-Publish",
    "track": "core",
    "definition": "Arquitectura de control de calidad en tres pasos: escribir la tabla transformada en un área aislada (Write), ejecutar consultas de validación que deben devolver exactamente cero filas con fallos (Audit) y exponer la tabla a los usuarios solo si todas las reglas críticas aprueban (Publish). Evita publicar datos corruptos.",
    "formula": "SELECT regla, fallos, CASE WHEN fallos = 0 THEN 'PASS' ELSE 'BLOCKED' END AS estado FROM auditoria;",
    "relatedLessons": [
      "c1-modelo-05-validacion-bloqueante"
    ],
    "relatedTerms": [
      "idempotencia-duplicados",
      "integridad-referencial-huerfanos",
      "c18-iceberg-v3",
      "c19-data-contracts-odcs"
    ],
    "sources": [
      {
        "title": "SQLMesh Documentation — Audits (Blocking vs. Non-Blocking Data Quality Audits)",
        "url": "https://sqlmesh.readthedocs.io/en/stable/concepts/audits/",
        "publisher": "Tobiko Data",
        "accessed": "2026-10-29",
        "supports": "Ejecución de auditorías bloqueantes basadas en consultas que devuelven cero filas para detener la publicación ante errores."
      }
    ]
  },
  {
    "id": "polars-lazyframe",
    "term": "Evaluación perezosa (LazyFrame en Polars)",
    "englishTerm": "Polars LazyFrame & Query Optimizer",
    "track": "core",
    "definition": "Plan de consulta declarativo en Polars que retrasa la lectura de disco hasta invocar collect, aplicando antes poda de columnas y empuje de filtros.",
    "formula": "pl.scan_parquet('orders.parquet').filter(pl.col('status') == 'completed').select(['order_id', 'total_usd']).collect()  # Se confunde con: pl.read_parquet(), que carga todo el archivo en RAM antes de filtrar.",
    "relatedLessons": [
      "c1-python-01-polars-pandas-cow",
      "c1-python-02-io-csv-json-parquet"
    ],
    "relatedTerms": [
      "pandas-copy-on-write",
      "polars-expresion-columnar"
    ],
    "sources": [
      {
        "title": "Polars User Guide — Lazy API and Query Optimization",
        "url": "https://docs.pola.rs/user-guide/lazy/",
        "publisher": "Polars Project",
        "accessed": "2026-10-29",
        "supports": "Optimización de planes lógicos con predicate pushdown y projection pushdown antes de materializar datos."
      }
    ]
  },
  {
    "id": "pandas-copy-on-write",
    "term": "Copy-on-Write (CoW) en pandas 3.0",
    "englishTerm": "pandas 3.0 Copy-on-Write",
    "track": "core",
    "definition": "Regla obligatoria en pandas 3.0 donde cualquier subconjunto indexado actúa como copia aislada, compartiendo memoria subyacente hasta que una columna se modifica explícitamente.",
    "formula": "sub = df[df['is_active']]  # En pandas 3.0 modificar sub nunca altera df; la asignación encadenada df['a'][0] = 1 lanza ChainedAssignmentError.",
    "relatedLessons": [
      "c1-python-01-polars-pandas-cow"
    ],
    "relatedTerms": [
      "polars-lazyframe",
      "pyarrow-string-dtype"
    ],
    "sources": [
      {
        "title": "pandas 3.0 User Guide — Copy-on-Write (CoW)",
        "url": "https://pandas.pydata.org/docs/user_guide/copy_on_write.html",
        "publisher": "PyData / NumFOCUS",
        "accessed": "2026-10-29",
        "supports": "Semántica de copia diferida obligatoria en pandas 3.0 y eliminación de SettingWithCopyWarning."
      }
    ]
  },
  {
    "id": "pyarrow-string-dtype",
    "term": "Tipo de texto PyArrow (str / pl.String)",
    "englishTerm": "Arrow Contiguous UTF-8 String Array",
    "track": "core",
    "definition": "Representación columnar que almacena cadenas UTF-8 en búferes contiguos de Apache Arrow en lugar de punteros dispersos a objetos de Python en memoria.",
    "formula": "pl.read_csv('customers.csv', schema_overrides={'postal_code': pl.String})  # Se confunde con: el antiguo dtype object de pandas 1.x que guardaba punteros PyObject.",
    "relatedLessons": [
      "c1-python-01-polars-pandas-cow",
      "c1-python-02-io-csv-json-parquet",
      "c1-python-04-limpieza-texto-fechas-tz"
    ],
    "relatedTerms": [
      "pandas-copy-on-write",
      "esquema-explicito-io"
    ],
    "sources": [
      {
        "title": "pandas 3.0 User Guide — Working with Text Data (PyArrow String Dtype)",
        "url": "https://pandas.pydata.org/docs/user_guide/text.html",
        "publisher": "PyData / NumFOCUS",
        "accessed": "2026-10-29",
        "supports": "Almacenamiento de texto respaldado por PyArrow por defecto en pandas 3.0 y Polars."
      }
    ]
  },
  {
    "id": "esquema-explicito-io",
    "term": "Sobrescritura de esquema en lectura (schema_overrides)",
    "englishTerm": "Explicit Schema & Type Overrides on Read",
    "track": "core",
    "definition": "Definición manual de tipos de dato al leer archivos CSV o JSON para impedir que la inferencia automática trunque ceros o falle.",
    "formula": "pl.scan_csv('customers.csv', schema_overrides={'postal_code': pl.String})  # Evita que '06102' se convierta en el entero 6102 o que 'C1051' lance ComputeError.",
    "relatedLessons": [
      "c1-python-02-io-csv-json-parquet"
    ],
    "relatedTerms": [
      "pyarrow-string-dtype",
      "polars-lazyframe"
    ],
    "sources": [
      {
        "title": "Polars User Guide — IO: CSV, JSON and Parquet",
        "url": "https://docs.pola.rs/user-guide/io/",
        "publisher": "Polars Project",
        "accessed": "2026-10-29",
        "supports": "Control de inferencia de tipos en archivos de texto mediante schema_overrides."
      }
    ]
  },
  {
    "id": "polars-expresion-columnar",
    "term": "Expresión columnar vectorizada (pl.col)",
    "englishTerm": "Vectorized Columnar Expression",
    "track": "core",
    "definition": "Función declarativa sobre una o más columnas que el motor compila y ejecuta en paralelo sobre vectores contiguos sin bucles del intérprete Python.",
    "formula": "(pl.col('list_price_usd') - pl.col('unit_cost_usd')).alias('unit_margin_usd')  # Se confunde con: df.apply(lambda r: ..., axis=1), que itera fila por fila en Python.",
    "relatedLessons": [
      "c1-python-01-polars-pandas-cow",
      "c1-python-03-expresiones-vectorizadas"
    ],
    "relatedTerms": [
      "polars-lazyframe",
      "validacion-cardinalidad-join"
    ],
    "sources": [
      {
        "title": "Polars User Guide — Expressions and Contexts",
        "url": "https://docs.pola.rs/user-guide/expressions/",
        "publisher": "Polars Project",
        "accessed": "2026-10-29",
        "supports": "Composición y ejecución paralelizada de expresiones columnares en Polars."
      }
    ]
  },
  {
    "id": "validacion-cardinalidad-join",
    "term": "Validación de cardinalidad en uniones (validate)",
    "englishTerm": "Join Cardinality Validation (1:1, m:1)",
    "track": "core",
    "definition": "Parámetro de unión en Polars y pandas que verifica antes de cruzar dos tablas si las claves cumplen la relación esperada sin duplicados.",
    "formula": "orders.join(items_por_pedido, on='order_id', how='left', validate='1:1')  # Falla de inmediato si la tabla derecha tiene múltiples filas por order_id.",
    "relatedLessons": [
      "c1-python-03-expresiones-vectorizadas"
    ],
    "relatedTerms": [
      "polars-expresion-columnar"
    ],
    "sources": [
      {
        "title": "Polars User Guide — Transformations: Joins",
        "url": "https://docs.pola.rs/user-guide/transformations/joins/",
        "publisher": "Polars Project",
        "accessed": "2026-10-29",
        "supports": "Verificación de relaciones 1:1, 1:m y m:1 en tiempo de ejecución durante un join."
      }
    ]
  },
  {
    "id": "normalizacion-utc-tz",
    "term": "Normalización de zona horaria a UTC (convert_time_zone)",
    "englishTerm": "Timezone Conversion vs Timezone Replacement",
    "track": "core",
    "definition": "Conversión de marcas temporales con distintos desplazamientos locales a un mismo instante en tiempo universal coordinado antes de truncar o agrupar por fecha.",
    "formula": "pl.col('event_ts_raw').str.to_datetime(time_zone='UTC')  # Se confunde con: replace_time_zone, que cambia la etiqueta de zona sin ajustar la hora física.",
    "relatedLessons": [
      "c1-python-04-limpieza-texto-fechas-tz"
    ],
    "relatedTerms": [
      "pyarrow-string-dtype"
    ],
    "sources": [
      {
        "title": "Polars User Guide — Time Zones and Temporal Operations",
        "url": "https://docs.pola.rs/user-guide/transformations/time-series/timezones/",
        "publisher": "Polars Project",
        "accessed": "2026-10-29",
        "supports": "Conversión de instantes entre zonas horarias frente a asignación de etiqueta temporal."
      }
    ]
  },
  {
    "id": "funcion-pura-transformacion",
    "term": "Función pura de transformación tabular",
    "englishTerm": "Pure DataFrame Transformation Function",
    "track": "core",
    "definition": "Función que recibe tablas en memoria y devuelve una tabla nueva sin leer archivos externos ni modificar estados globales, facilitando pruebas unitarias.",
    "formula": "def calcular_margen(df_items: pl.DataFrame, df_prod: pl.DataFrame) -> pl.DataFrame: ...  # Se prueba en milisegundos con polars.testing.assert_frame_equal.",
    "relatedLessons": [
      "c1-python-05-cuaderno-a-script-cli"
    ],
    "relatedTerms": [
      "polars-expresion-columnar"
    ],
    "sources": [
      {
        "title": "Polars API Reference — polars.testing.assert_frame_equal",
        "url": "https://docs.pola.rs/api/python/stable/reference/testing.html",
        "publisher": "Polars Project",
        "accessed": "2026-10-29",
        "supports": "Pruebas automatizadas deterministas sobre funciones de transformación de DataFrames."
      }
    ]
  },
  {
    "id": "orden-logico-sql",
    "term": "Orden lógico de evaluación SQL",
    "englishTerm": "Logical Query Processing Order",
    "track": "core",
    "definition": "Secuencia interna en que el motor evalúa una consulta (`FROM` → `WHERE` → `GROUP BY` → `HAVING` → `SELECT` → `DISTINCT` → `ORDER BY` → `LIMIT`), distinta del orden en que se escribe.",
    "formula": "-- Orden lógico: 1) FROM stores -> 2) WHERE store_type = 'flagship' -> 3) SELECT store_code, monthly_target_usd * 12 AS annual_target_usd",
    "confusedWith": "Orden sintáctico de escritura (donde SELECT se escribe primero aunque se evalúe casi al final).",
    "relatedLessons": [
      "c1-sql-base-01-select-from-where",
      "c1-sql-base-02-orderby-limit-distinct",
      "c1-sql-base-04-groupby-having"
    ],
    "relatedTerms": [
      "proyeccion-select",
      "predicado-where",
      "filtro-grupos-having"
    ],
    "sources": [
      {
        "title": "PostgreSQL 17 Documentation — Chapter 7.2: Table Expressions",
        "url": "https://www.postgresql.org/docs/17/queries-table-expressions.html",
        "publisher": "PostgreSQL Global Development Group",
        "accessed": "2026-10-29",
        "supports": "Secuencia lógica de evaluación de FROM, WHERE, GROUP BY, HAVING y SELECT."
      }
    ]
  },
  {
    "id": "proyeccion-select",
    "term": "Proyección y alias de columna (SELECT ... AS)",
    "englishTerm": "Column Projection and Aliasing",
    "track": "core",
    "definition": "Operación relacional que elige qué columnas existentes o expresiones calculadas devolver en la tabla de salida y les asigna un nombre legible mediante la palabra reservada `AS`.",
    "formula": "SELECT sku, list_price_usd - unit_cost_usd AS unit_margin_usd FROM products;",
    "confusedWith": "Filtrado de filas con WHERE (SELECT elige columnas verticales; WHERE filtra filas horizontales).",
    "relatedLessons": [
      "c1-sql-base-01-select-from-where"
    ],
    "relatedTerms": [
      "orden-logico-sql",
      "predicado-where"
    ],
    "sources": [
      {
        "title": "DuckDB SQL Reference — SELECT Clause",
        "url": "https://duckdb.org/docs/stable/sql/query_syntax/select",
        "publisher": "DuckDB Foundation",
        "accessed": "2026-10-29",
        "supports": "Proyección de expresiones escalares y definición de alias de columna con AS."
      }
    ]
  },
  {
    "id": "predicado-where",
    "term": "Predicado de filtrado de filas (WHERE)",
    "englishTerm": "Row-Level Search Condition (WHERE)",
    "track": "core",
    "definition": "Condición lógica evaluada fila por fila inmediatamente después de `FROM`. Solo las filas cuyo predicado produce `TRUE` pasan a las fases siguientes; las que producen `FALSE` o `UNKNOWN` se descartan.",
    "formula": "SELECT order_id, total_usd FROM orders WHERE status = 'completed' AND total_usd >= 500;",
    "confusedWith": "Cláusula HAVING (que filtra grupos ya agregados después de GROUP BY, no filas individuales).",
    "relatedLessons": [
      "c1-sql-base-01-select-from-where",
      "c1-sql-base-03-null-logica-coalesce",
      "c1-sql-base-04-groupby-having"
    ],
    "relatedTerms": [
      "orden-logico-sql",
      "logica-trivalente-null",
      "filtro-grupos-having"
    ],
    "sources": [
      {
        "title": "DuckDB SQL Reference — WHERE Clause",
        "url": "https://duckdb.org/docs/stable/sql/query_syntax/where",
        "publisher": "DuckDB Foundation",
        "accessed": "2026-10-29",
        "supports": "Evaluación booleana por fila en la cláusula WHERE."
      }
    ]
  },
  {
    "id": "deduplicacion-distinct",
    "term": "Deduplicación de filas proyectadas (SELECT DISTINCT)",
    "englishTerm": "Tuple Deduplication (SELECT DISTINCT)",
    "track": "core",
    "definition": "Modificador de `SELECT` que elimina filas repetidas del resultado final comparando la combinación completa de todas las columnas proyectadas, tratando dos valores `NULL` como iguales entre sí.",
    "formula": "SELECT DISTINCT region, country_code FROM stores ORDER BY region, country_code;",
    "confusedWith": "COUNT(DISTINCT col) (que devuelve un número entero con la cantidad de valores únicos en vez de listar las filas).",
    "relatedLessons": [
      "c1-sql-base-02-orderby-limit-distinct",
      "c1-sql-base-07-count-variantes"
    ],
    "relatedTerms": [
      "ordenamiento-determinista",
      "variantes-count-sql"
    ],
    "sources": [
      {
        "title": "PostgreSQL 17 Documentation — Chapter 7.3: Select Lists (DISTINCT)",
        "url": "https://www.postgresql.org/docs/17/queries-select-lists.html",
        "publisher": "PostgreSQL Global Development Group",
        "accessed": "2026-10-29",
        "supports": "Eliminación de filas duplicadas sobre la tupla completa de columnas seleccionadas."
      }
    ]
  },
  {
    "id": "ordenamiento-determinista",
    "term": "Ordenamiento determinista y acotación (ORDER BY y LIMIT)",
    "englishTerm": "Deterministic Sorting and Top-N Limiting",
    "track": "core",
    "definition": "Patrón que combina `ORDER BY` con una columna de desempate única (como `order_id ASC`) antes de `LIMIT`, garantizando que el recorte de las primeras `N` filas sea siempre idéntico.",
    "formula": "SELECT order_id, total_usd FROM orders WHERE status = 'refunded' ORDER BY total_usd DESC, order_id ASC LIMIT 5;",
    "confusedWith": "Usar LIMIT sin ORDER BY (que devuelve un subconjunto arbitrario dependiente del orden físico de lectura).",
    "relatedLessons": [
      "c1-sql-base-02-orderby-limit-distinct"
    ],
    "relatedTerms": [
      "orden-logico-sql",
      "deduplicacion-distinct"
    ],
    "sources": [
      {
        "title": "PostgreSQL 17 Documentation — Chapter 7.5 & 7.6: Sorting Rows and LIMIT",
        "url": "https://www.postgresql.org/docs/17/queries-order.html",
        "publisher": "PostgreSQL Global Development Group",
        "accessed": "2026-10-29",
        "supports": "Necesidad de ORDER BY con desempate explícito para que LIMIT sea reproducible."
      }
    ]
  },
  {
    "id": "logica-trivalente-null",
    "term": "Lógica de tres valores (TRUE, FALSE, UNKNOWN)",
    "englishTerm": "Three-Valued Logic (3VL) and IS NULL",
    "track": "core",
    "definition": "Sistema lógico de SQL donde cualquier comparación con `NULL` mediante `=` o `<>` devuelve `UNKNOWN`. Como `WHERE` solo conserva `TRUE`, verificar nulos exige `IS NULL`, `IS NOT NULL` o `IS DISTINCT FROM`.",
    "formula": "SELECT order_id FROM orders WHERE campaign_id IS DISTINCT FROM 'CMP-VERANO';",
    "confusedWith": "Comparación booleana binaria (`campaign_id = NULL` o `campaign_id <> 'X'`, que descarta los registros con NULL).",
    "relatedLessons": [
      "c1-sql-base-03-null-logica-coalesce"
    ],
    "relatedTerms": [
      "predicado-where",
      "coalesce-nullif"
    ],
    "sources": [
      {
        "title": "Modern SQL — Three-Valued Logic (3VL) in SQL",
        "url": "https://modern-sql.com/concept/three-valued-logic",
        "publisher": "Markus Winand",
        "accessed": "2026-10-29",
        "supports": "Tablas de verdad de UNKNOWN y efecto de <> sobre columnas con valores NULL."
      }
    ]
  },
  {
    "id": "coalesce-nullif",
    "term": "Funciones de control de nulos (COALESCE y NULLIF)",
    "englishTerm": "NULL Handling Functions (COALESCE and NULLIF)",
    "track": "core",
    "definition": "`COALESCE(a, b, ...)` devuelve el primer argumento no nulo de izquierda a derecha para asignar valores de respaldo; `NULLIF(a, b)` devuelve `NULL` si `a = b`, evitando errores de división por cero.",
    "formula": "SELECT order_id, COALESCE(campaign_id, 'ORGANICO') AS campaign_label, discount_usd / NULLIF(subtotal_usd, 0) AS pct_desc FROM orders;",
    "confusedWith": "Modificar el dato almacenado en disco (COALESCE solo sustituye el nulo en el resultado proyectado o calculado).",
    "relatedLessons": [
      "c1-sql-base-03-null-logica-coalesce"
    ],
    "relatedTerms": [
      "logica-trivalente-null",
      "agregacion-condicional-filter"
    ],
    "sources": [
      {
        "title": "PostgreSQL 17 Documentation — Section 9.18: Conditional Expressions",
        "url": "https://www.postgresql.org/docs/17/functions-conditional.html",
        "publisher": "PostgreSQL Global Development Group",
        "accessed": "2026-10-29",
        "supports": "Comportamiento de evaluación en cortocircuito de COALESCE y prevención de divisiones por cero con NULLIF."
      }
    ]
  },
  {
    "id": "agregacion-group-by",
    "term": "Agrupación y cambio de grano (GROUP BY)",
    "englishTerm": "Row Aggregation and Grain Reduction (GROUP BY)",
    "track": "core",
    "definition": "Cláusula que reúne múltiples filas con el mismo valor en las columnas indicadas y las colapsa en una única fila por grupo, permitiendo calcular sumas (`SUM`), promedios (`AVG`) o conteos (`COUNT`).",
    "formula": "SELECT store_id, COUNT(*) AS pedidos, ROUND(SUM(total_usd), 2) AS ingresos_usd FROM orders GROUP BY store_id;",
    "confusedWith": "Funciones de ventana con OVER (que calculan agregados sin colapsar las filas originales de la tabla).",
    "relatedLessons": [
      "c1-sql-base-04-groupby-having",
      "c1-sql-joins-02-grano-fanout"
    ],
    "relatedTerms": [
      "filtro-grupos-having",
      "c01-grain-fanout"
    ],
    "sources": [
      {
        "title": "DuckDB SQL Reference — GROUP BY Clause",
        "url": "https://duckdb.org/docs/stable/sql/query_syntax/groupby",
        "publisher": "DuckDB Foundation",
        "accessed": "2026-10-29",
        "supports": "Agrupación de filas por claves y uso de funciones de agregación."
      }
    ]
  },
  {
    "id": "filtro-grupos-having",
    "term": "Filtrado de grupos agregados (HAVING)",
    "englishTerm": "Group-Level Filter Clause (HAVING)",
    "track": "core",
    "definition": "Cláusula evaluada después de `GROUP BY` que filtra grupos completos según el resultado de una función de agregación (como `HAVING COUNT(*) >= 1100` o `HAVING SUM(total_usd) > 500000`).",
    "formula": "SELECT store_id, COUNT(*) AS completed_orders FROM orders WHERE status = 'completed' GROUP BY store_id HAVING COUNT(*) >= 1100;",
    "confusedWith": "Cláusula WHERE (que filtra filas individuales antes de agrupar y no admite funciones como SUM o COUNT).",
    "relatedLessons": [
      "c1-sql-base-04-groupby-having"
    ],
    "relatedTerms": [
      "predicado-where",
      "agregacion-group-by",
      "orden-logico-sql"
    ],
    "sources": [
      {
        "title": "DuckDB SQL Reference — HAVING Clause",
        "url": "https://duckdb.org/docs/stable/sql/query_syntax/having",
        "publisher": "DuckDB Foundation",
        "accessed": "2026-10-29",
        "supports": "Diferencia de fase de evaluación entre WHERE (filas previas) y HAVING (grupos agregados)."
      }
    ]
  },
  {
    "id": "agregacion-condicional-filter",
    "term": "Expresión CASE WHEN y cláusula FILTER",
    "englishTerm": "Conditional Expressions (CASE WHEN) and Aggregate FILTER",
    "track": "core",
    "definition": "`CASE WHEN` evalúa condiciones en orden para clasificar valores fila por fila; `FILTER (WHERE ...)` restringe qué filas entran a una función agregada específica sin contaminar promedios con ceros.",
    "formula": "SELECT device_type, COUNT(*) FILTER (WHERE status = 'completed') AS completados, ROUND(AVG(discount_usd) FILTER (WHERE discount_usd > 0), 2) AS desc_medio FROM orders GROUP BY device_type;",
    "confusedWith": "AVG(CASE WHEN cond THEN valor ELSE 0 END) (que divide entre todas las filas e introduce ceros falsos en el promedio).",
    "relatedLessons": [
      "c1-sql-base-05-case-when-filter"
    ],
    "relatedTerms": [
      "agregacion-group-by",
      "coalesce-nullif"
    ],
    "sources": [
      {
        "title": "DuckDB SQL Reference — FILTER Clause",
        "url": "https://duckdb.org/docs/stable/sql/query_syntax/filter",
        "publisher": "DuckDB Foundation",
        "accessed": "2026-10-29",
        "supports": "Agregaciones condicionales limpias mediante FILTER (WHERE condicion)."
      }
    ]
  },
  {
    "id": "truncado-temporal-date-trunc",
    "term": "Truncado temporal (DATE_TRUNC) y diferencia de fechas (DATE_DIFF)",
    "englishTerm": "Date Truncation (DATE_TRUNC) and Date Difference (DATE_DIFF)",
    "track": "core",
    "definition": "`DATE_TRUNC(unidad, fecha)` redondea una fecha o marca de tiempo hacia atrás al inicio exacto del año, trimestre, mes o día; `DATE_DIFF(unidad, inicio, fin)` cuenta las fronteras de esa unidad entre dos fechas.",
    "formula": "SELECT DATE_TRUNC('quarter', order_date)::DATE AS quarter_start, COUNT(*) AS pedidos FROM orders GROUP BY quarter_start;",
    "confusedWith": "EXTRACT(MONTH FROM fecha) (que devuelve un número del 1 al 12 sin año y mezcla meses de distintos años al agrupar).",
    "relatedLessons": [
      "c1-sql-base-06-fechas-date-trunc"
    ],
    "relatedTerms": [
      "agregacion-group-by",
      "predicado-where"
    ],
    "sources": [
      {
        "title": "DuckDB SQL Reference — Date Functions (date_trunc, date_diff)",
        "url": "https://duckdb.org/docs/stable/sql/functions/date",
        "publisher": "DuckDB Foundation",
        "accessed": "2026-10-29",
        "supports": "Comportamiento de date_trunc y date_diff en series temporales SQL."
      }
    ]
  },
  {
    "id": "variantes-count-sql",
    "term": "Variantes de conteo: COUNT(*), COUNT(col) y COUNT(DISTINCT col)",
    "englishTerm": "COUNT(*), COUNT(column), and COUNT(DISTINCT column)",
    "track": "core",
    "definition": "`COUNT(*)` cuenta todas las filas del grupo incluyendo nulos; `COUNT(col)` cuenta solo las filas donde `col` no es `NULL`; `COUNT(DISTINCT col)` cuenta cuántos valores diferentes no nulos existen en `col`.",
    "formula": "SELECT COUNT(*) AS filas, COUNT(campaign_id) AS con_campana, COUNT(DISTINCT customer_id) AS clientes_unicos FROM orders;",
    "confusedWith": "Asumir que COUNT(columna) incluye los valores NULL igual que COUNT(*), o que COUNT(*) cuenta clientes únicos.",
    "relatedLessons": [
      "c1-sql-base-07-count-variantes",
      "c1-sql-joins-02-grano-fanout"
    ],
    "relatedTerms": [
      "logica-trivalente-null",
      "deduplicacion-distinct",
      "c01-grain-fanout"
    ],
    "sources": [
      {
        "title": "DuckDB SQL Reference — Aggregate Functions (count)",
        "url": "https://duckdb.org/docs/stable/sql/functions/aggregates",
        "publisher": "DuckDB Foundation",
        "accessed": "2026-10-29",
        "supports": "Diferencia semántica entre COUNT(*), COUNT(col) y COUNT(DISTINCT col)."
      }
    ]
  },
  {
    "id": "c1-joins-left-join",
    "term": "Unión izquierda (LEFT JOIN)",
    "englishTerm": "LEFT OUTER JOIN",
    "track": "core",
    "definition": "Operación que conserva todas las filas de la tabla izquierda y rellena con NULL las columnas de la tabla derecha cuando no existe coincidencia en la condición ON. Se confunde con INNER JOIN cuando se filtra la tabla derecha en WHERE, descartando los nulos.",
    "formula": "SELECT c.customer_id, o.order_id FROM customers c LEFT JOIN orders o ON c.customer_id = o.customer_id AND o.status = 'completed';",
    "relatedLessons": [
      "c1-sql-joins-01-tipos-join",
      "c1-sql-joins-02-grano-fanout"
    ],
    "relatedTerms": [
      "c1-joins-semi-anti",
      "c01-grain-fanout"
    ],
    "sources": [
      {
        "title": "PostgreSQL 17 Documentation — Section 7.2: Table Expressions and JOIN Clauses",
        "url": "https://www.postgresql.org/docs/current/queries-table-expressions.html",
        "publisher": "PostgreSQL Global Development Group",
        "accessed": "2026-10-29",
        "supports": "Semántica de LEFT OUTER JOIN y diferencia entre condiciones en ON frente a filtros en WHERE."
      }
    ]
  },
  {
    "id": "c1-joins-semi-anti",
    "term": "Uniones de existencia (SEMI JOIN y ANTI JOIN)",
    "englishTerm": "SEMI JOIN / ANTI JOIN (EXISTS / NOT EXISTS)",
    "track": "core",
    "definition": "Operadores que filtran la tabla izquierda según exista (SEMI JOIN o EXISTS) o no exista (ANTI JOIN o NOT EXISTS) al menos una coincidencia en la tabla derecha. Se confunden con INNER JOIN, pero nunca duplican filas izquierdas ni proyectan columnas derechas.",
    "formula": "SELECT c.segment, COUNT(*) FROM customers c ANTI JOIN experiment_assignments ea ON c.customer_id = ea.customer_id GROUP BY c.segment;",
    "relatedLessons": [
      "c1-sql-joins-01-tipos-join",
      "c1-sql-joins-03-subconsultas"
    ],
    "relatedTerms": [
      "c1-joins-left-join",
      "c1-joins-subconsulta-escalar"
    ],
    "sources": [
      {
        "title": "DuckDB SQL Reference — FROM and JOIN Clause (SEMI and ANTI Joins)",
        "url": "https://duckdb.org/docs/sql/query_syntax/from.html",
        "publisher": "DuckDB Foundation",
        "accessed": "2026-10-29",
        "supports": "Sintaxis y preservación de cardinalidad en SEMI JOIN y ANTI JOIN en DuckDB."
      }
    ]
  },
  {
    "id": "c1-joins-chasm-trap",
    "term": "Trampa de abismo (Chasm Trap)",
    "englishTerm": "Chasm Trap (N:1:M Fan-out)",
    "track": "core",
    "definition": "Multiplicación cartesiana parcial que ocurre al unir una tabla maestra con dos tablas de detalle independientes (N:1:M) en la misma consulta. Si un pedido tiene 3 líneas y 2 devoluciones, genera 6 filas por pedido. Se evita pre-agregando cada detalle en CTEs.",
    "formula": "-- 3 filas en order_items x 2 filas en refunds = 6 filas para el mismo order_id",
    "relatedLessons": [
      "c1-sql-joins-02-grano-fanout",
      "c1-sql-joins-04-ctes-legibles"
    ],
    "relatedTerms": [
      "c01-grain-fanout",
      "c02-cte-preagg"
    ],
    "sources": [
      {
        "title": "The Data Warehouse Toolkit (3rd Edition), Chapter 2: Dimensional Modeling Techniques — Declare the Grain",
        "url": "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/grain/",
        "publisher": "Kimball Group",
        "accessed": "2026-10-29",
        "supports": "Aislamiento de grano entre tablas de hechos de distinta granularidad para impedir productos cartesianos por clave."
      }
    ]
  },
  {
    "id": "c1-joins-subconsulta-escalar",
    "term": "Subconsulta escalar y correlacionada",
    "englishTerm": "Scalar & Correlated Subquery",
    "track": "core",
    "definition": "Una subconsulta escalar devuelve como máximo una fila y una columna para actuar como un valor constante en SELECT, WHERE o HAVING. Se confunde con la subconsulta correlacionada, que referencia columnas de la consulta externa y evalúa una condición por cada fila.",
    "formula": "SELECT product_id, list_price_usd - (SELECT AVG(list_price_usd) FROM products) AS diff_vs_avg FROM products;",
    "relatedLessons": [
      "c1-sql-joins-03-subconsultas",
      "c1-sql-joins-04-ctes-legibles"
    ],
    "relatedTerms": [
      "c1-joins-semi-anti",
      "c1-joins-cte-with"
    ],
    "sources": [
      {
        "title": "DuckDB SQL Reference — Subqueries",
        "url": "https://duckdb.org/docs/sql/expressions/subqueries.html",
        "publisher": "DuckDB Foundation",
        "accessed": "2026-10-29",
        "supports": "Comportamiento de subconsultas escalares, de existencia y descorrelación automática."
      }
    ]
  },
  {
    "id": "c1-joins-cte-with",
    "term": "Expresión de tabla común (CTE / WITH)",
    "englishTerm": "Common Table Expression (WITH Clause)",
    "track": "core",
    "definition": "Conjunto de resultados temporal con nombre definido al inicio de una consulta mediante WITH. Permite dividir una consulta larga en pasos secuenciales legibles y verificables. Se confunde con una tabla temporal en disco, pero existe únicamente durante la ejecución de esa sentencia.",
    "formula": "WITH reembolsos_por_pedido AS (SELECT order_id, SUM(refund_amount_usd) AS total_refund FROM refunds GROUP BY order_id) SELECT * FROM reembolsos_por_pedido;",
    "relatedLessons": [
      "c1-sql-joins-04-ctes-legibles",
      "c1-sql-joins-02-grano-fanout"
    ],
    "relatedTerms": [
      "c02-cte-preagg",
      "c1-joins-subconsulta-escalar"
    ],
    "sources": [
      {
        "title": "DuckDB SQL Reference — Common Table Expressions (WITH Clause)",
        "url": "https://duckdb.org/docs/sql/query_syntax/with.html",
        "publisher": "DuckDB Foundation",
        "accessed": "2026-10-29",
        "supports": "Encadenamiento de múltiples CTEs y control de materialización con MATERIALIZED y NOT MATERIALIZED."
      }
    ]
  },
  {
    "id": "c1-joins-union-all",
    "term": "Operaciones de conjuntos (UNION ALL, INTERSECT, EXCEPT)",
    "englishTerm": "Set Operations (UNION ALL / INTERSECT / EXCEPT)",
    "track": "core",
    "definition": "Operadores que combinan o comparan verticalmente las filas devueltas por dos o más consultas con columnas compatibles. UNION ALL apila todas las filas sin deduplicar; se confunde con UNION, que ejecuta un paso adicional para eliminar filas duplicadas en todo el resultado.",
    "formula": "SELECT customer_id FROM orders WHERE EXTRACT(YEAR FROM order_date) = 2023 INTERSECT SELECT customer_id FROM orders WHERE EXTRACT(YEAR FROM order_date) = 2024;",
    "relatedLessons": [
      "c1-sql-joins-05-conjuntos-union"
    ],
    "relatedTerms": [
      "c1-joins-cte-with",
      "c1-joins-left-join"
    ],
    "sources": [
      {
        "title": "DuckDB SQL Reference — Set Operations (UNION, INTERSECT, EXCEPT)",
        "url": "https://duckdb.org/docs/sql/query_syntax/setops.html",
        "publisher": "DuckDB Foundation",
        "accessed": "2026-10-29",
        "supports": "Diferencia entre UNION ALL y UNION, operadores INTERSECT y EXCEPT, y extensión UNION BY NAME."
      }
    ]
  },
  {
    "id": "codificacion-visual",
    "term": "Codificación visual",
    "englishTerm": "Visual Encoding",
    "track": "core",
    "definition": "Asignación de una variable de datos a un atributo gráfico como posición, longitud, pendiente, área o color para compararla visualmente sin distorsión.",
    "formula": "Posición en escala común > Longitud > Pendiente > Área > Ángulo (Cleveland & McGill, 1984)",
    "example": "Representar el ingreso de cinco categorías con la longitud horizontal de barras alineadas en lugar de ángulos en un círculo.",
    "confusedWith": "Decoración gráfica: añadir iconos, efectos 3D o colores arbitrarios que no representan ninguna columna de la tabla.",
    "relatedLessons": [
      "c1-viz-01-geometria-grafico"
    ],
    "relatedTerms": [
      "jerarquia-perceptual",
      "tinta-proporcional"
    ],
    "sources": [
      {
        "title": "Cleveland & McGill (1984) — Graphical Perception: Theory, Experimentation, and Application to the Development of Graphical Methods",
        "url": "https://www.jstor.org/stable/2288400",
        "publisher": "Journal of the American Statistical Association (JASA)",
        "accessed": "2026-10-29",
        "supports": "Definición formal de codificaciones visuales elementales y medición experimental de su tasa de error."
      }
    ]
  },
  {
    "id": "jerarquia-perceptual",
    "term": "Jerarquía de precisión perceptual",
    "englishTerm": "Graphical Perception Hierarchy",
    "track": "core",
    "definition": "Orden empírico de exactitud con que el ojo humano estima magnitudes: la posición sobre una escala común supera a la longitud, área y ángulo.",
    "formula": "Error perceptual(Posición alineada) < Error(Longitud) < Error(Área) < Error(Ángulo)",
    "example": "Sustituir un gráfico circular de cinco categorías parecidas por barras horizontales ordenadas de mayor a menor ingreso.",
    "confusedWith": "Preferencia estética subjetiva: elegir un gráfico porque luce llamativo aunque impida distinguir diferencias de 2 puntos porcentuales.",
    "relatedLessons": [
      "c1-viz-01-geometria-grafico",
      "bi3-dashboards-01-bi-tufte-code"
    ],
    "relatedTerms": [
      "codificacion-visual",
      "tinta-proporcional"
    ],
    "sources": [
      {
        "title": "Cleveland & McGill (1984) — Graphical Perception: Theory, Experimentation, and Application to the Development of Graphical Methods",
        "url": "https://www.jstor.org/stable/2288400",
        "publisher": "Journal of the American Statistical Association (JASA)",
        "accessed": "2026-10-29",
        "supports": "Experimentos psicofísicos que ordenan los canales visuales según la precisión del juicio humano."
      }
    ]
  },
  {
    "id": "tinta-proporcional",
    "term": "Principio de tinta proporcional",
    "englishTerm": "Principle of Proportional Ink",
    "track": "core",
    "definition": "Regla que exige que el área rellena de una barra o región sombreada sea directamente proporcional al valor numérico representado, partiendo siempre desde cero.",
    "formula": "Factor de distorsión = (Cambio relativo en longitud de barra) / (Cambio relativo en el dato)",
    "example": "Iniciar en 0 USD el eje vertical de un gráfico de barras de ventas para no cuadruplicar visualmente una diferencia del 4 %.",
    "confusedWith": "Exigir cero en todos los gráficos: un gráfico de líneas codifica posición, no área rellena, y puede acotar su eje con contexto explícito.",
    "relatedLessons": [
      "c1-viz-02-ejes-escalas-cero"
    ],
    "relatedTerms": [
      "codificacion-visual",
      "indice-base-100"
    ],
    "sources": [
      {
        "title": "Fundamentals of Data Visualization — Chapter 17: The Principle of Proportional Ink",
        "url": "https://clauswilke.com/dataviz/proportional-ink.html",
        "publisher": "Claus O. Wilke / O'Reilly Media",
        "accessed": "2026-10-29",
        "supports": "Formulación del principio de tinta proporcional y obligatoriedad de incluir el cero en gráficos de barras."
      }
    ]
  },
  {
    "id": "indice-base-100",
    "term": "Índice base 100",
    "englishTerm": "Indexed Series (Base 100)",
    "track": "core",
    "definition": "Transformación que divide cada valor de una serie temporal entre su valor inicial y multiplica por 100 para comparar ritmos relativos en una escala.",
    "formula": "ROUND(100.0 * valor_t / FIRST_VALUE(valor_t) OVER (ORDER BY fecha), 1)",
    "example": "Comparar la evolución trimestral del gasto en dólares y las conversiones en un solo eje donde el primer trimestre vale 100.0.",
    "confusedWith": "Eje doble secundario: superponer dos escalas con unidades distintas en el mismo gráfico produce cruces falsos según cómo se estire cada eje.",
    "relatedLessons": [
      "c1-viz-02-ejes-escalas-cero"
    ],
    "relatedTerms": [
      "tinta-proporcional"
    ],
    "sources": [
      {
        "title": "Dual-Scaled Axes in Graphs: Are They Ever the Best Solution?",
        "url": "https://www.perceptualedge.com/articles/visual_business_intelligence/dual-scaled_axes.pdf",
        "publisher": "Stephen Few / Perceptual Edge",
        "accessed": "2026-10-29",
        "supports": "Sustitución de gráficos con ejes dobles por series indexadas a un punto base común o paneles separados."
      }
    ]
  },
  {
    "id": "paleta-divergente",
    "term": "Paleta de color divergente",
    "englishTerm": "Diverging Color Palette",
    "track": "core",
    "definition": "Escala cromática que parte de un tono neutro en un valor central con significado analítico, como cero variación, hacia dos extremos de color contrastantes.",
    "formula": "Valor < 0 (Extremo A) <- Centro neutro (0 % vs. meta) -> Valor > 0 (Extremo B)",
    "example": "Colorear la desviación porcentual contra la meta usando azul para sobrecumplimiento, gris neutro en rango y naranja para caídas.",
    "confusedWith": "Paleta secuencial o cualitativa: usar dos extremos de color para una variable que solo crece desde cero o para categorías sin orden.",
    "relatedLessons": [
      "c1-viz-03-color-accesibilidad"
    ],
    "relatedTerms": [
      "contraste-no-textual"
    ],
    "sources": [
      {
        "title": "ColorBrewer 2.0: Color Advice for Cartography and Sequential, Diverging, and Qualitative Schemes",
        "url": "https://colorbrewer2.org/",
        "publisher": "Cynthia A. Brewer & The Pennsylvania State University",
        "accessed": "2026-10-29",
        "supports": "Clasificación de escalas cromáticas en secuenciales, divergentes y cualitativas con filtro de daltonismo."
      }
    ]
  },
  {
    "id": "contraste-no-textual",
    "term": "Contraste no textual y redundancia accesible",
    "englishTerm": "Non-text Contrast & Redundant Coding (WCAG 1.4.1 / 1.4.11)",
    "track": "core",
    "definition": "Requisitos de accesibilidad que exigen razón de luminancia mínima de 3:1 en marcas gráficas y prohibición de transmitir estados usando únicamente diferencias de color.",
    "formula": "Razón de contraste WCAG = (L_claro + 0.05) / (L_oscuro + 0.05) >= 3.0",
    "example": "Acompañar una alerta de costo por conversión con etiqueta textual explícita ('ALERTA [!]') además del color para personas con daltonismo.",
    "confusedWith": "Semáforo rojo-verde sin texto: un círculo rojo frente a uno verde resulta indistinguible para lectores con deuteranopía o protanopía.",
    "relatedLessons": [
      "c1-viz-03-color-accesibilidad"
    ],
    "relatedTerms": [
      "paleta-divergente"
    ],
    "sources": [
      {
        "title": "Web Content Accessibility Guidelines (WCAG) 2.2 — Success Criterion 1.4.1 Use of Color & 1.4.11 Non-text Contrast",
        "url": "https://www.w3.org/TR/WCAG22/#non-text-contrast",
        "publisher": "World Wide Web Consortium (W3C)",
        "accessed": "2026-10-29",
        "supports": "Umbral normativo de contraste 3:1 en elementos gráficos y obligación de redundancia no cromática."
      }
    ]
  },
  {
    "id": "cifras-tabulares",
    "term": "Cifras tabulares y alineación numérica",
    "englishTerm": "Tabular Numerals (tabular-nums)",
    "track": "core",
    "definition": "Diseño tipográfico donde cada dígito del 0 al 9 ocupa el mismo ancho horizontal, permitiendo alinear columnas a la derecha por su punto decimal.",
    "formula": "font-variant-numeric: tabular-nums; text-align: right; ROUND(metrica, 2)",
    "example": "Formatear importes en dólares con dos decimales fijos y alineación derecha para distinguir al instante decenas de miles frente a cientos.",
    "confusedWith": "Cifras proporcionales o texto centrado: centrar números con distinta cantidad de dígitos o decimales desalinea las unidades y frena la lectura.",
    "relatedLessons": [
      "c1-viz-04-tablas-numericas"
    ],
    "relatedTerms": [
      "codificacion-visual"
    ],
    "sources": [
      {
        "title": "CSS Fonts Module Level 4 — Section 6.6: Numeric Formatting (font-variant-numeric: tabular-nums)",
        "url": "https://www.w3.org/TR/css-fonts-4/#font-variant-numeric-prop",
        "publisher": "World Wide Web Consortium (W3C)",
        "accessed": "2026-10-29",
        "supports": "Especificación de glifos numéricos de ancho uniforme para alineación vertical en tablas de datos."
      }
    ]
  },
  {
    "id": "grano-dimensional",
    "term": "Grano dimensional (Grain)",
    "track": "core",
    "definition": "Declaración atómica y verificable de qué representa exactamente una fila física dentro de una tabla de hechos. Define el nivel mínimo de detalle antes de elegir dimensiones o medidas, e impide mezclar métricas de cabecera de orden con líneas de producto en una misma agregación.",
    "example": "En Mercado Brisa, el grano de order_items es una línea de producto por orden (order_item_id), mientras que el grano de orders es una orden completa (order_id).",
    "relatedLessons": [
      "c2-dimensional-01-hechos-dimensiones-bus",
      "c2-dimensional-02-star-schema-obt",
      "c2-dimensional-05-hechos-instantanea-acumulativos"
    ],
    "relatedTerms": [
      "dimension-conformada",
      "dimension-degenerada",
      "c06-star-vs-obt"
    ],
    "sources": [
      {
        "title": "Declaring the Grain",
        "url": "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/grain/",
        "publisher": "Kimball Group",
        "accessed": "2026-10-29",
        "supports": "Definición formal del grano de una tabla de hechos en el proceso de diseño dimensional.",
        "type": "primary"
      }
    ]
  },
  {
    "id": "dimension-conformada",
    "term": "Dimensión conformada (Conformed Dimension)",
    "track": "core",
    "definition": "Tabla de dimensión maestra cuyos atributos, claves sustitutas y definiciones semánticas son idénticos o subconjuntos estrictos compartidos entre múltiples tablas de hechos. Permite filtrar, agrupar y combinar métricas de procesos de negocio distintos sin ambigüedad ni reconciliaciones manuales entre departamentos.",
    "example": "Las tablas stores y calendar de Mercado Brisa actúan como dimensiones conformadas compartidas entre las ventas (orders) y las devoluciones (refunds).",
    "relatedLessons": [
      "c2-dimensional-01-hechos-dimensiones-bus",
      "c2-dimensional-02-star-schema-obt"
    ],
    "relatedTerms": [
      "matriz-bus-kimball",
      "drill-across",
      "grano-dimensional"
    ],
    "sources": [
      {
        "title": "Conformed Dimensions",
        "url": "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/conformed-dimension/",
        "publisher": "Kimball Group",
        "accessed": "2026-10-29",
        "supports": "Criterios de conformación de dimensiones maestras compartidas entre procesos de negocio.",
        "type": "primary"
      }
    ]
  },
  {
    "id": "matriz-bus-kimball",
    "term": "Matriz de bus empresarial (Enterprise Bus Matrix)",
    "track": "core",
    "definition": "Plano arquitectónico tabular donde las filas representan los procesos de negocio de la organización y las columnas representan las dimensiones conformadas. Permite planificar la construcción incremental del almacén de datos garantizando que cada nuevo esquema en estrella se integre con los anteriores.",
    "example": "En la matriz de bus de Mercado Brisa, los procesos de pedidos, pagos y reembolsos comparten las columnas de calendario, tienda y cliente.",
    "relatedLessons": [
      "c2-dimensional-01-hechos-dimensiones-bus",
      "c2-dimensional-02-star-schema-obt"
    ],
    "relatedTerms": [
      "dimension-conformada",
      "drill-across",
      "grano-dimensional"
    ],
    "sources": [
      {
        "title": "Enterprise Data Warehouse Bus Matrix",
        "url": "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/enterprise-data-warehouse-bus-matrix/",
        "publisher": "Kimball Group",
        "accessed": "2026-10-29",
        "supports": "Estructura de la matriz de bus empresarial que cruza procesos de negocio y dimensiones conformadas.",
        "type": "primary"
      }
    ]
  },
  {
    "id": "dimension-degenerada",
    "term": "Dimensión degenerada (Degenerate Dimension)",
    "track": "core",
    "definition": "Identificador operativo o número de documento transaccional que reside directamente en la tabla de hechos sin poseer una tabla de dimensión asociada, porque todos sus atributos descriptivos ya fueron extraídos hacia otras dimensiones. Sirve para agrupar líneas de un mismo evento o auditar transacciones.",
    "example": "En una tabla de hechos a grano de línea (order_items), la columna order_id es una dimensión degenerada que permite contar órdenes mediante COUNT(DISTINCT order_id).",
    "relatedLessons": [
      "c2-dimensional-01-hechos-dimensiones-bus",
      "c2-dimensional-02-star-schema-obt"
    ],
    "relatedTerms": [
      "grano-dimensional",
      "c06-star-vs-obt"
    ],
    "sources": [
      {
        "title": "Degenerate Dimensions",
        "url": "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/degenerate-dimension/",
        "publisher": "Kimball Group",
        "accessed": "2026-10-29",
        "supports": "Uso de números de orden o factura como dimensiones degeneradas en tablas de hechos a nivel de línea.",
        "type": "primary"
      }
    ]
  },
  {
    "id": "drill-across",
    "term": "Consulta multipaso (Drill-Across)",
    "track": "core",
    "definition": "Patrón de consulta analítica que combina medidas de dos o más tablas de hechos con distinto grano o proceso de negocio. Agrega cada tabla de hechos por separado en una subconsulta o CTE según los atributos de una dimensión conformada común antes de unirlas.",
    "example": "Para comparar ventas brutas (orders) y reembolsos (refunds) por región en Mercado Brisa, se preagregan ambas tablas por store.region en CTEs separadas y luego se unen.",
    "relatedLessons": [
      "c2-dimensional-01-hechos-dimensiones-bus",
      "c2-dimensional-02-star-schema-obt"
    ],
    "relatedTerms": [
      "dimension-conformada",
      "matriz-bus-kimball"
    ],
    "sources": [
      {
        "title": "Drilling Across Fact Tables",
        "url": "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/drilling-across/",
        "publisher": "Kimball Group",
        "accessed": "2026-10-29",
        "supports": "Patrón de agregación previa por dimensiones conformadas para combinar múltiples tablas de hechos sin fan-out.",
        "type": "primary"
      }
    ]
  },
  {
    "id": "esquema-copo-de-nieve",
    "term": "Esquema en copo de nieve (Snowflake Schema)",
    "track": "core",
    "definition": "Variante del esquema en estrella en la que las tablas de dimensión se normalizan en múltiples tablas secundarias siguiendo jerarquías en tercera forma normal. Aunque reduce la redundancia de atributos jerárquicos, añade uniones encadenadas que complican las consultas frente a dimensiones planas desnormalizadas.",
    "example": "Separar category y subcategory de la tabla products en tablas independientes obligaría a encadenar tres JOINs para consultar las ventas por categoría.",
    "relatedLessons": [
      "c2-dimensional-02-star-schema-obt"
    ],
    "relatedTerms": [
      "c06-star-vs-obt",
      "dimension-conformada"
    ],
    "sources": [
      {
        "title": "Snowflaked Dimensions",
        "url": "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/snowflake-dimension/",
        "publisher": "Kimball Group",
        "accessed": "2026-10-29",
        "supports": "Compromisos entre dimensiones planas en estrella y dimensiones normalizadas en copo de nieve.",
        "type": "primary"
      }
    ]
  },
  {
    "id": "scd-tipo-1-y-3",
    "term": "SCD Tipo 1 y Tipo 3",
    "track": "core",
    "definition": "Estrategias de actualización dimensional sin versionado completo de filas. El Tipo 1 sobrescribe el valor antiguo por el nuevo perdiendo el rastro histórico (reporte As-Is), mientras que el Tipo 3 añade una columna específica para retener únicamente el valor inmediato anterior de un atributo.",
    "example": "La columna current_tier en la tabla customers aplica SCD Tipo 1 porque refleja el nivel actual del cliente y reasigna todas sus compras pasadas a ese nivel.",
    "relatedLessons": [
      "c2-dimensional-03-scd2-history"
    ],
    "relatedTerms": [
      "c07-scd-type-2",
      "c08-point-in-time"
    ],
    "sources": [
      {
        "title": "Type 1: Overwrite",
        "url": "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/type-1/",
        "publisher": "Kimball Group",
        "accessed": "2026-10-29",
        "supports": "Comportamiento de sobrescritura en SCD Tipo 1 y sus efectos sobre el historial de reportes.",
        "type": "primary"
      }
    ]
  },
  {
    "id": "descomposicion-kitagawa",
    "term": "Descomposición de Kitagawa-Oaxaca",
    "track": "core",
    "definition": "Método algebraico que divide la diferencia total entre dos tasas agregadas o promedios globales en dos componentes aditivos: el efecto tasa (cambio real de rendimiento dentro de cada subgrupo) y el efecto mezcla o composición (cambio en la proporción de volumen entre subgrupos).",
    "example": "En Mercado Brisa, la diferencia de $62.19 en el ticket medio entre desktop y mobile se descompone en +$54.81 de efecto tasa y +$7.38 de efecto mezcla por segmento.",
    "relatedLessons": [
      "c2-dimensional-04-metrics-simpson"
    ],
    "relatedTerms": [
      "c10-simpsons-paradox",
      "c11-additivity-hll"
    ],
    "sources": [
      {
        "title": "Simpson's Paradox",
        "url": "https://plato.stanford.edu/entries/paradox-simpson/",
        "publisher": "Stanford Encyclopedia of Philosophy",
        "accessed": "2026-10-29",
        "supports": "Fundamentos estadísticos de la inversión de tendencias por variables de confusión y pesos de mezcla.",
        "type": "primary"
      }
    ]
  },
  {
    "id": "hecho-instantanea-periodica",
    "term": "Tabla de hechos de instantánea periódica (Periodic Snapshot)",
    "track": "core",
    "definition": "Tabla de hechos que registra el estado, saldo o nivel acumulado de una entidad a intervalos regulares y predecibles (diario, mensual o trimestral). Sus medidas de saldo son semiaditivas: se suman entre entidades independientes, pero no a lo largo de la dimensión temporal.",
    "example": "Una instantánea mensual del saldo acumulado de ventas por región en el Q1 2024 debe evaluarse al cierre con ARG_MAX(ytd_balance_usd, month) en lugar de SUM.",
    "relatedLessons": [
      "c2-dimensional-05-hechos-instantanea-acumulativos",
      "c2-dimensional-04-metrics-simpson"
    ],
    "relatedTerms": [
      "hecho-instantanea-acumulativa",
      "c11-additivity-hll",
      "grano-dimensional"
    ],
    "sources": [
      {
        "title": "Periodic Snapshot Fact Tables",
        "url": "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/periodic-snapshot-fact-table/",
        "publisher": "Kimball Group",
        "accessed": "2026-10-29",
        "supports": "Diseño de tablas de hechos de instantánea periódica y tratamiento de medidas semiaditivas.",
        "type": "primary"
      }
    ]
  },
  {
    "id": "hecho-instantanea-acumulativa",
    "term": "Tabla de hechos de instantánea acumulativa (Accumulating Snapshot)",
    "track": "core",
    "definition": "Tabla de hechos donde cada fila representa el ciclo de vida completo de una instancia de proceso con inicio y fin definidos, como un pedido o reclamo. Contiene múltiples claves foráneas de fecha para cada hito y columnas de duración que se actualizan conforme avanza el flujo.",
    "example": "En Mercado Brisa, una fila por order_id que consolida order_ts, captured_ts y first_refund_ts permite medir los minutos hasta la captura del pago y los días hasta el reembolso.",
    "relatedLessons": [
      "c2-dimensional-05-hechos-instantanea-acumulativos"
    ],
    "relatedTerms": [
      "hecho-instantanea-periodica",
      "grano-dimensional"
    ],
    "sources": [
      {
        "title": "Accumulating Snapshot Fact Tables",
        "url": "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/accumulating-snapshot-fact-table/",
        "publisher": "Kimball Group",
        "accessed": "2026-10-29",
        "supports": "Modelado de flujos de trabajo mediante múltiples fechas de hito y métricas de duración en una fila por instancia.",
        "type": "primary"
      }
    ]
  },
  {
    "id": "c2-sql-qualify",
    "term": "Cláusula QUALIFY",
    "englishTerm": "QUALIFY Clause",
    "track": "core",
    "definition": "Cláusula que filtra directamente el resultado de funciones de ventana en la misma consulta. Se confunde con HAVING, que solo filtra agregaciones de GROUP BY.",
    "formula": "SELECT order_id, payment_id, amount_usd FROM payments WHERE status = 'captured' QUALIFY ROW_NUMBER() OVER (PARTITION BY idempotency_key ORDER BY payment_ts DESC) = 1;",
    "relatedLessons": [
      "c2-sql-analitico-01-window-functions",
      "l2-window-functions"
    ],
    "relatedTerms": [
      "c03-window-qualify",
      "c2-sql-marco-ventana"
    ],
    "sources": [
      {
        "title": "DuckDB SQL Reference — QUALIFY Clause",
        "url": "https://duckdb.org/docs/sql/query_syntax/qualify.html",
        "publisher": "DuckDB Foundation",
        "accessed": "2026-10-29",
        "supports": "Evaluación de la cláusula QUALIFY después del cálculo de funciones de ventana sin requerir una CTE o subconsulta envolvente."
      }
    ]
  },
  {
    "id": "c2-sql-marco-ventana",
    "term": "Marco de ventana (ROWS frente a RANGE)",
    "englishTerm": "Window Frame (ROWS vs. RANGE)",
    "track": "core",
    "definition": "Subconjunto deslizante de filas dentro de una partición. ROWS cuenta filas físicas adyacentes; se confunde con RANGE, que agrupa valores dentro de un intervalo lógico.",
    "formula": "AVG(ventas_usd) OVER (PARTITION BY store_id ORDER BY order_date RANGE BETWEEN INTERVAL 6 DAYS PRECEDING AND CURRENT ROW)",
    "relatedLessons": [
      "c2-sql-analitico-01-window-functions",
      "c2-sql-analitico-03-zonas-horarias-date-spine"
    ],
    "relatedTerms": [
      "c05-window-frames",
      "c2-sql-date-spine"
    ],
    "sources": [
      {
        "title": "PostgreSQL 17 Documentation — Section 4.2.8: Window Function Calls (Frame Clause)",
        "url": "https://www.postgresql.org/docs/current/sql-expressions.html#SYNTAX-WINDOW-FUNCTIONS",
        "publisher": "PostgreSQL Global Development Group",
        "accessed": "2026-10-29",
        "supports": "Diferencia semántica entre marcos ROWS, RANGE y GROUPS y comportamiento por defecto RANGE UNBOUNDED PRECEDING al incluir ORDER BY."
      }
    ]
  },
  {
    "id": "c2-sql-asof-join",
    "term": "Unión temporal ASOF JOIN",
    "englishTerm": "ASOF JOIN (Point-in-Time Join)",
    "track": "core",
    "definition": "Unión que empareja cada evento con la única fila previa más cercana en el tiempo. Se confunde con un JOIN desigual, que multiplica las filas.",
    "formula": "FROM orders o ASOF LEFT JOIN events e ON o.customer_id = e.customer_id AND o.order_ts >= e.event_ts",
    "relatedLessons": [
      "c2-sql-analitico-02-asof-lateral-ctes",
      "l3-asof-lateral-ctes"
    ],
    "relatedTerms": [
      "c04-asof-join",
      "c08-point-in-time",
      "c2-sql-lateral-join"
    ],
    "sources": [
      {
        "title": "DuckDB SQL Reference — ASOF Join",
        "url": "https://duckdb.org/docs/sql/query_syntax/from.html#asof-join",
        "publisher": "DuckDB Foundation",
        "accessed": "2026-10-29",
        "supports": "Emparejamiento punto en el tiempo con preservación de cardinalidad 1:1 sobre la tabla izquierda."
      }
    ]
  },
  {
    "id": "c2-sql-lateral-join",
    "term": "Subconsulta correlacionada LATERAL",
    "englishTerm": "LATERAL JOIN",
    "track": "core",
    "definition": "Unión que evalúa una subconsulta por cada fila izquierda pudiendo devolver N filas ordenadas. Se confunde con una subconsulta escalar, limitada a un único valor.",
    "formula": "FROM orders o LEFT JOIN LATERAL (SELECT tier, valid_from FROM customer_changes c WHERE c.customer_id = o.customer_id AND c.valid_from <= o.order_ts ORDER BY c.valid_from DESC LIMIT 1) cc ON TRUE",
    "relatedLessons": [
      "c2-sql-analitico-02-asof-lateral-ctes",
      "c1-sql-joins-03-subconsultas"
    ],
    "relatedTerms": [
      "c2-sql-asof-join",
      "c04-asof-join"
    ],
    "sources": [
      {
        "title": "PostgreSQL 17 Documentation — Section 7.2.1.5: LATERAL Subqueries",
        "url": "https://www.postgresql.org/docs/current/queries-table-expressions.html#QUERIES-LATERAL",
        "publisher": "PostgreSQL Global Development Group",
        "accessed": "2026-10-29",
        "supports": "Referencia a columnas de tablas previas del FROM y uso con ORDER BY ... LIMIT N por entidad."
      }
    ]
  },
  {
    "id": "c2-sql-date-spine",
    "term": "Espina de calendario (Date Spine)",
    "englishTerm": "Date Spine / Time Spine",
    "track": "core",
    "definition": "Tabla continua de fechas sin huecos usada como base izquierda para rellenar días con cero ventas. Se confunde con agrupar directamente la tabla de hechos.",
    "formula": "SELECT c.calendar_date, COALESCE(v.ventas_usd, 0) AS ventas_usd FROM calendar c LEFT JOIN ventas_diarias v ON c.calendar_date = v.order_date;",
    "relatedLessons": [
      "c2-sql-analitico-03-zonas-horarias-date-spine",
      "c2-sql-analitico-01-window-functions"
    ],
    "relatedTerms": [
      "c2-sql-marco-ventana",
      "c1-joins-left-join"
    ],
    "sources": [
      {
        "title": "dbt Semantic Layer (MetricFlow) Documentation — Time Spine",
        "url": "https://docs.getdbt.com/docs/build/metricflow-time-spine",
        "publisher": "dbt Labs",
        "accessed": "2026-10-29",
        "supports": "Uso de una tabla continua de fechas para materializar períodos sin actividad y calcular métricas acumulativas o medias móviles sin sesgo."
      }
    ]
  },
  {
    "id": "c2-sql-explain-analyze",
    "term": "Plan físico con EXPLAIN ANALYZE",
    "englishTerm": "EXPLAIN ANALYZE Execution Plan",
    "track": "core",
    "definition": "Instrucción que ejecuta la consulta y mide tiempos y filas reales de cada operador físico. Se confunde con EXPLAIN, que solo muestra estimaciones sin ejecutar.",
    "formula": "EXPLAIN ANALYZE SELECT store_id, SUM(total_usd) FROM orders WHERE status = 'completed' GROUP BY store_id;",
    "relatedLessons": [
      "c2-sql-analitico-04-explain-analyze"
    ],
    "relatedTerms": [
      "c2-sql-qualify",
      "c12-parquet-columnar"
    ],
    "sources": [
      {
        "title": "DuckDB Documentation — Profiling and EXPLAIN ANALYZE",
        "url": "https://duckdb.org/docs/guides/meta/explain.html",
        "publisher": "DuckDB Foundation",
        "accessed": "2026-10-29",
        "supports": "Diferencia entre el plan estimado de EXPLAIN y la medición en tiempo de ejecución de EXPLAIN ANALYZE por operador."
      }
    ]
  },
  {
    "id": "pesca-correlaciones",
    "term": "Pesca de correlaciones (Data Dredging)",
    "englishTerm": "Data Dredging / P-Hacking / Texas Sharpshooter Fallacy",
    "track": "da",
    "definition": "Error metodológico que consiste en cruzar decenas de columnas y segmentos sin hipótesis previa hasta hallar una diferencia llamativa por puro azar muestral y presentarla como hallazgo confirmado. Si una relación nace al explorar, debe registrarse como conjetura pendiente de validación en datos nuevos.",
    "formula": "Probabilidad de al menos 1 falso positivo en k=20 cruces independientes al 5%: 1 - (0.95)^20 = 64.15%",
    "relatedLessons": [
      "da2-eda-01-hipotesis-preguntas-refutables"
    ],
    "relatedTerms": [
      "hipotesis-refutable",
      "c10-simpsons-paradox"
    ],
    "sources": [
      {
        "title": "NIST/SEMATECH e-Handbook of Statistical Methods — Section 1.1.1: What is Exploratory Data Analysis?",
        "url": "https://www.itl.nist.gov/div898/handbook/eda/section1/eda11.htm",
        "publisher": "National Institute of Standards and Technology (NIST)",
        "accessed": "2026-10-29",
        "supports": "Separación entre el descubrimiento exploratorio de patrones y la inferencia confirmatoria para evitar falsos positivos."
      }
    ]
  },
  {
    "id": "perfilado-datos",
    "term": "Perfilado sistemático de tablas (Data Profiling)",
    "englishTerm": "Systematic Data Profiling",
    "track": "da",
    "definition": "Inspección estadística de una tabla desconocida en una sola lectura para cuantificar conteo de filas, razón de cardinalidad, porcentaje de completitud, dominios categóricos, cuantiles y asimetría antes de construir gráficos o modelos. En DuckDB se ejecuta con `SUMMARIZE` o agregaciones condicionales con `FILTER`.",
    "formula": "SUMMARIZE orders;",
    "relatedLessons": [
      "da2-eda-02-perfilado-tablas"
    ],
    "relatedTerms": [
      "cardinalidad-relativa",
      "nulo-estructural"
    ],
    "sources": [
      {
        "title": "DuckDB Documentation — SUMMARIZE Statement",
        "url": "https://duckdb.org/docs/guides/meta/summarize.html",
        "publisher": "DuckDB Foundation",
        "accessed": "2026-10-29",
        "supports": "Cálculo de estadísticas descriptivas, cardinalidad aproximada y porcentaje de nulos para todas las columnas de una tabla."
      }
    ]
  },
  {
    "id": "cardinalidad-relativa",
    "term": "Cardinalidad y razón de unicidad de columna",
    "englishTerm": "Column Cardinality & Uniqueness Ratio",
    "track": "da",
    "definition": "La cardinalidad de una columna es su número de valores distintos (`COUNT(DISTINCT col)`), y la razón de unicidad la divide entre el total de filas (`COUNT(*)`). Una razón igual a 1.0 identifica una clave candidata; una razón muy baja identifica un dominio categórico discreto.",
    "formula": "SELECT COUNT(DISTINCT event_id) * 1.0 / COUNT(*) AS razon_unicidad FROM events;",
    "relatedLessons": [
      "da2-eda-02-perfilado-tablas"
    ],
    "relatedTerms": [
      "perfilado-datos",
      "clave-primaria-subrogada"
    ],
    "sources": [
      {
        "title": "DuckDB Documentation — Aggregate Functions (COUNT DISTINCT)",
        "url": "https://duckdb.org/docs/sql/functions/aggregates.html",
        "publisher": "DuckDB Foundation",
        "accessed": "2026-10-29",
        "supports": "Evaluación de cardinalidad exacta y aproximada sobre columnas de tablas analíticas."
      }
    ]
  },
  {
    "id": "nulo-estructural",
    "term": "Nulo estructural frente a nulo por fallo de captura",
    "englishTerm": "Structural Missingness vs. Data Capture Missingness",
    "track": "da",
    "definition": "Un nulo estructural ocurre cuando un atributo no aplica por la naturaleza del evento, como `product_id IS NULL` en las 9 400 filas de `page_view` de `events`. No se confunde con un nulo por fallo de captura, como los 218 clientes sin `postal_code` en `customers`.",
    "formula": "SELECT event_type, COUNT(*) FILTER (WHERE product_id IS NULL) AS nulos_producto FROM events GROUP BY event_type;",
    "relatedLessons": [
      "da2-eda-02-perfilado-tablas"
    ],
    "relatedTerms": [
      "perfilado-datos",
      "idempotencia-duplicados"
    ],
    "sources": [
      {
        "title": "Polars User Guide — Missing Data",
        "url": "https://docs.pola.rs/user-guide/expressions/missing-data/",
        "publisher": "Polars Project",
        "accessed": "2026-10-29",
        "supports": "Representación mediante mapas de validez y análisis contextual de valores ausentes antes de imputar o descartar filas."
      }
    ]
  },
  {
    "id": "puntaje-z-modificado-mad",
    "term": "Desviación absoluta mediana (MAD) y puntaje Z modificado",
    "englishTerm": "Median Absolute Deviation (MAD) & Modified Z-Score",
    "track": "da",
    "definition": "La MAD es la mediana de las distancias absolutas respecto a la mediana de la columna (`MAD(x)` en DuckDB). El puntaje Z modificado de Iglewicz y Hoaglin (`0.6745 * ABS(x - mediana) / MAD`) detecta valores atípicos sin hincharse por los propios extremos como ocurre con la desviación estándar.",
    "formula": "SELECT ROUND(0.6745 * ABS(list_price_usd - MEDIAN(list_price_usd) OVER ()) / MAD(list_price_usd) OVER (), 2) FROM products;",
    "relatedLessons": [
      "da2-eda-03-outliers-errores-extremos"
    ],
    "relatedTerms": [
      "rango-intercuartilico",
      "winsorizacion"
    ],
    "sources": [
      {
        "title": "NIST/SEMATECH e-Handbook of Statistical Methods — Section 1.3.5.17: Detection of Outliers",
        "url": "https://www.itl.nist.gov/div898/handbook/eda/section3/eda35h.htm",
        "publisher": "National Institute of Standards and Technology (NIST)",
        "accessed": "2026-10-29",
        "supports": "Fórmula del puntaje Z modificado basado en la mediana y la MAD con factor de consistencia normal 0.6745."
      }
    ]
  },
  {
    "id": "winsorizacion",
    "term": "Winsorización (acotación por percentiles) frente a recorte",
    "englishTerm": "Winsorization vs. Trimming",
    "track": "da",
    "definition": "Técnica que limita el peso de los valores extremos sustituyendo todo dato que supere un percentil umbral (como `p99`) por el valor exacto de ese percentil (`LEAST(x, p99)`), conservando la fila en la muestra. Se diferencia del recorte (*trimming*), que elimina la fila completa.",
    "formula": "SELECT ROUND(AVG(LEAST(total_usd, 1343.24)), 2) AS media_winsorizada_p99 FROM orders WHERE status = 'completed';",
    "relatedLessons": [
      "da2-eda-03-outliers-errores-extremos"
    ],
    "relatedTerms": [
      "puntaje-z-modificado-mad",
      "percentil"
    ],
    "sources": [
      {
        "title": "NIST/SEMATECH e-Handbook of Statistical Methods — Section 1.3.5.6: Measures of Scale",
        "url": "https://www.itl.nist.gov/div898/handbook/eda/section3/eda356.htm",
        "publisher": "National Institute of Standards and Technology (NIST)",
        "accessed": "2026-10-29",
        "supports": "Uso de estimadores resistentes para resumir distribuciones con colas largas sin distorsión por valores extremos."
      }
    ]
  },
  {
    "id": "tabla-atricion-descartes",
    "term": "Tabla de atrición y diario de análisis reproducible",
    "englishTerm": "Attrition Table & Reproducible Analysis Log",
    "track": "da",
    "definition": "Registro secuencial en SQL (mediante CTEs encadenadas y `UNION ALL`) que documenta cuántas filas, entidades e importe monetario permanecen y cuántos se descartan tras cada filtro aplicado sobre los datos crudos. Impide que exclusiones silenciosas sesguen la muestra o impidan reproducir un estudio.",
    "formula": "SELECT 1 AS paso, '0_crudo' AS etapa, COUNT(*) AS filas FROM paso_0 UNION ALL SELECT 2, '1_limpio', COUNT(*) FROM paso_1;",
    "relatedLessons": [
      "da2-eda-04-diario-analisis-reproducible"
    ],
    "relatedTerms": [
      "perfilado-datos",
      "validacion-bloqueante-wap"
    ],
    "sources": [
      {
        "title": "DuckDB Documentation — Common Table Expressions (WITH Clause)",
        "url": "https://duckdb.org/docs/sql/query_syntax/with.html",
        "publisher": "DuckDB Foundation",
        "accessed": "2026-10-29",
        "supports": "Estructuración modular de consultas en pasos secuenciales auditables mediante expresiones de tabla común."
      }
    ]
  },
  {
    "id": "probabilidad-condicional",
    "term": "Probabilidad condicional",
    "englishTerm": "Conditional Probability",
    "track": "da",
    "definition": "Probabilidad de que ocurra un evento A sabiendo que otro evento B ya sucedió. Restringe el espacio muestral únicamente a los casos donde B se cumple y evita confundir el riesgo dentro de un segmento con su peso sobre el total de incidentes.",
    "formula": "P(A | B) = P(A ∩ B) / P(B), con P(B) > 0",
    "relatedLessons": [
      "da2-inferencia-01-probabilidad-bayes",
      "da2-inferencia-02-distribuciones-probabilidad"
    ],
    "relatedTerms": [
      "teorema-de-bayes",
      "punto-porcentual"
    ],
    "sources": [
      {
        "title": "NIST/SEMATECH e-Handbook — Basic Probability and Conditional Rules (mpc3521)",
        "url": "https://www.itl.nist.gov/div898/handbook/mpc/section3/mpc3521.htm",
        "publisher": "National Institute of Standards and Technology (NIST)",
        "accessed": "2026-10-29",
        "supports": "Reglas axiomáticas de probabilidad condicional, conjunta y marginal."
      }
    ]
  },
  {
    "id": "teorema-de-bayes",
    "term": "Teorema de Bayes",
    "englishTerm": "Bayes' Theorem",
    "track": "da",
    "definition": "Regla matemática que actualiza la probabilidad previa (tasa base) de una hipótesis A tras observar nueva evidencia B. Combina la verosimilitud de la señal con la frecuencia previa del evento para calcular el valor predictivo positivo real de una alerta.",
    "formula": "P(A | B) = [P(B | A) · P(A)] / [P(B | A)·P(A) + P(B | ¬A)·P(¬A)]",
    "relatedLessons": [
      "da2-inferencia-01-probabilidad-bayes",
      "da2-inferencia-06-errores-potencia-tamano-muestra"
    ],
    "relatedTerms": [
      "probabilidad-condicional",
      "potencia-estadistica"
    ],
    "sources": [
      {
        "title": "Stanford Encyclopedia of Philosophy — Bayes' Theorem",
        "url": "https://plato.stanford.edu/entries/bayes-theorem/",
        "publisher": "Stanford University",
        "accessed": "2026-10-29",
        "supports": "Formulación del teorema de Bayes, tasa base previa y actualización posterior."
      }
    ]
  },
  {
    "id": "distribucion-poisson",
    "term": "Distribución de Poisson",
    "englishTerm": "Poisson Distribution",
    "track": "da",
    "definition": "Distribución de probabilidad discreta que modela el número de eventos independientes que ocurren en un intervalo fijo de tiempo, espacio o volumen de operaciones a una tasa media constante lambda, como devoluciones por día o caídas de pasarela por hora.",
    "formula": "P(X = k) = (λ^k · e^(-λ)) / k!, donde E[X] = Var(X) = λ",
    "relatedLessons": [
      "da2-inferencia-02-distribuciones-probabilidad",
      "da2-inferencia-03-muestreo-tlc-error-estandar"
    ],
    "relatedTerms": [
      "distribucion-log-normal",
      "probabilidad-condicional"
    ],
    "sources": [
      {
        "title": "NIST/SEMATECH e-Handbook — Poisson Distribution (eda366j)",
        "url": "https://www.itl.nist.gov/div898/handbook/eda/section3/eda366j.htm",
        "publisher": "National Institute of Standards and Technology (NIST)",
        "accessed": "2026-10-29",
        "supports": "Función de masa de probabilidad e igualdad entre media y varianza en procesos de Poisson."
      }
    ]
  },
  {
    "id": "distribucion-log-normal",
    "term": "Distribución log-normal",
    "englishTerm": "Log-normal Distribution",
    "track": "da",
    "definition": "Distribución continua de valores estrictamente positivos cuyo logaritmo natural sigue una distribución normal. Modela variables comerciales con cola derecha pronunciada, como el ticket de compra o el gasto acumulado por cliente, evitando proyectar cotas inferiores negativas imposibles.",
    "formula": "Y = ln(X) ~ Normal(μ_ln, σ_ln²); Mediana(X) = exp(μ_ln)",
    "relatedLessons": [
      "da2-inferencia-02-distribuciones-probabilidad",
      "da2-inferencia-03-muestreo-tlc-error-estandar"
    ],
    "relatedTerms": [
      "distribucion-poisson",
      "teorema-limite-central"
    ],
    "sources": [
      {
        "title": "NIST/SEMATECH e-Handbook — Lognormal Distribution (eda3669)",
        "url": "https://www.itl.nist.gov/div898/handbook/eda/section3/eda3669.htm",
        "publisher": "National Institute of Standards and Technology (NIST)",
        "accessed": "2026-10-29",
        "supports": "Parametrización logarítmica, media geométrica y modelado de colas derechas positivas."
      }
    ]
  },
  {
    "id": "teorema-limite-central",
    "term": "Teorema del límite central",
    "englishTerm": "Central Limit Theorem (CLT)",
    "track": "da",
    "definition": "Principio estadístico que establece que la distribución muestral del promedio de variables independientes con varianza finita converge hacia una distribución normal al crecer el tamaño de muestra, aun cuando los datos individuales originales presenten fuerte asimetría positiva.",
    "formula": "X̄_n ~ Normal(μ, σ² / n) cuando n es suficientemente grande",
    "relatedLessons": [
      "da2-inferencia-03-muestreo-tlc-error-estandar",
      "da2-inferencia-04-intervalos-confianza"
    ],
    "relatedTerms": [
      "error-estandar",
      "intervalo-de-confianza"
    ],
    "sources": [
      {
        "title": "NIST/SEMATECH e-Handbook — Central Limit Theorem (prc14)",
        "url": "https://www.itl.nist.gov/div898/handbook/prc/section1/prc14.htm",
        "publisher": "National Institute of Standards and Technology (NIST)",
        "accessed": "2026-10-29",
        "supports": "Convergencia asintótica de la media muestral hacia la distribución normal."
      }
    ]
  },
  {
    "id": "error-estandar",
    "term": "Error estándar",
    "englishTerm": "Standard Error (SE)",
    "track": "da",
    "definition": "Desviación estándar de la distribución muestral de un estadístico como la media o la proporción. Mide cuánto fluctuaría el promedio estimado entre muestras repetidas de tamaño n y disminuye en proporción a la raíz cuadrada del tamaño muestral.",
    "formula": "EE(X̄) = s / √n",
    "relatedLessons": [
      "da2-inferencia-03-muestreo-tlc-error-estandar",
      "da2-inferencia-04-intervalos-confianza",
      "da2-inferencia-05-pruebas-hipotesis-valor-p"
    ],
    "relatedTerms": [
      "teorema-limite-central",
      "margen-de-error"
    ],
    "sources": [
      {
        "title": "NIST/SEMATECH e-Handbook — Confidence Limits for the Mean (eda352)",
        "url": "https://www.itl.nist.gov/div898/handbook/eda/section3/eda352.htm",
        "publisher": "National Institute of Standards and Technology (NIST)",
        "accessed": "2026-10-29",
        "supports": "Definición y cálculo del error estándar de la media muestral."
      }
    ]
  },
  {
    "id": "intervalo-de-confianza",
    "term": "Intervalo de confianza",
    "englishTerm": "Confidence Interval (CI)",
    "track": "da",
    "definition": "Rango de valores construido a partir de una muestra mediante un procedimiento que, al repetirse sobre múltiples muestras independientes, captura el verdadero parámetro poblacional desconocido en una proporción fija de ocasiones igual al nivel de confianza elegido.",
    "formula": "IC_(1-α) = [x̄ - z_(1-α/2) · (s / √n), x̄ + z_(1-α/2) · (s / √n)]",
    "relatedLessons": [
      "da2-inferencia-04-intervalos-confianza",
      "da2-inferencia-05-pruebas-hipotesis-valor-p"
    ],
    "relatedTerms": [
      "margen-de-error",
      "error-estandar"
    ],
    "sources": [
      {
        "title": "Greenland et al. (2016) — Statistical tests, P values, confidence intervals, and power",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC5187603/",
        "publisher": "European Journal of Epidemiology (Springer / PMC)",
        "accessed": "2026-10-29",
        "supports": "Interpretación frecuentista rigurosa de intervalos de confianza y prevención de falacias."
      }
    ]
  },
  {
    "id": "margen-de-error",
    "term": "Margen de error",
    "englishTerm": "Margin of Error (MoE)",
    "track": "da",
    "definition": "Semiamplitud de un intervalo de confianza simétrico alrededor de la estimación puntual. Resulta de multiplicar el valor crítico asociado al nivel de confianza deseado por el error estándar del estimador y expresa la precisión de la métrica en sus propias unidades.",
    "formula": "ME = z_(1-α/2) · EE = 1.96 · (s / √n) para 95 % de confianza",
    "relatedLessons": [
      "da2-inferencia-04-intervalos-confianza",
      "da2-inferencia-06-errores-potencia-tamano-muestra"
    ],
    "relatedTerms": [
      "intervalo-de-confianza",
      "error-estandar"
    ],
    "sources": [
      {
        "title": "NIST/SEMATECH e-Handbook — Confidence Limits for the Mean (eda352)",
        "url": "https://www.itl.nist.gov/div898/handbook/eda/section3/eda352.htm",
        "publisher": "National Institute of Standards and Technology (NIST)",
        "accessed": "2026-10-29",
        "supports": "Construcción del margen de error a partir del cuantil crítico y el error estándar."
      }
    ]
  },
  {
    "id": "valor-p",
    "term": "Valor p",
    "englishTerm": "p-value",
    "track": "da",
    "definition": "Probabilidad, calculada bajo el supuesto de que la hipótesis nula y todos los supuestos del modelo son ciertos, de obtener un estadístico de prueba igual o más extremo que el observado. No representa la probabilidad de que la hipótesis nula sea verdadera.",
    "formula": "p = P(|T| ≥ |t_obs| | H_0 es verdadera)",
    "relatedLessons": [
      "da2-inferencia-05-pruebas-hipotesis-valor-p",
      "da2-inferencia-06-errores-potencia-tamano-muestra"
    ],
    "relatedTerms": [
      "tamano-del-efecto-cohen",
      "potencia-estadistica"
    ],
    "sources": [
      {
        "title": "Wasserstein & Lazar (2016) — The ASA Statement on p-Values",
        "url": "https://www.amstat.org/asa/files/pdfs/P-ValueStatement.pdf",
        "publisher": "American Statistical Association (ASA)",
        "accessed": "2026-10-29",
        "supports": "Definición oficial del valor p y seis principios contra malinterpretaciones."
      }
    ]
  },
  {
    "id": "tamano-del-efecto-cohen",
    "term": "Tamaño del efecto (d de Cohen)",
    "englishTerm": "Effect Size (Cohen's d)",
    "track": "da",
    "definition": "Medida adimensional de la magnitud práctica de la diferencia entre dos grupos, expresada en unidades de desviación estándar combinada. Permite distinguir si un resultado estadísticamente significativo en muestras masivas tiene relevancia sustantiva o es apenas una fluctuación trivial.",
    "formula": "d = (x̄_1 - x̄_2) / √[(s_1² + s_2²) / 2]",
    "relatedLessons": [
      "da2-inferencia-05-pruebas-hipotesis-valor-p",
      "da2-inferencia-06-errores-potencia-tamano-muestra"
    ],
    "relatedTerms": [
      "valor-p",
      "efecto-minimo-detectable"
    ],
    "sources": [
      {
        "title": "NIST/SEMATECH e-Handbook — Two-Sample t-Test for Equal and Unequal Variances (prc31)",
        "url": "https://www.itl.nist.gov/div898/handbook/prc/section3/prc31.htm",
        "publisher": "National Institute of Standards and Technology (NIST)",
        "accessed": "2026-10-29",
        "supports": "Contraste de dos medias independientes y estandarización por desviación combinada."
      }
    ]
  },
  {
    "id": "potencia-estadistica",
    "term": "Potencia estadística",
    "englishTerm": "Statistical Power",
    "track": "da",
    "definition": "Probabilidad de que una prueba de hipótesis rechace correctamente la hipótesis nula cuando en la población existe un efecto real de magnitud específica. Equivale al complemento de la tasa de error Tipo II y suele fijarse como mínimo en 80 por ciento.",
    "formula": "Potencia = 1 - β = P(rechazar H_0 | H_1 es verdadera con efecto Δ)",
    "relatedLessons": [
      "da2-inferencia-06-errores-potencia-tamano-muestra",
      "da2-inferencia-05-pruebas-hipotesis-valor-p"
    ],
    "relatedTerms": [
      "efecto-minimo-detectable",
      "valor-p"
    ],
    "sources": [
      {
        "title": "NIST/SEMATECH e-Handbook — Sample Sizes Required (prc22)",
        "url": "https://www.itl.nist.gov/div898/handbook/prc/section2/prc22.htm",
        "publisher": "National Institute of Standards and Technology (NIST)",
        "accessed": "2026-10-29",
        "supports": "Relación entre error Tipo I, error Tipo II, potencia estadística y tamaño de muestra."
      }
    ]
  },
  {
    "id": "efecto-minimo-detectable",
    "term": "Efecto mínimo detectable (MDE)",
    "englishTerm": "Minimum Detectable Effect (MDE)",
    "track": "da",
    "definition": "Diferencia más pequeña entre tratamiento y control que un diseño experimental puede detectar de forma confiable dado su tamaño de muestra, varianza histórica, nivel de significancia alfa y potencia objetivo. Define el umbral de sensibilidad antes de iniciar la captura de datos.",
    "formula": "MDE (Δ) = (z_(1-α/2) + z_(1-β)) · σ · √(2 / n)",
    "relatedLessons": [
      "da2-inferencia-06-errores-potencia-tamano-muestra",
      "da2-inferencia-05-pruebas-hipotesis-valor-p"
    ],
    "relatedTerms": [
      "potencia-estadistica",
      "tamano-del-efecto-cohen"
    ],
    "sources": [
      {
        "title": "Statsmodels Documentation — TTestIndPower",
        "url": "https://www.statsmodels.org/stable/generated/statsmodels.stats.power.TTestIndPower.html",
        "publisher": "Statsmodels Developers",
        "accessed": "2026-10-29",
        "supports": "Cálculo del tamaño de muestra y del efecto mínimo detectable en pruebas t de dos muestras."
      }
    ]
  },
  {
    "id": "metrica-guardrail",
    "term": "Métrica de protección (Guardrail)",
    "englishTerm": "Guardrail Metric",
    "track": "da",
    "definition": "Indicador operativo o de negocio que no se busca optimizar directamente en el experimento, pero que no debe degradarse más allá de un umbral tolerable. Protege contra efectos colaterales como incrementos en reembolsos, latencia del servidor o cancelaciones de suscripción al desplegar una variante ganadora en la métrica primaria.",
    "formula": "\\Delta G = \\bar{G}_T - \\bar{G}_C \\ge -\\delta_{\\max}",
    "sqlExample": "SELECT variant, AVG(CASE WHEN r.refund_id IS NOT NULL THEN 1.0 ELSE 0.0 END) AS tasa_reembolso FROM orders o LEFT JOIN refunds r USING (order_id) GROUP BY 1;",
    "relatedLessons": [
      "da3-experimentos-01-ab-testing-cuped"
    ],
    "relatedTerms": [
      "c23-srm-ab-testing",
      "c24-cuped-variance"
    ],
    "sources": [
      {
        "title": "Trustworthy Online Controlled Experiments (Capítulos 2 y 7: Guardrail Metrics)",
        "url": "https://experimentguide.com/",
        "publisher": "Cambridge University Press",
        "accessed": "2026-10-29",
        "supports": "Definición y taxonomía de métricas de protección operativas y de negocio."
      }
    ]
  },
  {
    "id": "reduccion-varianza-preexperimento",
    "term": "Reducción de varianza con covariable basal",
    "englishTerm": "Pre-experiment Covariate Variance Reduction",
    "track": "da",
    "definition": "Técnica estadística que incorpora una variable medida estrictamente antes de la asignación aleatoria para sustraer la heterogeneidad histórica entre usuarios. Como la covariable basal es independiente del tratamiento, el ajuste preserva la insesgadez del estimador causal y disminuye la varianza residual en proporción directa al cuadrado de la correlación lineal.",
    "formula": "\\text{Var}(\\hat{\\Delta}_{\\text{adj}}) = \\text{Var}(\\hat{\\Delta})(1 - r_{XY}^2)",
    "sqlExample": "SELECT CORR(post_experiment_spend_usd, pre_experiment_spend_usd) AS r_xy FROM experiment_assignments WHERE experiment_id = 1;",
    "relatedLessons": [
      "da3-experimentos-01-ab-testing-cuped"
    ],
    "relatedTerms": [
      "c24-cuped-variance",
      "error-estandar"
    ],
    "sources": [
      {
        "title": "Improving the Sensitivity of Online Controlled Experiments by Utilizing Pre-Experiment Data (WSDM 2013)",
        "url": "https://exp-platform.com/Documents/2013-02-CUPED-ImprovingSensitivityOfControlledExperiments.pdf",
        "publisher": "Microsoft Research / ACM WSDM",
        "accessed": "2026-10-29",
        "supports": "Demostración de insesgadez y factor de reducción de varianza mediante covariables pre-experimento."
      }
    ]
  },
  {
    "id": "tasa-error-familiar-fwer",
    "term": "Tasa de error por familia (FWER)",
    "englishTerm": "Family-Wise Error Rate",
    "track": "da",
    "definition": "Probabilidad de cometer al menos un falso positivo (error Tipo I) dentro de una colección simultánea de m pruebas de hipótesis. Cuando se evalúan múltiples métricas o cohortes sin ajuste al nivel nominal alfa, el riesgo acumulado crece exponencialmente hacia uno a medida que aumenta el número de comparaciones.",
    "formula": "\\text{FWER} = \\Pr(V \\ge 1) = 1 - (1 - \\alpha)^m",
    "sqlExample": "SELECT 15 AS m_pruebas, ROUND(1.0 - POWER(1.0 - 0.05, 15), 4) AS fwer_sin_ajuste;",
    "relatedLessons": [
      "da3-experimentos-02-comparaciones-multiples-bh"
    ],
    "relatedTerms": [
      "procedimiento-benjamini-hochberg"
    ],
    "sources": [
      {
        "title": "statsmodels.stats.multitest.multipletests Reference",
        "url": "https://www.statsmodels.org/stable/generated/statsmodels.stats.multitest.multipletests.html",
        "publisher": "Statsmodels Developers",
        "accessed": "2026-10-29",
        "supports": "Definición formal de la tasa de error por familia (FWER) y métodos de control."
      }
    ]
  },
  {
    "id": "procedimiento-benjamini-hochberg",
    "term": "Procedimiento escalonado de Benjamini-Hochberg",
    "englishTerm": "Benjamini-Hochberg Step-Up Procedure",
    "track": "da",
    "definition": "Algoritmo de ordenamiento ascendente que controla la tasa esperada de descubrimientos falsos (FDR) en un nivel objetivo q para m hipótesis. Ordena los valores p de menor a mayor, identifica el mayor rango k que satisface la cota lineal y rechaza todas las hipótesis con rango menor o igual a k.",
    "formula": "p_{(k)} \\le \\frac{k}{m}\\,q",
    "sqlExample": "SELECT rango_k, p_valor, ROUND(0.05 * rango_k / m_total, 5) AS umbral_bh FROM pvalores ORDER BY rango_k;",
    "relatedLessons": [
      "da3-experimentos-02-comparaciones-multiples-bh"
    ],
    "relatedTerms": [
      "tasa-error-familiar-fwer"
    ],
    "sources": [
      {
        "title": "Controlling the False Discovery Rate: A Practical and Powerful Approach to Multiple Testing (JRSS-B 1995)",
        "url": "https://www.math.tau.ac.il/~ybenja/MyPapers/benjamini_hochberg1995.pdf",
        "publisher": "Royal Statistical Society",
        "accessed": "2026-10-29",
        "supports": "Formulación original del algoritmo step-up y demostración del control de FDR."
      }
    ]
  },
  {
    "id": "monitoreo-continuo-peeking",
    "term": "Monitoreo continuo sin ajuste (Peeking)",
    "englishTerm": "Data Peeking / Optional Stopping",
    "track": "da",
    "definition": "Práctica de inspeccionar repetidamente los resultados acumulados de una prueba A/B de horizonte fijo y detener la captura apenas el valor p cruza el umbral nominal de 0.05. Esta regla de parada opcional aprovecha fluctuaciones aleatorias de la caminata browniana e infla severamente la tasa real de falsos positivos.",
    "formula": "\\Pr\\!\\left(\\max_{1 \\le t \\le T} |Z_t| > 1.96 \\;\\middle|\\; H_0\\right) \\gg 0.05",
    "sqlExample": "SELECT dia, SUM(n_dia) OVER (ORDER BY dia) AS n_acum FROM conteos_diarios;",
    "relatedLessons": [
      "da3-experimentos-03-pruebas-secuenciales-msprt"
    ],
    "relatedTerms": [
      "prueba-secuencial-msprt",
      "valor-p"
    ],
    "sources": [
      {
        "title": "How Not To Run an A/B Test",
        "url": "https://www.evanmiller.org/how-not-to-run-an-ab-test.html",
        "publisher": "Evan Miller Statistical Guides",
        "accessed": "2026-10-29",
        "supports": "Explicación matemática de la inflación del error Tipo I por parada opcional en monitoreo continuo."
      }
    ]
  },
  {
    "id": "prueba-secuencial-msprt",
    "term": "Prueba secuencial de razón de verosimilitud mezclada (mSPRT)",
    "englishTerm": "Mixture Sequential Probability Ratio Test (mSPRT)",
    "track": "da",
    "definition": "Método de inferencia secuencial que integra la razón de verosimilitud entre el efecto observado y cero sobre una distribución normal de tamaños de efecto con varianza de mezcla tau cuadrada. Produce una supermartingala bajo la hipótesis nula que permite detener el experimento en cualquier instante cuando supera el umbral uno sobre alfa.",
    "formula": "\\Lambda_t = \\sqrt{\\frac{V_t}{V_t + \\tau^2}}\\,\\exp\\!\\left(\\frac{z_t^2}{2}\\cdot\\frac{\\tau^2}{V_t + \\tau^2}\\right) \\ge \\frac{1}{\\alpha}",
    "sqlExample": "SELECT dia, ROUND(SQRT(v_t / (v_t + 25.0)) * EXP(0.5 * z_t * z_t * (25.0 / (v_t + 25.0))), 2) AS lambda_msprt FROM diario;",
    "relatedLessons": [
      "da3-experimentos-03-pruebas-secuenciales-msprt"
    ],
    "relatedTerms": [
      "monitoreo-continuo-peeking",
      "secuencia-confianza-siempre-valida"
    ],
    "sources": [
      {
        "title": "Peeking at A/B Tests: Why It Matters, and What to Do About It (KDD 2017 / Operations Research 2022)",
        "url": "https://arxiv.org/abs/1512.04922",
        "publisher": "arXiv / Operations Research",
        "accessed": "2026-10-29",
        "supports": "Derivación cerrada del estadístico mSPRT y valores p siempre válidos bajo monitoreo continuo."
      }
    ]
  },
  {
    "id": "secuencia-confianza-siempre-valida",
    "term": "Secuencia de confianza siempre válida",
    "englishTerm": "Always-Valid Confidence Sequence",
    "track": "da",
    "definition": "Familia de intervalos de confianza indexados en el tiempo cuya cobertura conjunta sobre toda la trayectoria del experimento es al menos uno menos alfa. A diferencia del intervalo de horizonte fijo, garantiza inferencia válida sin importar cuándo decida el analista consultar el tablero o detener la prueba.",
    "formula": "\\Pr\\!\\left(\\forall t \\ge 1:\\; \\Delta \\in [\\hat{\\Delta}_t \\pm r_t(\\alpha, \\tau^2)]\\right) \\ge 1 - \\alpha",
    "sqlExample": "SELECT dia, lift_acum - radio_cs AS lim_inf, lift_acum + radio_cs AS lim_sup FROM msprt_diario;",
    "relatedLessons": [
      "da3-experimentos-03-pruebas-secuenciales-msprt"
    ],
    "relatedTerms": [
      "prueba-secuencial-msprt",
      "intervalo-de-confianza"
    ],
    "sources": [
      {
        "title": "Time-uniform, nonparametric, nonasymptotic confidence sequences (Annals of Statistics 2021)",
        "url": "https://arxiv.org/abs/1810.08240",
        "publisher": "Institute of Mathematical Statistics / arXiv",
        "accessed": "2026-10-29",
        "supports": "Fundamento teórico de las secuencias de confianza uniformes en el tiempo."
      }
    ]
  },
  {
    "id": "distribucion-conjugada-beta-binomial",
    "term": "Modelo conjugado Beta-Binomial",
    "englishTerm": "Beta-Binomial Conjugate Model",
    "track": "da",
    "definition": "Esquema de actualización bayesiana para métricas de tasa o proporción donde una distribución a priori Beta se combina con conteos binomiales de éxitos y fracasos. La distribución posterior resultante pertenece exactamente a la misma familia Beta y suma de forma aditiva los hiperparámetros previos con la evidencia observada.",
    "formula": "\\theta \\mid k, n \\sim \\text{Beta}(\\alpha_0 + k,\\; \\beta_0 + n - k)",
    "sqlExample": "SELECT variant, 12 + exitos AS alpha_post, 28 + (n - exitos) AS beta_post FROM conteos;",
    "relatedLessons": [
      "da3-experimentos-04-enfoque-bayesiano-ab"
    ],
    "relatedTerms": [
      "teorema-de-bayes",
      "intervalo-de-confianza"
    ],
    "sources": [
      {
        "title": "Formulas for Bayesian A/B Testing",
        "url": "https://www.evanmiller.org/bayesian-ab-testing.html",
        "publisher": "Evan Miller Statistical Guides",
        "accessed": "2026-10-29",
        "supports": "Actualización conjugada Beta-Binomial y cálculo exacto de probabilidad de superar al control."
      }
    ]
  },
  {
    "id": "perdida-esperada-bayesiana",
    "term": "Pérdida esperada bayesiana",
    "englishTerm": "Bayesian Expected Loss",
    "track": "da",
    "definition": "Métrica de decisión que cuantifica el costo promedio en el que se incurriría al desplegar una variante si en realidad resultara inferior a la alternativa. Integra la magnitud del deterioro potencial ponderada por la densidad posterior, equilibrando la probabilidad de equivocarse con la severidad económica del error.",
    "formula": "\\mathcal{L}(T) = \\mathbb{E}[\\max(0, \\theta_C - \\theta_T) \\mid \\text{datos}]",
    "sqlExample": "SELECT experiment_code, media_post_usd, sd_post_usd, prob_superar_control FROM posterior_resumen;",
    "relatedLessons": [
      "da3-experimentos-04-enfoque-bayesiano-ab"
    ],
    "relatedTerms": [
      "distribucion-conjugada-beta-binomial",
      "intervalo-de-confianza"
    ],
    "sources": [
      {
        "title": "Continuous Monitoring of A/B Tests without Pain: Optional Stopping in Bayesian Testing (DSAA 2016)",
        "url": "https://arxiv.org/abs/1707.02646",
        "publisher": "IEEE DSAA / arXiv",
        "accessed": "2026-10-29",
        "supports": "Reglas de decisión bayesianas basadas en probabilidades posteriores y pérdida esperada."
      }
    ]
  },
  {
    "id": "supuesto-sutva-interferencia",
    "term": "Supuesto SUTVA e interferencia de red",
    "englishTerm": "Stable Unit Treatment Value Assumption (SUTVA)",
    "track": "da",
    "definition": "Principio de inferencia causal que exige que el resultado potencial de cualquier unidad dependa únicamente de su propia asignación y no del estado asignado a otras unidades. Se vulnera en mercados bilaterales, logística compartida o redes sociales cuando el grupo de tratamiento acapara inventario o capacidad operativa del grupo control.",
    "formula": "Y_i(\\mathbf{Z}) = Y_i(Z_i)",
    "sqlExample": "SELECT store_id, COUNT(order_id) AS ordenes_tienda, AVG(total_usd) AS ticket_tienda FROM orders GROUP BY 1;",
    "relatedLessons": [
      "da3-experimentos-05-efectos-red-interferencia-switchback"
    ],
    "relatedTerms": [
      "aleatorizacion-por-conglomerados",
      "experimento-switchback"
    ],
    "sources": [
      {
        "title": "Graph Cluster Randomization: Network Exposure to Multiple Universes (KDD 2013)",
        "url": "https://arxiv.org/abs/1305.5565",
        "publisher": "ACM KDD / arXiv",
        "accessed": "2026-10-29",
        "supports": "Formalización del sesgo por interferencia cuando se viola el supuesto SUTVA."
      }
    ]
  },
  {
    "id": "aleatorizacion-por-conglomerados",
    "term": "Aleatorización por conglomerados (Cluster)",
    "englishTerm": "Cluster Randomization",
    "track": "da",
    "definition": "Diseño experimental en el que la asignación al tratamiento o control se aplica a grupos completos como tiendas, ciudades o almacenes en lugar de usuarios individuales. Mitiga la contaminación entre unidades cercanas, pero exige agregar las métricas al grano del conglomerado para evitar subestimar el error estándar por correlación intraclase.",
    "formula": "\\text{DEFF} = 1 + (\\bar{m} - 1)\\,\\rho_{\\text{ICC}}",
    "sqlExample": "SELECT brazo_cluster, COUNT(DISTINCT store_id) AS k_tiendas, STDDEV_SAMP(media_tienda) / SQRT(COUNT(*)) AS ee_cluster FROM por_tienda GROUP BY 1;",
    "relatedLessons": [
      "da3-experimentos-05-efectos-red-interferencia-switchback"
    ],
    "relatedTerms": [
      "supuesto-sutva-interferencia",
      "experimento-switchback"
    ],
    "sources": [
      {
        "title": "Trustworthy Online Controlled Experiments (Capítulo 22: Triggering, Cluster and Switchback)",
        "url": "https://experimentguide.com/",
        "publisher": "Cambridge University Press",
        "accessed": "2026-10-29",
        "supports": "Varianza a nivel de conglomerado y pérdida de grados de libertad efectivos."
      }
    ]
  },
  {
    "id": "experimento-switchback",
    "term": "Experimento de alternancia temporal (Switchback)",
    "englishTerm": "Switchback Experiment",
    "track": "da",
    "definition": "Diseño experimental donde una misma unidad geográfica u operativa alterna cíclicamente entre régimen de tratamiento y régimen de control a lo largo de bloques de tiempo discretos. Permite estimar efectos causales bajo recursos compartidos y exige analizar la métrica agregada al nivel del bloque tienda-tiempo controlando el arrastre entre periodos.",
    "formula": "\\hat{\\Delta}_{\\text{SB}} = \\frac{1}{B_T}\\sum_{b \\in T} Y_b - \\frac{1}{B_C}\\sum_{b \\in C} Y_b",
    "sqlExample": "SELECT store_type, regimen_switchback, COUNT(*) AS n_bloques, AVG(ingreso_bloque_usd) AS media_bloque FROM bloques GROUP BY 1, 2;",
    "relatedLessons": [
      "da3-experimentos-05-efectos-red-interferencia-switchback"
    ],
    "relatedTerms": [
      "supuesto-sutva-interferencia",
      "aleatorizacion-por-conglomerados"
    ],
    "sources": [
      {
        "title": "Design and Analysis of Switchback Experiments (Management Science 2022)",
        "url": "https://arxiv.org/abs/2009.00148",
        "publisher": "INFORMS Management Science / arXiv",
        "accessed": "2026-10-29",
        "supports": "Diseño óptimo de bloques temporales, efectos de arrastre (carryover) e inferencia en pruebas switchback."
      }
    ]
  },
  {
    "id": "embudo-conversion-ventana",
    "term": "Embudo de conversión por ventana",
    "englishTerm": "Windowed Conversion Funnel",
    "track": "da",
    "definition": "Secuencia ordenada de pasos completados en un plazo máximo desde el alta, como comprar en 60 días; se confunde con el embudo abierto sin ventana.",
    "formula": "C_{1 \\to k}(W) = \\frac{|\\{u : t_1(u) \\le \\dots \\le t_k(u) \\wedge t_k(u) - t_1(u) \\le W\\}|}{|\\{u : t_1(u) \\text{ existe}\\}|}",
    "relatedLessons": [
      "da3-producto-01-embudos-conversion-ventana"
    ],
    "relatedTerms": [
      "tasa-conversion-paso",
      "identidad-retroactiva-eventos"
    ],
    "sources": [
      {
        "title": "Funnels — Product Analytics Documentation",
        "url": "https://posthog.com/docs/product-analytics/funnels",
        "publisher": "PostHog",
        "accessed": "2026-10-29",
        "supports": "Definición de ventana de conversión y orden secuencial estricto entre pasos del embudo."
      }
    ]
  },
  {
    "id": "tasa-conversion-paso",
    "term": "Tasa de conversión por paso",
    "englishTerm": "Step-to-Step Conversion Rate",
    "track": "da",
    "definition": "Proporción de usuarios únicos que avanzan del paso previo al actual, como pasar de carrito a compra; se confunde con la conversión global desde inicio.",
    "formula": "r_{k-1 \\to k} = \\frac{N_k}{N_{k-1}}, \\quad \\text{Abandono}_{k-1 \\to k} = 1 - r_{k-1 \\to k}",
    "relatedLessons": [
      "da3-producto-01-embudos-conversion-ventana"
    ],
    "relatedTerms": [
      "embudo-conversion-ventana"
    ],
    "sources": [
      {
        "title": "Funnels — Product Analytics Documentation",
        "url": "https://posthog.com/docs/product-analytics/funnels",
        "publisher": "PostHog",
        "accessed": "2026-10-29",
        "supports": "Cálculo de tasas de transición paso a paso e identificación de cuellos de botella por caída relativa."
      }
    ]
  },
  {
    "id": "identidad-retroactiva-eventos",
    "term": "Asociación retroactiva de identidad",
    "englishTerm": "Retroactive Identity Stitching",
    "track": "da",
    "definition": "Vinculación de eventos anónimos previos al alta con el cliente registrado, como visitas anteriores; se confunde con activación post-registro si no filtras por fecha.",
    "relatedLessons": [
      "da3-producto-01-embudos-conversion-ventana"
    ],
    "relatedTerms": [
      "embudo-conversion-ventana"
    ],
    "sources": [
      {
        "title": "Lifecycle Insights — Product Analytics Documentation",
        "url": "https://posthog.com/docs/product-analytics/lifecycle",
        "publisher": "PostHog",
        "accessed": "2026-10-29",
        "supports": "Separación temporal entre navegación anónima previa al alta y eventos de activación posteriores al registro."
      }
    ]
  },
  {
    "id": "matriz-retencion-triangular",
    "term": "Matriz triangular de retención",
    "englishTerm": "Triangular Cohort Retention Matrix",
    "track": "da",
    "definition": "Tabla de cohortes por edad relativa que deja en NULL los periodos futuros no observados, como trimestres pendientes; se confunde con rellenar ceros sesgados.",
    "formula": "R(c, k) = \\frac{\\text{Usuarios activos de la cohorte } c \\text{ en el periodo } c + k}{N_{c, 0}}",
    "relatedLessons": [
      "da3-producto-02-cohorts-retention-ltv"
    ],
    "relatedTerms": [
      "ltv-margen-neto",
      "retencion-neta-ingresos"
    ],
    "sources": [
      {
        "title": "Retention — Product Analytics Documentation",
        "url": "https://posthog.com/docs/product-analytics/retention",
        "publisher": "PostHog",
        "accessed": "2026-10-29",
        "supports": "Estructura triangular de cohortes por edad relativa con denominador fijo en el periodo cero."
      },
      {
        "title": "Survival Analysis with lifelines",
        "url": "https://lifelines.readthedocs.io/en/latest/Survival%20analysis%20with%20lifelines.html",
        "publisher": "lifelines",
        "accessed": "2026-10-29",
        "supports": "Tratamiento de observaciones truncadas por censura por la derecha al cierre de la ventana de estudio."
      }
    ]
  },
  {
    "id": "ltv-margen-neto",
    "term": "LTV ajustado por margen neto",
    "englishTerm": "Net Margin Customer Lifetime Value",
    "track": "da",
    "definition": "Valor acumulado del cliente restando coste unitario y devoluciones procesadas, como descontar unit_cost_usd y refunds; se confunde con el ingreso bruto sin costes.",
    "formula": "\\text{LTV}_{\\text{margen}} = \\frac{1}{|C|} \\sum_{u \\in C} \\left( \\text{Ingresos}_u - \\text{COGS}_u - \\text{Devoluciones}_u \\right)",
    "relatedLessons": [
      "da3-producto-02-cohorts-retention-ltv"
    ],
    "relatedTerms": [
      "matriz-retencion-triangular",
      "retencion-neta-ingresos"
    ],
    "sources": [
      {
        "title": "Counting Your Customers the Easy Way: An Alternative to the Pareto/NBD Model",
        "url": "https://www.brucehardie.com/papers/018/fader_et_al_mksc_05.pdf",
        "publisher": "Marketing Science",
        "accessed": "2026-10-29",
        "supports": "Modelado del valor de vida del cliente basado en margen de contribución neto en entornos no contractuales."
      }
    ]
  },
  {
    "id": "retencion-neta-ingresos",
    "term": "Retención neta de ingresos (NRR)",
    "englishTerm": "Net Revenue Retention (NRR)",
    "track": "da",
    "definition": "Porcentaje del ingreso inicial de una cohorte conservado tras expansiones, contracciones y bajas, como superar el 100%; se confunde con retención simple de clientes.",
    "formula": "\\text{NRR}(c, k) = \\frac{\\text{Ingresos de la cohorte } c \\text{ en } c+k}{\\text{Ingresos de la cohorte } c \\text{ en } c+0}",
    "relatedLessons": [
      "da3-producto-02-cohorts-retention-ltv"
    ],
    "relatedTerms": [
      "matriz-retencion-triangular",
      "ltv-margen-neto"
    ],
    "sources": [
      {
        "title": "Technical Notes on Customer-Base Analysis",
        "url": "https://www.brucehardie.com/notes/",
        "publisher": "Bruce G. S. Hardie",
        "accessed": "2026-10-29",
        "supports": "Diferencia entre supervivencia de clientes activos y evolución del gasto monetario por cohorte."
      }
    ]
  },
  {
    "id": "segmentacion-rfm",
    "term": "Segmentación conductual RFM",
    "englishTerm": "RFM Behavioral Segmentation",
    "track": "da",
    "definition": "Clasificación conductual por cuantiles de recencia, frecuencia y gasto, como Campeones o En Riesgo; se confunde con la etiqueta demográfica estática del registro.",
    "formula": "\\text{Score RFM} = (Q_4(-R),\\; Q_4(F),\\; Q_4(M)) \\in \\{1,2,3,4\\}^3",
    "relatedLessons": [
      "da3-producto-03-segmentacion-conductual-rfm"
    ],
    "relatedTerms": [
      "curvas-isovalor-clv",
      "ltv-margen-neto"
    ],
    "sources": [
      {
        "title": "RFM and CLV: Using Iso-Value Curves for Customer Base Analysis",
        "url": "https://www.brucehardie.com/papers/rfm_clv_2005-02-16.pdf",
        "publisher": "Journal of Marketing Research",
        "accessed": "2026-10-29",
        "supports": "Suficiencia estadística de recencia, frecuencia y valor monetario para resumir el historial transaccional."
      }
    ]
  },
  {
    "id": "curvas-isovalor-clv",
    "term": "Curvas de isovalor RFM-CLV",
    "englishTerm": "RFM Iso-Value Curves",
    "track": "da",
    "definition": "Contornos de igual valor futuro en el plano recencia-frecuencia, donde alta frecuencia antigua pierde valor; se confunde con puntuar frecuencia de forma lineal.",
    "relatedLessons": [
      "da3-producto-03-segmentacion-conductual-rfm"
    ],
    "relatedTerms": [
      "segmentacion-rfm",
      "ltv-margen-neto"
    ],
    "sources": [
      {
        "title": "RFM and CLV: Using Iso-Value Curves for Customer Base Analysis",
        "url": "https://www.brucehardie.com/papers/rfm_clv_2005-02-16.pdf",
        "publisher": "Journal of Marketing Research",
        "accessed": "2026-10-29",
        "supports": "Interacción no lineal entre frecuencia pasada y recencia para predecir compras futuras."
      }
    ]
  },
  {
    "id": "atribucion-ultimo-toque-asof",
    "term": "Atribución de último toque por ventana",
    "englishTerm": "Windowed Last-Touch Attribution",
    "track": "da",
    "definition": "Asignación del pedido al último evento de campaña previo dentro de una ventana como 24 horas vía ASOF JOIN; se confunde con incrementalidad causal.",
    "formula": "\\text{Toque}(o) = \\arg\\max_{e \\in E_u : 0 \\le t_o - t_e \\le W} t_e",
    "relatedLessons": [
      "da3-producto-04-atribucion-marketing-incrementalidad"
    ],
    "relatedTerms": [
      "incrementalidad-diferencia-en-diferencias"
    ],
    "sources": [
      {
        "title": "ASOF JOIN — DuckDB SQL Query Syntax",
        "url": "https://duckdb.org/docs/sql/query_syntax/from.html#asof-join",
        "publisher": "DuckDB Foundation",
        "accessed": "2026-10-29",
        "supports": "Emparejamiento temporal del evento previo más cercano mediante desigualdad sobre timestamps."
      },
      {
        "title": "ASOF JOIN — Snowflake SQL Reference",
        "url": "https://docs.snowflake.com/en/sql-reference/constructs/asof-join",
        "publisher": "Snowflake",
        "accessed": "2026-10-29",
        "supports": "Semántica formal de unión por proximidad temporal en flujos de eventos y transacciones."
      }
    ]
  },
  {
    "id": "incrementalidad-diferencia-en-diferencias",
    "term": "Incrementalidad por diferencia en diferencias",
    "englishTerm": "Difference-in-Differences Incrementality",
    "track": "da",
    "definition": "Efecto causal estimado restando el cambio pre-post del control al del grupo tratado, como medir gasto incremental; se confunde con ROAS atribuido sin control.",
    "formula": "\\hat{\\tau}_{\\text{DID}} = (\\bar{Y}_{T,\\text{post}} - \\bar{Y}_{T,\\text{pre}}) - (\\bar{Y}_{C,\\text{post}} - \\bar{Y}_{C,\\text{pre}})",
    "relatedLessons": [
      "da3-producto-04-atribucion-marketing-incrementalidad"
    ],
    "relatedTerms": [
      "atribucion-ultimo-toque-asof"
    ],
    "sources": [
      {
        "title": "Ghost Ads: Improving the Economics of Measuring Online Ad Effectiveness",
        "url": "https://www.nber.org/papers/w21303",
        "publisher": "National Bureau of Economic Research",
        "accessed": "2026-10-29",
        "supports": "Medición experimental de lift incremental frente al sesgo de selección en atribución publicitaria."
      },
      {
        "title": "Meridian — Open-Source Marketing Mix Modeling and Incrementality",
        "url": "https://developers.google.com/meridian",
        "publisher": "Google Developers",
        "accessed": "2026-10-29",
        "supports": "Calibración del retorno incremental mediante experimentos causales y diferencias pre-post."
      }
    ]
  },
  {
    "id": "diferencias-en-diferencias",
    "term": "Diferencias en diferencias (DiD)",
    "englishTerm": "Difference-in-Differences (DiD)",
    "track": "da",
    "definition": "Diseño cuasiexperimental que estima el efecto causal restando el cambio temporal del grupo de control al cambio temporal observado en el grupo tratado.",
    "formula": "\\hat{\\tau}_{\\text{DiD}} = (\\bar{Y}_{T,\\text{post}} - \\bar{Y}_{T,\\text{pre}}) - (\\bar{Y}_{C,\\text{post}} - \\bar{Y}_{C,\\text{pre}})",
    "relatedLessons": [
      "da4-causalidad-01-diferencias-en-diferencias-did",
      "da4-causalidad-04-memo-analitico-supuestos"
    ],
    "relatedTerms": [
      "tendencias-paralelas",
      "prueba-de-placebo"
    ],
    "sources": [
      {
        "title": "Causal Inference: The Mixtape — Difference-in-Differences",
        "url": "https://mixtape.scunning.com/09-Difference_in_Differences.html",
        "publisher": "Yale University Press / Scott Cunningham",
        "accessed": "2026-10-29",
        "supports": "Definición y estimador 2x2 de diferencias en diferencias."
      }
    ]
  },
  {
    "id": "tendencias-paralelas",
    "term": "Supuesto de tendencias paralelas",
    "englishTerm": "Parallel trends assumption",
    "track": "da",
    "definition": "Condición de identificación según la cual, sin tratamiento, el grupo tratado habría seguido la misma evolución temporal media que el grupo de control.",
    "formula": "E[Y_{i,\\text{post}}(0) - Y_{i,\\text{pre}}(0) \\mid D_i = 1] = E[Y_{i,\\text{post}}(0) - Y_{i,\\text{pre}}(0) \\mid D_i = 0]",
    "relatedLessons": [
      "da4-causalidad-01-diferencias-en-diferencias-did",
      "da4-causalidad-04-memo-analitico-supuestos"
    ],
    "relatedTerms": [
      "diferencias-en-diferencias",
      "prueba-de-placebo"
    ],
    "sources": [
      {
        "title": "The Effect — Chapter 18: Difference-in-Differences",
        "url": "https://theeffectbook.net/ch-DifferenceinDifference.html",
        "publisher": "Chapman & Hall / Nick Huntington-Klein",
        "accessed": "2026-10-29",
        "supports": "Formulación contrafactual del supuesto de tendencias paralelas."
      }
    ]
  },
  {
    "id": "prueba-de-placebo",
    "term": "Prueba de placebo",
    "englishTerm": "Placebo test",
    "track": "da",
    "definition": "Verificación de falsación que estima un efecto en periodos previos o unidades no tratadas donde el impacto causal verdadero debe ser cero.",
    "formula": "\\hat{\\tau}_{\\text{placebo}} = (\\bar{Y}_{T,t_{-1}} - \\bar{Y}_{T,t_{-2}}) - (\\bar{Y}_{C,t_{-1}} - \\bar{Y}_{C,t_{-2}}) \\approx 0",
    "relatedLessons": [
      "da4-causalidad-01-diferencias-en-diferencias-did",
      "da4-causalidad-03-control-sintetico-emparejamiento"
    ],
    "relatedTerms": [
      "diferencias-en-diferencias",
      "tendencias-paralelas"
    ],
    "sources": [
      {
        "title": "Causal Inference: The Mixtape — Difference-in-Differences",
        "url": "https://mixtape.scunning.com/09-Difference_in_Differences.html",
        "publisher": "Yale University Press / Scott Cunningham",
        "accessed": "2026-10-29",
        "supports": "Pruebas de falsación preintervención y en el espacio de donantes."
      }
    ]
  },
  {
    "id": "regresion-discontinua",
    "term": "Regresión discontinua (RDD)",
    "englishTerm": "Regression Discontinuity Design (RDD)",
    "track": "da",
    "definition": "Diseño que identifica el efecto causal local comparando observaciones situadas justo por debajo y justo por encima de un umbral administrativo de elegibilidad.",
    "formula": "\\tau_{\\text{RDD}} = \\lim_{x \\downarrow c} E[Y_i \\mid X_i = x] - \\lim_{x \\uparrow c} E[Y_i \\mid X_i = x]",
    "relatedLessons": [
      "da4-causalidad-02-regresion-discontinua-rdd",
      "da4-causalidad-04-memo-analitico-supuestos"
    ],
    "relatedTerms": [
      "variable-de-asignacion",
      "ancho-de-banda-rdd"
    ],
    "sources": [
      {
        "title": "Causal Inference: The Mixtape — Regression Discontinuity",
        "url": "https://mixtape.scunning.com/06-Regression_Discontinuity.html",
        "publisher": "Yale University Press / Scott Cunningham",
        "accessed": "2026-10-29",
        "supports": "Identificación del efecto causal local en el punto de corte."
      }
    ]
  },
  {
    "id": "variable-de-asignacion",
    "term": "Variable de asignación (running variable)",
    "englishTerm": "Running variable (forcing variable)",
    "track": "da",
    "definition": "Métrica continua observable, como el subtotal de compra o puntaje crediticio, cuyo cruce por un punto de corte activa o cambia la elegibilidad.",
    "formula": "D_i = \\mathbb{I}(X_i \\ge c)",
    "relatedLessons": [
      "da4-causalidad-02-regresion-discontinua-rdd"
    ],
    "relatedTerms": [
      "regresion-discontinua",
      "ancho-de-banda-rdd"
    ],
    "sources": [
      {
        "title": "The Effect — Chapter 20: Regression Discontinuity",
        "url": "https://theeffectbook.net/ch-RegressionDiscontinuity.html",
        "publisher": "Chapman & Hall / Nick Huntington-Klein",
        "accessed": "2026-10-29",
        "supports": "Papel de la variable de asignación y centrado en el umbral."
      }
    ]
  },
  {
    "id": "ancho-de-banda-rdd",
    "term": "Ancho de banda (bandwidth)",
    "englishTerm": "Bandwidth",
    "track": "da",
    "definition": "Semiamplitud del intervalo alrededor del umbral dentro del cual se incluyen observaciones para equilibrar sesgo de especificación y varianza muestral en regresión discontinua.",
    "formula": "X_i \\in [c - h,\\, c + h]",
    "relatedLessons": [
      "da4-causalidad-02-regresion-discontinua-rdd"
    ],
    "relatedTerms": [
      "regresion-discontinua",
      "variable-de-asignacion"
    ],
    "sources": [
      {
        "title": "RD Packages — Regression Discontinuity Software and Foundations",
        "url": "https://rdpackages.github.io/",
        "publisher": "Cattaneo, Idrobo & Titiunik",
        "accessed": "2026-10-29",
        "supports": "Selección de ventana local y compromiso entre sesgo y varianza."
      }
    ]
  },
  {
    "id": "emparejamiento-exacto",
    "term": "Emparejamiento (matching)",
    "englishTerm": "Matching",
    "track": "da",
    "definition": "Técnica que construye un grupo de comparación emparejando cada unidad tratada con unidades no tratadas que comparten valores equivalentes en covariables previas observables.",
    "formula": "\\hat{\\tau}_{\\text{ATT}} = \\sum_{s} w_s \\left( \\bar{Y}_{T,s} - \\bar{Y}_{C,s} \\right), \\quad w_s = \\frac{N_{T,s}}{N_T}",
    "relatedLessons": [
      "da4-causalidad-03-control-sintetico-emparejamiento"
    ],
    "relatedTerms": [
      "control-sintetico",
      "diferencias-en-diferencias"
    ],
    "sources": [
      {
        "title": "The Effect — Chapter 14: Matching",
        "url": "https://theeffectbook.net/ch-Matching.html",
        "publisher": "Chapman & Hall / Nick Huntington-Klein",
        "accessed": "2026-10-29",
        "supports": "Emparejamiento por estratos, soporte común y ponderación ATT."
      }
    ]
  },
  {
    "id": "control-sintetico",
    "term": "Control sintético",
    "englishTerm": "Synthetic control",
    "track": "da",
    "definition": "Método que estima el contrafactual de una unidad agregada tratada mediante un promedio ponderado convexo de unidades donantes ajustado en el periodo preintervención.",
    "formula": "\\hat{Y}_{1t}^{N} = \\sum_{j=2}^{J+1} w_j Y_{jt}, \\quad \\sum_{j=2}^{J+1} w_j = 1, \\; w_j \\ge 0",
    "relatedLessons": [
      "da4-causalidad-03-control-sintetico-emparejamiento"
    ],
    "relatedTerms": [
      "emparejamiento-exacto",
      "prueba-de-placebo"
    ],
    "sources": [
      {
        "title": "Causal Inference: The Mixtape — Synthetic Control",
        "url": "https://mixtape.scunning.com/11-Synthetic_Control.html",
        "publisher": "Yale University Press / Scott Cunningham",
        "accessed": "2026-10-29",
        "supports": "Pesos convexos del grupo donante y ajuste preintervención."
      }
    ]
  },
  {
    "id": "principio-de-la-piramide",
    "term": "Principio de la pirámide (SCQA)",
    "englishTerm": "Pyramid Principle (SCQA)",
    "track": "da",
    "definition": "Estructura narrativa ejecutiva que abre con la conclusión gobernante tras situar contexto, complicación y pregunta, respaldada por argumentos mutuamente excluyentes y evidencia verificable.",
    "relatedLessons": [
      "da4-causalidad-04-memo-analitico-supuestos",
      "da4-causalidad-05-presentacion-direccion-decisiones"
    ],
    "relatedTerms": [
      "matriz-de-decision",
      "diferencias-en-diferencias"
    ],
    "sources": [
      {
        "title": "The Effect — Chapter 5: Identification",
        "url": "https://theeffectbook.net/ch-Identification.html",
        "publisher": "Chapman & Hall / Nick Huntington-Klein",
        "accessed": "2026-10-29",
        "supports": "Articulación transparente de supuestos de identificación y diseño."
      }
    ]
  },
  {
    "id": "matriz-de-decision",
    "term": "Matriz de decisión bajo incertidumbre",
    "englishTerm": "Decision matrix under uncertainty",
    "track": "da",
    "definition": "Regla explícita que vincula los límites del intervalo de confianza, el costo de equilibrio y las métricas guardarraíl con opciones operativas de despliegue.",
    "formula": "\\text{Desplegar si } \\text{IC}_{95\\%,\\text{inf}} \\ge C_{\\text{umbral}} \\text{ y guardarraíles intactos}",
    "relatedLessons": [
      "da4-causalidad-05-presentacion-direccion-decisiones",
      "da4-causalidad-04-memo-analitico-supuestos"
    ],
    "relatedTerms": [
      "principio-de-la-piramide",
      "diferencias-en-diferencias"
    ],
    "sources": [
      {
        "title": "Trustworthy Online Controlled Experiments — Companion Guide",
        "url": "https://experimentguide.com/",
        "publisher": "Cambridge University Press / Kohavi, Tang & Xu",
        "accessed": "2026-10-29",
        "supports": "Criterios de lanzamiento, métricas guardarraíl y umbrales de rentabilidad."
      }
    ]
  },
  {
    "id": "minimos-cuadrados-ordinarios",
    "term": "Mínimos cuadrados ordinarios (OLS)",
    "english": "Ordinary Least Squares (OLS)",
    "track": "da",
    "definition": "Método de estimación lineal que calcula el intercepto y las pendientes minimizando la suma de los residuos elevados al cuadrado entre el valor observado y la predicción. Permite cuantificar el cambio esperado en la respuesta cuando un predictor aumenta una unidad manteniendo constantes las demás covariables del modelo.",
    "formula": "\\hat{\\beta} = (X^T X)^{-1} X^T y",
    "example": "En Mercado Brisa, REGR_SLOPE(clicks, spend_usd) estima cuántos clics adicionales aporta cada dólar invertido por canal.",
    "relatedLessons": [
      "da4-modelos-01-regresion-lineal-multiple"
    ],
    "relatedTerms": [
      "factor-inflacion-varianza",
      "homocedasticidad-residuos",
      "correlacion-pearson"
    ],
    "sources": [
      {
        "title": "statsmodels — Ordinary Least Squares (OLS)",
        "url": "https://www.statsmodels.org/stable/regression.html",
        "publisher": "statsmodels Developers",
        "accessed": "2025-10-15",
        "supports": "Formulación matricial y propiedades del estimador de mínimos cuadrados ordinarios."
      },
      {
        "title": "DuckDB — Aggregate Functions (REGR_SLOPE, REGR_INTERCEPT, REGR_R2)",
        "url": "https://duckdb.org/docs/stable/sql/functions/aggregates.html",
        "publisher": "DuckDB Foundation",
        "accessed": "2025-10-15",
        "supports": "Cálculo de pendientes e interceptos de mínimos cuadrados en SQL."
      }
    ]
  },
  {
    "id": "factor-inflacion-varianza",
    "term": "Factor de inflación de la varianza (VIF)",
    "english": "Variance Inflation Factor (VIF)",
    "track": "da",
    "definition": "Diagnóstico numérico que mide cuánto se multiplica la varianza del coeficiente estimado de un predictor debido a su correlación lineal con el resto de las variables explicativas. Valores superiores a cinco indican colinealidad severa que vuelve inestables las pendientes individuales y ensancha sus errores estándar.",
    "formula": "\\text{VIF}_j = \\frac{1}{1 - R_j^2}",
    "example": "En marketing_spend, la alta correlación entre spend_usd e impressions eleva el VIF por encima de 3 en búsqueda orgánica.",
    "relatedLessons": [
      "da4-modelos-01-regresion-lineal-multiple"
    ],
    "relatedTerms": [
      "minimos-cuadrados-ordinarios",
      "correlacion-pearson",
      "variable-confusion"
    ],
    "sources": [
      {
        "title": "statsmodels — variance_inflation_factor",
        "url": "https://www.statsmodels.org/stable/generated/statsmodels.stats.outliers_influence.variance_inflation_factor.html",
        "publisher": "statsmodels Developers",
        "accessed": "2025-10-15",
        "supports": "Definición e implementación del factor de inflación de la varianza para diagnóstico de colinealidad."
      },
      {
        "title": "James et al. — An Introduction to Statistical Learning (ISLP)",
        "url": "https://www.statlearning.com/",
        "publisher": "Springer",
        "accessed": "2025-10-15",
        "supports": "Umbrales prácticos de interpretación del VIF en regresión lineal múltiple."
      }
    ]
  },
  {
    "id": "homocedasticidad-residuos",
    "term": "Homocedasticidad de residuos",
    "english": "Homoscedasticity of Residuals",
    "track": "da",
    "definition": "Supuesto del modelo lineal según el cual la varianza del error entre el valor observado y el predicho permanece constante a lo largo de todos los niveles del predictor. Cuando la dispersión crece con el tamaño de la predicción, aparece heterocedasticidad y los intervalos de confianza ordinarios pierden validez.",
    "formula": "\\text{Var}(e_i \\mid X_i) = \\sigma^2",
    "example": "Al comparar el error cuadrático medio de clics por tramo de gasto en paid_social, verificamos si la dispersión residual se dispara en días de presupuesto alto.",
    "relatedLessons": [
      "da4-modelos-01-regresion-lineal-multiple"
    ],
    "relatedTerms": [
      "minimos-cuadrados-ordinarios",
      "error-estandar"
    ],
    "sources": [
      {
        "title": "statsmodels — Regression Diagnostics and Specification Tests",
        "url": "https://www.statsmodels.org/stable/regression.html",
        "publisher": "statsmodels Developers",
        "accessed": "2025-10-15",
        "supports": "Supuesto de varianza constante de los errores y pruebas diagnósticas de heterocedasticidad."
      }
    ]
  },
  {
    "id": "razon-de-momios",
    "term": "Razón de momios (odds ratio)",
    "english": "Odds Ratio (OR)",
    "track": "da",
    "definition": "Cociente entre los momios de ocurrencia de un evento binario en un grupo expuesto y los momios del mismo evento en el grupo base de referencia. En regresión logística, equivale a exponenciar el coeficiente estimado de la variable explicativa y expresa el cambio multiplicativo en los momios por unidad.",
    "formula": "\\text{OR} = \\frac{p_1 / (1 - p_1)}{p_0 / (1 - p_0)} = e^{\\beta_1}",
    "example": "En pedidos de Mercado Brisa, el canal desktop presenta una razón de momios de reembolso de 1.66 frente al canal base mobile.",
    "relatedLessons": [
      "da4-modelos-02-regresion-logistica-calibracion"
    ],
    "relatedTerms": [
      "puntaje-brier-calibracion",
      "umbral-decision",
      "probabilidad-condicional"
    ],
    "sources": [
      {
        "title": "statsmodels — Regression with Discrete Dependent Variable (Logit)",
        "url": "https://www.statsmodels.org/stable/discretemod.html",
        "publisher": "statsmodels Developers",
        "accessed": "2025-10-15",
        "supports": "Relación entre coeficientes logit y razones de momios mediante exponenciación."
      },
      {
        "title": "scikit-learn — Logistic Regression User Guide",
        "url": "https://scikit-learn.org/stable/modules/linear_model.html",
        "publisher": "scikit-learn Developers",
        "accessed": "2025-10-15",
        "supports": "Modelado de probabilidades binarias mediante la función logística sigmoide."
      }
    ]
  },
  {
    "id": "puntaje-brier-calibracion",
    "term": "Puntaje de Brier y calibración de probabilidades",
    "english": "Brier Score and Probability Calibration",
    "track": "da",
    "definition": "Métrica cuadrática que evalúa la precisión y calibración de probabilidades predichas para eventos binarios promediando la diferencia al cuadrado entre la probabilidad asignada y el resultado real cero o uno. Un modelo está bien calibrado cuando, dentro de cada banda de riesgo predicho, la frecuencia empírica coincide con la probabilidad media.",
    "formula": "\\text{BS} = \\frac{1}{N} \\sum_{i=1}^{N} (\\hat{p}_i - y_i)^2",
    "example": "Agrupamos los pedidos en cinco quintiles de riesgo de reembolso para comprobar si una probabilidad predicha de 0.08 corresponde a un 8% real de devoluciones.",
    "relatedLessons": [
      "da4-modelos-02-regresion-logistica-calibracion"
    ],
    "relatedTerms": [
      "razon-de-momios",
      "umbral-decision"
    ],
    "sources": [
      {
        "title": "scikit-learn — Probability Calibration and Brier Score",
        "url": "https://scikit-learn.org/stable/modules/calibration.html",
        "publisher": "scikit-learn Developers",
        "accessed": "2025-10-15",
        "supports": "Fórmula del puntaje de Brier y evaluación de curvas de calibración por bandas."
      }
    ]
  },
  {
    "id": "descomposicion-serie-temporal",
    "term": "Descomposición de serie temporal",
    "english": "Time Series Decomposition",
    "track": "da",
    "definition": "Procedimiento analítico que separa una secuencia cronológica de observaciones en tres componentes interpretables: tendencia-ciclo de mediano plazo, patrón estacional periódico y residuo irregular. Permite distinguir si una variación abrupta responde al calendario habitual de operación o constituye una anomalía genuina en el residuo.",
    "formula": "Y_t = T_t + S_t + R_t",
    "example": "En las ventas diarias de Mercado Brisa durante 2024, separamos la tendencia móvil de 7 días y el efecto por día de la semana para aislar picos promocionales en el residuo.",
    "relatedLessons": [
      "da4-modelos-03-series-temporales-descomposicion"
    ],
    "relatedTerms": [
      "media-movil-centrada",
      "c2-sql-date-spine",
      "c2-sql-marco-ventana"
    ],
    "sources": [
      {
        "title": "Hyndman & Athanasopoulos — Forecasting: Principles and Practice (Ch. 3 Time Series Decomposition)",
        "url": "https://otexts.com/fpp3/decomposition.html",
        "publisher": "OTexts",
        "accessed": "2025-10-15",
        "supports": "Descomposición aditiva y multiplicativa en tendencia-ciclo, estacionalidad y residuo."
      },
      {
        "title": "Hyndman & Athanasopoulos — STL Decomposition",
        "url": "https://otexts.com/fpp3/stl.html",
        "publisher": "OTexts",
        "accessed": "2025-10-15",
        "supports": "Descomposición estacional y de tendencia mediante Loess (STL)."
      }
    ]
  },
  {
    "id": "media-movil-centrada",
    "term": "Media móvil de tendencia",
    "english": "Moving Average Trend Smoothing",
    "track": "da",
    "definition": "Promedio calculado sobre una ventana deslizante de longitud fija que suaviza fluctuaciones de corto plazo y filtra el ciclo estacional cuando la longitud coincide con el período repetitivo. En series diarias con ciclo semanal, una ventana de siete días absorbe el efecto del día de la semana y revela la tendencia.",
    "formula": "\\hat{T}_t = \\frac{1}{2k+1} \\sum_{j=-k}^{k} Y_{t+j}",
    "example": "Con AVG(ingresos_usd) OVER (ORDER BY calendar_date ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING) obtenemos la tendencia semanal centrada.",
    "relatedLessons": [
      "da4-modelos-03-series-temporales-descomposicion"
    ],
    "relatedTerms": [
      "descomposicion-serie-temporal",
      "c2-sql-marco-ventana"
    ],
    "sources": [
      {
        "title": "Hyndman & Athanasopoulos — Moving Averages in Time Series",
        "url": "https://otexts.com/fpp3/decomposition.html",
        "publisher": "OTexts",
        "accessed": "2025-10-15",
        "supports": "Suavizado de tendencia-ciclo mediante medias móviles centradas de orden m."
      },
      {
        "title": "DuckDB — Window Functions and Framing",
        "url": "https://duckdb.org/docs/stable/sql/functions/window_functions.html",
        "publisher": "DuckDB Foundation",
        "accessed": "2025-10-15",
        "supports": "Definición de marcos deslizantes con ROWS BETWEEN en funciones de ventana SQL."
      }
    ]
  },
  {
    "id": "validacion-ventana-rodante",
    "term": "Validación por ventana rodante (backtesting)",
    "english": "Rolling Window Backtesting / Time Series Cross-Validation",
    "track": "da",
    "definition": "Esquema de evaluación fuera de muestra para pronósticos donde el origen de predicción avanza cronológicamente paso a paso sin mezclar observaciones futuras en el conjunto de entrenamiento. En cada corte temporal se entrena o promedia únicamente con el pasado disponible y se mide el error sobre el horizonte siguiente.",
    "formula": "e_{t+h \\mid t} = Y_{t+h} - \\hat{Y}_{t+h \\mid t}",
    "example": "Para pronosticar la demanda semanal de Café en grano usamos ROWS BETWEEN 4 PRECEDING AND 1 PRECEDING sin tocar la fila actual ni semanas futuras.",
    "relatedLessons": [
      "da4-modelos-04-pronostico-backtesting-mae-mase"
    ],
    "relatedTerms": [
      "error-absoluto-escalado-medio",
      "descomposicion-serie-temporal",
      "c2-sql-marco-ventana"
    ],
    "sources": [
      {
        "title": "Hyndman & Athanasopoulos — Time Series Cross-Validation",
        "url": "https://otexts.com/fpp3/tscv.html",
        "publisher": "OTexts",
        "accessed": "2025-10-15",
        "supports": "Evaluación de pronósticos mediante origen de predicción rodante sin fuga temporal."
      },
      {
        "title": "scikit-learn — TimeSeriesSplit Cross-Validation",
        "url": "https://scikit-learn.org/stable/modules/cross_validation.html",
        "publisher": "scikit-learn Developers",
        "accessed": "2025-10-15",
        "supports": "Particionado secuencial de series temporales para validación fuera de muestra."
      }
    ]
  },
  {
    "id": "error-absoluto-escalado-medio",
    "term": "Error absoluto escalado medio (MASE)",
    "english": "Mean Absolute Scaled Error (MASE)",
    "track": "da",
    "definition": "Métrica adimensional de exactitud de pronóstico definida como el cociente entre el error absoluto medio del modelo evaluado y el error absoluto medio del pronóstico ingenuo a un paso. Un valor menor que uno demuestra que el modelo añade valor real frente a repetir la última observación disponible.",
    "formula": "\\text{MASE} = \\frac{\\text{MAE}_{\\text{modelo}}}{\\text{MAE}_{\\text{ingenuo}}}",
    "example": "En la demanda semanal de Mercado Brisa, la media móvil de 4 semanas logra un MASE entre 0.81 y 0.86 en las cinco categorías frente al pronóstico ingenuo.",
    "relatedLessons": [
      "da4-modelos-04-pronostico-backtesting-mae-mase"
    ],
    "relatedTerms": [
      "validacion-ventana-rodante",
      "media-aritmetica"
    ],
    "sources": [
      {
        "title": "Hyndman & Athanasopoulos — Evaluating Point Forecast Accuracy (MAE, RMSE, MASE)",
        "url": "https://otexts.com/fpp3/accuracy.html",
        "publisher": "OTexts",
        "accessed": "2025-10-15",
        "supports": "Definición de MASE como métrica libre de escala comparada contra el método ingenuo."
      }
    ]
  },
  {
    "id": "estandarizacion-puntaje-z",
    "term": "Estandarización por puntaje z",
    "english": "Z-Score Standardization",
    "track": "da",
    "definition": "Transformación lineal que centra cada atributo numérico restando su media muestral y lo divide por su desviación estándar para expresarlo en unidades de dispersión adimensionales. En algoritmos de agrupamiento basados en distancia euclidiana, evita que variables monetarias de gran magnitud numérica eclipsen a conteos de frecuencia.",
    "formula": "z_i = \\frac{x_i - \\bar{x}}{s_x}",
    "example": "Antes de segmentar clientes de Mercado Brisa, transformamos gasto_total_usd (miles de dólares) y frecuencia_pedidos (unidades) a escala z con media 0 y desviación 1.",
    "relatedLessons": [
      "da4-modelos-05-clustering-segmentacion-perfiles"
    ],
    "relatedTerms": [
      "coeficiente-silueta",
      "puntaje-z-modificado-mad"
    ],
    "sources": [
      {
        "title": "scikit-learn — Preprocessing Data (StandardScaler)",
        "url": "https://scikit-learn.org/stable/modules/preprocessing.html",
        "publisher": "scikit-learn Developers",
        "accessed": "2025-10-15",
        "supports": "Estandarización de características a media cero y varianza uno para algoritmos de distancia."
      }
    ]
  },
  {
    "id": "coeficiente-silueta",
    "term": "Coeficiente de silueta",
    "english": "Silhouette Coefficient",
    "track": "da",
    "definition": "Métrica interna de calidad de agrupamiento que compara la distancia media de cada observación a los miembros de su propio grupo frente a la distancia media al grupo vecino más cercano. Oscila entre menos uno y más uno, ayudando a detectar cuándo agregar más grupos fragmenta artificialmente la muestra.",
    "formula": "s(i) = \\frac{b(i) - a(i)}{\\max\\{a(i), b(i)\\}}",
    "example": "Evaluamos si dividir la base de clientes en tres perfiles operativos mantiene una silueta alta y tamaños de grupo accionables para retención.",
    "relatedLessons": [
      "da4-modelos-05-clustering-segmentacion-perfiles"
    ],
    "relatedTerms": [
      "estandarizacion-puntaje-z",
      "c22-cohort-retention-ltv"
    ],
    "sources": [
      {
        "title": "scikit-learn — Clustering Performance Evaluation (Silhouette Coefficient)",
        "url": "https://scikit-learn.org/stable/modules/clustering.html",
        "publisher": "scikit-learn Developers",
        "accessed": "2025-10-15",
        "supports": "Fórmula e interpretación del coeficiente de silueta para elegir el número de grupos."
      },
      {
        "title": "James et al. — An Introduction to Statistical Learning (Unsupervised Learning)",
        "url": "https://www.statlearning.com/",
        "publisher": "Springer",
        "accessed": "2025-10-15",
        "supports": "Validación práctica de agrupamientos k-medias y prevención de sobreajuste."
      }
    ]
  },
  {
    "id": "parquet-row-group",
    "term": "Grupo de filas en Parquet (Row Group)",
    "englishTerm": "Parquet Row Group & Column Chunk",
    "track": "de",
    "definition": "Partición horizontal física dentro de un archivo Parquet que agrupa columnas contiguas en bloques independientes con estadísticas propias en el pie del archivo.",
    "formula": "Row Group (10k–1M filas) = Σ Column Chunks (1 por columna) → Data Pages (1 MB). Se confunde con: partición de directorio Hive en disco.",
    "relatedLessons": [
      "de2-formatos-01-columnar-parquet",
      "de2-formatos-04-codificacion-compresion-zstd",
      "de2-formatos-05-particionado-archivos-pequenos"
    ],
    "relatedTerms": [
      "zone-map",
      "parquet-page-index"
    ],
    "sources": [
      {
        "title": "Apache Parquet File Format Specification",
        "url": "https://parquet.apache.org/docs/file-format/",
        "publisher": "Apache Software Foundation",
        "accessed": "2026-10-29",
        "supports": "Jerarquía física de Row Groups, Column Chunks, Data Pages y FileMetaData en el pie del archivo."
      }
    ]
  },
  {
    "id": "parquet-page-index",
    "term": "Índice de páginas en Parquet (ColumnIndex y OffsetIndex)",
    "englishTerm": "Parquet Page Index (ColumnIndex / OffsetIndex)",
    "track": "de",
    "definition": "Estructura de Parquet que almacena valores mínimo y máximo junto con desplazamientos de bytes por página para omitir lecturas dentro del Row Group.",
    "formula": "ColumnIndex (min/max/null_counts por Data Page) + OffsetIndex (offset + compressed_page_size). Se confunde con: el zone map de nivel Row Group.",
    "relatedLessons": [
      "de2-formatos-01-columnar-parquet",
      "de2-formatos-04-codificacion-compresion-zstd"
    ],
    "relatedTerms": [
      "parquet-row-group",
      "zone-map"
    ],
    "sources": [
      {
        "title": "Apache Parquet Page Index Layout",
        "url": "https://parquet.apache.org/docs/file-format/pageindex/",
        "publisher": "Apache Software Foundation",
        "accessed": "2026-10-29",
        "supports": "Especificación de ColumnIndex y OffsetIndex para filtrado fino a nivel de página."
      }
    ]
  },
  {
    "id": "zone-map",
    "term": "Mapa de zonas (Zone Map / Estadísticas Min-Max)",
    "englishTerm": "Zone Map (Min/Max/Null Count Statistics)",
    "track": "de",
    "definition": "Resumen estadístico que guarda el valor mínimo, el valor máximo y el conteo de nulos de cada bloque para descartar lecturas sin descomprimir páginas.",
    "formula": "Si constante < stats_min_value OR constante > stats_max_value → saltar Row Group o Data Page completa.",
    "relatedLessons": [
      "de2-formatos-01-columnar-parquet",
      "de2-formatos-05-particionado-archivos-pequenos"
    ],
    "relatedTerms": [
      "parquet-row-group",
      "bloom-filter"
    ],
    "sources": [
      {
        "title": "Apache Parquet File Format Specification",
        "url": "https://parquet.apache.org/docs/file-format/",
        "publisher": "Apache Software Foundation",
        "accessed": "2026-10-29",
        "supports": "Estadísticas min, max y null_count almacenadas en ColumnMetaData."
      }
    ]
  },
  {
    "id": "bloom-filter",
    "term": "Filtro de Bloom por bloques divididos (Split Block Bloom Filter)",
    "englishTerm": "Parquet Split Block Bloom Filter",
    "track": "de",
    "definition": "Estructura probabilística de bits basada en hashes xxHash64 que descarta bloques donde un valor puntual de alta cardinalidad no existe con cero falsos negativos.",
    "formula": "Bloque = 256 bits (8 palabras de 32 bits alineadas a SIMD). Si algún bit == 0 → el valor definitivamente no está en el Row Group.",
    "relatedLessons": [
      "de2-formatos-01-columnar-parquet"
    ],
    "relatedTerms": [
      "zone-map",
      "predicate-pushdown"
    ],
    "sources": [
      {
        "title": "Apache Parquet Split Block Bloom Filter Specification",
        "url": "https://parquet.apache.org/docs/file-format/bloomfilter/",
        "publisher": "Apache Software Foundation",
        "accessed": "2026-10-29",
        "supports": "Especificación de bloques de 256 bits y función hash xxHash64 en Parquet."
      }
    ]
  },
  {
    "id": "predicate-pushdown",
    "term": "Empuje de predicados (Predicate Pushdown)",
    "englishTerm": "Predicate Pushdown",
    "track": "de",
    "definition": "Optimización donde el motor traslada los filtros de la consulta hasta el lector de almacenamiento para descartar bloques y páginas antes de materializar filas.",
    "formula": "SELECT ... WHERE status = 'completed' → el lector Parquet evalúa el predicado contra zone maps, diccionarios y filtros de Bloom en disco.",
    "relatedLessons": [
      "de2-formatos-01-columnar-parquet",
      "de2-formatos-03-duckdb-polars-marimo"
    ],
    "relatedTerms": [
      "zone-map",
      "bloom-filter"
    ],
    "sources": [
      {
        "title": "Polars User Guide — Lazy API and Query Optimization",
        "url": "https://docs.pola.rs/user-guide/lazy/",
        "publisher": "Polars Project",
        "accessed": "2026-10-29",
        "supports": "Empuje de predicados y proyecciones hacia el escáner Parquet."
      }
    ]
  },
  {
    "id": "zero-copy",
    "term": "Transferencia sin copia en memoria (Zero-Copy)",
    "englishTerm": "Zero-Copy Memory Sharing",
    "track": "de",
    "definition": "Intercambio de datos entre motores o lenguajes compartiendo directamente las direcciones de memoria de los búferes existentes sin duplicar ni serializar bytes.",
    "formula": "Costo de transferencia = O(1) (intercambio de punteros a RecordBatches de Apache Arrow en la misma máquina).",
    "relatedLessons": [
      "de2-formatos-02-arrow-lance-vortex",
      "de2-formatos-03-duckdb-polars-marimo"
    ],
    "relatedTerms": [
      "arrow-c-data-interface",
      "vectorized-execution"
    ],
    "sources": [
      {
        "title": "Apache Arrow Columnar Format Specification",
        "url": "https://arrow.apache.org/docs/format/Columnar.html",
        "publisher": "Apache Software Foundation",
        "accessed": "2026-10-29",
        "supports": "Disposición de búferes contiguos alineados a 64 bytes para lectura sin copia."
      }
    ]
  },
  {
    "id": "arrow-c-data-interface",
    "term": "Interfaz C de datos de Apache Arrow",
    "englishTerm": "Arrow C Data Interface & C Stream Interface",
    "track": "de",
    "definition": "ABI estándar basada en dos estructuras de C que permite transferir vectores columnares entre procesos o lenguajes mediante punteros de memoria sin serializar datos.",
    "formula": "struct ArrowSchema + struct ArrowArray (buffers: [validity_bitmap, offsets, values]). Se confunde con: Arrow IPC / Feather en disco o red.",
    "relatedLessons": [
      "de2-formatos-02-arrow-lance-vortex",
      "de2-formatos-03-duckdb-polars-marimo"
    ],
    "relatedTerms": [
      "zero-copy",
      "vectorized-execution"
    ],
    "sources": [
      {
        "title": "Apache Arrow C Data Interface Specification",
        "url": "https://arrow.apache.org/docs/format/CDataInterface.html",
        "publisher": "Apache Software Foundation",
        "accessed": "2026-10-29",
        "supports": "Intercambio de memoria sin copia en el mismo proceso mediante estructuras C ligeras."
      }
    ]
  },
  {
    "id": "late-materialization",
    "term": "Materialización tardía (Late Materialization)",
    "englishTerm": "Late Materialization",
    "track": "de",
    "definition": "Estrategia que evalúa primero los filtros sobre columnas escalares ligeras y reconstruye las columnas pesadas únicamente para las posiciones de fila que califican.",
    "formula": "Paso 1: filtrar columna angosta → lista de row_ids. Paso 2: extraer payload_json solo en esos row_ids.",
    "relatedLessons": [
      "de2-formatos-02-arrow-lance-vortex"
    ],
    "relatedTerms": [
      "lance-vortex-acceso-aleatorio",
      "predicate-pushdown"
    ],
    "sources": [
      {
        "title": "Lance Columnar Format Specification",
        "url": "https://github.com/lancedb/lance",
        "publisher": "LanceDB",
        "accessed": "2026-10-29",
        "supports": "Materialización diferida de columnas anchas mediante búsqueda por índice de fila."
      }
    ]
  },
  {
    "id": "lance-vortex-acceso-aleatorio",
    "term": "Formatos columnares de acceso aleatorio (Lance y Vortex)",
    "englishTerm": "Random-Access & Compressed-Execution Columnar Formats",
    "track": "de",
    "definition": "Formatos columnares que separan índices de desplazamiento del almacenamiento de valores para recuperar filas puntuales en microsegundos y ejecutar operaciones sin descomprimir páginas completas.",
    "formula": "Lookup(row_id) = O(1) vía tabla de offsets (Lance) vs descompresión secuencial de Data Page en Parquet. Vortex aplica cascadas de codificación (FastLanes/ALP/FSST).",
    "relatedLessons": [
      "de2-formatos-02-arrow-lance-vortex"
    ],
    "relatedTerms": [
      "zero-copy",
      "late-materialization"
    ],
    "sources": [
      {
        "title": "Vortex Documentation — Extensible Columnar Format",
        "url": "https://docs.vortex.dev/",
        "publisher": "Linux Foundation / SpiralDB",
        "accessed": "2026-10-29",
        "supports": "Ejecución directa sobre vectores comprimidos y compatibilidad con Apache Arrow."
      }
    ]
  },
  {
    "id": "vectorized-execution",
    "term": "Ejecución vectorizada por lotes (DataChunks)",
    "englishTerm": "Vectorized Push-Based Execution",
    "track": "de",
    "definition": "Modelo de procesamiento que aplica operadores sobre lotes de miles de valores contiguos que caben en la caché del procesador usando instrucciones SIMD.",
    "formula": "DataChunk (2 048 filas en DuckDB) cabe en caché L1/L2, reemplazando la invocación fila por fila del modelo Volcano.",
    "relatedLessons": [
      "de2-formatos-03-duckdb-polars-marimo"
    ],
    "relatedTerms": [
      "zero-copy",
      "arrow-c-data-interface"
    ],
    "sources": [
      {
        "title": "DuckDB — Why DuckDB: Vectorized Execution",
        "url": "https://duckdb.org/why_duckdb.html",
        "publisher": "DuckDB Foundation",
        "accessed": "2026-10-29",
        "supports": "Procesamiento en lotes vectorizados que maximizan la localidad de caché en CPU."
      }
    ]
  },
  {
    "id": "marimo-dag-reactivo",
    "term": "Grafo acíclico dirigido reactivo en Marimo",
    "englishTerm": "Marimo Reactive Directed Acyclic Graph (DAG)",
    "track": "de",
    "definition": "Grafo estático de dependencias entre celdas de código en archivos Python puros que recalcula automáticamente las vistas dependientes e impide estados ocultos en memoria.",
    "formula": "Celda A (define df_eventos) → Celda B (consume df_eventos). Prohibido redefinir la misma variable global en dos celdas distintas.",
    "relatedLessons": [
      "de2-formatos-03-duckdb-polars-marimo"
    ],
    "relatedTerms": [
      "vectorized-execution",
      "predicate-pushdown"
    ],
    "sources": [
      {
        "title": "Marimo Documentation — Reactivity and Execution Model",
        "url": "https://docs.marimo.io/guides/reactivity/",
        "publisher": "Marimo Team",
        "accessed": "2026-10-29",
        "supports": "Análisis estático de referencias entre celdas y garantía de reproducibilidad en scripts Python."
      }
    ]
  },
  {
    "id": "codificacion-diccionario-rle",
    "term": "Codificación por diccionario y RLE híbrido (RLE_DICTIONARY)",
    "englishTerm": "Dictionary Encoding & Hybrid Run-Length / Bit-Packing",
    "track": "de",
    "definition": "Técnica que reemplaza valores repetidos por identificadores enteros y comprime rachas consecutivas idénticas mediante longitudes de secuencia antes de aplicar compresión general.",
    "formula": "['web','web','web','app'] → Dictionary {0:'web', 1:'app'} + RLE [(run=3, id=0), (run=1, id=1)].",
    "relatedLessons": [
      "de2-formatos-04-codificacion-compresion-zstd",
      "de2-formatos-05-particionado-archivos-pequenos"
    ],
    "relatedTerms": [
      "empaquetado-delta-zstd",
      "parquet-row-group"
    ],
    "sources": [
      {
        "title": "Apache Parquet Encodings Specification",
        "url": "https://parquet.apache.org/docs/file-format/data-pages/encodings/",
        "publisher": "Apache Software Foundation",
        "accessed": "2026-10-29",
        "supports": "Especificación de PLAIN_DICTIONARY, RLE_DICTIONARY y bit-packing híbrido."
      }
    ]
  },
  {
    "id": "empaquetado-delta-zstd",
    "term": "Empaquetado binario delta y compresión Zstandard",
    "englishTerm": "Delta Binary Packing & Zstandard (RFC 8878)",
    "track": "de",
    "definition": "Combinación que almacena diferencias entre enteros o marcas temporales sucesivas con ancho de bits mínimo y comprime los bloques resultantes mediante el algoritmo Zstandard.",
    "formula": "Δ_i = x_i - x_{i-1}; bits_por_valor = ceil(log2(max(Δ) - min(Δ) + 1)) + compresión ZSTD (LZ77 + ANS/Huffman).",
    "relatedLessons": [
      "de2-formatos-04-codificacion-compresion-zstd"
    ],
    "relatedTerms": [
      "codificacion-diccionario-rle",
      "parquet-row-group"
    ],
    "sources": [
      {
        "title": "RFC 8878 — Zstandard Compression and the 'application/zstd' Media Type",
        "url": "https://datatracker.ietf.org/doc/html/rfc8878",
        "publisher": "IETF",
        "accessed": "2026-10-29",
        "supports": "Especificación del algoritmo Zstandard basado en LZ77, Finite State Entropy (ANS) y codificación Huffman."
      }
    ]
  },
  {
    "id": "particionado-hive-small-files",
    "term": "Particionado físico Hive y problema de archivos pequeños",
    "englishTerm": "Hive Directory Partitioning & Small Files Problem",
    "track": "de",
    "definition": "Degradación de lectura cuando un particionado excesivo fragmenta una tabla en miles de archivos diminutos cuya apertura supera el tiempo de escaneo.",
    "formula": "cardinalidad_particion = Π |col_i|; bytes_promedio_por_archivo = bytes_totales / archivos_creados. Si < 16 MB, la sobrecarga de metadatos supera el I/O.",
    "relatedLessons": [
      "de2-formatos-05-particionado-archivos-pequenos"
    ],
    "relatedTerms": [
      "parquet-row-group",
      "codificacion-diccionario-rle",
      "zone-map"
    ],
    "sources": [
      {
        "title": "DuckDB Documentation — Hive Partitioning",
        "url": "https://duckdb.org/docs/stable/data/partitioning/hive_partitioning.html",
        "publisher": "DuckDB Foundation",
        "accessed": "2026-10-29",
        "supports": "Poda de directorios clave=valor con hive_partitioning y escritura particionada con COPY ... PARTITION_BY."
      }
    ]
  },
  {
    "id": "patron-elt-desacoplado",
    "term": "Patrón ELT (Extraer, Cargar y Transformar)",
    "englishTerm": "Extract, Load, Transform (Decoupled Storage & Compute)",
    "track": "de",
    "definition": "Arquitectura donde los datos crudos se copian primero al almacenamiento de objetos y se transforman después dentro del motor analítico conservando la fuente original.",
    "formula": "COPY raw_orders TO 's3://brisa-raw/orders/dt=2025-11-01/part-0.parquet';  -- Se confunde con: ETL clásico, que transforma en un servidor intermedio antes de guardar y descarta el dato crudo.",
    "relatedLessons": [
      "de2-pipelines-01-etl-vs-elt",
      "de2-pipelines-02-idempotencia-backfill"
    ],
    "relatedTerms": [
      "almacenamiento-objetos-inmutable",
      "idempotencia-pipeline"
    ],
    "sources": [
      {
        "title": "DuckDB Documentation — Parquet Overview and Export",
        "url": "https://duckdb.org/docs/data/parquet/overview",
        "publisher": "DuckDB Foundation",
        "accessed": "2026-10-29",
        "supports": "Lectura y escritura directa sobre archivos Parquet en almacenamiento desacoplado."
      }
    ]
  },
  {
    "id": "almacenamiento-objetos-inmutable",
    "term": "Zona de aterrizaje inmutable (Raw Landing Zone)",
    "englishTerm": "Immutable Raw / Bronze Landing Zone",
    "track": "de",
    "definition": "Capa inicial de almacenamiento donde los lotes extraídos de sistemas externos se guardan sin alteraciones ni borrados para permitir auditorías y reprocesamientos completos futuros.",
    "formula": "s3://mercado-brisa/raw/payments/ingest_date=2025-11-26/batch_01.parquet  # Se confunde con: una tabla Silver limpia, donde ya se filtraron errores y se deduplicaron registros.",
    "relatedLessons": [
      "de2-pipelines-01-etl-vs-elt",
      "de2-pipelines-02-idempotencia-backfill"
    ],
    "relatedTerms": [
      "patron-elt-desacoplado",
      "reprocesamiento-historico-backfill"
    ],
    "sources": [
      {
        "title": "Apache Parquet Format Specification",
        "url": "https://parquet.apache.org/docs/file-format/",
        "publisher": "Apache Software Foundation",
        "accessed": "2026-10-29",
        "supports": "Persistencia inmutable por lotes columnares con esquema embebido en almacenamiento de objetos."
      }
    ]
  },
  {
    "id": "idempotencia-pipeline",
    "term": "Idempotencia en tuberías de datos",
    "englishTerm": "Pipeline Idempotency",
    "track": "de",
    "definition": "Propiedad matemática por la cual ejecutar una tarea de datos una o varias veces sobre la misma entrada produce exactamente el mismo estado final.",
    "formula": "DELETE FROM silver.orders WHERE order_date = '2025-11-01'; INSERT INTO silver.orders ...  -- Se confunde con: usar INSERT INTO sin limpiar ni deduplicar, que duplica filas en cada reintento.",
    "relatedLessons": [
      "de2-pipelines-02-idempotencia-backfill",
      "de2-pipelines-03-cargas-incrementales-merge",
      "de2-pipelines-04-ingesta-apis-http"
    ],
    "relatedTerms": [
      "reprocesamiento-historico-backfill",
      "operacion-merge-upsert"
    ],
    "sources": [
      {
        "title": "Apache Airflow Documentation — Best Practices: Writing a DAG (Idempotency)",
        "url": "https://airflow.apache.org/docs/apache-airflow/stable/best-practices.html",
        "publisher": "Apache Software Foundation",
        "accessed": "2026-10-29",
        "supports": "Diseño de tareas deterministas e idempotentes ante reintentos automáticos del orquestador."
      }
    ]
  },
  {
    "id": "reprocesamiento-historico-backfill",
    "term": "Reprocesamiento histórico por partición (Backfill)",
    "englishTerm": "Partitioned Historical Backfill",
    "track": "de",
    "definition": "Ejecución controlada de una tubería sobre intervalos de fechas pasadas para recalcular tablas tras corregir un error de lógica o incorporar una columna nueva.",
    "formula": "dagster asset materialize --select fct_orders --partition-range 2025-10-01...2025-10-31  # Se confunde con: usar CURRENT_DATE dentro del SQL, que impide recalcular fechas históricas.",
    "relatedLessons": [
      "de2-pipelines-02-idempotencia-backfill",
      "de2-pipelines-05-orquestacion-airflow-dagster"
    ],
    "relatedTerms": [
      "idempotencia-pipeline",
      "orquestacion-orientada-activos"
    ],
    "sources": [
      {
        "title": "Dagster Documentation — Assets and Partitions Guide",
        "url": "https://docs.dagster.io/guides/build/assets",
        "publisher": "Dagster Labs",
        "accessed": "2026-10-29",
        "supports": "Materialización y reprocesamiento histórico acotado por particiones lógicas."
      }
    ]
  },
  {
    "id": "marca-agua-lote-watermark",
    "term": "Marca de agua de lote (Batch High-Watermark)",
    "englishTerm": "Batch High-Watermark & Lookback Window",
    "track": "de",
    "definition": "Valor máximo de fecha o identificador procesado en la corrida previa que delimita desde qué punto extraer registros nuevos junto con una ventana retroactiva.",
    "formula": "WHERE payment_ts >= (SELECT MAX(payment_ts) - INTERVAL '2 hours' FROM silver.payments)  -- Se confunde con: filtrar sin ventana de seguridad, que pierde eventos llegados con retraso.",
    "relatedLessons": [
      "de2-pipelines-03-cargas-incrementales-merge"
    ],
    "relatedTerms": [
      "operacion-merge-upsert",
      "idempotencia-pipeline"
    ],
    "sources": [
      {
        "title": "dbt Documentation — About Incremental Models",
        "url": "https://docs.getdbt.com/docs/build/incremental-models",
        "publisher": "dbt Labs",
        "accessed": "2026-10-29",
        "supports": "Filtrado incremental mediante marca de agua temporal y reconciliación de llegadas tardías."
      }
    ]
  },
  {
    "id": "operacion-merge-upsert",
    "term": "Actualización e inserción atómica (MERGE INTO)",
    "englishTerm": "SQL MERGE INTO / Atomic Upsert",
    "track": "de",
    "definition": "Sentencia SQL estándar que compara un lote entrante contra una tabla destino por clave primaria para actualizar filas existentes e insertar filas nuevas atómicamente.",
    "formula": "MERGE INTO dim_orders t USING stg_batch s ON t.order_id = s.order_id WHEN MATCHED THEN UPDATE ... WHEN NOT MATCHED THEN INSERT ...  -- Se confunde con: hacer INSERT directo sin deduplicar la fuente.",
    "relatedLessons": [
      "de2-pipelines-03-cargas-incrementales-merge"
    ],
    "relatedTerms": [
      "marca-agua-lote-watermark",
      "idempotencia-pipeline"
    ],
    "sources": [
      {
        "title": "DuckDB Documentation — MERGE INTO Statement",
        "url": "https://duckdb.org/docs/stable/sql/statements/merge_into",
        "publisher": "DuckDB Foundation",
        "accessed": "2026-10-29",
        "supports": "Sintaxis y semántica transaccional de MERGE INTO con cláusulas WHEN MATCHED y WHEN NOT MATCHED."
      }
    ]
  },
  {
    "id": "paginacion-cursor-backoff",
    "term": "Paginación por cursor y retroceso exponencial con jitter",
    "englishTerm": "Cursor Pagination & Exponential Backoff with Jitter",
    "track": "de",
    "definition": "Técnica de extracción HTTP que recorre páginas mediante un puntero opaco ordenado y espacia los reintentos con espera exponencial más azar ante errores transitorios.",
    "formula": "sleep_s = random.uniform(0, min(60, 2 ** attempt))  # Se confunde con: paginar con OFFSET en tablas vivas o reintentar al instante sin pausa ni jitter.",
    "relatedLessons": [
      "de2-pipelines-04-ingesta-apis-http"
    ],
    "relatedTerms": [
      "idempotencia-pipeline",
      "almacenamiento-objetos-inmutable"
    ],
    "sources": [
      {
        "title": "AWS Architecture Blog — Exponential Backoff And Jitter",
        "url": "https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/",
        "publisher": "Amazon Web Services",
        "accessed": "2026-10-29",
        "supports": "Prevención de tormentas de reintentos sincronizados mediante Full Jitter sobre espera exponencial."
      }
    ]
  },
  {
    "id": "orquestacion-orientada-activos",
    "term": "Orquestación orientada a activos de datos (Data Assets)",
    "englishTerm": "Asset-Centric Data Orchestration",
    "track": "de",
    "definition": "Modelo de programación donde el grafo declara qué tablas o archivos produce cada función y el orquestador rastrea su linaje, frescura y particiones automáticamente.",
    "formula": "@asset(partitions_def=DailyPartitionsDefinition(start_date='2025-01-01')) def fct_orders(): ...  # Se confunde con: encadenar scripts imperativos ciegos que desconocen qué tabla materializan.",
    "relatedLessons": [
      "de2-pipelines-05-orquestacion-airflow-dagster",
      "de2-pipelines-06-contenedores-docker-compose"
    ],
    "relatedTerms": [
      "reprocesamiento-historico-backfill",
      "idempotencia-pipeline"
    ],
    "sources": [
      {
        "title": "Apache Airflow Documentation — Data-Aware Scheduling and Assets",
        "url": "https://airflow.apache.org/docs/apache-airflow/stable/authoring-and-scheduling/datasets.html",
        "publisher": "Apache Software Foundation",
        "accessed": "2026-10-29",
        "supports": "Planificación reactiva basada en activos de datos en Airflow 3 comparada con Dagster."
      }
    ]
  },
  {
    "id": "iceberg-deletion-vectors",
    "term": "Deletion Vectors (Iceberg v3)",
    "track": "de",
    "definition": "Mapa de bits Roaring64 almacenado en archivos Puffin que marca filas eliminadas por posición física sin reescribir el archivo Parquet original bajo estrategia Merge-on-Read.",
    "formula": "DV_nuevo = bitmap_or(DV_previo, posiciones_borradas)  [<= 1 DV activo por archivo Parquet]",
    "relatedLessons": [
      "de3-lakehouse-01-iceberg-v3-medallion",
      "de3-lakehouse-02-delta-lake-uniform"
    ],
    "relatedTerms": [
      "c18-iceberg-v3",
      "hidden-partitioning",
      "write-audit-publish"
    ],
    "sources": [
      {
        "title": "Apache Iceberg Table Spec (Format Version 3 - Deletion Vectors)",
        "url": "https://iceberg.apache.org/spec/",
        "publisher": "Apache Software Foundation",
        "accessed": "2026-10-29",
        "supports": "Especificación de Deletion Vectors como bitmaps Roaring64 con a lo sumo un vector activo por archivo Parquet."
      },
      {
        "title": "Apache Iceberg Puffin File Specification",
        "url": "https://iceberg.apache.org/puffin-spec/",
        "publisher": "Apache Software Foundation",
        "accessed": "2026-10-29",
        "supports": "Estructura binaria del archivo lateral Puffin que encapsula blobs deletion-vector-v1."
      }
    ]
  },
  {
    "id": "hidden-partitioning",
    "term": "Particionado oculto (Hidden Partitioning)",
    "track": "de",
    "definition": "Mecanismo de Apache Iceberg que almacena transformaciones de partición en los metadatos para podar archivos automáticamente al filtrar la columna base sin columnas derivadas.",
    "formula": "partition-spec: [month(order_ts), bucket(16, customer_id)]",
    "relatedLessons": [
      "de3-lakehouse-01-iceberg-v3-medallion",
      "de3-lakehouse-04-costos-bigquery-snowflake-databricks"
    ],
    "relatedTerms": [
      "c18-iceberg-v3",
      "iceberg-deletion-vectors",
      "liquid-clustering"
    ],
    "sources": [
      {
        "title": "Apache Iceberg Partitioning and Hidden Partitioning",
        "url": "https://iceberg.apache.org/docs/latest/partitioning/",
        "publisher": "Apache Software Foundation",
        "accessed": "2026-10-29",
        "supports": "Transformaciones declarativas en partition-spec y evolución de particionado sin reescribir tablas."
      }
    ]
  },
  {
    "id": "write-audit-publish",
    "term": "Patrón Write-Audit-Publish (WAP)",
    "track": "de",
    "definition": "Flujo de calidad en tablas transaccionales que escribe datos nuevos en una rama aislada, ejecuta validaciones automáticas y publica la instantánea solo tras aprobarlas.",
    "formula": "WRITE (branch = 'audit') -> AUDIT (SQL checks) -> FAST-FORWARD ('main')",
    "relatedLessons": [
      "de3-lakehouse-01-iceberg-v3-medallion"
    ],
    "relatedTerms": [
      "c17-medallion-architecture",
      "c18-iceberg-v3",
      "iceberg-deletion-vectors"
    ],
    "sources": [
      {
        "title": "Apache Iceberg Branching and Tagging (WAP Pattern)",
        "url": "https://iceberg.apache.org/docs/latest/branching/",
        "publisher": "Apache Software Foundation",
        "accessed": "2026-10-29",
        "supports": "Aislamiento de escrituras en ramas secundarias y promoción fast-forward hacia la rama main."
      }
    ]
  },
  {
    "id": "delta-transaction-log",
    "term": "Registro transaccional (_delta_log)",
    "track": "de",
    "definition": "Secuencia ordenada de archivos JSON y puntos de control Parquet que registra atómicamente cada cambio de esquema, metadatos y archivos en tablas Delta Lake.",
    "formula": "Estado(v_n) = Checkpoint(v_k) + sum_{i=k+1..n} Acciones(add, remove, metaData, protocol)",
    "relatedLessons": [
      "de3-lakehouse-02-delta-lake-uniform"
    ],
    "relatedTerms": [
      "delta-uniform",
      "liquid-clustering"
    ],
    "sources": [
      {
        "title": "Delta Transaction Log Protocol Specification",
        "url": "https://raw.githubusercontent.com/delta-io/delta/master/PROTOCOL.md",
        "publisher": "Linux Foundation / Delta Lake",
        "accessed": "2026-10-29",
        "supports": "Acciones atómicas del registro _delta_log y compactación de estado en puntos de control Parquet."
      }
    ]
  },
  {
    "id": "delta-uniform",
    "term": "Delta Universal Format (UniForm)",
    "track": "de",
    "definition": "Capa de interoperabilidad en Delta Lake que genera asíncronamente metadatos de Apache Iceberg sobre los mismos archivos Parquet físicos sin duplicar el almacenamiento subyacente.",
    "formula": "Parquet único + _delta_log (Delta) + metadata.json/Avro (IcebergCompatV2)",
    "relatedLessons": [
      "de3-lakehouse-02-delta-lake-uniform",
      "de3-lakehouse-03-catalogos-polaris-unity"
    ],
    "relatedTerms": [
      "delta-transaction-log",
      "c18-iceberg-v3",
      "iceberg-rest-catalog"
    ],
    "sources": [
      {
        "title": "Delta Universal Format (UniForm) Documentation",
        "url": "https://docs.delta.io/delta-uniform/",
        "publisher": "Linux Foundation / Delta Lake",
        "accessed": "2026-10-29",
        "supports": "Conversión asíncrona de commits Delta hacia metadatos Iceberg mediante IcebergCompatV2."
      }
    ]
  },
  {
    "id": "liquid-clustering",
    "term": "Liquid Clustering",
    "track": "de",
    "definition": "Técnica de organización física en Delta Lake basada en curvas espaciales Hilbert que reagrupa archivos incrementalmente sin particiones rígidas ni reescrituras completas de tabla.",
    "formula": "ALTER TABLE orders CLUSTER BY (country_code, order_date)",
    "relatedLessons": [
      "de3-lakehouse-02-delta-lake-uniform",
      "de3-lakehouse-04-costos-bigquery-snowflake-databricks"
    ],
    "relatedTerms": [
      "delta-transaction-log",
      "delta-uniform",
      "hidden-partitioning"
    ],
    "sources": [
      {
        "title": "Delta Lake Liquid Clustering Documentation",
        "url": "https://docs.delta.io/delta-clustering/",
        "publisher": "Linux Foundation / Delta Lake",
        "accessed": "2026-10-29",
        "supports": "Agrupación espacial incremental en Z-cubes y evolución de claves sin reescritura histórica."
      }
    ]
  },
  {
    "id": "iceberg-rest-catalog",
    "term": "Catálogo Iceberg REST (Apache Polaris)",
    "track": "de",
    "definition": "Interfaz estándar OpenAPI que coordina commits atómicos entre múltiples motores de consulta y emite credenciales temporales delegadas sobre el almacenamiento de objetos en nube.",
    "formula": "POST /v1/{prefix}/namespaces/{ns}/tables/{table} -> metadata-location + STS vended-credentials",
    "relatedLessons": [
      "de3-lakehouse-03-catalogos-polaris-unity",
      "de3-lakehouse-01-iceberg-v3-medallion"
    ],
    "relatedTerms": [
      "unity-catalog-governance",
      "c18-iceberg-v3",
      "delta-uniform"
    ],
    "sources": [
      {
        "title": "Apache Polaris Open Source REST Catalog for Apache Iceberg",
        "url": "https://polaris.apache.org/",
        "publisher": "Apache Software Foundation",
        "accessed": "2026-10-29",
        "supports": "Especificación REST OpenAPI para catálogos Iceberg, RBAC y emisión de credenciales delegadas."
      }
    ]
  },
  {
    "id": "unity-catalog-governance",
    "term": "Gobierno unificado (Unity Catalog)",
    "track": "de",
    "definition": "Plano de control con jerarquía de tres niveles que centraliza permisos, filtros de fila, máscaras de columna y linaje automático para datos e inteligencia artificial.",
    "formula": "catalogo.esquema.tabla + ROW FILTER fn() + COLUMN MASK fn()",
    "relatedLessons": [
      "de3-lakehouse-03-catalogos-polaris-unity",
      "de3-lakehouse-02-delta-lake-uniform"
    ],
    "relatedTerms": [
      "iceberg-rest-catalog",
      "delta-uniform"
    ],
    "sources": [
      {
        "title": "Unity Catalog Open Source Documentation",
        "url": "https://unitycatalog.io/",
        "publisher": "Linux Foundation AI & Data",
        "accessed": "2026-10-29",
        "supports": "Espacio de nombres de tres niveles y gobierno abierto sobre tablas y volúmenes."
      },
      {
        "title": "Databricks Unity Catalog Data Governance",
        "url": "https://docs.databricks.com/aws/en/data-governance/unity-catalog/",
        "publisher": "Databricks",
        "accessed": "2026-10-29",
        "supports": "Seguridad a nivel de fila (RLS), máscaras de columna (CLS) y linaje de columnas."
      }
    ]
  },
  {
    "id": "snowflake-micro-partitions",
    "term": "Micro-particiones y Virtual Warehouses",
    "track": "de",
    "definition": "Arquitectura de Snowflake que separa bloques columnares inmutables con metadatos de rango y clústeres de cómputo efímeros facturados por segundo con mínimo de sesenta.",
    "formula": "Costo_créditos = max(60s, t_activo_s) * (créditos_hora_talla / 3600)",
    "relatedLessons": [
      "de3-lakehouse-04-costos-bigquery-snowflake-databricks"
    ],
    "relatedTerms": [
      "bigquery-slots-pruning",
      "liquid-clustering"
    ],
    "sources": [
      {
        "title": "Snowflake Understanding Compute Cost",
        "url": "https://docs.snowflake.com/en/user-guide/cost-understanding-compute",
        "publisher": "Snowflake",
        "accessed": "2026-10-29",
        "supports": "Modelo de facturación de créditos por segundo con mínimo de 60 segundos en Virtual Warehouses."
      }
    ]
  },
  {
    "id": "bigquery-slots-pruning",
    "term": "Slots de BigQuery y poda de escaneo",
    "track": "de",
    "definition": "Modelo de ejecución distribuida en BigQuery donde el costo depende de los bytes leídos tras podar particiones o de las unidades virtuales de cómputo reservadas.",
    "formula": "Costo_OnDemand = TiB_leídos_en_columnas_y_particiones * Tarifa_TiB",
    "relatedLessons": [
      "de3-lakehouse-04-costos-bigquery-snowflake-databricks"
    ],
    "relatedTerms": [
      "snowflake-micro-partitions",
      "hidden-partitioning"
    ],
    "sources": [
      {
        "title": "Google Cloud BigQuery Pricing",
        "url": "https://cloud.google.com/bigquery/pricing",
        "publisher": "Google Cloud",
        "accessed": "2026-10-29",
        "supports": "Comparativa entre facturación On-Demand por bytes escaneados y capacidad reservada en Slots."
      }
    ]
  },
  {
    "id": "modelo-incremental-ventana",
    "term": "Modelo incremental con ventana deslizante (Incremental Lookback Window)",
    "englishTerm": "Incremental Lookback Window",
    "track": "de",
    "definition": "Estrategia de materialización incremental que reprocesa un intervalo temporal reciente mediante operaciones idempotentes para absorber eventos tardíos sin recalcular toda la tabla histórica.",
    "formula": "WHERE event_ts >= (SELECT MAX(event_ts) - INTERVAL '3 days' FROM {{ this }})",
    "relatedLessons": [
      "de3-transformacion-01-dbt-sqlmesh-dag",
      "de3-transformacion-02-tests-unitarios-auditorias-dag"
    ],
    "relatedTerms": [
      "entorno-virtual-datos",
      "grafo-linaje-declarativo"
    ],
    "sources": [
      {
        "title": "dbt Labs — About incremental models",
        "url": "https://docs.getdbt.com/docs/build/incremental-models",
        "publisher": "dbt Labs",
        "accessed": "2026-10-29",
        "supports": "Estrategias incrementales, claves únicas y ventanas deslizantes para eventos tardíos."
      }
    ]
  },
  {
    "id": "entorno-virtual-datos",
    "term": "Entorno virtual de datos (Virtual Data Environment)",
    "englishTerm": "Virtual Data Environment",
    "track": "de",
    "definition": "Arquitectura popularizada por SQLMesh donde cada rama apunta mediante vistas ligeras a tablas físicas inmutables identificadas por la huella semántica de su código.",
    "formula": "CREATE OR REPLACE VIEW prod.fct_payments AS SELECT * FROM sqlmesh__fct_payments__<semantic_hash>",
    "relatedLessons": [
      "de3-transformacion-01-dbt-sqlmesh-dag"
    ],
    "relatedTerms": [
      "modelo-incremental-ventana",
      "grafo-linaje-declarativo"
    ],
    "sources": [
      {
        "title": "SQLMesh — Virtual Data Environments",
        "url": "https://sqlmesh.readthedocs.io/en/stable/concepts/environments/",
        "publisher": "Tobiko Data",
        "accessed": "2026-10-29",
        "supports": "Promoción instantánea de entornos mediante vistas y huellas de árbol sintáctico."
      }
    ]
  },
  {
    "id": "grafo-linaje-declarativo",
    "term": "Grafo de linaje declarativo (Declarative Lineage DAG)",
    "englishTerm": "Declarative Lineage DAG",
    "track": "de",
    "definition": "Grafo acíclico dirigido inferido automáticamente al compilar referencias entre modelos SQL o analizar el árbol sintáctico, garantizando un orden de ejecución topológico determinista.",
    "formula": "SELECT * FROM {{ ref('stg_payments') }} JOIN {{ source('raw', 'orders') }}",
    "relatedLessons": [
      "de3-transformacion-01-dbt-sqlmesh-dag",
      "de3-transformacion-04-observabilidad-openlineage"
    ],
    "relatedTerms": [
      "entorno-virtual-datos",
      "linaje-columna-openlineage"
    ],
    "sources": [
      {
        "title": "dbt Labs — About ref function",
        "url": "https://docs.getdbt.com/reference/dbt-jinja-functions/ref",
        "publisher": "dbt Labs",
        "accessed": "2026-10-29",
        "supports": "Construcción automática del grafo de dependencias mediante la función ref."
      }
    ]
  },
  {
    "id": "prueba-unitaria-sql",
    "term": "Prueba unitaria SQL (SQL Unit Test)",
    "englishTerm": "SQL Unit Test",
    "track": "de",
    "definition": "Verificación determinista de la lógica de una consulta que inyecta filas sintéticas fijas mediante expresiones tabulares comunes y compara el resultado antes de materializar.",
    "formula": "WITH mock_input AS (VALUES (...)), actual AS (...), diff AS (SELECT * FROM actual EXCEPT SELECT * FROM expected)",
    "relatedLessons": [
      "de3-transformacion-02-tests-unitarios-auditorias-dag"
    ],
    "relatedTerms": [
      "auditoria-bloqueante-wap",
      "prueba-singular-datos"
    ],
    "sources": [
      {
        "title": "dbt Labs — Unit tests",
        "url": "https://docs.getdbt.com/docs/build/unit-tests",
        "publisher": "dbt Labs",
        "accessed": "2026-10-29",
        "supports": "Pruebas unitarias de lógica SQL con entradas simuladas antes de materializar tablas."
      }
    ]
  },
  {
    "id": "auditoria-bloqueante-wap",
    "term": "Auditoría bloqueante WAP (Blocking Write-Audit-Publish Audit)",
    "englishTerm": "Blocking WAP Audit",
    "track": "de",
    "definition": "Regla de calidad evaluada sobre una tabla intermedia aislada que aborta la publicación hacia producción si la consulta de validación devuelve cualquier fila anómala.",
    "formula": "AUDIT (name assert_positive_price, blocking true); SELECT * FROM @this_model WHERE list_price_usd <= 0;",
    "relatedLessons": [
      "de3-transformacion-02-tests-unitarios-auditorias-dag",
      "de3-transformacion-01-dbt-sqlmesh-dag"
    ],
    "relatedTerms": [
      "prueba-unitaria-sql",
      "prueba-singular-datos"
    ],
    "sources": [
      {
        "title": "SQLMesh — Audits",
        "url": "https://sqlmesh.readthedocs.io/en/stable/concepts/audits/",
        "publisher": "Tobiko Data",
        "accessed": "2026-10-29",
        "supports": "Auditorías bloqueantes y no bloqueantes dentro del ciclo Write-Audit-Publish."
      }
    ]
  },
  {
    "id": "prueba-singular-datos",
    "term": "Prueba singular de datos (Singular Data Test)",
    "englishTerm": "Singular Data Test",
    "track": "de",
    "definition": "Consulta SQL específica de dominio que busca contraejemplos de una regla de negocio entre múltiples tablas y aprueba únicamente cuando devuelve cero registros.",
    "formula": "SELECT r.order_id FROM refunds r JOIN orders o USING (order_id) WHERE o.status = 'cancelled'",
    "relatedLessons": [
      "de3-transformacion-02-tests-unitarios-auditorias-dag"
    ],
    "relatedTerms": [
      "auditoria-bloqueante-wap",
      "prueba-unitaria-sql"
    ],
    "sources": [
      {
        "title": "dbt Labs — Add data tests to your DAG",
        "url": "https://docs.getdbt.com/docs/build/data-tests",
        "publisher": "dbt Labs",
        "accessed": "2026-10-29",
        "supports": "Pruebas de datos genéricas y singulares orientadas a detectar filas que violan invariantes."
      }
    ]
  },
  {
    "id": "contrato-datos-odcs",
    "term": "Contrato de datos ejecutable (Open Data Contract Standard)",
    "englishTerm": "Executable Data Contract (ODCS v3)",
    "track": "de",
    "definition": "Acuerdo técnico ejecutable entre productores y consumidores que especifica esquema físico, tipos exactos, restricciones de nulidad, reglas de calidad y acuerdos de servicio.",
    "formula": "apiVersion: v3.0.2 | kind: DataContract | contract: { enforced: true }",
    "relatedLessons": [
      "de3-transformacion-03-contracts-semantic-layer"
    ],
    "relatedTerms": [
      "capa-semantica-metricas",
      "auditoria-bloqueante-wap"
    ],
    "sources": [
      {
        "title": "Bitol — Open Data Contract Standard (ODCS)",
        "url": "https://bitol-io.github.io/open-data-contract-standard/latest/",
        "publisher": "Bitol / Linux Foundation AI & Data",
        "accessed": "2026-10-29",
        "supports": "Especificación estándar ODCS v3 para contratos de datos ejecutables."
      }
    ]
  },
  {
    "id": "capa-semantica-metricas",
    "term": "Capa semántica de métricas (Semantic Layer)",
    "englishTerm": "Semantic Layer",
    "track": "bi",
    "definition": "Capa intermedia que centraliza entidades, dimensiones y fórmulas de métricas de negocio para traducir peticiones analíticas en consultas SQL consistentes sin multiplicar filas.",
    "formula": "net_retention_pct = 100.0 * SUM(net_revenue_usd) / NULLIF(SUM(gross_revenue_usd), 0)",
    "relatedLessons": [
      "de3-transformacion-03-contracts-semantic-layer"
    ],
    "relatedTerms": [
      "contrato-datos-odcs",
      "grafo-linaje-declarativo"
    ],
    "sources": [
      {
        "title": "dbt Labs — Semantic models & MetricFlow",
        "url": "https://docs.getdbt.com/docs/build/semantic-models",
        "publisher": "dbt Labs",
        "accessed": "2026-10-29",
        "supports": "Definición declarativa de entidades, dimensiones y métricas gobernadas."
      }
    ]
  },
  {
    "id": "observabilidad-cuatro-pilares",
    "term": "Observabilidad de datos (Data Observability)",
    "englishTerm": "Data Observability",
    "track": "de",
    "definition": "Monitoreo continuo de la salud de los activos analíticos mediante telemetría automatizada sobre cuatro dimensiones operativas: frescura, volumen, distribución estadística y cambios estructurales.",
    "formula": "freshness_lag_hours = EXTRACT(EPOCH FROM (NOW() - MAX(event_ts))) / 3600.0",
    "relatedLessons": [
      "de3-transformacion-04-observabilidad-openlineage"
    ],
    "relatedTerms": [
      "linaje-columna-openlineage",
      "auditoria-bloqueante-wap"
    ],
    "sources": [
      {
        "title": "OpenLineage — Data Quality Metrics Facet",
        "url": "https://openlineage.io/docs/spec/facets/dataset-facets/data_quality_metrics",
        "publisher": "Linux Foundation AI & Data",
        "accessed": "2026-10-29",
        "supports": "Métricas estandarizadas de volumen, nulidad y distribución por dataset y columna."
      }
    ]
  },
  {
    "id": "linaje-columna-openlineage",
    "term": "Linaje a nivel de columna (Column-Level Lineage)",
    "englishTerm": "Column-Level Lineage (OpenLineage)",
    "track": "de",
    "definition": "Trazabilidad fina especificada en OpenLineage que vincula cada atributo de salida con las columnas origen y el tipo de transformación directa o indirecta.",
    "formula": "facets.columnLineage.fields.<output_col>.inputFields = [{ namespace, name, field }]",
    "relatedLessons": [
      "de3-transformacion-04-observabilidad-openlineage",
      "de3-transformacion-01-dbt-sqlmesh-dag"
    ],
    "relatedTerms": [
      "observabilidad-cuatro-pilares",
      "grafo-linaje-declarativo"
    ],
    "sources": [
      {
        "title": "OpenLineage — Column Lineage Dataset Facet",
        "url": "https://openlineage.io/docs/spec/facets/dataset-facets/column_lineage_facet",
        "publisher": "Linux Foundation AI & Data",
        "accessed": "2026-10-29",
        "supports": "Especificación de linaje a nivel de columna e impacto de transformaciones."
      }
    ]
  },
  {
    "id": "spark-shuffle-intercambio",
    "term": "Shuffle (redistribución de datos en red)",
    "englishTerm": "Data Shuffle",
    "track": "de",
    "definition": "Operación física en motores distribuidos como Apache Spark donde los nodos intercambian registros por red para agrupar valores con el mismo identificador de partición. Ocurre en operaciones anchas como agregaciones, ordenamientos globales y cruces sin difusión previa, e implica serialización, escritura en disco local y transferencia entre ejecutores.",
    "formula": "Costo_Shuffle = Bytes_Serializados + I/O_Disco_Local + Trafico_Red",
    "relatedLessons": [
      "de4-plataforma-01-spark-4-shuffles-skew-ansi"
    ],
    "relatedTerms": [
      "sesgo-datos-data-skew",
      "spark-aqe-adaptativo"
    ],
    "sources": [
      {
        "title": "Spark SQL, DataFrames and Datasets Guide — Performance Tuning",
        "url": "https://spark.apache.org/docs/latest/sql-performance-tuning.html",
        "publisher": "Apache Software Foundation",
        "accessed": "2026-10-29",
        "supports": "Mecánica de particiones de intercambio (shuffle) y ajuste de rendimiento en Spark SQL."
      }
    ]
  },
  {
    "id": "sesgo-datos-data-skew",
    "term": "Sesgo de datos en particiones (data skew)",
    "englishTerm": "Data Skew",
    "track": "de",
    "definition": "Distribución asimétrica del volumen de filas o bytes entre las particiones de un trabajo distribuido, provocada por identificadores muy frecuentes o valores nulos concentrados. Genera tareas rezagadas (stragglers) donde un único ejecutor procesa una fracción desproporcionada del trabajo mientras el resto del clúster permanece ocioso.",
    "formula": "Factor_Sesgo = Filas_Particion_Maxima / Mediana_Filas_Particion",
    "relatedLessons": [
      "de4-plataforma-01-spark-4-shuffles-skew-ansi"
    ],
    "relatedTerms": [
      "spark-shuffle-intercambio",
      "spark-aqe-adaptativo"
    ],
    "sources": [
      {
        "title": "Spark SQL Performance Tuning — Optimizing Skew Join",
        "url": "https://spark.apache.org/docs/latest/sql-performance-tuning.html",
        "publisher": "Apache Software Foundation",
        "accessed": "2026-10-29",
        "supports": "Detección y particionado automático de cruces con sesgo de datos mediante AQE."
      }
    ]
  },
  {
    "id": "spark-aqe-adaptativo",
    "term": "Ejecución adaptativa de consultas (AQE)",
    "englishTerm": "Adaptive Query Execution",
    "track": "de",
    "definition": "Mecanismo de optimización en tiempo de ejecución de Apache Spark que reevalúa el plan físico de consulta al finalizar cada etapa de intercambio (shuffle). Utiliza estadísticas reales de bytes y conteos de filas para fusionar particiones pequeñas, dividir particiones sesgadas y convertir cruces costosos en cruces por difusión (broadcast).",
    "relatedLessons": [
      "de4-plataforma-01-spark-4-shuffles-skew-ansi"
    ],
    "relatedTerms": [
      "spark-shuffle-intercambio",
      "sesgo-datos-data-skew"
    ],
    "sources": [
      {
        "title": "Spark SQL Performance Tuning — Adaptive Query Execution",
        "url": "https://spark.apache.org/docs/latest/sql-performance-tuning.html",
        "publisher": "Apache Software Foundation",
        "accessed": "2026-10-29",
        "supports": "Coalescencia de particiones post-shuffle, conversión dinámica de joins y manejo de skew en AQE."
      }
    ]
  },
  {
    "id": "spark-modo-ansi",
    "term": "Modo ANSI SQL estricto",
    "englishTerm": "ANSI SQL Compliance Mode",
    "track": "de",
    "definition": "Configuración activada por defecto en Apache Spark 4.0 (spark.sql.ansi.enabled=true) que aplica las reglas del estándar SQL en conversiones de tipos y operaciones aritméticas. Lanza excepciones explícitas ante desbordamientos numéricos, divisiones por cero o conversiones de texto inválidas en lugar de insertar valores nulos de forma silenciosa.",
    "relatedLessons": [
      "de4-plataforma-01-spark-4-shuffles-skew-ansi"
    ],
    "relatedTerms": [
      "spark-aqe-adaptativo"
    ],
    "sources": [
      {
        "title": "ANSI Compliance — Apache Spark Documentation",
        "url": "https://spark.apache.org/docs/latest/sql-ref-ansi-compliance.html",
        "publisher": "Apache Software Foundation",
        "accessed": "2026-10-29",
        "supports": "Comportamiento por defecto de spark.sql.ansi.enabled en Spark 4.0 y reglas de conversión de tipos."
      }
    ]
  },
  {
    "id": "planos-arquitectura-datos",
    "term": "Separación de planos en plataforma de datos",
    "englishTerm": "Data Platform Plane Separation",
    "track": "de",
    "definition": "Patrón de diseño que desacopla una plataforma de datos en cuatro subsistemas con escalado independiente: ingesta (captura por lotes y eventos), almacenamiento abierto en objetos (Parquet e Iceberg), cómputo efímero distribuido o local (Spark, Flink, DuckDB) y consumo gobernado con acuerdos de nivel de servicio diferenciados.",
    "relatedLessons": [
      "de4-plataforma-02-arquitectura-integral-plataforma",
      "de4-plataforma-06-entrevista-system-design-de"
    ],
    "relatedTerms": [
      "c17-medallion-architecture",
      "c18-iceberg-v3"
    ],
    "sources": [
      {
        "title": "Apache Iceberg Table Specification",
        "url": "https://iceberg.apache.org/spec/",
        "publisher": "Apache Software Foundation",
        "accessed": "2026-10-29",
        "supports": "Desacoplamiento entre catálogo, almacenamiento en formatos abiertos y múltiples motores de cómputo."
      }
    ]
  },
  {
    "id": "clasificacion-pii-nist",
    "term": "Información de identificación personal (PII)",
    "englishTerm": "Personally Identifiable Information (PII)",
    "track": "de",
    "definition": "Cualquier atributo mantenido por una organización que permite distinguir o rastrear la identidad de una persona física, ya sea de forma directa (correo electrónico, documento fiscal, teléfono) o mediante vinculación con otros datos (código postal, fecha de nacimiento e historial de compras), según la guía NIST SP 800-122.",
    "relatedLessons": [
      "de4-plataforma-03-seguridad-pii-enmascaramiento"
    ],
    "relatedTerms": [
      "enmascaramiento-dinamico-ddm",
      "seguridad-nivel-fila-rls"
    ],
    "sources": [
      {
        "title": "NIST SP 800-122: Guide to Protecting the Confidentiality of PII",
        "url": "https://csrc.nist.gov/pubs/sp/800/122/final",
        "publisher": "National Institute of Standards and Technology (NIST)",
        "accessed": "2026-10-29",
        "supports": "Definición de identificadores directos, cuasi-identificadores vinculables y niveles de impacto de confidencialidad."
      }
    ]
  },
  {
    "id": "enmascaramiento-dinamico-ddm",
    "term": "Enmascaramiento dinámico de datos (DDM)",
    "englishTerm": "Dynamic Data Masking",
    "track": "de",
    "definition": "Técnica de control de acceso a nivel de columna que transforma u oculta atributos sensibles en el momento de la consulta según el rol del usuario solicitante, sin modificar los bloques físicos almacenados. Permite entregar resúmenes criptográficos, dominios de correo o rangos generalizados a perfiles analíticos no autorizados.",
    "relatedLessons": [
      "de4-plataforma-03-seguridad-pii-enmascaramiento"
    ],
    "relatedTerms": [
      "clasificacion-pii-nist",
      "seguridad-nivel-fila-rls"
    ],
    "sources": [
      {
        "title": "NIST SP 800-122: Guide to Protecting the Confidentiality of PII",
        "url": "https://csrc.nist.gov/pubs/sp/800/122/final",
        "publisher": "National Institute of Standards and Technology (NIST)",
        "accessed": "2026-10-29",
        "supports": "Controles técnicos de anonimización, seudonimización y redacción de atributos sensibles."
      }
    ]
  },
  {
    "id": "estado-remoto-iac-drift",
    "term": "Estado remoto y deriva de infraestructura (drift)",
    "englishTerm": "Remote State and Infrastructure Drift",
    "track": "de",
    "definition": "En herramientas declarativas como Terraform, el archivo de estado registra la correspondencia entre el código en control de versiones y los recursos reales desplegados. La deriva (drift) ocurre cuando cambios manuales en consola o fallos parciales hacen que la configuración real difiera del estado declarado en el repositorio.",
    "relatedLessons": [
      "de4-plataforma-04-iac-terraform-cicd-datos"
    ],
    "relatedTerms": [
      "planos-arquitectura-datos"
    ],
    "sources": [
      {
        "title": "Terraform Language Documentation — State",
        "url": "https://developer.hashicorp.com/terraform/language/state",
        "publisher": "HashiCorp",
        "accessed": "2026-10-29",
        "supports": "Propósito del archivo de estado de Terraform, bloqueo remoto y detección de deriva (drift)."
      }
    ]
  },
  {
    "id": "finops-especificacion-focus",
    "term": "Atribución FinOps y especificación FOCUS",
    "englishTerm": "FinOps FOCUS Cost Attribution",
    "track": "de",
    "definition": "Práctica de ingeniería financiera de nube que asigna el gasto de cómputo, almacenamiento y transferencia a equipos, dominios o consultas mediante etiquetas estandarizadas. La especificación abierta FOCUS define un esquema común (como BilledCost, EffectiveCost y ResourceId) para normalizar la facturación entre múltiples proveedores de nube y plataformas de datos.",
    "formula": "Costo_Total_Carga = Costo_Computo + Costo_Almacenamiento + Costo_Transferencia",
    "relatedLessons": [
      "de4-plataforma-05-finops-atribucion-retencion",
      "de4-plataforma-06-entrevista-system-design-de"
    ],
    "relatedTerms": [
      "politica-retencion-ciclo-vida"
    ],
    "sources": [
      {
        "title": "FOCUS — FinOps Open Cost and Usage Specification",
        "url": "https://focus.finops.org/",
        "publisher": "FinOps Foundation",
        "accessed": "2026-10-29",
        "supports": "Esquema abierto FOCUS para normalización de costos, etiquetas de atribución y métricas BilledCost versus EffectiveCost."
      }
    ]
  },
  {
    "id": "politica-retencion-ciclo-vida",
    "term": "Política de retención y ciclo de vida del almacenamiento",
    "englishTerm": "Storage Lifecycle and Retention Policy",
    "track": "de",
    "definition": "Conjunto de reglas automatizadas que gobiernan cuánto tiempo permanece un conjunto de datos en almacenamiento activo (hot), cuándo transita a capas de archivo de menor precio por gigabyte (warm o cold) y cuándo se purga definitivamente para cumplir requisitos legales de privacidad y evitar el crecimiento indefinido de costos.",
    "relatedLessons": [
      "de4-plataforma-05-finops-atribucion-retencion"
    ],
    "relatedTerms": [
      "finops-especificacion-focus",
      "c18-iceberg-v3"
    ],
    "sources": [
      {
        "title": "Amazon S3 User Guide — Managing the storage lifecycle of objects",
        "url": "https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html",
        "publisher": "Amazon Web Services",
        "accessed": "2026-10-29",
        "supports": "Reglas de transición entre clases de almacenamiento y expiración automática de objetos."
      }
    ]
  },
  {
    "id": "presupuesto-latencia-capacidad",
    "term": "Dimensionamiento de capacidad y presupuesto de latencia",
    "englishTerm": "Capacity Sizing and Latency Budget",
    "track": "de",
    "definition": "Cálculo cuantitativo utilizado en el diseño de sistemas de datos para estimar el caudal de ingesta (eventos por segundo y megabytes por día), el volumen de almacenamiento anual con factor de crecimiento y el tiempo máximo asignado a cada etapa de una tubería para cumplir un acuerdo de nivel de servicio.",
    "formula": "Caudal_Pico_EPS = (Eventos_Diarios / 86400) * Factor_Hora_Pico",
    "relatedLessons": [
      "de4-plataforma-06-entrevista-system-design-de"
    ],
    "relatedTerms": [
      "planos-arquitectura-datos",
      "finops-especificacion-focus"
    ],
    "sources": [
      {
        "title": "Google SRE Book — Service Level Objectives",
        "url": "https://sre.google/sre-book/service-level-objectives/",
        "publisher": "Google SRE",
        "accessed": "2026-10-29",
        "supports": "Definición de SLI, SLO, presupuestos de latencia y disponibilidad en sistemas distribuidos."
      }
    ]
  },
  {
    "id": "captura-cambios-log-wal",
    "term": "Captura de cambios basada en registro (Log-Based CDC)",
    "englishTerm": "Log-Based Change Data Capture (CDC)",
    "track": "de",
    "definition": "Técnica que extrae inserciones, actualizaciones y borrados leyendo secuencialmente el registro transaccional (WAL o binlog) sin ejecutar consultas sobre tablas operativas ni omitir eliminaciones físicas.",
    "formula": "Evento CDC = (before, after, op ∈ {'c','u','d','r'}, source.lsn, source.ts_ms) | Ejemplo: en Mercado Brisa, Debezium lee customer_changes desde pgoutput en orden de LSN. Se confunde con: CDC por consulta (query-based polling sobre updated_at), que sobrecarga el motor OLTP y no detecta filas borradas con DELETE.",
    "relatedLessons": [
      "de4-streaming-01-cdc-kafka-streaming",
      "de4-streaming-04-entrega-at-least-once-exactly-once"
    ],
    "relatedTerms": [
      "patron-transactional-outbox",
      "c26-bi-as-code"
    ],
    "sources": [
      {
        "title": "Debezium Connector for PostgreSQL Documentation",
        "url": "https://debezium.io/documentation/reference/stable/connectors/postgresql.html",
        "publisher": "Red Hat / Debezium Community",
        "accessed": "2026-10-29",
        "supports": "Arquitectura de lectura del WAL mediante decodificación lógica con pgoutput y estructura de eventos before/after/op."
      }
    ]
  },
  {
    "id": "patron-transactional-outbox",
    "term": "Patrón de bandeja de salida transaccional (Transactional Outbox)",
    "englishTerm": "Transactional Outbox Pattern",
    "track": "de",
    "definition": "Patrón que evita la doble escritura insertando el cambio de negocio y el evento de dominio dentro de una misma transacción ACID en base local.",
    "formula": "BEGIN; UPDATE orders ...; INSERT INTO outbox (id, aggregatetype, aggregateid, payload) ...; COMMIT; -> Debezium Outbox Event Router -> Kafka | Ejemplo: confirmar un pedido en Mercado Brisa y registrar su evento en outbox atómicamente. Se confunde con: publicar directamente en Kafka desde el microservicio tras hacer COMMIT en PostgreSQL (dual write).",
    "relatedLessons": [
      "de4-streaming-01-cdc-kafka-streaming",
      "de4-streaming-04-entrega-at-least-once-exactly-once"
    ],
    "relatedTerms": [
      "captura-cambios-log-wal",
      "entrega-exactamente-una-vez-2pc"
    ],
    "sources": [
      {
        "title": "Debezium Outbox Event Router SMT",
        "url": "https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html",
        "publisher": "Red Hat / Debezium Community",
        "accessed": "2026-10-29",
        "supports": "Diseño de la tabla outbox y enrutamiento de eventos mediante Kafka Connect Single Message Transform."
      }
    ]
  },
  {
    "id": "particionamiento-hash-kafka",
    "term": "Particionamiento por hash de clave en Kafka",
    "englishTerm": "Key-Hash Partitioning in Apache Kafka",
    "track": "de",
    "definition": "Asignación determinista de cada mensaje a una partición aplicando una función hash sobre su clave, garantizando orden secuencial únicamente dentro de esa partición específica.",
    "formula": "partición_destino = Utils.toPositive(Utils.murmur2(key_bytes)) mod N_particiones | Ejemplo: en Mercado Brisa, usar order_id como clave envía todos los cambios de un pedido a la misma partición; usar un valor estático para customer_id nulo concentra el 14,3 % de page_view en una partición caliente. Se confunde con: orden global en todo el tópico.",
    "relatedLessons": [
      "de4-streaming-02-kafka-kraft-tiered-storage",
      "de4-streaming-01-cdc-kafka-streaming"
    ],
    "relatedTerms": [
      "consenso-kraft-kafka",
      "almacenamiento-niveles-kafka"
    ],
    "sources": [
      {
        "title": "Apache Kafka 4.0 Documentation — Design and Partitioning",
        "url": "https://kafka.apache.org/40/documentation.html",
        "publisher": "Apache Software Foundation",
        "accessed": "2026-10-29",
        "supports": "Asignación de particiones por murmur2 y garantía de orden por partición."
      }
    ]
  },
  {
    "id": "consenso-kraft-kafka",
    "term": "Consenso KRaft (Kafka Raft Metadata Mode)",
    "englishTerm": "KRaft Consensus Protocol",
    "track": "de",
    "definition": "Protocolo de consenso basado en Raft integrado en Apache Kafka que gestiona los metadatos del clúster en un tópico interno, eliminando la dependencia de ZooKeeper.",
    "formula": "Quórum de controladores KRaft -> registro de eventos en __cluster_metadata -> replicación en memoria hacia brokers | Ejemplo: en Kafka 4.0 un cambio de líder de controlador se completa en milisegundos porque el controlador en espera ya tiene el estado cargado. Se confunde con: el protocolo de replicación de datos ISR entre brokers.",
    "relatedLessons": [
      "de4-streaming-02-kafka-kraft-tiered-storage"
    ],
    "relatedTerms": [
      "particionamiento-hash-kafka",
      "almacenamiento-niveles-kafka"
    ],
    "sources": [
      {
        "title": "KIP-833: Mark KRaft as Production Ready",
        "url": "https://cwiki.apache.org/confluence/display/KAFKA/KIP-833%3A+Mark+KRaft+as+Production+Ready",
        "publisher": "Apache Software Foundation",
        "accessed": "2026-10-29",
        "supports": "Arquitectura del quórum KRaft sobre __cluster_metadata y retiro de ZooKeeper."
      }
    ]
  },
  {
    "id": "almacenamiento-niveles-kafka",
    "term": "Almacenamiento por niveles en Kafka (Tiered Storage)",
    "englishTerm": "Kafka Tiered Storage (KIP-405)",
    "track": "de",
    "definition": "Arquitectura que separa el registro de una partición en segmentos recientes en discos locales del broker y segmentos cerrados transferidos a almacenamiento de objetos remoto.",
    "formula": "Retención total (remote.log.storage.system.enable=true) = local.retention.ms (NVMe caliente) + retention.ms (S3/GCS frío) | Ejemplo: conservar 12 horas de events de Mercado Brisa en NVMe local y 90 días en S3 para reprocesamientos históricos sin escalar discos de brokers. Se confunde con: un conector Kafka Connect que exporta archivos Parquet a un data lake.",
    "relatedLessons": [
      "de4-streaming-02-kafka-kraft-tiered-storage"
    ],
    "relatedTerms": [
      "consenso-kraft-kafka",
      "particionamiento-hash-kafka"
    ],
    "sources": [
      {
        "title": "KIP-405: Kafka Tiered Storage",
        "url": "https://cwiki.apache.org/confluence/display/KAFKA/KIP-405%3A+Kafka+Tiered+Storage",
        "publisher": "Apache Software Foundation",
        "accessed": "2026-10-29",
        "supports": "Separación entre segmento activo local y segmentos sellados en almacenamiento de objetos."
      }
    ]
  },
  {
    "id": "marca-agua-acotada-flink",
    "term": "Marca de agua por desorden acotado (Bounded-Out-of-Orderness Watermark)",
    "englishTerm": "Bounded-Out-of-Orderness Watermark",
    "track": "de",
    "definition": "Marcador temporal monótono creciente que avanza restando una holgura fija al mayor tiempo de evento observado, indicando cuándo cerrar ventanas y emitir resultados en streaming.",
    "formula": "W(t) = max(event_time_observado) - delta_tolerancia; en operador multi-partición: W_op = min(W_1, ..., W_k) | Ejemplo: con delta = 30 s, cuando llega un pago con event_time 10:02:00, el watermark avanza a 10:01:30 y cierra la ventana [10:00:00, 10:01:00). Se confunde con: un temporizador de reloj del servidor (Processing Time).",
    "relatedLessons": [
      "de4-streaming-03-flink-watermarks-mv",
      "de4-streaming-05-vistas-materializadas-streaming-olap"
    ],
    "relatedTerms": [
      "join-intervalo-temporal",
      "c27-cdc-flink-watermarks"
    ],
    "sources": [
      {
        "title": "Apache Flink Documentation — Generating Watermarks",
        "url": "https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/datastream/event-time/generating_watermarks/",
        "publisher": "Apache Software Foundation",
        "accessed": "2026-10-29",
        "supports": "Generación de marcas de agua por desorden acotado y propagación del mínimo entre particiones."
      }
    ]
  },
  {
    "id": "join-intervalo-temporal",
    "term": "Unión por intervalo temporal (Interval Join)",
    "englishTerm": "Event-Time Interval Join",
    "track": "de",
    "definition": "Operador que empareja registros de dos flujos con igual clave solo cuando sus marcas de tiempo de evento caen dentro de un rango acotado.",
    "formula": "f1.key = f2.key AND f2.ts BETWEEN f1.ts - límite_inferior AND f1.ts + límite_superior | Ejemplo: unir orders y payments de Mercado Brisa con p.payment_ts BETWEEN o.order_ts AND o.order_ts + INTERVAL '120 seconds' para capturar reintentos legítimos y purgar estado antiguo en RocksDB. Se confunde con: un Regular Join sin filtro temporal, que retiene estado de forma indefinida.",
    "relatedLessons": [
      "de4-streaming-03-flink-watermarks-mv",
      "de4-streaming-05-vistas-materializadas-streaming-olap"
    ],
    "relatedTerms": [
      "marca-agua-acotada-flink",
      "c27-cdc-flink-watermarks"
    ],
    "sources": [
      {
        "title": "Apache Flink Table API & SQL — Joins",
        "url": "https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/table/sql/queries/joins/",
        "publisher": "Apache Software Foundation",
        "accessed": "2026-10-29",
        "supports": "Semántica de Interval Joins y liberación automática de estado según el avance del watermark."
      }
    ]
  },
  {
    "id": "barreras-checkpoint-chandy-lamport",
    "term": "Barreras de punto de control (Chandy-Lamport Checkpoint Barriers)",
    "englishTerm": "Chandy-Lamport Checkpoint Barriers",
    "track": "de",
    "definition": "Marcadores inyectados en los flujos que separan registros entre instantáneas consecutivas, permitiendo guardar el estado distribuido de los operadores sin detener el procesamiento.",
    "formula": "Flujo: [registros <= n] -> |Barrera n| -> [registros > n]; el operador alinea barreras de todos sus canales antes de volcar su estado a RocksDB/S3 | Ejemplo: si un nodo de Flink falla, el trabajo retrocede el offset de Kafka y restaura el estado exacto de la última barrera confirmada. Se confunde con: un bloqueo global stop-the-world.",
    "relatedLessons": [
      "de4-streaming-04-entrega-at-least-once-exactly-once",
      "de4-streaming-03-flink-watermarks-mv"
    ],
    "relatedTerms": [
      "entrega-exactamente-una-vez-2pc",
      "marca-agua-acotada-flink"
    ],
    "sources": [
      {
        "title": "Apache Flink Documentation — Checkpointing",
        "url": "https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/datastream/fault-tolerance/checkpointing/",
        "publisher": "Apache Software Foundation",
        "accessed": "2026-10-29",
        "supports": "Alineación de barreras Chandy-Lamport y captura asíncrona de instantáneas de estado."
      }
    ]
  },
  {
    "id": "entrega-exactamente-una-vez-2pc",
    "term": "Entrega exactamente una vez mediante compromiso en dos fases (2PC)",
    "englishTerm": "End-to-End Exactly-Once via Two-Phase Commit",
    "track": "de",
    "definition": "Garantía donde el motor de streaming coordina sus instantáneas de estado con transacciones en el destino para que cada evento impacte una sola vez.",
    "formula": "Fase 1 (barrera llega al sink): preCommit(tx_n) + snapshot de estado -> Fase 2 (JobManager confirma checkpoint n): commit(tx_n) visible para isolation.level=read_committed | Ejemplo: cuando el origen es un webhook externo sin 2PC (como los 405 cobros repetidos en payments de Mercado Brisa), se requiere deduplicar por idempotency_key. Se confunde con: creer que activar checkpointing en Flink evita duplicados hacia cualquier API HTTP.",
    "relatedLessons": [
      "de4-streaming-04-entrega-at-least-once-exactly-once",
      "de4-streaming-01-cdc-kafka-streaming"
    ],
    "relatedTerms": [
      "barreras-checkpoint-chandy-lamport",
      "patron-transactional-outbox"
    ],
    "sources": [
      {
        "title": "An Overview of End-to-End Exactly-Once Processing in Apache Flink",
        "url": "https://flink.apache.org/2018/02/28/an-overview-of-end-to-end-exactly-once-processing-in-apache-flink-with-apache-kafka-too/",
        "publisher": "Apache Software Foundation",
        "accessed": "2026-10-29",
        "supports": "Protocolo TwoPhaseCommitSinkFunction y lectura transaccional read_committed en Kafka."
      }
    ]
  },
  {
    "id": "vista-materializada-incremental-streaming",
    "term": "Vista materializada mantenida incrementalmente en streaming",
    "englishTerm": "Streaming Incrementally Maintained Materialized View",
    "track": "de",
    "definition": "Consulta continua cuyo resultado almacenado se actualiza propagando únicamente los cambios de inserción y retracción de cada evento nuevo, sin reescanear las tablas base completas.",
    "formula": "Estado_nuevo = Estado_anterior + Delta(+1 nueva versión) + Delta(-1 versión anterior) | Ejemplo: en Materialize o RisingWave, un reembolso procesado en Mercado Brisa emite un delta que actualiza al instante el ingreso neto de la tienda; en ClickHouse, ReplacingMergeTree deduplica de forma asíncrona durante fusiones en segundo plano. Se confunde con: una vista materializada por lotes que ejecuta REFRESH completo programado.",
    "relatedLessons": [
      "de4-streaming-05-vistas-materializadas-streaming-olap",
      "de4-streaming-03-flink-watermarks-mv"
    ],
    "relatedTerms": [
      "marca-agua-acotada-flink",
      "captura-cambios-log-wal"
    ],
    "sources": [
      {
        "title": "Materialize Documentation — CREATE MATERIALIZED VIEW",
        "url": "https://materialize.com/docs/sql/create-materialized-view/",
        "publisher": "Materialize Inc.",
        "accessed": "2026-10-29",
        "supports": "Mantenimiento incremental de vistas sobre flujos de cambios mediante Differential Dataflow."
      }
    ]
  },
  {
    "id": "registro-decision-arquitectura-adr",
    "term": "Registro de Decisión de Arquitectura (ADR)",
    "englishTerm": "Architectural Decision Record (ADR)",
    "track": "core",
    "definition": "Documento técnico breve versionado en el repositorio que registra una elección de diseño significativa junto con su contexto, las alternativas evaluadas, la decisión adoptada y sus consecuencias operativas. No se confunde con un manual de usuario, pues captura por qué se descartaron otras opciones bajo las restricciones vigentes.",
    "formula": "Contexto + Alternativas (A vs. B) + Decisión + Consecuencias (Trade-offs)",
    "relatedLessons": [
      "x4-carrera-01-portafolio-publico-de-da-bi",
      "x4-carrera-03-explicar-proyecto-2-minutos"
    ],
    "relatedTerms": [
      "compensacion-tecnica-tradeoff",
      "reproducibilidad-computacional"
    ],
    "sources": [
      {
        "title": "Documenting Architecture Decisions",
        "url": "https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions",
        "publisher": "Cognitect (Michael Nygard)",
        "accessed": "2026-10-29",
        "supports": "Formato canónico de ADR con título, estado, contexto, decisión y consecuencias para documentar decisiones de arquitectura."
      }
    ]
  },
  {
    "id": "reproducibilidad-computacional",
    "term": "Reproducibilidad computacional en portafolios",
    "englishTerm": "Computational Reproducibility",
    "track": "core",
    "definition": "Propiedad de un proyecto analítico o de ingeniería por la cual un revisor externo puede clonar el repositorio y obtener exactamente las mismas tablas, métricas y gráficos ejecutando un comando automatizado sobre los datos fuente. Exige fijar versiones de paquetes, semillas deterministas y rutas relativas sin pasos manuales ocultos.",
    "formula": "Datos crudos (SHA-256 fijo) + Código versionado + Entorno fijado = Salida idéntica",
    "relatedLessons": [
      "x4-carrera-01-portafolio-publico-de-da-bi"
    ],
    "relatedTerms": [
      "registro-decision-arquitectura-adr",
      "prueba-reconciliacion-datos"
    ],
    "sources": [
      {
        "title": "Ten Simple Rules for Reproducible Computational Research",
        "url": "https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1003285",
        "publisher": "PLOS Computational Biology",
        "accessed": "2026-10-29",
        "supports": "Reglas de trazabilidad completa desde datos crudos hasta resultados publicados mediante scripts automatizados y control de versiones."
      }
    ]
  },
  {
    "id": "prueba-reconciliacion-datos",
    "term": "Prueba SQL de reconciliación financiera y de grano",
    "englishTerm": "SQL Grain and Financial Reconciliation Test",
    "track": "core",
    "definition": "Consulta de validación automatizada que comprueba que una transformación o cruce entre tablas conserva el conteo esperado de entidades y la suma exacta de importes monetarios. En un portafolio público evita publicar métricas infladas por multiplicación de filas al unir cabeceras de pedidos con líneas o reembolsos.",
    "formula": "SELECT COUNT(*) - COUNT(DISTINCT order_id) AS filas_duplicadas_por_fanout FROM tabla_transformada;",
    "relatedLessons": [
      "x4-carrera-01-portafolio-publico-de-da-bi",
      "x4-carrera-02-entrevista-tecnica-sql-caso-arquitectura"
    ],
    "relatedTerms": [
      "reproducibilidad-computacional",
      "protocolo-sql-en-vivo"
    ],
    "sources": [
      {
        "title": "Add data tests to your DAG",
        "url": "https://docs.getdbt.com/docs/build/data-tests",
        "publisher": "dbt Labs Documentation",
        "accessed": "2026-10-29",
        "supports": "Verificación declarativa y singular de unicidad, integridad referencial y cuadre de totales en modelos analíticos."
      }
    ]
  },
  {
    "id": "protocolo-sql-en-vivo",
    "term": "Protocolo de 5 pasos para SQL en vivo",
    "englishTerm": "5-Step Live SQL Interview Protocol",
    "track": "core",
    "definition": "Método estructurado para resolver ejercicios de SQL en entrevista técnica: primero declarar el grano de entrada y de salida; segundo identificar llaves de cruce y cardinalidad; tercero enumerar filtros de dominio y casos borde; cuarto modularizar en CTEs legibles; y quinto verificar el conteo de filas y empates.",
    "formula": "1. Grano -> 2. Cardinalidad JOIN -> 3. Filtros/Bordes -> 4. CTEs -> 5. Verificación",
    "relatedLessons": [
      "x4-carrera-02-entrevista-tecnica-sql-caso-arquitectura"
    ],
    "relatedTerms": [
      "desempate-determinista-ventana",
      "prueba-reconciliacion-datos"
    ],
    "sources": [
      {
        "title": "Declaring the Grain",
        "url": "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/grain/",
        "publisher": "Kimball Group",
        "accessed": "2026-10-29",
        "supports": "Declaración obligatoria del grano antes de combinar tablas de hechos y dimensiones para prevenir errores de agregación."
      }
    ]
  },
  {
    "id": "desempate-determinista-ventana",
    "term": "Desempate determinista en funciones de ventana",
    "englishTerm": "Deterministic Window Tie-Breaking",
    "track": "core",
    "definition": "Inclusión de una clave única como último criterio del `ORDER BY` dentro de una función de ventana (`ROW_NUMBER()`, `RANK()`, `DENSE_RANK()`) para garantizar que dos ejecuciones sobre los mismos datos devuelvan siempre la misma fila ganadora. Se combina con `QUALIFY` en DuckDB para filtrar rankings sin subconsultas adicionales.",
    "formula": "QUALIFY ROW_NUMBER() OVER (PARTITION BY idempotency_key ORDER BY payment_ts ASC, payment_id ASC) = 1",
    "relatedLessons": [
      "x4-carrera-02-entrevista-tecnica-sql-caso-arquitectura"
    ],
    "relatedTerms": [
      "protocolo-sql-en-vivo",
      "reproducibilidad-computacional"
    ],
    "sources": [
      {
        "title": "DuckDB SQL Query Syntax — QUALIFY Clause",
        "url": "https://duckdb.org/docs/stable/sql/query_syntax/qualify.html",
        "publisher": "DuckDB Foundation",
        "accessed": "2026-10-29",
        "supports": "Filtrado directo del resultado de funciones de ventana evaluadas por partición y orden determinista."
      }
    ]
  },
  {
    "id": "principio-piramide-minto",
    "term": "Principio de la Pirámide de Minto (Comunicación Answer-First)",
    "englishTerm": "Minto Pyramid Principle (Answer-First Communication)",
    "track": "core",
    "definition": "Estructura de comunicación ejecutiva formulada por Barbara Minto que exige abrir una presentación o documento con la conclusión cuantificada y la recomendación de acción en los primeros veinte segundos, respaldándola después con argumentos agrupados lógicamente y cerrando con la evidencia técnica detallada si el interlocutor profundiza.",
    "formula": "1. Conclusión cuantificada (0:00-0:20) -> 2. Causas y compensaciones -> 3. Evidencia SQL",
    "relatedLessons": [
      "x4-carrera-03-explicar-proyecto-2-minutos"
    ],
    "relatedTerms": [
      "matriz-impacto-antes-despues",
      "compensacion-tecnica-tradeoff"
    ],
    "sources": [
      {
        "title": "The Minto Pyramid Principle: Logic in Writing, Thinking, & Problem Solving",
        "url": "https://barbaraminto.com/",
        "publisher": "Minto International",
        "accessed": "2026-10-29",
        "supports": "Presentación jerárquica encabezada por la tesis principal y sustentada en grupos de argumentos mutuamente excluyentes."
      }
    ]
  },
  {
    "id": "compensacion-tecnica-tradeoff",
    "term": "Compensación técnica de ingeniería (Trade-off)",
    "englishTerm": "Engineering Trade-off",
    "track": "core",
    "definition": "Elección consciente entre dos o más diseños válidos donde ganar en una dimensión (como simplicidad operativa, menor costo de cómputo o exactitud histórica) implica ceder de forma controlada en otra (como mayor latencia o almacenamiento adicional). Explicar qué se sacrificó y por qué distingue a un perfil profesional.",
    "formula": "Beneficio ganado (p. ej. exactitud As-Was SCD2) vs. Costo aceptado (cruce por rango temporal)",
    "relatedLessons": [
      "x4-carrera-01-portafolio-publico-de-da-bi",
      "x4-carrera-02-entrevista-tecnica-sql-caso-arquitectura",
      "x4-carrera-03-explicar-proyecto-2-minutos"
    ],
    "relatedTerms": [
      "registro-decision-arquitectura-adr",
      "principio-piramide-minto"
    ],
    "sources": [
      {
        "title": "Software Architecture Guide",
        "url": "https://martinfowler.com/architecture/",
        "publisher": "Martin Fowler (martinfowler.com)",
        "accessed": "2026-10-29",
        "supports": "Evaluación de decisiones arquitectónicas en función de sus compensaciones bajo restricciones reales del sistema."
      }
    ]
  },
  {
    "id": "matriz-impacto-antes-despues",
    "term": "Matriz de impacto antes y después",
    "englishTerm": "Before-and-After Impact Scorecard",
    "track": "core",
    "definition": "Tabla comparativa producida por una consulta reproducible que contrasta lado a lado la métrica defectuosa o previa al proyecto frente a la métrica corregida o posterior, cuantificando la diferencia absoluta y porcentual. Permite defender en dos minutos el valor económico o de calidad aportado por una intervención técnica.",
    "formula": "sesgo_corregido_usd = metrica_antes_usd - metrica_despues_usd",
    "relatedLessons": [
      "x4-carrera-03-explicar-proyecto-2-minutos"
    ],
    "relatedTerms": [
      "principio-piramide-minto",
      "prueba-reconciliacion-datos"
    ],
    "sources": [
      {
        "title": "The STAR Method for Behavioral Interviews",
        "url": "https://capd.mit.edu/resources/the-star-method-for-behavioral-interviews/",
        "publisher": "MIT Career Advising & Professional Development",
        "accessed": "2026-10-29",
        "supports": "Cuantificación verificable del resultado obtenido tras la acción técnica frente a la línea base inicial."
      }
    ]
  },
  {
    "id": "model-context-protocol",
    "term": "Model Context Protocol (MCP)",
    "track": "core",
    "definition": "Estándar abierto basado en JSON-RPC 2.0 que desacopla los clientes de inteligencia artificial de los almacenes de datos y herramientas empresariales. En lugar de abrir conexiones SQL directas al motor analítico, el servidor MCP expone recursos de metadatos gobernados y herramientas parametrizadas con control estricto de identidad y auditoría.",
    "relatedLessons": [
      "x4-ia-datos-01-mcp-semantic-ai-rag",
      "x4-ia-datos-02-text-to-sql-capa-semantica"
    ],
    "relatedTerms": [
      "mcp-resources-tools",
      "c28-mcp-semantic-rag-evals",
      "c21-semantic-layer"
    ],
    "sources": [
      {
        "title": "Model Context Protocol — Architecture Specification",
        "url": "https://modelcontextprotocol.io/docs/concepts/architecture",
        "publisher": "Model Context Protocol Specification",
        "accessed": "2026-10-29",
        "supports": "Arquitectura Host-Client-Server sobre JSON-RPC 2.0 y aislamiento de conexiones de datos."
      }
    ]
  },
  {
    "id": "mcp-resources-tools",
    "term": "Primitivas Resources y Tools en MCP",
    "track": "core",
    "definition": "Dos primitivas complementarias de un servidor MCP. Los recursos (resources) exponen contexto de solo lectura identificado por URI, como el catálogo YAML de métricas o contratos de datos. Las herramientas (tools) son funciones ejecutables con esquemas JSON tipados que permiten al modelo consultar métricas gobernadas sin redactar SQL arbitrario.",
    "relatedLessons": [
      "x4-ia-datos-01-mcp-semantic-ai-rag"
    ],
    "relatedTerms": [
      "model-context-protocol",
      "c19-data-contracts-odcs"
    ],
    "sources": [
      {
        "title": "Model Context Protocol — Server Tools Specification",
        "url": "https://modelcontextprotocol.io/docs/concepts/tools",
        "publisher": "Model Context Protocol Specification",
        "accessed": "2026-10-29",
        "supports": "Definición de herramientas ejecutables tipadas con JSON Schema y separación frente a recursos pasivos."
      }
    ]
  },
  {
    "id": "text-to-sql-hallucination",
    "term": "Alucinación estructural en Text-to-SQL",
    "track": "core",
    "definition": "Fallo en el que un modelo de lenguaje genera una consulta SQL sintácticamente válida que el motor ejecuta sin errores, pero que devuelve cifras falsas de negocio. Ocurre cuando el agente desconoce reintentos duplicados de webhooks, registros centinela de prueba, versiones históricas SCD Tipo 2 o diferencias de grano entre tablas.",
    "relatedLessons": [
      "x4-ia-datos-01-mcp-semantic-ai-rag",
      "x4-ia-datos-02-text-to-sql-capa-semantica",
      "x4-ia-datos-04-golden-evals-barreras-ast-sqlglot"
    ],
    "relatedTerms": [
      "chasm-trap-semantic",
      "c01-grain-fanout",
      "c07-scd-type-2"
    ],
    "sources": [
      {
        "title": "BIRD-bench: Big Bench for Large-Scale Database Grounded Text-to-SQL Evaluation",
        "url": "https://bird-bench.github.io/",
        "publisher": "HKU Data Lab / DAMO Academy",
        "accessed": "2026-10-29",
        "supports": "Evidencia de errores de ejecución de modelos Text-to-SQL sobre bases de datos con valores sucios y reglas implícitas."
      }
    ]
  },
  {
    "id": "chasm-trap-semantic",
    "term": "Trampa de abismo (Chasm Trap) en IA",
    "track": "core",
    "definition": "Defecto clásico en generación automática de SQL cuando dos tablas con relación uno a muchos respecto a una entidad común, como líneas de pedido y reembolsos asociados a una orden, se unen en la misma cláusula FROM. Provoca un producto cartesiano parcial por orden que multiplica los importes agregados.",
    "relatedLessons": [
      "x4-ia-datos-02-text-to-sql-capa-semantica"
    ],
    "relatedTerms": [
      "semantic-query-compilation",
      "c01-grain-fanout",
      "text-to-sql-hallucination"
    ],
    "sources": [
      {
        "title": "Cube Documentation — Data Modeling and Chasm Trap Prevention",
        "url": "https://docs.cube.dev/docs/data-modeling/overview",
        "publisher": "Cube Dev",
        "accessed": "2026-10-29",
        "supports": "Prevención de fan-out y chasm traps al cruzar medidas con relaciones uno a muchos."
      }
    ]
  },
  {
    "id": "semantic-query-compilation",
    "term": "Compilación de consultas en capa semántica",
    "track": "core",
    "definition": "Proceso determinista mediante el cual un motor semántico como MetricFlow o Cube traduce una petición de métricas y dimensiones en SQL libre de fan-out. El compilador agrupa primero cada medida atómica en una CTE independiente al grano de su entidad base y realiza el cruce dimensional al final.",
    "relatedLessons": [
      "x4-ia-datos-02-text-to-sql-capa-semantica"
    ],
    "relatedTerms": [
      "c21-semantic-layer",
      "chasm-trap-semantic",
      "c10-simpsons-paradox"
    ],
    "sources": [
      {
        "title": "dbt Semantic Layer and MetricFlow Documentation",
        "url": "https://docs.getdbt.com/docs/use-dbt-semantic-layer/dbt-sl",
        "publisher": "dbt Labs",
        "accessed": "2026-10-29",
        "supports": "Compilación de entidades, dimensiones, medidas y métricas en consultas SQL pre-agregadas por grano."
      }
    ]
  },
  {
    "id": "okapi-bm25",
    "term": "Función de ranking léxico Okapi BM25",
    "track": "core",
    "definition": "Algoritmo probabilístico de recuperación de información sobre índices invertidos que puntúa documentos según la frecuencia de aparición de los términos buscados, aplicando saturación no lineal de frecuencia, penalización por longitud del documento y peso por frecuencia inversa de documento (IDF). Sobresale al localizar códigos SKU, nombres de tablas e identificadores exactos.",
    "relatedLessons": [
      "x4-ia-datos-03-rag-hibrido-bm25-hnsw-rrf"
    ],
    "relatedTerms": [
      "hnsw-vector-index",
      "reciprocal-rank-fusion"
    ],
    "sources": [
      {
        "title": "DuckDB Full-Text Search Extension (BM25)",
        "url": "https://duckdb.org/docs/stable/extensions/full_text_search",
        "publisher": "DuckDB Foundation",
        "accessed": "2026-10-29",
        "supports": "Implementación de índices invertidos y función de puntuación BM25 en SQL analítico."
      }
    ]
  },
  {
    "id": "hnsw-vector-index",
    "term": "Índice vectorial jerárquico HNSW",
    "track": "core",
    "definition": "Estructura de datos en grafo multicapa denominada Hierarchical Navigable Small World, diseñada para resolver búsquedas de vecinos más cercanos aproximados (ANN) sobre vectores densos de alta dimensión en tiempo logarítmico. Sus capas superiores contienen enlaces largos para saltar regiones del espacio vectorial y la capa base refina la vecindad local.",
    "relatedLessons": [
      "x4-ia-datos-03-rag-hibrido-bm25-hnsw-rrf"
    ],
    "relatedTerms": [
      "okapi-bm25",
      "reciprocal-rank-fusion"
    ],
    "sources": [
      {
        "title": "Efficient and robust approximate nearest neighbor search using HNSW graphs",
        "url": "https://arxiv.org/abs/1603.09320",
        "publisher": "IEEE TPAMI / arXiv (Malkov & Yashunin)",
        "accessed": "2026-10-29",
        "supports": "Diseño algorítmico de grafos jerárquicos de mundo pequeño navegable para búsqueda ANN."
      }
    ]
  },
  {
    "id": "reciprocal-rank-fusion",
    "term": "Reciprocal Rank Fusion (RRF)",
    "track": "core",
    "definition": "Algoritmo de fusión de rankings formulado por Cormack, Clarke y Büttcher que combina listas ordenadas procedentes de motores heterogéneos calculando para cada documento la suma del inverso de su posición más una constante de amortiguamiento k, habitualmente 60. Elimina la necesidad de calibrar escalas incompatibles entre BM25 y distancias vectoriales.",
    "relatedLessons": [
      "x4-ia-datos-03-rag-hibrido-bm25-hnsw-rrf"
    ],
    "relatedTerms": [
      "okapi-bm25",
      "hnsw-vector-index",
      "c28-mcp-semantic-rag-evals"
    ],
    "sources": [
      {
        "title": "Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods",
        "url": "https://cormack.uwaterloo.ca/cormacksigir09-rrf.pdf",
        "publisher": "ACM SIGIR (Cormack, Clarke & Büttcher)",
        "accessed": "2026-10-29",
        "supports": "Fórmula RRF con constante k=60 e invariancia de escala al combinar múltiples recuperadores."
      }
    ]
  },
  {
    "id": "golden-eval-set",
    "term": "Conjunto de evaluación Golden Evals",
    "track": "core",
    "definition": "Colección curada, determinista y controlada por versiones de casos de prueba compuesta por preguntas de negocio en lenguaje natural, sus consultas SQL o llamadas semánticas canónicas y el resultado tabular exacto esperado sobre un dataset fijo. Permite medir la exactitud de ejecución en integración continua antes de desplegar cambios.",
    "relatedLessons": [
      "x4-ia-datos-04-golden-evals-barreras-ast-sqlglot"
    ],
    "relatedTerms": [
      "ast-sql-guardrail",
      "c28-mcp-semantic-rag-evals",
      "text-to-sql-hallucination"
    ],
    "sources": [
      {
        "title": "Spider: A Large-Scale Human-Labeled Dataset for Complex and Cross-Domain Semantic Parsing",
        "url": "https://yale-lily.github.io/spider",
        "publisher": "Yale LILY Lab",
        "accessed": "2026-10-29",
        "supports": "Evaluación determinista de sistemas Text-to-SQL mediante pares pregunta-SQL canónico y exactitud de ejecución."
      }
    ]
  },
  {
    "id": "ast-sql-guardrail",
    "term": "Barrera determinista de AST (SQLGlot)",
    "track": "core",
    "definition": "Mecanismo de seguridad que analiza sintácticamente el SQL generado por un agente convirtiéndolo en un árbol de sintaxis abstracta (AST) antes de su ejecución. Permite inspeccionar programáticamente cada nodo para rechazar sentencias destructivas, bloquear el acceso a columnas con datos personales e inyectar predicados de aislamiento por cliente.",
    "relatedLessons": [
      "x4-ia-datos-04-golden-evals-barreras-ast-sqlglot"
    ],
    "relatedTerms": [
      "golden-eval-set",
      "model-context-protocol",
      "c28-mcp-semantic-rag-evals"
    ],
    "sources": [
      {
        "title": "SQLGlot Documentation — Python SQL Parser and Transpiler",
        "url": "https://sqlglot.com/sqlglot.html",
        "publisher": "SQLGlot (Toby Mao)",
        "accessed": "2026-10-29",
        "supports": "Inspección y transformación programática del árbol de sintaxis abstracta (AST) en múltiples dialectos SQL."
      }
    ]
  }
];

export const GLOSSARY_BY_ID = Object.fromEntries(GLOSSARY_TERMS.map((t) => [t.id, t]));

const BASE_CONCEPTS_2026 = [
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
    "tool2026": "SQL Estándar en DuckDB / PostgreSQL / Trino",
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
    "plainDefinition": "El Esquema en Estrella separa los eventos numéricos (Tablas de Hechos) de los atributos descriptivos (Tablas de Dimensión) para facilitar el gobierno y el historial. One Big Table (OBT) pre-une todo en una sola tabla ancha para acelerar lecturas columnares. En arquitecturas híbridas se combinan: Estrella en capa Silver y OBT en capa Gold.",
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
    "syntaxExample": "import polars as pl\n\nq = (\n    pl.scan_parquet(\"s3://lakehouse/silver/orders/*.parquet\")\n    .filter(pl.col(\"order_date\") >= pl.lit(\"2026-10-01\").str.to_date())\n    .group_by(\"region\")\n    .agg(\n        pl.len().alias(\"pedidos\"),\n        pl.col(\"net_amount_usd\").sum().alias(\"ingresos_usd\"),\n    )\n)\ndf_resultado = q.collect(engine=\"streaming\")",
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
    "plainDefinition": "Formato abierto de tablas que añade transacciones ACID, evolución de particiones y consultas históricas (Time Travel) encima de archivos Parquet. En su especificación v3, incorpora Deletion Vectors binarios en archivos Puffin, el tipo VARIANT para datos semi-estructurados y el patrón Write-Audit-Publish (WAP).",
    "crossRoleConnections": {
      "DA": "Utiliza consultas Time Travel (`FOR SYSTEM_TIME AS OF`) para reproducir exactamente el estado de los datos de cualquier fecha pasada.",
      "BI": "Lee las tablas Gold en modo Direct Lake sin sufrir nunca lecturas a medias ni bloqueos mientras ingeniería actualiza los pipelines."
    },
    "tool2026": "Apache Iceberg v3 + Catálogo REST Apache Polaris / Nessie",
    "syntaxExample": "-- Consulta histórica exacta (Time Travel) en Apache Iceberg v3:\nSELECT\n  region,\n  SUM(net_revenue_usd) AS ingresos_snapshot_cierre\nFROM lakehouse.gold.fct_orders\nFOR SYSTEM_TIME AS OF TIMESTAMP '2026-10-01 00:00:00'\nGROUP BY region;",
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

const BASE_CONCEPTS_BY_ID = Object.fromEntries(BASE_CONCEPTS_2026.map((c) => [c.id, c]));

export const GLOSSARY_CONCEPTS_2026 = GLOSSARY_TERMS.map((t, idx) =>
  BASE_CONCEPTS_BY_ID[t.id] || {
    id: t.id,
    number: idx + 1,
    term: t.term,
    discipline: t.track.toUpperCase(),
    primaryRole: t.track.toUpperCase(),
    lessonId: t.relatedLessons[0] || '',
    fallbackLessonId: t.relatedLessons[0] || '',
    lessonNumber: idx + 1,
    lessonTitle: t.englishTerm || t.term,
    plainDefinition: t.definition,
    tool2026: t.englishTerm || t.track.toUpperCase(),
    syntaxExample: t.formula || '',
    connectedIds: t.relatedTerms || [],
  }
);

export default GLOSSARY_TERMS;
