const lesson = {
  id: 'c1-modelo-03-integridad-huerfanos',
  moduleId: 'c1-modelo',
  tracks: ['core'],
  level: 1,
  order: 3,
  title: 'Integridad referencial: detectar huérfanos con ANTI JOIN',
  minutes: 20,
  prerequisites: ['c1-modelo-02-normalizacion-1fn-3fn'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), un reporte de ventas por categoría usó un `INNER JOIN` entre `order_items` y los productos activos (`WHERE is_active = TRUE`) de `products`. Sin dar ningún mensaje de error, el reporte descartó 2 106 líneas de pedido asociadas a 9 productos que habían sido desactivados del catálogo el mes anterior, haciendo desaparecer más de 344 000 USD de facturación histórica. ¿Cómo detectas con SQL qué registros de una tabla hija no encuentran correspondencia válida en su tabla padre?',

  objectives: [
    'Definir qué es la integridad referencial y cómo se originan los registros huérfanos en archivos y almacenes analíticos.',
    'Escribir consultas con ANTI JOIN, NOT EXISTS y LEFT JOIN ... WHERE IS NULL para aislar referencias rotas o inactivas.',
    'Explicar por qué el operador NOT IN devuelve cero filas cuando la subconsulta contiene un solo valor NULL.',
  ],

  sections: [
    {
      id: 'integridad-referencial-y-registros-huerfanos',
      heading: 'Por qué aparecen registros huérfanos fuera de la base transaccional',
      body: 'La **integridad referencial** garantiza que todo valor no nulo de una clave foránea en una tabla hija (`order_items.order_id`) exista como clave primaria en su tabla padre (`orders.order_id`). Cuando una fila hija apunta a un identificador que no existe en la tabla padre, esa fila se denomina **registro huérfano** (*orphan record*).\n\nEn una base relacional operativa como PostgreSQL, una restricción `FOREIGN KEY` bloquea cualquier intento de borrar un cliente que tenga pedidos o de insertar un pago para un pedido inexistente. Sin embargo, en los almacenes de datos en la nube y lagos sobre archivos Parquet, las tablas llegan desde distintos microservicios y con retrasos de red diferentes.\n\nPor ejemplo, el webhook de `payments` o el flujo de `events` puede aterrizar en el almacenamiento cinco minutos antes que la carga por lotes de `orders` o `customers`. Además, es frecuente encontrar **huérfanos lógicos**: la fila padre sí existe físicamente en `products`, pero fue marcada con `is_active = FALSE` y un filtro ingenuo la excluye.',
    },
    {
      id: 'tres-patrones-sql-para-detectar-huerfanos',
      heading: 'ANTI JOIN, NOT EXISTS y LEFT JOIN ... IS NULL frente a frente',
      body: 'Si unes una tabla hija con su tabla padre mediante `INNER JOIN`, los registros huérfanos desaparecen en silencio del resultado. Para auditar la integridad referencial necesitas la operación inversa: conservar únicamente las filas de la tabla izquierda que **no** tienen pareja en la tabla derecha.\n\nEn DuckDB y motores analíticos modernos puedes escribir directamente el operador relacional **`ANTI JOIN`**: `FROM tabla_hija h ANTI JOIN tabla_padre p ON h.fk = p.pk`. Es conciso, expresa la intención de auditoría desde la cláusula `FROM` y el optimizador lo ejecuta como un *Hash Anti Join*.\n\nEn cualquier motor SQL estándar tienes dos equivalentes exactos: la subconsulta correlacionada `WHERE NOT EXISTS (SELECT 1 FROM tabla_padre p WHERE p.pk = h.fk)` y el patrón `LEFT JOIN tabla_padre p ON h.fk = p.pk WHERE p.pk IS NULL`. En Mercado Brisa podemos usarlos para auditar qué pedidos de `orders` no tienen ningún cobro con estado `captured` en `payments`.',
      example: {
        language: 'sql',
        code: `SELECT
  o.status AS estado_pedido,
  COUNT(*) AS pedidos_sin_cobro_capturado,
  ROUND(SUM(o.total_usd), 2) AS monto_total_usd
FROM orders o
LEFT JOIN payments p
  ON o.order_id = p.order_id
  AND p.status = 'captured'
WHERE p.order_id IS NULL
GROUP BY o.status
ORDER BY pedidos_sin_cobro_capturado DESC;`,
        expectedOutput: [
          {
            estado_pedido: 'cancelled',
            pedidos_sin_cobro_capturado: 1080,
            monto_total_usd: 489003.49,
          },
          {
            estado_pedido: 'pending',
            pedidos_sin_cobro_capturado: 720,
            monto_total_usd: 306326.28,
          },
        ],
      },
    },
    {
      id: 'la-trampa-de-not-in-con-valores-nulos',
      heading: 'Por qué NOT IN falla en silencio cuando hay un solo NULL',
      body: 'Muchos analistas intentan buscar registros sin correspondencia escribiendo `WHERE id NOT IN (SELECT id FROM otra_tabla)`. Ese patrón encierra uno de los errores más dañinos de SQL debido a la lógica de tres valores (`TRUE`, `FALSE`, `UNKNOWN`).\n\nLa expresión `x NOT IN (1, 2, NULL)` se traduce internamente como `x <> 1 AND x <> 2 AND x <> NULL`. Para cualquier número `x` distinto de 1 y 2, las dos primeras comparaciones dan `TRUE`, pero `x <> NULL` evalúa a `UNKNOWN`.En lógica trivalente, `TRUE AND UNKNOWN` da `UNKNOWN`, y la cláusula `WHERE` descarta toda fila que no sea estrictamente `TRUE`.\n\nEn Mercado Brisa, la tabla `events` tiene 6 715 eventos de navegación anónima donde `customer_id IS NULL`. Si ejecutas `SELECT * FROM customers WHERE customer_id NOT IN (SELECT customer_id FROM events)`, la consulta devuelve **cero filas** aunque sepamos que una subconsulta parcial solo contiene un cliente.',
    },
    {
      id: 'distinguir-nulos-legitimos-de-claves-huerfanas',
      heading: 'Cómo separar una clave foránea nula legítima de un huérfano real',
      body: 'Cuando ejecutas `FROM events e ANTI JOIN customers c ON e.customer_id = c.customer_id`, el resultado incluirá tanto las filas donde `e.customer_id` tiene un número inexistente en `customers` como las filas donde `e.customer_id IS NULL` (porque `NULL = c.customer_id` nunca es verdadero).\n\nEn una auditoría de calidad debes separar ambos casos con un `CASE WHEN` o un filtro explícito:\n\n1. **Clave foránea nula (`fk IS NULL`)**: en `orders.customer_id` sería un defecto grave (no puede haber un pedido sin cliente), pero en `events.customer_id` es un caso esperado (visitantes web que aún no inician sesión).\n2. **Clave foránea huérfana no nula (`fk IS NOT NULL` sin padre)**: siempre representa una rotura de integridad referencial entre ambas tablas.',
    },
  ],

  workedExample: {
    title: 'Demostración del fallo de NOT IN y auditoría con ANTI JOIN en events',
    description:
      'Compara el resultado de NOT IN frente a NOT EXISTS cuando la subconsulta incluye un NULL de events, y clasifica las filas sin correspondencia con ANTI JOIN.',
    steps: [
      {
        label: 'Paso 1: Comprobar cómo un solo NULL en events anula por completo a NOT IN',
        explanation:
          'Tomamos dos eventos de `events`: `evt-ord-1` (que pertenece a un cliente real) y `evt-web-1` (sesión anónima con `customer_id IS NULL`). Al buscar cuántos de los 2 400 clientes no están en esa muestra de 2 filas, `NOT IN` devuelve 0, mientras que `NOT EXISTS` devuelve los 2 399 clientes correctos.',
        code: `WITH muestra_eventos AS (
  SELECT customer_id
  FROM events
  WHERE event_id IN ('evt-ord-1', 'evt-web-1')
)
SELECT
  COUNT(*) FILTER (
    WHERE c.customer_id NOT IN (SELECT customer_id FROM muestra_eventos)
  ) AS hallados_con_not_in,
  COUNT(*) FILTER (
    WHERE NOT EXISTS (
      SELECT 1 FROM muestra_eventos m WHERE m.customer_id = c.customer_id
    )
  ) AS hallados_con_not_exists
FROM customers c;`,
        expectedOutput: [
          {
            hallados_con_not_in: 0,
            hallados_con_not_exists: 2399,
          },
        ],
      },
      {
        label: 'Paso 2: Clasificar eventos sin correspondencia en customers usando ANTI JOIN',
        explanation:
          'Al cruzar las 65 000 filas de `events` contra `customers` con `ANTI JOIN`, distinguimos cuántos eventos carecen de cliente por ser sesiones anónimas (`customer_id IS NULL`: 6 715 eventos en 6 543 sesiones) frente a claves foráneas no nulas rotas (0 filas).',
        code: `SELECT
  CASE
    WHEN e.customer_id IS NULL THEN 'evento_anonimo_sin_fk'
    ELSE 'fk_huerfana_no_nula'
  END AS tipo_referencia,
  COUNT(*) AS total_eventos,
  COUNT(DISTINCT e.session_id) AS sesiones_distintas
FROM events e
ANTI JOIN customers c ON e.customer_id = c.customer_id
GROUP BY 1
ORDER BY total_eventos DESC;`,
        expectedOutput: [
          {
            tipo_referencia: 'evento_anonimo_sin_fk',
            total_eventos: 6715,
            sesiones_distintas: 6543,
          },
        ],
      },
    ],
  },

  checks: [
    {
      id: 'c1-modelo-03-chk1',
      type: 'predict-output',
      prompt:
        'La tabla `customers` tiene 2 400 clientes y la tabla `events` incluye filas donde `customer_id IS NULL`. Si ejecutas `SELECT COUNT(*) FROM customers WHERE customer_id NOT IN (SELECT customer_id FROM events);`, ¿qué devuelve la consulta?',
      options: [
        {
          id: 'a',
          text: '0, porque al existir al menos un `NULL` en la subconsulta, toda comparación `NOT IN` que no coincida evalúa a `UNKNOWN`.',
          correct: true,
          feedback:
            'Exacto. En lógica de tres valores, `id <> NULL` es `UNKNOWN`, por lo que `WHERE` descarta todas las filas. Usa siempre `ANTI JOIN` o `NOT EXISTS`.',
        },
        {
          id: 'b',
          text: 'El número de clientes que nunca generaron un evento web.',
          correct: false,
          feedback:
            'Incorrecto. Ese sería el resultado si usaras `NOT EXISTS` o `ANTI JOIN`, o si filtraras `WHERE customer_id IS NOT NULL` dentro de la subconsulta.',
        },
        {
          id: 'c',
          text: 'Un error de ejecución porque `NOT IN` no admite subconsultas con valores nulos.',
          correct: false,
          feedback:
            'Incorrecto. SQL no lanza ningún error: devuelve una tabla vacía silenciosamente, que es lo que vuelve tan peligroso a `NOT IN`.',
        },
      ],
      explanation:
        'Un solo `NULL` dentro de la lista de `NOT IN` hace que `valor <> NULL` sea `UNKNOWN` para cualquier fila, vaciando el resultado sin emitir error.',
    },
    {
      id: 'c1-modelo-03-chk2',
      type: 'mcq',
      prompt:
        '¿Qué ocurre en un reporte de ingresos si haces `FROM order_items oi INNER JOIN products p ON oi.product_id = p.product_id` y en `products` faltan o se filtraron algunos `product_id`?',
      options: [
        {
          id: 'a',
          text: 'Las líneas de `order_items` cuyos productos no estén en `products` se descartan en silencio, subestimando los ingresos reales.',
          correct: true,
          feedback:
            'Correcto. El `INNER JOIN` elimina cualquier fila hija que no encuentre su clave primaria en la tabla derecha, ocultando tanto la venta como el problema de integridad.',
        },
        {
          id: 'b',
          text: 'El motor SQL rellena con `NULL` el nombre del producto y conserva todas las líneas de `order_items`.',
          correct: false,
          feedback:
            'Incorrecto. Ese es el comportamiento de `LEFT JOIN`, no de `INNER JOIN`.',
        },
        {
          id: 'c',
          text: 'Se duplica el importe de las líneas restantes por efecto fan-out.',
          correct: false,
          feedback:
            'Incorrecto. La pérdida de claves en la tabla padre no multiplica filas; las elimina del resultado.',
        },
      ],
      explanation:
        'Un `INNER JOIN` contra una dimensión incompleta o filtrada actúa como un filtro implícito que recorta las transacciones huérfanas sin avisar.',
    },
    {
      id: 'c1-modelo-03-chk3',
      type: 'fill-code',
      prompt:
        'Completa la consulta en DuckDB para contar cuántas líneas de `order_items` apuntan a un `order_id` que no existe en `orders`:',
      template: `SELECT COUNT(*) AS lineas_huerfanas
FROM order_items oi
{{b1}} JOIN orders o
  ON oi.order_id = o.{{b2}};`,
      blanks: [
        { id: 'b1', accepted: ['ANTI', 'anti'] },
        { id: 'b2', accepted: ['order_id'] },
      ],
      explanation:
        'La sintaxis `FROM order_items oi ANTI JOIN orders o ON oi.order_id = o.order_id` devuelve únicamente las líneas de pedido cuyo `order_id` no existe en la tabla cabecera `orders`.',
    },
  ],

  practice: {
    type: 'sql',
    title: 'Detectar ventas históricas asociadas a productos inactivos con ANTI JOIN',
    language: 'sql',
    prompt:
      'En Mercado Brisa, varios productos del catálogo tienen `is_active = FALSE` en `products`, pero acumulan ventas históricas en `order_items`. Define una CTE `catalogo_activo` con los `product_id` donde `is_active = TRUE`. Luego une `order_items` (`oi`) con `products` (`p`) y aplica un `ANTI JOIN` contra `catalogo_activo` (`ca`) por `product_id` para aislar los productos vendidos que ya no están en el catálogo activo. Agrupa por `p.product_id`, `p.sku`, `p.product_name` y `p.list_price_usd`, calculando `COUNT(oi.order_item_id) AS lineas_huerfanas_de_catalogo_activo` y `ROUND(SUM(oi.line_total_usd), 2) AS importe_afectado_usd`. Ordena por `p.list_price_usd ASC, p.product_id ASC`.',
    starterCode: `WITH catalogo_activo AS (
  SELECT product_id
  FROM products
  WHERE is_active = TRUE
)
SELECT
  p.product_id,
  p.sku,
  p.product_name,
  p.list_price_usd,
  COUNT(oi.order_item_id) AS lineas_huerfanas_de_catalogo_activo,
  ROUND(SUM(oi.line_total_usd), 2) AS importe_afectado_usd
FROM order_items oi
JOIN products p ON oi.product_id = p.product_id
-- Añade aquí el ANTI JOIN contra catalogo_activo ca por product_id
GROUP BY p.product_id, p.sku, p.product_name, p.list_price_usd
ORDER BY p.list_price_usd ASC, p.product_id ASC;`,
    expected: `WITH catalogo_activo AS (
  SELECT product_id
  FROM products
  WHERE is_active = TRUE
)
SELECT
  p.product_id,
  p.sku,
  p.product_name,
  p.list_price_usd,
  COUNT(oi.order_item_id) AS lineas_huerfanas_de_catalogo_activo,
  ROUND(SUM(oi.line_total_usd), 2) AS importe_afectado_usd
FROM order_items oi
JOIN products p ON oi.product_id = p.product_id
ANTI JOIN catalogo_activo ca ON oi.product_id = ca.product_id
GROUP BY p.product_id, p.sku, p.product_name, p.list_price_usd
ORDER BY p.list_price_usd ASC, p.product_id ASC;`,
    orderMatters: true,
    hints: [
      'Debajo de `JOIN products p ON oi.product_id = p.product_id`, escribe `ANTI JOIN catalogo_activo ca ON oi.product_id = ca.product_id`.',
      'También puedes resolverlo con `WHERE NOT EXISTS (SELECT 1 FROM catalogo_activo ca WHERE ca.product_id = oi.product_id)`.',
      'Conserva el `GROUP BY` y el `ORDER BY p.list_price_usd ASC, p.product_id ASC` para obtener los 9 productos inactivos con ventas históricas.',
    ],
    solution: `WITH catalogo_activo AS (
  SELECT product_id
  FROM products
  WHERE is_active = TRUE
)
SELECT
  p.product_id,
  p.sku,
  p.product_name,
  p.list_price_usd,
  COUNT(oi.order_item_id) AS lineas_huerfanas_de_catalogo_activo,
  ROUND(SUM(oi.line_total_usd), 2) AS importe_afectado_usd
FROM order_items oi
JOIN products p ON oi.product_id = p.product_id
ANTI JOIN catalogo_activo ca ON oi.product_id = ca.product_id
GROUP BY p.product_id, p.sku, p.product_name, p.list_price_usd
ORDER BY p.list_price_usd ASC, p.product_id ASC;`,
    solutionExplanation:
      'El `ANTI JOIN` contra `catalogo_activo` revela que existen 9 productos desactivados (`is_active = FALSE`) que acumulan entre 233 y 235 líneas de pedido cada uno. Si alguien filtrara `WHERE is_active = TRUE` al construir la dimensión de productos para BI, borraría esas ventas históricas.',
    expectedOutputTable: [
      {
        product_id: 171,
        sku: 'MB-CAF-171',
        product_name: 'Café en grano Chiapas Serie 171',
        list_price_usd: 18.63,
        lineas_huerfanas_de_catalogo_activo: 234,
        importe_afectado_usd: 9001.22,
      },
      {
        product_id: 76,
        sku: 'MB-CAF-076',
        product_name: 'Café en grano Oaxaca Serie 76',
        list_price_usd: 40.59,
        lineas_huerfanas_de_catalogo_activo: 234,
        importe_afectado_usd: 19330.94,
      },
      {
        product_id: 114,
        sku: 'MB-ACC-114',
        product_name: 'Accesorios Tarrazú Serie 114',
        list_price_usd: 40.6,
        lineas_huerfanas_de_catalogo_activo: 235,
        importe_afectado_usd: 21268.31,
      },
      {
        product_id: 95,
        sku: 'MB-SUS-095',
        product_name: 'Suscripciones Nariño Serie 95',
        list_price_usd: 44.08,
        lineas_huerfanas_de_catalogo_activo: 234,
        importe_afectado_usd: 20475.2,
      },
      {
        product_id: 19,
        sku: 'MB-ACC-019',
        product_name: 'Accesorios Sierra Nevada Serie 19',
        list_price_usd: 51.87,
        lineas_huerfanas_de_catalogo_activo: 233,
        importe_afectado_usd: 25413.76,
      },
      {
        product_id: 38,
        sku: 'MB-CAF-038',
        product_name: 'Cafeteras Quindío Serie 38',
        list_price_usd: 59.96,
        lineas_huerfanas_de_catalogo_activo: 234,
        importe_afectado_usd: 28903.7,
      },
      {
        product_id: 57,
        sku: 'MB-MOL-057',
        product_name: 'Molinos Veracruz Serie 57',
        list_price_usd: 88.83,
        lineas_huerfanas_de_catalogo_activo: 234,
        importe_afectado_usd: 41417.12,
      },
      {
        product_id: 133,
        sku: 'MB-CAF-133',
        product_name: 'Cafeteras Cusco Serie 133',
        list_price_usd: 168.64,
        lineas_huerfanas_de_catalogo_activo: 234,
        importe_afectado_usd: 81647.08,
      },
      {
        product_id: 152,
        sku: 'MB-MOL-152',
        product_name: 'Molinos Antigua Serie 152',
        list_price_usd: 207.6,
        lineas_huerfanas_de_catalogo_activo: 234,
        importe_afectado_usd: 96637.8,
      },
    ],
  },

  roleNotes: {
    de: 'Configura el test genérico `relationships` en dbt o una auditoría `ANTI JOIN` en SQLMesh entre cada tabla de hechos y sus dimensiones. Nunca filtres `WHERE is_active = TRUE` en una dimensión conformada si existen hechos históricos que apuntan a registros dados de baja.',
    da: 'Cuando cruces tablas de eventos o transacciones con catálogos maestros, empieza con `LEFT JOIN` o audita previamente con `ANTI JOIN` para cuantificar cuántas filas se perderían antes de usar un `INNER JOIN`.',
    bi: 'En Power BI, si la tabla de hechos contiene una clave foránea que no existe en la dimensión, el motor VertiPaq agrupa esas ventas bajo una fila en blanco `(En blanco)`. Usa una fila centinela (`-1 = Sin asignar`) en la dimensión o corrige los huérfanos en el almacén.',
  },

  summary: [
    'La integridad referencial exige que toda clave foránea no nula exista como clave primaria en su tabla padre.',
    'Un INNER JOIN oculta los registros huérfanos y recorta métricas sin emitir error.',
    'Usa ANTI JOIN, NOT EXISTS o LEFT JOIN ... WHERE pk IS NULL para aislar registros huérfanos.',
    'Evita NOT IN con subconsultas: un solo valor NULL hace que el predicado devuelva cero filas.',
  ],

  flashcards: [
    {
      id: 'fc-c1-modelo-03-a',
      front: '¿Qué es un registro huérfano en una base de datos o lago de datos?',
      back: 'Es una fila en una tabla hija cuya clave foránea apunta a un identificador que no existe en la tabla padre.',
    },
    {
      id: 'fc-c1-modelo-03-b',
      front: '¿Por qué `WHERE id NOT IN (SELECT id FROM t2)` devuelve 0 filas si `t2.id` contiene un `NULL`?',
      back: 'Porque `id NOT IN (..., NULL)` equivale a `id <> ... AND id <> NULL`, que evalúa a `UNKNOWN` en lógica de tres valores y es descartado por `WHERE`.',
    },
    {
      id: 'fc-c1-modelo-03-c',
      front: '¿Cuáles son las tres formas seguras en SQL para encontrar registros de `hija` sin padre en `padre`?',
      back: '1) `FROM hija ANTI JOIN padre ON ...`, 2) `WHERE NOT EXISTS (SELECT 1 FROM padre WHERE ...)`, y 3) `LEFT JOIN padre ... WHERE padre.pk IS NULL`.',
    },
  ],

  glossaryTerms: ['integridad-referencial-huerfanos', 'anti-join', 'clave-foranea'],

  sources: [
    {
      title: 'PostgreSQL 17 Documentation — Section 5.4.5: Foreign Keys and Referential Integrity',
      url: 'https://www.postgresql.org/docs/current/ddl-constraints.html',
      publisher: 'PostgreSQL Global Development Group',
      accessed: '2026-10-29',
      supports:
        'Definición de integridad referencial entre tabla hija y tabla padre mediante claves foráneas.',
    },
    {
      title: 'DuckDB Documentation — FROM & JOIN Clauses (ANTI JOIN and SEMI JOIN)',
      url: 'https://duckdb.org/docs/sql/query_syntax/from.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports:
        'Sintaxis nativa de ANTI JOIN en DuckDB y su comportamiento frente a valores nulos.',
    },
    {
      title: 'dbt Labs Documentation — Add Data Tests to Your DAG (relationships generic test)',
      url: 'https://docs.getdbt.com/docs/build/data-tests',
      publisher: 'dbt Labs',
      accessed: '2026-10-29',
      supports:
        'Validación automatizada de integridad referencial en almacenes analíticos mediante consultas que detectan huérfanos.',
    },
  ],

  aiNotes:
    'El fallo más habitual es usar `NOT IN` sobre una columna anulable (`events.customer_id`) o olvidar que `LEFT JOIN` necesita `WHERE p.pk IS NULL` para quedarse solo con los huérfanos. También guíalos a distinguir entre un `NULL` válido en la clave foránea (sesión anónima) y un ID huérfano no nulo.',
};

export default lesson;
