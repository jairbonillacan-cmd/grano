// Lección migrada al esquema v2 mediante scripts/migrate-legacy.mjs
const lesson = {
  "id": "c2-sql-analitico-02-asof-lateral-ctes",
  "moduleId": "c2-sql-analitico",
  "tracks": [
    "core"
  ],
  "level": 2,
  "order": 2,
  "title": "Cruces temporales con ASOF JOIN y CTEs modulares",
  "minutes": 30,
  "prerequisites": [
    "c2-sql-analitico-01-window-functions"
  ],
  "contentVersion": 1,
  "hook": "En Mercado Brisa (empresa ficticia), un cliente paga un pedido en pesos a las `10:14:22.410`, mientras la tabla de tipos de cambio `fx_rates` se actualiza en instantes irregulares (`09:58:00`, `10:12:05`, `10:19:40`). Si haces un `INNER JOIN` por igualdad de marca temporal, pierdes casi todos los pagos; si unes con `fx_ts <= payment_ts`, multiplicas cada pago por cientos de cotizaciones pasadas. ¿Cómo asignas a cada compra exactamente la cotización vigente a las `10:12:05` sin generar fan-out?",
  "objectives": [
    "Cruzar eventos de distinta frecuencia temporal mediante ASOF JOIN sin multiplicar filas.",
    "Utilizar LEFT JOIN LATERAL para recuperar los N eventos previos por entidad en motores sin ASOF.",
    "Organizar consultas complejas en CTEs con capas de importación, limpieza, lógica y salida."
  ],
  "sections": [
    {
      "id": "exactitud-punto-en-el-tiempo-point-in-time-corre",
      "heading": "Exactitud punto en el tiempo (point-in-time correctness)",
      "body": "En la vida real, los sistemas no emiten eventos al mismo segundo: tienes compras a las `10:14:22`, cambios de tarifa de envío a las `08:00:00`, actualizaciones de segmento del cliente a las `10:05:00` y clics de campaña publicitaria 40 minutos antes de la conversión.\nUnir estas tablas con un `JOIN` tradicional de igualdad (`=`) fracasa porque los relojes no coinciden. Pero unirlas con una desigualdad abierta (`ON f.currency = r.currency AND r.quote_ts <= f.payment_ts`) multiplica cada pago por todas las cotizaciones históricas desde que existe la empresa, provocando un Fan-Out catastrófico.",
      "interactive": {
        "component": "asof-join-timeline",
        "caption": "Simulador interactivo: Cruces temporales con ASOF JOIN y CTEs modulares"
      }
    },
    {
      "id": "asof-join-para-emparejar-series-temporales",
      "heading": "ASOF JOIN para emparejar series temporales",
      "body": "Motores modernos como DuckDB, Snowflake, ClickHouse y Databricks incorporan de forma nativa `ASOF JOIN`. Su semántica es elegante y determinista: para cada fila de la tabla izquierda (`payments`), busca en la tabla derecha (`fx_rates`) dentro de la misma clave de partición (`currency`) la **única fila cuyo timestamp sea el más cercano menor o igual (`<=`)** al timestamp del evento.\nDe este modo, el pago de las `10:14:22` se empareja instantáneamente con la cotización de las `10:12:05` e ignora tanto las cotizaciones más antiguas (`09:58:00`) como las cotizaciones del futuro (`10:19:40`), evitando el temido *Data Leakage* (fuga de información futura) en análisis y Machine Learning.",
      "example": {
        "language": "sql",
        "code": "-- EXCELENTE: CTEs modulares + ASOF JOIN que empareja solo la cotización\n-- inmediata anterior o igual (10:12:05) sin duplicar filas ni mirar al futuro\nWITH payments_scoped AS (\n  SELECT payment_id, currency, payment_ts, amount_mxn\n  FROM payments\n  WHERE payment_ts >= TIMESTAMP '2026-10-28 00:00:00'\n),\nfx_rates_clean AS (\n  SELECT currency, quote_ts, usd_mxn_rate\n  FROM fx_rates\n  WHERE quote_ts >= TIMESTAMP '2026-10-28 00:00:00'\n)\nSELECT\n  p.payment_id,\n  p.payment_ts,\n  r.quote_ts AS matched_fx_ts,\n  r.usd_mxn_rate,\n  ROUND(p.amount_mxn / r.usd_mxn_rate, 2) AS exact_amount_usd\nFROM payments_scoped p\nASOF JOIN fx_rates_clean r\n  ON p.currency = r.currency\n  AND p.payment_ts >= r.quote_ts;",
        "expectedOutput": [
          {
            "payment_id": "PAY-901",
            "payment_ts": "10:14:22",
            "matched_fx_ts": "10:12:05 (Inmediata anterior)",
            "usd_mxn_rate": "19.80",
            "exact_amount_usd": "$100.00 USD (Exacto 1:1)"
          }
        ]
      }
    },
    {
      "id": "lateral-join-para-subconsultas-correlacionadas-p",
      "heading": "LATERAL JOIN para subconsultas correlacionadas por fila",
      "body": "¿Qué pasa si necesitas los **3 últimos tickets de soporte** previos a cada encuesta de satisfacción, o si estás en PostgreSQL/BigQuery donde necesitas emular un cruce correlacionado flexible? Un `LEFT JOIN LATERAL (SELECT ... WHERE s.user_id = o.user_id AND s.ticket_ts <= o.survey_ts ORDER BY s.ticket_ts DESC LIMIT 1)` actúa como un bucle `for-each` optimizado en el motor SQL: evalúa la subconsulta derecha para cada fila de la tabla izquierda y devuelve exactamente las N filas solicitadas. A diferencia de un cruce cartesiano filtrado a posteriori, el optimizador aprovecha un índice compuesto por `(user_id, ticket_ts DESC)` para detener la búsqueda en cuanto localiza las N filas más recientes de cada cliente."
    },
    {
      "id": "ctes-modulares-importacion-limpieza-preparacion-",
      "heading": "CTEs modulares: importación, limpieza, preparación y salida",
      "body": "Las subconsultas anidadas de 200 líneas se leen de adentro hacia afuera y son imposibles de depurar en equipo. El estándar de Ingeniería Analítica en 2026 organiza toda consulta compleja en bloques CTE (`WITH ...`) lineales de arriba hacia abajo:\n1) **Import / Scoped CTEs**: Seleccionan solo las columnas y particiones de fechas necesarias de las tablas origen.\n2) **Clean / Deduplicate CTEs**: Estandarizan tipos, zonas horarias (`UTC`) y deduplican con `QUALIFY`.\n3) **Business Logic / Point-in-Time CTEs**: Ejecutan los `ASOF JOIN` o pre-agregaciones sin Fan-Out.\n4) **Final SELECT**: Proyecta el contrato de salida limpio y listo para tests o visualización."
    }
  ],
  "workedExample": {
    "title": "Ejemplo guiado: Cruces temporales con ASOF JOIN y CTEs modulares",
    "description": "Compara el error clásico de unir por desigualdad temporal (que multiplica filas o filtra datos del futuro) contra la precisión de `ASOF JOIN` con CTEs modulares:",
    "audit": "",
    "steps": [
      {
        "label": "Antipatrón: JOIN con desigualdad abierta que multiplica filas",
        "explanation": "Compara el error clásico de unir por desigualdad temporal (que multiplica filas o filtra datos del futuro) contra la precisión de `ASOF JOIN` con CTEs modulares:",
        "code": "-- ERROR GRAVE: Unir con r.quote_ts <= p.payment_ts sin acotar al único registro\n-- más reciente empareja el pago de las 10:14 con TODAS las tasas anteriores del día\nSELECT\n  p.payment_id,\n  p.payment_ts,\n  p.amount_mxn,\n  COUNT(r.quote_ts) AS tasas_emparejadas_por_error,\n  SUM(ROUND(p.amount_mxn / r.usd_mxn_rate, 2)) AS monto_usd_inflado\nFROM payments p\nJOIN fx_rates r\n  ON p.currency = r.currency\n  AND r.quote_ts <= p.payment_ts\nGROUP BY 1, 2, 3;",
        "expectedOutput": [
          {
            "payment_id": "PAY-901",
            "payment_ts": "10:14:22",
            "amount_mxn": "$1,980 MXN",
            "tasas_emparejadas_por_error": "3 tasas (08:30, 09:58, 10:12)",
            "monto_usd_inflado": "$301.50 USD (Triplicado. Real: $100.00)"
          }
        ]
      },
      {
        "label": "Solución óptima: CTEs modulares y ASOF JOIN exacto",
        "explanation": "Compara ahora la consulta corregida y verifica cómo las filas y totales coinciden con la auditoría.",
        "code": "-- EXCELENTE: CTEs modulares + ASOF JOIN que empareja solo la cotización\n-- inmediata anterior o igual (10:12:05) sin duplicar filas ni mirar al futuro\nWITH payments_scoped AS (\n  SELECT payment_id, currency, payment_ts, amount_mxn\n  FROM payments\n  WHERE payment_ts >= TIMESTAMP '2026-10-28 00:00:00'\n),\nfx_rates_clean AS (\n  SELECT currency, quote_ts, usd_mxn_rate\n  FROM fx_rates\n  WHERE quote_ts >= TIMESTAMP '2026-10-28 00:00:00'\n)\nSELECT\n  p.payment_id,\n  p.payment_ts,\n  r.quote_ts AS matched_fx_ts,\n  r.usd_mxn_rate,\n  ROUND(p.amount_mxn / r.usd_mxn_rate, 2) AS exact_amount_usd\nFROM payments_scoped p\nASOF JOIN fx_rates_clean r\n  ON p.currency = r.currency\n  AND p.payment_ts >= r.quote_ts;",
        "expectedOutput": [
          {
            "payment_id": "PAY-901",
            "payment_ts": "10:14:22",
            "matched_fx_ts": "10:12:05 (Inmediata anterior)",
            "usd_mxn_rate": "19.80",
            "exact_amount_usd": "$100.00 USD (Exacto 1:1)"
          }
        ]
      }
    ]
  },
  "checks": [
    {
      "id": "c1",
      "type": "mcq",
      "prompt": "Un pago ocurre a las `14:05:10`. En la tabla `fx_rates` hay tres cotizaciones para esa moneda: a las `13:50:00` (19.50), a las `14:02:00` (19.80) y a las `14:06:00` (20.10). Si ejecutas `FROM payments p ASOF JOIN fx_rates r ON p.currency = r.currency AND p.payment_ts >= r.quote_ts`, ¿qué cotización se asignará al pago?",
      "options": [
        {
          "id": "a",
          "text": "Únicamente la cotización de las `14:02:00` (19.80), porque es la más reciente entre las que ocurrieron antes o en el momento del pago (`<= 14:05:10`).",
          "correct": true,
          "feedback": "Exacto. `ASOF JOIN` ignora la de las `14:06:00` (porque ocurrió en el futuro respecto al pago) y descarta la de las `13:50:00` porque la de las `14:02:00` está más cerca del evento."
        },
        {
          "id": "b",
          "text": "La cotización de las `14:06:00` (20.10), porque está a solo 50 segundos de distancia.",
          "correct": false,
          "feedback": "Con la condición `p.payment_ts >= r.quote_ts`, jamás se toma un registro del futuro (`14:06:00`), lo cual protege tus análisis y modelos contra el Data Leakage."
        },
        {
          "id": "c",
          "text": "Devolverá dos filas para ese pago: la de las `13:50:00` y la de las `14:02:00`.",
          "correct": false,
          "feedback": "A diferencia de un `JOIN` normal con `<=`, `ASOF JOIN` devuelve como máximo 1 fila emparejada por cada fila de la tabla izquierda, evitando el Fan-Out."
        }
      ],
      "explanation": "Exacto. `ASOF JOIN` ignora la de las `14:06:00` (porque ocurrió en el futuro respecto al pago) y descarta la de las `13:50:00` porque la de las `14:02:00` está más cerca del evento."
    },
    {
      "id": "c2",
      "type": "mcq",
      "prompt": "Un pago ocurre a las 10:15 y existen tasas de cambio a las 10:00, 10:10 y 10:20. Si escribes `ASOF LEFT JOIN fx_rates ON p.currency = f.currency AND p.payment_ts >= f.fx_ts`, ¿qué fila de `fx_rates` se empareja?",
      "options": [
        {
          "id": "a",
          "text": "La tasa de las 10:10, porque es la más reciente entre las que cumplen fx_ts <= 10:15.",
          "correct": true,
          "feedback": "Correcto: ASOF selecciona la marca temporal más cercana que satisface la desigualdad sin usar datos posteriores al pago."
        },
        {
          "id": "b",
          "text": "La tasa de las 10:20, porque está a solo 5 minutos de distancia.",
          "correct": false,
          "feedback": "Incorrecto: las 10:20 incumplen la condición p.payment_ts >= f.fx_ts y representarían información del futuro."
        },
        {
          "id": "c",
          "text": "Las tasas de las 10:00 y 10:10 (dos filas).",
          "correct": false,
          "feedback": "Incorrecto: ASOF JOIN garantiza cardinalidad máxima de una fila emparejada por cada fila de la tabla izquierda."
        }
      ],
      "explanation": "ASOF JOIN evalúa la condición de desigualdad temporal y conserva únicamente el registro más próximo, manteniendo intacto el grano de la tabla izquierda."
    },
    {
      "id": "c3",
      "type": "mcq",
      "prompt": "En PostgreSQL (que no tiene sintaxis `ASOF JOIN` nativa), ¿qué construcción obtiene de forma indexada el último ticket de soporte previo a cada encuesta?",
      "options": [
        {
          "id": "a",
          "text": "LEFT JOIN LATERAL (SELECT ... FROM tickets t WHERE t.user_id = s.user_id AND t.ts <= s.ts ORDER BY t.ts DESC LIMIT 1) ON TRUE",
          "correct": true,
          "feedback": "Correcto: LATERAL evalúa la subconsulta correlacionada para cada fila izquierda y LIMIT 1 detiene la búsqueda usando el índice."
        },
        {
          "id": "b",
          "text": "INNER JOIN tickets t ON t.user_id = s.user_id AND t.ts = s.ts",
          "correct": false,
          "feedback": "Incorrecto: los timestamps exactos de tickets y encuestas rara vez coinciden al milisegundo."
        },
        {
          "id": "c",
          "text": "CROSS JOIN tickets t WHERE t.ts <= s.ts",
          "correct": false,
          "feedback": "Incorrecto: genera un producto cartesiano de todos los clientes y todos los tickets pasados."
        }
      ],
      "explanation": "LEFT JOIN LATERAL con ORDER BY ... DESC LIMIT 1 es el equivalente estándar en PostgreSQL para emular un ASOF JOIN o recuperar los top-N eventos previos."
    }
  ],
  "practice": {
    "type": "sql",
    "title": "Atribución temporal al último evento con ASOF JOIN",
    "language": "sql",
    "prompt": "Completa el pipeline modular con CTEs sobre Mercado Brisa para atribuir cada pedido (`order_id BETWEEN 10001 AND 10010`) al último evento (`events`) del mismo `customer_id` ocurrido antes o en el mismo instante de la compra (`o.order_ts >= e.event_ts`).",
    "starterCode": "WITH orders_clean AS (\n  SELECT\n    order_id,\n    customer_id,\n    order_ts,\n    total_usd\n  FROM orders\n  WHERE order_id BETWEEN 10001 AND 10010\n),\nevents_clean AS (\n  SELECT\n    customer_id,\n    event_ts,\n    event_type,\n    campaign_id\n  FROM events\n  WHERE customer_id IS NOT NULL\n)\nSELECT\n  o.order_id,\n  o.customer_id,\n  e.event_type AS last_touch_type,\n  COALESCE(e.campaign_id, 'ORGANIC_DIRECT') AS attributed_campaign,\n  o.total_usd\nFROM orders_clean o\n-- TODO: Cambia LEFT JOIN por ASOF LEFT JOIN y usa la desigualdad o.order_ts >= e.event_ts\nLEFT JOIN events_clean e\n  ON o.customer_id = e.customer_id\n  AND o.order_ts = e.event_ts\nORDER BY o.order_id;",
    "expected": "WITH orders_clean AS (\n  SELECT\n    order_id,\n    customer_id,\n    order_ts,\n    total_usd\n  FROM orders\n  WHERE order_id BETWEEN 10001 AND 10010\n),\nevents_clean AS (\n  SELECT\n    customer_id,\n    event_ts,\n    event_type,\n    campaign_id\n  FROM events\n  WHERE customer_id IS NOT NULL\n)\nSELECT\n  o.order_id,\n  o.customer_id,\n  e.event_type AS last_touch_type,\n  COALESCE(e.campaign_id, 'ORGANIC_DIRECT') AS attributed_campaign,\n  o.total_usd\nFROM orders_clean o\nASOF LEFT JOIN events_clean e\n  ON o.customer_id = e.customer_id\n  AND o.order_ts >= e.event_ts\nORDER BY o.order_id;",
    "orderMatters": true,
    "hints": [
      "Usa `ASOF LEFT JOIN events_clean e` para emparejar cada pedido únicamente con el evento previo más cercano.",
      "La condición temporal debe ser `AND o.order_ts >= e.event_ts` (el evento ocurrió antes o en el mismo instante que el pedido).",
      "Conserva `ORDER BY o.order_id` al final."
    ],
    "solution": "WITH orders_clean AS (\n  SELECT\n    order_id,\n    customer_id,\n    order_ts,\n    total_usd\n  FROM orders\n  WHERE order_id BETWEEN 10001 AND 10010\n),\nevents_clean AS (\n  SELECT\n    customer_id,\n    event_ts,\n    event_type,\n    campaign_id\n  FROM events\n  WHERE customer_id IS NOT NULL\n)\nSELECT\n  o.order_id,\n  o.customer_id,\n  e.event_type AS last_touch_type,\n  COALESCE(e.campaign_id, 'ORGANIC_DIRECT') AS attributed_campaign,\n  o.total_usd\nFROM orders_clean o\nASOF LEFT JOIN events_clean e\n  ON o.customer_id = e.customer_id\n  AND o.order_ts >= e.event_ts\nORDER BY o.order_id;",
    "solutionExplanation": "Aísla los pedidos y eventos válidos en CTEs y aplica `ASOF LEFT JOIN` con `o.customer_id = e.customer_id AND o.order_ts >= e.event_ts`, garantizando cardinalidad máxima de una fila por pedido."
  },
  "roleNotes": {
    "de": "Normaliza rigurosamente todas las marcas de tiempo a `TIMESTAMP WITH TIME ZONE` (UTC) en la ingesta antes de permitir cualquier `ASOF JOIN`. Ordena físicamente las tablas de series temporales por `(partition_key, event_ts)` en Parquet/Iceberg para que el `ASOF JOIN` se ejecute como un Merge Sort en tiempo lineal `O(N + M)`. Factoriza pipelines complejos en CTEs modulares con nombres semánticos claros en dbt y SQLMesh.",
    "da": "Usa `ASOF JOIN` para construir conjuntos de entrenamiento Point-in-Time (Feature Engineering) garantizando cero Data Leakage del futuro. Resuelve modelos de atribución (\"último toque antes de la compra dentro de una ventana de 7 días\") combinando `ASOF JOIN` con una condición de caducidad temporal. Emplea `LATERAL JOIN` para extraer las N acciones inmediatamente anteriores a una cancelación (Churn).",
    "bi": "Garantiza que la conversión multimoneda en reportes financieros utilice la tasa spot vigente al minuto de la transacción (`ASOF JOIN`) y no el promedio mensual. Audita que cada métrica atribuida a una campaña o segmento respete el estado histórico exacto del cliente cuando ocurrió el evento. Documenta la política de manejo de eventos sin match previo (`LEFT ASOF JOIN` con tasa de respaldo)."
  },
  "summary": [
    "ASOF JOIN empareja cada fila con la observación previa más cercana sin provocar fan-out.",
    "La condición de desigualdad temporal evita usar valores futuros que aún no existían.",
    "LEFT JOIN LATERAL permite obtener las N filas previas o siguientes por cada entidad.",
    "Estructurar consultas en CTEs cortas y nombradas facilita depurar cada paso por separado."
  ],
  "flashcards": [
    {
      "id": "fc-c2-asof-01",
      "front": "¿Qué resuelve un ASOF JOIN frente a un JOIN con desigualdad (a.ts >= b.ts)?",
      "back": "Un JOIN con desigualdad devuelve todas las filas pasadas (fan-out); ASOF JOIN devuelve como máximo una fila: la inmediatamente anterior o igual."
    },
    {
      "id": "fc-c2-asof-02",
      "front": "¿Cuándo prefieres LEFT JOIN LATERAL sobre ASOF JOIN?",
      "back": "Cuando necesitas las N filas previas (LIMIT 3) en lugar de una sola, o cuando trabajas en PostgreSQL donde ASOF JOIN no es nativo."
    },
    {
      "id": "fc-c2-asof-03",
      "front": "¿Qué riesgo introduce usar a.ts <= b.ts por error en un cruce histórico para entrenamiento ML?",
      "back": "Asigna estados futuros a eventos pasados (fuga de datos del futuro o data leakage), invalidando las métricas del modelo."
    }
  ],
  "glossaryTerms": [
    "c04-asof-join",
    "c08-point-in-time"
  ],
  "sources": [
    {
      "title": "DuckDB Documentation — ASOF Join",
      "url": "https://duckdb.org/docs/sql/query_syntax/from.html#asof-join",
      "publisher": "DuckDB Foundation",
      "accessed": "2026-10-29",
      "supports": "Sintaxis y algoritmo de emparejamiento temporal de ASOF JOIN en DuckDB."
    },
    {
      "title": "PostgreSQL 17 Documentation — Section 7.2.1.5: LATERAL Subqueries",
      "url": "https://www.postgresql.org/docs/current/queries-table-expressions.html#QUERIES-LATERAL",
      "publisher": "PostgreSQL Global Development Group",
      "accessed": "2026-10-29",
      "supports": "Uso de LEFT JOIN LATERAL para subconsultas correlacionadas ordenadas con LIMIT."
    },
    {
      "title": "Snowflake Documentation — ASOF JOIN",
      "url": "https://docs.snowflake.com/en/sql-reference/constructs/asof-join",
      "publisher": "Snowflake Inc.",
      "accessed": "2026-10-29",
      "supports": "Semántica de MATCH_CONDITION y preservación de cardinalidad en series temporales."
    }
  ],
  "aiNotes": "El alumno suele invertir el signo de desigualdad en ASOF JOIN (usando <= en vez de >= para la tabla de eventos, trayendo datos del futuro) o escribir CTEs monolíticas de 150 líneas. Insiste en dibujar la línea temporal antes de elegir el operador.",
  "needsReview": true,
  "legacyId": "l3-asof-lateral-ctes",
  "legacyOrder": 3,
  "stageId": "stage-1",
  "subtitle": "Emparejar eventos de distinta frecuencia sin filtrar datos del futuro hacia el pasado.",
  "goal": "Implementar cruces Point-in-Time sin fuga de datos del futuro mediante `ASOF JOIN`, dominar subconsultas correlacionadas con `LATERAL` y estructurar pipelines SQL con CTEs modulares.",
  "pipelineChallenge": {
    "title": "Conversión multimoneda sin fuga del futuro",
    "scenario": "Ordena los pasos técnicos para construir una tabla Gold de transacciones internacionales con tipo de cambio exacto al segundo del pago y atribución de campaña.",
    "steps": [
      {
        "id": "step-1",
        "label": "1. Estandarizar marcas de tiempo a UTC en CTEs de entrada",
        "role": "DE",
        "detail": "Crear las CTEs `payments_scoped` y `fx_rates_scoped` convirtiendo toda hora local a UTC para evitar desfases horarios."
      },
      {
        "id": "step-2",
        "label": "2. Deduplicar cotizaciones y ordenar por clave y tiempo",
        "role": "DE",
        "detail": "Garantizar con `QUALIFY` que no existan dos tasas distintas en el mismo milisegundo para la misma divisa."
      },
      {
        "id": "step-3",
        "label": "3. Ejecutar LEFT ASOF JOIN con condición temporal hacia atrás",
        "role": "DA",
        "detail": "Emparejar cada transacción con la cotización y el estado de membresía vigentes en `quote_ts <= payment_ts` sin Data Leakage."
      },
      {
        "id": "step-4",
        "label": "4. Auditar cobertura de tasas y publicar ingresos en USD",
        "role": "BI",
        "detail": "Verificar que el 100% de las transacciones tengan tasa asignada y exponer `net_revenue_usd` para reportes globales."
      }
    ],
    "explanation": "Un `ASOF JOIN` solo es confiable si ambas series temporales comparten la misma zona horaria (UTC) y están libres de duplicados exactos en el mismo instante; así DA evita fugas del futuro y BI reporta ingresos auditables."
  },
  "relatedLessons": [
    {
      "id": "l1-joins-fanout",
      "reason": "Un JOIN desigual sin `ASOF` genera el peor Fan-Out posible al multiplicar cada hecho por toda la historia previa."
    },
    {
      "id": "l2-window-functions",
      "reason": "Cuando el motor no soporta `ASOF JOIN`, la alternativa clásica requiere combinar un JOIN desigual con `QUALIFY ROW_NUMBER() = 1`."
    }
  ]
};

export default lesson;
