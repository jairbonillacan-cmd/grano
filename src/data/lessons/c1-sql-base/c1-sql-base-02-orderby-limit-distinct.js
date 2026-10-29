const lesson = {
  id: 'c1-sql-base-02-orderby-limit-distinct',
  moduleId: 'c1-sql-base',
  tracks: ['core'],
  level: 1,
  order: 2,
  title: 'ORDER BY, LIMIT y DISTINCT: ordenar y acotar resultados',
  minutes: 15,
  prerequisites: ['c1-sql-base-01-select-from-where'],
  contentVersion: 1,
  hook: 'Finanzas pide en Mercado Brisa los 5 pedidos reembolsados de mayor importe para revisar el motivo con cada cliente. Un analista escribe `ORDER BY total_usd LIMIT 5` sin indicar dirección de ordenamiento y entrega los 5 reembolsos más pequeños de 13 USD. Otro usa `LIMIT 5` sin `ORDER BY` creyendo que la tabla ya viene ordenada por fecha. ¿Cómo garantizas un ranking determinista y sin duplicados en SQL?',
  objectives: [
    'Eliminar filas duplicadas en la salida usando SELECT DISTINCT y explicar su efecto sobre múltiples columnas.',
    'Ordenar resultados con ORDER BY especificando dirección (ASC o DESC) y columnas de desempate.',
    'Acotar el número de filas con LIMIT y OFFSET comprendiendo su posición final en el orden lógico.'
  ],
  sections: [
    {
      id: 'deduplicacion-con-select-distinct',
      heading: 'Cómo actúa SELECT DISTINCT sobre una o varias columnas',
      body: 'Cuando consultas una columna como `region` en la tabla `stores` de Mercado Brisa (14 tiendas), obtienes valores repetidos porque varias tiendas operan en la misma región. Añadir **SELECT DISTINCT** después de `SELECT` instruye al motor para eliminar las filas duplicadas del resultado proyectado y devolver únicamente una fila por cada valor único.\n\nUn error habitual es pensar que `DISTINCT` se aplica solo a la primera columna escrita. En SQL, `SELECT DISTINCT region, country_code` evalúa la combinación completa de todas las columnas listadas en el `SELECT`. Si en la región Andina hay tiendas en Colombia (`CO`) y en Perú (`PE`), aparecerán ambas filas porque el par `(region, country_code)` es distinto en cada caso. Además, a efectos de `DISTINCT`, dos valores `NULL` se consideran iguales y se agrupan en una sola fila.',
      example: {
        language: 'sql',
        code: `SELECT DISTINCT
  region,
  country_code
FROM stores
ORDER BY region ASC, country_code ASC;`,
        expectedOutput: [
          { region: 'Andina', country_code: 'CO' },
          { region: 'Andina', country_code: 'PE' },
          { region: 'Cono Sur', country_code: 'AR' },
          { region: 'Cono Sur', country_code: 'CL' },
          { region: 'Iberia', country_code: 'ES' },
          { region: 'Norteamérica', country_code: 'MX' }
        ]
      }
    },
    {
      id: 'ordenar-resultados-con-order-by',
      heading: 'ORDER BY: dirección por defecto y claves de desempate',
      body: 'Una tabla relacional no tiene orden implícito garantizado. Si necesitas un orden específico, debes declararlo con `ORDER BY`. Por omisión, SQL ordena de menor a mayor (`ASC`: de la A a la Z en texto, del número más pequeño al más grande y de la fecha más antigua a la más reciente). Para obtener primero los importes mayores o las fechas más recientes, tienes que escribir `DESC` explícitamente tras la columna.\n\nComo `ORDER BY` se evalúa lógicamente después de `SELECT`, todos los motores SQL permiten ordenar usando los alias definidos en `SELECT`. Cuando la primera columna puede tener valores repetidos (por ejemplo, dos pedidos con el mismo `total_usd` o la misma `order_date`), añade una segunda columna única como clave de desempate (`ORDER BY total_usd DESC, order_id ASC`). Así obtienes un **ordenamiento determinista** que nunca cambia entre dos ejecuciones.'
    },
    {
      id: 'acotar-filas-con-limit-y-offset',
      heading: 'Por qué LIMIT sin ORDER BY produce muestras arbitrarias',
      body: 'La cláusula `LIMIT N` es el último paso del orden lógico: toma la tabla ya filtrada, proyectada y ordenada, y recorta únicamente las primeras `N` filas. Si necesitas paginar resultados (por ejemplo, mostrar del puesto 11 al 20), puedes combinarla con `OFFSET 10`, que salta las primeras 10 filas antes de entregar las siguientes.\n\nUsar `LIMIT` sin `ORDER BY` sirve para dar un vistazo rápido a la estructura de una tabla desconocida, pero nunca para responder una pregunta de negocio como "los 5 primeros pedidos". En motores paralelos como DuckDB, distintos hilos leen bloques de Parquet simultáneamente; sin `ORDER BY`, las filas que llegan primero a `LIMIT` pueden variar de una ejecución a otra.'
    },
    {
      id: 'secuencia-logica-completa-sin-agrupacion',
      heading: 'El orden lógico completo de una consulta de selección',
      body: 'Al incorporar `DISTINCT`, `ORDER BY` y `LIMIT`, la secuencia lógica de evaluación queda así:\n\n1. `FROM`: identifica la tabla base.\n2. `WHERE`: filtra las filas que cumplen la condición.\n3. `SELECT`: calcula expresiones y asigna alias.\n4. `DISTINCT`: descarta filas idénticas en las columnas seleccionadas.\n5. `ORDER BY`: ordena las filas resultantes (puede usar alias de `SELECT`).\n6. `LIMIT` / `OFFSET`: recorta la cantidad final de filas.\n\nEsta secuencia explica una restricción importante en motores estrictos: si usas `SELECT DISTINCT country_code FROM stores`, no puedes poner `ORDER BY monthly_target_usd` porque tras aplicar `DISTINCT` por país ya no existe un único `monthly_target_usd` por fila.'
    }
  ],
  workedExample: {
    title: 'Los 5 pedidos completados de mayor importe: ASC por omisión frente a DESC con desempate',
    description: 'Compara qué ocurre cuando pides el top 5 de pedidos completados en Mercado Brisa olvidando `DESC` (y observando los empates a 13.83 USD) frente a ordenar con `DESC` y desempatar por `order_id ASC`.',
    steps: [
      {
        label: 'Antipatrón: olvidar DESC devuelve los importes más bajos y empates sin criterio',
        explanation: 'Al escribir `ORDER BY total_usd` sin indicar `DESC`, el motor aplica `ASC` por defecto y entrega los pedidos más pequeños. Observa además que cuatro pedidos empatan en `13.83` USD.',
        code: `SELECT
  order_id,
  customer_id,
  order_date,
  total_usd
FROM orders
WHERE status = 'completed'
ORDER BY total_usd
LIMIT 5;`,
        expectedOutput: [
          {
            order_id: 26520,
            customer_id: 1107,
            order_date: '2024-09-17',
            total_usd: 13.13
          },
          {
            order_id: 10589,
            customer_id: 529,
            order_date: '2024-02-20',
            total_usd: 13.83
          },
          {
            order_id: 16854,
            customer_id: 1269,
            order_date: '2025-11-01',
            total_usd: 13.83
          },
          {
            order_id: 20076,
            customer_id: 415,
            order_date: '2024-06-12',
            total_usd: 13.83
          },
          {
            order_id: 24372,
            customer_id: 1677,
            order_date: '2024-05-06',
            total_usd: 13.83
          }
        ]
      },
      {
        label: 'Solución verificada: ORDER BY total_usd DESC, order_id ASC LIMIT 5',
        explanation: 'Especificar `DESC` coloca arriba los pedidos de mayor facturación, y añadir `order_id ASC` como segunda clave garantiza que cualquier empate se resuelva siempre en el mismo orden.',
        code: `SELECT
  order_id,
  customer_id,
  order_date,
  total_usd
FROM orders
WHERE status = 'completed'
ORDER BY total_usd DESC, order_id ASC
LIMIT 5;`,
        expectedOutput: [
          {
            order_id: 21772,
            customer_id: 1105,
            order_date: '2024-08-29',
            total_usd: 1925.73
          },
          {
            order_id: 21502,
            customer_id: 2357,
            order_date: '2025-10-16',
            total_usd: 1915.8
          },
          {
            order_id: 18616,
            customer_id: 426,
            order_date: '2025-02-06',
            total_usd: 1841.27
          },
          {
            order_id: 16402,
            customer_id: 128,
            order_date: '2024-10-10',
            total_usd: 1773.87
          },
          {
            order_id: 12322,
            customer_id: 1705,
            order_date: '2025-03-18',
            total_usd: 1764.68
          }
        ]
      }
    ]
  },
  checks: [
    {
      id: 'chk-c1-sql-02-distinct',
      type: 'mcq',
      prompt: 'En la tabla `orders` existen 4 valores posibles de `status` y 3 valores de `device_type` (todas las combinaciones ocurren). ¿Cuántas filas como máximo devuelve `SELECT DISTINCT status, device_type FROM orders;`?',
      options: [
        {
          id: 'a',
          text: '12 filas, una por cada par único (status, device_type).',
          correct: true,
          feedback: 'Exacto. DISTINCT evalúa la combinación completa de las columnas proyectadas: 4 estados × 3 tipos de dispositivo = 12 pares únicos.'
        },
        {
          id: 'b',
          text: '4 filas, porque DISTINCT solo actúa sobre la primera columna tras la palabra DISTINCT.',
          correct: false,
          feedback: 'Incorrecto. En SQL, DISTINCT se aplica a toda la fila de salida proyectada, no a una sola columna.'
        },
        {
          id: 'c',
          text: '7 filas, correspondientes a la suma de 4 estados más 3 dispositivos.',
          correct: false,
          feedback: 'Incorrecto. El número de combinaciones posibles entre dos atributos independientes es su producto (4 × 3), no su suma.'
        }
      ],
      explanation: 'SELECT DISTINCT compara tuplas completas de todas las columnas incluidas en el SELECT y conserva una fila por cada combinación distinta.'
    },
    {
      id: 'chk-c1-sql-02-orden-logico',
      type: 'order',
      prompt: 'Ordena estos pasos según la secuencia lógica real en que el motor evalúa una consulta con DISTINCT, ORDER BY y LIMIT:',
      items: [
        'LIMIT 10 (recortar las primeras 10 filas)',
        'FROM orders WHERE status = \'completed\' (leer y filtrar filas)',
        'SELECT DISTINCT customer_id, store_id (proyectar y eliminar duplicados)',
        'ORDER BY customer_id ASC (ordenar el resultado)'
      ],
      correctOrder: ['it-1', 'it-2', 'it-3', 'it-0'],
      explanation: 'Primero se leen y filtran las filas (FROM/WHERE), luego se proyectan y deduplican (SELECT DISTINCT), después se ordenan (ORDER BY) y por último se recorta con LIMIT.'
    },
    {
      id: 'chk-c1-sql-02-desempate',
      type: 'mcq',
      prompt: '¿Por qué es recomendable escribir `ORDER BY order_date DESC, order_id ASC LIMIT 10` en lugar de solo `ORDER BY order_date DESC LIMIT 10`?',
      options: [
        {
          id: 'a',
          text: 'Porque muchos pedidos comparten la misma fecha (`order_date`) y la clave única `order_id` desempata de forma determinista.',
          correct: true,
          feedback: 'Correcto. Como order_date tiene grano diario, decenas de pedidos empatan en el último día; order_id fija un orden reproducible.'
        },
        {
          id: 'b',
          text: 'Porque DuckDB prohíbe usar LIMIT si el ORDER BY tiene una sola columna.',
          correct: false,
          feedback: 'Incorrecto. Un solo criterio en ORDER BY es sintácticamente válido, pero deja los empates al azar de la ejecución.'
        },
        {
          id: 'c',
          text: 'Porque poner dos columnas en ORDER BY elimina automáticamente las filas duplicadas como DISTINCT.',
          correct: false,
          feedback: 'Incorrecto. ORDER BY nunca elimina ni agrupa filas; únicamente cambia la posición en que se muestran.'
        }
      ],
      explanation: 'Cuando la columna principal de ordenamiento admite valores repetidos, añadir la clave primaria como segundo criterio evita que LIMIT devuelva filas distintas en cada ejecución.'
    }
  ],
  practice: {
    type: 'sql',
    title: 'Top 5 de pedidos reembolsados por importe con desempate determinista',
    language: 'sql',
    prompt: 'Obtén los 5 pedidos con estado reembolsado (`status = \'refunded\'`) de mayor importe (`total_usd`) en la tabla `orders` de Mercado Brisa. Devuelve las columnas `order_id`, `customer_id`, `order_date` y `total_usd`, ordenadas de mayor a menor por `total_usd` y, en caso de empate, de menor a mayor por `order_id`.',
    starterCode: `SELECT
  order_id,
  customer_id,
  order_date,
  total_usd
FROM orders
WHERE status = 'refunded'
ORDER BY total_usd ASC
LIMIT 10;`,
    expected: `SELECT
  order_id,
  customer_id,
  order_date,
  total_usd
FROM orders
WHERE status = 'refunded'
ORDER BY total_usd DESC, order_id ASC
LIMIT 5;`,
    orderMatters: true,
    hints: [
      'Cambia la dirección de ordenamiento de `total_usd` a `DESC` para que los importes más altos aparezcan primero.',
      'Añade `, order_id ASC` en el `ORDER BY` como criterio de desempate determinista.',
      'Ajusta la cláusula final a `LIMIT 5` para devolver exactamente las 5 filas solicitadas.'
    ],
    solution: `SELECT
  order_id,
  customer_id,
  order_date,
  total_usd
FROM orders
WHERE status = 'refunded'
ORDER BY total_usd DESC, order_id ASC
LIMIT 5;`,
    solutionExplanation: 'Filtra `status = \'refunded\'` en `WHERE`, ordena por `total_usd DESC` con desempate `order_id ASC` y acota la salida a las primeras 5 filas mediante `LIMIT 5`.',
    expectedOutputTable: [
      {
        order_id: 19792,
        customer_id: 1482,
        order_date: '2025-04-18',
        total_usd: 1627.34
      },
      {
        order_id: 17644,
        customer_id: 2051,
        order_date: '2025-07-11',
        total_usd: 1592.81
      },
      {
        order_id: 15544,
        customer_id: 851,
        order_date: '2024-02-04',
        total_usd: 1582.54
      },
      {
        order_id: 26642,
        customer_id: 311,
        order_date: '2024-09-19',
        total_usd: 1538.89
      },
      {
        order_id: 25144,
        customer_id: 2223,
        order_date: '2024-08-10',
        total_usd: 1528.74
      }
    ]
  },
  roleNotes: {
    de: 'No uses SELECT DISTINCT como parche automático para esconder duplicados en un pipeline: ordenar o hashear millones de filas para deduplicar tiene un costo alto de memoria y oculta errores de ingesta o de cruces mal planteados.',
    da: 'Cuando extraigas una muestra de casos extremos ("top 10 clientes" o "5 pedidos más recientes"), incluye siempre una columna única de desempate en el ORDER BY para que cualquier colega reproduzca exactamente la misma tabla.',
    bi: 'En tablas visuales de un reporte ejecutivo, limita las listas de detalle a los N elementos principales con ORDER BY y LIMIT en vez de cargar miles de filas que nadie desplaza en pantalla.'
  },
  summary: [
    'SELECT DISTINCT elimina filas duplicadas evaluando la combinación completa de todas las columnas proyectadas.',
    'ORDER BY ordena de menor a mayor (ASC) por omisión; usa DESC para ver primero los valores más altos.',
    'Añade siempre una columna única de desempate en ORDER BY antes de aplicar LIMIT.',
    'ORDER BY se evalúa después de SELECT, por lo que admite alias de columna en todos los motores SQL.'
  ],
  flashcards: [
    {
      id: 'fc-c1-sql-02-a',
      front: '¿Sobre qué actúa SELECT DISTINCT cuando seleccionas tres columnas (`SELECT DISTINCT a, b, c`)?',
      back: 'Actúa sobre la combinación completa `(a, b, c)`: solo elimina una fila si coincide en las tres columnas a la vez con otra fila.'
    },
    {
      id: 'fc-c1-sql-02-b',
      front: '¿Por qué `ORDER BY` sí puede usar un alias creado en `SELECT`, mientras que `WHERE` en SQL estándar no puede?',
      back: 'Porque en el orden lógico de evaluación `ORDER BY` se ejecuta después de `SELECT`, cuando los alias ya fueron creados.'
    },
    {
      id: 'fc-c1-sql-02-c',
      front: '¿Qué riesgo tiene ejecutar `LIMIT 10` sin cláusula `ORDER BY` (o con empates sin desempatar)?',
      back: 'El motor devuelve un subconjunto arbitrario que puede cambiar entre ejecuciones según el orden en que los hilos lean los bloques en disco.'
    }
  ],
  glossaryTerms: ['deduplicacion-distinct', 'ordenamiento-determinista', 'orden-logico-sql'],
  sources: [
    {
      title: 'DuckDB SQL Reference — ORDER BY Clause',
      url: 'https://duckdb.org/docs/stable/sql/query_syntax/orderby',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Sintaxis de ORDER BY, dirección ASC/DESC por omisión y ordenamiento por múltiples expresiones.'
    },
    {
      title: 'DuckDB SQL Reference — LIMIT and OFFSET Clause',
      url: 'https://duckdb.org/docs/stable/sql/query_syntax/limit',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Recorte de filas con LIMIT y desplazamiento de inicio con OFFSET.'
    },
    {
      title: 'PostgreSQL 17 Documentation — Chapter 7.5 & 7.6: Sorting Rows and LIMIT',
      url: 'https://www.postgresql.org/docs/17/queries-order.html',
      publisher: 'PostgreSQL Global Development Group',
      accessed: '2026-10-29',
      supports: 'Comportamiento no determinista de LIMIT cuando no se acompaña de un ORDER BY único.'
    },
    {
      title: 'PostgreSQL 17 Documentation — Chapter 7.3: Select Lists (SELECT DISTINCT)',
      url: 'https://www.postgresql.org/docs/17/queries-select-lists.html',
      publisher: 'PostgreSQL Global Development Group',
      accessed: '2026-10-29',
      supports: 'Evaluación de SELECT DISTINCT sobre el conjunto de columnas proyectadas.'
    }
  ],
  aiNotes: 'Vigila dos malentendidos frecuentes: 1) creer que `SELECT DISTINCT a, b` devuelve un solo valor por cada `a` (como si fuera `GROUP BY a`); 2) asumir que `ORDER BY total_usd` ordena de mayor a menor cuando en realidad el valor por defecto en SQL es `ASC` (menor a mayor).'
};

export default lesson;
