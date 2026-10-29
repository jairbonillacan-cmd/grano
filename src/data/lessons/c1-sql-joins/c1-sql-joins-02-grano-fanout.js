// Lección migrada de l1-joins-fanout y editada en Fase 3 (esquema v2, SQL real sobre Mercado Brisa)
const lesson = {
  id: 'c1-sql-joins-02-grano-fanout',
  moduleId: 'c1-sql-joins',
  tracks: ['core'],
  level: 1,
  order: 2,
  title: 'Grano de una tabla y fan-out en JOINs',
  minutes: 25,
  prerequisites: ['c1-sql-joins-01-tipos-join'],
  contentVersion: 2,

  hook: 'En Mercado Brisa (empresa ficticia), la tabla `orders` tiene 18 000 pedidos (con el importe total `total_usd` y el envío `shipping_usd`) y `order_items` tiene 42 000 líneas de producto. Un analista las une con un `JOIN` directo para su cierre mensual y anuncia que los ingresos brutos fueron de 21,83 millones de USD. En contabilidad solo existen 7,67 millones de USD. ¿Qué ocurrió dentro del motor SQL al cruzar ambas tablas?',

  objectives: [
    'Identificar el grano de una tabla verificando su clave primaria real con COUNT(*) y COUNT(DISTINCT).',
    'Detectar cuándo un JOIN uno-a-muchos o muchos-a-muchos multiplica filas y distorsiona sumas y promedios.',
    'Pre-agregar tablas de detalle en CTEs al mismo grano antes de unirlas con tablas de cabecera.'
  ],

  sections: [
    {
      id: 'que-es-el-grano-de-una-tabla-y-por-que-define-su',
      heading: 'Qué es el grano de una tabla y por qué define su contrato',
      body: 'Antes de unir dos tablas en SQL o arrastrar una métrica en un tablero, responde una pregunta obligatoria: ¿qué representa exactamente una fila física en esta tabla? Esa respuesta es el **grano** (o *grain*) de la tabla y corresponde a su clave primaria real.\n\nEn la tabla `orders` de Mercado Brisa, una fila es un pedido único (`order_id`, 18 000 filas). En `order_items`, una fila es una línea de producto dentro de un pedido (`order_item_id`, 42 000 filas). Si cruzas dos tablas sin comprobar el grano de entrada y el grano de salida, las funciones `SUM()` y `AVG()` sumarán valores repetidos sin emitir ningún aviso de error.',
      interactive: {
        component: 'join-fanout-visualizer',
        caption: 'Simulador interactivo: compara el JOIN directo 1:N frente a la pre-agregación en CTE al mismo grano.'
      }
    },
    {
      id: 'anatomia-del-fan-out-1-n-y-del-chasm-trap-n-1-m',
      heading: 'Anatomía del fan-out (1:N) y de la trampa de abismo (N:1:M)',
      body: 'El **fan-out** ocurre cuando unes una tabla de grano grueso (`orders`: 1 fila por pedido) con una tabla de grano fino (`order_items`: entre 1 y 4 productos por pedido). El motor relacional repite las columnas de `orders` por cada línea de `order_items`. Al ejecutar `SUM(o.total_usd)` sobre las 42 000 filas resultantes, sumas varias veces el mismo pedido e inflas el ingreso de 7,67 millones a 21,83 millones de USD.\n\nMás grave aún es la **trampa de abismo** (*chasm trap*, relación `N:1:M`). Ocurre al unir `orders` con `order_items` (3 ítems) y en la misma consulta con `refunds` (2 devoluciones parciales). El cruce genera 3 × 2 = 6 filas para ese pedido, multiplicando tanto las unidades vendidas como el importe devuelto.',
      example: {
        language: 'sql',
        code: 'WITH items_por_pedido AS (\n  SELECT\n    order_id,\n    SUM(qty) AS unidades_pedido,\n    COUNT(DISTINCT product_id) AS skus_distintos\n  FROM order_items\n  GROUP BY order_id\n)\nSELECT\n  COUNT(o.order_id) AS pedidos_reales,\n  ROUND(SUM(o.total_usd), 2) AS ingresos_reales_usd,\n  SUM(COALESCE(i.unidades_pedido, 0)) AS unidades_vendidas\nFROM orders o\nLEFT JOIN items_por_pedido i ON o.order_id = i.order_id;',
        expectedOutput: [
          {
            pedidos_reales: 18000,
            ingresos_reales_usd: 7669817.77,
            unidades_vendidas: 86912
          }
        ]
      }
    },
    {
      id: 'tres-estrategias-tecnicas-para-evitar-el-fan-out',
      heading: 'Tres estrategias técnicas para evitar el fan-out',
      body: 'Existen tres formas de impedir que un cruce multiplique importes. La primera es la **pre-agregación en CTEs**: agrupa cada tabla hija (`order_items`, `refunds`, `payments`) por `order_id` en su propia CTE antes de hacer `LEFT JOIN` contra `orders`. Así conviertes el cruce en una relación `1:1`.\n\nLa segunda es el prorrateo en Ingeniería de Datos: al construir tablas de detalle, reparte los montos de cabecera (como `shipping_usd` o `discount_usd`) en proporción al peso de cada línea para que la tabla fina sea aditiva. La tercera es declarar entidades primarias y foráneas en una capa semántica (como MetricFlow o Cube), de modo que la herramienta genere subconsultas pre-agregadas de forma automática.'
    },
    {
      id: 'auditoria-defensiva-como-detectar-un-fan-out-ant',
      heading: 'Auditoría defensiva: cómo detectar un fan-out antes de publicar',
      body: 'Nunca des por buena una consulta con múltiples `JOIN` sin auditar su cardinalidad. Antes y después del cruce, compara `COUNT(*)` contra `COUNT(DISTINCT order_id)` para confirmar si la clave dejó de ser única.\n\nA continuación, ejecuta una prueba de reconciliación financiera: la suma `SUM(total_usd)` de tu consulta enriquecida debe coincidir al centavo con `SELECT SUM(total_usd) FROM orders` ($7,669,817.77 USD en Mercado Brisa). En los pipelines de datos, esta comprobación se programa como una regla automática que detiene la publicación si la diferencia supera `0.01` USD.'
    }
  ],

  workedExample: {
    title: 'Comparativa real en Mercado Brisa: JOIN directo frente a CTE pre-agregada',
    description: 'Observa cómo cambia la suma real de `orders.total_usd` en Mercado Brisa cuando unes `orders` (18 000 filas) con `order_items` (42 000 filas) sin pre-agregar:',
    audit: 'La CTE pre-agregada mantiene exactamente los 18 000 pedidos y los $7,669,817.77 USD de `orders`, mientras suma las 86 912 unidades de `order_items`.',
    steps: [
      {
        label: 'Paso 1 — Antipatrón: JOIN directo 1:N que infla ingresos un 184,6 %',
        explanation: 'Al unir `orders` directamente con `order_items`, las 18 000 cabeceras se expanden a 42 000 filas y `SUM(o.total_usd)` pasa de 7,67 millones a 21,83 millones de USD.',
        code: 'SELECT\n  COUNT(o.order_id) AS filas_contadas,\n  COUNT(DISTINCT o.order_id) AS pedidos_unicos,\n  ROUND(SUM(o.total_usd), 2) AS ingresos_cabecera_inflados,\n  SUM(i.qty) AS unidades_vendidas\nFROM orders o\nINNER JOIN order_items i ON o.order_id = i.order_id;',
        expectedOutput: [
          {
            filas_contadas: 42000,
            pedidos_unicos: 18000,
            ingresos_cabecera_inflados: 21826463.74,
            unidades_vendidas: 86912
          }
        ]
      },
      {
        label: 'Paso 2 — Solución verificada: CTE pre-agregada al grano order_id',
        explanation: 'Al agrupar primero `order_items` por `order_id` en la CTE `items_por_pedido`, la tabla hija tiene 1 fila por pedido. El `LEFT JOIN` conserva 18 000 filas y el ingreso cuadra al centavo.',
        code: 'WITH items_por_pedido AS (\n  SELECT\n    order_id,\n    SUM(qty) AS unidades_pedido,\n    COUNT(DISTINCT product_id) AS skus_distintos\n  FROM order_items\n  GROUP BY order_id\n)\nSELECT\n  COUNT(o.order_id) AS pedidos_reales,\n  ROUND(SUM(o.total_usd), 2) AS ingresos_reales_usd,\n  SUM(COALESCE(i.unidades_pedido, 0)) AS unidades_vendidas\nFROM orders o\nLEFT JOIN items_por_pedido i ON o.order_id = i.order_id;',
        expectedOutput: [
          {
            pedidos_reales: 18000,
            ingresos_reales_usd: 7669817.77,
            unidades_vendidas: 86912
          }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: 'Tienes una tabla `campaigns` (1 fila por campaña con su columna `budget_usd`) y la unes con `ad_clicks` (miles de clics por campaña). Si ejecutas `SELECT campaign_name, SUM(budget_usd), COUNT(click_id) ... GROUP BY campaign_name`, ¿qué ocurrirá con el presupuesto?',
      options: [
        {
          id: 'a',
          text: 'El presupuesto (`budget_usd`) se multiplicará por el número de clics de cada campaña debido al fan-out 1:N.',
          correct: true,
          feedback: 'Exacto. Como `budget_usd` está al nivel de campaña y `ad_clicks` tiene miles de filas por campaña, sumar `budget_usd` después del JOIN multiplica el presupuesto miles de veces.'
        },
        {
          id: 'b',
          text: 'SQL detectará que `budget_usd` viene de la tabla izquierda y solo lo sumará una vez.',
          correct: false,
          feedback: 'SQL estándar opera sobre la tabla resultante del JOIN fila por fila; no distingue de qué tabla venía originalmente el valor al ejecutar `SUM()`.'
        },
        {
          id: 'c',
          text: 'La consulta dará un error de sintaxis porque no se pueden usar `SUM` y `COUNT` juntos.',
          correct: false,
          feedback: 'Sintácticamente es válida, y por eso el error es tan peligroso: no falla, pero entrega un número falso.'
        }
      ],
      explanation: 'Como `budget_usd` está al grano de campaña y `ad_clicks` tiene miles de filas por campaña, ejecutar SUM(budget_usd) tras el JOIN suma el presupuesto tantas veces como clics tenga la campaña.'
    },
    {
      id: 'c2',
      type: 'mcq',
      prompt: 'Antes de unir `orders` con `order_items`, quieres comprobar si `order_id` es realmente único en `orders`. ¿Qué consulta diagnóstica te confirma que no hay duplicados?',
      options: [
        {
          id: 'a',
          text: 'SELECT COUNT(*) = COUNT(DISTINCT order_id) AS is_unique FROM orders;',
          correct: true,
          feedback: 'Correcto: si el total de filas coincide con el total de order_id distintos y no hay nulos, cada fila representa un pedido único.'
        },
        {
          id: 'b',
          text: 'SELECT DISTINCT order_id FROM orders LIMIT 10;',
          correct: false,
          feedback: 'Incorrecto: DISTINCT oculta precisamente los duplicados que necesitas detectar y LIMIT 10 solo inspecciona una muestra mínima.'
        },
        {
          id: 'c',
          text: 'SELECT SUM(order_id) FROM orders GROUP BY order_id;',
          correct: false,
          feedback: 'Incorrecto: sumar un identificador carece de sentido matemático y no informa cuántas veces se repite cada clave.'
        }
      ],
      explanation: 'Comparar COUNT(*) contra COUNT(DISTINCT pk) o buscar claves con HAVING COUNT(*) > 1 es la verificación estándar de grano antes de escribir un JOIN.'
    },
    {
      id: 'c3',
      type: 'predict-output',
      prompt: 'Un pedido (`order_id = 10`) tiene `shipping_usd = 5` en `orders`, 3 filas en `order_items` y 2 filas en `refunds`. Si unes las tres tablas por `order_id` sin pre-agregar, ¿cuánto devuelve `SUM(shipping_usd)` para ese pedido?',
      options: [
        {
          id: 'a',
          text: '30 (se generan 3 × 2 = 6 filas y el envío de 5 se suma 6 veces).',
          correct: true,
          feedback: 'Correcto: el cruce 1:3 seguido de 1:2 produce el producto cartesiano de 6 filas para el pedido 10, multiplicando 5 × 6 = 30.'
        },
        {
          id: 'b',
          text: '5 (SQL detecta que shipping_usd viene de la tabla orders y lo suma una vez).',
          correct: false,
          feedback: 'Incorrecto: SUM() opera sobre las filas resultantes del FROM/JOIN sin recordar de qué tabla provino originalmente la columna.'
        },
        {
          id: 'c',
          text: '15 (solo multiplica por la primera tabla unida order_items).',
          correct: false,
          feedback: 'Incorrecto: el segundo JOIN vuelve a multiplicar cada una de las 3 filas intermedias por las 2 filas de refunds.'
        }
      ],
      explanation: 'Cuando unes dos tablas de detalle (3 ítems y 2 reembolsos) contra una misma cabecera, se producen 3 × 2 = 6 filas y cualquier métrica de cabecera se multiplica por 6.'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Pre-agregación en CTEs contra el fan-out',
    language: 'sql',
    prompt: 'Completa la consulta sobre Mercado Brisa para calcular en los primeros 10 clientes (`ORDER BY o.customer_id LIMIT 10`) sus ingresos reales (`gross_revenue_usd`), total de unidades (`unidades_compradas`) y monto reembolsado (`refunded_usd`) pre-agregando `order_items` y `refunds` a nivel `order_id`.',
    starterCode: 'WITH items_agg AS (\n  SELECT\n    order_id,\n    SUM(qty) AS total_units\n  FROM order_items\n  -- TODO: Agrupa por order_id para evitar fan-out con orders\n),\nrefunds_agg AS (\n  SELECT\n    order_id,\n    SUM(refund_amount_usd) AS total_refund_usd\n  FROM refunds\n  GROUP BY order_id\n)\nSELECT\n  o.customer_id,\n  COUNT(o.order_id) AS pedidos_unicos,\n  ROUND(SUM(o.total_usd), 2) AS gross_revenue_usd,\n  SUM(COALESCE(i.total_units, 0)) AS unidades_compradas,\n  -- TODO: Suma r.total_refund_usd protegiendo nulos con COALESCE y redondeando a 2 decimales AS refunded_usd\n  0.0 AS refunded_usd\nFROM orders o\nLEFT JOIN items_agg i ON o.order_id = i.order_id\nLEFT JOIN refunds_agg r ON o.order_id = r.order_id\nGROUP BY o.customer_id\nORDER BY o.customer_id\nLIMIT 10;',
    expected: 'WITH items_agg AS (\n  SELECT\n    order_id,\n    SUM(qty) AS total_units\n  FROM order_items\n  GROUP BY order_id\n),\nrefunds_agg AS (\n  SELECT\n    order_id,\n    SUM(refund_amount_usd) AS total_refund_usd\n  FROM refunds\n  GROUP BY order_id\n)\nSELECT\n  o.customer_id,\n  COUNT(o.order_id) AS pedidos_unicos,\n  ROUND(SUM(o.total_usd), 2) AS gross_revenue_usd,\n  SUM(COALESCE(i.total_units, 0)) AS unidades_compradas,\n  ROUND(SUM(COALESCE(r.total_refund_usd, 0)), 2) AS refunded_usd\nFROM orders o\nLEFT JOIN items_agg i ON o.order_id = i.order_id\nLEFT JOIN refunds_agg r ON o.order_id = r.order_id\nGROUP BY o.customer_id\nORDER BY o.customer_id\nLIMIT 10;',
    orderMatters: true,
    hints: [
      'En la CTE `items_agg`, incluye `GROUP BY order_id` para colapsar las líneas de detalle a una sola fila por pedido.',
      'Como `items_agg` y `refunds_agg` tienen relación `1:1` con `orders`, `SUM(o.total_usd)` y `COUNT(o.order_id)` no se multiplican.',
      'Para `refunded_usd`, escribe `ROUND(SUM(COALESCE(r.total_refund_usd, 0)), 2) AS refunded_usd`.'
    ],
    solution: 'WITH items_agg AS (\n  SELECT\n    order_id,\n    SUM(qty) AS total_units\n  FROM order_items\n  GROUP BY order_id\n),\nrefunds_agg AS (\n  SELECT\n    order_id,\n    SUM(refund_amount_usd) AS total_refund_usd\n  FROM refunds\n  GROUP BY order_id\n)\nSELECT\n  o.customer_id,\n  COUNT(o.order_id) AS pedidos_unicos,\n  ROUND(SUM(o.total_usd), 2) AS gross_revenue_usd,\n  SUM(COALESCE(i.total_units, 0)) AS unidades_compradas,\n  ROUND(SUM(COALESCE(r.total_refund_usd, 0)), 2) AS refunded_usd\nFROM orders o\nLEFT JOIN items_agg i ON o.order_id = i.order_id\nLEFT JOIN refunds_agg r ON o.order_id = r.order_id\nGROUP BY o.customer_id\nORDER BY o.customer_id\nLIMIT 10;',
    solutionExplanation: 'Pre-agrega las tablas hijas `order_items` y `refunds` por `order_id` en CTEs separadas antes de unirlas con `orders`. Usa `LEFT JOIN` y `COALESCE(..., 0)` para no perder pedidos sin devoluciones.',
    expectedOutputTable: [
      { customer_id: 1, pedidos_unicos: 9, gross_revenue_usd: 2971.04, unidades_compradas: 36, refunded_usd: 456.97 },
      { customer_id: 2, pedidos_unicos: 8, gross_revenue_usd: 4091.02, unidades_compradas: 49, refunded_usd: 0 },
      { customer_id: 3, pedidos_unicos: 9, gross_revenue_usd: 2701.86, unidades_compradas: 27, refunded_usd: 0 },
      { customer_id: 4, pedidos_unicos: 4, gross_revenue_usd: 1306.03, unidades_compradas: 15, refunded_usd: 0 },
      { customer_id: 5, pedidos_unicos: 9, gross_revenue_usd: 5204.34, unidades_compradas: 62, refunded_usd: 0 },
      { customer_id: 6, pedidos_unicos: 9, gross_revenue_usd: 4375.59, unidades_compradas: 50, refunded_usd: 0 },
      { customer_id: 7, pedidos_unicos: 8, gross_revenue_usd: 1375.99, unidades_compradas: 20, refunded_usd: 0 },
      { customer_id: 8, pedidos_unicos: 5, gross_revenue_usd: 3904.46, unidades_compradas: 45, refunded_usd: 0 },
      { customer_id: 9, pedidos_unicos: 8, gross_revenue_usd: 5178.94, unidades_compradas: 51, refunded_usd: 2023.78 },
      { customer_id: 10, pedidos_unicos: 8, gross_revenue_usd: 2243.06, unidades_compradas: 24, refunded_usd: 0 }
    ]
  },

  roleNotes: {
    de: 'Diseña tablas en la capa Silver con grano homogéneo: nunca mezcles medidas de cabecera sin prorratear en una tabla de líneas de detalle. Programa pruebas automáticas en dbt o SQLMesh que fallen si `SUM(total_usd)` cambia tras un cruce. Documenta el grano en el contrato YAML.',
    da: 'Antes de ejecutar cualquier `JOIN`, diagnostica la relación real (`1:1`, `1:N`, `N:M`) comparando `COUNT(*)` frente a `COUNT(DISTINCT pk)`. Aísla cada fuente de detalle (ítems, pagos, reembolsos) en CTEs pre-agregadas al mismo nivel de entidad antes de consolidar.',
    bi: 'Configura relaciones muchos-a-uno con dirección de filtro única en el modelo semántico para impedir sumas erróneas de tablas padre. Oculta las columnas numéricas de cabecera en vistas de detalle o expone únicamente métricas certificadas desde la capa semántica.'
  },

  summary: [
    'El grano declara qué entidad física representa exactamente una fila de la tabla.',
    'Unir una tabla maestra con una de detalle (1:N) duplica las métricas de cabecera.',
    'Pre-agrega cada tabla al mismo grano en una CTE antes de hacer el JOIN.',
    'Verifica siempre que SUM(total_usd) antes y después del cruce coincida al centavo.'
  ],

  flashcards: [
    {
      id: 'fc-c1-joins-01',
      front: '¿Qué es el grano (grain) de una tabla y cómo se verifica en SQL?',
      back: 'Es lo que representa una fila física. Se verifica comprobando que COUNT(*) coincida con COUNT(DISTINCT clave_candidata).'
    },
    {
      id: 'fc-c1-joins-02',
      front: '¿Por qué un JOIN 1:N infla SUM(total_usd) pero no altera COUNT(DISTINCT order_id)?',
      back: 'Porque cada fila de cabecera se repite N veces por sus hijos; SUM suma las repeticiones, mientras COUNT(DISTINCT) colapsa IDs duplicados.'
    },
    {
      id: 'fc-c1-joins-03',
      front: '¿Qué es una trampa de abismo (chasm trap) al unir dos tablas de detalle?',
      back: 'Ocurre al unir dos relaciones 1:N independientes sobre la misma entidad padre (N:1:M), generando N×M filas por entidad.'
    }
  ],

  glossaryTerms: [
    'c01-grain-fanout',
    'c02-cte-preagg',
    'c1-joins-chasm-trap'
  ],

  sources: [
    {
      title: 'The Data Warehouse Toolkit (3rd Edition), Chapter 2: Dimensional Modeling Techniques — Declare the Grain',
      url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/grain/',
      publisher: 'Kimball Group',
      accessed: '2026-10-29',
      supports: 'Declaración explícita del grano antes de diseñar tablas o escribir consultas de agregación.'
    },
    {
      title: 'PostgreSQL 17 Documentation — Section 7.2: Table Expressions and JOIN Clauses',
      url: 'https://www.postgresql.org/docs/current/queries-table-expressions.html',
      publisher: 'PostgreSQL Global Development Group',
      accessed: '2026-10-29',
      supports: 'Semántica de combinaciones INNER y LEFT JOIN y generación de filas del producto relacional.'
    },
    {
      title: 'DuckDB Documentation — Joins and Common Table Expressions (WITH Clause)',
      url: 'https://duckdb.org/docs/sql/query_syntax/with.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Uso de CTEs para pre-agregar subconsultas al grano de la entidad antes de combinarlas.'
    }
  ],

  aiNotes: 'El error más frecuente es creer que cambiar INNER JOIN por LEFT JOIN evita el fan-out, o usar DISTINCT en el SELECT final ocultando filas legítimas. Guía a la persona a comparar el grano de ambas tablas y pre-agregar en una CTE por la clave de unión.',
  legacyId: 'l1-joins-fanout',
  legacyOrder: 1,
  stageId: 'stage-1',
  subtitle: 'Por qué una consulta sintácticamente válida puede duplicar los ingresos de un reporte.',
  goal: 'Identificar la granularidad (grain) de cualquier tabla, diagnosticar relaciones 1:N y N:M (Chasm Trap) y evitar que un JOIN infle métricas financieras o de conteo.',
  pipelineChallenge: {
    title: 'Flujo anti-fan-out del webhook al reporte',
    scenario: 'Ordena el flujo correcto entre Ingeniería (DE), Análisis (DA) y BI para garantizar que ningún reporte ejecutivo duplique ingresos al cruzar cabeceras de pedidos con líneas de productos y pagos.',
    steps: [
      {
        id: 'step-1',
        label: '1. Declarar el grano y la clave primaria en el contrato de datos',
        role: 'DE',
        detail: 'Documentar que `orders` tiene grano `order_id` (1:1) y `order_items` tiene grano `order_item_id` (1:N).'
      },
      {
        id: 'step-2',
        label: '2. Pre-agregar o prorratear en el modelo Silver (dbt/SQLMesh)',
        role: 'DE',
        detail: 'Construir CTEs pre-agregadas a nivel `order_id` o prorratear el envío e impuestos proporcionalmente a cada línea de producto.'
      },
      {
        id: 'step-3',
        label: '3. Auditar invariantes de cardinalidad y reconciliación',
        role: 'DA',
        detail: 'Verificar que `COUNT(*) = COUNT(DISTINCT order_id)` y que la suma de ingresos en la vista analítica cuadra al centavo con `orders`.'
      },
      {
        id: 'step-4',
        label: '4. Publicar métricas certificadas en la capa semántica',
        role: 'BI',
        detail: 'Exponer `gross_revenue_usd` y `units_sold` con agregación simétrica controlada para el tablero ejecutivo.'
      }
    ],
    explanation: 'Cuando DE fija el grano y prorratea en Silver, DA valida la reconciliación matemática sin duplicados y BI gobierna las métricas en la capa semántica, el error de fan-out queda bloqueado.'
  },
  relatedLessons: [
    {
      id: 'l2-window-functions',
      reason: 'Aprende a usar funciones de ventana para prorratear importes o deduplicar filas antes de un JOIN.'
    },
    {
      id: 'l3-asof-lateral-ctes',
      reason: 'Diseña CTEs modulares y cruces temporales que mantienen la cardinalidad exacta.'
    }
  ]
};

export default lesson;
