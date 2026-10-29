const lesson = {
  id: 'bi2-metricas-04-north-star-goodhart',
  moduleId: 'bi2-metricas',
  tracks: ['bi'],
  level: 2,
  order: 4,
  title: 'Métrica estrella polar (North Star) y ley de Goodhart',
  subtitle:
    'Métrica estrella polar (North Star): usos legítimos, límites y ley de Goodhart',
  minutes: 20,
  datasets: ['orders', 'order_items', 'products', 'refunds'],
  prerequisites: ['bi2-metricas-03-metricas-guardia'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), la dirección prometió un bono a los líderes de las cuatro campañas pagadas si alcanzaban 3,000 pedidos brutos. Al cerrar el ciclo, `CMP-RETENCION`, `CMP-BARISTA`, `CMP-ORIGEN` y `CMP-VERANO` registraron exactamente 3,000 filas cada una en `orders`. Sin embargo, `CMP-BARISTA` entregó 2,520 pedidos completados sin devolución y 407,823.94 USD de margen neto, mientras `CMP-VERANO` solo logró 1,945 pedidos limpios y 125,198.65 USD de margen. ¿Por qué una meta de volumen bruto activa la ley de Goodhart y cómo diseñas una Métrica Estrella Polar legítima?',

  objectives: [
    'Diagnosticar empíricamente la ley de Goodhart cuando un indicador de volumen bruto se convierte en meta de incentivo sin filtros de calidad ni métricas guardia.',
    'Diseñar una Métrica Estrella Polar (North Star Metric) que mida unidades de valor efectivamente entregadas al cliente (pedidos completados con cero devolución).',
    'Auditar en SQL el cambio en el ranking de campañas al pasar de volumen bruto y GMV a la Métrica Estrella Polar acompañada de margen bruto neto.',
  ],

  sections: [
    {
      id: 'ley-de-goodhart-en-datos',
      heading: 'La ley de Goodhart: cuando la meta destruye al indicador',
      body: 'En 1975, el economista Charles Goodhart formuló un principio que Marilyn Strathern resumió con claridad: **"Cuando una medida se convierte en una meta, deja de ser una buena medida"**. En analítica de negocio, la **ley de Goodhart** explica qué ocurre cuando una empresa ata bonos o presupuestos a un indicador superficial fácil de inflar.\n\nEn Mercado Brisa, fijar la meta de `3,000` pedidos brutos por campaña sin exigir estado ni calidad produjo exactamente `3,000` registros en cada una de las cuatro campañas pagadas (`CMP-RETENCION`, `CMP-BARISTA`, `CMP-ORIGEN` y `CMP-VERANO`). Para alcanzar el número fijado antes del cierre, `CMP-VERANO` captó compras de baja intención. Esas compras terminaron en `240` pedidos cancelados y `815` pedidos con devolución.\n\nPor su parte, `CMP-RETENCION` infló el valor bruto con impuestos (`1,648,915.21` USD de GMV) mediante promociones agresivas. Pero sufrió `700` pedidos con devoluciones y `360` cancelados o pendientes. El conteo bruto dejó de medir la demanda real y pasó a medir la capacidad de fabricar filas en `orders`.',
      example: {
        language: 'sql',
        code: `WITH dev_por_pedido AS (
  SELECT order_id, SUM(refund_amount_usd) AS devuelto_usd
  FROM refunds
  GROUP BY order_id
)
SELECT
  o.campaign_id,
  COUNT(o.order_id) AS pedidos_brutos_meta,
  COUNT(o.order_id) FILTER (
    WHERE o.status = 'completed' AND COALESCE(d.devuelto_usd, 0) = 0
  ) AS nsm_pedidos_limpios,
  COUNT(o.order_id) FILTER (
    WHERE COALESCE(d.devuelto_usd, 0) > 0
  ) AS pedidos_con_devolucion,
  COUNT(o.order_id) FILTER (WHERE o.status = 'cancelled') AS pedidos_cancelados,
  COUNT(o.order_id) FILTER (WHERE o.status = 'pending') AS pedidos_pendientes
FROM orders o
LEFT JOIN dev_por_pedido d ON o.order_id = d.order_id
WHERE o.campaign_id IS NOT NULL
GROUP BY o.campaign_id
ORDER BY nsm_pedidos_limpios DESC;`,
        expectedOutput: [
          {
            campaign_id: 'CMP-BARISTA',
            pedidos_brutos_meta: 3000,
            nsm_pedidos_limpios: 2520,
            pedidos_con_devolucion: 240,
            pedidos_cancelados: 140,
            pedidos_pendientes: 100,
          },
          {
            campaign_id: 'CMP-ORIGEN',
            pedidos_brutos_meta: 3000,
            nsm_pedidos_limpios: 2400,
            pedidos_con_devolucion: 240,
            pedidos_cancelados: 210,
            pedidos_pendientes: 150,
          },
          {
            campaign_id: 'CMP-VERANO',
            pedidos_brutos_meta: 3000,
            nsm_pedidos_limpios: 1945,
            pedidos_con_devolucion: 815,
            pedidos_cancelados: 140,
            pedidos_pendientes: 100,
          },
          {
            campaign_id: 'CMP-RETENCION',
            pedidos_brutos_meta: 3000,
            nsm_pedidos_limpios: 1940,
            pedidos_con_devolucion: 700,
            pedidos_cancelados: 210,
            pedidos_pendientes: 150,
          },
        ],
      },
    },
    {
      id: 'diseno-metrica-estrella-polar',
      heading: 'Qué hace legítima a una Métrica Estrella Polar (North Star)',
      body: 'Para evitar la ley de Goodhart sin dispersar a los equipos en decenas de indicadores sueltos, las áreas de producto y BI adoptan una **Métrica Estrella Polar** (*North Star Metric*, NSM). Un error común es elegir como Estrella Polar el ingreso bruto o los usuarios registrados. Esas cifras miden lo que la empresa cobra hoy, pero no el valor recibido por el cliente.\n\nUna Métrica Estrella Polar legítima cumple tres condiciones. Primero, refleja el instante en que el cliente obtiene el resultado prometido por el producto. Segundo, actúa como indicador adelantado de la retención y del valor de vida. Tercero, se descompone en **palancas operativas** accionables por producto, logística y marketing.\n\nEn Mercado Brisa, un pedido cancelado, pendiente o devuelto por café defectuoso no entrega valor. Por ello, definimos la Estrella Polar como **Pedidos Completados con Valor Entregado** (`nsm_pedidos_valor_entregado`). Su contrato exige `status = \'completed\'` y `COALESCE(devuelto_usd, 0) = 0`. Así alineamos demanda sana, despacho puntual y calidad del producto.',
    },
    {
      id: 'sistema-nsm-palancas-guardias',
      heading: 'El sistema completo: Estrella Polar, palancas de entrada y guardias',
      body: 'Con esta lección cerramos la arquitectura del módulo `bi2-metricas`. Un sistema de medición maduro integra las cuatro piezas estudiadas. Cada indicador descansa sobre una **métrica canónica** sin ambigüedad. La **Métrica Estrella Polar** se desglosa en palancas operativas y se protege con **umbrales de guardia**.\n\nObserva cómo cambia la decisión ejecutiva en Mercado Brisa al reemplazar el volumen bruto por este diseño. Bajo el antiguo reporte de GMV bruto (`SUM(total_usd)`), `CMP-RETENCION` parecía líder con `1,648,915.21` USD y `CMP-BARISTA` quedaba segunda con `1,109,051.51` USD. Por su parte, `CMP-ORIGEN` (`565,542.84` USD) y `CMP-VERANO` (`561,465.69` USD) lucían casi empatadas.\n\nAl evaluar por la Estrella Polar (`nsm_pedidos_valor_entregado`) y el margen bruto neto tras devoluciones, la realidad emerge. `CMP-BARISTA` pasa al primer puesto con `2,520` pedidos limpios (`84.00 %` de calidad) y `407,823.94` USD de margen neto, superando a `CMP-RETENCION` (`1,940` pedidos NSM y `404,620.44` USD de margen). Asimismo, `CMP-ORIGEN` (`2,400` pedidos NSM y `205,572.39` USD de margen) supera por más de ochenta mil dólares a `CMP-VERANO` (`1,945` pedidos NSM y `125,198.65` USD).',
    },
  ],

  workedExample: {
    title:
      'Inversión del ranking de campañas: de la ilusión de Goodhart a la Estrella Polar',
    description:
      'Demuestra cómo el empate artificial en 3,000 pedidos brutos se transforma al evaluar las campañas por Pedidos Completados sin Devolución y Margen Bruto Neto.',
    steps: [
      {
        label:
          'Paso 1 — El espejismo de Goodhart: ranking por pedidos brutos y GMV con impuestos',
        explanation:
          'Consultamos las cuatro campañas pagadas bajo la métrica mal diseñada que originó el bono: conteo bruto de pedidos y suma de total_usd sin filtrar estado ni descontar devoluciones. Las cuatro campañas empatan en 3,000 pedidos y CMP-RETENCION parece líder indiscutible.',
        code: `SELECT
  o.campaign_id,
  COUNT(o.order_id) AS pedidos_brutos,
  ROUND(SUM(o.total_usd), 2) AS gmv_bruto_con_impuestos_usd
FROM orders o
WHERE o.campaign_id IS NOT NULL
GROUP BY o.campaign_id
ORDER BY gmv_bruto_con_impuestos_usd DESC;`,
        expectedOutput: [
          {
            campaign_id: 'CMP-RETENCION',
            pedidos_brutos: 3000,
            gmv_bruto_con_impuestos_usd: 1648915.21,
          },
          {
            campaign_id: 'CMP-BARISTA',
            pedidos_brutos: 3000,
            gmv_bruto_con_impuestos_usd: 1109051.51,
          },
          {
            campaign_id: 'CMP-ORIGEN',
            pedidos_brutos: 3000,
            gmv_bruto_con_impuestos_usd: 565542.84,
          },
          {
            campaign_id: 'CMP-VERANO',
            pedidos_brutos: 3000,
            gmv_bruto_con_impuestos_usd: 561465.69,
          },
        ],
      },
      {
        label:
          'Paso 2 — Ranking por Métrica Estrella Polar y Margen Bruto Neto Realizado',
        explanation:
          'Preagregamos refunds y el costo directo de líneas (order_items con products) al grano de order_id y calculamos la Estrella Polar (nsm_pedidos_valor_entregado: pedidos en status = completed con 0 USD devueltos), el porcentaje de calidad entregada y el margen bruto neto en pedidos realizados. CMP-BARISTA toma el primer lugar.',
        code: `WITH dev_por_pedido AS (
  SELECT order_id, SUM(refund_amount_usd) AS devuelto_usd
  FROM refunds
  GROUP BY order_id
),
costo_por_pedido AS (
  SELECT
    oi.order_id,
    SUM(oi.qty * p.unit_cost_usd) AS costo_usd
  FROM order_items oi
  JOIN products p ON oi.product_id = p.product_id
  GROUP BY oi.order_id
)
SELECT
  o.campaign_id,
  COUNT(o.order_id) AS pedidos_brutos,
  COUNT(o.order_id) FILTER (
    WHERE o.status = 'completed' AND COALESCE(d.devuelto_usd, 0) = 0
  ) AS nsm_pedidos_valor_entregado,
  ROUND(
    100.0 * COUNT(o.order_id) FILTER (
      WHERE o.status = 'completed' AND COALESCE(d.devuelto_usd, 0) = 0
    ) / COUNT(o.order_id),
    2
  ) AS pct_calidad_entregada,
  ROUND(
    SUM(o.subtotal_usd - o.discount_usd - COALESCE(d.devuelto_usd, 0))
    FILTER (WHERE o.status IN ('completed', 'refunded')),
    2
  ) AS ingreso_neto_realizado_usd,
  ROUND(
    SUM(o.subtotal_usd - o.discount_usd - COALESCE(d.devuelto_usd, 0) - cp.costo_usd)
    FILTER (WHERE o.status IN ('completed', 'refunded')),
    2
  ) AS margen_bruto_neto_usd
FROM orders o
JOIN costo_por_pedido cp ON o.order_id = cp.order_id
LEFT JOIN dev_por_pedido d ON o.order_id = d.order_id
WHERE o.campaign_id IS NOT NULL
GROUP BY o.campaign_id
ORDER BY margen_bruto_neto_usd DESC;`,
        expectedOutput: [
          {
            campaign_id: 'CMP-BARISTA',
            pedidos_brutos: 3000,
            nsm_pedidos_valor_entregado: 2520,
            pct_calidad_entregada: 84.0,
            ingreso_neto_realizado_usd: 876764.57,
            margen_bruto_neto_usd: 407823.94,
          },
          {
            campaign_id: 'CMP-RETENCION',
            pedidos_brutos: 3000,
            nsm_pedidos_valor_entregado: 1940,
            pct_calidad_entregada: 64.67,
            ingreso_neto_realizado_usd: 1053599.58,
            margen_bruto_neto_usd: 404620.44,
          },
          {
            campaign_id: 'CMP-ORIGEN',
            pedidos_brutos: 3000,
            nsm_pedidos_valor_entregado: 2400,
            pct_calidad_entregada: 80.0,
            ingreso_neto_realizado_usd: 428392.93,
            margen_bruto_neto_usd: 205572.39,
          },
          {
            campaign_id: 'CMP-VERANO',
            pedidos_brutos: 3000,
            nsm_pedidos_valor_entregado: 1945,
            pct_calidad_entregada: 64.83,
            ingreso_neto_realizado_usd: 363060.75,
            margen_bruto_neto_usd: 125198.65,
          },
        ],
      },
    ],
  },

  checks: [
    {
      id: 'chk-bi2-04-goodhart',
      type: 'mcq',
      prompt:
        '¿Qué evidencia empírica dentro de la base de datos de Mercado Brisa confirma la ley de Goodhart en la gestión de las campañas comerciales?',
      options: [
        {
          id: 'a',
          text: 'Las cuatro campañas pagadas registran exactamente 3,000 pedidos brutos cada una, pero difieren drásticamente en cancelaciones, devoluciones y margen bruto neto.',
          correct: true,
          feedback:
            'Correcto. Cuando la meta fue llegar a 3,000 filas en orders, los equipos optimizaron el conteo bruto rellenando el tramo final con pedidos que se cancelaron o devolvieron.',
        },
        {
          id: 'b',
          text: 'La campaña ORG-DIRECTO tiene más pedidos que las campañas pagadas porque no usa códigos promocionales.',
          correct: false,
          feedback:
            'Incorrecto. Que el tráfico orgánico sea mayor que una campaña individual es normal en comercio electrónico y no constituye manipulación de metas.',
        },
        {
          id: 'c',
          text: 'Todas las campañas tienen exactamente el mismo ticket promedio neto y la misma tasa de devolución.',
          correct: false,
          feedback:
            'Incorrecto. Precisamente difieren en ticket y en tasa de devolución (0 % en CMP-BARISTA frente a 18.46 % en CMP-VERANO).',
        },
      ],
      explanation:
        'La ley de Goodhart se manifiesta cuando los agentes alcanzan la cifra exacta exigida por el incentivo (3,000 pedidos brutos en las 4 campañas) degradando la calidad subyacente: en CMP-RETENCION y CMP-VERANO más de un tercio de los pedidos brutos fallaron por cancelación o reembolso.',
    },
    {
      id: 'chk-bi2-04-nsm-criteria',
      type: 'mcq',
      prompt:
        '¿Por qué "Pedidos Completados sin Devolución" es una mejor Métrica Estrella Polar para Mercado Brisa que "GMV Bruto (SUM(total_usd))"?',
      options: [
        {
          id: 'a',
          text: 'Porque es más fácil de escribir en SQL ya que no requiere hacer JOIN con la tabla refunds.',
          correct: false,
          feedback:
            'Incorrecto. De hecho requiere cruzar con refunds para verificar que COALESCE(devuelto_usd, 0) = 0; su ventaja no es la simplicidad sintáctica sino la validez de negocio.',
        },
        {
          id: 'b',
          text: 'Porque captura el momento en que el cliente efectivamente recibe y conserva el producto con satisfacción, alineando adquisición, logística y calidad.',
          correct: true,
          feedback:
            'Correcto. Una Estrella Polar legítima mide unidades de valor entregado al cliente que sostienen la recompra futura, no impuestos ni ventas revertidas.',
        },
        {
          id: 'c',
          text: 'Porque una Métrica Estrella Polar nunca debe expresarse en unidades monetarias ni acompañarse de métricas guardia.',
          correct: false,
          feedback:
            'Incorrecto. Una Estrella Polar puede ser monetaria o transaccional, y siempre necesita métricas guardia (como margen neto) para evitar vender a pérdida.',
        },
      ],
      explanation:
        'El GMV bruto incluye impuestos (tax_usd), pedidos cancelados y compras devueltas por insatisfacción. En cambio, un pedido completado con cero devoluciones certifica que el cliente recibió valor real y que la transacción consolidó ingreso legítimo.',
    },
    {
      id: 'chk-bi2-04-ranking-inversion',
      type: 'predict-output',
      prompt:
        'Al comparar CMP-RETENCION y CMP-BARISTA en Mercado Brisa, ¿qué ocurre cuando pasamos de evaluar por GMV bruto a evaluar por Margen Bruto Neto Realizado y Métrica Estrella Polar?',
      options: [
        {
          id: 'a',
          text: 'CMP-BARISTA supera a CMP-RETENCION tanto en pedidos Estrella Polar (2,520 vs 1,940) como en margen bruto neto (407,823.94 USD vs 404,620.44 USD).',
          correct: true,
          feedback:
            'Correcto. Los reembolsos en CMP-RETENCION borran su ventaja aparente de volumen bruto y colocan a CMP-BARISTA en primer lugar de rentabilidad neta.',
        },
        {
          id: 'b',
          text: 'CMP-RETENCION mantiene el primer lugar en ambas métricas porque no tuvo ningún pedido cancelado.',
          correct: false,
          feedback:
            'Incorrecto. CMP-RETENCION tuvo pedidos cancelados y con devolución que redujeron su margen neto por debajo de CMP-BARISTA.',
        },
        {
          id: 'c',
          text: 'Ambas campañas quedan empatadas en 2,500 pedidos Estrella Polar y 400,000 USD de margen.',
          correct: false,
          feedback:
            'Incorrecto. Sus desempeños netos divergen claramente tras descontar devoluciones y costos de línea.',
        },
      ],
      explanation:
        'Aunque CMP-RETENCION facturó más en bruto, sufrió cientos de pedidos con reembolso. CMP-BARISTA logró 2,520 pedidos completados sin devolución (frente a 1,940 en CMP-RETENCION) y mayor margen bruto neto total (407,823.94 USD vs 404,620.44 USD).',
    },
  ],

  practice: {
    type: 'sql',
    title: 'Cuadro de mando de campañas: Estrella Polar y Margen Bruto Neto',
    language: 'sql',
    prompt:
      "Construye el cuadro de mando ejecutivo de las cuatro campañas pagadas (`orders WHERE campaign_id IS NOT NULL`) que reemplaza el reporte de volumen bruto por la Métrica Estrella Polar y el Margen Bruto Neto. Preagrega `refunds` (`SUM(refund_amount_usd) AS devuelto_usd`) y el costo directo de líneas (`order_items oi JOIN products p ON oi.product_id = p.product_id`, sumando `oi.qty * p.unit_cost_usd AS costo_usd`) por `order_id` en CTEs. Devuelve seis columnas exactas: `campaign_id`, `pedidos_brutos` (`COUNT(o.order_id)`), `nsm_pedidos_valor_entregado` (pedidos con `o.status = 'completed' AND COALESCE(d.devuelto_usd, 0) = 0`), `pct_calidad_entregada` (`100.0 * nsm_pedidos_valor_entregado / pedidos_brutos` redondeado a 2 decimales), `ingreso_neto_realizado_usd` (`SUM(subtotal_usd - discount_usd - COALESCE(devuelto_usd, 0))` filtrado en `status IN ('completed', 'refunded')`, redondeado a 2 decimales) y `margen_bruto_neto_usd` (`SUM(subtotal_usd - discount_usd - COALESCE(devuelto_usd, 0) - costo_usd)` filtrado en `status IN ('completed', 'refunded')`, redondeado a 2 decimales). Ordena de mayor a menor por `margen_bruto_neto_usd`.",
    starterCode: `WITH dev_por_pedido AS (
  SELECT order_id, SUM(refund_amount_usd) AS devuelto_usd
  FROM refunds
  GROUP BY order_id
),
costo_por_pedido AS (
  SELECT
    oi.order_id,
    SUM(oi.qty * p.unit_cost_usd) AS costo_usd
  FROM order_items oi
  JOIN products p ON oi.product_id = p.product_id
  GROUP BY oi.order_id
)
SELECT
  o.campaign_id,
  COUNT(o.order_id) AS pedidos_brutos,
  -- Calcula la Estrella Polar (completed y sin devolución) y las métricas netas realizadas:
  0 AS nsm_pedidos_valor_entregado,
  0.0 AS pct_calidad_entregada,
  0.0 AS ingreso_neto_realizado_usd,
  0.0 AS margen_bruto_neto_usd
FROM orders o
JOIN costo_por_pedido cp ON o.order_id = cp.order_id
LEFT JOIN dev_por_pedido d ON o.order_id = d.order_id
WHERE o.campaign_id IS NOT NULL
GROUP BY o.campaign_id
ORDER BY margen_bruto_neto_usd DESC;`,
    expected: `WITH dev_por_pedido AS (
  SELECT order_id, SUM(refund_amount_usd) AS devuelto_usd
  FROM refunds
  GROUP BY order_id
),
costo_por_pedido AS (
  SELECT
    oi.order_id,
    SUM(oi.qty * p.unit_cost_usd) AS costo_usd
  FROM order_items oi
  JOIN products p ON oi.product_id = p.product_id
  GROUP BY oi.order_id
)
SELECT
  o.campaign_id,
  COUNT(o.order_id) AS pedidos_brutos,
  COUNT(o.order_id) FILTER (
    WHERE o.status = 'completed' AND COALESCE(d.devuelto_usd, 0) = 0
  ) AS nsm_pedidos_valor_entregado,
  ROUND(
    100.0 * COUNT(o.order_id) FILTER (
      WHERE o.status = 'completed' AND COALESCE(d.devuelto_usd, 0) = 0
    ) / COUNT(o.order_id),
    2
  ) AS pct_calidad_entregada,
  ROUND(
    SUM(o.subtotal_usd - o.discount_usd - COALESCE(d.devuelto_usd, 0))
    FILTER (WHERE o.status IN ('completed', 'refunded')),
    2
  ) AS ingreso_neto_realizado_usd,
  ROUND(
    SUM(o.subtotal_usd - o.discount_usd - COALESCE(d.devuelto_usd, 0) - cp.costo_usd)
    FILTER (WHERE o.status IN ('completed', 'refunded')),
    2
  ) AS margen_bruto_neto_usd
FROM orders o
JOIN costo_por_pedido cp ON o.order_id = cp.order_id
LEFT JOIN dev_por_pedido d ON o.order_id = d.order_id
WHERE o.campaign_id IS NOT NULL
GROUP BY o.campaign_id
ORDER BY margen_bruto_neto_usd DESC;`,
    orderMatters: true,
    hints: [
      "Para nsm_pedidos_valor_entregado usa COUNT(o.order_id) FILTER (WHERE o.status = 'completed' AND COALESCE(d.devuelto_usd, 0) = 0).",
      'Para pct_calidad_entregada divide 100.0 * nsm_pedidos_valor_entregado entre COUNT(o.order_id) y redondea con ROUND(..., 2).',
      "Usa FILTER (WHERE o.status IN ('completed', 'refunded')) en las sumas de ingreso_neto_realizado_usd y margen_bruto_neto_usd, y ordena con ORDER BY margen_bruto_neto_usd DESC.",
    ],
    solution: `WITH dev_por_pedido AS (
  SELECT order_id, SUM(refund_amount_usd) AS devuelto_usd
  FROM refunds
  GROUP BY order_id
),
costo_por_pedido AS (
  SELECT
    oi.order_id,
    SUM(oi.qty * p.unit_cost_usd) AS costo_usd
  FROM order_items oi
  JOIN products p ON oi.product_id = p.product_id
  GROUP BY oi.order_id
)
SELECT
  o.campaign_id,
  COUNT(o.order_id) AS pedidos_brutos,
  COUNT(o.order_id) FILTER (
    WHERE o.status = 'completed' AND COALESCE(d.devuelto_usd, 0) = 0
  ) AS nsm_pedidos_valor_entregado,
  ROUND(
    100.0 * COUNT(o.order_id) FILTER (
      WHERE o.status = 'completed' AND COALESCE(d.devuelto_usd, 0) = 0
    ) / COUNT(o.order_id),
    2
  ) AS pct_calidad_entregada,
  ROUND(
    SUM(o.subtotal_usd - o.discount_usd - COALESCE(d.devuelto_usd, 0))
    FILTER (WHERE o.status IN ('completed', 'refunded')),
    2
  ) AS ingreso_neto_realizado_usd,
  ROUND(
    SUM(o.subtotal_usd - o.discount_usd - COALESCE(d.devuelto_usd, 0) - cp.costo_usd)
    FILTER (WHERE o.status IN ('completed', 'refunded')),
    2
  ) AS margen_bruto_neto_usd
FROM orders o
JOIN costo_por_pedido cp ON o.order_id = cp.order_id
LEFT JOIN dev_por_pedido d ON o.order_id = d.order_id
WHERE o.campaign_id IS NOT NULL
GROUP BY o.campaign_id
ORDER BY margen_bruto_neto_usd DESC;`,
    solutionExplanation:
      'Al ordenar por margen_bruto_neto_usd y auditar nsm_pedidos_valor_entregado, demostramos al comité que CMP-BARISTA (407,823.94 USD de margen y 2,520 pedidos perfectos) supera a CMP-RETENCION (404,620.44 USD y 1,940 pedidos perfectos).',
    expectedOutputTable: [
      {
        campaign_id: 'CMP-BARISTA',
        pedidos_brutos: 3000,
        nsm_pedidos_valor_entregado: 2520,
        pct_calidad_entregada: 84.0,
        ingreso_neto_realizado_usd: 876764.57,
        margen_bruto_neto_usd: 407823.94,
      },
      {
        campaign_id: 'CMP-RETENCION',
        pedidos_brutos: 3000,
        nsm_pedidos_valor_entregado: 1940,
        pct_calidad_entregada: 64.67,
        ingreso_neto_realizado_usd: 1053599.58,
        margen_bruto_neto_usd: 404620.44,
      },
      {
        campaign_id: 'CMP-ORIGEN',
        pedidos_brutos: 3000,
        nsm_pedidos_valor_entregado: 2400,
        pct_calidad_entregada: 80.0,
        ingreso_neto_realizado_usd: 428392.93,
        margen_bruto_neto_usd: 205572.39,
      },
      {
        campaign_id: 'CMP-VERANO',
        pedidos_brutos: 3000,
        nsm_pedidos_valor_entregado: 1945,
        pct_calidad_entregada: 64.83,
        ingreso_neto_realizado_usd: 363060.75,
        margen_bruto_neto_usd: 125198.65,
      },
    ],
  },

  roleNotes: {
    de: 'Como Ingeniero de Datos, expón el indicador booleano de pedido con valor entregado (completado y sin reembolso) en la tabla de hechos para estandarizar la Estrella Polar.',
    da: 'Como Analista de Datos, cuando veas que varios equipos clavan exactamente una meta redonda (como 3,000 pedidos), audita de inmediato las tasas de cancelación y devolución.',
    bi: 'Como Analista BI, diseña el cuadro de mando ejecutivo combinando la Métrica Estrella Polar con el árbol de palancas de entrada y el margen bruto neto como guardia.',
  },

  summary: [
    'La ley de Goodhart advierte que usar un indicador aislado como meta de incentivo lleva a inflar el número dañando el negocio.',
    'En Mercado Brisa, la meta de 3,000 pedidos brutos ocultó cientos de pedidos con devolución en la campaña CMP-RETENCION.',
    'Una Métrica Estrella Polar legítima mide unidades de valor efectivamente entregadas al cliente, como pedidos completados sin devolución.',
    'Gobernar la Estrella Polar requiere conectarla con un árbol de palancas operativas y protegerla con umbrales de guardia de margen neto.',
  ],

  flashcards: [
    {
      id: 'fc-bi2-04-01',
      front:
        '¿Qué establece la ley de Goodhart en el contexto del diseño de KPIs?',
      back: 'Que cuando una medida se convierte en una meta de control o incentivo único, deja de ser una buena medida porque los equipos manipulan el indicador superficial a costa del objetivo real.',
    },
    {
      id: 'fc-bi2-04-02',
      front:
        '¿Qué tres condiciones debe cumplir una Métrica Estrella Polar (North Star Metric) bien diseñada?',
      back: '1) Reflejar el valor real entregado al cliente, 2) Ser un indicador adelantado de la sostenibilidad y retención futura, y 3) Descomponerse en palancas operativas accionables.',
    },
    {
      id: 'fc-bi2-04-03',
      front:
        "¿Por qué la Métrica Estrella Polar de Mercado Brisa exige status = 'completed' Y COALESCE(devuelto_usd, 0) = 0?",
      back: 'Porque un pedido cancelado, pendiente o con devolución de mercancía no entregó la experiencia prometida al cliente ni consolidó valor sano para la empresa.',
    },
    {
      id: 'fc-bi2-04-04',
      front:
        '¿Por qué la Métrica Estrella Polar nunca debe gobernarse sin una métrica guardia financiera como el margen bruto neto?',
      back: 'Porque sin guardia de margen, un equipo podría inflar el conteo de pedidos completados sin devolución regalando precios por debajo del costo.',
    },
  ],

  glossaryTerms: [
    'metrica-estrella-polar',
    'ley-de-goodhart',
    'umbral-de-guardia',
    'arbol-de-kpis',
    'margen-bruto',
  ],

  sources: [
    {
      title: 'Amplitude — Product Analytics & Funnel Analysis Interpretation',
      url: 'https://amplitude.com/docs/analytics/charts/funnel-analysis/funnel-analysis-interpret',
      publisher: 'Amplitude',
      accessed: '2026-10-29',
      supports:
        'Articulación entre una métrica de valor entregado al cliente y sus palancas de entrada accionables.',
    },
    {
      title: 'dbt Labs — Semantic Models & Metric Governance',
      url: 'https://docs.getdbt.com/docs/build/semantic-models',
      publisher: 'dbt Labs',
      accessed: '2026-10-29',
      supports:
        'Formalización de métricas compuestas gobernadas en el modelo semántico para evitar distorsión de incentivos.',
    },
    {
      title: 'Kimball Group — Dimensional Modeling Techniques',
      url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/',
      publisher: 'Kimball Group',
      accessed: '2026-10-29',
      supports:
        'Integración de hechos de ventas, costos y devoluciones al mismo grano para auditar rentabilidad real.',
    },
    {
      title: "Goodhart's Law — Formulation and Strathern's Restatement",
      url: 'https://en.wikipedia.org/wiki/Goodhart%27s_law',
      publisher: 'Wikipedia / Monetary History Reference',
      accessed: '2026-10-29',
      supports:
        'Origen histórico de la ley de Goodhart y su aplicación al diseño de sistemas de incentivos y métricas.',
    },
  ],

  aiNotes:
    "El estudiante suele olvidar que pedidos_brutos cuenta los 3,000 pedidos de cada campaña (sin filtrar estado), mientras que ingreso_neto_realizado_usd y margen_bruto_neto_usd llevan FILTER (WHERE o.status IN ('completed', 'refunded')), y nsm_pedidos_valor_entregado lleva FILTER (WHERE o.status = 'completed' AND COALESCE(d.devuelto_usd, 0) = 0). También suele ordenar por nsm_pedidos_valor_entregado en vez de margen_bruto_neto_usd DESC en la práctica.",
};

export default lesson;
