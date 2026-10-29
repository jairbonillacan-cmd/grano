import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  RotateCcw,
  Eye,
  BookOpen,
  Check,
} from 'lucide-react';
import {
  FLASHCARDS,
  INITIAL_FLASHCARDS,
  CARD_LESSON_MAP,
} from '../data/flashcards.js';
import {
  Rating,
  State,
  createFSRSCard,
  previewCardRatings,
  gradeCard,
  getDueCards,
} from '../engine/review.js';
import { MODULES_BY_ID } from '../data/catalog/modules.js';
import { LESSONS_BY_ID } from '../data/lessons/index.js';
import {
  useStore,
  useProgress,
  useReview,
  reviewFlashcard,
  flushSave,
} from '../state/store.js';
import { Button, Segmented, Kbd } from './ui/index.js';

export { FLASHCARDS, INITIAL_FLASHCARDS, CARD_LESSON_MAP };

const TRACK_FILTER_ITEMS = [
  { id: 'all', label: 'Todas' },
  { id: 'core', label: 'Tronco común' },
  { id: 'de', label: 'DE', track: 'de' },
  { id: 'da', label: 'DA', track: 'da' },
  { id: 'bi', label: 'BI', track: 'bi' },
];

const FSRS_BUTTONS = [
  {
    rating: Rating.Again,
    key: '1',
    field: 'again',
    label: 'Otra vez',
    tone: 'again',
  },
  {
    rating: Rating.Hard,
    key: '2',
    field: 'hard',
    label: 'Difícil',
    tone: 'hard',
  },
  {
    rating: Rating.Good,
    key: '3',
    field: 'good',
    label: 'Bien',
    tone: 'good',
  },
  {
    rating: Rating.Easy,
    key: '4',
    field: 'easy',
    label: 'Fácil',
    tone: 'easy',
  },
];

const FSRS_STATE_NAMES = {
  [State.New]: 'Nueva',
  [State.Learning]: 'En aprendizaje',
  [State.Review]: 'En repaso',
  [State.Relearning]: 'Reaprendizaje',
};

const TRACK_NAMES = {
  core: 'Tronco común',
  de: 'Ingeniería de Datos (DE)',
  da: 'Análisis de Datos (DA)',
  bi: 'Business Intelligence (BI)',
};

export function SpacedRepetitionView({
  leitnerState = {},
  onReviewCard,
  onResetDeck,
  onOpenLesson,
  onNavigate,
  lessons = [],
}) {
  const fullState = useStore();
  const progress = useProgress();
  const review = useReview();

  const [trackFilter, setTrackFilter] = useState('all');
  const [practiceAllMode, setPracticeAllMode] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [cursorIndex, setCursorIndex] = useState(0);
  const [sessionReviewed, setSessionReviewed] = useState([]);

  // Determinar qué lecciones ha iniciado o completado el usuario
  const startedLessonIds = useMemo(() => {
    const ids = new Set();
    for (const [id, entry] of Object.entries(progress?.lessons || {})) {
      if (!entry) continue;
      if (
        entry.status === 'in_progress' ||
        entry.status === 'completed' ||
        entry.status === 'known' ||
        Number(entry.stepIndex || 0) > 0 ||
        Object.keys(entry.checks || {}).length > 0 ||
        Boolean(entry.practice?.solved)
      ) {
        ids.add(id);
        const mapped = LESSONS_BY_ID[id];
        if (mapped?.id) ids.add(mapped.id);
        if (mapped?.legacyId) ids.add(mapped.legacyId);
      }
    }
    return ids;
  }, [progress?.lessons]);

  const hasStartedAnyLesson = startedLessonIds.size > 0;

  // Combinar catálogo completo de 75 tarjetas FSRS con el estado persistido
  const enrichedCatalog = useMemo(() => {
    const now = new Date();
    const storedCards = {
      ...(leitnerState || {}),
      ...(review?.cards || {}),
    };

    const sourceCards =
      Array.isArray(FLASHCARDS) && FLASHCARDS.length > 0
        ? FLASHCARDS
        : INITIAL_FLASHCARDS;

    return sourceCards.map((fc) => {
      const saved = storedCards[fc.id] || createFSRSCard(new Date(0), fc.id);
      const dueMs = Date.parse(saved.due);
      const isUnlockedByProgress =
        startedLessonIds.has(fc.lessonId) ||
        (fc.legacyLessonId && startedLessonIds.has(fc.legacyLessonId));
      const hasBeenReviewed = Number(saved.reps || 0) > 0;
      const isDueNow =
        (isUnlockedByProgress || hasBeenReviewed) &&
        (Number.isNaN(dueMs) || dueMs <= now.getTime());

      const previews = previewCardRatings(saved, now);
      const lessonObj =
        LESSONS_BY_ID[fc.lessonId] ||
        (fc.legacyLessonId && LESSONS_BY_ID[fc.legacyLessonId]) ||
        lessons.find(
          (l) => l.id === fc.legacyLessonId || l.v2Id === fc.lessonId
        ) ||
        null;
      const moduleObj = MODULES_BY_ID[fc.moduleId] || null;

      return {
        ...fc,
        question: fc.front || fc.question,
        answer: fc.back || fc.answer,
        fsrs: saved,
        isUnlocked: isUnlockedByProgress || hasBeenReviewed,
        isDue: isDueNow,
        previews,
        lessonObj,
        moduleObj,
      };
    });
  }, [leitnerState, review?.cards, startedLessonIds, lessons]);

  // También sincronizar con getDueCards del motor cuando hay progreso
  const engineDueCount = useMemo(
    () => getDueCards(fullState, 'ALL').length,
    [fullState]
  );

  // Filtrar por área seleccionada
  const filteredByTrack = useMemo(() => {
    if (trackFilter === 'all') return enrichedCatalog;
    return enrichedCatalog.filter((c) => c.track === trackFilter);
  }, [enrichedCatalog, trackFilter]);

  // Cola de tarjetas vencidas hoy (o catálogo en modo práctica libre)
  const activeQueue = useMemo(() => {
    const reviewedSet = new Set(sessionReviewed);
    if (practiceAllMode) {
      return filteredByTrack.filter((c) => !reviewedSet.has(c.id));
    }
    return filteredByTrack.filter((c) => c.isDue && !reviewedSet.has(c.id));
  }, [filteredByTrack, practiceAllMode, sessionReviewed]);

  const totalDueInCatalog = useMemo(
    () => enrichedCatalog.filter((c) => c.isDue).length,
    [enrichedCatalog]
  );

  const safeCursor =
    activeQueue.length > 0 ? Math.min(cursorIndex, activeQueue.length - 1) : 0;
  const activeCard = activeQueue[safeCursor] || null;

  // Emitir conteo actualizado hacia AppShell
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('manual_datos_due_count', {
          detail: totalDueInCatalog,
        })
      );
    }
  }, [totalDueInCatalog, engineDueCount]);

  const handleGrade = useCallback(
    (ratingValue) => {
      if (!activeCard) return;
      const now = new Date();
      // Calcular el nuevo estado FSRS con gradeCard y persistir en el store
      gradeCard(activeCard.fsrs, ratingValue, now);
      if (typeof onReviewCard === 'function') {
        onReviewCard(activeCard.id, ratingValue);
      } else {
        reviewFlashcard(activeCard.id, ratingValue, now);
      }
      flushSave();
      setSessionReviewed((prev) =>
        prev.includes(activeCard.id) ? prev : [...prev, activeCard.id]
      );
      setShowAnswer(false);
      setCursorIndex(0);
    },
    [activeCard, onReviewCard]
  );

  // Atajos de teclado: Space / Enter para voltear, 1..4 para calificar con FSRS
  useEffect(() => {
    const onKeyDown = (event) => {
      if (!activeCard) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target;
      const tag = target?.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target?.isContentEditable
      ) {
        return;
      }

      if (event.code === 'Space' || event.key === ' ') {
        event.preventDefault();
        setShowAnswer((prev) => !prev);
        return;
      }

      if (event.key === 'Enter' && !showAnswer && tag !== 'BUTTON') {
        event.preventDefault();
        setShowAnswer(true);
        return;
      }

      if (event.key === '1') {
        event.preventDefault();
        handleGrade(Rating.Again);
      } else if (event.key === '2') {
        event.preventDefault();
        handleGrade(Rating.Hard);
      } else if (event.key === '3') {
        event.preventDefault();
        handleGrade(Rating.Good);
      } else if (event.key === '4') {
        event.preventDefault();
        handleGrade(Rating.Easy);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeCard, showAnswer, handleGrade]);

  const handleFilterChange = (nextTrack) => {
    setTrackFilter(nextTrack);
    setCursorIndex(0);
    setShowAnswer(false);
  };

  return (
    <div className="sec-view review-view" data-view="review">
      <header className="sec-header">
        <div className="sec-header__top">
          <div>
            <span className="sec-kicker tabular">
              REPETICIÓN ESPACIADA FSRS · {totalDueInCatalog} PENDIENTES HOY ·{' '}
              {sessionReviewed.length} REPASADAS EN SESIÓN
            </span>
            <h1 className="sec-title">Repaso</h1>
            <p className="sec-lead">
              Cada tarjeta se programa según su estabilidad y dificultad de recuerdo. Pulsa{' '}
              <Kbd>Espacio</Kbd> para mostrar la respuesta y <Kbd>1</Kbd>–<Kbd>4</Kbd>{' '}
              para calificar.
            </p>
          </div>

          <div className="sec-actions">
            {practiceAllMode ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setPracticeAllMode(false);
                  setShowAnswer(false);
                  setCursorIndex(0);
                }}
              >
                Solo vencidas hoy ({totalDueInCatalog})
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setPracticeAllMode(true);
                  setSessionReviewed([]);
                  setShowAnswer(false);
                  setCursorIndex(0);
                }}
              >
                Practicar catálogo ({filteredByTrack.length})
              </Button>
            )}
            {typeof onResetDeck === 'function' && (
              <Button
                variant="ghost"
                size="sm"
                icon={RotateCcw}
                onClick={() => {
                  onResetDeck();
                  setSessionReviewed([]);
                  setShowAnswer(false);
                  setCursorIndex(0);
                }}
              >
                Reiniciar calendario
              </Button>
            )}
          </div>
        </div>

        <div className="review-toolbar">
          <Segmented
            ariaLabel="Filtrar tarjetas por área"
            items={TRACK_FILTER_ITEMS}
            value={trackFilter}
            onChange={handleFilterChange}
            size="sm"
          />
          <span className="review-toolbar__counter tabular">
            {activeQueue.length > 0
              ? `Tarjeta ${safeCursor + 1} de ${activeQueue.length}`
              : '0 tarjetas en cola'}
          </span>
        </div>
      </header>

      {activeCard ? (
        <section
          className="review-stage"
          aria-label="Tarjeta de repaso activa"
          data-testid="fsrs-active-card"
        >
          <article className="fsrs-card">
            <header className="fsrs-card__header">
              <div className="fsrs-card__meta">
                <span
                  className={`fsrs-card__track fsrs-card__track--${activeCard.track}`}
                >
                  <span
                    className={`fsrs-card__dot fsrs-card__dot--${activeCard.track}`}
                    aria-hidden="true"
                  />
                  {TRACK_NAMES[activeCard.track] || 'Tronco común'}
                </span>
                {activeCard.moduleObj && (
                  <>
                    <span className="fsrs-card__sep" aria-hidden="true">·</span>
                    <span className="fsrs-card__module">
                      Nivel {activeCard.moduleObj.level} · {activeCard.moduleObj.title}
                    </span>
                  </>
                )}
              </div>

              <div className="fsrs-card__stats tabular">
                <span>
                  {FSRS_STATE_NAMES[activeCard.fsrs?.state] || 'Nueva'}
                </span>
                {Number(activeCard.fsrs?.stability || 0) > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      Estabilidad: {Number(activeCard.fsrs.stability).toFixed(1)} d
                    </span>
                  </>
                )}
              </div>
            </header>

            <div className="fsrs-card__question-block">
              <span className="fsrs-card__section-label">PREGUNTA</span>
              <h2 className="fsrs-card__question" data-testid="fsrs-card-front">
                {activeCard.question}
              </h2>
            </div>

            {!showAnswer ? (
              <div className="fsrs-card__reveal">
                <Button
                  variant="primary"
                  size="md"
                  icon={Eye}
                  shortcut="Espacio"
                  onClick={() => setShowAnswer(true)}
                  data-testid="fsrs-reveal-btn"
                >
                  Mostrar respuesta
                </Button>
              </div>
            ) : (
              <div
                className="fsrs-card__answer-block"
                data-testid="fsrs-card-back"
              >
                <span className="fsrs-card__section-label">RESPUESTA</span>
                <p className="fsrs-card__answer">{activeCard.answer}</p>

                {activeCard.lessonObj && (
                  <div className="fsrs-card__lesson-ref">
                    <span className="fsrs-card__lesson-label">
                      Lección vinculada: {activeCard.lessonObj.title}
                    </span>
                    <button
                      type="button"
                      className="fsrs-card__lesson-link"
                      onClick={() =>
                        onOpenLesson?.(
                          activeCard.lessonObj.stageId,
                          activeCard.lessonObj.id
                        )
                      }
                    >
                      <BookOpen size={14} aria-hidden="true" />
                      <span>Abrir lección</span>
                    </button>
                  </div>
                )}

                <div
                  className="fsrs-rating-grid"
                  role="group"
                  aria-label="Calificar recuerdo de la tarjeta (1 a 4)"
                  data-testid="fsrs-rating-buttons"
                >
                  {FSRS_BUTTONS.map((btn) => {
                    const intervalLabel =
                      activeCard.previews?.[btn.field]?.intervalLabel || '1 d';
                    return (
                      <button
                        key={btn.key}
                        type="button"
                        className={`fsrs-rating-btn fsrs-rating-btn--${btn.tone}`}
                        onClick={() => handleGrade(btn.rating)}
                        data-rating={btn.rating}
                        data-testid={`fsrs-rate-${btn.key}`}
                      >
                        <div className="fsrs-rating-btn__top">
                          <span className="fsrs-rating-btn__label">
                            {btn.label}
                          </span>
                          <kbd className="fsrs-rating-btn__kbd">{btn.key}</kbd>
                        </div>
                        <span
                          className="fsrs-rating-btn__interval tabular"
                          data-testid={`fsrs-interval-${btn.key}`}
                        >
                          {intervalLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </article>
        </section>
      ) : (
        <section
          className="review-empty-box"
          role="status"
          data-testid="fsrs-empty-state"
        >
          <div className="review-empty-box__head">
            <Check size={18} aria-hidden="true" className="review-empty-box__icon" />
            <h2 className="review-empty-box__title">
              {hasStartedAnyLesson
                ? 'No tienes tarjetas pendientes por hoy en este filtro'
                : 'Aún no hay tarjetas programadas para hoy'}
            </h2>
          </div>
          <p className="review-empty-box__desc">
            {hasStartedAnyLesson
              ? `Has completado las revisiones vencidas (${sessionReviewed.length} repasadas en esta sesión). Puedes practicar el mazo completo o continuar con tu siguiente lección.`
              : 'Las tarjetas FSRS se activan automáticamente conforme avanzas por las lecciones de tu ruta. También puedes practicar el mazo completo ahora mismo.'}
          </p>
          <div className="review-empty-box__actions">
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setPracticeAllMode(true);
                setSessionReviewed([]);
                setShowAnswer(false);
                setCursorIndex(0);
              }}
            >
              Practicar mazo ({filteredByTrack.length} tarjetas)
            </Button>
            {typeof onNavigate === 'function' && (
              <Button
                variant="secondary"
                size="md"
                onClick={() => onNavigate('home')}
              >
                Ir a Hoy
              </Button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default SpacedRepetitionView;
