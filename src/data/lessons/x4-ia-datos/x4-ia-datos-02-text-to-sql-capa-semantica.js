export const lesson = {
  "id": "x4-ia-datos-02-text-to-sql-capa-semantica",
  "moduleId": "x4-ia-datos",
  "tracks": [
    "core",
    "de",
    "da",
    "bi"
  ],
  "order": 2,
  "contentVersion": 2,
  "title": "Text-to-SQL directo frente a la capa semántica gobernada",
  "subtitle": "Por qué falla el text-to-SQL directo sobre tablas crudas y cómo lo resuelve la capa semántica",
  "level": 4,
  "minutes": 25,
  "prerequisites": [
    "x4-ia-datos-01-mcp-semantic-ai-rag"
  ],
  "hook": "Un analista pide a un agente Text-to-SQL comparar el ingreso bruto de productos y las devoluciones procesadas por tipo de tienda en Mercado Brisa. El modelo genera una única sentencia SELECT que une orders, order_items y refunds por order_id. El motor ejecuta la consulta en milisegundos, pero reporta 798,930.91 USD en devoluciones cuando el total real procesado es de 321,097.25 USD. ¿Por qué fallan sistemáticamente los modelos al unir múltiples tablas de hechos y cómo compila una capa semántica el SQL libre de inflación?",
  "objectives": [
    "Diagnosticar las cuatro causas de fallo del Text-to-SQL directo en esquemas reales: trampas de abismo (chasm traps), amnesia temporal en SCD Tipo 2, promedios de razones y omisión de filtros de higiene.",
    "Modelar entidades, dimensiones, medidas atómicas y métricas de razón dentro de una arquitectura de capa semántica estilo MetricFlow o Cube.",
    "Refactorizar consultas generadas con fan-out 1:N en CTEs pre-agregadas al grano de la entidad antes de realizar el cruce dimensional."
  ],
  "sections": [
    {
      "id": "anatomia-fallo-text-to-sql",
      "heading": "Trampas de abismo y fan-out en Text-to-SQL sobre tablas crudas",
      "body": "Los benchmarks como **BIRD** y **Spider** prueban que el Text-to-SQL directo falla frente a bases con múltiples hechos. El modelo predice secuencias de `JOIN` usando nombres de claves foráneas. Sin embargo, no verifica la cardinalidad real de cada relación.\n\nEl fallo más grave es la **trampa de abismo** (*chasm trap*). En Mercado Brisa, una orden en `orders` tiene relación `1:N` con sus líneas en `order_items`. A la vez, mantiene otra relación `1:N` con sus devoluciones en `refunds`. Cuando un agente une ambas tablas en el mismo `FROM`, crea un producto cartesiano parcial por orden.\n\nSi una orden tiene tres líneas de productos y un reembolso de 100 USD, la devolución se triplica. En todo el almacén de Mercado Brisa, ese `JOIN` plano infla los reembolsos procesados desde 321,097.25 USD hasta 798,930.91 USD. Esto introduce un error contable de 477,833.66 USD sin lanzar ningún error de sintaxis.",
      "interactive": {
        "component": "semantic-contract",
        "caption": "Compilación de medidas atómicas en CTEs separadas para prevenir el fan-out entre order_items y refunds."
      },
      "example": {
        "language": "sql",
        "code": "WITH naive_join AS (\n  SELECT ROUND(SUM(r.refund_amount_usd), 2) AS inflated_refunds_usd\n  FROM orders o\n  JOIN order_items oi ON o.order_id = oi.order_id\n  JOIN refunds r ON o.order_id = r.order_id\n  WHERE r.status = 'processed'\n),\nsemantic_preagg AS (\n  SELECT ROUND(SUM(r.refund_amount_usd), 2) AS true_refunds_usd\n  FROM orders o\n  JOIN (\n    SELECT order_id, SUM(refund_amount_usd) AS refund_amount_usd\n    FROM refunds\n    WHERE status = 'processed'\n    GROUP BY order_id\n  ) r ON o.order_id = r.order_id\n)\nSELECT\n  n.inflated_refunds_usd,\n  s.true_refunds_usd,\n  ROUND(n.inflated_refunds_usd - s.true_refunds_usd, 2) AS fanout_error_usd\nFROM naive_join n\nCROSS JOIN semantic_preagg s;",
        "expectedOutput": [
          {
            "inflated_refunds_usd": 798930.91,
            "true_refunds_usd": 321097.25,
            "fanout_error_usd": 477833.66
          }
        ]
      }
    },
    {
      "id": "compilacion-semantica-metricflow-cube",
      "heading": "Amnesia temporal SCD2 y compilación en la capa semántica",
      "body": "El segundo modo de fallo ocurre sobre dimensiones lentamente cambiantes (**SCD Tipo 2**). En Mercado Brisa, la tabla `customer_changes` guarda el historial de niveles con ventanas `valid_from`, `valid_to` e `is_current`. Un agente Text-to-SQL directo une `orders` con `customer_changes` usando solo `customer_id`. Eso multiplica las 14,760 órdenes completadas hasta 25,271 filas e infla las ventas en 4,370,549.52 USD.\n\nLos motores de **capa semántica** como **MetricFlow** y **Cube** corrigen esto declarando cuatro objetos en su grafo. Definen `entities` para claves primarias y foráneas, y `dimensions` para atributos de corte con reglas de vigencia. Además, declaran `measures` atadas a una sola tabla física y `metrics` para fórmulas de razón.\n\nCuando un servidor MCP pide ingresos y tasa de reembolso por nivel actual, el compilador evita el `JOIN` plano. Primero agrupa cada medida atómica en su propia CTE al grano de `order_id` excluyendo `SKU-TEST-NEG`. Luego une las dimensiones con `is_current = true` y divide las sumas agregadas.",
      "example": {
        "language": "sql",
        "code": "WITH unguarded_scd2 AS (\n  SELECT\n    COUNT(*) AS raw_joined_orders,\n    ROUND(SUM(o.total_usd), 2) AS inflated_total_usd\n  FROM orders o\n  JOIN customer_changes cc ON o.customer_id = cc.customer_id\n  WHERE o.status = 'completed'\n),\ngoverned_scd2 AS (\n  SELECT\n    COUNT(*) AS true_completed_orders,\n    ROUND(SUM(o.total_usd), 2) AS true_total_usd\n  FROM orders o\n  JOIN customer_changes cc\n    ON o.customer_id = cc.customer_id\n   AND cc.is_current = true\n  WHERE o.status = 'completed'\n)\nSELECT\n  u.raw_joined_orders,\n  g.true_completed_orders,\n  u.inflated_total_usd,\n  g.true_total_usd,\n  ROUND(u.inflated_total_usd - g.true_total_usd, 2) AS scd2_duplication_usd\nFROM unguarded_scd2 u\nCROSS JOIN governed_scd2 g;",
        "expectedOutput": [
          {
            "raw_joined_orders": 25271,
            "true_completed_orders": 14760,
            "inflated_total_usd": 10640011.94,
            "true_total_usd": 6269462.42,
            "scd2_duplication_usd": 4370549.52
          }
        ]
      }
    }
  ],
  "workedExample": {
    "title": "Compilación semántica por nivel vigente de cliente (SCD Tipo 2)",
    "description": "El servidor MCP recibe una petición para consultar las métricas `valid_orders`, `gross_revenue_usd`, `refunded_usd` y `refund_rate_pct` desglosadas por el nivel vigente del cliente (`cc.tier` en `customer_changes` con `is_current = true`) para órdenes pagadas (`o.status IN ('completed', 'refunded')`). Simula paso a paso el SQL que compila el motor semántico.",
    "audit": "Pre-agregar cada tabla de hechos al grano de su entidad común convierte uniones muchos-a-muchos peligrosas en uniones uno-a-uno deterministas.",
    "steps": [
      {
        "label": "Paso 1: Aislar la medida de ingresos de líneas al grano de order_id",
        "explanation": "El compilador semántico aísla primero la medida `gross_order_usd` sobre `order_items` y `products`, excluyendo el SKU centinela `SKU-TEST-NEG` y agregando estrictamente al grano de la entidad `order_id`.",
        "code": "SELECT\n  oi.order_id,\n  ROUND(SUM(oi.line_total_usd), 2) AS gross_order_usd\nFROM order_items oi\nJOIN products p ON oi.product_id = p.product_id\nWHERE p.sku <> 'SKU-TEST-NEG'\nGROUP BY oi.order_id\nORDER BY oi.order_id\nLIMIT 3;",
        "expectedOutput": [
          {
            "order_id": 10001,
            "gross_order_usd": 33.74
          },
          {
            "order_id": 10002,
            "gross_order_usd": 45.75
          },
          {
            "order_id": 10003,
            "gross_order_usd": 413.07
          }
        ]
      },
      {
        "label": "Paso 2: Aislar la medida de reembolsos al grano de order_id",
        "explanation": "En paralelo, el compilador genera una segunda CTE independiente para la medida `refunded_order_usd` sobre la tabla `refunds` (`status = 'processed'`), agrupada también por la clave de entidad `order_id`.",
        "code": "SELECT\n  order_id,\n  ROUND(SUM(refund_amount_usd), 2) AS refunded_order_usd\nFROM refunds\nWHERE status = 'processed'\nGROUP BY order_id\nORDER BY order_id\nLIMIT 3;",
        "expectedOutput": [
          {
            "order_id": 10001,
            "refunded_order_usd": 23.49
          },
          {
            "order_id": 10016,
            "refunded_order_usd": 127.15
          },
          {
            "order_id": 10031,
            "refunded_order_usd": 314.83
          }
        ]
      },
      {
        "label": "Paso 3: Cruzar con la dimensión SCD2 vigente y evaluar la razón",
        "explanation": "Ambas CTEs tienen ahora cardinalidad máxima `1:1` respecto a `orders`. El compilador las une con `orders` y con la dimensión vigente `customer_changes` (`cc.is_current = true`), calculando la métrica de razón `refund_rate_pct` al nivel de `cc.tier`.",
        "code": "WITH items_by_order AS (\n  SELECT\n    oi.order_id,\n    SUM(oi.line_total_usd) AS gross_order_usd\n  FROM order_items oi\n  JOIN products p ON oi.product_id = p.product_id\n  WHERE p.sku <> 'SKU-TEST-NEG'\n  GROUP BY oi.order_id\n),\nrefunds_by_order AS (\n  SELECT\n    order_id,\n    SUM(refund_amount_usd) AS refunded_order_usd\n  FROM refunds\n  WHERE status = 'processed'\n  GROUP BY order_id\n)\nSELECT\n  cc.tier,\n  COUNT(o.order_id) AS valid_orders,\n  ROUND(SUM(i.gross_order_usd), 2) AS gross_revenue_usd,\n  ROUND(COALESCE(SUM(r.refunded_order_usd), 0), 2) AS refunded_usd,\n  ROUND(100.0 * COALESCE(SUM(r.refunded_order_usd), 0) / NULLIF(SUM(i.gross_order_usd), 0), 2) AS refund_rate_pct\nFROM orders o\nJOIN items_by_order i ON o.order_id = i.order_id\nLEFT JOIN refunds_by_order r ON o.order_id = r.order_id\nJOIN customer_changes cc ON o.customer_id = cc.customer_id AND cc.is_current = true\nWHERE o.status IN ('completed', 'refunded')\nGROUP BY cc.tier\nORDER BY gross_revenue_usd DESC;",
        "expectedOutput": [
          {
            "tier": "oro",
            "valid_orders": 7100,
            "gross_revenue_usd": 2781327.92,
            "refunded_usd": 119553.6,
            "refund_rate_pct": 4.3
          },
          {
            "tier": "plata",
            "valid_orders": 5081,
            "gross_revenue_usd": 1788538.73,
            "refunded_usd": 93575.42,
            "refund_rate_pct": 5.23
          },
          {
            "tier": "bronce",
            "valid_orders": 2467,
            "gross_revenue_usd": 860472.25,
            "refunded_usd": 35381.05,
            "refund_rate_pct": 4.11
          },
          {
            "tier": "platino",
            "valid_orders": 1552,
            "gross_revenue_usd": 560890.88,
            "refunded_usd": 26024.45,
            "refund_rate_pct": 4.64
          }
        ]
      }
    ]
  },
  "checks": [
    {
      "id": "chk-x4-02-chasm-trap",
      "type": "mcq",
      "prompt": "¿Por qué se produce una trampa de abismo (chasm trap) cuando un agente Text-to-SQL une `orders`, `order_items` y `refunds` en una sola cláusula `FROM` sin subconsultas ni CTEs?",
      "options": [
        {
          "id": "a",
          "text": "Porque DuckDB no soporta más de dos cláusulas JOIN en una misma consulta analítica.",
          "correct": false,
          "feedback": "Incorrecto. DuckDB soporta decenas de uniones; el defecto es matemático por la cardinalidad 1:N de ambas tablas."
        },
        {
          "id": "b",
          "text": "Porque tanto order_items como refunds tienen relación 1:N con orders, creando un producto cartesiano parcial por cada orden que multiplica los importes.",
          "correct": true,
          "feedback": "Correcto. Al cruzar dos tablas hijas 1:N a través de la misma clave order_id, las filas se multiplican entre sí."
        },
        {
          "id": "c",
          "text": "Porque la clave primaria order_id cambia de tipo de dato entre orders y refunds.",
          "correct": false,
          "feedback": "Incorrecto. En todas las tablas de Mercado Brisa la columna order_id es de tipo INTEGER."
        },
        {
          "id": "d",
          "text": "Porque LEFT JOIN convierte automáticamente los valores numéricos en NULL.",
          "correct": false,
          "feedback": "Incorrecto. LEFT JOIN preserva las filas de la izquierda y solo asigna NULL cuando no existe coincidencia en la derecha."
        }
      ],
      "explanation": "Al colisionar dos relaciones 1:N independientes sobre la misma orden, cada devolución se repite tantas veces como líneas de artículos tenga el pedido y viceversa."
    },
    {
      "id": "chk-x4-02-scd2-bug",
      "type": "mcq",
      "prompt": "Un agente genera `SELECT cc.segment, SUM(o.total_usd) FROM orders o JOIN customer_changes cc ON o.customer_id = cc.customer_id WHERE o.status = 'completed' GROUP BY 1`. ¿Por qué esta consulta duplica 4.37 millones USD en Mercado Brisa?",
      "options": [
        {
          "id": "a",
          "text": "Porque omite el predicado de vigencia SCD Tipo 2 (`cc.is_current = true` o el rango temporal `valid_from` / `valid_to`), uniendo cada orden con todas las versiones históricas del cliente.",
          "correct": true,
          "feedback": "Correcto. Sin filtrar la fila vigente o la ventana temporal de la orden, cada cambio histórico del cliente duplica sus pedidos."
        },
        {
          "id": "b",
          "text": "Porque la columna `total_usd` está expresada en centavos y debe dividirse entre cien.",
          "correct": false,
          "feedback": "Incorrecto. La columna total_usd ya está expresada en dólares con decimales."
        },
        {
          "id": "c",
          "text": "Porque `customer_changes` contiene un registro por cada clic web de la tabla `events`.",
          "correct": false,
          "feedback": "Incorrecto. customer_changes registra transiciones de segmento y nivel (tier), no eventos de clic."
        },
        {
          "id": "d",
          "text": "Porque falta agrupar por `o.order_id` en la cláusula GROUP BY.",
          "correct": false,
          "feedback": "Incorrecto. El reporte busca agregar por segmento; el error radica en la condición incompleta del JOIN."
        }
      ],
      "explanation": "En una dimensión SCD Tipo 2 como customer_changes, un cliente con cambios históricos posee múltiples filas; unir solo por customer_id multiplica todas sus órdenes."
    },
    {
      "id": "chk-x4-02-ratio-metric",
      "type": "predict-output",
      "prompt": "En MetricFlow o Cube, si defines la métrica de razón `refund_rate` a partir de las medidas `refunded_usd` y `gross_revenue_usd`, ¿cómo la compila el motor al agrupar por `store_type`?",
      "options": [
        {
          "id": "a",
          "text": "Calcula el porcentaje orden por orden y luego aplica `AVG(order_refund_rate)` por tienda.",
          "correct": false,
          "feedback": "Incorrecto. Promediar razones individuales ignora el peso monetario de cada orden y distorsiona la tasa real."
        },
        {
          "id": "b",
          "text": "Calcula `SUM(refunded_usd) / NULLIF(SUM(gross_revenue_usd), 0)` después de agregar ambas medidas al nivel de `store_type`.",
          "correct": true,
          "feedback": "Correcto. El compilador semántico agrega primero numerador y denominador por separado y divide al final."
        },
        {
          "id": "c",
          "text": "Resta ambas columnas y divide entre el número de tiendas físicas.",
          "correct": false,
          "feedback": "Incorrecto. Esa operación calcularía una diferencia media por tienda, no una tasa porcentual de devolución."
        },
        {
          "id": "d",
          "text": "Ejecuta un `CROSS JOIN` entre todas las tiendas y todos los reembolsos.",
          "correct": false,
          "feedback": "Incorrecto. Un CROSS JOIN destruiría la atribución de cada orden a su tienda correspondiente."
        }
      ],
      "explanation": "Las métricas no aditivas de razón deben evaluarse siempre como razón de las sumas en el grano de agrupación consultado, nunca como el promedio de las razones individuales."
    },
    {
      "id": "chk-x4-02-order-compilation",
      "type": "order",
      "prompt": "Ordena las 4 fases que ejecuta el compilador de una capa semántica al traducir una solicitud de métricas multi-hecho a SQL:",
      "items": [
        "Identificar las medidas atómicas requeridas y la entidad base (order_id) de cada tabla de hechos.",
        "Generar una CTE independiente por cada tabla de hechos aplicando filtros de higiene y agrupando por la clave de entidad.",
        "Unir las CTEs pre-agregadas (relación 1:1) con la tabla puente y las dimensiones vigentes.",
        "Agrupar por los atributos dimensionales solicitados y calcular las métricas derivadas o de razón finales."
      ],
      "correctOrder": [
        "Identificar las medidas atómicas requeridas y la entidad base (order_id) de cada tabla de hechos.",
        "Generar una CTE independiente por cada tabla de hechos aplicando filtros de higiene y agrupando por la clave de entidad.",
        "Unir las CTEs pre-agregadas (relación 1:1) con la tabla puente y las dimensiones vigentes.",
        "Agrupar por los atributos dimensionales solicitados y calcular las métricas derivadas o de razón finales."
      ],
      "explanation": "El compilador semántico primero resuelve el grano de cada medida en CTEs aisladas, luego cruza en cardinalidad 1:1 con las dimensiones y al final aplica las fórmulas derivadas."
    }
  ],
  "practice": {
    "type": "sql",
    "title": "Eliminación de chasm trap mediante compilación de capa semántica",
    "language": "sql",
    "prompt": "Refactoriza la consulta rota de Text-to-SQL directo utilizando el patrón de compilación de capa semántica para calcular el desempeño por `store_type` (`stores`) sobre órdenes válidas (`o.status IN ('completed', 'refunded')`). Crea dos CTEs al grano de `order_id`: `items_by_order` (sumando `oi.line_total_usd` como `gross_order_usd` y filtrando `p.sku <> 'SKU-TEST-NEG'`) y `refunds_by_order` (sumando `refund_amount_usd` como `refunded_order_usd` donde `status = 'processed'`). Únelas con `orders` y `stores` para devolver `store_type`, `valid_orders` (`COUNT(o.order_id)`), `gross_item_revenue_usd`, `refunded_usd` y `net_item_revenue_usd` (`gross_item_revenue_usd - refunded_usd`), redondeados a 2 decimales y ordenados por `net_item_revenue_usd DESC`.",
    "starterCode": "-- Consulta rota generada por un LLM sin capa semántica (sufre de chasm trap):\n-- Refactorízala usando las CTEs items_by_order y refunds_by_order al grano de order_id.\nSELECT\n  s.store_type,\n  COUNT(DISTINCT o.order_id) AS valid_orders,\n  ROUND(SUM(oi.line_total_usd), 2) AS gross_item_revenue_usd,\n  ROUND(COALESCE(SUM(r.refund_amount_usd), 0), 2) AS refunded_usd,\n  ROUND(SUM(oi.line_total_usd) - COALESCE(SUM(r.refund_amount_usd), 0), 2) AS net_item_revenue_usd\nFROM orders o\nJOIN stores s ON o.store_id = s.store_id\nJOIN order_items oi ON o.order_id = oi.order_id\nJOIN products p ON oi.product_id = p.product_id\nLEFT JOIN refunds r ON o.order_id = r.order_id AND r.status = 'processed'\nWHERE o.status IN ('completed', 'refunded')\n  AND p.sku <> 'SKU-TEST-NEG'\nGROUP BY s.store_type\nORDER BY net_item_revenue_usd DESC;",
    "solution": "WITH items_by_order AS (\n  SELECT\n    oi.order_id,\n    SUM(oi.line_total_usd) AS gross_order_usd\n  FROM order_items oi\n  JOIN products p ON oi.product_id = p.product_id\n  WHERE p.sku <> 'SKU-TEST-NEG'\n  GROUP BY oi.order_id\n),\nrefunds_by_order AS (\n  SELECT\n    order_id,\n    SUM(refund_amount_usd) AS refunded_order_usd\n  FROM refunds\n  WHERE status = 'processed'\n  GROUP BY order_id\n)\nSELECT\n  s.store_type,\n  COUNT(o.order_id) AS valid_orders,\n  ROUND(SUM(i.gross_order_usd), 2) AS gross_item_revenue_usd,\n  ROUND(COALESCE(SUM(r.refunded_order_usd), 0), 2) AS refunded_usd,\n  ROUND(SUM(i.gross_order_usd) - COALESCE(SUM(r.refunded_order_usd), 0), 2) AS net_item_revenue_usd\nFROM orders o\nJOIN stores s ON o.store_id = s.store_id\nJOIN items_by_order i ON o.order_id = i.order_id\nLEFT JOIN refunds_by_order r ON o.order_id = r.order_id\nWHERE o.status IN ('completed', 'refunded')\nGROUP BY s.store_type\nORDER BY net_item_revenue_usd DESC;",
    "solutionExplanation": "Al separar order_items y refunds en dos CTEs pre-agregadas al grano de order_id (items_by_order y refunds_by_order), eliminamos el producto cartesiano parcial entre líneas y devoluciones y obtenemos el ingreso neto exacto por tipo de tienda.",
    "expectedOutputTable": [
      {
        "store_type": "retail",
        "valid_orders": 9229,
        "gross_item_revenue_usd": 3326051.39,
        "refunded_usd": 123960.63,
        "net_item_revenue_usd": 3202090.76
      },
      {
        "store_type": "warehouse",
        "valid_orders": 2880,
        "gross_item_revenue_usd": 1329817.88,
        "refunded_usd": 13396.57,
        "net_item_revenue_usd": 1316421.31
      },
      {
        "store_type": "flagship",
        "valid_orders": 4091,
        "gross_item_revenue_usd": 1335360.51,
        "refunded_usd": 137177.32,
        "net_item_revenue_usd": 1198183.19
      }
    ],
    "orderMatters": true,
    "hints": [
      "En el código inicial, unir order_items y refunds directamente multiplica tanto las líneas como los reembolsos. Separa ambos cálculos en dos bloques WITH agrupados por order_id.",
      "En la CTE items_by_order une order_items con products filtrando p.sku <> 'SKU-TEST-NEG' y agrupa por oi.order_id. En refunds_by_order filtra status = 'processed' y agrupa por order_id.",
      "En el SELECT principal, une orders con stores, haz JOIN con items_by_order y LEFT JOIN con refunds_by_order usando COALESCE(SUM(r.refunded_order_usd), 0)."
    ]
  },
  "roleNotes": {
    "de": "Como Ingeniero de Datos, configuras los modelos semánticos en dbt MetricFlow o Cube declarando las claves primarias y foráneas (entities) para que el compilador pueda aislar cada tabla de hechos en su propia CTE.",
    "da": "Como Analista de Datos, defines qué medidas son aditivas y cuáles requieren métricas derivadas o de razón, además de especificar los filtros obligatorios como la exclusión de SKU-TEST-NEG.",
    "bi": "Como especialista en BI, reemplazas las medidas calculadas ad-hoc en cada herramienta visual por llamadas a la capa semántica, eliminando discrepancias entre reportes de tienda y chats de IA."
  },
  "summary": [
    "El Text-to-SQL directo falla en esquemas reales al provocar chasm traps entre tablas de hechos y omitir la vigencia SCD Tipo 2.",
    "Unir order_items y refunds sin pre-agregar infla las devoluciones de Mercado Brisa en 477,833.66 USD por producto cartesiano parcial.",
    "La capa semántica declara entidades, dimensiones, medidas atómicas y métricas derivadas o de razón en un grafo formal.",
    "El compilador semántico agrupa cada hecho en una CTE al grano de su entidad antes de cruzar dimensiones y evaluar razones."
  ],
  "flashcards": [
    {
      "id": "fc-x4-02-1",
      "front": "¿Qué es una trampa de abismo (chasm trap) en una consulta generada por un agente Text-to-SQL?",
      "back": "Es la multiplicación de filas e importes que ocurre al unir dos tablas con relación 1:N (como order_items y refunds) a una misma tabla puente (orders) sin pre-agregarlas."
    },
    {
      "id": "fc-x4-02-2",
      "front": "¿Cómo resuelve un compilador semántico como MetricFlow o Cube la unión de múltiples tablas de hechos?",
      "back": "Pre-agrega cada medida atómica en su propia CTE al grano de la entidad compartida (por ejemplo, order_id) antes de realizar una unión 1:1 con las dimensiones."
    },
    {
      "id": "fc-x4-02-3",
      "front": "¿Qué error ocurre al unir orders con customer_changes únicamente por customer_id en Mercado Brisa?",
      "back": "Se cruza cada pedido con todas las versiones históricas del cliente en la dimensión SCD Tipo 2, duplicando las órdenes completadas de 14,760 a 25,271 filas."
    },
    {
      "id": "fc-x4-02-4",
      "front": "¿Cómo debe calcularse una métrica de razón (ratio metric) al agrupar por una dimensión?",
      "back": "Dividiendo la suma agregada del numerador entre la suma agregada del denominador en ese nivel de agrupación, nunca promediando razones individuales."
    }
  ],
  "glossaryTerms": [
    "chasm-trap-semantic",
    "semantic-query-compilation",
    "text-to-sql-hallucination",
    "c21-semantic-layer",
    "c01-grain-fanout",
    "c07-scd-type-2"
  ],
  "sources": [
    {
      "title": "dbt Semantic Layer & MetricFlow Documentation",
      "url": "https://docs.getdbt.com/docs/use-dbt-semantic-layer/dbt-sl",
      "publisher": "dbt Labs",
      "accessed": "2026-10-29",
      "supports": "Arquitectura de modelos semánticos, entidades, dimensiones, medidas y compilación determinista de métricas."
    },
    {
      "title": "Cube Documentation — Data Modeling Overview",
      "url": "https://docs.cube.dev/docs/data-modeling/overview",
      "publisher": "Cube Dev",
      "accessed": "2026-10-29",
      "supports": "Prevención de chasm traps y fan-out al agregar medidas con cardinalidad uno a muchos."
    },
    {
      "title": "BIRD: Big Bench for Large-Scale Database Grounded Text-to-SQL Evaluation",
      "url": "https://bird-bench.github.io/",
      "publisher": "HKU Data Lab / DAMO Academy",
      "accessed": "2026-10-29",
      "supports": "Análisis empírico de errores de Text-to-SQL ante valores anómalos, joins complejos y lógica de dominio."
    },
    {
      "title": "Spider: Complex and Cross-Domain Semantic Parsing and Text-to-SQL Benchmark",
      "url": "https://yale-lily.github.io/spider",
      "publisher": "Yale LILY Lab",
      "accessed": "2026-10-29",
      "supports": "Taxonomía de fallos estructurales en generación de consultas SQL multi-tabla."
    }
  ],
  "aiNotes": "Cuando el estudiante trabaje en la práctica o pregunte por qué el starterCode da números inflados, muéstrale con claridad cómo una orden con varias líneas en order_items multiplica el monto de refunds cuando ambas se unen en el mismo FROM. Guíalo para construir dos CTEs separadas (items_by_order y refunds_by_order) agrupadas por order_id.",
  "needsReview": false
};

export default lesson;
