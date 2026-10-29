import React, { useMemo, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Repeat,
  Database,
  Layers,
  Cpu,
  Workflow,
  BarChart3,
  Sparkles,
  Check,
  ArrowRight,
} from 'lucide-react';
import {
  Button,
  Card,
  Chip,
  ProgressBar,
  ProgressRing,
  EmptyState,
  Badge,
  Illustration,
  getStageTheme,
  getStageNumber,
} from '../components/ui/index.js';
import { INITIAL_FLASHCARDS, getDueCards } from '../engine/spacedRepetition.js';

export const LESSON_STEP_LABELS = [
  'Contexto',
  'Simulador',
  'Antipatrón vs. solución',
  'Los tres roles',
  'Comprueba lo aprendido',
  'Práctica',
  'Resumen',
];

const STAGE_ICON_MAP = {
  Database,
  Layers,
  Cpu,
  Workflow,
  BarChart3,
  Sparkles,
};

function parseLessonMinutes(durationStr) {
  if (!durationStr || typeof durationStr !== 'string') return 30;
  const match = durationStr.match(/(\d+)/);
  return match ? Number(match[1]) : 30;
}

function readNormalizedLessonSteps(lessonStepsProp) {
  let stored = {};
  try {
    const raw =
      typeof window !== 'undefined'
        ? window.localStorage.getItem('manual_datos_lesson_step')
        : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        stored = parsed;
      }
    }
  } catch {
    stored = {};
  }

  const combined = { ...stored, ...(lessonStepsProp || {}) };
  const stepsMap = {};
  const orderedIds = [];

  Object.entries(combined).forEach(([key, val]) => {
    if (key === 'lastLessonId' || key === 'activeLessonId') return;
    const numericStep =
      typeof val === 'number'
        ? val
        : val && typeof val === 'object' && typeof val.step === 'number'
          ? val.step
          : Number(val);
    if (Number.isFinite(numericStep)) {
      stepsMap[key] = Math.max(0, Math.floor(numericStep));
      orderedIds.push(key);
    }
  });

  return { stepsMap, orderedIds };
}

function resolveCardLessonId(card, lessons) {
  if (card?.lessonId) return card.lessonId;
  if (!card?.stageId || !Array.isArray(lessons) || lessons.length === 0) {
    return undefined;
  }
  const stageLessons = lessons.filter((l) => l.stageId === card.stageId);
  if (stageLessons.length === 0) return undefined;

  const stageCards = INITIAL_FLASHCARDS.filter((c) => c.stageId === card.stageId);
  const idxInStage = Math.max(
    0,
    stageCards.findIndex((c) => c.id === card.id)
  );
  const mappedIndex = Math.min(idxInStage, stageLessons.length - 1);
  return stageLessons[mappedIndex]?.id;
}

export function HomeView({
  stages = [],
  lessons = [],
  activeLessonId,
  nextRecommendedLesson,
  lessonSteps = {},
  completedIds = [],
  quizAnswers = {},
  diagnosticResult = null,
  leitnerState = {},
  onOpenLesson = () => {},
  onNavigate = () => {},
  onOpenDiagnostic = () => {},
}) {
  const completedSet = useMemo(() => new Set(completedIds), [completedIds]);

  const { stepsMap, orderedIds } = useMemo(
    () => readNormalizedLessonSteps(lessonSteps),
    [lessonSteps]
  );

  const hasStartedAnyLesson = completedIds.length > 0 || orderedIds.length > 0;

  const continueLesson = useMemo(() => {
    const recentFirst = [...orderedIds].reverse();

    const inProgressId = recentFirst.find(
      (id) => !completedSet.has(id) && (stepsMap[id] ?? 0) > 0
    );
    if (inProgressId) {
      const found = lessons.find((l) => l.id === inProgressId);
      if (found) return found;
    }

    const recentVisitedId = recentFirst.find((id) => !completedSet.has(id));
    if (recentVisitedId) {
      const found = lessons.find((l) => l.id === recentVisitedId);
      if (found) return found;
    }

    if (activeLessonId && !completedSet.has(activeLessonId) && orderedIds.length > 0) {
      const active = lessons.find((l) => l.id === activeLessonId);
      if (active) return active;
    }

    if (diagnosticResult?.recommendedLessonId) {
      const diagLesson = lessons.find(
        (l) => l.id === diagnosticResult.recommendedLessonId && !completedSet.has(l.id)
      );
      if (diagLesson) return diagLesson;
    }

    return (
      nextRecommendedLesson ||
      lessons.find((l) => !completedSet.has(l.id)) ||
      lessons[0]
    );
  }, [
    orderedIds,
    stepsMap,
    completedSet,
    activeLessonId,
    diagnosticResult,
    nextRecommendedLesson,
    lessons,
  ]);

  const continueStage = useMemo(
    () => stages.find((s) => s.id === continueLesson?.stageId) || stages[0],
    [stages, continueLesson]
  );

  const currentStageNum = getStageNumber(
    continueStage?.number || continueLesson?.stageId || 1
  );

  const totalSteps = LESSON_STEP_LABELS.length;
  const savedStepIndex = Math.min(
    totalSteps - 1,
    Math.max(0, Number(stepsMap?.[continueLesson?.id] ?? 0))
  );
  const stepLabel = LESSON_STEP_LABELS[savedStepIndex] || LESSON_STEP_LABELS[0];
  const continueStepPct = completedSet.has(continueLesson?.id)
    ? 100
    : hasStartedAnyLesson && stepsMap?.[continueLesson?.id] !== undefined
      ? Math.round(((savedStepIndex + 1) / totalSteps) * 100)
      : Math.round((1 / totalSteps) * 100);

  const timeStats = useMemo(() => {
    let totalMinutes = 0;
    let remainingMinutes = 0;
    lessons.forEach((l) => {
      const mins = parseLessonMinutes(l.duration);
      totalMinutes += mins;
      if (!completedSet.has(l.id)) {
        remainingMinutes += mins;
      }
    });
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const remainingHours = Math.round((remainingMinutes / 60) * 10) / 10;
    return { totalHours, remainingHours };
  }, [lessons, completedSet]);

  const quizStats = useMemo(() => {
    let answeredCount = 0;
    let correctCount = 0;

    lessons.forEach((lesson) => {
      const ans = quizAnswers?.[lesson.id];
      if (ans === undefined || ans === null || ans === '') return;
      answeredCount += 1;
      const opt = lesson.checkpoint?.options?.find((o) => o.id === ans);
      if (opt?.correct === true || ans === true || ans === 'correct') {
        correctCount += 1;
      }
    });

    const accuracyPct =
      answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

    return { answeredCount, correctCount, accuracyPct };
  }, [lessons, quizAnswers]);

  const dueCards = useMemo(() => {
    const allDue = getDueCards(leitnerState, 'ALL');
    return allDue.filter((card) => {
      const cardWithLesson = {
        ...card,
        lessonId: card.lessonId || resolveCardLessonId(card, lessons),
      };
      return (
        completedIds.includes(cardWithLesson.lessonId) ||
        lessonSteps[cardWithLesson.lessonId] !== undefined ||
        stepsMap[cardWithLesson.lessonId] !== undefined
      );
    });
  }, [leitnerState, lessons, completedIds, lessonSteps, stepsMap]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('manual_datos_due_count', { detail: dueCards.length })
      );
    }
  }, [dueCards.length]);

  const dueByRole = useMemo(() => {
    const counts = { DE: 0, DA: 0, BI: 0 };
    dueCards.forEach((c) => {
      if (counts[c.discipline] !== undefined) {
        counts[c.discipline] += 1;
      }
    });
    return counts;
  }, [dueCards]);

  const globalPct =
    lessons.length > 0 ? Math.round((completedIds.length / lessons.length) * 100) : 0;

  const statusPhrase = hasStartedAnyLesson
    ? `Etapa ${currentStageNum} de 6 · ${completedIds.length} de ${lessons.length} lecciones terminadas`
    : `${lessons.length} lecciones en 6 etapas · empieza por la primera`;

  const handleStageClick = (stage) => {
    onNavigate('roadmap', stage.id);
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        const directEl =
          document.getElementById(stage.id) ||
          document.querySelector(
            `[data-stage-id="${stage.id}"], [aria-label*="Etapa ${stage.number}"]`
          );
        if (directEl && typeof directEl.scrollIntoView === 'function') {
          directEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 60);
    }
  };

  return (
    <div className="home-view">
      {/* 1. CABECERA: dónde estás, sin saludo ni decoración */}
      <section className="home-hero" aria-label="Estado actual">
        <h1 className="home-hero__title">Hoy</h1>
        <p className="home-hero__status tabular">{statusPhrase}</p>
      </section>

      {/* 2. TARJETA CONTINUAR CON DATA-STAGE DE LA LECCIÓN */}
      {continueLesson && (
        <Card
          stage={currentStageNum}
          accentTop
          className="home-continue-card"
        >
          <div className="home-continue-card__top">
            <div className="home-continue-card__chips">
              <Chip variant="stage">
                {!hasStartedAnyLesson
                  ? 'Empieza por aquí'
                  : completedSet.has(continueLesson.id)
                    ? 'Repasar lección'
                    : 'Continúa donde lo dejaste'}
              </Chip>
              <Chip variant="neutral">
                Etapa {currentStageNum} · {getStageTheme(currentStageNum).shortName}
              </Chip>
              {!hasStartedAnyLesson && diagnosticResult && (
                <Chip variant="primary">Recomendada por diagnóstico</Chip>
              )}
            </div>
          </div>

          <div className="home-continue-card__main">
            <div className="home-continue-card__number tabular">
              {String(continueLesson.order).padStart(2, '0')}
            </div>

            <div className="home-continue-card__copy">
              <h2 className="home-continue-card__title">
                {continueLesson.title}
              </h2>
              <p className="home-continue-card__desc">
                {continueLesson.subtitle}
              </p>
            </div>
          </div>

          <div className="home-continue-card__progress">
            <div className="home-continue-card__step-row tabular">
              <span>
                Paso {savedStepIndex + 1} de {totalSteps} · {stepLabel}
              </span>
              <span>{continueStepPct}%</span>
            </div>
            <ProgressBar
              value={continueStepPct}
              tone="stage"
              stage={currentStageNum}
              ariaLabel={`Progreso en la lección ${continueLesson.title}: ${continueStepPct}%`}
            />
          </div>

          <div className="home-continue-card__footer">
            <div className="home-continue-card__roles">
              {(continueLesson.coreFocus || ['DE', 'DA', 'BI']).map((role) => (
                <Chip key={role} role={role}>
                  {role}
                </Chip>
              ))}
              <Chip variant="neutral">{continueLesson.duration}</Chip>
            </div>

            <div className="home-continue-card__actions">
              <Button
                variant="secondary"
                size="md"
                onClick={() => onNavigate('roadmap')}
              >
                Ver ruta
              </Button>
              <Button
                variant="primary"
                size="lg"
                iconRight={ArrowRight}
                onClick={() => onOpenLesson(continueLesson.id, savedStepIndex)}
              >
                Continuar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 3. MÉTRICAS (3 TARJETAS) */}
      <section aria-label="Métricas reales de progreso" className="home-metrics-grid">
        <Card className="home-metric-card">
          <div className="home-metric-card__head">
            <span className="home-metric-card__icon home-metric-card__icon--primary" aria-hidden="true">
              <BookOpen size={20} />
            </span>
            <span className="home-metric-card__label">Lecciones completadas</span>
          </div>

          {completedIds.length > 0 ? (
            <div className="home-metric-card__value tabular">
              {completedIds.length}/{lessons.length}
            </div>
          ) : (
            <p className="home-metric-card__motivate">
              Ninguna todavía
            </p>
          )}

          <ProgressBar
            size="sm"
            value={globalPct}
            tone={globalPct === 100 ? 'success' : 'primary'}
            ariaLabel={`Lecciones completadas: ${completedIds.length} de ${lessons.length}`}
          />

          <span className="home-metric-card__meta tabular">
            {completedIds.length > 0
              ? `${globalPct}% del programa · ${timeStats.remainingHours} h restantes`
              : `${lessons.length} lecciones · ${timeStats.totalHours} h estimadas`}
          </span>
        </Card>

        <Card className="home-metric-card">
          <div className="home-metric-card__head">
            <span className="home-metric-card__icon home-metric-card__icon--success" aria-hidden="true">
              <CheckCircle2 size={20} />
            </span>
            <span className="home-metric-card__label">Quizzes acertados</span>
          </div>

          {quizStats.answeredCount > 0 && quizStats.accuracyPct > 0 ? (
            <div className="home-metric-card__value tabular">
              {quizStats.accuracyPct}%
            </div>
          ) : (
            <p className="home-metric-card__motivate">
              Ninguno todavía
            </p>
          )}

          <ProgressBar
            size="sm"
            value={quizStats.accuracyPct}
            tone={quizStats.accuracyPct >= 75 ? 'success' : 'primary'}
            ariaLabel={`Porcentaje de quizzes acertados: ${quizStats.accuracyPct}%`}
          />

          <span className="home-metric-card__meta tabular">
            {quizStats.answeredCount > 0
              ? `${quizStats.correctCount} de ${quizStats.answeredCount} comprobaciones correctas`
              : 'Hay una pregunta al final de cada lección'}
          </span>
        </Card>

        <Card className="home-metric-card">
          <div className="home-metric-card__head">
            <span className="home-metric-card__icon home-metric-card__icon--warning" aria-hidden="true">
              <Repeat size={20} />
            </span>
            <span className="home-metric-card__label">Repaso espaciado</span>
          </div>

          {dueCards.length > 0 ? (
            <div className="home-metric-card__value home-metric-card__value--warning tabular">
              {dueCards.length}
            </div>
          ) : (
            <p className="home-metric-card__motivate">
              {hasStartedAnyLesson
                ? 'Mazo de memoria espaciada al día'
                : 'Aparecen al empezar tu primera lección'}
            </p>
          )}

          <ProgressBar
            size="sm"
            value={
              dueCards.length > 0
                ? Math.min(100, Math.round((dueCards.length / 18) * 100))
                : hasStartedAnyLesson
                  ? 100
                  : 0
            }
            tone={dueCards.length > 0 ? 'warning' : 'success'}
            ariaLabel={`Tarjetas de repaso para hoy: ${dueCards.length}`}
          />

          <span className="home-metric-card__meta tabular">
            {dueCards.length > 0
              ? `DE ${dueByRole.DE} · DA ${dueByRole.DA} · BI ${dueByRole.BI} listas hoy`
              : 'Sistema Leitner de 5 cajas'}
          </span>
        </Card>
      </section>

      {/* 4. MAPA DE ETAPAS (CAMINO VISUAL) */}
      <section aria-label="Mapa de las 6 etapas" className="home-section">
        <div className="home-section__header">
          <div>
            <h2 className="home-section__title">Mapa de etapas</h2>
            <p className="home-section__subtitle">
              Pulsa una etapa para ver sus lecciones.
            </p>
          </div>
          <Button
            variant="ghost"
            size="md"
            onClick={() => onNavigate('roadmap')}
          >
            Ver ruta completa →
          </Button>
        </div>

        <div className="home-stage-map">
          {stages.map((stage) => {
            const theme = getStageTheme(stage.number);
            const StageIcon = STAGE_ICON_MAP[theme.iconName] || Database;
            const stageLessons = lessons.filter((l) => l.stageId === stage.id);
            const doneCount = stageLessons.filter((l) => completedSet.has(l.id)).length;
            const hasStepInStage = stageLessons.some(
              (l) => stepsMap?.[l.id] !== undefined
            );
            const rawPct =
              stageLessons.length > 0
                ? Math.round((doneCount / stageLessons.length) * 100)
                : 0;
            const isCompleted =
              stageLessons.length > 0 && doneCount === stageLessons.length;
            const isCurrent = !isCompleted && stage.number === currentStageNum;
            const isInProgress = !isCompleted && (doneCount > 0 || hasStepInStage);
            const stagePct = isCompleted
              ? 100
              : isInProgress && rawPct === 0
                ? 15
                : rawPct;

            return (
              <button
                key={stage.id}
                type="button"
                data-stage={stage.number}
                className={`home-stage-node ${isCurrent ? 'is-current' : ''} ${
                  isCompleted ? 'is-completed' : ''
                }`.trim()}
                onClick={() => handleStageClick(stage)}
                aria-label={`Etapa ${stage.number}: ${theme.shortName} (${
                  isCompleted
                    ? 'Completada'
                    : isCurrent
                      ? 'Etapa actual'
                      : `${doneCount} de ${stageLessons.length} lecciones`
                })`}
              >
                <div
                  className={`home-stage-node__ring-wrap ${
                    isCurrent ? 'anim-pulse-ring' : ''
                  }`.trim()}
                >
                  <ProgressRing
                    size={56}
                    value={stagePct}
                    tone={isCompleted ? 'success' : 'stage'}
                    stage={stage.number}
                    ariaLabel={`Progreso etapa ${stage.number}: ${stagePct}%`}
                  >
                    <span className="home-stage-node__icon" aria-hidden="true">
                      {isCompleted ? <Check size={20} /> : <StageIcon size={20} />}
                    </span>
                  </ProgressRing>
                </div>

                <div className="home-stage-node__info">
                  <span className="home-stage-node__eyebrow tabular">
                    Etapa 0{stage.number}
                  </span>
                  <span className="home-stage-node__name">{theme.shortName}</span>
                  <span className="home-stage-node__status tabular">
                    {isCompleted ? (
                      <span className="home-stage-node__completed-pill">
                        <Check size={12} aria-hidden="true" />
                        <span>Insignia</span>
                      </span>
                    ) : (
                      `${doneCount}/${stageLessons.length} lecciones`
                    )}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. REPASO DE HOY Y 6. DIAGNÓSTICO */}
      <section aria-label="Repaso de hoy y diagnóstico" className="home-actions-grid">
        <div className="home-review-block">
          <div className="home-section__header">
            <div>
              <h2 className="home-section__title">Repaso de hoy</h2>
              <p className="home-section__subtitle">
                Tarjetas de tus lecciones iniciadas o completadas.
              </p>
            </div>
          </div>

          {dueCards.length > 0 ? (
            <Card className="home-review-card">
              <div className="home-review-card__top">
                <Chip variant="warning">{dueCards.length} tarjetas listas hoy</Chip>
                <span className="home-review-card__roles tabular">
                  DE {dueByRole.DE} · DA {dueByRole.DA} · BI {dueByRole.BI}
                </span>
              </div>
              <h3 className="home-review-card__title">
                Consolida conceptos clave en memoria a largo plazo
              </h3>
              <p className="home-review-card__desc">
                Tienes {dueCards.length} tarjetas correspondientes a las lecciones que ya empezaste o completaste.
              </p>
              <div className="home-review-card__actions">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => onNavigate('practice')}
                >
                  Empezar repaso ({dueCards.length})
                </Button>
              </div>
            </Card>
          ) : (
            <EmptyState
              illustration={<Illustration name="empty-reviews" size="sm" />}
              title="0 tarjetas pendientes de repaso"
              description={
                hasStartedAnyLesson
                  ? 'Estás al día con las tarjetas de las lecciones que has estudiado.'
                  : 'Las tarjetas de repaso se desbloquean a medida que empiezas o completas cada lección.'
              }
              action={
                hasStartedAnyLesson
                  ? {
                      label: 'Abrir mazo de repaso',
                      variant: 'secondary',
                      onClick: () => onNavigate('practice'),
                    }
                  : {
                      label: 'Empezar lección 01',
                      variant: 'secondary',
                      onClick: () =>
                        continueLesson && onOpenLesson(continueLesson.id, 0),
                    }
              }
            />
          )}
        </div>

        {!diagnosticResult && (
          <div className="home-diagnostic-block">
            <div className="home-section__header">
              <div>
                <h2 className="home-section__title">Diagnóstico inicial</h2>
                <p className="home-section__subtitle">
                  Opcional · 6 preguntas prácticas en 3 minutos.
                </p>
              </div>
            </div>

            <Card className="home-diagnostic-card">
              <div className="home-diagnostic-card__illus">
                <Illustration name="diagnostic" size="sm" />
              </div>
              <div className="home-diagnostic-card__body">
                <div className="home-diagnostic-card__chips">
                  <Chip variant="primary">Diagnóstico de nivel</Chip>
                </div>
                <h3 className="home-diagnostic-card__title">
                  Encuentra tu punto de partida
                </h3>
                <p className="home-diagnostic-card__desc">
                  6 preguntas sobre SQL, modelado, motores columnares y experimentos. Te sugiere por qué etapa empezar.
                </p>
                <div className="home-diagnostic-card__actions">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={onOpenDiagnostic}
                  >
                    Hacer diagnóstico
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </section>

      {/* 7. INSIGNIAS DE ETAPA */}
      <section aria-label="Insignias de etapa" className="home-section">
        <div className="home-section__header">
          <div>
            <h2 className="home-section__title">Insignias de etapa</h2>
            <p className="home-section__subtitle">
              Se marca una etapa al terminar sus 3 lecciones.
            </p>
          </div>
        </div>

        <div className="home-badges-grid">
          {stages.map((stage) => {
            const theme = getStageTheme(stage.number);
            const stageLessons = lessons.filter((l) => l.stageId === stage.id);
            const doneCount = stageLessons.filter((l) =>
              completedSet.has(l.id)
            ).length;
            const isStageCompleted =
              stageLessons.length > 0 && doneCount === stageLessons.length;

            return (
              <Badge
                key={stage.id}
                stage={stage.number}
                unlocked={isStageCompleted}
                title={theme.shortName}
                subtitle={
                  isStageCompleted
                    ? `${stageLessons.length}/${stageLessons.length} lecciones completadas`
                    : `${doneCount} de ${stageLessons.length} lecciones`
                }
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default HomeView;
