const lesson = {
  id: 'da3-producto-02-cohorts-retention-ltv',
  moduleId: 'da3-producto',
  tracks: ['da'],
  level: 3,
  order: 2,
  minutes: 30,
  contentVersion: 2,
  needsReview: false,
  prerequisites: ['da3-producto-01-embudos-conversion-ventana'],
  legacyId: 'l13-cohorts-retention-ltv',
  legacyOrder: 13,
  title: 'Cohortes de retención, supervivencia y LTV con margen',
  subtitle:
    'Matrices triangulares sin sesgo de censura y cálculo del valor de vida ajustado por margen.',
  hook: 'El equipo comercial de Mercado Brisa propone pagar hasta 1.500 USD por captar cada nueva cafetería B2B porque su gasto histórico medio roza los 2.825 USD. Además, un informe trimestral afirma que las cohortes recientes retienen menos clientes cuando apenas llevan unas semanas activas. ¿Por qué ambas conclusiones destruirían la rentabilidad del negocio, y cómo corregir tanto el sesgo de censura como la inflación del LTV bruto?',
  objectives: [
    'Construir matrices triangulares de retención por cohorte de primera compra empleando edades relativas en trimestres.',
    'Prevenir el sesgo de censura por la derecha diferenciando periodos futuros no observados de caídas reales de actividad.',
    'Calcular el LTV neto en DuckDB descontando el coste unitario de producto y las devoluciones procesadas sin fan-out 1:N.',
    'Vincular la retención y el margen neto realizado con el techo sostenible de coste de adquisición de clientes (CAC).',
  ],
  visualizer: 'cohort',
  pipelineChallenge: {
    title: 'Pipeline de cohortes y LTV neto sin fugas de grano ni censura',
    prompt:
      'Ordena las etapas del pipeline analítico para estimar retención por cohorte y LTV ajustado por margen en Mercado Brisa:',
    steps: [
      {
        id: 'step-cohort-origin',
        text: 'Identificar la fecha o trimestre de primera compra completada (cohort_qtr) por cada customer_id.',
      },
      {
        id: 'step-preagg-1n',
        text: 'Preagregar en CTEs independientes el coste de mercancía (order_items x products) y las devoluciones procesadas (refunds) por order_id.',
      },
      {
        id: 'step-relative-age',
        text: 'Cruzar pedidos completados con su cohorte calculando la edad relativa (qtr_offset) mediante DATEDIFF.',
      },
      {
        id: 'step-censor-ltv',
        text: 'Enmascarar con NULL los periodos aún no transcurridos (censura por la derecha) y dividir el margen neto acumulado entre el tamaño inicial de la cohorte.',
      },
    ],
  },
  sections: [
    {
      id: 'sec-matrices-triangulares-cohortes',
      heading: 'Matrices triangulares de retención y edad relativa de cohorte',
      body: 'Las métricas globales de actividad mezclan clientes veteranos con usuarios recién captados. Si las altas nuevas crecen rápido, el porcentaje total de usuarios activos parece saludable aunque los clientes antiguos abandonen el producto en silencio.\n\nUna **cohorte de adquisición** agrupa a los clientes según el periodo en que realizaron su primera compra completada (`cohort_qtr`). A partir de ese anclaje medimos el paso del tiempo mediante un índice de edad relativa ($k = 0, 1, 2, \\dots$) calculado con `DATEDIFF(\'quarter\', cohort_qtr, order_qtr)`.\n\nAl cruzar cada cohorte en las filas con el trimestre relativo en las columnas obtenemos una **matriz triangular de retención**. El denominador de cada fila permanece fijo en el tamaño original de la cohorte en $k = 0$ (`cohort_size`). En **Mercado Brisa**, las cuatro cohortes trimestrales de `2024` conservan en su tercer trimestre posterior (`ret_q3_pct`) entre el `52,98 %` (`2024-01`) y el `63,54 %` (`2024-10`) de sus compradores iniciales.',
      example: {
        language: 'sql',
        code: `WITH completed_orders AS (
  SELECT
    customer_id,
    DATE_TRUNC('quarter', CAST(order_date AS DATE)) AS order_qtr
  FROM orders
  WHERE status = 'completed'
),
first_purchase AS (
  SELECT
    customer_id,
    MIN(order_qtr) AS cohort_qtr
  FROM completed_orders
  GROUP BY customer_id
),
cohort_sizes AS (
  SELECT
    cohort_qtr,
    COUNT(*) AS cohort_size
  FROM first_purchase
  WHERE cohort_qtr >= DATE '2024-01-01'
    AND cohort_qtr < DATE '2025-01-01'
  GROUP BY cohort_qtr
),
cohort_activity AS (
  SELECT
    fp.cohort_qtr,
    DATEDIFF('quarter', fp.cohort_qtr, co.order_qtr) AS qtr_offset,
    COUNT(DISTINCT co.customer_id) AS active_customers
  FROM first_purchase fp
  JOIN completed_orders co ON fp.customer_id = co.customer_id
  WHERE fp.cohort_qtr >= DATE '2024-01-01'
    AND fp.cohort_qtr < DATE '2025-01-01'
    AND DATEDIFF('quarter', fp.cohort_qtr, co.order_qtr) BETWEEN 0 AND 3
  GROUP BY fp.cohort_qtr, qtr_offset
)
SELECT
  STRFTIME(cs.cohort_qtr, '%Y-%m') AS cohort_quarter,
  cs.cohort_size,
  MAX(CASE WHEN ca.qtr_offset = 0 THEN ROUND(100.0 * ca.active_customers / cs.cohort_size, 2) END) AS ret_q0_pct,
  MAX(CASE WHEN ca.qtr_offset = 1 THEN ROUND(100.0 * ca.active_customers / cs.cohort_size, 2) END) AS ret_q1_pct,
  MAX(CASE WHEN ca.qtr_offset = 2 THEN ROUND(100.0 * ca.active_customers / cs.cohort_size, 2) END) AS ret_q2_pct,
  MAX(CASE WHEN ca.qtr_offset = 3 THEN ROUND(100.0 * ca.active_customers / cs.cohort_size, 2) END) AS ret_q3_pct
FROM cohort_sizes cs
JOIN cohort_activity ca ON cs.cohort_qtr = ca.cohort_qtr
GROUP BY cs.cohort_qtr, cs.cohort_size
ORDER BY cs.cohort_qtr;`,
        expectedOutput: [
          { cohort_quarter: '2024-01', cohort_size: 470, ret_q0_pct: 100, ret_q1_pct: 51.49, ret_q2_pct: 58.94, ret_q3_pct: 52.98 },
          { cohort_quarter: '2024-04', cohort_size: 401, ret_q0_pct: 100, ret_q1_pct: 56.11, ret_q2_pct: 56.11, ret_q3_pct: 61.6 },
          { cohort_quarter: '2024-07', cohort_size: 218, ret_q0_pct: 100, ret_q1_pct: 58.72, ret_q2_pct: 63.3, ret_q3_pct: 61.93 },
          { cohort_quarter: '2024-10', cohort_size: 96, ret_q0_pct: 100, ret_q1_pct: 58.33, ret_q2_pct: 69.79, ret_q3_pct: 63.54 },
        ],
      },
    },
    {
      id: 'sec-censura-derecha-supervivencia',
      heading: 'Censura por la derecha y retención neta de ingresos (NRR)',
      body: 'En análisis de supervivencia llamamos **censura por la derecha** al truncamiento que ocurre cuando la ventana de observación del dataset termina antes de que una cohorte cumpla la edad evaluada.\n\nEn **Mercado Brisa**, el último pedido registrado data del `2025-11-26`. Por tanto, la cohorte captada en `2025-04` aún no ha completado su segundo trimestre posterior (`Q+2`), y la cohorte de `2025-07` ni siquiera ha cerrado `Q+1`. Si rellenas las celdas incompletas con `0` usando `COALESCE(..., 0)` y promedias la columna `Q+3`, hundirás artificialmente la curva de supervivencia de la empresa.\n\nAdemás de contar clientes activos (retención de logotipos), debemos evaluar la **retención neta de ingresos (NRR)**. Una cohorte puede retener al `60 %` de sus compradores pero superar el `100 %` de NRR si quienes permanecen amplían sus pedidos a lotes de mayor valor.',
    },
    {
      id: 'sec-ltv-margen-neto-sin-fanout',
      heading: 'LTV ajustado por margen neto y devoluciones sin fan-out 1:N',
      body: 'El valor de vida del cliente (**LTV**) determina cuánto podemos invertir en captación (`CAC`). Calcular el LTV sumando únicamente la facturación bruta (`orders.total_usd`) es un error financiero grave: pagamos adquisición con margen de contribución real, no con ingresos brutos.\n\nPara obtener el **LTV ajustado por margen neto** en **Mercado Brisa** debemos restar dos componentes a los pedidos con `status = \'completed\'`:\n\n1. **Coste de mercancía vendida (COGS)**: multiplicando `qty * unit_cost_usd` entre `order_items` (`42.000` líneas) y `products` (`180` SKUs).\n\n2. **Devoluciones procesadas**: sumando `refund_amount_usd` en `refunds` (`1.450` filas con `status = \'processed\'`).\n\nComo un pedido tiene hasta cuatro líneas en `order_items` y hasta dos devoluciones parciales en `refunds`, hacer un `JOIN` directo entre `orders`, `order_items` y `refunds` provoca una explosión cartesiana (**fan-out `1:N`**) que multiplica `orders.total_usd`. La regla técnica obligatoria consiste en preagregar el coste y los reembolsos al grano de `order_id` en CTEs separadas antes de unirlos con `orders`.',
    },
  ],
  workedExample: {
    title: 'Cálculo de LTV bruto frente a LTV neto de margen en Mercado Brisa',
    description:
      'Comparamos el LTV bruto frente al LTV neto de margen y devoluciones por segmento de cliente en Mercado Brisa, demostrando por qué el techo de CAC de cafeteria_b2b no puede fijarse en 1.500 USD.',
    audit:
      'En cafeteria_b2b el LTV bruto es 2.825,71 USD, pero el LTV neto de margen es 1.439,14 USD. Pagar un CAC de 1.500 USD provocaría una pérdida neta directa de 60,86 USD por cliente captado.',
    steps: [
      {
        label: 'Paso 1: Preagregar el coste de mercancía (COGS) y las devoluciones al grano de order_id',
        explanation:
          'Colapsamos order_items unido con products por order_id para obtener cogs_usd, y colapsamos refunds (filtrando status = \'processed\') por order_id para obtener refunded_usd. Así garantizamos relación 1:1 con orders.',
        code: `WITH order_cogs AS (
  SELECT
    oi.order_id,
    SUM(oi.qty * p.unit_cost_usd) AS cogs_usd
  FROM order_items oi
  JOIN products p ON oi.product_id = p.product_id
  GROUP BY oi.order_id
),
order_refunds AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS refunded_usd
  FROM refunds
  WHERE status = 'processed'
  GROUP BY order_id
)
SELECT
  COUNT(*) AS orders_with_cogs,
  (SELECT COUNT(*) FROM order_refunds) AS orders_with_refunds
FROM order_cogs;`,
        expectedOutput: [
          { orders_with_cogs: 18000, orders_with_refunds: 1150 },
        ],
      },
      {
        label: 'Paso 2: Calcular el LTV bruto y el LTV neto por cliente y promediar por segmento',
        explanation:
          'Unimos customers con sus pedidos completados y las dos CTEs preagregadas. Restamos COGS y devoluciones al ingreso bruto de cada cliente y agregamos por segment.',
        code: `WITH order_cogs AS (
  SELECT
    oi.order_id,
    SUM(oi.qty * p.unit_cost_usd) AS cogs_usd
  FROM order_items oi
  JOIN products p ON oi.product_id = p.product_id
  GROUP BY oi.order_id
),
order_refunds AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS refunded_usd
  FROM refunds
  WHERE status = 'processed'
  GROUP BY order_id
),
customer_ltv AS (
  SELECT
    c.customer_id,
    c.segment,
    COALESCE(SUM(o.total_usd), 0) AS gross_rev_usd,
    COALESCE(SUM(oc.cogs_usd), 0) AS total_cogs_usd,
    COALESCE(SUM(orf.refunded_usd), 0) AS total_refunds_usd,
    COALESCE(SUM(o.total_usd), 0)
      - COALESCE(SUM(oc.cogs_usd), 0)
      - COALESCE(SUM(orf.refunded_usd), 0) AS net_margin_usd
  FROM customers c
  LEFT JOIN orders o
    ON c.customer_id = o.customer_id
   AND o.status = 'completed'
  LEFT JOIN order_cogs oc ON o.order_id = oc.order_id
  LEFT JOIN order_refunds orf ON o.order_id = orf.order_id
  GROUP BY c.customer_id, c.segment
)
SELECT
  segment,
  COUNT(*) AS customers,
  ROUND(AVG(gross_rev_usd), 2) AS avg_gross_ltv_usd,
  ROUND(AVG(net_margin_usd), 2) AS avg_margin_ltv_usd,
  ROUND(100.0 * SUM(net_margin_usd) / SUM(gross_rev_usd), 2) AS net_margin_pct
FROM customer_ltv
GROUP BY segment
ORDER BY avg_margin_ltv_usd DESC;`,
        expectedOutput: [
          { segment: 'cafeteria_b2b', customers: 467, avg_gross_ltv_usd: 2825.71, avg_margin_ltv_usd: 1439.14, net_margin_pct: 50.93 },
          { segment: 'pro_barista', customers: 966, avg_gross_ltv_usd: 2601.38, avg_margin_ltv_usd: 1295.9, net_margin_pct: 49.82 },
          { segment: 'retail', customers: 967, avg_gross_ltv_usd: 2520.09, avg_margin_ltv_usd: 1265.62, net_margin_pct: 50.22 },
        ],
      },
    ],
  },
  checks: [
    {
      id: 'chk-da3-prod-02-censor',
      type: 'mcq',
      prompt:
        'Al construir una tabla de retención trimestral con corte de datos en noviembre de 2025, ¿cómo debes tratar el trimestre relativo Q+2 de la cohorte adquirida en julio de 2025?',
      options: [
        {
          id: 'a',
          text: 'Imputar 0 % con COALESCE para que todas las filas tengan cuatro columnas numéricas completas.',
          correct: false,
          feedback:
            'Incorrecto. Rellenar con cero asume que todos los clientes abandonaron en un trimestre que aún no ha ocurrido.',
        },
        {
          id: 'b',
          text: 'Dejar la celda en NULL porque ese horizonte temporal está censurado por la derecha y aún no se ha observado.',
          correct: true,
          feedback:
            'Correcto. En SQL, AVG() ignora los valores NULL y evita sesgar a la baja la retención media del trimestre Q+2.',
        },
        {
          id: 'c',
          text: 'Copiar el valor de Q+1 asumiendo que ningún cliente abandonará en el trimestre siguiente.',
          correct: false,
          feedback:
            'Incorrecto. Proyectar retención constante sin datos observados sobreestima artificialmente la supervivencia.',
        },
      ],
      explanation:
        'La censura por la derecha ocurre cuando el horizonte de evaluación supera la fecha máxima del dataset. Dejar NULL distingue la ausencia de observación de una caída real a cero.',
    },
    {
      id: 'chk-da3-prod-02-fanout',
      type: 'predict-output',
      prompt:
        'Un pedido completado tiene total_usd = 100 USD, consta de 3 líneas en order_items y registra 2 devoluciones parciales en refunds. Si ejecutas SUM(o.total_usd) haciendo JOIN directo entre orders, order_items y refunds sin preagregar, ¿qué ingreso bruto suma ese único pedido?',
      options: [
        {
          id: 'a',
          text: '600 USD (porque el producto cartesiano 3 x 2 genera 6 filas para el mismo pedido)',
          correct: true,
          feedback:
            'Correcto. Las 3 líneas de detalle multiplicadas por las 2 filas de devolución producen 6 filas y multiplican por 6 el total de la cabecera.',
        },
        {
          id: 'b',
          text: '100 USD (porque DuckDB detecta automáticamente la clave primaria de orders)',
          correct: false,
          feedback:
            'Incorrecto. SUM(o.total_usd) suma el valor en cada fila resultante del JOIN, sin deduplicar por order_id.',
        },
        {
          id: 'c',
          text: '300 USD (porque solo order_items multiplica las filas de orders)',
          correct: false,
          feedback:
            'Incorrecto. Tanto order_items (3 filas) como refunds (2 filas) tienen relación 1:N con el pedido, generando 3 x 2 = 6 combinaciones.',
        },
      ],
      explanation:
        'Al unir dos tablas detalle 1:N contra la misma cabecera sin preagregar en CTEs por order_id, se produce un fan-out multiplicativo de 3 x 2 = 6 filas, inflando 100 USD a 600 USD.',
    },
    {
      id: 'chk-da3-prod-02-fill',
      type: 'fill-code',
      prompt:
        'Completa la expresión en DuckDB para calcular cuántos trimestres han transcurrido entre el trimestre de primera compra (fp.cohort_qtr) y el trimestre del pedido actual (co.order_qtr):',
      template: 'DATEDIFF(___, fp.cohort_qtr, co.order_qtr) AS qtr_offset',
      blanks: [
        {
          id: 'b1',
          accepted: ["'quarter'", '"quarter"'],
        },
      ],
      explanation:
        'La función DATEDIFF(\'quarter\', fecha_inicio, fecha_fin) devuelve el número entero de fronteras trimestrales entre la cohorte de origen y el pedido observado.',
    },
  ],
  practice: {
    type: 'sql',
    title: 'LTV bruto frente a LTV neto de margen por segmento',
    language: 'sql',
    prompt:
      'Calcula por `segment` en **Mercado Brisa** el total de clientes (`customers`), el LTV bruto medio (`avg_gross_ltv_usd`), el LTV neto de margen medio (`avg_margin_ltv_usd`, restando el coste `qty * unit_cost_usd` de `order_items`/`products` y las devoluciones con `status = \'processed\'` de `refunds` sobre pedidos con `status = \'completed\'`) y el porcentaje de margen neto realizado (`net_margin_pct`), redondeados a 2 decimales y ordenados por `avg_margin_ltv_usd DESC`. Asegúrate de incluir en el denominador a todos los clientes de `customers` (incluso si no tienen pedidos completados) y de evitar el fan-out `1:N`.',
    starterCode: `WITH order_cogs AS (
  SELECT
    oi.order_id,
    SUM(oi.qty * p.unit_cost_usd) AS cogs_usd
  FROM order_items oi
  JOIN products p ON oi.product_id = p.product_id
  GROUP BY oi.order_id
),
order_refunds AS (
  -- TODO 1: Preagrega refund_amount_usd por order_id filtrando status = 'processed'
  SELECT
    order_id,
    0.0 AS refunded_usd
  FROM refunds
  GROUP BY order_id
),
customer_ltv AS (
  SELECT
    c.customer_id,
    c.segment,
    COALESCE(SUM(o.total_usd), 0) AS gross_rev_usd,
    -- TODO 2: Calcula net_margin_usd restando cogs_usd y refunded_usd a total_usd
    COALESCE(SUM(o.total_usd), 0) AS net_margin_usd
  FROM customers c
  LEFT JOIN orders o
    ON c.customer_id = o.customer_id
   AND o.status = 'completed'
  LEFT JOIN order_cogs oc ON o.order_id = oc.order_id
  LEFT JOIN order_refunds orf ON o.order_id = orf.order_id
  GROUP BY c.customer_id, c.segment
)
SELECT
  segment,
  COUNT(*) AS customers,
  ROUND(AVG(gross_rev_usd), 2) AS avg_gross_ltv_usd,
  ROUND(AVG(net_margin_usd), 2) AS avg_margin_ltv_usd,
  ROUND(100.0 * SUM(net_margin_usd) / SUM(gross_rev_usd), 2) AS net_margin_pct
FROM customer_ltv
GROUP BY segment
ORDER BY avg_margin_ltv_usd DESC;`,
    expected: `WITH order_cogs AS (
  SELECT
    oi.order_id,
    SUM(oi.qty * p.unit_cost_usd) AS cogs_usd
  FROM order_items oi
  JOIN products p ON oi.product_id = p.product_id
  GROUP BY oi.order_id
),
order_refunds AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS refunded_usd
  FROM refunds
  WHERE status = 'processed'
  GROUP BY order_id
),
customer_ltv AS (
  SELECT
    c.customer_id,
    c.segment,
    COALESCE(SUM(o.total_usd), 0) AS gross_rev_usd,
    COALESCE(SUM(oc.cogs_usd), 0) AS total_cogs_usd,
    COALESCE(SUM(orf.refunded_usd), 0) AS total_refunds_usd,
    COALESCE(SUM(o.total_usd), 0)
      - COALESCE(SUM(oc.cogs_usd), 0)
      - COALESCE(SUM(orf.refunded_usd), 0) AS net_margin_usd
  FROM customers c
  LEFT JOIN orders o
    ON c.customer_id = o.customer_id
   AND o.status = 'completed'
  LEFT JOIN order_cogs oc ON o.order_id = oc.order_id
  LEFT JOIN order_refunds orf ON o.order_id = orf.order_id
  GROUP BY c.customer_id, c.segment
)
SELECT
  segment,
  COUNT(*) AS customers,
  ROUND(AVG(gross_rev_usd), 2) AS avg_gross_ltv_usd,
  ROUND(AVG(net_margin_usd), 2) AS avg_margin_ltv_usd,
  ROUND(100.0 * SUM(net_margin_usd) / SUM(gross_rev_usd), 2) AS net_margin_pct
FROM customer_ltv
GROUP BY segment
ORDER BY avg_margin_ltv_usd DESC;`,
    expectedOutputTable: [
      { segment: 'cafeteria_b2b', customers: 467, avg_gross_ltv_usd: 2825.71, avg_margin_ltv_usd: 1439.14, net_margin_pct: 50.93 },
      { segment: 'pro_barista', customers: 966, avg_gross_ltv_usd: 2601.38, avg_margin_ltv_usd: 1295.9, net_margin_pct: 49.82 },
      { segment: 'retail', customers: 967, avg_gross_ltv_usd: 2520.09, avg_margin_ltv_usd: 1265.62, net_margin_pct: 50.22 },
    ],
    orderMatters: true,
    hints: [
      'En la CTE order_refunds suma SUM(refund_amount_usd) AS refunded_usd desde refunds incluyendo WHERE status = \'processed\' antes de GROUP BY order_id.',
      'En customer_ltv calcula COALESCE(SUM(o.total_usd), 0) - COALESCE(SUM(oc.cogs_usd), 0) - COALESCE(SUM(orf.refunded_usd), 0) AS net_margin_usd.',
      'Mantén el LEFT JOIN desde customers hacia orders (con o.status = \'completed\' en la cláusula ON) para conservar los 2.400 clientes registrados.',
    ],
    solution: `WITH order_cogs AS (
  SELECT
    oi.order_id,
    SUM(oi.qty * p.unit_cost_usd) AS cogs_usd
  FROM order_items oi
  JOIN products p ON oi.product_id = p.product_id
  GROUP BY oi.order_id
),
order_refunds AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS refunded_usd
  FROM refunds
  WHERE status = 'processed'
  GROUP BY order_id
),
customer_ltv AS (
  SELECT
    c.customer_id,
    c.segment,
    COALESCE(SUM(o.total_usd), 0) AS gross_rev_usd,
    COALESCE(SUM(oc.cogs_usd), 0) AS total_cogs_usd,
    COALESCE(SUM(orf.refunded_usd), 0) AS total_refunds_usd,
    COALESCE(SUM(o.total_usd), 0)
      - COALESCE(SUM(oc.cogs_usd), 0)
      - COALESCE(SUM(orf.refunded_usd), 0) AS net_margin_usd
  FROM customers c
  LEFT JOIN orders o
    ON c.customer_id = o.customer_id
   AND o.status = 'completed'
  LEFT JOIN order_cogs oc ON o.order_id = oc.order_id
  LEFT JOIN order_refunds orf ON o.order_id = orf.order_id
  GROUP BY c.customer_id, c.segment
)
SELECT
  segment,
  COUNT(*) AS customers,
  ROUND(AVG(gross_rev_usd), 2) AS avg_gross_ltv_usd,
  ROUND(AVG(net_margin_usd), 2) AS avg_margin_ltv_usd,
  ROUND(100.0 * SUM(net_margin_usd) / SUM(gross_rev_usd), 2) AS net_margin_pct
FROM customer_ltv
GROUP BY segment
ORDER BY avg_margin_ltv_usd DESC;`,
    solutionExplanation:
      'Al preagregar order_cogs y order_refunds por order_id eliminamos el fan-out 1:N. El resultado demuestra que el margen neto realizado representa aproximadamente la mitad del ingreso bruto en cada segmento (50,93 % en cafeteria_b2b, 49,82 % en pro_barista y 50,22 % en retail).',
  },
  roleNotes: {
    de: 'Publica tablas intermedias consolidadas al grano de order_id con el coste de mercancía vendida y las devoluciones ya preagregadas para impedir errores de fan-out en las consultas de los analistas.',
    da: 'Verifica siempre la fecha máxima de observación antes de agregar cohortes trimestrales y exige descontar tanto el coste unitario de producto como los reembolsos procesados al reportar ratios LTV:CAC.',
    bi: 'Configura las matrices de cohortes en el tablero para renderizar celdas futuras como espacios en blanco (NULL) en lugar de ceros que distorsionen la escala de color del mapa de calor.',
  },
  summary: [
    'Una matriz triangular de retención agrupa clientes por su primera compra y mide su supervivencia en edades relativas.',
    'La censura por la derecha exige dejar en NULL los periodos no concluidos para no confundir futuro con abandono.',
    'La retención neta de ingresos (NRR) complementa la retención de clientes incorporando expansiones y contracciones de gasto.',
    'El LTV financiero debe calcularse sobre margen neto descontando COGS y devoluciones preagregadas por pedido sin fan-out.',
  ],
  flashcards: [
    {
      id: 'fc-da3-prod-02-01',
      front: '¿Qué es la censura por la derecha en una matriz de cohortes y cómo se representa en SQL?',
      back: 'Es la falta de observación de periodos futuros cuando la edad de la cohorte supera la fecha de corte de los datos; se representa con NULL para no sesgar los promedios.',
    },
    {
      id: 'fc-da3-prod-02-02',
      front: '¿Por qué no debes unir orders directamente con order_items y refunds al calcular el LTV?',
      back: 'Porque ambas tablas tienen relación 1:N con orders y provocan un fan-out multiplicativo que infla SUM(orders.total_usd).',
    },
    {
      id: 'fc-da3-prod-02-03',
      front: '¿Cómo puede una cohorte tener un 60 % de retención de clientes pero superar el 100 % de retención neta de ingresos (NRR)?',
      back: 'Cuando la expansión de gasto de los clientes que permanecen activos supera los ingresos perdidos por los clientes que abandonaron.',
    },
  ],
  glossaryTerms: [
    'matriz-retencion-triangular',
    'ltv-margen-neto',
    'retencion-neta-ingresos',
  ],
  sources: [
    {
      title: 'Survival Analysis with lifelines (Kaplan-Meier & Right-Censoring)',
      url: 'https://lifelines.readthedocs.io/en/latest/Survival%20analysis%20with%20lifelines.html',
      publisher: 'lifelines',
      accessed: '2026-10-29',
      supports: 'Formulación de curvas de supervivencia y tratamiento estadístico de observaciones con censura por la derecha.',
    },
    {
      title: 'Counting Your Customers the Easy Way: An Alternative to the Pareto/NBD Model',
      url: 'https://www.brucehardie.com/papers/018/fader_et_al_mksc_05.pdf',
      publisher: 'Marketing Science (Fader, Hardie & Lee)',
      accessed: '2026-10-29',
      supports: 'Dinámica de retención y valor de vida del cliente en comercios no contractuales.',
    },
    {
      title: 'Retention — Product Analytics Documentation',
      url: 'https://posthog.com/docs/product-analytics/retention',
      publisher: 'PostHog',
      accessed: '2026-10-29',
      supports: 'Construcción de tablas triangulares de retención por cohorte y edad relativa.',
    },
    {
      title: 'Window Functions — DuckDB SQL Documentation',
      url: 'https://duckdb.org/docs/sql/functions/window_functions.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Agregaciones por partición y funciones analíticas para seguimiento longitudinal de cohortes.',
    },
  ],
  aiNotes:
    'Recuerda al estudiante que en esta lección trabajamos exclusivamente con las tablas reales de Mercado Brisa (customers, orders, order_items, products, refunds). Si su LTV neto no coincide, revisa si preagregó order_refunds filtrando status = \'processed\' por order_id.',
};

export default lesson;
