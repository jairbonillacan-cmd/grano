export const lesson = {
  id: 'da3-experimentos-04-enfoque-bayesiano-ab',
  v2Id: 'da3-experimentos-04-enfoque-bayesiano-ab',
  moduleId: 'da3-experimentos',
  track: 'da',
  tracks: ['da'],
  level: 3,
  order: 4,
  contentVersion: 2,
  title: 'Enfoque bayesiano en pruebas A/B y decisión bajo riesgo',
  subtitle: 'Enfoque bayesiano en pruebas A/B: distribuciones a priori y probabilidad de superar al control',
  minutes: 20,
  needsReview: false,
  prerequisites: [
    'da3-experimentos-01-ab-testing-cuped',
    'da3-experimentos-03-pruebas-secuenciales-msprt',
  ],
  learningObjectives: [
    'Actualizar tasas de conversión mediante el modelo conjugado Beta-Binomial e interpretar la distribución posterior exacta.',
    'Aplicar actualización conjugada Normal-Normal con distribución a priori escéptica para regularizar estimaciones tempranas de lift.',
    'Tomar decisiones de despliegue basadas en intervalos de credibilidad, probabilidad de superar al control y pérdida esperada.',
  ],
  hook: 'Cuando un director comercial de Mercado Brisa pregunta "¿cuál es la probabilidad real de que el nuevo checkout supere al actual y cuánto dinero arriesgamos si nos equivocamos?", el valor p frecuentista no puede responderle porque mide P(datos | H0) y no P(hipótesis | datos): ¿cómo combinamos conocimiento histórico con evidencia experimental mediante familias conjugadas para responder directamente en términos de probabilidad y pérdida esperada?',
  objectives: [
    'Actualizar parámetros posteriores en modelos Beta-Binomial y Normal-Normal.',
    'Cuantificar la contracción (shrinkage) de estimaciones ruidosas hacia el prior.',
    'Calcular la probabilidad de superar al control e intervalos de credibilidad en SQL.',
  ],
  sections: [
    {
      id: 'conjugada-beta-binomial',
      heading: 'Actualización conjugada Beta-Binomial para métricas de conversión',
      body: `En el marco frecuentista, el parámetro verdadero $\\theta$ (como la proporción de pedidos premium $\\ge 75$ USD) se trata como una constante fija y desconocida. En la inferencia **bayesiana**, modelamos nuestra incertidumbre sobre $\\theta$ como una variable aleatoria. Esa variable parte de una **distribución a priori** $p(\\theta)$ y se actualiza con la verosimilitud de los datos observados.

Para conteos binomiales de $k$ éxitos en $n$ usuarios, la familia natural es la distribución $\\text{Beta}(\\alpha_0, \\beta_0)$. Su media previa es $\\mu_0 = \\frac{\\alpha_0}{\\alpha_0 + \\beta_0}$ y su peso equivale a $n_0 = \\alpha_0 + \\beta_0$ pseudo-observaciones históricas. Al observar $k$ éxitos y $n - k$ fracasos en un brazo, la distribución **posterior** conserva la forma Beta.

$$\\theta \\mid k, n \\sim \\text{Beta}(\\alpha_{\\text{post}},\\; \\beta_{\\text{post}}), \\qquad \\alpha_{\\text{post}} = \\alpha_0 + k, \\quad \\beta_{\\text{post}} = \\beta_0 + (n - k).$$

La media y la varianza posteriores se calculan en forma cerrada sin simulación Monte Carlo.

$$\\mathbb{E}[\\theta \\mid k, n] = \\frac{\\alpha_{\\text{post}}}{\\alpha_{\\text{post}} + \\beta_{\\text{post}}}, \\qquad \\text{Var}(\\theta \\mid k, n) = \\frac{\\alpha_{\\text{post}}\\,\\beta_{\\text{post}}}{(\\alpha_{\\text{post}} + \\beta_{\\text{post}})^2(\\alpha_{\\text{post}} + \\beta_{\\text{post}} + 1)}.$$

Así, la media posterior pondera entre la tasa histórica $\\mu_0$ y la tasa observada $k / n$.`,
    },
    {
      id: 'normal-normal-shrinkage',
      heading: 'Modelo Normal-Normal y contracción (shrinkage) bajo priors escépticos',
      body: `Cuando la métrica primaria es continua —como la diferencia de gasto $\\Delta = \\mu_T - \\mu_C$ en USD—, utilizamos la actualización conjugada **Normal-Normal**. En plataformas de experimentación maduras, la mayoría de las ideas nuevas producen un efecto cercano a cero. Codificamos esta evidencia histórica mediante una distribución a priori **escéptica** centrada en cero: $\\Delta \\sim \\mathcal{N}(0, \\sigma_0^2)$.

En el experimento observamos un estimador muestral $\\hat{\\Delta}_{\\text{MLE}} = \\bar{Y}_T - \\bar{Y}_C$ con varianza muestral $V = s_C^2 / n_C + s_T^2 / n_T$. La distribución posterior de $\\Delta$ sigue entonces una normal $\\mathcal{N}(\\mu_{\\text{post}}, \\sigma_{\\text{post}}^2)$ con media y varianza cerradas.

$$\\mu_{\\text{post}} = \\left(\\frac{\\sigma_0^2}{\\sigma_0^2 + V}\\right)\\hat{\\Delta}_{\\text{MLE}}, \\qquad \\sigma_{\\text{post}}^2 = \\frac{1}{\\frac{1}{\\sigma_0^2} + \\frac{1}{V}} = \\frac{\\sigma_0^2\\,V}{\\sigma_0^2 + V}.$$

El cociente $w = \\frac{\\sigma_0^2}{\\sigma_0^2 + V} \\in (0, 1)$ actúa como un **factor de contracción** (*shrinkage*). En muestras tempranas (cuando $V$ es grande), $w$ es pequeño y contrae fuertemente los picos ruidosos hacia cero. A medida que $n$ crece y $V \\to 0$, el peso $w \\to 1$ y la media posterior converge al estimador empírico.`,
      example: {
        language: 'sql',
        title: 'Actualización Beta-Binomial para conversión a pedido premium (>= 75 USD)',
        code: `WITH conteos AS (
  SELECT
    e.experiment_id,
    e.experiment_code,
    a.variant,
    COUNT(*) AS n,
    SUM(CASE WHEN a.post_experiment_spend_usd >= 75.0 THEN 1 ELSE 0 END) AS exitos_premium
  FROM experiments e
  JOIN experiment_assignments a USING (experiment_id)
  WHERE e.experiment_id IN (1, 2, 3)
  GROUP BY 1, 2, 3
)
SELECT
  experiment_code,
  variant,
  n,
  exitos_premium,
  ROUND(exitos_premium * 1.0 / n, 4) AS tasa_mle,
  12 + exitos_premium AS alpha_post,
  28 + (n - exitos_premium) AS beta_post,
  ROUND((12.0 + exitos_premium) / (40.0 + n), 4) AS media_posterior
FROM conteos
ORDER BY experiment_id, variant;`,
        expectedOutput: [
          { experiment_code: 'EXP-CHECKOUT-1STEP', variant: 'control', n: 800, exitos_premium: 224, tasa_mle: 0.28, alpha_post: 236, beta_post: 604, media_posterior: 0.281 },
          { experiment_code: 'EXP-CHECKOUT-1STEP', variant: 'treatment', n: 800, exitos_premium: 312, tasa_mle: 0.39, alpha_post: 324, beta_post: 516, media_posterior: 0.3857 },
          { experiment_code: 'EXP-FREE-SHIP-45', variant: 'control', n: 800, exitos_premium: 285, tasa_mle: 0.3563, alpha_post: 297, beta_post: 543, media_posterior: 0.3536 },
          { experiment_code: 'EXP-FREE-SHIP-45', variant: 'treatment', n: 800, exitos_premium: 368, tasa_mle: 0.46, alpha_post: 380, beta_post: 460, media_posterior: 0.4524 },
          { experiment_code: 'EXP-SUB-BUNDLE', variant: 'control', n: 800, exitos_premium: 181, tasa_mle: 0.2263, alpha_post: 193, beta_post: 647, media_posterior: 0.2298 },
          { experiment_code: 'EXP-SUB-BUNDLE', variant: 'treatment', n: 800, exitos_premium: 261, tasa_mle: 0.3263, alpha_post: 273, beta_post: 567, media_posterior: 0.325 },
        ],
        annotation: 'Con un prior Beta(12, 28) de media 0.3000 (equivalente a 40 clientes históricos), las tasas extremas se contraen suavemente hacia 0.30 proporcionalmente al peso relativo de la muestra.',
      },
    },
    {
      id: 'probabilidad-superar-perdida-esperada',
      heading: 'Probabilidad de superar al control y regla de pérdida esperada',
      body: `A partir de la distribución posterior $\\Delta \\mid \\text{datos} \\sim \\mathcal{N}(\\mu_{\\text{post}}, \\sigma_{\\text{post}}^2)$, construimos tres métricas de decisión ejecutiva directamente en SQL.

Primero calculamos el **intervalo de credibilidad al 95 %**: el rango $[\\mu_{\\text{post}} - 1.96\\,\\sigma_{\\text{post}},\\; \\mu_{\\text{post}} + 1.96\\,\\sigma_{\\text{post}}]$. Dentro de ese intervalo reside el verdadero efecto $\\Delta$ con un $95\\%$ de probabilidad posterior. Segundo, obtenemos la **probabilidad de superar al control**: la masa posterior por encima de cero, dada por $\\Pr(\\Delta > 0 \\mid \\text{datos}) = \\Phi(z_{\\text{post}})$ con $z_{\\text{post}} = \\mu_{\\text{post}} / \\sigma_{\\text{post}}$. Tercero, cuantificamos la **pérdida esperada** (*Expected Loss*): el costo promedio de desplegar el tratamiento si resultara peor que el control ($\\Delta < 0$).

$$\\mathcal{L}(T) = \\mathbb{E}[\\max(0, -\\Delta) \\mid \\text{datos}] = \\sigma_{\\text{post}}\\,\\phi(z_{\\text{post}}) - \\mu_{\\text{post}}\\,\\Phi(-z_{\\text{post}}).$$

El valor $p$ solo responde qué tan raros serían los datos bajo $H_0$. En cambio, la pérdida esperada responde cuánto ingreso por usuario arriesga **Mercado Brisa** al lanzar hoy. Una regla estándar consiste en desplegar cuando $\\Pr(\\Delta > 0 \\mid \\text{datos}) \\ge 0.98$.`,
    },
  ],
  workedExample: {
    title: 'Actualización Beta-Binomial y Normal-Normal en Mercado Brisa',
    problem: 'Aplica inferencia bayesiana en Mercado Brisa en dos escenarios: primero obtén los momentos posteriores Beta-Binomiales de EXP-CHECKOUT-1STEP para pedidos premium (>= 75 USD); luego evalúa los primeros 2 días de captura de los 5 experimentos válidos con un prior Normal escéptico N(0, sigma_0^2 = 4.0) para identificar cuáles superan el 98 % de probabilidad posterior.',
    steps: [
      {
        title: 'Paso 1: Media y desviación estándar posterior en el modelo Beta-Binomial',
        explanation: 'Combinamos el prior Beta(12, 28) con los conteos observados en experiment_id = 1 y calculamos tanto la media como la incertidumbre posterior.',
        rationale: 'Combinamos el prior Beta(12, 28) con los conteos observados en experiment_id = 1 y calculamos tanto la media como la incertidumbre posterior.',
        code: `WITH conteos AS (
  SELECT
    variant,
    COUNT(*) AS n,
    SUM(CASE WHEN post_experiment_spend_usd >= 75.0 THEN 1 ELSE 0 END) AS k,
    12 + SUM(CASE WHEN post_experiment_spend_usd >= 75.0 THEN 1 ELSE 0 END) AS a_post,
    28 + COUNT(*) - SUM(CASE WHEN post_experiment_spend_usd >= 75.0 THEN 1 ELSE 0 END) AS b_post
  FROM experiment_assignments
  WHERE experiment_id = 1
  GROUP BY 1
)
SELECT
  variant,
  n,
  k AS exitos_premium,
  ROUND(k * 1.0 / n, 4) AS tasa_mle,
  a_post,
  b_post,
  ROUND(a_post * 1.0 / (a_post + b_post), 4) AS media_post,
  ROUND(SQRT((a_post * 1.0 * b_post) / (POWER(a_post + b_post, 2) * (a_post + b_post + 1))), 4) AS sd_post
FROM conteos
ORDER BY variant;`,
        output: `variant   | n   | exitos_premium | tasa_mle | a_post | b_post | media_post | sd_post
----------+-----+----------------+----------+--------+--------+------------+--------
control   | 800 | 224            | 0.2800   | 236    | 604    | 0.2810     | 0.0155
treatment | 800 | 312            | 0.3900   | 324    | 516    | 0.3857     | 0.0168`,
        takeaway: 'La diferencia posterior entre brazos es 0.3857 - 0.2810 = +10.47 puntos porcentuales, con un error estándar posterior combinado de SQRT(0.0155^2 + 0.0168^2) = 0.0229.',
      },
      {
        title: 'Paso 2: Contracción Normal-Normal en muestras tempranas (primeras 48 horas)',
        explanation: 'En los primeros 2 días (n ~ 200), un prior escéptico N(0, 4.0) modera los lifts muestrales y evita decisiones precipitadas en los experimentos con mayor varianza.',
        rationale: 'En los primeros 2 días (n ~ 200), un prior escéptico N(0, 4.0) modera los lifts muestrales y evita decisiones precipitadas en los experimentos con mayor varianza.',
        code: `WITH inicio AS (
  SELECT
    experiment_id,
    MIN(assigned_ts) + INTERVAL '2 days' AS corte_48h
  FROM experiment_assignments
  WHERE experiment_id IN (1, 2, 3, 4, 5)
  GROUP BY 1
),
muestra AS (
  SELECT
    e.experiment_id,
    e.experiment_code,
    COUNT(CASE WHEN a.variant = 'control' THEN 1 END) AS n_c,
    COUNT(CASE WHEN a.variant = 'treatment' THEN 1 END) AS n_t,
    AVG(CASE WHEN a.variant = 'control' THEN a.post_experiment_spend_usd END) AS m_c,
    AVG(CASE WHEN a.variant = 'treatment' THEN a.post_experiment_spend_usd END) AS m_t,
    VAR_SAMP(CASE WHEN a.variant = 'control' THEN a.post_experiment_spend_usd END) AS v_c,
    VAR_SAMP(CASE WHEN a.variant = 'treatment' THEN a.post_experiment_spend_usd END) AS v_t
  FROM experiments e
  JOIN experiment_assignments a USING (experiment_id)
  JOIN inicio i USING (experiment_id)
  WHERE a.assigned_ts < i.corte_48h
  GROUP BY 1, 2
),
posterior AS (
  SELECT
    experiment_id,
    experiment_code,
    n_c + n_t AS n_temprano,
    m_t - m_c AS delta_mle,
    (v_c / n_c) + (v_t / n_t) AS var_mle,
    4.0 AS var_prior,
    (4.0 / (4.0 + (v_c / n_c) + (v_t / n_t))) * (m_t - m_c) AS media_post,
    SQRT(1.0 / (1.0 / 4.0 + 1.0 / ((v_c / n_c) + (v_t / n_t)))) AS sd_post
  FROM muestra
)
SELECT
  experiment_code,
  n_temprano,
  ROUND(delta_mle, 2) AS lift_mle_usd,
  ROUND(media_post, 2) AS media_post_usd,
  ROUND(sd_post, 2) AS sd_post_usd,
  ROUND(1.0 - 1.0 / (1.0 + EXP(0.07056 * POWER(media_post / sd_post, 3) + 1.5976 * (media_post / sd_post))), 4) AS prob_superar_control
FROM posterior
ORDER BY experiment_id;`,
        output: `experiment_code    | n_temprano | lift_mle_usd | media_post_usd | sd_post_usd | prob_superar_control
-------------------+------------+--------------+----------------+-------------+---------------------
EXP-CHECKOUT-1STEP | 215        | 9.26         | 3.67           | 1.55        | 0.9911
EXP-FREE-SHIP-45   | 210        | 7.88         | 2.91           | 1.59        | 0.9665
EXP-SUB-BUNDLE     | 205        | 10.36        | 4.21           | 1.54        | 0.9970
EXP-QUIZ-ORIGEN    | 195        | 6.30         | 2.34           | 1.59        | 0.9296
EXP-UPSELL-MOLINO  | 220        | 7.34         | 2.87           | 1.56        | 0.9669`,
        takeaway: 'Gracias a la contracción del prior N(0, 4), el lift de EXP-QUIZ-ORIGEN baja de 6.30 a 2.34 USD (probabilidad 92.96 %), mientras EXP-CHECKOUT-1STEP y EXP-SUB-BUNDLE ya superan el 99 %.',
      },
    ],
  },
  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: 'Si partes de una distribución a priori Beta(alpha_0 = 12, beta_0 = 28) y observas k = 224 conversiones en n = 800 usuarios del grupo control, ¿cuáles son los parámetros de la distribución posterior?',
      options: [
        {
          id: 'a',
          text: 'Beta(236, 828), porque se suman los éxitos a alpha_0 y el total de usuarios n a beta_0.',
          correct: false,
          feedback: 'Incorrecto. El parámetro beta_post acumula únicamente los fracasos observados (n - k = 576), no el tamaño muestral completo n = 800.',
        },
        {
          id: 'b',
          text: 'Beta(236, 604), porque alpha_post = 12 + 224 = 236 y beta_post = 28 + (800 - 224) = 604.',
          correct: true,
          feedback: 'Correcto. En el modelo conjugado Beta-Binomial se suman los éxitos a alpha_0 (12 + 224) y los fracasos a beta_0 (28 + 576).',
        },
        {
          id: 'c',
          text: 'Beta(212, 548), restando los hiperparámetros previos a los conteos observados.',
          correct: false,
          feedback: 'Incorrecto. La evidencia muestral se suma aditivamente a la información previa, nunca se resta.',
        },
        {
          id: 'd',
          text: 'Beta(224, 576), porque cuando n >= 100 la distribución a priori se descarta por completo.',
          correct: false,
          feedback: 'Incorrecto. Aunque el peso relativo del prior disminuye al crecer n, los hiperparámetros previos permanecen en la suma exacta.',
        },
      ],
      correctOptionId: 'b',
      explanation: 'La actualización conjugada Beta-Binomial suma los éxitos k al parámetro alfa (12 + 224 = 236) y los fracasos n - k al parámetro beta (28 + 576 = 604).',
    },
    {
      id: 'c2',
      type: 'mcq',
      prompt: 'En un modelo Normal-Normal con prior escéptico N(0, sigma_0^2 = 4.0), observas en las primeras horas un lift muestral de +8.00 USD con varianza muestral V = 4.0. ¿Cuál es la media posterior del efecto?',
      options: [
        {
          id: 'a',
          text: '+8.00 USD, porque la media muestral es un estimador insesgado de máxima verosimilitud.',
          correct: false,
          feedback: 'Incorrecto. +8.00 USD es el estimador frecuentista sin regularizar; el estimador bayesiano pondera prior y verosimilitud.',
        },
        {
          id: 'b',
          text: '+4.00 USD, porque cuando la varianza a priori (4.0) iguala a la varianza muestral (4.0), el factor de contracción es w = 4 / (4 + 4) = 0.5.',
          correct: true,
          feedback: 'Correcto. Al tener la misma precisión el prior en cero y los datos en +8.00, la media posterior se sitúa exactamente a mitad de camino (+4.00 USD).',
        },
        {
          id: 'c',
          text: '0.00 USD, porque cualquier prior centrado en cero anula el efecto muestral.',
          correct: false,
          feedback: 'Incorrecto. Solo un prior dogmático con varianza sigma_0^2 = 0 anularía por completo los datos.',
        },
        {
          id: 'd',
          text: '+2.00 USD, dividiendo el lift observado entre la varianza del prior.',
          correct: false,
          feedback: 'Incorrecto. El peso bayesiano es sigma_0^2 / (sigma_0^2 + V) = 0.5, por lo que 0.5 * 8.00 = 4.00 USD.',
        },
      ],
      correctOptionId: 'b',
      explanation: 'La precisión posterior suma las precisiones (1/4 + 1/4 = 1/2), dando peso w = 4 / (4 + 4) = 0.5 al estimador muestral: 0.5 * 8.00 + 0.5 * 0 = +4.00 USD.',
    },
    {
      id: 'c3',
      type: 'mcq',
      prompt: '¿Qué ventaja aporta decidir con base en la pérdida esperada bayesiana frente a mirar únicamente si Pr(Delta > 0 | datos) supera el 95 %?',
      options: [
        {
          id: 'a',
          text: 'La pérdida esperada pondera no solo la probabilidad de que el tratamiento sea inferior, sino también la magnitud económica en dólares de ese posible retroceso.',
          correct: true,
          feedback: 'Correcto. Dos experimentos pueden compartir la misma probabilidad de ganar, pero aquel con mayor varianza posterior conlleva un riesgo monetario mucho mayor en la cola izquierda.',
        },
        {
          id: 'b',
          text: 'La pérdida esperada elimina la necesidad de recolectar un grupo control en el experimento.',
          correct: false,
          feedback: 'Incorrecto. Calcular la distribución posterior de Delta = mu_T - mu_C requiere indispensablemente comparar tratamiento contra control.',
        },
        {
          id: 'c',
          text: 'La pérdida esperada siempre vale cero cuando el tamaño muestral supera los 500 usuarios.',
          correct: false,
          feedback: 'Incorrecto. Mientras exista masa posterior en la región Delta < 0, la pérdida esperada es estrictamente positiva.',
        },
        {
          id: 'd',
          text: 'La pérdida esperada es idéntica al estadístico chi-cuadrado de Sample Ratio Mismatch.',
          correct: false,
          feedback: 'Incorrecto. SRM audita el balance de tráfico entre variantes, mientras la pérdida esperada cuantifica el riesgo de decisión posterior.',
        },
      ],
      correctOptionId: 'a',
      explanation: 'Integrar max(0, -Delta) respecto a la densidad posterior mide el costo esperado de equivocarse, distinguiendo entre errores leves y colapsos severos de alta varianza.',
    },
  ],
  practice: {
    type: 'sql',
    title: 'Práctica: Decisión bayesiana Normal-Normal en las primeras 48 horas de captura',
    prompt: 'Evalúa la ventana temprana (primeros 2 días desde MIN(assigned_ts) por experimento) de los 5 experimentos válidos (experiment_id IN (1, 2, 3, 4, 5)) aplicando un prior Normal escéptico con media 0 y varianza var_prior = 4.0. Devuelve exactamente las columnas: experiment_code, n_temprano, lift_mle_usd, media_post_usd, sd_post_usd, cred_inf_95, cred_sup_95 y prob_superar_control, ordenadas por experiment_id ascendente.',
    starterCode: `WITH inicio AS (
  SELECT
    experiment_id,
    MIN(assigned_ts) + INTERVAL '2 days' AS corte_48h
  FROM experiment_assignments
  WHERE experiment_id IN (1, 2, 3, 4, 5)
  GROUP BY 1
)
-- Agrega por experimento en la ventana de 48h y aplica la actualización conjugada Normal-Normal
SELECT
  e.experiment_code,
  0 AS n_temprano
FROM experiments e
WHERE e.experiment_id IN (1, 2, 3, 4, 5)
ORDER BY e.experiment_id;`,
    hints: [
      'En una CTE muestra une experiments, experiment_assignments e inicio filtrando WHERE a.assigned_ts < i.corte_48h, y calcula n_c, n_t, m_c, m_t, v_c y v_t por experimento.',
      'En una CTE posterior define delta_mle = m_t - m_c, var_mle = (v_c / n_c) + (v_t / n_t), media_post = (4.0 / (4.0 + var_mle)) * delta_mle y sd_post = SQRT(1.0 / (1.0 / 4.0 + 1.0 / var_mle)).',
      'En el SELECT final redondea a 2 decimales lift_mle_usd, media_post_usd, sd_post_usd, cred_inf_95 (media_post - 1.96 * sd_post) y cred_sup_95 (media_post + 1.96 * sd_post), y a 4 decimales prob_superar_control usando ROUND(1.0 - 1.0 / (1.0 + EXP(0.07056 * POWER(media_post / sd_post, 3) + 1.5976 * (media_post / sd_post))), 4).',
    ],
    solution: `WITH inicio AS (
  SELECT
    experiment_id,
    MIN(assigned_ts) + INTERVAL '2 days' AS corte_48h
  FROM experiment_assignments
  WHERE experiment_id IN (1, 2, 3, 4, 5)
  GROUP BY 1
),
muestra AS (
  SELECT
    e.experiment_id,
    e.experiment_code,
    COUNT(CASE WHEN a.variant = 'control' THEN 1 END) AS n_c,
    COUNT(CASE WHEN a.variant = 'treatment' THEN 1 END) AS n_t,
    AVG(CASE WHEN a.variant = 'control' THEN a.post_experiment_spend_usd END) AS m_c,
    AVG(CASE WHEN a.variant = 'treatment' THEN a.post_experiment_spend_usd END) AS m_t,
    VAR_SAMP(CASE WHEN a.variant = 'control' THEN a.post_experiment_spend_usd END) AS v_c,
    VAR_SAMP(CASE WHEN a.variant = 'treatment' THEN a.post_experiment_spend_usd END) AS v_t
  FROM experiments e
  JOIN experiment_assignments a USING (experiment_id)
  JOIN inicio i USING (experiment_id)
  WHERE a.assigned_ts < i.corte_48h
  GROUP BY 1, 2
),
posterior AS (
  SELECT
    experiment_id,
    experiment_code,
    n_c + n_t AS n_temprano,
    m_t - m_c AS delta_mle,
    (v_c / n_c) + (v_t / n_t) AS var_mle,
    (4.0 / (4.0 + (v_c / n_c) + (v_t / n_t))) * (m_t - m_c) AS media_post,
    SQRT(1.0 / (1.0 / 4.0 + 1.0 / ((v_c / n_c) + (v_t / n_t)))) AS sd_post
  FROM muestra
)
SELECT
  experiment_code,
  n_temprano,
  ROUND(delta_mle, 2) AS lift_mle_usd,
  ROUND(media_post, 2) AS media_post_usd,
  ROUND(sd_post, 2) AS sd_post_usd,
  ROUND(media_post - 1.96 * sd_post, 2) AS cred_inf_95,
  ROUND(media_post + 1.96 * sd_post, 2) AS cred_sup_95,
  ROUND(1.0 - 1.0 / (1.0 + EXP(0.07056 * POWER(media_post / sd_post, 3) + 1.5976 * (media_post / sd_post))), 4) AS prob_superar_control
FROM posterior
ORDER BY experiment_id;`,
    solutionExplanation: 'La actualización conjugada Normal-Normal contrae las estimaciones tempranas de 48 horas hacia cero: mientras EXP-CHECKOUT-1STEP ([0.63, 6.72]) y EXP-SUB-BUNDLE ([1.19, 7.23]) muestran intervalos de credibilidad al 95 % completamente positivos, los otros tres experimentos aún cruzan el cero y requieren más tráfico.',
    expectedOutputTable: [
      { experiment_code: 'EXP-CHECKOUT-1STEP', n_temprano: 215, lift_mle_usd: 9.26, media_post_usd: 3.67, sd_post_usd: 1.55, cred_inf_95: 0.63, cred_sup_95: 6.72, prob_superar_control: 0.9911 },
      { experiment_code: 'EXP-FREE-SHIP-45', n_temprano: 210, lift_mle_usd: 7.88, media_post_usd: 2.91, sd_post_usd: 1.59, cred_inf_95: -0.2, cred_sup_95: 6.02, prob_superar_control: 0.9665 },
      { experiment_code: 'EXP-SUB-BUNDLE', n_temprano: 205, lift_mle_usd: 10.36, media_post_usd: 4.21, sd_post_usd: 1.54, cred_inf_95: 1.19, cred_sup_95: 7.23, prob_superar_control: 0.997 },
      { experiment_code: 'EXP-QUIZ-ORIGEN', n_temprano: 195, lift_mle_usd: 6.3, media_post_usd: 2.34, sd_post_usd: 1.59, cred_inf_95: -0.77, cred_sup_95: 5.45, prob_superar_control: 0.9296 },
      { experiment_code: 'EXP-UPSELL-MOLINO', n_temprano: 220, lift_mle_usd: 7.34, media_post_usd: 2.87, sd_post_usd: 1.56, cred_inf_95: -0.19, cred_sup_95: 5.93, prob_superar_control: 0.9669 },
    ],
  },
  roleNotes: {
    da: 'Como analista de datos, reportar intervalos de credibilidad y probabilidad de superar al control evita que los comités de negocio malinterpreten un valor p = 0.08 como prueba de que el efecto es exactamente cero.',
    ds: 'Desde ciencia de datos, estima empíricamente la varianza del prior sigma_0^2 a partir del repositorio histórico de experimentos pasados (Empirical Bayes) para calibrar de forma objetiva el grado de contracción.',
    de: 'Como ingeniero de datos, persiste en el catálogo de metadatos los hiperparámetros del prior por familia de métrica para garantizar que las consultas bayesianas en SQL sean reproducibles y auditables.',
  },
  summary: [
    'El modelo conjugado Beta-Binomial actualiza tasas de conversión sumando los éxitos a alfa_0 y los fracasos a beta_0.',
    'En métricas continuas, la actualización Normal-Normal combina la precisión del prior con la precisión muestral.',
    'Un prior escéptico centrado en cero aplica contracción a las muestras tempranas y mitiga la maldición del ganador.',
    'Los intervalos de credibilidad y la pérdida esperada traducen la distribución posterior a decisiones de negocio.',
  ],
  flashcards: [
    {
      id: 'f1',
      front: '¿Cómo se actualiza una distribución a priori Beta(alfa_0, beta_0) tras observar k éxitos en n ensayos?',
      back: 'La distribución posterior es Beta(alfa_0 + k, beta_0 + n - k), con media (alfa_0 + k) / (alfa_0 + beta_0 + n).',
    },
    {
      id: 'f2',
      front: '¿Qué es el factor de contracción (shrinkage) en un modelo Normal-Normal con prior N(0, sigma_0^2)?',
      back: 'Es el cociente w = sigma_0^2 / (sigma_0^2 + V) que multiplica al estimador muestral MLE para atraer las estimaciones ruidosas hacia cero.',
    },
    {
      id: 'f3',
      front: '¿En qué se diferencia un intervalo de credibilidad bayesiano al 95 % de un intervalo de confianza frecuentista?',
      back: 'El intervalo de credibilidad afirma que, condicional a los datos observados y al prior, el parámetro verdadero pertenece a ese rango con probabilidad 0.95.',
    },
    {
      id: 'f4',
      front: '¿Qué cuantifica la pérdida esperada bayesiana al evaluar una variante de tratamiento?',
      back: 'El valor esperado del retroceso max(0, theta_C - theta_T) ponderado por la distribución posterior, midiendo el riesgo económico de desplegar un falso ganador.',
    },
  ],
  glossaryTerms: [
    'distribucion-conjugada-beta-binomial',
    'perdida-esperada-bayesiana',
  ],
  relatedLessons: [
    'da3-experimentos-01-ab-testing-cuped',
    'da3-experimentos-03-pruebas-secuenciales-msprt',
    'da3-experimentos-05-efectos-red-interferencia-switchback',
  ],
  sources: [
    {
      title: 'Formulas for Bayesian A/B Testing',
      url: 'https://www.evanmiller.org/bayesian-ab-testing.html',
      publisher: 'Evan Miller Statistical Guides',
      accessed: '2026-10-29',
      supports: 'Derivaciones exactas para modelos Beta-Binomiales y probabilidad posterior de superar al control.',
    },
    {
      title: 'Continuous Monitoring of A/B Tests without Pain: Optional Stopping in Bayesian Testing (IEEE DSAA 2016)',
      url: 'https://arxiv.org/abs/1707.02646',
      publisher: 'IEEE / arXiv',
      accessed: '2026-10-29',
      supports: 'Calibración de distribuciones a priori informativas, contracción Normal-Normal y toma de decisiones bajo parada opcional.',
    },
    {
      title: 'scipy.stats.beta Continuous Random Variable Reference',
      url: 'https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.beta.html',
      publisher: 'SciPy Community',
      accessed: '2026-10-29',
      supports: 'Momentos analíticos (media y varianza) de la distribución Beta parametrizada por alfa y beta.',
    },
  ],
  aiNotes: 'Guía al estudiante en la distinción entre tasa_mle y media_posterior en el modelo Beta-Binomial, y en cómo el peso w = var_prior / (var_prior + var_mle) contrae el lift temprano en el modelo Normal-Normal. Recuérdale que la precisión posterior es la suma de las precisiones (inversos de las varianzas).',
};

export default lesson;
