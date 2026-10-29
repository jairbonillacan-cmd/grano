const lesson = {
  id: 'bi2-modelo-semantico-01-estrella-vertipaq',
  moduleId: 'bi2-modelo-semantico',
  tracks: ['bi'],
  level: 2,
  order: 1,
  title: 'Esquema en estrella en Power BI y motor VertiPaq',
  subtitle: 'Del almacén de datos al esquema en estrella dentro de Power BI (motor VertiPaq)',
  minutes: 25,
  prerequisites: ['bi2-metricas-04', 'l4-star-schema-obt'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), un analista importó en Power BI una única tabla ancha que unía `orders`, `order_items`, `products` y `stores`. Al arrastrar `total_usd` a una tarjeta de ventas por región, el informe mostró 5,73 millones de dólares en Cono Sur cuando la facturación real completada era de 2,06 millones. Además, el archivo `.pbix` triplicó su tamaño en memoria RAM. ¿Por qué el motor VertiPaq exige separar dimensiones y hechos en un esquema en estrella?',

  objectives: [
    'Explicar cómo el motor columnar VertiPaq comprime columnas mediante diccionarios y codificación RLE.',
    'Separar atributos descriptivos en tablas de dimensión y métricas numéricas en tablas de hechos según su grano.',
    'Auditar con SQL qué columnas sobran o inflan la memoria y las sumas antes de importar tablas en Power BI.',
  ],

  sections: [
    {
      id: 'arquitectura-interna-motor-vertipaq',
      heading: 'Cómo almacena y comprime datos en memoria el motor VertiPaq',
      body: 'Cuando usas el modo Import en Power BI o Analysis Services Tabular, los datos viven en **VertiPaq**. Este motor analítico columnar trabaja en memoria RAM. A diferencia de una base por filas, VertiPaq divide cada tabla verticalmente. Así guarda cada columna en una estructura independiente.\n\nPara comprimir texto o identificadores repetidos, VertiPaq aplica **codificación por diccionario** (*Hash Encoding*). Primero construye una lista de valores únicos y asigna a cada uno un entero secuencial (`DataID`). Después reemplaza los valores en los segmentos de datos por ese entero. Finalmente agrupa las secuencias idénticas mediante compresión por longitud de racha (*Run-Length Encoding*, RLE).\n\nPor eso el consumo de RAM depende de la cardinalidad de cada columna, no tanto del total de filas. En la tabla `orders` de Mercado Brisa (18 000 filas), la columna `store_id` solo tiene 14 tiendas únicas. Su diccionario ocupa muy pocos bytes. En cambio, `order_item_id` en `order_items` tiene 42 000 valores distintos en 42 000 filas. Importar esa clave primaria cuando no participa en ninguna relación desperdicia el diccionario más caro del modelo.',
      interactive: {
        component: 'star-vs-obt-sim',
        caption: 'Simulador interactivo: compara una tabla ancha desnormalizada frente al esquema en estrella.',
      },
      example: {
        language: 'sql',
        code: `SELECT
  'order_items.order_item_id (PK innecesaria en BI)' AS columna_evaluada,
  COUNT(*) AS filas_totales,
  COUNT(DISTINCT order_item_id) AS valores_unicos_diccionario,
  ROUND(COUNT(DISTINCT order_item_id) * 100.0 / COUNT(*), 2) AS ratio_cardinalidad_pct
FROM order_items
UNION ALL
SELECT
  'order_items.product_id (FK hacia products)',
  COUNT(*),
  COUNT(DISTINCT product_id),
  ROUND(COUNT(DISTINCT product_id) * 100.0 / COUNT(*), 2)
FROM order_items
UNION ALL
SELECT
  'orders.store_id (FK hacia stores)',
  COUNT(*),
  COUNT(DISTINCT store_id),
  ROUND(COUNT(DISTINCT store_id) * 100.0 / COUNT(*), 2)
FROM orders
UNION ALL
SELECT
  'orders.order_date (FK hacia calendar)',
  COUNT(*),
  COUNT(DISTINCT order_date),
  ROUND(COUNT(DISTINCT order_date) * 100.0 / COUNT(*), 2)
FROM orders;`,
        expectedOutput: [
          {
            columna_evaluada: 'order_items.order_item_id (PK innecesaria en BI)',
            filas_totales: '42000',
            valores_unicos_diccionario: '42000',
            ratio_cardinalidad_pct: 100,
          },
          {
            columna_evaluada: 'order_items.product_id (FK hacia products)',
            filas_totales: '42000',
            valores_unicos_diccionario: '179',
            ratio_cardinalidad_pct: 0.43,
          },
          {
            columna_evaluada: 'orders.store_id (FK hacia stores)',
            filas_totales: '18000',
            valores_unicos_diccionario: '14',
            ratio_cardinalidad_pct: 0.08,
          },
          {
            columna_evaluada: 'orders.order_date (FK hacia calendar)',
            filas_totales: '18000',
            valores_unicos_diccionario: '1035',
            ratio_cardinalidad_pct: 5.75,
          },
        ],
      },
    },
    {
      id: 'dos-roles-de-tabla-en-el-modelo-semantico',
      heading: 'Por qué toda tabla en Power BI debe ser dimensión o hecho',
      body: 'La guía de Microsoft Learn establece una regla clara para el **modelo semántico en estrella**. Cada tabla cumple uno de dos roles posibles, nunca ambos a la vez.\n\nLas **tablas de dimensión** describen las entidades del negocio (`products`, `stores`, `customers`, `calendar`). Tienen pocas filas y muchas columnas descriptivas (`category`, `brand`, `region`, `city`). Además poseen una clave única que identifica cada fila. Se usan para filtrar en segmentadores y agrupar en los ejes de los gráficos.\n\nLas **tablas de hechos** registran eventos o mediciones (`orders`, `order_items`, `refunds`). Contienen claves foráneas enteras o de fecha (`product_id`, `store_id`, `customer_id`, `order_date`) y columnas numéricas aditivas (`qty`, `line_total_usd`). Se usan para resumir valores mediante medidas DAX.\n\nCuando importas una tabla ancha (*One Big Table*, OBT) que mezcla `orders.total_usd` con el detalle de `order_items`, rompes ambos principios. Obligas a VertiPaq a guardar diccionarios de texto sobre decenas de miles de filas. Además, cada pedido con tres productos repite tres veces su `total_usd` y su `shipping_usd`. Cualquier suma en el lienzo devuelve importes multiplicados por el número de líneas.',
    },
    {
      id: 'motor-almacenamiento-y-motor-formulas',
      heading: 'Cómo colaboran el motor de almacenamiento y el motor de fórmulas',
      body: 'Cada visual de Power BI se resuelve mediante dos componentes internos que trabajan en secuencia. Son el **motor de almacenamiento** (*Storage Engine*, SE) y el **motor de fórmulas** (*Formula Engine*, FE).\n\nEl motor de almacenamiento es multihilo y lee los segmentos comprimidos de VertiPaq mediante consultas internas llamadas `xmSQL`. También guarda sus resultados en la caché de datos. Cuando el modelo sigue un esquema en estrella limpio, los filtros sobre `products[category]` o `stores[region]` se traducen en una lista pequeña de enteros (`DataID`). Esa lista cruza a gran velocidad con la tabla de hechos `order_items`.\n\nEn cambio, el motor de fórmulas es monohilo. Ejecuta la lógica compleja que el motor de almacenamiento no puede resolver por sí mismo. Si dejas atributos de filtro dentro de tablas de hechos gigantescas, el motor de almacenamiento debe escanear millones de registros para poblar un simple segmentador. Separar `products` (180 filas) y `stores` (14 filas) permite que los menús desplegables carguen al instante leyendo pocos kilobytes.',
    },
  ],

  workedExample: {
    title: 'Auditoría de OBT inflada frente a separación en estrella por grano',
    description: 'Compara el efecto de aplastar `orders` y `order_items` en una sola tabla ancha frente a separar los hechos por su grano y unirlos mediante la dimensión `stores`.',
    steps: [
      {
        label: 'Paso 1 — Antipatrón: tabla ancha (OBT) que mezcla cabecera y líneas de pedido',
        explanation: 'Al desnormalizar `orders` (18 000 filas) con `order_items` (42 000 filas) para los pedidos completados, el importe de cabecera `total_usd` se repite en cada línea del carrito. En Cono Sur, `SUM(total_pedido_repetido)` arroja 5 728 199,93 USD en lugar de los 2 059 786,39 USD reales.',
        code: `WITH obt_desnormalizada AS (
  SELECT
    o.order_id,
    s.region,
    o.total_usd AS total_pedido_repetido,
    oi.line_total_usd
  FROM orders o
  JOIN order_items oi ON o.order_id = oi.order_id
  JOIN stores s ON o.store_id = s.store_id
  WHERE o.status = 'completed'
)
SELECT
  region,
  COUNT(*) AS filas_en_obt,
  COUNT(DISTINCT order_id) AS pedidos_reales,
  ROUND(SUM(total_pedido_repetido), 2) AS total_pedido_inflado_obt_usd,
  ROUND(SUM(line_total_usd), 2) AS ventas_lineas_usd
FROM obt_desnormalizada
GROUP BY region
ORDER BY ventas_lineas_usd DESC;`,
        expectedOutput: [
          {
            region: 'Cono Sur',
            filas_en_obt: '11230',
            pedidos_reales: '4920',
            total_pedido_inflado_obt_usd: 5728199.93,
            ventas_lineas_usd: 1797472.18,
          },
          {
            region: 'Andina',
            filas_en_obt: '11197',
            pedidos_reales: '4921',
            total_pedido_inflado_obt_usd: 5601804.71,
            ventas_lineas_usd: 1733571.64,
          },
          {
            region: 'Iberia',
            filas_en_obt: '6992',
            pedidos_reales: '2811',
            total_pedido_inflado_obt_usd: 3964506.1,
            ventas_lineas_usd: 1174460.14,
          },
          {
            region: 'Norteamérica',
            filas_en_obt: '4901',
            pedidos_reales: '2108',
            total_pedido_inflado_obt_usd: 2480805.23,
            ventas_lineas_usd: 758647.22,
          },
        ],
      },
      {
        label: 'Paso 2 — Solución en estrella: cada tabla de hechos conserva su grano y filtra desde stores',
        explanation: 'En el modelo semántico mantenemos la dimensión `stores` en el lado uno y agregamos cada hecho en su grano natural antes de presentarlos juntos. Así Cono Sur reporta exactamente 4 920 pedidos por 2 059 786,39 USD (con impuestos y envío) y 11 230 líneas de producto por 1 797 472,18 USD.',
        code: `WITH cabecera_por_tienda AS (
  SELECT
    store_id,
    COUNT(order_id) AS pedidos_reales,
    SUM(total_usd) AS total_pedido_real_usd
  FROM orders
  WHERE status = 'completed'
  GROUP BY store_id
),
lineas_por_tienda AS (
  SELECT
    o.store_id,
    COUNT(oi.order_item_id) AS lineas_hechos,
    SUM(oi.line_total_usd) AS ventas_lineas_usd
  FROM order_items oi
  JOIN orders o ON oi.order_id = o.order_id
  WHERE o.status = 'completed'
  GROUP BY o.store_id
)
SELECT
  s.region,
  SUM(l.lineas_hechos) AS lineas_hechos,
  SUM(c.pedidos_reales) AS pedidos_reales,
  ROUND(SUM(c.total_pedido_real_usd), 2) AS total_pedido_real_estrella_usd,
  ROUND(SUM(l.ventas_lineas_usd), 2) AS ventas_lineas_usd
FROM stores s
JOIN cabecera_por_tienda c ON s.store_id = c.store_id
JOIN lineas_por_tienda l ON s.store_id = l.store_id
GROUP BY s.region
ORDER BY ventas_lineas_usd DESC;`,
        expectedOutput: [
          {
            region: 'Cono Sur',
            lineas_hechos: '11230',
            pedidos_reales: '4920',
            total_pedido_real_estrella_usd: 2059786.39,
            ventas_lineas_usd: 1797472.18,
          },
          {
            region: 'Andina',
            lineas_hechos: '11197',
            pedidos_reales: '4921',
            total_pedido_real_estrella_usd: 1990554.12,
            ventas_lineas_usd: 1733571.64,
          },
          {
            region: 'Iberia',
            lineas_hechos: '6992',
            pedidos_reales: '2811',
            total_pedido_real_estrella_usd: 1348369.68,
            ventas_lineas_usd: 1174460.14,
          },
          {
            region: 'Norteamérica',
            lineas_hechos: '4901',
            pedidos_reales: '2108',
            total_pedido_real_estrella_usd: 870752.23,
            ventas_lineas_usd: 758647.22,
          },
        ],
      },
    ],
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: 'Al importar la tabla de hechos `order_items` (42 000 filas) en Power BI, ¿qué columna consume más memoria RAM en el diccionario de VertiPaq y debe excluirse si ninguna otra tabla se une a ella?',
      options: [
        {
          id: 'a',
          text: 'La clave primaria de línea `order_item_id`, porque tiene 42 000 valores únicos (100 % de cardinalidad) y no se usa para filtrar ni relacionar.',
          correct: true,
          feedback: 'Correcto. Una columna con un valor distinto por fila impide la compresión RLE y crea el diccionario más grande de toda la tabla.',
        },
        {
          id: 'b',
          text: 'La clave foránea `product_id`, porque enlaza con los 180 productos del catálogo.',
          correct: false,
          feedback: 'Incorrecto. `product_id` solo tiene 179 valores únicos en `order_items` y es indispensable para relacionar los hechos con la dimensión `products`.',
        },
        {
          id: 'c',
          text: 'La cantidad vendida `qty`, porque es una columna numérica que se suma en las medidas.',
          correct: false,
          feedback: 'Incorrecto. `qty` tiene muy pocos valores enteros distintos (1 a 4 unidades) y es la base para calcular unidades vendidas.',
        },
      ],
      explanation: 'En VertiPaq el tamaño de una columna depende de su número de valores distintos. Los identificadores únicos de transacción o línea en tablas de hechos deben quitarse si no actúan como clave de relación.',
    },
    {
      id: 'c2',
      type: 'predict-output',
      prompt: 'En `order_items` hay 42 000 filas asociadas a 179 productos distintos (`product_id`). ¿Qué porcentaje de cardinalidad (`COUNT(DISTINCT product_id) * 100.0 / COUNT(*)`) tiene la columna `product_id`?',
      options: [
        {
          id: 'a',
          text: '0,43 %, lo que permite a VertiPaq un diccionario de solo 179 entradas.',
          correct: true,
          feedback: 'Exacto. `179 / 42 000 = 0,00426` (0,43 %); VertiPaq codifica toda la columna con pequeños enteros.',
        },
        {
          id: 'b',
          text: '100 %, porque cada línea de pedido guarda un identificador de producto distinto.',
          correct: false,
          feedback: 'Incorrecto. Los mismos 179 productos se repiten miles de veces a lo largo de las 42 000 líneas.',
        },
        {
          id: 'c',
          text: '5,75 %, igual que la columna de fechas `order_date`.',
          correct: false,
          feedback: 'Incorrecto. 5,75 % corresponde a `1 035` fechas distintas sobre `18 000` pedidos en `orders`.',
        },
      ],
      explanation: 'Las claves foráneas hacia dimensiones pequeñas tienen baja cardinalidad (< 1 %) y se comprimen con alta eficiencia mediante codificación por diccionario y RLE.',
    },
    {
      id: 'c3',
      type: 'mcq',
      prompt: '¿Qué ocurre en un modelo de Power BI si desnormalizas los importes de cabecera de `orders` (`total_usd`, `shipping_usd`) dentro de las 42 000 filas de `order_items`?',
      options: [
        {
          id: 'a',
          text: 'Cualquier suma de `total_usd` o `shipping_usd` multiplica el importe de los pedidos que tienen dos o más líneas de producto.',
          correct: true,
          feedback: 'Correcto. Al bajar atributos numéricos de cabecera al grano de línea sin prorratearlos, las medidas de suma producen fan-out.',
        },
        {
          id: 'b',
          text: 'El motor VertiPaq detecta que `order_id` se repite y divide automáticamente `total_usd` entre el número de líneas.',
          correct: false,
          feedback: 'Incorrecto. VertiPaq suma todas las filas activas en el contexto de filtro; no deduce ni prorratea importes repetidos.',
        },
        {
          id: 'c',
          text: 'Las dimensiones `products` y `stores` dejan de poder filtrar las ventas por categoría.',
          correct: false,
          feedback: 'Incorrecto. Los filtros siguen funcionando, pero las cifras agregadas de nivel pedido quedan infladas.',
        },
      ],
      explanation: 'Cuando coexisten métricas a nivel pedido (`shipping_usd`, `tax_usd`) y métricas a nivel línea (`qty`, `line_total_usd`), deben mantenerse en sus tablas de hechos respectivas o prorratearse explícitamente.',
    },
  ],

  practice: {
    type: 'sql',
    title: 'Agregación en estrella desde dimensión products hacia order_items',
    language: 'sql',
    prompt: 'Simula la consulta que resuelve el motor de almacenamiento sobre el esquema en estrella de Mercado Brisa: une `order_items` con `orders` (filtrando `o.status = \'completed\'`) y la dimensión `products` para obtener por cada `category`: `skus_distintos` (`COUNT(DISTINCT p.product_id)`), `lineas_hechos` (`COUNT(oi.order_item_id)`), `unidades_vendidas` (`SUM(oi.qty)`) e `ingreso_lineas_usd` (`ROUND(SUM(oi.line_total_usd), 2)`), ordenado por `ingreso_lineas_usd DESC`.',
    starterCode: `SELECT
  p.category,
  COUNT(DISTINCT p.product_id) AS skus_distintos,
  COUNT(oi.order_item_id) AS lineas_hechos,
  -- TODO: Suma oi.qty AS unidades_vendidas y redondea SUM(oi.line_total_usd) a 2 decimales AS ingreso_lineas_usd
  0 AS unidades_vendidas,
  0.0 AS ingreso_lineas_usd
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
-- TODO: Une la dimensión products p por product_id
WHERE o.status = 'completed'
GROUP BY p.category
ORDER BY ingreso_lineas_usd DESC;`,
    expected: `SELECT
  p.category,
  COUNT(DISTINCT p.product_id) AS skus_distintos,
  COUNT(oi.order_item_id) AS lineas_hechos,
  SUM(oi.qty) AS unidades_vendidas,
  ROUND(SUM(oi.line_total_usd), 2) AS ingreso_lineas_usd
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
JOIN products p ON oi.product_id = p.product_id
WHERE o.status = 'completed'
GROUP BY p.category
ORDER BY ingreso_lineas_usd DESC;`,
    orderMatters: true,
    hints: [
      'Añade `JOIN products p ON oi.product_id = p.product_id` debajo del join con `orders`.',
      'Calcula las unidades con `SUM(oi.qty) AS unidades_vendidas`.',
      'Calcula el ingreso con `ROUND(SUM(oi.line_total_usd), 2) AS ingreso_lineas_usd` y mantén `ORDER BY ingreso_lineas_usd DESC`.',
    ],
    solution: `SELECT
  p.category,
  COUNT(DISTINCT p.product_id) AS skus_distintos,
  COUNT(oi.order_item_id) AS lineas_hechos,
  SUM(oi.qty) AS unidades_vendidas,
  ROUND(SUM(oi.line_total_usd), 2) AS ingreso_lineas_usd
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
JOIN products p ON oi.product_id = p.product_id
WHERE o.status = 'completed'
GROUP BY p.category
ORDER BY ingreso_lineas_usd DESC;`,
    solutionExplanation: 'La dimensión `products` aporta el atributo de agrupación `category` (lado 1) y la tabla de hechos `order_items` aporta las cantidades e importes aditivos (lado N), filtrando los pedidos completados sin duplicar filas.',
    expectedOutputTable: [
      {
        category: 'Molinos',
        skus_distintos: 36,
        lineas_hechos: 6899,
        unidades_vendidas: 14314,
        ingreso_lineas_usd: 2163162.27,
      },
      {
        category: 'Cafeteras',
        skus_distintos: 36,
        lineas_hechos: 6908,
        unidades_vendidas: 14270,
        ingreso_lineas_usd: 1643366.45,
      },
      {
        category: 'Suscripciones',
        skus_distintos: 35,
        lineas_hechos: 6712,
        unidades_vendidas: 13857,
        ingreso_lineas_usd: 657384.31,
      },
      {
        category: 'Accesorios',
        skus_distintos: 36,
        lineas_hechos: 6902,
        unidades_vendidas: 14366,
        ingreso_lineas_usd: 586859.56,
      },
      {
        category: 'Café en grano',
        skus_distintos: 36,
        lineas_hechos: 6899,
        unidades_vendidas: 14243,
        ingreso_lineas_usd: 413378.59,
      },
    ],
  },

  roleNotes: {
    bi: 'Oculta en la vista de informe todas las columnas de clave foránea (`product_id`, `store_id`) de la tabla de hechos para obligar a los usuarios a arrastrar los filtros desde las tablas de dimensión.',
    de: 'Publica en el almacén vistas dimensionales limpias (`dim_product`, `dim_store`, `fct_order_items`) sin columnas de texto redundantes en los hechos y ordenadas por claves de baja cardinalidad para maximizar la compresión RLE.',
    da: 'Cuando explores datos en un cuaderno puedes usar una OBT temporal, pero al entregar el modelo para autoservicio en BI debes respetar la separación entre cabecera (`orders`) y detalle (`order_items`).',
  },

  summary: [
    'El motor VertiPaq almacena datos por columnas usando diccionarios de valores únicos y compresión por rachas (RLE).',
    'En Power BI cada tabla cumple un único rol: dimensión (filtrar y agrupar) o hechos (resumir métricas).',
    'Importar columnas con valores únicos por fila en tablas de hechos (`order_item_id`) dispara el consumo de RAM.',
    'Mezclar importes de cabecera (`orders.total_usd`) en una tabla ancha de líneas multiplica las sumas en el reporte.',
  ],

  flashcards: [
    {
      id: 'fc-bi2-ms-01-a',
      front: '¿Qué factor determina principalmente el consumo de memoria RAM de una columna en el motor VertiPaq?',
      back: 'Su cardinalidad (número de valores distintos), porque define el tamaño del diccionario y la longitud de los códigos enteros por fila.',
    },
    {
      id: 'fc-bi2-ms-01-b',
      front: '¿Qué dos roles exclusivos de tabla existen en un modelo semántico en estrella dentro de Power BI?',
      back: 'Tablas de dimensión (claves únicas y atributos descriptivos para filtrar/agrupar) y tablas de hechos (claves foráneas y números para agregar).',
    },
    {
      id: 'fc-bi2-ms-01-c',
      front: '¿Por qué debe eliminarse `order_item_id` al importar `order_items` en un modelo semántico si ninguna otra tabla se relaciona con ella?',
      back: 'Porque tiene 100 % de cardinalidad (un valor distinto por fila), no aporta ningún filtro ni medida y genera el diccionario más pesado de la tabla.',
    },
  ],

  glossaryTerms: [
    'motor-vertipaq',
    'esquema-estrella-semantico',
  ],

  sources: [
    {
      title: 'Microsoft Learn — Understand star schema and the importance for Power BI',
      url: 'https://learn.microsoft.com/en-us/power-bi/guidance/star-schema',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Separación estricta entre tablas de dimensión y tablas de hechos dentro de Power BI.',
    },
    {
      title: 'Microsoft Learn — Data reduction techniques for Import modeling',
      url: 'https://learn.microsoft.com/en-us/power-bi/guidance/import-modeling-data-reduction',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Impacto de la cardinalidad de columnas en los diccionarios de VertiPaq y eliminación de claves primarias de hechos.',
    },
    {
      title: 'Kimball Group — Star Schemas and OLAP Cubes',
      url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/star-schema-olap-cube/',
      publisher: 'Kimball Group',
      accessed: '2026-10-29',
      supports: 'Aislamiento de granos entre cabecera y detalle y relación con dimensiones conformadas.',
    },
  ],

  aiNotes: 'El alumno suele pensar que como Parquet comprime bien las tablas anchas (OBT), en Power BI da igual importar una sola tabla plana. Recuérdale que en una OBT dentro de BI los segmentadores escanean la tabla grande y cualquier suma sobre importes de cabecera (`total_usd`, `shipping_usd`) sufre fan-out por las líneas de `order_items`.',
};

export default lesson;
