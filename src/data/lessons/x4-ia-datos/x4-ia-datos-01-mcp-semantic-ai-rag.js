export const lesson = {
  id: 'x4-ia-datos-01-mcp-semantic-ai-rag',
  legacyId: 'l18-mcp-semantic-ai-rag',
  moduleId: 'x4-ia-datos',
  tracks: ['core', 'de', 'da', 'bi'],
  order: 1,
  legacyOrder: 18,
  contentVersion: 2,
  title: 'Servidores MCP conectados a la capa semántica y RAG híbrido',
  subtitle: 'Arquitectura JSON-RPC 2.0, primitivas resources/tools y aislamiento frente a tablas crudas',
  level: 4,
  minutes: 30,
  prerequisites: [
    'c2-dimensional-04-metrics-simpson',
    'c2-dimensional-05-hechos-instantanea-acumulativos'
  ],
  hook: 'El comité directivo de Mercado Brisa conecta un modelo de lenguaje directamente a las tablas crudas del almacén para consultar la facturación capturada del trimestre. El agente escribe una unión sintácticamente válida entre orders y payments y reporta 7,043,162.63 USD en lugar de los 6,874,488.00 USD reales porque suma 405 reintentos duplicados de webhooks. ¿Cómo diseñamos una frontera determinista con Model Context Protocol para que el agente consuma métricas gobernadas sin tocar jamás las tablas crudas?',
  objectives: [
    'Diagnosticar por qué conectar agentes de IA directamente a tablas crudas provoca inflación financiera, fugas de PII y deriva de métricas.',
    'Diseñar la topología Host-Client-Server del Model Context Protocol (MCP) diferenciando entre recursos pasivos (resources) y herramientas ejecutables (tools).',
    'Construir consultas SQL gobernadas sobre Mercado Brisa que respalden herramientas MCP deduplicando pagos y pre-agregando reembolsos al grano de la orden.'
  ],
  sections: [
    {
      id: 'riesgo-acceso-crudo-llm',
      heading: 'El fallo estructural de conectar un LLM a tablas crudas',
      body: 'Dar a un modelo de lenguaje credenciales de lectura sobre el esquema físico traslada el modelado dimensional a un predictor de tokens. Aunque el modelo conozca la gramática de DuckDB, desconoce las anomalías operativas del negocio.\n\nEn **Mercado Brisa**, la pasarela de cobros registra reintentos de webhook en la tabla `payments`. De las 16,605 filas con estado `captured` vinculadas a órdenes pagadas (`completed` o `refunded`), existen 405 cobros duplicados sobre la misma orden. Un agente sin contexto semántico ejecuta un `SUM(p.amount_usd)` directo. Como resultado, sobreestima el volumen bruto en 168,674.63 USD.\n\nA este error contable se suma el riesgo de seguridad y el desborde de ventana de contexto. Exponer cientos de tablas crudas satura el prompt con columnas irrelevantes. Además, permite que una consulta generada filtre datos personales como `customers.email` o `customers.full_name`. La solución arquitectónica consiste en interponer un protocolo estandarizado entre el modelo y la **capa semántica**.',
      interactive: {
        component: 'mcp-semantic-vs-raw-sql',
        caption: 'Contraste arquitectónico entre acceso SQL directo a tablas crudas y ejecución gobernada mediante servidor MCP.'
      },
      example: {
        language: 'sql',
        code: `WITH raw_llm AS (
  SELECT
    COUNT(p.payment_id) AS payment_rows,
    ROUND(SUM(p.amount_usd), 2) AS naive_gmv_usd
  FROM orders o
  JOIN payments p ON o.order_id = p.order_id
  WHERE o.status IN ('completed', 'refunded') AND p.status = 'captured'
),
governed_mcp AS (
  SELECT
    COUNT(DISTINCT o.order_id) AS paid_orders,
    ROUND(SUM(dp.captured_usd), 2) AS governed_gmv_usd
  FROM orders o
  JOIN (
    SELECT order_id, MIN(amount_usd) AS captured_usd
    FROM payments
    WHERE status = 'captured'
    GROUP BY order_id
  ) dp ON o.order_id = dp.order_id
  WHERE o.status IN ('completed', 'refunded')
)
SELECT
  r.payment_rows,
  g.paid_orders,
  r.naive_gmv_usd,
  g.governed_gmv_usd,
  ROUND(r.naive_gmv_usd - g.governed_gmv_usd, 2) AS webhook_inflation_usd
FROM raw_llm r
CROSS JOIN governed_mcp g;`,
        expectedOutput: [
          {
            payment_rows: 16605,
            paid_orders: 16200,
            naive_gmv_usd: 7043162.63,
            governed_gmv_usd: 6874488,
            webhook_inflation_usd: 168674.63
          }
        ]
      }
    },
    {
      id: 'arquitectura-mcp-resources-tools',
      heading: 'Arquitectura del Model Context Protocol (MCP): Resources y Tools',
      body: 'El **Model Context Protocol (MCP)** estandariza la comunicación entre aplicaciones de IA y fuentes de datos mediante sesiones sobre **JSON-RPC 2.0**. Su arquitectura divide responsabilidades en tres componentes: el **Host** (la aplicación donde interactúa el usuario), el `Client` (el conector interno de sesión) y el `Server` (el proceso ligero que gobierna el acceso).\n\nUn servidor MCP analítico expone dos primitivas centrales. Los **resources** representan metadatos pasivos de solo lectura identificados por un URI, como `semantic://mercado-brisa/metrics/revenue.yaml` o el contrato de datos ODCS de la tabla `stores`. Leer un recurso entrega definiciones verificadas sin ejecutar cómputo pesado.\n\nLas **tools** son funciones ejecutables con parámetros validados mediante **JSON Schema**. En lugar de permitir una herramienta `execute_raw_sql(query)`, el servidor publica `query_regional_revenue(status_filter)`. Esta función invoca internamente una consulta pre-agregada sobre DuckDB, excluye el registro centinela `SKU-TEST-NEG` y garantiza trazabilidad por rol.',
      example: {
        language: 'sql',
        code: `WITH items_by_order AS (
  SELECT
    oi.order_id,
    SUM(oi.line_total_usd) AS gross_item_usd
  FROM order_items oi
  JOIN products p ON oi.product_id = p.product_id
  WHERE p.sku <> 'SKU-TEST-NEG'
  GROUP BY oi.order_id
)
SELECT
  s.region,
  COUNT(o.order_id) AS completed_orders,
  ROUND(SUM(i.gross_item_usd), 2) AS governed_revenue_usd
FROM orders o
JOIN stores s ON o.store_id = s.store_id
JOIN items_by_order i ON o.order_id = i.order_id
WHERE o.status = 'completed'
GROUP BY s.region
ORDER BY governed_revenue_usd DESC;`,
        expectedOutput: [
          { region: 'Cono Sur', completed_orders: 4920, governed_revenue_usd: 1797472.18 },
          { region: 'Andina', completed_orders: 4921, governed_revenue_usd: 1733571.64 },
          { region: 'Iberia', completed_orders: 2811, governed_revenue_usd: 1174460.14 },
          { region: 'Norteamérica', completed_orders: 2108, governed_revenue_usd: 758647.22 }
        ]
      }
    }
  ],
  workedExample: {
    title: 'Implementación de la herramienta MCP get_country_net_captured_revenue',
    description: 'Debes implementar la lógica SQL que respalda la herramienta MCP `get_country_net_captured_revenue` en Mercado Brisa. El comité financiero exige reportar por `country_code` las órdenes pagadas (`completed` o `refunded`), el monto capturado deduplicando webhooks en `payments`, los reembolsos procesados en `refunds` y el ingreso neto capturado.',
    audit: 'Cada herramienta MCP debe encapsular las reglas de deduplicación y el alineamiento de grano en el servidor, devolviendo al modelo únicamente agregados certificados.',
    steps: [
      {
        label: 'Paso 1: Deduplicar cobros capturados al grano de order_id',
        explanation: 'Construimos la primera CTE `dedup_payments` al grano exacto de `order_id`. Filtramos `status = \'captured\'` y aplicamos `MIN(amount_usd)` agrupado por orden para eliminar los 405 reintentos de webhook sin alterar el importe real cobrado.',
        code: `SELECT
  order_id,
  MIN(amount_usd) AS captured_usd
FROM payments
WHERE status = 'captured'
GROUP BY order_id
ORDER BY order_id
LIMIT 3;`,
        expectedOutput: [
          { order_id: 1, captured_usd: 505.84 },
          { order_id: 2, captured_usd: 208.16 },
          { order_id: 3, captured_usd: 364.26 }
        ]
      },
      {
        label: 'Paso 2: Pre-agregar devoluciones procesadas al grano de order_id',
        explanation: 'Construimos la segunda CTE `order_refunds` también al grano de `order_id`, sumando `refund_amount_usd` únicamente para devoluciones con `status = \'processed\'`. Aislar ambos hechos en CTEs separadas impide cualquier multiplicación cruzada de filas.',
        code: `SELECT
  order_id,
  ROUND(SUM(refund_amount_usd), 2) AS refunded_usd
FROM refunds
WHERE status = 'processed'
GROUP BY order_id
ORDER BY order_id
LIMIT 3;`,
        expectedOutput: [
          { order_id: 8, refunded_usd: 158.95 },
          { order_id: 18, refunded_usd: 418.42 },
          { order_id: 22, refunded_usd: 56.6 }
        ]
      },
      {
        label: 'Paso 3: Unir CTEs 1:1 con orders y stores para el payload MCP',
        explanation: 'Unimos `orders` y `stores` con ambas CTEs pre-agregadas usando `LEFT JOIN` para `order_refunds` y `COALESCE(..., 0)`. Así obtenemos la tabla exacta que el servidor MCP serializa en JSON-RPC hacia el cliente.',
        code: `WITH dedup_payments AS (
  SELECT order_id, MIN(amount_usd) AS captured_usd
  FROM payments
  WHERE status = 'captured'
  GROUP BY order_id
),
order_refunds AS (
  SELECT order_id, SUM(refund_amount_usd) AS refunded_usd
  FROM refunds
  WHERE status = 'processed'
  GROUP BY order_id
)
SELECT
  s.country_code,
  COUNT(DISTINCT o.order_id) AS paid_orders,
  ROUND(SUM(dp.captured_usd), 2) AS captured_gmv_usd,
  ROUND(COALESCE(SUM(r.refunded_usd), 0), 2) AS refunded_usd,
  ROUND(SUM(dp.captured_usd) - COALESCE(SUM(r.refunded_usd), 0), 2) AS net_captured_revenue_usd
FROM orders o
JOIN stores s ON o.store_id = s.store_id
JOIN dedup_payments dp ON o.order_id = dp.order_id
LEFT JOIN order_refunds r ON o.order_id = r.order_id
WHERE o.status IN ('completed', 'refunded')
GROUP BY s.country_code
ORDER BY net_captured_revenue_usd DESC;`,
        expectedOutput: [
          { country_code: 'ES', paid_orders: 3085, captured_gmv_usd: 1482611.35, refunded_usd: 43170.94, net_captured_revenue_usd: 1439440.41 },
          { country_code: 'AR', paid_orders: 3086, captured_gmv_usd: 1213180.17, refunded_usd: 37523.35, net_captured_revenue_usd: 1175656.82 },
          { country_code: 'CO', paid_orders: 3086, captured_gmv_usd: 1213387.55, refunded_usd: 75353.66, net_captured_revenue_usd: 1138033.89 },
          { country_code: 'CL', paid_orders: 2315, captured_gmv_usd: 1043297.01, refunded_usd: 40468.47, net_captured_revenue_usd: 1002828.54 },
          { country_code: 'PE', paid_orders: 2314, captured_gmv_usd: 967124.31, refunded_usd: 40025.57, net_captured_revenue_usd: 927098.74 },
          { country_code: 'MX', paid_orders: 2314, captured_gmv_usd: 954887.61, refunded_usd: 37992.53, net_captured_revenue_usd: 916895.08 }
        ]
      }
    ]
  },
  checks: [
    {
      id: 'chk-x4-01-mcp-primitives',
      type: 'mcq',
      prompt: 'En la especificación del Model Context Protocol (MCP), ¿qué primitiva debe utilizarse para exponer de forma pasiva el archivo YAML con definiciones de métricas y contratos de datos identificado por un URI?',
      options: [
        {
          id: 'a',
          text: 'Tools, porque permiten ejecutar funciones con efectos secundarios sobre el motor.',
          correct: false,
          feedback: 'Incorrecto. Las tools están diseñadas para invocar acciones o consultas parametrizadas, no para exponer archivos de catálogo pasivos.'
        },
        {
          id: 'b',
          text: 'Resources, porque exponen datos y metadatos contextuales de solo lectura direccionables mediante URI.',
          correct: true,
          feedback: 'Correcto. Los resources en MCP entregan definiciones, esquemas y contratos identificados por URI sin efectos secundarios.'
        },
        {
          id: 'c',
          text: 'Sampling, porque delega en el cliente la generación de SQL libre sobre tablas crudas.',
          correct: false,
          feedback: 'Incorrecto. Sampling permite que el servidor solicite completaciones al cliente, pero no expone catálogos por URI.'
        },
        {
          id: 'd',
          text: 'Prompts, porque abren una conexión ODBC directa entre el navegador y DuckDB.',
          correct: false,
          feedback: 'Incorrecto. Los prompts son plantillas de interacción reutilizables y nunca abren conexiones directas al motor.'
        }
      ],
      explanation: 'En MCP, los resources representan contenido contextual pasivo y de solo lectura identificado por URI (como esquemas, contratos ODCS o catálogos YAML), mientras que las tools ejecutan acciones o consultas parametrizadas.'
    },
    {
      id: 'chk-x4-01-webhook-inflation',
      type: 'predict-output',
      prompt: 'En Mercado Brisa existen 16,200 órdenes pagadas (`completed` o `refunded`), pero la tabla `payments` contiene 16,605 registros con `status = \'captured\'` debido a reintentos de webhook. ¿Qué ocurre si un agente ejecuta `SELECT COUNT(*), SUM(p.amount_usd) FROM orders o JOIN payments p USING (order_id)`?',
      options: [
        {
          id: 'a',
          text: 'Devuelve 16,200 órdenes y el GMV exacto porque DuckDB deduplica claves foráneas automáticamente.',
          correct: false,
          feedback: 'Incorrecto. Ningún motor SQL deduplica filas automáticamente en un INNER JOIN cuando existen varios registros hijos por clave.'
        },
        {
          id: 'b',
          text: 'Devuelve 16,605 filas e infla el GMV en 168,674.63 USD al sumar dos veces los cobros con webhook duplicado.',
          correct: true,
          feedback: 'Correcto. Los 405 reintentos de webhook multiplican las órdenes afectadas y elevan la suma de 6,874,488.00 USD a 7,043,162.63 USD.'
        },
        {
          id: 'c',
          text: 'Falla con un error de sintaxis por no incluir una cláusula GROUP BY.',
          correct: false,
          feedback: 'Incorrecto. COUNT(*) y SUM(...) sin columnas adicionales son agregaciones globales válidas sin GROUP BY.'
        },
        {
          id: 'd',
          text: 'Devuelve NULL porque las órdenes reembolsadas anulan la tabla payments.',
          correct: false,
          feedback: 'Incorrecto. Las órdenes con estado refunded conservan su cobro capturado en payments.'
        }
      ],
      explanation: 'Al existir una relación 1:N accidental en payments por los 405 reintentos de webhook, el JOIN directo multiplica las órdenes afectadas y suma 7,043,162.63 USD en lugar de 6,874,488.00 USD.'
    },
    {
      id: 'chk-x4-01-spot-bug-mcp',
      type: 'mcq',
      prompt: 'Un ingeniero implementa la herramienta MCP `get_category_revenue` con `SELECT p.category, SUM(oi.line_total_usd) FROM orders o JOIN order_items oi USING (order_id) JOIN products p USING (product_id) WHERE o.status = \'completed\' GROUP BY 1`. ¿Qué regla de gobernanza de Mercado Brisa falta aplicar?',
      options: [
        {
          id: 'a',
          text: 'Falta excluir el producto centinela con `p.sku <> \'SKU-TEST-NEG\'`, cuyo precio negativo distorsiona la categoría.',
          correct: true,
          feedback: 'Correcto. El registro de prueba SKU-TEST-NEG tiene list_price_usd = -9.99 y debe excluirse en la capa semántica.'
        },
        {
          id: 'b',
          text: 'Falta usar RIGHT JOIN con la tabla events para contar sesiones anónimas.',
          correct: false,
          feedback: 'Incorrecto. Unir eventos de telemetría con líneas de pedido provocaría un fan-out masivo.'
        },
        {
          id: 'c',
          text: 'Falta agrupar por `oi.order_item_id` en el SELECT final.',
          correct: false,
          feedback: 'Incorrecto. Agrupar por order_item_id destruiría la agregación por categoría de producto.'
        },
        {
          id: 'd',
          text: 'Falta convertir `line_total_usd` a texto mediante CAST.',
          correct: false,
          feedback: 'Incorrecto. SUM requiere un tipo numérico como DOUBLE o DECIMAL, nunca VARCHAR.'
        }
      ],
      explanation: 'El catálogo de Mercado Brisa incluye el registro de prueba `SKU-TEST-NEG` con precio de lista `-9.99`. La capa semántica detrás de toda tool MCP debe filtrarlo sistemáticamente.'
    },
    {
      id: 'chk-x4-01-fill-blank',
      type: 'fill-code',
      prompt: 'Completa el protocolo de transporte estándar que utiliza MCP para intercambiar mensajes estructurados de solicitud, respuesta y notificación entre el cliente y el servidor:',
      template: 'Protocolo de mensajería MCP: {{b1}} 2.0',
      blanks: [
        {
          id: 'b1',
          accepted: ['JSON-RPC', 'json-rpc', 'JSONRPC', 'jsonrpc']
        }
      ],
      explanation: 'Model Context Protocol utiliza JSON-RPC 2.0 como protocolo de mensajería sobre stdio o HTTP con Server-Sent Events (SSE) para negociar capacidades e invocar resources y tools.'
    }
  ],
  practice: {
    type: 'sql',
    title: 'Herramienta MCP get_category_governed_revenue sobre Mercado Brisa',
    language: 'sql',
    prompt: 'Implementa la consulta SQL que respalda la herramienta MCP `get_category_governed_revenue` sobre Mercado Brisa. Para todos los pedidos con `o.status = \'completed\'` y excluyendo el SKU centinela (`p.sku <> \'SKU-TEST-NEG\'`), calcula por cada `category` de `products`: el número de órdenes distintas completadas (`completed_orders`), el ingreso bruto de líneas redondeado a 2 decimales (`gross_item_revenue_usd` usando `SUM(oi.line_total_usd)`) y el ticket promedio por orden en la categoría redondeado a 2 decimales (`avg_category_order_usd`, dividiendo `SUM(oi.line_total_usd)` entre `COUNT(DISTINCT o.order_id)`). Ordena por `gross_item_revenue_usd DESC`.',
    starterCode: `-- Corrige la consulta de la herramienta MCP get_category_governed_revenue:
-- 1. Usa COUNT(DISTINCT o.order_id) para no inflar órdenes por número de líneas.
-- 2. Filtra el producto de prueba p.sku <> 'SKU-TEST-NEG'.
SELECT
  p.category,
  COUNT(*) AS completed_orders,
  ROUND(SUM(oi.line_total_usd), 2) AS gross_item_revenue_usd,
  ROUND(SUM(oi.line_total_usd) / COUNT(*), 2) AS avg_category_order_usd
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id
WHERE o.status = 'completed'
GROUP BY p.category
ORDER BY gross_item_revenue_usd DESC;`,
    solution: `SELECT
  p.category,
  COUNT(DISTINCT o.order_id) AS completed_orders,
  ROUND(SUM(oi.line_total_usd), 2) AS gross_item_revenue_usd,
  ROUND(SUM(oi.line_total_usd) / COUNT(DISTINCT o.order_id), 2) AS avg_category_order_usd
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id
WHERE o.status = 'completed'
  AND p.sku <> 'SKU-TEST-NEG'
GROUP BY p.category
ORDER BY gross_item_revenue_usd DESC;`,
    solutionExplanation: 'Al usar COUNT(DISTINCT o.order_id) respetamos el grano de orden en lugar de contar líneas de artículos, y al filtrar p.sku <> \'SKU-TEST-NEG\' evitamos que el producto centinela de prueba distorsione los ingresos de la categoría.',
    expectedOutputTable: [
      { category: 'Molinos', completed_orders: 6245, gross_item_revenue_usd: 2163162.27, avg_category_order_usd: 346.38 },
      { category: 'Cafeteras', completed_orders: 6250, gross_item_revenue_usd: 1643366.45, avg_category_order_usd: 262.94 },
      { category: 'Suscripciones', completed_orders: 6167, gross_item_revenue_usd: 657384.31, avg_category_order_usd: 106.6 },
      { category: 'Accesorios', completed_orders: 6247, gross_item_revenue_usd: 586859.56, avg_category_order_usd: 93.94 },
      { category: 'Café en grano', completed_orders: 6246, gross_item_revenue_usd: 413378.59, avg_category_order_usd: 66.18 }
    ],
    orderMatters: true,
    hints: [
      'Cada orden puede tener múltiples líneas en order_items; reemplaza COUNT(*) por COUNT(DISTINCT o.order_id) tanto en completed_orders como en el denominador de avg_category_order_usd.',
      'Agrega la condición AND p.sku <> \'SKU-TEST-NEG\' en la cláusula WHERE para excluir el artículo de prueba con precio negativo.',
      'Verifica que las cuatro columnas se llamen exactamente category, completed_orders, gross_item_revenue_usd y avg_category_order_usd.'
    ]
  },
  pipelineChallenge: {
    title: 'Flujo de ejecución segura en un servidor MCP analítico',
    prompt: 'Ordena cronológicamente los 5 pasos desde que una analista formula una pregunta en lenguaje natural hasta que recibe la cifra gobernada desde DuckDB:',
    steps: [
      { id: 's1', text: 'El Host recibe la pregunta de negocio e inspecciona los resources MCP para consultar las métricas y dimensiones disponibles.' },
      { id: 's2', text: 'El modelo selecciona la tool MCP tipada (por ejemplo, get_category_governed_revenue) y emite una solicitud JSON-RPC 2.0 con parámetros estructurados.' },
      { id: 's3', text: 'El servidor MCP valida los argumentos contra el JSON Schema y verifica los permisos del rol solicitante.' },
      { id: 's4', text: 'El servidor MCP ejecuta la plantilla SQL pre-agregada sobre DuckDB excluyendo SKU-TEST-NEG y webhooks duplicados.' },
      { id: 's5', text: 'El servidor devuelve el resultado tabular certificado al Host para que el modelo redacte la respuesta final con trazabilidad.' }
    ],
    correctOrder: ['s1', 's2', 's3', 's4', 's5'],
    hint: 'Primero se consulta el catálogo mediante resources, luego se invoca la tool por JSON-RPC, se valida el esquema en el servidor, se ejecuta en DuckDB y finalmente se entrega la respuesta.'
  },
  roleNotes: {
    de: 'Como Ingeniero de Datos, tu responsabilidad es construir y mantener los servidores MCP y las vistas semánticas subyacentes. Nunca expongas credenciales de superusuario ni herramientas de SQL libre; encapsula la deduplicación de webhooks y exclusión de SKUs de prueba en la capa gobernada.',
    da: 'Como Analista de Datos, defines la lógica canónica de cada métrica y auditas que los recursos expuestos en el catálogo MCP reflejen fielmente los denominadores, filtros de estado y reglas de grano del negocio.',
    bi: 'Como especialista en BI, conectas asistentes conversacionales y tableros al mismo servidor de métricas gobernadas, asegurando que el número reportado en el chat ejecutivo coincida al centavo con el informe oficial.'
  },
  summary: [
    'Conectar un LLM directamente a tablas crudas genera alucinaciones contables por webhooks duplicados, SKUs de prueba y diferencias de grano.',
    'El Model Context Protocol (MCP) desacopla los clientes de IA del almacén mediante sesiones JSON-RPC 2.0 con aislamiento de permisos.',
    'Los resources de MCP exponen metadatos pasivos por URI, mientras que las tools ejecutan consultas parametrizadas validadas con JSON Schema.',
    'Toda herramienta MCP analítica debe pre-agregar hechos al grano correcto antes de devolver cifras certificadas al modelo.'
  ],
  flashcards: [
    {
      id: 'fc-x4-01-1',
      front: '¿Por qué un agente Text-to-SQL directo sobreestima el GMV capturado en Mercado Brisa en 168,674.63 USD?',
      back: 'Porque suma directamente las 16,605 filas de payments con status captured sin deduplicar los 405 reintentos de webhook sobre las 16,200 órdenes pagadas.'
    },
    {
      id: 'fc-x4-01-2',
      front: '¿Cuál es la diferencia operativa entre un resource y una tool en un servidor MCP?',
      back: 'Un resource expone metadatos o esquemas de solo lectura identificados por URI sin efectos secundarios; una tool ejecuta una función parametrizada y validada por JSON Schema.'
    },
    {
      id: 'fc-x4-01-3',
      front: '¿Qué componentes integran la topología tripartita del Model Context Protocol?',
      back: 'El Host (aplicación de usuario), el Client (conector de protocolo dentro del host) y el Server (proceso que gobierna el acceso a datos y herramientas).'
    },
    {
      id: 'fc-x4-01-4',
      front: '¿Por qué debe usarse COUNT(DISTINCT o.order_id) al calcular métricas de órdenes sobre order_items?',
      back: 'Porque order_items tiene grano de línea de pedido (1:N respecto a orders), y usar COUNT(*) contaría líneas de artículos en lugar de órdenes únicas.'
    }
  ],
  glossaryTerms: [
    'model-context-protocol',
    'mcp-resources-tools',
    'text-to-sql-hallucination',
    'c28-mcp-semantic-rag-evals',
    'c21-semantic-layer'
  ],
  sources: [
    {
      title: 'Model Context Protocol — Introduction & Getting Started',
      url: 'https://modelcontextprotocol.io/introduction',
      publisher: 'Model Context Protocol Specification',
      accessed: '2026-10-29',
      supports: 'Fundamentos del estándar MCP para conectar aplicaciones LLM con fuentes de datos externas.'
    },
    {
      title: 'Model Context Protocol — Core Architecture',
      url: 'https://modelcontextprotocol.io/docs/concepts/architecture',
      publisher: 'Model Context Protocol Specification',
      accessed: '2026-10-29',
      supports: 'Topología Host-Client-Server y protocolo de transporte basado en mensajes JSON-RPC 2.0.'
    },
    {
      title: 'Model Context Protocol — Server Resources Specification',
      url: 'https://modelcontextprotocol.io/docs/concepts/resources',
      publisher: 'Model Context Protocol Specification',
      accessed: '2026-10-29',
      supports: 'Exposición de metadatos de esquemas y catálogos como recursos de solo lectura identificados por URI.'
    },
    {
      title: 'Model Context Protocol — Server Tools Specification',
      url: 'https://modelcontextprotocol.io/docs/concepts/tools',
      publisher: 'Model Context Protocol Specification',
      accessed: '2026-10-29',
      supports: 'Diseño de herramientas ejecutables tipadas mediante JSON Schema con validación en el servidor.'
    }
  ],
  aiNotes: 'Al asistir al estudiante en esta lección, enfatiza por qué una consulta sintácticamente válida puede producir errores financieros graves en Mercado Brisa (405 webhooks duplicados en payments y el registro SKU-TEST-NEG en products). Guía al alumno para distinguir entre resources (lectura de catálogo por URI) y tools (ejecución parametrizada) en MCP, evitando que proponga ejecutar SQL libre desde el LLM.',
  needsReview: false
};
export default lesson;
