// Lección migrada al esquema v2 mediante scripts/migrate-legacy.mjs
const lesson = {
  "id": "de3-transformacion-01-dbt-sqlmesh-dag",
  "moduleId": "de3-transformacion",
  "tracks": [
    "de"
  ],
  "level": 3,
  "order": 1,
  "title": "Transformación declarativa con dbt y SQLMesh",
  "minutes": 30,
  "prerequisites": [
    "de3-lakehouse-01-iceberg-v3-medallion"
  ],
  "contentVersion": 1,
  "hook": "En Mercado Brisa (empresa ficticia), las transformaciones analíticas vivían en 18 procedimientos almacenados de 2 000 líneas ejecutados por cron a las 03:00. Nadie sabía en qué orden corrían y un filtro incremental `WHERE event_ts > (SELECT MAX(event_ts) FROM destino)` dejó un hueco de seis horas cuando un servicio entregó pedidos con retraso. Al migrar a un grafo declarativo (staging → intermediate → marts) con seguimiento de intervalos por estado, los huecos desaparecieron. ¿Cómo garantizan dbt y SQLMesh transformaciones idempotentes?",
  "objectives": [
    "Estructurar un proyecto de transformación en capas modulares: staging (1:1 con fuentes), intermediate y marts.",
    "Reemplazar cargas incrementales ingenuas (`MAX(ts)`) por ventanas con retroceso (lookback) o intervalos de estado.",
    "Utilizar análisis sintáctico SQL y entornos virtuales basados en vistas para validar cambios sin duplicar terabytes."
  ],
  "sections": [
    {
      "id": "de-procedimientos-almacenados-a-grafos-modulares",
      "heading": "De procedimientos almacenados a grafos modulares (DAG)",
      "body": "El principio central de la ingeniería de transformación moderna (popularizado por **dbt** y evolucionado por **SQLMesh**) es que toda transformación debe ser una sentencia `SELECT` declarativa, pura, idempotente y versionada en Git. El motor construye automáticamente el **DAG (Grafo Acíclico Dirigido)** de dependencias y lo organiza en tres capas disciplinadas:\n• **Staging (`stg_`)**: Relación 1:1 con las tablas fuente de Bronze. Solo renombra columnas al estándar de la empresa, aplica conversiones de tipos (`CAST`), limpia strings vacíos y deduplica por clave primaria. Cero joins complejos ni agregaciones.\n• **Intermediate (`int_`)**: Piezas modulares de lógica de negocio que unen múltiples modelos de Staging, resuelven intervalos temporales SCD2 o prorratean importes antes de exponerlos.\n• **Marts / Gold (`fct_` y `dim_`)**: Tablas de Hechos y Dimensiones listas para las áreas de negocio (`finance`, `product`, `growth`) y conectadas a la Capa Semántica.",
      "interactive": {
        "component": "dbt-sqlmesh-dag-explorer",
        "caption": "Simulador interactivo: Transformación declarativa con dbt y SQLMesh"
      }
    },
    {
      "id": "modelos-incrementales-frente-al-estado-por-inter",
      "heading": "Modelos incrementales frente al estado por intervalos",
      "body": "El patrón incremental tradicional en SQL (`WHERE event_date > (SELECT MAX(event_date) FROM {{ this }})`) tiene tres defectos graves en producción:\n1) Si llegan datos tardíos de hace 2 días mientras ya entró un evento de hoy, `MAX(event_date)` es hoy y los datos de hace 2 días se ignoran por completo.\n2) Si el trabajo de ayer miércoles falló pero el de hoy jueves corrió, queda un hueco (\"data gap\") permanente el miércoles que nadie detecta.\n3) Si necesitas reprocesar solo el mes de agosto porque hubo un error en una tarifa, tienes que ejecutar un `--full-refresh` de los últimos 5 años o escribir parches manuales peligrosos.\n**SQLMesh** resuelve esto mediante **State-Based Interval Tracking** (`INCREMENTAL_BY_TIME_RANGE`): divide la línea del tiempo en intervalos discretos (horas o días) y registra en su base de estado exactamente qué intervalos han sido calculados para cada versión de cada modelo. Si falta el miércoles 14 de octubre, recalcula únicamente ese intervalo usando las variables inyectadas `@start_ts` y `@end_ts`.",
      "example": {
        "language": "sql",
        "code": "MODEL (\n  name silver.fct_payments,\n  kind INCREMENTAL_BY_TIME_RANGE (\n    time_column payment_date,\n    batch_size 30,\n    lookback 2\n  ),\n  owner 'revenue-analytics@novapay.io',\n  cron '@hourly',\n  grain (payment_id),\n  audits (\n    not_null(columns := (payment_id, customer_id, payment_date, amount_usd)),\n    unique_values(columns := (payment_id)),\n    accepted_range(column := amount_usd, min_v := 0.0, max_v := 500000.0)\n  )\n);\n\nSELECT\n  payment_id,\n  customer_id,\n  CAST(event_ts AS DATE) AS payment_date,\n  ROUND(amount_cents / 100.0, 2) AS amount_usd\nFROM bronze.raw_payments\nWHERE event_ts BETWEEN @start_ts AND @end_ts\nQUALIFY ROW_NUMBER() OVER (PARTITION BY payment_id ORDER BY ingested_at DESC) = 1;",
        "expectedOutput": [
          {
            "eventos_tardios_2h": "Capturados al 100% gracias a lookback = 2 e idempotencia por rango",
            "fallo_dia_intermedio": "Detectado y rellenado automáticamente por el registro de intervalos",
            "costo_deploy_pr_a_prod": "0 seg en Prod (Promoción instantánea de puntero de vista)"
          }
        ]
      }
    },
    {
      "id": "analisis-sintactico-de-sql-mediante-ast-sqlglot-",
      "heading": "Análisis sintáctico de SQL mediante AST (SQLGlot) y linaje de columnas",
      "body": "Una plantilla Jinja tradicional trata tu consulta SQL como texto plano: no sabe si cambiaste un comentario, añadiste una columna nueva o alteraste la fórmula de un `WHERE`. En cambio, **SQLMesh** incorpora **SQLGlot**, un parser y transpilador que convierte cada consulta SQL en un **Árbol Sintáctico Abstracto (AST)** antes de enviarla a la base de datos.\nGracias al AST, la plataforma:\n• Detecta errores de sintaxis, tipos incompatibles y referencias a columnas inexistentes en milisegundos localmente, antes de gastar un centavo en el almacén cloud.\n• Construye **Linaje a Nivel de Columna (Column-Level Lineage)** automático a través de decenas de tablas.\n• Clasifica semánticamente cada cambio en tu Pull Request como **Breaking** (modificaste la lógica de un filtro o de una columna usada por 10 tablas hijas) vs. **Non-Breaking / Forward-Only** (solo añadiste una columna nueva al final que ninguna tabla hija usa todavía, por lo que no hace falta recalcular las 10 tablas hijas)."
    },
    {
      "id": "entornos-virtuales-de-datos-mediante-vistas-y-pr",
      "heading": "Entornos virtuales de datos mediante vistas y promoción sin recálculo",
      "body": "¿Cómo probar cambios sin duplicar terabytes entre `dev`, `staging` y `prod`? Mediante **Entornos Virtuales de Datos**:\n• Cada vez que modificas un modelo SQL, se calcula una huella criptográfica (*fingerprint*) de su AST y sus dependencias, creando una tabla física versionada en la capa interna (ej. `sqlmesh__silver__fct_orders__398a1f`).\n• Los entornos (`prod`, `dev_ana`, `pr_412`) son simplemente esquemas de **Vistas Ligeras** que apuntan a las tablas físicas correspondientes.\n• Si en tu rama `pr_412` solo modificaste 1 de los 240 modelos y el cambio es *Non-Breaking*, SQLMesh ejecuta el cálculo de ese único modelo para un rango de muestra y apunta las otras 239 vistas directamente a las tablas físicas ya calculadas en `prod` (Zero-Copy).\n• Cuando haces merge a `main`, **promover a producción no recalcula nada**: simplemente actualiza el puntero de la vista `prod.fct_orders` hacia la tabla física ya validada en el PR. Y si hay una alerta en BI, hacer rollback al estado anterior tarda menos de 1 segundo."
    }
  ],
  "workedExample": {
    "title": "Ejemplo guiado: Transformación declarativa con dbt y SQLMesh",
    "description": "Compara el peligroso patrón incremental basado en `MAX(timestamp)` frente a un modelo declarativo por intervalos temporales con auditorías integradas y AST validado:",
    "audit": "",
    "steps": [
      {
        "label": "Antipatrón: modelo incremental con MAX(event_ts) sin auditoría",
        "explanation": "Compara el peligroso patrón incremental basado en `MAX(timestamp)` frente a un modelo declarativo por intervalos temporales con auditorías integradas y AST validado:",
        "code": "-- FRÁGIL: Si un día falla en un 50% o llegan eventos con 2 horas de retraso,\n-- el filtro MAX(event_ts) salta esos registros por completo y corrompe los totales financieros.\n{{ config(materialized='incremental', unique_key='payment_id') }}\n\nSELECT\n  payment_id,\n  customer_id,\n  CAST(event_ts AS DATE) AS payment_date,\n  amount_cents / 100.0 AS amount_usd\nFROM {{ source('bronze', 'raw_payments') }}\n{% if is_incremental() %}\n  WHERE event_ts > (SELECT MAX(event_ts) FROM {{ this }})\n{% endif %};",
        "expectedOutput": [
          {
            "eventos_tardios_2h": "Perdidos silenciosamente (No recarga ventana de lookback)",
            "fallo_dia_intermedio": "Deja hueco permanente en la serie temporal",
            "costo_deploy_pr_a_prod": "Recalcula en Dev y vuelve a recalcular en Prod (Doble gasto)"
          }
        ]
      },
      {
        "label": "Solución óptima: modelo incremental por intervalo con auditoría",
        "explanation": "Compara ahora la consulta corregida y verifica cómo las filas y totales coinciden con la auditoría.",
        "code": "MODEL (\n  name silver.fct_payments,\n  kind INCREMENTAL_BY_TIME_RANGE (\n    time_column payment_date,\n    batch_size 30,\n    lookback 2\n  ),\n  owner 'revenue-analytics@novapay.io',\n  cron '@hourly',\n  grain (payment_id),\n  audits (\n    not_null(columns := (payment_id, customer_id, payment_date, amount_usd)),\n    unique_values(columns := (payment_id)),\n    accepted_range(column := amount_usd, min_v := 0.0, max_v := 500000.0)\n  )\n);\n\nSELECT\n  payment_id,\n  customer_id,\n  CAST(event_ts AS DATE) AS payment_date,\n  ROUND(amount_cents / 100.0, 2) AS amount_usd\nFROM bronze.raw_payments\nWHERE event_ts BETWEEN @start_ts AND @end_ts\nQUALIFY ROW_NUMBER() OVER (PARTITION BY payment_id ORDER BY ingested_at DESC) = 1;",
        "expectedOutput": [
          {
            "eventos_tardios_2h": "Capturados al 100% gracias a lookback = 2 e idempotencia por rango",
            "fallo_dia_intermedio": "Detectado y rellenado automáticamente por el registro de intervalos",
            "costo_deploy_pr_a_prod": "0 seg en Prod (Promoción instantánea de puntero de vista)"
          }
        ]
      }
    ]
  },
  "checks": [
    {
      "id": "c1",
      "type": "mcq",
      "prompt": "Modificas un modelo intermedio `int_orders` que alimenta a 15 tablas Gold de 1 TB cada una. El único cambio que hiciste fue agregar una columna nueva `discount_coupon_code` que solo será usada por 1 de las 15 tablas Gold. ¿Cómo actúa SQLMesh al crear tu entorno de desarrollo?",
      "options": [
        {
          "id": "a",
          "text": "Al analizar el AST y el linaje por columna, clasifica el cambio como Non-Breaking (aditivo): recalcula únicamente `int_orders` y la única tabla Gold que usa la nueva columna, mientras que las otras 14 tablas Gold en tu entorno dev apuntan directamente a las tablas físicas de producción sin recalcularse.",
          "correct": true,
          "feedback": "Exacto. El análisis semántico del AST con SQLGlot junto a los Entornos Virtuales evita recalcular los otros 14 TB que no sufrieron ningún cambio lógico."
        },
        {
          "id": "b",
          "text": "Clona físicamente los 15 TB completos de producción en tu esquema `dev_usuario` antes de dejarte ejecutar una sola consulta.",
          "correct": false,
          "feedback": "Clonar todas las tablas hijas sin distinguir cambios aditivos es el antipatrón costoso que los Entornos Virtuales de Datos eliminan."
        },
        {
          "id": "c",
          "text": "Ignora el cambio y no crea la columna `discount_coupon_code` hasta que borres manualmente toda la base de datos de producción.",
          "correct": false,
          "feedback": "El motor sí materializa la nueva versión de `int_orders` con la nueva columna y la expone de inmediato en tu entorno virtual."
        }
      ],
      "explanation": "Exacto. El análisis semántico del AST con SQLGlot junto a los Entornos Virtuales evita recalcular los otros 14 TB que no sufrieron ningún cambio lógico."
    },
    {
      "id": "c2",
      "type": "mcq",
      "prompt": "Un modelo incremental en dbt procesa pedidos diarios, pero los pagos con tarjeta pueden tardar hasta 48 horas en confirmar su estado final. ¿Cómo configuras el filtro incremental para no perder esas actualizaciones?",
      "options": [
        {
          "id": "a",
          "text": "Aplicar una ventana deslizante de retroceso (lookback de 3 días) con estrategia MERGE o DELETE+INSERT por clave única.",
          "correct": true,
          "feedback": "Correcto: reprocesar los últimos 3 días con clave única actualiza los pedidos tardíos de forma idempotente."
        },
        {
          "id": "b",
          "text": "Filtrar únicamente WHERE created_at > (SELECT MAX(created_at) FROM {{ this }}) con modo append.",
          "correct": false,
          "feedback": "Incorrecto: append sin retroceso ignora cambios posteriores y si reprocesas duplica filas."
        },
        {
          "id": "c",
          "text": "Borrar manualmente la tabla en producción cada mañana.",
          "correct": false,
          "feedback": "Incorrecto: pierde las ventajas de una carga incremental sobre tablas históricas grandes."
        }
      ],
      "explanation": "Combinar una clave única (`unique_key`) con una ventana de retroceso (`lookback`) asegura que los eventos retrasados actualicen su registro sin generar duplicados."
    },
    {
      "id": "c3",
      "type": "mcq",
      "prompt": "¿Por qué no se recomienda hacer un `JOIN` directo contra una tabla cruda `raw.orders` desde cinco modelos `mart_` distintos?",
      "options": [
        {
          "id": "a",
          "text": "Porque duplica las reglas de limpieza y casteo en cinco sitios; debe existir un único modelo stg_orders como puerta de entrada.",
          "correct": true,
          "feedback": "Correcto: centralizar la limpieza en stg_orders garantiza que cualquier cambio en la fuente se corrija en un solo archivo."
        },
        {
          "id": "b",
          "text": "Porque el motor SQL prohíbe leer el esquema raw más de una vez.",
          "correct": false,
          "feedback": "Incorrecto: es una regla de arquitectura y mantenibilidad del grafo, no una limitación del motor SQL."
        },
        {
          "id": "c",
          "text": "Porque las tablas raw no tienen columnas de texto.",
          "correct": false,
          "feedback": "Incorrecto: las tablas raw suelen tener texto y JSON sin tipar, razón por la cual pasan primero por staging."
        }
      ],
      "explanation": "La relación 1:1 entre fuente cruda y modelo `stg_` aísla al resto del grafo de renombres o cambios de formato en los sistemas transaccionales."
    }
  ],
  "practice": {
    "type": "sql",
    "title": "Modelo de staging idempotente: deduplicación de payments",
    "language": "sql",
    "prompt": "La tabla `payments` contiene reenvíos duplicados de webhooks con el mismo `idempotency_key`. Construye una consulta con una CTE `stg_payments_dedup` que conserve solo el primer registro por `idempotency_key` (`QUALIFY ROW_NUMBER() OVER (PARTITION BY idempotency_key ORDER BY payment_ts ASC) = 1`) y agregue los cobros `status = 'captured'` por `payment_method`.",
    "starterCode": "WITH stg_payments_dedup AS (\n  SELECT\n    payment_id,\n    order_id,\n    payment_method,\n    status,\n    amount_usd,\n    payment_ts,\n    idempotency_key\n  FROM payments\n  -- TODO: Filtra duplicados con QUALIFY ROW_NUMBER() OVER (PARTITION BY idempotency_key ORDER BY payment_ts ASC) = 1\n)\nSELECT\n  payment_method,\n  COUNT(*) AS captured_payments,\n  ROUND(SUM(amount_usd), 2) AS captured_volume_usd\nFROM stg_payments_dedup\nWHERE status = 'captured'\nGROUP BY payment_method\nORDER BY captured_volume_usd DESC;",
    "expected": "WITH stg_payments_dedup AS (\n  SELECT\n    payment_id,\n    order_id,\n    payment_method,\n    status,\n    amount_usd,\n    payment_ts,\n    idempotency_key\n  FROM payments\n  QUALIFY ROW_NUMBER() OVER (\n    PARTITION BY idempotency_key\n    ORDER BY payment_ts ASC\n  ) = 1\n)\nSELECT\n  payment_method,\n  COUNT(*) AS captured_payments,\n  ROUND(SUM(amount_usd), 2) AS captured_volume_usd\nFROM stg_payments_dedup\nWHERE status = 'captured'\nGROUP BY payment_method\nORDER BY captured_volume_usd DESC;",
    "orderMatters": true,
    "hints": [
      "En `stg_payments_dedup`, añade `QUALIFY ROW_NUMBER() OVER (PARTITION BY idempotency_key ORDER BY payment_ts ASC) = 1` después de `FROM payments`.",
      "Sin la deduplicación por `idempotency_key`, las 450 filas duplicadas por reenvío de webhook inflan `captured_payments` y `captured_volume_usd`.",
      "Mantén el filtro `WHERE status = 'captured'` y `ORDER BY captured_volume_usd DESC`."
    ],
    "solution": "WITH stg_payments_dedup AS (\n  SELECT\n    payment_id,\n    order_id,\n    payment_method,\n    status,\n    amount_usd,\n    payment_ts,\n    idempotency_key\n  FROM payments\n  QUALIFY ROW_NUMBER() OVER (\n    PARTITION BY idempotency_key\n    ORDER BY payment_ts ASC\n  ) = 1\n)\nSELECT\n  payment_method,\n  COUNT(*) AS captured_payments,\n  ROUND(SUM(amount_usd), 2) AS captured_volume_usd\nFROM stg_payments_dedup\nWHERE status = 'captured'\nGROUP BY payment_method\nORDER BY captured_volume_usd DESC;",
    "solutionExplanation": "En la capa `stg_payments_dedup` se aplica deduplicación determinista por `idempotency_key` mediante `QUALIFY ROW_NUMBER() OVER (PARTITION BY idempotency_key ORDER BY payment_ts ASC) = 1`, eliminando los 450 webhooks repetidos antes de agregar en la capa intermedia."
  },
  "roleNotes": {
    "de": "Diseña modelos `INCREMENTAL_BY_TIME_RANGE` con `batch_size` y `lookback` configurados para absorber eventos tardíos de forma idempotente sin hacer full-refresh. Utiliza la transpilación de SQLGlot para ejecutar tests unitarios SQL en memoria con DuckDB en el servidor de CI/CD en menos de 3 segundos antes de desplegar sobre Iceberg / Snowflake / Databricks.",
    "da": "Inspecciona el Linaje a Nivel de Columna antes de alterar una regla de atribución o limpieza para verificar qué modelos de Machine Learning y qué métricas de BI se verán afectados. Define `audits` estadísticos y pruebas unitarias con datos semilla (`seeds`) que validan casos borde (reembolsos parciales, años bisiestos, clientes con múltiples monedas).",
    "bi": "Se beneficia de despliegues Blue-Green atómicos (intercambio de punteros de vistas en el entorno `prod`), eliminando las ventanas de mantenimiento donde los dashboards mostraban tablas vacías mientras se reconstruían. Compara en el Pull Request el diff automático de métricas de negocio (`prod` vs `dev`) antes de aprobar cambios en el DAG."
  },
  "summary": [
    "Cada modelo declarativo es una sentencia SELECT pura; la herramienta gestiona el DDL y el grafo (DAG).",
    "La capa staging renombra y tipa 1:1 sin agregar ni unir; intermediate aplica reglas; marts expone al negocio.",
    "El patrón WHERE ts > MAX(ts) pierde eventos tardíos si no incluye ventana de retroceso o control por intervalos.",
    "Los entornos virtuales evitan clonar tablas no modificadas al validar un Pull Request."
  ],
  "flashcards": [
    {
      "id": "fc-de3-dbt-01",
      "front": "¿Qué operaciones están permitidas y cuáles deben evitarse en la capa `staging` (`stg_`)?",
      "back": "Permitidas: renombrar columnas, castear tipos, limpiar cadenas y deduplicar 1:1. Evitar: JOINs entre fuentes o agregaciones que cambien el grano."
    },
    {
      "id": "fc-de3-dbt-02",
      "front": "¿Por qué `WHERE event_ts > (SELECT MAX(event_ts) FROM destino)` pierde datos en la vida real?",
      "back": "Porque si un evento con timestamp de las 09:50 llega a las 10:05 después de que ya entró un evento de las 10:00, queda por debajo del MAX y se ignora para siempre."
    },
    {
      "id": "fc-de3-dbt-03",
      "front": "¿Para qué sirve parsear el árbol sintáctico (AST) con SQLGlot antes de ejecutar un modelo en la nube?",
      "back": "Detecta errores de sintaxis, extrae el linaje exacto de columnas y calcula una huella semántica para saber qué modelos aguas abajo se ven afectados."
    }
  ],
  "glossaryTerms": [
    "c20-sqlmesh-dbt-dag",
    "c17-medallion-architecture"
  ],
  "sources": [
    {
      "title": "dbt Labs Best Practices — How We Structure Our dbt Projects (Staging, Intermediate, Marts)",
      "url": "https://docs.getdbt.com/best-practices/how-we-structure/1-guide-overview",
      "publisher": "dbt Labs",
      "accessed": "2026-10-29",
      "supports": "Organización modular del DAG en capas staging, intermediate y marts."
    },
    {
      "title": "dbt Documentation — Configure Incremental Models and Late-Arriving Data",
      "url": "https://docs.getdbt.com/docs/build/incremental-models",
      "publisher": "dbt Labs",
      "accessed": "2026-10-29",
      "supports": "Estrategias incrementales (merge, delete+insert) y ventanas de retroceso para eventos tardíos."
    },
    {
      "title": "SQLMesh Documentation — Virtual Data Environments and Interval State Tracking",
      "url": "https://sqlmesh.readthedocs.io/en/stable/concepts/overview/",
      "publisher": "Tobiko Data",
      "accessed": "2026-10-29",
      "supports": "Seguimiento de intervalos procesados y entornos virtuales sin copia de tablas."
    }
  ],
  "aiNotes": "Insiste en que un modelo `stg_` nunca debe cambiar el grano ni hacer agregaciones, y explica con un ejemplo numérico en una línea temporal por qué `MAX(event_ts)` falla ante retrasos de red.",
  "needsReview": true,
  "legacyId": "l11-dbt-sqlmesh-dag",
  "legacyOrder": 11,
  "stageId": "stage-4",
  "subtitle": "Grafos de dependencias SQL, análisis sintáctico de consultas y entornos virtuales sobre vistas.",
  "goal": "Evaluar arquitecturas de transformación de datos comparando el enfoque basado en plantillas Jinja (dbt) frente al análisis de Árbol Sintáctico Abstracto (AST con SQLGlot) y Entornos Virtuales de Datos (SQLMesh), diseñando cargas incrementales idempotentes por rangos temporales.",
  "pipelineChallenge": {
    "title": "Entorno virtual de datos en SQLMesh",
    "scenario": "Un analista añade una nueva columna calculada `net_expansion_usd` en un modelo intermedio. Ordena los 5 pasos exactos que ejecuta el motor moderno de transformación desde el cambio en código hasta su publicación en producción:",
    "steps": [
      {
        "id": "step-1-ast-parse",
        "label": "1. Parseo del SQL a un Árbol Sintáctico Abstracto (AST) con SQLGlot y cálculo de huella digital (Fingerprint)",
        "role": "DE",
        "detail": "Valida tipos, sintaxis y linaje a nivel de columna localmente sin ejecutar consultas pesadas en la nube."
      },
      {
        "id": "step-2-change-classification",
        "label": "2. Clasificación semántica del cambio (Breaking vs. Non-Breaking) comparando el AST nuevo contra producción",
        "role": "DE",
        "detail": "Detecta que añadir `net_expansion_usd` no altera las columnas existentes que consumen los otros 20 modelos hijos."
      },
      {
        "id": "step-3-virtual-env-backfill",
        "label": "3. Creación del Entorno Virtual Dev (`dev_pr`): materializa solo el modelo modificado y reutiliza vía vistas las 20 tablas hijas de Prod",
        "role": "DA",
        "detail": "Evita clonar o recalcular terabytes innecesarios; el entorno completo queda listo en segundos."
      },
      {
        "id": "step-4-unit-and-audit-tests",
        "label": "4. Ejecución de Unit Tests SQL en DuckDB y Audits estadísticos sobre los intervalos calculados en el entorno virtual",
        "role": "DA",
        "detail": "Comprueba que la fórmula de expansión neta cumple todos los casos borde y conciliaciones financieras."
      },
      {
        "id": "step-5-pointer-swap-prod",
        "label": "5. Promoción Virtual a Producción (Plan Apply): intercambia el puntero de la vista `prod` hacia la tabla física ya validada en 0 segundos",
        "role": "BI",
        "detail": "Cero doble cómputo al hacer merge a main y capacidad de rollback instantáneo si negocio lo solicita."
      }
    ],
    "explanation": "La ventaja competitiva de los Entornos Virtuales de Datos radica en analizar primero el AST con SQLGlot (1), clasificar el radio de impacto real por columna (2), calcular los intervalos afectados una única vez en el entorno virtual reutilizando el resto en Zero-Copy (3), auditar los resultados (4) y promover a producción intercambiando punteros de vistas sin volver a pagar cómputo (5)."
  },
  "relatedLessons": [
    {
      "id": "l10-iceberg-v3-medallion",
      "reason": "Las tablas físicas versionadas que gestionan dbt y SQLMesh se almacenan sobre Apache Iceberg v3."
    },
    {
      "id": "l12-contracts-semantic-layer",
      "reason": "Conecta los modelos Marts/Gold del DAG directamente con Data Contracts (ODCS) y la Capa Semántica."
    },
    {
      "id": "l5-scd2-history",
      "reason": "Automatiza la generación de dimensiones históricas SCD Tipo 2 dentro de tu DAG de transformación."
    }
  ]
};

export default lesson;
