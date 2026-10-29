export default {
  id: 'da2-inferencia-06-errores-potencia-tamano-muestra',
  moduleId: 'da2-inferencia',
  title: 'Errores tipo I y II, potencia y tamaño de muestra',
  subtitle: 'Errores tipo I y II, potencia estadística y cálculo de tamaño de muestra',
  tracks: ['da'],
  level: 2,
  order: 6,
  minutes: 25,
  prerequisites: ['da2-inferencia-05-pruebas-hipotesis-valor-p'],
  contentVersion: 1,
  hook: 'El equipo de producto de Mercado Brisa quiere lanzar una prueba en el canal `desktop` durante solo 7 días para detectar una mejora del 5 % en el ticket promedio (`+22.81 USD`). Al revisar el ritmo histórico de la tabla `orders`, notas que en 7 días apenas entran unos 25 pedidos por brazo, cuando la fórmula de potencia al 80 % exige 3 260 pedidos por variante. ¿Qué ocurre cuando ejecutas una prueba sin tamaño de muestra suficiente y cómo se calcula a priori el volumen requerido?',
  objectives: [
    'Evaluar el costo de negocio de los errores Tipo I (α, falso positivo) y Tipo II (β, falso negativo) en decisiones bajo incertidumbre.',
    'Relacionar la potencia estadística (1 - β) con la varianza de la métrica y el efecto mínimo detectable (MDE).',
    'Calcular en SQL el tamaño de muestra por brazo y la duración necesaria antes de iniciar un experimento o auditoría.',
  ],
  sections: [
    {
      id: 'matriz-errores-tipo-i-ii',
      heading: 'La matriz de decisión: error Tipo I (α), error Tipo II (β) y potencia',
      body: 'Al tomar una decisión binaria basada en una muestra ruidosa existen dos formas de equivocarse. La primera es el **error Tipo I (falso positivo, tasa $\\alpha$)**. Consiste en rechazar la hipótesis nula $H_0$ cuando el tratamiento en realidad no tiene efecto. Fijar $\\alpha = 0.05$ significa aceptar un 5 % de riesgo de desplegar un cambio inútil por puro azar.\n\nLa segunda es el **error Tipo II (falso negativo, tasa $\\beta$)**. Ocurre al no rechazar $H_0$ cuando en la población sí existe un efecto real de magnitud $\\Delta$. Su complemento es la **potencia estadística ($1 - \\beta$)**, que mide la probabilidad de detectar un efecto verdadero de tamaño $\\Delta$ cuando realmente existe.\n\nEn la industria suele fijarse un estándar de $\\alpha = 0.05$ ($z_{1-\\alpha/2} = 1.96$) y una potencia mínima del $80\\%$ ($z_{1-\\beta} = 0.8416$, aceptando $\\beta = 20\\%$ de falsos negativos) o del $90\\%$ ($z_{1-\\beta} = 1.2816$). Sin embargo, la elección depende de la asimetría de costos del negocio.',
    },
    {
      id: 'ecuacion-tamano-muestra-mde',
      heading: 'El efecto mínimo detectable (MDE) y la fórmula de tamaño de muestra',
      body: 'Antes de recolectar datos debemos acordar con el negocio el **efecto mínimo detectable (MDE o $\\Delta$)**. El MDE es la diferencia más pequeña que justificaría implementar el cambio. Para comparar dos medias independientes con varianza $\\sigma^2$, el tamaño de muestra requerido **por cada brazo** es $n_{\\text{brazo}} = \\lceil 2(z_{1-\\alpha/2} + z_{1-\\beta})^2 \\sigma^2 / \\Delta^2 \\rceil$.\n\nPara $\\alpha = 0.05$ y potencia del $80\\%$, el factor constante vale $2 \\cdot (1.96 + 0.8416)^2 \\approx 15.70$. Observa que el MDE $\\Delta$ aparece **elevado al cuadrado en el denominador**. Si quieres detectar un efecto dos veces más pequeño (bajar de un MDE del 10 % al 5 %), necesitas **cuatro veces más muestra por brazo** ($2^2 = 4$). Si bajas del 10 % al 2 %, necesitas veinticinco veces más observaciones.',
      example: {
        language: 'sql',
        code: `WITH base AS (
  SELECT
    AVG(total_usd) AS media_usd,
    VAR_SAMP(total_usd) AS varianza_usd
  FROM orders
)
SELECT
  mde.mde_pct,
  ROUND(base.media_usd * mde.mde_pct / 100.0, 2) AS mde_absoluto_usd,
  CAST(CEIL(2 * POWER(1.96 + 0.8416, 2) * base.varianza_usd / POWER(base.media_usd * mde.mde_pct / 100.0, 2)) AS INTEGER) AS n_por_brazo_80pct,
  CAST(CEIL(2 * POWER(1.96 + 1.2816, 2) * base.varianza_usd / POWER(base.media_usd * mde.mde_pct / 100.0, 2)) AS INTEGER) AS n_por_brazo_90pct
FROM base
CROSS JOIN (VALUES (2.0), (5.0), (10.0)) AS mde(mde_pct)
ORDER BY mde.mde_pct ASC;`,
        expectedOutput: [
          {
            mde_pct: '2.0',
            mde_absoluto_usd: 8.52,
            n_por_brazo_80pct: 22088,
            n_por_brazo_90pct: 29571,
          },
          {
            mde_pct: '5.0',
            mde_absoluto_usd: 21.31,
            n_por_brazo_80pct: 3535,
            n_por_brazo_90pct: 4732,
          },
          {
            mde_pct: '10.0',
            mde_absoluto_usd: 42.61,
            n_por_brazo_80pct: 884,
            n_por_brazo_90pct: 1183,
          },
        ],
      },
    },
    {
      id: 'duracion-operativa-y-alternativas',
      heading: 'De tamaño de muestra por brazo a días de ejecución reales',
      body: 'Calcular $n_{\\text{brazo}}$ es solo la mitad del trabajo. Un diseño de dos variantes al 50 % cada una requiere capturar $2 \\cdot n_{\\text{brazo}}$ observaciones totales. Al dividir $2 \\cdot n_{\\text{brazo}}$ entre el tráfico diario elegible del canal, obtenemos los **días necesarios de ejecución**.\n\n¿Qué hacer cuando el cálculo exige cientos de días para detectar un cambio pequeño en `total_usd`? Un analista riguroso nunca recomienda correr la prueba una semana con potencia del 10 %. En su lugar, dispone de tres palancas válidas.\n\nPrimero, puede elegir una métrica más cercana en el embudo y con menor varianza relativa, como la tasa de inicio de pago en `events`. Segundo, puede aplicar reducción de varianza con covariables previas (`pre_experiment_spend_usd`), disminuyendo $\\sigma^2$ en el numerador. Tercero, puede reservar los canales de bajo volumen únicamente para cambios con un MDE esperado grande.',
    },
  ],
  workedExample: {
    title: 'Auditoría de factibilidad y tamaño de muestra por dispositivo en Mercado Brisa',
    description:
      'Producto propone correr una prueba de 7 días por separado en cada `device_type` (`desktop`, `mobile`, `pos_tienda`) sobre la tabla `orders` (que abarca 1 095 días históricos) buscando detectar un aumento del 5 % en `total_usd` con α = 0.05 y 80 % de potencia. Compara el volumen que se captura en 7 días frente al tamaño muestral requerido.',
    steps: [
      {
        label: 'Paso 1 — Diagnóstico del tráfico diario: cuántas órdenes entran en 7 días',
        explanation:
          'Al dividir el histórico de 3 años (`1 095` días) de la tabla `orders`, vemos que `desktop` registra unos `7.0` pedidos diarios (`25` pedidos por brazo en 7 días) con una desviación estándar de `328.65 USD`. Con apenas 25 órdenes por brazo, el error estándar supera los 65 USD.',
        code: `SELECT
  device_type,
  COUNT(*) AS pedidos_3_anios,
  ROUND(COUNT(*) / 1095.0, 1) AS pedidos_por_dia,
  ROUND(7.0 * COUNT(*) / 1095.0 / 2.0, 0) AS n_por_brazo_en_7_dias,
  ROUND(AVG(total_usd), 2) AS media_usd,
  ROUND(STDDEV_SAMP(total_usd), 2) AS desvio_usd
FROM orders
GROUP BY device_type
ORDER BY pedidos_3_anios DESC;`,
        expectedOutput: [
          {
            device_type: 'desktop',
            pedidos_3_anios: 7716,
            pedidos_por_dia: 7,
            n_por_brazo_en_7_dias: 25,
            media_usd: 456.14,
            desvio_usd: 328.65,
          },
          {
            device_type: 'mobile',
            pedidos_3_anios: 6857,
            pedidos_por_dia: 6.3,
            n_por_brazo_en_7_dias: 22,
            media_usd: 390.52,
            desvio_usd: 310.8,
          },
          {
            device_type: 'pos_tienda',
            pedidos_3_anios: 3427,
            pedidos_por_dia: 3.1,
            n_por_brazo_en_7_dias: 11,
            media_usd: 429.66,
            desvio_usd: 309.42,
          },
        ],
      },
      {
        label: 'Paso 2 — Cálculo de n por brazo y días reales para MDE del 5 % al 80 % de potencia',
        explanation:
          'Aplicando $n = \\lceil 2(1.96 + 0.8416)^2 s^2 / (0.05\\bar{x})^2 \\rceil$, descubrimos que detectar un 5 % en `total_usd` exige entre `3 257` y `3 978` pedidos por brazo. Al ritmo de `orders`, eso tomaría más de 900 días: para experimentar en semanas debemos medir a nivel de usuario/sesión o usar reducción de varianza como en `experiment_assignments`.',
        code: `SELECT
  device_type,
  ROUND(AVG(total_usd), 2) AS media_usd,
  ROUND(0.05 * AVG(total_usd), 2) AS mde_5pct_usd,
  CAST(CEIL(2 * POWER(1.96 + 0.8416, 2) * VAR_SAMP(total_usd) / POWER(0.05 * AVG(total_usd), 2)) AS INTEGER) AS n_por_brazo_80pct,
  CAST(CEIL(2.0 * CEIL(2 * POWER(1.96 + 0.8416, 2) * VAR_SAMP(total_usd) / POWER(0.05 * AVG(total_usd), 2)) / (COUNT(*) / 1095.0)) AS INTEGER) AS dias_necesarios
FROM orders
GROUP BY device_type
ORDER BY n_por_brazo_80pct ASC;`,
        expectedOutput: [
          {
            device_type: 'pos_tienda',
            media_usd: 429.66,
            mde_5pct_usd: 21.48,
            n_por_brazo_80pct: 3257,
            dias_necesarios: 2082,
          },
          {
            device_type: 'desktop',
            media_usd: 456.14,
            mde_5pct_usd: 22.81,
            n_por_brazo_80pct: 3260,
            dias_necesarios: 926,
          },
          {
            device_type: 'mobile',
            media_usd: 390.52,
            mde_5pct_usd: 19.53,
            n_por_brazo_80pct: 3978,
            dias_necesarios: 1271,
          },
        ],
      },
    ],
  },
  checks: [
    {
      id: 'chk-da2-06-1',
      type: 'mcq',
      prompt:
        'Para detectar un MDE del 10 % en el ticket promedio con α = 0.05 y potencia del 80 %, necesitas n = 884 pedidos por brazo. Si el comité exige detectar un MDE dos veces más fino (5 %) manteniendo igual varianza, α y potencia, ¿cuántos pedidos por brazo necesitarás?',
      options: [
        {
          id: 'a',
          text: '1 768 pedidos por brazo (el doble de muestra)',
          correct: false,
          feedback:
            'El MDE Δ está elevado al cuadrado en el denominador de la fórmula de tamaño de muestra, por lo que la relación no es lineal.',
        },
        {
          id: 'b',
          text: '3 535 pedidos por brazo (cuatro veces más muestra, porque Δ se divide entre 2 y Δ² se divide entre 4)',
          correct: true,
          feedback:
            'Exacto: al reducir el MDE a la mitad (de 10 % a 5 %), el denominador Δ² se reduce a la cuarta parte y el tamaño de muestra requerido se multiplica por 4 (884 × 4 ≈ 3 535).',
        },
        {
          id: 'c',
          text: '442 pedidos por brazo (la mitad de muestra)',
          correct: false,
          feedback:
            'Detectar un efecto más pequeño entre el ruido muestral exige más observaciones, nunca menos.',
        },
      ],
      explanation:
        'En la ecuación n = 2(z_α/2 + z_β)² · σ² / Δ², el efecto mínimo detectable Δ aparece al cuadrado en el denominador. Reducir Δ a la mitad multiplica n por 2² = 4.',
    },
    {
      id: 'chk-da2-06-2',
      type: 'mcq',
      prompt:
        'Un nuevo flujo de pago incrementa realmente la conversión en +1.5 pp en la población, pero como el test se corrió con muestra muy pequeña (potencia del 25 %), arroja p = 0.31 y el equipo descarta el cambio. ¿Qué tipo de error ocurrió?',
      options: [
        {
          id: 'a',
          text: 'Error Tipo I (falso positivo)',
          correct: false,
          feedback:
            'El error Tipo I ocurre cuando H0 es verdadera (no hay efecto real) y aun así rechazamos H0.',
        },
        {
          id: 'b',
          text: 'Error Tipo II (falso negativo), cuya probabilidad β era del 75 % debido a la baja potencia del estudio',
          correct: true,
          feedback:
            'Correcto: no rechazar H0 cuando sí existe un efecto real en la población es un error Tipo II (β = 1 - potencia = 1 - 0.25 = 75 %).',
        },
        {
          id: 'c',
          text: 'Sesgo de selección por exclusión de nulos',
          correct: false,
          feedback:
            'El problema descrito proviene de un tamaño muestral insuficiente para detectar el efecto verdadero.',
        },
      ],
      explanation:
        'Cuando existe una mejora real (H1 es verdadera) pero la muestra no logra rechazar H0, se comete un error Tipo II (falso negativo). Con potencia 1 - β = 25 %, la tasa de error Tipo II β asciende al 75 %.',
    },
    {
      id: 'chk-da2-06-3',
      type: 'mcq',
      prompt:
        '¿Cuál de las siguientes modificaciones incrementa el tamaño de muestra n requerido por brazo al diseñar una prueba de hipótesis?',
      options: [
        {
          id: 'a',
          text: 'Subir la potencia objetivo del 80 % (z = 0.8416) al 90 % (z = 1.2816) o trabajar con una métrica de mayor varianza σ²',
          correct: true,
          feedback:
            'Correcto: tanto el factor de potencia (z_1-α/2 + z_1-β)² como la varianza σ² multiplican directamente en el numerador de n.',
        },
        {
          id: 'b',
          text: 'Ampliar el efecto mínimo detectable (MDE) pasando de buscar un cambio del 2 % a uno del 10 %',
          correct: false,
          feedback:
            'Un MDE más grande (mayor Δ en el denominador) es más fácil de detectar y requiere menos muestra por brazo.',
        },
        {
          id: 'c',
          text: 'Reducir la varianza residual de la métrica mediante ajuste por covariables pre-experimento',
          correct: false,
          feedback:
            'Reducir la varianza σ² disminuye el numerador y permite alcanzar la misma potencia con menos muestra.',
        },
      ],
      explanation:
        'El tamaño de muestra n crece cuando aumentamos la potencia (1 - β), cuando reducimos α, cuando crece la varianza σ² o cuando exigimos un MDE Δ más pequeño.',
    },
  ],
  practice: {
    type: 'sql',
    title: 'Cálculo de tamaño de muestra por segmento para un MDE del 5 % al 80 % de potencia',
    language: 'sql',
    prompt:
      'Une `orders` con `customers` para dimensionar una prueba de hipótesis por segmento de cliente (`c.segment`) buscando detectar un MDE relativo del 5 % sobre el ticket promedio (`0.05 * AVG(o.total_usd)`) con nivel de significancia bilateral $\\alpha = 0.05$ ($z_{1-\\alpha/2} = 1.96$) y potencia del 80 % ($z_{1-\\beta} = 0.8416$). Devuelve: `segment`, `pedidos_historicos` (`COUNT(*)`), `media_usd` (`ROUND(AVG(o.total_usd), 2)`), `desvio_usd` (`ROUND(STDDEV_SAMP(o.total_usd), 2)`), `mde_5pct_usd` (`ROUND(0.05 * AVG(o.total_usd), 2)`) y `n_por_brazo_80pct` (`CAST(CEIL(2 * POWER(1.96 + 0.8416, 2) * VAR_SAMP(o.total_usd) / POWER(0.05 * AVG(o.total_usd), 2)) AS INTEGER)`). Ordena de menor a mayor por `n_por_brazo_80pct`.',
    starterCode: `SELECT
  c.segment,
  COUNT(*) AS pedidos_historicos,
  ROUND(AVG(o.total_usd), 2) AS media_usd,
  ROUND(STDDEV_SAMP(o.total_usd), 2) AS desvio_usd,
  -- Calcula mde_5pct_usd (2 decimales) y n_por_brazo_80pct (entero con CEIL):
  0.0 AS mde_5pct_usd,
  0 AS n_por_brazo_80pct
FROM orders AS o
INNER JOIN customers AS c ON o.customer_id = c.customer_id
GROUP BY c.segment
ORDER BY n_por_brazo_80pct ASC;`,
    expected: `SELECT
  c.segment,
  COUNT(*) AS pedidos_historicos,
  ROUND(AVG(o.total_usd), 2) AS media_usd,
  ROUND(STDDEV_SAMP(o.total_usd), 2) AS desvio_usd,
  ROUND(0.05 * AVG(o.total_usd), 2) AS mde_5pct_usd,
  CAST(
    CEIL(
      2 * POWER(1.96 + 0.8416, 2) * VAR_SAMP(o.total_usd)
      / POWER(0.05 * AVG(o.total_usd), 2)
    ) AS INTEGER
  ) AS n_por_brazo_80pct
FROM orders AS o
INNER JOIN customers AS c ON o.customer_id = c.customer_id
GROUP BY c.segment
ORDER BY n_por_brazo_80pct ASC;`,
    orderMatters: true,
    hints: [
      'Para mde_5pct_usd calcula ROUND(0.05 * AVG(o.total_usd), 2).',
      'Para n_por_brazo_80pct usa CAST(CEIL(2 * POWER(1.96 + 0.8416, 2) * VAR_SAMP(o.total_usd) / POWER(0.05 * AVG(o.total_usd), 2)) AS INTEGER).',
    ],
    solution: `SELECT
  c.segment,
  COUNT(*) AS pedidos_historicos,
  ROUND(AVG(o.total_usd), 2) AS media_usd,
  ROUND(STDDEV_SAMP(o.total_usd), 2) AS desvio_usd,
  ROUND(0.05 * AVG(o.total_usd), 2) AS mde_5pct_usd,
  CAST(
    CEIL(
      2 * POWER(1.96 + 0.8416, 2) * VAR_SAMP(o.total_usd)
      / POWER(0.05 * AVG(o.total_usd), 2)
    ) AS INTEGER
  ) AS n_por_brazo_80pct
FROM orders AS o
INNER JOIN customers AS c ON o.customer_id = c.customer_id
GROUP BY c.segment
ORDER BY n_por_brazo_80pct ASC;`,
    solutionExplanation:
      'El segmento cafeteria_b2b requiere menos muestra por brazo (2 825 pedidos) porque su coeficiente de variación (desvio_usd / media_usd ≈ 0.671) es menor que el de retail (0.757) y pro_barista (0.769). Sin embargo, como B2B tiene menor volumen histórico (3 170 pedidos en total), reunir 2 825 órdenes por brazo tomaría mucho más tiempo que en retail o pro_barista.',
    expectedOutputTable: [
      {
        segment: 'cafeteria_b2b',
        pedidos_historicos: 3170,
        media_usd: 513.75,
        desvio_usd: 344.54,
        mde_5pct_usd: 25.69,
        n_por_brazo_80pct: 2825,
      },
      {
        segment: 'retail',
        pedidos_historicos: 7253,
        media_usd: 410.08,
        desvio_usd: 310.45,
        mde_5pct_usd: 20.5,
        n_por_brazo_80pct: 3599,
      },
      {
        segment: 'pro_barista',
        pedidos_historicos: 7577,
        media_usd: 404.76,
        desvio_usd: 311.37,
        mde_5pct_usd: 20.24,
        n_por_brazo_80pct: 3716,
      },
    ],
  },
  roleNotes: {
    de: 'Expón vistas materializadas con varianzas y conteos diarios por segmento y canal; eso permite que las calculadoras internas de tamaño de muestra consulten parámetros reales en milisegundos antes de configurar un experimento.',
    da: 'Nunca apruebes el inicio de un experimento sin contrastar 2 · n_por_brazo contra el tráfico elegible semanal; si el horizonte supera 4–6 semanas, propón usar una métrica con menor coeficiente de variación o aplicar ajuste pre-experimento.',
    bi: 'En el panel de seguimiento de experimentos activos, muestra una barra de progreso hacia el tamaño de muestra objetivo (2 · n_por_brazo) y oculta o bloquea los valores p hasta que se alcance el 100 % de la muestra planeada.',
  },
  summary: [
    'El error Tipo I (α) es un falso positivo (rechazar H0 siendo cierta); el error Tipo II (β) es un falso negativo.',
    'La potencia estadística (1 - β) mide la probabilidad de detectar un efecto verdadero de magnitud Δ.',
    'El tamaño de muestra por brazo es inversamente proporcional al cuadrado del efecto mínimo detectable (Δ²).',
    'Dividir un MDE a la mitad cuadruplica el tamaño de muestra necesario por brazo.',
  ],
  flashcards: [
    {
      id: 'fc-da2-06-a',
      front: '¿Qué diferencia hay entre el error Tipo I (α) y el error Tipo II (β) en una prueba de negocio?',
      back: 'El error Tipo I (α) consiste en declarar ganador un cambio que en realidad no tiene efecto (falso positivo); el error Tipo II (β) consiste en descartar un cambio que sí tenía un efecto real (falso negativo).',
    },
    {
      id: 'fc-da2-06-b',
      front: '¿Por qué reducir el MDE a la mitad obliga a multiplicar por 4 el tamaño de muestra por brazo?',
      back: 'Porque en la ecuación n = 2(z_α/2 + z_β)² · σ² / Δ², el MDE (Δ) aparece elevado al cuadrado en el denominador.',
    },
    {
      id: 'fc-da2-06-c',
      front: '¿Por qué es peligroso revisar el valor p todos los días y detener la prueba apenas baje de 0.05?',
      back: 'Porque el monitoreo continuo con parada temprana (peeking) acumula múltiples oportunidades de cruce azaroso e infla drásticamente la tasa real de falsos positivos (error Tipo I).',
    },
  ],
  glossaryTerms: [
    'potencia-estadistica',
    'efecto-minimo-detectable',
    'valor-p',
    'tamano-del-efecto-cohen',
  ],
  sources: [
    {
      title: 'NIST/SEMATECH e-Handbook — Sample Sizes Required (prc22 & prc242)',
      url: 'https://www.itl.nist.gov/div898/handbook/prc/section2/prc22.htm',
      publisher: 'National Institute of Standards and Technology (NIST)',
      accessed: '2026-10-29',
      supports: 'Ecuaciones de tamaño de muestra requerido según riesgo α, riesgo β y varianza.',
    },
    {
      title: 'Statsmodels Official Documentation — statsmodels.stats.power.TTestIndPower',
      url: 'https://www.statsmodels.org/stable/generated/statsmodels.stats.power.TTestIndPower.html',
      publisher: 'Statsmodels Developers',
      accessed: '2026-10-29',
      supports: 'Relación funcional entre tamaño de muestra, potencia, nivel α y tamaño del efecto en pruebas t.',
    },
    {
      title: 'Greenland, S. et al. (2016) — Statistical tests, P values, confidence intervals, and power',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5187603/',
      publisher: 'European Journal of Epidemiology (Springer / PMC)',
      accessed: '2026-10-29',
      supports: 'Análisis de los riesgos de baja potencia y sesgo de inflación del efecto en hallazgos significativos.',
    },
  ],
  aiNotes:
    'Los estudiantes suelen olvidar el factor 2 del numerador (que proviene de sumar la varianza de dos brazos: control y tratamiento), usar STDDEV_SAMP en lugar de VAR_SAMP, o redondear mde_5pct_usd antes de elevarlo al cuadrado en el denominador de n_por_brazo_80pct. Recuérdales usar la expresión exacta 0.05 * AVG(o.total_usd) dentro de POWER(..., 2).',
};
