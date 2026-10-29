const lesson = {
  id: 'c0-datos-05-tablas-grano',
  moduleId: 'c0-datos',
  tracks: ['core'],
  level: 0,
  order: 5,
  title: 'Tablas: filas, columnas, claves y qué significa el grano',
  subtitle: 'Cómo definir qué representa exactamente cada fila antes de sumar o cruzar información',
  minutes: 20,
  prerequisites: ['c0-datos-04-utf8-separadores'],
  contentVersion: 1,

  hook: 'Durante el cierre trimestral de Mercado Brisa, dos personas del equipo de análisis presentan cifras opuestas sobre el volumen de ventas. Una afirma que hubo 18 000 pedidos y la otra asegura que fueron 42 000 operaciones, aunque ambas consultaron la misma base de datos sin errores de sintaxis. ¿Cómo es posible que dos conteos limpios produzcan resultados tan distantes y qué pregunta olvidaron hacerse antes de escribir su consulta?',

  objectives: [
    'Distinguir el papel de las filas, las columnas, la clave primaria y la clave foránea dentro de una tabla relacional.',
    'Definir con precisión el grano de una tabla (qué representa exactamente una fila individual) siguiendo el método de Kimball.',
    'Auditar empíricamente el grano de cualquier tabla comparando `COUNT(*)` frente a `COUNT(DISTINCT columna_clave)` antes de sumar.',
  ],

  sections: [
    {
      id: 'filas-columnas-y-claves',
      heading: 'Filas, columnas, clave primaria y clave foránea',
      body: 'En una base de datos relacional, la información se organiza en tablas bidimensionales compuestas por filas y columnas. Cada columna representa un atributo específico con un tipo de dato fijo, como `order_date` o `total_usd`. Por su parte, cada fila o registro describe una ocurrencia individual del mundo real.\n\nPara distinguir una fila de otra sin ambigüedad necesitamos una **clave primaria** (*primary key*). Es una columna cuyo valor es único para cada fila y nunca puede ser `NULL`. Por ejemplo, en la tabla `customers`, la columna `customer_id` identifica a cada uno de los 2400 clientes de Mercado Brisa.\n\nCuando esa misma columna `customer_id` aparece dentro de la tabla `orders` para indicar quién compró, actúa como una **clave foránea** (*foreign key*). Las claves primarias y foráneas conectan las tablas del negocio sin repetir los datos personales del cliente en cada pedido.',
    },
    {
      id: 'que-es-el-grano',
      heading: 'Qué es el grano de una tabla y por qué evita duplicar importes',
      body: 'Declarar el **grano** (*grain*) de una tabla significa responder en una sola frase qué representa exactamente una fila individual. En el método de modelado de Ralph Kimball, declarar el grano es el primer paso obligatorio antes de elegir métricas o escribir consultas.\n\nEn Mercado Brisa conviven tablas con granos muy distintos dentro del mismo proceso de venta. En la tabla `orders`, el grano es **una fila por pedido**: hay `18 000` filas y `order_id` nunca se repite. En cambio, en la tabla `order_items`, el grano es **una fila por cada línea de producto dentro de un pedido**: hay `42 000` filas repartidas entre los mismos `18 000` pedidos.\n\nSi alguien cuenta las filas de `order_items` creyendo que cuenta pedidos, inflará el volumen real más del doble. Y si une ambas tablas fila a fila sin respetar sus granos, el importe de cabecera (`total_usd`) se multiplicará tantas veces como líneas tenga el pedido.',
      interactive: {
        component: 'join-grain',
        caption: 'Observa cómo una fila de cabecera (pedido) se relaciona con varias filas de detalle (líneas de producto) y por qué mezclar ambos granos multiplica los importes.',
      },
      example: {
        language: 'sql',
        code: `SELECT
  (SELECT COUNT(*) FROM orders) AS filas_orders,
  (SELECT COUNT(DISTINCT order_id) FROM orders) AS claves_unicas_orders,
  (SELECT COUNT(*) FROM order_items) AS filas_order_items,
  (SELECT COUNT(DISTINCT order_id) FROM order_items) AS pedidos_en_order_items;`,
        expectedOutput: [
          {
            filas_orders: 18000,
            claves_unicas_orders: 18000,
            filas_order_items: 42000,
            pedidos_en_order_items: 18000,
          },
        ],
      },
    },
    {
      id: 'auditar-grano-con-sql',
      heading: 'Cómo auditar empíricamente el grano antes de sumar',
      body: 'Nunca debes adivinar el grano de una tabla por su nombre: debes verificarlo con una consulta de auditoría antes de construir cualquier reporte. La prueba estándar consiste en comparar el número total de filas `COUNT(*)` frente al conteo de valores únicos de la supuesta clave con `COUNT(DISTINCT columna_clave)`.\n\nSi ambos números son idénticos, esa columna define el grano de la tabla. Si `COUNT(*)` es mayor que `COUNT(DISTINCT columna_clave)`, entonces cada entidad aparece en varias filas.\n\nEso ocurre en la tabla `payments` de Mercado Brisa. Muchas personas asumen que hay un pago por pedido, pero su grano real es **un intento o notificación de cobro por fila**. La tabla tiene `19 200` filas para `18 000` pedidos porque registra segundos intentos (`attempt_number = 2`) y notificaciones repetidas del procesador de pagos.',
    },
  ],

  workedExample: {
    title: 'Auditoría empírica del grano en la tabla payments de Mercado Brisa',
    description:
      'Verifica con SQL por qué `payments` tiene más filas que pedidos únicos (`order_id`) y desglosa los registros por número de intento (`attempt_number`) y estado (`status`).',
    steps: [
      {
        label: 'Paso 1: Comparar el total de filas frente a los pedidos únicos en payments',
        explanation:
          'Ejecutamos `COUNT(*)` y `COUNT(DISTINCT order_id)` sobre `payments`. Obtenemos 19 200 filas totales para 18 000 pedidos distintos, lo que demuestra que existen 1200 filas adicionales y que `order_id` no es clave única en esta tabla.',
        code: `SELECT
  COUNT(*) AS filas_totales_payments,
  COUNT(DISTINCT order_id) AS pedidos_distintos,
  COUNT(*) - COUNT(DISTINCT order_id) AS filas_adicionales_por_pedido
FROM payments;`,
        expectedOutput: [
          {
            filas_totales_payments: 19200,
            pedidos_distintos: 18000,
            filas_adicionales_por_pedido: 1200,
          },
        ],
      },
      {
        label: 'Paso 2: Desglosar payments por estado y número de intento de cobro',
        explanation:
          'Agrupamos por `status` y `attempt_number`. Vemos que 750 filas corresponden a segundos intentos de pago (`attempt_number = 2`) y otras 450 filas son notificaciones duplicadas dentro del intento 1 (`15 930 - 15 525 = 405` en `captured`, más `27` en `failed` y `18` en `pending`).',
        code: `SELECT
  status,
  attempt_number,
  COUNT(*) AS total_intentos,
  COUNT(DISTINCT order_id) AS pedidos_distintos
FROM payments
GROUP BY status, attempt_number
ORDER BY total_intentos DESC;`,
        expectedOutput: [
          {
            status: 'captured',
            attempt_number: 1,
            total_intentos: 15930,
            pedidos_distintos: 15525,
          },
          {
            status: 'failed',
            attempt_number: 1,
            total_intentos: 1812,
            pedidos_distintos: 1785,
          },
          {
            status: 'pending',
            attempt_number: 1,
            total_intentos: 708,
            pedidos_distintos: 690,
          },
          {
            status: 'captured',
            attempt_number: 2,
            total_intentos: 675,
            pedidos_distintos: 675,
          },
          {
            status: 'failed',
            attempt_number: 2,
            total_intentos: 45,
            pedidos_distintos: 45,
          },
          {
            status: 'pending',
            attempt_number: 2,
            total_intentos: 30,
            pedidos_distintos: 30,
          },
        ],
      },
    ],
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt:
        '¿Qué dos propiedades debe cumplir obligatoriamente una columna para ser la clave primaria (`primary key`) de una tabla?',
      options: [
        {
          id: 'a',
          text: 'Sus valores no pueden repetirse en ninguna otra fila (unicidad) y ninguna fila puede tenerla vacía o en NULL.',
          correct: true,
          feedback:
            'Exacto. Unicidad estricta y ausencia total de NULL son las dos condiciones que permiten identificar cada fila sin ambigüedad.',
        },
        {
          id: 'b',
          text: 'Debe contener únicamente texto en mayúsculas y medir menos de diez caracteres.',
          correct: false,
          feedback:
            'Incorrecto. Muchas claves primarias son números enteros (como order_id o customer_id), no textos.',
        },
        {
          id: 'c',
          text: 'Debe repetirse al menos dos veces por cada cliente registrado.',
          correct: false,
          feedback:
            'Incorrecto. Si se repite en más de una fila deja de ser única y no puede ser clave primaria simple.',
        },
      ],
      explanation:
        'Una clave primaria garantiza que cada registro de la tabla sea identificable de forma única e inequívoca; si admitiera duplicados o valores NULL, sería imposible distinguir dos filas entre sí.',
    },
    {
      id: 'c2',
      type: 'predict-output',
      prompt:
        'Ejecutas `SELECT COUNT(*), COUNT(DISTINCT order_id) FROM payments` y obtienes `19 200` filas totales pero solo `18 000` valores distintos de `order_id`. ¿Qué demuestra este resultado?',
      options: [
        {
          id: 'a',
          text: 'Que el grano de payments NO es un pedido por fila, porque existen pedidos con más de un registro de pago.',
          correct: true,
          feedback:
            'Correcto. Cuando COUNT(*) supera a COUNT(DISTINCT order_id), queda probado que order_id se repite en múltiples filas.',
        },
        {
          id: 'b',
          text: 'Que order_id es la clave primaria estricta de la tabla payments.',
          correct: false,
          feedback:
            'Incorrecto. Si order_id fuera la clave primaria de payments, COUNT(*) y COUNT(DISTINCT order_id) serían iguales.',
        },
        {
          id: 'c',
          text: 'Que faltan 1200 pedidos en la tabla orders.',
          correct: false,
          feedback:
            'Incorrecto. Los pedidos únicos siguen siendo 18 000; las 1200 filas adicionales son reintentos y webhooks duplicados.',
        },
      ],
      explanation:
        'Comparar COUNT(*) frente a COUNT(DISTINCT columna) es la prueba empírica de grano: si el total de filas es mayor, cada entidad tiene varios registros en la tabla.',
    },
    {
      id: 'c3',
      type: 'fill-code',
      prompt:
        'Completa la consulta para verificar cuántos pedidos únicos (`order_id`) existen dentro de las 42 000 filas de `order_items`:',
      template:
        'SELECT COUNT(*) AS total_lineas, COUNT({{b1}} {{b2}}) AS pedidos_unicos FROM order_items;',
      blanks: [
        { id: 'b1', accepted: ['DISTINCT', 'distinct'] },
        { id: 'b2', accepted: ['order_id', 'ORDER_ID'] },
      ],
      explanation:
        'La expresión COUNT(DISTINCT order_id) cuenta cada identificador de pedido una sola vez, revelando que las 42 000 líneas pertenecen a 18 000 pedidos.',
    },
  ],

  practice: {
    type: 'sql',
    title: 'Auditoría de grano por número de línea en order_items',
    language: 'sql',
    prompt:
      'Agrupa la tabla `order_items` de Mercado Brisa por número de línea (`line_number`). Calcula para cada línea el conteo de filas `total_filas`, el número de pedidos únicos `pedidos_distintos` (`COUNT(DISTINCT order_id)`) y el importe promedio redondeado a 2 decimales `importe_medio_usd` (`ROUND(AVG(line_total_usd), 2)`). Ordena por `line_number ASC`.',
    starterCode: `SELECT
  line_number,
  COUNT(*) AS total_filas,
  -- TODO: Cuenta los pedidos únicos (order_id) en cada número de línea
  ___ AS pedidos_distintos,
  ROUND(AVG(line_total_usd), 2) AS importe_medio_usd
FROM order_items
GROUP BY line_number
ORDER BY line_number ASC;`,
    expected: `SELECT
  line_number,
  COUNT(*) AS total_filas,
  COUNT(DISTINCT order_id) AS pedidos_distintos,
  ROUND(AVG(line_total_usd), 2) AS importe_medio_usd
FROM order_items
GROUP BY line_number
ORDER BY line_number ASC;`,
    orderMatters: true,
    blanks: [{ id: 'b1', answer: 'COUNT(DISTINCT order_id)' }],
    hints: [
      'Para contar cuántos pedidos únicos tienen cada número de línea sin repetirlos, usa `COUNT(DISTINCT order_id)`.',
      'Sustituye `___` por `COUNT(DISTINCT order_id)` manteniendo el alias `AS pedidos_distintos`.',
      'Conserva `GROUP BY line_number` y `ORDER BY line_number ASC` para obtener las 4 filas de resultado.',
    ],
    solution: `SELECT
  line_number,
  COUNT(*) AS total_filas,
  COUNT(DISTINCT order_id) AS pedidos_distintos,
  ROUND(AVG(line_total_usd), 2) AS importe_medio_usd
FROM order_items
GROUP BY line_number
ORDER BY line_number ASC;`,
    solutionExplanation:
      'Al agrupar por `line_number`, comprobamos que dentro de cada número de línea `total_filas` coincide con `pedidos_distintos`: los 18 000 pedidos tienen línea 1, 12 000 tienen línea 2, 9000 tienen línea 3 y 3000 alcanzan la línea 4 (`18 000 + 12 000 + 9000 + 3000 = 42 000` filas).',
    expectedOutputTable: [
      {
        line_number: 1,
        total_filas: 18000,
        pedidos_distintos: 18000,
        importe_medio_usd: 167.01,
      },
      {
        line_number: 2,
        total_filas: 12000,
        pedidos_distintos: 12000,
        importe_medio_usd: 153.37,
      },
      {
        line_number: 3,
        total_filas: 9000,
        pedidos_distintos: 9000,
        importe_medio_usd: 153.84,
      },
      {
        line_number: 4,
        total_filas: 3000,
        pedidos_distintos: 3000,
        importe_medio_usd: 150.41,
      },
    ],
  },

  roleNotes: {
    de: 'En Ingeniería de Datos documentas explícitamente la clave primaria simple o compuesta que define el grano de cada tabla en el catálogo y configuras pruebas automáticas de unicidad en cada carga.',
    da: 'En Análisis de Datos inicias siempre la exploración de una tabla desconocida ejecutando COUNT(*) y COUNT(DISTINCT clave) para verificar qué representa cada fila antes de sumar importes.',
    bi: 'En Business Intelligence verificas si una tabla de hechos está a grano de cabecera de pedido o de línea de producto antes de definir medidas, evitando duplicar ingresos al cruzar dimensiones.',
  },

  summary: [
    'Una tabla organiza los datos en columnas con tipo fijo y filas identificadas por una clave primaria única y sin NULL.',
    'Una clave foránea conecta una tabla con la clave primaria de otra entidad sin repetir atributos.',
    'El grano declara en una frase exacta qué representa una fila individual (por ejemplo, un pedido o una línea).',
    'Comparar COUNT(*) con COUNT(DISTINCT clave) verifica empíricamente el grano antes de sumar o unir tablas.',
  ],

  flashcards: [
    {
      id: 'fc-c0-datos-05-a',
      front: '¿Qué significa declarar el grano de una tabla?',
      back: 'Definir con exactitud qué representa una sola fila de esa tabla (por ejemplo: "una fila por pedido" en orders frente a "una fila por línea de pedido" en order_items).',
    },
    {
      id: 'fc-c0-datos-05-b',
      front: '¿Cómo compruebas con SQL si la columna `order_id` es única en una tabla?',
      back: 'Comparando `COUNT(*)` con `COUNT(DISTINCT order_id)`: si el total de filas es mayor que los valores distintos, `order_id` se repite.',
    },
    {
      id: 'fc-c0-datos-05-c',
      front: '¿Cuál es la diferencia entre clave primaria y clave foránea?',
      back: 'La clave primaria identifica de forma única cada fila en su propia tabla (sin NULL ni repetidos); la clave foránea referencia la clave primaria de otra tabla para relacionarlas.',
    },
  ],

  glossaryTerms: ['c0-clave-primaria', 'c0-grano-tabla'],

  sources: [
    {
      title: 'Kimball Group — Dimensional Modeling Techniques: Declare the Grain',
      url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/grain/',
      publisher: 'Kimball Group',
      accessed: '2026-10-29',
      supports:
        'Definición metodológica del grano como contrato de lo que representa una fila individual de una tabla y regla de no mezclar granos en una misma consulta.',
    },
    {
      title: 'PostgreSQL 17 Documentation — Section 5.4: Constraints (Primary Keys and Foreign Keys)',
      url: 'https://www.postgresql.org/docs/current/ddl-constraints.html',
      publisher: 'PostgreSQL Global Development Group',
      accessed: '2026-10-29',
      supports:
        'Reglas formales de unicidad y no nulidad en claves primarias (PRIMARY KEY) e integridad referencial en claves foráneas (FOREIGN KEY).',
    },
    {
      title: 'DuckDB Documentation — Aggregate Functions (COUNT and DISTINCT)',
      url: 'https://duckdb.org/docs/sql/functions/aggregates.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports:
        'Uso de COUNT(*) frente a COUNT(DISTINCT expr) para auditar la cardinalidad y el grano real de una tabla en SQL.',
    },
  ],

  aiNotes:
    'Quien empieza desde cero suele confundir el número de filas de una tabla con el número de clientes o pedidos. Si duda sobre qué es el grano, pídele que complete la frase "En esta tabla, cada fila es un..." para `orders`, `order_items` y `payments`.',
};

export default lesson;
