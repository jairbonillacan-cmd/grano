const lesson = {
  id: 'c1-sql-joins-05-conjuntos-union',
  moduleId: 'c1-sql-joins',
  tracks: ['core'],
  level: 1,
  order: 5,
  title: 'Operaciones de conjuntos: UNION, UNION ALL, INTERSECT',
  minutes: 20,
  prerequisites: ['c1-sql-joins-04-ctes-legibles'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), un analista quiere apilar en una sola tabla los importes diarios de `orders` (18 000 filas) y `refunds` (1 450 filas) seleccionando únicamente `(tipo_movimiento, fecha, monto_usd)`. Para unir ambas consultas escribe `UNION` en lugar de `UNION ALL`. Sin arrojar ningún error, el resultado pierde 20 pedidos legítimos y $4,903.43 USD de ingresos. ¿Por qué `UNION` borró esas 20 filas y cuándo debes usar `UNION ALL`, `INTERSECT` o `EXCEPT`?',

  objectives: [
    'Distinguir cuándo usar UNION ALL frente a UNION para apilar filas sin perder transacciones legítimas ni pagar costo de ordenamiento.',
    'Aplicar INTERSECT y EXCEPT para auditar coincidencias y diferencias entre dos conjuntos de claves o períodos.',
    'Explicar cómo tratan las operaciones de conjuntos los valores NULL frente a las condiciones de igualdad en un JOIN.'
  ],

  sections: [
    {
      id: 'combinar-filas-vs-columnas',
      heading: 'JOIN añade columnas horizontalmente; los conjuntos apilan filas',
      body: 'Un `JOIN` empareja dos tablas horizontalmente mediante una clave común para añadir columnas a cada fila. En cambio, las **operaciones de conjuntos** (`UNION`, `UNION ALL`, `INTERSECT`, `EXCEPT`) combinan o comparan verticalmente las filas producidas por dos o más consultas independientes.\n\nPara combinar dos consultas en SQL estándar, ambas deben devolver exactamente el mismo número de columnas. Además, cada columna debe tener un tipo de dato compatible con su par en la misma posición. Los nombres de columna del resultado final se toman siempre del primer `SELECT`. En DuckDB existe también `UNION ALL BY NAME`, que empareja las columnas por su nombre y rellena con `NULL` las columnas ausentes.',
      example: {
        language: 'sql',
        code: 'SELECT\n  \'pedidos\' AS tipo,\n  EXTRACT(YEAR FROM order_date) AS anio,\n  COUNT(*) AS registros,\n  ROUND(SUM(total_usd), 2) AS monto_usd\nFROM orders\nWHERE EXTRACT(YEAR FROM order_date) = 2025\nGROUP BY anio\nUNION ALL\nSELECT\n  \'reembolsos\' AS tipo,\n  EXTRACT(YEAR FROM refund_date) AS anio,\n  COUNT(*) AS registros,\n  ROUND(SUM(refund_amount_usd), 2) AS monto_usd\nFROM refunds\nWHERE EXTRACT(YEAR FROM refund_date) = 2025\nGROUP BY anio;',
        expectedOutput: [
          { tipo: 'pedidos', anio: 2025, registros: 7634, monto_usd: 3272325.98 },
          { tipo: 'reembolsos', anio: 2025, registros: 637, monto_usd: 142501.01 }
        ]
      }
    },
    {
      id: 'union-all-vs-union-costo-y-riesgo',
      heading: 'Por qué UNION ALL debe ser tu opción por defecto frente a UNION',
      body: 'La diferencia entre `UNION ALL` y `UNION` afecta tanto a la exactitud de los datos como al rendimiento. `UNION ALL` concatena todas las filas de la primera consulta con todas las filas de la segunda. No inspecciona los valores ni elimina filas.\n\nPor el contrario, escribir `UNION` (sin `ALL`) ejecuta una deduplicación global (`DISTINCT`) sobre todas las filas combinadas. Elimina tanto los duplicados entre ambas tablas como las filas idénticas dentro de la misma tabla. Si proyectas `(fecha, monto_usd)` desde `orders` sin incluir `order_id`, dos pedidos reales del mismo día por el mismo importe parecen duplicados y `UNION` borra uno. Además, `UNION` exige construir una tabla hash o ejecutar un ordenamiento completo en memoria. Usa siempre `UNION ALL` salvo que busques deduplicar explícitamente.',
    },
    {
      id: 'intersect-y-except-auditoria',
      heading: 'INTERSECT y EXCEPT para comparar cohortes y auditar tablas',
      body: 'Además de apilar filas, SQL permite calcular la intersección y la diferencia entre dos conjuntos. `INTERSECT` devuelve únicamente las filas distintas que aparecen en ambas consultas. `EXCEPT` devuelve las filas distintas de la primera consulta que no aparecen en la segunda.\n\nAmbos operadores sirven para medir retención entre períodos o para validar migraciones de datos. En Mercado Brisa puedes comparar los clientes que compraron en 2023 contra los que compraron en 2024. `INTERSECT` devuelve los 1 140 clientes retenidos en ambos años. Por su parte, `2023 EXCEPT 2024` devuelve los 44 clientes que dejaron de comprar y `2024 EXCEPT 2023` los 1 185 clientes nuevos.',
      example: {
        language: 'sql',
        code: 'WITH clientes_2023 AS (\n  SELECT DISTINCT customer_id FROM orders WHERE EXTRACT(YEAR FROM order_date) = 2023\n),\nclientes_2024 AS (\n  SELECT DISTINCT customer_id FROM orders WHERE EXTRACT(YEAR FROM order_date) = 2024\n)\nSELECT\n  (SELECT COUNT(*) FROM (SELECT customer_id FROM clientes_2023 INTERSECT SELECT customer_id FROM clientes_2024)) AS retenidos_ambos_anios,\n  (SELECT COUNT(*) FROM (SELECT customer_id FROM clientes_2023 EXCEPT SELECT customer_id FROM clientes_2024)) AS solo_en_2023,\n  (SELECT COUNT(*) FROM (SELECT customer_id FROM clientes_2024 EXCEPT SELECT customer_id FROM clientes_2023)) AS nuevos_en_2024;',
        expectedOutput: [
          {
            retenidos_ambos_anios: 1140,
            solo_en_2023: 44,
            nuevos_en_2024: 1185
          }
        ]
      }
    },
    {
      id: 'reglas-orden-precedencia-y-nulos',
      heading: 'Reglas de ORDER BY, precedencia e igualdad de NULL en conjuntos',
      body: 'Al encadenar varias operaciones de conjuntos, aplica tres reglas del estándar SQL. Primero, escribe `ORDER BY` y `LIMIT` una sola vez al final de toda la consulta compuesta. Si necesitas `LIMIT` en una rama individual, envuélvela entre paréntesis o en una CTE.\n\nSegundo, `INTERSECT` tiene mayor precedencia que `UNION` y `EXCEPT`. Usa paréntesis cuando mezcles distintos operadores en la misma consulta. Tercero, en un `INNER JOIN` la comparación `NULL = NULL` evalúa a `UNKNOWN` y no empareja filas. En cambio, `UNION`, `INTERSECT` y `EXCEPT` tratan dos valores `NULL` en la misma columna como iguales (`IS NOT DISTINCT FROM`). Por eso `EXCEPT` compara correctamente filas con `campaign_id IS NULL`.',
    }
  ],

  workedExample: {
    title: 'Pérdida silenciosa de pedidos al usar UNION en lugar de UNION ALL',
    description: 'En Mercado Brisa hay 20 pares de pedidos distintos que ocurrieron en la misma fecha (`order_date`) con el mismo importe exacto (`total_usd`). Observa cómo `UNION` los borra al apilar movimientos sin clave primaria:',
    steps: [
      {
        label: 'Paso 1 — Error con UNION: deduplica filas legítimas y pierde $4,903.43 USD',
        explanation: 'Al proyectar `(tipo_movimiento, fecha, monto_usd)` con `UNION`, el motor elimina 20 pedidos que coincidieron en fecha e importe con otro pedido del mismo día, reduciendo los pedidos de 18 000 a 17 980.',
        code: 'SELECT\n  tipo_movimiento,\n  COUNT(*) AS registros_contados,\n  ROUND(SUM(monto_usd), 2) AS suma_usd\nFROM (\n  SELECT \'pedido\' AS tipo_movimiento, order_date AS fecha, total_usd AS monto_usd FROM orders\n  UNION\n  SELECT \'reembolso\' AS tipo_movimiento, refund_date AS fecha, refund_amount_usd AS monto_usd FROM refunds\n) AS movimientos_con_union\nGROUP BY tipo_movimiento\nORDER BY tipo_movimiento;',
        expectedOutput: [
          { tipo_movimiento: 'pedido', registros_contados: 17980, suma_usd: 7664914.34 },
          { tipo_movimiento: 'reembolso', registros_contados: 1450, suma_usd: 321097.25 }
        ]
      },
      {
        label: 'Paso 2 — Solución con UNION ALL: preserva los 18 000 pedidos y el importe exacto',
        explanation: 'Al usar `UNION ALL`, DuckDB apila las filas de `orders` y `refunds` sin eliminar coincidencias de fecha e importe, manteniendo los 18 000 pedidos y los $7,669,817.77 USD íntegros.',
        code: 'SELECT\n  tipo_movimiento,\n  COUNT(*) AS registros_contados,\n  ROUND(SUM(monto_usd), 2) AS suma_usd\nFROM (\n  SELECT \'pedido\' AS tipo_movimiento, order_date AS fecha, total_usd AS monto_usd FROM orders\n  UNION ALL\n  SELECT \'reembolso\' AS tipo_movimiento, refund_date AS fecha, refund_amount_usd AS monto_usd FROM refunds\n) AS movimientos_con_union_all\nGROUP BY tipo_movimiento\nORDER BY tipo_movimiento;',
        expectedOutput: [
          { tipo_movimiento: 'pedido', registros_contados: 18000, suma_usd: 7669817.77 },
          { tipo_movimiento: 'reembolso', registros_contados: 1450, suma_usd: 321097.25 }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: '¿Qué hace `UNION` (sin la palabra `ALL`) que `UNION ALL` no hace?',
      options: [
        {
          id: 'a',
          text: 'Elimina las filas duplicadas en todo el conjunto resultante, incluso si estaban repetidas dentro de una misma tabla.',
          correct: true,
          feedback: 'Correcto. UNION aplica una deduplicación global sobre todas las columnas seleccionadas.'
        },
        {
          id: 'b',
          text: 'Empareja las columnas por su nombre aunque estén en distinto orden en cada SELECT.',
          correct: false,
          feedback: 'Incorrecto. Tanto UNION como UNION ALL emparejan por posición salvo que uses explícitamente BY NAME en DuckDB.'
        },
        {
          id: 'c',
          text: 'Conserva únicamente las filas que existen en ambas consultas a la vez.',
          correct: false,
          feedback: 'Incorrecto. El operador que conserva solo las filas presentes en ambos resultados es INTERSECT.'
        }
      ],
      explanation: 'UNION ejecuta un paso adicional de deduplicación (equivalente a SELECT DISTINCT sobre la unión), lo que añade costo de memoria y puede borrar transacciones válidas si no incluiste su identificador único.'
    },
    {
      id: 'c2',
      type: 'predict-output',
      prompt: 'La consulta A devuelve una sola fila `(10, NULL)` y la consulta B devuelve `(10, NULL)`. ¿Cuántas filas devuelven `A INTERSECT B` y `A EXCEPT B` respectivamente?',
      options: [
        {
          id: 'a',
          text: 'INTERSECT devuelve 1 fila y EXCEPT devuelve 0 filas, porque las operaciones de conjuntos tratan dos NULL como iguales.',
          correct: true,
          feedback: 'Exacto. En UNION, INTERSECT y EXCEPT se aplica semántica IS NOT DISTINCT FROM, por lo que (10, NULL) coincide con (10, NULL).'
        },
        {
          id: 'b',
          text: 'INTERSECT devuelve 0 filas y EXCEPT devuelve 1 fila, porque NULL nunca es igual a NULL en SQL.',
          correct: false,
          feedback: 'Incorrecto. Esa regla aplica al operador = en WHERE y JOIN, pero no a la comparación de filas en operaciones de conjuntos.'
        },
        {
          id: 'c',
          text: 'Ambas consultas lanzan un error porque INTERSECT y EXCEPT no admiten valores NULL.',
          correct: false,
          feedback: 'Incorrecto. Las operaciones de conjuntos admiten valores NULL en cualquier columna.'
        }
      ],
      explanation: 'A diferencia de una condición ON a.col = b.col, el estándar SQL define que las operaciones de conjuntos (UNION, INTERSECT, EXCEPT) consideran dos valores NULL como duplicados idénticos.'
    },
    {
      id: 'c3',
      type: 'fill-code',
      prompt: 'Completa la consulta para obtener los `customer_id` que compraron en 2023 pero NO volvieron a comprar en 2024:',
      template: 'SELECT customer_id FROM orders WHERE EXTRACT(YEAR FROM order_date) = 2023\n{{b1}}\nSELECT customer_id FROM orders WHERE EXTRACT(YEAR FROM order_date) = 2024;',
      blanks: [
        { id: 'b1', accepted: ['EXCEPT', 'except'] }
      ],
      explanation: 'El operador EXCEPT calcula la diferencia de conjuntos: devuelve las filas distintas del primer SELECT que no están presentes en el resultado del segundo SELECT.'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Consolidación financiera de tres fuentes con UNION ALL',
    language: 'sql',
    prompt: 'Construye una tabla resumen de control financiero combinando con `UNION ALL` tres filas con las columnas `fuente`, `total_registros` y `monto_total_usd` (redondeado a 2 decimales): 1) `\'pedidos_emitidos\'` desde `orders` (`COUNT(*)` y `SUM(total_usd)`), 2) `\'pagos_capturados\'` desde la subconsulta `pagos_limpios` ya deduplicada por `idempotency_key` (`COUNT(DISTINCT idempotency_key)` y `SUM(amount_usd)`), y 3) `\'reembolsos_procesados\'` desde `refunds` donde `status = \'processed\'` (`COUNT(*)` y `SUM(refund_amount_usd)`). Ordena el resultado final por `monto_total_usd DESC`.',
    starterCode: 'SELECT\n  \'pedidos_emitidos\' AS fuente,\n  COUNT(*) AS total_registros,\n  ROUND(SUM(total_usd), 2) AS monto_total_usd\nFROM orders\nUNION ALL\nSELECT\n  \'pagos_capturados\' AS fuente,\n  COUNT(DISTINCT idempotency_key) AS total_registros,\n  ROUND(SUM(amount_usd), 2) AS monto_total_usd\nFROM (\n  SELECT idempotency_key, MIN(amount_usd) AS amount_usd\n  FROM payments\n  WHERE status = \'captured\'\n  GROUP BY idempotency_key\n) AS pagos_limpios\n-- TODO: Añade UNION ALL con el resumen de \'reembolsos_procesados\' desde refunds (status = \'processed\')\nORDER BY monto_total_usd DESC;',
    expected: 'SELECT\n  \'pedidos_emitidos\' AS fuente,\n  COUNT(*) AS total_registros,\n  ROUND(SUM(total_usd), 2) AS monto_total_usd\nFROM orders\nUNION ALL\nSELECT\n  \'pagos_capturados\' AS fuente,\n  COUNT(DISTINCT idempotency_key) AS total_registros,\n  ROUND(SUM(amount_usd), 2) AS monto_total_usd\nFROM (\n  SELECT idempotency_key, MIN(amount_usd) AS amount_usd\n  FROM payments\n  WHERE status = \'captured\'\n  GROUP BY idempotency_key\n) AS pagos_limpios\nUNION ALL\nSELECT\n  \'reembolsos_procesados\' AS fuente,\n  COUNT(*) AS total_registros,\n  ROUND(SUM(refund_amount_usd), 2) AS monto_total_usd\nFROM refunds\nWHERE status = \'processed\'\nORDER BY monto_total_usd DESC;',
    orderMatters: true,
    hints: [
      'Debajo de `) AS pagos_limpios`, escribe `UNION ALL` y un tercer bloque `SELECT`.',
      'En ese tercer bloque selecciona `\'reembolsos_procesados\' AS fuente, COUNT(*) AS total_registros, ROUND(SUM(refund_amount_usd), 2) AS monto_total_usd FROM refunds WHERE status = \'processed\'`.',
      'Mantén `ORDER BY monto_total_usd DESC` una sola vez al final de toda la consulta.'
    ],
    solution: 'SELECT\n  \'pedidos_emitidos\' AS fuente,\n  COUNT(*) AS total_registros,\n  ROUND(SUM(total_usd), 2) AS monto_total_usd\nFROM orders\nUNION ALL\nSELECT\n  \'pagos_capturados\' AS fuente,\n  COUNT(DISTINCT idempotency_key) AS total_registros,\n  ROUND(SUM(amount_usd), 2) AS monto_total_usd\nFROM (\n  SELECT idempotency_key, MIN(amount_usd) AS amount_usd\n  FROM payments\n  WHERE status = \'captured\'\n  GROUP BY idempotency_key\n) AS pagos_limpios\nUNION ALL\nSELECT\n  \'reembolsos_procesados\' AS fuente,\n  COUNT(*) AS total_registros,\n  ROUND(SUM(refund_amount_usd), 2) AS monto_total_usd\nFROM refunds\nWHERE status = \'processed\'\nORDER BY monto_total_usd DESC;',
    solutionExplanation: 'Apila con `UNION ALL` los tres resúmenes agregados bajo el mismo esquema `(fuente, total_registros, monto_total_usd)` y los ordena de mayor a menor monto al final.',
    expectedOutputTable: [
      { fuente: 'pedidos_emitidos', total_registros: 18000, monto_total_usd: 7669817.77 },
      { fuente: 'pagos_capturados', total_registros: 16200, monto_total_usd: 6874488 },
      { fuente: 'reembolsos_procesados', total_registros: 1450, monto_total_usd: 321097.25 }
    ]
  },

  roleNotes: {
    de: 'Para validar que una refactorización SQL no alteró ni una sola fila (incluyendo columnas con NULL), ejecuta `(SELECT * FROM tabla_nueva EXCEPT SELECT * FROM tabla_vieja) UNION ALL (SELECT * FROM tabla_vieja EXCEPT SELECT * FROM tabla_nueva)`: si devuelve 0 filas, son idénticas.',
    da: 'Usa `UNION ALL` para construir tablas de eventos unificadas (por ejemplo, apilando pedidos, pagos y reembolsos por cliente y fecha) antes de analizar el ciclo de vida.',
    bi: 'En el modelado semántico, si tienes tablas históricas particionadas por año o fuente regional con el mismo esquema, únelas siempre con `UNION ALL` (nunca `UNION`) en la vista de origen.'
  },

  summary: [
    'JOIN combina columnas horizontalmente por clave; las operaciones de conjuntos apilan o comparan filas verticalmente.',
    'Usa UNION ALL por defecto: no elimina transacciones idénticas ni paga el costo de ordenar o hacer hash.',
    'INTERSECT devuelve filas comunes a ambas consultas y EXCEPT devuelve las filas de la primera ausentes en la segunda.',
    'A diferencia de = en un JOIN, UNION, INTERSECT y EXCEPT tratan dos valores NULL como iguales.'
  ],

  flashcards: [
    {
      id: 'fc-c1-joins-05-a',
      front: '¿Por qué es peligroso usar `UNION` en vez de `UNION ALL` al apilar tablas de transacciones sin incluir el ID primario?',
      back: 'Porque `UNION` elimina filas idénticas y borrará transacciones reales distintas que coincidan en fecha, categoría e importe.'
    },
    {
      id: 'fc-c1-joins-05-b',
      front: '¿Cómo comparan los valores `NULL` los operadores `UNION`, `INTERSECT` y `EXCEPT`?',
      back: 'Tratan dos valores `NULL` en la misma columna como iguales (`IS NOT DISTINCT FROM`), a diferencia del operador `=` en `WHERE` o `JOIN`.'
    },
    {
      id: 'fc-c1-joins-05-c',
      front: '¿Qué hace `UNION ALL BY NAME` en DuckDB?',
      back: 'Apila las filas de dos consultas emparejando las columnas por su nombre en lugar de por su posición, rellenando con `NULL` las columnas faltantes.'
    }
  ],

  glossaryTerms: [
    'c1-joins-union-all',
    'c1-joins-cte-with'
  ],

  sources: [
    {
      title: 'DuckDB SQL Reference — Set Operations (UNION, UNION ALL, UNION BY NAME, INTERSECT, EXCEPT)',
      url: 'https://duckdb.org/docs/sql/query_syntax/setops.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Sintaxis de UNION ALL, UNION BY NAME, INTERSECT y EXCEPT en DuckDB.'
    },
    {
      title: 'PostgreSQL 17 Documentation — Section 7.4: Combining Queries (UNION, INTERSECT, EXCEPT)',
      url: 'https://www.postgresql.org/docs/current/queries-union.html',
      publisher: 'PostgreSQL Global Development Group',
      accessed: '2026-10-29',
      supports: 'Reglas de compatibilidad de columnas, precedencia de INTERSECT y uso de ORDER BY al final.'
    },
    {
      title: 'PostgreSQL 17 Documentation — SELECT Reference (Set Operations and NULL Equality)',
      url: 'https://www.postgresql.org/docs/current/sql-select.html',
      publisher: 'PostgreSQL Global Development Group',
      accessed: '2026-10-29',
      supports: 'Tratamiento de dos valores NULL como iguales al deduplicar o comparar filas en operaciones de conjuntos.'
    }
  ],

  aiNotes: 'Las dos confusiones habituales son usar UNION pensando que es más seguro que UNION ALL (cuando en realidad borra filas válidas y es más lento) y pensar que EXCEPT falla con NULL igual que NOT IN (cuando EXCEPT sí trata dos NULL como iguales).'
};

export default lesson;
