const lesson = {
  id: 'de2-formatos-04-codificacion-compresion-zstd',
  moduleId: 'de2-formatos',
  tracks: ['de'],
  level: 2,
  order: 4,
  title: 'Codificación diccionario, RLE, delta y compresión Zstandard',
  subtitle: 'Codificación por diccionario, RLE, empaquetado delta y compresión Zstandard',
  minutes: 25,
  prerequisites: [
    'de2-formatos-01-columnar-parquet',
    'de2-formatos-02-arrow-lance-vortex'
  ],
  glossaryTerms: [
    'codificacion-diccionario-rle',
    'empaquetado-delta-zstd',
    'parquet-row-group',
    'parquet-page-index'
  ],
  contentVersion: 1,

  hook: 'En `orders.parquet` de Mercado Brisa (18 000 filas), las columnas `campaign_id`, `store_id` y `status` se reducen a tan solo `142 bytes`, `268 bytes` y `130 bytes` en disco, alcanzando razones de compresión de **38.96x**, `34.52x` y `32.48x`. En cambio, `total_usd` y `order_id` se guardan con codificación `PLAIN` y solo comprimen a `2.45x` y **1.66x**. ¿Qué ocurre dentro de una página de Parquet entre la codificación lógica por diccionario o delta y la compresión de bloques con Zstandard?',

  objectives: [
    'Distinguir entre la etapa de codificación lógica de datos (encoding: diccionario, RLE, bit-packing, delta) y la compresión general de bloques de bytes (codec: Zstandard, Snappy, GZIP).',
    'Diagnosticar con parquet_metadata() cuándo una columna aprovecha PLAIN_DICTIONARY / RLE_DICTIONARY y cuándo cae a codificación PLAIN por exceso de cardinalidad.',
    'Seleccionar esquemas de tipos, empaquetado delta y niveles de Zstandard para reducir la huella en disco y el tráfico de entrada/salida.'
  ],

  sections: [
    {
      id: 'codificacion-diccionario-rle-bitpacking',
      heading: 'Codificación por diccionario y RLE híbrido en baja cardinalidad',
      body: 'En los formatos columnares modernos la reducción de espacio ocurre en **dos etapas sucesivas**. Primero actúa la **codificación lógica** (*encoding*), que aprovecha la estructura matemática y la repetición del tipo de dato. Después interviene la compresión de bloque (*codec*), que compacta los bytes resultantes.\n\nLa codificación por defecto en Parquet para textos y categorías es el diccionario combinado con **Run-Length Encoding y Bit-Packing** (`PLAIN_DICTIONARY` en v1 y `RLE_DICTIONARY` en v2).\n\n1. El escritor construye una página de diccionario (*Dictionary Page*) por cada *Column Chunk*. Asigna un entero secuencial (`0, 1, 2...`) a cada valor único. En `orders`, `device_type` solo tiene 3 valores únicos (`desktop`, `mobile`, `pos_tienda`), por lo que cada cadena se reemplaza por un índice de **2 bits**.\n2. Luego aplica un codificador híbrido **RLE + Bit-Packing**. Si el mismo índice se repite en una racha contigua, guarda el par `(longitud, id)`. Si los índices alternan, los empaqueta usando el ancho mínimo de bits necesario.\n\nSi una columna supera el límite del diccionario o tiene valores casi únicos, Parquet desactiva el diccionario y cae a codificación **`PLAIN`**.',
      example: {
        language: 'sql',
        code: `SELECT
  path_in_schema AS column_name,
  type AS physical_type,
  encodings,
  total_uncompressed_size AS uncompressed_bytes,
  total_compressed_size AS compressed_bytes,
  ROUND(total_uncompressed_size * 1.0 / total_compressed_size, 2) AS compression_ratio
FROM parquet_metadata('orders.parquet')
WHERE path_in_schema IN ('store_id', 'status', 'device_type', 'campaign_id', 'order_id', 'total_usd')
ORDER BY compression_ratio DESC;`,
        expectedOutput: [
          { column_name: 'campaign_id', physical_type: 'BYTE_ARRAY', encodings: 'PLAIN_DICTIONARY', uncompressed_bytes: 5533, compressed_bytes: 142, compression_ratio: 38.96 },
          { column_name: 'store_id', physical_type: 'INT32', encodings: 'PLAIN_DICTIONARY', uncompressed_bytes: 9252, compressed_bytes: 268, compression_ratio: 34.52 },
          { column_name: 'status', physical_type: 'BYTE_ARRAY', encodings: 'PLAIN_DICTIONARY', uncompressed_bytes: 4223, compressed_bytes: 130, compression_ratio: 32.48 },
          { column_name: 'device_type', physical_type: 'BYTE_ARRAY', encodings: 'PLAIN_DICTIONARY', uncompressed_bytes: 4693, compressed_bytes: 220, compression_ratio: 21.33 },
          { column_name: 'total_usd', physical_type: 'DOUBLE', encodings: 'PLAIN', uncompressed_bytes: 144023, compressed_bytes: 58809, compression_ratio: 2.45 },
          { column_name: 'order_id', physical_type: 'INT32', encodings: 'PLAIN', uncompressed_bytes: 72023, compressed_bytes: 43306, compression_ratio: 1.66 }
        ],
        explanation: 'Las cuatro columnas categóricas usan diccionario y superan 21x de compresión, mientras que total_usd y order_id usan codificación PLAIN.'
      },
      interactive: {
        component: 'row-vs-columnar-storage',
        props: {
          mode: 'encoding-zstd',
          table: 'orders.parquet'
        },
        caption: 'Observa cómo valores repetidos del mismo tipo se transforman primero en índices de diccionario y rachas RLE antes de pasar al compresor Zstandard.'
      }
    },
    {
      id: 'empaquetado-delta-enteros-timestamps',
      heading: 'Empaquetado binario delta (DELTA_BINARY_PACKED) y tipos nativos',
      body: 'Para identificadores secuenciales (`order_id`) o marcas temporales (`event_ts`, `order_ts`), un diccionario no es útil porque casi cada fila tiene un valor distinto. Aquí interviene la codificación **`DELTA_BINARY_PACKED`** de Parquet v2.\n\nEn lugar de almacenar enteros completos de 64 bits (`8 bytes` cada uno), el codificador resta cada valor del anterior ($\\Delta_i = x_i - x_{i-1}$). Cuando las filas están ordenadas por fecha o identificador, las diferencias entre filas vecinas son números pequeños que caben en pocos bits.\n\nEste mecanismo explica por qué guardar marcas temporales como texto ISO-8601 (`event_ts_raw` en `events.parquet`) resulta tan costoso en disco.\n\n- Como cadena `BYTE_ARRAY` con husos horarios mezclados (`PLAIN`), `event_ts_raw` ocupa **1 820 024 bytes descomprimidos** y **468 754 bytes comprimidos** (`43.04 %` de todo `events.parquet`).\n- En cambio, una columna de baja cardinalidad con diccionario como `event_type` ocupa apenas **2 398 bytes comprimidos** para las mismas 65 000 filas.',
      example: {
        language: 'sql',
        code: `SELECT
  path_in_schema AS columna,
  type AS tipo_fisico,
  encodings,
  total_uncompressed_size AS bytes_raw,
  total_compressed_size AS bytes_comp,
  ROUND(total_uncompressed_size * 1.0 / total_compressed_size, 2) AS ratio_compresion
FROM parquet_metadata('events.parquet')
WHERE path_in_schema IN ('event_ts_raw', 'event_ts', 'session_id', 'product_id', 'device_type', 'event_type')
ORDER BY bytes_comp DESC;`,
        expectedOutput: [
          { columna: 'event_ts_raw', tipo_fisico: 'BYTE_ARRAY', encodings: 'PLAIN', bytes_raw: 1820024, bytes_comp: 468754, ratio_compresion: 3.88 },
          { columna: 'event_ts', tipo_fisico: 'INT64', encodings: 'PLAIN', bytes_raw: 520023, bytes_comp: 423601, ratio_compresion: 1.23 },
          { columna: 'session_id', tipo_fisico: 'BYTE_ARRAY', encodings: 'PLAIN', bytes_raw: 1122876, bytes_comp: 32841, ratio_compresion: 34.19 },
          { columna: 'product_id', tipo_fisico: 'INT32', encodings: 'PLAIN_DICTIONARY', bytes_raw: 62921, bytes_comp: 10481, ratio_compresion: 6.0 },
          { columna: 'device_type', tipo_fisico: 'BYTE_ARRAY', encodings: 'PLAIN_DICTIONARY', bytes_raw: 16601, bytes_comp: 2429, ratio_compresion: 6.83 },
          { columna: 'event_type', tipo_fisico: 'BYTE_ARRAY', encodings: 'PLAIN_DICTIONARY', bytes_raw: 24768, bytes_comp: 2398, ratio_compresion: 10.33 }
        ],
        explanation: 'Al no estar ordenadas cronológicamente, event_ts_raw y event_ts se almacenan en PLAIN y consumen 892 355 bytes comprimidos entre ambas.'
      }
    },
    {
      id: 'compresion-bloques-zstandard-rfc8878',
      heading: 'Compresión de páginas con Zstandard (RFC 8878) frente a Snappy y GZIP',
      body: 'Una vez que la página de datos ha sido codificada con diccionario, RLE o deltas, Parquet aplica un algoritmo de compresión de bloques (`compression`). Durante años el valor por defecto en motores antiguos fue **Snappy** (rápido, pero con menor compresión) o **GZIP** (buena compresión, pero lento en CPU).\n\nEl estándar moderno en ingeniería de datos es **Zstandard (`ZSTD`, IETF RFC 8878)**, diseñado por Yann Collet. Zstandard combina dos mecanismos.\n\n- Búsqueda de secuencias repetidas mediante ventana deslizante **LZ77**.\n- Codificación de entropía mediante **ANS** (*Asymmetric Numeral Systems* / *Finite State Entropy*) combinada con árboles de Huffman.\n\nEn cargas analíticas sobre Parquet, `ZSTD` en sus niveles por defecto (`1` a `3`) produce archivos **entre un 20 % y un 35 % más pequeños que Snappy**. Además mantiene velocidades de descompresión de varios gigabytes por segundo por núcleo. Tanto DuckDB (`COMPRESSION ZSTD`) como Polars (`write_parquet(..., compression="zstd")`) emplean `ZSTD` para tablas analíticas en reposo.',
      example: {
        language: 'sql',
        code: `SELECT
  'events.parquet' AS archivo,
  COUNT(*) AS columnas,
  MAX(compression) AS codec_bloque,
  SUM(total_uncompressed_size) AS bytes_paginas_raw,
  SUM(total_compressed_size) AS bytes_paginas_zstd,
  ROUND(SUM(total_uncompressed_size) * 1.0 / SUM(total_compressed_size), 2) AS ratio_global_zstd
FROM parquet_metadata('events.parquet')
UNION ALL
SELECT
  'orders.parquet' AS archivo,
  COUNT(*) AS columnas,
  MAX(compression) AS codec_bloque,
  SUM(total_uncompressed_size) AS bytes_paginas_raw,
  SUM(total_compressed_size) AS bytes_paginas_zstd,
  ROUND(SUM(total_uncompressed_size) * 1.0 / SUM(total_compressed_size), 2) AS ratio_global_zstd
FROM parquet_metadata('orders.parquet');`,
        expectedOutput: [
          { archivo: 'events.parquet', columnas: 12, codec_bloque: 'ZSTD', bytes_paginas_raw: 4933709, bytes_paginas_zstd: 1089111, ratio_global_zstd: 4.53 },
          { archivo: 'orders.parquet', columnas: 14, codec_bloque: 'ZSTD', bytes_paginas_raw: 783766, bytes_paginas_zstd: 380895, ratio_global_zstd: 2.06 }
        ],
        explanation: 'Ambos archivos emplean ZSTD en todas sus páginas, reduciendo events.parquet de 4.93 MB a 1.09 MB (4.53x) y orders.parquet de 784 KB a 381 KB (2.06x).'
      }
    }
  ],

  workedExample: {
    title: 'Diagnóstico de cardinalidad, rachas RLE y compresión en orders.parquet',
    description: 'Vamos a auditar los metadatos físicos de `orders.parquet` junto con la distribución real de sus filas por `(status, device_type)` para entender cómo la cardinalidad determina el tamaño comprimido de cada columna.',
    steps: [
      {
        label: 'Paso 1 — Inspeccionar codificaciones y razones de compresión en orders.parquet',
        code: `SELECT
  path_in_schema AS column_name,
  type AS physical_type,
  encodings,
  total_uncompressed_size AS uncompressed_bytes,
  total_compressed_size AS compressed_bytes,
  ROUND(total_uncompressed_size * 1.0 / total_compressed_size, 2) AS compression_ratio
FROM parquet_metadata('orders.parquet')
WHERE path_in_schema IN ('store_id', 'status', 'device_type', 'campaign_id', 'order_id', 'total_usd')
ORDER BY compression_ratio DESC;`,
        expectedOutput: [
          { column_name: 'campaign_id', physical_type: 'BYTE_ARRAY', encodings: 'PLAIN_DICTIONARY', uncompressed_bytes: 5533, compressed_bytes: 142, compression_ratio: 38.96 },
          { column_name: 'store_id', physical_type: 'INT32', encodings: 'PLAIN_DICTIONARY', uncompressed_bytes: 9252, compressed_bytes: 268, compression_ratio: 34.52 },
          { column_name: 'status', physical_type: 'BYTE_ARRAY', encodings: 'PLAIN_DICTIONARY', uncompressed_bytes: 4223, compressed_bytes: 130, compression_ratio: 32.48 },
          { column_name: 'device_type', physical_type: 'BYTE_ARRAY', encodings: 'PLAIN_DICTIONARY', uncompressed_bytes: 4693, compressed_bytes: 220, compression_ratio: 21.33 },
          { column_name: 'total_usd', physical_type: 'DOUBLE', encodings: 'PLAIN', uncompressed_bytes: 144023, compressed_bytes: 58809, compression_ratio: 2.45 },
          { column_name: 'order_id', physical_type: 'INT32', encodings: 'PLAIN', uncompressed_bytes: 72023, compressed_bytes: 43306, compression_ratio: 1.66 }
        ],
        explanation: 'Las columnas codificadas con diccionario ocupan menos de 270 bytes cada una para 18 000 filas, mientras que total_usd requiere 58 809 bytes.'
      },
      {
        label: 'Paso 2 — Medir el potencial de rachas RLE al agrupar por status y device_type en orders',
        code: `SELECT
  status,
  device_type,
  COUNT(*) AS row_count,
  COUNT(DISTINCT store_id) AS distinct_stores,
  COUNT(DISTINCT customer_id) AS distinct_customers,
  ROUND(COUNT(*) * 1.0 / COUNT(DISTINCT store_id), 1) AS avg_rows_per_store
FROM orders
GROUP BY status, device_type
ORDER BY row_count DESC
LIMIT 6;`,
        expectedOutput: [
          { status: 'completed', device_type: 'desktop', row_count: 6327, distinct_stores: 11, distinct_customers: 1284, avg_rows_per_store: 575.2 },
          { status: 'completed', device_type: 'mobile', row_count: 5624, distinct_stores: 11, distinct_customers: 1312, avg_rows_per_store: 511.3 },
          { status: 'completed', device_type: 'pos_tienda', row_count: 2809, distinct_stores: 8, distinct_customers: 656, avg_rows_per_store: 351.1 },
          { status: 'refunded', device_type: 'desktop', row_count: 617, distinct_stores: 11, distinct_customers: 144, avg_rows_per_store: 56.1 },
          { status: 'refunded', device_type: 'mobile', row_count: 547, distinct_stores: 11, distinct_customers: 128, avg_rows_per_store: 49.7 },
          { status: 'cancelled', device_type: 'desktop', row_count: 462, distinct_stores: 11, distinct_customers: 108, avg_rows_per_store: 42.0 }
        ],
        explanation: 'Si ordenamos orders por (status, device_type, store_id), las 6 327 filas de completed + desktop forman una sola racha continua en RLE y cada tienda promedia 575.2 filas consecutivas.'
      },
      {
        label: 'Paso 3 — Comparar el peso total de columnas PLAIN_DICTIONARY frente a PLAIN en orders.parquet',
        code: `SELECT
  encodings,
  COUNT(*) AS num_columnas,
  SUM(total_uncompressed_size) AS bytes_raw,
  SUM(total_compressed_size) AS bytes_comp,
  ROUND(SUM(total_uncompressed_size) * 1.0 / SUM(total_compressed_size), 2) AS ratio_grupo
FROM parquet_metadata('orders.parquet')
GROUP BY encodings
ORDER BY bytes_comp DESC;`,
        expectedOutput: [
          { encodings: 'PLAIN', num_columnas: 5, bytes_raw: 648115, bytes_comp: 325321, ratio_grupo: 1.99 },
          { encodings: 'PLAIN_DICTIONARY', num_columnas: 9, bytes_raw: 135651, bytes_comp: 55574, ratio_grupo: 2.44 }
        ],
        explanation: 'Las 9 columnas codificadas por diccionario suman apenas 55 574 bytes comprimidos en total (el 14.59 % del archivo), mientras que las 5 columnas PLAIN concentran el 85.41 %.'
      }
    ]
  },

  practice: {
    type: 'sql',
    title: 'Auditoría de codificación y razón de compresión en orders.parquet',
    prompt: 'Consulta `parquet_metadata(\'orders.parquet\')` filtrando las 6 columnas `path_in_schema IN (\'store_id\', \'status\', \'device_type\', \'campaign_id\', \'order_id\', \'total_usd\')`. Devuelve: `column_name` (`path_in_schema`), `physical_type` (`type`), `encodings`, `uncompressed_bytes` (`total_uncompressed_size`), `compressed_bytes` (`total_compressed_size`) y `compression_ratio` (`ROUND(total_uncompressed_size * 1.0 / total_compressed_size, 2)`), ordenado por `compression_ratio` de mayor a menor.',
    starterCode: `SELECT
  path_in_schema AS column_name,
  type AS physical_type,
  encodings,
  -- Completa uncompressed_bytes, compressed_bytes y compression_ratio redondeado a 2 decimales
FROM parquet_metadata('orders.parquet')
WHERE path_in_schema IN ('store_id', 'status', 'device_type', 'campaign_id', 'order_id', 'total_usd')
ORDER BY compression_ratio DESC;`,
    solution: `SELECT
  path_in_schema AS column_name,
  type AS physical_type,
  encodings,
  total_uncompressed_size AS uncompressed_bytes,
  total_compressed_size AS compressed_bytes,
  ROUND(total_uncompressed_size * 1.0 / total_compressed_size, 2) AS compression_ratio
FROM parquet_metadata('orders.parquet')
WHERE path_in_schema IN ('store_id', 'status', 'device_type', 'campaign_id', 'order_id', 'total_usd')
ORDER BY compression_ratio DESC;`,
    expectedOutputTable: [
      { column_name: 'campaign_id', physical_type: 'BYTE_ARRAY', encodings: 'PLAIN_DICTIONARY', uncompressed_bytes: 5533, compressed_bytes: 142, compression_ratio: 38.96 },
      { column_name: 'store_id', physical_type: 'INT32', encodings: 'PLAIN_DICTIONARY', uncompressed_bytes: 9252, compressed_bytes: 268, compression_ratio: 34.52 },
      { column_name: 'status', physical_type: 'BYTE_ARRAY', encodings: 'PLAIN_DICTIONARY', uncompressed_bytes: 4223, compressed_bytes: 130, compression_ratio: 32.48 },
      { column_name: 'device_type', physical_type: 'BYTE_ARRAY', encodings: 'PLAIN_DICTIONARY', uncompressed_bytes: 4693, compressed_bytes: 220, compression_ratio: 21.33 },
      { column_name: 'total_usd', physical_type: 'DOUBLE', encodings: 'PLAIN', uncompressed_bytes: 144023, compressed_bytes: 58809, compression_ratio: 2.45 },
      { column_name: 'order_id', physical_type: 'INT32', encodings: 'PLAIN', uncompressed_bytes: 72023, compressed_bytes: 43306, compression_ratio: 1.66 }
    ],
    orderMatters: true,
    hints: [
      'Usa total_uncompressed_size AS uncompressed_bytes y total_compressed_size AS compressed_bytes.',
      'Para compression_ratio calcula ROUND(total_uncompressed_size * 1.0 / total_compressed_size, 2).',
      'Mantén el filtro WHERE path_in_schema IN (\'store_id\', \'status\', \'device_type\', \'campaign_id\', \'order_id\', \'total_usd\') y ORDER BY compression_ratio DESC.'
    ],
    solutionExplanation: 'La consulta contrasta el efecto de PLAIN_DICTIONARY + ZSTD en columnas de baja cardinalidad (21x a 38x de compresión) frente a las columnas numéricas continuas o de alta cardinalidad almacenadas en PLAIN (1.66x a 2.45x).'
  },

  checks: [
    {
      id: 'chk-encoding-vs-compression',
      type: 'mcq',
      prompt: '¿Cuál es la relación exacta entre la codificación de páginas (`RLE_DICTIONARY`, `DELTA_BINARY_PACKED`) y el algoritmo de compresión (`ZSTD`, `SNAPPY`) al escribir un archivo Parquet?',
      options: [
        {
          id: 'a',
          text: 'Son dos etapas en serie: primero la codificación transforma los valores tipados en enteros compactos, rachas RLE o diferencias delta, y luego ZSTD comprime el bloque de bytes resultante.',
          correct: true,
          feedback: 'Correcto. Primero actúa la codificación consciente del tipo de dato y después el compresor de bloques ZSTD.'
        },
        {
          id: 'b',
          text: 'Son mutuamente excluyentes: si activas ZSTD, Parquet desactiva por completo los diccionarios y el empaquetado de bits.',
          correct: false,
          feedback: 'Incorrecto. Ambos mecanismos son complementarios y se usan juntos en todas las páginas.'
        },
        {
          id: 'c',
          text: 'Se aplican en orden inverso: primero ZSTD comprime el archivo entero y después RLE_DICTIONARY busca cadenas repetidas dentro del flujo binario.',
          correct: false,
          feedback: 'Incorrecto. Si comprimes primero con ZSTD, produces bytes de alta entropía donde RLE no encontraría rachas.'
        },
        {
          id: 'd',
          text: 'La codificación solo se aplica en el Footer del archivo y la compresión solo se aplica en los filtros de Bloom.',
          correct: false,
          feedback: 'Incorrecto. Tanto la codificación como la compresión se aplican a las Data Pages de cada Column Chunk.'
        }
      ],
      explanation: 'Parquet aplica primero una codificación consciente del tipo de dato (como diccionario + RLE o DELTA_BINARY_PACKED) para eliminar redundancia estructural y acto seguido pasa esa página codificada al compresor de bloques (ZSTD).'
    },
    {
      id: 'chk-dictionary-fallback-plain',
      type: 'mcq',
      prompt: 'Al escribir una columna con decenas de miles de valores distintos sin repetición (como `event_ts_raw` en `events.parquet`), ¿por qué Parquet usa codificación `PLAIN` en lugar de diccionario?',
      options: [
        {
          id: 'a',
          text: 'Porque la página de diccionario supera el límite máximo de bytes o entradas únicas configurado, momento en el que mantener el diccionario costaría más espacio que escribir los valores directamente.',
          correct: true,
          feedback: 'Exacto. Cuando los valores no se repiten, el diccionario se desborda y el escritor cae a PLAIN.'
        },
        {
          id: 'b',
          text: 'Porque los diccionarios de Parquet solo admiten cadenas compuestas por caracteres ASCII de 7 bits.',
          correct: false,
          feedback: 'Incorrecto. Los diccionarios de Parquet admiten cualquier secuencia UTF-8 o tipo numérico.'
        },
        {
          id: 'c',
          text: 'Porque el compresor Zstandard prohíbe comprimir páginas que provengan de un diccionario.',
          correct: false,
          feedback: 'Incorrecto. Zstandard comprime tanto las Dictionary Pages como las páginas de índices RLE.'
        },
        {
          id: 'd',
          text: 'Porque Parquet solo permite usar diccionarios en la primera columna de cada tabla.',
          correct: false,
          feedback: 'Incorrecto. Cada Column Chunk gestiona su propio diccionario de manera independiente.'
        }
      ],
      explanation: 'Si casi cada fila tiene un valor distinto, el diccionario crece hasta alcanzar DICTIONARY_SIZE_LIMIT sin ahorrar espacio en las páginas de índices. Al detectar esto, el escritor emite las páginas en codificación PLAIN comprimida con ZSTD.'
    },
    {
      id: 'chk-delta-packing-timestamps',
      type: 'mcq',
      prompt: 'En `events.parquet`, `event_ts_raw` se guardó como texto ISO (`"2025-03-03T22:06:33-03:00"`) y ocupa 468 754 bytes comprimidos. ¿Qué cambio de ingeniería reduce más su tamaño físico al reescribir la tabla?',
      options: [
        {
          id: 'a',
          text: 'Normalizar la columna a un tipo temporal entero de 64 bits en UTC y ordenar las filas cronológicamente para que el empaquetado de deltas almacene diferencias pequeñas entre eventos.',
          correct: true,
          feedback: 'Correcto. Un entero de 64 bits ordenado aprovecha DELTA_BINARY_PACKED y reduce drásticamente el peso.'
        },
        {
          id: 'b',
          text: 'Reemplazar los guiones de la cadena ISO por barras diagonales manteniendo el tipo VARCHAR.',
          correct: false,
          feedback: 'Incorrecto. Cambiar un carácter por otro no altera la entropía ni la longitud de la cadena.'
        },
        {
          id: 'c',
          text: 'Desactivar la compresión Zstandard y guardar el archivo con UNCOMPRESSED.',
          correct: false,
          feedback: 'Incorrecto. Sin Zstandard la columna crecería hasta sus 1 820 024 bytes sin comprimir.'
        },
        {
          id: 'd',
          text: 'Convertir cada marca temporal en un objeto JSON con tres atributos separados para fecha, hora y huso horario.',
          correct: false,
          feedback: 'Incorrecto. Envolver en llaves JSON añade sintaxis repetitiva y empeora el tamaño descomprimido.'
        }
      ],
      explanation: 'Un TIMESTAMP se almacena físicamente como un entero INT64 de microsegundos desde la época Unix (8 bytes en bruto frente a 25 bytes de texto). Al ordenar las filas en Parquet v2, las diferencias consecutivas son enteros pequeños ideales para DELTA_BINARY_PACKED.'
    }
  ],

  roleNotes: {
    de: 'Como persona de Ingeniería de Datos, nunca almacenes fechas, números o booleanos como cadenas de texto en Parquet: tipa siempre como TIMESTAMP/TIMESTAMPTZ, INT32/INT64 o DECIMAL y exporta con PARQUET_VERSION V2 y COMPRESSION ZSTD.',
    da: 'En Análisis de Datos, al exportar resultados intermedios desde DuckDB o Polars hacia Parquet, prefiere enumeraciones o categorías limpias sin espacios residuales: una sola variación accidental de mayúsculas duplica entradas en la Dictionary Page.',
    bi: 'En Business Intelligence, cuando prepares extractos Parquet para motores analíticos, reemplaza las llaves compuestas concatenadas en texto por sus columnas atómicas separadas: cada columna individual tendrá mucha menor cardinalidad y comprimirá más de 20x con diccionario y ZSTD.'
  },

  summary: [
    'Parquet reduce el tamaño en dos pasos: primero aplica codificación lógica (diccionario, RLE o delta) y luego compresión Zstandard.',
    'La codificación por diccionario y RLE logra razones superiores a 20x en columnas de baja cardinalidad en orders.parquet.',
    'DELTA_BINARY_PACKED almacena la diferencia entre enteros o marcas temporales sucesivas con ancho de bits mínimo.',
    'Zstandard (RFC 8878) combina LZ77 con codificación ANS y Huffman, superando a Snappy en compresión y a GZIP en velocidad.'
  ],

  flashcards: [
    {
      id: 'fc-de2-04-a',
      front: '¿En qué orden se aplican RLE_DICTIONARY y Zstandard al escribir una página de datos en Parquet?',
      back: 'Primero RLE_DICTIONARY reemplaza valores repetidos por índices enteros y agrupa rachas; después Zstandard comprime los bytes de esa página codificada.'
    },
    {
      id: 'fc-de2-04-b',
      front: '¿Para qué tipo de columnas está diseñada la codificación DELTA_BINARY_PACKED de Parquet v2?',
      back: 'Para columnas de enteros o marcas temporales secuenciales donde la diferencia entre filas consecutivas es pequeña.'
    },
    {
      id: 'fc-de2-04-c',
      front: '¿Por qué `campaign_id` y `status` en `orders.parquet` alcanzan razones de compresión superiores a 32x?',
      back: 'Porque tienen muy baja cardinalidad (4 valores posibles) y se codifican como índices de 2 bits en PLAIN_DICTIONARY antes de comprimirse con ZSTD.'
    }
  ],

  sources: [
    {
      title: 'Apache Parquet — Encodings Specification',
      url: 'https://parquet.apache.org/docs/file-format/data-pages/encodings/',
      publisher: 'Apache Software Foundation',
      accessed: '2026-10-29',
      supports: 'Especificación de PLAIN_DICTIONARY, RLE_DICTIONARY, DELTA_BINARY_PACKED y BYTE_STREAM_SPLIT.'
    },
    {
      title: 'IETF RFC 8878 — Zstandard Compression and the application/zstd Media Type',
      url: 'https://datatracker.ietf.org/doc/html/rfc8878',
      publisher: 'IETF',
      accessed: '2026-10-29',
      supports: 'Diseño del algoritmo Zstandard basado en coincidencia LZ77 y codificación de entropía ANS (FSE) y Huffman.'
    },
    {
      title: 'DuckDB Documentation — Parquet Tips & Compression Options',
      url: 'https://duckdb.org/docs/stable/data/parquet/tips.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Configuración de COMPRESSION ZSTD, PARQUET_VERSION V2 y límites de diccionario al escribir Parquet en DuckDB.'
    }
  ],

  aiNotes: 'Apóyate en las cifras de `orders.parquet` y `events.parquet` de Mercado Brisa: en `orders.parquet`, `campaign_id` alcanza 38.96x (142 bytes), `store_id` 34.52x (268 bytes), `status` 32.48x (130 bytes) y `device_type` 21.33x (220 bytes) gracias a `PLAIN_DICTIONARY` + `ZSTD`, frente a `total_usd` (`PLAIN`, 2.45x).',

  relatedLessons: [
    'de2-formatos-01-columnar-parquet',
    'de2-formatos-02-arrow-lance-vortex',
    'de2-formatos-05-particionado-archivos-pequenos'
  ]
};

export default lesson;
