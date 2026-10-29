export const lesson = {
  id: 'da4-modelos-02-regresion-logistica-calibracion',
  moduleId: 'da4-modelos',
  tracks: ['da'],
  level: 4,
  order: 2,
  title: 'Regresión logística: momios, calibración y umbral',
  subtitle:
    'Regresión logística: razones de momios (odds ratios), calibración de probabilidades y umbral',
  minutes: 25,
  prerequisites: [
    'da4-modelos-01-regresion-lineal-multiple',
    'da2-inferencia-01-probabilidad-bayes',
  ],
  contentVersion: 2,
  hook: 'Operaciones de Mercado Brisa quiere anticipar qué pedidos terminarán en devolución para revisar el empaque antes del envío. Si ajustas una regresión lineal ordinaria sobre un indicador binario obtienes probabilidades fuera de rango, y si cortas la decisión en el umbral por defecto de 0.50 no detectas ni un reembolso porque la tasa base ronda el seis por ciento. ¿Cómo traduces coeficientes logísticos en razones de momios, auditas la calibración y eliges el umbral óptimo según los costes?',
  objectives: [
    'Transformar probabilidades empíricas en momios (odds), razones de momios (odds ratios) y coeficientes log-momios respecto a una categoría base.',
    'Auditar la calibración de probabilidades predichas por bandas de riesgo mediante la brecha absoluta de calibración y el puntaje de Brier.',
    'Seleccionar el umbral de decisión óptimo equilibrando el coste de falsos positivos y falsos negativos en lugar de usar 0.50 por defecto.',
  ],
  sections: [
    {
      id: 'de-probabilidades-a-log-momios',
      heading: 'De la probabilidad al logit: función sigmoide y momios',
      body: 'Cuando la variable de respuesta $y$ solo toma valores binarios ($1$ si ocurre el evento, como un reembolso o una baja, y $0$ en caso contrario), una recta lineal ilimitada puede arrojar predicciones fuera del intervalo $[0, 1]$. La **regresión logística** resuelve este problema modelando el logaritmo natural de los **momios** (*log-odds*) como una combinación lineal de los predictores.\n\nSi $p$ es la probabilidad del evento, los momios (*odds*) se definen como el cociente entre la probabilidad de que ocurra y la probabilidad de que no ocurra: $\\text{momios} = \\frac{p}{1 - p}$. Mientras $p$ está acotada entre $0$ y $1$, el logaritmo de los momios recorre toda la recta real desde $-\\infty$ hasta $+\\infty$.\n\nPara recuperar la probabilidad predicha $\\hat{p}_i$ a partir del puntaje lineal $\\eta_i = \\beta_0 + \\sum_j \\beta_j x_{ij}$, aplicamos la función logística o **sigmoide**: $p_i = \\frac{1}{1 + e^{-\\eta_i}}$. En **DuckDB** podemos evaluarla directamente mediante `1.0 / (1.0 + EXP(-eta))`.',
      example: {
        language: 'sql',
        code: `WITH ordenes_reembolso AS (
  SELECT
    o.device_type,
    CASE WHEN r.order_id IS NOT NULL THEN 1.0 ELSE 0.0 END AS reembolsado
  FROM orders o
  LEFT JOIN (SELECT DISTINCT order_id FROM refunds) r
    ON o.order_id = r.order_id
  WHERE o.status IN ('completed', 'refunded')
)
SELECT
  device_type,
  COUNT(*) AS n_pedidos,
  ROUND(AVG(reembolsado), 4) AS prob_reembolso,
  ROUND(AVG(reembolsado) / (1.0 - AVG(reembolsado)), 4) AS momios_reembolso
FROM ordenes_reembolso
GROUP BY device_type
ORDER BY prob_reembolso DESC;`,
        expectedOutput: [
          {
            device_type: 'desktop',
            n_pedidos: 6944,
            prob_reembolso: 0.0792,
            momios_reembolso: 0.086,
          },
          {
            device_type: 'pos_tienda',
            n_pedidos: 3085,
            prob_reembolso: 0.0587,
            momios_reembolso: 0.0623,
          },
          {
            device_type: 'mobile',
            n_pedidos: 6171,
            prob_reembolso: 0.0493,
            momios_reembolso: 0.0518,
          },
        ],
      },
    },
    {
      id: 'interpretacion-razon-de-momios',
      heading: 'Razones de momios (odds ratios) e interpretación multiplicativa',
      body: 'En una regresión logística, la pendiente $\\beta_j$ representa el cambio aditivo en el logaritmo de los momios cuando $x_j$ aumenta una unidad. Como pensar en escala logarítmica resulta poco intuitivo para negocio, exponenciamos el coeficiente para obtener la **razón de momios** (*odds ratio*, $\\text{OR} = e^{\\beta_j}$).\n\nLa razón de momios compara multiplicativamente los momios de un grupo frente a los de la categoría base de referencia: $\\text{OR}_{1 \\text{ vs } 0} = \\frac{p_1 / (1 - p_1)}{p_0 / (1 - p_0)}$. Un $\\text{OR} = 1.0$ indica que el predictor no altera los momios del evento ($\\beta_j = 0$). Un $\\text{OR} = 1.66$ significa que los momios del grupo expuesto son un $66\\%$ superiores a los del grupo base.\n\nCuando la probabilidad base del evento es pequeña (por ejemplo, menor al $10\\%$), la razón de momios se aproxima bastante al riesgo relativo ($p_1 / p_0$). Sin embargo, cuando el evento es frecuente, el *odds ratio* siempre es más extremo que el cociente de probabilidades y nunca deben confundirse.',
    },
    {
      id: 'calibracion-y-puntaje-de-brier',
      heading: 'Calibración de probabilidades y puntaje de Brier',
      body: 'Que un clasificador ordene bien a los clientes de menor a mayor riesgo no garantiza que sus probabilidades numéricas sean creíbles. Decimos que un modelo está bien **calibrado** cuando, entre todos los pedidos a los que asigna una probabilidad predicha cercana a $\\hat{p} = 0.08$, aproximadamente el $8\\%$ termina realmente en reembolso.\n\nPara auditar la calibración en SQL dividimos las predicciones en bandas o quintiles mediante `NTILE(5) OVER (ORDER BY prob_predicha)` y comparamos la probabilidad media predicha de cada banda contra la tasa real observada.\n\nAdemás, medimos la calidad global de las probabilidades con el **puntaje de Brier** ($\\text{BS} = \\frac{1}{N} \\sum_{i=1}^{N} (\\hat{p}_i - y_i)^2$), que calcula el error cuadrático medio entre la probabilidad asignada $\\hat{p}_i$ y el indicador real $y_i \\in \\{0, 1\\}$. Cuanto más cercano a cero sea el puntaje de Brier, mejor combinan las predicciones discriminación y calibración.',
    },
    {
      id: 'umbral-de-decision-y-matriz-de-costes',
      heading: 'Elección del umbral óptimo según costes asimétricos',
      body: 'Una probabilidad calibrada $\\hat{p}_i$ permite tomar decisiones racionales cuando conocemos los costes del negocio. Si aplicar una inspección preventiva de empaque cuesta $C_{\\text{FP}} = 1.50\\text{ USD}$ (coste de revisar un pedido sano) y evitar un reembolso ahorra $C_{\\text{FN}} = 18.50\\text{ USD}$ en logística inversa, sería un error grave usar el **umbral de decisión** arbitrario de $0.50$.\n\nLa regla de valor esperado indica que debemos activar la intervención preventiva siempre que el ahorro esperado supere al coste de la acción. Esto define el umbral óptimo $\\tau^* = \\frac{C_{\\text{FP}}}{C_{\\text{FP}} + C_{\\text{FN}}}$.\n\nCon los costes anteriores, el umbral óptimo cae en $\\tau^* = \\frac{1.50}{1.50 + 18.50} = 0.075$ ($7.5\\%$). Separar la estimación de probabilidades calibradas de la elección del umbral permite actualizar la regla operativa cuando cambian las tarifas de envío sin necesidad de reentrenar el modelo estadístico.',
    },
  ],
  workedExample: {
    title: 'Auditoría de calibración por quintiles y puntaje de Brier en reembolsos',
    description:
      'Operaciones de Mercado Brisa evalúa un puntaje logístico de propensión al reembolso sobre los 16,200 pedidos finalizados (completed o refunded). Queremos auditar su calibración por quintiles de riesgo y calcular el puntaje de Brier en cada banda.',
    audit:
      'La tabla de calibración revela que el puntaje está bien calibrado en los primeros cuatro quintiles (error menor a 1.6 puntos porcentuales), pero sobreestima el riesgo en el quintil 5 (predice 11.75% frente a 6.20% real) por asumir un efecto lineal excesivo del monto del pedido.',
    steps: [
      {
        label: 'Paso 1: Probabilidad sigmoide media frente a tasa real por dispositivo',
        explanation:
          'Construimos la variable binaria es_reembolso haciendo LEFT JOIN contra los order_id únicos de refunds y evaluamos la función sigmoide del puntaje lineal para cada pedido.',
        code: `WITH base_pedidos AS (
  SELECT
    o.order_id,
    o.device_type,
    CASE WHEN r.order_id IS NOT NULL THEN 1.0 ELSE 0.0 END AS es_reembolso,
    1.0 / (1.0 + EXP(-(-2.65
      + CASE
          WHEN o.device_type = 'desktop' THEN 0.48
          WHEN o.device_type = 'pos_tienda' THEN 0.22
          ELSE 0.0
        END
      - CASE WHEN o.discount_usd > 0 THEN 0.24 ELSE 0.0 END
      + 0.0005 * (o.total_usd - 420.0)
    ))) AS prob_predicha
  FROM orders o
  LEFT JOIN (SELECT DISTINCT order_id FROM refunds) r
    ON o.order_id = r.order_id
  WHERE o.status IN ('completed', 'refunded')
)
SELECT
  device_type,
  COUNT(*) AS n_pedidos,
  ROUND(AVG(prob_predicha), 4) AS prob_media_pred,
  ROUND(AVG(es_reembolso), 4) AS tasa_real
FROM base_pedidos
GROUP BY device_type
ORDER BY tasa_real DESC;`,
        expectedOutput: [
          {
            device_type: 'desktop',
            n_pedidos: 6944,
            prob_media_pred: 0.0954,
            tasa_real: 0.0792,
          },
          {
            device_type: 'pos_tienda',
            n_pedidos: 3085,
            prob_media_pred: 0.0757,
            tasa_real: 0.0587,
          },
          {
            device_type: 'mobile',
            n_pedidos: 6171,
            prob_media_pred: 0.062,
            tasa_real: 0.0493,
          },
        ],
      },
      {
        label: 'Paso 2: Curva de calibración por quintiles y puntaje de Brier',
        explanation:
          'Particionamos los 16,200 pedidos en 5 quintiles de riesgo predicho (NTILE(5)) y medimos el error absoluto de calibración y el puntaje de Brier en cada quintil.',
        code: `WITH base_pedidos AS (
  SELECT
    CASE WHEN r.order_id IS NOT NULL THEN 1.0 ELSE 0.0 END AS es_reembolso,
    1.0 / (1.0 + EXP(-(-2.65
      + CASE
          WHEN o.device_type = 'desktop' THEN 0.48
          WHEN o.device_type = 'pos_tienda' THEN 0.22
          ELSE 0.0
        END
      - CASE WHEN o.discount_usd > 0 THEN 0.24 ELSE 0.0 END
      + 0.0005 * (o.total_usd - 420.0)
    ))) AS prob_predicha
  FROM orders o
  LEFT JOIN (SELECT DISTINCT order_id FROM refunds) r
    ON o.order_id = r.order_id
  WHERE o.status IN ('completed', 'refunded')
),
bandas AS (
  SELECT
    NTILE(5) OVER (ORDER BY prob_predicha) AS quintil_riesgo,
    prob_predicha,
    es_reembolso
  FROM base_pedidos
)
SELECT
  quintil_riesgo,
  COUNT(*) AS n_pedidos,
  ROUND(AVG(prob_predicha), 4) AS prob_media_predicha,
  ROUND(AVG(es_reembolso), 4) AS tasa_real_observada,
  ROUND(ABS(AVG(prob_predicha) - AVG(es_reembolso)), 4) AS error_calibracion_abs,
  ROUND(AVG(POWER(prob_predicha - es_reembolso, 2)), 4) AS brier_score
FROM bandas
GROUP BY quintil_riesgo
ORDER BY quintil_riesgo;`,
        expectedOutput: [
          {
            quintil_riesgo: 1,
            n_pedidos: 3240,
            prob_media_predicha: 0.0545,
            tasa_real_observada: 0.0562,
            error_calibracion_abs: 0.0017,
            brier_score: 0.0531,
          },
          {
            quintil_riesgo: 2,
            n_pedidos: 3240,
            prob_media_predicha: 0.0659,
            tasa_real_observada: 0.0537,
            error_calibracion_abs: 0.0122,
            brier_score: 0.0509,
          },
          {
            quintil_riesgo: 3,
            n_pedidos: 3240,
            prob_media_predicha: 0.079,
            tasa_real_observada: 0.0698,
            error_calibracion_abs: 0.0092,
            brier_score: 0.0648,
          },
          {
            quintil_riesgo: 4,
            n_pedidos: 3240,
            prob_media_predicha: 0.0932,
            tasa_real_observada: 0.0778,
            error_calibracion_abs: 0.0154,
            brier_score: 0.072,
          },
          {
            quintil_riesgo: 5,
            n_pedidos: 3240,
            prob_media_predicha: 0.1175,
            tasa_real_observada: 0.062,
            error_calibracion_abs: 0.0555,
            brier_score: 0.0616,
          },
        ],
      },
    ],
  },
  checks: [
    {
      id: 'check-da4-02-odds-ratio',
      type: 'mcq',
      prompt:
        'En un modelo de regresión logística para predecir la baja de clientes, el coeficiente estimado para el segmento bronce frente al segmento base plata es beta = 0.4055. ¿Cuál es la razón de momios (odds ratio) y cómo se interpreta?',
      options: [
        {
          id: 'a',
          text: 'OR = exp(0.4055) = 1.50; los momios de baja en el segmento bronce son un 50% mayores que en el segmento plata.',
          correct: true,
          feedback:
            'Correcto. Al exponenciar beta = 0.4055 obtenemos OR = 1.50, lo que representa un incremento multiplicativo del 50% en los momios.',
        },
        {
          id: 'b',
          text: 'OR = 0.4055; los clientes del segmento bronce tienen un 40.55% menos de momios de darse de baja.',
          correct: false,
          feedback:
            'Incorrecto. 0.4055 es el coeficiente en escala log-odds; al ser positivo indica mayor propensión, no menor, y requiere exponenciarse.',
        },
        {
          id: 'c',
          text: 'OR = 1.50; la probabilidad absoluta de baja sube exactamente 50 puntos porcentuales en bronce.',
          correct: false,
          feedback:
            'Incorrecto. La razón de momios es un factor multiplicativo sobre p / (1 - p), no una suma de puntos porcentuales sobre p.',
        },
        {
          id: 'd',
          text: 'OR = ln(0.4055) = -0.90; el segmento bronce protege frente a la baja.',
          correct: false,
          feedback:
            'Incorrecto. Para pasar de log-odds a odds ratio debes aplicar la función exponencial EXP(beta), no el logaritmo natural.',
        },
      ],
      explanation:
        'En regresión logística, exp(beta) transforma el coeficiente de la escala aditiva de log-momios a la escala multiplicativa de razones de momios (odds ratios).',
    },
    {
      id: 'check-da4-02-brier-calibracion',
      type: 'mcq',
      prompt:
        'Evalúas dos modelos de propensión a compra sobre la misma muestra de validación: el Modelo A obtiene un puntaje de Brier de 0.048 y el Modelo B obtiene 0.142. ¿Qué significa este resultado?',
      options: [
        {
          id: 'a',
          text: 'El Modelo A produce probabilidades más precisas y cercanas a los resultados reales observados, pues el puntaje de Brier mide el error cuadrático medio probabilístico (menor es mejor).',
          correct: true,
          feedback:
            'Correcto. Como BS = promedio de (p_pred - y)^2, un valor más cercano a 0 indica mejor ajuste y calibración probabilística.',
        },
        {
          id: 'b',
          text: 'El Modelo B es superior porque un puntaje de Brier más alto equivale a mayor área bajo la curva ROC.',
          correct: false,
          feedback:
            'Incorrecto. A diferencia del AUC-ROC, el puntaje de Brier es una función de pérdida cuadrática donde 0 es perfecto y 1 es el peor resultado.',
        },
        {
          id: 'c',
          text: 'El Modelo A sobreestima sistemáticamente las probabilidades porque su puntaje de Brier es menor a 0.50.',
          correct: false,
          feedback:
            'Incorrecto. Un puntaje de Brier bajo refleja errores pequeños en magnitud, no un sesgo de sobreestimación.',
        },
        {
          id: 'd',
          text: 'Ambos modelos están mal calibrados porque el puntaje de Brier puede ser negativo cuando las probabilidades son bajas.',
          correct: false,
          feedback:
            'Incorrecto. Al promediar diferencias elevadas al cuadrado, el puntaje de Brier nunca puede ser negativo.',
        },
      ],
      explanation:
        'El puntaje de Brier promedia (p_i - y_i)^2 sobre todas las observaciones. Un valor de 0.048 frente a 0.142 demuestra errores cuadráticos considerablemente menores en las probabilidades asignadas.',
    },
    {
      id: 'check-da4-02-umbral-costes',
      type: 'mcq',
      prompt:
        'Enviar un cupón de retención cuesta 2 USD (coste de falso positivo si el cliente no iba a cancelar) y retener a un cliente en riesgo real evita perder 18 USD de margen neto (coste de falso negativo). Si tu modelo logístico está bien calibrado, ¿a partir de qué probabilidad predicha de baja conviene enviar el cupón?',
      options: [
        {
          id: 'a',
          text: 'A partir de p >= 0.10 (10%), porque C_FP / (C_FP + C_FN) = 2 / (2 + 18) = 0.10.',
          correct: true,
          feedback:
            'Correcto. Con p = 0.10 el beneficio esperado de intervenir iguala el punto de indiferencia de la matriz de costes.',
        },
        {
          id: 'b',
          text: 'A partir de p >= 0.50 (50%), porque es el umbral estándar de clasificación binaria.',
          correct: false,
          feedback:
            'Incorrecto. Usar 0.50 ignora que perder un cliente es nueve veces más costoso que enviar un cupón innecesario.',
        },
        {
          id: 'c',
          text: 'A partir de p >= 0.90 (90%), para minimizar el gasto en cupones.',
          correct: false,
          feedback:
            'Incorrecto. Ese umbral dejaría escapar a la gran mayoría de clientes en riesgo cuya pérdida cuesta 18 USD cada uno.',
        },
        {
          id: 'd',
          text: 'A partir de p >= 0.111 (11.1%), porque se divide C_FP entre C_FN (2 / 18).',
          correct: false,
          feedback:
            'Incorrecto. 2 / 18 son los momios de corte; la probabilidad de corte es 2 / (2 + 18) = 0.10.',
        },
      ],
      explanation:
        'El umbral óptimo bajo costes asimétricos es C_FP / (C_FP + C_FN) = 2 / 20 = 0.10. Exigir 0.50 desperdiciaría intervenciones rentables entre el 10% y el 50% de probabilidad.',
    },
  ],
  practice: {
    type: 'sql',
    title: 'Razones de momios y coeficientes log-momios de reembolso por dispositivo',
    language: 'sql',
    prompt:
      'Calcula las métricas empíricas de regresión logística para la propensión al reembolso según `device_type` en `orders` (filtrando `status IN (\'completed\', \'refunded\')`) cruzada con los `order_id` únicos de `refunds`. Tomando `mobile` como categoría base de referencia, devuelve las columnas `device_type`, `n_pedidos`, `n_reembolsos`, `prob_reembolso` (redondeada a 4 decimales), `momios_reembolso` ($p / (1 - p)$ redondeado a 4 decimales), `odds_ratio_vs_mobile` (cociente entre los momios del canal y los momios de `mobile`, redondeado a 4 decimales) y `log_odds_beta` (logaritmo natural `LN` del odds ratio, redondeado a 4 decimales). Ordena por `odds_ratio_vs_mobile` de mayor a menor.',
    starterCode: `-- Calcula momios, odds_ratio_vs_mobile y log_odds_beta por device_type
WITH tasas_canal AS (
  SELECT
    o.device_type,
    COUNT(*) AS n_pedidos,
    SUM(CASE WHEN r.order_id IS NOT NULL THEN 1 ELSE 0 END) AS n_reembolsos,
    AVG(CASE WHEN r.order_id IS NOT NULL THEN 1.0 ELSE 0.0 END) AS prob_reembolso
  FROM orders o
  LEFT JOIN (SELECT DISTINCT order_id FROM refunds) r
    ON o.order_id = r.order_id
  WHERE o.status IN ('completed', 'refunded')
  GROUP BY o.device_type
)
SELECT
  device_type,
  n_pedidos,
  n_reembolsos,
  ROUND(prob_reembolso, 4) AS prob_reembolso
  -- Completa momios_reembolso, odds_ratio_vs_mobile y log_odds_beta
FROM tasas_canal
ORDER BY prob_reembolso DESC;`,
    expected: `WITH tasas_canal AS (
  SELECT
    o.device_type,
    COUNT(*) AS n_pedidos,
    SUM(CASE WHEN r.order_id IS NOT NULL THEN 1 ELSE 0 END) AS n_reembolsos,
    AVG(CASE WHEN r.order_id IS NOT NULL THEN 1.0 ELSE 0.0 END) AS prob_reembolso
  FROM orders o
  LEFT JOIN (SELECT DISTINCT order_id FROM refunds) r
    ON o.order_id = r.order_id
  WHERE o.status IN ('completed', 'refunded')
  GROUP BY o.device_type
),
con_momios AS (
  SELECT
    device_type,
    n_pedidos,
    n_reembolsos,
    prob_reembolso,
    prob_reembolso / (1.0 - prob_reembolso) AS momios,
    MAX(CASE WHEN device_type = 'mobile' THEN prob_reembolso / (1.0 - prob_reembolso) END) OVER () AS momios_base_mobile
  FROM tasas_canal
)
SELECT
  device_type,
  n_pedidos,
  n_reembolsos,
  ROUND(prob_reembolso, 4) AS prob_reembolso,
  ROUND(momios, 4) AS momios_reembolso,
  ROUND(momios / momios_base_mobile, 4) AS odds_ratio_vs_mobile,
  ROUND(LN(momios / momios_base_mobile), 4) AS log_odds_beta
FROM con_momios
ORDER BY odds_ratio_vs_mobile DESC;`,
    orderMatters: true,
    hints: [
      'En un segundo CTE con_momios, calcula momios como prob_reembolso / (1.0 - prob_reembolso) para cada device_type.',
      'En ese mismo CTE obtén los momios de la categoría de referencia con MAX(CASE WHEN device_type = \'mobile\' THEN prob_reembolso / (1.0 - prob_reembolso) END) OVER () AS momios_base_mobile.',
      'En el SELECT final proyecta ROUND(momios, 4) AS momios_reembolso, ROUND(momios / momios_base_mobile, 4) AS odds_ratio_vs_mobile y ROUND(LN(momios / momios_base_mobile), 4) AS log_odds_beta, ordenando por odds_ratio_vs_mobile DESC.',
    ],
    solution: `WITH tasas_canal AS (
  SELECT
    o.device_type,
    COUNT(*) AS n_pedidos,
    SUM(CASE WHEN r.order_id IS NOT NULL THEN 1 ELSE 0 END) AS n_reembolsos,
    AVG(CASE WHEN r.order_id IS NOT NULL THEN 1.0 ELSE 0.0 END) AS prob_reembolso
  FROM orders o
  LEFT JOIN (SELECT DISTINCT order_id FROM refunds) r
    ON o.order_id = r.order_id
  WHERE o.status IN ('completed', 'refunded')
  GROUP BY o.device_type
),
con_momios AS (
  SELECT
    device_type,
    n_pedidos,
    n_reembolsos,
    prob_reembolso,
    prob_reembolso / (1.0 - prob_reembolso) AS momios,
    MAX(CASE WHEN device_type = 'mobile' THEN prob_reembolso / (1.0 - prob_reembolso) END) OVER () AS momios_base_mobile
  FROM tasas_canal
)
SELECT
  device_type,
  n_pedidos,
  n_reembolsos,
  ROUND(prob_reembolso, 4) AS prob_reembolso,
  ROUND(momios, 4) AS momios_reembolso,
  ROUND(momios / momios_base_mobile, 4) AS odds_ratio_vs_mobile,
  ROUND(LN(momios / momios_base_mobile), 4) AS log_odds_beta
FROM con_momios
ORDER BY odds_ratio_vs_mobile DESC;`,
    solutionExplanation:
      'Preagregamos primero los reembolsos a nivel de order_id para no duplicar pedidos con múltiples líneas devueltas. Después calculamos los momios p / (1 - p) por canal, propagamos los momios de mobile con una función de ventana y derivamos tanto la razón de momios (1.6601 en desktop) como su coeficiente log-momios (0.5069).',
    expectedOutputTable: [
      {
        device_type: 'desktop',
        n_pedidos: 6944,
        n_reembolsos: 550,
        prob_reembolso: 0.0792,
        momios_reembolso: 0.086,
        odds_ratio_vs_mobile: 1.6601,
        log_odds_beta: 0.5069,
      },
      {
        device_type: 'pos_tienda',
        n_pedidos: 3085,
        n_reembolsos: 181,
        prob_reembolso: 0.0587,
        momios_reembolso: 0.0623,
        odds_ratio_vs_mobile: 1.2029,
        log_odds_beta: 0.1847,
      },
      {
        device_type: 'mobile',
        n_pedidos: 6171,
        n_reembolsos: 304,
        prob_reembolso: 0.0493,
        momios_reembolso: 0.0518,
        odds_ratio_vs_mobile: 1,
        log_odds_beta: 0,
      },
    ],
  },
  roleNotes: {
    de: 'Deduplica siempre las tablas de eventos secundarios como refunds a grano de order_id antes del LEFT JOIN para no inflar las probabilidades observadas por abanico de claves.',
    da: 'Reporta siempre las razones de momios junto a la probabilidad base del grupo de referencia y verifica la calibración por deciles o quintiles antes de fijar un umbral.',
    bi: 'En tableros de riesgo o propensión, muestra tanto la probabilidad media predicha frente a la tasa real observada por banda como el ahorro neto simulado según el umbral elegido por operaciones.',
  },
  summary: [
    'La regresión logística modela el logaritmo de los momios ln(p / (1 - p)) y garantiza probabilidades entre cero y uno mediante la función sigmoide.',
    'Al exponenciar un coeficiente beta obtenemos la razón de momios (odds ratio), que mide el cambio multiplicativo frente al grupo base.',
    'Un modelo está calibrado cuando la tasa real en cada banda coincide con la probabilidad media predicha, minimizando el puntaje de Brier.',
    'El umbral de decisión óptimo depende de la relación de costes C_FP / (C_FP + C_FN) y rara vez coincide con 0.50.',
  ],
  flashcards: [
    {
      id: 'fc-da4-02-01',
      front: '¿Qué diferencia hay entre la probabilidad p de un evento y sus momios (odds)?',
      back: 'La probabilidad p es la proporción de casos positivos sobre el total, mientras que los momios son el cociente p / (1 - p) entre que ocurra y que no ocurra.',
    },
    {
      id: 'fc-da4-02-02',
      front: '¿Cómo se obtiene la razón de momios (odds ratio) a partir de un coeficiente logístico beta?',
      back: 'Aplicando la función exponencial OR = exp(beta). Si beta = 0, entonces OR = 1 y el predictor no altera los momios del evento.',
    },
    {
      id: 'fc-da4-02-03',
      front: '¿Qué evalúa el puntaje de Brier en clasificación probabilística?',
      back: 'Calcula el promedio de (p_predicha - y_real)^2 entre todas las observaciones; valores cercanos a cero indican probabilidades bien calibradas y discriminativas.',
    },
    {
      id: 'fc-da4-02-04',
      front: '¿Cómo se calcula el umbral de probabilidad óptimo con costes de error asimétricos?',
      back: 'Se divide el coste de un falso positivo entre la suma del coste de falso positivo y falso negativo: C_FP / (C_FP + C_FN).',
    },
  ],
  glossaryTerms: [
    'razon-de-momios',
    'puntaje-brier-calibracion',
    'umbral-decision',
    'probabilidad-condicional',
  ],
  sources: [
    {
      title: 'statsmodels — Regression with Discrete Dependent Variable (Logit and Odds Ratios)',
      url: 'https://www.statsmodels.org/stable/discretemod.html',
      publisher: 'statsmodels Developers',
      accessed: '2025-10-15',
      supports: 'Formulación del modelo logit, estimación de máxima verosimilitud y cálculo de razones de momios.',
    },
    {
      title: 'scikit-learn User Guide — Probability Calibration and Brier Score',
      url: 'https://scikit-learn.org/stable/modules/calibration.html',
      publisher: 'scikit-learn Developers',
      accessed: '2025-10-15',
      supports: 'Curvas de calibración por intervalos y evaluación cuadrática mediante el puntaje de Brier.',
    },
    {
      title: 'scikit-learn User Guide — Logistic Regression',
      url: 'https://scikit-learn.org/stable/modules/linear_model.html',
      publisher: 'scikit-learn Developers',
      accessed: '2025-10-15',
      supports: 'Función sigmoide, log-pérdida y propiedades de las probabilidades predichas en regresión logística.',
    },
    {
      title: 'James, Witten, Hastie, Tibshirani & Taylor — An Introduction to Statistical Learning (ISLP, Ch. 4 Classification)',
      url: 'https://www.statlearning.com/',
      publisher: 'Springer',
      accessed: '2025-10-15',
      supports: 'Interpretación de momios, clasificación binaria y ajuste de umbrales con costes asimétricos.',
    },
  ],
  aiNotes:
    'Insiste en distinguir tres escalas: probabilidad p en [0, 1], momios p / (1 - p) en [0, infinito) y log-momios ln(momios) en (-infinito, infinito). En el ejercicio SQL, verifica que el estudiante preagregue SELECT DISTINCT order_id FROM refunds antes del LEFT JOIN.',
};

export default lesson;
