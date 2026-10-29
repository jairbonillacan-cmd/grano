const lesson = {
  id: 'de2-formatos-01-columnar-parquet',
  legacyId: 'l7-columnar-parquet',
  legacyOrder: 7,
  moduleId: 'de2-formatos',
  tracks: ['de'],
  level: 2,
  order: 1,
  title: 'Formato físico Parquet v2, zone maps y filtros de Bloom',
  subtitle: 'Grupos de filas, páginas de datos, poda de columnas y filtrado físico en disco',
  minutes: 30,
  prerequisites: ['l2-window-functions', 'l3-asof-lateral-ctes'],
  glossaryTerms: [
    'parquet-row-group',
    'parquet-page-index',
    'zone-map',
    'bloom-filter',
    'predicate-pushdown'
  ],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), la tabla `events.parquet` almacena 65 000 eventos web en 1 099 791 bytes de disco, donde sus 12 columnas suman 4 933 709 bytes descomprimidos. Tan solo `event_ts_raw` (468 754 bytes comprimidos) y `event_ts` (423 601 bytes comprimidos) absorben el **81.93 %** del peso de las páginas. Si una consulta diaria necesita contar eventos por `event_type`, `device_type` y `campaign_id`, ¿cómo logra el motor leer apenas 7 478 bytes comprimidos y saltar grupos de filas enteros sin descomprimirlos?',

  objectives: [
    'Inspeccionar la jerarquía física de un archivo Parquet (Row Groups, Column Chunks, Data Pages y Footer) mediante parquet_metadata().',
    'Cuantificar el ahorro real de transferencia en bytes producido por la poda de columnas sobre tablas de Mercado Brisa.',
    'Distinguir cuándo un predicado aprovecha zone maps (estadísticas min y max) y cuándo requiere filtros de Bloom por bloques divididos.'
  ],

  sections: [
    {
      id: 'anatomia-parquet-poda-columnas',
      heading: 'Anatomía híbrida de Parquet y poda física de columnas',
      body: 'Un archivo CSV o JSON organiza los datos fila por fila en el disco. Si pides sumar una sola columna, el sistema operativo lee cada carácter de todas las columnas intermedias. Apache Parquet evita ese desperdicio mediante una disposición híbrida llamada **PAX** (*Partition Attributes Across*).\n\nPrimero divide la tabla horizontalmente en bloques llamados **Row Groups** (grupos de 10 000 a 1 000 000 de filas). Dentro de cada grupo, almacena cada atributo de forma vertical en un **Column Chunk** dividido en páginas contiguas (*Data Pages*). Al final del archivo escribe el **Footer** (`FileMetaData`). Ese pie registra el esquema tipado y los desplazamientos exactos en bytes de cada columna.\n\nEl lector abre primero el pie del archivo. Luego salta con `fseek` hacia los desplazamientos de las columnas solicitadas. En `events.parquet` de Mercado Brisa (`1 089 111 bytes` comprimidos en páginas), proyectar `event_type`, `device_type` y `campaign_id` lee solo **7 478 bytes comprimidos**. Así ignora el **99.31 %** del volumen de páginas.',
      example: {
        language: 'sql',
        code: `SELECT
  path_in_schema AS columna,
  type AS tipo_fisico,
  total_compressed_size AS bytes_comp,
  total_uncompressed_size AS bytes_raw,
  ROUND(100.0 * total_compressed_size / SUM(total_compressed_size) OVER (), 2) AS pct_archivo
FROM parquet_metadata('events.parquet')
ORDER BY bytes_comp DESC
LIMIT 6;`,
        expectedOutput: [
          { columna: 'event_ts_raw', tipo_fisico: 'BYTE_ARRAY', bytes_comp: 468754, bytes_raw: 1820024, pct_archivo: 43.04 },
          { columna: 'event_ts', tipo_fisico: 'INT64', bytes_comp: 423601, bytes_raw: 520023, pct_archivo: 38.89 },
          { columna: 'customer_id', tipo_fisico: 'INT32', bytes_comp: 54355, bytes_raw: 103627, pct_archivo: 4.99 },
          { columna: 'user_id', tipo_fisico: 'INT32', bytes_comp: 54355, bytes_raw: 103627, pct_archivo: 4.99 },
          { columna: 'session_id', tipo_fisico: 'BYTE_ARRAY', bytes_comp: 32841, bytes_raw: 1122876, pct_archivo: 3.02 },
          { columna: 'event_id', tipo_fisico: 'BYTE_ARRAY', bytes_comp: 32348, bytes_raw: 1080505, pct_archivo: 2.97 }
        ],
        explanation: 'La función parquet_metadata() lee exclusivamente el pie del archivo. Revela que event_ts_raw (43.04 %) y event_ts (38.89 %) concentran más del 81 % de los bytes comprimidos de events.parquet.'
      },
      interactive: {
        component: 'row-vs-columnar-storage',
        props: {
          mode: 'parquet',
          table: 'events.parquet'
        },
        caption: 'Compara los bloques de disco leídos por un formato orientado a filas frente a la lectura selectiva de Column Chunks en Parquet.'
      }
    },
    {
      id: 'zone-maps-indice-paginas',
      heading: 'Zone maps, índices de páginas y predicados SARGable',
      body: 'Evitar columnas innecesarias es solo la mitad del ahorro. Para no leer todas las filas, Parquet guarda estadísticas resumen llamadas **zone maps**. Estas estadísticas viven en cada *Column Chunk* y en el índice de páginas (`ColumnIndex` y `OffsetIndex`).\n\nCada bloque registra el valor mínimo (`stats_min_value`), el valor máximo (`stats_max_value`) y el conteo de nulos (`stats_null_count`). Cuando ejecutas un filtro directo (llamado **SARGable**, como `WHERE order_date >= DATE \'2025-10-01\'`), el motor aplica **empuje de predicados** (*predicate pushdown*). Compara tu constante contra el intervalo `[min, max]` antes de descomprimir una sola página. Si el valor buscado cae fuera del rango, descarta el bloque completo.\n\nEn cambio, si envuelves la columna en una función como `strftime(order_date, \'%Y-%m\')`, o si las filas se escribieron desordenadas, los grupos de filas se solapan. Al ordenar los 65 000 eventos de Mercado Brisa en 7 *Row Groups* de 10 000 filas por `event_ts`, filtrar octubre de 2025 salta **6 de los 7 Row Groups**. Además, el tamaño comprimido baja de `1 740 784` a `1 480 584 bytes`.',
      example: {
        language: 'sql',
        code: `SELECT
  device_type,
  COUNT(*) AS completed_orders,
  ROUND(SUM(total_usd), 2) AS revenue_usd
FROM orders
WHERE status = 'completed'
  AND order_date >= DATE '2025-10-01'
  AND order_date <  DATE '2025-11-01'
GROUP BY device_type
ORDER BY revenue_usd DESC;`,
        expectedOutput: [
          { device_type: 'desktop', completed_orders: 237, revenue_usd: 107638.26 },
          { device_type: 'mobile', completed_orders: 211, revenue_usd: 85000.09 },
          { device_type: 'pos_tienda', completed_orders: 88, revenue_usd: 33876.61 }
        ],
        explanation: 'Al expresar el filtro como un intervalo directo sobre order_date sin funciones envolventes, el lector Parquet compara las fechas contra stats_min_value y stats_max_value en el pie del archivo.'
      }
    },
    {
      id: 'filtros-bloom-alta-cardinalidad',
      heading: 'Filtros de Bloom por bloques divididos para búsquedas puntuales',
      body: '¿Qué ocurre cuando buscas una igualdad puntual sobre una columna de alta cardinalidad no ordenada, como `WHERE session_id = \'sess-98412\'`? Como los valores están dispersos por toda la tabla, el rango `[min, max]` de cada grupo de filas abarca casi todo el alfabeto. Por eso el *zone map* no puede descartar ningún bloque.\n\nPara resolver este caso, Parquet incorpora **filtros de Bloom por bloques divididos** (*Split Block Bloom Filters*). Un filtro de Bloom es una estructura probabilística de bits en el encabezado del *Column Chunk*. Al escribir el archivo, cada valor distinto se transforma con la función hash `xxHash64`. Ese hash enciende varios bits dentro de un bloque de **256 bits** alineado a una línea de caché SIMD.\n\nAl evaluar `session_id = \'sess-98412\'`, el motor calcula el hash del valor buscado y revisa esos bits. Si alguno vale `0`, garantiza con **cero falsos negativos** que el valor no existe en ese grupo de filas y lo salta. Si todos los bits valen `1`, el bloque puede contener el valor (con ~1 % de falsos positivos) y entonces lee la página.',
      example: {
        language: 'sql',
        code: `SELECT
  COUNT(*) AS total_filas,
  COUNT(DISTINCT session_id) AS sesiones_distintas,
  COUNT(DISTINCT customer_id) AS clientes_distintos,
  COUNT(DISTINCT device_type) AS dispositivos_distintos,
  COUNT(DISTINCT event_type) AS tipos_evento_distintos
FROM events;`,
        expectedOutput: [
          { total_filas: 65000, sesiones_distintas: 33267, clientes_distintos: 2400, dispositivos_distintos: 3, tipos_evento_distintos: 5 }
        ],
        explanation: 'La columna session_id tiene 33 267 valores distintos dispersos en las 65 000 filas. Es una candidata ideal para un filtro de Bloom, a diferencia de device_type (3 valores) o event_type (5 valores).'
      }
    }
  ],

  workedExample: {
    title: 'Auditoría de bytes leídos y poda en events.parquet y orders.parquet',
    description: 'El equipo de ingeniería necesita cuantificar cuántos bytes ahorra la poda de columnas en `events.parquet` y medir los pedidos completados de octubre de 2025 en `orders.parquet` usando predicados compatibles con zone maps.',
    steps: [
      {
        label: 'Paso 1 — Medir el ahorro de proyectar 3 columnas frente a leer todo events.parquet',
        code: `SELECT
  COUNT(*) AS total_columnas,
  SUM(total_compressed_size) AS bytes_comp_totales,
  SUM(total_uncompressed_size) AS bytes_raw_totales,
  SUM(CASE WHEN path_in_schema IN ('event_type', 'device_type', 'campaign_id')
           THEN total_compressed_size ELSE 0 END) AS bytes_comp_3cols,
  ROUND(100.0 * (1.0 - SUM(CASE WHEN path_in_schema IN ('event_type', 'device_type', 'campaign_id')
                                THEN total_compressed_size ELSE 0 END) * 1.0 / SUM(total_compressed_size)), 2) AS ahorro_comp_pct
FROM parquet_metadata('events.parquet');`,
        expectedOutput: [
          { total_columnas: 12, bytes_comp_totales: 1089111, bytes_raw_totales: 4933709, bytes_comp_3cols: 7478, ahorro_comp_pct: 99.31 }
        ],
        explanation: 'Las 12 columnas de events.parquet suman 1 089 111 bytes comprimidos (4 933 709 bytes sin comprimir). Proyectar event_type (2 398 bytes), device_type (2 429 bytes) y campaign_id (2 651 bytes) lee apenas 7 478 bytes y ahorra el 99.31 % del I/O.'
      },
      {
        label: 'Paso 2 — Inspeccionar las columnas más pesadas de orders.parquet en el Footer',
        code: `SELECT
  path_in_schema AS columna,
  type AS tipo_fisico,
  total_compressed_size AS bytes_comprimidos,
  total_uncompressed_size AS bytes_descomprimidos,
  ROUND(total_uncompressed_size * 1.0 / total_compressed_size, 2) AS ratio_compresion
FROM parquet_metadata('orders.parquet')
ORDER BY bytes_comprimidos DESC
LIMIT 5;`,
        expectedOutput: [
          { columna: 'order_ts', tipo_fisico: 'INT64', bytes_comprimidos: 109484, bytes_descomprimidos: 144023, ratio_compresion: 1.32 },
          { columna: 'total_usd', tipo_fisico: 'DOUBLE', bytes_comprimidos: 58809, bytes_descomprimidos: 144023, ratio_compresion: 2.45 },
          { columna: 'subtotal_usd', tipo_fisico: 'DOUBLE', bytes_comprimidos: 57881, bytes_descomprimidos: 144023, ratio_compresion: 2.49 },
          { columna: 'tax_usd', tipo_fisico: 'DOUBLE', bytes_comprimidos: 55841, bytes_descomprimidos: 144023, ratio_compresion: 2.58 },
          { columna: 'order_id', tipo_fisico: 'INT32', bytes_comprimidos: 43306, bytes_descomprimidos: 72023, ratio_compresion: 1.66 }
        ],
        explanation: 'En orders.parquet (380 955 bytes comprimidos en páginas), order_ts y los tres importes en coma flotante absorben más del 74 % del archivo.'
      },
      {
        label: 'Paso 3 — Ejecutar un filtro SARGable por fecha y estado sobre orders.parquet',
        code: `SELECT
  device_type,
  COUNT(*) AS completed_orders,
  ROUND(SUM(total_usd), 2) AS revenue_usd
FROM orders
WHERE status = 'completed'
  AND order_date >= DATE '2025-10-01'
  AND order_date <  DATE '2025-11-01'
GROUP BY device_type
ORDER BY revenue_usd DESC;`,
        expectedOutput: [
          { device_type: 'desktop', completed_orders: 237, revenue_usd: 107638.26 },
          { device_type: 'mobile', completed_orders: 211, revenue_usd: 85000.09 },
          { device_type: 'pos_tienda', completed_orders: 88, revenue_usd: 33876.61 }
        ],
        explanation: 'La consulta proyecta únicamente 4 de las 14 columnas de orders y empuja los predicados de rango y estado hasta el lector Parquet.'
      }
    ]
  },

  practice: {
    type: 'sql',
    title: 'Consulta con poda de columnas y predicado SARGable sobre orders y customers',
    prompt: 'Calcula los ingresos de pedidos completados desde el 1 de enero de 2025 (`order_date >= DATE \'2025-01-01\'` y `status = \'completed\'`) cruzando `orders` con `customers` por `customer_id`. Proyecta y devuelve por cada país (`customers.country_code`): `country_code`, `total_orders` (`COUNT(orders.order_id)`), `unique_customers` (`COUNT(DISTINCT orders.customer_id)`) y `net_revenue_usd` (`ROUND(SUM(orders.total_usd), 2)`), ordenado por `net_revenue_usd` de mayor a menor.',
    starterCode: `SELECT
  c.country_code,
  COUNT(o.order_id) AS total_orders,
  -- Completa unique_customers y net_revenue_usd redondeado a 2 decimales
FROM orders AS o
INNER JOIN customers AS c ON o.customer_id = c.customer_id
-- Aplica el filtro SARGable sobre o.order_date y o.status
GROUP BY c.country_code
ORDER BY net_revenue_usd DESC;`,
    solution: `SELECT
  c.country_code,
  COUNT(o.order_id) AS total_orders,
  COUNT(DISTINCT o.customer_id) AS unique_customers,
  ROUND(SUM(o.total_usd), 2) AS net_revenue_usd
FROM orders AS o
INNER JOIN customers AS c ON o.customer_id = c.customer_id
WHERE o.order_date >= DATE '2025-01-01'
  AND o.status = 'completed'
GROUP BY c.country_code
ORDER BY net_revenue_usd DESC;`,
    expectedOutputTable: [
      { country_code: 'ES', total_orders: 1171, unique_customers: 382, net_revenue_usd: 563336.09 },
      { country_code: 'AR', total_orders: 1195, unique_customers: 375, net_revenue_usd: 471975.83 },
      { country_code: 'CO', total_orders: 1172, unique_customers: 377, net_revenue_usd: 465762.1 },
      { country_code: 'CL', total_orders: 886, unique_customers: 331, net_revenue_usd: 400843.27 },
      { country_code: 'PE', total_orders: 940, unique_customers: 336, net_revenue_usd: 400359.4 },
      { country_code: 'MX', total_orders: 918, unique_customers: 339, net_revenue_usd: 384551.88 }
    ],
    orderMatters: true,
    hints: [
      'Usa COUNT(DISTINCT o.customer_id) AS unique_customers y ROUND(SUM(o.total_usd), 2) AS net_revenue_usd.',
      'Escribe el predicado SARGable directo: WHERE o.order_date >= DATE \'2025-01-01\' AND o.status = \'completed\'.',
      'Evita envolver o.order_date en funciones de texto o EXTRACT() para permitir el empuje de predicados contra los zone maps.'
    ],
    solutionExplanation: 'La consulta lee únicamente 5 de las 14 columnas de orders.parquet y 2 de las 11 columnas de customers.parquet, aplicando el predicado directo sobre order_date y status antes de ejecutar el cruce.'
  },

  checks: [
    {
      id: 'chk-parquet-footer-projection',
      type: 'mcq',
      prompt: 'En `events.parquet` de Mercado Brisa, `event_ts_raw` y `event_ts` ocupan el 81.93 % de los bytes comprimidos. Si ejecutas `SELECT device_type, COUNT(*) FROM events GROUP BY device_type`, ¿cómo evita el motor leer los bytes de esas dos columnas?',
      options: [
        {
          id: 'a',
          text: 'Lee primero el Footer al final del archivo, localiza el desplazamiento del Column Chunk de device_type y salta directamente a esos 2 429 bytes sin tocar los bloques de fechas.',
          correct: true,
          feedback: 'Correcto. El Footer indica el desplazamiento inicial y la longitud exacta del Column Chunk de device_type.'
        },
        {
          id: 'b',
          text: 'Descomprime las 12 columnas completas del archivo en memoria RAM, pero descarta 11 columnas antes de ejecutar el operador GROUP BY.',
          correct: false,
          feedback: 'Incorrecto. En un formato columnar nunca se leen ni descomprimen del disco los Column Chunks no proyectados.'
        },
        {
          id: 'c',
          text: 'Utiliza el filtro de Bloom del archivo para adivinar el conteo de cada dispositivo sin leer ningún Column Chunk.',
          correct: false,
          feedback: 'Incorrecto. Un filtro de Bloom solo responde pruebas de pertenencia puntual, no almacena conteos de filas.'
        },
        {
          id: 'd',
          text: 'Recorre secuencialmente cada fila desde el byte 0 y salta los caracteres buscando el delimitador de coma.',
          correct: false,
          feedback: 'Incorrecto. Ese es el comportamiento de un lector de archivos CSV orientados a filas.'
        }
      ],
      explanation: 'El pie del archivo (FileMetaData) contiene el desplazamiento inicial y la longitud exacta de cada Column Chunk. El lector busca en disco solo la columna device_type (2 429 bytes comprimidos) e ignora las otras 11 columnas.'
    },
    {
      id: 'chk-parquet-zonemap-limit',
      type: 'mcq',
      prompt: 'Comparamos dos archivos Parquet de `events` con 7 Row Groups de 10 000 filas cada uno: el primero escrito en orden aleatorio por hash y el segundo ordenado por `event_ts`. ¿Qué ocurre en los zone maps al filtrar los eventos de octubre de 2025?',
      options: [
        {
          id: 'a',
          text: 'En el archivo desordenado los 7 Row Groups abarcan todo el rango de fechas y se leen los 7; en el archivo ordenado los zone maps descartan 6 Row Groups y solo se lee 1 bloque candidato.',
          correct: true,
          feedback: 'Exacto. Al ordenar por event_ts, los intervalos [min, max] dejan de solaparse y se omiten 6 de los 7 bloques.'
        },
        {
          id: 'b',
          text: 'Ambos archivos saltan 6 de los 7 bloques porque Parquet mantiene un árbol B+ global en el encabezado del archivo.',
          correct: false,
          feedback: 'Incorrecto. Parquet no tiene árboles B+ secundarios; depende de los intervalos [min, max] de cada bloque.'
        },
        {
          id: 'c',
          text: 'El archivo ordenado falla porque Parquet prohíbe calcular estadísticas min y max sobre columnas de tipo TIMESTAMP.',
          correct: false,
          feedback: 'Incorrecto. Parquet almacena estadísticas min y max nativas para enteros, fechas, marcas de tiempo y cadenas.'
        },
        {
          id: 'd',
          text: 'El motor reordena en disco el archivo desordenado automáticamente durante la ejecución del SELECT.',
          correct: false,
          feedback: 'Incorrecto. Una consulta SELECT es de solo lectura y nunca reescribe el archivo físico en disco.'
        }
      ],
      explanation: 'Un zone map solo guarda el mínimo y el máximo de cada bloque. Si las fechas están mezcladas al azar, los 7 bloques cubren octubre de 2025. Al ordenar por event_ts, los rangos son disjuntos y el motor salta 6 de los 7 bloques.'
    },
    {
      id: 'chk-parquet-bloom-filter',
      type: 'mcq',
      prompt: '¿En qué escenario aporta mayor beneficio habilitar un filtro de Bloom (`Split Block Bloom Filter`) al escribir un archivo Parquet?',
      options: [
        {
          id: 'a',
          text: 'Consultas de igualdad puntual (`WHERE session_id = \'sess-48210\'`) sobre columnas de alta cardinalidad cuyos valores no están ordenados físicamente.',
          correct: true,
          feedback: 'Correcto. El hash xxHash64 descarta al instante los bloques donde ese session_id puntual no está presente.'
        },
        {
          id: 'b',
          text: 'Consultas por rango abierto (`WHERE total_usd BETWEEN 50 AND 200`) sobre columnas numéricas ya ordenadas.',
          correct: false,
          feedback: 'Incorrecto. Los hashes destruyen el orden numérico y no sirven para evaluar desigualdades o rangos.'
        },
        {
          id: 'c',
          text: 'Consultas sobre columnas de muy baja cardinalidad como `status` (4 valores) o `device_type` (3 valores).',
          correct: false,
          feedback: 'Incorrecto. Con solo 3 o 4 valores posibles, todos los valores aparecen en cada Row Group.'
        },
        {
          id: 'd',
          text: 'Consultas que seleccionan todas las filas sin cláusula WHERE (`SELECT * FROM events`).',
          correct: false,
          feedback: 'Incorrecto. Sin un predicado de filtrado no hay ningún valor que buscar en el filtro de Bloom.'
        }
      ],
      explanation: 'Los filtros de Bloom evalúan pertenencia puntual mediante hashes xxHash64 sobre bloques de 256 bits. Brillan en columnas con miles de valores distintos dispersos (como las 33 267 sesiones de events) donde el intervalo [min, max] no descarta bloques.'
    }
  ],

  roleNotes: {
    de: 'Como persona de Ingeniería de Datos, dimensiona los Row Groups entre 128 MB y 512 MB en tablas grandes, ordena físicamente por las columnas de filtro más frecuentes antes de escribir Parquet y habilita filtros de Bloom únicamente en identificadores de alta cardinalidad consultados por igualdad.',
    da: 'En Análisis de Datos, sustituye siempre SELECT * por la lista exacta de columnas necesarias y escribe filtros SARGable directos (order_date >= DATE \'2025-01-01\') sin envolver la columna en funciones de cadena, permitiendo que el lector omita más del 80 % de los bytes en disco.',
    bi: 'En Business Intelligence, al conectar tableros sobre archivos Parquet o tablas Lakehouse, evita campos calculados que transformen fechas a texto antes de filtrar, ya que impiden que el motor compare directamente la constante contra los zone maps del pie del archivo.'
  },

  summary: [
    'Parquet divide la tabla en Row Groups horizontales y Column Chunks verticales, guardando tipos y desplazamientos en el Footer.',
    'La poda de columnas lee solo los Column Chunks proyectados, ahorrando el 99.31 % de bytes al consultar categorías en events.parquet.',
    'Los zone maps guardan mínimo y máximo por bloque, permitiendo saltar 6 de 7 Row Groups cuando la tabla está ordenada.',
    'Los filtros de Bloom de 256 bits con xxHash64 descartan bloques en búsquedas puntuales de alta cardinalidad con cero falsos negativos.'
  ],

  flashcards: [
    {
      id: 'fc-de2-01-a',
      front: '¿Por qué un lector Parquet abre siempre los últimos bytes del archivo (el Footer) antes de leer los datos?',
      back: 'Porque el Footer contiene el FileMetaData con el esquema, los desplazamientos en bytes de cada Column Chunk y las estadísticas min/max (zone maps).'
    },
    {
      id: 'fc-de2-01-b',
      front: '¿Qué diferencia operativa hay entre un zone map y un Split Block Bloom Filter en Parquet?',
      back: 'El zone map guarda el rango [min, max] y sirve para columnas ordenadas o rangos; el filtro de Bloom usa hashes xxHash64 para igualdades en alta cardinalidad no ordenada.'
    },
    {
      id: 'fc-de2-01-c',
      front: '¿Por qué un filtro como `WHERE strftime(order_date, \'%Y-%m\') = \'2025-10\'` impide podar Row Groups?',
      back: 'Porque transforma cada fila antes de comparar (no es SARGable); escribir `order_date >= DATE \'2025-10-01\' AND order_date < DATE \'2025-11-01\'` sí aprovecha los zone maps.'
    }
  ],

  sources: [
    {
      title: 'Apache Parquet — File Format Specification',
      url: 'https://parquet.apache.org/docs/file-format/',
      publisher: 'Apache Software Foundation',
      accessed: '2026-10-29',
      supports: 'Jerarquía física de Row Groups, Column Chunks, Data Pages y estructura de FileMetaData en el pie del archivo.'
    },
    {
      title: 'Apache Parquet — Page Index (ColumnIndex & OffsetIndex)',
      url: 'https://parquet.apache.org/docs/file-format/pageindex/',
      publisher: 'Apache Software Foundation',
      accessed: '2026-10-29',
      supports: 'Estadísticas min, max y conteo de nulos a nivel de página para omitir lecturas dentro de un mismo Row Group.'
    },
    {
      title: 'Apache Parquet — Split Block Bloom Filter Specification',
      url: 'https://parquet.apache.org/docs/file-format/bloomfilter/',
      publisher: 'Apache Software Foundation',
      accessed: '2026-10-29',
      supports: 'Diseño de filtros de Bloom por bloques de 256 bits alineados a SIMD con función hash xxHash64.'
    },
    {
      title: 'DuckDB Documentation — Reading and Writing Parquet Metadata',
      url: 'https://duckdb.org/docs/stable/data/parquet/metadata.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Inspección de metadatos físicos mediante parquet_metadata(), parquet_schema() y parquet_bloom_probe().'
    }
  ],

  aiNotes: 'Relaciona el diseño de Parquet con las cifras de Mercado Brisa: en `events.parquet` (65 000 filas, 12 columnas, 1 089 111 bytes comprimidos), `event_ts_raw` (468 754 bytes) y `event_ts` (423 601 bytes) concentran el 81.93 % del archivo. Contrasta siempre zone maps (rangos sobre columnas ordenadas) frente a filtros de Bloom (igualdades en alta cardinalidad como `session_id`).',

  relatedLessons: [
    'de2-formatos-02-arrow-lance-vortex',
    'de2-formatos-04-codificacion-compresion-zstd',
    'de2-formatos-05-particionado-archivos-pequenos'
  ]
};

export default lesson;
