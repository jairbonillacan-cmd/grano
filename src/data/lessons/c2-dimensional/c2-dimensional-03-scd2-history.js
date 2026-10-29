// Lección migrada al esquema v2 mediante scripts/migrate-legacy.mjs
const lesson = {
  "id": "c2-dimensional-03-scd2-history",
  "moduleId": "c2-dimensional",
  "tracks": [
    "core"
  ],
  "level": 2,
  "order": 3,
  "title": "Dimensiones cambiantes: historial con SCD tipo 2",
  "minutes": 30,
  "prerequisites": [
    "c2-dimensional-02-star-schema-obt"
  ],
  "contentVersion": 1,
  "hook": "En Mercado Brisa (empresa ficticia), el cliente `C-101` estuvo en el segmento `\"Hogar\"` de enero a junio y compró 1 000 USD. El 1 de julio pasó al segmento `\"Mayorista\"` y compró otros 1 500 USD. Como la tabla `dim_customer` sobrescribía los cambios (SCD tipo 1), el reporte anual afirma que en el primer semestre `\"Hogar\"` vendió 0 USD y `\"Mayorista\"` vendió 1 000 USD. Además, el modelo predictivo entrenado con esa tabla sufrió fuga de datos. ¿Cómo preservas la historia exacta con SCD tipo 2?",
  "objectives": [
    "Diferenciar cuándo aplicar SCD tipo 1 (corrección de errores) frente a SCD tipo 2 (historial con vigencia).",
    "Modelar intervalos cerrados-abiertos [valid_from, valid_to) con clave sustituta por versión.",
    "Cruzar hechos y dimensiones históricas reconstruyendo el estado exacto en el instante del evento."
  ],
  "sections": [
    {
      "id": "el-problema-de-sobrescribir-el-historial-tipos-d",
      "heading": "El problema de sobrescribir el historial: tipos de dimensiones SCD",
      "body": "El mundo real muta: los clientes cambian de plan, los vendedores cambian de región y los productos cambian de categoría. Ralph Kimball clasificó cómo reaccionar ante estos cambios mediante las **Slowly Changing Dimensions (SCD)**:\n- **SCD Tipo 0 (Retain Original)**: nunca cambia (ej. `fecha_nacimiento`, `canal_primer_registro`).\n- **SCD Tipo 1 (Overwrite)**: sobrescribe el valor antiguo con el nuevo. Útil solo para corregir errores tipográficos (ej. cambiar `\"Mèxico\"` por `\"México\"`), pero **destruye la historia** si se usa en atributos de negocio.\n- **SCD Tipo 2 (Add New Row / Versionado Temporal)**: el estándar de oro analítico. Cada vez que un atributo vigilado cambia, se cierra la fila anterior y se inserta una nueva fila con su propio rango de fechas de validez.\n- **SCD Tipo 3 (Add New Attribute)**: añade una columna `previous_segment` (solo recuerda 1 cambio previo).\n- **SCD Tipo 6 (Hybrid 1+2+3)**: combina filas históricas Tipo 2 con una columna `current_segment` actualizada en todas las filas del cliente para facilitar comparaciones *\"As-Was vs. As-Is\"*.",
      "interactive": {
        "component": "scd2-timeline-builder",
        "caption": "Simulador interactivo: Dimensiones cambiantes: historial con SCD tipo 2"
      }
    },
    {
      "id": "estructura-tecnica-de-una-tabla-scd-tipo-2-en-pr",
      "heading": "Estructura técnica de una tabla SCD tipo 2 en producción",
      "body": "Una dimensión SCD Tipo 2 técnica (`dim_customer_scd2`) contiene cinco elementos estructurales obligatorios:\n1) **Clave Subrogada de Versión (`customer_sk`)**: clave primaria única de esa fila específica, generada de forma determinista con un hash (`SHA-256` o `xxHash64` de `customer_id || valid_from`).\n2) **Clave Natural o Durable (`customer_id`)**: el identificador del cliente en el sistema transaccional (que ahora se repite en varias filas a medida que el cliente evoluciona).\n3) **Intervalo Semicerrado `[valid_from, valid_to)`**: `valid_from` marca el instante exacto en que entró en vigor esa versión y `valid_to` el instante en que dejó de ser válida. Usar la convención **`f.order_ts >= d.valid_from AND f.order_ts < d.valid_to`** (intervalo cerrado por la izquierda y abierto por la derecha) evita ambigüedades o duplicados en los bordes de medianoche que ocurren al usar `BETWEEN`.\n4) **Centinela de Futuro (`9999-12-31` o `NULL`)**: el registro vigente actual tiene `valid_to = TIMESTAMP '9999-12-31 23:59:59'` para que los filtros de rango funcionen sin requerir `OR valid_to IS NULL`.\n5) **Bandera `is_current` (`BOOLEAN`)**: permite consultar rápidamente el estado actual con `WHERE is_current = true`.",
      "example": {
        "language": "sql",
        "code": "-- CORRECTO: Acotar con intervalo semicerrado (>= valid_from AND < valid_to)\n-- Cada compra se atribuye exactamente a la versión vigente en ese segundo\nSELECT\n  d.segment AS segment_at_purchase_as_was,\n  d.current_segment AS segment_today_as_is,\n  COUNT(f.order_id) AS orders_count,\n  SUM(f.amount_usd) AS exact_revenue_usd\nFROM silver.fct_orders f\nJOIN silver.dim_customer_scd2 d\n  ON f.customer_id = d.customer_id\n  AND f.order_ts >= d.valid_from\n  AND f.order_ts <  d.valid_to\nGROUP BY 1, 2\nORDER BY 1;",
        "expectedOutput": [
          {
            "segment_at_purchase_as_was": "Pyme (Ene-Jun)",
            "segment_today_as_is": "Enterprise",
            "orders_count": 1,
            "exact_revenue_usd": "$1,000.00 (Exacto)"
          },
          {
            "segment_at_purchase_as_was": "Enterprise (Jul-Dic)",
            "segment_today_as_is": "Enterprise",
            "orders_count": 1,
            "exact_revenue_usd": "$1,500.00 (Exacto)"
          }
        ]
      }
    },
    {
      "id": "consultas-punto-en-el-tiempo-y-prevencion-de-fug",
      "heading": "Consultas punto en el tiempo y prevención de fuga de datos en modelos",
      "body": "El error más frecuente al consultar una tabla SCD Tipo 2 es hacer `JOIN dim_customer_scd2 d ON f.customer_id = d.customer_id` olvidando la condición temporal: si el cliente cambió 4 veces de plan, **multiplicarás sus ventas por 4 (Fan-Out)**. Tienes dos formas limpias de hacer el cruce Point-in-Time:\n- **Rango de Validez Explícito**: `ON f.customer_id = d.customer_id AND f.order_ts >= d.valid_from AND f.order_ts < d.valid_to` (o unir directamente por `customer_sk` si el pipeline de DE ya estampó la clave subrogada en el hecho).\n- **`ASOF JOIN` (SQL Moderno en DuckDB / Snowflake)**: `ASOF JOIN dim_customer_scd2 d ON f.customer_id = d.customer_id AND f.order_ts >= d.valid_from`, que empareja cada evento con la versión inmediatamente anterior o igual en el tiempo.\nEn **Machine Learning y Análisis de Cohortes**, reconstruir las variables explicativas (*features*) usando cortes Point-in-Time sobre tablas SCD Tipo 2 es la única garantía matemática contra el **Data Leakage (fuga de información del futuro)**."
    },
    {
      "id": "automatizacion-de-scd-tipo-2-con-snapshots-en-db",
      "heading": "Automatización de SCD tipo 2 con snapshots en dbt y SQLMesh",
      "body": "En 2026 ningún ingeniero de datos escribe a mano complejos cursores para mantener tablas SCD Tipo 2. Herramientas declarativas como **dbt Snapshots** (`strategy='timestamp'` o `strategy='check'` comparando el hash de columnas) y **SQLMesh (`SCD_TYPE_2_BY_TIME` / `SCD_TYPE_2_BY_COLUMN`)** calculan automáticamente qué registros cambiaron en el lote incremental, cierran el `valid_to` de las filas modificadas e insertan las nuevas versiones de forma idempotente. Además, al combinar estas tablas históricas con tablas de hechos en Mercado Brisa (empresa ficticia), incluye siempre la condición de intervalo `f.order_ts >= d.valid_from AND f.order_ts < d.valid_to` junto a la clave natural para reconstruir el atributo exacto que tenía el cliente cuando ocurrió cada compra."
    }
  ],
  "workedExample": {
    "title": "Ejemplo guiado: Dimensiones cambiantes: historial con SCD tipo 2",
    "description": "Observa qué ocurre cuando unes ventas con una tabla SCD Tipo 2 olvidando el predicado temporal (Fan-Out) frente a un Join Point-in-Time exacto que además compara el segmento histórico (As-Was) contra el actual (As-Is):",
    "audit": "",
    "steps": [
      {
        "label": "Error crítico: unión por clave natural sin acotar rango SCD2",
        "explanation": "Observa qué ocurre cuando unes ventas con una tabla SCD Tipo 2 olvidando el predicado temporal (Fan-Out) frente a un Join Point-in-Time exacto que además compara el segmento histórico (As-Was) contra el actual (As-Is):",
        "code": "-- ERROR GRAVE: Unir por customer_id natural sin filtrar valid_from / valid_to\n-- Como U-101 tiene 2 filas en dim_customer_scd2 (Pyme y Enterprise),\n-- ambas compras ($1,000 + $1,500) se duplican en AMBOS segmentos.\nSELECT\n  d.segment,\n  COUNT(f.order_id) AS orders_count,\n  SUM(f.amount_usd) AS reported_revenue_usd\nFROM silver.fct_orders f\nJOIN silver.dim_customer_scd2 d\n  ON f.customer_id = d.customer_id\nGROUP BY d.segment;",
        "expectedOutput": [
          {
            "segment": "Pyme",
            "orders_count": "2 (Falso: incluye orden de Julio)",
            "reported_revenue_usd": "$2,500.00 (Inflado. Real era $1,000)"
          },
          {
            "segment": "Enterprise",
            "orders_count": "2 (Falso: incluye orden de Enero)",
            "reported_revenue_usd": "$2,500.00 (Inflado. Total suma $5,000 en vez de $2,500)"
          }
        ]
      },
      {
        "label": "Solución correcta: cruce temporal con intervalo semicerrado",
        "explanation": "Compara ahora la consulta corregida y verifica cómo las filas y totales coinciden con la auditoría.",
        "code": "-- CORRECTO: Acotar con intervalo semicerrado (>= valid_from AND < valid_to)\n-- Cada compra se atribuye exactamente a la versión vigente en ese segundo\nSELECT\n  d.segment AS segment_at_purchase_as_was,\n  d.current_segment AS segment_today_as_is,\n  COUNT(f.order_id) AS orders_count,\n  SUM(f.amount_usd) AS exact_revenue_usd\nFROM silver.fct_orders f\nJOIN silver.dim_customer_scd2 d\n  ON f.customer_id = d.customer_id\n  AND f.order_ts >= d.valid_from\n  AND f.order_ts <  d.valid_to\nGROUP BY 1, 2\nORDER BY 1;",
        "expectedOutput": [
          {
            "segment_at_purchase_as_was": "Pyme (Ene-Jun)",
            "segment_today_as_is": "Enterprise",
            "orders_count": 1,
            "exact_revenue_usd": "$1,000.00 (Exacto)"
          },
          {
            "segment_at_purchase_as_was": "Enterprise (Jul-Dic)",
            "segment_today_as_is": "Enterprise",
            "orders_count": 1,
            "exact_revenue_usd": "$1,500.00 (Exacto)"
          }
        ]
      }
    ]
  },
  "checks": [
    {
      "id": "c1",
      "type": "mcq",
      "prompt": "Un equipo de Ciencia de Datos entrena un modelo en octubre para predecir qué usuarios cancelarán su suscripción tras su primer mes (usando cohortes de enero a agosto). Si unen los eventos del mes 1 con una tabla `dim_customer` tipo SCD 1 (que solo guarda el estado de octubre), ¿qué fenómeno ocurrirá?",
      "options": [
        {
          "id": "a",
          "text": "Data Leakage (fuga de información del futuro): el modelo observará en enero atributos o downgrades que en realidad ocurrieron meses después, inflando artificialmente el AUC en validación y fallando al predecir clientes nuevos en producción.",
          "correct": true,
          "feedback": "Exacto. Entrenar modelos predictivos sobre tablas SCD Tipo 1 sin reconstrucción Point-in-Time (SCD Tipo 2) es la causa número uno de Data Leakage en la industria."
        },
        {
          "id": "b",
          "text": "El modelo será más preciso en producción porque utiliza información más reciente.",
          "correct": false,
          "feedback": "En producción real, cuando un cliente lleva solo 30 días, no conoces su futuro a 8 meses. Entrenar con datos del futuro engaña a la validación."
        },
        {
          "id": "c",
          "text": "Ninguno; los algoritmos de árboles de decisión ignoran automáticamente las columnas sobrescritas.",
          "correct": false,
          "feedback": "Al contrario: un árbol (XGBoost/LightGBM) explotará ávidamente cualquier variable con fuga temporal porque correlaciona artificialmente con el objetivo."
        }
      ],
      "explanation": "Exacto. Entrenar modelos predictivos sobre tablas SCD Tipo 1 sin reconstrucción Point-in-Time (SCD Tipo 2) es la causa número uno de Data Leakage en la industria."
    },
    {
      "id": "c2",
      "type": "mcq",
      "prompt": "En una tabla SCD Tipo 2, la versión 1 de un cliente cierra en `2026-07-01 00:00:00` y la versión 2 abre en ese mismo instante `2026-07-01 00:00:00`. ¿Qué condición de JOIN evita que un pedido ocurrido exactamente a medianoche se duplique?",
      "options": [
        {
          "id": "a",
          "text": "o.order_ts >= d.valid_from AND o.order_ts < d.valid_to",
          "correct": true,
          "feedback": "Correcto: el intervalo cerrado por la izquierda y abierto por la derecha asigna la medianoche exactamente a la versión 2."
        },
        {
          "id": "b",
          "text": "o.order_ts BETWEEN d.valid_from AND d.valid_to",
          "correct": false,
          "feedback": "Incorrecto: BETWEEN es inclusivo en ambos extremos (<= y >=), por lo que emparejaría tanto la versión 1 como la versión 2."
        },
        {
          "id": "c",
          "text": "d.is_current = TRUE",
          "correct": false,
          "feedback": "Incorrecto: filtrar por is_current ignora la historia y asigna todos los pedidos pasados al estado actual del cliente."
        }
      ],
      "explanation": "La convención [valid_from, valid_to) garantiza una partición matemática exacta de la línea temporal: cada instante pertenece a una y solo una versión."
    },
    {
      "id": "c3",
      "type": "mcq",
      "prompt": "Detectas que el apellido de un cliente tenía una errata tipográfica desde su registro inicial (\"Gomez\" sin tilde). ¿Qué tipo de actualización corresponde aplicar en la dimensión?",
      "options": [
        {
          "id": "a",
          "text": "SCD Tipo 1: corregir el valor en las filas existentes porque nunca representó un cambio real en el mundo físico.",
          "correct": true,
          "feedback": "Correcto: las correcciones de errores de captura se sobrescriben con SCD Tipo 1 porque el atributo real nunca cambió."
        },
        {
          "id": "b",
          "text": "SCD Tipo 2: abrir una nueva versión desde hoy para separar las ventas con errata de las ventas corregidas.",
          "correct": false,
          "feedback": "Incorrecto: crear una nueva versión por un error tipográfico fragmentaría artificialmente los reportes por nombre."
        },
        {
          "id": "c",
          "text": "Borrar las compras históricas asociadas al cliente y recargarlas.",
          "correct": false,
          "feedback": "Incorrecto: la tabla de hechos no debe borrarse por corregir un atributo descriptivo en la dimensión."
        }
      ],
      "explanation": "SCD Tipo 2 se reserva para atributos cuyos cambios históricos tienen significado de negocio (segmento, tarifa, región), mientras que errores de captura se corrigen in-situ con Tipo 1."
    }
  ],
  "practice": {
    "type": "sql",
    "title": "Cruce punto en el tiempo con dimensión SCD2",
    "language": "sql",
    "prompt": "Atribuye cada pedido completado de `orders` al nivel (`tier`) que tenía el cliente en `customer_changes` en el instante exacto de la compra (`order_ts`) usando un intervalo semicerrado `[valid_from, valid_to)`, devolviendo `tier_at_order`, `total_orders` y `revenue_usd` ordenados por `revenue_usd DESC`.",
    "starterCode": "SELECT\n  h.tier AS tier_at_order,\n  COUNT(o.order_id) AS total_orders,\n  ROUND(SUM(o.total_usd), 2) AS revenue_usd\nFROM orders o\nJOIN customer_changes h\n  ON o.customer_id = h.customer_id\n  -- TODO: Filtra el intervalo semicerrado: o.order_ts >= h.valid_from y (o.order_ts < h.valid_to OR h.valid_to IS NULL)\n  AND h.is_current = TRUE\nWHERE o.status = 'completed'\nGROUP BY h.tier\nORDER BY revenue_usd DESC;",
    "expected": "SELECT\n  h.tier AS tier_at_order,\n  COUNT(o.order_id) AS total_orders,\n  ROUND(SUM(o.total_usd), 2) AS revenue_usd\nFROM orders o\nJOIN customer_changes h\n  ON o.customer_id = h.customer_id\n  AND o.order_ts >= h.valid_from\n  AND (o.order_ts < h.valid_to OR h.valid_to IS NULL)\nWHERE o.status = 'completed'\nGROUP BY h.tier\nORDER BY revenue_usd DESC;",
    "orderMatters": true,
    "hints": [
      "Elimina `AND h.is_current = TRUE`, ya que eso re-expresaría todas las ventas históricas con el nivel actual del cliente.",
      "Añade el límite inferior inclusivo: `AND o.order_ts >= h.valid_from`.",
      "Añade el límite superior exclusivo contemplando la versión vigente abierta (`NULL`): `AND (o.order_ts < h.valid_to OR h.valid_to IS NULL)`."
    ],
    "solution": "SELECT\n  h.tier AS tier_at_order,\n  COUNT(o.order_id) AS total_orders,\n  ROUND(SUM(o.total_usd), 2) AS revenue_usd\nFROM orders o\nJOIN customer_changes h\n  ON o.customer_id = h.customer_id\n  AND o.order_ts >= h.valid_from\n  AND (o.order_ts < h.valid_to OR h.valid_to IS NULL)\nWHERE o.status = 'completed'\nGROUP BY h.tier\nORDER BY revenue_usd DESC;",
    "solutionExplanation": "Cruza `orders` con la dimensión histórica `customer_changes` por clave natural (`customer_id`) y acota el intervalo semicerrado `o.order_ts >= h.valid_from AND (o.order_ts < h.valid_to OR h.valid_to IS NULL)` para recuperar la versión exacta vigente en cada compra."
  },
  "roleNotes": {
    "de": "Automatiza la generación de dimensiones SCD Tipo 2 mediante `dbt snapshot` o modelos `SCD_TYPE_2` en SQLMesh usando intervalos semicerrados `[valid_from, valid_to)` y centinela `9999-12-31`. Durante la carga de `fct_orders`, resuelve y estampa la clave subrogada histórica (`customer_sk`) en la tabla de hechos para que las consultas posteriores en BI sean un join entero directo `1:1` ultrarrápido.",
    "da": "Construye datasets de entrenamiento (Feature Stores Point-in-Time) cruzando la fecha de observación de cada cohorte contra `dim_customer_scd2` para eliminar el *Target/Data Leakage*. Analiza matrices de transición (ej. qué porcentaje de clientes `\"Pyme\"` migran a `\"Enterprise\"` en menos de 6 meses) consultando las filas consecutivas de `dim_customer_scd2` con `LEAD(segment) OVER (PARTITION BY customer_id ORDER BY valid_from)`.",
    "bi": "Implementa el patrón **SCD Tipo 6** o doble clave en la Capa Semántica para ofrecer dos vistas claras al negocio: *\"Ingresos por Segmento Histórico (Al momento de la venta / As-Was)\"* vs. *\"Ingresos por Segmento Actual (Re-expresado hoy / As-Is)\"*. Audita que ningún reporte general haga join por `customer_id` contra una tabla SCD2 sin filtrar `is_current = true` o acotar el intervalo temporal."
  },
  "summary": [
    "SCD tipo 1 sobrescribe el valor anterior y destruye la trazabilidad histórica.",
    "SCD tipo 2 crea una nueva fila con su propia clave sustituta y rango [valid_from, valid_to).",
    "Usar intervalos semiabiertos (>= valid_from AND < valid_to) evita huecos y solapamientos.",
    "La fecha centinela 9999-12-31 permite filtrar vigencias sin depender de OR valid_to IS NULL."
  ],
  "flashcards": [
    {
      "id": "fc-c2-scd-01",
      "front": "¿Por qué se prefiere el intervalo semiabierto [valid_from, valid_to) sobre BETWEEN en SCD Tipo 2?",
      "back": "Porque con BETWEEN, si el cierre de una versión coincide al segundo con el inicio de la siguiente, el JOIN empareja ambas filas y duplica el hecho."
    },
    {
      "id": "fc-c2-scd-02",
      "front": "¿Cómo provoca una dimensión SCD Tipo 1 fuga de datos (data leakage) al entrenar un modelo de abandono?",
      "back": "Inyecta en el pasado atributos o estados que el cliente adquirió meses después del evento de entrenamiento."
    },
    {
      "id": "fc-c2-scd-03",
      "front": "¿Para qué sirve almacenar valid_to = 9999-12-31 en la versión actual de una dimensión SCD Tipo 2?",
      "back": "Permite escribir condiciones de rango limpias (event_ts < valid_to) sin evaluar OR valid_to IS NULL, mejorando el uso de índices y zone maps."
    }
  ],
  "glossaryTerms": [
    "c07-scd-type-2",
    "c08-point-in-time"
  ],
  "sources": [
    {
      "title": "Kimball Group — Slowly Changing Dimensions (Types 0, 1, 2, 3, 4, 6)",
      "url": "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/type-2-slowly-changing-dimension/",
      "publisher": "Kimball Group",
      "accessed": "2026-10-29",
      "supports": "Diseño de dimensiones lentamente cambiantes Tipo 2 con claves sustitutas y fechas de vigencia."
    },
    {
      "title": "dbt Documentation — Add Snapshots to your DAG (SCD Type 2)",
      "url": "https://docs.getdbt.com/docs/build/snapshots",
      "publisher": "dbt Labs",
      "accessed": "2026-10-29",
      "supports": "Generación declarativa de tablas SCD Tipo 2 mediante estrategias timestamp y check."
    },
    {
      "title": "SQLMesh Documentation — Incremental by Time and SCD Type 2 Models",
      "url": "https://sqlmesh.readthedocs.io/en/stable/concepts/models/model_kinds/#scd_type_2_by_time",
      "publisher": "Tobiko Data",
      "accessed": "2026-10-29",
      "supports": "Mantenimiento idempotente de dimensiones SCD Tipo 2 basadas en marcas de actualización."
    }
  ],
  "aiNotes": "El fallo clásico es unir `fact_orders` con `dim_customer_scd2` solo por `customer_id` olvidando el filtro temporal, lo que multiplica cada pedido por el número de versiones históricas del cliente (fan-out). Recuérdales unir por `customer_sk` o incluir el rango `[valid_from, valid_to)`.",
  "needsReview": true,
  "legacyId": "l5-scd2-history",
  "legacyOrder": 5,
  "stageId": "stage-2",
  "subtitle": "Preservar el historial de atributos con intervalos de vigencia para auditorías y modelos predictivos.",
  "goal": "Implementar y consultar Dimensiones Lentamente Cambiantes (SCD Tipo 1, Tipo 2 y Tipo 3/6), generar claves subrogadas deterministas y ejecutar joins Point-in-Time (rango de validez y ASOF JOIN) para preservar la historia en BI y evitar Data Leakage en Machine Learning.",
  "pipelineChallenge": {
    "title": "Ejecución de snapshot SCD tipo 2",
    "scenario": "El cliente `U-101` cambia de `\"Pyme\"` a `\"Enterprise\"` el `2026-07-01 00:00:00`. Ordena los pasos que ejecuta el motor de transformación (dbt Snapshot / SQLMesh) para actualizar `silver.dim_customer_scd2` y enlazar los hechos:",
    "description": "Ordena la secuencia exacta de operaciones que ocurren en el pipeline cuando llega un cambio de atributo en una dimensión vigilada por SCD Tipo 2:",
    "prompt": "Establece el orden correcto de actualización SCD Tipo 2 y consumo Point-in-Time:",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "label": "1. Detectar cambio por diferencia de hash en columnas vigiladas",
        "title": "Detección de cambio por hash",
        "role": "DE",
        "layer": "Staging → Silver",
        "detail": "Comparar el hash de los atributos entrantes (`segment`, `country`, `account_manager`) contra el registro activo (`is_current = true`) de `U-101` y detectar que `segment` cambió de `\"Pyme\"` a `\"Enterprise\"`.",
        "description": "Comparar el hash de los atributos entrantes (`segment`, `country`, `account_manager`) contra el registro activo (`is_current = true`) de `U-101` y detectar que `segment` cambió de `\"Pyme\"` a `\"Enterprise\"`."
      },
      {
        "id": "step-2",
        "order": 2,
        "label": "2. Expirar la versión anterior (`valid_to` e `is_current = false`)",
        "title": "Cierre del registro histórico previo",
        "role": "DE",
        "layer": "Silver SCD2",
        "detail": "Actualizar la fila anterior (`customer_sk = SK_901`) cambiando su `valid_to` de `9999-12-31` a `2026-07-01 00:00:00` y marcando `is_current = false`.",
        "description": "Actualizar la fila anterior (`customer_sk = SK_901`) cambiando su `valid_to` de `9999-12-31` a `2026-07-01 00:00:00` y marcando `is_current = false`."
      },
      {
        "id": "step-3",
        "order": 3,
        "label": "3. Insertar nueva versión vigente con nueva clave subrogada",
        "title": "Inserción de nueva versión vigente",
        "role": "DE",
        "layer": "Silver SCD2",
        "detail": "Insertar una nueva fila para `U-101` con `customer_sk = xxHash64(U-101 || 2026-07-01)`, `segment = Enterprise`, `valid_from = 2026-07-01`, `valid_to = 9999-12-31` e `is_current = true`.",
        "description": "Insertar una nueva fila para `U-101` con `customer_sk = xxHash64(U-101 || 2026-07-01)`, `segment = Enterprise`, `valid_from = 2026-07-01`, `valid_to = 9999-12-31` e `is_current = true`."
      },
      {
        "id": "step-4",
        "order": 4,
        "label": "4. Resolver cruce punto en el tiempo en hechos y modelos",
        "title": "Atribución temporal en tablas de hechos",
        "role": "DA",
        "layer": "Silver → Gold",
        "detail": "Unir las órdenes de enero con `SK_901 (Pyme)` y las órdenes de julio con `SK_988 (Enterprise)` usando `[valid_from, valid_to)`, preservando la verdad histórica.",
        "description": "Unir las órdenes de enero con `SK_901 (Pyme)` y las órdenes de julio con `SK_988 (Enterprise)` usando `[valid_from, valid_to)`, preservando la verdad histórica."
      }
    ],
    "correctOrder": [
      "step-1",
      "step-2",
      "step-3",
      "step-4"
    ],
    "options": [
      {
        "id": "scd-opt-ok",
        "text": "1) Detectar cambio por Hash-Diff → 2) Cerrar fila anterior (`valid_to = 2026-07-01`, `is_current = false`) → 3) Insertar nueva fila (`customer_sk` nuevo, `valid_to = 9999-12-31`) → 4) Cruzar hechos por rango `[valid_from, valid_to)`",
        "correct": true,
        "feedback": "Perfecto. Así conservas la trazabilidad completa: ningún reporte pasado cambia retroactivamente y los modelos de ML entrenan sin fugas del futuro."
      },
      {
        "id": "scd-opt-overwrite",
        "text": "1) Ejecutar `UPDATE dim_customer SET segment = 'Enterprise' WHERE customer_id = 'U-101'` → 2) Borrar el registro de que alguna vez fue Pyme",
        "correct": false,
        "feedback": "Eso es SCD Tipo 1: destruye la historia del cliente y altera retroactivamente los reportes financieros del primer semestre."
      },
      {
        "id": "scd-opt-open-both",
        "text": "1) Insertar una fila nueva dejando la fila anterior también con `valid_to = 9999-12-31` e `is_current = true`",
        "correct": false,
        "feedback": "Si no cierras la vigencia de la fila anterior, los intervalos se solaparán y todas las ventas futuras del cliente se duplicarán al hacer join."
      }
    ],
    "explanation": "La tabla `dim_customer_scd2` mantiene una línea de tiempo continua y sin solapamientos para cada cliente, habilitando auditorías financieras exactas y ciencia de datos libre de sesgos.",
    "expectedOutcome": "La tabla `dim_customer_scd2` mantiene una línea de tiempo continua y sin solapamientos para cada cliente, habilitando auditorías financieras y ciencia de datos libre de sesgos."
  },
  "relatedLessons": [
    {
      "id": "l4-star-schema-obt",
      "reason": "Entiende cómo las dimensiones SCD Tipo 2 se integran en el Star Schema de la capa Silver."
    },
    {
      "id": "l3-asof-lateral-ctes",
      "reason": "Usa `ASOF JOIN` para cruzar hechos de alta frecuencia con dimensiones SCD Tipo 2 sin solapamientos."
    },
    {
      "id": "l6-metrics-simpson",
      "reason": "Analiza cómo las migraciones de clientes entre segmentos afectan el mix de tus métricas."
    }
  ]
};

export default lesson;
