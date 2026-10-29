export default {
  id: 'da2-inferencia-05-pruebas-hipotesis-valor-p',
  moduleId: 'da2-inferencia',
  title: 'Pruebas de hipótesis, valor p y tamaño del efecto',
  subtitle: 'Pruebas de hipótesis, valor p, tamaño del efecto e interpretación sin falacias',
  tracks: ['da'],
  level: 2,
  order: 5,
  minutes: 25,
  prerequisites: ['da2-inferencia-04-intervalos-confianza'],
  contentVersion: 1,
  hook: 'Tras correr el experimento `EXP-CHECKOUT-1STEP`, el grupo de tratamiento gasta en promedio 68.40 USD frente a 61.49 USD del grupo control (+6.91 USD). Alguien del equipo pregunta si esa diferencia pudo ocurrir por simple azar de asignación, mientras otro colega afirma que en la comparación entre las tiendas `STR-MX-03` y `STR-MX-01` un valor p alto demuestra que ambas tienen exactamente el mismo desempeño. ¿Cómo contrastamos una hipótesis nula rigurosamente y por qué necesitamos medir el tamaño del efecto además del valor p?',
  objectives: [
    'Formular hipótesis nula (H0) y alternativa (H1) y calcular el estadístico t de Welch para dos muestras independientes en SQL.',
    'Interpretar el valor p según la declaración oficial de la American Statistical Association (ASA) evitando falacias comunes.',
    'Cuantificar la magnitud práctica de una diferencia mediante la d de Cohen para separar significancia estadística de impacto.',
  ],
  sections: [
    {
      id: 'hipotesis-y-estadistico-t',
      heading: 'Hipótesis nula, alternativa y el estadístico t de dos muestras',
      body: 'Una **prueba de hipótesis** evalúa si la diferencia observada entre dos grupos supera de forma convincente el ruido muestral esperado. Partimos de una **hipótesis nula ($H_0$)** de ausencia de efecto ($\\mu_1 - \\mu_2 = 0$). Frente a ella planteamos una **hipótesis alternativa ($H_1$)** que postula una diferencia real ($\\mu_1 - \\mu_2 \\neq 0$).\n\nPara comparar dos medias independientes con varianzas muestrales $s_1^2$ y $s_2^2$, calculamos el estadístico $t$ de Welch. Su fórmula divide la diferencia de medias entre el error estándar combinado: $t = \\frac{\\bar{x}_1 - \\bar{x}_2}{\\sqrt{\\frac{s_1^2}{n_1} + \\frac{s_2^2}{n_2}}}$. El estadístico $t$ indica a cuántos errores estándar de distancia se ubica la diferencia observada respecto del cero de $H_0$.\n\nEn el experimento `EXP-CHECKOUT-1STEP` (`experiment_id = 1`), podemos revisar primero el balance previo (`pre_experiment_spend_usd`) y luego el impacto posterior (`post_experiment_spend_usd`). Antes del cambio la diferencia entre brazos era de $+0.04\\text{ USD}$ ($t = 0.03$, ruido puro). Tras la intervención, la diferencia sube a $+6.91\\text{ USD}$ con $t = 7.56$.',
      example: {
        language: 'sql',
        code: `WITH resumen AS (
  SELECT
    variant,
    COUNT(*) AS n,
    AVG(pre_experiment_spend_usd) AS media_pre,
    VAR_SAMP(pre_experiment_spend_usd) AS var_pre,
    AVG(post_experiment_spend_usd) AS media_post,
    VAR_SAMP(post_experiment_spend_usd) AS var_post
  FROM experiment_assignments
  WHERE experiment_id = 1
  GROUP BY variant
)
SELECT
  ROUND(MAX(CASE WHEN variant = 'treatment' THEN media_pre END) - MAX(CASE WHEN variant = 'control' THEN media_pre END), 2) AS diff_pre_usd,
  ROUND((MAX(CASE WHEN variant = 'treatment' THEN media_pre END) - MAX(CASE WHEN variant = 'control' THEN media_pre END)) / SQRT(SUM(var_pre / n)), 2) AS t_pre_asignacion,
  ROUND(MAX(CASE WHEN variant = 'treatment' THEN media_post END) - MAX(CASE WHEN variant = 'control' THEN media_post END), 2) AS diff_post_usd,
  ROUND((MAX(CASE WHEN variant = 'treatment' THEN media_post END) - MAX(CASE WHEN variant = 'control' THEN media_post END)) / SQRT(SUM(var_post / n)), 2) AS t_post_experimento
FROM resumen;`,
        expectedOutput: [
          {
            diff_pre_usd: 0.04,
            t_pre_asignacion: 0.03,
            diff_post_usd: 6.91,
            t_post_experimento: 7.56,
          },
        ],
      },
    },
    {
      id: 'valor-p-sin-falacias',
      heading: 'El valor p según la ASA: qué mide y qué jamás debes afirmar',
      body: 'El **valor $p$** se calcula asumiendo que la hipótesis nula $H_0$ es verdadera y que no existen sesgos de muestreo. Bajo ese supuesto, mide la probabilidad de obtener un estadístico igual o más extremo que el observado ($P(|T| \\ge |t_{\\text{obs}}| \\mid H_0)$). En muestras grandes, cuando $|t| \\ge 1.96$, el valor $p$ bilateral cae por debajo de $\\alpha = 0.05$ y rechazamos $H_0$.\n\nLa declaración oficial de la American Statistical Association (Wasserstein & Lazar, 2016) advierte contra tres falacias habituales. Primero, **el valor $p$ no es $P(H_0 \\mid \\text{Datos})$**. Un valor $p = 0.03$ no significa que exista un 3 % de probabilidad de que la hipótesis nula sea cierta. Mide $P(\\text{Datos extremos} \\mid H_0)$, que es la probabilidad condicional inversa.\n\nSegundo, **no rechazar $H_0$ no prueba que el efecto sea cero**. Obtener $p > 0.05$ solo indica falta de evidencia concluyente. Tercero, **significancia estadística no equivale a relevancia comercial**. Con millones de filas, una diferencia de dos centavos puede arrojar $p < 0.001$ sin cubrir siquiera el costo operativo.',
    },
    {
      id: 'tamano-efecto-cohen',
      heading: 'Tamaño del efecto (d de Cohen) y reducción de varianza',
      body: 'Mientras el estadístico $t$ y el valor $p$ crecen con el tamaño muestral $n$, el **tamaño del efecto $d$ de Cohen** es independiente del volumen de muestra. Esta métrica expresa la diferencia de medias en unidades de desviación estándar combinada: $d = \\frac{\\bar{x}_1 - \\bar{x}_2}{s_{\\text{pooled}}}$, donde $s_{\\text{pooled}} = \\sqrt{\\frac{s_1^2 + s_2^2}{2}}$.\n\nComo referencia general, valores cercanos a $|d| \\approx 0.20$ indican efectos pequeños. Valores alrededor de $|d| \\approx 0.50$ representan efectos moderados, y $|d| \\ge 0.80$ efectos grandes. Reportar en conjunto tres indicadores —la diferencia en dólares, el estadístico $t$ con su intervalo de confianza y la $d$ de Cohen— evita celebrar resultados estadísticamente significativos pero económicamente irrelevantes.\n\nExplora en el simulador interactivo cómo el tamaño del efecto y la reducción de varianza modifican el error estándar y la separación entre tratamiento y control.',
      interactive: {
        component: 'ab-test-cuped-simulator',
        caption: 'Simulador interactivo de prueba de hipótesis entre dos grupos: observa cómo el error estándar de la diferencia determina el estadístico t y el valor p.',
      },
    },
  ],
  workedExample: {
    title: 'Contraste de hipótesis t de Welch y d de Cohen entre sucursales de México',
    description:
      'Operaciones quiere contrastar formalmente las tiendas `STR-MX-02` (`store_id = 2`) y `STR-MX-03` (`store_id = 3`) contra la tienda base `STR-MX-01` (`store_id = 1`). Compara un resumen descriptivo aislado frente a la prueba de hipótesis completa con el error estándar de la diferencia, el estadístico t de Welch y la d de Cohen.',
    steps: [
      {
        label: 'Paso 1 — Resumen insuficiente: mirar medias y desviaciones por separado',
        explanation:
          'Al listar solo `media_usd` y `desvio_usd` de las tres sucursales, vemos que `STR-MX-03` supera por `4.32 USD` a `STR-MX-01` y `STR-MX-02` la supera por `149.61 USD`, pero no sabemos cuántos errores estándar representa cada brecha.',
        code: `SELECT
  s.store_code,
  COUNT(o.order_id) AS n_pedidos,
  ROUND(AVG(o.total_usd), 2) AS media_usd,
  ROUND(STDDEV_SAMP(o.total_usd), 2) AS desvio_usd
FROM orders AS o
INNER JOIN stores AS s ON o.store_id = s.store_id
WHERE s.store_id IN (1, 2, 3)
GROUP BY s.store_id, s.store_code
ORDER BY s.store_id;`,
        expectedOutput: [
          {
            store_code: 'STR-MX-01',
            n_pedidos: 642,
            media_usd: 346.13,
            desvio_usd: 272.07,
          },
          {
            store_code: 'STR-MX-02',
            n_pedidos: 643,
            media_usd: 495.73,
            desvio_usd: 355.97,
          },
          {
            store_code: 'STR-MX-03',
            n_pedidos: 643,
            media_usd: 350.45,
            desvio_usd: 270.99,
          },
        ],
      },
      {
        label: 'Paso 2 — Contraste riguroso: estadístico t de Welch y tamaño del efecto d de Cohen',
        explanation:
          'Al cruzar contra `STR-MX-01`, la diferencia de `STR-MX-02` (`+149.61 USD`) arroja $t = 8.46$ ($|t| \\ge 1.96$, altamente significativo) y un tamaño de efecto moderado ($d = 0.472$). En cambio, la diferencia de `STR-MX-03` (`+4.32 USD`) tiene un error estándar de `15.15 USD`, dando $t = 0.29$ y $d = 0.016$: ruido muestral indistinguible de cero.',
        code: `WITH base AS (
  SELECT
    s.store_id,
    s.store_code,
    COUNT(o.order_id) AS n,
    AVG(o.total_usd) AS media,
    VAR_SAMP(o.total_usd) AS varianza
  FROM orders AS o
  INNER JOIN stores AS s ON o.store_id = s.store_id
  WHERE s.store_id IN (1, 2, 3)
  GROUP BY s.store_id, s.store_code
)
SELECT
  b1.store_code AS tienda_base,
  b2.store_code AS tienda_comparada,
  ROUND(b2.media - b1.media, 2) AS diferencia_usd,
  ROUND(SQRT(b1.varianza / b1.n + b2.varianza / b2.n), 2) AS ee_diferencia_usd,
  ROUND((b2.media - b1.media) / SQRT(b1.varianza / b1.n + b2.varianza / b2.n), 2) AS estadistico_t,
  ROUND((b2.media - b1.media) / SQRT((b1.varianza + b2.varianza) / 2.0), 3) AS cohen_d
FROM base AS b1
INNER JOIN base AS b2 ON b1.store_id = 1 AND b2.store_id IN (2, 3)
ORDER BY b2.store_id;`,
        expectedOutput: [
          {
            tienda_base: 'STR-MX-01',
            tienda_comparada: 'STR-MX-02',
            diferencia_usd: 149.61,
            ee_diferencia_usd: 17.67,
            estadistico_t: 8.46,
            cohen_d: 0.472,
          },
          {
            tienda_base: 'STR-MX-01',
            tienda_comparada: 'STR-MX-03',
            diferencia_usd: 4.32,
            ee_diferencia_usd: 15.15,
            estadistico_t: 0.29,
            cohen_d: 0.016,
          },
        ],
      },
    ],
  },
  checks: [
    {
      id: 'chk-da2-05-1',
      type: 'mcq',
      prompt:
        'En una comparación entre dos variantes obtenemos un valor p = 0.02. Según la declaración de la American Statistical Association (ASA), ¿qué significa exactamente ese 0.02?',
      options: [
        {
          id: 'a',
          text: 'Existe solo un 2 % de probabilidad de que la hipótesis nula H0 sea verdadera',
          correct: false,
          feedback:
            'Esa es la falacia de la condicional transpuesta: el valor p asume que H0 es verdadera, no calcula la probabilidad de H0.',
        },
        {
          id: 'b',
          text: 'Si la hipótesis nula H0 fuera verdadera y todos los supuestos del modelo se cumplieran, habría un 2 % de probabilidad de observar una diferencia igual o más extrema que la obtenida',
          correct: true,
          feedback:
            'Correcto: el valor p mide P(|T| ≥ |t_obs| | H0), cuantificando la incompatibilidad de los datos con el modelo nulo.',
        },
        {
          id: 'c',
          text: 'Existe un 98 % de probabilidad de que el nuevo diseño incremente las ventas en al menos 10 %',
          correct: false,
          feedback:
            'El valor p no es la probabilidad de la hipótesis alternativa ni informa sobre la magnitud porcentual del efecto.',
        },
      ],
      explanation:
        'El valor p condiciona sobre H0 verdadera: P(Datos tan o más extremos | H0). Confundirlo con P(H0 | Datos) invierte la probabilidad condicional.',
    },
    {
      id: 'chk-da2-05-2',
      type: 'mcq',
      prompt:
        'En una plataforma con 10 millones de sesiones, un cambio incrementa el gasto medio en +0.03 USD con p = 0.0004 y d de Cohen = 0.003. Mantener la función cuesta 80 000 USD anuales. ¿Qué conclusión es la más rigurosa?',
      options: [
        {
          id: 'a',
          text: 'Como p < 0.001, el efecto es altamente relevante y debe desplegarse sin importar la magnitud en dólares',
          correct: false,
          feedback:
            'Un valor p muy pequeño en una muestra gigantesca solo confirma que el efecto no es exactamente cero, pero no garantiza rentabilidad.',
        },
        {
          id: 'b',
          text: 'El resultado es estadísticamente significativo por el enorme tamaño muestral, pero su tamaño del efecto (d = 0.003) es diminuto; la decisión debe evaluar si +0.03 USD supera el costo operativo',
          correct: true,
          feedback:
            'Exacto: la significancia estadística detecta que el efecto existe, mientras que el tamaño del efecto y el impacto en USD determinan si vale la pena implementarlo.',
        },
        {
          id: 'c',
          text: 'El cálculo es erróneo porque un valor p menor a 0.001 exige obligatoriamente que la d de Cohen supere 0.50',
          correct: false,
          feedback:
            'Como t ≈ d · √(n / 2), cuando n es de millones, un valor d minúsculo produce un estadístico t grande y un valor p muy pequeño.',
        },
      ],
      explanation:
        'El estadístico t crece con √n, mientras que la d de Cohen no depende de n. En muestras masivas es indispensable evaluar el tamaño del efecto y el retorno económico antes de decidir.',
    },
    {
      id: 'chk-da2-05-3',
      type: 'mcq',
      prompt:
        '¿Cómo se calcula correctamente en SQL el error estándar de la diferencia entre dos medias independientes con varianzas muestrales `var_1` y `var_2`?',
      options: [
        {
          id: 'a',
          text: 'SQRT(var_1 / n_1 + var_2 / n_2), sumando las varianzas muestrales de ambas medias',
          correct: true,
          feedback:
            'Correcto: la varianza de la diferencia de dos medias independientes es la suma de las varianzas de cada media (s_1²/n_1 + s_2²/n_2).',
        },
        {
          id: 'b',
          text: 'SQRT(var_1 / n_1 - var_2 / n_2), restando las varianzas muestrales de cada grupo',
          correct: false,
          feedback:
            'Las varianzas de dos variables aleatorias independientes siempre se suman, incluso cuando calculamos la diferencia de sus medias.',
        },
        {
          id: 'c',
          text: '(STDDEV_SAMP_1 + STDDEV_SAMP_2) / (n_1 + n_2) sin usar raíz cuadrada',
          correct: false,
          feedback:
            'El error estándar combinado debe operar sumando varianzas divididas por n dentro de la raíz cuadrada.',
        },
      ],
      explanation:
        'Al restar dos medias independientes, sus incertidumbres se acumulan: Var(X̄_1 - X̄_2) = Var(X̄_1) + Var(X̄_2) = s_1²/n_1 + s_2²/n_2.',
    },
  ],
  practice: {
    type: 'sql',
    title: 'Evaluación con t de Welch y d de Cohen de los experimentos 1 a 5',
    language: 'sql',
    prompt:
      'Cruza `experiment_assignments` con `experiments` para evaluar el gasto posterior (`post_experiment_spend_usd`) en los primeros cinco experimentos (`e.experiment_id <= 5`). Para cada experimento, devuelve: `experiment_code`, `media_ctrl_usd` (`ROUND(media_ctrl, 2)`), `media_trat_usd` (`ROUND(media_trat, 2)`), `diferencia_usd` (`ROUND(media_trat - media_ctrl, 2)`), el estadístico $t$ de Welch redondeado a 2 decimales (`estadistico_t`) y el tamaño del efecto $d$ de Cohen redondeado a 3 decimales (`cohen_d`, usando `SQRT((var_ctrl + var_trat) / 2.0)` como denominador). Ordena por `experiment_id ASC`.',
    starterCode: `WITH por_variante AS (
  SELECT
    experiment_id,
    variant,
    COUNT(*) AS n,
    AVG(post_experiment_spend_usd) AS media,
    VAR_SAMP(post_experiment_spend_usd) AS varianza
  FROM experiment_assignments
  GROUP BY experiment_id, variant
),
pares AS (
  SELECT
    e.experiment_id,
    e.experiment_code,
    MAX(CASE WHEN pv.variant = 'control' THEN pv.n END) AS n_ctrl,
    MAX(CASE WHEN pv.variant = 'treatment' THEN pv.n END) AS n_trat,
    MAX(CASE WHEN pv.variant = 'control' THEN pv.media END) AS media_ctrl,
    MAX(CASE WHEN pv.variant = 'treatment' THEN pv.media END) AS media_trat,
    MAX(CASE WHEN pv.variant = 'control' THEN pv.varianza END) AS var_ctrl,
    MAX(CASE WHEN pv.variant = 'treatment' THEN pv.varianza END) AS var_trat
  FROM por_variante AS pv
  INNER JOIN experiments AS e ON pv.experiment_id = e.experiment_id
  WHERE e.experiment_id <= 5
  GROUP BY e.experiment_id, e.experiment_code
)
SELECT
  experiment_code,
  ROUND(media_ctrl, 2) AS media_ctrl_usd,
  ROUND(media_trat, 2) AS media_trat_usd,
  ROUND(media_trat - media_ctrl, 2) AS diferencia_usd,
  -- Completa estadistico_t (2 decimales) y cohen_d (3 decimales):
  0.0 AS estadistico_t,
  0.0 AS cohen_d
FROM pares
ORDER BY experiment_id ASC;`,
    expected: `WITH por_variante AS (
  SELECT
    experiment_id,
    variant,
    COUNT(*) AS n,
    AVG(post_experiment_spend_usd) AS media,
    VAR_SAMP(post_experiment_spend_usd) AS varianza
  FROM experiment_assignments
  GROUP BY experiment_id, variant
),
pares AS (
  SELECT
    e.experiment_id,
    e.experiment_code,
    MAX(CASE WHEN pv.variant = 'control' THEN pv.n END) AS n_ctrl,
    MAX(CASE WHEN pv.variant = 'treatment' THEN pv.n END) AS n_trat,
    MAX(CASE WHEN pv.variant = 'control' THEN pv.media END) AS media_ctrl,
    MAX(CASE WHEN pv.variant = 'treatment' THEN pv.media END) AS media_trat,
    MAX(CASE WHEN pv.variant = 'control' THEN pv.varianza END) AS var_ctrl,
    MAX(CASE WHEN pv.variant = 'treatment' THEN pv.varianza END) AS var_trat
  FROM por_variante AS pv
  INNER JOIN experiments AS e ON pv.experiment_id = e.experiment_id
  WHERE e.experiment_id <= 5
  GROUP BY e.experiment_id, e.experiment_code
)
SELECT
  experiment_code,
  ROUND(media_ctrl, 2) AS media_ctrl_usd,
  ROUND(media_trat, 2) AS media_trat_usd,
  ROUND(media_trat - media_ctrl, 2) AS diferencia_usd,
  ROUND((media_trat - media_ctrl) / SQRT(var_ctrl / n_ctrl + var_trat / n_trat), 2) AS estadistico_t,
  ROUND((media_trat - media_ctrl) / SQRT((var_ctrl + var_trat) / 2.0), 3) AS cohen_d
FROM pares
ORDER BY experiment_id ASC;`,
    orderMatters: true,
    hints: [
      'Para estadistico_t divide (media_trat - media_ctrl) entre SQRT(var_ctrl / n_ctrl + var_trat / n_trat) y redondea a 2 decimales.',
      'Para cohen_d divide (media_trat - media_ctrl) entre SQRT((var_ctrl + var_trat) / 2.0) y redondea a 3 decimales.',
    ],
    solution: `WITH por_variante AS (
  SELECT
    experiment_id,
    variant,
    COUNT(*) AS n,
    AVG(post_experiment_spend_usd) AS media,
    VAR_SAMP(post_experiment_spend_usd) AS varianza
  FROM experiment_assignments
  GROUP BY experiment_id, variant
),
pares AS (
  SELECT
    e.experiment_id,
    e.experiment_code,
    MAX(CASE WHEN pv.variant = 'control' THEN pv.n END) AS n_ctrl,
    MAX(CASE WHEN pv.variant = 'treatment' THEN pv.n END) AS n_trat,
    MAX(CASE WHEN pv.variant = 'control' THEN pv.media END) AS media_ctrl,
    MAX(CASE WHEN pv.variant = 'treatment' THEN pv.media END) AS media_trat,
    MAX(CASE WHEN pv.variant = 'control' THEN pv.varianza END) AS var_ctrl,
    MAX(CASE WHEN pv.variant = 'treatment' THEN pv.varianza END) AS var_trat
  FROM por_variante AS pv
  INNER JOIN experiments AS e ON pv.experiment_id = e.experiment_id
  WHERE e.experiment_id <= 5
  GROUP BY e.experiment_id, e.experiment_code
)
SELECT
  experiment_code,
  ROUND(media_ctrl, 2) AS media_ctrl_usd,
  ROUND(media_trat, 2) AS media_trat_usd,
  ROUND(media_trat - media_ctrl, 2) AS diferencia_usd,
  ROUND((media_trat - media_ctrl) / SQRT(var_ctrl / n_ctrl + var_trat / n_trat), 2) AS estadistico_t,
  ROUND((media_trat - media_ctrl) / SQRT((var_ctrl + var_trat) / 2.0), 3) AS cohen_d
FROM pares
ORDER BY experiment_id ASC;`,
    solutionExplanation:
      'Los cinco experimentos muestran incrementos de entre +6.37 USD y +6.91 USD con estadísticos t superiores a 6.9 (muy por encima del umbral crítico 1.96) y tamaños del efecto d de Cohen consistentes entre 0.346 y 0.378 desviaciones estándar.',
    expectedOutputTable: [
      {
        experiment_code: 'EXP-CHECKOUT-1STEP',
        media_ctrl_usd: 61.49,
        media_trat_usd: 68.4,
        diferencia_usd: 6.91,
        estadistico_t: 7.56,
        cohen_d: 0.378,
      },
      {
        experiment_code: 'EXP-FREE-SHIP-45',
        media_ctrl_usd: 66.08,
        media_trat_usd: 72.45,
        diferencia_usd: 6.37,
        estadistico_t: 6.92,
        cohen_d: 0.346,
      },
      {
        experiment_code: 'EXP-SUB-BUNDLE',
        media_ctrl_usd: 58.06,
        media_trat_usd: 64.67,
        diferencia_usd: 6.61,
        estadistico_t: 7.34,
        cohen_d: 0.367,
      },
      {
        experiment_code: 'EXP-QUIZ-ORIGEN',
        media_ctrl_usd: 62.52,
        media_trat_usd: 69.09,
        diferencia_usd: 6.57,
        estadistico_t: 7.24,
        cohen_d: 0.362,
      },
      {
        experiment_code: 'EXP-UPSELL-MOLINO',
        media_ctrl_usd: 67.29,
        media_trat_usd: 73.75,
        diferencia_usd: 6.46,
        estadistico_t: 7.17,
        cohen_d: 0.358,
      },
    ],
  },
  roleNotes: {
    de: 'En pipelines de evaluación de experimentos, incluye siempre la validación automática de la métrica pre-experimento (pre_experiment_spend_usd) entre variantes; si |t_pre| supera 1.96, emite una alerta de desbalance en la aleatorización.',
    da: 'Reporta siempre los tres indicadores juntos en tus dictámenes: diferencia absoluta o relativa con su IC 95 %, estadístico t (o valor p) y tamaño del efecto d de Cohen.',
    bi: 'En tableros de experimentación, evita mostrar únicamente un semáforo "Significativo / No significativo"; muestra la magnitud en dólares junto al intervalo de confianza de la diferencia.',
  },
  summary: [
    'El estadístico t de Welch mide cuántos errores estándar separan la diferencia de medias respecto de cero.',
    'El valor p es P(|T| ≥ |t_obs| | H0), nunca la probabilidad de que la hipótesis nula sea verdadera.',
    'No rechazar H0 (p > 0.05) indica falta de evidencia concluyente, no prueba de que el efecto sea cero.',
    'La d de Cohen expresa la diferencia en unidades de desviación estándar combinada sin depender del tamaño muestral n.',
  ],
  flashcards: [
    {
      id: 'fc-da2-05-a',
      front: '¿Por qué en el error estándar de la diferencia de dos medias se suman las varianzas (s1²/n1 + s2²/n2)?',
      back: 'Porque al restar dos variables aleatorias independientes sus incertidumbres muestrales se acumulan: Var(A - B) = Var(A) + Var(B).',
    },
    {
      id: 'fc-da2-05-b',
      front: '¿Qué diferencia existe entre significancia estadística (valor p) y tamaño del efecto (d de Cohen)?',
      back: 'El valor p indica si hay evidencia para distinguir el efecto del azar (y depende de n); la d de Cohen mide qué tan grande es la diferencia en desviaciones estándar (sin depender de n).',
    },
    {
      id: 'fc-da2-05-c',
      front: '¿Qué falacia comete quien afirma que "p = 0.04 significa 4 % de probabilidad de que H0 sea cierta"?',
      back: 'La falacia de la condicional transpuesta: confunde P(Datos extremos | H0) con P(H0 | Datos).',
    },
  ],
  glossaryTerms: [
    'valor-p',
    'tamano-del-efecto-cohen',
    'error-estandar',
    'intervalo-de-confianza',
  ],
  sources: [
    {
      title: 'Wasserstein, R. L., & Lazar, N. A. (2016) — The ASA Statement on p-Values: Context, Process, and Purpose',
      url: 'https://www.amstat.org/asa/files/pdfs/P-ValueStatement.pdf',
      publisher: 'American Statistical Association (ASA)',
      accessed: '2026-10-29',
      supports: 'Definición oficial del valor p y seis principios contra malinterpretaciones.',
    },
    {
      title: 'NIST/SEMATECH e-Handbook — Two-Sample t-Test for Equal and Unequal Variances (prc31)',
      url: 'https://www.itl.nist.gov/div898/handbook/prc/section3/prc31.htm',
      publisher: 'National Institute of Standards and Technology (NIST)',
      accessed: '2026-10-29',
      supports: 'Fórmula del estadístico t de Welch para dos muestras independientes con varianzas distintas.',
    },
    {
      title: 'SciPy Official Reference — scipy.stats.ttest_ind',
      url: 'https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.ttest_ind.html',
      publisher: 'SciPy Developers',
      accessed: '2026-10-29',
      supports: 'Implementación computacional del contraste t de dos muestras e interpretación de grados de libertad.',
    },
  ],
  aiNotes:
    'Los errores típicos en esta práctica son restar las varianzas en lugar de sumarlas dentro de SQRT(var_ctrl / n_ctrl + var_trat / n_trat), olvidar dividir por n_ctrl y n_trat en estadistico_t, o confundir el redondeo (2 decimales para estadistico_t y 3 decimales para cohen_d).',
};
