const lesson = {
  id: 'de4-plataforma-01-spark-4-shuffles-skew-ansi',
  moduleId: 'de4-plataforma',
  tracks: ['de'],
  level: 4,
  order: 1,
  title: 'Apache Spark 4.0: particiones, shuffles, skew y modo ANSI',
  subtitle: 'Apache Spark 4.0: particiones, shuffles, sesgo de datos (data skew) y modo ANSI',
  minutes: 25,
  prerequisites: [
    'de2-formatos-05-particionado-archivos-pequenos',
    'de3-lakehouse-01-iceberg-v3-medallion',
  ],
  contentVersion: 2,

  hook: 'El trabajo nocturno de atribución en Mercado Brisa procesa 65 000 eventos en diez segundos hasta llegar al avance del 99 %. En ese instante, 31 de las 32 tareas del clúster terminan y quedan ociosas. Un único ejecutor tarda quince minutos más y satura su disco local por derrame de memoria. Al inspeccionar la tabla events, notas que 6 715 sesiones anónimas carecen de identificador de cliente y caen en la misma partición. ¿Cómo rediseñas el intercambio en red y evitas conversiones silenciosas bajo Apache Spark 4.0?',

  objectives: [
    'Distinguir entre transformaciones estrechas y anchas en Apache Spark 4.0 para identificar qué operaciones disparan un intercambio físico por red (shuffle).',
    'Diagnosticar y mitigar el sesgo de datos en particiones (data skew) combinando ejecución adaptativa de consultas (AQE), difusión de tablas pequeñas y salado determinista de llaves (salting).',
    'Aplicar las reglas del modo ANSI SQL activado por defecto en Spark 4.0 utilizando funciones seguras como TRY_CAST y NULLIF para impedir fallos en tiempo de ejecución o nulos silenciosos.',
  ],

  sections: [
    {
      id: 'anatomia-particiones-shuffle',
      heading: 'Transformaciones estrechas frente al costo físico del shuffle',
      body: 'Un motor distribuido como **Apache Spark 4.0** divide cada tabla en particiones en memoria asignadas a los núcleos de los ejecutores. Las transformaciones estrechas (*narrow transformations*), como proyectar columnas con `SELECT` o filtrar filas con `WHERE`, se ejecutan en cada nodo sin mover bytes por la red. En cambio, las transformaciones anchas (*wide transformations*), como `GROUP BY`, `DISTINCT`, `ORDER BY` o un cruce entre dos tablas grandes, requieren agrupar registros que comparten la misma llave aunque residan en máquinas distintas.\n\nEsta redistribución física se denomina **shuffle**. En la etapa de escritura (*map side*), cada tarea ordena sus registros por el resumen de la llave, los serializa y escribe archivos intermedios en el disco local del ejecutor. Luego, en la etapa de lectura (*reduce side*), las tareas siguientes descargan por red los segmentos asignados a su partición. Si los datos de una partición superan la memoria disponible, el motor vuelca páginas a disco (*disk spill*). Cuando cruzas una tabla grande como `orders` (18 000 filas) con una dimensión pequeña como `stores` (14 filas), un **Broadcast Hash Join** envía una copia de `stores` a cada ejecutor y evita redistribuir la tabla grande.',
      example: {
        language: 'sql',
        code: `SELECT s.store_type,
       COUNT(DISTINCT s.store_id) AS num_stores,
       COUNT(o.order_id) AS total_orders
FROM stores s
JOIN orders o ON s.store_id = o.store_id
GROUP BY s.store_type
ORDER BY total_orders DESC;`,
        expectedOutput: [
          { store_type: 'retail', num_stores: 8, total_orders: 10286 },
          { store_type: 'flagship', num_stores: 3, total_orders: 4500 },
          { store_type: 'warehouse', num_stores: 3, total_orders: 3214 },
        ],
      },
    },
    {
      id: 'sesgo-datos-aqe-salting',
      heading: 'Sesgo de datos (data skew), AQE y salado de llaves',
      body: 'El particionado por resumen de llave asume que los valores se distribuyen de manera uniforme. En comercios reales ocurre lo contrario. En la tabla `events` de Mercado Brisa, 6 715 de los 65 000 eventos corresponden a sesiones anónimas donde `customer_id` es nulo. Mientras tanto, la mediana por cliente identificado es de apenas 25 eventos. Si agrupas o cruzas reemplazando nulos por una etiqueta única como `\'ANON\'`, una sola tarea recibe 268.6 veces más registros que la mediana del clúster. Esto produce una tarea rezagada (*straggler*) que frena toda la etapa.\n\nEn **Apache Spark 4.0**, la **ejecución adaptativa de consultas (AQE)** viene habilitada por defecto (`spark.sql.adaptive.enabled = true`). Al concluir cada escritura de *shuffle*, AQE lee las estadísticas reales en bytes de los archivos intermedios. Con esos datos aplica tres mejoras: fusiona particiones pequeñas (`coalescePartitions`), convierte cruces a difusión si un filtro redujo el tamaño de una tabla, y divide particiones sesgadas en sub-particiones paralelas (`skewJoin`). Cuando el sesgo proviene de una agregación masiva o de valores nulos, el ingeniero complementa AQE añadiendo un sufijo numérico entre `0` y `N - 1` (**salting**) para repartir la llave caliente entre varios ejecutores.',
      example: {
        language: 'sql',
        code: `WITH part_counts AS (
  SELECT COALESCE(CAST(customer_id AS VARCHAR), 'ANON') AS partition_key,
         COUNT(*) AS num_events
  FROM events
  GROUP BY 1
)
SELECT MAX(num_events) AS max_part_rows,
       CAST(MEDIAN(num_events) AS INTEGER) AS median_part_rows,
       ROUND(1.0 * MAX(num_events) / MEDIAN(num_events), 1) AS skew_factor
FROM part_counts;`,
        expectedOutput: [
          { max_part_rows: 6715, median_part_rows: 25, skew_factor: 268.6 },
        ],
      },
    },
    {
      id: 'modo-ansi-spark-4',
      heading: 'Modo ANSI SQL por defecto en Spark 4.0 y coerción segura',
      body: 'Hasta la rama 3.x de Spark, el motor operaba por defecto en un modo permisivo heredado de Hive. Si dividías un importe entre cero, convertías la cadena `\'N/A\'` a entero o desbordabas un número, Spark devolvía silenciosamente `NULL`. Ese comportamiento ocultaba errores de calidad en las capas Bronze y Silver. Como consecuencia, los nulos artificiales llegaban sin alerta hasta los tableros financieros.\n\nEn **Apache Spark 4.0**, el parámetro `spark.sql.ansi.enabled` cambia su valor por defecto a `true`. Bajo el **modo ANSI SQL estricto**, cualquier desbordamiento aritmético, división por cero o conversión explícita fallida (`CAST(\'abc\' AS INT)`) detiene la consulta y lanza una excepción en tiempo de ejecución. No debes desactivar `spark.sql.ansi.enabled` como atajo de migración. Para construir tuberías resilientes bajo este contrato, emplea `TRY_CAST(columna AS tipo)` cuando limpies texto crudo que pueda contener basura. Asimismo, envuelve todo denominador con `NULLIF(denominador, 0)` en tus cálculos de tasas y márgenes.',
      example: {
        language: 'sql',
        code: `SELECT device_type,
       COUNT(DISTINCT order_id) AS total_orders,
       ROUND(SUM(discount_usd) / NULLIF(SUM(subtotal_usd), 0) * 100, 2) AS discount_pct
FROM orders
GROUP BY device_type
ORDER BY total_orders DESC;`,
        expectedOutput: [
          { device_type: 'desktop', total_orders: 7716, discount_pct: 0.88 },
          { device_type: 'mobile', total_orders: 6857, discount_pct: 1.29 },
          { device_type: 'pos_tienda', total_orders: 3427, discount_pct: 1.06 },
        ],
      },
    },
  ],

  workedExample: {
    title: 'Mitigación de sesgo por sesiones anónimas y agregación ANSI en Mercado Brisa',
    description: 'El equipo de plataforma de Mercado Brisa necesita auditar el sesgo de particionado por cliente en la tabla events (65 000 filas), comprobar cuánto disminuye el factor de sesgo al aplicar salado determinista (salting) en 8 cubetas sobre los eventos anónimos y calcular tasas de descuento por dispositivo respetando el modo ANSI SQL.',
    audit: 'Dividir las llaves nulas en 8 cubetas reduce la partición máxima de 6 715 a 869 filas (bajando el factor de sesgo de 268.6 a 34.8), mientras que NULLIF protege el cálculo de descuentos frente a divisiones por cero.',
    steps: [
      {
        label: 'Paso 1: Medir el factor de sesgo inicial al agrupar eventos por cliente',
        explanation: 'Calculamos cuántos eventos caen en cada partición lógica si agrupamos por customer_id convirtiendo los nulos en la etiqueta ANON. Comparamos la partición más pesada contra la mediana para obtener el factor de sesgo.',
        code: `WITH part_counts AS (
  SELECT COALESCE(CAST(customer_id AS VARCHAR), 'ANON') AS partition_key,
         COUNT(*) AS num_events
  FROM events
  GROUP BY 1
)
SELECT MAX(num_events) AS max_part_rows,
       CAST(MEDIAN(num_events) AS INTEGER) AS median_part_rows,
       ROUND(1.0 * MAX(num_events) / MEDIAN(num_events), 1) AS skew_factor
FROM part_counts;`,
        expectedOutput: [
          { max_part_rows: 6715, median_part_rows: 25, skew_factor: 268.6 },
        ],
      },
      {
        label: 'Paso 2: Mitigar la partición caliente aplicando salting en 8 cubetas',
        explanation: 'Distribuimos los registros donde customer_id es nulo en 8 sub-llaves deterministas (ANON_0 a ANON_7) usando el módulo del hash de event_id. Así repartimos la carga pesada entre 8 tareas paralelas sin alterar las llaves de los clientes identificados.',
        code: `WITH salted AS (
  SELECT CASE
           WHEN customer_id IS NULL THEN 'ANON_' || CAST(ABS(HASH(event_id)) % 8 AS VARCHAR)
           ELSE CAST(customer_id AS VARCHAR)
         END AS salted_key,
         COUNT(*) AS num_events
  FROM events
  GROUP BY 1
)
SELECT MAX(num_events) AS max_salted_rows,
       CAST(MEDIAN(num_events) AS INTEGER) AS median_salted_rows,
       ROUND(1.0 * MAX(num_events) / MEDIAN(num_events), 1) AS new_skew_factor
FROM salted;`,
        expectedOutput: [
          { max_salted_rows: 869, median_salted_rows: 25, new_skew_factor: 34.8 },
        ],
      },
      {
        label: 'Paso 3: Calcular métricas agregadas compatibles con el modo ANSI de Spark 4.0',
        explanation: 'Calculamos el porcentaje de descuento sobre el subtotal en orders agrupado por device_type, protegiendo la división mediante NULLIF.',
        code: `SELECT device_type,
       COUNT(DISTINCT order_id) AS total_orders,
       ROUND(SUM(discount_usd) / NULLIF(SUM(subtotal_usd), 0) * 100, 2) AS discount_pct
FROM orders
GROUP BY device_type
ORDER BY total_orders DESC;`,
        expectedOutput: [
          { device_type: 'desktop', total_orders: 7716, discount_pct: 0.88 },
          { device_type: 'mobile', total_orders: 6857, discount_pct: 1.29 },
          { device_type: 'pos_tienda', total_orders: 3427, discount_pct: 1.06 },
        ],
      },
    ],
  },

  checks: [
    {
      id: 'de4-p01-check-1',
      type: 'mcq',
      prompt: 'En Apache Spark 4.0 con configuración por defecto, ¿qué ocurre cuando una consulta ejecuta CAST(\'sin_monto\' AS INT) o divide una métrica entre cero?',
      options: [
        {
          id: 'a',
          text: 'El motor reemplaza el resultado por NULL de forma silenciosa y continúa ejecutando la etapa.',
          correct: false,
          feedback: 'Incorrecto. Ese era el comportamiento heredado de Hive cuando spark.sql.ansi.enabled estaba desactivado en versiones anteriores.',
        },
        {
          id: 'b',
          text: 'El motor lanza una excepción en tiempo de ejecución y aborta la consulta porque spark.sql.ansi.enabled es true por defecto.',
          correct: true,
          feedback: 'Correcto. Spark 4.0 activa el modo ANSI por defecto para impedir que errores aritméticos o de tipos pasen desapercibidos como valores nulos.',
        },
        {
          id: 'c',
          text: 'AQE intercepta el fallo al final del shuffle y convierte automáticamente la columna a tipo VARCHAR.',
          correct: false,
          feedback: 'Incorrecto. AQE optimiza particiones y estrategias de cruce según estadísticas de tamaño en bytes, pero no altera tipos de datos ni silencia errores ANSI.',
        },
        {
          id: 'd',
          text: 'El registro se descarta automáticamente de la partición sin detener el trabajo ni dejar rastro en el catálogo.',
          correct: false,
          feedback: 'Incorrecto. Spark no elimina filas con errores de conversión de forma implícita; para tolerar fallos sin abortar debes usar explícitamente TRY_CAST.',
        },
      ],
      explanation: 'En Apache Spark 4.0 el modo ANSI (spark.sql.ansi.enabled=true) viene activo de fábrica. Las divisiones entre cero y conversiones inválidas con CAST lanzan excepciones explícitas a menos que se utilicen funciones seguras como NULLIF o TRY_CAST.',
    },
    {
      id: 'de4-p01-check-2',
      type: 'order',
      prompt: 'Ordena cronológicamente los pasos que ejecuta Adaptive Query Execution (AQE) al optimizar una consulta con shuffle en Spark 4.0:',
      items: [
        'Ejecutar las tareas de la etapa map y escribir los archivos intermedios de shuffle en disco local.',
        'Recolectar estadísticas reales de conteo de bytes y filas generadas por cada partición de shuffle.',
        'Reevaluar el plan físico: fusionar particiones pequeñas, dividir particiones con sesgo o cambiar Sort-Merge Join a Broadcast Join.',
        'Lanzar las tareas de la etapa reduce con el número y tamaño de particiones ya ajustados.',
      ],
      correctOrder: ['it-0', 'it-1', 'it-2', 'it-3'],
      explanation: 'AQE aprovecha el límite natural de cada etapa de shuffle: primero se materializan los archivos intermedios de map, luego el coordinador lee sus tamaños reales, reoptimiza el plan físico y finalmente lanza la etapa reduce.',
    },
    {
      id: 'de4-p01-check-3',
      type: 'fill-code',
      prompt: 'Escribe el nombre de la función SQL estándar que convierte de forma segura un texto a entero devolviendo NULL cuando falla en lugar de abortar la consulta bajo modo ANSI:',
      code: `SELECT __________(codigo_postal_raw AS INTEGER) AS codigo_postal
FROM ventas_crudas;`,
      template: `SELECT {{b1}}(codigo_postal_raw AS INTEGER) AS codigo_postal FROM ventas_crudas;`,
      placeholder: 'Escribe el nombre de la función (ej. TRY_CAST)',
      acceptedAnswers: ['TRY_CAST', 'try_cast'],
      blanks: [
        {
          id: 'b1',
          accepted: ['TRY_CAST', 'try_cast'],
        },
      ],
      explanation: 'TRY_CAST devuelve NULL cuando la cadena no representa un entero válido en lugar de abortar la consulta con una excepción de conversión bajo el modo ANSI de Spark 4.0 y DuckDB.',
    },
  ],

  practice: {
    type: 'sql',
    title: 'Diagnóstico de sesgo de carga por formato de tienda',
    language: 'sql',
    prompt: 'Analiza el sesgo de volumen al cruzar stores, orders y order_items agrupando por store_type. Calcula para cada store_type: el total de órdenes distintas (total_orders), el total de líneas de pedido (total_items), el porcentaje que representa sobre el total global de líneas redondeado a 2 decimales (pct_items) y la razón de sesgo respecto al promedio de líneas entre los tipos de tienda redondeada a 2 decimales (skew_ratio_vs_mean). Ordena de mayor a menor por total_items.',
    starterCode: `WITH store_load AS (
  SELECT s.store_type,
         COUNT(DISTINCT o.order_id) AS total_orders,
         COUNT(oi.order_item_id) AS total_items
  FROM stores s
  JOIN orders o ON s.store_id = o.store_id
  JOIN order_items oi ON o.order_id = oi.order_id
  GROUP BY s.store_type
)
SELECT store_type,
       total_orders,
       total_items,
       -- Completa pct_items y skew_ratio_vs_mean usando funciones de ventana
       0.0 AS pct_items,
       0.0 AS skew_ratio_vs_mean
FROM store_load
ORDER BY total_items DESC;`,
    expected: `WITH store_load AS (
  SELECT s.store_type,
         COUNT(DISTINCT o.order_id) AS total_orders,
         COUNT(oi.order_item_id) AS total_items
  FROM stores s
  JOIN orders o ON s.store_id = o.store_id
  JOIN order_items oi ON o.order_id = oi.order_id
  GROUP BY s.store_type
)
SELECT store_type,
       total_orders,
       total_items,
       ROUND(100.0 * total_items / SUM(total_items) OVER (), 2) AS pct_items,
       ROUND(1.0 * total_items / AVG(total_items) OVER (), 2) AS skew_ratio_vs_mean
FROM store_load
ORDER BY total_items DESC;`,
    orderMatters: true,
    hints: [
      'En el CTE store_load ya tienes total_orders y total_items por store_type. En el SELECT externo usa SUM(total_items) OVER () para obtener el total global de líneas.',
      'Calcula pct_items como ROUND(100.0 * total_items / SUM(total_items) OVER (), 2).',
      'Calcula skew_ratio_vs_mean como ROUND(1.0 * total_items / AVG(total_items) OVER (), 2) y mantén ORDER BY total_items DESC.',
    ],
    solution: `WITH store_load AS (
  SELECT s.store_type,
         COUNT(DISTINCT o.order_id) AS total_orders,
         COUNT(oi.order_item_id) AS total_items
  FROM stores s
  JOIN orders o ON s.store_id = o.store_id
  JOIN order_items oi ON o.order_id = oi.order_id
  GROUP BY s.store_type
)
SELECT store_type,
       total_orders,
       total_items,
       ROUND(100.0 * total_items / SUM(total_items) OVER (), 2) AS pct_items,
       ROUND(1.0 * total_items / AVG(total_items) OVER (), 2) AS skew_ratio_vs_mean
FROM store_load
ORDER BY total_items DESC;`,
    solutionExplanation: 'El CTE resume las órdenes y líneas por store_type. En la consulta principal, las funciones de ventana SUM(total_items) OVER () y AVG(total_items) OVER () permiten medir que el formato retail concentra el 56.13 % de todas las líneas (23 573 ítems), lo que representa 1.68 veces la carga media por categoría de tienda.',
    expectedOutputTable: [
      { store_type: 'retail', total_orders: 10286, total_items: 23573, pct_items: 56.13, skew_ratio_vs_mean: 1.68 },
      { store_type: 'warehouse', total_orders: 3214, total_items: 9427, pct_items: 22.45, skew_ratio_vs_mean: 0.67 },
      { store_type: 'flagship', total_orders: 4500, total_items: 9000, pct_items: 21.43, skew_ratio_vs_mean: 0.64 },
    ],
  },

  roleNotes: {
    de: 'Como Ingeniero de Datos debes vigilar las métricas de Shuffle Read/Write y Spill (Memory/Disk) en la interfaz de Spark. Antes de aumentar el tamaño del clúster, verifica que AQE esté activo, difunde dimensiones menores a 10–50 MB y aplica salting o filtrado previo sobre llaves nulas.',
    da: 'En tus consultas analíticas sobre motores distribuidos, evita agrupar o cruzar directamente por columnas con alta proporción de nulos o comodines como "DESCONOCIDO". Envuelve los denominadores en NULLIF y usa TRY_CAST para que tus cuadernos no aborten bajo el modo ANSI de Spark 4.0.',
    bi: 'Cuando diseñes modelos semánticos conectados a clústeres Spark SQL o Databricks, ten presente que los filtros aplicados antes del cruce permiten a AQE convertir un Sort-Merge Join en un Broadcast Join en tiempo de ejecución, reduciendo la latencia de refresco de tus tableros.',
  },

  summary: [
    'Un shuffle redistribuye datos por red y disco local cuando una operación ancha como GROUP BY o JOIN requiere agrupar registros por llave.',
    'El sesgo de datos (data skew) concentra un volumen desproporcionado en pocas particiones y genera tareas rezagadas que frenan todo el trabajo.',
    'Adaptive Query Execution (AQE) reoptimiza consultas en tiempo de ejecución fusionando particiones pequeñas, dividiendo particiones sesgadas y difundiendo tablas filtradas.',
    'Apache Spark 4.0 activa el modo ANSI SQL por defecto, lanzando excepciones ante divisiones por cero o conversiones inválidas salvo que uses NULLIF y TRY_CAST.',
  ],

  flashcards: [
    {
      id: 'de4-plataforma-01-spark-4-shuffles-skew-ansi-fc-1',
      front: '¿Qué diferencia física existe entre una transformación estrecha (narrow) y una ancha (wide) en Apache Spark?',
      back: 'En una transformación estrecha cada partición de salida se calcula en memoria local a partir de una sola partición de entrada; en una ancha los datos deben serializarse, escribirse en disco y redistribuirse por red mediante un shuffle.',
    },
    {
      id: 'de4-plataforma-01-spark-4-shuffles-skew-ansi-fc-2',
      front: '¿Qué tres optimizaciones aplica Adaptive Query Execution (AQE) al finalizar una etapa de shuffle?',
      back: 'Fusiona particiones post-shuffle pequeñas (coalescePartitions), convierte cruces a Broadcast Hash Join cuando una tabla resulta pequeña tras filtrar y divide particiones sesgadas en sub-tareas (skewJoin).',
    },
    {
      id: 'de4-plataforma-01-spark-4-shuffles-skew-ansi-fc-3',
      front: '¿En qué consiste la técnica de salado de llaves (key salting) para mitigar el data skew?',
      back: 'En añadir un sufijo entero entre 0 y N-1 a las llaves muy frecuentes en la tabla grande (y replicar esas llaves N veces en la tabla pequeña si hay un cruce) para repartir su procesamiento entre N particiones.',
    },
    {
      id: 'de4-plataforma-01-spark-4-shuffles-skew-ansi-fc-4',
      front: '¿Qué cambia en Apache Spark 4.0 respecto a la propiedad spark.sql.ansi.enabled?',
      back: 'Pasa a estar activada (true) por defecto: las divisiones por cero, desbordamientos numéricos y conversiones inválidas con CAST lanzan excepciones en vez de devolver NULL silenciosamente.',
    },
  ],

  glossaryTerms: [
    'spark-shuffle-intercambio',
    'sesgo-datos-data-skew',
    'spark-aqe-adaptativo',
    'spark-modo-ansi',
  ],

  sources: [
    {
      title: 'Spark SQL, DataFrames and Datasets Guide — Performance Tuning',
      url: 'https://spark.apache.org/docs/latest/sql-performance-tuning.html',
      publisher: 'Apache Software Foundation',
      accessed: '2026-10-29',
      supports: 'Funcionamiento de Adaptive Query Execution (AQE), coalescencia de particiones post-shuffle, Broadcast Hash Join y manejo de Skew Join.',
    },
    {
      title: 'ANSI Compliance in Spark SQL',
      url: 'https://spark.apache.org/docs/latest/sql-ref-ansi-compliance.html',
      publisher: 'Apache Software Foundation',
      accessed: '2026-10-29',
      supports: 'Activación por defecto de spark.sql.ansi.enabled en Apache Spark 4.0, reglas de coerción de tipos y excepciones aritméticas.',
    },
    {
      title: 'Tuning Spark — Data Serialization, Memory Management and Shuffle Behavior',
      url: 'https://spark.apache.org/docs/latest/tuning.html',
      publisher: 'Apache Software Foundation',
      accessed: '2026-10-29',
      supports: 'Mecánica de escritura y lectura de archivos de shuffle, serialización y derrame a disco local (spill).',
    },
    {
      title: 'Spark Configuration — Runtime SQL and Shuffle Parameters',
      url: 'https://spark.apache.org/docs/latest/configuration.html',
      publisher: 'Apache Software Foundation',
      accessed: '2026-10-29',
      supports: 'Parámetros de configuración de particiones de shuffle, tamaño objetivo de partición en AQE y umbral de difusión.',
    },
  ],

  aiNotes: 'Al guiar sobre Spark 4.0, enfatiza por qué los 6 715 eventos con customer_id nulo en Mercado Brisa producen un factor de sesgo de 268.6x si se agrupan bajo una misma etiqueta. Guía al estudiante para usar funciones de ventana (SUM y AVG OVER ()) en la práctica SQL y recuerda el uso de NULLIF y TRY_CAST bajo modo ANSI.',
};

export default lesson;
