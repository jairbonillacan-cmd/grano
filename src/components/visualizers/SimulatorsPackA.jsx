import React, { useState } from 'react';
import {
  Clock,
  Database,
  Layers,
  Cpu,
  HardDrive,
  Zap,
  RefreshCw,
} from 'lucide-react';
import {
  SimulatorFrame,
  SimSegmented,
  handleInteractiveRowKeyDown,
} from './SimulatorFrame.jsx';

export function AsOfJoinTimelineSim({
  visualType = 'asof-timeline',
  onStateChange,
}) {
  const [joinMode, setJoinMode] = useState('asof'); // 'inner' | 'asof'
  const [selectedPurchaseIdx, setSelectedPurchaseIdx] = useState(1);

  const tierChanges = [
    {
      changeId: 'CHG-01',
      userId: 'U-409',
      changeTs: '09:00:00',
      tier: 'Basic',
      monthlyFeeUsd: 19,
    },
    {
      changeId: 'CHG-02',
      userId: 'U-409',
      changeTs: '10:15:00',
      tier: 'Pro',
      monthlyFeeUsd: 49,
    },
    {
      changeId: 'CHG-03',
      userId: 'U-409',
      changeTs: '11:30:00',
      tier: 'Enterprise',
      monthlyFeeUsd: 199,
    },
  ];

  const purchases = [
    {
      purchaseId: 'BUY-801',
      userId: 'U-409',
      purchaseTs: '09:42:00',
      amountUsd: 45.0,
      matchedChangeId: 'CHG-01',
      matchedTs: '09:00:00',
      matchedTier: 'Basic',
      lagMinutes: 42,
    },
    {
      purchaseId: 'BUY-802',
      userId: 'U-409',
      purchaseTs: '10:20:00',
      amountUsd: 120.0,
      matchedChangeId: 'CHG-02',
      matchedTs: '10:15:00',
      matchedTier: 'Pro',
      lagMinutes: 5,
    },
    {
      purchaseId: 'BUY-803',
      userId: 'U-409',
      purchaseTs: '11:45:00',
      amountUsd: 380.0,
      matchedChangeId: 'CHG-03',
      matchedTs: '11:30:00',
      matchedTier: 'Enterprise',
      lagMinutes: 15,
    },
  ];

  const activePurchase = purchases[selectedPurchaseIdx];

  const handleReset = () => {
    setJoinMode('asof');
    setSelectedPurchaseIdx(1);
  };

  const liveReadout =
    joinMode === 'inner'
      ? `Con INNER JOIN por igualdad de timestamp, la compra ${activePurchase.purchaseId} (${activePurchase.purchaseTs.slice(0, 5)}, $${activePurchase.amountUsd.toFixed(2)}) no coincide al segundo con ningún cambio de plan (09:00, 10:15, 11:30) y el cruce devuelve 0 filas ($0.00 de $545.00 atribuidos).`
      : `Con ASOF JOIN (>=), la compra ${activePurchase.purchaseId} a las ${activePurchase.purchaseTs.slice(0, 5)} ($${activePurchase.amountUsd.toFixed(2)}) busca hacia atrás ${activePurchase.lagMinutes} min y hereda el plan ${activePurchase.matchedTier} (${activePurchase.matchedChangeId} de las ${activePurchase.matchedTs.slice(0, 5)}), atribuyendo los $545.00 totales sin duplicar filas.`;

  return (
    <SimulatorFrame
      kicker="SQL analítico · Series temporales y ASOF JOIN"
      title="Cruce temporal: INNER JOIN exacto frente a ASOF JOIN"
      instruction="Alterna el tipo de JOIN y selecciona una compra en la línea de tiempo para inspeccionar qué estado de suscripción hereda."
      onReset={handleReset}
      visualType={visualType}
      mode={`${joinMode}:${activePurchase.purchaseId}`}
      metrics={{
        joinMode,
        selectedPurchaseId: activePurchase.purchaseId,
        purchaseTs: activePurchase.purchaseTs,
        amountUsd: activePurchase.amountUsd,
        matchedTier: joinMode === 'asof' ? activePurchase.matchedTier : null,
        matchedRevenueUsd: joinMode === 'asof' ? 545 : 0,
        matchedPurchasesCount: joinMode === 'asof' ? 3 : 0,
      }}
      liveReadout={liveReadout}
      readoutTone={joinMode === 'inner' ? 'bad' : 'ok'}
      onStateChange={onStateChange}
      controls={
        <>
          <SimSegmented
            ariaLabel="Tipo de JOIN temporal"
            value={joinMode}
            onChange={setJoinMode}
            options={[
              {
                value: 'inner',
                label: 'INNER JOIN exacto (0 coincidencias)',
                tone: 'bad',
              },
              {
                value: 'asof',
                label: 'ASOF JOIN (estado vigente)',
                tone: 'ok',
              },
            ]}
          />
          <SimSegmented
            ariaLabel="Inspeccionar compra"
            value={selectedPurchaseIdx}
            onChange={setSelectedPurchaseIdx}
            options={purchases.map((p, idx) => ({
              value: idx,
              label: `${p.purchaseId} · ${p.purchaseTs.slice(0, 5)} ($${p.amountUsd})`,
            }))}
          />
        </>
      }
    >
      <div className="sim-panel tabular">
        <div className="sim-panel__header">
          <div className="sim-panel__title">
            <Clock size={14} aria-hidden="true" /> Línea de tiempo de{' '}
            <code>U-409</code> (09:00 a 12:00) · Pista 1: cambios en{' '}
            <code>subscription_changes</code> · Pista 2: compras en{' '}
            <code>purchases</code>
          </div>
        </div>

        <div className="sim-three-col">
          {tierChanges.map((tc, idx) => {
            const p = purchases[idx];
            const isMatched =
              joinMode === 'asof' && activePurchase.matchedChangeId === tc.changeId;
            const isSelected = selectedPurchaseIdx === idx;
            const cardClass = [
              'sim-Timeline-card',
              'sim-Timeline-card--clickable',
              isSelected
                ? joinMode === 'asof'
                  ? 'sim-Timeline-card--matched'
                  : 'sim-Timeline-card--danger'
                : isMatched
                ? 'sim-Timeline-card--matched'
                : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <div
                key={p.purchaseId}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                data-sim-interactive="true"
                className={cardClass}
                onClick={() => setSelectedPurchaseIdx(idx)}
                onKeyDown={(e) =>
                  handleInteractiveRowKeyDown(
                    e,
                    () => setSelectedPurchaseIdx(idx),
                    idx,
                    purchases.length,
                    setSelectedPurchaseIdx
                  )
                }
              >
                <div className="sim-Timeline-card__head">
                  <span>
                    {tc.changeTs.slice(0, 5)} Plan {tc.tier} → Compra{' '}
                    {p.purchaseTs.slice(0, 5)}
                  </span>
                  <span>${p.amountUsd.toFixed(2)}</span>
                </div>
                <div className="sim-Timeline-card__meta">
                  {joinMode === 'asof' ? (
                    <>
                      <code>{p.purchaseId}</code> hereda{' '}
                      <strong>{p.matchedTier}</strong> (<code>{tc.changeId}</code>,{' '}
                      -{p.lagMinutes} min)
                    </>
                  ) : (
                    <span className="sim-text-danger">
                      {p.purchaseTs.slice(0, 5)} ≠ {tc.changeTs.slice(0, 5)} (sin cruce exacto)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="sim-two-col">
        <div className="sim-panel">
          <div className="sim-panel__title">
             Resultado SQL:{' '}
            {joinMode === 'inner'
              ? 'ON p.user_id = s.user_id AND p.purchase_ts = s.change_ts'
              : 'ASOF JOIN ... MATCH_CONDITION (p.purchase_ts >= s.change_ts)'}
          </div>
          <div className="sim-table-scroll">
            <table key={joinMode} className="sim-table sim-table--stack tabular">
              <thead>
                <tr>
                  <th>purchase_id</th>
                  <th>purchase_ts</th>
                  <th className="num">amount_usd</th>
                  <th>change_ts</th>
                  <th>tier_vigente</th>
                </tr>
              </thead>
              <tbody>
                {joinMode === 'inner' ? (
                  <tr className="row-duplicated anim-row-stagger">
                    <td colSpan={5} data-label="Resultado" className="sim-table-empty-cell">
                      0 filas devueltas: ningún timestamp de compra (09:42, 10:20, 11:45)
                      coincide al segundo con un cambio de plan (09:00, 10:15, 11:30).
                    </td>
                  </tr>
                ) : (
                  purchases.map((p, idx) => {
                    const isSelected = selectedPurchaseIdx === idx;
                    return (
                      <tr
                        key={`${p.purchaseId}-${isSelected ? 'sel' : 'idle'}`}
                        tabIndex={0}
                        aria-selected={isSelected}
                        data-sim-interactive="true"
                        className={`row-clickable anim-row-stagger ${
                          isSelected ? 'row-selected' : 'row-optimal'
                        }`}
                        onClick={() => setSelectedPurchaseIdx(idx)}
                        onKeyDown={(e) =>
                          handleInteractiveRowKeyDown(
                            e,
                            () => setSelectedPurchaseIdx(idx),
                            idx,
                            purchases.length,
                            setSelectedPurchaseIdx
                          )
                        }
                      >
                        <td data-label="Compra">{p.purchaseId}</td>
                        <td data-label="Hora compra">{p.purchaseTs.slice(0, 5)}</td>
                        <td data-label="Importe" className="num">
                          ${p.amountUsd.toFixed(2)}
                        </td>
                        <td data-label="Hora plan">{p.matchedTs.slice(0, 5)}</td>
                        <td data-label="Plan heredado">
                          <strong>{p.matchedTier}</strong>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="sim-comparison-card">
          <div className="sim-comparison-card__title">
            Cobertura de compras emparejadas ($545.00 USD reales)
          </div>
          <div className="sim-comparison-bars">
            <div className="sim-bar-row">
              <div className="sim-bar-header">
                <span className="sim-bar-label">
                  INNER JOIN por igualdad de timestamp
                </span>
                <span className="sim-bar-value">$0.00 (0 de 3 compras)</span>
              </div>
              <div className="sim-bar-track">
                <div
                  className="sim-bar-fill sim-bar-fill--danger"
                  data-pct="4"
                />
              </div>
            </div>
            <div className="sim-bar-row">
              <div className="sim-bar-header">
                <span className="sim-bar-label">
                  ASOF JOIN (p.purchase_ts &gt;= s.change_ts)
                </span>
                <span className="sim-bar-value">$545.00 (3 de 3 · O(N + M))</span>
              </div>
              <div className="sim-bar-track">
                <div
                  className="sim-bar-fill sim-bar-fill--success"
                  data-pct="100"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SimulatorFrame>
  );
}

export function StarVsObtSim({
  visualType = 'star-vs-obt',
  onStateChange,
}) {
  const [archMode, setArchMode] = useState('star'); // 'star' | 'obt'
  const [workload, setWorkload] = useState('update'); // 'update' | 'scan'

  const metrics = {
    star: {
      update: {
        storageGb: '4.2 GB (hechos + dimensiones)',
        updateCost: '1 fila en dim_customer (18 ms)',
        querySpeed: '1.15 s (Hash Join en lectura)',
        filesRewritten: 1,
        status: 'ok',
        summary:
          'En Esquema Estrella con carga de mutación: actualizar el segmento de U-101 solo modifica 1 fila en dim_customer_scd2 (18 ms, 0 archivos de hechos tocados) y mantiene 4.2 GB en disco.',
      },
      scan: {
        storageGb: '4.2 GB (sin redundancia de texto)',
        updateCost: 'Mantenimiento aislado (18 ms)',
        querySpeed: '1.15 s (escaneo + Hash Join)',
        filesRewritten: 0,
        status: 'ok',
        summary:
          'En Esquema Estrella con escaneo BI de 10M de pedidos: el motor lee customer_sk y amount_usd desde fct_orders y ejecuta un Hash Join en memoria contra dim_customer_scd2 en 1.15 s.',
      },
    },
    obt: {
      update: {
        storageGb: '6.8 GB (columnas desnormalizadas)',
        updateCost: '14,200 filas en 85 Parquet (9.4 s)',
        querySpeed: '0.42 s (0 joins en lectura)',
        filesRewritten: 85,
        status: 'bad',
        summary:
          'En One Big Table (OBT) con carga de mutación: como customer_segment está copiado en cada pedido, actualizar a U-101 obliga a reescribir 14,200 filas repartidas en 85 archivos Parquet (9,400 ms).',
      },
      scan: {
        storageGb: '6.8 GB (compresión por diccionario)',
        updateCost: 'Reescritura pesada en mutaciones',
        querySpeed: '0.42 s (barrido columnar sin JOIN)',
        filesRewritten: 0,
        status: 'ok',
        summary:
          'En One Big Table (OBT) con escaneo BI de 10M de pedidos: el motor lee directamente customer_segment y amount_usd en un solo barrido columnar sin JOINs, completando la consulta en 0.42 s (2.7x más rápido).',
      },
    },
  };

  const currentMetric = metrics[archMode][workload];

  const handleReset = () => {
    setArchMode('star');
    setWorkload('update');
  };

  return (
    <SimulatorFrame
      kicker="Modelado dimensional · Estrella frente a OBT"
      title="Esquema en estrella (Kimball) frente a One Big Table (OBT)"
      instruction="Alterna la arquitectura física y el tipo de carga para comparar el costo de actualizar 1 cliente frente a escanear 10M de pedidos."
      onReset={handleReset}
      visualType={visualType}
      mode={`${archMode}:${workload}`}
      metrics={{
        archMode,
        workload,
        storageGb: archMode === 'star' ? 4.2 : 6.8,
        updateMs: archMode === 'star' ? 18 : 9400,
        scanSeconds: archMode === 'star' ? 1.15 : 0.42,
        filesRewritten: currentMetric.filesRewritten,
      }}
      liveReadout={currentMetric.summary}
      readoutTone={currentMetric.status}
      onStateChange={onStateChange}
      controls={
        <>
          <SimSegmented
            ariaLabel="Arquitectura de tabla"
            value={archMode}
            onChange={setArchMode}
            options={[
              { value: 'star', label: 'Esquema Estrella (Kimball)' },
              {
                value: 'obt',
                label: 'One Big Table (obt_orders_wide)',
                tone: workload === 'update' ? 'bad' : 'ok',
              },
            ]}
          />
          <SimSegmented
            ariaLabel="Carga de trabajo"
            value={workload}
            onChange={setWorkload}
            options={[
              {
                value: 'update',
                label: '1. Actualizar 1 cliente (U-101)',
                icon: <RefreshCw size={12} />,
                tone: archMode === 'obt' ? 'bad' : 'ok',
              },
              {
                value: 'scan',
                label: '2. Escanear 10M filas en BI',
                icon: <Zap size={12} />,
                tone: 'ok',
              },
            ]}
          />
        </>
      }
    >
      <div className="sim-three-col tabular">
        <div className="sim-metric-box">
          <div className="sim-metric-title">
            <HardDrive size={13} aria-hidden="true" /> Almacenamiento (10M filas)
          </div>
          <div className="sim-metric-nums">
            <strong>{currentMetric.storageGb}</strong>
          </div>
        </div>
        <div
          className={`sim-metric-box ${
            workload === 'update' && archMode === 'obt' ? 'box-danger' : 'box-ok'
          }`}
        >
          <div className="sim-metric-title">
            <Database size={13} aria-hidden="true" /> Costo de mutación (U-101)
          </div>
          <div className="sim-metric-nums">
            <strong>{currentMetric.updateCost}</strong>
          </div>
        </div>
        <div className="sim-metric-box box-ok">
          <div className="sim-metric-title">
            <Layers size={13} aria-hidden="true" /> Latencia de lectura (10M)
          </div>
          <div className="sim-metric-nums">
            <strong>{currentMetric.querySpeed}</strong>
          </div>
        </div>
      </div>

      <div className="sim-two-col">
        <div className="sim-panel">
          <div className="sim-panel__title">
            {archMode === 'star'
              ? 'fct_orders (10M filas · llaves enteras) + dim_customer_scd2 (50k)'
              : 'obt_orders_wide (10M filas · atributos desnormalizados repetidos)'}
          </div>
          <div className="sim-table-scroll">
            {archMode === 'star' ? (
              <table key={`star-${workload}`} className="sim-table sim-table--stack tabular">
                <thead>
                  <tr>
                    <th>order_id</th>
                    <th className="num">customer_sk</th>
                    <th>dim_customer (join)</th>
                    <th className="num">amount_usd</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="row-optimal anim-row-stagger">
                    <td data-label="Pedido">ORD-9001</td>
                    <td data-label="Clave SK" className="num">
                      <code>4012</code>
                    </td>
                    <td data-label="Dimensión">
                      {workload === 'update'
                        ? 'U-101 → Enterprise (1 fila tocada)'
                        : 'U-101 · Enterprise'}
                    </td>
                    <td data-label="Importe" className="num">$1,250.00</td>
                  </tr>
                  <tr className="row-optimal anim-row-stagger">
                    <td data-label="Pedido">ORD-9002</td>
                    <td data-label="Clave SK" className="num">
                      <code>4012</code>
                    </td>
                    <td data-label="Dimensión">U-101 · Enterprise</td>
                    <td data-label="Importe" className="num">$890.00</td>
                  </tr>
                  <tr className="anim-row-stagger">
                    <td data-label="Pedido">ORD-9003</td>
                    <td data-label="Clave SK" className="num">
                      <code>7105</code>
                    </td>
                    <td data-label="Dimensión">U-204 · Mid-Market</td>
                    <td data-label="Importe" className="num">$340.00</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <table key={`obt-${workload}`} className="sim-table sim-table--stack tabular">
                <thead>
                  <tr>
                    <th>order_id</th>
                    <th>customer_id</th>
                    <th>customer_segment</th>
                    <th className="num">amount_usd</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    className={`anim-row-stagger ${
                      workload === 'update' ? 'row-duplicated' : 'row-optimal'
                    }`}
                  >
                    <td data-label="Pedido">ORD-9001</td>
                    <td data-label="Cliente">U-101</td>
                    <td data-label="Segmento">
                      {workload === 'update'
                        ? 'Enterprise (reescrito en disco)'
                        : 'Enterprise'}
                    </td>
                    <td data-label="Importe" className="num">$1,250.00</td>
                  </tr>
                  <tr
                    className={`anim-row-stagger ${
                      workload === 'update' ? 'row-duplicated' : 'row-optimal'
                    }`}
                  >
                    <td data-label="Pedido">ORD-9002</td>
                    <td data-label="Cliente">U-101</td>
                    <td data-label="Segmento">
                      {workload === 'update'
                        ? 'Enterprise (reescrito en disco)'
                        : 'Enterprise'}
                    </td>
                    <td data-label="Importe" className="num">$890.00</td>
                  </tr>
                  <tr className="row-optimal anim-row-stagger">
                    <td data-label="Pedido">ORD-9003</td>
                    <td data-label="Cliente">U-204</td>
                    <td data-label="Segmento">Mid-Market</td>
                    <td data-label="Importe" className="num">$340.00</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="sim-comparison-card">
          <div className="sim-comparison-card__title">
            Comparación cuantitativa:{' '}
            {workload === 'update'
              ? 'Mutación de 1 cliente'
              : 'Escaneo BI de 10M de filas'}
          </div>
          <div className="sim-comparison-bars">
            {workload === 'update' ? (
              <>
                <div className="sim-bar-row">
                  <div className="sim-bar-header">
                    <span className="sim-bar-label">
                      Estrella — Mutación aislada en dim_customer_scd2
                    </span>
                    <span className="sim-bar-value">18 ms (1 archivo)</span>
                  </div>
                  <div className="sim-bar-track">
                    <div
                      className="sim-bar-fill sim-bar-fill--success"
                      data-pct="5"
                    />
                  </div>
                </div>
                <div className="sim-bar-row">
                  <div className="sim-bar-header">
                    <span className="sim-bar-label">
                      OBT — Reescritura de pedidos históricos en Parquet
                    </span>
                    <span className="sim-bar-value">9,400 ms (85 archivos)</span>
                  </div>
                  <div className="sim-bar-track">
                    <div
                      className="sim-bar-fill sim-bar-fill--danger"
                      data-pct="100"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="sim-bar-row">
                  <div className="sim-bar-header">
                    <span className="sim-bar-label">
                      Estrella — Escaneo de hechos + Hash Join en RAM
                    </span>
                    <span className="sim-bar-value">1.15 s (4.2 GB)</span>
                  </div>
                  <div className="sim-bar-track">
                    <div
                      className="sim-bar-fill sim-bar-fill--stage"
                      data-pct="72"
                    />
                  </div>
                </div>
                <div className="sim-bar-row">
                  <div className="sim-bar-header">
                    <span className="sim-bar-label">
                      OBT — Barrido columnar secuencial sin JOIN
                    </span>
                    <span className="sim-bar-value">0.42 s (2.7x más rápido)</span>
                  </div>
                  <div className="sim-bar-track">
                    <div
                      className="sim-bar-fill sim-bar-fill--success"
                      data-pct="28"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          <p className="sim-subnote">
            Regla práctica: modela Silver en Estrella para gobernar cambios y materializa
            OBT en Gold solo cuando el motor de consulta requiera latencia mínima sin
            JOINs.
          </p>
        </div>
      </div>
    </SimulatorFrame>
  );
}

export function ArrowZeroCopySim({
  visualType = 'arrow-zero-copy',
  onStateChange,
}) {
  const [transportMode, setTransportMode] = useState('arrow'); // 'copy' | 'arrow'
  const [activeHop, setActiveHop] = useState(0);

  const pipelines = {
    copy: {
      title: 'Serialización y copia en cada salto (75% de CPU en serde)',
      totalLatencyMs: 3420,
      cpuCopyPct: '75% CPU en copia',
      memoryCopies: '4 copias en RAM',
      peakRamGb: '4.8 GB pico',
      steps: [
        {
          stepNum: 1,
          stage: 'Postgres (filas en heap)',
          format: 'Tuplas por filas en protocolo libpq',
          cpuPct: '18% CPU',
          ramAllocated: '1.2 GB',
          action:
            'Copia #1: serializa cada fila y convierte números y fechas a flujo de bytes de red.',
        },
        {
          stepNum: 2,
          stage: 'Archivo intermedio CSV / Pickle',
          format: 'Texto UTF-8 o grafo de objetos Python',
          cpuPct: '24% CPU',
          ramAllocated: '2.3 GB',
          action:
            'Copia #2: escribe y parsea texto línea por línea o reconstruye punteros PyObject.',
        },
        {
          stepNum: 3,
          stage: 'DataFrame clásico en memoria',
          format: 'Arrays fragmentados en heap de Python',
          cpuPct: '19% CPU',
          ramAllocated: '3.7 GB',
          action:
            'Copia #3: duplica buffers al filtrar o transformar columnas antes de exportar.',
        },
        {
          stepNum: 4,
          stage: 'Serialización JSON hacia BI',
          format: 'Claves repetidas en texto JSON',
          cpuPct: '14% CPU',
          ramAllocated: '4.8 GB',
          action:
            'Copia #4: vuelve a convertir tensores numéricos a texto JSON y los parsea en el cliente.',
        },
      ],
    },
    arrow: {
      title: 'Apache Arrow IPC Zero-Copy (0 copias entre DuckDB, Polars y Wasm)',
      totalLatencyMs: 185,
      cpuCopyPct: '0% CPU en copia',
      memoryCopies: '0 copias (puntero)',
      peakRamGb: '1.1 GB única',
      steps: [
        {
          stepNum: 1,
          stage: 'Parquet a buffer Apache Arrow',
          format: 'Columnas contiguas SIMD en 0x7F8A0040',
          cpuPct: '4% CPU (SIMD)',
          ramAllocated: '1.1 GB',
          action:
            'Carga única: decodifica las páginas columnares directamente al formato en memoria de Apache Arrow.',
        },
        {
          stepNum: 2,
          stage: 'Motor SQL DuckDB',
          format: 'Lee el mismo RecordBatch en 0x7F8A0040',
          cpuPct: '0% CPU copia',
          ramAllocated: '1.1 GB (compartida)',
          action:
            'Zero-Copy: DuckDB apunta sus vectores de ejecución directamente a la dirección de memoria de Arrow.',
        },
        {
          stepNum: 3,
          stage: 'Motor DataFrame Polars (DA)',
          format: 'Intercambio por Arrow C Data Interface',
          cpuPct: '0% CPU copia',
          ramAllocated: '1.1 GB (compartida)',
          action:
            'Zero-Copy: Polars recibe únicamente el puntero de 64 bits al buffer columnar sin clonar un solo byte.',
        },
        {
          stepNum: 4,
          stage: 'Navegador BI con DuckDB-Wasm',
          format: 'Stream Arrow IPC a memoria lineal Wasm',
          cpuPct: '2% CPU (proyección)',
          ramAllocated: '1.1 GB (vista)',
          action:
            'Zero-Copy: el cliente BI mapea el buffer Arrow IPC en WebAssembly y renderiza sin parsear JSON.',
        },
      ],
    },
  };

  const currentPipe = pipelines[transportMode];
  const currentStep = currentPipe.steps[activeHop];

  const handleReset = () => {
    setTransportMode('arrow');
    setActiveHop(0);
  };

  const liveReadout = `En modo ${
    transportMode === 'arrow' ? 'Apache Arrow Zero-Copy' : 'serialización clásica'
  } · Etapa #${currentStep.stepNum} (${currentStep.stage}): ${currentStep.action} Latencia total: ${
    currentPipe.totalLatencyMs
  } ms y memoria pico: ${currentPipe.peakRamGb}.`;

  return (
    <SimulatorFrame
      kicker="Formatos y motores · Memoria columnar Apache Arrow"
      title="Serialización clásica frente a Apache Arrow IPC Zero-Copy"
      instruction="Alterna el modo de transporte en memoria y selecciona cada etapa del pipeline para inspeccionar copias en RAM y gasto de CPU."
      onReset={handleReset}
      visualType={visualType}
      mode={`${transportMode}:hop-${currentStep.stepNum}`}
      metrics={{
        transportMode,
        hop: currentStep.stepNum,
        stage: currentStep.stage,
        totalLatencyMs: currentPipe.totalLatencyMs,
        peakRamGb: transportMode === 'arrow' ? 1.1 : 4.8,
        memoryCopies: transportMode === 'arrow' ? 0 : 4,
      }}
      liveReadout={liveReadout}
      readoutTone={transportMode === 'copy' ? 'bad' : 'ok'}
      onStateChange={onStateChange}
      controls={
        <>
          <SimSegmented
            ariaLabel="Modo de transporte en memoria"
            value={transportMode}
            onChange={setTransportMode}
            options={[
              {
                value: 'copy',
                label: 'Serialización clásica (4 copias · 75% CPU)',
                tone: 'bad',
              },
              {
                value: 'arrow',
                label: 'Apache Arrow IPC Zero-Copy (0 copias)',
                tone: 'ok',
              },
            ]}
          />
          <SimSegmented
            ariaLabel="Etapa del pipeline"
            value={activeHop}
            onChange={setActiveHop}
            options={currentPipe.steps.map((s, idx) => ({
              value: idx,
              label: `Etapa ${s.stepNum}`,
              tone: transportMode === 'copy' ? 'bad' : 'default',
            }))}
          />
          <div className="sim-metrics-strip tabular">
            <span className={`sim-metric ${transportMode === 'copy' ? 'sim-metric--bad' : 'sim-metric--ok'}`}>
              <span className="sim-metric__label">CPU:</span>
              <span className="sim-metric__value">{currentPipe.cpuCopyPct}</span>
            </span>
            <span className={`sim-metric ${transportMode === 'copy' ? 'sim-metric--bad' : 'sim-metric--ok'}`}>
              <span className="sim-metric__label">Copias:</span>
              <span className="sim-metric__value">{currentPipe.memoryCopies}</span>
            </span>
            <span className="sim-metric">
              <span className="sim-metric__label">RAM pico:</span>
              <span className="sim-metric__value">{currentPipe.peakRamGb}</span>
            </span>
            <span className="sim-metric">
              <span className="sim-metric__label">Latencia:</span>
              <span className="sim-metric__value">{currentPipe.totalLatencyMs} ms</span>
            </span>
          </div>
        </>
      }
    >
      <div className="sim-two-col">
        <div className="sim-panel">
          <div className="sim-panel__title">{currentPipe.title}</div>
          <div className="sim-table-scroll">
            <table key={transportMode} className="sim-table sim-table--stack tabular">
              <thead>
                <tr>
                  <th>Etapa</th>
                  <th>Componente / Motor</th>
                  <th className="num">CPU Serde</th>
                  <th className="num">RAM acumulada</th>
                </tr>
              </thead>
              <tbody>
                {currentPipe.steps.map((s, idx) => {
                  const isSelected = activeHop === idx;
                  const rowClass = [
                    'row-clickable',
                    'anim-row-stagger',
                    isSelected
                      ? transportMode === 'copy'
                        ? 'row-duplicated'
                        : 'row-selected'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <tr
                      key={`${s.stepNum}-${isSelected ? 'sel' : 'idle'}`}
                      tabIndex={0}
                      aria-selected={isSelected}
                      data-sim-interactive="true"
                      className={rowClass}
                      onClick={() => setActiveHop(idx)}
                      onKeyDown={(e) =>
                        handleInteractiveRowKeyDown(
                          e,
                          () => setActiveHop(idx),
                          idx,
                          currentPipe.steps.length,
                          setActiveHop
                        )
                      }
                    >
                      <td data-label="Etapa">#{s.stepNum}</td>
                      <td data-label="Motor">{s.stage}</td>
                      <td data-label="CPU Serde" className="num">{s.cpuPct}</td>
                      <td data-label="RAM" className="num">{s.ramAllocated}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="sim-comparison-card">
          <div className="sim-comparison-card__title">
            Latencia y memoria en etapa #{currentStep.stepNum}: {currentStep.stage}
          </div>
          <div className="sim-comparison-bars">
            <div className="sim-bar-row">
              <div className="sim-bar-header">
                <span className="sim-bar-label">
                  Serialización clásica (4 copias · 4.8 GB RAM)
                </span>
                <span className="sim-bar-value">3,420 ms (75% CPU)</span>
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
                  Apache Arrow IPC Zero-Copy (0 copias · 1.1 GB)
                </span>
                <span className="sim-bar-value">185 ms (18.4x más rápido)</span>
              </div>
              <div className="sim-bar-track">
                <div
                  className="sim-bar-fill sim-bar-fill--success"
                  data-pct="6"
                />
              </div>
            </div>
          </div>
          <div className="block-strip tabular">
            <div
              className={`disk-block ${
                transportMode === 'copy' ? 'scanned-bad' : 'scanned-good'
              }`}
            >
              <strong>Formato en etapa #{currentStep.stepNum}:</strong> {currentStep.format}
            </div>
          </div>
        </div>
      </div>
    </SimulatorFrame>
  );
}

export default {
  AsOfJoinTimelineSim,
  StarVsObtSim,
  ArrowZeroCopySim,
};
