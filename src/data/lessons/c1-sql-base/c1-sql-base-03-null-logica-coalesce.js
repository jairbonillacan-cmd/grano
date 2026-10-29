const lesson = {
  id: 'c1-sql-base-03-null-logica-coalesce',
  moduleId: 'c1-sql-base',
  tracks: ['core'],
  level: 1,
  order: 3,
  title: 'NULL, lógica de tres valores, IS NULL y COALESCE',
  minutes: 20,
  prerequisites: ['c1-sql-base-02-orderby-limit-distinct'],
  contentVersion: 1,
  hook: 'En Mercado Brisa, 6.000 de los 18.000 pedidos son compras orgánicas y tienen `campaign_id` en `NULL`. La directora de marketing pide el ingreso de todos los pedidos que no vinieron de la campaña de verano (`CMP-VERANO`). Un analista filtra `WHERE campaign_id <> \'CMP-VERANO\'` y su reporte pierde 3,78 millones de dólares porque los 6.000 pedidos orgánicos desaparecen sin dar error. ¿Por qué `NULL <> \'CMP-VERANO\'` no es verdadero en SQL?',
  objectives: [
    'Evaluar expresiones con NULL aplicando las tablas de verdad de la lógica de tres valores (TRUE, FALSE y UNKNOWN).',
    'Filtrar valores ausentes sin perder filas usando IS NULL, IS NOT NULL e IS DISTINCT FROM.',
    'Sustituir nulos por valores de respaldo en proyecciones y cálculos con COALESCE y prevenir divisiones por cero con NULLIF.'
  ],
  sections: [
    {
      id: 'logica-trivalente-true-false-unknown',
      heading: 'Por qué comparar con NULL devuelve UNKNOWN en lugar de TRUE o FALSE',
      body: 'Como viste en el módulo anterior, `NULL` no es el número cero ni una cadena vacía. Representa un dato ausente o desconocido. Si no sabes a qué campaña pertenece un pedido orgánico (`campaign_id` es `NULL`), no puedes afirmar que sea igual a `\'CMP-VERANO\'`. Tampoco puedes afirmar lo contrario: la respuesta honesta es "no se sabe". Por eso SQL utiliza una **lógica de tres valores** (`TRUE`, `FALSE` y `UNKNOWN`).\n\nCualquier comparación con operadores ordinarios (`=`, `<>`, `<`, `>`) donde intervenga `NULL` produce `UNKNOWN`. La cláusula `WHERE` solo deja pasar las filas cuyo predicado evalúa a `TRUE`. Tanto `FALSE` como `UNKNOWN` se descartan. Por eso `WHERE campaign_id = NULL` devuelve cero filas. Del mismo modo, `WHERE campaign_id <> \'CMP-VERANO\'` elimina los pedidos de `\'CMP-VERANO\'` (`FALSE`) y también los 6.000 pedidos orgánicos con `NULL` (`UNKNOWN`).'
    },
    {
      id: 'is-null-e-is-distinct-from',
      heading: 'Cómo filtrar nulos con IS NULL e IS DISTINCT FROM',
      body: 'Para preguntar si una celda está vacía o llena, usa los predicados `IS NULL` e `IS NOT NULL`. Estos predicados siempre devuelven `TRUE` o `FALSE`, nunca `UNKNOWN`. En la tabla `customers` de Mercado Brisa hay 218 clientes sin código postal registrado. La única forma correcta de encontrarlos es escribir `WHERE postal_code IS NULL`.\n\n¿Y si quieres todos los pedidos cuya campaña no sea `\'CMP-VERANO\'`, incluidos los orgánicos donde `campaign_id` es `NULL`? Tienes dos opciones equivalentes. La primera es explicitar el nulo con `WHERE campaign_id <> \'CMP-VERANO\' OR campaign_id IS NULL`. La segunda es usar el predicado estándar **IS DISTINCT FROM** (`WHERE campaign_id IS DISTINCT FROM \'CMP-VERANO\'`), disponible en DuckDB y PostgreSQL 17. Este operador trata `NULL` como un valor comparable: devuelve `TRUE` al comparar un texto contra `NULL` y `FALSE` al comparar dos `NULL` entre sí.',
      example: {
        language: 'sql',
        code: `SELECT
  customer_id,
  full_name,
  country_code,
  COALESCE(postal_code, 'SIN_CP') AS postal_code_clean
FROM customers
WHERE postal_code IS NULL
ORDER BY customer_id ASC
LIMIT 5;`,
        expectedOutput: [
          {
            customer_id: 11,
            full_name: 'Paula González',
            country_code: 'ES',
            postal_code_clean: 'SIN_CP'
          },
          {
            customer_id: 22,
            full_name: 'Tomás Flores',
            country_code: 'PE',
            postal_code_clean: 'SIN_CP'
          },
          {
            customer_id: 33,
            full_name: 'Lucía Morales',
            country_code: 'AR',
            postal_code_clean: 'SIN_CP'
          },
          {
            customer_id: 44,
            full_name: 'Joaquín Ramos',
            country_code: 'CL',
            postal_code_clean: 'SIN_CP'
          },
          {
            customer_id: 55,
            full_name: 'Martina Rodríguez',
            country_code: 'CO',
            postal_code_clean: 'SIN_CP'
          }
        ]
      }
    },
    {
      id: 'coalesce-y-nullif-en-calculos',
      heading: 'Valores de respaldo con COALESCE y divisiones seguras con NULLIF',
      body: 'En aritmética y concatenación de texto, `NULL` se propaga. Si una columna `bono_usd` vale `NULL`, la suma `sueldo_usd + bono_usd` da `NULL`. La función **COALESCE** recibe dos o más argumentos (`COALESCE(val1, val2, resguardo)`) y devuelve el primero de izquierda a derecha que no sea `NULL`. Así, `COALESCE(campaign_id, \'ORGANICO\')` reemplaza los nulos por la etiqueta `\'ORGANICO\'` en los reportes. Igualmente, `COALESCE(bono_usd, 0)` permite sumar importes sin perder el total de la fila.\n\nSu función complementaria es **NULLIF** (`NULLIF(a, b)`), que devuelve `NULL` cuando ambos argumentos son iguales. Es el patrón estándar para proteger divisiones cuando el divisor puede valer cero. La expresión `discount_usd / NULLIF(subtotal_usd, 0)` convierte un `0` en `NULL` y devuelve `NULL` en esa fila sin producir error.'
    },
    {
      id: 'tablas-verdad-y-ordenamiento-de-nulos',
      heading: 'Cómo interactúa UNKNOWN con AND, OR y ORDER BY',
      body: 'Recuerda dos reglas prácticas cuando combinas condiciones donde aparece `UNKNOWN`:\n\n- En un `OR`, si una rama ya es `TRUE`, el resultado total es `TRUE`: `TRUE OR UNKNOWN` evalúa a `TRUE`.\n- En un `AND`, si una rama ya es `FALSE`, el resultado total es `FALSE`: `FALSE AND UNKNOWN` evalúa a `FALSE`, mientras que `TRUE AND UNKNOWN` queda en `UNKNOWN`.\n\nPor último, al ordenar una columna que contiene valores `NULL` con `ORDER BY`, puedes fijar dónde colocarlos. Usa `NULLS LAST` para enviarlos al final o `NULLS FIRST` para ponerlos al principio. Tanto DuckDB como PostgreSQL 17 soportan ambas cláusulas (`ORDER BY campaign_id ASC NULLS LAST`) para dejar los registros incompletos al final.'
    }
  ],
  workedExample: {
    title: 'Excluir una campaña sin borrar los pedidos orgánicos: <> frente a IS DISTINCT FROM',
    description: 'En `orders` hay 18.000 pedidos: 3.000 de `CMP-VERANO`, 9.000 de otras tres campañas y 6.000 pedidos orgánicos con `campaign_id IS NULL`. Compara el efecto de `<>` frente a `IS DISTINCT FROM`.',
    steps: [
      {
        label: 'Antipatrón: WHERE campaign_id <> \'CMP-VERANO\' descarta los 6.000 pedidos orgánicos',
        explanation: 'Para las 6.000 filas donde `campaign_id` es `NULL`, la expresión `NULL <> \'CMP-VERANO\'` devuelve `UNKNOWN`. `WHERE` las elimina en silencio y reduce los ingresos reportados de 7,10 millones a 3,32 millones de USD.',
        code: `SELECT
  COUNT(*) AS orders_count,
  COUNT(campaign_id) AS campaign_orders,
  COUNT(*) - COUNT(campaign_id) AS organic_orders,
  ROUND(SUM(total_usd), 2) AS total_revenue_usd
FROM orders
WHERE campaign_id <> 'CMP-VERANO';`,
        expectedOutput: [
          {
            orders_count: 9000,
            campaign_orders: 9000,
            organic_orders: 0,
            total_revenue_usd: 3323509.56
          }
        ]
      },
      {
        label: 'Solución verificada: IS DISTINCT FROM conserva los pedidos con NULL',
        explanation: 'Al usar `campaign_id IS DISTINCT FROM \'CMP-VERANO\'` (o `campaign_id <> \'CMP-VERANO\' OR campaign_id IS NULL`), las 6.000 filas orgánicas evalúan a `TRUE` y se conservan los 15.000 pedidos esperados.',
        code: `SELECT
  COUNT(*) AS orders_count,
  COUNT(campaign_id) AS campaign_orders,
  COUNT(*) - COUNT(campaign_id) AS organic_orders,
  ROUND(SUM(total_usd), 2) AS total_revenue_usd
FROM orders
WHERE campaign_id IS DISTINCT FROM 'CMP-VERANO';`,
        expectedOutput: [
          {
            orders_count: 15000,
            campaign_orders: 9000,
            organic_orders: 6000,
            total_revenue_usd: 7108352.08
          }
        ]
      }
    ]
  },
  checks: [
    {
      id: 'chk-c1-sql-03-igual-null',
      type: 'predict-output',
      prompt: 'En la tabla `orders` existen 6.000 filas donde `campaign_id` es `NULL`. ¿Cuántas filas devuelve `SELECT order_id FROM orders WHERE campaign_id = NULL;`?',
      options: [
        {
          id: 'a',
          text: '0 filas, porque `campaign_id = NULL` evalúa siempre a UNKNOWN y WHERE solo conserva TRUE.',
          correct: true,
          feedback: 'Exacto. Ninguna fila cumple `= NULL`; para encontrar los registros vacíos debes escribir `WHERE campaign_id IS NULL`.'
        },
        {
          id: 'b',
          text: '6.000 filas, correspondientes a todos los pedidos orgánicos sin campaña.',
          correct: false,
          feedback: 'Incorrecto. El operador `=` no puede detectar valores `NULL`; para obtener las 6.000 filas necesitas `IS NULL`.'
        },
        {
          id: 'c',
          text: '18.000 filas, porque `NULL` actúa como comodín universal en las comparaciones.',
          correct: false,
          feedback: 'Incorrecto. `NULL` no es un comodín; su comparación con `=` produce `UNKNOWN` en todas las filas.'
        }
      ],
      explanation: 'En la lógica de tres valores de SQL, `x = NULL` produce `UNKNOWN` incluso cuando `x` también es `NULL`. Por eso WHERE descarta todas las filas.'
    },
    {
      id: 'chk-c1-sql-03-coalesce',
      type: 'predict-output',
      prompt: '¿Qué valor devuelve la expresión `SELECT COALESCE(NULL, NULL, \'SIN_CAMPAÑA\', \'OTRA\');`?',
      options: [
        {
          id: 'a',
          text: '\'SIN_CAMPAÑA\', porque COALESCE devuelve el primer argumento no nulo de izquierda a derecha.',
          correct: true,
          feedback: 'Correcto. COALESCE inspecciona los argumentos en orden y se detiene en el primer valor distinto de NULL.'
        },
        {
          id: 'b',
          text: '\'OTRA\', porque COALESCE devuelve el último valor de la lista cuando encuentra algún NULL.',
          correct: false,
          feedback: 'Incorrecto. En cuanto encuentra \'SIN_CAMPAÑA\', COALESCE la devuelve sin evaluar los argumentos siguientes.'
        },
        {
          id: 'c',
          text: 'NULL, porque al menos uno de los argumentos de entrada es NULL.',
          correct: false,
          feedback: 'Incorrecto. COALESCE solo devuelve NULL si absolutamente todos sus argumentos son NULL.'
        }
      ],
      explanation: 'COALESCE evalúa sus argumentos en cortocircuito de izquierda a derecha, retorna el primer valor que no sea NULL e ignora el resto de la lista.'
    },
    {
      id: 'chk-c1-sql-03-3vl',
      type: 'mcq',
      prompt: 'Para un pedido donde `campaign_id` es `NULL` y `status` es `\'completed\'`, ¿a qué evalúan respectivamente `(campaign_id = \'CMP-VERANO\') OR (status = \'completed\')` y `(campaign_id = \'CMP-VERANO\') AND (status = \'completed\')`?',
      options: [
        {
          id: 'a',
          text: 'El OR evalúa a TRUE (`UNKNOWN OR TRUE = TRUE`) y el AND evalúa a UNKNOWN (`UNKNOWN AND TRUE = UNKNOWN`).',
          correct: true,
          feedback: 'Exacto. Basta una rama TRUE para que OR sea verdadero, mientras que en AND un UNKNOWN con TRUE permanece desconocido.'
        },
        {
          id: 'b',
          text: 'Ambos evalúan a UNKNOWN porque en cuanto aparece un NULL toda la expresión se vuelve UNKNOWN.',
          correct: false,
          feedback: 'Incorrecto. En `UNKNOWN OR TRUE`, el resultado ya está determinado como TRUE independientemente del valor desconocido.'
        },
        {
          id: 'c',
          text: 'Ambos evalúan a FALSE porque SQL convierte cualquier NULL en FALSE antes de evaluar AND y OR.',
          correct: false,
          feedback: 'Incorrecto. SQL no convierte NULL en FALSE dentro de los operadores booleanos; aplica las tablas de tres valores.'
        }
      ],
      explanation: 'En lógica trivalente, `UNKNOWN OR TRUE` es `TRUE` (la fila pasa el WHERE), mientras que `UNKNOWN AND TRUE` resulta en `UNKNOWN` (la fila se descarta).'
    }
  ],
  practice: {
    type: 'sql',
    title: 'Auditoría de pedidos orgánicos completados en la Tienda Reforma Norte',
    language: 'sql',
    prompt: 'Consulta la tabla `orders` de Mercado Brisa para obtener los primeros 8 pedidos (`ORDER BY order_id ASC LIMIT 8`) de la tienda `store_id = 1` con estado `status = \'completed\'` que no tengan campaña asociada (`campaign_id IS NULL`). Devuelve `order_id`, `customer_id`, `COALESCE(campaign_id, \'ORGANICO\') AS campaign_label` y `total_usd`.',
    starterCode: `SELECT
  order_id,
  customer_id,
  campaign_id AS campaign_label,
  total_usd
FROM orders
WHERE store_id = 1
  AND status = 'completed'
  AND campaign_id = NULL
ORDER BY order_id ASC
LIMIT 8;`,
    expected: `SELECT
  order_id,
  customer_id,
  COALESCE(campaign_id, 'ORGANICO') AS campaign_label,
  total_usd
FROM orders
WHERE store_id = 1
  AND status = 'completed'
  AND campaign_id IS NULL
ORDER BY order_id ASC
LIMIT 8;`,
    orderMatters: true,
    hints: [
      'En la cláusula `WHERE`, reemplaza `campaign_id = NULL` (que devuelve 0 filas) por `campaign_id IS NULL`.',
      'En el `SELECT`, envuelve `campaign_id` con `COALESCE(campaign_id, \'ORGANICO\') AS campaign_label` para sustituir el nulo por la etiqueta pedida.',
      'Mantén `ORDER BY order_id ASC LIMIT 8` para obtener los primeros 8 pedidos en orden.'
    ],
    solution: `SELECT
  order_id,
  customer_id,
  COALESCE(campaign_id, 'ORGANICO') AS campaign_label,
  total_usd
FROM orders
WHERE store_id = 1
  AND status = 'completed'
  AND campaign_id IS NULL
ORDER BY order_id ASC
LIMIT 8;`,
    solutionExplanation: 'Usa `campaign_id IS NULL` en `WHERE` para filtrar correctamente los pedidos orgánicos y proyecta `COALESCE(campaign_id, \'ORGANICO\') AS campaign_label` para mostrar un texto explícito en lugar de `NULL`.',
    expectedOutputTable: [
      {
        order_id: 10053,
        customer_id: 684,
        campaign_label: 'ORGANICO',
        total_usd: 490.11
      },
      {
        order_id: 10137,
        customer_id: 1788,
        campaign_label: 'ORGANICO',
        total_usd: 823.86
      },
      {
        order_id: 10221,
        customer_id: 492,
        campaign_label: 'ORGANICO',
        total_usd: 1360.83
      },
      {
        order_id: 10305,
        customer_id: 1596,
        campaign_label: 'ORGANICO',
        total_usd: 491.35
      },
      {
        order_id: 10389,
        customer_id: 300,
        campaign_label: 'ORGANICO',
        total_usd: 583.18
      },
      {
        order_id: 10473,
        customer_id: 1404,
        campaign_label: 'ORGANICO',
        total_usd: 138.91
      },
      {
        order_id: 10557,
        customer_id: 108,
        campaign_label: 'ORGANICO',
        total_usd: 304.4
      },
      {
        order_id: 10641,
        customer_id: 1212,
        campaign_label: 'ORGANICO',
        total_usd: 433.83
      }
    ]
  },
  roleNotes: {
    de: 'Cuando compares cambios entre una tabla origen y una tabla destino para detectar actualizaciones (CDC o cargas incrementales), usa `IS DISTINCT FROM` en lugar de `<>`: si una columna pasa de tener un texto a `NULL`, `<>` devuelve `UNKNOWN` y el cambio nunca se registra.',
    da: 'Antes de excluir una categoría o campaña con `<>`, comprueba siempre cuántos registros tienen `NULL` en esa columna. De lo contrario, borrarás en silencio los casos no atribuidos de tu denominador.',
    bi: 'En dimensiones de un tablero (como canal, campaña o código postal), transforma los `NULL` en una categoría explícita tipo `\'Sin campaña\'` o `\'No informado\'` con `COALESCE` para que los usuarios no vean casillas en blanco en los filtros.'
  },
  summary: [
    'Cualquier comparación ordinaria (`=`, `<>`, `<`, `>`) con NULL evalúa a UNKNOWN, nunca a TRUE ni a FALSE.',
    'La cláusula WHERE conserva únicamente las filas con resultado TRUE y descarta tanto FALSE como UNKNOWN.',
    'Usa IS NULL, IS NOT NULL o IS DISTINCT FROM para filtrar columnas que pueden contener valores nulos.',
    'COALESCE devuelve el primer valor no nulo de su lista y NULLIF evita divisiones por cero.'
  ],
  flashcards: [
    {
      id: 'fc-c1-sql-03-a',
      front: '¿Por qué `WHERE campaign_id <> \'CMP-VERANO\'` excluye también las filas donde `campaign_id` es `NULL`?',
      back: 'Porque `NULL <> \'CMP-VERANO\'` evalúa a `UNKNOWN`, y la cláusula `WHERE` descarta todas las filas cuyo resultado no sea `TRUE`.'
    },
    {
      id: 'fc-c1-sql-03-b',
      front: '¿Qué predicado SQL estándar permite comparar dos expresiones tratando `NULL` como un valor comparable (sin dar `UNKNOWN`)?',
      back: '`IS DISTINCT FROM` (para desigualdad) e `IS NOT DISTINCT FROM` (para igualdad segura ante nulos).'
    },
    {
      id: 'fc-c1-sql-03-c',
      front: '¿Cómo evitas un error de división por cero al calcular `descuento / subtotal` en SQL?',
      back: 'Usando `NULLIF` en el denominador: `descuento / NULLIF(subtotal, 0)`, que convierte el cero en `NULL` y devuelve `NULL` sin fallar.'
    }
  ],
  glossaryTerms: ['logica-trivalente-null', 'coalesce-nullif', 'predicado-where'],
  sources: [
    {
      title: 'DuckDB SQL Reference — Comparison Operators (IS NULL, IS DISTINCT FROM)',
      url: 'https://duckdb.org/docs/stable/sql/expressions/comparison_operators',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Comportamiento de operadores relacionales frente a NULL y sintaxis de IS DISTINCT FROM.'
    },
    {
      title: 'PostgreSQL 17 Documentation — Section 9.2: Comparison Functions and Operators',
      url: 'https://www.postgresql.org/docs/17/functions-comparison.html',
      publisher: 'PostgreSQL Global Development Group',
      accessed: '2026-10-29',
      supports: 'Semántica estándar de comparación con NULL y predicados IS NULL / IS DISTINCT FROM.'
    },
    {
      title: 'PostgreSQL 17 Documentation — Section 9.18: Conditional Expressions (COALESCE, NULLIF)',
      url: 'https://www.postgresql.org/docs/17/functions-conditional.html',
      publisher: 'PostgreSQL Global Development Group',
      accessed: '2026-10-29',
      supports: 'Definición y evaluación de COALESCE y NULLIF.'
    },
    {
      title: 'Modern SQL — Three-Valued Logic (3VL)',
      url: 'https://modern-sql.com/concept/three-valued-logic',
      publisher: 'Markus Winand',
      accessed: '2026-10-29',
      supports: 'Tablas de verdad de TRUE, FALSE y UNKNOWN y efecto en filtros WHERE.'
    }
  ],
  aiNotes: 'El error más frecuente es escribir `= NULL` o `!= NULL` en el WHERE y sorprenderse de que la tabla salga vacía, o escribir `WHERE campaign_id != \'X\'` sin notar que desaparecieron los 6.000 pedidos orgánicos con `campaign_id IS NULL`. Insiste siempre en la diferencia entre `FALSE` y `UNKNOWN`.'
};

export default lesson;
