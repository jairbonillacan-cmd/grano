const lesson = {
  id: 'c1-sql-joins-03-subconsultas',
  moduleId: 'c1-sql-joins',
  tracks: ['core'],
  level: 1,
  order: 3,
  title: 'Subconsultas escalares, de tabla y correlacionadas',
  minutes: 20,
  prerequisites: ['c1-sql-joins-02-grano-fanout'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), la tabla `events` registra 65 000 eventos web, incluidos 1 343 eventos de compra (`checkout_completed`) realizados sin iniciar sesión (`customer_id IS NULL`). Un analista quiere listar los clientes registrados que nunca tuvieron un evento `checkout_completed` y escribe `WHERE customer_id NOT IN (SELECT customer_id FROM events WHERE event_type = \'checkout_completed\')`. El motor devuelve cero filas, aunque hay 800 clientes en ese caso. ¿Por qué un solo `NULL` dentro de `NOT IN` vacía todo el resultado?',

  objectives: [
    'Escribir subconsultas escalares en SELECT, WHERE y HAVING para comparar filas o grupos contra un valor global.',
    'Usar subconsultas de tabla en FROM para encadenar dos niveles de agregación respetando el grano.',
    'Sustituir NOT IN por NOT EXISTS o ANTI JOIN cuando la subconsulta puede contener valores NULL.'
  ],

  sections: [
    {
      id: 'subconsulta-escalar-select-where-having',
      heading: 'Subconsultas escalares: comparar contra una métrica global',
      body: 'Una **subconsulta escalar** es una consulta entre paréntesis que devuelve como máximo una fila y una sola columna. Como su resultado es un valor único (por ejemplo, el precio medio del catálogo o la fecha del último pedido), puedes colocarla en casi cualquier lugar donde iría una constante: dentro de `SELECT`, en un filtro `WHERE` o en una condición `HAVING`.\n\nEn Mercado Brisa (empresa ficticia), si quieres saber qué tiendas superan la facturación media por tienda sin funciones de ventana, agrupas `orders` por `store_id` y comparas `SUM(o.total_usd)` en el `HAVING` contra la subconsulta escalar `(SELECT SUM(total_usd) / COUNT(DISTINCT store_id) FROM orders)`. Si la subconsulta escalar devuelve cero filas, SQL la evalúa como `NULL`; si devuelve más de una fila, el motor detiene la consulta con un error en tiempo de ejecución.',
      example: {
        language: 'sql',
        code: 'SELECT\n  s.store_code,\n  s.region,\n  ROUND(SUM(o.total_usd), 2) AS ventas_tienda_usd\nFROM stores s\nINNER JOIN orders o ON s.store_id = o.store_id\nGROUP BY s.store_code, s.region\nHAVING SUM(o.total_usd) > (\n  SELECT SUM(total_usd) / COUNT(DISTINCT store_id)\n  FROM orders\n)\nORDER BY ventas_tienda_usd DESC\nLIMIT 5;',
        expectedOutput: [
          { store_code: 'STR-AR-01', region: 'Cono Sur', ventas_tienda_usd: 1347578.23 },
          { store_code: 'STR-PE-01', region: 'Andina', ventas_tienda_usd: 1074174.89 },
          { store_code: 'WH-ES-01', region: 'Iberia', ventas_tienda_usd: 965688.93 },
          { store_code: 'STR-CL-02', region: 'Cono Sur', ventas_tienda_usd: 660775.79 },
          { store_code: 'STR-CO-01', region: 'Andina', ventas_tienda_usd: 611040.83 }
        ]
      }
    },
    {
      id: 'subconsulta-tabla-derivada-from',
      heading: 'Subconsultas de tabla en FROM: agregar en dos etapas',
      body: 'SQL estándar no permite anidar funciones de agregación directamente como `AVG(SUM(total_usd))`. Cuando necesitas calcular el gasto medio acumulado por cliente dentro de cada segmento, tienes que agregar en dos pasos con distinto grano. Primero agrupas los pedidos al grano de `customer_id` y después promedias ese resultado al grano de `segment`.\n\nUna **tabla derivada** (o subconsulta en `FROM`) resuelve este problema envolviendo la primera agregación entre paréntesis tras el `FROM` y asignándole un alias obligatorio (`AS resumen_clientes`). La consulta exterior lee esa tabla virtual como si fuera una tabla física más. Así evitas mezclar el grano de pedido (`order_id`) con el grano de cliente (`customer_id`).',
      example: {
        language: 'sql',
        code: 'SELECT\n  segment,\n  COUNT(*) AS clientes,\n  ROUND(AVG(gasto_cliente_usd), 2) AS gasto_medio_por_cliente_usd,\n  ROUND(MAX(gasto_cliente_usd), 2) AS gasto_maximo_cliente_usd\nFROM (\n  SELECT\n    c.customer_id,\n    c.segment,\n    SUM(o.total_usd) AS gasto_cliente_usd\n  FROM customers c\n  INNER JOIN orders o ON c.customer_id = o.customer_id\n  GROUP BY c.customer_id, c.segment\n) AS resumen_clientes\nGROUP BY segment\nORDER BY gasto_medio_por_cliente_usd DESC;',
        expectedOutput: [
          { segment: 'cafeteria_b2b', clientes: 467, gasto_medio_por_cliente_usd: 3487.34, gasto_maximo_cliente_usd: 8060.23 },
          { segment: 'pro_barista', clientes: 966, gasto_medio_por_cliente_usd: 3174.84, gasto_maximo_cliente_usd: 7851.9 },
          { segment: 'retail', clientes: 967, gasto_medio_por_cliente_usd: 3075.84, gasto_maximo_cliente_usd: 7427.56 }
        ]
      }
    },
    {
      id: 'subconsulta-correlacionada-y-descorrelacion',
      heading: 'Subconsultas correlacionadas y cómo las ejecuta DuckDB',
      body: 'Una subconsulta independiente se evalúa una sola vez antes de la consulta exterior. En cambio, una **subconsulta correlacionada** hace referencia a una o más columnas de la tabla externa (por ejemplo, `WHERE e.customer_id = c.customer_id`). Lógicamente, es como si la subconsulta se ejecutara una vez por cada fila de la tabla exterior.\n\nEn motores antiguos, las subconsultas correlacionadas tenían fama de lentas porque ejecutaban bucles anidados fila por fila. En DuckDB y PostgreSQL 17, el optimizador de consultas aplica descorrelación automática: reescribe internamente la subconsulta correlacionada como un `SEMI JOIN`, `ANTI JOIN` o unión agregada en bloque. Por eso escribir `WHERE EXISTS (SELECT 1 FROM ...)` es tan rápido como escribir `SEMI JOIN`.'
    },
    {
      id: 'trampa-not-in-con-null',
      heading: 'La trampa de NOT IN con valores NULL frente a NOT EXISTS',
      body: 'El error más silencioso con subconsultas ocurre al usar `NOT IN` sobre una columna que contiene valores `NULL`. La expresión `x NOT IN (10, 20, NULL)` equivale en SQL a `x <> 10 AND x <> 20 AND x <> NULL`. Para un cliente con `customer_id = 5`, las dos primeras comparaciones son `TRUE`, pero `5 <> NULL` evalúa a `UNKNOWN`.\n\nEn la lógica booleana de tres valores, `TRUE AND TRUE AND UNKNOWN` da como resultado `UNKNOWN`. Como la cláusula `WHERE` solo conserva las filas donde el predicado es `TRUE`, todas las filas quedan descartadas y la consulta devuelve un conjunto vacío. En cambio, `NOT EXISTS` (o `ANTI JOIN`) comprueba si la subconsulta devuelve filas y siempre produce `TRUE` o `FALSE`, ignorando los `NULL` ajenos.'
    }
  ],

  workedExample: {
    title: 'Clientes sin evento de compra web: el fallo de NOT IN frente a NOT EXISTS',
    description: 'En la tabla `events` de Mercado Brisa, el 15 % de los eventos corresponden a sesiones anónimas (`customer_id IS NULL`). Compara qué ocurre al buscar clientes sin evento `checkout_completed` usando `NOT IN` frente a `NOT EXISTS`:',
    steps: [
      {
        label: 'Paso 1 — Error con NOT IN: un solo NULL en la subconsulta devuelve 0 clientes',
        explanation: 'Como `events` tiene 1 343 filas de `checkout_completed` con `customer_id IS NULL`, el predicado `c.customer_id NOT IN (...)` evalúa a `UNKNOWN` para todos los clientes y el conteo devuelve `0`.',
        code: 'SELECT\n  COUNT(*) AS clientes_encontrados\nFROM customers c\nWHERE c.customer_id NOT IN (\n  SELECT e.customer_id\n  FROM events e\n  WHERE e.event_type = \'checkout_completed\'\n);',
        expectedOutput: [
          { clientes_encontrados: 0 }
        ]
      },
      {
        label: 'Paso 2 — Solución segura con NOT EXISTS: recupera los 800 clientes reales',
        explanation: 'Con `NOT EXISTS`, la igualdad `e.customer_id = c.customer_id` descarta los `NULL` dentro de la subconsulta y devuelve los 800 clientes registrados que nunca dispararon `checkout_completed` en la web.',
        code: 'SELECT\n  c.segment,\n  COUNT(*) AS clientes_sin_checkout_event\nFROM customers c\nWHERE NOT EXISTS (\n  SELECT 1\n  FROM events e\n  WHERE e.customer_id = c.customer_id\n    AND e.event_type = \'checkout_completed\'\n)\nGROUP BY c.segment\nORDER BY clientes_sin_checkout_event DESC;',
        expectedOutput: [
          { segment: 'retail', clientes_sin_checkout_event: 327 },
          { segment: 'pro_barista', clientes_sin_checkout_event: 273 },
          { segment: 'cafeteria_b2b', clientes_sin_checkout_event: 200 }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'predict-output',
      prompt: 'En Mercado Brisa, `products` tiene 180 filas (`product_id` 1..180, sin nulos) y `events` tiene 65 000 filas donde `product_id` es `NULL` en los eventos `page_view`. ¿Cuántas filas devuelve `SELECT * FROM products WHERE product_id NOT IN (SELECT product_id FROM events)`?',
      options: [
        {
          id: 'a',
          text: '0 filas, porque la presencia de NULL en la subconsulta hace que NOT IN evalúe a UNKNOWN para todo producto.',
          correct: true,
          feedback: 'Exacto. Al existir al menos un NULL en events.product_id, la conjunción de desigualdades nunca es TRUE.'
        },
        {
          id: 'b',
          text: '1 fila (el producto de prueba product_id = 180 que no tiene eventos).',
          correct: false,
          feedback: 'Incorrecto. Para obtener esa fila debes usar NOT EXISTS, ANTI JOIN o añadir WHERE product_id IS NOT NULL dentro de la subconsulta.'
        },
        {
          id: 'c',
          text: '180 filas, porque SQL ignora automáticamente los valores NULL dentro de NOT IN.',
          correct: false,
          feedback: 'Incorrecto. SQL no ignora los NULL en NOT IN; aplica lógica trivalente donde valor <> NULL es UNKNOWN.'
        }
      ],
      explanation: 'Cuando la lista de un NOT IN contiene al menos un valor NULL, cualquier comparación contra un elemento que no está en la lista termina en TRUE AND UNKNOWN, que es UNKNOWN y se filtra en WHERE.'
    },
    {
      id: 'c2',
      type: 'mcq',
      prompt: '¿Qué requisito debe cumplir una subconsulta colocada dentro de la lista `SELECT` o a la derecha de un operador `=` o `>`?',
      options: [
        {
          id: 'a',
          text: 'Ser una subconsulta escalar: devolver como máximo una fila y una sola columna.',
          correct: true,
          feedback: 'Correcto. Si devuelve más de una columna da error de análisis, y si devuelve más de una fila falla en ejecución.'
        },
        {
          id: 'b',
          text: 'Incluir obligatoriamente una cláusula GROUP BY en su interior.',
          correct: false,
          feedback: 'Incorrecto. Puede usar funciones agregadas sin GROUP BY (como SELECT AVG(total_usd) FROM orders) o LIMIT 1.'
        },
        {
          id: 'c',
          text: 'No referenciar ninguna columna de la consulta exterior.',
          correct: false,
          feedback: 'Incorrecto. Una subconsulta escalar puede ser correlacionada siempre que devuelva a lo sumo una fila por cada fila exterior.'
        }
      ],
      explanation: 'Un operador escalar como = o > espera un único valor atómico. Por eso la subconsulta debe producir exactamente una columna y cero o una fila.'
    },
    {
      id: 'c3',
      type: 'mcq',
      prompt: 'Quieres calcular la mediana de los ingresos mensuales por tienda (primero sumas ventas por tienda y mes, y luego calculas la mediana por tienda). ¿Qué tipo de subconsulta resuelve el primer paso?',
      options: [
        {
          id: 'a',
          text: 'Una subconsulta de tabla (tabla derivada) en la cláusula FROM o una CTE previa.',
          correct: true,
          feedback: 'Correcto. La tabla derivada agrupa al grano tienda + mes y la consulta exterior calcula la mediana por tienda.'
        },
        {
          id: 'b',
          text: 'Una subconsulta con EXISTS dentro de la cláusula WHERE.',
          correct: false,
          feedback: 'Incorrecto. EXISTS solo devuelve un valor booleano de presencia; no entrega las sumas mensuales para agregarlas después.'
        },
        {
          id: 'c',
          text: 'Anidar directamente MEDIAN(SUM(total_usd)) en un único SELECT.',
          correct: false,
          feedback: 'Incorrecto. SQL no permite anidar dos funciones de agregación en el mismo nivel de agrupación.'
        }
      ],
      explanation: 'Para encadenar dos agregaciones con distinto grano necesitas dos etapas: una subconsulta de tabla en FROM (o CTE) que agrupe por tienda y mes, y una consulta exterior que agregue por tienda.'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Categorías por encima del precio medio global con subconsulta escalar',
    language: 'sql',
    prompt: 'En la tabla `products` de Mercado Brisa, filtra los productos activos (`is_active = true`), agrupa por `category` y conserva con `HAVING` solo las categorías cuyo `AVG(list_price_usd)` sea estrictamente mayor que el precio de lista promedio global de todos los productos activos. Devuelve `category`, `total_productos` (`COUNT(*)`), `precio_promedio_usd` (`ROUND(AVG(list_price_usd), 2)`) y `promedio_global_usd` (subconsulta escalar redondeada a 2 decimales), ordenando por `precio_promedio_usd DESC`.',
    starterCode: 'SELECT\n  p.category,\n  COUNT(*) AS total_productos,\n  ROUND(AVG(p.list_price_usd), 2) AS precio_promedio_usd,\n  ROUND((SELECT AVG(list_price_usd) FROM products WHERE is_active = true), 2) AS promedio_global_usd\nFROM products p\nWHERE p.is_active = true\nGROUP BY p.category\n-- TODO: Añade HAVING para conservar solo las categorías con AVG(p.list_price_usd) mayor al promedio global activo\nORDER BY precio_promedio_usd DESC;',
    expected: 'SELECT\n  p.category,\n  COUNT(*) AS total_productos,\n  ROUND(AVG(p.list_price_usd), 2) AS precio_promedio_usd,\n  ROUND((SELECT AVG(list_price_usd) FROM products WHERE is_active = true), 2) AS promedio_global_usd\nFROM products p\nWHERE p.is_active = true\nGROUP BY p.category\nHAVING AVG(p.list_price_usd) > (\n  SELECT AVG(list_price_usd)\n  FROM products\n  WHERE is_active = true\n)\nORDER BY precio_promedio_usd DESC;',
    orderMatters: true,
    hints: [
      'El filtro debe aplicarse sobre el promedio de cada categoría después de GROUP BY, por lo que va en la cláusula HAVING.',
      'Dentro de HAVING compara AVG(p.list_price_usd) > (SELECT AVG(list_price_usd) FROM products WHERE is_active = true).',
      'No olvides incluir WHERE is_active = true también dentro de la subconsulta del HAVING para que excluya el SKU inactivo de prueba.'
    ],
    solution: 'SELECT\n  p.category,\n  COUNT(*) AS total_productos,\n  ROUND(AVG(p.list_price_usd), 2) AS precio_promedio_usd,\n  ROUND((SELECT AVG(list_price_usd) FROM products WHERE is_active = true), 2) AS promedio_global_usd\nFROM products p\nWHERE p.is_active = true\nGROUP BY p.category\nHAVING AVG(p.list_price_usd) > (\n  SELECT AVG(list_price_usd)\n  FROM products\n  WHERE is_active = true\n)\nORDER BY precio_promedio_usd DESC;',
    solutionExplanation: 'La subconsulta escalar calcula el precio medio de los productos activos ($77.51 USD) y la cláusula HAVING filtra únicamente las dos categorías de equipamiento cuyo promedio supera ese umbral (`Molinos` con $152.83 y `Cafeteras` con $116.48).',
    expectedOutputTable: [
      { category: 'Molinos', total_productos: 34, precio_promedio_usd: 152.83, promedio_global_usd: 77.51 },
      { category: 'Cafeteras', total_productos: 34, precio_promedio_usd: 116.48, promedio_global_usd: 77.51 }
    ]
  },

  roleNotes: {
    de: 'En motores analíticos como DuckDB o Spark SQL, evita usar NOT IN con subconsultas sobre tablas crudas donde puedan entrar nulos; usa siempre ANTI JOIN o NOT EXISTS en las reglas de validación.',
    da: 'Las subconsultas escalares son útiles para calcular proporciones rápidas sobre el total o filtrar grupos en HAVING sin alterar el grano de la consulta principal.',
    bi: 'Cuando una vista o tabla derivada en FROM crece más allá de un nivel de anidamiento, conviértela en una CTE con WITH para que otros analistas puedan auditar el cálculo de la métrica.'
  },

  summary: [
    'Una subconsulta escalar devuelve a lo sumo 1 fila y 1 columna y actúa como un valor constante.',
    'Las tablas derivadas en FROM permiten encadenar dos agregaciones sucesivas con distinto grano.',
    'NOT IN devuelve cero filas si la subconsulta contiene al menos un valor NULL.',
    'Prefiere siempre NOT EXISTS o ANTI JOIN frente a NOT IN para comprobar ausencias con seguridad.'
  ],

  flashcards: [
    {
      id: 'fc-c1-joins-03-a',
      front: '¿Por qué `WHERE id NOT IN (SELECT id FROM tabla)` devuelve 0 filas si `tabla.id` tiene un solo `NULL`?',
      back: 'Porque `id <> NULL` evalúa a `UNKNOWN`, y en una cadena de `AND` cualquier `UNKNOWN` impide que el `WHERE` sea `TRUE`.'
    },
    {
      id: 'fc-c1-joins-03-b',
      front: '¿Qué es una subconsulta escalar y qué pasa si devuelve 2 filas?',
      back: 'Es una subconsulta que devuelve como máximo 1 fila y 1 columna; si devuelve más de 1 fila, el motor lanza un error en tiempo de ejecución.'
    },
    {
      id: 'fc-c1-joins-03-c',
      front: '¿Cuándo necesitas una subconsulta de tabla en `FROM` (tabla derivada)?',
      back: 'Cuando necesitas agregar en dos etapas con distinto grano, como calcular el promedio por segmento del gasto total acumulado por cliente.'
    }
  ],

  glossaryTerms: [
    'c1-joins-subconsulta-escalar',
    'c1-joins-semi-anti'
  ],

  sources: [
    {
      title: 'DuckDB SQL Reference — Subqueries (Scalar, EXISTS, IN and Decorrelation)',
      url: 'https://duckdb.org/docs/sql/expressions/subqueries.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Tipos de subconsultas soportadas en DuckDB y descorrelación automática de subconsultas correlacionadas.'
    },
    {
      title: 'PostgreSQL 17 Documentation — Section 9.24: Subquery Expressions (IN / NOT IN / EXISTS)',
      url: 'https://www.postgresql.org/docs/current/functions-subquery.html',
      publisher: 'PostgreSQL Global Development Group',
      accessed: '2026-10-29',
      supports: 'Explicación oficial del comportamiento de NOT IN ante valores NULL bajo lógica trivalente.'
    },
    {
      title: 'PostgreSQL 17 Documentation — Section 4.2.11: Scalar Subqueries',
      url: 'https://www.postgresql.org/docs/current/sql-expressions.html#SQL-SYNTAX-SCALAR-SUBQUERIES',
      publisher: 'PostgreSQL Global Development Group',
      accessed: '2026-10-29',
      supports: 'Restricción de cardinalidad (máximo una fila y una columna) y retorno de NULL cuando la subconsulta escalar es vacía.'
    }
  ],

  aiNotes: 'Las dos dudas principales son por qué NOT IN devuelve 0 filas cuando hay un NULL en la subconsulta y por qué no se puede escribir AVG(SUM(x)) sin una tabla derivada. Usa el ejemplo de `5 <> NULL` -> `UNKNOWN` para explicar NOT IN.'
};

export default lesson;
