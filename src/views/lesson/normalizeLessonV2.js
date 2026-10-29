import { LESSONS_BY_ID, MODULES, MODULES_BY_ID } from '../../data/lessons/index.js';
import { TRACKS } from '../../data/catalog/tracks.js';
import { LEVELS } from '../../data/catalog/levels.js';
import { stripSectionNumber, splitGoalIntoChecks } from '../../utils/formatText.jsx';

const PLANNED_LESSON_TITLES = {
  'c1-sql-joins-01': 'Tipos de JOIN y modelo de conjuntos',
  'c1-entorno-01': 'Entorno SQL moderno y DuckDB',
  'c2-dimensional-01': 'Hechos, dimensiones y llaves subrogadas',
  'da3-producto-01': 'Métricas de producto y embudos',
  'de3-transformacion-02': 'Modelos incrementales e idempotencia',
  'de4-streaming-02': 'Garantías de entrega y estado distribuido',
};

export function resolvePrerequisiteMeta(prereqId) {
  if (!prereqId) return null;
  const existingLesson = LESSONS_BY_ID[prereqId];
  if (existingLesson) {
    return {
      id: existingLesson.id,
      title: existingLesson.title,
      isAvailable: true,
    };
  }
  const mod = MODULES_BY_ID[prereqId];
  if (mod) {
    return {
      id: mod.id,
      title: mod.title,
      isAvailable: false,
    };
  }
  if (PLANNED_LESSON_TITLES[prereqId]) {
    return {
      id: prereqId,
      title: PLANNED_LESSON_TITLES[prereqId],
      isAvailable: false,
    };
  }
  const parentMod = MODULES.find((m) => prereqId.startsWith(m.id));
  if (parentMod) {
    return {
      id: prereqId,
      title: parentMod.title,
      isAvailable: false,
    };
  }
  return {
    id: prereqId,
    title: prereqId.replace(/^[a-z0-9]+-[a-z0-9]+-\d+-?/i, '').replace(/-/g, ' ') || prereqId,
    isAvailable: false,
  };
}

/**
 * Normaliza una lección (v2 o adaptada legacy) garantizando todos los campos
 * del esquema v2 (Apéndice A) y priorizando la definición canónica v2 de LESSONS_BY_ID
 * sobre la adaptación legacy de `LESSONS`, respetando overrides explícitos.
 */
export function normalizeLessonV2(rawLesson) {
  if (!rawLesson) return null;

  const winOverride =
    typeof window !== 'undefined' && window.__GRANO_LESSON_OVERRIDE__
      ? window.__GRANO_LESSON_OVERRIDE__
      : null;

  const baseV2 = LESSONS_BY_ID[rawLesson.id] || null;
  const hasExplicitOverride = Boolean(winOverride);

  // Cuando existe baseV2 en el catálogo v2, sus propiedades estructuradas tienen prioridad
  // frente a las propiedades recortadas por adaptLessonForLegacyPlayer en `rawLesson`.
  const merged = {
    ...rawLesson,
    ...(baseV2 || {}),
    ...(winOverride && (!winOverride.id || winOverride.id === rawLesson.id)
      ? winOverride
      : {}),
  };

  const sections =
    hasExplicitOverride && 'sections' in winOverride
      ? winOverride.sections
      : Array.isArray(baseV2?.sections) && baseV2.sections.length > 0
        ? baseV2.sections
        : Array.isArray(rawLesson.sections)
          ? rawLesson.sections
          : [];

  const hook =
    (hasExplicitOverride && 'hook' in winOverride ? winOverride.hook : null) ??
    baseV2?.hook ??
    rawLesson.hook ??
    rawLesson.realWorldProblem ??
    '';

  const objectives =
    (hasExplicitOverride && 'objectives' in winOverride ? winOverride.objectives : null) ??
    (Array.isArray(baseV2?.objectives) && baseV2.objectives.length > 0
      ? baseV2.objectives
      : Array.isArray(rawLesson.objectives) && rawLesson.objectives.length > 0
        ? rawLesson.objectives
        : splitGoalIntoChecks(rawLesson.learningGoal || ''));

  const workedExample =
    hasExplicitOverride && 'workedExample' in winOverride
      ? winOverride.workedExample
      : baseV2?.workedExample !== undefined
        ? baseV2.workedExample
        : rawLesson.workedExample || null;

  let checks =
    hasExplicitOverride && 'checks' in winOverride
      ? winOverride.checks
      : Array.isArray(baseV2?.checks) && baseV2.checks.length > 0
        ? baseV2.checks
        : Array.isArray(rawLesson.checks) && rawLesson.checks.length > 0
          ? rawLesson.checks
          : [];

  if (checks.length === 0 && rawLesson.quiz?.question && !(hasExplicitOverride && 'checks' in winOverride)) {
    checks = [
      {
        id: `${merged.id}-check-legacy`,
        type: 'mcq',
        prompt: rawLesson.quiz.question,
        options: (rawLesson.quiz.options || []).map((opt, idx) => ({
          id: ['a', 'b', 'c', 'd'][idx] || `opt-${idx}`,
          text: opt.text,
          feedback: opt.explanation || '',
        })),
        correctOptionId:
          ['a', 'b', 'c', 'd'][
            (rawLesson.quiz.options || []).findIndex((o) => o.correct)
          ] || 'a',
        explanation:
          (rawLesson.quiz.options || []).find((o) => o.correct)?.explanation || '',
      },
    ];
  }

  const practice =
    hasExplicitOverride && 'practice' in winOverride
      ? winOverride.practice
      : baseV2?.practice !== undefined
        ? baseV2.practice
        : rawLesson.practice || null;

  const roleNotes =
    hasExplicitOverride && 'roleNotes' in winOverride
      ? winOverride.roleNotes
      : baseV2?.roleNotes ||
        rawLesson.roleNotes ||
        (rawLesson.rolePerspectives
          ? {
              de: rawLesson.rolePerspectives.DE || '',
              da: rawLesson.rolePerspectives.DA || '',
              bi: rawLesson.rolePerspectives.BI || '',
            }
          : null);

  const summary =
    hasExplicitOverride && 'summary' in winOverride
      ? winOverride.summary
      : Array.isArray(baseV2?.summary) && baseV2.summary.length > 0
        ? baseV2.summary
        : Array.isArray(rawLesson.summary) && rawLesson.summary.length > 0
          ? rawLesson.summary
          : Array.isArray(rawLesson.keyTakeaways)
            ? rawLesson.keyTakeaways
            : [];

  const sources =
    Array.isArray(baseV2?.sources) && baseV2.sources.length > 0
      ? baseV2.sources
      : Array.isArray(rawLesson.sources)
        ? rawLesson.sources
        : [];

  const glossaryTerms =
    Array.isArray(baseV2?.glossaryTerms) && baseV2.glossaryTerms.length > 0
      ? baseV2.glossaryTerms
      : Array.isArray(rawLesson.glossaryTerms)
        ? rawLesson.glossaryTerms
        : [];

  const prerequisites =
    Array.isArray(baseV2?.prerequisites)
      ? baseV2.prerequisites
      : Array.isArray(rawLesson.prerequisites)
        ? rawLesson.prerequisites
        : [];

  const relatedLessons =
    Array.isArray(baseV2?.relatedLessons)
      ? baseV2.relatedLessons
      : Array.isArray(rawLesson.relatedLessons)
        ? rawLesson.relatedLessons
        : [];

  const moduleMeta = merged.moduleId ? MODULES_BY_ID[merged.moduleId] : null;
  const primaryTrackId =
    moduleMeta?.track ||
    (Array.isArray(merged.tracks) && merged.tracks[0]) ||
    'core';
  const trackMeta = TRACKS[primaryTrackId] || TRACKS.core;
  const levelNum = merged.level ?? moduleMeta?.level ?? 1;
  const levelMeta = LEVELS[levelNum] || { id: levelNum, name: 'Fundamentos' };
  const minutes = merged.minutes || Number.parseInt(merged.duration, 10) || 25;

  return {
    ...merged,
    id: merged.id,
    title: merged.title || 'Lección',
    minutes,
    level: levelNum,
    levelName: levelMeta.name,
    moduleMeta,
    trackMeta,
    prerequisites,
    hook,
    objectives,
    sections,
    workedExample,
    roleNotes,
    checks,
    practice,
    pipelineChallenge:
      hasExplicitOverride && 'pipelineChallenge' in winOverride
        ? winOverride.pipelineChallenge
        : merged.pipelineChallenge || null,
    summary,
    glossaryTerms,
    sources,
    relatedLessons,
  };
}

/**
 * Construye las entradas del temario lateral para la lección actual.
 */
export function buildLessonSyllabusItems(lesson, { answeredChecksCount = 0, isPracticeSubmitted = false } = {}) {
  if (!lesson) return [];
  const items = [];

  items.push({
    id: 'contexto',
    domId: 'sec-contexto',
    label: 'Contexto y objetivos',
    kind: 'intro',
  });

  (lesson.sections || []).forEach((sec, idx) => {
    const rawHeading = sec.heading || sec.title || '';
    const cleanTitle = stripSectionNumber(rawHeading) || `Sección ${idx + 1}`;
    items.push({
      id: sec.id || `seccion-${idx + 1}`,
      domId: `sec-${sec.id || `seccion-${idx + 1}`}`,
      label: cleanTitle,
      indexLabel: String(idx + 1).padStart(2, '0'),
      hasInteractive: Boolean(sec.interactive?.component),
      kind: 'section',
    });
  });

  if (lesson.workedExample?.steps?.length > 0) {
    items.push({
      id: 'ejemplo-guiado',
      domId: 'sec-ejemplo-guiado',
      label: 'Ejemplo paso a paso',
      kind: 'worked-example',
    });
  }

  if (lesson.roleNotes && (lesson.roleNotes.de || lesson.roleNotes.da || lesson.roleNotes.bi)) {
    items.push({
      id: 'areas',
      domId: 'sec-areas',
      label: 'Desde tu área',
      kind: 'roles',
    });
  }

  if (Array.isArray(lesson.checks) && lesson.checks.length > 0) {
    items.push({
      id: 'comprobaciones',
      domId: 'sec-comprobaciones',
      label: 'Comprobaciones',
      meta: `${answeredChecksCount}/${lesson.checks.length}`,
      isDone: answeredChecksCount >= lesson.checks.length,
      kind: 'checks',
    });
  }

  if (lesson.practice || lesson.pipelineChallenge) {
    items.push({
      id: 'practica',
      domId: 'sec-practica',
      label: 'Práctica aplicada',
      meta: isPracticeSubmitted ? 'Enviada' : 'Pendiente',
      isDone: isPracticeSubmitted,
      kind: 'practice',
    });
  }

  items.push({
    id: 'resumen',
    domId: 'sec-resumen',
    label: 'Resumen y fuentes',
    kind: 'summary',
  });

  return items;
}
