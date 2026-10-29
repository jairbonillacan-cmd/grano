import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Compass,
  CheckCircle2,
  Sliders,
  Database,
  BarChart3,
  Layers,
  RotateCcw,
  Award,
  BookOpen,
} from 'lucide-react';
import {
  AnswerOption,
  Button,
  Callout,
  Card,
  Chip,
  Illustration,
  ProgressBar,
  getStageNumber,
} from './ui/index.js';

export const MANUAL_TRACK_OPTIONS = [
  {
    id: 'Ruta Completa desde Cero',
    label: 'Ruta Completa desde Cero',
    recommendedStage: 'Etapa 1: Fundamentos y SQL Analítico',
    recommendedStageId: 'stage-1',
    recommendedLessonId: 'l1-joins-fanout',
    focusRole: 'INTEGRAL',
    description:
      'Recorrido secuencial por las 6 etapas y 18 lecciones: desde granularidad en SQL hasta modelado dimensional, motores columnares, estadística A/B y servidores MCP.',
  },
  {
    id: 'Ruta Acelerada Ingeniería DE',
    label: 'Ruta Acelerada Ingeniería DE',
    recommendedStage: 'Etapa 3: Motores Columnares y Formatos Físicos',
    recommendedStageId: 'stage-3',
    recommendedLessonId: 'l7-columnar-parquet',
    focusRole: 'DE',
    description:
      'Prioriza almacenamiento físico en Parquet y Arrow, ejecución vectorizada con DuckDB/Polars, tablas Apache Iceberg v3, Data Contracts y streaming con Kafka/Flink.',
  },
  {
    id: 'Ruta Acelerada Análisis DA',
    label: 'Ruta Acelerada Análisis DA',
    recommendedStage: 'Etapa 2: Modelado Dimensional y Diseño de Métricas',
    recommendedStageId: 'stage-2',
    recommendedLessonId: 'l6-metrics-simpson',
    focusRole: 'DA',
    description:
      'Enfocada en SQL analítico con funciones de ventana, prevención de la Paradoja de Simpson, retención por cohortes y experimentación A/B con reducción de varianza CUPED.',
  },
  {
    id: 'Ruta Acelerada BI & Semántica',
    label: 'Ruta Acelerada BI & Semántica',
    recommendedStage: 'Etapa 2: Modelado Dimensional y Diseño de Métricas',
    recommendedStageId: 'stage-2',
    recommendedLessonId: 'l4-star-schema-obt',
    focusRole: 'BI',
    description:
      'Centrada en esquemas estrella vs. OBT, dimensiones SCD Tipo 2, árboles de KPIs, gobernanza en la Capa Semántica, BI-as-Code y conexión de agentes mediante MCP.',
  },
];

const ADAPTIVE_QUESTION_BANK = [
  // 1. DE - Base (SQL / Joins)
  {
    slot: 1,
    discipline: 'DE',
    disciplineName: 'Ingeniería de Datos',
    topic: 'SQL Analítico y Granularidad en Joins',
    isAdaptiveFollowup: false,
    variants: {
      base: {
        id: 'de-q1-sql-grain',
        irtDifficulty: -0.6,
        irtDiscrimination: 1.3,
        difficultyTier: 'Nivel inicial (IRT b = -0.6)',
        question:
          'Tienes la tabla orders (1 fila por pedido con la columna shipping_fee) y la tabla order_items (hasta 5 filas por pedido, una por cada producto comprado). Si ejecutas un LEFT JOIN directo entre ambas y calculas SUM(orders.shipping_fee), ¿qué ocurre con la métrica resultante?',
        codeSnippet: `SELECT
  o.customer_segment,
  SUM(o.shipping_fee) AS total_shipping_revenue
FROM orders o
LEFT JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY o.customer_segment;`,
        options: [
          {
            id: 'a',
            text: 'Se produce un efecto fan-out: el costo de envío de cada pedido se multiplica por la cantidad de productos que contenga ese pedido.',
            correct: true,
            explanation:
              'Al unir una tabla de granularidad pedido (1) con una de líneas de pedido (N), cada fila de orders se repite N veces antes de aplicar SUM(), inflando silenciosamente el resultado.',
          },
          {
            id: 'b',
            text: 'El motor SQL detecta la clave primaria de orders y suma shipping_fee una sola vez por cada order_id automáticamente.',
            correct: false,
            explanation:
              'Los motores SQL operan sobre el conjunto de filas proyectado tras el JOIN; no deduplican sumas automáticamente a menos que pre-agregues o uses una capa semántica.',
          },
          {
            id: 'c',
            text: 'El LEFT JOIN descarta los pedidos que tienen más de un artículo y subestima el ingreso por envíos.',
            correct: false,
            explanation:
              'Un LEFT JOIN conserva todas las filas de la tabla izquierda y genera tantas filas como coincidencias existan en la tabla derecha.',
          },
        ],
      },
    },
  },

  // 2. DE - Adaptive Follow-up (Columnar / Lakehouse)
  {
    slot: 2,
    discipline: 'DE',
    disciplineName: 'Ingeniería de Datos',
    topic: 'Formatos Columnares y Open Lakehouse',
    isAdaptiveFollowup: true,
    variants: {
      intermediate: {
        id: 'de-q2-parquet-intermediate',
        irtDifficulty: 0.2,
        irtDiscrimination: 1.4,
        difficultyTier: 'Nivel intermedio adaptado (IRT b = +0.2)',
        question:
          'Una consulta analítica necesita sumar únicamente dos columnas (net_amount y tax_amount) sobre una tabla de 120 millones de filas y 85 columnas almacenada en Apache Parquet. ¿Por qué esta lectura es drásticamente más rápida que sobre archivos CSV?',
        codeSnippet: `-- Consulta sobre motor columnar (DuckDB / Polars / Spark)
SELECT region, SUM(net_amount), SUM(tax_amount)
FROM 's3://lakehouse/sales_2026/*.parquet'
WHERE event_date >= DATE '2026-10-01'
GROUP BY region;`,
        options: [
          {
            id: 'a',
            text: 'Porque Parquet almacena los datos de forma contigua por columna (Projection Pushdown) y usa estadísticas min/max por bloque (Zone Maps) para saltar bloques enteros en disco.',
            correct: true,
            explanation:
              'El diseño columnar permite leer del disco únicamente los bytes de las columnas solicitadas y omitir Row Groups cuyos rangos min/max no cumplen el filtro WHERE.',
          },
          {
            id: 'b',
            text: 'Porque Parquet carga primero las 85 columnas en memoria RAM comprimida y luego filtra las filas mediante índices B-Tree tradicionales.',
            correct: false,
            explanation:
              'Justamente la ventaja de Parquet es evitar cargar las 82 columnas que no participan en la consulta.',
          },
          {
            id: 'c',
            text: 'Porque los archivos Parquet no contienen tipos de datos y delegan el parseo de texto al procesador principal.',
            correct: false,
            explanation:
              'Al contrario: Parquet guarda esquemas fuertemente tipados y metadatos binarios en su footer, evitando el costoso parseo de texto línea por línea del CSV.',
          },
        ],
      },
      advanced: {
        id: 'de-q2-iceberg-advanced',
        irtDifficulty: 1.15,
        irtDiscrimination: 1.65,
        difficultyTier: 'Nivel avanzado adaptado (IRT b = +1.15)',
        question:
          'En una arquitectura Open Lakehouse con Apache Iceberg v3, necesitas cambiar el esquema de particionamiento de mensual a diario en una tabla de 40 TB y eliminar registros por cumplimiento legal (GDPR) sin bloquear a los lectores concurrentes. ¿Qué mecanismos técnicos lo hacen posible?',
        codeSnippet: `ALTER TABLE prod_catalog.billing.events
ADD PARTITION FIELD day(event_timestamp);
-- Evolución de partición sin reescribir archivos históricos`,
        options: [
          {
            id: 'a',
            text: 'Hidden Partitioning en los manifiestos de metadatos para evolucionar la partición sin reescribir Parquet antiguos, combinado con Deletion Vectors (merge-on-read) y aislamiento de snapshots.',
            correct: true,
            explanation:
              'Iceberg separa el layout físico de los punteros de metadatos: permite coexistir múltiples especificaciones de partición por snapshot y aplica vectores de borrado sin reescribir gigabytes al instante.',
          },
          {
            id: 'b',
            text: 'Reescritura completa en caliente de las carpetas físicas estilo Hive (year=.../month=...) mediante bloqueos exclusivos de tabla.',
            correct: false,
            explanation:
              'Reescribir carpetas físicas Hive es el antipatrón clásico que Iceberg resolvió mediante el árbol de catálogo, manifest lists y manifest files.',
          },
          {
            id: 'c',
            text: 'Modificar directamente las filas dentro de los archivos Parquet existentes usando punteros mutables en S3.',
            correct: false,
            explanation:
              'Los objetos en S3 y los archivos Parquet son inmutables una vez cerrados; las actualizaciones y borrados se gestionan mediante nuevos snapshots y vectores de posición.',
          },
        ],
      },
    },
  },

  // 3. DA - Base (Statistics & Metrics / Simpson's Paradox)
  {
    slot: 3,
    discipline: 'DA',
    disciplineName: 'Análisis y Estadística',
    topic: 'Diseño de Métricas y Paradoja de Simpson',
    isAdaptiveFollowup: false,
    variants: {
      base: {
        id: 'da-q1-simpson-paradox',
        irtDifficulty: -0.35,
        irtDiscrimination: 1.35,
        difficultyTier: 'Nivel inicial (IRT b = -0.35)',
        question:
          'Al comparar la tasa de conversión entre el Checkout Actual (A) y el Nuevo Checkout (B), observas que B gana tanto en usuarios de Escritorio como en usuarios de Móvil por separado. Sin embargo, al mirar la tasa de conversión global combinada, B parece peor que A. ¿A qué fenómeno estadístico te enfrentas?',
        codeSnippet: `-- Escritorio: A = 12.0% vs B = 13.5% (Gana B)
-- Móvil:      A =  4.0% vs B =  4.8% (Gana B)
-- Global:     A =  9.6% vs B =  7.4% (Parece ganar A)`,
        options: [
          {
            id: 'a',
            text: 'Paradoja de Simpson provocada por una variable de confusión: la variante B recibió una proporción mucho mayor de tráfico móvil (donde la conversión base es naturalmente menor).',
            correct: true,
            explanation:
              'Cuando el peso de los segmentos cambia entre grupos (por ejemplo, 80% de tráfico móvil en B frente a 30% en A), la media global sin ponderar invierte la conclusión real.',
          },
          {
            id: 'b',
            text: 'Un error de redondeo de punto flotante en la función AVG() del motor de base de datos.',
            correct: false,
            explanation:
              'La inversión de tendencias al agregar subgrupos con distinto volumen relativo es una propiedad matemática de las proporciones ponderadas, no un fallo de precisión numérica.',
          },
          {
            id: 'c',
            text: 'Sobreajuste (Overfitting) por dividir los datos en más de una dimensión demográfica.',
            correct: false,
            explanation:
              'Segmentar por una variable de confusión estructural como plataforma no es overfitting; es indispensable para aislar el efecto causal.',
          },
        ],
      },
    },
  },

  // 4. DA - Adaptive Follow-up (A/B Testing & CUPED)
  {
    slot: 4,
    discipline: 'DA',
    disciplineName: 'Análisis y Estadística',
    topic: 'Experimentación A/B y Reducción de Varianza',
    isAdaptiveFollowup: true,
    variants: {
      intermediate: {
        id: 'da-q2-ab-peeking',
        irtDifficulty: 0.3,
        irtDiscrimination: 1.45,
        difficultyTier: 'Nivel intermedio adaptado (IRT b = +0.3)',
        question:
          'Un equipo de producto lanza un experimento A/B planeado para 14 días. Al tercer día revisan el tablero, ven un p-valor de 0.042 a favor del tratamiento y deciden detener el experimento para declarar ganador. ¿Cuál es el riesgo técnico de esta decisión?',
        codeSnippet: `Día 3 de 14: p_value = 0.042 (< 0.05)
Muestra alcanzada: 18% del tamaño muestral calculado (MDE = 1.5%)`,
        options: [
          {
            id: 'a',
            text: 'Inflación severa de falsos positivos (Peeking Problem) y sesgo de ciclo semanal: detener la prueba al primer cruce de p < 0.05 eleva el error Tipo I muy por encima del 5% nominal.',
            correct: true,
            explanation:
              'Las pruebas de hipótesis de horizonte fijo requieren completar el tamaño muestral predefinido (o usar pruebas secuenciales ajustadas) para controlar la tasa de falsos descubrimientos.',
          },
          {
            id: 'b',
            text: 'Ninguno: una vez que el p-valor baja de 0.05 en cualquier instante, la significancia estadística queda garantizada permanentemente.',
            correct: false,
            explanation:
              'El p-valor fluctúa aleatoriamente con muestras pequeñas; detenerse cuando baja de 0.05 capitaliza el ruido aleatorio.',
          },
          {
            id: 'c',
            text: 'Aumenta el error Tipo II (falsos negativos) porque el intervalo de confianza se vuelve demasiado estrecho.',
            correct: false,
            explanation:
              'Con solo el 18% de la muestra, el intervalo de confianza es amplio y el riesgo principal al detener por p < 0.05 es un falso positivo (error Tipo I).',
          },
        ],
      },
      advanced: {
        id: 'da-q2-cuped-advanced',
        irtDifficulty: 1.25,
        irtDiscrimination: 1.7,
        difficultyTier: 'Nivel avanzado adaptado (IRT b = +1.25)',
        question:
          'En un experimento A/B sobre gasto por usuario (métrica con alta asimetría y varianza), aplicas el método CUPED (Controlled-experiment Using Pre-Experiment Data) usando el gasto de los 30 días previos al experimento como covariable X. ¿Cómo reduce CUPED la varianza del estimador sin introducir sesgo?',
        codeSnippet: `Y_cuped = Y_post - theta * (X_pre - E[X_pre])
donde theta = Cov(Y_post, X_pre) / Var(X_pre)`,
        options: [
          {
            id: 'a',
            text: 'Resta la parte de la variabilidad de Y explicada linealmente por el comportamiento pre-experimento X; como X es anterior a la aleatorización, E[X_tratamiento] = E[X_control] y el estimador permanece insesgado.',
            correct: true,
            explanation:
              'La varianza se reduce en un factor de (1 - r²), donde r es la correlación entre la métrica pre y post experimento, permitiendo detectar efectos más pequeños en menos tiempo.',
          },
          {
            id: 'b',
            text: 'Elimina de la muestra a todos los usuarios nuevos o inactivos que no tuvieron compras en el periodo previo para igualar las medias.',
            correct: false,
            explanation:
              'Descartar usuarios cambiaría la población objetivo; CUPED conserva a toda la muestra asignando el valor medio pre-experimento cuando corresponda.',
          },
          {
            id: 'c',
            text: 'Utiliza una variable medida después del lanzamiento del tratamiento como covariable para absorber el efecto directo del experimento.',
            correct: false,
            explanation:
              'Usar una covariable afectada por el tratamiento introduciría sesgo post-tratamiento y anularía la estimación del efecto causal.',
          },
        ],
      },
    },
  },

  // 5. BI - Base (Dimensional Modeling & SCD Type 2)
  {
    slot: 5,
    discipline: 'BI',
    disciplineName: 'Business Intelligence y Semántica',
    topic: 'Modelado Dimensional y SCD Tipo 2',
    isAdaptiveFollowup: false,
    variants: {
      base: {
        id: 'bi-q1-scd-type2',
        irtDifficulty: -0.25,
        irtDiscrimination: 1.4,
        difficultyTier: 'Nivel inicial (IRT b = -0.25)',
        question:
          'En un esquema estrella (Star Schema), un cliente cambia del plan Básico al plan Enterprise el 15 de junio. El área de Finanzas necesita que las ventas de enero a mayo sigan reportándose bajo el plan Básico y las posteriores al 15 de junio bajo Enterprise. ¿Cómo debes modelar la dimensión dim_customer?',
        codeSnippet: `-- Tabla dim_customer
customer_sk | customer_id | plan_tier    | valid_from | valid_to   | is_current
1041        | C-900       | 'Basico'     | 2026-01-01 | 2026-06-15 | false
8812        | C-900       | 'Enterprise' | 2026-06-15 | 9999-12-31 | true`,
        options: [
          {
            id: 'a',
            text: 'Implementar una Dimensión Lentamente Cambiante Tipo 2 (SCD Tipo 2) con clave subrogada (customer_sk) y rangos de vigencia (valid_from, valid_to) asociados a cada hecho.',
            correct: true,
            explanation:
              'SCD Tipo 2 preserva la verdad histórica exacta en el momento de cada transacción mediante claves subrogadas versionadas o joins por intervalo temporal (ASOF / BETWEEN).',
          },
          {
            id: 'b',
            text: 'Sobrescribir la columna plan_tier directamente con UPDATE (SCD Tipo 1) para mantener una sola fila por customer_id.',
            correct: false,
            explanation:
              'SCD Tipo 1 destruye la historia: reasignaría retroactivamente todas las ventas de enero a mayo al nuevo plan Enterprise.',
          },
          {
            id: 'c',
            text: 'Duplicar la tabla completa de hechos cada mes en esquemas separados para congelar los atributos.',
            correct: false,
            explanation:
              'Duplicar toda la tabla de hechos por cambios en atributos descriptivos rompe la escalabilidad y dificulta el análisis interanual.',
          },
        ],
      },
    },
  },

  // 6. BI - Adaptive Follow-up (Semantic Layer & Non-additive metrics / MCP)
  {
    slot: 6,
    discipline: 'BI',
    disciplineName: 'Business Intelligence y Semántica',
    topic: 'Capa Semántica Gobernada y Métricas No Aditivas',
    isAdaptiveFollowup: true,
    variants: {
      intermediate: {
        id: 'bi-q2-semantic-ratios',
        irtDifficulty: 0.25,
        irtDiscrimination: 1.45,
        difficultyTier: 'Nivel intermedio adaptado (IRT b = +0.25)',
        question:
          'En un tablero ejecutivo, quieres mostrar el Ticket Promedio (AOV) tanto por tienda individual como para el total de la compañía. Si pre-calculas una columna aov_store en una tabla diaria y luego haces AVG(aov_store) en la herramienta de BI, ¿por qué el número ejecutivo es incorrecto?',
        codeSnippet: `-- Antipatrón en BI: promediar promedios
SELECT AVG(daily_store_aov) FROM mart_store_daily;

-- Definición en Capa Semántica:
metric_aov = SUM(net_revenue) / NULLIF(COUNT(DISTINCT order_id), 0)`,
        options: [
          {
            id: 'a',
            text: 'Porque los ratios y promedios son métricas no aditivas: promediar promedios le da el mismo peso a una tienda con 5 ventas que a una con 10,000 ventas. Debe calcularse como SUM(ingresos) / COUNT(DISTINCT pedidos) al nivel de agregación consultado.',
            correct: true,
            explanation:
              'La Capa Semántica declara el numerador y el denominador por separado para evaluar la división siempre después de agregar al nivel visualizado.',
          },
          {
            id: 'b',
            text: 'Porque la función AVG() en SQL ignora los valores mayores a la mediana cuando se agrupa por fecha.',
            correct: false,
            explanation:
              'AVG() calcula la media aritmética simple de las filas presentes; el problema radica en que las filas pre-agregadas tienen distintos denominadores.',
          },
          {
            id: 'c',
            text: 'Porque el Ticket Promedio solo puede calcularse exportando las filas crudas a una hoja de cálculo local.',
            correct: false,
            explanation:
              'El motor SQL y la Capa Semántica lo calculan con precisión total sobre millones de registros definiendo la razón de agregaciones.',
          },
        ],
      },
      advanced: {
        id: 'bi-q2-mcp-semantic-advanced',
        irtDifficulty: 1.05,
        irtDiscrimination: 1.6,
        difficultyTier: 'Nivel avanzado adaptado (IRT b = +1.05)',
        question:
          'Al conectar un agente de IA (mediante un servidor Model Context Protocol - MCP) para que dirección general consulte métricas en lenguaje natural, ¿por qué el agente debe invocar la Capa Semántica gobernada en vez de generar SQL libre contra las 300 tablas crudas del Lakehouse?',
        codeSnippet: `// Herramienta MCP expuesta al modelo:
query_semantic_layer({
  metrics: ["net_revenue_retention", "gross_margin_pct"],
  dimensions: ["fiscal_quarter", "enterprise_segment"]
})`,
        options: [
          {
            id: 'a',
            text: 'Porque el SQL libre sobre tablas crudas alucina condiciones de JOIN, olvida filtros de negocio (ej. excluir pedidos cancelados o de prueba) y viola contratos de métricas; la Capa Semántica garantiza determinismo y gobernanza.',
            correct: true,
            explanation:
              'En producción (2026), Text-to-Semantic-Layer vía MCP restringe al modelo a métricas auditadas, relaciones validadas y control de acceso por rol.',
          },
          {
            id: 'b',
            text: 'Porque los modelos de lenguaje actuales no conocen la sintaxis de SELECT o GROUP BY en SQL estándar.',
            correct: false,
            explanation:
              'Los modelos escriben sintaxis SQL válida con facilidad; el riesgo crítico es semántico: inventar reglas de negocio o producir un fan-out silencioso.',
          },
          {
            id: 'c',
            text: 'Porque el protocolo MCP solo permite devolver archivos de imagen estáticos y no estructuras JSON tabulares.',
            correct: false,
            explanation:
              'MCP transporta esquemas estructurados, metadatos de catálogo y respuestas tabulares tipadas con trazabilidad completa.',
          },
        ],
      },
    },
  },
];

function computeDisciplineResult(answersBySlot) {
  const calcDiscipline = (slotBase, slotFollowup) => {
    const a1 = answersBySlot[slotBase];
    const a2 = answersBySlot[slotFollowup];
    const c1 = Boolean(a1?.correct);
    const c2 = Boolean(a2?.correct);

    // 2PL IRT-calibrated ability mapping (0-100 scale)
    if (c1 && c2) return { score: 95, theta: 1.35, level: 'Avanzado' };
    if (c1 && !c2) return { score: 68, theta: 0.35, level: 'Intermedio' };
    if (!c1 && c2) return { score: 56, theta: 0.05, level: 'Intermedio en progreso' };
    return { score: 24, theta: -0.75, level: 'Inicial' };
  };

  const de = calcDiscipline(1, 2);
  const da = calcDiscipline(3, 4);
  const bi = calcDiscipline(5, 6);

  const avgScore = Math.round((de.score + da.score + bi.score) / 3);

  let recommendedStageId = 'stage-1';
  let recommendedStageNumber = 1;
  let recommendedStage = 'Etapa 1: Fundamentos y SQL Analítico';
  let recommendedLessonId = 'l1-joins-fanout';
  let profileLabel = 'Explorador Analítico en Construcción';
  let suggestedTrack = 'Ruta Completa desde Cero';
  let summary = '';

  if (avgScore >= 82) {
    recommendedStageId = 'stage-4';
    recommendedStageNumber = 4;
    recommendedStage = 'Etapa 4: Lakehouse Abierto, Transformación y Capa Semántica';
    recommendedLessonId = 'l10-iceberg-v3-medallion';
    profileLabel = 'Arquitecto Analítico Full-Stack (DE + DA + BI)';
    suggestedTrack =
      de.score >= da.score && de.score >= bi.score
        ? 'Ruta Acelerada Ingeniería DE'
        : da.score >= bi.score
          ? 'Ruta Acelerada Análisis DA'
          : 'Ruta Acelerada BI & Semántica';
    summary =
      'Dominas la granularidad en SQL, el modelado dimensional y el control de sesgos estadísticos. Puedes avanzar directamente a arquitectura Lakehouse con Apache Iceberg v3, experimentación CUPED y servidores MCP.';
  } else if (de.score >= 80 && de.score > da.score + 15) {
    recommendedStageId = 'stage-2';
    recommendedStageNumber = 2;
    recommendedStage = 'Etapa 2: Modelado Dimensional y Diseño de Métricas';
    recommendedLessonId = 'l6-metrics-simpson';
    profileLabel = 'Especialista en Ingeniería con Oportunidad en Estadística y BI';
    suggestedTrack = 'Ruta Acelerada Análisis DA';
    summary =
      'Tienes una base sólida en motores físicos y SQL sin fan-out. Tu mayor retorno de aprendizaje está en el diseño de árboles de KPIs, Paradoja de Simpson, pruebas A/B con CUPED y gobernanza semántica.';
  } else if (da.score >= 80 && da.score > de.score + 15) {
    recommendedStageId = 'stage-3';
    recommendedStageNumber = 3;
    recommendedStage = 'Etapa 3: Motores Columnares y Formatos Físicos';
    recommendedLessonId = 'l7-columnar-parquet';
    profileLabel = 'Analista Cuantitativo con Oportunidad en Ingeniería Lakehouse';
    suggestedTrack = 'Ruta Acelerada Ingeniería DE';
    summary =
      'Razonas con rigor estadístico en experimentación y métricas. Te recomendamos profundizar en el motor físico (Parquet, Arrow, DuckDB, Polars e Iceberg v3) para escalar tus análisis a millones de filas.';
  } else if (bi.score >= 80 && bi.score > de.score + 15) {
    recommendedStageId = 'stage-3';
    recommendedStageNumber = 3;
    recommendedStage = 'Etapa 3: Motores Columnares y Formatos Físicos';
    recommendedLessonId = 'l7-columnar-parquet';
    profileLabel = 'Estratega de BI y Capa Semántica';
    suggestedTrack = 'Ruta Acelerada BI & Semántica';
    summary =
      'Comprendes bien el modelado dimensional SCD Tipo 2 y la gobernanza de KPIs. Reforzar la capa física columnar y la inferencia causal A/B te permitirá liderar arquitecturas de datos completas.';
  } else if (avgScore >= 55) {
    recommendedStageId = 'stage-2';
    recommendedStageNumber = 2;
    recommendedStage = 'Etapa 2: Modelado Dimensional y Diseño de Métricas';
    recommendedLessonId = 'l4-star-schema-obt';
    profileLabel = 'Avanzado de Datos de Nivel Intermedio';
    suggestedTrack = 'Ruta Completa desde Cero';
    summary =
      'Cuentas con buenos cimientos conceptuales, pero aún hay matices técnicos en ítems de dificultad alta (IRT). Empezar en la Etapa 2 o recorrer la ruta integrada consolidará tu criterio en producción.';
  } else {
    recommendedStageId = 'stage-1';
    recommendedStageNumber = 1;
    recommendedStage = 'Etapa 1: Fundamentos y SQL Analítico';
    recommendedLessonId = 'l1-joins-fanout';
    profileLabel = 'Base Fundacional en Desarrollo';
    suggestedTrack = 'Ruta Completa desde Cero';
    summary =
      'El punto de partida ideal es la Etapa 1: dominarás la granularidad de tablas, cómo evitar multiplicaciones silenciosas en JOINs y el uso de Window Functions antes de escalar al Lakehouse.';
  }

  return {
    DE: de.score,
    DA: da.score,
    BI: bi.score,
    levels: { DE: de.level, DA: da.level, BI: bi.level },
    irtTheta: { DE: de.theta, DA: da.theta, BI: bi.theta },
    recommendedStage,
    recommendedStageId,
    recommendedStageNumber,
    recommendedLessonId,
    profileLabel,
    suggestedTrack,
    summary,
  };
}

export function DiagnosticModal({ isOpen, onClose, onCompleteDiagnostic }) {
  const [mode, setMode] = useState('adaptive'); // 'adaptive' | 'manual' | 'results'
  const [currentSlot, setCurrentSlot] = useState(1); // 1..6
  const [answersBySlot, setAnswersBySlot] = useState({});
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [showItemFeedback, setShowItemFeedback] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState('Ruta Completa desde Cero');

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const currentSlotConfig = useMemo(
    () =>
      ADAPTIVE_QUESTION_BANK.find((q) => q.slot === currentSlot) ||
      ADAPTIVE_QUESTION_BANK[0],
    [currentSlot]
  );

  // Adaptive CAT routing: if slot is even (2, 4, 6), pick 'advanced' if previous slot was correct, else 'intermediate'
  const activeQuestion = useMemo(() => {
    if (!currentSlotConfig.isAdaptiveFollowup) {
      return currentSlotConfig.variants.base;
    }
    const prevAnswer = answersBySlot[currentSlot - 1];
    return prevAnswer?.correct
      ? currentSlotConfig.variants.advanced
      : currentSlotConfig.variants.intermediate;
  }, [currentSlotConfig, answersBySlot, currentSlot]);

  const computedDiagnostic = useMemo(
    () => computeDisciplineResult(answersBySlot),
    [answersBySlot]
  );

  if (!isOpen) return null;

  const handleSelectOption = (option) => {
    setSelectedOptionId(option.id);
    setShowItemFeedback(true);
    setAnswersBySlot((prev) => ({
      ...prev,
      [currentSlot]: {
        questionId: activeQuestion.id,
        optionId: option.id,
        correct: option.correct,
        irtDifficulty: activeQuestion.irtDifficulty,
        discipline: currentSlotConfig.discipline,
      },
    }));
  };

  const handleNextQuestion = () => {
    if (currentSlot < 6) {
      const nextSlot = currentSlot + 1;
      setCurrentSlot(nextSlot);
      const existingNext = answersBySlot[nextSlot];
      setSelectedOptionId(existingNext ? existingNext.optionId : null);
      setShowItemFeedback(Boolean(existingNext));
    } else {
      const resultPreview = computeDisciplineResult(answersBySlot);
      setSelectedTrack(resultPreview.suggestedTrack);
      setMode('results');
    }
  };

  const handleResetQuiz = () => {
    setAnswersBySlot({});
    setCurrentSlot(1);
    setSelectedOptionId(null);
    setShowItemFeedback(false);
    setMode('adaptive');
  };

  const handleFinishAndApply = (trackOverride) => {
    const finalTrackId =
      trackOverride || selectedTrack || computedDiagnostic.suggestedTrack;
    const trackMeta =
      MANUAL_TRACK_OPTIONS.find((t) => t.id === finalTrackId) ||
      MANUAL_TRACK_OPTIONS[0];

    const hasCompletedQuiz = Object.keys(answersBySlot).length === 6;

    const payload = hasCompletedQuiz
      ? {
          DE: computedDiagnostic.DE,
          DA: computedDiagnostic.DA,
          BI: computedDiagnostic.BI,
          recommendedStage:
            finalTrackId !== computedDiagnostic.suggestedTrack
              ? trackMeta.recommendedStage
              : computedDiagnostic.recommendedStage,
          recommendedStageId:
            finalTrackId !== computedDiagnostic.suggestedTrack
              ? trackMeta.recommendedStageId
              : computedDiagnostic.recommendedStageId,
          recommendedStageNumber:
            finalTrackId !== computedDiagnostic.suggestedTrack
              ? getStageNumber(trackMeta.recommendedStageId)
              : computedDiagnostic.recommendedStageNumber,
          recommendedLessonId:
            finalTrackId !== computedDiagnostic.suggestedTrack
              ? trackMeta.recommendedLessonId
              : computedDiagnostic.recommendedLessonId,
          profileLabel: computedDiagnostic.profileLabel,
          summary: computedDiagnostic.summary,
          trackPreference: finalTrackId,
          irtTheta: computedDiagnostic.irtTheta,
          mode: 'adaptive-irt',
        }
      : {
          DE: trackMeta.focusRole === 'DE' ? 78 : 50,
          DA: trackMeta.focusRole === 'DA' ? 78 : 50,
          BI: trackMeta.focusRole === 'BI' ? 78 : 50,
          recommendedStage: trackMeta.recommendedStage,
          recommendedStageId: trackMeta.recommendedStageId,
          recommendedStageNumber: getStageNumber(trackMeta.recommendedStageId),
          recommendedLessonId: trackMeta.recommendedLessonId,
          profileLabel: `Selección Manual: ${trackMeta.label}`,
          summary: trackMeta.description,
          trackPreference: finalTrackId,
          mode: 'manual-track',
        };

    if (onCompleteDiagnostic) {
      onCompleteDiagnostic(payload);
    }
    if (onClose) {
      onClose();
    }
  };

  const selectedOptionObj = activeQuestion.options.find(
    (o) => o.id === selectedOptionId
  );
  const progressPct = Math.round((currentSlot / 6) * 100);
  const recStageNum = computedDiagnostic.recommendedStageNumber || 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="diagnostic-modal-title"
      className="diag-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className="diag-modal">
        {/* Top Modal Header */}
        <header className="diag-header">
          <div>
            <div className="diag-header__eyebrow">
              <Compass size={16} />
              <span>Evaluación adaptativa de nivelación (Modelo IRT)</span>
            </div>
            <h2 id="diagnostic-modal-title" className="diag-header__title">
              Diagnóstico de Ubicación: Ingeniería, Análisis y BI
            </h2>
            <p className="diag-header__sub">
              Calibra tu dominio inicial en 6 preguntas adaptativas o elige una
              preferencia de ruta manual.
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            ariaLabel="Cerrar ventana de diagnóstico"
          >
            <X size={16} />
            <span>Cerrar</span>
          </Button>
        </header>

        {/* Mode Switcher Bar */}
        <div className="diag-mode-bar">
          <div className="diag-mode-bar__btns">
            <Button
              variant={mode === 'adaptive' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setMode('adaptive')}
            >
              <Sliders size={14} />
              <span>Test Adaptativo (6 preguntas IRT)</span>
            </Button>
            <Button
              variant={mode === 'manual' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setMode('manual')}
            >
              <Layers size={14} />
              <span>Elegir Ruta Manualmente</span>
            </Button>
            {Object.keys(answersBySlot).length === 6 && (
              <Button
                variant={mode === 'results' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setMode('results')}
              >
                <Award size={14} />
                <span>Resultados del Diagnóstico</span>
              </Button>
            )}
          </div>

          <div className="diag-mode-bar__meta tabular">
            6 preguntas en total (2 DE, 2 DA, 2 BI)
          </div>
        </div>

        {/* =========================================================
            MODE 1: 6-QUESTION ADAPTIVE PLACEMENT TEST (CAT / IRT)
            ========================================================= */}
        {mode === 'adaptive' && (
          <div className="diag-body">
            {/* ProgressBar arriba + metadatos de la pregunta */}
            <div className="diag-progress-block">
              <div className="diag-progress-head">
                <div className="diag-progress-chips">
                  <Chip variant="role" role={currentSlotConfig.discipline}>
                    {currentSlotConfig.discipline}:{' '}
                    {currentSlotConfig.disciplineName}
                  </Chip>
                  <Chip variant="neutral">{activeQuestion.difficultyTier}</Chip>
                </div>

                <span className="diag-progress-count tabular">
                  Pregunta {currentSlot} de 6 ({currentSlotConfig.topic})
                </span>
              </div>

              <ProgressBar
                value={progressPct}
                tone="primary"
                size="md"
                label={`Progreso del diagnóstico: pregunta ${currentSlot} de 6`}
              />

              <div
                className="diag-slots-strip"
                aria-label="Pasos del diagnóstico"
              >
                {[1, 2, 3, 4, 5, 6].map((slotNum) => {
                  const ans = answersBySlot[slotNum];
                  const isCurrent = slotNum === currentSlot;
                  let stateClass = '';
                  if (ans) {
                    stateClass = ans.correct
                      ? 'diag-slot-pill--correct'
                      : 'diag-slot-pill--incorrect';
                  } else if (isCurrent) {
                    stateClass = 'diag-slot-pill--current';
                  }
                  return (
                    <div
                      key={slotNum}
                      className={`diag-slot-pill ${stateClass}`.trim()}
                    />
                  );
                })}
              </div>
            </div>

            {/* Question Card (una pregunta por pantalla) */}
            <Card className="diag-question-card">
              <h3 className="diag-question-title">{activeQuestion.question}</h3>

              {activeQuestion.codeSnippet && (
                <pre className="code-block-dark tabular diag-question-code">
                  <code>{activeQuestion.codeSnippet}</code>
                </pre>
              )}
            </Card>

            {/* Opciones usando <AnswerOption> */}
            <fieldset className="diag-options-fieldset">
              <legend className="diag-options-legend">
                Selecciona la respuesta técnicamente correcta:
              </legend>

              <div className="diag-options-list">
                {activeQuestion.options.map((opt, idx) => {
                  const isSelected = selectedOptionId === opt.id;
                  return (
                    <AnswerOption
                      key={opt.id}
                      letter={opt.id.toUpperCase()}
                      index={idx}
                      selected={isSelected}
                      correct={showItemFeedback && opt.correct}
                      incorrect={showItemFeedback && isSelected && !opt.correct}
                      feedback={
                        showItemFeedback && (isSelected || opt.correct)
                          ? opt.explanation
                          : undefined
                      }
                      onClick={() => handleSelectOption(opt)}
                    >
                      {opt.text}
                    </AnswerOption>
                  );
                })}
              </div>
            </fieldset>

            {/* Immediate Formative Feedback */}
            {showItemFeedback && selectedOptionObj && (
              <Callout
                variant={selectedOptionObj.correct ? 'success' : 'danger'}
                title={
                  selectedOptionObj.correct
                    ? 'Respuesta correcta: calibración IRT actualizada'
                    : 'Matiz técnico detectado para reforzar en tu ruta'
                }
              >
                <p className="diag-callout-p">
                  {selectedOptionObj.explanation}
                </p>
              </Callout>
            )}

            {/* Footer Controls */}
            <footer className="diag-footer">
              <div className="diag-footer__hint">
                {currentSlot % 2 === 1
                  ? 'La siguiente pregunta ajustará su dificultad según tu respuesta.'
                  : 'Al avanzar pasamos al siguiente bloque disciplinar.'}
              </div>

              <div className="diag-footer__actions">
                {currentSlot > 1 && (
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      const prevSlot = currentSlot - 1;
                      setCurrentSlot(prevSlot);
                      setSelectedOptionId(
                        answersBySlot[prevSlot]?.optionId || null
                      );
                      setShowItemFeedback(Boolean(answersBySlot[prevSlot]));
                    }}
                  >
                    Pregunta anterior
                  </Button>
                )}

                <Button
                  variant="primary"
                  size="md"
                  disabled={!selectedOptionId}
                  onClick={handleNextQuestion}
                >
                  {currentSlot < 6
                    ? 'Continuar a la siguiente pregunta'
                    : 'Calcular diagnóstico y ruta sugerida'}
                </Button>
              </div>
            </footer>
          </div>
        )}

        {/* =========================================================
            MODE 2: MANUAL TRACK PREFERENCE SELECTOR
            ========================================================= */}
        {mode === 'manual' && (
          <div className="diag-body">
            <p className="diag-manual-lead">
              Si ya conoces tu objetivo de aprendizaje actual, elige directamente
              una de las cuatro modalidades de ruta para personalizar el punto
              de partida y el énfasis disciplinar:
            </p>

            <div className="diag-tracks-grid">
              {MANUAL_TRACK_OPTIONS.map((track) => {
                const isSelected = selectedTrack === track.id;
                const trackStageNum = getStageNumber(track.recommendedStageId);
                return (
                  <button
                    key={track.id}
                    type="button"
                    data-stage={trackStageNum}
                    className={`diag-track-btn ${
                      isSelected ? 'diag-track-btn--active' : ''
                    }`.trim()}
                    onClick={() => setSelectedTrack(track.id)}
                  >
                    <div>
                      <div className="diag-track-btn__head">
                        <strong className="diag-track-btn__title">
                          {track.label}
                        </strong>
                        <Chip
                          variant={
                            track.focusRole !== 'INTEGRAL' ? 'role' : 'neutral'
                          }
                          role={
                            track.focusRole !== 'INTEGRAL'
                              ? track.focusRole
                              : undefined
                          }
                        >
                          {track.focusRole !== 'INTEGRAL'
                            ? track.focusRole
                            : 'DE + DA + BI'}
                        </Chip>
                      </div>
                      <p className="diag-track-btn__desc">{track.description}</p>
                    </div>

                    <div className="diag-track-btn__stage">
                      Inicio sugerido: {track.recommendedStage}
                    </div>
                  </button>
                );
              })}
            </div>

            <footer className="diag-footer">
              <span className="diag-footer__hint">
                Selección activa: <strong>{selectedTrack}</strong>
              </span>
              <Button
                variant="primary"
                size="md"
                onClick={() => handleFinishAndApply(selectedTrack)}
              >
                <BookOpen size={16} />
                <span>Empezar ahí</span>
              </Button>
            </footer>
          </div>
        )}

        {/* =========================================================
            MODE 3: DIAGNOSTIC RESULTS & PERSONALIZED STAGE PLACEMENT
            ========================================================= */}
        {mode === 'results' && (
          <div className="diag-body">
            {/* Etapa recomendada destacada en su color (data-stage) y botón primario "Empezar ahí" */}
            <Card
              stage={recStageNum}
              accentTop
              className="diag-result-hero"
            >
              <div className="diag-result-hero__top">
                <Chip variant="stage" stage={recStageNum}>
                  Etapa recomendada · Etapa {recStageNum}
                </Chip>
                <span className="diag-result-hero__profile">
                  {computedDiagnostic.profileLabel}
                </span>
              </div>

              <div className="diag-result-hero__main">
                <div className="diag-result-hero__illus">
                  <Illustration name={`stage-${recStageNum}`} size="sm" />
                </div>
                <div className="diag-result-hero__info">
                  <h3 className="diag-result-hero__stage-title">
                    {computedDiagnostic.recommendedStage}
                  </h3>
                  <p className="diag-result-hero__summary">
                    {computedDiagnostic.summary}
                  </p>
                </div>
              </div>

              <div className="diag-result-hero__actions">
                <span className="diag-footer__hint">
                  Ruta sugerida: <strong>{selectedTrack}</strong>
                </span>
                <Button
                  variant="stage"
                  stage={recStageNum}
                  size="lg"
                  onClick={() => handleFinishAndApply(selectedTrack)}
                >
                  <CheckCircle2 size={18} />
                  <span>Empezar ahí</span>
                </Button>
              </div>
            </Card>

            {/* 3 Discipline Score Cards */}
            <div className="diag-scores-grid">
              {[
                {
                  key: 'DE',
                  title: 'Ingeniería de Datos (DE)',
                  score: computedDiagnostic.DE,
                  level: computedDiagnostic.levels.DE,
                  theta: computedDiagnostic.irtTheta.DE,
                  icon: Database,
                  tone: 'primary',
                },
                {
                  key: 'DA',
                  title: 'Análisis y Estadística (DA)',
                  score: computedDiagnostic.DA,
                  level: computedDiagnostic.levels.DA,
                  theta: computedDiagnostic.irtTheta.DA,
                  icon: BarChart3,
                  tone: 'success',
                },
                {
                  key: 'BI',
                  title: 'BI y Capa Semántica (BI)',
                  score: computedDiagnostic.BI,
                  level: computedDiagnostic.levels.BI,
                  theta: computedDiagnostic.irtTheta.BI,
                  icon: Layers,
                  tone: 'primary',
                },
              ].map((item) => {
                const IconComp = item.icon;
                return (
                  <Card
                    key={item.key}
                    padding="sm"
                    className="diag-score-card"
                  >
                    <div className="diag-score-card__top">
                      <Chip variant="role" role={item.key}>
                        {item.key}
                      </Chip>
                      <IconComp size={16} />
                    </div>
                    <h4 className="diag-score-card__title">{item.title}</h4>
                    <div className="diag-score-card__val tabular">
                      {item.score}%
                    </div>
                    <div className="diag-score-card__meta tabular">
                      Nivel: {item.level} (θ ={' '}
                      {item.theta > 0 ? `+${item.theta}` : item.theta})
                    </div>
                    <ProgressBar
                      value={item.score}
                      tone={item.tone}
                      label={item.title}
                    />
                  </Card>
                );
              })}
            </div>

            {/* Track Preference Selector inside Results */}
            <Card padding="sm" className="diag-result-tracks">
              <div className="diag-result-tracks__title">
                Modalidad de ruta seleccionada (puedes ajustarla manualmente):
              </div>
              <div className="diag-result-tracks__grid">
                {MANUAL_TRACK_OPTIONS.map((t) => {
                  const active = selectedTrack === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`diag-result-track-pill ${
                        active ? 'diag-result-track-pill--active' : ''
                      }`.trim()}
                      onClick={() => setSelectedTrack(t.id)}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </Card>

            <footer className="diag-footer">
              <Button variant="secondary" size="md" onClick={handleResetQuiz}>
                <RotateCcw size={14} />
                <span>Repetir diagnóstico desde cero</span>
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={() => handleFinishAndApply(selectedTrack)}
              >
                <CheckCircle2 size={16} />
                <span>Empezar ahí</span>
              </Button>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
}

export default DiagnosticModal;
