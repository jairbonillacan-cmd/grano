import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  BookOpen,
  ArrowRight,
  GitCompare,
  ExternalLink,
} from 'lucide-react';
import {
  GLOSSARY_TERMS,
  GLOSSARY_BY_ID,
  GLOSSARY_CONCEPTS_2026,
} from '../data/glossary.js';
import { LESSONS_BY_ID } from '../data/lessons/index.js';
import { MODULES_BY_ID } from '../data/catalog/modules.js';
import { Segmented, EmptyState, Button } from './ui/index.js';

export { GLOSSARY_TERMS, GLOSSARY_BY_ID, GLOSSARY_CONCEPTS_2026 };

const TRACK_FILTER_ITEMS = [
  { id: 'all', label: 'Todas' },
  { id: 'core', label: 'Tronco común' },
  { id: 'de', label: 'DE', track: 'de' },
  { id: 'da', label: 'DA', track: 'da' },
  { id: 'bi', label: 'BI', track: 'bi' },
];

const TRACK_LABELS = {
  core: 'Tronco común',
  de: 'Ingeniería de Datos (DE)',
  da: 'Análisis de Datos (DA)',
  bi: 'Business Intelligence (BI)',
};

// Desambiguación técnica ("Se confunde con…") para cada término del glosario
const CONFUSED_WITH_BY_ID = {
  'c01-grain-fanout': {
    targetId: 'c02-cte-preagg',
    title: 'Producto cartesiano accidental (CROSS JOIN)',
    explanation:
      'Un CROSS JOIN une todas las filas contra todas por omitir la condición ON; el fan-out ocurre incluso con un ON válido cuando unes dos tablas con distinto grano (1:N) y sumas una columna de la tabla del lado 1.',
  },
  'c02-cte-preagg': {
    targetId: 'c01-grain-fanout',
    title: 'Usar DISTINCT después de hacer el JOIN',
    explanation:
      'Aplicar SELECT DISTINCT tras un JOIN 1:N no corrige la suma de importes si dos pedidos distintos comparten el mismo monto; pre-agregar en una CTE al grano 1:1 antes de cruzar preserva cada importe con exactitud.',
  },
  'c03-window-qualify': {
    targetId: 'c05-window-frames',
    title: 'GROUP BY con funciones agregadas',
    explanation:
      'GROUP BY colapsa las filas originales en una sola por grupo; una función de ventana conserva cada fila individual y QUALIFY filtra el resultado de la ventana sin necesidad de anidar subconsultas.',
  },
  'c04-asof-join': {
    targetId: 'c08-point-in-time',
    title: 'LEFT JOIN con igualdad exacta de marca temporal',
    explanation:
      'Un LEFT JOIN por timestamp exacto pierde casi todos los cruces porque los relojes de eventos y cotizaciones rara vez coinciden al milisegundo; ASOF JOIN empareja la fila previa más reciente (<=) sin expandir un rango completo.',
  },
  'c05-window-frames': {
    targetId: 'c03-window-qualify',
    title: 'ROWS BETWEEN frente a RANGE BETWEEN',
    explanation:
      'ROWS cuenta un número fijo de filas físicas independientemente de si faltan fechas en el calendario; RANGE agrupa por el valor lógico del intervalo (por ejemplo, 7 días calendario) y maneja empates y huecos temporales.',
  },
  'c06-star-vs-obt': {
    targetId: 'c07-scd-type-2',
    title: 'Tablas transaccionales normalizadas (3FN) frente a One Big Table (OBT)',
    explanation:
      'El modelo en tercera forma normal optimiza escrituras unitarias en OLTP; el esquema en estrella separa hechos y dimensiones para gobernar atributos, mientras que OBT desnormaliza todo en una tabla ancha para lecturas columnares.',
  },
  'c07-scd-type-2': {
    targetId: 'c08-point-in-time',
    title: 'SCD Tipo 1 (sobrescritura) y tablas de auditoría de eventos',
    explanation:
      'SCD Tipo 1 sobrescribe el atributo antiguo y reescribe la historia pasada; SCD Tipo 2 versiona cada cambio con intervalos de validez [valid_from, valid_to) y una clave subrogada propia por versión.',
  },
  'c08-point-in-time': {
    targetId: 'c07-scd-type-2',
    title: 'Partición temporal simple entre entrenamiento y prueba',
    explanation:
      'Separar filas por fecha de corte no evita la fuga del futuro si las columnas de dimensión provienen de una tabla sobrescrita con el estado actual del cliente; la integridad point-in-time exige cruzar con el estado vigente en el instante del evento.',
  },
  'c09-kpi-trees-guardrails': {
    targetId: 'c10-simpsons-paradox',
    title: 'Listado plano de indicadores (vanity metrics)',
    explanation:
      'Una lista de métricas aisladas no explica qué palanca movió el resultado ni qué costo colateral produjo; un árbol de KPIs vincula algebraicamente las palancas de entrada con la métrica principal y sus métricas guardia.',
  },
  'c10-simpsons-paradox': {
    targetId: 'c11-additivity-hll',
    title: 'Sesgo de selección o error de cálculo en promedios',
    explanation:
      'En la paradoja de Simpson las tasas por segmento están bien calculadas; la inversión de la tendencia global ocurre porque cambió el peso relativo (mix de volumen) entre segmentos con distinta tasa base.',
  },
  'c11-additivity-hll': {
    targetId: 'c10-simpsons-paradox',
    title: 'Promediar porcentajes diarios o sumar COUNT(DISTINCT) por día',
    explanation:
      'Una métrica aditiva (ingresos) puede sumarse a través de días y canales; un conteo único de clientes o una tasa de conversión es no aditiva y sumar sus totales diarios cuenta varias veces a la misma persona.',
  },
  'c12-parquet-columnar': {
    targetId: 'c14-apache-arrow-zerocopy',
    title: 'CSV comprimido con GZIP o Apache Arrow en memoria',
    explanation:
      'Un CSV comprimido obliga a leer todas las columnas de cada fila; Parquet almacena bloques columnares en disco con compresión por diccionario, mientras que Arrow es el formato columnar en memoria RAM para cómputo sin serialización.',
  },
  'c13-zone-maps-skipping': {
    targetId: 'c12-parquet-columnar',
    title: 'Índices B-Tree de bases relacionales OLTP',
    explanation:
      'Un índice B-Tree apunta a filas individuales y ocupa espacio adicional; un Zone Map guarda únicamente el mínimo y máximo de cada bloque de filas en Parquet y permite descartar bloques enteros si la tabla está ordenada por la columna filtrada.',
  },
  'c14-apache-arrow-zerocopy': {
    targetId: 'c12-parquet-columnar',
    title: 'Formato de archivo en disco (Parquet)',
    explanation:
      'Parquet está diseñado para almacenamiento compacto en disco o S3; Apache Arrow define la disposición de búferes columnares en memoria RAM para intercambiar tablas entre motores sin copiar ni deserializar bytes.',
  },
  'c15-duckdb-polars-lazy': {
    targetId: 'c16-duckdb-wasm-bi',
    title: 'Ejecución ansiosa (Eager DataFrame) en pandas o Polars read_parquet',
    explanation:
      'La lectura ansiosa carga todas las filas y columnas en RAM antes de filtrar; LazyFrame (scan_parquet) construye primero un plan de consulta y empuja los filtros y proyecciones hasta el archivo Parquet.',
  },
  'c16-duckdb-wasm-bi': {
    targetId: 'c15-duckdb-polars-lazy',
    title: 'Consultas SQL enviadas a un almacén remoto desde el navegador',
    explanation:
      'En un tablero tradicional cada filtro envía una petición HTTP al servidor de base de datos; con DuckDB-Wasm el motor SQL corre dentro de la pestaña del navegador leyendo rangos de bytes de archivos Parquet.',
  },
  'c17-medallion-architecture': {
    targetId: 'c18-iceberg-v3',
    title: 'Esquema en estrella dentro de una única capa',
    explanation:
      'La arquitectura Medallion (Bronze, Silver, Gold) organiza las etapas de calidad y reprocesamiento del dato desde la ingesta cruda hasta el consumo; el esquema en estrella es el modelo relacional que suele aplicarse en las capas Silver y Gold.',
  },
  'c18-iceberg-v3': {
    targetId: 'c12-parquet-columnar',
    title: 'Carpetas sueltas de archivos Parquet en almacenamiento de objetos',
    explanation:
      'Parquet es el archivo físico de datos; Apache Iceberg es la capa de metadatos transaccionales que mantiene instantáneas atómicas, evolución de esquema y vectores de borrado sobre esos archivos Parquet.',
  },
  'c19-data-contracts-odcs': {
    targetId: 'c20-sqlmesh-dbt-dag',
    title: 'Pruebas reactivas después de ingerir en el almacén',
    explanation:
      'Un test posterior a la carga avisa cuando la tabla ya se rompió; un contrato ODCS v3 valida esquema, semántica y acuerdos de servicio en integración continua antes de que el productor publique un cambio incompatible.',
  },
  'c20-sqlmesh-dbt-dag': {
    targetId: 'c19-data-contracts-odcs',
    title: 'Orquestador de tareas de infraestructura (Airflow / Dagster)',
    explanation:
      'El orquestador programa y supervisa procesos externos; el motor de transformación (SQLMesh o dbt) analiza las dependencias entre modelos SQL, ejecuta pruebas de grano y gestiona entornos virtuales de datos.',
  },
  'c21-semantic-layer': {
    targetId: 'c06-star-vs-obt',
    title: 'Vistas SQL estáticas o medidas duplicadas en cada tablero',
    explanation:
      'Una vista SQL fija un nivel de agregación concreto; la capa semántica declara métricas, dimensiones y relaciones para generar dinámicamente el SQL correcto según el nivel de agrupación solicitado.',
  },
  'c22-cohort-retention-ltv': {
    targetId: 'c11-additivity-hll',
    title: 'Tasa de bajas mensual agregada sobre toda la cartera',
    explanation:
      'Mezclar clientes recién registrados con usuarios antiguos oculta el deterioro temprano; el análisis por cohortes separa cada generación por su mes de alta y respeta los periodos futuros aún no observados (censura por la derecha).',
  },
  'c23-srm-ab-testing': {
    targetId: 'c24-cuped-variance',
    title: 'Ruido aleatorio normal en el tamaño de muestra',
    explanation:
      'Una desviación estadísticamente significativa en la proporción de usuarios asignados (SRM) no es mala suerte muestral: indica pérdida asimétrica de telemetría o redirección fallida que invalida cualquier conclusión del experimento.',
  },
  'c24-cuped-variance': {
    targetId: 'c23-srm-ab-testing',
    title: 'Eliminar valores atípicos (outliers) después del experimento',
    explanation:
      'Borrar usuarios de alto gasto tras el experimento introduce sesgo; CUPED ajusta linealmente la métrica usando solo la covariable medida antes de asignar el tratamiento, reduciendo la varianza sin sesgar el estimador.',
  },
  'c25-tufte-visual-perception': {
    targetId: 'c16-duckdb-wasm-bi',
    title: 'Gráficos circulares o de doble eje vertical',
    explanation:
      'El sistema visual humano estima ángulos y áreas con baja precisión; comparar longitudes alineadas sobre una escala común o en múltiplos pequeños permite detectar diferencias reales sin distorsión.',
  },
  'c26-bi-as-code': {
    targetId: 'c27-cdc-flink-watermarks',
    title: 'Extracción por lotes mediante consultas SELECT con updated_at',
    explanation:
      'Consultar periódicamente una tabla por updated_at sobrecarga la base transaccional y no detecta filas borradas físicamente; CDC basado en logs lee el registro de transacciones (WAL) y captura cada inserción, cambio y borrado.',
  },
  'c27-cdc-flink-watermarks': {
    targetId: 'c26-bi-as-code',
    title: 'Agrupar flujos por hora de llegada al servidor (Processing Time)',
    explanation:
      'Agrupar por la hora en que el servidor recibe el paquete distorsiona las métricas cuando hay retrasos de red; Event Time con Watermarks asigna cada evento a la ventana en que ocurrió realmente.',
  },
  'c28-mcp-semantic-rag-evals': {
    targetId: 'c21-semantic-layer',
    title: 'Generación libre de SQL (Text-to-SQL directo sobre tablas crudas)',
    explanation:
      'Permitir que un modelo de lenguaje escriba JOINs arbitrarios sobre cientos de tablas crudas produce errores de grano y sumas infladas; exponer la capa semántica mediante herramientas MCP restringe las consultas a métricas gobernadas.',
  },
};

function firstSentence(text = '') {
  const clean = String(text || '').trim();
  if (!clean) return '';
  const match = clean.match(/^[^.!?]+[.!?]/);
  return match ? match[0].trim() : clean;
}

export function GlossaryAndGraphView({ onOpenLesson }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [trackFilter, setTrackFilter] = useState('all');

  // Enriquecer GLOSSARY_TERMS con ejemplos completos y desambiguación
  const catalogTerms = useMemo(() => {
    const legacyById = Object.fromEntries(
      (GLOSSARY_CONCEPTS_2026 || []).map((item) => [item.id, item])
    );

    return GLOSSARY_TERMS.map((term) => {
      const legacy = legacyById[term.id] || {};
      const fullDef =
        legacy.plainDefinition &&
        legacy.plainDefinition.length >= (term.definition || '').length
          ? legacy.plainDefinition
          : term.definition;

      const codeExample =
        legacy.syntaxExample || term.formula || '-- Sin ejemplo de código';

      // Deduplicar lecciones relacionadas resolviendo IDs v2 y legacy
      const lessonMap = new Map();
      for (const rawId of term.relatedLessons || []) {
        const matched = LESSONS_BY_ID[rawId];
        if (matched) {
          const canonicalKey = matched.id || rawId;
          if (!lessonMap.has(canonicalKey)) {
            const mod = MODULES_BY_ID[matched.moduleId] || null;
            lessonMap.set(canonicalKey, {
              id: matched.legacyId || matched.id,
              v2Id: matched.id,
              stageId: matched.stageId || 'stage-1',
              order: matched.legacyOrder ?? matched.order,
              title: matched.title,
              moduleTitle: mod?.title || matched.subtitle || '',
              level: mod?.level ?? matched.level ?? 1,
            });
          }
        }
      }

      const resolvedLessons = Array.from(lessonMap.values());
      const confusedWith = CONFUSED_WITH_BY_ID[term.id] || {
        targetId: term.relatedTerms?.[0] || null,
        title: 'Conceptos cercanos del mismo bloque',
        explanation:
          'Revisa el grano de la tabla y las precondiciones antes de aplicar esta técnica en tus consultas.',
      };

      return {
        ...term,
        fullDefinition: fullDef,
        shortDefinition: firstSentence(fullDef),
        codeExample,
        resolvedLessons,
        lessonCount: resolvedLessons.length || 1,
        confusedWith,
      };
    }).sort((a, b) => a.term.localeCompare(b.term, 'es'));
  }, []);

  const filteredTerms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return catalogTerms.filter((item) => {
      const matchesTrack =
        trackFilter === 'all' ? true : item.track === trackFilter;
      if (!matchesTrack) return false;
      if (!q) return true;
      return (
        item.term.toLowerCase().includes(q) ||
        item.englishTerm?.toLowerCase().includes(q) ||
        item.fullDefinition.toLowerCase().includes(q) ||
        item.codeExample.toLowerCase().includes(q)
      );
    });
  }, [catalogTerms, searchQuery, trackFilter]);

  const [selectedId, setSelectedId] = useState(
    () => catalogTerms[0]?.id || 'c01-grain-fanout'
  );

  const activeTerm = useMemo(() => {
    const inFiltered = filteredTerms.find((t) => t.id === selectedId);
    if (inFiltered) return inFiltered;
    if (filteredTerms.length > 0) return filteredTerms[0];
    return catalogTerms.find((t) => t.id === selectedId) || catalogTerms[0];
  }, [filteredTerms, selectedId, catalogTerms]);

  const relatedTermObjects = useMemo(() => {
    if (!activeTerm) return [];
    return (activeTerm.relatedTerms || [])
      .map((relId) => catalogTerms.find((t) => t.id === relId))
      .filter(Boolean);
  }, [activeTerm, catalogTerms]);

  const confusedTargetTerm = useMemo(() => {
    const targetId = activeTerm?.confusedWith?.targetId;
    if (!targetId) return null;
    return catalogTerms.find((t) => t.id === targetId) || null;
  }, [activeTerm, catalogTerms]);

  const handleSelectTerm = (termId) => {
    const target = catalogTerms.find((t) => t.id === termId);
    if (!target) return;
    if (trackFilter !== 'all' && target.track !== trackFilter) {
      setTrackFilter('all');
    }
    if (
      searchQuery.trim() &&
      !target.term.toLowerCase().includes(searchQuery.trim().toLowerCase())
    ) {
      setSearchQuery('');
    }
    setSelectedId(termId);
  };

  return (
    <div className="sec-view glossary-view" data-view="glossary">
      <header className="sec-header">
        <div className="sec-header__top">
          <div>
            <span className="sec-kicker tabular">
              REFERENCIA TÉCNICA · {catalogTerms.length} TÉRMINOS VERIFICADOS
            </span>
            <h1 className="sec-title">Glosario</h1>
            <p className="sec-lead">
              Definiciones operativas, sintaxis de referencia, desambiguaciones frecuentes y enlaces directos a las lecciones donde se aplican.
            </p>
          </div>
        </div>

        <div className="glossary-controls">
          <div className="glossary-search">
            <Search
              size={16}
              aria-hidden="true"
              className="glossary-search__icon"
            />
            <input
              type="search"
              className="glossary-search__input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar término, sintaxis SQL o concepto en inglés..."
              aria-label="Buscar término en el glosario"
            />
            {searchQuery && (
              <button
                type="button"
                className="glossary-search__clear"
                onClick={() => setSearchQuery('')}
                aria-label="Limpiar búsqueda"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="glossary-filter-row">
            <Segmented
              ariaLabel="Filtrar glosario por área"
              items={TRACK_FILTER_ITEMS}
              value={trackFilter}
              onChange={(val) => setTrackFilter(val)}
              size="sm"
            />
            <span className="glossary-count tabular">
              {filteredTerms.length} de {catalogTerms.length} términos
            </span>
          </div>
        </div>
      </header>

      {filteredTerms.length === 0 ? (
        <EmptyState
          title="Sin coincidencias en el glosario"
          description={`No encontramos términos para "${searchQuery}" en el filtro seleccionado.`}
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setTrackFilter('all');
              }}
            >
              Restablecer filtros
            </Button>
          }
        />
      ) : (
        <div className="glossary-workspace">
          {/* Columna izquierda: lista alfabética */}
          <aside
            className="glossary-list-pane"
            aria-label="Índice alfabético de términos"
          >
            <ul className="glossary-list" aria-label="Términos del glosario">
              {filteredTerms.map((item) => {
                const isSelected = activeTerm?.id === item.id;
                return (
                  <li key={item.id} className="glossary-list__li">
                    <button
                      type="button"
                      className={`glossary-list__item ${
                        isSelected ? 'is-active' : ''
                      }`.trim()}
                      onClick={() => setSelectedId(item.id)} aria-pressed={isSelected}
                    >
                      <div className="glossary-list__top">
                        <span className="glossary-list__term">{item.term}</span>
                        <span className="glossary-list__badge tabular" style={{ color: 'var(--text-2)' }}>
                          {item.lessonCount}{' '}
                          {item.lessonCount === 1 ? 'lección' : 'lecciones'}
                        </span>
                      </div>
                      <p className="glossary-list__short">
                        {item.shortDefinition}
                      </p>
                      <div className="glossary-list__meta">
                        <span
                          className={`glossary-track-tag glossary-track-tag--${item.track}`}
                        >
                          <span
                            className={`glossary-track-dot glossary-track-dot--${item.track}`}
                            aria-hidden="true"
                          />
                          {TRACK_LABELS[item.track] || 'Tronco común'}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* Columna derecha: detalle del término */}
          {activeTerm && (
            <article
              className="glossary-detail-pane"
              aria-labelledby="glossary-detail-title"
              data-testid="glossary-detail"
            >
              <header className="glossary-detail__header">
                <div className="glossary-detail__tags">
                  <span
                    className={`glossary-track-tag glossary-track-tag--${activeTerm.track}`}
                  >
                    <span
                      className={`glossary-track-dot glossary-track-dot--${activeTerm.track}`}
                      aria-hidden="true"
                    />
                    {TRACK_LABELS[activeTerm.track] || 'Tronco común'}
                  </span>
                  {activeTerm.englishTerm && (
                    <span className="glossary-detail__english">
                      {activeTerm.englishTerm}
                    </span>
                  )}
                </div>

                <h2 id="glossary-detail-title" className="glossary-detail__title">
                  {activeTerm.term}
                </h2>
              </header>

              {/* Definición completa */}
              <section className="glossary-detail__section">
                <h3 className="glossary-detail__label">Definición</h3>
                <p className="glossary-detail__definition">
                  {activeTerm.fullDefinition}
                </p>
              </section>

              {/* Ejemplo de código */}
              <section className="glossary-detail__section">
                <h3 className="glossary-detail__label">
                  Ejemplo de código y sintaxis
                </h3>
                <pre className="glossary-code-block" tabIndex={0} aria-label="Ejemplo de código y sintaxis">
                  <code>{activeTerm.codeExample}</code>
                </pre>
              </section>

              {/* Se confunde con... (confusedWith) */}
              <section
                className="glossary-detail__section glossary-confused-box"
                aria-labelledby="glossary-confused-heading"
                data-testid="glossary-confused-with"
              >
                <div className="glossary-confused-box__head">
                  <GitCompare size={15} aria-hidden="true" />
                  <h3
                    id="glossary-confused-heading"
                    className="glossary-confused-box__title"
                  >
                    Se confunde con: {activeTerm.confusedWith.title}
                  </h3>
                </div>
                <p className="glossary-confused-box__body">
                  {activeTerm.confusedWith.explanation}
                </p>
                {confusedTargetTerm && (
                  <button
                    type="button"
                    className="glossary-confused-box__link"
                    onClick={() => handleSelectTerm(confusedTargetTerm.id)}
                  >
                    <span>
                      Comparar con «{confusedTargetTerm.term}»
                    </span>
                    <ArrowRight size={13} aria-hidden="true" />
                  </button>
                )}
              </section>

              {/* Lecciones relacionadas */}
              <section className="glossary-detail__section">
                <h3 className="glossary-detail__label">
                  Lecciones donde se estudia ({activeTerm.resolvedLessons.length})
                </h3>
                <div className="glossary-lessons-list">
                  {activeTerm.resolvedLessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      type="button"
                      className="glossary-lesson-link"
                      onClick={() => onOpenLesson?.(lesson.stageId, lesson.id)}
                    >
                      <BookOpen
                        size={15}
                        aria-hidden="true"
                        className="glossary-lesson-link__icon"
                      />
                      <span className="glossary-lesson-link__main">
                        <span className="glossary-lesson-link__title">
                          L{String(lesson.order).padStart(2, '0')} · {lesson.title}
                        </span>
                        <span className="glossary-lesson-link__sub">
                          Nivel {lesson.level} · {lesson.moduleTitle}
                        </span>
                      </span>
                      <span className="glossary-lesson-link__cta">
                        Abrir lección
                        <ArrowRight size={13} aria-hidden="true" />
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Términos relacionados clicables (reemplaza el antiguo grafo truncado) */}
              {relatedTermObjects.length > 0 && (
                <section className="glossary-detail__section">
                  <h3 className="glossary-detail__label">
                    Términos relacionados ({relatedTermObjects.length})
                  </h3>
                  <div className="glossary-related-grid">
                    {relatedTermObjects.map((rel) => (
                      <button
                        key={rel.id}
                        type="button"
                        className="glossary-related-card"
                        onClick={() => handleSelectTerm(rel.id)}
                      >
                        <div className="glossary-related-card__top">
                          <span
                            className={`glossary-track-dot glossary-track-dot--${rel.track}`}
                            aria-hidden="true"
                          />
                          <span className="glossary-related-card__name">
                            {rel.term}
                          </span>
                        </div>
                        <p className="glossary-related-card__desc">
                          {rel.shortDefinition}
                        </p>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Fuentes primarias */}
              {Array.isArray(activeTerm.sources) &&
                activeTerm.sources.length > 0 && (
                  <section className="glossary-detail__section glossary-sources">
                    <h3 className="glossary-detail__label">
                      Documentación y fuentes primarias
                    </h3>
                    <ul className="glossary-sources__list">
                      {activeTerm.sources.map((src, idx) => (
                        <li key={idx} className="glossary-sources__item">
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="glossary-sources__link"
                          >
                            <span>{src.title}</span>
                            <ExternalLink size={12} aria-hidden="true" />
                          </a>
                          {src.supports && (
                            <span className="glossary-sources__supports">
                              {src.supports}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
            </article>
          )}
        </div>
      )}
    </div>
  );
}

export default GlossaryAndGraphView;
