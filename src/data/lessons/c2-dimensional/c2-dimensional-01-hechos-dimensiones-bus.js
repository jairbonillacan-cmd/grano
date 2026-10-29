export const lesson = {
  id: 'c2-dimensional-01-hechos-dimensiones-bus',
  moduleId: 'c2-dimensional',
  tracks: ['core', 'de', 'da', 'bi'],
  level: 2,
  order: 1,
  title: 'Hechos, dimensiones conformadas y matriz de bus de Kimball',
  subtitle:
    'Diseño de hechos y dimensiones conformadas: grano y matriz de bus de Kimball sobre procesos de ventas y devoluciones',
  minutes: 25,
  prerequisites: ['c1-modelo-05'],
  contentVersion: 2,
  hook: 'El equipo financiero de Mercado Brisa cruzó en una sola consulta las órdenes completadas (`orders`) con sus líneas de detalle (`order_items`) para reportar ingresos por categoría y sumó directamente `o.shipping_usd`. El costo de envío reportado subió de `$370.50` a `$435.50`, y al añadir pagos (`payments`) y reembolsos (`refunds`) los ingresos capturados se inflaron en más de `$103,000`. ¿Por qué un esquema relacional en 3FN válido multiplica importes al analizarse sin declarar primero el grano ni separar procesos en una matriz de bus?',
  objectives: [
    'Aplicar el proceso de diseño dimensional de 4 pasos de Kimball declarando el grano atómico antes de elegir dimensiones y medidas.',
    'Distinguir tablas de hechos, dimensiones conformadas, claves sustitutas y dimensiones degeneradas sobre el esquema de Mercado Brisa.',
    'Construir consultas multipaso (Drill-Across) mediante CTEs preagregadas por dimensiones conformadas para combinar ventas y reembolsos sin abismos de multiplicación (Chasm Traps).',
  ],
  sections: [
    {
      id: 'sec-cuatro-pasos-grano',
      heading: 'Los cuatro pasos de Kimball y la declaración del grano',
      body: 'El modelado en **tercera forma normal** (`3FN`) optimiza las escrituras transaccionales eliminando redundancia. En cambio, el **modelado dimensional** organiza los datos para responder consultas analíticas con uniones simples y predecibles. Ralph Kimball estructura este diseño en cuatro decisiones secuenciales. Primero se selecciona el proceso de negocio; luego se declara el grano; después se identifican las dimensiones; finalmente se definen los hechos.\n\nLa **declaración del grano** es el contrato base de toda tabla de hechos. Fija qué representa exactamente una fila física antes de elegir columnas. En Mercado Brisa coexisten dos granos de venta distintos. La tabla `orders` tiene una fila por pedido (`18,000` filas), mientras que `order_items` tiene una fila por línea de artículo (`42,000` filas).\n\nSi unimos `orders` con `order_items` para analizar órdenes completadas, las `14,760` órdenes se expanden a `34,320` líneas. Sumar `oi.line_total_usd` es exacto porque pertenece al grano de línea (`$5,464,151.18`). Sin embargo, sumar `o.shipping_usd` en esa misma consulta repite el envío en cada artículo del pedido y lo infla de `$370.50` a `$435.50`.',
      example: {
        language: 'sql',
        code: `SELECT
  COUNT(DISTINCT o.order_id) AS distinct_orders,
  COUNT(oi.order_item_id) AS item_rows,
  ROUND(SUM(o.shipping_usd), 2) AS inflated_shipping_usd,
  (SELECT ROUND(SUM(shipping_usd), 2) FROM orders WHERE status = 'completed') AS true_shipping_usd,
  ROUND(SUM(oi.line_total_usd), 2) AS true_items_subtotal_usd
FROM orders o
INNER JOIN order_items oi ON o.order_id = oi.order_id
WHERE o.status = 'completed';`,
        expectedOutput: [
          {
            distinct_orders: 14760,
            item_rows: 34320,
            inflated_shipping_usd: 435.5,
            true_shipping_usd: 370.5,
            true_items_subtotal_usd: 5464151.18,
          },
        ],
      },
    },
    {
      id: 'sec-hechos-dimensiones-claves',
      heading: 'Hechos, dimensiones, claves sustitutas y dimensiones degeneradas',
      body: 'Un modelo dimensional divide las tablas en dos roles complementarios. Las **tablas de hechos** almacenan mediciones numéricas de eventos (`line_total_usd`, `qty`, `refund_amount_usd`) junto con claves foráneas hacia su contexto. Las **tablas de dimensión** contienen los atributos descriptivos y jerárquicos (`stores`, `products`, `customers`, `calendar`) que responden quién, qué, dónde y cuándo.\n\nCada dimensión se identifica mediante una **clave sustituta** entera (`store_id`, `product_id`, `change_id`) controlada por el almacén de datos. Esta clave se mantiene separada de la clave natural del sistema operativo (`store_code`, `sku`). Así protegemos las uniones analíticas frente a recodificaciones administrativas y habilitamos el versionado histórico.\n\nA veces un identificador de documento operativo como `order_id` permanece en la tabla de hechos de líneas (`order_items`) sin tener una tabla de dimensión propia. La fecha, el cliente y la tienda ya fueron extraídos hacia sus dimensiones respectivas. Kimball denomina a esta columna **dimensión degenerada**. Sirve para agrupar los artículos de una misma cesta y calcular `COUNT(DISTINCT order_id)` sin duplicación.',
      example: {
        language: 'sql',
        code: `SELECT
  c.fiscal_quarter,
  s.region,
  COUNT(DISTINCT o.order_id) AS completed_orders,
  SUM(oi.qty) AS total_units,
  ROUND(SUM(oi.line_total_usd), 2) AS merchandise_revenue_usd
FROM order_items oi
INNER JOIN orders o ON oi.order_id = o.order_id
INNER JOIN stores s ON o.store_id = s.store_id
INNER JOIN calendar c ON o.order_date = c.calendar_date
WHERE o.status = 'completed'
  AND c.year = 2024
GROUP BY c.fiscal_quarter, s.region
ORDER BY c.fiscal_quarter ASC, merchandise_revenue_usd DESC
LIMIT 4;`,
        expectedOutput: [
          {
            fiscal_quarter: 'FY24-Q1',
            region: 'Cono Sur',
            completed_orders: 486,
            total_units: 2284,
            merchandise_revenue_usd: 178552.29,
          },
          {
            fiscal_quarter: 'FY24-Q1',
            region: 'Andina',
            completed_orders: 429,
            total_units: 1851,
            merchandise_revenue_usd: 141973.87,
          },
          {
            fiscal_quarter: 'FY24-Q1',
            region: 'Iberia',
            completed_orders: 298,
            total_units: 1578,
            merchandise_revenue_usd: 125031.94,
          },
          {
            fiscal_quarter: 'FY24-Q1',
            region: 'Norteamérica',
            completed_orders: 187,
            total_units: 873,
            merchandise_revenue_usd: 65260.46,
          },
        ],
      },
    },
    {
      id: 'sec-matriz-bus-drill-across',
      heading: 'Matriz de bus empresarial, dimensiones conformadas y Drill-Across',
      body: 'Si cada departamento construye sus propias tablas de tienda o calendario con criterios distintos, la organización cae en silos incompatibles. La **arquitectura de bus de Kimball** evita esta fragmentación mediante **dimensiones conformadas**. Son tablas maestras compartidas con idénticas claves y definiciones entre múltiples procesos de negocio.\n\nLa **matriz de bus empresarial** documenta esta arquitectura en una cuadrícula. Las filas listan los procesos de negocio (`orders`, `order_items`, `payments`, `refunds`, `marketing_spend`). Las columnas listan las dimensiones conformadas (`calendar`, `stores`, `customers`, `products`). Cada intersección marcada compromete al equipo a reutilizar la dimensión maestra.\n\nPara comparar dos procesos distintos —como cobros (`payments`) y reembolsos (`refunds`)—, nunca debemos unir directamente sus tablas de hechos. En Mercado Brisa hay órdenes con múltiples cobros capturados y órdenes con varios reembolsos parciales. Unirlas en un mismo `FROM` produce un producto cartesiano local (*Chasm Trap*) que infla los cobros de `$376,505.21` a `$480,391.71`. El patrón correcto es **Drill-Across**: preagregar cada proceso en su propia CTE por la dimensión conformada común y luego unir los resúmenes.',
      example: {
        language: 'sql',
        code: `WITH multi_fact_naive AS (
  SELECT
    ROUND(SUM(p.amount_usd), 2) AS naive_captured_usd,
    ROUND(SUM(r.refund_amount_usd), 2) AS naive_refunded_usd
  FROM orders o
  INNER JOIN payments p ON o.order_id = p.order_id AND p.status = 'captured'
  INNER JOIN refunds r ON o.order_id = r.order_id
),
drill_across_clean AS (
  SELECT
    (SELECT ROUND(SUM(amount_usd), 2) FROM payments WHERE status = 'captured' AND order_id IN (SELECT order_id FROM refunds)) AS clean_captured_usd,
    (SELECT ROUND(SUM(refund_amount_usd), 2) FROM refunds WHERE order_id IN (SELECT order_id FROM payments WHERE status = 'captured')) AS clean_refunded_usd
)
SELECT
  m.naive_captured_usd,
  d.clean_captured_usd,
  m.naive_refunded_usd,
  d.clean_refunded_usd
FROM multi_fact_naive m
CROSS JOIN drill_across_clean d;`,
        expectedOutput: [
          {
            naive_captured_usd: 480391.71,
            clean_captured_usd: 376505.21,
            naive_refunded_usd: 280427.16,
            clean_refunded_usd: 274534.52,
          },
        ],
      },
    },
  ],
  workedExample: {
    title: 'Conciliación Drill-Across de ventas brutas y devoluciones por región',
    description:
      'Finanzas requiere un reporte regional que compare el valor bruto de las órdenes emitidas con cobro (`status IN (\'completed\', \'refunded\')`) frente al monto total devuelto en `refunds` (`1,450` eventos sobre `1,440` órdenes) aplicando el patrón Drill-Across sobre la dimensión conformada `stores`.',
    steps: [
      {
        label: 'Paso 1: Agregar el proceso de órdenes por región',
        explanation:
          'Agrupamos el primer proceso de negocio (`orders`) por el atributo conformado `stores.region`, incluyendo las órdenes completadas y reembolsadas.',
        code: `SELECT
  s.region,
  COUNT(o.order_id) AS gross_orders,
  ROUND(SUM(o.total_usd), 2) AS gross_order_value_usd
FROM orders o
INNER JOIN stores s ON o.store_id = s.store_id
WHERE o.status IN ('completed', 'refunded')
GROUP BY s.region
ORDER BY gross_order_value_usd DESC;`,
        expectedOutput: [
          { region: 'Cono Sur', gross_orders: 5401, gross_order_value_usd: 2256477.18 },
          { region: 'Andina', gross_orders: 5400, gross_order_value_usd: 2180511.86 },
          { region: 'Iberia', gross_orders: 3085, gross_order_value_usd: 1482611.35 },
          { region: 'Norteamérica', gross_orders: 2314, gross_order_value_usd: 954887.61 },
        ],
      },
      {
        label: 'Paso 2: Agregar el proceso de reembolsos por región',
        explanation:
          'Agrupamos de forma independiente el segundo proceso de negocio (`refunds`) hasta el mismo nivel de la dimensión conformada (`stores.region`).',
        code: `SELECT
  s.region,
  COUNT(r.refund_id) AS refund_events,
  ROUND(SUM(r.refund_amount_usd), 2) AS total_refunded_usd
FROM refunds r
INNER JOIN orders o ON r.order_id = o.order_id
INNER JOIN stores s ON o.store_id = s.store_id
GROUP BY s.region
ORDER BY total_refunded_usd DESC;`,
        expectedOutput: [
          { region: 'Andina', refund_events: 621, total_refunded_usd: 133446.63 },
          { region: 'Cono Sur', refund_events: 414, total_refunded_usd: 92554.84 },
          { region: 'Iberia', refund_events: 207, total_refunded_usd: 50225.33 },
          { region: 'Norteamérica', refund_events: 208, total_refunded_usd: 44870.45 },
        ],
      },
      {
        label: 'Paso 3: Unir ambos resúmenes (Drill-Across 1:1)',
        explanation:
          'Unimos ambas CTEs preagregadas por `region` (`1:1`) para calcular el ingreso neto retenido (`net_retained_usd`) sin ninguna multiplicación de filas.',
        code: `WITH sales_by_region AS (
  SELECT
    s.region,
    COUNT(o.order_id) AS gross_orders,
    ROUND(SUM(o.total_usd), 2) AS gross_order_value_usd
  FROM orders o
  INNER JOIN stores s ON o.store_id = s.store_id
  WHERE o.status IN ('completed', 'refunded')
  GROUP BY s.region
),
refunds_by_region AS (
  SELECT
    s.region,
    COUNT(r.refund_id) AS refund_events,
    ROUND(SUM(r.refund_amount_usd), 2) AS total_refunded_usd
  FROM refunds r
  INNER JOIN orders o ON r.order_id = o.order_id
  INNER JOIN stores s ON o.store_id = s.store_id
  GROUP BY s.region
)
SELECT
  sr.region,
  sr.gross_orders,
  COALESCE(rr.refund_events, 0) AS refund_events,
  sr.gross_order_value_usd,
  COALESCE(rr.total_refunded_usd, 0.0) AS total_refunded_usd,
  ROUND(sr.gross_order_value_usd - COALESCE(rr.total_refunded_usd, 0.0), 2) AS net_retained_usd
FROM sales_by_region sr
LEFT JOIN refunds_by_region rr ON sr.region = rr.region
ORDER BY net_retained_usd DESC;`,
        expectedOutput: [
          {
            region: 'Cono Sur',
            gross_orders: 5401,
            refund_events: 414,
            gross_order_value_usd: 2256477.18,
            total_refunded_usd: 92554.84,
            net_retained_usd: 2163922.34,
          },
          {
            region: 'Andina',
            gross_orders: 5400,
            refund_events: 621,
            gross_order_value_usd: 2180511.86,
            total_refunded_usd: 133446.63,
            net_retained_usd: 2047065.23,
          },
          {
            region: 'Iberia',
            gross_orders: 3085,
            refund_events: 207,
            gross_order_value_usd: 1482611.35,
            total_refunded_usd: 50225.33,
            net_retained_usd: 1432386.02,
          },
          {
            region: 'Norteamérica',
            gross_orders: 2314,
            refund_events: 208,
            gross_order_value_usd: 954887.61,
            total_refunded_usd: 44870.45,
            net_retained_usd: 910017.16,
          },
        ],
      },
    ],
  },
  checks: [
    {
      type: 'mcq',
      id: 'chk-c2-dim-01-grain',
      prompt:
        'Según el método de diseño dimensional de 4 pasos de Kimball, ¿por qué es obligatorio declarar el grano atómico antes de elegir las dimensiones y los hechos numéricos?',
      options: [
        {
          id: 'a',
          text: 'Porque los motores SQL requieren un índice primario compuesto antes de crear vistas.',
          correct: false,
          feedback:
            'Incorrecto. La declaración del grano es una decisión de modelado semántico y físico previa al DDL de índices.',
        },
        {
          id: 'b',
          text: 'Porque el grano fija qué representa una fila física y determina qué dimensiones aplican y qué medidas son aditivas sin fan-out.',
          correct: true,
          feedback:
            'Correcto. Sin fijar si la fila es una línea de pedido o una cabecera, es imposible validar si una dimensión o medida introduce duplicación.',
        },
        {
          id: 'c',
          text: 'Porque permite normalizar la tabla de hechos en tercera forma normal (3FN) para ahorrar espacio.',
          correct: false,
          feedback:
            'Incorrecto. Las tablas de hechos no buscan 3FN sino almacenar mediciones al nivel de detalle atómico del proceso.',
        },
      ],
      explanation:
        'En la metodología de Kimball, el grano define exactamente qué evento físico representa cada fila de la tabla de hechos. Todas las dimensiones y medidas deben corresponder a ese único nivel de detalle para evitar duplicaciones 1:N.',
    },
    {
      type: 'mcq',
      id: 'chk-c2-dim-01-degenerate',
      prompt:
        'En una tabla de hechos a grano de línea de pedido (`fct_order_items`), la columna `order_id` se conserva sin tener una tabla `dim_order` asociada. ¿Cómo se clasifica `order_id`?',
      options: [
        {
          id: 'a',
          text: 'Como una dimensión degenerada que agrupa líneas de una misma transacción padre.',
          correct: true,
          feedback:
            'Correcto. Al haberse extraído fecha, cliente y tienda a sus dimensiones respectivas, el número de orden permanece como dimensión degenerada.',
        },
        {
          id: 'b',
          text: 'Como una dimensión conformada compartida con marketing.',
          correct: false,
          feedback:
            'Incorrecto. Una dimensión conformada es una tabla maestra descriptiva completa (como `stores` o `calendar`), no un identificador de documento suelto.',
        },
        {
          id: 'c',
          text: 'Como un hecho semiaditivo que debe promediarse en el tiempo.',
          correct: false,
          feedback:
            'Incorrecto. `order_id` no es una medida cuantitativa sino un identificador de control transaccional usado para conteos distintos.',
        },
      ],
      explanation:
        'Una dimensión degenerada es una clave operativa de documento (como `order_id` o número de factura) que reside en la tabla de hechos de líneas para agrupar artículos de una misma cesta o calcular `COUNT(DISTINCT order_id)`.',
    },
    {
      type: 'predict-output',
      id: 'chk-c2-dim-01-chasm',
      prompt:
        'Una orden tiene 2 pagos capturados en `payments` (de `$50` cada uno por un webhook duplicado) y 2 reembolsos parciales en `refunds` (de `$10` cada uno). Si ejecutas `SELECT COUNT(*), SUM(r.refund_amount_usd) FROM orders o JOIN payments p ON o.order_id = p.order_id JOIN refunds r ON o.order_id = r.order_id` para esa orden, ¿qué devuelve?',
      options: [
        {
          id: 'a',
          text: '2 filas y $20 de reembolso total.',
          correct: false,
          feedback:
            'Incorrecto. Al haber 2 filas en `payments` y 2 filas en `refunds` para el mismo `order_id`, la unión genera 2 x 2 = 4 combinaciones.',
        },
        {
          id: 'b',
          text: '4 filas y $40 de reembolso total (duplicando el monto real devuelto de $20).',
          correct: true,
          feedback:
            'Correcto. El producto cartesiano local 2 x 2 repite cada reembolso por cada fila de pago, inflando la suma al doble.',
        },
        {
          id: 'c',
          text: '1 fila y $20 de reembolso total porque `orders` actúa como tabla puente única.',
          correct: false,
          feedback:
            'Incorrecto. Aunque `orders` tenga 1 fila, unir dos relaciones 1:N independientes (`1:2` y `1:2`) produce un abismo de multiplicación M:N de 4 filas.',
        },
      ],
      explanation:
        'Este fenómeno es el Chasm Trap: dos relaciones 1:N convergiendo sobre la misma entidad padre multiplican sus cardinalidades entre sí (2 pagos x 2 reembolsos = 4 filas), duplicando `SUM(r.refund_amount_usd)` de `$20` a `$40`.',
    },
  ],
  practice: {
    type: 'sql',
    title: 'Drill-Across de ventas brutas y tasa de reembolso por región y tipo de tienda',
    prompt:
      'Construye una consulta multipaso (`Drill-Across`) sobre la dimensión conformada `stores` agrupando por `region` y `store_type`. En una primera CTE, calcula sobre `orders` (filtrando `status IN (\'completed\', \'refunded\')`) el conteo de órdenes `gross_orders` (`COUNT(o.order_id)`) y las ventas brutas `gross_sales_usd` (`ROUND(SUM(o.total_usd), 2)`). En una segunda CTE, calcula sobre `refunds` unido a `orders` y `stores` el conteo de devoluciones `refund_count` (`COUNT(r.refund_id)`) y el monto devuelto `refunded_usd` (`ROUND(SUM(r.refund_amount_usd), 2)`). Une ambas CTEs con `LEFT JOIN` para conservar los tipos de tienda sin devoluciones (`COALESCE(..., 0)`) y calcula `refund_rate_pct` como `ROUND(100.0 * COALESCE(rt.refunded_usd, 0.0) / NULLIF(st.gross_sales_usd, 0), 2)`. Ordena por `region ASC, gross_sales_usd DESC`.',
    starterCode: `-- Corrige el Chasm Trap y la pérdida de tiendas sin reembolsos aplicando Drill-Across con dos CTEs
SELECT
  s.region,
  s.store_type,
  COUNT(o.order_id) AS gross_orders,
  COUNT(r.refund_id) AS refund_count,
  ROUND(SUM(o.total_usd), 2) AS gross_sales_usd,
  ROUND(COALESCE(SUM(r.refund_amount_usd), 0.0), 2) AS refunded_usd,
  0.0 AS refund_rate_pct
FROM orders o
INNER JOIN stores s ON o.store_id = s.store_id
INNER JOIN refunds r ON o.order_id = r.order_id
GROUP BY s.region, s.store_type
ORDER BY s.region ASC, gross_sales_usd DESC;`,
    solution: `WITH sales_by_store_type AS (
  SELECT
    s.region,
    s.store_type,
    COUNT(o.order_id) AS gross_orders,
    ROUND(SUM(o.total_usd), 2) AS gross_sales_usd
  FROM orders o
  INNER JOIN stores s ON o.store_id = s.store_id
  WHERE o.status IN ('completed', 'refunded')
  GROUP BY s.region, s.store_type
),
refunds_by_store_type AS (
  SELECT
    s.region,
    s.store_type,
    COUNT(r.refund_id) AS refund_count,
    ROUND(SUM(r.refund_amount_usd), 2) AS refunded_usd
  FROM refunds r
  INNER JOIN orders o ON r.order_id = o.order_id
  INNER JOIN stores s ON o.store_id = s.store_id
  GROUP BY s.region, s.store_type
)
SELECT
  st.region,
  st.store_type,
  st.gross_orders,
  COALESCE(rt.refund_count, 0) AS refund_count,
  st.gross_sales_usd,
  COALESCE(rt.refunded_usd, 0.0) AS refunded_usd,
  ROUND(100.0 * COALESCE(rt.refunded_usd, 0.0) / NULLIF(st.gross_sales_usd, 0), 2) AS refund_rate_pct
FROM sales_by_store_type st
LEFT JOIN refunds_by_store_type rt
  ON st.region = rt.region
 AND st.store_type = rt.store_type
ORDER BY st.region ASC, st.gross_sales_usd DESC;`,
    solutionExplanation:
      'Al agregar `orders` y `refunds` en CTEs separadas al nivel de la dimensión conformada (`region, store_type`), evitamos duplicar el valor de órdenes con múltiples reembolsos parciales y conservamos mediante `LEFT JOIN` los tres segmentos de tiendas que tuvieron cero devoluciones.',
    expectedOutputTable: [
      {
        region: 'Andina',
        store_type: 'retail',
        gross_orders: 3086,
        refund_count: 207,
        gross_sales_usd: 1236859.08,
        refunded_usd: 45496.59,
        refund_rate_pct: 3.68,
      },
      {
        region: 'Andina',
        store_type: 'flagship',
        gross_orders: 1543,
        refund_count: 414,
        gross_sales_usd: 541256.42,
        refunded_usd: 87950.04,
        refund_rate_pct: 16.25,
      },
      {
        region: 'Andina',
        store_type: 'warehouse',
        gross_orders: 771,
        refund_count: 0,
        gross_sales_usd: 402396.36,
        refunded_usd: 0,
        refund_rate_pct: 0,
      },
      {
        region: 'Cono Sur',
        store_type: 'retail',
        gross_orders: 4219,
        refund_count: 311,
        gross_sales_usd: 1789926.27,
        refunded_usd: 79196.26,
        refund_rate_pct: 4.42,
      },
      {
        region: 'Cono Sur',
        store_type: 'flagship',
        gross_orders: 1182,
        refund_count: 103,
        gross_sales_usd: 466550.91,
        refunded_usd: 13358.58,
        refund_rate_pct: 2.86,
      },
      {
        region: 'Iberia',
        store_type: 'warehouse',
        gross_orders: 1542,
        refund_count: 0,
        gross_sales_usd: 865718.83,
        refunded_usd: 0,
        refund_rate_pct: 0,
      },
      {
        region: 'Iberia',
        store_type: 'flagship',
        gross_orders: 772,
        refund_count: 207,
        gross_sales_usd: 309670.7,
        refunded_usd: 50225.33,
        refund_rate_pct: 16.22,
      },
      {
        region: 'Iberia',
        store_type: 'retail',
        gross_orders: 771,
        refund_count: 0,
        gross_sales_usd: 307221.82,
        refunded_usd: 0,
        refund_rate_pct: 0,
      },
      {
        region: 'Norteamérica',
        store_type: 'retail',
        gross_orders: 1153,
        refund_count: 103,
        gross_sales_usd: 486891.8,
        refunded_usd: 22666.03,
        refund_rate_pct: 4.66,
      },
      {
        region: 'Norteamérica',
        store_type: 'warehouse',
        gross_orders: 567,
        refund_count: 53,
        gross_sales_usd: 263711.9,
        refunded_usd: 16910.28,
        refund_rate_pct: 6.41,
      },
      {
        region: 'Norteamérica',
        store_type: 'flagship',
        gross_orders: 594,
        refund_count: 52,
        gross_sales_usd: 204283.91,
        refunded_usd: 5294.14,
        refund_rate_pct: 2.59,
      },
    ],
    hints: [
      'Crea una primera CTE `sales_by_store_type` que agrupe `orders` (filtrando `o.status IN (\'completed\', \'refunded\')`) junto con `stores` por `s.region, s.store_type`.',
      'Crea una segunda CTE `refunds_by_store_type` que una `refunds r`, `orders o` y `stores s` y agrupe por `s.region, s.store_type`.',
      'Haz `LEFT JOIN` desde `sales_by_store_type st` hacia `refunds_by_store_type rt` por `region` y `store_type`, usando `COALESCE(rt.refund_count, 0)` y `COALESCE(rt.refunded_usd, 0.0)`.',
    ],
    orderMatters: true,
  },
  roleNotes: {
    de: 'Como Ingeniero de Datos, publicarás las dimensiones conformadas (`dim_store`, `dim_calendar`, `dim_product`) en un esquema compartido y exigirás tests de unicidad sobre cada clave sustituta para que ningún pipeline rompa el contrato del bus empresarial.',
    da: 'Como Analista de Datos, antes de escribir un `JOIN` entre dos tablas de eventos (`orders`, `payments`, `refunds`), verificarás sus granos individuales y aplicarás `Drill-Across` mediante CTEs para evitar abismos de multiplicación.',
    bi: 'Como especialista en BI, configurarás la capa semántica para que las herramientas visuales combinen métricas de múltiples tablas de hechos mediante consultas multipaso sobre dimensiones conformadas en lugar de uniones directas M:N.',
  },
  summary: [
    'El diseño dimensional de Kimball sigue cuatro pasos obligatorios: proceso de negocio, declaración del grano, dimensiones y hechos.',
    'Mezclar medidas de cabecera (`orders`) con un grano de línea (`order_items`) sin prorrateo infla importes por fan-out 1:N.',
    'Las claves sustitutas aíslan las dimensiones de cambios operativos y las dimensiones degeneradas como `order_id` agrupan líneas.',
    'La matriz de bus empresarial alinea procesos de negocio mediante dimensiones conformadas compartidas entre áreas.',
    'El patrón Drill-Across preagrega cada tabla de hechos por separado antes de unirlas para evitar el Chasm Trap.',
  ],
  glossaryTerms: [
    'grano-dimensional',
    'dimension-conformada',
    'matriz-bus-kimball',
    'dimension-degenerada',
    'drill-across',
  ],
  flashcards: [
    {
      id: 'fc-c2-dim-01-01',
      front: '¿Cuáles son los 4 pasos en orden del diseño dimensional de Kimball?',
      back: '1) Seleccionar el proceso de negocio, 2) Declarar el grano atómico, 3) Identificar las dimensiones descriptivas y 4) Identificar los hechos medibles.',
    },
    {
      id: 'fc-c2-dim-01-02',
      front: '¿Qué es una dimensión degenerada y qué ejemplo existe en Mercado Brisa?',
      back: 'Es una clave de documento operativo (como `order_id` en `order_items`) que reside en la tabla de hechos sin tabla de dimensión propia y sirve para agrupar líneas o contar transacciones únicas.',
    },
    {
      id: 'fc-c2-dim-01-03',
      front: '¿Qué función cumple la matriz de bus empresarial (Enterprise Bus Matrix)?',
      back: 'Cruza los procesos de negocio (filas) con las dimensiones conformadas compartidas (columnas) para garantizar integración técnica y semántica entre distintos esquemas en estrella.',
    },
    {
      id: 'fc-c2-dim-01-04',
      front: '¿Cómo evita el patrón Drill-Across el abismo de multiplicación (Chasm Trap)?',
      back: 'Agrega cada tabla de hechos en una CTE independiente hasta el grano de los atributos de la dimensión conformada común y luego une los resultados ya resumidos en relación 1:1.',
    },
  ],
  sources: [
    {
      title: 'Four-Step Dimensional Design Process',
      url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/four-4-step-design-process/',
      publisher: 'Kimball Group',
      accessed: '2026-10-29',
      supports:
        'Secuencia de cuatro pasos para diseñar modelos dimensionales centrados en procesos de negocio y declaración explícita del grano.',
    },
    {
      title: 'Enterprise Data Warehouse Bus Matrix & Conformed Dimensions',
      url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/enterprise-data-warehouse-bus-matrix/',
      publisher: 'Kimball Group',
      accessed: '2026-10-29',
      supports:
        'Arquitectura de bus empresarial, dimensiones conformadas y consultas multipaso (Drill-Across) entre tablas de hechos.',
    },
    {
      title: 'Degenerate Dimensions',
      url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/degenerate-dimension/',
      publisher: 'Kimball Group',
      accessed: '2026-10-29',
      supports:
        'Tratamiento de identificadores de cabecera transaccional (`order_id`) dentro de tablas de hechos a nivel de línea.',
    },
    {
      title: 'Dimension Surrogate Keys',
      url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/dimension-surrogate-key/',
      publisher: 'Kimball Group',
      accessed: '2026-10-29',
      supports:
        'Justificación de claves sustitutas enteras frente a claves naturales operativas en tablas de dimensión.',
    },
  ],
  aiNotes:
    'Guía al estudiante a verificar siempre el grano de cada tabla antes de escribir un JOIN. En Mercado Brisa, recalca que `orders` tiene 18,000 filas (14,760 completadas y 1,440 reembolsadas), `order_items` tiene 42,000 líneas, `payments` tiene 19,200 intentos (con 405 capturas duplicadas) y `refunds` tiene 1,450 filas sobre 1,440 órdenes. Si el usuario intenta unir `orders` y `refunds` directamente sin CTEs preagregadas, muéstrale por qué pierde los almacenes sin devoluciones y duplica órdenes con reembolsos parciales.',
  needsReview: false,
};

export default lesson;
