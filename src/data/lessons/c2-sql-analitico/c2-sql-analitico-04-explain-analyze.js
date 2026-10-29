const lesson = {
  id: 'c2-sql-analitico-04-explain-analyze',
  moduleId: 'c2-sql-analitico',
  tracks: ['core'],
  level: 2,
  order: 4,
  title: 'Leer planes con EXPLAIN ANALYZE: escaneos, filtros y uniones',
  minutes: 25,
  prerequisites: [
    'c2-sql-analitico-01-window-functions',
    'c2-sql-analitico-02-asof-lateral-ctes',
    'c2-sql-analitico-03-zonas-horarias-date-spine',
    'c1-sql-joins-01'
  ],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), un analista filtra enero de 2025 escribiendo `WHERE strftime(order_date, \'%Y-%m\') = \'2025-01\' AND LOWER(status) = \'completed\'`. Enero solo tiene 585 pedidos completados, pero `EXPLAIN ANALYZE` muestra que DuckDB lee las 14 760 filas de `orders.parquet` y las 42 000 de `order_items.parquet`. Al cambiar el filtro por un rango directo (`order_date >= DATE \'2025-01-01\' AND order_date < DATE \'2025-02-01\'`), el escaneo baja a 585 pedidos y 1 408 líneas. ¿Cómo lees un plan de ejecución para evitar escaneos innecesarios?',

  objectives: [
    'Distinguir entre el plan estimado de EXPLAIN y las métricas reales de ejecución de EXPLAIN ANALYZE en motores columnares.',
    'Reescribir predicados no SARGables en rangos directos para activar el empuje de filtros (filter pushdown) sobre Parquet.',
    'Diagnosticar operadores HASH_JOIN, filtros dinámicos y agregaciones en árbol leyendo un plan físico de abajo hacia arriba.'
  ],

  sections: [
    {
      id: 'explain-frente-a-explain-analyze',
      heading: 'EXPLAIN frente a EXPLAIN ANALYZE: leer de abajo hacia arriba',
      body: 'Cuando una consulta analítica tarda demasiado o consume mucha memoria, adivinar dónde está el cuello de botella rara vez funciona. Los motores SQL ofrecen dos comandos de diagnóstico complementarios.\n\n`EXPLAIN` muestra el **plan físico estimado** que eligió el optimizador sin ejecutar la consulta. Es instantáneo, pero sus cardinalidades (`EC: Estimated Cardinality`) son aproximaciones estadísticas. Por su parte, `EXPLAIN ANALYZE` **ejecuta realmente** la consulta. Además, mide en cada operador físico el número exacto de filas procesadas (`Rows`) y el tiempo de CPU.\n\nUn árbol de ejecución se lee siempre **de las hojas inferiores hacia la raíz superior**. En la base aparecen los escaneos de archivos (`READ_PARQUET` o `SEQ_SCAN`). En el centro ocurren las uniones (`HASH_JOIN`, `ASOF_JOIN`) y agregaciones (`HASH_GROUP_BY`). Finalmente, en la cima se aplican los ordenamientos (`ORDER_BY` o `TOP_N`).'
    },
    {
      id: 'empuje-de-predicados-y-consultas-sargables',
      heading: 'Empuje de predicados (Filter Pushdown) y consultas SARGables',
      body: 'En formatos columnares como Parquet (`orders.parquet`, `order_items.parquet`), DuckDB aplica dos optimizaciones en las hojas del plan. Con la **proyección de columnas (*Projection Pushdown*)**, solo descomprime del archivo las columnas mencionadas en la consulta (`order_id`, `order_date`, `total_usd`). Con el **empuje de predicados (*Filter Pushdown*)**, evalúa las condiciones `WHERE` durante la lectura del archivo. Así salta bloques enteros (*row groups*) cuyos valores mínimo y máximo (`zonemaps`) quedan fuera del rango buscado.\n\nSin embargo, si envuelves la columna filtrada en una función —como `WHERE strftime(order_date, \'%Y-%m\') = \'2025-01\'` o `WHERE LOWER(status) = \'completed\'`—, el predicado deja de ser **SARGable** (*Search Argument Able*). El motor debe leer las `14 760` filas completas de `orders` y filtrarlas después en un nodo `FILTER` separado. Al usar comparaciones directas sobre la columna cruda, el filtro baja hasta `READ_PARQUET`.',
      interactive: {
        component: 'parquet-pushdown',
        caption: 'Simulador interactivo: compara el escaneo completo frente a la poda de columnas y bloques (Filter Pushdown con zonemaps) en Parquet.'
      },
      example: {
        language: 'sql',
        code: `SELECT
  COUNT(*) AS pedidos_q1_2025,
  COUNT(DISTINCT customer_id) AS clientes_unicos_q1,
  ROUND(SUM(total_usd), 2) AS ingresos_q1_usd
FROM orders
WHERE status = 'completed'
  AND order_date >= DATE '2025-01-01'
  AND order_date < DATE '2025-04-01';`,
        expectedOutput: [
          {
            pedidos_q1_2025: 1739,
            clientes_unicos_q1: 1196,
            ingresos_q1_usd: 775823.98
          }
        ]
      }
    },
    {
      id: 'anatomia-de-hash-join-y-filtros-dinamicos',
      heading: 'Anatomía de un HASH_JOIN y filtros dinámicos',
      body: 'Para unir dos tablas por igualdad (`ON o.order_id = oi.order_id`), los motores analíticos usan por defecto el operador `HASH_JOIN`. Este operador trabaja en dos fases asimétricas.\n\nEn el **lado derecho (*Build side*)**, el motor toma la entrada más pequeña (por ejemplo, los `585` pedidos completados de enero de 2025). Con ella construye en memoria una tabla hash indexada por `order_id`. En el **lado izquierdo (*Probe side*)**, el motor recorre la tabla más grande (`order_items`, con `42 000` filas) y busca cada `order_id` en la tabla hash.\n\nAdemás, cuando el lado *Build* está muy filtrado, DuckDB genera un **filtro dinámico (*Dynamic Filter Pushdown*)** hacia `order_items.parquet`. Gracias a ese filtro, `READ_PARQUET (order_items)` descarta otros meses durante la lectura y emite solo `1 408` filas en vez de `42 000`.'
    },
    {
      id: 'reducir-cardinalidad-antes-de-unir-dimensiones',
      heading: 'Reducir cardinalidad antes de unir dimensiones y TOP_N',
      body: 'Incluso con filtros dinámicos, el orden en que encadenas las agregaciones afecta el volumen de filas que viaja por el plan físico.\n\nSi necesitas reportar las 5 sucursales (`stores`) con mayor facturación de líneas (`order_items`) en enero de 2025, conviene reducir las `1 408` líneas de productos a tan solo `18` filas (una por tienda) mediante un `GROUP BY store_id` **antes** de unir contra el catálogo `stores` para recuperar `store_code` y `city`.\n\nPor último, al combinar `ORDER BY ingresos_lineas_usd DESC` con `LIMIT 5`, DuckDB sustituye el operador de ordenamiento completo (`ORDER_BY`) por un operador `TOP_N`. Este operador mantiene un montículo (*heap*) de solo 5 elementos en memoria sin ordenar el resto.',
      example: {
        language: 'sql',
        code: `WITH pedidos_enero_2025 AS (
  SELECT order_id, store_id
  FROM orders
  WHERE status = 'completed'
    AND order_date >= DATE '2025-01-01'
    AND order_date < DATE '2025-02-01'
),
lineas_enero_2025 AS (
  SELECT
    p.store_id,
    COUNT(DISTINCT p.order_id) AS pedidos_enero,
    SUM(oi.qty) AS unidades_enero,
    ROUND(SUM(oi.line_total_usd), 2) AS ingresos_lineas_usd
  FROM pedidos_enero_2025 p
  INNER JOIN order_items oi ON p.order_id = oi.order_id
  GROUP BY p.store_id
)
SELECT
  s.store_code,
  s.city,
  l.pedidos_enero,
  l.unidades_enero,
  l.ingresos_lineas_usd
FROM stores s
INNER JOIN lineas_enero_2025 l ON s.store_id = l.store_id
ORDER BY l.ingresos_lineas_usd DESC
LIMIT 5;`,
        expectedOutput: [
          {
            store_code: 'STR-AR-01',
            city: 'Buenos Aires',
            pedidos_enero: 100,
            unidades_enero: 449,
            ingresos_lineas_usd: 35361.33
          },
          {
            store_code: 'STR-PE-01',
            city: 'Lima',
            pedidos_enero: 83,
            unidades_enero: 414,
            ingresos_lineas_usd: 33178.76
          },
          {
            store_code: 'WH-ES-01',
            city: 'Madrid',
            pedidos_enero: 66,
            unidades_enero: 408,
            ingresos_lineas_usd: 31958.24
          },
          {
            store_code: 'STR-CL-02',
            city: 'Santiago',
            pedidos_enero: 46,
            unidades_enero: 303,
            ingresos_lineas_usd: 24452.12
          },
          {
            store_code: 'STR-CO-01',
            city: 'Bogotá',
            pedidos_enero: 62,
            unidades_enero: 259,
            ingresos_lineas_usd: 21776.48
          }
        ]
      }
    }
  ],

  workedExample: {
    title: 'Auditoría y refactorización de una consulta de enero 2025 con EXPLAIN ANALYZE',
    description: 'Compara el plan con funciones no SARGables (`strftime` y `LOWER`) frente al plan con empuje de filtros (`Filter Pushdown`) y filtros dinámicos al cruzar `orders` y `order_items` en enero de 2025:',
    audit: 'Al sustituir strftime(order_date, \'%Y-%m\') = \'2025-01\' por un rango semiabierto de fechas y comparación directa de status, READ_PARQUET reduce las filas emitidas de 14 760 a 585 en orders y de 42 000 a 1 408 en order_items.',
    steps: [
      {
        label: 'Paso 1 — Antipatrón: predicado no SARGable con strftime y LOWER',
        explanation: 'Envolver `order_date` en `strftime` y `status` en `LOWER` impide el Filter Pushdown: `READ_PARQUET` lee las 14 760 filas de `orders` y las filtra después en memoria para quedarse con 585.',
        code: `SELECT
  COUNT(*) AS pedidos_enero,
  ROUND(SUM(total_usd), 2) AS ingresos_enero_usd
FROM orders
WHERE strftime(order_date, '%Y-%m') = '2025-01'
  AND LOWER(status) = 'completed';`,
        expectedOutput: [
          {
            pedidos_enero: 585,
            ingresos_enero_usd: 272339.18
          }
        ]
      },
      {
        label: 'Paso 2 — Solución SARGable: Filter Pushdown y Dynamic Filter en HASH_JOIN',
        explanation: 'Con predicados directos sobre `status` y `order_date`, el filtro baja a `READ_PARQUET (orders)` (585 filas) y el `HASH_JOIN` envía un filtro dinámico a `order_items` que lee solo 1 408 líneas de las 42 000.',
        code: `SELECT
  COUNT(DISTINCT o.order_id) AS pedidos_enero,
  COUNT(oi.order_item_id) AS lineas_leidas,
  SUM(oi.qty) AS unidades_vendidas,
  ROUND(SUM(oi.line_total_usd), 2) AS ingresos_lineas_usd
FROM orders o
INNER JOIN order_items oi ON o.order_id = oi.order_id
WHERE o.status = 'completed'
  AND o.order_date >= DATE '2025-01-01'
  AND o.order_date < DATE '2025-02-01';`,
        expectedOutput: [
          {
            pedidos_enero: 585,
            lineas_leidas: 1408,
            unidades_vendidas: 2946,
            ingresos_lineas_usd: 237640.88
          }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'chk-c2-04-1',
      type: 'mcq',
      prompt: 'Al inspeccionar un nodo `HASH_JOIN` en `EXPLAIN ANALYZE`, observas que el optimizador estimaba `EC: ~3,000` filas, pero el contador real reporta `42,000 Rows` saliendo del escaneo inferior. ¿Por qué necesitas `EXPLAIN ANALYZE` para detectar esta discrepancia?',
      options: [
        {
          id: 'a',
          text: 'Porque EXPLAIN solo muestra estimaciones previas del optimizador sin ejecutar la consulta, mientras que EXPLAIN ANALYZE ejecuta los operadores y mide las filas reales.',
          correct: true,
          feedback: 'Exacto. EXPLAIN se basa en metadatos y heurísticas sin leer los datos; EXPLAIN ANALYZE ejecuta el plan y cronometra cada operador.'
        },
        {
          id: 'b',
          text: 'Porque EXPLAIN omite los operadores HASH_JOIN y solo muestra las tablas de origen.',
          correct: false,
          feedback: 'Incorrecto. EXPLAIN sí muestra todos los operadores del árbol físico, pero solo con cardinalidades estimadas (EC).'
        },
        {
          id: 'c',
          text: 'Porque EXPLAIN ANALYZE reescribe automáticamente el código SQL antes de mostrar el árbol.',
          correct: false,
          feedback: 'Incorrecto. Ambos comandos usan el mismo optimizador; la diferencia es que EXPLAIN ANALYZE ejecuta realmente el plan.'
        }
      ],
      explanation: 'EXPLAIN devuelve el plan estimado al instante; EXPLAIN ANALYZE ejecuta la consulta y contrasta las filas estimadas (EC) contra las filas reales (Rows).'
    },
    {
      id: 'chk-c2-04-2',
      type: 'mcq',
      prompt: '¿Por qué el predicado `WHERE o.order_date >= DATE \'2025-01-01\' AND o.order_date < DATE \'2025-02-01\'` permite saltar bloques en `orders.parquet`, mientras que `WHERE strftime(o.order_date, \'%Y-%m\') = \'2025-01\'` obliga a escanear toda la tabla?',
      options: [
        {
          id: 'a',
          text: 'Porque el rango directo compara la columna cruda contra los metadatos min/max (zonemaps) de Parquet, mientras que strftime obliga a calcular la cadena fila por fila antes de filtrar.',
          correct: true,
          feedback: 'Correcto. Un predicado SARGable deja la columna limpia a un lado del operador para que READ_PARQUET aplique Filter Pushdown.'
        },
        {
          id: 'b',
          text: 'Porque la función strftime convierte el archivo Parquet en un archivo CSV temporal en disco.',
          correct: false,
          feedback: 'Incorrecto. No se crea ningún CSV; el problema es que el motor debe leer toda la columna order_date y evaluar la función en memoria.'
        },
        {
          id: 'c',
          text: 'Porque DuckDB no soporta funciones de fecha dentro de la cláusula WHERE.',
          correct: false,
          feedback: 'Incorrecto. La consulta es válida y devuelve el resultado exacto, pero pierde el empuje de filtros en el almacenamiento.'
        }
      ],
      explanation: 'Evitar funciones sobre la columna filtrada mantiene el predicado SARGable y permite al lector columnar comparar el rango buscado contra los valores mínimo y máximo (zonemaps) de cada bloque Parquet.'
    },
    {
      id: 'chk-c2-04-3',
      type: 'mcq',
      prompt: 'En un `HASH_JOIN` entre `orders` filtrada a un mes (`585` filas) y `order_items` (`42,000` filas), ¿qué tabla coloca el optimizador en el lado *Build* (construcción de la tabla hash en memoria) y por qué?',
      options: [
        {
          id: 'a',
          text: 'La tabla más pequeña tras aplicar filtros (orders con 585 filas), para minimizar la memoria de la tabla hash y empujar filtros dinámicos hacia la tabla grande.',
          correct: true,
          feedback: 'Exacto. Construir la tabla hash sobre la entrada de menor cardinalidad ahorra memoria y permite podar el escaneo del lado Probe con Dynamic Filters.'
        },
        {
          id: 'b',
          text: 'Siempre la tabla que aparece primero en el texto de la cláusula FROM, sin importar su tamaño.',
          correct: false,
          feedback: 'Incorrecto. En un INNER JOIN el optimizador reordena libremente las tablas para que la más pequeña vaya al lado Build.'
        },
        {
          id: 'c',
          text: 'La tabla más grande (order_items con 42,000 filas), porque contiene más claves.',
          correct: false,
          feedback: 'Incorrecto. Indexar la tabla grande en memoria sería mucho más costoso en RAM y CPU.'
        }
      ],
      explanation: 'En un HASH_JOIN, el lado Build construye la tabla hash en memoria con la entrada más pequeña y el lado Probe la consulta con la entrada más grande.'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Refactorización SARGable de ventas por categoría en el Q1 2025',
    language: 'sql',
    prompt: 'Refactoriza la consulta para analizar las ventas por categoría de producto (`products.category`) en el primer trimestre de 2025 (`order_date >= DATE \'2025-01-01\' AND order_date < DATE \'2025-04-01\'`) considerando **únicamente pedidos completados** (`o.status = \'completed\'`) con predicados SARGables. Devuelve `category`, `pedidos_q1` (`COUNT(DISTINCT o.order_id)`), `unidades_q1` (`SUM(oi.qty)`), `ingresos_q1_usd` (`ROUND(SUM(oi.line_total_usd), 2)`) y `pct_ingresos_q1` (porcentaje sobre el total trimestral usando `ROUND(100.0 * SUM(oi.line_total_usd) / SUM(SUM(oi.line_total_usd)) OVER (), 2)`). Ordena por `ingresos_q1_usd` descendente.',
    starterCode: `-- La consulta inicial usa strftime (no SARGable), olvida filtrar status = 'completed' y no calcula pct_ingresos_q1
SELECT
  p.category,
  COUNT(DISTINCT o.order_id) AS pedidos_q1,
  SUM(oi.qty) AS unidades_q1,
  ROUND(SUM(oi.line_total_usd), 2) AS ingresos_q1_usd
FROM orders o
INNER JOIN order_items oi ON o.order_id = oi.order_id
INNER JOIN products p ON oi.product_id = p.product_id
WHERE strftime(o.order_date, '%Y') = '2025'
  AND strftime(o.order_date, '%m') IN ('01', '02', '03')
GROUP BY p.category
ORDER BY ingresos_q1_usd DESC;`,
    expected: `SELECT
  p.category,
  COUNT(DISTINCT o.order_id) AS pedidos_q1,
  SUM(oi.qty) AS unidades_q1,
  ROUND(SUM(oi.line_total_usd), 2) AS ingresos_q1_usd,
  ROUND(
    100.0 * SUM(oi.line_total_usd) / SUM(SUM(oi.line_total_usd)) OVER (),
    2
  ) AS pct_ingresos_q1
FROM orders o
INNER JOIN order_items oi ON o.order_id = oi.order_id
INNER JOIN products p ON oi.product_id = p.product_id
WHERE o.status = 'completed'
  AND o.order_date >= DATE '2025-01-01'
  AND o.order_date < DATE '2025-04-01'
GROUP BY p.category
ORDER BY ingresos_q1_usd DESC;`,
    orderMatters: true,
    hints: [
      'Sustituye las llamadas a `strftime` en el `WHERE` por `o.status = \'completed\' AND o.order_date >= DATE \'2025-01-01\' AND o.order_date < DATE \'2025-04-01\'`.',
      'Agrupa por `p.category` y calcula `pedidos_q1` con `COUNT(DISTINCT o.order_id)`, `unidades_q1` con `SUM(oi.qty)` e `ingresos_q1_usd` con `ROUND(SUM(oi.line_total_usd), 2)`.',
      'Añade la quinta columna `pct_ingresos_q1` con `ROUND(100.0 * SUM(oi.line_total_usd) / SUM(SUM(oi.line_total_usd)) OVER (), 2)` y ordena por `ingresos_q1_usd DESC`.'
    ],
    solution: `SELECT
  p.category,
  COUNT(DISTINCT o.order_id) AS pedidos_q1,
  SUM(oi.qty) AS unidades_q1,
  ROUND(SUM(oi.line_total_usd), 2) AS ingresos_q1_usd,
  ROUND(
    100.0 * SUM(oi.line_total_usd) / SUM(SUM(oi.line_total_usd)) OVER (),
    2
  ) AS pct_ingresos_q1
FROM orders o
INNER JOIN order_items oi ON o.order_id = oi.order_id
INNER JOIN products p ON oi.product_id = p.product_id
WHERE o.status = 'completed'
  AND o.order_date >= DATE '2025-01-01'
  AND o.order_date < DATE '2025-04-01'
GROUP BY p.category
ORDER BY ingresos_q1_usd DESC;`,
    solutionExplanation: 'Reemplaza `strftime` por un rango SARGable de fechas y `o.status = \'completed\'` para activar Filter Pushdown en `orders` y Dynamic Filters en `order_items`, y calcula la participación porcentual con una ventana sobre la suma agregada.'
  },

  roleNotes: {
    de: 'Ordena físicamente los archivos Parquet por las columnas de filtro más frecuentes (`order_date`, `store_id`) al escribirlos para maximizar la efectividad de los *zonemaps* (min/max por *row group*). Revisa `EXPLAIN ANALYZE` en tus modelos de transformación cuando un `HASH_JOIN` vuelque datos a disco (*spill to disk*).',
    da: 'Cuando una consulta exploratoria tarde más de lo esperado, ejecuta `EXPLAIN` antes de esperar minutos: verifica que los filtros de fecha aparezcan dentro del nodo `READ_PARQUET` (`Filters: ...`) y que no exista un `CROSS_PRODUCT` o un `JOIN` con desigualdad accidental.',
    bi: 'Evita crear filtros calculados en las herramientas de BI que envuelvan las columnas de fecha en funciones de texto (`CAST(order_date AS VARCHAR)` o `YEAR(order_date)`). Usa filtros nativos de rango de fechas para que el motor pueda podar particiones.'
  },

  summary: [
    'EXPLAIN muestra el plan estimado por el optimizador; EXPLAIN ANALYZE ejecuta la consulta y mide filas y tiempos reales.',
    'Los planes de ejecución se leen de abajo hacia arriba: desde los escaneos (READ_PARQUET) hasta el ordenamiento final.',
    'Los predicados SARGables (rangos directos sin funciones sobre la columna) activan Filter Pushdown en Parquet.',
    'En un HASH_JOIN, filtrar el lado Build genera filtros dinámicos (Dynamic Filters) que reducen la lectura del lado Probe.'
  ],

  flashcards: [
    {
      id: 'fc-c2-04-01',
      front: '¿En qué dirección se lee el árbol de un plan de ejecución en EXPLAIN ANALYZE?',
      back: 'De abajo hacia arriba: las hojas inferiores son los escaneos de tablas (READ_PARQUET), el centro son uniones y agregaciones, y la raíz es la salida final.'
    },
    {
      id: 'fc-c2-04-02',
      front: '¿Qué es un predicado SARGable y por qué acelera las consultas sobre Parquet?',
      back: 'Es una condición que compara la columna cruda sin envolverla en funciones, permitiendo empujar el filtro (Filter Pushdown) y saltar bloques con zonemaps.'
    },
    {
      id: 'fc-c2-04-03',
      front: '¿Qué diferencia hay entre el lado Build y el lado Probe de un operador HASH_JOIN?',
      back: 'El lado Build construye una tabla hash en memoria con la tabla más pequeña; el lado Probe recorre la tabla más grande buscando coincidencias en esa tabla hash.'
    }
  ],

  glossaryTerms: [
    'c2-sql-explain-analyze',
    'c2-sql-marco-ventana'
  ],

  sources: [
    {
      title: 'DuckDB Documentation — Inspecting Query Plans with EXPLAIN and EXPLAIN ANALYZE',
      url: 'https://duckdb.org/docs/guides/meta/explain.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Diferencia entre planes estimados (EXPLAIN) y perfiles con tiempos y cardinalidades reales (EXPLAIN ANALYZE).'
    },
    {
      title: 'DuckDB Documentation — Profiling and Query Plan Analysis',
      url: 'https://duckdb.org/docs/dev/profiling.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Interpretación de operadores físicos (READ_PARQUET, HASH_JOIN, HASH_GROUP_BY, TOP_N) y métricas de ejecución.'
    },
    {
      title: 'DuckDB Performance Guide — How to Tune Workloads',
      url: 'https://duckdb.org/docs/guides/performance/how_to_tune_workloads.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Filter Pushdown, Projection Pushdown, filtros dinámicos en uniones hash y ordenamiento de datos.'
    },
    {
      title: 'PostgreSQL 17 Documentation — Section 14.1: Using EXPLAIN',
      url: 'https://www.postgresql.org/docs/current/using-explain.html',
      publisher: 'PostgreSQL Global Development Group',
      accessed: '2026-10-29',
      supports: 'Lectura de árboles de ejecución de abajo hacia arriba y comparación de filas estimadas frente a reales.'
    }
  ],

  aiNotes: 'El error más frecuente en esta práctica es conservar strftime en el WHERE (impidiendo el Filter Pushdown), olvidar filtrar o.status = \'completed\' o no saber combinar SUM(oi.line_total_usd) con la ventana SUM(SUM(oi.line_total_usd)) OVER () para calcular el porcentaje del trimestre.',
  subtitle: 'Leer un plan de ejecución con EXPLAIN ANALYZE: escaneos, filtros y uniones',
  goal: 'Inspeccionar planes físicos con EXPLAIN ANALYZE, reescribir filtros para activar Filter Pushdown y diagnosticar operadores HASH_JOIN y agregaciones.'
};

export default lesson;
