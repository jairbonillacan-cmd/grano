const lesson = {
  id: 'de2-pipelines-03-cargas-incrementales-merge',
  moduleId: 'de2-pipelines',
  tracks: ['de'],
  level: 2,
  order: 3,
  title: 'Cargas incrementales, marcas de agua y operaciones MERGE',
  subtitle: 'Cargas incrementales, marcas de agua de lote (watermarks) y operaciones MERGE',
  minutes: 25,
  prerequisites: ['de2-pipelines-02-idempotencia-backfill'],
  contentVersion: 2,

  hook: 'Recargar desde cero los 18.000 pedidos de Mercado Brisa tarda pocos segundos en local. Pero cuando una plataforma supera quinientos millones de transacciones históricas, recrear la tabla entera cada hora multiplica la factura de cómputo y retrasa los tableros matutinos. Además, en `payments` existen 750 pedidos cuyo primer intento de cobro falló (`attempt_number = 1`) y horas más tarde se liquidaron en un segundo intento (`attempt_number = 2`). ¿Cómo extraes sólo las novedades desde la última corrida y actualizas cada pedido sin duplicar filas?',

  objectives: [
    'Implementar extracción incremental basada en marcas de agua de lote (high-water marks) con ventana de solapamiento (lookback window) para datos tardíos.',
    'Aplicar la semántica de `MERGE INTO` (WHEN MATCHED / WHEN NOT MATCHED) para sincronizar inserciones y actualizaciones en la capa Plata.',
    'Colapsar múltiples intentos de cobro por `order_id` en `payments` para evitar colisiones de cardinalidad antes de ejecutar un upsert.'
  ],

  sections: [
    {
      id: 'marcas-de-agua-y-lookback',
      heading: 'Marcas de agua de lote (watermarks) y ventanas de solapamiento',
      body: 'Una **carga completa** (*full refresh*) trunca y vuelve a poblar toda la tabla destino en cada ejecución. Es sencilla para catálogos pequeños de pocos miles de filas. Sin embargo, resulta inviable en tablas de hechos que crecen a razón de millones de eventos diarios.\n\nLa alternativa es la **carga incremental**, que procesa únicamente los registros nuevos o modificados desde el último lote exitoso. Para recordar dónde se quedó el pipeline, se guarda una **marca de agua de lote** (*high-water mark* o *watermark*). Esta marca corresponde al valor máximo alcanzado por una columna de auditoría como `updated_at` o `processed_at`.\n\nCon todo, leer estrictamente `WHERE processed_at > last_watermark` tiene una trampa llamada **datos de llegada tardía** (*late-arriving data*). Una compra iniciada a las `23:58` en tienda puede tardar diez minutos en confirmarse. Si llega después del corte de medianoche, la marca de agua ya habrá avanzado. Para no perder ese registro, restamos una ventana de solapamiento (*lookback window*, por ejemplo de 6 horas) a la marca de agua. Luego confiamos en la operación `MERGE` para no duplicar las filas releídas.',
      interactive: {
        component: 'cdc-log-stream',
        caption: 'Simulador interactivo: Flujo de cambios incrementales, marcas de agua y consolidación de estado.'
      },
      example: {
        language: 'sql',
        code: `SELECT
  attempt_number,
  status,
  COUNT(*) AS raw_rows,
  COUNT(DISTINCT order_id) AS distinct_orders,
  ROUND(SUM(amount_usd), 2) AS total_amount_usd
FROM payments
GROUP BY attempt_number, status
ORDER BY attempt_number, status;`,
        expectedOutput: [
          { attempt_number: 1, status: 'captured', raw_rows: 15930, distinct_orders: 15525, total_amount_usd: 6754573.34 },
          { attempt_number: 1, status: 'failed', raw_rows: 1812, distinct_orders: 1785, total_amount_usd: 800034.58 },
          { attempt_number: 1, status: 'pending', raw_rows: 708, distinct_orders: 690, total_amount_usd: 303773.69 },
          { attempt_number: 2, status: 'captured', raw_rows: 675, distinct_orders: 675, total_amount_usd: 288589.29 },
          { attempt_number: 2, status: 'failed', raw_rows: 45, distinct_orders: 45, total_amount_usd: 20856.11 },
          { attempt_number: 2, status: 'pending', raw_rows: 30, distinct_orders: 30, total_amount_usd: 10273.17 }
        ]
      }
    },
    {
      id: 'operacion-merge-upsert-sql',
      heading: 'Anatomía de la sentencia MERGE INTO (Upsert) en SQL moderno',
      body: 'Un lote incremental suele traer tanto pedidos nuevos como actualizaciones de pedidos que ayer estaban en estado `pending` o `failed`. Necesitamos entonces una operación **upsert**: actualizar la fila si la llave primaria ya existe en el destino o insertarla si es nueva.\n\nEl estándar SQL y motores como DuckDB, PostgreSQL, Snowflake y BigQuery resuelven esto con `MERGE INTO`. La cláusula **`USING staging_batch AS src`** define la subconsulta origen y la condición de cruce por llave primaria. La rama `WHEN MATCHED AND src.processed_at > target.processed_at THEN UPDATE` modifica el estado sólo si el dato entrante es más reciente. Por su parte, la rama `WHEN NOT MATCHED THEN INSERT` agrega las llaves nuevas.\n\nExiste una regla estricta en cualquier motor SQL: **el lote origen (`src`) no puede contener dos filas con la misma llave de unión**. Si en un mismo lote vienen el intento 1 (`failed`) y el intento 2 (`captured`) del mismo `order_id`, el comando `MERGE` abortará por ambigüedad. Debemos colapsar antes el lote `src` a una sola fila por `order_id`.',
      example: {
        language: 'python',
        code: `import duckdb

def upsert_order_payment_status(con: duckdb.DuckDBPyConnection, watermark_ts: str) -> None:
    """Sincroniza el estado más reciente de cobro por order_id usando MERGE INTO."""
    con.execute(
        """
        MERGE INTO silver_order_payments AS target
        USING (
            SELECT
                order_id,
                payment_id AS latest_payment_id,
                attempt_number AS latest_attempt,
                provider,
                status,
                amount_usd,
                processed_at
            FROM payments
            WHERE processed_at >= CAST(? AS TIMESTAMP) - INTERVAL '6 hours'
            QUALIFY ROW_NUMBER() OVER (
                PARTITION BY order_id
                ORDER BY attempt_number DESC, processed_at DESC, payment_id ASC
            ) = 1
        ) AS src
        ON target.order_id = src.order_id
        WHEN MATCHED AND (
            src.latest_attempt > target.latest_attempt
            OR src.processed_at > target.processed_at
        ) THEN UPDATE SET
            latest_payment_id = src.latest_payment_id,
            latest_attempt = src.latest_attempt,
            status = src.status,
            amount_usd = src.amount_usd,
            processed_at = src.processed_at
        WHEN NOT MATCHED THEN INSERT (
            order_id, latest_payment_id, latest_attempt, provider, status, amount_usd, processed_at
        ) VALUES (
            src.order_id, src.latest_payment_id, src.latest_attempt, src.provider, src.status, src.amount_usd, src.processed_at
        );
        """,
        [watermark_ts],
    )`
      }
    },
    {
      id: 'reconciliacion-estado-actual-por-entidad',
      heading: 'De flujo de eventos a tabla de estado actual por entidad',
      body: 'Conviene distinguir siempre entre un **registro histórico de eventos** (grano: un intento de pago por fila) y una **tabla de estado actual** (grano: un pedido único por fila con su último estado). Confundir ambos granos distorsiona los cierres contables.\n\nEn Mercado Brisa, los **18.000 pedidos** pasan por la pasarela en `payments`. En el primer intento (`attempt_number = 1`), 15.525 pedidos son capturados de inmediato, 1.785 fallan y 690 quedan pendientes. De los pedidos no completados al inicio, **750 ejecutan un segundo intento** (`attempt_number = 2`). Gracias a ese reintento comercial, **675 pedidos adicionales** pasan a estado `captured` por un valor recuperado de `288.589,29 USD`.\n\nCuando preparamos el lote incremental para un `MERGE` a nivel de `order_id`, ordenamos las filas de cada pedido por `attempt_number DESC, processed_at DESC, payment_id ASC`. Así aislamos el estado final vigente de cada uno de los 18.000 pedidos. Con ello medimos cuántos pedidos se recuperaron en el segundo intento por cada pasarela.',
      example: {
        language: 'sql',
        code: `WITH november_staging AS (
  SELECT
    order_id,
    attempt_number,
    status,
    amount_usd
  FROM payments
  WHERE payment_ts >= TIMESTAMP '2025-11-01 00:00:00'
    AND payment_ts < TIMESTAMP '2025-12-01 00:00:00'
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY order_id
    ORDER BY attempt_number DESC, payment_ts DESC, payment_id DESC
  ) = 1
)
SELECT
  status,
  COUNT(*) AS ready_for_merge_orders,
  COUNT(*) FILTER (WHERE attempt_number = 2) AS recovered_on_retry,
  ROUND(SUM(amount_usd), 2) AS settled_amount_usd
FROM november_staging
GROUP BY status
ORDER BY settled_amount_usd DESC;`,
        expectedOutput: [
          { status: 'captured', ready_for_merge_orders: 527, recovered_on_retry: 25, settled_amount_usd: 217153.16 },
          { status: 'failed', ready_for_merge_orders: 33, recovered_on_retry: 3, settled_amount_usd: 15109.73 },
          { status: 'pending', ready_for_merge_orders: 26, recovered_on_retry: 2, settled_amount_usd: 11832.51 }
        ]
      }
    }
  ],

  workedExample: {
    title: 'Preparación de lote incremental en noviembre 2025 para MERGE por order_id',
    description: 'El lote incremental de noviembre de 2025 en `payments` contiene tanto el primer intento fallido como el segundo intento exitoso para 30 pedidos, además de webhooks repetidos.',
    audit: 'Al colapsar el lote staging a 1 fila por order_id (attempt_number DESC, payment_ts DESC), las 628 filas crudas de noviembre se reducen exactamente a los 586 pedidos únicos listos para el MERGE.',
    steps: [
      {
        label: 'Paso 1 — Lote incremental crudo con múltiples filas por order_id',
        explanation: 'El lote de noviembre tiene 628 filas para sólo 586 pedidos distintos; un MERGE directo por `order_id` fallará porque el mismo pedido aparece dos veces.',
        code: `SELECT
  status,
  COUNT(*) AS source_rows,
  COUNT(DISTINCT order_id) AS unique_orders,
  ROUND(SUM(amount_usd), 2) AS uncollapsed_amount_usd
FROM payments
WHERE payment_ts >= TIMESTAMP '2025-11-01 00:00:00'
  AND payment_ts < TIMESTAMP '2025-12-01 00:00:00'
GROUP BY status
ORDER BY uncollapsed_amount_usd DESC;`,
        expectedOutput: [
          { status: 'captured', source_rows: 539, unique_orders: 527, uncollapsed_amount_usd: 221449.52 },
          { status: 'failed', source_rows: 63, unique_orders: 60, uncollapsed_amount_usd: 25864.08 },
          { status: 'pending', source_rows: 26, unique_orders: 26, uncollapsed_amount_usd: 11832.51 }
        ]
      },
      {
        label: 'Paso 2 — Lote staging colapsado al último intento por order_id',
        explanation: 'Al particionar por `order_id` y ordenar por `attempt_number DESC, payment_ts DESC`, cada uno de los 586 pedidos queda representado por su estado más reciente.',
        code: `WITH november_staging AS (
  SELECT
    order_id,
    attempt_number,
    status,
    amount_usd
  FROM payments
  WHERE payment_ts >= TIMESTAMP '2025-11-01 00:00:00'
    AND payment_ts < TIMESTAMP '2025-12-01 00:00:00'
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY order_id
    ORDER BY attempt_number DESC, payment_ts DESC, payment_id DESC
  ) = 1
)
SELECT
  status,
  COUNT(*) AS ready_for_merge_orders,
  COUNT(*) FILTER (WHERE attempt_number = 2) AS recovered_on_retry,
  ROUND(SUM(amount_usd), 2) AS settled_amount_usd
FROM november_staging
GROUP BY status
ORDER BY settled_amount_usd DESC;`,
        expectedOutput: [
          { status: 'captured', ready_for_merge_orders: 527, recovered_on_retry: 25, settled_amount_usd: 217153.16 },
          { status: 'failed', ready_for_merge_orders: 33, recovered_on_retry: 3, settled_amount_usd: 15109.73 },
          { status: 'pending', ready_for_merge_orders: 26, recovered_on_retry: 2, settled_amount_usd: 11832.51 }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: 'Un pipeline incremental guarda `last_watermark = 2025-11-10 04:00:00`. Si en la siguiente corrida filtra con `WHERE updated_at >= last_watermark - INTERVAL \'2 hours\'`, ¿por qué se resta esa ventana de dos horas?',
      options: [
        {
          id: 'a',
          text: 'Para capturar registros tardíos (late-arriving data) cuya transacción inició antes de las 04:00 pero se confirmó minutos después en el origen.',
          correct: true,
          feedback: 'Correcto. La ventana de solapamiento (lookback) recupera eventos demorados y el MERGE posterior evita duplicar los que ya existían.'
        },
        {
          id: 'b',
          text: 'Porque los motores SQL no soportan el operador mayor o igual sin restar un intervalo.',
          correct: false,
          feedback: 'Incorrecto. Es una decisión de diseño frente a transacciones concurrentes o demoradas, no una limitación sintáctica.'
        },
        {
          id: 'c',
          text: 'Para borrar las últimas dos horas de la tabla destino y dejarlas vacías.',
          correct: false,
          feedback: 'Incorrecto. La ventana de solapamiento relee y actualiza mediante upsert sin dejar huecos en la tabla destino.'
        }
      ],
      explanation: 'En bases de datos transaccionales y APIs distribuidas, un registro puede asignarse un timestamp al abrir la transacción pero hacerse visible varios minutos más tarde al confirmar el commit. Retroceder una ventana de seguridad garantiza que ningún evento tardío quede fuera.'
    },
    {
      id: 'c2',
      type: 'mcq',
      prompt: 'Al ejecutar `MERGE INTO silver_orders AS t USING staging_orders AS s ON t.order_id = s.order_id`, el motor devuelve un error indicando que una fila destino coincide con múltiples filas de origen. ¿Cuál es la causa y cómo se corrige?',
      options: [
        {
          id: 'a',
          text: 'La tabla `staging_orders` contiene más de una fila para el mismo `order_id`; debe deduplicarse previamente con `QUALIFY ROW_NUMBER()` por `order_id`.',
          correct: true,
          feedback: 'Correcto. El bloque USING de un MERGE debe presentar a lo sumo una fila por cada llave de unión hacia la tabla destino.'
        },
        {
          id: 'b',
          text: 'La tabla destino `silver_orders` está vacía y `MERGE` no puede ejecutarse sobre tablas sin datos.',
          correct: false,
          feedback: 'Incorrecto. Cuando la tabla destino está vacía, todas las filas entran por la rama WHEN NOT MATCHED sin producir error.'
        },
        {
          id: 'c',
          text: 'Falta eliminar la rama `WHEN NOT MATCHED THEN INSERT` de la sentencia.',
          correct: false,
          feedback: 'Incorrecto. La colisión ocurre en la rama WHEN MATCHED cuando múltiples filas origen reclaman actualizar el mismo registro destino.'
        }
      ],
      explanation: 'El estándar SQL exige que la operación `MERGE` sea determinista: si dos filas del lote `staging` empatan con la misma fila de `target`, el motor no puede decidir cuál de las dos actualizaciones conservar y aborta la transacción.'
    },
    {
      id: 'c3',
      type: 'mcq',
      prompt: '¿En cuál de estos casos sigue siendo preferible una recarga completa (`CREATE OR REPLACE TABLE`) en lugar de mantener marcas de agua y sentencias `MERGE`?',
      options: [
        {
          id: 'a',
          text: 'En una tabla de dimensiones pequeña como `stores` (14 tiendas) o `products` (180 SKUs) donde el reemplazo completo tarda milisegundos.',
          correct: true,
          feedback: 'Correcto. En tablas pequeñas, el reemplazo completo es atómico, simple de mantener y tiene un costo de cómputo insignificante.'
        },
        {
          id: 'b',
          text: 'En una tabla de telemetría web que recibe cincuenta millones de eventos por hora y retiene cinco años de historia.',
          correct: false,
          feedback: 'Incorrecto. Recargar miles de millones de eventos desde cero en cada corrida es prohibitivo en tiempo y costo.'
        },
        {
          id: 'c',
          text: 'Cuando el sistema de origen borra los registros históricos pasados siete días.',
          correct: false,
          feedback: 'Incorrecto. Si el origen purga el historial, una recarga completa borraría los datos antiguos de tu almacén analítico.'
        }
      ],
      explanation: 'Las cargas incrementales introducen complejidad operativa (gestión de estado de marcas de agua, ventanas lookback y manejo de borrados). Para dimensiones pequeñas cuya lectura completa es instantánea y el origen conserva todo el catálogo, `CREATE OR REPLACE` resulta más simple y seguro.'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Estado consolidado por pedido y cobros recuperados en segundo intento',
    language: 'sql',
    prompt: 'Construye la vista consolidada del estado final de cobro por pedido (`order_id`) sobre toda la tabla `payments` (simulando el estado resultante de un `MERGE` incremental por `order_id`). Primero crea una CTE que seleccione una única fila por `order_id` usando `QUALIFY ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY attempt_number DESC, payment_ts DESC, payment_id DESC) = 1`. Luego agrupa por `provider` y calcula: `total_orders` (pedidos únicos), `first_try_captured` (pedidos cuyo último estado es `status = \'captured\'` con `attempt_number = 1`), `recovered_orders` (pedidos con `status = \'captured\'` y `attempt_number = 2`) y `recovered_revenue_usd` (`ROUND(SUM(amount_usd) FILTER (WHERE status = \'captured\' AND attempt_number = 2), 2)`). Ordena por `recovered_revenue_usd DESC`.',
    starterCode: `-- Estado final consolidado por order_id y cobros recuperados en segundo intento
-- El código inicial agrupa payments sin colapsar primero al último intento por order_id,
-- lo que infla first_try_captured con los webhooks repetidos del intento 1.
-- Corrige la consulta usando una CTE con QUALIFY ROW_NUMBER() OVER (PARTITION BY order_id ...).
SELECT
  provider,
  COUNT(DISTINCT order_id) AS total_orders,
  COUNT(*) FILTER (WHERE status = 'captured' AND attempt_number = 1) AS first_try_captured,
  COUNT(*) FILTER (WHERE status = 'captured' AND attempt_number = 2) AS recovered_orders,
  ROUND(
    SUM(amount_usd) FILTER (WHERE status = 'captured' AND attempt_number = 2),
    2
  ) AS recovered_revenue_usd
FROM payments
GROUP BY provider
ORDER BY recovered_revenue_usd DESC;`,
    expected: `WITH latest_order_payment AS (
  SELECT
    order_id,
    provider,
    attempt_number,
    status,
    amount_usd
  FROM payments
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY order_id
    ORDER BY attempt_number DESC, payment_ts DESC, payment_id DESC
  ) = 1
)
SELECT
  provider,
  COUNT(*) AS total_orders,
  COUNT(*) FILTER (WHERE status = 'captured' AND attempt_number = 1) AS first_try_captured,
  COUNT(*) FILTER (WHERE status = 'captured' AND attempt_number = 2) AS recovered_orders,
  ROUND(
    SUM(amount_usd) FILTER (WHERE status = 'captured' AND attempt_number = 2),
    2
  ) AS recovered_revenue_usd
FROM latest_order_payment
GROUP BY provider
ORDER BY recovered_revenue_usd DESC;`,
    orderMatters: true,
    hints: [
      'En el código inicial, first_try_captured cuenta directamente sobre las 19.200 filas de payments e incluye los webhooks duplicados del intento 1.',
      'Crea una CTE latest_order_payment con QUALIFY ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY attempt_number DESC, payment_ts DESC, payment_id DESC) = 1.',
      'En la consulta externa agrupa latest_order_payment por provider y calcula total_orders, first_try_captured, recovered_orders y recovered_revenue_usd.'
    ],
    solution: `WITH latest_order_payment AS (
  SELECT
    order_id,
    provider,
    attempt_number,
    status,
    amount_usd
  FROM payments
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY order_id
    ORDER BY attempt_number DESC, payment_ts DESC, payment_id DESC
  ) = 1
)
SELECT
  provider,
  COUNT(*) AS total_orders,
  COUNT(*) FILTER (WHERE status = 'captured' AND attempt_number = 1) AS first_try_captured,
  COUNT(*) FILTER (WHERE status = 'captured' AND attempt_number = 2) AS recovered_orders,
  ROUND(
    SUM(amount_usd) FILTER (WHERE status = 'captured' AND attempt_number = 2),
    2
  ) AS recovered_revenue_usd
FROM latest_order_payment
GROUP BY provider
ORDER BY recovered_revenue_usd DESC;`,
    solutionExplanation: 'Colapsa la tabla `payments` a una fila única por `order_id` priorizando el último `attempt_number` y `payment_ts`, eliminando tanto los intentos previos superados como los webhooks repetidos.',
    expectedOutputTable: [
      { provider: 'conekta', total_orders: 4500, first_try_captured: 3795, recovered_orders: 165, recovered_revenue_usd: 81508.97 },
      { provider: 'adyen_iberia', total_orders: 4500, first_try_captured: 3795, recovered_orders: 165, recovered_revenue_usd: 81222.72 },
      { provider: 'mercadopago', total_orders: 4500, first_try_captured: 3968, recovered_orders: 172, recovered_revenue_usd: 65070.28 },
      { provider: 'stripe_latam', total_orders: 4500, first_try_captured: 3967, recovered_orders: 173, recovered_revenue_usd: 60787.32 }
    ]
  },

  roleNotes: {
    de: 'Como Ingeniero de Datos, incluye siempre una guarda temporal en la cláusula `WHEN MATCHED AND src.processed_at > target.processed_at` para evitar que un evento antiguo reprocesado sobreescriba un estado más reciente.',
    da: 'Como Analista de Datos, distingue en el catálogo si una tabla de pagos guarda cada intento histórico (`payments`) o únicamente la foto actual consolidada por pedido tras un `MERGE`.',
    bi: 'Como especialista en BI, configura el refresco incremental de tus modelos semánticos alineado con la ventana de lookback del pipeline para reflejar los pedidos que cambian de `pending` a `captured`.'
  },

  summary: [
    'Las cargas incrementales procesan sólo registros nuevos o modificados usando una marca de agua de lote (watermark).',
    'Añadir una ventana de solapamiento (lookback window) al watermark evita perder transacciones de llegada tardía.',
    'La sentencia MERGE INTO sincroniza inserciones y actualizaciones en una sola transacción atómica sobre la tabla destino.',
    'El lote de entrada en USING debe colapsarse a una única fila por llave de unión para impedir colisiones en el MERGE.'
  ],

  flashcards: [
    {
      id: 'fc-de2-pip-03-a',
      front: '¿Qué es una marca de agua de lote (high-water mark) en una carga incremental?',
      back: 'Es el valor máximo de la columna de tiempo o secuencia procesado en la última corrida exitosa, usado como punto de partida del siguiente lote.'
    },
    {
      id: 'fc-de2-pip-03-b',
      front: '¿Por qué un bloque USING en MERGE INTO falla si el lote origen contiene dos filas con el mismo order_id?',
      back: 'Porque una sentencia MERGE no puede decidir de forma determinista cuál de las dos filas origen aplicar sobre la única fila correspondiente en la tabla destino.'
    },
    {
      id: 'fc-de2-pip-03-c',
      front: '¿Para qué sirve restar una ventana de solapamiento (lookback window) a la marca de agua incremental?',
      back: 'Para capturar datos de llegada tardía (late-arriving data) que se generaron antes del corte anterior pero se confirmaron minutos después.'
    }
  ],

  glossaryTerms: ['marca-agua-lote-watermark', 'operacion-merge-upsert'],

  sources: [
    {
      title: 'DuckDB Documentation — MERGE INTO Statement',
      url: 'https://duckdb.org/docs/stable/sql/statements/merge_into',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Sintaxis y reglas de unicidad de la sentencia MERGE INTO (WHEN MATCHED / WHEN NOT MATCHED) en DuckDB.'
    },
    {
      title: 'dbt Documentation — Configure incremental models',
      url: 'https://docs.getdbt.com/docs/build/incremental-models',
      publisher: 'dbt Labs',
      accessed: '2026-10-29',
      supports: 'Estrategias incrementales (merge, delete+insert, insert_overwrite) y manejo de late-arriving facts.'
    },
    {
      title: 'PostgreSQL 17 Documentation — MERGE Command',
      url: 'https://www.postgresql.org/docs/current/sql-merge.html',
      publisher: 'PostgreSQL Global Development Group',
      accessed: '2026-10-29',
      supports: 'Comportamiento transaccional del comando MERGE cuando múltiples filas de origen coinciden con una fila destino.'
    }
  ],

  aiNotes: 'Ayuda al estudiante a notar por qué el `starterCode` falla: en `first_try_captured` cuenta directamente sobre `payments` y obtiene `3894, 3894, 4072, 4070` debido a los webhooks duplicados del intento 1. Al crear la CTE con `QUALIFY ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY attempt_number DESC, processed_at DESC, payment_id ASC) = 1`, los valores bajan a `3795, 3795, 3968, 3967`.',

  pipelineChallenge: {
    title: 'Sincronización incremental con watermark, lookback y MERGE',
    scenario: 'Ordena los 4 pasos entre Ingeniería (DE), Análisis (DA) y BI para actualizar cada hora la tabla de estado actual de pagos sin perder datos tardíos ni provocar colisiones en el MERGE.',
    steps: [
      {
        id: 'step-1',
        label: '1. Extraer novedades desde last_watermark menos la ventana de lookback',
        role: 'DE',
        detail: 'Leer de Bronce los eventos con `processed_at >= last_watermark - INTERVAL \'6 hours\'` para incluir cobros de llegada tardía.'
      },
      {
        id: 'step-2',
        label: '2. Colapsar el lote staging a una fila única por order_id y ejecutar MERGE',
        role: 'DE',
        detail: 'Aplicar `QUALIFY ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY attempt_number DESC, processed_at DESC)` antes del `MERGE INTO`.'
      },
      {
        id: 'step-3',
        label: '3. Auditar la tasa de recuperación en segundo intento por pasarela',
        role: 'DA',
        detail: 'Medir cuántos pedidos cambiaron de `failed` o `pending` en el intento 1 a `captured` en el intento 2 (675 pedidos en total).'
      },
      {
        id: 'step-4',
        label: '4. Actualizar el indicador de recaudación neta y reintentos exitosos',
        role: 'BI',
        detail: 'Exponer en el tablero de tesorería los 288.589,29 USD recuperados gracias al segundo intento de cobro.'
      }
    ],
    explanation: 'Al combinar ventana lookback (Paso 1) con colapso por llave antes del MERGE (Paso 2), DA analiza la transición entre intentos (Paso 3) y BI reporta la recaudación actualizada (Paso 4).'
  }
};

export default lesson;
