import React, { useMemo } from 'react';
import { ArrowRight, Play, Repeat, Compass, SlidersHorizontal } from 'lucide-react';
import { Button } from '../components/ui/index.js';
import { MODULES, getTrackPath } from '../data/lessons/index.js';
import { TRACKS } from '../data/catalog/tracks.js';
import { LEVELS } from '../data/catalog/levels.js';
import { FLASHCARDS } from '../data/flashcards.js';
import { getDueCards } from '../engine/review.js';
import {
  useProfile,
  useProgress,
  useStore,
  setTrack,
  getEphemeralState,
} from '../state/store.js';
import { SettingsView } from './SettingsView.jsx';

export const LESSON_STEP_LABELS = [
  '1 · Caso y concepto',
  '2 · Esquema visual',
  '3 · Ejemplo guiado SQL',
  '4 · Práctica con rúbrica',
  '5 · Comprobación y síntesis',
];

const WEEKDAY_LABELS = [
  { key: 1, short: 'L', name: 'Lunes' },
  { key: 2, short: 'M', name: 'Martes' },
  { key: 3, short: 'X', name: 'Miércoles' },
  { key: 4, short: 'J', name: 'Jueves' },
  { key: 5, short: 'V', name: 'Viernes' },
  { key: 6, short: 'S', name: 'Sábado' },
  { key: 0, short: 'D', name: 'Domingo' },
];

function parseDurationMinutes(lesson) {
  if (typeof lesson?.minutes === 'number' && lesson.minutes > 0) {
    return lesson.minutes;
  }
  if (typeof lesson?.duration === 'string') {
    const match = lesson.duration.match(/(\d+)/);
    if (match) return Number(match[1]);
  }
  return 25;
}

function buildCurrentWeekDays(studyMinutesByDay = {}, now = new Date()) {
  const ref = new Date(now);
  const dayOfWeek = ref.getDay(); // 0 domingo .. 6 sábado
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(ref);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(ref.getDate() + diffToMonday);

  return WEEKDAY_LABELS.map((item, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const isoDate = `${yyyy}-${mm}-${dd}`;
    const minutes = Math.max(0, Math.round(Number(studyMinutesByDay?.[isoDate] || 0)));
    return {
      ...item,
      date: isoDate,
      minutes,
    };
  });
}

export function HomeView({
  lessons = [],
  completedIds = [],
  lessonSteps = {},
  currentLesson,
  nextRecommendedLesson,
  dueCardsCount = 0,
  onOpenLesson,
  onNavigate,
  onOpenDiagnostic,
}) {
  const fullState = useStore();
  const profile = useProfile();
  const progress = useProgress();

  const isSettingsUrl = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('view') === 'settings';
  }, []);

  if (isSettingsUrl || getEphemeralState()?.viewMode === 'settings') {
    return <SettingsView onNavigate={onNavigate} />;
  }

  const activeTrackId = profile?.track || null;
  const trackMeta = useMemo(
    () =>
      TRACKS.find((t) => t.id === activeTrackId) ||
      TRACKS.find((t) => t.id === 'core') ||
      TRACKS[0],
    [activeTrackId]
  );

  // Módulos de la ruta del usuario (Tronco común + su área elegida, o todos los de DE por defecto para contar la ruta estándar de 95 lecciones)
  const routeModules = useMemo(() => {
    const targetTrack = activeTrackId || 'de';
    return getTrackPath(targetTrack);
  }, [activeTrackId]);

  const totalRouteLessons = useMemo(
    () =>
      routeModules.reduce(
        (acc, mod) => acc + (Array.isArray(mod.lessons) ? mod.lessons.length : 0),
        0
      ),
    [routeModules]
  );

  // Progreso real combinando store y props
  const completedSet = useMemo(() => {
    const set = new Set(Array.isArray(completedIds) ? completedIds : []);
    for (const [id, entry] of Object.entries(progress?.lessons || {})) {
      if (entry?.status === 'completed' || entry?.status === 'known') {
        set.add(id);
      }
    }
    return set;
  }, [completedIds, progress?.lessons]);

  const startedSet = useMemo(() => {
    const set = new Set();
    for (const [id, step] of Object.entries(lessonSteps || {})) {
      if (Number(step) > 0) set.add(id);
    }
    for (const [id, entry] of Object.entries(progress?.lessons || {})) {
      if (
        entry &&
        (entry.status === 'in_progress' ||
          entry.status === 'completed' ||
          entry.status === 'known' ||
          Number(entry.stepIndex || 0) > 0)
      ) {
        set.add(id);
      }
    }
    return set;
  }, [lessonSteps, progress?.lessons]);

  const isNewUser = completedSet.size === 0 && startedSet.size === 0;

  // Nivel actual según las lecciones completadas o startLevel
  const currentLevelNumber = useMemo(() => {
    const baseLevel = Number(profile?.startLevel ?? 0);
    if (completedSet.size === 0) return baseLevel;
    let highestLevel = baseLevel;
    for (const mod of routeModules) {
      const hasCompletedInMod = (mod.lessons || []).some(
        (l) => completedSet.has(l.id) || (l.legacyId && completedSet.has(l.legacyId))
      );
      if (hasCompletedInMod && mod.level > highestLevel) {
        highestLevel = mod.level;
      }
    }
    return highestLevel;
  }, [profile?.startLevel, completedSet, routeModules]);

  const currentLevelMeta = useMemo(
    () => LEVELS.find((l) => l.level === currentLevelNumber) || LEVELS[0],
    [currentLevelNumber]
  );

  // Primera lección ejecutable para usuario nuevo o lección activa para continuar
  const playableLessons = useMemo(
    () => (Array.isArray(lessons) && lessons.length > 0 ? lessons : []),
    [lessons]
  );

  const firstRouteLesson = useMemo(() => {
    if (playableLessons.length === 0) return null;
    // Primera lección escrita y no terminada siguiendo el orden de la ruta (nivel 0 primero),
    // no el orden del arreglo de lecciones.
    const byV2Id = new Map(playableLessons.map((l) => [l.v2Id || l.id, l]));
    for (const mod of routeModules) {
      for (const entry of mod.lessons || []) {
        const lesson = entry.status === 'existing' ? byV2Id.get(entry.v2Id) : null;
        if (lesson && !completedSet.has(lesson.id) && !completedSet.has(lesson.v2Id)) {
          return lesson;
        }
      }
    }
    if (activeTrackId) {
      const matchingTrack = playableLessons.find(
        (l) => l.track === activeTrackId || l.track === 'core'
      );
      if (matchingTrack) return matchingTrack;
    }
    return playableLessons[0];
  }, [playableLessons, routeModules, completedSet, activeTrackId]);

  const activeContinueLesson = useMemo(() => {
    // Priorizar una lección en curso no completada
    for (const l of playableLessons) {
      const isDone = completedSet.has(l.id) || (l.v2Id && completedSet.has(l.v2Id));
      const isStarted = startedSet.has(l.id) || (l.v2Id && startedSet.has(l.v2Id));
      if (isStarted && !isDone) return l;
    }
    if (
      currentLesson &&
      !completedSet.has(currentLesson.id) &&
      (!currentLesson.v2Id || !completedSet.has(currentLesson.v2Id))
    ) {
      return currentLesson;
    }
    if (nextRecommendedLesson) return nextRecommendedLesson;
    return firstRouteLesson;
  }, [
    playableLessons,
    completedSet,
    startedSet,
    currentLesson,
    nextRecommendedLesson,
    firstRouteLesson,
  ]);

  const activeStepIndex = useMemo(() => {
    if (!activeContinueLesson) return 0;
    const rawStep =
      lessonSteps?.[activeContinueLesson.id] ??
      progress?.lessons?.[activeContinueLesson.id]?.stepIndex ??
      progress?.lessons?.[activeContinueLesson.v2Id]?.stepIndex ??
      0;
    return Math.min(4, Math.max(0, Number(rawStep) || 0));
  }, [activeContinueLesson, lessonSteps, progress?.lessons]);

  const activeSectionTitle = useMemo(() => {
    if (!activeContinueLesson) return LESSON_STEP_LABELS[0];
    const sections = activeContinueLesson.sections;
    if (Array.isArray(sections) && sections.length > 0) {
      const sec = sections[Math.min(activeStepIndex, sections.length - 1)];
      if (sec?.title) return sec.title;
    }
    return LESSON_STEP_LABELS[activeStepIndex] || LESSON_STEP_LABELS[0];
  }, [activeContinueLesson, activeStepIndex]);

  const remainingMinutes = useMemo(() => {
    if (!activeContinueLesson) return 20;
    const total = parseDurationMinutes(activeContinueLesson);
    const ratioLeft = Math.max(0.2, (5 - activeStepIndex) / 5);
    return Math.max(5, Math.round(total * ratioLeft));
  }, [activeContinueLesson, activeStepIndex]);

  // Próximas 3 lecciones en la ruta (excluyendo completadas y la actual en "Continuar")
  const upcomingLessons = useMemo(() => {
    const list = [];
    for (const l of playableLessons) {
      const isDone = completedSet.has(l.id) || (l.v2Id && completedSet.has(l.v2Id));
      const isCurrent = activeContinueLesson && l.id === activeContinueLesson.id;
      if (!isDone && !isCurrent) {
        list.push(l);
      }
      if (list.length >= 3) break;
    }
    return list;
  }, [playableLessons, completedSet, activeContinueLesson]);

  // Tarjetas vencidas reales desde FSRS (review.js) sobre el catálogo de 75 flashcards
  const effectiveDueCount = useMemo(() => {
    if (isNewUser) return 0;
    const dueList = getDueCards(fullState, { catalog: FLASHCARDS });
    if (Array.isArray(dueList)) return dueList.length;
    return Math.max(0, Number(dueCardsCount) || 0);
  }, [fullState, dueCardsCount, isNewUser]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('manual_datos_due_count', {
          detail: effectiveDueCount,
        })
      );
    }
  }, [effectiveDueCount]);

  // Minutos estudiados esta semana (7 celdas L..D)
  const weekDays = useMemo(
    () => buildCurrentWeekDays(progress?.studyMinutesByDay),
    [progress?.studyMinutesByDay]
  );

  const maxDayMinutes = useMemo(
    () => Math.max(30, ...weekDays.map((d) => d.minutes)),
    [weekDays]
  );

  const totalWeekMinutes = useMemo(
    () => weekDays.reduce((acc, d) => acc + d.minutes, 0),
    [weekDays]
  );

  const statusTrackLabel = activeTrackId
    ? trackMeta.name
    : 'Tronco común (sin área asignada)';

  const specializationChoices = useMemo(
    () => TRACKS.filter((t) => t.id !== 'core'),
    []
  );

  return (
    <div className="home-view" data-view="home">
      <header className="home-header">
        <div className="home-header__main">
          <h1 className="home-header__title">Hoy</h1>
          <p className="home-header__status tabular">
            <span className="home-header__track">
              {activeTrackId && (
                <span
                  className={`home-track-dot home-track-dot--${activeTrackId}`}
                  aria-hidden="true"
                />
              )}
              {statusTrackLabel}
            </span>
            <span className="home-header__sep" aria-hidden="true">·</span>
            <span>
              Nivel {currentLevelNumber} ({currentLevelMeta.name})
            </span>
            <span className="home-header__sep" aria-hidden="true">·</span>
            <span>
              {completedSet.size} de {totalRouteLessons} lecciones
            </span>
          </p>
        </div>

        <div className="home-header__actions">
          <Button
            variant="ghost"
            size="sm"
            icon={SlidersHorizontal}
            onClick={() => onNavigate?.('settings')}
          >
            Ajustes
          </Button>
        </div>
      </header>

      {isNewUser ? (
        /* ESTADO USUARIO NUEVO: una sola tarjeta limpia sin cajas vacías */
        <section
          className="home-onboarding-card"
          aria-labelledby="home-start-heading"
          data-testid="home-new-user-card"
        >
          <div className="home-onboarding-card__top">
            <span className="home-kicker">PUNTO DE PARTIDA</span>
            <h2 id="home-start-heading" className="home-onboarding-card__title">
              Empieza por: {firstRouteLesson?.title || 'Granularidad y el fan-out silencioso en los JOIN'}
            </h2>
            <p className="home-onboarding-card__goal">
              {firstRouteLesson?.goal ||
                'Identificar el grano exacto de cada tabla antes de cruzarlas en SQL y evitar que un JOIN 1:N multiplique importes sin dar error.'}
            </p>
          </div>

          <div className="home-onboarding-card__meta tabular">
            <span>
              Duración estimada: {parseDurationMinutes(firstRouteLesson)} min
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Módulo:{' '}
              {MODULES.find((m) => m.id === firstRouteLesson?.moduleId)?.title ||
                'SQL relacional y control del grano'}
            </span>
          </div>

          <div className="home-onboarding-card__cta">
            <Button
              variant="primary"
              size="md"
              icon={Play}
              onClick={() => {
                if (firstRouteLesson) {
                  onOpenLesson?.(firstRouteLesson.stageId, firstRouteLesson.id);
                }
              }}
            >
              Empezar lección
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={Compass}
              onClick={() => onNavigate?.('roadmap')}
            >
              Explorar ruta completa
            </Button>
            {typeof onOpenDiagnostic === 'function' && (
              <Button
                variant="ghost"
                size="md"
                onClick={onOpenDiagnostic}
              >
                Hacer test diagnóstico (5 min)
              </Button>
            )}
          </div>

          <div className="home-onboarding-card__tracks">
            <div className="home-onboarding-card__tracks-head">
              <span className="home-onboarding-card__tracks-label">
                {activeTrackId
                  ? `Área seleccionada: ${trackMeta.name} (${trackMeta.short}). Puedes cambiarla cuando quieras:`
                  : 'Elige tu área de especialización (comparten el mismo tronco común):'}
              </span>
            </div>
            <div
              className="home-track-picker"
              role="radiogroup"
              aria-label="Seleccionar área de especialización"
            >
              {specializationChoices.map((t) => {
                const selected = activeTrackId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`home-track-choice ${selected ? 'is-selected' : ''}`.trim()}
                    data-track={t.id}
                    onClick={() => setTrack(t.id)}
                  >
                    <div className="home-track-choice__title-row">
                      <span
                        className={`home-track-dot home-track-dot--${t.id}`}
                        aria-hidden="true"
                      />
                      <strong>{t.name}</strong>
                      <span className="home-track-choice__short">{t.short}</span>
                    </div>
                    <span className="home-track-choice__desc">{t.summary}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      ) : (
        /* ESTADO CON PROGRESO: 1. Continuar, 2. Repaso de hoy, 3. Siguiente en tu ruta, 4. Esta semana */
        <div className="home-active-stack" data-testid="home-progress-view">
          {/* 1. Bloque principal "Continuar" */}
          {activeContinueLesson && (
            <section
              className="home-continue-card"
              aria-labelledby="home-continue-heading"
            >
              <div className="home-continue-card__body">
                <div className="home-continue-card__meta tabular">
                  <span className="home-kicker">CONTINUAR</span>
                  <span aria-hidden="true">·</span>
                  <span>Sección actual: {activeSectionTitle}</span>
                  <span aria-hidden="true">·</span>
                  <span>{remainingMinutes} min restantes</span>
                </div>
                <h2 id="home-continue-heading" className="home-continue-card__title">
                  {activeContinueLesson.title}
                </h2>
                <p className="home-continue-card__goal">
                  {activeContinueLesson.goal}
                </p>
              </div>
              <div className="home-continue-card__actions">
                <Button
                  variant="primary"
                  size="md"
                  iconRight={ArrowRight}
                  onClick={() =>
                    onOpenLesson?.(
                      activeContinueLesson.stageId,
                      activeContinueLesson.id
                    )
                  }
                >
                  Continuar
                </Button>
              </div>
            </section>
          )}

          {/* 2. "Repaso de hoy": si es 0, una sola línea gris "Nada pendiente hoy", nunca tarjeta vacía */}
          <section className="home-review-block" aria-label="Repaso de hoy">
            {effectiveDueCount === 0 ? (
              <p className="home-review-line-empty" data-testid="home-review-zero">
                <span className="home-review-line-empty__label">Repaso de hoy:</span>{' '}
                <span>Nada pendiente hoy</span>
              </p>
            ) : (
              <div className="home-review-bar" data-testid="home-review-due">
                <div className="home-review-bar__info">
                  <Repeat size={16} aria-hidden="true" className="home-review-bar__icon" />
                  <span className="home-review-bar__title">Repaso de hoy</span>
                  <span className="home-review-bar__sep" aria-hidden="true">·</span>
                  <span className="home-review-bar__count tabular">
                    {effectiveDueCount}{' '}
                    {effectiveDueCount === 1
                      ? 'tarjeta vencida'
                      : 'tarjetas vencidas'}
                  </span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigate?.('practice')}
                >
                  Revisar tarjetas
                </Button>
              </div>
            )}
          </section>

          {/* 3. "Siguiente en tu ruta": las próximas 3 lecciones como lista compacta de filas */}
          {upcomingLessons.length > 0 && (
            <section
              className="home-next-section"
              aria-labelledby="home-next-heading"
            >
              <div className="home-section-head">
                <h2 id="home-next-heading" className="home-section-title">
                  Siguiente en tu ruta
                </h2>
                <button
                  type="button"
                  className="home-text-link"
                  onClick={() => onNavigate?.('roadmap')}
                >
                  Ver ruta completa
                </button>
              </div>

              <ul className="home-next-list">
                {upcomingLessons.map((lesson) => {
                  const mod = MODULES.find((m) => m.id === lesson.moduleId);
                  const mins = parseDurationMinutes(lesson);
                  return (
                    <li key={lesson.id} className="home-next-row">
                      <button
                        type="button"
                        className="home-next-row__btn"
                        onClick={() => onOpenLesson?.(lesson.stageId, lesson.id)}
                      >
                        <span className="home-next-row__code tabular">
                          L{String(lesson.order).padStart(2, '0')}
                        </span>
                        <span className="home-next-row__main">
                          <span className="home-next-row__title">
                            {lesson.title}
                          </span>
                          <span className="home-next-row__sub">
                            {mod ? `${mod.title} · Nivel ${mod.level}` : lesson.subtitle}
                          </span>
                        </span>
                        <span className="home-next-row__mins tabular">
                          {mins} min
                        </span>
                        <ArrowRight
                          size={15}
                          aria-hidden="true"
                          className="home-next-row__arrow"
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* 4. "Esta semana": 7 celdas (L..D) con opacidad proporcional de --brand según studyMinutesByDay */}
          <section
            className="home-week-section"
            aria-labelledby="home-week-heading"
          >
            <div className="home-section-head">
              <h2 id="home-week-heading" className="home-section-title">
                Esta semana
              </h2>
              <span className="home-week-total tabular">
                {totalWeekMinutes} min acumulados
              </span>
            </div>

            <div
              className="home-week-grid"
              role="list"
              aria-label="Minutos estudiados por día de la semana"
            >
              {weekDays.map((day) => {
                const ratio =
                  day.minutes > 0
                    ? Math.min(1, Math.max(0.18, day.minutes / maxDayMinutes))
                    : 0;
                const pct = Math.round(ratio * 85);
                const cellBg =
                  day.minutes > 0
                    ? `color-mix(in srgb, var(--brand) ${pct}%, var(--surface))`
                    : 'var(--sunken)';

                return (
                  <div
                    key={day.date}
                    role="listitem"
                    className={`home-week-cell ${
                      day.minutes > 0 ? 'home-week-cell--active' : ''
                    }`.trim()}
                    title={`${day.name} (${day.date}): ${day.minutes} min`}
                  >
                    <span className="home-week-cell__day">{day.short}</span>
                    <span
                      className="home-week-cell__swatch"
                      style={{ '--cell-bg': cellBg }}
                      aria-hidden="true"
                    />
                    <span className="home-week-cell__mins tabular">
                      {day.minutes > 0 ? `${day.minutes} m` : '0 m'}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default HomeView;
