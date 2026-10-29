const lesson = {
  schemaVersion: 2,
  id: 'da3-producto-04-atribucion-marketing-incrementalidad',
  moduleId: 'da3-producto',
  track: 'da',
  level: 3,
  order: 4,
  minutes: 25,
  needsReview: false,
  prerequisites: [
    'da3-producto-03-segmentacion-conductual-rfm',
    'c2-sql-analitico-02-asof-lateral-ctes',
  ],
  title: 'Atribución de marketing con ASOF JOIN e incrementalidad',
  subtitle: 'Atribución de marketing (primer toque, último toque, ASOF) e incrementalidad',
  hook: 'La agencia publicitaria de Mercado Brisa reclama un retorno sobre gasto publicitario (ROAS) de 1,53x en la campaña de vídeo y redes CMP-VERANO tras invertir casi 110.000 USD, pidiendo duplicar su presupuesto. Sin embargo, al auditar el primer toque de esos mismos compradores descubres que su ROAS cae a 0,96x porque la campaña solo interceptó el último clic de clientes ya fidelizados. ¿Cómo implementar atribución temporal con ASOF JOIN y contrastarla con incrementalidad causal para evitar financiar toques que canibalizan ventas orgánicas?',
  objectives: [
    'Diferenciar los modelos heurísticos de atribución de primer toque (ARG_MIN) y último toque por ventana (ASOF JOIN).',
    'Emparejar pedidos completados con el punto de contacto previo más reciente en DuckDB aplicando una ventana de caducidad de 24 horas.',
    'Cuantificar cómo el último toque infla artificialmente el ROAS de campañas de retargeting frente a campañas de origen.',
    'Estimar la incrementalidad causal mediante Diferencia en Diferencias (DID) sobre grupos de control verificando antes el equilibrio SRM.',
  ],
  sections: [
    {
      id: 'sec-primer-ultimo-toque-asof',
      heading: 'Primer toque con ARG_MIN frente a último toque temporal con ASOF JOIN',
      body: 'Cuando un cliente realiza un pedido tras haber interactuado con varias campañas en `events`, la atribución determinista reparte el crédito siguiendo una regla heurística.\n\nEl modelo de **primer toque** asigna el `100 %` del pedido a la primera campaña histórica con la que interactuó el cliente, siempre que haya ocurrido antes de la compra. En DuckDB se obtiene al grano de `customer_id` mediante `ARG_MIN(campaign_id, event_ts)`.\n\nPor el contrario, el modelo de **atribución de último toque por ventana** asigna el pedido al contacto publicitario más reciente previo al cobro. Intentar resolverlo con un `LEFT JOIN` convencional multiplica cada pedido por todos los eventos pasados del usuario. El operador nativo `ASOF LEFT JOIN` soluciona este emparejamiento en una sola pasada (`ON o.customer_id = tp.customer_id AND o.order_ts >= tp.event_ts`).\n\nNo obstante, dado que `ASOF JOIN` recupera el evento previo aunque haya ocurrido hace un año, debemos imponer siempre una **ventana de caducidad** (por ejemplo, `DATEDIFF(\'hour\', tp.event_ts, o.order_ts) <= 24`). Si el toque supera las 24 horas, el pedido se clasifica como orgánico o expirado.',
      keyPoints: [
        'ARG_MIN(campaign_id, event_ts) extrae la primera campaña histórica de cada cliente sin subconsultas.',
        'ASOF LEFT JOIN empareja cada pedido con el único evento previo más cercano en el tiempo.',
        'Restringir DATEDIFF(\'hour\', tp.event_ts, o.order_ts) <= 24 evita atribuir compras a clics obsoletos de meses atrás.',
      ],
      diagram: {
        type: 'mermaid',
        title: 'Emparejamiento temporal de eventos de campaña hacia el pedido mediante ASOF LEFT JOIN',
        code: `flowchart LR
    T1["Primer toque histórico\nCMP-ORIGEN (hace 40 días)\nARG_MIN(campaign_id, event_ts)"] --> O["Pedido completado\n(o.order_ts)"]
    T2["Último toque previo\nCMP-VERANO (hace 50 min)\nASOF JOIN: o.order_ts >= tp.event_ts"] --> W{"¿Diferencia <= 24 h?"}
    W -- "Sí" --> LT["Atribuido a CMP-VERANO\nbajo último toque 24h"]
    W -- "No" --> EX["Clasificado como\nEXPIRADO_O_DIRECTO"]`,
      },
      example: {
        title: 'Volumen de pedidos completados atribuidos por último toque con ventana de 24 horas',
        language: 'sql',
        code: `WITH touchpoints AS (
  SELECT DISTINCT
    customer_id,
    event_ts,
    campaign_id
  FROM events
  WHERE customer_id IS NOT NULL
    AND campaign_id IS NOT NULL
),
completed_orders AS (
  SELECT
    order_id,
    customer_id,
    order_ts,
    total_usd
  FROM orders
  WHERE status = 'completed'
)
SELECT
  CASE
    WHEN tp.event_ts IS NOT NULL
     AND DATEDIFF('hour', tp.event_ts, co.order_ts) <= 24
    THEN tp.campaign_id
    ELSE 'EXPIRADO_O_DIRECTO'
  END AS last_touch_24h_channel,
  COUNT(*) AS attributed_orders,
  ROUND(SUM(co.total_usd), 2) AS attributed_revenue_usd,
  ROUND(AVG(DATEDIFF('minute', tp.event_ts, co.order_ts)), 1) AS avg_lag_minutes
FROM completed_orders co
ASOF LEFT JOIN touchpoints tp
  ON co.customer_id = tp.customer_id
 AND co.order_ts >= tp.event_ts
GROUP BY 1
ORDER BY attributed_revenue_usd DESC;`,
        explanation:
          'Los eventos de pre-pedido dentro de la ventana de 24 horas ocurren en promedio entre 49 y 57 minutos antes del cobro, mientras 4.845 pedidos carecen de toque reciente.',
        output: `last_touch_24h_channel | attributed_orders | attributed_revenue_usd | avg_lag_minutes
-----------------------+-------------------+------------------------+----------------
EXPIRADO_O_DIRECTO     |              4845 |             3050181.23 |         95327.0
CMP-RETENCION          |              2428 |             1332544.03 |            57.0
CMP-BARISTA            |              2547 |              947872.69 |            54.6
CMP-VERANO             |              2527 |              476715.57 |            48.9
CMP-ORIGEN             |              2413 |              462148.90 |            52.6`,
      },
    },
    {
      id: 'sec-sesgo-roas-canibalizacion',
      heading: 'Sesgo de último toque y canibalización en el cálculo del ROAS',
      body: 'El retorno sobre el gasto publicitario (**ROAS**) divide los ingresos atribuidos a una campaña entre su inversión en `marketing_spend` ($\\text{ROAS} = \\text{Ingresos atribuidos} / \\text{Gasto}$).\n\nEn **Mercado Brisa**, la tabla `marketing_spend` registra el desembolso diario entre el `2024-01-01` y el `2024-10-17`. Al comparar primer toque frente a último toque (`24h`) en esa misma ventana temporal descubrimos por qué los modelos correlacionales engañan al asignar presupuesto.\n\nLa campaña masiva `CMP-VERANO` absorbió `$109.839,33` (`63,5 %` de todo el presupuesto). Bajo primer toque solo originó `343` pedidos por `$105.682,79`, arrojando un `ft_roas = 0,96` (inferior a `1,0x`: ni siquiera recupera el gasto publicitario bruto). Sin embargo, bajo último toque a 24 horas reclama `882` pedidos y `$167.970,62`, inflando su métrica hasta `lt_roas = 1,53` (`+$62.287,83`).\n\n¿De dónde provienen esos `$62.287,83` extra? De clientes que ya habían sido captados por `CMP-ORIGEN`, `CMP-BARISTA` o `CMP-RETENCION` y simplemente vieron un anuncio de `CMP-VERANO` minutos antes de finalizar una compra que iban a realizar de todos modos.',
      keyPoints: [
        'Debes acotar los pedidos exactamente al rango temporal cubierto por marketing_spend (2024-01-01 a 2024-10-17).',
        'CMP-VERANO tiene ft_roas = 0,96 (no rentable en origen) pero aparenta lt_roas = 1,53 en último toque.',
        'El último toque sobrepremia campañas de cierre o retargeting que interceptan demanda ya existente.',
      ],
    },
    {
      id: 'sec-incrementalidad-did-srm',
      heading: 'Incrementalidad causal, Diferencia en Diferencias (DID) y filtro SRM',
      body: 'Ninguna regla de atribución por toques responde la pregunta contrafactual: *¿cuántos ingresos habrían ocurrido si no hubiéramos lanzado la intervención?* Para medir el impacto real necesitamos un grupo de control aleatorizado (*holdout*) y estimar la **incrementalidad por diferencia en diferencias (DID)**.\n\nEn `experiment_assignments` disponemos del gasto previo (`pre_experiment_spend_usd`) y posterior (`post_experiment_spend_usd`) de cada usuario asignado a `control` o `treatment`. El estimador DID resta la evolución basal del control a la evolución del tratamiento:\n\n$$\\hat{\\tau}_{\\text{DID}} = (\\bar{Y}_{T,\\text{post}} - \\bar{Y}_{T,\\text{pre}}) - (\\bar{Y}_{C,\\text{post}} - \\bar{Y}_{C,\\text{pre}})$$\n\nAntes de dar por válido cualquier lift experimental debemos verificar en `experiments` el valor `srm_p_value` (*Sample Ratio Mismatch*). El experimento `EXP-PUSH-CART` (`experiment_id = 6`) presenta `980` usuarios en control frente a `620` en tratamiento (`srm_p_value = 0,0001`), lo que invalida su aleatorización. Entre los experimentos válidos, `EXP-CHECKOUT-1STEP` aporta `+$7,47` de gasto incremental DID por usuario tratado (`+$5.976,12` en total).',
      keyPoints: [
        'La atribución mide correlación de toques; la incrementalidad mide el lift causal frente a un grupo holdout.',
        'El estimador DID corrige diferencias preexistentes entre variantes restando el cambio pre-post del control.',
        'Todo experimento con fallo de asignación (srm_p_value < 0,001, como EXP-PUSH-CART) debe descartarse.',
      ],
      example: {
        title: 'Evaluación de incrementalidad DID y control de SRM en los experimentos de Mercado Brisa',
        language: 'sql',
        code: `WITH exp_stats AS (
  SELECT
    e.experiment_id,
    e.experiment_code,
    e.srm_p_value,
    ea.variant,
    COUNT(*) AS n_users,
    AVG(ea.post_experiment_spend_usd) AS avg_post_usd,
    AVG(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd) AS avg_delta_usd
  FROM experiments e
  JOIN experiment_assignments ea ON e.experiment_id = ea.experiment_id
  GROUP BY e.experiment_id, e.experiment_code, e.srm_p_value, ea.variant
)
SELECT
  c.experiment_code,
  c.n_users AS n_ctrl,
  t.n_users AS n_treat,
  c.srm_p_value,
  ROUND(t.avg_post_usd - c.avg_post_usd, 2) AS naive_post_diff_usd,
  ROUND(t.avg_delta_usd - c.avg_delta_usd, 2) AS did_lift_per_user_usd,
  ROUND((t.avg_delta_usd - c.avg_delta_usd) * t.n_users, 2) AS total_incremental_usd
FROM exp_stats c
JOIN exp_stats t
  ON c.experiment_id = t.experiment_id
 AND c.variant = 'control'
 AND t.variant = 'treatment'
ORDER BY c.experiment_id;`,
        explanation:
          'EXP-CHECKOUT-1STEP logra el mayor lift incremental válido (+7,47 USD por usuario), mientras EXP-PUSH-CART queda invalidado por SRM (980 vs 620, p = 0,0001).',
        output: `experiment_code    | n_ctrl | n_treat | srm_p_value | naive_post_diff_usd | did_lift_per_user_usd | total_incremental_usd
-------------------+--------+---------+-------------+---------------------+-----------------------+----------------------
EXP-CHECKOUT-1STEP |    800 |     800 |      0.8421 |                7.85 |                  7.47 |               5976.12
EXP-FREE-SHIP-45   |    800 |     800 |      0.6194 |                6.96 |                  6.62 |               5294.75
EXP-SUB-BUNDLE     |    800 |     800 |      0.5102 |                6.61 |                  6.26 |               5010.71
EXP-QUIZ-ORIGEN    |    800 |     800 |      0.7315 |                6.67 |                  6.33 |               5061.79
EXP-UPSELL-MOLINO  |    800 |     800 |      0.4889 |                6.74 |                  6.36 |               5087.19
EXP-PUSH-CART      |    980 |     620 |      0.0001 |                4.17 |                  6.49 |               4024.71`,
      },
    },
  ],
  workedExample: {
    problem:
      'Construir la tabla comparativa de ROAS de primer toque frente a ROAS de último toque con ventana de 24 horas para las cuatro campañas de marketing_spend entre el 2024-01-01 y el 2024-10-17.',
    steps: [
      {
        title: 'Paso 1: Obtener el primer toque histórico por cliente y el gasto total por campaña en marketing_spend',
        explanation:
          'Deduplicamos los eventos con campaign_id no nulo, extraemos la primera campaña histórica con ARG_MIN(campaign_id, event_ts) y sumamos spend_usd por campaign_id en marketing_spend.',
        sql: `WITH touchpoints AS (
  SELECT DISTINCT
    customer_id,
    event_ts,
    campaign_id
  FROM events
  WHERE customer_id IS NOT NULL
    AND campaign_id IS NOT NULL
),
first_touch AS (
  SELECT
    customer_id,
    ARG_MIN(campaign_id, event_ts) AS first_campaign
  FROM touchpoints
  GROUP BY customer_id
)
SELECT
  first_campaign,
  COUNT(*) AS customers_originated
FROM first_touch
GROUP BY first_campaign
ORDER BY customers_originated DESC;`,
        output: `first_campaign | customers_originated
---------------+---------------------
CMP-RETENCION  |                  832
CMP-BARISTA    |                  826
CMP-ORIGEN     |                  494
CMP-VERANO     |                  247`,
      },
      {
        title: 'Paso 2: Cruzar pedidos del periodo 2024-01-01..2024-10-17 con primer toque y ASOF JOIN (24h) y calcular ROAS',
        explanation:
          'Emparejamos cada pedido completado del periodo de gasto con el primer toque del cliente y con el último toque previo en <= 24 horas vía ASOF LEFT JOIN, y dividimos los ingresos atribuidos entre spend_usd.',
        sql: `WITH touchpoints AS (
  SELECT DISTINCT
    customer_id,
    event_ts,
    campaign_id
  FROM events
  WHERE customer_id IS NOT NULL
    AND campaign_id IS NOT NULL
),
first_touch AS (
  SELECT
    customer_id,
    ARG_MIN(campaign_id, event_ts) AS first_campaign,
    MIN(event_ts) AS first_ts
  FROM touchpoints
  GROUP BY customer_id
),
orders_window AS (
  SELECT
    order_id,
    customer_id,
    order_ts,
    total_usd
  FROM orders
  WHERE status = 'completed'
    AND order_date >= DATE '2024-01-01'
    AND order_date <= DATE '2024-10-17'
),
attributed AS (
  SELECT
    o.order_id,
    o.total_usd,
    COALESCE(ft.first_campaign, 'SIN_TOQUE') AS ft_campaign,
    CASE
      WHEN tp.event_ts IS NOT NULL
       AND DATEDIFF('hour', tp.event_ts, o.order_ts) <= 24
      THEN tp.campaign_id
      ELSE 'EXPIRADO_O_DIRECTO'
    END AS lt_campaign_24h
  FROM orders_window o
  LEFT JOIN first_touch ft
    ON o.customer_id = ft.customer_id
   AND ft.first_ts <= o.order_ts
  ASOF LEFT JOIN touchpoints tp
    ON o.customer_id = tp.customer_id
   AND o.order_ts >= tp.event_ts
),
ft_agg AS (
  SELECT ft_campaign AS campaign_id, COUNT(*) AS ft_orders, ROUND(SUM(total_usd), 2) AS ft_revenue_usd
  FROM attributed
  GROUP BY ft_campaign
),
lt_agg AS (
  SELECT lt_campaign_24h AS campaign_id, COUNT(*) AS lt_orders, ROUND(SUM(total_usd), 2) AS lt_revenue_usd
  FROM attributed
  GROUP BY lt_campaign_24h
),
spend_agg AS (
  SELECT campaign_id, ROUND(SUM(spend_usd), 2) AS spend_usd
  FROM marketing_spend
  GROUP BY campaign_id
)
SELECT
  s.campaign_id,
  s.spend_usd,
  f.ft_orders,
  f.ft_revenue_usd,
  ROUND(f.ft_revenue_usd / s.spend_usd, 2) AS ft_roas,
  l.lt_orders,
  l.lt_revenue_usd,
  ROUND(l.lt_revenue_usd / s.spend_usd, 2) AS lt_roas
FROM spend_agg s
JOIN ft_agg f ON s.campaign_id = f.campaign_id
JOIN lt_agg l ON s.campaign_id = l.campaign_id
ORDER BY s.spend_usd DESC;`,
        output: `campaign_id   | spend_usd | ft_orders | ft_revenue_usd | ft_roas | lt_orders | lt_revenue_usd | lt_roas
--------------+-----------+-----------+----------------+---------+-----------+----------------+--------
CMP-VERANO    | 109839.33 |       343 |      105682.79 |    0.96 |       882 |      167970.62 |    1.53
CMP-ORIGEN    |  26703.45 |       985 |      372810.74 |   13.96 |       867 |       162456.7 |    6.08
CMP-BARISTA   |  22306.35 |      1712 |      705172.42 |   31.61 |       866 |      317517.18 |   14.23
CMP-RETENCION |  14102.07 |      1745 |      752319.96 |   53.35 |       832 |      453985.01 |   32.19`,
      },
    ],
    takeaway:
      'CMP-VERANO parece rentable bajo último toque (ROAS 1,53) solo porque captura conversiones de clientes originados por otras campañas; en primer toque su ROAS es 0,96 y no recupera su inversión.',
  },
  checks: [
    {
      id: 'chk-da3-prod-04-asof',
      type: 'mcq',
      prompt:
        '¿Qué ventaja técnica ofrece ASOF LEFT JOIN frente a un LEFT JOIN convencional con condición o.order_ts >= tp.event_ts al atribuir pedidos a eventos de campaña?',
      options: [
        {
          id: 'a',
          label: 'Empareja cada pedido con a lo sumo una fila (el evento previo más cercano), evitando multiplicar el pedido por todo el historial de eventos del cliente.',
          feedback:
            'Correcto. ASOF LEFT JOIN selecciona únicamente el registro con el mayor tp.event_ts que cumpla tp.event_ts <= o.order_ts, preservando el grano de un pedido por fila.',
        },
        {
          id: 'b',
          label: 'Descarta automáticamente los eventos ocurridos hace más de 24 horas sin necesidad de escribir un CASE WHEN.',
          feedback:
            'Incorrecto. ASOF JOIN recupera el evento previo más cercano sin límite de antigüedad; la ventana de 24 horas debe imponerse explícitamente con DATEDIFF.',
        },
        {
          id: 'c',
          label: 'Calcula directamente el estimador causal de diferencia en diferencias sin requerir grupo de control.',
          feedback:
            'Incorrecto. ASOF JOIN resuelve el emparejamiento temporal de toques correlacionales, pero no sustituye a un diseño experimental con grupo de control.',
        },
      ],
      correctOptionId: 'a',
      explanation:
        'Un LEFT JOIN con desigualdad temporal genera tantas filas por pedido como eventos previos tenga el cliente (fan-out). ASOF LEFT JOIN devuelve únicamente el toque previo inmediato.',
    },
    {
      id: 'chk-da3-prod-04-did',
      type: 'predict-output',
      prompt:
        'En un experimento con aleatorización válida, el grupo de tratamiento pasa de un gasto medio pre-experimento de 50 USD a 65 USD post-experimento, mientras el grupo de control pasa de 52 USD pre-experimento a 60 USD post-experimento. ¿Cuál es el lift incremental por usuario según Diferencia en Diferencias (DID)?',
      options: [
        {
          id: 'a',
          label: '+7 USD por usuario ((65 - 50) - (60 - 52) = 15 - 8 = 7)',
          feedback:
            'Correcto. El grupo tratado creció +15 USD y el control creció +8 USD por tendencia basal; la diferencia neta atribuible al tratamiento es +7 USD.',
        },
        {
          id: 'b',
          label: '+5 USD por usuario (porque 65 - 60 = 5 en el periodo posterior)',
          feedback:
            'Incorrecto. Comparar solo el post-experimento (65 vs 60) ignora que el grupo de control partía con 2 USD más en el periodo previo (52 vs 50).',
        },
        {
          id: 'c',
          label: '+15 USD por usuario (porque el grupo tratado subió de 50 a 65 USD)',
          feedback:
            'Incorrecto. Atribuir los +15 USD completos al tratamiento ignora el crecimiento natural de +8 USD observado en el grupo de control.',
        },
      ],
      correctOptionId: 'a',
      explanation:
        'El estimador DID resta el cambio del control (+8 USD) al cambio del tratamiento (+15 USD), aislando el efecto causal de +7 USD y corrigiendo la diferencia inicial de -2 USD.',
    },
    {
      id: 'chk-da3-prod-04-fill',
      type: 'fill-code',
      prompt:
        'Completa la condición de unión temporal en DuckDB para asociar cada pedido (o) con el evento previo o simultáneo más reciente (tp) del mismo cliente:',
      codeTemplate:
        'ASOF LEFT JOIN touchpoints tp ON o.customer_id = tp.customer_id AND o.order_ts ___ tp.event_ts',
      blanks: [
        {
          id: 'b1',
          expected: '>=',
          accepted: ['>='],
        },
      ],
      explanation:
        'La desigualdad o.order_ts >= tp.event_ts en ASOF LEFT JOIN busca el mayor tp.event_ts que no supere la marca temporal del pedido.',
    },
  ],
  practice: {
    type: 'sql',
    prompt:
      'Calcula para las 4 campañas de `marketing_spend` en **Mercado Brisa** (acotando los pedidos con `status = \'completed\'` al periodo `2024-01-01` a `2024-10-17`) el gasto total (`spend_usd`), los pedidos e ingresos de primer toque (`ft_orders`, `ft_revenue_usd`, usando `ARG_MIN(campaign_id, event_ts)` con `ft.first_ts <= o.order_ts`), el `ft_roas`, y los pedidos, ingresos y ROAS de último toque con ventana de 24 horas (`lt_orders`, `lt_revenue_usd`, `lt_roas`, usando `ASOF LEFT JOIN` con `o.order_ts >= tp.event_ts` y `DATEDIFF(\'hour\', tp.event_ts, o.order_ts) <= 24`). Redondea importes y ROAS a 2 decimales y ordena por `spend_usd DESC`.',
    starterCode: `WITH touchpoints AS (
  SELECT DISTINCT
    customer_id,
    event_ts,
    campaign_id
  FROM events
  WHERE customer_id IS NOT NULL
    AND campaign_id IS NOT NULL
),
first_touch AS (
  SELECT
    customer_id,
    ARG_MIN(campaign_id, event_ts) AS first_campaign,
    MIN(event_ts) AS first_ts
  FROM touchpoints
  GROUP BY customer_id
),
orders_window AS (
  SELECT
    order_id,
    customer_id,
    order_ts,
    total_usd
  FROM orders
  WHERE status = 'completed'
    AND order_date >= DATE '2024-01-01'
    AND order_date <= DATE '2024-10-17'
),
attributed AS (
  SELECT
    o.order_id,
    o.total_usd,
    COALESCE(ft.first_campaign, 'SIN_TOQUE') AS ft_campaign,
    -- TODO 1: Asigna tp.campaign_id solo si tp.event_ts no es nulo y ocurrió en <= 24 horas antes de o.order_ts
    'EXPIRADO_O_DIRECTO' AS lt_campaign_24h
  FROM orders_window o
  LEFT JOIN first_touch ft
    ON o.customer_id = ft.customer_id
   AND ft.first_ts <= o.order_ts
  -- TODO 2: Añade el ASOF LEFT JOIN contra touchpoints tp por customer_id y o.order_ts >= tp.event_ts
),
ft_agg AS (
  SELECT ft_campaign AS campaign_id, COUNT(*) AS ft_orders, ROUND(SUM(total_usd), 2) AS ft_revenue_usd
  FROM attributed
  GROUP BY ft_campaign
),
lt_agg AS (
  SELECT lt_campaign_24h AS campaign_id, COUNT(*) AS lt_orders, ROUND(SUM(total_usd), 2) AS lt_revenue_usd
  FROM attributed
  GROUP BY lt_campaign_24h
),
spend_agg AS (
  SELECT campaign_id, ROUND(SUM(spend_usd), 2) AS spend_usd
  FROM marketing_spend
  GROUP BY campaign_id
)
SELECT
  s.campaign_id,
  s.spend_usd,
  f.ft_orders,
  f.ft_revenue_usd,
  ROUND(f.ft_revenue_usd / s.spend_usd, 2) AS ft_roas,
  COALESCE(l.lt_orders, 0) AS lt_orders,
  COALESCE(l.lt_revenue_usd, 0.0) AS lt_revenue_usd,
  ROUND(COALESCE(l.lt_revenue_usd, 0.0) / s.spend_usd, 2) AS lt_roas
FROM spend_agg s
JOIN ft_agg f ON s.campaign_id = f.campaign_id
LEFT JOIN lt_agg l ON s.campaign_id = l.campaign_id
ORDER BY s.spend_usd DESC;`,
    expected: {
      columns: [
        'campaign_id',
        'spend_usd',
        'ft_orders',
        'ft_revenue_usd',
        'ft_roas',
        'lt_orders',
        'lt_revenue_usd',
        'lt_roas',
      ],
      rows: [
        ['CMP-VERANO', 109839.33, 343, 105682.79, 0.96, 882, 167970.62, 1.53],
        ['CMP-ORIGEN', 26703.45, 985, 372810.74, 13.96, 867, 162456.7, 6.08],
        ['CMP-BARISTA', 22306.35, 1712, 705172.42, 31.61, 866, 317517.18, 14.23],
        ['CMP-RETENCION', 14102.07, 1745, 752319.96, 53.35, 832, 453985.01, 32.19],
      ],
    },
    orderMatters: true,
    hints: [
      'En la CTE attributed añade debajo del LEFT JOIN first_touch: ASOF LEFT JOIN touchpoints tp ON o.customer_id = tp.customer_id AND o.order_ts >= tp.event_ts.',
      'Para calcular lt_campaign_24h usa CASE WHEN tp.event_ts IS NOT NULL AND DATEDIFF(\'hour\', tp.event_ts, o.order_ts) <= 24 THEN tp.campaign_id ELSE \'EXPIRADO_O_DIRECTO\' END.',
      'Mantén el filtro de orders_window entre 2024-01-01 y 2024-10-17 para que el numerador de ingresos coincida con el periodo de marketing_spend.',
    ],
    solution: `WITH touchpoints AS (
  SELECT DISTINCT
    customer_id,
    event_ts,
    campaign_id
  FROM events
  WHERE customer_id IS NOT NULL
    AND campaign_id IS NOT NULL
),
first_touch AS (
  SELECT
    customer_id,
    ARG_MIN(campaign_id, event_ts) AS first_campaign,
    MIN(event_ts) AS first_ts
  FROM touchpoints
  GROUP BY customer_id
),
orders_window AS (
  SELECT
    order_id,
    customer_id,
    order_ts,
    total_usd
  FROM orders
  WHERE status = 'completed'
    AND order_date >= DATE '2024-01-01'
    AND order_date <= DATE '2024-10-17'
),
attributed AS (
  SELECT
    o.order_id,
    o.total_usd,
    COALESCE(ft.first_campaign, 'SIN_TOQUE') AS ft_campaign,
    CASE
      WHEN tp.event_ts IS NOT NULL
       AND DATEDIFF('hour', tp.event_ts, o.order_ts) <= 24
      THEN tp.campaign_id
      ELSE 'EXPIRADO_O_DIRECTO'
    END AS lt_campaign_24h
  FROM orders_window o
  LEFT JOIN first_touch ft
    ON o.customer_id = ft.customer_id
   AND ft.first_ts <= o.order_ts
  ASOF LEFT JOIN touchpoints tp
    ON o.customer_id = tp.customer_id
   AND o.order_ts >= tp.event_ts
),
ft_agg AS (
  SELECT ft_campaign AS campaign_id, COUNT(*) AS ft_orders, ROUND(SUM(total_usd), 2) AS ft_revenue_usd
  FROM attributed
  GROUP BY ft_campaign
),
lt_agg AS (
  SELECT lt_campaign_24h AS campaign_id, COUNT(*) AS lt_orders, ROUND(SUM(total_usd), 2) AS lt_revenue_usd
  FROM attributed
  GROUP BY lt_campaign_24h
),
spend_agg AS (
  SELECT campaign_id, ROUND(SUM(spend_usd), 2) AS spend_usd
  FROM marketing_spend
  GROUP BY campaign_id
)
SELECT
  s.campaign_id,
  s.spend_usd,
  f.ft_orders,
  f.ft_revenue_usd,
  ROUND(f.ft_revenue_usd / s.spend_usd, 2) AS ft_roas,
  l.lt_orders,
  l.lt_revenue_usd,
  ROUND(l.lt_revenue_usd / s.spend_usd, 2) AS lt_roas
FROM spend_agg s
JOIN ft_agg f ON s.campaign_id = f.campaign_id
JOIN lt_agg l ON s.campaign_id = l.campaign_id
ORDER BY s.spend_usd DESC;`,
    solutionExplanation:
      'El ASOF LEFT JOIN combinado con la ventana de 24 horas revela la distorsión del último toque: CMP-VERANO infla su ROAS de 0,96 a 1,53 capturando el último clic de usuarios que fueron originados por CMP-ORIGEN, CMP-BARISTA y CMP-RETENCION.',
  },
  roleNotes: {
    de: 'Ordena físicamente las tablas de eventos en Parquet por (customer_id, event_ts) para acelerar la ejecución de operadores ASOF JOIN sobre millones de filas.',
    da: 'Nunca apruebes aumentos de presupuesto basados solo en ROAS de último toque; contrasta siempre primer toque, último toque acotado y experimentos de incrementalidad con chequeo SRM.',
    bi: 'En los cuadros de mando de marketing coloca lado a lado el ROAS de primer toque y el de último toque junto al indicador de validez experimental (srm_p_value) de las pruebas A/B.',
  },
  summary: [
    'La atribución de primer toque (ARG_MIN) premia el descubrimiento inicial, mientras el último toque (ASOF JOIN) premia el cierre inmediato.',
    'Todo ASOF LEFT JOIN de atribución exige una ventana de caducidad (como 24 horas) para no adjudicar ventas a clics antiguos.',
    'El último toque sobreestima el ROAS de campañas de alta frecuencia como CMP-VERANO al apropiarse de clientes ya captados.',
    'La incrementalidad real se mide mediante grupos de control (holdout) y Diferencia en Diferencias (DID), previa validación de ausencia de SRM.',
  ],
  flashcards: [
    {
      id: 'fc-da3-prod-04-01',
      front: '¿Por qué es necesario añadir un filtro DATEDIFF(\'hour\', tp.event_ts, o.order_ts) <= 24 después de un ASOF LEFT JOIN de atribución?',
      back: 'Porque ASOF LEFT JOIN devuelve el evento previo más cercano aunque haya ocurrido meses atrás; la ventana evita atribuir el pedido a un toque caducado.',
    },
    {
      id: 'fc-da3-prod-04-02',
      front: '¿Por qué la campaña CMP-VERANO pasa de un ROAS de 0,96 en primer toque a 1,53 en último toque?',
      back: 'Porque intercepta el último clic previo al pago de clientes que ya habían sido originados y fidelizados por otras campañas.',
    },
    {
      id: 'fc-da3-prod-04-03',
      front: '¿Qué indica un srm_p_value = 0,0001 en un experimento como EXP-PUSH-CART y qué decisión implica?',
      back: 'Indica un desbalance severo en la asignación aleatoria (Sample Ratio Mismatch: 980 control vs 620 tratamiento), por lo que el experimento debe invalidarse.',
    },
  ],
  glossaryTerms: [
    'asof-join',
    'atribucion-ultimo-toque-asof',
    'incrementalidad-diferencia-en-diferencias',
  ],
  sources: [
    {
      title: 'ASOF JOIN — DuckDB SQL Query Syntax',
      url: 'https://duckdb.org/docs/sql/query_syntax/from.html#asof-join',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Sintaxis y ejecución de ASOF LEFT JOIN para emparejar transacciones con el evento previo más reciente.',
    },
    {
      title: 'ASOF JOIN — Snowflake SQL Reference',
      url: 'https://docs.snowflake.com/en/sql-reference/constructs/asof-join',
      publisher: 'Snowflake',
      accessed: '2026-10-29',
      supports: 'Semántica de emparejamiento por proximidad temporal sin explosión cartesiana.',
    },
    {
      title: 'Ghost Ads: Improving the Economics of Measuring Online Ad Effectiveness',
      url: 'https://www.nber.org/papers/w21303',
      publisher: 'National Bureau of Economic Research (Johnson, Lewis & Nubbemeyer)',
      accessed: '2026-10-29',
      supports: 'Sesgo de selección en atribución de último toque y diseño de controles holdout para medir lift causal.',
    },
    {
      title: 'Meridian — Open-Source Marketing Mix Modeling and Incrementality',
      url: 'https://developers.google.com/meridian',
      publisher: 'Google Developers',
      accessed: '2026-10-29',
      supports: 'Diferencia entre ROAS atribuido por clics e incrementalidad causal calibrada con experimentos.',
    },
  ],
  aiNotes:
    'Si la consulta del estudiante no devuelve filas o el ROAS de último toque sale inflado por encima de 4x en CMP-VERANO, verifica que haya filtrado orders_window entre 2024-01-01 y 2024-10-17 y que aplique la ventana de 24 horas sobre tp.event_ts.',
};

export default lesson;
