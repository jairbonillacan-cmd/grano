const lesson = {
  id: 'c1-sql-base-05-case-when-filter',
  moduleId: 'c1-sql-base',
  tracks: ['core'],
  level: 1,
  order: 5,
  title: 'Expresiones condicionales con CASE WHEN y cláusula FILTER',
  minutes: 20,
  prerequisites: ['c1-sql-base-04-groupby-having'],
  contentVersion: 1,
  hook: 'El equipo de promociones de Mercado Brisa pregunta cuál es el descuento medio en dólares de los pedidos que efectivamente recibieron un cupón (`discount_usd > 0`), desglosado por tipo de dispositivo. Un analista escribe `AVG(CASE WHEN discount_usd > 0 THEN discount_usd ELSE 0 END)` y reporta que el descuento medio es de apenas 4 USD, cuando en realidad supera los 18 USD. ¿Por qué el `ELSE 0` hundió el promedio y cómo lo evita la cláusula `FILTER`?',
  objectives: [
    'Clasificar filas en tramos mutuamente excluyentes con CASE WHEN ... THEN ... ELSE ... END comprendiendo su evaluación en cortocircuito.',
    'Construir tablas resumen con múltiples columnas condicionales en una sola pasada usando SUM(CASE WHEN ...) y FILTER (WHERE ...).',
    'Evitar la distorsión del denominador en promedios condicionales omitiendo ELSE 0 o empleando AVG(...) FILTER (WHERE ...).'
  ],
  sections: [
    {
      id: 'evaluacion-secuencial-case-when',
      heading: 'Cómo evalúa CASE WHEN las ramas en orden y qué devuelve sin ELSE',
      body: 'La expresión **CASE WHEN** es el condicional `if / else if / else` de SQL. Evalúa sus cláusulas `WHEN condicion THEN resultado` de arriba abajo para cada fila y se detiene en la primera condición que resulte verdadera (evaluación en cortocircuito). Si ninguna rama `WHEN` se cumple, devuelve el valor indicado en `ELSE`; y si omitiste la cláusula `ELSE`, devuelve `NULL` de manera automática.\n\nPor esa evaluación en cortocircuito el orden de las ramas importa. Al segmentar precios en la tabla `products` de Mercado Brisa, si colocas primero `WHEN list_price_usd < 100` y debajo `WHEN list_price_usd < 40`, ningún producto llegará jamás a la segunda rama porque todo número menor que 40 ya entró en `< 100`. Ordena siempre los umbrales de forma estrictamente creciente (o decreciente) y prefija las etiquetas con `1.`, `2.`, `3.` para que `ORDER BY` respete la jerarquía lógica en lugar del orden alfabético.',
      example: {
        language: 'sql',
        code: `SELECT
  CASE
    WHEN list_price_usd < 0 THEN '1. Anomalía (< 0 USD)'
    WHEN list_price_usd < 40 THEN '2. Entrada (< 40 USD)'
    WHEN list_price_usd <= 100 THEN '3. Estándar (40-100 USD)'
    ELSE '4. Especialidad (> 100 USD)'
  END AS price_tier,
  COUNT(*) AS total_skus
FROM products
GROUP BY price_tier
ORDER BY price_tier ASC;`,
        expectedOutput: [
          { price_tier: '1. Anomalía (< 0 USD)', total_skus: 1 },
          { price_tier: '2. Entrada (< 40 USD)', total_skus: 62 },
          { price_tier: '3. Estándar (40-100 USD)', total_skus: 69 },
          { price_tier: '4. Especialidad (> 100 USD)', total_skus: 48 }
        ]
      }
    },
    {
      id: 'agregacion-condicional-pivotado',
      heading: 'De filas a columnas: agregación condicional en una sola lectura',
      body: 'Con `GROUP BY status` obtienes una fila por cada estado de pedido. Pero en los reportes operativos suele necesitarse una fila por canal (`device_type`) y varias columnas al lado: total de pedidos, pedidos completados, pedidos reembolsados e ingreso completado. Ejecutar cuatro consultas separadas y unirlas después es innecesario.\n\nPuedes resolverlo en una sola pasada combinando funciones de agregación con condiciones. El patrón clásico en cualquier dialecto SQL consiste en meter `CASE WHEN` dentro de `SUM`: `SUM(CASE WHEN status = \'completed\' THEN 1 ELSE 0 END)` suma un `1` cuando el pedido está completado y un `0` en caso contrario. Del mismo modo, `SUM(CASE WHEN status = \'completed\' THEN total_usd ELSE 0 END)` acumula únicamente el importe de las ventas completadas.'
    },
    {
      id: 'clausula-estandar-filter-where',
      heading: 'La cláusula FILTER (WHERE ...): agregación condicional legible',
      body: 'El estándar SQL:2003 introdujo la **cláusula FILTER**, soportada de forma nativa en DuckDB, PostgreSQL 17 y SQLite: `funcion_agregada(expresion) FILTER (WHERE condicion)`. En lugar de escribir `SUM(CASE WHEN status = \'completed\' THEN 1 ELSE 0 END)`, escribes directamente `COUNT(*) FILTER (WHERE status = \'completed\')`.\n\n`FILTER (WHERE ...)` aporta tres ventajas claras frente a anidar `CASE WHEN`:\n\n1. Separa qué quieres calcular (`COUNT(*)`, `SUM(total_usd)`, `AVG(discount_usd)`) de qué filas deben entrar al cálculo (`WHERE status = \'completed\'`).\n2. Funciona con cualquier función de agregación, incluyendo `COUNT(DISTINCT customer_id) FILTER (WHERE status = \'completed\')`.\n3. Evita por construcción el error del `ELSE 0` en promedios (`AVG`) y mínimos (`MIN`).'
    },
    {
      id: 'trampa-del-else-cero-en-avg',
      heading: 'Por qué ELSE 0 dentro de AVG o MIN falsea los indicadores',
      body: 'En una suma (`SUM`), sumar cero no altera el resultado. En cambio, en un promedio (`AVG`) o en un mínimo (`MIN`), un cero cuenta como una observación real más. Como vimos en la Lección 4, `AVG` ignora los valores `NULL`, pero nunca ignora los ceros.\n\nEn Mercado Brisa, solo alrededor del 22 % de los pedidos llevan cupón de descuento; el 78 % restante tiene `discount_usd = 0`. Si quieres el descuento medio de quienes usaron cupón y escribes `AVG(CASE WHEN discount_usd > 0 THEN discount_usd ELSE 0 END)`, el motor divide la suma de descuentos entre el 100 % de los pedidos en vez de dividir entre el 22 % con cupón. Con `AVG(discount_usd) FILTER (WHERE discount_usd > 0)` (o con `AVG(CASE WHEN discount_usd > 0 THEN discount_usd END)` sin `ELSE 0`), los pedidos sin cupón quedan excluidos del denominador y obtienes el promedio real.'
    }
  ],
  workedExample: {
    title: 'Descuento medio en pedidos con cupón: la trampa de ELSE 0 en AVG frente a FILTER',
    description: 'En los pedidos completados de Mercado Brisa, queremos medir de cuánto es el descuento promedio cuando el cliente aplica un cupón (`discount_usd > 0`). Compara ambas expresiones por canal.',
    steps: [
      {
        label: 'Antipatrón: AVG(CASE WHEN ... ELSE 0 END) divide entre todos los pedidos',
        explanation: 'Al poner `ELSE 0`, los pedidos que no usaron cupón entran al denominador como `0.00` USD. Eso diluye el descuento medio aparente a ~4 USD en lugar de ~18 USD.',
        code: `SELECT
  device_type,
  COUNT(*) AS completed_orders,
  COUNT(*) FILTER (WHERE discount_usd > 0) AS orders_with_coupon,
  ROUND(AVG(CASE WHEN discount_usd > 0 THEN discount_usd ELSE 0 END), 2) AS avg_discount_wrong_usd
FROM orders
WHERE status = 'completed'
GROUP BY device_type
ORDER BY device_type ASC;`,
        expectedOutput: [
          {
            device_type: 'desktop',
            completed_orders: 6327,
            orders_with_coupon: 1308,
            avg_discount_wrong_usd: 3.58
          },
          {
            device_type: 'mobile',
            completed_orders: 5624,
            orders_with_coupon: 1314,
            avg_discount_wrong_usd: 4.55
          },
          {
            device_type: 'pos_tienda',
            completed_orders: 2809,
            orders_with_coupon: 642,
            avg_discount_wrong_usd: 4.1
          }
        ]
      },
      {
        label: 'Solución verificada: AVG(discount_usd) FILTER (WHERE discount_usd > 0)',
        explanation: 'Con `FILTER (WHERE discount_usd > 0)` (o con `CASE` sin `ELSE`), el denominador de `AVG` cuenta únicamente los pedidos con cupón (`1.308`, `1.314` y `642`) y revela el descuento real de 17 a 19 USD.',
        code: `SELECT
  device_type,
  COUNT(*) AS completed_orders,
  COUNT(*) FILTER (WHERE discount_usd > 0) AS orders_with_coupon,
  ROUND(AVG(discount_usd) FILTER (WHERE discount_usd > 0), 2) AS avg_discount_real_usd
FROM orders
WHERE status = 'completed'
GROUP BY device_type
ORDER BY device_type ASC;`,
        expectedOutput: [
          {
            device_type: 'desktop',
            completed_orders: 6327,
            orders_with_coupon: 1308,
            avg_discount_real_usd: 17.31
          },
          {
            device_type: 'mobile',
            completed_orders: 5624,
            orders_with_coupon: 1314,
            avg_discount_real_usd: 19.48
          },
          {
            device_type: 'pos_tienda',
            completed_orders: 2809,
            orders_with_coupon: 642,
            avg_discount_real_usd: 17.94
          }
        ]
      }
    ]
  },
  checks: [
    {
      id: 'chk-c1-sql-05-cortocircuito',
      type: 'predict-output',
      prompt: 'Para un pedido con `total_usd = 250`, ¿qué devuelve `CASE WHEN total_usd > 100 THEN \'Tramo A\' WHEN total_usd > 200 THEN \'Tramo B\' ELSE \'Tramo C\' END`?',
      options: [
        {
          id: 'a',
          text: '\'Tramo A\', porque CASE evalúa de arriba abajo y se detiene en la primera condición verdadera (`250 > 100`).',
          correct: true,
          feedback: 'Exacto. Como `250 > 100` ya es verdadero en la primera rama WHEN, el motor devuelve \'Tramo A\' y nunca evalúa `> 200`.'
        },
        {
          id: 'b',
          text: '\'Tramo B\', porque `250 > 200` es una condición más específica que `250 > 100`.',
          correct: false,
          feedback: 'Incorrecto. SQL no busca la condición más específica; evalúa en orden estricto de aparición.'
        },
        {
          id: 'c',
          text: 'Un error porque ambas condiciones (`> 100` y `> 200`) son verdaderas al mismo tiempo.',
          correct: false,
          feedback: 'Incorrecto. Que dos condiciones se solapen no produce error sintáctico; simplemente la primera eclipsa a la segunda.'
        }
      ],
      explanation: 'CASE WHEN evalúa en cortocircuito: al ordenar umbrales con `>`, debes colocar primero el umbral más alto (`> 200`) y después `> 100`.'
    },
    {
      id: 'chk-c1-sql-05-avg-else',
      type: 'mcq',
      prompt: '¿Qué diferencia existe entre `AVG(CASE WHEN status = \'refunded\' THEN total_usd END)` y `AVG(CASE WHEN status = \'refunded\' THEN total_usd ELSE 0 END)`?',
      options: [
        {
          id: 'a',
          text: 'La primera promedia solo los pedidos reembolsados (los demás son NULL y se ignoran); la segunda mete ceros y divide entre todos los pedidos de la tabla.',
          correct: true,
          feedback: 'Correcto. Omitir ELSE devuelve NULL para los pedidos no reembolsados, y AVG ignora los NULL en el numerador y en el denominador.'
        },
        {
          id: 'b',
          text: 'Ninguna; ambas devuelven exactamente el mismo promedio.',
          correct: false,
          feedback: 'Incorrecto. En AVG, un 0 incrementa el divisor de filas mientras que un NULL se excluye del cálculo.'
        },
        {
          id: 'c',
          text: 'La primera da `NULL` en toda la columna porque falta la cláusula obligatoria ELSE.',
          correct: false,
          feedback: 'Incorrecto. La cláusula ELSE es opcional en CASE WHEN y su ausencia produce NULL solo en las filas que no cumplen el WHEN.'
        }
      ],
      explanation: 'Dentro de AVG o MIN, usar ELSE 0 contamina el cálculo con ceros artificiales. Usa FILTER (WHERE ...) o deja que CASE devuelva NULL.'
    },
    {
      id: 'chk-c1-sql-05-filter',
      type: 'mcq',
      prompt: '¿A qué expresión clásica equivale `COUNT(*) FILTER (WHERE status = \'completed\')` en una consulta con `GROUP BY`?',
      options: [
        {
          id: 'a',
          text: 'A `SUM(CASE WHEN status = \'completed\' THEN 1 ELSE 0 END)` (o `COUNT(CASE WHEN status = \'completed\' THEN 1 END)`).',
          correct: true,
          feedback: 'Exacto. Ambas cuentan únicamente las filas del grupo donde status es \'completed\' y devuelven 0 si ninguna fila lo cumple.'
        },
        {
          id: 'b',
          text: 'A `COUNT(CASE WHEN status = \'completed\' THEN 1 ELSE 0 END)`.',
          correct: false,
          feedback: 'Cuidado con esta trampa: como COUNT(expr) cuenta todo valor que no sea NULL, ¡también contaría los 0 del ELSE 0!'
        },
        {
          id: 'c',
          text: 'A poner `HAVING status = \'completed\'` al final de la consulta.',
          correct: false,
          feedback: 'Incorrecto. FILTER permite calcular múltiples métricas con distintas condiciones en la misma fila de salida.'
        }
      ],
      explanation: 'Observa por qué `COUNT(CASE ... ELSE 0 END)` es un error clásico: `0` no es `NULL`, así que `COUNT` lo cuenta igual que al `1`. `FILTER (WHERE ...)` evita esa confusión.'
    }
  ],
  practice: {
    type: 'sql',
    title: 'Cuadro resumen de pedidos e ingresos completados por tipo de dispositivo',
    language: 'sql',
    prompt: 'Agrupa la tabla `orders` de Mercado Brisa por `device_type` para construir un resumen en una sola consulta con cinco columnas: `device_type`, `COUNT(*) AS total_orders`, `COUNT(*) FILTER (WHERE status = \'completed\') AS completed_orders`, `COUNT(*) FILTER (WHERE status = \'refunded\') AS refunded_orders` y `ROUND(SUM(total_usd) FILTER (WHERE status = \'completed\'), 2) AS completed_revenue_usd`. Ordena el resultado por `completed_revenue_usd DESC`.',
    starterCode: `SELECT
  device_type,
  COUNT(*) AS total_orders,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed_orders
FROM orders
GROUP BY device_type
ORDER BY total_orders DESC;`,
    expected: `SELECT
  device_type,
  COUNT(*) AS total_orders,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed_orders,
  COUNT(*) FILTER (WHERE status = 'refunded') AS refunded_orders,
  ROUND(SUM(total_usd) FILTER (WHERE status = 'completed'), 2) AS completed_revenue_usd
FROM orders
GROUP BY device_type
ORDER BY completed_revenue_usd DESC;`,
    orderMatters: true,
    hints: [
      'Añade la cuarta columna usando `COUNT(*) FILTER (WHERE status = \'refunded\') AS refunded_orders`.',
      'Añade la quinta columna sumando `total_usd` solo para los completados: `ROUND(SUM(total_usd) FILTER (WHERE status = \'completed\'), 2) AS completed_revenue_usd`.',
      'Cambia el `ORDER BY` final a `ORDER BY completed_revenue_usd DESC`.'
    ],
    solution: `SELECT
  device_type,
  COUNT(*) AS total_orders,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed_orders,
  COUNT(*) FILTER (WHERE status = 'refunded') AS refunded_orders,
  ROUND(SUM(total_usd) FILTER (WHERE status = 'completed'), 2) AS completed_revenue_usd
FROM orders
GROUP BY device_type
ORDER BY completed_revenue_usd DESC;`,
    solutionExplanation: 'No pongas `WHERE status = \'completed\'` a nivel de toda la consulta porque necesitas también `total_orders` y `refunded_orders`. Usa `FILTER (WHERE ...)` en cada métrica individual y ordena por `completed_revenue_usd DESC`.',
    expectedOutputTable: [
      {
        device_type: 'desktop',
        total_orders: 7716,
        completed_orders: 6327,
        refunded_orders: 617,
        completed_revenue_usd: 2867799
      },
      {
        device_type: 'mobile',
        total_orders: 6857,
        completed_orders: 5624,
        refunded_orders: 547,
        completed_revenue_usd: 2199394.23
      },
      {
        device_type: 'pos_tienda',
        total_orders: 3427,
        completed_orders: 2809,
        refunded_orders: 276,
        completed_revenue_usd: 1202269.19
      }
    ]
  },
  roleNotes: {
    de: 'Al construir tablas agregadas diarias (capa Gold o Marts), usar `FILTER (WHERE ...)` permite calcular diez métricas por estado o tipo de evento en un único escaneo de Parquet en lugar de hacer diez lecturas y unirlas con JOIN.',
    da: 'Prefiere `FILTER (WHERE ...)` sobre `CASE WHEN` para todas las agregaciones condicionales en DuckDB y PostgreSQL; reserva `CASE WHEN` para crear columnas categóricas de segmentación (tramos de edad, precio o antigüedad).',
    bi: 'Cuando crees una columna de tramos con `CASE WHEN` (como `< 40 USD`, `40-100 USD`, `> 100 USD`), incluye un prefijo numérico o una columna `tier_order` para que los gráficos de barras no ordenen `> 100` antes que `40-100` por orden alfabético.'
  },
  summary: [
    'CASE WHEN evalúa las condiciones de arriba abajo y devuelve la primera rama verdadera; sin ELSE devuelve NULL.',
    'La cláusula FILTER (WHERE ...) alimenta una función de agregación únicamente con las filas que cumplen la condición.',
    'Nunca uses ELSE 0 dentro de AVG(...) ni de MIN(...), porque el cero entra al cálculo y distorsiona el resultado.',
    'Tampoco uses ELSE 0 dentro de COUNT(CASE ...), ya que COUNT cuenta el número 0 como valor no nulo.'
  ],
  flashcards: [
    {
      id: 'fc-c1-sql-05-a',
      front: '¿Qué valor devuelve una expresión `CASE WHEN ... END` para una fila que no cumple ningún `WHEN` y no tiene cláusula `ELSE`?',
      back: 'Devuelve `NULL`.'
    },
    {
      id: 'fc-c1-sql-05-b',
      front: '¿Por qué `COUNT(CASE WHEN status = \'completed\' THEN 1 ELSE 0 END)` cuenta todas las filas en lugar de solo las completadas?',
      back: 'Porque `COUNT(expresion)` cuenta cualquier valor que no sea `NULL`, y el número `0` no es `NULL`. Debe usarse `COUNT(*) FILTER (WHERE ...)` o `SUM(CASE ... ELSE 0 END)`.'
    },
    {
      id: 'fc-c1-sql-05-c',
      front: '¿Por qué es peligroso poner `ELSE 0` dentro de `AVG(CASE WHEN condicion THEN importe ELSE 0 END)`?',
      back: 'Porque los ceros artificiales se incluyen en el denominador del promedio y hunden el valor resultante.'
    }
  ],
  glossaryTerms: ['agregacion-condicional-filter', 'agregacion-group-by', 'coalesce-nullif'],
  sources: [
    {
      title: 'DuckDB SQL Reference — CASE Statement',
      url: 'https://duckdb.org/docs/stable/sql/expressions/case',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Sintaxis de CASE WHEN, evaluación secuencial en cortocircuito y retorno de NULL por omisión.'
    },
    {
      title: 'DuckDB SQL Reference — FILTER Clause',
      url: 'https://duckdb.org/docs/stable/sql/query_syntax/filter',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Uso de FILTER (WHERE ...) junto a funciones de agregación en DuckDB.'
    },
    {
      title: 'PostgreSQL 17 Documentation — Section 4.2.7: Aggregate Expressions (FILTER)',
      url: 'https://www.postgresql.org/docs/17/sql-expressions.html',
      publisher: 'PostgreSQL Global Development Group',
      accessed: '2026-10-29',
      supports: 'Semántica estándar de FILTER (WHERE filter_clause) en funciones agregadas.'
    },
    {
      title: 'Modern SQL — Aggregate FILTER Clause',
      url: 'https://modern-sql.com/feature/filter',
      publisher: 'Markus Winand',
      accessed: '2026-10-29',
      supports: 'Pivotado de filas a columnas en una sola pasada con FILTER frente a CASE WHEN.'
    }
  ],
  aiNotes: 'Presta especial atención a dos trampas muy frecuentes: 1) escribir `COUNT(CASE WHEN cond THEN 1 ELSE 0 END)` pensando que el `0` no se cuenta; 2) escribir `AVG(CASE WHEN cond THEN val ELSE 0 END)` metiendo ceros en el divisor. Recomienda siempre `FILTER (WHERE ...)` en DuckDB y PostgreSQL.'
};

export default lesson;
