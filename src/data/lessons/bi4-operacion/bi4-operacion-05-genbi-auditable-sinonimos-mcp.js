export const lesson = {
  id: 'bi4-operacion-05-genbi-auditable-sinonimos-mcp',
  moduleId: 'bi4-operacion',
  track: 'bi',
  level: 4,
  order: 5,
  title: 'GenBI auditable: sinónimos y citas en capa semántica MCP',
  subtitle: 'GenBI auditable: preparar sinónimos, contexto y citas verificables en la capa semántica para MCP',
  estimatedMinutes: 25,
  prerequisites: [
    'bi4-operacion-04-telemetria-adopcion-retiro-tableros',
    'x4-ia-datos-01-mcp-semantic-ai-rag',
  ],
  hook: 'Durante el comité de cierre de 2024 en Mercado Brisa, la directora comercial le pregunta al asistente conversacional: "¿Cuáles fueron nuestras ventas netas por región en 2024?". El modelo de lenguaje genera una consulta text-to-SQL directa sobre la tabla `orders` (`SUM(total_usd)`) y responde que Cono Sur vendió 1,119,793.69 USD. Tres minutos después, el tablero certificado muestra 755,876.56 USD. El asistente incluyó impuestos, envíos y pedidos cancelados o devueltos, sobreestimando la región en 363,917.13 USD. ¿Cómo preparar sinónimos desambiguados y exponer la capa semántica mediante MCP para que cada respuesta de GenBI ejecute la métrica certificada e incluya una cita verificable?',
  objectives: [
    'Curar los metadatos de la capa semántica (descripciones con grano y exclusiones, diccionario de sinónimos sin colisiones léxicas y ocultamiento de columnas técnicas) para consumo por asistentes de lenguaje.',
    'Exponer métricas gobernadas a través de las primitivas de un servidor Model Context Protocol (MCP): Resources para el catálogo semántico y Tools para consultas parametrizadas.',
    'Estructurar respuestas auditables de GenBI que adjunten citas verificables (metric_id, versión semántica, filtros aplicados y consulta de reconciliación).',
  ],
  sections: [
    {
      id: 'por-que-text-to-sql-libre-falla-en-bi',
      heading: 'Por qué el text-to-SQL libre sobre tablas físicas fracasa en BI ejecutivo',
      body: 'Conectar un modelo de lenguaje directamente al esquema físico de una base de datos (*raw text-to-SQL*) obliga al agente a adivinar reglas de negocio. En `orders` coexisten tres importes distintos: `subtotal_usd`, `discount_usd` y `total_usd` (que añade impuestos y envío). Además, la columna `status` mezcla órdenes `completed`, `cancelled`, `pending` y `refunded`. Por su parte, las devoluciones procesadas viven en otra tabla (`refunds`).\n\nUn asistente sin capa semántica que recibe la pregunta *"ventas netas por región"* suele sumar `total_usd` directamente. No filtra `status = \'completed\'` ni resta las devoluciones de `refunds`. En **GenBI auditable**, el asistente jamás improvisa fórmulas sobre tablas crudas. En cambio, consulta un servidor **Model Context Protocol (MCP)** que expone el catálogo certificado como `Resource` y la consulta gobernada como `Tool` (`query_semantic_metric`).',
      example: {
        language: 'sql',
        caption: 'Salida estructurada de una herramienta MCP gobernada con columnas de cita verificable (metric_id y semantic_version) para FY24-Q4.',
        code: `WITH refunds_by_order AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS refund_usd
  FROM refunds
  WHERE status = 'processed'
  GROUP BY order_id
)
SELECT
  'metric_net_revenue_usd' AS metric_id,
  'v2.4.0-tmdl' AS semantic_version,
  s.region,
  c.fiscal_quarter,
  COUNT(o.order_id) AS completed_orders,
  ROUND(SUM(o.subtotal_usd - o.discount_usd) - COALESCE(SUM(r.refund_usd), 0), 2) AS net_revenue_usd
FROM orders o
JOIN stores s ON s.store_id = o.store_id
JOIN calendar c ON c.calendar_date = o.order_date
LEFT JOIN refunds_by_order r ON r.order_id = o.order_id
WHERE c.fiscal_quarter = 'FY24-Q4'
  AND o.status = 'completed'
GROUP BY s.region, c.fiscal_quarter
ORDER BY net_revenue_usd DESC, s.region ASC;`,
        expectedOutput: `metric_id | semantic_version | region | fiscal_quarter | completed_orders | net_revenue_usd
metric_net_revenue_usd | v2.4.0-tmdl | Cono Sur | FY24-Q4 | 570 | 200973.27
metric_net_revenue_usd | v2.4.0-tmdl | Andina | FY24-Q4 | 592 | 195260.55
metric_net_revenue_usd | v2.4.0-tmdl | Iberia | FY24-Q4 | 333 | 135457.48
metric_net_revenue_usd | v2.4.0-tmdl | Norteamérica | FY24-Q4 | 234 | 75023.74`,
        expectedOutputTable: {
          columns: [
            'metric_id',
            'semantic_version',
            'region',
            'fiscal_quarter',
            'completed_orders',
            'net_revenue_usd',
          ],
          rows: [
            ['metric_net_revenue_usd', 'v2.4.0-tmdl', 'Cono Sur', 'FY24-Q4', 570, 200973.27],
            ['metric_net_revenue_usd', 'v2.4.0-tmdl', 'Andina', 'FY24-Q4', 592, 195260.55],
            ['metric_net_revenue_usd', 'v2.4.0-tmdl', 'Iberia', 'FY24-Q4', 333, 135457.48],
            ['metric_net_revenue_usd', 'v2.4.0-tmdl', 'Norteamérica', 'FY24-Q4', 234, 75023.74],
          ],
        },
      },
    },
    {
      id: 'desambiguacion-sinonimos-higiene-metadatos',
      heading: 'Desambiguación de sinónimos y ocultamiento de columnas técnicas',
      body: 'Para que un agente elija la medida correcta ante preguntas en lenguaje coloquial, el modelo semántico necesita higiene léxica. El error más común al configurar Q&A o Copilot consiste en asignar el sinónimo genérico `"ventas"` a varios objetos a la vez. Si `orders.total_usd`, `Ventas Brutas USD` e `Ingresos Netos USD` comparten ese sinónimo, ocurre una **colisión léxica** que vuelve impredecible la respuesta.\n\nLa **desambiguación de sinónimos semánticos** aplica cuatro reglas sobre los archivos `.tmdl` o el catálogo YAML de MCP. Primero, oculta las columnas numéricas base (`subtotal_usd`, `discount_usd`, `total_usd`) y las claves foráneas (`isHidden: true`, `summarizeBy: none`). Así el asistente solo puede invocar medidas explícitas. Segundo, asigna sinónimos mutuamente excluyentes a cada medida. Tercero, documenta en `description` la fórmula, el grano y las exclusiones. Cuarto, registra preguntas verificadas (*verified answers*) ligadas al `metric_id`.',
      codeBlock: {
        language: 'yaml',
        caption: 'Definición de métrica semántica y diccionario de sinónimos sin colisión para un servidor MCP.',
        code: `metrics:
  - id: net_revenue_usd
    title: "Ingresos Netos Comerciales (USD)"
    semantic_version: "v2.4.0-tmdl"
    grain: ["region", "store_type", "store_code", "fiscal_quarter", "year"]
    formula_summary: "SUM(orders.subtotal_usd - orders.discount_usd) - COALESCE(SUM(refunds.refund_amount_usd), 0)"
    mandatory_filters:
      - "orders.status = 'completed'"
      - "refunds.status = 'processed' (preagregado por order_id)"
    synonyms:
      - "ingresos netos"
      - "ventas netas"
      - "facturación neta sin devoluciones"
    excluded_terms:
      - "total cobrado con impuestos (usar gross_billed_total_usd)"
      - "ventas brutas antes de devoluciones (usar gross_sales_usd)"`,
      },
    },
    {
      id: 'contrato-citas-verificables-mcp',
      heading: 'Contrato de citas verificables en respuestas de GenBI',
      body: 'Un número generado por inteligencia artificial sin trazabilidad no puede presentarse ante un comité financiero. En una arquitectura GenBI conectada por MCP, la herramienta del servidor no devuelve un texto suelto. En su lugar, entrega una respuesta estructurada que obliga al asistente a incluir una **cita verificable** junto a cada cifra.\n\nToda cita verificable contiene cinco elementos auditables. Primero, el identificador único de la métrica (`metric_id: net_revenue_usd`). Segundo, la versión o confirmación en Git del modelo semántico (`semantic_version: v2.4.0-tmdl`). Tercero, las dimensiones de agrupación utilizadas (`region`, `store_type`). Cuarto, los filtros temporales y de estado aplicados (`year = 2024`, `orders.status = \'completed\'`). Quinto, el bloque SQL reproducible para que cualquier analista compruebe el cálculo en un clic.',
      callout: {
        type: 'warning',
        title: 'Bloquea la generación de fórmulas ad-hoc en el prompt del servidor MCP',
        body: 'Si un usuario solicita una métrica que no existe en el catálogo semántico de `Resources`, el servidor MCP debe instruir al asistente para declarar que la métrica no está certificada y mostrar las métricas oficiales más cercanas, en lugar de inventar una consulta SQL nueva sobre las tablas físicas.',
      },
    },
  ],
  workedExample: {
    title: 'Cuantificación del sesgo entre text-to-SQL libre y una herramienta MCP gobernada',
    scenario: 'Comparamos la respuesta que entregaría un agente con text-to-SQL libre sobre la tabla `orders` frente a la herramienta gobernada del servidor MCP ante la pregunta: "¿Cuáles fueron las ventas netas por región en el año 2024 en Mercado Brisa?".',
    steps: [
      {
        label: 'Paso 1 — Antipatrón: consulta text-to-SQL no gobernada que suma total_usd sin filtros de negocio',
        explanation: 'Un modelo de lenguaje conectado directamente a la tabla `orders` sin contexto semántico ve la columna `total_usd` y ejecuta `SUM(total_usd)` agrupado por región para 2024. Como no filtra `status = \'completed\'`, incluye pedidos cancelados, pendientes y reembolsados, suma impuestos y envíos, e ignora la tabla `refunds`. En `Cono Sur` reporta `1,119,793.69 USD` sobre `2,662` órdenes totales.',
        sql: `SELECT
  s.region,
  COUNT(o.order_id) AS all_orders_counted,
  ROUND(SUM(o.total_usd), 2) AS unverified_llm_sales_usd
FROM orders o
JOIN stores s ON s.store_id = o.store_id
WHERE EXTRACT(YEAR FROM o.order_date) = 2024
GROUP BY s.region
ORDER BY unverified_llm_sales_usd DESC;`,
        expectedOutput: `region | all_orders_counted | unverified_llm_sales_usd
Cono Sur | 2662 | 1119793.69
Andina | 2617 | 1047145.81
Iberia | 1526 | 732600.21
Norteamérica | 1118 | 452714.08`,
        expectedOutputTable: {
          columns: ['region', 'all_orders_counted', 'unverified_llm_sales_usd'],
          rows: [
            ['Cono Sur', 2662, 1119793.69],
            ['Andina', 2617, 1047145.81],
            ['Iberia', 1526, 732600.21],
            ['Norteamérica', 1118, 452714.08],
          ],
        },
      },
      {
        label: 'Paso 2 — Solución: auditoría MCP que contrasta la suma no gobernada contra el ingreso neto certificado',
        explanation: 'Al evaluar la métrica certificada `net_revenue_usd` (órdenes `completed`, `subtotal_usd - discount_usd` menos devoluciones `processed` preagregadas por `order_id`), comprobamos que el ingreso neto real de `Cono Sur` en 2024 es `755,876.56 USD`. La consulta libre sobreestimaba la región en `363,917.13 USD` (y en más de `1.11 millones de USD` en toda la empresa).',
        sql: `WITH refunds_by_order AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS refund_usd
  FROM refunds
  WHERE status = 'processed'
  GROUP BY order_id
)
SELECT
  s.region,
  ROUND(SUM(o.total_usd), 2) AS unverified_llm_sales_usd,
  ROUND(
    SUM(CASE WHEN o.status = 'completed' THEN (o.subtotal_usd - o.discount_usd) - COALESCE(r.refund_usd, 0) ELSE 0 END),
    2
  ) AS certified_net_revenue_usd,
  ROUND(
    SUM(o.total_usd) - SUM(CASE WHEN o.status = 'completed' THEN (o.subtotal_usd - o.discount_usd) - COALESCE(r.refund_usd, 0) ELSE 0 END),
    2
  ) AS overstatement_usd
FROM orders o
JOIN stores s ON s.store_id = o.store_id
LEFT JOIN refunds_by_order r ON r.order_id = o.order_id
WHERE EXTRACT(YEAR FROM o.order_date) = 2024
GROUP BY s.region
ORDER BY certified_net_revenue_usd DESC;`,
        expectedOutput: `region | unverified_llm_sales_usd | certified_net_revenue_usd | overstatement_usd
Cono Sur | 1119793.69 | 755876.56 | 363917.13
Andina | 1047145.81 | 696779.67 | 350366.14
Iberia | 732600.21 | 486391 | 246209.21
Norteamérica | 452714.08 | 299017.22 | 153696.86`,
        expectedOutputTable: {
          columns: [
            'region',
            'unverified_llm_sales_usd',
            'certified_net_revenue_usd',
            'overstatement_usd',
          ],
          rows: [
            ['Cono Sur', 1119793.69, 755876.56, 363917.13],
            ['Andina', 1047145.81, 696779.67, 350366.14],
            ['Iberia', 732600.21, 486391, 246209.21],
            ['Norteamérica', 452714.08, 299017.22, 153696.86],
          ],
        },
      },
    ],
  },
  checks: [
    {
      id: 'chk-bi4-05-synonym-collision',
      type: 'multiple-choice',
      prompt: '¿Qué ocurre cuando un modelador asigna el sinónimo "ventas" simultáneamente a la columna física orders.total_usd, a la medida Ventas Brutas USD y a la medida Ingresos Netos USD?',
      options: [
        'Se produce una colisión léxica que vuelve ambigua la resolución de lenguaje natural, haciendo que el asistente devuelva cifras distintas ante preguntas equivalentes.',
        'El motor MCP promedia automáticamente las tres métricas para ofrecer un resultado intermedio.',
        'La base de datos DuckDB borra las tres columnas por duplicidad de nombres.',
        'El tiempo de compilación de TMDL se reduce a la mitad.',
      ],
      answer: 0,
      explanation: 'La primera opción es correcta: compartir el mismo sinónimo entre columnas crudas y medidas distintas provoca ambigüedad léxica. Las columnas numéricas base deben ocultarse (`isHidden`) y cada medida debe poseer sinónimos específicos y mutuamente excluyentes.',
    },
    {
      id: 'chk-bi4-05-mcp-primitives',
      type: 'multiple-choice',
      prompt: 'En la arquitectura de un servidor Model Context Protocol (MCP) conectado a una capa semántica de BI, ¿cómo se reparten las responsabilidades entre Resources y Tools?',
      options: [
        'Resources expone de forma declarativa el catálogo de métricas, dimensiones, descripciones y sinónimos; Tools ejecuta de forma parametrizada y validada la consulta de una métrica certificada.',
        'Resources ejecuta sentencias DROP TABLE en producción y Tools diseña el logotipo de la empresa.',
        'Resources almacena las contraseñas de los usuarios y Tools envía correos masivos de marketing.',
        'Ambos componentes sirven únicamente para entrenar desde cero los pesos neuronales del modelo de lenguaje.',
      ],
      answer: 0,
      explanation: 'La primera opción es correcta: en MCP, `Resources` provee contexto estructurado de solo lectura (metadatos del catálogo semántico) y `Tools` expone funciones ejecutables con parámetros tipados (`metric_id`, `dimensions`, `time_grain`).',
    },
    {
      id: 'chk-bi4-05-citation-contract',
      type: 'multiple-choice',
      prompt: 'Para que la respuesta de un asistente GenBI sea auditable por el comité ejecutivo, ¿qué metadatos mínimos debe incluir su cita verificable?',
      options: [
        'El identificador de la métrica certificada (metric_id), la versión del modelo semántico, las dimensiones y filtros aplicados (periodo y estados incluidos) y la consulta reproducible.',
        'Únicamente el nombre del modelo de lenguaje utilizado y la temperatura de muestreo.',
        'Un mensaje genérico asegurando que la inteligencia artificial nunca se equivoca.',
        'La dirección IP privada del navegador del usuario.',
      ],
      answer: 0,
      explanation: 'La primera opción es correcta: la auditoría ejecutiva exige saber qué métrica oficial se evaluó (`metric_id`), en qué versión del modelo (`semantic_version`), bajo qué filtros exactos y cómo reproducir el cálculo.',
    },
  ],
  practice: {
    type: 'sql',
    prompt: 'Construye la consulta que respalda la herramienta MCP `query_net_revenue_2024` desglosada por `region` y `store_type` para las órdenes completadas (`o.status = \'completed\'`) en `2024`. Preagrega primero en una CTE `refunds_by_order` las devoluciones con `status = \'processed\'` por `order_id`. En la consulta principal devuelve: el literal `\'net_revenue_usd\' AS metric_id`, `s.region`, `s.store_type`, `completed_orders` (`COUNT(o.order_id)`), `gross_sales_usd` (`ROUND(SUM(o.subtotal_usd - o.discount_usd), 2)`), `refunded_usd` (`ROUND(COALESCE(SUM(r.refund_usd), 0), 2)`) y `net_revenue_usd` (`ROUND(SUM(o.subtotal_usd - o.discount_usd) - COALESCE(SUM(r.refund_usd), 0), 2)`). Ordena por `net_revenue_usd DESC, s.region ASC, s.store_type ASC`.',
    starterCode: `-- Consulta gobernada para la herramienta MCP query_net_revenue_2024
WITH refunds_by_order AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS refund_usd
  FROM refunds
  WHERE status = 'processed'
  GROUP BY order_id
)
SELECT
  'net_revenue_usd' AS metric_id,
  s.region,
  s.store_type,
  COUNT(o.order_id) AS completed_orders,
  ROUND(SUM(o.total_usd), 2) AS gross_sales_usd,
  ROUND(SUM(r.refund_usd), 2) AS refunded_usd,
  ROUND(SUM(o.total_usd) - SUM(r.refund_usd), 2) AS net_revenue_usd
FROM orders o
JOIN stores s ON s.store_id = s.store_id
LEFT JOIN refunds_by_order r ON r.order_id = o.order_id
WHERE EXTRACT(YEAR FROM o.order_date) = 2024
GROUP BY s.region, s.store_type
ORDER BY net_revenue_usd DESC, s.region ASC, s.store_type ASC;`,
    solution: `WITH refunds_by_order AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS refund_usd
  FROM refunds
  WHERE status = 'processed'
  GROUP BY order_id
)
SELECT
  'net_revenue_usd' AS metric_id,
  s.region,
  s.store_type,
  COUNT(o.order_id) AS completed_orders,
  ROUND(SUM(o.subtotal_usd - o.discount_usd), 2) AS gross_sales_usd,
  ROUND(COALESCE(SUM(r.refund_usd), 0), 2) AS refunded_usd,
  ROUND(SUM(o.subtotal_usd - o.discount_usd) - COALESCE(SUM(r.refund_usd), 0), 2) AS net_revenue_usd
FROM orders o
JOIN stores s ON s.store_id = o.store_id
LEFT JOIN refunds_by_order r ON r.order_id = o.order_id
WHERE o.status = 'completed'
  AND EXTRACT(YEAR FROM o.order_date) = 2024
GROUP BY s.region, s.store_type
ORDER BY net_revenue_usd DESC, s.region ASC, s.store_type ASC;`,
    expectedOutput: `metric_id | region | store_type | completed_orders | gross_sales_usd | refunded_usd | net_revenue_usd
net_revenue_usd | Cono Sur | retail | 1722 | 622481.26 | 29160.41 | 593320.85
net_revenue_usd | Andina | retail | 1233 | 429447.70 | 15225.68 | 414222.02
net_revenue_usd | Iberia | warehouse | 585 | 285253.67 | 0 | 285253.67
net_revenue_usd | Cono Sur | flagship | 477 | 169782.81 | 7227.10 | 162555.71
net_revenue_usd | Andina | flagship | 608 | 176434.67 | 27929.69 | 148504.98
net_revenue_usd | Norteamérica | retail | 441 | 151991 | 7756.60 | 144234.40
net_revenue_usd | Andina | warehouse | 313 | 134052.67 | 0 | 134052.67
net_revenue_usd | Iberia | retail | 311 | 105569.33 | 0 | 105569.33
net_revenue_usd | Iberia | flagship | 336 | 118176.55 | 22608.55 | 95568
net_revenue_usd | Norteamérica | warehouse | 234 | 89372.26 | 3637.59 | 85734.67
net_revenue_usd | Norteamérica | flagship | 237 | 72064.79 | 3016.64 | 69048.15`,
    expectedOutputTable: {
      columns: [
        'metric_id',
        'region',
        'store_type',
        'completed_orders',
        'gross_sales_usd',
        'refunded_usd',
        'net_revenue_usd',
      ],
      rows: [
        ['net_revenue_usd', 'Cono Sur', 'retail', 1722, 622481.26, 29160.41, 593320.85],
        ['net_revenue_usd', 'Andina', 'retail', 1233, 429447.7, 15225.68, 414222.02],
        ['net_revenue_usd', 'Iberia', 'warehouse', 585, 285253.67, 0, 285253.67],
        ['net_revenue_usd', 'Cono Sur', 'flagship', 477, 169782.81, 7227.1, 162555.71],
        ['net_revenue_usd', 'Andina', 'flagship', 608, 176434.67, 27929.69, 148504.98],
        ['net_revenue_usd', 'Norteamérica', 'retail', 441, 151991, 7756.6, 144234.4],
        ['net_revenue_usd', 'Andina', 'warehouse', 313, 134052.67, 0, 134052.67],
        ['net_revenue_usd', 'Iberia', 'retail', 311, 105569.33, 0, 105569.33],
        ['net_revenue_usd', 'Iberia', 'flagship', 336, 118176.55, 22608.55, 95568],
        ['net_revenue_usd', 'Norteamérica', 'warehouse', 234, 89372.26, 3637.59, 85734.67],
        ['net_revenue_usd', 'Norteamérica', 'flagship', 237, 72064.79, 3016.64, 69048.15],
      ],
    },
    hints: [
      'Corrige la condición del `JOIN`: en el código inicial dice `ON s.store_id = s.store_id` (producto cartesiano) en vez de `ON s.store_id = o.store_id`, y agrega `o.status = \'completed\'` en el `WHERE`.',
      'Calcula `gross_sales_usd` como `ROUND(SUM(o.subtotal_usd - o.discount_usd), 2)` en lugar de usar `o.total_usd`.',
      'Usa `COALESCE(SUM(r.refund_usd), 0)` tanto en `refunded_usd` como en `net_revenue_usd` para que los segmentos sin devoluciones (`Iberia warehouse`, `Andina warehouse`, `Iberia retail`) no queden en `NULL`.',
    ],
  },
  roleNotes: {
    de: 'Publica los esquemas y metadatos del catálogo en el servidor MCP mediante primitivas `Resources` versionadas, bloqueando el acceso directo del agente a las tablas crudas de ingesta.',
    da: 'Documenta en la descripción de cada métrica sus filtros obligatorios y casos borde para que el asistente conversacional explique al usuario qué incluye y qué excluye cada cifra.',
    bi: 'Oculta todas las columnas numéricas base y claves foráneas en TMDL (`isHidden`) y audita el diccionario de sinónimos para que ningún término de negocio apunte a dos medidas distintas.',
  },
  summary: [
    'El text-to-SQL libre sobre tablas físicas falla en BI porque desconoce estados válidos, reglas de descuento y cruces con devoluciones.',
    'Un servidor MCP conecta el asistente a la capa semántica exponiendo el catálogo como Resources y las consultas certificadas como Tools.',
    'La desambiguación de sinónimos oculta columnas numéricas crudas y asigna cada término de negocio a una única medida gobernada.',
    'Toda respuesta de GenBI debe incluir una cita verificable con metric_id, versión semántica, filtros aplicados y consulta reproducible.',
  ],
  flashcards: [
    {
      q: '¿Por qué un agente text-to-SQL libre sobreestima los ingresos de Mercado Brisa en 2024 cuando se le pide "ventas netas"?',
      a: 'Porque suma `orders.total_usd` sobre todos los estados (incluyendo cancelados, pendientes y reembolsados, más impuestos y envío) e ignora la resta de `refunds`.',
    },
    {
      q: '¿Qué es la desambiguación de sinónimos semánticos en GenBI?',
      a: 'Es la asignación unívoca de cada término coloquial de negocio a una sola medida certificada, ocultando las columnas físicas para impedir colisiones léxicas.',
    },
    {
      q: '¿Qué dos primitivas de Model Context Protocol (MCP) estructuran la consulta a una capa semántica?',
      a: '`Resources` (para leer el catálogo de métricas, dimensiones, grano y sinónimos) y `Tools` (para ejecutar consultas parametrizadas sobre métricas certificadas).',
    },
    {
      q: '¿Qué elementos integran una cita verificable en una respuesta de GenBI?',
      a: 'El `metric_id`, la versión o commit del modelo semántico (`semantic_version`), las dimensiones y filtros aplicados, y la consulta de reconciliación reproducible.',
    },
  ],
  glossaryTerms: [
    'semantic-synonym-disambiguation',
    'c28-mcp-semantic-rag-evals',
    'c21-semantic-layer',
    'tmdl-language',
  ],
  sources: [
    {
      title: 'Model Context Protocol (MCP) — Specification 2025-03-26',
      url: 'https://modelcontextprotocol.io/specification/2025-03-26',
      accessed: '2026-10-29',
    },
    {
      title: 'Microsoft Learn — Update your data model to work well with Copilot',
      url: 'https://learn.microsoft.com/en-us/power-bi/create-reports/copilot-evaluate-data',
      accessed: '2026-10-29',
    },
    {
      title: 'Microsoft Learn — Best practices to optimize Q&A in Power BI',
      url: 'https://learn.microsoft.com/en-us/power-bi/natural-language/q-and-a-best-practices',
      accessed: '2026-10-29',
    },
    {
      title: 'dbt Labs Documentation — dbt Semantic Layer',
      url: 'https://docs.getdbt.com/docs/use-dbt-semantic-layer/dbt-sl',
      accessed: '2026-10-29',
    },
  ],
  aiNotes: 'Destaca la magnitud del error del Paso 1 (`1,119,793.69 USD` vs `755,876.56 USD` reales en Cono Sur 2024, un exceso de `363,917.13 USD`) para justificar por qué GenBI debe invocar herramientas MCP sobre la capa semántica en vez de SQL libre. En la práctica SQL, revisa el `JOIN` (`s.store_id = o.store_id`), el filtro `o.status = \'completed\'` y el `COALESCE`.',
};

export default lesson;
