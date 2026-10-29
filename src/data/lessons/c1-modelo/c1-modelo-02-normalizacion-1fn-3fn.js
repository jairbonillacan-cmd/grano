const lesson = {
  id: 'c1-modelo-02-normalizacion-1fn-3fn',
  moduleId: 'c1-modelo',
  tracks: ['core'],
  level: 1,
  order: 2,
  title: 'Normalización de 1FN a 3FN: evitar anomalías al actualizar',
  minutes: 25,
  prerequisites: ['c1-modelo-01-claves-primarias-foraneas'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), una primera versión de la base de datos guardaba el nombre de la tienda (`store_name`) y su región (`region`) directamente dentro de cada fila de `orders`. Cuando la tienda `Tienda Palermo Soho` (`store_id = 8`) corrigió su nombre comercial, un script actualizó solo 3 000 de sus 3 429 pedidos históricos y dejó dos nombres distintos para la misma tienda en los reportes. ¿Cómo estructuras las tablas para que cada dato maestro se escriba y actualice en un único lugar?',

  objectives: [
    'Identificar las anomalías de inserción, actualización y borrado que ocurren al mezclar entidades en una sola tabla.',
    'Aplicar las reglas de Primera (1FN), Segunda (2FN) y Tercera Forma Normal (3FN) mediante dependencias funcionales.',
    'Distinguir cuándo un atributo debe vivir normalizado en una tabla maestra y cuándo debe congelarse en la transacción.',
  ],

  sections: [
    {
      id: 'redundancia-y-tres-anomalias',
      heading: 'Por qué repetir datos maestros provoca tres tipos de anomalías',
      body: 'Cuando guardas atributos de una tienda, de un cliente y de un pedido mezclados en la misma tabla transaccional, introduces **redundancia**. El mismo hecho del mundo real se escribe miles de veces. Edgar F. Codd demostró que esa redundancia causa tres fallos operativos conocidos como **anomalías de modificación**.\n\nLa **anomalía de actualización** (*update anomaly*) ocurre cuando cambias un atributo repetido, como el nombre o la meta mensual de una tienda. Si el proceso falla a mitad de camino, algunas filas quedan con el valor antiguo y otras con el nuevo. La **anomalía de inserción** (*insertion anomaly*) impide registrar una tienda nueva como `Almacén Logístico Coslada` hasta que no reciba su primer pedido, porque la clave primaria exige un `order_id`.\n\nPor último, la **anomalía de borrado** (*deletion anomaly*) sucede cuando eliminas el único pedido de un cliente o producto. Sin querer, pierdes también los datos de contacto del cliente o la descripción del producto. Normalizar consiste en separar cada entidad en su propia tabla para que cada atributo dependa únicamente de su clave primaria.',
    },
    {
      id: 'primera-y-segunda-forma-normal',
      heading: 'Primera Forma Normal (1FN) y Segunda Forma Normal (2FN)',
      body: 'Una tabla cumple la **Primera Forma Normal (1FN)** cuando cada celda contiene un único valor atómico y no existen grupos repetitivos de columnas. Si en `orders` guardaras una cadena `' +
        '`"MB-CAF-041, MB-MOL-012"`' +
        ' dentro de una columna `productos_comprados`, o crearas columnas `item_1`, `item_2`, `item_3`, violarías 1FN: no podrías sumar cantidades por producto ni validar claves foráneas sin partir cadenas. En Mercado Brisa, 1FN se cumple separando las líneas en la tabla `order_items`.\n\nLa **Segunda Forma Normal (2FN)** exige estar en 1FN y que ninguna columna dependa solo de una parte de una clave primaria compuesta (**dependencia parcial**). En `order_items`, la clave compuesta natural es `(order_id, line_number)` o `(order_id, product_id)`. La cantidad `qty` depende de ambos: qué pedido es y qué producto lleva.\n\nEn cambio, la categoría del producto (`category`) o su marca (`brand`) dependen exclusivamente de `product_id`, sin importar en qué pedido se vendió. Guardar `category` dentro de `order_items` violaría 2FN y repetiría 237 veces los datos de cada producto popular.',
      example: {
        language: 'sql',
        code: `SELECT
  p.product_id,
  p.sku,
  p.category,
  p.list_price_usd,
  COUNT(oi.order_item_id) AS filas_repetidas_en_items
FROM products p
JOIN order_items oi ON p.product_id = oi.product_id
GROUP BY p.product_id, p.sku, p.category, p.list_price_usd
ORDER BY filas_repetidas_en_items DESC, p.product_id ASC
LIMIT 5;`,
        expectedOutput: [
          {
            product_id: 12,
            sku: 'MB-MOL-012',
            category: 'Molinos',
            list_price_usd: 91.54,
            filas_repetidas_en_items: 237,
          },
          {
            product_id: 41,
            sku: 'MB-CAF-041',
            category: 'Café en grano',
            list_price_usd: 15.25,
            filas_repetidas_en_items: 237,
          },
          {
            product_id: 59,
            sku: 'MB-ACC-059',
            category: 'Accesorios',
            list_price_usd: 58.67,
            filas_repetidas_en_items: 237,
          },
          {
            product_id: 125,
            sku: 'MB-SUS-125',
            category: 'Suscripciones',
            list_price_usd: 41.41,
            filas_repetidas_en_items: 237,
          },
          {
            product_id: 172,
            sku: 'MB-MOL-172',
            category: 'Molinos',
            list_price_usd: 223.71,
            filas_repetidas_en_items: 237,
          },
        ],
      },
    },
    {
      id: 'tercera-forma-normal-dependencia-transitiva',
      heading: 'Tercera Forma Normal (3FN): eliminar dependencias transitivas',
      body: 'Una tabla está en **Tercera Forma Normal (3FN)** cuando cumple 2FN y ningún atributo que no sea clave depende de otro atributo que tampoco es clave (**dependencia transitiva**). Dicho en una regla práctica atribuida a William Kent: cada columna debe depender de la clave, de toda la clave (2FN) y de nada más que la clave (3FN).\n\nObserva la tabla `orders`, cuya clave primaria es `order_id`. Cada pedido ocurre en una tienda (`order_id -> store_id`). A su vez, cada tienda tiene un nombre, una ciudad y una región (`store_id -> store_name, city, region`). Si incluyeras `store_name` y `region` dentro de `orders`, crearías la cadena transitiva `order_id -> store_id -> region`.\n\nAl extraer esos atributos a la tabla maestra `stores` (14 filas) y dejar únicamente la clave foránea `store_id` en `orders` (18 000 filas), cambiar la meta mensual o el nombre de una tienda requiere actualizar 1 sola fila en `stores` en vez de miles de pedidos.',
    },
    {
      id: 'cuando-congelar-un-valor-en-la-transaccion',
      heading: 'La excepción contable: por qué unit_price_usd sí va en order_items',
      body: 'Al aprender 3FN surge una duda frecuente: si `products` ya tiene la columna `list_price_usd` (precio de lista actual), ¿por qué `order_items` guarda también `unit_price_usd`? ¿Acaso eso viola la Tercera Forma Normal?\n\nNo la viola, porque representan dos hechos con dependencia funcional distinta. `products.list_price_usd` depende solo de `product_id`: es el precio vigente en el catálogo. En cambio, `order_items.unit_price_usd` depende del par `(order_id, product_id)`: es el precio exacto al que se pactó esa línea en el instante de la compra.\n\nSi mañana Mercado Brisa sube el precio del café `MB-CAF-041` de 15.25 USD a 18.00 USD en `products`, la contabilidad de los pedidos del año pasado no debe alterarse. Normalizar exige separar los atributos actuales de la entidad maestra (`products`, `customers`, `stores`) de las medidas históricas congeladas en el evento transaccional (`unit_price_usd`, `discount_usd`, `line_total_usd`).',
    },
  ],

  workedExample: {
    title: 'Diagnóstico de dependencias funcionales y ahorro de actualizaciones en 3FN',
    description:
      'Calcula con SQL cuántas escrituras redundantes evita la 3FN entre stores y orders, y cómo auditar si una dependencia funcional se cumple sin excepciones.',
    steps: [
      {
        label: 'Paso 1: Medir el impacto de una anomalía de actualización sin 3FN entre stores y orders',
        explanation:
          'Si los datos de la tienda se guardaran repetidos dentro de `orders`, modificar un atributo de `Tienda Palermo Soho` (`store_id = 8`) obligaría a reescribir 3 429 filas de pedidos en lugar de 1 fila en `stores`.',
        code: `SELECT
  s.store_id,
  s.store_code,
  s.store_name,
  s.region,
  COUNT(o.order_id) AS pedidos_que_repetirian_tienda
FROM stores s
JOIN orders o ON s.store_id = o.store_id
GROUP BY s.store_id, s.store_code, s.store_name, s.region
ORDER BY pedidos_que_repetirian_tienda DESC, s.store_id ASC
LIMIT 5;`,
        expectedOutput: [
          {
            store_id: 8,
            store_code: 'STR-AR-01',
            store_name: 'Tienda Palermo Soho',
            region: 'Cono Sur',
            pedidos_que_repetirian_tienda: 3429,
          },
          {
            store_id: 9,
            store_code: 'STR-PE-01',
            store_name: 'Tienda Miraflores',
            region: 'Andina',
            pedidos_que_repetirian_tienda: 2571,
          },
          {
            store_id: 4,
            store_code: 'STR-CO-01',
            store_name: 'Tienda Chapinero Alto',
            region: 'Andina',
            pedidos_que_repetirian_tienda: 1715,
          },
          {
            store_id: 14,
            store_code: 'WH-ES-01',
            store_name: 'Almacén Logístico Coslada',
            region: 'Iberia',
            pedidos_que_repetirian_tienda: 1714,
          },
          {
            store_id: 6,
            store_code: 'STR-CL-01',
            store_name: 'Tienda Providencia',
            region: 'Cono Sur',
            pedidos_que_repetirian_tienda: 1286,
          },
        ],
      },
      {
        label: 'Paso 2: Auditar en SQL la dependencia funcional subcategory -> category en products',
        explanation:
          'Para comprobar si `subcategory` determina funcionalmente a `category` en `products` (candidata a separarse en una tabla de subcategorías en 3FN), agrupamos por `subcategory` y verificamos que `COUNT(DISTINCT category)` sea siempre 1.',
        code: `SELECT
  subcategory,
  COUNT(*) AS skus_en_subcategoria,
  COUNT(DISTINCT category) AS categorias_distintas,
  MIN(category) AS categoria_asignada
FROM products
GROUP BY subcategory
ORDER BY skus_en_subcategoria DESC, subcategory ASC
LIMIT 5;`,
        expectedOutput: [
          {
            subcategory: 'Filtros de papel',
            skus_en_subcategoria: 13,
            categorias_distintas: 1,
            categoria_asignada: 'Accesorios',
          },
          {
            subcategory: 'Básculas de precisión',
            skus_en_subcategoria: 12,
            categorias_distintas: 1,
            categoria_asignada: 'Accesorios',
          },
          {
            subcategory: 'Descafeinado de altura',
            skus_en_subcategoria: 12,
            categorias_distintas: 1,
            categoria_asignada: 'Café en grano',
          },
          {
            subcategory: 'Espresso doméstico',
            skus_en_subcategoria: 12,
            categorias_distintas: 1,
            categoria_asignada: 'Cafeteras',
          },
          {
            subcategory: 'Inmersión térmica',
            skus_en_subcategoria: 12,
            categorias_distintas: 1,
            categoria_asignada: 'Cafeteras',
          },
        ],
      },
    ],
  },

  checks: [
    {
      id: 'c1-modelo-02-chk1',
      type: 'mcq',
      prompt:
        'En una tabla `order_items` cuya clave primaria es `(order_id, line_number)`, alguien añade la columna `product_brand` (marca del producto). ¿Qué forma normal viola directamente ese diseño?',
      options: [
        {
          id: 'a',
          text: 'La Segunda Forma Normal (2FN) y la Tercera Forma Normal (3FN), porque `product_brand` depende solo de `product_id` y no del pedido.',
          correct: true,
          feedback:
            'Exacto. La marca es un atributo del producto (`product_id -> brand`), no de la línea del pedido; incluirla en `order_items` repite la marca cientos de veces.',
        },
        {
          id: 'b',
          text: 'La Primera Forma Normal (1FN), porque el nombre de una marca comercial contiene espacios en blanco.',
          correct: false,
          feedback:
            'Incorrecto. Una cadena de texto como `"Brisa Origen"` sigue siendo un valor atómico en SQL; 1FN prohíbe listas multivaluadas o grupos de columnas repetidas.',
        },
        {
          id: 'c',
          text: 'Ninguna, porque todas las tablas transaccionales deben copiar todas las columnas del catálogo.',
          correct: false,
          feedback:
            'Incorrecto. Copiar atributos descriptivos del catálogo en la tabla transaccional genera redundancia y anomalías de actualización.',
        },
      ],
      explanation:
        'En `order_items`, cualquier atributo descriptivo que dependa únicamente de `product_id` (como `brand` o `category`) debe residir en la tabla `products` para evitar redundancia y anomalías al actualizar.',
    },
    {
      id: 'c1-modelo-02-chk2',
      type: 'mcq',
      prompt:
        '¿Por qué `order_items` almacena `unit_price_usd` aunque la tabla `products` ya tiene `list_price_usd`?',
      options: [
        {
          id: 'a',
          text: 'Porque `unit_price_usd` registra el precio histórico cobrado en ese pedido específico, que no debe cambiar si mañana sube el precio de catálogo.',
          correct: true,
          feedback:
            'Correcto. El precio pactado en la venta depende funcionalmente de la transacción (`order_id, line_number`), mientras `list_price_usd` es el precio vigente hoy.',
        },
        {
          id: 'b',
          text: 'Porque SQL no permite hacer un `JOIN` entre `order_items` y `products` cuando hay columnas decimales.',
          correct: false,
          feedback:
            'Incorrecto. SQL une ambas tablas por `product_id` sin ninguna restricción sobre las columnas numéricas.',
        },
        {
          id: 'c',
          text: 'Porque es un error de desnormalización que debería borrarse de `order_items`.',
          correct: false,
          feedback:
            'Incorrecto. Si borraras `unit_price_usd` de `order_items`, cualquier cambio de precio en `products` reescribiría falsamente la facturación histórica.',
        },
      ],
      explanation:
        'Normalizar no significa borrar importes transaccionales: el precio vigente del catálogo vive en `products`, pero el precio efectivo de cada venta se congela en `order_items`.',
    },
    {
      id: 'c1-modelo-02-chk3',
      type: 'order',
      prompt:
        'Ordena las tres formas normales desde la condición más básica (1FN) hasta la eliminación de dependencias transitivas (3FN):',
      items: [
        '1FN: Asegurar valores atómicos por celda y eliminar listas o columnas repetidas (`item_1`, `item_2`).',
        '2FN: Extraer atributos que dependen solo de una parte de la clave primaria compuesta hacia su propia tabla.',
        '3FN: Extraer atributos que dependen transitivamente de otra columna no clave (`order_id -> store_id -> region`).',
      ],
      correctOrder: [
        '1FN: Asegurar valores atómicos por celda y eliminar listas o columnas repetidas (`item_1`, `item_2`).',
        '2FN: Extraer atributos que dependen solo de una parte de la clave primaria compuesta hacia su propia tabla.',
        '3FN: Extraer atributos que dependen transitivamente de otra columna no clave (`order_id -> store_id -> region`).',
      ],
      explanation:
        'Las formas normales son acumulativas: primero garantizas atomicidad por celda (1FN), luego dependencia de la clave completa (2FN) y finalmente ausencia de dependencias transitivas entre columnas no clave (3FN).',
    },
  ],

  practice: {
    type: 'sql',
    title: 'Cuantificar actualizaciones evitadas gracias a la 3FN entre customers y orders',
    language: 'sql',
    prompt:
      'En Mercado Brisa, los atributos del cliente (`country_code`, `segment`, `current_tier`) viven en `customers` (3FN) y no repetidos dentro de `orders`. Escribe una consulta que una `customers` (`c`) con `orders` (`o`) por `customer_id`, agrupe por `c.country_code` y `c.segment`, y calcule: `clientes_en_maestro` (`COUNT(DISTINCT c.customer_id)`), `pedidos_en_transacciones` (`COUNT(o.order_id)`) y `actualizaciones_evitadas` (`COUNT(o.order_id) - COUNT(DISTINCT c.customer_id)`). Ordena por `actualizaciones_evitadas DESC, c.country_code ASC, c.segment ASC` y limita a `10` filas.',
    starterCode: `SELECT
  c.country_code,
  c.segment,
  COUNT(DISTINCT c.customer_id) AS clientes_en_maestro,
  COUNT(o.order_id) AS pedidos_en_transacciones,
  -- Calcula cuántas filas adicionales habría que actualizar si segment se guardara en orders
  0 AS actualizaciones_evitadas
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.country_code, c.segment
ORDER BY actualizaciones_evitadas DESC, c.country_code ASC, c.segment ASC
LIMIT 10;`,
    expected: `SELECT
  c.country_code,
  c.segment,
  COUNT(DISTINCT c.customer_id) AS clientes_en_maestro,
  COUNT(o.order_id) AS pedidos_en_transacciones,
  COUNT(o.order_id) - COUNT(DISTINCT c.customer_id) AS actualizaciones_evitadas
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.country_code, c.segment
ORDER BY actualizaciones_evitadas DESC, c.country_code ASC, c.segment ASC
LIMIT 10;`,
    orderMatters: true,
    hints: [
      'En la quinta columna del `SELECT`, resta los clientes únicos de los pedidos totales: `COUNT(o.order_id) - COUNT(DISTINCT c.customer_id) AS actualizaciones_evitadas`.',
      'Mantén el `GROUP BY c.country_code, c.segment` para obtener una fila por cada combinación de país y segmento.',
      'Conserva el `ORDER BY actualizaciones_evitadas DESC, c.country_code ASC, c.segment ASC LIMIT 10`.',
    ],
    solution: `SELECT
  c.country_code,
  c.segment,
  COUNT(DISTINCT c.customer_id) AS clientes_en_maestro,
  COUNT(o.order_id) AS pedidos_en_transacciones,
  COUNT(o.order_id) - COUNT(DISTINCT c.customer_id) AS actualizaciones_evitadas
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.country_code, c.segment
ORDER BY actualizaciones_evitadas DESC, c.country_code ASC, c.segment ASC
LIMIT 10;`,
    solutionExplanation:
      'Al mantener `customers` normalizada en 3FN, actualizar un atributo de los 250 clientes `pro_barista` de Colombia modifica 250 filas en `customers` en vez de 2 138 filas en `orders`, evitando 1 888 escrituras redundantes solo en ese segmento.',
    expectedOutputTable: [
      {
        country_code: 'CO',
        segment: 'pro_barista',
        clientes_en_maestro: 250,
        pedidos_en_transacciones: 2138,
        actualizaciones_evitadas: 1888,
      },
      {
        country_code: 'AR',
        segment: 'pro_barista',
        clientes_en_maestro: 217,
        pedidos_en_transacciones: 1869,
        actualizaciones_evitadas: 1652,
      },
      {
        country_code: 'ES',
        segment: 'cafeteria_b2b',
        clientes_en_maestro: 184,
        pedidos_en_transacciones: 1569,
        actualizaciones_evitadas: 1385,
      },
      {
        country_code: 'AR',
        segment: 'retail',
        clientes_en_maestro: 183,
        pedidos_en_transacciones: 1560,
        actualizaciones_evitadas: 1377,
      },
      {
        country_code: 'PE',
        segment: 'pro_barista',
        clientes_en_maestro: 216,
        pedidos_en_transacciones: 1457,
        actualizaciones_evitadas: 1241,
      },
      {
        country_code: 'CO',
        segment: 'retail',
        clientes_en_maestro: 150,
        pedidos_en_transacciones: 1291,
        actualizaciones_evitadas: 1141,
      },
      {
        country_code: 'ES',
        segment: 'retail',
        clientes_en_maestro: 150,
        pedidos_en_transacciones: 1291,
        actualizaciones_evitadas: 1141,
      },
      {
        country_code: 'CL',
        segment: 'cafeteria_b2b',
        clientes_en_maestro: 216,
        pedidos_en_transacciones: 1312,
        actualizaciones_evitadas: 1096,
      },
      {
        country_code: 'MX',
        segment: 'pro_barista',
        clientes_en_maestro: 183,
        pedidos_en_transacciones: 1253,
        actualizaciones_evitadas: 1070,
      },
      {
        country_code: 'MX',
        segment: 'retail',
        clientes_en_maestro: 184,
        pedidos_en_transacciones: 1176,
        actualizaciones_evitadas: 992,
      },
    ],
  },

  roleNotes: {
    de: 'Normaliza en 3FN las bases operativas (OLTP) y las tablas maestras de la capa Silver para garantizar consistencia al escribir. Cuando desnormalices en la capa Gold por rendimiento de lectura, genera la tabla ancha automáticamente desde las tablas normalizadas.',
    da: 'Cuando recibas una extracción plana en CSV o Excel donde se mezclan datos de cliente y líneas de pedido, verifica con `COUNT(DISTINCT atributo) OVER (PARTITION BY id)` si algún atributo maestro presenta valores contradictorios entre filas.',
    bi: 'En el esquema en estrella de BI, las tablas de hechos están en 3FN respecto a sus claves foráneas, mientras las dimensiones agrupan jerarquías (`subcategory -> category`) a propósito para simplificar los filtros del reporte.',
  },

  summary: [
    'La redundancia en tablas no normalizadas provoca anomalías de actualización, inserción y borrado.',
    'La 1FN exige celdas atómicas sin listas ni columnas repetidas (`item_1`, `item_2`).',
    'La 2FN elimina dependencias parciales de una clave compuesta; la 3FN elimina dependencias transitivas entre columnas no clave.',
    'Los precios o descuentos pactados en el momento de la compra (`unit_price_usd`) se congelan en la tabla transaccional por exactitud contable.',
  ],

  flashcards: [
    {
      id: 'fc-c1-modelo-02-a',
      front: '¿Qué es una dependencia funcional X -> Y en un esquema relacional?',
      back: 'Es una relación donde cada valor de X determina un único valor de Y en todo momento (por ejemplo, `store_id -> store_name`).',
    },
    {
      id: 'fc-c1-modelo-02-b',
      front: '¿Cuál es la diferencia exacta entre violar la 2FN y violar la 3FN?',
      back: 'En 2FN una columna depende solo de una parte de una clave primaria compuesta; en 3FN una columna depende de otra columna que tampoco es clave (dependencia transitiva).',
    },
    {
      id: 'fc-c1-modelo-02-c',
      front: '¿Cómo compruebas en SQL si la columna A determina funcionalmente a la columna B en una tabla?',
      back: 'Ejecutando `SELECT A FROM tabla GROUP BY A HAVING COUNT(DISTINCT B) > 1;`. Si devuelve cero filas, la dependencia funcional se cumple.',
    },
  ],

  glossaryTerms: ['dependencia-funcional', 'anomalia-actualizacion', 'clave-primaria-subrogada'],

  sources: [
    {
      title: 'E. F. Codd (1970) — A Relational Model of Data for Large Shared Data Banks (Section 1.4: Normal Form)',
      url: 'https://www.seas.upenn.edu/~zives/03f/cis550/codd.pdf',
      publisher: 'Communications of the ACM',
      accessed: '2026-10-29',
      supports:
        'Fundamento matemático de la normalización relacional, atomicidad de dominios y prevención de anomalías al actualizar.',
    },
    {
      title: 'PostgreSQL 17 Documentation — Chapter 5: Data Definition (DDL)',
      url: 'https://www.postgresql.org/docs/current/ddl.html',
      publisher: 'PostgreSQL Global Development Group',
      accessed: '2026-10-29',
      supports:
        'Estructuración de tablas maestras y transaccionales independientes conectadas mediante restricciones de clave foránea.',
    },
    {
      title: 'DuckDB Documentation — CREATE TABLE Statement & Schema Design',
      url: 'https://duckdb.org/docs/sql/statements/create_table.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports:
        'Definición de tablas normalizadas y tipos de datos exactos en motores SQL analíticos.',
    },
  ],

  aiNotes:
    'Dos dudas aparecen siempre: confundir 2FN (dependencia parcial de clave compuesta) con 3FN (dependencia transitiva `A -> B -> C`), y creer que `order_items.unit_price_usd` viola 3FN respecto a `products.list_price_usd`. Aclara que el precio del catálogo cambia con el tiempo, mientras que el precio facturado en la línea del pedido es un hecho histórico.',
};

export default lesson;
