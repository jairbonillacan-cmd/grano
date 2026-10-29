import { MODULES as CATALOG_MODULES } from '../catalog/modules.js';
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
