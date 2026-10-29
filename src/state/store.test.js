import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  LEGACY_STORAGE_KEYS,
  STORAGE_KEY,
  answerCheck,
  appendTutorMessage,
  clearTutorThread,
  closeTutor,
  completeLesson,
  completeOnboarding,
  exportState,
  flushSave,
  getEphemeralState,
  getState,
  getTutorSnapshot,
  importState,
  logStudyMinutes,
  markLessonKnown,
  openTutor,
  rehydrateStore,
  resetAllProgress,
  resetDeck,
  reviewFlashcard,
  setLessonStep,
  setPref,
  setTrack,
  setViewContext,
  solvePractice,
  startLesson,
  toggleCompleteLesson,
  toggleProject,
  validateGranoState,
} from './store.js';

function createMemoryStorage(initialEntries = {}) {
  const map = new Map(Object.entries(initialEntries));
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
    clear() {
      map.clear();
    },
    keys() {
      return Array.from(map.keys());
    },
    get length() {
      return map.size;
    },
  };
}

describe('Store, Migración y Persistencia Grano v1 (src/state/)', () => {
  const fixedNow = new Date('2026-10-29T14:00:00.000Z');

  beforeEach(() => {
    const mem = createMemoryStorage();
    if (typeof globalThis.window === 'undefined') {
      globalThis.window = { localStorage: mem };
    } else {
      Object.defineProperty(globalThis.window, 'localStorage', {
        value: mem,
        configurable: true,
        writable: true,
      });
    }
    resetAllProgress(fixedNow);
  });

  it('1. inicializa un estado grano:v1 limpio y válido según el esquema Zod', () => {
    const state = getState();
    const parsed = validateGranoState(state);
    expect(parsed.success).toBe(true);
    expect(state.version).toBe(1);
    expect(state.profile.track).toBeNull();
    expect(state.profile.startLevel).toBe(0);
    expect(state.profile.onboarded).toBe(false);
    expect(state.prefs.theme).toBe('system');
    expect(state.prefs.density).toBe('auto');
    expect(state.prefs.scale).toBe(1);
    expect(state.prefs.aiEnabled).toBe(true);
    expect(state.prefs.reducedMotion).toBe('system');
    expect(state.prefs.sidebarCollapsed).toBe(false);
  });

  it('2. migra todas las claves antiguas sin pérdida a grano:v1 y elimina las claves viejas', () => {
    const legacyFixture = {
      manual_datos_theme: 'dark',
      manual_datos_lesson_step: JSON.stringify({
        'l1-joins-fanout': 4,
        'l2-window-functions': { step: 2, sectionId: 'qualify-intro' },
      }),
      manual_datos_sidebar_collapsed: 'true',
      manual_datos_leitner_v1: JSON.stringify({
        'fc-01': {
          box: 3,
          intervalDays: 7,
          nextReviewAt: fixedNow.getTime() + 86400000,
          lastReviewedAt: fixedNow.getTime() - 86400000,
          reviewCount: 2,
          lapses: 0,
        },
      }),
      ruta_datos_2026_leitner_state_v1: JSON.stringify({
        cards: {
          'fc-02': {
            box: 4,
            intervalDays: 14,
            nextReviewAt: fixedNow.getTime() + 172800000,
            lastReviewedAt: fixedNow.getTime() - 86400000,
            reviewCount: 5,
            lapses: 1,
          },
        },
      }),
      ruta_datos_2026_completed: JSON.stringify(['l1-joins-fanout']),
      ruta_datos_2026_quizzes: JSON.stringify({
        'l1-joins-fanout': 'b',
        'l2-window-functions': { optionId: 'a', correct: true },
      }),
      ruta_datos_2026_code_solved: JSON.stringify(['l1-joins-fanout']),
      ruta_datos_2026_pipeline_solved: JSON.stringify(['l2-window-functions']),
      ruta_datos_2026_capstones: JSON.stringify(['cap-lakehouse-1']),
      ruta_datos_2026_diagnostic: JSON.stringify({
        recommendedStage: 2,
        targetRole: 'DE',
        diagnosticScore: 82,
      }),
      grano_track: 'bi',
      grano_ui_scale: '1.1',
    };

    const mem = createMemoryStorage(legacyFixture);
    Object.defineProperty(globalThis.window, 'localStorage', {
      value: mem,
      configurable: true,
      writable: true,
    });

    const migrated = rehydrateStore(mem, fixedNow);

    // Verifica que todas las claves viejas fueron borradas y solo queda grano:v1
    for (const oldKey of LEGACY_STORAGE_KEYS) {
      expect(mem.getItem(oldKey)).toBeNull();
    }
    expect(mem.keys()).toEqual([STORAGE_KEY]);

    // Verifica conversión sin pérdida
    expect(migrated.prefs.theme).toBe('dark');
    expect(migrated.prefs.scale).toBe(1.1);
    expect(migrated.prefs.sidebarCollapsed).toBe(true);
    expect(migrated.profile.track).toBe('bi');
    expect(migrated.profile.onboarded).toBe(true);
    expect(migrated.profile.startLevel).toBe(1);

    expect(migrated.progress.lessons['l1-joins-fanout'].status).toBe('completed');
    expect(migrated.progress.lessons['l1-joins-fanout'].stepIndex).toBe(4);
    expect(migrated.progress.lessons['l1-joins-fanout'].checks.checkpoint.optionId).toBe('b');
    expect(migrated.progress.lessons['l1-joins-fanout'].practice.codeSolved).toBe(true);

    expect(migrated.progress.lessons['l2-window-functions'].status).toBe('in_progress');
    expect(migrated.progress.lessons['l2-window-functions'].stepIndex).toBe(2);
    expect(migrated.progress.lessons['l2-window-functions'].sectionId).toBe('qualify-intro');
    expect(migrated.progress.lessons['l2-window-functions'].practice.pipelineSolved).toBe(true);

    expect(migrated.progress.projects['cap-lakehouse-1'].completed).toBe(true);
    expect(migrated.progress.diagnostic.diagnosticScore).toBe(82);

    expect(migrated.review.cards['fc-01'].reps).toBe(2);
    expect(migrated.review.cards['fc-02'].reps).toBe(5);
    expect(migrated.review.cards['fc-02'].lapses).toBe(1);
    expect(validateGranoState(migrated).success).toBe(true);
  });

  it('3. actualiza perfil y preferencias mediante setTrack, completeOnboarding y setPref', () => {
    setTrack('DA');
    expect(getState().profile.track).toBe('da');

    completeOnboarding({ track: 'de', startLevel: 2 });
    expect(getState().profile.track).toBe('de');
    expect(getState().profile.startLevel).toBe(2);
    expect(getState().profile.onboarded).toBe(true);

    setPref('theme', 'dark');
    setPref({ density: 'compact', scale: '0.9', reducedMotion: 'on', sidebarCollapsed: true });
    expect(getState().prefs.theme).toBe('dark');
    expect(getState().prefs.density).toBe('compact');
    expect(getState().prefs.scale).toBe(0.9);
    expect(getState().prefs.reducedMotion).toBe('on');
    expect(getState().prefs.sidebarCollapsed).toBe(true);
  });

  it('4. gestiona el ciclo completo de progreso de una lección (start, step, checks, practice, complete, known)', () => {
    startLesson('l1-joins-fanout', { stepIndex: 1, sectionId: 'que-es-el-grano' });
    let l1 = getState().progress.lessons['l1-joins-fanout'];
    expect(l1.status).toBe('in_progress');
    expect(l1.stepIndex).toBe(1);
    expect(l1.sectionId).toBe('que-es-el-grano');
    expect(l1.startedAt).toBeTruthy();

    setLessonStep('l1-joins-fanout', 3, 'fanout-demo');
    l1 = getState().progress.lessons['l1-joins-fanout'];
    expect(l1.stepIndex).toBe(3);
    expect(l1.sectionId).toBe('fanout-demo');

    answerCheck('l1-joins-fanout', 'c1', { optionId: 'opt-a', correct: false });
    answerCheck('l1-joins-fanout', 'c1', { optionId: 'opt-b', correct: true });
    l1 = getState().progress.lessons['l1-joins-fanout'];
    expect(l1.checks.c1.optionId).toBe('opt-b');
    expect(l1.checks.c1.correct).toBe(true);
    expect(l1.checks.c1.attempts).toBe(2);

    solvePractice('l1-joins-fanout', { solved: true, lastCode: 'SELECT 1;' });
    l1 = getState().progress.lessons['l1-joins-fanout'];
    expect(l1.practice.solved).toBe(true);
    expect(l1.practice.lastCode).toBe('SELECT 1;');

    completeLesson('l1-joins-fanout');
    expect(getState().progress.lessons['l1-joins-fanout'].status).toBe('completed');
    expect(getState().progress.lessons['l1-joins-fanout'].completedAt).toBeTruthy();

    // toggleCompleteLesson vuelve a in_progress si tenía actividad
    toggleCompleteLesson('l1-joins-fanout');
    expect(getState().progress.lessons['l1-joins-fanout'].status).toBe('in_progress');

    // markLessonKnown marca una o varias lecciones como sabidas
    markLessonKnown(['c0-datos-01', 'c0-datos-02']);
    expect(getState().progress.lessons['c0-datos-01'].status).toBe('known');
    expect(getState().progress.lessons['c0-datos-02'].status).toBe('known');
  });

  it('5. gestiona proyectos, minutos de estudio diarios y repaso FSRS en el store', () => {
    toggleProject('c1-sql-joins-proj', { repoUrl: 'https://example.com/repo' });
    expect(getState().progress.projects['c1-sql-joins-proj'].completed).toBe(true);
    expect(getState().progress.projects['c1-sql-joins-proj'].repoUrl).toBe('https://example.com/repo');

    toggleProject('c1-sql-joins-proj');
    expect(getState().progress.projects['c1-sql-joins-proj'].completed).toBe(false);

    logStudyMinutes(25, '2026-10-29');
    logStudyMinutes(15, '2026-10-29');
    expect(getState().progress.studyMinutesByDay['2026-10-29']).toBe(40);

    reviewFlashcard('fc-01', 'good', fixedNow);
    expect(getState().review.cards['fc-01'].reps).toBe(1);

    resetDeck(fixedNow);
    expect(getState().review.cards['fc-01'].reps).toBe(0);
  });

  it('6. limita el historial del tutor a un máximo de 30 mensajes por lección y permite limpiarlo', () => {
    for (let i = 1; i <= 40; i += 1) {
      appendTutorMessage('l1-joins-fanout', {
        role: i % 2 === 0 ? 'assistant' : 'user',
        content: `Mensaje número ${i}`,
      });
    }

    const thread = getState().tutor.threads['l1-joins-fanout'];
    expect(thread.length).toBe(30);
    expect(thread[0].content).toBe('Mensaje número 11');
    expect(thread[29].content).toBe('Mensaje número 40');
    expect(validateGranoState(getState()).success).toBe(true);

    clearTutorThread('l1-joins-fanout');
    expect(getState().tutor.threads['l1-joins-fanout']).toBeUndefined();
  });

  it('7. openTutor actualiza el estado efímero en memoria sin persistirse en localStorage (grano:v1)', () => {
    openTutor({
      mode: 'explain-error',
      lessonId: 'l1-joins-fanout',
      sectionId: 'sec-2',
      selection: 'SUM(o.monto_total)',
      code: 'SELECT * FROM orders JOIN order_items',
      result: 'Error: fan-out detectado',
      prefill: 'Explícame por qué se duplica esta suma',
    });

    const snap = getTutorSnapshot();
    expect(snap.isOpen).toBe(true);
    expect(snap.mode).toBe('explain-error');
    expect(snap.lessonId).toBe('l1-joins-fanout');
    expect(snap.sectionId).toBe('sec-2');
    expect(snap.selection).toBe('SUM(o.monto_total)');
    expect(snap.code).toBe('SELECT * FROM orders JOIN order_items');
    expect(snap.prefill).toBe('Explícame por qué se duplica esta suma');

    flushSave();
    const rawSaved = JSON.parse(globalThis.window.localStorage.getItem(STORAGE_KEY));
    expect(rawSaved.tutor).toEqual({ threads: {} });
    expect(rawSaved.tutor.context).toBeUndefined();
    expect(rawSaved.tutor.isOpen).toBeUndefined();

    closeTutor();
    expect(getEphemeralState().tutorOpen).toBe(false);
  });

  it('8. persiste cambios en localStorage con debounce de 300 ms y soporta flushSave síncrono', () => {
    vi.useFakeTimers();
    try {
      setTrack('bi');
      // Antes de 300ms aún tiene el estado previo en localStorage
      const beforeFlush = JSON.parse(globalThis.window.localStorage.getItem(STORAGE_KEY));
      expect(beforeFlush.profile.track).toBeNull();

      vi.advanceTimersByTime(300);
      const afterDebounce = JSON.parse(globalThis.window.localStorage.getItem(STORAGE_KEY));
      expect(afterDebounce.profile.track).toBe('bi');

      setTrack('de');
      flushSave();
      const afterFlush = JSON.parse(globalThis.window.localStorage.getItem(STORAGE_KEY));
      expect(afterFlush.profile.track).toBe('de');
    } finally {
      vi.useRealTimers();
    }
  });

  it('9. exporta el progreso a JSON con fecha AAAA-MM-DD e importa estados válidos con Zod', () => {
    setTrack('de');
    completeLesson('l1-joins-fanout', fixedNow);
    appendTutorMessage('l1-joins-fanout', { role: 'user', content: '¿Qué es el grano?' });

    const exported = exportState({ date: fixedNow, download: false });
    expect(exported.ok).toBe(true);
    expect(exported.filename).toBe('grano-progreso-2026-10-29.json');

    // Reiniciar todo y luego importar el JSON exportado
    resetAllProgress(fixedNow);
    expect(getState().profile.track).toBeNull();
    expect(getState().progress.lessons['l1-joins-fanout']).toBeUndefined();

    const imported = importState(exported.json);
    expect(imported.ok).toBe(true);
    expect(getState().profile.track).toBe('de');
    expect(getState().progress.lessons['l1-joins-fanout'].status).toBe('completed');
    expect(getState().tutor.threads['l1-joins-fanout'].length).toBe(1);
  });

  it('10. rechaza importaciones corruptas, malformadas o de versión incompatible sin corromper el estado actual', () => {
    setTrack('da');
    completeLesson('l2-window-functions', fixedNow);
    const snapshotBefore = JSON.stringify(getState());

    // Caso A: JSON malformado
    const badJson = importState('{ corrupto: true ');
    expect(badJson.ok).toBe(false);
    expect(JSON.stringify(getState())).toBe(snapshotBefore);

    // Caso B: versión incompatible
    const badVersion = importState(JSON.stringify({ version: 99, profile: {} }));
    expect(badVersion.ok).toBe(false);
    expect(badVersion.error).toContain('incompatible');
    expect(JSON.stringify(getState())).toBe(snapshotBefore);

    // Caso C: escala inválida o más de 30 mensajes en el tutor
    const invalidCandidate = JSON.parse(snapshotBefore);
    invalidCandidate.prefs.scale = 999;
    const badSchema = importState(invalidCandidate);
    expect(badSchema.ok).toBe(false);
    expect(JSON.stringify(getState())).toBe(snapshotBefore);
  });

  it('11. sincroniza el título del documento (<Lección> · Grano en lección, Grano en el resto)', () => {
    const fakeDoc = {
      title: '',
      documentElement: {
        attrs: {},
        setAttribute(k, v) {
          this.attrs[k] = v;
        },
        getAttribute(k) {
          return this.attrs[k];
        },
      },
    };
    const prevDoc = globalThis.document;
    globalThis.document = fakeDoc;
    try {
      setViewContext({
        viewMode: 'lesson',
        activeLessonId: 'l1-joins-fanout',
        activeLessonTitle: 'Grano de una tabla y fan-out en JOINs',
      });
      expect(fakeDoc.title).toBe('Grano de una tabla y fan-out en JOINs · Grano');

      setViewContext({
        viewMode: 'home',
        activeLessonId: 'l1-joins-fanout',
        activeLessonTitle: 'Grano de una tabla y fan-out en JOINs',
      });
      expect(fakeDoc.title).toBe('Grano');

      setPref({ theme: 'dark', density: 'compact', scale: 1.25, reducedMotion: 'on' });
      expect(fakeDoc.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(fakeDoc.documentElement.getAttribute('data-density')).toBe('compact');
      expect(fakeDoc.documentElement.getAttribute('data-scale')).toBe('1.25');
      expect(fakeDoc.documentElement.getAttribute('data-reduced-motion')).toBe('on');
    } finally {
      globalThis.document = prevDoc;
    }
  });

  it('12. importa de forma asíncrona desde un objeto File/Blob con método .text()', async () => {
    setTrack('bi');
    completeLesson('l4-star-schema-obt', fixedNow);
    const { json } = exportState({ date: fixedNow, download: false });

    resetAllProgress(fixedNow);
    const fakeFile = {
      name: 'grano-progreso-2026-10-29.json',
      async text() {
        return json;
      },
    };

    const res = await importState(fakeFile);
    expect(res.ok).toBe(true);
    expect(getState().profile.track).toBe('bi');
    expect(getState().progress.lessons['l4-star-schema-obt'].status).toBe('completed');
  });

  it('13. tolera fallos de cuota en localStorage (QuotaExceededError) y JSON legado corrupto sin lanzar excepciones', () => {
    const brokenLegacyStorage = createMemoryStorage({
      manual_datos_lesson_step: '{bad-json',
      ruta_datos_2026_completed: 'not-an-array',
      ruta_datos_2026_quizzes: '{broken',
      manual_datos_leitner_v1: '[[invalid',
      grano_track: 'da',
    });

    const migrated = rehydrateStore(brokenLegacyStorage, fixedNow);
    expect(migrated.profile.track).toBe('da');
    expect(validateGranoState(migrated).success).toBe(true);
    expect(brokenLegacyStorage.keys()).toEqual([STORAGE_KEY]);

    // Simular QuotaExceededError al escribir
    brokenLegacyStorage.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    expect(() => {
      setTrack('de');
      flushSave(brokenLegacyStorage);
    }).not.toThrow();
    expect(getState().profile.track).toBe('de');
  });
});
