export const lesson = {
  id: 'bi4-operacion-04-telemetria-adopcion-retiro-tableros',
  moduleId: 'bi4-operacion',
  tracks: ['bi'],
  level: 4,
  order: 4,
  title: 'Telemetría de uso, adopción y retiro de tableros',
  subtitle: 'Telemetría de uso, auditoría de adopción y retiro ordenado de tableros sin uso',
  minutes: 20,
  prerequisites: ['bi4-operacion-03-cicd-pruebas-promocion-entornos'],
  contentVersion: 1,

  hook: 'El espacio de trabajo corporativo de Mercado Brisa acumula 140 tableros publicados en tres años. Cada madrugada a las 05:00, el clúster se satura refrescando decenas de modelos y retrasa el reporte diario de tiendas. Al preguntar qué tableros pueden apagarse, todos dicen que "alguien podría necesitarlos", mientras que el panel nativo solo muestra los últimos 30 días. ¿Cómo instrumentar telemetría histórica para detectar artefactos zombi y retirarlos mediante un protocolo de cuarentena?',

  objectives: [
    'Extraer y modelar eventos de actividad (vistas, usuarios únicos, exportaciones y refrescos) más allá de la ventana nativa de 30 días para auditar la proliferación de tableros (report sprawl).',
    'Diagnosticar tres patologías operativas de adopción mediante SQL: artefactos zombi (refresco activo sin lectores), uso concentrado en un único autor y tableros puente de exportación a hojas de cálculo.',
    'Ejecutar un protocolo de retiro en cuatro fases (detección por umbral, aviso de deprecación, cuarentena de 30 días sin refresco y baja definitiva con respaldo en Git).',
  ],

  sections: [
    {
      id: 'telemetria-historica-mas-alla-30-dias',
      heading: 'Por qué las métricas nativas de 30 días no bastan para gobernar BI',
      body: 'Los paneles predeterminados de uso suelen retener entre 30 y 90 días de historial. Esa ventana corta impide distinguir un reporte obsoleto de un tablero de cierre trimestral o anual. Para operar BI a escala, el equipo extrae a diario los eventos de auditoría (`ActivityEvents` con acciones `ViewReport`, `ExportArtifact` y `RefreshDataset`). Estos registros se guardan en una tabla histórica en el almacén o en archivos Parquet.\n\nAl evaluar la telemetría de un tablero, el conteo bruto de eventos (`total_events`) es una métrica engañosa. Un analista que recarga 500 veces su propio reporte en pruebas genera más eventos que un tablero leído cada lunes por 15 directores. Por ello, toda auditoría combina tres indicadores: **usuarios únicos** (`COUNT(DISTINCT user_id)`), **intensidad por usuario** (`total_events / unique_users`) y **días de inactividad** (`DATEDIFF` hasta la fecha de corte).',
      example: {
        language: 'sql',
        code: `SELECT
  event_type,
  COUNT(*) AS total_events,
  COUNT(DISTINCT user_id) AS unique_users,
  ROUND(1.0 * COUNT(*) / COUNT(DISTINCT user_id), 2) AS events_per_user,
  CAST(MAX(CAST(event_ts AS DATE)) AS VARCHAR) AS last_active_date,
  DATEDIFF('day', MAX(CAST(event_ts AS DATE)), DATE '2025-12-01') AS inactive_days
FROM events
WHERE EXTRACT(YEAR FROM event_ts) = 2025
GROUP BY event_type
ORDER BY inactive_days DESC, event_type ASC;`,
        expectedOutput: [
          {
            event_type: 'page_view',
            total_events: 2910,
            unique_users: 478,
            events_per_user: 6.09,
            last_active_date: '2025-11-16',
            inactive_days: 15,
          },
          {
            event_type: 'product_view',
            total_events: 2871,
            unique_users: 478,
            events_per_user: 6.01,
            last_active_date: '2025-11-16',
            inactive_days: 15,
          },
          {
            event_type: 'add_to_cart',
            total_events: 5476,
            unique_users: 1461,
            events_per_user: 3.75,
            last_active_date: '2025-11-26',
            inactive_days: 5,
          },
          {
            event_type: 'checkout_completed',
            total_events: 5377,
            unique_users: 1473,
            events_per_user: 3.65,
            last_active_date: '2025-11-26',
            inactive_days: 5,
          },
          {
            event_type: 'checkout_started',
            total_events: 5474,
            unique_users: 1450,
            events_per_user: 3.78,
            last_active_date: '2025-11-26',
            inactive_days: 5,
          },
        ],
      },
    },
    {
      id: 'patologias-adopcion-zombis-puentes-exportacion',
      heading: 'Diagnóstico de artefactos zombi y puentes de extracción manual',
      body: 'La proliferación de tableros (*report sprawl*) se manifiesta en tres patologías medibles en el registro de actividad. La primera es el **tablero zombi**. Este artefacto ejecuta varios refrescos programados al día consumiendo CPU y memoria, pero registra `0` espectadores únicos en 60 días.\n\nLa segunda patología es el **artefacto de lector único**. Es un reporte donde más del 90 % de las sesiones pertenecen a su propio autor, revelando una consulta ad-hoc disfrazada de tablero corporativo. La tercera es el **puente de extracción** (*Excel dumper*), donde la razón `ExportArtifact / ViewReport` supera el 40 %. Cuando los usuarios solo entran para descargar una tabla a Excel, el diseño visual no resuelve la pregunta de negocio o falta una dimensión en la capa semántica.',
      example: {
        language: 'yaml',
        code: `governance_policy:
  audit_reference_date: "2025-12-01"
  classifications:
    activo:
      max_inactive_days: 7
      min_unique_users: 400
      action: "Mantener SLA de refresco y monitoreo CI."
    revision:
      condition: "Inactividad moderada (8-14 días) o audiencia entre 250 y 399 usuarios."
      action: "Revisar con el propietario funcional (owner) y optimizar frecuencia de refresco."
    candidato_retiro:
      min_inactive_days: 15
      max_unique_users: 249
      action: "Emitir aviso de deprecación y mover a cuarentena por 30 días."`,
      },
    },
    {
      id: 'protocolo-retiro-cuatro-fases-cuarentena',
      heading: 'Protocolo de retiro ordenado en cuatro fases con cuarentena',
      body: 'Borrar un tablero directamente en producción sin aviso genera desconfianza. También puede interrumpir cierres contables si existía un uso mensual legítimo. El retiro profesional de artefactos sigue un protocolo de cuatro fases respaldado por Git.\n\nEn la primera fase (**Detección**), la consulta de telemetría marca los candidatos que superan el umbral de inactividad y baja audiencia única. En la segunda fase (**Aviso de deprecación**), se notifica al propietario funcional (*content owner*) y se añade un cintillo en el reporte dos semanas antes. En la tercera fase (**Cuarentena**), se pausa el refresco programado para liberar cómputo de inmediato y se archiva el artefacto durante 30 días. En la cuarta fase, si nadie reclamó el reporte durante la cuarentena, se elimina del espacio de trabajo sabiendo que su código TMDL o Markdown sigue etiquetado en Git.',
    },
  ],

  workedExample: {
    title: 'Auditoría de telemetría por flujo y dispositivo para clasificar candidatos a retiro',
    description: 'El equipo de plataforma de Mercado Brisa audita los 15 flujos de telemetría (`event_type` × `device_type`) registrados en la tabla `events` tomando como fecha de corte el `2025-12-01` para decidir qué flujos mantienen soporte activo, cuáles entran a revisión y cuáles pasan a cuarentena de retiro.',
    steps: [
      {
        label: 'Paso 1 — Antipatrón: clasificar únicamente por el volumen bruto de eventos (COUNT)',
        explanation: 'Si ordenamos únicamente por `COUNT(*)` sobre todo el historial, flujos como `page_view` y `product_view` aparentan tener una actividad saludable con más de `3,130` eventos en cada dispositivo. Esta vista oculta tanto cuántos usuarios distintos participan como la fecha en que dejaron de emitir actividad.',
        code: `SELECT
  event_type,
  device_type,
  COUNT(*) AS total_events
FROM events
GROUP BY event_type, device_type
ORDER BY total_events DESC, event_type ASC, device_type ASC;`,
        expectedOutput: [
          { event_type: 'checkout_started', device_type: 'mobile', total_events: 6776 },
          { event_type: 'checkout_completed', device_type: 'desktop', total_events: 6348 },
          { event_type: 'add_to_cart', device_type: 'desktop', total_events: 5920 },
          { event_type: 'checkout_completed', device_type: 'mobile', total_events: 4848 },
          { event_type: 'checkout_started', device_type: 'desktop', total_events: 4848 },
          { event_type: 'add_to_cart', device_type: 'pos_tienda', total_events: 4847 },
          { event_type: 'add_to_cart', device_type: 'mobile', total_events: 4633 },
          { event_type: 'checkout_completed', device_type: 'pos_tienda', total_events: 4204 },
          { event_type: 'checkout_started', device_type: 'pos_tienda', total_events: 3776 },
          { event_type: 'page_view', device_type: 'mobile', total_events: 3134 },
          { event_type: 'product_view', device_type: 'desktop', total_events: 3134 },
          { event_type: 'page_view', device_type: 'desktop', total_events: 3133 },
          { event_type: 'page_view', device_type: 'pos_tienda', total_events: 3133 },
          { event_type: 'product_view', device_type: 'mobile', total_events: 3133 },
          { event_type: 'product_view', device_type: 'pos_tienda', total_events: 3133 },
        ],
      },
      {
        label: 'Paso 2 — Solución: cruzar usuarios únicos e inactividad para clasificar el ciclo de vida',
        explanation: 'Al incorporar `COUNT(DISTINCT user_id)` y `DATEDIFF(\'day\', MAX(CAST(event_ts AS DATE)), DATE \'2025-12-01\')`, comprobamos que los 6 flujos de `page_view` y `product_view` llevan `15` o `16` días inactivos y solo tienen `160` usuarios únicos (`CANDIDATO_RETIRO`), dos flujos en `pos_tienda` requieren `REVISION` y 7 flujos son `ACTIVO`.',
        code: `SELECT
  event_type,
  device_type,
  COUNT(*) AS total_events,
  COUNT(DISTINCT user_id) AS unique_users,
  DATEDIFF('day', MAX(CAST(event_ts AS DATE)), DATE '2025-12-01') AS inactive_days,
  CASE
    WHEN DATEDIFF('day', MAX(CAST(event_ts AS DATE)), DATE '2025-12-01') > 14
         AND COUNT(DISTINCT user_id) < 250 THEN 'CANDIDATO_RETIRO'
    WHEN DATEDIFF('day', MAX(CAST(event_ts AS DATE)), DATE '2025-12-01') <= 7
         AND COUNT(DISTINCT user_id) >= 400 THEN 'ACTIVO'
    ELSE 'REVISION'
  END AS lifecycle_status
FROM events
GROUP BY event_type, device_type
ORDER BY inactive_days DESC, unique_users ASC, event_type ASC, device_type ASC;`,
        expectedOutput: [
          {
            event_type: 'product_view',
            device_type: 'pos_tienda',
            total_events: 3133,
            unique_users: 160,
            inactive_days: 16,
            lifecycle_status: 'CANDIDATO_RETIRO',
          },
          {
            event_type: 'page_view',
            device_type: 'desktop',
            total_events: 3133,
            unique_users: 160,
            inactive_days: 15,
            lifecycle_status: 'CANDIDATO_RETIRO',
          },
          {
            event_type: 'page_view',
            device_type: 'mobile',
            total_events: 3134,
            unique_users: 160,
            inactive_days: 15,
            lifecycle_status: 'CANDIDATO_RETIRO',
          },
          {
            event_type: 'page_view',
            device_type: 'pos_tienda',
            total_events: 3133,
            unique_users: 160,
            inactive_days: 15,
            lifecycle_status: 'CANDIDATO_RETIRO',
          },
          {
            event_type: 'product_view',
            device_type: 'desktop',
            total_events: 3134,
            unique_users: 160,
            inactive_days: 15,
            lifecycle_status: 'CANDIDATO_RETIRO',
          },
          {
            event_type: 'product_view',
            device_type: 'mobile',
            total_events: 3133,
            unique_users: 160,
            inactive_days: 15,
            lifecycle_status: 'CANDIDATO_RETIRO',
          },
          {
            event_type: 'checkout_started',
            device_type: 'pos_tienda',
            total_events: 3776,
            unique_users: 300,
            inactive_days: 8,
            lifecycle_status: 'REVISION',
          },
          {
            event_type: 'checkout_completed',
            device_type: 'pos_tienda',
            total_events: 4204,
            unique_users: 360,
            inactive_days: 6,
            lifecycle_status: 'REVISION',
          },
          {
            event_type: 'add_to_cart',
            device_type: 'pos_tienda',
            total_events: 4847,
            unique_users: 540,
            inactive_days: 6,
            lifecycle_status: 'ACTIVO',
          },
          {
            event_type: 'add_to_cart',
            device_type: 'desktop',
            total_events: 5920,
            unique_users: 730,
            inactive_days: 6,
            lifecycle_status: 'ACTIVO',
          },
          {
            event_type: 'add_to_cart',
            device_type: 'mobile',
            total_events: 4633,
            unique_users: 470,
            inactive_days: 5,
            lifecycle_status: 'ACTIVO',
          },
          {
            event_type: 'checkout_completed',
            device_type: 'mobile',
            total_events: 4848,
            unique_users: 520,
            inactive_days: 5,
            lifecycle_status: 'ACTIVO',
          },
          {
            event_type: 'checkout_started',
            device_type: 'desktop',
            total_events: 4848,
            unique_users: 540,
            inactive_days: 5,
            lifecycle_status: 'ACTIVO',
          },
          {
            event_type: 'checkout_completed',
            device_type: 'desktop',
            total_events: 6348,
            unique_users: 850,
            inactive_days: 5,
            lifecycle_status: 'ACTIVO',
          },
          {
            event_type: 'checkout_started',
            device_type: 'mobile',
            total_events: 6776,
            unique_users: 970,
            inactive_days: 5,
            lifecycle_status: 'ACTIVO',
          },
        ],
      },
    ],
  },

  checks: [
    {
      id: 'chk-bi4-04-excel-dumper',
      type: 'mcq',
      prompt: 'Al auditar los eventos de actividad de un tablero ejecutivo, observas que tiene 180 aperturas al mes y 165 eventos de ExportArtifact hacia Excel. ¿Qué diagnóstico operativo corresponde?',
      options: [
        {
          id: 'a',
          text: 'El tablero funciona como un puente de extracción manual: su diseño visual o el grano expuesto no resuelve la tarea del usuario y obliga a procesar los datos fuera de la plataforma.',
          correct: true,
          feedback: 'Correcto. Una proporción tan alta de exportaciones frente a vistas indica que el reporte solo se usa para descargar tablas crudas.',
        },
        {
          id: 'b',
          text: 'El tablero tiene una adopción visual óptima porque exportar a Excel demuestra que los gráficos de barras son autosuficientes.',
          correct: false,
          feedback: 'Incorrecto. Si el gráfico respondiera la pregunta de negocio, el usuario no necesitaría exportar los datos en cada sesión.',
        },
        {
          id: 'c',
          text: 'Debes duplicar la frecuencia de refresco del modelo semántico a cada 5 minutos sin consultar a los usuarios.',
          correct: false,
          feedback: 'Incorrecto. Aumentar el refresco no corrige el problema de diseño visual ni de grano.',
        },
      ],
      explanation: 'Una tasa elevada de `ExportArtifact` frente a `ViewReport` indica que el tablero actúa como puente de extracción hacia hojas de cálculo, lo que exige rediseñar la vista o exponer el grano requerido en la capa semántica.',
    },
    {
      id: 'chk-bi4-04-quarantine-step',
      type: 'mcq',
      prompt: 'Dentro del protocolo de retiro ordenado de un tablero sin uso, ¿qué acciones definen la fase de cuarentena previa a la eliminación definitiva?',
      options: [
        {
          id: 'a',
          text: 'Pausar el refresco programado para liberar cómputo, ocultar o archivar el artefacto durante 30 días con un aviso visible y conservar su definición versionada en Git por si un proceso legítimo solicita restaurarlo.',
          correct: true,
          feedback: 'Correcto. La cuarentena detiene de inmediato el gasto de refresco y ofrece una ventana reversible de 30 días respaldada en Git.',
        },
        {
          id: 'b',
          text: 'Borrar permanentemente la base de datos de origen y bloquear las cuentas de correo de todo el departamento financiero.',
          correct: false,
          feedback: 'Incorrecto. El retiro de un tablero nunca implica borrar las tablas del almacén de datos.',
        },
        {
          id: 'c',
          text: 'Convertir el modelo TMDL de nuevo en un archivo binario .pbix sin copia de seguridad.',
          correct: false,
          feedback: 'Incorrecto. El código fuente en texto plano permanece etiquetado en Git para garantizar su restauración.',
        },
      ],
      explanation: 'La fase de cuarentena apaga el gasto de cómputo del refresco programado desde el primer día y archiva el reporte durante 30 días, manteniendo el código en Git por si un proceso mensual o trimestral lo reclama.',
    },
    {
      id: 'chk-bi4-04-retention-window',
      type: 'mcq',
      prompt: '¿Por qué es necesario exportar periódicamente el registro de eventos de actividad (ActivityEvents) hacia un almacén propio en lugar de depender solo del reporte nativo de uso del espacio de trabajo?',
      options: [
        {
          id: 'a',
          text: 'Porque el reporte nativo suele retener solo una ventana corta (30 a 90 días), lo que impide auditar tableros de uso trimestral o anual y cruzar vistas contra el historial de costes de refresco.',
          correct: true,
          feedback: 'Correcto. Persistir ActivityEvents en Parquet o en el almacén permite analizar ciclos trimestrales y anuales completos.',
        },
        {
          id: 'b',
          text: 'Porque el reporte nativo borra automáticamente los archivos TMDL del repositorio Git cada lunes.',
          correct: false,
          feedback: 'Incorrecto. El reporte de métricas de uso del espacio de trabajo no modifica el repositorio Git.',
        },
        {
          id: 'c',
          text: 'Porque el reporte nativo solo cuenta eventos ocurridos durante los fines de semana.',
          correct: false,
          feedback: 'Incorrecto. El reporte nativo registra todos los días de la semana, pero descarta los eventos antiguos tras su ventana de retención.',
        },
      ],
      explanation: 'Exportar `ActivityEvents` hacia una tabla histórica propia supera el límite de 30 a 90 días del panel nativo y permite auditar artefactos de uso trimestral o cierre anual antes de retirarlos.',
    },
  ],

  practice: {
    type: 'sql',
    title: 'Auditoría de adopción y cuarentena por campaña en events',
    language: 'sql',
    prompt: 'Audita la adopción de los tableros de seguimiento por campaña (`campaign_id`) en la tabla `events` de Mercado Brisa con fecha de corte `DATE \'2025-12-01\'`. Agrupa por `COALESCE(campaign_id, \'SIN_CAMPANA\') AS campaign_code` y devuelve: `campaign_code`, `total_events` (`COUNT(*)`), `unique_users` (`COUNT(DISTINCT user_id)`), `events_per_user` (`ROUND(1.0 * COUNT(*) / COUNT(DISTINCT user_id), 2)`), `inactive_days` (`DATEDIFF(\'day\', MAX(CAST(event_ts AS DATE)), DATE \'2025-12-01\')`) y `adoption_status` (`CASE WHEN COUNT(DISTINCT user_id) < 800 THEN \'CUARENTENA\' ELSE \'ACTIVO\' END`). Ordena por `unique_users DESC, campaign_code ASC`.',
    starterCode: `-- Auditoría de adopción por campaña en events con corte al 2025-12-01
SELECT
  COALESCE(campaign_id, 'SIN_CAMPANA') AS campaign_code,
  COUNT(*) AS total_events,
  COUNT(user_id) AS unique_users,
  ROUND(1.0 * COUNT(*) / COUNT(user_id), 2) AS events_per_user,
  DATEDIFF('day', MAX(CAST(event_ts AS DATE)), DATE '2025-12-01') AS inactive_days,
  CASE
    WHEN COUNT(user_id) < 800 THEN 'CUARENTENA'
    ELSE 'ACTIVO'
  END AS adoption_status
FROM events
GROUP BY COALESCE(campaign_id, 'SIN_CAMPANA')
ORDER BY unique_users DESC, campaign_code ASC;`,
    expected: `SELECT
  COALESCE(campaign_id, 'SIN_CAMPANA') AS campaign_code,
  COUNT(*) AS total_events,
  COUNT(DISTINCT user_id) AS unique_users,
  ROUND(1.0 * COUNT(*) / COUNT(DISTINCT user_id), 2) AS events_per_user,
  DATEDIFF('day', MAX(CAST(event_ts AS DATE)), DATE '2025-12-01') AS inactive_days,
  CASE
    WHEN COUNT(DISTINCT user_id) < 800 THEN 'CUARENTENA'
    ELSE 'ACTIVO'
  END AS adoption_status
FROM events
GROUP BY COALESCE(campaign_id, 'SIN_CAMPANA')
ORDER BY unique_users DESC, campaign_code ASC;`,
    orderMatters: true,
    hints: [
      'El código inicial usa `COUNT(user_id)` en lugar de `COUNT(DISTINCT user_id)`, lo que cuenta eventos repetidos en vez de usuarios únicos.',
      'Reemplaza `COUNT(user_id)` por `COUNT(DISTINCT user_id)` también en el denominador de `events_per_user`.',
      'Usa `COUNT(DISTINCT user_id) < 800` dentro de la expresión `CASE` para clasificar `CMP-VERANO` (`700` usuarios únicos) en `CUARENTENA`.',
    ],
    solution: `SELECT
  COALESCE(campaign_id, 'SIN_CAMPANA') AS campaign_code,
  COUNT(*) AS total_events,
  COUNT(DISTINCT user_id) AS unique_users,
  ROUND(1.0 * COUNT(*) / COUNT(DISTINCT user_id), 2) AS events_per_user,
  DATEDIFF('day', MAX(CAST(event_ts AS DATE)), DATE '2025-12-01') AS inactive_days,
  CASE
    WHEN COUNT(DISTINCT user_id) < 800 THEN 'CUARENTENA'
    ELSE 'ACTIVO'
  END AS adoption_status
FROM events
GROUP BY COALESCE(campaign_id, 'SIN_CAMPANA')
ORDER BY unique_users DESC, campaign_code ASC;`,
    solutionExplanation: 'Al evaluar `COUNT(DISTINCT user_id)` en lugar del conteo bruto de filas, la consulta distingue los usuarios únicos reales de cada campaña y detecta que `CMP-VERANO` (`700` usuarios únicos, `< 800`) debe pasar a `CUARENTENA`.',
    expectedOutputTable: [
      {
        campaign_code: 'SIN_CAMPANA',
        total_events: 17750,
        unique_users: 1400,
        events_per_user: 12.68,
        inactive_days: 5,
        adoption_status: 'ACTIVO',
      },
      {
        campaign_code: 'CMP-ORIGEN',
        total_events: 14750,
        unique_users: 1200,
        events_per_user: 12.29,
        inactive_days: 5,
        adoption_status: 'ACTIVO',
      },
      {
        campaign_code: 'CMP-BARISTA',
        total_events: 14750,
        unique_users: 1100,
        events_per_user: 13.41,
        inactive_days: 5,
        adoption_status: 'ACTIVO',
      },
      {
        campaign_code: 'CMP-RETENCION',
        total_events: 14750,
        unique_users: 1100,
        events_per_user: 13.41,
        inactive_days: 6,
        adoption_status: 'ACTIVO',
      },
      {
        campaign_code: 'CMP-VERANO',
        total_events: 3000,
        unique_users: 700,
        events_per_user: 4.29,
        inactive_days: 5,
        adoption_status: 'CUARENTENA',
      },
    ],
  },

  roleNotes: {
    de: 'Automatiza un proceso diario que descargue los eventos de la API de auditoría de BI (`ActivityEvents`) y los anexe en una tabla Parquet particionada por mes para conservar al menos 12 meses de telemetría.',
    da: 'Antes de construir un tablero nuevo solicitado por un área, consulta el catálogo y la telemetría de uso para verificar si ya existe un reporte similar que pueda ampliarse en lugar de incrementar el report sprawl.',
    bi: 'Ejecuta cada trimestre la auditoría de inactividad y exportaciones sobre tu espacio de trabajo, aplicando siempre la fase de cuarentena de 30 días con refresco pausado antes de dar de baja un artefacto.',
  },

  summary: [
    'La auditoría de adopción requiere persistir eventos de actividad más allá de los 30 días nativos del espacio de trabajo.',
    'Medir solo el conteo bruto de eventos oculta artefactos de un único lector y flujos abandonados.',
    'Un ratio elevado de exportaciones frente a vistas revela que el tablero opera como un puente de extracción manual hacia hojas de cálculo.',
    'El retiro seguro sigue cuatro fases: detección por umbral, aviso de deprecación, cuarentena de 30 días sin refresco y baja con respaldo en Git.',
  ],

  flashcards: [
    {
      id: 'fc-bi4-04-a',
      front: '¿Qué es un tablero zombi dentro de la operación de BI?',
      back: 'Un reporte cuyo modelo semántico consume recursos diarios de cómputo en refrescos programados pero registra cero lectores únicos durante una ventana prolongada (por ejemplo, 60 o 90 días).',
    },
    {
      id: 'fc-bi4-04-b',
      front: '¿Qué indica una proporción alta de eventos ExportArtifact frente a ViewReport en un tablero?',
      back: 'Que los usuarios utilizan el reporte como puente de extracción manual hacia hojas de cálculo porque la vista actual no responde directamente su pregunta analítica.',
    },
    {
      id: 'fc-bi4-04-c',
      front: '¿Cuáles son las cuatro fases del protocolo de retiro ordenado de tableros?',
      back: '1) Detección por telemetría, 2) aviso previo de deprecación al propietario y lectores, 3) cuarentena de 30 días (ocultamiento y pausa de refresco) y 4) retiro definitivo con respaldo en Git.',
    },
    {
      id: 'fc-bi4-04-d',
      front: '¿Por qué es insuficiente usar COUNT(*) sin COUNT(DISTINCT user_id) para medir la adopción de un reporte?',
      back: 'Porque un único usuario o su propio autor recargando la página decenas de veces infla `COUNT(*)`, aparentando adopción organizacional donde solo hay un lector.',
    },
  ],

  glossaryTerms: [
    'report-sprawl',
    'dashboard-quarantine',
    'pbip-project',
    'c21-semantic-layer',
  ],

  sources: [
    {
      title: 'Microsoft Learn — Monitor usage metrics in workspaces',
      url: 'https://learn.microsoft.com/en-us/power-bi/collaborate-share/service-modern-usage-metrics',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Métricas de vistas, espectadores únicos y ventana de retención de uso.',
    },
    {
      title: 'Microsoft Learn — Track user activities in Microsoft Fabric',
      url: 'https://learn.microsoft.com/en-us/fabric/admin/track-user-activities',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Extracción del registro de eventos de actividad mediante la API REST ActivityEvents.',
    },
    {
      title: 'Microsoft Learn — Fabric adoption roadmap: Content ownership and management',
      url: 'https://learn.microsoft.com/en-us/power-bi/guidance/fabric-adoption-roadmap-content-ownership-and-management',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Propiedad de contenido y control de proliferación de artefactos analíticos (report sprawl).',
    },
    {
      title: 'Microsoft Learn — Fabric adoption roadmap: Governance',
      url: 'https://learn.microsoft.com/en-us/power-bi/guidance/fabric-adoption-roadmap-governance',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Políticas de ciclo de vida, auditoría periódica y retiro ordenado de tableros sin uso.',
    },
  ],

  aiNotes: 'En esta lección enfatiza el contraste entre el Paso 1 (donde `page_view` y `product_view` parecen activos con `3,133` eventos) y el Paso 2 (donde `COUNT(DISTINCT user_id) = 160` e `inactive_days >= 15` los clasifican como `CANDIDATO_RETIRO`). En la práctica SQL, asegúrate de que el estudiante use `COUNT(DISTINCT user_id)` en las tres expresiones.',
};

export default lesson;
