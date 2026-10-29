// Lección migrada de l2-window-functions y editada en Fase 3 (esquema v2, SQL real sobre Mercado Brisa)
const lesson = {
  id: 'c2-sql-analitico-01-window-functions',
  moduleId: 'c2-sql-analitico',
  tracks: ['core'],
  level: 2,
  order: 1,
  title: 'Funciones de ventana y cláusula QUALIFY',
  minutes: 30,
  prerequisites: ['c1-sql-joins-02'],
  contentVersion: 2,

  hook: 'En Mercado Brisa (empresa ficticia), la tabla `payments` registra 19 200 cobros para 18 000 pedidos porque el webhook bancario reenvió 450 pagos duplicados con el mismo `idempotency_key`, inflando el total capturado de 6,87 a 7,04 millones de USD. Además, finanzas pide comparar cada compra de un cliente contra su pedido inmediato anterior sin perder las filas individuales. Si usas `GROUP BY`, colapsas el detalle. ¿Cómo limpias duplicados y comparas filas consecutivas en una sola consulta con funciones de ventana y `QUALIFY`?',

  objectives: [
    'Deduplicar eventos repetidos y obtener los N primeros registros por grupo mediante ROW_NUMBER() OVER (...) y la cláusula QUALIFY.',
    'Calcular diferencias periodo a periodo y acumulados usando LAG(), LEAD() y ventanas nombradas con WINDOW.',
    'Elegir entre marcos físicos ROWS BETWEEN y marcos lógicos RANGE BETWEEN al promediar series temporales con días sin actividad.'
  ],

  sections: [
    {
      id: 'estructura-de-over-partition-by-order-by',
      heading: 'Cómo calcula OVER (PARTITION BY ... ORDER BY ...) sin colapsar filas',
      body: 'Una cláusula `GROUP BY` agrupa las filas de entrada y devuelve una única fila de resumen por categoría, cambiando el grano de la tabla. En cambio, una **función de ventana** evalúa un agregado, un ranking o un desplazamiento sobre un conjunto de filas relacionadas, pero conserva intacta cada fila original.\n\nLa cláusula `OVER (...)` define qué filas entran en el cálculo de cada registro. Dentro de ella, `PARTITION BY customer_id` divide la tabla en grupos independientes por cliente, sin mezclar los pedidos de una persona con los de otra. A continuación, `ORDER BY order_date, order_id` ordena cronológicamente las filas dentro de cada partición.\n\nGracias a ese orden interno, la función `LAG(total_usd, 1, 0)` lee el importe del pedido inmediatamente anterior del mismo cliente (o devuelve `0` si es su primera compra). Si varias columnas comparten la misma partición y el mismo orden, puedes declarar una **ventana nombrada** al final de la consulta con `WINDOW w AS (PARTITION BY ... ORDER BY ...)`. Así evitas repetir código y el motor ejecuta un solo ordenamiento en memoria.',
      interactive: {
        component: 'window-function-stepper',
        caption: 'Simulador interactivo: recorre paso a paso cómo PARTITION BY, ORDER BY y el marco de ventana evalúan cada fila sin colapsar el grano.'
      },
      example: {
        language: 'sql',
        code: 'WITH compras_cliente AS (\n  SELECT\n    customer_id,\n    order_id,\n    order_date,\n    total_usd\n  FROM orders\n  WHERE status = \'completed\'\n    AND customer_id = 4\n)\nSELECT\n  customer_id,\n  order_id,\n  order_date,\n  total_usd,\n  LAG(total_usd, 1, 0) OVER w AS pedido_anterior_usd,\n  ROUND(total_usd - LAG(total_usd, 1, 0) OVER w, 2) AS delta_usd\nFROM compras_cliente\nWINDOW w AS (PARTITION BY customer_id ORDER BY order_date, order_id)\nORDER BY order_date, order_id;',
        expectedOutput: [
          { customer_id: 4, order_id: 12923, order_date: '2024-04-06', total_usd: 74.47, pedido_anterior_usd: 0, delta_usd: 74.47 },
          { customer_id: 4, order_id: 21323, order_date: '2024-11-25', total_usd: 978.02, pedido_anterior_usd: 74.47, delta_usd: 903.55 },
          { customer_id: 4, order_id: 17123, order_date: '2025-02-24', total_usd: 132.89, pedido_anterior_usd: 978.02, delta_usd: -845.13 },
          { customer_id: 4, order_id: 25523, order_date: '2025-03-07', total_usd: 120.65, pedido_anterior_usd: 132.89, delta_usd: -12.24 }
        ]
      }
    },
    {
      id: 'funciones-de-ranking-row-number-rank-dense-rank-',
      heading: 'ROW_NUMBER, RANK, DENSE_RANK y filtrado directo con QUALIFY',
      body: 'Las tres funciones de posición numeran las filas de cada partición según su `ORDER BY`, pero tratan los empates de forma distinta. `ROW_NUMBER()` asigna siempre enteros consecutivos únicos (`1, 2, 3`), incluso si dos filas empatan en importe o fecha. Por su parte, `RANK()` asigna el mismo puesto a los empatados y deja huecos en la secuencia (`1, 1, 3`), mientras que `DENSE_RANK()` empata sin saltar números (`1, 1, 2`).\n\nEn el orden lógico de evaluación SQL, las funciones de ventana se calculan después de `WHERE`, `GROUP BY` y `HAVING`. Por eso escribir `WHERE ROW_NUMBER() OVER (...) = 1` produce un error de sintaxis. En DuckDB, Snowflake, BigQuery y Databricks, la cláusula **QUALIFY** filtra el resultado de las funciones de ventana en la misma consulta, sin obligarte a crear una subconsulta envolvente.\n\nEn Mercado Brisa, puedes usar `QUALIFY ROW_NUMBER() OVER (PARTITION BY category ORDER BY ingresos_usd DESC) = 1` para extraer en un solo paso el SKU con mayor facturación dentro de cada categoría del catálogo.',
      example: {
        language: 'sql',
        code: 'WITH ventas_producto AS (\n  SELECT\n    p.category,\n    p.sku,\n    ROUND(SUM(oi.line_total_usd), 2) AS ingresos_usd\n  FROM order_items oi\n  INNER JOIN orders o ON oi.order_id = o.order_id\n  INNER JOIN products p ON oi.product_id = p.product_id\n  WHERE o.status = \'completed\'\n  GROUP BY p.category, p.sku\n)\nSELECT\n  category,\n  sku,\n  ingresos_usd,\n  ROW_NUMBER() OVER (PARTITION BY category ORDER BY ingresos_usd DESC) AS ranking_categoria\nFROM ventas_producto\nQUALIFY ranking_categoria = 1\nORDER BY ingresos_usd DESC;',
        expectedOutput: [
          { category: 'Molinos', sku: 'MB-MOL-162', ingresos_usd: 100693.74, ranking_categoria: 1 },
          { category: 'Cafeteras', sku: 'MB-CAF-098', ingresos_usd: 76973.84, ranking_categoria: 1 },
          { category: 'Suscripciones', sku: 'MB-SUS-010', ingresos_usd: 29869.9, ranking_categoria: 1 },
          { category: 'Accesorios', sku: 'MB-ACC-124', ingresos_usd: 27297.44, ranking_categoria: 1 },
          { category: 'Café en grano', sku: 'MB-CAF-001', ingresos_usd: 16440.73, ranking_categoria: 1 }
        ]
      }
    },
    {
      id: 'marcos-de-ventana-diferencia-entre-rows-y-range',
      heading: 'Marcos de ventana: por qué ROWS y RANGE divergen cuando faltan fechas',
      body: 'Cuando incluyes `ORDER BY` dentro de `OVER (...)`, SQL aplica por defecto un marco acumulado (`RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`). Para calcular una media móvil, debes declarar si el borde se mide en filas físicas (`ROWS`) o en valores (`RANGE`).\n\nLa diferencia cambia el resultado cuando faltan fechas intermedias:\n- `ROWS BETWEEN 6 PRECEDING AND CURRENT ROW` retrocede 6 filas físicas, sin mirar su fecha.\n- `RANGE BETWEEN INTERVAL 6 DAYS PRECEDING AND CURRENT ROW` incluye solo las filas dentro de los últimos 7 días calendario.\n\nEn la tienda 14 de Mercado Brisa (`store_id = 14`), no hubo ventas todos los días a inicios de 2023. El `2023-03-23`, el marco `ROWS BETWEEN 6 PRECEDING` toma 7 filas de semanas previas y promedia `$441.58` USD. En cambio, `RANGE BETWEEN INTERVAL 6 DAYS PRECEDING` detecta solo `1` fila en esa semana y devuelve `$488.99` USD.',
      example: {
        language: 'sql',
        code: 'WITH ventas_tienda_14 AS (\n  SELECT\n    order_date,\n    ROUND(SUM(total_usd), 2) AS revenue_usd\n  FROM orders\n  WHERE status = \'completed\' AND store_id = 14\n  GROUP BY order_date\n)\nSELECT\n  order_date,\n  revenue_usd,\n  COUNT(*) OVER (ORDER BY order_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS filas_rows_6,\n  COUNT(*) OVER (ORDER BY order_date RANGE BETWEEN INTERVAL 6 DAYS PRECEDING AND CURRENT ROW) AS filas_range_6d,\n  ROUND(AVG(revenue_usd) OVER (ORDER BY order_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW), 2) AS avg_rows_usd,\n  ROUND(AVG(revenue_usd) OVER (ORDER BY order_date RANGE BETWEEN INTERVAL 6 DAYS PRECEDING AND CURRENT ROW), 2) AS avg_range_usd\nFROM ventas_tienda_14\nORDER BY order_date\nLIMIT 4 OFFSET 6;',
        expectedOutput: [
          { order_date: '2023-02-28', revenue_usd: 534.68, filas_rows_6: 7, filas_range_6d: 2, avg_rows_usd: 456.59, avg_range_usd: 478.96 },
          { order_date: '2023-03-06', revenue_usd: 616.26, filas_rows_6: 7, filas_range_6d: 2, avg_rows_usd: 457.25, avg_range_usd: 575.47 },
          { order_date: '2023-03-23', revenue_usd: 488.99, filas_rows_6: 7, filas_range_6d: 1, avg_rows_usd: 441.58, avg_range_usd: 488.99 },
          { order_date: '2023-04-02', revenue_usd: 919.2, filas_rows_6: 7, filas_range_6d: 1, avg_rows_usd: 559.21, avg_range_usd: 919.2 }
        ]
      }
    },
    {
      id: 'sesgo-de-particion-en-produccion-por-valores-nul',
      heading: 'Sesgo de partición (data skew) cuando PARTITION BY recibe valores NULL',
      body: 'Al ejecutar `PARTITION BY customer_id`, el motor agrupa las filas con el mismo valor de clave. En SQL, las funciones de ventana tratan todos los `NULL` como iguales entre sí. Por eso, todas las filas sin cliente caen dentro de una única partición gigante.\n\nEn `events` de Mercado Brisa (65 000 eventos), 58 285 filas se reparten entre 2 400 clientes registrados (unos 24 eventos por cliente). Sin embargo, existen 6 715 eventos anónimos con `customer_id IS NULL` (`10,33 %` de la tabla).\n\nSi ejecutas una ventana con `PARTITION BY customer_id` sobre toda la tabla, esa partición `NULL` concentra 280 veces más filas que un cliente normal. En motores distribuidos (Spark, Snowflake, BigQuery), eso satura la memoria de un nodo trabajador (*data skew*). Para evitarlo, filtra antes `WHERE customer_id IS NOT NULL` o particiona con `COALESCE(CAST(customer_id AS VARCHAR), session_id)`.',
      example: {
        language: 'sql',
        code: 'SELECT\n  CASE\n    WHEN customer_id IS NULL THEN \'NULL (navegación anónima)\'\n    ELSE \'Con customer_id registrado\'\n  END AS tipo_particion,\n  COUNT(*) AS total_eventos,\n  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) AS pct_del_total\nFROM events\nGROUP BY 1\nORDER BY total_eventos DESC;',
        expectedOutput: [
          { tipo_particion: 'Con customer_id registrado', total_eventos: 58285, pct_del_total: 89.67 },
          { tipo_particion: 'NULL (navegación anónima)', total_eventos: 6715, pct_del_total: 10.33 }
        ]
      }
    }
  ],

  workedExample: {
    title: 'Deduplicación de webhooks bancarios en Mercado Brisa con QUALIFY',
    description: 'En la tabla `payments` de Mercado Brisa existen 405 cobros capturados (`status = \'captured\'`) duplicados por reintentos de red que comparten el mismo `idempotency_key` con 4 segundos de diferencia. Compara la suma contaminada frente a la deduplicación directa con `QUALIFY`:',
    audit: 'Al aplicar `QUALIFY ROW_NUMBER() OVER (PARTITION BY idempotency_key ORDER BY payment_ts DESC, payment_id DESC) = 1`, se eliminan los 405 cobros capturados repetidos y el total cobrado baja de $7,043,162.63 a los $6,874,488.00 USD reales.',
    steps: [
      {
        label: 'Paso 1 — Antipatrón: agregar payments sin deduplicar reintentos de webhook',
        explanation: 'Si sumas directamente `payments` filtrando solo `status = \'captured\'`, cuentas 16 605 filas para 16 200 claves de idempotencia únicas, inflando la recaudación en $168,674.63 USD.',
        code: 'SELECT\n  COUNT(*) AS filas_capturadas,\n  COUNT(DISTINCT idempotency_key) AS claves_idempotencia_unicas,\n  COUNT(*) - COUNT(DISTINCT idempotency_key) AS cobros_duplicados,\n  ROUND(SUM(amount_usd), 2) AS monto_capturado_inflado_usd\nFROM payments\nWHERE status = \'captured\';',
        expectedOutput: [
          {
            filas_capturadas: 16605,
            claves_idempotencia_unicas: 16200,
            cobros_duplicados: 405,
            monto_capturado_inflado_usd: 7043162.63
          }
        ]
      },
      {
        label: 'Paso 2 — Solución verificada: deduplicar por idempotency_key con QUALIFY',
        explanation: 'La cláusula `QUALIFY` conserva únicamente la fila más reciente (`ROW_NUMBER() = 1`) de cada `idempotency_key` en una sola CTE limpia, entregando exactamente los 16 200 cobros reales.',
        code: 'WITH pagos_unicos AS (\n  SELECT\n    payment_id,\n    order_id,\n    idempotency_key,\n    amount_usd\n  FROM payments\n  WHERE status = \'captured\'\n  QUALIFY ROW_NUMBER() OVER (\n    PARTITION BY idempotency_key\n    ORDER BY payment_ts DESC, payment_id DESC\n  ) = 1\n)\nSELECT\n  COUNT(*) AS cobros_unicos_limpios,\n  ROUND(SUM(amount_usd), 2) AS monto_capturado_real_usd\nFROM pagos_unicos;',
        expectedOutput: [
          {
            cobros_unicos_limpios: 16200,
            monto_capturado_real_usd: 6874488
          }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: '¿Cuál es la diferencia entre `ROWS BETWEEN 6 PRECEDING AND CURRENT ROW` y `RANGE BETWEEN INTERVAL 6 DAYS PRECEDING AND CURRENT ROW` al calcular una media móvil de 7 días?',
      options: [
        {
          id: 'a',
          text: '`ROWS` cuenta 6 filas físicas hacia atrás (aunque correspondan a semanas anteriores si faltan días), mientras que `RANGE` evalúa el intervalo exacto de los últimos 6 días calendario.',
          correct: true,
          feedback: 'Correcto. Si una tienda no tuvo ventas durante dos días, `ROWS 6 PRECEDING` saltará a fechas más antiguas fuera de la semana actual.'
        },
        {
          id: 'b',
          text: 'No existe diferencia; ambos marcos devuelven siempre el mismo promedio sobre columnas `DATE`.',
          correct: false,
          feedback: 'Incorrecto. En cuanto falta una fecha en la serie o hay dos filas con la misma fecha, `ROWS` y `RANGE` agrupan conjuntos distintos.'
        },
        {
          id: 'c',
          text: '`RANGE` colapsa la tabla igual que un `GROUP BY`, mientras que `ROWS` mantiene las filas.',
          correct: false,
          feedback: 'Incorrecto. Ningún marco de ventana colapsa las filas de la consulta.'
        }
      ],
      explanation: 'Los marcos ROWS cuentan posiciones físicas de fila tras ordenar la partición, mientras que RANGE compara el valor numérico o temporal de la columna del ORDER BY.'
    },
    {
      id: 'c2',
      type: 'mcq',
      prompt: 'Quieres conservar únicamente el cobro más reciente de cada `idempotency_key` en DuckDB sin crear una subconsulta adicional. ¿Qué cláusula debes utilizar?',
      options: [
        {
          id: 'a',
          text: 'QUALIFY ROW_NUMBER() OVER (PARTITION BY idempotency_key ORDER BY payment_ts DESC) = 1',
          correct: true,
          feedback: 'Correcto. QUALIFY se evalúa después de calcular las funciones de ventana y filtra directamente las filas con puesto 1.'
        },
        {
          id: 'b',
          text: 'WHERE ROW_NUMBER() OVER (PARTITION BY idempotency_key ORDER BY payment_ts DESC) = 1',
          correct: false,
          feedback: 'Incorrecto. WHERE se ejecuta antes de calcular las funciones de ventana y produce un error en el motor SQL.'
        },
        {
          id: 'c',
          text: 'HAVING ROW_NUMBER() OVER (PARTITION BY idempotency_key ORDER BY payment_ts DESC) = 1',
          correct: false,
          feedback: 'Incorrecto. HAVING filtra grupos generados por GROUP BY, no funciones de ventana sobre filas individuales.'
        }
      ],
      explanation: 'En el orden de evaluación SQL, WHERE y HAVING se ejecutan antes que las funciones OVER(); QUALIFY actúa como el filtro específico posterior al cálculo de ventanas.'
    },
    {
      id: 'c3',
      type: 'mcq',
      prompt: 'En SQL estándar, cuando escribes `SUM(total_usd) OVER (PARTITION BY customer_id ORDER BY order_date)` sin especificar `ROWS` ni `RANGE`, ¿qué marco aplica el motor por defecto?',
      options: [
        {
          id: 'a',
          text: 'RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW (agrupando empates en order_date).',
          correct: true,
          feedback: 'Correcto. Al incluir ORDER BY dentro de OVER(), el marco predeterminado acumula por valor (RANGE) desde el inicio de la partición hasta el valor actual.'
        },
        {
          id: 'b',
          text: 'ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING (toda la partición completa).',
          correct: false,
          feedback: 'Incorrecto. Ese marco de partición completa solo se aplica cuando omites por completo la cláusula ORDER BY dentro de OVER().'
        },
        {
          id: 'c',
          text: 'ROWS BETWEEN 1 PRECEDING AND CURRENT ROW.',
          correct: false,
          feedback: 'Incorrecto. SQL nunca limita la ventana a una sola fila previa salvo que lo declares de forma explícita.'
        }
      ],
      explanation: 'Declarar explícitamente ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW evita saltos inesperados en el acumulado cuando dos pedidos de un cliente tienen la misma fecha.'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Ingresos diarios con LAG y media móvil',
    language: 'sql',
    prompt: 'Calcula sobre `orders` (`status = \'completed\'`, `store_id = 1`) los primeros 10 días con ventas (`ORDER BY order_date LIMIT 10`): `store_id`, `order_date`, `revenue_usd`, el ingreso del día con ventas previo (`prev_day_revenue_usd` usando `LAG` con valor por defecto `0`) y la media móvil de 3 filas (`rolling_3_avg_usd`).',
    starterCode: 'WITH daily_store_sales AS (\n  SELECT\n    store_id,\n    order_date,\n    ROUND(SUM(total_usd), 2) AS revenue_usd\n  FROM orders\n  WHERE status = \'completed\'\n    AND store_id = 1\n  GROUP BY store_id, order_date\n)\nSELECT\n  store_id,\n  order_date,\n  revenue_usd,\n  -- Reemplaza 0.0 por LAG(revenue_usd, 1, 0) OVER (PARTITION BY store_id ORDER BY order_date)\n  0.0 AS prev_day_revenue_usd,\n  ROUND(\n    AVG(revenue_usd) OVER (\n      PARTITION BY store_id\n      ORDER BY order_date\n      ROWS BETWEEN 2 PRECEDING AND CURRENT ROW\n    ),\n    2\n  ) AS rolling_3_avg_usd\nFROM daily_store_sales\nORDER BY order_date\nLIMIT 10;',
    expected: 'WITH daily_store_sales AS (\n  SELECT\n    store_id,\n    order_date,\n    ROUND(SUM(total_usd), 2) AS revenue_usd\n  FROM orders\n  WHERE status = \'completed\'\n    AND store_id = 1\n  GROUP BY store_id, order_date\n)\nSELECT\n  store_id,\n  order_date,\n  revenue_usd,\n  LAG(revenue_usd, 1, 0) OVER (\n    PARTITION BY store_id\n    ORDER BY order_date\n  ) AS prev_day_revenue_usd,\n  ROUND(\n    AVG(revenue_usd) OVER (\n      PARTITION BY store_id\n      ORDER BY order_date\n      ROWS BETWEEN 2 PRECEDING AND CURRENT ROW\n    ),\n    2\n  ) AS rolling_3_avg_usd\nFROM daily_store_sales\nORDER BY order_date\nLIMIT 10;',
    orderMatters: true,
    hints: [
      'Sustituye `0.0 AS prev_day_revenue_usd` por `LAG(revenue_usd, 1, 0) OVER (PARTITION BY store_id ORDER BY order_date) AS prev_day_revenue_usd`.',
      'El tercer argumento de `LAG(revenue_usd, 1, 0)` asigna `0` a la primera fecha de la tienda donde no existe fila anterior.',
      'Conserva el marco `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` y el `ORDER BY order_date LIMIT 10` al final.'
    ],
    solution: 'WITH daily_store_sales AS (\n  SELECT\n    store_id,\n    order_date,\n    ROUND(SUM(total_usd), 2) AS revenue_usd\n  FROM orders\n  WHERE status = \'completed\'\n    AND store_id = 1\n  GROUP BY store_id, order_date\n)\nSELECT\n  store_id,\n  order_date,\n  revenue_usd,\n  LAG(revenue_usd, 1, 0) OVER (\n    PARTITION BY store_id\n    ORDER BY order_date\n  ) AS prev_day_revenue_usd,\n  ROUND(\n    AVG(revenue_usd) OVER (\n      PARTITION BY store_id\n      ORDER BY order_date\n      ROWS BETWEEN 2 PRECEDING AND CURRENT ROW\n    ),\n    2\n  ) AS rolling_3_avg_usd\nFROM daily_store_sales\nORDER BY order_date\nLIMIT 10;',
    solutionExplanation: 'Agrega primero las ventas completadas por `(store_id, order_date)` en la CTE `daily_store_sales` y luego evalúa sobre ese grano diario `LAG(revenue_usd, 1, 0)` y el promedio móvil de 3 filas.'
  },

  roleNotes: {
    de: 'Estandariza la deduplicación de eventos e ingestas en la capa intermedia usando `QUALIFY ROW_NUMBER() OVER (PARTITION BY idempotency_key ORDER BY payment_ts DESC) = 1`. Evita el sesgo de partición en motores distribuidos filtrando o sustituyendo claves nulas (`COALESCE(CAST(customer_id AS VARCHAR), session_id)`) antes de particionar. Declara cláusulas `WINDOW` nombradas para reutilizar un único ordenamiento.',
    da: 'Usa `LAG()` y `LEAD()` para medir días transcurridos entre compras de un mismo cliente y detectar caídas de gasto sin hacer auto-uniones. Aplica marcos `RANGE BETWEEN INTERVAL ...` cuando calcules medias móviles sobre tablas donde hay días sin transacciones. Combina `SUM(ventas) OVER (ORDER BY ventas DESC) / SUM(ventas) OVER ()` para construir curvas de Pareto.',
    bi: 'Asegura que las comparativas periodo a periodo (`LAG(..., 1)` mensual o `LAG(..., 12)` interanual) se calculen sobre una tabla calendario continua sin meses faltantes. Expone promedios móviles de 7 y 28 días ya auditados en las vistas analíticas para suavizar el ruido diario en los tableros operativos.'
  },

  summary: [
    'Una función de ventana calcula agregados, rankings o desplazamientos conservando intacto el grano de cada fila.',
    'La cláusula QUALIFY filtra el resultado de funciones de ventana sin requerir subconsultas adicionales.',
    'ROWS cuenta filas físicas adyacentes; RANGE evalúa un intervalo de valores o de tiempo calendario.',
    'Particionar por una columna con miles de valores NULL concentra la carga en una sola partición.'
  ],

  flashcards: [
    {
      id: 'fc-c2-win-01',
      front: '¿En qué se diferencian ROW_NUMBER(), RANK() y DENSE_RANK() ante un empate?',
      back: 'ROW_NUMBER asigna números únicos (1, 2, 3); RANK empata y salta puestos (1, 1, 3); DENSE_RANK empata sin dejar huecos (1, 1, 2).'
    },
    {
      id: 'fc-c2-win-02',
      front: '¿Por qué RANGE BETWEEN INTERVAL 6 DAYS PRECEDING difiere de ROWS BETWEEN 6 PRECEDING en series diarias?',
      back: 'Porque si falta un día sin ventas, ROWS retrocede 6 filas físicas hacia fechas más antiguas, mientras RANGE evalúa solo los últimos 6 días calendario.'
    },
    {
      id: 'fc-c2-win-03',
      front: '¿Qué problema provoca PARTITION BY customer_id sobre una tabla de eventos con 10 % de sesiones anónimas (NULL)?',
      back: 'Agrupa todas las filas con customer_id IS NULL en una única partición gigante, provocando sesgo de datos (data skew) en memoria.'
    }
  ],

  glossaryTerms: [
    'c03-window-qualify',
    'c05-window-frames',
    'c2-sql-qualify',
    'c2-sql-marco-ventana'
  ],

  sources: [
    {
      title: 'DuckDB SQL Reference — Window Functions (OVER, PARTITION BY, ORDER BY, WINDOW)',
      url: 'https://duckdb.org/docs/sql/functions/window_functions.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Sintaxis y evaluación de funciones de ventana, funciones de ranking, LAG/LEAD y cláusula WINDOW nombrada en DuckDB.'
    },
    {
      title: 'DuckDB SQL Reference — QUALIFY Clause',
      url: 'https://duckdb.org/docs/sql/query_syntax/qualify.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Filtrado directo de expresiones de ventana mediante QUALIFY sin subconsulta envolvente.'
    },
    {
      title: 'PostgreSQL 17 Documentation — Section 3.5: Window Functions',
      url: 'https://www.postgresql.org/docs/current/tutorial-window.html',
      publisher: 'PostgreSQL Global Development Group',
      accessed: '2026-10-29',
      supports: 'Comportamiento de PARTITION BY y ORDER BY conservando las filas individuales frente a GROUP BY.'
    },
    {
      title: 'PostgreSQL 17 Documentation — Section 4.2.8: Window Function Calls (Frame Clause)',
      url: 'https://www.postgresql.org/docs/current/sql-expressions.html#SYNTAX-WINDOW-FUNCTIONS',
      publisher: 'PostgreSQL Global Development Group',
      accessed: '2026-10-29',
      supports: 'Definición formal de marcos ROWS, RANGE y GROUPS en el estándar SQL.'
    }
  ],

  aiNotes: 'Las dudas frecuentes son por qué WHERE no acepta ROW_NUMBER(), por qué SUM() OVER (ORDER BY fecha) agrupa empates debido al marco por defecto RANGE, y cómo afecta un día sin ventas a ROWS BETWEEN 6 PRECEDING. En Mercado Brisa usa payments (405 duplicados capturados por idempotency_key) y orders como ejemplos.',
  legacyId: 'l2-window-functions',
  legacyOrder: 2,
  stageId: 'stage-1',
  subtitle: 'Cómo calcular rankings, variaciones entre compras y promedios móviles sin agrupar ni colapsar filas.',
  goal: 'Utilizar OVER (PARTITION BY ... ORDER BY ...), elegir entre marcos ROWS y RANGE, y filtrar funciones de ventana con QUALIFY.',
  pipelineChallenge: {
    title: 'Deduplicación de pagos y variación por cliente sin duplicados',
    scenario: 'Ordena la secuencia técnica para limpiar cobros duplicados por reintentos de webhook en Mercado Brisa y calcular la variación entre compras sucesivas de cada cliente.',
    steps: [
      {
        id: 'step-1',
        label: '1. Deduplicar cobros crudos por idempotency_key con QUALIFY',
        role: 'DE',
        detail: 'Aplicar `QUALIFY ROW_NUMBER() OVER (PARTITION BY idempotency_key ORDER BY payment_ts DESC, payment_id DESC) = 1` sobre los pagos capturados.'
      },
      {
        id: 'step-2',
        label: '2. Agregar pagos limpios al grano de pedido (order_id)',
        role: 'DE',
        detail: 'Agrupar los cobros únicos por `order_id` antes de unirlos con `orders` para preservar la relación uno a uno.'
      },
      {
        id: 'step-3',
        label: '3. Calcular el importe previo y el delta por cliente con LAG()',
        role: 'DA',
        detail: 'Evaluar `total_usd - LAG(total_usd, 1, 0) OVER (PARTITION BY customer_id ORDER BY order_date, order_id)` para medir la variación entre pedidos.'
      },
      {
        id: 'step-4',
        label: '4. Publicar la serie reconciliada con media móvil en el tablero',
        role: 'BI',
        detail: 'Exponer la evolución verificada con promedios móviles sobre calendario continuo para seguimiento operativo.'
      }
    ],
    explanation: 'Si calculas `LAG()` sobre cobros sin deduplicar antes con `QUALIFY`, compararás un reintento de webhook consigo mismo (delta = 0) e inflarás el ingreso acumulado.'
  },
  relatedLessons: [
    {
      id: 'c1-sql-joins-02-grano-fanout',
      reason: 'Deduplica primero tus tablas de eventos o pagos con `QUALIFY` para evitar multiplicar filas al hacer JOIN.'
    },
    {
      id: 'c2-sql-analitico-02-asof-lateral-ctes',
      reason: 'Cuando las marcas de tiempo entre dos tablas no coinciden al segundo exacto, combina tus CTEs con `ASOF JOIN`.'
    }
  ]
};

export default lesson;
