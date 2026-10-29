// Lección migrada al esquema v2 mediante scripts/migrate-legacy.mjs
const lesson = {
  "id": "c2-sql-analitico-01-window-functions",
  "moduleId": "c2-sql-analitico",
  "tracks": [
    "core"
  ],
  "level": 2,
  "order": 1,
  "title": "Funciones de ventana y cláusula QUALIFY",
  "minutes": 30,
  "prerequisites": [
    "c1-sql-joins-02-grano-fanout"
  ],
  "contentVersion": 1,
  "hook": "En Mercado Brisa (empresa ficticia), el servicio de pagos reintenta cobros cuando la red falla y deja eventos duplicados en la tabla de facturación. Además, finanzas necesita comparar el gasto mensual de cada cliente contra su propio mes anterior sin perder el detalle de cada factura. Si usas `GROUP BY`, colapsas las filas; si escribes subconsultas correlacionadas, la consulta tarda minutos. ¿Cómo resuelves ambos problemas en una sola pasada con funciones de ventana y `QUALIFY`?",
  "objectives": [
    "Deduplicar registros con ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...) y filtrar con QUALIFY.",
    "Calcular variaciones periodo a periodo mediante LAG() y LEAD() sin auto-cruces (self-joins).",
    "Distinguir entre marcos ROWS BETWEEN y RANGE BETWEEN en acumulados y medias móviles."
  ],
  "sections": [
    {
      "id": "estructura-de-over-partition-by-order-by",
      "heading": "Estructura de OVER (PARTITION BY ... ORDER BY ...)",
      "body": "A diferencia de `GROUP BY` (que colapsa las filas en un único resumen destruyendo el grain individual), una Window Function calcula un valor agregado, un ranking o un desplazamiento manteniendo intacta cada fila.\nPiensa en `PARTITION BY user_id` como crear cubetas independientes (una por cliente) y en `ORDER BY event_date` como ordenar cronológicamente los eventos dentro de cada cubeta. Funciones de desplazamiento como `LAG(mrr_usd, 1, 0)` miran la fila inmediatamente anterior del mismo cliente, permitiéndote calcular `mrr_usd - LAG(mrr_usd, 1, 0)` en una sola línea.",
      "interactive": {
        "component": "window-function-stepper",
        "caption": "Simulador interactivo: Funciones de ventana y cláusula QUALIFY"
      }
    },
    {
      "id": "funciones-de-ranking-row-number-rank-dense-rank-",
      "heading": "Funciones de ranking (ROW_NUMBER, RANK, DENSE_RANK) y cláusula QUALIFY",
      "body": "Cuando recibes eventos duplicados desde Kafka o webhooks, `ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY ingested_at DESC)` asigna el número `1` a la versión más reciente de cada evento (siempre entrega números únicos consecutivos `1, 2, 3`, mientras que `RANK` salta a `1, 1, 3` en empates y `DENSE_RANK` asigna `1, 1, 2`).\nEn SQL moderno (DuckDB, Snowflake, BigQuery, Databricks), la cláusula `QUALIFY` actúa como el `HAVING` de las funciones de ventana: te permite escribir `QUALIFY ROW_NUMBER() OVER (...) = 1` directamente sin envolver la consulta en una subconsulta adicional.",
      "example": {
        "language": "sql",
        "code": "-- LIMPIO Y ÓPTIMO: Deduplicación directa con QUALIFY y ventana reutilizable\nWITH clean_subs AS (\n  SELECT user_id, event_date, mrr_usd\n  FROM raw_subscriptions\n  QUALIFY ROW_NUMBER() OVER (\n    PARTITION BY user_id, event_date\n    ORDER BY updated_at DESC\n  ) = 1\n)\nSELECT\n  user_id,\n  event_date,\n  mrr_usd,\n  LAG(mrr_usd, 1, 0) OVER user_timeline AS prev_mrr_usd,\n  mrr_usd - LAG(mrr_usd, 1, 0) OVER user_timeline AS mrr_delta\nFROM clean_subs\nWINDOW user_timeline AS (PARTITION BY user_id ORDER BY event_date);",
        "expectedOutput": [
          {
            "user_id": "U-101",
            "event_date": "2026-09-01",
            "mrr_usd": "$49",
            "prev_mrr_usd": "$0",
            "mrr_delta": "+$49 (Alta)"
          },
          {
            "user_id": "U-101",
            "event_date": "2026-10-01",
            "mrr_usd": "$99",
            "prev_mrr_usd": "$49",
            "mrr_delta": "+$50 (Expansion)"
          }
        ]
      }
    },
    {
      "id": "marcos-de-ventana-diferencia-entre-rows-y-range",
      "heading": "Marcos de ventana: diferencia entre ROWS y RANGE",
      "body": "Cuando agregas un `ORDER BY` dentro de `OVER (...)`, SQL aplica por defecto el marco acumulado desde el inicio de la partición hasta la fila actual (`RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`).\nSi quieres una media móvil de 7 días, debes elegir con precisión quirúrgica:\n- `ROWS BETWEEN 6 PRECEDING AND CURRENT ROW`: cuenta 6 filas físicas hacia atrás. Si un producto no tuvo ventas el sábado ni el domingo, saltará a jueves y viernes de la semana anterior, promediando en realidad 9 días calendario.\n- `RANGE BETWEEN INTERVAL 6 DAYS PRECEDING AND CURRENT ROW`: evalúa la ventana lógica de tiempo exacto de los últimos 6 días calendario sin importar si faltan fechas intermedias."
    },
    {
      "id": "sesgo-de-particion-en-produccion-por-valores-nul",
      "heading": "Sesgo de partición en producción por valores nulos en PARTITION BY",
      "body": "En motores distribuidos (Spark, Snowflake, BigQuery), `PARTITION BY session_id` envía todas las filas con el mismo `session_id` al mismo nodo trabajador (Worker) mediante un Hash Shuffle. Si el 65% de tu tráfico anónimo tiene `session_id IS NULL`, un único nodo recibirá el 65% de todo el dataset, provocando un cuello de botella severo (Data Skew / Out-Of-Memory) mientras los otros 31 nodos esperan ociosos. Para evitar este sesgo de partición en Mercado Brisa (empresa ficticia), separa las filas con `session_id IS NULL` antes de aplicar la función de ventana o asigna una clave sustituta determinista basada en `COALESCE(session_id, client_ip || event_date)` para repartir la carga de forma equilibrada entre todos los nodos de cómputo."
    }
  ],
  "workedExample": {
    "title": "Ejemplo guiado: Funciones de ventana y cláusula QUALIFY",
    "description": "Observa cómo `QUALIFY` y `LAG` permiten deduplicar webhooks y clasificar el movimiento de ingresos recurrentes (MRR) con código limpio:",
    "audit": "",
    "steps": [
      {
        "label": "Antipatrón: subconsultas anidadas difíciles de mantener",
        "explanation": "Observa cómo `QUALIFY` y `LAG` permiten deduplicar webhooks y clasificar el movimiento de ingresos recurrentes (MRR) con código limpio:",
        "code": "-- DIFÍCIL DE LEER: Tres niveles de subconsultas para deduplicar y calcular LAG\nSELECT user_id, event_date, mrr_usd, prev_mrr_usd, (mrr_usd - prev_mrr_usd) AS mrr_delta\nFROM (\n  SELECT user_id, event_date, mrr_usd,\n         LAG(mrr_usd, 1, 0) OVER (PARTITION BY user_id ORDER BY event_date) AS prev_mrr_usd\n  FROM (\n    SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id, event_date ORDER BY updated_at DESC) AS rn\n    FROM raw_subscriptions\n  ) t1 WHERE rn = 1\n) t2;",
        "expectedOutput": [
          {
            "user_id": "U-101",
            "event_date": "2026-09-01",
            "mrr_usd": "$49",
            "prev_mrr_usd": "$0",
            "mrr_delta": "+$49 (Alta)"
          },
          {
            "user_id": "U-101",
            "event_date": "2026-10-01",
            "mrr_usd": "$99",
            "prev_mrr_usd": "$49",
            "mrr_delta": "+$50 (Expansion)"
          }
        ]
      },
      {
        "label": "Solución óptima: QUALIFY y cláusula WINDOW nombrada",
        "explanation": "Compara ahora la consulta corregida y verifica cómo las filas y totales coinciden con la auditoría.",
        "code": "-- LIMPIO Y ÓPTIMO: Deduplicación directa con QUALIFY y ventana reutilizable\nWITH clean_subs AS (\n  SELECT user_id, event_date, mrr_usd\n  FROM raw_subscriptions\n  QUALIFY ROW_NUMBER() OVER (\n    PARTITION BY user_id, event_date\n    ORDER BY updated_at DESC\n  ) = 1\n)\nSELECT\n  user_id,\n  event_date,\n  mrr_usd,\n  LAG(mrr_usd, 1, 0) OVER user_timeline AS prev_mrr_usd,\n  mrr_usd - LAG(mrr_usd, 1, 0) OVER user_timeline AS mrr_delta\nFROM clean_subs\nWINDOW user_timeline AS (PARTITION BY user_id ORDER BY event_date);",
        "expectedOutput": [
          {
            "user_id": "U-101",
            "event_date": "2026-09-01",
            "mrr_usd": "$49",
            "prev_mrr_usd": "$0",
            "mrr_delta": "+$49 (Alta)"
          },
          {
            "user_id": "U-101",
            "event_date": "2026-10-01",
            "mrr_usd": "$99",
            "prev_mrr_usd": "$49",
            "mrr_delta": "+$50 (Expansion)"
          }
        ]
      }
    ]
  },
  "checks": [
    {
      "id": "c1",
      "type": "mcq",
      "prompt": "¿Cuál es la diferencia crítica entre usar `ROWS BETWEEN 6 PRECEDING AND CURRENT ROW` y `RANGE BETWEEN INTERVAL 6 DAYS PRECEDING AND CURRENT ROW` al calcular una media móvil de 7 días?",
      "options": [
        {
          "id": "a",
          "text": "`ROWS` cuenta 6 filas físicas hacia atrás (si faltan 2 días sin ventas en la tabla, promedia 9 días calendario), mientras que `RANGE` mira la ventana exacta de tiempo de 6 días calendario.",
          "correct": true,
          "feedback": "Correcto. Si un producto no tuvo ventas el domingo, `ROWS 6 PRECEDING` saltará un día más atrás y distorsionará la ventana temporal."
        },
        {
          "id": "b",
          "text": "No hay ninguna diferencia; son sinónimos exactos en SQL.",
          "correct": false,
          "feedback": "Son muy distintos cuando existen fechas faltantes o múltiples filas con la misma fecha."
        },
        {
          "id": "c",
          "text": "`RANGE` solo funciona con columnas de texto.",
          "correct": false,
          "feedback": "`RANGE` con `INTERVAL` está diseñado específicamente para columnas de fecha (`DATE`) y tiempo (`TIMESTAMP`)."
        }
      ],
      "explanation": "Correcto. Si un producto no tuvo ventas el domingo, `ROWS 6 PRECEDING` saltará un día más atrás y distorsionará la ventana temporal."
    },
    {
      "id": "c2",
      "type": "mcq",
      "prompt": "Quieres quedarte únicamente con la versión más reciente de cada pedido según `updated_at DESC` en DuckDB. ¿Qué cláusula filtra directamente el resultado de `ROW_NUMBER()` sin envolver la consulta en una CTE adicional?",
      "options": [
        {
          "id": "a",
          "text": "QUALIFY ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY updated_at DESC) = 1",
          "correct": true,
          "feedback": "Correcto: QUALIFY se evalúa después de las funciones de ventana y filtra las filas donde el ranking es 1."
        },
        {
          "id": "b",
          "text": "WHERE ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY updated_at DESC) = 1",
          "correct": false,
          "feedback": "Incorrecto: WHERE se ejecuta antes de calcular las funciones de ventana, por lo que el motor devuelve error de sintaxis."
        },
        {
          "id": "c",
          "text": "HAVING ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY updated_at DESC) = 1",
          "correct": false,
          "feedback": "Incorrecto: HAVING filtra grupos producidos por GROUP BY, no funciones de ventana sobre filas individuales."
        }
      ],
      "explanation": "En el orden de evaluación SQL, WHERE y HAVING ocurren antes del cálculo de ventanas; QUALIFY actúa como el filtro específico posterior a las funciones OVER()."
    },
    {
      "id": "c3",
      "type": "mcq",
      "prompt": "En SQL estándar, cuando escribes `SUM(amount) OVER (PARTITION BY customer_id ORDER BY order_date)` sin especificar `ROWS` ni `RANGE`, ¿qué marco de ventana aplica el motor por defecto?",
      "options": [
        {
          "id": "a",
          "text": "RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW (agrupando empates en order_date).",
          "correct": true,
          "feedback": "Correcto: al añadir ORDER BY dentro de OVER(), el marco predeterminado pasa a ser RANGE desde el inicio de la partición hasta el valor actual."
        },
        {
          "id": "b",
          "text": "ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING (toda la partición).",
          "correct": false,
          "feedback": "Incorrecto: ese marco completo solo se aplica cuando NO incluyes cláusula ORDER BY dentro de OVER()."
        },
        {
          "id": "c",
          "text": "ROWS BETWEEN 1 PRECEDING AND CURRENT ROW.",
          "correct": false,
          "feedback": "Incorrecto: SQL nunca limita la ventana a una sola fila previa salvo que lo declares explícitamente."
        }
      ],
      "explanation": "Declarar explícitamente ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW evita sorpresas cuando dos filas comparten la misma marca temporal en ORDER BY."
    }
  ],
  "practice": {
    "type": "fill-blanks",
    "title": "Deduplicación con QUALIFY y media móvil",
    "language": "sql",
    "prompt": "Completa la consulta para: (1) quedarte únicamente con el último registro enviado por cada `store_id` y `sale_date` usando `QUALIFY`, y (2) calcular el ingreso previo con `LAG` y la media móvil de 7 días calendario usando un marco `RANGE`.",
    "starterCode": "WITH daily_store_sales AS (\n  SELECT\n    store_id,\n    sale_date,\n    revenue_usd\n  FROM raw_pos_uploads\n  {{b1}} ROW_NUMBER() OVER (\n    PARTITION BY store_id, sale_date\n    ORDER BY ingested_at DESC\n  ) = 1\n)\nSELECT\n  store_id,\n  sale_date,\n  revenue_usd,\n  {{b2}}(revenue_usd, 1, 0) OVER (\n    PARTITION BY store_id\n    ORDER BY sale_date\n  ) AS prev_day_revenue_usd,\n  ROUND(\n    AVG(revenue_usd) OVER (\n      PARTITION BY store_id\n      ORDER BY sale_date\n      {{b3}} BETWEEN INTERVAL 6 DAYS PRECEDING AND CURRENT ROW\n    ),\n    2\n  ) AS rolling_7d_avg_usd\nFROM daily_store_sales;",
    "expected": "WITH daily_store_sales AS (\n  SELECT\n    store_id,\n    sale_date,\n    revenue_usd\n  FROM raw_pos_uploads\n  {{b1}} ROW_NUMBER() OVER (\n    PARTITION BY store_id, sale_date\n    ORDER BY ingested_at DESC\n  ) = 1\n)\nSELECT\n  store_id,\n  sale_date,\n  revenue_usd,\n  {{b2}}(revenue_usd, 1, 0) OVER (\n    PARTITION BY store_id\n    ORDER BY sale_date\n  ) AS prev_day_revenue_usd,\n  ROUND(\n    AVG(revenue_usd) OVER (\n      PARTITION BY store_id\n      ORDER BY sale_date\n      {{b3}} BETWEEN INTERVAL 6 DAYS PRECEDING AND CURRENT ROW\n    ),\n    2\n  ) AS rolling_7d_avg_usd\nFROM daily_store_sales;",
    "orderMatters": true,
    "hints": [
      "Cláusula para filtrar ventanas: Es el equivalente a `HAVING`, pero diseñado específicamente para filtrar funciones de ventana sin subconsultas.",
      "Función para leer la fila anterior: Esta función mira N filas hacia atrás dentro de la misma partición ordenada.",
      "Tipo de marco por intervalo de fechas: Para ventanas basadas en `INTERVAL 6 DAYS` (fechas calendario y no conteo físico de filas), debes usar este tipo de marco."
    ],
    "solution": "WITH daily_store_sales AS (\n  SELECT\n    store_id,\n    sale_date,\n    revenue_usd\n  FROM raw_pos_uploads\n  {{b1}} ROW_NUMBER() OVER (\n    PARTITION BY store_id, sale_date\n    ORDER BY ingested_at DESC\n  ) = 1\n)\nSELECT\n  store_id,\n  sale_date,\n  revenue_usd,\n  {{b2}}(revenue_usd, 1, 0) OVER (\n    PARTITION BY store_id\n    ORDER BY sale_date\n  ) AS prev_day_revenue_usd,\n  ROUND(\n    AVG(revenue_usd) OVER (\n      PARTITION BY store_id\n      ORDER BY sale_date\n      {{b3}} BETWEEN INTERVAL 6 DAYS PRECEDING AND CURRENT ROW\n    ),\n    2\n  ) AS rolling_7d_avg_usd\nFROM daily_store_sales;",
    "solutionExplanation": "Filtra duplicados en la misma pasada usando `QUALIFY ROW_NUMBER() OVER (...) = 1`. Utiliza `LAG(revenue_usd, 1, 0)` particionando por tienda y ordenando por fecha. Selecciona `RANGE BETWEEN INTERVAL 6 DAYS PRECEDING AND CURRENT ROW` para respetar días sin ventas en la ventana de 7 días.",
    "blanks": [
      {
        "id": "b1",
        "placeholder": "Cláusula para filtrar ventanas",
        "acceptedAnswers": [
          "QUALIFY"
        ],
        "hint": "Es el equivalente a `HAVING`, pero diseñado específicamente para filtrar funciones de ventana sin subconsultas."
      },
      {
        "id": "b2",
        "placeholder": "Función para leer la fila anterior",
        "acceptedAnswers": [
          "LAG"
        ],
        "hint": "Esta función mira N filas hacia atrás dentro de la misma partición ordenada."
      },
      {
        "id": "b3",
        "placeholder": "Tipo de marco por intervalo de fechas",
        "acceptedAnswers": [
          "RANGE"
        ],
        "hint": "Para ventanas basadas en `INTERVAL 6 DAYS` (fechas calendario y no conteo físico de filas), debes usar este tipo de marco."
      }
    ],
    "expectedOutputTable": [
      {
        "store_id": "MAD-01",
        "sale_date": "2026-10-01",
        "revenue_usd": "$1,200.00",
        "prev_day_revenue_usd": "$0.00",
        "rolling_7d_avg_usd": "$1,200.00"
      },
      {
        "store_id": "MAD-01",
        "sale_date": "2026-10-03",
        "revenue_usd": "$1,500.00",
        "prev_day_revenue_usd": "$1,200.00",
        "rolling_7d_avg_usd": "$1,350.00"
      }
    ],
    "rubricCriteria": [
      "Filtra duplicados en la misma pasada usando `QUALIFY ROW_NUMBER() OVER (...) = 1`.",
      "Utiliza `LAG(revenue_usd, 1, 0)` particionando por tienda y ordenando por fecha.",
      "Selecciona `RANGE BETWEEN INTERVAL 6 DAYS PRECEDING AND CURRENT ROW` para respetar días sin ventas en la ventana de 7 días."
    ]
  },
  "roleNotes": {
    "de": "Estandariza la deduplicación idempotente en la capa Silver con `QUALIFY ROW_NUMBER() OVER (PARTITION BY pk ORDER BY ingested_at DESC) = 1`. Previene el Data Skew en clústeres reemplazando claves nulas por un identificador salado (`COALESCE(session_id, CONCAT('anon_', UUID()))`) antes de particionar. Reutiliza definiciones de ventana con la cláusula `WINDOW w AS (...)` para que el optimizador ejecute un único ordenamiento físico (`Sort`).",
    "da": "Utiliza `LAG()` y `LEAD()` para medir tiempos entre compras (inter-purchase time), detectar sesiones de usuario y clasificar cambios de MRR. Emplea marcos `RANGE BETWEEN INTERVAL ...` al calcular medias móviles sobre series temporales con días sin actividad. Calcula percentiles y Pareto acumulado combinando `SUM(revenue) OVER (ORDER BY revenue DESC) / SUM(revenue) OVER ()`.",
    "bi": "Construye tablas de cascada de ingresos (MRR Waterfall: New, Expansion, Contraction, Churn) basadas en deltas de ventana auditados en la capa Gold. Garantiza que las comparativas YoY (`LAG(..., 12)`) y MoM (`LAG(..., 1)`) operen sobre una tabla calendario densa (Date Spine) sin meses faltantes. Expone promedios móviles de 7 y 28 días para suavizar la estacionalidad semanal en dashboards operativos."
  },
  "summary": [
    "Una función de ventana calcula agregados o rankings conservando intacto el grano de cada fila.",
    "QUALIFY filtra el resultado de funciones de ventana en el orden lógico posterior a SELECT.",
    "ROWS cuenta filas físicas adyacentes; RANGE agrupa por valor de tiempo o número.",
    "Particionar por una columna con muchos NULL concentra los datos en un solo nodo trabajador."
  ],
  "flashcards": [
    {
      "id": "fc-c2-win-01",
      "front": "¿En qué se diferencia ROW_NUMBER(), RANK() y DENSE_RANK() ante empates?",
      "back": "ROW_NUMBER asigna números únicos (1,2,3); RANK empata y salta huecos (1,1,3); DENSE_RANK empata sin dejar huecos (1,1,2)."
    },
    {
      "id": "fc-c2-win-02",
      "front": "¿Por qué RANGE BETWEEN INTERVAL 6 DAYS PRECEDING es más seguro que ROWS BETWEEN 6 PRECEDING en series diarias?",
      "back": "Porque si falta un día sin ventas, ROWS retrocede 6 filas físicas (7 o más días reales), mientras RANGE respeta la ventana calendario."
    },
    {
      "id": "fc-c2-win-03",
      "front": "¿Qué problema causa PARTITION BY session_id cuando el 60 % de las filas tienen session_id IS NULL?",
      "back": "Todas las filas NULL van al mismo nodo trabajador durante el hash shuffle, causando sesgo de datos (data skew) y posible falta de memoria."
    }
  ],
  "glossaryTerms": [
    "c03-window-qualify",
    "c05-window-frames"
  ],
  "sources": [
    {
      "title": "PostgreSQL 17 Documentation — Section 3.5: Window Functions",
      "url": "https://www.postgresql.org/docs/current/tutorial-window.html",
      "publisher": "PostgreSQL Global Development Group",
      "accessed": "2026-10-29",
      "supports": "Comportamiento de PARTITION BY, ORDER BY y marcos de ventana ROWS frente a RANGE."
    },
    {
      "title": "DuckDB Documentation — Window Functions and QUALIFY Clause",
      "url": "https://duckdb.org/docs/sql/query_syntax/qualify.html",
      "publisher": "DuckDB Foundation",
      "accessed": "2026-10-29",
      "supports": "Filtrado directo de expresiones de ventana mediante la cláusula QUALIFY."
    },
    {
      "title": "PostgreSQL 17 Documentation — Section 4.2.8: Window Function Calls (Frame Clause)",
      "url": "https://www.postgresql.org/docs/current/sql-expressions.html#SYNTAX-WINDOW-FUNCTIONS",
      "publisher": "PostgreSQL Global Development Group",
      "accessed": "2026-10-29",
      "supports": "Definición formal de marcos ROWS, RANGE y GROUPS en el estándar SQL."
    }
  ],
  "aiNotes": "Las dudas habituales son por qué WHERE no acepta ROW_NUMBER(), por qué SUM() OVER (ORDER BY fecha) salta de golpe cuando hay fechas repetidas (marco por defecto RANGE vs ROWS) y por qué LAST_VALUE requiere declarar UNBOUNDED FOLLOWING.",
  "needsReview": true,
  "legacyId": "l2-window-functions",
  "legacyOrder": 2,
  "stageId": "stage-1",
  "subtitle": "Cómo calcular rankings, variaciones mensuales y promedios móviles sin agrupar ni colapsar filas.",
  "goal": "Dominar `OVER (PARTITION BY ... ORDER BY ...)`, elegir correctamente entre marcos `ROWS` y `RANGE`, y filtrar funciones de ventana con `QUALIFY`.",
  "pipelineChallenge": {
    "title": "Cascada de ingresos recurrentes sin duplicados",
    "scenario": "Organiza la secuencia técnica para transformar eventos crudos de suscripciones con reintentos de red en un reporte oficial de Expansión y Churn de MRR.",
    "steps": [
      {
        "id": "step-1",
        "label": "1. Deduplicar eventos crudos por clave natural con QUALIFY",
        "role": "DE",
        "detail": "Aplicar `QUALIFY ROW_NUMBER() OVER (PARTITION BY subscription_id, billing_month ORDER BY webhook_ts DESC) = 1` en la capa Silver."
      },
      {
        "id": "step-2",
        "label": "2. Cruzar con calendario mensual continuo por cliente",
        "role": "DE",
        "detail": "Asegurar que cada suscripción activa tenga una fila por mes calendario para que los desplazamientos temporales sean continuos."
      },
      {
        "id": "step-3",
        "label": "3. Calcular ingreso previo y variación con LAG() por cliente",
        "role": "DA",
        "detail": "Evaluar `mrr_usd - LAG(mrr_usd, 1, 0) OVER (PARTITION BY customer_id ORDER BY billing_month)` para etiquetar Alta, Upgrade, Downgrade o Churn."
      },
      {
        "id": "step-4",
        "label": "4. Exponer la cascada de retención neta en el tablero",
        "role": "BI",
        "detail": "Visualizar la evolución mensual del Net Revenue Retention (NRR) con desglose auditable por cohorte."
      }
    ],
    "explanation": "Si calculas `LAG()` antes de deduplicar con `QUALIFY`, compararás un evento consigo mismo (delta = 0). Y si no garantizas un calendario continuo antes del `LAG()`, compararás octubre contra julio creyendo que fue el mes inmediato anterior."
  },
  "relatedLessons": [
    {
      "id": "l1-joins-fanout",
      "reason": "Deduplica primero tus tablas de dimensiones o eventos con `QUALIFY` para evitar provocar un Fan-Out al hacer JOIN."
    },
    {
      "id": "l3-asof-lateral-ctes",
      "reason": "Cuando las marcas de tiempo entre dos tablas no coinciden exactamente, combina tus ventanas con `ASOF JOIN`."
    }
  ]
};

export default lesson;
