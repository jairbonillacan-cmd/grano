export const lesson = {
  id: 'bi4-operacion-04-telemetria-adopcion-retiro-tableros',
  moduleId: 'bi4-operacion',
  track: 'bi',
  level: 4,
  order: 4,
  title: 'Telemetría de uso, adopción y retiro de tableros',
  subtitle: 'Telemetría de uso, auditoría de adopción y retiro ordenado de tableros sin uso',
  estimatedMinutes: 20,
  prerequisites: ['bi4-operacion-03-cicd-pruebas-promocion-entornos'],
  hook: 'El espacio de trabajo corporativo de Mercado Brisa acumula 140 tableros publicados en los últimos tres años. Cada madrugada a las 05:00, el clúster se satura refrescando decenas de modelos semánticos, retrasando el reporte diario de tiendas. Al preguntar qué tableros pueden apagarse, todos los gerentes responden que "alguien podría necesitarlos algún día", y el panel nativo de métricas solo muestra los últimos 30 días. ¿Cómo instrumentar telemetría histórica de adopción para distinguir el uso real de los artefactos zombi y retirarlos mediante un protocolo de cuarentena sin romper procesos críticos?',
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
        caption: 'Auditoría de telemetría sobre la tabla events de Mercado Brisa en 2025 con fecha de corte 2025-12-01.',
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
        expectedOutput: `event_type | total_events | unique_users | events_per_user | last_active_date | inactive_days
page_view | 2910 | 478 | 6.09 | 2025-11-16 | 15
product_view | 2871 | 478 | 6.01 | 2025-11-16 | 15
add_to_cart | 5476 | 1461 | 3.75 | 2025-11-26 | 5
checkout_completed | 5377 | 1473 | 3.65 | 2025-11-26 | 5
checkout_started | 5474 | 1450 | 3.78 | 2025-11-26 | 5`,
        expectedOutputTable: {
          columns: [
            'event_type',
            'total_events',
            'unique_users',
            'events_per_user',
            'last_active_date',
            'inactive_days',
          ],
          rows: [
            ['page_view', 2910, 478, 6.09, '2025-11-16', 15],
            ['product_view', 2871, 478, 6.01, '2025-11-16', 15],
            ['add_to_cart', 5476, 1461, 3.75, '2025-11-26', 5],
            ['checkout_completed', 5377, 1473, 3.65, '2025-11-26', 5],
            ['checkout_started', 5474, 1450, 3.78, '2025-11-26', 5],
          ],
        },
      },
    },
    {
      id: 'patologias-adopcion-zombis-puentes-exportacion',
      heading: 'Diagnóstico de artefactos zombi y puentes de extracción manual',
      body: 'La proliferación de tableros (*report sprawl*) se manifiesta en tres patologías medibles en el registro de actividad. La primera es el **tablero zombi**. Este artefacto ejecuta varios refrescos programados al día consumiendo CPU y memoria, pero registra `0` espectadores únicos en 60 días.\n\nLa segunda patología es el **artefacto de lector único**. Es un reporte donde más del 90 % de las sesiones pertenecen a su propio autor, revelando una consulta ad-hoc disfrazada de tablero corporativo. La tercera es el **puente de extracción** (*Excel dumper*), donde la razón `ExportArtifact / ViewReport` supera el 40 %. Cuando los usuarios solo entran para descargar una tabla a Excel, el diseño visual no resuelve la pregunta de negocio o falta una dimensión en la capa semántica.',
      codeBlock: {
        language: 'yaml',
        caption: 'Política declarativa de clasificación de ciclo de vida y umbrales de auditoría de artefactos BI.',
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
      callout: {
        type: 'tip',
        title: 'Por qué pausar el refresco es el primer paso de la cuarentena',
        body: 'Desactivar el refresco programado al iniciar la cuarentena libera el 100 % del coste diario de cómputo desde el primer día y actúa como una prueba del grifo (scream test) controlada: si alguien abre el tablero y ve datos estáticos con el aviso de cuarentena, puede solicitar su reactivación en minutos.',
      },
    },
  ],
  workedExample: {
    title: 'Auditoría de telemetría por flujo y dispositivo para clasificar candidatos a retiro',
    scenario: 'El equipo de plataforma de Mercado Brisa audita los 15 flujos de telemetría (`event_type` × `device_type`) registrados en la tabla `events` tomando como fecha de corte el `2025-12-01` para decidir qué flujos mantienen soporte activo, cuáles entran a revisión y cuáles pasan a cuarentena de retiro.',
    steps: [
      {
        label: 'Paso 1 — Antipatrón: clasificar únicamente por el volumen bruto de eventos (COUNT)',
        explanation: 'Si ordenamos únicamente por `COUNT(*)` sobre todo el historial, flujos como `page_view` y `product_view` aparentan tener una actividad saludable con más de `3,130` eventos en cada dispositivo. Esta vista oculta tanto cuántos usuarios distintos participan como la fecha en que dejaron de emitir actividad.',
        sql: `SELECT
  event_type,
  device_type,
  COUNT(*) AS total_events
FROM events
GROUP BY event_type, device_type
ORDER BY total_events DESC, event_type ASC, device_type ASC;`,
        expectedOutput: `event_type | device_type | total_events
checkout_started | mobile | 6776
checkout_completed | desktop | 6348
add_to_cart | desktop | 5920
checkout_completed | mobile | 4848
checkout_started | desktop | 4848
add_to_cart | pos_tienda | 4847
add_to_cart | mobile | 4633
checkout_completed | pos_tienda | 4204
checkout_started | pos_tienda | 3776
page_view | mobile | 3134
product_view | desktop | 3134
page_view | desktop | 3133
page_view | pos_tienda | 3133
product_view | mobile | 3133
product_view | pos_tienda | 3133`,
        expectedOutputTable: {
          columns: ['event_type', 'device_type', 'total_events'],
          rows: [
            ['checkout_started', 'mobile', 6776],
            ['checkout_completed', 'desktop', 6348],
            ['add_to_cart', 'desktop', 5920],
            ['checkout_completed', 'mobile', 4848],
            ['checkout_started', 'desktop', 4848],
            ['add_to_cart', 'pos_tienda', 4847],
            ['add_to_cart', 'mobile', 4633],
            ['checkout_completed', 'pos_tienda', 4204],
            ['checkout_started', 'pos_tienda', 3776],
            ['page_view', 'mobile', 3134],
            ['product_view', 'desktop', 3134],
            ['page_view', 'desktop', 3133],
            ['page_view', 'pos_tienda', 3133],
            ['product_view', 'mobile', 3133],
            ['product_view', 'pos_tienda', 3133],
          ],
        },
      },
      {
        label: 'Paso 2 — Solución: cruzar usuarios únicos e inactividad para clasificar el ciclo de vida',
        explanation: 'Al incorporar `COUNT(DISTINCT user_id)` y `DATEDIFF(\'day\', MAX(CAST(event_ts AS DATE)), DATE \'2025-12-01\')`, descubrimos que los 6 flujos de `page_view` y `product_view` llevan `15` o `16` días inactivos y solo tienen `160` usuarios únicos (`CANDIDATO_RETIRO`), dos flujos en `pos_tienda` requieren `REVISION` y 7 flujos son `ACTIVO`.',
        sql: `SELECT
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
        expectedOutput: `event_type | device_type | total_events | unique_users | inactive_days | lifecycle_status
product_view | pos_tienda | 3133 | 160 | 16 | CANDIDATO_RETIRO
page_view | desktop | 3133 | 160 | 15 | CANDIDATO_RETIRO
page_view | mobile | 3134 | 160 | 15 | CANDIDATO_RETIRO
page_view | pos_tienda | 3133 | 160 | 15 | CANDIDATO_RETIRO
product_view | desktop | 3134 | 160 | 15 | CANDIDATO_RETIRO
product_view | mobile | 3133 | 160 | 15 | CANDIDATO_RETIRO
checkout_started | pos_tienda | 3776 | 300 | 8 | REVISION
checkout_completed | pos_tienda | 4204 | 360 | 6 | REVISION
add_to_cart | pos_tienda | 4847 | 540 | 6 | ACTIVO
add_to_cart | desktop | 5920 | 730 | 6 | ACTIVO
add_to_cart | mobile | 4633 | 470 | 5 | ACTIVO
checkout_completed | mobile | 4848 | 520 | 5 | ACTIVO
checkout_started | desktop | 4848 | 540 | 5 | ACTIVO
checkout_completed | desktop | 6348 | 850 | 5 | ACTIVO
checkout_started | mobile | 6776 | 970 | 5 | ACTIVO`,
        expectedOutputTable: {
          columns: [
            'event_type',
            'device_type',
            'total_events',
            'unique_users',
            'inactive_days',
            'lifecycle_status',
          ],
          rows: [
            ['product_view', 'pos_tienda', 3133, 160, 16, 'CANDIDATO_RETIRO'],
            ['page_view', 'desktop', 3133, 160, 15, 'CANDIDATO_RETIRO'],
            ['page_view', 'mobile', 3134, 160, 15, 'CANDIDATO_RETIRO'],
            ['page_view', 'pos_tienda', 3133, 160, 15, 'CANDIDATO_RETIRO'],
            ['product_view', 'desktop', 3134, 160, 15, 'CANDIDATO_RETIRO'],
            ['product_view', 'mobile', 3133, 160, 15, 'CANDIDATO_RETIRO'],
            ['checkout_started', 'pos_tienda', 3776, 300, 8, 'REVISION'],
            ['checkout_completed', 'pos_tienda', 4204, 360, 6, 'REVISION'],
            ['add_to_cart', 'pos_tienda', 4847, 540, 6, 'ACTIVO'],
            ['add_to_cart', 'desktop', 5920, 730, 6, 'ACTIVO'],
            ['add_to_cart', 'mobile', 4633, 470, 5, 'ACTIVO'],
            ['checkout_completed', 'mobile', 4848, 520, 5, 'ACTIVO'],
            ['checkout_started', 'desktop', 4848, 540, 5, 'ACTIVO'],
            ['checkout_completed', 'desktop', 6348, 850, 5, 'ACTIVO'],
            ['checkout_started', 'mobile', 6776, 970, 5, 'ACTIVO'],
          ],
        },
      },
    ],
  },
  checks: [
    {
      id: 'chk-bi4-04-excel-dumper',
      type: 'multiple-choice',
      prompt: 'Al auditar los eventos de actividad de un tablero ejecutivo, observas que tiene 180 aperturas al mes y 165 eventos de ExportArtifact hacia Excel. ¿Qué diagnóstico operativo corresponde?',
      options: [
        'El tablero funciona como un puente de extracción manual: su diseño visual o el grano expuesto no resuelve la tarea del usuario y obliga a procesar los datos fuera de la plataforma.',
        'El tablero tiene una adopción visual óptima porque exportar a Excel demuestra que los gráficos de barras son autosuficientes.',
        'Debes duplicar la frecuencia de refresco del modelo semántico a cada 5 minutos sin consultar a los usuarios.',
        'Significa que el archivo .gitignore del proyecto tiene un error de sintaxis.',
      ],
      answer: 0,
      explanation: 'La primera opción es correcta: una proporción tan alta de exportaciones frente a vistas indica que las personas usuarias usan el reporte solo como extractor de datos crudos hacia hojas de cálculo, lo que exige rediseñar la vista o exponer la métrica adecuada en la capa semántica.',
    },
    {
      id: 'chk-bi4-04-quarantine-step',
      type: 'multiple-choice',
      prompt: 'Dentro del protocolo de retiro ordenado de un tablero sin uso, ¿qué acciones definen la fase de cuarentena previa a la eliminación definitiva?',
      options: [
        'Pausar el refresco programado para liberar cómputo, ocultar o archivar el artefacto durante 30 días con un aviso visible y conservar su definición versionada en Git por si un proceso legítimo solicita restaurarlo.',
        'Borrar permanentemente la base de datos de origen y bloquear las cuentas de correo de todo el departamento financiero.',
        'Mantener el refresco cada hora durante cinco años adicionales sin avisar a nadie.',
        'Convertir el modelo TMDL de nuevo en un archivo binario .pbix sin copia de seguridad.',
      ],
      answer: 0,
      explanation: 'La primera opción es correcta: la cuarentena apaga inmediatamente el gasto de refresco y oculta el reporte durante un periodo de gracia reversible respaldado en Git. Borrar datos de origen es destructivo, mantener refrescos perpetuos desperdicia recursos y volver a `.pbix` sin respaldo anula la trazabilidad.',
    },
    {
      id: 'chk-bi4-04-retention-window',
      type: 'multiple-choice',
      prompt: '¿Por qué es necesario exportar periódicamente el registro de eventos de actividad (ActivityEvents) hacia un almacén propio en lugar de depender solo del reporte nativo de uso del espacio de trabajo?',
      options: [
        'Porque el reporte nativo suele retener solo una ventana corta (30 a 90 días), lo que impide auditar tableros de uso trimestral o anual y cruzar vistas contra el historial de costes de refresco.',
        'Porque el reporte nativo borra automáticamente los archivos TMDL del repositorio Git cada lunes.',
        'Porque la API ActivityEvents convierte automáticamente las consultas DAX lentas en lenguaje Rust.',
        'Porque el reporte nativo solo cuenta eventos ocurridos durante los fines de semana.',
      ],
      answer: 0,
      explanation: 'La primera opción es correcta: persistir `ActivityEvents` en una tabla histórica permite analizar estacionalidad trimestral/anual y detectar inactividad real de largo plazo. Las demás opciones atribuyen comportamientos inexistentes al reporte nativo y a la API.',
    },
  ],
  practice: {
    type: 'sql',
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
    expectedOutput: `campaign_code | total_events | unique_users | events_per_user | inactive_days | adoption_status
SIN_CAMPANA | 17750 | 1400 | 12.68 | 5 | ACTIVO
CMP-ORIGEN | 14750 | 1200 | 12.29 | 5 | ACTIVO
CMP-BARISTA | 14750 | 1100 | 13.41 | 5 | ACTIVO
CMP-RETENCION | 14750 | 1100 | 13.41 | 6 | ACTIVO
CMP-VERANO | 3000 | 700 | 4.29 | 5 | CUARENTENA`,
    expectedOutputTable: {
      columns: [
        'campaign_code',
        'total_events',
        'unique_users',
        'events_per_user',
        'inactive_days',
        'adoption_status',
      ],
      rows: [
        ['SIN_CAMPANA', 17750, 1400, 12.68, 5, 'ACTIVO'],
        ['CMP-ORIGEN', 14750, 1200, 12.29, 5, 'ACTIVO'],
        ['CMP-BARISTA', 14750, 1100, 13.41, 5, 'ACTIVO'],
        ['CMP-RETENCION', 14750, 1100, 13.41, 6, 'ACTIVO'],
        ['CMP-VERANO', 3000, 700, 4.29, 5, 'CUARENTENA'],
      ],
    },
    hints: [
      'El código inicial usa `COUNT(user_id)` en lugar de `COUNT(DISTINCT user_id)`, lo que cuenta eventos repetidos en vez de usuarios únicos.',
      'Reemplaza `COUNT(user_id)` por `COUNT(DISTINCT user_id)` también en el denominador de `events_per_user`.',
      'Usa `COUNT(DISTINCT user_id) < 800` dentro de la expresión `CASE` para clasificar `CMP-VERANO` (`700` usuarios únicos) en `CUARENTENA`.',
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
      q: '¿Qué es un tablero zombi dentro de la operación de BI?',
      a: 'Un reporte cuyo modelo semántico consume recursos diarios de cómputo en refrescos programados pero registra cero lectores únicos durante una ventana prolongada (por ejemplo, 60 o 90 días).',
    },
    {
      q: '¿Qué indica una proporción alta de eventos ExportArtifact frente a ViewReport en un tablero?',
      a: 'Que los usuarios utilizan el reporte como puente de extracción manual hacia hojas de cálculo porque la vista actual no responde directamente su pregunta analítica.',
    },
    {
      q: '¿Cuáles son las cuatro fases del protocolo de retiro ordenado de tableros?',
      a: '1) Detección por telemetría, 2) aviso previo de deprecación al propietario y lectores, 3) cuarentena de 30 días (ocultamiento y pausa de refresco) y 4) retiro definitivo con respaldo en Git.',
    },
    {
      q: '¿Por qué es insuficiente usar COUNT(*) sin COUNT(DISTINCT user_id) para medir la adopción de un reporte?',
      a: 'Porque un único usuario o su propio autor recargando la página decenas de veces infla `COUNT(*)`, aparentando adopción organizacional donde solo hay un lector.',
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
      accessed: '2026-10-29',
    },
    {
      title: 'Microsoft Learn — Track user activities in Microsoft Fabric',
      url: 'https://learn.microsoft.com/en-us/fabric/admin/track-user-activities',
      accessed: '2026-10-29',
    },
    {
      title: 'Microsoft Learn — Fabric adoption roadmap: Content ownership and management',
      url: 'https://learn.microsoft.com/en-us/power-bi/guidance/fabric-adoption-roadmap-content-ownership-and-management',
      accessed: '2026-10-29',
    },
    {
      title: 'Microsoft Learn — Fabric adoption roadmap: Governance',
      url: 'https://learn.microsoft.com/en-us/power-bi/guidance/fabric-adoption-roadmap-governance',
      accessed: '2026-10-29',
    },
  ],
  aiNotes: 'En esta lección enfatiza el contraste entre el Paso 1 (donde `page_view` y `product_view` parecen activos con `3,133` eventos) y el Paso 2 (donde `COUNT(DISTINCT user_id) = 160` e `inactive_days >= 15` los clasifican como `CANDIDATO_RETIRO`). En la práctica SQL, asegúrate de que el estudiante use `COUNT(DISTINCT user_id)` en las tres expresiones.',
};

export default lesson;
