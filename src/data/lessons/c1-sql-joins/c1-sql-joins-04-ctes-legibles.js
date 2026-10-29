const lesson = {
  id: 'c1-sql-joins-04-ctes-legibles',
  moduleId: 'c1-sql-joins',
  tracks: ['core'],
  level: 1,
  order: 4,
  title: 'CTEs (WITH) legibles: dividir una consulta en pasos',
  minutes: 20,
  prerequisites: ['c1-sql-joins-03-subconsultas'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), la tabla `payments` tiene 19 200 registros para 18 000 pedidos porque incluye 1 857 intentos fallidos (`status = \'failed\'`), 738 pendientes y 450 cobros duplicados por reenvío de webhook con el mismo `idempotency_key`. Un analista intenta limpiar y cruzar `payments`, `refunds` y `orders` anidando tres subconsultas dentro del `FROM`, pero comete un error de paréntesis y suma dos veces los duplicados. ¿Cómo reescribes esa consulta como una secuencia lineal de pasos verificables con `WITH`?',

  objectives: [
    'Reescribir subconsultas anidadas como expresiones de tabla común (CTEs) secuenciales mediante la cláusula WITH.',
    'Organizar consultas complejas en tres etapas: limpieza y deduplicación, pre-agregación por grano y ensamblaje final.',
    'Distinguir cuándo el optimizador fusiona una CTE (NOT MATERIALIZED) y cuándo conviene materializarla (MATERIALIZED).'
  ],

  sections: [
    {
      id: 'anatomia-clausula-with',
      heading: 'De adentro hacia afuera o de arriba hacia abajo: la cláusula WITH',
      body: 'Cuando anidas tres subconsultas en el `FROM`, quien lee tu código tiene que saltar al paréntesis más interno. Primero intenta entender ese bloque y luego sube nivel por nivel hacia afuera. Una **expresión de tabla común** (**CTE**, definida con `WITH`) invierte ese orden. Te permite bautizar cada paso intermedio al inicio de la consulta y leer la lógica de arriba hacia abajo.\n\nLa sintaxis comienza con la palabra `WITH` seguida del nombre del paso y `AS (...)`. Si necesitas varios pasos, colocas una coma antes del siguiente nombre. La palabra `WITH` se escribe una sola vez al principio. Cada CTE puede consultar cualquiera de las CTEs declaradas encima de ella, formando una cadena limpia donde cada bloque cumple una única función.',
      example: {
        language: 'sql',
        code: 'WITH pedidos_completados AS (\n  SELECT store_id, order_id, total_usd\n  FROM orders\n  WHERE status = \'completed\'\n),\nresumen_tienda AS (\n  SELECT\n    store_id,\n    COUNT(order_id) AS pedidos_ok,\n    ROUND(SUM(total_usd), 2) AS ingreso_ok_usd\n  FROM pedidos_completados\n  GROUP BY store_id\n)\nSELECT\n  s.store_code,\n  s.city,\n  r.pedidos_ok,\n  r.ingreso_ok_usd\nFROM stores s\nINNER JOIN resumen_tienda r ON s.store_id = r.store_id\nORDER BY r.ingreso_ok_usd DESC\nLIMIT 4;',
        expectedOutput: [
          { store_code: 'STR-AR-01', city: 'Buenos Aires', pedidos_ok: 2811, ingreso_ok_usd: 1107208.91 },
          { store_code: 'STR-PE-01', city: 'Lima', pedidos_ok: 2109, ingreso_ok_usd: 882838.25 },
          { store_code: 'WH-ES-01', city: 'Madrid', pedidos_ok: 1405, ingreso_ok_usd: 786831.2 },
          { store_code: 'STR-CL-02', city: 'Santiago', pedidos_ok: 1029, ingreso_ok_usd: 524414.66 }
        ]
      }
    },
    {
      id: 'patron-tres-capas-ctes',
      heading: 'El patrón en tres etapas: limpiar, igualar grano y ensamblar',
      body: 'Para que una consulta con múltiples tablas sea fácil de mantener, divide tus CTEs en tres etapas. En la primera etapa (limpieza), filtras registros inválidos y eliminas duplicados técnicos. Por ejemplo, en `payments` descartas `status <> \'captured\'` y colapsas las 450 filas repetidas que comparten el mismo `idempotency_key`.\n\nEn la segunda etapa (transformación por grano), agrupas cada tabla de detalle (`payments`, `order_items`, `refunds`) hasta que tenga exactamente una fila por la clave de cruce (`order_id`). En la tercera etapa (el `SELECT` final), unes la tabla maestra (`orders` o `stores`) con las CTEs ya pre-agregadas, aplicas `COALESCE(..., 0)` sobre las métricas opcionales y calculas los indicadores netos.'
    },
    {
      id: 'depurar-paso-a-paso-y-reutilizar',
      heading: 'Cómo depurar cada CTE por separado y reutilizar resultados',
      body: 'La mayor ventaja práctica de escribir con `WITH` aparece cuando un número no cuadra. En una subconsulta anidada tienes que recortar y comentar bloques enteros para inspeccionar un resultado intermedio. En una consulta con CTEs, basta con comentar temporalmente el `SELECT` final y escribir `SELECT COUNT(*), COUNT(DISTINCT order_id) FROM nombre_de_tu_cte;`.\n\nDe ese modo verificas en cinco segundos si el paso 1 eliminó los duplicados o si el paso 2 conserva el grano esperado. Además, a diferencia de una subconsulta en `FROM` que habría que copiar y pegar dos veces, una CTE se puede referenciar varias veces en pasos posteriores (por ejemplo, para unir las ventas de este año contra las del año anterior).'
    },
    {
      id: 'materializacion-ctes-duckdb-postgres',
      heading: 'MATERIALIZED frente a NOT MATERIALIZED en el optimizador',
      body: 'Una duda habitual es si usar muchas CTEs hace más lenta la consulta. En DuckDB y PostgreSQL 17, cuando una CTE no recursiva se referencia una sola vez, el optimizador aplica *inlining* (`NOT MATERIALIZED`): fusiona la CTE dentro de la consulta principal y empuja los filtros `WHERE` hasta la lectura del archivo Parquet.\n\nEn cambio, si una CTE realiza una agregación pesada y se consulta varias veces, tanto DuckDB como PostgreSQL pueden materializarla en memoria una sola vez para no recalcularla. Si necesitas forzar explícitamente ese comportamiento, ambos motores admiten la sintaxis `WITH mi_cte AS MATERIALIZED (...)` o `WITH mi_cte AS NOT MATERIALIZED (...)`.'
    }
  ],

  workedExample: {
    title: 'Limpieza de pagos duplicados y fallidos en Mercado Brisa con CTEs',
    description: 'En `payments` (19 200 filas) hay intentos fallidos, pendientes y 450 cobros duplicados por reenvío de webhook con idéntico `idempotency_key`. Compara el cruce directo contra una cadena de dos CTEs:',
    steps: [
      {
        label: 'Paso 1 — Error sin CTEs de limpieza: sumar intentos fallidos y webhooks duplicados',
        explanation: 'Al unir `orders` directamente con `payments`, se suman los cobros fallidos (`failed`), los pendientes y los 450 duplicados de webhook, inflando el monto de todos los métodos de pago.',
        code: 'SELECT\n  p.payment_method,\n  COUNT(*) AS filas_pagos,\n  ROUND(SUM(p.amount_usd), 2) AS monto_bruto_inflado_usd\nFROM orders o\nINNER JOIN payments p ON o.order_id = p.order_id\nGROUP BY p.payment_method\nORDER BY monto_bruto_inflado_usd DESC;',
        expectedOutput: [
          { payment_method: 'transferencia_spei', filas_pagos: 4800, monto_bruto_inflado_usd: 2350562.1 },
          { payment_method: 'efectivo_tienda', filas_pagos: 4800, monto_bruto_inflado_usd: 2339359.84 },
          { payment_method: 'billetera_digital', filas_pagos: 4800, monto_bruto_inflado_usd: 1784360.88 },
          { payment_method: 'card', filas_pagos: 4800, monto_bruto_inflado_usd: 1703817.36 }
        ]
      },
      {
        label: 'Paso 2 — Solución en dos CTEs: deduplicar por idempotency_key y agregar por pedido',
        explanation: 'La primera CTE filtra `status = \'captured\'` y deduplica por `idempotency_key` (pasando de 16 605 a 16 200 cobros únicos). La segunda agrupa por `order_id` antes de cruzar con `orders`.',
        code: 'WITH pagos_capturados_unicos AS (\n  SELECT\n    order_id,\n    payment_method,\n    idempotency_key,\n    MIN(amount_usd) AS amount_usd\n  FROM payments\n  WHERE status = \'captured\'\n  GROUP BY order_id, payment_method, idempotency_key\n),\ncobros_por_pedido AS (\n  SELECT\n    order_id,\n    payment_method,\n    SUM(amount_usd) AS cobrado_usd\n  FROM pagos_capturados_unicos\n  GROUP BY order_id, payment_method\n)\nSELECT\n  c.payment_method,\n  COUNT(o.order_id) AS pedidos_cobrados,\n  ROUND(SUM(c.cobrado_usd), 2) AS monto_cobrado_real_usd\nFROM orders o\nINNER JOIN cobros_por_pedido c ON o.order_id = c.order_id\nGROUP BY c.payment_method\nORDER BY monto_cobrado_real_usd DESC;',
        expectedOutput: [
          { payment_method: 'transferencia_spei', pedidos_cobrados: 3960, monto_cobrado_real_usd: 1935173.03 },
          { payment_method: 'efectivo_tienda', pedidos_cobrados: 3960, monto_cobrado_real_usd: 1927080.27 },
          { payment_method: 'billetera_digital', pedidos_cobrados: 4140, monto_cobrado_real_usd: 1539322.85 },
          { payment_method: 'card', pedidos_cobrados: 4140, monto_cobrado_real_usd: 1472911.85 }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: 'Al definir tres CTEs seguidas en una misma consulta SQL (`paso_1`, `paso_2` y `paso_3`), ¿cuál es la sintaxis correcta?',
      options: [
        {
          id: 'a',
          text: 'Escribir WITH una sola vez al inicio y separar cada bloque nombre AS (...) con una coma.',
          correct: true,
          feedback: 'Correcto. La palabra clave WITH abre el bloque de definiciones y las CTEs se separan únicamente por comas.'
        },
        {
          id: 'b',
          text: 'Escribir la palabra WITH delante de cada una de las tres CTEs.',
          correct: false,
          feedback: 'Incorrecto. Repetir WITH antes de paso_2 y paso_3 produce un error de sintaxis.'
        },
        {
          id: 'c',
          text: 'Terminar cada CTE con punto y coma (;) antes de empezar la siguiente.',
          correct: false,
          feedback: 'Incorrecto. El punto y coma cierra toda la sentencia SQL; una CTE solo existe dentro de una misma sentencia.'
        }
      ],
      explanation: 'En SQL estándar, una cláusula WITH puede declarar múltiples CTEs separadas por comas sin repetir la palabra clave WITH ni cerrar la sentencia con punto y coma.'
    },
    {
      id: 'c2',
      type: 'order',
      prompt: 'Ordena de arriba hacia abajo los pasos recomendados para estructurar una consulta analítica con CTEs que une `stores`, `orders` y `refunds`:',
      items: [
        'CTE 1 (reembolsos_por_pedido): pre-agregar refunds por order_id para igualar el grano de orders.',
        'CTE 2 (ventas_por_tienda): unir orders con reembolsos_por_pedido mediante LEFT JOIN y agrupar por store_id.',
        'SELECT final: unir stores con ventas_por_tienda para agregar por región y calcular ventas netas.'
      ],
      correctOrder: [
        'CTE 1 (reembolsos_por_pedido): pre-agregar refunds por order_id para igualar el grano de orders.',
        'CTE 2 (ventas_por_tienda): unir orders con reembolsos_por_pedido mediante LEFT JOIN y agrupar por store_id.',
        'SELECT final: unir stores con ventas_por_tienda para agregar por región y calcular ventas netas.'
      ],
      explanation: 'Primero se colapsa el detalle más fino (refunds -> order_id), luego se agrega al grano intermedio (orders -> store_id) y finalmente se cruza con el catálogo de tiendas (stores -> region).'
    },
    {
      id: 'c3',
      type: 'mcq',
      prompt: '¿Qué ocurre en PostgreSQL 17 y DuckDB cuando defines una CTE simple que solo se referencia una vez en el `SELECT` final y este incluye un filtro `WHERE`?',
      options: [
        {
          id: 'a',
          text: 'El optimizador fusiona (inline) la CTE y empuja el filtro WHERE hasta la lectura de la tabla base.',
          correct: true,
          feedback: 'Exacto. Al no estar forzada con MATERIALIZED, el optimizador trata la CTE como una vista en línea y aplica predicate pushdown.'
        },
        {
          id: 'b',
          text: 'El motor escribe obligatoriamente toda la tabla en disco antes de aplicar el filtro WHERE.',
          correct: false,
          feedback: 'Incorrecto. Ese comportamiento de barrera rígida existía en versiones antiguas de PostgreSQL (< 12), no en PostgreSQL 17 ni en DuckDB.'
        },
        {
          id: 'c',
          text: 'El motor ignora el filtro WHERE exterior si la columna no estaba indexada en la CTE.',
          correct: false,
          feedback: 'Incorrecto. Las CTEs no tienen índices propios y los filtros exteriores siempre se respetan.'
        }
      ],
      explanation: 'Por defecto, tanto DuckDB como PostgreSQL 17 fusionan las CTEs referenciadas una sola vez dentro del plan de ejecución principal, permitiendo empujar filtros hacia los archivos Parquet o índices.'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Ventas netas por región encadenando dos CTEs',
    language: 'sql',
    prompt: 'Completa la consulta con dos CTEs (`reembolsos_por_pedido` y `ventas_por_tienda`) para calcular por cada `region` de `stores`: `total_pedidos` (`SUM(v.pedidos)`), `ventas_brutas_usd` (`ROUND(SUM(v.bruto_usd), 2)`), `reembolsos_usd` (`ROUND(SUM(v.reembolsado_usd), 2)`) y `ventas_netas_usd` (`ROUND(SUM(v.bruto_usd - v.reembolsado_usd), 2)`), ordenado por `ventas_netas_usd DESC`.',
    starterCode: 'WITH reembolsos_por_pedido AS (\n  SELECT\n    order_id,\n    SUM(refund_amount_usd) AS total_reembolsado\n  FROM refunds\n  GROUP BY order_id\n),\nventas_por_tienda AS (\n  SELECT\n    o.store_id,\n    COUNT(o.order_id) AS pedidos,\n    SUM(o.total_usd) AS bruto_usd,\n    SUM(COALESCE(r.total_reembolsado, 0)) AS reembolsado_usd\n  FROM orders o\n  -- TODO: Une reembolsos_por_pedido r con LEFT JOIN por order_id y agrupa por o.store_id\n  GROUP BY o.store_id\n)\nSELECT\n  s.region,\n  SUM(v.pedidos) AS total_pedidos,\n  ROUND(SUM(v.bruto_usd), 2) AS ventas_brutas_usd,\n  ROUND(SUM(v.reembolsado_usd), 2) AS reembolsos_usd,\n  -- TODO: Calcula ventas_netas_usd restando v.reembolsado_usd a v.bruto_usd\n  0.0 AS ventas_netas_usd\nFROM stores s\nINNER JOIN ventas_por_tienda v ON s.store_id = v.store_id\nGROUP BY s.region\nORDER BY ventas_netas_usd DESC;',
    expected: 'WITH reembolsos_por_pedido AS (\n  SELECT\n    order_id,\n    SUM(refund_amount_usd) AS total_reembolsado\n  FROM refunds\n  GROUP BY order_id\n),\nventas_por_tienda AS (\n  SELECT\n    o.store_id,\n    COUNT(o.order_id) AS pedidos,\n    SUM(o.total_usd) AS bruto_usd,\n    SUM(COALESCE(r.total_reembolsado, 0)) AS reembolsado_usd\n  FROM orders o\n  LEFT JOIN reembolsos_por_pedido r ON o.order_id = r.order_id\n  GROUP BY o.store_id\n)\nSELECT\n  s.region,\n  SUM(v.pedidos) AS total_pedidos,\n  ROUND(SUM(v.bruto_usd), 2) AS ventas_brutas_usd,\n  ROUND(SUM(v.reembolsado_usd), 2) AS reembolsos_usd,\n  ROUND(SUM(v.bruto_usd - v.reembolsado_usd), 2) AS ventas_netas_usd\nFROM stores s\nINNER JOIN ventas_por_tienda v ON s.store_id = v.store_id\nGROUP BY s.region\nORDER BY ventas_netas_usd DESC;',
    orderMatters: true,
    hints: [
      'En `ventas_por_tienda`, añade `LEFT JOIN reembolsos_por_pedido r ON o.order_id = r.order_id` antes de `GROUP BY o.store_id`.',
      'En el `SELECT` final, reemplaza `0.0 AS ventas_netas_usd` por `ROUND(SUM(v.bruto_usd - v.reembolsado_usd), 2) AS ventas_netas_usd`.',
      'Verifica que la suma de `total_pedidos` de las 4 regiones sea exactamente 18 000.'
    ],
    solution: 'WITH reembolsos_por_pedido AS (\n  SELECT\n    order_id,\n    SUM(refund_amount_usd) AS total_reembolsado\n  FROM refunds\n  GROUP BY order_id\n),\nventas_por_tienda AS (\n  SELECT\n    o.store_id,\n    COUNT(o.order_id) AS pedidos,\n    SUM(o.total_usd) AS bruto_usd,\n    SUM(COALESCE(r.total_reembolsado, 0)) AS reembolsado_usd\n  FROM orders o\n  LEFT JOIN reembolsos_por_pedido r ON o.order_id = r.order_id\n  GROUP BY o.store_id\n)\nSELECT\n  s.region,\n  SUM(v.pedidos) AS total_pedidos,\n  ROUND(SUM(v.bruto_usd), 2) AS ventas_brutas_usd,\n  ROUND(SUM(v.reembolsado_usd), 2) AS reembolsos_usd,\n  ROUND(SUM(v.bruto_usd - v.reembolsado_usd), 2) AS ventas_netas_usd\nFROM stores s\nINNER JOIN ventas_por_tienda v ON s.store_id = v.store_id\nGROUP BY s.region\nORDER BY ventas_netas_usd DESC;',
    solutionExplanation: 'La primera CTE iguala `refunds` al grano de `order_id`; la segunda agrega pedidos y reembolsos al grano de `store_id`; el `SELECT` final cruza con `stores` y resume las 4 regiones sin duplicar importes.',
    expectedOutputTable: [
      { region: 'Cono Sur', total_pedidos: 6001, ventas_brutas_usd: 2517001.37, reembolsos_usd: 92554.84, ventas_netas_usd: 2424446.53 },
      { region: 'Andina', total_pedidos: 6000, ventas_brutas_usd: 2434901.41, reembolsos_usd: 133446.63, ventas_netas_usd: 2301454.78 },
      { region: 'Iberia', total_pedidos: 3428, ventas_brutas_usd: 1651332.57, reembolsos_usd: 50225.33, ventas_netas_usd: 1601107.24 },
      { region: 'Norteamérica', total_pedidos: 2571, ventas_brutas_usd: 1066582.42, reembolsos_usd: 44870.45, ventas_netas_usd: 1021711.97 }
    ]
  },

  roleNotes: {
    de: 'En proyectos de transformación con dbt o SQLMesh, cada archivo SQL sigue este patrón de CTEs: importa las fuentes arriba, aplica limpieza y cambio de grano en CTEs con nombres descriptivos y termina con un `SELECT * FROM final`.',
    da: 'Cuando depures una discrepancia en un reporte, sustituye temporalmente el `SELECT` final por una consulta a cada CTE intermedia para localizar en qué paso exacto cambió el conteo de filas.',
    bi: 'Antes de llevar una consulta SQL compleja a una vista del almacén para conectarla a Power BI o Tableau, reemplaza todas las subconsultas anidadas por CTEs documentadas con el grano de cada paso.'
  },

  summary: [
    'WITH define expresiones de tabla común (CTEs) que se leen de arriba hacia abajo.',
    'La palabra WITH se escribe una sola vez; múltiples CTEs se separan con comas.',
    'Divide tus consultas en tres etapas: limpiar/deduplicar, pre-agregar por grano y ensamblar.',
    'DuckDB y PostgreSQL 17 fusionan CTEs de un solo uso y permiten controlar MATERIALIZED.'
  ],

  flashcards: [
    {
      id: 'fc-c1-joins-04-a',
      front: '¿Cómo se encadenan varias CTEs en una misma consulta SQL?',
      back: 'Escribiendo `WITH cte_1 AS (...), cte_2 AS (...) SELECT ...`, sin repetir la palabra `WITH`.'
    },
    {
      id: 'fc-c1-joins-04-b',
      front: '¿Cuáles son las tres etapas recomendadas al estructurar CTEs en una consulta analítica?',
      back: '1) CTEs de entrada/limpieza (filtros y deduplicación), 2) CTEs de pre-agregación por grano, y 3) `SELECT` final de unión.'
    },
    {
      id: 'fc-c1-joins-04-c',
      front: '¿Para qué sirve añadir `AS MATERIALIZED` a una CTE en DuckDB o PostgreSQL 17?',
      back: 'Para indicar al motor que calcule y guarde en memoria el resultado de la CTE una sola vez en lugar de fusionarla.'
    }
  ],

  glossaryTerms: [
    'c1-joins-cte-with',
    'c02-cte-preagg'
  ],

  sources: [
    {
      title: 'DuckDB SQL Reference — Common Table Expressions (WITH Clause)',
      url: 'https://duckdb.org/docs/sql/query_syntax/with.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Sintaxis de CTEs encadenadas y comportamiento de MATERIALIZED / NOT MATERIALIZED en DuckDB.'
    },
    {
      title: 'PostgreSQL 17 Documentation — Section 7.8: WITH Queries (Common Table Expressions)',
      url: 'https://www.postgresql.org/docs/current/queries-with.html',
      publisher: 'PostgreSQL Global Development Group',
      accessed: '2026-10-29',
      supports: 'Reglas de fusión (inlining) automática y empuje de filtros en CTEs de lectura.'
    },
    {
      title: 'dbt Labs Best Practices — How We Style Our SQL (CTE Structure)',
      url: 'https://docs.getdbt.com/best-practices/how-we-style/2-how-we-style-our-sql',
      publisher: 'dbt Labs',
      accessed: '2026-10-29',
      supports: 'Organización de consultas SQL en CTEs secuenciales de importación, lógica y selección final.'
    }
  ],

  aiNotes: 'El error de sintaxis más común es escribir WITH delante de la segunda CTE o poner punto y coma entre CTEs. El error conceptual es creer que una CTE evita el fan-out por sí sola aunque no tenga GROUP BY por la clave de unión.'
};

export default lesson;
