// Áreas de la ruta curricular de Grano (tronco común + 3 especializaciones).
// Refinado y validado por T3 (ver docs/curriculo/fuentes.md y docs/curriculo/cambios-catalogo.md).

const CORE_WORK_TASKS = [
  'Inspeccionar una tabla desconocida y definir con precisión qué representa cada fila (su grano).',
  'Escribir consultas SQL que filtren, agreguen y unan tablas sin duplicar importes ni perder registros.',
  'Comunicar un hallazgo cuantitativo con una tabla o gráfico honesto a personas de negocio.',
];

const DE_WORK_TASKS = [
  'Construir tuberías incrementales e idempotentes que carguen datos nuevos sin duplicar filas ante reintentos.',
  'Modelar tablas abiertas en Parquet e Iceberg optimizando particiones, compresión y costos de lectura.',
  'Implementar contratos de datos, pruebas automatizadas en dbt o SQLMesh y trazabilidad con OpenLineage.',
];

const DA_WORK_TASKS = [
  'Diseñar y evaluar experimentos A/B controlando el tamaño muestral, el sesgo SRM y la varianza con CUPED.',
  'Analizar embudos de conversión, retención por cohortes y valor de vida del cliente ajustado por margen.',
  'Estimar efectos causales e intervalos de confianza y plasmarlos en un memo analítico accionable.',
];

const BI_WORK_TASKS = [
  'Definir indicadores de negocio sin ambigüedad en árboles de KPIs y gobernarlos en una capa semántica.',
  'Modelar esquemas en estrella en Power BI, escribir medidas en DAX y configurar seguridad por filas (RLS).',
  'Diseñar tableros ejecutivos y operativos versionados en Git que se lean en segundos sin ruido visual.',
];

export const TRACKS = [
  {
    id: 'core',
    name: 'Tronco común',
    short: 'Común',
    summary: 'La base técnica de datos, SQL, modelado, Python y criterio de negocio que comparten las tres áreas.',
    workTasks: CORE_WORK_TASKS,
    dayToDay: CORE_WORK_TASKS,
    typicalDay: [
      '09:30 — Revisas la tabla de pedidos de Mercado Brisa y detectas por qué el total diario no cuadra con pagos.',
      '12:00 — Escribes una consulta SQL con CTEs y funciones de ventana para aislar los reembolsos por tienda.',
      '16:00 — Entregas una tabla limpia y un gráfico de barras alineadas que responde la duda del equipo comercial.',
    ],
  },
  {
    id: 'de',
    name: 'Ingeniería de Datos',
    short: 'DE',
    summary: 'Construyes y operas las tuberías, tablas abiertas y contratos que llevan datos confiables a toda la empresa.',
    workTasks: DE_WORK_TASKS,
    dayToDay: DE_WORK_TASKS,
    typicalDay: [
      '09:15 — Revisas una alerta en el orquestador: el proveedor de pagos añadió un campo nuevo en el webhook nocturno.',
      '11:30 — Ajustas el contrato ODCS y el modelo incremental en SQLMesh sobre Apache Iceberg sin recalcular meses pasados.',
      '15:30 — Optimizas el ordenamiento físico de un archivo Parquet para reducir un 85 % los bytes leídos por BI.',
    ],
  },
  {
    id: 'da',
    name: 'Análisis de Datos',
    short: 'DA',
    summary: 'Respondes preguntas de producto y negocio con inferencia estadística, experimentación y modelos causales.',
    workTasks: DA_WORK_TASKS,
    dayToDay: DA_WORK_TASKS,
    typicalDay: [
      '09:30 — Auditas el experimento A/B del nuevo checkout: compruebas que no haya SRM y aplicas ajuste CUPED.',
      '12:30 — Cruzas las cohortes de adquisición de los últimos seis meses en DuckDB y Polars para aislar una caída en retención.',
      '16:30 — Presentas a producto un memo de una página con el intervalo de confianza del efecto y la recomendación.',
    ],
  },
  {
    id: 'bi',
    name: 'Business Intelligence',
    short: 'BI',
    summary: 'Gobiernas el modelo semántico, las medidas DAX y los tableros certificados con los que decide la organización.',
    workTasks: BI_WORK_TASKS,
    dayToDay: BI_WORK_TASKS,
    typicalDay: [
      '09:30 — Concilias con finanzas y operaciones la definición única de margen neto en el catálogo semántico.',
      '11:45 — Escribes y optimizas medidas DAX de comparación interanual en un proyecto Power BI (PBIP) versionado en Git.',
      '16:00 — Rediseñas el tablero semanal de tiendas aplicando reglas de percepción visual y seguridad por filas (RLS).',
    ],
  },
];

export const TRACK_IDS = TRACKS.map((t) => t.id);
