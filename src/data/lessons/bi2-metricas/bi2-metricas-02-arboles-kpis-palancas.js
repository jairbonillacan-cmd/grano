const lesson = {
  id: 'bi2-metricas-02-arboles-kpis-palancas',
  moduleId: 'bi2-metricas',
  tracks: ['bi'],
  level: 2,
  order: 2,
  title: 'Construcción de árboles de KPIs y palancas operativas',
  subtitle:
    'Construcción de árboles de KPIs: descomponer resultados en palancas operativas',
  minutes: 25,
  datasets: ['orders', 'order_items', 'products', 'customers', 'stores'],
  prerequisites: ['bi2-metricas-01-anatomia-metrica'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), el segmento `pro_barista` genera 2,166,164.59 USD en pedidos completados, casi el doble que `cafeteria_b2b` con 1,137,573.13 USD. Ventas propone dar descuentos en `cafeteria_b2b` creyendo que sus clientes arman carritos pequeños. Sin embargo, al desglosar el ingreso en factores operativos, el ticket neto en `cafeteria_b2b` resulta ser de 439.05 USD frente a 347.75 USD en `pro_barista`. ¿Cómo descompones un KPI financiero en un árbol matemático que revele qué palanca operativa debes accionar?',

  objectives: [
    'Construir árboles de KPIs mediante descomposiciones multiplicativas (clientes activos × frecuencia × unidades por pedido × precio neto unitario) y aditivas (suma de segmentos o regiones).',
    'Distinguir entre métricas de resultado rezagadas (lagging) y palancas operativas adelantadas (leading) sobre las que un equipo puede intervenir.',
    'Implementar consultas SQL con CTEs al grano de pedido que desglosen el ingreso neto y el margen bruto sin distorsiones de agregación.',
  ],

  sections: [
    {
      id: 'descomposicion-aditiva-multiplicativa',
      heading: 'Ramas aditivas y multiplicativas de un árbol de KPIs',
      body: 'Un indicador financiero de primer nivel, como el ingreso neto trimestral, evalúa el desempeño global pero no guía el trabajo diario. Ningún equipo puede oprimir un botón que suba el ingreso neto por decreto. Un **árbol de KPIs** resuelve esto descomponiendo la métrica raíz en una identidad matemática de factores accionables.\n\nExisten dos clases de ramas en un árbol de KPIs. Las ramas aditivas dividen el total en partes mutuamente excluyentes cuya suma reconstruye la raíz. En los pedidos completados de Mercado Brisa (`5,404,389.77` USD), el total es la suma de `pro_barista` (`2,166,164.59` USD), `retail` (`2,100,652.05` USD) y `cafeteria_b2b` (`1,137,573.13` USD). Las ramas aditivas muestran dónde se concentra el volumen.\n\nLas ramas multiplicativas expresan el mecanismo causal encadenando razones cuyos términos se cancelan entre sí. La fórmula es `Ingreso Neto = Clientes Activos × (Pedidos / Cliente) × (Unidades / Pedido) × (Ingreso Neto / Unidad)`. Esta identidad une adquisición, frecuencia de recompra, tamaño de cesta y precio realizado en una sola ecuación.',
      example: {
        language: 'sql',
        code: `WITH lineas_pedido AS (
  SELECT
    order_id,
    SUM(qty) AS unidades_pedido
  FROM order_items
  GROUP BY order_id
),
pedidos_completados AS (
  SELECT
    o.order_id,
    o.customer_id,
    c.segment,
    o.subtotal_usd - o.discount_usd AS ingreso_neto_usd,
    lp.unidades_pedido
  FROM orders o
  JOIN customers c ON o.customer_id = c.customer_id
  JOIN lineas_pedido lp ON o.order_id = lp.order_id
  WHERE o.status = 'completed'
)
SELECT
  segment,
  COUNT(DISTINCT customer_id) AS clientes_activos,
  ROUND(COUNT(order_id) * 1.0 / COUNT(DISTINCT customer_id), 2) AS frecuencia_pedidos,
  ROUND(SUM(unidades_pedido) * 1.0 / COUNT(order_id), 2) AS unidades_por_pedido,
  ROUND(SUM(ingreso_neto_usd) / SUM(unidades_pedido), 2) AS precio_neto_unidad_usd,
  ROUND(SUM(ingreso_neto_usd) / COUNT(order_id), 2) AS ticket_neto_usd,
  ROUND(SUM(ingreso_neto_usd), 2) AS ingreso_neto_total_usd
FROM pedidos_completados
GROUP BY segment
ORDER BY ingreso_neto_total_usd DESC;`,
        expectedOutput: [
          {
            segment: 'pro_barista',
            clientes_activos: 936,
            frecuencia_pedidos: 6.65,
            unidades_por_pedido: 4.58,
            precio_neto_unidad_usd: 75.98,
            ticket_neto_usd: 347.75,
            ingreso_neto_total_usd: 2166164.59,
          },
          {
            segment: 'retail',
            clientes_activos: 924,
            frecuencia_pedidos: 6.43,
            unidades_por_pedido: 4.65,
            precio_neto_unidad_usd: 76.01,
            ticket_neto_usd: 353.65,
            ingreso_neto_total_usd: 2100652.05,
          },
          {
            segment: 'cafeteria_b2b',
            clientes_activos: 432,
            frecuencia_pedidos: 6.0,
            unidades_por_pedido: 5.75,
            precio_neto_unidad_usd: 76.31,
            ticket_neto_usd: 439.05,
            ingreso_neto_total_usd: 1137573.13,
          },
        ],
      },
    },
    {
      id: 'rezagadas-vs-adelantadas',
      heading: 'Métricas rezagadas de resultado frente a palancas adelantadas',
      body: 'El árbol separa dos horizontes temporales: **métricas rezagadas** (*lagging*) y **palancas operativas** adelantadas (*leading*). El ingreso neto o el margen trimestral son indicadores rezagados. Confirman el efecto acumulado de decisiones tomadas semanas atrás. Cuando detectas su caída al cerrar el trimestre, ya no puedes corregir ese periodo.\n\nUna **palanca operativa** es un nodo hijo del árbol que responde a la acción directa de un equipo y anticipa el resultado futuro. En Mercado Brisa, el equipo de Catálogo no controla el ingreso total de `cafeteria_b2b`. Pero sí acciona la palanca de unidades por pedido (`5.75` unidades) ofreciendo formatos mayoristas de café.\n\nDel mismo modo, el equipo de Retención mueve la frecuencia de compra (`6.65` pedidos por cliente en `pro_barista` frente a `6.00` en `cafeteria_b2b`). Diagnosticar con el árbol evita errores costosos. Dar descuentos en `cafeteria_b2b` dañaría su buen precio neto por unidad (`76.31` USD) sin atacar su verdadero freno: pocos clientes activos (`432`) y menor frecuencia.',
    },
    {
      id: 'composicion-y-simpson-en-arboles',
      heading: 'Efectos de mezcla y paradoja de Simpson en las ramas del árbol',
      body: 'Si miras solo la raíz del árbol de KPIs, los cambios en la mezcla de segmentos pueden ocultar el movimiento real de las palancas. Como ocurre en la **paradoja de Simpson**, un promedio global puede caer aunque todos los subgrupos mejoren si crece el peso de un segmento con ticket menor.\n\nEn Mercado Brisa, las tiendas de la región `Iberia` atienden a `400` clientes activos que compran `7.03` veces con un ticket neto de `413.50` USD. Así generan `1,162,354.24` USD de ingreso neto. En cambio, la región `Norteamérica` atiende a `364` clientes con menor frecuencia (`5.79`) y un ticket neto de `355.97` USD, sumando `750,385.12` USD.\n\nSi la compañía abre más tiendas en regiones de menor ticket promedio como `Andina` (`348.70` USD), el ticket promedio global bajará. Un analista sin árbol creería que todas las regiones están vendiendo peor. Por eso todo árbol de KPIs debe cruzarse con dimensiones conformadas (`segment`, `region`, `store_type`) antes de tomar decisiones.',
      interactive: {
        component: 'simpsons-paradox-explorer',
        caption:
          'Explorador de efectos de composición: observa cómo el cambio de peso entre segmentos invierte la tendencia del indicador agregado.',
      },
    },
  ],

  workedExample: {
    title:
      'Diagnóstico regional en tiendas: frecuencia, ticket neto y margen bruto',
    description:
      'Descompone el ingreso neto por región de tienda (stores.region) en clientes activos, frecuencia de compra, ticket neto y margen bruto preagregando costos de order_items y products al grano de pedido.',
    steps: [
      {
        label:
          'Paso 1 — Vista plana insuficiente: solo ingreso y conteo de pedidos por región',
        explanation:
          'Si solo reportamos el ingreso neto y el número de pedidos completados por región de tienda, vemos que Iberia genera 1,162,354.24 USD en 2,811 pedidos frente a los 1,715,972.64 USD de Andina en 4,921 pedidos. Sin embargo, esta vista plana oculta que Iberia tiene un valor por pedido y por cliente mucho más alto.',
        code: `SELECT
  s.region,
  COUNT(o.order_id) AS pedidos_completados,
  ROUND(SUM(o.subtotal_usd - o.discount_usd), 2) AS ingreso_neto_usd
FROM orders o
JOIN stores s ON o.store_id = s.store_id
WHERE o.status = 'completed'
GROUP BY s.region
ORDER BY ingreso_neto_usd DESC;`,
        expectedOutput: [
          {
            region: 'Cono Sur',
            pedidos_completados: 4920,
            ingreso_neto_usd: 1775677.77,
          },
          {
            region: 'Andina',
            pedidos_completados: 4921,
            ingreso_neto_usd: 1715972.64,
          },
          {
            region: 'Iberia',
            pedidos_completados: 2811,
            ingreso_neto_usd: 1162354.24,
          },
          {
            region: 'Norteamérica',
            pedidos_completados: 2108,
            ingreso_neto_usd: 750385.12,
          },
        ],
      },
      {
        label:
          'Paso 2 — Árbol completo por región: clientes, frecuencia, ticket y margen bruto',
        explanation:
          'Preagregamos el costo directo de líneas (uniendo order_items y products) por order_id y desplegamos las palancas del árbol. Iberia lidera toda la empresa tanto en frecuencia (7.03 pedidos/cliente frente a 6.44 en Cono Sur y Andina) como en ticket neto (413.50 USD), aportando 550,570.06 USD de margen bruto con solo 400 clientes.',
        code: `WITH costo_por_pedido AS (
  SELECT
    oi.order_id,
    SUM(oi.qty * p.unit_cost_usd) AS costo_usd
  FROM order_items oi
  JOIN products p ON oi.product_id = p.product_id
  GROUP BY oi.order_id
)
SELECT
  s.region,
  COUNT(DISTINCT o.customer_id) AS clientes_activos,
  COUNT(o.order_id) AS pedidos_completados,
  ROUND(COUNT(o.order_id) * 1.0 / COUNT(DISTINCT o.customer_id), 2) AS frecuencia_pedidos,
  ROUND(SUM(o.subtotal_usd - o.discount_usd) / COUNT(o.order_id), 2) AS ticket_neto_usd,
  ROUND(SUM(o.subtotal_usd - o.discount_usd), 2) AS ingreso_neto_usd,
  ROUND(SUM(o.subtotal_usd - o.discount_usd - cp.costo_usd), 2) AS margen_bruto_usd
FROM orders o
JOIN stores s ON o.store_id = s.store_id
JOIN costo_por_pedido cp ON o.order_id = cp.order_id
WHERE o.status = 'completed'
GROUP BY s.region
ORDER BY ingreso_neto_usd DESC;`,
        expectedOutput: [
          {
            region: 'Cono Sur',
            clientes_activos: 764,
            pedidos_completados: 4920,
            frecuencia_pedidos: 6.44,
            ticket_neto_usd: 360.91,
            ingreso_neto_usd: 1775677.77,
            margen_bruto_usd: 839893.87,
          },
          {
            region: 'Andina',
            clientes_activos: 764,
            pedidos_completados: 4921,
            frecuencia_pedidos: 6.44,
            ticket_neto_usd: 348.7,
            ingreso_neto_usd: 1715972.64,
            margen_bruto_usd: 811972.07,
          },
          {
            region: 'Iberia',
            clientes_activos: 400,
            pedidos_completados: 2811,
            frecuencia_pedidos: 7.03,
            ticket_neto_usd: 413.5,
            ingreso_neto_usd: 1162354.24,
            margen_bruto_usd: 550570.06,
          },
          {
            region: 'Norteamérica',
            clientes_activos: 364,
            pedidos_completados: 2108,
            frecuencia_pedidos: 5.79,
            ticket_neto_usd: 355.97,
            ingreso_neto_usd: 750385.12,
            margen_bruto_usd: 354791.46,
          },
        ],
      },
    ],
  },

  checks: [
    {
      id: 'chk-bi2-02-palanca-b2b',
      type: 'predict-output',
      prompt:
        'Según la descomposición multiplicativa de Mercado Brisa en pedidos completados, ¿qué palanca explica que cafeteria_b2b tenga un ticket neto por pedido mayor (439.05 USD) que pro_barista (347.75 USD)?',
      options: [
        {
          id: 'a',
          text: 'El tamaño de cesta: cafeteria_b2b compra 5.75 unidades por pedido frente a 4.58 unidades en pro_barista, con un precio neto por unidad similar (~76 USD).',
          correct: true,
          feedback:
            'Correcto. 5.75 unidades/pedido × 76.31 USD/unidad produce el ticket neto de 439.05 USD en cafeteria_b2b.',
        },
        {
          id: 'b',
          text: 'La frecuencia de compra: cafeteria_b2b realiza 9.50 pedidos por cliente frente a 6.65 en pro_barista.',
          correct: false,
          feedback:
            'Incorrecto. La frecuencia multiplica el ingreso por cliente, no el ticket por pedido, y además cafeteria_b2b tiene menor frecuencia (6.00).',
        },
        {
          id: 'c',
          text: 'El volumen de clientes activos: cafeteria_b2b dobla en clientes a pro_barista.',
          correct: false,
          feedback:
            'Incorrecto. cafeteria_b2b tiene 432 clientes activos frente a 936 en pro_barista.',
        },
      ],
      explanation:
        'El ticket neto por pedido es el producto de Unidades por Pedido × Precio Neto por Unidad. Como ambos segmentos pagan alrededor de 76 USD por unidad, la diferencia radica en el tamaño físico del carrito: 5.75 unidades por pedido en cafeteria_b2b frente a 4.58 en pro_barista.',
    },
    {
      id: 'chk-bi2-02-leading-lagging',
      type: 'mcq',
      prompt:
        '¿Cuál de las siguientes opciones describe correctamente la relación entre una palanca operativa adelantada (leading) y una métrica de resultado rezagada (lagging) en un árbol de KPIs?',
      options: [
        {
          id: 'a',
          text: 'La métrica rezagada es más fácil de modificar en el día a día porque depende de un solo equipo operativo.',
          correct: false,
          feedback:
            'Incorrecto. La métrica rezagada agrega múltiples efectos acumulados y ningún equipo puede alterarla directamente sin mover primero las palancas de entrada.',
        },
        {
          id: 'b',
          text: 'La palanca adelantada mide una conducta o factor temprano (como unidades por carrito o tasa de recompra a 30 días) que predice y causa el cambio en la métrica rezagada.',
          correct: true,
          feedback:
            'Correcto. Mover una palanca operativa adelantada es el mecanismo causal que altera el resultado financiero futuro.',
        },
        {
          id: 'c',
          text: 'Ambas miden exactamente el mismo fenómeno, pero la métrica adelantada se calcula sin filtros canónicos para obtener datos más rápido.',
          correct: false,
          feedback:
            'Incorrecto. Quitar filtros canónicos solo introduce ruido; una palanca adelantada es un nodo causal distinto dentro del árbol.',
        },
      ],
      explanation:
        'En un árbol de KPIs, la raíz (ingreso neto o margen trimestral) confirma el resultado pasado (lagging), mientras que los nodos hijos (frecuencia de compra, conversión de checkout o unidades por pedido) son palancas adelantadas (leading) accionables por los equipos.',
    },
    {
      id: 'chk-bi2-02-orden-arbol',
      type: 'order',
      prompt:
        'Ordena de arriba hacia abajo (desde la raíz financiera hasta la palanca operativa más granular del carrito) los niveles del árbol multiplicativo de ingresos:',
      items: [
        'Ticket Neto Promedio por Pedido (Ingreso Neto / Pedidos)',
        'Ingreso Neto Total (Raíz del árbol)',
        'Unidades por Pedido y Precio Neto por Unidad (Palancas del carrito)',
        'Ingreso Neto por Cliente Activo (Frecuencia × Ticket Neto)',
      ],
      correctOrder: [
        'Ingreso Neto Total (Raíz del árbol)',
        'Ingreso Neto por Cliente Activo (Frecuencia × Ticket Neto)',
        'Ticket Neto Promedio por Pedido (Ingreso Neto / Pedidos)',
        'Unidades por Pedido y Precio Neto por Unidad (Palancas del carrito)',
      ],
      explanation:
        'La descomposición jerárquica parte del Ingreso Neto Total, se divide entre Clientes Activos para obtener el valor por cliente, luego separa la Frecuencia del Ticket Neto por Pedido, y finalmente desglosa el ticket en Unidades por Pedido y Precio Neto por Unidad.',
    },
  ],

  practice: {
    type: 'sql',
    title: 'Descomposición del árbol de KPIs por segmento de cliente',
    language: 'sql',
    prompt:
      "Construye la tabla de descomposición del árbol de KPIs por segmento de cliente (`segment`) para los pedidos completados (`status = 'completed'`). Preagrega `order_items` (`SUM(qty) AS unidades`) por `order_id` para obtener las unidades de cada pedido sin fan-out. Devuelve siete columnas exactas: `segment`, `clientes_activos` (`COUNT(DISTINCT customer_id)`), `pedidos_completados` (`COUNT(order_id)`), `frecuencia_pedidos` (`pedidos / clientes_activos` redondeado a 2 decimales), `unidades_por_pedido` (`SUM(unidades) / pedidos` redondeado a 2 decimales), `ticket_neto_usd` (`SUM(subtotal_usd - discount_usd) / pedidos` redondeado a 2 decimales) e `ingreso_neto_usd` (`SUM(subtotal_usd - discount_usd)` redondeado a 2 decimales). Ordena de mayor a menor por `ingreso_neto_usd`.",
    starterCode: `WITH unidades_por_orden AS (
  SELECT
    order_id,
    SUM(qty) AS unidades
  FROM order_items
  GROUP BY order_id
)
SELECT
  c.segment,
  COUNT(DISTINCT o.customer_id) AS clientes_activos,
  COUNT(o.order_id) AS pedidos_completados,
  -- Completa las palancas del árbol redondeadas a 2 decimales:
  0.0 AS frecuencia_pedidos,
  0.0 AS unidades_por_pedido,
  0.0 AS ticket_neto_usd,
  ROUND(SUM(o.subtotal_usd - o.discount_usd), 2) AS ingreso_neto_usd
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
JOIN unidades_por_orden u ON o.order_id = u.order_id
WHERE o.status = 'completed'
GROUP BY c.segment
ORDER BY ingreso_neto_usd DESC;`,
    expected: `WITH unidades_por_orden AS (
  SELECT
    order_id,
    SUM(qty) AS unidades
  FROM order_items
  GROUP BY order_id
)
SELECT
  c.segment,
  COUNT(DISTINCT o.customer_id) AS clientes_activos,
  COUNT(o.order_id) AS pedidos_completados,
  ROUND(COUNT(o.order_id) * 1.0 / COUNT(DISTINCT o.customer_id), 2) AS frecuencia_pedidos,
  ROUND(SUM(u.unidades) * 1.0 / COUNT(o.order_id), 2) AS unidades_por_pedido,
  ROUND(SUM(o.subtotal_usd - o.discount_usd) / COUNT(o.order_id), 2) AS ticket_neto_usd,
  ROUND(SUM(o.subtotal_usd - o.discount_usd), 2) AS ingreso_neto_usd
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
JOIN unidades_por_orden u ON o.order_id = u.order_id
WHERE o.status = 'completed'
GROUP BY c.segment
ORDER BY ingreso_neto_usd DESC;`,
    orderMatters: true,
    hints: [
      'Calcula frecuencia_pedidos como ROUND(COUNT(o.order_id) * 1.0 / COUNT(DISTINCT o.customer_id), 2).',
      'Calcula unidades_por_pedido como ROUND(SUM(u.unidades) * 1.0 / COUNT(o.order_id), 2).',
      'Calcula ticket_neto_usd como ROUND(SUM(o.subtotal_usd - o.discount_usd) / COUNT(o.order_id), 2).',
    ],
    solution: `WITH unidades_por_orden AS (
  SELECT
    order_id,
    SUM(qty) AS unidades
  FROM order_items
  GROUP BY order_id
)
SELECT
  c.segment,
  COUNT(DISTINCT o.customer_id) AS clientes_activos,
  COUNT(o.order_id) AS pedidos_completados,
  ROUND(COUNT(o.order_id) * 1.0 / COUNT(DISTINCT o.customer_id), 2) AS frecuencia_pedidos,
  ROUND(SUM(u.unidades) * 1.0 / COUNT(o.order_id), 2) AS unidades_por_pedido,
  ROUND(SUM(o.subtotal_usd - o.discount_usd) / COUNT(o.order_id), 2) AS ticket_neto_usd,
  ROUND(SUM(o.subtotal_usd - o.discount_usd), 2) AS ingreso_neto_usd
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
JOIN unidades_por_orden u ON o.order_id = u.order_id
WHERE o.status = 'completed'
GROUP BY c.segment
ORDER BY ingreso_neto_usd DESC;`,
    solutionExplanation:
      'El árbol revela la anatomía de cada segmento: pro_barista lidera por base de clientes (936) y frecuencia (6.65 pedidos/cliente), mientras que cafeteria_b2b tiene la cesta más grande (5.75 unidades y 439.05 USD por pedido), por lo que su palanca de crecimiento es captar y retener más cafeterías.',
    expectedOutputTable: [
      {
        segment: 'pro_barista',
        clientes_activos: 936,
        pedidos_completados: 6229,
        frecuencia_pedidos: 6.65,
        unidades_por_pedido: 4.58,
        ticket_neto_usd: 347.75,
        ingreso_neto_usd: 2166164.59,
      },
      {
        segment: 'retail',
        clientes_activos: 924,
        pedidos_completados: 5940,
        frecuencia_pedidos: 6.43,
        unidades_por_pedido: 4.65,
        ticket_neto_usd: 353.65,
        ingreso_neto_usd: 2100652.05,
      },
      {
        segment: 'cafeteria_b2b',
        clientes_activos: 432,
        pedidos_completados: 2591,
        frecuencia_pedidos: 6.0,
        unidades_por_pedido: 5.75,
        ticket_neto_usd: 439.05,
        ingreso_neto_usd: 1137573.13,
      },
    ],
  },

  roleNotes: {
    de: 'Como Ingeniero de Datos, expón vistas al grano de pedido que ya incluyan unidades totales y costo de líneas preagregados para facilitar el cálculo rápido de árboles de KPIs.',
    da: 'Como Analista de Datos, cuando un KPI financiero caiga o suba en el cierre mensual, descompón siempre la variación en sus factores multiplicativos antes de recomendar una acción comercial al negocio.',
    bi: 'Como Analista BI, estructura los tableros ejecutivos siguiendo la jerarquía del árbol: métrica raíz arriba, desglose aditivo por segmento al centro y palancas operativas abajo.',
  },

  summary: [
    'Un árbol de KPIs traduce un resultado financiero rezagado en una identidad matemática de palancas operativas accionables.',
    'Las ramas aditivas suman segmentos excluyentes; las multiplicativas encadenan Clientes × Frecuencia × Unidades/Pedido × Precio/Unidad.',
    'En Mercado Brisa, cafeteria_b2b logra el mayor ticket (439.05 USD) por su cesta (5.75 unidades), pero tiene menor frecuencia.',
    'Cruzar el árbol con dimensiones conformadas previene diagnósticos falsos provocados por efectos de mezcla o paradoja de Simpson.',
  ],

  flashcards: [
    {
      id: 'fc-bi2-02-01',
      front:
        '¿Cuál es la diferencia entre una descomposición aditiva y una multiplicativa en un árbol de KPIs?',
      back: 'La aditiva suma subconjuntos disjuntos (como ingresos por región o segmento), mientras que la multiplicativa encadena factores causales (Clientes Activos × Frecuencia × Ticket Promedio).',
    },
    {
      id: 'fc-bi2-02-02',
      front:
        '¿En qué se diferencia una métrica rezagada (lagging) de una palanca operativa adelantada (leading)?',
      back: 'La métrica rezagada confirma el resultado final acumulado (ej. ingreso trimestral); la palanca adelantada mide un factor temprano y accionable (ej. unidades por pedido o frecuencia) que mueve ese resultado.',
    },
    {
      id: 'fc-bi2-02-03',
      front:
        '¿Cómo se descompone multiplicativamente el Ticket Neto Promedio por pedido en comercio electrónico?',
      back: 'Ticket Neto por Pedido = (Unidades por Pedido) × (Precio Neto Realizado por Unidad).',
    },
    {
      id: 'fc-bi2-02-04',
      front:
        '¿Por qué debes preagregar order_items por order_id antes de unir con orders al construir un árbol de KPIs?',
      back: 'Porque cada pedido tiene múltiples líneas de producto; unir directamente multiplicaría las filas de orders e inflaría el subtotal_usd y el conteo de pedidos.',
    },
  ],

  glossaryTerms: [
    'arbol-de-kpis',
    'palanca-operativa',
    'metrica-rezagada-vs-adelantada',
    'c02-cte-preagg',
    'ingreso-neto',
  ],

  sources: [
    {
      title: 'dbt Labs — dbt Semantic Layer & Metric Composition',
      url: 'https://docs.getdbt.com/docs/use-dbt-semantic-layer/dbt-sl',
      publisher: 'dbt Labs',
      accessed: '2026-10-29',
      supports:
        'Composición jerárquica de métricas derivadas y de razón sobre medidas base en la capa semántica.',
    },
    {
      title: 'Cube.dev — Data Modeling Concepts',
      url: 'https://cube.dev/docs/product/data-modeling/concepts',
      publisher: 'Cube Dev, Inc.',
      accessed: '2026-10-29',
      supports:
        'Modelado de medidas aditivas y multiplicativas cruzadas por dimensiones de negocio.',
    },
    {
      title: 'Kimball Group — Conformed Dimensions',
      url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/conformed-dimension/',
      publisher: 'Kimball Group',
      accessed: '2026-10-29',
      supports:
        'Uso de dimensiones conformadas (segmento, región) para desglosar árboles de KPIs con consistencia.',
    },
    {
      title: "Stanford Encyclopedia of Philosophy — Simpson's Paradox",
      url: 'https://plato.stanford.edu/entries/paradox-simpson/',
      publisher: 'Stanford University',
      accessed: '2026-10-29',
      supports:
        'Fundamento matemático de la reversión de promedios agregados por cambios en la mezcla de subgrupos.',
    },
  ],

  aiNotes:
    'El estudiante suele olvidar multiplicar por 1.0 o hacer CAST al dividir enteros como COUNT(order_id) / COUNT(DISTINCT customer_id), o intenta unir orders con order_items sin agrupar antes por order_id, lo que triplica el subtotal_usd de los pedidos con varias líneas. Recuérdale que cafeteria_b2b gana en unidades por pedido (5.75), pero pro_barista gana en clientes activos (936) y frecuencia (6.65).',
};

export default lesson;
