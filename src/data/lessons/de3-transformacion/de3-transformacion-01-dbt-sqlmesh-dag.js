export const lesson = {
  id: 'de3-transformacion-01-dbt-sqlmesh-dag',
  legacyId: 'l11-dbt-sqlmesh-dag',
  title: 'Ingeniería de transformación: dbt, SQLMesh y el DAG',
  subtitle: 'Compilación declarativa, modelos incrementales idempotentes y entornos virtuales sobre Mercado Brisa',
  module: 'de3-transformacion',
  moduleId: 'de3-transformacion',
  contentVersion: 2,
  order: 1,
  legacyOrder: 11,
  minutes: 30,
  tracks: ['de'],
  level: 3,
  prerequisites: [
    'de3-lakehouse-01-iceberg-v3-medallion',
    'c2-dimensional-01-hechos-dimensiones-bus',
  ],
  needsReview: false,
  hook: 'Cada madrugada a las 03:00 UTC, un cron ejecuta doce scripts SQL encadenados para consolidar los cobros de Mercado Brisa. Ayer la pasarela de pagos reenvió con retraso 405 confirmaciones duplicadas y el script intermedio falló a mitad de camino, inflando el ingreso liquidado en $168,674.63 entre Cono Sur, Andina, Iberia y Norteamérica. ¿Cómo transformas una secuencia frágil de scripts imperativos en un grafo declarativo idempotente capaz de absorber eventos tardíos y promover entornos sin recalcular millones de filas?',
  objectives: [
    'Construir un grafo acíclico dirigido (DAG) declarativo mediante referencias explícitas y análisis sintáctico para garantizar el orden topológico de ejecución.',
    'Diseñar modelos incrementales idempotentes con ventana deslizante y deduplicación determinista para absorber cobros tardíos sin inflar métricas financieras.',
    'Contrastar la reconstrucción física por estado en dbt frente a los entornos virtuales de datos basados en vistas y huellas semánticas en SQLMesh.',
  ],
  sections: [
    {
      id: 'sec-de3-t01-dag',
      heading: 'De scripts imperativos al grafo declarativo (DAG)',
      body: 'Ejecutar sentencias `CREATE TABLE` e `INSERT INTO` mediante scripts sueltos oculta las dependencias reales entre tablas. Si la limpieza de pagos se retrasa diez minutos, la tabla de ingresos regionales se calcula sobre datos incompletos. Ningún proceso emite errores y el fallo pasa inadvertido.\n\nLa ingeniería de transformación declarativa invierte esta responsabilidad. Cada archivo define una única consulta `SELECT` que expresa el estado deseado del modelo, nunca el procedimiento físico de inserción. En **dbt**, las funciones `{{ source() }}` y `{{ ref() }}` declaran las aristas del grafo acíclico dirigido y se guardan en `manifest.json`. En **SQLMesh**, un analizador léxico construye el árbol de sintaxis abstracta (AST) desde el SQL estándar. Así detecta las tablas origen y el linaje de columnas sin requerir plantillas Jinja.\n\nEl motor conoce el grafo completo antes de enviar una sola consulta al almacén. Por ello resuelve el orden topológico exacto, paraleliza ramas independientes y detiene los modelos descendientes si una tabla intermedia falla.',
      callout: 'En un pipeline declarativo nunca escribes DDL manual para gestionar dependencias: declaras la consulta SELECT y el compilador deduce el orden topológico y el grado de paralelismo.',
      example: {
        language: 'sql',
        code: `-- Modelo declarativo stg_payments_dedup sobre Mercado Brisa
-- Filtra cobros capturados y elimina los 405 reintentos duplicados
SELECT
  payment_id,
  order_id,
  payment_method,
  provider,
  amount_usd,
  payment_ts
FROM payments
WHERE status = 'captured'
QUALIFY ROW_NUMBER() OVER (
  PARTITION BY order_id
  ORDER BY payment_ts DESC, payment_id DESC
) = 1;`,
        explanation:
          'Al encapsular la deduplicación por `order_id` en el nodo staging del DAG, cualquier modelo intermedio o mart que referencie este nodo recibe exactamente un cobro capturado por pedido.',
      },
      interactive: {
        type: 'dbt-sqlmesh-dag-explorer',
        component: 'dbt-sqlmesh-dag-explorer',
        title: 'Simulador de DAG: dbt (Reconstrucción Física) vs. SQLMesh (Entornos Virtuales)',
        description:
          'Compara cómo la edición de un nodo intermedio propaga cambios en el grafo declarativo y contrasta el coste de cómputo entre reconstruir tablas físicas y actualizar punteros de vistas.',
      },
    },
    {
      id: 'sec-de3-t01-incremental',
      heading: 'Materializaciones e idempotencia con ventana deslizante',
      body: 'Elegir cómo persiste cada nodo del DAG determina el equilibrio entre latencia de lectura y coste de cómputo. Una vista (`view`) no almacena datos y recalcula su lógica al vuelo. Una tabla completa (`table` o `FULL`) reconstruye el activo desde cero en cada corrida. Un modelo incremental (`incremental` en dbt o `INCREMENTAL_BY_TIME_RANGE` en SQLMesh) procesa únicamente los intervalos nuevos.\n\nUn error habitual en cargas incrementales consiste en filtrar `WHERE payment_ts > (SELECT MAX(payment_ts) FROM destino)` e insertar filas con `APPEND`. Este patrón falla por dos razones técnicas. Primero, omite eventos tardíos (*late-arriving facts*) que llegan con marcas de tiempo pasadas tras reintentos de red. Segundo, duplica registros si el lote se reejecuta tras una caída.\n\nLa solución rigurosa combina una **ventana deslizante de retrospección** (*lookback window*, por ejemplo de 3 días) con una clave única (`unique_key = \'order_id\'`). La integración se aplica mediante `MERGE` o reemplazo de partición (`DELETE+INSERT`). En SQLMesh, el modelo `INCREMENTAL_BY_TIME_RANGE` parametriza cada corrida con `@start_ds` y `@end_ds`. Esto permite reprocesar cualquier ventana histórica de forma aislada e idempotente.',
      callout: 'Una carga incremental solo es idempotente si reprocesar tres veces la misma ventana temporal produce exactamente el mismo conteo de filas y la misma suma monetaria.',
      example: {
        language: 'sql',
        code: `-- Ventana deslizante de 3 días sobre payments de Mercado Brisa
WITH bounds AS (
  SELECT MAX(CAST(payment_ts AS DATE)) AS max_date FROM payments
),
incremental_window AS (
  SELECT
    p.payment_id,
    p.order_id,
    p.provider,
    p.amount_usd,
    p.payment_ts
  FROM payments p
  CROSS JOIN bounds b
  WHERE p.status = 'captured'
    AND CAST(p.payment_ts AS DATE) >= b.max_date - INTERVAL 3 DAY
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY p.order_id
    ORDER BY p.payment_ts DESC, p.payment_id DESC
  ) = 1
)
SELECT
  provider,
  COUNT(*) AS window_orders,
  ROUND(SUM(amount_usd), 2) AS window_amount_usd
FROM incremental_window
GROUP BY provider
ORDER BY window_amount_usd DESC;`,
        explanation:
          'Al retroceder 3 días desde la fecha máxima (`2025-11-26`) y deduplicar por `order_id`, el lote incremental captura cobros rezagados (`stripe_latam` suma $5,708.44 en 21 órdenes) sin duplicar filas previas.',
      },
    },
    {
      id: 'sec-de3-t01-vde',
      heading: 'Ejecución consciente del estado y entornos virtuales',
      body: 'Cuando un ingeniero modifica un modelo intermedio en desarrollo, necesita validar el impacto aguas abajo sin corromper producción ni duplicar el gasto del almacén. En **dbt**, la ejecución consciente del estado compara el `manifest.json` actual contra el de producción usando `--select state:modified+ --defer`. Así, dbt reconstruye físicamente en desarrollo solo el modelo alterado y sus hijos. Mientras tanto, lee las tablas padre intactas directamente desde producción.\n\n**SQLMesh** aborda este reto mediante **entornos virtuales de datos** (*Virtual Data Environments*). En vez de sobrescribir tablas con nombres fijos, SQLMesh calcula una huella criptográfica (*semantic hash*) a partir del AST de cada modelo. Los datos se guardan en tablas físicas inmutables versionadas (`sqlmesh__fct_payments__a8f92b`). Los esquemas `dev` y `prod` contienen únicamente vistas ligeras que apuntan a la tabla física vigente.\n\nAl crear un entorno `dev`, ninguna fila se clona. Cuando ejecutas `sqlmesh plan prod` tras validar tus cambios en `dev`, la promoción a producción no recalcula los datos. El motor ejecuta un `CREATE OR REPLACE VIEW` instantáneo que redirige el puntero hacia la tabla física ya validada.',
      callout: 'Los entornos virtuales separan el almacenamiento físico (tablas versionadas por huella semántica) de la exposición lógica (vistas por entorno), reduciendo la promoción a producción a un cambio de puntero en milisegundos.',
      example: {
        language: 'sql',
        code: `-- Verificación de equivalencia entre vista de entorno y tabla física
WITH prod_pointer AS (
  SELECT COUNT(*) AS rows_cnt, ROUND(SUM(total_usd), 2) AS total_usd
  FROM orders
  WHERE status IN ('completed', 'refunded')
),
candidate_version AS (
  SELECT
    COUNT(DISTINCT order_id) AS rows_cnt,
    ROUND(SUM(amount_usd), 2) AS total_usd
  FROM (
    SELECT order_id, amount_usd
    FROM payments
    WHERE status = 'captured'
    QUALIFY ROW_NUMBER() OVER (
      PARTITION BY order_id
      ORDER BY payment_ts DESC, payment_id DESC
    ) = 1
  )
)
SELECT
  p.rows_cnt AS prod_orders,
  c.rows_cnt AS candidate_orders,
  p.total_usd AS prod_usd,
  c.total_usd AS candidate_usd,
  ROUND(p.total_usd - c.total_usd, 2) AS reconciliation_diff_usd
FROM prod_pointer p
CROSS JOIN candidate_version c;`,
        explanation:
          'Antes de intercambiar el puntero de la vista productiva, verificamos que la versión candidata (`16,200` órdenes y `$6,874,488.00`) concilie exactamente con las órdenes válidas (`reconciliation_diff_usd = 0`).',
      },
    },
  ],
  workedExample: {
    title: 'Diagnóstico y deduplicación declarativa de cobros en Mercado Brisa',
    scenario:
      'El equipo de Finanzas de Mercado Brisa nota que la suma de pagos capturados en `payments` supera al total facturado en `orders` para los pedidos completados y reembolsados. Debes diagnosticar la magnitud del sobrecobro en `payments`, construir el nodo declarativo de deduplicación y conciliar los ingresos liquidados por región de tienda.',
    steps: [
      {
        label: 'Paso 1: Auditar los intentos de cobro por estado en payments',
        explanation:
          'Inspeccionamos la tabla `payments` (`19,200` filas) agrupando por `status` para comparar el total de intentos registrados frente al número de pedidos únicos (`COUNT(DISTINCT order_id)`).',
        code: `SELECT
  status,
  COUNT(*) AS total_attempts,
  COUNT(DISTINCT order_id) AS distinct_orders,
  ROUND(SUM(amount_usd), 2) AS raw_amount_usd
FROM payments
GROUP BY status
ORDER BY total_attempts DESC;`,
        expectedOutput: [
          {
            status: 'captured',
            total_attempts: 16605,
            distinct_orders: 16200,
            raw_amount_usd: 7043162.63,
          },
          {
            status: 'failed',
            total_attempts: 1857,
            distinct_orders: 1785,
            raw_amount_usd: 820890.69,
          },
          {
            status: 'pending',
            total_attempts: 738,
            distinct_orders: 720,
            raw_amount_usd: 314046.86,
          },
        ],
      },
      {
        label: 'Paso 2: Deduplicar cobros capturados por pedido y proveedor',
        explanation:
          'Observamos `16,605` intentos `captured` para `16,200` órdenes (`405` cobros duplicados). Aplicamos `QUALIFY ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY payment_ts DESC, payment_id DESC) = 1` para retener un único cobro válido por pedido.',
        code: `WITH dedup_payments AS (
  SELECT
    payment_id,
    order_id,
    provider,
    amount_usd,
    payment_ts
  FROM payments
  WHERE status = 'captured'
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY order_id
    ORDER BY payment_ts DESC, payment_id DESC
  ) = 1
)
SELECT
  provider,
  COUNT(*) AS settled_orders,
  ROUND(SUM(amount_usd), 2) AS settled_amount_usd
FROM dedup_payments
GROUP BY provider
ORDER BY settled_amount_usd DESC;`,
        expectedOutput: [
          {
            provider: 'conekta',
            settled_orders: 3960,
            settled_amount_usd: 1935173.03,
          },
          {
            provider: 'adyen_iberia',
            settled_orders: 3960,
            settled_amount_usd: 1927080.27,
          },
          {
            provider: 'mercadopago',
            settled_orders: 4140,
            settled_amount_usd: 1539322.85,
          },
          {
            provider: 'stripe_latam',
            settled_orders: 4140,
            settled_amount_usd: 1472911.85,
          },
        ],
      },
      {
        label: 'Paso 3: Cuantificar el sobrecobro evitado por región en el modelo mart',
        explanation:
          'Unimos `orders` y `stores` con la agregación sin limpiar (`raw_captured`) y con el nodo limpio (`dedup_payments`) para medir exactamente cuántos dólares de sobrecobro eliminó nuestra transformación idempotente en cada región.',
        code: `WITH dedup_payments AS (
  SELECT
    order_id,
    amount_usd
  FROM payments
  WHERE status = 'captured'
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY order_id
    ORDER BY payment_ts DESC, payment_id DESC
  ) = 1
),
raw_captured AS (
  SELECT
    order_id,
    SUM(amount_usd) AS raw_captured_usd
  FROM payments
  WHERE status = 'captured'
  GROUP BY order_id
)
SELECT
  s.region,
  COUNT(o.order_id) AS valid_orders,
  ROUND(SUM(r.raw_captured_usd), 2) AS uncleaned_captured_usd,
  ROUND(SUM(dp.amount_usd), 2) AS clean_captured_usd,
  ROUND(SUM(r.raw_captured_usd) - SUM(dp.amount_usd), 2) AS duplicate_overcount_usd
FROM orders o
INNER JOIN stores s ON o.store_id = s.store_id
INNER JOIN raw_captured r ON o.order_id = r.order_id
INNER JOIN dedup_payments dp ON o.order_id = dp.order_id
WHERE o.status IN ('completed', 'refunded')
GROUP BY s.region
ORDER BY clean_captured_usd DESC;`,
        expectedOutput: [
          {
            region: 'Cono Sur',
            valid_orders: 5401,
            uncleaned_captured_usd: 2307682.6,
            clean_captured_usd: 2256477.18,
            duplicate_overcount_usd: 51205.42,
          },
          {
            region: 'Andina',
            valid_orders: 5400,
            uncleaned_captured_usd: 2235114.25,
            clean_captured_usd: 2180511.86,
            duplicate_overcount_usd: 54602.39,
          },
          {
            region: 'Iberia',
            valid_orders: 3085,
            uncleaned_captured_usd: 1520043.57,
            clean_captured_usd: 1482611.35,
            duplicate_overcount_usd: 37432.22,
          },
          {
            region: 'Norteamérica',
            valid_orders: 2314,
            uncleaned_captured_usd: 980322.21,
            clean_captured_usd: 954887.61,
            duplicate_overcount_usd: 25434.6,
          },
        ],
      },
    ],
  },
  checks: [
    {
      type: 'mcq',
      id: 'chk-de3-t01-lookback',
      prompt:
        'Un modelo incremental filtra únicamente `WHERE payment_ts > (SELECT MAX(payment_ts) FROM {{ this }})`. Si una pasarela de pagos entrega eventos con 18 horas de retraso debido a una caída de webhook, ¿qué anomalía sufre la tabla destino?',
      options: [
        {
          id: 'a',
          text: 'El motor de base de datos aborta la consulta porque los timestamps no son estrictamente crecientes.',
          correct: false,
          feedback:
            'Incorrecto. El motor SQL ejecuta el predicado sin error, descartando silenciosamente las filas anteriores a la marca máxima.',
        },
        {
          id: 'b',
          text: 'Los eventos tardíos tienen un timestamp menor al máximo ya registrado y quedan excluidos permanentemente del modelo incremental.',
          correct: true,
          feedback:
            'Exacto. Como la marca de agua ya avanzó con eventos puntuales más recientes, los cobros rezagados quedan por debajo del umbral y se pierden si no existe una ventana deslizante.',
        },
        {
          id: 'c',
          text: 'La tabla se reconstruye automáticamente desde cero al detectar timestamps fuera de orden.',
          correct: false,
          feedback:
            'Incorrecto. Ningún motor realiza un full-refresh automático a menos que se invoque explícitamente.',
        },
      ],
      explanation:
        'Para absorber eventos tardíos (*late-arriving facts*) sin hacer un *full refresh*, el predicado incremental debe restar una ventana de retrospección (por ejemplo, `MAX(payment_ts) - INTERVAL 3 DAY`) y aplicar `MERGE` o `DELETE+INSERT` sobre la clave única.',
    },
    {
      type: 'mcq',
      id: 'chk-de3-t01-vde',
      prompt:
        '¿Qué mecanismo permite a los entornos virtuales de datos en SQLMesh promover a producción un cambio ya probado en desarrollo sin volver a ejecutar la consulta SQL sobre el almacén?',
      options: [
        {
          id: 'a',
          text: 'Guarda los resultados en la memoria RAM local del portátil del ingeniero y los sube por CSV a producción.',
          correct: false,
          feedback:
            'Incorrecto. Las tablas físicas residen siempre dentro del almacén o lakehouse central.',
        },
        {
          id: 'b',
          text: 'Almacena cada versión de datos en una tabla física nombrada por su huella semántica (AST) y actualiza la vista de producción (`CREATE OR REPLACE VIEW`) para apuntar a ella.',
          correct: true,
          feedback:
            'Correcto. Como la tabla física inmutable ya fue calculada y auditada durante el plan en dev, promover a prod solo requiere cambiar el puntero de la vista.',
        },
        {
          id: 'c',
          text: 'Desactiva las claves primarias y renombra el esquema de desarrollo como esquema de producción dejando a los desarrolladores sin entorno.',
          correct: false,
          feedback:
            'Incorrecto. Cada entorno mantiene su propio conjunto de vistas independientes apuntando a las tablas físicas versionadas.',
        },
      ],
      explanation:
        'Al separar la capa física (tablas inmutables identificadas por el hash del árbol sintáctico SQL) de la capa virtual (vistas por entorno), la promoción a producción o la reversión (*rollback*) se reducen a una operación de metadatos instantánea.',
    },
    {
      type: 'predict-output',
      id: 'chk-de3-t01-predict',
      prompt:
        'En Mercado Brisa existen `16,200` órdenes con estado `completed` o `refunded`, pero la tabla `payments` contiene `16,605` filas con `status = \'captured\'` debido a reintentos duplicados. Si ejecutas `SELECT COUNT(*) FROM payments WHERE status = \'captured\' QUALIFY ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY payment_ts DESC, payment_id DESC) = 1`, ¿qué valor devuelve?',
      options: [
        {
          id: 'a',
          text: '16200',
          correct: true,
          feedback:
            'Correcto. Al particionar por `order_id` y filtrar `ROW_NUMBER() = 1`, los 405 reintentos duplicados se descartan y queda exactamente 1 fila por cada una de las 16,200 órdenes cobradas.',
        },
        {
          id: 'b',
          text: '16605',
          correct: false,
          feedback:
            'Incorrecto. `16,605` es el conteo bruto antes de aplicar la cláusula `QUALIFY ROW_NUMBER() = 1`.',
        },
        {
          id: 'c',
          text: '405',
          correct: false,
          feedback:
            'Incorrecto. `405` es el número de duplicados eliminados (`ROW_NUMBER() > 1`), no el número de órdenes únicas retenidas.',
        },
      ],
      explanation:
        'La cláusula `QUALIFY ROW_NUMBER() OVER (PARTITION BY order_id ...) = 1` garantiza la invariante de grano `1 fila = 1 order_id`, reduciendo las `16,605` filas capturadas a las `16,200` órdenes únicas.',
    },
  ],
  practice: {
    type: 'sql',
    title: 'Conciliación declarativa de cobros liquidados por método de pago',
    prompt:
      'El script heredado del código inicial une `payments` y `orders` sin filtrar intentos fallidos ni eliminar los 405 cobros duplicados. Refactorízalo construyendo primero una CTE `dedup_payments` que filtre únicamente pagos con `status = \'captured\'` y deduplique por `order_id` conservando el registro más reciente (`QUALIFY ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY payment_ts DESC, payment_id DESC) = 1`). Luego une `dedup_payments` (`dp`) con `orders` (`o`) filtrando `o.status IN (\'completed\', \'refunded\')` y agrupa por `dp.payment_method` para calcular: `settled_orders` (`COUNT(dp.order_id)`), `settled_amount_usd` (`ROUND(SUM(dp.amount_usd), 2)`) y `avg_ticket_usd` (`ROUND(AVG(dp.amount_usd), 2)`). Ordena por `settled_amount_usd DESC`.',
    starterCode: `-- Refactoriza esta consulta defectuosa usando una CTE dedup_payments con QUALIFY ROW_NUMBER() = 1
SELECT
  p.payment_method,
  COUNT(p.order_id) AS settled_orders,
  ROUND(SUM(p.amount_usd), 2) AS settled_amount_usd,
  ROUND(AVG(p.amount_usd), 2) AS avg_ticket_usd
FROM payments p
INNER JOIN orders o ON p.order_id = o.order_id
GROUP BY p.payment_method
ORDER BY settled_amount_usd DESC;`,
    expected: `WITH dedup_payments AS (
  SELECT
    payment_id,
    order_id,
    payment_method,
    amount_usd,
    payment_ts
  FROM payments
  WHERE status = 'captured'
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY order_id
    ORDER BY payment_ts DESC, payment_id DESC
  ) = 1
)
SELECT
  dp.payment_method,
  COUNT(dp.order_id) AS settled_orders,
  ROUND(SUM(dp.amount_usd), 2) AS settled_amount_usd,
  ROUND(AVG(dp.amount_usd), 2) AS avg_ticket_usd
FROM dedup_payments dp
INNER JOIN orders o ON dp.order_id = o.order_id
WHERE o.status IN ('completed', 'refunded')
GROUP BY dp.payment_method
ORDER BY settled_amount_usd DESC;`,
    solution: `WITH dedup_payments AS (
  SELECT
    payment_id,
    order_id,
    payment_method,
    amount_usd,
    payment_ts
  FROM payments
  WHERE status = 'captured'
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY order_id
    ORDER BY payment_ts DESC, payment_id DESC
  ) = 1
)
SELECT
  dp.payment_method,
  COUNT(dp.order_id) AS settled_orders,
  ROUND(SUM(dp.amount_usd), 2) AS settled_amount_usd,
  ROUND(AVG(dp.amount_usd), 2) AS avg_ticket_usd
FROM dedup_payments dp
INNER JOIN orders o ON dp.order_id = o.order_id
WHERE o.status IN ('completed', 'refunded')
GROUP BY dp.payment_method
ORDER BY settled_amount_usd DESC;`,
    solutionExplanation:
      'Al aislar en `dedup_payments` únicamente los cobros con `status = \'captured\'` y aplicar `QUALIFY ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY payment_ts DESC, payment_id DESC) = 1`, eliminamos tanto los intentos fallidos/pendientes como los 405 cobros duplicados, obteniendo exactamente las 16,200 órdenes liquidadas.',
    expectedOutputTable: [
      {
        payment_method: 'transferencia_spei',
        settled_orders: 3960,
        settled_amount_usd: 1935173.03,
        avg_ticket_usd: 488.68,
      },
      {
        payment_method: 'efectivo_tienda',
        settled_orders: 3960,
        settled_amount_usd: 1927080.27,
        avg_ticket_usd: 486.64,
      },
      {
        payment_method: 'billetera_digital',
        settled_orders: 4140,
        settled_amount_usd: 1539322.85,
        avg_ticket_usd: 371.82,
      },
      {
        payment_method: 'card',
        settled_orders: 4140,
        settled_amount_usd: 1472911.85,
        avg_ticket_usd: 355.78,
      },
    ],
    hints: [
      'Define la CTE `WITH dedup_payments AS (...)` seleccionando de `payments WHERE status = \'captured\'` y añadiendo al final `QUALIFY ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY payment_ts DESC, payment_id DESC) = 1`.',
      'En la consulta principal, haz `INNER JOIN orders o ON dp.order_id = o.order_id` y filtra `WHERE o.status IN (\'completed\', \'refunded\')`.',
      'Agrupa por `dp.payment_method`, redondea `SUM(dp.amount_usd)` y `AVG(dp.amount_usd)` a 2 decimales con `ROUND(..., 2)` y ordena por `settled_amount_usd DESC`.',
    ],
    orderMatters: true,
  },
  pipelineChallenge: {
    id: 'challenge-de3-t01-dag',
    title: 'Ciclo de ejecución de un modelo incremental y promoción virtual',
    prompt:
      'Ordena los 5 pasos técnicos que ejecuta un motor declarativo moderno para actualizar un modelo incremental con ventana deslizante y promoverlo a producción.',
    steps: [
      {
        id: 'step-parse-ast',
        text: 'Analizar el código SQL (AST o referencias ref/source) para construir el grafo acíclico dirigido (DAG) y calcular su huella semántica.',
      },
      {
        id: 'step-resolve-window',
        text: 'Resolver el intervalo incremental restando la ventana de retrospección (lookback window) al límite temporal procesado previamente.',
      },
      {
        id: 'step-dedup-staging',
        text: 'Ejecutar la consulta sobre la ventana temporal aplicando deduplicación determinista (QUALIFY ROW_NUMBER = 1) en una tabla física aislada.',
      },
      {
        id: 'step-merge-partition',
        text: 'Integrar los registros deduplicados mediante MERGE o reemplazo atómico de partición sobre la clave única sin duplicar filas históricas.',
      },
      {
        id: 'step-swap-view',
        text: 'Promover el entorno actualizando el puntero de la vista de producción (CREATE OR REPLACE VIEW) hacia la tabla física validada.',
      },
    ],
    correctOrder: [
      'step-parse-ast',
      'step-resolve-window',
      'step-dedup-staging',
      'step-merge-partition',
      'step-swap-view',
    ],
    hint: 'Primero el compilador construye el grafo y la huella del código; luego determina qué intervalo temporal procesar, deduplica la ventana en aislamiento, aplica el MERGE idempotente y finalmente conmuta la vista productiva.',
    explanation:
      'Este flujo de cinco pasos garantiza que el orden topológico se respete, los eventos tardíos dentro de la ventana deslizante se reconcilien sin duplicados y los consumidores de producción nunca lean estados intermedios.',
  },
  roleNotes: {
    de: 'Como Ingeniero de Datos, diseñarás la estrategia incremental (`merge` vs `delete+insert` por partición), dimensionarás la ventana de retrospección según el percentil 99 de retraso de las pasarelas de pago y gobernarás el despliegue continuo mediante selectores de estado o entornos virtuales.',
    da: 'Como Analista de Datos, modularizarás las reglas de limpieza en modelos `staging` e `intermediate` reutilizables con `ref()` en lugar de copiar CTEs de 300 líneas en cada reporte, asegurando que la deduplicación de cobros sea idéntica en toda la empresa.',
    bi: 'Como especialista en BI, conectarás los tableros únicamente a las vistas o tablas de la capa `marts` (`fct_` y `dim_`), confiando en que la conmutación atómica de vistas evita que los directivos observen caídas temporales de ingresos durante las recargas.',
  },
  summary: [
    'La transformación declarativa construye el grafo DAG automáticamente a partir de referencias explícitas (`ref`) o análisis del árbol sintáctico SQL (AST).',
    'Un modelo incremental requiere una ventana deslizante de retrospección y una operación idempotente (`MERGE` o `DELETE+INSERT`) para absorber eventos tardíos.',
    'La cláusula `QUALIFY ROW_NUMBER() OVER (PARTITION BY order_id ...) = 1` elimina los 405 cobros duplicados de Mercado Brisa.',
    'Los entornos virtuales de datos en SQLMesh promueven cambios mediante vistas sobre tablas versionadas por huella semántica sin recalcular filas.',
  ],
  flashcards: [
    {
      id: 'fc-de3-t01-01',
      front: '¿Por qué un modelo incremental con estrategia APPEND y filtro `ts > MAX(ts)` no es idempotente ni tolerante a eventos tardíos?',
      back: 'Porque reejecutar el lote duplica filas al no verificar claves únicas, y cualquier evento que llegue con retraso tiene un timestamp menor al máximo y se ignora.',
    },
    {
      id: 'fc-de3-t01-02',
      front: '¿Qué contiene el archivo `manifest.json` en dbt y cómo habilita despliegues eficientes en CI/CD?',
      back: 'Contiene la representación completa del proyecto (nodos, código compilado, tests y linaje); permite comparar estados (`state:modified+`) para ejecutar solo los modelos alterados y sus descendientes.',
    },
    {
      id: 'fc-de3-t01-03',
      front: '¿Cómo evita SQLMesh reconstruir las tablas físicas al promover un entorno `dev` a `prod`?',
      back: 'Guarda los datos en tablas físicas nombradas según el hash semántico de su AST SQL y en producción solo actualiza la vista (`CREATE OR REPLACE VIEW`) hacia dicha tabla.',
    },
    {
      id: 'fc-de3-t01-04',
      front: 'En Mercado Brisa, ¿por qué debemos ordenar por `payment_ts DESC, payment_id DESC` dentro de `ROW_NUMBER()` al deduplicar pagos?',
      back: 'Porque dos reintentos pueden compartir el mismo segundo en `payment_ts`; añadir `payment_id DESC` como desempate hace que la elección de la fila ganadora sea 100 % determinista.',
    },
  ],
  glossaryTerms: [
    'grafo-linaje-declarativo',
    'modelo-incremental-ventana',
    'entorno-virtual-datos',
  ],
  sources: [
    {
      title: 'dbt Labs — About incremental models',
      url: 'https://docs.getdbt.com/docs/build/incremental-models',
      publisher: 'dbt Labs',
      accessed: '2026-10-29',
      supports:
        'Configuración de modelos incrementales, claves únicas (`unique_key`), estrategias `merge`/`delete+insert` y manejo de eventos tardíos con ventanas deslizantes.',
    },
    {
      title: 'dbt Labs — About ref function',
      url: 'https://docs.getdbt.com/reference/dbt-jinja-functions/ref',
      publisher: 'dbt Labs',
      accessed: '2026-10-29',
      supports:
        'Construcción declarativa del grafo de dependencias (DAG) e interpolación de esquemas por entorno.',
    },
    {
      title: 'SQLMesh Documentation — Model Kinds',
      url: 'https://sqlmesh.readthedocs.io/en/stable/concepts/models/model_kinds/',
      publisher: 'Tobiko Data',
      accessed: '2026-10-29',
      supports:
        'Semántica de modelos `INCREMENTAL_BY_TIME_RANGE`, `INCREMENTAL_BY_UNIQUE_KEY` y particionamiento por intervalos temporales idempotentes.',
    },
    {
      title: 'SQLMesh Documentation — Virtual Data Environments',
      url: 'https://sqlmesh.readthedocs.io/en/stable/concepts/environments/',
      publisher: 'Tobiko Data',
      accessed: '2026-10-29',
      supports:
        'Arquitectura de entornos virtuales mediante vistas y versionado físico basado en huellas semánticas del árbol sintáctico.',
    },
  ],
  aiNotes:
    'Guía al estudiante para distinguir el estado del pago (`payments.status = \'captured\'`) del estado del pedido (`orders.status IN (\'completed\', \'refunded\')`). Si su consulta devuelve 0 filas, verifica si filtró por error `status = \'succeeded\'` en lugar de `\'captured\'`. Si obtiene montos inflados, oriéntalo a deduplicar `payments` por `order_id` con `QUALIFY ROW_NUMBER() = 1` antes del `JOIN`.',
};
export default lesson;
