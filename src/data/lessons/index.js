import { MODULES as CATALOG_MODULES } from '../catalog/modules.js';
import { LEARNING_STAGES, ROLE_META } from '../learningPath2026.js';

import l1 from './c1-sql-joins/c1-sql-joins-02-grano-fanout.js';
import l2 from './c2-sql-analitico/c2-sql-analitico-01-window-functions.js';
import l3 from './c2-sql-analitico/c2-sql-analitico-02-asof-lateral-ctes.js';
import l4 from './c2-dimensional/c2-dimensional-02-star-schema-obt.js';
import l5 from './c2-dimensional/c2-dimensional-03-scd2-history.js';
import l6 from './c2-dimensional/c2-dimensional-04-metrics-simpson.js';
import l7 from './de2-formatos/de2-formatos-01-columnar-parquet.js';
import l8 from './de2-formatos/de2-formatos-02-arrow-lance-vortex.js';
import l9 from './de2-formatos/de2-formatos-03-duckdb-polars-marimo.js';
import l10 from './de3-lakehouse/de3-lakehouse-01-iceberg-v3-medallion.js';
import l11 from './de3-transformacion/de3-transformacion-01-dbt-sqlmesh-dag.js';
import l12 from './de3-transformacion/de3-transformacion-03-contracts-semantic-layer.js';
import l13 from './da3-producto/da3-producto-02-cohorts-retention-ltv.js';
import l14 from './da3-experimentos/da3-experimentos-01-ab-testing-cuped.js';
import l15 from './bi3-dashboards/bi3-dashboards-01-bi-tufte-code.js';
import l16 from './de4-streaming/de4-streaming-01-cdc-kafka-streaming.js';
import l17 from './de4-streaming/de4-streaming-03-flink-watermarks-mv.js';
import l18 from './x4-ia-datos/x4-ia-datos-01-mcp-semantic-ai-rag.js';

export const LESSONS_V2 = [
  l1,
  l2,
  l3,
  l4,
  l5,
  l6,
  l7,
  l8,
  l9,
  l10,
  l11,
  l12,
  l13,
  l14,
  l15,
  l16,
  l17,
  l18,
];

/**
 * Índice por ID que resuelve tanto el id v2 (`c1-sql-joins-02-grano-fanout`)
 * como el legacyId (`l1-joins-fanout`).
 */
export const LESSONS_BY_ID = Object.fromEntries(
  LESSONS_V2.flatMap((lesson) => {
    const entries = [[lesson.id, lesson]];
    if (lesson.legacyId) {
      entries.push([lesson.legacyId, lesson]);
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
 * Adaptador de lección v2 al formato esperado por el `LessonPlayer` actual,
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
    title: pr.title || `Práctica: ${v2.title}`,
    language: pr.language || 'sql',
    instruction: pr.prompt || '',
    description: pr.prompt || '',
    templateCode: pr.starterCode || '',
    template: pr.starterCode || '',
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

  return {
    ...v2,
    id: v2.legacyId || v2.id,
    v2Id: v2.id,
    order: v2.legacyOrder ?? v2.order,
    moduleOrder: v2.order,
    stageId: v2.stageId || 'stage-1',
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
