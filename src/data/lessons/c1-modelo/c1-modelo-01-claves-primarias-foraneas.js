const lesson = {
  id: 'c1-modelo-01-claves-primarias-foraneas',
  moduleId: 'c1-modelo',
  tracks: ['core'],
  level: 1,
  order: 1,
  title: 'Claves primarias, naturales, subrogadas y foráneas',
  minutes: 20,
  prerequisites: ['c1-sql-joins-05'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), el equipo comercial propuso usar el correo electrónico (`email`) como identificador de la tabla `customers` y el código `sku` para unir `products` con `order_items`. Tres meses después, veinte clientes cambiaron su correo en la aplicación y un proveedor renombró diez códigos `sku`, dejando cientos de líneas de venta desconectadas de su catálogo. ¿Cómo eliges identificadores que mantengan las relaciones intactas aunque cambien los atributos del negocio?',

  objectives: [
    'Distinguir entre clave primaria, clave natural, clave subrogada y clave compuesta sobre tablas relacionales.',
    'Verificar con SQL qué columnas cumplen unicidad y ausencia de nulos para actuar como clave primaria.',
    'Explicar cómo las claves foráneas conectan tablas hijas con tablas padre y por qué se repiten en relaciones uno a muchos.',
  ],

  sections: [
    {
      id: 'identidad-de-fila-y-clave-primaria',
      heading: 'Qué exige una clave primaria y cómo se relaciona con el grano',
      body: 'En el modelo relacional formulado por Edgar F. Codd, una tabla es un conjunto de tuplas donde no pueden existir dos filas idénticas. La **clave primaria** (`PRIMARY KEY`) es la columna, o combinación mínima de columnas, que identifica de forma única cada fila física de la tabla.\n\nPara que una columna sea clave primaria debe cumplir dos condiciones simultáneas en todo momento: **unicidad** (`UNIQUE`, ningún valor se repite) y **obligatoriedad** (`NOT NULL`, ninguna fila tiene valor desconocido). En una base transaccional como PostgreSQL, declarar `PRIMARY KEY` crea un índice único automático. El motor rechaza cualquier `INSERT` o `UPDATE` que intente duplicar o anular ese campo.\n\nEn cambio, cuando trabajas sobre archivos Parquet en un lago de datos, los archivos no siempre traen restricciones activas. Por eso debes verificar la clave primaria con SQL. Basta con comparar `COUNT(*)` frente a `COUNT(DISTINCT columna)` y contar cuántos nulos existen.',
    },
    {
      id: 'claves-naturales-frente-a-subrogadas',
      heading: 'Claves naturales de negocio frente a claves subrogadas',
      body: 'Una **clave natural** es un identificador que ya existe en la operación fuera de la base de datos: el código `sku` de un producto (`MB-CAF-041`), el código `store_code` de una tienda (`STR-MX-01`) o el `email` de un cliente. Aunque resultan legibles para las personas, las claves naturales sufren tres problemas técnicos. Pueden cambiar con el tiempo, dependen de sistemas externos y ocupan más bytes como texto (`VARCHAR`) al cruzar millones de filas.\n\nPor el contrario, una **clave subrogada** (*surrogate key*) es un número entero secuencial (`INTEGER` o `BIGINT`) asignado internamente por el sistema sin significado comercial, como `product_id = 41` o `customer_id = 1`. Si el cliente cambia de correo electrónico, su `customer_id` permanece intacto.\n\nLa diferencia se vuelve indispensable cuando guardas historial. En la tabla `customer_changes` de Mercado Brisa (4 100 filas para 2 400 clientes), un mismo `customer_id` aparece hasta tres veces porque cambió de nivel o segmento. Allí `customer_id` deja de ser único. Necesitamos entonces la clave subrogada `change_id` para identificar cada versión histórica.',
      example: {
        language: 'sql',
        code: `SELECT
  'products' AS tabla,
  COUNT(*) AS total_filas,
  COUNT(DISTINCT product_id) AS pk_subrogada_unica,
  COUNT(DISTINCT sku) AS clave_natural_unica
FROM products
UNION ALL
SELECT
  'customer_changes' AS tabla,
  COUNT(*) AS total_filas,
  COUNT(DISTINCT change_id) AS pk_subrogada_unica,
  COUNT(DISTINCT customer_id) AS clave_natural_unica
FROM customer_changes;`,
        expectedOutput: [
          {
            tabla: 'products',
            total_filas: 180,
            pk_subrogada_unica: 180,
            clave_natural_unica: 180,
          },
          {
            tabla: 'customer_changes',
            total_filas: 4100,
            pk_subrogada_unica: 4100,
            clave_natural_unica: 2400,
          },
        ],
      },
    },
    {
      id: 'claves-compuestas-en-tablas-detalle',
      heading: 'Cuándo usar una clave primaria compuesta en tablas de detalle',
      body: 'No todas las tablas identifican sus filas con una sola columna. Una **clave compuesta** combina dos o más columnas que, juntas, garantizan unicidad. En la tabla `order_items` de Mercado Brisa (42 000 filas), ni `order_id` ni `line_number` son únicos por separado: `order_id` se repite hasta cuatro veces en un pedido con cuatro productos, y `line_number = 1` aparece en los 18 000 pedidos.\n\nSin embargo, el par `(order_id, line_number)` identifica exactamente una línea dentro de un pedido específico. Además, la tabla incluye la clave subrogada simple `order_item_id` (del 1 al 42 000) para simplificar referencias desde otras tablas.\n\nOtro caso clásico es `marketing_spend` (730 filas), donde no existe una columna `spend_id`: el grano es un día y un canal publicitario, por lo que la clave primaria es la combinación compuesta `(spend_date, channel)`.',
    },
    {
      id: 'claves-foraneas-y-cardinalidad',
      heading: 'Claves foráneas: el puente entre tablas padre e hijas',
      body: 'Una **clave foránea** (`FOREIGN KEY`) es una columna en una tabla hija cuyos valores apuntan a la clave primaria de una tabla padre. En `orders`, las columnas `customer_id` y `store_id` son claves foráneas que apuntan a `customers.customer_id` y `stores.store_id`.\n\nEs habitual confundir el comportamiento de una clave primaria con el de una clave foránea. En `customers` (tabla padre), `customer_id` tiene 2 400 valores únicos en 2 400 filas. En `orders` (tabla hija), `customer_id` también tiene 2 400 valores distintos, pero distribuidos en 18 000 filas: se repite 15 600 veces porque cada cliente realiza varios pedidos a lo largo del tiempo.\n\nDel mismo modo, en `payments` (19 200 filas), `payment_id` es la clave primaria subrogada de cada registro, `order_id` es la clave foránea hacia el pedido y `idempotency_key` es la clave natural de cada intento de cobro emitida por la pasarela de pagos.',
    },
  ],

  workedExample: {
    title: 'Auditoría de claves subrogadas, compuestas y naturales en Mercado Brisa',
    description:
      'Comprueba con SQL por qué una clave natural se repite cuando existen versiones históricas y cómo validar una clave compuesta en tablas de detalle.',
    steps: [
      {
        label: 'Paso 1: Inspeccionar por qué customer_id no es clave primaria en customer_changes',
        explanation:
          'Si intentas usar `customer_id` como clave primaria en `customer_changes`, fallará porque los clientes del 1 al 400 tienen 3 versiones históricas cada uno. La columna `change_id` actúa como clave primaria subrogada de cada versión.',
        code: `SELECT
  customer_id,
  COUNT(*) AS versiones_historicas,
  MIN(change_id) AS primer_change_id,
  MAX(change_id) AS ultimo_change_id
FROM customer_changes
GROUP BY customer_id
HAVING COUNT(*) > 1
ORDER BY versiones_historicas DESC, customer_id ASC
LIMIT 5;`,
        expectedOutput: [
          {
            customer_id: 1,
            versiones_historicas: 3,
            primer_change_id: 1,
            ultimo_change_id: 3,
          },
          {
            customer_id: 2,
            versiones_historicas: 3,
            primer_change_id: 4,
            ultimo_change_id: 6,
          },
          {
            customer_id: 3,
            versiones_historicas: 3,
            primer_change_id: 7,
            ultimo_change_id: 9,
          },
          {
            customer_id: 4,
            versiones_historicas: 3,
            primer_change_id: 10,
            ultimo_change_id: 12,
          },
          {
            customer_id: 5,
            versiones_historicas: 3,
            primer_change_id: 13,
            ultimo_change_id: 15,
          },
        ],
      },
      {
        label: 'Paso 2: Verificar la equivalencia entre clave subrogada y clave compuesta en order_items',
        explanation:
          'En `order_items`, comprobamos que tanto la clave subrogada `order_item_id` como la clave compuesta `(order_id, line_number)` tienen exactamente 42 000 valores únicos y cero valores nulos.',
        code: `SELECT
  COUNT(*) AS total_lineas,
  COUNT(DISTINCT order_item_id) AS pk_subrogada_unica,
  COUNT(DISTINCT (order_id, line_number)) AS pk_compuesta_unica,
  COUNT(*) FILTER (WHERE order_item_id IS NULL OR order_id IS NULL) AS claves_nulas
FROM order_items;`,
        expectedOutput: [
          {
            total_lineas: 42000,
            pk_subrogada_unica: 42000,
            pk_compuesta_unica: 42000,
            claves_nulas: 0,
          },
        ],
      },
    ],
  },

  checks: [
    {
      id: 'c1-modelo-01-chk1',
      type: 'mcq',
      prompt:
        'En la tabla `customer_changes` (4 100 filas que guardan el historial de segmentos de 2 400 clientes), ¿qué rol cumple la columna `customer_id` frente a `change_id`?',
      options: [
        {
          id: 'a',
          text: '`change_id` es la clave primaria subrogada de cada versión y `customer_id` es la clave del cliente que se repite entre versiones.',
          correct: true,
          feedback:
            'Correcto. Como un cliente puede tener hasta tres versiones históricas, `customer_id` se repite y `change_id` identifica de forma única cada una de las 4 100 filas.',
        },
        {
          id: 'b',
          text: '`customer_id` es la clave primaria porque nunca es nula, y `change_id` es un atributo descriptivo opcional.',
          correct: false,
          feedback:
            'Incorrecto. No tener nulos no basta para ser clave primaria: también debe ser única, y `customer_id` tiene 2 400 valores distintos en 4 100 filas.',
        },
        {
          id: 'c',
          text: 'Ambas columnas son claves primarias simples e independientes dentro de la misma tabla.',
          correct: false,
          feedback:
            'Incorrecto. Una tabla relacional solo puede tener una clave primaria (simple o compuesta), y `customer_id` por sí sola no cumple unicidad en `customer_changes`.',
        },
      ],
      explanation:
        'Cuando una tabla almacena múltiples versiones históricas de una entidad, el identificador del cliente se repite en cada cambio y se requiere una clave subrogada (`change_id`) para identificar cada fila.',
    },
    {
      id: 'c1-modelo-01-chk2',
      type: 'predict-output',
      prompt:
        'En Mercado Brisa, `orders` tiene 18 000 filas (una por pedido) realizadas por 2 400 clientes distintos. Si ejecutas `SELECT COUNT(*) - COUNT(DISTINCT customer_id) FROM orders;`, ¿qué número devuelve?',
      options: [
        {
          id: 'a',
          text: '15 600, porque `customer_id` actúa como clave foránea en `orders` y se repite en pedidos sucesivos del mismo cliente.',
          correct: true,
          feedback:
            'Exacto. 18 000 pedidos menos 2 400 clientes únicos da 15 600 repeticiones legítimas de la clave foránea en el lado "muchos" de la relación 1:N.',
        },
        {
          id: 'b',
          text: '0, porque todas las columnas terminadas en `_id` son únicas dentro de cualquier tabla.',
          correct: false,
          feedback:
            'Incorrecto. Una columna `_id` solo es única si es la clave primaria de esa tabla (`order_id` en `orders`); cuando es clave foránea (`customer_id`), se repite.',
        },
        {
          id: 'c',
          text: '2 400, porque SQL resta las filas de `customers` menos los valores nulos.',
          correct: false,
          feedback:
            'Incorrecto. `COUNT(*)` cuenta las 18 000 filas de `orders` y `COUNT(DISTINCT customer_id)` cuenta los 2 400 clientes únicos presentes en `orders`.',
        },
      ],
      explanation:
        'En una relación uno a muchos (`customers` 1:N `orders`), la clave primaria del padre pasa como clave foránea a la tabla hija y se repite cada vez que el cliente compra.',
    },
    {
      id: 'c1-modelo-01-chk3',
      type: 'fill-code',
      prompt:
        'Completa la consulta para verificar que la clave primaria `order_id` en `orders` no tiene duplicados ni valores nulos:',
      template: `SELECT
  COUNT(*) = COUNT({{b1}} order_id) AS sin_duplicados,
  COUNT(*) FILTER (WHERE order_id IS {{b2}}) AS total_nulos
FROM orders;`,
      blanks: [
        { id: 'b1', accepted: ['DISTINCT', 'distinct'] },
        { id: 'b2', accepted: ['NULL', 'null'] },
      ],
      explanation:
        'Una clave primaria exige que `COUNT(*)` coincida con `COUNT(DISTINCT pk)` (cero duplicados) y que el conteo de filas donde `pk IS NULL` sea exactamente cero.',
    },
  ],

  practice: {
    type: 'sql',
    title: 'Auditoría comparativa de claves subrogadas y de negocio',
    language: 'sql',
    prompt:
      'Construye una consulta con `UNION ALL` que audite cinco tablas de Mercado Brisa (`customers`, `customer_changes`, `products`, `orders` y `payments`). Para cada una devuelve: `tabla`, `total_filas`, `pk_unicos` (valores distintos de su clave primaria subrogada: `customer_id`, `change_id`, `product_id`, `order_id`, `payment_id`), `clave_negocio_unicos` (valores distintos de `email`, `customer_id`, `sku`, `customer_id`, `idempotency_key` respectivamente) y `repeticiones_negocio` (`total_filas - clave_negocio_unicos`). Ordena por `repeticiones_negocio DESC, tabla ASC`.',
    starterCode: `SELECT
  'customers' AS tabla,
  COUNT(*) AS total_filas,
  COUNT(DISTINCT customer_id) AS pk_unicos,
  COUNT(DISTINCT email) AS clave_negocio_unicos,
  COUNT(*) - COUNT(DISTINCT email) AS repeticiones_negocio
FROM customers
UNION ALL
SELECT
  'customer_changes' AS tabla,
  COUNT(*) AS total_filas,
  COUNT(DISTINCT change_id) AS pk_unicos,
  COUNT(DISTINCT customer_id) AS clave_negocio_unicos,
  COUNT(*) - COUNT(DISTINCT customer_id) AS repeticiones_negocio
FROM customer_changes
UNION ALL
SELECT
  'products' AS tabla,
  COUNT(*) AS total_filas,
  COUNT(DISTINCT product_id) AS pk_unicos,
  COUNT(DISTINCT sku) AS clave_negocio_unicos,
  COUNT(*) - COUNT(DISTINCT sku) AS repeticiones_negocio
FROM products
UNION ALL
SELECT
  'orders' AS tabla,
  COUNT(*) AS total_filas,
  COUNT(DISTINCT order_id) AS pk_unicos,
  COUNT(DISTINCT customer_id) AS clave_negocio_unicos,
  -- Corrige el cálculo de repeticiones de customer_id en orders y añade el bloque UNION ALL de payments
  0 AS repeticiones_negocio
FROM orders
ORDER BY repeticiones_negocio DESC, tabla ASC;`,
    expected: `SELECT
  'customers' AS tabla,
  COUNT(*) AS total_filas,
  COUNT(DISTINCT customer_id) AS pk_unicos,
  COUNT(DISTINCT email) AS clave_negocio_unicos,
  COUNT(*) - COUNT(DISTINCT email) AS repeticiones_negocio
FROM customers
UNION ALL
SELECT
  'customer_changes' AS tabla,
  COUNT(*) AS total_filas,
  COUNT(DISTINCT change_id) AS pk_unicos,
  COUNT(DISTINCT customer_id) AS clave_negocio_unicos,
  COUNT(*) - COUNT(DISTINCT customer_id) AS repeticiones_negocio
FROM customer_changes
UNION ALL
SELECT
  'products' AS tabla,
  COUNT(*) AS total_filas,
  COUNT(DISTINCT product_id) AS pk_unicos,
  COUNT(DISTINCT sku) AS clave_negocio_unicos,
  COUNT(*) - COUNT(DISTINCT sku) AS repeticiones_negocio
FROM products
UNION ALL
SELECT
  'orders' AS tabla,
  COUNT(*) AS total_filas,
  COUNT(DISTINCT order_id) AS pk_unicos,
  COUNT(DISTINCT customer_id) AS clave_negocio_unicos,
  COUNT(*) - COUNT(DISTINCT customer_id) AS repeticiones_negocio
FROM orders
UNION ALL
SELECT
  'payments' AS tabla,
  COUNT(*) AS total_filas,
  COUNT(DISTINCT payment_id) AS pk_unicos,
  COUNT(DISTINCT idempotency_key) AS clave_negocio_unicos,
  COUNT(*) - COUNT(DISTINCT idempotency_key) AS repeticiones_negocio
FROM payments
ORDER BY repeticiones_negocio DESC, tabla ASC;`,
    orderMatters: true,
    hints: [
      'En el cuarto bloque (`orders`), reemplaza `0 AS repeticiones_negocio` por `COUNT(*) - COUNT(DISTINCT customer_id) AS repeticiones_negocio`.',
      'Añade un quinto bloque `UNION ALL` para la tabla `payments` usando `payment_id` como `pk_unicos` e `idempotency_key` como `clave_negocio_unicos`.',
      'Verifica que el `ORDER BY repeticiones_negocio DESC, tabla ASC` quede al final de toda la cadena de `UNION ALL`.',
    ],
    solution: `SELECT
  'customers' AS tabla,
  COUNT(*) AS total_filas,
  COUNT(DISTINCT customer_id) AS pk_unicos,
  COUNT(DISTINCT email) AS clave_negocio_unicos,
  COUNT(*) - COUNT(DISTINCT email) AS repeticiones_negocio
FROM customers
UNION ALL
SELECT
  'customer_changes' AS tabla,
  COUNT(*) AS total_filas,
  COUNT(DISTINCT change_id) AS pk_unicos,
  COUNT(DISTINCT customer_id) AS clave_negocio_unicos,
  COUNT(*) - COUNT(DISTINCT customer_id) AS repeticiones_negocio
FROM customer_changes
UNION ALL
SELECT
  'products' AS tabla,
  COUNT(*) AS total_filas,
  COUNT(DISTINCT product_id) AS pk_unicos,
  COUNT(DISTINCT sku) AS clave_negocio_unicos,
  COUNT(*) - COUNT(DISTINCT sku) AS repeticiones_negocio
FROM products
UNION ALL
SELECT
  'orders' AS tabla,
  COUNT(*) AS total_filas,
  COUNT(DISTINCT order_id) AS pk_unicos,
  COUNT(DISTINCT customer_id) AS clave_negocio_unicos,
  COUNT(*) - COUNT(DISTINCT customer_id) AS repeticiones_negocio
FROM orders
UNION ALL
SELECT
  'payments' AS tabla,
  COUNT(*) AS total_filas,
  COUNT(DISTINCT payment_id) AS pk_unicos,
  COUNT(DISTINCT idempotency_key) AS clave_negocio_unicos,
  COUNT(*) - COUNT(DISTINCT idempotency_key) AS repeticiones_negocio
FROM payments
ORDER BY repeticiones_negocio DESC, tabla ASC;`,
    solutionExplanation:
      'El resultado muestra tres comportamientos distintos: en `customers` y `products` la clave natural (`email`, `sku`) es única (0 repeticiones); en `orders` y `customer_changes` el identificador `customer_id` se repite legítimamente (15 600 veces por compras múltiples y 1 700 veces por versiones históricas); y en `payments` las 450 repeticiones de `idempotency_key` revelan un error de webhooks duplicados.',
    expectedOutputTable: [
      {
        tabla: 'orders',
        total_filas: 18000,
        pk_unicos: 18000,
        clave_negocio_unicos: 2400,
        repeticiones_negocio: 15600,
      },
      {
        tabla: 'customer_changes',
        total_filas: 4100,
        pk_unicos: 4100,
        clave_negocio_unicos: 2400,
        repeticiones_negocio: 1700,
      },
      {
        tabla: 'payments',
        total_filas: 19200,
        pk_unicos: 19200,
        clave_negocio_unicos: 18750,
        repeticiones_negocio: 450,
      },
      {
        tabla: 'customers',
        total_filas: 2400,
        pk_unicos: 2400,
        clave_negocio_unicos: 2400,
        repeticiones_negocio: 0,
      },
      {
        tabla: 'products',
        total_filas: 180,
        pk_unicos: 180,
        clave_negocio_unicos: 180,
        repeticiones_negocio: 0,
      },
    ],
  },

  roleNotes: {
    de: 'Genera claves subrogadas enteras (`INTEGER` o `BIGINT`) o hashes deterministas en tus tablas Silver para desacoplar el almacén de cambios en los sistemas operativos. Declara siempre pruebas automáticas `unique` y `not_null` sobre cada clave primaria en dbt o SQLMesh.',
    da: 'Antes de cruzar una tabla desconocida, ejecuta `COUNT(*)` frente a `COUNT(DISTINCT id)` para saber si el identificador es la clave primaria de la tabla o una clave foránea que se repite y provocará fan-out en tus sumas.',
    bi: 'En el modelo semántico de Power BI, MetricFlow o Cube, conecta las dimensiones con las tablas de hechos usando siempre las claves subrogadas enteras (`product_id`, `store_id`) en lugar de columnas de texto como nombres o códigos SKU.',
  },

  summary: [
    'Una clave primaria exige unicidad absoluta y cero valores nulos en toda la tabla.',
    'La clave natural viene del negocio (`sku`, `email`); la clave subrogada la asigna el sistema (`product_id`).',
    'En tablas con historial como `customer_changes`, la clave natural se repite y requiere una clave subrogada (`change_id`).',
    'Una clave foránea conecta una tabla hija con la clave primaria de su tabla padre y se repite en relaciones 1:N.',
  ],

  flashcards: [
    {
      id: 'fc-c1-modelo-01-a',
      front: '¿Qué dos propiedades simultáneas debe cumplir toda clave primaria en SQL?',
      back: 'Unicidad (`UNIQUE`, ningún valor repetido) y obligatoriedad (`NOT NULL`, ningún valor nulo).',
    },
    {
      id: 'fc-c1-modelo-01-b',
      front: '¿Por qué se prefiere una clave subrogada (`product_id`) sobre una clave natural (`sku`) para unir tablas?',
      back: 'Porque la clave subrogada es un entero inmutable y compacto, mientras la clave natural puede cambiar en el negocio o repetirse si se guarda historial.',
    },
    {
      id: 'fc-c1-modelo-01-c',
      front: '¿Cómo distingues con SQL si `customer_id` es clave primaria o clave foránea en `orders`?',
      back: 'Comparando `COUNT(*)` (18 000 pedidos) con `COUNT(DISTINCT customer_id)` (2 400 clientes): al repetirse, actúa como clave foránea del lado "muchos".',
    },
  ],

  glossaryTerms: ['clave-primaria-subrogada', 'clave-foranea', 'c01-grain-fanout'],

  sources: [
    {
      title: 'E. F. Codd (1970) — A Relational Model of Data for Large Shared Data Banks',
      url: 'https://www.seas.upenn.edu/~zives/03f/cis550/codd.pdf',
      publisher: 'Communications of the ACM',
      accessed: '2026-10-29',
      supports:
        'Definición formal de clave primaria no redundante para identificar tuplas y de claves foráneas para referenciar relaciones.',
    },
    {
      title: 'PostgreSQL 17 Documentation — Section 5.4: Constraints (Primary Keys, Unique Constraints, and Foreign Keys)',
      url: 'https://www.postgresql.org/docs/current/ddl-constraints.html',
      publisher: 'PostgreSQL Global Development Group',
      accessed: '2026-10-29',
      supports:
        'Equivalencia técnica de PRIMARY KEY con UNIQUE + NOT NULL y comportamiento de claves compuestas y foráneas.',
    },
    {
      title: 'DuckDB Documentation — Constraints (PRIMARY KEY, UNIQUE, NOT NULL, FOREIGN KEY)',
      url: 'https://duckdb.org/docs/sql/constraints.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports:
        'Definición y validación de restricciones de clave primaria y foránea en tablas analíticas de DuckDB.',
    },
    {
      title: 'Kimball Group — Dimensional Modeling Techniques: Surrogate Keys',
      url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/surrogate-key/',
      publisher: 'Kimball Group',
      accessed: '2026-10-29',
      supports:
        'Uso de claves subrogadas enteras para aislar el modelo de datos frente a cambios en las claves naturales del negocio.',
    },
  ],

  aiNotes:
    'La persona suele pensar que cualquier columna llamada `*_id` es clave primaria de la tabla donde aparece, o que `UNIQUE` impide valores `NULL` (en SQL estándar `UNIQUE` permite múltiples `NULL` salvo `PRIMARY KEY` o `NULLS NOT DISTINCT`). Guíala a verificar siempre `COUNT(*)` vs `COUNT(DISTINCT col)` y el conteo de nulos.',
};

export default lesson;
