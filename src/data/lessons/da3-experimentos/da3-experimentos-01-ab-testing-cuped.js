export const lesson = {
  id: 'da3-experimentos-01-ab-testing-cuped',
  legacyId: 'l14-ab-testing-cuped',
  v2Id: 'da3-experimentos-01-ab-testing-cuped',
  moduleId: 'da3-experimentos',
  track: 'da',
  tracks: ['da', 'ds'],
  level: 3,
  order: 1,
  legacyOrder: 14,
  contentVersion: 2,
  title: 'Pruebas A/B en producción: SRM, guardrails y CUPED',
  subtitle: 'Pruebas A/B en producción: SRM, guardrails y reducción de varianza (CUPED)',
  minutes: 30,
  needsReview: false,
  prerequisites: [
    'da2-inferencia',
    'da3-producto',
  ],
  learningObjectives: [
    'Diagnosticar desbalances de asignación (Sample Ratio Mismatch) mediante la prueba chi-cuadrado antes de interpretar métricas de negocio.',
    'Definir métricas de protección (guardrails) para prevenir degradaciones colaterales en reembolsos, latencia o retención.',
    'Aplicar el estimador lineal CUPED con covariables pre-experimento en SQL para reducir el error estándar sin introducir sesgo.',
  ],
  hook: 'El equipo de producto de Mercado Brisa celebra que el recordatorio de carrito (EXP-PUSH-CART) elevó el gasto post-asignación en 5.94 USD por usuario, pero al revisar la tabla experiment_assignments descubres 980 clientes en control y solo 620 en tratamiento: ¿por qué ese desbalance invalida cualquier conclusión causal y cómo puedes multiplicar por cuatro la precisión de los experimentos sanos sin esperar meses por más tráfico?',
  objectives: [
    'Auditar Sample Ratio Mismatch (SRM) con bondad de ajuste chi-cuadrado sobre conteos por variante.',
    'Proteger el despliegue mediante métricas guardrail operativas y financieras.',
    'Implementar la reducción de varianza CUPED en DuckDB aprovechando el gasto pre-experimento.',
  ],
  sections: [
    {
      id: 'srm-guardrails',
      heading: 'Auditoría de integridad: Sample Ratio Mismatch y métricas guardrail',
      body: `En producción, una diferencia estadísticamente significativa carece de validez si el mecanismo de aleatorización falló. El primer filtro obligatorio consiste en auditar el **Sample Ratio Mismatch** (SRM). Este fallo ocurre cuando la proporción observada de usuarios entre variantes se desvía de la división diseñada.

En una asignación 50/50 con $N$ usuarios totales, contrastamos los conteos observados ($N_C, N_T$) frente al conteo esperado $E = 0.5 N$. Para ello calculamos el estadístico chi-cuadrado de un grado de libertad.

$$\\chi^2_{\\text{SRM}} = \\frac{(N_C - 0.5N)^2}{0.5N} + \\frac{(N_T - 0.5N)^2}{0.5N}.$$

Si $\\chi^2_{\\text{SRM}} > 10.83$ ($p < 0.001$), el experimento se detiene y se descarta de inmediato. En **Mercado Brisa**, el experimento \`EXP-PUSH-CART\` (\`experiment_id = 6\`) registró $980$ usuarios en control y $620$ en tratamiento sobre $N = 1{,}600$. Esto arroja $\\chi^2 = 81.00$ porque un fallo de telemetría en Android descartó sesiones del brazo tratado.

Superado el filtro SRM, el despliegue exige evaluar **métricas de protección** (*guardrails*). La métrica primaria mide el objetivo directo de gasto post-asignación. Por su parte, los *guardrails* vigilan que el cambio no eleve los reembolsos ni degrade la conversión.`,
    },
    {
      id: 'cuped-reduccion-varianza',
      heading: 'Reducción de varianza con covariables pre-experimento (CUPED)',
      body: `Cuando el tráfico es limitado o la métrica monetaria presenta alta dispersión, el error estándar de la diferencia cruda ($\\bar{Y}_T - \\bar{Y}_C$) resulta elevado. El método **CUPED** (*Controlled-experiment Using Pre-Experiment Data*, Deng et al., 2013) sustrae la variabilidad histórica explicada por una covariable basal $X$. Dicha covariable debe medirse estrictamente antes de la asignación aleatoria.

Para cada usuario construimos la métrica ajustada restando la proyección lineal sobre $X$.

$$\\hat{Y}_{\\text{CUPED}, i} = Y_i - \\theta\\,(X_i - \\bar{X}), \\qquad \\theta^* = \\frac{\\text{Cov}(Y, X)}{\\text{Var}(X)}.$$

Tanto $\\bar{X}$ como $\\theta^*$ se estiman sobre la muestra combinada del experimento. Como la aleatorización garantiza que $\\mathbb{E}[\\bar{X}_T - \\bar{X}_C] = 0$, la diferencia ajustada $\\bar{Y}_{\\text{CUPED}, T} - \\bar{Y}_{\\text{CUPED}, C}$ es un estimador **insesgado** del efecto causal.

La ventaja central reside en su menor varianza muestral. Si la correlación lineal entre el gasto previo $X$ y el gasto posterior $Y$ es $r_{XY}$, la varianza se contrae en un factor $(1 - r_{XY}^2)$.

$$\\text{Var}(\\hat{\\Delta}_{\\text{CUPED}}) = \\text{Var}(\\hat{\\Delta}_{\\text{crudo}})\\,(1 - r_{XY}^2).$$

En \`EXP-CHECKOUT-1STEP\`, donde $r_{XY} = 0.9678$, CUPED elimina el $93.7\\%$ de la varianza residual. Así reduce el error estándar a la cuarta parte.`,
      interactive: {
        component: 'ab-test-cuped-simulator',
        caption: 'Ajusta la correlación pre-experimento (r) y observa cómo se estrecha la distribución muestral bajo CUPED sin desplazar la media del efecto.',
      },
      example: {
        language: 'sql',
        title: 'Auditoría SRM chi-cuadrado en los 6 experimentos de Mercado Brisa',
        code: `WITH conteos AS (
  SELECT
    e.experiment_id,
    e.experiment_code,
    SUM(CASE WHEN a.variant = 'control' THEN 1 ELSE 0 END) AS n_control,
    SUM(CASE WHEN a.variant = 'treatment' THEN 1 ELSE 0 END) AS n_treatment,
    COUNT(*) AS n_total
  FROM experiments e
  JOIN experiment_assignments a USING (experiment_id)
  GROUP BY 1, 2
)
SELECT
  experiment_id,
  experiment_code,
  n_control,
  n_treatment,
  ROUND(
    POWER(n_control - 0.5 * n_total, 2) / (0.5 * n_total)
    + POWER(n_treatment - 0.5 * n_total, 2) / (0.5 * n_total),
    2
  ) AS chi2_srm,
  CASE
    WHEN POWER(n_control - 0.5 * n_total, 2) / (0.5 * n_total)
       + POWER(n_treatment - 0.5 * n_total, 2) / (0.5 * n_total) > 10.83
    THEN 'ALERTA_SRM'
    ELSE 'BALANCEADO'
  END AS estado_srm
FROM conteos
ORDER BY experiment_id;`,
        expectedOutput: [
          { experiment_id: 1, experiment_code: 'EXP-CHECKOUT-1STEP', n_control: 800, n_treatment: 800, chi2_srm: 0, estado_srm: 'BALANCEADO' },
          { experiment_id: 2, experiment_code: 'EXP-FREE-SHIP-45', n_control: 800, n_treatment: 800, chi2_srm: 0, estado_srm: 'BALANCEADO' },
          { experiment_id: 3, experiment_code: 'EXP-SUB-BUNDLE', n_control: 800, n_treatment: 800, chi2_srm: 0, estado_srm: 'BALANCEADO' },
          { experiment_id: 4, experiment_code: 'EXP-QUIZ-ORIGEN', n_control: 800, n_treatment: 800, chi2_srm: 0, estado_srm: 'BALANCEADO' },
          { experiment_id: 5, experiment_code: 'EXP-UPSELL-MOLINO', n_control: 800, n_treatment: 800, chi2_srm: 0, estado_srm: 'BALANCEADO' },
          { experiment_id: 6, experiment_code: 'EXP-PUSH-CART', n_control: 980, n_treatment: 620, chi2_srm: 81, estado_srm: 'ALERTA_SRM' },
        ],
        annotation: 'Los experimentos 1 a 5 mantienen un balance 800/800 (chi2 = 0), mientras que EXP-PUSH-CART presenta chi2 = 81.00 (> 10.83) y debe invalidarse.',
      },
    },
    {
      id: 'implementacion-sql-cuped',
      heading: 'Implementación de CUPED con expresiones de tabla comunes (CTEs)',
      body: `Para ejecutar CUPED directamente en DuckDB sobre la tabla \`experiment_assignments\`, estructuramos el cálculo en tres etapas mediante expresiones de tabla comunes (*CTEs*).

En la primera etapa calculamos los parámetros globales del experimento sobre todos los usuarios asignados. Obtenemos la media basal $\\bar{X} = \\text{AVG}(\\text{pre\\_experiment\\_spend\\_usd})$ y la pendiente óptima $\\theta^* = \\text{COVAR\\_SAMP}(Y, X) / \\text{VAR\\_SAMP}(X)$. Es indispensable estimar $\\theta^*$ y $\\bar{X}$ agrupando solo por \`experiment_id\`, sin separar por \`variant\`. Así garantizamos que la misma transformación lineal se aplique a ambos brazos.

En la segunda etapa proyectamos la métrica ajustada individual $\\hat{Y}_{\\text{CUPED}, i} = Y_i - \\theta^*(X_i - \\bar{X})$ para cada fila. Finalmente, agregamos por variante para obtener las medias ajustadas y el nuevo error estándar de Welch.

$$\\text{EE}_{\\text{CUPED}} = \\sqrt{\\frac{s_{\\text{CUPED}, C}^2}{n_C} + \\frac{s_{\\text{CUPED}, T}^2}{n_T}}.$$

Debemos verificar siempre que la covariable $X$ no pueda ser alterada por el tratamiento. Si $X$ incluyera compras posteriores al inicio del experimento, restar $\\theta(X - \\bar{X})$ absorbería parte del efecto causal legítimo. Ese error introduce sesgo de atenuación post-tratamiento.`,
    },
  ],
  workedExample: {
    title: 'Reducción de varianza CUPED en EXP-CHECKOUT-1STEP',
    problem: 'Evalúa el experimento EXP-CHECKOUT-1STEP (experiment_id = 1) en Mercado Brisa. Primero inspecciona la dispersión cruda y la correlación pre-post por variante; luego aplica el ajuste CUPED para cuantificar cuánto disminuye la desviación estándar y el error estándar del efecto.',
    steps: [
      {
        title: 'Paso 1: Diagnóstico de varianza cruda y correlación basal en EXP-CHECKOUT-1STEP',
        explanation: 'Antes de ajustar, verificamos que la covariable pre_experiment_spend_usd esté balanceada entre brazos (72.93 vs 72.97 USD) y medimos su correlación lineal con post_experiment_spend_usd.',
        rationale: 'Antes de ajustar, verificamos que la covariable pre_experiment_spend_usd esté balanceada entre brazos (72.93 vs 72.97 USD) y medimos su correlación lineal con post_experiment_spend_usd.',
        code: `SELECT
  variant,
  COUNT(*) AS n_usuarios,
  ROUND(AVG(pre_experiment_spend_usd), 2) AS media_pre_usd,
  ROUND(AVG(post_experiment_spend_usd), 2) AS media_post_cruda,
  ROUND(STDDEV_SAMP(post_experiment_spend_usd), 2) AS sd_cruda,
  ROUND(CORR(post_experiment_spend_usd, pre_experiment_spend_usd), 4) AS r_pre_post
FROM experiment_assignments
WHERE experiment_id = 1
GROUP BY variant
ORDER BY variant;`,
        output: `variant   | n_usuarios | media_pre_usd | media_post_cruda | sd_cruda | r_pre_post
----------+------------+---------------+------------------+----------+-----------
control   | 800        | 72.93         | 61.49            | 18.43    | 0.9678
treatment | 800        | 72.97         | 68.40            | 18.14    | 0.9672`,
        takeaway: 'La diferencia cruda es +6.91 USD (68.40 - 61.49), con una desviación estándar elevada (~18.3 USD) pero una correlación pre-post altísima (r = 0.9678).',
      },
      {
        title: 'Paso 2: Transformación CUPED y contracción de la desviación estándar',
        explanation: 'Calculamos theta = COVAR_SAMP(Y, X) / VAR_SAMP(X) sobre los 1,600 usuarios combinados (theta = 0.6551) y comparamos la dispersión antes y después del ajuste.',
        rationale: 'Calculamos theta = COVAR_SAMP(Y, X) / VAR_SAMP(X) sobre los 1,600 usuarios combinados (theta = 0.6551) y comparamos la dispersión antes y después del ajuste.',
        code: `WITH params AS (
  SELECT
    experiment_id,
    AVG(pre_experiment_spend_usd) AS mean_x,
    COVAR_SAMP(post_experiment_spend_usd, pre_experiment_spend_usd)
      / VAR_SAMP(pre_experiment_spend_usd) AS theta
  FROM experiment_assignments
  WHERE experiment_id = 1
  GROUP BY 1
),
ajustado AS (
  SELECT
    a.variant,
    a.post_experiment_spend_usd AS y,
    p.theta,
    a.post_experiment_spend_usd - p.theta * (a.pre_experiment_spend_usd - p.mean_x) AS y_cuped
  FROM experiment_assignments a
  JOIN params p USING (experiment_id)
)
SELECT
  variant,
  ROUND(AVG(theta), 4) AS theta_optimo,
  ROUND(AVG(y), 2) AS media_cruda,
  ROUND(AVG(y_cuped), 2) AS media_cuped,
  ROUND(STDDEV_SAMP(y), 2) AS sd_cruda,
  ROUND(STDDEV_SAMP(y_cuped), 2) AS sd_cuped
FROM ajustado
GROUP BY variant
ORDER BY variant;`,
        output: `variant   | theta_optimo | media_cruda | media_cuped | sd_cruda | sd_cuped
----------+--------------+-------------+-------------+----------+---------
control   | 0.6551       | 61.49       | 61.50       | 18.43    | 4.64
treatment | 0.6551       | 68.40       | 68.39       | 18.14    | 4.61`,
        takeaway: 'El lift ajustado (+6.89 USD) permanece insesgado, mientras la desviación estándar por brazo cae de ~18.3 USD a ~4.6 USD (una reducción del 75 % en el error estándar).',
      },
    ],
  },
  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: 'En un experimento 50/50 con 1,600 usuarios asignados observas 980 en control y 620 en tratamiento (chi2 = 81.0, p < 0.0001), pero la métrica primaria muestra +5.94 USD en tratamiento. ¿Cuál es la decisión correcta?',
      options: [
        {
          id: 'a',
          text: 'Desplegar el tratamiento porque el tamaño de muestra supera los 1,000 usuarios y el efecto positivo es grande.',
          correct: false,
          feedback: 'Incorrecto. Un tamaño muestral grande no corrige el sesgo de selección cuando falla la aleatorización.',
        },
        {
          id: 'b',
          text: 'Invalidar el experimento por Sample Ratio Mismatch (SRM) y auditar la tubería de asignación o telemetría antes de mirar efectos.',
          correct: true,
          feedback: 'Correcto. Un chi2 = 81.0 evidencia que los grupos dejaron de ser comparables y cualquier estimación causal está contaminada.',
        },
        {
          id: 'c',
          text: 'Aplicar CUPED sobre el experimento para corregir matemáticamente el desbalance de tamaños muestrales.',
          correct: false,
          feedback: 'Incorrecto. CUPED reduce varianza usando covariables pre-experimento, pero no repara un sesgo de supervivencia o telemetría no aleatorio.',
        },
        {
          id: 'd',
          text: 'Eliminar al azar 360 usuarios del grupo control para igualar ambos brazos en 620 usuarios.',
          correct: false,
          feedback: 'Incorrecto. Submuestrear el brazo control no elimina el mecanismo de pérdida selectiva que afectó al brazo de tratamiento.',
        },
      ],
      correctOptionId: 'b',
      explanation: 'Cuando la prueba chi-cuadrado de SRM rechaza la proporción diseñada (p < 0.001), existe pérdida selectiva o sesgo de enrutamiento que invalida la inferencia causal.',
    },
    {
      id: 'c2',
      type: 'mcq',
      prompt: '¿Qué requisito matemático debe cumplir la covariable X en CUPED para que el estimador ajustado conserve insesgadez respecto al efecto causal verdadero?',
      options: [
        {
          id: 'a',
          text: 'Debe medirse estrictamente antes de la asignación al experimento o ser invariante al tratamiento.',
          correct: true,
          feedback: 'Correcto. Si X es previa a la asignación, la aleatorización garantiza E[X_T - X_C] = 0 y el ajuste no introduce sesgo.',
        },
        {
          id: 'b',
          text: 'Debe tener distribución exactamente normal con media cero y varianza unitaria.',
          correct: false,
          feedback: 'Incorrecto. La insesgadez de CUPED depende de la independencia respecto a la asignación, no de la normalidad exacta de X.',
        },
        {
          id: 'c',
          text: 'Debe calcularse sumando las compras realizadas durante la primera semana posterior al inicio del experimento.',
          correct: false,
          feedback: 'Incorrecto. Usar datos post-asignación contamina X con el efecto del tratamiento y produce sesgo de atenuación.',
        },
        {
          id: 'd',
          text: 'Debe estimarse con una pendiente theta distinta para el grupo control y para el grupo tratamiento.',
          correct: false,
          feedback: 'Incorrecto. El coeficiente theta y la media basal deben ser comunes a toda la muestra para preservar una transformación lineal idéntica.',
        },
      ],
      correctOptionId: 'a',
      explanation: 'La insesgadez de CUPED descansa en que el tratamiento no afecte a la covariable X, lo que asegura que la diferencia esperada de X entre brazos sea cero.',
    },
    {
      id: 'c3',
      type: 'mcq',
      prompt: 'Si la correlación lineal entre el gasto pre-experimento X y el gasto post-experimento Y es r = 0.80, ¿en qué porcentaje reduce CUPED la varianza del estimador de diferencia de medias?',
      options: [
        {
          id: 'a',
          text: 'En un 20 %, porque la varianza residual es proporcional a 1 - r.',
          correct: false,
          feedback: 'Incorrecto. El factor de contracción de varianza depende del cuadrado de la correlación (r^2), no de r lineal.',
        },
        {
          id: 'b',
          text: 'En un 64 %, porque la fracción de varianza explicada por la covariable lineal es r^2 = 0.64.',
          correct: true,
          feedback: 'Correcto. Como Var(Delta_CUPED) = Var(Delta_crudo) * (1 - r^2), con r = 0.80 la varianza queda en 36 % de la original, reduciéndose un 64 %.',
        },
        {
          id: 'c',
          text: 'En un 80 %, igual al valor nominal del coeficiente de correlación de Pearson.',
          correct: false,
          feedback: 'Incorrecto. Confundes el coeficiente de correlación lineal r = 0.80 con el coeficiente de determinación r^2 = 0.64.',
        },
        {
          id: 'd',
          text: 'No reduce la varianza a menos que r supere el umbral crítico de 0.95.',
          correct: false,
          feedback: 'Incorrecto. Cualquier correlación no nula reduce la varianza en proporción a r^2.',
        },
      ],
      correctOptionId: 'b',
      explanation: 'Al proyectar Y sobre X con la pendiente de mínimos cuadrados, la varianza residual se multiplica por (1 - r^2); para r = 0.80, r^2 = 0.64, logrando un 64 % de reducción de varianza.',
    },
  ],
  practice: {
    type: 'sql',
    title: 'Práctica: Evaluación CUPED en los 5 experimentos válidos de Mercado Brisa',
    prompt: 'Filtra únicamente los experimentos sin alerta SRM (chi2 < 10.83, es decir experiment_id IN (1, 2, 3, 4, 5)), calcula por experimento la pendiente theta = COVAR_SAMP(post_experiment_spend_usd, pre_experiment_spend_usd) / VAR_SAMP(pre_experiment_spend_usd) y la media global de pre_experiment_spend_usd, y devuelve exactamente las columnas: experiment_code, lift_crudo_usd, lift_cuped_usd, ee_crudo, ee_cuped y z_cuped (todas redondeadas a 2 decimales), ordenadas por experiment_id ascendente.',
    starterCode: `WITH params AS (
  SELECT
    experiment_id,
    AVG(pre_experiment_spend_usd) AS mean_x,
    COVAR_SAMP(post_experiment_spend_usd, pre_experiment_spend_usd)
      / VAR_SAMP(pre_experiment_spend_usd) AS theta
  FROM experiment_assignments
  WHERE experiment_id IN (1, 2, 3, 4, 5)
  GROUP BY 1
)
-- Completa la proyección de y_cuped por usuario y agrega por experimento
SELECT
  e.experiment_code,
  0.00 AS lift_crudo_usd,
  0.00 AS lift_cuped_usd
FROM experiments e
WHERE e.experiment_id IN (1, 2, 3, 4, 5)
ORDER BY e.experiment_id;`,
    hints: [
      'En una CTE intermedia (ajustado), une experiment_assignments con params usando experiment_id y calcula y_cuped = post_experiment_spend_usd - theta * (pre_experiment_spend_usd - mean_x).',
      'En una CTE por_brazo agrupada por experiment_id, calcula las medias de control y treatment tanto para y como para y_cuped, y suma las varianzas muestrales divididas por el conteo de cada brazo: VAR_SAMP(...) / COUNT(...).',
      'En el SELECT final une con experiments y calcula ROUND(mt_cruda - mc_cruda, 2) AS lift_crudo_usd, ROUND(mt_cuped - mc_cuped, 2) AS lift_cuped_usd, ROUND(SQRT(v_cruda), 2) AS ee_crudo, ROUND(SQRT(v_cuped), 2) AS ee_cuped y ROUND((mt_cuped - mc_cuped) / SQRT(v_cuped), 2) AS z_cuped.',
    ],
    solution: `WITH params AS (
  SELECT
    experiment_id,
    AVG(pre_experiment_spend_usd) AS mean_x,
    COVAR_SAMP(post_experiment_spend_usd, pre_experiment_spend_usd)
      / VAR_SAMP(pre_experiment_spend_usd) AS theta
  FROM experiment_assignments
  WHERE experiment_id IN (1, 2, 3, 4, 5)
  GROUP BY 1
),
ajustado AS (
  SELECT
    a.experiment_id,
    a.variant,
    a.post_experiment_spend_usd AS y,
    a.post_experiment_spend_usd - p.theta * (a.pre_experiment_spend_usd - p.mean_x) AS y_cuped
  FROM experiment_assignments a
  JOIN params p USING (experiment_id)
),
por_brazo AS (
  SELECT
    experiment_id,
    AVG(CASE WHEN variant = 'control' THEN y END) AS mc_cruda,
    AVG(CASE WHEN variant = 'treatment' THEN y END) AS mt_cruda,
    VAR_SAMP(CASE WHEN variant = 'control' THEN y END) / COUNT(CASE WHEN variant = 'control' THEN 1 END)
      + VAR_SAMP(CASE WHEN variant = 'treatment' THEN y END) / COUNT(CASE WHEN variant = 'treatment' THEN 1 END) AS v_cruda,
    AVG(CASE WHEN variant = 'control' THEN y_cuped END) AS mc_cuped,
    AVG(CASE WHEN variant = 'treatment' THEN y_cuped END) AS mt_cuped,
    VAR_SAMP(CASE WHEN variant = 'control' THEN y_cuped END) / COUNT(CASE WHEN variant = 'control' THEN 1 END)
      + VAR_SAMP(CASE WHEN variant = 'treatment' THEN y_cuped END) / COUNT(CASE WHEN variant = 'treatment' THEN 1 END) AS v_cuped
  FROM ajustado
  GROUP BY 1
)
SELECT
  e.experiment_code,
  ROUND(b.mt_cruda - b.mc_cruda, 2) AS lift_crudo_usd,
  ROUND(b.mt_cuped - b.mc_cuped, 2) AS lift_cuped_usd,
  ROUND(SQRT(b.v_cruda), 2) AS ee_crudo,
  ROUND(SQRT(b.v_cuped), 2) AS ee_cuped,
  ROUND((b.mt_cuped - b.mc_cuped) / SQRT(b.v_cuped), 2) AS z_cuped
FROM por_brazo b
JOIN experiments e USING (experiment_id)
ORDER BY e.experiment_id;`,
    solutionExplanation: 'Al estimar theta y mean_x por experimento y restar la componente lineal pre-asignación, el error estándar cae de ~0.91 USD a 0.23 USD en los cinco experimentos balanceados, multiplicando por cuatro el estadístico z sin alterar la magnitud del efecto.',
    expectedOutputTable: [
      { experiment_code: 'EXP-CHECKOUT-1STEP', lift_crudo_usd: 6.91, lift_cuped_usd: 6.88, ee_crudo: 0.91, ee_cuped: 0.23, z_cuped: 29.77 },
      { experiment_code: 'EXP-FREE-SHIP-45', lift_crudo_usd: 6.37, lift_cuped_usd: 6.27, ee_crudo: 0.92, ee_cuped: 0.23, z_cuped: 27.15 },
      { experiment_code: 'EXP-SUB-BUNDLE', lift_crudo_usd: 6.61, lift_cuped_usd: 6.57, ee_crudo: 0.9, ee_cuped: 0.23, z_cuped: 28.47 },
      { experiment_code: 'EXP-QUIZ-ORIGEN', lift_crudo_usd: 6.57, lift_cuped_usd: 6.53, ee_crudo: 0.91, ee_cuped: 0.23, z_cuped: 28.17 },
      { experiment_code: 'EXP-UPSELL-MOLINO', lift_crudo_usd: 6.46, lift_cuped_usd: 6.63, ee_crudo: 0.9, ee_cuped: 0.23, z_cuped: 29.02 },
    ],
  },
  pipelineChallenge: {
    id: 'pipeline-ab-cuped',
    title: 'Secuencia de auditoría y análisis A/B con CUPED',
    prompt: 'Ordena las etapas técnicas para evaluar un experimento controlado en producción sin sesgos de selección ni contaminación post-tratamiento.',
    steps: [
      {
        id: 'definir-metricas',
        text: 'Definir hipótesis, métrica primaria (OEC), métricas guardrail y tamaño muestral requerido.',
        label: 'Definir hipótesis, métrica primaria (OEC) y guardrails',
        role: 'Diseño experimental',
        detail: 'Fija la diferencia mínima detectable (MDE) y los umbrales de protección antes de abrir tráfico.',
      },
      {
        id: 'congelar-covariable',
        text: 'Congelar la covariable basal pre-experimento X antes del disparo de la asignación aleatoria.',
        label: 'Congelar covariable pre-experimento X',
        role: 'Ingeniería de características',
        detail: 'Garantiza que X sea estrictamente independiente de la variante asignada.',
      },
      {
        id: 'auditar-srm',
        text: 'Ejecutar la prueba chi-cuadrado de Sample Ratio Mismatch (SRM) sobre los conteos observados por brazo.',
        label: 'Auditar Sample Ratio Mismatch (SRM)',
        role: 'Control de calidad',
        detail: 'Si chi2 > 10.83 (p < 0.001), se bloquea el análisis causal y se investiga la telemetría.',
      },
      {
        id: 'estimar-cuped',
        text: 'Estimar la pendiente global theta = Cov(Y, X) / Var(X) y transformar la métrica ajustada Y_CUPED.',
        label: 'Calcular ajuste lineal CUPED',
        role: 'Inferencia estadística',
        detail: 'Reduce la varianza muestral en un factor (1 - r^2) manteniendo insesgado el estimador.',
      },
      {
        id: 'dictamen-guardrails',
        text: 'Contrastar el intervalo de confianza CUPED y verificar que ninguna métrica guardrail se degrade.',
        label: 'Contrastación de hipótesis y validación de guardrails',
        role: 'Decisión de producto',
        detail: 'Autoriza el despliegue solo si el lift primario es significativo y los guardrails están sanos.',
      },
    ],
    correctOrder: [
      'definir-metricas',
      'congelar-covariable',
      'auditar-srm',
      'estimar-cuped',
      'dictamen-guardrails',
    ],
    hint: 'Recuerda que la covariable X se congela antes de asignar variantes, y el filtro SRM siempre precede a cualquier cálculo de efecto o ajuste CUPED.',
    AccessExplanation: 'El flujo riguroso fija primero diseño y covariable previa, valida la integridad del reparto mediante SRM, aplica reducción de varianza CUPED y finalmente contrasta el efecto junto con las métricas guardrail.',
  },
  roleNotes: {
    da: 'Como analista de datos, tu primera responsabilidad en un comité de experimentación es bloquear lecturas sobre pruebas con SRM activo y automatizar el ajuste CUPED en SQL para acortar ciclos de aprendizaje.',
    ds: 'Desde ciencia de datos, puedes extender CUPED lineal hacia regresión multivariable o estimadores cross-fitted con gradient boosting (MLRATE), cuidando siempre que las predicciones se entrenen fuera de muestra.',
    de: 'Como ingeniero de datos, debes materializar instantáneas inmutables de gasto y actividad pre-asignación por usuario; si la tabla de atributos se sobrescribe tras la asignación, CUPED introducirá sesgo causal.',
  },
  summary: [
    'La prueba chi-cuadrado de Sample Ratio Mismatch verifica que el tráfico observado respete la proporción diseñada antes de leer métricas.',
    'Las métricas guardrail protegen indicadores como reembolsos o latencia frente a efectos colaterales de una variante ganadora.',
    'El estimador CUPED resta la proyección lineal de una covariable pre-experimento y contrae la varianza en (1 - r^2).',
    'Para preservar la insesgadez causal, la covariable basal debe anteceder a la asignación y theta debe estimarse sobre la muestra combinada.',
  ],
  flashcards: [
    {
      id: 'f1',
      front: '¿Cuándo se declara alerta de Sample Ratio Mismatch (SRM) en un diseño 50/50?',
      back: 'Cuando el estadístico chi-cuadrado de bondad de ajuste supera el umbral crítico (por ejemplo chi2 > 10.83 para p < 0.001), indicando pérdida selectiva o fallo de asignación.',
    },
    {
      id: 'f2',
      front: '¿Cuál es la fórmula de la métrica ajustada por usuario en CUPED?',
      back: 'Y_CUPED = Y - theta * (X - media_X), donde theta = Cov(Y, X) / Var(X) se estima sobre la muestra combinada del experimento.',
    },
    {
      id: 'f3',
      front: '¿Por qué una covariable post-asignación invalida el ajuste CUPED?',
      back: 'Porque si el tratamiento afecta a X, la diferencia esperada E[X_T - X_C] deja de ser cero y restar theta*(X - media_X) absorbe parte del efecto causal verdadero.',
    },
    {
      id: 'f4',
      front: '¿A cuántos usuarios de un análisis crudo equivale una muestra de 1,600 usuarios cuando r_XY = 0.9678?',
      back: 'Como la varianza cae en (1 - r^2) = 0.0634, la precisión equivale a multiplicar el tamaño muestral efectivo por 1 / 0.0634 ≈ 15.8 veces (unos 25,200 usuarios).',
    },
  ],
  glossaryTerms: [
    'metrica-guardrail',
    'reduccion-varianza-preexperimento',
  ],
  relatedLessons: [
    'da3-experimentos-02-comparaciones-multiples-bh',
    'da3-experimentos-03-pruebas-secuenciales-msprt',
    'da3-experimentos-04-enfoque-bayesiano-ab',
  ],
  sources: [
    {
      title: 'Improving the Sensitivity of Online Controlled Experiments by Utilizing Pre-Experiment Data (WSDM 2013)',
      url: 'https://exp-platform.com/Documents/2013-02-CUPED-ImprovingSensitivityOfControlledExperiments.pdf',
      publisher: 'Microsoft Research / ACM WSDM',
      accessed: '2026-10-29',
      supports: 'Derivación matemática de CUPED, demostración de insesgadez y reducción de varianza por factor (1 - r^2).',
    },
    {
      title: 'Trustworthy Online Controlled Experiments: A Practical Guide to A/B Testing',
      url: 'https://experimentguide.com/',
      publisher: 'Cambridge University Press',
      accessed: '2026-10-29',
      supports: 'Diagnóstico de Sample Ratio Mismatch (SRM), causas operativas de desbalance y diseño de métricas guardrail.',
    },
    {
      title: 'Statsig Documentation — CUPED Variance Reduction Methodology',
      url: 'https://docs.statsig.com/stats-engine/methodologies/cuped',
      publisher: 'Statsig',
      accessed: '2026-10-29',
      supports: 'Implementación productiva del ajuste lineal pre-experimento en motores modernos de experimentación.',
    },
    {
      title: 'DuckDB SQL Aggregate Functions Reference (COVAR_SAMP, VAR_SAMP, CORR)',
      url: 'https://duckdb.org/docs/sql/functions/aggregates',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Funciones agregadas estadísticas en SQL para calcular covarianza muestral, varianza y correlación.',
    },
  ],
  aiNotes: 'Guía al estudiante para que verifique siempre primero el estadístico chi-cuadrado de SRM (EXP-PUSH-CART tiene 980 vs 620, chi2 = 81.0) antes de interpretar el lift. En la consulta CUPED, enfatiza que theta y mean_x se calculan agrupando solo por experiment_id (muestra combinada) y que pre_experiment_spend_usd es inmutable frente al tratamiento.',
};

export default lesson;
