const lesson = {
  id: 'c1-sql-joins-01-tipos-join',
  moduleId: 'c1-sql-joins',
  tracks: ['core'],
  level: 1,
  order: 1,
  title: 'Tipos de JOIN: INNER, LEFT, FULL, SEMI y ANTI JOIN',
  minutes: 25,
  prerequisites: ['c1-sql-base-07'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), la tabla `orders` registra 18 000 pedidos y `refunds` contiene 1 450 devoluciones repartidas en 1 150 pedidos. Una analista necesita contar cuántos pedidos nunca tuvieron devolución y escribe un `LEFT JOIN` seguido de `WHERE r.status = \'processed\'`. En lugar de los 18 000 pedidos, su reporte devuelve 1 450 filas. ¿Por qué el filtro en `WHERE` anuló la unión izquierda y cómo evitas duplicar pedidos al comprobar si existe una devolución?',

  objectives: [
    'Elegir entre INNER JOIN, LEFT JOIN y FULL OUTER JOIN según qué filas sin coincidencia deban conservarse.',
    'Colocar los filtros de la tabla derecha en la cláusula ON cuando se necesita preservar los nulos de un LEFT JOIN.',
    'Aplicar SEMI JOIN (EXISTS) y ANTI JOIN (NOT EXISTS) para verificar existencia sin duplicar filas de la tabla izquierda.'
  ],

  sections: [
    {
      id: 'inner-vs-left-join',
      heading: 'INNER JOIN frente a LEFT JOIN: qué ocurre con las filas sin pareja',
      body: 'Combinar dos tablas por una columna común añade atributos de una entidad a otra. Un **INNER JOIN** conserva únicamente las filas que tienen coincidencia en ambos lados de la condición `ON`. En cambio, una **unión izquierda** (`LEFT JOIN`) conserva todas las filas de la tabla izquierda y rellena con `NULL` las columnas de la tabla derecha cuando no encuentra pareja.\n\nEn Mercado Brisa (empresa ficticia), `orders` tiene 18 000 pedidos, pero solo 1 150 pedidos aparecen en `refunds`. Además, 300 de esos pedidos tuvieron dos devoluciones parciales, sumando 1 450 filas en `refunds`. Si unes `orders` con `refunds` mediante `INNER JOIN`, obtienes 1 450 filas: desaparecen los 16 850 pedidos sin devolución y se duplican los 300 pedidos con doble reembolso. Con `LEFT JOIN`, los 16 850 pedidos sin devolución permanecen con `r.refund_id IS NULL`.',
      example: {
        language: 'sql',
        code: 'SELECT\n  (SELECT COUNT(*) FROM orders) AS pedidos_totales,\n  (SELECT COUNT(*) FROM orders o INNER JOIN refunds r ON o.order_id = r.order_id) AS filas_inner_join,\n  (SELECT COUNT(*) FROM orders o LEFT JOIN refunds r ON o.order_id = r.order_id) AS filas_left_join,\n  (SELECT COUNT(*) FROM orders o SEMI JOIN refunds r ON o.order_id = r.order_id) AS pedidos_con_reembolso,\n  (SELECT COUNT(*) FROM orders o ANTI JOIN refunds r ON o.order_id = r.order_id) AS pedidos_sin_reembolso;',
        expectedOutput: [
          {
            pedidos_totales: 18000,
            filas_inner_join: 1450,
            filas_left_join: 18300,
            pedidos_con_reembolso: 1150,
            pedidos_sin_reembolso: 16850
          }
        ]
      }
    },
    {
      id: 'trampa-where-en-left-join',
      heading: 'Por qué un WHERE sobre la tabla derecha rompe un LEFT JOIN',
      body: 'El motor SQL evalúa primero la cláusula `FROM` con sus condiciones `ON` y, solo después de generar las filas con `NULL` de la unión externa, aplica el filtro `WHERE`. Si haces `LEFT JOIN refunds r ON o.order_id = r.order_id` y luego escribes `WHERE r.status = \'processed\'`, para los 16 850 pedidos sin devolución `r.status` vale `NULL`.\n\nEn la lógica de tres valores, la comparación `NULL = \'processed\'` devuelve `UNKNOWN`, y `WHERE` descarta toda fila que no sea verdadera. Sin darte cuenta, transformaste tu `LEFT JOIN` en un `INNER JOIN`. Si quieres filtrar la tabla derecha sin perder las filas de la tabla izquierda, pon esa condición dentro del `ON`: `LEFT JOIN refunds r ON o.order_id = r.order_id AND r.status = \'processed\'`. La única condición sobre la tabla derecha que pertenece al `WHERE` es `WHERE r.refund_id IS NULL` cuando buscas ausencias.',
      example: {
        language: 'sql',
        code: 'SELECT\n  COUNT(o.order_id) AS filas_totales,\n  COUNT(r.refund_id) AS reembolsos_procesados\nFROM orders o\nLEFT JOIN refunds r\n  ON o.order_id = r.order_id\n AND r.status = \'processed\';',
        expectedOutput: [
          {
            filas_totales: 18300,
            reembolsos_procesados: 1450
          }
        ]
      }
    },
    {
      id: 'semi-y-anti-join',
      heading: 'SEMI JOIN y ANTI JOIN: comprobar existencia sin duplicar filas',
      body: 'Muchas veces no necesitas traer columnas de la segunda tabla; solo quieres filtrar la primera según exista o no una coincidencia. Para eso existen las **uniones de existencia**. Un `SEMI JOIN` (equivalente a `WHERE EXISTS (...)`) devuelve las filas de la tabla izquierda que tienen al menos una pareja en la derecha, pero se detiene en la primera coincidencia. Nunca duplica filas aunque la tabla derecha tenga diez registros para esa clave.\n\nPor su parte, un `ANTI JOIN` (equivalente a `WHERE NOT EXISTS (...)`) conserva únicamente las filas de la tabla izquierda que no tienen ninguna coincidencia en la derecha. En DuckDB puedes escribir `SEMI JOIN` y `ANTI JOIN` directamente en el `FROM`. En Mercado Brisa, `products` tiene 180 productos y `order_items` tiene 42 000 líneas; un `ANTI JOIN` localiza al instante el único SKU que jamás se vendió.',
      example: {
        language: 'sql',
        code: 'SELECT\n  p.product_id,\n  p.sku,\n  p.category,\n  p.list_price_usd\nFROM products p\nANTI JOIN order_items oi\n  ON p.product_id = oi.product_id;',
        expectedOutput: [
          {
            product_id: 180,
            sku: 'SKU-TEST-NEG',
            category: 'Accesorios',
            list_price_usd: -9.99
          }
        ]
      }
    },
    {
      id: 'full-outer-join-y-using',
      heading: 'FULL OUTER JOIN y cláusula USING en auditorías de reconciliación',
      body: 'Cuando comparas dos fuentes que pueden tener registros huérfanos en cualquiera de los dos lados, necesitas un **FULL OUTER JOIN**. Esta unión conserva las filas coincidentes, las filas exclusivas de la izquierda (con `NULL` a la derecha) y las filas exclusivas de la derecha (con `NULL` a la izquierda). Es la herramienta estándar para conciliar los pedidos del sistema de tienda contra los cobros de la pasarela bancaria.\n\nCuando la columna de cruce se llama exactamente igual en ambas tablas (por ejemplo, `order_id`), puedes abreviar `ON o.order_id = p.order_id` escribiendo `USING (order_id)`. En un `FULL OUTER JOIN USING (order_id)`, la columna `order_id` fusiona ambos lados con `COALESCE(o.order_id, p.order_id)`, evitando tener dos columnas `order_id` separadas con nulos cruzados.'
    }
  ],

  workedExample: {
    title: 'Auditoría de clientes asignados y no asignados a experimentos A/B',
    description: 'En Mercado Brisa hay 2 400 clientes en `customers` y 9 600 asignaciones en `experiment_assignments` (un cliente participa en varios experimentos). Compara el error de contar sobre un `LEFT JOIN` directo frente al uso de `ANTI JOIN`:',
    steps: [
      {
        label: 'Paso 1 — Error frecuente: LEFT JOIN que multiplica filas por experimento',
        explanation: 'Al hacer `LEFT JOIN` directo entre `customers` (2 400 filas) y `experiment_assignments` (9 600 filas), cada cliente con 4 experimentos aparece 4 veces. `COUNT(c.customer_id)` suma 9 715 filas en lugar de los 2 400 clientes.',
        code: 'SELECT\n  c.segment,\n  COUNT(c.customer_id) AS filas_tras_join,\n  COUNT(DISTINCT c.customer_id) AS clientes_reales\nFROM customers c\nLEFT JOIN experiment_assignments ea\n  ON c.customer_id = ea.customer_id\nGROUP BY c.segment\nORDER BY c.segment;',
        expectedOutput: [
          {
            segment: 'cafeteria_b2b',
            filas_tras_join: 1686,
            clientes_reales: 467
          },
          {
            segment: 'pro_barista',
            filas_tras_join: 3454,
            clientes_reales: 966
          },
          {
            segment: 'retail',
            filas_tras_join: 4575,
            clientes_reales: 967
          }
        ]
      },
      {
        label: 'Paso 2 — Solución exacta: ANTI JOIN para aislar clientes sin experimento',
        explanation: 'Al usar `ANTI JOIN`, DuckDB verifica qué clientes de `customers` no tienen ninguna fila en `experiment_assignments` sin repetir clientes ni exponer columnas de la tabla derecha.',
        code: 'SELECT\n  c.segment,\n  COUNT(*) AS clientes_sin_experimento\nFROM customers c\nANTI JOIN experiment_assignments ea\n  ON c.customer_id = ea.customer_id\nGROUP BY c.segment\nORDER BY clientes_sin_experimento DESC, c.segment ASC;',
        expectedOutput: [
          {
            segment: 'pro_barista',
            clientes_sin_experimento: 86
          },
          {
            segment: 'cafeteria_b2b',
            clientes_sin_experimento: 29
          }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: 'En Mercado Brisa haces `FROM customers c LEFT JOIN orders o ON c.customer_id = o.customer_id WHERE o.status = \'completed\'`. ¿Qué hace esa consulta con un cliente que solo tiene un pedido cancelado?',
      options: [
        {
          id: 'a',
          text: 'Lo elimina del resultado, porque el filtro en WHERE descarta las filas donde o.status no es completed.',
          correct: true,
          feedback: 'Correcto. El filtro en WHERE se ejecuta después del LEFT JOIN y elimina tanto los pedidos cancelados como los nulos.'
        },
        {
          id: 'b',
          text: 'Conserva al cliente y muestra sus columnas de orders como NULL.',
          correct: false,
          feedback: 'Incorrecto. Para conservar al cliente con NULL en orders, la condición o.status = \'completed\' debe ir dentro del ON, no en el WHERE.'
        },
        {
          id: 'c',
          text: 'Devuelve un error de sintaxis porque LEFT JOIN no admite cláusula WHERE.',
          correct: false,
          feedback: 'Incorrecto. Es sintácticamente válido, lo que hace que este error pase desapercibido en revisiones rápidas.'
        }
      ],
      explanation: 'La cláusula WHERE filtra el resultado ya unido. Si exiges o.status = \'completed\' en WHERE, descartas todas las filas donde o.status es NULL o tiene otro estado, anulando el efecto del LEFT JOIN.'
    },
    {
      id: 'c2',
      type: 'predict-output',
      prompt: 'La tabla `orders` tiene 18 000 filas (1 fila por pedido) y `refunds` tiene 1 450 filas correspondientes a 1 150 pedidos distintos. ¿Cuántas filas devuelve `SELECT o.order_id FROM orders o SEMI JOIN refunds r ON o.order_id = r.order_id`?',
      options: [
        {
          id: 'a',
          text: '1 150 filas (una por cada pedido que tiene al menos una devolución).',
          correct: true,
          feedback: 'Exacto. SEMI JOIN comprueba existencia en refunds sin multiplicar los 300 pedidos que tienen dos devoluciones.'
        },
        {
          id: 'b',
          text: '1 450 filas (una por cada fila coincidente en refunds).',
          correct: false,
          feedback: 'Incorrecto. 1 450 es el resultado de un INNER JOIN, que repite el pedido por cada devolución asociada.'
        },
        {
          id: 'c',
          text: '18 000 filas con una columna booleana indicando si hubo devolución.',
          correct: false,
          feedback: 'Incorrecto. SEMI JOIN filtra las filas de la tabla izquierda; no conserva las 16 850 filas sin coincidencia.'
        }
      ],
      explanation: 'SEMI JOIN devuelve únicamente las filas de la tabla izquierda que encuentran al menos una pareja en la tabla derecha, garantizando que ninguna fila de orders se duplique.'
    },
    {
      id: 'c3',
      type: 'fill-code',
      prompt: 'Completa la consulta en DuckDB para obtener todos los pedidos de `orders` que NO tienen ningún registro en `refunds`:',
      template: 'SELECT o.order_id, o.total_usd\nFROM orders o\n{{b1}} JOIN refunds r\n  {{b2}} o.order_id = r.order_id;',
      blanks: [
        { id: 'b1', accepted: ['ANTI', 'anti'] },
        { id: 'b2', accepted: ['ON', 'on'] }
      ],
      explanation: 'En DuckDB, ANTI JOIN ... ON conserva las filas de la tabla izquierda que no tienen ninguna coincidencia en la tabla derecha, equivalente a WHERE NOT EXISTS.'
    },
    {
      id: 'c4',
      type: 'mcq',
      prompt: '¿Qué diferencia a `SEMI JOIN` de `INNER JOIN` cuando la tabla derecha tiene varias filas por cada clave de la tabla izquierda?',
      options: [
        {
          id: 'a',
          text: 'SEMI JOIN no duplica las filas de la izquierda ni permite seleccionar columnas de la tabla derecha.',
          correct: true,
          feedback: 'Correcto. SEMI JOIN solo filtra la tabla izquierda por existencia, manteniendo intacto su grano original.'
        },
        {
          id: 'b',
          text: 'SEMI JOIN conserva las filas sin pareja rellenándolas con NULL.',
          correct: false,
          feedback: 'Incorrecto. Rellenar con NULL las filas sin pareja es el comportamiento de LEFT JOIN.'
        },
        {
          id: 'c',
          text: 'SEMI JOIN suma automáticamente las columnas numéricas de la tabla derecha.',
          correct: false,
          feedback: 'Incorrecto. Ningún tipo de JOIN agrega valores automáticamente sin una cláusula GROUP BY.'
        }
      ],
      explanation: 'Un SEMI JOIN actúa como un filtro de existencia: verifica si la clave aparece en la tabla derecha, devuelve cada fila izquierda como máximo una vez y no expone columnas de la derecha.'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Clientes sin asignación a experimentos con ANTI JOIN',
    language: 'sql',
    prompt: 'En Mercado Brisa, calcula por cada segmento (`segment`) cuántos clientes de `customers` nunca fueron asignados a ningún experimento en `experiment_assignments`. Devuelve las columnas `segment` y `clientes_sin_experimento`, ordenando por `clientes_sin_experimento DESC, segment ASC`.',
    starterCode: 'SELECT\n  c.segment,\n  COUNT(*) AS clientes_sin_experimento\nFROM customers c\n-- TODO: Reemplaza INNER JOIN por una unión que conserve solo clientes sin filas en experiment_assignments\nINNER JOIN experiment_assignments ea\n  ON c.customer_id = ea.customer_id\nGROUP BY c.segment\nORDER BY clientes_sin_experimento DESC, c.segment ASC;',
    expected: 'SELECT\n  c.segment,\n  COUNT(*) AS clientes_sin_experimento\nFROM customers c\nANTI JOIN experiment_assignments ea\n  ON c.customer_id = ea.customer_id\nGROUP BY c.segment\nORDER BY clientes_sin_experimento DESC, c.segment ASC;',
    orderMatters: true,
    hints: [
      'Un INNER JOIN devuelve los clientes que sí tienen asignaciones y además los multiplica por cada experimento.',
      'En DuckDB puedes usar ANTI JOIN entre customers y experiment_assignments por customer_id (o LEFT JOIN filtrando WHERE ea.customer_id IS NULL).',
      'Agrupa por c.segment y ordena por clientes_sin_experimento DESC, c.segment ASC.'
    ],
    solution: 'SELECT\n  c.segment,\n  COUNT(*) AS clientes_sin_experimento\nFROM customers c\nANTI JOIN experiment_assignments ea\n  ON c.customer_id = ea.customer_id\nGROUP BY c.segment\nORDER BY clientes_sin_experimento DESC, c.segment ASC;',
    solutionExplanation: 'ANTI JOIN conserva únicamente los 115 clientes de `customers` cuyo `customer_id` no aparece en `experiment_assignments` (86 en `pro_barista`, 29 en `cafeteria_b2b` y 0 en `retail`).',
    expectedOutputTable: [
      { segment: 'pro_barista', clientes_sin_experimento: 86 },
      { segment: 'cafeteria_b2b', clientes_sin_experimento: 29 }
    ]
  },

  roleNotes: {
    de: 'En pipelines incrementales, usa ANTI JOIN contra la tabla de destino para insertar únicamente registros nuevos y FULL OUTER JOIN sobre hashes de filas para detectar discrepancias entre el origen transaccional y el almacén.',
    da: 'Cuando filtres usuarios que realizaron un evento (como abrir la app o devolver un pedido), usa SEMI JOIN o EXISTS en lugar de INNER JOIN para no multiplicar las filas del usuario antes de calcular promedios.',
    bi: 'En herramientas como Power BI o Looker, las relaciones del modelo semántico suelen comportarse como LEFT JOIN desde los hechos hacia las dimensiones; si una clave foránea no existe en la dimensión, aparecerá una fila en blanco.'
  },

  summary: [
    'INNER JOIN conserva solo coincidencias; LEFT JOIN preserva toda la tabla izquierda rellenando ausencias con NULL.',
    'Filtrar una columna de la tabla derecha en WHERE descarta los NULL y convierte un LEFT JOIN en INNER JOIN.',
    'Pon las condiciones de filtrado de la tabla derecha dentro del ON cuando necesites conservar las filas izquierdas.',
    'SEMI JOIN (EXISTS) y ANTI JOIN (NOT EXISTS) comprueban existencia sin duplicar filas de la tabla izquierda.'
  ],

  flashcards: [
    {
      id: 'fc-c1-joins-01-a',
      front: '¿Qué ocurre si aplicas `WHERE d.estado = \'activo\'` después de hacer `FROM izq LEFT JOIN der d ON ...`?',
      back: 'Las filas sin pareja tienen `d.estado = NULL`; el `WHERE` las descarta y convierte el `LEFT JOIN` en un `INNER JOIN`.'
    },
    {
      id: 'fc-c1-joins-01-b',
      front: '¿Dónde debes escribir el filtro sobre la tabla derecha en un `LEFT JOIN` para no perder las filas sin pareja de la izquierda?',
      back: 'Dentro de la cláusula `ON` (`LEFT JOIN der d ON izq.id = d.id AND d.estado = \'activo\'`).'
    },
    {
      id: 'fc-c1-joins-01-c',
      front: '¿Por qué es preferible `SEMI JOIN` (o `EXISTS`) frente a `INNER JOIN` cuando solo quieres filtrar una tabla por presencia en otra?',
      back: 'Porque `SEMI JOIN` devuelve cada fila de la tabla izquierda como máximo una vez, evitando duplicados cuando la tabla derecha tiene relación 1:N.'
    },
    {
      id: 'fc-c1-joins-01-d',
      front: '¿Qué devuelve `A ANTI JOIN B ON A.id = B.id`?',
      back: 'Devuelve únicamente las filas de la tabla izquierda `A` que no tienen ninguna coincidencia en la tabla derecha `B`.'
    }
  ],

  glossaryTerms: [
    'c1-joins-left-join',
    'c1-joins-semi-anti'
  ],

  sources: [
    {
      title: 'DuckDB SQL Reference — FROM and JOIN Clause (INNER, LEFT, FULL, SEMI, ANTI)',
      url: 'https://duckdb.org/docs/sql/query_syntax/from.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Sintaxis nativa de SEMI JOIN, ANTI JOIN, OUTER JOIN y cláusula USING en DuckDB.'
    },
    {
      title: 'PostgreSQL 17 Documentation — Section 7.2: Table Expressions and JOIN Clauses',
      url: 'https://www.postgresql.org/docs/current/queries-table-expressions.html',
      publisher: 'PostgreSQL Global Development Group',
      accessed: '2026-10-29',
      supports: 'Diferencia de evaluación entre predicados en ON (antes de extender nulos) y filtros en WHERE (después de la unión).'
    },
    {
      title: 'PostgreSQL 17 Documentation — Section 9.24: Subquery Expressions (EXISTS / NOT EXISTS)',
      url: 'https://www.postgresql.org/docs/current/functions-subquery.html',
      publisher: 'PostgreSQL Global Development Group',
      accessed: '2026-10-29',
      supports: 'Semántica de comprobación de existencia con cortocircuito en EXISTS y NOT EXISTS.'
    }
  ],

  aiNotes: 'El error más común es poner filtros de la tabla derecha en el WHERE tras un LEFT JOIN y perder los nulos, o usar INNER JOIN + DISTINCT en lugar de SEMI JOIN. Pide a la persona que trace qué vale la columna derecha cuando no hay coincidencia (NULL) y cómo la evalúa el WHERE.'
};

export default lesson;
