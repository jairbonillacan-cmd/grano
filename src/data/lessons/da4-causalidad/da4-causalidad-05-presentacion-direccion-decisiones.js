export default {
  id: 'da4-causalidad-05-presentacion-direccion-decisiones',
  moduleId: 'da4-causalidad',
  title: 'Presentación a dirección y decisiones',
  subtitle: 'Matrices de decisión ejecutiva, cuantificación de costos de error Tipo I/II, economía de umbrales y monitoreo post-lanzamiento',
  tracks: ['da'],
  level: 4,
  order: 5,
  minutes: 20,
  prerequisites: ['da4-causalidad-04-memo-analitico-supuestos'],
  contentVersion: 1,
  hook: 'Tras presentar tu evaluación de impacto al Comité de Dirección de Mercado Brisa, la directora financiera pregunta cuánto dinero perdemos si escalamos el programa de envío gratis y resulta ser ruido estadístico, o si lo cancelamos cuando en realidad sí era rentable. Un intervalo de confianza por sí solo no toma decisiones de inversión. ¿Cómo traduces la incertidumbre causal, las métricas de guardarrail y el costo operativo en una matriz de decisión ejecutiva con reglas claras?',
  objectives: [
    'Traducir efectos causales estimados (ATE, ATT o LATE) a escenarios financieros conservador, central y optimista netos del costo de intervención.',
    'Auditar métricas de guardarrail (como tasa de reembolsos e ingreso neto posdevolución) para evitar optimizar métricas primarias a costa del margen.',
    'Construir en DuckDB una matriz de decisión ejecutiva sobre experiments y experiment_assignments que clasifique iniciativas en desplegar, piloto acotado o descartar.'
  ],
  sections: [
    {
      id: 'sec-efecto-a-valor-financiero',
      heading: '1. Del estimador estadístico a los escenarios de margen neto',
      body: `Un comité ejecutivo no asigna presupuesto en desviaciones estándar ni en puntos porcentuales aislados. Decide en **margen incremental neto**, flujo de caja y retorno sobre el capital invertido. El primer paso consiste en traducir el efecto causal estimado (\`efecto_did\`) a valor económico por unidad tratada. Luego se resta el costo umbral de producir la intervención (\`costo_umbral_usd\`).

Además del estimador puntual, debemos propagar los límites del intervalo de confianza del 95 % (\`[ic95_inf, ic95_sup]\`) a la ecuación financiera:

\`margen_neto_escenario = efecto_escenario - costo_umbral_usd\`

Presentamos siempre tres escenarios económicos ante dirección: **conservador** (evaluado en \`ic95_inf\`), **central** (evaluado en \`efecto_did\`) y **optimista** (evaluado en \`ic95_sup\`). Esto transforma la incertidumbre estadística en un lenguaje que finanzas y operaciones comprenden al instante. Permite responder cuál es el resultado financiero en el peor escenario plausible si aprobamos el despliegue general hoy.`,
      example: {
        language: 'sql',
        code: `SELECT
  e.experiment_code,
  ea.variant,
  COUNT(*) AS usuarios,
  ROUND(AVG(CASE WHEN ea.converted THEN 100.0 ELSE 0.0 END), 2) AS tasa_conv_pct,
  ROUND(AVG(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd), 2) AS delta_gasto_bruto_usd
FROM experiment_assignments ea
JOIN experiments e ON ea.experiment_id = e.experiment_id
WHERE e.experiment_code IN ('EXP-CHECKOUT-1STEP', 'EXP-FREE-SHIP-45')
GROUP BY e.experiment_code, ea.variant
ORDER BY e.experiment_code, ea.variant;`,
        expectedOutput: [
          { experiment_code: 'EXP-CHECKOUT-1STEP', variant: 'control', usuarios: 800, tasa_conv_pct: 99.13, delta_gasto_bruto_usd: -11.44 },
          { experiment_code: 'EXP-CHECKOUT-1STEP', variant: 'treatment', usuarios: 800, tasa_conv_pct: 100, delta_gasto_bruto_usd: -4.57 },
          { experiment_code: 'EXP-FREE-SHIP-45', variant: 'control', usuarios: 800, tasa_conv_pct: 100, delta_gasto_bruto_usd: -13.9 },
          { experiment_code: 'EXP-FREE-SHIP-45', variant: 'treatment', usuarios: 800, tasa_conv_pct: 100, delta_gasto_bruto_usd: -7.68 }
        ]
      }
    },
    {
      id: 'sec-asimetria-error-y-guardarrailes',
      heading: '2. Asimetría de errores Tipo I/II y métricas de guardarrail',
      body: `Las pruebas de hipótesis convencionales fijan por costumbre \`alfa = 0.05\` y \`beta = 0.20\`. En decisiones de negocio reales, los costos de equivocarse rara vez son simétricos. Debemos calibrar la exigencia de evidencia según la irreversibilidad de cada programa:

- **Error Tipo I (falso positivo — escalar una iniciativa deficitaria)**: implica asumir costos hundidos de despliegue, subsidios logísticos o deuda técnica cuando el beneficio neto real es negativo. Es crítico cuando la decisión es **irreversible** o de alto costo unitario.
- **Error Tipo II (falso negativo — descartar una iniciativa rentable)**: implica perder el margen incremental que habría generado la mejora. Pesa más cuando el cambio es de bajo costo y fácil reversión.

Además, ningún aumento en ticket bruto justifica escalar si deteriora una **métrica de guardarrail**. En Mercado Brisa cruzamos siempre ` + '`orders`' + ` con ` + '`refunds`' + ` para verificar que el aumento en ventas no esté inflado por pedidos que terminan en devoluciones procesadas.`,
      example: {
        language: 'sql',
        code: `WITH reembolsos_pedido AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS monto_reembolsado_usd
  FROM refunds
  WHERE status = 'processed'
  GROUP BY order_id
)
SELECT
  s.region,
  COUNT(*) AS n_pedidos,
  ROUND(AVG(o.total_usd), 2) AS ticket_bruto_usd,
  ROUND(AVG(CASE WHEN r.order_id IS NOT NULL THEN 100.0 ELSE 0.0 END), 2) AS tasa_reembolso_pct,
  ROUND(AVG(o.total_usd - COALESCE(r.monto_reembolsado_usd, 0)), 2) AS ingreso_neto_usd
FROM orders o
JOIN stores s ON o.store_id = s.store_id
LEFT JOIN reembolsos_pedido r ON o.order_id = r.order_id
WHERE o.status = 'completed'
  AND o.order_date >= '2024-01-01' AND o.order_date < '2025-01-01'
GROUP BY s.region
ORDER BY s.region;`,
        expectedOutput: [
          { region: 'Andina', n_pedidos: 2154, ticket_bruto_usd: 398.48, tasa_reembolso_pct: 8.31, ingreso_neto_usd: 378.45 },
          { region: 'Cono Sur', n_pedidos: 2199, ticket_bruto_usd: 417.93, tasa_reembolso_pct: 6.41, ingreso_neto_usd: 401.38 },
          { region: 'Iberia', n_pedidos: 1232, ticket_bruto_usd: 479.27, tasa_reembolso_pct: 6.09, ingreso_neto_usd: 460.92 },
          { region: 'Norteamérica', n_pedidos: 912, ticket_bruto_usd: 398.79, tasa_reembolso_pct: 7.13, ingreso_neto_usd: 382.99 }
        ]
      }
    },
    {
      id: 'sec-matriz-decision-ejecutiva',
      heading: '3. La matriz de decisión bajo incertidumbre y objeciones de dirección',
      body: `Una presentación ejecutiva culmina con una **matriz de decisión** que vincula la evidencia estadística con reglas de acción acordadas de antemano:

1. **Desplegar a toda la base (` + '`1_desplegar_general`' + `)**: el experimento está completado y libre de SRM (` + '`srm_p_value >= 0.01`' + `), y hasta el escenario **conservador** (\`ic95_inf - costo_umbral_usd >= 0\`) es positivo o igual a cero. Incluso en el límite inferior del IC 95 % la iniciativa cubre su costo umbral.
2. **Lanzar piloto acotado (` + '`2_piloto_acotado`' + `)**: el escenario **central** (\`efecto_did - costo_umbral_usd >= 0\`) es rentable, pero el escenario conservador cae por debajo de cero (\`ic95_inf - costo_umbral_usd < 0\`). El programa promete valor pero requiere acotar el riesgo en el segmento de mayor propensión o ampliar muestra.
3. **Descartar o esperar (` + '`3_descartar_o_esperar`' + `)**: el experimento sigue en curso (` + '`status != \'completed\'`' + `), sufrió fallo de validez interna (` + '`srm_p_value < 0.01`' + `), o ni siquiera su estimador central cubre el costo umbral.

Al responder objeciones en el comité, recuerda distinguir entre **ATE** (promedio poblacional) y **LATE** (efecto local en el umbral de 80 USD visto en RDD): un descuento rentable en canastas de 80 USD no debe extrapolarse sin recalibración a canastas de 25 USD.`
    }
  ],
  workedExample: {
    title: 'Caso guiado: Auditoría de guardarraíles y escenarios financieros para el Comité de Dirección',
    description: 'Combinamos la auditoría de reembolsos en orders y refunds con la estimación de intervalos de confianza en experiments y experiment_assignments para construir la recomendación ejecutiva.',
    steps: [
      {
        label: 'Paso 1: Auditar la métrica de guardarrail (reembolsos e ingreso neto) por región',
        explanation: 'Verificamos en los pedidos completados de 2024 cuánto se erosiona el ticket bruto al descontar los reembolsos procesados en cada región comercial.',
        code: `WITH reembolsos_por_pedido AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS monto_reembolsado_usd
  FROM refunds
  WHERE status = 'processed'
  GROUP BY order_id
)
SELECT
  s.region,
  COUNT(*) AS n_pedidos,
  ROUND(AVG(o.total_usd), 2) AS ticket_bruto_usd,
  ROUND(AVG(COALESCE(r.monto_reembolsado_usd, 0)), 2) AS reembolso_medio_usd,
  ROUND(AVG(CASE WHEN r.order_id IS NOT NULL THEN 100.0 ELSE 0.0 END), 2) AS tasa_reembolso_pct,
  ROUND(AVG(o.total_usd - COALESCE(r.monto_reembolsado_usd, 0)), 2) AS ingreso_neto_usd
FROM orders o
JOIN stores s ON o.store_id = s.store_id
LEFT JOIN reembolsos_por_pedido r ON o.order_id = r.order_id
WHERE o.status = 'completed'
  AND o.order_date >= '2024-01-01' AND o.order_date < '2025-01-01'
GROUP BY s.region
ORDER BY s.region;`,
        expectedOutput: [
          { region: 'Andina', n_pedidos: 2154, ticket_bruto_usd: 398.48, reembolso_medio_usd: 20.03, tasa_reembolso_pct: 8.31, ingreso_neto_usd: 378.45 },
          { region: 'Cono Sur', n_pedidos: 2199, ticket_bruto_usd: 417.93, reembolso_medio_usd: 16.55, tasa_reembolso_pct: 6.41, ingreso_neto_usd: 401.38 },
          { region: 'Iberia', n_pedidos: 1232, ticket_bruto_usd: 479.27, reembolso_medio_usd: 18.35, tasa_reembolso_pct: 6.09, ingreso_neto_usd: 460.92 },
          { region: 'Norteamérica', n_pedidos: 912, ticket_bruto_usd: 398.79, reembolso_medio_usd: 15.8, tasa_reembolso_pct: 7.13, ingreso_neto_usd: 382.99 }
        ]
      },
      {
        label: 'Paso 2: Estimar los límites del IC 95 % del efecto DiD para los 6 experimentos',
        explanation: 'Calculamos para cada experimento del catálogo el estimador ajustado por gasto preasignación (efecto_did) y sus límites inferior y superior al 95 %.',
        code: `WITH stats AS (
  SELECT
    e.experiment_id,
    e.experiment_code,
    e.status,
    e.srm_p_value,
    AVG(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'treatment')
      - AVG(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'control') AS efecto_did,
    SQRT(
      VAR_SAMP(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'treatment')
        / COUNT(*) FILTER (WHERE ea.variant = 'treatment')
      + VAR_SAMP(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'control')
        / COUNT(*) FILTER (WHERE ea.variant = 'control')
    ) AS se_did
  FROM experiments e
  JOIN experiment_assignments ea ON e.experiment_id = ea.experiment_id
  GROUP BY 1, 2, 3, 4
)
SELECT
  experiment_code,
  status,
  ROUND(efecto_did, 2) AS efecto_did_usd,
  ROUND(efecto_did - 1.96 * se_did, 2) AS ic95_inf_usd,
  ROUND(efecto_did + 1.96 * se_did, 2) AS ic95_sup_usd
FROM stats
ORDER BY experiment_id;`,
        expectedOutput: [
          { experiment_code: 'EXP-CHECKOUT-1STEP', status: 'completed', efecto_did_usd: 6.87, ic95_inf_usd: 5.85, ic95_sup_usd: 7.89 },
          { experiment_code: 'EXP-FREE-SHIP-45', status: 'completed', efecto_did_usd: 6.22, ic95_inf_usd: 5.19, ic95_sup_usd: 7.24 },
          { experiment_code: 'EXP-SUB-BUNDLE', status: 'completed', efecto_did_usd: 6.55, ic95_inf_usd: 5.5, ic95_sup_usd: 7.6 },
          { experiment_code: 'EXP-QUIZ-ORIGEN', status: 'completed', efecto_did_usd: 6.51, ic95_inf_usd: 5.47, ic95_sup_usd: 7.55 },
          { experiment_code: 'EXP-UPSELL-MOLINO', status: 'running', efecto_did_usd: 6.72, ic95_inf_usd: 5.67, ic95_sup_usd: 7.77 },
          { experiment_code: 'EXP-PUSH-CART', status: 'stopped_srm', efecto_did_usd: 5.77, ic95_inf_usd: 4.72, ic95_sup_usd: 6.82 }
        ]
      }
    ]
  },
  checks: [
    {
      id: 'chk-da4-05-1',
      type: 'mcq',
      prompt: 'En el experimento `EXP-FREE-SHIP-45` (`completed`, sin SRM), el efecto DiD estimado es +6.22 USD por usuario con IC 95 % de [5.19, 7.24] USD. Si el subsidio logístico y operativo tiene un costo umbral de 5.50 USD por usuario, ¿qué acción prescribe la matriz de decisión?',
      options: [
        {
          id: 'a',
          text: '1_desplegar_general, porque el escenario central (+6.22 USD) supera el costo de 5.50 USD.',
          correct: false,
          feedback: 'El despliegue general exige que incluso el límite inferior del IC 95 % (5.19 USD) cubra el costo umbral.'
        },
        {
          id: 'b',
          text: '2_piloto_acotado, porque el margen neto central es positivo (+0.72 USD), pero el escenario conservador en el límite inferior del IC 95 % es negativo (-0.31 USD).',
          correct: true,
          feedback: 'Exacto: cuando el escenario central supera el umbral pero el límite inferior queda por debajo (5.19 - 5.50 = -0.31 USD), se recomienda un piloto acotado o extender muestra.'
        },
        {
          id: 'c',
          text: '3_descartar_o_esperar, porque cualquier iniciativa cuyo límite inferior sea menor a +10.00 USD destruye valor.',
          correct: false,
          feedback: 'El umbral relevante es el costo del programa (5.50 USD), no un valor arbitrario de 10 USD.'
        }
      ],
      explanation: 'Al restar el costo de 5.50 USD a los tres puntos del intervalo [5.19, 6.22, 7.24], obtenemos escenarios de [-0.31, +0.72, +1.74] USD: rentable en el escenario central pero con riesgo a la baja en el extremo conservador.'
    },
    {
      id: 'chk-da4-05-2',
      type: 'predict-output',
      prompt: 'En 2024 la región Andina registra un ticket bruto medio de 398.48 USD y la región Norteamérica de 398.79 USD. Sin embargo, al cruzar con `refunds`, Andina tiene un reembolso medio de 20.03 USD (tasa de 8.31 %) frente a 15.80 USD en Norteamérica (7.13 %). ¿Cuál es la brecha de ingreso neto posreembolso (Norteamérica menos Andina)?',
      options: [
        {
          id: 'a',
          text: '+0.31 USD; los reembolsos afectan por igual a todas las regiones.',
          correct: false,
          feedback: '+0.31 USD es solo la diferencia en ticket bruto antes de descontar devoluciones.'
        },
        {
          id: 'b',
          text: '+4.54 USD (382.99 USD frente a 378.45 USD); la mayor tasa de devolución en Andina amplía catorce veces la brecha neta respecto al ticket bruto.',
          correct: true,
          feedback: 'Correcto: al descontar los reembolsos procesados, Andina cae a 378.45 USD y Norteamérica a 382.99 USD.'
        },
        {
          id: 'c',
          text: '-4.23 USD; Andina supera en ingreso neto a Norteamérica.',
          correct: false,
          feedback: 'Andina tiene mayor reembolso medio (20.03 vs 15.80 USD), por lo que su ingreso neto es menor.'
        }
      ],
      explanation: 'Auditar la métrica de guardarrail (reembolsos) revela que dos regiones con ticket bruto casi idéntico (~398.5 USD) difieren en 4.54 USD por pedido en ingreso neto real.'
    },
    {
      id: 'chk-da4-05-3',
      type: 'mcq',
      prompt: 'Durante la presentación a dirección, el director comercial propone aplicar el descuento de la Lección 2 (evaluado mediante RDD en el umbral de 80 USD) a todos los carritos desde 20 USD, argumentando que el efecto será idéntico. ¿Qué respuesta técnica es la adecuada?',
      options: [
        {
          id: 'a',
          text: 'Aceptar la propuesta porque el estimador RDD identifica el efecto medio poblacional global (ATE) para cualquier monto de compra.',
          correct: false,
          feedback: 'El diseño RDD solo identifica el efecto promedio local (LATE) exactamente en la vecindad del punto de corte c = 80 USD.'
        },
        {
          id: 'b',
          text: 'Explicar que el diseño RDD estima un efecto local (LATE) en carritos cercanos a 80 USD; extrapolar el subsidio a canastas de 20 USD erosionaría el margen unitario sin evidencia de validez externa.',
          correct: true,
          feedback: 'Exacto: transportar un LATE de 80 USD a carritos de 20 USD viola la validez externa y destruye margen porcentual.'
        },
        {
          id: 'c',
          text: 'Afirmar que ningún diseño cuasiexperimental sirve para tomar decisiones comerciales.',
          correct: false,
          feedback: 'El diseño RDD es plenamente válido para decidir sobre el umbral de 80 USD o ajustes cercanos a ese corte.'
        }
      ],
      explanation: 'Comunicar con precisión la diferencia entre el efecto local en el corte (LATE) y el promedio poblacional (ATE) evita extrapolaciones costosas fuera del rango de soporte.'
    }
  ],
  practice: {
    type: 'sql',
    title: 'Construir la matriz de decisión ejecutiva bajo incertidumbre para los 6 experimentos',
    language: 'sql',
    prompt: 'Construye la matriz de decisión ejecutiva uniendo `experiments` y `experiment_assignments`. La CTE `stats` ya calcula para cada experimento: `status`, `srm_p_value`, `costo_umbral_usd` (`5.50` USD para `\'EXP-FREE-SHIP-45\'` y `2.00` USD para el resto), `efecto_did` y `se_did`. Completa el `SELECT` final para devolver: `experiment_code`, `costo_umbral_usd` (a 2 decimales), `margen_neto_conservador` (`(efecto_did - 1.96 * se_did) - costo_umbral_usd` a 2 decimales), `margen_neto_central` (`efecto_did - costo_umbral_usd` a 2 decimales), `margen_neto_optimista` (`(efecto_did + 1.96 * se_did) - costo_umbral_usd` a 2 decimales) y `decision_ejecutiva` (`\'3_descartar_o_esperar\'` si `srm_p_value < 0.01 OR status != \'completed\'`, `\'1_desplegar_general\'` si `(efecto_did - 1.96 * se_did) >= costo_umbral_usd`, `\'2_piloto_acotado\'` si `efecto_did >= costo_umbral_usd AND (efecto_did - 1.96 * se_did) < costo_umbral_usd`, y `\'3_descartar_o_esperar\'` en caso contrario). Ordena por `experiment_id ASC`.',
    starterCode: `WITH stats AS (
  SELECT
    e.experiment_id,
    e.experiment_code,
    e.status,
    e.srm_p_value,
    CASE
      WHEN e.experiment_code = 'EXP-FREE-SHIP-45' THEN 5.50::DOUBLE
      ELSE 2.00::DOUBLE
    END AS costo_umbral_usd,
    AVG(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'treatment')
      - AVG(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'control') AS efecto_did,
    SQRT(
      VAR_SAMP(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'treatment')
        / COUNT(*) FILTER (WHERE ea.variant = 'treatment')
      + VAR_SAMP(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'control')
        / COUNT(*) FILTER (WHERE ea.variant = 'control')
    ) AS se_did
  FROM experiments e
  JOIN experiment_assignments ea ON e.experiment_id = ea.experiment_id
  GROUP BY 1, 2, 3, 4
)
SELECT
  experiment_code,
  ROUND(costo_umbral_usd, 2) AS costo_umbral_usd,
  -- Reemplaza los ceros y completa la regla CASE de decision_ejecutiva:
  0.0 AS margen_neto_conservador,
  0.0 AS margen_neto_central,
  0.0 AS margen_neto_optimista,
  'pendiente' AS decision_ejecutiva
FROM stats
ORDER BY experiment_id ASC;`,
    expected: `WITH stats AS (
  SELECT
    e.experiment_id,
    e.experiment_code,
    e.status,
    e.srm_p_value,
    CASE
      WHEN e.experiment_code = 'EXP-FREE-SHIP-45' THEN 5.50::DOUBLE
      ELSE 2.00::DOUBLE
    END AS costo_umbral_usd,
    AVG(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'treatment')
      - AVG(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'control') AS efecto_did,
    SQRT(
      VAR_SAMP(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'treatment')
        / COUNT(*) FILTER (WHERE ea.variant = 'treatment')
      + VAR_SAMP(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'control')
        / COUNT(*) FILTER (WHERE ea.variant = 'control')
    ) AS se_did
  FROM experiments e
  JOIN experiment_assignments ea ON e.experiment_id = ea.experiment_id
  GROUP BY 1, 2, 3, 4
)
SELECT
  experiment_code,
  ROUND(costo_umbral_usd, 2) AS costo_umbral_usd,
  ROUND((efecto_did - 1.96 * se_did) - costo_umbral_usd, 2) AS margen_neto_conservador,
  ROUND(efecto_did - costo_umbral_usd, 2) AS margen_neto_central,
  ROUND((efecto_did + 1.96 * se_did) - costo_umbral_usd, 2) AS margen_neto_optimista,
  CASE
    WHEN srm_p_value < 0.01 OR status != 'completed' THEN '3_descartar_o_esperar'
    WHEN (efecto_did - 1.96 * se_did) >= costo_umbral_usd THEN '1_desplegar_general'
    WHEN efecto_did >= costo_umbral_usd AND (efecto_did - 1.96 * se_did) < costo_umbral_usd THEN '2_piloto_acotado'
    ELSE '3_descartar_o_esperar'
  END AS decision_ejecutiva
FROM stats
ORDER BY experiment_id ASC;`,
    orderMatters: true,
    hints: [
      'Calcula los tres márgenes netos restando costo_umbral_usd al límite inferior (efecto_did - 1.96 * se_did), al estimador central (efecto_did) y al límite superior (efecto_did + 1.96 * se_did), envolviendo cada uno en ROUND(..., 2).',
      'En el CASE de decision_ejecutiva verifica primero la condición de bloqueo: WHEN srm_p_value < 0.01 OR status != \'completed\' THEN \'3_descartar_o_esperar\'.',
      'Luego evalúa WHEN (efecto_did - 1.96 * se_did) >= costo_umbral_usd THEN \'1_desplegar_general\', seguido de WHEN efecto_did >= costo_umbral_usd AND (efecto_did - 1.96 * se_did) < costo_umbral_usd THEN \'2_piloto_acotado\' ELSE \'3_descartar_o_esperar\'.'
    ],
    solution: `WITH stats AS (
  SELECT
    e.experiment_id,
    e.experiment_code,
    e.status,
    e.srm_p_value,
    CASE
      WHEN e.experiment_code = 'EXP-FREE-SHIP-45' THEN 5.50::DOUBLE
      ELSE 2.00::DOUBLE
    END AS costo_umbral_usd,
    AVG(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'treatment')
      - AVG(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'control') AS efecto_did,
    SQRT(
      VAR_SAMP(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'treatment')
        / COUNT(*) FILTER (WHERE ea.variant = 'treatment')
      + VAR_SAMP(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'control')
        / COUNT(*) FILTER (WHERE ea.variant = 'control')
    ) AS se_did
  FROM experiments e
  JOIN experiment_assignments ea ON e.experiment_id = ea.experiment_id
  GROUP BY 1, 2, 3, 4
)
SELECT
  experiment_code,
  ROUND(costo_umbral_usd, 2) AS costo_umbral_usd,
  ROUND((efecto_did - 1.96 * se_did) - costo_umbral_usd, 2) AS margen_neto_conservador,
  ROUND(efecto_did - costo_umbral_usd, 2) AS margen_neto_central,
  ROUND((efecto_did + 1.96 * se_did) - costo_umbral_usd, 2) AS margen_neto_optimista,
  CASE
    WHEN srm_p_value < 0.01 OR status != 'completed' THEN '3_descartar_o_esperar'
    WHEN (efecto_did - 1.96 * se_did) >= costo_umbral_usd THEN '1_desplegar_general'
    WHEN efecto_did >= costo_umbral_usd AND (efecto_did - 1.96 * se_did) < costo_umbral_usd THEN '2_piloto_acotado'
    ELSE '3_descartar_o_esperar'
  END AS decision_ejecutiva
FROM stats
ORDER BY experiment_id ASC;`,
    solutionExplanation: 'La matriz de decisión clasifica a EXP-CHECKOUT-1STEP, EXP-SUB-BUNDLE y EXP-QUIZ-ORIGEN en 1_desplegar_general (margen neto conservador >= 3.47 USD), asigna EXP-FREE-SHIP-45 a 2_piloto_acotado (central +0.72 USD pero conservador -0.31 USD por su costo logístico de 5.50 USD) y retiene EXP-UPSELL-MOLINO (running) y EXP-PUSH-CART (stopped_srm) en 3_descartar_o_esperar.',
    expectedOutputTable: [
      { experiment_code: 'EXP-CHECKOUT-1STEP', costo_umbral_usd: 2, margen_neto_conservador: 3.85, margen_neto_central: 4.87, margen_neto_optimista: 5.89, decision_ejecutiva: '1_desplegar_general' },
      { experiment_code: 'EXP-FREE-SHIP-45', costo_umbral_usd: 5.5, margen_neto_conservador: -0.31, margen_neto_central: 0.72, margen_neto_optimista: 1.74, decision_ejecutiva: '2_piloto_acotado' },
      { experiment_code: 'EXP-SUB-BUNDLE', costo_umbral_usd: 2, margen_neto_conservador: 3.5, margen_neto_central: 4.55, margen_neto_optimista: 5.6, decision_ejecutiva: '1_desplegar_general' },
      { experiment_code: 'EXP-QUIZ-ORIGEN', costo_umbral_usd: 2, margen_neto_conservador: 3.47, margen_neto_central: 4.51, margen_neto_optimista: 5.55, decision_ejecutiva: '1_desplegar_general' },
      { experiment_code: 'EXP-UPSELL-MOLINO', costo_umbral_usd: 2, margen_neto_conservador: 3.67, margen_neto_central: 4.72, margen_neto_optimista: 5.77, decision_ejecutiva: '3_descartar_o_esperar' },
      { experiment_code: 'EXP-PUSH-CART', costo_umbral_usd: 2, margen_neto_conservador: 2.72, margen_neto_central: 3.77, margen_neto_optimista: 4.82, decision_ejecutiva: '3_descartar_o_esperar' }
    ]
  },
  roleNotes: {
    de: 'Automatiza el etiquetado de usuarios en grupos holdout persistentes mediante hashing determinista con sal de largo plazo. Así los despliegues generales mantienen un grupo de control limpio durante meses sin reasignaciones accidentales.',
    da: 'Sintetiza siempre tu análisis en una matriz de decisión con escenarios conservador, central y optimista netos de costo. Dirección necesita saber cuánto arriesga en el límite inferior del IC 95 % y qué métrica activará una reversión.',
    bi: 'Construye vistas ejecutivas que integren el ingreso bruto de orders con las devoluciones de refunds y los parámetros de costo de cada iniciativa. Así el comité puede simular distintos umbrales de rentabilidad en vivo.'
  },
  summary: [
    'Traducir un estimador causal a valor financiero exige evaluar el margen neto en los escenarios conservador, central y optimista.',
    'La asimetría entre los costos de Error Tipo I y Tipo II define qué umbral de evidencia exigir antes de escalar.',
    'Una matriz de decisión vincula intervalos de confianza, costos y métricas de guardarrail con tres acciones: desplegar, piloto o descartar.',
    'Distinguir entre efecto promedio (ATE) y efecto local en el corte (LATE) evita extrapolaciones costosas fuera del rango estudiado.'
  ],
  flashcards: [
    {
      id: 'fc-da4-05-1',
      front: '¿Cómo se calculan los tres escenarios financieros (conservador, central y optimista) en una matriz de decisión?',
      back: 'Restando el costo umbral unitario de la intervención al límite inferior del IC 95 %, a la estimación puntual y al límite superior del IC 95 %.'
    },
    {
      id: 'fc-da4-05-2',
      front: '¿Qué representan el Error Tipo I y el Error Tipo II en una decisión de inversión sobre un programa?',
      back: 'El Error Tipo I (falso positivo) es escalar un programa deficitario asumiendo sus costos hundidos; el Error Tipo II (falso negativo) es descartar un programa rentable perdiendo su margen incremental.'
    },
    {
      id: 'fc-da4-05-3',
      front: '¿Qué es una métrica de guardarrail (guardrail metric) y cómo se audita en Mercado Brisa?',
      back: 'Es un indicador operativo o financiero (como la tasa de reembolsos en refunds y el ingreso neto posdevolución) que no debe deteriorarse al mejorar la métrica primaria.'
    },
    {
      id: 'fc-da4-05-4',
      front: '¿Cuándo prescribe la matriz de decisión un piloto acotado (2_piloto_acotado) en lugar de un despliegue general?',
      back: 'Cuando la estimación central supera el costo de equilibrio (margen central >= 0), pero el límite inferior del IC 95 % arroja pérdida neta (margen conservador < 0).'
    }
  ],
  glossaryTerms: [
    'matriz-de-decision',
    'principio-de-la-piramide'
  ],
  sources: [
    {
      title: 'Trustworthy Online Controlled Experiments: A Practical Guide to A/B Testing',
      url: 'https://experimentguide.com/',
      publisher: 'Cambridge University Press (Kohavi, Tang & Xu)',
      accessed: '2026-10-29',
      supports: 'Economía de umbrales de decisión, métricas de guardarrail, costos de Error Tipo I/II y grupos holdout de largo plazo.'
    },
    {
      title: 'The Effect: An Introduction to Research Design and Causality — Ch. 10 Treatment Effects',
      url: 'https://theeffectbook.net/ch-TreatmentEffects.html',
      publisher: 'Chapman and Hall/CRC (Nick Huntington-Klein)',
      accessed: '2026-10-29',
      supports: 'Diferencia entre ATE, ATT y LATE al responder objeciones sobre extrapolación de efectos locales.'
    },
    {
      title: 'Causal Inference: The Mixtape — Ch. 4 Potential Outcomes',
      url: 'https://mixtape.scunning.com/04-Potential_Outcomes_and_Randomization.html',
      publisher: 'Yale University Press (Scott Cunningham)',
      accessed: '2026-10-29',
      supports: 'Heterogeneidad de efectos de tratamiento y límites de transporte fuera de la subpoblación tratada.'
    },
    {
      title: 'DuckDB SQL Reference — CASE Statement and Conditional Logic',
      url: 'https://duckdb.org/docs/stable/sql/expressions/case',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Construcción de matrices de decisión y reglas de clasificación condicional en SQL.'
    }
  ],
  aiNotes: 'Guía al estudiante para conectar el intervalo de confianza con el costo umbral de cada experimento (5.50 USD para EXP-FREE-SHIP-45 y 2.00 USD para los demás). Si pregunta por qué EXP-FREE-SHIP-45 va a piloto acotado mientras EXP-CHECKOUT-1STEP se despliega, hazle comparar sus márgenes netos en el límite inferior del IC 95 % (-0.31 USD vs +3.85 USD).'
};
