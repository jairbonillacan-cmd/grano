export const lesson = {
  id: 'x4-carrera-03-explicar-proyecto-2-minutos',
  moduleId: 'x4-carrera',
  tracks: ['core', 'de', 'da', 'bi'],
  level: 4,
  order: 3,
  title: 'Explicar un proyecto en 2 minutos: problema e impacto',
  subtitle: 'Explicar un proyecto técnico en 2 minutos: problema, compensaciones y resultado medido',
  minutes: 20,
  prerequisites: ['x4-carrera-02-entrevista-tecnica-sql-caso-arquitectura'],
  contentVersion: 1,
  glossaryTerms: [
    'principio-piramide-minto',
    'compensacion-tecnica-tradeoff',
    'matriz-impacto-antes-despues',
    'registro-decision-arquitectura-adr',
  ],
  hook: 'Cuando un director te pide explicar en dos minutos el proyecto principal de tu portafolio, la mayoría de los candidatos pierde el primer minuto narrando cómo descargó los archivos y qué librerías importó. Al llegar al minuto dos, aún no han dicho qué problema resolvieron ni cuánto sesgo corrigieron. ¿Cómo estructurar un guion de ciento veinte segundos que abra con la conclusión cuantificada, defienda la compensación técnica clave y cierre con una matriz de impacto verificable?',
  objectives: [
    'Estructurar una presentación técnica de 2 minutos (260 a 300 palabras) combinando el Principio de la Pirámide de Minto y el método STAR.',
    'Articular oralmente una compensación técnica de ingeniería (trade-off) contrastando la opción elegida frente a la alternativa descartada bajo restricciones reales.',
    'Construir en SQL una matriz de impacto antes y después que cuantifique al centavo el sesgo eliminado o la decisión de negocio habilitada sobre Mercado Brisa.',
  ],
  sections: [
    {
      id: 'sec-arquitectura-guion-120-segundos',
      heading: 'La arquitectura de 120 segundos: Pirámide de Minto y método STAR',
      body: `A un ritmo natural de habla profesional, dos minutos equivalen a **entre 260 y 300 palabras**. Ese presupuesto no admite rodeos cronológicos. Para capturar la atención desde el primer segundo, combina el **Principio de la Pirámide de Minto** (*answer-first*) con el método **STAR** (Situación, Tarea, Acción y Resultado).

Divide tu intervención en cuatro bloques con tiempos fijos. Del segundo \`0:00\` al \`0:20\` (**Tesis y Resultado**), abre con el impacto final medido y la decisión que habilitaste. Del segundo \`0:20\` al \`0:45\` (**Situación y Tarea**), describe el riesgo financiero u operativo previo y cuantifica la anomalía.

Del segundo \`0:45\` al \`1:25\` (**Acción y Compensación**), explica la arquitectura implementada y por qué descartaste la alternativa opuesta. Del minuto \`1:25\` al \`2:00\` (**Verificación antes y después**), cierra con las métricas comparadas. Toda cifra de tu apertura debe provenir de una consulta SQL reproducible.`,
      example: {
        language: 'sql',
        code: `WITH pagos_deduplicados AS (
  SELECT
    idempotency_key,
    amount_usd,
    status
  FROM payments
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY idempotency_key
    ORDER BY payment_ts ASC, payment_id ASC
  ) = 1
)
SELECT
  (SELECT ROUND(SUM(amount_usd), 2) FROM payments WHERE status = 'captured') AS cobros_antes_duplicados_usd,
  (SELECT ROUND(SUM(amount_usd), 2) FROM pagos_deduplicados WHERE status = 'captured') AS cobros_despues_limpios_usd,
  ROUND(
    (SELECT SUM(amount_usd) FROM payments WHERE status = 'captured') -
    (SELECT SUM(amount_usd) FROM pagos_deduplicados WHERE status = 'captured'),
    2
  ) AS sobreestimacion_eliminada_usd;`,
        expectedOutput: [
          {
            cobros_antes_duplicados_usd: 7043162.63,
            cobros_despues_limpios_usd: 6874488,
            sobreestimacion_eliminada_usd: 168674.63,
          },
        ],
      },
    },
    {
      id: 'sec-defender-compensaciones-tradeoffs',
      heading: 'Cómo explicar la compensación técnica en 40 segundos',
      body: `El bloque central de tu presentación (\`0:45–1:25\`) es donde el entrevistador calibra tu nivel de madurez. Un perfil inicial enumera nombres de paquetes: *"Usé SQL, DuckDB y Python"*. Un perfil profesional formula una **compensación técnica** (*trade-off*). Expone qué restricción enfrentó, qué dos opciones comparó, cuál eligió y qué costo controlado asumió.

En **Ingeniería de Datos (DE)** puedes explicarlo así: evaluaste deduplicar pagos por \`order_id\` frente a usar \`idempotency_key\` con ventana determinista. Elegiste \`idempotency_key\` para conservar reintentos fallidos legítimos antes del cobro exitoso, asumiendo el costo de ordenar la ventana por marca temporal.

En **Análisis de Datos (DA)** e **Inteligencia de Negocio (BI)** sigue la misma lógica. Evaluaste borrar los 213 pedidos superiores a la cerca de Tukey frente a conservarlos usando mediana y media winsorizada. Elegiste conservarlos porque borrarlos mutilaba el ocho por ciento de la facturación corporativa B2B.`,
    },
    {
      id: 'sec-matriz-antes-despues-evidencia',
      heading: 'La matriz de impacto antes y después como cierre verificable',
      body: `Para cerrar los últimos treinta y cinco segundos (\`1:25–2:00\`), conecta la corrección técnica con el cambio concreto en la toma de decisiones. Tu herramienta principal es la **matriz de impacto antes y después**. No basta con decir que ahora los datos están limpios; debes mostrar cómo cambiaron los números que ve dirección.

Una matriz antes/después bien construida en SQL calcula en las mismas filas tres elementos. Primero, la métrica antigua obtenida con el método ingenuo previo al proyecto. Segundo, la métrica nueva producida por el modelo auditado. Tercero, la columna de diferencia o **sesgo corregido** (\`metrica_antes - metrica_despues\`).

De ese modo, cualquier evaluador que ejecute tu consulta comprueba en una sola tabla la magnitud exacta del problema resuelto. Destaca siempre al final qué campaña, región o nivel de cliente cambió de posición en el ranking tras tu intervención.`,
    },
  ],
  workedExample: {
    title: 'Construcción de la evidencia para un pitch de 2 minutos en DA y BI: reevaluación de campañas',
    description:
      'Un candidato de DA/BI explica en 2 minutos su proyecto sobre las 4 campañas comerciales de Mercado Brisa (orders y marketing_spend). Antes del proyecto, el equipo evaluaba las campañas por volumen bruto de pedidos (3 000 por campaña) y GMV. Compara la vista previa frente a la matriz auditada con margen neto e inversión publicitaria.',
    steps: [
      {
        label: 'Paso 1: Calcular la vista "Antes" basada en pedidos brutos y facturación bruta (GMV)',
        explanation:
          'Mostramos primero lo que veía dirección cuando solo contaba filas en orders con campaign_id no nulo y sumaba total_usd bruto sin descontar cancelaciones, reembolsos ni gasto publicitario.',
        code: `SELECT
  o.campaign_id,
  COUNT(o.order_id) AS pedidos_brutos_antes,
  ROUND(SUM(o.total_usd), 2) AS gmv_bruto_antes_usd
FROM orders o
WHERE o.campaign_id IS NOT NULL
GROUP BY o.campaign_id
ORDER BY gmv_bruto_antes_usd DESC;`,
        expectedOutput: [
          {
            campaign_id: 'CMP-RETENCION',
            pedidos_brutos_antes: 3000,
            gmv_bruto_antes_usd: 1648915.21,
          },
          {
            campaign_id: 'CMP-BARISTA',
            pedidos_brutos_antes: 3000,
            gmv_bruto_antes_usd: 1109051.51,
          },
          {
            campaign_id: 'CMP-ORIGEN',
            pedidos_brutos_antes: 3000,
            gmv_bruto_antes_usd: 565542.84,
          },
          {
            campaign_id: 'CMP-VERANO',
            pedidos_brutos_antes: 3000,
            gmv_bruto_antes_usd: 561465.69,
          },
        ],
      },
      {
        label: 'Paso 2: Construir la matriz "Antes vs. Después" con margen neto conciliado y retorno sobre gasto',
        explanation:
          'Preagregamos costos de producto, reembolsos e inversión publicitaria (marketing_spend). La tabla demuestra en 2 minutos que CMP-VERANO consumía 109 839.33 USD de presupuesto para apenas 125 198.65 USD de margen neto (ratio 1.14x), mientras CMP-BARISTA lidera en margen neto (407 823.94 USD, ratio 18.28x).',
        code: `WITH costo_por_pedido AS (
  SELECT
    oi.order_id,
    SUM(oi.qty * p.unit_cost_usd) AS costo_usd
  FROM order_items oi
  JOIN products p ON oi.product_id = p.product_id
  WHERE p.list_price_usd > 0
  GROUP BY oi.order_id
),
reembolso_por_pedido AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS reembolso_usd
  FROM refunds
  GROUP BY order_id
),
gasto_campana AS (
  SELECT
    campaign_id,
    ROUND(SUM(spend_usd), 2) AS inversion_mkt_usd
  FROM marketing_spend
  GROUP BY campaign_id
)
SELECT
  o.campaign_id,
  COUNT(o.order_id) AS pedidos_antes,
  COUNT(o.order_id) FILTER (
    WHERE o.status = 'completed'
      AND COALESCE(r.reembolso_usd, 0) = 0
  ) AS pedidos_nsm_despues,
  ROUND(SUM(o.total_usd), 2) AS gmv_antes_usd,
  ROUND(
    SUM(o.subtotal_usd - o.discount_usd - COALESCE(cp.costo_usd, 0) - COALESCE(r.reembolso_usd, 0))
      FILTER (WHERE o.status IN ('completed', 'refunded')),
    2
  ) AS margen_neto_despues_usd,
  g.inversion_mkt_usd,
  ROUND(
    SUM(o.subtotal_usd - o.discount_usd - COALESCE(cp.costo_usd, 0) - COALESCE(r.reembolso_usd, 0))
      FILTER (WHERE o.status IN ('completed', 'refunded')) / g.inversion_mkt_usd,
    2
  ) AS ratio_margen_inversion
FROM orders o
LEFT JOIN costo_por_pedido cp ON o.order_id = cp.order_id
LEFT JOIN reembolso_por_pedido r ON o.order_id = r.order_id
JOIN gasto_campana g ON o.campaign_id = g.campaign_id
WHERE o.campaign_id IS NOT NULL
GROUP BY o.campaign_id, g.inversion_mkt_usd
ORDER BY margen_neto_despues_usd DESC;`,
        expectedOutput: [
          {
            campaign_id: 'CMP-BARISTA',
            pedidos_antes: 3000,
            pedidos_nsm_despues: 2520,
            gmv_antes_usd: 1109051.51,
            margen_neto_despues_usd: 407823.94,
            inversion_mkt_usd: 22306.35,
            ratio_margen_inversion: 18.28,
          },
          {
            campaign_id: 'CMP-RETENCION',
            pedidos_antes: 3000,
            pedidos_nsm_despues: 1940,
            gmv_antes_usd: 1648915.21,
            margen_neto_despues_usd: 404620.44,
            inversion_mkt_usd: 14102.07,
            ratio_margen_inversion: 28.69,
          },
          {
            campaign_id: 'CMP-ORIGEN',
            pedidos_antes: 3000,
            pedidos_nsm_despues: 2400,
            gmv_antes_usd: 565542.84,
            margen_neto_despues_usd: 205572.39,
            inversion_mkt_usd: 26703.45,
            ratio_margen_inversion: 7.7,
          },
          {
            campaign_id: 'CMP-VERANO',
            pedidos_antes: 3000,
            pedidos_nsm_despues: 1945,
            gmv_antes_usd: 561465.69,
            margen_neto_despues_usd: 125198.65,
            inversion_mkt_usd: 109839.33,
            ratio_margen_inversion: 1.14,
          },
        ],
      },
    ],
  },
  checks: [
    {
      id: 'chk-x4-03-minto',
      type: 'mcq',
      prompt:
        'Según el Principio de la Pirámide de Minto aplicado a una presentación técnica de 2 minutos, ¿qué debes comunicar en los primeros 20 segundos (`0:00–0:20`)?',
      options: [
        {
          id: 'a',
          text: 'La historia cronológica de cómo descargaste los archivos Parquet, qué errores de instalación tuviste y cuántas horas dedicaste a limpiar nulos.',
          correct: false,
          feedback:
            'Incorrecto. El relato cronológico consume el primer minuto sin revelar el valor del proyecto y hace que el entrevistador pierda el hilo principal.',
        },
        {
          id: 'b',
          text: 'La conclusión cuantificada (el sesgo corregido o el impacto económico medido) y la decisión de negocio o garantía operativa que tu proyecto habilitó.',
          correct: true,
          feedback:
            'Correcto. Abrir con el resultado cuantificado y la decisión habilitada fija el marco de impacto desde el primer instante y guía el resto de la explicación.',
        },
        {
          id: 'c',
          text: 'La definición teórica de qué es SQL, qué es una base de datos columnar y cómo funciona internamente el motor.',
          correct: false,
          feedback:
            'Incorrecto. El entrevistador ya conoce las definiciones básicas de las herramientas; evalúa cómo resolviste un problema concreto con ellas.',
        },
        {
          id: 'd',
          text: 'Una disculpa anticipada por las funciones adicionales que no te dio tiempo de programar en el repositorio.',
          correct: false,
          feedback:
            'Incorrecto. Nunca abras una defensa técnica restando credibilidad a tu trabajo; enfócate en el alcance logrado y sus métricas verificadas.',
        },
      ],
      explanation:
        'La comunicación answer-first coloca la conclusión cuantificada y la recomendación operativa en la cima de la pirámide durante los primeros 20 segundos de la intervención.',
    },
    {
      id: 'chk-x4-03-predict-pagos',
      type: 'predict-output',
      prompt:
        'Al presentar tu proyecto sobre la tabla `payments` de Mercado Brisa (Sección 1), ¿cuál es exactamente la sobreestimación de ingresos capturados (`sobreestimacion_eliminada_usd`) que corrigió tu deduplicación por `idempotency_key`?',
      options: [
        {
          id: 'a',
          text: '168 674.63 USD (diferencia entre 7 043 162.63 USD con duplicados y 6 874 488.00 USD limpios).',
          correct: true,
          feedback:
            'Correcto. Los webhooks duplicados con estado captured sumaban 168 674.63 USD que inflaban artificialmente el reporte de tesorería.',
        },
        {
          id: 'b',
          text: '450.00 USD (un dólar por cada webhook duplicado en la tabla payments).',
          correct: false,
          feedback:
            'Incorrecto. 450 es el conteo de filas duplicadas en payments, pero el importe monetario de los cobros capturados repetidos asciende a 168 674.63 USD.',
        },
        {
          id: 'c',
          text: '0.00 USD, porque todos los webhooks duplicados en payments tienen estado failed.',
          correct: false,
          feedback:
            'Incorrecto. La mayoría de los reintentos duplicados corresponden a cobros captured y por eso distorsionan el total recaudado.',
        },
      ],
      explanation:
        'Antes de deduplicar, los pagos captured suman 7 043 162.63 USD; tras aplicar QUALIFY ROW_NUMBER() = 1 por idempotency_key suman 6 874 488.00 USD, eliminando 168 674.63 USD de sesgo.',
    },
    {
      id: 'chk-x4-03-order-pitch',
      type: 'order',
      prompt:
        'Ordena los 4 bloques cronometrados de un guion técnico de 2 minutos (`120 segundos`) para defender tu proyecto de portafolio:',
      items: [
        '0:00–0:20 · Tesis e impacto: conclusión cuantificada y decisión de negocio u operación habilitada.',
        '0:20–0:45 · Situación y diagnóstico: qué anomalía, sesgo o cuello de botella existía en los datos crudos.',
        '0:45–1:25 · Acción y compensación técnica: qué arquitectura implementaste y por qué elegiste B frente a A.',
        '1:25–2:00 · Matriz antes/después y control: comparación de cifras previas frente a auditadas y pruebas activas.',
      ],
      correctOrder: [
        '0:00–0:20 · Tesis e impacto: conclusión cuantificada y decisión de negocio u operación habilitada.',
        '0:20–0:45 · Situación y diagnóstico: qué anomalía, sesgo o cuello de botella existía en los datos crudos.',
        '0:45–1:25 · Acción y compensación técnica: qué arquitectura implementaste y por qué elegiste B frente a A.',
        '1:25–2:00 · Matriz antes/después y control: comparación de cifras previas frente a auditadas y pruebas activas.',
      ],
      explanation:
        'Esta estructura garantiza que el impacto quede claro en los primeros 20 segundos, el problema a los 45 segundos, la compensación técnica al minuto 25 y la evidencia comparativa al cierre.',
    },
  ],
  practice: {
    type: 'sql',
    title: 'Matriz SQL de impacto Antes (SCD1 As-Is) vs. Después (SCD2 As-Was) para tu pitch de 2 minutos',
    language: 'sql',
    prompt:
      'Construye la **matriz de impacto antes y después** para defender en 2 minutos por qué modelaste el historial de fidelidad de clientes con SCD Tipo 2 (`customer_changes`) en lugar de usar el atributo actual `customers.current_tier` (SCD Tipo 1) sobre los pedidos completados (`o.status = \'completed\'`). Debes: 1) calcular en una CTE `antes_scd1` por cada nivel (`c.current_tier AS tier`) los pedidos (`COUNT(o.order_id) AS pedidos_antes`) y el ingreso total (`SUM(o.total_usd) AS ingreso_antes_usd`); 2) calcular en otra CTE `despues_scd2` por cada nivel histórico (`cc.tier AS tier`) los pedidos (`COUNT(o.order_id) AS pedidos_despues`) y el ingreso total (`SUM(o.total_usd) AS ingreso_despues_usd`) uniendo `orders o` con `customer_changes cc` mediante `o.customer_id = cc.customer_id AND o.order_ts >= cc.valid_from AND (cc.valid_to IS NULL OR o.order_ts < cc.valid_to)`; y 3) unir ambas CTEs por `tier` para devolver `tier`, `pedidos_antes`, `pedidos_despues`, `ROUND(a.ingreso_antes_usd, 2) AS ingreso_antes_usd`, `ROUND(d.ingreso_despues_usd, 2) AS ingreso_despues_usd` y `ROUND(a.ingreso_antes_usd - d.ingreso_despues_usd, 2) AS sesgo_corregido_usd`. Ordena por `ingreso_despues_usd DESC`.',
    starterCode: `-- Consulta inicial que solo muestra el estado "Antes" (SCD1 con current_tier) sin comparar con SCD2:
SELECT
  c.current_tier AS tier,
  COUNT(o.order_id) AS pedidos_antes,
  ROUND(SUM(o.total_usd), 2) AS ingreso_antes_usd
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.status = 'completed'
GROUP BY c.current_tier
ORDER BY ingreso_antes_usd DESC;`,
    expected: `WITH antes_scd1 AS (
  SELECT
    c.current_tier AS tier,
    COUNT(o.order_id) AS pedidos_antes,
    SUM(o.total_usd) AS ingreso_antes_usd
  FROM orders o
  JOIN customers c ON o.customer_id = c.customer_id
  WHERE o.status = 'completed'
  GROUP BY c.current_tier
),
despues_scd2 AS (
  SELECT
    cc.tier AS tier,
    COUNT(o.order_id) AS pedidos_despues,
    SUM(o.total_usd) AS ingreso_despues_usd
  FROM orders o
  JOIN customer_changes cc
    ON o.customer_id = cc.customer_id
   AND o.order_ts >= cc.valid_from
   AND (cc.valid_to IS NULL OR o.order_ts < cc.valid_to)
  WHERE o.status = 'completed'
  GROUP BY cc.tier
)
SELECT
  a.tier,
  a.pedidos_antes,
  d.pedidos_despues,
  ROUND(a.ingreso_antes_usd, 2) AS ingreso_antes_usd,
  ROUND(d.ingreso_despues_usd, 2) AS ingreso_despues_usd,
  ROUND(a.ingreso_antes_usd - d.ingreso_despues_usd, 2) AS sesgo_corregido_usd
FROM antes_scd1 a
JOIN despues_scd2 d ON a.tier = d.tier
ORDER BY ingreso_despues_usd DESC;`,
    orderMatters: true,
    hints: [
      'Transforma la consulta inicial en la primera CTE: WITH antes_scd1 AS (SELECT c.current_tier AS tier, COUNT(o.order_id) AS pedidos_antes, SUM(o.total_usd) AS ingreso_antes_usd FROM orders o JOIN customers c ON o.customer_id = c.customer_id WHERE o.status = \'completed\' GROUP BY c.current_tier).',
      'Añade la segunda CTE despues_scd2 agrupando por cc.tier y cruzando orders o JOIN customer_changes cc ON o.customer_id = cc.customer_id AND o.order_ts >= cc.valid_from AND (cc.valid_to IS NULL OR o.order_ts < cc.valid_to) con WHERE o.status = \'completed\'.',
      'En el SELECT final haz JOIN entre antes_scd1 a y despues_scd2 d ON a.tier = d.tier, redondea los tres importes a 2 decimales y ordena por ingreso_despues_usd DESC.',
    ],
    solution: `WITH antes_scd1 AS (
  SELECT
    c.current_tier AS tier,
    COUNT(o.order_id) AS pedidos_antes,
    SUM(o.total_usd) AS ingreso_antes_usd
  FROM orders o
  JOIN customers c ON o.customer_id = c.customer_id
  WHERE o.status = 'completed'
  GROUP BY c.current_tier
),
despues_scd2 AS (
  SELECT
    cc.tier AS tier,
    COUNT(o.order_id) AS pedidos_despues,
    SUM(o.total_usd) AS ingreso_despues_usd
  FROM orders o
  JOIN customer_changes cc
    ON o.customer_id = cc.customer_id
   AND o.order_ts >= cc.valid_from
   AND (cc.valid_to IS NULL OR o.order_ts < cc.valid_to)
  WHERE o.status = 'completed'
  GROUP BY cc.tier
)
SELECT
  a.tier,
  a.pedidos_antes,
  d.pedidos_despues,
  ROUND(a.ingreso_antes_usd, 2) AS ingreso_antes_usd,
  ROUND(d.ingreso_despues_usd, 2) AS ingreso_despues_usd,
  ROUND(a.ingreso_antes_usd - d.ingreso_despues_usd, 2) AS sesgo_corregido_usd
FROM antes_scd1 a
JOIN despues_scd2 d ON a.tier = d.tier
ORDER BY ingreso_despues_usd DESC;`,
    solutionExplanation:
      'La matriz antes/después demuestra en una sola tabla que usar current_tier (SCD1) sobreasignaba +412 601.01 USD al nivel oro y +198 246.41 USD a platino, mientras subestimaba en -628 099.05 USD las compras realizadas cuando esos clientes aún pertenecían al nivel bronce.',
    expectedOutputTable: [
      {
        tier: 'oro',
        pedidos_antes: 6468,
        pedidos_despues: 5485,
        ingreso_antes_usd: 2910010.27,
        ingreso_despues_usd: 2497409.26,
        sesgo_corregido_usd: 412601.01,
      },
      {
        tier: 'plata',
        pedidos_antes: 4630,
        pedidos_despues: 4567,
        ingreso_antes_usd: 1873949.75,
        ingreso_despues_usd: 1856698.12,
        sesgo_corregido_usd: 17251.63,
      },
      {
        tier: 'bronce',
        pedidos_antes: 2247,
        pedidos_despues: 3746,
        ingreso_antes_usd: 900084.3,
        ingreso_despues_usd: 1528183.35,
        sesgo_corregido_usd: -628099.05,
      },
      {
        tier: 'platino',
        pedidos_antes: 1415,
        pedidos_despues: 962,
        ingreso_antes_usd: 585418.1,
        ingreso_despues_usd: 387171.69,
        sesgo_corregido_usd: 198246.41,
      },
    ],
  },
  roleNotes: {
    de: 'Al explicar un proyecto de Ingeniería de Datos en 2 minutos, abre con el volumen de registros corregidos o la reducción de fallos e incluye siempre la compensación entre costo de cómputo/almacenamiento y garantías de consistencia (idempotencia y SCD Tipo 2).',
    da: 'Al explicar un proyecto de Análisis de Datos en 2 minutos, abre con la hipótesis refutada y la cifra económica que cambia la decisión, explicando en el bloque central por qué elegiste métricas resistentes o filtros de atrición específicos.',
    bi: 'Al explicar un proyecto de Inteligencia de Negocio en 2 minutos, abre con la discrepancia financiera resuelta entre áreas y cómo el árbol de la Métrica Estrella del Norte con sus métricas guardarraíl modificó la asignación de presupuesto.',
  },
  summary: [
    'Un guion de 2 minutos abarca 260 a 300 palabras en 4 bloques: tesis cuantificada, problema, compensación y matriz final.',
    'El Principio de la Pirámide de Minto exige abrir los primeros 20 segundos con el resultado medido y la decisión habilitada.',
    'Explicar una compensación técnica contrasta dos alternativas viables y declara qué beneficio se priorizó y qué costo se asumió.',
    'La matriz SQL de impacto antes y después compara la métrica previa frente a la corregida en una misma tabla.',
  ],
  flashcards: [
    {
      id: 'fc-x4-03-1',
      front: '¿Cuántas palabras caben en una explicación técnica de 2 minutos a ritmo profesional y cómo se reparten?',
      back: 'Entre 260 y 300 palabras repartidas en 4 bloques: 0:00–0:20 Tesis e impacto (~40 palabras), 0:20–0:45 Problema (~65 palabras), 0:45–1:25 Acción y compensación (~95 palabras) y 1:25–2:00 Matriz antes/después (~70 palabras).',
    },
    {
      id: 'fc-x4-03-2',
      front: '¿En qué consiste el Principio de la Pirámide de Minto aplicado a una entrevista técnica?',
      back: 'En abrir la respuesta con la conclusión cuantificada y la decisión de negocio (comunicación answer-first) antes de desglosar las causas metodológicas y el detalle del código.',
    },
    {
      id: 'fc-x4-03-3',
      front: '¿Qué estructura verbal de una frase permite articular una compensación técnica (trade-off)?',
      back: '"Ante la restricción X, evalué la opción A frente a la opción B; elegí B porque ganábamos el beneficio Y, asumiendo de forma controlada el costo Z".',
    },
    {
      id: 'fc-x4-03-4',
      front: '¿Qué sesgo financiero corrige el modelo SCD Tipo 2 (`customer_changes`) frente a `current_tier` en los pedidos completados de Mercado Brisa?',
      back: 'Corrige una sobreasignación de +412 601.01 USD en el nivel `oro` y +198 246.41 USD en `platino`, que en realidad ocurrieron cuando esos clientes aún tenían nivel `bronce` (-628 099.05 USD subestimados).',
    },
  ],
  sources: [
    {
      title: 'The STAR Method for Behavioral Interviews',
      url: 'https://capd.mit.edu/resources/the-star-method-for-behavioral-interviews/',
      publisher: 'MIT Career Advising & Professional Development (CAPD)',
      accessed: '2026-10-29',
      supports: 'Estructura Situación, Tarea, Acción y Resultado cuantificado para presentar proyectos técnicos.',
    },
    {
      title: 'The Minto Pyramid Principle: Logic in Writing, Thinking, & Problem Solving',
      url: 'https://barbaraminto.com/',
      publisher: 'Minto International (Barbara Minto)',
      accessed: '2026-10-29',
      supports: 'Comunicación answer-first abriendo con la conclusión principal respaldada por argumentos agrupados.',
    },
    {
      title: 'Architectural Decision Records (ADR)',
      url: 'https://adr.github.io/',
      publisher: 'Architectural Decision Records Organization',
      accessed: '2026-10-29',
      supports: 'Síntesis de decisiones técnicas y compensaciones entre alternativas bajo restricciones reales.',
    },
    {
      title: 'Software Architecture Guide',
      url: 'https://martinfowler.com/architecture/',
      publisher: 'Martin Fowler (martinfowler.com)',
      accessed: '2026-10-29',
      supports: 'Justificación de decisiones arquitectónicas costosas de revertir y evaluación de sus compensaciones.',
    },
  ],
  aiNotes:
    'Al revisar las respuestas o el guion de 2 minutos del estudiante, verifica que empiece con la conclusión cuantificada (Principio de Minto) y que mencione explícitamente qué compensación técnica asumió. En la práctica SQL, recuerda que el starterCode solo calcula la vista SCD1 con customers.current_tier (3 columnas), por lo que le falta la CTE despues_scd2 con el cruce por intervalo temporal sobre customer_changes y la columna sesgo_corregido_usd.',
};

export default lesson;
