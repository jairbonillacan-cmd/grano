import React, { useState, useEffect, useMemo } from 'react';
import { LEARNING_STAGES, LESSONS } from './data/learningPath2026.js';
import AppShell from './layout/AppShell.jsx';
import HomeView, { LESSON_STEP_LABELS } from './views/HomeView.jsx';
import RoadmapView from './views/RoadmapView.jsx';
import TrackPathView from './views/TrackPathView.jsx';
import LessonPlayer from './views/LessonPlayer.jsx';
import TutorPanel from './components/TutorPanel.jsx';
import DiagnosticModal from './components/DiagnosticModal.jsx';
import SpacedRepetitionView, {
  CARD_LESSON_MAP,
} from './components/SpacedRepetitionView.jsx';
import CapstoneProjectsView from './components/CapstoneProjectsView.jsx';
import GlossaryAndGraphView, {
  GLOSSARY_CONCEPTS_2026,
} from './components/GlossaryAndGraphView.jsx';
import LearningAnalyticsView from './components/LearningAnalyticsView.jsx';
import { Button, Chip, Kbd, UiShowcase } from './components/ui/index.js';
import { getAdaptiveRecommendations } from './engine/adaptiveEngine.js';
import {
  INITIAL_FLASHCARDS,
  loadLeitnerState,
  saveLeitnerState,
  reviewCard,
  getDueCards,
} from './engine/spacedRepetition.js';

export default function App() {
  const isUiShowcase = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('ui') === '1';
  }, []);

  const [theme, setTheme] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const paramTheme = new URLSearchParams(window.location.search).get('theme');
        if (paramTheme === 'dark' || paramTheme === 'light') return paramTheme;
      }
      const saved = localStorage.getItem('manual_datos_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ) {
        return 'dark';
      }
    } catch {}
    return 'light';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    try {
      localStorage.setItem('manual_datos_theme', theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [viewMode, setViewMode] = useState('home');

  const [lessonSteps, setLessonSteps] = useState(() => {
    try {
      const saved = localStorage.getItem('manual_datos_lesson_step');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [activeLessonId, setActiveLessonId] = useState(() => {
    try {
      const saved = localStorage.getItem('manual_datos_lesson_step');
      if (saved) {
        const parsed = JSON.parse(saved);
        const keys = Object.keys(parsed || {});
        const lastKey = keys[keys.length - 1];
        if (lastKey && LESSONS.some((l) => l.id === lastKey)) {
          return lastKey;
        }
      }
    } catch {}
    return LESSONS[0].id;
  });

  const [completedIds, setCompletedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('ruta_datos_2026_completed');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [quizAnswers, setQuizAnswers] = useState(() => {
    try {
      const saved = localStorage.getItem('ruta_datos_2026_quizzes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [completedLabIds, setCompletedLabIds] = useState(() => {
    try {
      const saved = localStorage.getItem('ruta_datos_2026_code_solved');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [completedPipelineIds, setCompletedPipelineIds] = useState(() => {
    try {
      const saved = localStorage.getItem('ruta_datos_2026_pipeline_solved');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [completedCapstoneIds, setCompletedCapstoneIds] = useState(() => {
    try {
      const saved = localStorage.getItem('ruta_datos_2026_capstones');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [diagnosticResult, setDiagnosticResult] = useState(() => {
    try {
      const saved = localStorage.getItem('ruta_datos_2026_diagnostic');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [leitnerState, setLeitnerState] = useState(() => loadLeitnerState());
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);

  // Tutor IA state
  const [tutorOpen, setTutorOpen] = useState(false);
  const [engineMode, setEngineMode] = useState('fast');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState([
    {
      source: 'Tutor IA',
      question: 'Consulta sobre la lección activa',
      answer:
        'Escribe cualquier duda sobre la lectura, pide que desglose una consulta SQL línea por línea o plantea un caso concreto.',
    },
  ]);

  // Command Palette state
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('manual_datos_lesson_step', JSON.stringify(lessonSteps));
    } catch {}
  }, [lessonSteps]);

  useEffect(() => {
    try {
      localStorage.setItem('ruta_datos_2026_completed', JSON.stringify(completedIds));
    } catch {}
  }, [completedIds]);

  useEffect(() => {
    try {
      localStorage.setItem('ruta_datos_2026_quizzes', JSON.stringify(quizAnswers));
    } catch {}
  }, [quizAnswers]);

  useEffect(() => {
    try {
      localStorage.setItem('ruta_datos_2026_code_solved', JSON.stringify(completedLabIds));
    } catch {}
  }, [completedLabIds]);

  useEffect(() => {
    try {
      localStorage.setItem(
        'ruta_datos_2026_pipeline_solved',
        JSON.stringify(completedPipelineIds)
      );
    } catch {}
  }, [completedPipelineIds]);

  useEffect(() => {
    try {
      localStorage.setItem('ruta_datos_2026_capstones', JSON.stringify(completedCapstoneIds));
    } catch {}
  }, [completedCapstoneIds]);

  useEffect(() => {
    try {
      if (diagnosticResult) {
        localStorage.setItem('ruta_datos_2026_diagnostic', JSON.stringify(diagnosticResult));
      }
    } catch {}
  }, [diagnosticResult]);

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

  const currentLesson = useMemo(
    () => LESSONS.find((l) => l.id === activeLessonId) || LESSONS[0],
    [activeLessonId]
  );

  const currentStage = useMemo(
    () => LEARNING_STAGES.find((s) => s.id === currentLesson.stageId) || LEARNING_STAGES[0],
    [currentLesson]
  );

  const currentIndex = useMemo(
    () => LESSONS.findIndex((l) => l.id === currentLesson.id),
    [currentLesson]
  );

  const prevLesson = currentIndex > 0 ? LESSONS[currentIndex - 1] : null;
  const nextLesson = currentIndex < LESSONS.length - 1 ? LESSONS[currentIndex + 1] : null;

  const adaptiveRec = useMemo(
    () => getAdaptiveRecommendations(LESSONS, completedIds, quizAnswers, diagnosticResult),
    [completedIds, quizAnswers, diagnosticResult]
  );

  const nextRecommendedLesson = useMemo(
    () =>
      adaptiveRec?.nextPrimaryLesson ||
      LESSONS.find((l) => !completedIds.includes(l.id)) ||
      LESSONS[0],
    [adaptiveRec, completedIds]
  );

  const dueCardsCount = useMemo(() => {
    const unlocked = new Set(completedIds);
    Object.keys(lessonSteps || {}).forEach((k) => {
      if (k && k !== 'lastLessonId' && k !== 'activeLessonId') {
        unlocked.add(k);
      }
    });
    if (unlocked.size === 0) return 0;
    return getDueCards(leitnerState, 'ALL').filter((c) => {
      const mappedLesson = c.lessonId || CARD_LESSON_MAP[c.id];
      return mappedLesson && unlocked.has(mappedLesson);
    }).length;
  }, [leitnerState, completedIds, lessonSteps]);

  const handleNavigate = (mode, targetStageId) => {
    setViewMode(mode);
    if (!targetStageId) {
      window.scrollTo(0, 0);
    }
  };

  const openLesson = (stageOrLessonId, maybeLessonIdOrStep) => {
    const isSecondArgLesson =
      typeof maybeLessonIdOrStep === 'string' &&
      LESSONS.some((l) => l.id === maybeLessonIdOrStep);
    const targetId = isSecondArgLesson ? maybeLessonIdOrStep : stageOrLessonId;
    const explicitStep =
      typeof maybeLessonIdOrStep === 'number' && Number.isFinite(maybeLessonIdOrStep)
        ? Math.max(0, Math.floor(maybeLessonIdOrStep))
        : undefined;

    const found = LESSONS.find((l) => l.id === targetId);
    if (found) {
      setActiveLessonId(found.id);
      setLessonSteps((prev) => {
        const currentSaved = Number(prev?.[found.id] ?? 0);
        const nextStep = explicitStep !== undefined ? explicitStep : currentSaved;
        const next = { ...(prev || {}) };
        delete next[found.id];
        next[found.id] = nextStep;
        return next;
      });
      setViewMode('lesson');
      setCommandPaletteOpen(false);
      window.scrollTo(0, 0);
    }
  };

  const handleStepChange = (lessonId, nextStepIndex) => {
    const targetId = lessonId || activeLessonId;
    const numericStep = Math.max(0, Math.floor(Number(nextStepIndex) || 0));
    setLessonSteps((prev) => {
      const next = { ...(prev || {}) };
      delete next[targetId];
      next[targetId] = numericStep;
      return next;
    });
  };

  const toggleCompleteLesson = (lessonId) => {
    setCompletedIds((prev) =>
      prev.includes(lessonId) ? prev.filter((id) => id !== lessonId) : [...prev, lessonId]
    );
  };

  const handleSelectQuizOption = (lessonId, optionObj) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [lessonId]: optionObj.id,
    }));
    if (optionObj.correct && !completedIds.includes(lessonId)) {
      toggleCompleteLesson(lessonId);
    }
  };

  const handleSolveLab = (lessonId) => {
    setCompletedLabIds((prev) => (prev.includes(lessonId) ? prev : [...prev, lessonId]));
  };

  const handleSolvePipeline = (lessonId) => {
    setCompletedPipelineIds((prev) =>
      prev.includes(lessonId) ? prev : [...prev, lessonId]
    );
  };

  const toggleCompleteCapstone = (capstoneId) => {
    setCompletedCapstoneIds((prev) =>
      prev.includes(capstoneId)
        ? prev.filter((id) => id !== capstoneId)
        : [...prev, capstoneId]
    );
  };

  const handleReviewCard = (cardId, quality) => {
    setLeitnerState((prev) => {
      const next = reviewCard(prev, cardId, quality);
      saveLeitnerState(next);
      return next;
    });
  };

  const handleResetDeck = () => {
    const fresh = {};
    INITIAL_FLASHCARDS.forEach((c) => {
      fresh[c.id] = {
        box: 1,
        nextReviewIso: new Date(0).toISOString(),
        lastReviewedIso: null,
        lapses: 0,
        reps: 0,
      };
    });
    saveLeitnerState(fresh);
    setLeitnerState(fresh);
  };

  const handleCompleteDiagnostic = (result) => {
    setDiagnosticResult(result);
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
  };

  const askTutor = async (customPrompt) => {
    const promptText = (customPrompt || aiInput).trim();
    if (!promptText || aiLoading) return;
    // El panel envía el propio texto del input como customPrompt: también hay que vaciarlo.
    if (!customPrompt || customPrompt === aiInput) setAiInput('');
    setTutorOpen(true);
    setAiLoading(true);

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
        setAiMessages((prev) => [
          {
            source: 'Error',
            isError: true,
            question: promptText,
            answer: [data.message || data.error || 'La IA no pudo responder.', data.fix]
              .filter(Boolean)
              .join(' '),
          },
          ...prev,
        ]);
        return;
      }
      const seconds = data.elapsedMs ? ` · ${(data.elapsedMs / 1000).toFixed(1)} s` : '';
      setAiMessages((prev) => [
        {
          source: `${data.source}${seconds}`,
          question: promptText,
          answer: data.answer,
        },
        ...prev,
      ]);
    } catch {
      setAiMessages((prev) => [
        {
          source: 'Error',
          isError: true,
          question: promptText,
          answer:
            'No hay conexión con el servidor local. Comprueba que `npm run dev` siga en marcha y vuelve a preguntar.',
        },
        ...prev,
      ]);
    } finally {
      setAiLoading(false);
    }
  };

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
    const list = Array.isArray(GLOSSARY_CONCEPTS_2026) ? GLOSSARY_CONCEPTS_2026 : [];
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

  if (isUiShowcase) {
    return <UiShowcase theme={theme} onThemeChange={setTheme} />;
  }

  const activeStepIndex = Number(lessonSteps[currentLesson.id] ?? 0);
  const activeStepLabel =
    LESSON_STEP_LABELS[activeStepIndex] || LESSON_STEP_LABELS[0];

  return (
    <AppShell
      viewMode={viewMode}
      onNavigate={handleNavigate}
      completedIds={completedIds}
      totalLessons={LESSONS.length}
      dueCardsCount={dueCardsCount}
      tutorOpen={tutorOpen}
      onToggleTutor={() => setTutorOpen((o) => !o)}
      theme={theme}
      onToggleTheme={toggleTheme}
      onThemeChange={setTheme}
      onOpenCommandPalette={() => {
        setCommandQuery('');
        setCommandPaletteOpen(true);
      }}
      tutorPanel={
        <TutorPanel
          currentLesson={currentLesson}
          currentStage={currentStage}
          activeStepLabel={viewMode === 'lesson' ? activeStepLabel : undefined}
          engineMode={engineMode}
          onChangeEngineMode={setEngineMode}
          aiLoading={aiLoading}
          aiInput={aiInput}
          onChangeAiInput={setAiInput}
          aiMessages={aiMessages}
          onAskTutor={askTutor}
          onClose={() => setTutorOpen(false)}
        />
      }
    >
      <DiagnosticModal
        isOpen={diagnosticOpen}
        onClose={() => setDiagnosticOpen(false)}
        onCompleteDiagnostic={handleCompleteDiagnostic}
      />

      {commandPaletteOpen && (
        <div
          className="cmd-palette-backdrop"
          onClick={() => setCommandPaletteOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Buscador de lecciones y glosario"
        >
          <div
            className="cmd-palette-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cmd-palette-header">
              <input
                type="text"
                className="cmd-palette-input"
                placeholder="Buscar en las 18 lecciones o en el glosario técnico..."
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (filteredCommandLessons.length > 0) {
                      openLesson(filteredCommandLessons[0].id);
                    } else if (filteredCommandGlossary.length > 0) {
                      setViewMode('glossary');
                      setCommandPaletteOpen(false);
                    }
                  }
                }}
                autoFocus
                aria-label="Filtrar lecciones y términos del glosario"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCommandPaletteOpen(false)}
              >
                <Kbd>Esc</Kbd>
              </Button>
            </div>
            <div className="cmd-palette-list">
              {filteredCommandLessons.length > 0 && (
                <div>
                  <div className="cmd-palette-section-label tabular">
                    Lecciones ({filteredCommandLessons.length})
                  </div>
                  {filteredCommandLessons.map((lesson) => {
                    const isDone = completedIds.includes(lesson.id);
                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        className="cmd-palette-item"
                        onClick={() => openLesson(lesson.id)}
                      >
                        <div>
                          <strong className="tabular">
                            {String(lesson.order).padStart(2, '0')}. {lesson.title}
                          </strong>
                          <div className="cmd-palette-item__sub">
                            {lesson.subtitle}
                          </div>
                        </div>
                        <Chip variant={isDone ? 'success' : 'neutral'}>
                          {isDone ? 'Completada' : lesson.duration}
                        </Chip>
                      </button>
                    );
                  })}
                </div>
              )}

              {filteredCommandGlossary.length > 0 && (
                <div>
                  <div className="cmd-palette-section-label tabular">
                    Glosario ({filteredCommandGlossary.length})
                  </div>
                  {filteredCommandGlossary.map((concept) => (
                    <button
                      key={concept.id}
                      type="button"
                      className="cmd-palette-item"
                      onClick={() => {
                        setViewMode('glossary');
                        setCommandPaletteOpen(false);
                        window.scrollTo(0, 0);
                      }}
                    >
                      <div>
                        <strong>{concept.term}</strong>
                        <div className="cmd-palette-item__sub">
                          Lección {concept.lessonNumber}: {concept.lessonTitle}
                        </div>
                      </div>
                      <Chip variant="neutral">{concept.primaryRole || 'Glosario'}</Chip>
                    </button>
                  ))}
                </div>
              )}

              {filteredCommandLessons.length === 0 &&
                filteredCommandGlossary.length === 0 && (
                  <div className="cmd-palette-empty">
                    No se encontraron lecciones ni términos para «{commandQuery}».
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'home' && (
        <HomeView
          stages={LEARNING_STAGES}
          lessons={LESSONS}
          activeLessonId={activeLessonId}
          nextRecommendedLesson={nextRecommendedLesson}
          lessonSteps={lessonSteps}
          completedIds={completedIds}
          quizAnswers={quizAnswers}
          completedLabIds={completedLabIds}
          completedPipelineIds={completedPipelineIds}
          diagnosticResult={diagnosticResult}
          leitnerState={leitnerState}
          onOpenLesson={openLesson}
          onNavigate={handleNavigate}
          onOpenDiagnostic={() => setDiagnosticOpen(true)}
        />
      )}

      {viewMode === 'roadmap' && (
        <>
        <TrackPathView completedIds={completedIds} onOpenLesson={openLesson} />
        <RoadmapView
          stages={LEARNING_STAGES}
          lessons={LESSONS}
          completedIds={completedIds}
          lessonSteps={lessonSteps}
          completedLabIds={completedLabIds}
          diagnosticResult={diagnosticResult}
          nextRecommendedLesson={nextRecommendedLesson}
          onOpenLesson={openLesson}
          onOpenDiagnostic={() => setDiagnosticOpen(true)}
        />
        </>
      )}

      {viewMode === 'lesson' && (
        <LessonPlayer
          lessons={LESSONS}
          currentLesson={currentLesson}
          currentStage={currentStage}
          prevLesson={prevLesson}
          nextLesson={nextLesson}
          currentStep={lessonSteps[currentLesson.id] ?? 0}
          onStepChange={handleStepChange}
          completedIds={completedIds}
          quizAnswers={quizAnswers}
          completedLabIds={completedLabIds}
          completedPipelineIds={completedPipelineIds}
          onSelectQuizOption={handleSelectQuizOption}
          onToggleCompleteLesson={toggleCompleteLesson}
          onSolveLab={handleSolveLab}
          onSolvePipeline={handleSolvePipeline}
          onOpenLesson={openLesson}
          onNavigate={handleNavigate}
          onAskTutor={askTutor}
          onOpenTutor={() => setTutorOpen(true)}
        />
      )}

      {viewMode === 'practice' && (
        <SpacedRepetitionView
          leitnerState={leitnerState}
          completedIds={completedIds}
          lessonSteps={lessonSteps}
          onReviewCard={handleReviewCard}
          onResetDeck={handleResetDeck}
          onOpenLesson={openLesson}
        />
      )}

      {viewMode === 'capstones' && (
        <CapstoneProjectsView
          completedCapstoneIds={completedCapstoneIds}
          onToggleCompleteCapstone={toggleCompleteCapstone}
          onAskAiTutor={(prompt) => {
            setViewMode('lesson');
            askTutor(prompt);
          }}
        />
      )}

      {viewMode === 'glossary' && (
        <GlossaryAndGraphView onOpenLesson={openLesson} />
      )}

      {viewMode === 'analytics' && (
        <LearningAnalyticsView
          lessons={LESSONS}
          completedIds={completedIds}
          quizScores={quizAnswers}
          codeSolvedIds={completedLabIds}
          leitnerStats={leitnerState}
          diagnosticResult={diagnosticResult}
          onOpenLesson={openLesson}
          onOpenDiagnostic={() => setDiagnosticOpen(true)}
        />
      )}
    </AppShell>
  );
}
