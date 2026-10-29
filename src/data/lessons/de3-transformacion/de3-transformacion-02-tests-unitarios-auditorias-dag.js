export const lesson = {
  id: 'de3-transformacion-02-tests-unitarios-auditorias-dag',
  title: 'Tests de esquema, pruebas unitarias y auditorías en el DAG',
  subtitle: 'Tests de esquema, pruebas unitarias SQL y auditorías bloqueantes en el DAG',
  module: 'de3-transformacion',
  moduleId: 'de3-transformacion',
  contentVersion: 2,
  order: 2,
  minutes: 25,
  tracks: ['de'],
  level: 3,
  prerequisites: ['de3-transformacion-01-dbt-sqlmesh-dag'],
  needsReview: false,
  hook: 'Un viernes por la tarde despliegas una modificación en la fórmula de descuentos de Mercado Brisa. Los tests estándar de nulidad y clave única aprueban en verde, pero una división entera mal parentizada duplica el margen de un SKU con precio negativo y contabiliza 145 devoluciones sobre pedidos que habían sido cancelados antes de cobrarse. ¿Cómo combinas pruebas unitarias SQL sobre casos borde sintéticos con auditorías bloqueantes Write-Audit-Publish para que ninguna anomalía alcance los tableros de dirección?',
  objectives: [
    'Diferenciar las pruebas de datos sobre tablas reales frente a las pruebas unitarias SQL basadas en entradas sintéticas deterministas.',
    'Construir pruebas singulares de reconciliación cruzada que detecten contraejemplos de reglas de negocio entre múltiples tablas.',
    'Implementar compuertas Write-Audit-Publish (WAP) distinguiendo entre auditorías bloqueantes (`blocking: true`) y alertas no bloqueantes (`warn`).',
  ],
  sections: [
    {
      id: 'sec-de3-t02-data-tests',
      heading: 'Pruebas de esquema y pruebas singulares de datos',
      body: 'En un grafo de transformación, una **prueba de datos** (*data test* en dbt o *audit* en SQLMesh) es una consulta SQL que busca filas infractoras sobre los datos ya cargados. La convención técnica es estricta. Una prueba aprueba únicamente cuando devuelve **cero filas** (`COUNT(*) = 0`). Si retorna una o más filas, cada registro devuelto representa un contraejemplo concreto del defecto.\n\nLas pruebas de datos se dividen en dos familias complementarias. Las **pruebas genéricas de esquema** son plantillas parametrizables que validan cuatro garantías estructurales sobre cualquier columna: ausencia de nulos (`not_null`), unicidad de clave (`unique`), dominio cerrado (`accepted_values`) e integridad referencial (`relationships`).\n\nSin embargo, las pruebas genéricas no detectan contradicciones semánticas entre columnas ni entre procesos de negocio. Para ello escribimos **pruebas singulares**. Son consultas SQL a medida que verifican reglas financieras, como exigir que ningún SKU tenga precio negativo (`list_price_usd <= 0`) o prohibir reembolsos sobre órdenes en estado `cancelled` o `pending`.',
      callout: 'Toda prueba de datos o auditoría se formula en negativo: escribes un SELECT que busca las filas culpables, de modo que un resultado vacío significa éxito rotundo.',
      example: {
        language: 'sql',
        code: `-- Prueba singular: detectar reembolsos asociados a órdenes no elegibles
SELECT
  o.status AS order_status,
  COUNT(r.refund_id) AS invalid_refunds,
  ROUND(SUM(r.refund_amount_usd), 2) AS invalid_refund_usd
FROM refunds r
INNER JOIN orders o ON r.order_id = o.order_id
WHERE o.status NOT IN ('completed', 'refunded')
GROUP BY o.status
ORDER BY invalid_refunds DESC;`,
        explanation:
          'Esta prueba singular identifica en Mercado Brisa 145 reembolsos vinculados a pedidos `cancelled` o `pending` que jamás debieron restarse de los ingresos netos.',
      },
    },
    {
      id: 'sec-de3-t02-unit-tests',
      heading: 'Pruebas unitarias SQL con datos simulados (Mocks)',
      body: 'Ejecutar pruebas de datos exige materializar primero la tabla en el almacén y escanear millones de filas reales. Además, un caso extremo puede no haber ocurrido hoy en producción. Por ejemplo, tres reintentos de cobro en el mismo segundo o un descuento del 100 %. En ese escenario, la prueba de datos aprueba hoy pero la fórmula fallará semanas después.\n\nLas **pruebas unitarias SQL** (*unit tests* en dbt y `sqlmesh test`) cierran esta brecha validando la lógica de transformación en seco antes de crear tablas físicas. El motor reemplaza cada referencia a una tabla padre por una expresión tabular común (`WITH mock_input AS (VALUES ...)`). Esa entrada contiene entre tres y seis filas sintéticas diseñadas por el ingeniero.\n\nLuego el motor ejecuta la consulta del modelo sobre esas filas fijas y compara el resultado obtenido contra las filas esperadas (`expect`) mediante `EXCEPT` o `LEFT JOIN`. Como operan sobre pocos registros en memoria o en DuckDB local, las pruebas unitarias corren en milisegundos durante cada *commit* sin coste en la nube.',
      callout: 'Usa pruebas unitarias SQL para verificar tu lógica (expresiones CASE, ventanas QUALIFY, manejo de NULL) con entradas fijas; usa pruebas de datos para vigilar la calidad de los datos reales que llegan de las fuentes.',
      example: {
        language: 'sql',
        code: `-- Prueba unitaria SQL autocontenida con entradas sintéticas (VALUES)
WITH mock_products AS (
  SELECT * FROM (VALUES
    (1, 'SKU-OK',  25.00, 10.00),
    (2, 'SKU-NEG', -5.00, 10.00),
    (3, 'SKU-ZERO', 0.00,  8.00)
  ) AS t(product_id, sku, list_price_usd, unit_cost_usd)
),
logic_under_test AS (
  SELECT
    product_id,
    sku,
    ROUND((list_price_usd - unit_cost_usd) / NULLIF(list_price_usd, 0), 2) AS margin_ratio
  FROM mock_products
  WHERE list_price_usd > 0
),
expected_output AS (
  SELECT * FROM (VALUES
    (1, 'SKU-OK', 0.60)
  ) AS e(product_id, sku, margin_ratio)
)
SELECT
  l.product_id,
  l.sku,
  l.margin_ratio,
  CASE WHEN e.product_id IS NOT NULL THEN 'PASS' ELSE 'FAIL' END AS unit_test_status
FROM logic_under_test l
LEFT JOIN expected_output e
  ON l.product_id = e.product_id
 AND l.margin_ratio = e.margin_ratio;`,
        explanation:
          'Al inyectar tres casos borde sintéticos (precio positivo, negativo y cero), demostramos sin tocar las tablas físicas que el filtro y `NULLIF` producen exactamente la fila esperada (`PASS`).',
      },
    },
    {
      id: 'sec-de3-t02-wap-audits',
      heading: 'Auditorías bloqueantes y patrón Write-Audit-Publish (WAP)',
      body: 'Si ejecutas un modelo con `dbt run` y cinco minutos después corres `dbt test`, abres una ventana de exposición peligrosa. Durante esos cinco minutos, la tabla defectuosa ya está publicada en producción y los tableros ejecutivos leen cifras corruptas.\n\nEl patrón **Write-Audit-Publish (WAP)**, integrado en las auditorías de SQLMesh y en `dbt build`, elimina esta exposición mediante tres fases secuenciales. En la fase **Write**, el motor materializa los nuevos datos en una tabla física oculta o en una rama aislada del catálogo. En la fase **Audit**, se ejecutan todas las reglas de validación sobre esa tabla oculta.\n\nEn la fase **Publish**, el motor verifica que todas las auditorías con política `blocking: true` (`severity: error`) hayan devuelto cero filas anómalas. Solo entonces actualiza la vista de producción. Si una auditoría bloqueante falla, el DAG se detiene y la vista productiva conserva los datos sanos previos. Las anomalías menores, como `218` clientes sin `postal_code` en Mercado Brisa, usan `blocking: false` (`severity: warn`) para alertar sin frenar el cierre.',
      callout: 'Un fallo en una auditoría bloqueante actúa como un disyuntor eléctrico (circuit breaker): aborta el intercambio de puntero para que los consumidores jamás vean datos corruptos.',
      example: {
        language: 'sql',
        code: `-- Resumen de auditoría sobre el catálogo de products en Mercado Brisa
SELECT
  product_id,
  sku,
  category,
  list_price_usd,
  unit_cost_usd
FROM products
WHERE list_price_usd <= 0 OR unit_cost_usd <= 0;`,
        explanation:
          'La auditoría bloqueante identifica de inmediato el único registro corrupto en `products` (`product_id = 180`, `list_price_usd = -15.0`), impidiendo que contamine la dimensión de productos.',
      },
    },
  ],
  workedExample: {
    title: 'Protocolo de pruebas unitarias y compuerta WAP en Mercado Brisa',
    scenario:
      'Antes de publicar el cierre diario de Mercado Brisa, debes ejecutar el protocolo completo de verificación en tres etapas: primero validar en seco la lógica de deduplicación con una prueba unitaria SQL, luego correr las cuatro auditorías de calidad sobre las tablas reales y finalmente emitir la decisión automática del disyuntor WAP.',
    steps: [
      {
        label: 'Paso 1: Ejecutar prueba unitaria SQL sobre la lógica de deduplicación',
        explanation:
          'Simulamos 5 intentos de cobro sintéticos para 3 órdenes (`5001` con doble cobro exitoso, `5002` con fallo seguido de éxito y `5003` solo fallido) y verificamos que la lógica retenga únicamente los cobros ganadores `102` y `104`.',
        code: `WITH mock_payments AS (
  SELECT * FROM (VALUES
    (101, 5001, 1, 'captured', 120.00, TIMESTAMP '2025-05-01 10:00:00'),
    (102, 5001, 2, 'captured', 120.00, TIMESTAMP '2025-05-01 10:01:00'),
    (103, 5002, 1, 'failed',    85.50, TIMESTAMP '2025-05-01 11:00:00'),
    (104, 5002, 2, 'captured',  85.50, TIMESTAMP '2025-05-01 11:05:00'),
    (105, 5003, 1, 'failed',    40.00, TIMESTAMP '2025-05-01 12:00:00')
  ) AS t(payment_id, order_id, attempt_number, status, amount_usd, payment_ts)
),
model_under_test AS (
  SELECT
    order_id,
    payment_id AS winning_payment_id,
    ROUND(amount_usd, 2) AS amount_usd
  FROM mock_payments
  WHERE status = 'captured'
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY order_id
    ORDER BY payment_ts DESC, payment_id DESC
  ) = 1
),
expected_rows AS (
  SELECT * FROM (VALUES
    (5001, 102, 120.00),
    (5002, 104,  85.50)
  ) AS e(order_id, winning_payment_id, amount_usd)
)
SELECT
  m.order_id,
  m.winning_payment_id,
  m.amount_usd,
  CASE
    WHEN e.order_id IS NOT NULL
     AND m.winning_payment_id = e.winning_payment_id
     AND m.amount_usd = e.amount_usd
    THEN 'PASS'
    ELSE 'FAIL'
  END AS assertion_status
FROM model_under_test m
LEFT JOIN expected_rows e ON m.order_id = e.order_id
ORDER BY m.order_id;`,
        expectedOutput: [
          {
            order_id: 5001,
            winning_payment_id: 102,
            amount_usd: 120,
            assertion_status: 'PASS',
          },
          {
            order_id: 5002,
            winning_payment_id: 104,
            amount_usd: 85.5,
            assertion_status: 'PASS',
          },
        ],
      },
      {
        label: 'Paso 2: Ejecutar la batería de auditorías sobre los datos de Mercado Brisa',
        explanation:
          'Evaluamos en una sola consulta unificada tres auditorías bloqueantes (`BLOCKING`) sobre precios, pagos y reembolsos junto con una auditoría informativa (`WARN`) sobre códigos postales de clientes.',
        code: `SELECT
  'audit_negative_sku_price' AS audit_name,
  'BLOCKING' AS policy,
  COUNT(*) AS failing_rows
FROM products
WHERE list_price_usd <= 0
UNION ALL
SELECT
  'audit_duplicate_captured_payments',
  'BLOCKING',
  COUNT(*) - COUNT(DISTINCT order_id)
FROM payments
WHERE status = 'captured'
UNION ALL
SELECT
  'audit_refunds_on_cancelled_orders',
  'BLOCKING',
  COUNT(*)
FROM refunds r
INNER JOIN orders o ON r.order_id = o.order_id
WHERE o.status NOT IN ('completed', 'refunded')
UNION ALL
SELECT
  'audit_customers_missing_postal_code',
  'WARN',
  COUNT(*)
FROM customers
WHERE postal_code IS NULL
ORDER BY policy ASC, failing_rows DESC;`,
        expectedOutput: [
          {
            audit_name: 'audit_duplicate_captured_payments',
            policy: 'BLOCKING',
            failing_rows: 405,
          },
          {
            audit_name: 'audit_refunds_on_cancelled_orders',
            policy: 'BLOCKING',
            failing_rows: 145,
          },
          {
            audit_name: 'audit_negative_sku_price',
            policy: 'BLOCKING',
            failing_rows: 1,
          },
          {
            audit_name: 'audit_customers_missing_postal_code',
            policy: 'WARN',
            failing_rows: 218,
          },
        ],
      },
      {
        label: 'Paso 3: Evaluar la compuerta de publicación Write-Audit-Publish (WAP)',
        explanation:
          'Agregamos los resultados de las auditorías sobre las tablas crudas para determinar si el orquestador debe publicar el snapshot (`PUBLISH_WAP_SNAPSHOT`) o abortar la promoción (`HALT_DAG_ROLLBACK`).',
        code: `WITH audit_results AS (
  SELECT 'audit_negative_sku_price' AS audit_name, TRUE AS is_blocking, COUNT(*) AS failing_rows
  FROM products WHERE list_price_usd <= 0
  UNION ALL
  SELECT 'audit_duplicate_captured_payments', TRUE, COUNT(*) - COUNT(DISTINCT order_id)
  FROM payments WHERE status = 'captured'
  UNION ALL
  SELECT 'audit_customers_missing_postal_code', FALSE, COUNT(*)
  FROM customers WHERE postal_code IS NULL
)
SELECT
  COUNT(*) AS total_audits,
  SUM(CASE WHEN is_blocking AND failing_rows > 0 THEN 1 ELSE 0 END) AS blocking_failures,
  SUM(CASE WHEN NOT is_blocking AND failing_rows > 0 THEN 1 ELSE 0 END) AS warning_failures,
  CASE
    WHEN SUM(CASE WHEN is_blocking AND failing_rows > 0 THEN 1 ELSE 0 END) = 0
    THEN 'PUBLISH_WAP_SNAPSHOT'
    ELSE 'HALT_DAG_ROLLBACK'
  END AS wap_action
FROM audit_results;`,
        expectedOutput: [
          {
            total_audits: 3,
            blocking_failures: 2,
            warning_failures: 1,
            wap_action: 'HALT_DAG_ROLLBACK',
          },
        ],
      },
    ],
  },
  checks: [
    {
      type: 'mcq',
      id: 'chk-de3-t02-unit-vs-data',
      prompt:
        '¿Cuál es la diferencia técnica principal entre una prueba unitaria SQL (`unit_test`) y una prueba de datos (`data_test` / `audit`) dentro de un pipeline declarativo?',
      options: [
        {
          id: 'a',
          text: 'La prueba unitaria valida la lógica SQL sobre filas sintéticas fijas antes de materializar la tabla, mientras que la prueba de datos busca anomalías en los registros reales del almacén.',
          correct: true,
          feedback:
            'Correcto. Las pruebas unitarias aíslan la consulta con mocks deterministas (`VALUES`), en tanto que las pruebas de datos auditan el contenido real tras la carga.',
        },
        {
          id: 'b',
          text: 'Las pruebas unitarias solo pueden escribirse en Python con PySpark y las pruebas de datos solo funcionan en bases relacionales OLTP.',
          correct: false,
          feedback:
            'Incorrecto. Tanto dbt como SQLMesh ejecutan pruebas unitarias directamente en SQL puro sustituyendo las referencias de entrada por CTEs.',
        },
        {
          id: 'c',
          text: 'Las pruebas de datos se ejecutan antes de compilar el SQL y las pruebas unitarias requieren clonar toda la base de producción.',
          correct: false,
          feedback:
            'Incorrecto. Es exactamente al revés: las pruebas unitarias no leen datos de producción y corren en milisegundos antes de materializar.',
        },
      ],
      explanation:
        'Las pruebas unitarias verifican que las fórmulas y condicionales del código funcionen ante casos borde simulados sin coste de almacén; las pruebas de datos y auditorías verifican que los lotes entrantes cumplan las invariantes del dominio.',
    },
    {
      type: 'mcq',
      id: 'chk-de3-t02-wap',
      prompt:
        'En SQLMesh o `dbt build`, ¿por qué una auditoría con `blocking: true` debe ejecutarse sobre la tabla intermedia antes de intercambiar el puntero de la vista productiva (patrón WAP)?',
      options: [
        {
          id: 'a',
          text: 'Para que el motor comprima los archivos Parquet al doble de velocidad durante la lectura.',
          correct: false,
          feedback:
            'Incorrecto. Las auditorías validan invariantes lógicas; no alteran el algoritmo de compresión física de Parquet.',
        },
        {
          id: 'b',
          text: 'Para impedir cualquier ventana de exposición en la que los tableros de producción lean datos corruptos mientras las pruebas aún están ejecutándose.',
          correct: true,
          feedback:
            'Exacto. Si la auditoría falla sobre la tabla oculta, el puntero productivo jamás se mueve y los usuarios siguen consultando la última versión sana.',
        },
        {
          id: 'c',
          text: 'Porque los motores SQL prohíben ejecutar consultas SELECT sobre vistas ya publicadas en el esquema de producción.',
          correct: false,
          feedback:
            'Incorrecto. Se puede consultar cualquier vista en producción, pero auditar después de publicar expone los errores a los consumidores.',
        },
      ],
      explanation:
        'El patrón Write-Audit-Publish (WAP) garantiza atomicidad frente al consumidor: los datos se escriben en aislamiento, se auditan exhaustivamente y solo se publican si todas las reglas bloqueantes devuelven cero filas.',
    },
    {
      type: 'predict-output',
      id: 'chk-de3-t02-predict',
      prompt:
        'En Mercado Brisa, `customers` tiene `2,400` filas, de las cuales `218` tienen `postal_code IS NULL` y `0` tienen `email IS NULL`. Si una auditoría ejecuta `SELECT COUNT(*) AS violations FROM customers WHERE email IS NULL`, ¿qué resultado devuelve y qué decisión toma el motor?',
      options: [
        {
          id: 'a',
          text: 'Devuelve violations = 0 y la auditoría aprueba permitiendo continuar el pipeline.',
          correct: true,
          feedback:
            'Correcto. Al existir 0 correos nulos, el conteo de violaciones es cero y la compuerta de calidad aprueba.',
        },
        {
          id: 'b',
          text: 'Devuelve violations = 218 y detiene el DAG inmediatamente.',
          correct: false,
          feedback:
            'Incorrecto. Los 218 nulos pertenecen a `postal_code`, mientras que la columna `email` está completa en los 2,400 clientes.',
        },
        {
          id: 'c',
          text: 'Devuelve violations = 2400 porque cuenta todos los clientes activos.',
          correct: false,
          feedback:
            'Incorrecto. El predicado `WHERE email IS NULL` filtra únicamente las filas sin correo electrónico.',
        },
      ],
      explanation:
        'En `customers`, la columna `email` tiene completitud del 100 % (`0` nulos), por lo que la auditoría de correo obligatorio aprueba, a diferencia de `postal_code` que presenta `218` ausencias.',
    },
  ],
  practice: {
    type: 'sql',
    title: 'Auditoría bloqueante de cobros duplicados y recuperaciones por pasarela',
    prompt:
      'Construye una auditoría por proveedor de pagos (`provider`) sobre la tabla `payments` para decidir si se bloquea la publicación WAP. En una CTE `order_payment_counts`, agrupa `payments` por `provider` y `order_id` calculando: `total_attempts` (`COUNT(*)`), `captured_count` (`SUM(CASE WHEN status = \'captured\' THEN 1 ELSE 0 END)`) y `failed_count` (`SUM(CASE WHEN status = \'failed\' THEN 1 ELSE 0 END)`). En la consulta final, agrupa por `provider` y devuelve: `audited_orders` (`COUNT(order_id)`), `duplicate_captured_orders` (`SUM(CASE WHEN captured_count > 1 THEN 1 ELSE 0 END)`), `recovered_after_retry` (`SUM(CASE WHEN failed_count > 0 AND captured_count = 1 THEN 1 ELSE 0 END)`) y `gate_status` (`CASE WHEN SUM(CASE WHEN captured_count > 1 THEN 1 ELSE 0 END) > 0 THEN \'BLOCK_PUBLISH\' ELSE \'ALLOW_PUBLISH\' END`). Ordena por `duplicate_captured_orders DESC, provider ASC`.',
    starterCode: `-- Audita por proveedor cuántas órdenes tienen cobros capturados duplicados
WITH order_payment_counts AS (
  SELECT
    provider,
    order_id,
    COUNT(*) AS total_attempts,
    0 AS captured_count,
    0 AS failed_count
  FROM payments
  GROUP BY provider, order_id
)
SELECT
  provider,
  COUNT(order_id) AS audited_orders,
  0 AS duplicate_captured_orders,
  0 AS recovered_after_retry,
  'ALLOW_PUBLISH' AS gate_status
FROM order_payment_counts
GROUP BY provider
ORDER BY duplicate_captured_orders DESC, provider ASC;`,
    expected: `WITH order_payment_counts AS (
  SELECT
    provider,
    order_id,
    COUNT(*) AS total_attempts,
    SUM(CASE WHEN status = 'captured' THEN 1 ELSE 0 END) AS captured_count,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_count
  FROM payments
  GROUP BY provider, order_id
)
SELECT
  provider,
  COUNT(order_id) AS audited_orders,
  SUM(CASE WHEN captured_count > 1 THEN 1 ELSE 0 END) AS duplicate_captured_orders,
  SUM(CASE WHEN failed_count > 0 AND captured_count = 1 THEN 1 ELSE 0 END) AS recovered_after_retry,
  CASE
    WHEN SUM(CASE WHEN captured_count > 1 THEN 1 ELSE 0 END) > 0 THEN 'BLOCK_PUBLISH'
    ELSE 'ALLOW_PUBLISH'
  END AS gate_status
FROM order_payment_counts
GROUP BY provider
ORDER BY duplicate_captured_orders DESC, provider ASC;`,
    solution: `WITH order_payment_counts AS (
  SELECT
    provider,
    order_id,
    COUNT(*) AS total_attempts,
    SUM(CASE WHEN status = 'captured' THEN 1 ELSE 0 END) AS captured_count,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_count
  FROM payments
  GROUP BY provider, order_id
)
SELECT
  provider,
  COUNT(order_id) AS audited_orders,
  SUM(CASE WHEN captured_count > 1 THEN 1 ELSE 0 END) AS duplicate_captured_orders,
  SUM(CASE WHEN failed_count > 0 AND captured_count = 1 THEN 1 ELSE 0 END) AS recovered_after_retry,
  CASE
    WHEN SUM(CASE WHEN captured_count > 1 THEN 1 ELSE 0 END) > 0 THEN 'BLOCK_PUBLISH'
    ELSE 'ALLOW_PUBLISH'
  END AS gate_status
FROM order_payment_counts
GROUP BY provider
ORDER BY duplicate_captured_orders DESC, provider ASC;`,
    solutionExplanation:
      'Al agregar primero a grano `(provider, order_id)`, distinguimos con exactitud los pedidos legítimos que se recuperaron tras un fallo (`failed_count > 0 AND captured_count = 1`) de las 405 órdenes con doble cobro capturado (`captured_count > 1`: 104 en `mercadopago`, 103 en `stripe_latam`, 99 en `adyen_iberia` y 99 en `conekta`), activando `BLOCK_PUBLISH` en las cuatro pasarelas.',
    expectedOutputTable: [
      {
        provider: 'mercadopago',
        audited_orders: 4500,
        duplicate_captured_orders: 104,
        recovered_after_retry: 172,
        gate_status: 'BLOCK_PUBLISH',
      },
      {
        provider: 'stripe_latam',
        audited_orders: 4500,
        duplicate_captured_orders: 103,
        recovered_after_retry: 173,
        gate_status: 'BLOCK_PUBLISH',
      },
      {
        provider: 'adyen_iberia',
        audited_orders: 4500,
        duplicate_captured_orders: 99,
        recovered_after_retry: 165,
        gate_status: 'BLOCK_PUBLISH',
      },
      {
        provider: 'conekta',
        audited_orders: 4500,
        duplicate_captured_orders: 99,
        recovered_after_retry: 165,
        gate_status: 'BLOCK_PUBLISH',
      },
    ],
    hints: [
      'En la CTE `order_payment_counts`, calcula `SUM(CASE WHEN status = \'captured\' THEN 1 ELSE 0 END) AS captured_count` y `SUM(CASE WHEN status = \'failed\' THEN 1 ELSE 0 END) AS failed_count`.',
      'En el `SELECT` externo, cuenta órdenes con doble captura usando `SUM(CASE WHEN captured_count > 1 THEN 1 ELSE 0 END) AS duplicate_captured_orders` y órdenes recuperadas con `SUM(CASE WHEN failed_count > 0 AND captured_count = 1 THEN 1 ELSE 0 END) AS recovered_after_retry`.',
      'Evalúa `gate_status` con `CASE WHEN SUM(CASE WHEN captured_count > 1 THEN 1 ELSE 0 END) > 0 THEN \'BLOCK_PUBLISH\' ELSE \'ALLOW_PUBLISH\' END` y ordena por `duplicate_captured_orders DESC, provider ASC`.',
    ],
    orderMatters: true,
  },
  pipelineChallenge: {
    id: 'challenge-de3-t02-wap',
    title: 'Secuencia de verificación con pruebas unitarias y auditoría WAP',
    prompt:
      'Ordena las 5 etapas del ciclo de integración y despliegue continuo (CI/CD) para validar y publicar un modelo de datos sin riesgo de corrupción.',
    steps: [
      {
        id: 'step-unit-test',
        text: 'Ejecutar las pruebas unitarias SQL inyectando CTEs sintéticas (VALUES) para validar la lógica de negocio sin tocar el almacén.',
      },
      {
        id: 'step-write-isolated',
        text: 'Materializar el lote incremental o la tabla candidata en un esquema oculto o tabla física aislada (fase Write de WAP).',
      },
      {
        id: 'step-run-blocking-audits',
        text: 'Correr las auditorías bloqueantes de unicidad, referencialidad y dominio sobre la tabla aislada recién construida (fase Audit de WAP).',
      },
      {
        id: 'step-emit-warnings',
        text: 'Registrar en el sistema de monitoreo las advertencias no bloqueantes (WARN) sin abortar el flujo cuando las reglas críticas aprueban.',
      },
      {
        id: 'step-publish-pointer',
        text: 'Conmutar atómicamente la vista de producción hacia la tabla auditada (fase Publish de WAP) para habilitar el consumo en BI.',
      },
    ],
    correctOrder: [
      'step-unit-test',
      'step-write-isolated',
      'step-run-blocking-audits',
      'step-emit-warnings',
      'step-publish-pointer',
    ],
    hint: 'Primero se prueba la lógica en seco con mocks (Unit Test), luego se escribe la tabla aislada (Write), se evalúan las reglas bloqueantes y advertencias (Audit), y por último se publica la vista (Publish).',
    explanation:
      'Separar las pruebas unitarias previas a la materialización de las auditorías WAP posteriores a la escritura aislada garantiza velocidad en el desarrollo e inmunidad frente a datos corruptos en producción.',
  },
  roleNotes: {
    de: 'Como Ingeniero de Datos, exigirás pruebas unitarias SQL en cada Pull Request que modifique expresiones complejas y configurarás `blocking: true` en las auditorías financieras para que el pipeline aborte antes de publicar vistas defectuosas.',
    da: 'Como Analista de Datos, traducirás los casos extremos hallados en tus exploraciones (como reembolsos sobre órdenes canceladas o SKUs negativos) en pruebas singulares permanentes dentro de la carpeta `tests/` o `audits/`.',
    bi: 'Como especialista en BI, acordarás con Ingeniería qué reglas deben detener la actualización de un tablero (`error`/`blocking`) y cuáles solo deben mostrar un aviso de calidad parcial (`warn`) sin congelar las métricas.',
  },
  summary: [
    'Toda prueba de datos o auditoría en el DAG busca contraejemplos y aprueba únicamente cuando la consulta devuelve cero filas.',
    'Las pruebas unitarias SQL inyectan filas sintéticas (`VALUES`) para verificar en milisegundos la lógica de transformación antes de tocar datos reales.',
    'Las pruebas singulares expresan invariantes de negocio cruzadas, como prohibir reembolsos sobre pedidos en estado `cancelled` o `pending`.',
    'El patrón Write-Audit-Publish (WAP) evalúa auditorías bloqueantes sobre una tabla aislada antes de conmutar el puntero de producción.',
  ],
  flashcards: [
    {
      id: 'fc-de3-t02-01',
      front: '¿Cuándo aprueba una prueba de datos (`data test` en dbt o `audit` en SQLMesh)?',
      back: 'Aprueba únicamente cuando la consulta SQL de validación devuelve cero filas (`COUNT(*) = 0`); cualquier fila devuelta representa un registro que viola la invariante.',
    },
    {
      id: 'fc-de3-t02-02',
      front: '¿Por qué las pruebas de datos sobre tablas reales no sustituyen a las pruebas unitarias SQL?',
      back: 'Porque las pruebas de datos solo evalúan los valores presentes hoy en el almacén; las pruebas unitarias inyectan casos borde sintéticos para verificar la lógica antes de que ocurra el fallo en producción.',
    },
    {
      id: 'fc-de3-t02-03',
      front: '¿Qué diferencia operativa existe entre `blocking: true` (`severity: error`) y `blocking: false` (`severity: warn`) en una auditoría?',
      back: 'Una auditoría bloqueante aborta el intercambio de la vista productiva y detiene los nodos descendientes del DAG; una no bloqueante registra la alerta pero permite publicar el modelo.',
    },
    {
      id: 'fc-de3-t02-04',
      front: 'En Mercado Brisa, ¿qué diferencia hay entre una orden con `failed_count > 0 AND captured_count = 1` y una con `captured_count > 1`?',
      back: 'La primera es una recuperación legítima tras un reintento fallido (1 solo cobro efectivo); la segunda es una anomalía crítica de doble cobro que requiere deduplicación o bloqueo.',
    },
  ],
  glossaryTerms: [
    'prueba-unitaria-sql',
    'auditoria-bloqueante-wap',
    'prueba-singular-datos',
  ],
  sources: [
    {
      title: 'dbt Labs — Add data tests to your DAG',
      url: 'https://docs.getdbt.com/docs/build/data-tests',
      publisher: 'dbt Labs',
      accessed: '2026-10-29',
      supports:
        'Definición y ejecución de pruebas genéricas (`not_null`, `unique`, `accepted_values`, `relationships`) y pruebas singulares SQL.',
    },
    {
      title: 'dbt Labs — Unit tests',
      url: 'https://docs.getdbt.com/docs/build/unit-tests',
      publisher: 'dbt Labs',
      accessed: '2026-10-29',
      supports:
        'Especificación de pruebas unitarias de lógica SQL con datos simulados (`given` y `expect`) sin lectura de tablas productivas.',
    },
    {
      title: 'SQLMesh Documentation — Audits',
      url: 'https://sqlmesh.readthedocs.io/en/stable/concepts/audits/',
      publisher: 'Tobiko Data',
      accessed: '2026-10-29',
      supports:
        'Ejecución de auditorías bloqueantes (`blocking: true`) y no bloqueantes dentro del flujo Write-Audit-Publish (WAP).',
    },
    {
      title: 'SQLMesh Documentation — Testing (Unit Tests)',
      url: 'https://sqlmesh.readthedocs.io/en/stable/concepts/tests/',
      publisher: 'Tobiko Data',
      accessed: '2026-10-29',
      supports:
        'Evaluación determinista de transformaciones SQL mediante inyección de CTEs sintéticas en motores locales.',
    },
  ],
  aiNotes:
    'En la práctica SQL, asegúrate de que el estudiante agrupe primero por `(provider, order_id)` en la CTE antes de agregar por `provider`. Si intenta contar `status = \'captured\'` directamente a nivel de `provider`, no podrá saber cuántas órdenes individuales tuvieron más de un cobro capturado (`captured_count > 1`).',
};
export default lesson;
