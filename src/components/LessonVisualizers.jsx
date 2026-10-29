import React, { useState, useSyncExternalStore } from 'react';
import { getEphemeralState, subscribe } from '../state/store.js';
import {
  SimulatorFrame,
  SimSegmented,
  handleInteractiveRowKeyDown,
  getLatestSimulatorState,
  subscribeSimulatorState,
} from './visualizers/SimulatorFrame.jsx';
import {
  AsOfJoinTimelineSim,
  StarVsObtSim,
  ArrowZeroCopySim,
} from './visualizers/SimulatorsPackA.jsx';
import { CohortRetentionSim } from './visualizers/SimulatorsPackB.jsx';

export {
  SimulatorFrame,
  SimSegmented,
  getLatestSimulatorState,
  subscribeSimulatorState,
};

function resolveCanonicalVisualType(rawType, activeLessonId) {
  if (typeof window !== 'undefined' && window.location?.search) {
    try {
      const simParam = new URLSearchParams(window.location.search).get('sim');
      if (simParam) return simParam.trim();
    } catch {
      // ignore URL errors
    }
  }

  const lessonKey = String(activeLessonId || '').trim();
  if (
    rawType === 'row-vs-columnar-storage' &&
    (lessonKey === 'l9-duckdb-polars-marimo' ||
      lessonKey === 'de2-formatos-03-duckdb-polars-marimo')
  ) {
    return 'duckdb-polars';
  }
  if (
    rawType === 'dbt-sqlmesh-dag-explorer' &&
    (lessonKey === 'l12-contracts-semantic-layer' ||
      lessonKey === 'de3-transformacion-03-contracts-semantic-layer')
  ) {
    return 'semantic-contract';
  }
  if (
    rawType === 'streaming-watermark-lab' &&
    (lessonKey === 'l16-cdc-kafka-streaming' ||
      lessonKey === 'de4-streaming-01-cdc-kafka-streaming')
  ) {
    return 'cdc-log-stream';
  }

  return rawType;
}

export default function LessonVisualizer({
  visualType,
  component,
  lessonId,
  onStateChange,
}) {
  const ephemeral = useSyncExternalStore(
    subscribe,
    getEphemeralState,
    getEphemeralState
  );
  const rawType = visualType || component;
  const resolvedType = resolveCanonicalVisualType(
    rawType,
    lessonId || ephemeral?.activeLessonId
  );

  switch (resolvedType) {
    case 'join-grain':
    case 'join-fanout-visualizer':
    case 'join-grain-explosion':
      return (
        <JoinFanoutVisualizer
          visualType={resolvedType}
          onStateChange={onStateChange}
        />
      );
    case 'window-frames':
    case 'window-function-stepper':
      return (
        <WindowFunctionStepper
          visualType={resolvedType}
          onStateChange={onStateChange}
        />
      );
    case 'asof-timeline':
    case 'asof-join-timeline':
      return (
        <AsOfJoinTimelineSim
          visualType={resolvedType}
          onStateChange={onStateChange}
        />
      );
    case 'star-vs-obt':
    case 'star-vs-obt-sim':
    case 'star-vs-obt-Comparator':
      return (
        <StarVsObtSim
          visualType={resolvedType}
          onStateChange={onStateChange}
        />
      );
    case 'scd2-timeline':
    case 'scd2-timeline-builder':
    case 'scd-type2-timeline':
      return (
        <Scd2TimelineBuilder
          visualType={resolvedType}
          onStateChange={onStateChange}
        />
      );
    case 'simpson-paradox':
    case 'simpsons-paradox-explorer':
    case 'simpson-paradox-simulator':
      return (
        <SimpsonsParadoxExplorer
          visualType={resolvedType}
          onStateChange={onStateChange}
        />
      );
    case 'parquet-pushdown':
    case 'row-vs-columnar-storage':
      return (
        <RowVsColumnarStorage
          visualType={resolvedType}
          onStateChange={onStateChange}
        />
      );
    case 'arrow-zero-copy':
    case 'arrow-zero-copy-sim':
    case 'arrow-zero-copy-memory':
      return (
        <ArrowZeroCopySim
          visualType={resolvedType}
          onStateChange={onStateChange}
        />
      );
    case 'duckdb-polars':
    case 'duckdb-polars-sim':
      return (
        <DuckDbPolarsSim
          visualType={resolvedType}
          onStateChange={onStateChange}
        />
      );
    case 'iceberg-time-travel':
    case 'iceberg-v3-snapshot-explorer':
    case 'iceberg-snapshot-time-travel':
      return (
        <IcebergSnapshotExplorer
          visualType={resolvedType}
          onStateChange={onStateChange}
        />
      );
    case 'dbt-sqlmesh-dag':
    case 'dbt-sqlmesh-dag-explorer':
      return (
        <DbtSqlmeshDagExplorer
          visualType={resolvedType}
          onStateChange={onStateChange}
        />
      );
    case 'semantic-contract':
    case 'semantic-contract-sim':
      return (
        <SemanticContractSim
          visualType={resolvedType}
          onStateChange={onStateChange}
        />
      );
    case 'cohort-heatmap':
    case 'cohort-retention-sim':
    case 'cohort-retention-curve':
      return (
        <CohortRetentionSim
          visualType={resolvedType}
          onStateChange={onStateChange}
        />
      );
    case 'ab-cuped':
    case 'ab-test-cuped-simulator':
    case 'ab-test-cuped-variance':
      return (
        <AbTestCupedSimulator
          visualType={resolvedType}
          onStateChange={onStateChange}
        />
      );
    case 'tufte-data-ink':
    case 'bi-anti-slop-comparator':
    case 'data-ink-chart-doctor':
      return (
        <BiAntiSlopComparator
          visualType={resolvedType}
          onStateChange={onStateChange}
        />
      );
    case 'cdc-log-stream':
    case 'cdc-log-stream-sim':
      return (
        <CdcLogStreamSim
          visualType={resolvedType}
          onStateChange={onStateChange}
        />
      );
    case 'flink-watermark':
    case 'streaming-watermark-lab':
      return (
        <StreamingWatermarkLab
          visualType={resolvedType}
          onStateChange={onStateChange}
        />
      );
    case 'mcp-rag-flow':
    case 'mcp-semantic-vs-raw-sql':
    case 'mcp-rag-governance-pipeline':
      return (
        <McpSemanticVsRawSql
          visualType={resolvedType}
          onStateChange={onStateChange}
        />
      );
    default:
      return null;
  }
}

/* ==========================================================================
   1. JOIN GRAIN & FAN-OUT (join-grain / join-fanout-visualizer)
   ========================================================================== */
function JoinFanoutVisualizer({ visualType = 'join-grain', onStateChange }) {
  const [mode, setMode] = useState('fanout'); // 'fanout' | 'cte'

  const liveReadout =
    mode === 'fanout'
      ? 'Con JOIN directo 1:N, el pedido ORD-1 ($250.00) se triplica por sus 3 productos en order_items y SUM(order_total_usd) reporta $850.00 en lugar de los $350.00 reales (+142.8% de inflación).'
      : 'Al preagregar order_items en una CTE por order_id antes del JOIN, ambas tablas igualan su grano a 1 fila por pedido y SUM(order_total_usd) devuelve los $350.00 exactos (0% de desviación).';

  return (
    <SimulatorFrame
      kicker="Combinar tablas · Grano y cardinalidad SQL"
      title="Por qué un JOIN 1:N duplica el importe (fan-out)"
      instruction="Alterna entre el JOIN directo (1:N) y la CTE preagregada (1:1) para observar qué ocurre con el pedido ORD-1 ($250.00) cuando tiene 3 ítems."
      onReset={() => setMode('fanout')}
      visualType={visualType}
      mode={mode}
      metrics={{
        mode,
        realTotalUsd: 350,
        reportedTotalUsd: mode === 'fanout' ? 850 : 350,
        errorPct: mode === 'fanout' ? 142.8 : 0,
        outputRows: mode === 'fanout' ? 4 : 2,
      }}
      liveReadout={liveReadout}
      readoutTone={mode === 'fanout' ? 'bad' : 'ok'}
      onStateChange={onStateChange}
      controls={
        <SimSegmented
          ariaLabel="Modo de cruce SQL"
          value={mode}
          onChange={setMode}
          options={[
            {
              value: 'fanout',
              label: 'JOIN directo (con fan-out)',
              tone: 'bad',
            },
            {
              value: 'cte',
              label: 'Preagregar en CTE (1:1 correcto)',
              tone: 'ok',
            },
          ]}
        />
      }
    >
      <div className="sim-two-col">
        <div className="sim-panel">
          <div className="sim-panel__title">
            Tabla 1: orders (grano = 1 fila por pedido · total real = $350)
          </div>
          <div className="sim-table-scroll">
            <table className="sim-table sim-table--stack tabular">
              <thead>
                <tr>
                  <th>order_id</th>
                  <th>customer</th>
                  <th className="num">order_total_usd</th>
                </tr>
              </thead>
              <tbody>
                <tr className="row-valid">
                  <td data-label="Pedido">ORD-1</td>
                  <td data-label="Cliente">Ana</td>
                  <td data-label="Total pedido" className="num">$250.00</td>
                </tr>
                <tr>
                  <td data-label="Pedido">ORD-2</td>
                  <td data-label="Cliente">Luis</td>
                  <td data-label="Total pedido" className="num">$100.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="sim-panel">
          <div className="sim-panel__title">
            {mode === 'fanout'
              ? 'Tabla 2: order_items (1 fila por ítem → 3 filas para ORD-1)'
              : 'CTE preagregada: items_por_pedido (1 fila por order_id)'}
          </div>
          <div className="sim-table-scroll">
            {mode === 'fanout' ? (
              <table key="table-fanout" className="sim-table sim-table--stack tabular">
                <thead>
                  <tr>
                    <th>order_id</th>
                    <th>item_name</th>
                    <th className="num">qty</th>
                    <th className="num">total_cruzado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="row-duplicated anim-row-stagger">
                    <td data-label="Pedido">ORD-1</td>
                    <td data-label="Ítem">Teclado</td>
                    <td data-label="Cant." className="num">1</td>
                    <td data-label="Total cruzado" className="num">$250.00</td>
                  </tr>
                  <tr className="row-duplicated anim-row-stagger">
                    <td data-label="Pedido">ORD-1</td>
                    <td data-label="Ítem">Mouse</td>
                    <td data-label="Cant." className="num">2</td>
                    <td data-label="Total cruzado" className="num">$250.00 (x2)</td>
                  </tr>
                  <tr className="row-duplicated anim-row-stagger">
                    <td data-label="Pedido">ORD-1</td>
                    <td data-label="Ítem">Cable USB</td>
                    <td data-label="Cant." className="num">2</td>
                    <td data-label="Total cruzado" className="num">$250.00 (x3)</td>
                  </tr>
                  <tr className="anim-row-stagger">
                    <td data-label="Pedido">ORD-2</td>
                    <td data-label="Ítem">Monitor</td>
                    <td data-label="Cant." className="num">1</td>
                    <td data-label="Total cruzado" className="num">$100.00</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <table key="table-cte" className="sim-table sim-table--stack tabular">
                <thead>
                  <tr>
                    <th>order_id</th>
                    <th className="num">unidades (SUM)</th>
                    <th className="num">order_total_usd (1:1)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="row-optimal anim-row-stagger">
                    <td data-label="Pedido">ORD-1</td>
                    <td data-label="Unidades" className="num">5</td>
                    <td data-label="Total (1:1)" className="num">$250.00</td>
                  </tr>
                  <tr className="row-optimal anim-row-stagger">
                    <td data-label="Pedido">ORD-2</td>
                    <td data-label="Unidades" className="num">1</td>
                    <td data-label="Total (1:1)" className="num">$100.00</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="sim-comparison-card">
        <div className="sim-comparison-card__title">
          Comparación de ingreso total reportado por SUM(order_total_usd)
        </div>
        <div className="sim-comparison-bars">
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">
                Total real en tabla orders (referencia)
              </span>
              <span className="sim-bar-value">$350.00 (100% exacto)</span>
            </div>
            <div className="sim-bar-track">
              <div
                className="sim-bar-fill sim-bar-fill--stage"
                data-pct="41"
              />
            </div>
          </div>
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">
                {mode === 'fanout'
                  ? 'JOIN directo 1:N (inflado por fan-out)'
                  : 'JOIN 1:1 tras preagregar en CTE'}
              </span>
              <span className="sim-bar-value">
                {mode === 'fanout'
                  ? '$850.00 (+142.8% error)'
                  : '$350.00 (0% desviación)'}
              </span>
            </div>
            <div className="sim-bar-track">
              <div
                className={`sim-bar-fill ${
                  mode === 'fanout'
                    ? 'sim-bar-fill--danger'
                    : 'sim-bar-fill--success'
                }`}
                data-pct={mode === 'fanout' ? '100' : '41'}
              />
            </div>
          </div>
        </div>
      </div>
    </SimulatorFrame>
  );
}

/* ==========================================================================
   2. WINDOW FUNCTIONS (window-frames / window-function-stepper)
   ========================================================================== */
function WindowFunctionStepper({ visualType = 'window-frames', onStateChange }) {
  const [activeRow, setActiveRow] = useState(1);
  const rows = [
    {
      idx: 0,
      user: 'U-101',
      date: '2025-08-01',
      mrr: 49,
      lag: 0,
      diff: '+49 (Alta)',
      rn: 1,
      running: 49,
    },
    {
      idx: 1,
      user: 'U-101',
      date: '2025-09-01',
      mrr: 49,
      lag: 49,
      diff: '0 (Renovación)',
      rn: 2,
      running: 98,
    },
    {
      idx: 2,
      user: 'U-101',
      date: '2025-10-01',
      mrr: 99,
      lag: 49,
      diff: '+50 (Upgrade)',
      rn: 3,
      running: 197,
    },
    {
      idx: 3,
      user: 'U-204',
      date: '2025-09-15',
      mrr: 79,
      lag: 0,
      diff: '+79 (Nueva partición)',
      rn: 1,
      running: 79,
    },
    {
      idx: 4,
      user: 'U-204',
      date: '2025-10-15',
      mrr: 29,
      lag: 79,
      diff: '-50 (Downgrade)',
      rn: 2,
      running: 108,
    },
  ];

  const current = rows[activeRow];
  const mrrPct = Math.round((current.mrr / 99) * 100);
  const lagPct = Math.round((current.lag / 99) * 100);

  const liveReadout =
    current.rn === 1
      ? `En la Fila #${activeRow + 1} (${current.user}, ${current.date}), inicia la partición PARTITION BY user_id = '${current.user}' (ROW_NUMBER = 1): al no existir fila previa del mismo cliente, LAG(mrr, 1, 0) devuelve $0 y el acumulado es $${current.running}.`
      : `En la Fila #${activeRow + 1} (${current.user}, ${current.date}), dentro de la partición '${current.user}' (ROW_NUMBER = ${current.rn}), LAG(mrr, 1, 0) lee $${current.lag} de la fila anterior del mismo usuario, registra ${current.diff} y acumula $${current.running}.`;

  return (
    <SimulatorFrame
      kicker="SQL analítico · Funciones de ventana"
      title="Ejecución paso a paso de una función de ventana (PARTITION BY y LAG)"
      instruction="Selecciona cualquier fila en los controles o en la tabla para inspeccionar su partición y de dónde toma su valor LAG(mrr, 1, 0)."
      onReset={() => setActiveRow(1)}
      visualType={visualType}
      mode={`row-${activeRow + 1}`}
      metrics={{
        activeRow: activeRow + 1,
        userId: current.user,
        rowNumber: current.rn,
        mrrUsd: current.mrr,
        lagUsd: current.lag,
        runningMrrUsd: current.running,
      }}
      liveReadout={liveReadout}
      readoutTone={current.mrr < current.lag ? 'warn' : 'ok'}
      onStateChange={onStateChange}
      controls={
        <SimSegmented
          ariaLabel="Seleccionar fila"
          value={activeRow}
          onChange={setActiveRow}
          options={rows.map((r) => ({
            value: r.idx,
            label: `Fila ${r.idx + 1} (${r.user})`,
          }))}
        />
      }
    >
      <div className="sim-table-scroll">
        <table className="sim-table sim-table--stack tabular">
          <thead>
            <tr>
              <th>Fila</th>
              <th>user_id (partición)</th>
              <th>event_date</th>
              <th className="num">mrr_usd</th>
              <th className="num">ROW_NUMBER()</th>
              <th className="num">LAG(mrr, 1, 0)</th>
              <th>Clasificación</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => {
              const isSamePartition = r.user === current.user;
              const isSelected = r.idx === activeRow;
              const isPreviousInPartition =
                isSamePartition && r.rn === current.rn - 1;
              const rowClass = [
                'row-clickable',
                isSelected ? 'row-selected anim-grain-fill' : '',
                isPreviousInPartition ? 'row-valid' : '',
                !isSamePartition ? 'row-muted-highlight' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <tr
                  key={`${r.idx}-${isSelected ? 'sel' : 'idle'}`}
                  tabIndex={0}
                  aria-selected={isSelected}
                  data-sim-interactive="true"
                  className={rowClass}
                  onClick={() => setActiveRow(r.idx)}
                  onKeyDown={(e) =>
                    handleInteractiveRowKeyDown(
                      e,
                      () => setActiveRow(r.idx),
                      idx,
                      rows.length,
                      setActiveRow
                    )
                  }
                >
                  <td data-label="Fila">#{r.idx + 1}</td>
                  <td data-label="Partición">{r.user}</td>
                  <td data-label="Fecha">{r.date}</td>
                  <td data-label="MRR" className="num">${r.mrr}</td>
                  <td data-label="ROW_NUMBER" className="num">{r.rn}</td>
                  <td data-label="LAG(mrr, 1, 0)" className="num">${r.lag}</td>
                  <td data-label="Cambio">{r.diff}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="sim-comparison-card">
        <div className="sim-comparison-card__title">
          Comparación en fila #{activeRow + 1} ({current.user}) · MRR previo frente a
          actual
        </div>
        <div className="sim-comparison-bars">
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">
                LAG(mrr, 1, 0) — mes anterior dentro de la partición {current.user}
              </span>
              <span className="sim-bar-value">${current.lag} USD</span>
            </div>
            <div className="sim-bar-track">
              <div
                className="sim-bar-fill sim-bar-fill--neutral"
                data-pct={lagPct}
              />
            </div>
          </div>
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">
                mrr_usd — valor en la fila activa
              </span>
              <span className="sim-bar-value">
                ${current.mrr} USD ({current.diff})
              </span>
            </div>
            <div className="sim-bar-track">
              <div
                className={`sim-bar-fill ${
                  current.mrr < current.lag
                    ? 'sim-bar-fill--danger'
                    : 'sim-bar-fill--success'
                }`}
                data-pct={mrrPct}
              />
            </div>
          </div>
        </div>
      </div>
    </SimulatorFrame>
  );
}

/* ==========================================================================
   3. SCD TYPE 2 TIMELINE (scd2-timeline / scd2-timeline-builder)
   ========================================================================== */
function Scd2TimelineBuilder({ visualType = 'scd2-timeline', onStateChange }) {
  const [scdType, setScdType] = useState('scd2'); // 'scd1' | 'scd2'

  const liveReadout =
    scdType === 'scd1'
      ? 'Con SCD Tipo 1 (sobrescritura), el cambio de U-101 a Enterprise en julio borra que en enero era Pyme: los reportes históricos adjudican $0 a Pyme y $2,500 a Enterprise.'
      : 'Con SCD Tipo 2 (intervalos valid_from / valid_to), U-101 conserva dos filas con claves sustitutas distintas (SK_901 y SK_988): enero atribuye $1,000 a Pyme (40%) y julio asigna $1,500 a Enterprise (60%).';

  return (
    <SimulatorFrame
      kicker="Modelado dimensional · Dimensiones lentamente cambiantes"
      title="Historial dimensional: SCD tipo 1 frente a SCD tipo 2"
      instruction="Alterna entre SCD Tipo 1 (sobrescribe) y SCD Tipo 2 (preserva historia) para ver cómo cambia la atribución de ventas de U-101 ($1,000 en enero como Pyme y $1,500 en julio como Enterprise)."
      onReset={() => setScdType('scd2')}
      visualType={visualType}
      mode={scdType}
      metrics={{
        scdType,
        pymeAttributedUsd: scdType === 'scd1' ? 0 : 1000,
        enterpriseAttributedUsd: scdType === 'scd1' ? 2500 : 1500,
        dimensionRowsForUser: scdType === 'scd1' ? 1 : 2,
      }}
      liveReadout={liveReadout}
      readoutTone={scdType === 'scd1' ? 'bad' : 'ok'}
      onStateChange={onStateChange}
      controls={
        <SimSegmented
          ariaLabel="Tipo de SCD"
          value={scdType}
          onChange={setScdType}
          options={[
            {
              value: 'scd1',
              label: 'SCD Tipo 1 (sobrescribe el pasado)',
              tone: 'bad',
            },
            {
              value: 'scd2',
              label: 'SCD Tipo 2 (preserva historia por intervalos)',
              tone: 'ok',
            },
          ]}
        />
      }
    >
      {scdType === 'scd1' ? (
        <div className="sim-table-scroll">
          <table key="scd1-table" className="sim-table sim-table--stack tabular">
            <thead>
              <tr>
                <th>customer_id</th>
                <th>segment (sobrescrito en julio)</th>
                <th>updated_at</th>
                <th className="num">ventas_atribuidas</th>
              </tr>
            </thead>
            <tbody>
              <tr className="row-duplicated anim-row-stagger">
                <td data-label="Cliente">U-101</td>
                <td data-label="Segmento">
                  Enterprise (se perdió que antes era Pyme)
                </td>
                <td data-label="Actualizado">2025-07-01</td>
                <td data-label="Ventas" className="num">$2,500</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="sim-table-scroll">
          <table key="scd2-table" className="sim-table sim-table--stack tabular">
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
              <tr className="anim-row-stagger">
                <td data-label="Clave SK">SK_901</td>
                <td data-label="Cliente">U-101</td>
                <td data-label="Segmento">Pyme</td>
                <td data-label="Desde">2025-01-01</td>
                <td data-label="Hasta">2025-07-01</td>
                <td data-label="Actual">false</td>
                <td data-label="Ventas" className="num">$1,000</td>
              </tr>
              <tr className="row-optimal anim-row-stagger">
                <td data-label="Clave SK">SK_988</td>
                <td data-label="Cliente">U-101</td>
                <td data-label="Segmento">Enterprise</td>
                <td data-label="Desde">2025-07-01</td>
                <td data-label="Hasta">9999-12-31</td>
                <td data-label="Actual">true</td>
                <td data-label="Ventas" className="num">$1,500</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="sim-comparison-card">
        <div className="sim-comparison-card__title">
          Atribución de ventas por segmento ($2,500 USD totales)
        </div>
        <div className="sim-comparison-bars">
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">
                Segmento Pyme (compra de enero: $1,000 reales)
              </span>
              <span className="sim-bar-value">
                {scdType === 'scd1' ? '$0 USD (borrado)' : '$1,000 USD (40%)'}
              </span>
            </div>
            <div className="sim-bar-track">
              <div
                className={`sim-bar-fill ${
                  scdType === 'scd1'
                    ? 'sim-bar-fill--danger'
                    : 'sim-bar-fill--stage'
                }`}
                data-pct={scdType === 'scd1' ? '4' : '40'}
              />
            </div>
          </div>
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">
                Segmento Enterprise (compra de julio: $1,500 reales)
              </span>
              <span className="sim-bar-value">
                {scdType === 'scd1'
                  ? '$2,500 USD (100% sobreatribuido)'
                  : '$1,500 USD (60%)'}
              </span>
            </div>
            <div className="sim-bar-track">
              <div
                className={`sim-bar-fill ${
                  scdType === 'scd1'
                    ? 'sim-bar-fill--danger'
                    : 'sim-bar-fill--success'
                }`}
                data-pct={scdType === 'scd1' ? '100' : '60'}
              />
            </div>
          </div>
        </div>
      </div>
    </SimulatorFrame>
  );
}

/* ==========================================================================
   4. SIMPSON'S PARADOX (simpson-paradox / simpsons-paradox-explorer)
   ========================================================================== */
function SimpsonsParadoxExplorer({
  visualType = 'simpson-paradox',
  onStateChange,
}) {
  const [mobileShareOct, setMobileShareOct] = useState(70);
  const globalSept = 0.7 * 8.0 + 0.3 * 3.0; // 6.50%
  const webShareOct = 100 - mobileShareOct;
  const globalOct = (webShareOct / 100) * 8.5 + (mobileShareOct / 100) * 3.5;
  const constantMixOct = 0.7 * 8.5 + 0.3 * 3.5; // 7.00%
  const isParadoxActive = globalOct < globalSept;
  const deltaGlobal = +(globalOct - globalSept).toFixed(2);

  const septBarPct = Math.round((globalSept / 10) * 100);
  const octBarPct = Math.round((globalOct / 10) * 100);
  const constBarPct = Math.round((constantMixOct / 10) * 100);

  const liveReadout = isParadoxActive
    ? `Paradoja de Simpson activa con ${mobileShareOct}% de tráfico móvil (${webShareOct}% Web): aunque Web (+0.50%) y App móvil (+0.50%) mejoraron, la tasa global cae de 6.50% a ${globalOct.toFixed(2)}% (${deltaGlobal.toFixed(2)} pts); a mix constante la conversión real es 7.00%.`
    : `Sin inversión de signo con ${mobileShareOct}% de tráfico móvil (${webShareOct}% Web): la conversión global observada es ${globalOct.toFixed(2)}% (+${deltaGlobal.toFixed(2)} pts frente a 6.50%); si el peso móvil supera el 52%, el signo global se invertirá.`;

  return (
    <SimulatorFrame
      kicker="Modelado dimensional · Efectos de mix y agregación"
      title="Paradoja de Simpson y composición de segmentos"
      instruction="Mueve el deslizador de peso de tráfico móvil en octubre (20% a 85%) o alterna los escenarios para observar cuándo se invierte el promedio global."
      onReset={() => setMobileShareOct(70)}
      visualType={visualType}
      mode={`mobile-${mobileShareOct}pct`}
      metrics={{
        mobileShareOctPct: mobileShareOct,
        webShareOctPct: webShareOct,
        globalSeptPct: +globalSept.toFixed(2),
        globalOctPct: +globalOct.toFixed(2),
        constantMixOctPct: +constantMixOct.toFixed(2),
        paradoxActive: isParadoxActive,
      }}
      liveReadout={liveReadout}
      readoutTone={isParadoxActive ? 'bad' : 'ok'}
      onStateChange={onStateChange}
      controls={
        <>
          <label className="sim-slider-box tabular">
            <span>
              Peso del tráfico móvil en octubre:{' '}
              <strong>{mobileShareOct}%</strong> (en septiembre era 30%)
            </span>
            <input
              type="range"
              min="20"
              max="85"
              value={mobileShareOct}
              aria-valuemin={20}
              aria-valuemax={85}
              aria-valuenow={mobileShareOct}
              aria-label="Peso de tráfico móvil en octubre (20% a 85%)"
              onChange={(e) => setMobileShareOct(Number(e.target.value))}
            />
          </label>
          <SimSegmented
            ariaLabel="Escenarios de tráfico"
            value={mobileShareOct}
            onChange={setMobileShareOct}
            options={[
              {
                value: 30,
                label: 'Mix estable (30% móvil)',
                tone: 'ok',
              },
              {
                value: 70,
                label: 'Paradoja activa (70% móvil)',
                tone: 'bad',
              },
            ]}
          />
        </>
      }
    >
      <div className="sim-four-col tabular">
        <div className="sim-metric-box">
          <div className="sim-metric-title">Canal Web (mejoró)</div>
          <div className="sim-metric-nums">
            Sept: 8.00% → Oct: <strong>8.50% (+0.50%)</strong>
          </div>
        </div>
        <div className="sim-metric-box">
          <div className="sim-metric-title">Canal App móvil (mejoró)</div>
          <div className="sim-metric-nums">
            Sept: 3.00% → Oct: <strong>3.50% (+0.50%)</strong>
          </div>
        </div>
        <div className={`sim-metric-box ${isParadoxActive ? 'box-danger' : 'box-ok'}`}>
          <div className="sim-metric-title">Conversión global observada</div>
          <div className="sim-metric-nums">
            Sept: {globalSept.toFixed(2)}% → Oct:{' '}
            <strong>
              {globalOct.toFixed(2)}% (
              {(deltaGlobal >= 0 ? '+' : '') + deltaGlobal.toFixed(2)}%)
            </strong>
          </div>
        </div>
        <div className="sim-metric-box box-ok">
          <div className="sim-metric-title">Conversión a mix constante</div>
          <div className="sim-metric-nums">
            Sept: 6.50% → Oct:{' '}
            <strong>{constantMixOct.toFixed(2)}% (+0.50% real)</strong>
          </div>
        </div>
      </div>

      <div className="sim-comparison-card">
        <div className="sim-comparison-card__title">
          Comparación de tasas de conversión (escala 0% – 10%)
        </div>
        <div className="sim-comparison-bars">
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">
                Septiembre base (70% Web / 30% Móvil)
              </span>
              <span className="sim-bar-value">{globalSept.toFixed(2)}%</span>
            </div>
            <div className="sim-bar-track">
              <div
                className="sim-bar-fill sim-bar-fill--neutral"
                data-pct={septBarPct}
              />
            </div>
          </div>
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">
                Octubre observado ({webShareOct}% Web / {mobileShareOct}% Móvil)
              </span>
              <span className="sim-bar-value">{globalOct.toFixed(2)}%</span>
            </div>
            <div className="sim-bar-track">
              <div
                className={`sim-bar-fill ${
                  isParadoxActive
                    ? 'sim-bar-fill--danger'
                    : 'sim-bar-fill--success'
                }`}
                data-pct={octBarPct}
              />
            </div>
          </div>
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">
                Octubre normalizado a mix constante (70% Web / 30% Móvil)
              </span>
              <span className="sim-bar-value">
                {constantMixOct.toFixed(2)}% (+0.50%)
              </span>
            </div>
            <div className="sim-bar-track">
              <div
                className="sim-bar-fill sim-bar-fill--stage"
                data-pct={constBarPct}
              />
            </div>
          </div>
        </div>
      </div>
    </SimulatorFrame>
  );
}

/* ==========================================================================
   5. PARQUET PUSHDOWN (parquet-pushdown / row-vs-columnar-storage)
   ========================================================================== */
function RowVsColumnarStorage({
  visualType = 'parquet-pushdown',
  onStateChange,
}) {
  const [storageMode, setStorageMode] = useState('columnar'); // 'row' | 'columnar'

  const liveReadout =
    storageMode === 'row'
      ? 'En almacenamiento por filas (CSV / Heap), todas las 60 columnas están intercaladas: la consulta debe escanear los 4 bloques completos (4,096 MB leídos, 100% de I/O).'
      : 'En Parquet columnar ordenado por fecha, el motor salta el Row Group 1 por Zone Map (Min/Max), ignora 58 columnas no pedidas y solo lee 131 MB de region y monto (3.2% del disco, 31x menos lectura).';

  return (
    <SimulatorFrame
      kicker="Formatos físicos · Podado de I/O y zone maps"
      title="Inspección de disco: almacén por filas frente a Parquet columnar"
      instruction="Alterna entre almacenamiento por filas y Parquet columnar para ver qué bloques físicos se leen al ejecutar SELECT region, SUM(monto) WHERE fecha = '2025-10-28'."
      onReset={() => setStorageMode('columnar')}
      visualType={visualType}
      mode={storageMode}
      metrics={{
        storageMode,
        totalTableMb: 4096,
        bytesReadMb: storageMode === 'row' ? 4096 : 131,
        ioPct: storageMode === 'row' ? 100 : 3.2,
        columnsRead: storageMode === 'row' ? 60 : 2,
      }}
      liveReadout={liveReadout}
      readoutTone={storageMode === 'row' ? 'bad' : 'ok'}
      onStateChange={onStateChange}
      controls={
        <SimSegmented
          ariaLabel="Formato de almacenamiento"
          value={storageMode}
          onChange={setStorageMode}
          options={[
            {
              value: 'row',
              label: 'Por filas (PostgreSQL / CSV)',
              tone: 'bad',
            },
            {
              value: 'columnar',
              label: 'Columnar (Parquet ordenado)',
              tone: 'ok',
            },
          ]}
        />
      }
    >
      {storageMode === 'row' ? (
        <div className="sim-storage-blocks tabular">
          <p className="sim-storage-lead">
            En un almacén por filas, las 60 columnas de cada registro están contiguas. Para
            sumar <code>monto</code> hay que leer también <code>id</code>,{' '}
            <code>email</code>, <code>dirección</code> y todas las fechas:
          </p>
          <div className="block-strip">
            {[
              'Bloque 1 (Oct-01: 60 columnas intercaladas)',
              'Bloque 2 (Oct-05: 60 columnas intercaladas)',
              'Bloque 3 (Oct-18: 60 columnas intercaladas)',
              'Bloque 4 (Oct-28: 60 columnas intercaladas)',
            ].map((b) => (
              <div key={b} className="disk-block scanned-bad anim-row-stagger">
                {b} — LEÍDO COMPLETO (100% I/O)
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="sim-storage-blocks tabular">
          <p className="sim-storage-lead">
            En Parquet ordenado por fecha, el motor descarta el Row Group antiguo gracias al
            estadístico Min/Max del footer (Zone Map) y solo lee los Column Chunks de{' '}
            <code>region</code> y <code>monto</code>:
          </p>
          <div className="block-strip">
            <div className="disk-block pruned anim-row-stagger">
              Row Group 1 (Min: Oct-01, Max: Oct-15) — SALTADO POR ZONE MAP (0 B leídos)
            </div>
            <div className="disk-block pruned anim-row-stagger">
              Row Group 2 · 58 columnas (email, dirección, notas…) — PODADAS POR PROYECCIÓN (0 B
              leídos)
            </div>
            <div className="disk-block scanned-good anim-row-stagger">
              Row Group 2 (Oct-28) · Chunks [region] + [monto] — LEÍDO Y VECTORIZADO (131 MB ·
              3.2% del disco)
            </div>
          </div>
        </div>
      )}

      <div className="sim-comparison-card">
        <div className="sim-comparison-card__title">
          Volumen de datos leídos de disco (tabla de 4.0 GB · 60 columnas)
        </div>
        <div className="sim-comparison-bars">
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">
                Almacén por filas (Full Table Scan)
              </span>
              <span className="sim-bar-value">4,096 MB (100% I/O)</span>
            </div>
            <div className="sim-bar-track">
              <div
                className="sim-bar-fill sim-bar-fill--danger"
                data-pct="100"
              />
            </div>
          </div>
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">
                Parquet columnar (Zone Maps + Projection Pushdown)
              </span>
              <span className="sim-bar-value">
                131 MB (3.2% I/O · 31x menos lectura)
              </span>
            </div>
            <div className="sim-bar-track">
              <div
                className="sim-bar-fill sim-bar-fill--success"
                data-pct="6"
              />
            </div>
          </div>
        </div>
      </div>
    </SimulatorFrame>
  );
}

/* ==========================================================================
   6. DUCKDB / POLARS LAZY EXECUTION (duckdb-polars)
   ========================================================================== */
function DuckDbPolarsSim({ visualType = 'duckdb-polars', onStateChange }) {
  const [execMode, setExecMode] = useState('lazy'); // 'eager' | 'lazy'
  const [datasetScale, setDatasetScale] = useState('50m'); // '1m' | '10m' | '50m'

  const scenarios = {
    '1m': {
      label: '1M filas (250 MB)',
      eagerRamGb: 1.1,
      lazyRamGb: 0.08,
      eagerMs: 920,
      lazyMs: 65,
      eagerPct: 14,
      lazyPct: 4,
      oom: false,
    },
    '10m': {
      label: '10M filas (2.5 GB)',
      eagerRamGb: 6.8,
      lazyRamGb: 0.35,
      eagerMs: 8400,
      lazyMs: 390,
      eagerPct: 85,
      lazyPct: 6,
      oom: false,
    },
    '50m': {
      label: '50M filas (12 GB)',
      eagerRamGb: 28.4,
      lazyRamGb: 0.62,
      eagerMs: null,
      lazyMs: 1480,
      eagerPct: 100,
      lazyPct: 8,
      oom: true,
    },
  };

  const current = scenarios[datasetScale];
  const isOom = execMode === 'eager' && current.oom;

  const liveReadout =
    execMode === 'eager'
      ? isOom
        ? `Con evaluación Eager sobre ${current.label}, el motor intenta cargar las 60 columnas y clonar DataFrames intermedios en RAM (${current.eagerRamGb} GB requeridos > 8 GB del portátil), abortando por MemoryError (OOM).`
        : `Con evaluación Eager sobre ${current.label}, cada paso materializa una copia intermedia en RAM (${current.eagerRamGb} GB pico y ${current.eagerMs} ms) antes de aplicar el filtro final.`
      : `Con plan Lazy vectorizado (DuckDB / Polars) sobre ${current.label}, el optimizador empuja predicados y proyección al escaneo Parquet y procesa en lotes streaming usando solo ${current.lazyRamGb} GB de RAM en ${current.lazyMs} ms.`;

  return (
    <SimulatorFrame
      kicker="Motores locales · Ejecución vectorizada y grafos reactivos"
      title="Evaluación ansiosa (Eager) frente a plan perezoso (Lazy) en DuckDB y Polars"
      instruction="Alterna entre evaluación Eager y Lazy y selecciona el volumen del archivo Parquet frente a un portátil con límite de 8 GB de RAM."
      onReset={() => {
        setExecMode('lazy');
        setDatasetScale('50m');
      }}
      visualType={visualType}
      mode={`${execMode}:${datasetScale}`}
      metrics={{
        execMode,
        datasetScale,
        peakRamGb: execMode === 'eager' ? current.eagerRamGb : current.lazyRamGb,
        latencyMs: execMode === 'eager' ? current.eagerMs : current.lazyMs,
        outOfMemory: isOom,
      }}
      liveReadout={liveReadout}
      readoutTone={execMode === 'eager' ? 'bad' : 'ok'}
      onStateChange={onStateChange}
      controls={
        <>
          <SimSegmented
            ariaLabel="Modo de evaluación del motor"
            value={execMode}
            onChange={setExecMode}
            options={[
              {
                value: 'eager',
                label: 'Eager en memoria (pandas clásico)',
                tone: 'bad',
              },
              {
                value: 'lazy',
                label: 'Lazy + Streaming (DuckDB / Polars)',
                tone: 'ok',
              },
            ]}
          />
          <SimSegmented
            ariaLabel="Volumen del dataset Parquet"
            value={datasetScale}
            onChange={setDatasetScale}
            options={[
              { value: '1m', label: '1M filas (250 MB)' },
              { value: '10m', label: '10M filas (2.5 GB)' },
              { value: '50m', label: '50M filas (12 GB)' },
            ]}
          />
        </>
      }
    >
      <div className="sim-table-scroll">
        <table
          key={`${execMode}-${datasetScale}`}
          className="sim-table sim-table--stack tabular"
        >
          <thead>
            <tr>
              <th>Etapa del plan</th>
              <th>Operación ejecutada ({execMode === 'eager' ? 'Eager' : 'Lazy Optimizer'})</th>
              <th className="num">Columnas en RAM</th>
              <th className="num">Memoria pico</th>
              <th>Resultado en portátil (8 GB RAM)</th>
            </tr>
          </thead>
          <tbody>
            <tr
              className={`anim-row-stagger ${
                execMode === 'eager' ? 'row-duplicated' : 'row-optimal'
              }`}
            >
              <td data-label="Etapa">1. Lectura Parquet</td>
              <td data-label="Operación">
                {execMode === 'eager'
                  ? 'read_parquet() carga toda la tabla en RAM'
                  : 'scan_parquet() registra metadatos sin leer bloques'}
              </td>
              <td data-label="Columnas" className="num">
                {execMode === 'eager' ? '60 / 60' : '3 / 60 (Pushdown)'}
              </td>
              <td data-label="RAM pico" className="num">
                {execMode === 'eager'
                  ? `${(current.eagerRamGb * 0.65).toFixed(1)} GB`
                  : `${(current.lazyRamGb * 0.5).toFixed(2)} GB`}
              </td>
              <td data-label="Estado">
                {isOom ? 'Excede RAM física al descomprimir' : 'En margen'}
              </td>
            </tr>
            <tr
              className={`anim-row-stagger ${
                execMode === 'eager' ? 'row-duplicated' : 'row-optimal'
              }`}
            >
              <td data-label="Etapa">2. Filtro + GROUP BY</td>
              <td data-label="Operación">
                {execMode === 'eager'
                  ? 'Clona DataFrame filtrado antes de agregar'
                  : 'Streaming vectorizado SIMD por lotes de 64k filas'}
              </td>
              <td data-label="Columnas" className="num">
                {execMode === 'eager' ? '60 / 60' : '3 / 60'}
              </td>
              <td data-label="RAM pico" className="num">
                {execMode === 'eager'
                  ? `${current.eagerRamGb} GB`
                  : `${current.lazyRamGb} GB`}
              </td>
              <td data-label="Estado">
                {isOom
                  ? 'Fallo: MemoryError (OOM > 8 GB)'
                  : `Completado en ${
                      execMode === 'eager' ? current.eagerMs : current.lazyMs
                    } ms`}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="sim-comparison-card">
        <div className="sim-comparison-card__title">
          Consumo pico de RAM frente al límite del equipo (8.0 GB RAM) · {current.label}
        </div>
        <div className="sim-comparison-bars">
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">
                Evaluación Eager (materializa copias intermedias)
              </span>
              <span className="sim-bar-value">
                {current.eagerRamGb} GB RAM ·{' '}
                {current.oom ? 'OOM Crash (> 8 GB)' : `${current.eagerMs} ms`}
              </span>
            </div>
            <div className="sim-bar-track">
              <div
                className="sim-bar-fill sim-bar-fill--danger"
                data-pct={current.eagerPct}
              />
            </div>
          </div>
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">
                Plan Lazy en DuckDB / Polars (pushdown + streaming out-of-core)
              </span>
              <span className="sim-bar-value">
                {current.lazyRamGb} GB RAM · {current.lazyMs} ms
              </span>
            </div>
            <div className="sim-bar-track">
              <div
                className="sim-bar-fill sim-bar-fill--success"
                data-pct={current.lazyPct}
              />
            </div>
          </div>
        </div>
      </div>
    </SimulatorFrame>
  );
}

/* ==========================================================================
   7. ICEBERG TIME TRAVEL & DELETION VECTORS (iceberg-time-travel)
   ========================================================================== */
function IcebergSnapshotExplorer({
  visualType = 'iceberg-time-travel',
  onStateChange,
}) {
  const [snapshot, setSnapshot] = useState(2);

  const liveReadout =
    snapshot === 1
      ? 'En el Snapshot #1 (carga inicial), metadata.v1.json apunta únicamente al archivo base data-001.parquet (1,000,000 de filas inmutables) y el pedido ORD-412 figura como PAID por $350.'
      : 'En el Snapshot #2 (UPDATE con Deletion Vector v3), Iceberg escribe un bitmap Puffin de 12 KB (dv-001.puffin) marcando la fila #412 como borrada más 1 fila en data-002.parquet (ORD-412 → REFUNDED $0), evitando reescribir los 256 MB de data-001.parquet.';

  return (
    <SimulatorFrame
      kicker="Lakehouse y almacenes · Apache Iceberg v3"
      title="Snapshots y vectores de borrado en Apache Iceberg"
      instruction="Alterna entre el Snapshot #1 y el Snapshot #2 para observar cómo Iceberg actualiza una fila sobre 1 millón sin reescribir el archivo Parquet base."
      onReset={() => setSnapshot(2)}
      visualType={visualType}
      mode={`snapshot-${snapshot}`}
      metrics={{
        snapshot,
        ord412Status: snapshot === 1 ? 'PAID' : 'REFUNDED',
        ord412AmountUsd: snapshot === 1 ? 350 : 0,
        bytesWrittenKb: snapshot === 1 ? 262144 : 12,
      }}
      liveReadout={liveReadout}
      readoutTone="ok"
      onStateChange={onStateChange}
      controls={
        <SimSegmented
          ariaLabel="Seleccionar Snapshot"
          value={snapshot}
          onChange={setSnapshot}
          options={[
            {
              value: 1,
              label: 'Snapshot #1 (carga inicial)',
            },
            {
              value: 2,
              label: 'Snapshot #2 (UPDATE con Deletion Vector v3)',
              tone: 'ok',
            },
          ]}
        />
      }
    >
      <div className="sim-two-col tabular">
        <div className="sim-panel">
          <div className="sim-panel__title">
            Árbol de metadatos activo (Snapshot #{snapshot})
          </div>
          <ul className="sim-list">
            <li>
              <code>metadata.v{snapshot}.json</code> → apunta a{' '}
              <code>snap-{snapshot}.avro</code>
            </li>
            <li>
              Archivo base: <code>data-001.parquet</code> (1,000,000 de filas
              inmutables)
            </li>
            {snapshot === 2 && (
              <>
                <li className="sim-text-success">
                  + Vector de borrado: <code>dv-001.puffin</code> (bitmap Roaring que
                  marca la posición #412 como borrada)
                </li>
                <li className="sim-text-primary">
                  + Archivo delta: <code>data-002.parquet</code> (1 fila nueva con el
                  estado actualizado)
                </li>
              </>
            )}
          </ul>
        </div>

        <div className="sim-panel">
          <div className="sim-panel__title">
            Resultado visible para consultas en Snapshot #{snapshot}
          </div>
          <div className="sim-table-scroll">
            <table
              key={`snap-${snapshot}`}
              className="sim-table sim-table--stack tabular"
            >
              <thead>
                <tr>
                  <th>order_id</th>
                  <th>status</th>
                  <th className="num">amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td data-label="Pedido">ORD-411</td>
                  <td data-label="Estado">PAID</td>
                  <td data-label="Importe" className="num">$120</td>
                </tr>
                <tr
                  className={
                    snapshot === 2
                      ? 'row-optimal anim-row-stagger'
                      : 'anim-row-stagger'
                  }
                >
                  <td data-label="Pedido">ORD-412</td>
                  <td data-label="Estado">
                    {snapshot === 1 ? 'PAID' : 'REFUNDED (actualizado)'}
                  </td>
                  <td data-label="Importe" className="num">
                    {snapshot === 1 ? '$350' : '$0'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="sim-comparison-card">
        <div className="sim-comparison-card__title">
          Amplificación de escritura al actualizar 1 fila sobre 1M de registros
        </div>
        <div className="sim-comparison-bars">
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">
                Reescritura Copy-on-Write tradicional
              </span>
              <span className="sim-bar-value">
                256 MB reescritos (1,000,000 de filas)
              </span>
            </div>
            <div className="sim-bar-track">
              <div
                className="sim-bar-fill sim-bar-fill--danger"
                data-pct="100"
              />
            </div>
          </div>
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">
                Iceberg v3 Deletion Vector (dv-001.puffin)
              </span>
              <span className="sim-bar-value">
                12 KB escritos (bitmap Roaring + 1 fila)
              </span>
            </div>
            <div className="sim-bar-track">
              <div
                className="sim-bar-fill sim-bar-fill--success"
                data-pct="4"
              />
            </div>
          </div>
        </div>
      </div>
    </SimulatorFrame>
  );
}

/* ==========================================================================
   8. DBT & SQLMESH DAG (dbt-sqlmesh-dag / dbt-sqlmesh-dag-explorer)
   ========================================================================== */
function DbtSqlmeshDagExplorer({
  visualType = 'dbt-sqlmesh-dag',
  onStateChange,
}) {
  const [selectedLayer, setSelectedLayer] = useState('semantic');

  const layers = {
    contract: {
      id: 'contract',
      step: '1. Contrato de datos',
      title: '1. Contrato de datos (ODCS en el borde)',
      role: 'Ingeniería de Software + DE',
      sla: '0% nulos en PK · Esquema validado en ingesta',
      coveragePct: 35,
      detail:
        'En la capa 1 (Contrato de datos), la ingesta valida tipos, 0% de nulos en claves primarias y SLAs antes de escribir en el Lakehouse (35% de cobertura acumulada).',
    },
    silver: {
      id: 'silver',
      step: '2. Silver (dbt / SQLMesh)',
      title: '2. Modelos Silver (dbt / SQLMesh incremental)',
      role: 'Ingeniería de Datos (DE) + DA',
      sla: 'Grano 1:1 certificado · SCD2 por intervalos',
      coveragePct: 70,
      detail:
        'En la capa 2 (Silver con dbt / SQLMesh), se deduplica con QUALIFY y se procesan incrementos por intervalos con entornos virtuales sin reconstruir toda la historia (70% de cobertura).',
    },
    semantic: {
      id: 'semantic',
      step: '3. Capa semántica',
      title: '3. Capa semántica (MetricFlow / Cube)',
      role: 'BI + DA + Agentes IA',
      sla: '100% consistencia de métricas en BI y MCP',
      coveragePct: 100,
      detail:
        'En la capa 3 (Capa semántica), las métricas de negocio (MRR, Churn, Conversión) se declaran una sola vez en YAML para que tableros, notebooks y agentes nunca se contradigan (100% de cobertura).',
    },
  };

  const layerList = Object.values(layers);
  const active = layers[selectedLayer];

  return (
    <SimulatorFrame
      kicker="Transformación y calidad · Gobernanza del DAG"
      title="Flujo de gobernanza: del contrato de datos a la capa semántica"
      instruction="Selecciona cada etapa del grafo de transformación en los botones o en la tabla para inspeccionar qué invariantes garantiza."
      onReset={() => setSelectedLayer('semantic')}
      visualType={visualType}
      mode={selectedLayer}
      metrics={{
        selectedLayer,
        coveragePct: active.coveragePct,
        responsibleRole: active.role,
      }}
      liveReadout={active.detail}
      readoutTone="ok"
      onStateChange={onStateChange}
      controls={
        <SimSegmented
          ariaLabel="Capas del DAG"
          value={selectedLayer}
          onChange={setSelectedLayer}
          options={layerList.map((layer) => ({
            value: layer.id,
            label: layer.step,
          }))}
        />
      }
    >
      <div className="sim-table-scroll">
        <table className="sim-table sim-table--stack tabular">
          <thead>
            <tr>
              <th>Capa de la tubería</th>
              <th>Responsables</th>
              <th>Garantía técnica</th>
              <th className="num">Cobertura</th>
            </tr>
          </thead>
          <tbody>
            {layerList.map((layer, idx) => {
              const isSelected = layer.id === selectedLayer;
              return (
                <tr
                  key={`${layer.id}-${isSelected ? 'active' : 'idle'}`}
                  tabIndex={0}
                  aria-selected={isSelected}
                  data-sim-interactive="true"
                  className={`row-clickable ${
                    isSelected ? 'row-selected anim-grain-fill' : ''
                  }`}
                  onClick={() => setSelectedLayer(layer.id)}
                  onKeyDown={(e) =>
                    handleInteractiveRowKeyDown(
                      e,
                      () => setSelectedLayer(layer.id),
                      idx,
                      layerList.length,
                      (nextIdx) => setSelectedLayer(layerList[nextIdx].id)
                    )
                  }
                >
                  <td data-label="Capa">{layer.step}</td>
                  <td data-label="Responsables">{layer.role}</td>
                  <td data-label="Garantía">{layer.sla}</td>
                  <td data-label="Cobertura" className="num">
                    {layer.coveragePct}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="sim-comparison-card">
        <div className="sim-comparison-card__title">
          Nivel de protección acumulado hasta {active.step}
        </div>
        <div className="sim-comparison-bars">
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">
                Índice de blindaje frente a esquemas rotos y métricas contradictorias
              </span>
              <span className="sim-bar-value">{active.coveragePct}% garantizado</span>
            </div>
            <div className="sim-bar-track">
              <div
                className="sim-bar-fill sim-bar-fill--stage"
                data-pct={active.coveragePct}
              />
            </div>
          </div>
        </div>
      </div>
    </SimulatorFrame>
  );
}

/* ==========================================================================
   9. SEMANTIC CONTRACT & METRIC CONSISTENCY (semantic-contract)
   ========================================================================== */
function SemanticContractSim({
  visualType = 'semantic-contract',
  onStateChange,
}) {
  const [govMode, setGovMode] = useState('governed'); // 'ungoverned' | 'governed'
  const [scenario, setScenario] = useState('metric'); // 'schema' | 'metric'

  const liveReadout =
    govMode === 'ungoverned'
      ? scenario === 'schema'
        ? 'Sin contrato ODCS: cuando el microservicio renombra status a state_code, la ingesta falla en cascada a las 03:00 AM y deja el tablero ejecutivo con datos obsoletos.'
        : 'Sin capa semántica: DE, DA y BI escriben su propio SQL para margen_neto y presentan tres cifras distintas ($412K, $389K y $445K) en el comité semanal.'
      : scenario === 'schema'
      ? 'Con contrato ODCS en CI/CD: el Pull Request del microservicio que intenta renombrar status sin versión de transición queda bloqueado antes de llegar a producción (0 caídas en DE/DA/BI).'
      : 'Con capa semántica (MetricFlow / Cube): DE, DA y BI consultan la misma medida gobernada net_margin_usd y obtienen exactamente $389,400 USD en todas las herramientas.';

  return (
    <SimulatorFrame
      kicker="Gobierno de datos · Contratos ODCS y capa semántica"
      title="Impacto en DE, DA y BI: sin gobierno frente a contrato ODCS + capa semántica"
      instruction="Alterna el nivel de gobierno y el evento simulado para comparar cómo afecta a Ingeniería de Datos (DE), Análisis (DA) y Business Intelligence (BI)."
      onReset={() => {
        setGovMode('governed');
        setScenario('metric');
      }}
      visualType={visualType}
      mode={`${govMode}:${scenario}`}
      metrics={{
        govMode,
        scenario,
        discrepancyUsd: govMode === 'ungoverned' ? 56000 : 0,
        productionIncidents: govMode === 'ungoverned' ? 3 : 0,
      }}
      liveReadout={liveReadout}
      readoutTone={govMode === 'ungoverned' ? 'bad' : 'ok'}
      onStateChange={onStateChange}
      controls={
        <>
          <SimSegmented
            ariaLabel="Modo de gobierno"
            value={govMode}
            onChange={setGovMode}
            options={[
              {
                value: 'ungoverned',
                label: 'Sin contrato ni capa semántica',
                tone: 'bad',
              },
              {
                value: 'governed',
                label: 'Contrato ODCS + Capa semántica',
                tone: 'ok',
              },
            ]}
          />
          <SimSegmented
            ariaLabel="Escenario simulado"
            value={scenario}
            onChange={setScenario}
            options={[
              { value: 'metric', label: '1. Cálculo de margen neto' },
              { value: 'schema', label: '2. Cambio de columna en origen' },
            ]}
          />
        </>
      }
    >
      <div className="sim-table-scroll">
        <table
          key={`${govMode}-${scenario}`}
          className="sim-table sim-table--stack tabular"
        >
          <thead>
            <tr>
              <th>Área</th>
              <th>Definición o regla aplicada</th>
              <th className="num">Valor / Estado</th>
              <th>Diagnóstico</th>
            </tr>
          </thead>
          <tbody>
            <tr
              className={`anim-row-stagger ${
                govMode === 'ungoverned' ? 'row-duplicated' : 'row-optimal'
              }`}
            >
              <td data-label="Área">
                <span className="sim-area-tag">
                  <span className="sim-area-dot sim-area-dot--de" aria-hidden="true" />
                  DE · Ingesta y Silver
                </span>
              </td>
              <td data-label="Regla">
                {scenario === 'schema'
                  ? govMode === 'ungoverned'
                    ? 'Ingesta sin validación de esquema ODCS'
                    : 'Check ODCS v3 en CI del microservicio'
                  : govMode === 'ungoverned'
                  ? 'SUM(gross - discount) sin restar devoluciones'
                  : 'Modelo fct_orders certificado con contrato'}
              </td>
              <td data-label="Valor / Estado" className="num">
                {scenario === 'schema'
                  ? govMode === 'ungoverned'
                    ? 'ERROR: column status'
                    : 'PR bloqueado en CI'
                  : govMode === 'ungoverned'
                  ? '$445,000'
                  : '$389,400'}
              </td>
              <td data-label="Diagnóstico">
                {govMode === 'ungoverned'
                  ? 'Ruptura o sobreestimación'
                  : '100% alineado'}
              </td>
            </tr>
            <tr
              className={`anim-row-stagger ${
                govMode === 'ungoverned' ? 'row-duplicated' : 'row-optimal'
              }`}
            >
              <td data-label="Área">
                <span className="sim-area-tag">
                  <span className="sim-area-dot sim-area-dot--da" aria-hidden="true" />
                  DA · Notebooks
                </span>
              </td>
              <td data-label="Regla">
                {scenario === 'schema'
                  ? govMode === 'ungoverned'
                    ? 'Script falla al filtrar status = PAID'
                    : 'Columna garantizada por SLA de contrato'
                  : govMode === 'ungoverned'
                  ? 'Descuenta reembolsos pero incluye IVA'
                  : 'Consume metric("net_margin_usd")'}
              </td>
              <td data-label="Valor / Estado" className="num">
                {scenario === 'schema'
                  ? govMode === 'ungoverned'
                    ? 'KeyError en Python'
                    : '0 fallos'
                  : govMode === 'ungoverned'
                  ? '$412,000'
                  : '$389,400'}
              </td>
              <td data-label="Diagnóstico">
                {govMode === 'ungoverned'
                  ? 'Criterio aislado en notebook'
                  : '100% alineado'}
              </td>
            </tr>
            <tr
              className={`anim-row-stagger ${
                govMode === 'ungoverned' ? 'row-duplicated' : 'row-optimal'
              }`}
            >
              <td data-label="Área">
                <span className="sim-area-tag">
                  <span className="sim-area-dot sim-area-dot--bi" aria-hidden="true" />
                  BI · Tablero ejecutivo
                </span>
              </td>
              <td data-label="Regla">
                {scenario === 'schema'
                  ? govMode === 'ungoverned'
                    ? 'Refresh nocturno roto; muestra datos viejos'
                    : 'Tablero protegido por contrato upstream'
                  : govMode === 'ungoverned'
                  ? 'Medida local duplicada en el reporte'
                  : 'Medida YAML única en capa semántica'}
              </td>
              <td data-label="Valor / Estado" className="num">
                {scenario === 'schema'
                  ? govMode === 'ungoverned'
                    ? 'Datos congelados'
                    : ' SLA cumplido'
                  : '$389,400'}
              </td>
              <td data-label="Diagnóstico">
                {govMode === 'ungoverned'
                  ? 'Desconfianza en dirección'
                  : 'Fuente única de verdad'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="sim-comparison-card">
        <div className="sim-comparison-card__title">
          Divergencia de métricas entre equipos (DE · DA · BI)
        </div>
        <div className="sim-comparison-bars">
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">
                Sin capa semántica (SQL duplicado en cada herramienta)
              </span>
              <span className="sim-bar-value">
                $55,600 USD de brecha entre reportes
              </span>
            </div>
            <div className="sim-bar-track">
              <div
                className="sim-bar-fill sim-bar-fill--danger"
                data-pct="100"
              />
            </div>
          </div>
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">
                Con contrato ODCS + capa semántica gobernada
              </span>
              <span className="sim-bar-value">
                $0 USD de brecha (100% consistencia)
              </span>
            </div>
            <div className="sim-bar-track">
              <div
                className="sim-bar-fill sim-bar-fill--success"
                data-pct="4"
              />
            </div>
          </div>
        </div>
      </div>
    </SimulatorFrame>
  );
}

/* ==========================================================================
   10. A/B TEST & CUPED (ab-cuped / ab-test-cuped-simulator)
   ========================================================================== */
function AbTestCupedSimulator({ visualType = 'ab-cuped', onStateChange }) {
  const [useCuped, setUseCuped] = useState(true);

  const liveReadout = useCuped
    ? 'Con ajuste CUPED (usando el gasto pre-experimento como covariable), el error estándar cae un 45% ($0.48 → $0.27), el IC 95% [+$0.24, +$1.30] no cruza $0 y el efecto de +$0.77 USD resulta significativo (p = 0.004) en 2 semanas.'
    : 'Sin CUPED (varianza cruda), el error estándar es $0.48, el IC 95% [-$0.18, +$1.72] cruza $0 y el mismo efecto de +$0.77 USD queda inconcluso (p = 0.112), requiriendo 6 semanas de tráfico.';

  return (
    <SimulatorFrame
      kicker="Experimentación · Reducción de varianza con CUPED"
      title="Intervalo de confianza al 95%: estimador crudo frente a ajuste CUPED"
      instruction="Activa o desactiva CUPED sobre una muestra de 50,000 usuarios por rama (efecto real +$0.77 USD) para ver cómo cambia el error estándar y el p-valor."
      onReset={() => setUseCuped(true)}
      visualType={visualType}
      mode={useCuped ? 'cuped-on' : 'cuped-off'}
      metrics={{
        useCuped,
        liftUsd: 0.77,
        standardErrorUsd: useCuped ? 0.27 : 0.48,
        ciLowUsd: useCuped ? 0.24 : -0.18,
        ciHighUsd: useCuped ? 1.3 : 1.72,
        pValue: useCuped ? 0.004 : 0.112,
        weeksRequired: useCuped ? 2 : 6,
      }}
      liveReadout={liveReadout}
      readoutTone={useCuped ? 'ok' : 'bad'}
      onStateChange={onStateChange}
      controls={
        <SimSegmented
          ariaLabel="Ajuste CUPED"
          value={useCuped ? 'cuped' : 'raw'}
          onChange={(val) => setUseCuped(val === 'cuped')}
          options={[
            {
              value: 'raw',
              label: 'Sin CUPED (varianza cruda)',
              tone: 'bad',
            },
            {
              value: 'cuped',
              label: 'Con CUPED (covariable pre-experimento)',
              tone: 'ok',
            },
          ]}
        />
      }
    >
      <div className="sim-table-scroll">
        <table
          key={useCuped ? 'cuped-on' : 'cuped-off'}
          className="sim-table sim-table--stack tabular"
        >
          <thead>
            <tr>
              <th>Método estimador</th>
              <th className="num">Lift estimado</th>
              <th className="num">Error estándar (SE)</th>
              <th className="num">IC 95%</th>
              <th className="num">p-valor</th>
              <th>Decisión</th>
            </tr>
          </thead>
          <tbody>
            <tr className={!useCuped ? 'row-duplicated anim-row-stagger' : ''}>
              <td data-label="Estimador">Diferencia de medias cruda</td>
              <td data-label="Lift" className="num">+$0.77</td>
              <td data-label="Error estándar" className="num">$0.48</td>
              <td data-label="IC 95%" className="num">[-$0.18, +$1.72]</td>
              <td data-label="p-valor" className="num">0.112</td>
              <td data-label="Decisión">Inconcluso (cruza $0)</td>
            </tr>
            <tr className={useCuped ? 'row-optimal anim-row-stagger' : ''}>
              <td data-label="Estimador">Estimador ajustado CUPED</td>
              <td data-label="Lift" className="num">+$0.77</td>
              <td data-label="Error estándar" className="num">$0.27 (-45%)</td>
              <td data-label="IC 95%" className="num">[+$0.24, +$1.30]</td>
              <td data-label="p-valor" className="num">0.004</td>
              <td data-label="Decisión">Significativo (p &lt; 0.01)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="sim-comparison-card">
        <div className="sim-comparison-card__title">
          Amplitud de incertidumbre (IC 95%) y duración requerida del experimento
        </div>
        <div className="sim-comparison-bars">
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">
                Sin CUPED — amplitud IC: $1.90 USD (requiere 6 semanas)
              </span>
              <span className="sim-bar-value">SE = $0.48 · p = 0.112</span>
            </div>
            <div className="sim-bar-track">
              <div
                className="sim-bar-fill sim-bar-fill--danger"
                data-pct="100"
              />
            </div>
          </div>
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">
                Con CUPED — amplitud IC: $1.06 USD (resuelto en 2 semanas)
              </span>
              <span className="sim-bar-value">SE = $0.27 · p = 0.004</span>
            </div>
            <div className="sim-bar-track">
              <div
                className="sim-bar-fill sim-bar-fill--success"
                data-pct="55"
              />
            </div>
          </div>
        </div>
      </div>
    </SimulatorFrame>
  );
}

/* ==========================================================================
   11. TUFTE DATA-INK & BI DESIGN (tufte-data-ink / bi-anti-slop-comparator)
   ========================================================================== */
function BiAntiSlopComparator({
  visualType = 'tufte-data-ink',
  onStateChange,
}) {
  const [designMode, setDesignMode] = useState('tufte'); // 'slop' | 'tufte'

  const liveReadout =
    designMode === 'slop'
      ? 'En modo reporte saturado (22% de razón dato-tinta), el gráfico circular carece de referencia contra el presupuesto (Plan) y oculta que NORAM está un -9.3% por debajo de su meta.'
      : 'En modo alta densidad Tufte (92% de razón dato-tinta), el título declara la conclusión (+14.2% en LATAM y EMEA) y la tabla alinea ingreso real, meta y desviación para detectar al instante el -9.3% de NORAM.';

  return (
    <SimulatorFrame
      kicker="Diseño de tableros · Percepción visual y razón dato-tinta"
      title="Comparador visual: reporte saturado frente a diseño de alta densidad"
      instruction="Alterna entre un reporte con adorno visual y un diseño de alta densidad dato-tinta para comparar cómo se presenta el cierre regional de octubre."
      onReset={() => setDesignMode('tufte')}
      visualType={visualType}
      mode={designMode}
      metrics={{
        designMode,
        dataInkRatioPct: designMode === 'slop' ? 22 : 92,
        showsPlanComparison: designMode === 'tufte',
      }}
      liveReadout={liveReadout}
      readoutTone={designMode === 'slop' ? 'bad' : 'ok'}
      onStateChange={onStateChange}
      controls={
        <SimSegmented
          ariaLabel="Modo de diseño BI"
          value={designMode}
          onChange={setDesignMode}
          options={[
            {
              value: 'slop',
              label: 'Mal BI (ruido visual / baja señal)',
              tone: 'bad',
            },
            {
              value: 'tufte',
              label: 'Buen BI (alta densidad dato-tinta)',
              tone: 'ok',
            },
          ]}
        />
      }
    >
      <div className="sim-comparison-card">
        <div className="sim-comparison-card__title">
          Métrica de eficiencia visual del tablero
        </div>
        <div className="sim-comparison-bars">
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">
                Razón dato-tinta (señal informativa frente a adorno)
              </span>
              <span className="sim-bar-value">
                {designMode === 'slop'
                  ? '22% (saturado)'
                  : '92% (alta densidad Tufte)'}
              </span>
            </div>
            <div className="sim-bar-track">
              <div
                className={`sim-bar-fill ${
                  designMode === 'slop'
                    ? 'sim-bar-fill--danger'
                    : 'sim-bar-fill--success'
                }`}
                data-pct={designMode === 'slop' ? '22' : '92'}
              />
            </div>
          </div>
        </div>
      </div>

      {designMode === 'slop' ? (
        <div className="sim-panel">
          <div className="sim-panel__title">
            Defectos del reporte tradicional sin criterio visual
          </div>
          <ul className="sim-list">
            <li>
              Título pasivo sin hallazgo: <em>&quot;Gráfico circular de ventas&quot;</em>.
            </li>
            <li>
              Codifica 6 regiones mediante ángulos circulares (18%, 17%, 16%) difíciles
              de ordenar a simple vista.
            </li>
            <li>
              Omite la meta (Plan) y la variación mensual: quien lee no sabe si $390K en
              NORAM cumple o incumple el objetivo.
            </li>
          </ul>
        </div>
      ) : (
        <div className="sim-panel">
          <div className="sim-panel__title">
            Conclusión ejecutiva: LATAM y EMEA superaron el plan de octubre en +$130K
            (+12.7%), compensando a NORAM (-9.3%)
          </div>
          <div className="sim-table-scroll">
            <table className="sim-table sim-table--stack tabular">
              <thead>
                <tr>
                  <th>Región</th>
                  <th className="num">Ingreso real (Oct)</th>
                  <th className="num">Meta (Plan)</th>
                  <th>Cumplimiento visual</th>
                  <th className="num">vs. Plan</th>
                </tr>
              </thead>
              <tbody>
                <tr className="row-optimal anim-row-stagger">
                  <td data-label="Región">
                    <strong>LATAM</strong>
                  </td>
                  <td data-label="Real" className="num">$640,000</td>
                  <td data-label="Meta" className="num">$540,000</td>
                  <td data-label="Progreso">
                    <div className="sim-inline-bar">
                      <div
                        className="sim-bar-fill sim-bar-fill--success"
                        data-pct="100"
                      />
                    </div>
                  </td>
                  <td data-label="vs. Plan" className="num sim-text-success">
                    +18.5%
                  </td>
                </tr>
                <tr className="anim-row-stagger">
                  <td data-label="Región">
                    <strong>EMEA</strong>
                  </td>
                  <td data-label="Real" className="num">$510,000</td>
                  <td data-label="Meta" className="num">$480,000</td>
                  <td data-label="Progreso">
                    <div className="sim-inline-bar">
                      <div
                        className="sim-bar-fill sim-bar-fill--success"
                        data-pct="84"
                      />
                    </div>
                  </td>
                  <td data-label="vs. Plan" className="num sim-text-success">
                    +6.3%
                  </td>
                </tr>
                <tr className="row-duplicated anim-row-stagger">
                  <td data-label="Región">
                    <strong>NORAM</strong>
                  </td>
                  <td data-label="Real" className="num">$390,000</td>
                  <td data-label="Meta" className="num">$430,000</td>
                  <td data-label="Progreso">
                    <div className="sim-inline-bar">
                      <div
                        className="sim-bar-fill sim-bar-fill--danger"
                        data-pct="64"
                      />
                    </div>
                  </td>
                  <td data-label="vs. Plan" className="num sim-text-danger">
                    -9.3% (alerta)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </SimulatorFrame>
  );
}

/* ==========================================================================
   12. CDC LOG STREAM (cdc-log-stream)
   ========================================================================== */
function CdcLogStreamSim({ visualType = 'cdc-log-stream', onStateChange }) {
  const [captureMode, setCaptureMode] = useState('wal'); // 'polling' | 'wal'
  const [operation, setOperation] = useState('delete'); // 'insert' | 'update' | 'delete'

  const ops = {
    insert: {
      label: '1. INSERT (ORD-501 · $180)',
      lsn: '0/16B3748',
      opCode: 'c (create)',
      beforeVal: 'null',
      afterVal: '{ id: "ORD-501", total: 180 }',
      pollingResult: 'Capturado en el siguiente lote (latencia 15 min)',
      walResult: 'Evento emitido en 40 ms desde el WAL sin tocar tablas OLTP',
      ghostRows: 0,
    },
    update: {
      label: '2. UPDATE (ORD-500: $120 → $95)',
      lsn: '0/16B3910',
      opCode: 'u (update)',
      beforeVal: '{ id: "ORD-500", total: 120 }',
      afterVal: '{ id: "ORD-500", total: 95 }',
      pollingResult: 'Pierde estados intermedios si cambió 2 veces entre lotes',
      walResult: 'Conserva imagen previa (before: $120) y nueva (after: $95)',
      ghostRows: 0,
    },
    delete: {
      label: '3. DELETE físico (ORD-499 · $310)',
      lsn: '0/16B4022',
      opCode: 'd (delete)',
      beforeVal: '{ id: "ORD-499", total: 310 }',
      afterVal: 'null (tombstone)',
      pollingResult: 'INVISIBLE: la fila ya no existe en origen y queda fantasma en destino (+$310 falsos)',
      walResult: 'Emite evento op="d" con clave ORD-499 y marca _deleted=true en el Lakehouse',
      ghostRows: 1,
    },
  };

  const currentOp = ops[operation];
  const isBrokenDelete = captureMode === 'polling' && operation === 'delete';

  const liveReadout =
    captureMode === 'polling'
      ? isBrokenDelete
        ? 'Con Polling SQL (WHERE updated_at > last_run) ante un DELETE físico (ORD-499), la fila desaparece de PostgreSQL sin dejar rastro y permanece como fila fantasma en el almacén analítico (+$310 USD inflados).'
        : `Con Polling SQL ante ${currentOp.label}: el motor ejecuta escaneos repetidos sobre la base transaccional y ${currentOp.pollingResult.toLowerCase()}.`
      : `Con CDC por log WAL (Debezium + Kafka) en LSN ${currentOp.lsn} (${currentOp.opCode}): ${currentOp.walResult}.`;

  return (
    <SimulatorFrame
      kicker="Tiempo real · Captura de datos de cambio (CDC)"
      title="Captura CDC: polling SQL por updated_at frente a log transaccional WAL"
      instruction="Alterna el método de ingesta y selecciona una operación en la base OLTP (INSERT, UPDATE o DELETE físico) para ver qué llega a la réplica analítica."
      onReset={() => {
        setCaptureMode('wal');
        setOperation('delete');
      }}
      visualType={visualType}
      mode={`${captureMode}:${operation}`}
      metrics={{
        captureMode,
        operation,
        lsn: currentOp.lsn,
        ghostRowsInWarehouse: isBrokenDelete ? 1 : 0,
        oltpCpuOverheadPct: captureMode === 'polling' ? 38 : 2,
      }}
      liveReadout={liveReadout}
      readoutTone={captureMode === 'polling' ? 'bad' : 'ok'}
      onStateChange={onStateChange}
      controls={
        <>
          <SimSegmented
            ariaLabel="Método de captura"
            value={captureMode}
            onChange={setCaptureMode}
            options={[
              {
                value: 'polling',
                label: 'Polling SQL (WHERE updated_at > ...)',
                tone: 'bad',
              },
              {
                value: 'wal',
                label: 'CDC por log WAL (Debezium + Kafka)',
                tone: 'ok',
              },
            ]}
          />
          <SimSegmented
            ariaLabel="Operación en OLTP"
            value={operation}
            onChange={setOperation}
            options={Object.entries(ops).map(([key, item]) => ({
              value: key,
              label: item.label,
            }))}
          />
        </>
      }
    >
      <div className="sim-table-scroll">
        <table
          key={`${captureMode}-${operation}`}
          className="sim-table sim-table--stack tabular"
        >
          <thead>
            <tr>
              <th>LSN / Operación</th>
              <th>Payload en el log WAL</th>
              <th>Resultado con Polling SQL</th>
              <th>Resultado con Debezium WAL</th>
            </tr>
          </thead>
          <tbody>
            <tr
              className={`anim-row-stagger ${
                captureMode === 'polling' ? 'row-duplicated' : 'row-optimal'
              }`}
            >
              <td data-label="LSN / Op">
                <code>{currentOp.lsn}</code> · <strong>{currentOp.opCode}</strong>
              </td>
              <td data-label="Payload WAL">
                <code>before: {currentOp.beforeVal}</code> →{' '}
                <code>after: {currentOp.afterVal}</code>
              </td>
              <td data-label="Polling SQL">{currentOp.pollingResult}</td>
              <td data-label="Debezium WAL">{currentOp.walResult}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="sim-comparison-card">
        <div className="sim-comparison-card__title">
          Impacto en CPU de la base transaccional OLTP y fidelidad de réplica
        </div>
        <div className="sim-comparison-bars">
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">
                Polling por updated_at (consultas repetidas + pierde DELETEs físicos)
              </span>
              <span className="sim-bar-value">
                38% sobrecarga CPU OLTP · filas fantasma en DELETE
              </span>
            </div>
            <div className="sim-bar-track">
              <div
                className="sim-bar-fill sim-bar-fill--danger"
                data-pct="95"
              />
            </div>
          </div>
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">
                Lectura secuencial del log WAL con Debezium (captura c, u, d)
              </span>
              <span className="sim-bar-value">
                2% CPU OLTP · 100% fidelidad de eventos
              </span>
            </div>
            <div className="sim-bar-track">
              <div
                className="sim-bar-fill sim-bar-fill--success"
                data-pct="8"
              />
            </div>
          </div>
        </div>
      </div>
    </SimulatorFrame>
  );
}

/* ==========================================================================
   13. STREAMING WATERMARK (flink-watermark / streaming-watermark-lab)
   ========================================================================== */
function StreamingWatermarkLab({
  visualType = 'flink-watermark',
  onStateChange,
}) {
  const [clockType, setClockType] = useState('event'); // 'processing' | 'event'

  const liveReadout =
    clockType === 'event'
      ? 'Con Event Time + Watermark, el motor lee el timestamp original del suceso (11:59:40), espera el margen de tolerancia y adjudica las 45 compras rezagadas a la ventana 11:59 (245 ventas exactas, 0 desviación).'
      : 'Con Processing Time (hora de recepción), las 45 compras hechas a las 11:59 que llegan a las 12:02 se contabilizan tarde: la ventana 11:59 cae a 200 ventas (-45) y la de 12:02 se infla a 295 (+45).';

  return (
    <SimulatorFrame
      kicker="Tiempo real · Tiempo de evento y watermarks"
      title="Reloj en flujo continuo: tiempo de procesamiento frente a tiempo de evento"
      instruction="Alterna entre Processing Time y Event Time con Watermark para ver dónde se contabilizan 45 compras ocurridas en un túnel a las 11:59 que llegan por red a las 12:02."
      onReset={() => setClockType('event')}
      visualType={visualType}
      mode={clockType}
      metrics={{
        clockType,
        window1159Count: clockType === 'event' ? 245 : 200,
        window1202Count: clockType === 'event' ? 250 : 295,
        misallocatedEvents: clockType === 'event' ? 0 : 45,
      }}
      liveReadout={liveReadout}
      readoutTone={clockType === 'event' ? 'ok' : 'bad'}
      onStateChange={onStateChange}
      controls={
        <SimSegmented
          ariaLabel="Tipo de reloj de streaming"
          value={clockType}
          onChange={setClockType}
          options={[
            {
              value: 'processing',
              label: 'Processing Time (hora de llegada al servidor)',
              tone: 'bad',
            },
            {
              value: 'event',
              label: 'Event Time + Watermark (hora real del suceso)',
              tone: 'ok',
            },
          ]}
        />
      }
    >
      <div className="sim-table-scroll">
        <table key={clockType} className="sim-table sim-table--stack tabular">
          <thead>
            <tr>
              <th>Ventana horaria</th>
              <th className="num">Ventas reales</th>
              <th className="num">Contabilizadas</th>
              <th className="num">Desviación</th>
              <th>Diagnóstico operativo</th>
            </tr>
          </thead>
          <tbody>
            <tr
              className={`anim-row-stagger ${
                clockType === 'processing' ? 'row-duplicated' : 'row-optimal'
              }`}
            >
              <td data-label="Ventana">Ventana 11:59</td>
              <td data-label="Reales" className="num">245</td>
              <td data-label="Contabilizadas" className="num">
                {clockType === 'event' ? '245' : '200'}
              </td>
              <td data-label="Desviación" className="num">
                {clockType === 'event' ? '0' : '-45 (falso desplome)'}
              </td>
              <td data-label="Diagnóstico">
                {clockType === 'event'
                  ? 'Exacta tras Watermark'
                  : 'Subestimada por latencia móvil'}
              </td>
            </tr>
            <tr
              className={`anim-row-stagger ${
                clockType === 'processing' ? 'row-duplicated' : 'row-optimal'
              }`}
            >
              <td data-label="Ventana">Ventana 12:02</td>
              <td data-label="Reales" className="num">250</td>
              <td data-label="Contabilizadas" className="num">
                {clockType === 'event' ? '250' : '295'}
              </td>
              <td data-label="Desviación" className="num">
                {clockType === 'event' ? '0' : '+45 (falso pico)'}
              </td>
              <td data-label="Diagnóstico">
                {clockType === 'event'
                  ? 'Exacta'
                  : 'Inflada con eventos de las 11:59'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="sim-comparison-card">
        <div className="sim-comparison-card__title">
          Conteo en ventana 11:59 frente a ventana 12:02
        </div>
        <div className="sim-comparison-bars">
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">
                Ventana 11:59 (real: 245 ventas)
              </span>
              <span className="sim-bar-value">
                {clockType === 'event'
                  ? '245 ventas (100% exacto)'
                  : '200 ventas (-18.4%)'}
              </span>
            </div>
            <div className="sim-bar-track">
              <div
                className={`sim-bar-fill ${
                  clockType === 'event'
                    ? 'sim-bar-fill--success'
                    : 'sim-bar-fill--danger'
                }`}
                data-pct={clockType === 'event' ? '83' : '68'}
              />
            </div>
          </div>
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">
                Ventana 12:02 (real: 250 ventas)
              </span>
              <span className="sim-bar-value">
                {clockType === 'event'
                  ? '250 ventas (100% exacto)'
                  : '295 ventas (+18.0% inflado)'}
              </span>
            </div>
            <div className="sim-bar-track">
              <div
                className={`sim-bar-fill ${
                  clockType === 'event'
                    ? 'sim-bar-fill--stage'
                    : 'sim-bar-fill--danger'
                }`}
                data-pct={clockType === 'event' ? '85' : '100'}
              />
            </div>
          </div>
        </div>
      </div>
    </SimulatorFrame>
  );
}

/* ==========================================================================
   14. MCP & SEMANTIC LAYER FOR AI AGENTS (mcp-rag-flow / mcp-semantic-vs-raw-sql)
   ========================================================================== */
function McpSemanticVsRawSql({ visualType = 'mcp-rag-flow', onStateChange }) {
  const [arch, setArch] = useState('mcp'); // 'raw' | 'mcp'

  const liveReadout =
    arch === 'raw'
      ? 'Con Text-to-SQL directo sobre tablas crudas, el modelo une raw.users con raw.invoices sin filtrar facturas anuladas ni cuentas de prueba, provocando un fan-out que devuelve un NRR falso de 184.2% (+67.8 puntos de error).'
      : 'Con servidor MCP conectado a la capa semántica, el agente invoca query_governed_metrics(metric="nrr_pct", segment="Enterprise", period="Q3") y obtiene el valor oficial certificado de 116.4% con linaje verificable.';

  return (
    <SimulatorFrame
      kicker="IA y datos · Protocolo MCP y capa semántica"
      title="Consulta desde agentes: SQL directo frente a servidor MCP con capa semántica"
      instruction="Alterna la arquitectura del agente IA para comparar cómo responde a la pregunta «¿Cuál fue el ingreso recurrente neto (NRR) de Enterprise en Q3?»."
      onReset={() => setArch('mcp')}
      visualType={visualType}
      mode={arch}
      metrics={{
        arch,
        returnedNrrPct: arch === 'raw' ? 184.2 : 116.4,
        errorPts: arch === 'raw' ? 67.8 : 0,
        governed: arch === 'mcp',
      }}
      liveReadout={liveReadout}
      readoutTone={arch === 'raw' ? 'bad' : 'ok'}
      onStateChange={onStateChange}
      controls={
        <SimSegmented
          ariaLabel="Arquitectura del agente IA"
          value={arch}
          onChange={setArch}
          options={[
            {
              value: 'raw',
              label: 'LLM directo a tablas crudas (riesgo de alucinación)',
              tone: 'bad',
            },
            {
              value: 'mcp',
              label: 'Agente IA → Servidor MCP → Capa semántica',
              tone: 'ok',
            },
          ]}
        />
      }
    >
      <div className="sim-table-scroll">
        <table key={arch} className="sim-table sim-table--stack tabular">
          <thead>
            <tr>
              <th>Vía de ejecución</th>
              <th>Consulta ejecutada</th>
              <th className="num">NRR Q3 devuelto</th>
              <th>Auditoría y gobernanza</th>
            </tr>
          </thead>
          <tbody>
            <tr className={arch === 'raw' ? 'row-duplicated anim-row-stagger' : ''}>
              <td data-label="Vía">Text-to-SQL crudo</td>
              <td data-label="Consulta">
                <code>JOIN raw.users ON raw.invoices (sin filtro void)</code>
              </td>
              <td data-label="NRR Q3" className="num">184.2%</td>
              <td data-label="Auditoría">
                Error por fan-out y cuentas de prueba
              </td>
            </tr>
            <tr className={arch === 'mcp' ? 'row-optimal anim-row-stagger' : ''}>
              <td data-label="Vía">MCP + MetricFlow</td>
              <td data-label="Consulta">
                <code>
                  query_governed_metrics(metric=&quot;nrr_pct&quot;, period=&quot;Q3&quot;)
                </code>
              </td>
              <td data-label="NRR Q3" className="num">116.4%</td>
              <td data-label="Auditoría">
                Métrica oficial certificada por DE, DA y BI
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="sim-comparison-card">
        <div className="sim-comparison-card__title">
          Comparación de NRR reportado para Enterprise en Q3
        </div>
        <div className="sim-comparison-bars">
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">
                LLM sobre tablas crudas (fan-out no controlado)
              </span>
              <span className="sim-bar-value">184.2% (+67.8 pts de error)</span>
            </div>
            <div className="sim-bar-track">
              <div
                className="sim-bar-fill sim-bar-fill--danger"
                data-pct="100"
              />
            </div>
          </div>
          <div className="sim-bar-row">
            <div className="sim-bar-header">
              <span className="sim-bar-label">
                Servidor MCP + capa semántica (valor oficial gobernado)
              </span>
              <span className="sim-bar-value">116.4% (exacto)</span>
            </div>
            <div className="sim-bar-track">
              <div
                className="sim-bar-fill sim-bar-fill--success"
                data-pct="63"
              />
            </div>
          </div>
        </div>
      </div>
    </SimulatorFrame>
  );
}
