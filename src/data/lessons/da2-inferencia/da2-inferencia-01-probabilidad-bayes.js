export default {
  id: 'da2-inferencia-01-probabilidad-bayes',
  moduleId: 'da2-inferencia',
  title: 'Probabilidad condicional y teorema de Bayes en negocio',
  subtitle: 'Probabilidad condicional y teorema de Bayes aplicado a decisiones de negocio',
  tracks: ['da'],
  level: 2,
  order: 1,
  minutes: 20,
  prerequisites: [
    'c0-numeros-04',
    'c0-numeros-05',
    'c1-python-05',
  ],
  contentVersion: 1,
  hook: 'El comité comercial de Mercado Brisa observa que el segmento `cafeteria_b2b` tiene la mayor propensión a realizar pedidos de alto valor (`total_usd >= 800`), con un 19.81 % frente a ~12.2 % en los demás segmentos. Por ello proponen dedicar todo el equipo de atención VIP exclusivamente a cuentas B2B. Sin embargo, al revisar el total de pedidos altos de la empresa, las cuentas B2B representan apenas el 25.67 %. ¿Por qué la probabilidad condicional dentro de un segmento no equivale a su peso posterior sobre el evento?',
  objectives: [
    'Distinguir entre probabilidad conjunta, marginal y condicional al auditar tasas operativas en tablas transaccionales.',
    'Aplicar el teorema de Bayes para actualizar la probabilidad previa (tasa base) de un segmento tras observar una señal.',
    'Programar consultas SQL que separen la verosimilitud P(Evento | Segmento) de la probabilidad posterior P(Segmento | Evento).',
  ],
  sections: [
    {
      id: 'condicional-vs-inversa',
      heading: 'El denominador define la pregunta: P(A | B) frente a P(B | A)',
      body: 'Toda probabilidad condicional restringe el universo de casos antes de contar los eventos de interés. Llamemos $A$ al evento de registrar un pedido alto (`total_usd >= 800`) y $B$ al segmento `cafeteria_b2b`. La expresión $P(A \\mid B) = \\frac{P(A \\cap B)}{P(B)}$ mide qué fracción de los pedidos B2B supera los 800 dólares. En cambio, $P(B \\mid A) = \\frac{P(A \\cap B)}{P(A)}$ mide qué porcentaje de todos los pedidos altos proviene de cuentas B2B.\n\nEn el análisis cotidiano es habitual confundir ambas direcciones. Este error se conoce como **falacia de la condicional transpuesta**. Un segmento masivo como `pro_barista` o `retail` concentra más del 40 % de las transacciones de Mercado Brisa. Por su volumen, aportará una proporción grande de los eventos extremos aunque su tasa interna sea moderada.\n\nEn SQL, la diferencia entre ambas preguntas radica exclusivamente en el denominador. Mientras $P(A \\mid B)$ divide los casos conjuntos entre el conteo del grupo $B$, la inversa $P(B \\mid A)$ divide entre la suma global del evento $A$ usando una función de ventana.',
    },
    {
      id: 'tasa-base-y-bayes',
      heading: 'Tasa base y teorema de Bayes en reglas de negocio',
      body: 'El **teorema de Bayes** conecta formalmente ambas probabilidades condicionales mediante la tasa base del grupo: $P(B \\mid A) = \\frac{P(A \\mid B) \\cdot P(B)}{P(A)}$. Aquí, $P(B)$ es la **probabilidad previa** (*prior* o tasa base) antes de observar la señal $A$. Por su parte, $P(A \\mid B)$ es la verosimilitud y $P(B \\mid A)$ es la **probabilidad posterior** actualizada.\n\nImaginemos una alerta automática de contracargos con sensibilidad del 90 % para detectar pedidos fraudulentos ($P(\\text{Alerta} \\mid \\text{Fraude}) = 0.90$). Supongamos además una tasa de falsos positivos del 5 % en pedidos legítimos ($P(\\text{Alerta} \\mid \\text{Legítimo}) = 0.05$). Si el fraude real en Mercado Brisa ocurre en el 1 % de las órdenes ($P(\\text{Fraude}) = 0.01$), en 10 000 pedidos habrá 100 fraudes reales y 9 900 pedidos legítimos. El sistema detectará 90 fraudes verdaderos pero emitirá 495 falsas alarmas.\n\nAl aplicar Bayes sobre las $90 + 495 = 585$ alertas emitidas, la probabilidad real de fraude dado el aviso es apenas $\\frac{90}{585} = 15.38\\%$. Ignorar la tasa base del 1 % llevaría a bloquear por error 85 de cada 100 pedidos retenidos.',
      example: {
        language: 'sql',
        code: `SELECT
  c.segment,
  COUNT(*) AS total_pedidos,
  SUM(CASE WHEN o.total_usd >= 800 THEN 1 ELSE 0 END) AS pedidos_altos,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) AS tasa_base_seg_pct,
  ROUND(100.0 * SUM(CASE WHEN o.total_usd >= 800 THEN 1 ELSE 0 END) / COUNT(*), 2) AS prob_alto_dado_seg_pct
FROM orders AS o
INNER JOIN customers AS c ON o.customer_id = c.customer_id
GROUP BY c.segment
ORDER BY prob_alto_dado_seg_pct DESC;`,
        expectedOutput: [
          {
            segment: 'cafeteria_b2b',
            total_pedidos: 3170,
            pedidos_altos: 628,
            tasa_base_seg_pct: 17.61,
            prob_alto_dado_seg_pct: 19.81,
          },
          {
            segment: 'retail',
            total_pedidos: 7253,
            pedidos_altos: 898,
            tasa_base_seg_pct: 40.29,
            prob_alto_dado_seg_pct: 12.38,
          },
          {
            segment: 'pro_barista',
            total_pedidos: 7577,
            pedidos_altos: 920,
            tasa_base_seg_pct: 42.09,
            prob_alto_dado_seg_pct: 12.14,
          },
        ],
      },
    },
    {
      id: 'frecuencias-naturales-sql',
      heading: 'Tablas de frecuencias naturales y actualización bayesiana en SQL',
      body: 'La forma más transparente de aplicar Bayes en analítica consiste en construir tablas de **frecuencias naturales** con expresiones comunes de tabla (CTE). En lugar de anidar fracciones difíciles de leer, calculamos en una primera etapa el conteo total por grupo y el conteo del evento.\n\nCon esa estructura, las tres piezas bayesianas quedan expuestas en paralelo. Calculamos la tasa base previa como `total_grupo / SUM(total_grupo) OVER ()`. Obtenemos la verosimilitud condicional mediante `evento_grupo / total_grupo`. Finalmente, hallamos la probabilidad posterior con `evento_grupo / SUM(evento_grupo) OVER ()`.\n\nEn el cruce entre `orders` y `customers`, `cafeteria_b2b` presenta la mayor verosimilitud de pedido alto (`19.81 %`). No obstante, su tasa base es de solo `17.61 %` (3 170 de 18 000 pedidos). Al ponderar ambos factores mediante Bayes, `pro_barista` (`37.61 %`) y `retail` (`36.71 %`) originan casi tres cuartas partes de los pedidos altos de la compañía.',
    },
  ],
  workedExample: {
    title: 'De la verosimilitud condicional a la probabilidad posterior en pedidos de alto valor',
    description:
      'El equipo de fidelización quiere saber cómo se distribuyen los pedidos de alto valor (`total_usd >= 800`) entre los tres segmentos de clientes (`cafeteria_b2b`, `retail`, `pro_barista`). Compara el análisis incompleto que solo mira la probabilidad condicional P(Alto | Segmento) frente al cuadro bayesiano completo.',
    steps: [
      {
        label: 'Paso 1 — Enfoque incompleto: mirar solo la verosimilitud P(Alto | Segmento)',
        explanation:
          'Si solo calculamos qué porcentaje de los pedidos de cada segmento supera los 800 USD (`prob_alto_dado_seg_pct`), `cafeteria_b2b` lidera con `19.81 %`. Quedarse únicamente con esta cifra lleva a ignorar que los otros dos segmentos tienen más del doble de volumen base.',
        code: `SELECT
  c.segment,
  COUNT(*) AS total_pedidos,
  SUM(CASE WHEN o.total_usd >= 800 THEN 1 ELSE 0 END) AS pedidos_altos,
  ROUND(100.0 * SUM(CASE WHEN o.total_usd >= 800 THEN 1 ELSE 0 END) / COUNT(*), 2) AS prob_alto_dado_seg_pct
FROM orders AS o
INNER JOIN customers AS c ON o.customer_id = c.customer_id
GROUP BY c.segment
ORDER BY prob_alto_dado_seg_pct DESC;`,
        expectedOutput: [
          {
            segment: 'cafeteria_b2b',
            total_pedidos: 3170,
            pedidos_altos: 628,
            prob_alto_dado_seg_pct: 19.81,
          },
          {
            segment: 'retail',
            total_pedidos: 7253,
            pedidos_altos: 898,
            prob_alto_dado_seg_pct: 12.38,
          },
          {
            segment: 'pro_barista',
            total_pedidos: 7577,
            pedidos_altos: 920,
            prob_alto_dado_seg_pct: 12.14,
          },
        ],
      },
      {
        label: 'Paso 2 — Enfoque bayesiano: integrar tasa base (prior) y probabilidad posterior',
        explanation:
          'Al incorporar la probabilidad previa de cada segmento (`prior_seg_pct`) y calcular la probabilidad posterior dado que el pedido es alto (`posterior_seg_dado_alto_pct`), comprobamos que un pedido alto elegido al azar tiene `37.61 %` de probabilidad de pertenecer a `pro_barista`, `36.71 %` a `retail` y `25.67 %` a `cafeteria_b2b`.',
        code: `WITH conteos AS (
  SELECT
    c.segment,
    COUNT(*) AS total_pedidos,
    SUM(CASE WHEN o.total_usd >= 800 THEN 1 ELSE 0 END) AS pedidos_altos
  FROM orders AS o
  INNER JOIN customers AS c ON o.customer_id = c.customer_id
  GROUP BY c.segment
)
SELECT
  segment,
  pedidos_altos,
  ROUND(100.0 * total_pedidos / SUM(total_pedidos) OVER (), 2) AS prior_seg_pct,
  ROUND(100.0 * pedidos_altos / total_pedidos, 2) AS verosimilitud_pct,
  ROUND(100.0 * pedidos_altos / SUM(pedidos_altos) OVER (), 2) AS posterior_seg_dado_alto_pct
FROM conteos
ORDER BY posterior_seg_dado_alto_pct DESC;`,
        expectedOutput: [
          {
            segment: 'pro_barista',
            pedidos_altos: 920,
            prior_seg_pct: 42.09,
            verosimilitud_pct: 12.14,
            posterior_seg_dado_alto_pct: 37.61,
          },
          {
            segment: 'retail',
            pedidos_altos: 898,
            prior_seg_pct: 40.29,
            verosimilitud_pct: 12.38,
            posterior_seg_dado_alto_pct: 36.71,
          },
          {
            segment: 'cafeteria_b2b',
            pedidos_altos: 628,
            prior_seg_pct: 17.61,
            verosimilitud_pct: 19.81,
            posterior_seg_dado_alto_pct: 25.67,
          },
        ],
      },
    ],
  },
  checks: [
    {
      id: 'chk-da2-01-1',
      type: 'mcq',
      prompt:
        'En Mercado Brisa, el 19.81 % de los pedidos de `cafeteria_b2b` supera 800 USD, y el 25.67 % de todos los pedidos mayores a 800 USD pertenece a `cafeteria_b2b`. Si A = "Pedido >= 800 USD" y B = "Segmento cafeteria_b2b", ¿cómo se expresan formalmente ambas cifras?',
      options: [
        {
          id: 'a',
          text: 'P(B | A) = 19.81 % y P(A | B) = 25.67 %',
          correct: false,
          feedback:
            'Revisa cuál es la condición previa: el 19.81 % toma como universo los 3 170 pedidos del segmento B, no el total de pedidos altos A.',
        },
        {
          id: 'b',
          text: 'P(A | B) = 19.81 % y P(B | A) = 25.67 %',
          correct: true,
          feedback:
            'Correcto: 19.81 % (628 / 3 170) es la probabilidad de pedido alto dado el segmento B2B P(A | B), y 25.67 % (628 / 2 446) es la probabilidad posterior P(B | A).',
        },
        {
          id: 'c',
          text: 'P(A ∩ B) = 19.81 % y P(B) = 25.67 %',
          correct: false,
          feedback:
            'Ninguna de las dos cifras divide entre los 18 000 pedidos globales; ambas condicionan sobre un subconjunto específico.',
        },
      ],
      explanation:
        'En P(A | B) el denominador es el total de pedidos de cafeteria_b2b (3 170), de los cuales 628 superan 800 USD (19.81 %). En P(B | A) el denominador es el total de pedidos altos de la empresa (2 446), de los cuales 628 son B2B (25.67 %).',
    },
    {
      id: 'chk-da2-01-2',
      type: 'mcq',
      prompt:
        'Un detector de contracargos tiene sensibilidad P(Alerta | Fraude) = 80 % y tasa de falsos positivos P(Alerta | Legítimo) = 4 %. Si la tasa base es P(Fraude) = 1 %, ¿cuál es la probabilidad posterior P(Fraude | Alerta) de que un pedido alertado sea fraude?',
      options: [
        {
          id: 'a',
          text: '16.81 %, porque los 396 falsos positivos superan ampliamente a los 80 verdaderos positivos en cada 10 000 pedidos',
          correct: true,
          feedback:
            'Exacto: sobre 10 000 pedidos hay 100 fraudes (80 alertas verdaderas) y 9 900 legítimos (396 falsas alarmas); 80 / (80 + 396) = 16.81 %.',
        },
        {
          id: 'b',
          text: '76.00 %, restando la tasa de falsos positivos (4 %) a la sensibilidad del detector (80 %)',
          correct: false,
          feedback:
            'Restar probabilidades condicionales con distinto denominador no es válido; debes ponderar cada tasa por la frecuencia previa de fraudes y pedidos legítimos.',
        },
        {
          id: 'c',
          text: '96.00 %, porque el complemento de la tasa de falsos positivos del 4 % determina la precisión de la alerta',
          correct: false,
          feedback:
            'El 96 % corresponde a la especificidad P(Sin alerta | Legítimo), que no equivale al valor predictivo positivo P(Fraude | Alerta).',
        },
      ],
      explanation:
        'Al aplicar el teorema de Bayes con frecuencias naturales sobre 10 000 órdenes: 100 son fraude (80 dan alerta) y 9 900 son legítimas (4 % = 396 dan alerta). Por tanto, P(Fraude | Alerta) = 80 / 476 = 16.81 %.',
    },
    {
      id: 'chk-da2-01-3',
      type: 'mcq',
      prompt:
        '¿Qué práctica previene la falacia de la tasa base al construir reportes de fallos de cobro en SQL?',
      options: [
        {
          id: 'a',
          text: 'Conservar tanto intentos exitosos como fallidos en el agrupamiento base y mostrar prior, verosimilitud P(Fallo | Método) y posterior P(Método | Fallo)',
          correct: true,
          feedback:
            'Correcto: conservar todos los intentos permite calcular el denominador P(Método) y separar el riesgo interno del peso sobre el total de fallos.',
        },
        {
          id: 'b',
          text: 'Filtrar WHERE status = \'failed\' antes de agrupar para ahorrar memoria y asumir que la proporción resultante mide el riesgo de cada método',
          correct: false,
          feedback:
            'Filtrar solo los fallos destruye el denominador de intentos totales por método y solo entrega P(Método | Fallo).',
        },
        {
          id: 'c',
          text: 'Asumir que P(Método | Fallo) es idéntica a P(Fallo | Método) siempre que no existan valores nulos',
          correct: false,
          feedback:
            'Ambas probabilidades tienen denominadores distintos y responden preguntas de negocio diferentes.',
        },
      ],
      explanation:
        'Para evitar sesgos de tasa base en SQL es indispensable preservar todos los intentos evaluados en el denominador y reportar tanto la probabilidad condicional P(A | B) como la posterior P(B | A).',
    },
  ],
  practice: {
    type: 'sql',
    title: 'Descomposición bayesiana de fallos de cobro en el primer intento',
    language: 'sql',
    prompt:
      'Analiza los primeros intentos de cobro (`attempt_number = 1`) en la tabla `payments`. Para cada `payment_method`, calcula: el total de primeros intentos (`total_intentos`), los intentos con `status = \'failed\'` (`intentos_fallidos`), la tasa base previa de uso del método en porcentaje redondeado a 2 decimales (`prior_metodo_pct`), la probabilidad condicional de fallo dado el método en porcentaje redondeado a 2 decimales (`prob_fallo_dado_metodo_pct`) y la probabilidad posterior de que un fallo provenga de ese método en porcentaje redondeado a 2 decimales (`posterior_metodo_dado_fallo_pct`). Ordena por `posterior_metodo_dado_fallo_pct DESC, payment_method DESC`.',
    starterCode: `WITH base AS (
  SELECT
    payment_method,
    COUNT(*) AS total_intentos,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS intentos_fallidos
  FROM payments
  WHERE attempt_number = 1
  GROUP BY payment_method
)
SELECT
  payment_method,
  total_intentos,
  intentos_fallidos,
  -- Calcula prior_metodo_pct, prob_fallo_dado_metodo_pct y posterior_metodo_dado_fallo_pct:
  0.0 AS prior_metodo_pct,
  0.0 AS prob_fallo_dado_metodo_pct,
  0.0 AS posterior_metodo_dado_fallo_pct
FROM base
ORDER BY posterior_metodo_dado_fallo_pct DESC, payment_method DESC;`,
    expected: `WITH base AS (
  SELECT
    payment_method,
    COUNT(*) AS total_intentos,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS intentos_fallidos
  FROM payments
  WHERE attempt_number = 1
  GROUP BY payment_method
)
SELECT
  payment_method,
  total_intentos,
  intentos_fallidos,
  ROUND(100.0 * total_intentos / SUM(total_intentos) OVER (), 2) AS prior_metodo_pct,
  ROUND(100.0 * intentos_fallidos / total_intentos, 2) AS prob_fallo_dado_metodo_pct,
  ROUND(100.0 * intentos_fallidos / SUM(intentos_fallidos) OVER (), 2) AS posterior_metodo_dado_fallo_pct
FROM base
ORDER BY posterior_metodo_dado_fallo_pct DESC, payment_method DESC;`,
    orderMatters: true,
    hints: [
      'Para prior_metodo_pct divide total_intentos entre SUM(total_intentos) OVER () multiplicado por 100.0.',
      'Para prob_fallo_dado_metodo_pct divide intentos_fallidos entre total_intentos; para posterior_metodo_dado_fallo_pct divide intentos_fallidos entre SUM(intentos_fallidos) OVER ().',
    ],
    solution: `WITH base AS (
  SELECT
    payment_method,
    COUNT(*) AS total_intentos,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS intentos_fallidos
  FROM payments
  WHERE attempt_number = 1
  GROUP BY payment_method
)
SELECT
  payment_method,
  total_intentos,
  intentos_fallidos,
  ROUND(100.0 * total_intentos / SUM(total_intentos) OVER (), 2) AS prior_metodo_pct,
  ROUND(100.0 * intentos_fallidos / total_intentos, 2) AS prob_fallo_dado_metodo_pct,
  ROUND(100.0 * intentos_fallidos / SUM(intentos_fallidos) OVER (), 2) AS posterior_metodo_dado_fallo_pct
FROM base
ORDER BY posterior_metodo_dado_fallo_pct DESC, payment_method DESC;`,
    solutionExplanation:
      'Como los cuatro métodos tienen una tasa base idéntica en el primer intento (25 % cada uno), la probabilidad posterior refleja directamente las diferencias en verosimilitud: transferencia_spei (11.75 % de fallo) y efectivo_tienda (11.73 %) concentran casi el 60 % de todos los fallos iniciales.',
    expectedOutputTable: [
      {
        payment_method: 'transferencia_spei',
        total_intentos: 4612,
        intentos_fallidos: 542,
        prior_metodo_pct: 25,
        prob_fallo_dado_metodo_pct: 11.75,
        posterior_metodo_dado_fallo_pct: 29.91,
      },
      {
        payment_method: 'efectivo_tienda',
        total_intentos: 4613,
        intentos_fallidos: 541,
        prior_metodo_pct: 25,
        prob_fallo_dado_metodo_pct: 11.73,
        posterior_metodo_dado_fallo_pct: 29.86,
      },
      {
        payment_method: 'card',
        total_intentos: 4612,
        intentos_fallidos: 366,
        prior_metodo_pct: 25,
        prob_fallo_dado_metodo_pct: 7.94,
        posterior_metodo_dado_fallo_pct: 20.2,
      },
      {
        payment_method: 'billetera_digital',
        total_intentos: 4613,
        intentos_fallidos: 363,
        prior_metodo_pct: 25,
        prob_fallo_dado_metodo_pct: 7.87,
        posterior_metodo_dado_fallo_pct: 20.03,
      },
    ],
  },
  roleNotes: {
    de: 'Al construir tablas agregadas para monitoreo de pagos o fraude, almacena siempre el conteo total de intentos junto al conteo de fallos; guardar solo los eventos fallidos impide recalcular probabilidades condicionales.',
    da: 'Antes de recomendar una restricción comercial sobre un segmento o medio de pago, contrasta en tu consulta SQL la verosimilitud P(Evento | Grupo) contra la probabilidad posterior P(Grupo | Evento) y la tasa base P(Grupo).',
    bi: 'En tableros de seguimiento de incidencias, evita los gráficos de pastel que solo muestran P(Canal | Incidente); acompáñalos siempre de una barra horizontal con la tasa de fallo interna de cada canal.',
  },
  summary: [
    'La probabilidad condicional P(A | B) restringe el denominador al universo donde B ya ocurrió.',
    'Confundir P(A | B) con P(B | A) se conoce como falacia de la condicional transpuesta.',
    'El teorema de Bayes actualiza la tasa base previa P(B) multiplicándola por la verosimilitud P(A | B) y dividiendo por P(A).',
    'En eventos con tasa base muy baja, incluso reglas con pocos falsos positivos generan baja precisión por alerta.',
  ],
  flashcards: [
    {
      id: 'fc-da2-01-a',
      front: '¿Qué diferencia operativa hay entre P(Fallo | Método) y P(Método | Fallo)?',
      back: 'P(Fallo | Método) divide los fallos del método entre todos los intentos de ese método (riesgo interno); P(Método | Fallo) los divide entre todos los fallos de la empresa (participación en el problema).',
    },
    {
      id: 'fc-da2-01-b',
      front: '¿En qué consiste la falacia de la tasa base al evaluar un sistema de alertas?',
      back: 'En juzgar la probabilidad de que una alerta sea verdadera mirando solo la sensibilidad del detector e ignorando cuán raro es el evento real P(A) en la población.',
    },
    {
      id: 'fc-da2-01-c',
      front: '¿Por qué las frecuencias naturales facilitan la aplicación del teorema de Bayes en SQL?',
      back: 'Porque convierten probabilidades anidadas en conteos enteros de casos totales y casos positivos sobre una misma tabla base.',
    },
  ],
  glossaryTerms: [
    'probabilidad-condicional',
    'teorema-de-bayes',
    'punto-porcentual',
  ],
  sources: [
    {
      title: "Stanford Encyclopedia of Philosophy — Bayes' Theorem",
      url: 'https://plato.stanford.edu/entries/bayes-theorem/',
      publisher: 'Stanford University',
      accessed: '2026-10-29',
      supports: 'Formulación del teorema de Bayes, tasa base previa y actualización posterior.',
    },
    {
      title: 'NIST/SEMATECH e-Handbook — Basic Probability and Conditional Rules (mpc3521)',
      url: 'https://www.itl.nist.gov/div898/handbook/mpc/section3/mpc3521.htm',
      publisher: 'National Institute of Standards and Technology (NIST)',
      accessed: '2026-10-29',
      supports: 'Reglas de probabilidad condicional, conjunta y marginal aplicadas a inspección.',
    },
    {
      title: 'OpenIntro Statistics (4th Edition) — Chapter 3: Probability',
      url: 'https://www.openintro.org/book/os/',
      publisher: 'OpenIntro',
      accessed: '2026-10-29',
      supports: 'Uso de tablas de frecuencias naturales para evitar la inversión de condicionales.',
    },
  ],
  aiNotes:
    'Los estudiantes suelen intercambiar el denominador de prob_fallo_dado_metodo_pct (que divide entre total_intentos de esa fila) con el de posterior_metodo_dado_fallo_pct (que divide entre SUM(intentos_fallidos) OVER ()), o filtrar status = \'failed\' en el CTE perdiendo total_intentos. Guía su atención a qué representa el 100 % en cada una de las tres columnas.',
};
