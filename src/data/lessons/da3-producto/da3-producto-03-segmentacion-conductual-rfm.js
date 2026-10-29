const lesson = {
  id: 'da3-producto-03-segmentacion-conductual-rfm',
  moduleId: 'da3-producto',
  tracks: ['da'],
  level: 3,
  order: 3,
  minutes: 20,
  contentVersion: 2,
  needsReview: false,
  prerequisites: ['da3-producto-02-cohorts-retention-ltv'],
  title: 'Segmentación conductual y RFM: recencia, frecuencia y valor',
  subtitle: 'Segmentación conductual y RFM (recencia, frecuencia y valor monetario)',
  hook: 'El equipo de CRM de Mercado Brisa envía el mismo cupón genérico del 15 % a todas las cafeterías B2B asumiendo que su etiqueta de registro garantiza actividad constante. Al auditar los pedidos reales descubres que una cuarta parte de esas cuentas lleva más de seis meses sin comprar, mientras cientos de clientes históricos con más de 3.600 USD de gasto acumulado están a punto de perderse. ¿Cómo transformar el historial transaccional en una matriz RFM accionable que priorice a quién retener hoy?',
  objectives: [
    'Contrastes las etiquetas demográficas estáticas frente a la segmentación conductual basada en transacciones reales.',
    'Calcular en DuckDB las métricas de Recencia, Frecuencia y Valor Monetario respecto a una fecha de corte reproducible.',
    'Discretizar clientes mediante NTILE(4) cuidando la inversión de signo en la recencia y el desempate determinista.',
    'Interpretar las curvas de isovalor RFM-CLV para priorizar campañas sobre clientes de alto valor en riesgo.',
  ],
  sections: [
    {
      id: 'sec-estatico-vs-conductual-rfm',
      heading: 'Límites de la segmentación estática y las tres dimensiones RFM',
      body: 'Las etiquetas capturadas durante el alta del cliente, como `customers.segment` (`retail`, `pro_barista`, `cafeteria_b2b`), describen quién era el usuario cuando se registró, pero no cómo interactúa hoy con el negocio.\n\nEn **Mercado Brisa**, al fijar como fecha de referencia reproducible el `2025-12-01` (cinco días después del último pedido del dataset), comprobamos que entre el `22,01 %` y el `25,69 %` de los compradores de cada categoría llevan más de `180` días inactivos.\n\nEl modelo **RFM** resume la salud conductual de cada comprador activo mediante tres estadísticas suficientes sobre sus pedidos con `status = \'completed\'`:\n\n1. **Recencia ($R$)**: días transcurridos desde su última compra hasta la fecha de corte (`DATEDIFF(\'day\', MAX(order_date), DATE \'2025-12-01\')`).\n\n2. **Frecuencia ($F$)**: número total de pedidos completados (`COUNT(order_id)`).\n\n3. **Valor Monetario ($M$)**: facturación acumulada por el cliente (`SUM(total_usd)`).',
      example: {
        language: 'sql',
        code: `WITH rfm_base AS (
  SELECT
    c.customer_id,
    c.segment AS catalog_segment,
    DATEDIFF('day', MAX(CAST(o.order_date AS DATE)), DATE '2025-12-01') AS recency_days,
    COUNT(o.order_id) AS frequency_orders,
    SUM(o.total_usd) AS monetary_usd
  FROM customers c
  JOIN orders o
    ON c.customer_id = o.customer_id
   AND o.status = 'completed'
  GROUP BY c.customer_id, c.segment
)
SELECT
  catalog_segment,
  COUNT(*) AS active_buyers,
  COUNT(*) FILTER (WHERE recency_days <= 90) AS active_last_90d,
  COUNT(*) FILTER (WHERE recency_days > 180) AS dormant_over_180d,
  ROUND(100.0 * COUNT(*) FILTER (WHERE recency_days > 180) / COUNT(*), 2) AS dormant_pct,
  ROUND(AVG(monetary_usd), 2) AS avg_monetary_usd
FROM rfm_base
GROUP BY catalog_segment
ORDER BY avg_monetary_usd DESC;`,
        expectedOutput: [
          { catalog_segment: 'cafeteria_b2b', active_buyers: 432, active_last_90d: 205, dormant_over_180d: 111, dormant_pct: 25.69, avg_monetary_usd: 3054.64 },
          { catalog_segment: 'pro_barista', active_buyers: 936, active_last_90d: 476, dormant_over_180d: 206, dormant_pct: 22.01, avg_monetary_usd: 2684.76 },
          { catalog_segment: 'retail', active_buyers: 924, active_last_90d: 450, dormant_over_180d: 231, dormant_pct: 25, avg_monetary_usd: 2637.36 },
        ],
      },
    },
    {
      id: 'sec-ntile-polaridad-isovalor',
      heading: 'Cuantiles con NTILE(4), polaridad de recencia y curvas de isovalor',
      body: 'Para clasificar a los `2.292` compradores con pedidos completados dividimos cada métrica en cuatro cuartiles del `1` (peor desempeño) al `4` (mejor desempeño) usando la función de ventana `NTILE(4)`.\n\nAquí es crítico respetar la **polaridad de cada dimensión**. En frecuencia y valor monetario, un número mayor es mejor, por lo que ordenamos en sentido ascendente (`ORDER BY frequency_orders ASC` y `ORDER BY monetary_usd ASC`). En cambio, en recencia un menor número de días desde la última compra indica mayor frescura; por tanto, debemos invertir la ordenación con `ORDER BY recency_days DESC` para que quienes compraron hace pocos días reciban `r_score = 4`.\n\nAdemás, dado que muchos clientes empatan en número de pedidos o días de recencia, añadimos siempre `customer_id ASC` como criterio de desempate determinista.\n\nComo demostraron Fader, Hardie y Lee mediante **curvas de isovalor RFM-CLV**, la relación entre frecuencia y recencia no es lineal: un cliente que compró diez veces en el pasado pero lleva seis meses ausente tiene menor probabilidad de seguir activo que uno con cinco compras realizadas el mes pasado. Por ello los clientes con alta frecuencia o gasto histórico pero `r_score <= 2` conforman el grupo crítico **En Riesgo de Alto Valor**.',
    },
    {
      id: 'sec-accionabilidad-matriz-rfm',
      heading: 'Priorización comercial y concentración de ingresos por segmento RFM',
      body: 'Combinando los tres cuartiles mediante una expresión `CASE WHEN` jerárquica obtenemos cinco segmentos operativos mutuamente excluyentes en **Mercado Brisa**.\n\nLos resultados revelan una oportunidad de negocio contundente. Los segmentos activos de cabeza, `1_Campeones` (`105` clientes con `$5.058,77` de gasto medio) y `2_Leales` (`613` clientes con `$3.396,75`), aportan juntos el `41,68 %` de la facturación histórica y no necesitan descuentos agresivos que erosionen el margen.\n\nPor el contrario, el segmento `3_En_Riesgo_Alto_Valor` reúne a `445` clientes con un promedio de `8,37` pedidos y `$3.685,18` de gasto por cuenta (`$1.639.906,25` en total, equivalente al `26,16 %` de los ingresos de la empresa), pero cuya recencia media se ha degradado hasta `180,3` días. Concentrar el presupuesto de retención en estos `445` clientes ofrece un retorno esperado muy superior a dispersar cupones entre los `701` usuarios de `5_Inactivos_Bajo_Valor`.',
    },
  ],
  workedExample: {
    title: 'Segmentación RFM y concentración de ingresos en Mercado Brisa',
    description:
      'Construimos la tabla de puntuaciones RFM y cuantificamos cuántos clientes y qué porcentaje del ingreso total de Mercado Brisa se encuentran en el segmento 3_En_Riesgo_Alto_Valor a fecha 2025-12-01.',
    audit:
      'Los 445 clientes en 3_En_Riesgo_Alto_Valor generaron más de un cuarto de los ingresos de la compañía (26,16 %) pero acumulan 180,3 días de recencia media: ahí debe dirigirse la campaña de recuperación.',
    steps: [
      {
        label: 'Paso 1: Calcular las métricas base R, F y M y sus cuartiles deterministas para los primeros clientes',
        explanation:
          'Agrupamos los pedidos completados por customer_id midiendo los días hasta 2025-12-01 y aplicamos NTILE(4) con la dirección correcta y desempate por customer_id.',
        code: `WITH rfm_base AS (
  SELECT
    customer_id,
    DATEDIFF('day', MAX(CAST(order_date AS DATE)), DATE '2025-12-01') AS recency_days,
    COUNT(order_id) AS frequency_orders,
    ROUND(SUM(total_usd), 2) AS monetary_usd
  FROM orders
  WHERE status = 'completed'
  GROUP BY customer_id
),
rfm_scores AS (
  SELECT
    customer_id,
    recency_days,
    frequency_orders,
    monetary_usd,
    NTILE(4) OVER (ORDER BY recency_days DESC, customer_id ASC) AS r_score,
    NTILE(4) OVER (ORDER BY frequency_orders ASC, monetary_usd ASC, customer_id ASC) AS f_score,
    NTILE(4) OVER (ORDER BY monetary_usd ASC, customer_id ASC) AS m_score
  FROM rfm_base
)
SELECT *
FROM rfm_scores
ORDER BY customer_id
LIMIT 5;`,
        expectedOutput: [
          { customer_id: 1, recency_days: 342, frequency_orders: 6, monetary_usd: 1983.5, r_score: 1, f_score: 2, m_score: 2 },
          { customer_id: 2, recency_days: 213, frequency_orders: 6, monetary_usd: 1588.1, r_score: 1, f_score: 2, m_score: 1 },
          { customer_id: 3, recency_days: 70, frequency_orders: 7, monetary_usd: 2752.38, r_score: 3, f_score: 3, m_score: 3 },
          { customer_id: 4, recency_days: 76, frequency_orders: 6, monetary_usd: 3827.27, r_score: 3, f_score: 2, m_score: 4 },
          { customer_id: 5, recency_days: 68, frequency_orders: 7, monetary_usd: 4097.26, r_score: 3, f_score: 3, m_score: 4 },
        ],
      },
      {
        label: 'Paso 2: Clasificar en los 5 segmentos conductuales y calcular la cuota de ingresos con función de ventana',
        explanation:
          'Aplicamos la regla CASE WHEN y dividimos SUM(monetary_usd) de cada grupo entre SUM(SUM(monetary_usd)) OVER () para obtener el peso financiero de cada segmento.',
        code: `WITH rfm_base AS (
  SELECT
    customer_id,
    DATEDIFF('day', MAX(CAST(order_date AS DATE)), DATE '2025-12-01') AS recency_days,
    COUNT(order_id) AS frequency_orders,
    ROUND(SUM(total_usd), 2) AS monetary_usd
  FROM orders
  WHERE status = 'completed'
  GROUP BY customer_id
),
rfm_scores AS (
  SELECT
    customer_id,
    recency_days,
    frequency_orders,
    monetary_usd,
    NTILE(4) OVER (ORDER BY recency_days DESC, customer_id ASC) AS r_score,
    NTILE(4) OVER (ORDER BY frequency_orders ASC, monetary_usd ASC, customer_id ASC) AS f_score,
    NTILE(4) OVER (ORDER BY monetary_usd ASC, customer_id ASC) AS m_score
  FROM rfm_base
),
rfm_labeled AS (
  SELECT
    *,
    CASE
      WHEN r_score = 4 AND f_score = 4 AND m_score = 4 THEN '1_Campeones'
      WHEN r_score >= 3 AND f_score >= 3 THEN '2_Leales'
      WHEN r_score <= 2 AND (f_score >= 3 OR m_score >= 4) THEN '3_En_Riesgo_Alto_Valor'
      WHEN r_score >= 3 AND f_score <= 2 THEN '4_Recientes_En_Desarrollo'
      ELSE '5_Inactivos_Bajo_Valor'
    END AS rfm_segment
  FROM rfm_scores
)
SELECT
  rfm_segment,
  COUNT(*) AS customers,
  ROUND(AVG(recency_days), 1) AS avg_recency_days,
  ROUND(AVG(frequency_orders), 2) AS avg_frequency,
  ROUND(AVG(monetary_usd), 2) AS avg_monetary_usd,
  ROUND(100.0 * SUM(monetary_usd) / SUM(SUM(monetary_usd)) OVER (), 2) AS revenue_share_pct
FROM rfm_labeled
GROUP BY rfm_segment
ORDER BY rfm_segment;`,
        expectedOutput: [
          { rfm_segment: '1_Campeones', customers: 105, avg_recency_days: 18.8, avg_frequency: 9.21, avg_monetary_usd: 5058.77, revenue_share_pct: 8.47 },
          { rfm_segment: '2_Leales', customers: 613, avg_recency_days: 45.9, avg_frequency: 8.52, avg_monetary_usd: 3396.75, revenue_share_pct: 33.21 },
          { rfm_segment: '3_En_Riesgo_Alto_Valor', customers: 445, avg_recency_days: 180.3, avg_frequency: 8.37, avg_monetary_usd: 3685.18, revenue_share_pct: 26.16 },
          { rfm_segment: '4_Recientes_En_Desarrollo', customers: 428, avg_recency_days: 46.5, avg_frequency: 4.3, avg_monetary_usd: 1770.58, revenue_share_pct: 12.09 },
          { rfm_segment: '5_Inactivos_Bajo_Valor', customers: 701, avg_recency_days: 229.1, avg_frequency: 4.29, avg_monetary_usd: 1795.11, revenue_share_pct: 20.07 },
        ],
      },
    ],
  },
  checks: [
    {
      id: 'chk-da3-prod-03-polarity',
      type: 'mcq',
      prompt:
        '¿Qué ocurre si calculas r_score en SQL escribiendo NTILE(4) OVER (ORDER BY recency_days ASC) cuando el cuartil 4 representa a los mejores clientes?',
      options: [
        {
          id: 'a',
          text: 'Asignas r_score = 4 a los clientes más recientes porque ASC ordena de menor a mayor.',
          correct: false,
          feedback:
            'Incorrecto. NTILE(4) asigna el grupo 1 a las primeras filas del orden y el grupo 4 a las últimas; con ASC, los de menor recency_days quedan en el cuartil 1.',
        },
        {
          id: 'b',
          text: 'Inviertes la escala y clasificas como Campeones (r_score = 4) a los clientes que llevan más días sin comprar.',
          correct: true,
          feedback:
            'Correcto. Con ORDER BY recency_days ASC, las filas con mayor número de días inactivos quedan al final y reciben el cuartil 4.',
        },
        {
          id: 'c',
          text: 'DuckDB devuelve un error porque NTILE no admite ordenación ascendente sobre enteros.',
          correct: false,
          feedback:
            'Incorrecto. La consulta se ejecuta sin errores sintácticos, pero invierte por completo el significado de negocio.',
        },
      ],
      explanation:
        'NTILE(4) numera los bloques del 1 al 4 siguiendo el ORDER BY. Para que pocos días sin comprar (recency_days bajo) reciban r_score = 4, debes ordenar recency_days DESC.',
    },
    {
      id: 'chk-da3-prod-03-isovalue',
      type: 'mcq',
      prompt:
        'Según el análisis de curvas de isovalor de Fader, Hardie y Lee, si dos clientes en un comercio no contractual tienen una recencia alta (llevan 200 días sin comprar), pero el cliente A realizó 12 compras en su primer mes y el cliente B realizó solo 2 compras, ¿qué implica ese silencio prolongado en el cliente A?',
      options: [
        {
          id: 'a',
          text: 'Que el cliente A sigue teniendo un ritmo de compra activo intacto porque su frecuencia histórica es alta.',
          correct: false,
          feedback:
            'Incorrecto. Un silencio de 200 días en alguien que solía comprar cada pocos días indica una alta probabilidad de haber abandonado.',
        },
        {
          id: 'b',
          text: 'Que la caída abrupta respecto a su alta cadencia habitual señala un riesgo elevado de abandono silencioso que requiere reactivación urgente.',
          correct: true,
          feedback:
            'Correcto. Cuando un comprador de alta frecuencia rompe su ciclo habitual durante meses, su probabilidad de seguir activo cae drásticamente.',
        },
        {
          id: 'c',
          text: 'Que el valor monetario medio por pedido del cliente A se vuelve negativo.',
          correct: false,
          feedback:
            'Incorrecto. El gasto histórico sigue siendo positivo; lo que disminuye es la probabilidad de observar compras futuras sin intervención.',
        },
      ],
      explanation:
        'En entornos no contractuales, una pausa prolongada tras una racha de alta frecuencia es la señal más clara de abandono latente, justificando la categoría En Riesgo de Alto Valor.',
    },
    {
      id: 'chk-da3-prod-03-fill',
      type: 'fill-code',
      prompt:
        'Completa la función de ventana para asignar el cuartil de recencia (1 = más antiguo, 4 = más reciente) con desempate determinista por customer_id:',
      template:
        'NTILE(4) OVER (ORDER BY recency_days ___, customer_id ASC) AS r_score',
      blanks: [
        {
          id: 'b1',
          accepted: ['DESC', 'desc'],
        },
      ],
      explanation:
        'Ordenar recency_days DESC coloca primero a los clientes con más días de inactividad (cuartil 1) y al final a quienes compraron más recientemente (cuartil 4).',
    },
  ],
  practice: {
    type: 'sql',
    title: 'Segmentación conductual RFM en Mercado Brisa',
    language: 'sql',
    prompt:
      'Construye la segmentación conductual RFM sobre los pedidos con `status = \'completed\'` de **Mercado Brisa** tomando como fecha de corte `DATE \'2025-12-01\'`. Calcula `r_score` (`NTILE(4) OVER (ORDER BY recency_days DESC, customer_id ASC)`), `f_score` (`ORDER BY frequency_orders ASC, monetary_usd ASC, customer_id ASC`) y `m_score` (`ORDER BY monetary_usd ASC, customer_id ASC`). Clasifica en los 5 segmentos (`1_Campeones`, `2_Leales`, `3_En_Riesgo_Alto_Valor`, `4_Recientes_En_Desarrollo`, `5_Inactivos_Bajo_Valor`) y devuelve `rfm_segment`, `customers`, `avg_recency_days` (1 decimal), `avg_frequency` (2 decimales), `avg_monetary_usd` (2 decimales) y `revenue_share_pct` (2 decimales), ordenando por `rfm_segment`.',
    starterCode: `WITH rfm_base AS (
  SELECT
    customer_id,
    DATEDIFF('day', MAX(CAST(order_date AS DATE)), DATE '2025-12-01') AS recency_days,
    COUNT(order_id) AS frequency_orders,
    ROUND(SUM(total_usd), 2) AS monetary_usd
  FROM orders
  WHERE status = 'completed'
  GROUP BY customer_id
),
rfm_scores AS (
  SELECT
    customer_id,
    recency_days,
    frequency_orders,
    monetary_usd,
    -- TODO 1: Corrige el orden de recency_days para que menor recency_days reciba r_score = 4
    NTILE(4) OVER (ORDER BY recency_days ASC, customer_id ASC) AS r_score,
    NTILE(4) OVER (ORDER BY frequency_orders ASC, monetary_usd ASC, customer_id ASC) AS f_score,
    NTILE(4) OVER (ORDER BY monetary_usd ASC, customer_id ASC) AS m_score
  FROM rfm_base
),
rfm_labeled AS (
  SELECT
    *,
    CASE
      WHEN r_score = 4 AND f_score = 4 AND m_score = 4 THEN '1_Campeones'
      WHEN r_score >= 3 AND f_score >= 3 THEN '2_Leales'
      -- TODO 2: Añade la regla para '3_En_Riesgo_Alto_Valor' cuando r_score <= 2 y (f_score >= 3 o m_score >= 4)
      WHEN r_score >= 3 AND f_score <= 2 THEN '4_Recientes_En_Desarrollo'
      ELSE '5_Inactivos_Bajo_Valor'
    END AS rfm_segment
  FROM rfm_scores
)
SELECT
  rfm_segment,
  COUNT(*) AS customers,
  ROUND(AVG(recency_days), 1) AS avg_recency_days,
  ROUND(AVG(frequency_orders), 2) AS avg_frequency,
  ROUND(AVG(monetary_usd), 2) AS avg_monetary_usd,
  ROUND(100.0 * SUM(monetary_usd) / SUM(SUM(monetary_usd)) OVER (), 2) AS revenue_share_pct
FROM rfm_labeled
GROUP BY rfm_segment
ORDER BY rfm_segment;`,
    expected: `WITH rfm_base AS (
  SELECT
    customer_id,
    DATEDIFF('day', MAX(CAST(order_date AS DATE)), DATE '2025-12-01') AS recency_days,
    COUNT(order_id) AS frequency_orders,
    ROUND(SUM(total_usd), 2) AS monetary_usd
  FROM orders
  WHERE status = 'completed'
  GROUP BY customer_id
),
rfm_scores AS (
  SELECT
    customer_id,
    recency_days,
    frequency_orders,
    monetary_usd,
    NTILE(4) OVER (ORDER BY recency_days DESC, customer_id ASC) AS r_score,
    NTILE(4) OVER (ORDER BY frequency_orders ASC, monetary_usd ASC, customer_id ASC) AS f_score,
    NTILE(4) OVER (ORDER BY monetary_usd ASC, customer_id ASC) AS m_score
  FROM rfm_base
),
rfm_labeled AS (
  SELECT
    *,
    CASE
      WHEN r_score = 4 AND f_score = 4 AND m_score = 4 THEN '1_Campeones'
      WHEN r_score >= 3 AND f_score >= 3 THEN '2_Leales'
      WHEN r_score <= 2 AND (f_score >= 3 OR m_score >= 4) THEN '3_En_Riesgo_Alto_Valor'
      WHEN r_score >= 3 AND f_score <= 2 THEN '4_Recientes_En_Desarrollo'
      ELSE '5_Inactivos_Bajo_Valor'
    END AS rfm_segment
  FROM rfm_scores
)
SELECT
  rfm_segment,
  COUNT(*) AS customers,
  ROUND(AVG(recency_days), 1) AS avg_recency_days,
  ROUND(AVG(frequency_orders), 2) AS avg_frequency,
  ROUND(AVG(monetary_usd), 2) AS avg_monetary_usd,
  ROUND(100.0 * SUM(monetary_usd) / SUM(SUM(monetary_usd)) OVER (), 2) AS revenue_share_pct
FROM rfm_labeled
GROUP BY rfm_segment
ORDER BY rfm_segment;`,
    expectedOutputTable: [
      { rfm_segment: '1_Campeones', customers: 105, avg_recency_days: 18.8, avg_frequency: 9.21, avg_monetary_usd: 5058.77, revenue_share_pct: 8.47 },
      { rfm_segment: '2_Leales', customers: 613, avg_recency_days: 45.9, avg_frequency: 8.52, avg_monetary_usd: 3396.75, revenue_share_pct: 33.21 },
      { rfm_segment: '3_En_Riesgo_Alto_Valor', customers: 445, avg_recency_days: 180.3, avg_frequency: 8.37, avg_monetary_usd: 3685.18, revenue_share_pct: 26.16 },
      { rfm_segment: '4_Recientes_En_Desarrollo', customers: 428, avg_recency_days: 46.5, avg_frequency: 4.3, avg_monetary_usd: 1770.58, revenue_share_pct: 12.09 },
      { rfm_segment: '5_Inactivos_Bajo_Valor', customers: 701, avg_recency_days: 229.1, avg_frequency: 4.29, avg_monetary_usd: 1795.11, revenue_share_pct: 20.07 },
    ],
    orderMatters: true,
    hints: [
      'En rfm_scores cambia el orden de r_score a NTILE(4) OVER (ORDER BY recency_days DESC, customer_id ASC).',
      'En el bloque CASE WHEN de rfm_labeled añade debajo de 2_Leales: WHEN r_score <= 2 AND (f_score >= 3 OR m_score >= 4) THEN \'3_En_Riesgo_Alto_Valor\'.',
      'Verifica que los paréntesis envuelvan (f_score >= 3 OR m_score >= 4) porque el operador AND tiene mayor precedencia que OR en SQL.',
    ],
    solution: `WITH rfm_base AS (
  SELECT
    customer_id,
    DATEDIFF('day', MAX(CAST(order_date AS DATE)), DATE '2025-12-01') AS recency_days,
    COUNT(order_id) AS frequency_orders,
    ROUND(SUM(total_usd), 2) AS monetary_usd
  FROM orders
  WHERE status = 'completed'
  GROUP BY customer_id
),
rfm_scores AS (
  SELECT
    customer_id,
    recency_days,
    frequency_orders,
    monetary_usd,
    NTILE(4) OVER (ORDER BY recency_days DESC, customer_id ASC) AS r_score,
    NTILE(4) OVER (ORDER BY frequency_orders ASC, monetary_usd ASC, customer_id ASC) AS f_score,
    NTILE(4) OVER (ORDER BY monetary_usd ASC, customer_id ASC) AS m_score
  FROM rfm_base
),
rfm_labeled AS (
  SELECT
    *,
    CASE
      WHEN r_score = 4 AND f_score = 4 AND m_score = 4 THEN '1_Campeones'
      WHEN r_score >= 3 AND f_score >= 3 THEN '2_Leales'
      WHEN r_score <= 2 AND (f_score >= 3 OR m_score >= 4) THEN '3_En_Riesgo_Alto_Valor'
      WHEN r_score >= 3 AND f_score <= 2 THEN '4_Recientes_En_Desarrollo'
      ELSE '5_Inactivos_Bajo_Valor'
    END AS rfm_segment
  FROM rfm_scores
)
SELECT
  rfm_segment,
  COUNT(*) AS customers,
  ROUND(AVG(recency_days), 1) AS avg_recency_days,
  ROUND(AVG(frequency_orders), 2) AS avg_frequency,
  ROUND(AVG(monetary_usd), 2) AS avg_monetary_usd,
  ROUND(100.0 * SUM(monetary_usd) / SUM(SUM(monetary_usd)) OVER (), 2) AS revenue_share_pct
FROM rfm_labeled
GROUP BY rfm_segment
ORDER BY rfm_segment;`,
    solutionExplanation:
      'Al ordenar recency_days DESC asignamos r_score = 4 a las compras más recientes y aislamos a los 445 clientes en 3_En_Riesgo_Alto_Valor, quienes representan el 26,16 % de la facturación histórica pero llevan 180,3 días sin comprar en promedio.',
  },
  roleNotes: {
    de: 'Materializa una tabla de snapshot diario o semanal de atributos RFM parametrizada por fecha de corte explícita para que las campañas de CRM sean auditables y reproducibles en el tiempo.',
    da: 'Incluye siempre una clave primaria única de desempate en las funciones NTILE() y valida que la suma de revenue_share_pct sea exactamente 100 % usando funciones de ventana sobre el agregado.',
    bi: 'Cruza en tus vistas ejecutivas la etiqueta de catálogo (segment) con el segmento conductual RFM para mostrar a dirección qué cuentas B2B y baristas requieren contacto comercial inmediato.',
  },
  summary: [
    'Las etiquetas de registro no capturan el abandono silencioso; la segmentación RFM mide el comportamiento transaccional real.',
    'En NTILE(4), la recencia debe ordenarse en sentido descendente (DESC) para que menos días sin comprar reciban mayor puntuación.',
    'Las curvas de isovalor demuestran que una frecuencia histórica elevada combinada con baja recencia señala alto riesgo de pérdida.',
    'En Mercado Brisa, los 445 clientes en riesgo de alto valor concentran el 26,16 % del ingreso y son foco prioritario.',
  ],
  flashcards: [
    {
      id: 'fc-da3-prod-03-01',
      front: '¿Por qué debemos usar una fecha de corte explícita (como DATE \'2025-12-01\') en lugar de CURRENT_DATE al calcular recency_days?',
      back: 'Para garantizar que el análisis sea determinista y reproducible en cualquier fecha en que se reejecute la consulta.',
    },
    {
      id: 'fc-da3-prod-03-02',
      front: '¿Por qué es obligatorio envolver entre paréntesis (f_score >= 3 OR m_score >= 4) al combinarlo con r_score <= 2 AND ... en SQL?',
      back: 'Porque en SQL el operador AND tiene mayor precedencia que OR; sin paréntesis se evaluaría (r_score <= 2 AND f_score >= 3) OR m_score >= 4.',
    },
    {
      id: 'fc-da3-prod-03-03',
      front: '¿Qué acción comercial corresponde al segmento 1_Campeones frente al segmento 3_En_Riesgo_Alto_Valor?',
      back: 'A Campeones se les ofrece acceso anticipado o fidelización sin erosionar margen; los descuentos de reactivación se reservan para En Riesgo de Alto Valor.',
    },
  ],
  glossaryTerms: [
    'segmentacion-rfm',
    'curvas-isovalor-clv',
    'ltv-margen-neto',
  ],
  sources: [
    {
      title: 'RFM and CLV: Using Iso-Value Curves for Customer Base Analysis',
      url: 'https://www.brucehardie.com/papers/rfm_clv_2005-02-16.pdf',
      publisher: 'Journal of Marketing Research (Fader, Hardie & Lee)',
      accessed: '2026-10-29',
      supports: 'Fundamento teórico del modelo RFM, curvas de isovalor de CLV y paradoja de alta frecuencia con baja recencia.',
    },
    {
      title: 'Technical Notes on Customer-Base Analysis',
      url: 'https://www.brucehardie.com/notes/',
      publisher: 'Bruce G. S. Hardie',
      accessed: '2026-10-29',
      supports: 'Definición operativa de recencia, frecuencia y gasto monetario respecto a una fecha de corte T.',
    },
    {
      title: 'Window Functions (NTILE) — DuckDB SQL Documentation',
      url: 'https://duckdb.org/docs/sql/functions/window_functions.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Cálculo de cuantiles con NTILE(4) y ordenación determinista mediante claves de desempate.',
    },
    {
      title: 'Aggregate Functions — DuckDB SQL Documentation',
      url: 'https://duckdb.org/docs/sql/functions/aggregates.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Agregación de métricas transaccionales por cliente y cuota sobre el total con funciones de ventana.',
    },
  ],
  aiNotes:
    'Si el estudiante obtiene recencias invertidas en 1_Campeones (p. ej. más de 200 días), indícale revisar la dirección DESC en NTILE(4) OVER (ORDER BY recency_days DESC, customer_id ASC) y los paréntesis alrededor del OR en la condición de 3_En_Riesgo_Alto_Valor.',
};

export default lesson;
