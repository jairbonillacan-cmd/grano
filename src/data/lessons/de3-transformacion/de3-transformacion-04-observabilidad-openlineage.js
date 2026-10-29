export const lesson = {
  id: 'de3-transformacion-04-observabilidad-openlineage',
  title: 'Observabilidad de datos y linaje con OpenLineage',
  subtitle: 'Observabilidad de datos y trazabilidad de extremo a extremo con OpenLineage',
  module: 'de3-transformacion',
  moduleId: 'de3-transformacion',
  contentVersion: 2,
  order: 4,
  minutes: 25,
  tracks: ['de'],
  level: 3,
  prerequisites: ['de3-transformacion-03-contracts-semantic-layer'],
  needsReview: false,
  hook: 'Todos los tests de unicidad y los contratos de esquema de Mercado Brisa aprueban en verde, pero el embudo semanal muestra una caída repentina de compras atribuidas y desplaza eventos nocturnos al día siguiente. Al perfilar la tabla events, notas que el 80 % de los registros llegan con husos horarios locales en lugar de UTC y que 6,715 eventos carecen de customer_id. ¿Cómo instrumentas observabilidad continua y linaje con OpenLineage para aislar la causa raíz en minutos?',
  objectives: [
    'Monitorear los cuatro pilares de la observabilidad de datos (frescura, volumen, distribución y esquema) mediante perfiles SQL automatizados.',
    'Modelar metadatos operativos bajo el estándar OpenLineage articulando las entidades `Job`, `Run`, `Dataset` y sus estados de ciclo de vida.',
    'Construir consultas de telemetría compatibles con `DataQualityMetricsInputDatasetFacet` y `ColumnLineageDatasetFacet` para análisis de impacto y causa raíz.',
  ],
  sections: [
    {
      id: 'sec-de3-t04-pillars',
      heading: 'Los cuatro pilares de la observabilidad de datos',
      body: 'Las pruebas unitarias y las auditorías bloqueantes verifican invariantes conocidas, pero no detectan degradaciones graduales ni fallos silenciosos aguas arriba. Si una actualización móvil deja de enviar el identificador de cliente en el 10 % de las sesiones sin romper ninguna restricción `NOT NULL`, las pruebas estáticas seguirán aprobando.\n\nLa **observabilidad de datos** complementa las pruebas binarias vigilando de forma continua la salud del sistema sobre cuatro pilares cuantitativos. La **frescura** (*Freshness*) mide el desfase temporal entre el último evento registrado (`MAX(event_ts)`) y el reloj actual. El **volumen** (*Volume*) monitorea el conteo de filas por ventana o partición para detectar caídas bruscas o duplicaciones.\n\nPor su parte, la **distribución** (*Distribution*) sigue la evolución de tasas de nulidad (`null_rate`), cardinalidad y cuantiles numéricos. Finalmente, el control de **esquema y linaje** (*Schema & Lineage*) registra los cambios estructurales y conecta cada activo con sus productores y consumidores.',
      callout: 'Un test responde si una tabla cumple una regla fija hoy; la observabilidad detecta cuándo el comportamiento estadístico del flujo se desvía de su línea base histórica.',
      example: {
        language: 'sql',
        code: `-- Monitor de distribución de husos horarios en la tabla events (65,000 filas)
SELECT
  timezone_offset,
  COUNT(*) AS event_rows,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) AS share_pct
FROM events
GROUP BY timezone_offset
ORDER BY event_rows DESC, timezone_offset ASC;`,
        explanation:
          'El perfil de distribución revela que solo el 20 % de `events` (`13,000` filas) viene normalizado en UTC (`Z`), mientras que el 80 % restante (`52,000` filas) conserva desplazamientos locales (`-06:00`, `-05:00`, `-03:00`, `+01:00`).',
      },
    },
    {
      id: 'sec-de3-t04-openlineage',
      heading: 'El estándar OpenLineage: modelo de objetos y eventos',
      body: 'En una plataforma moderna, los datos atraviesan ingestores CDC, motores Spark, modelos dbt o SQLMesh, tablas Apache Iceberg y tableros BI. Si cada herramienta guarda su propio formato de bitácora, reconstruir la trazabilidad de extremo a extremo resulta inviable.\n\n**OpenLineage** (estándar abierto de la Linux Foundation AI & Data, con **Marquez** como servidor de referencia) soluciona esta fragmentación mediante un protocolo JSON emitido en tiempo de ejecución. Su modelo se articula en tres entidades centrales.\n\nUn **Job** representa el proceso o consulta recurrente que consume y produce activos (`mercado_brisa.dbt.fct_orders`). Un **Dataset** representa cualquier tabla, vista o flujo leído (`inputs`) o escrito (`outputs`). Un **Run** identifica una ejecución concreta mediante un UUID y emite eventos asíncronos (`RunEvent`) al pasar por los estados `START`, `RUNNING`, `COMPLETE`, `FAIL` o `ABORT`.',
      callout: 'OpenLineage no espera a escaneos nocturnos del catálogo: emite el linaje y las métricas en el instante exacto en que cada tarea inicia y finaliza su ejecución.',
      example: {
        language: 'sql',
        code: `-- Perfil de frescura y volumen por dataset para emitir en RunEvent COMPLETE
SELECT
  'events' AS dataset_name,
  COUNT(*) AS row_count,
  CAST(MIN(CAST(event_ts AS DATE)) AS VARCHAR) AS min_date,
  CAST(MAX(CAST(event_ts AS DATE)) AS VARCHAR) AS max_date
FROM events
UNION ALL
SELECT
  'payments',
  COUNT(*),
  CAST(MIN(CAST(payment_ts AS DATE)) AS VARCHAR),
  CAST(MAX(CAST(payment_ts AS DATE)) AS VARCHAR)
FROM payments
UNION ALL
SELECT
  'orders',
  COUNT(*),
  CAST(MIN(order_date) AS VARCHAR),
  CAST(MAX(order_date) AS VARCHAR)
FROM orders
ORDER BY row_count DESC;`,
        explanation:
          'Este resumen proporciona las métricas de volumen (`65,000`, `19,200` y `18,000` filas) y marcas de frescura (`max_date = 2025-11-26`) que el colector OpenLineage adjunta al cerrar cada corrida.',
      },
    },
    {
      id: 'sec-de3-t04-facets',
      heading: 'Facetas de linaje de columna y telemetría de calidad',
      body: 'La extensibilidad de OpenLineage descansa en sus **Facetas** (*Facets*): documentos JSON modulares que se adjuntan a un `Run`, `Job` o `Dataset` para describir una propiedad técnica.\n\nLa faceta **`ColumnLineageDatasetFacet`** registra para cada columna de salida qué campos de entrada intervinieron en su cálculo. Clasifica cada dependencia en dos categorías. Es **`DIRECT`** cuando el valor proviene directamente del campo origen, como proyectar o sumar `events.customer_id`. Es **`INDIRECT`** cuando la columna origen no se proyecta pero condiciona las filas mediante filtros `WHERE`, `JOIN`, `GROUP BY` o `QUALIFY`.\n\nPor otro lado, **`DataQualityMetricsInputDatasetFacet`** adjunta las estadísticas recolectadas en la corrida: `rowCount` total y, por columna, `nullCount`, `distinctCount`, `min`, `max` y cuantiles. Combinando ambas facetas en el grafo, el equipo realiza **análisis de causa raíz (*upstream*)** para localizar qué fuente introdujo nulos y **análisis de impacto (*downstream*)** para identificar los reportes afectados.',
      callout: 'Distinguir linaje DIRECT (columnas proyectadas) de INDIRECT (columnas en filtros WHERE, JOIN o QUALIFY) es vital: un cambio en una columna de filtro puede vaciar una tabla aunque no aparezca en el SELECT.',
      example: {
        language: 'sql',
        code: `-- Métricas para DataQualityMetricsInputDatasetFacet en events por dispositivo
SELECT
  device_type,
  COUNT(*) AS total_events,
  SUM(CASE WHEN customer_id IS NULL THEN 1 ELSE 0 END) AS null_customer_rows,
  ROUND(100.0 * SUM(CASE WHEN customer_id IS NULL THEN 1 ELSE 0 END) / COUNT(*), 2) AS null_customer_pct,
  SUM(CASE WHEN timezone_offset <> 'Z' THEN 1 ELSE 0 END) AS local_tz_rows,
  ROUND(100.0 * SUM(CASE WHEN timezone_offset <> 'Z' THEN 1 ELSE 0 END) / COUNT(*), 2) AS local_tz_pct
FROM events
GROUP BY device_type
ORDER BY total_events DESC;`,
        explanation:
          'Al desglosar la faceta de calidad por `device_type`, observamos que `pos_tienda` sufre la mayor tasa de clientes anónimos (`11.72 %`), mientras que el desfase horario afecta al `80 %` en los tres canales.',
      },
    },
  ],
  workedExample: {
    title: 'Trazabilidad de anomalías en telemetría web con OpenLineage',
    scenario:
      'El equipo de Marketing de Mercado Brisa alerta de una desviación en las conversiones atribuidas a campañas. Debes usar consultas de observabilidad y trazabilidad de linaje para: 1) verificar el volumen y frescura de los activos base, 2) perfilar las tasas de nulidad y desfase horario por dispositivo en `events`, y 3) medir el impacto aguas abajo sobre las sesiones de `checkout_completed` por campaña.',
    steps: [
      {
        label: 'Paso 1: Auditar volumen y ventana de frescura de los datasets base',
        explanation:
          'Consultamos el conteo de filas y los límites temporales (`min_date`, `max_date`) de `events`, `payments` y `orders` para descartar un corte de ingesta global.',
        code: `SELECT
  'events' AS dataset_name,
  COUNT(*) AS row_count,
  CAST(MIN(CAST(event_ts AS DATE)) AS VARCHAR) AS min_date,
  CAST(MAX(CAST(event_ts AS DATE)) AS VARCHAR) AS max_date
FROM events
UNION ALL
SELECT
  'payments',
  COUNT(*),
  CAST(MIN(CAST(payment_ts AS DATE)) AS VARCHAR),
  CAST(MAX(CAST(payment_ts AS DATE)) AS VARCHAR)
FROM payments
UNION ALL
SELECT
  'orders',
  COUNT(*),
  CAST(MIN(order_date) AS VARCHAR),
  CAST(MAX(order_date) AS VARCHAR)
FROM orders
ORDER BY row_count DESC;`,
        expectedOutput: [
          {
            dataset_name: 'events',
            row_count: 65000,
            min_date: '2023-01-01',
            max_date: '2025-11-26',
          },
          {
            dataset_name: 'payments',
            row_count: 19200,
            min_date: '2023-01-07',
            max_date: '2025-11-26',
          },
          {
            dataset_name: 'orders',
            row_count: 18000,
            min_date: '2023-01-07',
            max_date: '2025-11-26',
          },
        ],
      },
      {
        label: 'Paso 2: Extraer métricas de calidad de columna por dispositivo en events',
        explanation:
          'Calculamos los indicadores de `DataQualityMetricsInputDatasetFacet` para las columnas `customer_id` y `timezone_offset` segmentados por `device_type`.',
        code: `SELECT
  device_type,
  COUNT(*) AS total_events,
  SUM(CASE WHEN customer_id IS NULL THEN 1 ELSE 0 END) AS null_customer_rows,
  ROUND(100.0 * SUM(CASE WHEN customer_id IS NULL THEN 1 ELSE 0 END) / COUNT(*), 2) AS null_customer_pct,
  SUM(CASE WHEN timezone_offset <> 'Z' THEN 1 ELSE 0 END) AS local_tz_rows,
  ROUND(100.0 * SUM(CASE WHEN timezone_offset <> 'Z' THEN 1 ELSE 0 END) / COUNT(*), 2) AS local_tz_pct
FROM events
GROUP BY device_type
ORDER BY total_events DESC;`,
        expectedOutput: [
          {
            device_type: 'desktop',
            total_events: 23383,
            null_customer_rows: 2238,
            null_customer_pct: 9.57,
            local_tz_rows: 18705,
            local_tz_pct: 79.99,
          },
          {
            device_type: 'mobile',
            total_events: 22524,
            null_customer_rows: 2239,
            null_customer_pct: 9.94,
            local_tz_rows: 18021,
            local_tz_pct: 80.01,
          },
          {
            device_type: 'pos_tienda',
            total_events: 19093,
            null_customer_rows: 2238,
            null_customer_pct: 11.72,
            local_tz_rows: 15274,
            local_tz_pct: 80,
          },
        ],
      },
      {
        label: 'Paso 3: Cuantificar el impacto aguas abajo en la atribución de campañas',
        explanation:
          'Siguiendo el linaje de columna desde `events.customer_id` y `events.campaign_id` hacia el embudo de `checkout_completed`, medimos qué campañas pierden atribución de cliente por eventos anónimos.',
        code: `SELECT
  COALESCE(e.campaign_id, 'organic_untracked') AS campaign_group,
  COUNT(DISTINCT e.session_id) AS tracked_sessions,
  SUM(CASE WHEN e.customer_id IS NULL THEN 1 ELSE 0 END) AS anonymous_events,
  ROUND(100.0 * SUM(CASE WHEN e.customer_id IS NULL THEN 1 ELSE 0 END) / COUNT(*), 2) AS anonymous_event_pct
FROM events e
WHERE e.event_type = 'checkout_completed'
GROUP BY 1
ORDER BY tracked_sessions DESC
LIMIT 5;`,
        expectedOutput: [
          {
            campaign_group: 'CMP-RETENCION',
            tracked_sessions: 5290,
            anonymous_events: 335,
            anonymous_event_pct: 6.26,
          },
          {
            campaign_group: 'CMP-VERANO',
            tracked_sessions: 3000,
            anonymous_events: 0,
            anonymous_event_pct: 0,
          },
          {
            campaign_group: 'CMP-ORIGEN',
            tracked_sessions: 2290,
            anonymous_events: 336,
            anonymous_event_pct: 14.3,
          },
          {
            campaign_group: 'organic_untracked',
            tracked_sessions: 2290,
            anonymous_events: 335,
            anonymous_event_pct: 14.26,
          },
          {
            campaign_group: 'CMP-BARISTA',
            tracked_sessions: 2290,
            anonymous_events: 337,
            anonymous_event_pct: 14.34,
          },
        ],
      },
    ],
  },
  checks: [
    {
      type: 'mcq',
      id: 'chk-de3-t04-lineage-type',
      prompt:
        'En la especificación `ColumnLineageDatasetFacet` de OpenLineage, si una consulta calcula `SELECT order_id, amount_usd FROM payments WHERE status = \'captured\'`, ¿cómo se registra la dependencia de la columna de salida `amount_usd` respecto a la columna de entrada `payments.status`?',
      options: [
        {
          id: 'a',
          text: 'No se registra porque `status` no aparece proyectada en la cláusula SELECT.',
          correct: false,
          feedback:
            'Incorrecto. Ignorar las columnas de filtrado ocultaría por qué cambia el conjunto de filas de salida.',
        },
        {
          id: 'b',
          text: 'Se registra con tipo de transformación INDIRECT (enmascaramiento/filtrado), porque `status` condiciona qué filas forman parte del resultado aunque no transforme directamente el valor numérico.',
          correct: true,
          feedback:
            'Exacto. OpenLineage distingue las dependencias `DIRECT` (que calculan el valor de la celda) de las `INDIRECT` (usadas en `WHERE`, `JOIN`, `GROUP BY` o `QUALIFY`).',
        },
        {
          id: 'c',
          text: 'Se registra como una clave primaria sintética en el esquema de destino.',
          correct: false,
          feedback:
            'Incorrecto. El linaje de columnas describe el flujo de transformación, no altera las claves primarias de la tabla.',
        },
      ],
      explanation:
        'En `ColumnLineageDatasetFacet`, una transformación `DIRECT` copia o calcula el valor a partir del campo origen (`payments.amount_usd`), mientras que una `INDIRECT` filtra, une o ordena el conjunto de datos (`payments.status`).',
    },
    {
      type: 'mcq',
      id: 'chk-de3-t04-pillars',
      prompt:
        'El job nocturno de telemetría web finaliza con estado `COMPLETE` y carga exactamente 65,000 filas sin errores de tipos, pero el porcentaje de nulos en `customer_id` salta del 2 % habitual al 45 %. ¿Qué pilar de la observabilidad y qué faceta de OpenLineage permiten detectar esta anomalía?',
      options: [
        {
          id: 'a',
          text: 'El pilar de Distribución de valores, instrumentado mediante el conteo `nullCount` dentro de `DataQualityMetricsInputDatasetFacet`.',
          correct: true,
          feedback:
            'Correcto. Ni la frescura, ni el volumen total, ni el esquema físico fallaron; fue la distribución estadística (`nullCount` / `rowCount`) de una columna anulable.',
        },
        {
          id: 'b',
          text: 'El pilar de Esquema físico, mediante un error de sintaxis DDL en el catálogo.',
          correct: false,
          feedback:
            'Incorrecto. Si la columna permite nulos en el esquema físico, el DDL no falla aunque aumente la proporción de nulos.',
        },
        {
          id: 'c',
          text: 'El pilar de Frescura, porque los eventos llegaron antes de la hora programada.',
          correct: false,
          feedback:
            'Incorrecto. El trabajo corrió a tiempo y con el volumen esperado; el problema es la calidad interna de los valores de `customer_id`.',
        },
      ],
      explanation:
        'El monitoreo de distribución rastrea tasas de nulidad (`nullCount`), cardinalidad y cuantiles en `DataQualityMetricsInputDatasetFacet`, detectando degradaciones silenciosas en columnas que aceptan valores `NULL`.',
    },
    {
      type: 'predict-output',
      id: 'chk-de3-t04-predict',
      prompt:
        'En la tabla `events` de Mercado Brisa, el tipo de evento `page_view` tiene `9,400` registros y todos ellos tienen `timezone_offset = \'Z\'`, mientras que `product_view` tiene `9,400` registros y ninguno tiene `timezone_offset = \'Z\'`. ¿Qué devuelve `SUM(CASE WHEN timezone_offset <> \'Z\' THEN 1 ELSE 0 END) AS non_utc_count` para `page_view` y para `product_view` respectivamente?',
      options: [
        {
          id: 'a',
          text: '0 para page_view y 9400 para product_view.',
          correct: true,
          feedback:
            'Correcto. Todos los `page_view` están ya normalizados en UTC (`Z`), mientras que los 9,400 `product_view` provienen de husos horarios locales (`<> \'Z\'`).',
        },
        {
          id: 'b',
          text: '9400 para page_view y 0 para product_view.',
          correct: false,
          feedback:
            'Incorrecto. El predicado `timezone_offset <> \'Z\'` cuenta los registros que NO están en UTC.',
        },
        {
          id: 'c',
          text: '4700 para ambos tipos de evento.',
          correct: false,
          feedback:
            'Incorrecto. El desfase horario no se reparte al 50 %: `page_view` tiene 0 filas fuera de UTC y `product_view` tiene las 9,400 filas fuera de UTC.',
        },
      ],
      explanation:
        'Perfilar por `event_type` permite aislar la causa raíz: el rastreador de `page_view` emite marcas en UTC (`Z`, `0` desvíos), pero el microservicio que instrumenta `product_view` y los eventos de carrito emite horas locales (`9,400` y `14,200` desvíos).',
    },
  ],
  practice: {
    type: 'sql',
    title: 'Telemetría de calidad por tipo de evento para OpenLineage',
    prompt:
      'Construye la consulta SQL que alimenta la faceta de observabilidad (`DataQualityMetricsInputDatasetFacet`) sobre la tabla `events` desglosada por `event_type`. Para cada `event_type`, calcula: `total_events` (`COUNT(*)`), `unique_sessions` (`COUNT(DISTINCT session_id)`), `null_customer_count` (`SUM(CASE WHEN customer_id IS NULL THEN 1 ELSE 0 END)`), `null_customer_pct` (`ROUND(100.0 * SUM(CASE WHEN customer_id IS NULL THEN 1 ELSE 0 END) / COUNT(*), 2)`) y `non_utc_count` (`SUM(CASE WHEN timezone_offset <> \'Z\' THEN 1 ELSE 0 END)`). Ordena los resultados por `total_events DESC, event_type ASC`.',
    starterCode: `-- Perfila por event_type las métricas de volumen, sesiones, nulidad y desfase horario
SELECT
  event_type,
  COUNT(*) AS total_events,
  0 AS unique_sessions,
  0 AS null_customer_count,
  0.0 AS null_customer_pct,
  0 AS non_utc_count
FROM events
GROUP BY event_type
ORDER BY total_events DESC, event_type ASC;`,
    expected: `SELECT
  event_type,
  COUNT(*) AS total_events,
  COUNT(DISTINCT session_id) AS unique_sessions,
  SUM(CASE WHEN customer_id IS NULL THEN 1 ELSE 0 END) AS null_customer_count,
  ROUND(100.0 * SUM(CASE WHEN customer_id IS NULL THEN 1 ELSE 0 END) / COUNT(*), 2) AS null_customer_pct,
  SUM(CASE WHEN timezone_offset <> 'Z' THEN 1 ELSE 0 END) AS non_utc_count
FROM events
GROUP BY event_type
ORDER BY total_events DESC, event_type ASC;`,
    solution: `SELECT
  event_type,
  COUNT(*) AS total_events,
  COUNT(DISTINCT session_id) AS unique_sessions,
  SUM(CASE WHEN customer_id IS NULL THEN 1 ELSE 0 END) AS null_customer_count,
  ROUND(100.0 * SUM(CASE WHEN customer_id IS NULL THEN 1 ELSE 0 END) / COUNT(*), 2) AS null_customer_pct,
  SUM(CASE WHEN timezone_offset <> 'Z' THEN 1 ELSE 0 END) AS non_utc_count
FROM events
GROUP BY event_type
ORDER BY total_events DESC, event_type ASC;`,
    solutionExplanation:
      'El perfilado por `event_type` revela de inmediato dos hallazgos operativos: 1) la tasa de clientes nulos sube del ~8.7 % en el embudo de compra al ~14.3 % en navegación (`page_view` y `product_view`), y 2) `page_view` tiene 0 eventos fuera de UTC (`Z`), mientras que `product_view` (`9,400`) y los tres eventos de checkout (`14,200` cada uno) emiten husos horarios locales.',
    expectedOutputTable: [
      {
        event_type: 'add_to_cart',
        total_events: 15400,
        unique_sessions: 15160,
        null_customer_count: 1344,
        null_customer_pct: 8.73,
        non_utc_count: 14200,
      },
      {
        event_type: 'checkout_completed',
        total_events: 15400,
        unique_sessions: 15160,
        null_customer_count: 1343,
        null_customer_pct: 8.72,
        non_utc_count: 14200,
      },
      {
        event_type: 'checkout_started',
        total_events: 15400,
        unique_sessions: 15160,
        null_customer_count: 1342,
        null_customer_pct: 8.71,
        non_utc_count: 14200,
      },
      {
        event_type: 'page_view',
        total_events: 9400,
        unique_sessions: 9160,
        null_customer_count: 1344,
        null_customer_pct: 14.3,
        non_utc_count: 0,
      },
      {
        event_type: 'product_view',
        total_events: 9400,
        unique_sessions: 9160,
        null_customer_count: 1342,
        null_customer_pct: 14.28,
        non_utc_count: 9400,
      },
    ],
    hints: [
      'Usa `COUNT(DISTINCT session_id) AS unique_sessions` para contar las sesiones únicas por cada `event_type`.',
      'Calcula `null_customer_count` con `SUM(CASE WHEN customer_id IS NULL THEN 1 ELSE 0 END)` y `null_customer_pct` con `ROUND(100.0 * SUM(CASE WHEN customer_id IS NULL THEN 1 ELSE 0 END) / COUNT(*), 2)`.',
      'Calcula `non_utc_count` con `SUM(CASE WHEN timezone_offset <> \'Z\' THEN 1 ELSE 0 END)` y ordena por `total_events DESC, event_type ASC`.',
    ],
    orderMatters: true,
  },
  pipelineChallenge: {
    id: 'challenge-de3-t04-openlineage',
    title: 'Resolución de incidentes con observabilidad y OpenLineage',
    prompt:
      'Ordena los 5 pasos técnicos desde que un trabajo emite telemetría OpenLineage hasta que el equipo aísla la causa raíz y notifica a los consumidores afectados.',
    steps: [
      {
        id: 'step-emit-start',
        text: 'Iniciar la ejecución del Job emitiendo un evento RunEvent con estado START, runId único y datasets de entrada registrados.',
      },
      {
        id: 'step-collect-facets',
        text: 'Ejecutar la transformación recolectando ColumnLineageDatasetFacet y las métricas estadísticas de DataQualityMetricsInputDatasetFacet.',
      },
      {
        id: 'step-detect-drift',
        text: 'Detectar al cierre del Run una desviación estadística en la distribución (aumento de nullCount o desfase horario en timezone_offset).',
      },
      {
        id: 'step-trace-upstream',
        text: 'Rastrear el grafo de linaje de columna hacia arriba (upstream) para identificar qué evento o microservicio origen introdujo la anomalía.',
      },
      {
        id: 'step-notify-downstream',
        text: 'Consultar el grafo hacia abajo (downstream) para alertar automáticamente a los propietarios de las métricas semánticas y tableros afectados.',
      },
    ],
    correctOrder: [
      'step-emit-start',
      'step-collect-facets',
      'step-detect-drift',
      'step-trace-upstream',
      'step-notify-downstream',
    ],
    hint: 'Primero el Run emite START, luego recolecta las facetas de linaje y calidad durante la transformación, detecta la anomalía estadística, rastrea la causa raíz upstream y finalmente evalúa el impacto downstream.',
    explanation:
      'Esta secuencia integra la emisión en tiempo real de OpenLineage con el diagnóstico bidireccional: hacia arriba para reparar la fuente y hacia abajo para proteger las decisiones de negocio.',
  },
  roleNotes: {
    de: 'Como Ingeniero de Datos, instrumentarás la emisión de eventos OpenLineage en tu orquestador y motor SQL, adjuntando `DataQualityMetricsInputDatasetFacet` y `ColumnLineageDatasetFacet` para reducir el tiempo medio de diagnóstico (MTTR).',
    da: 'Como Analista de Datos, consultarás el grafo de linaje a nivel de columna antes de modificar una transformación intermedia para verificar qué reportes ejecutivos o modelos predictivos dependen directa o indirectamente de ese campo.',
    bi: 'Como especialista en BI, integrarás las señales de frescura y calidad de OpenLineage en las cabeceras de tus tableros para que los directivos sepan al instante si una métrica refleja el cierre actual o tiene una alerta activa aguas arriba.',
  },
  summary: [
    'La observabilidad de datos vigila de forma continua cuatro pilares: frescura, volumen, distribución estadística y cambios de esquema.',
    'OpenLineage estandariza la emisión de metadatos en tiempo de ejecución mediante las entidades `Job`, `Run`, `Dataset` y eventos `RunEvent`.',
    'La faceta `ColumnLineageDatasetFacet` distingue transformaciones `DIRECT` (proyección/cálculo) de dependencias `INDIRECT` (`WHERE`, `JOIN`, `QUALIFY`).',
    'La faceta `DataQualityMetricsInputDatasetFacet` registra volumen, conteo de nulos y cuantiles, habilitando el análisis de causa raíz y de impacto.',
  ],
  flashcards: [
    {
      id: 'fc-de3-t04-01',
      front: '¿Cuáles son los cuatro pilares de la observabilidad de datos y qué problema resuelven frente a los tests binarios?',
      back: 'Frescura, volumen, distribución y esquema/linaje; permiten detectar degradaciones graduales y anomalías silenciosas que no rompen una regla fija de nulidad o clave única.',
    },
    {
      id: 'fc-de3-t04-02',
      front: '¿Cuáles son las tres entidades centrales del modelo de objetos de OpenLineage?',
      back: '`Job` (definición del proceso o consulta), `Dataset` (tabla o activo de entrada/salida) y `Run` (ejecución individual que transita por estados `START`, `COMPLETE` o `FAIL`).',
    },
    {
      id: 'fc-de3-t04-03',
      front: 'En `ColumnLineageDatasetFacet` de OpenLineage, ¿qué diferencia hay entre una transformación `DIRECT` y una `INDIRECT`?',
      back: '`DIRECT` indica que el campo de entrada alimenta directamente el valor de la columna de salida; `INDIRECT` indica que condiciona el resultado mediante un filtro `WHERE`, `JOIN`, `GROUP BY` o `QUALIFY`.',
    },
    {
      id: 'fc-de3-t04-04',
      front: '¿Para qué sirve combinar análisis aguas arriba (*upstream*) y aguas abajo (*downstream*) en un grafo de linaje?',
      back: 'El recorrido upstream localiza la tabla o microservicio origen que causó el incidente (causa raíz), y el recorrido downstream enumera todos los modelos y dashboards afectados (análisis de impacto).',
    },
  ],
  glossaryTerms: [
    'observabilidad-cuatro-pilares',
    'linaje-columna-openlineage',
    'grafo-linaje-declarativo',
  ],
  sources: [
    {
      title: 'OpenLineage Specification — Object Model',
      url: 'https://openlineage.io/docs/spec/object-model',
      publisher: 'Linux Foundation AI & Data',
      accessed: '2026-10-29',
      supports:
        'Definición formal de las entidades Run, Job y Dataset, ciclo de vida de RunEvent y convenciones de nombres.',
    },
    {
      title: 'OpenLineage Specification — Column Lineage Dataset Facet',
      url: 'https://openlineage.io/docs/spec/facets/dataset-facets/column_lineage_facet',
      publisher: 'Linux Foundation AI & Data',
      accessed: '2026-10-29',
      supports:
        'Trazabilidad a nivel de columna e identificación de transformaciones DIRECT (IDENTITY, TRANSFORMATION) e INDIRECT (FILTER, JOIN, GROUP_BY).',
    },
    {
      title: 'OpenLineage Specification — Data Quality Metrics Facet',
      url: 'https://openlineage.io/docs/spec/facets/dataset-facets/data_quality_metrics',
      publisher: 'Linux Foundation AI & Data',
      accessed: '2026-10-29',
      supports:
        'Estructura de telemetría de calidad por dataset y columna (`rowCount`, `nullCount`, `distinctCount`, `quantiles`).',
    },
    {
      title: 'Marquez Project Documentation — Quickstart & Lineage Graph',
      url: 'https://marquezproject.ai/docs/quickstart',
      publisher: 'LF AI & Data / Marquez Project',
      accessed: '2026-10-29',
      supports:
        'Almacenamiento y consulta del grafo de metadatos OpenLineage para análisis de impacto y causa raíz.',
    },
  ],
  aiNotes:
    'En la práctica SQL sobre `events`, verifica que el estudiante compare `timezone_offset <> \'Z\'` (y no `<> \'+00:00\'`, ya que en el dataset de Mercado Brisa el código UTC se almacena como `\'Z\'`). Recuérdale usar `100.0 * ... / COUNT(*)` con punto flotante para obtener los porcentajes con dos decimales.',
};
export default lesson;
