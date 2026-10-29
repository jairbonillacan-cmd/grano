export default {
  id: 'da2-inferencia-03-muestreo-tlc-error-estandar',
  moduleId: 'da2-inferencia',
  title: 'Muestreo, teorema del límite central y error estándar',
  subtitle: 'Muestreo, teorema del límite central y cálculo del error estándar',
  tracks: ['da'],
  level: 2,
  order: 3,
  minutes: 25,
  prerequisites: ['da2-inferencia-02-distribuciones-probabilidad'],
  contentVersion: 1,
  hook: 'Al comparar la tienda insignia de Buenos Aires (`STR-AR-01`, con 3 429 pedidos) frente a una tienda de Ciudad de México (`STR-MX-01`, con 642 pedidos), un analista nota que ambas sucursales tienen casi la misma desviación estándar por pedido (~299 USD y ~272 USD) y concluye que los promedios de ambas tiendas tienen idéntica incertidumbre. ¿Por qué confundir la dispersión de los pedidos individuales con la precisión del promedio distorsiona la evaluación de sucursales con distinto volumen?',
  objectives: [
    'Distinguir entre población, muestra aleatoria y sesgo de selección al extraer datos para inferencia.',
    'Explicar cómo el teorema del límite central normaliza la distribución muestral del promedio aunque los pedidos sean asimétricos.',
    'Calcular e interpretar el error estándar de la media y el error estándar relativo en SQL.',
  ],
  sections: [
    {
      id: 'muestreo-y-sesgo-seleccion',
      heading: 'Muestreo aleatorio frente a sesgo de selección',
      body: 'Hacer inferencia estadística consiste en estimar un **parámetro poblacional** desconocido a partir de un **estadístico muestral** calculado sobre $n$ observaciones registradas. Por ejemplo, usamos el promedio muestral $\\bar{x}$ para estimar el gasto medio poblacional $\\mu$. Para que esa extrapolación sea válida, el mecanismo de captura debe ser representativo.\n\nCuando una muestra excluye de forma sistemática a una parte de la población, incurrimos en **sesgo de selección**. Esto ocurre si analizamos solo clientes con cuenta registrada e ignoramos las 6 543 sesiones anónimas en `events`. También pasa cuando encuestamos únicamente a compradores satisfechos. El sesgo de selección es un defecto de diseño. Aumentar el tamaño muestral $n$ reduce el ruido aleatorio, pero jamás corrige una muestra sesgada.\n\nPor el contrario, cuando las observaciones se capturan sin sesgo sistemático, la brecha entre $\\bar{x}$ y $\\mu$ proviene solo de la variabilidad muestral. Esa incertidumbre sí puede medirse con exactitud.',
    },
    {
      id: 'tlc-y-error-estandar',
      heading: 'Teorema del límite central: de pedidos asimétricos a medias normales',
      body: 'En la lección previa comprobamos que los pedidos individuales de Mercado Brisa tienen asimetría positiva. ¿Significa eso que no podemos usar herramientas normales para comparar el promedio de una tienda? Aquí interviene el **teorema del límite central (TLC)**.\n\nEl TLC demuestra qué sucede al tomar muestras independientes de tamaño $n$ de cualquier población con varianza finita $\\sigma^2$. A medida que $n$ crece, la distribución muestral del promedio $\\bar{X}_n$ converge hacia una campana normal $\\text{Normal}(\\mu,\\; \\sigma^2 / n)$. En métricas comerciales con asimetría moderada, los promedios muestrales ya se comportan de forma gaussiana cuando $n$ supera unas cuantas decenas de pedidos.\n\nLa desviación estándar de esa distribución de promedios se denomina **error estándar de la media**. Se calcula como $EE(\\bar{x}) = \\frac{s}{\\sqrt{n}}$, donde $s$ es `STDDEV_SAMP(x)`. Mientras $s$ mide cuánto varían los tickets individuales entre sí, $EE(\\bar{x})$ mide cuánto variaría el promedio de la tienda entre muestras repetidas.',
      example: {
        language: 'sql',
        code: `SELECT
  s.store_code,
  s.city,
  COUNT(o.order_id) AS n_pedidos,
  ROUND(AVG(o.total_usd), 2) AS media_usd,
  ROUND(STDDEV_SAMP(o.total_usd), 2) AS desvio_individual_usd,
  ROUND(STDDEV_SAMP(o.total_usd) / SQRT(COUNT(o.order_id)), 2) AS error_estandar_usd
FROM orders AS o
INNER JOIN stores AS s ON o.store_id = s.store_id
WHERE s.store_id IN (1, 4, 8, 12)
GROUP BY s.store_code, s.city, s.store_id
ORDER BY n_pedidos ASC;`,
        expectedOutput: [
          {
            store_code: 'STR-MX-01',
            city: 'Ciudad de México',
            n_pedidos: 642,
            media_usd: 346.13,
            desvio_individual_usd: 272.07,
            error_estandar_usd: 10.74,
          },
          {
            store_code: 'WH-MX-01',
            city: 'Ciudad de México',
            n_pedidos: 643,
            media_usd: 466.99,
            desvio_individual_usd: 318.57,
            error_estandar_usd: 12.56,
          },
          {
            store_code: 'STR-CO-01',
            city: 'Bogotá',
            n_pedidos: 1715,
            media_usd: 356.29,
            desvio_individual_usd: 300.2,
            error_estandar_usd: 7.25,
          },
          {
            store_code: 'STR-AR-01',
            city: 'Buenos Aires',
            n_pedidos: 3429,
            media_usd: 392.99,
            desvio_individual_usd: 299,
            error_estandar_usd: 5.11,
          },
        ],
      },
    },
    {
      id: 'ley-raiz-n',
      heading: 'La ley de la raíz cuadrada de n y el error estándar relativo',
      body: 'Observa en el resultado anterior cómo `STR-CO-01` (Bogotá) y `STR-AR-01` (Buenos Aires) tienen casi la misma dispersión individual (`300.20 USD` y `299.00 USD`). Sin embargo, Buenos Aires acumula el doble de pedidos (`3 429` frente a `1 715`). Gracias a ese volumen, su error estándar baja de `7.25 USD` a `5.11 USD`.\n\nDebido al denominador $\\sqrt{n}$, la precisión muestral obedece una ley de rendimientos decrecientes. Para reducir el error estándar a la mitad no basta con duplicar los datos. Necesitamos multiplicar el tamaño muestral por **cuatro** ($\\sqrt{4} = 2$). Para reducirlo a la décima parte, requerimos **cien veces** más observaciones.\n\nAl comparar países o formatos de tienda con distinto ticket medio, conviene añadir el **error estándar relativo** ($100 \\cdot EE(\\bar{x}) / \\bar{x}$). Esta métrica expresa el ruido muestral como porcentaje del promedio estimado.',
    },
  ],
  workedExample: {
    title: 'Dispersión individual (s) vs. precisión del promedio (EE) por formato de tienda',
    description:
      'Operaciones quiere saber qué tan estable es el ticket promedio estimado en los tres formatos de tienda de Mercado Brisa (`retail`, `flagship`, `warehouse`). Compara una tabla que solo reporta la desviación estándar muestral individual frente al cálculo completo con el error estándar de la media.',
    steps: [
      {
        label: 'Paso 1 — Análisis incompleto: mirar solo la desviación estándar de pedidos individuales',
        explanation:
          'Si solo calculamos `STDDEV_SAMP(o.total_usd)`, vemos valores entre `300.81 USD` y `331.49 USD`. Un lector no entrenado podría pensar que el promedio de cada formato tiene una incertidumbre de más de 300 dólares, ignorando que estamos promediando miles de órdenes.',
        code: `SELECT
  s.store_type,
  COUNT(o.order_id) AS n_pedidos,
  ROUND(AVG(o.total_usd), 2) AS media_usd,
  ROUND(STDDEV_SAMP(o.total_usd), 2) AS desvio_muestral_usd
FROM orders AS o
INNER JOIN stores AS s ON o.store_id = s.store_id
GROUP BY s.store_type
ORDER BY n_pedidos DESC;`,
        expectedOutput: [
          {
            store_type: 'retail',
            n_pedidos: 10286,
            media_usd: 414.24,
            desvio_muestral_usd: 316.17,
          },
          {
            store_type: 'flagship',
            n_pedidos: 4500,
            media_usd: 375.53,
            desvio_muestral_usd: 300.81,
          },
          {
            store_type: 'warehouse',
            n_pedidos: 3214,
            media_usd: 534.87,
            desvio_muestral_usd: 331.49,
          },
        ],
      },
      {
        label: 'Paso 2 — Cálculo correcto: dividir entre SQRT(n) para obtener el error estándar',
        explanation:
          'Al incorporar `STDDEV_SAMP(o.total_usd) / SQRT(COUNT(o.order_id))`, comprobamos que el promedio del formato `retail` (`n = 10 286`) tiene un error estándar de apenas `3.12 USD`, mientras que `warehouse` (`n = 3 214`) tiene `5.85 USD` por contar con menos pedidos y mayor dispersión.',
        code: `SELECT
  s.store_type,
  COUNT(o.order_id) AS n_pedidos,
  ROUND(AVG(o.total_usd), 2) AS media_usd,
  ROUND(STDDEV_SAMP(o.total_usd), 2) AS desvio_muestral_usd,
  ROUND(STDDEV_SAMP(o.total_usd) / SQRT(COUNT(o.order_id)), 2) AS error_estandar_usd
FROM orders AS o
INNER JOIN stores AS s ON o.store_id = s.store_id
GROUP BY s.store_type
ORDER BY n_pedidos DESC;`,
        expectedOutput: [
          {
            store_type: 'retail',
            n_pedidos: 10286,
            media_usd: 414.24,
            desvio_muestral_usd: 316.17,
            error_estandar_usd: 3.12,
          },
          {
            store_type: 'flagship',
            n_pedidos: 4500,
            media_usd: 375.53,
            desvio_muestral_usd: 300.81,
            error_estandar_usd: 4.48,
          },
          {
            store_type: 'warehouse',
            n_pedidos: 3214,
            media_usd: 534.87,
            desvio_muestral_usd: 331.49,
            error_estandar_usd: 5.85,
          },
        ],
      },
    ],
  },
  checks: [
    {
      id: 'chk-da2-03-1',
      type: 'mcq',
      prompt:
        'Una sucursal registra n = 400 pedidos con desviación estándar s = 280 USD, dando un error estándar de 14 USD. Si la gerencia quiere reducir ese error estándar a 7 USD manteniendo la misma dispersión s, ¿cuántos pedidos necesita acumular?',
      options: [
        {
          id: 'a',
          text: '800 pedidos (el doble de la muestra actual)',
          correct: false,
          feedback:
            'Con 800 pedidos el denominador √n solo crece por un factor de √2 ≈ 1.41, dejando el error estándar en ~9.90 USD.',
        },
        {
          id: 'b',
          text: '1 600 pedidos (cuatro veces la muestra actual)',
          correct: true,
          feedback:
            'Exacto: como EE = s / √n, para dividir el error estándar entre 2 es necesario multiplicar n por 2² = 4 (280 / √1600 = 280 / 40 = 7 USD).',
        },
        {
          id: 'c',
          text: '200 pedidos (la mitad de la muestra actual)',
          correct: false,
          feedback:
            'Reducir el tamaño de muestra incrementa el error estándar en lugar de disminuirlo.',
        },
      ],
      explanation:
        'El error estándar es inversamente proporcional a la raíz cuadrada de n. Para reducir EE de 14 USD a 7 USD (factor 2), el tamaño muestral debe pasar de 400 a 400 × 4 = 1 600 pedidos.',
    },
    {
      id: 'chk-da2-03-2',
      type: 'mcq',
      prompt:
        '¿Qué garantiza el teorema del límite central (TLC) cuando analizamos el monto de compra `total_usd` en una tienda con 1 500 pedidos?',
      options: [
        {
          id: 'a',
          text: 'Que los 1 500 pedidos individuales dejan de ser asimétricos y pasan a distribuirse como una campana normal',
          correct: false,
          feedback:
            'El TLC no modifica la forma de la población original: los pedidos individuales siguen siendo asimétricos (log-normales) por grande que sea n.',
        },
        {
          id: 'b',
          text: 'Que la distribución muestral del promedio x̄ de esos 1 500 pedidos se aproxima a una distribución normal centrada en μ con desviación estándar σ / √n',
          correct: true,
          feedback:
            'Correcto: el TLC se aplica a la distribución del estadístico promedio x̄ a través de muestras repetidas, no a las observaciones individuales.',
        },
        {
          id: 'c',
          text: 'Que cualquier sesgo de selección en la captura de los 1 500 pedidos desaparece automáticamente al superar n = 30',
          correct: false,
          feedback:
            'El TLC requiere muestras independientes de la población objetivo; no corrige muestras sesgadas.',
        },
      ],
      explanation:
        'El teorema del límite central describe el comportamiento del promedio muestral x̄ (su distribución muestral converge a la normal), mientras que los datos individuales conservan su asimetría original.',
    },
    {
      id: 'chk-da2-03-3',
      type: 'mcq',
      prompt:
        '¿Qué ocurre con la desviación estándar muestral (s) y con el error estándar de la media (EE) cuando el tamaño de muestra aumenta de 500 a 5 000 pedidos?',
      options: [
        {
          id: 'a',
          text: 'La desviación estándar s se estabiliza alrededor de σ, mientras que el error estándar EE = s / √n disminuye hacia cero',
          correct: true,
          feedback:
            'Correcto: s estima la dispersión fija de la población (σ), mientras que EE se encoge conforme sumamos observaciones.',
        },
        {
          id: 'b',
          text: 'Tanto la desviación estándar s como el error estándar EE se reducen a la décima parte',
          correct: false,
          feedback:
            'Aumentar la muestra no hace que los clientes compren montos más parecidos entre sí (s no tiende a cero).',
        },
        {
          id: 'c',
          text: 'En SQL, el error estándar se calcula dividiendo STDDEV_SAMP(x) entre COUNT(x) sin raíz cuadrada',
          correct: false,
          feedback:
            'La varianza de la media se divide entre n, pero el error estándar se divide entre SQRT(COUNT(x)).',
        },
      ],
      explanation:
        'La desviación estándar s converge al parámetro poblacional σ sin encogerse con n, mientras que el error estándar EE = s / √n disminuye con la raíz cuadrada del tamaño muestral.',
    },
  ],
  practice: {
    type: 'sql',
    title: 'Error estándar y error estándar relativo del ticket por país',
    language: 'sql',
    prompt:
      'Une `orders` con `stores` para analizar todos los pedidos por país (`s.country_code`). Calcula: el número de pedidos (`n_pedidos`), el ticket promedio redondeado a 2 decimales (`media_usd`), la desviación estándar muestral individual redondeada a 2 decimales (`desvio_individual_usd`), el error estándar de la media redondeado a 2 decimales (`error_estandar_usd`) y el error estándar relativo como porcentaje de la media sin redondear previamente (`ROUND(100.0 * (STDDEV_SAMP(o.total_usd) / SQRT(COUNT(o.order_id))) / AVG(o.total_usd), 2)`) bajo el alias `ee_relativo_pct`. Ordena por `error_estandar_usd ASC, s.country_code ASC`.',
    starterCode: `SELECT
  s.country_code,
  COUNT(o.order_id) AS n_pedidos,
  ROUND(AVG(o.total_usd), 2) AS media_usd,
  ROUND(STDDEV_SAMP(o.total_usd), 2) AS desvio_individual_usd,
  -- Calcula error_estandar_usd y ee_relativo_pct redondeados a 2 decimales:
  0.0 AS error_estandar_usd,
  0.0 AS ee_relativo_pct
FROM orders AS o
INNER JOIN stores AS s ON o.store_id = s.store_id
GROUP BY s.country_code
ORDER BY error_estandar_usd ASC, s.country_code ASC;`,
    expected: `SELECT
  s.country_code,
  COUNT(o.order_id) AS n_pedidos,
  ROUND(AVG(o.total_usd), 2) AS media_usd,
  ROUND(STDDEV_SAMP(o.total_usd), 2) AS desvio_individual_usd,
  ROUND(STDDEV_SAMP(o.total_usd) / SQRT(COUNT(o.order_id)), 2) AS error_estandar_usd,
  ROUND(
    100.0 * (STDDEV_SAMP(o.total_usd) / SQRT(COUNT(o.order_id))) / AVG(o.total_usd),
    2
  ) AS ee_relativo_pct
FROM orders AS o
INNER JOIN stores AS s ON o.store_id = s.store_id
GROUP BY s.country_code
ORDER BY error_estandar_usd ASC, s.country_code ASC;`,
    orderMatters: true,
    hints: [
      'El error estándar de la media es STDDEV_SAMP(o.total_usd) / SQRT(COUNT(o.order_id)).',
      'Para ee_relativo_pct multiplica por 100.0 el error estándar y divídelo entre AVG(o.total_usd) antes de aplicar ROUND(..., 2).',
    ],
    solution: `SELECT
  s.country_code,
  COUNT(o.order_id) AS n_pedidos,
  ROUND(AVG(o.total_usd), 2) AS media_usd,
  ROUND(STDDEV_SAMP(o.total_usd), 2) AS desvio_individual_usd,
  ROUND(STDDEV_SAMP(o.total_usd) / SQRT(COUNT(o.order_id)), 2) AS error_estandar_usd,
  ROUND(
    100.0 * (STDDEV_SAMP(o.total_usd) / SQRT(COUNT(o.order_id))) / AVG(o.total_usd),
    2
  ) AS ee_relativo_pct
FROM orders AS o
INNER JOIN stores AS s ON o.store_id = s.store_id
GROUP BY s.country_code
ORDER BY error_estandar_usd ASC, s.country_code ASC;`,
    solutionExplanation:
      'Los tres países con mayor volumen muestral (AR, CO y ES, con ~3 429 pedidos cada uno) logran los errores estándar absolutos más bajos (5.11 a 5.72 USD), mientras que MX, PE y CL (~2 571 pedidos) presentan errores estándar entre 6.18 y 6.54 USD. En términos relativos, España logra el menor error relativo (1.19 %) por combinar muestra alta con mayor ticket medio (481.72 USD).',
    expectedOutputTable: [
      {
        country_code: 'AR',
        n_pedidos: 3429,
        media_usd: 392.99,
        desvio_individual_usd: 299,
        error_estandar_usd: 5.11,
        ee_relativo_pct: 1.3,
      },
      {
        country_code: 'CO',
        n_pedidos: 3429,
        media_usd: 396.83,
        desvio_individual_usd: 311.55,
        error_estandar_usd: 5.32,
        ee_relativo_pct: 1.34,
      },
      {
        country_code: 'ES',
        n_pedidos: 3428,
        media_usd: 481.72,
        desvio_individual_usd: 334.92,
        error_estandar_usd: 5.72,
        ee_relativo_pct: 1.19,
      },
      {
        country_code: 'MX',
        n_pedidos: 2571,
        media_usd: 414.85,
        desvio_individual_usd: 313.6,
        error_estandar_usd: 6.18,
        ee_relativo_pct: 1.49,
      },
      {
        country_code: 'PE',
        n_pedidos: 2571,
        media_usd: 417.8,
        desvio_individual_usd: 318.06,
        error_estandar_usd: 6.27,
        ee_relativo_pct: 1.5,
      },
      {
        country_code: 'CL',
        n_pedidos: 2572,
        media_usd: 454.67,
        desvio_individual_usd: 331.79,
        error_estandar_usd: 6.54,
        ee_relativo_pct: 1.44,
      },
    ],
  },
  roleNotes: {
    de: 'Cuando implementes muestreo en pipelines analíticos pesados, utiliza muestreo determinístico por hash de entidad (como hash(customer_id) % 100 < 10) en lugar de LIMIT arbitrarios para preservar la representatividad sin sesgo de ordenamiento.',
    da: 'Reporta siempre el tamaño de muestra n y el error estándar junto a cada promedio de grupo en tus análisis; eso evita que los equipos operativos sobreinterpreten fluctuaciones azarosas en sucursales o segmentos con poco volumen de pedidos.',
    bi: 'En tablas ejecutivas por sucursal o región, añade una alerta visual o atenúa las filas cuyo error estándar relativo supere el 5 %, indicando que la muestra acumulada aún es pequeña.',
  },
  summary: [
    'El sesgo de selección distorsiona la muestra de origen y no se corrige aumentando el número de filas n.',
    'El teorema del límite central garantiza que la media muestral se distribuye normalmente cuando n es grande.',
    'La desviación estándar s mide la dispersión de datos individuales; el error estándar s / √n mide la incertidumbre de la media.',
    'Para reducir el error estándar a la mitad es necesario multiplicar por cuatro el tamaño de la muestra.',
  ],
  flashcards: [
    {
      id: 'fc-da2-03-a',
      front: '¿Cuál es la fórmula del error estándar de la media muestral y qué mide?',
      back: 'EE(x̄) = s / √n. Mide la desviación estándar de la distribución muestral del promedio, es decir, cuánto fluctuaría x̄ entre muestras repetidas de tamaño n.',
    },
    {
      id: 'fc-da2-03-b',
      front: '¿Por qué necesitamos cuadruplicar la muestra para reducir el error estándar a la mitad?',
      back: 'Porque el tamaño muestral n actúa dentro de una raíz cuadrada en el denominador (√(4n) = 2√n).',
    },
    {
      id: 'fc-da2-03-c',
      front: '¿El teorema del límite central vuelve normales los pedidos individuales de una tienda?',
      back: 'No. Los pedidos individuales conservan su distribución original (por ejemplo, log-normal); lo que se vuelve normal es la distribución del promedio muestral x̄.',
    },
  ],
  glossaryTerms: [
    'teorema-limite-central',
    'error-estandar',
    'distribucion-log-normal',
  ],
  sources: [
    {
      title: 'NIST/SEMATECH e-Handbook — Central Limit Theorem (prc14)',
      url: 'https://www.itl.nist.gov/div898/handbook/prc/section1/prc14.htm',
      publisher: 'National Institute of Standards and Technology (NIST)',
      accessed: '2026-10-29',
      supports: 'Demostración y condiciones del teorema del límite central para medias muestrales.',
    },
    {
      title: 'NIST/SEMATECH e-Handbook — Confidence Limits for the Mean (eda352)',
      url: 'https://www.itl.nist.gov/div898/handbook/eda/section3/eda352.htm',
      publisher: 'National Institute of Standards and Technology (NIST)',
      accessed: '2026-10-29',
      supports: 'Definición del error estándar de la media s / √n frente a la desviación estándar muestral.',
    },
    {
      title: 'DuckDB Documentation — Statistical Aggregate Functions (STDDEV_SAMP)',
      url: 'https://duckdb.org/docs/sql/functions/aggregates',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Cálculo exacto de STDDEV_SAMP con corrección de Bessel (n - 1) en SQL.',
    },
  ],
  aiNotes:
    'Los errores más frecuentes en la práctica SQL son usar STDDEV_POP en lugar de STDDEV_SAMP, dividir entre COUNT(o.order_id) sin aplicar SQRT(...), o calcular ee_relativo_pct usando las columnas ya redondeadas en vez de las expresiones exactas. Orienta al estudiante a revisar la raíz cuadrada en el denominador.',
};
