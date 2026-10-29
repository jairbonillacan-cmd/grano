// Lección migrada al esquema v2 mediante scripts/migrate-legacy.mjs
const lesson = {
  "id": "de2-formatos-02-arrow-lance-vortex",
  "moduleId": "de2-formatos",
  "tracks": [
    "de"
  ],
  "level": 2,
  "order": 2,
  "title": "Memoria columnar con Apache Arrow, Lance y Vortex",
  "minutes": 30,
  "prerequisites": [
    "de2-formatos-01-columnar-parquet"
  ],
  "contentVersion": 1,
  "hook": "En Mercado Brisa (empresa ficticia), un pipeline lee 40 millones de pedidos con DuckDB, pasa el resultado a Polars en Python y alimenta el servicio de reportes. Con cursores ODBC y `pandas.DataFrame`, el 78 % del tiempo de CPU y el 65 % de la RAM se iban en serializar y copiar bytes. Al pasar a Apache Arrow en memoria, la transferencia tardó 0.2 ms sin copiar un byte. ¿Cómo funciona la memoria columnar zero-copy?",
  "objectives": [
    "Explicar el diseño de búferes contiguos de Apache Arrow en RAM (mapa de bits de validez, desplazamientos y valores).",
    "Transferir tablas entre DuckDB, Polars y PyArrow mediante intercambio de punteros sin copia (zero-copy) ni serialización.",
    "Identificar por qué el acceso aleatorio por índice y los vectores de embeddings requieren formatos como Lance o Vortex frente a Parquet."
  ],
  "sections": [
    {
      "id": "costo-de-serializacion-y-memoria-compartida-con-",
      "heading": "Costo de serialización y memoria compartida con Apache Arrow",
      "body": "Mientras que Parquet es el estándar para guardar datos comprimidos en **disco**, **Apache Arrow** es el estándar universal para representar tablas columnares en **memoria RAM**.\nAntes de Arrow, cada herramienta tenía un diseño de memoria incompatible: pasar datos de un motor SQL a Python, de ahí a R o a un motor de visualización obligaba a serializar y deserializar fila por fila, consumiendo hasta el 80% del tiempo de CPU.\nCon Apache Arrow, los datos se organizan en buffers contiguos estandarizados en RAM (un buffer de **Validity Bitmap** para nulos, un buffer de **Offsets** para longitudes variables y un buffer de **Values**). Gracias a la **Arrow C Data Interface** (en el mismo proceso) y a **Arrow Flight RPC / ADBC** (por red), DuckDB, Polars, PyArrow y DataFusion leen exactamente el mismo puntero de memoria RAM sin copiar un solo byte (**Zero-Copy**).",
      "interactive": {
        "component": "arrow-zero-copy-sim",
        "caption": "Simulador interactivo: Memoria columnar con Apache Arrow, Lance y Vortex"
      }
    },
    {
      "id": "jerarquia-de-cache-del-procesador-y-ejecucion-ve",
      "heading": "Jerarquía de caché del procesador y ejecución vectorizada SIMD",
      "body": "¿Por qué un bucle tradicional o una base orientada a filas desperdicia un procesador moderno? Porque al evaluar `price * (1 - discount)` fila por fila, el CPU salta entre direcciones de memoria dispersas (*pointer chasing*), provocando fallos constantes de caché (**Cache Misses**) y predicciones erróneas de salto (**Branch Mispredictions**).\nLos motores columnares modernos (DuckDB, Polars, Velox, DataFusion) procesan datos en **vectores columnares de 1,024 o 2,048 valores contiguos** que caben íntegros dentro de la caché ultrarrápida **L1/L2** del núcleo. Sobre esos buffers contiguos de Arrow, el compilador aplica instrucciones **SIMD (Single Instruction, Multiple Data)** como AVX-512 o ARM NEON: en un único ciclo de reloj, el procesador multiplica o filtra 8 o 16 números de 64 bits en paralelo.",
      "example": {
        "language": "sql",
        "code": "# EXCELENTE: 1) Lectura como tabla Apache Arrow en memoria contigua (0 copias).\n# 2) DuckDB y Polars comparten el mismo buffer de memoria vía Arrow C Data Interface.\nimport duckdb\nimport polars as pl\n\n# DuckDB genera directamente un flujo Apache Arrow Zero-Copy\narrow_tbl = duckdb.sql(\"\"\"\n  SELECT order_id, amount_usd, tax_rate\n  FROM read_parquet('s3://lakehouse/silver/orders_50m.parquet')\n\"\"\").arrow()\n\n# Polars envuelve el puntero Arrow en 0 ms (Zero-Copy) y ejecuta instrucciones SIMD AVX-512\ndf_pl = pl.from_arrow(arrow_tbl).with_columns(\n  (pl.col(\"amount_usd\") * (1.0 - pl.col(\"tax_rate\"))).alias(\"net_usd\")\n)",
        "expectedOutput": [
          {
            "copias_en_ram": "0 copias (Puntero Arrow compartido)",
            "uso_simd_cpu": "100% (Vectores contiguos en caché L1/L2)",
            "tiempo_50m_filas": "0.31 seg (150x más rápido)"
          }
        ]
      }
    },
    {
      "id": "limites-de-parquet-en-cargas-multimodales-lance-",
      "heading": "Límites de Parquet en cargas multimodales: Lance y Vortex",
      "body": "Aunque Parquet v2 es imbatible para escaneos analíticos clásicos de tablas estructuradas, fue diseñado en 2013 y sufre en tres cargas de trabajo modernas de 2026:\n1) **Acceso aleatorio puntual (`Random Access O(1)`)**: Para leer la fila #482,910 en Parquet debes localizar y descomprimir una página entera de varios megabytes.\n2) **Columnas anchas y Embeddings IA**: Guardar vectores de 1,536 dimensiones (`float32`), imágenes o textos largos para entrenar LLMs hace que los Row Groups de Parquet se fragmenten y el Footer explote en tamaño.\nAquí entran dos formatos abiertos de nueva generación totalmente compatibles con Apache Arrow:\n- **Lance**: Formato columnar diseñado para IA multimodal, búsqueda vectorial (HNSW/DiskANN nativo) y acceso aleatorio en tiempo constante $O(1)$. Calcula los desplazamientos de byte exactos sin descomprimir bloques vecinos, siendo hasta 100x más rápido que Parquet al recuperar lotes aleatorios para entrenamiento o RAG.\n- **Vortex** (incubado en Linux Foundation): Formato columnar extensible con **compresión ligera en cascada** (*BtrBlocks / FastLanes*) que permite evaluar filtros directamente sobre los datos comprimidos en RAM y GPU sin pagar el costo de descompresión previa."
    },
    {
      "id": "criterios-de-eleccion-entre-parquet-lance-y-vort",
      "heading": "Criterios de elección entre Parquet, Lance y Vortex",
      "body": "- Usa **Apache Parquet v2 (sobre Iceberg v3)** para tu Lakehouse analítico central: tablas de hechos y dimensiones (Bronze/Silver/Gold), agregaciones SQL masivas y reportes de Business Intelligence.\n- Usa **Lance** cuando tu tabla combine columnas analíticas con **embeddings vectoriales**, documentos largos, audio/imagen para pipelines de IA/RAG o cuando necesites recuperar miles de filas específicas por índice en milisegundos.\n- Usa **Vortex** cuando tengas tablas con miles de columnas dispersas, esquemas altamente anidados o pipelines de alto rendimiento que transfieren datos comprimidos directamente a memoria Arrow o GPUs."
    }
  ],
  "workedExample": {
    "title": "Ejemplo guiado: Memoria columnar con Apache Arrow, Lance y Vortex",
    "description": "Compara el antipatrón de conversión por filas y funciones Python escalares frente al flujo Zero-Copy con Apache Arrow y ejecución vectorizada SIMD:",
    "audit": "",
    "steps": [
      {
        "label": "Antipatrón: conversión por filas y función escalar en Python",
        "explanation": "Compara el antipatrón de conversión por filas y funciones Python escalares frente al flujo Zero-Copy con Apache Arrow y ejecución vectorizada SIMD:",
        "code": "# MAL: 1) Convertir de SQL a lista de diccionarios/filas duplica la RAM y serializa cada valor.\n# 2) Usar .apply(axis=1) ejecuta un bucle en el intérprete de Python fila por fila (sin SIMD).\nimport pandas as pd\n\nrows = cursor.fetchall()  # Copia 1: tuplas Python en memoria\ndf = pd.DataFrame(rows, columns=[\"order_id\", \"amount_usd\", \"tax_rate\"])  # Copia 2\n\n# Rompe la caché L1/L2 del CPU e invoca una función Python 50 millones de veces:\ndf[\"net_usd\"] = df.apply(lambda r: r[\"amount_usd\"] * (1.0 - r[\"tax_rate\"]), axis=1)",
        "expectedOutput": [
          {
            "copias_en_ram": "3 copias completas (+14.8 GB RAM)",
            "uso_simd_cpu": "0% (Bucle interpretado fila a fila)",
            "tiempo_50m_filas": "46.40 seg"
          }
        ]
      },
      {
        "label": "Solución óptima: puntero Apache Arrow y vectorización SIMD",
        "explanation": "Compara ahora la consulta corregida y verifica cómo las filas y totales coinciden con la auditoría.",
        "code": "# EXCELENTE: 1) Lectura como tabla Apache Arrow en memoria contigua (0 copias).\n# 2) DuckDB y Polars comparten el mismo buffer de memoria vía Arrow C Data Interface.\nimport duckdb\nimport polars as pl\n\n# DuckDB genera directamente un flujo Apache Arrow Zero-Copy\narrow_tbl = duckdb.sql(\"\"\"\n  SELECT order_id, amount_usd, tax_rate\n  FROM read_parquet('s3://lakehouse/silver/orders_50m.parquet')\n\"\"\").arrow()\n\n# Polars envuelve el puntero Arrow en 0 ms (Zero-Copy) y ejecuta instrucciones SIMD AVX-512\ndf_pl = pl.from_arrow(arrow_tbl).with_columns(\n  (pl.col(\"amount_usd\") * (1.0 - pl.col(\"tax_rate\"))).alias(\"net_usd\")\n)",
        "expectedOutput": [
          {
            "copias_en_ram": "0 copias (Puntero Arrow compartido)",
            "uso_simd_cpu": "100% (Vectores contiguos en caché L1/L2)",
            "tiempo_50m_filas": "0.31 seg (150x más rápido)"
          }
        ]
      }
    ]
  },
  "checks": [
    {
      "id": "c1",
      "type": "mcq",
      "prompt": "Tu equipo está construyendo un sistema que almacena 50 millones de reseñas de clientes junto con sus vectores de embeddings (`float32[1536]`) y necesita recuperar en menos de 10 ms las 20 filas exactas más similares a una consulta (acceso aleatorio por índice de fila). ¿Por qué el formato **Lance** supera a **Apache Parquet** en este caso específico?",
      "options": [
        {
          "id": "a",
          "text": "Porque Parquet fue diseñado para escaneos secuenciales por lotes y obliga a descomprimir páginas enteras para llegar a una fila individual, mientras que Lance garantiza acceso aleatorio puntual en tiempo O(1) e integra índices vectoriales nativos sobre Apache Arrow.",
          "correct": true,
          "feedback": "Exacto. Parquet es extraordinario para agregaciones OLAP secuenciales, pero Lance está diseñado físicamente para acceso aleatorio ultrarrápido y columnas vectoriales/multimodales sin el overhead de descomprimir Row Groups enteros."
        },
        {
          "id": "b",
          "text": "Porque Parquet solo permite guardar un máximo de 3 columnas por tabla.",
          "correct": false,
          "feedback": "Parquet soporta miles de columnas; su limitación ante vectores y búsquedas puntuales radica en el costo de lectura aleatoria de páginas y el tamaño de metadatos."
        },
        {
          "id": "c",
          "text": "Porque Lance guarda todos los datos como texto plano CSV sin tipos.",
          "correct": false,
          "feedback": "Al contrario: Lance es un formato binario columnar fuertemente tipado y 100% compatible con Apache Arrow."
        }
      ],
      "explanation": "Exacto. Parquet es extraordinario para agregaciones OLAP secuenciales, pero Lance está diseñado físicamente para acceso aleatorio ultrarrápido y columnas vectoriales/multimodales sin el overhead de descomprimir Row Groups enteros."
    },
    {
      "id": "c2",
      "type": "mcq",
      "prompt": "Ejecutas una consulta en DuckDB desde Python y quieres pasar el resultado a Polars sin duplicar la tabla en RAM. ¿Qué secuencia aprovecha la interfaz en memoria de Apache Arrow?",
      "options": [
        {
          "id": "a",
          "text": "pl.from_arrow(con.execute(sql).fetch_arrow_table())",
          "correct": true,
          "feedback": "Correcto: DuckDB produce RecordBatches de Arrow y Polars adopta directamente los punteros a esos búferes de memoria."
        },
        {
          "id": "b",
          "text": "pl.from_pandas(con.execute(sql).fetchall())",
          "correct": false,
          "feedback": "Incorrecto: fetchall() crea millones de tuplas de Python en memoria antes de volver a convertirlas."
        },
        {
          "id": "c",
          "text": "Exportar a CSV temporal en disco y leerlo con pl.read_csv().",
          "correct": false,
          "feedback": "Incorrecto: serializar a texto en disco y volver a parsear tipos es varios órdenes de magnitud más lento."
        }
      ],
      "explanation": "Al compartir la especificación de memoria de Apache Arrow, DuckDB y Polars intercambian descriptores de búfer en microsegundos sin copiar los arrays de datos."
    },
    {
      "id": "c3",
      "type": "mcq",
      "prompt": "¿Cómo representa Apache Arrow en memoria los valores `NULL` de una columna numérica de 64 bits sin romper la alineación para instrucciones vectoriales SIMD?",
      "options": [
        {
          "id": "a",
          "text": "Mediante un búfer separado de mapa de bits de validez (1 bit por fila) junto al búfer contiguo de valores de 64 bits.",
          "correct": true,
          "feedback": "Correcto: separar el bitmap de validez permite que el array numérico conserve posiciones fijas de 8 bytes alineadas para SIMD."
        },
        {
          "id": "b",
          "text": "Guardando el texto \"NULL\" intercalado dentro del array de números.",
          "correct": false,
          "feedback": "Incorrecto: mezclar tipos rompería el ancho fijo de 64 bits por elemento y obligaría a usar punteros en caja."
        },
        {
          "id": "c",
          "text": "Sustituyendo todos los nulos por el número -1 en el array.",
          "correct": false,
          "feedback": "Incorrecto: -1 es un número válido en datos reales y corrompería cualquier suma o promedio."
        }
      ],
      "explanation": "Arrow separa cada columna en búferes especializados: un bitmap de validez para nulos y búferes contiguos de valores (y de offsets si el tipo es de longitud variable)."
    }
  ],
  "practice": {
    "type": "fill-blanks",
    "title": "Transferencia sin copias con Arrow y Polars",
    "language": "sql",
    "prompt": "Completa el código Python para: 1) Exportar el resultado de una consulta DuckDB como una tabla Apache Arrow en memoria sin serializar a filas, 2) Importarla en Polars con Zero-Copy, y 3) Calcular la columna `margin_usd` usando una expresión vectorizada SIMD.",
    "starterCode": "import duckdb\nimport polars as pl\n\n# 1. Ejecutar consulta en DuckDB y obtener puntero de memoria Apache Arrow\narrow_buffer = duckdb.sql(\"\"\"\n  SELECT product_id, revenue_usd, cost_usd\n  FROM 'gold_sales_2026.parquet'\n  WHERE quarter = '2026-Q4'\n\"\"\").{{b1}}()\n\n# 2. Construir el DataFrame de Polars apuntando al mismo buffer Arrow (Zero-Copy)\ndf = pl.{{b2}}(arrow_buffer)\n\n# 3. Calcular el margen de forma vectorizada SIMD (sin bucles ni .apply)\nresultado = df.with_columns(\n  ({{b3}} - pl.col(\"cost_usd\")).alias(\"margin_usd\")\n)",
    "expected": "import duckdb\nimport polars as pl\n\n# 1. Ejecutar consulta en DuckDB y obtener puntero de memoria Apache Arrow\narrow_buffer = duckdb.sql(\"\"\"\n  SELECT product_id, revenue_usd, cost_usd\n  FROM 'gold_sales_2026.parquet'\n  WHERE quarter = '2026-Q4'\n\"\"\").{{b1}}()\n\n# 2. Construir el DataFrame de Polars apuntando al mismo buffer Arrow (Zero-Copy)\ndf = pl.{{b2}}(arrow_buffer)\n\n# 3. Calcular el margen de forma vectorizada SIMD (sin bucles ni .apply)\nresultado = df.with_columns(\n  ({{b3}} - pl.col(\"cost_usd\")).alias(\"margin_usd\")\n)",
    "orderMatters": true,
    "hints": [
      "Método DuckDB para exportar a Arrow: En la API de DuckDB 1.x, el método `.arrow()` (o `.fetch_arrow_table()`) entrega el resultado directamente en formato Apache Arrow.",
      "Constructor Zero-Copy de Polars: Usa `pl.from_arrow(...)` para crear un DataFrame de Polars leyendo los buffers de memoria de Arrow sin clonar los bytes.",
      "Expresión columnar de ingresos: Referencia la columna de ingresos con `pl.col(\"revenue_usd\")` para que Polars ejecute la resta sobre el vector contiguo con instrucciones SIMD."
    ],
    "solution": "import duckdb\nimport polars as pl\n\n# 1. Ejecutar consulta en DuckDB y obtener puntero de memoria Apache Arrow\narrow_buffer = duckdb.sql(\"\"\"\n  SELECT product_id, revenue_usd, cost_usd\n  FROM 'gold_sales_2026.parquet'\n  WHERE quarter = '2026-Q4'\n\"\"\").{{b1}}()\n\n# 2. Construir el DataFrame de Polars apuntando al mismo buffer Arrow (Zero-Copy)\ndf = pl.{{b2}}(arrow_buffer)\n\n# 3. Calcular el margen de forma vectorizada SIMD (sin bucles ni .apply)\nresultado = df.with_columns(\n  ({{b3}} - pl.col(\"cost_usd\")).alias(\"margin_usd\")\n)",
    "solutionExplanation": "Extrae los resultados desde DuckDB directamente en buffers columnares Apache Arrow (`.arrow()`). Usa `pl.from_arrow()` para lograr transferencia Zero-Copy en memoria RAM. Reemplaza funciones escalares lentas por expresiones vectorizadas `pl.col()` compatibles con SIMD.",
    "blanks": [
      {
        "id": "b1",
        "placeholder": "Método DuckDB para exportar a Arrow",
        "acceptedAnswers": [
          "arrow",
          "fetch_arrow_table"
        ],
        "hint": "En la API de DuckDB 1.x, el método `.arrow()` (o `.fetch_arrow_table()`) entrega el resultado directamente en formato Apache Arrow."
      },
      {
        "id": "b2",
        "placeholder": "Constructor Zero-Copy de Polars",
        "acceptedAnswers": [
          "from_arrow"
        ],
        "hint": "Usa `pl.from_arrow(...)` para crear un DataFrame de Polars leyendo los buffers de memoria de Arrow sin clonar los bytes."
      },
      {
        "id": "b3",
        "placeholder": "Expresión columnar de ingresos",
        "acceptedAnswers": [
          "pl.col(\"revenue_usd\")",
          "pl.col('revenue_usd')"
        ],
        "hint": "Referencia la columna de ingresos con `pl.col(\"revenue_usd\")` para que Polars ejecute la resta sobre el vector contiguo con instrucciones SIMD."
      }
    ],
    "expectedOutputTable": [
      {
        "product_id": "SKU-901",
        "revenue_usd": "$125,000.00",
        "cost_usd": "$75,000.00",
        "margin_usd": "$50,000.00"
      },
      {
        "product_id": "SKU-902",
        "revenue_usd": "$84,200.00",
        "cost_usd": "$50,520.00",
        "margin_usd": "$33,680.00"
      }
    ],
    "rubricCriteria": [
      "Extrae los resultados desde DuckDB directamente en buffers columnares Apache Arrow (`.arrow()`).",
      "Usa `pl.from_arrow()` para lograr transferencia Zero-Copy en memoria RAM.",
      "Reemplaza funciones escalares lentas por expresiones vectorizadas `pl.col()` compatibles con SIMD."
    ]
  },
  "roleNotes": {
    "de": "Sustituye conectores legacy ODBC/JDBC (que serializan fila por fila) por **ADBC (Arrow Database Connectivity)** y **Arrow Flight SQL**, multiplicando por 10x-25x el ancho de banda entre motores. Almacena tablas de hechos financieras en Parquet v2 (Iceberg) y materializa índices vectoriales y corpus de documentos para agentes IA en tablas **Lance**.",
    "da": "Intercambia tablas de decenas de gigabytes entre DuckDB, Polars y PyArrow usando `.to_arrow()` o consultas directas sobre punteros de memoria sin sufrir errores de `Out Of Memory (OOM)`. Evita iterar con `for` o `.apply(lambda row: ...)` en Python (que rompe la vectorización SIMD y vuelve al intérprete lento byte a byte); utiliza siempre expresiones nativas columnares.",
    "bi": "Alimenta motores BI en el navegador y servidores de métricas mediante **Arrow IPC Streams**, eliminando el parseo lento de archivos JSON gigantes en los dashboards. Permite que tableros ejecutivos crucen métricas estructuradas de ventas con clasificaciones semánticas de tickets de soporte almacenadas en columnas vectoriales. Garantiza latencias sub-segundo en filtros interactivos gracias a que los motores en memoria operan directamente sobre vectores SIMD."
  },
  "summary": [
    "Apache Arrow estandariza la representación columnar en RAM para compartir datos entre motores mediante punteros.",
    "Los búferes contiguos permiten procesar vectores completos por ciclo de reloj con instrucciones SIMD.",
    "ADBC y Arrow Flight sustituyen la serialización fila a fila de JDBC/ODBC por flujos columnares directos.",
    "Lance y Vortex optimizan el acceso aleatorio O(1) por fila y la búsqueda sobre vectores multimodales."
  ],
  "flashcards": [
    {
      "id": "fc-de2-arr-01",
      "front": "¿Cuál es la diferencia de propósito entre Apache Parquet y Apache Arrow?",
      "back": "Parquet es un formato de archivo en disco orientado a alta compresión; Arrow es un formato de tablas en memoria RAM orientado a CPU SIMD e intercambio zero-copy."
    },
    {
      "id": "fc-de2-arr-02",
      "front": "¿Por qué convertir un resultado de DuckDB a pandas con `.df()` puede agotar la memoria frente a `.arrow()`?",
      "back": "Porque `.df()` materializa objetos Python y copias de memoria para textos, mientras `.arrow()` expone los búferes columnares directamente sin duplicarlos."
    },
    {
      "id": "fc-de2-arr-03",
      "front": "¿Por qué Parquet es ineficiente cuando necesitas recuperar 500 filas específicas por índice tras una búsqueda vectorial?",
      "back": "Porque obliga a descomprimir páginas o Row Groups enteros por cada fila buscada (amplificación de lectura), mientras Lance ofrece acceso directo O(1) por desplazamiento."
    }
  ],
  "glossaryTerms": [
    "c14-apache-arrow-zerocopy",
    "c12-parquet-columnar"
  ],
  "sources": [
    {
      "title": "Apache Arrow Official Specification — Columnar Format and Memory Layout",
      "url": "https://arrow.apache.org/docs/format/Columnar.html",
      "publisher": "Apache Software Foundation",
      "accessed": "2026-10-29",
      "supports": "Disposición física de búferes de validez, offsets y valores en memoria RAM."
    },
    {
      "title": "DuckDB Documentation — DuckDB and Apache Arrow Zero-Copy Integration",
      "url": "https://duckdb.org/docs/guides/python/sql_on_arrow.html",
      "publisher": "DuckDB Foundation",
      "accessed": "2026-10-29",
      "supports": "Intercambio sin copia entre DuckDB, PyArrow y Polars en un mismo proceso."
    },
    {
      "title": "Lance Format Documentation — Random Access and Vector Search on Columnar Data",
      "url": "https://lancedb.github.io/lance/format.html",
      "publisher": "LanceDB",
      "accessed": "2026-10-29",
      "supports": "Diseño de formato columnar para acceso aleatorio por índice y vectores de alta dimensión."
    }
  ],
  "aiNotes": "Aclara siempre que Arrow no reemplaza a Parquet en el almacenamiento de objetos cuando se busca máxima compresión; ambos se complementan (Parquet en reposo en S3, Arrow en tránsito y en memoria RAM).",
  "needsReview": true,
  "legacyId": "l8-arrow-lance-vortex",
  "legacyOrder": 8,
  "stageId": "stage-3",
  "subtitle": "Intercambio de datos sin serialización en RAM, vectorización SIMD y formatos con acceso aleatorio.",
  "goal": "Analizar el layout de memoria columnar de Apache Arrow (Zero-Copy e IPC/Flight), comprender por qué la ejecución vectorizada SIMD multiplica por 20x el rendimiento en CPU, y evaluar cuándo usar Parquet v2 frente a Lance o Vortex.",
  "pipelineChallenge": {
    "title": "Flujo en memoria con Arrow y SIMD",
    "scenario": "Ordena el flujo de datos de una plataforma moderna que combina tablas transaccionales y embeddings de IA sin pagar impuestos de serialización entre procesos.",
    "steps": [
      {
        "id": "step-1",
        "label": "1. Almacenamiento físico especializado por carga en Parquet y Lance",
        "role": "DE",
        "detail": "Persistir hechos tabulares masivos en Parquet v2 (optimizado para escaneos por rango) y embeddings/documentos multimodales en formato Lance (optimizado para acceso aleatorio O(1))."
      },
      {
        "id": "step-2",
        "label": "2. Proyección a bloques contiguos de Apache Arrow en RAM",
        "role": "DE",
        "detail": "Cargar únicamente las columnas solicitadas en buffers estandarizados de Arrow (Validity Bitmap + Offsets + Values) alineados a 64 bytes."
      },
      {
        "id": "step-3",
        "label": "3. Procesamiento vectorizado SIMD e intercambio de punteros",
        "role": "DA",
        "detail": "Ejecutar joins y transformaciones por lotes de 2,048 valores en la caché L1/L2 del CPU compartiendo el puntero de memoria entre DuckDB y Polars en 0 copias."
      },
      {
        "id": "step-4",
        "label": "4. Transporte de baja latencia mediante Arrow Flight hacia BI",
        "role": "BI",
        "detail": "Entregar los lotes columnares directamente al cliente visual o servicio de métricas sin serializar ni parsear cadenas JSON intermedias."
      }
    ],
    "explanation": "Esta arquitectura elimina los cuellos de botella históricos: cada formato en disco (Parquet/Lance) cumple su propósito físico, Apache Arrow unifica la memoria RAM sin copias y las instrucciones SIMD procesan los vectores a la velocidad máxima del silicio."
  },
  "relatedLessons": [
    {
      "id": "l7-columnar-parquet",
      "reason": "Contrasta el almacenamiento comprimido en disco de Parquet con la representación en memoria RAM de Apache Arrow."
    },
    {
      "id": "l9-duckdb-polars-marimo",
      "reason": "Aplica este intercambio Zero-Copy en la práctica uniendo DuckDB 1.x, Polars Lazy y cuadernos Marimo."
    },
    {
      "id": "l18-mcp-semantic-ai-rag",
      "reason": "Verás cómo Lance y DuckDB impulsan el RAG Híbrido (BM25 + HNSW) para agentes de IA conectados por MCP."
    }
  ]
};

export default lesson;
