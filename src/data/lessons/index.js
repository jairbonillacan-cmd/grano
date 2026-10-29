import {
  MODULES as CATALOG_MODULES,
  getTrackPath as getCatalogTrackPath,
} from '../catalog/modules.js';
import { LEARNING_STAGES, ROLE_META } from '../learningPath2026.js';

import lesson_1 from './c1-sql-joins/c1-sql-joins-02-grano-fanout.js';
import lesson_2 from './c2-sql-analitico/c2-sql-analitico-01-window-functions.js';
import lesson_3 from './c2-sql-analitico/c2-sql-analitico-02-asof-lateral-ctes.js';
import lesson_4 from './c2-dimensional/c2-dimensional-02-star-schema-obt.js';
import lesson_5 from './c2-dimensional/c2-dimensional-03-scd2-history.js';
import lesson_6 from './c2-dimensional/c2-dimensional-04-metrics-simpson.js';
import lesson_7 from './de2-formatos/de2-formatos-01-columnar-parquet.js';
import lesson_8 from './de2-formatos/de2-formatos-02-arrow-lance-vortex.js';
import lesson_9 from './de2-formatos/de2-formatos-03-duckdb-polars-marimo.js';
import lesson_10 from './de3-lakehouse/de3-lakehouse-01-iceberg-v3-medallion.js';
import lesson_11 from './de3-transformacion/de3-transformacion-01-dbt-sqlmesh-dag.js';
import lesson_12 from './de3-transformacion/de3-transformacion-03-contracts-semantic-layer.js';
import lesson_13 from './da3-producto/da3-producto-02-cohorts-retention-ltv.js';
import lesson_14 from './da3-experimentos/da3-experimentos-01-ab-testing-cuped.js';
import lesson_15 from './bi3-dashboards/bi3-dashboards-01-bi-tufte-code.js';
import lesson_16 from './de4-streaming/de4-streaming-01-cdc-kafka-streaming.js';
import lesson_17 from './de4-streaming/de4-streaming-03-flink-watermarks-mv.js';
import lesson_18 from './x4-ia-datos/x4-ia-datos-01-mcp-semantic-ai-rag.js';
import lesson_19 from './c0-datos/c0-datos-01-tipos-dato.js';
import lesson_20 from './c0-datos/c0-datos-02-null-vacio.js';
import lesson_21 from './c0-datos/c0-datos-03-formatos-archivo.js';
import lesson_22 from './c0-datos/c0-datos-04-utf8-separadores.js';
import lesson_23 from './c0-datos/c0-datos-05-tablas-grano.js';
import lesson_24 from './c0-herramientas/c0-herramientas-01-terminal-rutas.js';
import lesson_25 from './c0-herramientas/c0-herramientas-02-git-commits-ramas.js';
import lesson_26 from './c0-herramientas/c0-herramientas-03-python-inicial-uv.js';
import lesson_27 from './c0-herramientas/c0-herramientas-04-cuadernos-jupyter-marimo.js';
import lesson_28 from './c0-herramientas/c0-herramientas-05-trazas-error-documentacion.js';
import lesson_29 from './c0-hojas/c0-hojas-01-tablas-referencias.js';
import lesson_30 from './c0-hojas/c0-hojas-02-tablas-dinamicas.js';
import lesson_31 from './c0-hojas/c0-hojas-03-buscarx-cruces.js';
import lesson_32 from './c0-hojas/c0-hojas-04-errores-fechas-celdas.js';
import lesson_33 from './c0-negocio/c0-negocio-01-ingreso-costo-margen.js';
import lesson_34 from './c0-negocio/c0-negocio-02-embudos-conversion.js';
import lesson_35 from './c0-negocio/c0-negocio-03-kpi-metrica-vanidad.js';
import lesson_36 from './c0-negocio/c0-negocio-04-pregunta-a-decision.js';
import lesson_37 from './c0-numeros/c0-numeros-01-media-mediana-moda.js';
import lesson_38 from './c0-numeros/c0-numeros-02-dispersion-iqr-percentiles.js';
import lesson_39 from './c0-numeros/c0-numeros-03-asimetria-sesgo.js';
import lesson_40 from './c0-numeros/c0-numeros-04-proporciones-tasas-bps.js';
import lesson_41 from './c0-numeros/c0-numeros-05-correlacion-causalidad.js';
import lesson_42 from './c1-modelo/c1-modelo-01-claves-primarias-foraneas.js';
import lesson_43 from './c1-modelo/c1-modelo-02-normalizacion-1fn-3fn.js';
import lesson_44 from './c1-modelo/c1-modelo-03-integridad-huerfanos.js';
import lesson_45 from './c1-modelo/c1-modelo-04-auditoria-calidad.js';
import lesson_46 from './c1-modelo/c1-modelo-05-validacion-bloqueante.js';
import lesson_47 from './c1-python/c1-python-01-polars-pandas-cow.js';
import lesson_48 from './c1-python/c1-python-02-io-csv-json-parquet.js';
import lesson_49 from './c1-python/c1-python-03-expresiones-vectorizadas.js';
import lesson_50 from './c1-python/c1-python-04-limpieza-texto-fechas-tz.js';
import lesson_51 from './c1-python/c1-python-05-cuaderno-a-script-cli.js';
import lesson_52 from './c1-sql-base/c1-sql-base-01-select-from-where.js';
import lesson_53 from './c1-sql-base/c1-sql-base-02-orderby-limit-distinct.js';
import lesson_54 from './c1-sql-base/c1-sql-base-03-null-logica-coalesce.js';
import lesson_55 from './c1-sql-base/c1-sql-base-04-groupby-having.js';
import lesson_56 from './c1-sql-base/c1-sql-base-05-case-when-filter.js';
import lesson_57 from './c1-sql-base/c1-sql-base-06-fechas-date-trunc.js';
import lesson_58 from './c1-sql-base/c1-sql-base-07-count-variantes.js';
import lesson_59 from './c1-sql-joins/c1-sql-joins-01-tipos-join.js';
import lesson_60 from './c1-sql-joins/c1-sql-joins-03-subconsultas.js';
import lesson_61 from './c1-sql-joins/c1-sql-joins-04-ctes-legibles.js';
import lesson_62 from './c1-sql-joins/c1-sql-joins-05-conjuntos-union.js';
import lesson_63 from './c1-viz/c1-viz-01-geometria-grafico.js';
import lesson_64 from './c1-viz/c1-viz-02-ejes-escalas-cero.js';
import lesson_65 from './c1-viz/c1-viz-03-color-accesibilidad.js';
import lesson_66 from './c1-viz/c1-viz-04-tablas-numericas.js';
import lesson_67 from './bi2-dax/bi2-dax-01-contexto-fila-filtro.js';
import lesson_68 from './bi2-dax/bi2-dax-02-calculate-transicion-contexto.js';
import lesson_69 from './bi2-dax/bi2-dax-03-inteligencia-tiempo.js';
import lesson_70 from './bi2-dax/bi2-dax-04-funciones-iteradoras.js';
import lesson_71 from './bi2-dax/bi2-dax-05-variables-divide-formato.js';
import lesson_72 from './bi2-dax/bi2-dax-06-antipatrones-rendimiento-dax.js';
import lesson_73 from './bi2-metricas/bi2-metricas-01-anatomia-metrica.js';
import lesson_74 from './bi2-metricas/bi2-metricas-02-arboles-kpis-palancas.js';
import lesson_75 from './bi2-metricas/bi2-metricas-03-metricas-guardia.js';
import lesson_76 from './bi2-metricas/bi2-metricas-04-north-star-goodhart.js';
import lesson_77 from './bi2-modelo-semantico/bi2-modelo-semantico-01-estrella-vertipaq.js';
import lesson_78 from './bi2-modelo-semantico/bi2-modelo-semantico-02-relaciones-cardinalidad.js';
import lesson_79 from './bi2-modelo-semantico/bi2-modelo-semantico-03-direccion-filtro-cruzado.js';
import lesson_80 from './bi2-modelo-semantico/bi2-modelo-semantico-04-tablas-fechas-userelationship.js';
import lesson_81 from './bi2-modelo-semantico/bi2-modelo-semantico-05-medidas-vs-columnas-calculadas.js';
import lesson_82 from './c2-dimensional/c2-dimensional-01-hechos-dimensiones-bus.js';
import lesson_83 from './c2-dimensional/c2-dimensional-05-hechos-instantanea-acumulativos.js';
import lesson_84 from './c2-sql-analitico/c2-sql-analitico-03-zonas-horarias-date-spine.js';
import lesson_85 from './c2-sql-analitico/c2-sql-analitico-04-explain-analyze.js';
import lesson_86 from './da2-eda/da2-eda-01-hipotesis-preguntas-refutables.js';
import lesson_87 from './da2-eda/da2-eda-02-perfilado-tablas.js';
import lesson_88 from './da2-eda/da2-eda-03-outliers-errores-extremos.js';
import lesson_89 from './da2-eda/da2-eda-04-diario-analisis-reproducible.js';
import lesson_90 from './da2-inferencia/da2-inferencia-01-probabilidad-bayes.js';
import lesson_91 from './da2-inferencia/da2-inferencia-02-distribuciones-probabilidad.js';
import lesson_92 from './da2-inferencia/da2-inferencia-03-muestreo-tlc-error-estandar.js';
import lesson_93 from './da2-inferencia/da2-inferencia-04-intervalos-confianza.js';
import lesson_94 from './da2-inferencia/da2-inferencia-05-pruebas-hipotesis-valor-p.js';
import lesson_95 from './da2-inferencia/da2-inferencia-06-errores-potencia-tamano-muestra.js';
import lesson_96 from './de2-formatos/de2-formatos-04-codificacion-compresion-zstd.js';
import lesson_97 from './de2-formatos/de2-formatos-05-particionado-archivos-pequenos.js';
import lesson_98 from './de2-pipelines/de2-pipelines-01-etl-vs-elt.js';
import lesson_99 from './de2-pipelines/de2-pipelines-02-idempotencia-backfill.js';
import lesson_100 from './de2-pipelines/de2-pipelines-03-cargas-incrementales-merge.js';
import lesson_101 from './de2-pipelines/de2-pipelines-04-ingesta-apis-http.js';
import lesson_102 from './de2-pipelines/de2-pipelines-05-orquestacion-airflow-dagster.js';
import lesson_103 from './de2-pipelines/de2-pipelines-06-contenedores-docker-compose.js';

export const LESSONS_V2 = [
  lesson_1,
  lesson_2,
  lesson_3,
  lesson_4,
  lesson_5,
  lesson_6,
  lesson_7,
  lesson_8,
  lesson_9,
  lesson_10,
  lesson_11,
  lesson_12,
  lesson_13,
  lesson_14,
  lesson_15,
  lesson_16,
  lesson_17,
  lesson_18,
  lesson_19,
  lesson_20,
  lesson_21,
  lesson_22,
  lesson_23,
  lesson_24,
  lesson_25,
  lesson_26,
  lesson_27,
  lesson_28,
  lesson_29,
  lesson_30,
  lesson_31,
  lesson_32,
  lesson_33,
  lesson_34,
  lesson_35,
  lesson_36,
  lesson_37,
  lesson_38,
  lesson_39,
  lesson_40,
  lesson_41,
  lesson_42,
  lesson_43,
  lesson_44,
  lesson_45,
  lesson_46,
  lesson_47,
  lesson_48,
  lesson_49,
  lesson_50,
  lesson_51,
  lesson_52,
  lesson_53,
  lesson_54,
  lesson_55,
  lesson_56,
  lesson_57,
  lesson_58,
  lesson_59,
  lesson_60,
  lesson_61,
  lesson_62,
  lesson_63,
  lesson_64,
  lesson_65,
  lesson_66,
  lesson_67,
  lesson_68,
  lesson_69,
  lesson_70,
  lesson_71,
  lesson_72,
  lesson_73,
  lesson_74,
  lesson_75,
  lesson_76,
  lesson_77,
  lesson_78,
  lesson_79,
  lesson_80,
  lesson_81,
  lesson_82,
  lesson_83,
  lesson_84,
  lesson_85,
  lesson_86,
  lesson_87,
  lesson_88,
  lesson_89,
  lesson_90,
  lesson_91,
  lesson_92,
  lesson_93,
  lesson_94,
  lesson_95,
  lesson_96,
  lesson_97,
  lesson_98,
  lesson_99,
  lesson_100,
  lesson_101,
  lesson_102,
  lesson_103,
];

/**
 * Índice por ID que resuelve el id v2, el legacyId (si existe)
 * y el id corto de catálogo (<moduleId>-<01..99>).
 */
export const LESSONS_BY_ID = Object.fromEntries(
  LESSONS_V2.flatMap((lesson) => {
    const entries = [[lesson.id, lesson]];
    if (lesson.legacyId) {
      entries.push([lesson.legacyId, lesson]);
    }
    if (lesson.moduleId && typeof lesson.order === 'number') {
      const catalogKey = `${lesson.moduleId}-${String(lesson.order).padStart(2, '0')}`;
      if (catalogKey !== lesson.id) {
        entries.push([catalogKey, lesson]);
      }
    }
    return entries;
  })
);

function splitNoteIntoPoints(noteText) {
  if (!noteText || typeof noteText !== 'string') return [];
  return noteText
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Adaptador de lección v2 al formato esperado por LessonPlayer y vistas,
 * preservando simultáneamente todas las propiedades del esquema v2.
 */
export function adaptLessonForLegacyPlayer(v2) {
  const interactiveSec = (v2.sections || []).find((s) => s.interactive?.component);
  const visualType = interactiveSec?.interactive?.component || null;

  const we = v2.workedExample || { steps: [] };
  const badStep = we.steps?.[0] || {};
  const goodStep = we.steps?.[1] || we.steps?.[0] || {};

  const playground = {
    title: we.title || `Laboratorio SQL: ${v2.title}`,
    description: we.description || badStep.explanation || '',
    badQueryLabel: badStep.label || 'Enfoque con error',
    badQuery: badStep.code || '',
    badResult: badStep.expectedOutput || [],
    goodQueryLabel: goodStep.label || 'Solución verificada',
    goodQuery: goodStep.code || '',
    goodResult: goodStep.expectedOutput || [],
    audit: we.audit || goodStep.explanation || '',
  };

  const pr = v2.practice || {};
  const codeChallenge = {
    type: pr.type || 'sql',
    title: pr.title || `Práctica: ${v2.title}`,
    language: pr.language || (pr.type === 'sql' ? 'sql' : 'python'),
    instruction: pr.prompt || '',
    description: pr.prompt || '',
    prompt: pr.prompt || '',
    starterCode: pr.starterCode || '',
    templateCode: pr.starterCode || '',
    template: pr.starterCode || '',
    expected: pr.expected || '',
    orderMatters: Boolean(pr.orderMatters),
    hints: pr.hints || [],
    solution: pr.solution || '',
    solutionExplanation: pr.solutionExplanation || '',
    blanks: pr.blanks || [],
    expectedOutput: pr.solutionExplanation || '',
    expectedOutputTable: pr.expectedOutputTable || [],
    rubricCriteria: pr.rubricCriteria || [],
  };

  const firstCheck = (v2.checks || [])[0] || {};
  const checkpoint = {
    question: firstCheck.prompt || '',
    options: firstCheck.options || [],
    explanation: firstCheck.explanation || '',
  };

  const rn = v2.roleNotes || {};
  const triadPerspectives = {
    DE: {
      title: 'Ingeniería de Datos (DE)',
      points: splitNoteIntoPoints(rn.de),
    },
    DA: {
      title: 'Análisis de Datos (DA)',
      points: splitNoteIntoPoints(rn.da),
    },
    BI: {
      title: 'Business Intelligence (BI)',
      points: splitNoteIntoPoints(rn.bi),
    },
  };

  const catalogKey =
    v2.moduleId && typeof v2.order === 'number'
      ? `${v2.moduleId}-${String(v2.order).padStart(2, '0')}`
      : v2.id;

  return {
    ...v2,
    id: v2.legacyId || v2.id,
    v2Id: v2.id,
    catalogId: catalogKey,
    order: v2.legacyOrder ?? v2.order,
    moduleOrder: v2.order,
    stageId: v2.stageId || `stage-${Math.min(6, Math.max(1, (v2.level || 0) + 1))}`,
    subtitle: v2.subtitle || v2.title,
    goal: v2.goal || (v2.objectives || [])[0] || '',
    visualType,
    storyContext: v2.hook,
    triadPerspectives,
    playground,
    codeChallenge,
    pipelineChallenge: v2.pipelineChallenge,
    checkpoint,
    keyTakeaways: v2.summary || [],
    relatedLessons: v2.relatedLessons || [],
  };
}

export const LESSONS = LESSONS_V2.map(adaptLessonForLegacyPlayer);

export const MODULES = CATALOG_MODULES.map((mod) => ({
  ...mod,
  lessons: (mod.lessons || []).map((entry) => {
    const matched = LESSONS_BY_ID[entry.id] || (entry.legacyId && LESSONS_BY_ID[entry.legacyId]);
    if (!matched) return entry;
    return {
      ...entry,
      v2Id: matched.id,
      minutes: matched.minutes,
      status: 'existing',
    };
  }),
}));

// Las vistas leen MODULES desde aquí y no desde el catálogo: el catálogo marca
// como 'planned' toda lección que no sea legacy, aunque su archivo ya exista.
export const MODULES_BY_ID = Object.fromEntries(MODULES.map((m) => [m.id, m]));

export function getTrackPath(trackId) {
  return getCatalogTrackPath(trackId).map((m) => MODULES_BY_ID[m.id] || m);
}

export function getLessonById(id) {
  return LESSONS_BY_ID[id] || null;
}

export function getSectionById(lessonId, sectionId) {
  const lesson = getLessonById(lessonId);
  if (!lesson || !Array.isArray(lesson.sections)) return null;
  return lesson.sections.find((s) => s.id === sectionId) || lesson.sections[0] || null;
}

export { LEARNING_STAGES, ROLE_META };
export default LESSONS;
