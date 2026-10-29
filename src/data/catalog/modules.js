// Catálogo oficial de módulos de la ruta curricular de Grano (tronco común + áreas DE, DA, BI; niveles 0 a 4).
// Investigado, corregido y validado por T3 (ver docs/curriculo/fuentes.md, brechas.md y cambios-catalogo.md).
//
// Cada módulo incluye:
// - id, track, level, title, goal (verbo medible en infinitivo), prerequisites
// - lessons: [{ id, order, title, minutes (15..30), status: 'existing'|'planned', legacyId?, legacyOrder? }]
// - estimatedMinutes: suma de los minutos de sus lecciones
// - project: string completo (enunciado + tablas de Mercado Brisa + entregable explícito) para TrackPathView.jsx
// - projectSpec: { prompt, dataset, deliverable }

const LEGACY_LESSONS = {
  'l1-joins-fanout': {
    title: 'Grano de una tabla y fan-out en JOINs',
    legacyOrder: 1,
    minutes: 25,
  },
  'l2-window-functions': {
    title: 'Funciones de ventana y cláusula QUALIFY',
    legacyOrder: 2,
    minutes: 30,
  },
  'l3-asof-lateral-ctes': {
    title: 'Cruces temporales con ASOF JOIN y CTEs modulares',
    legacyOrder: 3,
    minutes: 30,
  },
  'l4-star-schema-obt': {
    title: 'Esquema en estrella frente a tabla ancha (OBT)',
    legacyOrder: 4,
    minutes: 25,
  },
  'l5-scd2-history': {
    title: 'Dimensiones cambiantes: historial con SCD tipo 2',
    legacyOrder: 5,
    minutes: 30,
  },
  'l6-metrics-simpson': {
    title: 'Métricas no aditivas y paradoja de Simpson',
    legacyOrder: 6,
    minutes: 30,
  },
  'l7-columnar-parquet': {
    title: 'Formato físico Parquet v2, zone maps y filtros de Bloom',
    legacyOrder: 7,
    minutes: 30,
  },
  'l8-arrow-lance-vortex': {
    title: 'Memoria columnar con Apache Arrow, Lance y Vortex',
    legacyOrder: 8,
    minutes: 30,
  },
  'l9-duckdb-polars-marimo': {
    title: 'Ejecución local con DuckDB, Polars perezoso y Marimo',
    legacyOrder: 9,
    minutes: 30,
  },
  'l10-iceberg-v3-medallion': {
    title: 'Tablas abiertas con Apache Iceberg v3 y arquitectura Medallion',
    legacyOrder: 10,
    minutes: 30,
  },
  'l11-dbt-sqlmesh-dag': {
    title: 'Transformación declarativa con dbt y SQLMesh',
    legacyOrder: 11,
    minutes: 30,
  },
  'l12-contracts-semantic-layer': {
    title: 'Contratos de datos ejecutables (ODCS v3) y puente semántico',
    legacyOrder: 12,
    minutes: 30,
  },
  'l13-cohorts-retention-ltv': {
    title: 'Cohortes de retención, supervivencia y LTV con margen',
    legacyOrder: 13,
    minutes: 30,
  },
  'l14-ab-testing-cuped': {
    title: 'Pruebas A/B, diagnóstico SRM y reducción de varianza CUPED',
    legacyOrder: 14,
    minutes: 30,
  },
  'l15-bi-tufte-code': {
    title: 'Percepción visual, razón dato-tinta y narrativa ejecutiva',
    legacyOrder: 15,
    minutes: 30,
  },
  'l16-cdc-kafka-streaming': {
    title: 'Captura de cambios (CDC) con Debezium y Kafka',
    legacyOrder: 16,
    minutes: 30,
  },
  'l17-flink-watermarks-mv': {
    title: 'Tiempo de evento y watermarks en Apache Flink',
    legacyOrder: 17,
    minutes: 30,
  },
  'l18-mcp-semantic-ai-rag': {
    title: 'Servidores MCP conectados a la capa semántica y RAG híbrido',
    legacyOrder: 18,
    minutes: 30,
  },
};

function mod(id, track, level, title, goal, prerequisites, lessons, projectSpec) {
  const normalizedLessons = lessons.map((entry, index) => {
    const order = index + 1;
    const plannedId = `${id}-${String(order).padStart(2, '0')}`;
    if (typeof entry === 'string') {
      return {
        id: plannedId,
        order,
        title: entry,
        minutes: 20,
        status: 'planned',
      };
    }
    if (entry.legacy) {
      const meta = LEGACY_LESSONS[entry.legacy];
      return {
        id: entry.legacy,
        order,
        title: entry.title || meta.title,
        minutes: entry.minutes || meta.minutes,
        status: 'existing',
        legacyId: entry.legacy,
        legacyOrder: meta.legacyOrder,
      };
    }
    return {
      id: plannedId,
      order,
      title: entry.title,
      minutes: entry.minutes || 20,
      status: 'planned',
    };
  });

  const estimatedMinutes = normalizedLessons.reduce((acc, l) => acc + l.minutes, 0);
  const project = `${projectSpec.prompt} Dataset: ${projectSpec.dataset}. Entregable: ${projectSpec.deliverable}`;

  return {
    id,
    track,
    level,
    title,
    goal,
    prerequisites,
    lessons: normalizedLessons,
    estimatedMinutes,
    project,
    projectSpec,
  };
}

export const MODULES = [
  // ── TRONCO COMÚN (Niveles 0, 1 y 2) ──────────────────────────
  mod(
    'c0-datos',
    'core',
    0,
    'Qué son los datos',
    'Distinguir tipos de dato, formatos de archivo, codificación UTF-8 y el grano de una tabla.',
    [],
    [
      { title: 'Tipos de dato: entero, decimal exacto, texto, fecha y booleano', minutes: 15 },
      { title: 'Por qué NULL no es cero ni texto vacío', minutes: 15 },
      { title: 'Archivos de datos: CSV, JSON, Excel y Parquet frente a frente', minutes: 20 },
      { title: 'Codificación UTF-8, separadores decimales y caracteres rotos', minutes: 15 },
      { title: 'Tablas: filas, columnas, claves y qué significa el grano', minutes: 20 },
    ],
    {
      prompt: 'Inspeccionar tres archivos de entrada y definir el grano, el tipo de dato y los nulos de cada columna.',
      dataset: 'Mercado Brisa (`customers.csv`, `products.json`, `orders.parquet`)',
      deliverable: 'Diccionario de datos en Markdown con 15 columnas documentadas y 3 anomalías de formato detectadas.',
    }
  ),
  mod(
    'c0-hojas',
    'core',
    0,
    'Hojas de cálculo con criterio',
    'Resumir, cruzar y auditar datos en una hoja de cálculo evitando errores de formato y búsqueda.',
    ['c0-datos'],
    [
      { title: 'Tablas estructuradas, referencias con nombre y filtros limpios', minutes: 15 },
      { title: 'Tablas dinámicas para resumir ventas sin alterar los datos crudos', minutes: 20 },
      { title: 'BUSCARX (XLOOKUP): cruces seguros y trampas con claves duplicadas', minutes: 20 },
      { title: 'Errores frecuentes: fechas guardadas como texto y celdas combinadas', minutes: 15 },
    ],
    {
      prompt: 'Cruzar el catálogo de productos con las ventas mensuales y auditar errores de captura en hoja de cálculo.',
      dataset: 'Mercado Brisa (`orders`, `order_items` y `products` exportados para hoja de cálculo)',
      deliverable: 'Libro con tabla dinámica de ingresos por categoría y tienda más hoja de auditoría con los 3 errores corregidos.',
    }
  ),
  mod(
    'c0-numeros',
    'core',
    0,
    'Números con sentido',
    'Describir un conjunto de datos con medidas de centro, dispersión, forma y proporción sin confundir correlación con causalidad.',
    ['c0-datos'],
    [
      { title: 'Media, mediana y moda: cuándo el promedio miente', minutes: 15 },
      { title: 'Dispersión, rango intercuartílico y percentiles (p50, p90, p99)', minutes: 20 },
      { title: 'Distribuciones asimétricas y sesgo en importes y tiempos de entrega', minutes: 20 },
      { title: 'Proporciones, tasas, puntos porcentuales y puntos base (bps)', minutes: 15 },
      { title: 'Por qué correlación no implica causalidad y variables de confusión', minutes: 20 },
    ],
    {
      prompt: 'Resumir el importe por pedido y el tiempo de reparto usando percentiles y comparar media frente a mediana.',
      dataset: 'Mercado Brisa (`orders` y `payments`)',
      deliverable: 'Ficha estadística con 5 indicadores (mediana, media, IQR, p90, tasa de reembolso) e interpretación en 150 palabras.',
    }
  ),
  mod(
    'c0-negocio',
    'core',
    0,
    'Negocio para gente de datos',
    'Calcular ingreso, costo, margen y tasas de conversión para traducir preguntas de negocio en indicadores medibles.',
    [],
    [
      { title: 'Ingreso bruto, descuentos, devoluciones, costo directo y margen bruto', minutes: 20 },
      { title: 'Embudos de adquisición y conversión paso a paso', minutes: 15 },
      { title: 'Qué hace útil a un KPI y cómo distinguirlo de una métrica de vanidad', minutes: 20 },
      { title: 'De la pregunta ambigua a la decisión respaldada por datos', minutes: 15 },
    ],
    {
      prompt: 'Construir el embudo de compra desde visita web hasta pedido entregado y definir los indicadores financieros del mes.',
      dataset: 'Mercado Brisa (`events`, `orders`, `order_items` y `refunds`)',
      deliverable: 'Documento con el diagrama del embudo de 4 etapas y la ficha formal de 3 KPIs (fórmula, grano y umbral de acción).',
    }
  ),
  mod(
    'c0-herramientas',
    'core',
    0,
    'Herramientas del oficio',
    'Ejecutar comandos de terminal, registrar cambios en Git y correr scripts y cuadernos de Python reproducibles.',
    [],
    [
      { title: 'La terminal sin miedo: rutas, archivos, tuberías y variables de entorno', minutes: 15 },
      { title: 'Git en 30 minutos: commits atómicos, ramas, diff y Pull Requests', minutes: 25 },
      { title: 'Python inicial para datos: variables, colecciones, funciones y entornos con uv', minutes: 25 },
      { title: 'Cuadernos interactivos y reactivos (Jupyter y Marimo): orden de ejecución', minutes: 20 },
      { title: 'Cómo leer trazas de error y buscar en documentación técnica oficial', minutes: 15 },
    ],
    {
      prompt: 'Configurar un proyecto local versionado en Git con un cuaderno que lea y valide las tiendas de Mercado Brisa.',
      dataset: 'Mercado Brisa (`stores` y `calendar`)',
      deliverable: 'Repositorio Git con al menos 3 commits limpios, archivo `README.md` y cuaderno `.py` ejecutable sin errores.',
    }
  ),
  mod(
    'c1-sql-base',
    'core',
    1,
    'SQL desde cero',
    'Consultar, filtrar, agrupar y transformar una tabla con SQL manejando valores nulos y fechas con exactitud.',
    ['c0-datos'],
    [
      { title: 'SELECT, FROM y WHERE: orden lógico de evaluación frente a orden de escritura', minutes: 20 },
      { title: 'ORDER BY, LIMIT y DISTINCT: ordenar y acotar resultados con criterio', minutes: 15 },
      { title: 'NULL, lógica de tres valores, IS NULL y COALESCE', minutes: 20 },
      { title: 'GROUP BY y HAVING: agregar filas y filtrar grupos ya calculados', minutes: 25 },
      { title: 'Expresiones condicionales con CASE WHEN y filtrado con FILTER', minutes: 20 },
      { title: 'Funciones de fecha y tiempo: DATE_TRUNC, DATE_DIFF y extracción de partes', minutes: 20 },
      { title: 'Diferencias exactas entre COUNT(*), COUNT(columna) y COUNT(DISTINCT)', minutes: 20 },
    ],
    {
      prompt: 'Resolver 10 preguntas operativas de ventas, descuentos y entregas sobre una única tabla sin usar JOINs.',
      dataset: 'Mercado Brisa (`orders`)',
      deliverable: 'Archivo `.sql` con las 10 consultas comentadas y sus tablas de salida verificadas en DuckDB.',
    }
  ),
  mod(
    'c1-sql-joins',
    'core',
    1,
    'Combinar tablas',
    'Combinar varias tablas mediante JOINs, subconsultas y CTEs sin duplicar importes ni perder registros.',
    ['c1-sql-base'],
    [
      { title: 'Tipos de JOIN: INNER, LEFT, FULL, SEMI (EXISTS) y ANTI (NOT EXISTS)', minutes: 25 },
      { legacy: 'l1-joins-fanout' },
      { title: 'Subconsultas escalares, de tabla e introducción a correlacionadas', minutes: 20 },
      { title: 'CTEs (WITH) legibles: dividir una consulta compleja en pasos verificables', minutes: 20 },
      { title: 'Operaciones de conjuntos: UNION frente a UNION ALL, INTERSECT y EXCEPT', minutes: 20 },
    ],
    {
      prompt: 'Consolidar ingresos brutos, unidades vendidas, pagos y reembolsos por cliente sin provocar fan-out.',
      dataset: 'Mercado Brisa (`customers`, `orders`, `order_items`, `payments` y `refunds`)',
      deliverable: 'Consulta SQL modular con CTEs pre-agregadas y prueba de reconciliación exacta contra la suma de `orders`.',
    }
  ),
  mod(
    'c1-modelo',
    'core',
    1,
    'Modelo relacional y calidad de datos',
    'Diseñar esquemas relacionales normalizados y escribir comprobaciones SQL que detecten duplicados, nulos y huérfanos.',
    ['c1-sql-joins'],
    [
      { title: 'Claves primarias, naturales, subrogadas y foráneas', minutes: 20 },
      { title: 'Normalización de 1FN a 3FN: evitar anomalías al insertar y actualizar', minutes: 25 },
      { title: 'Integridad referencial y detección de registros huérfanos con ANTI JOIN', minutes: 20 },
      { title: 'Auditoría de calidad: duplicados, nulos inesperados y valores fuera de rango', minutes: 20 },
      { title: 'Reglas de validación bloqueantes antes de publicar una tabla', minutes: 20 },
    ],
    {
      prompt: 'Auditar la calidad de las tablas transaccionales y localizar todos los errores sembrados en el dataset.',
      dataset: 'Mercado Brisa (`customers`, `products`, `orders`, `order_items` y `payments`)',
      deliverable: 'Suite de 8 consultas SQL de validación (que devuelven 0 filas cuando todo es correcto) e informe de hallazgos.',
    }
  ),
  mod(
    'c1-python',
    'core',
    1,
    'Python para datos',
    'Transformar archivos CSV y Parquet con Polars 2.0 y pandas 3.0 pasando de un cuaderno reactivo a un script automatizable.',
    ['c0-herramientas', 'c1-sql-base'],
    [
      { title: 'DataFrames en Polars 2.0 y pandas 3.0: modelo columnar y Copy-on-Write', minutes: 25 },
      { title: 'Lectura y escritura eficiente de CSV, JSON y Parquet con tipado explícito', minutes: 20 },
      { title: 'Filtrar, agrupar, unir y transformar con expresiones vectorizadas', minutes: 25 },
      { title: 'Limpieza de cadenas de texto, fechas y zonas horarias en Python', minutes: 20 },
      { title: 'Del cuaderno interactivo al script modular con argumentos y pruebas', minutes: 20 },
    ],
    {
      prompt: 'Construir un script en Polars que limpie el catálogo y calcule el margen diario por tienda.',
      dataset: 'Mercado Brisa (`orders.parquet`, `order_items.parquet`, `products.parquet` y `stores.parquet`)',
      deliverable: 'Script `resumen_ventas.py` reproducible por línea de comandos que exporta un archivo Parquet validado.',
    }
  ),
  mod(
    'c1-viz',
    'core',
    1,
    'Visualización honesta',
    'Construir gráficos y tablas con escalas honestas, jerarquía visual clara y uso intencional del color.',
    ['c0-numeros'],
    [
      { title: 'Elegir la geometría del gráfico según la pregunta y el tipo de variable', minutes: 20 },
      { title: 'Ejes, escalas, cuándo exigir el cero y peligro de los ejes dobles', minutes: 20 },
      { title: 'Color con intención: paletas secuenciales, divergentes y accesibilidad', minutes: 20 },
      { title: 'Diseño de tablas numéricas: alineación, cifras tabulares y contexto', minutes: 20 },
    ],
    {
      prompt: 'Diagnosticar y rediseñar tres visualizaciones defectuosas de las ventas y entregas de Mercado Brisa.',
      dataset: 'Mercado Brisa (`orders`, `stores` y `calendar`)',
      deliverable: 'Tres gráficos corregidos con título activo, escala honesta y nota técnica justificando cada decisión visual.',
    }
  ),
  mod(
    'c2-sql-analitico',
    'core',
    2,
    'SQL analítico',
    'Resolver problemas de series temporales, rankings y emparejamiento por tiempo con funciones de ventana, ASOF JOIN y EXPLAIN.',
    ['c1-sql-joins'],
    [
      { legacy: 'l2-window-functions' },
      { legacy: 'l3-asof-lateral-ctes' },
      { title: 'Zonas horarias (UTC frente a hora local) y espinas de calendario (Date Spine)', minutes: 25 },
      { title: 'Leer un plan de ejecución con EXPLAIN ANALYZE: escaneos, filtros y uniones', minutes: 25 },
    ],
    {
      prompt: 'Calcular la media móvil de 7 días calendario, el ranking semanal de productos y la atribución temporal de campañas.',
      dataset: 'Mercado Brisa (`orders`, `order_items`, `events`, `marketing_spend` y `calendar`)',
      deliverable: 'Script SQL con las 3 consultas analíticas y el análisis escrito del plan `EXPLAIN ANALYZE` en DuckDB.',
    }
  ),
  mod(
    'c2-dimensional',
    'core',
    2,
    'Modelado dimensional',
    'Modelar tablas de hechos y dimensiones con historial SCD tipo 2 y agregaciones seguras para métricas no aditivas.',
    ['c1-modelo'],
    [
      { title: 'Diseño de hechos y dimensiones conformadas: grano y matriz de bus de Kimball', minutes: 25 },
      { legacy: 'l4-star-schema-obt' },
      { legacy: 'l5-scd2-history' },
      { legacy: 'l6-metrics-simpson' },
      { title: 'Tablas de hechos transaccionales, de instantánea periódica y acumulativas', minutes: 25 },
    ],
    {
      prompt: 'Modelar el esquema en estrella de Mercado Brisa integrando cambios históricos de clientes y métricas de razón.',
      dataset: 'Mercado Brisa (`customers`, `customer_changes`, `products`, `orders`, `order_items` y `refunds`)',
      deliverable: 'DDL y consultas SQL de `dim_customer_scd2`, `dim_product`, `fct_orders` y tabla ancha `obt_sales` verificadas.',
    }
  ),

  // ── INGENIERÍA DE DATOS (DE — Niveles 2, 3 y 4) ──────────────
  mod(
    'de2-formatos',
    'de',
    2,
    'Formas físicas y motores locales',
    'Optimizar el almacenamiento y la lectura local usando Parquet v2, memoria Arrow sin copia y ejecución perezosa en DuckDB y Polars.',
    ['c2-sql-analitico'],
    [
      { legacy: 'l7-columnar-parquet' },
      { legacy: 'l8-arrow-lance-vortex' },
      { legacy: 'l9-duckdb-polars-marimo' },
      { title: 'Codificación por diccionario, RLE, empaquetado delta y compresión Zstandard', minutes: 25 },
      { title: 'Particionado físico de archivos, ordenamiento y problema de archivos pequeños', minutes: 25 },
    ],
    {
      prompt: 'Reestructurar la tabla de eventos de navegación ordenándola y comprimiéndola en Parquet v2 para minimizar el I/O.',
      dataset: 'Mercado Brisa (`events` y `orders`)',
      deliverable: 'Script en DuckDB y Polars con tabla comparativa de tamaño en disco, grupos de filas saltados y tiempo de consulta.',
    }
  ),
  mod(
    'de2-pipelines',
    'de',
    2,
    'Pipelines de ingesta y orquestación',
    'Construir tuberías de ingesta incrementales, idempotentes y contenedorizadas con orquestación basada en activos.',
    ['de2-formatos', 'c1-python'],
    [
      { title: 'Patrones ETL frente a ELT: dónde transformar y cómo desacoplar el almacenamiento', minutes: 20 },
      { title: 'Idempotencia, determinismo y diseño para reprocesamiento histórico (backfill)', minutes: 25 },
      { title: 'Cargas incrementales, marcas de agua de lote (watermarks) y operaciones MERGE', minutes: 25 },
      { title: 'Ingesta resiliente desde APIs HTTP: paginación, límites de tasa y reintentos', minutes: 20 },
      { title: 'Orquestación moderna: Airflow 3 (Data Assets), Dagster y Prefect 3 comparados', minutes: 25 },
      { title: 'Contenedores Docker y compose.yaml para empaquetar pipelines reproducibles', minutes: 20 },
    ],
    {
      prompt: 'Construir un pipeline horario que ingiera pedidos y pagos nuevos de forma idempotente y tolere reintentos sin duplicar.',
      dataset: 'Mercado Brisa (`orders`, `payments` y `refunds` en lotes horarios)',
      deliverable: 'Pipeline en Python y SQL empaquetado con `Dockerfile` y prueba automatizada de doble ejecución con conteo invariante.',
    }
  ),
  mod(
    'de3-lakehouse',
    'de',
    3,
    'Lakehouse abierto y almacenes en la nube',
    'Implementar tablas abiertas en Apache Iceberg v3 con catálogos REST y estimar costos de cómputo y almacenamiento en la nube.',
    ['de2-pipelines'],
    [
      { legacy: 'l10-iceberg-v3-medallion' },
      { title: 'Delta Lake 4.0 e interoperabilidad de formatos mediante Delta UniForm', minutes: 25 },
      { title: 'Catálogos abiertos y gobierno de metadatos: Apache Polaris (REST) y Unity Catalog', minutes: 25 },
      { title: 'Arquitectura y modelo de costos en BigQuery, Snowflake y Databricks', minutes: 25 },
    ],
    {
      prompt: 'Operar una tabla transaccional Apache Iceberg v3 con vectores de borrado, evolución de particiones y viaje en el tiempo.',
      dataset: 'Mercado Brisa (`orders`, `order_items` y `events`)',
      deliverable: 'Script SQL con creación de tabla Iceberg v3, actualización `MERGE`, consulta `FOR SYSTEM_TIME AS OF` y estimación de costos cloud.',
    }
  ),
  mod(
    'de3-transformacion',
    'de',
    3,
    'Transformación declarativa, contratos y calidad',
    'Orquestar transformaciones SQL declarativas con dbt y SQLMesh integrando pruebas automáticas, contratos ODCS v3 y linaje OpenLineage.',
    ['de3-lakehouse', 'c2-dimensional'],
    [
      { legacy: 'l11-dbt-sqlmesh-dag' },
      { title: 'Tests de esquema, pruebas unitarias SQL y auditorías bloqueantes en el DAG', minutes: 25 },
      { legacy: 'l12-contracts-semantic-layer' },
      { title: 'Observabilidad de datos y trazabilidad de extremo a extremo con OpenLineage', minutes: 25 },
    ],
    {
      prompt: 'Estructurar el grafo de transformación Staging → Intermediate → Marts con auditorías automáticas y contrato de datos.',
      dataset: 'Mercado Brisa (`orders`, `order_items`, `payments`, `refunds` y `customers`)',
      deliverable: 'Proyecto declarativo (dbt / SQLMesh) con contrato YAML bajo ODCS v3.2, 6 tests/audits y grafo de linaje por columna.',
    }
  ),
  mod(
    'de4-streaming',
    'de',
    4,
    'Flujos en tiempo real y CDC',
    'Diseñar flujos de captura de cambios (CDC) y procesamiento por tiempo de evento con marcas de agua y estado acotado.',
    ['de3-transformacion'],
    [
      { legacy: 'l16-cdc-kafka-streaming' },
      { title: 'Apache Kafka 4.x por dentro: particiones, consenso KRaft y almacenamiento por niveles', minutes: 25 },
      { legacy: 'l17-flink-watermarks-mv' },
      { title: 'Semántica de entrega (at-least-once frente a exactly-once) y sus límites reales', minutes: 25 },
      { title: 'Vistas materializadas en streaming (Materialize, RisingWave) y OLAP en vivo (ClickHouse)', minutes: 25 },
    ],
    {
      prompt: 'Diseñar e implementar la consolidación CDC de pedidos y pagos con ventanas por tiempo de evento y manejo de retrasos.',
      dataset: 'Mercado Brisa (flujo de cambios CDC sobre `orders`, `payments` y `events`)',
      deliverable: 'Especificación de arquitectura CDC + consultas SQL de consolidación por LSN y ventanas con marca de agua de 30 segundos.',
    }
  ),
  mod(
    'de4-plataforma',
    'de',
    4,
    'Plataforma, seguridad y escala',
    'Planificar una plataforma de datos segura, gobernada y eficiente en costos sobre motores distribuidos e infraestructura como código.',
    ['de4-streaming'],
    [
      { title: 'Apache Spark 4.0: particiones, shuffles, sesgo de datos (data skew) y modo ANSI', minutes: 25 },
      { title: 'Diseño integral de una plataforma de datos: ingesta, almacenamiento, cómputo y consumo', minutes: 25 },
      { title: 'Seguridad de datos, clasificación PII, enmascaramiento dinámico y auditoría', minutes: 20 },
      { title: 'Infraestructura como código (Terraform) y CI/CD para recursos de datos', minutes: 20 },
      { title: 'FinOps para datos: atribución de costos, dimensionamiento y políticas de retención', minutes: 20 },
      { title: 'Resolución paso a paso de una entrevista de diseño de sistemas (System Design) en DE', minutes: 25 },
    ],
    {
      prompt: 'Redactar el diseño de arquitectura completo de la plataforma de datos de Mercado Brisa para escalar 10x el volumen actual.',
      dataset: 'Mercado Brisa (esquema completo de 13 tablas, requisitos de latencia y privacidad PII)',
      deliverable: 'Documento de arquitectura (RFC) con diagrama de componentes, política de enmascarado PII, presupuesto FinOps y matriz de riesgos.',
    }
  ),

  // ── ANÁLISIS DE DATOS (DA — Niveles 2, 3 y 4) ────────────────
  mod(
    'da2-inferencia',
    'da',
    2,
    'Probabilidad e inferencia estadística',
    'Estimar parámetros con intervalos de confianza, contrastar hipótesis y calcular el tamaño de muestra necesario antes de decidir.',
    ['c0-numeros', 'c1-python'],
    [
      { title: 'Probabilidad condicional y teorema de Bayes aplicado a decisiones de negocio', minutes: 20 },
      { title: 'Distribuciones de probabilidad útiles: binomial, Poisson, normal y log-normal', minutes: 20 },
      { title: 'Muestreo, teorema del límite central y cálculo del error estándar', minutes: 25 },
      { title: 'Intervalos de confianza: qué significan realmente y cómo comunicarlos', minutes: 20 },
      { title: 'Pruebas de hipótesis, valor p, tamaño del efecto e interpretación sin falacias', minutes: 25 },
      { title: 'Errores tipo I y II, potencia estadística y cálculo de tamaño de muestra', minutes: 25 },
    ],
    {
      prompt: 'Cuantificar la incertidumbre de la tasa de conversión y del ticket medio por tienda y determinar si la caída semanal es ruido.',
      dataset: 'Mercado Brisa (`orders`, `events` y `stores`)',
      deliverable: 'Cuaderno reproducible con intervalos de confianza al 95 %, prueba de hipótesis y calculadora de tamaño muestral.',
    }
  ),
  mod(
    'da2-eda',
    'da',
    2,
    'Exploración de datos con método',
    'Explorar un conjunto de datos desconocido mediante preguntas estructuradas, perfilado estadístico y registro reproducible de hallazgos.',
    ['c1-viz', 'c1-modelo'],
    [
      { title: 'Formular hipótesis y preguntas refutables antes de abrir un gráfico', minutes: 20 },
      { title: 'Perfilado sistemático de tablas: cardinalidad, completitud, asimetría y dominios', minutes: 25 },
      { title: 'Valores atípicos (outliers): cómo distinguir un error de captura de un cliente real extremo', minutes: 25 },
      { title: 'El diario de análisis reproducible: trazabilidad de supuestos, filtros y descartes', minutes: 20 },
    ],
    {
      prompt: 'Realizar el perfilado completo de la navegación web y de los pedidos separando anomalías técnicas de patrones reales de compra.',
      dataset: 'Mercado Brisa (`events`, `orders`, `order_items` y `products`)',
      deliverable: 'Informe exploratorio reproducible con matriz de perfilado y 5 hallazgos respaldados por consultas SQL y gráficos.',
    }
  ),
  mod(
    'da3-producto',
    'da',
    3,
    'Analítica de producto y crecimiento',
    'Analizar embudos de conversión, cohortes de supervivencia, retención neta y valor de vida del cliente ajustado por margen.',
    ['da2-eda', 'c2-sql-analitico'],
    [
      { title: 'Embudos de conversión por ventana temporal: caída por paso y cuellos de botella', minutes: 25 },
      { legacy: 'l13-cohorts-retention-ltv' },
      { title: 'Segmentación conductual y RFM (recencia, frecuencia y valor monetario)', minutes: 20 },
      { title: 'Atribución de marketing (primer toque, último toque, ASOF) e incrementalidad', minutes: 25 },
    ],
    {
      prompt: 'Construir la matriz triangular de retención de clientes, el LTV de margen bruto a 6 meses y el ratio LTV:CAC por canal.',
      dataset: 'Mercado Brisa (`customers`, `orders`, `order_items`, `refunds` y `marketing_spend`)',
      deliverable: 'Consultas SQL de cohortes sin sesgo de censura y recomendación de reasignación de presupuesto de marketing.',
    }
  ),
  mod(
    'da3-experimentos',
    'da',
    3,
    'Experimentación controlada',
    'Evaluar pruebas A/B controlando desviaciones muestrales (SRM), errores por comparación múltiple y reducción de varianza con CUPED.',
    ['da2-inferencia', 'da3-producto'],
    [
      { legacy: 'l14-ab-testing-cuped' },
      { title: 'Comparaciones múltiples y control de la tasa de descubrimientos falsos (Benjamini-Hochberg)', minutes: 25 },
      { title: 'Pruebas secuenciales (mSPRT) y reglas de parada válidas para monitoreo continuo', minutes: 25 },
      { title: 'Enfoque bayesiano en pruebas A/B: distribuciones a priori y probabilidad de superar al control', minutes: 20 },
      { title: 'Cuándo no se puede hacer un A/B: efectos de red, interferencia y pruebas switchback', minutes: 20 },
    ],
    {
      prompt: 'Auditar y evaluar el experimento del flujo de pago aplicando chequeo chi-cuadrado de SRM, ajuste CUPED y métricas guardia.',
      dataset: 'Mercado Brisa (`experiments`, `experiment_assignments`, `orders`, `refunds` y `events`)',
      deliverable: 'Informe técnico de decisión (Lanzar / No lanzar) con consultas SQL de SRM, estimador CUPED e intervalos al 95 %.',
    }
  ),
  mod(
    'da4-modelos',
    'da',
    4,
    'Modelos estadísticos y pronóstico',
    'Ajustar y validar modelos de regresión, pronóstico de series temporales y segmentación con evaluación fuera de muestra.',
    ['da3-experimentos'],
    [
      { title: 'Regresión lineal múltiple: interpretación de coeficientes, colinealidad y diagnósticos', minutes: 25 },
      { title: 'Regresión logística: razones de momios (odds ratios), calibración de probabilidades y umbral', minutes: 25 },
      { title: 'Series temporales: descomposición en tendencia, estacionalidad semanal y residuo', minutes: 25 },
      { title: 'Pronóstico con validación por ventana rodante (backtesting) y métricas MAE, RMSE y MASE', minutes: 25 },
      { title: 'Agrupamiento (clustering) e interpretación de perfiles sin sobreajustar', minutes: 20 },
    ],
    {
      prompt: 'Pronosticar la demanda semanal por categoría de producto para las próximas 4 semanas y compararla contra un modelo base.',
      dataset: 'Mercado Brisa (`orders`, `order_items`, `products` y `calendar`)',
      deliverable: 'Cuaderno reproducible con evaluación en ventana temporal rodante, tabla de errores MAE/MASE y bandas de predicción.',
    }
  ),
  mod(
    'da4-causalidad',
    'da',
    4,
    'Inferencia causal y comunicación ejecutiva',
    'Estimar efectos causales con métodos cuasi-experimentales cuando no es posible aleatorizar y redactar memos de decisión para dirección.',
    ['da4-modelos'],
    [
      { title: 'Diferencias en diferencias (DiD): supuesto de tendencias paralelas y pruebas de placebo', minutes: 25 },
      { title: 'Regresión discontinua (RDD): estimar el impacto causal alrededor de un umbral de elegibilidad', minutes: 25 },
      { title: 'Control sintético y emparejamiento (matching) para intervenciones en pocas tiendas o regiones', minutes: 25 },
      { title: 'El memo analítico: estructura narrativa, supuestos explícitos y límites del estudio', minutes: 20 },
      { title: 'Presentar a dirección: responder objeciones y traducir incertidumbre en opciones de acción', minutes: 20 },
    ],
    {
      prompt: 'Estimar el efecto causal de una promoción de envío gratuito lanzada solo en un grupo de tiendas sin asignación aleatoria.',
      dataset: 'Mercado Brisa (`orders`, `stores`, `calendar` y `marketing_spend`)',
      deliverable: 'Memo ejecutivo de 1 página con estimación por Diferencias en diferencias, gráfico de tendencias previas y recomendación.',
    }
  ),

  // ── BUSINESS INTELLIGENCE (BI — Niveles 2, 3 y 4) ────────────
  mod(
    'bi2-metricas',
    'bi',
    2,
    'Diseño de métricas y árboles de KPIs',
    'Definir indicadores de negocio sin ambigüedad y estructurarlos en árboles de KPIs con palancas y métricas de control.',
    ['c0-negocio', 'c2-dimensional'],
    [
      { title: 'Anatomía de una métrica sin ambigüedad: fórmula, grano, filtros canónicos y responsable', minutes: 20 },
      { title: 'Construcción de árboles de KPIs: descomponer resultados en palancas operativas', minutes: 25 },
      { title: 'Métricas guardia (guardrails): evitar que optimizar un indicador dañe otro', minutes: 20 },
      { title: 'Métrica estrella polar (North Star): usos legítimos, límites y ley de Goodhart', minutes: 20 },
    ],
    {
      prompt: 'Estandarizar las definiciones de ingresos, margen, retención y nivel de servicio que hoy se calculan distinto entre áreas.',
      dataset: 'Mercado Brisa (`orders`, `order_items`, `payments`, `refunds` y `customers`)',
      deliverable: 'Catálogo de 10 métricas certificadas de Mercado Brisa con árbol de KPIs y consultas SQL de referencia.',
    }
  ),
  mod(
    'bi2-modelo-semantico',
    'bi',
    2,
    'Modelo semántico en la herramienta de BI',
    'Construir modelos semánticos en estrella en Power BI con cardinalidad correcta, tabla de fechas oficial y medidas separadas.',
    ['bi2-metricas'],
    [
      { title: 'Del almacén de datos al esquema en estrella dentro de Power BI (motor VertiPaq)', minutes: 25 },
      { title: 'Relaciones, cardinalidad (1:N) y por qué evitar relaciones muchos a muchos directas', minutes: 25 },
      { title: 'Dirección de filtro cruzado: flujo único frente al peligro de los filtros bidireccionales', minutes: 20 },
      { title: 'Tablas de fechas marcadas, jerarquías fiscales y relaciones inactivas (USERELATIONSHIP)', minutes: 20 },
      { title: 'Medidas frente a columnas calculadas: impacto en memoria RAM y tiempo de refresco', minutes: 20 },
    ],
    {
      prompt: 'Diseñar el modelo semántico en estrella de ventas, reembolsos y calendario sin relaciones ambiguas ni columnas redundantes.',
      dataset: 'Mercado Brisa (`orders`, `order_items`, `products`, `customers`, `stores`, `refunds` y `calendar`)',
      deliverable: 'Diagrama relacional del modelo semántico, especificación de relaciones 1:N y tabla de fechas marcada.',
    }
  ),
  mod(
    'bi2-dax',
    'bi',
    2,
    'Lenguaje DAX con rigor',
    'Escribir medidas DAX legibles y rápidas dominando contextos de evaluación, transición con CALCULATE e inteligencia de tiempo.',
    ['bi2-modelo-semantico'],
    [
      { title: 'Contexto de fila y contexto de filtro: los dos pilares de evaluación en DAX', minutes: 25 },
      { title: 'CALCULATE, modificadores de filtro (ALL, REMOVEFILTERS, KEEPFILTERS) y transición de contexto', minutes: 30 },
      { title: 'Inteligencia de tiempo: YTD, YoY, medias móviles y comparativas a días equivalentes', minutes: 25 },
      { title: 'Funciones iteradoras (SUMX, AVERAGEX, RANKX) y cuándo son necesarias', minutes: 25 },
      { title: 'Variables (VAR / RETURN), manejo de divisiones con DIVIDE y formato limpio', minutes: 20 },
      { title: 'Antipatrones y errores frecuentes en DAX que degradan el rendimiento del reporte', minutes: 20 },
    ],
    {
      prompt: 'Programar el conjunto de medidas financieras y de retención del modelo semántico y conciliarlas contra SQL.',
      dataset: 'Mercado Brisa (`orders`, `order_items`, `refunds`, `customers` y `calendar`)',
      deliverable: 'Archivo con 10 medidas DAX (Ingreso Neto, Margen %, YoY %, YTD, Clientes Activos, Ticket Medio) reconciliadas al céntimo con DuckDB.',
    }
  ),
  mod(
    'bi3-dashboards',
    'bi',
    3,
    'Diseño de tableros ejecutivos y operativos',
    'Diseñar tableros ejecutivos y operativos con alta razón dato-tinta, accesibilidad visual y lectura clara en pocos segundos.',
    ['bi2-dax', 'c1-viz'],
    [
      { legacy: 'l15-bi-tufte-code' },
      { title: 'Jerarquía visual, retícula y patrón de lectura para responder en 10 segundos', minutes: 20 },
      { title: 'Uso restringido del color, contraste WCAG y diseño accesible para daltonismo', minutes: 20 },
      { title: 'Interacción útil: filtros, perforación (drill-through), tooltips y estados vacíos', minutes: 20 },
      { title: 'Diferencias de arquitectura entre un tablero estratégico ejecutivo y uno operativo', minutes: 20 },
    ],
    {
      prompt: 'Diseñar el tablero semanal del comité de dirección y el monitor operativo diario de tiendas eliminando todo ruido gráfico.',
      dataset: 'Mercado Brisa (`orders`, `order_items`, `refunds`, `stores` y `calendar`)',
      deliverable: 'Prototipo funcional del tablero con títulos activos, gráficos de bala, tabla con sparklines y guía de uso por rol.',
    }
  ),
  mod(
    'bi3-gobierno',
    'bi',
    3,
    'Capa semántica, seguridad y gobierno',
    'Gobernar una capa semántica con métricas certificadas, seguridad por filas (RLS) y modos de almacenamiento óptimos.',
    ['bi3-dashboards'],
    [
      { title: 'Capa semántica declarativa con MetricFlow y Cube: entidades, medidas y agregaciones simétricas', minutes: 25 },
      { title: 'Seguridad a nivel de fila (RLS) estática y dinámica y protección de columnas sensibles', minutes: 25 },
      { title: 'Proceso de certificación de métricas, propiedad funcional y control de obsolescencia', minutes: 20 },
      { title: 'Arquitectura de rendimiento: Import, DirectQuery, modelos compuestos y Direct Lake sobre Parquet', minutes: 25 },
      { title: 'Equivalencia de conceptos en la industria: Looker (LookML), Tableau y Power BI', minutes: 20 },
    ],
    {
      prompt: 'Definir la capa semántica gobernada y las reglas de seguridad por tienda para que cada gerente vea solo su región.',
      dataset: 'Mercado Brisa (`orders`, `order_items`, `stores`, `customers` y `refunds`)',
      deliverable: 'Archivo YAML de capa semántica (MetricFlow/Cube) con 5 métricas certificadas, reglas RLS por tienda y matriz de permisos.',
    }
  ),
  mod(
    'bi4-operacion',
    'bi',
    4,
    'BI como código y operación a escala',
    'Operar reportes y modelos de BI como código versionado en Git con despliegue continuo, medición de adopción y soporte para asistentes MCP.',
    ['bi3-gobierno'],
    [
      { title: 'BI como código declarativo con Evidence, Observable Framework y Rill sobre DuckDB-Wasm', minutes: 25 },
      { title: 'Proyectos Power BI (PBIP) y lenguaje TMDL: revisión de modelos y medidas en Git', minutes: 25 },
      { title: 'Integración y despliegue continuo (CI/CD): pruebas automáticas de consultas y promoción de entornos', minutes: 25 },
      { title: 'Telemetría de uso, auditoría de adopción y retiro ordenado de tableros sin uso', minutes: 20 },
      { title: 'GenBI auditable: preparar sinónimos, contexto y citas verificables en la capa semántica para MCP', minutes: 25 },
    ],
    {
      prompt: 'Versionar un reporte ejecutivo como código y configurar su validación automática y sus metadatos para consultas conversacionales.',
      dataset: 'Mercado Brisa (`orders`, `order_items`, `stores`, `refunds` y `calendar`)',
      deliverable: 'Proyecto BI-as-Code en Git (estructura PBIP/TMDL o Markdown+SQL) con script de validación CI y diccionario de sinónimos MCP.',
    }
  ),

  // ── EXPERTO COMÚN (Nivel 4 transversal) ──────────────────────
  mod(
    'x4-ia-datos',
    'core',
    4,
    'IA conectada a datos gobernados',
    'Conectar agentes de lenguaje a capas semánticas y catálogos mediante servidores MCP, búsqueda híbrida y pruebas deterministas.',
    ['c2-dimensional'],
    [
      { legacy: 'l18-mcp-semantic-ai-rag' },
      { title: 'Por qué falla el text-to-SQL directo sobre tablas crudas y cómo lo resuelve la capa semántica', minutes: 25 },
      { title: 'RAG híbrido sobre esquemas y documentos: BM25 + vectores HNSW con Reciprocal Rank Fusion', minutes: 25 },
      { title: 'Evaluación determinista de sistemas de IA con conjuntos Golden Evals y barreras AST (SQLGlot)', minutes: 25 },
    ],
    {
      prompt: 'Diseñar un servidor MCP de solo lectura sobre la capa semántica de Mercado Brisa y evaluarlo con un banco de pruebas.',
      dataset: 'Mercado Brisa (catálogo semántico de `orders`, `customers`, `products`, `refunds` y `stores`)',
      deliverable: 'Especificación de herramientas MCP, consulta de búsqueda híbrida RRF y suite de 20 Golden Evals con resultado esperado exacto.',
    }
  ),
  mod(
    'x4-carrera',
    'core',
    4,
    'Portafolio y entrevistas técnicas',
    'Preparar un portafolio verificable con proyectos reales del área elegida y defender decisiones técnicas en entrevistas.',
    [],
    [
      { title: 'Cómo estructurar un portafolio público por área (DE, DA, BI) con código, datos y decisiones', minutes: 20 },
      { title: 'La entrevista técnica por área: SQL en vivo, estudio de caso y diseño de arquitectura', minutes: 25 },
      { title: 'Explicar un proyecto técnico en 2 minutos: problema, compensaciones y resultado medido', minutes: 20 },
    ],
    {
      prompt: 'Consolidar tres proyectos completados en la ruta en un portafolio limpio con resumen ejecutivo y defensa de decisiones.',
      dataset: 'Mercado Brisa (proyectos desarrollados por el alumno en los niveles 1 a 4)',
      deliverable: 'Repositorio de portafolio con 3 casos documentados (contexto, arquitectura/método, código reproducible y guion de 2 minutos).',
    }
  ),
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
