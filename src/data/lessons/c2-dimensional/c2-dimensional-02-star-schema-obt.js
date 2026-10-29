export const lesson = {
  id: 'c2-dimensional-02-star-schema-obt',
  legacyId: 'l4-star-schema-obt',
  legacyOrder: 4,
  moduleId: 'c2-dimensional',
  tracks: ['core', 'de', 'da', 'bi'],
  level: 2,
  order: 2,
  title: 'Esquema en estrella frente a tabla ancha (OBT)',
  subtitle:
    'Comparación entre esquemas en estrella, copo de nieve y One Big Table (OBT) en motores columnares',
  minutes: 25,
  prerequisites: ['c2-dimensional-01-hechos-dimensiones-bus'],
  contentVersion: 2,
  hook: 'El equipo de analítica de Mercado Brisa propuso materializar una sola tabla ancha (`obt_order_lines`) uniendo `orders`, `order_items`, `products`, `customers` y `stores` para acelerar los tableros de BI. Al día siguiente, el reporte de costos logísticos por segmento mostró `$435.50` de envío en órdenes completadas en lugar de los `$370.50` reales, y una actualización de regiones en `stores` obligó a reescribir las `42,000` líneas. ¿Cuándo conviene servir un esquema en estrella clásico y cuándo una tabla ancha preunida sin inflar métricas?',
  objectives: [
    'Contrastar la topología del esquema en estrella, el esquema en copo de nieve (Snowflake) y la tabla ancha desnormalizada (OBT).',
    'Diagnosticar cómo la compresión columnar (RLE y diccionario en Parquet y DuckDB) mitiga el costo de almacenamiento de atributos repetidos en una OBT.',
    'Construir consultas sobre el esquema en estrella de Mercado Brisa filtrando anomalías de catálogo (`SKU-TEST-NEG`) y evitando duplicar medidas de cabecera en granos de línea.',
  ],
  sections: [
    {
      id: 'sec-estrella-vs-copo-nieve',
      heading: 'Esquema en estrella frente a copo de nieve (Snowflake)',
      body: 'El **esquema en estrella** de Ralph Kimball organiza cada proceso de negocio con una tabla de hechos central (`order_items`) rodeada por un único nivel de dimensiones desnormalizadas (`products`, `stores`, `customers`, `calendar`). La tabla de hechos concentra el volumen de filas con claves foráneas compactas y medidas numéricas. Las dimensiones son tablas pequeñas en filas pero anchas en atributos descriptivos.\n\nCuando un equipo normaliza una dimensión en subtablas jerárquicas —por ejemplo, separando `category` y `subcategory` de `products` en tablas independientes en `3FN`—, el diseño se convierte en un **esquema en copo de nieve** (*Snowflake*). Aunque el copo de nieve ahorra algunos kilobytes en las dimensiones, obliga a encadenar múltiples `JOIN` adicionales en cada consulta.\n\nEn el almacén de datos analítico, Kimball desaconseja normalizar las dimensiones salvo en casos extremos. Mantener dimensiones planas en estrella simplifica el optimizador de consultas. También facilita la navegación en herramientas de BI y preserva la gobernanza de las **dimensiones conformadas** entre procesos.',
      example: {
        language: 'sql',
        code: `SELECT
  s.region,
  p.category,
  COUNT(DISTINCT o.order_id) AS orders_count,
  SUM(oi.qty) AS total_units,
  ROUND(SUM(oi.line_total_usd), 2) AS net_sales_usd
FROM order_items oi
INNER JOIN orders o ON oi.order_id = o.order_id
INNER JOIN products p ON oi.product_id = p.product_id
INNER JOIN stores s ON o.store_id = s.store_id
WHERE o.status = 'completed'
  AND p.list_price_usd > 0
  AND s.region = 'Cono Sur'
GROUP BY s.region, p.category
ORDER BY net_sales_usd DESC;`,
        expectedOutput: [
          {
            region: 'Cono Sur',
            category: 'Molinos',
            orders_count: 2045,
            total_units: 4684,
            net_sales_usd: 704901.21,
          },
          {
            region: 'Cono Sur',
            category: 'Cafeteras',
            orders_count: 2051,
            total_units: 4740,
            net_sales_usd: 545891.44,
          },
          {
            region: 'Cono Sur',
            category: 'Suscripciones',
            orders_count: 2016,
            total_units: 4590,
            net_sales_usd: 216760.65,
          },
          {
            region: 'Cono Sur',
            category: 'Accesorios',
            orders_count: 2051,
            total_units: 4713,
            net_sales_usd: 192675.97,
          },
          {
            region: 'Cono Sur',
            category: 'Café en grano',
            orders_count: 2046,
            total_units: 4740,
            net_sales_usd: 137242.91,
          },
        ],
      },
    },
    {
      id: 'sec-obt-motores-columnares',
      heading: 'One Big Table (OBT) y el compromiso en motores columnares',
      body: 'Con la adopción de formatos columnares como **Apache Parquet** y motores vectorizados como **DuckDB**, el costo físico de repetir cadenas de texto cambió. Una **One Big Table** (`OBT`) preune la tabla de hechos con todas sus dimensiones en una sola tabla ancha materializada en la capa de consumo.\n\nEn un motor orientado a filas, repetir `"Cono Sur"` o `"Cafeteras"` en `42,000` líneas multiplicaría el almacenamiento. En cambio, un archivo columnar aplica **codificación por diccionario** y *Run-Length Encoding* (`RLE`) cuando la tabla se ordena por atributos de baja cardinalidad. Así, las lecturas escanean únicamente las columnas proyectadas en el `SELECT` sin ejecutar `Hash Joins` en tiempo de consulta.\n\nSin embargo, la `OBT` introduce dos riesgos operativos importantes. Primero, cualquier cambio en una dimensión obliga a reconstruir toda la tabla ancha (*backfill* completo). Segundo, al aplanar una cabecera (`orders`) sobre sus líneas (`order_items`), las medidas de cabecera como `shipping_usd` se repiten en cada línea y se inflan al sumarse (`$435.50` frente a `$370.50` reales). La arquitectura híbrida mantiene el **esquema en estrella** como núcleo gobernado y materializa vistas u `OBT` solo para consumo final.',
      interactive: {
        component: 'star-vs-obt-sim',
        caption:
          'Compara el costo de escaneo, uniones en memoria y actualización dimensional entre un esquema OLTP normalizado, un esquema en estrella y una tabla ancha OBT.',
      },
      example: {
        language: 'sql',
        code: `WITH obt_order_lines AS (
  SELECT
    oi.order_item_id,
    o.order_id,
    s.region,
    c.segment AS customer_segment,
    p.category,
    oi.qty,
    oi.line_total_usd,
    o.shipping_usd
  FROM order_items oi
  INNER JOIN orders o ON oi.order_id = o.order_id
  INNER JOIN products p ON oi.product_id = p.product_id
  INNER JOIN stores s ON o.store_id = s.store_id
  INNER JOIN customers c ON o.customer_id = c.customer_id
  WHERE o.status = 'completed'
    AND p.list_price_usd > 0
)
SELECT
  customer_segment,
  COUNT(DISTINCT order_id) AS orders_count,
  SUM(qty) AS units_sold,
  ROUND(SUM(line_total_usd), 2) AS items_revenue_usd,
  ROUND(SUM(shipping_usd), 2) AS duplicated_shipping_usd
FROM obt_order_lines
GROUP BY customer_segment
ORDER BY items_revenue_usd DESC;`,
        expectedOutput: [
          {
            customer_segment: 'pro_barista',
            orders_count: 6229,
            units_sold: 28508,
            items_revenue_usd: 2189795.58,
            duplicated_shipping_usd: 221,
          },
          {
            customer_segment: 'retail',
            orders_count: 5940,
            units_sold: 27635,
            items_revenue_usd: 2123739.67,
            duplicated_shipping_usd: 195,
          },
          {
            customer_segment: 'cafeteria_b2b',
            orders_count: 2591,
            units_sold: 14907,
            items_revenue_usd: 1150615.93,
            duplicated_shipping_usd: 19.5,
          },
        ],
      },
    },
  ],
  workedExample: {
    title: 'Construcción de una vista Gold desde el esquema en estrella filtrando anomalías',
    description:
      'El área comercial de Mercado Brisa pide un resumen de unidades vendidas, ventas netas y margen bruto por categoría y por región sobre órdenes completadas. Antes de exponer una vista ancha (`obt_sales_gold`), auditaremos el catálogo `products` para aislar productos de prueba y verificaremos los totales contra el esquema en estrella.',
    steps: [
      {
        label: 'Paso 1: Auditar productos con precio negativo',
        explanation:
          'Auditamos la dimensión `products` para identificar SKUs de prueba con precio de lista menor o igual a cero antes de construir el modelo analítico.',
        code: `SELECT
  product_id,
  sku,
  category,
  unit_cost_usd,
  list_price_usd
FROM products
WHERE list_price_usd <= 0 OR unit_cost_usd < 0;`,
        expectedOutput: [
          {
            product_id: 180,
            sku: 'SKU-TEST-NEG',
            category: 'Accesorios',
            unit_cost_usd: 0,
            list_price_usd: -9.99,
          },
        ],
      },
      {
        label: 'Paso 2: Consultar el esquema en estrella por categoría',
        explanation:
          'Consultamos el esquema en estrella (`order_items`, `orders`, `products`) excluyendo `list_price_usd <= 0` para obtener ventas netas, costo total y margen bruto por categoría.',
        code: `SELECT
  p.category,
  SUM(oi.qty) AS units_sold,
  ROUND(SUM(oi.line_total_usd), 2) AS net_sales_usd,
  ROUND(SUM(oi.qty * p.unit_cost_usd), 2) AS total_cost_usd,
  ROUND(SUM(oi.line_total_usd - (oi.qty * p.unit_cost_usd)), 2) AS gross_margin_usd
FROM order_items oi
INNER JOIN orders o ON oi.order_id = o.order_id
INNER JOIN products p ON oi.product_id = p.product_id
WHERE o.status = 'completed'
  AND p.list_price_usd > 0
GROUP BY p.category
ORDER BY gross_margin_usd DESC;`,
        expectedOutput: [
          {
            category: 'Molinos',
            units_sold: 14314,
            net_sales_usd: 2163162.27,
            total_cost_usd: 1235089.04,
            gross_margin_usd: 928073.23,
          },
          {
            category: 'Cafeteras',
            units_sold: 14270,
            net_sales_usd: 1643366.45,
            total_cost_usd: 861476.1,
            gross_margin_usd: 781890.35,
          },
          {
            category: 'Accesorios',
            units_sold: 14366,
            net_sales_usd: 586859.56,
            total_cost_usd: 246528.02,
            gross_margin_usd: 340331.54,
          },
          {
            category: 'Suscripciones',
            units_sold: 13857,
            net_sales_usd: 657384.31,
            total_cost_usd: 319166.57,
            gross_margin_usd: 338217.74,
          },
          {
            category: 'Café en grano',
            units_sold: 14243,
            net_sales_usd: 413378.59,
            total_cost_usd: 184902.58,
            gross_margin_usd: 228476.01,
          },
        ],
      },
      {
        label: 'Paso 3: Derivar la OBT limpia a grano de línea',
        explanation:
          'Definimos la CTE desnormalizada `obt_sales_gold` únicamente con medidas válidas a nivel de línea (`qty`, `line_total_usd`, `line_margin_usd`) y agregamos el desempeño por región.',
        code: `WITH obt_sales_gold AS (
  SELECT
    o.order_id,
    s.region,
    p.category,
    oi.qty,
    oi.line_total_usd,
    ROUND(oi.line_total_usd - (oi.qty * p.unit_cost_usd), 2) AS line_margin_usd
  FROM order_items oi
  INNER JOIN orders o ON oi.order_id = o.order_id
  INNER JOIN products p ON oi.product_id = p.product_id
  INNER JOIN stores s ON o.store_id = s.store_id
  WHERE o.status = 'completed'
    AND p.list_price_usd > 0
)
SELECT
  region,
  COUNT(DISTINCT order_id) AS orders_count,
  SUM(qty) AS units_sold,
  ROUND(SUM(line_total_usd), 2) AS net_sales_usd,
  ROUND(SUM(line_margin_usd), 2) AS gross_margin_usd
FROM obt_sales_gold
GROUP BY region
ORDER BY gross_margin_usd DESC;`,
        expectedOutput: [
          {
            region: 'Cono Sur',
            orders_count: 4920,
            units_sold: 23467,
            net_sales_usd: 1797472.18,
            gross_margin_usd: 861688.28,
          },
          {
            region: 'Andina',
            orders_count: 4921,
            units_sold: 22502,
            net_sales_usd: 1733571.64,
            gross_margin_usd: 829571.07,
          },
          {
            region: 'Iberia',
            orders_count: 2811,
            units_sold: 15211,
            net_sales_usd: 1174460.14,
            gross_margin_usd: 562675.96,
          },
          {
            region: 'Norteamérica',
            orders_count: 2108,
            units_sold: 9870,
            net_sales_usd: 758647.22,
            gross_margin_usd: 363053.56,
          },
        ],
      },
    ],
  },
  checks: [
    {
      type: 'mcq',
      id: 'chk-l4-q1',
      prompt:
        '¿Por qué una tabla ancha (OBT) con millones de filas que repite cadenas de texto como `region` y `category` no multiplica proporcionalmente el espacio en disco en Apache Parquet o DuckDB?',
      options: [
        {
          id: 'a',
          text: 'Porque Parquet normaliza automáticamente la tabla en un esquema en estrella oculto al guardarla.',
          correct: false,
          feedback:
            'Incorrecto. Parquet conserva las columnas declaradas en el archivo; la eficiencia proviene de su codificación física por columna.',
        },
        {
          id: 'b',
          text: 'Porque el almacenamiento columnar aplica codificación por diccionario y Run-Length Encoding (RLE) sobre valores repetidos.',
          correct: true,
          feedback:
            'Correcto. Al almacenar juntas las ocurrencias de una misma columna de baja cardinalidad, el diccionario y RLE comprimen las cadenas repetidas a enteros mínimos.',
        },
        {
          id: 'c',
          text: 'Porque los motores analíticos truncan los atributos de texto a 4 bytes cuando detectan una OBT.',
          correct: false,
          feedback:
            'Incorrecto. Los motores columnares preservan los textos íntegros sin pérdida mediante diccionarios por bloque (Row Group).',
        },
      ],
      explanation:
        'En formatos columnares como Parquet y el formato nativo de DuckDB, las columnas de texto con baja cardinalidad se codifican mediante diccionarios y RLE, haciendo que el impacto en almacenamiento de desnormalizar atributos sea mínimo.',
    },
    {
      type: 'mcq',
      id: 'chk-l4-q2',
      prompt:
        '¿Cuál es la principal desventaja operativa de reemplazar por completo el esquema en estrella por una única One Big Table (OBT) en el almacén de datos?',
      options: [
        {
          id: 'a',
          text: 'Los motores columnares no permiten ejecutar cláusulas GROUP BY sobre tablas de más de 15 columnas.',
          correct: false,
          feedback:
            'Incorrecto. Los motores columnares leen solo las columnas proyectadas y agrupan sobre tablas anchas sin restricción.',
        },
        {
          id: 'b',
          text: 'Cualquier corrección en una dimensión obliga a reescribir la OBT completa y se complica el cruce seguro con otras tablas de hechos de distinto grano.',
          correct: true,
          feedback:
            'Correcto. La OBT penaliza el mantenimiento ante cambios dimensionales y propicia errores de fan-out cuando se mezcla con otros procesos.',
        },
        {
          id: 'c',
          text: 'Impide filtrar órdenes por estado o por rango de fechas en herramientas de visualización.',
          correct: false,
          feedback:
            'Incorrecto. Filtrar por columnas presentes en la OBT es sumamente rápido gracias a los zonemaps columnares.',
        },
      ],
      explanation:
        'En un esquema en estrella, actualizar una dimensión modifica solo unos miles de filas y las dimensiones conformadas permiten hacer Drill-Across limpio entre múltiples procesos de negocio sin reconstruir tablas masivas.',
    },
    {
      type: 'predict-output',
      id: 'chk-l4-q3',
      prompt:
        'En Mercado Brisa, una orden completada (`order_id = 500`) tiene `total_usd = 120.00` en `orders` y está compuesta por `3` artículos en `order_items`. Si ejecutas `SELECT COUNT(o.order_id), COUNT(DISTINCT o.order_id), SUM(o.total_usd) FROM orders o JOIN order_items oi ON o.order_id = oi.order_id WHERE o.order_id = 500`, ¿qué obtienes?',
      options: [
        {
          id: 'a',
          text: '3, 1 y 360.00.',
          correct: true,
          feedback:
            'Correcto. `COUNT(o.order_id)` cuenta las 3 filas resultantes, `COUNT(DISTINCT o.order_id)` devuelve 1 orden única y `SUM(o.total_usd)` triplica los $120.00 hasta $360.00.',
        },
        {
          id: 'b',
          text: '1, 1 y 120.00.',
          correct: false,
          feedback:
            'Incorrecto. La unión 1:3 genera 3 filas físicas antes de agregar, por lo que `COUNT(o.order_id)` y `SUM(o.total_usd)` operan sobre las 3 filas repetidas.',
        },
        {
          id: 'c',
          text: '3, 3 y 120.00.',
          correct: false,
          feedback:
            'Incorrecto. `COUNT(DISTINCT o.order_id)` devuelve `1` porque las 3 líneas comparten el mismo `order_id`, mientras que `SUM(o.total_usd)` se triplica a `360.00`.',
        },
      ],
      explanation:
        'Al unir la cabecera (`1` fila) con sus líneas (`3` filas), el resultado intermedio tiene `3` filas. Por ello `COUNT(DISTINCT o.order_id)` es obligatorio para contar órdenes (`1`) y `SUM(oi.line_total_usd)` debe usarse en lugar de `SUM(o.total_usd)`.',
    },
  ],
  practice: {
    type: 'sql',
    title: 'Ventas netas y unidades por región y categoría en el esquema en estrella',
    prompt:
      'Construye una consulta analítica sobre el esquema en estrella de Mercado Brisa uniendo `order_items` (`oi`), `orders` (`o`), `products` (`p`) y `stores` (`s`). Filtra únicamente órdenes completadas (`o.status = \'completed\'`) y productos con precio de lista positivo (`p.list_price_usd > 0`). Agrupa por `s.region` y `p.category` para obtener: `orders_count` (`COUNT(DISTINCT o.order_id)`), `units_sold` (`SUM(oi.qty)`) y `net_revenue_usd` (`ROUND(SUM(oi.line_total_usd), 2)`). Ordena por `region ASC, net_revenue_usd DESC`.',
    starterCode: `-- Une order_items con orders, products y stores cuidando el grano de línea
SELECT
  'PENDIENTE'::VARCHAR AS region,
  'PENDIENTE'::VARCHAR AS category,
  COUNT(DISTINCT o.order_id) AS orders_count,
  SUM(0) AS units_sold,
  ROUND(SUM(o.total_usd), 2) AS net_revenue_usd
FROM orders o
WHERE o.status = 'completed'
GROUP BY 1, 2
ORDER BY region ASC, net_revenue_usd DESC;`,
    solution: `SELECT
  s.region,
  p.category,
  COUNT(DISTINCT o.order_id) AS orders_count,
  SUM(oi.qty) AS units_sold,
  ROUND(SUM(oi.line_total_usd), 2) AS net_revenue_usd
FROM order_items oi
INNER JOIN orders o ON oi.order_id = o.order_id
INNER JOIN products p ON oi.product_id = p.product_id
INNER JOIN stores s ON o.store_id = s.store_id
WHERE o.status = 'completed'
  AND p.list_price_usd > 0
GROUP BY s.region, p.category
ORDER BY region ASC, net_revenue_usd DESC;`,
    solutionExplanation:
      'Al partir de `order_items`, filtrar `p.list_price_usd > 0` para excluir el SKU negativo de prueba y usar `COUNT(DISTINCT o.order_id)` junto con `SUM(oi.line_total_usd)`, obtenemos las órdenes únicas y las ventas netas exactas sin inflar importes de cabecera.',
    expectedOutputTable: [
      {
        region: 'Andina',
        category: 'Molinos',
        orders_count: 2046,
        units_sold: 4563,
        net_revenue_usd: 692558.36,
      },
      {
        region: 'Andina',
        category: 'Cafeteras',
        orders_count: 2040,
        units_sold: 4498,
        net_revenue_usd: 516191.39,
      },
      {
        region: 'Andina',
        category: 'Suscripciones',
        orders_count: 2020,
        units_sold: 4369,
        net_revenue_usd: 207560.51,
      },
      {
        region: 'Andina',
        category: 'Accesorios',
        orders_count: 2041,
        units_sold: 4565,
        net_revenue_usd: 186606.21,
      },
      {
        region: 'Andina',
        category: 'Café en grano',
        orders_count: 2037,
        units_sold: 4507,
        net_revenue_usd: 130655.17,
      },
      {
        region: 'Cono Sur',
        category: 'Molinos',
        orders_count: 2045,
        units_sold: 4684,
        net_revenue_usd: 704901.21,
      },
      {
        region: 'Cono Sur',
        category: 'Cafeteras',
        orders_count: 2051,
        units_sold: 4740,
        net_revenue_usd: 545891.44,
      },
      {
        region: 'Cono Sur',
        category: 'Suscripciones',
        orders_count: 2016,
        units_sold: 4590,
        net_revenue_usd: 216760.65,
      },
      {
        region: 'Cono Sur',
        category: 'Accesorios',
        orders_count: 2051,
        units_sold: 4713,
        net_revenue_usd: 192675.97,
      },
      {
        region: 'Cono Sur',
        category: 'Café en grano',
        orders_count: 2046,
        units_sold: 4740,
        net_revenue_usd: 137242.91,
      },
      {
        region: 'Iberia',
        category: 'Molinos',
        orders_count: 1260,
        units_sold: 3040,
        net_revenue_usd: 459621.08,
      },
      {
        region: 'Iberia',
        category: 'Cafeteras',
        orders_count: 1270,
        units_sold: 3112,
        net_revenue_usd: 360059.14,
      },
      {
        region: 'Iberia',
        category: 'Suscripciones',
        orders_count: 1254,
        units_sold: 2974,
        net_revenue_usd: 141677.47,
      },
      {
        region: 'Iberia',
        category: 'Accesorios',
        orders_count: 1266,
        units_sold: 3054,
        net_revenue_usd: 125068.91,
      },
      {
        region: 'Iberia',
        category: 'Café en grano',
        orders_count: 1267,
        units_sold: 3031,
        net_revenue_usd: 88033.54,
      },
      {
        region: 'Norteamérica',
        category: 'Molinos',
        orders_count: 894,
        units_sold: 2027,
        net_revenue_usd: 306081.62,
      },
      {
        region: 'Norteamérica',
        category: 'Cafeteras',
        orders_count: 889,
        units_sold: 1920,
        net_revenue_usd: 221224.48,
      },
      {
        region: 'Norteamérica',
        category: 'Suscripciones',
        orders_count: 877,
        units_sold: 1924,
        net_revenue_usd: 91385.68,
      },
      {
        region: 'Norteamérica',
        category: 'Accesorios',
        orders_count: 889,
        units_sold: 2034,
        net_revenue_usd: 82508.47,
      },
      {
        region: 'Norteamérica',
        category: 'Café en grano',
        orders_count: 896,
        units_sold: 1965,
        net_revenue_usd: 57446.97,
      },
    ],
    hints: [
      'Realiza INNER JOIN desde `order_items oi` hacia `orders o` (`oi.order_id = o.order_id`), `products p` (`oi.product_id = p.product_id`) y `stores s` (`o.store_id = s.store_id`).',
      'Filtra con `WHERE o.status = \'completed\' AND p.list_price_usd > 0` para excluir órdenes no completadas y el SKU de prueba negativo.',
      'Usa `COUNT(DISTINCT o.order_id) AS orders_count`, `SUM(oi.qty) AS units_sold` y `ROUND(SUM(oi.line_total_usd), 2) AS net_revenue_usd` ordenando por `region ASC, net_revenue_usd DESC`.',
    ],
    orderMatters: true,
  },
  pipelineChallenge: {
    title: 'Esquema en estrella frente a OBT: Ventas por Región y Categoría',
    ValidatorKey: 'l4_star_obt',
    datasets: ['orders', 'order_items', 'products', 'stores'],
    steps: [
      {
        id: 'step-1',
        text: 'Perfilar los granos de orders (18,000 cabeceras) frente a order_items (42,000 líneas) para prevenir el fan-out 1:N.',
        title: '1. Perfilar granos de orders vs order_items',
        goal: 'Compara el número de órdenes frente al número de líneas de ítems para entender la relación 1:N.',
        hint: 'En el explorador de esquemas verifica cuántas filas tiene `orders` (18,000) frente a `order_items` (42,000). Si unes ambas tablas y sumas `orders.total_usd`, duplicarás el total por cada ítem.',
      },
      {
        id: 'step-2',
        text: 'Auditar la dimensión products y filtrar el registro centinela SKU-TEST-NEG con list_price_usd > 0.',
        title: '2. Auditar el catálogo de productos',
        goal: 'Identifica el SKU de prueba con precio negativo en la dimensión products.',
        hint: 'En `products` existe `SKU-TEST-NEG` con `list_price_usd = -9.99`. Exclúyelo en tu modelo dimensional con `p.list_price_usd > 0`.',
      },
      {
        id: 'step-3',
        text: 'Unir order_items con orders, products y stores agregando unidades, ingreso neto y margen bruto al grano de línea.',
        title: '3. Construir la consulta estrella / OBT limpia',
        goal: 'Une order_items, orders, products y stores calculando total_units, revenue_usd y gross_margin_usd.',
        hint: 'Agrupa por `s.region` y `p.category` sobre órdenes `completed`, sumando `oi.line_total_usd` y el margen `oi.line_total_usd - (oi.qty * p.unit_cost_usd)`.',
      },
    ],
    prompt:
      'Construye la consulta analítica que une `order_items` (`oi`), `orders` (`o`), `products` (`p`) y `stores` (`s`). Filtra órdenes con `o.status = \'completed\'` y productos válidos con `p.list_price_usd > 0`. Devuelve por `region` y `category`: 1) `total_units` (`SUM(oi.qty)`), 2) `revenue_usd` (`ROUND(SUM(oi.line_total_usd), 2)`), y 3) `gross_margin_usd` (`ROUND(SUM(oi.line_total_usd - (oi.qty * p.unit_cost_usd)), 2)`). Ordena por `revenue_usd DESC`.',
    starterCode: `-- Construye el reporte dimensional uniendo hechos de ítems con dimensiones
SELECT
  s.region,
  p.category,
  SUM(oi.qty) AS total_units,
  -- Calcula revenue_usd y gross_margin_usd redondeados a 2 decimales
  ROUND(SUM(o.total_usd), 2) AS revenue_usd,
  0.0 AS gross_margin_usd
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
JOIN products p ON oi.product_id = p.product_id
JOIN stores s ON o.store_id = s.store_id
WHERE o.status = 'completed'
GROUP BY s.region, p.category
ORDER BY revenue_usd DESC;`,
    solution: `SELECT
  s.region,
  p.category,
  SUM(oi.qty) AS total_units,
  ROUND(SUM(oi.line_total_usd), 2) AS revenue_usd,
  ROUND(SUM(oi.line_total_usd - (oi.qty * p.unit_cost_usd)), 2) AS gross_margin_usd
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
JOIN products p ON oi.product_id = p.product_id
JOIN stores s ON o.store_id = s.store_id
WHERE o.status = 'completed'
  AND p.list_price_usd > 0
GROUP BY s.region, p.category
ORDER BY revenue_usd DESC;`,
    expectedOutputTable: {
      columns: ['region', 'category', 'total_units', 'revenue_usd', 'gross_margin_usd'],
      rows: [
        ['Cono Sur', 'Molinos', 4684, 704901.21, 302540.89],
        ['Andina', 'Molinos', 4563, 692558.36, 297084.89],
        ['Cono Sur', 'Cafeteras', 4740, 545891.44, 259943.06],
        ['Andina', 'Cafeteras', 4498, 516191.39, 245414.81],
        ['Iberia', 'Molinos', 3040, 459621.08, 197163.38],
        ['Iberia', 'Cafeteras', 3112, 360059.14, 171304.06],
        ['Norteamérica', 'Molinos', 2027, 306081.62, 131284.07],
        ['Norteamérica', 'Cafeteras', 1920, 221224.48, 105228.42],
        ['Cono Sur', 'Suscripciones', 4590, 216760.65, 111565.39],
        ['Andina', 'Suscripciones', 4369, 207560.51, 106753.88],
        ['Cono Sur', 'Accesorios', 4713, 192675.97, 111783.95],
        ['Andina', 'Accesorios', 4565, 186606.21, 108162.95],
        ['Iberia', 'Suscripciones', 2974, 141677.47, 72942.59],
        ['Cono Sur', 'Café en grano', 4740, 137242.91, 75854.99],
        ['Andina', 'Café en grano', 4507, 130655.17, 72154.54],
        ['Iberia', 'Accesorios', 3054, 125068.91, 72557.25],
        ['Norteamérica', 'Suscripciones', 1924, 91385.68, 46955.88],
        ['Iberia', 'Café en grano', 3031, 88033.54, 48708.68],
        ['Norteamérica', 'Accesorios', 2034, 82508.47, 47827.39],
        ['Norteamérica', 'Café en grano', 1965, 57446.97, 31757.8],
      ],
    },
    orderMatters: true,
    hints: [
      'No sumes `o.total_usd` al cruzar con `order_items`, porque se multiplica por cada línea de la orden; usa `SUM(oi.line_total_usd)`.',
      'Agrega el filtro `AND p.list_price_usd > 0` para descartar el SKU de prueba negativo.',
      'El margen bruto por línea es `oi.line_total_usd - (oi.qty * p.unit_cost_usd)`.',
    ],
  },
  roleNotes: {
    de: 'Como Ingeniero de Datos, mantendrás el esquema en estrella como núcleo gobernado en Silver/Gold y materializarás vistas u OBTs ordenadas por claves de baja cardinalidad para maximizar la compresión RLE en Parquet.',
    da: 'Como Analista de Datos, auditarás siempre el grano de cualquier OBT antes de sumar columnas: si la tabla está a nivel de `order_item_id`, usarás `COUNT(DISTINCT order_id)` para órdenes y `SUM(line_total_usd)` para ingresos.',
    bi: 'Como especialista en BI, preferirás exponer dimensiones planas en estrella a la capa semántica en lugar de esquemas en copo de nieve, evitando uniones encadenadas innecesarias.',
  },
  summary: [
    'El esquema en estrella une una tabla de hechos central con dimensiones planas desnormalizadas mediante una sola unión por dimensión.',
    'El esquema en copo de nieve normaliza jerarquías dimensionales en 3FN, añadiendo uniones que rara vez compensan el mínimo ahorro de espacio.',
    'En motores columnares como Parquet y DuckDB, la codificación por diccionario y RLE comprimen eficazmente los textos repetidos de una OBT.',
    'Materializar una OBT acelera lecturas de una sola tabla, pero exige reescrituras completas cuando cambian atributos dimensionales.',
    'Desnormalizar cabeceras (`orders`) sobre líneas (`order_items`) obliga a usar `COUNT(DISTINCT order_id)` y no sumar importes de cabecera sin prorrateo.',
  ],
  glossaryTerms: [
    'c06-star-vs-obt',
    'esquema-copo-de-nieve',
    'grano-dimensional',
    'dimension-conformada',
  ],
  flashcards: [
    {
      id: 'fc-c2-dim-02-01',
      front: '¿Qué diferencia a un esquema en estrella de un esquema en copo de nieve (Snowflake)?',
      back: 'En el esquema en estrella cada dimensión es una sola tabla plana desnormalizada; en el copo de nieve las jerarquías de la dimensión se separan en subtablas normalizadas en 3FN.',
    },
    {
      id: 'fc-c2-dim-02-02',
      front: '¿Por qué los archivos Parquet comprimen tan bien las columnas de texto repetidas en una OBT?',
      back: 'Porque emplean codificación por diccionario (sustituyendo textos por enteros) y Run-Length Encoding (RLE) sobre secuencias de valores idénticos.',
    },
    {
      id: 'fc-c2-dim-02-03',
      front: '¿Qué ocurre si sumas `o.shipping_usd` o `o.total_usd` directamente en una OBT construida a grano de `order_items`?',
      back: 'El importe de cabecera se repite en cada línea del pedido y su suma se infla proporcionalmente al número de artículos por orden.',
    },
    {
      id: 'fc-c2-dim-02-04',
      front: '¿Cuál es el patrón híbrido recomendado entre esquema en estrella y OBT?',
      back: 'Gobernar y versionar las entidades maestras y hechos en un esquema en estrella central, y derivar tablas anchas (OBT) solo en la frontera de consumo.',
    },
  ],
  sources: [
    {
      title: 'Star Schemas and OLAP Cubes',
      url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/star-schema-olap-cube/',
      publisher: 'Kimball Group',
      accessed: '2026-10-29',
      supports:
        'Estructura y ventajas analíticas del esquema en estrella frente a modelos transaccionales normalizados.',
    },
    {
      title: 'Snowflaked Dimensions',
      url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/snowflake-dimension/',
      publisher: 'Kimball Group',
      accessed: '2026-10-29',
      supports:
        'Razones por las que Kimball recomienda dimensiones planas en estrella frente a dimensiones normalizadas en copo de nieve.',
    },
    {
      title: 'Drilling Across Fact Tables',
      url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/drilling-across/',
      publisher: 'Kimball Group',
      accessed: '2026-10-29',
      supports:
        'Ventaja del esquema en estrella con dimensiones conformadas para combinar múltiples procesos sin fan-out.',
    },
    {
      title: 'DuckDB SQL — FROM and JOIN Clauses',
      url: 'https://duckdb.org/docs/stable/sql/query_syntax/from.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports:
        'Ejecución vectorizada de uniones en estrella y escaneo columnar sobre tablas en DuckDB.',
    },
  ],
  aiNotes:
    'Recuerda al estudiante dos trampas reales en el dataset de Mercado Brisa para esta lección: 1) Unir `orders` (18,000 filas) con `order_items` (42,000 filas) duplica `o.total_usd` y `o.shipping_usd` por cada línea de la orden; debe sumar `oi.line_total_usd` y contar órdenes con `COUNT(DISTINCT o.order_id)`. 2) La tabla `products` incluye `SKU-TEST-NEG` (`product_id = 180`) con `list_price_usd = -9.99`, que debe filtrarse con `p.list_price_usd > 0`.',
  needsReview: false,
};

export default lesson;
