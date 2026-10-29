const lesson = {
  id: 'de4-plataforma-05-finops-atribucion-retencion',
  moduleId: 'de4-plataforma',
  tracks: ['de'],
  level: 4,
  order: 5,
  title: 'FinOps para datos: costos, dimensionamiento y retención',
  subtitle: 'FinOps para datos: atribución de costos, dimensionamiento y políticas de retención',
  minutes: 20,
  prerequisites: [
    'de3-lakehouse-01-iceberg-v3-medallion',
    'de4-plataforma-04-iac-terraform-cicd-datos',
  ],
  contentVersion: 2,

  hook: 'La factura mensual de la plataforma de Mercado Brisa creció un 140 % sin que el número de órdenes aumentara al mismo ritmo. Al auditar el gasto, identificas tres causas: nadie etiqueta qué departamento ejecuta cada consulta, el almacén mantiene en discos NVMe los 18 629 eventos del año 2023 y los 24 263 del año 2024 junto con los de 2025, y varias consultas escanean la columna payload_json completa. ¿Cómo implementas atribución FinOps con FOCUS, economía unitaria y políticas de retención por capas?',

  objectives: [
    'Aplicar el marco FinOps y la especificación abierta FOCUS diferenciando entre costo facturado (BilledCost) y costo efectivo amortizado (EffectiveCost) para atribuir gasto por equipo o dominio.',
    'Dimensionar el cómputo analítico mediante cuotas de escaneo, poda de columnas pesadas y políticas de suspensión automática (auto-suspend) para optimizar la economía unitaria.',
    'Diseñar políticas automatizadas de retención y ciclo de vida del almacenamiento que transicionen datos entre capas calientes (Hot), tibias (Warm) y archivo frío (Cold).',
  ],

  sections: [
    {
      id: 'finops-especificacion-focus',
      heading: 'Atribución de costos FinOps y el estándar abierto FOCUS',
      body: 'Cuando toda la plataforma comparte una sola cuenta sin etiquetas de atribución, los equipos tratan el cómputo como un recurso gratuito. La disciplina **FinOps** corrige este problema mediante tres fases iterativas. La primera es Informar para dar visibilidad y asignar costos. La segunda es Optimizar dimensionando recursos y descuentos. La tercera es Operar mediante presupuestos y alertas.\n\nCada proveedor de nube suele reportar su facturación con nombres de columna incompatibles. Para resolverlo, la FinOps Foundation creó **FOCUS** (*FinOps Open Cost and Usage Specification*). Este esquema estándar registra el identificador del recurso (`ResourceId`), la categoría del cargo (`ChargeCategory`), las etiquetas (`Tags`), el costo facturado (`BilledCost`) y el **costo efectivo (`EffectiveCost`)**. Este último amortiza reservas anuales o descuentos por uso comprometido. Además, aplicar FinOps exige medir la **economía unitaria**: cuánto cuesta procesar mil órdenes o cuánto se invierte por conversión atribuida.',
      example: {
        language: 'sql',
        code: `SELECT channel,
       ROUND(SUM(spend_usd), 2) AS total_spend_usd,
       SUM(clicks) AS total_clicks,
       SUM(attributed_conversions) AS total_conversions,
       ROUND(SUM(spend_usd) / NULLIF(SUM(attributed_conversions), 0), 2) AS cpa_usd
FROM marketing_spend
GROUP BY channel
ORDER BY total_spend_usd DESC;`,
        expectedOutput: [
          { channel: 'paid_social', total_spend_usd: 63080.29, total_clicks: 79925, total_conversions: 4530, cpa_usd: 13.93 },
          { channel: 'display_video', total_spend_usd: 46759.04, total_clicks: 58708, total_conversions: 3355, cpa_usd: 13.94 },
          { channel: 'organic_search', total_spend_usd: 26703.45, total_clicks: 33785, total_conversions: 1925, cpa_usd: 13.87 },
          { channel: 'referral', total_spend_usd: 22306.35, total_clicks: 28511, total_conversions: 1641, cpa_usd: 13.59 },
          { channel: 'email_campaign', total_spend_usd: 14102.07, total_clicks: 17651, total_conversions: 1013, cpa_usd: 13.92 },
        ],
      },
    },
    {
      id: 'dimensionamiento-computo-escaneo',
      heading: 'Dimensionamiento de cómputo y reducción de bytes escaneados',
      body: 'En una plataforma analítica moderna, el cómputo representa entre el 70 % y el 85 % de la factura total. El gasto de cómputo depende de dos factores que el ingeniero controla directamente. El primero es el tiempo que los nodos permanecen encendidos sin carga útil. El segundo es el volumen de bytes leídos en cada consulta.\n\nPara eliminar el cómputo ocioso, los almacenes virtuales se separan por perfil de carga (uno predecible para lotes ETL y otro elástico para consultas BI) con **suspensión automática (`auto-suspend`)** tras 60 segundos de inactividad. Para reducir los bytes escaneados, se debe prohibir `SELECT *` sobre tablas anchas. En la tabla `events` de Mercado Brisa, la columna `payload_json` acumula más de 2 900 KB de texto a través de los tres tipos de dispositivo (`desktop`, `mobile` y `pos_tienda`). Como **Apache Parquet** es columnar, omitir `payload_json` cuando solo cuentas eventos por fecha evita leer y descomprimir esos bloques.',
      example: {
        language: 'sql',
        code: `SELECT device_type,
       COUNT(*) AS total_events,
       ROUND(SUM(STRLEN(COALESCE(payload_json, ''))) / 1024.0, 2) AS payload_kb,
       ROUND(AVG(STRLEN(COALESCE(payload_json, ''))), 1) AS avg_payload_bytes
FROM events
GROUP BY device_type
ORDER BY payload_kb DESC;`,
        expectedOutput: [
          { device_type: 'desktop', total_events: 23383, payload_kb: 1080.73, avg_payload_bytes: 47.3 },
          { device_type: 'mobile', total_events: 22524, payload_kb: 1024.94, avg_payload_bytes: 46.6 },
          { device_type: 'pos_tienda', total_events: 19093, payload_kb: 801.95, avg_payload_bytes: 43 },
        ],
      },
    },
    {
      id: 'politicas-retencion-ciclo-vida',
      heading: 'Políticas de retención y ciclo de vida del almacenamiento',
      body: 'Aunque el almacenamiento de objetos tiene un precio unitario bajo por gigabyte al mes, guardar indefinidamente cada evento crudo e instantánea huérfana provoca un crecimiento compuesto. Una **política de retención y ciclo de vida** clasifica las tablas según su frecuencia de acceso y requisitos legales en tres niveles térmicos.\n\nLa capa caliente (`HOT_NVME`) aloja en almacenamiento rápido los datos consultados a diario, como los 22 108 eventos del año `2025` en Mercado Brisa. La capa tibia (`WARM_OBJECT`) conserva en almacenamiento de acceso infrecuente los registros del año anterior (`2024`, con 24 263 eventos), cuyo costo por gigabyte se reduce a la mitad. Finalmente, la capa fría (`COLD_ARCHIVE`) traslada los registros de `2023` (18 629 eventos) a archivo profundo para auditorías esporádicas. Esta regla se complementa ejecutando semanalmente `expire_snapshots` en **Apache Iceberg** para borrar archivos Parquet de versiones descartadas.',
      example: {
        language: 'sql',
        code: `SELECT EXTRACT(YEAR FROM CAST(event_ts AS TIMESTAMP)) AS event_year,
       COUNT(*) AS total_events,
       COUNT(*) FILTER (WHERE event_type = 'page_view') AS page_view_events,
       ROUND(100.0 * COUNT(*) FILTER (WHERE event_type = 'page_view') / COUNT(*), 2) AS pct_page_views,
       CASE EXTRACT(YEAR FROM CAST(event_ts AS TIMESTAMP))
         WHEN 2025 THEN 'HOT_NVME'
         WHEN 2024 THEN 'WARM_OBJECT'
         ELSE 'COLD_ARCHIVE'
       END AS storage_tier
FROM events
GROUP BY 1
ORDER BY event_year DESC;`,
        expectedOutput: [
          { event_year: 2025, total_events: 22108, page_view_events: 2910, pct_page_views: 13.16, storage_tier: 'HOT_NVME' },
          { event_year: 2024, total_events: 24263, page_view_events: 3285, pct_page_views: 13.54, storage_tier: 'WARM_OBJECT' },
          { event_year: 2023, total_events: 18629, page_view_events: 3205, pct_page_views: 17.2, storage_tier: 'COLD_ARCHIVE' },
        ],
      },
    },
  ],

  workedExample: {
    title: 'Auditoría FinOps de CPA, peso de payload y ciclo de vida en Mercado Brisa',
    description: 'El comité de FinOps de Mercado Brisa te solicita auditar el costo por conversión atribuida de los canales en marketing_spend, cuantificar el peso en kilobytes de la columna payload_json en events por dispositivo y clasificar los 65 000 eventos en capas de almacenamiento (HOT_NVME, WARM_OBJECT, COLD_ARCHIVE) según su año.',
    audit: 'Transicionar los 42 892 eventos de 2023 y 2024 fuera de la capa HOT_NVME reduce en dos tercios el volumen alojado en almacenamiento primario, mientras que podar payload_json evita leer casi 3 MB de texto crudo en cada agregación.',
    steps: [
      {
        label: 'Paso 1: Evaluar la economía unitaria por canal en marketing_spend',
        explanation: 'Calculamos el gasto acumulado, clics, conversiones atribuidas y el costo por conversión (cpa_usd) de cada canal para vincular el presupuesto con los resultados de negocio.',
        code: `SELECT channel,
       ROUND(SUM(spend_usd), 2) AS total_spend_usd,
       SUM(clicks) AS total_clicks,
       SUM(attributed_conversions) AS total_conversions,
       ROUND(SUM(spend_usd) / NULLIF(SUM(attributed_conversions), 0), 2) AS cpa_usd
FROM marketing_spend
GROUP BY channel
ORDER BY total_spend_usd DESC;`,
        expectedOutput: [
          { channel: 'paid_social', total_spend_usd: 63080.29, total_clicks: 79925, total_conversions: 4530, cpa_usd: 13.93 },
          { channel: 'display_video', total_spend_usd: 46759.04, total_clicks: 58708, total_conversions: 3355, cpa_usd: 13.94 },
          { channel: 'organic_search', total_spend_usd: 26703.45, total_clicks: 33785, total_conversions: 1925, cpa_usd: 13.87 },
          { channel: 'referral', total_spend_usd: 22306.35, total_clicks: 28511, total_conversions: 1641, cpa_usd: 13.59 },
          { channel: 'email_campaign', total_spend_usd: 14102.07, total_clicks: 17651, total_conversions: 1013, cpa_usd: 13.92 },
        ],
      },
      {
        label: 'Paso 2: Cuantificar el volumen de bytes de payload_json por tipo de dispositivo',
        explanation: 'Medimos la longitud de caracteres de payload_json en events para demostrar cuántos kilobytes se ahorran en cada escaneo cuando las consultas omiten esa columna.',
        code: `SELECT device_type,
       COUNT(*) AS total_events,
       ROUND(SUM(STRLEN(COALESCE(payload_json, ''))) / 1024.0, 2) AS payload_kb,
       ROUND(AVG(STRLEN(COALESCE(payload_json, ''))), 1) AS avg_payload_bytes
FROM events
GROUP BY device_type
ORDER BY payload_kb DESC;`,
        expectedOutput: [
          { device_type: 'desktop', total_events: 23383, payload_kb: 1080.73, avg_payload_bytes: 47.3 },
          { device_type: 'mobile', total_events: 22524, payload_kb: 1024.94, avg_payload_bytes: 46.6 },
          { device_type: 'pos_tienda', total_events: 19093, payload_kb: 801.95, avg_payload_bytes: 43 },
        ],
      },
      {
        label: 'Paso 3: Clasificar el inventario de events por capa de retención (Hot, Warm, Cold)',
        explanation: 'Agrupamos los eventos por año de event_ts, medimos qué porcentaje corresponde a eventos efímeros de tipo page_view y asignamos la clase de almacenamiento correspondiente.',
        code: `SELECT EXTRACT(YEAR FROM CAST(event_ts AS TIMESTAMP)) AS event_year,
       COUNT(*) AS total_events,
       COUNT(*) FILTER (WHERE event_type = 'page_view') AS page_view_events,
       ROUND(100.0 * COUNT(*) FILTER (WHERE event_type = 'page_view') / COUNT(*), 2) AS pct_page_views,
       CASE EXTRACT(YEAR FROM CAST(event_ts AS TIMESTAMP))
         WHEN 2025 THEN 'HOT_NVME'
         WHEN 2024 THEN 'WARM_OBJECT'
         ELSE 'COLD_ARCHIVE'
       END AS storage_tier
FROM events
GROUP BY 1
ORDER BY event_year DESC;`,
        expectedOutput: [
          { event_year: 2025, total_events: 22108, page_view_events: 2910, pct_page_views: 13.16, storage_tier: 'HOT_NVME' },
          { event_year: 2024, total_events: 24263, page_view_events: 3285, pct_page_views: 13.54, storage_tier: 'WARM_OBJECT' },
          { event_year: 2023, total_events: 18629, page_view_events: 3205, pct_page_views: 17.2, storage_tier: 'COLD_ARCHIVE' },
        ],
      },
    ],
  },

  checks: [
    {
      id: 'de4-p05-check-1',
      type: 'mcq',
      prompt: 'En la especificación abierta FOCUS de la FinOps Foundation, ¿qué diferencia existe entre las métricas BilledCost y EffectiveCost?',
      options: [
        {
          id: 'a',
          text: 'BilledCost refleja el monto facturado bruto del periodo, mientras que EffectiveCost representa el costo real amortizando descuentos por uso comprometido o reservas prepagadas.',
          correct: true,
          feedback: 'Correcto. EffectiveCost permite atribuir de forma justa el gasto por hora o por tubería aunque la reserva anual se haya pagado en una sola factura.',
        },
        {
          id: 'b',
          text: 'BilledCost mide únicamente el almacenamiento en Parquet y EffectiveCost mide únicamente la memoria RAM de Spark.',
          correct: false,
          feedback: 'Incorrecto. Ambas columnas aplican a cualquier categoría de cargo (cómputo, almacenamiento, red) dentro del esquema FOCUS.',
        },
        {
          id: 'c',
          text: 'BilledCost se expresa en gigabytes y EffectiveCost se expresa en milisegundos de latencia.',
          correct: false,
          feedback: 'Incorrecto. Ambas métricas son monetarias; el volumen de uso se registra en las columnas PricingQuantity y ConsumedQuantity.',
        },
        {
          id: 'd',
          text: 'Son sinónimos exactos mantenidos por compatibilidad con versiones antiguas de CSV.',
          correct: false,
          feedback: 'Incorrecto. Tienen definiciones contables distintas y complementarias dentro del estándar FOCUS.',
        },
      ],
      explanation: 'FOCUS define BilledCost para conciliar con la factura contable del proveedor y EffectiveCost para calcular el costo amortizado real de cada carga de trabajo tras aplicar compromisos y descuentos.',
    },
    {
      id: 'de4-p05-check-2',
      type: 'mcq',
      prompt: '¿Qué combinación de medidas técnicas reduce de forma más directa los bytes facturados por escaneo en consultas analíticas recurrentes sobre una tabla Apache Iceberg de eventos?',
      options: [
        {
          id: 'a',
          text: 'Ejecutar SELECT * en todas las vistas y desactivar la compresión Zstandard en Parquet.',
          correct: false,
          feedback: 'Incorrecto. SELECT * y desactivar la compresión multiplican los bytes leídos desde el almacenamiento de objetos.',
        },
        {
          id: 'b',
          text: 'Proyectar únicamente las columnas requeridas (omitiendo columnas pesadas como payload_json) y filtrar por las columnas de particionado para aprovechar la poda de manifiestos.',
          correct: true,
          feedback: 'Correcto. El formato columnar Parquet permite saltar columnas no seleccionadas y los manifiestos de Iceberg descartan archivos completos fuera del rango de fechas.',
        },
        {
          id: 'c',
          text: 'Aumentar el tiempo de auto-suspend del clúster de 1 minuto a 12 horas.',
          correct: false,
          feedback: 'Incorrecto. Alargar el auto-suspend incrementa el pago por nodos ociosos sin reducir los bytes escaneados por consulta.',
        },
      ],
      explanation: 'La reducción de bytes escaneados se logra combinando poda horizontal (filtros sobre columnas de partición y estadísticas min/max en manifiestos Iceberg) con poda vertical (seleccionar solo las columnas necesarias en Parquet).',
    },
    {
      id: 'de4-p05-check-3',
      type: 'order',
      prompt: 'Ordena las tres fases del ciclo operativo del FinOps Framework aplicadas a una plataforma de datos:',
      items: [
        'Informar (Inform): normalizar la facturación con FOCUS, etiquetar trabajos por equipo y visibilizar el costo unitario.',
        'Optimizar (Optimize): podar columnas, ajustar auto-suspend, transicionar datos antiguos a capas Warm/Cold y adquirir compromisos.',
        'Operar (Operate): automatizar presupuestos en CI/CD, alertas de anomalías de gasto y expiración periódica de instantáneas.',
      ],
      correctOrder: ['it-0', 'it-1', 'it-2'],
      explanation: 'El ciclo FinOps comienza dando visibilidad y atribución precisa (Inform), continúa identificando y ejecutando ahorros técnicos y de tarifas (Optimize) y se institucionaliza mediante controles continuos (Operate).',
    },
  ],

  practice: {
    type: 'sql',
    title: 'Clasificación de ciclo de vida del almacenamiento sobre events',
    language: 'sql',
    prompt: 'Diseña la tabla de clasificación de retención sobre la tabla events de Mercado Brisa. Agrupa por el año extraído de event_ts (EXTRACT(YEAR FROM CAST(event_ts AS TIMESTAMP)) AS event_year) y calcula: el total de eventos del año (total_events), cuántos eventos son de tipo \'page_view\' (page_view_events), qué porcentaje representan los \'page_view\' sobre el total del año redondeado a 2 decimales (pct_page_views), y la columna storage_tier que asigna \'HOT_NVME\' al año 2025, \'WARM_OBJECT\' al año 2024 y \'COLD_ARCHIVE\' a cualquier año anterior. Ordena por event_year de mayor a menor.',
    starterCode: `SELECT EXTRACT(YEAR FROM CAST(event_ts AS TIMESTAMP)) AS event_year,
       COUNT(*) AS total_events,
       -- Cuenta los eventos donde event_type = 'page_view'
       0 AS page_view_events,
       -- Calcula el porcentaje redondeado a 2 decimales
       0.0 AS pct_page_views,
       -- Asigna 'HOT_NVME' (2025), 'WARM_OBJECT' (2024) o 'COLD_ARCHIVE' (otros)
       'PENDIENTE' AS storage_tier
FROM events
GROUP BY 1
ORDER BY event_year DESC;`,
    expected: `SELECT EXTRACT(YEAR FROM CAST(event_ts AS TIMESTAMP)) AS event_year,
       COUNT(*) AS total_events,
       COUNT(*) FILTER (WHERE event_type = 'page_view') AS page_view_events,
       ROUND(100.0 * COUNT(*) FILTER (WHERE event_type = 'page_view') / COUNT(*), 2) AS pct_page_views,
       CASE EXTRACT(YEAR FROM CAST(event_ts AS TIMESTAMP))
         WHEN 2025 THEN 'HOT_NVME'
         WHEN 2024 THEN 'WARM_OBJECT'
         ELSE 'COLD_ARCHIVE'
       END AS storage_tier
FROM events
GROUP BY 1
ORDER BY event_year DESC;`,
    orderMatters: true,
    hints: [
      'Usa COUNT(*) FILTER (WHERE event_type = \'page_view\') para calcular page_view_events.',
      'Para pct_page_views escribe ROUND(100.0 * COUNT(*) FILTER (WHERE event_type = \'page_view\') / COUNT(*), 2).',
      'Usa CASE EXTRACT(YEAR FROM CAST(event_ts AS TIMESTAMP)) WHEN 2025 THEN \'HOT_NVME\' WHEN 2024 THEN \'WARM_OBJECT\' ELSE \'COLD_ARCHIVE\' END AS storage_tier.',
    ],
    solution: `SELECT EXTRACT(YEAR FROM CAST(event_ts AS TIMESTAMP)) AS event_year,
       COUNT(*) AS total_events,
       COUNT(*) FILTER (WHERE event_type = 'page_view') AS page_view_events,
       ROUND(100.0 * COUNT(*) FILTER (WHERE event_type = 'page_view') / COUNT(*), 2) AS pct_page_views,
       CASE EXTRACT(YEAR FROM CAST(event_ts AS TIMESTAMP))
         WHEN 2025 THEN 'HOT_NVME'
         WHEN 2024 THEN 'WARM_OBJECT'
         ELSE 'COLD_ARCHIVE'
       END AS storage_tier
FROM events
GROUP BY 1
ORDER BY event_year DESC;`,
    solutionExplanation: 'La consulta segmenta los 65 000 eventos por antigüedad anual, revelando que 42 892 registros (2024 y 2023) pueden migrar a almacenamiento tibio y frío, manteniendo únicamente los 22 108 eventos de 2025 en la capa rápida HOT_NVME.',
    expectedOutputTable: [
      { event_year: 2025, total_events: 22108, page_view_events: 2910, pct_page_views: 13.16, storage_tier: 'HOT_NVME' },
      { event_year: 2024, total_events: 24263, page_view_events: 3285, pct_page_views: 13.54, storage_tier: 'WARM_OBJECT' },
      { event_year: 2023, total_events: 18629, page_view_events: 3205, pct_page_views: 17.2, storage_tier: 'COLD_ARCHIVE' },
    ],
  },

  roleNotes: {
    de: 'Configura etiquetas obligatorias de centro de costo en cada conector, trabajo de Spark y almacén SQL. Programa reglas de transición de ciclo de vida en el almacenamiento de objetos junto con la expiración semanal de instantáneas en Apache Iceberg.',
    da: 'Acota siempre tus consultas sobre tablas de eventos usando predicados de fecha explícitos y selecciona solo las columnas necesarias. Evita incluir payload_json salvo que estés depurando un atributo crudo específico.',
    bi: 'Evalúa la frecuencia real de uso de cada tablero antes de programar refrescos cada cinco minutos. Alinea el horario de actualización de las vistas Gold con el ritmo al que cambian las fuentes y archiva los reportes sin visitas en los últimos 60 días.',
  },

  summary: [
    'El marco FinOps y la especificación abierta FOCUS estandarizan la atribución del gasto tecnológico mediante etiquetas y métricas como BilledCost y EffectiveCost.',
    'La economía unitaria vincula el gasto de la plataforma con el valor de negocio midiendo el costo por orden procesada o por conversión atribuida.',
    'El gasto de cómputo se controla separando cargas por perfil, activando auto-suspend rápido y reduciendo bytes escaneados mediante poda de columnas y particiones.',
    'Las políticas de retención automatizan el paso de datos entre capas Hot, Warm y Cold y purgan instantáneas obsoletas para frenar el costo compuesto.',
  ],

  flashcards: [
    {
      id: 'de4-plataforma-05-finops-atribucion-retencion-fc-1',
      front: '¿Qué problema resuelve la especificación abierta FOCUS en ingeniería de datos y FinOps?',
      back: 'Normaliza los datos de facturación y uso entre distintos proveedores de nube y plataformas bajo un esquema común de columnas (como BilledCost, EffectiveCost, ResourceId y ChargeCategory).',
    },
    {
      id: 'de4-plataforma-05-finops-atribucion-retencion-fc-2',
      front: '¿Por qué omitir columnas de texto extensas como payload_json reduce directamente el costo en una consulta sobre Apache Parquet?',
      back: 'Porque Parquet almacena cada columna en bloques contiguos independientes; si una columna no aparece en la consulta, el motor nunca descarga ni descomprime sus bytes desde el almacenamiento de objetos.',
    },
    {
      id: 'de4-plataforma-05-finops-atribucion-retencion-fc-3',
      front: '¿Qué criterio define el paso de una tabla o partición entre las capas Hot, Warm y Cold?',
      back: 'La antigüedad y frecuencia de lectura: los datos recientes de consulta diaria residen en Hot, el historial del último año de acceso ocasional pasa a Warm y los años anteriores para auditoría legal se archivan en Cold.',
    },
    {
      id: 'de4-plataforma-05-finops-atribucion-retencion-fc-4',
      front: '¿Qué es una métrica de economía unitaria (unit economics) en una plataforma de datos?',
      back: 'Es el cociente entre el costo efectivo de la plataforma y una unidad de valor del negocio (por ejemplo, costo de cómputo y almacenamiento por cada 1 000 órdenes completadas).',
    },
  ],

  glossaryTerms: [
    'finops-especificacion-focus',
    'politica-retencion-ciclo-vida',
    'c18-iceberg-v3',
  ],

  sources: [
    {
      title: 'FinOps Framework Overview',
      url: 'https://www.finops.org/framework/',
      publisher: 'FinOps Foundation',
      accessed: '2026-10-29',
      supports: 'Principios del marco FinOps, fases Inform, Optimize y Operate y economía unitaria.',
    },
    {
      title: 'FOCUS — FinOps Open Cost and Usage Specification',
      url: 'https://focus.finops.org/',
      publisher: 'FinOps Foundation',
      accessed: '2026-10-29',
      supports: 'Definición estandarizada de BilledCost, EffectiveCost, ResourceId y atribución multi-nube.',
    },
    {
      title: 'FinOps Framework Capabilities — Workload Optimization and Allocation',
      url: 'https://www.finops.org/framework/capabilities/',
      publisher: 'FinOps Foundation',
      accessed: '2026-10-29',
      supports: 'Estrategias de asignación de costos por etiquetas, detección de anomalías y dimensionamiento de cargas.',
    },
    {
      title: 'Amazon S3 User Guide — Managing the storage lifecycle of objects',
      url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html',
      publisher: 'Amazon Web Services',
      accessed: '2026-10-29',
      supports: 'Políticas automatizadas de transición entre clases de almacenamiento y expiración de objetos.',
    },
  ],

  aiNotes: 'Conecta los conceptos de FinOps (FOCUS, BilledCost vs EffectiveCost, auto-suspend y retención Hot/Warm/Cold) con los números reales de Mercado Brisa. En la práctica SQL, verifica que el alumno use EXTRACT(YEAR FROM CAST(event_ts AS TIMESTAMP)) y filtre event_type = \'page_view\'.',
};

export default lesson;
