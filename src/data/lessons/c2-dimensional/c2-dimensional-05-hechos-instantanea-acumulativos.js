export const lesson = {
  id: 'c2-dimensional-05-hechos-instantanea-acumulativos',
  moduleId: 'c2-dimensional',
  tracks: ['core', 'de', 'da', 'bi'],
  level: 2,
  order: 5,
  title: 'Tablas de hechos: transaccional, instantánea y acumulativa',
  subtitle:
    'Tablas de hechos transaccionales, de instantánea periódica y acumulativas para eventos, saldos y ciclos de vida',
  minutes: 25,
  prerequisites: ['c2-dimensional-04-metrics-simpson'],
  contentVersion: 2,
  hook: 'El equipo de operaciones de Mercado Brisa intentó medir con una sola consulta el saldo acumulado de facturación al cierre del primer trimestre y el tiempo medio que tarda un pedido desde su creación (`order_ts`) hasta la captura del pago (`payments`) y un reembolso (`refunds`). Al sumar los saldos mensuales de enero, febrero y marzo en `Cono Sur`, reportaron `$409,891.86` en lugar de `$204,333.09`, y al unir `orders` con `payments` y `refunds` inflaron las órdenes de `6,001` a `6,510`. ¿Qué patrón de tabla de hechos resuelve cada necesidad?',
  objectives: [
    'Distinguir el grano, la densidad de filas y el patrón de actualización de las tablas de hechos transaccionales, de instantánea periódica y de instantánea acumulativa.',
    'Evaluar medidas semiaditivas en tablas de instantánea periódica utilizando agregaciones de cierre (`ARG_MAX`) o promedio (`AVG`) en lugar de `SUM()` a través del tiempo.',
    'Construir en SQL una tabla de hechos de instantánea acumulativa (`fct_order_lifecycle`) que consolide múltiples hitos temporales y latencias operativas sin duplicar órdenes.',
  ],
  sections: [
    {
      id: 'sec-hechos-transaccionales',
      heading: 'Tablas de hechos transaccionales: grano de evento atómico',
      body: 'La **tabla de hechos transaccional** es el patrón más detallado del modelado dimensional. Cada fila representa un evento puntual que ocurre en un instante específico del tiempo. Puede tratarse de un artículo facturado (`order_items`), una orden registrada (`orders`) o un clic de usuario (`events`). Una vez insertado el evento, la fila rara vez se modifica.\n\nSu poblamiento es **disperso** (*sparse*). Solo se insertan filas para los productos o clientes que tuvieron actividad durante ese día. Si una tienda no vende un molino en toda la semana, no aparece ninguna fila para esa combinación.\n\nCada registro mide un flujo atómico ocurrido en un instante único. Por eso sus medidas numéricas (`qty`, `line_total_usd`, `discount_usd`) son naturalmente **aditivas**. Pueden sumarse con `SUM()` a través del calendario, las tiendas, los clientes y los productos sin restricción.',
      example: {
        language: 'sql',
        code: `SELECT
  c.year,
  c.quarter,
  COUNT(DISTINCT o.order_id) AS order_events,
  COUNT(oi.order_item_id) AS line_events,
  SUM(oi.qty) AS total_units_sold,
  ROUND(SUM(oi.line_total_usd), 2) AS total_line_sales_usd
FROM order_items oi
INNER JOIN orders o ON oi.order_id = o.order_id
INNER JOIN calendar c ON o.order_date = c.calendar_date
WHERE o.status = 'completed'
  AND c.year = 2024
GROUP BY c.year, c.quarter
ORDER BY c.year ASC, c.quarter ASC;`,
        expectedOutput: [
          {
            year: 2024,
            quarter: 1,
            order_events: 1400,
            line_events: 3191,
            total_units_sold: 6586,
            total_line_sales_usd: 510818.56,
          },
          {
            year: 2024,
            quarter: 2,
            order_events: 1613,
            line_events: 3764,
            total_units_sold: 7750,
            total_line_sales_usd: 589322.8,
          },
          {
            year: 2024,
            quarter: 3,
            order_events: 1755,
            line_events: 4020,
            total_units_sold: 8374,
            total_line_sales_usd: 635388.25,
          },
          {
            year: 2024,
            quarter: 4,
            order_events: 1729,
            line_events: 4013,
            total_units_sold: 8377,
            total_line_sales_usd: 645954.03,
          },
        ],
      },
    },
    {
      id: 'sec-hechos-instantanea-periodica',
      heading: 'Tablas de hechos de instantánea periódica: saldos y niveles regulares',
      body: 'A veces el negocio necesita monitorear el saldo acumulado de una cartera o el inventario en almacén al cierre de cada mes. Reconstruir ese estado sumando millones de transacciones históricas en cada consulta resulta costoso. La **tabla de hechos de instantánea periódica** (*Periodic Snapshot*) toma una fotografía a intervalos fijos (diario, mensual o trimestral).\n\nA diferencia de la tabla transaccional, su poblamiento es **denso**. Genera exactamente una fila por cada entidad y cada periodo calendario, aunque no haya habido actividad en ese mes. Las filas tampoco se modifican una vez cerrado el periodo contable.\n\nSus medidas de estado o saldo acumulado son **semiaditivas**. En el primer trimestre de `2024`, el saldo acumulado de ventas de `Cono Sur` es `$61,150.11` en enero, `$144,408.66` en febrero y `$204,333.09` en marzo. Si aplicamos `SUM(ytd_balance_usd)` en el trimestre, sumamos tres veces enero y dos veces febrero (`$409,891.86`). En DuckDB debemos extraer el último corte con `ARG_MAX(ytd_balance_usd, month)` (`$204,333.09`) o promediar el nivel con `AVG()`.',
      example: {
        language: 'sql',
        code: `WITH monthly_store_flow AS (
  SELECT
    s.region,
    c.month,
    ROUND(SUM(o.total_usd), 2) AS monthly_flow_usd
  FROM orders o
  INNER JOIN stores s ON o.store_id = s.store_id
  INNER JOIN calendar c ON o.order_date = c.calendar_date
  WHERE o.status = 'completed'
    AND c.year = 2024
    AND c.quarter = 1
  GROUP BY s.region, c.month
),
periodic_ytd_snapshot AS (
  SELECT
    region,
    month,
    monthly_flow_usd,
    ROUND(SUM(monthly_flow_usd) OVER (
      PARTITION BY region
      ORDER BY month ASC
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ), 2) AS ytd_balance_usd
  FROM monthly_store_flow
)
SELECT
  region,
  ROUND(SUM(ytd_balance_usd), 2) AS wrong_sum_of_snapshots_usd,
  ROUND(AVG(ytd_balance_usd), 2) AS avg_monthly_ytd_balance_usd,
  ARG_MAX(ytd_balance_usd, month) AS true_q1_closing_balance_usd
FROM periodic_ytd_snapshot
GROUP BY region
ORDER BY true_q1_closing_balance_usd DESC;`,
        expectedOutput: [
          {
            region: 'Cono Sur',
            wrong_sum_of_snapshots_usd: 409891.86,
            avg_monthly_ytd_balance_usd: 136630.62,
            true_q1_closing_balance_usd: 204333.09,
          },
          {
            region: 'Andina',
            wrong_sum_of_snapshots_usd: 316938.87,
            avg_monthly_ytd_balance_usd: 105646.29,
            true_q1_closing_balance_usd: 163002.14,
          },
          {
            region: 'Iberia',
            wrong_sum_of_snapshots_usd: 274958.29,
            avg_monthly_ytd_balance_usd: 91652.76,
            true_q1_closing_balance_usd: 143400.37,
          },
          {
            region: 'Norteamérica',
            wrong_sum_of_snapshots_usd: 149798.32,
            avg_monthly_ytd_balance_usd: 49932.77,
            true_q1_closing_balance_usd: 74834.56,
          },
        ],
      },
    },
    {
      id: 'sec-hechos-instantanea-acumulativa',
      heading: 'Tablas de hechos de instantánea acumulativa: flujos de trabajo e hitos',
      body: 'Para medir la velocidad de una tubería operativa con inicio y fin definidos —como el ciclo de vida de un pedido—, las tablas transaccionales exigen autouniones complejas. La **tabla de hechos de instantánea acumulativa** (*Accumulating Snapshot*) dedica exactamente **una fila por instancia de proceso** (una fila por `order_id`).\n\nSu rasgo distintivo es incluir **múltiples marcas temporales de hito** en la misma fila (`order_ts`, `first_attempt_ts`, `captured_ts`, `first_refund_ts`). Cuando el pedido nace, solo `order_ts` tiene valor y los hitos futuros quedan en `NULL`. Conforme el pedido avanza, la fila existente se actualiza rellenando las fechas y calculando duraciones (`minutes_to_capture`, `days_capture_to_refund`).\n\nPara construirla en Mercado Brisa sin multiplicar órdenes, primero comprimimos los eventos `1:N` de `payments` (`19,200` filas) y `refunds` (`1,450` filas) al grano `order_id`. Usamos agregaciones condicionales como `MIN(payment_ts) FILTER (WHERE status = \'captured\')` antes de unirlas con `orders`.',
      example: {
        language: 'sql',
        code: `WITH payment_milestones AS (
  SELECT
    order_id,
    COUNT(*) AS payment_attempts,
    MIN(payment_ts) AS first_attempt_ts,
    MIN(payment_ts) FILTER (WHERE status = 'captured') AS captured_ts
  FROM payments
  GROUP BY order_id
),
refund_milestones AS (
  SELECT
    order_id,
    COUNT(*) AS refund_count,
    MIN(refund_ts) AS first_refund_ts,
    ROUND(SUM(refund_amount_usd), 2) AS total_refunded_usd
  FROM refunds
  GROUP BY order_id
)
SELECT
  o.order_id,
  o.status AS order_status,
  pm.payment_attempts,
  ROUND(DATE_DIFF('second', o.order_ts, pm.captured_ts) / 60.0, 2) AS minutes_to_capture,
  ROUND(DATE_DIFF('hour', pm.captured_ts, rm.first_refund_ts) / 24.0, 2) AS days_capture_to_refund
FROM orders o
LEFT JOIN payment_milestones pm ON o.order_id = pm.order_id
LEFT JOIN refund_milestones rm ON o.order_id = rm.order_id
WHERE rm.first_refund_ts IS NOT NULL
ORDER BY o.order_id ASC
LIMIT 5;`,
        expectedOutput: [
          {
            order_id: 10001,
            order_status: 'completed',
            payment_attempts: 2,
            minutes_to_capture: 1.83,
            days_capture_to_refund: 8,
          },
          {
            order_id: 10016,
            order_status: 'completed',
            payment_attempts: 2,
            minutes_to_capture: 1.83,
            days_capture_to_refund: 8,
          },
          {
            order_id: 10031,
            order_status: 'completed',
            payment_attempts: 2,
            minutes_to_capture: 1.83,
            days_capture_to_refund: 2,
          },
          {
            order_id: 10046,
            order_status: 'cancelled',
            payment_attempts: 2,
            minutes_to_capture: null,
            days_capture_to_refund: null,
          },
          {
            order_id: 10061,
            order_status: 'completed',
            payment_attempts: 2,
            minutes_to_capture: 1.83,
            days_capture_to_refund: 5,
          },
        ],
      },
    },
  ],
  workedExample: {
    title: 'Construcción de una instantánea acumulativa de pedidos por tipo de dispositivo',
    description:
      'Operaciones desea evaluar cuántos pedidos de cada `device_type` (`desktop`, `mobile`, `pos_tienda`) logran capturar su pago, cuántos terminan con al menos un reembolso y cuáles son los tiempos medios de captura (en minutos) y de devolución (en días). Construiremos la tabla de instantánea acumulativa en tres pasos.',
    steps: [
      {
        label: 'Paso 1: Comprimir hitos de pagos por orden',
        explanation:
          'Comprimimos `payments` al grano `order_id` extrayendo el primer intento (`first_attempt_ts`) y el primer instante de captura exitosa (`captured_ts`).',
        code: `SELECT
  order_id,
  COUNT(*) AS payment_attempts,
  MIN(payment_ts) AS first_attempt_ts,
  MIN(payment_ts) FILTER (WHERE status = 'captured') AS captured_ts,
  ROUND(SUM(amount_usd) FILTER (WHERE status = 'captured'), 2) AS captured_amount_usd
FROM payments
GROUP BY order_id
ORDER BY order_id ASC
LIMIT 5;`,
        expectedOutput: [
          {
            order_id: 10001,
            payment_attempts: 2,
            first_attempt_ts: '2024-12-01 18:19:04',
            captured_ts: '2024-12-01 18:20:39',
            captured_amount_usd: 39.14,
          },
          {
            order_id: 10002,
            payment_attempts: 2,
            first_attempt_ts: '2023-12-20 01:46:15',
            captured_ts: '2023-12-20 01:47:50',
            captured_amount_usd: 53.07,
          },
          {
            order_id: 10003,
            payment_attempts: 2,
            first_attempt_ts: '2025-11-08 16:52:31',
            captured_ts: '2025-11-08 16:54:06',
            captured_amount_usd: 479.16,
          },
          {
            order_id: 10004,
            payment_attempts: 2,
            first_attempt_ts: '2025-03-03 22:47:42',
            captured_ts: '2025-03-03 22:49:17',
            captured_amount_usd: 535.55,
          },
          {
            order_id: 10005,
            payment_attempts: 2,
            first_attempt_ts: '2024-03-26 21:01:25',
            captured_ts: '2024-03-26 21:03:00',
            captured_amount_usd: 204.67,
          },
        ],
      },
      {
        label: 'Paso 2: Comprimir hitos de reembolsos por orden',
        explanation:
          'Comprimimos `refunds` al grano `order_id` identificando la fecha del primer y último reembolso para órdenes con devoluciones múltiples.',
        code: `SELECT
  order_id,
  COUNT(*) AS refund_events,
  MIN(refund_ts) AS first_refund_ts,
  MAX(refund_ts) AS last_refund_ts,
  ROUND(SUM(refund_amount_usd), 2) AS refunded_amount_usd
FROM refunds
GROUP BY order_id
ORDER BY refund_events DESC, order_id ASC
LIMIT 5;`,
        expectedOutput: [
          {
            order_id: 10001,
            refund_events: 2,
            first_refund_ts: '2024-12-09 18:18:49',
            last_refund_ts: '2024-12-11 18:18:49',
            refunded_amount_usd: 23.49,
          },
          {
            order_id: 10016,
            refund_events: 2,
            first_refund_ts: '2024-08-31 14:01:07',
            last_refund_ts: '2024-09-01 14:01:07',
            refunded_amount_usd: 127.15,
          },
          {
            order_id: 10031,
            refund_events: 2,
            first_refund_ts: '2024-07-06 04:47:53',
            last_refund_ts: '2024-07-11 04:47:53',
            refunded_amount_usd: 314.83,
          },
          {
            order_id: 10046,
            refund_events: 2,
            first_refund_ts: '2024-06-16 17:58:14',
            last_refund_ts: '2024-06-17 17:58:14',
            refunded_amount_usd: 578.5,
          },
          {
            order_id: 10061,
            refund_events: 2,
            first_refund_ts: '2024-07-09 00:50:20',
            last_refund_ts: '2024-07-10 00:50:20',
            refunded_amount_usd: 62.81,
          },
        ],
      },
      {
        label: 'Paso 3: Ensamblar la instantánea acumulativa y agregar por dispositivo',
        explanation:
          'Ensamblamos `fct_order_accumulating` (`18,000` filas exactas) y resumimos las órdenes capturadas, reembolsadas y sus latencias promedio por `device_type`.',
        code: `WITH payment_milestones AS (
  SELECT
    order_id,
    COUNT(*) AS payment_attempts,
    MIN(payment_ts) FILTER (WHERE status = 'captured') AS captured_ts
  FROM payments
  GROUP BY order_id
),
refund_milestones AS (
  SELECT
    order_id,
    MIN(refund_ts) AS first_refund_ts,
    SUM(refund_amount_usd) AS refunded_usd
  FROM refunds
  GROUP BY order_id
),
fct_order_accumulating AS (
  SELECT
    o.order_id,
    o.device_type,
    o.order_ts,
    pm.captured_ts,
    rm.first_refund_ts,
    COALESCE(pm.payment_attempts, 0) AS payment_attempts,
    DATE_DIFF('second', o.order_ts, pm.captured_ts) / 60.0 AS minutes_to_capture,
    DATE_DIFF('hour', pm.captured_ts, rm.first_refund_ts) / 24.0 AS days_to_refund
  FROM orders o
  LEFT JOIN payment_milestones pm ON o.order_id = pm.order_id
  LEFT JOIN refund_milestones rm ON o.order_id = rm.order_id
)
SELECT
  device_type,
  COUNT(order_id) AS total_orders,
  COUNT(captured_ts) AS captured_orders,
  COUNT(first_refund_ts) AS refunded_orders,
  ROUND(AVG(minutes_to_capture), 2) AS avg_minutes_to_capture,
  ROUND(AVG(days_to_refund), 2) AS avg_days_to_refund
FROM fct_order_accumulating
GROUP BY device_type
ORDER BY total_orders DESC;`,
        expectedOutput: [
          {
            device_type: 'desktop',
            total_orders: 7716,
            captured_orders: 6944,
            refunded_orders: 616,
            avg_minutes_to_capture: 0.32,
            avg_days_to_refund: 6.94,
          },
          {
            device_type: 'mobile',
            total_orders: 6857,
            captured_orders: 6171,
            refunded_orders: 329,
            avg_minutes_to_capture: 0.32,
            avg_days_to_refund: 7.2,
          },
          {
            device_type: 'pos_tienda',
            total_orders: 3427,
            captured_orders: 3085,
            refunded_orders: 205,
            avg_minutes_to_capture: 0.32,
            avg_days_to_refund: 7.01,
          },
        ],
      },
    ],
  },
  checks: [
    {
      type: 'mcq',
      id: 'chk-c2-dim-05-types',
      prompt:
        '¿Cuál de las siguientes afirmaciones describe correctamente el comportamiento físico de una tabla de hechos de instantánea acumulativa (Accumulating Snapshot)?',
      options: [
        {
          id: 'a',
          text: 'Inserta una nueva fila cada día fijo del calendario aunque la orden no haya tenido actividad.',
          correct: false,
          feedback:
            'Incorrecto. Insertar una fila por cada periodo regular corresponde a una tabla de instantánea periódica (Periodic Snapshot).',
        },
        {
          id: 'b',
          text: 'Contiene una sola fila por ciclo de vida de una entidad (como un pedido), con múltiples columnas de fecha de hito que se actualizan conforme avanza el proceso.',
          correct: true,
          feedback:
            'Correcto. La fila nace con los hitos futuros en NULL y se modifica a medida que la instancia supera cada etapa del embudo operativo.',
        },
        {
          id: 'c',
          text: 'Prohíbe el uso de valores NULL en las marcas de tiempo de hitos aún no alcanzados.',
          correct: false,
          feedback:
            'Incorrecto. Mientras la orden está en tránsito, las marcas de tiempo de hitos pendientes son NULL (o apuntan a una clave sustituta "Por ocurrir" en la dimensión calendario).',
        },
      ],
      explanation:
        'A diferencia de las tablas transaccionales y de instantánea periódica (que son de solo inserción), la instantánea acumulativa actualiza la misma fila conforme se completan los hitos del proceso.',
    },
    {
      type: 'mcq',
      id: 'chk-c2-dim-05-periodic',
      prompt:
        'Tienes una tabla `fct_inventory_monthly_snapshot` con el grano `product_id x month` y la medida `ending_stock_units`. ¿Cómo debes calcular el inventario total de la empresa al cierre del trimestre Q1 (meses 1, 2 y 3)?',
      options: [
        {
          id: 'a',
          text: 'Ejecutar `SUM(ending_stock_units) WHERE month IN (1, 2, 3)`.',
          correct: false,
          feedback:
            'Incorrecto. El stock es una medida semiaditiva: sumar enero, febrero y marzo triplica las unidades almacenadas.',
        },
        {
          id: 'b',
          text: 'Sumar `ending_stock_units` entre todos los productos filtrando el último corte del trimestre (`month = 3`) o usando `ARG_MAX(ending_stock_units, month)` por producto y luego sumar.',
          correct: true,
          feedback:
            'Correcto. Las medidas semiaditivas se evalúan en un corte temporal o mediante `ARG_MAX` / `AVG` en el tiempo, y sí se suman entre productos o almacenes.',
        },
        {
          id: 'c',
          text: 'Aplicar `COUNT(DISTINCT ending_stock_units)` agrupado por trimestre.',
          correct: false,
          feedback:
            'Incorrecto. Contar valores distintos de stock no tiene sentido físico para medir inventario.',
        },
      ],
      explanation:
        'Los saldos de inventario y cuentas son semiaditivos: son aditivos a través de dimensiones estructurales (`product_id`, `store_id`), pero no aditivos a través de la dimensión `calendar`.',
    },
    {
      type: 'predict-output',
      id: 'chk-c2-dim-05-milestone',
      prompt:
        'En Mercado Brisa existen `18,000` órdenes en `orders`, `19,200` filas en `payments` (`16,200` órdenes únicas con pago `captured`) y `1,450` filas en `refunds` (`1,440` órdenes únicas). Si construyes correctamente la instantánea acumulativa `fct_order_lifecycle` a grano `order_id`, ¿cuántas filas tendrá la tabla y cuánto valdrá `COUNT(captured_ts)`?',
      options: [
        {
          id: 'a',
          text: '19,200 filas y 16,605 órdenes capturadas.',
          correct: false,
          feedback:
            'Incorrecto. Ese sería el resultado de no preagregar `payments` por `order_id`, heredando los reintentos y los 405 webhooks duplicados.',
        },
        {
          id: 'b',
          text: '18,000 filas (una por cada `order_id`) y `COUNT(captured_ts) = 16,200`.',
          correct: true,
          feedback:
            'Correcto. Al preagregar los hitos por `order_id` y unir con `LEFT JOIN` desde `orders`, la tabla mantiene exactamente 18,000 filas y `COUNT(captured_ts)` ignora los 1,800 valores `NULL`.',
        },
        {
          id: 'c',
          text: '1,440 filas porque solo se conservan las órdenes que completaron todos los hitos incluido el reembolso.',
          correct: false,
          feedback:
            'Incorrecto. La instantánea acumulativa incluye todas las órdenes iniciadas (`LEFT JOIN`); el reembolso es un hito opcional que queda en `NULL` para las demás órdenes.',
        },
      ],
      explanation:
        'En SQL, `COUNT(columna)` cuenta únicamente los valores no nulos. Sobre las `18,000` filas de `fct_order_lifecycle`, `COUNT(order_id)` devuelve `18,000` y `COUNT(captured_ts)` devuelve exactamente las `16,200` órdenes que alcanzaron el hito de captura.',
    },
  ],
  practice: {
    type: 'sql',
    title: 'Instantánea acumulativa del ciclo de vida de órdenes por región',
    prompt:
      'Construye una tabla de hechos de instantánea acumulativa (`fct_order_lifecycle`) en una CTE a grano `order_id` y resúmela por la región de la tienda (`stores.region`). Primero, preagrega `payments` por `order_id` obteniendo `MIN(payment_ts) FILTER (WHERE status = \'captured\') AS captured_ts`. Segundo, preagrega `refunds` por `order_id` obteniendo `MIN(refund_ts) AS first_refund_ts`. Tercero, une `orders` (`o`) con `stores` (`s`) y haz `LEFT JOIN` hacia ambos resúmenes de hitos calculando `DATE_DIFF(\'second\', o.order_ts, pm.captured_ts) / 60.0 AS minutes_to_capture` y `DATE_DIFF(\'hour\', pm.captured_ts, rm.first_refund_ts) / 24.0 AS days_to_refund`. Finalmente, agrupa por `region` devolviendo: `region`, `total_orders` (`COUNT(order_id)`), `captured_orders` (`COUNT(captured_ts)`), `refunded_orders` (`COUNT(first_refund_ts)`), `avg_minutes_to_capture` (`ROUND(AVG(minutes_to_capture), 2)`) y `avg_days_to_refund` (`ROUND(AVG(days_to_refund), 2)`). Ordena por `total_orders DESC`.',
    starterCode: `-- Preagrega payments y refunds a grano order_id antes de construir la instantánea acumulativa
SELECT
  s.region,
  COUNT(o.order_id) AS total_orders,
  COUNT(p.payment_ts) AS captured_orders,
  COUNT(r.refund_ts) AS refunded_orders,
  0.0 AS avg_minutes_to_capture,
  0.0 AS avg_days_to_refund
FROM orders o
INNER JOIN stores s ON o.store_id = s.store_id
LEFT JOIN payments p ON o.order_id = p.order_id
LEFT JOIN refunds r ON o.order_id = r.order_id
GROUP BY s.region
ORDER BY total_orders DESC;`,
    solution: `WITH payment_milestones AS (
  SELECT
    order_id,
    MIN(payment_ts) FILTER (WHERE status = 'captured') AS captured_ts
  FROM payments
  GROUP BY order_id
),
refund_milestones AS (
  SELECT
    order_id,
    MIN(refund_ts) AS first_refund_ts
  FROM refunds
  GROUP BY order_id
),
fct_order_lifecycle AS (
  SELECT
    o.order_id,
    s.region,
    o.order_ts,
    pm.captured_ts,
    rm.first_refund_ts,
    DATE_DIFF('second', o.order_ts, pm.captured_ts) / 60.0 AS minutes_to_capture,
    DATE_DIFF('hour', pm.captured_ts, rm.first_refund_ts) / 24.0 AS days_to_refund
  FROM orders o
  INNER JOIN stores s ON o.store_id = s.store_id
  LEFT JOIN payment_milestones pm ON o.order_id = pm.order_id
  LEFT JOIN refund_milestones rm ON o.order_id = rm.order_id
)
SELECT
  region,
  COUNT(order_id) AS total_orders,
  COUNT(captured_ts) AS captured_orders,
  COUNT(first_refund_ts) AS refunded_orders,
  ROUND(AVG(minutes_to_capture), 2) AS avg_minutes_to_capture,
  ROUND(AVG(days_to_refund), 2) AS avg_days_to_refund
FROM fct_order_lifecycle
GROUP BY region
ORDER BY total_orders DESC;`,
    solutionExplanation:
      'Al comprimir `payments` y `refunds` a grano `order_id` en CTEs previas, evitamos el fan-out de reintentos y reembolsos parciales, preservando las 18,000 órdenes totales y calculando con precisión los tiempos medios de captura y devolución.',
    expectedOutputTable: [
      {
        region: 'Cono Sur',
        total_orders: 6001,
        captured_orders: 5401,
        refunded_orders: 328,
        avg_minutes_to_capture: 0.32,
        avg_days_to_refund: 7.13,
      },
      {
        region: 'Andina',
        total_orders: 6000,
        captured_orders: 5400,
        refunded_orders: 493,
        avg_minutes_to_capture: 0.32,
        avg_days_to_refund: 6.94,
      },
      {
        region: 'Iberia',
        total_orders: 3428,
        captured_orders: 3085,
        refunded_orders: 164,
        avg_minutes_to_capture: 0.32,
        avg_days_to_refund: 6.82,
      },
      {
        region: 'Norteamérica',
        total_orders: 2571,
        captured_orders: 2314,
        refunded_orders: 165,
        avg_minutes_to_capture: 0.32,
        avg_days_to_refund: 7.31,
      },
    ],
    hints: [
      'Crea una CTE `payment_milestones` que agrupe `payments` por `order_id` y extraiga `MIN(payment_ts) FILTER (WHERE status = \'captured\') AS captured_ts`.',
      'Crea una segunda CTE `refund_milestones` que agrupe `refunds` por `order_id` y extraiga `MIN(refund_ts) AS first_refund_ts`.',
      'En `fct_order_lifecycle`, haz `LEFT JOIN` desde `orders o` (unido a `stores s`) hacia ambas CTEs, calcula las diferencias con `DATE_DIFF` y finalmente agrupa por `region` ordenando por `total_orders DESC`.',
    ],
    orderMatters: true,
  },
  roleNotes: {
    de: 'Como Ingeniero de Datos, diseñarás las tablas de instantánea acumulativa con cargas incrementales `MERGE` / `UPSERT` por `order_id`, ya que las filas deben actualizarse conforme llegan los eventos de captura, envío y devolución.',
    da: 'Como Analista de Datos, usarás tablas de instantánea acumulativa para análisis de embudos operativos y cuellos de botella (SLAs), y tablas de instantánea periódica para seguimiento de saldos de cartera e inventario.',
    bi: 'Como especialista en BI, configurarás en la capa semántica las medidas de instantáneas periódicas como semiaditivas (`LAST_VALUE` / `ARG_MAX` sobre la dimensión calendario) para impedir sumas inválidas entre meses.',
  },
  summary: [
    'Las tablas de hechos transaccionales registran una fila por evento atómico con poblamiento disperso y medidas de flujo aditivas.',
    'Las tablas de instantánea periódica fotografían el estado o saldo de cada entidad a intervalos regulares con poblamiento denso.',
    'Las medidas de saldo en una instantánea periódica son semiaditivas: se suman entre entidades pero se cierran con `ARG_MAX` o `AVG` en el tiempo.',
    'Las tablas de instantánea acumulativa dedican una fila por instancia de proceso (`order_id`) con múltiples fechas de hito y métricas de duración.',
    'Antes de ensamblar una instantánea acumulativa desde logs de eventos (`payments`, `refunds`), cada log debe comprimirse a grano de instancia (`order_id`).',
  ],
  glossaryTerms: [
    'hecho-instantanea-periodica',
    'hecho-instantanea-acumulativa',
    'grano-dimensional',
    'c11-additivity-hll',
  ],
  flashcards: [
    {
      id: 'fc-c2-dim-05-01',
      front: '¿Cuáles son los tres patrones principales de tablas de hechos según Ralph Kimball?',
      back: '1) Tablas de hechos transaccionales (eventos atómicos), 2) Tablas de instantánea periódica (saldos a intervalos regulares) y 3) Tablas de instantánea acumulativa (ciclo de vida con múltiples hitos).',
    },
    {
      id: 'fc-c2-dim-05-02',
      front: '¿Por qué no se debe usar `SUM()` a lo largo del tiempo en una tabla de instantánea periódica?',
      back: 'Porque sus medidas representan niveles o saldos acumulados (semiaditivos); sumar los saldos de varios meses contaría múltiples veces el mismo capital o inventario.',
    },
    {
      id: 'fc-c2-dim-05-03',
      front: '¿Qué es una dimensión con rol múltiple (Role-Playing Dimension) en una instantánea acumulativa?',
      back: 'Es una misma dimensión física (como `calendar`) que se une varias veces a la tabla de hechos bajo distintos alias semánticos (`order_date`, `capture_date`, `refund_date`).',
    },
    {
      id: 'fc-c2-dim-05-04',
      front: 'En Mercado Brisa, ¿qué pasa si unes `orders` con `payments` y `refunds` sin preagregar por `order_id` al armar la instantánea acumulativa?',
      back: 'Los reintentos de pago, los 405 webhooks duplicados y los reembolsos parciales multiplican las filas de órdenes (por ejemplo, `Cono Sur` sube de `6,001` a `6,510` filas).',
    },
  ],
  sources: [
    {
      title: 'Transaction Fact Tables',
      url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/transaction-fact-table/',
      publisher: 'Kimball Group',
      accessed: '2026-10-29',
      supports:
        'Propiedades de grano atómico, dispersión y aditividad en tablas de hechos transaccionales.',
    },
    {
      title: 'Periodic Snapshot Fact Tables',
      url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/periodic-snapshot-fact-table/',
      publisher: 'Kimball Group',
      accessed: '2026-10-29',
      supports:
        'Modelado de fotografías regulares de estado/saldo y manejo de hechos semiaditivos.',
    },
    {
      title: 'Accumulating Snapshot Fact Tables',
      url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/accumulating-snapshot-fact-table/',
      publisher: 'Kimball Group',
      accessed: '2026-10-29',
      supports:
        'Diseño de tablas de ciclo de vida con múltiples claves de fecha de hito, Role-Playing Dimensions y métricas de duración (lags).',
    },
    {
      title: 'DuckDB SQL — Window Functions',
      url: 'https://duckdb.org/docs/stable/sql/functions/window_functions.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports:
        'Cálculo de acumulados por ventana (`SUM() OVER`) para construir instantáneas periódicas.',
    },
  ],
  aiNotes:
    'Ayuda al estudiante a notar por qué `starterCode` infla `total_orders` en `Cono Sur` de `6,001` a `6,510`: porque une `orders` directamente con `payments` (que tiene múltiples intentos por orden) y `refunds` (que tiene múltiples devoluciones parciales). Debe comprimir primero `payments` y `refunds` a grano `order_id` en CTEs separadas usando `MIN(payment_ts) FILTER (WHERE status = \'captured\')` y `MIN(refund_ts)`.',
  needsReview: false,
};

export default lesson;
