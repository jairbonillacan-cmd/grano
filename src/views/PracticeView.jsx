import React, { useState, useMemo } from 'react';
import { Database, ChevronDown, ChevronRight, Terminal, CheckCircle2, Code2 } from 'lucide-react';
import { LESSONS_V2 } from '../data/lessons/index.js';
import { MERCADO_BRISA_TABLES } from '../lab/duckdb.js';
import { SqlLab } from '../lab/SqlLab.jsx';
import { AuthenticCodeLab } from '../components/AuthenticCodeLab.jsx';
import { PipelineOrderChallenge } from '../components/PipelineOrderChallenge.jsx';
import { useProgress } from '../state/store.js';
import '../styles/views/lab.css';

const FREE_SQL_PRESETS = [
  {
    id: 'store-kpi',
    label: 'Ingresos por tienda y región',
    sql: `SELECT
  s.region,
  s.store_name,
  COUNT(o.order_id) AS completed_orders,
  ROUND(SUM(o.total_usd), 2) AS revenue_usd,
  ROUND(AVG(o.total_usd), 2) AS avg_ticket_usd
FROM stores s
JOIN orders o ON o.store_id = s.store_id
WHERE o.status = 'completed'
GROUP BY s.region, s.store_name
ORDER BY revenue_usd DESC;`,
  },
  {
    id: 'fanout-audit',
    label: 'Auditoría de fan-out (orders vs order_items)',
    sql: `WITH items_agg AS (
  SELECT order_id, SUM(qty) AS total_units, ROUND(SUM(line_total_usd), 2) AS items_subtotal_usd
  FROM order_items
  GROUP BY order_id
),
refunds_agg AS (
  SELECT order_id, ROUND(SUM(refund_amount_usd), 2) AS refunded_usd
  FROM refunds
  GROUP BY order_id
)
SELECT
  o.order_id,
  o.customer_id,
  i.total_units,
  o.total_usd,
  COALESCE(r.refunded_usd, 0.0) AS refunded_usd
FROM orders o
JOIN items_agg i ON i.order_id = o.order_id
LEFT JOIN refunds_agg r ON r.order_id = o.order_id
WHERE o.status = 'completed'
ORDER BY o.order_id
LIMIT 15;`,
  },
  {
    id: 'dedup-payments',
    label: 'Deduplicar webhooks en payments',
    sql: `SELECT
  payment_method,
  COUNT(*) AS raw_captured_rows,
  COUNT(DISTINCT idempotency_key) AS unique_captured_payments,
  COUNT(*) - COUNT(DISTINCT idempotency_key) AS duplicate_webhook_rows
FROM payments
WHERE status = 'captured'
GROUP BY payment_method
ORDER BY duplicate_webhook_rows DESC;`,
  },
  {
    id: 'anomalies-check',
    label: 'Detectar SKU negativo y sesgo SRM',
    sql: `SELECT
  p.product_id,
  p.sku,
  p.product_name,
  p.list_price_usd,
  COUNT(oi.order_item_id) AS line_occurrences
FROM products p
LEFT JOIN order_items oi ON oi.product_id = p.product_id
WHERE p.list_price_usd < 0
GROUP BY ALL;`,
  },
];

export function PracticeView({ initialLessonId = null, onSelectLesson = null }) {
  const progress = useProgress();
  const solvedMap = progress?.practiceSolved || {};

  const [workspaceMode, setWorkspaceMode] = useState('catalog'); // 'catalog' | 'free'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'sql' | 'fill-blanks'
  const [selectedLessonId, setSelectedLessonId] = useState(
    () => initialLessonId || LESSONS_V2[0]?.id || 'c1-sql-joins-02-grano-fanout'
  );
  const [expandedTable, setExpandedTable] = useState('orders');
  const [injectedSql, setInjectedSql] = useState(null);

  const filteredLessons = useMemo(() => {
    if (typeFilter === 'all') return LESSONS_V2;
    return LESSONS_V2.filter((l) => l.practice?.type === typeFilter);
  }, [typeFilter]);

  const activeLesson = useMemo(() => {
    return (
      LESSONS_V2.find((l) => l.id === selectedLessonId) ||
      filteredLessons[0] ||
      LESSONS_V2[0]
    );
  }, [selectedLessonId, filteredLessons]);

  const sqlLessonsCount = useMemo(
    () => LESSONS_V2.filter((l) => l.practice?.type === 'sql').length,
    []
  );

  const handleSampleTable = (tableName) => {
    const sampleQuery = `SELECT * FROM ${tableName} LIMIT 10;`;
    setWorkspaceMode('free');
    setInjectedSql(sampleQuery);
  };

  return (
    <div className="practice-view" data-testid="practice-view">
      <header className="practice-view-header">
        <div>
          <span className="sql-lab-kicker">Laboratorio práctico · DuckDB-Wasm</span>
          <h1 className="practice-view-title">Práctica interactiva y motor SQL</h1>
          <p className="practice-view-subtitle">
            Ejecuta consultas analíticas reales sobre las 13 tablas del dataset Mercado Brisa (
            {sqlLessonsCount} prácticas SQL verificables en vivo y ejercicios de arquitectura).
          </p>
        </div>

        <div className="practice-mode-tabs" role="tablist" aria-label="Modo de laboratorio">
          <button
            type="button"
            role="tab"
            aria-selected={workspaceMode === 'catalog'}
            className={`practice-mode-tab ${workspaceMode === 'catalog' ? 'is-active' : ''}`}
            onClick={() => setWorkspaceMode('catalog')}
            data-testid="tab-practice-catalog"
          >
            Catálogo de ejercicios ({LESSONS_V2.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={workspaceMode === 'free'}
            className={`practice-mode-tab ${workspaceMode === 'free' ? 'is-active' : ''}`}
            onClick={() => setWorkspaceMode('free')}
            data-testid="tab-practice-free-sql"
          >
            SQL libre · Mercado Brisa
          </button>
        </div>
      </header>

      <div className="practice-workspace-grid">
        <aside className="practice-sidebar">
          {workspaceMode === 'catalog' ? (
            <section className="practice-panel-card" aria-label="Ejercicios por lección">
              <h2 className="practice-panel-heading">Ejercicios del currículo</h2>

              <div className="practice-filter-row">
                <button
                  type="button"
                  className={`practice-filter-chip ${typeFilter === 'all' ? 'is-active' : ''}`}
                  onClick={() => setTypeFilter('all')}
                >
                  Todos ({LESSONS_V2.length})
                </button>
                <button
                  type="button"
                  className={`practice-filter-chip ${typeFilter === 'sql' ? 'is-active' : ''}`}
                  onClick={() => setTypeFilter('sql')}
                  data-testid="filter-sql-only"
                >
                  SQL ejecutable ({sqlLessonsCount})
                </button>
                <button
                  type="button"
                  className={`practice-filter-chip ${typeFilter === 'fill-blanks' ? 'is-active' : ''}`}
                  onClick={() => setTypeFilter('fill-blanks')}
                >
                  Código guiado ({LESSONS_V2.length - sqlLessonsCount})
                </button>
              </div>

              <div className="practice-exercise-list" data-testid="practice-exercise-list">
                {filteredLessons.map((lesson, idx) => {
                  const isSelected = activeLesson?.id === lesson.id;
                  const isSolved = Boolean(solvedMap[lesson.id]?.passed);
                  const isSql = lesson.practice?.type === 'sql';
                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      className={`practice-exercise-item ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => {
                        setSelectedLessonId(lesson.id);
                        if (onSelectLesson) onSelectLesson(lesson.id);
                      }}
                      data-testid={`exercise-item-${lesson.id}`}
                    >
                      <div className="practice-exercise-item-meta">
                        <span>
                          L{idx + 1} · {isSql ? 'SQL DuckDB' : 'Código'}
                        </span>
                        {isSolved && (
                          <span style={{ color: 'var(--ok)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckCircle2 size={12} />
                            Resuelto
                          </span>
                        )}
                      </div>
                      <span className="practice-exercise-item-title">{lesson.title}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : (
            <section className="practice-panel-card" aria-label="Consultas de ejemplo">
              <h2 className="practice-panel-heading">Consultas iniciales</h2>
              <div className="practice-exercise-list">
                {FREE_SQL_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className="practice-exercise-item"
                    onClick={() => setInjectedSql(preset.sql)}
                    data-testid={`preset-${preset.id}`}
                  >
                    <div className="practice-exercise-item-meta">
                      <span>Plantilla SQL</span>
                      <Terminal size={12} />
                    </div>
                    <span className="practice-exercise-item-title">{preset.label}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="practice-panel-card" aria-label="Esquema Mercado Brisa">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 className="practice-panel-heading">
                <Database size={13} style={{ verticalAlign: 'text-bottom', marginRight: '0.375rem' }} />
                Esquema Mercado Brisa (13 tablas)
              </h2>
            </div>

            <div className="schema-table-list" data-testid="schema-explorer">
              {MERCADO_BRISA_TABLES.map((tbl) => {
                const isOpen = expandedTable === tbl.name;
                return (
                  <div key={tbl.name} className="schema-table-item">
                    <button
                      type="button"
                      className="schema-table-trigger"
                      onClick={() => setExpandedTable(isOpen ? null : tbl.name)}
                      data-testid={`schema-table-${tbl.name}`}
                    >
                      <span>
                        {isOpen ? (
                          <ChevronDown size={13} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                        ) : (
                          <ChevronRight size={13} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                        )}
                        {tbl.name}
                      </span>
                      <span className="schema-table-rows-badge">
                        {tbl.rowCount.toLocaleString('es-ES')} filas
                      </span>
                    </button>

                    {isOpen && (
                      <div className="schema-table-details">
                        <p className="schema-table-grain">{tbl.grain}</p>
                        <ul className="schema-columns-list">
                          {tbl.columns.map((col) => (
                            <li key={col.name} className="schema-column-row">
                              <span>{col.name}</span>
                              <span className="schema-column-type">{col.type}</span>
                            </li>
                          ))}
                        </ul>
                        <button
                          type="button"
                          className="sql-btn sql-btn-secondary"
                          onClick={() => handleSampleTable(tbl.name)}
                          data-testid={`sample-table-${tbl.name}`}
                        >
                          <Code2 size={13} />
                          <span>Muestrear tabla</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </aside>

        <main>
          {workspaceMode === 'free' ? (
            <SqlLab
              key="free-sql-lab"
              lessonId={activeLesson?.id || null}
              title="Consulta libre sobre Mercado Brisa"
              prompt="Escribe cualquier consulta DuckDB sobre las 13 tablas registradas en memoria (orders, order_items, customers, customer_changes, products, payments, refunds, events, marketing_spend, experiments, experiment_assignments, stores, calendar)."
              starterCode={FREE_SQL_PRESETS[0].sql}
              mode="free"
              externalCode={injectedSql}
              onExternalCodeConsumed={() => setInjectedSql(null)}
            />
          ) : activeLesson?.practice?.type === 'order-steps' ? (
            <PipelineOrderChallenge
              key={activeLesson.id}
              lessonId={activeLesson.id}
              challenge={activeLesson.practice}
            />
          ) : (
            <AuthenticCodeLab
              key={activeLesson?.id}
              lessonId={activeLesson?.id}
              practice={activeLesson?.practice}
              challenge={activeLesson?.practice}
              embeddedInPracticeView={true}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default PracticeView;
