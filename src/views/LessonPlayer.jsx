import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  AlertCircle,
  AlertOctagon,
  CheckCircle2,
  Columns2,
  MousePointerClick,
  PanelLeftClose,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react';
import {
  AnswerOption,
  Badge,
  Button,
  Callout,
  Card,
  Chip,
  Kbd,
  ProgressBar,
  ProgressRing,
  Sheet,
  Stepper,
  Tabs,
  getRoleMeta,
  getStageNumber,
} from '../components/ui/index.js';
import LessonVisualizer from '../components/LessonVisualizers.jsx';
import { AuthenticCodeLab } from '../components/AuthenticCodeLab.jsx';
import { PipelineOrderChallenge } from '../components/PipelineOrderChallenge.jsx';
import {
  formatInlineText,
  stripSectionNumber,
  renderProseBody,
  splitGoalIntoChecks,
  isNumericCell,
} from '../utils/formatText.jsx';

export const LESSON_STEP_LABELS = [
  'Contexto',
  'Simulador',
  'Antipatrón vs. solución',
  'Los tres roles',
  'Comprueba lo aprendido',
  'Práctica',
  'Resumen',
];

export const LESSON_STEPS = LESSON_STEP_LABELS.map((label, idx) => ({
  id: `step-${idx}`,
  number: idx + 1,
  label,
}));

const SIMULATOR_INSTRUCTIONS = {
  'join-fanout-visualizer':
    'Cambia el modo de ejecución entre JOIN directo y CTE pre-agregada y observa el impacto en los ingresos.',
  'window-function-stepper':
    'Selecciona cada fila de la tabla para inspeccionar su partición y el valor devuelto por LAG().',
  'asof-join-timeline':
    'Alterna entre INNER JOIN exacto y ASOF JOIN y haz clic en cada compra para ver qué tarifa hereda.',
  'star-vs-obt-sim':
    'Cambia entre Esquema Estrella y One Big Table y compara el costo de actualización frente a lectura.',
  'scd2-timeline-builder':
    'Alterna entre SCD Tipo 1 y SCD Tipo 2 para observar cómo cambia la atribución histórica de ingresos.',
  'simpsons-paradox-explorer':
    'Desliza el porcentaje de tráfico móvil en octubre y observa cuándo se invierte el signo de la conversión global.',
  'row-vs-columnar-storage':
    'Compara el almacenamiento por filas frente a Parquet columnar y observa qué bloques de disco se saltan.',
  'arrow-zero-copy-sim':
    'Alterna entre serialización tradicional y Apache Arrow Zero-Copy e inspecciona cada salto en memoria.',
  'iceberg-v3-snapshot-explorer':
    'Cambia entre el Snapshot #1 y el Snapshot #2 para ver cómo operan los vectores de borrado en Iceberg v3.',
  'dbt-sqlmesh-dag-explorer':
    'Selecciona cada capa del grafo de transformación para inspeccionar las garantías que aplica.',
  'cohort-retention-sim':
    'Alterna entre la vista global mezclada y la matriz por cohorte y ajusta la mejora de onboarding día 7.',
  'ab-test-cuped-simulator':
    'Activa o desactiva el ajuste de varianza CUPED y observa cómo se estrecha el intervalo de confianza al 95%.',
  'bi-anti-slop-comparator':
    'Alterna entre el reporte tradicional saturado y el diseño de alta densidad dato-tinta.',
  'streaming-watermark-lab':
    'Compara el agrupamiento por hora de llegada (Processing Time) frente a tiempo de evento con Watermark.',
  'mcp-semantic-vs-raw-sql':
    'Compara una consulta directa del LLM sobre tablas crudas frente al acceso gobernado vía servidor MCP.',
};

function useViewportWidth() {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1440
  );

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
}

function extractTakeawayString(item) {
  if (!item) return '';
  if (typeof item === 'string') return item;
  if (typeof item === 'object') {
    if (item.title && item.description) {
      return `**${item.title}:** ${item.description}`;
    }
    return item.description || item.title || item.criterion || item.text || '';
  }
  return String(item);
}

function buildKeyTakeaways(lesson) {
  if (!lesson) return [];
  if (Array.isArray(lesson.keyTakeaways) && lesson.keyTakeaways.length >= 3) {
    return lesson.keyTakeaways
      .slice(0, 3)
      .map(extractTakeawayString)
      .filter(Boolean);
  }
  const items = [];
  if (lesson.goal) {
    const g = extractTakeawayString(lesson.goal);
    if (g) items.push(g);
  }
  if (Array.isArray(lesson.codeChallenge?.rubricCriteria)) {
    lesson.codeChallenge.rubricCriteria.forEach((c) => {
      const str = extractTakeawayString(c);
      if (str && items.length < 3) items.push(str);
    });
  }
  ['DE', 'DA', 'BI'].forEach((role) => {
    const pt = extractTakeawayString(lesson.triadPerspectives?.[role]?.points?.[0]);
    if (pt && items.length < 3) {
      items.push(pt);
    }
  });
  (lesson.sections || []).forEach((sec) => {
    if (items.length < 3 && sec.heading) {
      items.push(stripSectionNumber(sec.heading));
    }
  });
  return items.slice(0, 3);
}

function readStoredSteps() {
  try {
    const raw = localStorage.getItem('manual_datos_lesson_step');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStoredStep(lessonId, stepIdx) {
  if (!lessonId) return;
  try {
    const current = readStoredSteps();
    const updated = { ...current, [lessonId]: stepIdx };
    localStorage.setItem('manual_datos_lesson_step', JSON.stringify(updated));
  } catch {}
}

export function LessonPlayer({
  lessons = [],
  currentLesson,
  currentStage,
  prevLesson = null,
  nextLesson = null,
  currentStep = 0,
  onStepChange = () => {},
  completedIds = [],
  quizAnswers = {},
  completedLabIds = [],
  completedPipelineIds = [],
  onSelectQuizOption = () => {},
  onToggleCompleteLesson = () => {},
  onSolveLab = () => {},
  onSolvePipeline = () => {},
  onOpenLesson = () => {},
  onNavigate = () => {},
  onAskTutor = () => {},
  onOpenTutor = () => {},
}) {
  const viewportWidth = useViewportWidth();
  const [codeTab, setCodeTab] = useState('bad');
  const [activeRoleSlide, setActiveRoleSlide] = useState('DE');
  const [desktopRailCollapsed, setDesktopRailCollapsed] = useState(false);
  const [syllabusOverlayOpen, setSyllabusOverlayOpen] = useState(false);
  const [pendingQuizId, setPendingQuizId] = useState(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const rolesCarouselRef = useRef(null);

  const safeStep = Math.min(
    LESSON_STEPS.length - 1,
    Math.max(0, Number(currentStep) || 0)
  );

  // Sync quiz state when lesson changes
  useEffect(() => {
    if (!currentLesson) return;
    const savedAns = quizAnswers[currentLesson.id] || null;
    setPendingQuizId(savedAns);
    setQuizChecked(Boolean(savedAns));
  }, [currentLesson?.id, quizAnswers]);

  // Reset side-by-side tab if viewport shrinks below 1280px
  useEffect(() => {
    if (viewportWidth < 1280 && codeTab === 'split') {
      setCodeTab('bad');
    }
  }, [viewportWidth, codeTab]);

  // Close overlay drawer on Escape
  useEffect(() => {
    if (!syllabusOverlayOpen) return undefined;
    const handleEsc = (e) => {
      if (e.key === 'Escape') setSyllabusOverlayOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [syllabusOverlayOpen]);

  // Persist current step in localStorage under manual_datos_lesson_step
  useEffect(() => {
    if (!currentLesson?.id) return;
    writeStoredStep(currentLesson.id, safeStep);
  }, [currentLesson?.id, safeStep]);

  const handleSelectStep = (idx) => {
    if (!currentLesson) return;
    const clamped = Math.min(LESSON_STEPS.length - 1, Math.max(0, idx));
    writeStoredStep(currentLesson.id, clamped);
    onStepChange(currentLesson.id, clamped);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Keyboard navigation ← / → (ignoring input/textarea/select)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!currentLesson) return;
      const tag = e.target?.tagName?.toLowerCase();
      if (
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        e.target?.isContentEditable
      ) {
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'ArrowLeft' && safeStep > 0) {
        e.preventDefault();
        handleSelectStep(safeStep - 1);
      } else if (e.key === 'ArrowRight' && safeStep < LESSON_STEPS.length - 1) {
        e.preventDefault();
        handleSelectStep(safeStep + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentLesson?.id, safeStep]);

  const stageLessons = useMemo(() => {
    if (!currentLesson) return [];
    return lessons.filter((l) => l.stageId === currentLesson.stageId);
  }, [lessons, currentLesson]);

  const storedStepsMap = useMemo(
    () => readStoredSteps(),
    [currentLesson?.id, safeStep]
  );

  const keyTakeaways = useMemo(
    () => buildKeyTakeaways(currentLesson),
    [currentLesson]
  );

  const goalChecks = useMemo(
    () => splitGoalIntoChecks(currentLesson?.goal, currentLesson?.sections),
    [currentLesson]
  );

  if (!currentLesson) return null;

  const stageNum = getStageNumber(currentStage || currentLesson);
  const isLessonCompleted = completedIds.includes(currentLesson.id);
  const isLabSolved = completedLabIds.includes(currentLesson.id);
  const isPipelineSolved = completedPipelineIds.includes(currentLesson.id);

  const isStageCompleted =
    stageLessons.length > 0 &&
    stageLessons.every((l) => completedIds.includes(l.id));

  const activeQuizOptionId = pendingQuizId ?? quizAnswers[currentLesson.id];
  const selectedQuizObj = currentLesson.checkpoint?.options?.find(
    (o) => o.id === activeQuizOptionId
  );

  const stepProgressPct = isLessonCompleted
    ? 100
    : Math.round(((safeStep + 1) / LESSON_STEPS.length) * 100);

  const businessCaseText =
    currentLesson.businessCase || currentLesson.storyContext || '';

  const simulatorInstruction =
    SIMULATOR_INSTRUCTIONS[currentLesson.visualType] ||
    'Cambia el modo de ejecución en los controles y observa el impacto en los resultados.';

  const isWideStep =
    safeStep === 1 ||
    safeStep === 3 ||
    (safeStep === 2 && codeTab === 'split');

  const isDesktopTier = viewportWidth >= 1280;
  const isTabletTier = viewportWidth >= 1024 && viewportWidth < 1280;
  const isMobileSheetTier = viewportWidth < 1024;

  const handleToggleSyllabus = () => {
    if (isDesktopTier) {
      setDesktopRailCollapsed((c) => !c);
    } else {
      setSyllabusOverlayOpen((o) => !o);
    }
  };

  const handleCheckQuiz = () => {
    if (!selectedQuizObj) return;
    setQuizChecked(true);
    onSelectQuizOption(currentLesson.id, selectedQuizObj);
  };

  const handleRevealQuizAnswer = () => {
    const correctOpt = (currentLesson.checkpoint?.options || []).find(
      (o) => o.correct
    );
    if (correctOpt) {
      setPendingQuizId(correctOpt.id);
      setQuizChecked(true);
      onSelectQuizOption(currentLesson.id, correctOpt);
    }
  };

  const handleRolesScroll = (e) => {
    const el = e.currentTarget;
    if (!el || el.clientWidth === 0) return;
    const index = Math.round(el.scrollLeft / (el.clientWidth * 0.85));
    const keys = ['DE', 'DA', 'BI'];
    const targetRole = keys[Math.min(2, Math.max(0, index))];
    if (targetRole && targetRole !== activeRoleSlide) {
      setActiveRoleSlide(targetRole);
    }
  };

  const scrollToRoleCard = (roleKey, idx) => {
    setActiveRoleSlide(roleKey);
    const container = rolesCarouselRef.current;
    if (container && container.children[idx]) {
      container.children[idx].scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  };

  const renderSyllabusContent = ({
    onAfterSelect,
    showCollapseBtn = false,
    showCloseBtn = false,
    hideHeader = false,
  } = {}) => (
    <>
      {!hideHeader && (
        <div className="lp-syllabus-head">
          <div className="lp-syllabus-head__top">
            <span className="lp-stage-kicker tabular">
              Etapa {stageNum} de 6
            </span>
            {showCollapseBtn && (
              <Button
                variant="ghost"
                size="sm"
                icon={PanelLeftClose}
                ariaLabel="Ocultar temario"
                onClick={() => setDesktopRailCollapsed(true)}
              />
            )}
            {showCloseBtn && (
              <Button
                variant="ghost"
                size="sm"
                icon={X}
                ariaLabel="Cerrar temario"
                onClick={() => setSyllabusOverlayOpen(false)}
              />
            )}
          </div>
          <h2 className="lp-stage-title">{currentStage?.title}</h2>
        </div>
      )}

      <ul className="lp-syllabus-list">
        {stageLessons.map((lesson) => {
          const isCurrent = lesson.id === currentLesson.id;
          const isDone = completedIds.includes(lesson.id);
          const savedStep = Number(storedStepsMap[lesson.id] || 0);
          const isInProgress = !isDone && (isCurrent || savedStep > 0);

          return (
            <li
              key={lesson.id}
              className={`lp-lesson-item ${
                isCurrent ? 'lp-lesson-item--active' : ''
              }`.trim()}
            >
              <button
                type="button"
                className="lp-lesson-btn"
                onClick={() => {
                  if (!isCurrent) {
                    onOpenLesson(lesson.id);
                  }
                  if (typeof onAfterSelect === 'function') {
                    onAfterSelect();
                  }
                }}
                aria-current={isCurrent ? 'page' : undefined}
              >
                <div className="lp-lesson-btn__info">
                  <div className="lp-lesson-btn__meta tabular">
                    Lección {String(lesson.order).padStart(2, '0')} · {lesson.duration}
                  </div>
                  <div className="lp-lesson-btn__title">{lesson.title}</div>
                </div>

                <span
                  className={`lp-lesson-status ${
                    isDone
                      ? 'lp-lesson-status--done'
                      : isInProgress
                        ? 'lp-lesson-status--active'
                        : 'lp-lesson-status--pending'
                  }`}
                >
                  {isDone ? '✓' : isInProgress ? 'En curso' : 'Pendiente'}
                </span>
              </button>

              {isCurrent && (
                <ol
                  className="lp-nested-steps"
                  aria-label="Pasos de la lección activa"
                >
                  {LESSON_STEPS.map((st, sIdx) => {
                    const isStepActive = sIdx === safeStep;
                    const isStepDone = isLessonCompleted || sIdx < safeStep;
                    return (
                      <li key={st.id}>
                        <button
                          type="button"
                          className={`lp-nested-step-btn ${
                            isStepActive
                              ? 'lp-nested-step-btn--active'
                              : isStepDone
                                ? 'lp-nested-step-btn--done'
                                : ''
                          }`.trim()}
                          onClick={() => {
                            handleSelectStep(sIdx);
                            if (typeof onAfterSelect === 'function') {
                              onAfterSelect();
                            }
                          }}
                          aria-current={isStepActive ? 'step' : undefined}
                        >
                          <span
                            className={`lp-nested-step-num tabular ${
                              isStepDone && !isStepActive
                                ? 'lp-nested-step-num--done'
                                : ''
                            }`.trim()}
                          >
                            {isStepDone && !isStepActive ? '✓' : `${st.number}.`}
                          </span>
                          <span>{st.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );

  const renderCodeComparisonPane = (mode) => {
    const isBad = mode === 'bad';
    const playground = currentLesson.playground || {};
    const title = isBad
      ? playground.badQueryLabel || 'Código con error'
      : playground.goodQueryLabel || 'Código correcto';
    const summaryText = isBad
      ? 'Este antipatrón compromete la exactitud de las métricas o degrada el rendimiento del motor.'
      : 'Esta solución preserva el grano, las invariantes del contrato y la eficiencia de lectura.';
    const queryText = isBad ? playground.badQuery : playground.goodQuery;
    const rows = (isBad ? playground.badResult : playground.goodResult) || [];

    return (
      <div className="lp-code-pane" key={mode}>
        <Callout tone={isBad ? 'danger' : 'success'} title={title}>
          <p className="lp-callout-summary">{summaryText}</p>
        </Callout>

        <pre className="lp-code-block tabular">
          <code>{queryText}</code>
        </pre>

        <div className="viz-table-label">Tabla de resultados</div>
        <div className="lp-table-scroll">
          <table className="viz-table tabular">
            <thead>
              <tr>
                {Object.entries(rows[0] || {}).map(([col, sampleVal]) => (
                  <th
                    key={col}
                    className={isNumericCell(sampleVal) ? 'num' : ''}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  {Object.values(row).map((val, vIdx) => (
                    <td
                      key={vIdx}
                      className={isNumericCell(val) ? 'num' : ''}
                    >
                      {String(val)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const codeTabsItems = useMemo(() => {
    const base = [
      { id: 'bad', label: 'Con error', icon: AlertOctagon },
      { id: 'good', label: 'Correcto', icon: CheckCircle2 },
    ];
    if (viewportWidth >= 1280) {
      base.push({ id: 'split', label: 'Lado a lado', icon: Columns2 });
    }
    return base;
  }, [viewportWidth]);

  return (
    <div className="lesson-player" data-stage={stageNum}>
      {/* NIVEL 2 (1024-1279px): Panel deslizable desde la izquierda */}
      {isTabletTier && syllabusOverlayOpen && (
        <div
          className="lp-drawer-backdrop"
          onClick={() => setSyllabusOverlayOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Temario de la etapa actual"
        >
          <aside
            className="lp-left-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            {renderSyllabusContent({
              onAfterSelect: () => setSyllabusOverlayOpen(false),
              showCloseBtn: true,
            })}
          </aside>
        </div>
      )}

      {/* NIVEL 3 (< 1024px): Sheet inferior */}
      {isMobileSheetTier && (
        <Sheet
          open={syllabusOverlayOpen}
          onClose={() => setSyllabusOverlayOpen(false)}
          side="bottom"
          title={`Etapa ${stageNum} · ${currentStage?.title || ''}`}
          subtitle="Temario de la etapa y pasos de la lección"
          data-stage={stageNum}
        >
          {renderSyllabusContent({
            onAfterSelect: () => setSyllabusOverlayOpen(false),
            hideHeader: true,
          })}
        </Sheet>
      )}

      <div
        className={`lp-layout ${
          desktopRailCollapsed || !isDesktopTier
            ? 'lp-layout--rail-collapsed'
            : ''
        }`.trim()}
      >
        {/* NIVEL 1 (>= 1280px): Temario de la etapa a la izquierda (280px, colapsable) */}
        {isDesktopTier && !desktopRailCollapsed && (
          <aside
            className="lp-left-rail"
            aria-label="Temario de la etapa actual"
          >
            {renderSyllabusContent({ showCollapseBtn: true })}
          </aside>
        )}

        {/* ZONA CENTRAL */}
        <div className="lp-center-zone">
          {/* CABECERA COMPACTA Y ÚNICA (56px + ProgressBar 4px = 60px <= 64px) */}
          <div className="lp-sticky-header">
            <div className="lp-header-bar">
              <div className="lp-header-actions">
                <Button
                  variant="ghost"
                  size="sm"
                  className="lp-header-btn"
                  onClick={() => onNavigate('roadmap')}
                >
                  ← Salir
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="lp-header-btn"
                  onClick={handleToggleSyllabus}
                  aria-expanded={
                    isDesktopTier ? !desktopRailCollapsed : syllabusOverlayOpen
                  }
                >
                  Temario
                </Button>
                {/* En móvil la cabecera de la app no tiene botón del tutor */}
                <Button
                  variant="secondary"
                  size="sm"
                  className="lp-header-btn lp-header-btn--tutor"
                  onClick={onOpenTutor}
                >
                  Preguntar
                </Button>
              </div>

              <span className="lp-header-title" title={currentLesson.title}>
                {currentLesson.title}
              </span>

              <div className="lp-header-stepper-wrap">
                <Stepper
                  variant="compact"
                  stage={stageNum}
                  steps={LESSON_STEPS}
                  activeStep={safeStep}
                  completedSteps={
                    isLessonCompleted
                      ? LESSON_STEPS.map((_, i) => i)
                      : Array.from({ length: safeStep }, (_, i) => i)
                  }
                  onStepClick={(idx) => handleSelectStep(idx)}
                  ariaLabel="Pasos de la lección"
                />
                <span className="lp-header-step-count tabular">
                  {safeStep + 1}/{LESSON_STEPS.length}
                </span>
              </div>
            </div>

            <div className="lp-header-progress">
              <ProgressBar
                value={stepProgressPct}
                size="sm"
                tone={isLessonCompleted ? 'success' : 'stage'}
                stage={stageNum}
                ariaLabel={`Progreso de la lección ${currentLesson.title}`}
              />
            </div>
          </div>

          {/* CONTENIDO DEL PASO ACTUAL */}
          <div
            className={`lp-step-container ${
              isWideStep ? 'lp-step-container--wide' : ''
            }`.trim()}
          >
            {/* PASO 1: CONTEXTO */}
            {safeStep === 0 && (
              <div
                key={`step-${currentLesson.id}-0`}
                className="lesson-step-panel lp-step-animate"
              >
                <header className="lesson-player__header">
                  <div className="lesson-player__meta tabular">
                    <Chip variant="stage" stage={stageNum}>
                      Etapa {stageNum} · Lección {currentLesson.order}
                    </Chip>
                    <Chip variant="neutral">{currentLesson.duration}</Chip>
                    {(currentLesson.coreFocus || ['DE', 'DA', 'BI']).map(
                      (role) => (
                        <Chip key={role} variant="role" role={role}>
                          {role}
                        </Chip>
                      )
                    )}
                  </div>
                  <h1 className="lesson-player__title">
                    {currentLesson.title}
                  </h1>
                  <p className="lesson-player__subtitle">
                    {currentLesson.subtitle}
                  </p>
                </header>

                {businessCaseText && (
                  <div
                    className="lp-problem-card"
                    role="note"
                    aria-label="El problema"
                  >
                    <span className="lp-problem-card__icon" aria-hidden="true">
                      <AlertCircle size={20} />
                    </span>
                    <div className="lp-problem-card__content">
                      <h2 className="lp-problem-card__title">El problema</h2>
                      <p className="lp-problem-card__text">
                        {formatInlineText(businessCaseText)}
                      </p>
                    </div>
                  </div>
                )}

                {goalChecks.length > 0 && (
                  <div
                    className="lp-goal-card"
                    aria-label="Objetivo de la lección"
                  >
                    <h2 className="lp-goal-card__title">Objetivo</h2>
                    <ul className="lp-goal-checks">
                      {goalChecks.map((checkItem, idx) => (
                        <li key={idx} className="lp-goal-checks__item">
                          <span
                            className="lp-goal-checks__icon"
                            aria-hidden="true"
                          >
                            <CheckCircle2 size={18} />
                          </span>
                          <span>{formatInlineText(checkItem)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <article className="lesson-prose">
                  {(currentLesson.sections || []).map((sec, idx) => (
                    <section key={idx} className="lesson-prose__section">
                      <h3 className="lesson-prose__heading">
                        {stripSectionNumber(sec.heading)}
                      </h3>
                      {renderProseBody(sec.body)}
                    </section>
                  ))}
                </article>
              </div>
            )}

            {/* PASO 2: SIMULADOR */}
            {safeStep === 1 && (
              <div
                key={`step-${currentLesson.id}-1`}
                className="lesson-step-panel lp-step-animate"
              >
                <div className="lp-try-this-card">
                  <span className="lp-try-this-card__badge">
                    <MousePointerClick size={15} aria-hidden="true" />
                    <span>Prueba esto</span>
                  </span>
                  <p className="lp-try-this-card__text">
                    {formatInlineText(simulatorInstruction)}
                  </p>
                </div>

                <div className="lp-visualizer-shell">
                  <LessonVisualizer
                    visualType={currentLesson.visualType}
                    stage={stageNum}
                  />
                </div>
              </div>
            )}

            {/* PASO 3: ANTIPATRÓN VS. SOLUCIÓN */}
            {safeStep === 2 && (
              <div
                key={`step-${currentLesson.id}-2`}
                className="lesson-step-panel lp-step-animate"
              >
                {currentLesson.playground ? (
                  <Card>
                    <div className="lp-code-header">
                      <div className="lp-code-header__titles">
                        <h2 className="lp-section-title">
                          Antipatrón vs. solución
                        </h2>
                        <p className="lp-section-subtitle">
                          {formatInlineText(
                            currentLesson.playground.description
                          )}
                        </p>
                      </div>

                      <Tabs
                        items={codeTabsItems}
                        activeId={codeTab}
                        onChange={(id) => setCodeTab(id)}
                        variant="pills"
                        stage={stageNum}
                        ariaLabel="Comparador de código"
                        className="lp-code-tabs"
                      />
                    </div>

                    {codeTab === 'split' && viewportWidth >= 1280 ? (
                      <div className="lp-code-compare-grid">
                        {renderCodeComparisonPane('bad')}
                        {renderCodeComparisonPane('good')}
                      </div>
                    ) : (
                      renderCodeComparisonPane(
                        codeTab === 'good' ? 'good' : 'bad'
                      )
                    )}

                    <div className="lp-tutor-row">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onAskTutor(
                            `Explica línea por línea el ${
                              codeTab === 'good'
                                ? 'Código correcto'
                                : 'Código con error'
                            } de la lección "${currentLesson.title}".`
                          )
                        }
                      >
                        Pedir al Tutor IA que desglose este código →
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <Callout tone="info" title="Sin bloque comparativo">
                    Avanza al siguiente paso para revisar las perspectivas por
                    rol.
                  </Callout>
                )}
              </div>
            )}

            {/* PASO 4: LOS TRES ROLES (DE / DA / BI) */}
            {safeStep === 3 && (
              <div
                key={`step-${currentLesson.id}-3`}
                className="lesson-step-panel lp-step-animate"
              >
                <div>
                  <h2 className="lp-section-title">
                    Responsabilidades por rol: DE, DA y BI
                  </h2>
                  <p className="lp-section-subtitle">
                    Cómo colaboran Ingeniería de Datos, Análisis de Datos y
                    Business Intelligence sobre este concepto.
                  </p>
                </div>

                <div
                  className="lp-roles-grid"
                  ref={rolesCarouselRef}
                  onScroll={handleRolesScroll}
                >
                  {['DE', 'DA', 'BI'].map((roleKey) => {
                    const block = currentLesson.triadPerspectives?.[roleKey];
                    if (!block) return null;
                    const roleMeta = getRoleMeta(roleKey);
                    const bullets = (block.points || []).slice(0, 3);

                    return (
                      <Card
                        key={roleKey}
                        className={`lp-role-card lp-role-card--${roleKey.toLowerCase()}`}
                      >
                        <div className="lp-role-card__header">
                          <Chip variant="role" role={roleKey}>
                            {roleMeta.short} · {roleMeta.label}
                          </Chip>
                        </div>
                        <h3 className="lp-role-card__title">
                          {formatInlineText(block.title)}
                        </h3>
                        <ul className="lp-role-card__list">
                          {bullets.map((pt, i) => (
                            <li key={i} className="lp-role-card__item">
                              {formatInlineText(pt)}
                            </li>
                          ))}
                        </ul>
                      </Card>
                    );
                  })}
                </div>

                <div
                  className="lp-role-carousel-dots"
                  role="tablist"
                  aria-label="Indicadores de rol"
                >
                  {['DE', 'DA', 'BI'].map((roleKey, idx) => {
                    const isActive = activeRoleSlide === roleKey;
                    return (
                      <button
                        key={roleKey}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-label={`Ver rol ${roleKey}`}
                        className={`lp-role-carousel-dot lp-role-carousel-dot--${roleKey.toLowerCase()} ${
                          isActive ? 'lp-role-carousel-dot--active' : ''
                        }`.trim()}
                        onClick={() => scrollToRoleCard(roleKey, idx)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* PASO 5: COMPRUEBA LO APRENDIDO (QUIZ ESTILO BRILLIANT / DUOLINGO) */}
            {safeStep === 4 && (
              <div
                key={`step-${currentLesson.id}-4`}
                className="lesson-step-panel lp-step-animate"
              >
                <Card>
                  <div className="lp-quiz-header">
                    <div>
                      <Chip variant="stage" stage={stageNum}>
                        Pregunta de verificación
                      </Chip>
                    </div>
                    <h2 className="lp-section-title">Comprueba lo aprendido</h2>
                  </div>

                  <p className="lp-quiz-question">
                    {formatInlineText(currentLesson.checkpoint?.question)}
                  </p>

                  <div className="checkpoint-options-list">
                    {(currentLesson.checkpoint?.options || []).map(
                      (opt, optIdx) => {
                        const isSelected = activeQuizOptionId === opt.id;
                        const optState = quizChecked
                          ? isSelected
                            ? opt.correct
                              ? 'correct'
                              : 'incorrect'
                            : 'idle'
                          : isSelected
                            ? 'selected'
                            : 'idle';

                        return (
                          <AnswerOption
                            key={opt.id}
                            index={optIdx}
                            letter={opt.id.toUpperCase()}
                            state={optState}
                            onClick={() => {
                              setPendingQuizId(opt.id);
                              setQuizChecked(false);
                            }}
                          >
                            {formatInlineText(opt.text)}
                          </AnswerOption>
                        );
                      }
                    )}
                  </div>
                </Card>
              </div>
            )}

            {/* PASO 6: PRÁCTICA */}
            {safeStep === 5 && (
              <div
                key={`step-${currentLesson.id}-5`}
                className="lesson-step-panel lp-step-animate"
              >
                <div className="lp-practice-chips">
                  {currentLesson.codeChallenge && (
                    <Chip
                      variant={isLabSolved ? 'success' : 'stage'}
                      stage={stageNum}
                    >
                      {isLabSolved
                        ? 'Laboratorio SQL superado ✓'
                        : 'Laboratorio SQL pendiente'}
                    </Chip>
                  )}
                  {currentLesson.pipelineChallenge && (
                    <Chip
                      variant={isPipelineSolved ? 'success' : 'stage'}
                      stage={stageNum}
                    >
                      {isPipelineSolved
                        ? 'Secuencia de pipeline superada ✓'
                        : 'Secuencia de pipeline pendiente'}
                    </Chip>
                  )}
                </div>

                {currentLesson.codeChallenge && (
                  <Card className="lp-practice-card">
                    <AuthenticCodeLab
                      key={`codelab-${currentLesson.id}`}
                      challenge={currentLesson.codeChallenge}
                      stage={stageNum}
                      onSolve={() => onSolveLab(currentLesson.id)}
                      onAskAiTutor={(prompt) => onAskTutor(prompt)}
                    />
                  </Card>
                )}

                {currentLesson.pipelineChallenge && (
                  <Card className="lp-practice-card">
                    <PipelineOrderChallenge
                      key={`pipe-${currentLesson.id}`}
                      challenge={currentLesson.pipelineChallenge}
                      stage={stageNum}
                      onComplete={() => onSolvePipeline(currentLesson.id)}
                    />
                  </Card>
                )}

                {!currentLesson.codeChallenge &&
                  !currentLesson.pipelineChallenge && (
                    <Callout tone="info" title="Sin laboratorio adicional">
                      Continúa al paso de Resumen para consolidar las ideas
                      clave de la lección.
                    </Callout>
                  )}
              </div>
            )}

            {/* PASO 7: RESUMEN (PANTALLA DE CELEBRACIÓN) */}
            {safeStep === 6 && (
              <div
                key={`step-${currentLesson.id}-6`}
                className="lesson-step-panel lp-step-animate"
              >
                <div className="lp-summary-hero">
                  <ProgressRing
                    size={64}
                    value={100}
                    celebrate
                    stage={stageNum}
                    tone="stage"
                  />
                  <Chip
                    variant={isLessonCompleted ? 'success' : 'stage'}
                    stage={stageNum}
                  >
                    Etapa {stageNum} · Lección {currentLesson.order}
                  </Chip>
                  <h2 className="lp-summary-hero__title">Lección completada</h2>
                  <p className="lp-summary-hero__subtitle">
                    {currentLesson.title}
                  </p>
                </div>

                {isStageCompleted && (
                  <div className="lp-stage-badge-wrap anim-pop">
                    <Badge stage={stageNum} unlocked />
                  </div>
                )}

                <div className="lp-srs-banner">
                  <div className="lp-srs-banner__left">
                    <span className="lp-srs-banner__icon" aria-hidden="true">
                      <Sparkles size={20} />
                    </span>
                    <div>
                      <div className="lp-srs-banner__title">
                        +4 tarjetas añadidas a tu repaso
                      </div>
                      <div className="lp-srs-banner__desc">
                        Disponibles en tu sistema Leitner de memoria espaciada
                        para DE, DA y BI.
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onNavigate('practice')}
                  >
                    Ir a Repaso
                  </Button>
                </div>

                <div className="lp-takeaways-section">
                  <h3 className="lp-takeaways-heading">
                    3 ideas clave de la lección
                  </h3>
                  <div className="lp-takeaway-grid">
                    {keyTakeaways.map((idea, idx) => (
                      <div key={idx} className="lp-takeaway-card">
                        <span className="lp-takeaway-card__num tabular">
                          0{idx + 1}
                        </span>
                        <p className="lp-takeaway-card__text">
                          {formatInlineText(idea)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lp-summary-actions">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => onNavigate('roadmap')}
                  >
                    Volver a la ruta
                  </Button>

                  <div className="lp-summary-actions__primary">
                    <Button
                      variant={isLessonCompleted ? 'secondary' : 'primary'}
                      size="md"
                      onClick={() => onToggleCompleteLesson(currentLesson.id)}
                    >
                      {isLessonCompleted
                        ? '✓ Lección completada (desmarcar)'
                        : 'Marcar como completada'}
                    </Button>

                    {nextLesson ? (
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => {
                          if (!isLessonCompleted) {
                            onToggleCompleteLesson(currentLesson.id);
                          }
                          onOpenLesson(nextLesson.id);
                        }}
                      >
                        Siguiente lección →
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => onNavigate('capstones')}
                      >
                        Ir a proyectos integradores →
                      </Button>
                    )}
                  </div>
                </div>

                {Array.isArray(currentLesson.relatedLessons) &&
                  currentLesson.relatedLessons.length > 0 && (
                    <Card>
                      <h3 className="lp-takeaways-heading">
                        Lecciones relacionadas
                      </h3>
                      <ul className="lp-related-list">
                        {currentLesson.relatedLessons.map((rel) => {
                          const target = lessons.find((l) => l.id === rel.id);
                          if (!target) return null;
                          return (
                            <li key={rel.id}>
                              <button
                                type="button"
                                className="text-action-btn"
                                onClick={() => onOpenLesson(target.id)}
                              >
                                Lección {target.order}: {target.title}
                              </button>
                              <span> — {formatInlineText(rel.reason)}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </Card>
                  )}
              </div>
            )}
          </div>

          {/* PIE FIJO DE NAVEGACIÓN ENTRE PASOS O BARRA INFERIOR DE FEEDBACK EN QUIZ */}
          {safeStep === 4 && quizChecked && selectedQuizObj ? (
            <div
              className={`lp-quiz-feedback-bar ${
                selectedQuizObj.correct
                  ? 'lp-quiz-feedback-bar--correct'
                  : 'lp-quiz-feedback-bar--incorrect'
              }`}
              role="status"
              aria-live="polite"
            >
              <div className="lp-quiz-feedback-bar__main">
                <span
                  className="lp-quiz-feedback-bar__icon"
                  aria-hidden="true"
                >
                  {selectedQuizObj.correct ? (
                    <CheckCircle2 size={22} />
                  ) : (
                    <XCircle size={22} />
                  )}
                </span>
                <div className="lp-quiz-feedback-bar__body">
                  <h3 className="lp-quiz-feedback-bar__title">
                    {selectedQuizObj.correct ? 'Correcto' : 'No es esa'}
                  </h3>
                  <p className="lp-quiz-feedback-bar__text">
                    {formatInlineText(selectedQuizObj.feedback)}
                  </p>
                </div>
              </div>

              <div className="lp-quiz-feedback-bar__actions">
                {selectedQuizObj.correct ? (
                  <Button
                    variant="success"
                    size="md"
                    onClick={() => handleSelectStep(5)}
                  >
                    Continuar →
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setQuizChecked(false);
                        setPendingQuizId(null);
                      }}
                    >
                      Intentar de nuevo
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleRevealQuizAnswer}
                    >
                      Ver la respuesta
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <footer
              className="lp-sticky-bottom"
              aria-label="Navegación entre pasos"
            >
              <Button
                variant="ghost"
                size="md"
                disabled={safeStep === 0 && !prevLesson}
                onClick={() => {
                  if (safeStep > 0) {
                    handleSelectStep(safeStep - 1);
                  } else if (prevLesson) {
                    onOpenLesson(prevLesson.id);
                  }
                }}
              >
                ← Anterior
              </Button>

              <div className="lp-footer-hint">
                <span className="lp-footer-kbds">
                  <Kbd>←</Kbd>
                  <Kbd>→</Kbd>
                </span>
                <span className="lp-footer-step-name">
                  {LESSON_STEPS[safeStep].label}
                </span>
              </div>

              {safeStep === 4 ? (
                <Button
                  variant="primary"
                  size="md"
                  className="lp-footer-primary-btn"
                  disabled={!activeQuizOptionId}
                  onClick={handleCheckQuiz}
                >
                  Comprobar
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  className="lp-footer-primary-btn"
                  onClick={() => {
                    if (safeStep < LESSON_STEPS.length - 1) {
                      handleSelectStep(safeStep + 1);
                    } else if (nextLesson) {
                      onOpenLesson(nextLesson.id);
                    } else {
                      onNavigate('capstones');
                    }
                  }}
                >
                  {safeStep < LESSON_STEPS.length - 1
                    ? 'Siguiente →'
                    : nextLesson
                      ? 'Siguiente lección →'
                      : 'Finalizar →'}
                </Button>
              )}
            </footer>
          )}
        </div>
      </div>
    </div>
  );
}

export default LessonPlayer;
