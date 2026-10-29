// Lección migrada al esquema v2 mediante scripts/migrate-legacy.mjs
const lesson = {
  "id": "de2-formatos-01-columnar-parquet",
  "moduleId": "de2-formatos",
  "tracks": [
    "de"
  ],
  "level": 2,
  "order": 1,
  "title": "Formato físico Parquet v2, zone maps y filtros de Bloom",
  "minutes": 30,
  "prerequisites": [
    "c2-dimensional-02-star-schema-obt"
  ],
  "contentVersion": 1,
  "hook": "En Mercado Brisa (empresa ficticia), la tabla de eventos de navegación `events` tiene 60 columnas y 100 millones de filas (120 GB sin comprimir). El tablero diario solo ejecuta `SELECT store_id, SUM(amount_usd) FROM events WHERE event_date = '2025-10-28'`. En una réplica PostgreSQL orientada a filas, el disco lee los 120 GB completos porque las 60 columnas de cada fila están contiguas. Al pasar a archivos Parquet ordenados por fecha, la consulta lee 42 MB en 80 ms. ¿Cómo logra Parquet descartar el 99.9 % del archivo sin abrirlo?",
  "objectives": [
    "Explicar la estructura interna de un archivo Apache Parquet: Row Groups, Column Chunks, Pages y Footer.",
    "Aprovechar la poda de columnas (projection pushdown) y el salto de bloques mediante zone maps (min/max).",
    "Ordenar físicamente las tablas al escribir (clustering) y añadir filtros de Bloom para claves de alta cardinalidad."
  ],
  "sections": [
    {
      "id": "almacenamiento-por-filas-nsm-frente-a-formato-hi",
      "heading": "Almacenamiento por filas (NSM) frente a formato híbrido columnar (PAX)",
      "body": "En bases de datos transaccionales como PostgreSQL o MySQL (modelo NSM, N-ary Storage Model), todos los atributos de una fila (`event_id, user_id, email, device_os, country_code, revenue_usd...`) se escriben contiguos en páginas de 8 KB. Esto es ideal para insertar o actualizar un pedido individual (`INSERT INTO orders`), pero desastroso para analítica: sumar una sola columna obliga al disco y a la RAM a transferir las otras 59 columnas irrelevantes.\nApache Parquet implementa la arquitectura híbrida PAX (Partition Attributes Across): primero divide la tabla horizontalmente en **Row Groups** (bloques de 128 MB a 512 MB o ~1 millón de filas) y, dentro de cada Row Group, almacena cada columna de forma vertical y contigua en un **Column Chunk** dividido en **Data Pages**.",
      "interactive": {
        "component": "row-vs-columnar-storage",
        "caption": "Simulador interactivo: Formato físico Parquet v2, zone maps y filtros de Bloom"
      }
    },
    {
      "id": "codificaciones-en-parquet-diccionario-rle-y-empa",
      "heading": "Codificaciones en Parquet: diccionario, RLE y empaquetado delta",
      "body": "Cuando millones de valores de la misma columna viven juntos en un Column Chunk, su entropía cae drásticamente y permite aplicar codificaciones especializadas antes de la compresión general (Zstandard):\n- **Dictionary Encoding + RLE / Bit-Packing**: Si `country_code` tiene solo 40 países repetidos en 1 millón de filas, Parquet crea un diccionario local (`0 = MX, 1 = CO, 2 = ES...`) y reemplaza las cadenas por enteros de 6 bits; si además las filas están ordenadas, agrupa secuencias idénticas con Run-Length Encoding (`[MX, 14500 veces]`).\n- **Delta Binary Packed y Byte Stream Split (Parquet v2)**: Para timestamps y secuencias enteras almacena únicamente la diferencia (`delta`) entre valores consecutivos, y para números de punto flotante (`FLOAT`/`DOUBLE`) separa los bytes de signo, exponente y mantisa para maximizar la compresión ZSTD.",
      "example": {
        "language": "sql",
        "code": "-- EXCELENTE: 1) Escribir el Parquet ordenado físicamente con ZSTD y Row Groups de 1M filas\nCOPY (\n  SELECT * FROM silver.events ORDER BY event_ts, country_code\n) TO 's3://lakehouse/gold/events_2026_sorted.parquet'\n  (FORMAT PARQUET, PARQUET_VERSION V2, COMPRESSION ZSTD, ROW_GROUP_SIZE 1000000);\n\n-- 2) Consultar proyectando solo 2 columnas y un rango de comparación directa sobre event_ts\nSELECT\n  country_code,\n  SUM(revenue_usd) AS total_revenue_usd\nFROM read_parquet('s3://lakehouse/gold/events_2026_sorted.parquet')\nWHERE event_ts >= TIMESTAMP '2026-10-28 00:00:00'\n  AND event_ts <  TIMESTAMP '2026-10-29 00:00:00'\nGROUP BY country_code;",
        "expectedOutput": [
          {
            "columnas_leidas": "2 / 60 (3.3%)",
            "row_groups_escaneados": "2 / 100 (98% saltados)",
            "datos_transferidos": "42.10 MB",
            "latencia_consulta": "0.08 seg"
          }
        ]
      }
    },
    {
      "id": "zone-maps-indice-de-paginas-y-efecto-del-ordenam",
      "heading": "Zone maps, índice de páginas y efecto del ordenamiento físico",
      "body": "En el **Footer** del archivo Parquet y en el **ColumnIndex** de cada página se guardan estadísticas exactas por bloque: `min_value`, `max_value` y `null_count` (conocidos como **Zone Maps**). Cuando ejecutas `WHERE event_date = '2026-10-28'` (**Predicate Pushdown**), el motor lee primero el Footer de pocos kilobytes: si un Row Group reporta `min = 2026-10-01` y `max = 2026-10-05`, el motor salta esos 128 MB sin siquiera solicitarlos a S3/GCS (**Data Skipping**).\nAtención al matiz crítico: si insertas datos en orden aleatorio respecto a `event_date`, todos los Row Groups tendrán `min = 2026-01-01` y `max = 2026-10-28`, inutilizando por completo los Zone Maps. Ordenar físicamente (`ORDER BY event_date, country_code` o curvas espaciales **Z-Order / Hilbert** cuando filtras por varias dimensiones) es lo que activa el salto de bloques."
    },
    {
      "id": "filtros-de-bloom-por-bloques-y-el-problema-de-lo",
      "heading": "Filtros de Bloom por bloques y el problema de los archivos pequeños",
      "body": "¿Qué ocurre cuando un analista busca un identificador puntual de alta cardinalidad como `WHERE order_id = 'ORD-8841209'`? Como los UUIDs o hashes se distribuyen en todo el rango alfanumérico, el `min` y `max` de cada Row Group siempre cubrirán desde `ORD-000...` hasta `ORD-999...`, haciendo que los Zone Maps no descarten nada.\nPara resolverlo, Parquet v2 incorpora **Split-Block Bloom Filters (SBBF)**: estructuras probabilísticas ultracompactas en bits que responden con **0% de falsos negativos** si un `order_id` NO existe en ese Row Group, permitiendo saltar el 99% de los bloques en búsquedas de aguja en un pajar. Finalmente, evita siempre el **Small Files Problem** (miles de archivos de 2 MB en Object Storage): la latencia de red HTTP por abrir cada archivo destruye el rendimiento; compacta siempre en archivos de 128 MB a 512 MB."
    }
  ],
  "workedExample": {
    "title": "Ejemplo guiado: Formato físico Parquet v2, zone maps y filtros de Bloom",
    "description": "Compara el impacto físico en I/O entre una consulta con antipatrones (`SELECT *` y función sobre la columna filtrada) frente a una consulta con Projection y Predicate Pushdown sobre Parquet v2 ordenado:",
    "audit": "",
    "steps": [
      {
        "label": "Antipatrón: SELECT * y predicado con función envolvente",
        "explanation": "Compara el impacto físico en I/O entre una consulta con antipatrones (`SELECT *` y función sobre la columna filtrada) frente a una consulta con Projection y Predicate Pushdown sobre Parquet v2 ordenado:",
        "code": "-- MAL: 1) SELECT * obliga a descomprimir las 60 columnas de todos los Row Groups.\n-- 2) Aplicar STRFTIME() sobre la columna impide comparar directamente contra el min/max del Footer.\nSELECT *\nFROM read_parquet('s3://lakehouse/gold/events_2026_unsorted.parquet')\nWHERE STRFTIME(event_ts, '%Y-%m-%d') = '2026-10-28';",
        "expectedOutput": [
          {
            "columnas_leidas": "60 / 60 (100%)",
            "row_groups_escaneados": "100 / 100 (Sin podado)",
            "datos_transferidos": "18.40 GB",
            "latencia_consulta": "14.20 seg"
          }
        ]
      },
      {
        "label": "Solución óptima: proyección selectiva, rango directo y ZSTD",
        "explanation": "Compara ahora la consulta corregida y verifica cómo las filas y totales coinciden con la auditoría.",
        "code": "-- EXCELENTE: 1) Escribir el Parquet ordenado físicamente con ZSTD y Row Groups de 1M filas\nCOPY (\n  SELECT * FROM silver.events ORDER BY event_ts, country_code\n) TO 's3://lakehouse/gold/events_2026_sorted.parquet'\n  (FORMAT PARQUET, PARQUET_VERSION V2, COMPRESSION ZSTD, ROW_GROUP_SIZE 1000000);\n\n-- 2) Consultar proyectando solo 2 columnas y un rango de comparación directa sobre event_ts\nSELECT\n  country_code,\n  SUM(revenue_usd) AS total_revenue_usd\nFROM read_parquet('s3://lakehouse/gold/events_2026_sorted.parquet')\nWHERE event_ts >= TIMESTAMP '2026-10-28 00:00:00'\n  AND event_ts <  TIMESTAMP '2026-10-29 00:00:00'\nGROUP BY country_code;",
        "expectedOutput": [
          {
            "columnas_leidas": "2 / 60 (3.3%)",
            "row_groups_escaneados": "2 / 100 (98% saltados)",
            "datos_transferidos": "42.10 MB",
            "latencia_consulta": "0.08 seg"
          }
        ]
      }
    ]
  },
  "checks": [
    {
      "id": "c1",
      "type": "mcq",
      "prompt": "Tienes 200 millones de pedidos guardados en archivos Parquet ordenados únicamente por `event_date`. Si un analista ejecuta frecuentemente `SELECT * FROM orders WHERE order_id = 'ORD-7729104'` (un UUID aleatorio), ¿por qué los Zone Maps (`min/max`) de `order_id` no logran saltar ningún Row Group y qué debes activar?",
      "options": [
        {
          "id": "a",
          "text": "Porque al ser `order_id` un identificador de alta cardinalidad distribuido uniformemente en todas las fechas, cada Row Group tiene un `min` cercano a `0000...` y un `max` cercano a `ffff...`; debes activar Split-Block Bloom Filters sobre `order_id` (y proyectar solo las columnas necesarias en lugar de `SELECT *`).",
          "correct": true,
          "feedback": "Exacto. Los Zone Maps (`min/max`) brillan en columnas ordenadas o correlacionadas con el orden físico, pero para búsquedas puntuales en columnas de alta cardinalidad no ordenadas los Bloom Filters son indispensables."
        },
        {
          "id": "b",
          "text": "Porque Parquet no soporta cadenas de texto en la cláusula `WHERE`.",
          "correct": false,
          "feedback": "Parquet soporta perfectamente cadenas de texto (`BYTE_ARRAY` con UTF-8) y estadísticas sobre ellas; el problema es el traslape del rango `[min, max]` cuando los valores son aleatorios."
        },
        {
          "id": "c",
          "text": "Debes dividir los 200 millones de filas en 200 millones de archivos Parquet de 1 fila cada uno.",
          "correct": false,
          "feedback": "Eso crearía el peor caso posible del \"Small Files Problem\", colapsando el almacenamiento de objetos por millones de llamadas de metadatos."
        }
      ],
      "explanation": "Exacto. Los Zone Maps (`min/max`) brillan en columnas ordenadas o correlacionadas con el orden físico, pero para búsquedas puntuales en columnas de alta cardinalidad no ordenadas los Bloom Filters son indispensables."
    },
    {
      "id": "c2",
      "type": "mcq",
      "prompt": "Tienes un archivo Parquet de 50 Row Groups con `event_date` entre enero y diciembre. Si los datos se insertaron desordenados y cada Row Group tiene `min(event_date) = 2025-01-01` y `max(event_date) = 2025-12-31`, ¿cuántos Row Groups leerá una consulta con `WHERE event_date = '2025-06-15'`?",
      "options": [
        {
          "id": "a",
          "text": "Los 50 Row Groups completos, porque el valor buscado cae dentro del intervalo [min, max] de todos los bloques.",
          "correct": true,
          "feedback": "Correcto: sin orden físico previo al escribir, los rangos min/max se solapan al 100 % y el motor no puede descartar ningún bloque."
        },
        {
          "id": "b",
          "text": "Solo 1 Row Group, porque Parquet indexa cada fila individualmente como un árbol B-Tree.",
          "correct": false,
          "feedback": "Incorrecto: Parquet no mantiene un B-Tree global por fila; depende de las estadísticas por Row Group y Page."
        },
        {
          "id": "c",
          "text": "Ninguno, porque lee el resultado directamente del footer.",
          "correct": false,
          "feedback": "Incorrecto: el footer solo guarda metadatos y estadísticas por bloque, no el detalle de las filas filtradas."
        }
      ],
      "explanation": "La eficacia del data skipping por zone maps depende directamente de cómo ordenas las filas (ORDER BY event_date) antes de escribir el archivo Parquet."
    },
    {
      "id": "c3",
      "type": "mcq",
      "prompt": "En una tabla Parquet ordenada por `event_date`, los analistas también hacen búsquedas frecuentes por `WHERE order_id = 'ORD-99812'`. Como `order_id` no correlacióna con la fecha, sus rangos min/max abarcan todo el alfabeto en cada bloque. ¿Qué estructura del formato Parquet acelera este filtro puntual?",
      "options": [
        {
          "id": "a",
          "text": "Un filtro de Bloom por columna (Column Bloom Filter) almacenado junto a los metadatos del Row Group.",
          "correct": true,
          "feedback": "Correcto: el filtro de Bloom comprueba por hash si ORD-99812 puede existir en el bloque y descarta la mayoría de Row Groups sin descomprimirlos."
        },
        {
          "id": "b",
          "text": "Aumentar el tamaño del Row Group a 10 GB.",
          "correct": false,
          "feedback": "Incorrecto: hacer los bloques más grandes reduce la granularidad de descarte y obliga a leer más datos en memoria."
        },
        {
          "id": "c",
          "text": "Desactivar la compresión Zstandard.",
          "correct": false,
          "feedback": "Incorrecto: quitar compresión multiplica los bytes leídos desde disco o almacenamiento de objetos."
        }
      ],
      "explanation": "Mientras que los zone maps (min/max) requieren orden físico, los filtros de Bloom funcionan por resumen de hashes y son ideales para predicados de igualdad sobre IDs."
    }
  ],
  "practice": {
    "type": "sql",
    "title": "Projection y Predicate Pushdown sobre Parquet",
    "language": "sql",
    "prompt": "Escribe una consulta con predicados SARGables directos sobre `orders` (`order_date >= DATE '2025-01-01' AND status = 'completed'`) unida con `customers` para calcular por `country_code`: `total_orders`, `unique_customers` y `net_revenue_usd`, ordenado por `net_revenue_usd DESC`.",
    "starterCode": "SELECT\n  c.country_code,\n  COUNT(o.order_id) AS total_orders,\n  COUNT(DISTINCT o.customer_id) AS unique_customers,\n  ROUND(SUM(o.total_usd), 2) AS net_revenue_usd\nFROM orders o\nJOIN customers c ON o.customer_id = c.customer_id\n-- TODO: Filtra con predicado directo sobre o.order_date >= DATE '2025-01-01' y o.status = 'completed'\nWHERE o.status = 'completed'\nGROUP BY c.country_code\nORDER BY net_revenue_usd DESC;",
    "expected": "SELECT\n  c.country_code,\n  COUNT(o.order_id) AS total_orders,\n  COUNT(DISTINCT o.customer_id) AS unique_customers,\n  ROUND(SUM(o.total_usd), 2) AS net_revenue_usd\nFROM orders o\nJOIN customers c ON o.customer_id = c.customer_id\nWHERE o.order_date >= DATE '2025-01-01'\n  AND o.status = 'completed'\nGROUP BY c.country_code\nORDER BY net_revenue_usd DESC;",
    "orderMatters": true,
    "hints": [
      "Compara directamente la columna `o.order_date >= DATE '2025-01-01'` sin envolverla en funciones `CAST` ni `STRFTIME` para aprovechar los Zone Maps.",
      "Combina el filtro temporal con `AND o.status = 'completed'`.",
      "Mantén `GROUP BY c.country_code` y `ORDER BY net_revenue_usd DESC`."
    ],
    "solution": "SELECT\n  c.country_code,\n  COUNT(o.order_id) AS total_orders,\n  COUNT(DISTINCT o.customer_id) AS unique_customers,\n  ROUND(SUM(o.total_usd), 2) AS net_revenue_usd\nFROM orders o\nJOIN customers c ON o.customer_id = c.customer_id\nWHERE o.order_date >= DATE '2025-01-01'\n  AND o.status = 'completed'\nGROUP BY c.country_code\nORDER BY net_revenue_usd DESC;",
    "solutionExplanation": "Proyecta únicamente las columnas requeridas de `orders` y `customers` y aplica un predicado directo sobre `o.order_date >= DATE '2025-01-01'` que permite a DuckDB evaluar las estadísticas min/max del archivo Parquet."
  },
  "roleNotes": {
    "de": "Configura compresión `ZSTD` (mejor balance ratio/velocidad en 2026 que Snappy o Gzip) y ordena las tablas (`ORDER BY` o `Z-ORDER`) por las claves de filtro más frecuentes antes de escribir Parquet. Habilita `bloom_filter_columns` sobre llaves de alta cardinalidad (`user_id`, `order_id`, `trace_id`) y ejecuta jobs de compactación para mantener archivos entre 128 MB y 512 MB.",
    "da": "Destierra por completo el hábito de `SELECT *`: selecciona explícitamente solo las 3 o 5 columnas necesarias (**Projection Pushdown**) para reducir el I/O en un 90%. Escribe predicados **SARGables** (Search Argument Able): filtra con `WHERE event_ts >= '2026-10-28'` en lugar de envolver la columna en funciones como `WHERE CAST(event_ts AS VARCHAR) LIKE '2026-10-28%'` que ciegan los Zone Maps.",
    "bi": "Diseña dashboards con filtros obligatorios por rango de fecha predeterminado (ej. últimos 30 días) alineados con la clave de ordenamiento física del archivo Parquet. Monitorea los bytes escaneados por consulta en el motor del Lakehouse: un salto repentino en gigabytes leídos por reporte suele indicar que un filtro dejó de aprovechar el podado de bloques."
  },
  "summary": [
    "El almacenamiento columnar guarda juntos los valores de una misma columna, leyendo solo las columnas proyectadas.",
    "Cada Row Group registra estadísticas min/max en el footer para saltar bloques completos sin descomprimirlos.",
    "Los zone maps solo descartan bloques si los datos están físicamente ordenados por la columna filtrada.",
    "Los filtros de Bloom permiten descartar Row Groups al buscar un ID puntual de alta cardinalidad."
  ],
  "flashcards": [
    {
      "id": "fc-de2-parq-01",
      "front": "¿Por qué los zone maps (min/max) dejan de saltar bloques cuando escribes filas en orden aleatorio?",
      "back": "Porque cada Row Group acaba conteniendo casi todo el rango de fechas o valores, solapándose el min y el max en todos los bloques."
    },
    {
      "id": "fc-de2-parq-02",
      "front": "¿Para qué sirve un filtro de Bloom en el encabezado de un Row Group de Parquet?",
      "back": "Para responder con certeza si un valor de alta cardinalidad (como un order_id o UUID) NO está en ese Row Group sin leer las páginas."
    },
    {
      "id": "fc-de2-parq-03",
      "front": "¿Qué combinación de codificación aplica Parquet sobre una columna de texto con pocos valores distintos (país)?",
      "back": "Codificación por diccionario (sustituye cadenas por enteros pequeños) seguida de Run-Length Encoding (RLE) y empaquetado de bits."
    }
  ],
  "glossaryTerms": [
    "c12-parquet-columnar",
    "c13-zone-maps-skipping"
  ],
  "sources": [
    {
      "title": "Apache Parquet Official Documentation — File Format and Internal Layout",
      "url": "https://parquet.apache.org/docs/file-format/",
      "publisher": "Apache Software Foundation",
      "accessed": "2026-10-29",
      "supports": "Arquitectura interna de Row Groups, Column Chunks, Pages y metadatos en el Footer."
    },
    {
      "title": "Apache Parquet Documentation — Encodings (Dictionary, RLE, Delta) and Bloom Filters",
      "url": "https://parquet.apache.org/docs/file-format/bloomfilter/",
      "publisher": "Apache Software Foundation",
      "accessed": "2026-10-29",
      "supports": "Especificación de filtros de Bloom por columna para salto de bloques en predicados de igualdad."
    },
    {
      "title": "DuckDB Documentation — Reading and Writing Parquet Files",
      "url": "https://duckdb.org/docs/data/parquet/tips.html",
      "publisher": "DuckDB Foundation",
      "accessed": "2026-10-29",
      "supports": "Recomendaciones de tamaño de Row Group, compresión ZSTD y ordenamiento previo al escribir Parquet."
    }
  ],
  "aiNotes": "El alumno suele confundir el formato en disco (Parquet) con el formato en memoria (Arrow), o asumir que Parquet salta bloques mágicamente sin ordenar los datos al escribir. Recalca siempre que los zone maps requieren clustering previo por la columna de filtro.",
  "needsReview": true,
  "legacyId": "l7-columnar-parquet",
  "legacyOrder": 7,
  "stageId": "stage-3",
  "subtitle": "Organización por grupos de filas, codificación por diccionario y salto de bloques en disco.",
  "goal": "Comprender la arquitectura física de un archivo Apache Parquet v2 (Row Groups, Column Chunks, Data Pages, Zone Maps y Split-Block Bloom Filters) y cómo el ordenamiento físico permite saltar hasta el 98% del I/O.",
  "pipelineChallenge": {
    "title": "Secuencia física de escaneo en Parquet",
    "scenario": "Ordena los 4 pasos exactos que ocurren desde que Ingeniería de Datos escribe una tabla columnar en el Lakehouse hasta que un reporte de BI recibe el resultado saltando el 98% del disco.",
    "steps": [
      {
        "id": "step-1",
        "label": "1. Compactación y ordenamiento físico en escritura",
        "role": "DE",
        "detail": "Agrupar lotes pequeños en archivos de 256 MB, ordenar filas por `event_date, country_code` y generar estadísticas `min/max` y Bloom Filters en el Footer."
      },
      {
        "id": "step-2",
        "label": "2. Inspección del pie de archivo y podado de grupos de filas",
        "role": "DE",
        "detail": "El motor de consulta lee primero los últimos kilobytes del archivo Parquet (Footer) y descarta todos los Row Groups cuyo rango `min/max` o Bloom Filter no coincide con el `WHERE`."
      },
      {
        "id": "step-3",
        "label": "3. Lectura selectiva de bloques de columnas",
        "role": "DA",
        "detail": "Mediante peticiones HTTP Range Requests a S3/GCS, el motor descarga únicamente los bytes de las 2 columnas solicitadas en el `SELECT` dentro de los Row Groups sobrevivientes."
      },
      {
        "id": "step-4",
        "label": "4. Descompresión tardía y agregación para el tablero",
        "role": "BI",
        "detail": "El motor evalúa filtros sobre códigos de diccionario enteros y entrega la tabla agregada en milisegundos al panel ejecutivo de BI."
      }
    ],
    "explanation": "El rendimiento extremo de Parquet no es magia: requiere que DE ordene y compacte en la escritura (Paso 1) para que el motor pueda podar bloques leyendo solo el Footer (Paso 2), transferir solo los bytes de las columnas proyectadas por DA (Paso 3) y entregar agregaciones instantáneas a BI (Paso 4)."
  },
  "relatedLessons": [
    {
      "id": "l4-star-schema-obt",
      "reason": "Comprende por qué las tablas anchas (One Big Table) comprimen tan bien gracias a Dictionary Encoding y RLE en Parquet."
    },
    {
      "id": "l8-arrow-lance-vortex",
      "reason": "Descubre qué ocurre cuando los bloques de Parquet pasan del disco a la memoria RAM con Apache Arrow y SIMD."
    },
    {
      "id": "l10-iceberg-v3-medallion",
      "reason": "Aprende cómo Apache Iceberg v3 coordina miles de archivos Parquet con transacciones ACID y Deletion Vectors."
    }
  ]
};

export default lesson;
