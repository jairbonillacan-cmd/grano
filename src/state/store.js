import { useSyncExternalStore } from 'react';
import {
  MAX_TUTOR_MESSAGES_PER_LESSON,
  STORAGE_KEY,
  GranoStateSchema,
  createDefaultLessonProgress,
  createInitialState,
  normalizeDensityValue,
  normalizeReducedMotionValue,
  normalizeScaleValue,
  normalizeThemeValue,
  normalizeTrackValue,
  validateGranoState,
} from './schema.js';
import {
  LEGACY_STORAGE_KEYS,
  clearLegacyKeysFromStorage,
  migrateLegacyStorage,
} from './migrate.js';
import {
  INITIAL_FLASHCARDS,
  createFSRSCard,
  gradeCard,
  setReviewStateProvider,
} from '../engine/review.js';

export const SAVE_DEBOUNCE_MS = 300;

function getBrowserStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

function createInitialEphemeralState() {
  return {
    tutorOpen: false,
    tutorContext: null,
    viewMode: 'home',
    activeLessonId: null,
    activeLessonTitle: null,
  };
}

let currentState = migrateLegacyStorage(getBrowserStorage());
let ephemeralState = createInitialEphemeralState();
let tutorSnapshotCache = null;
let saveTimer = null;
const listeners = new Set();

setReviewStateProvider(() => currentState);

function rebuildTutorSnapshot() {
  tutorSnapshotCache = {
    threads: currentState.tutor.threads,
    isOpen: ephemeralState.tutorOpen,
    tutorOpen: ephemeralState.tutorOpen,
    context: ephemeralState.tutorContext,
    mode: ephemeralState.tutorContext?.mode ?? null,
    lessonId: ephemeralState.tutorContext?.lessonId ?? null,
    sectionId: ephemeralState.tutorContext?.sectionId ?? null,
    selection: ephemeralState.tutorContext?.selection ?? null,
    code: ephemeralState.tutorContext?.code ?? null,
    result: ephemeralState.tutorContext?.result ?? null,
    prefill: ephemeralState.tutorContext?.prefill ?? '',
  };
  return tutorSnapshotCache;
}

rebuildTutorSnapshot();

function notifyListeners() {
  rebuildTutorSnapshot();
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // ignore listener errors
    }
  }
}

export function resolveEffectiveTheme(themePref = currentState.prefs.theme) {
  if (typeof window !== 'undefined' && window.location?.search) {
    try {
      const paramTheme = new URLSearchParams(window.location.search).get('theme');
      if (paramTheme === 'dark' || paramTheme === 'light') {
        return paramTheme;
      }
    } catch {
      // ignore URL errors
    }
  }
  if (themePref === 'dark' || themePref === 'light') {
    return themePref;
  }
  try {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }
  } catch {
    // ignore matchMedia errors
  }
  return 'light';
}

export function syncDomAttributes(prefs = currentState.prefs) {
  if (typeof document === 'undefined' || !document.documentElement) return;
  const root = document.documentElement;

  const effectiveTheme =
    typeof window !== 'undefined' &&
    window.location?.search &&
    new URLSearchParams(window.location.search).get('theme')
      ? resolveEffectiveTheme(prefs.theme)
      : prefs.theme;

  root.setAttribute('data-theme', effectiveTheme);
  root.setAttribute('data-density', prefs.density);
  root.setAttribute('data-scale', String(prefs.scale));
  root.setAttribute('data-reduced-motion', prefs.reducedMotion);
}

export function syncDocumentTitle(
  viewMode = ephemeralState.viewMode,
  lessonTitle = ephemeralState.activeLessonTitle
) {
  if (typeof document === 'undefined') return;
  if (viewMode === 'lesson' && lessonTitle && String(lessonTitle).trim()) {
    document.title = `${String(lessonTitle).trim()} · Grano`;
  } else {
    document.title = 'Grano';
  }
}

// Sincronizar DOM inicial al cargar el módulo
syncDomAttributes(currentState.prefs);
syncDocumentTitle(ephemeralState.viewMode, ephemeralState.activeLessonTitle);

export function flushSave(customStorage = undefined) {
  if (saveTimer !== null) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  const storage = customStorage !== undefined ? customStorage : getBrowserStorage();
  if (!storage || typeof storage.setItem !== 'function') return false;
  try {
    const payload = {
      version: currentState.version,
      profile: currentState.profile,
      prefs: currentState.prefs,
      progress: currentState.progress,
      review: currentState.review,
      tutor: {
        threads: currentState.tutor.threads,
      },
    };
    storage.setItem(STORAGE_KEY, JSON.stringify(payload));
    clearLegacyKeysFromStorage(storage);
    return true;
  } catch {
    return false;
  }
}

function scheduleSave() {
  if (saveTimer !== null) {
    clearTimeout(saveTimer);
  }
  saveTimer = setTimeout(() => {
    saveTimer = null;
    flushSave();
  }, SAVE_DEBOUNCE_MS);
}

export function flushPendingSave() {
  if (saveTimer !== null) {
    return flushSave();
  }
  return false;
}

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('beforeunload', () => {
    flushPendingSave();
  });
  window.addEventListener('pagehide', () => {
    flushPendingSave();
  });
}

function updateState(updater, { persist = true, syncDom = false } = {}) {
  const next = typeof updater === 'function' ? updater(currentState) : updater;
  if (next === currentState) return currentState;
  currentState = next;
  if (syncDom) {
    syncDomAttributes(currentState.prefs);
  }
  if (persist) {
    scheduleSave();
  }
  notifyListeners();
  return currentState;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getState() {
  return currentState;
}

export function getEphemeralState() {
  return ephemeralState;
}

export function getTutorSnapshot() {
  return tutorSnapshotCache;
}

/**
 * Re-inicializa el store leyendo desde `storage` (útil en tests y tras recargas simuladas).
 */
export function rehydrateStore(storage = getBrowserStorage(), now = new Date()) {
  if (saveTimer !== null) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  currentState = migrateLegacyStorage(storage, now);
  ephemeralState = createInitialEphemeralState();
  syncDomAttributes(currentState.prefs);
  syncDocumentTitle(ephemeralState.viewMode, ephemeralState.activeLessonTitle);
  notifyListeners();
  return currentState;
}

// ============================================================================
// ACCIONES CON NOMBRE
// ============================================================================

export function setTrack(track) {
  const normalized = normalizeTrackValue(track);
  return updateState((state) => ({
    ...state,
    profile: {
      ...state.profile,
      track: normalized,
    },
  }));
}

export function setStartLevel(level) {
  const numeric = Math.min(4, Math.max(0, Math.floor(Number(level) || 0)));
  return updateState((state) => ({
    ...state,
    profile: {
      ...state.profile,
      startLevel: numeric,
    },
  }));
}

export function completeOnboarding(payload = {}) {
  return updateState((state) => {
    const nextTrack =
      payload && 'track' in payload
        ? normalizeTrackValue(payload.track)
        : state.profile.track;
    const nextLevel =
      payload && typeof payload.startLevel === 'number'
        ? Math.min(4, Math.max(0, Math.floor(payload.startLevel)))
        : state.profile.startLevel;
    return {
      ...state,
      profile: {
        ...state.profile,
        track: nextTrack,
        startLevel: nextLevel,
        onboarded: true,
      },
    };
  });
}

function sanitizeSinglePref(key, value, prevPrefs) {
  switch (key) {
    case 'theme':
      return normalizeThemeValue(value);
    case 'density':
      return normalizeDensityValue(value);
    case 'scale':
      return normalizeScaleValue(value);
    case 'reducedMotion':
      return normalizeReducedMotionValue(value);
    case 'aiEnabled':
    case 'sidebarCollapsed':
      return Boolean(value);
    case 'aiModelFast':
    case 'aiModelDeep':
      return typeof value === 'string' && value.trim()
        ? value.trim()
        : prevPrefs[key];
    default:
      return value;
  }
}

export function setPref(keyOrPartial, value) {
  return updateState(
    (state) => {
      const nextPrefs = { ...state.prefs };
      if (typeof keyOrPartial === 'string') {
        if (keyOrPartial in nextPrefs) {
          nextPrefs[keyOrPartial] = sanitizeSinglePref(
            keyOrPartial,
            value,
            state.prefs
          );
        }
      } else if (keyOrPartial && typeof keyOrPartial === 'object') {
        for (const [k, v] of Object.entries(keyOrPartial)) {
          if (k in nextPrefs) {
            nextPrefs[k] = sanitizeSinglePref(k, v, state.prefs);
          }
        }
      }
      return {
        ...state,
        prefs: nextPrefs,
      };
    },
    { persist: true, syncDom: true }
  );
}

export function startLesson(lessonId, options = {}) {
  if (!lessonId || typeof lessonId !== 'string') return currentState;
  const nowIso = (options.now ? new Date(options.now) : new Date()).toISOString();

  return updateState((state) => {
    const existing =
      state.progress.lessons[lessonId] || createDefaultLessonProgress();
    const nextStatus =
      existing.status === 'completed' || existing.status === 'known'
        ? existing.status
        : 'in_progress';
    const nextStepIndex =
      typeof options.stepIndex === 'number' && Number.isFinite(options.stepIndex)
        ? Math.max(0, Math.floor(options.stepIndex))
        : existing.stepIndex;
    const nextSectionId =
      options.sectionId !== undefined ? options.sectionId : existing.sectionId;

    const nextLessons = { ...state.progress.lessons };
    delete nextLessons[lessonId];
    nextLessons[lessonId] = {
      ...existing,
      status: nextStatus,
      sectionId: nextSectionId,
      stepIndex: nextStepIndex,
      startedAt: existing.startedAt || nowIso,
    };

    return {
      ...state,
      progress: {
        ...state.progress,
        lessons: nextLessons,
      },
    };
  });
}

export function setLessonStep(lessonId, stepIndexOrSectionId, maybeSectionId = undefined) {
  if (!lessonId || typeof lessonId !== 'string') return currentState;
  const nowIso = new Date().toISOString();

  return updateState((state) => {
    const existing =
      state.progress.lessons[lessonId] || createDefaultLessonProgress();
    let stepIndex = existing.stepIndex;
    let sectionId = existing.sectionId;

    if (typeof stepIndexOrSectionId === 'number' && Number.isFinite(stepIndexOrSectionId)) {
      stepIndex = Math.max(0, Math.floor(stepIndexOrSectionId));
    } else if (typeof stepIndexOrSectionId === 'string') {
      sectionId = stepIndexOrSectionId;
    }

    if (typeof maybeSectionId === 'string') {
      sectionId = maybeSectionId;
    }

    const nextStatus =
      existing.status === 'not_started' ? 'in_progress' : existing.status;

    const nextLessons = { ...state.progress.lessons };
    delete nextLessons[lessonId];
    nextLessons[lessonId] = {
      ...existing,
      status: nextStatus,
      stepIndex,
      sectionId,
      startedAt: existing.startedAt || nowIso,
    };

    return {
      ...state,
      progress: {
        ...state.progress,
        lessons: nextLessons,
      },
    };
  });
}

export function completeLesson(lessonId, now = new Date()) {
  if (!lessonId || typeof lessonId !== 'string') return currentState;
  const nowIso = (now instanceof Date ? now : new Date(now)).toISOString();

  return updateState((state) => {
    const existing =
      state.progress.lessons[lessonId] || createDefaultLessonProgress();
    return {
      ...state,
      progress: {
        ...state.progress,
        lessons: {
          ...state.progress.lessons,
          [lessonId]: {
            ...existing,
            status: 'completed',
            startedAt: existing.startedAt || nowIso,
            completedAt: nowIso,
          },
        },
      },
    };
  });
}

export function toggleCompleteLesson(lessonId, now = new Date()) {
  if (!lessonId || typeof lessonId !== 'string') return currentState;
  const existing = currentState.progress.lessons[lessonId];
  if (existing?.status === 'completed') {
    return updateState((state) => {
      const current = state.progress.lessons[lessonId];
      const hasActivity =
        (current?.stepIndex || 0) > 0 ||
        Boolean(current?.sectionId) ||
        Object.keys(current?.checks || {}).length > 0 ||
        Boolean(current?.practice?.solved);
      return {
        ...state,
        progress: {
          ...state.progress,
          lessons: {
            ...state.progress.lessons,
            [lessonId]: {
              ...current,
              status: hasActivity ? 'in_progress' : 'not_started',
              completedAt: null,
            },
          },
        },
      };
    });
  }
  return completeLesson(lessonId, now);
}

export function markLessonKnown(lessonIdOrArray, now = new Date()) {
  const ids = Array.isArray(lessonIdOrArray) ? lessonIdOrArray : [lessonIdOrArray];
  const validIds = ids.filter((id) => typeof id === 'string' && id.trim());
  if (validIds.length === 0) return currentState;
  const nowIso = (now instanceof Date ? now : new Date(now)).toISOString();

  return updateState((state) => {
    const nextLessons = { ...state.progress.lessons };
    for (const id of validIds) {
      const existing = nextLessons[id] || createDefaultLessonProgress();
      nextLessons[id] = {
        ...existing,
        status: 'known',
        startedAt: existing.startedAt || nowIso,
        completedAt: existing.completedAt || nowIso,
      };
    }
    return {
      ...state,
      progress: {
        ...state.progress,
        lessons: nextLessons,
      },
    };
  });
}

export function answerCheck(lessonId, checkIdOrOption, maybePayload = undefined) {
  if (!lessonId || typeof lessonId !== 'string') return currentState;
  const nowIso = new Date().toISOString();

  return updateState((state) => {
    const existing =
      state.progress.lessons[lessonId] || createDefaultLessonProgress();

    let checkId = 'checkpoint';
    let payload = checkIdOrOption;

    if (typeof checkIdOrOption === 'string' && maybePayload !== undefined) {
      checkId = checkIdOrOption;
      payload = maybePayload;
    } else if (
      checkIdOrOption &&
      typeof checkIdOrOption === 'object' &&
      typeof checkIdOrOption.checkId === 'string'
    ) {
      checkId = checkIdOrOption.checkId;
    }

    const prevCheck = existing.checks?.[checkId];
    const prevAttempts =
      prevCheck && typeof prevCheck === 'object' ? Number(prevCheck.attempts || 0) : 0;

    let entry;
    if (typeof payload === 'boolean') {
      entry = {
        correct: payload,
        attempts: prevAttempts + 1,
        answeredAt: nowIso,
      };
    } else if (typeof payload === 'string') {
      entry = {
        optionId: payload,
        attempts: prevAttempts + 1,
        answeredAt: nowIso,
      };
    } else if (payload && typeof payload === 'object') {
      entry = {
        optionId: payload.optionId ?? payload.id ?? null,
        correct: Boolean(payload.correct ?? payload.isCorrect),
        attempts: prevAttempts + 1,
        answeredAt: nowIso,
      };
    } else {
      entry = {
        correct: false,
        attempts: prevAttempts + 1,
        answeredAt: nowIso,
      };
    }

    const nextStatus =
      existing.status === 'not_started' ? 'in_progress' : existing.status;

    return {
      ...state,
      progress: {
        ...state.progress,
        lessons: {
          ...state.progress.lessons,
          [lessonId]: {
            ...existing,
            status: nextStatus,
            startedAt: existing.startedAt || nowIso,
            checks: {
              ...existing.checks,
              [checkId]: entry,
            },
          },
        },
      },
    };
  });
}

export function solvePractice(lessonId, details = {}) {
  if (!lessonId || typeof lessonId !== 'string') return currentState;
  const nowIso = new Date().toISOString();

  return updateState((state) => {
    const existing =
      state.progress.lessons[lessonId] || createDefaultLessonProgress();
    const prevPractice = existing.practice || { solved: false };
    const solved =
      typeof details === 'boolean'
        ? details
        : details?.solved !== undefined
          ? Boolean(details.solved)
          : true;

    const nextPractice = {
      ...prevPractice,
      ...(typeof details === 'object' && details !== null ? details : {}),
      solved,
      codeSolved:
        details?.codeSolved !== undefined
          ? Boolean(details.codeSolved)
          : prevPractice.codeSolved ?? solved,
      pipelineSolved:
        details?.pipelineSolved !== undefined
          ? Boolean(details.pipelineSolved)
          : prevPractice.pipelineSolved,
      attempts: (Number(prevPractice.attempts) || 0) + 1,
      solvedAt: solved ? nowIso : prevPractice.solvedAt ?? null,
    };

    const nextStatus =
      existing.status === 'not_started' ? 'in_progress' : existing.status;

    return {
      ...state,
      progress: {
        ...state.progress,
        lessons: {
          ...state.progress.lessons,
          [lessonId]: {
            ...existing,
            status: nextStatus,
            startedAt: existing.startedAt || nowIso,
            practice: nextPractice,
          },
        },
      },
    };
  });
}

export function toggleProject(projectId, details = {}) {
  if (!projectId || typeof projectId !== 'string') return currentState;
  const nowIso = new Date().toISOString();

  return updateState((state) => {
    const existing = state.progress.projects[projectId] || { completed: false };
    const nextCompleted =
      typeof details?.completed === 'boolean'
        ? details.completed
        : !existing.completed;

    return {
      ...state,
      progress: {
        ...state.progress,
        projects: {
          ...state.progress.projects,
          [projectId]: {
            ...existing,
            ...(typeof details === 'object' && details !== null ? details : {}),
            completed: nextCompleted,
            completedAt: nextCompleted ? nowIso : null,
          },
        },
      },
    };
  });
}

export function setDiagnosticResult(result) {
  return updateState((state) => ({
    ...state,
    progress: {
      ...state.progress,
      diagnostic: result,
    },
  }));
}

export function logStudyMinutes(minutes, dateKey = undefined) {
  const numeric = Math.max(0, Number(minutes) || 0);
  if (numeric <= 0) return currentState;
  const day =
    typeof dateKey === 'string' && dateKey.trim()
      ? dateKey.trim()
      : new Date().toISOString().slice(0, 10);

  return updateState((state) => ({
    ...state,
    progress: {
      ...state.progress,
      studyMinutesByDay: {
        ...state.progress.studyMinutesByDay,
        [day]: (state.progress.studyMinutesByDay[day] || 0) + numeric,
      },
    },
  }));
}

export function reviewFlashcard(cardId, rating, now = new Date()) {
  if (!cardId || typeof cardId !== 'string') return currentState;
  return updateState((state) => {
    const existing =
      state.review.cards[cardId] || createFSRSCard(new Date(0), cardId);
    const outcome = gradeCard(existing, rating, now);
    return {
      ...state,
      review: {
        ...state.review,
        cards: {
          ...state.review.cards,
          [cardId]: outcome.card,
        },
      },
    };
  });
}

export function resetDeck(now = new Date()) {
  const refDate = now instanceof Date ? now : new Date(now);
  return updateState((state) => {
    const freshCards = {};
    for (const fc of INITIAL_FLASHCARDS) {
      freshCards[fc.id] = createFSRSCard(refDate, fc.id);
    }
    return {
      ...state,
      review: {
        ...state.review,
        cards: freshCards,
      },
    };
  });
}

export function appendTutorMessage(lessonId, message) {
  const threadKey =
    typeof lessonId === 'string' && lessonId.trim() ? lessonId.trim() : 'general';
  if (!message || typeof message !== 'object') return currentState;

  const normalizedMessage = {
    role:
      message.role === 'user' || message.role === 'assistant' || message.role === 'system'
        ? message.role
        : 'assistant',
    content: String(message.content ?? message.answer ?? message.question ?? ''),
    createdAt: message.createdAt || new Date().toISOString(),
    ...message,
  };

  return updateState((state) => {
    const prevThread = Array.isArray(state.tutor.threads[threadKey])
      ? state.tutor.threads[threadKey]
      : [];
    const nextThread = [...prevThread, normalizedMessage].slice(
      -MAX_TUTOR_MESSAGES_PER_LESSON
    );
    return {
      ...state,
      tutor: {
        ...state.tutor,
        threads: {
          ...state.tutor.threads,
          [threadKey]: nextThread,
        },
      },
    };
  });
}

export function clearTutorThread(lessonId = undefined) {
  return updateState((state) => {
    if (!lessonId) {
      return {
        ...state,
        tutor: {
          ...state.tutor,
          threads: {},
        },
      };
    }
    const nextThreads = { ...state.tutor.threads };
    delete nextThreads[lessonId];
    return {
      ...state,
      tutor: {
        ...state.tutor,
        threads: nextThreads,
      },
    };
  });
}

/**
 * Acción efímera (NO persistida en `grano:v1`): abre el tutor con contexto desde T9, T10 o T12.
 */
export function openTutor(context = {}) {
  const safeContext =
    context && typeof context === 'object'
      ? {
          mode: context.mode || 'tutor',
          lessonId: context.lessonId ?? ephemeralState.activeLessonId ?? null,
          sectionId: context.sectionId ?? null,
          selection: context.selection ?? null,
          code: context.code ?? null,
          result: context.result ?? null,
          prefill: context.prefill ?? '',
          openedAt: Date.now(),
        }
      : {
          mode: 'tutor',
          lessonId: ephemeralState.activeLessonId ?? null,
          sectionId: null,
          selection: null,
          code: null,
          result: null,
          prefill: typeof context === 'string' ? context : '',
          openedAt: Date.now(),
        };

  ephemeralState = {
    ...ephemeralState,
    tutorOpen: true,
    tutorContext: safeContext,
  };
  notifyListeners();
  return ephemeralState;
}

export function closeTutor() {
  ephemeralState = {
    ...ephemeralState,
    tutorOpen: false,
  };
  notifyListeners();
  return ephemeralState;
}

export function setTutorOpen(isOpen) {
  const nextOpen =
    typeof isOpen === 'function' ? Boolean(isOpen(ephemeralState.tutorOpen)) : Boolean(isOpen);
  ephemeralState = {
    ...ephemeralState,
    tutorOpen: nextOpen,
  };
  notifyListeners();
  return ephemeralState;
}

export function setViewContext({ viewMode, activeLessonId, activeLessonTitle } = {}) {
  const nextViewMode = viewMode !== undefined ? viewMode : ephemeralState.viewMode;
  const nextLessonId =
    activeLessonId !== undefined ? activeLessonId : ephemeralState.activeLessonId;
  const nextLessonTitle =
    activeLessonTitle !== undefined ? activeLessonTitle : ephemeralState.activeLessonTitle;

  if (
    nextViewMode === ephemeralState.viewMode &&
    nextLessonId === ephemeralState.activeLessonId &&
    nextLessonTitle === ephemeralState.activeLessonTitle
  ) {
    syncDocumentTitle(nextViewMode, nextLessonTitle);
    return ephemeralState;
  }

  ephemeralState = {
    ...ephemeralState,
    viewMode: nextViewMode,
    activeLessonId: nextLessonId,
    activeLessonTitle: nextLessonTitle,
  };
  syncDocumentTitle(nextViewMode, nextLessonTitle);
  notifyListeners();
  return ephemeralState;
}

export function resetAllProgress(now = new Date()) {
  if (saveTimer !== null) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  const fresh = createInitialState(now);
  currentState = fresh;
  ephemeralState = createInitialEphemeralState();
  syncDomAttributes(currentState.prefs);
  syncDocumentTitle(ephemeralState.viewMode, ephemeralState.activeLessonTitle);
  flushSave();
  notifyListeners();
  return currentState;
}

// ============================================================================
// EXPORTAR E IMPORTAR PROGRESO (ZOD)
// ============================================================================

export function formatExportFilename(now = new Date()) {
  const d = now instanceof Date ? now : new Date(now);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `grano-progreso-${yyyy}-${mm}-${dd}.json`;
}

export function exportState(options = {}) {
  flushSave();
  const now = options.date ? new Date(options.date) : new Date();
  const filename = formatExportFilename(now);
  const payload = {
    version: currentState.version,
    profile: currentState.profile,
    prefs: currentState.prefs,
    progress: currentState.progress,
    review: currentState.review,
    tutor: {
      threads: currentState.tutor.threads,
    },
  };
  const json = JSON.stringify(payload, null, 2);

  if (
    options.download !== false &&
    typeof document !== 'undefined' &&
    typeof Blob !== 'undefined' &&
    typeof URL !== 'undefined' &&
    typeof URL.createObjectURL === 'function'
  ) {
    try {
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch {
      // ignore DOM download errors in headless/test environments
    }
  }

  return {
    ok: true,
    filename,
    json,
    state: payload,
  };
}

function applyValidatedImport(rawCandidate) {
  let candidate = rawCandidate;

  if (typeof rawCandidate === 'string') {
    try {
      candidate = JSON.parse(rawCandidate);
    } catch {
      return {
        ok: false,
        error: 'El archivo no es un JSON válido.',
        issues: [],
      };
    }
  }

  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return {
      ok: false,
      error: 'El contenido importado debe ser un objeto de estado Grano.',
      issues: [],
    };
  }

  if (candidate.version !== 1) {
    return {
      ok: false,
      error: `Versión de estado incompatible (${String(candidate.version)}). Se esperaba version: 1.`,
      issues: [{ path: ['version'], message: 'Versión incompatible' }],
    };
  }

  const parsed = GranoStateSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'El archivo de progreso tiene un formato inválido o corrupto.',
      issues: parsed.error.issues,
    };
  }

  currentState = parsed.data;
  syncDomAttributes(currentState.prefs);
  flushSave();
  notifyListeners();

  return {
    ok: true,
    state: currentState,
  };
}

export function importState(jsonOrFile) {
  if (jsonOrFile && typeof jsonOrFile === 'object' && typeof jsonOrFile.text === 'function') {
    return jsonOrFile
      .text()
      .then((text) => applyValidatedImport(text))
      .catch(() => ({
        ok: false,
        error: 'No se pudo leer el archivo seleccionado.',
        issues: [],
      }));
  }
  return applyValidatedImport(jsonOrFile);
}

// ============================================================================
// HOOKS REACT (useSyncExternalStore)
// ============================================================================

const identitySelector = (s) => s;

export function useStore(selector = identitySelector) {
  return useSyncExternalStore(
    subscribe,
    () => selector(currentState),
    () => selector(currentState)
  );
}

export function useProfile() {
  return useStore((s) => s.profile);
}

export function usePrefs() {
  return useStore((s) => s.prefs);
}

export function useProgress() {
  return useStore((s) => s.progress);
}

export function useReview() {
  return useStore((s) => s.review);
}

export function useTutorState() {
  return useSyncExternalStore(subscribe, getTutorSnapshot, getTutorSnapshot);
}

export const actions = {
  setTrack,
  setStartLevel,
  completeOnboarding,
  setPref,
  startLesson,
  setLessonStep,
  completeLesson,
  toggleCompleteLesson,
  markLessonKnown,
  answerCheck,
  solvePractice,
  toggleProject,
  setDiagnosticResult,
  logStudyMinutes,
  reviewFlashcard,
  resetDeck,
  appendTutorMessage,
  clearTutorThread,
  openTutor,
  closeTutor,
  setTutorOpen,
  setViewContext,
  resetAllProgress,
  exportState,
  importState,
  flushSave,
  rehydrateStore,
};

export { STORAGE_KEY, LEGACY_STORAGE_KEYS, validateGranoState };
