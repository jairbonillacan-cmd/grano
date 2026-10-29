// Catálogo de módulos de la ruta (tronco común + áreas DE, DA, BI; niveles 0 a 4).
// BORRADOR redactado a partir de PLAN_GEMINI_4_ARGON.md §5.2. La tarea T3 lo investiga
// con fuentes, lo corrige y lo completa; las lecciones de la Fase 3 se escriben a partir de aquí.
//
// Cada lección es un título (status 'planned') o { legacy: '<id actual>' } si ya existe
// en src/data/stages/ y se migra (status 'existing').

const LEGACY_TITLES = {
  'l1-joins-fanout': 'Grano de una tabla y fan-out en JOINs',
  'l2-window-functions': 'Funciones de ventana y QUALIFY',
  'l3-asof-lateral-ctes': 'Cruces temporales con ASOF JOIN y CTEs',
  'l4-star-schema-obt': 'Esquema en estrella frente a OBT',
  'l5-scd2-history': 'Dimensiones cambiantes: SCD tipo 2',
  'l6-metrics-simpson': 'Métricas no aditivas y paradoja de Simpson',
  'l7-columnar-parquet': 'Parquet por dentro y zone maps',
  'l8-arrow-lance-vortex': 'Memoria columnar con Apache Arrow',
  'l9-duckdb-polars-marimo': 'Análisis local con DuckDB, Polars y Marimo',
  'l10-iceberg-v3-medallion': 'Tablas abiertas con Apache Iceberg',
  'l11-dbt-sqlmesh-dag': 'Transformación con dbt y SQLMesh',
  'l12-contracts-semantic-layer': 'Contratos de datos y capa semántica',
  'l13-cohorts-retention-ltv': 'Cohortes, retención y LTV',
  'l14-ab-testing-cuped': 'Pruebas A/B, SRM y CUPED',
  'l15-bi-tufte-code': 'Percepción visual y reportes como código',
  'l16-cdc-kafka-streaming': 'Captura de cambios con Debezium y Kafka',
  'l17-flink-watermarks-mv': 'Tiempo de evento y watermarks',
  'l18-mcp-semantic-ai-rag': 'Servidores MCP, capa semántica y RAG',
};

function mod(id, track, level, title, goal, prerequisites, lessons, project) {
  return {
    id,
    track,
    level,
    title,
    goal,
    prerequisites,
    project,
    lessons: lessons.map((entry, index) => {
      const order = index + 1;
      if (typeof entry === 'string') {
        return { id: `${id}-${String(order).padStart(2, '0')}`, order, title: entry, status: 'planned' };
      }
      return { id: entry.legacy, order, title: LEGACY_TITLES[entry.legacy], status: 'existing', legacyId: entry.legacy };
    }),
  };
}

export const MODULES = [
  // ── TRONCO COMÚN ─────────────────────────────────────────────
  mod('c0-datos', 'core', 0, 'Qué son los datos',
    'Distinguir tipos de dato, formatos de archivo y qué representa una tabla.',
    [],
    ['Tipos de dato: entero, decimal, texto, fecha y booleano', 'NULL no es cero ni texto vacío', 'Archivos de datos: CSV, JSON, Excel y Parquet', 'Codificación de texto: UTF-8 y caracteres rotos', 'Tablas: filas, columnas y claves'],
    'Abrir tres archivos de Mercado Brisa con formatos distintos y documentar el tipo y significado de cada columna.'),
  mod('c0-hojas', 'core', 0, 'Hojas de cálculo con criterio',
    'Resumir y cruzar datos en una hoja de cálculo sin los errores habituales.',
    ['c0-datos'],
    ['Tablas estructuradas y filtros', 'Tablas dinámicas', 'BUSCARX y sus trampas', 'Errores clásicos: fechas como texto y celdas combinadas'],
    'Construir una tabla dinámica de ventas por mes y categoría y detectar los tres errores sembrados en el archivo.'),
  mod('c0-numeros', 'core', 0, 'Números con sentido',
    'Describir un conjunto de datos con medidas de centro, dispersión y proporción.',
    ['c0-datos'],
    ['Media, mediana y moda', 'Dispersión y percentiles', 'Distribuciones y sesgo', 'Proporciones y tasas', 'Correlación no es causalidad'],
    'Describir el ticket de compra de Mercado Brisa con 5 números y explicar por qué la media engaña.'),
  mod('c0-negocio', 'core', 0, 'Negocio para gente de datos',
    'Explicar cómo gana dinero una empresa y qué mide cada indicador.',
    [],
    ['Ingreso, costo y margen', 'Embudo y conversión', 'Qué es un KPI y qué no', 'Cómo se toma una decisión con datos'],
    'Dibujar el embudo de compra de Mercado Brisa y proponer 3 KPIs con su definición exacta.'),
  mod('c0-herramientas', 'core', 0, 'Herramientas del oficio',
    'Usar la terminal, Git, Python básico y un notebook para trabajar con datos.',
    [],
    ['La terminal sin miedo', 'Git en 30 minutos', 'Python mínimo: variables, listas, diccionarios y funciones', 'Notebooks', 'Leer documentación y mensajes de error'],
    'Crear un repositorio con un notebook que cargue un CSV y responda una pregunta, con su historial en Git.'),
  mod('c1-sql-base', 'core', 1, 'SQL desde cero',
    'Consultar, filtrar, agrupar y transformar una tabla con SQL.',
    ['c0-datos'],
    ['SELECT, FROM y WHERE', 'ORDER BY y LIMIT', 'NULL y la lógica de tres valores', 'GROUP BY y HAVING', 'CASE WHEN', 'Funciones de fecha', 'COUNT(*), COUNT(col) y COUNT(DISTINCT)'],
    'Responder 10 preguntas de negocio sobre la tabla orders con una consulta cada una.'),
  mod('c1-sql-joins', 'core', 1, 'Combinar tablas',
    'Unir tablas sin duplicar ni perder filas y estructurar consultas legibles.',
    ['c1-sql-base'],
    ['Tipos de JOIN: inner, left, full, anti y semi', { legacy: 'l1-joins-fanout' }, 'Subconsultas', 'CTEs legibles', 'UNION frente a UNION ALL'],
    'Calcular ingresos, unidades y reembolsos por cliente cuadrando al céntimo con la tabla orders.'),
  mod('c1-modelo', 'core', 1, 'Modelo relacional y calidad de datos',
    'Diseñar tablas normalizadas y validar la calidad de un dataset antes de usarlo.',
    ['c1-sql-joins'],
    ['Claves primarias y foráneas', 'Normalización de 1FN a 3FN', 'Integridad referencial', 'Calidad: duplicados, nulos y valores imposibles', 'Validar antes de publicar'],
    'Escribir 8 comprobaciones de calidad sobre Mercado Brisa y encontrar los errores sembrados.'),
  mod('c1-python', 'core', 1, 'Python para datos',
    'Cargar, transformar y guardar datos tabulares con Polars y pandas.',
    ['c0-herramientas', 'c1-sql-base'],
    ['DataFrames con Polars y pandas', 'Leer y escribir CSV y Parquet', 'Filtrar, agrupar y unir', 'Fechas y texto', 'Del notebook al script'],
    'Reproducir en Polars tres consultas SQL del módulo anterior y comparar resultados.'),
  mod('c1-viz', 'core', 1, 'Visualización honesta',
    'Elegir y construir el gráfico que responde una pregunta sin distorsionar los datos.',
    ['c0-numeros'],
    ['Elegir el gráfico por la pregunta', 'Ejes, escalas y el cero', 'Color con intención', 'Tablas bien hechas'],
    'Rehacer tres gráficos engañosos de Mercado Brisa y justificar cada cambio.'),
  mod('c2-sql-analitico', 'core', 2, 'SQL analítico',
    'Resolver problemas de series, rankings y cruces temporales con SQL avanzado.',
    ['c1-sql-joins'],
    [{ legacy: 'l2-window-functions' }, { legacy: 'l3-asof-lateral-ctes' }, 'Zonas horarias y calendarios', 'Leer un plan de ejecución con EXPLAIN'],
    'Calcular la media móvil de 7 días y el ranking semanal de productos, con el plan de ejecución comentado.'),
  mod('c2-dimensional', 'core', 2, 'Modelado dimensional',
    'Diseñar hechos y dimensiones que soporten métricas correctas en el tiempo.',
    ['c1-modelo'],
    ['Hechos y dimensiones', { legacy: 'l4-star-schema-obt' }, { legacy: 'l5-scd2-history' }, { legacy: 'l6-metrics-simpson' }, 'Hechos transaccionales, snapshot y acumulativos'],
    'Diseñar el esquema en estrella de ventas de Mercado Brisa con una dimensión de cliente SCD tipo 2.'),

  // ── INGENIERÍA DE DATOS ──────────────────────────────────────
  mod('de2-formatos', 'de', 2, 'Formatos y motores locales',
    'Elegir formato de archivo y motor para que una consulta lea lo mínimo posible.',
    ['c2-sql-analitico'],
    [{ legacy: 'l7-columnar-parquet' }, { legacy: 'l8-arrow-lance-vortex' }, { legacy: 'l9-duckdb-polars-marimo' }, 'Compresión y codificación', 'Particionado de archivos'],
    'Convertir los eventos de CSV a Parquet particionado y medir bytes leídos antes y después.'),
  mod('de2-pipelines', 'de', 2, 'Pipelines',
    'Construir cargas incrementales, idempotentes y orquestadas.',
    ['de2-formatos', 'c1-python'],
    ['ETL frente a ELT', 'Idempotencia y reprocesos', 'Carga incremental', 'Ingesta desde APIs', 'Orquestación: Airflow, Dagster y Prefect', 'Docker para datos'],
    'Pipeline que carga pedidos nuevos cada hora sin duplicar, con reintento seguro.'),
  mod('de3-lakehouse', 'de', 3, 'Lakehouse y almacenes en la nube',
    'Diseñar tablas transaccionales abiertas y estimar su costo en la nube.',
    ['de2-pipelines'],
    [{ legacy: 'l10-iceberg-v3-medallion' }, 'Delta Lake y formatos interoperables', 'Catálogos de tablas', 'BigQuery, Snowflake y Databricks: modelo de costos'],
    'Tabla Iceberg local con time travel y evolución de particiones, con su análisis de costo.'),
  mod('de3-transformacion', 'de', 3, 'Transformación y calidad',
    'Transformar con SQL versionado, probado y con linaje.',
    ['de3-lakehouse', 'c2-dimensional'],
    [{ legacy: 'l11-dbt-sqlmesh-dag' }, 'Tests de datos', { legacy: 'l12-contracts-semantic-layer' }, 'Observabilidad y linaje'],
    'Proyecto dbt de Mercado Brisa con tests, contrato en la tabla de pedidos y documentación.'),
  mod('de4-streaming', 'de', 4, 'Tiempo real',
    'Diseñar flujos de eventos con garantías de orden y completitud explícitas.',
    ['de3-transformacion'],
    [{ legacy: 'l16-cdc-kafka-streaming' }, 'Kafka por dentro', { legacy: 'l17-flink-watermarks-mv' }, 'Exactly-once y sus límites', 'Bases de datos de streaming'],
    'Diseño de un flujo CDC de pedidos a una tabla de métricas por minuto, con su política de datos tardíos.'),
  mod('de4-plataforma', 'de', 4, 'Plataforma y escala',
    'Diseñar una plataforma de datos segura, económica y operable.',
    ['de4-streaming'],
    ['Spark: particiones y shuffles', 'Diseño de una plataforma de datos', 'Seguridad, PII y enmascarado', 'Infraestructura como código', 'FinOps para datos', 'Entrevista de system design'],
    'Documento de diseño de la plataforma de Mercado Brisa con costos, riesgos y alternativas.'),

  // ── ANÁLISIS DE DATOS ────────────────────────────────────────
  mod('da2-inferencia', 'da', 2, 'Probabilidad e inferencia',
    'Cuantificar la incertidumbre de una estimación y contrastar hipótesis.',
    ['c0-numeros', 'c1-python'],
    ['Probabilidad útil', 'Distribuciones normal, binomial y Poisson', 'Muestreo y error estándar', 'Intervalos de confianza', 'Pruebas de hipótesis y p-valor', 'Potencia y tamaño de muestra'],
    'Estimar la tasa de conversión semanal con su intervalo y decidir si el cambio de una semana es ruido.'),
  mod('da2-eda', 'da', 2, 'Exploración con método',
    'Explorar un dataset nuevo con preguntas, perfilado y registro reproducible.',
    ['c1-viz', 'c1-modelo'],
    ['Preguntas antes que gráficos', 'Perfilado de un dataset', 'Valores atípicos: detectar sin borrar', 'Diario de análisis reproducible'],
    'Exploración documentada de los eventos web de Mercado Brisa con 5 hallazgos y su evidencia.'),
  mod('da3-producto', 'da', 3, 'Analítica de producto',
    'Medir adquisición, activación, retención y valor de los clientes.',
    ['da2-eda', 'c2-sql-analitico'],
    ['Embudos', { legacy: 'l13-cohorts-retention-ltv' }, 'Segmentación', 'Atribución de marketing'],
    'Informe de retención por cohorte y canal con recomendación para marketing.'),
  mod('da3-experimentos', 'da', 3, 'Experimentación',
    'Diseñar, analizar y comunicar experimentos controlados.',
    ['da2-inferencia', 'da3-producto'],
    [{ legacy: 'l14-ab-testing-cuped' }, 'Comparaciones múltiples', 'Pruebas secuenciales', 'Enfoque bayesiano', 'Cuándo no hacer un A/B'],
    'Análisis completo del experimento de checkout de Mercado Brisa, incluido el chequeo de SRM.'),
  mod('da4-modelos', 'da', 4, 'Modelos para analistas',
    'Ajustar e interpretar modelos de regresión, series temporales y segmentación.',
    ['da3-experimentos'],
    ['Regresión lineal', 'Regresión logística', 'Series temporales y estacionalidad', 'Pronóstico', 'Clustering'],
    'Pronóstico de demanda semanal por categoría con su error medido en datos que el modelo no vio.'),
  mod('da4-causalidad', 'da', 4, 'Causalidad y comunicación',
    'Estimar efectos causales sin experimento y comunicarlos a dirección.',
    ['da4-modelos'],
    ['Diferencias en diferencias', 'Regresión discontinua', 'Control sintético', 'El memo analítico', 'Presentar a dirección'],
    'Memo de una página sobre el efecto de abrir una tienda nueva, con método y supuestos explícitos.'),

  // ── BUSINESS INTELLIGENCE ────────────────────────────────────
  mod('bi2-metricas', 'bi', 2, 'Métricas y KPIs',
    'Definir métricas sin ambigüedad y organizarlas en árboles de KPIs.',
    ['c0-negocio', 'c2-dimensional'],
    ['Definir una métrica sin ambigüedad', 'Árboles de KPIs', 'Métricas guardia', 'Métrica norte: usos y abusos'],
    'Diccionario de 10 métricas de Mercado Brisa con fórmula, grano, filtros y dueño.'),
  mod('bi2-modelo-semantico', 'bi', 2, 'Modelo semántico en la herramienta',
    'Modelar datos en una herramienta de BI con relaciones y filtros correctos.',
    ['bi2-metricas'],
    ['Esquema en estrella dentro de Power BI', 'Relaciones y cardinalidad', 'Dirección de filtro', 'Tablas de fechas', 'Medidas frente a columnas calculadas'],
    'Modelo semántico de ventas en Power BI sin relaciones ambiguas y con tabla de fechas marcada.'),
  mod('bi2-dax', 'bi', 2, 'DAX',
    'Escribir medidas DAX correctas, legibles y eficientes.',
    ['bi2-modelo-semantico'],
    ['Contexto de fila y contexto de filtro', 'CALCULATE', 'Inteligencia de tiempo', 'Iteradores como SUMX', 'Variables y legibilidad', 'Errores típicos en DAX'],
    'Diez medidas DAX (YoY, YTD, margen, clientes activos…) validadas contra SQL.'),
  mod('bi3-dashboards', 'bi', 3, 'Diseño de tableros',
    'Diseñar tableros que respondan una pregunta y se lean en segundos.',
    ['bi2-dax', 'c1-viz'],
    [{ legacy: 'l15-bi-tufte-code' }, 'Jerarquía y layout', 'Color y accesibilidad', 'Interacción y filtros', 'Tablero ejecutivo frente a operativo'],
    'Tablero ejecutivo de Mercado Brisa revisado con 5 usuarios ficticios y sus tareas.'),
  mod('bi3-gobierno', 'bi', 3, 'Capa semántica y gobierno',
    'Gobernar métricas, accesos y rendimiento en una plataforma de BI.',
    ['bi3-dashboards'],
    [{ legacy: 'l12-contracts-semantic-layer' }, 'Seguridad por filas (RLS)', 'Métricas certificadas', 'Rendimiento: Import, DirectQuery y Direct Lake', 'Looker y Tableau: conceptos equivalentes'],
    'Capa semántica con RLS por tienda y 5 métricas certificadas, con prueba de rendimiento.'),
  mod('bi4-operacion', 'bi', 4, 'BI como código y operación',
    'Versionar, desplegar y medir el uso de reportes como un producto.',
    ['bi3-gobierno'],
    ['BI como código', 'Power BI Projects (PBIP) con Git', 'CI/CD de reportes', 'Medir la adopción de un tablero', 'GenBI y MCP para BI'],
    'Reporte en PBIP con pipeline de despliegue y panel de uso.'),

  // ── EXPERTO COMÚN ────────────────────────────────────────────
  mod('x4-ia-datos', 'core', 4, 'IA y datos',
    'Conectar modelos de lenguaje a datos gobernados y evaluar su calidad.',
    ['c2-dimensional'],
    [{ legacy: 'l18-mcp-semantic-ai-rag' }, 'Por qué falla el text-to-SQL directo', 'RAG sobre datos propios', 'Evaluar sistemas de IA'],
    'Asistente que responde 20 preguntas de negocio vía capa semántica, con su evaluación de aciertos.'),
  mod('x4-carrera', 'core', 4, 'Carrera',
    'Presentar tu trabajo y superar entrevistas técnicas de tu área.',
    [],
    ['Portafolio por área', 'Entrevista técnica por área', 'Explicar un proyecto en 2 minutos'],
    'Portafolio con 3 proyectos de la ruta y su explicación escrita.'),
];

export const MODULES_BY_ID = Object.fromEntries(MODULES.map((m) => [m.id, m]));

// Ruta de un área: tronco común primero, luego los módulos del área, ordenados por nivel.
// Dentro de cada nivel se respeta el orden en que aparecen en MODULES.
export function getTrackPath(trackId) {
  const own = MODULES.filter((m) => m.track === 'core' || m.track === trackId);
  const coreFirst = (m) => (m.track === 'core' ? 0 : 1);
  return own.sort(
    (a, b) =>
      a.level - b.level ||
      coreFirst(a) - coreFirst(b) ||
      MODULES.indexOf(a) - MODULES.indexOf(b)
  );
}
