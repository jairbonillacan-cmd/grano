export default {
  id: 'bi3-gobierno-04-import-directquery-direct-lake',
  moduleId: 'bi3-gobierno',
  tracks: ['bi'],
  level: 3,
  order: 4,
  title: 'Arquitectura: Import, DirectQuery y Direct Lake',
  subtitle: 'Arquitectura de rendimiento: Import, DirectQuery, modelos compuestos y Direct Lake sobre Parquet',
  minutes: 25,
  contentVersion: 1,
  prerequisites: [
    'bi3-gobierno-03-certificacion-metricas-obsolescencia'
  ],
  hook: 'El panel operativo de Mercado Brisa consulta 65 000 eventos web (`events`) y 42 000 líneas de pedido (`order_items`). Cuando el equipo lo configuró en modo `DirectQuery` puro, cada cambio de filtro de los 80 analistas disparaba decenas de consultas SQL que saturaban el almacén. Al pasarlo a `Import` completo, el refresco tardaba demasiado y los datos quedaban desfasados. ¿Cómo se combinan `Import`, `DirectQuery`, modelos compuestos (`Dual`) y `Direct Lake` sobre Parquet para lograr respuestas en milisegundos sin sacrificar frescura?',
  objectives: [
    'Contrastar las arquitecturas de almacenamiento `Import` (caché columnar VertiPaq en RAM) y `DirectQuery` (traducción SQL en vivo) en términos de latencia, frescura y concurrencia.',
    'Diseñar modelos compuestos con tablas de preagregación en `Import`, tablas de detalle en `DirectQuery` y dimensiones compartidas en modo `Dual`.',
    'Explicar el funcionamiento de `Direct Lake` sobre archivos Parquet/Delta, sus condiciones de repliegue (`fallback`) a DirectQuery y el factor de compresión de un rollup mensual en SQL.'
  ],
  sections: [
    {
      id: 'import-vs-directquery-compromisos',
      heading: 'El dilema clásico: modo Import frente a modo DirectQuery',
      body: 'Todo motor de Business Intelligence debe decidir dónde residen los datos y dónde se ejecutan las agregaciones. En el modo **Import**, el modelo semántico lee los datos de origen durante una ventana programada. Luego los comprime mediante codificación por diccionario y longitud de racha (RLE) y los aloja en memoria RAM dentro del motor columnar **VertiPaq**.\n\nLa ventaja del modo Import es su baja latencia. Las consultas DAX se resuelven en decenas de milisegundos sin tocar la base de datos de origen. Su límite es doble: los datos solo son tan recientes como el último refresco programado y el volumen debe caber en la memoria asignada.\n\nEn el extremo opuesto, el modo **DirectQuery** no copia datos al modelo semántico. Cada vez que un usuario interactúa con un visual, el motor traduce la petición DAX a SQL nativo y la envía en vivo al almacén. Aunque garantiza frescura en tiempo real, multiplica la carga sobre el motor SQL. Un lienzo con 8 visuales abierto por 50 usuarios simultáneos puede lanzar 400 consultas SQL concurrentes.',
      example: {
        language: 'sql',
        code: `SELECT
  (SELECT COUNT(*) FROM events) AS raw_events_rows,
  (SELECT COUNT(*) FROM order_items) AS raw_item_rows,
  (SELECT COUNT(*) FROM orders) AS raw_order_rows,
  (SELECT COUNT(*) FROM (SELECT DISTINCT store_id, DATE_TRUNC('month', order_date) FROM orders)) AS monthly_store_rollup_rows;`,
        expectedOutput: [
          {
            raw_events_rows: 65000,
            raw_item_rows: 42000,
            raw_order_rows: 18000,
            monthly_store_rollup_rows: 486
          }
        ]
      }
    },
    {
      id: 'modelos-compuestos-dual-preagregaciones',
      heading: 'Modelos compuestos, almacenamiento Dual y tablas de preagregación',
      body: 'Para superar la dicotomía entre Import y DirectQuery, los **modelos compuestos** asignan el modo de almacenamiento tabla por tabla dentro del mismo modelo semántico. El diseño recomendado combina tres piezas complementarias.\n\nPrimero, las tablas de agregación resumidas se configuran en modo **Import** (o como `pre_aggregations` de tipo `rollup` en Cube). En Mercado Brisa, las ventas mensuales por tienda ocupan apenas 486 filas frente a las 42 000 filas de `order_items`. Así, el 95 % de las consultas ejecutivas por región, tienda y mes se responden al instante desde la memoria RAM.\n\nSegundo, la tabla de detalle transaccional (`order_items` o `events`) permanece en **DirectQuery**. El motor solo la interroga cuando un analista perfora (`drill-through`) hasta el nivel de `order_item_id` o `sku`. Tercero, las dimensiones compartidas (`stores` y `calendar`) se configuran en modo **`Dual`**. De este modo actúan en memoria cuando filtran la tabla de agregación y se integran en un `JOIN` SQL nativo cuando filtran el detalle.',
      example: {
        language: 'yaml',
        code: `# Equivalente declarativo en Cube: rollup en caché + tabla base en el almacén
cubes:
  - name: order_items
    sql_table: public.order_items
    joins:
      - name: orders
        relationship: belongs_to
        sql: "{CUBE}.order_id = {orders}.order_id"
    measures:
      - name: item_sales_usd
        sql: line_total_usd
        type: sum
      - name: raw_item_rows
        type: count
    pre_aggregations:
      - name: monthly_store_sales
        type: rollup
        measures: [item_sales_usd, raw_item_rows]
        dimensions: [orders.store_id]
        time_dimension: orders.order_date
        granularity: month
        refresh_key:
          every: 1 hour`
      }
    },
    {
      id: 'direct-lake-parquet-fallback',
      heading: 'Direct Lake sobre Parquet y condiciones de repliegue (fallback)',
      body: 'Con la adopción de formatos abiertos en lagos de datos como **Apache Parquet** y **Delta Lake**, la arquitectura **Direct Lake** elimina la copia de importación sin sufrir la lentitud de DirectQuery. Como los archivos Parquet ya están organizados en columnas comprimidas, el motor VertiPaq lee y transcodifica hacia la memoria RAM únicamente las columnas solicitadas por cada visual en el momento de la consulta.\n\nCuando el pipeline de ingeniería escribe un nuevo lote Parquet en el lago, el modelo semántico actualiza su puntero de metadatos (`framing`) casi al instante. Así ofrece la velocidad en memoria del modo Import sin duplicar el almacenamiento ni ejecutar largos refrescos.\n\nSin embargo, el arquitecto de BI debe vigilar el **repliegue (`fallback`) a DirectQuery**. Si el modelo Direct Lake apunta a una vista SQL en lugar de una tabla Delta/Parquet física, el motor pierde el acceso directo a los archivos. Lo mismo ocurre si se superan los límites de filas de la capacidad (`guardrails`) o si existen reglas de seguridad aplicadas en el punto de conexión SQL. En todos esos casos, la consulta cae automáticamente a `DirectQuery`.',
      example: {
        language: 'sql',
        code: `WITH raw_grain AS (
  SELECT
    s.region,
    COUNT(oi.order_item_id) AS raw_item_rows,
    COUNT(DISTINCT o.order_id) AS distinct_orders,
    COUNT(DISTINCT CONCAT(CAST(s.store_id AS VARCHAR), '-', CAST(DATE_TRUNC('month', o.order_date) AS VARCHAR))) AS monthly_store_agg_rows,
    ROUND(SUM(oi.line_total_usd), 2) AS item_sales_usd
  FROM stores s
  JOIN orders o ON s.store_id = o.store_id
  JOIN order_items oi ON o.order_id = oi.order_id
  GROUP BY s.region
)
SELECT
  region,
  raw_item_rows,
  distinct_orders,
  monthly_store_agg_rows,
  ROUND(1.0 * raw_item_rows / monthly_store_agg_rows, 1) AS compression_factor_x,
  item_sales_usd
FROM raw_grain
ORDER BY compression_factor_x DESC;`
      }
    }
  ],
  workedExample: {
    title: 'Dimensionamiento de una tabla de agregación (Import / Rollup) por región',
    description: 'Antes de configurar un modelo compuesto para Mercado Brisa, necesitamos demostrar al equipo de Arquitectura cuántas filas escanea una consulta sobre `order_items` frente a una tabla de agregación mensual por tienda (`store_id` × mes de `order_date`) y verificar que la suma de `line_total_usd` permanece intacta.',
    steps: [
      {
        label: 'Paso 1: Conteo de filas crudas frente a combinaciones mensuales por tienda',
        explanation: 'Contamos las filas crudas de `order_items`, los pedidos distintos y las combinaciones únicas de `(store_id, mes)` en cada región, sumando además `oi.line_total_usd`.',
        code: `SELECT
  s.region,
  COUNT(oi.order_item_id) AS raw_item_rows,
  COUNT(DISTINCT o.order_id) AS distinct_orders,
  COUNT(DISTINCT CONCAT(CAST(s.store_id AS VARCHAR), '-', CAST(DATE_TRUNC('month', o.order_date) AS VARCHAR))) AS monthly_store_agg_rows,
  ROUND(SUM(oi.line_total_usd), 2) AS item_sales_usd
FROM stores s
JOIN orders o ON s.store_id = o.store_id
JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY s.region
ORDER BY s.region;`,
        expectedOutput: [
          {
            region: 'Andina',
            raw_item_rows: 13714,
            distinct_orders: 6000,
            monthly_store_agg_rows: 139,
            item_sales_usd: 2119891.45
          },
          {
            region: 'Cono Sur',
            raw_item_rows: 13714,
            distinct_orders: 6001,
            monthly_store_agg_rows: 104,
            item_sales_usd: 2195524.92
          },
          {
            region: 'Iberia',
            raw_item_rows: 8570,
            distinct_orders: 3428,
            monthly_store_agg_rows: 105,
            item_sales_usd: 1438103.86
          },
          {
            region: 'Norteamérica',
            raw_item_rows: 6002,
            distinct_orders: 2571,
            monthly_store_agg_rows: 138,
            item_sales_usd: 928944.08
          }
        ]
      },
      {
        label: 'Paso 2: Cálculo del factor de reducción de escaneo por región',
        explanation: 'Calculamos el factor de reducción de escaneo (`compression_factor_x = ROUND(1.0 * raw_item_rows / monthly_store_agg_rows, 1)`) y ordenamos de mayor a menor compresión.',
        code: `WITH raw_grain AS (
  SELECT
    s.region,
    COUNT(oi.order_item_id) AS raw_item_rows,
    COUNT(DISTINCT o.order_id) AS distinct_orders,
    COUNT(DISTINCT CONCAT(CAST(s.store_id AS VARCHAR), '-', CAST(DATE_TRUNC('month', o.order_date) AS VARCHAR))) AS monthly_store_agg_rows,
    ROUND(SUM(oi.line_total_usd), 2) AS item_sales_usd
  FROM stores s
  JOIN orders o ON s.store_id = o.store_id
  JOIN order_items oi ON o.order_id = oi.order_id
  GROUP BY s.region
)
SELECT
  region,
  raw_item_rows,
  distinct_orders,
  monthly_store_agg_rows,
  ROUND(1.0 * raw_item_rows / monthly_store_agg_rows, 1) AS compression_factor_x,
  item_sales_usd
FROM raw_grain
ORDER BY compression_factor_x DESC;`,
        expectedOutput: [
          {
            region: 'Cono Sur',
            raw_item_rows: 13714,
            distinct_orders: 6001,
            monthly_store_agg_rows: 104,
            compression_factor_x: 131.9,
            item_sales_usd: 2195524.92
          },
          {
            region: 'Andina',
            raw_item_rows: 13714,
            distinct_orders: 6000,
            monthly_store_agg_rows: 139,
            compression_factor_x: 98.7,
            item_sales_usd: 2119891.45
          },
          {
            region: 'Iberia',
            raw_item_rows: 8570,
            distinct_orders: 3428,
            monthly_store_agg_rows: 105,
            compression_factor_x: 81.6,
            item_sales_usd: 1438103.86
          },
          {
            region: 'Norteamérica',
            raw_item_rows: 6002,
            distinct_orders: 2571,
            monthly_store_agg_rows: 138,
            compression_factor_x: 43.5,
            item_sales_usd: 928944.08
          }
        ]
      }
    ],
    audit: 'En Cono Sur y Andina, una tabla de preagregación mensual por tienda reduce el número de filas escaneadas en 131.9x y 98.7x respectivamente, entregando exactamente los mismos 2 195 524.92 USD y 2 119 891.45 USD en memoria.'
  },
  checks: [
    {
      id: 'chk-bi3-gob-04-dual',
      type: 'mcq',
      prompt: 'En un modelo compuesto que mantiene una tabla de agregación mensual en modo `Import` y la tabla de detalle `order_items` en modo `DirectQuery`, ¿por qué la dimensión `stores` debe configurarse en modo de almacenamiento `Dual`?',
      options: [
        {
          id: 'a',
          text: 'Para duplicar automáticamente las filas de `stores` y calcular medias móviles sin tabla calendario.',
          correct: false,
          feedback: 'Incorrecto. El modo `Dual` no altera el contenido lógico de la dimensión ni sustituye a la tabla de fechas.'
        },
        {
          id: 'b',
          text: 'Para que el motor pueda usar `stores` en memoria cuando resuelve consultas contra la tabla Import y enviarla como JOIN SQL nativo en el origen cuando resuelve consultas DirectQuery.',
          correct: true,
          feedback: 'Correcto. El modo `Dual` mantiene la dimensión sincronizada tanto en VertiPaq (RAM) como en el motor SQL remoto, evitando relaciones limitadas entre islas.'
        },
        {
          id: 'c',
          text: 'Porque el modo `DirectQuery` no admite tablas con menos de 1 000 filas como `stores`.',
          correct: false,
          feedback: 'Incorrecto. `DirectQuery` admite tablas de cualquier tamaño, pero si la dimensión es `DirectQuery` pura, forzará consultas remotas incluso al consultar agregaciones Import.'
        }
      ],
      explanation: 'Una dimensión en modo `Dual` actúa como `Import` frente a hechos en memoria y como `DirectQuery` frente a hechos remotos, permitiendo que el optimizador resuelva cada consulta en un único motor.'
    },
    {
      id: 'chk-bi3-gob-04-direct-lake',
      type: 'mcq',
      prompt: '¿Qué diferencia técnica distingue al modo `Direct Lake` tanto del modo `Import` tradicional como de `DirectQuery`?',
      options: [
        {
          id: 'a',
          text: 'Lee y transcodifica bajo demanda los segmentos de columnas directamente desde los archivos Parquet/Delta hacia la memoria de VertiPaq sin ejecutar un refresco de copia completa ni traducir las consultas DAX a SQL.',
          correct: true,
          feedback: 'Correcto. Direct Lake carga en memoria únicamente las columnas requeridas directamente desde los archivos Delta/Parquet en el lago de datos.'
        },
        {
          id: 'b',
          text: 'Convierte todas las medidas DAX en procedimientos almacenados de PostgreSQL durante la noche.',
          correct: false,
          feedback: 'Incorrecto. Direct Lake ejecuta las consultas nativamente en el motor VertiPaq sobre los datos leídos de Parquet, sin procedimientos almacenados.'
        },
        {
          id: 'c',
          text: 'Desactiva por completo el uso de memoria RAM y lee los archivos CSV línea por línea en cada clic.',
          correct: false,
          feedback: 'Incorrecto. Direct Lake opera sobre archivos columnares Delta/Parquet y sí utiliza la memoria RAM de VertiPaq para cachear las columnas activas.'
        }
      ],
      explanation: 'Direct Lake une la velocidad en memoria de VertiPaq con la lectura directa bajo demanda sobre archivos Delta/Parquet, reservando la traducción SQL solo para casos de repliegue (`fallback`).'
    },
    {
      id: 'chk-bi3-gob-04-fallback',
      type: 'predict-output',
      prompt: 'En Mercado Brisa, la región Cono Sur registra `13 714` filas en `order_items` distribuidas en `104` combinaciones únicas de `(store_id, mes)`. Si una tarjeta visual pide únicamente `SUM(line_total_usd)` por región y año, ¿cuántas filas escanea el motor al golpear el rollup mensual frente a la tabla de líneas cruda?',
      options: [
        {
          id: 'a',
          text: 'Escanea 104 filas en el rollup frente a 13 714 filas en la tabla cruda (un factor de reducción de 131.9x) y devuelve exactamente los mismos 2 195 524.92 USD.',
          correct: true,
          feedback: 'Correcto. Como región y año son niveles superiores o iguales a `(store_id, mes)`, la suma aditiva sobre las 104 filas del rollup es exacta y 131.9 veces más compacta.'
        },
        {
          id: 'b',
          text: 'Escanea 6 001 filas de `orders` y pierde el 15 % de precisión por redondeo mensual.',
          correct: false,
          feedback: 'Incorrecto. La suma de una medida aditiva (`SUM`) preagregada a nivel mensual conserva el 100 % de exactitud para consultas mensuales, trimestrales o anuales.'
        },
        {
          id: 'c',
          text: 'Tiene que hacer fallback obligatorio a las 13 714 filas porque el rollup está agrupado por tienda.',
          correct: false,
          feedback: 'Incorrecto. Como cada tienda pertenece a una única región en `stores`, el rollup por `(store_id, mes)` contiene toda la información necesaria para agregar por `region`.'
        }
      ],
      explanation: 'Al ser `SUM(line_total_usd)` una medida aditiva y ser `region` un atributo jerárquico de `store_id`, el motor resuelve la consulta leyendo solo las 104 filas preagregadas.'
    }
  ],
  practice: {
    type: 'sql',
    title: 'Evaluación de compresión de preagregación mensual para modelo compuesto',
    prompt: 'El código inicial cuenta las filas de `order_items` por región, pero asigna `1` a las filas del rollup mensual (`monthly_store_agg_rows`) y calcula mal el factor de compresión. Completa la consulta para obtener por cada `region`: `raw_item_rows` (`COUNT(oi.order_item_id)`), `distinct_orders` (`COUNT(DISTINCT o.order_id)`), `monthly_store_agg_rows` (`COUNT(DISTINCT CONCAT(CAST(s.store_id AS VARCHAR), \'-\', CAST(DATE_TRUNC(\'month\', o.order_date) AS VARCHAR)))`), `compression_factor_x` (`ROUND(1.0 * raw_item_rows / monthly_store_agg_rows, 1)`) e `item_sales_usd` (`ROUND(SUM(oi.line_total_usd), 2)`). Ordena el resultado por `compression_factor_x DESC`.',
    starterCode: `-- Calcula las filas del rollup mensual por tienda (store_id + mes de order_date) y el factor de compresión:
WITH raw_grain AS (
  SELECT
    s.region,
    COUNT(oi.order_item_id) AS raw_item_rows,
    COUNT(DISTINCT o.order_id) AS distinct_orders,
    1 AS monthly_store_agg_rows,
    ROUND(SUM(oi.line_total_usd), 2) AS item_sales_usd
  FROM stores s
  JOIN orders o ON s.store_id = o.store_id
  JOIN order_items oi ON o.order_id = oi.order_id
  GROUP BY s.region
)
SELECT
  region,
  raw_item_rows,
  distinct_orders,
  monthly_store_agg_rows,
  0.0 AS compression_factor_x,
  item_sales_usd
FROM raw_grain
ORDER BY compression_factor_x DESC;`,
    solution: `WITH raw_grain AS (
  SELECT
    s.region,
    COUNT(oi.order_item_id) AS raw_item_rows,
    COUNT(DISTINCT o.order_id) AS distinct_orders,
    COUNT(DISTINCT CONCAT(CAST(s.store_id AS VARCHAR), '-', CAST(DATE_TRUNC('month', o.order_date) AS VARCHAR))) AS monthly_store_agg_rows,
    ROUND(SUM(oi.line_total_usd), 2) AS item_sales_usd
  FROM stores s
  JOIN orders o ON s.store_id = o.store_id
  JOIN order_items oi ON o.order_id = oi.order_id
  GROUP BY s.region
)
SELECT
  region,
  raw_item_rows,
  distinct_orders,
  monthly_store_agg_rows,
  ROUND(1.0 * raw_item_rows / monthly_store_agg_rows, 1) AS compression_factor_x,
  item_sales_usd
FROM raw_grain
ORDER BY compression_factor_x DESC;`,
    solutionExplanation: 'Se cuenta por región el número de combinaciones únicas de tienda y mes (monthly_store_agg_rows) y se divide el conteo crudo de líneas (raw_item_rows) entre dicho valor para cuantificar el factor de reducción de filas del rollup.',
    expectedOutputTable: [
      {
        region: 'Cono Sur',
        raw_item_rows: 13714,
        distinct_orders: 6001,
        monthly_store_agg_rows: 104,
        compression_factor_x: 131.9,
        item_sales_usd: 2195524.92
      },
      {
        region: 'Andina',
        raw_item_rows: 13714,
        distinct_orders: 6000,
        monthly_store_agg_rows: 139,
        compression_factor_x: 98.7,
        item_sales_usd: 2119891.45
      },
      {
        region: 'Iberia',
        raw_item_rows: 8570,
        distinct_orders: 3428,
        monthly_store_agg_rows: 105,
        compression_factor_x: 81.6,
        item_sales_usd: 1438103.86
      },
      {
        region: 'Norteamérica',
        raw_item_rows: 6002,
        distinct_orders: 2571,
        monthly_store_agg_rows: 138,
        compression_factor_x: 43.5,
        item_sales_usd: 928944.08
      }
    ],
    hints: [
      'En la CTE `raw_grain`, calcula `monthly_store_agg_rows` usando `COUNT(DISTINCT CONCAT(CAST(s.store_id AS VARCHAR), \'-\', CAST(DATE_TRUNC(\'month\', o.order_date) AS VARCHAR)))`.',
      'En el `SELECT` externo, calcula `ROUND(1.0 * raw_item_rows / monthly_store_agg_rows, 1) AS compression_factor_x`.',
      'Verifica que el `ORDER BY` final sea `ORDER BY compression_factor_x DESC`.'
    ]
  },
  roleNotes: {
    de: 'Como Data Engineer, compacta periódicamente los archivos Parquet/Delta (`OPTIMIZE` y ordenamiento Z-Order o V-Order) para evitar miles de archivos pequeños (`small files problem`) que degradan la transcodificación de columnas en Direct Lake.',
    da: 'Como Data Analyst, diseña las páginas de aterrizaje de tus tableros utilizando únicamente dimensiones presentes en la tabla de preagregación (`region`, `store_id`, `month`), dejando las columnas de alta cardinalidad (`order_id`, `customer_id`) en páginas secundarias de perforación (`drill-through`).',
    bi: 'Como BI Specialist, configura siempre las dimensiones conformadas (`stores`, `calendar`, `products`) en modo `Dual` dentro de los modelos compuestos y audita con Performance Analyzer qué visuales provocan repliegue (`fallback`) a DirectQuery.'
  },
  summary: [
    'Import ofrece baja latencia en RAM (VertiPaq) con desfase de refresco, mientras que DirectQuery consulta en vivo el motor SQL.',
    'Los modelos compuestos combinan tablas de agregación en Import con hechos en DirectQuery y dimensiones compartidas en modo Dual.',
    'Las preagregaciones mensuales por tienda reducen entre 43.5x y 131.9x las filas escaneadas manteniendo intactos los totales aditivos.',
    'Direct Lake carga columnas bajo demanda desde archivos Parquet/Delta hacia VertiPaq, aplicando fallback a DirectQuery si usa vistas SQL.'
  ],
  flashcards: [
    {
      id: 'fc-bi3-gob-04-01',
      front: '¿Qué función cumple el modo de almacenamiento `Dual` en un modelo compuesto de Power BI?',
      back: 'Permite que una tabla de dimensión se almacene simultáneamente en memoria (VertiPaq) y en el origen SQL, actuando como Import al filtrar agregaciones en caché y como DirectQuery al filtrar tablas de detalle remotas.'
    },
    {
      id: 'fc-bi3-gob-04-02',
      front: '¿Qué causas provocan que un modelo en modo `Direct Lake` haga repliegue (`fallback`) hacia `DirectQuery`?',
      back: 'Construir el modelo sobre vistas SQL en lugar de tablas Delta/Parquet físicas, superar los límites de memoria o número de filas de la capacidad (guardrails), o aplicar reglas de seguridad SQL en el endpoint analítico.'
    },
    {
      id: 'fc-bi3-gob-04-03',
      front: '¿Por qué un rollup mensual por tienda (`store_id`, `month`) no puede responder directamente una consulta de `COUNT(DISTINCT customer_id)` anual sin preconfiguración especial?',
      back: 'Porque el conteo distinto no es aditivo a través del tiempo: un mismo cliente que compra en enero y en febrero se contaría dos veces al sumar los conteos distintos mensuales.'
    }
  ],
  glossaryTerms: [
    'modelo-compuesto-dual',
    'direct-lake-parquet',
    'pre-agregacion-cube'
  ],
  sources: [
    {
      title: 'Microsoft Learn — Semantic model modes in the Power BI service',
      url: 'https://learn.microsoft.com/en-us/power-bi/connect-data/service-dataset-modes-understand',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Comparativa arquitectónica entre los modos Import, DirectQuery y Composite en modelos semánticos.'
    },
    {
      title: 'Microsoft Learn — Use composite models in Power BI Desktop',
      url: 'https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-composite-models',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Configuración de modelos compuestos, modo de almacenamiento Dual y relaciones entre grupos de origen.'
    },
    {
      title: 'Microsoft Learn — Direct Lake overview',
      url: 'https://learn.microsoft.com/en-us/fabric/fundamentals/direct-lake-overview',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Arquitectura de lectura directa sobre archivos Delta Parquet en memoria VertiPaq y condiciones de fallback a DirectQuery.'
    },
    {
      title: 'Cube Documentation — Using Pre-Aggregations',
      url: 'https://docs.cube.dev/docs/pre-aggregations/using-pre-aggregations',
      publisher: 'Cube Dev',
      accessed: '2026-10-29',
      supports: 'Aceleración de consultas mediante tablas rollup materializadas por dimensiones y granularidad temporal.'
    }
  ],
  aiNotes: 'Si el estudiante usa `COUNT(DISTINCT s.store_id) * COUNT(DISTINCT DATE_TRUNC(\'month\', o.order_date))` para calcular `monthly_store_agg_rows`, explícale que ese producto cartesiano asume erróneamente que todas las tiendas tuvieron ventas en todos los meses desde la apertura. Guía hacia el conteo distinto del par real `(store_id, mes)` presente en `orders`.'
};
