import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  AlertCircle,
  MessageSquare,
  SlidersHorizontal,
  BookOpen,
  Check,
} from 'lucide-react';
import { MODULES } from '../data/catalog/modules.js';
import { LEVELS } from '../data/catalog/levels.js';
import { TRACKS } from '../data/catalog/tracks.js';
import { LESSONS_BY_ID } from '../data/lessons/index.js';
import {
  useProfile,
  useProgress,
  openTutor,
  getEphemeralState,
} from '../state/store.js';
import { Button, Segmented } from './ui/index.js';
import { SettingsView } from '../views/SettingsView.jsx';

const TRACK_FILTER_ITEMS = [
  { id: 'all', label: 'Todas' },
  { id: 'core', label: 'Tronco común' },
  { id: 'de', label: 'DE', track: 'de' },
  { id: 'da', label: 'DA', track: 'da' },
  { id: 'bi', label: 'BI', track: 'bi' },
];

const INTERVIEW_TRACKS = [
  { id: 'de', label: 'Ingeniería de Datos (DE)', track: 'de' },
  { id: 'da', label: 'Análisis de Datos (DA)', track: 'da' },
  { id: 'bi', label: 'Business Intelligence (BI)', track: 'bi' },
];

const TRACK_LABELS = {
  core: 'Tronco común',
  de: 'Ingeniería de Datos (DE)',
  da: 'Análisis de Datos (DA)',
  bi: 'Business Intelligence (BI)',
};

const WEEKDAY_ITEMS = [
  { offset: 0, short: 'L', label: 'Lunes' },
  { offset: 1, short: 'M', label: 'Martes' },
  { offset: 2, short: 'X', label: 'Miércoles' },
  { offset: 3, short: 'J', label: 'Jueves' },
  { offset: 4, short: 'V', label: 'Viernes' },
  { offset: 5, short: 'S', label: 'Sábado' },
  { offset: 6, short: 'D', label: 'Domingo' },
];

function formatDateKey(dateObj) {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getMondayOfCurrentWeek(now = new Date()) {
  const ref = new Date(now);
  const day = ref.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(ref);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(ref.getDate() + diff);
  return monday;
}

function evaluateLessonChecks(lessonId, legacyId, progressLessons, quizAnswers, lessonObj) {
  let answered = 0;
  let correct = 0;
  const failedItems = [];

  const entry =
    progressLessons?.[lessonId] ||
    (legacyId ? progressLessons?.[legacyId] : null) ||
    null;

  const checksMap = entry?.checks || {};
  const checkEntries = Object.entries(checksMap);

  if (checkEntries.length > 0) {
    for (const [checkId, val] of checkEntries) {
      answered += 1;
      let isCorrect = false;
      if (typeof val === 'boolean') {
        isCorrect = val;
      } else if (typeof val === 'string') {
        const opts = lessonObj?.checkpoint?.options || lessonObj?.checks?.[0]?.options || [];
        const matchedOpt = opts.find((o) => o.id === val);
        isCorrect = Boolean(matchedOpt?.correct);
      } else if (val && typeof val === 'object') {
        if (typeof val.correct === 'boolean') {
          isCorrect = val.correct;
        } else if (val.optionId) {
          const opts = lessonObj?.checkpoint?.options || lessonObj?.checks?.[0]?.options || [];
          const matchedOpt = opts.find((o) => o.id === val.optionId);
          isCorrect = Boolean(matchedOpt?.correct);
        }
      }

      if (isCorrect) {
        correct += 1;
      } else if (lessonObj) {
        const checkSpec =
          (lessonObj.checks || []).find((c) => c.id === checkId) ||
          lessonObj.checks?.[0] ||
          null;
        const sectionSpec =
          (lessonObj.sections || []).find((s) => s.id === checkSpec?.sectionId) ||
          lessonObj.sections?.[0] ||
          null;

        failedItems.push({
          key: `${lessonObj.id}-${checkId}`,
          lessonId: lessonObj.id,
          stageId: lessonObj.stageId || 'stage-1',
          lessonOrder: lessonObj.order,
          lessonTitle: lessonObj.title,
          sectionId: sectionSpec?.id || null,
          sectionTitle: sectionSpec?.title || 'Comprobación de concepto',
          prompt:
            checkSpec?.prompt ||
            lessonObj.checkpoint?.question ||
            lessonObj.goal,
        });
      }
    }
  } else {
    // Fallback a quizAnswers pasados por props
    const propAnswer =
      quizAnswers?.[lessonId] ?? (legacyId ? quizAnswers?.[legacyId] : undefined);
    if (propAnswer !== undefined && propAnswer !== null) {
      answered += 1;
      let isCorrect = false;
      if (typeof propAnswer === 'boolean') {
        isCorrect = propAnswer;
      } else if (typeof propAnswer === 'string' && lessonObj) {
        const opts = lessonObj?.checkpoint?.options || [];
        const matchedOpt = opts.find((o) => o.id === propAnswer);
        isCorrect = Boolean(matchedOpt?.correct);
      }
      if (isCorrect) {
        correct += 1;
      } else if (lessonObj) {
        failedItems.push({
          key: `${lessonObj.id}-checkpoint`,
          lessonId: lessonObj.id,
          stageId: lessonObj.stageId || 'stage-1',
          lessonOrder: lessonObj.order,
          lessonTitle: lessonObj.title,
          sectionId: lessonObj.sections?.[0]?.id || null,
          sectionTitle: lessonObj.sections?.[0]?.title || 'Comprobación de concepto',
          prompt: lessonObj.checkpoint?.question || lessonObj.goal,
        });
      }
    }
  }

  return { answered, correct, failedItems };
}

export function LearningAnalyticsView({
  lessons = [],
  completedIds = [],
  quizAnswers = {},
  onOpenLesson,
  onOpenDiagnostic,
  onNavigate,
  onOpenTutor,
}) {
  const profile = useProfile();
  const progress = useProgress();

  const isSettingsUrl = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('view') === 'settings';
  }, []);

  // Si App.jsx cae en LearningAnalyticsView cuando viewMode === 'settings', renderizar SettingsView
  if (isSettingsUrl || getEphemeralState()?.viewMode === 'settings') {
    return (
      <SettingsView
        onNavigate={onNavigate}
        onBack={() => onNavigate?.('analytics')}
      />
    );
  }

  const [trackFilter, setTrackFilter] = useState('all');
  const [interviewTrack, setInterviewTrack] = useState(
    () => profile?.track || 'de'
  );
  const [interviewLevel, setInterviewLevel] = useState(
    () => Number(profile?.startLevel ?? 2)
  );

  // Conjunto de lecciones completadas
  const completedSet = useMemo(() => {
    const set = new Set(Array.isArray(completedIds) ? completedIds : []);
    for (const [id, entry] of Object.entries(progress?.lessons || {})) {
      if (entry?.status === 'completed' || entry?.status === 'known') {
        set.add(id);
        const mapped = LESSONS_BY_ID[id];
        if (mapped?.id) set.add(mapped.id);
        if (mapped?.legacyId) set.add(mapped.legacyId);
      }
    }
    return set;
  }, [completedIds, progress?.lessons]);

  // Datos de estudio semanal (7 días de la semana actual + últimas 4 semanas)
  const weeklySeries = useMemo(() => {
    const studyMap = progress?.studyMinutesByDay || {};
    const monday = getMondayOfCurrentWeek();

    const days = WEEKDAY_ITEMS.map((item) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + item.offset);
      const key = formatDateKey(d);
      const minutes = Math.max(0, Math.round(Number(studyMap[key] || 0)));
      return {
        ...item,
        date: key,
        minutes,
      };
    });

    const weeks = [3, 2, 1, 0].map((weeksAgo) => {
      const start = new Date(monday);
      start.setDate(monday.getDate() - weeksAgo * 7);
      let sum = 0;
      for (let i = 0; i < 7; i += 1) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const key = formatDateKey(d);
        sum += Math.max(0, Math.round(Number(studyMap[key] || 0)));
      }
      const label =
        weeksAgo === 0
          ? 'Semana actual'
          : weeksAgo === 1
            ? 'Hace 1 sem.'
            : `Hace ${weeksAgo} sem.`;
      return {
        id: `w-${weeksAgo}`,
        label,
        minutes: sum,
        hours: (sum / 60).toFixed(1),
      };
    });

    const currentWeekMinutes = days.reduce((acc, d) => acc + d.minutes, 0);
    const totalAllTimeMinutes = Object.values(studyMap).reduce(
      (acc, v) => acc + Math.max(0, Math.round(Number(v || 0))),
      0
    );

    return {
      days,
      weeks,
      currentWeekMinutes,
      totalAllTimeMinutes,
      maxDayMinutes: Math.max(30, ...days.map((d) => d.minutes)),
      maxWeekMinutes: Math.max(60, ...weeks.map((w) => w.minutes)),
    };
  }, [progress?.studyMinutesByDay]);

  // Métricas por módulo y por nivel (0..4) + precisión en checks + temas por reforzar
  const analyticsData = useMemo(() => {
    const failedChecksMap = new Map();
    let totalChecksAnswered = 0;
    let totalChecksCorrect = 0;

    // Primero evaluar las 18 lecciones interactivas existentes por si tienen checks
    for (const lesson of lessons) {
      const res = evaluateLessonChecks(
        lesson.v2Id || lesson.id,
        lesson.id,
        progress?.lessons,
        quizAnswers,
        lesson
      );
      for (const item of res.failedItems) {
        failedChecksMap.set(item.key, item);
      }
    }

    const enrichedModules = MODULES.map((mod) => {
      const modLessons = mod.lessons || [];
      let completedInMod = 0;
      let modChecksAnswered = 0;
      let modChecksCorrect = 0;

      for (const lEntry of modLessons) {
        const isDone =
          completedSet.has(lEntry.id) ||
          (lEntry.legacyId && completedSet.has(lEntry.legacyId));
        if (isDone) completedInMod += 1;

        const lessonObj =
          LESSONS_BY_ID[lEntry.id] ||
          (lEntry.legacyId ? LESSONS_BY_ID[lEntry.legacyId] : null) ||
          lessons.find(
            (x) => x.v2Id === lEntry.id || x.id === lEntry.legacyId
          ) ||
          null;

        const checkStats = evaluateLessonChecks(
          lEntry.id,
          lEntry.legacyId,
          progress?.lessons,
          quizAnswers,
          lessonObj
        );
        modChecksAnswered += checkStats.answered;
        modChecksCorrect += checkStats.correct;
        for (const fItem of checkStats.failedItems) {
          failedChecksMap.set(fItem.key, {
            ...fItem,
            moduleTitle: mod.title,
            level: mod.level,
          });
        }
      }

      totalChecksAnswered += modChecksAnswered;
      totalChecksCorrect += modChecksCorrect;

      const totalInMod = Math.max(1, modLessons.length);
      const completionPct = Math.round((completedInMod / totalInMod) * 100);
      const checkAccuracyPct =
        modChecksAnswered > 0
          ? Math.round((modChecksCorrect / modChecksAnswered) * 100)
          : null;

      return {
        ...mod,
        completedCount: completedInMod,
        totalCount: modLessons.length,
        completionPct,
        checksAnswered: modChecksAnswered,
        checksCorrect: modChecksCorrect,
        checkAccuracyPct,
      };
    });

    const filteredModules = enrichedModules.filter((m) =>
      trackFilter === 'all' ? true : m.track === trackFilter
    );

    const levelSummaries = LEVELS.map((lvl) => {
      const modsInLevel = filteredModules.filter((m) => m.level === lvl.level);
      const totalLessonsInLevel = modsInLevel.reduce(
        (acc, m) => acc + m.totalCount,
        0
      );
      const completedInLevel = modsInLevel.reduce(
        (acc, m) => acc + m.completedCount,
        0
      );
      const pct =
        totalLessonsInLevel > 0
          ? Math.round((completedInLevel / totalLessonsInLevel) * 100)
          : 0;
      return {
        ...lvl,
        modules: modsInLevel,
        completedCount: completedInLevel,
        totalCount: totalLessonsInLevel,
        pct,
      };
    });

    const globalAccuracyPct =
      totalChecksAnswered > 0
        ? Math.round((totalChecksCorrect / totalChecksAnswered) * 100)
        : null;

    return {
      enrichedModules,
      filteredModules,
      levelSummaries,
      failedChecks: Array.from(failedChecksMap.values()),
      totalChecksAnswered,
      totalChecksCorrect,
      globalAccuracyPct,
    };
  }, [lessons, completedSet, progress?.lessons, quizAnswers, trackFilter]);

  const handleLaunchInterview = () => {
    const trackInfo =
      TRACKS.find((t) => t.id === interviewTrack) || TRACKS[1];
    const levelInfo =
      LEVELS.find((l) => l.level === Number(interviewLevel)) || LEVELS[2];

    const promptText = `Iniciemos un simulacro de entrevista técnica para ${trackInfo.name} (${trackInfo.short}) en el Nivel ${levelInfo.level} (${levelInfo.name}). Hazme una pregunta de caso sobre Mercado Brisa y evalúa mi respuesta con criterio técnico.`;

    const payload = {
      mode: 'interview',
      track: interviewTrack,
      level: Number(interviewLevel),
      prefill: promptText,
    };

    if (typeof onOpenTutor === 'function') {
      onOpenTutor(payload);
    } else {
      openTutor(payload);
    }
  };

  return (
    <div className="sec-view progress-view" data-view="analytics">
      <header className="sec-header">
        <div className="sec-header__top">
          <div>
            <span className="sec-kicker tabular">
              REGISTRO DE ESTUDIO · {completedSet.size} LECCIONES COMPLETADAS ·{' '}
              {analyticsData.totalChecksAnswered} COMPROBACIONES RESPONDIDAS
            </span>
            <h1 className="sec-title">Progreso</h1>
            <p className="sec-lead">
              Tiempo de estudio semanal, avance por nivel y módulo, precisión en comprobaciones y simulacro de entrevista técnica.
            </p>
          </div>

          <div className="sec-actions">
            {typeof onOpenDiagnostic === 'function' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onOpenDiagnostic}
              >
                Test diagnóstico
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              icon={SlidersHorizontal}
              onClick={() => onNavigate?.('settings')}
            >
              Ajustes
            </Button>
          </div>
        </div>
      </header>

      {/* 1. Horas / minutos por semana (barras simples en --brand) */}
      <section
        className="sec-section"
        aria-labelledby="progress-time-heading"
        data-testid="progress-weekly-time"
      >
        <div className="sec-section__head">
          <div>
            <h2 id="progress-time-heading" className="sec-section__title">
              Tiempo de estudio por semana
            </h2>
            <p className="sec-section__sub">
              Minutos registrados por día en la semana actual y acumulado de las últimas cuatro semanas.
            </p>
          </div>
          <div className="progress-time-totals tabular">
            <span>
              Esta semana: <strong>{weeklySeries.currentWeekMinutes} min</strong> (
              {(weeklySeries.currentWeekMinutes / 60).toFixed(1)} h)
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Total acumulado: <strong>{weeklySeries.totalAllTimeMinutes} min</strong>
            </span>
          </div>
        </div>

        <div className="progress-charts-grid">
          {/* Barras diarias L..D */}
          <div className="progress-chart-box">
            <div className="progress-chart-box__head">
              <span className="progress-chart-box__title">
                Actividad diaria (semana actual)
              </span>
              <span className="progress-chart-box__unit tabular">min / día</span>
            </div>
            <div
              className="progress-bars-vertical"
              role="list"
              aria-label="Minutos por día de la semana"
            >
              {weeklySeries.days.map((day) => {
                const heightPct =
                  day.minutes > 0
                    ? Math.min(
                        100,
                        Math.max(10, Math.round((day.minutes / weeklySeries.maxDayMinutes) * 100))
                      )
                    : 0;
                return (
                  <div
                    key={day.date}
                    role="listitem"
                    className="progress-vbar"
                    title={`${day.label} (${day.date}): ${day.minutes} min`}
                  >
                    <span className="progress-vbar__val tabular">
                      {day.minutes}
                    </span>
                    <div className="progress-vbar__track" aria-hidden="true">
                      <div
                        className="progress-vbar__fill"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="progress-vbar__label">{day.short}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Barras horizontales de las últimas 4 semanas */}
          <div className="progress-chart-box">
            <div className="progress-chart-box__head">
              <span className="progress-chart-box__title">
                Últimas 4 semanas
              </span>
              <span className="progress-chart-box__unit tabular">minutos (horas)</span>
            </div>
            <div
              className="progress-bars-horizontal"
              role="list"
              aria-label="Minutos estudiados por semana"
            >
              {weeklySeries.weeks.map((wk) => {
                const widthPct =
                  wk.minutes > 0
                    ? Math.min(
                        100,
                        Math.max(6, Math.round((wk.minutes / weeklySeries.maxWeekMinutes) * 100))
                      )
                    : 0;
                return (
                  <div key={wk.id} role="listitem" className="progress-hbar">
                    <div className="progress-hbar__meta">
                      <span className="progress-hbar__label">{wk.label}</span>
                      <span className="progress-hbar__val tabular">
                        {wk.minutes} min ({wk.hours} h)
                      </span>
                    </div>
                    <div className="progress-hbar__track" aria-hidden="true">
                      <div
                        className="progress-hbar__fill"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Temas por reforzar (checks fallados) */}
      <section
        className="sec-section"
        aria-labelledby="progress-reinforce-heading"
        data-testid="progress-reinforce-section"
      >
        <div className="sec-section__head">
          <div>
            <h2 id="progress-reinforce-heading" className="sec-section__title">
              Temas por reforzar
            </h2>
            <p className="sec-section__sub">
              Comprobaciones donde la respuesta seleccionada no fue correcta, con enlace directo a la lección.
            </p>
          </div>
          {analyticsData.globalAccuracyPct !== null && (
            <span className="progress-accuracy-pill tabular">
              Precisión global en checks: {analyticsData.globalAccuracyPct} % (
              {analyticsData.totalChecksCorrect}/{analyticsData.totalChecksAnswered})
            </span>
          )}
        </div>

        {analyticsData.failedChecks.length === 0 ? (
          <p className="progress-clean-line" data-testid="progress-reinforce-empty">
            <Check size={15} aria-hidden="true" />
            <span>
              No tienes comprobaciones falladas pendientes de refuerzo.
            </span>
          </p>
        ) : (
          <ul className="progress-reinforce-list">
            {analyticsData.failedChecks.map((item) => (
              <li key={item.key} className="progress-reinforce-row">
                <div className="progress-reinforce-row__info">
                  <div className="progress-reinforce-row__top">
                    <AlertCircle
                      size={15}
                      aria-hidden="true"
                      className="progress-reinforce-row__icon"
                    />
                    <span className="progress-reinforce-row__lesson">
                      L{String(item.lessonOrder || 1).padStart(2, '0')} ·{' '}
                      {item.lessonTitle}
                    </span>
                    <span className="progress-reinforce-row__sec">
                      Sección: {item.sectionTitle}
                    </span>
                  </div>
                  <p className="progress-reinforce-row__prompt">{item.prompt}</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={BookOpen}
                  onClick={() => onOpenLesson?.(item.stageId, item.lessonId)}
                >
                  Repasar lección
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 3. Avance por nivel (0..4) y módulo con precisión en checks */}
      <section
        className="sec-section"
        aria-labelledby="progress-levels-heading"
        data-testid="progress-levels-section"
      >
        <div className="sec-section__head">
          <div>
            <h2 id="progress-levels-heading" className="sec-section__title">
              Avance por nivel y módulo
            </h2>
            <p className="sec-section__sub">
              Lecciones completadas y porcentaje de acierto en comprobaciones dentro de los 26 módulos del catálogo.
            </p>
          </div>
          <Segmented
            ariaLabel="Filtrar módulos por área"
            items={TRACK_FILTER_ITEMS}
            value={trackFilter}
            onChange={(val) => setTrackFilter(val)}
            size="sm"
          />
        </div>

        <div className="progress-levels-stack">
          {analyticsData.levelSummaries.map((lvl) => (
            <div key={lvl.level} className="progress-level-block">
              <div className="progress-level-block__header">
                <div className="progress-level-block__title-wrap">
                  <span className="progress-level-badge tabular">
                    Nivel {lvl.level}
                  </span>
                  <h3 className="progress-level-block__name">{lvl.name}</h3>
                  <span className="progress-level-block__summary">
                    {lvl.summary}
                  </span>
                </div>
                <div className="progress-level-block__stats tabular">
                  <span>
                    {lvl.completedCount} de {lvl.totalCount} lecciones ({lvl.pct} %)
                  </span>
                </div>
              </div>

              <div className="progress-level-bar" aria-hidden="true">
                <div
                  className="progress-level-bar__fill"
                  style={{ width: `${lvl.pct}%` }}
                />
              </div>

              {lvl.modules.length > 0 && (
                <div className="progress-module-table" role="table" aria-label={`Módulos del Nivel ${lvl.level}`}>
                  <div className="progress-module-table__head" role="row">
                    <span role="columnheader">Módulo</span>
                    <span role="columnheader">Área</span>
                    <span role="columnheader" className="is-num">Lecciones</span>
                    <span role="columnheader" className="is-num">Precisión checks</span>
                  </div>
                  {lvl.modules.map((mod) => (
                    <div
                      key={mod.id}
                      className="progress-module-table__row"
                      role="row"
                    >
                      <div role="cell" className="progress-module-table__main">
                        <span className="progress-module-table__title">
                          {mod.title}
                        </span>
                        <span className="progress-module-table__goal">
                          {mod.goal}
                        </span>
                      </div>
                      <div role="cell" className="progress-module-table__track">
                        <span
                          className={`progress-track-chip progress-track-chip--${mod.track}`}
                        >
                          <span
                            className={`progress-track-dot progress-track-dot--${mod.track}`}
                            aria-hidden="true"
                          />
                          {TRACK_LABELS[mod.track] || 'Común'}
                        </span>
                      </div>
                      <div
                        role="cell"
                        className="progress-module-table__cell is-num tabular"
                      >
                        {mod.completedCount}/{mod.totalCount} ({mod.completionPct} %)
                      </div>
                      <div
                        role="cell"
                        className="progress-module-table__cell is-num tabular"
                      >
                        {mod.checkAccuracyPct !== null
                          ? `${mod.checkAccuracyPct} % (${mod.checksCorrect}/${mod.checksAnswered})`
                          : 'Sin respuestas'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 4. Simulacro de entrevista por área y nivel */}
      <section
        className="sec-section progress-interview-box"
        aria-labelledby="progress-interview-heading"
        data-testid="progress-interview-section"
      >
        <div className="progress-interview-box__info">
          <span className="sec-kicker">PRÁCTICA CON EL TUTOR</span>
          <h2 id="progress-interview-heading" className="sec-section__title">
            Simulacro de entrevista técnica
          </h2>
          <p className="sec-section__sub">
            Abre el tutor en modo entrevista con preguntas de arquitectura, SQL, modelado o inferencia adaptadas al área y nivel que elijas.
          </p>
        </div>

        <div className="progress-interview-box__controls">
          <div className="progress-interview-field">
            <label
              htmlFor="interview-track-select"
              className="progress-interview-field__label"
            >
              Área evaluada
            </label>
            <select
              id="interview-track-select"
              className="settings-select"
              value={interviewTrack}
              onChange={(e) => setInterviewTrack(e.target.value)}
            >
              {INTERVIEW_TRACKS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="progress-interview-field">
            <label
              htmlFor="interview-level-select"
              className="progress-interview-field__label"
            >
              Nivel objetivo
            </label>
            <select
              id="interview-level-select"
              className="settings-select"
              value={String(interviewLevel)}
              onChange={(e) => setInterviewLevel(Number(e.target.value))}
            >
              {LEVELS.map((lvl) => (
                <option key={lvl.level} value={String(lvl.level)}>
                  Nivel {lvl.level} · {lvl.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={MessageSquare}
            iconRight={ArrowRight}
            onClick={handleLaunchInterview}
            data-testid="launch-interview-btn"
          >
            Iniciar simulacro de entrevista
          </Button>
        </div>
      </section>
    </div>
  );
}

export default LearningAnalyticsView;
