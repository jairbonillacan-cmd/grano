const lesson = {
  id: 'c1-sql-base-01-select-from-where',
  moduleId: 'c1-sql-base',
  tracks: ['core'],
  level: 1,
  order: 1,
  title: 'SELECT, FROM y WHERE: orden lógico frente a escritura',
  minutes: 20,
  prerequisites: ['c0-datos-05'],
  contentVersion: 1,
  hook: 'En Mercado Brisa (empresa ficticia), el equipo comercial pide la lista de productos activos de las categorías Molinos o Cafeteras cuyo precio de lista supere los 185 USD. Alguien escribe una consulta con `OR` y `AND` sin paréntesis y envía un archivo lleno de molinos baratos y descatalogados. Además, intenta filtrar en `WHERE` usando un alias recién creado en `SELECT` y recibe un error en PostgreSQL. ¿En qué orden evalúa realmente el motor una consulta SQL?',
  objectives: [
    'Escribir consultas con SELECT, FROM y WHERE distinguiendo entre el orden de escritura y el orden lógico de evaluación.',
    'Calcular columnas derivadas con alias mediante AS y explicar por qué WHERE se evalúa antes que SELECT en SQL estándar.',
    'Combinar condiciones con AND, OR, IN y BETWEEN usando paréntesis para controlar la precedencia booleana.'
  ],
  sections: [
    {
      id: 'anatomia-consulta-select-from-where',
      heading: 'Cómo extrae y filtra una tabla la terna SELECT, FROM y WHERE',
      body: 'Una consulta SQL sobre una tabla combina tres operaciones relacionales. La cláusula `FROM` indica la tabla de origen y fija el grano inicial de lectura. La cláusula `WHERE` aplica un **predicado** booleano fila por fila y conserva únicamente aquellas donde la condición resulta verdadera. Por último, la cláusula `SELECT` ejecuta la **proyección**: elige qué columnas mostrar o calcula nuevas expresiones aritméticas sin modificar los datos guardados en disco.\n\nEn `SELECT` puedes transformar valores al vuelo y darles un nombre claro con `AS`. Por ejemplo, en la tabla `stores` de Mercado Brisa (empresa ficticia), multiplicar `monthly_target_usd * 12 AS annual_target_usd` genera una columna calculada en el resultado. Evita usar `SELECT *` en reportes o scripts: pedir solo las columnas necesarias documenta qué datos consumes y ahorra lectura en formatos columnares como Parquet.',
      example: {
        language: 'sql',
        code: `SELECT
  store_code,
  store_name,
  city,
  monthly_target_usd,
  monthly_target_usd * 12 AS annual_target_usd
FROM stores
WHERE store_type = 'flagship';`,
        expectedOutput: [
          {
            store_code: 'STR-MX-01',
            store_name: 'Tienda Reforma Norte',
            city: 'Ciudad de México',
            monthly_target_usd: 85000,
            annual_target_usd: 1020000
          },
          {
            store_code: 'STR-CO-01',
            store_name: 'Tienda Chapinero Alto',
            city: 'Bogotá',
            monthly_target_usd: 71000,
            annual_target_usd: 852000
          },
          {
            store_code: 'STR-CL-01',
            store_name: 'Tienda Providencia',
            city: 'Santiago',
            monthly_target_usd: 68000,
            annual_target_usd: 816000
          },
          {
            store_code: 'STR-ES-01',
            store_name: 'Tienda Salamanca',
            city: 'Madrid',
            monthly_target_usd: 78000,
            annual_target_usd: 936000
          }
        ]
      }
    },
    {
      id: 'orden-logico-frente-a-escritura',
      heading: 'Por qué el orden de evaluación no coincide con el de escritura',
      body: 'En SQL siempre escribes `SELECT` en la primera línea, seguido de `FROM` y luego `WHERE`. Sin embargo, el motor ejecuta un **orden lógico de evaluación** distinto: primero resuelve `FROM` para localizar la tabla, en segundo lugar evalúa `WHERE` para descartar filas y recién en tercer lugar calcula las expresiones y los **alias** definidos en `SELECT`.\n\nEsta diferencia explica un fallo clásico. Si defines `list_price_usd - unit_cost_usd AS unit_margin_usd` en `SELECT` y escribes `WHERE unit_margin_usd > 80`, motores compatibles con el estándar ISO como PostgreSQL 17, SQL Server o MySQL rechazan la consulta porque `unit_margin_usd` aún no existe cuando corre `WHERE`. DuckDB incluye una extensión de comodidad que sí resuelve alias de `SELECT` dentro de `WHERE`, pero repetir la expresión (`WHERE list_price_usd - unit_cost_usd > 80`) asegura que tu consulta funcione en cualquier base de datos.'
    },
    {
      id: 'operadores-precedencia-and-or',
      heading: 'Precedencia entre AND y OR: cómo evitar que se cuelen filas',
      body: 'Cuando combinas varias condiciones en `WHERE`, el operador `AND` tiene mayor **precedencia** que `OR`, del mismo modo que la multiplicación se calcula antes que la suma. Si escribes `WHERE category = \'Molinos\' OR category = \'Cafeteras\' AND list_price_usd >= 185`, el motor agrupa primero `category = \'Cafeteras\' AND list_price_usd >= 185`. Como resultado, devuelve las cafeteras caras, pero también todos los molinos del catálogo sin importar su precio ni si están inactivos.\n\nTienes dos formas limpias de impedir este error. La primera es encerrar la disyunción entre paréntesis: `WHERE (category = \'Molinos\' OR category = \'Cafeteras\') AND list_price_usd >= 185`. La segunda, más breve y menos propensa a olvidos cuando comparas la misma columna contra varios valores, es el predicado `IN`: `WHERE category IN (\'Molinos\', \'Cafeteras\') AND list_price_usd >= 185`.'
    },
    {
      id: 'rangos-in-between-y-cadenas',
      heading: 'Comparaciones exactas, rangos con BETWEEN y literales de texto',
      body: 'En SQL estándar las cadenas de texto se escriben entre comillas simples (`\'completed\'`), mientras que las comillas dobles se reservan para identificadores de columnas o tablas. Las comparaciones de texto distinguen mayúsculas y minúsculas (`\'Molinos\'` no coincide con `\'molinos\'`), por lo que conviene inspeccionar los valores reales antes de filtrar.\n\nPara acotar números o fechas dentro de un intervalo cerrado puedes usar `BETWEEN minimo AND maximo`, que equivale exactamente a `columna >= minimo AND columna <= maximo` (ambos extremos incluidos). Por ejemplo, `list_price_usd BETWEEN 40 AND 100` incluye tanto `40.00` como `100.00`. Cuando busques excluir un valor puntual, utiliza el operador de desigualdad estándar `<>` (o su sinónimo `!=` en DuckDB y PostgreSQL).'
    }
  ],
  workedExample: {
    title: 'Filtro de equipamiento caro: OR sin paréntesis frente a agrupación explícita',
    description: 'Queremos listar productos activos de Molinos o Cafeteras en Mercado Brisa con precio de lista de al menos 185 USD. Observa cómo la falta de paréntesis altera las filas devueltas.',
    steps: [
      {
        label: 'Antipatrón: OR sin paréntesis que ignora el filtro de precio e inactivos',
        explanation: 'Al tener `AND` mayor precedencia que `OR`, las condiciones `list_price_usd >= 185` e `is_active = true` solo se aplican a `Cafeteras`. Todos los registros de `Molinos` pasan el filtro aunque cuesten 69.70 USD o estén inactivos (`is_active = false`).',
        code: `SELECT
  sku,
  product_name,
  category,
  list_price_usd,
  is_active
FROM products
WHERE category = 'Molinos'
   OR category = 'Cafeteras'
  AND list_price_usd >= 185
  AND is_active = true
ORDER BY list_price_usd ASC
LIMIT 6;`,
        expectedOutput: [
          {
            sku: 'MB-MOL-112',
            product_name: 'Molinos Antigua Serie 112',
            category: 'Molinos',
            list_price_usd: 69.7,
            is_active: true
          },
          {
            sku: 'MB-MOL-087',
            product_name: 'Molinos Veracruz Serie 87',
            category: 'Molinos',
            list_price_usd: 71.37,
            is_active: true
          },
          {
            sku: 'MB-MOL-047',
            product_name: 'Molinos Veracruz Serie 47',
            category: 'Molinos',
            list_price_usd: 76.2,
            is_active: true
          },
          {
            sku: 'MB-MOL-057',
            product_name: 'Molinos Veracruz Serie 57',
            category: 'Molinos',
            list_price_usd: 88.83,
            is_active: false
          },
          {
            sku: 'MB-MOL-132',
            product_name: 'Molinos Antigua Serie 132',
            category: 'Molinos',
            list_price_usd: 90.49,
            is_active: true
          },
          {
            sku: 'MB-MOL-012',
            product_name: 'Molinos Antigua Serie 12',
            category: 'Molinos',
            list_price_usd: 91.54,
            is_active: true
          }
        ]
      },
      {
        label: 'Solución verificada: paréntesis explícitos (o IN) antes de AND',
        explanation: 'Agrupar las categorías con paréntesis (o con `category IN (\'Molinos\', \'Cafeteras\')`) obliga a que ambas categorías cumplan tanto el precio mínimo de 185 USD como el estado activo.',
        code: `SELECT
  sku,
  product_name,
  category,
  list_price_usd,
  is_active
FROM products
WHERE (category = 'Molinos' OR category = 'Cafeteras')
  AND list_price_usd >= 185
  AND is_active = true
ORDER BY list_price_usd ASC
LIMIT 6;`,
        expectedOutput: [
          {
            sku: 'MB-MOL-052',
            product_name: 'Molinos Antigua Serie 52',
            category: 'Molinos',
            list_price_usd: 186.16,
            is_active: true
          },
          {
            sku: 'MB-MOL-017',
            product_name: 'Molinos Veracruz Serie 17',
            category: 'Molinos',
            list_price_usd: 189.81,
            is_active: true
          },
          {
            sku: 'MB-CAF-098',
            product_name: 'Cafeteras Quindío Serie 98',
            category: 'Cafeteras',
            list_price_usd: 191.62,
            is_active: true
          },
          {
            sku: 'MB-MOL-032',
            product_name: 'Molinos Antigua Serie 32',
            category: 'Molinos',
            list_price_usd: 197.43,
            is_active: true
          },
          {
            sku: 'MB-MOL-072',
            product_name: 'Molinos Antigua Serie 72',
            category: 'Molinos',
            list_price_usd: 209.83,
            is_active: true
          },
          {
            sku: 'MB-MOL-167',
            product_name: 'Molinos Veracruz Serie 167',
            category: 'Molinos',
            list_price_usd: 210.78,
            is_active: true
          }
        ]
      }
    ]
  },
  checks: [
    {
      id: 'chk-c1-sql-01-orden',
      type: 'order',
      prompt: 'Ordena las tres cláusulas según el orden lógico en que un motor SQL estándar las evalúa internamente (de primera a última):',
      items: [
        'SELECT sku, list_price_usd - unit_cost_usd AS margen_usd',
        'FROM products',
        'WHERE is_active = true'
      ],
      correctOrder: ['it-1', 'it-2', 'it-0'],
      explanation: 'El motor primero identifica la tabla con FROM, luego descarta las filas que no cumplen WHERE y finalmente proyecta las columnas y calcula los alias en SELECT.'
    },
    {
      id: 'chk-c1-sql-01-precedencia',
      type: 'predict-output',
      prompt: 'Si ejecutas `SELECT order_id FROM orders WHERE status = \'completed\' OR status = \'refunded\' AND total_usd > 1500;`, ¿qué filas devuelve la consulta?',
      options: [
        {
          id: 'a',
          text: 'Todos los pedidos con status = \'completed\' (de cualquier monto) más los pedidos \'refunded\' mayores a 1500 USD.',
          correct: true,
          feedback: 'Correcto. Como AND se evalúa antes que OR, la condición total_usd > 1500 solo restringe a los pedidos reembolsados.'
        },
        {
          id: 'b',
          text: 'Únicamente los pedidos mayores a 1500 USD cuyo estado sea \'completed\' o \'refunded\'.',
          correct: false,
          feedback: 'Incorrecto. Para lograr ese resultado necesitarías paréntesis alrededor del OR o usar status IN (\'completed\', \'refunded\').'
        },
        {
          id: 'c',
          text: 'Un error de sintaxis porque SQL no permite mezclar OR y AND sin paréntesis.',
          correct: false,
          feedback: 'Incorrecto. La consulta es sintácticamente válida; por eso el error pasa desapercibido si no verificas el conteo.'
        }
      ],
      explanation: 'En lógica booleana SQL, el operador AND liga con más fuerza que OR. Sin paréntesis, la primera rama del OR se aprueba sin comprobar el importe.'
    },
    {
      id: 'chk-c1-sql-01-alias',
      type: 'mcq',
      prompt: '¿Por qué la consulta `SELECT order_id, total_usd - discount_usd AS neto FROM orders WHERE neto > 100` falla en PostgreSQL 17 pero funciona en DuckDB?',
      options: [
        {
          id: 'a',
          text: 'Porque en SQL estándar WHERE se evalúa antes que SELECT y el alias neto aún no existe; DuckDB añade una extensión que lo resuelve.',
          correct: true,
          feedback: 'Exacto. En el estándar ISO SQL, los alias de SELECT recién existen al terminar la proyección, después del filtrado en WHERE.'
        },
        {
          id: 'b',
          text: 'Porque PostgreSQL 17 no soporta restas dentro de la cláusula SELECT.',
          correct: false,
          feedback: 'Incorrecto. PostgreSQL soporta cualquier expresión aritmética en SELECT; lo que restringe es usar ese alias dentro de WHERE.'
        },
        {
          id: 'c',
          text: 'Porque la palabra AS es obligatoria en WHERE cuando se filtra una columna numérica.',
          correct: false,
          feedback: 'Incorrecto. AS solo define alias en SELECT o FROM, nunca dentro de la cláusula WHERE.'
        }
      ],
      explanation: 'Respetar el orden lógico (FROM -> WHERE -> SELECT) y escribir la expresión completa en WHERE garantiza que tus consultas sean portables entre motores.'
    }
  ],
  practice: {
    type: 'sql',
    title: 'Catálogo de equipamiento activo de gama alta y su margen unitario',
    language: 'sql',
    prompt: 'Consulta la tabla `products` de Mercado Brisa para devolver `sku`, `product_name`, `category`, `list_price_usd` y el margen unitario redondeado a dos decimales `ROUND(list_price_usd - unit_cost_usd, 2) AS unit_margin_usd`. Filtra únicamente los productos activos (`is_active = true`) que pertenezcan a las categorías `\'Molinos\'` o `\'Cafeteras\'` y cuyo `list_price_usd` sea mayor o igual a `185`.',
    starterCode: `SELECT
  sku,
  product_name,
  category,
  list_price_usd,
  ROUND(list_price_usd - unit_cost_usd, 2) AS unit_margin_usd
FROM products
WHERE is_active = true
  AND category = 'Molinos';`,
    expected: `SELECT
  sku,
  product_name,
  category,
  list_price_usd,
  ROUND(list_price_usd - unit_cost_usd, 2) AS unit_margin_usd
FROM products
WHERE is_active = true
  AND category IN ('Molinos', 'Cafeteras')
  AND list_price_usd >= 185;`,
    orderMatters: false,
    hints: [
      'Para incluir tanto Molinos como Cafeteras sin errores de precedencia, usa `category IN (\'Molinos\', \'Cafeteras\')` o encierra el `OR` entre paréntesis.',
      'Añade con `AND` la condición `list_price_usd >= 185` manteniendo `is_active = true`.',
      'Conserva las cinco columnas solicitadas con el alias exacto `unit_margin_usd`.'
    ],
    solution: `SELECT
  sku,
  product_name,
  category,
  list_price_usd,
  ROUND(list_price_usd - unit_cost_usd, 2) AS unit_margin_usd
FROM products
WHERE is_active = true
  AND category IN ('Molinos', 'Cafeteras')
  AND list_price_usd >= 185;`,
    solutionExplanation: 'Filtra primero en `WHERE` combinando `is_active = true`, `category IN (\'Molinos\', \'Cafeteras\')` y `list_price_usd >= 185` con `AND`. Luego proyecta las cuatro columnas base y calcula `ROUND(list_price_usd - unit_cost_usd, 2) AS unit_margin_usd`.',
    expectedOutputTable: [
      {
        sku: 'MB-MOL-002',
        product_name: 'Molinos Antigua Serie 2',
        category: 'Molinos',
        list_price_usd: 226.17,
        unit_margin_usd: 95.31
      },
      {
        sku: 'MB-MOL-017',
        product_name: 'Molinos Veracruz Serie 17',
        category: 'Molinos',
        list_price_usd: 189.81,
        unit_margin_usd: 79.71
      },
      {
        sku: 'MB-MOL-032',
        product_name: 'Molinos Antigua Serie 32',
        category: 'Molinos',
        list_price_usd: 197.43,
        unit_margin_usd: 87.97
      },
      {
        sku: 'MB-MOL-052',
        product_name: 'Molinos Antigua Serie 52',
        category: 'Molinos',
        list_price_usd: 186.16,
        unit_margin_usd: 80.04
      },
      {
        sku: 'MB-MOL-072',
        product_name: 'Molinos Antigua Serie 72',
        category: 'Molinos',
        list_price_usd: 209.83,
        unit_margin_usd: 88.32
      },
      {
        sku: 'MB-CAF-098',
        product_name: 'Cafeteras Quindío Serie 98',
        category: 'Cafeteras',
        list_price_usd: 191.62,
        unit_margin_usd: 91.24
      },
      {
        sku: 'MB-MOL-137',
        product_name: 'Molinos Veracruz Serie 137',
        category: 'Molinos',
        list_price_usd: 214.05,
        unit_margin_usd: 100.96
      },
      {
        sku: 'MB-MOL-162',
        product_name: 'Molinos Antigua Serie 162',
        category: 'Molinos',
        list_price_usd: 237.01,
        unit_margin_usd: 102.85
      },
      {
        sku: 'MB-MOL-167',
        product_name: 'Molinos Veracruz Serie 167',
        category: 'Molinos',
        list_price_usd: 210.78,
        unit_margin_usd: 96.8
      },
      {
        sku: 'MB-MOL-172',
        product_name: 'Molinos Antigua Serie 172',
        category: 'Molinos',
        list_price_usd: 223.71,
        unit_margin_usd: 90.61
      }
    ]
  },
  roleNotes: {
    de: 'En tuberías de ingesta sobre archivos Parquet, enumerar solo las columnas necesarias en SELECT y colocar predicados simples en WHERE permite al motor aplicar poda de columnas y salto de bloques físicos sin leer el archivo entero en memoria.',
    da: 'Al explorar una tabla por primera vez, verifica siempre los valores exactos de texto (`status`, `category`) antes de armar filtros compuestos, y usa IN en lugar de cadenas largas de OR para evitar errores de paréntesis.',
    bi: 'Cuando definas vistas de origen para un modelo semántico, bautiza cada expresión calculada con un alias explícito mediante AS; nunca dejes columnas sin nombre que cambien al actualizar el motor SQL.'
  },
  summary: [
    'El orden de escritura es SELECT, FROM, WHERE, pero el orden lógico de evaluación es FROM, WHERE y SELECT.',
    'En SQL estándar, un alias creado con AS en SELECT no puede usarse dentro del WHERE de la misma consulta.',
    'El operador AND se evalúa antes que OR; agrupa siempre las alternativas entre paréntesis o usa el predicado IN.',
    'BETWEEN incluye ambos extremos del intervalo (`>= minimo AND <= maximo`).'
  ],
  flashcards: [
    {
      id: 'fc-c1-sql-01-a',
      front: '¿En qué orden lógico evalúa un motor SQL las cláusulas SELECT, FROM y WHERE?',
      back: 'Primero FROM (identifica la tabla), segundo WHERE (filtra las filas que cumplen la condición) y tercero SELECT (proyecta columnas y calcula alias).'
    },
    {
      id: 'fc-c1-sql-01-b',
      front: '¿Qué ocurre si combinas `A OR B AND C` sin paréntesis en una cláusula WHERE?',
      back: 'Como AND tiene mayor precedencia que OR, el motor evalúa `A OR (B AND C)`, aprobando cualquier fila que cumpla A aunque no cumpla C.'
    },
    {
      id: 'fc-c1-sql-01-c',
      front: '¿A qué expresión equivale exactamente `precio BETWEEN 50 AND 100` en SQL?',
      back: 'Equivale al intervalo cerrado `precio >= 50 AND precio <= 100`, incluyendo ambos valores extremos.'
    }
  ],
  glossaryTerms: ['orden-logico-sql', 'proyeccion-select', 'predicado-where'],
  sources: [
    {
      title: 'DuckDB SQL Reference — SELECT Clause',
      url: 'https://duckdb.org/docs/stable/sql/query_syntax/select',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Proyección de columnas, alias con AS y resolución de alias en DuckDB.'
    },
    {
      title: 'DuckDB SQL Reference — WHERE Clause',
      url: 'https://duckdb.org/docs/stable/sql/query_syntax/where',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Filtrado de filas mediante predicados booleanos tras la cláusula FROM.'
    },
    {
      title: 'PostgreSQL 17 Documentation — Chapter 7.2: Table Expressions',
      url: 'https://www.postgresql.org/docs/17/queries-table-expressions.html',
      publisher: 'PostgreSQL Global Development Group',
      accessed: '2026-10-29',
      supports: 'Orden lógico de evaluación estándar (FROM -> WHERE -> SELECT) y alcance de los alias de salida.'
    },
    {
      title: 'DuckDB SQL Reference — Logical Operators',
      url: 'https://duckdb.org/docs/stable/sql/expressions/logical_operators',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Precedencia de operadores booleanos (NOT > AND > OR) y uso de paréntesis.'
    }
  ],
  aiNotes: 'El alumno suele confundir tres puntos: 1) cree que SELECT se ejecuta primero porque se escribe arriba; 2) olvida paréntesis al mezclar OR con AND, dejando pasar toda la primera rama del OR; 3) usa comillas dobles para texto en lugar de comillas simples. Recuérdale que aunque DuckDB permite usar alias de SELECT en WHERE, en PostgreSQL falla.'
};

export default lesson;
