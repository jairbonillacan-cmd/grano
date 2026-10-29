export default {
  id: 'da2-inferencia-04-intervalos-confianza',
  moduleId: 'da2-inferencia',
  title: 'Intervalos de confianza: qué significan y cómo comunicarlos',
  subtitle: 'Intervalos de confianza: qué significan realmente y cómo comunicarlos',
  tracks: ['da'],
  level: 2,
  order: 4,
  minutes: 20,
  prerequisites: ['da2-inferencia-03-muestreo-tlc-error-estandar'],
  contentVersion: 1,
  hook: 'En el cierre trimestral de México, la tienda de Guadalajara (`STR-MX-03`) reporta un ticket medio de 350.45 USD y supera por 4.32 USD a la tienda de Ciudad de México (`STR-MX-01`, con 346.13 USD). La dirección regional propone entregar el bono de desempeño únicamente a Guadalajara y amonestar a `STR-MX-01`. Antes de firmar el acta, calculas el margen de error al 95 % de cada tienda y descubres que ronda los ±21 USD. ¿Existe una diferencia real de desempeño o están premiando ruido muestral?',
  objectives: [
    'Construir intervalos de confianza al 95 % para medias y proporciones utilizando el error estándar y el valor crítico z.',
    'Comunicar el significado frecuentista de un intervalo de confianza sin caer en falacias de interpretación.',
    'Evaluar el solapamiento de intervalos de confianza en SQL para evitar rankings engañosos entre sucursales o canales.',
  ],
  sections: [
    {
      id: 'anatomia-intervalo-confianza',
      heading: 'De la estimación puntual al margen de error: media y proporción',
      body: 'Una estimación puntual como $\\bar{x} = 350.45\\text{ USD}$ es útil pero incompleta. Por sí sola no informa si su incertidumbre es de $\\pm 1\\text{ USD}$ o de $\\pm 50\\text{ USD}$. Un **intervalo de confianza (IC)** combina la estimación puntual con un **margen de error** que mide la precisión del estimador: $\\text{IC}_{1-\\alpha} = \\bar{x} \\pm z_{1-\\alpha/2} \\cdot EE(\\bar{x})$.\n\nGracias al teorema del límite central, en muestras moderadas o grandes ($n \\ge 100$) usamos los cuantiles de la normal estándar. Para un nivel de confianza del **95 %** ($\\alpha = 0.05$, dejando 2.5 % en cada cola), el valor crítico es $z_{0.975} = 1.96$. Si deseamos un intervalo al 99 % ($\\alpha = 0.01$), el multiplicador sube a $z_{0.995} = 2.576$. Eso ensancha el intervalo a cambio de mayor cobertura.\n\nPara una **proporción muestral** $\\hat{p}$ (como la tasa de pagos fallidos sobre $n$ intentos), el error estándar es $EE(\\hat{p}) = \\sqrt{\\frac{\\hat{p}(1 - \\hat{p})}{n}}$. Su intervalo al 95 % se calcula como $\\hat{p} \\pm 1.96\\sqrt{\\frac{\\hat{p}(1 - \\hat{p})}{n}}$.',
      example: {
        language: 'sql',
        code: `WITH stats_pagos AS (
  SELECT
    payment_method,
    COUNT(*) AS n_intentos,
    AVG(CASE WHEN status = 'failed' THEN 1.0 ELSE 0.0 END) AS p_fallo
  FROM payments
  WHERE attempt_number = 1
  GROUP BY payment_method
)
SELECT
  payment_method,
  n_intentos,
  ROUND(100.0 * p_fallo, 2) AS tasa_fallo_pct,
  ROUND(100.0 * 1.96 * SQRT(p_fallo * (1.0 - p_fallo) / n_intentos), 2) AS margen_error_95_pp,
  ROUND(100.0 * (p_fallo - 1.96 * SQRT(p_fallo * (1.0 - p_fallo) / n_intentos)), 2) AS ic95_inf_pct,
  ROUND(100.0 * (p_fallo + 1.96 * SQRT(p_fallo * (1.0 - p_fallo) / n_intentos)), 2) AS ic95_sup_pct
FROM stats_pagos
ORDER BY tasa_fallo_pct DESC;`,
        expectedOutput: [
          {
            payment_method: 'transferencia_spei',
            n_intentos: 4612,
            tasa_fallo_pct: 11.75,
            margen_error_95_pp: 0.93,
            ic95_inf_pct: 10.82,
            ic95_sup_pct: 12.68,
          },
          {
            payment_method: 'efectivo_tienda',
            n_intentos: 4613,
            tasa_fallo_pct: 11.73,
            margen_error_95_pp: 0.93,
            ic95_inf_pct: 10.8,
            ic95_sup_pct: 12.66,
          },
          {
            payment_method: 'card',
            n_intentos: 4612,
            tasa_fallo_pct: 7.94,
            margen_error_95_pp: 0.78,
            ic95_inf_pct: 7.16,
            ic95_sup_pct: 8.72,
          },
          {
            payment_method: 'billetera_digital',
            n_intentos: 4613,
            tasa_fallo_pct: 7.87,
            margen_error_95_pp: 0.78,
            ic95_inf_pct: 7.09,
            ic95_sup_pct: 8.65,
          },
        ],
      },
    },
    {
      id: 'interpretacion-sin-falacias',
      heading: 'Qué significa realmente el 95 % de confianza',
      body: 'En inferencia frecuentista, el parámetro poblacional $\\mu$ es un valor fijo aunque desconocido. Lo que varía de una muestra a otra son los extremos del intervalo calculado. Un **nivel de confianza del 95 %** describe el desempeño del método a largo plazo. Si repitiéramos el muestreo muchas veces, el **95 % de los intervalos construidos contendría el verdadero parámetro poblacional**.\n\nAl redactar informes ejecutivos conviene evitar tres malinterpretaciones frecuentes documentadas por Greenland et al. (2016). Primero, no confundas el IC con el rango de pedidos individuales. El IC 95 % de la media de `STR-MX-01` (`[325.08, 367.17] USD`) acota el **promedio poblacional**, no el 95 % de las compras individuales.\n\nSegundo, no asumas que solo el centro del intervalo es plausible. Todos los valores dentro de las cotas son compatibles con los datos. Tercero, revisa siempre el solapamiento antes de armar un ranking. En la tabla de pagos, `card` (`[7.16 %, 8.72 %]`) y `billetera_digital` (`[7.09 %, 8.65 %]`) están empatados, pero ambos superan con claridad a `transferencia_spei` (`[10.82 %, 12.68 %]`).',
    },
    {
      id: 'comunicacion-ejecutiva-ic',
      heading: 'Cómo comunicar intervalos y evitar rankings espurios',
      body: 'Los tableros corporativos suelen ordenar tiendas o campañas por su promedio puntual. Luego pintan en verde al primero y en rojo al último. Cuando las muestras son moderadas, esa costumbre premia o castiga el azar.\n\nUna regla clara para comunicar resultados consiste en acompañar cada promedio de su margen de error (`350.45 USD ± 20.95 USD`). También puedes mostrar sus cotas inferior y superior (`[329.50, 371.39] USD`). Si los intervalos al 95 % de dos grupos cubren mutuamente la media puntual del otro grupo, no existe evidencia estadística para declararlos distintos.\n\nEn cambio, cuando dos intervalos de confianza al 95 % no se tocan en absoluto, la brecha supera el ruido muestral. En ese caso sabemos de inmediato que una prueba bilateral arrojará un valor $p$ menor que $0.05$.',
    },
  ],
  workedExample: {
    title: 'Auditoría de rankings de sucursales en México mediante intervalos de confianza al 95 %',
    description:
      'La dirección comercial de México quiere clasificar sus cuatro centros (`STR-MX-01`, `STR-MX-02`, `STR-MX-03` y `WH-MX-01`) según su ticket medio. Compara el ranking puntual tradicional frente a la tabla con intervalos de confianza al 95 % (media ± 1.96 * EE).',
    steps: [
      {
        label: 'Paso 1 — Enfoque ingenuo: ordenar por media puntual sin margen de error',
        explanation:
          'Al mostrar únicamente `AVG(o.total_usd)`, parece que `STR-MX-03` (`350.45 USD`) supera a `STR-MX-01` (`346.13 USD`) y que `STR-MX-02` (`495.73 USD`) aventaja claramente al centro mayorista `WH-MX-01` (`466.99 USD`).',
        code: `SELECT
  s.store_code,
  s.city,
  COUNT(o.order_id) AS n_pedidos,
  ROUND(AVG(o.total_usd), 2) AS media_puntual_usd
FROM orders AS o
INNER JOIN stores AS s ON o.store_id = s.store_id
WHERE s.country_code = 'MX'
GROUP BY s.store_code, s.city
ORDER BY media_puntual_usd DESC;`,
        expectedOutput: [
          {
            store_code: 'STR-MX-02',
            city: 'Ciudad de México',
            n_pedidos: 643,
            media_puntual_usd: 495.73,
          },
          {
            store_code: 'WH-MX-01',
            city: 'Ciudad de México',
            n_pedidos: 643,
            media_puntual_usd: 466.99,
          },
          {
            store_code: 'STR-MX-03',
            city: 'Guadalajara',
            n_pedidos: 643,
            media_puntual_usd: 350.45,
          },
          {
            store_code: 'STR-MX-01',
            city: 'Ciudad de México',
            n_pedidos: 642,
            media_puntual_usd: 346.13,
          },
        ],
      },
      {
        label: 'Paso 2 — Enfoque riguroso: añadir margen de error y cotas al 95 %',
        explanation:
          'Al incorporar el margen de error `1.96 * s / SQRT(n)`, vemos que `STR-MX-03` (`[329.50, 371.39] USD`) y `STR-MX-01` (`[325.08, 367.17] USD`) se solapan casi por completo: están en empate técnico. Incluso entre `STR-MX-02` (`[468.22, 523.25]`) y `WH-MX-01` (`[442.36, 491.61]`) existe solapamiento parcial.',
        code: `SELECT
  s.store_code,
  s.city,
  COUNT(o.order_id) AS n_pedidos,
  ROUND(AVG(o.total_usd), 2) AS media_usd,
  ROUND(1.96 * STDDEV_SAMP(o.total_usd) / SQRT(COUNT(o.order_id)), 2) AS margen_error_usd,
  ROUND(AVG(o.total_usd) - 1.96 * STDDEV_SAMP(o.total_usd) / SQRT(COUNT(o.order_id)), 2) AS ic95_inf_usd,
  ROUND(AVG(o.total_usd) + 1.96 * STDDEV_SAMP(o.total_usd) / SQRT(COUNT(o.order_id)), 2) AS ic95_sup_usd
FROM orders AS o
INNER JOIN stores AS s ON o.store_id = s.store_id
WHERE s.country_code = 'MX'
GROUP BY s.store_code, s.city
ORDER BY media_usd DESC;`,
        expectedOutput: [
          {
            store_code: 'STR-MX-02',
            city: 'Ciudad de México',
            n_pedidos: 643,
            media_usd: 495.73,
            margen_error_usd: 27.51,
            ic95_inf_usd: 468.22,
            ic95_sup_usd: 523.25,
          },
          {
            store_code: 'WH-MX-01',
            city: 'Ciudad de México',
            n_pedidos: 643,
            media_usd: 466.99,
            margen_error_usd: 24.62,
            ic95_inf_usd: 442.36,
            ic95_sup_usd: 491.61,
          },
          {
            store_code: 'STR-MX-03',
            city: 'Guadalajara',
            n_pedidos: 643,
            media_usd: 350.45,
            margen_error_usd: 20.95,
            ic95_inf_usd: 329.5,
            ic95_sup_usd: 371.39,
          },
          {
            store_code: 'STR-MX-01',
            city: 'Ciudad de México',
            n_pedidos: 642,
            media_usd: 346.13,
            margen_error_usd: 21.05,
            ic95_inf_usd: 325.08,
            ic95_sup_usd: 367.17,
          },
        ],
      },
    ],
  },
  checks: [
    {
      id: 'chk-da2-04-1',
      type: 'mcq',
      prompt:
        'El ticket promedio de la tienda `STR-CO-01` (Bogotá) tiene un intervalo de confianza al 95 % de [342.08 USD, 370.50 USD]. ¿Cuál de las siguientes interpretaciones es estadísticamente correcta?',
      options: [
        {
          id: 'a',
          text: 'El 95 % de los pedidos individuales de la tienda de Bogotá tiene un monto entre 342.08 USD y 370.50 USD',
          correct: false,
          feedback:
            'Incorrecto: ese rango acota la media poblacional de la tienda, no el monto de las compras individuales.',
        },
        {
          id: 'b',
          text: 'El intervalo [342.08 USD, 370.50 USD] fue calculado con un procedimiento que, en muestras repetidas, captura el verdadero ticket promedio poblacional el 95 % de las veces',
          correct: true,
          feedback:
            'Exacto: la confianza del 95 % es una propiedad de cobertura a largo plazo del método de estimación sobre el parámetro poblacional μ.',
        },
        {
          id: 'c',
          text: 'Si tomamos una nueva muestra mañana, hay un 95 % de probabilidad de que la nueva media muestral caiga en [342.08 USD, 370.50 USD]',
          correct: false,
          feedback:
            'Una nueva media muestral tiene su propia variabilidad adicional; la probabilidad de que caiga en un intervalo específico previo es menor al 95 %.',
        },
      ],
      explanation:
        'Un intervalo de confianza al 95 % describe el rango de valores compatibles con el parámetro poblacional μ bajo un procedimiento cuya tasa de acierto en muestreos repetidos es del 95 %.',
    },
    {
      id: 'chk-da2-04-2',
      type: 'mcq',
      prompt:
        'Si mantienes fijo el tamaño de muestra n y la desviación estándar s, ¿qué ocurre con el ancho del intervalo de confianza al pasar del 95 % (z = 1.96) al 99 % (z = 2.576)?',
      options: [
        {
          id: 'a',
          text: 'El intervalo se vuelve más ancho, porque exigir mayor certeza de capturar el parámetro obliga a ampliar el margen de error',
          correct: true,
          feedback:
            'Correcto: al subir el multiplicador crítico de 1.96 a 2.576 con el mismo error estándar, el margen de error crece cerca de un 31 %.',
        },
        {
          id: 'b',
          text: 'El intervalo se vuelve más estrecho, porque un 99 % de confianza implica mayor precisión',
          correct: false,
          feedback:
            'Confianza y estrechez operan en sentido opuesto cuando n está fijo: para estar más seguros de cubrir μ necesitamos una red más ancha.',
        },
        {
          id: 'c',
          text: 'El ancho no cambia porque el error estándar s / √n permanece constante',
          correct: false,
          feedback:
            'Aunque el error estándar no cambie, el margen de error multiplica el error estándar por el valor crítico z, que sube de 1.96 a 2.576.',
        },
      ],
      explanation:
        'Con una muestra fija, aumentar el nivel de confianza de 95 % a 99 % incrementa el valor crítico z de 1.96 a 2.576, ensanchando el intervalo resultante.',
    },
    {
      id: 'chk-da2-04-3',
      type: 'mcq',
      prompt:
        '¿Qué acción reduce directamente el margen de error de un intervalo de confianza al 95 % para la media?',
      options: [
        {
          id: 'a',
          text: 'Aumentar el tamaño de la muestra n recolectando más pedidos independientes o reducir la dispersión no explicada s',
          correct: true,
          feedback:
            'Correcto: como ME = 1.96 · (s / √n), aumentar n o reducir s disminuye el error estándar y estrecha el margen de error.',
        },
        {
          id: 'b',
          text: 'Incrementar el nivel de confianza de 95 % a 99.9 % manteniendo n constante',
          correct: false,
          feedback:
            'Subir el nivel de confianza aumenta el valor crítico z y ensancha el margen de error.',
        },
        {
          id: 'c',
          text: 'Reemplazar el error estándar s / √n por la desviación estándar muestral s',
          correct: false,
          feedback:
            'Usar s sin dividir entre √n multiplica erróneamente el ancho del intervalo por la raíz del tamaño muestral.',
        },
      ],
      explanation:
        'Como el margen de error al 95 % es ME = 1.96 · (s / √n), para reducirlo debemos incrementar el denominador √n o reducir la dispersión s.',
    },
  ],
  practice: {
    type: 'sql',
    title: 'Intervalo de confianza al 95 % del ticket medio para las tiendas 1 a 5',
    language: 'sql',
    prompt:
      'Calcula el intervalo de confianza al 95 % ($z = 1.96$) del monto `total_usd` para las tiendas con `s.store_id <= 5`. Devuelve `store_code`, `city`, `n_pedidos`, `media_usd` (redondeada a 2 decimales), `margen_error_95_usd` (`ROUND(1.96 * STDDEV_SAMP(o.total_usd) / SQRT(COUNT(o.order_id)), 2)`), `ic95_inf_usd` (`ROUND(AVG(o.total_usd) - 1.96 * STDDEV_SAMP(o.total_usd) / SQRT(COUNT(o.order_id)), 2)`) e `ic95_sup_usd` (`ROUND(AVG(o.total_usd) + 1.96 * STDDEV_SAMP(o.total_usd) / SQRT(COUNT(o.order_id)), 2)`). Ordena por `s.store_id ASC`.',
    starterCode: `SELECT
  s.store_code,
  s.city,
  COUNT(o.order_id) AS n_pedidos,
  ROUND(AVG(o.total_usd), 2) AS media_usd,
  -- Completa margen_error_95_usd, ic95_inf_usd e ic95_sup_usd:
  0.0 AS margen_error_95_usd,
  0.0 AS ic95_inf_usd,
  0.0 AS ic95_sup_usd
FROM orders AS o
INNER JOIN stores AS s ON o.store_id = s.store_id
WHERE s.store_id <= 5
GROUP BY s.store_id, s.store_code, s.city
ORDER BY s.store_id ASC;`,
    expected: `SELECT
  s.store_code,
  s.city,
  COUNT(o.order_id) AS n_pedidos,
  ROUND(AVG(o.total_usd), 2) AS media_usd,
  ROUND(1.96 * STDDEV_SAMP(o.total_usd) / SQRT(COUNT(o.order_id)), 2) AS margen_error_95_usd,
  ROUND(AVG(o.total_usd) - 1.96 * STDDEV_SAMP(o.total_usd) / SQRT(COUNT(o.order_id)), 2) AS ic95_inf_usd,
  ROUND(AVG(o.total_usd) + 1.96 * STDDEV_SAMP(o.total_usd) / SQRT(COUNT(o.order_id)), 2) AS ic95_sup_usd
FROM orders AS o
INNER JOIN stores AS s ON o.store_id = s.store_id
WHERE s.store_id <= 5
GROUP BY s.store_id, s.store_code, s.city
ORDER BY s.store_id ASC;`,
    orderMatters: true,
    hints: [
      'Usa ROUND(1.96 * STDDEV_SAMP(o.total_usd) / SQRT(COUNT(o.order_id)), 2) para margen_error_95_usd.',
      'Resta y suma 1.96 * STDDEV_SAMP(o.total_usd) / SQRT(COUNT(o.order_id)) directamente a AVG(o.total_usd) dentro de ROUND(..., 2) para ic95_inf_usd e ic95_sup_usd.',
    ],
    solution: `SELECT
  s.store_code,
  s.city,
  COUNT(o.order_id) AS n_pedidos,
  ROUND(AVG(o.total_usd), 2) AS media_usd,
  ROUND(1.96 * STDDEV_SAMP(o.total_usd) / SQRT(COUNT(o.order_id)), 2) AS margen_error_95_usd,
  ROUND(AVG(o.total_usd) - 1.96 * STDDEV_SAMP(o.total_usd) / SQRT(COUNT(o.order_id)), 2) AS ic95_inf_usd,
  ROUND(AVG(o.total_usd) + 1.96 * STDDEV_SAMP(o.total_usd) / SQRT(COUNT(o.order_id)), 2) AS ic95_sup_usd
FROM orders AS o
INNER JOIN stores AS s ON o.store_id = s.store_id
WHERE s.store_id <= 5
GROUP BY s.store_id, s.store_code, s.city
ORDER BY s.store_id ASC;`,
    solutionExplanation:
      'Las tiendas STR-MX-01, STR-MX-03, STR-CO-01 y STR-CO-02 tienen intervalos de confianza al 95 % que se solapan ampliamente alrededor de los 345–356 USD; solo STR-MX-02 ([468.22, 523.25] USD) se despega por completo del resto.',
    expectedOutputTable: [
      {
        store_code: 'STR-MX-01',
        city: 'Ciudad de México',
        n_pedidos: 642,
        media_usd: 346.13,
        margen_error_95_usd: 21.05,
        ic95_inf_usd: 325.08,
        ic95_sup_usd: 367.17,
      },
      {
        store_code: 'STR-MX-02',
        city: 'Ciudad de México',
        n_pedidos: 643,
        media_usd: 495.73,
        margen_error_95_usd: 27.51,
        ic95_inf_usd: 468.22,
        ic95_sup_usd: 523.25,
      },
      {
        store_code: 'STR-MX-03',
        city: 'Guadalajara',
        n_pedidos: 643,
        media_usd: 350.45,
        margen_error_95_usd: 20.95,
        ic95_inf_usd: 329.5,
        ic95_sup_usd: 371.39,
      },
      {
        store_code: 'STR-CO-01',
        city: 'Bogotá',
        n_pedidos: 1715,
        media_usd: 356.29,
        margen_error_95_usd: 14.21,
        ic95_inf_usd: 342.08,
        ic95_sup_usd: 370.5,
      },
      {
        store_code: 'STR-CO-02',
        city: 'Medellín',
        n_pedidos: 857,
        media_usd: 346.07,
        margen_error_95_usd: 18.65,
        ic95_inf_usd: 327.42,
        ic95_sup_usd: 364.73,
      },
    ],
  },
  roleNotes: {
    de: 'Al materializar tablas de métricas agregadas para consumo de BI, expón las columnas sum_x, stddev_samp y count_n; así las herramientas río abajo pueden calcular intervalos de confianza exactos en cualquier nivel de agregación.',
    da: 'Nunca entregues un ranking de sucursales o campañas basado solo en promedios cuando n varía entre grupos; incluye las cotas ic95_inf e ic95_sup para distinguir líderes reales de empates técnicos.',
    bi: 'Representa las comparaciones entre tiendas mediante gráficos de puntos con barras de error (forest plots) en lugar de barras sólidas; el ojo humano detecta de inmediato qué intervalos se solapan.',
  },
  summary: [
    'Un intervalo de confianza suma y resta el margen de error (z · EE) a la estimación puntual.',
    'Para 95 % de confianza en muestras grandes el multiplicador crítico normal es z = 1.96.',
    'El IC del 95 % acota dónde se encuentra el parámetro poblacional μ, nunca el 95 % de los pedidos individuales.',
    'Si los intervalos de dos sucursales cubren mutuamente sus medias puntuales, la diferencia observada es compatible con azar.',
  ],
  flashcards: [
    {
      id: 'fc-da2-04-a',
      front: '¿Cómo se construye un intervalo de confianza al 95 % para la media en muestras grandes?',
      back: 'IC_95% = x̄ ± 1.96 · (s / √n), donde x̄ es la media muestral, s la desviación estándar muestral y n el tamaño de la muestra.',
    },
    {
      id: 'fc-da2-04-b',
      front: '¿Por qué es falso decir que el IC 95 % de la media contiene al 95 % de los pedidos de una tienda?',
      back: 'Porque el IC de la media utiliza el error estándar s / √n para acotar el promedio poblacional μ, no la desviación estándar individual s.',
    },
    {
      id: 'fc-da2-04-c',
      front: '¿Cuál es el error estándar de una proporción muestral p̂ sobre n ensayos?',
      back: 'EE(p̂) = √[ p̂ · (1 - p̂) / n ].',
    },
  ],
  glossaryTerms: [
    'intervalo-de-confianza',
    'margen-de-error',
    'error-estandar',
    'teorema-limite-central',
  ],
  sources: [
    {
      title: 'NIST/SEMATECH e-Handbook — Confidence Limits for the Mean (eda352)',
      url: 'https://www.itl.nist.gov/div898/handbook/eda/section3/eda352.htm',
      publisher: 'National Institute of Standards and Technology (NIST)',
      accessed: '2026-10-29',
      supports: 'Construcción matemática de límites de confianza bilaterales para la media.',
    },
    {
      title: 'Greenland, S. et al. (2016) — Statistical tests, P values, confidence intervals, and power: a guide to misinterpretations',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5187603/',
      publisher: 'European Journal of Epidemiology (Springer / PMC)',
      accessed: '2026-10-29',
      supports: 'Catálogo de falacias frecuentes al interpretar intervalos de confianza del 95 %.',
    },
    {
      title: 'SciPy Official Reference — Statistical Functions (scipy.stats)',
      url: 'https://docs.scipy.org/doc/scipy/reference/stats.html',
      publisher: 'SciPy Developers',
      accessed: '2026-10-29',
      supports: 'Cálculo de cuantiles críticos normales y t de Student para intervalos de confianza.',
    },
  ],
  aiNotes:
    'Vigila que el estudiante no reste y sume columnas ya redondeadas (media_usd ± margen_error_95_usd), ya que el doble redondeo altera un centavo en STR-MX-02 (523.24 vs 523.25) y STR-MX-03 (371.40 vs 371.39); debe aplicar ROUND(AVG(o.total_usd) ± 1.96 * STDDEV_SAMP(o.total_usd) / SQRT(COUNT(o.order_id)), 2) directamente.',
};
