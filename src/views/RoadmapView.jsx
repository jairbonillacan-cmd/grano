import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, ArrowUpRight } from 'lucide-react';
import { Button, Segmented } from '../components/ui/index.js';
import { TRACKS } from '../data/catalog/tracks.js';
import { LEVELS } from '../data/catalog/levels.js';
import { MODULES } from '../data/catalog/modules.js';
import { LESSONS_BY_ID } from '../data/lessons/index.js';
import { setTrack, useProfile, useProgress } from '../state/store.js';
import { Onboarding } from './Onboarding.jsx';
import '../styles/views/onboarding.css';
import '../styles/views/roadmap.css';

const AREA_SEGMENT_OPTIONS = [
  { value: 'de', label: 'DE' },
  { value: 'da', label: 'DA' },
  { value: 'bi', label: 'BI' },
  { value: 'all', label: 'Todo' },
];

const TRACK_SHORT_LABELS = {
  core: 'Común',
  de: 'DE',
  da: 'DA',
  bi: 'BI',
};

const TRACK_ORDER = {
  core: 0,
  de: 1,
  da: 2,
  bi: 3,
};

const MODULE_STATUS_LABELS = {
  pending: 'Pendiente',
  in_progress: 'En curso',
  completed: 'Hecho',
  known: 'Sabido',
};

const LESSON_STATUS_LABELS = {
  pending: 'Pendiente',
  in_progress: 'En curso',
  completed: 'Hecha',
  known: 'Sabida',
};

function resolveLessonStatus(lesson, progressLessons, completedSet, lessonSteps) {
  const matchedV2 =
    LESSONS_BY_ID[lesson.id] ||
    (lesson.legacyId ? LESSONS_BY_ID[lesson.legacyId] : null);
  const candidateIds = [
    lesson.id,
    lesson.legacyId,
    matchedV2?.id,
    matchedV2?.legacyId,
  ].filter(Boolean);

  for (const cid of candidateIds) {
    if (progressLessons?.[cid]?.status === 'known') {
      return 'known';
    }
  }
  for (const cid of candidateIds) {
    if (
      progressLessons?.[cid]?.status === 'completed' ||
      completedSet.has(cid)
    ) {
      return 'completed';
    }
  }
  for (const cid of candidateIds) {
    const stepVal = Number(lessonSteps?.[cid] ?? 0);
    if (progressLessons?.[cid]?.status === 'in_progress' || stepVal > 0) {
      return 'in_progress';
    }
  }
  return 'pending';
}

export function RoadmapView({
  completedIds = [],
  lessonSteps = {},
  diagnosticResult = null,
  nextRecommendedLesson = null,
  customModules = null,
  onOpenLesson = () => {},
  onOpenDiagnostic = () => {},
}) {
  const profile = useProfile();
  const progress = useProgress();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [areaFilter, setAreaFilter] = useState(() => profile.track || 'all');
  const [expandedModuleIds, setExpandedModuleIds] = useState(
    () => new Set(['c0-datos', 'c1-sql-joins'])
  );
  const [injectedModules, setInjectedModules] = useState(() =>
    typeof window !== 'undefined' && Array.isArray(window.__GRANO_TEST_MODULES__)
      ? window.__GRANO_TEST_MODULES__
      : null
  );

  useEffect(() => {
    setAreaFilter(profile.track || 'all');
  }, [profile.track]);

  useEffect(() => {
    if (profile.onboarded && !showOnboarding) {
      if (typeof window !== 'undefined') window.scrollTo(0, 0);
      if (typeof document !== 'undefined') {
        const mainEl = document.querySelector('.app-main');
        if (mainEl) mainEl.scrollTop = 0;
      }
    }
  }, [profile.onboarded, showOnboarding]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleInjected = (event) => {
      if (Array.isArray(event?.detail)) {
        setInjectedModules(event.detail);
      } else if (Array.isArray(window.__GRANO_TEST_MODULES__)) {
        setInjectedModules([...window.__GRANO_TEST_MODULES__]);
      } else {
        setInjectedModules(null);
      }
    };
    window.addEventListener('grano:test-modules', handleInjected);
    return () => window.removeEventListener('grano:test-modules', handleInjected);
  }, []);

  const catalogModules = customModules || injectedModules || MODULES;

  const completedSet = useMemo(() => new Set(completedIds), [completedIds]);
  const progressLessons = progress?.lessons || {};

  const moduleTitleById = useMemo(() => {
    const map = new Map();
    catalogModules.forEach((m) => {
      map.set(m.id, m.title);
    });
    return map;
  }, [catalogModules]);

  const visibleModules = useMemo(() => {
    const filtered =
      areaFilter === 'all'
        ? catalogModules
        : catalogModules.filter(
            (m) => m.track === 'core' || m.track === areaFilter
          );

    return [...filtered].sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      const trackDiff =
        (TRACK_ORDER[a.track] ?? 9) - (TRACK_ORDER[b.track] ?? 9);
      if (trackDiff !== 0) return trackDiff;
      return 0;
    });
  }, [catalogModules, areaFilter]);

  const enrichedModules = useMemo(() => {
    return visibleModules.map((mod, idx) => {
      const lessons = Array.isArray(mod.lessons) ? mod.lessons : [];
      let knownCount = 0;
      let completedCount = 0;
      let inProgressCount = 0;

      const enrichedLessons = lessons.map((lesson) => {
        const status = resolveLessonStatus(
          lesson,
          progressLessons,
          completedSet,
          lessonSteps
        );
        if (status === 'known') knownCount += 1;
        else if (status === 'completed') completedCount += 1;
        else if (status === 'in_progress') inProgressCount += 1;

        return {
          ...lesson,
          computedStatus: status,
        };
      });

      const totalLessons = enrichedLessons.length;
      const doneLessons = knownCount + completedCount;

      let moduleStatus = 'pending';
      if (totalLessons > 0 && doneLessons === totalLessons) {
        moduleStatus =
          completedCount === 0 && knownCount > 0 ? 'known' : 'completed';
      } else if (doneLessons > 0 || inProgressCount > 0) {
        moduleStatus = 'in_progress';
      }

      const estimatedMinutes =
        typeof mod.estimatedMinutes === 'number'
          ? mod.estimatedMinutes
          : enrichedLessons.reduce((acc, l) => acc + (Number(l.minutes) || 0), 0);

      const filledCells =
        totalLessons > 0
          ? Math.min(9, Math.round((doneLessons / totalLessons) * 9))
          : 0;

      const prereqTitles = Array.isArray(mod.prerequisites)
        ? mod.prerequisites
            .map((pid) => moduleTitleById.get(pid) || pid)
            .filter(Boolean)
        : [];

      const hasRecommendedLesson =
        Boolean(nextRecommendedLesson) &&
        enrichedLessons.some(
          (l) =>
            l.id === nextRecommendedLesson.id ||
            (l.legacyId && l.legacyId === nextRecommendedLesson.id)
        );

      return {
        ...mod,
        globalOrder: idx + 1,
        enrichedLessons,
        totalLessons,
        doneLessons,
        knownCount,
        completedCount,
        inProgressCount,
        moduleStatus,
        estimatedMinutes,
        filledCells,
        prereqTitles,
        hasRecommendedLesson,
      };
    });
  }, [
    visibleModules,
    progressLessons,
    completedSet,
    lessonSteps,
    moduleTitleById,
    nextRecommendedLesson,
  ]);

  const routeStats = useMemo(() => {
    let totalLessons = 0;
    let completedLessons = 0;
    let knownLessons = 0;
    let remainingMinutes = 0;

    enrichedModules.forEach((mod) => {
      mod.enrichedLessons.forEach((lesson) => {
        totalLessons += 1;
        const mins = Number(lesson.minutes) || 25;
        if (lesson.computedStatus === 'completed') {
          completedLessons += 1;
        } else if (lesson.computedStatus === 'known') {
          knownLessons += 1;
        } else {
          remainingMinutes += mins;
        }
      });
    });

    const doneLessons = completedLessons + knownLessons;
    const remainingHours = Math.max(0, Math.round(remainingMinutes / 60));
    const pct =
      totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;

    return {
      totalLessons,
      doneLessons,
      completedLessons,
      knownLessons,
      remainingHours,
      pct,
    };
  }, [enrichedModules]);

  const activeTrackMeta = useMemo(() => {
    if (areaFilter === 'all') {
      return {
        id: 'all',
        name: 'Catálogo completo (Tronco común + DE + DA + BI)',
        short: 'Todo',
        summary:
          'Los 32 módulos del currículo organizados en 5 niveles progresivos.',
      };
    }
    const found = TRACKS.find((t) => t.id === areaFilter);
    return (
      found || {
        id: 'da',
        name: 'Análisis de Datos',
        short: 'DA',
        summary: 'Tronco común + especialidad seleccionada.',
      }
    );
  }, [areaFilter]);

  const handleAreaChange = (nextArea) => {
    setAreaFilter(nextArea);
    if (nextArea === 'all') {
      setTrack(null);
    } else if (nextArea === 'de' || nextArea === 'da' || nextArea === 'bi') {
      setTrack(nextArea);
    }
  };

  const toggleModuleExpanded = (moduleId) => {
    setExpandedModuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  if (!profile.onboarded || showOnboarding) {
    return (
      <Onboarding
        onComplete={() => setShowOnboarding(false)}
        onSkip={() => setShowOnboarding(false)}
      />
    );
  }

  return (
    <div className="roadmap-view" data-active-area={areaFilter}>
      <header className="roadmap-header">
        <div className="roadmap-header__top">
          <div className="roadmap-header__title-group">
            <span className="roadmap-header__eyebrow tabular">
              Currículo Grano · 5 niveles · {enrichedModules.length} módulos
            </span>
            <h1 className="roadmap-header__title">Tu ruta</h1>
            <p className="roadmap-header__subtitle">
              {areaFilter === 'all'
                ? 'Explora los 32 módulos del tronco común y las tres especialidades (Ingeniería, Análisis y Business Intelligence).'
                : `Tronco común compartido + especialidad en ${activeTrackMeta.name}. Ningún módulo tiene candado: avanza en orden o consulta cualquier tema cuando lo necesites.`}
            </p>
          </div>

          <div className="roadmap-header__actions">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowOnboarding(true)}
            >
              Cambiar objetivo
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenDiagnostic}
            >
              {diagnosticResult
                ? 'Repetir prueba de nivel'
                : 'Prueba de nivel (10 preguntas)'}
            </Button>
          </div>
        </div>

        <div className="roadmap-toolbar">
          <div className="roadmap-toolbar__filter">
            <span className="roadmap-toolbar__label">Área</span>
            <Segmented
              options={AREA_SEGMENT_OPTIONS}
              value={areaFilter}
              onChange={handleAreaChange}
              ariaLabel="Filtrar ruta por área de especialidad"
            />
          </div>

          <div className="roadmap-toolbar__area-info">
            <span
              className="roadmap-area-dot"
              data-track={areaFilter === 'all' ? 'core' : areaFilter}
              aria-hidden="true"
            />
            <span>
              <strong>{activeTrackMeta.name}</strong>
              {profile.startLevel > 0
                ? ` · Inicio recomendado en Nivel ${profile.startLevel}`
                : ' · Desde Nivel 0 (Cimientos)'}
            </span>
          </div>
        </div>

        <div
          className="roadmap-progress-strip"
          role="region"
          aria-label="Progreso total de la ruta"
        >
          <div className="roadmap-progress-strip__row">
            <span className="roadmap-progress-strip__stat tabular">
              {routeStats.doneLessons} de {routeStats.totalLessons} lecciones ·{' '}
              {routeStats.remainingHours} h restantes
            </span>
            <span className="roadmap-progress-strip__sub tabular">
              {routeStats.pct}% completado
              {routeStats.knownLessons > 0
                ? ` (${routeStats.completedLessons} hechas · ${routeStats.knownLessons} sabidas)`
                : ''}
            </span>
          </div>

          <div
            className="roadmap-progress-strip__bar"
            role="progressbar"
            aria-valuenow={routeStats.pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${routeStats.doneLessons} de ${routeStats.totalLessons} lecciones (${routeStats.pct}%)`}
          >
            <div
              className="roadmap-progress-strip__fill"
              style={{ width: `${routeStats.pct}%` }}
            />
          </div>
        </div>
      </header>

      <div className="roadmap-levels">
        {LEVELS.map((lvl) => {
          const modulesInLevel = enrichedModules.filter(
            (m) => m.level === lvl.level
          );
          if (modulesInLevel.length === 0) return null;

          const lessonsInLevel = modulesInLevel.reduce(
            (acc, m) => acc + m.totalLessons,
            0
          );
          const doneLessonsInLevel = modulesInLevel.reduce(
            (acc, m) => acc + m.doneLessons,
            0
          );
          const doneModulesInLevel = modulesInLevel.filter(
            (m) => m.moduleStatus === 'completed' || m.moduleStatus === 'known'
          ).length;

          const isStartLevel =
            Number(profile.startLevel) > 0 &&
            lvl.level === Number(profile.startLevel);

          return (
            <section
              key={lvl.level}
              className={`roadmap-level ${
                isStartLevel ? 'is-start-level' : ''
              }`.trim()}
              aria-labelledby={`roadmap-level-heading-${lvl.level}`}
              data-level={lvl.level}
            >
              <div className="roadmap-level__header">
                <div className="roadmap-level__title-wrap">
                  <div className="roadmap-level__heading-row">
                    <span className="roadmap-level__badge tabular">
                      Nivel {lvl.level}
                    </span>
                    <h2
                      id={`roadmap-level-heading-${lvl.level}`}
                      className="roadmap-level__title"
                    >
                      {lvl.name}
                    </h2>
                    {isStartLevel && (
                      <span className="roadmap-level__start-tag">
                        Tu punto de partida
                      </span>
                    )}
                  </div>
                  <p className="roadmap-level__summary">{lvl.summary}</p>
                </div>

                <div className="roadmap-level__counter tabular">
                  {doneLessonsInLevel}/{lessonsInLevel} lecciones ·{' '}
                  {doneModulesInLevel}/{modulesInLevel.length} módulos
                </div>
              </div>

              <div className="roadmap-modules-list">
                {modulesInLevel.map((mod) => {
                  const isExpanded = expandedModuleIds.has(mod.id);
                  const formattedIndex = String(mod.globalOrder).padStart(
                    2,
                    '0'
                  );
                  const statusLabel =
                    MODULE_STATUS_LABELS[mod.moduleStatus] || 'Pendiente';

                  return (
                    <article
                      key={mod.id}
                      className={[
                        'roadmap-module',
                        isExpanded ? 'is-expanded' : '',
                        `is-${mod.moduleStatus}`,
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      data-module-id={mod.id}
                      data-module-status={mod.moduleStatus}
                    >
                      <button
                        type="button"
                        className="roadmap-module__row"
                        aria-expanded={isExpanded}
                        aria-controls={`module-details-${mod.id}`}
                        onClick={() => toggleModuleExpanded(mod.id)}
                      >
                        <div className="roadmap-module__index">
                          <span className="roadmap-module__num tabular">
                            {formattedIndex}
                          </span>
                          <span
                            className="roadmap-module__grain"
                            aria-hidden="true"
                            title={`${mod.doneLessons} de ${mod.totalLessons} lecciones`}
                          >
                            {Array.from({ length: 9 }).map((_, cellIdx) => (
                              <span
                                key={cellIdx}
                                className={`roadmap-module__grain-cell ${
                                  cellIdx < mod.filledCells ? 'is-filled' : ''
                                }`.trim()}
                              />
                            ))}
                          </span>
                        </div>

                        <div className="roadmap-module__main">
                          <div className="roadmap-module__title-line">
                            <span className="roadmap-module__track-pill">
                              <span
                                className="roadmap-area-dot"
                                data-track={mod.track}
                                aria-hidden="true"
                              />
                              <span>
                                {TRACK_SHORT_LABELS[mod.track] || 'Común'}
                              </span>
                            </span>
                            <h3 className="roadmap-module__title">
                              {mod.title}
                            </h3>
                            {mod.hasRecommendedLesson && (
                              <span className="roadmap-module__next-tag">
                                Siguiente sugerida
                              </span>
                            )}
                          </div>
                          <p className="roadmap-module__goal">{mod.goal}</p>
                        </div>

                        <div className="roadmap-module__meta tabular">
                          <span className="roadmap-module__counts tabular">
                            {mod.doneLessons}/{mod.totalLessons} lecciones
                          </span>
                          <span className="roadmap-module__mins tabular">
                            {mod.estimatedMinutes} min
                          </span>
                          <span
                            className={`roadmap-status-badge roadmap-status-badge--${mod.moduleStatus}`}
                          >
                            {statusLabel}
                          </span>
                          <ChevronRight
                            size={16}
                            className="roadmap-module__chevron"
                            aria-hidden="true"
                          />
                        </div>
                      </button>

                      {isExpanded && (
                        <div
                          id={`module-details-${mod.id}`}
                          className="roadmap-module__details"
                        >
                          <p className="roadmap-module__prereq">
                            <strong>Recomendado antes:</strong>{' '}
                            {mod.prereqTitles.length > 0
                              ? mod.prereqTitles.join(' · ')
                              : 'Ningún módulo previo (puedes empezar directamente aquí).'}
                          </p>

                          {mod.enrichedLessons.length === 0 ? (
                            <p className="roadmap-module__empty">
                              Este módulo aún no tiene lecciones publicadas (en preparación).
                            </p>
                          ) : (
                            <ol className="roadmap-lessons-list">
                              {mod.enrichedLessons.map((lesson, lessonIdx) => {
                                const isPlanned = lesson.status === 'planned';
                                const lessonNum = String(lessonIdx + 1).padStart(
                                  2,
                                  '0'
                                );
                                const lessonStatusLabel =
                                  LESSON_STATUS_LABELS[lesson.computedStatus] ||
                                  'Pendiente';
                                const prevLesson =
                                  lessonIdx > 0
                                    ? mod.enrichedLessons[lessonIdx - 1]
                                    : null;
                                const showPrevRec =
                                  prevLesson &&
                                  prevLesson.computedStatus === 'pending' &&
                                  lesson.computedStatus === 'pending' &&
                                  lessonIdx === 1;

                                if (isPlanned) {
                                  return (
                                    <li
                                      key={lesson.id}
                                      className="roadmap-lessons-list__item"
                                    >
                                      <div
                                        className="roadmap-lesson-row is-planned"
                                        aria-disabled="true"
                                        data-lesson-id={lesson.id}
                                        data-lesson-status="planned"
                                      >
                                        <div className="roadmap-lesson-row__left">
                                          <span className="roadmap-lesson-row__num tabular">
                                            {lessonNum}
                                          </span>
                                          <div className="roadmap-lesson-row__copy">
                                            <span className="roadmap-lesson-row__title">
                                              {lesson.title}
                                            </span>
                                            {showPrevRec && (
                                              <span className="roadmap-lesson-row__rec">
                                                Recomendado antes:{' '}
                                                {prevLesson.title}
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        <div className="roadmap-lesson-row__right tabular">
                                          <span className="roadmap-lesson-row__mins tabular">
                                            {lesson.minutes} min
                                          </span>
                                          <span className="roadmap-lesson-row__planned-tag">
                                            En preparación
                                          </span>
                                        </div>
                                      </div>
                                    </li>
                                  );
                                }

                                return (
                                  <li
                                    key={lesson.id}
                                    className="roadmap-lessons-list__item"
                                  >
                                    <button
                                      type="button"
                                      className="roadmap-lesson-row is-existing"
                                      data-lesson-id={lesson.id}
                                      data-lesson-status={lesson.computedStatus}
                                      onClick={() =>
                                        onOpenLesson(
                                          lesson.legacyId || lesson.id
                                        )
                                      }
                                    >
                                      <div className="roadmap-lesson-row__left">
                                        <span className="roadmap-lesson-row__num tabular">
                                          {lessonNum}
                                        </span>
                                        <div className="roadmap-lesson-row__copy">
                                          <span className="roadmap-lesson-row__title">
                                            {lesson.title}
                                          </span>
                                          {showPrevRec && (
                                            <span className="roadmap-lesson-row__rec">
                                              Recomendado antes:{' '}
                                              {prevLesson.title}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="roadmap-lesson-row__right tabular">
                                        <span className="roadmap-lesson-row__mins tabular">
                                          {lesson.minutes} min
                                        </span>
                                        <span
                                          className={`roadmap-status-badge roadmap-status-badge--${lesson.computedStatus}`}
                                        >
                                          {lessonStatusLabel}
                                        </span>
                                        <ArrowUpRight
                                          size={14}
                                          aria-hidden="true"
                                        />
                                      </div>
                                    </button>
                                  </li>
                                );
                              })}
                            </ol>
                          )}

                          {(mod.projectSpec?.deliverable ||
                            mod.project?.title ||
                            typeof mod.project === 'string') && (
                            <div className="roadmap-module__project-foot">
                              {mod.projectSpec?.deliverable ? (
                                <>
                                  <span>
                                    <strong>Proyecto de cierre:</strong>{' '}
                                    {mod.projectSpec.prompt}
                                  </span>
                                  <span>
                                    <strong>Entregable:</strong>{' '}
                                    {mod.projectSpec.deliverable}
                                  </span>
                                </>
                              ) : mod.project?.title ? (
                                <>
                                  <span>
                                    <strong>Proyecto de cierre:</strong>{' '}
                                    {mod.project.title}
                                  </span>
                                  <span>
                                    <strong>Entregable:</strong>{' '}
                                    {mod.project.deliverable}
                                  </span>
                                </>
                              ) : (
                                <span>
                                  <strong>Proyecto de cierre:</strong>{' '}
                                  {mod.project}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </article>
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
