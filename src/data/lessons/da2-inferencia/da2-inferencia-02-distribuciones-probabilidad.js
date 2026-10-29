export default {
  id: 'da2-inferencia-02-distribuciones-probabilidad',
  moduleId: 'da2-inferencia',
  title: 'Distribuciones: binomial, Poisson, normal y log-normal',
  subtitle: 'Distribuciones de probabilidad útiles: binomial, Poisson, normal y log-normal',
  tracks: ['da'],
  level: 2,
  order: 2,
  minutes: 20,
  prerequisites: ['da2-inferencia-01-probabilidad-bayes'],
  contentVersion: 1,
  hook: 'Un analista de Mercado Brisa calcula el promedio y la desviación estándar de todos los pedidos del segmento `retail` (410.08 USD y 310.45 USD) y reporta que el 95 % de las órdenes se ubica entre -210.81 USD y 1 030.98 USD aplicando la regla de más o menos dos desviaciones estándar. Como ningún pedido puede tener monto negativo, el comité comercial cuestiona todo el informe. ¿Por qué falló la aproximación normal y qué familia de distribuciones modela correctamente cada tipo de variable del negocio?',
  objectives: [
    'Diferenciar los procesos generadores de las distribuciones discretas binomial y de Poisson en conteos operativos.',
    'Diagnosticar por qué las métricas monetarias con asimetría positiva violan el supuesto de normalidad simétrica.',
    'Aplicar transformaciones logarítmicas en SQL para estimar parámetros log-normales, medias geométricas y rangos realistas.',
  ],
  sections: [
    {
      id: 'discretas-binomial-poisson',
      heading: 'Conteos discretos: cuándo usar una binomial y cuándo una Poisson',
      body: 'Las variables discretas cuentan eventos enteros no negativos. Cuando observamos un número fijo de ensayos independientes $n$ y cada uno tiene una probabilidad constante $p$ de éxito, el conteo sigue una **distribución binomial**. Su media es $E[X] = n \\cdot p$ y su varianza es $\\text{Var}(X) = n \\cdot p \\cdot (1 - p)$.\n\nEn cambio, muchas veces contamos cuántas veces ocurre un suceso durante un intervalo continuo de tiempo o espacio. Un buen ejemplo es el número de devoluciones registradas por día en el calendario operativo. Aquí el modelo de referencia es la **distribución de Poisson**, gobernada por la tasa media $\\lambda$. En una Poisson pura la media y la varianza teóricas coinciden ($E[X] = \\text{Var}(X) = \\lambda$). Por ello, su índice de dispersión $\\frac{\\text{Var}(X)}{E[X]}$ vale cerca de $1$.\n\nAl cruzar los 1 095 días de `calendar` con `refunds`, observamos una tasa media de $\\lambda = 1.324$ devoluciones diarias. La varianza diaria es $1.865$, lo que arroja un índice de dispersión de $1.41$ por la estacionalidad comercial.',
      example: {
        language: 'sql',
        code: `WITH conteo_diario AS (
  SELECT
    cal.calendar_date,
    COUNT(r.refund_id) AS devoluciones_dia
  FROM calendar AS cal
  LEFT JOIN refunds AS r ON cal.calendar_date = r.refund_date
  GROUP BY cal.calendar_date
)
SELECT
  COUNT(*) AS total_dias,
  ROUND(AVG(devoluciones_dia), 3) AS tasa_lambda_diaria,
  ROUND(VAR_SAMP(devoluciones_dia), 3) AS varianza_diaria,
  ROUND(VAR_SAMP(devoluciones_dia) / AVG(devoluciones_dia), 2) AS indice_dispersion,
  MAX(devoluciones_dia) AS max_devoluciones_dia
FROM conteo_diario;`,
        expectedOutput: [
          {
            total_dias: 1095,
            tasa_lambda_diaria: 1.324,
            varianza_diaria: 1.865,
            indice_dispersion: 1.41,
            max_devoluciones_dia: 7,
          },
        ],
      },
    },
    {
      id: 'continuas-normal-lognormal',
      heading: 'Variables continuas: de la campana normal a la cola log-normal',
      body: 'Una variable continua sigue una **distribución normal** $\\text{Normal}(\\mu, \\sigma^2)$ cuando suma múltiples fluctuaciones pequeñas e independientes en ambas direcciones. La campana normal es simétrica alrededor de la media ($\\text{asimetría} \\approx 0$). Además, la media coincide con la mediana y el 95 % de las observaciones cae dentro de $\\mu \\pm 1.96\\sigma$.\n\nSin embargo, los montos de compra (`total_usd`) y los tiempos de entrega tienen un tope inferior físico en cero. También crecen de forma multiplicativa cuando un cliente añade cajas completas. Eso produce colas derechas largas que siguen una **distribución log-normal**. En esta familia la variable original $X$ es asimétrica, pero su logaritmo natural $Y = \\ln(X)$ sigue una distribución normal con media $\\mu_{\\ln}$ y desvío $\\sigma_{\\ln}$.\n\nAl volver a dólares mediante la función exponencial, el centro típico ya no es el promedio aritmético. El centro pasa a ser la **media geométrica** $\\exp(\\mu_{\\ln})$, que se ubica cerca de la mediana y nunca genera cotas negativas.',
    },
    {
      id: 'tabla-decision-distribuciones',
      heading: 'Cómo elegir la distribución según el fenómeno comercial',
      body: 'Elegir la distribución adecuada antes de resumir una tabla evita fijar umbrales de alerta imposibles. Si la variable es binaria sobre $n$ intentos conocidos, como la conversión en un lote de clientes, la distribución binomial describe con exactitud la dispersión esperada.\n\nSi analizamos conteos de incidentes por día o por hora donde predominan los valores cero, uno y dos, el modelo de Poisson es la herramienta indicada. Permite detectar picos inusuales y medir si existe sobredispersión cuando la varianza supera a la media.\n\nFinalmente, ante importes monetarios como `total_usd` en `orders`, debemos transformar con `LN(total_usd)`. En escala logarítmica construimos el rango simétrico $\\mu_{\\ln} \\pm 2\\sigma_{\\ln}$ y luego aplicamos `EXP(...)` a ambos extremos. Así obtenemos un intervalo multiplicativo realista que captura tanto el pedido pequeño habitual como las compras mayoristas sin cruzar jamás por debajo de cero dólares.',
    },
  ],
  workedExample: {
    title: 'Modelado normal vs. log-normal del ticket por segmento en Mercado Brisa',
    description:
      'Finanzas solicita un rango de referencia que cubra aproximadamente el 95 % central de los montos de pedido (`total_usd`) para cada segmento (`cafeteria_b2b`, `retail`, `pro_barista`) en `orders`. Compara el intervalo ingenuo x̄ ± 2s frente al intervalo log-normal construido sobre LN(total_usd).',
    steps: [
      {
        label: 'Paso 1 — Error frecuente: aplicar media ± 2 desviaciones sobre datos asimétricos',
        explanation:
          'Al calcular `AVG(o.total_usd) - 2 * STDDEV_SAMP(o.total_usd)` directamente en dólares, la asimetría positiva (`SKEWNESS` entre `0.83` y `1.02`) empuja la cota inferior a valores negativos imposibles en los tres segmentos (`-175.33 USD`, `-210.81 USD` y `-217.97 USD`).',
        code: `SELECT
  c.segment,
  COUNT(*) AS pedidos,
  ROUND(AVG(o.total_usd), 2) AS media_usd,
  ROUND(STDDEV_SAMP(o.total_usd), 2) AS desvio_usd,
  ROUND(AVG(o.total_usd) - 2 * STDDEV_SAMP(o.total_usd), 2) AS cota_inf_normal_usd,
  ROUND(SKEWNESS(o.total_usd), 2) AS asimetria_cruda
FROM orders AS o
INNER JOIN customers AS c ON o.customer_id = c.customer_id
GROUP BY c.segment
ORDER BY media_usd DESC;`,
        expectedOutput: [
          {
            segment: 'cafeteria_b2b',
            pedidos: 3170,
            media_usd: 513.75,
            desvio_usd: 344.54,
            cota_inf_normal_usd: -175.33,
            asimetria_cruda: 0.83,
          },
          {
            segment: 'retail',
            pedidos: 7253,
            media_usd: 410.08,
            desvio_usd: 310.45,
            cota_inf_normal_usd: -210.81,
            asimetria_cruda: 0.97,
          },
          {
            segment: 'pro_barista',
            pedidos: 7577,
            media_usd: 404.76,
            desvio_usd: 311.37,
            cota_inf_normal_usd: -217.97,
            asimetria_cruda: 1.02,
          },
        ],
      },
      {
        label: 'Paso 2 — Ajuste log-normal: transformar con LN y exponenciar las cotas',
        explanation:
          'Calculamos la media y desviación estándar de `LN(o.total_usd)` y regresamos a dólares con `EXP(...)`. Ahora la media geométrica (`392.22 USD` en B2B, `287.62 USD` en retail y `281.80 USD` en pro_barista) y las cotas inferiores (`78.97 USD`, `44.25 USD` y `42.69 USD`) respetan la naturaleza positiva y asimétrica del gasto.',
        code: `SELECT
  c.segment,
  ROUND(AVG(LN(o.total_usd)), 3) AS media_ln,
  ROUND(STDDEV_SAMP(LN(o.total_usd)), 3) AS desvio_ln,
  ROUND(EXP(AVG(LN(o.total_usd))), 2) AS media_geometrica_usd,
  ROUND(EXP(AVG(LN(o.total_usd)) - 2 * STDDEV_SAMP(LN(o.total_usd))), 2) AS cota_inf_lognormal_usd,
  ROUND(EXP(AVG(LN(o.total_usd)) + 2 * STDDEV_SAMP(LN(o.total_usd))), 2) AS cota_sup_lognormal_usd
FROM orders AS o
INNER JOIN customers AS c ON o.customer_id = c.customer_id
GROUP BY c.segment
ORDER BY media_geometrica_usd DESC;`,
        expectedOutput: [
          {
            segment: 'cafeteria_b2b',
            media_ln: 5.972,
            desvio_ln: 0.801,
            media_geometrica_usd: 392.22,
            cota_inf_lognormal_usd: 78.97,
            cota_sup_lognormal_usd: 1948.04,
          },
          {
            segment: 'retail',
            media_ln: 5.662,
            desvio_ln: 0.936,
            media_geometrica_usd: 287.62,
            cota_inf_lognormal_usd: 44.25,
            cota_sup_lognormal_usd: 1869.39,
          },
          {
            segment: 'pro_barista',
            media_ln: 5.641,
            desvio_ln: 0.944,
            media_geometrica_usd: 281.8,
            cota_inf_lognormal_usd: 42.69,
            cota_sup_lognormal_usd: 1860.13,
          },
        ],
      },
    ],
  },
  checks: [
    {
      id: 'chk-da2-02-1',
      type: 'mcq',
      prompt:
        '¿Qué distribución de probabilidad modela de forma más adecuada el número de devoluciones registradas por día en Mercado Brisa cuando los eventos ocurren de manera independiente a una tasa media constante λ?',
      options: [
        {
          id: 'a',
          text: 'Distribución de Poisson',
          correct: true,
          feedback:
            'Correcto: la distribución de Poisson modela conteos de eventos independientes dentro de un intervalo fijo de tiempo o espacio con tasa media λ.',
        },
        {
          id: 'b',
          text: 'Distribución normal estándar',
          correct: false,
          feedback:
            'El conteo diario de devoluciones es una variable entera no negativa (0, 1, 2, ...), no una variable continua simétrica que admita valores negativos.',
        },
        {
          id: 'c',
          text: 'Distribución log-normal',
          correct: false,
          feedback:
            'La distribución log-normal modela variables continuas estrictamente mayores que cero, por lo que no está definida en los días con k = 0 devoluciones.',
        },
      ],
      explanation:
        'Los conteos de eventos discretos en un intervalo fijo de tiempo (como devoluciones por día o reclamos por hora) que toman valores enteros k = 0, 1, 2, ... se modelan con una distribución de Poisson.',
    },
    {
      id: 'chk-da2-02-2',
      type: 'mcq',
      prompt:
        'En la tabla `orders` de Mercado Brisa, la media aritmética del ticket en `mobile` es 390.52 USD, la mediana es 309.13 USD y la media geométrica es 267.58 USD. ¿Qué indica esta relación sobre la distribución de `total_usd`?',
      options: [
        {
          id: 'a',
          text: 'Tiene asimetría negativa (cola izquierda larga), porque la media aritmética supera a la mediana',
          correct: false,
          feedback:
            'Cuando la media aritmética supera a la mediana, la cola larga se extiende hacia los valores altos (derecha), no hacia la izquierda.',
        },
        {
          id: 'b',
          text: 'Presenta asimetría positiva (cola derecha larga), donde los pedidos de alto valor jalan el promedio aritmético por encima de la mediana y de la media geométrica',
          correct: true,
          feedback:
            'Exacto: en una distribución con asimetría positiva como la log-normal se cumple que media geométrica ≤ mediana < media aritmética.',
        },
        {
          id: 'c',
          text: 'Es perfectamente simétrica pero tiene alta curtosis',
          correct: false,
          feedback:
            'En una distribución simétrica la media aritmética y la mediana coinciden en el mismo centro.',
        },
      ],
      explanation:
        'La brecha de más de 81 USD entre la media aritmética (390.52 USD) y la mediana (309.13 USD) refleja la cola derecha de compras grandes característica de las variables log-normales.',
    },
    {
      id: 'chk-da2-02-3',
      type: 'mcq',
      prompt:
        '¿Cuál de las siguientes propiedades distingue a una variable X con distribución log-normal de una variable con distribución de Poisson?',
      options: [
        {
          id: 'a',
          text: 'En la log-normal Y = ln(X) se distribuye normalmente y X es continua positiva, mientras que en la Poisson X cuenta enteros con E[X] = Var(X) = λ',
          correct: true,
          feedback:
            'Correcto: la log-normal modela magnitudes continuas positivas mediante logaritmos y la Poisson modela conteos enteros cuya media iguala a su varianza.',
        },
        {
          id: 'b',
          text: 'En la log-normal la varianza siempre es igual a la media, mientras que en la Poisson el logaritmo es simétrico',
          correct: false,
          feedback:
            'Esa relación está invertida: la igualdad entre media y varianza (λ) es propia de la distribución de Poisson.',
        },
        {
          id: 'c',
          text: 'Ambas son distribuciones discretas pero la log-normal exige un número fijo n de intentos',
          correct: false,
          feedback:
            'La distribución que cuenta éxitos sobre n intentos fijos es la binomial; la log-normal es continua.',
        },
      ],
      explanation:
        'La distribución de Poisson modela conteos discretos con E[X] = Var(X) = λ, mientras que la distribución log-normal modela variables continuas positivas cuyo logaritmo natural sigue una campana normal.',
    },
  ],
  practice: {
    type: 'sql',
    title: 'Parámetros aritméticos y log-normales del ticket por dispositivo',
    language: 'sql',
    prompt:
      'Para cada `device_type` en la tabla `orders`, calcula: el conteo total de pedidos (`pedidos`), el promedio aritmético de `total_usd` redondeado a 2 decimales (`media_aritmetica_usd`), la mediana redondeada a 2 decimales (`mediana_usd`), la media geométrica `EXP(AVG(LN(total_usd)))` redondeada a 2 decimales (`media_geometrica_usd`) y la desviación estándar muestral del logaritmo `STDDEV_SAMP(LN(total_usd))` redondeada a 3 decimales (`desvio_log`). Ordena de mayor a menor por `pedidos`.',
    starterCode: `SELECT
  device_type,
  COUNT(*) AS pedidos,
  ROUND(AVG(total_usd), 2) AS media_aritmetica_usd,
  -- Completa mediana_usd, media_geometrica_usd y desvio_log:
  0.0 AS mediana_usd,
  0.0 AS media_geometrica_usd,
  0.0 AS desvio_log
FROM orders
GROUP BY device_type
ORDER BY pedidos DESC;`,
    expected: `SELECT
  device_type,
  COUNT(*) AS pedidos,
  ROUND(AVG(total_usd), 2) AS media_aritmetica_usd,
  ROUND(MEDIAN(total_usd), 2) AS mediana_usd,
  ROUND(EXP(AVG(LN(total_usd))), 2) AS media_geometrica_usd,
  ROUND(STDDEV_SAMP(LN(total_usd)), 3) AS desvio_log
FROM orders
GROUP BY device_type
ORDER BY pedidos DESC;`,
    orderMatters: true,
    hints: [
      'Usa ROUND(MEDIAN(total_usd), 2) para obtener la mediana exacta en DuckDB.',
      'Para la media geométrica aplica ROUND(EXP(AVG(LN(total_usd))), 2) y para desvio_log usa ROUND(STDDEV_SAMP(LN(total_usd)), 3).',
    ],
    solution: `SELECT
  device_type,
  COUNT(*) AS pedidos,
  ROUND(AVG(total_usd), 2) AS media_aritmetica_usd,
  ROUND(MEDIAN(total_usd), 2) AS mediana_usd,
  ROUND(EXP(AVG(LN(total_usd))), 2) AS media_geometrica_usd,
  ROUND(STDDEV_SAMP(LN(total_usd)), 3) AS desvio_log
FROM orders
GROUP BY device_type
ORDER BY pedidos DESC;`,
    solutionExplanation:
      'En los tres dispositivos la media aritmética supera por entre 70 USD y 81 USD a la mediana debido a la cola derecha de pedidos altos. El canal mobile presenta además la mayor dispersión en escala logarítmica (desvio_log = 0.957).',
    expectedOutputTable: [
      {
        device_type: 'desktop',
        pedidos: 7716,
        media_aritmetica_usd: 456.14,
        mediana_usd: 386.39,
        media_geometrica_usd: 328,
        desvio_log: 0.91,
      },
      {
        device_type: 'mobile',
        pedidos: 6857,
        media_aritmetica_usd: 390.52,
        mediana_usd: 309.13,
        media_geometrica_usd: 267.58,
        desvio_log: 0.957,
      },
      {
        device_type: 'pos_tienda',
        pedidos: 3427,
        media_aritmetica_usd: 429.66,
        mediana_usd: 357.37,
        media_geometrica_usd: 314.84,
        desvio_log: 0.866,
      },
    ],
  },
  roleNotes: {
    de: 'Cuando diseñes reglas automáticas de detección de anomalías en pipelines de ingesta, aplica los umbrales z-score sobre LN(monto) para métricas monetarias o usa cotas basadas en Poisson para conteos diarios de eventos.',
    da: 'Verifica siempre la asimetría (SKEWNESS) y la relación entre media y mediana antes de modelar una variable continua; si la cola derecha es pronunciada, reporta la mediana o la media geométrica junto al promedio.',
    bi: 'En histogramas de ingresos por pedido o tiempo de entrega, ofrece un selector de escala logarítmica o superpón la mediana junto a la media para que los usuarios de negocio no confundan el promedio con el caso típico.',
  },
  summary: [
    'La distribución binomial cuenta éxitos en n ensayos fijos; la de Poisson cuenta ocurrencias por intervalo con tasa media λ.',
    'En una distribución de Poisson pura la media y la varianza teóricas son iguales a λ.',
    'Las variables monetarias suelen seguir una distribución log-normal con asimetría positiva y valores estrictamente positivos.',
    'Transformar montos con LN(x) y volver con EXP(...) evita intervalos con cotas inferiores negativas imposibles.',
  ],
  flashcards: [
    {
      id: 'fc-da2-02-a',
      front: '¿Cuándo se prefiere la distribución de Poisson frente a la binomial?',
      back: 'Cuando contamos eventos independientes en un intervalo continuo de tiempo o espacio (como devoluciones por día) sin un número fijo y pequeño de ensayos n.',
    },
    {
      id: 'fc-da2-02-b',
      front: '¿Qué propiedad caracteriza a una variable X con distribución log-normal?',
      back: 'X solo toma valores positivos y su logaritmo natural Y = ln(X) sigue una distribución normal simétrica.',
    },
    {
      id: 'fc-da2-02-c',
      front: '¿Cómo se calcula la media geométrica de una variable positiva X en SQL?',
      back: 'Mediante EXP(AVG(LN(X))), que exponencia el promedio de los logaritmos naturales.',
    },
  ],
  glossaryTerms: [
    'distribucion-poisson',
    'distribucion-log-normal',
    'probabilidad-condicional',
  ],
  sources: [
    {
      title: 'NIST/SEMATECH e-Handbook — Gallery of Distributions: Normal, Lognormal, Binomial and Poisson (eda366)',
      url: 'https://www.itl.nist.gov/div898/handbook/eda/section3/eda366.htm',
      publisher: 'National Institute of Standards and Technology (NIST)',
      accessed: '2026-10-29',
      supports: 'Funciones de densidad y masa de probabilidad para las familias normal, log-normal, binomial y de Poisson.',
    },
    {
      title: 'SciPy Reference — Statistical Functions (scipy.stats.poisson, scipy.stats.lognorm)',
      url: 'https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.lognorm.html',
      publisher: 'SciPy Developers',
      accessed: '2026-10-29',
      supports: 'Parametrización computacional de variables log-normales y relación con la normal subyacente.',
    },
    {
      title: 'DuckDB Documentation — Aggregate Statistical Functions',
      url: 'https://duckdb.org/docs/sql/functions/aggregates',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Implementación SQL de SKEWNESS, MEDIAN, STDDEV_SAMP y VAR_SAMP.',
    },
  ],
  aiNotes:
    'Los estudiantes suelen olvidar exponenciar el promedio de los logaritmos —dejando AVG(LN(total_usd)) en unidades logarítmicas (~5.6) en vez de EXP(AVG(LN(total_usd))) en dólares (~328 USD)— o intercambiar los decimales de redondeo (2 para montos en USD y 3 para desvio_log). Guía su atención hacia las unidades de cada columna.',
};
