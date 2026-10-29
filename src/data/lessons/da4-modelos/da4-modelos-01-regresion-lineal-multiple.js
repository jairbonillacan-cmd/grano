export const lesson = {
  id: 'da4-modelos-01-regresion-lineal-multiple',
  moduleId: 'da4-modelos',
  tracks: ['da'],
  level: 4,
  order: 1,
  title: 'Regresión lineal múltiple: coeficientes y diagnósticos',
  subtitle:
    'Regresión lineal múltiple: interpretación de coeficientes, colinealidad y diagnósticos',
  minutes: 25,
  prerequisites: [
    'da3-experimentos-01-ab-testing-cuped',
    'da2-inferencia-05-pruebas-hipotesis-valor-p',
  ],
  contentVersion: 2,
  hook: 'El equipo de crecimiento de Mercado Brisa observa que los días con más impresiones publicitarias generan más clics, pero al incluir gasto e impresiones juntos en un modelo lineal la pendiente de impresiones cambia de signo y su error estándar se duplica. Antes de recortar el presupuesto de campañas necesitas separar el aporte de cada predictor manteniendo constante el otro y auditar si la colinealidad infla la varianza. ¿Cómo estimas pendientes lineales en SQL, mides el factor VIF y diagnosticas los residuos antes de decidir?',
  objectives: [
    'Estimar pendientes, interceptos y coeficientes de determinación por segmento en DuckDB mediante REGR_SLOPE, REGR_INTERCEPT y REGR_R2.',
    'Cuantificar la colinealidad entre variables explicativas con el factor de inflación de la varianza (VIF) e interpretar su impacto sobre los errores estándar.',
    'Auditar los residuos del modelo comprobando media nula, error cuadrático medio (RMSE) y homocedasticidad a lo largo del rango predicho.',
  ],
  sections: [
    {
      id: 'minimos-cuadrados-y-pendientes-parciales',
      heading: 'Mínimos cuadrados ordinarios e interpretación ceteris paribus',
      body: 'Un modelo de regresión lineal explica una respuesta continua $y$ a partir de varios predictores $x_1, x_2, \\dots, x_p$. El método de **mínimos cuadrados ordinarios** elige el intercepto $\\beta_0$ y las pendientes $\\beta_j$. Su objetivo es minimizar la suma de errores al cuadrado entre cada dato real y su predicción: $\\min_{\\beta} \\sum_{i=1}^{n} (y_i - \\hat{y}_i)^2$.\n\nEn una regresión simple, la pendiente $\\beta_1$ mide el cambio medio en $y$ por cada unidad adicional de $x_1$. Al pasar a regresión múltiple o estratificar por un control, cada coeficiente adquiere una lectura condicional. Mide cuánto cambia $y$ cuando $x_j$ sube una unidad manteniendo fijas las demás covariables.\n\nEn **DuckDB**, las funciones `REGR_SLOPE(y, x)`, `REGR_INTERCEPT(y, x)` y `REGR_R2(y, x)` reciben primero la respuesta $y$ y después el predictor $x$. Junto con `GROUP BY` o ventanas `OVER (PARTITION BY ...)`, estiman modelos separados por canal directamente en SQL.',
      example: {
        language: 'sql',
        code: `SELECT
  channel,
  COUNT(*) AS n_dias,
  ROUND(REGR_SLOPE(clicks, spend_usd), 4) AS beta_pendiente,
  ROUND(REGR_INTERCEPT(clicks, spend_usd), 2) AS beta_intercepto,
  ROUND(REGR_R2(clicks, spend_usd), 4) AS r2_clicks_spend
FROM marketing_spend
GROUP BY channel
ORDER BY r2_clicks_spend DESC;`,
        expectedOutput: [
          {
            channel: 'display_video',
            n_dias: 146,
            beta_pendiente: 1.3318,
            beta_intercepto: -24.41,
            r2_clicks_spend: 0.4041,
          },
          {
            channel: 'email_campaign',
            n_dias: 146,
            beta_pendiente: 1.1932,
            beta_intercepto: 5.65,
            r2_clicks_spend: 0.385,
          },
          {
            channel: 'paid_social',
            n_dias: 146,
            beta_pendiente: 1.1551,
            beta_intercepto: 48.35,
            r2_clicks_spend: 0.3824,
          },
          {
            channel: 'organic_search',
            n_dias: 146,
            beta_pendiente: 1.2763,
            beta_intercepto: -2.03,
            r2_clicks_spend: 0.3783,
          },
          {
            channel: 'referral',
            n_dias: 146,
            beta_pendiente: 1.2082,
            beta_intercepto: 10.68,
            r2_clicks_spend: 0.353,
          },
        ],
      },
    },
    {
      id: 'colinealidad-y-factor-vif',
      heading: 'Colinealidad entre predictores y factor de inflación de varianza',
      body: 'Cuando dos variables explicativas se mueven casi al unísono, falta variación independiente para separar el efecto propio de cada una. Este fenómeno se llama **colinealidad**. Ocurre a menudo al incluir juntos el presupuesto diario (`spend_usd`) y las impresiones (`impressions`) de una misma pauta.\n\nLa colinealidad no sesga la predicción global $\\hat{y}$, pero hincha la varianza de los coeficientes estimados $\\hat{\\beta}_j$. Por ello, pequeñas fluctuaciones muestrales provocan saltos bruscos en las pendientes o invierten su signo.\n\nPara diagnosticar este problema calculamos el **factor de inflación de la varianza** ($\\text{VIF}_j = \\frac{1}{1 - R_j^2}$) de cada predictor. Regresamos el predictor $x_j$ contra el resto de variables explicativas y obtenemos su coeficiente $R_j^2$. El VIF mide por cuánto se multiplica la varianza del coeficiente frente a un escenario sin correlación. Un $\\text{VIF} = 1$ indica ausencia de colinealidad; valores mayores a $5$ alertan de redundancia severa.',
    },
    {
      id: 'diagnostico-de-residuos',
      heading: 'Diagnóstico de residuos: homocedasticidad y valores atípicos',
      body: 'Un coeficiente de determinación $R^2$ alto nunca basta para dar por válido un modelo lineal. Antes de usar las pendientes para asignar presupuesto, debemos inspeccionar los **residuos** individuales $e_i = y_i - \\hat{y}_i$.\n\nPrimero comprobamos que la media de los residuos dentro de cada grupo sea cero. También calculamos la raíz del error cuadrático medio (**RMSE**) en las unidades originales del negocio. El RMSE resume la magnitud típica del fallo de predicción y penaliza más los desvíos grandes.\n\nSegundo, evaluamos la **homocedasticidad**. La dispersión de los residuos debe mantenerse estable tanto en días de gasto bajo como en días de gasto alto ($\\text{Var}(e_i \\mid X_i) = \\sigma^2$). Si la dispersión en el tramo superior duplica a la del tramo inferior, existe heterocedasticidad. En ese escenario los valores $p$ convencionales pierden validez y debemos aplicar estimadores de Huber-White o transformar la escala.',
    },
    {
      id: 'regresion-estratificada-y-ajuste-covariables',
      heading: 'Regresión por estratos y conexión con el ajuste experimental',
      body: 'En el módulo de experimentación vimos que **CUPED** reduce la varianza de una prueba A/B. Lo logra restando la parte del gasto post-experimento explicada por el gasto pre-experimento. Aquella corrección es una regresión lineal cuya pendiente óptima $\\theta$ coincide con `REGR_SLOPE(post_experiment_spend_usd, pre_experiment_spend_usd)`.\n\nAl analizar `experiment_assignments` separando por experimento y variante (`control` frente a `treatment`), verificamos dos propiedades clave. Primero, si las pendientes $\\hat{\\beta}_1$ son paralelas entre grupos, el efecto del tratamiento es constante en todos los niveles de gasto previo.\n\nSegundo, la diferencia entre los interceptos $\\hat{\\beta}_0$ refleja el salto vertical inducido por la variante ganadora. Mientras tanto, el RMSE de los residuos cuantifica el ruido no explicado que persiste tras controlar por el historial del cliente.',
    },
  ],
  workedExample: {
    title: 'Pendientes, VIF y auditoría de residuos en marketing_spend',
    description:
      'El equipo de adquisición de Mercado Brisa quiere estimar cuántos clics adicionales genera cada dólar invertido en marketing_spend según el canal, medir el VIF entre spend_usd e impressions y auditar el RMSE de los residuos de cada canal.',
    audit:
      'Aunque todos los canales presentan pendientes entre 1.15 y 1.33 clics por dólar, paid_social exhibe un RMSE de 98.38 clics (cuatro veces el de email_campaign) y una colinealidad marcada entre gasto e impresiones (VIF > 3).',
    steps: [
      {
        label: 'Paso 1: Pendiente OLS, R² y factor VIF por canal',
        explanation:
          'Calculamos por canal la pendiente e intercepto de clicks sobre spend_usd, el R² del ajuste y el factor VIF derivado de la correlación lineal entre spend_usd e impressions.',
        code: `SELECT
  channel,
  COUNT(*) AS n_dias,
  ROUND(REGR_SLOPE(clicks, spend_usd), 4) AS beta_pendiente,
  ROUND(REGR_INTERCEPT(clicks, spend_usd), 2) AS beta_intercepto,
  ROUND(REGR_R2(clicks, spend_usd), 4) AS r2_clicks_spend,
  ROUND(CORR(spend_usd, impressions), 4) AS r_spend_impr,
  ROUND(1.0 / (1.0 - POWER(CORR(spend_usd, impressions), 2)), 2) AS vif_spend_impr
FROM marketing_spend
GROUP BY channel
ORDER BY vif_spend_impr DESC;`,
        expectedOutput: [
          {
            channel: 'organic_search',
            n_dias: 146,
            beta_pendiente: 1.2763,
            beta_intercepto: -2.03,
            r2_clicks_spend: 0.3783,
            r_spend_impr: 0.8404,
            vif_spend_impr: 3.41,
          },
          {
            channel: 'email_campaign',
            n_dias: 146,
            beta_pendiente: 1.1932,
            beta_intercepto: 5.65,
            r2_clicks_spend: 0.385,
            r_spend_impr: 0.8346,
            vif_spend_impr: 3.29,
          },
          {
            channel: 'paid_social',
            n_dias: 146,
            beta_pendiente: 1.1551,
            beta_intercepto: 48.35,
            r2_clicks_spend: 0.3824,
            r_spend_impr: 0.8245,
            vif_spend_impr: 3.12,
          },
          {
            channel: 'referral',
            n_dias: 146,
            beta_pendiente: 1.2082,
            beta_intercepto: 10.68,
            r2_clicks_spend: 0.353,
            r_spend_impr: 0.8089,
            vif_spend_impr: 2.89,
          },
          {
            channel: 'display_video',
            n_dias: 146,
            beta_pendiente: 1.3318,
            beta_intercepto: -24.41,
            r2_clicks_spend: 0.4041,
            r_spend_impr: 0.7582,
            vif_spend_impr: 2.35,
          },
        ],
      },
      {
        label: 'Paso 2: Diagnóstico de residuos y RMSE por canal',
        explanation:
          'Proyectamos la predicción lineal para cada día y resumimos los residuos individuales por canal mediante su media, el RMSE y el error absoluto máximo.',
        code: `WITH parametros AS (
  SELECT
    channel,
    REGR_SLOPE(clicks, spend_usd) AS beta_1,
    REGR_INTERCEPT(clicks, spend_usd) AS beta_0
  FROM marketing_spend
  GROUP BY channel
),
residuos AS (
  SELECT
    m.channel,
    m.clicks - (p.beta_0 + p.beta_1 * m.spend_usd) AS residuo
  FROM marketing_spend m
  JOIN parametros p ON m.channel = p.channel
)
SELECT
  channel,
  COUNT(*) AS n_dias,
  ROUND(AVG(residuo), 4) AS media_residuo,
  ROUND(SQRT(AVG(POWER(residuo, 2))), 2) AS rmse_clicks,
  ROUND(MAX(ABS(residuo)), 2) AS max_error_abs
FROM residuos
GROUP BY channel
ORDER BY rmse_clicks DESC;`,
        expectedOutput: [
          {
            channel: 'paid_social',
            n_dias: 146,
            media_residuo: 0,
            rmse_clicks: 98.38,
            max_error_abs: 308.11,
          },
          {
            channel: 'display_video',
            n_dias: 146,
            media_residuo: 0,
            rmse_clicks: 77.06,
            max_error_abs: 208.81,
          },
          {
            channel: 'organic_search',
            n_dias: 146,
            media_residuo: 0,
            rmse_clicks: 46.83,
            max_error_abs: 115.93,
          },
          {
            channel: 'referral',
            n_dias: 146,
            media_residuo: 0,
            rmse_clicks: 38.24,
            max_error_abs: 100.26,
          },
          {
            channel: 'email_campaign',
            n_dias: 146,
            media_residuo: 0,
            rmse_clicks: 22.65,
            max_error_abs: 61.52,
          },
        ],
      },
    ],
  },
  checks: [
    {
      id: 'check-da4-01-orden-argumentos',
      type: 'mcq',
      prompt:
        'Quieres estimar en DuckDB cuántos dólares adicionales de gasto post-experimento se asocian a cada dólar de gasto pre-experimento en experiment_assignments. ¿Qué expresión calcula correctamente esa pendiente?',
      options: [
        {
          id: 'a',
          text: 'REGR_SLOPE(post_experiment_spend_usd, pre_experiment_spend_usd)',
          correct: true,
          feedback:
            'Correcto. En SQL estándar y DuckDB, REGR_SLOPE(y, x) recibe primero la variable dependiente (post) y segundo la variable explicativa (pre).',
        },
        {
          id: 'b',
          text: 'REGR_SLOPE(pre_experiment_spend_usd, post_experiment_spend_usd)',
          correct: false,
          feedback:
            'Incorrecto. Esa expresión estima la regresión inversa del gasto previo sobre el gasto posterior.',
        },
        {
          id: 'c',
          text: 'REGR_R2(post_experiment_spend_usd, pre_experiment_spend_usd)',
          correct: false,
          feedback:
            'Incorrecto. REGR_R2 devuelve la proporción de varianza explicada (sin unidades ni signo), no la pendiente en dólares.',
        },
        {
          id: 'd',
          text: 'CORR(post_experiment_spend_usd, pre_experiment_spend_usd)',
          correct: false,
          feedback:
            'Incorrecto. El coeficiente de correlación es adimensional; solo coincide con la pendiente si ambas variables tienen exactamente la misma desviación estándar.',
        },
      ],
      explanation:
        'Las funciones de regresión agregada de SQL siguen la convención matemática f(y, x): el primer argumento es la respuesta que queremos predecir y el segundo es el regresor.',
    },
    {
      id: 'check-da4-01-vif-colinealidad',
      type: 'mcq',
      prompt:
        'Al regresar un predictor X_1 contra el resto de variables explicativas del modelo obtienes un R² de 0.875. ¿Cuál es su factor de inflación de la varianza (VIF) y qué implica?',
      options: [
        {
          id: 'a',
          text: 'VIF = 8.0; la varianza del coeficiente estimado de X_1 se multiplica por 8 debido a una fuerte colinealidad con los demás predictores.',
          correct: true,
          feedback:
            'Correcto. VIF = 1 / (1 - 0.875) = 1 / 0.125 = 8.0, lo que supera el umbral de alerta de 5 e infla el error estándar por raíz de 8.',
        },
        {
          id: 'b',
          text: 'VIF = 1.14; el predictor es prácticamente independiente del resto y su pendiente es muy estable.',
          correct: false,
          feedback:
            'Incorrecto. Dividiste 1 entre 0.875 en lugar de dividir 1 entre (1 - 0.875).',
        },
        {
          id: 'c',
          text: 'VIF = 8.0; significa que el 80% de los residuos del modelo principal son valores atípicos.',
          correct: false,
          feedback:
            'Incorrecto. El VIF mide redundancia lineal entre predictores X, no el porcentaje de valores atípicos en la respuesta Y.',
        },
        {
          id: 'd',
          text: 'VIF = 0.125; indica que el predictor explica solo el 12.5% de la variable respuesta Y.',
          correct: false,
          feedback:
            'Incorrecto. 0.125 es la tolerancia (1 - R²_j), que es el inverso del VIF.',
        },
      ],
      explanation:
        'El factor de inflación de la varianza se define como 1 / (1 - R²_j). Con R²_j = 0.875, la tolerancia cae a 0.125 y el VIF sube a 8.0, desestabilizando la estimación individual.',
    },
    {
      id: 'check-da4-01-heterocedasticidad',
      type: 'mcq',
      prompt:
        'Tras ajustar un modelo lineal de ingresos sobre gasto publicitario, observas que el RMSE de los residuos es de 40 USD en días de gasto bajo y de 310 USD en días de gasto alto. ¿Qué supuesto se viola?',
      options: [
        {
          id: 'a',
          text: 'Homocedasticidad: la varianza del error depende del nivel del predictor, lo que invalida los errores estándar ordinarios.',
          correct: true,
          feedback:
            'Correcto. Cuando la dispersión residual crece con el nivel de X existe heterocedasticidad y los intervalos de confianza clásicos pierden cobertura.',
        },
        {
          id: 'b',
          text: 'Ausencia de colinealidad: un solo predictor nunca puede tener dispersión cambiante a menos que falte el intercepto.',
          correct: false,
          feedback:
            'Incorrecto. La colinealidad concierne a la correlación entre múltiples predictores, no al cambio de varianza de los residuos.',
        },
        {
          id: 'c',
          text: 'Media nula de los residuos: que el RMSE crezca implica necesariamente que la suma total de residuos dejó de ser cero.',
          correct: false,
          feedback:
            'Incorrecto. Los residuos pueden seguir centrados en cero en ambos tramos pero con una dispersión mucho más ancha en el tramo alto.',
        },
        {
          id: 'd',
          text: 'Ninguno: el método de mínimos cuadrados ordinarios exige precisamente que la varianza crezca en proporción al predictor.',
          correct: false,
          feedback:
            'Incorrecto. El teorema de Gauss-Markov asume varianza constante (homocedasticidad) para que OLS sea el mejor estimador lineal insesgado.',
        },
      ],
      explanation:
        'La homocedasticidad exige que Var(e_i | X_i) sea constante. Un abanico de residuos que se ensancha con el gasto revela heterocedasticidad y requiere estimadores de varianza corregidos o transformación logarítmica.',
    },
  ],
  practice: {
    type: 'sql',
    title: 'Regresión por grupo experimental y diagnóstico de RMSE en experiment_assignments',
    language: 'sql',
    prompt:
      'En la tabla `experiment_assignments`, ajusta por cada combinación de `experiment_id` y `variant` la regresión lineal de `post_experiment_spend_usd` (respuesta $y$) sobre `pre_experiment_spend_usd` (predictor $x$) únicamente para los experimentos `1`, `2` y `3`. Devuelve las columnas `experiment_id`, `variant`, `n_clientes` (conteo de filas), `pendiente` (`REGR_SLOPE` redondeado a 4 decimales), `intercepto` (`REGR_INTERCEPT` redondeado a 2 decimales), `r2` (`REGR_R2` redondeado a 4 decimales) y `rmse_residuos` (raíz del promedio del residuo al cuadrado redondeada a 2 decimales). Ordena por `experiment_id` ascendente y `variant` ascendente.',
    starterCode: `-- Ajusta la regresión de post_experiment_spend_usd (y) sobre pre_experiment_spend_usd (x)
-- para experiment_id IN (1, 2, 3) y calcula el RMSE de los residuos por grupo.
WITH modelo_por_grupo AS (
  SELECT
    experiment_id,
    variant,
    pre_experiment_spend_usd,
    post_experiment_spend_usd,
    -- Corrige el orden de argumentos (y, x) en las funciones de ventana:
    REGR_SLOPE(pre_experiment_spend_usd, post_experiment_spend_usd) OVER (PARTITION BY experiment_id, variant) AS beta_1,
    REGR_INTERCEPT(pre_experiment_spend_usd, post_experiment_spend_usd) OVER (PARTITION BY experiment_id, variant) AS beta_0,
    REGR_R2(pre_experiment_spend_usd, post_experiment_spend_usd) OVER (PARTITION BY experiment_id, variant) AS r_cuadrado
  FROM experiment_assignments
  WHERE experiment_id IN (1, 2, 3)
)
SELECT
  experiment_id,
  variant,
  COUNT(*) AS n_clientes,
  ROUND(AVG(beta_1), 4) AS pendiente,
  ROUND(AVG(beta_0), 2) AS intercepto,
  ROUND(AVG(r_cuadrado), 4) AS r2
FROM modelo_por_grupo
GROUP BY experiment_id, variant
ORDER BY experiment_id, variant;`,
    expected: `WITH modelo_por_grupo AS (
  SELECT
    experiment_id,
    variant,
    pre_experiment_spend_usd,
    post_experiment_spend_usd,
    REGR_SLOPE(post_experiment_spend_usd, pre_experiment_spend_usd) OVER (PARTITION BY experiment_id, variant) AS beta_1,
    REGR_INTERCEPT(post_experiment_spend_usd, pre_experiment_spend_usd) OVER (PARTITION BY experiment_id, variant) AS beta_0,
    REGR_R2(post_experiment_spend_usd, pre_experiment_spend_usd) OVER (PARTITION BY experiment_id, variant) AS r_cuadrado
  FROM experiment_assignments
  WHERE experiment_id IN (1, 2, 3)
)
SELECT
  experiment_id,
  variant,
  COUNT(*) AS n_clientes,
  ROUND(AVG(beta_1), 4) AS pendiente,
  ROUND(AVG(beta_0), 2) AS intercepto,
  ROUND(AVG(r_cuadrado), 4) AS r2,
  ROUND(SQRT(AVG(POWER(post_experiment_spend_usd - (beta_0 + beta_1 * pre_experiment_spend_usd), 2))), 2) AS rmse_residuos
FROM modelo_por_grupo
GROUP BY experiment_id, variant
ORDER BY experiment_id, variant;`,
    orderMatters: true,
    hints: [
      'Recuerda que en REGR_SLOPE(y, x) y REGR_INTERCEPT(y, x) la variable dependiente post_experiment_spend_usd va primero y pre_experiment_spend_usd va segundo.',
      'Dentro del CTE modelo_por_grupo puedes calcular el valor predicho como beta_0 + beta_1 * pre_experiment_spend_usd para obtener el residuo de cada fila.',
      'En el SELECT final agrega ROUND(SQRT(AVG(POWER(post_experiment_spend_usd - (beta_0 + beta_1 * pre_experiment_spend_usd), 2))), 2) AS rmse_residuos.',
    ],
    solution: `WITH modelo_por_grupo AS (
  SELECT
    experiment_id,
    variant,
    pre_experiment_spend_usd,
    post_experiment_spend_usd,
    REGR_SLOPE(post_experiment_spend_usd, pre_experiment_spend_usd) OVER (PARTITION BY experiment_id, variant) AS beta_1,
    REGR_INTERCEPT(post_experiment_spend_usd, pre_experiment_spend_usd) OVER (PARTITION BY experiment_id, variant) AS beta_0,
    REGR_R2(post_experiment_spend_usd, pre_experiment_spend_usd) OVER (PARTITION BY experiment_id, variant) AS r_cuadrado
  FROM experiment_assignments
  WHERE experiment_id IN (1, 2, 3)
)
SELECT
  experiment_id,
  variant,
  COUNT(*) AS n_clientes,
  ROUND(AVG(beta_1), 4) AS pendiente,
  ROUND(AVG(beta_0), 2) AS intercepto,
  ROUND(AVG(r_cuadrado), 4) AS r2,
  ROUND(SQRT(AVG(POWER(post_experiment_spend_usd - (beta_0 + beta_1 * pre_experiment_spend_usd), 2))), 2) AS rmse_residuos
FROM modelo_por_grupo
GROUP BY experiment_id, variant
ORDER BY experiment_id, variant;`,
    solutionExplanation:
      'Calculamos primero las estadísticas de regresión por partición (experiment_id, variant) pasando post_experiment_spend_usd como respuesta y pre_experiment_spend_usd como regresor. Luego resumimos cada grupo proyectando la recta ajustada y obteniendo la raíz del error cuadrático medio (RMSE) de los residuos individuales.',
    expectedOutputTable: [
      {
        experiment_id: 1,
        variant: 'control',
        n_clientes: 800,
        pendiente: 0.6606,
        intercepto: 13.31,
        r2: 0.9366,
        rmse_residuos: 4.64,
      },
      {
        experiment_id: 1,
        variant: 'treatment',
        n_clientes: 800,
        pendiente: 0.6495,
        intercepto: 21.01,
        r2: 0.9356,
        rmse_residuos: 4.6,
      },
      {
        experiment_id: 2,
        variant: 'control',
        n_clientes: 800,
        pendiente: 0.6575,
        intercepto: 13.5,
        r2: 0.9388,
        rmse_residuos: 4.53,
      },
      {
        experiment_id: 2,
        variant: 'treatment',
        n_clientes: 800,
        pendiente: 0.6517,
        intercepto: 20.23,
        r2: 0.9352,
        rmse_residuos: 4.7,
      },
      {
        experiment_id: 3,
        variant: 'control',
        n_clientes: 800,
        pendiente: 0.6444,
        intercepto: 14.27,
        r2: 0.9347,
        rmse_residuos: 4.63,
      },
      {
        experiment_id: 3,
        variant: 'treatment',
        n_clientes: 800,
        pendiente: 0.6424,
        intercepto: 20.98,
        r2: 0.9343,
        rmse_residuos: 4.59,
      },
    ],
  },
  roleNotes: {
    de: 'Garantiza que las covariables pre-experimento y los registros de gasto publicitario se materialicen sin valores centinela ni duplicados por reintento antes de alimentar vistas de regresión.',
    da: 'Verifica siempre el orden (y, x) en REGR_SLOPE, acompaña cada pendiente de su diagnóstico de colinealidad VIF y comprueba que el RMSE residual sea homogéneo entre estratos.',
    bi: 'Al publicar rectas de tendencia en tableros ejecutivos, expón junto a la pendiente el R² y el RMSE en unidades de negocio para evitar que se sobreinterpreten ajustes ruidosos.',
  },
  summary: [
    'El método de mínimos cuadrados ordinarios estima pendientes e interceptos minimizando la suma de residuos al cuadrado.',
    'En DuckDB, REGR_SLOPE(y, x), REGR_INTERCEPT(y, x) y REGR_R2(y, x) exigen siempre la respuesta y en el primer argumento.',
    'El factor de inflación de la varianza VIF = 1 / (1 - R²_j) cuantifica cuánto hincha la colinealidad los errores estándar.',
    'Todo ajuste lineal requiere auditar los residuos mediante su RMSE y confirmar que la dispersión sea homocedástica.',
  ],
  flashcards: [
    {
      id: 'fc-da4-01-01',
      front: '¿Qué orden de argumentos reciben REGR_SLOPE y REGR_INTERCEPT en DuckDB?',
      back: 'Reciben primero la variable dependiente o respuesta y, y en segundo lugar la variable explicativa o regresor x: REGR_SLOPE(y, x).',
    },
    {
      id: 'fc-da4-01-02',
      front: '¿Cómo se interpreta una pendiente en una regresión lineal múltiple?',
      back: 'Representa el cambio esperado en la respuesta y cuando ese predictor aumenta en una unidad, manteniendo constantes todas las demás variables explicativas.',
    },
    {
      id: 'fc-da4-01-03',
      front: '¿Qué mide el factor de inflación de la varianza (VIF) y qué umbral alerta de peligro?',
      back: 'Mide cuánto se multiplica la varianza del coeficiente estimado por colinealidad con otros predictores (1 / (1 - R²_j)). Valores superiores a 5 indican colinealidad severa.',
    },
    {
      id: 'fc-da4-01-04',
      front: '¿Qué ocurre cuando los residuos de una regresión presentan heterocedasticidad?',
      back: 'La dispersión del error cambia según el nivel del predictor, por lo que los errores estándar ordinarios y sus valores p dejan de ser fiables.',
    },
  ],
  glossaryTerms: [
    'minimos-cuadrados-ordinarios',
    'factor-inflacion-varianza',
    'homocedasticidad-residuos',
    'correlacion-pearson',
    'c24-cuped-variance',
  ],
  sources: [
    {
      title: 'DuckDB Documentation — Aggregate Functions (REGR_SLOPE, REGR_INTERCEPT, REGR_R2)',
      url: 'https://duckdb.org/docs/stable/sql/functions/aggregates.html',
      publisher: 'DuckDB Foundation',
      accessed: '2025-10-15',
      supports: 'Sintaxis y orden de argumentos (y, x) de las funciones de regresión lineal agregada en SQL.',
    },
    {
      title: 'statsmodels — Ordinary Least Squares (OLS) and Regression Diagnostics',
      url: 'https://www.statsmodels.org/stable/regression.html',
      publisher: 'statsmodels Developers',
      accessed: '2025-10-15',
      supports: 'Estimación por mínimos cuadrados ordinarios, análisis de residuos y pruebas de homocedasticidad.',
    },
    {
      title: 'statsmodels — variance_inflation_factor (Multicollinearity Diagnostics)',
      url: 'https://www.statsmodels.org/stable/generated/statsmodels.stats.outliers_influence.variance_inflation_factor.html',
      publisher: 'statsmodels Developers',
      accessed: '2025-10-15',
      supports: 'Definición matemática e interpretación del factor de inflación de la varianza (VIF).',
    },
    {
      title: 'James, Witten, Hastie, Tibshirani & Taylor — An Introduction to Statistical Learning (ISLP, Ch. 3 Linear Regression)',
      url: 'https://www.statlearning.com/',
      publisher: 'Springer',
      accessed: '2025-10-15',
      supports: 'Interpretación ceteris paribus de pendientes múltiples, colinealidad y diagnóstico de errores.',
    },
  ],
  aiNotes:
    'Guía al estudiante a verificar primero qué variable actúa como respuesta y cuál como predictor antes de escribir REGR_SLOPE(y, x). Si confunde correlación con pendiente o ignora el diagnóstico de residuos, pídele comparar las unidades de REGR_SLOPE frente a REGR_R2 y calcular el VIF a partir de CORR.',
};

export default lesson;
