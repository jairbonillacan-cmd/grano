import React, { useState } from 'react';
import {
  Database,
  Layers,
  Cpu,
  Workflow,
  BarChart3,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { Button } from './ui/index.js';
import {
  AsOfJoinTimelineSim,
  StarVsObtSim,
  ArrowZeroCopySim,
} from './visualizers/SimulatorsPackA.jsx';
import { CohortRetentionSim } from './visualizers/SimulatorsPackB.jsx';

const STAGE_ICONS = {
  1: Database,
  2: Layers,
  3: Cpu,
  4: Workflow,
  5: BarChart3,
  6: Sparkles,
};

function SimulatorFrame({
  stage = 1,
  kicker,
  title,
  subtitle,
  onReset,
  controls,
  whatToWatch,
  children,
}) {
  const StageIcon = STAGE_ICONS[stage] || Database;

  return (
    <div className="sim-frame viz-card" data-stage={stage}>
      <div className="sim-frame__header">
        <div className="sim-frame__title-group">
          <span className="sim-frame__stage-icon" aria-hidden="true">
            <StageIcon size={18} />
          </span>
          <div className="sim-frame__headings">
            {kicker && <div className="sim-frame__kicker">{kicker}</div>}
            <h3 className="sim-frame__title">{title}</h3>
            {subtitle && <p className="sim-frame__desc">{subtitle}</p>}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={RotateCcw}
          className="sim-reset-btn"
          onClick={onReset}
          ariaLabel="Reiniciar simulador"
        >
          Reiniciar
        </Button>
      </div>

      {controls && <div className="sim-frame__controls">{controls}</div>}

      <div className="sim-frame__body">{children}</div>

      {whatToWatch && (
        <div className="sim-frame__footer">
          <span className="sim-frame__footer-label">Qué observar:</span>
          <span className="sim-frame__footer-text">{whatToWatch}</span>
        </div>
      )}
    </div>
  );
}

export default function LessonVisualizer({ visualType }) {
  switch (visualType) {
    case 'join-fanout-visualizer':
      return <JoinFanoutVisualizer />;
    case 'window-function-stepper':
      return <WindowFunctionStepper />;
    case 'asof-join-timeline':
      return <AsOfJoinTimelineSim />;
    case 'star-vs-obt-sim':
      return <StarVsObtSim />;
    case 'scd2-timeline-builder':
      return <Scd2TimelineBuilder />;
    case 'simpsons-paradox-explorer':
      return <SimpsonsParadoxExplorer />;
    case 'row-vs-columnar-storage':
      return <RowVsColumnarStorage />;
    case 'arrow-zero-copy-sim':
      return <ArrowZeroCopySim />;
    case 'iceberg-v3-snapshot-explorer':
      return <IcebergSnapshotExplorer />;
    case 'dbt-sqlmesh-dag-explorer':
      return <DbtSqlmeshDagExplorer />;
    case 'cohort-retention-sim':
      return <CohortRetentionSim />;
    case 'ab-test-cuped-simulator':
      return <AbTestCupedSimulator />;
    case 'bi-anti-slop-comparator':
      return <BiAntiSlopComparator />;
    case 'streaming-watermark-lab':
      return <StreamingWatermarkLab />;
    case 'mcp-semantic-vs-raw-sql':
      return <McpSemanticVsRawSql />;
    default:
      return null;
  }
}

function JoinFanoutVisualizer() {
  const [mode, setMode] = useState('fanout'); // 'fanout' | 'cte'

  return (
    <SimulatorFrame
      stage={1}
      kicker="Etapa 1 · Grano y Cardinalidad SQL"
      title="Simulador: por qué un JOIN 1:N duplica el importe"
      subtitle={
        <>
          Observa qué pasa con el pedido <code>ORD-1</code> ($250.00) cuando tiene 3 productos en{' '}
          <code>order_items</code>.
        </>
      }
      onReset={() => setMode('fanout')}
      controls={
        <div className="sim-segmented" role="group" aria-label="Modo de cruce SQL">
          <button
            type="button"
            className={`sim-segmented__btn ${
              mode === 'fanout' ? 'sim-segmented__btn--active-danger' : ''
            }`}
            onClick={() => setMode('fanout')}
          >
            JOIN directo (con fan-out)
          </button>
          <button
            type="button"
            className={`sim-segmented__btn ${
              mode === 'cte' ? 'sim-segmented__btn--active' : ''
            }`}
            onClick={() => setMode('cte')}
          >
            Preagregar en CTE (correcto)
          </button>
        </div>
      }
      whatToWatch="Al cruzar en relación 1:N sin pre-agregar, el importe de la tabla cabecera se multiplica por el número de ítems."
    >
      <div className="sim-two-col">
        <div className="sim-panel">
          <div className="sim-panel__title">
            Tabla 1: orders (Grain = 1 fila por pedido · Total real = $350)
          </div>
          <div className="sim-table-scroll">
            <table className="sim-table tabular">
              <thead>
                <tr>
                  <th>order_id</th>
                  <th>customer</th>
                  <th className="num">order_total_usd</th>
                </tr>
              </thead>
              <tbody>
                <tr className="row-valid">
                  <td>ORD-1</td>
                  <td>Ana</td>
                  <td className="num">$250.00</td>
                </tr>
                <tr>
                  <td>ORD-2</td>
                  <td>Luis</td>
                  <td className="num">$100.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="sim-panel">
          <div className="sim-panel__title">
            {mode === 'fanout'
              ? 'Tabla 2: order_items (Grain = 1 fila por ítem → 3 filas para ORD-1)'
              : 'CTE Pre-agregada: items_por_pedido (Grain igualado a 1 fila por order_id)'}
          </div>
          <div className="sim-table-scroll">
            {mode === 'fanout' ? (
              <table key="table-fanout" className="sim-table tabular">
                <thead>
                  <tr>
                    <th>order_id</th>
                    <th>item_name</th>
                    <th className="num">qty</th>
                    <th className="num">order_total_usd (cruzado)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="row-duplicated row-flash">
                    <td>ORD-1</td>
                    <td>Teclado</td>
                    <td className="num">1</td>
                    <td className="num">$250.00</td>
                  </tr>
                  <tr className="row-duplicated row-flash">
                    <td>ORD-1</td>
                    <td>Mouse</td>
                    <td className="num">2</td>
                    <td className="num">$250.00 (duplicado)</td>
                  </tr>
                  <tr className="row-duplicated row-flash">
                    <td>ORD-1</td>
                    <td>Cable USB</td>
                    <td className="num">2</td>
                    <td className="num">$250.00 (triplicado)</td>
                  </tr>
                  <tr>
                    <td>ORD-2</td>
                    <td>Monitor</td>
                    <td className="num">1</td>
                    <td className="num">$100.00</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <table key="table-cte" className="sim-table tabular">
                <thead>
                  <tr>
                    <th>order_id</th>
                    <th className="num">unidades_pedido (SUM)</th>
                    <th className="num">order_total_usd (1:1)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="row-optimal row-flash">
                    <td>ORD-1</td>
                    <td className="num">5</td>
                    <td className="num">$250.00</td>
                  </tr>
                  <tr className="row-optimal row-flash">
                    <td>ORD-2</td>
                    <td className="num">1</td>
                    <td className="num">$100.00</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="sim-comparison-card">
        <div className="sim-comparison-card__title">
          Comparación de Ingreso Total Reportado (SUM)
        </div>
        <div className="sim-comparison-bars">
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">Total real en tabla orders (Referencia)</span>
              <span className="sim-bar-value">$350.00 (100% exacto)</span>
            </div>
            <div className="sim-bar-track">
              <div
                className="sim-bar-fill sim-bar-fill--stage"
                style={{ '--bar-pct': '41%' }}
              />
            </div>
          </div>
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">
                {mode === 'fanout'
                  ? 'JOIN directo 1:N (Inflado por fan-out)'
                  : 'JOIN 1:1 tras pre-agregar en CTE'}
              </span>
              <span className="sim-bar-value">
                {mode === 'fanout' ? '$850.00 (+142.8% error)' : '$350.00 (0% desviación)'}
              </span>
            </div>
            <div className="sim-bar-track">
              <div
                className={`sim-bar-fill ${
                  mode === 'fanout' ? 'sim-bar-fill--danger' : 'sim-bar-fill--success'
                }`}
                style={{ '--bar-pct': mode === 'fanout' ? '100%' : '41%' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={`viz-result-banner ${mode === 'fanout' ? 'danger' : 'success'} tabular`}>
        {mode === 'fanout' ? (
          <>
            <div className="viz-banner-title">
              Resultado del JOIN Directo: ORD-1 ($250) se repite 3 veces.
            </div>
            <p>
              <code>SUM(order_total_usd)</code> suma{' '}
              <strong>$250 + $250 + $250 + $100 = $850.00</strong> en lugar de los{' '}
              <strong>$350.00 reales</strong> (+142% de inflación artificial en el dashboard de BI).
            </p>
          </>
        ) : (
          <>
            <div className="viz-banner-title">
              Resultado con CTE preagregada: relación 1:1
            </div>
            <p>
              Al agrupar primero <code>order_items</code> por <code>order_id</code>, ambas tablas
              tienen exactamente 1 fila por pedido: <code>SUM(order_total_usd)</code> ={' '}
              <strong>$350.00 exactos</strong> y <code>SUM(unidades)</code> ={' '}
              <strong>6 unidades</strong>.
            </p>
          </>
        )}
      </div>
    </SimulatorFrame>
  );
}

function WindowFunctionStepper() {
  const [activeRow, setActiveRow] = useState(1);
  const rows = [
    { idx: 0, user: 'U-101', date: '2026-08-01', mrr: 49, lag: 0, diff: '+49 (Alta)', rn: 1, running: 49 },
    { idx: 1, user: 'U-101', date: '2026-09-01', mrr: 49, lag: 49, diff: '0 (Renovación)', rn: 2, running: 98 },
    { idx: 2, user: 'U-101', date: '2026-10-01', mrr: 99, lag: 49, diff: '+50 (Upgrade)', rn: 3, running: 197 },
    { idx: 3, user: 'U-204', date: '2026-09-15', mrr: 79, lag: 0, diff: '+79 (Nueva Partición)', rn: 1, running: 79 },
    { idx: 4, user: 'U-204', date: '2026-10-15', mrr: 29, lag: 79, diff: '-50 (Downgrade)', rn: 2, running: 108 },
  ];

  const current = rows[activeRow];
  const mrrPct = Math.round((current.mrr / 99) * 100);
  const lagPct = Math.round((current.lag / 99) * 100);

  return (
    <SimulatorFrame
      stage={1}
      kicker="Etapa 1 · Funciones de Ventana"
      title="Inspección paso a paso: ejecución de una window function"
      subtitle={
        <>
          Haz clic en cualquier fila para ver su partición (<code>PARTITION BY user_id</code>) y de
          dónde sale <code>LAG(mrr, 1)</code>.
        </>
      }
      onReset={() => setActiveRow(1)}
      controls={
        <div className="sim-segmented" role="group" aria-label="Seleccionar fila">
          {rows.map((r) => (
            <button
              key={r.idx}
              type="button"
              className={`sim-segmented__btn ${
                activeRow === r.idx ? 'sim-segmented__btn--active' : ''
              }`}
              onClick={() => setActiveRow(r.idx)}
            >
              Fila {r.idx + 1} ({r.user})
            </button>
          ))}
        </div>
      }
      whatToWatch="PARTITION BY reinicia ROW_NUMBER() y LAG() al cambiar de user_id sin colapsar las filas originales."
    >
      <div className="sim-table-scroll">
        <table className="sim-table tabular">
          <thead>
            <tr>
              <th>Fila</th>
              <th>user_id (Partición)</th>
              <th>event_date (Orden)</th>
              <th className="num">mrr_usd</th>
              <th className="num">ROW_NUMBER()</th>
              <th className="num">LAG(mrr, 1, 0)</th>
              <th>Clasificación BI/DA</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isSamePartition = r.user === current.user;
              const isSelected = r.idx === activeRow;
              const isPreviousInPartition = isSamePartition && r.rn === current.rn - 1;
              const rowClass = [
                'row-clickable',
                isSelected ? 'row-selected row-flash' : '',
                isPreviousInPartition ? 'row-valid' : '',
                !isSamePartition ? 'row-muted-highlight' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <tr
                  key={`${r.idx}-${isSelected ? 'sel' : 'idle'}`}
                  className={rowClass}
                  onClick={() => setActiveRow(r.idx)}
                >
                  <td>#{r.idx + 1}</td>
                  <td>{r.user}</td>
                  <td>{r.date}</td>
                  <td className="num">${r.mrr}</td>
                  <td className="num">{r.rn}</td>
                  <td className="num">${r.lag}</td>
                  <td>{r.diff}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="sim-comparison-card">
        <div className="sim-comparison-card__title">
          Comparación en Fila #{activeRow + 1} ({current.user}) · MRR Previo vs. Actual
        </div>
        <div className="sim-comparison-bars">
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">LAG(mrr, 1, 0) — Mes anterior en partición</span>
              <span className="sim-bar-value">${current.lag} USD</span>
            </div>
            <div className="sim-bar-track">
              <div
                className="sim-bar-fill sim-bar-fill--neutral"
                style={{ '--bar-pct': `${lagPct}%` }}
              />
            </div>
          </div>
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">mrr_usd — Valor de la fila activa</span>
              <span className="sim-bar-value">
                ${current.mrr} USD ({current.diff})
              </span>
            </div>
            <div className="sim-bar-track">
              <div
                className={`sim-bar-fill ${
                  current.mrr < current.lag ? 'sim-bar-fill--danger' : 'sim-bar-fill--success'
                }`}
                style={{ '--bar-pct': `${mrrPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="viz-result-banner success tabular">
        <div className="viz-banner-title">
          Explicación de la Fila #{activeRow + 1} ({current.user} en {current.date}):
        </div>
        <p>
          Dentro de la cubeta <code>PARTITION BY user_id = &apos;{current.user}&apos;</code>, esta
          es la fila <code>ROW_NUMBER = {current.rn}</code>.{' '}
          {current.rn === 1
            ? 'Al ser el primer evento de este cliente, no existe fila anterior en su partición, por lo que LAG devuelve el valor por defecto $0.'
            : `La función LAG(mrr, 1) toma el valor de la fila inmediata anterior del mismo cliente ($${current.lag}) sin mezclar datos de otros usuarios.`}
        </p>
      </div>
    </SimulatorFrame>
  );
}

function Scd2TimelineBuilder() {
  const [scdType, setScdType] = useState('scd2'); // 'scd1' | 'scd2'

  return (
    <SimulatorFrame
      stage={2}
      kicker="Etapa 2 · Dimensiones Lentamente Cambiantes"
      title="Simulador histórico: SCD tipo 1 frente a SCD tipo 2"
      subtitle={
        <>
          El cliente <code>U-101</code> era <strong>Pyme</strong> en Enero (compró $1,000) y pasó a{' '}
          <strong>Enterprise</strong> en Julio (compró $1,500).
        </>
      }
      onReset={() => setScdType('scd2')}
      controls={
        <div className="sim-segmented" role="group" aria-label="Tipo de SCD">
          <button
            type="button"
            className={`sim-segmented__btn ${
              scdType === 'scd1' ? 'sim-segmented__btn--active-danger' : ''
            }`}
            onClick={() => setScdType('scd1')}
          >
            SCD Tipo 1 (Sobrescribe)
          </button>
          <button
            type="button"
            className={`sim-segmented__btn ${
              scdType === 'scd2' ? 'sim-segmented__btn--active' : ''
            }`}
            onClick={() => setScdType('scd2')}
          >
            SCD Tipo 2 (Preserva Historia)
          </button>
        </div>
      }
      whatToWatch="SCD Tipo 1 reescribe el pasado y asigna las ventas de enero al nuevo segmento; SCD Tipo 2 conserva ambas versiones con intervalos de validez."
    >
      {scdType === 'scd1' ? (
        <div className="sim-table-scroll">
          <table key="scd1-table" className="sim-table tabular">
            <thead>
              <tr>
                <th>customer_id</th>
                <th>segment (Sobrescrito en Julio)</th>
                <th>updated_at</th>
                <th className="num">ventas_atribuidas</th>
              </tr>
            </thead>
            <tbody>
              <tr className="row-duplicated row-flash">
                <td>U-101</td>
                <td>Enterprise (Se perdió que antes era Pyme)</td>
                <td>2026-07-01</td>
                <td className="num">$2,500</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="sim-table-scroll">
          <table key="scd2-table" className="sim-table tabular">
            <thead>
              <tr>
                <th>customer_sk</th>
                <th>customer_id</th>
                <th>segment</th>
                <th>valid_from</th>
                <th>valid_to</th>
                <th>is_current</th>
                <th className="num">ventas_periodo</th>
              </tr>
            </thead>
            <tbody>
              <tr className="row-flash">
                <td>SK_901</td>
                <td>U-101</td>
                <td>Pyme</td>
                <td>2026-01-01</td>
                <td>2026-07-01</td>
                <td>false</td>
                <td className="num">$1,000</td>
              </tr>
              <tr className="row-optimal row-flash">
                <td>SK_988</td>
                <td>U-101</td>
                <td>Enterprise</td>
                <td>2026-07-01</td>
                <td>9999-12-31</td>
                <td>true</td>
                <td className="num">$1,500</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="sim-comparison-card">
        <div className="sim-comparison-card__title">
          Atribución de Ventas por Segmento ($2,500 USD totales)
        </div>
        <div className="sim-comparison-bars">
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">Segmento Pyme (Compra de Enero: $1,000 reales)</span>
              <span className="sim-bar-value">
                {scdType === 'scd1' ? '$0 USD (Borrado)' : '$1,000 USD (40%)'}
              </span>
            </div>
            <div className="sim-bar-track">
              <div
                className={`sim-bar-fill ${
                  scdType === 'scd1' ? 'sim-bar-fill--danger' : 'sim-bar-fill--stage'
                }`}
                style={{ '--bar-pct': scdType === 'scd1' ? '4%' : '40%' }}
              />
            </div>
          </div>
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">
                Segmento Enterprise (Compra de Julio: $1,500 reales)
              </span>
              <span className="sim-bar-value">
                {scdType === 'scd1' ? '$2,500 USD (100% sobre-atribuido)' : '$1,500 USD (60%)'}
              </span>
            </div>
            <div className="sim-bar-track">
              <div
                className={`sim-bar-fill ${
                  scdType === 'scd1' ? 'sim-bar-fill--danger' : 'sim-bar-fill--success'
                }`}
                style={{ '--bar-pct': scdType === 'scd1' ? '100%' : '60%' }}
              />
            </div>
          </div>
        </div>
      </div>

      {scdType === 'scd1' ? (
        <div className="viz-result-banner danger tabular">
          <div className="viz-banner-title">Consecuencia en BI y Análisis con SCD Tipo 1:</div>
          <p>
            Si hoy generas el reporte de ventas de Enero, dirá que <strong>Pyme vendió $0</strong> y{' '}
            <strong>Enterprise vendió $2,500</strong>. El pasado ha cambiado retroactivamente.
          </p>
        </div>
      ) : (
        <div className="viz-result-banner success tabular">
          <div className="viz-banner-title">Consecuencia en BI y Análisis con SCD Tipo 2:</div>
          <p>
            La compra de Enero ($1,000) cae entre <code>2026-01-01</code> y <code>2026-07-01</code>{' '}
            (<strong>Pyme</strong>), y la de Julio ($1,500) cae en <strong>Enterprise</strong>.
            Trazabilidad histórica 100% intacta.
          </p>
        </div>
      )}
    </SimulatorFrame>
  );
}

function SimpsonsParadoxExplorer() {
  const [mobileShareOct, setMobileShareOct] = useState(70);
  const globalSept = 0.7 * 8.0 + 0.3 * 3.0; // 6.50%
  const webShareOct = 100 - mobileShareOct;
  const globalOct = (webShareOct / 100) * 8.5 + (mobileShareOct / 100) * 3.5;
  const constantMixOct = 0.7 * 8.5 + 0.3 * 3.5; // 7.00%
  const isParadoxActive = globalOct < globalSept;

  const septBarPct = Math.round((globalSept / 10) * 100);
  const octBarPct = Math.round((globalOct / 10) * 100);
  const constBarPct = Math.round((constantMixOct / 10) * 100);

  return (
    <SimulatorFrame
      stage={2}
      kicker="Etapa 2 · Efectos de Mix y Agregación"
      title="Simulador: paradoja de Simpson y composición de segmentos"
      subtitle={
        <>
          En Octubre, <strong>Web mejoró (+0.5%)</strong> y{' '}
          <strong>App Móvil también mejoró (+0.5%)</strong>. Ajusta el peso del tráfico móvil en
          Octubre y observa qué le pasa al promedio global.
        </>
      }
      onReset={() => setMobileShareOct(70)}
      controls={
        <>
          <label className="sim-slider-box tabular">
            <span>
              Peso Tráfico Móvil en Octubre: <strong>{mobileShareOct}%</strong> (en Sept era 30%)
            </span>
            <input
              type="range"
              min="20"
              max="85"
              value={mobileShareOct}
              onChange={(e) => setMobileShareOct(Number(e.target.value))}
            />
          </label>
          <div className="sim-segmented" role="group" aria-label="Escenarios de tráfico">
            <button
              type="button"
              className={`sim-segmented__btn ${
                mobileShareOct === 30 ? 'sim-segmented__btn--active' : ''
              }`}
              onClick={() => setMobileShareOct(30)}
            >
              Mix Estable (30%)
            </button>
            <button
              type="button"
              className={`sim-segmented__btn ${
                mobileShareOct === 70 ? 'sim-segmented__btn--active-danger' : ''
              }`}
              onClick={() => setMobileShareOct(70)}
            >
              Paradoja Activa (70%)
            </button>
          </div>
        </>
      }
      whatToWatch="Cuando el peso del segmento con menor conversión base supera el 52%, el promedio global cae aunque cada canal individual haya mejorado."
    >
      <div className="sim-four-col tabular">
        <div className="sim-metric-box">
          <div className="sim-metric-title">Canal Web (Mejoró)</div>
          <div className="sim-metric-nums">
            Sept: 8.00% → Oct: <strong>8.50% (+0.50%)</strong>
          </div>
        </div>
        <div className="sim-metric-box">
          <div className="sim-metric-title">Canal App Móvil (Mejoró)</div>
          <div className="sim-metric-nums">
            Sept: 3.00% → Oct: <strong>3.50% (+0.50%)</strong>
          </div>
        </div>
        <div className={`sim-metric-box ${isParadoxActive ? 'box-danger' : 'box-ok'}`}>
          <div className="sim-metric-title">Conversión Global Observada</div>
          <div className="sim-metric-nums">
            Sept: {globalSept.toFixed(2)}% → Oct:{' '}
            <strong>
              {globalOct.toFixed(2)}% (
              {(globalOct - globalSept >= 0 ? '+' : '') + (globalOct - globalSept).toFixed(2)}%)
            </strong>
          </div>
        </div>
        <div className="sim-metric-box box-ok">
          <div className="sim-metric-title">Conversión a Mix Constante</div>
          <div className="sim-metric-nums">
            Sept: 6.50% → Oct: <strong>{constantMixOct.toFixed(2)}% (+0.50% Real)</strong>
          </div>
        </div>
      </div>

      <div className="sim-comparison-card">
        <div className="sim-comparison-card__title">
          Comparación de Tasas de Conversión (Escala 0% – 10%)
        </div>
        <div className="sim-comparison-bars">
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">Septiembre Base (70% Web / 30% Móvil)</span>
              <span className="sim-bar-value">{globalSept.toFixed(2)}%</span>
            </div>
            <div className="sim-bar-track">
              <div
                className="sim-bar-fill sim-bar-fill--neutral"
                style={{ '--bar-pct': `${septBarPct}%` }}
              />
            </div>
          </div>
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">
                Octubre Observado ({webShareOct}% Web / {mobileShareOct}% Móvil)
              </span>
              <span className="sim-bar-value">{globalOct.toFixed(2)}%</span>
            </div>
            <div className="sim-bar-track">
              <div
                className={`sim-bar-fill ${
                  isParadoxActive ? 'sim-bar-fill--danger' : 'sim-bar-fill--success'
                }`}
                style={{ '--bar-pct': `${octBarPct}%` }}
              />
            </div>
          </div>
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">Octubre Normalizado a Mix Constante</span>
              <span className="sim-bar-value">{constantMixOct.toFixed(2)}% (+0.50%)</span>
            </div>
            <div className="sim-bar-track">
              <div
                className="sim-bar-fill sim-bar-fill--stage"
                style={{ '--bar-pct': `${constBarPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={`viz-result-banner ${isParadoxActive ? 'danger' : 'success'} tabular`}>
        {isParadoxActive ? (
          <>
            <div className="viz-banner-title">Paradoja de Simpson Activa.</div>
            <p>
              Aunque ambos equipos mejoraron su conversión en +0.50%, como el tráfico móvil pasó del
              30% al {mobileShareOct}%, la tasa global cayó de{' '}
              <strong>6.50% a {globalOct.toFixed(2)}%</strong>. Un buen analista o dashboard de BI
              reporta la métrica normalizada a mix constante (<strong>7.00%</strong>).
            </p>
          </>
        ) : (
          <>
            <div className="viz-banner-title">Sin inversión de signo (Mix estable)</div>
            <p>
              Con un {mobileShareOct}% de tráfico móvil, la mejora individual de los canales sigue
              reflejándose positivamente en la tasa global ({globalOct.toFixed(2)}%). Sube el
              tráfico móvil por encima del 52% para ver aparecer la paradoja.
            </p>
          </>
        )}
      </div>
    </SimulatorFrame>
  );
}

function RowVsColumnarStorage() {
  const [storageMode, setStorageMode] = useState('columnar'); // 'row' | 'columnar'

  return (
    <SimulatorFrame
      stage={3}
      kicker="Etapa 3 · Formatos Físicos y Podado I/O"
      title={
        <>
          Inspección de disco: consulta{' '}
          <code>SELECT region, SUM(monto) WHERE fecha = &apos;2026-10-28&apos;</code>
        </>
      }
      subtitle="Observa qué bloques físicos de disco se leen y cuáles se saltan sin tocar según el formato de almacenamiento."
      onReset={() => setStorageMode('columnar')}
      controls={
        <div className="sim-segmented" role="group" aria-label="Formato de almacenamiento">
          <button
            type="button"
            className={`sim-segmented__btn ${
              storageMode === 'row' ? 'sim-segmented__btn--active-danger' : ''
            }`}
            onClick={() => setStorageMode('row')}
          >
            Por filas (PostgreSQL / CSV)
          </button>
          <button
            type="button"
            className={`sim-segmented__btn ${
              storageMode === 'columnar' ? 'sim-segmented__btn--active' : ''
            }`}
            onClick={() => setStorageMode('columnar')}
          >
            Columnar (Parquet ordenado)
          </button>
        </div>
      }
      whatToWatch="Parquet combina projection pushdown (solo lee 2 de 60 columnas) con predicate pushdown por Zone Maps (salta Row Groups fuera de fecha)."
    >
      {storageMode === 'row' ? (
        <div className="sim-storage-blocks tabular">
          <p className="sim-storage-lead">
            En un almacén por filas, todas las columnas de cada registro están intercaladas en el
            disco. Para sumar <code>monto</code> tienes que leer también <code>id</code>,{' '}
            <code>email</code>, <code>dirección</code> y todas las fechas:
          </p>
          <div className="block-strip">
            {[
              'Fila 1 (Oct-01: 60 cols)',
              'Fila 2 (Oct-05: 60 cols)',
              'Fila 3 (Oct-18: 60 cols)',
              'Fila 4 (Oct-28: 60 cols)',
            ].map((b) => (
              <div key={b} className="disk-block scanned-bad">
                {b} — LEÍDO COMPLETO (100% I/O)
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="sim-storage-blocks tabular">
          <p className="sim-storage-lead">
            En Parquet ordenado por fecha, primero saltamos el Row Group antiguo gracias al Footer
            Min/Max (Zone Map), y en el Row Group del 28 de octubre leemos únicamente los Column
            Chunks de <code>region</code> y <code>monto</code>:
          </p>
          <div className="block-strip">
            <div className="disk-block pruned">
              Row Group 1 (Min: Oct-01, Max: Oct-15) — SALTADO POR ZONE MAP (0 Bytes leídos)
            </div>
            <div className="disk-block pruned">
              Row Group 2 · Columna email / dirección / notas — NO SOLICITADAS (0 Bytes leídos)
            </div>
            <div className="disk-block scanned-good">
              Row Group 2 (Oct-28) · Chunks [region] + [monto] — LEÍDO Y VECTORIZADO (Solo 3.2% del
              disco)
            </div>
          </div>
        </div>
      )}

      <div className="sim-comparison-card">
        <div className="sim-comparison-card__title">
          Volumen de Datos Leídos de Disco (Tabla de 4.0 GB · 60 Columnas)
        </div>
        <div className="sim-comparison-bars">
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">Almacén por filas (Full Table Scan)</span>
              <span className="sim-bar-value">4,096 MB (100% I/O)</span>
            </div>
            <div className="sim-bar-track">
              <div
                className="sim-bar-fill sim-bar-fill--danger"
                style={{ '--bar-pct': '100%' }}
              />
            </div>
          </div>
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">
                Parquet Columnar (Zone Maps + Projection Pushdown)
              </span>
              <span className="sim-bar-value">131 MB (3.2% I/O · 31x menos lectura)</span>
            </div>
            <div className="sim-bar-track">
              <div
                className="sim-bar-fill sim-bar-fill--success"
                style={{ '--bar-pct': '6%' }}
              />
            </div>
          </div>
        </div>
      </div>
    </SimulatorFrame>
  );
}

function IcebergSnapshotExplorer() {
  const [snapshot, setSnapshot] = useState(2);

  return (
    <SimulatorFrame
      stage={4}
      kicker="Etapa 4 · Tablas Abiertas Apache Iceberg v3"
      title="Explorador de snapshots y vectores de borrado en Apache Iceberg"
      subtitle="Cambia de Snapshot para ver cómo Iceberg actualiza filas instantáneamente sin reescribir archivos Parquet pesados."
      onReset={() => setSnapshot(2)}
      controls={
        <div className="sim-segmented" role="group" aria-label="Seleccionar Snapshot">
          <button
            type="button"
            className={`sim-segmented__btn ${
              snapshot === 1 ? 'sim-segmented__btn--active' : ''
            }`}
            onClick={() => setSnapshot(1)}
          >
            Snapshot #1 (Carga Inicial)
          </button>
          <button
            type="button"
            className={`sim-segmented__btn ${
              snapshot === 2 ? 'sim-segmented__btn--active' : ''
            }`}
            onClick={() => setSnapshot(2)}
          >
            Snapshot #2 (UPDATE con Deletion Vector v3)
          </button>
        </div>
      }
      whatToWatch="En Merge-on-Read con Deletion Vectors v3, Iceberg escribe un bitmap Puffin de pocos kilobytes en lugar de reescribir el archivo Parquet de 1 millón de filas."
    >
      <div className="sim-two-col tabular">
        <div className="sim-panel">
          <div className="sim-panel__title">Árbol de Metadatos Activo (Snapshot #{snapshot})</div>
          <ul className="sim-list">
            <li>
              <code>metadata.v{snapshot}.json</code> → apunta a <code>snap-{snapshot}.avro</code>
            </li>
            <li>
              Archivo base: <code>data-001.parquet</code> (1,000,000 filas inmutables)
            </li>
            {snapshot === 2 && (
              <>
                <li className="sim-text-success">
                  + Archivo Puffin: <code>dv-001.puffin</code> (Bitmap Roaring marcando la posición
                  #412 como borrada)
                </li>
                <li className="sim-text-primary">
                  + Archivo Delta: <code>data-002.parquet</code> (1 fila nueva con el valor
                  actualizado)
                </li>
              </>
            )}
          </ul>
        </div>

        <div className="sim-panel">
          <div className="sim-panel__title">
            Resultado visible para BI y DA en Snapshot #{snapshot}
          </div>
          <div className="sim-table-scroll">
            <table key={`snap-${snapshot}`} className="sim-table tabular">
              <thead>
                <tr>
                  <th>order_id</th>
                  <th>status</th>
                  <th className="num">amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>ORD-411</td>
                  <td>PAID</td>
                  <td className="num">$120</td>
                </tr>
                <tr className={snapshot === 2 ? 'row-optimal row-flash' : 'row-flash'}>
                  <td>ORD-412</td>
                  <td>{snapshot === 1 ? 'PAID' : 'REFUNDED (Actualizado)'}</td>
                  <td className="num">{snapshot === 1 ? '$350' : '$0'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="sim-comparison-card">
        <div className="sim-comparison-card__title">
          Amplificación de Escritura al Actualizar 1 Fila sobre 1M de Registros
        </div>
        <div className="sim-comparison-bars">
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">Reescritura Copy-on-Write tradicional</span>
              <span className="sim-bar-value">256 MB reescritos (1,000,000 filas)</span>
            </div>
            <div className="sim-bar-track">
              <div
                className="sim-bar-fill sim-bar-fill--danger"
                style={{ '--bar-pct': '100%' }}
              />
            </div>
          </div>
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">Iceberg v3 Deletion Vector (dv-001.puffin)</span>
              <span className="sim-bar-value">12 KB escritos (Bitmap Roaring + 1 fila)</span>
            </div>
            <div className="sim-bar-track">
              <div
                className="sim-bar-fill sim-bar-fill--success"
                style={{ '--bar-pct': '4%' }}
              />
            </div>
          </div>
        </div>
      </div>
    </SimulatorFrame>
  );
}

function DbtSqlmeshDagExplorer() {
  const [selectedLayer, setSelectedLayer] = useState('semantic');

  const layers = {
    contract: {
      id: 'contract',
      step: '1. Data Contract',
      title: '1. Data Contract (ODCS v3.0 en el Borde)',
      role: 'Ingeniería de Software + Ingeniería de Datos (DE)',
      sla: '0% nulos en PK · Validación en ingesta',
      coveragePct: 35,
      detail:
        'Valida que la fuente cumpla tipos de datos, 0% nulos en claves primarias y SLAs antes de entrar al Lakehouse.',
    },
    silver: {
      id: 'silver',
      step: '2. Silver (dbt / SQLMesh)',
      title: '2. Modelos Silver (dbt / SQLMesh Incremental)',
      role: 'Ingeniería de Datos (DE) + Análisis (DA)',
      sla: 'Grano 1:1 certificado · SCD2 por intervalos',
      coveragePct: 70,
      detail:
        'Limpia, deduplica con QUALIFY y construye dimensiones SCD Tipo 2 y tablas de hechos auditadas por intervalos.',
    },
    semantic: {
      id: 'semantic',
      step: '3. Capa Semántica',
      title: '3. Capa Semántica (MetricFlow / Cube)',
      role: 'Business Intelligence (BI) + DA + Agentes IA',
      sla: '100% consistencia de métricas en BI y MCP',
      coveragePct: 100,
      detail:
        'Define métricas certificadas (MRR, Churn, Conversión) una sola vez en YAML para que dashboards, notebooks y agentes MCP nunca se contradigan.',
    },
  };

  const active = layers[selectedLayer];

  return (
    <SimulatorFrame
      stage={4}
      kicker="Etapa 4 · Gobernanza y Transformación"
      title="Flujo de gobernanza: del contrato de datos a la capa semántica"
      subtitle="Haz clic en cada etapa de la tubería para inspeccionar qué invariantes garantiza."
      onReset={() => setSelectedLayer('semantic')}
      controls={
        <div className="sim-segmented" role="group" aria-label="Capas del DAG">
          {Object.values(layers).map((layer) => (
            <button
              key={layer.id}
              type="button"
              className={`sim-segmented__btn ${
                selectedLayer === layer.id ? 'sim-segmented__btn--active' : ''
              }`}
              onClick={() => setSelectedLayer(layer.id)}
            >
              {layer.step}
            </button>
          ))}
        </div>
      }
      whatToWatch="Cada capa resuelve una clase distinta de fallo: esquema en el borde, grano en Silver y definición única de negocio en la Capa Semántica."
    >
      <div className="sim-table-scroll">
        <table className="sim-table tabular">
          <thead>
            <tr>
              <th>Capa de la Tubería</th>
              <th>Responsables</th>
              <th>Garantía Técnica</th>
              <th className="num">Cobertura de Gobernanza</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(layers).map((layer) => {
              const isSelected = layer.id === selectedLayer;
              return (
                <tr
                  key={`${layer.id}-${isSelected ? 'active' : 'idle'}`}
                  className={`row-clickable ${isSelected ? 'row-selected row-flash' : ''}`}
                  onClick={() => setSelectedLayer(layer.id)}
                >
                  <td>{layer.step}</td>
                  <td>{layer.role}</td>
                  <td>{layer.sla}</td>
                  <td className="num">{layer.coveragePct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="sim-comparison-card">
        <div className="sim-comparison-card__title">
          Nivel de Protección Acumulado hasta {active.step}
        </div>
        <div className="sim-comparison-bars">
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">Índice de blindaje frente a métricas contradictorias</span>
              <span className="sim-bar-value">{active.coveragePct}% garantizado</span>
            </div>
            <div className="sim-bar-track">
              <div
                className="sim-bar-fill sim-bar-fill--stage"
                style={{ '--bar-pct': `${active.coveragePct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="viz-result-banner success">
        <div className="viz-banner-title">
          {active.title} — ({active.role})
        </div>
        <p>{active.detail}</p>
      </div>
    </SimulatorFrame>
  );
}

function AbTestCupedSimulator() {
  const [useCuped, setUseCuped] = useState(true);

  return (
    <SimulatorFrame
      stage={5}
      kicker="Etapa 5 · Experimentación Causal y Reducción de Varianza"
      title="Simulador de intervalo de confianza al 95%: ajuste de varianza CUPED"
      subtitle={
        <>
          El tratamiento B genera <strong>+$0.77 USD por usuario</strong> sobre una muestra de
          50,000 usuarios por rama. Activa o desactiva CUPED.
        </>
      }
      onReset={() => setUseCuped(true)}
      controls={
        <div className="sim-segmented" role="group" aria-label="Ajuste CUPED">
          <button
            type="button"
            className={`sim-segmented__btn ${
              !useCuped ? 'sim-segmented__btn--active-danger' : ''
            }`}
            onClick={() => setUseCuped(false)}
          >
            Sin CUPED (varianza cruda)
          </button>
          <button
            type="button"
            className={`sim-segmented__btn ${
              useCuped ? 'sim-segmented__btn--active' : ''
            }`}
            onClick={() => setUseCuped(true)}
          >
            Con CUPED (usa covariable previa)
          </button>
        </div>
      }
      whatToWatch="CUPED resta la varianza pre-experimento explicada por la covariable histórica, reduciendo el error estándar sin sesgar el efecto medio."
    >
      <div className="sim-table-scroll">
        <table key={useCuped ? 'cuped-on' : 'cuped-off'} className="sim-table tabular">
          <thead>
            <tr>
              <th>Método Estimador</th>
              <th className="num">Lift Estimado</th>
              <th className="num">Error Estándar (SE)</th>
              <th className="num">IC 95%</th>
              <th className="num">p-valor</th>
              <th>Decisión</th>
            </tr>
          </thead>
          <tbody>
            <tr className={!useCuped ? 'row-duplicated row-flash' : ''}>
              <td>Diferencia de Medias Cruda</td>
              <td className="num">+$0.77</td>
              <td className="num">$0.48</td>
              <td className="num">[-$0.18, +$1.72]</td>
              <td className="num">0.112</td>
              <td>Inconcluso (cruza $0)</td>
            </tr>
            <tr className={useCuped ? 'row-optimal row-flash' : ''}>
              <td>Estimador Ajustado CUPED</td>
              <td className="num">+$0.77</td>
              <td className="num">$0.27 (-45%)</td>
              <td className="num">[+$0.24, +$1.30]</td>
              <td className="num">0.004</td>
              <td>Significativo (p &lt; 0.01)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="sim-comparison-card">
        <div className="sim-comparison-card__title">
          Comparación de Amplitud de Incertidumbre (IC 95%) y Duración Requerida
        </div>
        <div className="sim-comparison-bars">
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">
                Sin CUPED — Amplitud IC: $1.90 USD (Requiere 6 semanas de tráfico)
              </span>
              <span className="sim-bar-value">SE = $0.48 · p = 0.112</span>
            </div>
            <div className="sim-bar-track">
              <div
                className="sim-bar-fill sim-bar-fill--danger"
                style={{ '--bar-pct': '100%' }}
              />
            </div>
          </div>
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">
                Con CUPED — Amplitud IC: $1.06 USD (Resuelto en 2 semanas)
              </span>
              <span className="sim-bar-value">SE = $0.27 · p = 0.004</span>
            </div>
            <div className="sim-bar-track">
              <div
                className="sim-bar-fill sim-bar-fill--success"
                style={{ '--bar-pct': '55%' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={`viz-result-banner ${useCuped ? 'success' : 'danger'} tabular`}>
        {useCuped ? (
          <>
            <div className="viz-banner-title">
              Con CUPED: Intervalo 95% = [+$0.24, +$1.30] · p-valor = 0.004 (Significativo)
            </div>
            <p>
              Al descontar la varianza pre-existente de cada usuario en las 2 semanas previas al
              experimento, el error estándar cae un 45%. El intervalo ya no cruza el $0.00 y puedes
              tomar la decisión semanas antes.
            </p>
          </>
        ) : (
          <>
            <div className="viz-banner-title">
              Sin CUPED: Intervalo 95% = [-$0.18, +$1.72] · p-valor = 0.112 (Inconcluso)
            </div>
            <p>
              La alta varianza natural entre compradores pequeños y grandes ensancha el intervalo de
              confianza haciendo que cruce el cero (-$0.18). Tendrías que esperar el doble de
              semanas para alcanzar potencia estadística.
            </p>
          </>
        )}
      </div>
    </SimulatorFrame>
  );
}

function BiAntiSlopComparator() {
  const [designMode, setDesignMode] = useState('tufte'); // 'slop' | 'tufte'

  return (
    <SimulatorFrame
      stage={5}
      kicker="Etapa 5 · Comunicación Cuantitativa y Diseño BI"
      title="Comparador visual: reporte saturado frente a diseño de alta densidad"
      subtitle="Observa cómo se presenta exactamente el mismo resultado regional de Octubre."
      onReset={() => setDesignMode('tufte')}
      controls={
        <div className="sim-segmented" role="group" aria-label="Modo de diseño BI">
          <button
            type="button"
            className={`sim-segmented__btn ${
              designMode === 'slop' ? 'sim-segmented__btn--active-danger' : ''
            }`}
            onClick={() => setDesignMode('slop')}
          >
            Mal BI (Chartjunk / Baja Señal)
          </button>
          <button
            type="button"
            className={`sim-segmented__btn ${
              designMode === 'tufte' ? 'sim-segmented__btn--active' : ''
            }`}
            onClick={() => setDesignMode('tufte')}
          >
            Buen BI (Alta Densidad Dato-Tinta)
          </button>
        </div>
      }
      whatToWatch="Un buen reporte reemplaza gráficos circulares ambiguos por tablas alineadas con contexto contra meta (Plan) y conclusión accionable en el título."
    >
      <div className="sim-comparison-card">
        <div className="sim-comparison-card__title">
          Métricas de Eficiencia Cognitiva del Dashboard
        </div>
        <div className="sim-comparison-bars">
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">Ratio Dato-Tinta (Señal útil frente a adorno)</span>
              <span className="sim-bar-value">
                {designMode === 'slop' ? '22% (Saturado)' : '92% (Alta densidad Tufte)'}
              </span>
            </div>
            <div className="sim-bar-track">
              <div
                className={`sim-bar-fill ${
                  designMode === 'slop' ? 'sim-bar-fill--danger' : 'sim-bar-fill--success'
                }`}
                style={{ '--bar-pct': designMode === 'slop' ? '22%' : '92%' }}
              />
            </div>
          </div>
        </div>
      </div>

      {designMode === 'slop' ? (
        <div className="viz-result-banner danger">
          <div className="viz-banner-title">
            Problemas del reporte tradicional mal diseñado:
          </div>
          <ul className="sim-list">
            <li>
              Título pasivo sin conclusión: <em>&quot;Gráfico Circular de Ventas&quot;</em>.
            </li>
            <li>
              Usa ángulos de pastel para 6 regiones con valores cercanos (18%, 17%, 16%) imposibles
              de distinguir a simple vista.
            </li>
            <li>
              No muestra la meta (Plan) ni la variación contra el mes anterior; el ejecutivo
              pregunta <em>&quot;¿$420K es bueno o malo?&quot;</em>.
            </li>
          </ul>
        </div>
      ) : (
        <div className="sim-panel">
          <div className="sim-panel__title">
            Conclusión Ejecutiva: LATAM y EMEA superaron el plan de octubre en +$180K (+14.2%)
          </div>
          <div className="sim-table-scroll">
            <table className="sim-table tabular">
              <thead>
                <tr>
                  <th>Región</th>
                  <th className="num">Ingreso Real (Oct)</th>
                  <th className="num">Meta (Plan)</th>
                  <th>Cumplimiento Visual</th>
                  <th className="num">vs. Plan</th>
                </tr>
              </thead>
              <tbody>
                <tr className="row-optimal row-flash">
                  <td>
                    <strong>LATAM</strong>
                  </td>
                  <td className="num">$640,000</td>
                  <td className="num">$540,000</td>
                  <td>
                    <div className="sim-inline-bar">
                      <div
                        className="sim-bar-fill sim-bar-fill--success"
                        style={{ '--bar-pct': '100%' }}
                      />
                    </div>
                  </td>
                  <td className="num sim-text-success">+18.5%</td>
                </tr>
                <tr className="row-flash">
                  <td>
                    <strong>EMEA</strong>
                  </td>
                  <td className="num">$510,000</td>
                  <td className="num">$480,000</td>
                  <td>
                    <div className="sim-inline-bar">
                      <div
                        className="sim-bar-fill sim-bar-fill--success"
                        style={{ '--bar-pct': '84%' }}
                      />
                    </div>
                  </td>
                  <td className="num sim-text-success">+6.3%</td>
                </tr>
                <tr className="row-duplicated row-flash">
                  <td>
                    <strong>NORAM</strong>
                  </td>
                  <td className="num">$390,000</td>
                  <td className="num">$430,000</td>
                  <td>
                    <div className="sim-inline-bar">
                      <div
                        className="sim-bar-fill sim-bar-fill--danger"
                        style={{ '--bar-pct': '64%' }}
                      />
                    </div>
                  </td>
                  <td className="num sim-text-danger">-9.3% (Atención)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </SimulatorFrame>
  );
}

function StreamingWatermarkLab() {
  const [clockType, setClockType] = useState('event'); // 'processing' | 'event'

  return (
    <SimulatorFrame
      stage={6}
      kicker="Etapa 6 · Streaming y Tiempo de Evento"
      title="Simulador de reloj en flujo continuo: tiempo de evento frente a procesamiento"
      subtitle={
        <>
          45 compras ocurrieron en el túnel a las <strong>11:59</strong> pero llegaron por red a las{' '}
          <strong>12:02</strong>.
        </>
      }
      onReset={() => setClockType('event')}
      controls={
        <div className="sim-segmented" role="group" aria-label="Tipo de reloj de streaming">
          <button
            type="button"
            className={`sim-segmented__btn ${
              clockType === 'processing' ? 'sim-segmented__btn--active-danger' : ''
            }`}
            onClick={() => setClockType('processing')}
          >
            Processing Time (Hora de llegada al servidor)
          </button>
          <button
            type="button"
            className={`sim-segmented__btn ${
              clockType === 'event' ? 'sim-segmented__btn--active' : ''
            }`}
            onClick={() => setClockType('event')}
          >
            Event Time + Watermark (Hora real del suceso)
          </button>
        </div>
      }
      whatToWatch="Con Event Time + Watermark, los eventos rezagados por red se adjudican a la ventana en que realmente sucedieron (11:59)."
    >
      <div className="sim-table-scroll">
        <table key={clockType} className="sim-table tabular">
          <thead>
            <tr>
              <th>Ventana Horaria</th>
              <th className="num">Ventas Reales</th>
              <th className="num">Ventas Contabilizadas</th>
              <th className="num">Desviación</th>
              <th>Diagnóstico Operativo</th>
            </tr>
          </thead>
          <tbody>
            <tr className={clockType === 'processing' ? 'row-duplicated row-flash' : 'row-optimal row-flash'}>
              <td>Ventana 11:59</td>
              <td className="num">245</td>
              <td className="num">{clockType === 'event' ? '245' : '200'}</td>
              <td className="num">{clockType === 'event' ? '0' : '-45 (Falso desplome)'}</td>
              <td>{clockType === 'event' ? 'Exacta tras Watermark' : 'Subestimada por latencia móvil'}</td>
            </tr>
            <tr className={clockType === 'processing' ? 'row-duplicated row-flash' : 'row-optimal row-flash'}>
              <td>Ventana 12:02</td>
              <td className="num">250</td>
              <td className="num">{clockType === 'event' ? '250' : '295'}</td>
              <td className="num">{clockType === 'event' ? '0' : '+45 (Falso pico)'}</td>
              <td>{clockType === 'event' ? 'Exacta' : 'Inflada con eventos de las 11:59'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="sim-comparison-card">
        <div className="sim-comparison-card__title">
          Conteo en Ventana 11:59 vs. Ventana 12:02
        </div>
        <div className="sim-comparison-bars">
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">Ventana 11:59 (Real: 245 ventas)</span>
              <span className="sim-bar-value">
                {clockType === 'event' ? '245 ventas (100% exacto)' : '200 ventas (-18.4%)'}
              </span>
            </div>
            <div className="sim-bar-track">
              <div
                className={`sim-bar-fill ${
                  clockType === 'event' ? 'sim-bar-fill--success' : 'sim-bar-fill--danger'
                }`}
                style={{ '--bar-pct': clockType === 'event' ? '83%' : '68%' }}
              />
            </div>
          </div>
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">Ventana 12:02 (Real: 250 ventas)</span>
              <span className="sim-bar-value">
                {clockType === 'event' ? '250 ventas (100% exacto)' : '295 ventas (+18.0% inflado)'}
              </span>
            </div>
            <div className="sim-bar-track">
              <div
                className={`sim-bar-fill ${
                  clockType === 'event' ? 'sim-bar-fill--stage' : 'sim-bar-fill--danger'
                }`}
                style={{ '--bar-pct': clockType === 'event' ? '85%' : '100%' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={`viz-result-banner ${clockType === 'event' ? 'success' : 'danger'} tabular`}>
        {clockType === 'event' ? (
          <>
            <div className="viz-banner-title">
              Con Event Time + Watermark: Ventana 11:59 exacta (245 ventas)
            </div>
            <p>
              El motor lee el timestamp interno del evento (<code>11:59:40</code>), espera el margen
              del Watermark y asigna las 45 compras a su ventana real de las 11:59.
            </p>
          </>
        ) : (
          <>
            <div className="viz-banner-title">
              Con Processing Time: Falso desplome a las 11:59 (200 ventas) y falso pico a las 12:02
              (295 ventas)
            </div>
            <p>
              Como el servidor agrupa según su propio reloj de pared al recibir el paquete de red,
              un simple retraso de conectividad móvil dispara falsas alarmas en el dashboard
              operativo.
            </p>
          </>
        )}
      </div>
    </SimulatorFrame>
  );
}

function McpSemanticVsRawSql() {
  const [arch, setArch] = useState('mcp'); // 'raw' | 'mcp'

  return (
    <SimulatorFrame
      stage={6}
      kicker="Etapa 6 · Agentes IA y Protocolo MCP"
      title="Consulta desde agentes: SQL directo frente a servidor MCP y capa semántica"
      subtitle={
        <>
          Pregunta del usuario al agente:{' '}
          <em>&quot;¿Cuál fue el Ingreso Recurrente Neto (NRR) de Enterprise en Q3?&quot;</em>
        </>
      }
      onReset={() => setArch('mcp')}
      controls={
        <div className="sim-segmented" role="group" aria-label="Arquitectura del agente IA">
          <button
            type="button"
            className={`sim-segmented__btn ${
              arch === 'raw' ? 'sim-segmented__btn--active-danger' : ''
            }`}
            onClick={() => setArch('raw')}
          >
            LLM directo a Tablas Crudas (Riesgo Alucinación)
          </button>
          <button
            type="button"
            className={`sim-segmented__btn ${
              arch === 'mcp' ? 'sim-segmented__btn--active' : ''
            }`}
            onClick={() => setArch('mcp')}
          >
            Agente IA → Servidor MCP → Capa Semántica
          </button>
        </div>
      }
      whatToWatch="Conectar un agente IA a tablas crudas produce SQL no determinista; exponer herramientas MCP sobre la Capa Semántica garantiza exactitud y linaje."
    >
      <div className="sim-table-scroll">
        <table key={arch} className="sim-table tabular">
          <thead>
            <tr>
              <th>Vía de Ejecución</th>
              <th>Consulta Ejecutada</th>
              <th className="num">NRR Q3 Devuelto</th>
              <th>Auditoría y Gobernanza</th>
            </tr>
          </thead>
          <tbody>
            <tr className={arch === 'raw' ? 'row-duplicated row-flash' : ''}>
              <td>Text-to-SQL Crudo</td>
              <td>
                <code>JOIN raw.users ON raw.invoices (sin filtro void)</code>
              </td>
              <td className="num">184.2%</td>
              <td>Alucinación por Fan-Out y cuentas test</td>
            </tr>
            <tr className={arch === 'mcp' ? 'row-optimal row-flash' : ''}>
              <td>MCP + MetricFlow</td>
              <td>
                <code>query_governed_metrics(metric=&quot;nrr_pct&quot;)</code>
              </td>
              <td className="num">116.4%</td>
              <td>Métrica oficial certificada por DE/DA/BI</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="sim-comparison-card">
        <div className="sim-comparison-card__title">
          Comparación de NRR Reportado para Enterprise Q3
        </div>
        <div className="sim-comparison-bars">
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">LLM sobre tablas crudas (Fan-Out no controlado)</span>
              <span className="sim-bar-value">184.2% (+67.8 pts de error)</span>
            </div>
            <div className="sim-bar-track">
              <div
                className="sim-bar-fill sim-bar-fill--danger"
                style={{ '--bar-pct': '100%' }}
              />
            </div>
          </div>
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">
                Servidor MCP + Capa Semántica (Valor oficial gobernado)
              </span>
              <span className="sim-bar-value">116.4% (Exacto)</span>
            </div>
            <div className="sim-bar-track">
              <div
                className="sim-bar-fill sim-bar-fill--success"
                style={{ '--bar-pct': '63%' }}
              />
            </div>
          </div>
        </div>
      </div>

      {arch === 'raw' ? (
        <div className="viz-result-banner danger tabular">
          <div className="viz-banner-title">
            Qué falla cuando el LLM adivina SQL sobre 300 tablas crudas:
          </div>
          <p>
            El modelo une <code>raw.users</code> con <code>raw.invoices</code> sin filtrar facturas
            anuladas ni cuentas de prueba, provocando un Fan-Out y devolviendo un NRR falso de{' '}
            <strong>184.2%</strong>.
          </p>
        </div>
      ) : (
        <div className="viz-result-banner success tabular">
          <div className="viz-banner-title">
            Qué ocurre con MCP + Capa Semántica (MetricFlow / Cube):
          </div>
          <p>
            El agente invoca la herramienta gobernada{' '}
            <code>
              query_governed_metrics(metric=&quot;nrr_pct&quot;, segment=&quot;Enterprise&quot;,
              period=&quot;2026-Q3&quot;)
            </code>
            . La Capa Semántica compila el SQL determinista certificado por DE, DA y BI y devuelve
            el valor exacto: <strong>116.4%</strong> junto con su linaje verificable.
          </p>
        </div>
      )}
    </SimulatorFrame>
  );
}
