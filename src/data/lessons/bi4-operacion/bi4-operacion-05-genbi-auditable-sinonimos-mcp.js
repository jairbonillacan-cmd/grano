export const lesson = {
  id: 'bi4-operacion-05-genbi-auditable-sinonimos-mcp',
  moduleId: 'bi4-operacion',
  tracks: ['bi'],
  level: 4,
  order: 5,
  title: 'GenBI auditable: sinónimos y citas en capa semántica MCP',
  subtitle: 'GenBI auditable: preparar sinónimos, contexto y citas verificables en la capa semántica para MCP',
  minutes: 25,
  prerequisites: [
    'bi4-operacion-04-telemetria-adopcion-retiro-tableros',
    'x4-ia-datos-01-mcp-semantic-ai-rag',
  ],
  contentVersion: 1,

  hook: 'En el cierre de 2024 de Mercado Brisa, dirección pregunta al asistente conversacional: "¿Cuáles fueron nuestras ventas netas por región en 2024?". El agente ejecuta text-to-SQL directo sobre `orders` (`SUM(total_usd)`) y responde que Cono Sur vendió 1,119,793.69 USD. Tres minutos después, el tablero certificado muestra 755,876.56 USD porque el asistente incluyó impuestos, envíos y pedidos cancelados o devueltos. ¿Cómo curar sinónimos y exponer la capa semántica por MCP para que cada respuesta sea exacta e incluya una cita verificable?',

  objectives: [
    'Curar los metadatos de la capa semántica (descripciones con grano y exclusiones, diccionario de sinónimos sin colisiones léxicas y ocultamiento de columnas técnicas) para consumo por asistentes de lenguaje.',
    'Exponer métricas gobernadas a través de las primitivas de un servidor Model Context Protocol (MCP): Resources para el catálogo semántico y Tools para consultas parametrizadas.',
    'Estructurar respuestas auditables de GenBI que adjunten citas verificables (metric_id, versión semántica, filtros aplicados y consulta de reconciliación).',
  ],

  sections: [
    {
      id: 'por-que-text-to-sql-libre-falla-en-bi',
      heading: 'Por qué el text-to-SQL libre sobre tablas físicas fracasa en BI',
      body: 'Conectar un modelo de lenguaje directamente al esquema físico de una base de datos (*raw text-to-SQL*) obliga al agente a adivinar reglas de negocio. En `orders` coexisten tres importes distintos: `subtotal_usd`, `discount_usd` y `total_usd` (que añade impuestos y envío). Además, la columna `status` mezcla órdenes `completed`, `cancelled`, `pending` y `refunded`. Por su parte, las devoluciones procesadas viven en otra tabla (`refunds`).\n\nUn asistente sin capa semántica que recibe la pregunta *"ventas netas por región"* suele sumar `total_usd` directamente. No filtra `status = \'completed\'` ni resta las devoluciones de `refunds`. En **GenBI auditable**, el asistente jamás improvisa fórmulas sobre tablas crudas. En cambio, consulta un servidor **Model Context Protocol (MCP)** que expone el catálogo certificado como `Resource` y la consulta gobernada como `Tool` (`query_semantic_metric`).',
      example: {
        language: 'sql',
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
        expectedOutput: [
          {
            metric_id: 'metric_net_revenue_usd',
            semantic_version: 'v2.4.0-tmdl',
            region: 'Cono Sur',
            fiscal_quarter: 'FY24-Q4',
            completed_orders: 570,
            net_revenue_usd: 200973.27,
          },
          {
            metric_id: 'metric_net_revenue_usd',
            semantic_version: 'v2.4.0-tmdl',
            region: 'Andina',
            fiscal_quarter: 'FY24-Q4',
            completed_orders: 592,
            net_revenue_usd: 195260.55,
          },
          {
            metric_id: 'metric_net_revenue_usd',
            semantic_version: 'v2.4.0-tmdl',
            region: 'Iberia',
            fiscal_quarter: 'FY24-Q4',
            completed_orders: 333,
            net_revenue_usd: 135457.48,
          },
          {
            metric_id: 'metric_net_revenue_usd',
            semantic_version: 'v2.4.0-tmdl',
            region: 'Norteamérica',
            fiscal_quarter: 'FY24-Q4',
            completed_orders: 234,
            net_revenue_usd: 75023.74,
          },
        ],
      },
    },
    {
      id: 'desambiguacion-sinonimos-higiene-metadatos',
      heading: 'Desambiguación de sinónimos y ocultamiento de columnas técnicas',
      body: 'Para que un agente elija la medida correcta ante preguntas en lenguaje coloquial, el modelo semántico necesita higiene léxica. El error más común al configurar Q&A o Copilot consiste en asignar el sinónimo genérico `"ventas"` a varios objetos a la vez. Si `orders.total_usd`, `Ventas Brutas USD` e `Ingresos Netos USD` comparten ese sinónimo, ocurre una **colisión léxica** que vuelve impredecible la respuesta.\n\nLa **desambiguación de sinónimos semánticos** aplica cuatro reglas sobre los archivos `.tmdl` o el catálogo YAML de MCP. Primero, oculta las columnas numéricas base (`subtotal_usd`, `discount_usd`, `total_usd`) y las claves foráneas (`isHidden: true`, `summarizeBy: none`). Así el asistente solo puede invocar medidas explícitas. Segundo, asigna sinónimos mutuamente excluyentes a cada medida. Tercero, documenta en `description` la fórmula, el grano y las exclusiones. Cuarto, registra preguntas verificadas (*verified answers*) ligadas al `metric_id`.',
      example: {
        language: 'yaml',
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
    },
  ],

  workedExample: {
    title: 'Cuantificación del sesgo entre text-to-SQL libre y una herramienta MCP gobernada',
    description: 'Comparamos la respuesta que entregaría un agente con text-to-SQL libre sobre la tabla `orders` frente a la herramienta gobernada del servidor MCP ante la pregunta: "¿Cuáles fueron las ventas netas por región en el año 2024 en Mercado Brisa?".',
    steps: [
      {
        label: 'Paso 1 — Antipatrón: consulta text-to-SQL no gobernada que suma total_usd sin filtros de negocio',
        explanation: 'Un modelo de lenguaje conectado directamente a la tabla `orders` sin contexto semántico ve la columna `total_usd` y ejecuta `SUM(total_usd)` agrupado por región para 2024. Como no filtra `status = \'completed\'`, incluye pedidos cancelados, pendientes y reembolsados, suma impuestos y envíos, e ignora la tabla `refunds`. En `Cono Sur` reporta `1,119,793.69 USD` sobre `2,662` órdenes totales.',
        code: `SELECT
  s.region,
  COUNT(o.order_id) AS all_orders_counted,
  ROUND(SUM(o.total_usd), 2) AS unverified_llm_sales_usd
FROM orders o
JOIN stores s ON s.store_id = o.store_id
WHERE EXTRACT(YEAR FROM o.order_date) = 2024
GROUP BY s.region
ORDER BY unverified_llm_sales_usd DESC;`,
        expectedOutput: [
          { region: 'Cono Sur', all_orders_counted: 2662, unverified_llm_sales_usd: 1119793.69 },
          { region: 'Andina', all_orders_counted: 2617, unverified_llm_sales_usd: 1047145.81 },
          { region: 'Iberia', all_orders_counted: 1526, unverified_llm_sales_usd: 732600.21 },
          { region: 'Norteamérica', all_orders_counted: 1118, unverified_llm_sales_usd: 452714.08 },
        ],
      },
      {
        label: 'Paso 2 — Solución: auditoría MCP que contrasta la suma no gobernada contra el ingreso neto certificado',
        explanation: 'Al evaluar la métrica certificada `net_revenue_usd` (órdenes `completed`, `subtotal_usd - discount_usd` menos devoluciones `processed` preagregadas por `order_id`), comprobamos que el ingreso neto real de `Cono Sur` en 2024 es `755,876.56 USD`. La consulta libre sobreestimaba la región en `363,917.13 USD` (y en más de `1.11 millones de USD` en toda la empresa).',
        code: `WITH refunds_by_order AS (
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
        expectedOutput: [
          {
            region: 'Cono Sur',
            unverified_llm_sales_usd: 1119793.69,
            certified_net_revenue_usd: 755876.56,
            overstatement_usd: 363917.13,
          },
          {
            region: 'Andina',
            unverified_llm_sales_usd: 1047145.81,
            certified_net_revenue_usd: 696779.67,
            overstatement_usd: 350366.14,
          },
          {
            region: 'Iberia',
            unverified_llm_sales_usd: 732600.21,
            certified_net_revenue_usd: 486391,
            overstatement_usd: 246209.21,
          },
          {
            region: 'Norteamérica',
            unverified_llm_sales_usd: 452714.08,
            certified_net_revenue_usd: 299017.22,
            overstatement_usd: 153696.86,
          },
        ],
      },
    ],
  },

  checks: [
    {
      id: 'chk-bi4-05-synonym-collision',
      type: 'mcq',
      prompt: '¿Qué ocurre cuando un modelador asigna el sinónimo "ventas" simultáneamente a la columna física orders.total_usd, a la medida Ventas Brutas USD y a la medida Ingresos Netos USD?',
      options: [
        {
          id: 'a',
          text: 'Se produce una colisión léxica que vuelve ambigua la resolución de lenguaje natural, haciendo que el asistente devuelva cifras distintas ante preguntas equivalentes.',
          correct: true,
          feedback: 'Correcto. Compartir un mismo sinónimo entre columnas crudas y medidas distintas elimina el determinismo.',
        },
        {
          id: 'b',
          text: 'El motor MCP promedia automáticamente las tres métricas para ofrecer un resultado intermedio.',
          correct: false,
          feedback: 'Incorrecto. Ningún servidor MCP ni capa semántica promedia métricas distintas ante una colisión de nombres.',
        },
        {
          id: 'c',
          text: 'La base de datos DuckDB borra las tres columnas por duplicidad de nombres.',
          correct: false,
          feedback: 'Incorrecto. Los sinónimos son metadatos de la capa semántica y no borran tablas físicas.',
        },
      ],
      explanation: 'Compartir un mismo sinónimo entre columnas crudas y medidas distintas produce una colisión léxica. Las columnas numéricas base deben ocultarse (`isHidden`) y cada medida debe tener sinónimos exclusivos.',
    },
    {
      id: 'chk-bi4-05-mcp-primitives',
      type: 'mcq',
      prompt: 'En la arquitectura de un servidor Model Context Protocol (MCP) conectado a una capa semántica de BI, ¿cómo se reparten las responsabilidades entre Resources y Tools?',
      options: [
        {
          id: 'a',
          text: 'Resources expone de forma declarativa el catálogo de métricas, dimensiones, descripciones y sinónimos; Tools ejecuta de forma parametrizada y validada la consulta de una métrica certificada.',
          correct: true,
          feedback: 'Correcto. Resources aporta contexto estructurado de solo lectura y Tools ejecuta acciones tipadas sobre la capa semántica.',
        },
        {
          id: 'b',
          text: 'Resources ejecuta sentencias DROP TABLE en producción y Tools diseña el logotipo de la empresa.',
          correct: false,
          feedback: 'Incorrecto. Resources es estrictamente de lectura de contexto y Tools ejecuta herramientas gobernadas sin permisos destructivos.',
        },
        {
          id: 'c',
          text: 'Ambos componentes sirven únicamente para entrenar desde cero los pesos neuronales del modelo de lenguaje.',
          correct: false,
          feedback: 'Incorrecto. MCP conecta un modelo existente en tiempo de inferencia mediante contexto y herramientas, sin reentrenar pesos.',
        },
      ],
      explanation: 'En MCP, `Resources` expone el catálogo semántico de solo lectura (`metric_id`, grano, sinónimos) y `Tools` ejecuta consultas parametrizadas y auditables sobre métricas certificadas.',
    },
    {
      id: 'chk-bi4-05-citation-contract',
      type: 'mcq',
      prompt: 'Para que la respuesta de un asistente GenBI sea auditable por el comité ejecutivo, ¿qué metadatos mínimos debe incluir su cita verificable?',
      options: [
        {
          id: 'a',
          text: 'El identificador de la métrica certificada (metric_id), la versión del modelo semántico, las dimensiones y filtros aplicados (periodo y estados incluidos) y la consulta reproducible.',
          correct: true,
          feedback: 'Correcto. Con el metric_id, la versión, los filtros y el SQL reproducible, cualquier analista puede verificar la cifra al instante.',
        },
        {
          id: 'b',
          text: 'Únicamente el nombre del modelo de lenguaje utilizado y la temperatura de muestreo.',
          correct: false,
          feedback: 'Incorrecto. Saber el nombre del LLM no permite reconciliar qué fórmula ni qué filtros generaron el número financiero.',
        },
        {
          id: 'c',
          text: 'La dirección IP privada del navegador del usuario.',
          correct: false,
          feedback: 'Incorrecto. La IP del cliente no aporta ninguna trazabilidad sobre la definición semántica de la métrica.',
        },
      ],
      explanation: 'La auditoría ejecutiva en GenBI exige conocer qué métrica oficial se evaluó (`metric_id`), en qué versión (`semantic_version`), bajo qué filtros exactos y cómo reproducir el cálculo.',
    },
  ],

  practice: {
    type: 'sql',
    title: 'Construcción de salida auditable para herramienta MCP query_net_revenue_2024',
    language: 'sql',
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
    expected: `WITH refunds_by_order AS (
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
    orderMatters: true,
    hints: [
      'Corrige la condición del `JOIN`: en el código inicial dice `ON s.store_id = s.store_id` (producto cartesiano) en vez de `ON s.store_id = o.store_id`, y agrega `o.status = \'completed\'` en el `WHERE`.',
      'Calcula `gross_sales_usd` como `ROUND(SUM(o.subtotal_usd - o.discount_usd), 2)` en lugar de usar `o.total_usd`.',
      'Usa `COALESCE(SUM(r.refund_usd), 0)` tanto en `refunded_usd` como en `net_revenue_usd` para que los segmentos sin devoluciones (`Iberia warehouse`, `Andina warehouse`, `Iberia retail`) no queden en `NULL`.',
    ],
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
    solutionExplanation: 'La consulta corrige el `JOIN` por `s.store_id = o.store_id`, aplica el filtro obligatorio `o.status = \'completed\'`, deduce descuentos y devoluciones preagregadas con `COALESCE` e incluye el identificador `metric_id` para la cita MCP.',
    expectedOutputTable: [
      {
        metric_id: 'net_revenue_usd',
        region: 'Cono Sur',
        store_type: 'retail',
        completed_orders: 1722,
        gross_sales_usd: 622481.26,
        refunded_usd: 29160.41,
        net_revenue_usd: 593320.85,
      },
      {
        metric_id: 'net_revenue_usd',
        region: 'Andina',
        store_type: 'retail',
        completed_orders: 1233,
        gross_sales_usd: 429447.7,
        refunded_usd: 15225.68,
        net_revenue_usd: 414222.02,
      },
      {
        metric_id: 'net_revenue_usd',
        region: 'Iberia',
        store_type: 'warehouse',
        completed_orders: 585,
        gross_sales_usd: 285253.67,
        refunded_usd: 0,
        net_revenue_usd: 285253.67,
      },
      {
        metric_id: 'net_revenue_usd',
        region: 'Cono Sur',
        store_type: 'flagship',
        completed_orders: 477,
        gross_sales_usd: 169782.81,
        refunded_usd: 7227.1,
        net_revenue_usd: 162555.71,
      },
      {
        metric_id: 'net_revenue_usd',
        region: 'Andina',
        store_type: 'flagship',
        completed_orders: 608,
        gross_sales_usd: 176434.67,
        refunded_usd: 27929.69,
        net_revenue_usd: 148504.98,
      },
      {
        metric_id: 'net_revenue_usd',
        region: 'Norteamérica',
        store_type: 'retail',
        completed_orders: 441,
        gross_sales_usd: 151991,
        refunded_usd: 7756.6,
        net_revenue_usd: 144234.4,
      },
      {
        metric_id: 'net_revenue_usd',
        region: 'Andina',
        store_type: 'warehouse',
        completed_orders: 313,
        gross_sales_usd: 134052.67,
        refunded_usd: 0,
        net_revenue_usd: 134052.67,
      },
      {
        metric_id: 'net_revenue_usd',
        region: 'Iberia',
        store_type: 'retail',
        completed_orders: 311,
        gross_sales_usd: 105569.33,
        refunded_usd: 0,
        net_revenue_usd: 105569.33,
      },
      {
        metric_id: 'net_revenue_usd',
        region: 'Iberia',
        store_type: 'flagship',
        completed_orders: 336,
        gross_sales_usd: 118176.55,
        refunded_usd: 22608.55,
        net_revenue_usd: 95568,
      },
      {
        metric_id: 'net_revenue_usd',
        region: 'Norteamérica',
        store_type: 'warehouse',
        completed_orders: 234,
        gross_sales_usd: 89372.26,
        refunded_usd: 3637.59,
        net_revenue_usd: 85734.67,
      },
      {
        metric_id: 'net_revenue_usd',
        region: 'Norteamérica',
        store_type: 'flagship',
        completed_orders: 237,
        gross_sales_usd: 72064.79,
        refunded_usd: 3016.64,
        net_revenue_usd: 69048.15,
      },
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
      id: 'fc-bi4-05-a',
      front: '¿Por qué un agente text-to-SQL libre sobreestima los ingresos de Mercado Brisa en 2024 cuando se le pide "ventas netas"?',
      back: 'Porque suma `orders.total_usd` sobre todos los estados (incluyendo cancelados, pendientes y reembolsados, más impuestos y envío) e ignora la resta de `refunds`.',
    },
    {
      id: 'fc-bi4-05-b',
      front: '¿Qué es la desambiguación de sinónimos semánticos en GenBI?',
      back: 'Es la asignación unívoca de cada término coloquial de negocio a una sola medida certificada, ocultando las columnas físicas para impedir colisiones léxicas.',
    },
    {
      id: 'fc-bi4-05-c',
      front: '¿Qué dos primitivas de Model Context Protocol (MCP) estructuran la consulta a una capa semántica?',
      back: '`Resources` (para leer el catálogo de métricas, dimensiones, grano y sinónimos) y `Tools` (para ejecutar consultas parametrizadas sobre métricas certificadas).',
    },
    {
      id: 'fc-bi4-05-d',
      front: '¿Qué elementos integran una cita verificable en una respuesta de GenBI?',
      back: 'El `metric_id`, la versión o commit del modelo semántico (`semantic_version`), las dimensiones y filtros aplicados, y la consulta de reconciliación reproducible.',
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
      publisher: 'Model Context Protocol',
      accessed: '2026-10-29',
      supports: 'Primitivas Resources, Tools y Prompts para conectar modelos de lenguaje a fuentes gobernadas.',
    },
    {
      title: 'Microsoft Learn — Update your data model to work well with Copilot',
      url: 'https://learn.microsoft.com/en-us/power-bi/create-reports/copilot-evaluate-data',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Preparación de descripciones, sinónimos y ocultamiento de columnas técnicas en modelos semánticos.',
    },
    {
      title: 'Microsoft Learn — Best practices to optimize Q&A in Power BI',
      url: 'https://learn.microsoft.com/en-us/power-bi/natural-language/q-and-a-best-practices',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Desambiguación de sinónimos y respuestas verificadas para lenguaje natural.',
    },
    {
      title: 'dbt Labs Documentation — dbt Semantic Layer',
      url: 'https://docs.getdbt.com/docs/use-dbt-semantic-layer/dbt-sl',
      publisher: 'dbt Labs',
      accessed: '2026-10-29',
      supports: 'Gobernanza centralizada de definiciones de métricas para consumo consistente entre BI e IA.',
    },
  ],

  aiNotes: 'Destaca la magnitud del error del Paso 1 (`1,119,793.69 USD` vs `755,876.56 USD` reales en Cono Sur 2024, un exceso de `363,917.13 USD`) para justificar por qué GenBI debe invocar herramientas MCP sobre la capa semántica en vez de SQL libre. En la práctica SQL, revisa el `JOIN` (`s.store_id = o.store_id`), el filtro `o.status = \'completed\'` y el `COALESCE`.',
};

export default lesson;
