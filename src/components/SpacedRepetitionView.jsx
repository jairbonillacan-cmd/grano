import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  INITIAL_FLASHCARDS,
  BOX_INTERVALS_DAYS,
  getDueCards,
} from '../engine/spacedRepetition.js';
import { LESSONS } from '../data/learningPath2026.js';
import { formatInlineText } from '../utils/formatText.jsx';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Illustration,
  Kbd,
  ProgressBar,
  STAGE_THEMES,
  getStageNumber,
  getStageTheme,
} from './ui/index.js';

export const CARD_LESSON_MAP = {
  'fc-01': 'l1-joins-fanout',
  'fc-02': 'l2-window-functions',
  'fc-03': 'l3-asof-lateral-ctes',
  'fc-04': 'l4-star-schema-obt',
  'fc-05': 'l5-scd2-history',
  'fc-06': 'l6-metrics-simpson',
  'fc-07': 'l6-metrics-simpson',
  'fc-08': 'l7-columnar-parquet',
  'fc-09': 'l8-arrow-lance-vortex',
  'fc-10': 'l9-duckdb-polars-marimo',
  'fc-11': 'l9-duckdb-polars-marimo',
  'fc-12': 'l10-iceberg-v3-medallion',
  'fc-13': 'l10-iceberg-v3-medallion',
  'fc-14': 'l11-dbt-sqlmesh-dag',
  'fc-15': 'l12-contracts-semantic-layer',
  'fc-16': 'l12-contracts-semantic-layer',
  'fc-17': 'l14-ab-testing-cuped',
  'fc-18': 'l14-ab-testing-cuped',
  'fc-19': 'l15-bi-tufte-code',
  'fc-20': 'l15-bi-tufte-code',
  'fc-21': 'l16-cdc-kafka-streaming',
  'fc-22': 'l17-flink-watermarks-mv',
  'fc-23': 'l18-mcp-semantic-ai-rag',
  'fc-24': 'l18-mcp-semantic-ai-rag',
};

const GRADE_OPTIONS = [
  {
    key: '1',
    quality: 'again',
    label: '1 · Otra vez',
    intervalLabel: '1 día',
    variantClass: 'sr-grade-btn--again',
  },
  {
    key: '2',
    quality: 'hard',
    label: '2 · Difícil',
    intervalLabel: '3 días',
    variantClass: 'sr-grade-btn--hard',
  },
  {
    key: '3',
    quality: 'good',
    label: '3 · Bien',
    intervalLabel: '7 días',
    variantClass: 'sr-grade-btn--good',
  },
  {
    key: '4',
    quality: 'easy',
    label: '4 · Fácil',
    intervalLabel: '14 días',
    variantClass: 'sr-grade-btn--easy',
  },
];

export function SpacedRepetitionView({
  leitnerState = {},
  completedIds,
  lessonSteps,
  onReviewCard = () => {},
  onResetDeck = () => {},
  onOpenLesson = () => {},
}) {
  const [disciplineFilter, setDisciplineFilter] = useState('ALL');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [selectedBox, setSelectedBox] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [practiceFullDeck, setPracticeFullDeck] = useState(false);
  const [sessionGrades, setSessionGrades] = useState([]);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  const effectiveCompletedIds = useMemo(() => {
    if (Array.isArray(completedIds)) return completedIds;
    try {
      const saved = localStorage.getItem('ruta_datos_2026_completed');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, [completedIds]);

  const effectiveLessonSteps = useMemo(() => {
    if (lessonSteps && typeof lessonSteps === 'object') return lessonSteps;
    try {
      const saved = localStorage.getItem('manual_datos_lesson_step');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }, [lessonSteps]);

  const unlockedLessonIds = useMemo(() => {
    const set = new Set(effectiveCompletedIds);
    Object.keys(effectiveLessonSteps || {}).forEach((lessonId) => {
      if (lessonId) set.add(lessonId);
    });
    return set;
  }, [effectiveCompletedIds, effectiveLessonSteps]);

  const unlockedStageIds = useMemo(() => {
    const set = new Set();
    LESSONS.forEach((lesson) => {
      if (unlockedLessonIds.has(lesson.id)) {
        set.add(lesson.stageId);
      }
    });
    return set;
  }, [unlockedLessonIds]);

  const cardsMap = useMemo(() => {
    if (leitnerState && typeof leitnerState.cards === 'object') {
      return leitnerState.cards;
    }
    return leitnerState || {};
  }, [leitnerState]);

  const boxCounts = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    INITIAL_FLASHCARDS.forEach((c) => {
      const box = cardsMap[c.id]?.box || 1;
      counts[box] = (counts[box] || 0) + 1;
    });
    return counts;
  }, [cardsMap]);

  const dueCards = useMemo(
    () => getDueCards(cardsMap, disciplineFilter),
    [cardsMap, disciplineFilter]
  );

  const pedagogicallyUnlockedDueCards = useMemo(() => {
    if (unlockedLessonIds.size === 0) return [];
    return dueCards.filter((card) => {
      const mappedLesson = card.lessonId || CARD_LESSON_MAP[card.id];
      if (mappedLesson) return unlockedLessonIds.has(mappedLesson);
      return unlockedStageIds.has(card.stageId);
    });
  }, [dueCards, unlockedLessonIds, unlockedStageIds]);

  const filteredCards = useMemo(() => {
    const baseList = practiceFullDeck
      ? INITIAL_FLASHCARDS
      : pedagogicallyUnlockedDueCards;
    return baseList.filter((c) => {
      const matchRole =
        disciplineFilter === 'ALL' || c.discipline === disciplineFilter;
      const matchStage =
        stageFilter === 'ALL' || c.stageId === stageFilter;
      const cardBox = cardsMap[c.id]?.box || 1;
      const matchBox = selectedBox === null || cardBox === selectedBox;
      return matchRole && matchStage && matchBox;
    });
  }, [
    cardsMap,
    disciplineFilter,
    stageFilter,
    selectedBox,
    practiceFullDeck,
    pedagogicallyUnlockedDueCards,
  ]);

  const totalQueueCount = filteredCards.length + (practiceFullDeck ? 0 : sessionGrades.length);
  const activeCard =
    !sessionCompleted && filteredCards.length > 0
      ? filteredCards[currentIndex % filteredCards.length]
      : null;
  const activeBox = activeCard ? cardsMap[activeCard.id]?.box || 1 : 1;
  const activeStageNum = activeCard ? getStageNumber(activeCard.stageId) : 1;
  const activeStageTheme = getStageTheme(activeStageNum);

  const sessionPosition = practiceFullDeck
    ? Math.min(filteredCards.length, currentIndex + 1)
    : Math.min(totalQueueCount, sessionGrades.length + 1);
  const sessionTotal = practiceFullDeck
    ? filteredCards.length
    : Math.max(filteredCards.length, totalQueueCount);
  const sessionPct =
    sessionTotal > 0 ? Math.round((sessionPosition / sessionTotal) * 100) : 0;

  const handleStartFullDeck = useCallback(() => {
    setSelectedBox(null);
    setPracticeFullDeck(true);
    setCurrentIndex(0);
    setFlipped(false);
    setSessionGrades([]);
    setSessionCompleted(false);
  }, []);

  const handleGrade = useCallback(
    (quality) => {
      if (!activeCard) return;
      onReviewCard(activeCard.id, quality);
      const nextGrades = [...sessionGrades, { cardId: activeCard.id, quality }];
      setSessionGrades(nextGrades);
      setFlipped(false);

      if (practiceFullDeck) {
        if (currentIndex + 1 >= filteredCards.length) {
          setSessionCompleted(true);
        } else {
          setCurrentIndex((i) => i + 1);
        }
      } else {
        if (filteredCards.length <= 1) {
          setSessionCompleted(true);
        } else {
          setCurrentIndex(0);
        }
      }
    },
    [activeCard, onReviewCard, sessionGrades, practiceFullDeck, currentIndex, filteredCards.length]
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (!activeCard) return;

      if (e.key === '1') {
        e.preventDefault();
        handleGrade('again');
      } else if (e.key === '2') {
        e.preventDefault();
        handleGrade('hard');
      } else if (e.key === '3') {
        e.preventDefault();
        handleGrade('good');
      } else if (e.key === '4') {
        e.preventDefault();
        handleGrade('easy');
      } else if (e.key === ' ' && !flipped) {
        e.preventDefault();
        setFlipped(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCard, flipped, handleGrade]);

  const goodOrEasyCount = sessionGrades.filter(
    (g) => g.quality === 'good' || g.quality === 'easy'
  ).length;
  const againOrHardCount = sessionGrades.length - goodOrEasyCount;
  const retentionRate =
    sessionGrades.length > 0
      ? Math.round((goodOrEasyCount / sessionGrades.length) * 100)
      : 0;

  return (
    <div className="sec-view">
      <header className="sec-header">
        <div>
          <div className="sec-header__eyebrow tabular">
            Sistema Leitner · 5 cajas de memoria
          </div>
          <h1 className="sec-header__title">Repaso espaciado</h1>
          <p className="sec-header__lead">
            Consolida conceptos clave de Ingeniería (DE), Análisis (DA) y BI de
            las lecciones que ya empezaste. Califica cada tarjeta con los botones
            o los atajos <Kbd>1</Kbd>–<Kbd>4</Kbd>.
          </p>
        </div>

        <div className="sec-header__actions">
          {['ALL', 'DE', 'DA', 'BI'].map((role) => (
            <Chip
              key={role}
              variant={role === 'ALL' ? 'neutral' : 'role'}
              role={role === 'ALL' ? undefined : role}
              active={disciplineFilter === role}
              onClick={() => {
                setDisciplineFilter(role);
                setCurrentIndex(0);
                setFlipped(false);
                setSessionCompleted(false);
              }}
            >
              {role === 'ALL' ? `Todas (${INITIAL_FLASHCARDS.length})` : role}
            </Chip>
          ))}
          <Button
            variant={practiceFullDeck ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => {
              if (practiceFullDeck) {
                setPracticeFullDeck(false);
                setCurrentIndex(0);
                setFlipped(false);
                setSessionGrades([]);
                setSessionCompleted(false);
              } else {
                handleStartFullDeck();
              }
            }}
          >
            {practiceFullDeck
              ? 'Ver solo para hoy'
              : `Practicar mazo completo (${INITIAL_FLASHCARDS.length} tarjetas)`}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onResetDeck();
              setPracticeFullDeck(false);
              setStageFilter('ALL');
              setSelectedBox(null);
              setCurrentIndex(0);
              setFlipped(false);
              setSessionGrades([]);
              setSessionCompleted(false);
            }}
          >
            Reiniciar mazo
          </Button>
        </div>
      </header>

      {/* Filtro por etapa: las 6 etapas reconocibles por su color data-stage */}
      <div className="glos-stage-filters" aria-label="Filtrar tarjetas por etapa">
        <Chip
          variant="neutral"
          active={stageFilter === 'ALL'}
          onClick={() => {
            setStageFilter('ALL');
            setCurrentIndex(0);
            setFlipped(false);
            setSessionCompleted(false);
          }}
        >
          Todas las etapas
        </Chip>
        {STAGE_THEMES.map((st) => (
          <Chip
            key={st.id}
            variant="stage"
            stage={st.number}
            active={stageFilter === st.id}
            onClick={() => {
              setStageFilter((prev) => (prev === st.id ? 'ALL' : st.id));
              setCurrentIndex(0);
              setFlipped(false);
              setSessionCompleted(false);
            }}
          >
            Etapa {st.number} · {st.shortName}
          </Chip>
        ))}
      </div>

      {/* Distribución en las 5 cajas Leitner */}
      <div
        className="sr-boxes-grid"
        aria-label="Distribución en las 5 cajas de memoria"
      >
        {[1, 2, 3, 4, 5].map((b) => {
          const isSelected = selectedBox === b;
          const count = boxCounts[b] || 0;
          return (
            <button
              key={b}
              type="button"
              className={`sr-box-btn ${isSelected ? 'sr-box-btn--active' : ''}`.trim()}
              onClick={() => {
                setSelectedBox((prev) => (prev === b ? null : b));
                setCurrentIndex(0);
                setFlipped(false);
                setSessionCompleted(false);
              }}
            >
              <div className="sr-box-btn__head">
                <span>Caja {b}</span>
                <span className="tabular">cada {BOX_INTERVALS_DAYS[b]}d</span>
              </div>
              <div className="sr-box-btn__count tabular">
                {count} {count === 1 ? 'tarjeta' : 'tarjetas'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Pantalla de sesión completada con resumen */}
      {sessionCompleted && sessionGrades.length > 0 ? (
        <div className="sr-center-wrap">
          <Card className="sr-summary-card">
            <Illustration name="empty-reviews" size="md" />
            <div>
              <h2 className="sr-summary-card__title">
                Sesión completada · Nada que repasar hoy
              </h2>
              <p className="sr-summary-card__desc">
                Has calificado las {sessionGrades.length} tarjetas de tu cola de
                estudio. Los intervalos de repetición espaciada se han actualizado.
              </p>
            </div>

            <div className="sr-summary-stats">
              <div className="sr-summary-stat">
                <span className="sr-summary-stat__val tabular">
                  {sessionGrades.length}
                </span>
                <span className="sr-summary-stat__label">Tarjetas repasadas</span>
              </div>
              <div className="sr-summary-stat">
                <span className="sr-summary-stat__val tabular">
                  {goodOrEasyCount}
                </span>
                <span className="sr-summary-stat__label">Bien / Fácil</span>
              </div>
              <div className="sr-summary-stat">
                <span className="sr-summary-stat__val tabular">
                  {againOrHardCount}
                </span>
                <span className="sr-summary-stat__label">Otra vez / Difícil</span>
              </div>
              <div className="sr-summary-stat">
                <span className="sr-summary-stat__val tabular">
                  {retentionRate}%
                </span>
                <span className="sr-summary-stat__label">Precisión sesión</span>
              </div>
            </div>

            <div className="sr-empty-actions">
              <Button
                variant="secondary"
                size="md"
                onClick={handleStartFullDeck}
              >
                Practicar mazo completo ({INITIAL_FLASHCARDS.length} tarjetas)
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setSessionCompleted(false);
                  setSessionGrades([]);
                  setPracticeFullDeck(false);
                  setCurrentIndex(0);
                }}
              >
                Volver a cola de hoy
              </Button>
            </div>
          </Card>
        </div>
      ) : !activeCard ? (
        <div className="sr-center-wrap">
          <EmptyState
            illustration={<Illustration name="empty-reviews" />}
            title="Nada que repasar hoy"
            description={
              selectedBox !== null
                ? `No tienes tarjetas pendientes hoy en la Caja ${selectedBox}. Completa o avanza en una lección para desbloquear sus tarjetas de memoria.`
                : 'Completa o avanza en una lección para desbloquear sus tarjetas de memoria.'
            }
            action={
              <div className="sr-empty-actions">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleStartFullDeck}
                >
                  Practicar mazo completo ({INITIAL_FLASHCARDS.length} tarjetas)
                </Button>
                {selectedBox !== null && (
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => {
                      setSelectedBox(null);
                      setCurrentIndex(0);
                    }}
                  >
                    Ver todas las cajas
                  </Button>
                )}
              </div>
            }
          />
        </div>
      ) : (
        <div className="sr-center-wrap">
          {/* Barra de sesión "X de Y" arriba */}
          <div className="sr-session-bar" data-stage={activeStageNum}>
            <div className="sr-session-bar__top">
              <div className="sr-session-bar__label">
                <span>
                  {practiceFullDeck
                    ? 'Sesión de práctica · Mazo completo'
                    : 'Sesión de repaso · Para hoy'}
                </span>
                <Chip variant="stage" stage={activeStageNum}>
                  Etapa {activeStageNum} · {activeStageTheme.shortName}
                </Chip>
              </div>
              <span
                className="sr-session-bar__count tabular"
                aria-label={`Tarjeta ${sessionPosition} de ${sessionTotal}`}
              >
                {sessionPosition} de {sessionTotal}
              </span>
            </div>
            <ProgressBar
              value={sessionPct}
              stage={activeStageNum}
              tone="stage"
              size="sm"
              label={`Progreso de sesión: ${sessionPosition} de ${sessionTotal}`}
            />
          </div>

          {/* Flashcard grande centrada con data-stage y volteo 3D */}
          <div className="sr-flashcard-scene">
            <Card
              stage={activeStageNum}
              className={`sr-flashcard ${flipped ? 'sr-flashcard--flipped' : ''}`.trim()}
            >
              <div className="sr-flashcard__meta">
                <div className="sr-flashcard__chips">
                  <Chip variant="role" role={activeCard.discipline}>
                    {activeCard.discipline}
                  </Chip>
                  <Chip variant="stage" stage={activeStageNum}>
                    Etapa {activeStageNum} · {activeStageTheme.shortName}
                  </Chip>
                  <Chip variant="neutral">
                    Caja {activeBox} · {BOX_INTERVALS_DAYS[activeBox]}d
                  </Chip>
                  {activeCard.bloomLevel && (
                    <Chip variant="neutral">Bloom: {activeCard.bloomLevel}</Chip>
                  )}
                </div>
              </div>

              <div>
                <div className="sr-flashcard__eyebrow">
                  Pregunta de recuerdo activo
                </div>
                <h2 className="sr-flashcard__question">
                  {formatInlineText(activeCard.question)}
                </h2>
              </div>

              {!flipped ? (
                <div className="sr-flashcard__front-footer">
                  <div className="sr-flashcard__front-actions">
                    <Button
                      variant="stage"
                      stage={activeStageNum}
                      size="md"
                      onClick={() => setFlipped(true)}
                    >
                      <span>Mostrar respuesta</span>
                      <Kbd>Espacio</Kbd>
                    </Button>
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => {
                        setFlipped(false);
                        setCurrentIndex((i) => i + 1);
                      }}
                    >
                      Siguiente tarjeta
                    </Button>
                  </div>

                  {activeCard.stageId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        onOpenLesson(
                          CARD_LESSON_MAP[activeCard.id] || activeCard.stageId
                        )
                      }
                    >
                      Abrir lección relacionada
                    </Button>
                  )}
                </div>
              ) : (
                <div className="sr-flashcard__back">
                  <div className="sr-flashcard__answer">
                    {formatInlineText(activeCard.answer)}
                  </div>

                  <div className="sr-grade-block">
                    <div className="sr-grade-block__head">
                      <span>Califica tu recordación (atajos de teclado 1–4):</span>
                      <span className="sr-grade-block__kbds tabular">
                        <Kbd>1</Kbd> <Kbd>2</Kbd> <Kbd>3</Kbd> <Kbd>4</Kbd>
                      </span>
                    </div>

                    <div className="sr-grade-grid">
                      {GRADE_OPTIONS.map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          className={`sr-grade-btn ${opt.variantClass}`.trim()}
                          onClick={() => handleGrade(opt.quality)}
                        >
                          <div className="sr-grade-btn__top">
                            <strong className="sr-grade-btn__label">
                              {opt.label}
                            </strong>
                            <Kbd>{opt.key}</Kbd>
                          </div>
                          <span className="sr-grade-btn__interval tabular">
                            Siguiente: {opt.intervalLabel}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeCard.codeSnippet && (
                    <pre className="code-block-dark tabular sr-flashcard__code">
                      <code>{activeCard.codeSnippet}</code>
                    </pre>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default SpacedRepetitionView;
