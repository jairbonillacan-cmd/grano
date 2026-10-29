// Lección migrada al esquema v2 mediante scripts/migrate-legacy.mjs
const lesson = {
  "id": "x4-ia-datos-01-mcp-semantic-ai-rag",
  "moduleId": "x4-ia-datos",
  "tracks": [
    "core"
  ],
  "level": 4,
  "order": 1,
  "title": "Servidores MCP, capa semántica y RAG híbrido",
  "minutes": 30,
  "prerequisites": [
    "de3-transformacion-03-contracts-semantic-layer"
  ],
  "contentVersion": 1,
  "hook": "En Mercado Brisa (empresa ficticia), un equipo conectó un modelo de lenguaje directamente a las 450 tablas crudas del almacén para responder preguntas en lenguaje natural. Cuando finanzas preguntó por la retención neta del segmento mayorista en el tercer trimestre, el modelo escribió un `JOIN` directo entre `raw.customers` y `raw.invoices` sin filtrar facturas anuladas ni cuentas de prueba, provocando un fan-out y respondiendo `184.2 %` cuando el valor real era `116.4 %`. ¿Cómo diseñas un sistema de IA sobre datos usando servidores MCP, capa semántica y evaluaciones deterministas?",
  "objectives": [
    "Sustituir la generación libre de SQL sobre tablas crudas por llamadas gobernadas a la capa semántica a través de un servidor MCP.",
    "Combinar búsqueda léxica (BM25) y vectorial (HNSW) mediante Reciprocal Rank Fusion (RRF) para recuperar definiciones y esquemas.",
    "Construir un conjunto de evaluación (evals) que compare el resultado numérico devuelto contra consultas SQL de referencia."
  ],
  "sections": [
    {
      "id": "limites-del-text-to-sql-directo-frente-a-la-capa",
      "heading": "Límites del text-to-SQL directo frente a la capa semántica",
      "body": "Pedirle a un LLM que escriba SQL desde cero sobre cientos de tablas físicas crudas falla en producción por tres razones estructurales:\n1) **Ambigüedad de Esquema**: En una empresa real existen tablas llamadas `orders`, `orders_v2`, `OrdersFinal` y `stg_orders_clean`. Sin gobernanza, el modelo elige al azar.\n2) **Reglas de Negocio Implícitas**: Saber que para calcular ingresos netos hay que filtrar `status NOT IN ('CANCELLED', 'TEST')`, excluir empleados internos y usar la tasa de cambio `ASOF JOIN` del momento del cobro no está escrito en los tipos de columna `VARCHAR/NUMERIC`.\n3) **Joins Asimétricos (Fan-Out)**: Un LLM tiende a encadenar `LEFT JOIN` entre tablas de diferente granularidad multiplicando sumas.\nLa solución en 2026 es **Text-to-Semantic-Layer**: el agente IA no inventa `JOINs` ni fórmulas matemáticas; traduce la pregunta del usuario a una llamada estructurada contra la **Capa Semántica (MetricFlow / Cube)** indicando `metrics: [\"net_revenue_retention_pct\"]`, `dimensions: [\"customer__segment\"]`, y el compilador determinista de la Capa Semántica genera el SQL garantizado.",
      "interactive": {
        "component": "mcp-semantic-vs-raw-sql",
        "caption": "Simulador interactivo: Servidores MCP, capa semántica y RAG híbrido"
      }
    },
    {
      "id": "arquitectura-de-un-servidor-mcp-conectado-al-cat",
      "heading": "Arquitectura de un servidor MCP conectado al catálogo",
      "body": "El **Model Context Protocol (MCP)** es el estándar abierto universal que conecta clientes de IA (Google AI Ultra, Gemini CLI, Antigravity, IDEs y aplicaciones corporativas) con servidores de contexto y herramientas.\nUn **Servidor MCP de Datos** bien diseñado por DE, DA y BI expone tres primitivas limpias:\n- **Resources (Recursos de solo lectura)**: el catálogo de contratos ODCS, el glosario de métricas certificadas y el linaje de OpenLineage.\n- **Tools (Herramientas ejecutables con esquema JSON estricto)**:\n  1) `search_catalog_hybrid(query)`: busca tablas, columnas y métricas relevantes.\n  2) `query_semantic_metrics(metrics, group_by, where, limit)`: consulta la Capa Semántica con validación determinista.\n  3) `execute_guarded_sql(sql)`: para exploración ad-hoc de DA sobre la capa Silver, protegido por un **parser AST (`SQLGlot`)** que rechaza cualquier sentencia que no sea `SELECT`, inyecta un `LIMIT` máximo, prohíbe acceder a columnas PII y verifica el presupuesto de bytes escaneados antes de tocar el motor.",
      "example": {
        "language": "sql",
        "code": "// 1. El Agente IA consulta el Servidor MCP usando la herramienta gobernada:\nconst response = await mcpServer.callTool(\"query_semantic_metrics\", {\n  metrics: [\"net_revenue_retention_pct\", \"active_paying_customers\"],\n  dimensions: [\"customer__segment\"],\n  where: \"metric_time >= '2026-07-01' AND metric_time < '2026-10-01'\",\n  order_by: [\"-net_revenue_retention_pct\"]\n});\n\n/* 2. El Servidor MCP valida permisos RLS, invoca MetricFlow/Cube y ejecuta\n      el SQL determinista certificado sobre el Snapshot de Apache Iceberg v3: */\n-- SQL Compilado y Auditado por SQLGlot AST (Solo Lectura, Cero Fan-Out):\nSELECT\n  dim_c.segment AS customer__segment,\n  ROUND(100.0 * SUM(fct.retained_mrr_usd) / NULLIF(SUM(fct.starting_mrr_usd), 0), 2)\n    AS net_revenue_retention_pct,\n  COUNT(DISTINCT fct.customer_id) AS active_paying_customers\nFROM gold.fct_mrr_retention_monthly fct\nJOIN gold.dim_customer_scd2 dim_c\n  ON fct.customer_sk = dim_c.customer_sk\nWHERE fct.metric_month BETWEEN DATE '2026-07-01' AND DATE '2026-09-01'\n  AND dim_c.is_test_account = FALSE\nGROUP BY 1;",
        "expectedOutput": [
          {
            "customer__segment": "Enterprise",
            "net_revenue_retention_pct": "116.40% (100% Exacto y Reconciliado)",
            "active_paying_customers": 1240,
            "linaje_mcp": "Verificado · Contrato ODCS v3 · Snapshot #814"
          }
        ]
      }
    },
    {
      "id": "recuperacion-hibrida-busqueda-bm25-vectorial-hns",
      "heading": "Recuperación híbrida: búsqueda BM25, vectorial HNSW y RRF",
      "body": "Cuando una organización tiene 2,500 métricas, 800 modelos en dbt/SQLMesh y miles de documentos de reglas de negocio, no caben ni deben meterse todos en cada prompt. Necesitas recuperar solo los 5–10 elementos relevantes (**Retrieval-Augmented Generation — RAG**).\nSin embargo, usar **únicamente búsqueda vectorial por embeddings** falla estrepitosamente en ingeniería de datos: un embedding denso entiende que *\"cancelación de clientes\"* se parece a *\"churn\"*, pero confunde códigos exactos como `SKU-9941-B`, nombres técnicos de columnas como `fct_mrr_net_v3` o siglas internas.\nLa arquitectura estándar en producción (ejecutable directamente en **DuckDB** con `fts` + `vss` o en formato columnar **Lance**) es la **Búsqueda Híbrida con Reciprocal Rank Fusion (RRF)**:\n$$\\text{RRF\\_Score}(d) = \\frac{1}{k + \\text{rank}_{\\text{BM25}}(d)} + \\frac{1}{k + \\text{rank}_{\\text{Vector}}(d)}$$\nDonde $k = 60$. Así combinas la precisión quirúrgica de palabras clave (**BM25**) con la comprensión conceptual de vectores (**HNSW**)."
    },
    {
      "id": "conjuntos-de-evaluacion-deterministas-y-validaci",
      "heading": "Conjuntos de evaluación deterministas y validación de SQL",
      "body": "En 2026, ningún equipo serio despliega un Agente de Datos a producción diciendo *\"lo probé con 3 preguntas y se veía bien\"*. DA y BI construyen un **Golden Evaluation Dataset (Golden Evals)**: una tabla versionada con 100 a 300 preguntas reales de negocio emparejadas con:\n1) Las métricas y dimensiones semánticas esperadas.\n2) El resultado numérico exacto sobre un snapshot fijo de Apache Iceberg (`FOR SYSTEM_TIME AS OF ...`).\nEn cada Pull Request donde se modifica el prompt del agente, las descripciones de la Capa Semántica o el servidor MCP, el pipeline de CI/CD ejecuta los 200 casos y exige **>98% de Execution Accuracy** y **0 violaciones de seguridad** (incluyendo pruebas de *Indirect Prompt Injection* donde un texto malicioso dentro de una columna de comentarios de clientes intenta engañar al LLM para exfiltrar datos)."
    }
  ],
  "workedExample": {
    "title": "Ejemplo guiado: Servidores MCP, capa semántica y RAG híbrido",
    "description": "Compara el peligro de dejar que un LLM escriba SQL libre sobre tablas crudas frente a un Servidor MCP con validación AST, Búsqueda Híbrida RRF y Capa Semántica:",
    "audit": "",
    "steps": [
      {
        "label": "Peligroso: Text-to-SQL Crudo sin Gobernanza ni Validación AST",
        "explanation": "Compara el peligro de dejar que un LLM escriba SQL libre sobre tablas crudas frente a un Servidor MCP con validación AST, Búsqueda Híbrida RRF y Capa Semántica:",
        "code": "-- SQL generado a ciegas por un LLM conectado directo al esquema crudo:\n-- 1) Une orders con invoices por user_id provocando un Fan-Out masivo (N:M)\n-- 2) Olvida excluir cuentas de prueba (is_internal_test = false)\n-- 3) Expone emails personales (PII) sin filtro de seguridad\nSELECT\n  u.email,\n  SUM(i.invoice_amount_usd) / SUM(o.order_total_usd) AS nrr_inventado\nFROM raw.users u\nJOIN raw.orders o ON u.user_id = o.user_id\nJOIN raw.invoices i ON u.user_id = i.user_id\nWHERE o.created_at >= '2026-07-01'\nGROUP BY u.email;",
        "expectedOutput": [
          {
            "nrr_reportado": "184.2% (Alucinación grave por Fan-Out N:M)",
            "fuga_pii": "Expuso 14,200 emails sin enmascarar",
            "auditabilidad": "Nula (Cada ejecución inventa un SQL distinto)"
          }
        ]
      },
      {
        "label": "Estándar Actual: Servidor MCP + Búsqueda Híbrida RRF + Capa Semántica",
        "explanation": "Compara ahora la consulta corregida y verifica cómo las filas y totales coinciden con la auditoría.",
        "code": "// 1. El Agente IA consulta el Servidor MCP usando la herramienta gobernada:\nconst response = await mcpServer.callTool(\"query_semantic_metrics\", {\n  metrics: [\"net_revenue_retention_pct\", \"active_paying_customers\"],\n  dimensions: [\"customer__segment\"],\n  where: \"metric_time >= '2026-07-01' AND metric_time < '2026-10-01'\",\n  order_by: [\"-net_revenue_retention_pct\"]\n});\n\n/* 2. El Servidor MCP valida permisos RLS, invoca MetricFlow/Cube y ejecuta\n      el SQL determinista certificado sobre el Snapshot de Apache Iceberg v3: */\n-- SQL Compilado y Auditado por SQLGlot AST (Solo Lectura, Cero Fan-Out):\nSELECT\n  dim_c.segment AS customer__segment,\n  ROUND(100.0 * SUM(fct.retained_mrr_usd) / NULLIF(SUM(fct.starting_mrr_usd), 0), 2)\n    AS net_revenue_retention_pct,\n  COUNT(DISTINCT fct.customer_id) AS active_paying_customers\nFROM gold.fct_mrr_retention_monthly fct\nJOIN gold.dim_customer_scd2 dim_c\n  ON fct.customer_sk = dim_c.customer_sk\nWHERE fct.metric_month BETWEEN DATE '2026-07-01' AND DATE '2026-09-01'\n  AND dim_c.is_test_account = FALSE\nGROUP BY 1;",
        "expectedOutput": [
          {
            "customer__segment": "Enterprise",
            "net_revenue_retention_pct": "116.40% (100% Exacto y Reconciliado)",
            "active_paying_customers": 1240,
            "linaje_mcp": "Verificado · Contrato ODCS v3 · Snapshot #814"
          }
        ]
      }
    ]
  },
  "checks": [
    {
      "id": "c1",
      "type": "mcq",
      "prompt": "En una auditoría de un servidor MCP de datos, encuentras una herramienta `execute_sql(query)` protegida solo con `if (!query.startsWith(\"SELECT\"))` y una nota en el prompt pidiendo no leer la tabla de salarios. ¿Por qué esta defensa falla y qué control se debe aplicar?",
      "options": [
        {
          "id": "a",
          "text": "Las instrucciones en el prompt son vulnerables a Prompt Injection y una regex simple puede evadirse con comentarios, CTEs o funciones laterales; en producción se exige defensa en profundidad: credenciales de base de datos nativas de solo lectura con permisos restringidos a vistas autorizadas, Row-Level Security (RLS) y validación del Árbol Sintáctico Abstracto (AST con SQLGlot) que inspeccione cada tabla y columna referenciada.",
          "correct": true,
          "feedback": "Exacto. Un System Prompt jamás es una frontera de seguridad. La seguridad de un Servidor MCP reside en permisos reales de motor (Read-Only + vistas gobernadas + RLS), parseo AST estricto con SQLGlot y límites de recursos."
        },
        {
          "id": "b",
          "text": "Escribir \"POR FAVOR NUNCA BORRES NADA\" en mayúsculas dentro del System Prompt garantiza matemáticamente el 100% de seguridad en cualquier motor SQL.",
          "correct": false,
          "feedback": "Un modelo de lenguaje siempre puede ser manipulado mediante Prompt Injection directo o indirecto; la seguridad debe aplicarse de forma determinista fuera del LLM."
        },
        {
          "id": "c",
          "text": "Basta con ocultar los nombres de las tablas porque ningún LLM puede ejecutar `SELECT * FROM information_schema.tables`.",
          "correct": false,
          "feedback": "La seguridad por oscuridad no protege los datos; una cuenta con permisos excesivos puede listar el catálogo del sistema si no está restringida a nivel de motor y AST."
        }
      ],
      "explanation": "Exacto. Un System Prompt jamás es una frontera de seguridad. La seguridad de un Servidor MCP reside en permisos reales de motor (Read-Only + vistas gobernadas + RLS), parseo AST estricto con SQLGlot y límites de recursos."
    },
    {
      "id": "c2",
      "type": "mcq",
      "prompt": "Un usuario busca en el catálogo la columna exacta `cust_tax_id_mx`. La búsqueda solo por embeddings vectoriales devuelve columnas genéricas de clientes pero no acierta el identificador exacto. ¿Qué componente soluciona este fallo?",
      "options": [
        {
          "id": "a",
          "text": "Combinar búsqueda léxica BM25 con búsqueda vectorial mediante Reciprocal Rank Fusion (RRF).",
          "correct": true,
          "feedback": "Correcto: BM25 puntúa alto las coincidencias exactas de tokens raros como cust_tax_id_mx y RRF fusiona ambos rankings."
        },
        {
          "id": "b",
          "text": "Subir la temperatura del modelo generativo a 1.5.",
          "correct": false,
          "feedback": "Incorrecto: aumentar la temperatura incrementa la aleatoriedad de la respuesta, no la precisión del recuperador."
        },
        {
          "id": "c",
          "text": "Eliminar los nombres de columnas de la base de datos.",
          "correct": false,
          "feedback": "Incorrecto: empeoraría tanto la recuperación como la generación de consultas."
        }
      ],
      "explanation": "En catálogos de datos coexisten preguntas conceptuales (\"abandono de clientes\") y términos literales (\"col_churn_30d\"), por lo que la fusión híbrida BM25 + HNSW es el estándar."
    },
    {
      "id": "c3",
      "type": "mcq",
      "prompt": "Antes de actualizar el modelo o el prompt de tu agente de consultas, ejecutas tu suite de 100 preguntas de referencia (evals). ¿Qué criterio verifica realmente que la respuesta del agente es matemáticamente correcta?",
      "options": [
        {
          "id": "a",
          "text": "Ejecutar la consulta generada en un entorno de prueba y comparar el DataFrame resultante (filas y valores con tolerancia numérica) contra la consulta de referencia.",
          "correct": true,
          "feedback": "Correcto: dos consultas SQL escritas de forma distinta son equivalentes si producen exactamente el mismo resultado sobre el dataset de prueba."
        },
        {
          "id": "b",
          "text": "Comprobar únicamente con `===` si el texto SQL generado es idéntico carácter por carácter al SQL de referencia.",
          "correct": false,
          "feedback": "Incorrecto: una consulta puede usar un alias distinto o una CTE equivalente y dar el resultado exacto aunque el string difiera."
        },
        {
          "id": "c",
          "text": "Preguntarle al mismo modelo si cree que su respuesta suena convincente.",
          "correct": false,
          "feedback": "Incorrecto: un LLM puede validar como \"convincente\" un número que proviene de un JOIN con fan-out."
        }
      ],
      "explanation": "La evaluación por ejecución (execution accuracy) sobre datos controlados verifica la exactitud del resultado final sin penalizar variaciones sintácticas válidas."
    }
  ],
  "practice": {
    "type": "fill-blanks",
    "title": "Reto Hybrid RAG en SQL: Reciprocal Rank Fusion (BM25 + Vectores HNSW) para Catálogo MCP",
    "language": "sql",
    "prompt": "Completa la consulta en DuckDB que implementa el buscador híbrido del Servidor MCP para encontrar las métricas más relevantes del catálogo: combina el ranking léxico exacto (`bm25_rank`) con el ranking semántico vectorial (`vec_rank`) usando la fórmula estándar de **Reciprocal Rank Fusion (RRF)** con constante `60`, une ambos resultados con `FULL OUTER JOIN` para no perder candidatos que aparezcan en un solo índice y ordena por `rrf_score DESC`.",
    "starterCode": "WITH lexical_bm25 AS (\n  SELECT\n    metric_name,\n    ROW_NUMBER() OVER (ORDER BY bm25_score DESC) AS bm25_rank\n  FROM catalog.metrics_fts_search('nrr retencion neta enterprise')\n  LIMIT 25\n),\nsemantic_vector AS (\n  SELECT\n    metric_name,\n    ROW_NUMBER() OVER (ORDER BY array_cosine_distance(embedding, $query_vec) ASC) AS vec_rank\n  FROM catalog.metrics_embeddings\n  LIMIT 25\n)\nSELECT\n  COALESCE(l.metric_name, s.metric_name) AS metric_name,\n  l.bm25_rank,\n  s.vec_rank,\n  ROUND(\n    COALESCE(1.0 / ({{b1}} + l.bm25_rank), 0.0) +\n    COALESCE(1.0 / (60 + s.vec_rank), 0.0),\n    5\n  ) AS rrf_score\nFROM lexical_bm25 l\n{{b2}} semantic_vector s\n  ON l.metric_name = s.metric_name\nORDER BY {{b3}}\nLIMIT 5;",
    "expected": "WITH lexical_bm25 AS (\n  SELECT\n    metric_name,\n    ROW_NUMBER() OVER (ORDER BY bm25_score DESC) AS bm25_rank\n  FROM catalog.metrics_fts_search('nrr retencion neta enterprise')\n  LIMIT 25\n),\nsemantic_vector AS (\n  SELECT\n    metric_name,\n    ROW_NUMBER() OVER (ORDER BY array_cosine_distance(embedding, $query_vec) ASC) AS vec_rank\n  FROM catalog.metrics_embeddings\n  LIMIT 25\n)\nSELECT\n  COALESCE(l.metric_name, s.metric_name) AS metric_name,\n  l.bm25_rank,\n  s.vec_rank,\n  ROUND(\n    COALESCE(1.0 / ({{b1}} + l.bm25_rank), 0.0) +\n    COALESCE(1.0 / (60 + s.vec_rank), 0.0),\n    5\n  ) AS rrf_score\nFROM lexical_bm25 l\n{{b2}} semantic_vector s\n  ON l.metric_name = s.metric_name\nORDER BY {{b3}}\nLIMIT 5;",
    "orderMatters": true,
    "hints": [
      "Constante de suavizado RRF estándar: En Reciprocal Rank Fusion (`1 / (k + rank)`), la constante estándar `k` que evita que un único #1 domine desproporcionadamente es `60`.",
      "Tipo de JOIN para conservar hallazgos de ambos buscadores: Una métrica puede aparecer en el top 25 de BM25 (por sigla exacta) o solo en el top 25 vectorial (por sinónimo); usa `FULL OUTER JOIN` para unir ambas listas.",
      "Criterio de ordenamiento final: Ordena de mayor a menor puntaje fusionado (`rrf_score DESC`)."
    ],
    "solution": "WITH lexical_bm25 AS (\n  SELECT\n    metric_name,\n    ROW_NUMBER() OVER (ORDER BY bm25_score DESC) AS bm25_rank\n  FROM catalog.metrics_fts_search('nrr retencion neta enterprise')\n  LIMIT 25\n),\nsemantic_vector AS (\n  SELECT\n    metric_name,\n    ROW_NUMBER() OVER (ORDER BY array_cosine_distance(embedding, $query_vec) ASC) AS vec_rank\n  FROM catalog.metrics_embeddings\n  LIMIT 25\n)\nSELECT\n  COALESCE(l.metric_name, s.metric_name) AS metric_name,\n  l.bm25_rank,\n  s.vec_rank,\n  ROUND(\n    COALESCE(1.0 / ({{b1}} + l.bm25_rank), 0.0) +\n    COALESCE(1.0 / (60 + s.vec_rank), 0.0),\n    5\n  ) AS rrf_score\nFROM lexical_bm25 l\n{{b2}} semantic_vector s\n  ON l.metric_name = s.metric_name\nORDER BY {{b3}}\nLIMIT 5;",
    "solutionExplanation": "Combina búsqueda léxica (BM25) y búsqueda vectorial (distancia coseno / HNSW) mediante Reciprocal Rank Fusion (`1 / (60 + rank)`). Utiliza `FULL OUTER JOIN` junto con `COALESCE` para puntuar correctamente documentos presentes en uno o en ambos índices. Prioriza los resultados con mayor `rrf_score` antes de inyectar las definiciones semánticas en el contexto del Servidor MCP.",
    "blanks": [
      {
        "id": "b1",
        "placeholder": "Constante de suavizado RRF estándar",
        "acceptedAnswers": [
          "60",
          "60.0"
        ],
        "hint": "En Reciprocal Rank Fusion (`1 / (k + rank)`), la constante estándar `k` que evita que un único #1 domine desproporcionadamente es `60`."
      },
      {
        "id": "b2",
        "placeholder": "Tipo de JOIN para conservar hallazgos de ambos buscadores",
        "acceptedAnswers": [
          "FULL OUTER JOIN",
          "FULL JOIN"
        ],
        "hint": "Una métrica puede aparecer en el top 25 de BM25 (por sigla exacta) o solo en el top 25 vectorial (por sinónimo); usa `FULL OUTER JOIN` para unir ambas listas."
      },
      {
        "id": "b3",
        "placeholder": "Criterio de ordenamiento final",
        "acceptedAnswers": [
          "rrf_score DESC",
          "rrf_score desc",
          "4 DESC"
        ],
        "hint": "Ordena de mayor a menor puntaje fusionado (`rrf_score DESC`)."
      }
    ],
    "expectedOutputTable": [
      {
        "metric_name": "net_revenue_retention_pct",
        "bm25_rank": 1,
        "vec_rank": 1,
        "rrf_score": 0.03279
      },
      {
        "metric_name": "enterprise_gross_retention_pct",
        "bm25_rank": 2,
        "vec_rank": 3,
        "rrf_score": 0.032
      },
      {
        "metric_name": "expansion_mrr_net_usd",
        "bm25_rank": 5,
        "vec_rank": 2,
        "rrf_score": 0.03151
      }
    ],
    "rubricCriteria": [
      "Combina búsqueda léxica (BM25) y búsqueda vectorial (distancia coseno / HNSW) mediante Reciprocal Rank Fusion (`1 / (60 + rank)`).",
      "Utiliza `FULL OUTER JOIN` junto con `COALESCE` para puntuar correctamente documentos presentes en uno o en ambos índices.",
      "Prioriza los resultados con mayor `rrf_score` antes de inyectar las definiciones semánticas en el contexto del Servidor MCP."
    ]
  },
  "roleNotes": {
    "de": "Construye el Servidor MCP con credenciales de base de datos estrictamente `READ ONLY`, timeouts de 10 segundos y validación sintáctica AST mediante `SQLGlot` (bloqueando `DROP`, `GRANT`, `COPY` o tablas fuera de la lista blanca). Indexa los metadatos del catálogo, contratos ODCS y documentación en tablas **Lance / DuckDB** con índices híbridos BM25 + HNSW actualizados en cada despliegue de CI/CD.",
    "da": "Crea y mantiene el benchmark de **Golden Evals** estratificado por dificultad (agregaciones simples, comparativas temporales YoY, cohortes, casos ambiguos que requieren pedir aclaración). Programa herramientas MCP de verificación estadística para que el agente calcule intervalos de confianza y chequeos de Paradoja de Simpson antes de afirmar por qué subió o bajó un KPI.",
    "bi": "Enriquece cada métrica y dimensión en la Capa Semántica YAML con `description`, `synonyms` (ej. *\"facturación recurrente\", \"ARR mensual\", \"MRR\"*) y ejemplos de uso: **en 2026, documentar BI es programar el contexto del Agente IA**. Diseña experiencias de **GenBI Auditable**: cada respuesta del asistente IA en el portal incluye obligatoriamente el badge de la métrica oficial, el bloque SQL compilado desplegable y el enlace al dashboard certificado."
  },
  "summary": [
    "Pedir a un LLM que escriba JOINs sobre tablas crudas sin contexto semántico produce errores de grano y filtros.",
    "El protocolo MCP expone herramientas tipadas de solo lectura hacia el catálogo y la capa semántica.",
    "La recuperación híbrida (BM25 + vectores con fusión RRF) localiza tanto nombres exactos de columnas como conceptos.",
    "Un sistema de IA de datos se audita con un conjunto de preguntas y resultados de referencia antes de cada despliegue."
  ],
  "flashcards": [
    {
      "id": "fc-x4-mcp-01",
      "front": "¿Por qué es más fiable que un agente invoque `query_semantic_layer(metrics, dimensions)` en vez de generar SQL libre sobre tablas crudas?",
      "back": "Porque el motor semántico ya tiene codificadas las fórmulas auditadas, los filtros de exclusión y las pre-agregaciones contra fan-out."
    },
    {
      "id": "fc-x4-mcp-02",
      "front": "¿Por qué la búsqueda híbrida (BM25 + Embeddings con RRF) supera a la búsqueda vectorial pura al buscar metadatos de tablas?",
      "back": "Porque los embeddings capturan sinónimos conceptuales, pero BM25 es exacto para identificadores técnicos literales como `sku_id_v2` o códigos de error."
    },
    {
      "id": "fc-x4-mcp-03",
      "front": "¿Por qué una instrucción en el prompt del sistema (\"No leas la tabla de salarios\") NO es un control de seguridad válido?",
      "back": "Porque es vulnerable a inyección de prompts; la seguridad real exige credenciales de base de datos de solo lectura, RLS y vistas restringidas en el servidor."
    }
  ],
  "glossaryTerms": [
    "c28-mcp-semantic-rag-evals",
    "c21-semantic-layer"
  ],
  "sources": [
    {
      "title": "Model Context Protocol (MCP) Official Specification — Architecture, Resources, and Tools",
      "url": "https://modelcontextprotocol.io/specification/2025-03-26",
      "publisher": "Model Context Protocol Project",
      "accessed": "2026-10-29",
      "supports": "Arquitectura cliente-servidor MCP y exposición segura de herramientas tipadas hacia modelos."
    },
    {
      "title": "Cormack, Clarke & Buettcher (SIGIR 2009) — Reciprocal Rank Fusion Outperforms Condorcet and Individual Rank Learning Methods",
      "url": "https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf",
      "publisher": "ACM SIGIR",
      "accessed": "2026-10-29",
      "supports": "Fórmula de fusión de rankings RRF para combinar recuperadores léxicos y vectoriales."
    },
    {
      "title": "Yu et al. / Yale LILY Lab — Spider & BIRD Text-to-SQL Execution Accuracy Benchmarks",
      "url": "https://bird-bench.github.io/",
      "publisher": "HKU / DAMO Academy",
      "accessed": "2026-10-29",
      "supports": "Metodología de evaluación de agentes SQL mediante exactitud de ejecución frente a consultas de referencia."
    }
  ],
  "aiNotes": "Insiste en dos principios: un LLM nunca debe conectarse con permisos de escritura o sin capa semántica a tablas crudas, y el prompt del sistema no sustituye a los permisos del motor de base de datos.",
  "needsReview": true,
  "legacyId": "l18-mcp-semantic-ai-rag",
  "legacyOrder": 18,
  "stageId": "stage-6",
  "subtitle": "Conexión de agentes de lenguaje a métricas gobernadas, búsqueda léxico-vectorial y evaluación sistemática.",
  "goal": "Diseñar una arquitectura de Agentes de Datos en producción usando Model Context Protocol (MCP) conectado a la Capa Semántica, implementar búsqueda híbrida (BM25 + Vectores HNSW con Reciprocal Rank Fusion) sobre esquemas y documentos, aplicar guardrails de seguridad SQLGlot AST y certificar la precisión con un conjunto de Golden Evals.",
  "pipelineChallenge": {
    "title": "Arquitectura Agente IA + Datos 2026: De la Pregunta en Lenguaje Natural al KPI Certificado",
    "scenario": "Ordena el flujo de ejecución seguro cuando un directivo o analista realiza una pregunta de negocio al Agente conectado por Model Context Protocol (MCP).",
    "steps": [
      {
        "id": "mcp-1",
        "label": "1. Recuperación de Contexto con Búsqueda Híbrida (BM25 + HNSW + RRF) vía MCP",
        "role": "DE",
        "detail": "El servidor MCP busca en el catálogo de métricas y contratos ODCS los términos exactos y sinónimos semánticos sin saturar la ventana de contexto."
      },
      {
        "id": "mcp-2",
        "label": "2. Resolución Semántica de Métricas, Dimensiones y Filtros Certificados",
        "role": "BI",
        "detail": "El agente selecciona la métrica gobernada (`net_revenue_retention_pct`) en la Capa Semántica en lugar de adivinar joins sobre tablas crudas."
      },
      {
        "id": "mcp-3",
        "label": "3. Compilación Determinista y Guardrail de Seguridad AST (SQLGlot + RLS)",
        "role": "DE",
        "detail": "El servidor compila el SQL, verifica con SQLGlot que sea estrictamente `SELECT` sin acceso a columnas PII y aplica los permisos del usuario."
      },
      {
        "id": "mcp-4",
        "label": "4. Ejecución sobre Snapshot Reproducible (Iceberg v3) y Chequeo Estadístico",
        "role": "DA",
        "detail": "La consulta corre sobre el Lakehouse devolviendo el resultado exacto junto con el ID de Snapshot y validaciones de tamaño muestral."
      },
      {
        "id": "mcp-5",
        "label": "5. Respuesta Auditable con Linaje y Validación Continua contra Golden Evals",
        "role": "BI",
        "detail": "El usuario recibe el KPI exacto con el código SQL transparente y el sistema registra la traza para el benchmark de Golden Evals."
      }
    ],
    "explanation": "Al combinar Búsqueda Híbrida RRF, Capa Semántica, validación AST con SQLGlot y Golden Evals sobre snapshots de Iceberg v3, transformas un LLM probabilístico en un sistema analítico determinista, seguro y 100% auditable."
  },
  "relatedLessons": [
    {
      "id": "l12-contracts-semantic-layer",
      "reason": "La Capa Semántica y los Data Contracts de la Etapa 4 son el cimiento que impide que el Agente MCP alucine métricas."
    },
    {
      "id": "l14-ab-testing-cuped",
      "reason": "Aplica el mismo rigor estadístico de la Etapa 5 para evaluar cambios en tu agente mediante Golden Evals."
    }
  ]
};

export default lesson;
