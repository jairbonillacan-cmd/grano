// Lección migrada al esquema v2 mediante scripts/migrate-legacy.mjs
const lesson = {
  "id": "de3-transformacion-03-contracts-semantic-layer",
  "moduleId": "de3-transformacion",
  "tracks": [
    "de",
    "bi"
  ],
  "level": 3,
  "order": 3,
  "title": "Contratos de datos y capa semántica",
  "minutes": 30,
  "prerequisites": [
    "de3-transformacion-01-dbt-sqlmesh-dag"
  ],
  "contentVersion": 1,
  "hook": "En Mercado Brisa (empresa ficticia), durante el cierre trimestral tres áreas presentaron cifras distintas de retención neta de ingresos: Marketing reportó 118 %, Finanzas 104 % y el asistente de consultas 126 %. Al investigar la discrepancia aparecieron dos causas: el microservicio de cobros había cambiado el significado de `status = 2` sin avisar, y cada área mantenía su propia fórmula SQL copiada en reportes locales con un `JOIN` que multiplicaba filas. ¿Cómo evitas ambos fallos con contratos de datos y una capa semántica?",
  "objectives": [
    "Definir contratos de datos verificables (esquema, semántica de valores, grano y SLA) entre productores y consumidores.",
    "Bloquear cambios incompatibles en integración continua y desviar registros inválidos mediante corte de circuito.",
    "Centralizar entidades, dimensiones y medidas en una capa semántica que genere SQL libre de fan-out."
  ],
  "sections": [
    {
      "id": "estructura-de-un-contrato-de-datos-bajo-el-estan",
      "heading": "Estructura de un contrato de datos bajo el estándar ODCS",
      "body": "Durante años, los equipos de Ingeniería de Datos funcionaron como \"bomberos a las 3:00 AM\": un desarrollador de backend renombraba un campo en PostgreSQL o en un evento de Kafka, se iba a dormir tranquilo porque sus tests de aplicación pasaban, y cuatro horas después explotaban 50 modelos de dbt y los tableros del CEO.\nLos **Data Contracts** aplican el principio **Shift-Left** (mover la calidad hacia el origen). Bajo el estándar abierto de la industria **ODCS v3.0 (Open Data Contract Standard)** de Bitol / Linux Foundation, un contrato es un archivo YAML versionado en Git que firma tres garantías entre el productor del microservicio y los consumidores de datos:\n1) **Esquema y Semántica**: Nombres de columnas, tipos lógicos/físicos, claves primarias, clasificación PII (datos personales) y descripción exacta de negocio.\n2) **Reglas de Calidad de Datos (Quality Checks)**: Invariantes ejecutables (ej. `mrr_cents >= 0`, `null_count(customer_id) = 0`, valores permitidos en enumeraciones).\n3) **Acuerdos de Nivel de Servicio (SLAs)**: Frescura máxima permitida (*latency: 15 minutes*), disponibilidad, ventana de retención y propietario responsable (`owner`) con canal de alerta.",
      "interactive": {
        "component": "dbt-sqlmesh-dag-explorer",
        "caption": "Simulador interactivo: Contratos de datos y capa semántica"
      }
    },
    {
      "id": "validacion-del-contrato-en-ci-y-corte-de-circuit",
      "heading": "Validación del contrato en CI y corte de circuito en ingesta",
      "body": "Un Data Contract que vive en un PDF o en una wiki que nadie lee es inútil. En una arquitectura moderna 2026, el archivo ODCS v3 se ejecuta automáticamente en dos puntos de control:\n• **En el CI/CD del Productor (GitHub Actions / GitLab CI)**: Cuando un ingeniero de software abre un Pull Request que modifica el esquema de base de datos o el protobuf/JSON del evento emitido, el linter de contratos compara el cambio contra `contract_billing_v3.yaml`. Si elimina una columna requerida o viola la compatibilidad hacia atrás sin incrementar la versión mayor y notificar a los consumidores en el grafo OpenLineage, el chequeo de CI bloquea el merge antes de llegar a producción.\n• **En la Frontera de Ingesta (Circuit Breaker / Dead-Letter Queue)**: Durante la ingesta hacia el Lakehouse Iceberg, las filas o lotes que violen las aserciones críticas del contrato se desvían a una tabla de cuarentena (*quarantine / DLQ*) o detienen la publicación de la rama WAP, protegiendo al 100% las tablas Silver y Gold.",
      "example": {
        "language": "sql",
        "code": "# 1. Contrato de Datos Ejecutable (ODCS v3.0) — billing_subscriptions_contract.yaml\napiVersion: v3.0.0\nkind: DataContract\nid: urn:datacontract:novapay:billing_subscriptions\ninfo:\n  title: Suscripciones activas e ingreso recurrente\n  version: 3.1.0\n  owner: finops-data@novapay.io\nslaProperties:\n  - property: latency\n    value: 15\n    unit: minutes\nschema:\n  - name: subscription_id\n    logicalType: string\n    primaryKey: true\n    required: true\n  - name: mrr_usd\n    logicalType: number\n    quality:\n      - type: sql\n        query: \"SELECT COUNT(*) FROM {table} WHERE mrr_usd < 0\"\n        mustBe: 0\n\n---\n# 2. Capa Semántica Unificada (dbt Semantic Layer / MetricFlow) — semantic_mrr.yaml\nsemantic_models:\n  - name: subscriptions_model\n    model: ref('fct_subscriptions')\n    defaults:\n      agg_time_dimension: metric_date\n    entities:\n      - name: subscription\n        type: primary\n        expr: subscription_id\n      - name: customer\n        type: foreign\n        expr: customer_id\n    dimensions:\n      - name: plan_tier\n        type: categorical\n    measures:\n      - name: total_mrr_usd\n        agg: sum\n        expr: mrr_usd\n      - name: active_paying_customers\n        agg: count_distinct\n        expr: customer_id\n\nmetrics:\n  - name: net_arpu_usd\n    label: \"ARPU Neto Certificado (USD)\"\n    type: ratio\n    type_params:\n      numerator: total_mrr_usd\n      denominator: active_paying_customers",
        "expectedOutput": [
          {
            "plan_tier": "Enterprise",
            "total_mrr_usd": "$610,000.00 (Sin Fan-Out: agregado al grain primario)",
            "net_arpu_usd": "$1,220.00 (SUM(mrr_usd) / COUNT(DISTINCT customer_id))",
            "consumidores_sincronizados": "Power BI + Polars DA + Agente MCP (100% Idéntico)"
          }
        ]
      }
    },
    {
      "id": "componentes-de-metricflow-y-cube-entidades-y-med",
      "heading": "Componentes de MetricFlow y Cube: entidades y medidas",
      "body": "Si los Data Contracts protegen la entrada al Lakehouse, la **Capa Semántica Unificada** (implementada con **dbt Semantic Layer / MetricFlow** o **Cube**) protege la salida hacia las decisiones de negocio. En lugar de escribir SQL manual en cada herramienta de visualización, declaras un grafo semántico compuesto por cuatro bloques:\n• **Semantic Models**: Conectan un modelo Gold/Silver (`ref('fct_orders')`) con su dimensión de tiempo predeterminada (`agg_time_dimension: order_date`).\n• **Entities (Claves del Grafo)**: Declaran cuál es la entidad `primary` de la tabla (ej. `order_id`), cuáles son `unique` y cuáles son `foreign` (ej. `customer_id`). Así el motor conoce la cardinalidad exacta (`1:1`, `1:N`) de toda tu empresa.\n• **Dimensions**: Atributos por los cuales se filtra o agrupa (`categorical` como `country_code`, `plan_tier`; o `time` con granularidades día/semana/mes/trimestre).\n• **Measures y Metrics**: Las *Measures* son agregaciones base sobre una tabla (`sum`, `count_distinct`), mientras que las *Metrics* son los KPIs de negocio expuestos al usuario final: métricas `simple`, `ratio` (`numerador / denominador` calculados por separado), `cumulative` (MTD, YTD, ventanas móviles) o `derived` (fórmulas compuestas como `NRR` o `LTV / CAC`)."
    },
    {
      "id": "prevencion-de-fan-out-en-el-motor-semantico-y-co",
      "heading": "Prevención de fan-out en el motor semántico y consumo BI",
      "body": "¿Qué ocurre cuando un usuario en BI o un Agente de IA pide cruzar una métrica de `fct_orders` (nivel pedido) con una dimensión de otra tabla o con una métrica de `fct_marketing_spend` (nivel campaña diaria)?\nSi un humano escribe ese SQL a prisa, suele hacer un `JOIN` directo que multiplica el presupuesto de marketing por el número de pedidos (**Fan-Out Trap**). En cambio, el compilador de **MetricFlow / Cube** inspecciona los tipos de entidad (`primary` vs `foreign`): agrega primero cada tabla a su granularidad segura en subconsultas/CTEs separadas y recién después une los resultados por las dimensiones solicitadas. Si el usuario pide un cruce matemáticamente inválido, la Capa Semántica lo rechaza con una explicación clara en lugar de inventar un número falso.\nAdemás, en 2026 la Capa Semántica expone interfaces nativas para todos los consumidores: **JDBC / Arrow Flight SQL** para Power BI, Tableau y Evidence.dev; **SDK de Python** para que los analistas (DA) partan de las métricas oficiales en Polars/Marimo; y **Servidor MCP (Model Context Protocol)** para que agentes como Google AI Ultra consulten métricas certificadas con precisión determinista."
    }
  ],
  "workedExample": {
    "title": "Ejemplo guiado: Contratos de datos y capa semántica",
    "description": "Compara el caos de tener fórmulas SQL dispersas y sin contrato de entrada frente a un Contrato ODCS v3 acoplado a una Capa Semántica declarativa en MetricFlow:",
    "audit": "",
    "steps": [
      {
        "label": "Antipatrón: sin contrato y promedio de razones en BI",
        "explanation": "Compara el caos de tener fórmulas SQL dispersas y sin contrato de entrada frente a un Contrato ODCS v3 acoplado a una Capa Semántica declarativa en MetricFlow:",
        "code": "-- CAOS MÉTRICO:\n-- 1) Nadie validó que 'mrr_cents' en origen ahora trae reembolsos negativos sin filtrar.\n-- 2) Unir 'subscriptions' (1 fila por cliente) con 'support_tickets' (N filas por cliente)\n--    provoca un Fan-Out que multiplica el MRR de los clientes que abrieron varios tickets.\n-- 3) Promediar ratios con AVG() distorsiona el ARPU real.\nSELECT\n  s.plan_tier,\n  SUM(s.mrr_cents) / 100.0 AS mrr_inflado_por_tickets_usd,\n  AVG(s.mrr_cents / 100.0) AS arpu_distorsionado_usd\nFROM gold.subscriptions s\nLEFT JOIN gold.support_tickets t ON s.customer_id = t.customer_id\nGROUP BY s.plan_tier;",
        "expectedOutput": [
          {
            "plan_tier": "Enterprise",
            "mrr_inflado_por_tickets_usd": "$1,890,000 (Inflado +210% por Fan-Out con tickets.)",
            "arpu_distorsionado_usd": "$2,450 (Incorrecto: pondera por ticket, no por cliente)",
            "confianza_comite": "Baja (Finanzas y Producto muestran cifras distintas)"
          }
        ]
      },
      {
        "label": "Solución óptima: contrato ODCS v3 y métrica en MetricFlow",
        "explanation": "Compara ahora la consulta corregida y verifica cómo las filas y totales coinciden con la auditoría.",
        "code": "# 1. Contrato de Datos Ejecutable (ODCS v3.0) — billing_subscriptions_contract.yaml\napiVersion: v3.0.0\nkind: DataContract\nid: urn:datacontract:novapay:billing_subscriptions\ninfo:\n  title: Suscripciones activas e ingreso recurrente\n  version: 3.1.0\n  owner: finops-data@novapay.io\nslaProperties:\n  - property: latency\n    value: 15\n    unit: minutes\nschema:\n  - name: subscription_id\n    logicalType: string\n    primaryKey: true\n    required: true\n  - name: mrr_usd\n    logicalType: number\n    quality:\n      - type: sql\n        query: \"SELECT COUNT(*) FROM {table} WHERE mrr_usd < 0\"\n        mustBe: 0\n\n---\n# 2. Capa Semántica Unificada (dbt Semantic Layer / MetricFlow) — semantic_mrr.yaml\nsemantic_models:\n  - name: subscriptions_model\n    model: ref('fct_subscriptions')\n    defaults:\n      agg_time_dimension: metric_date\n    entities:\n      - name: subscription\n        type: primary\n        expr: subscription_id\n      - name: customer\n        type: foreign\n        expr: customer_id\n    dimensions:\n      - name: plan_tier\n        type: categorical\n    measures:\n      - name: total_mrr_usd\n        agg: sum\n        expr: mrr_usd\n      - name: active_paying_customers\n        agg: count_distinct\n        expr: customer_id\n\nmetrics:\n  - name: net_arpu_usd\n    label: \"ARPU Neto Certificado (USD)\"\n    type: ratio\n    type_params:\n      numerator: total_mrr_usd\n      denominator: active_paying_customers",
        "expectedOutput": [
          {
            "plan_tier": "Enterprise",
            "total_mrr_usd": "$610,000.00 (Sin Fan-Out: agregado al grain primario)",
            "net_arpu_usd": "$1,220.00 (SUM(mrr_usd) / COUNT(DISTINCT customer_id))",
            "consumidores_sincronizados": "Power BI + Polars DA + Agente MCP (100% Idéntico)"
          }
        ]
      }
    ]
  },
  "checks": [
    {
      "id": "c1",
      "type": "mcq",
      "prompt": "Un ejecutivo pide en un dashboard (o a un Agente IA) ver en una misma tabla el `Presupuesto Mensual de Campaña` (almacenado en `fct_campaigns`, 1 fila por campaña) junto con los `Ingresos por Pedidos` (almacenado en `fct_orders`, miles de pedidos por campaña) desglosados por canal. ¿Cómo resuelve la Capa Semántica (MetricFlow / Cube) esta consulta sin inflar el presupuesto?",
      "options": [
        {
          "id": "a",
          "text": "Al conocer las entidades primarias y foráneas de ambos modelos semánticos, compila una consulta multi-hop (CTEs separadas) que agrega primero `fct_campaigns` por canal y agrega por separado `fct_orders` por canal al mismo nivel de granularidad antes de unir ambos resultados mediante un FULL/LEFT JOIN.",
          "correct": true,
          "feedback": "Exacto. Esta capacidad (conocida como Symmetric Aggregates / Multi-fact CTE Join planning) es la razón principal por la que la Capa Semántica impide los errores de Fan-Out al cruzar tablas de distinta granularidad."
        },
        {
          "id": "b",
          "text": "Hace un INNER JOIN directo fila por fila entre `fct_campaigns` y `fct_orders` y luego divide el resultado entre un número aleatorio para compensar.",
          "correct": false,
          "feedback": "Unir tablas de distinta granularidad antes de agregar provoca el Fan-Out Trap; la Capa Semántica nunca hace eso."
        },
        {
          "id": "c",
          "text": "Obliga al ingeniero de datos a copiar manualmente los datos en una hoja de cálculo de Excel cada mañana.",
          "correct": false,
          "feedback": "La Capa Semántica automatiza en tiempo real la generación del SQL seguro directamente sobre el Lakehouse."
        }
      ],
      "explanation": "Exacto. Esta capacidad (conocida como Symmetric Aggregates / Multi-fact CTE Join planning) es la razón principal por la que la Capa Semántica impide los errores de Fan-Out al cruzar tablas de distinta granularidad."
    },
    {
      "id": "c2",
      "type": "mcq",
      "prompt": "El equipo de ingeniería de software quiere renombrar la columna `total_cents` a `amount_cents` en el evento de compras que alimenta el almacén.Con un contrato de datos activo en CI, ¿cuándo se detecta este cambio incompatible?",
      "options": [
        {
          "id": "a",
          "text": "En el Pull Request del repositorio del servicio productor, antes de desplegar a producción.",
          "correct": true,
          "feedback": "Correcto: el chequeo de contrato en CI compara el esquema emitido contra el contrato vigente y bloquea el merge hasta pactar una migración."
        },
        {
          "id": "b",
          "text": "Tres días después, cuando el director financiero abre el tablero y ve columnas vacías.",
          "correct": false,
          "feedback": "Incorrecto: detectar errores en el tablero ejecutivo significa que no existía validación preventiva en la frontera."
        },
        {
          "id": "c",
          "text": "Nunca, porque las columnas renombradas se corrigen solas en SQL.",
          "correct": false,
          "feedback": "Incorrecto: un cambio de nombre sin mapeo explícito rompe las consultas que referencian el identificador anterior."
        }
      ],
      "explanation": "Desplazar la validación hacia la izquierda (shift-left) en el CI del productor convierte una caída nocturna del pipeline en un aviso inmediato al autor del cambio."
    },
    {
      "id": "c3",
      "type": "mcq",
      "prompt": "En una capa semántica, defines una métrica de razón `ticket_promedio = revenue / orders_count`. ¿Cómo la calcula el motor cuando un usuario agrupa por `region` y otro agrupa por `trimestre`?",
      "options": [
        {
          "id": "a",
          "text": "Evalúa SUM(revenue) / NULLIF(SUM(orders), 0) en el nivel de agrupación solicitado en cada consulta.",
          "correct": true,
          "feedback": "Correcto: al declarar numerador y denominador como medidas base, el motor recalcula la razón agregando primero al grano pedido."
        },
        {
          "id": "b",
          "text": "Guarda un porcentaje precalculado fijo y hace AVG() de ese porcentaje.",
          "correct": false,
          "feedback": "Incorrecto: promediar razones precalculadas produce errores matemáticos ante volúmenes desiguales."
        },
        {
          "id": "c",
          "text": "Obliga a escribir una consulta SQL manual distinta en cada dashboard.",
          "correct": false,
          "feedback": "Incorrecto: justamente el propósito de la capa semántica es no repetir la fórmula en cada herramienta."
        }
      ],
      "explanation": "Declarar métricas compuestas a partir de medidas aditivas base permite que la capa semántica las proyecte en cualquier dimensión respetando la aditividad."
    }
  ],
  "practice": {
    "type": "fill-blanks",
    "title": "Contrato ODCS y métrica en MetricFlow",
    "language": "sql",
    "prompt": "Completa este archivo de gobernanza unificada para: 1) establecer en el Data Contract ODCS v3 que el conteo de valores negativos debe ser exactamente `0` (`mustBe: 0`), 2) declarar `order_id` como la entidad primaria (`primary`) del modelo semántico para impedir joins con fan-out, y 3) definir el ticket promedio (`aov_usd`) como una métrica de tipo `ratio` que divide `net_revenue_usd` entre `completed_orders`.",
    "starterCode": "# Parte A: Regla de Calidad en Data Contract (ODCS v3.0)\nschema:\n  - name: order_net_usd\n    logicalType: number\n    quality:\n      - type: sql\n        query: \"SELECT COUNT(*) FROM {table} WHERE order_net_usd < 0\"\n        {{blank_1}}: 0\n\n---\n# Parte B: Modelo y Métrica en Capa Semántica (MetricFlow)\nsemantic_models:\n  - name: orders_semantic\n    model: ref('fct_orders')\n    defaults:\n      agg_time_dimension: order_date\n    entities:\n      - name: order\n        type: {{blank_2}}\n        expr: order_id\n      - name: customer\n        type: foreign\n        expr: customer_id\n    measures:\n      - name: net_revenue_usd\n        agg: sum\n        expr: order_net_usd\n      - name: completed_orders\n        agg: count_distinct\n        expr: order_id\n\nmetrics:\n  - name: average_order_value_usd\n    label: \"Ticket Promedio Neto (AOV)\"\n    type: {{blank_3}}\n    type_params:\n      numerator: net_revenue_usd\n      denominator: completed_orders",
    "expected": "# Parte A: Regla de Calidad en Data Contract (ODCS v3.0)\nschema:\n  - name: order_net_usd\n    logicalType: number\n    quality:\n      - type: sql\n        query: \"SELECT COUNT(*) FROM {table} WHERE order_net_usd < 0\"\n        {{blank_1}}: 0\n\n---\n# Parte B: Modelo y Métrica en Capa Semántica (MetricFlow)\nsemantic_models:\n  - name: orders_semantic\n    model: ref('fct_orders')\n    defaults:\n      agg_time_dimension: order_date\n    entities:\n      - name: order\n        type: {{blank_2}}\n        expr: order_id\n      - name: customer\n        type: foreign\n        expr: customer_id\n    measures:\n      - name: net_revenue_usd\n        agg: sum\n        expr: order_net_usd\n      - name: completed_orders\n        agg: count_distinct\n        expr: order_id\n\nmetrics:\n  - name: average_order_value_usd\n    label: \"Ticket Promedio Neto (AOV)\"\n    type: {{blank_3}}\n    type_params:\n      numerator: net_revenue_usd\n      denominator: completed_orders",
    "orderMatters": true,
    "hints": [
      "ASERCION_ODCS: En la especificación ODCS v3.0, ¿qué clave de la regla de calidad indica que el resultado de la consulta SQL debe ser igual a 0?",
      "TIPO_ENTIDAD: Si cada fila de `fct_orders` representa un pedido único (`order_id`), ¿qué tipo de entidad es `order` en MetricFlow?",
      "TIPO_METRICA: ¿Qué tipo de métrica en MetricFlow calcula de forma segura `SUM(numerador) / COUNT_DISTINCT(denominador)` en cualquier nivel de agrupación?"
    ],
    "solution": "# Parte A: Regla de Calidad en Data Contract (ODCS v3.0)\nschema:\n  - name: order_net_usd\n    logicalType: number\n    quality:\n      - type: sql\n        query: \"SELECT COUNT(*) FROM {table} WHERE order_net_usd < 0\"\n        {{blank_1}}: 0\n\n---\n# Parte B: Modelo y Métrica en Capa Semántica (MetricFlow)\nsemantic_models:\n  - name: orders_semantic\n    model: ref('fct_orders')\n    defaults:\n      agg_time_dimension: order_date\n    entities:\n      - name: order\n        type: {{blank_2}}\n        expr: order_id\n      - name: customer\n        type: foreign\n        expr: customer_id\n    measures:\n      - name: net_revenue_usd\n        agg: sum\n        expr: order_net_usd\n      - name: completed_orders\n        agg: count_distinct\n        expr: order_id\n\nmetrics:\n  - name: average_order_value_usd\n    label: \"Ticket Promedio Neto (AOV)\"\n    type: {{blank_3}}\n    type_params:\n      numerator: net_revenue_usd\n      denominator: completed_orders",
    "solutionExplanation": "Aserciones ejecutables en contrato ODCS Declaración de entidades en grafo semántico Modelado de métricas de razón",
    "blanks": [
      {
        "id": "blank_1",
        "placeholder": "ASERCION_ODCS",
        "acceptedAnswers": [
          "mustBe",
          "must_be"
        ],
        "hint": "En la especificación ODCS v3.0, ¿qué clave de la regla de calidad indica que el resultado de la consulta SQL debe ser igual a 0?",
        "hints": [
          "Nivel 1 (Concepto): Expresa la condición \"debe ser igual a\" en camelCase dentro del bloque `quality` de ODCS.",
          "Nivel 2 (Sintaxis): Dos palabras en camelCase: must...",
          "Nivel 3 (Solución): Escribe mustBe"
        ]
      },
      {
        "id": "blank_2",
        "placeholder": "TIPO_ENTIDAD",
        "acceptedAnswers": [
          "primary",
          "PRIMARY"
        ],
        "hint": "Si cada fila de `fct_orders` representa un pedido único (`order_id`), ¿qué tipo de entidad es `order` en MetricFlow?",
        "hints": [
          "Nivel 1 (Concepto): Define la clave principal que identifica la granularidad (grain) de esta tabla.",
          "Nivel 2 (Sintaxis): En inglés, opuesto a `foreign`.",
          "Nivel 3 (Solución): Escribe primary"
        ]
      },
      {
        "id": "blank_3",
        "placeholder": "TIPO_METRICA",
        "acceptedAnswers": [
          "ratio",
          "RATIO"
        ],
        "hint": "¿Qué tipo de métrica en MetricFlow calcula de forma segura `SUM(numerador) / COUNT_DISTINCT(denominador)` en cualquier nivel de agrupación?",
        "hints": [
          "Nivel 1 (Concepto): Es el tipo de métrica no aditiva compuesta por un numerador y un denominador.",
          "Nivel 2 (Sintaxis): Palabra de 5 letras en inglés para \"proporción / razón\".",
          "Nivel 3 (Solución): Escribe ratio"
        ]
      }
    ],
    "expectedOutputTable": [
      {
        "contract_id": "urn:datacontract:novapay:orders",
        "odcs_quality_gate": "PASS (0 negative rows)",
        "semantic_metric": "average_order_value_usd (ratio)",
        "fanout_protection": "Active (Primary entity: order_id)"
      }
    ],
    "rubricCriteria": [
      {
        "criterion": "Aserciones ejecutables en contrato ODCS",
        "title": "Aserciones ejecutables en contrato ODCS",
        "description": "Define reglas de calidad verificables automáticamente (mustBe: 0) en el contrato de datos antes de permitir el paso a las capas analíticas.",
        "points": 30,
        "role": "DE"
      },
      {
        "criterion": "Declaración de entidades en grafo semántico",
        "title": "Declaración de entidades en grafo semántico",
        "description": "Distingue correctamente entre entidades primary y foreign para que el motor semántico prevenga joins con multiplicación de filas (Fan-Out).",
        "points": 35,
        "role": "BI"
      },
      {
        "criterion": "Modelado de métricas de razón",
        "title": "Modelado de métricas de razón",
        "description": "Modela KPIs de razón (como AOV o ARPU) mediante numerator y denominator separados en lugar de promediar porcentajes o ratios precalculados.",
        "points": 35,
        "role": "DA"
      }
    ]
  },
  "roleNotes": {
    "de": "Automatiza la validación de contratos ODCS v3 en los pipelines de CI/CD y configura pre-agregaciones declarativas (*Rollups / Caching* en Cube o tablas materializadas en Iceberg) para que la Capa Semántica responda en menos de 100 ms. Emite eventos **OpenLineage** que conectan cada contrato de entrada con los modelos SQLMesh/dbt y las métricas semánticas finales.",
    "da": "Define las métricas `ratio`, `cumulative` y `derived` en el repositorio de la Capa Semántica, asegurando que ratios como `ARPU` o `Tasa de Conversión` siempre sumen el numerador y dividan entre la suma del denominador. Importa las métricas gobernadas directamente en sus notebooks con el cliente Python de MetricFlow/Cube para evitar discrepancias entre estudios ad-hoc y reportes ejecutivos.",
    "bi": "Es el guardián funcional del catálogo de métricas certificadas: elimina medidas DAX/calculadas duplicadas en tableros aislados y las migra al código versionado de la Capa Semántica. Expone metadatos de confianza en cada dashboard (definición matemática, propietario del contrato ODCS y estado del SLA en tiempo real)."
  },
  "summary": [
    "Un contrato de datos formaliza tipos, grano, valores permitidos y SLA entre el productor y el almacén.",
    "Validar el contrato en CI evita que un cambio en backend rompa los pipelines a medianoche.",
    "La capa semántica define cada métrica una sola vez en código versionado para todos los consumidores.",
    "El motor semántico conoce las relaciones entre entidades y pre-agrega antes de unir para impedir fan-out."
  ],
  "flashcards": [
    {
      "id": "fc-de3-sem-01",
      "front": "¿Qué diferencia un contrato de datos ejecutable de una página de documentación en un wiki?",
      "back": "El contrato ejecutable es un archivo YAML/JSON validado automáticamente en el CI del productor y en la ingesta; un wiki queda desactualizado sin bloquear despliegues."
    },
    {
      "id": "fc-de3-sem-02",
      "front": "¿Qué hace un patrón de corte de circuito (circuit breaker) cuando el 15 % de un lote incumple el contrato?",
      "back": "Detiene la publicación hacia las tablas Silver/Gold, desvía las filas inválidas a cuarentena (dead-letter) y mantiene visible la última versión íntegra."
    },
    {
      "id": "fc-de3-sem-03",
      "front": "¿Cómo evita MetricFlow o Cube el fan-out cuando pides métricas de dos tablas con distinto grano?",
      "back": "Usa el grafo de entidades primarias y foráneas para agregar cada medida a su nivel común en subconsultas separadas antes de combinarlas."
    }
  ],
  "glossaryTerms": [
    "c19-data-contracts-odcs",
    "c21-semantic-layer"
  ],
  "sources": [
    {
      "title": "Bitol / Linux Foundation AI & Data — Open Data Contract Standard (ODCS v3)",
      "url": "https://bitol-io.github.io/open-data-contract-standard/latest/",
      "publisher": "Linux Foundation AI & Data",
      "accessed": "2026-10-29",
      "supports": "Especificación abierta de contratos de datos con esquema, reglas de calidad y acuerdos de servicio."
    },
    {
      "title": "dbt Documentation — Semantic Layer and MetricFlow Semantic Models",
      "url": "https://docs.getdbt.com/docs/build/semantic-models",
      "publisher": "dbt Labs",
      "accessed": "2026-10-29",
      "supports": "Definición de entidades, dimensiones y medidas gobernadas en MetricFlow."
    },
    {
      "title": "Cube Documentation — Data Modeling and Pre-Aggregations in a Semantic Layer",
      "url": "https://cube.dev/docs/product/data-modeling/overview",
      "publisher": "Cube Dev",
      "accessed": "2026-10-29",
      "supports": "Prevención de fan-out y exposición uniforme de métricas hacia BI y aplicaciones."
    }
  ],
  "aiNotes": "Recuerda que esta lección conecta Ingeniería de Datos (contratos en la entrada) y BI (capa semántica en la salida). Evita presentar el contrato como burocracia: es una prueba automática de esquema y rango.",
  "needsReview": true,
  "legacyId": "l12-contracts-semantic-layer",
  "legacyOrder": 12,
  "stageId": "stage-4",
  "subtitle": "Validación de esquemas en el origen y definición centralizada de métricas en MetricFlow y Cube.",
  "goal": "Crear Contratos de Datos ejecutables bajo el estándar abierto ODCS v3.0 y diseñar modelos en la Capa Semántica (MetricFlow / Cube) con entidades primarias/foráneas, medidas aditivas/no-aditivas y prevención automática de joins con fan-out.",
  "pipelineChallenge": {
    "title": "Cadena gobernada del microservicio a BI",
    "scenario": "Ordena en todas sus etapas los 5 eslabones de una arquitectura gobernada en 2026 cuando el equipo de producto lanza una nueva funcionalidad de suscripciones y quiere analizarla en BI y en el Agente IA:",
    "steps": [
      {
        "id": "step-1-odcs-contract-ci",
        "label": "1. Definición y validación del Data Contract (ODCS v3.0) en el CI/CD del microservicio productor antes de fusionar el código",
        "role": "DE",
        "detail": "Garantiza que el esquema, tipos, semántica y reglas de no-negatividad se cumplan desde el origen (Shift-Left)."
      },
      {
        "id": "step-2-iceberg-wap-ingest",
        "label": "2. Ingesta hacia Apache Iceberg v3 y transformación incremental en SQLMesh/dbt validando los audits del contrato en una rama WAP",
        "role": "DE",
        "detail": "Construye las tablas limpias `dim_customer_scd2` y `fct_subscriptions` en Silver/Gold con trazabilidad OpenLineage."
      },
      {
        "id": "step-3-semantic-model-entities",
        "label": "3. Declaración del Semantic Model en MetricFlow / Cube especificando entidades primarias/foráneas y dimensión temporal",
        "role": "BI",
        "detail": "Registra la granularidad exacta de cada tabla para que el motor bloquee cualquier intento de join con fan-out."
      },
      {
        "id": "step-4-governed-kpi-definitions",
        "label": "4. Creación de las métricas certificadas (MRR, NRR, ARPU como ratio) en el repositorio Git de la Capa Semántica",
        "role": "DA",
        "detail": "Establece una única fórmula matemática auditada por Finanzas, Producto y Análisis."
      },
      {
        "id": "step-5-universal-consumption",
        "label": "5. Consumo unificado desde dashboards BI-as-Code, notebooks Polars y Agentes IA (vía Servidor MCP) contra la Capa Semántica",
        "role": "BI",
        "detail": "Todos los canales Ejecutivos, Analíticos y Conversacionales devuelven exactamente el mismo número en milisegundos."
      }
    ],
    "explanation": "La gobernanza moderna empieza en el borde izquierdo con el Data Contract ODCS en el CI/CD del microservicio (1), continúa con la materialización atómica en Iceberg v3 mediante SQLMesh/dbt (2), define las relaciones de entidad en el modelo semántico para impedir errores de fan-out (3), formaliza las métricas aditivas y de ratio en código (4) y finalmente sirve ese único cálculo a BI, Python y Agentes MCP (5)."
  },
  "relatedLessons": [
    {
      "id": "l1-joins-fanout",
      "reason": "Comprende cómo las entidades primary y foreign de la Capa Semántica eliminan automáticamente el Fan-Out Trap visto en la Lección 1."
    },
    {
      "id": "l6-metrics-simpson",
      "reason": "Conecta el diseño conceptual de árboles de KPIs y métricas no aditivas con su implementación en código YAML de MetricFlow."
    },
    {
      "id": "l18-mcp-semantic-ai-rag",
      "reason": "Descubre cómo exponer esta misma Capa Semántica a agentes de IA mediante un Servidor MCP para lograr Text-to-Semantic-Layer sin alucinaciones."
    }
  ]
};

export default lesson;
