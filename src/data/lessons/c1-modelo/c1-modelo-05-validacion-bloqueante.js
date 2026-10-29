const lesson = {
  id: 'c1-modelo-05-validacion-bloqueante',
  moduleId: 'c1-modelo',
  tracks: ['core'],
  level: 1,
  order: 5,
  title: 'Reglas de validación bloqueantes antes de publicar una tabla',
  minutes: 20,
  prerequisites: ['c1-modelo-04-auditoria-calidad'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), el equipo de datos ya sabe qué consultas detectan los 450 pagos duplicados y el producto con precio `-9.99 USD`. Sin embargo, como nadie automatizó esas consultas antes de actualizar el tablero matutino, un lunes a las 8:00 a. m. el comité directivo recibió ingresos inflados y precios negativos en vivo. ¿Cómo conviertes tus consultas de auditoría en una compuerta automática que impida publicar una tabla si falla una sola regla crítica?',

  objectives: [
    'Escribir reglas de validación bajo el contrato de aserción de cero filas que utilizan dbt y SQLMesh.',
    'Clasificar las reglas de calidad según su severidad en bloqueantes (BLOCKED / ERROR) frente a advertencias (WARN).',
    'Implementar en SQL el flujo Write-Audit-Publish (WAP) saneando tablas en CTEs y verificando cero fallos antes de publicar.',
  ],

  sections: [
    {
      id: 'contrato-asercion-cero-filas',
      heading: 'El contrato de aserción de cero filas en pruebas SQL',
      body: 'En herramientas de transformación como dbt (`data_tests`) y SQLMesh (`AUDITS`), una prueba de calidad es simplemente una consulta `SELECT` que busca **los registros que rompen la regla**. El contrato es universal:\n\n- Si la consulta devuelve **0 filas** (o un conteo `fallos = 0`), la prueba aprueba (`PASS`).\n- Si la consulta devuelve **1 o más filas** (o `fallos > 0`), la prueba falla (`FAIL` / `BLOCKED`).\n\nPor ejemplo, para validar que ningún producto tenga precio negativo o nulo, no escribes `WHERE list_price_usd > 0` (eso devolvería los 179 productos válidos), sino la condición inversa: `WHERE list_price_usd IS NULL OR list_price_usd <= 0`. Al ejecutarla sobre `products`, devuelve exactamente la fila infractora (`product_id = 180`, `SKU-TEST-NEG`) junto con su código de violación.',
      example: {
        language: 'sql',
        code: `SELECT
  product_id,
  sku,
  list_price_usd,
  unit_cost_usd,
  CASE
    WHEN product_id IS NULL OR sku IS NULL THEN 'CRITICAL_NULL_KEY'
    WHEN list_price_usd <= 0 THEN 'BLOCKER_NON_POSITIVE_PRICE'
    WHEN unit_cost_usd < 0 THEN 'BLOCKER_NEGATIVE_COST'
    WHEN list_price_usd < unit_cost_usd THEN 'WARN_NEGATIVE_MARGIN'
  END AS codigo_violacion
FROM products
WHERE product_id IS NULL
   OR sku IS NULL
   OR list_price_usd <= 0
   OR unit_cost_usd < 0
   OR list_price_usd < unit_cost_usd;`,
        expectedOutput: [
          {
            product_id: 180,
            sku: 'SKU-TEST-NEG',
            list_price_usd: -9.99,
            unit_cost_usd: 0,
            codigo_violacion: 'BLOCKER_NON_POSITIVE_PRICE',
          },
        ],
      },
    },
    {
      id: 'severidad-bloqueante-frente-a-aviso',
      heading: 'Cuándo bloquear el pipeline (BLOCKED) y cuándo solo avisar (WARN)',
      body: 'Si configuras todas las reglas del almacén como bloqueantes, el tablero ejecutivo dejará de actualizarse cada vez que un cliente olvide escribir su código postal. Si configuras todas como simples avisos por correo, nadie las leerá. Los cobros duplicados llegarán directamente a dirección. La distinción depende de si el defecto corrompe las métricas o rompe los cruces:\n\n- **Reglas bloqueantes (`severity: error` / `blocking = true`)**: clave primaria nula o duplicada, `idempotency_key` repetida en pagos (`450` filas en `payments`) y clave foránea huérfana en transacciones (`order_items` sin pedido en `orders`). También bloquean los precios negativos (`SKU-TEST-NEG`) y los descuadres en la reconciliación contable (`subtotal_usd <> SUM(line_total_usd)`).\n\n- **Reglas de aviso (`severity: warn` / `blocking = false`)**: atributos descriptivos opcionales incompletos (`postal_code` nulo o truncado en `customers`), retrasos moderados de frescura o campañas nuevas sin etiqueta en `events`.',
    },
    {
      id: 'patron-write-audit-publish-wap',
      heading: 'El patrón Write-Audit-Publish (WAP) paso a paso',
      body: 'El patrón **Write-Audit-Publish (WAP)** evita que los usuarios finales vean datos a medio limpiar o tablas corruptas. Se divide en tres etapas secuenciales:\n\n1. **Write (Escribir en aislamiento)**: la transformación lee los datos crudos de la capa Bronze y aplica las reglas de saneamiento, como deduplicar `payments` por `idempotency_key` y excluir SKUs de calibración en `products`. El resultado se escribe en una tabla candidata, rama temporal o vista intermedia (`payments_silver`, `products_silver`).\n\n2. **Audit (Auditar la tabla candidata)**: el motor ejecuta la batería de consultas bloqueantes sobre la tabla candidata. Nunca basta con auditar solo la tabla cruda.\n\n3. **Publish (Publicar o abortar)**: si todas las reglas bloqueantes arrojan `fallos = 0` (`estado_compuerta = \'PASS\'`), se publica la tabla o se actualiza la vista de producción. Si una sola regla devuelve `BLOCKED`, el pipeline se detiene y conserva la última versión válida.',
    },
    {
      id: 'invariantes-de-reconciliacion-cruzada',
      heading: 'Invariantes de reconciliación entre cabecera y detalle',
      body: 'Además de validar cada tabla por separado, una compuerta de publicación verifica **invariantes entre tablas**. En Mercado Brisa, todo pedido en `orders` tiene un `subtotal_usd` en la cabecera y entre 1 y 4 líneas en `order_items` cuya suma `SUM(line_total_usd)` debe coincidir al centavo con `subtotal_usd`.\n\nDebido a la representación binaria de coma flotante (`DOUBLE`), nunca compares importes decimales con `<>` exacto sin redondear: utiliza una tolerancia explícita como `ABS(o.subtotal_usd - items.suma_lineas_usd) >= 0.01`. En las 18 000 órdenes de Mercado Brisa, esa comprobación devuelve exactamente `0` pedidos con discrepancia.',
    },
  ],

  workedExample: {
    title: 'Simulación completa de una compuerta Write-Audit-Publish (WAP) en SQL',
    description:
      'Evalúa primero la compuerta bloqueante sobre las tablas crudas (donde falla y bloquea la publicación) y luego sobre las vistas saneadas en Silver (donde aprueba con 0 fallos).',
    steps: [
      {
        label: 'Paso 1: Ejecutar la compuerta de auditoría sobre las tablas crudas (resultado: BLOCKED)',
        explanation:
          'Al evaluar las tres reglas bloqueantes sobre `payments`, `products` y `order_items` sin limpiar, la compuerta detecta 450 duplicados de idempotencia y 1 producto con precio negativo, devolviendo `BLOCKED` e impidiendo la publicación.',
        code: `WITH violaciones AS (
  SELECT '1_pk_duplicada_payments' AS regla, COUNT(*) - COUNT(DISTINCT idempotency_key) AS fallos
  FROM payments
  UNION ALL
  SELECT '2_precio_invalido_products' AS regla, COUNT(*) FILTER (WHERE list_price_usd <= 0) AS fallos
  FROM products
  UNION ALL
  SELECT '3_fk_huerfana_order_items' AS regla, COUNT(*) AS fallos
  FROM order_items oi
  ANTI JOIN orders o ON oi.order_id = o.order_id
)
SELECT
  regla,
  fallos,
  CASE WHEN fallos = 0 THEN 'PASS' ELSE 'BLOCKED' END AS estado_compuerta
FROM violaciones
ORDER BY regla ASC;`,
        expectedOutput: [
          {
            regla: '1_pk_duplicada_payments',
            fallos: 450,
            estado_compuerta: 'BLOCKED',
          },
          {
            regla: '2_precio_invalido_products',
            fallos: 1,
            estado_compuerta: 'BLOCKED',
          },
          {
            regla: '3_fk_huerfana_order_items',
            fallos: 0,
            estado_compuerta: 'PASS',
          },
        ],
      },
      {
        label: 'Paso 2: Aplicar saneamiento en CTEs Silver y verificar que la compuerta pasa a PASS',
        explanation:
          'En la etapa Write construimos `payments_silver` (agrupando por `idempotency_key` para conservar una sola copia de cada cobro) y `products_silver` (filtrando productos activos con `list_price_usd > 0`). Al reejecutar la auditoría sobre las tablas Silver, las tres reglas devuelven `0` fallos y `PASS`.',
        code: `WITH payments_silver AS (
  SELECT
    idempotency_key,
    MIN(payment_id) AS payment_id,
    order_id,
    amount_usd
  FROM payments
  GROUP BY idempotency_key, order_id, amount_usd
),
products_silver AS (
  SELECT *
  FROM products
  WHERE is_active = TRUE
    AND list_price_usd > 0
),
violaciones_post_limpieza AS (
  SELECT '1_pk_duplicada_payments' AS regla, COUNT(*) - COUNT(DISTINCT idempotency_key) AS fallos
  FROM payments_silver
  UNION ALL
  SELECT '2_precio_invalido_products' AS regla, COUNT(*) FILTER (WHERE list_price_usd <= 0) AS fallos
  FROM products_silver
  UNION ALL
  SELECT '3_fk_huerfana_order_items' AS regla, COUNT(*) AS fallos
  FROM order_items oi
  ANTI JOIN orders o ON oi.order_id = o.order_id
)
SELECT
  regla,
  fallos,
  CASE WHEN fallos = 0 THEN 'PASS' ELSE 'BLOCKED' END AS estado_compuerta
FROM violaciones_post_limpieza
ORDER BY regla ASC;`,
        expectedOutput: [
          {
            regla: '1_pk_duplicada_payments',
            fallos: 0,
            estado_compuerta: 'PASS',
          },
          {
            regla: '2_precio_invalido_products',
            fallos: 0,
            estado_compuerta: 'PASS',
          },
          {
            regla: '3_fk_huerfana_order_items',
            fallos: 0,
            estado_compuerta: 'PASS',
          },
        ],
      },
    ],
  },

  checks: [
    {
      id: 'c1-modelo-05-chk1',
      type: 'mcq',
      prompt:
        'En dbt o SQLMesh, escribes una prueba SQL para verificar que ningún pedido tenga `total_usd < 0`. Según el contrato de aserción de cero filas, ¿qué debe devolver tu consulta `SELECT` cuando todos los pedidos son válidos?',
      options: [
        {
          id: 'a',
          text: 'Exactamente 0 filas, porque la consulta filtra `WHERE total_usd < 0` buscando únicamente las filas que violan la regla.',
          correct: true,
          feedback:
            'Exacto. Una prueba de datos busca contraejemplos: si devuelve 0 filas, ningún registro violó la condición y el modelo se publica.',
        },
        {
          id: 'b',
          text: 'Las 18 000 filas de `orders`, para demostrar que todas fueron leídas.',
          correct: false,
          feedback:
            'Incorrecto. Si una prueba de dbt o SQLMesh devuelve 18 000 filas, el motor interpreta que hubo 18 000 errores y bloquea el pipeline.',
        },
        {
          id: 'c',
          text: 'Un texto fijo `"OK"` sin consultar la tabla `orders`.',
          correct: false,
          feedback:
            'Incorrecto. Una consulta que no evalúa los datos de la tabla no valida nada.',
        },
      ],
      explanation:
        'En el estándar de pruebas SQL, la consulta selecciona los registros inválidos (`WHERE condicion_de_error`). Cero filas devueltas significa cero errores.',
    },
    {
      id: 'c1-modelo-05-chk2',
      type: 'mcq',
      prompt:
        'De las siguientes cuatro anomalías detectadas en Mercado Brisa, ¿cuál debería configurarse con severidad de aviso (`WARN`) en lugar de bloquear la publicación (`BLOCKED`) del tablero de ingresos?',
      options: [
        {
          id: 'a',
          text: 'Que el 9.1 % de los clientes tenga `postal_code IS NULL` en `customers`, ya que es un atributo opcional que no altera los importes ni las claves.',
          correct: true,
          feedback:
            'Correcto. Un código postal nulo debe reportarse al equipo operativo (`WARN`), pero no justifica detener el reporte diario de ingresos.',
        },
        {
          id: 'b',
          text: 'Que existan 450 cobros duplicados con la misma `idempotency_key` en `payments`.',
          correct: false,
          feedback:
            'Incorrecto. Publicar cobros duplicados infla los ingresos en 168 674.63 USD; esa regla debe ser estrictamente bloqueante (`BLOCKED`).',
        },
        {
          id: 'c',
          text: 'Que la clave primaria `order_id` tenga valores nulos o duplicados en `orders`.',
          correct: false,
          feedback:
            'Incorrecto. Una clave primaria rota multiplica filas en todos los JOINs aguas abajo y siempre debe bloquear la publicación.',
        },
      ],
      explanation:
        'Las reglas que protegen claves primarias, integridad referencial e importes financieros son bloqueantes (`BLOCKED`); las que vigilan atributos descriptivos opcionales se configuran como aviso (`WARN`).',
    },
    {
      id: 'c1-modelo-05-chk3',
      type: 'order',
      prompt:
        'Ordena las tres fases del patrón Write-Audit-Publish (WAP) para actualizar una tabla analítica sin exponer datos corruptos:',
      items: [
        'Write: Transformar los datos crudos y escribir el resultado en una tabla o vista candidata aislada.',
        'Audit: Ejecutar las consultas de validación bloqueantes sobre la tabla candidata y verificar que devuelvan 0 fallos.',
        'Publish: Exponer la tabla candidata a producción (o abortar conservando la versión previa si alguna regla falló).',
      ],
      correctOrder: [
        'Write: Transformar los datos crudos y escribir el resultado en una tabla o vista candidata aislada.',
        'Audit: Ejecutar las consultas de validación bloqueantes sobre la tabla candidata y verificar que devuelvan 0 fallos.',
        'Publish: Exponer la tabla candidata a producción (o abortar conservando la versión previa si alguna regla falló).',
      ],
      explanation:
        'El orden Write → Audit → Publish garantiza que ninguna consulta de usuario ni tablero de BI lea la tabla nueva antes de que supere todas las validaciones bloqueantes.',
    },
  ],

  practice: {
    type: 'sql',
    title: 'Superar la compuerta WAP saneando payments_silver y products_silver',
    language: 'sql',
    prompt:
      'El código inicial intenta publicar `payments_silver` y `products_silver` copiando las tablas crudas sin limpiar, por lo que la compuerta `auditoria` devuelve `BLOCKED` en las reglas 1 y 2. Corrige las dos primeras CTEs para que la compuerta apruebe las 4 reglas (`fallos = 0`, `estado = \'PASS\'`): 1) En `payments_silver`, agrupa por `idempotency_key, order_id, status, amount_usd` (seleccionando `MIN(payment_id) AS payment_id`) para eliminar los 450 duplicados de webhook; 2) En `products_silver`, filtra `WHERE list_price_usd > 0` para excluir el SKU de prueba negativo.',
    starterCode: `WITH payments_silver AS (
  -- Corrige esta CTE agrupando por idempotency_key, order_id, status, amount_usd para deduplicar
  SELECT
    idempotency_key,
    payment_id,
    order_id,
    status,
    amount_usd
  FROM payments
),
products_silver AS (
  -- Corrige esta CTE filtrando únicamente los productos con list_price_usd > 0
  SELECT
    product_id,
    sku,
    list_price_usd
  FROM products
),
auditoria AS (
  SELECT
    '1_pagos_idempotencia_duplicada' AS regla,
    COUNT(*) - COUNT(DISTINCT idempotency_key) AS fallos
  FROM payments_silver
  UNION ALL
  SELECT
    '2_productos_precio_no_positivo' AS regla,
    COUNT(*) FILTER (WHERE list_price_usd <= 0) AS fallos
  FROM products_silver
  UNION ALL
  SELECT
    '3_lineas_huerfanas_sin_pedido' AS regla,
    COUNT(*) AS fallos
  FROM order_items oi
  ANTI JOIN orders o ON oi.order_id = o.order_id
  UNION ALL
  SELECT
    '4_pedidos_total_negativo' AS regla,
    COUNT(*) FILTER (WHERE total_usd < 0) AS fallos
  FROM orders
)
SELECT
  regla,
  fallos,
  CASE WHEN fallos = 0 THEN 'PASS' ELSE 'BLOCKED' END AS estado
FROM auditoria
ORDER BY regla ASC;`,
    expected: `WITH payments_silver AS (
  SELECT
    idempotency_key,
    MIN(payment_id) AS payment_id,
    order_id,
    status,
    amount_usd
  FROM payments
  GROUP BY idempotency_key, order_id, status, amount_usd
),
products_silver AS (
  SELECT
    product_id,
    sku,
    list_price_usd
  FROM products
  WHERE list_price_usd > 0
),
auditoria AS (
  SELECT
    '1_pagos_idempotencia_duplicada' AS regla,
    COUNT(*) - COUNT(DISTINCT idempotency_key) AS fallos
  FROM payments_silver
  UNION ALL
  SELECT
    '2_productos_precio_no_positivo' AS regla,
    COUNT(*) FILTER (WHERE list_price_usd <= 0) AS fallos
  FROM products_silver
  UNION ALL
  SELECT
    '3_lineas_huerfanas_sin_pedido' AS regla,
    COUNT(*) AS fallos
  FROM order_items oi
  ANTI JOIN orders o ON oi.order_id = o.order_id
  UNION ALL
  SELECT
    '4_pedidos_total_negativo' AS regla,
    COUNT(*) FILTER (WHERE total_usd < 0) AS fallos
  FROM orders
)
SELECT
  regla,
  fallos,
  CASE WHEN fallos = 0 THEN 'PASS' ELSE 'BLOCKED' END AS estado
FROM auditoria
ORDER BY regla ASC;`,
    orderMatters: true,
    hints: [
      'En `payments_silver`, cambia `payment_id` por `MIN(payment_id) AS payment_id` y añade al final `GROUP BY idempotency_key, order_id, status, amount_usd`.',
      'En `products_silver`, añade `WHERE list_price_usd > 0` debajo de `FROM products`.',
      'No modifiques la CTE `auditoria` ni el `SELECT` final: al limpiar las dos primeras CTEs, las cuatro reglas pasarán automáticamente a `fallos = 0` y `estado = \'PASS\'`.',
    ],
    solution: `WITH payments_silver AS (
  SELECT
    idempotency_key,
    MIN(payment_id) AS payment_id,
    order_id,
    status,
    amount_usd
  FROM payments
  GROUP BY idempotency_key, order_id, status, amount_usd
),
products_silver AS (
  SELECT
    product_id,
    sku,
    list_price_usd
  FROM products
  WHERE list_price_usd > 0
),
auditoria AS (
  SELECT
    '1_pagos_idempotencia_duplicada' AS regla,
    COUNT(*) - COUNT(DISTINCT idempotency_key) AS fallos
  FROM payments_silver
  UNION ALL
  SELECT
    '2_productos_precio_no_positivo' AS regla,
    COUNT(*) FILTER (WHERE list_price_usd <= 0) AS fallos
  FROM products_silver
  UNION ALL
  SELECT
    '3_lineas_huerfanas_sin_pedido' AS regla,
    COUNT(*) AS fallos
  FROM order_items oi
  ANTI JOIN orders o ON oi.order_id = o.order_id
  UNION ALL
  SELECT
    '4_pedidos_total_negativo' AS regla,
    COUNT(*) FILTER (WHERE total_usd < 0) AS fallos
  FROM orders
)
SELECT
  regla,
  fallos,
  CASE WHEN fallos = 0 THEN 'PASS' ELSE 'BLOCKED' END AS estado
FROM auditoria
ORDER BY regla ASC;`,
    solutionExplanation:
      'Al ejecutar el código inicial sin cambios, las reglas 1 y 2 devuelven 450 y 1 fallos con estado `BLOCKED`. Una vez que deduplicas `payments_silver` por `idempotency_key` y filtras `list_price_usd > 0` en `products_silver`, las cuatro validaciones bloqueantes devuelven 0 fallos (`PASS`), habilitando la publicación segura.',
    expectedOutputTable: [
      {
        regla: '1_pagos_idempotencia_duplicada',
        fallos: 0,
        estado: 'PASS',
      },
      {
        regla: '2_productos_precio_no_positivo',
        fallos: 0,
        estado: 'PASS',
      },
      {
        regla: '3_lineas_huerfanas_sin_pedido',
        fallos: 0,
        estado: 'PASS',
      },
      {
        regla: '4_pedidos_total_negativo',
        fallos: 0,
        estado: 'PASS',
      },
    ],
  },

  roleNotes: {
    de: 'Implementa el patrón Write-Audit-Publish (WAP) nativo mediante entornos virtuales en SQLMesh o ramas/snapshots en Apache Iceberg: nunca sobrescribas directamente la tabla de producción antes de que pasen las auditorías bloqueantes.',
    da: 'Incluye al final de tus scripts o cuadernos de análisis un bloque de aserciones (`assert fallos == 0`) que verifique que el total de ingresos y el conteo de clientes después de tus transformaciones coincidan con la tabla de origen.',
    bi: 'Vincula el refresco del modelo semántico de Power BI o del caché de BI al éxito de la etapa `Publish` del pipeline de datos, evitando que el tablero se refresque sobre una ejecución marcada como `BLOCKED`.',
  },

  summary: [
    'Una prueba SQL de validación selecciona las filas que violan la regla y aprueba cuando devuelve 0 filas.',
    'Las reglas sobre claves, huérfanos e importes son bloqueantes (`BLOCKED`); las de campos opcionales son avisos (`WARN`).',
    'El patrón Write-Audit-Publish escribe en aislamiento, audita la tabla candidata y publica solo si hay 0 fallos.',
    'Los invariantes de reconciliación verifican con tolerancia (`0.01`) que las sumas de detalle cuadren con la cabecera.',
  ],

  flashcards: [
    {
      id: 'fc-c1-modelo-05-a',
      front: '¿En qué consiste el contrato de aserción de cero filas en pruebas de calidad SQL?',
      back: 'La consulta se escribe para devolver únicamente las filas que rompen la regla; si devuelve 0 filas la prueba aprueba, y si devuelve 1 o más filas falla.',
    },
    {
      id: 'fc-c1-modelo-05-b',
      front: '¿Qué significan las tres siglas del patrón WAP y por qué previenen incidentes en tableros?',
      back: 'Write (escribir en tabla/rama aislada), Audit (ejecutar validaciones bloqueantes) y Publish (exponer a usuarios solo si todas las auditorías devuelven 0 fallos).',
    },
    {
      id: 'fc-c1-modelo-05-c',
      front: '¿Por qué al reconciliar `subtotal_usd` con `SUM(line_total_usd)` se usa `ABS(a - b) >= 0.01` en vez de `a <> b`?',
      back: 'Porque las columnas `DOUBLE` en coma flotante binaria pueden presentar diferencias de redondeo en el décimo decimal (como `0.0000000001`) que no son errores contables.',
    },
  ],

  glossaryTerms: ['validacion-bloqueante-wap', 'idempotencia-duplicados', 'integridad-referencial-huerfanos'],

  sources: [
    {
      title: 'SQLMesh Documentation — Audits (Blocking vs. Non-Blocking Data Quality Audits)',
      url: 'https://sqlmesh.readthedocs.io/en/stable/concepts/audits/',
      publisher: 'Tobiko Data',
      accessed: '2026-10-29',
      supports:
        'Ejecución automática de auditorías bloqueantes que detienen la promoción del modelo cuando devuelven filas.',
    },
    {
      title: 'Bitol / Linux Foundation AI & Data — Open Data Contract Standard (ODCS v3)',
      url: 'https://bitol-io.github.io/open-data-contract-standard/latest/',
      publisher: 'Linux Foundation AI & Data',
      accessed: '2026-10-29',
      supports:
        'Definición declarativa de reglas de calidad de datos y niveles de severidad en contratos de datos.',
    },
    {
      title: 'Apache Iceberg Official Specification — Write-Audit-Publish (WAP) Pattern',
      url: 'https://iceberg.apache.org/spec/',
      publisher: 'Apache Software Foundation',
      accessed: '2026-10-29',
      supports:
        'Aislamiento de escrituras y validación previa a la publicación mediante instantáneas en tablas analíticas.',
    },
    {
      title: 'dbt Labs Documentation — Data Tests & Severity Configuration (error vs warn)',
      url: 'https://docs.getdbt.com/docs/build/data-tests',
      publisher: 'dbt Labs',
      accessed: '2026-10-29',
      supports:
        'Contrato de pruebas SQL que devuelven filas fallidas y configuración de severidad error frente a warn.',
    },
  ],

  aiNotes:
    'La confusión más común al escribir su primera validación bloqueante es poner en el `WHERE` la condición de éxito (`WHERE list_price_usd > 0`) en vez de la condición de fallo (`WHERE list_price_usd <= 0`). Recuérdales que la auditoría busca las filas culpables para que el conteo de fallos sea 0 cuando todo está limpio.',
};

export default lesson;
