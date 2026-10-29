const lesson = {
  id: 'de2-formatos-05-particionado-archivos-pequenos',
  moduleId: 'de2-formatos',
  tracks: ['de'],
  level: 2,
  order: 5,
  title: 'Particionado Hive, archivos pequeños y ordenamiento físico',
  subtitle: 'Particionado Hive, antipatrón de archivos pequeños y ordenamiento físico en Parquet',
  minutes: 25,
  prerequisites: [
    'de2-formatos-01-columnar-parquet',
    'de2-formatos-04-codificacion-compresion-zstd'
  ],
  glossaryTerms: [
    'particionado-hive-small-files',
    'zone-map',
    'predicate-pushdown',
    'codificacion-diccionario-rle',
    'parquet-row-group'
  ],
  contentVersion: 1,

  hook: 'Un pipeline diario escribe un archivo Parquet por tienda y por fecha en un lago de objetos en la nube. En `orders.parquet` de Mercado Brisa (18 000 filas), dividir los pedidos por día y tienda genera `8 756` archivos diminutos con un promedio de `2.06` filas por archivo. Aunque el volumen total es inferior a un megabyte, el motor invierte casi todo el tiempo en llamadas HTTP `LIST` y `GET`. ¿Cómo equilibrar el particionado estilo Hive con el ordenamiento físico (`ORDER BY`) al escribir Parquet?',

  objectives: [
    'Explicar cómo funciona el particionado de directorios estilo Hive y cómo habilita la poda de particiones (partition pruning).',
    'Diagnosticar el antipatrón de archivos pequeños (small files problem) al particionar por columnas de alta cardinalidad.',
    'Aplicar ordenamiento físico (ORDER BY al escribir) para compactar los zone maps y alargar las rachas RLE sin fragmentar los archivos.'
  ],

  sections: [
    {
      id: 'particionado-hive-y-pruning',
      heading: 'Particionado estilo Hive y poda de directorios',
      body: 'El **particionado estilo Hive** organiza un conjunto de archivos en subdirectorios cuyos nombres codifican pares `clave=valor`, por ejemplo `orders/order_year=2025/region=Andina/part-0.parquet`. Cuando una consulta incluye el predicado `WHERE order_year = 2025`, el motor aplica **poda de particiones** (*partition pruning*): descarta todas las carpetas de años anteriores sin abrir sus archivos.\n\nLa columna usada como clave de partición suele omitirse del interior de cada archivo Parquet porque su valor ya está implícito en la ruta del directorio. Sin embargo, el particionado introduce una decisión física rígida: solo las consultas que filtren por las claves de carpeta evitan recorrer todos los subdirectorios.\n\nEn nuestro dataset `orders.parquet` existen `18 000` pedidos repartidos en **3 años** (`2023`, `2024` y `2025`) y `35` meses activos. Si particionamos por año obtenemos `3` directorios con `6 000` filas de media; si particionamos por día y tienda, fragmentamos la tabla en `8 756` archivos de apenas `2.06` filas.',
      example: {
        language: 'sql',
        code: `SELECT
  COUNT(*) AS total_pedidos,
  COUNT(DISTINCT EXTRACT(YEAR FROM order_ts)) AS particiones_anuales,
  ROUND(COUNT(*) * 1.0 / COUNT(DISTINCT EXTRACT(YEAR FROM order_ts)), 0) AS filas_por_anio,
  COUNT(DISTINCT strftime(order_ts, '%Y-%m')) AS particiones_mensuales,
  ROUND(COUNT(*) * 1.0 / COUNT(DISTINCT strftime(order_ts, '%Y-%m')), 1) AS filas_por_mes,
  COUNT(DISTINCT CAST(order_ts AS DATE) || '_' || store_id) AS particiones_dia_tienda,
  ROUND(COUNT(*) * 1.0 / COUNT(DISTINCT CAST(order_ts AS DATE) || '_' || store_id), 2) AS filas_por_dia_tienda
FROM orders;`,
        expectedOutput: [
          {
            total_pedidos: 18000,
            particiones_anuales: 3,
            filas_por_anio: 6000,
            particiones_mensuales: 35,
            filas_por_mes: 514.3,
            particiones_dia_tienda: 8756,
            filas_por_dia_tienda: 2.06
          }
        ],
        explanation: 'Particionar por año genera 3 archivos densos (6 000 filas cada uno), mientras que particionar por día y tienda produce 8 756 archivos diminutos de 2.06 filas.'
      },
      callout: {
        type: 'warning',
        title: 'El costo de listar objetos en la nube',
        body: 'En sistemas de objetos como S3, GCS o ADLS, cada operación LIST y cada apertura HTTP de archivo añaden entre 10 y 50 ms de latencia de red.'
      }
    },
    {
      id: 'small-files-problem',
      heading: 'El problema de los archivos pequeños (small files problem)',
      body: 'El antipatrón de los **archivos pequeños** (*small files problem*) aparece por dos causas principales: particionar por columnas con demasiados valores distintos (**sobre-particionado**) o ingerir micro-lotes continuos desde flujos de eventos sin un trabajo periódico de **compactación**.\n\nCuando un archivo Parquet contiene solo unas pocas decenas o cientos de filas, se anulan las ventajas del diseño columnar.\n\n- El **Footer de metadatos** (esquema, estadísticas por columna y offsets) llega a pesar más que los propios datos comprimidos.\n- Los diccionarios y bloques RLE o Zstandard no reúnen suficientes valores repetidos para comprimir con eficacia.\n- El motor gasta más tiempo abriendo miles de conexiones y parseando footers que ejecutando vectores SIMD.\n\nComo regla operativa en lagos de datos analíticos, cada archivo Parquet en producción debe situarse entre **128 MB y 512 MB** (o contener al menos entre `100 000` y `1 000 000` de filas). Si una partición no alcanza ese volumen, conviene elegir una granularidad más gruesa.',
      example: {
        language: 'sql',
        code: `SELECT
  event_type,
  device_type,
  COUNT(*) AS total_events,
  COUNT(DISTINCT CAST(event_ts AS DATE)) AS distinct_days,
  COUNT(DISTINCT customer_id) AS distinct_customers,
  ROUND(COUNT(*) * 1.0 / COUNT(DISTINCT CAST(event_ts AS DATE)), 1) AS avg_events_per_day
FROM events
GROUP BY event_type, device_type
ORDER BY total_events DESC, event_type ASC, device_type ASC
LIMIT 6;`,
        expectedOutput: [
          { event_type: 'checkout_started', device_type: 'mobile', total_events: 6776, distinct_days: 1055, distinct_customers: 970, avg_events_per_day: 6.4 },
          { event_type: 'checkout_completed', device_type: 'desktop', total_events: 6348, distinct_days: 1052, distinct_customers: 850, avg_events_per_day: 6 },
          { event_type: 'add_to_cart', device_type: 'desktop', total_events: 5920, distinct_days: 1053, distinct_customers: 730, avg_events_per_day: 5.6 },
          { event_type: 'checkout_completed', device_type: 'mobile', total_events: 4848, distinct_days: 1048, distinct_customers: 520, avg_events_per_day: 4.6 },
          { event_type: 'checkout_started', device_type: 'desktop', total_events: 4848, distinct_days: 1043, distinct_customers: 540, avg_events_per_day: 4.6 },
          { event_type: 'add_to_cart', device_type: 'pos_tienda', total_events: 4847, distinct_days: 1047, distinct_customers: 540, avg_events_per_day: 4.6 }
        ],
        explanation: 'Incluso en la combinación más frecuente (checkout_started en mobile), particionar además por fecha dejaría apenas 6.4 eventos por archivo diario.'
      },
      diagram: {
        type: 'mermaid',
        title: 'Sobre-particionado frente a particionado grueso con ordenamiento interno',
        code: `flowchart TD
    subgraph Anti["Antipatrón: 8 756 archivos diminutos"]
      A1["2025-01-01/store=1/part.parquet (2 filas)"]
      A2["2025-01-01/store=2/part.parquet (2 filas)"]
      A3["... 8 754 archivos más ..."]
    end
    subgraph Best["Diseño óptimo: Partición gruesa + ORDER BY interno"]
      B1["order_year=2024/region=Cono Sur/part.parquet (ordenado)"]
      B2["order_year=2025/region=Cono Sur/part.parquet (ordenado)"]
    end`
      }
    },
    {
      id: 'ordenamiento-fisico-clustering',
      heading: 'Ordenamiento físico (ORDER BY) al escribir archivos Parquet',
      body: '¿Cómo aceleramos las consultas que filtran por `store_id`, `status` o `device_type` sin crear miles de carpetas? La solución es aplicar **ordenamiento físico** (*data clustering*) antes de escribir cada archivo Parquet: `COPY (SELECT * FROM orders ORDER BY store_id, status, order_ts) TO \'orders_sorted.parquet\' (FORMAT PARQUET, COMPRESSION ZSTD)`.\n\nAl ordenar las filas antes de materializar el archivo Parquet, obtenemos tres beneficios directos sin multiplicar los ficheros en disco.\n\n1. **Zone maps estrechos:** Los valores de `store_id` y `status` quedan agrupados en páginas contiguas. Sus estadísticos `min` y `max` dejan de solaparse entre páginas y permiten saltar bloques completos.\n2. **Rachas RLE largas:** Al situar miles de valores idénticos uno tras otro, Run-Length Encoding colapsa cada racha en un solo par `(longitud, índice)`.\n3. **Menor entropía en Zstandard:** Las columnas correlacionadas con la clave de ordenamiento comprimen mejor dentro de cada página.\n\nEn `orders.parquet`, podemos inspeccionar cómo las columnas de baja cardinalidad (`status`, `device_type`, `store_id`) ocupan entre `130` y `268` bytes gracias al diccionario, mientras que sus rangos `[min_val, max_val]` delimitan el dominio del Row Group.',
      example: {
        language: 'sql',
        code: `SELECT
  path_in_schema AS columna,
  encodings,
  total_compressed_size AS bytes_comprimidos,
  stats_min_value AS min_val,
  stats_max_value AS max_val
FROM parquet_metadata('orders.parquet')
WHERE path_in_schema IN ('status', 'device_type', 'store_id', 'order_id', 'total_usd')
ORDER BY total_compressed_size ASC;`,
        expectedOutput: [
          { columna: 'status', encodings: 'PLAIN_DICTIONARY', bytes_comprimidos: 130, min_val: 'cancelled', max_val: 'refunded' },
          { columna: 'device_type', encodings: 'PLAIN_DICTIONARY', bytes_comprimidos: 220, min_val: 'desktop', max_val: 'pos_tienda' },
          { columna: 'store_id', encodings: 'PLAIN_DICTIONARY', bytes_comprimidos: 268, min_val: 1, max_val: 14 },
          { columna: 'order_id', encodings: 'PLAIN', bytes_comprimidos: 43306, min_val: 10001, max_val: 28000 },
          { columna: 'total_usd', encodings: 'PLAIN', bytes_comprimidos: 58809, min_val: '13.13', max_val: '1925.73' }
        ],
        explanation: 'Las estadísticas min_val y max_val se registran en el Footer y en el Page Index; ordenar físicamente por store_id y status hace que cada página cubra un subconjunto exclusivo de tiendas y estados.'
      }
    }
  ],

  workedExample: {
    title: 'Diseño de particionado y ordenamiento físico para eventos y pedidos',
    description: 'Evaluaremos el impacto de particionar `events` y `orders` con distintas claves para evitar el problema de archivos pequeños y maximizar la longitud de las rachas RLE.',
    steps: [
      {
        label: 'Paso 1 — Cuantificar el sobre-particionado por fecha y cliente en events',
        code: `SELECT
  COUNT(*) AS total_eventos,
  COUNT(DISTINCT CAST(event_ts AS DATE) || '_' || COALESCE(CAST(customer_id AS VARCHAR), 'NULL')) AS archivos_dia_cliente,
  ROUND(COUNT(*) * 1.0 / COUNT(DISTINCT CAST(event_ts AS DATE) || '_' || COALESCE(CAST(customer_id AS VARCHAR), 'NULL')), 2) AS filas_por_archivo
FROM events;`,
        expectedOutput: [
          { total_eventos: 65000, archivos_dia_cliente: 57644, filas_por_archivo: 1.13 }
        ],
        explanation: 'Particionar events por día y customer_id crearía 57 644 archivos con apenas 1.13 filas por archivo: un caso extremo de small files problem.'
      },
      {
        label: 'Paso 2 — Evaluar particionado anual con ordenamiento interno por (event_type, device_type)',
        code: `SELECT
  EXTRACT(YEAR FROM event_ts) AS anio,
  COUNT(*) AS filas_en_particion_anual,
  COUNT(DISTINCT event_type || '_' || device_type) AS rachas_rle_por_archivo,
  ROUND(COUNT(*) * 1.0 / COUNT(DISTINCT event_type || '_' || device_type), 1) AS longitud_media_racha
FROM events
GROUP BY EXTRACT(YEAR FROM event_ts)
ORDER BY anio ASC;`,
        expectedOutput: [
          { anio: 2023, filas_en_particion_anual: 18629, rachas_rle_por_archivo: 15, longitud_media_racha: 1241.9 },
          { anio: 2024, filas_en_particion_anual: 24263, rachas_rle_por_archivo: 15, longitud_media_racha: 1617.5 },
          { anio: 2025, filas_en_particion_anual: 22108, rachas_rle_por_archivo: 15, longitud_media_racha: 1473.9 }
        ],
        explanation: 'Al particionar solo por año (3 archivos) y ordenar internamente por (event_type, device_type), cada archivo se comprime en 15 rachas RLE de entre 1 241.9 y 1 617.5 filas consecutivas.'
      },
      {
        label: 'Paso 3 — Auditar el volumen por partición (order_year, region) en pedidos completados',
        code: `SELECT
  EXTRACT(YEAR FROM o.order_ts) AS order_year,
  s.region,
  COUNT(*) AS orders_in_partition,
  COUNT(DISTINCT CAST(o.order_ts AS DATE)) AS active_days,
  ROUND(SUM(o.total_usd), 2) AS partition_revenue_usd
FROM orders o
JOIN stores s ON o.store_id = s.store_id
WHERE o.status = 'completed'
GROUP BY EXTRACT(YEAR FROM o.order_ts), s.region
ORDER BY order_year DESC, partition_revenue_usd DESC;`,
        expectedOutput: [
          { order_year: 2025, region: 'Cono Sur', orders_in_partition: 2081, active_days: 330, partition_revenue_usd: 872819.1 },
          { order_year: 2025, region: 'Andina', orders_in_partition: 2112, active_days: 330, partition_revenue_usd: 866121.5 },
          { order_year: 2025, region: 'Iberia', orders_in_partition: 1171, active_days: 320, partition_revenue_usd: 563336.09 },
          { order_year: 2025, region: 'Norteamérica', orders_in_partition: 918, active_days: 305, partition_revenue_usd: 384551.88 },
          { order_year: 2024, region: 'Cono Sur', orders_in_partition: 2199, active_days: 366, partition_revenue_usd: 919026.32 },
          { order_year: 2024, region: 'Andina', orders_in_partition: 2154, active_days: 365, partition_revenue_usd: 858331.08 },
          { order_year: 2024, region: 'Iberia', orders_in_partition: 1232, active_days: 356, partition_revenue_usd: 590458.99 },
          { order_year: 2024, region: 'Norteamérica', orders_in_partition: 912, active_days: 330, partition_revenue_usd: 363700.11 },
          { order_year: 2023, region: 'Cono Sur', orders_in_partition: 640, active_days: 260, partition_revenue_usd: 267940.97 },
          { order_year: 2023, region: 'Andina', orders_in_partition: 655, active_days: 260, partition_revenue_usd: 266101.54 },
          { order_year: 2023, region: 'Iberia', orders_in_partition: 408, active_days: 219, partition_revenue_usd: 194574.6 },
          { order_year: 2023, region: 'Norteamérica', orders_in_partition: 278, active_days: 176, partition_revenue_usd: 122500.24 }
        ],
        explanation: 'Particionar por (order_year, region) produce exactamente 12 particiones equilibradas, mientras que si hubiésemos añadido la fecha diaria (active_days) habríamos dispersado las filas en más de 3 600 carpetas.'
      }
    ]
  },

  practice: {
    type: 'sql',
    title: 'Auditoría de particiones por año y región en pedidos completados',
    prompt: 'Evalúa el esquema de particionado `(order_year, region)` uniendo `orders o` con `stores s` (`ON o.store_id = s.store_id`) para los pedidos con `o.status = \'completed\'`. Devuelve las columnas `order_year` (`EXTRACT(YEAR FROM o.order_ts)`), `region` (`s.region`), `orders_in_partition` (`COUNT(*)`), `active_days` (`COUNT(DISTINCT CAST(o.order_ts AS DATE))`) y `partition_revenue_usd` (`ROUND(SUM(o.total_usd), 2)`), ordenando por `order_year DESC, partition_revenue_usd DESC`.',
    starterCode: `SELECT
  EXTRACT(YEAR FROM o.order_ts) AS order_year,
  s.region,
  COUNT(*) AS orders_in_partition,
  -- Calcula active_days y partition_revenue_usd redondeado a 2 decimales
FROM orders o
JOIN stores s ON o.store_id = s.store_id
WHERE o.status = 'completed'
GROUP BY EXTRACT(YEAR FROM o.order_ts), s.region
ORDER BY order_year DESC, partition_revenue_usd DESC;`,
    solution: `SELECT
  EXTRACT(YEAR FROM o.order_ts) AS order_year,
  s.region,
  COUNT(*) AS orders_in_partition,
  COUNT(DISTINCT CAST(o.order_ts AS DATE)) AS active_days,
  ROUND(SUM(o.total_usd), 2) AS partition_revenue_usd
FROM orders o
JOIN stores s ON o.store_id = s.store_id
WHERE o.status = 'completed'
GROUP BY EXTRACT(YEAR FROM o.order_ts), s.region
ORDER BY order_year DESC, partition_revenue_usd DESC;`,
    expectedOutputTable: [
      { order_year: 2025, region: 'Cono Sur', orders_in_partition: 2081, active_days: 330, partition_revenue_usd: 872819.1 },
      { order_year: 2025, region: 'Andina', orders_in_partition: 2112, active_days: 330, partition_revenue_usd: 866121.5 },
      { order_year: 2025, region: 'Iberia', orders_in_partition: 1171, active_days: 320, partition_revenue_usd: 563336.09 },
      { order_year: 2025, region: 'Norteamérica', orders_in_partition: 918, active_days: 305, partition_revenue_usd: 384551.88 },
      { order_year: 2024, region: 'Cono Sur', orders_in_partition: 2199, active_days: 366, partition_revenue_usd: 919026.32 },
      { order_year: 2024, region: 'Andina', orders_in_partition: 2154, active_days: 365, partition_revenue_usd: 858331.08 },
      { order_year: 2024, region: 'Iberia', orders_in_partition: 1232, active_days: 356, partition_revenue_usd: 590458.99 },
      { order_year: 2024, region: 'Norteamérica', orders_in_partition: 912, active_days: 330, partition_revenue_usd: 363700.11 },
      { order_year: 2023, region: 'Cono Sur', orders_in_partition: 640, active_days: 260, partition_revenue_usd: 267940.97 },
      { order_year: 2023, region: 'Andina', orders_in_partition: 655, active_days: 260, partition_revenue_usd: 266101.54 },
      { order_year: 2023, region: 'Iberia', orders_in_partition: 408, active_days: 219, partition_revenue_usd: 194574.6 },
      { order_year: 2023, region: 'Norteamérica', orders_in_partition: 278, active_days: 176, partition_revenue_usd: 122500.24 }
    ],
    orderMatters: true,
    hints: [
      'Usa COUNT(DISTINCT CAST(o.order_ts AS DATE)) AS active_days para contar los días con actividad en cada partición.',
      'Calcula los ingresos de la partición con ROUND(SUM(o.total_usd), 2) AS partition_revenue_usd.',
      'Conserva el filtro WHERE o.status = \'completed\' y el orden ORDER BY order_year DESC, partition_revenue_usd DESC.'
    ],
    solutionExplanation: 'La consulta mide las 12 particiones resultantes de agrupar por año y región, revelando que un particionado adicional por fecha multiplicaría por más de 300 el número de archivos pequeños.'
  },

  checks: [
    {
      id: 'chk-hive-small-files',
      type: 'mcq',
      prompt: '¿Por qué particionar una tabla Parquet de 10 GB en almacenamiento de objetos por `(fecha, customer_id)` degrada gravemente el tiempo de respuesta de las consultas analíticas?',
      options: [
        {
          id: 'a',
          text: 'Porque el formato Parquet no admite directorios anidados con más de un nivel de profundidad.',
          correct: false,
          feedback: 'Incorrecto. El particionado estilo Hive soporta múltiples niveles de subdirectorios clave=valor.'
        },
        {
          id: 'b',
          text: 'Porque genera decenas de miles de archivos diminutos, haciendo que la latencia de listado HTTP y la lectura de footers superen con creces a la lectura de datos útiles.',
          correct: true,
          feedback: 'Correcto. La alta cardinalidad de customer_id fragmenta los datos en miles de archivos pequeños y dispara la sobrecarga de llamadas HTTP y parsing de metadatos.'
        },
        {
          id: 'c',
          text: 'Porque las columnas incluidas en la ruta Hive se duplican diez veces dentro del Footer de cada archivo.',
          correct: false,
          feedback: 'Incorrecto. Al contrario, las columnas de partición suelen omitirse del cuerpo del archivo Parquet.'
        },
        {
          id: 'd',
          text: 'Porque DuckDB solo puede leer un máximo de 12 archivos Parquet por consulta.',
          correct: false,
          feedback: 'Incorrecto. DuckDB puede escanear miles de archivos, pero el cuello de botella está en la latencia de entrada/salida al abrir tantos objetos diminutos.'
        }
      ],
      explanation: 'Al particionar por una clave de alta cardinalidad como customer_id, cada archivo termina con muy pocas filas. El tiempo de red en peticiones LIST/GET y la decodificación de miles de Footers superan al tiempo de escaneo columnar.'
    },
    {
      id: 'chk-physical-sorting-parquet',
      type: 'mcq',
      prompt: 'Si decides mantener pocos archivos Parquet grandes (por ejemplo, particionados solo por año) pero tus consultas filtran constantemente por `store_id` y `status`, ¿qué técnica conserva la poda rápida sin crear miles de carpetas?',
      options: [
        {
          id: 'a',
          text: 'Desactivar la compresión Zstandard y escribir las filas en orden aleatorio para equilibrar los Row Groups.',
          correct: false,
          feedback: 'Incorrecto. El orden aleatorio hace que cada Row Group contenga todos los valores de store_id, anulando la poda por zone maps.'
        },
        {
          id: 'b',
          text: 'Ordenar físicamente los datos (`ORDER BY store_id, status`) al escribir cada archivo Parquet para estrechar los zone maps y alargar las rachas RLE.',
          correct: true,
          feedback: 'Exacto. El ordenamiento físico agrupa valores iguales en páginas contiguas, compactando los rangos [min, max] y maximizando RLE.'
        },
        {
          id: 'c',
          text: 'Concatenar `store_id` y `status` dentro de un texto JSON en una sola columna.',
          correct: false,
          feedback: 'Incorrecto. Guardar un blob JSON obliga a parsear texto en cada fila e impide usar los zone maps nativos de cada columna.'
        },
        {
          id: 'd',
          text: 'Reducir el tamaño de cada Row Group a 5 filas.',
          correct: false,
          feedback: 'Incorrecto. Row Groups de 5 filas inflan el Footer de metadatos y arruinan la compresión y la ejecución vectorizada.'
        }
      ],
      explanation: 'Escribir el archivo Parquet con ORDER BY por las columnas de filtrado frecuente agrupa los valores idénticos en páginas consecutivas, logrando que el Page Index descarte páginas enteras sin necesidad de dividir el archivo en miles de carpetas.'
    },
    {
      id: 'chk-target-file-size',
      type: 'mcq',
      prompt: '¿Cuál es el rango de tamaño objetivo recomendado para los archivos Parquet individuales en un lago de datos analítico sobre almacenamiento de objetos (S3, GCS, ADLS)?',
      options: [
        {
          id: 'a',
          text: 'Entre 4 KB y 64 KB por archivo para minimizar el tamaño de cada descarga HTTP.',
          correct: false,
          feedback: 'Incorrecto. Archivos de pocos kilobytes sufren el antipatrón de archivos pequeños.'
        },
        {
          id: 'b',
          text: 'Entre 128 MB y 512 MB (o hasta 1 GB) por archivo, permitiendo varios Row Groups densos y lecturas paralelas por rangos de bytes.',
          correct: true,
          feedback: 'Correcto. Ese tamaño amortiza la latencia HTTP y ofrece suficiente volumen para diccionarios, RLE y lecturas paralelas.'
        },
        {
          id: 'c',
          text: 'Exactamente un archivo de 50 TB sin dividir para toda la historia de la empresa.',
          correct: false,
          feedback: 'Incorrecto. Un único archivo monolítico gigante impide la escritura incremental y complica la compactación.'
        },
        {
          id: 'd',
          text: 'Un archivo por cada fila insertada para garantizar aislamiento transaccional.',
          correct: false,
          feedback: 'Incorrecto. Un archivo por fila hace inviable cualquier consulta analítica.'
        }
      ],
      explanation: 'Los archivos Parquet de entre 128 MB y 512 MB (o alrededor de 100 000 a 1 000 000 de filas) equilibran el paralelismo de lectura, la eficacia de los diccionarios y la baja sobrecarga de llamadas a la API del almacenamiento de objetos.'
    }
  ],

  roleNotes: {
    de: 'Como persona de Ingeniería de Datos, limita el particionado Hive a claves temporales gruesas (año o mes) y añade un paso explícito de ORDER BY por las columnas de filtrado frecuente antes de ejecutar COPY ... TO en Parquet.',
    da: 'En Análisis de Datos, cuando leas tablas particionadas con DuckDB (`read_parquet(\'orders/*/*.parquet\', hive_partitioning = true)`), incluye siempre las columnas de carpeta en el WHERE para activar partition pruning.',
    bi: 'En Business Intelligence, si un dashboard sobre el data lake tarda varios segundos en arrancar pese a consultar pocos megabytes, audita cuántos archivos Parquet componen la tabla: compactar miles de ficheros pequeños suele reducir la latencia de segundos a milisegundos.'
  },

  summary: [
    'El particionado estilo Hive permite omitir directorios enteros, pero debe reservarse a columnas de baja cardinalidad.',
    'Particionar por columnas de alta cardinalidad provoca el antipatrón de archivos pequeños, donde la latencia HTTP supera al escaneo.',
    'Escribir archivos Parquet con ORDER BY por las columnas de filtrado frecuente estrecha los zone maps y alarga las rachas RLE.'
  ],

  flashcards: [
    {
      id: 'fc-de2-05-a',
      front: '¿Qué es el particionado estilo Hive (Hive partitioning)?',
      back: 'Es una convención de directorios clave=valor/ que permite a los motores analíticos aplicar partition pruning y omitir carpetas completas según el filtro WHERE.'
    },
    {
      id: 'fc-de2-05-b',
      front: '¿Qué causa el problema de los archivos pequeños (small files problem) en un lago de datos?',
      back: 'Particionar por columnas de alta cardinalidad o escribir micro-lotes sin compactación, generando miles de archivos donde la latencia HTTP y los footers superan a la lectura útil.'
    },
    {
      id: 'fc-de2-05-c',
      front: '¿Por qué ordenar físicamente (ORDER BY) al escribir un archivo Parquet acelera las consultas?',
      back: 'Porque agrupa los valores similares en páginas contiguas, estrechando los estadísticos [min, max] (zone maps) y alargando las rachas de valores repetidos para RLE.'
    }
  ],

  sources: [
    {
      title: 'DuckDB Documentation — Hive Partitioning and Partitioned Writes',
      url: 'https://duckdb.org/docs/stable/data/partitioning/hive_partitioning.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Lectura y escritura de particiones estilo Hive con hive_partitioning=true y PARTITION_BY.'
    },
    {
      title: 'DuckDB Documentation — Parquet Tips & Row Group Sizing',
      url: 'https://duckdb.org/docs/stable/data/parquet/tips.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Impacto del tamaño de archivo, ROW_GROUP_SIZE y ordenamiento previo (ORDER BY) sobre zone maps y compresión.'
    },
    {
      title: 'Apache Parquet — File Format and Page Index Configuration',
      url: 'https://parquet.apache.org/docs/file-format/configurations/',
      publisher: 'Apache Software Foundation',
      accessed: '2026-10-29',
      supports: 'Recomendaciones de tamaño de bloque y página para amortizar metadatos y optimizar lecturas en almacenamiento distribuido.'
    }
  ],

  aiNotes: 'En `orders.parquet` (18 000 filas), particionar por año genera 3 particiones (6 000 filas/año) y por `(order_year, region)` en completados genera 12 particiones, mientras que por día y tienda genera 8 756 archivos (2.06 filas/archivo). En `events.parquet` (65 000 filas), particionar por día y cliente genera 57 644 archivos (1.13 filas/archivo), frente a 3 particiones anuales.',

  relatedLessons: [
    'de2-formatos-01-columnar-parquet',
    'de2-formatos-03-duckdb-polars-marimo',
    'de2-formatos-04-codificacion-compresion-zstd'
  ]
};

export default lesson;
