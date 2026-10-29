export const lesson = {
  id: 'de3-lakehouse-02-delta-lake-uniform',
  moduleId: 'de3-lakehouse',
  tracks: ['de'],
  level: 3,
  order: 2,
  title: 'Delta Lake 4.0 y Delta UniForm en el Lakehouse',
  subtitle: 'Delta Lake 4.0 e interoperabilidad de formatos mediante Delta UniForm',
  minutes: 25,
  contentVersion: 1,
  needsReview: false,
  prerequisites: ['de3-lakehouse-01-iceberg-v3-medallion'],
  hook: 'En Mercado Brisa, el equipo de ingeniería procesa las ventas globales utilizando pipelines en Delta Lake, pero el área de ciencia de datos adquirió un motor federado que exige leer catálogos Apache Iceberg. Históricamente, soportar ambos estándares obligaba a duplicar terabytes de archivos Parquet y mantener trabajos nocturnos de copia propensos a desfases. ¿Cómo permite Delta Lake 4.0 con Delta UniForm y Liquid Clustering exponer un único conjunto de archivos Parquet a lectores Delta e Iceberg simultáneamente mientras elimina la fragmentación de particiones?',
  objectives: [
    'Explicar la estructura del registro transaccional _delta_log y cómo Delta Universal Format (UniForm) traduce commits hacia metadatos Iceberg sin duplicar archivos Parquet.',
    'Comparar el particionado físico tipo Hive y Z-ORDER frente a Liquid Clustering basado en curvas Hilbert para resolver el problema de archivos pequeños.',
    'Auditar mediante SQL la fragmentación de particiones diarias y el flujo de cambios (Change Data Feed) sobre las tablas operativas de Mercado Brisa.'
  ],
  sections: [
    {
      id: 'delta-log-protocolo-uniform',
      heading: 'El protocolo _delta_log y la interoperabilidad con Delta UniForm',
      body: 'Tanto **Delta Lake** como **Apache Iceberg** almacenan sus filas dentro de archivos columnares Parquet inmutables. Su diferencia radica en cómo organizan los metadatos. En Delta Lake, cada cambio se registra en el directorio `_delta_log` mediante archivos JSON secuenciales (`000000.json`, `000001.json`). Esos archivos contienen acciones atómicas: `add`, `remove`, `metaData` y `protocol`. Periódicamente, el motor compacta el historial en un punto de control (*checkpoint*) en formato Parquet.\n\n**Delta Universal Format (UniForm)** aprovecha que la capa de datos Parquet es común a ambos formatos. Al habilitar `delta.universalFormat.enabledFormats = \'iceberg\'` junto con el protocolo **`IcebergCompatV2`**, cada transacción confirmada en `_delta_log` dispara un proceso asíncrono. Ese proceso genera el árbol `metadata.json` y los manifiestos Avro de Iceberg.\n\nPara lograr esta equivalencia, `IcebergCompatV2` activa obligatoriamente el mapeo de columnas por identificador (`delta.columnMapping.mode = \'name\'`). Así garantiza que cada columna Parquet posea un `field-id` inmutable.',
      interactive: {
        component: 'isolation-timeline',
        caption: 'Sincronización de commits en _delta_log hacia metadatos Iceberg mediante Delta UniForm.'
      },
      example: {
        language: 'sql',
        code: `SELECT
  EXTRACT(YEAR FROM order_ts) AS commit_year,
  COUNT(*) AS total_orders,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed_orders,
  COUNT(*) FILTER (WHERE status IN ('refunded', 'cancelled')) AS mutated_orders,
  ROUND(SUM(total_usd) FILTER (WHERE status = 'completed'), 2) AS completed_usd
FROM orders
GROUP BY EXTRACT(YEAR FROM order_ts)
ORDER BY commit_year;`,
        expectedOutput: [
          { commit_year: 2023, total_orders: 2443, completed_orders: 1981, mutated_orders: 359, completed_usd: 851117.35 },
          { commit_year: 2024, total_orders: 7923, completed_orders: 6497, mutated_orders: 1113, completed_usd: 2731516.5 },
          { commit_year: 2025, total_orders: 7634, completed_orders: 6282, mutated_orders: 1048, completed_usd: 2686828.57 }
        ]
      }
    },
    {
      id: 'liquid-clustering-curvas-hilbert',
      heading: 'Liquid Clustering frente a particiones Hive y Z-ORDER',
      body: 'El particionado físico al estilo Hive crea un directorio por cada combinación de valores de partición. Si una tabla se particiona por país y fecha, los países con menos sucursales producen miles de archivos Parquet de pocos kilobytes (*small file problem*). Esto multiplica las llamadas de red al listado de objetos y degrada la lectura.\n\nAntes de Delta Lake 4.0, la alternativa consistía en ejecutar `OPTIMIZE ... ZORDER BY`. Sin embargo, `Z-ORDER` tenía dos limitaciones severas. Primero, obligaba a reescribir todos los archivos dentro de una partición en cada ejecución. Segundo, exigía reescribir toda la tabla si cambiaban las columnas de filtrado.\n\n**Liquid Clustering** (`CLUSTER BY (country_code, order_date)`) reemplaza tanto a las particiones físicas como a `Z-ORDER`. Utiliza **curvas espaciales de Hilbert** para agrupar datos multidimensionales en bloques balanceados (*Z-cubes*). Su operación es incremental: al ejecutar `OPTIMIZE`, solo reagrupa los archivos recién ingresados sin tocar los bloques históricos.',
      example: {
        language: 'sql',
        code: `SELECT
  s.country_code,
  COUNT(DISTINCT s.store_id) AS store_count,
  COUNT(DISTINCT o.order_date) AS active_days,
  COUNT(o.order_id) AS total_orders,
  ROUND(COUNT(o.order_id) * 1.0 / COUNT(DISTINCT s.store_id), 2) AS avg_orders_per_store
FROM stores s
JOIN orders o ON s.store_id = o.store_id
WHERE o.status = 'completed'
GROUP BY s.country_code
ORDER BY total_orders DESC, s.country_code ASC;`,
        expectedOutput: [
          { country_code: 'CO', store_count: 3, active_days: 889, total_orders: 2812, avg_orders_per_store: 937.33 },
          { country_code: 'AR', store_count: 1, active_days: 870, total_orders: 2811, avg_orders_per_store: 2811 },
          { country_code: 'ES', store_count: 3, active_days: 895, total_orders: 2811, avg_orders_per_store: 937 },
          { country_code: 'CL', store_count: 2, active_days: 840, total_orders: 2109, avg_orders_per_store: 1054.5 },
          { country_code: 'PE', store_count: 1, active_days: 832, total_orders: 2109, avg_orders_per_store: 2109 },
          { country_code: 'MX', store_count: 4, active_days: 811, total_orders: 2108, avg_orders_per_store: 527 }
        ]
      }
    },
    {
      id: 'change-data-feed-deletion-vectors',
      heading: 'Propagación incremental con Change Data Feed y Deletion Vectors',
      body: 'En una arquitectura Medallion sobre Delta Lake, recalcular la capa Oro leyendo todos los registros de Plata en cada lote desperdicia cómputo. Al activar `delta.enableChangeDataFeed = true`, el motor registra el flujo de cambios fila por fila mediante el **Change Data Feed (CDF)**.\n\nCada operación `INSERT`, `UPDATE`, `DELETE` o `MERGE` expone tres metadatos adicionales al consultar versiones. Estos campos son `_change_type` (con valores `insert`, `update_preimage`, `update_postimage` o `delete`), `_commit_version` y `_commit_timestamp`. De igual modo que en Iceberg v3, Delta Lake soporta **Deletion Vectors** en formato Roaring bitmap. Así los `UPDATE` y `DELETE` marcan filas borradas sin reescribir el archivo Parquet completo.\n\nEn **Mercado Brisa**, la tabla `customer_changes` refleja las transiciones de categoría de fidelidad (`bronce`, `plata`, `oro` y `platino`) de sus 2.400 clientes. Mediante CDF, el pipeline propaga únicamente las 1.700 transiciones históricas y las 2.400 versiones activas hacia la capa Oro.',
      example: {
        language: 'sql',
        code: `SELECT
  tier,
  COUNT(*) AS total_cdf_versions,
  COUNT(*) FILTER (WHERE is_current = false) AS historical_closed_versions,
  COUNT(*) FILTER (WHERE is_current = true) AS active_current_versions
FROM customer_changes
GROUP BY tier
ORDER BY total_cdf_versions DESC;`,
        expectedOutput: [
          { tier: 'bronce', total_cdf_versions: 1667, historical_closed_versions: 1300, active_current_versions: 367 },
          { tier: 'plata', total_cdf_versions: 1216, historical_closed_versions: 400, active_current_versions: 816 },
          { tier: 'oro', total_cdf_versions: 1017, historical_closed_versions: 0, active_current_versions: 1017 },
          { tier: 'platino', total_cdf_versions: 200, historical_closed_versions: 0, active_current_versions: 200 }
        ]
      }
    }
  ],
  workedExample: {
    title: 'Diagnóstico del problema de archivos pequeños por sobre-particionado en Mercado Brisa',
    description: 'Un ingeniero configuró una tabla histórica de pedidos particionada físicamente al estilo Hive por (customer_id, order_date) para acelerar consultas por cliente.',
    audit: 'Para 14.760 órdenes completadas, el particionado Hive por (customer_id, order_date) genera 14.702 carpetas físicas con un promedio de 1,00 fila por archivo Parquet.',
    steps: [
      {
        label: 'Paso 1 — Calcular el número de carpetas físicas Hive frente al total de órdenes por región',
        explanation: 'Contamos las órdenes completadas por región y las combinaciones distintas de (customer_id, order_date), que equivalen al número de subdirectorios y archivos Parquet creados por un particionado físico Hive.',
        code: `SELECT
  s.region,
  COUNT(*) AS total_orders,
  COUNT(DISTINCT (o.customer_id, o.order_date)) AS hive_partition_folders,
  ROUND(COUNT(*) * 1.0 / COUNT(DISTINCT (o.customer_id, o.order_date)), 2) AS rows_per_folder
FROM orders o
JOIN stores s ON o.store_id = s.store_id
WHERE o.status = 'completed'
GROUP BY s.region
ORDER BY total_orders DESC;`,
        expectedOutput: [
          { region: 'Andina', total_orders: 4921, hive_partition_folders: 4908, rows_per_folder: 1 },
          { region: 'Cono Sur', total_orders: 4920, hive_partition_folders: 4900, rows_per_folder: 1 },
          { region: 'Iberia', total_orders: 2811, hive_partition_folders: 2790, rows_per_folder: 1.01 },
          { region: 'Norteamérica', total_orders: 2108, hive_partition_folders: 2104, rows_per_folder: 1 }
        ]
      },
      {
        label: 'Paso 2 — Interpretar la densidad de filas por carpeta',
        explanation: 'El resultado demuestra que para 14.760 órdenes completadas se crearían 14.702 carpetas físicas con un promedio de 1,00 fila por archivo Parquet. Cada archivo mediría pocos kilobytes en lugar del rango recomendado de 128 MB a 512 MB.'
      },
      {
        label: 'Paso 3 — Reemplazar el particionado físico por Liquid Clustering',
        explanation: 'Al definir CLUSTER BY (customer_id, order_date) en Delta Lake 4.0, el motor elimina los 14.702 subdirectorios y organiza los registros en bloques Parquet compactos indexados espacialmente mediante curvas de Hilbert, conservando los límites min/max en _delta_log.'
      }
    ]
  },
  checks: [
    {
      id: 'chk-1',
      type: 'mcq',
      prompt: '¿Cómo logra Delta Universal Format (UniForm) que un motor lector compatible con Apache Iceberg consulte una tabla Delta Lake sin duplicar el costo de almacenamiento?',
      options: [
        {
          id: 'a',
          text: 'Exporta cada noche una copia completa de los archivos Parquet a un segundo bucket exclusivo para Iceberg.',
          correct: false,
          feedback: 'Incorrecto. UniForm evita precisamente duplicar los archivos Parquet o ejecutar copias nocturnas.'
        },
        {
          id: 'b',
          text: 'Traduce asíncronamente los commits del _delta_log en metadatos Iceberg (metadata.json y manifiestos Avro) que apuntan a los mismos archivos Parquet físicos.',
          correct: true,
          feedback: 'Correcto. Mediante IcebergCompatV2 y el mapeo de columnas por ID, ambos formatos comparten exactamente los mismos archivos Parquet.'
        },
        {
          id: 'c',
          text: 'Reemplaza los archivos Parquet por archivos JSON dentro de la carpeta _delta_log.',
          correct: false,
          feedback: 'Incorrecto. _delta_log solo almacena metadatos de transacciones; los datos masivos permanecen en Parquet.'
        },
        {
          id: 'd',
          text: 'Obliga a que los motores Iceberg parseen directamente los archivos JSON del _delta_log sin usar un catálogo Iceberg.',
          correct: false,
          feedback: 'Incorrecto. Los clientes Iceberg leen metadatos nativos de Iceberg expuestos a través de un endpoint de catálogo Iceberg.'
        }
      ],
      explanation: 'Delta UniForm mantiene una única capa física de archivos Parquet y genera de forma asíncrona los metadatos de Iceberg tras cada commit en el _delta_log.'
    },
    {
      id: 'chk-2',
      type: 'mcq',
      prompt: '¿Cuál es la diferencia técnica principal entre el antiguo comando `OPTIMIZE ... ZORDER BY` y `Liquid Clustering` en Delta Lake?',
      options: [
        {
          id: 'a',
          text: 'Liquid Clustering agrupa datos de forma incremental mediante curvas Hilbert y permite cambiar las claves de agrupación sin reescribir los datos históricos.',
          correct: true,
          feedback: 'Correcto. Liquid Clustering evita las reescrituras completas de Z-ORDER y desacopla la evolución de claves del almacenamiento histórico.'
        },
        {
          id: 'b',
          text: 'Liquid Clustering crea un subdirectorio físico en S3 por cada valor único de las columnas agrupadas.',
          correct: false,
          feedback: 'Incorrecto. Crear subdirectorios físicos por valor corresponde al particionado tradicional estilo Hive, no a Liquid Clustering.'
        },
        {
          id: 'c',
          text: 'Z-ORDER es incremental y no reescribe archivos, mientras Liquid Clustering exige reescribir toda la tabla en cada commit.',
          correct: false,
          feedback: 'Incorrecto. Es al revés: Z-ORDER reescribe particiones enteras y Liquid Clustering opera de forma incremental.'
        },
        {
          id: 'd',
          text: 'Liquid Clustering deshabilita las estadísticas min/max del _delta_log.',
          correct: false,
          feedback: 'Incorrecto. Liquid Clustering depende directamente de las estadísticas min/max en _delta_log para realizar data skipping.'
        }
      ],
      explanation: 'Liquid Clustering utiliza curvas de Hilbert para agrupar nuevos archivos de forma incremental en Z-cubes y permite alterar las columnas CLUSTER BY mediante una operación de metadatos.'
    },
    {
      id: 'chk-3',
      type: 'mcq',
      prompt: 'Al habilitar `delta.enableChangeDataFeed = true` en una tabla Plata, ¿qué información entrega el Change Data Feed (CDF) cuando se actualiza el nivel (`tier`) de un cliente?',
      options: [
        {
          id: 'a',
          text: 'Únicamente el conteo total de filas de la tabla después del commit.',
          correct: false,
          feedback: 'Incorrecto. CDF entrega el detalle fila por fila de los registros modificados, no solo un conteo global.'
        },
        {
          id: 'b',
          text: 'Los registros afectados junto con `_change_type` (`update_preimage` y `update_postimage`), `_commit_version` y `_commit_timestamp`.',
          correct: true,
          feedback: 'Correcto. CDF emite la imagen previa y posterior de cada actualización junto con la versión y marca temporal del commit.'
        },
        {
          id: 'c',
          text: 'Una copia completa de todas las filas que no sufrieron cambios en esa versión.',
          correct: false,
          feedback: 'Incorrecto. CDF filtra exclusivamente los eventos de cambio para evitar escanear las filas inalteradas.'
        },
        {
          id: 'd',
          text: 'El archivo binario del bitmap Puffin sin nombres de columna.',
          correct: false,
          feedback: 'Incorrecto. CDF expone filas relacionales legibles con las columnas de la tabla más los tres metadatos de control.'
        }
      ],
      explanation: 'El Change Data Feed etiqueta cada cambio con _change_type (insert, update_preimage, update_postimage, delete), _commit_version y _commit_timestamp para alimentar pipelines incrementales.'
    }
  ],
  practice: {
    type: 'sql',
    title: 'Diagnóstico de densidad de particiones diarias por tienda en Mercado Brisa',
    language: 'sql',
    prompt: 'Evalúa la densidad de particiones diarias por tienda en Mercado Brisa antes de aplicar Liquid Clustering. Une `stores` y `orders` (filtrando únicamente órdenes con `status = \'completed\'`), agrupa por `store_id`, `store_name` y `country_code`, y calcula: el total de órdenes completadas (`completed_orders`), los días distintos con ventas (`active_days`), el promedio de órdenes por día activo redondeado a 2 decimales (`orders_per_active_day`) y los ingresos completados redondeados a 2 decimales (`store_revenue_usd`). Ordena por `store_revenue_usd DESC` y limita el resultado a las 5 tiendas principales (`LIMIT 5`).',
    starterCode: `-- Diagnóstico de fragmentación diaria por tienda antes de Liquid Clustering
-- Corrige active_days (días distintos) y calcula orders_per_active_day redondeado a 2 decimales.
SELECT
  s.store_id,
  s.store_name,
  s.country_code,
  COUNT(o.order_id) AS completed_orders,
  COUNT(o.order_date) AS active_days,
  0.0 AS orders_per_active_day,
  ROUND(SUM(o.total_usd), 2) AS store_revenue_usd
FROM stores s
JOIN orders o ON s.store_id = o.store_id
WHERE o.status = 'completed'
GROUP BY s.store_id, s.store_name, s.country_code
ORDER BY store_revenue_usd DESC
LIMIT 5;`,
    expected: `SELECT
  s.store_id,
  s.store_name,
  s.country_code,
  COUNT(o.order_id) AS completed_orders,
  COUNT(DISTINCT o.order_date) AS active_days,
  ROUND(COUNT(o.order_id) * 1.0 / COUNT(DISTINCT o.order_date), 2) AS orders_per_active_day,
  ROUND(SUM(o.total_usd), 2) AS store_revenue_usd
FROM stores s
JOIN orders o ON s.store_id = o.store_id
WHERE o.status = 'completed'
GROUP BY s.store_id, s.store_name, s.country_code
ORDER BY store_revenue_usd DESC
LIMIT 5;`,
    orderMatters: true,
    hints: [
      'Usa COUNT(DISTINCT o.order_date) para obtener active_days.',
      'Divide COUNT(o.order_id) * 1.0 entre COUNT(DISTINCT o.order_date) dentro de ROUND(..., 2) para calcular orders_per_active_day.',
      'Suma o.total_usd con ROUND(SUM(o.total_usd), 2) para store_revenue_usd y mantén el LIMIT 5.'
    ],
    solution: `SELECT
  s.store_id,
  s.store_name,
  s.country_code,
  COUNT(o.order_id) AS completed_orders,
  COUNT(DISTINCT o.order_date) AS active_days,
  ROUND(COUNT(o.order_id) * 1.0 / COUNT(DISTINCT o.order_date), 2) AS orders_per_active_day,
  ROUND(SUM(o.total_usd), 2) AS store_revenue_usd
FROM stores s
JOIN orders o ON s.store_id = o.store_id
WHERE o.status = 'completed'
GROUP BY s.store_id, s.store_name, s.country_code
ORDER BY store_revenue_usd DESC
LIMIT 5;`,
    solutionExplanation: 'Contar DISTINCT o.order_date muestra cuántos archivos diarios produciría un particionado físico por tienda y fecha; al promediar entre 1,81 y 3,23 órdenes por día activo, queda demostrado que Liquid Clustering es indispensable para evitar miles de archivos minúsculos.',
    expectedOutputTable: [
      { store_id: 8, store_name: 'Tienda Palermo Soho', country_code: 'AR', completed_orders: 2811, active_days: 870, orders_per_active_day: 3.23, store_revenue_usd: 1107208.91 },
      { store_id: 9, store_name: 'Tienda Miraflores', country_code: 'PE', completed_orders: 2109, active_days: 832, orders_per_active_day: 2.53, store_revenue_usd: 882838.25 },
      { store_id: 14, store_name: 'Almacén Logístico Coslada', country_code: 'ES', completed_orders: 1405, active_days: 717, orders_per_active_day: 1.96, store_revenue_usd: 786831.2 },
      { store_id: 7, store_name: 'Tienda Las Condes', country_code: 'CL', completed_orders: 1029, active_days: 603, orders_per_active_day: 1.71, store_revenue_usd: 524414.66 },
      { store_id: 4, store_name: 'Tienda Chapinero Alto', country_code: 'CO', completed_orders: 1406, active_days: 703, orders_per_active_day: 2, store_revenue_usd: 492586.11 }
    ]
  },
  roleNotes: {
    de: 'Activa Liquid Clustering (CLUSTER BY) en tablas nuevas en lugar de PARTITIONED BY y habilita IcebergCompatV2 junto con Delta UniForm cuando otros equipos consuman desde motores Iceberg.',
    da: 'Aprovecha las columnas declaradas en CLUSTER BY dentro de tus predicados WHERE y JOIN para maximizar el salto de archivos (data skipping) sin preocuparte por columnas de partición ocultas o físicas.',
    bi: 'Gracias a Delta UniForm, puedes conectar herramientas de BI tanto a un endpoint SQL de Databricks como a motores externos compatibles con Iceberg REST leyendo una única verdad física.'
  },
  summary: [
    'El registro _delta_log coordina transacciones ACID en Delta Lake mediante archivos JSON de acciones atómicas y puntos de control en Parquet.',
    'Delta UniForm e IcebergCompatV2 proyectan metadatos Iceberg sobre los mismos archivos Parquet de Delta Lake sin duplicar el almacenamiento.',
    'Liquid Clustering emplea curvas espaciales de Hilbert para agrupar datos de forma incremental y permite evolucionar las claves sin reescribir la tabla.',
    'Change Data Feed (CDF) expone las imágenes previas y posteriores de cada cambio por versión para alimentar pipelines incrementales entre capas Medallion.'
  ],
  flashcards: [
    {
      id: 'fc-1',
      front: '¿Qué requisito de esquema exige el protocolo IcebergCompatV2 para activar Delta UniForm?',
      back: 'Exige habilitar el mapeo de columnas (columnMapping.mode = name o id) para que cada columna Parquet tenga un identificador numérico inmutable equivalente al field-id de Iceberg.'
    },
    {
      id: 'fc-2',
      front: '¿Por qué Liquid Clustering supera a Z-ORDER en cargas de ingesta continua?',
      back: 'Porque agrupa mediante curvas de Hilbert de manera incremental solo los archivos nuevos y permite cambiar las columnas CLUSTER BY sin reescribir los datos históricos.'
    },
    {
      id: 'fc-3',
      front: '¿Qué valores puede tomar la columna _change_type en el Change Data Feed (CDF) de Delta Lake?',
      back: 'Puede tomar cuatro valores: insert, update_preimage (antes del cambio), update_postimage (después del cambio) y delete.'
    },
    {
      id: 'fc-4',
      front: '¿Para qué sirven los archivos checkpoint en Parquet dentro del directorio _delta_log?',
      back: 'Materializan el estado agregado de todas las acciones JSON previas hasta cierta versión para que los lectores reconstruyan el estado actual sin leer miles de JSON.'
    }
  ],
  glossaryTerms: [
    'delta-transaction-log',
    'delta-uniform',
    'liquid-clustering',
    'iceberg-deletion-vectors'
  ],
  sources: [
    {
      title: 'Delta Universal Format (UniForm) Documentation',
      url: 'https://docs.delta.io/delta-uniform/',
      publisher: 'Linux Foundation / Delta Lake',
      accessed: '2026-10-29',
      supports: 'Generación asíncrona de metadatos Apache Iceberg sobre tablas Delta Lake sin duplicar archivos Parquet.'
    },
    {
      title: 'Delta Lake Liquid Clustering Documentation',
      url: 'https://docs.delta.io/delta-clustering/',
      publisher: 'Linux Foundation / Delta Lake',
      accessed: '2026-10-29',
      supports: 'Agrupación física incremental mediante curvas de Hilbert (CLUSTER BY) frente a particionado Hive y Z-ORDER.'
    },
    {
      title: 'Delta Transaction Log Protocol Specification',
      url: 'https://raw.githubusercontent.com/delta-io/delta/master/PROTOCOL.md',
      publisher: 'Linux Foundation / Delta Lake',
      accessed: '2026-10-29',
      supports: 'Estructura de acciones atómicas en _delta_log, puntos de control en Parquet, Deletion Vectors y Change Data Feed.'
    },
    {
      title: 'Read Delta tables with Iceberg clients (IcebergCompatV2)',
      url: 'https://docs.databricks.com/aws/en/delta/iceberg-reads',
      publisher: 'Databricks',
      accessed: '2026-10-29',
      supports: 'Requisitos del protocolo IcebergCompatV2 y mapeo de columnas por identificador inmutable.'
    }
  ],
  aiNotes: 'Ayuda al estudiante a relacionar el árbol de metadatos visto en la lección 1 con el _delta_log de esta lección, subrayando que ambos gobiernan archivos Parquet y por ello Delta UniForm solo traduce metadatos. En la práctica SQL, destaca cómo incluso la tienda más grande (Buenos Aires) promedia solo 3,23 órdenes por día, lo que haría inviable un particionado físico diario por tienda.'
};

export default lesson;
