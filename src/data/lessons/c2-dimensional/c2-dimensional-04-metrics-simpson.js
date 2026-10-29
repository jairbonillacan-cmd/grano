export const lesson = {
  id: 'c2-dimensional-04-metrics-simpson',
  legacyId: 'l6-metrics-simpson',
  legacyOrder: 6,
  moduleId: 'c2-dimensional',
  tracks: ['core', 'de', 'da', 'bi'],
  level: 2,
  order: 4,
  title: 'Aditividad de métricas y paradoja de Simpson',
  subtitle:
    'Hechos aditivos, semiaditivos y no aditivos, árboles de KPIs y descomposición de Kitagawa-Oaxaca',
  minutes: 30,
  prerequisites: ['c2-dimensional-03-scd2-history'],
  contentVersion: 2,
  hook: 'El equipo de crecimiento de Mercado Brisa calculó el costo por adquisición (`CPA`) promediando el ratio diario `AVG(spend_usd / attributed_conversions)` en `marketing_spend` y reportó `$14.37` para `referral` cuando el costo real ponderado era `$13.59`. En paralelo, el ticket medio global en `desktop` (`$453.26`) superó en `$62.19` al de `mobile` (`$391.07`), pero parte de esa brecha provenía de que las cafeterías B2B compran más en escritorio. ¿Cómo evitar errores de agregación en métricas no aditivas y separar cambios de tasa de efectos de mezcla?',
  objectives: [
    'Clasificar hechos en aditivos, semiaditivos y no aditivos determinando su regla algebraica de agregación en SQL.',
    'Diseñar árboles de KPIs con métricas de guarda (Guardrails) y calcular razones ponderadas mediante `SUM(numerador) / NULLIF(SUM(denominador), 0)`.',
    'Diagnosticar la paradoja de Simpson y aplicar la descomposición de Kitagawa-Oaxaca para separar el efecto tasa del efecto composición.',
  ],
  sections: [
    {
      id: 'sec-aditividad-arboles-kpi',
      heading: 'Hechos aditivos, semiaditivos, no aditivos y árboles de KPIs',
      body: 'No todas las columnas numéricas de una tabla de hechos admiten `SUM()` a través de cualquier dimensión. Ralph Kimball clasifica las medidas en tres categorías algebraicas. Los **hechos aditivos** —como `spend_usd`, `clicks`, `total_usd` o `qty`— se suman libremente a través de todas las dimensiones.\n\nLos **hechos semiaditivos** —como saldos bancarios o niveles de inventario— se suman entre tiendas o productos en una fecha fija, pero nunca a través del tiempo. Sumar el saldo de enero, febrero y marzo triplica artificialmente el capital. Los **hechos no aditivos** incluyen todas las razones, porcentajes (`CTR`, `CVR`, `CPA`, `AOV`) y conteos distintos (`COUNT(DISTINCT customer_id)`).\n\nPromediar un ratio diario (`AVG(spend_usd / attributed_conversions)`) asigna el mismo peso a un día con `2` conversiones que a un día con `500`. Eso infla el `CPA` de `referral` de `$13.59` a `$14.37`. Tampoco podemos sumar los clientes únicos de `desktop` (`1,284`), `mobile` (`1,312`) y `pos_tienda` (`656`). Esa suma da `3,252`, superando los `2,292` clientes reales. En un **árbol de KPIs**, toda métrica principal se descompone en medidas aditivas base y se protege con **métricas de guarda** (*guardrails*).',
      example: {
        language: 'sql',
        code: `SELECT
  channel,
  COUNT(*) AS rows_count,
  ROUND(SUM(spend_usd), 2) AS total_spend_usd,
  SUM(attributed_conversions) AS total_conversions,
  ROUND(AVG(spend_usd / NULLIF(attributed_conversions, 0)), 2) AS wrong_avg_of_cpa,
  ROUND(SUM(spend_usd) / NULLIF(SUM(attributed_conversions), 0), 2) AS true_weighted_cpa
FROM marketing_spend
GROUP BY channel
ORDER BY true_weighted_cpa ASC;`,
        expectedOutput: [
          {
            channel: 'referral',
            rows_count: 146,
            total_spend_usd: 22306.35,
            total_conversions: 1641,
            wrong_avg_of_cpa: 14.37,
            true_weighted_cpa: 13.59,
          },
          {
            channel: 'organic_search',
            rows_count: 146,
            total_spend_usd: 26703.45,
            total_conversions: 1925,
            wrong_avg_of_cpa: 14.71,
            true_weighted_cpa: 13.87,
          },
          {
            channel: 'email_campaign',
            rows_count: 146,
            total_spend_usd: 14102.07,
            total_conversions: 1013,
            wrong_avg_of_cpa: 14.69,
            true_weighted_cpa: 13.92,
          },
          {
            channel: 'paid_social',
            rows_count: 146,
            total_spend_usd: 63080.29,
            total_conversions: 4530,
            wrong_avg_of_cpa: 14.42,
            true_weighted_cpa: 13.93,
          },
          {
            channel: 'display_video',
            rows_count: 146,
            total_spend_usd: 46759.04,
            total_conversions: 3355,
            wrong_avg_of_cpa: 14.7,
            true_weighted_cpa: 13.94,
          },
        ],
      },
    },
    {
      id: 'sec-paradoja-simpson-kitagawa',
      heading: 'Paradoja de Simpson y descomposición de Kitagawa-Oaxaca',
      body: 'Incluso cuando calculamos una razón como `SUM(numerador) / SUM(denominador)`, el resultado global puede distorsionarse al agregar subgrupos. La **paradoja de Simpson** ocurre cuando una tendencia presente en varios estratos desaparece o se invierte al consolidar los datos. La causa es omitir una **variable de confusión** como el segmento de cliente o la región.\n\nEsto sucede porque la media global de un canal es una suma ponderada por su **mezcla de volumen** (*mix*). Si un canal concentra más tráfico en un segmento económico, su ticket medio global caerá. Ese efecto ocurre aunque el canal venda más caro dentro de cada segmento individual.\n\nPara separar el desempeño intrínseco del cambio en los pesos de volumen, aplicamos la **descomposición de Kitagawa-Oaxaca**. Dados dos grupos $A$ y $B$ estratificados por subgrupos $i$ con tasas $r_i$ y pesos $w_i$, la diferencia global $\\Delta R = R_A - R_B$ se divide en dos sumandos exactos. El **efecto tasa** es $\\sum (r_{A,i} - r_{B,i}) \\frac{w_{A,i} + w_{B,i}}{2}$ y el **efecto mezcla** es $\\sum (w_{A,i} - w_{B,i}) \\frac{r_{A,i} + r_{B,i}}{2}$.',
      interactive: {
        component: 'simpsons-paradox-explorer',
        caption:
          'Ajusta la mezcla de tráfico entre segmentos y observa en tiempo real cómo se invierte la tasa agregada global y cómo se reparte la diferencia entre efecto tasa y efecto composición.',
      },
      example: {
        language: 'sql',
        code: `WITH by_device AS (
  SELECT
    device_type,
    COUNT(DISTINCT customer_id) AS unique_customers,
    COUNT(order_id) AS completed_orders,
    ROUND(SUM(total_usd), 2) AS revenue_usd
  FROM orders
  WHERE status = 'completed'
  GROUP BY device_type
)
SELECT
  device_type,
  unique_customers,
  (SELECT SUM(unique_customers) FROM by_device) AS sum_of_device_distincts,
  (SELECT COUNT(DISTINCT customer_id) FROM orders WHERE status = 'completed') AS true_global_distinct_customers
FROM by_device
ORDER BY completed_orders DESC;`,
        expectedOutput: [
          {
            device_type: 'desktop',
            unique_customers: 1284,
            sum_of_device_distincts: 3252,
            true_global_distinct_customers: 2292,
          },
          {
            device_type: 'mobile',
            unique_customers: 1312,
            sum_of_device_distincts: 3252,
            true_global_distinct_customers: 2292,
          },
          {
            device_type: 'pos_tienda',
            unique_customers: 656,
            sum_of_device_distincts: 3252,
            true_global_distinct_customers: 2292,
          },
        ],
      },
    },
  ],
  workedExample: {
    title: 'Descomposición de Kitagawa-Oaxaca del ticket medio (AOV) entre Desktop y Mobile',
    description:
      'En las órdenes completadas de Mercado Brisa, el ticket medio (`AOV`) en `desktop` es `$453.26` frente a `$391.07` en `mobile` (una brecha global de `+$62.19`). Descompondremos esta diferencia por segmento de cliente (`customers.segment`: `cafeteria_b2b`, `pro_barista`, `retail`) para separar cuánto se debe a un mayor gasto real por pedido (`+$54.81`) y cuánto al peso del segmento B2B (`+$7.38`).',
    steps: [
      {
        label: 'Paso 1: Calcular el ticket medio global por dispositivo',
        explanation:
          'Calculamos el ticket medio global ponderado (`SUM(total_usd) / COUNT(order_id)`) para `desktop` y `mobile` sobre órdenes completadas.',
        code: `SELECT
  o.device_type,
  COUNT(o.order_id) AS completed_orders,
  ROUND(SUM(o.total_usd), 2) AS total_revenue_usd,
  ROUND(SUM(o.total_usd) / COUNT(o.order_id), 2) AS aov_usd
FROM orders o
WHERE o.status = 'completed'
  AND o.device_type IN ('desktop', 'mobile')
GROUP BY o.device_type
ORDER BY o.device_type ASC;`,
        expectedOutput: [
          {
            device_type: 'desktop',
            completed_orders: 6327,
            total_revenue_usd: 2867799,
            aov_usd: 453.26,
          },
          {
            device_type: 'mobile',
            completed_orders: 5624,
            total_revenue_usd: 2199394.23,
            aov_usd: 391.07,
          },
        ],
      },
      {
        label: 'Paso 2: Estratificar por segmento de cliente',
        explanation:
          'Estratificamos las órdenes y el ticket medio de ambos dispositivos cruzando con la dimensión `customers` por `segment`.',
        code: `SELECT
  c.segment,
  COUNT(o.order_id) FILTER (WHERE o.device_type = 'desktop') AS desk_orders,
  COUNT(o.order_id) FILTER (WHERE o.device_type = 'mobile') AS mob_orders,
  ROUND(AVG(o.total_usd) FILTER (WHERE o.device_type = 'desktop'), 2) AS desk_aov_usd,
  ROUND(AVG(o.total_usd) FILTER (WHERE o.device_type = 'mobile'), 2) AS mob_aov_usd
FROM orders o
INNER JOIN customers c ON o.customer_id = c.customer_id
WHERE o.status = 'completed'
  AND o.device_type IN ('desktop', 'mobile')
GROUP BY c.segment
ORDER BY c.segment ASC;`,
        expectedOutput: [
          {
            segment: 'cafeteria_b2b',
            desk_orders: 1328,
            mob_orders: 859,
            desk_aov_usd: 558.37,
            mob_aov_usd: 488.03,
          },
          {
            segment: 'pro_barista',
            desk_orders: 2502,
            mob_orders: 2494,
            desk_aov_usd: 409.72,
            mob_aov_usd: 373.13,
          },
          {
            segment: 'retail',
            desk_orders: 2497,
            mob_orders: 2271,
            desk_aov_usd: 440.99,
            mob_aov_usd: 374.1,
          },
        ],
      },
      {
        label: 'Paso 3: Separar efecto tasa y efecto mezcla (Kitagawa)',
        explanation:
          'Calculamos los pesos de mezcla (`w_desk`, `w_mob`) con funciones de ventana y descomponemos la brecha en `rate_effect_usd` (`+$54.81` total) y `mix_effect_usd` (`+$7.38` total) por segmento.',
        code: `WITH strat AS (
  SELECT
    c.segment,
    COUNT(o.order_id) FILTER (WHERE o.device_type = 'desktop') AS n_desk,
    COUNT(o.order_id) FILTER (WHERE o.device_type = 'mobile') AS n_mob,
    AVG(o.total_usd) FILTER (WHERE o.device_type = 'desktop') AS aov_desk,
    AVG(o.total_usd) FILTER (WHERE o.device_type = 'mobile') AS aov_mob
  FROM orders o
  INNER JOIN customers c ON o.customer_id = c.customer_id
  WHERE o.status = 'completed'
    AND o.device_type IN ('desktop', 'mobile')
  GROUP BY c.segment
),
weights AS (
  SELECT
    segment,
    n_desk * 1.0 / SUM(n_desk) OVER () AS w_desk,
    n_mob * 1.0 / SUM(n_mob) OVER () AS w_mob,
    aov_desk,
    aov_mob
  FROM strat
)
SELECT
  segment,
  ROUND(w_desk * 100, 2) AS mix_desk_pct,
  ROUND(w_mob * 100, 2) AS mix_mob_pct,
  ROUND((aov_desk - aov_mob) * ((w_desk + w_mob) / 2.0), 4) AS rate_effect_usd,
  ROUND((w_desk - w_mob) * ((aov_desk + aov_mob) / 2.0), 4) AS mix_effect_usd
FROM weights
ORDER BY segment ASC;`,
        expectedOutput: [
          {
            segment: 'cafeteria_b2b',
            mix_desk_pct: 20.99,
            mix_mob_pct: 15.27,
            rate_effect_usd: 12.7545,
            mix_effect_usd: 29.9039,
          },
          {
            segment: 'pro_barista',
            mix_desk_pct: 39.54,
            mix_mob_pct: 44.35,
            rate_effect_usd: 15.3492,
            mix_effect_usd: -18.7918,
          },
          {
            segment: 'retail',
            mix_desk_pct: 39.47,
            mix_mob_pct: 40.38,
            rate_effect_usd: 26.7028,
            mix_effect_usd: -3.728,
          },
        ],
      },
    ],
  },
  checks: [
    {
      type: 'mcq',
      id: 'chk-l6-q1',
      prompt:
        '¿Por qué el conteo de clientes únicos (`COUNT(DISTINCT customer_id)`) se clasifica como una métrica no aditiva al agrupar por mes o por categoría de producto?',
      options: [
        {
          id: 'a',
          text: 'Porque la función COUNT(DISTINCT) devuelve valores de punto flotante que pierden precisión al sumarse.',
          correct: false,
          feedback:
            'Incorrecto. `COUNT(DISTINCT)` devuelve un entero exacto; el problema es la intersección de conjuntos entre grupos.',
        },
        {
          id: 'b',
          text: 'Porque un mismo cliente puede comprar en varios meses o categorías, por lo que sumar los conteos parciales cuenta múltiples veces a los clientes recurrentes.',
          correct: true,
          feedback:
            'Correcto. La cardinalidad de la unión de conjuntos no es igual a la suma de sus cardinalidades salvo que los conjuntos sean mutuamente excluyentes.',
        },
        {
          id: 'c',
          text: 'Porque DuckDB prohíbe ejecutar SUM sobre una subconsulta que contenga COUNT(DISTINCT).',
          correct: false,
          feedback:
            'Incorrecto. SQL permite escribir la suma sintácticamente, pero el número resultante carece de validez estadística.',
        },
      ],
      explanation:
        'Por teoría de conjuntos, $|A \\cup B| = |A| + |B| - |A \\cap B|$. Sumar `COUNT(DISTINCT customer_id)` de varios meses o dispositivos omite restar la intersección de clientes compartidos.',
    },
    {
      type: 'mcq',
      id: 'chk-l6-q2',
      prompt:
        'En un análisis Kitagawa-Oaxaca entre dos periodos, el efecto tasa total es `-1.5` puntos porcentuales y el efecto mezcla es `+2.3` puntos porcentuales (cambio global `+0.8` puntos). ¿Qué diagnóstico debes entregar a negocio?',
      options: [
        {
          id: 'a',
          text: 'El rendimiento operativo mejoró en todos los segmentos y no requiere intervención.',
          correct: false,
          feedback:
            'Incorrecto. El efecto tasa negativo (`-1.5` pts) demuestra que la conversión intrínseca empeoró dentro de los segmentos.',
        },
        {
          id: 'b',
          text: 'La métrica global subió `+0.8` puntos solo porque el volumen se desplazó hacia segmentos de mayor conversión base (`+2.3` pts), ocultando una caída real de `-1.5` puntos en las tasas internas.',
          correct: true,
          feedback:
            'Correcto. El efecto composición positivo enmascara el deterioro operativo real capturado por el efecto tasa negativo.',
        },
        {
          id: 'c',
          text: 'Hubo un error de redondeo en SQL porque ambos efectos deben tener siempre el mismo signo.',
          correct: false,
          feedback:
            'Incorrecto. Precisamente la paradoja de Simpson ocurre cuando el efecto mezcla y el efecto tasa tienen signos opuestos y prevalece el peso de la mezcla.',
        },
      ],
      explanation:
        'Cuando el efecto mezcla positivo supera en magnitud a un efecto tasa negativo, el indicador global aparenta mejorar aunque los subgrupos estén empeorando individualmente.',
    },
    {
      type: 'predict-output',
      id: 'chk-l6-q3',
      prompt:
        'Una campaña tuvo el lunes `100` clics y `10` conversiones (`CVR = 10%`), y el martes `900` clics y `18` conversiones (`CVR = 2%`). ¿Qué devuelven respectivamente `AVG(conversions * 100.0 / clicks)` y `SUM(conversions) * 100.0 / SUM(clicks)`?',
      options: [
        {
          id: 'a',
          text: '6.0% (promedio simple no ponderado) y 2.8% (tasa de conversión real ponderada: 28 / 1000).',
          correct: true,
          feedback:
            'Correcto. `(10% + 2%) / 2 = 6.0%`, mientras que el total real de conversiones (`10 + 18 = 28`) dividido entre el total de clics (`100 + 900 = 1000`) es `2.8%`.',
        },
        {
          id: 'b',
          text: '2.8% en ambas expresiones porque la división es distributiva respecto al promedio.',
          correct: false,
          feedback:
            'Incorrecto. La media de razones no es igual a la razón de las sumas cuando los denominadores (`100` vs `900`) difieren.',
        },
        {
          id: 'c',
          text: '12.0% y 6.0%.',
          correct: false,
          feedback:
            'Incorrecto. `AVG` promedia `10%` y `2%` dando `6.0%`, y el cociente de sumas calcula `28 / 1000 = 2.8%`.',
        },
      ],
      explanation:
        'Promediar `10%` y `2%` ignora que el martes concentró el `90%` del tráfico (`900` de `1,000` clics). Solo `SUM(conversions) * 100.0 / SUM(clicks)` pondera cada día por su volumen real (`2.8%`).',
    },
  ],
  practice: {
    type: 'sql',
    title: 'Agregación ponderada de razones no aditivas (CTR, CVR y CPA) por canal',
    prompt:
      'Calcula por cada `channel` en `marketing_spend`: 1) `total_spend_usd` (`ROUND(SUM(spend_usd), 2)`), 2) `ctr_pct` (`ROUND(100.0 * SUM(clicks) / NULLIF(SUM(impressions), 0), 2)`), 3) `cvr_pct` (`ROUND(100.0 * SUM(attributed_conversions) / NULLIF(SUM(clicks), 0), 2)`), y 4) `cpa_usd` (`ROUND(SUM(spend_usd) / NULLIF(SUM(attributed_conversions), 0), 2)`). Ordena por `cpa_usd ASC`.',
    starterCode: `-- Reemplaza los promedios de ratios (AVG) por razones de sumas aditivas (SUM / NULLIF(SUM, 0))
SELECT
  channel,
  ROUND(SUM(spend_usd), 2) AS total_spend_usd,
  ROUND(100.0 * AVG(clicks * 1.0 / NULLIF(impressions, 0)), 2) AS ctr_pct,
  ROUND(100.0 * AVG(attributed_conversions * 1.0 / NULLIF(clicks, 0)), 2) AS cvr_pct,
  ROUND(AVG(spend_usd * 1.0 / NULLIF(attributed_conversions, 0)), 2) AS cpa_usd
FROM marketing_spend
GROUP BY channel
ORDER BY cpa_usd ASC;`,
    solution: `SELECT
  channel,
  ROUND(SUM(spend_usd), 2) AS total_spend_usd,
  ROUND(100.0 * SUM(clicks) / NULLIF(SUM(impressions), 0), 2) AS ctr_pct,
  ROUND(100.0 * SUM(attributed_conversions) / NULLIF(SUM(clicks), 0), 2) AS cvr_pct,
  ROUND(SUM(spend_usd) / NULLIF(SUM(attributed_conversions), 0), 2) AS cpa_usd
FROM marketing_spend
GROUP BY channel
ORDER BY cpa_usd ASC;`,
    solutionExplanation:
      'Al sumar primero los numeradores (`clicks`, `attributed_conversions`, `spend_usd`) y dividirlos entre la suma de sus denominadores con `NULLIF`, obtenemos las tasas ponderadas reales por volumen de cada canal.',
    expectedOutputTable: [
      {
        channel: 'referral',
        total_spend_usd: 22306.35,
        ctr_pct: 2.52,
        cvr_pct: 5.76,
        cpa_usd: 13.59,
      },
      {
        channel: 'organic_search',
        total_spend_usd: 26703.45,
        ctr_pct: 2.45,
        cvr_pct: 5.7,
        cpa_usd: 13.87,
      },
      {
        channel: 'email_campaign',
        total_spend_usd: 14102.07,
        ctr_pct: 2.45,
        cvr_pct: 5.74,
        cpa_usd: 13.92,
      },
      {
        channel: 'paid_social',
        total_spend_usd: 63080.29,
        ctr_pct: 2.49,
        cvr_pct: 5.67,
        cpa_usd: 13.93,
      },
      {
        channel: 'display_video',
        total_spend_usd: 46759.04,
        ctr_pct: 2.53,
        cvr_pct: 5.71,
        cpa_usd: 13.94,
      },
    ],
    hints: [
      '`CTR`, `CVR` y `CPA` son métricas no aditivas: nunca uses `AVG(a / b)` sobre filas diarias.',
      'Suma primero el numerador y el denominador: por ejemplo, `ROUND(100.0 * SUM(clicks) / NULLIF(SUM(impressions), 0), 2) AS ctr_pct`.',
      'Aplica el mismo patrón para `cvr_pct` (`SUM(attributed_conversions)` sobre `SUM(clicks)`) y `cpa_usd` (`SUM(spend_usd)` sobre `SUM(attributed_conversions)`).',
    ],
    orderMatters: true,
  },
  pipelineChallenge: {
    title: 'Métricas No Aditivas y Estratificación por Región en Marketing',
    ValidatorKey: 'l6_metrics_simpson',
    datasets: ['marketing_spend'],
    steps: [
      {
        id: 'step-1',
        text: 'Identificar las medidas aditivas base en marketing_spend (spend_usd, impressions, clicks, attributed_conversions).',
        title: '1. Identificar medidas aditivas base en marketing_spend',
        goal: 'Reconoce qué columnas pueden sumarse directamente (spend_usd, impressions, clicks, attributed_conversions).',
        hint: 'Las 4 medidas base son aditivas; las tasas derivadas (`ctr_pct`, `cvr_pct`, `cpa_usd`) son no aditivas y deben calcularse como razón de sumas.',
      },
      {
        id: 'step-2',
        text: 'Reemplazar los promedios de razones (AVG) por cocientes ponderados SUM(numerador) / NULLIF(SUM(denominador), 0).',
        title: '2. Evitar el promedio de promedios (AVG de ratios)',
        goal: 'Calcula CTR, CVR y CPA usando SUM(numerador) / NULLIF(SUM(denominador), 0).',
        hint: 'Si calculas `AVG(spend_usd / attributed_conversions)`, los días con pocas conversiones distorsionan el CPA.',
      },
      {
        id: 'step-3',
        text: 'Estratificar por canal y región para auditar el desempeño por segmento y descartar sesgos de composición.',
        title: '3. Estratificar por canal y región para auditar composición',
        goal: 'Agrupa por channel y region para inspeccionar el desempeño sin sesgo de agregación.',
        hint: 'Al desglosar por `channel, region` y ordenar por `channel ASC, cpa_usd ASC`, obtienes las métricas ponderadas exactas de cada segmento regional.',
      },
    ],
    prompt:
      'Construye la consulta sobre `marketing_spend` agrupada por `channel` y `region`. Devuelve: `channel`, `region`, `total_spend_usd` (`ROUND(SUM(spend_usd), 2)`), `ctr_pct` (`ROUND(100.0 * SUM(clicks) / NULLIF(SUM(impressions), 0), 2)`), `cvr_pct` (`ROUND(100.0 * SUM(attributed_conversions) / NULLIF(SUM(clicks), 0), 2)`), y `cpa_usd` (`ROUND(SUM(spend_usd) / NULLIF(SUM(attributed_conversions), 0), 2)`). Ordena por `channel ASC, cpa_usd ASC`.',
    starterCode: `-- Corrige el cálculo de métricas no aditivas agrupando por channel y region
SELECT
  channel,
  region,
  ROUND(SUM(spend_usd), 2) AS total_spend_usd,
  -- Reemplaza AVG por razón de sumas (SUM / NULLIF(SUM, 0))
  ROUND(100.0 * AVG(clicks * 1.0 / impressions), 2) AS ctr_pct,
  ROUND(100.0 * AVG(attributed_conversions * 1.0 / clicks), 2) AS cvr_pct,
  ROUND(AVG(spend_usd / attributed_conversions), 2) AS cpa_usd
FROM marketing_spend
GROUP BY channel, region
ORDER BY channel ASC, cpa_usd ASC;`,
    solution: `SELECT
  channel,
  region,
  ROUND(SUM(spend_usd), 2) AS total_spend_usd,
  ROUND(100.0 * SUM(clicks) / NULLIF(SUM(impressions), 0), 2) AS ctr_pct,
  ROUND(100.0 * SUM(attributed_conversions) / NULLIF(SUM(clicks), 0), 2) AS cvr_pct,
  ROUND(SUM(spend_usd) / NULLIF(SUM(attributed_conversions), 0), 2) AS cpa_usd
FROM marketing_spend
GROUP BY channel, region
ORDER BY channel ASC, cpa_usd ASC;`,
    expectedOutputTable: {
      columns: ['channel', 'region', 'total_spend_usd', 'ctr_pct', 'cvr_pct', 'cpa_usd'],
      rows: [
        ['display_video', 'Cono Sur', 46759.04, 2.53, 5.71, 13.94],
        ['email_campaign', 'Cono Sur', 14102.07, 2.45, 5.74, 13.92],
        ['organic_search', 'Andina', 26703.45, 2.45, 5.7, 13.87],
        ['paid_social', 'Norteamérica', 63080.29, 2.49, 5.67, 13.93],
        ['referral', 'Iberia', 22306.35, 2.52, 5.76, 13.59],
      ],
    },
    orderMatters: true,
    hints: [
      'Usa `ROUND(100.0 * SUM(clicks) / NULLIF(SUM(impressions), 0), 2)` para `ctr_pct`.',
      'Usa `ROUND(100.0 * SUM(attributed_conversions) / NULLIF(SUM(clicks), 0), 2)` para `cvr_pct`.',
      'Usa `ROUND(SUM(spend_usd) / NULLIF(SUM(attributed_conversions), 0), 2)` para `cpa_usd`.',
    ],
  },
  roleNotes: {
    de: 'Como Ingeniero de Datos, almacenarás en las tablas de hechos únicamente los componentes atómicos aditivos (numeradores y denominadores) o bocetos HLL, evitando materializar columnas de porcentaje que los usuarios puedan promediar por error.',
    da: 'Como Analista de Datos, ante cualquier variación abrupta en una tasa global (conversión, AOV o retención), aplicarás la descomposición de Kitagawa-Oaxaca para separar el efecto tasa intrínseco del efecto cambio de mezcla.',
    bi: 'Como especialista en BI, declararás las métricas de razón en la capa semántica (`SUM(num) / NULLIF(SUM(den), 0)`) y acompañarás cada KPI de crecimiento con métricas de guarda de rentabilidad y reembolsos.',
  },
  summary: [
    'Los hechos se clasifican en aditivos (sumables en toda dimensión), semiaditivos (no sumables en el tiempo) y no aditivos (ratios y conteos distintos).',
    'Promediar razones precalculadas (`AVG(num / den)`) introduce sesgo porque ignora el peso de volumen de cada fila.',
    'Toda razón o porcentaje analítico debe evaluarse como `SUM(numerador) / NULLIF(SUM(denominador), 0)` al nivel del `GROUP BY`.',
    'La paradoja de Simpson ocurre cuando un cambio en la mezcla de pesos invierte o distorsiona la tendencia global respecto a los estratos.',
    'La descomposición de Kitagawa-Oaxaca divide exactamente la variación global entre efecto tasa (desempeño interno) y efecto composición (mezcla).',
  ],
  glossaryTerms: [
    'c09-kpi-trees-guardrails',
    'c10-simpsons-paradox',
    'c11-additivity-hll',
    'descomposicion-kitagawa',
  ],
  flashcards: [
    {
      id: 'fc-c2-dim-04-01',
      front: '¿Cuál es la diferencia entre un hecho aditivo, semiaditivo y no aditivo?',
      back: 'Aditivo se suma en todas las dimensiones (`total_usd`); semiaditivo se suma entre entidades pero no en el tiempo (saldos); no aditivo no puede sumarse en ninguna dimensión (`CPA`, `COUNT DISTINCT`).',
    },
    {
      id: 'fc-c2-dim-04-02',
      front: '¿Por qué es un error calcular `AVG(spend_usd / attributed_conversions)` para obtener el CPA de un canal?',
      back: 'Porque otorga el mismo peso a días con volumen mínimo que a días de alto tráfico; la fórmula correcta es `SUM(spend_usd) / NULLIF(SUM(attributed_conversions), 0)`.',
    },
    {
      id: 'fc-c2-dim-04-03',
      front: '¿Qué es la paradoja de Simpson en analítica de negocios?',
      back: 'Es el fenómeno estadístico en el que una tendencia presente en cada segmento individual se invierte o desaparece al agregar los datos por efecto de una variable de confusión.',
    },
    {
      id: 'fc-c2-dim-04-04',
      front: '¿Qué dos componentes separa la descomposición de Kitagawa-Oaxaca?',
      back: 'Separa la diferencia global entre dos tasas o promedios en el efecto tasa (cambio de rendimiento dentro de cada estrato) y el efecto mezcla (cambio en la proporción de volumen entre estratos).',
    },
  ],
  sources: [
    {
      title: 'Additive, Semi-Additive, and Non-Additive Facts',
      url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/additive-semi-additive-non-additive-fact/',
      publisher: 'Kimball Group',
      accessed: '2026-10-29',
      supports:
        'Clasificación canónica de hechos según su aditividad y reglas de agregación de razones y saldos.',
    },
    {
      title: "Simpson's Paradox — Stanford Encyclopedia of Philosophy",
      url: 'https://plato.stanford.edu/entries/paradox-simpson/',
      publisher: 'Stanford University',
      accessed: '2026-10-29',
      supports:
        'Formulación matemática y causal de la paradoja de Simpson y el rol de los pesos de estratificación.',
    },
    {
      title: 'DuckDB SQL — Aggregate Functions and FILTER Clause',
      url: 'https://duckdb.org/docs/stable/sql/functions/aggregates.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports:
        'Uso de funciones de agregación condicional (`FILTER`) y conteos distintos en consultas analíticas.',
    },
    {
      title: 'dbt Semantic Layer — Ratio and Derived Metrics',
      url: 'https://docs.getdbt.com/docs/build/metrics-overview',
      publisher: 'dbt Labs',
      accessed: '2026-10-29',
      supports:
        'Definición declarativa de métricas de razón mediante agregación independiente de numerador y denominador.',
    },
  ],
  aiNotes:
    'Si el estudiante usa `AVG()` sobre divisiones fila a fila en `marketing_spend`, muéstrale cómo `referral` pasa de un CPA erróneo de `$14.37` al CPA real ponderado de `$13.59` al usar `SUM(spend_usd) / NULLIF(SUM(attributed_conversions), 0)`. En el ejemplo guiado sobre `orders` y `customers`, destaca cómo la brecha de `+$62.19` en ticket medio entre `desktop` (`$453.26`) y `mobile` (`$391.07`) se divide exactamente en `+$54.81` de efecto tasa y `+$7.38` de efecto mezcla.',
  needsReview: false,
};

export default lesson;
