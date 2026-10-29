import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  Chip,
  Illustration,
  ProgressBar,
  ProgressRing,
  getStageTheme,
} from '../components/ui/index.js';

const TOTAL_LESSON_STEPS = 5;

const STAGE_SHORT_DESCRIPTIONS = {
  'stage-1':
    'Definición del grano de una tabla, control de cardinalidad en JOINs, funciones de ventana con QUALIFY y ASOF JOIN.',
  'stage-2':
    'Compensaciones entre esquema en estrella y tablas OBT, historial con SCD tipo 2 y descomposición de indicadores.',
  'stage-3':
    'Estructura interna de Parquet, memoria compartida con Apache Arrow, formatos Lance y ejecución vectorizada con DuckDB y Polars.',
  'stage-4':
    'Tablas transaccionales con Apache Iceberg, orquestación SQL en dbt y SQLMesh, contratos de datos y métricas centralizadas.',
  'stage-5':
    'Análisis de retención por cohortes, diseño de experimentos A/B con reducción CUPED, percepción visual y reportes como código.',
  'stage-6':
    'Replicación basada en registros con Debezium y Kafka, procesamiento con watermarks en Apache Flink y acceso mediante servidores MCP.',
};

const LESSON_PROTAGONIST_ROLES_BY_ORDER = {
  1: ['DA', 'BI'],
  2: ['DA', 'DE'],
  3: ['DE', 'DA'],
  4: ['DE', 'BI'],
  5: ['DE', 'BI'],
  6: ['BI', 'DA'],
  7: ['DE', 'DA'],
  8: ['DE', 'DA'],
  9: ['DA', 'DE'],
  10: ['DE', 'BI'],
  11: ['DE', 'DA'],
  12: ['BI', 'DE'],
  13: ['DA', 'BI'],
  14: ['DA', 'BI'],
  15: ['BI', 'DA'],
  16: ['DE', 'DA'],
  17: ['DE', 'BI'],
  18: ['BI', 'DE'],
};

const STAGE_DEFAULT_ROLES = {
  1: ['DA', 'DE'],
  2: ['DE', 'BI'],
  3: ['DE', 'DA'],
  4: ['DE', 'BI'],
  5: ['DA', 'BI'],
  6: ['DE', 'BI'],
};

const PRESERVED_TERMS = new Set([
  'SQL',
  'OBT',
  'SCD',
  'BI',
  'DE',
  'DA',
  'MCP',
  'RAG',
  'CDC',
  'LTV',
  'SRM',
  'CUPED',
  'CTEs',
  'JOINs',
  'ASOF',
  'JOIN',
  'QUALIFY',
  'SIMD',
  'ODCS',
  'A/B',
  'DuckDB',
  'SQLMesh',
  'MetricFlow',
  'Parquet',
  'Arrow',
  'Lance',
  'Vortex',
  'Polars',
  'Marimo',
  'Iceberg',
  'Cube',
  'Tufte',
  'Cleveland',
  'Debezium',
  'Kafka',
  'Flink',
  'Git',
  'RAM',
  'dbt',
]);

function parseLessonMinutes(durationStr) {
  if (!durationStr || typeof durationStr !== 'string') return 30;
  const match = durationStr.match(/(\d+)/);
  return match ? Number(match[1]) : 30;
}

function limitWords(text, maxWords) {
  if (!text || typeof text !== 'string') return '';
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();
  return `${words.slice(0, maxWords).join(' ').replace(/[.,;:]+$/, '')}.`;
}

function toSentenceCase(title) {
  if (!title || typeof title !== 'string') return '';
  const trimmed = title.trim();
  if (!trimmed) return '';
  const words = trimmed.split(/\s+/);
  return words
    .map((word, index) => {
      const clean = word.replace(/[.,;:()]/g, '');
      if (PRESERVED_TERMS.has(clean)) {
        return word;
      }
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word.toLowerCase();
    })
    .join(' ');
}

function getStageDescription(stage) {
  const custom = STAGE_SHORT_DESCRIPTIONS[stage?.id];
  if (custom) return limitWords(custom, 20);
  return limitWords(stage?.description || stage?.subtitle || '', 20);
}

function getProtagonistRoles(lesson, stageNumber) {
  const byOrder = LESSON_PROTAGONIST_ROLES_BY_ORDER[Number(lesson?.order)];
  if (Array.isArray(byOrder) && byOrder.length > 0) {
    return byOrder.slice(0, 2);
  }
  const byStage = STAGE_DEFAULT_ROLES[Number(stageNumber)];
  if (Array.isArray(byStage) && byStage.length > 0) {
    return byStage.slice(0, 2);
  }
  if (Array.isArray(lesson?.coreFocus) && lesson.coreFocus.length > 0) {
    return lesson.coreFocus.slice(0, 2);
  }
  return ['DE', 'DA'];
}

export function RoadmapView({
  stages = [],
  lessons = [],
  completedIds = [],
  lessonSteps = {},
  diagnosticResult = null,
  nextRecommendedLesson,
  onOpenLesson = () => {},
  onOpenDiagnostic = () => {},
}) {
  const completedSet = useMemo(() => new Set(completedIds), [completedIds]);

  const [activeStageId, setActiveStageId] = useState(
    () => stages[0]?.id || 'stage-1'
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return undefined;
    }

    const sectionElements = stages
      .map((stage) => document.getElementById(`stage-section-${stage.id}`))
      .filter(Boolean);

    if (sectionElements.length === 0) return undefined;

    const visibleRatios = new Map();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute('data-stage-id');
          if (!id) return;
          if (entry.isIntersecting) {
            visibleRatios.set(id, entry.intersectionRatio);
          } else {
            visibleRatios.delete(id);
          }
        });

        if (visibleRatios.size > 0) {
          let bestId = null;
          let bestRatio = -1;
          visibleRatios.forEach((ratio, id) => {
            if (ratio > bestRatio) {
              bestRatio = ratio;
              bestId = id;
            }
          });
          if (bestId) {
            setActiveStageId(bestId);
          }
        }
      },
      {
        root: null,
        rootMargin: '-120px 0px -55% 0px',
        threshold: [0, 0.15, 0.35, 0.6],
      }
    );

    sectionElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [stages]);

  const stats = useMemo(() => {
    const totalLessons = lessons.length || 18;
    let completedCount = 0;
    let remainingMinutes = 0;

    lessons.forEach((lesson) => {
      const mins = parseLessonMinutes(lesson.duration);
      if (completedSet.has(lesson.id)) {
        completedCount += 1;
      } else {
        remainingMinutes += mins;
      }
    });

    const remainingHours = Math.floor(remainingMinutes / 60);
    const remainingMins = remainingMinutes % 60;
    const pct =
      totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    return {
      completedCount,
      totalLessons,
      remainingHours,
      remainingMins,
      pct,
    };
  }, [lessons, completedSet]);

  const stageSummaries = useMemo(
    () =>
      stages.map((stage) => {
        const stageLessons = lessons.filter((l) => l.stageId === stage.id);
        const doneCount = stageLessons.filter((l) => completedSet.has(l.id)).length;
        const totalCount = stageLessons.length || 3;
        const isStageDone = totalCount > 0 && doneCount === totalCount;
        const isStagePartial = doneCount > 0 && !isStageDone;
        const theme = getStageTheme(stage.number);
        return {
          ...stage,
          shortName: theme.shortName,
          doneCount,
          totalCount,
          isStageDone,
          isStagePartial,
        };
      }),
    [stages, lessons, completedSet]
  );

  const handleScrollToStage = (stageId) => {
    setActiveStageId(stageId);
    if (typeof document === 'undefined') return;
    const target = document.getElementById(`stage-section-${stageId}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="roadmap-view">
      <header className="roadmap-header">
        <div className="roadmap-header__top">
          <div className="roadmap-header__title-group">
            <h1 className="roadmap-header__title">Tu ruta</h1>
            <p className="roadmap-header__subtitle">
              6 etapas progresivas desde SQL analítico hasta flujos en tiempo real y agentes MCP.
            </p>
          </div>

          <div className="roadmap-header__actions">
            <Button variant="secondary" size="md" onClick={onOpenDiagnostic}>
              {diagnosticResult
                ? `Diagnóstico: ${diagnosticResult.profileLabel || 'Recalibrar'}`
                : 'Test de nivel inicial'}
            </Button>
          </div>
        </div>

        <Card className="roadmap-summary-bar">
          <div className="roadmap-summary-stats tabular">
            <span className="roadmap-summary-stats__text tabular">
              {stats.completedCount} de {stats.totalLessons} lecciones ·{' '}
              {stats.remainingHours} h {stats.remainingMins} min restantes
            </span>
            <span className="roadmap-summary-stats__pct tabular">
              {stats.pct}% completado
            </span>
          </div>

          <div className="roadmap-progress-global">
            <div className="roadmap-progress-global__bar-wrap">
              <ProgressBar
                size="lg"
                value={stats.pct}
                tone={stats.pct === 100 ? 'success' : 'primary'}
                ariaLabel={`Progreso de la ruta: ${stats.completedCount} de ${stats.totalLessons} lecciones (${stats.pct}%)`}
              />
              <div className="roadmap-progress-global__ticks" aria-hidden="true">
                {stageSummaries.map((stage) => (
                  <span
                    key={stage.id}
                    className="roadmap-progress-global__tick"
                    data-stage={stage.number}
                  />
                ))}
              </div>
            </div>

            <div
              className="roadmap-progress-markers"
              aria-label="Marcadores de las 6 etapas"
            >
              {stageSummaries.map((stage) => (
                <div
                  key={stage.id}
                  data-stage={stage.number}
                  className={[
                    'roadmap-progress-marker',
                    stage.isStageDone ? 'is-done' : '',
                    stage.isStagePartial ? 'is-partial' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <span className="roadmap-progress-marker__dot" aria-hidden="true" />
                  <span className="roadmap-progress-marker__code tabular">
                    E{stage.number}
                  </span>
                  <span className="roadmap-progress-marker__name">
                    {stage.shortName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </header>

      <nav
        className="roadmap-stage-nav"
        aria-label="Navegación rápida por etapas"
      >
        <div className="roadmap-stage-nav__scroll">
          {stageSummaries.map((stage) => {
            const isActive = activeStageId === stage.id;
            return (
              <button
                key={stage.id}
                type="button"
                data-stage={stage.number}
                className={[
                  'roadmap-stage-nav__pill',
                  isActive ? 'is-active' : '',
                  stage.isStageDone ? 'is-completed' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handleScrollToStage(stage.id)}
                aria-current={isActive ? 'true' : undefined}
              >
                <span className="roadmap-stage-nav__num tabular">
                  0{stage.number}
                </span>
                <span className="roadmap-stage-nav__label">{stage.shortName}</span>
                <span className="roadmap-stage-nav__count tabular">
                  {stage.doneCount}/{stage.totalCount}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="roadmap-stages-list">
        {stages.map((stage) => {
          const stageLessons = lessons.filter((l) => l.stageId === stage.id);
          const doneInStage = stageLessons.filter((l) =>
            completedSet.has(l.id)
          ).length;
          const totalInStage = stageLessons.length || 3;
          const isStageDone = totalInStage > 0 && doneInStage === totalInStage;
          const stagePct =
            totalInStage > 0
              ? Math.round((doneInStage / totalInStage) * 100)
              : 0;
          const stageTitle = toSentenceCase(stage.title);
          const stageDescription = getStageDescription(stage);

          return (
            <section
              key={stage.id}
              id={`stage-section-${stage.id}`}
              data-stage={stage.number}
              data-stage-id={stage.id}
              className="roadmap-stage-block"
              aria-label={`Etapa ${stage.number}: ${stageTitle}`}
            >
              <div className="roadmap-stage-header" data-stage={stage.number}>
                <div className="roadmap-stage-header__main">
                  <div className="roadmap-stage-header__illus">
                    <Illustration
                      name={`stage-${stage.number}`}
                      stage={stage.number}
                      size="md"
                    />
                  </div>

                  <div className="roadmap-stage-header__copy">
                    <div className="roadmap-stage-header__eyebrow tabular">
                      Etapa {stage.number}
                    </div>
                    <h2 className="roadmap-stage-header__title">{stageTitle}</h2>
                    <p className="roadmap-stage-header__desc">
                      {stageDescription}
                    </p>
                  </div>
                </div>

                <div className="roadmap-stage-header__aside">
                  <div className="roadmap-stage-header__ring">
                    <ProgressRing
                      size={64}
                      value={stagePct}
                      stage={stage.number}
                      tone={isStageDone ? 'success' : 'stage'}
                      celebrate={isStageDone}
                      label={`${doneInStage}/${totalInStage}`}
                      ariaLabel={`Progreso Etapa ${stage.number}: ${doneInStage} de ${totalInStage}`}
                    />
                  </div>
                  <Badge
                    stage={stage.number}
                    unlocked={isStageDone}
                    className="roadmap-stage-header__badge"
                  />
                </div>
              </div>

              <div className="roadmap-lessons-grid">
                {stageLessons.map((lesson) => {
                  const isDone = completedSet.has(lesson.id);
                  const savedStep = Number(lessonSteps?.[lesson.id] ?? 0);
                  const isInProgress = !isDone && savedStep > 0;
                  const stepPct = isInProgress
                    ? savedStep > TOTAL_LESSON_STEPS
                      ? Math.min(99, Math.round(savedStep))
                      : Math.round(
                          ((Math.min(savedStep, TOTAL_LESSON_STEPS - 1) + 1) /
                            TOTAL_LESSON_STEPS) *
                            100
                        )
                    : 0;

                  const statusLabel = isDone
                    ? 'Completada'
                    : isInProgress
                      ? `En curso ${stepPct}%`
                      : 'Pendiente';

                  const isRecommended =
                    !isDone &&
                    Boolean(nextRecommendedLesson) &&
                    lesson.id === nextRecommendedLesson.id;

                  const formattedOrder = String(lesson.order).padStart(2, '0');
                  const fullTitle = toSentenceCase(lesson.title);
                  const fullSubtitle = lesson.subtitle;
                  const protagonistRoles = getProtagonistRoles(
                    lesson,
                    stage.number
                  );

                  const cardClasses = [
                    'roadmap-lesson-card',
                    isDone ? 'is-completed' : '',
                    isInProgress ? 'is-in-progress' : '',
                    isRecommended ? 'is-recommended' : '',
                  ]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <Card
                      key={lesson.id}
                      interactive
                      stage={stage.number}
                      className={cardClasses}
                      onClick={() => onOpenLesson(lesson.id)}
                      ariaLabel={`Lección ${formattedOrder}: ${fullTitle} (${statusLabel})`}
                    >
                      <div className="roadmap-lesson-card__layout">
                        <div className="roadmap-lesson-card__body">
                          <div className="roadmap-lesson-card__top">
                            <span className="roadmap-lesson-card__num tabular">
                              {formattedOrder}
                            </span>
                            {isRecommended && (
                              <Chip variant="primary">Recomendada</Chip>
                            )}
                          </div>

                          <h3 className="roadmap-lesson-card__title">
                            {fullTitle}
                          </h3>
                          <p className="roadmap-lesson-card__sub">
                            {fullSubtitle}
                          </p>
                        </div>

                        <div className="roadmap-lesson-card__footer tabular">
                          <div className="roadmap-lesson-card__meta">
                            <span className="roadmap-lesson-card__duration tabular">
                              <Clock size={14} aria-hidden="true" />
                              <span>{lesson.duration}</span>
                            </span>

                            <div
                              className="roadmap-lesson-card__roles"
                              aria-label="Roles protagonistas"
                            >
                              {protagonistRoles.map((roleKey) => (
                                <Chip
                                  key={roleKey}
                                  variant="role"
                                  role={roleKey}
                                >
                                  {roleKey}
                                </Chip>
                              ))}
                            </div>
                          </div>

                          <div
                            className={[
                              'roadmap-lesson-card__status',
                              isDone ? 'is-done' : '',
                              isInProgress ? 'is-progress' : 'is-pending',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                          >
                            {isDone && (
                              <>
                                <CheckCircle2 size={16} aria-hidden="true" />
                                <span>Completada</span>
                              </>
                            )}
                            {isInProgress && (
                              <>
                                <ProgressRing
                                  size={24}
                                  value={stepPct}
                                  stage={stage.number}
                                  tone="stage"
                                  ariaLabel={`En curso ${stepPct}%`}
                                />
                                <span>En curso {stepPct}%</span>
                              </>
                            )}
                            {!isDone && !isInProgress && (
                              <>
                                <Circle size={14} aria-hidden="true" />
                                <span>Pendiente</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default RoadmapView;
