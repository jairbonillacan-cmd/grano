const lesson = {
  id: 'de2-formatos-02-arrow-lance-vortex',
  legacyId: 'l8-arrow-lance-vortex',
  legacyOrder: 8,
  moduleId: 'de2-formatos',
  tracks: ['de'],
  level: 2,
  order: 2,
  title: 'Memoria columnar con Apache Arrow, Lance y Vortex',
  subtitle: 'Búferes alineados en RAM, intercambio zero-copy y formatos columnares de acceso aleatorio',
  minutes: 30,
  prerequisites: ['de2-formatos-01-columnar-parquet'],
  glossaryTerms: [
    'zero-copy',
    'arrow-c-data-interface',
    'late-materialization',
    'lance-vortex-acceso-aleatorio'
  ],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), cuando un flujo analítico lee `events.parquet` en DuckDB y pasa las 65 000 filas a Polars o PyArrow, convertir cada registro a objetos de Python obligaría a reservar y copiar megabytes de punteros dispersos. Además, `events` contiene 6 715 valores nulos en `customer_id` y 17 750 nulos en `campaign_id`, junto con cadenas de longitud variable en `payload_json`. ¿Cómo representa Apache Arrow esos vectores en memoria RAM para intercambiarlos en microsegundos sin copiar un solo byte, y qué aportan Lance y Vortex frente a Parquet?',

  objectives: [
    'Describir la disposición física en memoria de Apache Arrow (mapa de validez, desplazamientos y valores) y el intercambio zero-copy mediante Arrow C Data Interface.',
    'Aplicar materialización tardía sobre events.parquet separando el filtrado en columnas angostas de la extracción de columnas de texto como payload_json.',
    'Diferenciar el diseño de almacenamiento de Parquet frente a Lance (acceso aleatorio O(1)) y Vortex (ejecución sobre vectores comprimidos).'
  ],

  sections: [
    {
      id: 'arrow-memoria-zero-copy',
      heading: 'Disposición en memoria de Apache Arrow e interfaz C zero-copy',
      body: 'Parquet comprime y almacena datos en disco. En cambio, **Apache Arrow** define el formato estándar para representar tablas en memoria RAM listas para el procesador. En lugar de guardar objetos dispersos en el montículo (*heap*), Arrow organiza las filas en lotes columnares llamados **RecordBatches** con búferes contiguos alineados a 64 bytes.\n\nUna columna de longitud variable (como `device_type`, `campaign_id` o `payload_json` en `events`) utiliza tres búferes contiguos en RAM.\n\n- **Mapa de bits de validez** (*validity bitmap*). Usa 1 bit por fila (`1` = válido, `0` = `NULL`). Para las 65 000 filas de `events`, este mapa ocupa 8 125 bytes (`65 000 / 8`). Así codifica sin ramificaciones los `6 715` nulos de `customer_id` y los `17 750` nulos de `campaign_id`.\n- **Búfer de desplazamientos** (*offsets*). Es un vector de enteros de 32 o 64 bits que marca dónde empieza y termina cada cadena.\n- **Búfer de valores** (*values*). Guarda todos los caracteres UTF-8 concatenados uno tras otro sin punteros intermedios.\n\nGracias a la **Arrow C Data Interface**, DuckDB entrega resultados a Polars sin serializar ni copiar datos. Solo transfiere dos estructuras de C (`ArrowSchema` y `ArrowArray`) con los punteros de memoria en una operación **zero-copy** de microsegundos.',
      example: {
        language: 'sql',
        code: `SELECT
  event_type,
  COUNT(*) AS total_events,
  COUNT(customer_id) AS known_customer_events,
  COUNT(*) - COUNT(customer_id) AS null_customer_bits,
  COUNT(campaign_id) AS attributed_events,
  COUNT(*) - COUNT(campaign_id) AS null_campaign_bits
FROM events
GROUP BY event_type
ORDER BY total_events DESC, event_type ASC;`,
        expectedOutput: [
          { event_type: 'add_to_cart', total_events: 15400, known_customer_events: 14056, null_customer_bits: 1344, attributed_events: 10050, null_campaign_bits: 5350 },
          { event_type: 'checkout_completed', total_events: 15400, known_customer_events: 14057, null_customer_bits: 1343, attributed_events: 13050, null_campaign_bits: 2350 },
          { event_type: 'checkout_started', total_events: 15400, known_customer_events: 14058, null_customer_bits: 1342, attributed_events: 10050, null_campaign_bits: 5350 },
          { event_type: 'page_view', total_events: 9400, known_customer_events: 8056, null_customer_bits: 1344, attributed_events: 7050, null_campaign_bits: 2350 },
          { event_type: 'product_view', total_events: 9400, known_customer_events: 8058, null_customer_bits: 1342, attributed_events: 7050, null_campaign_bits: 2350 }
        ],
        explanation: 'Las funciones de conteo en DuckDB y Arrow evalúan los nulos contando bits encendidos (popcount) directamente sobre el validity bitmap sin inspeccionar el búfer de valores.'
      },
      interactive: {
        component: 'arrow-zero-copy-sim',
        props: {
          rows: 65000,
          table: 'events'
        },
        caption: 'Compara el costo de serializar filas entre motores frente al intercambio de punteros en memoria con Arrow C Data Interface.'
      }
    },
    {
      id: 'materializacion-tardia-parquet',
      heading: 'El cuello de botella del acceso aleatorio y la materialización tardía',
      body: 'En Parquet, los valores dentro de una página de datos se comprimen juntos en bloques opacos. Esto acelera los escaneos secuenciales, pero penaliza el **acceso aleatorio puntual**. Si necesitas leer solo la fila `42 150` de `payload_json`, el lector no conoce el byte exacto de esa fila dentro de la página comprimida. Debe leer y descomprimir todos los valores previos de la página hasta llegar a la posición `42 150`.\n\nPara mitigar este costo en consultas analíticas, los motores columnares aplican **materialización tardía** (*late materialization*).\n\n1. Evalúan primero los predicados `WHERE` sobre las columnas angostas (`event_type` y `device_type`). Esas columnas pesan `2 398` y `2 429 bytes` comprimidos y caben en la caché L1/L2.\n2. Obtienen una lista compacta de identificadores de fila (`row_id`) que cumplen el filtro.\n3. Al final extraen las columnas adicionales solo para las páginas y posiciones que sobrevivieron al filtro.',
      example: {
        language: 'sql',
        code: `SELECT
  device_type,
  COUNT(*) AS checkouts_completados,
  COUNT(customer_id) AS con_cliente_identificado,
  COUNT(campaign_id) AS con_campana_atribuida,
  ROUND(AVG(LENGTH(payload_json)), 2) AS longitud_media_payload_bytes
FROM events
WHERE event_type = 'checkout_completed'
GROUP BY device_type
ORDER BY checkouts_completados DESC;`,
        expectedOutput: [
          { device_type: 'desktop', checkouts_completados: 6348, con_cliente_identificado: 5901, con_campana_atribuida: 5564, longitud_media_payload_bytes: 56.96 },
          { device_type: 'mobile', checkouts_completados: 4848, con_cliente_identificado: 4401, con_campana_atribuida: 4065, longitud_media_payload_bytes: 52.89 },
          { device_type: 'pos_tienda', checkouts_completados: 4204, con_cliente_identificado: 3755, con_campana_atribuida: 3421, longitud_media_payload_bytes: 50.57 }
        ],
        explanation: 'El filtro event_type = checkout_completed reduce las 65 000 filas a 15 400 antes de tocar payload_json para medir su longitud en bytes.'
      }
    },
    {
      id: 'lance-vortex-nueva-generacion',
      heading: 'Lance y Vortex: acceso aleatorio O(1) y vectores comprimidos',
      body: 'Algunas cargas de trabajo combinan analítica con búsquedas por índice, muestreo aleatorio o vectores de alta dimensión (*embeddings*). Allí la descompresión por páginas de Parquet se vuelve un freno. Dos formatos columnares abiertos compatibles con Apache Arrow resuelven esta limitación.\n\n- **Lance**. Elimina los grupos de filas rígidos de Parquet y almacena tablas explícitas de desplazamientos (*offset tables*) por columna. Esto permite calcular en $O(1)$ el byte exacto de cualquier fila y ejecutar lecturas puntuales (`take`) en microsegundos. También conserva materialización tardía nativa para textos largos o vectores.\n- **Vortex** (donado a Linux Foundation por SpiralDB). Aplica codificaciones ligeras en cascada (*FastLanes* con empaquetado SIMD, *ALP* para flotantes sin pérdida y *FSST* para cadenas). A diferencia de Zstandard, que produce un bloque opaco, Vortex evalúa filtros directamente sobre los vectores aún comprimidos.',
      example: {
        language: 'sql',
        code: `SELECT
  path_in_schema AS columna,
  num_values AS filas,
  stats_null_count AS nulos,
  CEIL(num_values / 8.0)::INT AS bytes_validity_bitmap,
  total_compressed_size AS bytes_comp_disco,
  total_uncompressed_size AS bytes_raw_pagina
FROM parquet_metadata('events.parquet')
WHERE path_in_schema IN ('event_id', 'customer_id', 'campaign_id', 'event_ts_raw', 'payload_json')
ORDER BY column_id;`,
        expectedOutput: [
          { columna: 'event_id', filas: 65000, nulos: 0, bytes_validity_bitmap: 8125, bytes_comp_disco: 32348, bytes_raw_pagina: 1080505 },
          { columna: 'customer_id', filas: 65000, nulos: 6715, bytes_validity_bitmap: 8125, bytes_comp_disco: 54355, bytes_raw_pagina: 103627 },
          { columna: 'event_ts_raw', filas: 65000, nulos: 0, bytes_validity_bitmap: 8125, bytes_comp_disco: 468754, bytes_raw_pagina: 1820024 },
          { columna: 'campaign_id', filas: 65000, nulos: 17750, bytes_validity_bitmap: 8125, bytes_comp_disco: 2651, bytes_raw_pagina: 20585 },
          { columna: 'payload_json', filas: 65000, nulos: 0, bytes_validity_bitmap: 8125, bytes_comp_disco: 2401, bytes_raw_pagina: 33433 }
        ],
        explanation: 'Para 65 000 filas, el mapa de bits de validez en Arrow ocupa 8 125 bytes, mientras que las columnas de texto como event_ts_raw requieren 1 820 024 bytes descomprimidos en página.'
      }
    }
  ],

  workedExample: {
    title: 'Auditoría de mapas de validez y cálculo vectorizado sobre lotes Arrow',
    description: 'Analizaremos cómo los motores basados en Apache Arrow evalúan nulos mediante mapas de bits en `events` y cómo ejecutan aritmética vectorizada sin bucles sobre `order_items`, `orders` y `products` de Mercado Brisa.',
    steps: [
      {
        label: 'Paso 1 — Inspeccionar los conteos de bits nulos por tipo de evento en events',
        code: `SELECT
  event_type,
  COUNT(*) AS total_events,
  COUNT(customer_id) AS known_customer_events,
  COUNT(*) - COUNT(customer_id) AS null_customer_bits,
  COUNT(campaign_id) AS attributed_events,
  COUNT(*) - COUNT(campaign_id) AS null_campaign_bits
FROM events
GROUP BY event_type
ORDER BY total_events DESC, event_type ASC;`,
        expectedOutput: [
          { event_type: 'add_to_cart', total_events: 15400, known_customer_events: 14056, null_customer_bits: 1344, attributed_events: 10050, null_campaign_bits: 5350 },
          { event_type: 'checkout_completed', total_events: 15400, known_customer_events: 14057, null_customer_bits: 1343, attributed_events: 13050, null_campaign_bits: 2350 },
          { event_type: 'checkout_started', total_events: 15400, known_customer_events: 14058, null_customer_bits: 1342, attributed_events: 10050, null_campaign_bits: 5350 },
          { event_type: 'page_view', total_events: 9400, known_customer_events: 8056, null_customer_bits: 1344, attributed_events: 7050, null_campaign_bits: 2350 },
          { event_type: 'product_view', total_events: 9400, known_customer_events: 8058, null_customer_bits: 1342, attributed_events: 7050, null_campaign_bits: 2350 }
        ],
        explanation: 'Cada columna con nulos mantiene un validity bitmap independiente: customer_id acumula 6 715 bits en cero (clientes anónimos) y campaign_id acumula 17 750 bits en cero (tráfico orgánico sin campaña).'
      },
      {
        label: 'Paso 2 — Filtrar primero en columnas angostas antes de acceder a payload_json',
        code: `SELECT
  device_type,
  COUNT(*) AS checkouts_completados,
  COUNT(customer_id) AS con_cliente_identificado,
  COUNT(campaign_id) AS con_campana_atribuida,
  ROUND(AVG(LENGTH(payload_json)), 2) AS longitud_media_payload_bytes
FROM events
WHERE event_type = 'checkout_completed'
GROUP BY device_type
ORDER BY checkouts_completados DESC;`,
        expectedOutput: [
          { device_type: 'desktop', checkouts_completados: 6348, con_cliente_identificado: 5901, con_campana_atribuida: 5564, longitud_media_payload_bytes: 56.96 },
          { device_type: 'mobile', checkouts_completados: 4848, con_cliente_identificado: 4401, con_campana_atribuida: 4065, longitud_media_payload_bytes: 52.89 },
          { device_type: 'pos_tienda', checkouts_completados: 4204, con_cliente_identificado: 3755, con_campana_atribuida: 3421, longitud_media_payload_bytes: 50.57 }
        ],
        explanation: 'Al aplicar materialización tardía, el motor filtra primero event_type y solo evalúa LENGTH(payload_json) sobre los 15 400 eventos de checkout_completed.'
      },
      {
        label: 'Paso 3 — Ejecutar cálculo vectorizado SIMD sobre búferes numéricos de order_items y products',
        code: `SELECT
  p.category,
  COUNT(*) AS lines_sold,
  SUM(oi.qty) AS units_sold,
  ROUND(SUM(oi.line_total_usd), 2) AS gross_sales_usd,
  ROUND(SUM(oi.qty * p.unit_cost_usd), 2) AS total_cost_usd,
  ROUND(SUM(oi.line_total_usd - (oi.qty * p.unit_cost_usd)), 2) AS gross_margin_usd
FROM order_items AS oi
INNER JOIN orders AS o ON oi.order_id = o.order_id
INNER JOIN products AS p ON oi.product_id = p.product_id
WHERE o.status = 'completed'
  AND p.list_price_usd > 0
GROUP BY p.category
ORDER BY gross_margin_usd DESC;`,
        expectedOutput: [
          { category: 'Molinos', lines_sold: 6899, units_sold: 14314, gross_sales_usd: 2163162.27, total_cost_usd: 1235089.04, gross_margin_usd: 928073.23 },
          { category: 'Cafeteras', lines_sold: 6908, units_sold: 14270, gross_sales_usd: 1643366.45, total_cost_usd: 861476.1, gross_margin_usd: 781890.35 },
          { category: 'Accesorios', lines_sold: 6902, units_sold: 14366, gross_sales_usd: 586859.56, total_cost_usd: 246528.02, gross_margin_usd: 340331.54 },
          { category: 'Suscripciones', lines_sold: 6712, units_sold: 13857, gross_sales_usd: 657384.31, total_cost_usd: 319166.57, gross_margin_usd: 338217.74 },
          { category: 'Café en grano', lines_sold: 6899, units_sold: 14243, gross_sales_usd: 413378.59, total_cost_usd: 184902.58, gross_margin_usd: 228476.01 }
        ],
        explanation: 'Como qty, line_total_usd y unit_cost_usd residen en búferes contiguos alineados a 64 bytes, la multiplicación y resta se ejecutan con instrucciones SIMD sobre las 5 categorías.'
      }
    ]
  },

  practice: {
    type: 'sql',
    title: 'Cálculo vectorizado de ventas, costos y margen bruto por categoría en lotes Arrow',
    prompt: 'Cruza `order_items` (`oi`), `orders` (`o`) y `products` (`p`) filtrando los pedidos completados (`o.status = \'completed\'`) y descartando el producto centinela con precio negativo (`p.list_price_usd > 0`). Devuelve por cada categoría (`p.category`): `category`, `lines_sold` (`COUNT(*)`), `units_sold` (`SUM(oi.qty)`), `gross_sales_usd` (`ROUND(SUM(oi.line_total_usd), 2)`), `total_cost_usd` (`ROUND(SUM(oi.qty * p.unit_cost_usd), 2)`) y `gross_margin_usd` (`ROUND(SUM(oi.line_total_usd - (oi.qty * p.unit_cost_usd)), 2)`), ordenado por `gross_margin_usd` de mayor a menor.',
    starterCode: `SELECT
  p.category,
  COUNT(*) AS lines_sold,
  SUM(oi.qty) AS units_sold,
  -- Completa gross_sales_usd, total_cost_usd y gross_margin_usd redondeados a 2 decimales
FROM order_items AS oi
INNER JOIN orders AS o ON oi.order_id = o.order_id
INNER JOIN products AS p ON oi.product_id = p.product_id
WHERE o.status = 'completed'
  AND p.list_price_usd > 0
GROUP BY p.category
ORDER BY gross_margin_usd DESC;`,
    solution: `SELECT
  p.category,
  COUNT(*) AS lines_sold,
  SUM(oi.qty) AS units_sold,
  ROUND(SUM(oi.line_total_usd), 2) AS gross_sales_usd,
  ROUND(SUM(oi.qty * p.unit_cost_usd), 2) AS total_cost_usd,
  ROUND(SUM(oi.line_total_usd - (oi.qty * p.unit_cost_usd)), 2) AS gross_margin_usd
FROM order_items AS oi
INNER JOIN orders AS o ON oi.order_id = o.order_id
INNER JOIN products AS p ON oi.product_id = p.product_id
WHERE o.status = 'completed'
  AND p.list_price_usd > 0
GROUP BY p.category
ORDER BY gross_margin_usd DESC;`,
    expectedOutputTable: [
      { category: 'Molinos', lines_sold: 6899, units_sold: 14314, gross_sales_usd: 2163162.27, total_cost_usd: 1235089.04, gross_margin_usd: 928073.23 },
      { category: 'Cafeteras', lines_sold: 6908, units_sold: 14270, gross_sales_usd: 1643366.45, total_cost_usd: 861476.1, gross_margin_usd: 781890.35 },
      { category: 'Accesorios', lines_sold: 6902, units_sold: 14366, gross_sales_usd: 586859.56, total_cost_usd: 246528.02, gross_margin_usd: 340331.54 },
      { category: 'Suscripciones', lines_sold: 6712, units_sold: 13857, gross_sales_usd: 657384.31, total_cost_usd: 319166.57, gross_margin_usd: 338217.74 },
      { category: 'Café en grano', lines_sold: 6899, units_sold: 14243, gross_sales_usd: 413378.59, total_cost_usd: 184902.58, gross_margin_usd: 228476.01 }
    ],
    orderMatters: true,
    hints: [
      'Para gross_sales_usd usa ROUND(SUM(oi.line_total_usd), 2).',
      'Para total_cost_usd usa ROUND(SUM(oi.qty * p.unit_cost_usd), 2).',
      'Para gross_margin_usd usa ROUND(SUM(oi.line_total_usd - (oi.qty * p.unit_cost_usd)), 2).'
    ],
    solutionExplanation: 'Al operar sobre los vectores contiguos de Apache Arrow en memoria, el motor multiplica y resta qty, unit_cost_usd y line_total_usd sin instanciar objetos por fila, encabezando Molinos con 928 073.23 USD de margen bruto.'
  },

  checks: [
    {
      id: 'chk-arrow-buffers-utf8',
      type: 'mcq',
      prompt: '¿Qué tres búferes contiguos utiliza Apache Arrow en memoria RAM para representar una columna de texto de longitud variable (`utf8` / `string`) con valores nulos?',
      options: [
        {
          id: 'a',
          text: 'Un mapa de bits de validez (1 bit por fila), un búfer de desplazamientos enteros (offsets) y un búfer contiguo con todos los bytes UTF-8 concatenados.',
          correct: true,
          feedback: 'Correcto. Arrow separa validez, desplazamientos y bytes UTF-8 contiguos para evitar punteros dispersos.'
        },
        {
          id: 'b',
          text: 'Un arreglo de punteros de 64 bits a objetos PyObject en el heap, un diccionario de longitudes y un archivo temporal de paginación.',
          correct: false,
          feedback: 'Incorrecto. Esa era la representación antigua del dtype object en pandas 1.x.'
        },
        {
          id: 'c',
          text: 'Un bloque comprimido con Zstandard, un pie de metadatos FileMetaData y un filtro de Bloom de 256 bits.',
          correct: false,
          feedback: 'Incorrecto. Esos componentes pertenecen al formato Parquet en disco, no a Apache Arrow en RAM.'
        },
        {
          id: 'd',
          text: 'Una matriz bidimensional de ancho fijo rellenada con espacios en blanco hasta alcanzar la longitud de la cadena más larga.',
          correct: false,
          feedback: 'Incorrecto. Rellenar con espacios desperdiciaría memoria; por eso Arrow usa el búfer de offsets.'
        }
      ],
      explanation: 'El formato columnar en memoria de Arrow elimina los punteros a objetos individuales separando la validez (validity bitmap), las posiciones iniciales y finales (offsets) y los bytes contiguos de texto (values).'
    },
    {
      id: 'chk-arrow-c-data-interface',
      type: 'mcq',
      prompt: 'Cuando DuckDB consulta un `DataFrame` de Polars en el mismo proceso de Python, ¿por qué la transferencia de datos ocurre en microsegundos sin duplicar el consumo de memoria RAM?',
      options: [
        {
          id: 'a',
          text: 'Porque ambos motores implementan la Arrow C Data Interface e intercambian los punteros a los búferes existentes mediante las estructuras ArrowSchema y ArrowArray (zero-copy).',
          correct: true,
          feedback: 'Exacto. Solo se pasan las direcciones de memoria de los búferes Arrow sin copiar los datos.'
        },
        {
          id: 'b',
          text: 'Porque Polars escribe un archivo Parquet temporal en `/tmp` y DuckDB lo mapea en memoria con `mmap`.',
          correct: false,
          feedback: 'Incorrecto. No se toca el sistema de archivos cuando ambos motores corren en el mismo proceso.'
        },
        {
          id: 'c',
          text: 'Porque DuckDB convierte internamente las columnas de Polars en una lista de tuplas de Python mediante la API C de CPython.',
          correct: false,
          feedback: 'Incorrecto. Convertir a tuplas de Python destruiría el rendimiento y multiplicaría el uso de RAM.'
        },
        {
          id: 'd',
          text: 'Porque ambos motores comparten un servidor Redis local que serializa los lotes en formato JSON binario.',
          correct: false,
          feedback: 'Incorrecto. Ambos motores son bibliotecas en proceso y no requieren ningún servidor externo.'
        }
      ],
      explanation: 'Tanto Polars como DuckDB operan sobre representaciones compatibles con Apache Arrow. Mediante la Arrow C Data Interface se pasan las direcciones de memoria de los búferes sin copiar bytes ni crear objetos de Python.'
    },
    {
      id: 'chk-lance-vortex-vs-parquet',
      type: 'mcq',
      prompt: '¿Por qué Lance y Vortex superan a Parquet cuando una carga de trabajo necesita recuperar 500 filas aleatorias por posición (`row_id`) de una tabla con columnas anchas?',
      options: [
        {
          id: 'a',
          text: 'Porque Parquet debe leer y descomprimir secuencialmente las Data Pages completas donde caen esas filas, mientras que Lance usa tablas de desplazamientos O(1) y Vortex opera sobre vectores comprimidos.',
          correct: true,
          feedback: 'Correcto. Lance y Vortex evitan descomprimir páginas enteras para extraer filas puntuales.'
        },
        {
          id: 'b',
          text: 'Porque Parquet almacena los datos fila por fila como un archivo CSV y carece de separación por columnas.',
          correct: false,
          feedback: 'Incorrecto. Parquet sí es columnar, pero comprime páginas enteras como bloques opacos.'
        },
        {
          id: 'c',
          text: 'Porque Lance y Vortex eliminan el tipado de columnas y guardan cada fila como un archivo independiente en el sistema operativo.',
          correct: false,
          feedback: 'Incorrecto. Ambos son formatos columnares fuertemente tipados y compatibles con Apache Arrow.'
        },
        {
          id: 'd',
          text: 'Porque Parquet no permite almacenar columnas de texto mayores de 255 caracteres.',
          correct: false,
          feedback: 'Incorrecto. Parquet admite cadenas BYTE_ARRAY de longitud arbitraria.'
        }
      ],
      explanation: 'En Parquet, las páginas de datos comprimen cientos o miles de valores en un bloque opaco, obligando a descomprimir toda la página para extraer una fila. Lance mantiene índices de desplazamiento directo y Vortex ejecuta operaciones sobre vectores comprimidos.'
    }
  ],

  roleNotes: {
    de: 'Como persona de Ingeniería de Datos, mantén tus pipelines en formato Apache Arrow en memoria entre etapas de extracción, validación y transformación. Si construyes almacenes de características o corpus multimodales para aprendizaje automático con lecturas puntuales por índice, evalúa Lance o Vortex frente a Parquet tradicional.',
    da: 'En Análisis de Datos, al trabajar con tablas que contienen columnas JSON o textos libres largos, filtra siempre por las columnas escalares primero (en una CTE o LazyFrame) y extrae los atributos del JSON solo sobre el subconjunto filtrado para aprovechar la materialización tardía.',
    bi: 'En Business Intelligence, cuando diseñes fuentes de datos para motores en memoria (como DuckDB, Arrow Flight o motores embebidos), evita convertir resultados columnares a diccionarios o listas por fila en la capa de aplicación: entrega directamente los RecordBatches de Arrow.'
  },

  summary: [
    'Apache Arrow organiza la memoria RAM en búferes alineados a 64 bytes de validez, desplazamientos y valores.',
    'La Arrow C Data Interface transfiere tablas entre DuckDB y Polars sin copia (zero-copy) pasando punteros C.',
    'La materialización tardía filtra primero columnas escalares ligeras y difiere la lectura de columnas de texto pesadas.',
    'Lance ofrece acceso aleatorio O(1) por índice y Vortex evalúa filtros directamente sobre vectores comprimidos.'
  ],

  flashcards: [
    {
      id: 'fc-de2-02-a',
      front: '¿Cuántos bytes ocupa el mapa de bits de validez (validity bitmap) de Apache Arrow para una columna de 65 000 filas?',
      back: 'Ocupa exactamente 8 125 bytes (65 000 / 8 bits), usando 1 bit por fila para indicar si el valor es válido (1) o NULL (0).'
    },
    {
      id: 'fc-de2-02-b',
      front: '¿En qué consiste la materialización tardía (late materialization) al consultar archivos columnares?',
      back: 'En evaluar primero los predicados WHERE sobre columnas escalares angostas y leer o reconstruir las columnas anchas solo en las filas que sobrevivieron al filtro.'
    },
    {
      id: 'fc-de2-02-c',
      front: '¿Qué ventaja clave aportan Lance y Vortex frente a Parquet en cargas de aprendizaje automático y búsqueda vectorial?',
      back: 'Permiten acceso aleatorio puntual O(1) en microsegundos y evaluación de operaciones sobre vectores comprimidos sin descomprimir Data Pages enteras.'
    }
  ],

  sources: [
    {
      title: 'Apache Arrow — Columnar Format and Memory Layout Specification',
      url: 'https://arrow.apache.org/docs/format/Columnar.html',
      publisher: 'Apache Software Foundation',
      accessed: '2026-10-29',
      supports: 'Especificación de alineación a 64 bytes y búferes de validez, desplazamientos y valores en RecordBatches.'
    },
    {
      title: 'Apache Arrow — C Data Interface Specification',
      url: 'https://arrow.apache.org/docs/format/CDataInterface.html',
      publisher: 'Apache Software Foundation',
      accessed: '2026-10-29',
      supports: 'Intercambio zero-copy en memoria entre motores mediante las estructuras ArrowSchema y ArrowArray.'
    },
    {
      title: 'Vortex Documentation — Extensible Columnar Format',
      url: 'https://docs.vortex.dev/',
      publisher: 'Linux Foundation / SpiralDB',
      accessed: '2026-10-29',
      supports: 'Codificaciones en cascada (FastLanes, ALP, FSST) y evaluación de predicados sobre datos comprimidos.'
    },
    {
      title: 'Lance Columnar Format — Specification and Architecture',
      url: 'https://github.com/lancedb/lance',
      publisher: 'LanceDB',
      accessed: '2026-10-29',
      supports: 'Acceso aleatorio O(1) mediante tablas de desplazamiento y materialización tardía de columnas anchas.'
    }
  ],

  aiNotes: 'Conecta los tres formatos: Parquet en disco (alta compresión por páginas), Apache Arrow en RAM (búferes alineados a 64 bytes para SIMD y zero-copy) y Lance/Vortex para acceso aleatorio O(1). Usa las cifras de Mercado Brisa: 6 715 nulos en `customer_id` y 17 750 en `campaign_id` de `events`, y el margen bruto de `Molinos` (`928 073.23 USD`).',

  relatedLessons: [
    'de2-formatos-01-columnar-parquet',
    'de2-formatos-03-duckdb-polars-marimo',
    'de2-formatos-04-codificacion-compresion-zstd'
  ]
};

export default lesson;
