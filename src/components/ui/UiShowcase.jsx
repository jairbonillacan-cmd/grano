import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Sparkles,
  Play,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Compass,
  Award,
  BookOpen,
} from 'lucide-react';
import {
  STAGE_THEMES,
  getStageTheme,
} from './stageTheme.js';
import { Button } from './Button.jsx';
import { ProgressBar } from './ProgressBar.jsx';
import { ProgressRing } from './ProgressRing.jsx';
import { Chip } from './Chip.jsx';
import { Card } from './Card.jsx';
import { Stepper } from './Stepper.jsx';
import { Callout } from './Callout.jsx';
import { EmptyState } from './EmptyState.jsx';
import { Kbd } from './Kbd.jsx';
import { Badge } from './Badge.jsx';
import { Sheet } from './Sheet.jsx';
import { Tabs } from './Tabs.jsx';
import { Tooltip } from './Tooltip.jsx';
import { Skeleton } from './Skeleton.jsx';
import { Toast } from './Toast.jsx';
import { AnswerOption } from './AnswerOption.jsx';
import { IllustrationsShowcaseCatalog } from '../../assets/illustrations/UiIllustrationsMount.jsx';

const SEVEN_LESSON_STEPS = [
  { id: 'hook', label: 'Gancho y caso' },
  { id: 'concept', label: 'Concepto visual' },
  { id: 'sim', label: 'Simulador interactivo' },
  { id: 'sql', label: 'Comparativa SQL' },
  { id: 'lab', label: 'Reto práctico' },
  { id: 'quiz', label: 'Verificación' },
  { id: 'summary', label: 'Síntesis y logro' },
];

export function UiShowcase({ theme = 'light', onThemeChange }) {
  const [activeStage, setActiveStage] = useState(1);
  const [activeStep, setActiveStep] = useState(2);
  const [activeTabPills, setActiveTabPills] = useState('sql');
  const [activeTabUnderline, setActiveTabUnderline] = useState('de');
  const [activeTabSegmented, setActiveTabSegmented] = useState('star');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState('B');

  const currentStageMeta = getStageTheme(activeStage);

  const handleToggleTheme = (nextTheme) => {
    if (typeof onThemeChange === 'function') {
      onThemeChange(nextTheme);
    } else {
      document.documentElement.setAttribute('data-theme', nextTheme);
      try {
        localStorage.setItem('manual_datos_theme', nextTheme);
      } catch {}
    }
  };

  return (
    <div className="ui-showcase" data-stage={activeStage}>
      <header className="ui-showcase__topbar">
        <div className="l-container l-cluster l-cluster--between">
          <div className="l-cluster l-cluster--sm">
            <span className="ui-showcase__brand-dot" aria-hidden="true" />
            <strong className="ui-showcase__brand">Grano · Componentes</strong>
            <Chip variant="stage" stage={activeStage}>
              Etapa {activeStage}: {currentStageMeta.shortName}
            </Chip>
          </div>
          <div className="l-cluster l-cluster--sm">
            <Button
              variant={theme === 'light' ? 'primary' : 'secondary'}
              size="sm"
              icon={Sun}
              onClick={() => handleToggleTheme('light')}
            >
              Claro
            </Button>
            <Button
              variant={theme === 'dark' ? 'primary' : 'secondary'}
              size="sm"
              icon={Moon}
              onClick={() => handleToggleTheme('dark')}
            >
              Oscuro
            </Button>
          </div>
        </div>
      </header>

      <main className="l-container ui-showcase__main l-stack l-stack--xl">
        {/* Hero */}
        <section className="ui-showcase__hero">
          <div className="l-stack l-stack--sm">
            <div className="l-cluster l-cluster--sm">
              <Chip role="DE">Ingeniería DE</Chip>
              <Chip role="DA">Análisis DA</Chip>
              <Chip role="BI">Business Intelligence BI</Chip>
              <Kbd>Ctrl + K</Kbd>
            </div>
            <h1>Atelier Técnico de Datos · Sistema de Diseño</h1>
            <p className="ui-showcase__lead">
              Tipografía <strong>Plus Jakarta Sans</strong> + <strong>Inter</strong> +{' '}
              <code>JetBrains Mono</code>, identidad cromática para las 6 etapas y
              catálogo de 16 componentes interactivos sin estilos en línea.
            </p>
          </div>
        </section>

        {/* 1. Paleta e Identidad de las 6 Etapas */}
        <section className="l-stack l-stack--md" aria-labelledby="sec-stages">
          <div className="l-cluster l-cluster--between">
            <div>
              <h2 id="sec-stages" className="ui-showcase__sec-title">
                1. Identidad Cromática por Etapa (data-stage 1..6)
              </h2>
              <p className="ui-showcase__sec-sub">
                Selecciona cualquier etapa para propagar sus tokens <code>--stage</code>,{' '}
                <code>--stage-soft</code> y <code>--stage-deep</code>.
              </p>
            </div>
          </div>

          <div className="l-grid l-grid--3">
            {STAGE_THEMES.map((st) => {
              const isSelected = st.number === activeStage;
              return (
                <Card
                  key={st.id}
                  stage={st.number}
                  accentTop
                  interactive
                  onClick={() => setActiveStage(st.number)}
                  className={isSelected ? 'ui-showcase__stage-card--active' : ''}
                >
                  <div className="l-stack l-stack--sm">
                    <div className="l-cluster l-cluster--between">
                      <Chip variant="stage" stage={st.number}>
                        Etapa 0{st.number} · {st.shortName}
                      </Chip>
                      <ProgressRing
                        size={44}
                        value={st.number * 16}
                        stage={st.number}
                        tone="stage"
                        label={`${st.number * 16}%`}
                      />
                    </div>
                    <h3 className="ui-showcase__card-title">{st.name}</h3>
                    <ProgressBar
                      value={st.number * 16}
                      tone="stage"
                      stage={st.number}
                      size="md"
                    />
                    <div className="l-cluster l-cluster--between">
                      <code>{st.color}</code>
                      <Button
                        variant="stage"
                        size="sm"
                        stage={st.number}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveStage(st.number);
                        }}
                      >
                        {isSelected ? 'Etapa activa' : 'Probar tema'}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* 2. Botones y Controles Táctiles */}
        <section className="l-stack l-stack--md" aria-labelledby="sec-buttons">
          <h2 id="sec-buttons" className="ui-showcase__sec-title">
            2. Botones (Button) — Variantes, Tamaños e Íconos
          </h2>
          <Card>
            <div className="l-stack l-stack--md">
              <div className="l-cluster">
                <Button variant="primary" icon={Play}>
                  Primario (44px)
                </Button>
                <Button variant="secondary" icon={Terminal}>
                  Secundario
                </Button>
                <Button variant="stage" stage={activeStage} icon={Sparkles}>
                  Etapa activa
                </Button>
                <Button variant="success" icon={CheckCircle2}>
                  Verificar SQL
                </Button>
                <Button variant="danger" icon={AlertTriangle}>
                  Reiniciar
                </Button>
                <Button variant="ghost">Acción Ghost</Button>
                <Button variant="primary" disabled>
                  Deshabilitado
                </Button>
              </div>
              <div className="l-cluster">
                <Button variant="primary" size="sm">
                  Pequeño (40px)
                </Button>
                <Button variant="primary" size="md">
                  Mediano (44px)
                </Button>
                <Button variant="primary" size="lg">
                  Grande (48px)
                </Button>
                <Tooltip content="Atajo rápido para ejecutar consulta en el laboratorio">
                  <Button variant="secondary" size="sm">
                    Hover para Tooltip <Kbd>Ctrl+Enter</Kbd>
                  </Button>
                </Tooltip>
              </div>
            </div>
          </Card>
        </section>

        {/* 3. Chips, Roles y Progreso */}
        <section className="l-stack l-stack--md" aria-labelledby="sec-chips">
          <h2 id="sec-chips" className="ui-showcase__sec-title">
            3. Chips de Rol (DE / DA / BI), Progreso y Celebración
          </h2>
          <div className="l-grid l-grid--2">
            <Card>
              <div className="l-stack l-stack--md">
                <h3 className="ui-showcase__card-title">Chips Semánticos y de Rol</h3>
                <div className="l-cluster l-cluster--sm">
                  <Chip role="DE">DE · Ingeniería</Chip>
                  <Chip role="DA">DA · Estadística</Chip>
                  <Chip role="BI">BI · Negocio</Chip>
                </div>
                <div className="l-cluster l-cluster--sm">
                  <Chip variant="neutral">Neutro</Chip>
                  <Chip variant="primary">Primario</Chip>
                  <Chip variant="stage" stage={activeStage}>
                    Etapa 0{activeStage}
                  </Chip>
                  <Chip variant="success">Completada</Chip>
                  <Chip variant="warning">3 pendientes</Chip>
                  <Chip variant="danger">Fan-out 1:N</Chip>
                </div>
              </div>
            </Card>

            <Card>
              <div className="l-stack l-stack--md">
                <h3 className="ui-showcase__card-title">
                  ProgressRing (Normal + Celebración) y ProgressBar
                </h3>
                <div className="l-cluster l-cluster--lg">
                  <ProgressRing size={48} value={35} tone="primary" label="35%" />
                  <ProgressRing
                    size={56}
                    value={75}
                    tone="stage"
                    stage={activeStage}
                    label="14/18"
                  />
                  <ProgressRing
                    size={64}
                    value={100}
                    tone="success"
                    celebrate
                    ariaLabel="Etapa completada al 100%"
                  />
                </div>
                <div className="l-stack l-stack--xs">
                  <ProgressBar value={45} size="sm" tone="primary" />
                  <ProgressBar value={72} size="md" tone="stage" stage={activeStage} />
                  <ProgressBar value={90} size="lg" tone="success" />
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* 4. Stepper Full y Compact (7 pasos sin desborde en móvil) */}
        <section className="l-stack l-stack--md" aria-labelledby="sec-stepper">
          <h2 id="sec-stepper" className="ui-showcase__sec-title">
            4. Stepper de Lección (Variante Full y Variante Compact de 7 puntos)
          </h2>
          <Card stage={activeStage}>
            <div className="l-stack l-stack--lg">
              <div className="l-stack l-stack--xs">
                <span className="ui-showcase__label">
                  variant=&quot;compact&quot; (Píldora activa en color --stage, 0 overflow en 390px)
                </span>
                <Stepper
                  variant="compact"
                  stage={activeStage}
                  steps={SEVEN_LESSON_STEPS}
                  activeStep={activeStep}
                  onStepClick={(idx) => setActiveStep(idx)}
                />
              </div>
              <div className="l-stack l-stack--xs">
                <span className="ui-showcase__label">variant=&quot;full&quot;</span>
                <Stepper
                  variant="full"
                  stage={activeStage}
                  steps={SEVEN_LESSON_STEPS}
                  activeStep={activeStep}
                  onStepClick={(idx) => setActiveStep(idx)}
                />
              </div>
            </div>
          </Card>
        </section>

        {/* 5. AnswerOption (Quiz y Diagnóstico) */}
        <section className="l-stack l-stack--md" aria-labelledby="sec-quiz">
          <h2 id="sec-quiz" className="ui-showcase__sec-title">
            5. Opciones de Respuesta (AnswerOption — Estados y Micro-interacciones)
          </h2>
          <Card>
            <div className="l-stack l-stack--sm">
              <AnswerOption
                letter="A"
                state={selectedQuiz === 'A' ? 'selected' : 'idle'}
                onClick={() => setSelectedQuiz('A')}
                feedback="Estado idle / seleccionable con objetivo táctil >= 44px."
              >
                Ejecutar LEFT JOIN directo entre pedidos y pagos antes de agregar por pedido.
              </AnswerOption>
              <AnswerOption
                letter="B"
                state="correct"
                onClick={() => setSelectedQuiz('B')}
                feedback="¡Exacto! Pre-agregar por clave primaria evita duplicar importes por fan-out."
              >
                Pre-agregar la tabla de pagos al grano de order_id mediante una CTE antes del JOIN.
              </AnswerOption>
              <AnswerOption
                letter="C"
                state="incorrect"
                onClick={() => setSelectedQuiz('C')}
                feedback="Incorrecto: DISTINCT no corrige sumas infladas cuando los importes difieren."
              >
                Aplicar SELECT DISTINCT sobre el resultado final de la consulta agregada.
              </AnswerOption>
              <AnswerOption letter="D" disabled>
                Opción bloqueada tras verificar el punto de control.
              </AnswerOption>
            </div>
          </Card>
        </section>

        {/* 6. Tabs, Callouts y Toast */}
        <section className="l-stack l-stack--md" aria-labelledby="sec-tabs-callouts">
          <h2 id="sec-tabs-callouts" className="ui-showcase__sec-title">
            6. Pestañas (Tabs), Callouts Pedagógicos y Toast
          </h2>
          <div className="l-grid l-grid--2">
            <Card stage={activeStage}>
              <div className="l-stack l-stack--md">
                <h3 className="ui-showcase__card-title">Variantes de Tabs</h3>
                <Tabs
                  variant="pills"
                  stage={activeStage}
                  activeId={activeTabPills}
                  onChange={setActiveTabPills}
                  items={[
                    { id: 'sql', label: 'Consulta SQL', badge: 'DuckDB' },
                    { id: 'plan', label: 'Plan Físico', badge: 'EXPLAIN' },
                    { id: 'metrics', label: 'Métricas' },
                  ]}
                />
                <Tabs
                  variant="segmented"
                  stage={activeStage}
                  activeId={activeTabSegmented}
                  onChange={setActiveTabSegmented}
                  items={[
                    { id: 'star', label: 'Esquema Estrella' },
                    { id: 'obt', label: 'One Big Table (OBT)' },
                  ]}
                />
                <Tabs
                  variant="underline"
                  stage={activeStage}
                  activeId={activeTabUnderline}
                  onChange={setActiveTabUnderline}
                  items={[
                    { id: 'de', label: 'Lente DE' },
                    { id: 'da', label: 'Lente DA' },
                    { id: 'bi', label: 'Lente BI' },
                  ]}
                />
              </div>
            </Card>

            <Card stage={activeStage}>
              <div className="l-stack l-stack--sm">
                <Callout tone="stage" stage={activeStage} title="Regla de oro de la etapa">
                  Declara siempre el grano de cada CTE antes de escribir un <code>JOIN</code>.
                </Callout>
                <Callout tone="success" title="Invariante verificado">
                  La suma de <code>net_revenue</code> coincide exactamente con el libro mayor.
                </Callout>
                <Callout tone="warning" title="Advertencia de partición">
                  Ordenar por una columna de alta cardinalidad degrada los zone maps en Parquet.
                </Callout>
                <Callout tone="danger" title="Antipatrón detectado: Fan-out 1:N">
                  El cruce multiplicó 3 filas en 7 registros, inflando el ingreso un 62%.
                </Callout>
              </div>
            </Card>
          </div>

          <Toast
            tone="stage"
            stage={activeStage}
            open={toastOpen}
            title="¡Pista contextual desbloqueada!"
            description="Puedes inspeccionar las filas duplicadas activando el modo Diferencia en el simulador."
            action={
              <Button variant="secondary" size="sm" onClick={() => setSheetOpen(true)}>
                Abrir panel Sheet
              </Button>
            }
            onClose={() => setToastOpen(false)}
          />
        </section>

        {/* 7. Medallas de Etapa (Badge), EmptyState, Skeleton y Sheet */}
        <section className="l-stack l-stack--md" aria-labelledby="sec-badges">
          <div className="l-cluster l-cluster--between">
            <h2 id="sec-badges" className="ui-showcase__sec-title">
              7. Medallas de Etapa (Badge), EmptyState, Skeleton y Sheet
            </h2>
            <Button variant="secondary" size="sm" icon={Sliders} onClick={() => setSheetOpen(true)}>
              Probar Sheet Deslizable
            </Button>
          </div>

          <div className="l-grid l-grid--3">
            {STAGE_THEMES.map((st) => (
              <Badge
                key={st.id}
                stage={st.number}
                unlocked={st.number <= 4}
                title={`Etapa ${st.number} · ${st.shortName}`}
                subtitle={st.name}
              />
            ))}
          </div>

          <div className="l-grid l-grid--2">
            <EmptyState
              illustration={Compass}
              title="Sin tarjetas pendientes por hoy"
              description="Completaste todas las repeticiones espaciadas programadas en tu mazo Leitner."
              action={{
                label: 'Explorar Ruta de 6 Etapas',
                variant: 'primary',
                onClick: () => setSheetOpen(true),
              }}
            />
            <Card>
              <div className="l-stack l-stack--md">
                <div className="l-cluster l-cluster--between">
                  <h3 className="ui-showcase__card-title">Skeleton (Estados de carga)</h3>
                  <Chip variant="neutral">aria-busy</Chip>
                </div>
                <Skeleton variant="title" />
                <Skeleton variant="text" lines={3} />
                <Skeleton variant="block" />
              </div>
            </Card>
          </div>
        </section>

        {/* 8. Marca y Sistema de Ilustraciones SVG */}
        <section
          className="l-stack l-stack--md"
          data-agente7-illustrations="true"
          aria-label="Catálogo de Ilustraciones y Marca"
        >
          <IllustrationsShowcaseCatalog />
        </section>
      </main>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Glosario y Tutor Contextual"
        subtitle="Panel deslizable inferior en móvil (< 768px) y lateral en escritorio."
        footer={
          <div className="l-cluster l-cluster--end">
            <Button variant="secondary" size="sm" onClick={() => setSheetOpen(false)}>
              Cerrar
            </Button>
            <Button variant="primary" size="sm" icon={BookOpen} onClick={() => setSheetOpen(false)}>
              Entendido
            </Button>
          </div>
        }
      >
        <div className="l-stack l-stack--md">
          <Callout tone="info" title="Grano (Grain)">
            Nivel atómico de detalle que representa exactamente una fila en una tabla de hechos o CTE.
          </Callout>
          <p>
            Este componente <code>Sheet</code> gestiona foco, cierre mediante tecla{' '}
            <Kbd>Esc</Kbd> y clic en el telón de fondo.
          </p>
        </div>
      </Sheet>
    </div>
  );
}

export default UiShowcase;
