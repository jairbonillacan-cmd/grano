export const lesson = {
  id: 'x4-ia-datos-04-golden-evals-barreras-ast-sqlglot',
  moduleId: 'x4-ia-datos',
  tracks: ['core', 'de', 'da', 'bi'],
  order: 4,
  contentVersion: 2,
  title: 'Evaluación determinista con Golden Evals y AST en SQLGlot',
  subtitle: 'Evaluación determinista de sistemas de IA con conjuntos Golden Evals y barreras AST (SQLGlot)',
  level: 4,
  minutes: 25,
  prerequisites: [
    'x4-ia-datos-03-rag-hibrido-bm25-hnsw-rrf'
  ],
  hook: 'Tras actualizar el prompt del asistente analítico de Mercado Brisa, el equipo valida el cambio pidiendo a otro modelo de lenguaje que califique las consultas generadas del 1 al 5. El juez neuronal otorga una puntuación perfecta porque el SQL luce limpio, pero en producción el agente expone la columna customers.email y sobreestima los ingresos de escritorio en 640,808.58 USD. ¿Cómo reemplazamos jueces subjetivos por barreras deterministas de árbol de sintaxis abstracta (AST) en SQLGlot y suites Golden Evals en integración continua?',
  objectives: [
    'Inspeccionar consultas generadas mediante un árbol de sintaxis abstracta (AST) con SQLGlot para bloquear sentencias destructivas, tablas prohibidas y columnas PII.',
    'Demostrar por qué el patrón LLM-as-a-judge fracasa en sistemas de datos y cómo medir la exactitud de ejecución (Execution Accuracy) con conjuntos Golden Evals.',
    'Construir en DuckDB SQL una auditoría regresiva que cuantifique la deriva financiera entre consultas candidatas de IA y la verdad canónica de Mercado Brisa.'
  ],
  sections: [
    {
      id: 'barreras-ast-sqlglot-seguridad',
      heading: 'Cortafuegos determinista de SQL mediante AST y SQLGlot',
      body: 'Validar consultas generadas por un LLM con expresiones regulares es un fallo de seguridad documentado en **OWASP Top 10 para LLMs**. Una expresión regular como `NOT LIKE \'%DROP%\'` no distingue comentarios, alias ni comodines `SELECT *`.\n\nLa defensa determinista consiste en analizar la cadena SQL con **SQLGlot** para construir su **Árbol de Sintaxis Abstracta (AST)**. Esto ocurre antes de abrir cualquier conexión con DuckDB. Al invocar `sqlglot.parse_one(sql, read="duckdb")`, la consulta se convierte en una jerarquía de nodos tipados como `exp.Select`, `exp.Table` y `exp.Column`.\n\nUna barrera AST en producción aplica cuatro controles estrictos. Primero, verifica que la raíz sea exclusivamente `exp.Select`, bloqueando `DROP`, `DELETE`, `UPDATE` y `COPY`. Segundo, valida cada nodo `exp.Table` contra la lista blanca de vistas semánticas. Tercero, rechaza referencias a columnas con información personal (**PII**) como `customers.email` o `customers.full_name`. Cuarto, inyecta un nodo `LIMIT` y predicados de aislamiento por cliente.',
      example: {
        language: 'sql',
        code: `SELECT
  table_name,
  COUNT(*) AS total_columns,
  SUM(CASE WHEN column_name IN ('email', 'full_name', 'postal_code') THEN 1 ELSE 0 END) AS pii_columns
FROM (
  SELECT 'customers' AS table_name, UNNEST(['customer_id','full_name','email','country_code','city','postal_code','segment']) AS column_name
  UNION ALL
  SELECT 'orders' AS table_name, UNNEST(['order_id','customer_id','store_id','order_date','status','total_usd']) AS column_name
  UNION ALL
  SELECT 'payments' AS table_name, UNNEST(['payment_id','order_id','status','amount_usd','idempotency_key']) AS column_name
)
GROUP BY table_name
ORDER BY pii_columns DESC, table_name ASC;`,
        expectedOutput: [
          { table_name: 'customers', total_columns: 7, pii_columns: 3 },
          { table_name: 'orders', total_columns: 6, pii_columns: 0 },
          { table_name: 'payments', total_columns: 5, pii_columns: 0 }
        ]
      }
    },
    {
      id: 'golden-evals-exactitud-ejecucion',
      heading: 'Conjuntos Golden Evals y Exactitud de Ejecución (EX) en CI/CD',
      body: 'Un cortafuegos AST impide que el agente destruya datos o filtre PII, pero no garantiza exactitud financiera. Un antipatrón frecuente consiste en evaluar al agente usando otro modelo como árbitro (*LLM-as-a-judge*). El juez neuronal califica estilo superficial y no detecta que faltó deduplicar 405 webhooks o excluir `SKU-TEST-NEG`.\n\nLa ingeniería de datos aplica evaluación determinista mediante conjuntos **Golden Evals**. Este método mide la **Exactitud de Ejecución** (*Execution Accuracy*, **EX**) introducida en los benchmarks Spider y BIRD. Un conjunto Golden Eval es un archivo versionado en Git con casos representativos del negocio. Cada caso incluye la pregunta, el SQL canónico y el resultado tabular exacto sobre datos congelados.\n\nAnte cualquier cambio de modelo, prompt o catálogo YAML, el pipeline de **CI/CD** ejecuta las consultas candidatas sobre DuckDB. Luego compara cada celda contra la verdad canónica. Si la desviación absoluta supera la tolerancia de redondeo (`0.01`), el despliegue se detiene de inmediato.',
      example: {
        language: 'sql',
        code: `WITH golden_metric AS (
  SELECT ROUND(AVG(list_price_usd), 2) AS golden_avg_price_usd
  FROM products
  WHERE sku <> 'SKU-TEST-NEG'
),
candidate_metric AS (
  SELECT ROUND(AVG(list_price_usd), 2) AS candidate_avg_price_usd
  FROM products
)
SELECT
  g.golden_avg_price_usd,
  c.candidate_avg_price_usd,
  ROUND(ABS(c.candidate_avg_price_usd - g.golden_avg_price_usd), 2) AS abs_drift_usd,
  CASE
    WHEN ABS(c.candidate_avg_price_usd - g.golden_avg_price_usd) <= 0.01 THEN 'PASS'
    ELSE 'FAIL_DRIFT'
  END AS eval_verdict
FROM golden_metric g
CROSS JOIN candidate_metric c;`,
        expectedOutput: [
          {
            golden_avg_price_usd: 77.64,
            candidate_avg_price_usd: 77.15,
            abs_drift_usd: 0.49,
            eval_verdict: 'FAIL_DRIFT'
          }
        ]
      }
    }
  ],
  workedExample: {
    title: 'Ejecutor de regresión Golden Evals sobre tres casos de Mercado Brisa',
    description: 'Diseña en DuckDB SQL un ejecutor de regresión Golden Evals que evalúe 3 consultas generadas por un agente candidato (`eval_01_captured_gmv`, `eval_02_avg_list_price`, `eval_03_active_oro_customers`) frente a las consultas canónicas gobernadas de Mercado Brisa, clasificando cada prueba como `PASS` o `FAIL_DRIFT` con tolerancia `0.01`.',
    audit: 'Una suite Golden Evals ejecuta ambos conjuntos de consultas sobre los mismos datos y bloquea automáticamente el despliegue ante cualquier deriva contable.',
    steps: [
      {
        label: 'Paso 1: Calcular las tres métricas de verdad canónica (golden_truth)',
        explanation: 'Definimos la primera CTE `golden_truth` uniendo mediante `UNION ALL` las 3 métricas canónicas: el GMV capturado deduplicado por `order_id`, el precio medio de lista sin `SKU-TEST-NEG` y el conteo de clientes vigentes en nivel `oro`.',
        code: `SELECT 'eval_01_captured_gmv' AS eval_id, ROUND(SUM(captured_usd), 2) AS golden_val
FROM (
  SELECT o.order_id, MIN(p.amount_usd) AS captured_usd
  FROM orders o
  JOIN payments p ON o.order_id = p.order_id
  WHERE o.status IN ('completed', 'refunded') AND p.status = 'captured'
  GROUP BY o.order_id
)
UNION ALL
SELECT 'eval_02_avg_list_price' AS eval_id, ROUND(AVG(list_price_usd), 2) AS golden_val
FROM products
WHERE sku <> 'SKU-TEST-NEG'
UNION ALL
SELECT 'eval_03_active_oro_customers' AS eval_id, CAST(COUNT(*) AS DOUBLE) AS golden_val
FROM customer_changes
WHERE is_current = true AND tier = 'oro';`,
        expectedOutput: [
          { eval_id: 'eval_01_captured_gmv', golden_val: 6874488 },
          { eval_id: 'eval_02_avg_list_price', golden_val: 77.64 },
          { eval_id: 'eval_03_active_oro_customers', golden_val: 1017 }
        ]
      },
      {
        label: 'Paso 2: Ejecutar las tres consultas candidatas del agente (llm_candidates)',
        explanation: 'Definimos la segunda CTE `llm_candidates` que ejecuta las 3 consultas generadas por el modelo candidato (el cual olvidó deduplicar webhooks en la prueba 1 y olvidó excluir `SKU-TEST-NEG` en la prueba 2, pero acertó el filtro SCD2 en la prueba 3).',
        code: `SELECT 'eval_01_captured_gmv' AS eval_id, ROUND(SUM(p.amount_usd), 2) AS candidate_val
FROM orders o
JOIN payments p ON o.order_id = p.order_id
WHERE o.status IN ('completed', 'refunded') AND p.status = 'captured'
UNION ALL
SELECT 'eval_02_avg_list_price' AS eval_id, ROUND(AVG(list_price_usd), 2) AS candidate_val
FROM products
UNION ALL
SELECT 'eval_03_active_oro_customers' AS eval_id, CAST(COUNT(*) AS DOUBLE) AS candidate_val
FROM customer_changes
WHERE is_current = true AND tier = 'oro';`,
        expectedOutput: [
          { eval_id: 'eval_01_captured_gmv', candidate_val: 7043162.63 },
          { eval_id: 'eval_02_avg_list_price', candidate_val: 77.15 },
          { eval_id: 'eval_03_active_oro_customers', candidate_val: 1017 }
        ]
      },
      {
        label: 'Paso 3: Contrastar resultados y emitir veredicto PASS / FAIL_DRIFT',
        explanation: 'Unimos `golden_truth` y `llm_candidates` por `eval_id` para calcular la desviación absoluta `abs_diff` y emitir el veredicto determinista `PASS` o `FAIL_DRIFT`.',
        code: `WITH golden_truth AS (
  SELECT 'eval_01_captured_gmv' AS eval_id, ROUND(SUM(captured_usd), 2) AS golden_val
  FROM (
    SELECT o.order_id, MIN(p.amount_usd) AS captured_usd
    FROM orders o
    JOIN payments p ON o.order_id = p.order_id
    WHERE o.status IN ('completed', 'refunded') AND p.status = 'captured'
    GROUP BY o.order_id
  )
  UNION ALL
  SELECT 'eval_02_avg_list_price' AS eval_id, ROUND(AVG(list_price_usd), 2) AS golden_val
  FROM products
  WHERE sku <> 'SKU-TEST-NEG'
  UNION ALL
  SELECT 'eval_03_active_oro_customers' AS eval_id, CAST(COUNT(*) AS DOUBLE) AS golden_val
  FROM customer_changes
  WHERE is_current = true AND tier = 'oro'
),
llm_candidates AS (
  SELECT 'eval_01_captured_gmv' AS eval_id, ROUND(SUM(p.amount_usd), 2) AS candidate_val
  FROM orders o
  JOIN payments p ON o.order_id = p.order_id
  WHERE o.status IN ('completed', 'refunded') AND p.status = 'captured'
  UNION ALL
  SELECT 'eval_02_avg_list_price' AS eval_id, ROUND(AVG(list_price_usd), 2) AS candidate_val
  FROM products
  UNION ALL
  SELECT 'eval_03_active_oro_customers' AS eval_id, CAST(COUNT(*) AS DOUBLE) AS candidate_val
  FROM customer_changes
  WHERE is_current = true AND tier = 'oro'
)
SELECT
  g.eval_id,
  g.golden_val,
  c.candidate_val,
  ROUND(ABS(c.candidate_val - g.golden_val), 2) AS abs_diff,
  CASE
    WHEN ABS(c.candidate_val - g.golden_val) <= 0.01 THEN 'PASS'
    ELSE 'FAIL_DRIFT'
  END AS eval_status
FROM golden_truth g
JOIN llm_candidates c ON g.eval_id = c.eval_id
ORDER BY g.eval_id;`,
        expectedOutput: [
          { eval_id: 'eval_01_captured_gmv', golden_val: 6874488, candidate_val: 7043162.63, abs_diff: 168674.63, eval_status: 'FAIL_DRIFT' },
          { eval_id: 'eval_02_avg_list_price', golden_val: 77.64, candidate_val: 77.15, abs_diff: 0.49, eval_status: 'FAIL_DRIFT' },
          { eval_id: 'eval_03_active_oro_customers', golden_val: 1017, candidate_val: 1017, abs_diff: 0, eval_status: 'PASS' }
        ]
      }
    ]
  },
  checks: [
    {
      id: 'chk-x4-04-ast-vs-regex',
      type: 'mcq',
      prompt: '¿Por qué es indispensable analizar el SQL generado mediante un árbol de sintaxis abstracta (AST) con herramientas como SQLGlot en lugar de filtrar palabras prohibidas con expresiones regulares?',
      options: [
        {
          id: 'a',
          text: 'Porque las expresiones regulares son fáciles de evadir con comentarios, alias o `SELECT *`, mientras que el AST identifica de forma exacta cada nodo de sentencia, tabla y columna.',
          correct: true,
          feedback: 'Correcto. El AST representa la estructura gramatical real de la consulta y detecta tablas, columnas y comodines sin ambigüedad.'
        },
        {
          id: 'b',
          text: 'Porque DuckDB solo acepta consultas enviadas en formato binario de Python.',
          correct: false,
          feedback: 'Incorrecto. DuckDB recibe texto SQL estándar; SQLGlot actúa como barrera previa en el servidor MCP.'
        },
        {
          id: 'c',
          text: 'Porque SQLGlot comprime los archivos Parquet en disco a la mitad de su tamaño.',
          correct: false,
          feedback: 'Incorrecto. SQLGlot es un analizador y transpilador de código SQL, no un motor de almacenamiento físico.'
        },
        {
          id: 'd',
          text: 'Porque las expresiones regulares no pueden leer letras minúsculas en SQL.',
          correct: false,
          feedback: 'Incorrecto. Las expresiones regulares soportan banderas case-insensitive, pero siguen siendo incapaces de parsear gramáticas libres de contexto.'
        }
      ],
      explanation: 'Al construir el AST con SQLGlot, el validador inspecciona la estructura gramatical real de la consulta (`exp.Select`, `exp.Table`, `exp.Column`, `exp.Star`) sin importar saltos de línea, comentarios ni alias.'
    },
    {
      id: 'chk-x4-04-llm-judge-flaw',
      type: 'mcq',
      prompt: 'Un equipo de datos configura GPT-4o como juez (*LLM-as-a-judge*) para aprobar o rechazar las consultas SQL de su agente analítico sin ejecutarlas contra un conjunto Golden Evals. ¿Cuál es el fallo central de este diseño?',
      options: [
        {
          id: 'a',
          text: 'Un juez neuronal evalúa plausibilidad sintáctica del texto, pero no puede verificar la exactitud de ejecución ni detectar que faltó deduplicar webhooks o filtrar registros de prueba.',
          correct: true,
          feedback: 'Correcto. Sin ejecutar la consulta contra el dataset de referencia, un juez neuronal aprueba SQL sintácticamente limpio pero contablemente falso.'
        },
        {
          id: 'b',
          text: 'Los modelos de lenguaje no conocen las palabras clave SELECT ni GROUP BY.',
          correct: false,
          feedback: 'Incorrecto. Los modelos conocen la gramática SQL; su fallo radica en desconocer los datos e invariantes reales del almacén.'
        },
        {
          id: 'c',
          text: 'El juez neuronal convierte automáticamente todas las tablas de DuckDB en archivos CSV.',
          correct: false,
          feedback: 'Incorrecto. Un juez basado en LLM solo procesa tokens de texto.'
        },
        {
          id: 'd',
          text: 'No existe ningún fallo; evaluar SQL por inspección de texto es más exacto que ejecutarlo.',
          correct: false,
          feedback: 'Incorrecto. La única prueba de exactitud analítica es comparar el resultado ejecutado contra la verdad canónica.'
        }
      ],
      explanation: 'En ingeniería de datos, la verdad de una consulta se verifica por su Exactitud de Ejecución (Execution Accuracy) frente a resultados tabulares canónicos deterministas, nunca por opinión estilística de otro LLM.'
    },
    {
      id: 'chk-x4-04-predict-drift',
      type: 'predict-output',
      prompt: 'En la suite Golden Evals de Mercado Brisa, el precio medio canónico en `products` (excluyendo `SKU-TEST-NEG`) es `77.64` USD, mientras que la consulta candidata sin filtro devuelve `77.15` USD. Con tolerancia `0.01`, ¿qué reporta el evaluador?',
      options: [
        {
          id: 'a',
          text: 'Reporta abs_diff = 0.49 y estado FAIL_DRIFT porque 0.49 supera el umbral de 0.01.',
          correct: true,
          feedback: 'Correcto. |77.15 - 77.64| = 0.49 > 0.01, por lo que el test falla con FAIL_DRIFT.'
        },
        {
          id: 'b',
          text: 'Reporta PASS porque ambos valores redondeados a decenas son iguales a 80.',
          correct: false,
          feedback: 'Incorrecto. La tolerancia configurada es de un centavo (0.01), no de decenas.'
        },
        {
          id: 'c',
          text: 'Reporta abs_diff = -9.99 porque resta únicamente el precio del producto negativo.',
          correct: false,
          feedback: 'Incorrecto. abs_diff mide el valor absoluto de la diferencia entre ambos promedios.'
        },
        {
          id: 'd',
          text: 'Lanza una excepción de división por cero.',
          correct: false,
          feedback: 'Incorrecto. La comparación utiliza una resta simple con ABS(), sin divisiones.'
        }
      ],
      explanation: 'La diferencia absoluta entre 77.64 y 77.15 es 0.49 USD, superando ampliamente la tolerancia de redondeo de 0.01 USD y bloqueando el test.'
    },
    {
      id: 'chk-x4-04-order-guardrails',
      type: 'order',
      prompt: 'Ordena las 4 etapas de validación determinista antes de promover una nueva versión de un agente analítico a producción:',
      items: [
        'Ejecutar el agente candidato sobre las preguntas del conjunto Golden Evals en el entorno de integración continua (CI).',
        'Validar cada consulta generada con el cortafuegos AST en SQLGlot (solo SELECT, sin PII, tablas permitidas).',
        'Ejecutar las consultas aprobadas contra el dataset de prueba en DuckDB y comparar sus resultados con la verdad canónica.',
        'Aprobar el despliegue únicamente si las violaciones AST son 0 y la exactitud de ejecución (PASS) alcanza el umbral exigido.'
      ],
      correctOrder: [
        'Ejecutar el agente candidato sobre las preguntas del conjunto Golden Evals en el entorno de integración continua (CI).',
        'Validar cada consulta generada con el cortafuegos AST en SQLGlot (solo SELECT, sin PII, tablas permitidas).',
        'Ejecutar las consultas aprobadas contra el dataset de prueba en DuckDB y comparar sus resultados con la verdad canónica.',
        'Aprobar el despliegue únicamente si las violaciones AST son 0 y la exactitud de ejecución (PASS) alcanza el umbral exigido.'
      ],
      explanation: 'Primero se generan las consultas sobre el benchmark Golden, luego pasan por el filtro sintáctico AST, después se mide su exactitud de ejecución en el motor y finalmente se decide el despliegue.'
    }
  ],
  practice: {
    type: 'sql',
    title: 'Auditoría Golden Evals de sobreestimación por device_type',
    language: 'sql',
    prompt: 'Construye una auditoría Golden Evals desglosada por `device_type` (`orders`) sobre órdenes pagadas (`o.status IN (\'completed\', \'refunded\')`). Calcula en `golden_device` la métrica canónica `golden_net_revenue_usd`: suma de `oi.line_total_usd` pre-agregada por `order_id` (excluyendo `p.sku <> \'SKU-TEST-NEG\'`) menos los reembolsos pre-agregados por `order_id` (`status = \'processed\'`). Compárala mediante `JOIN` contra `naive_llm_device`, que calcula `naive_raw_payments_usd` sumando directamente `pay.amount_usd` (`pay.status = \'captured\'`) sin deduplicar webhooks ni restar reembolsos. Devuelve `device_type`, `golden_net_revenue_usd`, `naive_raw_payments_usd` y `overstatement_usd` (`ROUND(naive_raw_payments_usd - golden_net_revenue_usd, 2)`), ordenados por `overstatement_usd DESC`.',
    starterCode: `WITH items_by_order AS (
  SELECT
    oi.order_id,
    SUM(oi.line_total_usd) AS gross_item_usd
  FROM order_items oi
  JOIN products p ON oi.product_id = p.product_id
  WHERE p.sku <> 'SKU-TEST-NEG'
  GROUP BY oi.order_id
),
refunds_by_order AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS refunded_usd
  FROM refunds
  WHERE status = 'processed'
  GROUP BY order_id
),
-- Corrige golden_device para restar COALESCE(r.refunded_usd, 0) a i.gross_item_usd:
golden_device AS (
  SELECT
    o.device_type,
    ROUND(SUM(i.gross_item_usd), 2) AS golden_net_revenue_usd
  FROM orders o
  JOIN items_by_order i ON o.order_id = i.order_id
  LEFT JOIN refunds_by_order r ON o.order_id = r.order_id
  WHERE o.status IN ('completed', 'refunded')
  GROUP BY o.device_type
),
naive_llm_device AS (
  SELECT
    o.device_type,
    ROUND(SUM(pay.amount_usd), 2) AS naive_raw_payments_usd
  FROM orders o
  JOIN payments pay ON o.order_id = pay.order_id
  WHERE o.status IN ('completed', 'refunded')
    AND pay.status = 'captured'
  GROUP BY o.device_type
)
SELECT
  g.device_type,
  g.golden_net_revenue_usd,
  n.naive_raw_payments_usd,
  ROUND(n.naive_raw_payments_usd - g.golden_net_revenue_usd, 2) AS overstatement_usd
FROM golden_device g
JOIN naive_llm_device n ON g.device_type = n.device_type
ORDER BY overstatement_usd DESC;`,
    solution: `WITH items_by_order AS (
  SELECT
    oi.order_id,
    SUM(oi.line_total_usd) AS gross_item_usd
  FROM order_items oi
  JOIN products p ON oi.product_id = p.product_id
  WHERE p.sku <> 'SKU-TEST-NEG'
  GROUP BY oi.order_id
),
refunds_by_order AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS refunded_usd
  FROM refunds
  WHERE status = 'processed'
  GROUP BY order_id
),
golden_device AS (
  SELECT
    o.device_type,
    ROUND(SUM(i.gross_item_usd - COALESCE(r.refunded_usd, 0)), 2) AS golden_net_revenue_usd
  FROM orders o
  JOIN items_by_order i ON o.order_id = i.order_id
  LEFT JOIN refunds_by_order r ON o.order_id = r.order_id
  WHERE o.status IN ('completed', 'refunded')
  GROUP BY o.device_type
),
naive_llm_device AS (
  SELECT
    o.device_type,
    ROUND(SUM(pay.amount_usd), 2) AS naive_raw_payments_usd
  FROM orders o
  JOIN payments pay ON o.order_id = pay.order_id
  WHERE o.status IN ('completed', 'refunded')
    AND pay.status = 'captured'
  GROUP BY o.device_type
)
SELECT
  g.device_type,
  g.golden_net_revenue_usd,
  n.naive_raw_payments_usd,
  ROUND(n.naive_raw_payments_usd - g.golden_net_revenue_usd, 2) AS overstatement_usd
FROM golden_device g
JOIN naive_llm_device n ON g.device_type = n.device_type
ORDER BY overstatement_usd DESC;`,
    solutionExplanation: 'Al descontar COALESCE(r.refunded_usd, 0) a nivel de cada orden en golden_device y contrastar contra la suma cruda de payments en naive_llm_device, cuantificamos con exactitud la sobreestimación por tipo de dispositivo.',
    expectedOutputTable: [
      { device_type: 'desktop', golden_net_revenue_usd: 2592612.17, naive_raw_payments_usd: 3233420.75, overstatement_usd: 640808.58 },
      { device_type: 'mobile', golden_net_revenue_usd: 2029935.84, naive_raw_payments_usd: 2464382.4, overstatement_usd: 434446.56 },
      { device_type: 'pos_tienda', golden_net_revenue_usd: 1094147.25, naive_raw_payments_usd: 1345359.48, overstatement_usd: 251212.23 }
    ],
    orderMatters: true,
    hints: [
      'En el starterCode, la CTE golden_device ya hace el LEFT JOIN con refunds_by_order r, pero aún no descuenta las devoluciones en la suma.',
      'Reemplaza ROUND(SUM(i.gross_item_usd), 2) en golden_device por ROUND(SUM(i.gross_item_usd - COALESCE(r.refunded_usd, 0)), 2).',
      'Mantén el resto de las CTEs y el ORDER BY overstatement_usd DESC para obtener las tres filas (desktop, mobile y pos_tienda).'
    ]
  },
  roleNotes: {
    de: 'Como Ingeniero de Datos, integras SQLGlot en el middleware del servidor MCP para rechazar en milisegundos cualquier nodo AST que intente leer columnas PII o ejecutar sentencias fuera de la lista blanca.',
    da: 'Como Analista de Datos, eres el propietario del repositorio Golden Evals: cada vez que se detecta un caso borde en producción, lo conviertes en un par pregunta-SQL canónico dentro de la suite de regresión.',
    bi: 'Como especialista en BI, utilizas los reportes de Exactitud de Ejecución de la suite Golden Evals para certificar ante auditoría interna que el asistente de IA cumple los mismos controles que los tableros financieros.'
  },
  summary: [
    'Las expresiones regulares no protegen contra fugas de PII ni SQL malicioso; se requiere parsear el AST con SQLGlot.',
    'Un cortafuegos AST valida que la raíz sea SELECT, bloquea columnas sensibles y restringe las tablas a vistas gobernadas.',
    'El patrón LLM-as-a-judge es inadecuado para auditar cifras porque ignora duplicaciones de grano y registros centinela.',
    'Los conjuntos Golden Evals miden la Exactitud de Ejecución (EX) comparando resultados en DuckDB dentro del pipeline CI/CD.'
  ],
  flashcards: [
    {
      id: 'fc-x4-04-1',
      front: '¿Qué ventaja ofrece inspeccionar un árbol AST con SQLGlot frente a buscar palabras prohibidas con expresiones regulares?',
      back: 'SQLGlot descompone la gramática SQL en nodos tipados (Select, Table, Column, Star), permitiendo bloquear acceso a PII o comandos destructivos sin importar alias ni comentarios.'
    },
    {
      id: 'fc-x4-04-2',
      front: '¿Qué es la Exactitud de Ejecución (Execution Accuracy, EX) en un conjunto Golden Evals?',
      back: 'Es la proporción de consultas generadas por el agente cuyo resultado tabular al ejecutarse en el motor coincide exactamente (dentro de tolerancia) con el SQL canónico de referencia.'
    },
    {
      id: 'fc-x4-04-3',
      front: '¿Por qué un juez basado en LLM (LLM-as-a-judge) aprueba consultas financieramente erróneas en Mercado Brisa?',
      back: 'Porque evalúa la coherencia superficial del código SQL sin ejecutarlo ni comprobar si omite deduplicar payments o filtrar SKU-TEST-NEG.'
    },
    {
      id: 'fc-x4-04-4',
      front: '¿Qué columnas de la tabla customers de Mercado Brisa debe bloquear obligatoriamente la barrera AST por contener PII?',
      back: 'Debe bloquear full_name, email y postal_code, además de prohibir comodines SELECT * sobre tablas con datos personales.'
    }
  ],
  glossaryTerms: [
    'golden-eval-set',
    'ast-sql-guardrail',
    'text-to-sql-hallucination',
    'c28-mcp-semantic-rag-evals'
  ],
  sources: [
    {
      title: 'SQLGlot — Python SQL Parser, Transpiler, and Optimizer',
      url: 'https://github.com/tobymao/sqlglot',
      publisher: 'SQLGlot (Toby Mao)',
      accessed: '2026-10-29',
      supports: 'Arquitectura libre de dependencias para parsear y transpilar SQL entre múltiples dialectos analíticos.'
    },
    {
      title: 'SQLGlot API Reference & AST Expression Tree Traversal',
      url: 'https://sqlglot.com/sqlglot.html',
      publisher: 'SQLGlot Documentation',
      accessed: '2026-10-29',
      supports: 'Inspección de nodos AST mediante parse_one y find_all para construir barreras deterministas.'
    },
    {
      title: 'OWASP Top 10 for Large Language Model Applications & Generative AI',
      url: 'https://genai.owasp.org/llm-top-10/',
      publisher: 'OWASP Foundation',
      accessed: '2026-10-29',
      supports: 'Controles de seguridad frente a agencia excesiva, inyección de prompts y exposición de datos sensibles.'
    },
    {
      title: 'Text-to-SQL Empowered by Large Language Models: A Benchmark Evaluation',
      url: 'https://arxiv.org/abs/2305.03111',
      publisher: 'arXiv / VLDB (Gao, Wang, Li et al.)',
      accessed: '2026-10-29',
      supports: 'Metodología de evaluación sistemática mediante Execution Accuracy (EX) sobre suites de referencia.'
    }
  ],
  aiNotes: 'Al guiar al estudiante en esta lección, destaca cómo la práctica combina todo lo aprendido en el módulo: la consulta ingenua suma payments crudos e ignora reembolsos, sobreestimando desktop en 640,808.58 USD. En el código de práctica solo falta restar COALESCE(r.refunded_usd, 0) dentro de SUM(...) en golden_device.',
  needsReview: false
};
export default lesson;
