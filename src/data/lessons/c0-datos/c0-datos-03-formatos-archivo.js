const lesson = {
  id: 'c0-datos-03-formatos-archivo',
  moduleId: 'c0-datos',
  tracks: ['core'],
  level: 0,
  order: 3,
  title: 'Archivos: CSV, JSON, Excel y Parquet frente a frente',
  subtitle: 'Archivos de datos: CSV, JSON, Excel y Parquet frente a frente',
  minutes: 20,
  prerequisites: ['c0-datos-02-null-vacio'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), los clientes se exportan desde un sistema antiguo en `customers.csv`, la tienda web registra cada clic con atributos variables dentro de un campo JSON y las ventas consolidadas se guardan en `orders.parquet`. Cuando alguien intenta abrir los 65 000 eventos web en una hoja de cálculo y sumarlos desde CSV, el archivo pesa diez veces más y pierde los tipos de fecha. ¿En qué se diferencian CSV, JSON, Excel y Parquet y cuándo conviene elegir cada uno?',

  objectives: [
    'Comparar cómo almacenan los datos los formatos CSV, JSON, hojas de cálculo Excel y Apache Parquet.',
    'Extraer atributos de un texto JSON (`json_extract_string`) y contrastarlos con columnas tipadas en una tabla.',
    'Explicar por qué el almacenamiento por columnas de Parquet ocupa menos espacio y acelera las consultas analíticas.',
  ],

  sections: [
    {
      id: 'csv-y-excel-archivos-orientados-a-filas',
      heading: 'CSV y Excel: cuándo sirven y dónde fallan los archivos por filas',
      body: 'Un archivo **CSV** (*Comma-Separated Values*, especificado en el RFC 4180) guarda una tabla como texto plano. Cada línea es una fila y una coma separa cada columna. Su ventaja es que cualquier programa puede abrirlo. Su desventaja es que no guarda tipos de dato. Todo es texto y el lector debe adivinar si `"08001"` es un código postal o el número `8001`.\n\nUn libro de **Excel** (`.xlsx`) añade formato visual, fórmulas y varias hojas. Sin embargo, tiene un límite estricto de `1 048 576` filas por hoja. Además, suele modificar datos sin avisar, como quitar ceros a la izquierda o convertir códigos en fechas.\n\nTanto CSV como las tablas tradicionales guardan los datos fila por fila. Si una tabla tiene 14 columnas pero solo quieres sumar `total_usd`, el disco debe recorrer también las otras 13 columnas.',
      interactive: {
        component: 'row-vs-columnar-storage',
        caption: 'Compara la lectura por filas (CSV) frente a la lectura por columnas (Parquet).',
      },
    },
    {
      id: 'json-datos-jerarquicos-y-semiestructurados',
      heading: 'JSON: flexibilidad para eventos web y APIs con estructura anidada',
      body: 'Cuando un usuario navega por la tienda de Mercado Brisa, ocurren distintos tipos de eventos. Algunos suceden al ver una página y otros al añadir un producto al carrito. Forzar todos los posibles atributos en columnas fijas dejaría la tabla llena de valores `NULL`.\n\nEl formato **JSON** (*JavaScript Object Notation*, RFC 8259) resuelve esto guardando pares `"clave": valor` que pueden anidarse. En la tabla `events` de Mercado Brisa, la columna `payload_json` conserva cadenas como `{"source":"web","campaign":"CMP-DIRECT","step":"add_to_cart"}`.\n\nJSON es el estándar para transmitir datos entre aplicaciones web. Sin embargo, resulta pesado para analizar millones de registros porque repite los nombres de las claves en cada fila. En DuckDB puedes extraer un campo puntual con `json_extract_string(payload_json, \'$.campaign\')`.',
      example: {
        language: 'sql',
        code: `SELECT
  event_id,
  event_type,
  device_type,
  json_extract_string(payload_json, '$.campaign') AS campana_extraida
FROM events
WHERE event_type = 'add_to_cart'
ORDER BY event_id
LIMIT 4;`,
        expectedOutput: [
          {
            event_id: 'evt-ord-10002',
            event_type: 'add_to_cart',
            device_type: 'desktop',
            campana_extraida: 'CMP-DIRECT',
          },
          {
            event_id: 'evt-ord-10005',
            event_type: 'add_to_cart',
            device_type: 'pos_tienda',
            campana_extraida: 'CMP-BARISTA',
          },
          {
            event_id: 'evt-ord-10008',
            event_type: 'add_to_cart',
            device_type: 'mobile',
            campana_extraida: 'CMP-DIRECT',
          },
          {
            event_id: 'evt-ord-10011',
            event_type: 'add_to_cart',
            device_type: 'desktop',
            campana_extraida: 'CMP-BARISTA',
          },
        ],
      },
    },
    {
      id: 'parquet-almacenamiento-columnar-tipado',
      heading: 'Apache Parquet: almacenamiento columnar, comprimido y con tipos fijos',
      body: 'Para analizar decenas de miles o millones de filas, el estándar es **Apache Parquet**. A diferencia de CSV o JSON, Parquet es un formato binario que organiza el archivo por columnas.\n\nGuardar todos los valores de una misma columna juntos tiene tres efectos inmediatos. Primero, el archivo incluye al final un catálogo obligatorio (el *footer*) con el nombre y el tipo exacto de cada columna. Así nunca pierde tipos (`INTEGER`, `DOUBLE`, `DATE`, `BOOLEAN`) al abrirse.\n\nSegundo, como una columna contiene valores parecidos, se comprime a una fracción del tamaño de un CSV. Las 13 tablas completas de Mercado Brisa con más de 160 000 filas ocupan solo `2,14 MB` en Parquet. Tercero, cuando una consulta pide dos columnas, el motor lee únicamente esas dos columnas del archivo.',
    },
  ],

  workedExample: {
    title: 'Inspección de columnas nativas en Parquet frente a atributos semiestructurados en events',
    description:
      'En `events.parquet` conviven columnas ya extraídas y tipadas (`event_type`, `product_id`, `device_type`) con el texto `payload_json`. Compara un conteo global frente al desglose por tipo de evento leyendo solo las columnas necesarias.',
    steps: [
      {
        label: 'Paso 1: Contar eventos totales frente a eventos con product_id presente',
        explanation:
          'Al consultar las columnas `product_id` en `events`, vemos que de las `65 000` filas totales solo `55 600` tienen un producto asociado, mientras que `9 400` tienen `product_id IS NULL`.',
        code: `SELECT
  COUNT(*) AS eventos_totales,
  COUNT(product_id) AS eventos_con_producto,
  COUNT(*) - COUNT(product_id) AS eventos_sin_producto
FROM events;`,
        expectedOutput: [
          {
            eventos_totales: 65000,
            eventos_con_producto: 55600,
            eventos_sin_producto: 9400,
          },
        ],
      },
      {
        label: 'Paso 2: Agrupar por event_type proyectando solo las columnas requeridas',
        explanation:
          'Al agrupar por `event_type`, comprobamos que los `9 400` eventos sin producto corresponden todos a `page_view` (visitas a la portada general), mientras que `product_view`, `add_to_cart`, `checkout_started` y `checkout_completed` siempre registran `product_id`.',
        code: `SELECT
  event_type,
  COUNT(*) AS total_eventos,
  COUNT(product_id) AS con_producto,
  COUNT(DISTINCT device_type) AS dispositivos
FROM events
GROUP BY event_type
ORDER BY total_eventos DESC, event_type ASC;`,
        expectedOutput: [
          {
            event_type: 'add_to_cart',
            total_eventos: 15400,
            con_producto: 15400,
            dispositivos: 3,
          },
          {
            event_type: 'checkout_completed',
            total_eventos: 15400,
            con_producto: 15400,
            dispositivos: 3,
          },
          {
            event_type: 'checkout_started',
            total_eventos: 15400,
            con_producto: 15400,
            dispositivos: 3,
          },
          {
            event_type: 'page_view',
            total_eventos: 9400,
            con_producto: 0,
            dispositivos: 3,
          },
          {
            event_type: 'product_view',
            total_eventos: 9400,
            con_producto: 9400,
            dispositivos: 3,
          },
        ],
      },
    ],
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt:
        'Tienes una tabla con 50 columnas y 10 millones de filas. Tus consultas diarias solo suman `total_usd` agrupado por `country_code`. ¿Qué formato de archivo lee menos bytes del disco y conserva los tipos?',
      options: [
        {
          id: 'a',
          text: 'Apache Parquet, porque guarda los datos por columnas con su esquema tipado y lee solo las 2 columnas pedidas.',
          correct: true,
          feedback:
            'Exacto. Parquet salta las 48 columnas restantes y conserva el tipo exacto de cada columna en sus metadatos.',
        },
        {
          id: 'b',
          text: 'CSV, porque al ser texto plano sin cabeceras binarias permite saltar columnas sin leer las filas.',
          correct: false,
          feedback:
            'Incorrecto. En un CSV las 50 columnas están intercaladas en cada línea de texto; para llegar a la columna 40 hay que recorrer todas las anteriores.',
        },
        {
          id: 'c',
          text: 'JSON, porque repite el nombre de cada columna en cada fila para encontrarla más rápido.',
          correct: false,
          feedback:
            'Incorrecto. Repetir los nombres de clave en 10 millones de objetos multiplica el tamaño del archivo y exige analizar cada registro.',
        },
      ],
      explanation:
        'El almacenamiento columnar de Parquet agrupa físicamente cada columna por separado, permitiendo leer únicamente las columnas proyectadas en el SELECT.',
    },
    {
      id: 'c2',
      type: 'mcq',
      prompt:
        'Una aplicación móvil envía eventos con estructuras variables (algunos traen una lista de cupones y otros datos de ubicación anidados). ¿Qué formato se diseña específicamente para este intercambio jerárquico?',
      options: [
        {
          id: 'a',
          text: 'JSON, porque representa objetos clave-valor y listas anidadas sin exigir las mismas columnas en cada mensaje.',
          correct: true,
          feedback:
            'Correcto. JSON es el estándar de intercambio en APIs y eventos cuando los atributos varían o tienen jerarquía.',
        },
        {
          id: 'b',
          text: 'CSV estándar sin escapar, porque cada coma crea automáticamente un nivel de anidamiento.',
          correct: false,
          feedback:
            'Incorrecto. CSV es un formato tabular plano de dos dimensiones (filas y columnas) y no modela jerarquías nativamente.',
        },
        {
          id: 'c',
          text: 'Un libro de Excel (.xlsx), porque admite hasta 100 millones de filas por hoja.',
          correct: false,
          feedback:
            'Incorrecto. Una hoja de Excel tiene un límite máximo de 1 048 576 filas y está pensada para edición manual, no para ingesta de eventos.',
        },
      ],
      explanation:
        'JSON modela estructuras jerárquicas (objetos y arreglos anidados) ideales para APIs y eventos, que luego suelen aplanarse hacia tablas Parquet para análisis.',
    },
    {
      id: 'c3',
      type: 'order',
      prompt:
        'Ordena de menor a mayor idoneidad para guardar y consultar analíticamente una tabla histórica de 20 millones de pedidos con tipos estrictos:',
      items: [
        'Hoja de cálculo Excel (.xlsx), limitada a 1 048 576 filas por hoja',
        'Archivo CSV de texto plano, sin tipos adjuntos y leído fila por fila',
        'Archivo Apache Parquet, columnar, comprimido y con esquema tipado en el pie',
      ],
      correctOrder: [
        'Hoja de cálculo Excel (.xlsx), limitada a 1 048 576 filas por hoja',
        'Archivo CSV de texto plano, sin tipos adjuntos y leído fila por fila',
        'Archivo Apache Parquet, columnar, comprimido y con esquema tipado en el pie',
      ],
      explanation:
        'Excel no puede siquiera abrir 20 millones de filas en una hoja; CSV puede guardarlas pero sin tipos y leyendo todo el archivo; Parquet las comprime por columna conservando el esquema.',
    },
  ],

  practice: {
    type: 'sql',
    title: 'Proyección de columnas sobre orders.parquet por tipo de dispositivo',
    language: 'sql',
    prompt:
      'Consulta la tabla `orders` de Mercado Brisa (almacenada en Parquet) proyectando solo las columnas necesarias para resumir los pedidos completados (`WHERE status = \'completed\'`) por `device_type`: calcula `pedidos_completados` (`COUNT(order_id)`) e `ingresos_usd` (`ROUND(SUM(total_usd), 2)`). Agrupa por `device_type` y ordena por `ingresos_usd DESC`.',
    starterCode: `SELECT
  device_type,
  COUNT(order_id) AS pedidos_completados,
  -- TODO: Suma total_usd redondeado a 2 decimales AS ingresos_usd
  0.0 AS ingresos_usd
FROM orders
WHERE status = 'completed'
GROUP BY device_type
ORDER BY ingresos_usd DESC;`,
    expected: `SELECT
  device_type,
  COUNT(order_id) AS pedidos_completados,
  ROUND(SUM(total_usd), 2) AS ingresos_usd
FROM orders
WHERE status = 'completed'
GROUP BY device_type
ORDER BY ingresos_usd DESC;`,
    orderMatters: true,
    blanks: [{ id: 'b1', answer: 'ROUND(SUM(total_usd), 2)' }],
    hints: [
      'Al seleccionar solo `device_type`, `order_id`, `total_usd` y `status`, el lector de Parquet ignora las otras 10 columnas de `orders`.',
      'Reemplaza `0.0 AS ingresos_usd` por `ROUND(SUM(total_usd), 2) AS ingresos_usd`.',
      'Mantén el filtro `WHERE status = \'completed\'`, `GROUP BY device_type` y `ORDER BY ingresos_usd DESC`.',
    ],
    solution: `SELECT
  device_type,
  COUNT(order_id) AS pedidos_completados,
  ROUND(SUM(total_usd), 2) AS ingresos_usd
FROM orders
WHERE status = 'completed'
GROUP BY device_type
ORDER BY ingresos_usd DESC;`,
    solutionExplanation:
      'Selecciona únicamente las columnas involucradas en el cálculo sobre `orders.parquet`, filtrando los pedidos completados y agregando por `device_type`.',
    expectedOutputTable: [
      {
        device_type: 'desktop',
        pedidos_completados: 6327,
        ingresos_usd: 2867799,
      },
      {
        device_type: 'mobile',
        pedidos_completados: 5624,
        ingresos_usd: 2199394.23,
      },
      {
        device_type: 'pos_tienda',
        pedidos_completados: 2809,
        ingresos_usd: 1202269.19,
      },
    ],
  },

  roleNotes: {
    de: 'En Ingeniería de Datos recibes eventos en JSON y archivos externos en CSV, validas sus tipos y los conviertes a Parquet para reducir el almacenamiento y acelerar las lecturas.',
    da: 'En Análisis de Datos evitas escribir SELECT * sobre tablas grandes en Parquet: pedir solo las columnas necesarias hace que tus consultas terminen en una fracción del tiempo.',
    bi: 'En Business Intelligence conectas tus modelos semánticos a tablas Parquet en lugar de hojas CSV sueltas para evitar que una recarga cambie tipos de fecha o número.',
  },

  summary: [
    'CSV guarda filas en texto plano sin tipos adjuntos; cualquier lector debe inferir el esquema.',
    'Excel es útil para análisis manual pequeño, pero limita cada hoja a 1 048 576 filas.',
    'JSON modela datos jerárquicos clave-valor de APIs y eventos, pero repite las claves en cada registro.',
    'Parquet almacena datos por columnas en formato binario comprimido con tipos fijos en su pie.',
  ],

  flashcards: [
    {
      id: 'fc-c0-datos-03-a',
      front: '¿Por qué un archivo CSV pierde códigos postales como "08001" cuando se abre sin cuidado?',
      back: 'Porque CSV no guarda el tipo de dato de cada columna; si el programa infiere que "08001" es un entero, elimina el cero a la izquierda y deja 8001.',
    },
    {
      id: 'fc-c0-datos-03-b',
      front: '¿Qué ventaja principal tiene Parquet frente a CSV cuando ejecutas `SELECT total_usd FROM orders`?',
      back: 'Al ser columnar, Parquet lee del disco únicamente los bloques de la columna `total_usd` e ignora las otras 13 columnas de la tabla.',
    },
    {
      id: 'fc-c0-datos-03-c',
      front: '¿Cuándo es preferible JSON frente a una tabla plana CSV?',
      back: 'Cuando los registros tienen estructura jerárquica (listas u objetos anidados) o atributos opcionales que cambian entre eventos.',
    },
  ],

  glossaryTerms: ['c0-formato-csv', 'c0-formato-json', 'c12-parquet-columnar'],

  sources: [
    {
      title: 'RFC 4180 — Common Format and MIME Type for Comma-Separated Values (CSV) Files',
      url: 'https://datatracker.ietf.org/doc/html/rfc4180',
      publisher: 'Internet Engineering Task Force (IETF)',
      accessed: '2026-10-29',
      supports:
        'Especificación del formato CSV como texto separado por comas sin metadatos de tipos de datos.',
    },
    {
      title: 'RFC 8259 — The JavaScript Object Notation (JSON) Data Interchange Format',
      url: 'https://datatracker.ietf.org/doc/html/rfc8259',
      publisher: 'Internet Engineering Task Force (IETF)',
      accessed: '2026-10-29',
      supports:
        'Definición estándar de objetos clave-valor y arreglos anidados en JSON.',
    },
    {
      title: 'Apache Parquet Official Documentation — File Format Overview',
      url: 'https://parquet.apache.org/docs/file-format/',
      publisher: 'Apache Software Foundation',
      accessed: '2026-10-29',
      supports:
        'Disposición columnar, compresión por columna y almacenamiento del esquema tipado en el footer del archivo Parquet.',
    },
  ],

  aiNotes:
    'En Nivel 0 es frecuente pensar que un archivo `.csv` que se abre con doble clic en Excel "es un archivo de Excel", o no visualizar cómo se guarda una tabla por columnas en lugar de por filas. Apóyate en el simulador `row-vs-columnar-storage` de la primera sección.',
};

export default lesson;
