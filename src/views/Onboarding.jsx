import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChevronDown, Check } from 'lucide-react';
import { Button } from '../components/ui/index.js';
import { TRACKS } from '../data/catalog/tracks.js';
import { LEVELS } from '../data/catalog/levels.js';
import { MODULES, getTrackPath } from '../data/lessons/index.js';
import {
  DiagnosticModal,
  collectKnownLessonIdsForLevel,
} from '../components/DiagnosticModal.jsx';
import {
  completeOnboarding,
  markLessonKnown,
  setStartLevel,
  setTrack,
  useProfile,
} from '../state/store.js';
import '../styles/views/onboarding.css';

const AREA_CARDS = [
  {
    id: 'de',
    headline: 'Construir la infraestructura',
    roleLabel: 'Ingeniería de Datos (DE)',
  },
  {
    id: 'da',
    headline: 'Responder preguntas con datos',
    roleLabel: 'Análisis de Datos (DA)',
  },
  {
    id: 'bi',
    headline: 'Dar a la empresa sus tableros y métricas',
    roleLabel: 'Business Intelligence (BI)',
  },
];

const START_OPTIONS = [
  {
    id: 'level-0',
    level: 0,
    headline: 'Desde cero (nivel 0)',
    tag: 'Nivel 0 · Cimientos',
    summary:
      'Empieza por qué es una tabla, tipos de dato, valores nulos, hojas de cálculo con criterio, estadística descriptiva, indicadores de negocio, terminal, Git y Python inicial.',
    ctaLabel: 'Empezar desde nivel 0',
  },
  {
    id: 'level-1',
    level: 1,
    headline: 'Sé algo de SQL y hojas de cálculo (nivel 1)',
    tag: 'Nivel 1 · Fundamentos',
    summary:
      'Marca los 5 módulos de Cimientos como sabidos y arranca directamente en SQL desde cero, control del grano en JOINs, modelo relacional, Python tabular y visualización honesta.',
    ctaLabel: 'Empezar en nivel 1',
  },
  {
    id: 'diagnostic',
    level: null,
    headline: 'Trabajo con datos (prueba de nivel)',
    tag: '10 preguntas · Niveles 0 a 3',
    summary:
      'Responde 10 preguntas de dificultad creciente sobre el tronco común y tu área elegida. Calcularemos tu nivel sugerido y podrás ajustarlo antes de confirmar.',
    ctaLabel: 'Hacer prueba de 10 preguntas',
  },
];

export function Onboarding({
  initialStep = 1,
  onComplete,
  onSkip,
}) {
  const profile = useProfile();

  const [step, setStep] = useState(() =>
    initialStep === 1 || initialStep === 2 || initialStep === 3 ? initialStep : 1
  );
  const [selectedTrack, setSelectedTrack] = useState(
    () => profile.track || 'da'
  );
  const [selectedLevel, setSelectedLevel] = useState(
    () => Number(profile.startLevel) || 0
  );
  const [startOptionId, setStartOptionId] = useState(() =>
    Number(profile.startLevel) === 1
      ? 'level-1'
      : Number(profile.startLevel) >= 2
        ? 'diagnostic'
        : 'level-0'
  );
  const [showUnsure, setShowUnsure] = useState(false);
  const [diagnosticModalOpen, setDiagnosticModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
    if (typeof document !== 'undefined') {
      const mainEl = document.querySelector('.app-main');
      if (mainEl) mainEl.scrollTop = 0;
    }
  }, [step]);

  const areaTracks = useMemo(
    () =>
      AREA_CARDS.map((card) => {
        const catalogTrack = TRACKS.find((t) => t.id === card.id) || {};
        return {
          ...card,
          name: catalogTrack.name || card.roleLabel,
          short: catalogTrack.short || card.id.toUpperCase(),
          summary: catalogTrack.summary || '',
          workTasks: catalogTrack.workTasks || [],
          typicalDay: catalogTrack.typicalDay || [],
        };
      }),
    []
  );

  const currentTrackMeta = useMemo(
    () =>
      areaTracks.find((t) => t.id === selectedTrack) || areaTracks[1],
    [areaTracks, selectedTrack]
  );

  const routeMetrics = useMemo(() => {
    const coreMods = MODULES.filter((m) => m.track === 'core');
    const areaMods = MODULES.filter((m) => m.track === selectedTrack);
    const fullPath = getTrackPath(selectedTrack);

    const coreLessonsCount = coreMods.reduce(
      (acc, m) => acc + (m.lessons?.length || 0),
      0
    );
    const areaLessonsCount = areaMods.reduce(
      (acc, m) => acc + (m.lessons?.length || 0),
      0
    );
    const totalLessonsCount = coreLessonsCount + areaLessonsCount;

    const totalMinutes = fullPath.reduce(
      (acc, m) => acc + (m.estimatedMinutes || 0),
      0
    );
    const totalHours = Math.max(1, Math.round(totalMinutes / 60));

    const knownMods = fullPath.filter((m) => m.level < selectedLevel);
    const knownLessonsCount = knownMods.reduce(
      (acc, m) => acc + (m.lessons?.length || 0),
      0
    );
    const activeMinutes = fullPath
      .filter((m) => m.level >= selectedLevel)
      .reduce((acc, m) => acc + (m.estimatedMinutes || 0), 0);
    const activeHours = Math.max(1, Math.round(activeMinutes / 60));

    const byLevel = LEVELS.map((lvl) => {
      const modsInLevel = fullPath.filter((m) => m.level === lvl.level);
      const lessonsInLevel = modsInLevel.reduce(
        (acc, m) => acc + (m.lessons?.length || 0),
        0
      );
      const minsInLevel = modsInLevel.reduce(
        (acc, m) => acc + (m.estimatedMinutes || 0),
        0
      );
      return {
        ...lvl,
        modulesCount: modsInLevel.length,
        lessonsCount: lessonsInLevel,
        hours: Math.max(1, Math.round(minsInLevel / 60)),
      };
    });

    return {
      coreModulesCount: coreMods.length,
      areaModulesCount: areaMods.length,
      coreLessonsCount,
      areaLessonsCount,
      totalLessonsCount,
      totalHours,
      knownLessonsCount,
      activeHours,
      byLevel,
    };
  }, [selectedTrack, selectedLevel]);

  const handleSkipOnboarding = () => {
    const fallbackTrack = selectedTrack || profile.track || 'da';
    const fallbackLevel = Number.isFinite(selectedLevel) ? selectedLevel : 0;
    setTrack(fallbackTrack);
    setStartLevel(fallbackLevel);
    completeOnboarding({
      track: fallbackTrack,
      startLevel: fallbackLevel,
    });
    if (typeof onSkip === 'function') {
      onSkip({ track: fallbackTrack, startLevel: fallbackLevel });
    } else if (typeof onComplete === 'function') {
      onComplete({ track: fallbackTrack, startLevel: fallbackLevel, skipped: true });
    }
  };

  const handleChooseTrack = (trackId, advanceImmediately = true) => {
    setSelectedTrack(trackId);
    setTrack(trackId);
    if (advanceImmediately) {
      setStep(2);
    }
  };

  const handleChooseStartOption = (option) => {
    setStartOptionId(option.id);
    if (option.id === 'diagnostic') {
      setDiagnosticModalOpen(true);
      return;
    }
    const nextLvl = Number(option.level) || 0;
    setSelectedLevel(nextLvl);
    setStartLevel(nextLvl);
    setStep(3);
  };

  const handleDiagnosticCompleted = (result) => {
    const resolvedTrack =
      result?.track === 'de' || result?.track === 'da' || result?.track === 'bi'
        ? result.track
        : selectedTrack;
    const resolvedLevel = Math.min(
      3,
      Math.max(0, Number(result?.confirmedLevel ?? result?.startLevel ?? 0))
    );
    setSelectedTrack(resolvedTrack);
    setSelectedLevel(resolvedLevel);
    setStartOptionId('diagnostic');
    setDiagnosticModalOpen(false);
    setStep(3);
  };

  const handleFinishOnboarding = () => {
    const finalTrack = selectedTrack || 'da';
    const finalLevel = Math.min(4, Math.max(0, Number(selectedLevel) || 0));

    if (finalLevel > 0) {
      const knownIds = collectKnownLessonIdsForLevel(finalTrack, finalLevel);
      if (knownIds.length > 0) {
        markLessonKnown(knownIds);
      }
    }

    setTrack(finalTrack);
    setStartLevel(finalLevel);
    completeOnboarding({
      track: finalTrack,
      startLevel: finalLevel,
    });

    if (typeof onComplete === 'function') {
      onComplete({
        track: finalTrack,
        startLevel: finalLevel,
      });
    }
  };

  const startLevelMeta =
    LEVELS.find((l) => l.level === selectedLevel) || LEVELS[0];

  return (
    <section
      className="onboarding-view"
      aria-labelledby="onboarding-screen-title"
      data-onboarding-step={step}
    >
      <DiagnosticModal
        isOpen={diagnosticModalOpen}
        initialTrack={selectedTrack}
        deferCompleteOnboarding
        onClose={() => setDiagnosticModalOpen(false)}
        onCompleteDiagnostic={handleDiagnosticCompleted}
      />

      {/* Barra superior con pasos y enlace para saltar en las 3 pantallas */}
      <header className="onboarding-top">
        <div className="onboarding-top__meta">
          <span className="onboarding-top__brand">
            Grano · De la primera fila al tablero.
          </span>
          <span className="onboarding-top__sep" aria-hidden="true">
            ·
          </span>
          <ol className="onboarding-steps" aria-label="Pasos de configuración inicial">
            {[
              { num: 1, label: 'Área' },
              { num: 2, label: 'Nivel inicial' },
              { num: 3, label: 'Resumen' },
            ].map((item) => {
              const isActive = step === item.num;
              const isDone = step > item.num;
              return (
                <li key={item.num} className="onboarding-steps__item">
                  <button
                    type="button"
                    className={[
                      'onboarding-steps__btn',
                      isActive ? 'is-active' : '',
                      isDone ? 'is-done' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setStep(item.num)}
                    aria-current={isActive ? 'step' : undefined}
                  >
                    <span className="onboarding-steps__dot" aria-hidden="true" />
                    <span>
                      {item.num}. {item.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <button
          type="button"
          className="onboarding-skip-btn"
          onClick={handleSkipOnboarding}
        >
          Ya sé lo que quiero
        </button>
      </header>

      {/* =====================================================================
          PANTALLA 1: ¿Qué quieres hacer con datos?
          ===================================================================== */}
      {step === 1 && (
        <>
          <div className="onboarding-hero">
            <span className="onboarding-hero__eyebrow tabular">
              Paso 1 de 3 · Elección de especialidad
            </span>
            <h1 id="onboarding-screen-title" className="onboarding-hero__title">
              ¿Qué quieres hacer con datos?
            </h1>
            <p className="onboarding-hero__lead">
              Las tres áreas comparten el tronco común de SQL, modelado y Python. Elige por cuál quieres enfocar tu ruta; podrás cambiarla cuando quieras sin perder progreso.
            </p>
          </div>

          <div
            className="onboarding-cards-grid"
            role="radiogroup"
            aria-label="Especialidades de datos"
          >
            {areaTracks.map((area) => {
              const isSelected = selectedTrack === area.id;
              return (
                <button
                  key={area.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  data-track={area.id}
                  className={`onboarding-card ${
                    isSelected ? 'is-selected' : ''
                  }`.trim()}
                  onClick={() => handleChooseTrack(area.id, true)}
                >
                  <div className="onboarding-card__top">
                    <div className="onboarding-card__header-row">
                      <span className="onboarding-card__area-chip">
                        <span
                          className="onboarding-card__dot"
                          aria-hidden="true"
                        />
                        <span>{area.roleLabel}</span>
                      </span>
                      {isSelected && <Check size={16} aria-hidden="true" />}
                    </div>

                    <h2 className="onboarding-card__title">{area.headline}</h2>
                    <p className="onboarding-card__summary">{area.summary}</p>
                  </div>

                  <ul className="onboarding-card__tasks">
                    {area.workTasks.map((task) => (
                      <li key={task}>{task}</li>
                    ))}
                  </ul>

                  <span className="onboarding-card__cta">
                    <span>Elegir {area.name}</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </span>
                </button>
              );
            })}
          </div>

          <div className="onboarding-unsure">
            <div className="onboarding-unsure__bar">
              <button
                type="button"
                className="onboarding-unsure-toggle"
                aria-expanded={showUnsure}
                onClick={() => setShowUnsure((prev) => !prev)}
              >
                <span>Aún no lo sé</span>
                <ChevronDown size={16} aria-hidden="true" />
              </button>

              <div className="onboarding-footer__actions">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setStep(2)}
                >
                  <span>Continuar con {currentTrackMeta.name}</span>
                  <ArrowRight size={16} />
                </Button>
              </div>
            </div>

            {showUnsure && (
              <div
                className="onboarding-unsure__panel"
                aria-label="Un día de trabajo típico en cada área"
              >
                <p className="onboarding-unsure__intro">
                  Así se ve <strong>un día de trabajo típico</strong> en cada puesto dentro de un equipo de datos:
                </p>

                <div className="onboarding-day-grid">
                  {areaTracks.map((area) => (
                    <div
                      key={area.id}
                      className="onboarding-day-col"
                      data-track={area.id}
                    >
                      <div>
                        <div className="onboarding-day-col__head">
                          <span
                            className="onboarding-card__dot"
                            aria-hidden="true"
                          />
                          <span>{area.name}</span>
                        </div>
                        <p className="onboarding-day-col__label">
                          Un día de trabajo típico
                        </p>
                        <ul className="onboarding-day-list">
                          {area.typicalDay.map((line) => (
                            <li
                              key={line}
                              className="onboarding-day-list__item"
                            >
                              {line}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleChooseTrack(area.id, true)}
                      >
                        Elegir {area.short}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* =====================================================================
          PANTALLA 2: ¿Desde dónde empiezas?
          ===================================================================== */}
      {step === 2 && (
        <>
          <div className="onboarding-hero">
            <span className="onboarding-hero__eyebrow tabular">
              Paso 2 de 3 · Punto de partida ({currentTrackMeta.name})
            </span>
            <h1 id="onboarding-screen-title" className="onboarding-hero__title">
              ¿Desde dónde empiezas?
            </h1>
            <p className="onboarding-hero__lead">
              Si ya tienes experiencia previa, marcaremos los niveles anteriores como sabidos para que empieces directamente donde te aporta valor. Nada queda bloqueado.
            </p>
          </div>

          <div
            className="onboarding-levels-list"
            role="radiogroup"
            aria-label="Punto de partida"
          >
            {START_OPTIONS.map((opt) => {
              const isSelected = startOptionId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  data-track={selectedTrack}
                  className={`onboarding-card ${
                    isSelected ? 'is-selected' : ''
                  }`.trim()}
                  onClick={() => handleChooseStartOption(opt)}
                >
                  <div className="onboarding-card__top">
                    <div className="onboarding-card__header-row">
                      <span className="onboarding-card__area-chip tabular">
                        {opt.tag}
                      </span>
                      {isSelected && <Check size={16} aria-hidden="true" />}
                    </div>

                    <h2 className="onboarding-card__title">{opt.headline}</h2>
                    <p className="onboarding-card__summary">{opt.summary}</p>
                  </div>

                  <span className="onboarding-card__cta">
                    <span>{opt.ctaLabel}</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </span>
                </button>
              );
            })}
          </div>

          <footer className="onboarding-footer">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setStep(1)}
            >
              Cambiar área
            </Button>

            <div className="onboarding-footer__actions">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setDiagnosticModalOpen(true)}
              >
                Abrir prueba de nivel (10 preguntas)
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setStep(3)}
              >
                <span>Ver resumen de ruta</span>
                <ArrowRight size={16} />
              </Button>
            </div>
          </footer>
        </>
      )}

      {/* =====================================================================
          PANTALLA 3: Resumen de la ruta y botón Empezar
          ===================================================================== */}
      {step === 3 && (
        <>
          <div className="onboarding-hero">
            <span className="onboarding-hero__eyebrow tabular">
              Paso 3 de 3 · Resumen de tu ruta
            </span>
            <h1 id="onboarding-screen-title" className="onboarding-hero__title">
              Tu plan de estudio en Grano
            </h1>
            <p className="onboarding-hero__lead">
              Revisa la composición de tu ruta antes de empezar. Puedes alternar entre áreas o abrir cualquier módulo en el orden que necesites.
            </p>
          </div>

          <div className="onboarding-summary-card" data-track={selectedTrack}>
            <h2 className="onboarding-summary-card__headline tabular">
              Tu ruta: Tronco común ({routeMetrics.coreLessonsCount} lecciones) →{' '}
              {currentTrackMeta.name} ({routeMetrics.areaLessonsCount} lecciones).{' '}
              Unas {routeMetrics.totalHours} horas.
            </h2>

            <p className="onboarding-summary-card__sub">
              {selectedLevel === 0 ? (
                <>
                  Empezarás desde el <strong>Nivel 0 ({startLevelMeta.name})</strong>. Recorrerás los {routeMetrics.coreModulesCount} módulos del tronco común y los {routeMetrics.areaModulesCount} módulos de especialidad en {currentTrackMeta.name}.
                </>
              ) : (
                <>
                  Empezarás en el <strong>Nivel {selectedLevel} ({startLevelMeta.name})</strong>. Las{' '}
                  <strong>{routeMetrics.knownLessonsCount} lecciones</strong> de niveles anteriores se marcarán como{' '}
                  <strong>sabidas</strong> (quedan unas {routeMetrics.activeHours} horas efectivas de estudio).
                </>
              )}
            </p>

            <div className="onboarding-summary-metrics">
              <div className="onboarding-metric">
                <span className="onboarding-metric__val tabular">
                  {currentTrackMeta.short}
                </span>
                <span className="onboarding-metric__label">
                  {currentTrackMeta.name}
                </span>
              </div>
              <div className="onboarding-metric">
                <span className="onboarding-metric__val tabular">
                  Nivel {selectedLevel}
                </span>
                <span className="onboarding-metric__label">
                  Inicio: {startLevelMeta.name}
                </span>
              </div>
              <div className="onboarding-metric">
                <span className="onboarding-metric__val tabular">
                  {routeMetrics.totalLessonsCount} lecciones
                </span>
                <span className="onboarding-metric__label">
                  {routeMetrics.coreLessonsCount} común + {routeMetrics.areaLessonsCount} {currentTrackMeta.short}
                </span>
              </div>
              <div className="onboarding-metric">
                <span className="onboarding-metric__val tabular">
                  ~{selectedLevel > 0 ? routeMetrics.activeHours : routeMetrics.totalHours} h
                </span>
                <span className="onboarding-metric__label">
                  Tiempo estimado restante
                </span>
              </div>
            </div>

            <div className="onboarding-summary-stages">
              <h3 className="onboarding-summary-stages__title">
                Estructura por niveles (0 a 4)
              </h3>

              {routeMetrics.byLevel.map((lvl) => {
                const isKnownLevel = lvl.level < selectedLevel;
                const isStartLevel = lvl.level === selectedLevel;
                return (
                  <div
                    key={lvl.level}
                    className={[
                      'onboarding-stage-row',
                      isKnownLevel ? 'is-known' : '',
                      isStartLevel ? 'is-start' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <div className="onboarding-stage-row__left">
                      <span className="onboarding-stage-row__num tabular">
                        N{lvl.level}
                      </span>
                      <strong>{lvl.name}</strong>
                      <span>— {lvl.summary}</span>
                    </div>
                    <span className="onboarding-stage-row__right tabular">
                      {isKnownLevel
                        ? `${lvl.lessonsCount} lecciones · Sabido`
                        : isStartLevel
                          ? `${lvl.lessonsCount} lecciones · Empezarás aquí`
                          : `${lvl.lessonsCount} lecciones · ~${lvl.hours} h`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <footer className="onboarding-footer">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setStep(2)}
            >
              Cambiar punto de partida
            </Button>

            <div className="onboarding-footer__actions">
              <Button
                variant="primary"
                size="lg"
                onClick={handleFinishOnboarding}
              >
                <span>Empezar</span>
                <ArrowRight size={16} />
              </Button>
            </div>
          </footer>
        </>
      )}
    </section>
  );
}

export default Onboarding;
