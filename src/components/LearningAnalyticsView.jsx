import React, { useMemo } from 'react';
import { LEARNING_STAGES, LESSONS, ROLE_META } from '../data/learningPath2026.js';
import { getAdaptiveRecommendations } from '../engine/adaptiveEngine.js';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Illustration,
  ProgressRing,
  getStageNumber,
} from './ui/index.js';

function evaluateQuizEntry(lesson, rawEntry) {
  if (rawEntry === undefined || rawEntry === null || rawEntry === '') {
    return { attempted: false, correct: false };
  }
  if (typeof rawEntry === 'boolean') {
    return { attempted: true, correct: rawEntry };
  }
  if (typeof rawEntry === 'string') {
    const options = lesson?.checkpoint?.options;
    if (Array.isArray(options)) {
      const matched = options.find((o) => o.id === rawEntry);
      if (matched) {
        return { attempted: true, correct: Boolean(matched.correct) };
      }
    }
    return { attempted: true, correct: rawEntry === 'true' || rawEntry === 'correct' };
  }
  if (typeof rawEntry === 'object') {
    if (typeof rawEntry.correct === 'boolean') {
      return { attempted: true, correct: rawEntry.correct };
    }
    if (typeof rawEntry.isCorrect === 'boolean') {
      return { attempted: true, correct: rawEntry.isCorrect };
    }
    if (typeof rawEntry.optionId === 'string') {
      return evaluateQuizEntry(lesson, rawEntry.optionId);
    }
  }
  return { attempted: false, correct: false };
}

export function LearningAnalyticsView({
  lessons = LESSONS,
  completedIds = [],
  quizScores = {},
  quizAnswers,
  codeSolvedIds = [],
  completedLabIds,
  diagnosticResult = null,
  onOpenLesson = () => {},
  onOpenDiagnostic = () => {},
}) {
  const allLessons =
    Array.isArray(lessons) && lessons.length > 0 ? lessons : LESSONS;
  const effectiveQuizAnswers = quizAnswers || quizScores || {};
  const effectiveLabIds = Array.isArray(completedLabIds)
    ? completedLabIds
    : Array.isArray(codeSolvedIds)
      ? codeSolvedIds
      : [];

  const rec = useMemo(
    () =>
      getAdaptiveRecommendations(
        allLessons,
        completedIds,
        effectiveQuizAnswers,
        diagnosticResult
      ),
    [allLessons, completedIds, effectiveQuizAnswers, diagnosticResult]
  );

  // 1. Progreso real por etapa (LEARNING_STAGES)
  const stageProgressRows = useMemo(() => {
    return LEARNING_STAGES.map((stage) => {
      const stageLessons = allLessons.filter((l) => l.stageId === stage.id);
      const total = stageLessons.length;
      const done = stageLessons.filter((l) => completedIds.includes(l.id)).length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      return {
        stage,
        stageLessons,
        total,
        done,
        pct,
      };
    });
  }, [allLessons, completedIds]);

  // 2. Porcentaje de aciertos y progreso real por rol DE / DA / BI
  const roleStats = useMemo(() => {
    return ['DE', 'DA', 'BI'].map((roleKey) => {
      const primaryLessons = allLessons.filter(
        (l) => (l.coreFocus?.[0] || 'DE') === roleKey
      );
      const targetLessons =
        primaryLessons.length > 0
          ? primaryLessons
          : allLessons.filter((l) => l.coreFocus?.includes(roleKey));

      const totalLessons = targetLessons.length;
      let completedCount = 0;
      let quizAttemptedCount = 0;
      let quizCorrectCount = 0;
      let labSolvedCount = 0;

      targetLessons.forEach((lesson) => {
        if (completedIds.includes(lesson.id)) {
          completedCount += 1;
        }
        if (effectiveLabIds.includes(lesson.id)) {
          labSolvedCount += 1;
        }
        const qStatus = evaluateQuizEntry(lesson, effectiveQuizAnswers[lesson.id]);
        if (qStatus.attempted) {
          quizAttemptedCount += 1;
          if (qStatus.correct) {
            quizCorrectCount += 1;
          }
        }
      });

      const accuracyPct =
        quizAttemptedCount > 0
          ? Math.round((quizCorrectCount / quizAttemptedCount) * 100)
          : 0;

      const totalSignals = Math.max(1, totalLessons * 3);
      const earnedSignals = completedCount + quizCorrectCount + labSolvedCount;
      const verifiedProgressPct = Math.round((earnedSignals / totalSignals) * 100);

      return {
        roleKey,
        label: ROLE_META[roleKey]?.label || roleKey,
        totalLessons,
        completedCount,
        quizAttemptedCount,
        quizCorrectCount,
        labSolvedCount,
        accuracyPct,
        verifiedProgressPct,
        barValue: quizAttemptedCount > 0 ? accuracyPct : verifiedProgressPct,
      };
    });
  }, [allLessons, completedIds, effectiveQuizAnswers, effectiveLabIds]);

  // 3. Historial real de lecciones completadas
  const completedLessonsHistory = useMemo(() => {
    return allLessons
      .filter((l) => completedIds.includes(l.id))
      .map((lesson) => {
        const stage = LEARNING_STAGES.find((s) => s.id === lesson.stageId);
        const qStatus = evaluateQuizEntry(lesson, effectiveQuizAnswers[lesson.id]);
        const labSolved = effectiveLabIds.includes(lesson.id);
        return {
          lesson,
          stageNumber: stage ? stage.number : getStageNumber(lesson.stageId),
          stageTitle: stage ? `Etapa ${stage.number}: ${stage.title}` : lesson.stageId,
          primaryRole: lesson.coreFocus?.[0] || 'DE',
          quizAttempted: qStatus.attempted,
          quizCorrect: qStatus.correct,
          labSolved,
        };
      });
  }, [allLessons, completedIds, effectiveQuizAnswers, effectiveLabIds]);

  const totalCompleted = completedLessonsHistory.length;
  const totalQuizzesAnswered = useMemo(
    () =>
      allLessons.filter(
        (l) => evaluateQuizEntry(l, effectiveQuizAnswers[l.id]).attempted
      ).length,
    [allLessons, effectiveQuizAnswers]
  );
  const totalLabsSolved = useMemo(
    () => allLessons.filter((l) => effectiveLabIds.includes(l.id)).length,
    [allLessons, effectiveLabIds]
  );

  return (
    <div className="sec-view">
      <header className="sec-header">
        <div>
          <div className="sec-header__eyebrow tabular">
            Estado verificable · {totalCompleted}/{allLessons.length} lecciones ·{' '}
            {totalQuizzesAnswered} checkpoints · {totalLabsSolved} laboratorios
          </div>
          <h1 className="sec-header__title">Mi progreso</h1>
          <p className="sec-header__lead">
            Avance por etapa, porcentaje de aciertos por rol (DE, DA, BI) e
            historial de lecciones completadas calculados a partir de tus
            respuestas y laboratorios resueltos.
          </p>
        </div>

        <div className="sec-header__actions">
          {rec?.nextPrimaryLesson && (
            <Button
              variant="primary"
              size="md"
              onClick={() => onOpenLesson(rec.nextPrimaryLesson.id)}
            >
              Continuar en Lección {rec.nextPrimaryLesson.order}
            </Button>
          )}
          <Button variant="secondary" size="md" onClick={onOpenDiagnostic}>
            Test diagnóstico
          </Button>
        </div>
      </header>

      {/* 1. Anillos ProgressRing por cada una de las 6 etapas en grilla con su color data-stage */}
      <section className="sec-section" aria-label="Progreso por etapa">
        <h2 className="sec-section__title">Progreso por etapa (6 etapas)</h2>
        <div className="ana-stages-grid">
          {stageProgressRows.map(({ stage, stageLessons, total, done, pct }) => (
            <Card
              key={stage.id}
              stage={stage.number}
              accentTop
              className="ana-stage-card"
            >
              <div className="ana-stage-card__top">
                <div className="ana-stage-card__info">
                  <span className="ana-stage-card__eyebrow tabular">
                    ETAPA {stage.number}
                  </span>
                  <h3 className="ana-stage-card__title">{stage.title}</h3>
                  <div className="ana-stage-card__count tabular">
                    {done} de {total} lecciones ({pct}%)
                  </div>
                </div>

                <ProgressRing
                  size={64}
                  value={pct}
                  stage={stage.number}
                  tone="stage"
                  celebrate={pct === 100}
                  label={`${pct}%`}
                  ariaLabel={`Etapa ${stage.number}: ${pct}% completado`}
                />
              </div>

              <div className="ana-stage-card__lessons">
                {stageLessons.map((les) => {
                  const isDone = completedIds.includes(les.id);
                  return (
                    <Chip
                      key={les.id}
                      variant={isDone ? 'success' : 'stage'}
                      stage={stage.number}
                      onClick={() => onOpenLesson(les.id)}
                    >
                      L{String(les.order).padStart(2, '0')} · {les.title}{' '}
                      {isDone ? '✓' : ''}
                    </Chip>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 2. Barras de aciertos/avance por rol (DE, DA, BI) usando colores e íconos de rol */}
      <section className="sec-section" aria-label="Porcentaje de aciertos por rol">
        <h2 className="sec-section__title">
          Porcentaje de aciertos y avance por rol (DE · DA · BI)
        </h2>
        <div className="ana-roles-grid">
          {roleStats.map((stat) => (
            <Card
              key={stat.roleKey}
              className={`ana-role-card ana-role-card--${stat.roleKey.toLowerCase()}`}
            >
              <div>
                <div className="ana-role-card__top">
                  <Chip variant="role" role={stat.roleKey}>
                    {stat.roleKey}
                  </Chip>
                  <span className="ana-role-card__count tabular">
                    {stat.completedCount}/{stat.totalLessons} lecciones
                  </span>
                </div>
                <h3 className="ana-role-card__title">{stat.label}</h3>
                <div className="ana-role-card__pct tabular">
                  {stat.quizAttemptedCount > 0
                    ? `${stat.accuracyPct}%`
                    : `${stat.verifiedProgressPct}%`}
                </div>
                <div className="ana-role-card__sub tabular">
                  {stat.quizAttemptedCount > 0
                    ? `Aciertos en checkpoints (${stat.quizCorrectCount} de ${stat.quizAttemptedCount})`
                    : 'Sin checkpoints respondidos aún (avance general)'}
                </div>
              </div>

              <div className="ana-role-card__bottom">
                <div
                  className="ana-role-bar"
                  role="progressbar"
                  aria-valuenow={stat.barValue}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Progreso en ${stat.label}`}
                >
                  <div
                    className="ana-role-bar__fill"
                    style={{ '--value': `${stat.barValue}%` }}
                  />
                </div>

                <div className="ana-role-metrics tabular">
                  <div className="ana-role-metrics__row">
                    <span>Lecciones completadas:</span>
                    <strong className="ana-role-metrics__val">
                      {stat.completedCount} / {stat.totalLessons}
                    </strong>
                  </div>
                  <div className="ana-role-metrics__row">
                    <span>Checkpoints acertados:</span>
                    <strong className="ana-role-metrics__val">
                      {stat.quizCorrectCount} / {stat.quizAttemptedCount}
                    </strong>
                  </div>
                  <div className="ana-role-metrics__row">
                    <span>Laboratorios resueltos:</span>
                    <strong className="ana-role-metrics__val">
                      {stat.labSolvedCount} / {stat.totalLessons}
                    </strong>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 3. Historial de lecciones completadas */}
      <section
        className="sec-section"
        aria-label="Historial de lecciones completadas"
      >
        <h2 className="sec-section__title">
          Historial de lecciones completadas ({completedLessonsHistory.length})
        </h2>

        {completedLessonsHistory.length === 0 ? (
          <EmptyState
            illustration={<Illustration name="empty-projects" />}
            title="Aún no has completado ninguna lección"
            description="Cuando completes una lección o aciertes su pregunta de verificación, aparecerá registrada aquí con el estado de su checkpoint y laboratorio."
            action={{
              label: 'Comenzar en la Lección 1',
              variant: 'primary',
              onClick: () => onOpenLesson(allLessons[0]?.id || 'l1-joins-fanout'),
            }}
          />
        ) : (
          <div className="ana-history-list">
            {completedLessonsHistory.map((item) => (
              <Card
                key={item.lesson.id}
                stage={item.stageNumber}
                className="ana-history-card"
              >
                <div className="ana-history-card__info">
                  <div className="ana-history-card__chips">
                    <Chip variant="success">Completada ✓</Chip>
                    <Chip variant="role" role={item.primaryRole}>
                      {item.primaryRole}
                    </Chip>
                    <span className="ana-history-card__stage tabular">
                      {item.stageTitle}
                    </span>
                  </div>
                  <strong className="ana-history-card__title">
                    Lección {item.lesson.order}: {item.lesson.title}
                  </strong>
                  <div className="ana-history-card__meta tabular">
                    Checkpoint:{' '}
                    {item.quizAttempted
                      ? item.quizCorrect
                        ? 'Acertado ✓'
                        : 'Respondido (por reforzar)'
                      : 'Pendiente'}{' '}
                    · Laboratorio: {item.labSolved ? 'Resuelto ✓' : 'Pendiente'}
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onOpenLesson(item.lesson.id)}
                >
                  Abrir lección
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default LearningAnalyticsView;
