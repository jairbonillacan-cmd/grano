const lesson = {
  id: 'c0-negocio-02-embudos-conversion',
  moduleId: 'c0-negocio',
  tracks: ['core'],
  level: 0,
  order: 2,
  title: 'Embudos de adquisición y conversión paso a paso',
  minutes: 15,
  prerequisites: ['c0-negocio-01-ingreso-costo-margen'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), el equipo comercial afirma que el 82 % de los pedidos creados terminan completados sin reembolso, pero no sabe si la pérdida del 18 % restante ocurre porque falla el cobro bancario o porque el cliente devuelve el pedido días después. Al mismo tiempo, la tabla web `events` registra 65 000 filas con reintentos duplicados de red móvil. ¿Cómo construyes un embudo limpio que localice en qué paso exacto se escapan las ventas?',

  objectives: [
    'Definir la unidad de conteo única de un embudo usando COUNT(DISTINCT) para evitar inflación por eventos repetidos.',
    'Calcular la tasa de conversión paso a paso, la conversión global acumulada y la tasa de caída (drop-off).',
    'Diagnosticar en qué etapa del flujo se encuentra el cuello de botella comparando pasos consecutivos en SQL.'
  ],

  sections: [
    {
      id: 'unidad-de-conteo-en-un-embudo',
      heading: 'Qué es un embudo y por qué nunca se cuentan eventos brutos',
      body: 'Un **embudo de conversión** (*funnel*) mide cuántas entidades avanzan por una serie ordenada de pasos hacia una meta de negocio. Por ejemplo, en publicidad el recorrido es impresión, clic y compra atribuida; en el cobro de un pedido, es orden creada, pago capturado y pedido completado sin devolución.\n\nAntes de dividir números, debes fijar la **unidad de conteo**: ¿cuentas sesiones únicas (`session_id`), clientes únicos (`customer_id`) o pedidos únicos (`order_id`)? En la tabla `events` de Mercado Brisa (empresa ficticia), los teléfonos con mala señal reenvían el mismo evento dos veces, generando 1 200 filas duplicadas (240 por cada tipo de evento). Si usas `COUNT(*)`, inflarás cada escalón del embudo. Para contar cada sesión una sola vez por etapa, se utiliza `COUNT(DISTINCT session_id)`.',
      example: {
        language: 'sql',
        code: `SELECT
  event_type,
  COUNT(*) AS eventos_brutos,
  COUNT(DISTINCT session_id) AS sesiones_unicas,
  COUNT(*) - COUNT(DISTINCT session_id) AS eventos_duplicados_reintento
FROM events
GROUP BY event_type
ORDER BY eventos_brutos DESC, event_type ASC;`,
        expectedOutput: [
          {
            event_type: 'add_to_cart',
            eventos_brutos: 15400,
            sesiones_unicas: 15160,
            eventos_duplicados_reintento: 240
          },
          {
            event_type: 'checkout_completed',
            eventos_brutos: 15400,
            sesiones_unicas: 15160,
            eventos_duplicados_reintento: 240
          },
          {
            event_type: 'checkout_started',
            eventos_brutos: 15400,
            sesiones_unicas: 15160,
            eventos_duplicados_reintento: 240
          },
          {
            event_type: 'page_view',
            eventos_brutos: 9400,
            sesiones_unicas: 9160,
            eventos_duplicados_reintento: 240
          },
          {
            event_type: 'product_view',
            eventos_brutos: 9400,
            sesiones_unicas: 9160,
            eventos_duplicados_reintento: 240
          }
        ]
      }
    },
    {
      id: 'conversion-por-paso-frente-a-global',
      heading: 'Conversión paso a paso, conversión global y tasa de caída',
      body: 'En todo embudo conviven dos porcentajes que responden preguntas distintas y no deben mezclarse:\n\n1. **Conversión paso a paso** (*step conversion*): divide quienes llegan al paso actual entre quienes estaban en el paso inmediatamente anterior (`paso_k / paso_k_menos_1 * 100`). Su complemento a cien (`100 % - conversión_paso`) es la **tasa de caída** (*drop-off*), que señala qué pantalla o proceso tiene fricción.\n2. **Conversión global** (*overall conversion*): divide quienes completan el último paso entre quienes entraron en el primer paso (`paso_final / paso_1 * 100`).\n\nMatemáticamente, la conversión global equivale a multiplicar las tasas de cada paso. Si de 1 000 carritos el 90 % logra pagar (900) y de esos 900 el 91,11 % no pide reembolso (820), la conversión global es `0,90 * 0,9111 = 82,00 %`.'
    },
    {
      id: 'embudos-cerrados-abiertos-y-cuellos-de-botella',
      heading: 'Embudos cerrados frente a abiertos y detección del cuello de botella',
      body: 'Al analizar eventos de navegación, las herramientas como Amplitude o Google Analytics distinguen entre un **embudo cerrado** (solo cuenta a quienes entraron obligatoriamente por el paso 1 en orden secuencial) y un **embudo abierto** (permite que alguien entre directamente en el paso 3, por ejemplo desde un enlace directo al carrito).\n\nEn Mercado Brisa, la tabla `events` combina sesiones de navegación general con eventos previos al pedido, por lo que `add_to_cart` tiene más sesiones totales que `page_view`. Si construyes un embudo sin exigir que la entidad haya pasado por el paso inicial, obtendrás tasas superiores al 100 %. Por eso, al auditar pedidos desde su creación hasta su entrega efectiva, anclamos el paso 1 en la tabla `orders`.'
    }
  ],

  workedExample: {
    title: 'Del embudo publicitario al embudo de cobro y retención de pedidos',
    description: 'Analiza primero el embudo de adquisición por canal en `marketing_spend` y luego el embudo transaccional entre `orders` y `payments`.',
    steps: [
      {
        label: 'Paso 1 — Embudo de adquisición: impresiones a clics (CTR) y clics a compra',
        explanation: 'En `marketing_spend`, separamos la tasa de clic (`ctr_paso1_pct = clics / impresiones`) de la conversión tras el clic (`conv_paso2_pct = conversiones / clics`). El canal `referral` convierte mejor el clic en compra (5,76 %) que `paid_social` (5,67 %).',
        code: `SELECT
  channel,
  SUM(impressions) AS impresiones,
  SUM(clicks) AS clics,
  SUM(attributed_conversions) AS conversiones,
  ROUND(SUM(clicks) * 100.0 / SUM(impressions), 2) AS ctr_paso1_pct,
  ROUND(SUM(attributed_conversions) * 100.0 / SUM(clicks), 2) AS conv_paso2_pct,
  ROUND(SUM(attributed_conversions) * 100.0 / SUM(impressions), 4) AS conv_global_pct
FROM marketing_spend
GROUP BY channel
ORDER BY impresiones DESC;`,
        expectedOutput: [
          {
            channel: 'paid_social',
            impresiones: 3213897,
            clics: 79925,
            conversiones: 4530,
            ctr_paso1_pct: 2.49,
            conv_paso2_pct: 5.67,
            conv_global_pct: 0.141
          },
          {
            channel: 'display_video',
            impresiones: 2319080,
            clics: 58708,
            conversiones: 3355,
            ctr_paso1_pct: 2.53,
            conv_paso2_pct: 5.71,
            conv_global_pct: 0.1447
          },
          {
            channel: 'organic_search',
            impresiones: 1377667,
            clics: 33785,
            conversiones: 1925,
            ctr_paso1_pct: 2.45,
            conv_paso2_pct: 5.7,
            conv_global_pct: 0.1397
          },
          {
            channel: 'referral',
            impresiones: 1131587,
            clics: 28511,
            conversiones: 1641,
            ctr_paso1_pct: 2.52,
            conv_paso2_pct: 5.76,
            conv_global_pct: 0.145
          },
          {
            channel: 'email_campaign',
            impresiones: 720737,
            clics: 17651,
            conversiones: 1013,
            ctr_paso1_pct: 2.45,
            conv_paso2_pct: 5.74,
            conv_global_pct: 0.1406
          }
        ]
      },
      {
        label: 'Paso 2 — Embudo operativo: pedido creado, pago capturado y pedido retenido',
        explanation: 'Unimos `orders` con los pedidos que lograron cobro (`status = \'captured\'` en `payments`, deduplicados con `DISTINCT`) y los que cerraron sin reembolso total (`status = \'completed\'`). Vemos que el 10 % cae en el cobro y casi el 8,9 % adicional cae por reembolso posterior.',
        code: `WITH pagos_exitosos AS (
  SELECT DISTINCT order_id
  FROM payments
  WHERE status = 'captured'
),
pedidos_sin_devolucion_total AS (
  SELECT order_id
  FROM orders
  WHERE status = 'completed'
)
SELECT
  o.device_type,
  COUNT(o.order_id) AS paso1_pedidos_creados,
  COUNT(p.order_id) AS paso2_pagos_capturados,
  COUNT(c.order_id) AS paso3_pedidos_retenidos,
  ROUND(COUNT(p.order_id) * 100.0 / COUNT(o.order_id), 2) AS conv_creado_a_pago_pct,
  ROUND(COUNT(c.order_id) * 100.0 / COUNT(p.order_id), 2) AS conv_pago_a_retenido_pct,
  ROUND(COUNT(c.order_id) * 100.0 / COUNT(o.order_id), 2) AS conv_global_pct
FROM orders o
LEFT JOIN pagos_exitosos p ON o.order_id = p.order_id
LEFT JOIN pedidos_sin_devolucion_total c ON o.order_id = c.order_id
GROUP BY o.device_type
ORDER BY paso1_pedidos_creados DESC;`,
        expectedOutput: [
          {
            device_type: 'desktop',
            paso1_pedidos_creados: 7716,
            paso2_pagos_capturados: 6944,
            paso3_pedidos_retenidos: 6327,
            conv_creado_a_pago_pct: 89.99,
            conv_pago_a_retenido_pct: 91.11,
            conv_global_pct: 82
          },
          {
            device_type: 'mobile',
            paso1_pedidos_creados: 6857,
            paso2_pagos_capturados: 6171,
            paso3_pedidos_retenidos: 5624,
            conv_creado_a_pago_pct: 90,
            conv_pago_a_retenido_pct: 91.14,
            conv_global_pct: 82.02
          },
          {
            device_type: 'pos_tienda',
            paso1_pedidos_creados: 3427,
            paso2_pagos_capturados: 3085,
            paso3_pedidos_retenidos: 2809,
            conv_creado_a_pago_pct: 90.02,
            conv_pago_a_retenido_pct: 91.05,
            conv_global_pct: 81.97
          }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'predict-output',
      prompt: 'Un embudo tiene 2 000 sesiones en el Paso 1 (vista de producto), 500 en el Paso 2 (carrito) y 200 en el Paso 3 (compra). ¿Cuáles son la conversión del Paso 2 al Paso 3 y la conversión global?',
      options: [
        {
          id: 'a',
          text: 'La conversión del Paso 2 al Paso 3 es 40.0 % (200 / 500) y la conversión global es 10.0 % (200 / 2 000).',
          correct: true,
          feedback: 'Exacto. El paso 2 al 3 mide cuántos carritos compraron (200 de 500 = 40 %), mientras que la global compara contra el inicio (200 de 2 000 = 10 %).'
        },
        {
          id: 'b',
          text: 'Ambas tasas son 10.0 %, porque siempre se divide entre las 2 000 sesiones iniciales.',
          correct: false,
          feedback: 'Incorrecto. Dividir siempre entre el Paso 1 da la conversión acumulada, no la conversión entre el Paso 2 y el Paso 3.'
        },
        {
          id: 'c',
          text: 'La conversión del Paso 2 al Paso 3 es 25.0 % y la conversión global es 40.0 %.',
          correct: false,
          feedback: 'Incorrecto. 25 % es la conversión del Paso 1 al Paso 2 (500 / 2 000), y 40 % es la del Paso 2 al Paso 3 (200 / 500).'
        }
      ],
      explanation: 'La conversión paso a paso divide el conteo del paso actual entre el conteo del paso inmediato anterior (200 / 500 = 40 %), aislando la eficiencia de esa transición específica.'
    },
    {
      id: 'c2',
      type: 'mcq',
      prompt: 'En la tabla `payments` hay pedidos con un primer intento `failed` y un segundo intento `captured`, además de 450 filas duplicadas por reenvío del webhook. Si quieres contar cuántos pedidos lograron cobrarse, ¿qué expresión debes usar?',
      options: [
        {
          id: 'a',
          text: 'COUNT(DISTINCT order_id) filtrando status = \'captured\'.',
          correct: true,
          feedback: 'Correcto. COUNT(DISTINCT order_id) con el filtro de estado capturado cuenta cada pedido cobrado exactamente una vez, sin importar cuántos webhooks duplicados llegaron.'
        },
        {
          id: 'b',
          text: 'COUNT(*) filtrando status = \'captured\'.',
          correct: false,
          feedback: 'Incorrecto. COUNT(*) incluirá los webhooks duplicados y hará creer que se cobraron más pedidos de los que realmente existen.'
        },
        {
          id: 'c',
          text: 'COUNT(payment_id) sin cláusula WHERE.',
          correct: false,
          feedback: 'Incorrecto. Eso cuenta los 19 200 intentos de cobro, incluyendo pagos fallidos, pendientes y duplicados.'
        }
      ],
      explanation: 'La unidad del embudo debe coincidir con la entidad de negocio (`order_id`). Usar `COUNT(DISTINCT order_id)` protege el cálculo contra reintentos y eventos duplicados.'
    },
    {
      id: 'c3',
      type: 'mcq',
      prompt: 'En el ejemplo anterior, de 2 000 sesiones iniciales pasan 500 al carrito (caen 1 500, tasa de caída del 75 %) y de esas 500 compran 200 (caen 300, tasa de caída del 60 %). ¿En qué transición está el mayor cuello de botella relativo y absoluto?',
      options: [
        {
          id: 'a',
          text: 'Entre la vista de producto y el carrito: pierde 1 500 sesiones y presenta una tasa de caída del 75 %.',
          correct: true,
          feedback: 'Correcto. Tanto en volumen absoluto (1 500 sesiones perdidas) como en proporción (75 % de abandono), la primera transición es el principal punto de fuga.'
        },
        {
          id: 'b',
          text: 'Entre el carrito y la compra, porque solo compran 200 personas.',
          correct: false,
          feedback: 'Incorrecto. Que el número final sea menor es normal en cualquier embudo; la transición del carrito a la compra retiene el 40 % (mejor que el 25 % del primer paso).'
        },
        {
          id: 'c',
          text: 'En ninguna, porque la conversión global del 10 % es igual a la suma de las caídas.',
          correct: false,
          feedback: 'Incorrecto. La conversión global es el producto de las tasas de continuación (0.25 × 0.40 = 0.10), no la suma.'
        }
      ],
      explanation: 'Para priorizar mejoras de producto, comparamos tanto la caída porcentual de cada paso (100 % menos conversión del paso) como el volumen absoluto de usuarios que abandonan.'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Embudo de pedidos por campaña con cláusula FILTER',
    language: 'sql',
    prompt: 'Construye el embudo de pedidos por campaña (`COALESCE(campaign_id, \'ORG-SIN-CAMPANA\') AS campana`) sobre la tabla `orders`. Calcula: `pedidos_iniciados` (`COUNT(order_id)`), `pedidos_cobrados` (con `status IN (\'completed\', \'refunded\')`), `pedidos_exitosos_netos` (con `status = \'completed\'`) y `conversion_neta_pct` (porcentaje de `pedidos_exitosos_netos` sobre `pedidos_iniciados` redondeado a 2 decimales). Ordena por `pedidos_iniciados` DESC y `campana` ASC.',
    starterCode: `SELECT
  COALESCE(campaign_id, 'ORG-SIN-CAMPANA') AS campana,
  COUNT(order_id) AS pedidos_iniciados,
  COUNT(order_id) FILTER (WHERE status IN ('completed', 'refunded')) AS pedidos_cobrados,
  -- Completa pedidos_exitosos_netos contando solo cuando status = 'completed'
  0 AS pedidos_exitosos_netos,
  -- Completa conversion_neta_pct dividiendo los completados * 100.0 entre COUNT(order_id) con ROUND(..., 2)
  0.0 AS conversion_neta_pct
FROM orders
GROUP BY COALESCE(campaign_id, 'ORG-SIN-CAMPANA')
ORDER BY pedidos_iniciados DESC, campana ASC;`,
    expected: `SELECT
  COALESCE(campaign_id, 'ORG-SIN-CAMPANA') AS campana,
  COUNT(order_id) AS pedidos_iniciados,
  COUNT(order_id) FILTER (WHERE status IN ('completed', 'refunded')) AS pedidos_cobrados,
  COUNT(order_id) FILTER (WHERE status = 'completed') AS pedidos_exitosos_netos,
  ROUND(COUNT(order_id) FILTER (WHERE status = 'completed') * 100.0 / COUNT(order_id), 2) AS conversion_neta_pct
FROM orders
GROUP BY COALESCE(campaign_id, 'ORG-SIN-CAMPANA')
ORDER BY pedidos_iniciados DESC, campana ASC;`,
    orderMatters: true,
    hints: [
      'Usa `COUNT(order_id) FILTER (WHERE status = \'completed\') AS pedidos_exitosos_netos` para contar el tercer escalón del embudo.',
      'Multiplica por `100.0` antes de dividir entre `COUNT(order_id)` para obtener el porcentaje con decimales.',
      'Envuelve el porcentaje en `ROUND(..., 2) AS conversion_neta_pct`.'
    ],
    solution: `SELECT
  COALESCE(campaign_id, 'ORG-SIN-CAMPANA') AS campana,
  COUNT(order_id) AS pedidos_iniciados,
  COUNT(order_id) FILTER (WHERE status IN ('completed', 'refunded')) AS pedidos_cobrados,
  COUNT(order_id) FILTER (WHERE status = 'completed') AS pedidos_exitosos_netos,
  ROUND(COUNT(order_id) FILTER (WHERE status = 'completed') * 100.0 / COUNT(order_id), 2) AS conversion_neta_pct
FROM orders
GROUP BY COALESCE(campaign_id, 'ORG-SIN-CAMPANA')
ORDER BY pedidos_iniciados DESC, campana ASC;`,
    solutionExplanation: 'La cláusula `FILTER (WHERE ...)` evalúa cada etapa del embudo sobre la misma tabla `orders` en una sola lectura, mostrando que `CMP-BARISTA` y `CMP-VERANO` convierten el 84 % de sus pedidos iniciados frente al 80 % de `CMP-ORIGEN` y `CMP-RETENCION`.',
    expectedOutputTable: [
      {
        campana: 'ORG-SIN-CAMPANA',
        pedidos_iniciados: 6000,
        pedidos_cobrados: 5400,
        pedidos_exitosos_netos: 4920,
        conversion_neta_pct: 82
      },
      {
        campana: 'CMP-BARISTA',
        pedidos_iniciados: 3000,
        pedidos_cobrados: 2760,
        pedidos_exitosos_netos: 2520,
        conversion_neta_pct: 84
      },
      {
        campana: 'CMP-ORIGEN',
        pedidos_iniciados: 3000,
        pedidos_cobrados: 2640,
        pedidos_exitosos_netos: 2400,
        conversion_neta_pct: 80
      },
      {
        campana: 'CMP-RETENCION',
        pedidos_iniciados: 3000,
        pedidos_cobrados: 2640,
        pedidos_exitosos_netos: 2400,
        conversion_neta_pct: 80
      },
      {
        campana: 'CMP-VERANO',
        pedidos_iniciados: 3000,
        pedidos_cobrados: 2760,
        pedidos_exitosos_netos: 2520,
        conversion_neta_pct: 84
      }
    ]
  },

  roleNotes: {
    de: 'Garantiza que cada evento de telemetría incluya un identificador de sesión (`session_id`) y una clave de deduplicación. Sin eso, los reintentos desde redes móviles inflan los conteos de los primeros pasos del embudo.',
    da: 'Nunca reportes únicamente la tasa de conversión global de punta a punta. Desglosa siempre las tasas de paso intermedio y segmenta por dispositivo o canal para aislar dónde se produce el abandono.',
    bi: 'En los tableros de seguimiento comercial, acompaña cada barra del embudo con dos cifras: el volumen absoluto de entidades que continúan y el porcentaje de conversión respecto al paso inmediato anterior.'
  },

  summary: [
    'Un embudo mide el avance por etapas usando una unidad de conteo única como sesión, cliente o pedido.',
    'Contar eventos brutos con COUNT(*) sin deduplicar reintentos distorsiona todas las tasas de conversión.',
    'La conversión por paso divide entre el escalón anterior; la conversión global divide entre el primer escalón.',
    'La tasa de caída (100 % menos conversión del paso) señala el cuello de botella exacto del proceso.'
  ],

  flashcards: [
    {
      id: 'fc-c0-negocio-02-a',
      front: '¿Por qué un embudo sobre tablas de eventos debe usar COUNT(DISTINCT session_id) en lugar de COUNT(*)?',
      back: 'Porque un usuario puede disparar varias veces el mismo evento en una sesión o la red puede reenviar duplicados; COUNT(DISTINCT) cuenta cada sesión una sola vez por paso.'
    },
    {
      id: 'fc-c0-negocio-02-b',
      front: '¿Qué diferencia matemática hay entre conversión del paso k y conversión global al paso k?',
      back: 'La conversión del paso k divide entre los que llegaron al paso k-1; la conversión global divide entre todos los que iniciaron en el paso 1.'
    },
    {
      id: 'fc-c0-negocio-02-c',
      front: '¿Qué diferencia a un embudo cerrado de un embudo abierto?',
      back: 'El embudo cerrado exige que la entidad haya entrado por el paso 1 en orden secuencial, mientras que el abierto admite entradas directas en pasos intermedios.'
    }
  ],

  glossaryTerms: [
    'embudo-conversion',
    'tasa-caida-dropoff'
  ],

  sources: [
    {
      title: 'Interpret your Funnel Analysis: Conversion Rate, Drop-off & Time to Convert',
      url: 'https://amplitude.com/docs/analytics/charts/funnel-analysis/funnel-analysis-interpret',
      publisher: 'Amplitude Documentation',
      accessed: '2026-10-29',
      supports: 'Definición de conversión total, conversión por paso, mayor caída (drop-off) y unidad única de conteo.'
    },
    {
      title: 'GA4 Funnel Exploration: Open vs. Closed Funnels',
      url: 'https://support.google.com/analytics/answer/9327974',
      publisher: 'Google Analytics Help',
      accessed: '2026-10-29',
      supports: 'Comportamiento de embudos cerrados frente a abiertos y cálculo de tasas de abandono entre etapas.'
    },
    {
      title: 'DuckDB FILTER Clause in Aggregate Expressions',
      url: 'https://duckdb.org/docs/sql/query_syntax/filter.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Construcción de conteos condicionales por etapa mediante COUNT(...) FILTER (WHERE ...).'
    }
  ],

  aiNotes: 'El error más frecuente es confundir el denominador de la conversión por paso (el paso k-1) con el de la conversión global (el paso 1), o usar `COUNT(*)` sobre tablas de eventos y pagos con reintentos. Recuerda también que en SQL estándar dividir dos enteros puede truncar si no se multiplica por `100.0`.'
};

export default lesson;
