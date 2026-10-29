import { useState, useEffect, useMemo, useCallback } from 'react';
import { LEARNING_STAGES, LESSONS } from '../data/lessons/index.js';
import { LESSON_STEP_LABELS } from '../views/HomeView.jsx';
import { GLOSSARY_CONCEPTS_2026 } from '../data/glossary.js';
import { getAdaptiveRecommendations } from '../engine/adaptiveEngine.js';
import {
  LESSON_ID_ALIASES,
  getDueCards,
  normalizeReviewState,
} from '../engine/review.js';
import { clearLegacyKeysFromStorage } from './migrate.js';
import {
  answerCheck,
  appendTutorMessage,
  closeTutor,
  completeOnboarding,
  openTutor,
  resetDeck,
  resolveEffectiveTheme,
  reviewFlashcard,
  setDiagnosticResult,
  setLessonStep,
  setPref,
  setTrack,
  setTutorOpen,
  setViewContext,
  solvePractice,
  startLesson,
  syncDomAttributes,
  syncDocumentTitle,
  toggleCompleteLesson,
  toggleProject,
  usePrefs,
  useProgress,
  useReview,
  useStore,
  useTutorState,
} from './store.js';

const DEFAULT_WELCOME_MESSAGE = {
  source: 'Tutor IA',
  question: 'Consulta sobre la lección activa',
  answer:
    'Escribe cualquier duda sobre la lectura, pide que desglose una consulta SQL línea por línea o plantea un caso concreto.',
};

export function useAppController() {
  const isUiShowcase = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('ui') === '1';
  }, []);

  const fullState = useStore();
  const prefs = usePrefs();
  const progress = useProgress();
  const review = useReview();
  const tutorState = useTutorState();

  const [viewMode, setViewModeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const requested = new URLSearchParams(window.location.search).get('view');
      if (
        requested &&
        [
          'home',
          'roadmap',
          'lesson',
          'practice',
          'review',
          'capstones',
          'glossary',
          'analytics',
          'settings',
          'onboarding',
        ].includes(requested)
      ) {
        return requested;
      }
    }
    return 'home';
  });
  const [activeLessonId, setActiveLessonId] = useState(() => {
    const lessonKeys = Object.keys(progress.lessons || {});
    for (let i = lessonKeys.length - 1; i >= 0; i -= 1) {
      const k = lessonKeys[i];
      if (LESSONS.some((l) => l.id === k)) {
        return k;
      }
    }
    return LESSONS[0].id;
  });

  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const [engineMode, setEngineMode] = useState('fast');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');

  // Sincronizar prefill cuando openTutor() se invoca con contexto efímero
  useEffect(() => {
    if (tutorState.prefill) {
      setAiInput(tutorState.prefill);
    }
  }, [tutorState.prefill, tutorState.context?.openedAt]);

  const theme = useMemo(() => resolveEffectiveTheme(prefs.theme), [prefs.theme]);

  const setTheme = useCallback((nextTheme) => {
    setPref('theme', nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const current = resolveEffectiveTheme(prefs.theme);
    setPref('theme', current === 'dark' ? 'light' : 'dark');
  }, [prefs.theme]);

  const completedIds = useMemo(() => {
    const list = [];
    for (const [id, entry] of Object.entries(progress.lessons || {})) {
      if (entry?.status === 'completed' || entry?.status === 'known') {
        list.push(id);
      }
    }
    return list;
  }, [progress.lessons]);

  const lessonSteps = useMemo(() => {
    const map = {};
    for (const [id, entry] of Object.entries(progress.lessons || {})) {
      if (!entry) continue;
      if (entry.status !== 'not_started' || (entry.stepIndex ?? 0) > 0) {
        map[id] = Number(entry.stepIndex ?? 0);
      }
    }
    return map;
  }, [progress.lessons]);

  const quizAnswers = useMemo(() => {
    const map = {};
    for (const [id, entry] of Object.entries(progress.lessons || {})) {
      const chk = entry?.checks?.checkpoint;
      if (!chk) continue;
      if (typeof chk === 'string') {
        map[id] = chk;
      } else if (typeof chk === 'object' && chk.optionId) {
        map[id] = chk.optionId;
      } else if (typeof chk === 'object' && typeof chk.correct === 'boolean') {
        map[id] = chk.correct;
      }
    }
    return map;
  }, [progress.lessons]);

  const completedLabIds = useMemo(() => {
    const list = [];
    for (const [id, entry] of Object.entries(progress.lessons || {})) {
      if (entry?.practice?.codeSolved || entry?.practice?.solved) {
        list.push(id);
      }
    }
    return list;
  }, [progress.lessons]);

  const completedPipelineIds = useMemo(() => {
    const list = [];
    for (const [id, entry] of Object.entries(progress.lessons || {})) {
      if (entry?.practice?.pipelineSolved) {
        list.push(id);
      }
    }
    return list;
  }, [progress.lessons]);

  const completedCapstoneIds = useMemo(() => {
    const list = [];
    for (const [id, entry] of Object.entries(progress.projects || {})) {
      if (entry?.completed) {
        list.push(id);
      }
    }
    return list;
  }, [progress.projects]);

  const diagnosticResult = progress.diagnostic;

  const leitnerState = useMemo(
    () => normalizeReviewState(review.cards),
    [review.cards]
  );

  const currentLesson = useMemo(
    () => LESSONS.find((l) => l.id === activeLessonId) || LESSONS[0],
    [activeLessonId]
  );

  const currentStage = useMemo(
    () =>
      LEARNING_STAGES.find((s) => s.id === currentLesson.stageId) ||
      LEARNING_STAGES[0],
    [currentLesson]
  );

  const currentIndex = useMemo(
    () => LESSONS.findIndex((l) => l.id === currentLesson.id),
    [currentLesson]
  );

  const prevLesson = currentIndex > 0 ? LESSONS[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < LESSONS.length - 1 ? LESSONS[currentIndex + 1] : null;

  // Sincronizar atributos de DOM, <title> y limpiar claves legadas que vistas no migradas hayan escrito
  useEffect(() => {
    setViewContext({
      viewMode,
      activeLessonId: currentLesson.id,
      activeLessonTitle: currentLesson.title,
    });
    syncDomAttributes(prefs);
    syncDocumentTitle(viewMode, currentLesson.title);
    if (typeof window !== 'undefined' && window.localStorage) {
      clearLegacyKeysFromStorage(window.localStorage);
    }
  }, [viewMode, currentLesson.id, currentLesson.title, prefs]);

  // Puente para controles aún no migrados en AppShell y TrackPathView (hasta T7 y T8)
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const handleDocChange = (e) => {
      const target = e.target;
      if (
        target instanceof HTMLSelectElement &&
        target.getAttribute('aria-label') === 'Tamaño de la interfaz'
      ) {
        setPref('scale', target.value);
        if (typeof window !== 'undefined' && window.localStorage) {
          clearLegacyKeysFromStorage(window.localStorage);
        }
      }
    };

    const handleDocClick = (e) => {
      const target = e.target instanceof Element ? e.target : null;
      if (!target) return;
      const trackBtn = target.closest('.track-path [data-track]');
      if (trackBtn) {
        const chosenTrack = trackBtn.getAttribute('data-track');
        if (chosenTrack === 'de' || chosenTrack === 'da' || chosenTrack === 'bi') {
          setTrack(chosenTrack);
        } else if (chosenTrack === 'all') {
          setTrack(null);
        }
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        clearLegacyKeysFromStorage(window.localStorage);
      }
    };

    document.addEventListener('change', handleDocChange);
    document.addEventListener('click', handleDocClick);
    return () => {
      document.removeEventListener('change', handleDocChange);
      document.removeEventListener('click', handleDocClick);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((open) => !open);
      } else if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen]);

  const adaptiveRec = useMemo(
    () =>
      getAdaptiveRecommendations(
        LESSONS,
        completedIds,
        quizAnswers,
        diagnosticResult
      ),
    [completedIds, quizAnswers, diagnosticResult]
  );

  const nextRecommendedLesson = useMemo(
    () =>
      adaptiveRec?.nextPrimaryLesson ||
      LESSONS.find((l) => !completedIds.includes(l.id)) ||
      LESSONS[0],
    [adaptiveRec, completedIds]
  );

  const dueCardsCount = useMemo(
    () => getDueCards(fullState, 'ALL').length,
    [fullState]
  );

  const handleNavigate = useCallback((mode, targetStageId) => {
    setViewModeState(mode);
    if (!targetStageId && typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, []);

  // Sincronizar activeLessonId cuando se importa progreso o se reinicia el estado
  useEffect(() => {
    const lessonKeys = Object.keys(progress.lessons || {});
    if (lessonKeys.length === 0) return;
    if (!progress.lessons[activeLessonId]) {
      for (let i = lessonKeys.length - 1; i >= 0; i -= 1) {
        const k = lessonKeys[i];
        if (LESSONS.some((l) => l.id === k)) {
          setActiveLessonId(k);
          break;
        }
      }
    }
  }, [progress.lessons, activeLessonId]);

  const openLesson = useCallback((stageOrLessonId, maybeLessonIdOrStep) => {
    const rawCandidate =
      typeof maybeLessonIdOrStep === 'string'
        ? LESSON_ID_ALIASES[maybeLessonIdOrStep] || maybeLessonIdOrStep
        : null;
    const isSecondArgLesson =
      Boolean(rawCandidate) && LESSONS.some((l) => l.id === rawCandidate);
    const rawPrimary = LESSON_ID_ALIASES[stageOrLessonId] || stageOrLessonId;
    const targetId = isSecondArgLesson ? rawCandidate : rawPrimary;
    const explicitStep =
      typeof maybeLessonIdOrStep === 'number' &&
      Number.isFinite(maybeLessonIdOrStep)
        ? Math.max(0, Math.floor(maybeLessonIdOrStep))
        : undefined;

    const found = LESSONS.find((l) => l.id === targetId);
    if (found) {
      setActiveLessonId(found.id);
      startLesson(found.id, {
        stepIndex: explicitStep,
      });
      setViewModeState('lesson');
      setCommandPaletteOpen(false);
      if (typeof window !== 'undefined') {
        window.scrollTo(0, 0);
      }
    }
  }, []);

  const handleStepChange = useCallback(
    (lessonId, nextStepIndex) => {
      const targetId = lessonId || activeLessonId;
      const numericStep = Math.max(0, Math.floor(Number(nextStepIndex) || 0));
      setLessonStep(targetId, numericStep);
      if (typeof window !== 'undefined' && window.localStorage) {
        clearLegacyKeysFromStorage(window.localStorage);
      }
    },
    [activeLessonId]
  );

  const handleSelectQuizOption = useCallback(
    (lessonId, optionObj) => {
      if (!optionObj) return;
      answerCheck(lessonId, 'checkpoint', {
        optionId: optionObj.id,
        correct: Boolean(optionObj.correct),
      });
      if (optionObj.correct && !completedIds.includes(lessonId)) {
        toggleCompleteLesson(lessonId);
      }
    },
    [completedIds]
  );

  const handleSolveLab = useCallback((lessonId) => {
    solvePractice(lessonId, { solved: true, codeSolved: true });
  }, []);

  const handleSolvePipeline = useCallback((lessonId) => {
    solvePractice(lessonId, { solved: true, pipelineSolved: true });
  }, []);

  const handleReviewCard = useCallback((cardId, quality) => {
    reviewFlashcard(cardId, quality);
  }, []);

  const handleResetDeck = useCallback(() => {
    resetDeck();
  }, []);

  const handleCompleteDiagnostic = useCallback(
    (result) => {
      setDiagnosticResult(result);
      completeOnboarding({
        track: result?.targetRole || result?.preferredRole || undefined,
      });
      setDiagnosticOpen(false);
      if (result?.recommendedLessonId) {
        const target = LESSONS.find((l) => l.id === result.recommendedLessonId);
        if (target) {
          openLesson(target.id);
          return;
        }
      }
      if (result?.recommendedStage) {
        const stageId =
          typeof result.recommendedStage === 'number'
            ? `stage-${result.recommendedStage}`
            : String(result.recommendedStage);
        const firstInStage = LESSONS.find((l) => l.stageId === stageId);
        if (firstInStage) {
          openLesson(firstInStage.id);
        }
      }
    },
    [openLesson]
  );

  const aiMessages = useMemo(() => {
    const thread = tutorState.threads?.[currentLesson.id] || [];
    const pairs = [];
    for (let i = thread.length - 1; i >= 0; i -= 1) {
      const msg = thread[i];
      if (msg.role === 'assistant') {
        pairs.push({
          source: msg.source || 'Tutor IA',
          isError: Boolean(msg.isError),
          question: msg.question || 'Consulta sobre la lección',
          answer: msg.answer || msg.content,
        });
      }
    }
    return pairs.length > 0 ? pairs : [DEFAULT_WELCOME_MESSAGE];
  }, [tutorState.threads, currentLesson.id]);

  const askTutor = useCallback(
    async (customPrompt) => {
      const promptText = (customPrompt || aiInput).trim();
      if (!promptText || aiLoading) return;
      if (!customPrompt || customPrompt === aiInput) setAiInput('');
      setTutorOpen(true);
      setAiLoading(true);

      appendTutorMessage(currentLesson.id, {
        role: 'user',
        content: promptText,
        question: promptText,
      });

      try {
        const res = await fetch('/api/ai/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: promptText,
            moduleTitle: `${currentStage.title} — ${currentLesson.title}`,
            activeLens: 'DE + DA + BI',
            engineMode,
            sqlCode: currentLesson.playground?.goodQuery || '',
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok || !data.answer) {
          const errorText = [
            data.message || data.error || 'La IA no pudo responder.',
            data.fix,
          ]
            .filter(Boolean)
            .join(' ');
          appendTutorMessage(currentLesson.id, {
            role: 'assistant',
            source: 'Error',
            isError: true,
            question: promptText,
            answer: errorText,
            content: errorText,
          });
          return;
        }
        const seconds = data.elapsedMs
          ? ` · ${(data.elapsedMs / 1000).toFixed(1)} s`
          : '';
        appendTutorMessage(currentLesson.id, {
          role: 'assistant',
          source: `${data.source}${seconds}`,
          question: promptText,
          answer: data.answer,
          content: data.answer,
          elapsedMs: data.elapsedMs,
        });
      } catch {
        const fallbackError =
          'No hay conexión con el servidor local. Comprueba que `npm run dev` siga en marcha y vuelve a preguntar.';
        appendTutorMessage(currentLesson.id, {
          role: 'assistant',
          source: 'Error',
          isError: true,
          question: promptText,
          answer: fallbackError,
          content: fallbackError,
        });
      } finally {
        setAiLoading(false);
      }
    },
    [aiInput, aiLoading, currentLesson, currentStage, engineMode]
  );

  const filteredCommandLessons = useMemo(() => {
    const q = commandQuery.trim().toLowerCase();
    if (!q) return LESSONS;
    return LESSONS.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.subtitle.toLowerCase().includes(q) ||
        l.goal.toLowerCase().includes(q) ||
        String(l.order).includes(q)
    );
  }, [commandQuery]);

  const filteredCommandGlossary = useMemo(() => {
    const list = Array.isArray(GLOSSARY_CONCEPTS_2026)
      ? GLOSSARY_CONCEPTS_2026
      : [];
    const q = commandQuery.trim().toLowerCase();
    if (!q) return list.slice(0, 8);
    return list.filter(
      (item) =>
        item.term?.toLowerCase().includes(q) ||
        item.plainDefinition?.toLowerCase().includes(q) ||
        item.tool2026?.toLowerCase().includes(q) ||
        item.primaryRole?.toLowerCase().includes(q)
    );
  }, [commandQuery]);

  const activeStepIndex = Number(lessonSteps[currentLesson.id] ?? 0);
  const activeStepLabel =
    LESSON_STEP_LABELS[activeStepIndex] || LESSON_STEP_LABELS[0];

  return {
    isUiShowcase,
    theme,
    setTheme,
    toggleTheme,
    viewMode,
    handleNavigate,
    activeLessonId,
    currentLesson,
    currentStage,
    prevLesson,
    nextLesson,
    nextRecommendedLesson,
    lessonSteps,
    completedIds,
    quizAnswers,
    completedLabIds,
    completedPipelineIds,
    completedCapstoneIds,
    diagnosticResult,
    leitnerState,
    dueCardsCount,
    diagnosticOpen,
    setDiagnosticOpen,
    tutorOpen: tutorState.isOpen,
    onToggleTutor: () => setTutorOpen((o) => !o),
    onOpenTutor: (ctx) => openTutor(ctx),
    onCloseTutor: closeTutor,
    engineMode,
    setEngineMode,
    aiLoading,
    aiInput,
    setAiInput,
    aiMessages,
    askTutor,
    commandPaletteOpen,
    setCommandPaletteOpen,
    commandQuery,
    setCommandQuery,
    filteredCommandLessons,
    filteredCommandGlossary,
    activeStepLabel,
    openLesson,
    handleStepChange,
    toggleCompleteLesson,
    handleSelectQuizOption,
    handleSolveLab,
    handleSolvePipeline,
    toggleCompleteCapstone: toggleProject,
    handleReviewCard,
    handleResetDeck,
    handleCompleteDiagnostic,
  };
}
