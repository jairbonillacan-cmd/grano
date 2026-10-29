export const lesson = {
  id: 'c2-dimensional-03-scd2-history',
  legacyId: 'l5-scd2-history',
  legacyOrder: 5,
  moduleId: 'c2-dimensional',
  tracks: ['core', 'de', 'da', 'bi'],
  level: 2,
  order: 3,
  title: 'Dimensiones lentamente cambiantes (SCD Tipo 2)',
  subtitle:
    'Versionado histórico de dimensiones, intervalos semiabiertos [valid_from, valid_to) y cruces Point-in-Time',
  minutes: 30,
  prerequisites: ['c2-dimensional-02-star-schema-obt'],
  contentVersion: 2,
  hook: 'Un cliente de Mercado Brisa compró grano básico durante su primer año en el nivel `bronce` y ascendió recientemente al nivel `oro`. Cuando Finanzas cruzó las `14,760` órdenes completadas con `customers.current_tier`, el nivel `bronce` perdió `$628,099.05` de ingresos históricos que fueron reasignados retroactivamente a `oro` y `platino`. Peor aún, un analista que intentó unir `orders` con `customer_changes` solo por `customer_id` multiplicó las órdenes hasta `25,271` filas. ¿Cómo preserva un almacén dimensional la verdad histórica exacta en cada transacción?',
  objectives: [
    'Diferenciar las estrategias SCD Tipo 1 (sobrescritura As-Is), SCD Tipo 2 (versionado por fila As-Was) y SCD Tipo 3 (columna de valor previo).',
    'Modelar intervalos temporales semiabiertos `[valid_from, valid_to)` evitando solapamientos y pérdida de registros vigentes (`valid_to IS NULL`).',
    'Escribir consultas Point-in-Time sobre `orders` y `customer_changes` en DuckDB sin inflar el conteo de transacciones.',
  ],
  sections: [
    {
      id: 'sec-taxonomia-scd',
      heading: 'Taxonomía de Kimball: SCD Tipo 1, Tipo 2 y Tipo 3',
      body: 'A diferencia de las tablas de hechos inmutables, los atributos de una dimensión evolucionan con el tiempo. Un cliente cambia de ciudad, de segmento comercial o de nivel de fidelidad (`tier`). Ralph Kimball definió las **dimensiones lentamente cambiantes** (*Slowly Changing Dimensions*, `SCD`) para gobernar cómo responde el modelo analítico ante cada cambio.\n\nEl **SCD Tipo 1** sobrescribe el valor anterior con el nuevo directamente en la fila de la dimensión (`customers.current_tier`). Sirve para corregir errores tipográficos, pero destruye el rastro histórico. Todo reporte basado en Tipo 1 responde en modo **As-Is** (estado actual) y reescribe el pasado cuando un atributo muta.\n\nEl **SCD Tipo 3** agrega una columna específica para guardar únicamente el estado inmediato anterior (`previous_tier`). Permite comparar una transición única, pero pierde cambios intermedios. El **SCD Tipo 2** resuelve la auditoría histórica completa insertando una nueva fila por cada cambio en `customer_changes` (`4,100` versiones para `2,400` clientes). Cada versión recibe una clave sustituta propia (`change_id`) y marcas de vigencia `valid_from`, `valid_to` e `is_current`.',
      example: {
        language: 'sql',
        code: `SELECT
  change_id,
  customer_id,
  segment,
  tier,
  CAST(valid_from AS DATE) AS valid_from_date,
  CAST(valid_to AS DATE) AS valid_to_date,
  is_current
FROM customer_changes
WHERE customer_id IN (1, 2)
ORDER BY customer_id ASC, valid_from ASC;`,
        expectedOutput: [
          {
            change_id: 1,
            customer_id: 1,
            segment: 'retail',
            tier: 'bronce',
            valid_from_date: '2023-05-12',
            valid_to_date: '2023-07-14',
            is_current: false,
          },
          {
            change_id: 2,
            customer_id: 1,
            segment: 'pro_barista',
            tier: 'plata',
            valid_from_date: '2023-07-14',
            valid_to_date: '2023-12-02',
            is_current: false,
          },
          {
            change_id: 3,
            customer_id: 1,
            segment: 'pro_barista',
            tier: 'platino',
            valid_from_date: '2023-12-02',
            valid_to_date: null,
            is_current: true,
          },
          {
            change_id: 4,
            customer_id: 2,
            segment: 'retail',
            tier: 'bronce',
            valid_from_date: '2024-04-30',
            valid_to_date: '2024-09-24',
            is_current: false,
          },
          {
            change_id: 5,
            customer_id: 2,
            segment: 'pro_barista',
            tier: 'plata',
            valid_from_date: '2024-09-24',
            valid_to_date: '2025-02-02',
            is_current: false,
          },
          {
            change_id: 6,
            customer_id: 2,
            segment: 'pro_barista',
            tier: 'oro',
            valid_from_date: '2025-02-02',
            valid_to_date: null,
            is_current: true,
          },
        ],
      },
    },
    {
      id: 'sec-point-in-time-join',
      heading: 'Intervalos semiabiertos [valid_from, valid_to) y cruce Point-in-Time',
      body: 'Para reconstruir la realidad exacta en el instante de una compra —reporte **As-Was**—, ejecutamos un cruce **Point-in-Time** entre el hecho (`orders.order_ts`) y la dimensión versionada (`customer_changes`). Si unimos ambas tablas solo por la clave natural `o.customer_id = cc.customer_id`, cada pedido se multiplica por el número de versiones del cliente. Las `14,760` órdenes completadas se inflan así hasta `25,271` filas.\n\nUn diseño riguroso modela la vigencia como un **intervalo semiabierto** por la derecha: `[valid_from, valid_to)`. Esto exige evaluar `o.order_ts >= cc.valid_from` junto con `o.order_ts < cc.valid_to`. Si empleáramos `BETWEEN valid_from AND valid_to`, un evento ocurrido en el segundo exacto del cambio coincidiría con dos filas a la vez.\n\nAdemás, cuando la fila activa representa el límite superior abierto con `valid_to IS NULL`, el predicado debe incluir `(o.order_ts < cc.valid_to OR cc.valid_to IS NULL)`. También puede escribirse con `COALESCE(cc.valid_to, TIMESTAMP \'9999-12-31\')`. Omitir el caso nulo descarta silenciosamente todas las compras ocurridas en la versión vigente del cliente.',
      interactive: {
        component: 'scd2-timeline-builder',
        caption:
          'Simula cambios de segmento y nivel de un cliente a lo largo del tiempo y observa cómo cambian las atribuciones entre SCD Tipo 1 (As-Is) y SCD Tipo 2 (As-Was).',
      },
      example: {
        language: 'sql',
        code: `SELECT
  (SELECT COUNT(*) FROM orders WHERE status = 'completed') AS base_completed_orders,
  (SELECT COUNT(*)
   FROM orders o
   INNER JOIN customer_changes cc ON o.customer_id = cc.customer_id
   WHERE o.status = 'completed') AS naive_join_rows,
  (SELECT COUNT(*)
   FROM orders o
   INNER JOIN customer_changes cc
     ON o.customer_id = cc.customer_id
    AND o.order_ts >= cc.valid_from
    AND (o.order_ts < cc.valid_to OR cc.valid_to IS NULL)
   WHERE o.status = 'completed') AS pit_join_rows;`,
        expectedOutput: [
          {
            base_completed_orders: 14760,
            naive_join_rows: 25271,
            pit_join_rows: 14760,
          },
        ],
      },
    },
  ],
  workedExample: {
    title: 'Auditoría de distorsión financiera entre reporte As-Is (Tipo 1) y As-Was (Tipo 2)',
    description:
      'El comité directivo de Mercado Brisa sospecha que el reporte de ingresos por nivel de fidelidad sobreestima los niveles altos porque lee `customers.current_tier` (SCD Tipo 1). Cuantificaremos en tres pasos la diferencia exacta frente al historial real en `customer_changes` (SCD Tipo 2).',
    steps: [
      {
        label: 'Paso 1: Calcular el reporte As-Is (SCD Tipo 1)',
        explanation:
          'Calculamos el reporte As-Is uniendo las órdenes completadas con `customers.current_tier`.',
        code: `SELECT
  c.current_tier AS tier,
  COUNT(o.order_id) AS as_is_orders,
  ROUND(SUM(o.total_usd), 2) AS as_is_revenue_usd
FROM orders o
INNER JOIN customers c ON o.customer_id = c.customer_id
WHERE o.status = 'completed'
GROUP BY c.current_tier
ORDER BY as_is_revenue_usd DESC;`,
        expectedOutput: [
          { tier: 'oro', as_is_orders: 6468, as_is_revenue_usd: 2910010.27 },
          { tier: 'plata', as_is_orders: 4630, as_is_revenue_usd: 1873949.75 },
          { tier: 'bronce', as_is_orders: 2247, as_is_revenue_usd: 900084.3 },
          { tier: 'platino', as_is_orders: 1415, as_is_revenue_usd: 585418.1 },
        ],
      },
      {
        label: 'Paso 2: Calcular el reporte As-Was (SCD Tipo 2)',
        explanation:
          'Calculamos el reporte As-Was cruzando `orders` con `customer_changes` mediante el predicado Point-in-Time `[valid_from, valid_to)`.',
        code: `SELECT
  cc.tier AS tier,
  COUNT(o.order_id) AS as_was_orders,
  ROUND(SUM(o.total_usd), 2) AS as_was_revenue_usd
FROM orders o
INNER JOIN customer_changes cc
  ON o.customer_id = cc.customer_id
 AND o.order_ts >= cc.valid_from
 AND (o.order_ts < cc.valid_to OR cc.valid_to IS NULL)
WHERE o.status = 'completed'
GROUP BY cc.tier
ORDER BY as_was_revenue_usd DESC;`,
        expectedOutput: [
          { tier: 'oro', as_was_orders: 5485, as_was_revenue_usd: 2497409.26 },
          { tier: 'plata', as_was_orders: 4567, as_was_revenue_usd: 1856698.12 },
          { tier: 'bronce', as_was_orders: 3746, as_was_revenue_usd: 1528183.35 },
          { tier: 'platino', as_was_orders: 962, as_was_revenue_usd: 387171.69 },
        ],
      },
      {
        label: 'Paso 3: Cuantificar la distorsión en dólares por nivel',
        explanation:
          'Comparamos ambos resultados por nivel para medir la distorsión contable (`as_is_revenue_usd - as_was_revenue_usd`).',
        code: `WITH as_is AS (
  SELECT
    c.current_tier AS tier,
    ROUND(SUM(o.total_usd), 2) AS as_is_revenue_usd
  FROM orders o
  INNER JOIN customers c ON o.customer_id = c.customer_id
  WHERE o.status = 'completed'
  GROUP BY c.current_tier
),
as_was AS (
  SELECT
    cc.tier AS tier,
    ROUND(SUM(o.total_usd), 2) AS as_was_revenue_usd
  FROM orders o
  INNER JOIN customer_changes cc
    ON o.customer_id = cc.customer_id
   AND o.order_ts >= cc.valid_from
   AND (o.order_ts < cc.valid_to OR cc.valid_to IS NULL)
  WHERE o.status = 'completed'
  GROUP BY cc.tier
)
SELECT
  w.tier,
  w.as_was_revenue_usd,
  i.as_is_revenue_usd,
  ROUND(i.as_is_revenue_usd - w.as_was_revenue_usd, 2) AS distortion_usd
FROM as_was w
INNER JOIN as_is i ON w.tier = i.tier
ORDER BY w.as_was_revenue_usd DESC;`,
        expectedOutput: [
          {
            tier: 'oro',
            as_was_revenue_usd: 2497409.26,
            as_is_revenue_usd: 2910010.27,
            distortion_usd: 412601.01,
          },
          {
            tier: 'plata',
            as_was_revenue_usd: 1856698.12,
            as_is_revenue_usd: 1873949.75,
            distortion_usd: 17251.63,
          },
          {
            tier: 'bronce',
            as_was_revenue_usd: 1528183.35,
            as_is_revenue_usd: 900084.3,
            distortion_usd: -628099.05,
          },
          {
            tier: 'platino',
            as_was_revenue_usd: 387171.69,
            as_is_revenue_usd: 585418.1,
            distortion_usd: 198246.41,
          },
        ],
      },
    ],
  },
  checks: [
    {
      type: 'mcq',
      id: 'chk-l5-q1',
      prompt:
        '¿Por qué las ventanas de vigencia en una dimensión SCD Tipo 2 deben evaluarse como intervalos semiabiertos `order_ts >= valid_from AND (order_ts < valid_to OR valid_to IS NULL)` en lugar de usar `BETWEEN valid_from AND valid_to`?',
      options: [
        {
          id: 'a',
          text: 'Porque el operador BETWEEN no admite columnas de tipo TIMESTAMP en motores SQL.',
          correct: false,
          feedback:
            'Incorrecto. `BETWEEN` sí acepta `TIMESTAMP`, pero es inclusivo en ambos extremos (`>=` y `<=`) e ignora los valores `NULL`.',
        },
        {
          id: 'b',
          text: 'Porque BETWEEN es inclusivo en ambos extremos (duplicando eventos en la frontera exacta de cambio) y evalúa como desconocido cuando valid_to es NULL.',
          correct: true,
          feedback:
            'Correcto. El intervalo semiabierto `[valid_from, valid_to)` evita colisiones en el instante de transición y la cláusula `OR valid_to IS NULL` conserva las filas vigentes.',
        },
        {
          id: 'c',
          text: 'Porque BETWEEN convierte las claves sustitutas en claves naturales durante la unión.',
          correct: false,
          feedback:
            'Incorrecto. El predicado temporal no altera el tipo de clave sino qué versión histórica se empareja con cada transacción.',
        },
      ],
      explanation:
        '`BETWEEN a AND b` equivale a `>= a AND <= b`. Si una versión cierra en `t1` y la siguiente abre en `t1`, un pedido en `t1` coincidiría con ambas filas; además, si `valid_to` es `NULL`, `<= NULL` devuelve `UNKNOWN` y descarta la versión activa.',
    },
    {
      type: 'mcq',
      id: 'chk-l5-q2',
      prompt:
        'Si el director comercial pregunta: "¿Cuánto facturaron durante su etapa inicial en el nivel `bronce` los clientes que hoy pertenecen al nivel `platino`?", ¿qué arquitectura dimensional necesitas?',
      options: [
        {
          id: 'a',
          text: 'Únicamente una dimensión SCD Tipo 1 con `current_tier`.',
          correct: false,
          feedback:
            'Incorrecto. El Tipo 1 sobrescribe el pasado, por lo que es imposible saber qué compras ocurrieron cuando el cliente era `bronce`.',
        },
        {
          id: 'b',
          text: 'Combinar el atributo histórico As-Was de SCD Tipo 2 (`customer_changes.tier` mediante cruce Point-in-Time) con el atributo actual As-Is (`customers.current_tier`).',
          correct: true,
          feedback:
            'Correcto. El cruce Point-in-Time identifica las órdenes realizadas en `bronce` y la dimensión actual filtra a quienes hoy son `platino`.',
        },
        {
          id: 'c',
          text: 'Eliminar las marcas de tiempo de `orders` y agrupar solo por `change_id`.',
          correct: false,
          feedback:
            'Incorrecto. Sin el `order_ts` de la orden es imposible hacer el emparejamiento Point-in-Time contra `valid_from` y `valid_to`.',
        },
      ],
      explanation:
        'Combinar SCD Tipo 2 (nivel histórico en el momento de la compra) con SCD Tipo 1 (nivel vigente actual) —patrón conocido como SCD Tipo 6 o híbrido— permite estudiar la evolución de cohortes a través del tiempo.',
    },
    {
      type: 'predict-output',
      id: 'chk-l5-q3',
      prompt:
        'El cliente `customer_id = 1` tiene 3 versiones en `customer_changes`: `[2023-05-12, 2023-07-14)` en `bronce`, `[2023-07-14, 2023-12-02)` en `plata` y `[2023-12-02, NULL)` en `platino`. Si realizó una compra el `2023-07-14 00:00:00`, ¿qué nivel le asigna el predicado `order_ts >= valid_from AND (order_ts < valid_to OR valid_to IS NULL)`?',
      options: [
        {
          id: 'a',
          text: 'El nivel `plata` (segunda versión), porque el límite inferior `>= valid_from` es inclusivo y el límite superior `< valid_to` de la primera versión es exclusivo.',
          correct: true,
          feedback:
            'Correcto. En `2023-07-14 00:00:00`, la primera versión ya cerró (`< 2023-07-14` es falso) y la segunda acaba de abrir (`>= 2023-07-14` es verdadero).',
        },
        {
          id: 'b',
          text: 'Ambos niveles (`bronce` y `plata`), duplicando la orden.',
          correct: false,
          feedback:
            'Incorrecto. Eso ocurriría con `BETWEEN`, pero la desigualdad estricta `< valid_to` excluye la primera versión en el instante exacto del corte.',
        },
        {
          id: 'c',
          text: 'El nivel `platino` porque tiene `is_current = true`.',
          correct: false,
          feedback:
            'Incorrecto. La versión `platino` recién inicia el `2023-12-02`, por lo que `2023-07-14 >= 2023-12-02` es falso.',
        },
      ],
      explanation:
        'En un intervalo semiabierto `[valid_from, valid_to)`, el instante exacto de transición pertenece únicamente a la nueva versión que se abre (`>= valid_from`) y queda excluido de la versión que se cierra (`< valid_to`).',
    },
  ],
  practice: {
    type: 'sql',
    title: 'Ingresos históricos As-Was mediante cruce Point-in-Time en SCD Tipo 2',
    prompt:
      'Calcula las órdenes completadas (`status = \'completed\'`) y los ingresos totales (`ROUND(SUM(o.total_usd), 2)`) agrupados por el nivel histórico (`tier_at_order`) que tenía el cliente en el instante exacto de cada compra. Realiza un `LEFT JOIN` entre `orders` (`o`) y `customer_changes` (`cc`) usando un cruce *Point-in-Time*: `o.customer_id = cc.customer_id AND o.order_ts >= cc.valid_from AND (o.order_ts < cc.valid_to OR cc.valid_to IS NULL)`. Usa `COALESCE(cc.tier, \'sin_historial\') AS tier_at_order`. Devuelve `tier_at_order`, `total_orders` y `revenue_usd` ordenados por `revenue_usd DESC`.',
    starterCode: `-- Corrige el JOIN para que sea Point-in-Time sobre customer_changes (SCD Tipo 2)
SELECT
  COALESCE(cc.tier, 'sin_historial') AS tier_at_order,
  COUNT(o.order_id) AS total_orders,
  ROUND(SUM(o.total_usd), 2) AS revenue_usd
FROM orders o
LEFT JOIN customer_changes cc
  ON o.customer_id = cc.customer_id
  -- Falta acotar por valid_from y valid_to (incluyendo el caso valid_to IS NULL)
WHERE o.status = 'completed'
GROUP BY 1
ORDER BY revenue_usd DESC;`,
    solution: `SELECT
  COALESCE(cc.tier, 'sin_historial') AS tier_at_order,
  COUNT(o.order_id) AS total_orders,
  ROUND(SUM(o.total_usd), 2) AS revenue_usd
FROM orders o
LEFT JOIN customer_changes cc
  ON o.customer_id = cc.customer_id
 AND o.order_ts >= cc.valid_from
 AND (o.order_ts < cc.valid_to OR cc.valid_to IS NULL)
WHERE o.status = 'completed'
GROUP BY 1
ORDER BY revenue_usd DESC;`,
    solutionExplanation:
      'La condición `o.order_ts >= cc.valid_from AND (o.order_ts < cc.valid_to OR cc.valid_to IS NULL)` empareja cada orden con la única versión histórica activa en el instante de la compra, preservando las 14,760 órdenes completadas y su atribución As-Was.',
    expectedOutputTable: [
      { tier_at_order: 'oro', total_orders: 5485, revenue_usd: 2497409.26 },
      { tier_at_order: 'plata', total_orders: 4567, revenue_usd: 1856698.12 },
      { tier_at_order: 'bronce', total_orders: 3746, revenue_usd: 1528183.35 },
      { tier_at_order: 'platino', total_orders: 962, revenue_usd: 387171.69 },
    ],
    hints: [
      'Si unes `orders` con `customer_changes` solo por `customer_id`, cada orden se multiplica por todas las versiones históricas del cliente (`25,271` filas en vez de `14,760`).',
      'Agrega `AND o.order_ts >= cc.valid_from` en la condición `ON` del `LEFT JOIN`.',
      'Completa el intervalo semiabierto con `AND (o.order_ts < cc.valid_to OR cc.valid_to IS NULL)` para incluir la versión vigente de cada cliente.',
    ],
    orderMatters: true,
  },
  pipelineChallenge: {
    title: 'Auditoría As-Was vs. As-Is con SCD Tipo 2 (Point-in-Time Join)',
    ValidatorKey: 'l5_scd2_pit',
    datasets: ['orders', 'customers', 'customer_changes'],
    steps: [
      {
        id: 'step-1',
        text: 'Inspeccionar las versiones históricas de customer_changes y sus intervalos de validez [valid_from, valid_to).',
        title: '1. Inspeccionar las versiones históricas en customer_changes',
        goal: 'Observa cómo un mismo customer_id tiene múltiples filas con intervalos [valid_from, valid_to).',
        hint: 'En `customer_changes` hay 4,100 filas para 2,400 clientes. La versión vigente tiene `valid_to IS NULL` e `is_current = true`.',
      },
      {
        id: 'step-2',
        text: 'Acotar el JOIN Point-in-Time con o.order_ts >= cc.valid_from AND (o.order_ts < cc.valid_to OR cc.valid_to IS NULL).',
        title: '2. Evitar el fan-out temporal en el JOIN',
        goal: 'Acota la unión por el intervalo semiabierto [valid_from, valid_to).',
        hint: 'Usa `o.order_ts >= cc.valid_from AND (o.order_ts < cc.valid_to OR cc.valid_to IS NULL)`. Así cada una de las 14,760 órdenes completadas cruza con una única versión.',
      },
      {
        id: 'step-3',
        text: 'Cruzar con customers para contrastar el atributo histórico tier_at_order (As-Was) frente a current_tier (As-Is).',
        title: '3. Contrastar tier_at_order (As-Was) frente a current_tier (As-Is)',
        goal: 'Agrupa por el tier histórico y el tier actual para cuantificar las transiciones de fidelidad.',
        hint: 'Une también con `customers c ON o.customer_id = c.customer_id` para obtener `c.current_tier` y agrupa por `cc.tier, c.current_tier`.',
      },
    ],
    prompt:
      'Construye la consulta Point-in-Time que une `orders` (`o`), `customer_changes` (`cc`) y `customers` (`c`). Filtra únicamente órdenes con `o.status = \'completed\'`. Empareja cada orden con la versión de `customer_changes` vigente en `o.order_ts` (`o.order_ts >= cc.valid_from AND (o.order_ts < cc.valid_to OR cc.valid_to IS NULL)`). Agrupa por `cc.tier AS tier_at_order` y `c.current_tier` devolviendo `orders_count` (`COUNT(o.order_id)`) e `historical_revenue_usd` (`ROUND(SUM(o.total_usd), 2)`). Ordena por `historical_revenue_usd DESC`.',
    starterCode: `-- Une orders con customer_changes (Point-in-Time) y customers (As-Is)
SELECT
  cc.tier AS tier_at_order,
  c.current_tier,
  COUNT(o.order_id) AS orders_count,
  ROUND(SUM(o.total_usd), 2) AS historical_revenue_usd
FROM orders o
JOIN customer_changes cc
  ON o.customer_id = cc.customer_id
  -- Agrega aquí la condición temporal semiabierta [valid_from, valid_to)
JOIN customers c
  ON o.customer_id = c.customer_id
WHERE o.status = 'completed'
GROUP BY cc.tier, c.current_tier
ORDER BY historical_revenue_usd DESC;`,
    solution: `SELECT
  cc.tier AS tier_at_order,
  c.current_tier,
  COUNT(o.order_id) AS orders_count,
  ROUND(SUM(o.total_usd), 2) AS historical_revenue_usd
FROM orders o
JOIN customer_changes cc
  ON o.customer_id = cc.customer_id
 AND o.order_ts >= cc.valid_from
 AND (o.order_ts < cc.valid_to OR cc.valid_to IS NULL)
JOIN customers c
  ON o.customer_id = c.customer_id
WHERE o.status = 'completed'
GROUP BY cc.tier, c.current_tier
ORDER BY historical_revenue_usd DESC;`,
    expectedOutputTable: {
      columns: ['tier_at_order', 'current_tier', 'orders_count', 'historical_revenue_usd'],
      rows: [
        ['oro', 'oro', 5304, 2423438.94],
        ['plata', 'plata', 3992, 1621712.91],
        ['bronce', 'bronce', 2247, 900084.3],
        ['bronce', 'oro', 661, 276640.52],
        ['bronce', 'plata', 638, 252236.84],
        ['platino', 'platino', 635, 250068.93],
        ['plata', 'oro', 503, 209930.81],
        ['oro', 'platino', 181, 73970.32],
        ['bronce', 'platino', 200, 99221.69],
        ['platino', 'platino', 327, 137102.76],
        ['plata', 'platino', 72, 25048.37],
      ].sort((a, b) => b[3] - a[3]),
    },
    orderMatters: true,
    hints: [
      'Recuerda la desigualdad semiabierta: `AND o.order_ts >= cc.valid_from AND (o.order_ts < cc.valid_to OR cc.valid_to IS NULL)`.',
      'No uses `cc.is_current = true` porque eso ignoraría la historia y replicaría el comportamiento As-Is.',
      'Agrupa por `cc.tier, c.current_tier` y ordena por `historical_revenue_usd DESC`.',
    ],
  },
  roleNotes: {
    de: 'Como Ingeniero de Datos, implementarás tablas SCD Tipo 2 mediante `dbt snapshots` o modelos incrementales con claves sustitutas por versión (`change_id`) y tests que verifiquen que ningún intervalo `[valid_from, valid_to)` se solape para un mismo `customer_id`.',
    da: 'Como Analista de Datos, usarás siempre el predicado Point-in-Time al unir eventos transaccionales con dimensiones históricas y verificarás que `COUNT(*)` de la tabla de hechos no cambie tras el `JOIN`.',
    bi: 'Como especialista en BI, expondrás en el modelo semántico tanto `tier_at_order` (As-Was) para reportes financieros auditables como `current_tier` (As-Is) para el seguimiento comercial de carteras activas sin ambigüedad.',
  },
  summary: [
    'SCD Tipo 1 sobrescribe atributos produciendo reportes As-Is que reasignan retroactivamente las transacciones pasadas al estado actual.',
    'SCD Tipo 2 preserva el historial completo insertando una nueva fila con clave sustituta propia y marcas `valid_from` y `valid_to`.',
    'Unir una tabla de hechos con una dimensión SCD Tipo 2 solo por clave natural multiplica las filas por el número de versiones del cliente.',
    'El cruce Point-in-Time emplea el intervalo semiabierto `order_ts >= valid_from AND (order_ts < valid_to OR valid_to IS NULL)` para garantizar correspondencia 1:1.',
    'Combinar atributos As-Was y As-Is (SCD Tipo 6) permite medir la progresión de cohortes sin distorsionar el cierre contable.',
  ],
  glossaryTerms: [
    'c07-scd-type-2',
    'c08-point-in-time',
    'scd-tipo-1-y-3',
    'grano-dimensional',
  ],
  flashcards: [
    {
      id: 'fc-c2-dim-03-01',
      front: '¿Qué diferencia a un reporte As-Is (SCD Tipo 1) de un reporte As-Was (SCD Tipo 2)?',
      back: 'As-Is agrupa todos los hechos históricos según el valor actual del atributo; As-Was agrupa cada hecho según el valor exacto que tenía la dimensión en el instante en que ocurrió el evento.',
    },
    {
      id: 'fc-c2-dim-03-02',
      front: '¿Por qué un cruce Point-in-Time usa `>= valid_from` y `< valid_to` en lugar de `BETWEEN`?',
      back: 'Porque el intervalo semiabierto `[valid_from, valid_to)` impide que un evento ocurrido en el segundo exacto del cambio coincida con dos versiones a la vez.',
    },
    {
      id: 'fc-c2-dim-03-03',
      front: '¿Qué ocurre si olvidas la condición `OR cc.valid_to IS NULL` al unir `orders` con `customer_changes`?',
      back: 'Se descartan o quedan sin atributo todas las órdenes ocurridas durante la versión vigente actual de cada cliente.',
    },
    {
      id: 'fc-c2-dim-03-04',
      front: 'En Mercado Brisa, ¿cuál es el impacto de usar `customers.current_tier` en lugar de `customer_changes` sobre las órdenes completadas?',
      back: 'El nivel `bronce` pierde `$628,099.05` de ingresos históricos porque las compras iniciales de clientes que luego ascendieron se reasignan a `oro`, `plata` y `platino`.',
    },
  ],
  sources: [
    {
      title: 'Type 2: Add a New Row',
      url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/type-2/',
      publisher: 'Kimball Group',
      accessed: '2026-10-29',
      supports:
        'Especificación de Kimball para dimensiones lentamente cambiantes de Tipo 2 con claves sustitutas y fechas de efectividad.',
    },
    {
      title: 'Type 1: Overwrite & Type 3: Add a New Attribute',
      url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/type-1/',
      publisher: 'Kimball Group',
      accessed: '2026-10-29',
      supports:
        'Contraste entre sobrescritura sin historia (Tipo 1) y preservación de versión histórica.',
    },
    {
      title: 'Add snapshots to your DAG (SCD Type 2)',
      url: 'https://docs.getdbt.com/docs/build/snapshots',
      publisher: 'dbt Labs',
      accessed: '2026-10-29',
      supports:
        'Implementación declarativa de tablas SCD Tipo 2 con columnas `dbt_valid_from` y `dbt_valid_to` en pipelines modernos.',
    },
    {
      title: 'SQLMesh Model Kinds — SCD Type 2',
      url: 'https://sqlmesh.readthedocs.io/en/stable/concepts/models/model_kinds/',
      publisher: 'Tobiko Data',
      accessed: '2026-10-29',
      supports:
        'Gestión incremental de intervalos de validez histórica en transformaciones SQL.',
    },
  ],
  aiNotes:
    'Enfatiza la diferencia numérica real en Mercado Brisa: `orders` tiene 14,760 órdenes completadas. Si el usuario hace `JOIN customer_changes ON o.customer_id = cc.customer_id` sin acotar fechas, obtendrá 25,271 filas. Con el predicado Point-in-Time `o.order_ts >= cc.valid_from AND (o.order_ts < cc.valid_to OR cc.valid_to IS NULL)`, recupera exactamente las 14,760 órdenes y el ingreso histórico real en `bronce` (`$1,528,183.35` en lugar de `$900,084.30`).',
  needsReview: false,
};

export default lesson;
