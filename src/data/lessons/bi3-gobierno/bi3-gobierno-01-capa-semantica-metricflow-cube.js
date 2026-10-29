export default {
  id: 'bi3-gobierno-01-capa-semantica-metricflow-cube',
  moduleId: 'bi3-gobierno',
  tracks: ['bi'],
  level: 3,
  order: 1,
  title: 'Capa semántica con MetricFlow y Cube: entidades y medidas',
  subtitle: 'Capa semántica declarativa con MetricFlow y Cube: entidades, medidas y agregaciones simétricas',
  minutes: 25,
  contentVersion: 1,
  prerequisites: [
    'bi3-dashboards-01-bi-tufte-code',
    'bi2-modelo-semantico-05-medidas-vs-columnas-calculadas',
    'de3-transformacion-03-contracts-semantic-layer'
  ],
  hook: 'En el cierre trimestral de Mercado Brisa, un analista cruza en una sola consulta SQL las tablas `orders` (14 760 pedidos completados), `order_items` (42 000 líneas) y `refunds` (1 450 devoluciones). El informe reporta 5 696 401.57 USD de ingreso bruto y 279 106.05 USD en devoluciones para la región Andina, cuando los importes reales son 1 990 554.12 USD y 115 379.23 USD. ¿Cómo evita una capa semántica declarativa con MetricFlow o Cube esta multiplicación de filas entre hechos de distinto grano?',
  objectives: [
    'Declarar modelos semánticos en dbt MetricFlow y Cube definiendo entidades primarias y foráneas, dimensiones, medidas atómicas y métricas derivadas o de razón.',
    'Explicar cómo el planificador de la capa semántica resuelve trampas de abismo (chasm traps) y fan-out preagregando cada tabla de hechos a su grano antes del cruce.',
    'Implementar en SQL sobre Mercado Brisa el plan de subconsultas preagregadas que genera MetricFlow para combinar pedidos, unidades vendidas y devoluciones por región.'
  ],
  sections: [
    {
      id: 'problema-fanout-chasm-trap',
      heading: 'El problema del fan-out y la trampa de abismo entre tablas de hechos',
      body: 'Cuando una empresa escala, la lógica de negocio suele dispersarse entre vistas SQL, libros de Tableau y modelos de Power BI. El fallo más frecuente al escribir SQL manual ocurre al unir tablas con diferente granularidad en un mismo bloque `FROM`.\n\nEn Mercado Brisa, `orders` tiene grano de cabecera con una fila por pedido. Por su parte, `order_items` tiene grano de línea y `refunds` registra devoluciones asociadas a `order_id`. Si ejecutas un `JOIN` directo entre las tres tablas para agrupar por `stores.region`, cada pedido con tres artículos triplica su importe `orders.total_usd`. Además, esa misma unión multiplica cualquier devolución registrada en `refunds.refund_amount_usd`.\n\nEste fenómeno se denomina abanico (`fan-out`) en relaciones uno a muchos. Cuando dos tablas de hechos convergen sobre una misma entidad padre, se conoce como trampa de abismo (`chasm trap`). En la región Andina, este cruce ingenuo eleva los 4 921 pedidos completados a 11 411 filas combinadas. Como resultado, el ingreso bruto salta erróneamente de 1 990 554.12 USD a 5 696 401.57 USD.',
      example: {
        language: 'sql',
        code: `WITH naive_join AS (
  SELECT
    s.region,
    COUNT(o.order_id) AS joined_rows,
    ROUND(SUM(o.total_usd), 2) AS inflated_revenue_usd,
    ROUND(COALESCE(SUM(r.refund_amount_usd), 0), 2) AS inflated_refunds_usd
  FROM stores s
  JOIN orders o ON s.store_id = o.store_id
  JOIN order_items oi ON o.order_id = oi.order_id
  LEFT JOIN refunds r ON o.order_id = r.order_id
  WHERE o.status = 'completed'
  GROUP BY s.region
),
real_orders AS (
  SELECT
    s.region,
    COUNT(o.order_id) AS real_orders,
    ROUND(SUM(o.total_usd), 2) AS real_revenue_usd
  FROM stores s
  JOIN orders o ON s.store_id = o.store_id
  WHERE o.status = 'completed'
  GROUP BY s.region
)
SELECT
  ro.region,
  ro.real_orders,
  nj.joined_rows,
  ro.real_revenue_usd,
  nj.inflated_revenue_usd,
  nj.inflated_refunds_usd
FROM real_orders ro
JOIN naive_join nj ON ro.region = nj.region
ORDER BY ro.region;`,
        expectedOutput: [
          {
            region: 'Andina',
            real_orders: 4921,
            joined_rows: 11411,
            real_revenue_usd: 1990554.12,
            inflated_revenue_usd: 5696401.57,
            inflated_refunds_usd: 279106.05
          },
          {
            region: 'Cono Sur',
            real_orders: 4920,
            joined_rows: 11378,
            real_revenue_usd: 2059786.39,
            inflated_revenue_usd: 5792409.13,
            inflated_refunds_usd: 183378.64
          },
          {
            region: 'Iberia',
            real_orders: 2811,
            joined_rows: 7065,
            real_revenue_usd: 1348369.68,
            inflated_revenue_usd: 4002687.7,
            inflated_refunds_usd: 104180.68
          },
          {
            region: 'Norteamérica',
            real_orders: 2108,
            joined_rows: 4976,
            real_revenue_usd: 870752.23,
            inflated_revenue_usd: 2511643.13,
            inflated_refunds_usd: 92577.35
          }
        ]
      }
    },
    {
      id: 'anatomia-declarativa-metricflow',
      heading: 'Anatomía declarativa en dbt MetricFlow: modelos, entidades y métricas',
      body: 'Una **capa semántica declarativa** separa la definición lógica de las métricas de la generación física del SQL. En **dbt MetricFlow**, el ingeniero analítico describe en archivos YAML un grafo semántico formado por cuatro piezas: `semantic_models`, `entities`, `measures` y `metrics`.\n\nCada `semantic_model` representa una tabla o vista de dbt y declara su dimensión de tiempo por defecto (`agg_time_dimension`). Las **entidades** (`entities`) identifican las llaves de unión entre modelos. La entidad `primary` señala la clave única de la tabla, como `order_id` en `orders`. Por su lado, las entidades `foreign` indican hacia qué otras tablas puede navegar el motor, como `store_id` hacia `stores`.\n\nLas **medidas** (`measures`) definen agregaciones atómicas sobre columnas físicas (`sum`, `count`, `count_distinct`) dentro de un único modelo semántico. Finalmente, las **métricas** (`metrics`) exponen los indicadores de negocio hacia herramientas de BI o APIs. MetricFlow soporta cinco tipos de métricas: `simple` (apunta a una medida con filtros opcionales), `ratio` (divide numerador entre denominador), `derived` (combina métricas mediante una expresión como ingreso bruto menos devoluciones), `cumulative` y `conversion`.',
      example: {
        language: 'yaml',
        code: `semantic_models:
  - name: orders_sem
    model: ref('orders')
    defaults:
      agg_time_dimension: order_date
    entities:
      - name: order_id
        type: primary
      - name: store
        type: foreign
        expr: store_id
    dimensions:
      - name: order_date
        type: time
        type_params: { time_granularity: day }
      - name: status
        type: categorical
    measures:
      - name: gross_revenue_usd
        agg: sum
        expr: total_usd
      - name: completed_orders
        agg: count
        expr: order_id

metrics:
  - name: net_revenue_usd
    type: derived
    label: "Ingreso neto (USD)"
    type_params:
      expr: gross_revenue_usd - refunded_usd
      metrics:
        - name: gross_revenue_usd
          filter: "{{ Dimension('order_id__status') }} = 'completed'"
        - name: refunded_usd`
      }
    },
    {
      id: 'cube-joins-agregacion-simetrica',
      heading: 'Modelado en Cube y resolución por subconsultas preagregadas',
      body: 'De manera similar, **Cube** estructura la capa semántica en bloques `cubes` y `views`. Los cubos definen tablas base con `measures`, `dimensions`, `joins` y `pre_aggregations`. Las vistas exponen fachadas curadas para el consumidor final. En Cube, los enlaces entre cubos declaran la direccionalidad exacta de la relación: `has_many`, `belongs_to` o `has_one`.\n\nSupongamos que un usuario solicita en una misma consulta métricas de tres cubos con granos distintos: `orders`, `order_items` y `refunds`. Si pide agruparlas por `stores.region`, tanto MetricFlow como Cube descartan el `JOIN` plano. En su lugar, el planificador semántico construye una expresión de tabla común (`CTE`) independiente por cada tabla de hechos.\n\nEn cada CTE, el motor une la tabla de hechos solo con las dimensiones necesarias para filtrar y agrupar por `s.region`. Cuando todas las CTEs tienen exactamente una fila por `region`, la consulta externa las une por la clave de agrupación (`ON o.region = i.region`). Recién en ese paso final se evalúan las métricas derivadas (`gross_revenue_usd - refunded_usd`) y de razón (`net_revenue_usd / completed_orders`) sin duplicar ningún registro.',
      example: {
        language: 'yaml',
        code: `cubes:
  - name: orders
    sql_table: public.orders
    joins:
      - name: stores
        relationship: belongs_to
        sql: "{CUBE}.store_id = {stores}.store_id"
      - name: order_items
        relationship: has_many
        sql: "{CUBE}.order_id = {order_items}.order_id"
    dimensions:
      - name: order_id
        sql: order_id
        type: number
        primary_key: true
      - name: status
        sql: status
        type: string
    measures:
      - name: completed_orders
        type: count
        filters: [{ sql: "{CUBE}.status = 'completed'" }]
      - name: gross_revenue_usd
        sql: total_usd
        type: sum
        filters: [{ sql: "{CUBE}.status = 'completed'" }]`
      }
    }
  ],
  workedExample: {
    title: 'Planificación SQL multi-hecho estilo MetricFlow y Cube por región',
    description: 'El equipo de Finanzas de Mercado Brisa solicita una tabla regional certificada que combine pedidos completados (`orders`), unidades físicas vendidas (`order_items`) e importe devuelto procesado (`refunds` con `status = \'processed\'`). Verificaremos paso a paso cómo el planificador semántico construye las CTEs por grano.',
    steps: [
      {
        label: 'Paso 1: Preagregación de orders al grano regional',
        explanation: 'Preagregamos el primer modelo semántico (`orders_sem`) al grano de `stores.region`, filtrando exclusivamente los pedidos con `status = \'completed\'`. Así cada pedido suma su `total_usd` una única vez.',
        code: `SELECT
  s.region,
  COUNT(o.order_id) AS completed_orders,
  ROUND(SUM(o.total_usd), 2) AS gross_revenue_usd
FROM stores s
JOIN orders o ON s.store_id = o.store_id
WHERE o.status = 'completed'
GROUP BY s.region
ORDER BY s.region;`,
        expectedOutput: [
          { region: 'Andina', completed_orders: 4921, gross_revenue_usd: 1990554.12 },
          { region: 'Cono Sur', completed_orders: 4920, gross_revenue_usd: 2059786.39 },
          { region: 'Iberia', completed_orders: 2811, gross_revenue_usd: 1348369.68 },
          { region: 'Norteamérica', completed_orders: 2108, gross_revenue_usd: 870752.23 }
        ]
      },
      {
        label: 'Paso 2: Preagregación independiente de order_items y refunds',
        explanation: 'En dos CTEs separadas (`items_sem` y `refunds_sem`), preagregamos las unidades de `order_items` y el monto de `refunds` procesados al mismo grano `s.region`, evitando cruzar `order_items` con `refunds` fila a fila.',
        code: `WITH items_sem AS (
  SELECT s.region, SUM(oi.qty) AS units_sold
  FROM stores s
  JOIN orders o ON s.store_id = o.store_id
  JOIN order_items oi ON o.order_id = oi.order_id
  WHERE o.status = 'completed'
  GROUP BY s.region
),
refunds_sem AS (
  SELECT s.region, ROUND(SUM(r.refund_amount_usd), 2) AS refunded_usd
  FROM stores s
  JOIN orders o ON s.store_id = o.store_id
  JOIN refunds r ON o.order_id = r.order_id
  WHERE o.status = 'completed' AND r.status = 'processed'
  GROUP BY s.region
)
SELECT i.region, i.units_sold, r.refunded_usd
FROM items_sem i
JOIN refunds_sem r ON i.region = r.region
ORDER BY i.region;`,
        expectedOutput: [
          { region: 'Andina', units_sold: 22502, refunded_usd: 115379.23 },
          { region: 'Cono Sur', units_sold: 23467, refunded_usd: 77991.82 },
          { region: 'Iberia', units_sold: 15211, refunded_usd: 43170.94 },
          { region: 'Norteamérica', units_sold: 9870, refunded_usd: 37992.53 }
        ]
      },
      {
        label: 'Paso 3: Unión 1:1 por región y cálculo de métricas derivadas y ratios',
        explanation: 'Unimos las tres CTEs preagregadas por `region` (relación 1:1 en el grano de salida) y calculamos la métrica derivada `net_revenue_usd` y la métrica de razón `net_aov_usd`.',
        code: `WITH orders_sem AS (
  SELECT s.region, COUNT(o.order_id) AS completed_orders, ROUND(SUM(o.total_usd), 2) AS gross_revenue_usd
  FROM stores s JOIN orders o ON s.store_id = o.store_id
  WHERE o.status = 'completed' GROUP BY s.region
),
items_sem AS (
  SELECT s.region, SUM(oi.qty) AS units_sold
  FROM stores s JOIN orders o ON s.store_id = o.store_id JOIN order_items oi ON o.order_id = oi.order_id
  WHERE o.status = 'completed' GROUP BY s.region
),
refunds_sem AS (
  SELECT s.region, ROUND(SUM(r.refund_amount_usd), 2) AS refunded_usd
  FROM stores s JOIN orders o ON s.store_id = o.store_id JOIN refunds r ON o.order_id = r.order_id
  WHERE o.status = 'completed' AND r.status = 'processed' GROUP BY s.region
)
SELECT
  o.region,
  o.completed_orders,
  i.units_sold,
  o.gross_revenue_usd,
  r.refunded_usd,
  ROUND(o.gross_revenue_usd - r.refunded_usd, 2) AS net_revenue_usd,
  ROUND((o.gross_revenue_usd - r.refunded_usd) / o.completed_orders, 2) AS net_aov_usd
FROM orders_sem o
JOIN items_sem i ON o.region = i.region
JOIN refunds_sem r ON o.region = r.region
ORDER BY o.region;`,
        expectedOutput: [
          {
            region: 'Andina',
            completed_orders: 4921,
            units_sold: 22502,
            gross_revenue_usd: 1990554.12,
            refunded_usd: 115379.23,
            net_revenue_usd: 1875174.89,
            net_aov_usd: 381.06
          },
          {
            region: 'Cono Sur',
            completed_orders: 4920,
            units_sold: 23467,
            gross_revenue_usd: 2059786.39,
            refunded_usd: 77991.82,
            net_revenue_usd: 1981794.57,
            net_aov_usd: 402.8
          },
          {
            region: 'Iberia',
            completed_orders: 2811,
            units_sold: 15211,
            gross_revenue_usd: 1348369.68,
            refunded_usd: 43170.94,
            net_revenue_usd: 1305198.74,
            net_aov_usd: 464.32
          },
          {
            region: 'Norteamérica',
            completed_orders: 2108,
            units_sold: 9870,
            gross_revenue_usd: 870752.23,
            refunded_usd: 37992.53,
            net_revenue_usd: 832759.7,
            net_aov_usd: 395.05
          }
        ]
      }
    ],
    audit: 'Preagregar cada modelo semántico al grano de las dimensiones solicitadas antes de unir las métricas elimina el fan-out y garantiza que las métricas derivadas y de razón sean exactas.'
  },
  checks: [
    {
      id: 'chk-bi3-gob-01-entities',
      type: 'mcq',
      prompt: 'En un archivo YAML de dbt MetricFlow para la tabla `orders`, ¿qué función cumplen los objetos declarados dentro del bloque `entities`?',
      options: [
        {
          id: 'a',
          text: 'Definen las fórmulas de agregación numérica como sumas, promedios o conteos distintos.',
          correct: false,
          feedback: 'Incorrecto. Las agregaciones numéricas sobre columnas se declaran en el bloque `measures`, no en `entities`.'
        },
        {
          id: 'b',
          text: 'Identifican las llaves primarias, foráneas o únicas que el motor utiliza para construir el grafo de joins entre modelos semánticos.',
          correct: true,
          feedback: 'Correcto. Las entidades (`primary`, `foreign`, `unique`) indican a MetricFlow cómo enlazar modelos semánticos y detectar cambios de grano.'
        },
        {
          id: 'c',
          text: 'Materializan tablas físicas particionadas por fecha dentro del almacén de datos.',
          correct: false,
          feedback: 'Incorrecto. Las entidades en MetricFlow son metadatos de enlace lógico; no crean particiones físicas por sí mismas.'
        },
        {
          id: 'd',
          text: 'Restringen qué usuarios pueden visualizar las columnas sensibles de la tabla.',
          correct: false,
          feedback: 'Incorrecto. El control de acceso a columnas corresponde a políticas de seguridad (OLS o enmascaramiento), no a la declaración de `entities`.'
        }
      ],
      explanation: 'En dbt MetricFlow, `entities` declara las claves (`primary`, `foreign`, `unique`) que conectan los `semantic_models` en el grafo y permiten planificar joins seguros sin fan-out.'
    },
    {
      id: 'chk-bi3-gob-01-fanout',
      type: 'predict-output',
      prompt: 'Un pedido (`order_id = 500`) tiene `total_usd = 200.00`, contiene 4 filas en `order_items` y registra 1 devolución en `refunds` por `refund_amount_usd = 30.00`. Si ejecutas un `JOIN` plano entre `orders`, `order_items` y `refunds` sin preagregar, ¿qué devolverán `SUM(o.total_usd)` y `SUM(r.refund_amount_usd)` para ese pedido?',
      options: [
        {
          id: 'a',
          text: 'SUM(total_usd) = 200.00 y SUM(refund_amount_usd) = 30.00',
          correct: false,
          feedback: 'Incorrecto. Al unir con 4 filas de `order_items`, tanto la fila de `orders` como la de `refunds` se repiten 4 veces.'
        },
        {
          id: 'b',
          text: 'SUM(total_usd) = 800.00 y SUM(refund_amount_usd) = 30.00',
          correct: false,
          feedback: 'Incorrecto. La fila de `refunds` también está unida por `order_id`, por lo que se multiplica igualmente por las 4 líneas de `order_items`.'
        },
        {
          id: 'c',
          text: 'SUM(total_usd) = 800.00 y SUM(refund_amount_usd) = 120.00',
          correct: true,
          feedback: 'Correcto. Las 4 filas de `order_items` generan 4 filas en el resultado del JOIN, cuadruplicando tanto los 200.00 USD del pedido como los 30.00 USD de la devolución.'
        }
      ],
      explanation: 'En un JOIN directo por `order_id`, las 4 líneas de `order_items` multiplican por 4 cada atributo de cabecera (`4 × 200 = 800`) y cada devolución asociada (`4 × 30 = 120`).'
    },
    {
      id: 'chk-bi3-gob-01-metric-types',
      type: 'fill-code',
      prompt: 'Completa la configuración YAML de MetricFlow para declarar una métrica de ticket promedio (`aov_usd`) que divide el ingreso bruto entre el conteo de pedidos, y una métrica de ingreso neto (`net_revenue_usd`) que resta las devoluciones al ingreso bruto.',
      template: 'Para calcular el cociente entre dos métricas se utiliza `type: {{blank1}}` con parámetros `numerator` y `denominator`, mientras que para combinar dos o más métricas mediante una expresión aritmética como `gross_revenue_usd - refunded_usd` se utiliza `type: {{blank2}}` sobre medidas previamente agregadas a su `{{blank3}}`.',
      blanks: [
        {
          id: 'blank1',
          accepted: ['ratio']
        },
        {
          id: 'blank2',
          accepted: ['derived']
        },
        {
          id: 'blank3',
          accepted: ['grano', 'grain', 'granularidad']
        }
      ],
      explanation: 'MetricFlow define `type: ratio` para divisiones entre numerador y denominador, y `type: derived` para expresiones algebraicas entre métricas ya resueltas a su grano.'
    }
  ],
  practice: {
    type: 'sql',
    title: 'Reconciliación multi-hecho sin fan-out por región (patrón MetricFlow / Cube)',
    prompt: 'El código inicial une `stores`, `orders`, `order_items` y `refunds` en un único bloque `FROM`, provocando un fan-out severo que infla `gross_revenue_usd` y `refunded_usd`. Reescribe la consulta aplicando el patrón de subconsultas preagregadas por grano (`region`) de MetricFlow y Cube sobre pedidos completados (`o.status = \'completed\'`) y devoluciones procesadas (`r.status = \'processed\'`). Devuelve exactamente las columnas: `region`, `completed_orders`, `units_sold`, `gross_revenue_usd`, `refunded_usd`, `net_revenue_usd` (`gross_revenue_usd - refunded_usd`, redondeado a 2 decimales) y `net_aov_usd` (`net_revenue_usd / completed_orders`, redondeado a 2 decimales), ordenadas por `region` ascendente.',
    starterCode: `-- Consulta inicial con fan-out (trampa de abismo entre orders, order_items y refunds)
-- Corrige la consulta separando cada tabla de hechos en su propia CTE agrupada por s.region
SELECT
  s.region,
  COUNT(o.order_id) AS completed_orders,
  SUM(oi.qty) AS units_sold,
  ROUND(SUM(o.total_usd), 2) AS gross_revenue_usd,
  ROUND(COALESCE(SUM(r.refund_amount_usd), 0), 2) AS refunded_usd,
  ROUND(SUM(o.total_usd) - COALESCE(SUM(r.refund_amount_usd), 0), 2) AS net_revenue_usd,
  ROUND((SUM(o.total_usd) - COALESCE(SUM(r.refund_amount_usd), 0)) / COUNT(o.order_id), 2) AS net_aov_usd
FROM stores s
JOIN orders o ON s.store_id = o.store_id
JOIN order_items oi ON o.order_id = oi.order_id
LEFT JOIN refunds r ON o.order_id = r.order_id
WHERE o.status = 'completed'
GROUP BY s.region
ORDER BY s.region ASC;`,
    solution: `WITH orders_sem AS (
  SELECT
    s.region,
    COUNT(o.order_id) AS completed_orders,
    ROUND(SUM(o.total_usd), 2) AS gross_revenue_usd
  FROM stores s
  JOIN orders o ON s.store_id = o.store_id
  WHERE o.status = 'completed'
  GROUP BY s.region
),
items_sem AS (
  SELECT
    s.region,
    SUM(oi.qty) AS units_sold
  FROM stores s
  JOIN orders o ON s.store_id = o.store_id
  JOIN order_items oi ON o.order_id = oi.order_id
  WHERE o.status = 'completed'
  GROUP BY s.region
),
refunds_sem AS (
  SELECT
    s.region,
    ROUND(SUM(r.refund_amount_usd), 2) AS refunded_usd
  FROM stores s
  JOIN orders o ON s.store_id = o.store_id
  JOIN refunds r ON o.order_id = r.order_id
  WHERE o.status = 'completed' AND r.status = 'processed'
  GROUP BY s.region
)
SELECT
  o.region,
  o.completed_orders,
  i.units_sold,
  o.gross_revenue_usd,
  r.refunded_usd,
  ROUND(o.gross_revenue_usd - r.refunded_usd, 2) AS net_revenue_usd,
  ROUND((o.gross_revenue_usd - r.refunded_usd) / o.completed_orders, 2) AS net_aov_usd
FROM orders_sem o
JOIN items_sem i ON o.region = i.region
JOIN refunds_sem r ON o.region = r.region
ORDER BY o.region ASC;`,
    solutionExplanation: 'Cada tabla de hechos (orders, order_items y refunds) se preagrega independientemente por region antes del JOIN final 1:1, eliminando la multiplicación de filas y calculando con precisión el ingreso neto y el ticket promedio neto.',
    expectedOutputTable: [
      {
        region: 'Andina',
        completed_orders: 4921,
        units_sold: 22502,
        gross_revenue_usd: 1990554.12,
        refunded_usd: 115379.23,
        net_revenue_usd: 1875174.89,
        net_aov_usd: 381.06
      },
      {
        region: 'Cono Sur',
        completed_orders: 4920,
        units_sold: 23467,
        gross_revenue_usd: 2059786.39,
        refunded_usd: 77991.82,
        net_revenue_usd: 1981794.57,
        net_aov_usd: 402.8
      },
      {
        region: 'Iberia',
        completed_orders: 2811,
        units_sold: 15211,
        gross_revenue_usd: 1348369.68,
        refunded_usd: 43170.94,
        net_revenue_usd: 1305198.74,
        net_aov_usd: 464.32
      },
      {
        region: 'Norteamérica',
        completed_orders: 2108,
        units_sold: 9870,
        gross_revenue_usd: 870752.23,
        refunded_usd: 37992.53,
        net_revenue_usd: 832759.7,
        net_aov_usd: 395.05
      }
    ],
    hints: [
      'Crea tres CTEs independientes (`orders_sem`, `items_sem` y `refunds_sem`), cada una agrupada únicamente por `s.region`.',
      'En las tres CTEs filtra `o.status = \'completed\'`, y en `refunds_sem` añade `AND r.status = \'processed\'` para sumar `r.refund_amount_usd`.',
      'En el `SELECT` final une las tres CTEs por `region` y calcula `ROUND(o.gross_revenue_usd - r.refunded_usd, 2)` y `ROUND((o.gross_revenue_usd - r.refunded_usd) / o.completed_orders, 2)`.'
    ]
  },
  roleNotes: {
    de: 'Como Data Engineer, entrega tablas físicas con llaves primarias verificadas por tests de unicidad y no nulidad en dbt (`unique`, `not_null`). Si una llave primaria declarada en `entities` tiene duplicados reales, las agregaciones simétricas y planes multi-CTE de la capa semántica producirán sumas erróneas.',
    da: 'Como Data Analyst, consume las métricas compuestas (`net_revenue_usd`, `net_aov_usd`) directamente desde la capa semántica en lugar de reconstruir joins entre `orders`, `order_items` y `refunds` en cuadernos locales, asegurando que tus análisis coincidan al centavo con los cierres financieros.',
    bi: 'Como BI Specialist, diseña los archivos YAML de MetricFlow o Cube distinguiendo con precisión entre medidas atómicas (`measures` dentro de un único modelo) y métricas derivadas o de razón (`metrics` que operan sobre medidas ya agregadas al grano de consulta).'
  },
  summary: [
    'Unir directamente tablas de hechos con distinto grano (`orders`, `order_items` y `refunds`) genera fan-out que multiplica los importes.',
    'En dbt MetricFlow y Cube, las entidades (`primary`, `foreign`) y medidas (`measures`) se declaran en YAML sobre cada tabla individual.',
    'El planificador semántico preagrega cada tabla de hechos al grano solicitado mediante CTEs separadas antes de unirlas.',
    'Las métricas `derived` y `ratio` se evalúan después de la preagregación por grano, garantizando totales y promedios exactos.'
  ],
  flashcards: [
    {
      id: 'fc-bi3-gob-01-01',
      front: '¿Qué diferencia existe entre una `measure` y una `metric` en dbt MetricFlow?',
      back: 'Una `measure` es una agregación atómica (`sum`, `count`, `count_distinct`) definida dentro de un único `semantic_model`, mientras que una `metric` es el indicador expuesto al negocio (`simple`, `ratio`, `derived`, `cumulative` o `conversion`) que puede combinar una o varias medidas.'
    },
    {
      id: 'fc-bi3-gob-01-02',
      front: '¿Cómo resuelve el planificador de MetricFlow o Cube una consulta que pide medidas de `orders`, `order_items` y `refunds` agrupadas por `region`?',
      back: 'Genera una CTE de preagregación independiente para cada tabla de hechos agrupada por `region` y luego une las CTEs por `region` en una relación 1:1 antes de evaluar métricas derivadas o ratios.'
    },
    {
      id: 'fc-bi3-gob-01-03',
      front: '¿Por qué `SUM(DISTINCT o.total_usd)` no es una solución válida frente al fan-out de un JOIN 1:N?',
      back: 'Porque si dos pedidos distintos tienen legítimamente el mismo importe en `total_usd`, la cláusula `DISTINCT` colapsa ambos importes en uno solo y subestima el ingreso total.'
    },
    {
      id: 'fc-bi3-gob-01-04',
      front: '¿Qué tipos de relación (`relationship`) declara Cube en su bloque `joins` para construir el grafo dirigido entre cubos?',
      back: 'Declara `has_many` (uno a muchos), `belongs_to` (muchos a uno) y `has_one` (uno a uno), utilizando `primary_key: true` para identificar el grano de cada cubo.'
    }
  ],
  glossaryTerms: [
    'capa-semantica-declarativa',
    'agregacion-simetrica',
    'pre-agregacion-cube'
  ],
  sources: [
    {
      title: 'dbt Documentation — About MetricFlow',
      url: 'https://docs.getdbt.com/docs/build/about-metricflow',
      publisher: 'dbt Labs',
      accessed: '2026-10-29',
      supports: 'Arquitectura del motor MetricFlow, grafo semántico y generación de planes SQL multi-hop sin fan-out.'
    },
    {
      title: 'dbt Documentation — Semantic models, entities, and measures',
      url: 'https://docs.getdbt.com/docs/build/semantic-models',
      publisher: 'dbt Labs',
      accessed: '2026-10-29',
      supports: 'Sintaxis YAML de semantic_models, tipos de entidades (primary, foreign, unique) y medidas base.'
    },
    {
      title: 'dbt Documentation — Metrics overview',
      url: 'https://docs.getdbt.com/docs/build/metrics-overview',
      publisher: 'dbt Labs',
      accessed: '2026-10-29',
      supports: 'Definición de métricas simple, ratio, derived, cumulative y conversion en dbt Semantic Layer.'
    },
    {
      title: 'Cube Documentation — Working with Joins',
      url: 'https://docs.cube.dev/docs/data-modeling/joins',
      publisher: 'Cube Dev',
      accessed: '2026-10-29',
      supports: 'Relaciones has_many, belongs_to y has_one entre cubos y prevención de trampas de abismo al cruzar múltiples tablas.'
    }
  ],
  aiNotes: 'Corrige siempre al estudiante si intenta solucionar la duplicación del JOIN entre `orders`, `order_items` y `refunds` usando `SUM(DISTINCT o.total_usd)` o dividiendo `SUM(o.total_usd) / COUNT(oi.order_item_id)` en la misma consulta plana. Explica que una orden sin ítems o con múltiples devoluciones distorsiona ese parche y guía hacia la preagregación en CTEs separadas (`orders_sem`, `items_sem`, `refunds_sem`) al grano de `s.region` antes de calcular `net_revenue_usd` y `net_aov_usd`.'
};
