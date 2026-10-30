import React, { useState, useMemo } from 'react';
import {
  Check,
  Database,
  FileCode2,
  Link2,
  BookOpen,
} from 'lucide-react';
import { MODULES } from '../data/lessons/index.js';
import { LEVELS } from '../data/catalog/levels.js';
import { LESSONS_BY_ID } from '../data/lessons/index.js';
import {
  useProfile,
  useProgress,
  toggleProject,
  flushSave,
} from '../state/store.js';
import { Button, Segmented } from './ui/index.js';

function normalizeDatasetList(rawDataset) {
  if (Array.isArray(rawDataset)) {
    return rawDataset.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof rawDataset === 'string' && rawDataset.trim()) {
    return rawDataset
      .split(/\s*,\s*|\s+y\s+/i)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return ['brisa_orders', 'brisa_customers'];
}

const TRACK_FILTER_ITEMS = [
  { id: 'all', label: 'Todas' },
  { id: 'core', label: 'Tronco común' },
  { id: 'de', label: 'DE', track: 'de' },
  { id: 'da', label: 'DA', track: 'da' },
  { id: 'bi', label: 'BI', track: 'bi' },
];

const TRACK_NAMES = {
  core: 'Tronco común',
  de: 'Ingeniería de Datos (DE)',
  da: 'Análisis de Datos (DA)',
  bi: 'Business Intelligence (BI)',
};

// 3 proyectos integradores finales por área sobre Mercado Brisa
export const FINAL_AREA_PROJECTS = [
  {
    id: 'capstone-final-de',
    legacyId: 'capstone-finpulse-cloud',
    track: 'de',
    level: 4,
    isFinalIntegrative: true,
    code: 'PROYECTO INTEGRADOR · DE',
    title: 'Plataforma Lakehouse extremo a extremo de Mercado Brisa',
    prompt:
      'Construir la tubería de datos completa de Mercado Brisa desde el flujo CDC de pedidos, pagos y envíos hasta las tablas Apache Iceberg en capas Bronze, Silver y Gold gobernadas por un contrato ODCS v3 y modelos incrementales en SQLMesh.',
    dataset: [
      'brisa_cdc_orders',
      'brisa_cdc_payments',
      'brisa_cdc_shipments',
      'brisa_dim_customers_scd2',
    ],
    deliverable:
      'Repositorio con el contrato YAML ODCS v3, modelos SQLMesh (Bronze, Silver y Gold), script de auditoría Write-Audit-Publish sobre DuckDB/Iceberg y pruebas de reconciliación de grano.',
    relatedLessonId: 'l10-iceberg-v3-medallion',
    rubric: [
      {
        id: 'de-r1',
        criterion: '1. Contrato de datos y control de grano',
        detail:
          'El archivo ODCS v3 declara clave primaria, tipos de datos y umbral de retraso; la auditoría rechaza duplicados por reintento de webhook antes de publicar en Silver.',
      },
      {
        id: 'de-r2',
        criterion: '2. Idempotencia incremental por rango temporal',
        detail:
          'El modelo incremental en SQLMesh procesa ventanas [start_ds, end_ds] y produce exactamente el mismo conteo e importe aunque se ejecute dos veces seguidas.',
      },
      {
        id: 'de-r3',
        criterion: '3. Historial point-in-time sin fuga del futuro',
        detail:
          'El cruce entre pedidos y la dimensión de clientes SCD Tipo 2 asigna la categoría vigente en el instante exacto del pago mediante ASOF JOIN o intervalo [valid_from, valid_to).',
      },
      {
        id: 'de-r4',
        criterion: '4. Ordenamiento físico y verificación reproducible',
        detail:
          'Las tablas de salida se exportan en Parquet ordenadas por (order_date, store_id) e incluyen un comando único que ejecuta las pruebas de principio a fin.',
      },
    ],
  },
  {
    id: 'capstone-final-da',
    legacyId: 'capstone-rapidomarket',
    track: 'da',
    level: 4,
    isFinalIntegrative: true,
    code: 'PROYECTO INTEGRADOR · DA',
    title: 'Evaluación experimental y causal del programa Brisa Plus',
    prompt:
      'Auditar el lanzamiento del programa de envíos gratuitos Brisa Plus en Mercado Brisa combinando pruebas A/B con ajuste de varianza CUPED, matrices de retención por cohorte ajustadas por margen bruto y estimación cuasi-experimental por diferencias en diferencias.',
    dataset: [
      'brisa_exp_assignments',
      'brisa_pre_experiment_spend',
      'brisa_orders_margin',
      'brisa_regional_rollout',
    ],
    deliverable:
      'Cuaderno reproducible en Python/SQL (Marimo o DuckDB) con las consultas de validación estadística y memorando de decisión de una página con intervalos de confianza al 95 %.',
    relatedLessonId: 'l14-ab-testing-cuped',
    rubric: [
      {
        id: 'da-r1',
        criterion: '1. Verificación de asignación (SRM) antes de inferir',
        detail:
          'Calcula el estadístico Chi-cuadrado sobre la proporción de usuarios en control y tratamiento y verifica p >= 0.001 antes de reportar cualquier diferencia de conversión.',
      },
      {
        id: 'da-r2',
        criterion: '2. Reducción de varianza pre-experimental (CUPED)',
        detail:
          'Estima theta con la covarianza y varianza de las dos semanas previas al experimento sin filtrar usuarios post-tratamiento y reporta la reducción del error estándar.',
      },
      {
        id: 'da-r3',
        criterion: '3. Retención y LTV neto con censura por la derecha',
        detail:
          'Construye la matriz triangular de cohortes conservando NULL en los meses futuros aún no observados y descuenta devoluciones y costo logístico del margen bruto.',
      },
      {
        id: 'da-r4',
        criterion: '4. Recomendación cuantitativa con métricas guardia',
        detail:
          'El memorando presenta el efecto estimado, su intervalo de confianza al 95 %, el impacto sobre el margen neto y una decisión condicionada a umbrales explícitos.',
      },
    ],
  },
  {
    id: 'capstone-final-bi',
    legacyId: 'capstone-vertice-pay',
    track: 'bi',
    level: 4,
    isFinalIntegrative: true,
    code: 'PROYECTO INTEGRADOR · BI',
    title: 'Capa semántica, modelo en estrella y BI como código de Mercado Brisa',
    prompt:
      'Diseñar el esquema en estrella certificado de Mercado Brisa, definir su árbol de indicadores y medidas no aditivas en DAX y MetricFlow, configurar seguridad por filas (RLS) para gerentes regionales y publicar el informe operativo versionado en Git.',
    dataset: [
      'brisa_fact_sales',
      'brisa_fact_returns',
      'brisa_dim_store',
      'brisa_dim_product',
      'brisa_rls_manager_region',
    ],
    deliverable:
      'Repositorio con la especificación semántica YAML, el código de las medidas DAX comentadas, la matriz de pruebas RLS por rol y el reporte en Markdown + SQL.',
    relatedLessonId: 'l15-bi-tufte-code',
    rubric: [
      {
        id: 'bi-r1',
        criterion: '1. Modelo en estrella sin relaciones ambiguas',
        detail:
          'Las tablas de hechos de ventas y devoluciones se conectan a dimensiones conformadas (calendario, tienda, producto) con cardinalidad 1:N unidireccional.',
      },
      {
        id: 'bi-r2',
        criterion: '2. Medidas no aditivas y descomposición de tasas',
        detail:
          'El margen porcentual, el ticket medio y los clientes activos se calculan como razones de sumas o conteos distintos en el contexto de filtro, nunca promediando porcentajes diarios.',
      },
      {
        id: 'bi-r3',
        criterion: '3. Seguridad por filas (RLS) verificada',
        detail:
          'Incluye la tabla puente de permisos y comprueba que cada gerente regional vea únicamente sus tiendas sin alterar los totales comparativos autorizados.',
      },
      {
        id: 'bi-r4',
        criterion: '4. Diseño visual de alta densidad informativa',
        detail:
          'El tablero utiliza comparaciones de longitud alineadas, múltiplos pequeños por categoría y formato tabular para importes y variaciones.',
      },
    ],
  },
];

function buildModuleRubric(mod) {
  const tablesList = normalizeDatasetList(mod.projectSpec?.dataset).join(', ');
  return [
    {
      id: `${mod.id}-r1`,
      criterion: '1. Definición de grano e inspección de entrada',
      detail: `Declara por escrito qué representa una fila en cada tabla empleada (${tablesList}) y verifica la ausencia de duplicados de clave antes de transformar.`,
    },
    {
      id: `${mod.id}-r2`,
      criterion: '2. Exactitud técnica y reconciliación de totales',
      detail: `La solución resuelve el enunciado de «${mod.project}» cuadrando los conteos e importes contra las tablas fuente de Mercado Brisa.`,
    },
    {
      id: `${mod.id}-r3`,
      criterion: '3. Código limpio, reproducible y sin pasos manuales ocultos',
      detail:
        'Las consultas o scripts se ejecutan de principio a fin con nombres descriptivos, tipos explícitos y manejo controlado de valores nulos.',
    },
    {
      id: `${mod.id}-r4`,
      criterion: '4. Entregable verificable y justificación de criterio',
      detail: `Entrega completa de: ${mod.projectSpec?.deliverable || 'consulta y resumen ejecutivo con hallazgos verificados'}.`,
    },
  ];
}

export function CapstoneProjectsView({
  completedCapstoneIds = [],
  onToggleCompleteCapstone,
  onOpenLesson,
}) {
  const profile = useProfile();
  const progress = useProgress();

  const [trackFilter, setTrackFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [repoInputs, setRepoInputs] = useState({});
  const [checkedCriteria, setCheckedCriteria] = useState({});
  const [savedNoticeId, setSavedNoticeId] = useState(null);

  // Construir lista de los 26 proyectos de módulo desde MODULES
  const moduleProjects = useMemo(() => {
    return MODULES.map((mod) => {
      const firstExistingLesson = (mod.lessons || []).find(
        (l) => LESSONS_BY_ID[l.id] || (l.legacyId && LESSONS_BY_ID[l.legacyId])
      );
      const matchedLesson = firstExistingLesson
        ? LESSONS_BY_ID[firstExistingLesson.id] ||
          LESSONS_BY_ID[firstExistingLesson.legacyId]
        : null;

      return {
        id: `project-${mod.id}`,
        moduleId: mod.id,
        track: mod.track,
        level: mod.level,
        isFinalIntegrative: false,
        code: `MÓDULO ${mod.id.toUpperCase()} · NIVEL ${mod.level}`,
        moduleTitle: mod.title,
        title: mod.project,
        prompt:
          mod.projectSpec?.prompt ||
          `Aplicar los contenidos de ${mod.title} sobre los datos operativos de Mercado Brisa.`,
        dataset: normalizeDatasetList(mod.projectSpec?.dataset),
        deliverable:
          mod.projectSpec?.deliverable ||
          'Consulta SQL comentada y tabla de validación sobre Mercado Brisa.',
        relatedLessonId: matchedLesson
          ? matchedLesson.legacyId || matchedLesson.id
          : null,
        relatedStageId: matchedLesson?.stageId || 'stage-1',
        rubric: buildModuleRubric(mod),
      };
    });
  }, []);

  const isProjectCompleted = (proj) => {
    const storeEntry =
      progress?.projects?.[proj.id] ||
      (proj.legacyId ? progress?.projects?.[proj.legacyId] : null) ||
      (proj.moduleId ? progress?.projects?.[proj.moduleId] : null);
    if (storeEntry && typeof storeEntry.completed === 'boolean') {
      return storeEntry.completed;
    }
    return (
      completedCapstoneIds.includes(proj.id) ||
      (proj.legacyId ? completedCapstoneIds.includes(proj.legacyId) : false)
    );
  };

  const getSavedRepoUrl = (proj) => {
    if (repoInputs[proj.id] !== undefined) return repoInputs[proj.id];
    const storeEntry =
      progress?.projects?.[proj.id] ||
      (proj.legacyId ? progress?.projects?.[proj.legacyId] : null) ||
      (proj.moduleId ? progress?.projects?.[proj.moduleId] : null);
    return storeEntry?.repoUrl || '';
  };

  const handleToggleDelivered = (proj) => {
    const currentlyDone = isProjectCompleted(proj);
    const nextDone = !currentlyDone;
    const currentRepo = getSavedRepoUrl(proj).trim();

    toggleProject(proj.id, {
      completed: nextDone,
      repoUrl: currentRepo,
    });
    if (proj.legacyId && typeof onToggleCompleteCapstone === 'function') {
      onToggleCompleteCapstone(proj.legacyId, {
        completed: nextDone,
        repoUrl: currentRepo,
      });
    }
    flushSave();
  };

  const handleSaveRepoUrl = (proj, explicitUrl) => {
    const cleanUrl = (
      explicitUrl !== undefined ? explicitUrl : getSavedRepoUrl(proj)
    ).trim();
    const currentlyDone = isProjectCompleted(proj);
    const nextDone = cleanUrl ? true : currentlyDone;

    toggleProject(proj.id, {
      completed: nextDone,
      repoUrl: cleanUrl,
    });
    flushSave();
    setSavedNoticeId(proj.id);
    setTimeout(() => {
      setSavedNoticeId((prev) => (prev === proj.id ? null : prev));
    }, 2200);
  };

  const toggleCriterion = (criterionId) => {
    setCheckedCriteria((prev) => ({
      ...prev,
      [criterionId]: !prev[criterionId],
    }));
  };

  const filteredFinalProjects = useMemo(() => {
    if (trackFilter === 'all' || trackFilter === 'core') {
      return FINAL_AREA_PROJECTS;
    }
    return FINAL_AREA_PROJECTS.filter((p) => p.track === trackFilter);
  }, [trackFilter]);

  const filteredModuleProjects = useMemo(() => {
    return moduleProjects.filter((p) => {
      const matchTrack = trackFilter === 'all' ? true : p.track === trackFilter;
      const matchLevel =
        levelFilter === 'all' ? true : p.level === Number(levelFilter);
      return matchTrack && matchLevel;
    });
  }, [moduleProjects, trackFilter, levelFilter]);

  const totalDeliveredCount = useMemo(() => {
    const all = [...FINAL_AREA_PROJECTS, ...moduleProjects];
    return all.filter((p) => isProjectCompleted(p)).length;
  }, [moduleProjects, progress?.projects, completedCapstoneIds]);

  const renderProjectCard = (proj) => {
    const completed = isProjectCompleted(proj);
    const repoValue = getSavedRepoUrl(proj);

    return (
      <article
        key={proj.id}
        className={`project-card ${completed ? 'is-completed' : ''} ${
          proj.isFinalIntegrative ? 'project-card--final' : ''
        }`.trim()}
        data-testid={`project-card-${proj.id}`}
      >
        <header className="project-card__header">
          <div className="project-card__meta">
            <span
              className={`project-track-tag project-track-tag--${proj.track}`}
            >
              <span
                className={`project-track-dot project-track-dot--${proj.track}`}
                aria-hidden="true"
              />
              {TRACK_NAMES[proj.track] || 'Tronco común'}
            </span>
            <span className="project-card__code">{proj.code}</span>
            {proj.moduleTitle && (
              <span className="project-card__module">{proj.moduleTitle}</span>
            )}
          </div>

          <div className="project-card__title-row">
            <h3 className="project-card__title">{proj.title}</h3>
            {completed && (
              <span className="project-status-pill">
                <Check size={13} aria-hidden="true" />
                <span>Entregado</span>
              </span>
            )}
          </div>

          <p className="project-card__prompt">{proj.prompt}</p>
        </header>

        <div className="project-card__specs">
          <div className="project-spec-block">
            <span className="project-spec-block__label" style={{ color: 'var(--text-2)' }}>
              <Database size={13} aria-hidden="true" />
              <span>Tablas de Mercado Brisa</span>
            </span>
            <div className="project-dataset-tags">
              {proj.dataset.map((table) => (
                <code key={table} className="project-dataset-code">
                  {table}
                </code>
              ))}
            </div>
          </div>

          <div className="project-spec-block">
            <span className="project-spec-block__label" style={{ color: 'var(--text-2)' }}>
              <FileCode2 size={13} aria-hidden="true" />
              <span>Entregable esperado</span>
            </span>
            <p className="project-spec-block__text">{proj.deliverable}</p>
          </div>
        </div>

        {/* Rúbrica verificable de 4 criterios */}
        <div className="project-rubric">
          <div className="project-rubric__head">
            <span className="project-rubric__title">
              Rúbrica verificable (4 criterios)
            </span>
            <span className="project-rubric__hint">
              Marca cada criterio al revisar tu entrega
            </span>
          </div>
          <ul className="project-rubric__list">
            {proj.rubric.map((item) => {
              const isChecked = Boolean(checkedCriteria[item.id]);
              return (
                <li key={item.id} className="project-rubric__item">
                  <label className="project-rubric__label">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCriterion(item.id)}
                      className="project-rubric__checkbox"
                    />
                    <span className="project-rubric__copy">
                      <strong className="project-rubric__crit">
                        {item.criterion}
                      </strong>
                      <span className="project-rubric__detail">
                        {item.detail}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Pie de entrega: Casilla "Lo entregué" + URL opcional de repositorio */}
        <footer className="project-card__footer">
          <label className="project-delivered-toggle">
            <input
              type="checkbox"
              checked={completed}
              onChange={() => handleToggleDelivered(proj)}
              className="project-delivered-toggle__input"
              data-testid={`project-checkbox-${proj.id}`}
            />
            <span className="project-delivered-toggle__label">Lo entregué</span>
          </label>

          <div className="project-repo-form">
            <Link2
              size={14}
              aria-hidden="true"
              className="project-repo-form__icon"
            />
            <input
              type="url"
              className="project-repo-form__input"
              value={repoValue}
              onChange={(e) =>
                setRepoInputs((prev) => ({
                  ...prev,
                  [proj.id]: e.target.value,
                }))
              }
              onBlur={(e) => {
                if (e.target.value.trim()) {
                  handleSaveRepoUrl(proj, e.target.value);
                }
              }}
              placeholder="URL opcional de tu repositorio (https://github.com/...)"
              aria-label={`URL del repositorio para ${proj.title}`}
              data-testid={`project-repo-${proj.id}`}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleSaveRepoUrl(proj)}
            >
              {savedNoticeId === proj.id ? 'Guardado' : 'Guardar URL'}
            </Button>
          </div>

          {proj.relatedLessonId && typeof onOpenLesson === 'function' && (
            <button
              type="button"
              className="project-lesson-ref"
              onClick={() =>
                onOpenLesson(
                  proj.relatedStageId || 'stage-1',
                  proj.relatedLessonId
                )
              }
            >
              <BookOpen size={13} aria-hidden="true" />
              <span>Repasar lección base</span>
            </button>
          )}
        </footer>
      </article>
    );
  };

  return (
    <div className="sec-view projects-view" data-view="capstones">
      <header className="sec-header">
        <div className="sec-header__top">
          <div>
            <span className="sec-kicker tabular">
              CASO TRANSVERSAL MERCADO BRISA · {totalDeliveredCount} DE{' '}
              {FINAL_AREA_PROJECTS.length + moduleProjects.length} ENTREGADOS
            </span>
            <h1 className="sec-title">Proyectos</h1>
            <p className="sec-lead">
              Cada módulo culmina en un entregable práctico sobre las tablas de Mercado Brisa y cada área cierra con un proyecto integrador de portafolio.
            </p>
          </div>
        </div>

        <div className="projects-toolbar">
          <Segmented
            ariaLabel="Filtrar proyectos por área"
            items={TRACK_FILTER_ITEMS}
            value={trackFilter}
            onChange={(val) => setTrackFilter(val)}
            size="sm"
          />

          <div className="projects-toolbar__level">
            <label
              htmlFor="projects-level-select"
              className="projects-toolbar__label"
            >
              Nivel:
            </label>
            <select
              id="projects-level-select"
              className="settings-select"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            >
              <option value="all">Todos los niveles (0 a 4)</option>
              {LEVELS.map((lvl) => (
                <option key={lvl.level} value={String(lvl.level)}>
                  Nivel {lvl.level} · {lvl.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* 1. Proyectos integradores finales por área (DE, DA, BI) */}
      <section
        className="sec-section"
        aria-labelledby="projects-final-heading"
        data-testid="projects-final-section"
      >
        <div className="sec-section__head">
          <div>
            <h2 id="projects-final-heading" className="sec-section__title">
              Proyectos integradores finales por área ({filteredFinalProjects.length})
            </h2>
            <p className="sec-section__sub">
              Un proyecto de extremo a extremo por especialidad (DE, DA y BI) sobre la operación completa de Mercado Brisa.
            </p>
          </div>
        </div>

        <div className="projects-stack">
          {filteredFinalProjects.map((proj) => renderProjectCard(proj))}
        </div>
      </section>

      {/* 2. Proyectos por módulo (26 módulos del catálogo) */}
      <section
        className="sec-section"
        aria-labelledby="projects-modules-heading"
        data-testid="projects-modules-section"
      >
        <div className="sec-section__head">
          <div>
            <h2 id="projects-modules-heading" className="sec-section__title">
              Proyectos por módulo ({filteredModuleProjects.length})
            </h2>
            <p className="sec-section__sub">
              Entregables acotados de cada módulo curricular para consolidar la práctica antes de pasar al siguiente bloque.
            </p>
          </div>
        </div>

        <div className="projects-stack">
          {filteredModuleProjects.map((proj) => renderProjectCard(proj))}
        </div>
      </section>
    </div>
  );
}

export default CapstoneProjectsView;
