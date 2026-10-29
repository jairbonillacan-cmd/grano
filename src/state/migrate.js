import {
  STORAGE_KEY,
  createDefaultLessonProgress,
  createInitialState,
  normalizeScaleValue,
  normalizeThemeValue,
  normalizeTrackValue,
  validateGranoState,
} from './schema.js';
import { leitnerCardToFSRS } from '../engine/review.js';

export const LEGACY_STORAGE_KEYS = [
  'manual_datos_theme',
  'manual_datos_lesson_step',
  'manual_datos_sidebar_collapsed',
  'manual_datos_leitner_v1',
  'ruta_datos_2026_leitner_state_v1',
  'ruta_datos_2026_completed',
  'ruta_datos_2026_quizzes',
  'ruta_datos_2026_code_solved',
  'ruta_datos_2026_pipeline_solved',
  'ruta_datos_2026_capstones',
  'ruta_datos_2026_capstone_rubric',
  'ruta_datos_2026_capstone_drafts',
  'ruta_datos_2026_diagnostic',
  'grano_track',
  'grano_ui_scale',
];

function safeJsonParse(raw, fallback = null) {
  if (typeof raw !== 'string' || !raw.trim()) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function mapStageToLevel(recommendedStage, fallback = 0) {
  if (typeof recommendedStage === 'number' && Number.isFinite(recommendedStage)) {
    if (recommendedStage <= 0) return 0;
    if (recommendedStage >= 5) return 4;
    return Math.min(4, Math.max(0, Math.floor(recommendedStage - 1)));
  }
  if (typeof recommendedStage === 'string') {
    const match = recommendedStage.match(/(\d+)/);
    if (match) {
      const num = Number(match[1]);
      return Math.min(4, Math.max(0, num <= 1 ? 1 : Math.min(4, num - 1)));
    }
  }
  return fallback;
}

/**
 * Convierte un mapa de claves legadas a la estructura `grano:v1` sin pérdida de datos.
 */
export function convertLegacySnapshot(legacyRawMap = {}, baseState = null, now = new Date()) {
  const nowDate = now instanceof Date ? now : new Date(now);
  const nowIso = nowDate.toISOString();
  const state = baseState
    ? JSON.parse(JSON.stringify(baseState))
    : createInitialState(nowDate);

  const getRaw = (key) => {
    if (!legacyRawMap) return null;
    if (typeof legacyRawMap.getItem === 'function') {
      try {
        return legacyRawMap.getItem(key);
      } catch {
        return null;
      }
    }
    return legacyRawMap[key] ?? null;
  };

  const ensureLesson = (lessonId) => {
    if (!state.progress.lessons[lessonId]) {
      state.progress.lessons[lessonId] = createDefaultLessonProgress();
    }
    return state.progress.lessons[lessonId];
  };

  // 1. manual_datos_theme -> prefs.theme
  const rawTheme = getRaw('manual_datos_theme');
  if (rawTheme !== null && rawTheme !== undefined && String(rawTheme).trim() !== '') {
    const cleanTheme = String(rawTheme).trim().replace(/^"|"$/g, '');
    state.prefs.theme = normalizeThemeValue(cleanTheme);
  }

  // 2. grano_ui_scale -> prefs.scale
  const rawScale = getRaw('grano_ui_scale');
  if (rawScale !== null && rawScale !== undefined && String(rawScale).trim() !== '') {
    const cleanScale = String(rawScale).trim().replace(/^"|"$/g, '');
    state.prefs.scale = normalizeScaleValue(cleanScale);
  }

  // 3. manual_datos_sidebar_collapsed -> prefs.sidebarCollapsed
  const rawSidebar = getRaw('manual_datos_sidebar_collapsed');
  if (rawSidebar !== null && rawSidebar !== undefined && String(rawSidebar).trim() !== '') {
    const cleanSidebar = String(rawSidebar).trim().toLowerCase();
    state.prefs.sidebarCollapsed = cleanSidebar === 'true' || cleanSidebar === '1';
  }

  // 4. grano_track -> profile.track
  const rawTrack = getRaw('grano_track');
  if (rawTrack !== null && rawTrack !== undefined && String(rawTrack).trim() !== '') {
    const cleanTrack = String(rawTrack).trim().replace(/^"|"$/g, '');
    const normalizedTrack = normalizeTrackValue(cleanTrack);
    if (normalizedTrack) {
      state.profile.track = normalizedTrack;
      state.profile.onboarded = true;
    } else if (cleanTrack.toLowerCase() === 'all') {
      state.profile.onboarded = true;
    }
  }

  // 5. manual_datos_lesson_step -> progress.lessons[id].stepIndex
  const rawSteps = getRaw('manual_datos_lesson_step');
  const parsedSteps =
    typeof rawSteps === 'object' && rawSteps !== null ? rawSteps : safeJsonParse(rawSteps, null);
  if (parsedSteps && typeof parsedSteps === 'object' && !Array.isArray(parsedSteps)) {
    for (const [lessonId, stepVal] of Object.entries(parsedSteps)) {
      if (!lessonId || lessonId === 'lastLessonId' || lessonId === 'activeLessonId') continue;
      const lessonEntry = ensureLesson(lessonId);
      const stepNum =
        typeof stepVal === 'number'
          ? stepVal
          : stepVal && typeof stepVal === 'object' && typeof stepVal.step === 'number'
            ? stepVal.step
            : Number(stepVal);

      if (Number.isFinite(stepNum)) {
        lessonEntry.stepIndex = Math.max(0, Math.floor(stepNum));
      }
      if (stepVal && typeof stepVal === 'object' && typeof stepVal.sectionId === 'string') {
        lessonEntry.sectionId = stepVal.sectionId;
      }
      if (lessonEntry.status === 'not_started') {
        lessonEntry.status = 'in_progress';
      }
      if (!lessonEntry.startedAt) {
        lessonEntry.startedAt = nowIso;
      }
    }
  }

  // 6. ruta_datos_2026_completed -> progress.lessons[id].status = 'completed'
  const rawCompleted = getRaw('ruta_datos_2026_completed');
  const parsedCompleted = Array.isArray(rawCompleted)
    ? rawCompleted
    : safeJsonParse(rawCompleted, null);
  if (Array.isArray(parsedCompleted)) {
    for (const lessonId of parsedCompleted) {
      if (typeof lessonId !== 'string' || !lessonId.trim()) continue;
      const lessonEntry = ensureLesson(lessonId.trim());
      lessonEntry.status = 'completed';
      if (!lessonEntry.startedAt) lessonEntry.startedAt = nowIso;
      if (!lessonEntry.completedAt) lessonEntry.completedAt = nowIso;
      state.profile.onboarded = true;
    }
  }

  // 7. ruta_datos_2026_quizzes -> progress.lessons[id].checks
  const rawQuizzes = getRaw('ruta_datos_2026_quizzes');
  const parsedQuizzes =
    typeof rawQuizzes === 'object' && rawQuizzes !== null
      ? rawQuizzes
      : safeJsonParse(rawQuizzes, null);
  if (parsedQuizzes && typeof parsedQuizzes === 'object' && !Array.isArray(parsedQuizzes)) {
    for (const [lessonId, quizVal] of Object.entries(parsedQuizzes)) {
      if (!lessonId || quizVal === undefined || quizVal === null) continue;
      const lessonEntry = ensureLesson(lessonId);
      if (typeof quizVal === 'string') {
        lessonEntry.checks.checkpoint = {
          optionId: quizVal,
          answeredAt: nowIso,
        };
      } else if (typeof quizVal === 'boolean') {
        lessonEntry.checks.checkpoint = {
          correct: quizVal,
          answeredAt: nowIso,
        };
      } else if (typeof quizVal === 'object') {
        if ('optionId' in quizVal || 'correct' in quizVal || 'isCorrect' in quizVal) {
          lessonEntry.checks.checkpoint = {
            optionId: quizVal.optionId ?? quizVal.selectedOptionId ?? null,
            correct: Boolean(quizVal.correct ?? quizVal.isCorrect),
            answeredAt: quizVal.answeredAt || nowIso,
          };
        } else {
          lessonEntry.checks = { ...lessonEntry.checks, ...quizVal };
        }
      }
      if (lessonEntry.status === 'not_started') {
        lessonEntry.status = 'in_progress';
        lessonEntry.startedAt = lessonEntry.startedAt || nowIso;
      }
    }
  }

  // 8. ruta_datos_2026_code_solved -> progress.lessons[id].practice.codeSolved
  const rawCodeSolved = getRaw('ruta_datos_2026_code_solved');
  const parsedCodeSolved = Array.isArray(rawCodeSolved)
    ? rawCodeSolved
    : safeJsonParse(rawCodeSolved, null);
  if (Array.isArray(parsedCodeSolved)) {
    for (const lessonId of parsedCodeSolved) {
      if (typeof lessonId !== 'string' || !lessonId.trim()) continue;
      const lessonEntry = ensureLesson(lessonId.trim());
      lessonEntry.practice = {
        ...lessonEntry.practice,
        solved: true,
        codeSolved: true,
        solvedAt: lessonEntry.practice?.solvedAt || nowIso,
      };
      if (lessonEntry.status === 'not_started') {
        lessonEntry.status = 'in_progress';
        lessonEntry.startedAt = lessonEntry.startedAt || nowIso;
      }
    }
  }

  // 9. ruta_datos_2026_pipeline_solved -> progress.lessons[id].practice.pipelineSolved
  const rawPipelineSolved = getRaw('ruta_datos_2026_pipeline_solved');
  const parsedPipelineSolved = Array.isArray(rawPipelineSolved)
    ? rawPipelineSolved
    : safeJsonParse(rawPipelineSolved, null);
  if (Array.isArray(parsedPipelineSolved)) {
    for (const lessonId of parsedPipelineSolved) {
      if (typeof lessonId !== 'string' || !lessonId.trim()) continue;
      const lessonEntry = ensureLesson(lessonId.trim());
      lessonEntry.practice = {
        ...lessonEntry.practice,
        solved: true,
        pipelineSolved: true,
        solvedAt: lessonEntry.practice?.solvedAt || nowIso,
      };
      if (lessonEntry.status === 'not_started') {
        lessonEntry.status = 'in_progress';
        lessonEntry.startedAt = lessonEntry.startedAt || nowIso;
      }
    }
  }

  // 10. ruta_datos_2026_capstones (+ rubric y drafts) -> progress.projects
  const rawCapstones = getRaw('ruta_datos_2026_capstones');
  const parsedCapstones = Array.isArray(rawCapstones)
    ? rawCapstones
    : safeJsonParse(rawCapstones, null);
  if (Array.isArray(parsedCapstones)) {
    for (const projectId of parsedCapstones) {
      if (typeof projectId !== 'string' || !projectId.trim()) continue;
      const id = projectId.trim();
      state.progress.projects[id] = {
        ...(state.progress.projects[id] || {}),
        completed: true,
        completedAt: state.progress.projects[id]?.completedAt || nowIso,
      };
    }
  }

  const rawDrafts = getRaw('ruta_datos_2026_capstone_drafts');
  const parsedDrafts =
    typeof rawDrafts === 'object' && rawDrafts !== null
      ? rawDrafts
      : safeJsonParse(rawDrafts, null);
  if (parsedDrafts && typeof parsedDrafts === 'object' && !Array.isArray(parsedDrafts)) {
    for (const [projectId, draftText] of Object.entries(parsedDrafts)) {
      if (!projectId || typeof draftText !== 'string') continue;
      state.progress.projects[projectId] = {
        completed: false,
        ...(state.progress.projects[projectId] || {}),
        draft: draftText,
      };
    }
  }

  const rawRubric = getRaw('ruta_datos_2026_capstone_rubric');
  const parsedRubric =
    typeof rawRubric === 'object' && rawRubric !== null
      ? rawRubric
      : safeJsonParse(rawRubric, null);
  if (parsedRubric && typeof parsedRubric === 'object' && !Array.isArray(parsedRubric)) {
    const cleanRubric = {};
    for (const [critId, status] of Object.entries(parsedRubric)) {
      if (typeof status === 'string') {
        cleanRubric[critId] = status;
      }
    }
    if (Object.keys(cleanRubric).length > 0) {
      const firstProjectId = Object.keys(state.progress.projects)[0] || 'capstone-general';
      state.progress.projects[firstProjectId] = {
        completed: false,
        ...(state.progress.projects[firstProjectId] || {}),
        rubric: {
          ...(state.progress.projects[firstProjectId]?.rubric || {}),
          ...cleanRubric,
        },
      };
    }
  }

  // 11. ruta_datos_2026_diagnostic -> progress.diagnostic (+ profile.startLevel / track)
  const rawDiagnostic = getRaw('ruta_datos_2026_diagnostic');
  const parsedDiagnostic =
    typeof rawDiagnostic === 'object' && rawDiagnostic !== null
      ? rawDiagnostic
      : safeJsonParse(rawDiagnostic, null);
  if (parsedDiagnostic && typeof parsedDiagnostic === 'object') {
    state.progress.diagnostic = parsedDiagnostic;
    state.profile.onboarded = true;
    if (typeof parsedDiagnostic.startLevel === 'number') {
      state.profile.startLevel = Math.min(4, Math.max(0, Math.floor(parsedDiagnostic.startLevel)));
    } else if (parsedDiagnostic.recommendedStage !== undefined) {
      state.profile.startLevel = mapStageToLevel(
        parsedDiagnostic.recommendedStage,
        state.profile.startLevel
      );
    }
    const diagTrack = normalizeTrackValue(
      parsedDiagnostic.targetRole || parsedDiagnostic.preferredRole || parsedDiagnostic.track
    );
    if (diagTrack && !state.profile.track) {
      state.profile.track = diagTrack;
    }
  }

  // 12. manual_datos_leitner_v1 & ruta_datos_2026_leitner_state_v1 -> review.cards (FSRS)
  for (const leitnerKey of ['manual_datos_leitner_v1', 'ruta_datos_2026_leitner_state_v1']) {
    const rawLeitner = getRaw(leitnerKey);
    const parsedLeitner =
      typeof rawLeitner === 'object' && rawLeitner !== null
        ? rawLeitner
        : safeJsonParse(rawLeitner, null);
    if (parsedLeitner && typeof parsedLeitner === 'object') {
      const sourceCards =
        parsedLeitner.cards && typeof parsedLeitner.cards === 'object'
          ? parsedLeitner.cards
          : parsedLeitner;
      for (const [cardId, cardVal] of Object.entries(sourceCards)) {
        if (
          cardId === 'version' ||
          cardId === 'updatedAt' ||
          cardId === 'stats' ||
          cardId === 'boxCounts' ||
          !cardVal ||
          typeof cardVal !== 'object'
        ) {
          continue;
        }
        state.review.cards[cardId] = leitnerCardToFSRS(cardVal, cardId, nowDate);
      }
    }
  }

  return state;
}

export function hasLegacyKeysInStorage(storage) {
  if (!storage || typeof storage.getItem !== 'function') return false;
  try {
    return LEGACY_STORAGE_KEYS.some((key) => storage.getItem(key) !== null);
  } catch {
    return false;
  }
}

export function clearLegacyKeysFromStorage(storage) {
  if (!storage || typeof storage.removeItem !== 'function') return;
  for (const key of LEGACY_STORAGE_KEYS) {
    try {
      storage.removeItem(key);
    } catch {
      // ignore storage errors
    }
  }
}

/**
 * Ejecuta la migración en el arranque sobre `storage` (`window.localStorage` por defecto).
 * Si `grano:v1` no existe o quedan claves antiguas, migra todo a `grano:v1`, valida con Zod,
 * persiste `grano:v1` y elimina todas las claves viejas.
 */
export function migrateLegacyStorage(
  storage = typeof window !== 'undefined' ? window.localStorage : null,
  now = new Date()
) {
  const initial = createInitialState(now);
  if (!storage || typeof storage.getItem !== 'function') {
    return initial;
  }

  let baseState = null;
  try {
    const existingRaw = storage.getItem(STORAGE_KEY);
    if (existingRaw) {
      const parsed = safeJsonParse(existingRaw, null);
      const validated = validateGranoState(parsed);
      if (validated.success) {
        baseState = validated.data;
      }
    }
  } catch {
    baseState = null;
  }

  const hasLegacy = hasLegacyKeysInStorage(storage);

  if (baseState && !hasLegacy) {
    return baseState;
  }

  const migrated = convertLegacySnapshot(storage, baseState, now);
  const check = validateGranoState(migrated);
  const finalState = check.success ? check.data : initial;

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(finalState));
  } catch {
    // ignore quota errors
  }

  clearLegacyKeysFromStorage(storage);

  return finalState;
}
