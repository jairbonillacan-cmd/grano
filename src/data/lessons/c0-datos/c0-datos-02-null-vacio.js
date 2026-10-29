const lesson = {
  id: 'c0-datos-02-null-vacio',
  moduleId: 'c0-datos',
  tracks: ['core'],
  level: 0,
  order: 2,
  title: 'Por qué NULL no es cero ni texto vacío',
  minutes: 15,
  prerequisites: ['c0-datos-01-tipos-dato'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), el equipo de logística quiere saber a cuántos clientes les falta el código postal en la tabla `customers` para corregir sus direcciones antes del reparto. Alguien ejecuta `SELECT COUNT(*) FROM customers WHERE postal_code = NULL;` y el sistema responde `0`. Sin embargo, al revisar las entregas fallidas aparecen más de doscientas fichas sin código postal. ¿Por qué `= NULL` devolvió cero filas y qué diferencia hay entre `NULL`, el número `0` y un texto vacío `""`?',

  objectives: [
    'Diferenciar el marcador `NULL` (dato ausente o desconocido) del número `0` y de la cadena vacía `""`.',
    'Aplicar la lógica de tres valores (`TRUE`, `FALSE`, `UNKNOWN`) usando `IS NULL`, `IS NOT NULL` y `COALESCE`.',
    'Auditar cuántos registros tienen valores `NULL` en una tabla comparando `COUNT(*)` frente a `COUNT(columna)`.',
  ],

  sections: [
    {
      id: 'diferencia-entre-null-cero-y-vacio',
      heading: 'Qué significa NULL frente al número cero y al texto vacío',
      body: 'En una base de datos, **NULL** no es un número ni un texto: es un marcador especial que significa que el valor se desconoce, aún no existe o no aplica a esa fila. Confundirlo con `0` o con un texto vacío (`""`) cambia el significado de tus datos.\n\nSi un pedido tiene `discount_usd = 0`, sabemos con certeza que el descuento fue de cero dólares. Si tuviera `NULL`, significaría que desconocemos si hubo descuento. En una columna de texto como `postal_code`, una cadena vacía `""` es un texto de longitud cero, mientras que `NULL` indica ausencia de dato.\n\nEsta distinción altera las funciones de resumen: `AVG(columna)` ignora las filas con `NULL`, pero sí incluye los ceros en el denominador. Si reemplazas por cero un dato faltante de temperatura o de gasto, hundirás artificialmente el promedio.',
    },
    {
      id: 'logica-de-tres-valores-y-comparaciones',
      heading: 'Por qué ninguna comparación con el signo igual encuentra un NULL',
      body: 'En la vida diaria pensamos con dos valores lógicos: verdadero o falso. SQL utiliza una **lógica de tres valores**: `TRUE` (verdadero), `FALSE` (falso) y `UNKNOWN` (desconocido).\n\nCuando preguntas `postal_code = NULL`, estás preguntando si un valor desconocido es igual a otro valor desconocido. Como el motor no puede saberlo, el resultado no es `TRUE` ni `FALSE`, sino `UNKNOWN`. La cláusula `WHERE` solo conserva las filas donde la condición evalúa exactamente a `TRUE`, por lo que descarta todas las filas `UNKNOWN` y devuelve cero resultados.\n\nLo mismo ocurre con las operaciones aritméticas: `100 + NULL` da `NULL`. Para preguntar si un valor falta o está presente, debes usar los operadores dedicados `IS NULL` e `IS NOT NULL`. Además, `COUNT(*)` cuenta todas las filas de la tabla, mientras que `COUNT(postal_code)` cuenta únicamente las filas donde `postal_code` no es nulo.',
      example: {
        language: 'sql',
        code: `SELECT
  COUNT(*) AS total_clientes,
  COUNT(postal_code) AS clientes_con_postal,
  COUNT(*) - COUNT(postal_code) AS clientes_postal_nulo
FROM customers;`,
        expectedOutput: [
          {
            total_clientes: 2400,
            clientes_con_postal: 2182,
            clientes_postal_nulo: 218,
          },
        ],
      },
    },
    {
      id: 'reemplazo-defensivo-con-coalesce',
      heading: 'Cuándo conservar NULL y cómo mostrar un valor por defecto con COALESCE',
      body: 'No todos los valores `NULL` son errores de captura. En la tabla `orders` de Mercado Brisa, existen `6 000` pedidos con `campaign_id IS NULL`. Esos pedidos no están rotos: son compras orgánicas de clientes que entraron directamente a la tienda sin hacer clic en ningún anuncio.\n\nSi sobreescribieras la tabla física cambiando esos `NULL` por el texto `"SIN_CAMPANA"`, harías que `COUNT(campaign_id)` contara los 18 000 pedidos como si todos hubieran tenido una campaña publicitaria.\n\nLa práctica recomendada es conservar `NULL` en el almacenamiento y usar la función `COALESCE(columna, valor_por_defecto)` solo al momento de presentar un reporte. `COALESCE(postal_code, \'SIN_CP\')` evalúa sus argumentos en orden y devuelve el primer valor que no sea `NULL`, dejando intacto el dato original.',
    },
  ],

  workedExample: {
    title: 'Detección real de códigos postales ausentes en customers',
    description:
      'Observa cómo `WHERE postal_code = NULL` oculta los 218 registros incompletos de `customers` y cómo `WHERE postal_code IS NULL` junto con `COALESCE` los identifica con exactitud.',
    steps: [
      {
        label: 'Error clásico: filtrar nulos con el signo igual (= NULL)',
        explanation:
          'Al escribir `WHERE postal_code = NULL`, la expresión evalúa a `UNKNOWN` en cada fila. El filtro descarta todos los registros y hace creer que ningún cliente tiene el código postal vacío.',
        code: `SELECT
  COUNT(*) AS clientes_sin_postal
FROM customers
WHERE postal_code = NULL;`,
        expectedOutput: [
          {
            clientes_sin_postal: 0,
          },
        ],
      },
      {
        label: 'Solución verificada: filtrar con IS NULL y etiquetar con COALESCE',
        explanation:
          'Al cambiar el filtro a `WHERE postal_code IS NULL`, aparecen los `218` clientes sin código postal. Con `COALESCE(postal_code, \'SIN_CP\')` puedes asignarles una etiqueta legible sin perder una sola fila.',
        code: `SELECT
  COUNT(*) AS clientes_sin_postal,
  COUNT(COALESCE(postal_code, 'SIN_CP')) AS filas_con_valor_por_defecto
FROM customers
WHERE postal_code IS NULL;`,
        expectedOutput: [
          {
            clientes_sin_postal: 218,
            filas_con_valor_por_defecto: 218,
          },
        ],
      },
    ],
  },

  checks: [
    {
      id: 'c1',
      type: 'predict-output',
      prompt:
        'Una tabla tiene 4 filas con los siguientes valores en la columna `bono_usd`: `10`, `20`, `0` y `NULL`. ¿Qué resultado devuelven `COUNT(*)` y `AVG(bono_usd)`?',
      options: [
        {
          id: 'a',
          text: 'COUNT(*) devuelve 4 y AVG(bono_usd) devuelve 10 (suma 10 + 20 + 0 y divide entre las 3 filas no nulas).',
          correct: true,
          feedback:
            'Exacto. COUNT(*) cuenta las 4 filas físicas, pero AVG ignora la fila NULL y divide 30 entre 3 filas válidas.',
        },
        {
          id: 'b',
          text: 'COUNT(*) devuelve 3 y AVG(bono_usd) devuelve 15 (ignora tanto el NULL como el 0).',
          correct: false,
          feedback:
            'Incorrecto. El número 0 es un valor numérico válido que sí entra en el promedio; solo NULL se excluye.',
        },
        {
          id: 'c',
          text: 'COUNT(*) devuelve 4 y AVG(bono_usd) devuelve 7.5 (trata el NULL como si fuera un 0).',
          correct: false,
          feedback:
            'Incorrecto. AVG nunca convierte NULL en cero automáticamente; para eso tendrías que escribir AVG(COALESCE(bono_usd, 0)).',
        },
      ],
      explanation:
        'Las funciones de agregación como COUNT(columna) y AVG(columna) ignoran los valores NULL, pero sí incluyen el número 0 porque cero es un dato conocido.',
    },
    {
      id: 'c2',
      type: 'mcq',
      prompt:
        'En la tabla `orders` hay 12 000 pedidos con código de campaña y 6 000 con `campaign_id IS NULL`. Si ejecutas `WHERE campaign_id <> \'CMP-VERANO\'`, ¿qué pasa con los 6 000 pedidos que tienen `NULL`?',
      options: [
        {
          id: 'a',
          text: 'No aparecen en el resultado, porque comparar NULL <> \'CMP-VERANO\' produce UNKNOWN y WHERE lo descarta.',
          correct: true,
          feedback:
            'Correcto. Tanto el operador = como el operador <> devuelven UNKNOWN al evaluar un NULL.',
        },
        {
          id: 'b',
          text: 'Sí aparecen, porque NULL es distinto del texto \'CMP-VERANO\'.',
          correct: false,
          feedback:
            'Incorrecto. Es una trampa frecuente: en lógica de tres valores, NULL <> texto no es TRUE, sino UNKNOWN.',
        },
        {
          id: 'c',
          text: 'El motor detiene la consulta con un error por encontrar valores nulos.',
          correct: false,
          feedback:
            'Incorrecto. SQL no lanza error; simplemente descarta en silencio las filas cuyo predicado evalúa a UNKNOWN.',
        },
      ],
      explanation:
        'Al filtrar con desigualdad (<> o !=), las filas con NULL evalúan a UNKNOWN y desaparecen del resultado salvo que añadas explícitamente OR campaign_id IS NULL.',
    },
    {
      id: 'c3',
      type: 'fill-code',
      prompt:
        'Completa la consulta para mostrar el código postal o el texto `\'SIN_CP\'` cuando sea nulo, filtrando únicamente las filas donde `postal_code` falta:',
      template:
        'SELECT customer_id, {{b1}}(postal_code, \'SIN_CP\') AS cp FROM customers WHERE postal_code IS {{b2}};',
      blanks: [
        { id: 'b1', accepted: ['COALESCE', 'coalesce'] },
        { id: 'b2', accepted: ['NULL', 'null'] },
      ],
      explanation:
        'COALESCE devuelve el primer argumento no nulo para presentar un valor por defecto, y el operador IS NULL filtra las filas donde el dato está ausente.',
    },
  ],

  practice: {
    type: 'sql',
    title: 'Auditoría de códigos postales nulos por país en customers',
    language: 'sql',
    prompt:
      'Audita la tabla `customers` de Mercado Brisa agrupando por `country_code` para calcular tres métricas: `total_clientes` (`COUNT(*)`), `con_codigo_postal` (`COUNT(postal_code)`) y `sin_codigo_postal` (`COUNT(*) - COUNT(postal_code)`). Ordena el resultado por `sin_codigo_postal DESC, country_code ASC`.',
    starterCode: `SELECT
  country_code,
  COUNT(*) AS total_clientes,
  COUNT(postal_code) AS con_codigo_postal,
  -- TODO: Calcula los clientes con postal_code nulo restando COUNT(*) - COUNT(postal_code) AS sin_codigo_postal
  0 AS sin_codigo_postal
FROM customers
GROUP BY country_code
ORDER BY sin_codigo_postal DESC, country_code ASC;`,
    expected: `SELECT
  country_code,
  COUNT(*) AS total_clientes,
  COUNT(postal_code) AS con_codigo_postal,
  COUNT(*) - COUNT(postal_code) AS sin_codigo_postal
FROM customers
GROUP BY country_code
ORDER BY sin_codigo_postal DESC, country_code ASC;`,
    orderMatters: true,
    blanks: [{ id: 'b1', answer: 'COUNT(*) - COUNT(postal_code)' }],
    hints: [
      'Recuerda que `COUNT(*)` cuenta todas las filas del grupo y `COUNT(postal_code)` cuenta solo las filas donde `postal_code` no es `NULL`.',
      'Reemplaza `0 AS sin_codigo_postal` por `COUNT(*) - COUNT(postal_code) AS sin_codigo_postal`.',
      'Conserva `GROUP BY country_code` y `ORDER BY sin_codigo_postal DESC, country_code ASC`.',
    ],
    solution: `SELECT
  country_code,
  COUNT(*) AS total_clientes,
  COUNT(postal_code) AS con_codigo_postal,
  COUNT(*) - COUNT(postal_code) AS sin_codigo_postal
FROM customers
GROUP BY country_code
ORDER BY sin_codigo_postal DESC, country_code ASC;`,
    solutionExplanation:
      'La diferencia `COUNT(*) - COUNT(postal_code)` mide exactamente cuántos registros tienen `postal_code IS NULL` en cada país (37 en ES y PE; 36 en AR, CL, CO y MX).',
    expectedOutputTable: [
      {
        country_code: 'ES',
        total_clientes: 400,
        con_codigo_postal: 363,
        sin_codigo_postal: 37,
      },
      {
        country_code: 'PE',
        total_clientes: 400,
        con_codigo_postal: 363,
        sin_codigo_postal: 37,
      },
      {
        country_code: 'AR',
        total_clientes: 400,
        con_codigo_postal: 364,
        sin_codigo_postal: 36,
      },
      {
        country_code: 'CL',
        total_clientes: 400,
        con_codigo_postal: 364,
        sin_codigo_postal: 36,
      },
      {
        country_code: 'CO',
        total_clientes: 400,
        con_codigo_postal: 364,
        sin_codigo_postal: 36,
      },
      {
        country_code: 'MX',
        total_clientes: 400,
        con_codigo_postal: 364,
        sin_codigo_postal: 36,
      },
    ],
  },

  roleNotes: {
    de: 'En Ingeniería de Datos declaras restricciones NOT NULL en las claves primarias y conviertes cadenas como "N/A" o "" a NULL real durante la ingesta con NULLIF.',
    da: 'En Análisis de Datos compruebas la proporción de nulos antes de calcular un promedio o entrenar un modelo: confundir NULL con cero sesga las distribuciones.',
    bi: 'En Business Intelligence usas COALESCE en las dimensiones para mostrar "Sin campaña" o "No registrado" en los filtros visuales, sin alterar con ceros falsos las medidas numéricas del modelo semántico.',
  },

  summary: [
    'NULL representa un dato desconocido o ausente; no es el número 0 ni el texto vacío "".',
    'Comparar con = NULL o <> NULL devuelve UNKNOWN y la cláusula WHERE descarta la fila.',
    'Usa siempre IS NULL e IS NOT NULL para filtrar valores ausentes.',
    'COUNT(*) cuenta todas las filas; COUNT(columna) y AVG(columna) ignoran los valores NULL.',
  ],

  flashcards: [
    {
      id: 'fc-c0-datos-02-a',
      front: '¿Por qué `WHERE postal_code = NULL` devuelve siempre 0 filas aunque existan nulos?',
      back: 'Porque en la lógica de tres valores de SQL cualquier comparación con `=` frente a `NULL` evalúa a `UNKNOWN`, y `WHERE` solo conserva filas con resultado `TRUE`.',
    },
    {
      id: 'fc-c0-datos-02-b',
      front: '¿Cuál es la diferencia entre `COUNT(*)` y `COUNT(postal_code)`?',
      back: '`COUNT(*)` cuenta todas las filas de la tabla; `COUNT(postal_code)` cuenta únicamente las filas donde `postal_code` no es `NULL`.',
    },
    {
      id: 'fc-c0-datos-02-c',
      front: '¿Qué hace la expresión `COALESCE(campaign_id, \'ORGANICO\')`?',
      back: 'Devuelve el valor de `campaign_id` si está presente, o el texto `\'ORGANICO\'` cuando `campaign_id` es `NULL`.',
    },
  ],

  glossaryTerms: ['c0-valor-null', 'c0-logica-trivalente'],

  sources: [
    {
      title: 'PostgreSQL 17 Documentation — Section 9.2: Comparison Functions and Operators (IS NULL, COALESCE, NULLIF)',
      url: 'https://www.postgresql.org/docs/current/functions-comparison.html',
      publisher: 'PostgreSQL Global Development Group',
      accessed: '2026-10-29',
      supports:
        'Comportamiento de los predicados IS NULL e IS NOT NULL bajo lógica de tres valores y sustitución con COALESCE.',
    },
    {
      title: 'DuckDB Documentation — Null Values and Aggregate Functions',
      url: 'https://duckdb.org/docs/sql/data_types/nulls.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports:
        'Propagación de NULL en expresiones aritméticas y exclusión de valores nulos en COUNT(col) y AVG(col).',
    },
    {
      title: 'E. F. Codd — Extending the Database Relational Model to Capture More Meaning (ACM TODS)',
      url: 'https://dl.acm.org/doi/10.1145/320107.320109',
      publisher: 'Association for Computing Machinery (ACM)',
      accessed: '2026-10-29',
      supports:
        'Definición formal del marcador de valor ausente y tablas de verdad de la lógica trivalente en el modelo relacional.',
    },
  ],

  aiNotes:
    'Quien empieza en Nivel 0 suele asumir que `= NULL` funciona igual que `= 0`, o no advierte que `WHERE campaign_id <> \'X\'` elimina también las filas con `NULL`. Explícale con una tabla pequeña de 3 o 4 filas cómo `UNKNOWN` es descartado por `WHERE`.',
};

export default lesson;
