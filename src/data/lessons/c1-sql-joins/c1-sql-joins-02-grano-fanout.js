// Lección migrada al esquema v2 mediante scripts/migrate-legacy.mjs
const lesson = {
  "id": "c1-sql-joins-02-grano-fanout",
  "moduleId": "c1-sql-joins",
  "tracks": [
    "core"
  ],
  "level": 1,
  "order": 2,
  "title": "Grano de una tabla y fan-out en JOINs",
  "minutes": 25,
  "prerequisites": [
    "c1-sql-joins-01"
  ],
  "contentVersion": 1,
  "hook": "En Mercado Brisa (empresa ficticia), tenemos dos tablas: `orders` (una fila por pedido, con el costo de envío `shipping_fee_usd` y el total `order_total_usd`) y `order_items` (una fila por cada producto dentro del pedido). Un analista las une con un `JOIN` directo para su reporte mensual y anuncia que los ingresos por envío subieron un 142 %. Al contrastar con contabilidad, ese dinero no existe en el banco. ¿Qué ocurrió dentro del motor SQL al cruzar ambas tablas?",
  "objectives": [
    "Identificar el grano de una tabla verificando su clave primaria real con COUNT(*) y COUNT(DISTINCT).",
    "Detectar cuándo un JOIN uno-a-muchos o muchos-a-muchos multiplica filas y distorsiona sumas y promedios.",
    "Pre-agregar tablas de detalle en CTEs al mismo grano antes de unirlas con tablas de cabecera."
  ],
  "sections": [
    {
      "id": "que-es-el-grano-de-una-tabla-y-por-que-define-su",
      "heading": "Qué es el grano de una tabla y por qué define su contrato",
      "body": "Antes de escribir una sola línea de SQL o arrastrar una métrica en una herramienta de BI, debes formular y responder una pregunta innegociable: \"¿Qué representa exactamente una fila física en esta tabla?\". Eso es la granularidad (o grain) y equivale a su clave primaria real.\nEn la tabla `orders`, una fila es un pedido único (`order_id`). En `order_items`, una fila es una línea de producto dentro de un pedido (`order_id + product_id`). Cuando cruzas tablas sin declarar mentalmente el grain de entrada y el grain de salida esperado, pierdes el control matemático de tus agregaciones.",
      "interactive": {
        "component": "join-fanout-visualizer",
        "caption": "Simulador interactivo: Grano de una tabla y fan-out en JOINs"
      }
    },
    {
      "id": "anatomia-del-fan-out-1-n-y-del-chasm-trap-n-1-m",
      "heading": "Anatomía del fan-out (1:N) y del chasm trap (N:1:M)",
      "body": "El Fan-Out ocurre cuando haces un `JOIN` entre una tabla de granularidad gruesa (`orders`: 1 fila por pedido) y una tabla de granularidad fina (`order_items`: 3 productos para ese mismo pedido). El motor relacional repite las columnas de la cabecera (`orders`) 3 veces en la tabla intermedia en memoria. Si luego ejecutas `SUM(orders.order_total_usd)`, sumarás el mismo pedido tres veces.\nPeor aún es el Chasm Trap (abismo N:1:M): imagina unir `orders` con `order_items` (3 ítems) y al mismo tiempo con `order_payments` (2 intentos de pago con tarjeta dividida). El producto cartesiano por pedido genera 3 × 2 = 6 filas por pedido, multiplicando tanto las unidades vendidas como el dinero cobrado.",
      "example": {
        "language": "sql",
        "code": "-- CORRECTO: Pre-agregar primero order_items al mismo grain (order_id) que orders\nWITH items_por_pedido AS (\n  SELECT\n    order_id,\n    SUM(quantity) AS unidades_pedido,\n    COUNT(DISTINCT product_id) AS skus_distintos\n  FROM order_items\n  GROUP BY order_id\n)\nSELECT\n  COUNT(o.order_id) AS pedidos_reales,\n  SUM(o.order_total_usd) AS ingresos_reales_usd,\n  SUM(COALESCE(i.unidades_pedido, 0)) AS unidades_vendidas\nFROM orders o\nLEFT JOIN items_por_pedido i ON o.order_id = i.order_id;",
        "expectedOutput": [
          {
            "pedidos_reales": 2,
            "ingresos_reales_usd": "$350.00 (100% Exacto)",
            "unidades_vendidas": 6
          }
        ]
      }
    },
    {
      "id": "tres-estrategias-tecnicas-para-evitar-el-fan-out",
      "heading": "Tres estrategias técnicas para evitar el fan-out",
      "body": "1) Pre-agregación en CTEs: Agrupa cada tabla hija (`order_items`, `order_payments`) a nivel de `order_id` en su propia CTE antes de hacer el `LEFT JOIN` contra `orders`. Así garantizas una relación estricta `1:1`.\n2) Prorrateo (Allocation) en Ingeniería de Datos: En la capa Silver/Gold, distribuye los montos de cabecera (descuentos globales, costo de envío) proporcionalmente al peso de cada línea de ítem para que la tabla detallada sea 100% aditiva.\n3) Agregación simétrica en la Capa Semántica: Declara entidades primarias y foráneas en herramientas como MetricFlow o Cube para que el motor genere subconsultas pre-agregadas automáticamente."
    },
    {
      "id": "auditoria-defensiva-como-detectar-un-fan-out-ant",
      "heading": "Auditoría defensiva: cómo detectar un fan-out antes de publicar",
      "body": "Nunca confíes en una consulta compleja sin verificar su invariante de cardinalidad. Antes y después de tus JOINs, compara `COUNT(*)` contra `COUNT(DISTINCT order_id)` y verifica que la suma de la métrica maestra (`SUM(order_total_usd)`) en tu consulta coincida al centavo con el `SUM(order_total_usd)` de la tabla `orders` aislada. En Mercado Brisa (empresa ficticia), esta auditoría se ejecuta como prueba automática antes de publicar cualquier tabla agregada: si la suma de `order_total_usd` tras el cruce difiere en más de 0.01 USD respecto a la tabla `orders` de origen, la ejecución se detiene y alerta al responsable del modelo para corregir la pre-agregación."
    }
  ],
  "workedExample": {
    "title": "Ejemplo guiado: Grano de una tabla y fan-out en JOINs",
    "description": "Compara la consulta ingenua (que duplica importes de cabecera por cada ítem del pedido) contra la arquitectura con CTE pre-agregada:",
    "audit": "",
    "steps": [
      {
        "label": "Antipatrón: JOIN directo 1:N que infla ingresos un 142%",
        "explanation": "Compara la consulta ingenua (que duplica importes de cabecera por cada ítem del pedido) contra la arquitectura con CTE pre-agregada:",
        "code": "-- ERROR COMÚN: Unir cabecera (orders) con detalle (order_items) y sumar la cabecera\nSELECT\n  COUNT(o.order_id) AS pedidos_contados,\n  SUM(o.order_total_usd) AS ingresos_cabecera_inflados,\n  SUM(i.quantity) AS unidades_vendidas\nFROM orders o\nJOIN order_items i ON o.order_id = i.order_id;",
        "expectedOutput": [
          {
            "pedidos_contados": 4,
            "ingresos_cabecera_inflados": "$850.00 (Falso. Real: $350.00)",
            "unidades_vendidas": 6
          }
        ]
      },
      {
        "label": "Solución óptima: CTE pre-agregada al mismo grano (order_id)",
        "explanation": "Compara ahora la consulta corregida y verifica cómo las filas y totales coinciden con la auditoría.",
        "code": "-- CORRECTO: Pre-agregar primero order_items al mismo grain (order_id) que orders\nWITH items_por_pedido AS (\n  SELECT\n    order_id,\n    SUM(quantity) AS unidades_pedido,\n    COUNT(DISTINCT product_id) AS skus_distintos\n  FROM order_items\n  GROUP BY order_id\n)\nSELECT\n  COUNT(o.order_id) AS pedidos_reales,\n  SUM(o.order_total_usd) AS ingresos_reales_usd,\n  SUM(COALESCE(i.unidades_pedido, 0)) AS unidades_vendidas\nFROM orders o\nLEFT JOIN items_por_pedido i ON o.order_id = i.order_id;",
        "expectedOutput": [
          {
            "pedidos_reales": 2,
            "ingresos_reales_usd": "$350.00 (100% Exacto)",
            "unidades_vendidas": 6
          }
        ]
      }
    ]
  },
  "checks": [
    {
      "id": "c1",
      "type": "mcq",
      "prompt": "Tienes una tabla `campaigns` (1 fila por campaña con su columna `budget_usd`) y la unes con `ad_clicks` (miles de clics por campaña). Si ejecutas `SELECT campaign_name, SUM(budget_usd), COUNT(click_id) ... GROUP BY campaign_name`, ¿qué ocurrirá con el presupuesto?",
      "options": [
        {
          "id": "a",
          "text": "El presupuesto (`budget_usd`) se multiplicará por el número de clics de cada campaña debido al fan-out 1:N.",
          "correct": true,
          "feedback": "Exacto. Como `budget_usd` está al nivel de campaña y `ad_clicks` tiene miles de filas por campaña, sumar `budget_usd` después del JOIN multiplica el presupuesto miles de veces."
        },
        {
          "id": "b",
          "text": "SQL detectará que `budget_usd` viene de la tabla izquierda y solo lo sumará una vez.",
          "correct": false,
          "feedback": "SQL estándar opera sobre la tabla resultante del JOIN fila por fila; no distingue de qué tabla venía originalmente el valor al ejecutar `SUM()`."
        },
        {
          "id": "c",
          "text": "La consulta dará un error de sintaxis porque no se pueden usar `SUM` y `COUNT` juntos.",
          "correct": false,
          "feedback": "Sintácticamente es 100% válida, y por eso el error es tan peligroso: no falla, pero entrega un número falso."
        }
      ],
      "explanation": "Exacto. Como `budget_usd` está al nivel de campaña y `ad_clicks` tiene miles de filas por campaña, sumar `budget_usd` después del JOIN multiplica el presupuesto miles de veces."
    },
    {
      "id": "c2",
      "type": "mcq",
      "prompt": "Antes de unir `orders` con `order_items`, quieres comprobar si `order_id` es realmente único en `orders`. ¿Qué consulta diagnóstica te confirma que no hay duplicados?",
      "options": [
        {
          "id": "a",
          "text": "SELECT COUNT(*) = COUNT(DISTINCT order_id) AS is_unique FROM orders;",
          "correct": true,
          "feedback": "Correcto: si el total de filas coincide con el total de order_id distintos y no hay nulos, cada fila representa un pedido único."
        },
        {
          "id": "b",
          "text": "SELECT DISTINCT order_id FROM orders LIMIT 10;",
          "correct": false,
          "feedback": "Incorrecto: DISTINCT oculta precisamente los duplicados que necesitas detectar y LIMIT 10 solo inspecciona una muestra mínima."
        },
        {
          "id": "c",
          "text": "SELECT SUM(order_id) FROM orders GROUP BY order_id;",
          "correct": false,
          "feedback": "Incorrecto: sumar un identificador carece de sentido matemático y no informa cuántas veces se repite cada clave."
        }
      ],
      "explanation": "Comparar COUNT(*) contra COUNT(DISTINCT pk) o buscar claves con HAVING COUNT(*) > 1 es la verificación estándar de grano antes de escribir un JOIN."
    },
    {
      "id": "c3",
      "type": "predict-output",
      "prompt": "Un pedido (`order_id = 10`) tiene `shipping_fee = 5` en `orders`, 3 filas en `order_items` y 2 filas en `refunds`. Si unes las tres tablas por `order_id` sin pre-agregar, ¿cuánto devuelve `SUM(shipping_fee)` para ese pedido?",
      "options": [
        {
          "id": "a",
          "text": "30 (se generan 3 × 2 = 6 filas y el envío de 5 se suma 6 veces).",
          "correct": true,
          "feedback": "Correcto: el cruce 1:3 seguido de 1:2 produce el producto cartesiano de 6 filas para el pedido 10, multiplicando 5 × 6 = 30."
        },
        {
          "id": "b",
          "text": "5 (SQL detecta que shipping_fee viene de la tabla orders y lo suma una vez).",
          "correct": false,
          "feedback": "Incorrecto: SUM() opera sobre las filas resultantes del FROM/JOIN sin recordar de qué tabla provino originalmente la columna."
        },
        {
          "id": "c",
          "text": "15 (solo multiplica por la primera tabla unida order_items).",
          "correct": false,
          "feedback": "Incorrecto: el segundo JOIN vuelve a multiplicar cada una de las 3 filas intermedias por las 2 filas de refunds."
        }
      ],
      "explanation": "Cuando unes dos tablas de detalle (3 ítems y 2 reembolsos) contra una misma cabecera, se producen 3 × 2 = 6 filas y cualquier métrica de cabecera se multiplica por 6."
    }
  ],
  "practice": {
    "type": "sql",
    "title": "Pre-agregación en CTEs contra el fan-out",
    "language": "sql",
    "prompt": "Completa la consulta sobre Mercado Brisa para calcular en los primeros 10 clientes (`ORDER BY o.customer_id LIMIT 10`) sus ingresos reales (`gross_revenue_usd`), total de unidades (`unidades_compradas`) y monto reembolsado (`refunded_usd`) pre-agregando `order_items` y `refunds` a nivel `order_id`.",
    "starterCode": "WITH items_agg AS (\n  SELECT\n    order_id,\n    SUM(qty) AS total_units\n  FROM order_items\n  -- TODO: Agrupa por order_id para evitar fan-out con orders\n),\nrefunds_agg AS (\n  SELECT\n    order_id,\n    SUM(refund_amount_usd) AS total_refund_usd\n  FROM refunds\n  GROUP BY order_id\n)\nSELECT\n  o.customer_id,\n  COUNT(o.order_id) AS pedidos_unicos,\n  ROUND(SUM(o.total_usd), 2) AS gross_revenue_usd,\n  SUM(COALESCE(i.total_units, 0)) AS unidades_compradas,\n  -- TODO: Suma r.total_refund_usd protegiendo nulos con COALESCE y redondeando a 2 decimales AS refunded_usd\n  0.0 AS refunded_usd\nFROM orders o\nLEFT JOIN items_agg i ON o.order_id = i.order_id\nLEFT JOIN refunds_agg r ON o.order_id = r.order_id\nGROUP BY o.customer_id\nORDER BY o.customer_id\nLIMIT 10;",
    "expected": "WITH items_agg AS (\n  SELECT\n    order_id,\n    SUM(qty) AS total_units\n  FROM order_items\n  GROUP BY order_id\n),\nrefunds_agg AS (\n  SELECT\n    order_id,\n    SUM(refund_amount_usd) AS total_refund_usd\n  FROM refunds\n  GROUP BY order_id\n)\nSELECT\n  o.customer_id,\n  COUNT(o.order_id) AS pedidos_unicos,\n  ROUND(SUM(o.total_usd), 2) AS gross_revenue_usd,\n  SUM(COALESCE(i.total_units, 0)) AS unidades_compradas,\n  ROUND(SUM(COALESCE(r.total_refund_usd, 0)), 2) AS refunded_usd\nFROM orders o\nLEFT JOIN items_agg i ON o.order_id = i.order_id\nLEFT JOIN refunds_agg r ON o.order_id = r.order_id\nGROUP BY o.customer_id\nORDER BY o.customer_id\nLIMIT 10;",
    "orderMatters": true,
    "hints": [
      "En la CTE `items_agg`, incluye `GROUP BY order_id` para colapsar las líneas de detalle a una sola fila por pedido.",
      "Como `items_agg` y `refunds_agg` tienen relación `1:1` con `orders`, `SUM(o.total_usd)` y `COUNT(o.order_id)` no se multiplican.",
      "Para `refunded_usd`, escribe `ROUND(SUM(COALESCE(r.total_refund_usd, 0)), 2) AS refunded_usd`."
    ],
    "solution": "WITH items_agg AS (\n  SELECT\n    order_id,\n    SUM(qty) AS total_units\n  FROM order_items\n  GROUP BY order_id\n),\nrefunds_agg AS (\n  SELECT\n    order_id,\n    SUM(refund_amount_usd) AS total_refund_usd\n  FROM refunds\n  GROUP BY order_id\n)\nSELECT\n  o.customer_id,\n  COUNT(o.order_id) AS pedidos_unicos,\n  ROUND(SUM(o.total_usd), 2) AS gross_revenue_usd,\n  SUM(COALESCE(i.total_units, 0)) AS unidades_compradas,\n  ROUND(SUM(COALESCE(r.total_refund_usd, 0)), 2) AS refunded_usd\nFROM orders o\nLEFT JOIN items_agg i ON o.order_id = i.order_id\nLEFT JOIN refunds_agg r ON o.order_id = r.order_id\nGROUP BY o.customer_id\nORDER BY o.customer_id\nLIMIT 10;",
    "solutionExplanation": "Pre-agrega las tablas hijas `order_items` y `refunds` por `order_id` en CTEs separadas antes de unirlas con `orders`. Usa `LEFT JOIN` y `COALESCE(..., 0)` para no perder pedidos sin devoluciones."
  },
  "roleNotes": {
    "de": "Diseña tablas Silver con granularidad homogénea: nunca mezcla medidas de cabecera sin prorratear en una tabla de líneas de detalle. Implementa tests automáticos en dbt/SQLMesh (`assert_sum_reconciliation`) que fallan el pipeline si `SUM(order_total)` cambia tras un enriquecimiento. Documenta explícitamente el `grain` en el contrato YAML de cada tabla del Lakehouse.",
    "da": "Antes de ejecutar cualquier `JOIN`, diagnostica la relación real (`1:1`, `1:N`, `N:M`) comparando `COUNT(*)` frente a `COUNT(DISTINCT pk)`. Aísla cada fuente de eventos (clics, ítems, reembolsos) en CTEs pre-agregadas al mismo nivel de entidad antes de consolidar. Usa `COUNT(DISTINCT order_id)` para conteos de entidades cuando es inevitable trabajar sobre una tabla denormalizada.",
    "bi": "Configura relaciones `Muchos-a-Uno` con dirección de filtro segura en el modelo semántico para impedir sumas ingenuas de tablas padre. Oculta las columnas numéricas de cabecera en vistas de detalle o expone únicamente métricas certificadas desde la Capa Semántica. Incluye tarjetas de control de reconciliación financiera contra el libro mayor (General Ledger)."
  },
  "summary": [
    "El grano declara qué entidad física representa exactamente una fila de la tabla.",
    "Unir una tabla maestra con una de detalle (1:N) duplica las métricas de cabecera.",
    "Pre-agrega cada tabla al mismo grano en una CTE antes de hacer el JOIN.",
    "Verifica siempre que SUM(total) antes y después del cruce coincida al centavo."
  ],
  "flashcards": [
    {
      "id": "fc-c1-joins-01",
      "front": "¿Qué es el grano (grain) de una tabla y cómo se verifica en SQL?",
      "back": "Es lo que representa una fila física. Se verifica comprobando que COUNT(*) coincida con COUNT(DISTINCT clave_candidata)."
    },
    {
      "id": "fc-c1-joins-02",
      "front": "¿Por qué un JOIN 1:N infla SUM(order_total) pero no altera COUNT(DISTINCT order_id)?",
      "back": "Porque cada fila de cabecera se repite N veces por sus hijos; SUM suma las repeticiones, mientras COUNT(DISTINCT) colapsa IDs duplicados."
    },
    {
      "id": "fc-c1-joins-03",
      "front": "¿Qué es una trampa de abismo (chasm trap) al unir dos tablas de detalle?",
      "back": "Ocurre al unir dos relaciones 1:N independientes sobre la misma entidad padre (N:1:M), generando N×M filas por entidad."
    }
  ],
  "glossaryTerms": [
    "c01-grain-fanout",
    "c02-cte-preagg"
  ],
  "sources": [
    {
      "title": "The Data Warehouse Toolkit (3rd Edition), Chapter 2: Dimensional Modeling Techniques — Declare the Grain",
      "url": "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/grain/",
      "publisher": "Kimball Group",
      "accessed": "2026-10-29",
      "supports": "Declaración explícita del grano antes de diseñar tablas o escribir consultas de agregación."
    },
    {
      "title": "PostgreSQL 17 Documentation — Section 7.2: Table Expressions and JOIN Clauses",
      "url": "https://www.postgresql.org/docs/current/queries-table-expressions.html",
      "publisher": "PostgreSQL Global Development Group",
      "accessed": "2026-10-29",
      "supports": "Semántica de combinaciones INNER y LEFT JOIN y generación de filas del producto relacional."
    },
    {
      "title": "DuckDB Documentation — Joins and Common Table Expressions (WITH Clause)",
      "url": "https://duckdb.org/docs/sql/query_syntax/with.html",
      "publisher": "DuckDB Foundation",
      "accessed": "2026-10-29",
      "supports": "Uso de CTEs para pre-agregar subconsultas al grano de la entidad antes de combinarlas."
    }
  ],
  "aiNotes": "El error más frecuente es creer que cambiar INNER JOIN por LEFT JOIN evita el fan-out, o usar DISTINCT en el SELECT final ocultando filas legítimas. Guía a la persona a comparar el grano de ambas tablas y pre-agregar en una CTE por la clave de unión.",
  "needsReview": true,
  "legacyId": "l1-joins-fanout",
  "legacyOrder": 1,
  "stageId": "stage-1",
  "subtitle": "Por qué una consulta sintácticamente válida puede duplicar los ingresos de un reporte.",
  "goal": "Identificar la granularidad (grain) de cualquier tabla, diagnosticar relaciones 1:N y N:M (Chasm Trap) y evitar que un JOIN infle métricas financieras o de conteo.",
  "pipelineChallenge": {
    "title": "Flujo anti-fan-out del webhook al reporte",
    "scenario": "Ordena el flujo correcto entre Ingeniería (DE), Análisis (DA) y BI para garantizar que ningún reporte ejecutivo duplique ingresos al cruzar cabeceras de pedidos con líneas de productos y pagos.",
    "steps": [
      {
        "id": "step-1",
        "label": "1. Declarar el grano y la clave primaria en el contrato de datos",
        "role": "DE",
        "detail": "Documentar que `raw_orders` tiene grain `order_id` (1:1) y `raw_order_items` tiene grain `order_id + item_seq` (1:N)."
      },
      {
        "id": "step-2",
        "label": "2. Pre-agregar o prorratear en el modelo silver (dbt/SQLMesh)",
        "role": "DE",
        "detail": "Construir CTEs pre-agregadas a nivel `order_id` o prorratear el envío e impuestos proporcionalmente a cada línea de producto."
      },
      {
        "id": "step-3",
        "label": "3. Auditar invariantes de cardinalidad y reconciliación",
        "role": "DA",
        "detail": "Verificar que `COUNT(*) = COUNT(DISTINCT order_id)` y que la suma de ingresos en la vista analítica cuadra al centavo con pagos."
      },
      {
        "id": "step-4",
        "label": "4. Publicar métricas certificadas en la capa semántica",
        "role": "BI",
        "detail": "Exponer `gross_revenue_usd` y `units_sold` con agregación simétrica controlada para el dashboard ejecutivo."
      }
    ],
    "explanation": "Cuando DE fija el grain y prorratea en Silver, DA valida la reconciliación matemática sin duplicados y BI gobierna las métricas en la Capa Semántica, el error de Fan-Out queda estructuralmente bloqueado."
  },
  "relatedLessons": [
    {
      "id": "l2-window-functions",
      "reason": "Aprende a usar funciones de ventana para prorratear importes o deduplicar filas antes de un JOIN."
    },
    {
      "id": "l3-asof-lateral-ctes",
      "reason": "Domina el diseño de CTEs modulares y cruces temporales que mantienen la cardinalidad exacta."
    }
  ]
};

export default lesson;
