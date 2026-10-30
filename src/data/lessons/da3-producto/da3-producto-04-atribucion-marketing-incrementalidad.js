export const lesson = {
  "id": "da3-producto-04-atribucion-marketing-incrementalidad",
  "moduleId": "da3-producto",
  "tracks": [
    "da"
  ],
  "level": 3,
  "order": 4,
  "minutes": 25,
  "contentVersion": 2,
  "needsReview": false,
  "prerequisites": [
    "da3-producto-03-segmentacion-conductual-rfm",
    "c2-sql-analitico-02-asof-lateral-ctes"
  ],
  "title": "Atribución de marketing con ASOF JOIN e incrementalidad",
  "subtitle": "Atribución de marketing (primer toque, último toque, ASOF) e incrementalidad",
  "hook": "La agencia publicitaria de Mercado Brisa reclama un retorno sobre gasto publicitario (ROAS) de 1,53x en la campaña de vídeo y redes CMP-VERANO tras invertir casi 110.000 USD, pidiendo duplicar su presupuesto. Sin embargo, al auditar el primer toque de esos mismos compradores descubres que su ROAS cae a 0,96x porque la campaña solo interceptó el último clic de clientes ya fidelizados. ¿Cómo implementar atribución temporal con ASOF JOIN y contrastarla con incrementalidad causal para evitar financiar toques que canibalizan ventas orgánicas?",
  "objectives": [
    "Diferenciar los modelos heurísticos de atribución de primer toque (ARG_MIN) y último toque por ventana (ASOF JOIN).",
    "Emparejar pedidos completados con el punto de contacto previo más reciente en DuckDB aplicando una ventana de caducidad de 24 horas.",
    "Cuantificar cómo el último toque infla artificialmente el ROAS de campañas de retargeting frente a campañas de origen.",
    "Estimar la incrementalidad causal mediante Diferencia en Diferencias (DID) sobre grupos de control verificando antes el equilibrio SRM."
  ],
  "sections": [
    {
      "id": "sec-primer-ultimo-toque-asof",
      "heading": "Primer toque con ARG_MIN frente a último toque con ASOF JOIN",
      "body": "Cuando un cliente realiza un pedido tras interactuar con varias campañas en `events`, la atribución determinista reparte el crédito siguiendo una regla heurística.\n\nEl modelo de **primer toque** asigna el `100 %` del pedido a la primera campaña histórica del cliente previa a la compra. En DuckDB se obtiene al grano de `customer_id` mediante `ARG_MIN(campaign_id, event_ts)`.\n\nPor el contrario, la **atribución de último toque por ventana** asigna el pedido al contacto publicitario más reciente previo al cobro. Resolverlo con un `LEFT JOIN` convencional multiplica cada pedido por todos los eventos pasados del usuario. El operador nativo `ASOF LEFT JOIN` soluciona este emparejamiento en una sola pasada (`ON o.customer_id = tp.customer_id AND o.order_ts >= tp.event_ts`).\n\nSin embargo, `ASOF JOIN` recupera el evento previo aunque haya ocurrido hace un año. Por ello debemos imponer siempre una **ventana de caducidad** (`DATEDIFF('hour', tp.event_ts, o.order_ts) <= 24`). Si el toque supera las 24 horas, el pedido se clasifica como orgánico o expirado.",
      "example": {
        "language": "sql",
        "code": "WITH touchpoints AS (\n  SELECT DISTINCT\n    customer_id,\n    event_ts,\n    campaign_id\n  FROM events\n  WHERE customer_id IS NOT NULL\n    AND campaign_id IS NOT NULL\n),\ncompleted_orders AS (\n  SELECT\n    order_id,\n    customer_id,\n    order_ts,\n    total_usd\n  FROM orders\n  WHERE status = 'completed'\n)\nSELECT\n  CASE\n    WHEN tp.event_ts IS NOT NULL\n     AND DATEDIFF('hour', tp.event_ts, co.order_ts) <= 24\n    THEN tp.campaign_id\n    ELSE 'EXPIRADO_O_DIRECTO'\n  END AS last_touch_24h_channel,\n  COUNT(*) AS attributed_orders,\n  ROUND(SUM(co.total_usd), 2) AS attributed_revenue_usd,\n  ROUND(AVG(DATEDIFF('minute', tp.event_ts, co.order_ts)), 1) AS avg_lag_minutes\nFROM completed_orders co\nASOF LEFT JOIN touchpoints tp\n  ON co.customer_id = tp.customer_id\n AND co.order_ts >= tp.event_ts\nGROUP BY 1\nORDER BY attributed_revenue_usd DESC;",
        "expectedOutput": [
          {
            "last_touch_24h_channel": "EXPIRADO_O_DIRECTO",
            "attributed_orders": 4845,
            "attributed_revenue_usd": 3050181.23,
            "avg_lag_minutes": 95327
          },
          {
            "last_touch_24h_channel": "CMP-RETENCION",
            "attributed_orders": 2428,
            "attributed_revenue_usd": 1332544.03,
            "avg_lag_minutes": 57
          },
          {
            "last_touch_24h_channel": "CMP-BARISTA",
            "attributed_orders": 2547,
            "attributed_revenue_usd": 947872.69,
            "avg_lag_minutes": 54.6
          },
          {
            "last_touch_24h_channel": "CMP-VERANO",
            "attributed_orders": 2527,
            "attributed_revenue_usd": 476715.57,
            "avg_lag_minutes": 48.9
          },
          {
            "last_touch_24h_channel": "CMP-ORIGEN",
            "attributed_orders": 2413,
            "attributed_revenue_usd": 462148.9,
            "avg_lag_minutes": 52.6
          }
        ]
      }
    },
    {
      "id": "sec-sesgo-roas-canibalizacion",
      "heading": "Sesgo de último toque y canibalización en el cálculo del ROAS",
      "body": "El retorno sobre el gasto publicitario (**ROAS**) divide los ingresos atribuidos a una campaña entre su inversión en `marketing_spend` ($\\text{ROAS} = \\text{Ingresos atribuidos} / \\text{Gasto}$).\n\nEn **Mercado Brisa**, la tabla `marketing_spend` registra el desembolso diario entre el `2024-01-01` y el `2024-10-17`. Al comparar primer toque frente a último toque (`24h`) en esa misma ventana temporal descubrimos por qué los modelos correlacionales engañan.\n\nLa campaña masiva `CMP-VERANO` absorbió `$109.839,33` (`63,5 %` de todo el presupuesto). Bajo primer toque solo originó `343` pedidos por `$105.682,79`, arrojando un `ft_roas = 0,96` (inferior a `1,0x`: no recupera el gasto publicitario bruto). Sin embargo, bajo último toque a 24 horas reclama `882` pedidos y `$167.970,62`, inflando su métrica hasta `lt_roas = 1,53` (`+$62.287,83`).\n\n¿De dónde provienen esos `$62.287,83` extra? De clientes que ya habían sido captados por `CMP-ORIGEN`, `CMP-BARISTA` o `CMP-RETENCION`. Esos usuarios vieron un anuncio de `CMP-VERANO` minutos antes de finalizar una compra que iban a realizar de todos modos."
    },
    {
      "id": "sec-incrementalidad-did-srm",
      "heading": "Incrementalidad causal, Diferencia en Diferencias (DID) y filtro SRM",
      "body": "Ninguna regla de atribución por toques responde la pregunta contrafactual: *¿cuántos ingresos habrían ocurrido sin la campaña?* Para medir el impacto real necesitamos un grupo de control aleatorizado (*holdout*) y estimar la **incrementalidad por diferencia en diferencias (DID)**.\n\nEn `experiment_assignments` disponemos del gasto previo (`pre_experiment_spend_usd`) y posterior (`post_experiment_spend_usd`) de cada usuario asignado a `control` o `treatment`. El estimador DID resta la evolución basal del control a la evolución del tratamiento:\n\n$$\\hat{\\tau}_{\\text{DID}} = (\\bar{Y}_{T,\\text{post}} - \\bar{Y}_{T,\\text{pre}}) - (\\bar{Y}_{C,\\text{post}} - \\bar{Y}_{C,\\text{pre}})$$\n\nAntes de validar cualquier lift debemos revisar en `experiments` el campo `srm_p_value` (*Sample Ratio Mismatch*). El experimento `EXP-PUSH-CART` (`experiment_id = 6`) presenta `980` usuarios en control frente a `620` en tratamiento (`srm_p_value = 0,0001`), invalidando su aleatorización. Entre los experimentos válidos, `EXP-CHECKOUT-1STEP` aporta `+$7,47` de gasto incremental DID por usuario tratado (`+$5.976,12` en total).",
      "example": {
        "language": "sql",
        "code": "WITH exp_stats AS (\n  SELECT\n    e.experiment_id,\n    e.experiment_code,\n    e.srm_p_value,\n    ea.variant,\n    COUNT(*) AS n_users,\n    AVG(ea.post_experiment_spend_usd) AS avg_post_usd,\n    AVG(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd) AS avg_delta_usd\n  FROM experiments e\n  JOIN experiment_assignments ea ON e.experiment_id = ea.experiment_id\n  GROUP BY e.experiment_id, e.experiment_code, e.srm_p_value, ea.variant\n)\nSELECT\n  c.experiment_code,\n  c.n_users AS n_ctrl,\n  t.n_users AS n_treat,\n  c.srm_p_value,\n  ROUND(t.avg_post_usd - c.avg_post_usd, 2) AS naive_post_diff_usd,\n  ROUND(t.avg_delta_usd - c.avg_delta_usd, 2) AS did_lift_per_user_usd,\n  ROUND((t.avg_delta_usd - c.avg_delta_usd) * t.n_users, 2) AS total_incremental_usd\nFROM exp_stats c\nJOIN exp_stats t\n  ON c.experiment_id = t.experiment_id\n AND c.variant = 'control'\n AND t.variant = 'treatment'\nORDER BY c.experiment_id;",
        "expectedOutput": [
          {
            "experiment_code": "EXP-CHECKOUT-1STEP",
            "n_ctrl": 800,
            "n_treat": 800,
            "srm_p_value": 0.8421,
            "naive_post_diff_usd": 6.91,
            "did_lift_per_user_usd": 6.87,
            "total_incremental_usd": 5497.03
          },
          {
            "experiment_code": "EXP-FREE-SHIP-45",
            "n_ctrl": 800,
            "n_treat": 800,
            "srm_p_value": 0.6194,
            "naive_post_diff_usd": 6.37,
            "did_lift_per_user_usd": 6.22,
            "total_incremental_usd": 4973.76
          },
          {
            "experiment_code": "EXP-SUB-BUNDLE",
            "n_ctrl": 800,
            "n_treat": 800,
            "srm_p_value": 0.5102,
            "naive_post_diff_usd": 6.61,
            "did_lift_per_user_usd": 6.55,
            "total_incremental_usd": 5236.89
          },
          {
            "experiment_code": "EXP-QUIZ-ORIGEN",
            "n_ctrl": 800,
            "n_treat": 800,
            "srm_p_value": 0.7315,
            "naive_post_diff_usd": 6.57,
            "did_lift_per_user_usd": 6.51,
            "total_incremental_usd": 5207.17
          },
          {
            "experiment_code": "EXP-UPSELL-MOLINO",
            "n_ctrl": 800,
            "n_treat": 800,
            "srm_p_value": 0.4889,
            "naive_post_diff_usd": 6.46,
            "did_lift_per_user_usd": 6.72,
            "total_incremental_usd": 5374.62
          },
          {
            "experiment_code": "EXP-PUSH-CART",
            "n_ctrl": 980,
            "n_treat": 620,
            "srm_p_value": 0.0001,
            "naive_post_diff_usd": 5.94,
            "did_lift_per_user_usd": 5.77,
            "total_incremental_usd": 3575.38
          }
        ]
      }
    }
  ],
  "workedExample": {
    "title": "ROAS de primer toque frente a último toque 24h en Mercado Brisa",
    "description": "Construimos la tabla comparativa de ROAS de primer toque frente a ROAS de último toque con ventana de 24 horas para las cuatro campañas de marketing_spend entre el 2024-01-01 y el 2024-10-17.",
    "audit": "CMP-VERANO parece rentable bajo último toque (ROAS 1,53) solo porque captura conversiones de clientes originados por otras campañas; en primer toque su ROAS es 0,96 y no recupera su inversión.",
    "steps": [
      {
        "label": "Paso 1: Obtener el primer toque histórico por cliente y el gasto total por campaña en marketing_spend",
        "explanation": "Deduplicamos los eventos con campaign_id no nulo, extraemos la primera campaña histórica con ARG_MIN(campaign_id, event_ts) y contamos cuántos clientes originó cada campaña.",
        "code": "WITH touchpoints AS (\n  SELECT DISTINCT\n    customer_id,\n    event_ts,\n    campaign_id\n  FROM events\n  WHERE customer_id IS NOT NULL\n    AND campaign_id IS NOT NULL\n),\nfirst_touch AS (\n  SELECT\n    customer_id,\n    ARG_MIN(campaign_id, event_ts) AS first_campaign\n  FROM touchpoints\n  GROUP BY customer_id\n)\nSELECT\n  first_campaign,\n  COUNT(*) AS customers_originated\nFROM first_touch\nGROUP BY first_campaign\nORDER BY customers_originated DESC;",
        "expectedOutput": [
          {
            "first_campaign": "CMP-RETENCION",
            "customers_originated": 748
          },
          {
            "first_campaign": "CMP-BARISTA",
            "customers_originated": 698
          },
          {
            "first_campaign": "CMP-ORIGEN",
            "customers_originated": 697
          },
          {
            "first_campaign": "CMP-VERANO",
            "customers_originated": 157
          }
        ]
      },
      {
        "label": "Paso 2: Cruzar pedidos del periodo 2024-01-01..2024-10-17 con primer toque y ASOF JOIN (24h) y calcular ROAS",
        "explanation": "Emparejamos cada pedido completado del periodo de gasto con el primer toque del cliente y con el último toque previo en <= 24 horas vía ASOF LEFT JOIN, y dividimos los ingresos atribuidos entre spend_usd.",
        "code": "WITH touchpoints AS (\n  SELECT DISTINCT\n    customer_id,\n    event_ts,\n    campaign_id\n  FROM events\n  WHERE customer_id IS NOT NULL\n    AND campaign_id IS NOT NULL\n),\nfirst_touch AS (\n  SELECT\n    customer_id,\n    ARG_MIN(campaign_id, event_ts) AS first_campaign,\n    MIN(event_ts) AS first_ts\n  FROM touchpoints\n  GROUP BY customer_id\n),\norders_window AS (\n  SELECT\n    order_id,\n    customer_id,\n    order_ts,\n    total_usd\n  FROM orders\n  WHERE status = 'completed'\n    AND order_date >= DATE '2024-01-01'\n    AND order_date <= DATE '2024-10-17'\n),\nattributed AS (\n  SELECT\n    o.order_id,\n    o.total_usd,\n    COALESCE(ft.first_campaign, 'SIN_TOQUE') AS ft_campaign,\n    CASE\n      WHEN tp.event_ts IS NOT NULL\n       AND DATEDIFF('hour', tp.event_ts, o.order_ts) <= 24\n      THEN tp.campaign_id\n      ELSE 'EXPIRADO_O_DIRECTO'\n    END AS lt_campaign_24h\n  FROM orders_window o\n  LEFT JOIN first_touch ft\n    ON o.customer_id = ft.customer_id\n   AND ft.first_ts <= o.order_ts\n  ASOF LEFT JOIN touchpoints tp\n    ON o.customer_id = tp.customer_id\n   AND o.order_ts >= tp.event_ts\n),\nft_agg AS (\n  SELECT ft_campaign AS campaign_id, COUNT(*) AS ft_orders, ROUND(SUM(total_usd), 2) AS ft_revenue_usd\n  FROM attributed\n  GROUP BY ft_campaign\n),\nlt_agg AS (\n  SELECT lt_campaign_24h AS campaign_id, COUNT(*) AS lt_orders, ROUND(SUM(total_usd), 2) AS lt_revenue_usd\n  FROM attributed\n  GROUP BY lt_campaign_24h\n),\nspend_agg AS (\n  SELECT campaign_id, ROUND(SUM(spend_usd), 2) AS spend_usd\n  FROM marketing_spend\n  GROUP BY campaign_id\n)\nSELECT\n  s.campaign_id,\n  s.spend_usd,\n  f.ft_orders,\n  f.ft_revenue_usd,\n  ROUND(f.ft_revenue_usd / s.spend_usd, 2) AS ft_roas,\n  l.lt_orders,\n  l.lt_revenue_usd,\n  ROUND(l.lt_revenue_usd / s.spend_usd, 2) AS lt_roas\nFROM spend_agg s\nJOIN ft_agg f ON s.campaign_id = f.campaign_id\nJOIN lt_agg l ON s.campaign_id = l.campaign_id\nORDER BY s.spend_usd DESC;",
        "expectedOutput": [
          {
            "campaign_id": "CMP-VERANO",
            "spend_usd": 109839.33,
            "ft_orders": 343,
            "ft_revenue_usd": 105682.79,
            "ft_roas": 0.96,
            "lt_orders": 882,
            "lt_revenue_usd": 167970.62,
            "lt_roas": 1.53
          },
          {
            "campaign_id": "CMP-ORIGEN",
            "spend_usd": 26703.45,
            "ft_orders": 985,
            "ft_revenue_usd": 372810.74,
            "ft_roas": 13.96,
            "lt_orders": 867,
            "lt_revenue_usd": 162456.7,
            "lt_roas": 6.08
          },
          {
            "campaign_id": "CMP-BARISTA",
            "spend_usd": 22306.35,
            "ft_orders": 1712,
            "ft_revenue_usd": 705172.42,
            "ft_roas": 31.61,
            "lt_orders": 866,
            "lt_revenue_usd": 317517.18,
            "lt_roas": 14.23
          },
          {
            "campaign_id": "CMP-RETENCION",
            "spend_usd": 14102.07,
            "ft_orders": 1745,
            "ft_revenue_usd": 752319.96,
            "ft_roas": 53.35,
            "lt_orders": 832,
            "lt_revenue_usd": 453985.01,
            "lt_roas": 32.19
          }
        ]
      }
    ]
  },
  "checks": [
    {
      "id": "chk-da3-prod-04-asof",
      "type": "mcq",
      "prompt": "¿Qué ventaja técnica ofrece ASOF LEFT JOIN frente a un LEFT JOIN convencional con condición o.order_ts >= tp.event_ts al atribuir pedidos a eventos de campaña?",
      "options": [
        {
          "id": "a",
          "text": "Empareja cada pedido con a lo sumo una fila (el evento previo más cercano), evitando multiplicar el pedido por todo el historial de eventos del cliente.",
          "correct": true,
          "feedback": "Correcto. ASOF LEFT JOIN selecciona únicamente el registro con el mayor tp.event_ts que cumpla tp.event_ts <= o.order_ts, preservando el grano de un pedido por fila."
        },
        {
          "id": "b",
          "text": "Descarta automáticamente los eventos ocurridos hace más de 24 horas sin necesidad de escribir un CASE WHEN.",
          "correct": false,
          "feedback": "Incorrecto. ASOF JOIN recupera el evento previo más cercano sin límite de antigüedad; la ventana de 24 horas debe imponerse explícitamente con DATEDIFF."
        },
        {
          "id": "c",
          "text": "Calcula directamente el estimador causal de diferencia en diferencias sin requerir grupo de control.",
          "correct": false,
          "feedback": "Incorrecto. ASOF JOIN resuelve el emparejamiento temporal de toques correlacionales, pero no sustituye a un diseño experimental con grupo de control."
        }
      ],
      "explanation": "Un LEFT JOIN con desigualdad temporal genera tantas filas por pedido como eventos previos tenga el cliente (fan-out). ASOF LEFT JOIN devuelve únicamente el toque previo inmediato."
    },
    {
      "id": "chk-da3-prod-04-did",
      "type": "predict-output",
      "prompt": "En un experimento con aleatorización válida, el grupo de tratamiento pasa de un gasto medio pre-experimento de 50 USD a 65 USD post-experimento, mientras el grupo de control pasa de 52 USD pre-experimento a 60 USD post-experimento. ¿Cuál es el lift incremental por usuario según Diferencia en Diferencias (DID)?",
      "options": [
        {
          "id": "a",
          "text": "+7 USD por usuario ((65 - 50) - (60 - 52) = 15 - 8 = 7)",
          "correct": true,
          "feedback": "Correcto. El grupo tratado creció +15 USD y el control creció +8 USD por tendencia basal; la diferencia neta atribuible al tratamiento es +7 USD."
        },
        {
          "id": "b",
          "text": "+5 USD por usuario (porque 65 - 60 = 5 en el periodo posterior)",
          "correct": false,
          "feedback": "Incorrecto. Comparar solo el post-experimento (65 vs 60) ignora que el grupo de control partía con 2 USD más en el periodo previo (52 vs 50)."
        },
        {
          "id": "c",
          "text": "+15 USD por usuario (porque el grupo tratado subió de 50 a 65 USD)",
          "correct": false,
          "feedback": "Incorrecto. Atribuir los +15 USD completos al tratamiento ignora el crecimiento natural de +8 USD observado en el grupo de control."
        }
      ],
      "explanation": "El estimador DID resta el cambio del control (+8 USD) al cambio del tratamiento (+15 USD), aislando el efecto causal de +7 USD y corrigiendo la diferencia inicial de -2 USD."
    },
    {
      "id": "chk-da3-prod-04-fill",
      "type": "fill-code",
      "prompt": "Completa la condición de unión temporal en DuckDB para asociar cada pedido (o) con el evento previo o simultáneo más reciente (tp) del mismo cliente:",
      "template": "ASOF LEFT JOIN touchpoints tp ON o.customer_id = tp.customer_id AND o.order_ts ___ tp.event_ts",
      "blanks": [
        {
          "id": "b1",
          "accepted": [
            ">="
          ]
        }
      ],
      "explanation": "La desigualdad o.order_ts >= tp.event_ts en ASOF LEFT JOIN busca el mayor tp.event_ts que no supere la marca temporal del pedido."
    }
  ],
  "practice": {
    "type": "sql",
    "title": "ROAS de primer toque frente a último toque 24h con ASOF JOIN",
    "language": "sql",
    "prompt": "Calcula para las 4 campañas de `marketing_spend` en **Mercado Brisa** (acotando los pedidos con `status = 'completed'` al periodo `2024-01-01` a `2024-10-17`) el gasto total (`spend_usd`), los pedidos e ingresos de primer toque (`ft_orders`, `ft_revenue_usd`, usando `ARG_MIN(campaign_id, event_ts)` con `ft.first_ts <= o.order_ts`), el `ft_roas`, y los pedidos, ingresos y ROAS de último toque con ventana de 24 horas (`lt_orders`, `lt_revenue_usd`, `lt_roas`, usando `ASOF LEFT JOIN` con `o.order_ts >= tp.event_ts` y `DATEDIFF('hour', tp.event_ts, o.order_ts) <= 24`). Redondea importes y ROAS a 2 decimales y ordena por `spend_usd DESC`.",
    "starterCode": "WITH touchpoints AS (\n  SELECT DISTINCT\n    customer_id,\n    event_ts,\n    campaign_id\n  FROM events\n  WHERE customer_id IS NOT NULL\n    AND campaign_id IS NOT NULL\n),\nfirst_touch AS (\n  SELECT\n    customer_id,\n    ARG_MIN(campaign_id, event_ts) AS first_campaign,\n    MIN(event_ts) AS first_ts\n  FROM touchpoints\n  GROUP BY customer_id\n),\norders_window AS (\n  SELECT\n    order_id,\n    customer_id,\n    order_ts,\n    total_usd\n  FROM orders\n  WHERE status = 'completed'\n    AND order_date >= DATE '2024-01-01'\n    AND order_date <= DATE '2024-10-17'\n),\nattributed AS (\n  SELECT\n    o.order_id,\n    o.total_usd,\n    COALESCE(ft.first_campaign, 'SIN_TOQUE') AS ft_campaign,\n    -- TODO 1: Asigna tp.campaign_id solo si tp.event_ts no es nulo y ocurrió en <= 24 horas antes de o.order_ts\n    'EXPIRADO_O_DIRECTO' AS lt_campaign_24h\n  FROM orders_window o\n  LEFT JOIN first_touch ft\n    ON o.customer_id = ft.customer_id\n   AND ft.first_ts <= o.order_ts\n  -- TODO 2: Añade el ASOF LEFT JOIN contra touchpoints tp por customer_id y o.order_ts >= tp.event_ts\n),\nft_agg AS (\n  SELECT ft_campaign AS campaign_id, COUNT(*) AS ft_orders, ROUND(SUM(total_usd), 2) AS ft_revenue_usd\n  FROM attributed\n  GROUP BY ft_campaign\n),\nlt_agg AS (\n  SELECT lt_campaign_24h AS campaign_id, COUNT(*) AS lt_orders, ROUND(SUM(total_usd), 2) AS lt_revenue_usd\n  FROM attributed\n  GROUP BY lt_campaign_24h\n),\nspend_agg AS (\n  SELECT campaign_id, ROUND(SUM(spend_usd), 2) AS spend_usd\n  FROM marketing_spend\n  GROUP BY campaign_id\n)\nSELECT\n  s.campaign_id,\n  s.spend_usd,\n  f.ft_orders,\n  f.ft_revenue_usd,\n  ROUND(f.ft_revenue_usd / s.spend_usd, 2) AS ft_roas,\n  COALESCE(l.lt_orders, 0) AS lt_orders,\n  COALESCE(l.lt_revenue_usd, 0.0) AS lt_revenue_usd,\n  ROUND(COALESCE(l.lt_revenue_usd, 0.0) / s.spend_usd, 2) AS lt_roas\nFROM spend_agg s\nJOIN ft_agg f ON s.campaign_id = f.campaign_id\nLEFT JOIN lt_agg l ON s.campaign_id = l.campaign_id\nORDER BY s.spend_usd DESC;",
    "expected": "WITH touchpoints AS (\n  SELECT DISTINCT\n    customer_id,\n    event_ts,\n    campaign_id\n  FROM events\n  WHERE customer_id IS NOT NULL\n    AND campaign_id IS NOT NULL\n),\nfirst_touch AS (\n  SELECT\n    customer_id,\n    ARG_MIN(campaign_id, event_ts) AS first_campaign,\n    MIN(event_ts) AS first_ts\n  FROM touchpoints\n  GROUP BY customer_id\n),\norders_window AS (\n  SELECT\n    order_id,\n    customer_id,\n    order_ts,\n    total_usd\n  FROM orders\n  WHERE status = 'completed'\n    AND order_date >= DATE '2024-01-01'\n    AND order_date <= DATE '2024-10-17'\n),\nattributed AS (\n  SELECT\n    o.order_id,\n    o.total_usd,\n    COALESCE(ft.first_campaign, 'SIN_TOQUE') AS ft_campaign,\n    CASE\n      WHEN tp.event_ts IS NOT NULL\n       AND DATEDIFF('hour', tp.event_ts, o.order_ts) <= 24\n      THEN tp.campaign_id\n      ELSE 'EXPIRADO_O_DIRECTO'\n    END AS lt_campaign_24h\n  FROM orders_window o\n  LEFT JOIN first_touch ft\n    ON o.customer_id = ft.customer_id\n   AND ft.first_ts <= o.order_ts\n  ASOF LEFT JOIN touchpoints tp\n    ON o.customer_id = tp.customer_id\n   AND o.order_ts >= tp.event_ts\n),\nft_agg AS (\n  SELECT ft_campaign AS campaign_id, COUNT(*) AS ft_orders, ROUND(SUM(total_usd), 2) AS ft_revenue_usd\n  FROM attributed\n  GROUP BY ft_campaign\n),\nlt_agg AS (\n  SELECT lt_campaign_24h AS campaign_id, COUNT(*) AS lt_orders, ROUND(SUM(total_usd), 2) AS lt_revenue_usd\n  FROM attributed\n  GROUP BY lt_campaign_24h\n),\nspend_agg AS (\n  SELECT campaign_id, ROUND(SUM(spend_usd), 2) AS spend_usd\n  FROM marketing_spend\n  GROUP BY campaign_id\n)\nSELECT\n  s.campaign_id,\n  s.spend_usd,\n  f.ft_orders,\n  f.ft_revenue_usd,\n  ROUND(f.ft_revenue_usd / s.spend_usd, 2) AS ft_roas,\n  l.lt_orders,\n  l.lt_revenue_usd,\n  ROUND(l.lt_revenue_usd / s.spend_usd, 2) AS lt_roas\nFROM spend_agg s\nJOIN ft_agg f ON s.campaign_id = f.campaign_id\nJOIN lt_agg l ON s.campaign_id = l.campaign_id\nORDER BY s.spend_usd DESC;",
    "expectedOutputTable": [
      {
        "campaign_id": "CMP-VERANO",
        "spend_usd": 109839.33,
        "ft_orders": 343,
        "ft_revenue_usd": 105682.79,
        "ft_roas": 0.96,
        "lt_orders": 882,
        "lt_revenue_usd": 167970.62,
        "lt_roas": 1.53
      },
      {
        "campaign_id": "CMP-ORIGEN",
        "spend_usd": 26703.45,
        "ft_orders": 985,
        "ft_revenue_usd": 372810.74,
        "ft_roas": 13.96,
        "lt_orders": 867,
        "lt_revenue_usd": 162456.7,
        "lt_roas": 6.08
      },
      {
        "campaign_id": "CMP-BARISTA",
        "spend_usd": 22306.35,
        "ft_orders": 1712,
        "ft_revenue_usd": 705172.42,
        "ft_roas": 31.61,
        "lt_orders": 866,
        "lt_revenue_usd": 317517.18,
        "lt_roas": 14.23
      },
      {
        "campaign_id": "CMP-RETENCION",
        "spend_usd": 14102.07,
        "ft_orders": 1745,
        "ft_revenue_usd": 752319.96,
        "ft_roas": 53.35,
        "lt_orders": 832,
        "lt_revenue_usd": 453985.01,
        "lt_roas": 32.19
      }
    ],
    "orderMatters": true,
    "hints": [
      "En la CTE attributed añade debajo del LEFT JOIN first_touch: ASOF LEFT JOIN touchpoints tp ON o.customer_id = tp.customer_id AND o.order_ts >= tp.event_ts.",
      "Para calcular lt_campaign_24h usa CASE WHEN tp.event_ts IS NOT NULL AND DATEDIFF('hour', tp.event_ts, o.order_ts) <= 24 THEN tp.campaign_id ELSE 'EXPIRADO_O_DIRECTO' END.",
      "Mantén el filtro de orders_window entre 2024-01-01 y 2024-10-17 para que el numerador de ingresos coincida con el periodo de marketing_spend."
    ],
    "solution": "WITH touchpoints AS (\n  SELECT DISTINCT\n    customer_id,\n    event_ts,\n    campaign_id\n  FROM events\n  WHERE customer_id IS NOT NULL\n    AND campaign_id IS NOT NULL\n),\nfirst_touch AS (\n  SELECT\n    customer_id,\n    ARG_MIN(campaign_id, event_ts) AS first_campaign,\n    MIN(event_ts) AS first_ts\n  FROM touchpoints\n  GROUP BY customer_id\n),\norders_window AS (\n  SELECT\n    order_id,\n    customer_id,\n    order_ts,\n    total_usd\n  FROM orders\n  WHERE status = 'completed'\n    AND order_date >= DATE '2024-01-01'\n    AND order_date <= DATE '2024-10-17'\n),\nattributed AS (\n  SELECT\n    o.order_id,\n    o.total_usd,\n    COALESCE(ft.first_campaign, 'SIN_TOQUE') AS ft_campaign,\n    CASE\n      WHEN tp.event_ts IS NOT NULL\n       AND DATEDIFF('hour', tp.event_ts, o.order_ts) <= 24\n      THEN tp.campaign_id\n      ELSE 'EXPIRADO_O_DIRECTO'\n    END AS lt_campaign_24h\n  FROM orders_window o\n  LEFT JOIN first_touch ft\n    ON o.customer_id = ft.customer_id\n   AND ft.first_ts <= o.order_ts\n  ASOF LEFT JOIN touchpoints tp\n    ON o.customer_id = tp.customer_id\n   AND o.order_ts >= tp.event_ts\n),\nft_agg AS (\n  SELECT ft_campaign AS campaign_id, COUNT(*) AS ft_orders, ROUND(SUM(total_usd), 2) AS ft_revenue_usd\n  FROM attributed\n  GROUP BY ft_campaign\n),\nlt_agg AS (\n  SELECT lt_campaign_24h AS campaign_id, COUNT(*) AS lt_orders, ROUND(SUM(total_usd), 2) AS lt_revenue_usd\n  FROM attributed\n  GROUP BY lt_campaign_24h\n),\nspend_agg AS (\n  SELECT campaign_id, ROUND(SUM(spend_usd), 2) AS spend_usd\n  FROM marketing_spend\n  GROUP BY campaign_id\n)\nSELECT\n  s.campaign_id,\n  s.spend_usd,\n  f.ft_orders,\n  f.ft_revenue_usd,\n  ROUND(f.ft_revenue_usd / s.spend_usd, 2) AS ft_roas,\n  l.lt_orders,\n  l.lt_revenue_usd,\n  ROUND(l.lt_revenue_usd / s.spend_usd, 2) AS lt_roas\nFROM spend_agg s\nJOIN ft_agg f ON s.campaign_id = f.campaign_id\nJOIN lt_agg l ON s.campaign_id = l.campaign_id\nORDER BY s.spend_usd DESC;",
    "solutionExplanation": "El ASOF LEFT JOIN combinado con la ventana de 24 horas revela la distorsión del último toque: CMP-VERANO infla su ROAS de 0,96 a 1,53 capturando el último clic de usuarios que fueron originados por CMP-ORIGEN, CMP-BARISTA y CMP-RETENCION."
  },
  "roleNotes": {
    "de": "Ordena físicamente las tablas de eventos en archivos Parquet por la clave compuesta (customer_id, event_ts) para acelerar la ejecución de operadores ASOF JOIN sobre millones de registros históricos.",
    "da": "Nunca apruebes aumentos de presupuesto basados solo en ROAS de último toque; contrasta siempre primer toque, último toque acotado y experimentos de incrementalidad con chequeo previo de equilibrio SRM.",
    "bi": "En los cuadros de mando de marketing coloca lado a lado el ROAS de primer toque y el de último toque junto al indicador de validez experimental (srm_p_value) de las pruebas A/B."
  },
  "summary": [
    "El primer toque (ARG_MIN) premia el descubrimiento inicial, mientras el último toque (ASOF JOIN) premia el cierre inmediato.",
    "Todo ASOF LEFT JOIN de atribución exige una ventana de caducidad para no adjudicar ventas a clics antiguos.",
    "El último toque sobreestima el ROAS de campañas masivas como CMP-VERANO al apropiarse de clientes ya captados.",
    "La incrementalidad real se mide con grupos holdout y Diferencia en Diferencias (DID), previa validación de ausencia de SRM."
  ],
  "flashcards": [
    {
      "id": "fc-da3-prod-04-01",
      "front": "¿Por qué es necesario añadir un filtro DATEDIFF('hour', tp.event_ts, o.order_ts) <= 24 después de un ASOF LEFT JOIN de atribución?",
      "back": "Porque ASOF LEFT JOIN devuelve el evento previo más cercano aunque haya ocurrido meses atrás; la ventana evita atribuir el pedido a un toque caducado."
    },
    {
      "id": "fc-da3-prod-04-02",
      "front": "¿Por qué la campaña CMP-VERANO pasa de un ROAS de 0,96 en primer toque a 1,53 en último toque?",
      "back": "Porque intercepta el último clic previo al pago de clientes que ya habían sido originados y fidelizados por otras campañas."
    },
    {
      "id": "fc-da3-prod-04-03",
      "front": "¿Qué indica un srm_p_value = 0,0001 en un experimento como EXP-PUSH-CART y qué decisión implica?",
      "back": "Indica un desbalance severo en la asignación aleatoria (Sample Ratio Mismatch: 980 control vs 620 tratamiento), por lo que el experimento debe invalidarse."
    }
  ],
  "glossaryTerms": [
    "atribucion-ultimo-toque-asof",
    "incrementalidad-diferencia-en-diferencias"
  ],
  "sources": [
    {
      "title": "ASOF JOIN — DuckDB SQL Query Syntax",
      "url": "https://duckdb.org/docs/sql/query_syntax/from.html#asof-join",
      "publisher": "DuckDB Foundation",
      "accessed": "2026-10-29",
      "supports": "Sintaxis y ejecución de ASOF LEFT JOIN para emparejar transacciones con el evento previo más reciente."
    },
    {
      "title": "ASOF JOIN — Snowflake SQL Reference",
      "url": "https://docs.snowflake.com/en/sql-reference/constructs/asof-join",
      "publisher": "Snowflake",
      "accessed": "2026-10-29",
      "supports": "Semántica de emparejamiento por proximidad temporal sin explosión cartesiana."
    },
    {
      "title": "Ghost Ads: Improving the Economics of Measuring Online Ad Effectiveness",
      "url": "https://www.nber.org/papers/w21303",
      "publisher": "National Bureau of Economic Research (Johnson, Lewis & Nubbemeyer)",
      "accessed": "2026-10-29",
      "supports": "Sesgo de selección en atribución de último toque y diseño de controles holdout para medir lift causal."
    },
    {
      "title": "Meridian — Open-Source Marketing Mix Modeling and Incrementality",
      "url": "https://developers.google.com/meridian",
      "publisher": "Google Developers",
      "accessed": "2026-10-29",
      "supports": "Diferencia entre ROAS atribuido por clics e incrementalidad causal calibrada con experimentos."
    }
  ],
  "aiNotes": "Si la consulta del estudiante no devuelve filas o el ROAS de último toque sale inflado por encima de 4x en CMP-VERANO, verifica que haya filtrado orders_window entre 2024-01-01 y 2024-10-17 y que aplique la ventana de 24 horas sobre tp.event_ts."
};

export default lesson;
