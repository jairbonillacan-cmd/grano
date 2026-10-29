import React, { useState } from 'react';
import {
  Clock,
  Database,
  Layers,
  Cpu,
  HardDrive,
  Zap,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../ui/index.js';

export function AsOfJoinTimelineSim() {
  const [joinMode, setJoinMode] = useState('asof'); // 'inner' | 'asof'
  const [selectedPurchaseIdx, setSelectedPurchaseIdx] = useState(1);

  const tierChanges = [
    {
      changeId: 'CHG-01',
      userId: 'U-409',
      changeTs: '09:00:00',
      minutesFromNine: 0,
      tier: 'Basic',
      monthlyFeeUsd: 19,
      discountPct: 0,
    },
    {
      changeId: 'CHG-02',
      userId: 'U-409',
      changeTs: '10:15:00',
      minutesFromNine: 75,
      tier: 'Pro',
      monthlyFeeUsd: 49,
      discountPct: 10,
    },
    {
      changeId: 'CHG-03',
      userId: 'U-409',
      changeTs: '11:30:00',
      minutesFromNine: 150,
      tier: 'Enterprise',
      monthlyFeeUsd: 199,
      discountPct: 25,
    },
  ];

  const purchases = [
    {
      purchaseId: 'BUY-801',
      userId: 'U-409',
      purchaseTs: '09:42:00',
      minutesFromNine: 42,
      amountUsd: 45.0,
      matchedChangeId: 'CHG-01',
      matchedTs: '09:00:00',
      matchedTier: 'Basic',
      lagMinutes: 42,
      stepExplanation:
        'La compra ocurre a las 09:42. ASOF JOIN busca hacia atrás el último cambio de plan con timestamp menor o igual a 09:42 y encuentra Basic (09:00, hace 42 min). Con INNER JOIN exacto, 09:42:00 no coincide con 09:00:00 y la transacción desaparece.',
    },
    {
      purchaseId: 'BUY-802',
      userId: 'U-409',
      purchaseTs: '10:20:00',
      minutesFromNine: 80,
      amountUsd: 120.0,
      matchedChangeId: 'CHG-02',
      matchedTs: '10:15:00',
      matchedTier: 'Pro',
      lagMinutes: 5,
      stepExplanation:
        'A las 10:15 el usuario subió a Pro. Cinco minutos después (10:20) compra $120.00. ASOF JOIN descarta Basic (09:00) por existir un estado más reciente (10:15) y descarta Enterprise (11:30) porque aún no había ocurrido.',
    },
    {
      purchaseId: 'BUY-803',
      userId: 'U-409',
      purchaseTs: '11:45:00',
      minutesFromNine: 165,
      amountUsd: 380.0,
      matchedChangeId: 'CHG-03',
      matchedTs: '11:30:00',
      matchedTier: 'Enterprise',
      lagMinutes: 15,
      stepExplanation:
        'A las 11:30 el cliente pasa a Enterprise. La compra de las 11:45 ($380.00) hereda el estado Enterprise vigente desde hace 15 minutos, atribuyendo el ingreso al nivel de suscripción correcto sin duplicar filas.',
    },
  ];

  const activePurchase = purchases[selectedPurchaseIdx];

  const handleReset = () => {
    setJoinMode('asof');
    setSelectedPurchaseIdx(1);
  };

  return (
    <div className="sim-frame viz-card" data-stage="1">
      <div className="sim-frame__header">
        <div className="sim-frame__title-group">
          <span className="sim-frame__stage-icon" aria-hidden="true">
            <Database size={18} />
          </span>
          <div className="sim-frame__headings">
            <div className="sim-frame__kicker">Etapa 1 · Series Temporales y ASOF JOIN</div>
            <h3 className="sim-frame__title">
              Simulador temporal: INNER JOIN exacto frente a ASOF JOIN
            </h3>
            <p className="sim-frame__desc">
              Los eventos de compra y los cambios de suscripción ocurren en milisegundos distintos.
              Alterna el motor de cruce y selecciona cada compra para inspeccionar cómo se resuelve
              el estado vigente.
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={RotateCcw}
          className="sim-reset-btn"
          onClick={handleReset}
          ariaLabel="Reiniciar simulador"
        >
          Reiniciar
        </Button>
      </div>

      <div className="sim-frame__controls">
        <div className="sim-segmented" role="group" aria-label="Tipo de JOIN temporal">
          <button
            type="button"
            className={`sim-segmented__btn ${
              joinMode === 'inner' ? 'sim-segmented__btn--active-danger' : ''
            }`}
            onClick={() => setJoinMode('inner')}
          >
            INNER JOIN exacto (0 coincidencias)
          </button>
          <button
            type="button"
            className={`sim-segmented__btn ${
              joinMode === 'asof' ? 'sim-segmented__btn--active' : ''
            }`}
            onClick={() => setJoinMode('asof')}
          >
            ASOF JOIN (estado vigente en ese instante)
          </button>
        </div>

        <div className="sim-segmented" role="group" aria-label="Inspeccionar compra">
          {purchases.map((p, idx) => (
            <button
              key={p.purchaseId}
              type="button"
              className={`sim-segmented__btn ${
                selectedPurchaseIdx === idx ? 'sim-segmented__btn--active' : ''
              }`}
              onClick={() => setSelectedPurchaseIdx(idx)}
            >
              Inspeccionar {p.purchaseTs.slice(0, 5)} (${p.amountUsd})
            </button>
          ))}
        </div>
      </div>

      <div className="sim-frame__body">
        <div className="sim-panel tabular">
          <div className="sim-panel__header">
            <div className="sim-panel__title">
              <Clock size={15} /> Línea de tiempo continua del usuario <code>U-409</code> (09:00 a
              12:00)
            </div>
          </div>

          <div className="sim-track-section">
            <div className="sim-track-label">
              Pista 1: Cambios de nivel en <code>subscription_changes</code> (estado vigente hacia
              adelante)
            </div>
            <div className="sim-three-col">
              {tierChanges.map((tc) => {
                const isMatched =
                  joinMode === 'asof' && activePurchase.matchedChangeId === tc.changeId;
                return (
                  <div
                    key={tc.changeId}
                    className={`sim-Timeline-card ${
                      isMatched ? 'sim-Timeline-card--matched' : ''
                    }`}
                  >
                    <div className="sim-Timeline-card__head">
                      <span>
                        {tc.changeTs.slice(0, 5)} · {tc.tier}
                      </span>
                      <span>${tc.monthlyFeeUsd}/mes</span>
                    </div>
                    <div className="sim-Timeline-card__meta">
                      ID: <code>{tc.changeId}</code> · Vigente desde las {tc.changeTs.slice(0, 5)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="sim-track-section">
            <div className="sim-track-label">
              Pista 2: Eventos puntuales en <code>purchases</code> (haz clic en una compra para ver
              el cruce)
            </div>
            <div className="sim-three-col">
              {purchases.map((p, idx) => {
                const isSelected = selectedPurchaseIdx === idx;
                const cardClass = [
                  'sim-Timeline-card',
                  'sim-Timeline-card--clickable',
                  isSelected
                    ? joinMode === 'asof'
                      ? 'sim-Timeline-card--matched'
                      : 'sim-Timeline-card--danger'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <div
                    key={p.purchaseId}
                    className={cardClass}
                    onClick={() => setSelectedPurchaseIdx(idx)}
                  >
                    <div className="sim-Timeline-card__head">
                      <span>Compra {p.purchaseTs.slice(0, 5)}</span>
                      <span>${p.amountUsd.toFixed(2)}</span>
                    </div>
                    <div className="sim-Timeline-card__meta">
                      {joinMode === 'asof' ? (
                        <>
                          Empareja con <strong>{p.matchedTier}</strong> ({p.matchedTs.slice(0, 5)},
                          -{p.lagMinutes} min)
                        </>
                      ) : (
                        <span className="sim-text-danger">
                          Sin coincidencia exacta en {p.purchaseTs}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="sim-two-col">
          <div className="sim-panel">
            <div className="sim-panel__title">
              Tablas origen: 3 cambios de estado y 3 compras ($545.00 totales)
            </div>
            <div className="sim-table-scroll">
              <table className="sim-table tabular">
                <thead>
                  <tr>
                    <th>Tabla</th>
                    <th>Evento</th>
                    <th>Timestamp</th>
                    <th className="num">Atributo / Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {tierChanges.map((tc) => {
                    const isMatched =
                      joinMode === 'asof' && activePurchase.matchedChangeId === tc.changeId;
                    return (
                      <tr
                        key={`${tc.changeId}-${isMatched ? 'match' : 'idle'}`}
                        className={isMatched ? 'row-optimal row-flash' : ''}
                      >
                        <td>
                          <code>subscription_changes</code>
                        </td>
                        <td>{tc.changeId}</td>
                        <td>{tc.changeTs.slice(0, 5)}</td>
                        <td className="num">
                          Plan <strong>{tc.tier}</strong>
                        </td>
                      </tr>
                    );
                  })}
                  {purchases.map((p, idx) => {
                    const isSelected = selectedPurchaseIdx === idx;
                    return (
                      <tr
                        key={`${p.purchaseId}-${isSelected ? 'sel' : 'idle'}`}
                        className={`row-clickable ${isSelected ? 'row-selected row-flash' : ''}`}
                        onClick={() => setSelectedPurchaseIdx(idx)}
                      >
                        <td>
                          <code>purchases</code>
                        </td>
                        <td>{p.purchaseId}</td>
                        <td>{p.purchaseTs.slice(0, 5)}</td>
                        <td className="num">
                          Compra <strong>${p.amountUsd.toFixed(2)}</strong>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="sim-panel">
            <div className="sim-panel__title">
              {joinMode === 'inner'
                ? 'Resultado SQL: ON p.user_id = s.user_id AND p.purchase_ts = s.change_ts'
                : 'Resultado SQL: ASOF JOIN ... MATCH_CONDITION (p.purchase_ts >= s.change_ts)'}
            </div>
            <div className="sim-table-scroll">
              <table key={joinMode} className="sim-table tabular">
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
                    <tr className="row-duplicated row-flash">
                      <td colSpan={5} className="sim-table-empty-cell">
                        0 filas devueltas. Ningún timestamp de compra (09:42, 10:20, 11:45) es
                        idéntico al segundo con un cambio de plan (09:00, 10:15, 11:30).
                      </td>
                    </tr>
                  ) : (
                    purchases.map((p, idx) => {
                      const isSelected = selectedPurchaseIdx === idx;
                      return (
                        <tr
                          key={`${p.purchaseId}-${isSelected ? 'sel' : 'idle'}`}
                          className={`row-clickable ${
                            isSelected ? 'row-selected row-flash' : 'row-optimal'
                          }`}
                          onClick={() => setSelectedPurchaseIdx(idx)}
                        >
                          <td>{p.purchaseId}</td>
                          <td>{p.purchaseTs.slice(0, 5)}</td>
                          <td className="num">${p.amountUsd.toFixed(2)}</td>
                          <td>{p.matchedTs.slice(0, 5)}</td>
                          <td>
                            <strong>{p.matchedTier}</strong>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="sim-two-col tabular">
              <div className={`sim-metric-box ${joinMode === 'inner' ? 'box-danger' : 'box-ok'}`}>
                <div className="sim-metric-title">Ingresos atribuidos en el cruce</div>
                <div className="sim-metric-nums">
                  <strong>
                    {joinMode === 'inner'
                      ? '$0.00 (0 de 3 compras)'
                      : '$545.00 (3 de 3 compras)'}
                  </strong>
                </div>
              </div>
              <div className="sim-metric-box">
                <div className="sim-metric-title">Complejidad algorítmica</div>
                <div className="sim-metric-nums">
                  <strong>
                    {joinMode === 'inner'
                      ? 'Hash Join exacto (pierde eventos)'
                      : 'O(N + M) en barrido ordenado'}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sim-comparison-card">
          <div className="sim-comparison-card__title">
            Cobertura de Eventos de Compra Emparejados ($545.00 USD Totales)
          </div>
          <div className="sim-comparison-bars">
            <div className="sim-bar-row">
              <div className="sim-bar-header">
                <span className="sim-bar-label">INNER JOIN por igualdad de timestamp</span>
                <span className="sim-bar-value">$0.00 USD (0% emparejado)</span>
              </div>
              <div className="sim-bar-track">
                <div
                  className="sim-bar-fill sim-bar-fill--danger"
                  style={{ '--bar-pct': '4%' }}
                />
              </div>
            </div>
            <div className="sim-bar-row">
              <div className="sim-bar-header">
                <span className="sim-bar-label">ASOF JOIN (p.purchase_ts &gt;= s.change_ts)</span>
                <span className="sim-bar-value">$545.00 USD (100% emparejado sin duplicados)</span>
              </div>
              <div className="sim-bar-track">
                <div
                  className="sim-bar-fill sim-bar-fill--success"
                  style={{ '--bar-pct': '100%' }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={`viz-result-banner ${joinMode === 'inner' ? 'danger' : 'success'} tabular`}>
          <div className="viz-banner-title">
            Paso a paso ({activePurchase.purchaseId} a las {activePurchase.purchaseTs.slice(0, 5)}{' '}
            por ${activePurchase.amountUsd.toFixed(2)}):
          </div>
          <p>{activePurchase.stepExplanation}</p>
        </div>
      </div>

      <div className="sim-frame__footer">
        <span className="sim-frame__footer-label">Qué observar:</span>
        <span className="sim-frame__footer-text">
          ASOF JOIN busca hacia atrás el estado más reciente (timestamp &lt;= compra) en tiempo
          lineal O(N + M) sin perder eventos ni provocar fan-out.
        </span>
      </div>
    </div>
  );
}

export function StarVsObtSim() {
  const [archMode, setArchMode] = useState('star'); // 'star' | 'obt'
  const [workload, setWorkload] = useState('update'); // 'update' | 'scan'

  const metrics = {
    star: {
      update: {
        storageGb: '4.2 GB (hechos compactos + dimensiones)',
        updateCost: '1 fila insertada/cerrada en dim_customer_scd2 (18 ms)',
        querySpeed: '1.15 s (requiere Hash Join en tiempo de consulta)',
        filesRewritten: '1 archivo en dimensión (0 archivos de hechos tocados)',
        status: 'success',
        summary:
          'En Esquema Estrella, actualizar el segmento corporativo de 1 cliente solo modifica dim_customer_scd2 (50,000 filas). Las 10,000,000 de filas en fct_orders permanecen intactas porque apuntan a la llave sustituta entera customer_sk.',
      },
      scan: {
        storageGb: '4.2 GB (sin redundancia de texto)',
        updateCost: 'Mantenimiento aislado en dimensiones ligeras',
        querySpeed: '1.15 s (escaneo de hechos + Hash Join con 2 dimensiones)',
        filesRewritten: 'Lectura de 2 columnas en fct_orders + tabla dim_customer_scd2',
        status: 'success',
        summary:
          'Al escanear 10 millones de pedidos agrupando por segmento de cliente, el motor lee customer_sk y amount_usd desde fct_orders y ejecuta un Hash Join en memoria contra dim_customer_scd2. Es ideal como núcleo gobernado multi-dominio.',
      },
    },
    obt: {
      update: {
        storageGb: '6.8 GB (columnas desnormalizadas con compresión RLE)',
        updateCost: '14,200 filas reescritas en 85 archivos Parquet (9.4 s)',
        querySpeed: '0.42 s (0 joins en lectura)',
        filesRewritten: '85 de 450 archivos Parquet reescritos por Copy-on-Write',
        status: 'danger',
        summary:
          'En una One Big Table (OBT), el atributo customer_segment está copiado físicamente en cada pedido. Si un cliente corporativo cambia de segmento y debes corregir sus 14,200 pedidos históricos, el motor reescribe decenas de archivos Parquet pesados.',
      },
      scan: {
        storageGb: '6.8 GB (diccionario Parquet mitiga el texto repetido)',
        updateCost: 'Alto costo de escritura en mutaciones dimensionales',
        querySpeed: '0.42 s (barrido columnar puro sin ningún JOIN)',
        filesRewritten: 'Lectura directa de 2 columnas contiguas en obt_orders_wide',
        status: 'success',
        summary:
          'Al consultar 10 millones de filas en BI, OBT brilla: el motor lee únicamente las columnas customer_segment (codificada por diccionario) y amount_usd en un solo pase secuencial sin construir tablas Hash Join en RAM.',
      },
    },
  };

  const currentMetric = metrics[archMode][workload];

  const handleReset = () => {
    setArchMode('star');
    setWorkload('update');
  };

  return (
    <div className="sim-frame viz-card" data-stage="2">
      <div className="sim-frame__header">
        <div className="sim-frame__title-group">
          <span className="sim-frame__stage-icon" aria-hidden="true">
            <Layers size={18} />
          </span>
          <div className="sim-frame__headings">
            <div className="sim-frame__kicker">Etapa 2 · Arquitectura Dimensional</div>
            <h3 className="sim-frame__title">
              Simulador de modelado: Esquema Estrella (Kimball) frente a One Big Table (OBT)
            </h3>
            <p className="sim-frame__desc">
              Compara el costo físico en disco, el impacto de actualizar 1 cliente y la velocidad de
              escaneo sobre 10,000,000 de pedidos.
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={RotateCcw}
          className="sim-reset-btn"
          onClick={handleReset}
          ariaLabel="Reiniciar simulador"
        >
          Reiniciar
        </Button>
      </div>

      <div className="sim-frame__controls">
        <div className="sim-segmented" role="group" aria-label="Arquitectura de tabla">
          <button
            type="button"
            className={`sim-segmented__btn ${
              archMode === 'star' ? 'sim-segmented__btn--active' : ''
            }`}
            onClick={() => setArchMode('star')}
          >
            Esquema Estrella (Kimball)
          </button>
          <button
            type="button"
            className={`sim-segmented__btn ${
              archMode === 'obt' ? 'sim-segmented__btn--active' : ''
            }`}
            onClick={() => setArchMode('obt')}
          >
            One Big Table (obt_orders_wide)
          </button>
        </div>

        <div className="sim-segmented" role="group" aria-label="Carga de trabajo">
          <button
            type="button"
            className={`sim-segmented__btn ${
              workload === 'update'
                ? archMode === 'obt'
                  ? 'sim-segmented__btn--active-danger'
                  : 'sim-segmented__btn--active'
                : ''
            }`}
            onClick={() => setWorkload('update')}
          >
            <RefreshCw size={13} />
            1. Actualizar segmento de 1 cliente (U-101)
          </button>
          <button
            type="button"
            className={`sim-segmented__btn ${
              workload === 'scan' ? 'sim-segmented__btn--active' : ''
            }`}
            onClick={() => setWorkload('scan')}
          >
            <Zap size={13} />
            2. Escanear 10M de filas en dashboard BI
          </button>
        </div>
      </div>

      <div className="sim-frame__body">
        <div className="sim-three-col tabular">
          <div className="sim-metric-box">
            <div className="sim-metric-title">
              <HardDrive size={13} /> Costo de almacenamiento (10M filas)
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
              <Database size={13} /> Costo de actualización (1 cliente)
            </div>
            <div className="sim-metric-nums">
              <strong>{currentMetric.updateCost}</strong>
            </div>
          </div>
          <div className="sim-metric-box box-ok">
            <div className="sim-metric-title">
              <Layers size={13} /> Velocidad de consulta (10M filas)
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
                ? 'Tabla de hechos: fct_orders (10,000,000 filas · llaves enteras de 4 bytes)'
                : 'Tabla ancha: obt_orders_wide (10,000,000 filas · atributos repetidos)'}
            </div>
            <div className="sim-table-scroll">
              {archMode === 'star' ? (
                <table key={`star-${workload}`} className="sim-table tabular">
                  <thead>
                    <tr>
                      <th>order_id</th>
                      <th className="num">customer_sk</th>
                      <th className="num">product_sk</th>
                      <th className="num">amount_usd</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className={workload === 'scan' ? 'row-optimal row-flash' : ''}>
                      <td>ORD-9001</td>
                      <td className="num">
                        <code>4012</code>
                      </td>
                      <td className="num">
                        <code>88</code>
                      </td>
                      <td className="num">$1,250.00</td>
                    </tr>
                    <tr className={workload === 'scan' ? 'row-optimal row-flash' : ''}>
                      <td>ORD-9002</td>
                      <td className="num">
                        <code>4012</code>
                      </td>
                      <td className="num">
                        <code>94</code>
                      </td>
                      <td className="num">$890.00</td>
                    </tr>
                    <tr className={workload === 'scan' ? 'row-optimal row-flash' : ''}>
                      <td>ORD-9003</td>
                      <td className="num">
                        <code>7105</code>
                      </td>
                      <td className="num">
                        <code>88</code>
                      </td>
                      <td className="num">$340.00</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <table key={`obt-${workload}`} className="sim-table tabular">
                  <thead>
                    <tr>
                      <th>order_id</th>
                      <th>customer_id</th>
                      <th>customer_segment</th>
                      <th>product_category</th>
                      <th className="num">amount_usd</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      className={
                        workload === 'update'
                          ? 'row-duplicated row-flash'
                          : 'row-optimal row-flash'
                      }
                    >
                      <td>ORD-9001</td>
                      <td>U-101</td>
                      <td>
                        {workload === 'update' ? 'Enterprise (Reescrito)' : 'Enterprise'}
                      </td>
                      <td>Cloud Compute</td>
                      <td className="num">$1,250.00</td>
                    </tr>
                    <tr
                      className={
                        workload === 'update'
                          ? 'row-duplicated row-flash'
                          : 'row-optimal row-flash'
                      }
                    >
                      <td>ORD-9002</td>
                      <td>U-101</td>
                      <td>
                        {workload === 'update' ? 'Enterprise (Reescrito)' : 'Enterprise'}
                      </td>
                      <td>Storage</td>
                      <td className="num">$890.00</td>
                    </tr>
                    <tr className={workload === 'scan' ? 'row-optimal row-flash' : ''}>
                      <td>ORD-9003</td>
                      <td>U-204</td>
                      <td>Mid-Market</td>
                      <td>Cloud Compute</td>
                      <td className="num">$340.00</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="sim-panel">
            <div className="sim-panel__title">
              {archMode === 'star'
                ? 'Dimensiones: dim_customer_scd2 (50k filas) + dim_product (2k filas)'
                : 'Impacto físico en bloques Parquet bajo esta operación'}
            </div>
            {archMode === 'star' ? (
              <div className="sim-table-scroll">
                <table key={`dim-${workload}`} className="sim-table tabular">
                  <thead>
                    <tr>
                      <th>Dimensión</th>
                      <th className="num">sk</th>
                      <th>natural_key</th>
                      <th>Atributo gobernado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className={workload === 'update' ? 'row-optimal row-flash' : ''}>
                      <td>
                        <code>dim_customer_scd2</code>
                      </td>
                      <td className="num">
                        <code>4012</code>
                      </td>
                      <td>U-101</td>
                      <td>
                        {workload === 'update'
                          ? 'Segmento actualizado en 1 sola fila'
                          : 'Segmento: Enterprise'}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <code>dim_customer_scd2</code>
                      </td>
                      <td className="num">
                        <code>7105</code>
                      </td>
                      <td>U-204</td>
                      <td>Segmento: Mid-Market</td>
                    </tr>
                    <tr>
                      <td>
                        <code>dim_product</code>
                      </td>
                      <td className="num">
                        <code>88</code>
                      </td>
                      <td>PRD-09</td>
                      <td>Categoría: Cloud Compute</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="block-strip tabular">
                <div
                  className={`disk-block ${
                    workload === 'update' ? 'scanned-bad' : 'scanned-good'
                  }`}
                >
                  {workload === 'update'
                    ? 'Amplificación de escritura: 85 archivos Parquet reescritos para mutar U-101'
                    : 'Lectura columnar directa: solo se descomprimen customer_segment y amount_usd'}
                </div>
                <div className="disk-block pruned">
                  Compresión de diccionario en Parquet reduce cadenas repetidas (&quot;Enterprise&quot;)
                  a índices de 1 byte en reposo.
                </div>
                <div className="disk-block scanned-good">
                  Regla híbrida 2026: modela Silver/Core en Estrella para gobernar cambios y
                  materializa OBT en Gold solo para motores BI extremos.
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sim-comparison-card">
          <div className="sim-comparison-card__title">
            Comparación Cuantitativa: Estrella vs. OBT ({workload === 'update' ? 'Mutación Dimensional' : 'Escaneo BI 10M Filas'})
          </div>
          <div className="sim-comparison-bars">
            {workload === 'update' ? (
              <>
                <div className="sim-bar-row">
                  <div className="sim-bar-header">
                    <span className="sim-bar-label">
                      Esquema Estrella — Actualización aislada en dim_customer_scd2
                    </span>
                    <span className="sim-bar-value">18 ms (1 archivo tocado)</span>
                  </div>
                  <div className="sim-bar-track">
                    <div
                      className="sim-bar-fill sim-bar-fill--success"
                      style={{ '--bar-pct': '5%' }}
                    />
                  </div>
                </div>
                <div className="sim-bar-row">
                  <div className="sim-bar-header">
                    <span className="sim-bar-label">
                      One Big Table — Reescritura de pedidos históricos del cliente
                    </span>
                    <span className="sim-bar-value">9,400 ms (85 archivos Parquet reescritos)</span>
                  </div>
                  <div className="sim-bar-track">
                    <div
                      className="sim-bar-fill sim-bar-fill--danger"
                      style={{ '--bar-pct': '100%' }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="sim-bar-row">
                  <div className="sim-bar-header">
                    <span className="sim-bar-label">
                      Esquema Estrella — Escaneo de hechos + Hash Join en memoria
                    </span>
                    <span className="sim-bar-value">1.15 s (4.2 GB en disco)</span>
                  </div>
                  <div className="sim-bar-track">
                    <div
                      className="sim-bar-fill sim-bar-fill--stage"
                      style={{ '--bar-pct': '72%' }}
                    />
                  </div>
                </div>
                <div className="sim-bar-row">
                  <div className="sim-bar-header">
                    <span className="sim-bar-label">
                      One Big Table — Barrido columnar secuencial sin JOIN
                    </span>
                    <span className="sim-bar-value">0.42 s (2.7x más rápido en lectura pura)</span>
                  </div>
                  <div className="sim-bar-track">
                    <div
                      className="sim-bar-fill sim-bar-fill--success"
                      style={{ '--bar-pct': '28%' }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className={`viz-result-banner ${currentMetric.status} tabular`}>
          <div className="viz-banner-title">
            Diagnóstico arquitectónico ({archMode === 'star' ? 'Esquema Estrella' : 'One Big Table'}{' '}
            · {workload === 'update' ? 'Mutación de 1 cliente' : 'Escaneo de 10M de filas'}):
          </div>
          <p>{currentMetric.summary}</p>
        </div>
      </div>

      <div className="sim-frame__footer">
        <span className="sim-frame__footer-label">Qué observar:</span>
        <span className="sim-frame__footer-text">
          El Esquema Estrella minimiza el costo de actualizar dimensiones; OBT elimina los JOINs en
          lectura a cambio de amplificar las escrituras.
        </span>
      </div>
    </div>
  );
}

export function ArrowZeroCopySim() {
  const [transportMode, setTransportMode] = useState('arrow'); // 'copy' | 'arrow'
  const [activeHop, setActiveHop] = useState(0);

  const pipelines = {
    copy: {
      title: 'Serialización y copia en cada salto (75% de CPU copiando memoria)',
      totalLatencyMs: 3420,
      cpuCopyPct: '75% CPU en serde/copia',
      memoryCopies: '4 copias completas en RAM',
      peakRamGb: '4.8 GB RAM pico',
      steps: [
        {
          stepNum: 1,
          stage: 'Postgres (Filas en heap)',
          format: 'Tuplas orientadas a filas en protocolo de texto/binario libpq',
          cpuPct: '18% CPU',
          ramAllocated: '1.2 GB',
          action:
            'Copia #1: serializa cada fila y convierte números/fechas a flujo de bytes de red.',
        },
        {
          stepNum: 2,
          stage: 'Archivo intermedio CSV / Pickle',
          format: 'Cadenas de texto UTF-8 o grafo de objetos Python serializados',
          cpuPct: '24% CPU',
          ramAllocated: '2.3 GB',
          action:
            'Copia #2: escribe y parsea texto línea por línea o reconstruye punteros PyObject.',
        },
        {
          stepNum: 3,
          stage: 'DataFrame clásico en memoria',
          format: 'Arrays fragmentados y objetos boxed en heap de Python',
          cpuPct: '19% CPU',
          ramAllocated: '3.7 GB',
          action:
            'Copia #3: duplica buffers al filtrar o transformar columnas antes de exportar.',
        },
        {
          stepNum: 4,
          stage: 'Serialización JSON hacia BI',
          format: 'Claves repetidas en texto JSON para el navegador',
          cpuPct: '14% CPU',
          ramAllocated: '4.8 GB',
          action:
            'Copia #4: vuelve a convertir tensores numéricos a texto JSON y los parsea en el cliente.',
        },
      ],
    },
    arrow: {
      title: 'Apache Arrow IPC Zero-Copy (0 copias entre DuckDB, Polars y Browser Wasm)',
      totalLatencyMs: 185,
      cpuCopyPct: '0% CPU en recodificación',
      memoryCopies: '0 copias (puntero compartido)',
      peakRamGb: '1.1 GB RAM única',
      steps: [
        {
          stepNum: 1,
          stage: 'Parquet a Buffer Apache Arrow',
          format: 'Columnas contiguas SIMD en dirección 0x7F8A0040',
          cpuPct: '4% CPU (lectura SIMD)',
          ramAllocated: '1.1 GB',
          action:
            'Carga única: decodifica las páginas columnares directamente al formato en memoria de Apache Arrow.',
        },
        {
          stepNum: 2,
          stage: 'Motor SQL DuckDB',
          format: 'Lee el mismo RecordBatch en 0x7F8A0040 (0 copias)',
          cpuPct: '0% CPU en copia',
          ramAllocated: '1.1 GB (compartida)',
          action:
            'Zero-Copy: DuckDB apunta sus vectores de ejecución directamente a la dirección de memoria de Arrow.',
        },
        {
          stepNum: 3,
          stage: 'Motor DataFrame Polars (DA)',
          format: 'Intercambio vía Arrow C Data Interface (0 copias)',
          cpuPct: '0% CPU en copia',
          ramAllocated: '1.1 GB (compartida)',
          action:
            'Zero-Copy: Polars recibe únicamente el puntero de 64 bits al buffer columnar sin clonar un solo byte.',
        },
        {
          stepNum: 4,
          stage: 'Navegador BI con DuckDB-Wasm',
          format: 'Stream Arrow IPC directo a WebAssembly lineal (0 parseo JSON)',
          cpuPct: '2% CPU (proyección)',
          ramAllocated: '1.1 GB (vista directa)',
          action:
            'Zero-Copy: el cliente BI mapea el buffer Arrow IPC en la memoria de WebAssembly y renderiza al instante.',
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

  return (
    <div className="sim-frame viz-card" data-stage="3">
      <div className="sim-frame__header">
        <div className="sim-frame__title-group">
          <span className="sim-frame__stage-icon" aria-hidden="true">
            <Cpu size={18} />
          </span>
          <div className="sim-frame__headings">
            <div className="sim-frame__kicker">Etapa 3 · Memoria Columnar Apache Arrow</div>
            <h3 className="sim-frame__title">
              Simulador de memoria: Serialización clásica frente a Apache Arrow IPC Zero-Copy
            </h3>
            <p className="sim-frame__desc">
              Observa por qué los pipelines tradicionales gastan hasta el 75% de la CPU traduciendo
              formatos y cómo Apache Arrow comparte el mismo bloque de RAM entre motores con 0
              copias.
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={RotateCcw}
          className="sim-reset-btn"
          onClick={handleReset}
          ariaLabel="Reiniciar simulador"
        >
          Reiniciar
        </Button>
      </div>

      <div className="sim-frame__controls">
        <div className="sim-segmented" role="group" aria-label="Modo de transporte en memoria">
          <button
            type="button"
            className={`sim-segmented__btn ${
              transportMode === 'copy' ? 'sim-segmented__btn--active-danger' : ''
            }`}
            onClick={() => setTransportMode('copy')}
          >
            Postgres / CSV / Pandas / JSON (75% CPU copiando)
          </button>
          <button
            type="button"
            className={`sim-segmented__btn ${
              transportMode === 'arrow' ? 'sim-segmented__btn--active' : ''
            }`}
            onClick={() => setTransportMode('arrow')}
          >
            Apache Arrow IPC Zero-Copy (0 copias en RAM)
          </button>
        </div>

        <div className="sim-segmented" role="group" aria-label="Etapa del pipeline">
          {currentPipe.steps.map((s, idx) => (
            <button
              key={s.stepNum}
              type="button"
              className={`sim-segmented__btn ${
                activeHop === idx
                  ? transportMode === 'copy'
                    ? 'sim-segmented__btn--active-danger'
                    : 'sim-segmented__btn--active'
                  : ''
              }`}
              onClick={() => setActiveHop(idx)}
            >
              Etapa {s.stepNum}: {s.stage}
            </button>
          ))}
        </div>
      </div>

      <div className="sim-frame__body">
        <div className="sim-four-col tabular">
          <div className={`sim-metric-box ${transportMode === 'copy' ? 'box-danger' : 'box-ok'}`}>
            <div className="sim-metric-title">
              <Cpu size={13} /> Costo de CPU en copia
            </div>
            <div className="sim-metric-nums">
              <strong>{currentPipe.cpuCopyPct}</strong>
            </div>
          </div>
          <div className={`sim-metric-box ${transportMode === 'copy' ? 'box-danger' : 'box-ok'}`}>
            <div className="sim-metric-title">Copias en memoria RAM</div>
            <div className="sim-metric-nums">
              <strong>{currentPipe.memoryCopies}</strong>
            </div>
          </div>
          <div className="sim-metric-box">
            <div className="sim-metric-title">Consumo pico de RAM</div>
            <div className="sim-metric-nums">
              <strong>{currentPipe.peakRamGb}</strong>
            </div>
          </div>
          <div className="sim-metric-box">
            <div className="sim-metric-title">Latencia extremo a extremo</div>
            <div className="sim-metric-nums">
              <strong>{currentPipe.totalLatencyMs} ms</strong>
            </div>
          </div>
        </div>

        <div className="sim-two-col">
          <div className="sim-panel">
            <div className="sim-panel__title">{currentPipe.title}</div>
            <div className="sim-table-scroll">
              <table key={transportMode} className="sim-table tabular">
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
                      isSelected
                        ? transportMode === 'copy'
                          ? 'row-duplicated row-flash'
                          : 'row-selected row-flash'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ');

                    return (
                      <tr
                        key={`${s.stepNum}-${isSelected ? 'sel' : 'idle'}`}
                        className={rowClass}
                        onClick={() => setActiveHop(idx)}
                      >
                        <td>#{s.stepNum}</td>
                        <td>{s.stage}</td>
                        <td className="num">{s.cpuPct}</td>
                        <td className="num">{s.ramAllocated}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="sim-panel">
            <div className="sim-panel__title">
              {transportMode === 'copy'
                ? 'Fragmentación y recodificación en memoria (4 representaciones distintas)'
                : 'Buffer columnar único en RAM (compartido por DuckDB, Polars y Wasm)'}
            </div>
            {transportMode === 'copy' ? (
              <div className="block-strip tabular">
                <div className="disk-block scanned-bad">
                  1. Heap Postgres (Filas) convertidas a texto CSV / Pickle (Copia #1 y #2)
                </div>
                <div className="disk-block scanned-bad">
                  2. Objetos PyObject dispersos en RAM para Pandas (Copia #3)
                </div>
                <div className="disk-block scanned-bad">
                  3. Serialización a texto JSON para enviar al navegador (Copia #4)
                </div>
              </div>
            ) : (
              <div className="block-strip tabular">
                <div className="disk-block scanned-good">
                  Dirección base <code>0x7F8A0040</code>: Buffer Arrow{' '}
                  <code>amount_usd (float64[10M])</code> contiguo en RAM
                </div>
                <div className="disk-block scanned-good">
                  Lectores simultáneos sin copia: <strong>DuckDB</strong> + <strong>Polars</strong>{' '}
                  + <strong>Browser Wasm</strong> leen <code>0x7F8A0040</code>
                </div>
                <div className="disk-block pruned">
                  Intercambio de metadatos en nanosegundos: solo se transfiere el struct de punteros
                  C Data Interface (64 bytes).
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sim-comparison-card">
          <div className="sim-comparison-card__title">
            Comparación de Latencia Total y Memoria Pico (10M de Filas)
          </div>
          <div className="sim-comparison-bars">
            <div className="sim-bar-row">
              <div className="sim-bar-header">
                <span className="sim-bar-label">
                  Pipeline con Serialización Clásica (4 copias en RAM · 4.8 GB)
                </span>
                <span className="sim-bar-value">3,420 ms (75% CPU en Serde)</span>
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
                  Apache Arrow IPC Zero-Copy (0 copias · 1.1 GB compartidos)
                </span>
                <span className="sim-bar-value">185 ms (18.4x más rápido)</span>
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

        <div
          className={`viz-result-banner ${transportMode === 'copy' ? 'danger' : 'success'} tabular`}
        >
          <div className="viz-banner-title">
            Detalle de la Etapa #{currentStep.stepNum} ({currentStep.stage} · Formato:{' '}
            {currentStep.format}):
          </div>
          <p>{currentStep.action}</p>
        </div>
      </div>

      <div className="sim-frame__footer">
        <span className="sim-frame__footer-label">Qué observar:</span>
        <span className="sim-frame__footer-text">
          Con Apache Arrow, DuckDB, Polars y WebAssembly apuntan a la misma dirección física de
          memoria (0x7F8A0040) sin serializar ni duplicar buffers.
        </span>
      </div>
    </div>
  );
}

export default {
  AsOfJoinTimelineSim,
  StarVsObtSim,
  ArrowZeroCopySim,
};
