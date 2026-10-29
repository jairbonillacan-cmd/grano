const lesson = {
  id: 'c0-negocio-03-kpi-metrica-vanidad',
  moduleId: 'c0-negocio',
  tracks: ['core'],
  level: 0,
  order: 3,
  title: 'Qué hace útil a un KPI frente a una métrica de vanidad',
  minutes: 20,
  prerequisites: ['c0-negocio-02-embudos-conversion'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), la agencia publicitaria celebra que el canal de redes sociales (`paid_social`) superó los 3,21 millones de impresiones y que las cuatro campañas promocionales empataron con 3 000 pedidos brutos cada una. Sin embargo, al revisar las devoluciones en `refunds`, dos de esas campañas pierden casi el 19 % de sus ventas en reembolsos. ¿Cómo distingues un número que solo alimenta el ego de un indicador que dirige decisiones?',

  objectives: [
    'Diferenciar una métrica de vanidad acumulativa de un indicador de desempeño (KPI) accionable.',
    'Especificar los cinco elementos formales de un KPI: fórmula, grano, ventana temporal, filtro canónico y umbral.',
    'Emparejar cada KPI de crecimiento con una métrica guardia (guardrail) que proteja el margen y la calidad.'
  ],

  sections: [
    {
      id: 'que-es-una-metrica-de-vanidad',
      heading: 'Cómo reconocer una métrica de vanidad antes de ponerla en un tablero',
      body: 'Una **métrica de vanidad** (*vanity metric*) es un contador que sube de forma monótona con el paso del tiempo o con el aumento del presupuesto, pero que no permite decidir qué hacer mañana. Ejemplos habituales son las descargas históricas de una aplicación, los usuarios registrados acumulados desde que abrió la tienda o el total de impresiones publicitarias (`SUM(impressions)`).\n\nEn la tabla `marketing_spend` de Mercado Brisa (empresa ficticia), `paid_social` acumula 3 213 897 impresiones y 79 925 clics brutos. Si premias al equipo por impresiones, solo tiene que gastar más presupuesto (`63 080,29` USD) para inflar el gráfico. En cambio, cuando divides el gasto entre las conversiones logradas para obtener el **costo por adquisición** (`CPA = SUM(spend_usd) / SUM(attributed_conversions)`), descubres que el canal `referral` cuesta `13,59` USD por conversión frente a los `13,93` USD de `paid_social`.',
      example: {
        language: 'sql',
        code: `SELECT
  channel,
  SUM(impressions) AS impresiones_vanidad,
  SUM(clicks) AS clics_brutos,
  ROUND(SUM(spend_usd), 2) AS gasto_total_usd,
  SUM(attributed_conversions) AS conversiones,
  ROUND(SUM(spend_usd) / SUM(clicks), 2) AS cpc_usd,
  ROUND(SUM(spend_usd) / SUM(attributed_conversions), 2) AS cpa_usd
FROM marketing_spend
GROUP BY channel
ORDER BY impresiones_vanidad DESC;`,
        expectedOutput: [
          {
            channel: 'paid_social',
            impresiones_vanidad: 3213897,
            clics_brutos: 79925,
            gasto_total_usd: 63080.29,
            conversiones: 4530,
            cpc_usd: 0.79,
            cpa_usd: 13.93
          },
          {
            channel: 'display_video',
            impresiones_vanidad: 2319080,
            clics_brutos: 58708,
            gasto_total_usd: 46759.04,
            conversiones: 3355,
            cpc_usd: 0.8,
            cpa_usd: 13.94
          },
          {
            channel: 'organic_search',
            impresiones_vanidad: 1377667,
            clics_brutos: 33785,
            gasto_total_usd: 26703.45,
            conversiones: 1925,
            cpc_usd: 0.79,
            cpa_usd: 13.87
          },
          {
            channel: 'referral',
            impresiones_vanidad: 1131587,
            clics_brutos: 28511,
            gasto_total_usd: 22306.35,
            conversiones: 1641,
            cpc_usd: 0.78,
            cpa_usd: 13.59
          },
          {
            channel: 'email_campaign',
            impresiones_vanidad: 720737,
            clics_brutos: 17651,
            gasto_total_usd: 14102.07,
            conversiones: 1013,
            cpc_usd: 0.8,
            cpa_usd: 13.92
          }
        ]
      }
    },
    {
      id: 'los-cinco-componentes-de-un-kpi',
      heading: 'Los cinco componentes que convierten una cifra en un KPI útil',
      body: 'Según la metodología de David Parmenter y las especificaciones de capas semánticas como MetricFlow, un **KPI** (*Key Performance Indicator*) no es simplemente un número con etiqueta. Es un contrato operativo compuesto por cinco piezas explícitas:\n\n1. Fórmula exacta: numerador y denominador sin ambigüedad (`SUM(spend_usd) / SUM(attributed_conversions)`).\n\n2. Grano y entidad: qué unidad se evalúa (por canal y mes, o por pedido entregado).\n\n3. Filtro canónico: qué filas se excluyen siempre (descartar `status IN (\'cancelled\', \'pending\')` y el artículo de prueba `SKU-TEST-NEG`).\n\n4. Ventana temporal: contra qué periodo o meta se contrasta.\n\n5. **Umbral de acción** y responsable: quién actúa y a partir de qué valor (si el CPA supera 14,50 USD durante 7 días, pausar la pauta).'
    },
    {
      id: 'metricas-guardia-contra-incentivos-perversos',
      heading: 'Métricas guardia: cómo evitar que optimizar un KPI rompa otro',
      body: 'Cuando una organización fija un único indicador de volumen o captación, los equipos encuentran atajos para subirlo aunque dañen la rentabilidad. Si evalúas a marketing solo por pedidos brutos creados, lanzarán promesas exageradas o descuentos agresivos que atraerán compras impulsivas seguidas de cancelaciones y reclamos.\n\nEn experimentación y analítica de producto (Kohavi et al.), este riesgo se controla emparejando cada KPI principal con una **métrica guardia** (*guardrail metric*): una restricción que no puede empeorar más allá de un límite tolerado. En Mercado Brisa, la métrica guardia del ingreso por campaña es la **tasa de reembolso sobre venta neta**. Mientras `CMP-ORIGEN` y `CMP-BARISTA` tienen 0 % de reembolsos, `CMP-VERANO` devuelve el 18,46 % y `CMP-RETENCION` el 19,18 %.'
    }
  ],

  workedExample: {
    title: 'Auditoría de campañas: pedidos brutos frente a ingreso neto y tasa de reembolso',
    description: 'Compara el reporte superficial de pedidos y facturación bruta por campaña contra la evaluación con ingreso neto y métrica guardia de reembolsos.',
    steps: [
      {
        label: 'Paso 1 — Vista de vanidad: conteo bruto de pedidos y facturación total cobrada',
        explanation: 'Si miramos únicamente `COUNT(order_id)` y `SUM(total_usd)`, las cuatro campañas (`CMP-RETENCION`, `CMP-BARISTA`, `CMP-ORIGEN` y `CMP-VERANO`) empatan en 3 000 pedidos, y `CMP-ORIGEN` (565 542,84 USD) parece casi idéntica a `CMP-VERANO` (561 465,69 USD).',
        code: `SELECT
  COALESCE(campaign_id, 'ORG-DIRECTO') AS campana,
  COUNT(order_id) AS pedidos_brutos_vanidad,
  ROUND(SUM(total_usd), 2) AS facturacion_bruta_vanidad_usd
FROM orders
GROUP BY COALESCE(campaign_id, 'ORG-DIRECTO')
ORDER BY pedidos_brutos_vanidad DESC, facturacion_bruta_vanidad_usd DESC;`,
        expectedOutput: [
          {
            campana: 'ORG-DIRECTO',
            pedidos_brutos_vanidad: 6000,
            facturacion_bruta_vanidad_usd: 3784842.52
          },
          {
            campana: 'CMP-RETENCION',
            pedidos_brutos_vanidad: 3000,
            facturacion_bruta_vanidad_usd: 1648915.21
          },
          {
            campana: 'CMP-BARISTA',
            pedidos_brutos_vanidad: 3000,
            facturacion_bruta_vanidad_usd: 1109051.51
          },
          {
            campana: 'CMP-ORIGEN',
            pedidos_brutos_vanidad: 3000,
            facturacion_bruta_vanidad_usd: 565542.84
          },
          {
            campana: 'CMP-VERANO',
            pedidos_brutos_vanidad: 3000,
            facturacion_bruta_vanidad_usd: 561465.69
          }
        ]
      },
      {
        label: 'Paso 2 — KPI gobernado + métrica guardia: ingreso neto y tasa de reembolso',
        explanation: 'Al cruzar con `refunds` pre-agregado y calcular el ingreso neto y la tasa de reembolso (`tasa_reembolso_guardia_pct`), vemos que `CMP-VERANO` pierde el 18,46 % en devoluciones y queda 65 332,18 USD por debajo de `CMP-ORIGEN`.',
        code: `WITH dev_pedido AS (
  SELECT order_id, SUM(refund_amount_usd) AS devuelto_usd
  FROM refunds
  GROUP BY order_id
)
SELECT
  COALESCE(o.campaign_id, 'ORG-DIRECTO') AS campana,
  COUNT(o.order_id) FILTER (WHERE o.status = 'completed') AS pedidos_completados,
  ROUND(SUM(CASE WHEN o.status IN ('completed', 'refunded') THEN o.subtotal_usd - o.discount_usd - COALESCE(d.devuelto_usd, 0) ELSE 0 END), 2) AS ingreso_neto_kpi_usd,
  ROUND(SUM(COALESCE(d.devuelto_usd, 0)) * 100.0 / SUM(CASE WHEN o.status IN ('completed', 'refunded') THEN o.subtotal_usd - o.discount_usd ELSE 0 END), 2) AS tasa_reembolso_guardia_pct
FROM orders o
LEFT JOIN dev_pedido d ON o.order_id = d.order_id
GROUP BY COALESCE(campaign_id, 'ORG-DIRECTO')
ORDER BY ingreso_neto_kpi_usd DESC;`,
        expectedOutput: [
          {
            campana: 'ORG-DIRECTO',
            pedidos_completados: 4920,
            ingreso_neto_kpi_usd: 2929572.03,
            tasa_reembolso_guardia_pct: 0
          },
          {
            campana: 'CMP-RETENCION',
            pedidos_completados: 2400,
            ingreso_neto_kpi_usd: 1053599.58,
            tasa_reembolso_guardia_pct: 19.18
          },
          {
            campana: 'CMP-BARISTA',
            pedidos_completados: 2520,
            ingreso_neto_kpi_usd: 876764.57,
            tasa_reembolso_guardia_pct: 0
          },
          {
            campana: 'CMP-ORIGEN',
            pedidos_completados: 2400,
            ingreso_neto_kpi_usd: 428392.93,
            tasa_reembolso_guardia_pct: 0
          },
          {
            campana: 'CMP-VERANO',
            pedidos_completados: 2520,
            ingreso_neto_kpi_usd: 363060.75,
            tasa_reembolso_guardia_pct: 18.46
          }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: '¿Cuál de los siguientes indicadores cumple los requisitos para ser un KPI operativo en lugar de una métrica de vanidad?',
      options: [
        {
          id: 'a',
          text: 'Porcentaje de pedidos semanales entregados a tiempo y sin reembolso, con umbral de alerta en 92 %.',
          correct: true,
          feedback: 'Correcto. Es una razón acotada en el tiempo, con denominador claro, filtro de calidad y un umbral explícito que dispara una acción.'
        },
        {
          id: 'b',
          text: 'Número acumulado de clientes registrados en la base de datos desde la apertura de la empresa.',
          correct: false,
          feedback: 'Incorrecto. El total histórico de registros nunca baja aunque todos los clientes actuales dejen de comprar hoy.'
        },
        {
          id: 'c',
          text: 'Total de visitas e impresiones sumadas en todas las redes sociales durante el año.',
          correct: false,
          feedback: 'Incorrecto. Las impresiones brutas miden exposición pagada, no eficiencia ni conversión en ingresos netos.'
        }
      ],
      explanation: 'Un KPI útil expresa una tasa, razón o resultado neto en una ventana definida y se compara contra un umbral que guía una decisión operativa.'
    },
    {
      id: 'c2',
      type: 'mcq',
      prompt: 'El equipo comercial propone bonificar a los vendedores según el número bruto de pedidos creados (`COUNT(order_id)`), sin mirar cancelaciones ni devoluciones. ¿Qué métrica guardia debes añadir al tablero?',
      options: [
        {
          id: 'a',
          text: 'La tasa de cancelación y reembolso sobre el valor vendido, exigiendo que no supere un umbral máximo.',
          correct: true,
          feedback: 'Exacto. La métrica guardia impide que se creen pedidos ficticios o de baja calidad que luego se cancelan o reembolsan.'
        },
        {
          id: 'b',
          text: 'El número total de clics publicitarios del mes.',
          correct: false,
          feedback: 'Incorrecto. Los clics publicitarios no controlan la calidad ni la retención de los pedidos generados por los vendedores.'
        },
        {
          id: 'c',
          text: 'El conteo acumulado de productos dados de alta en el catálogo.',
          correct: false,
          feedback: 'Incorrecto. El tamaño del catálogo no protege contra el deterioro de las ventas ni contra el aumento de devoluciones.'
        }
      ],
      explanation: 'Una métrica guardia protege las dimensiones de calidad, margen o riesgo cuando se incentiva un indicador de volumen o velocidad.'
    },
    {
      id: 'c3',
      type: 'predict-output',
      prompt: 'En `marketing_spend`, el canal `referral` gastó 22 306,35 USD y generó 1 641 conversiones; `paid_social` gastó 63 080,29 USD y generó 4 530 conversiones. ¿Cuál tiene menor costo por adquisición (`CPA`)?',
      options: [
        {
          id: 'a',
          text: 'referral, con un CPA de 13.59 USD frente a los 13.93 USD de paid_social.',
          correct: true,
          feedback: 'Correcto. Al dividir el gasto entre las conversiones (22 306,35 / 1 641 = 13,59 USD), referral resulta 0,34 USD más eficiente por conversión.'
        },
        {
          id: 'b',
          text: 'paid_social, porque consiguió 4 530 conversiones en total.',
          correct: false,
          feedback: 'Incorrecto. Tener más volumen bruto de conversiones no significa menor costo unitario: gastó proporcionalmente más por cada una.'
        },
        {
          id: 'c',
          text: 'Ambos tienen exactamente el mismo CPA porque pertenecen a la misma tabla.',
          correct: false,
          feedback: 'Incorrecto. Cada canal tiene su propia relación entre gasto e impacto, dando 13.59 USD en referral y 13.93 USD en paid_social.'
        }
      ],
      explanation: 'El Costo por Adquisición (`CPA = SUM(spend_usd) / SUM(attributed_conversions)`) normaliza el gasto por unidad de éxito y permite comparar canales de distinto tamaño.'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Ranking de canales por Costo de Adquisición (CPA) frente a impresiones',
    language: 'sql',
    prompt: 'Consulta la tabla `marketing_spend` agrupando por `channel`. Calcula: `impresiones_vanidad` (`SUM(impressions)`), `gasto_usd` (`ROUND(SUM(spend_usd), 2)`), `conversiones` (`SUM(attributed_conversions)`), `ctr_pct` (`ROUND(SUM(clicks) * 100.0 / SUM(impressions), 2)`) y el KPI de eficiencia `cpa_usd` (gasto total dividido entre conversiones totales, redondeado a 2 decimales). Ordena del canal más eficiente al menos eficiente (`ORDER BY cpa_usd ASC`).',
    starterCode: `SELECT
  channel,
  SUM(impressions) AS impresiones_vanidad,
  ROUND(SUM(spend_usd), 2) AS gasto_usd,
  SUM(attributed_conversions) AS conversiones,
  ROUND(SUM(clicks) * 100.0 / SUM(impressions), 2) AS ctr_pct,
  -- Calcula cpa_usd dividiendo SUM(spend_usd) entre SUM(attributed_conversions) con ROUND(..., 2)
  0.0 AS cpa_usd
FROM marketing_spend
GROUP BY channel
ORDER BY cpa_usd ASC;`,
    expected: `SELECT
  channel,
  SUM(impressions) AS impresiones_vanidad,
  ROUND(SUM(spend_usd), 2) AS gasto_usd,
  SUM(attributed_conversions) AS conversiones,
  ROUND(SUM(clicks) * 100.0 / SUM(impressions), 2) AS ctr_pct,
  ROUND(SUM(spend_usd) / SUM(attributed_conversions), 2) AS cpa_usd
FROM marketing_spend
GROUP BY channel
ORDER BY cpa_usd ASC;`,
    orderMatters: true,
    hints: [
      'Recuerda que `cpa_usd` es una métrica de razón no aditiva: primero suma todo el gasto `SUM(spend_usd)` y divídelo entre `SUM(attributed_conversions)`.',
      'Envuelve la división en `ROUND(..., 2) AS cpa_usd`.',
      'Mantén `ORDER BY cpa_usd ASC` para que el canal con menor costo por conversión (`referral`, 13.59 USD) aparezca primero.'
    ],
    solution: `SELECT
  channel,
  SUM(impressions) AS impresiones_vanidad,
  ROUND(SUM(spend_usd), 2) AS gasto_usd,
  SUM(attributed_conversions) AS conversiones,
  ROUND(SUM(clicks) * 100.0 / SUM(impressions), 2) AS ctr_pct,
  ROUND(SUM(spend_usd) / SUM(attributed_conversions), 2) AS cpa_usd
FROM marketing_spend
GROUP BY channel
ORDER BY cpa_usd ASC;`,
    solutionExplanation: 'Al ordenar por `cpa_usd ASC` en lugar de por `impresiones_vanidad`, el orden se invierte: `referral` (`13.59` USD) y `organic_search` (`13.87` USD) lideran en eficiencia unitaria, mientras que `paid_social` (`13.93` USD) y `display_video` (`13.94` USD) quedan al final.',
    expectedOutputTable: [
      {
        channel: 'referral',
        impresiones_vanidad: 1131587,
        gasto_usd: 22306.35,
        conversiones: 1641,
        ctr_pct: 2.52,
        cpa_usd: 13.59
      },
      {
        channel: 'organic_search',
        impresiones_vanidad: 1377667,
        gasto_usd: 26703.45,
        conversiones: 1925,
        ctr_pct: 2.45,
        cpa_usd: 13.87
      },
      {
        channel: 'email_campaign',
        impresiones_vanidad: 720737,
        gasto_usd: 14102.07,
        conversiones: 1013,
        ctr_pct: 2.45,
        cpa_usd: 13.92
      },
      {
        channel: 'paid_social',
        impresiones_vanidad: 3213897,
        gasto_usd: 63080.29,
        conversiones: 4530,
        ctr_pct: 2.49,
        cpa_usd: 13.93
      },
      {
        channel: 'display_video',
        impresiones_vanidad: 2319080,
        gasto_usd: 46759.04,
        conversiones: 3355,
        ctr_pct: 2.53,
        cpa_usd: 13.94
      }
    ]
  },

  roleNotes: {
    de: 'Centraliza las definiciones de filtros canónicos (como excluir `cancelled` y `pending`) en vistas o modelos compartidos para que ningún analista publique por accidente un KPI sobre pedidos anulados.',
    da: 'Cuando un área te pida "un gráfico de impresiones o visitas totales", entrega el volumen junto con la tasa de eficiencia (CPA o conversión) y la métrica guardia de reembolsos.',
    bi: 'Documenta cada tarjeta de un tablero ejecutivo con su ficha formal: fórmula exacta, grano, fuente de datos, propietario y umbral que separa el estado normal de la alerta.'
  },

  summary: [
    'Una métrica de vanidad acumula volumen bruto sin contexto y no orienta ninguna decisión.',
    'Un KPI requiere fórmula explícita, grano, ventana temporal, filtro canónico y umbral de acción.',
    'El Costo por Adquisición (CPA) divide la suma del gasto entre la suma de las conversiones.',
    'Toda métrica de crecimiento necesita una métrica guardia que vigile reembolsos y margen bruto.'
  ],

  flashcards: [
    {
      id: 'fc-c0-negocio-03-a',
      front: '¿Qué prueba rápida distingue a un KPI de una métrica de vanidad?',
      back: 'Preguntar: "¿Qué decisión concreta cambiaremos mañana si este indicador sube o baja de su umbral?". Si no cambia ninguna acción, es vanidad.'
    },
    {
      id: 'fc-c0-negocio-03-b',
      front: '¿Cuáles son los cinco elementos de la ficha formal de un KPI?',
      back: 'Fórmula matemática (numerador/denominador), grano de entidad, filtro canónico de exclusión, ventana temporal comparativa y umbral de acción con propietario.'
    },
    {
      id: 'fc-c0-negocio-03-c',
      front: '¿Para qué sirve una métrica guardia (guardrail metric)?',
      back: 'Para asegurar que al optimizar el KPI principal (como volumen de ventas) no se deterioren la rentabilidad o la calidad (como la tasa de reembolso).'
    }
  ],

  glossaryTerms: [
    'kpi-vs-metrica-vanidad',
    'metrica-guardia'
  ],

  sources: [
    {
      title: 'Key Performance Indicators: Developing, Implementing, and Using Winning KPIs (4th Edition)',
      url: 'https://www.wiley.com/en-us/Key+Performance+Indicators+%28KPI%29%3A+Developing%2C+Implementing%2C+and+Using+Winning+KPIs%2C+4th+Edition-p-9781119620778',
      publisher: 'John Wiley & Sons (David Parmenter)',
      accessed: '2026-10-29',
      supports: 'Atributos de un KPI efectivo frente a indicadores de resultado histórico sin acción operativa.'
    },
    {
      title: 'Trustworthy Online Controlled Experiments: A Practical Guide to A/B Testing',
      url: 'https://experimentguide.com/',
      publisher: 'Cambridge University Press (Kohavi, Tang & Xu)',
      accessed: '2026-10-29',
      supports: 'Diseño de criterios globales de evaluación y métricas guardia para evitar incentivos perversos.'
    },
    {
      title: 'dbt Semantic Layer & MetricFlow Specification',
      url: 'https://docs.getdbt.com/docs/use-dbt-semantic-layer/dbt-sl',
      publisher: 'dbt Labs',
      accessed: '2026-10-29',
      supports: 'Definición declarativa de métricas de razón, grano, filtros canónicos y dimensiones temporales.'
    }
  ],

  aiNotes: 'Las dudas habituales consisten en creer que cualquier número en un dashboard es un KPI, calcular el CPA con `AVG(spend_usd / attributed_conversions)` en lugar de `SUM(spend_usd) / SUM(attributed_conversions)`, o evaluar campañas solo por ingresos brutos ignorando la tasa de reembolso en `refunds`.'
};

export default lesson;
