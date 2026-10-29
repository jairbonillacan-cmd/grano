import React, { useState, useMemo } from 'react';
import { Code2 } from 'lucide-react';
import { SimulatorFrame, SimSegmented } from './SimulatorFrame.jsx';

function getRetentionCellClass(pct, isMonthZero = false) {
  if (pct === null || pct === undefined) {
    return 'num sim-cell-pending';
  }
  if (isMonthZero) {
    return 'num sim-cell-m0';
  }
  if (pct >= 52) {
    return 'num sim-cell-solid';
  }
  if (pct >= 38) {
    return 'num sim-cell-stable';
  }
  if (pct >= 26) {
    return 'num sim-cell-warn';
  }
  return 'num sim-cell-critical';
}

export function CohortRetentionSim({
  visualType = 'cohort-heatmap',
  onStateChange,
}) {
  const [viewMode, setViewMode] = useState('cohorts'); // 'blended' | 'cohorts'
  const [onboardingBoost, setOnboardingBoost] = useState(6); // 0 to 15 (%)
  const [showMaterializationSql, setShowMaterializationSql] = useState(false);

  const cacUsd = 120;
  const arpuMonthlyUsd = 38;

  const cohortData = useMemo(() => {
    const boostFactor = onboardingBoost;
    const baseCohorts = [
      {
        id: 'enero',
        name: 'Cohorte Enero',
        channelNote: 'Tráfico orgánico + búsqueda',
        users: 1200,
        baseM1: 42.0,
        baseM2: 31.0,
        baseM3: 26.5,
        baseM6: 22.0,
      },
      {
        id: 'febrero',
        name: 'Cohorte Febrero',
        channelNote: 'Campaña pagada masiva (baja activación)',
        users: 3400,
        baseM1: 29.0,
        baseM2: 19.5,
        baseM3: 15.0,
        baseM6: null,
      },
      {
        id: 'marzo',
        name: 'Cohorte Marzo',
        channelNote: 'Nuevo flujo guiado de activación',
        users: 2100,
        baseM1: 48.0,
        baseM2: 39.0,
        baseM3: null,
        baseM6: null,
      },
    ];

    return baseCohorts.map((c) => {
      const m0 = 100.0;
      const m1 = Math.min(96, +(c.baseM1 + boostFactor * 1.0).toFixed(1));
      const m2 =
        c.baseM2 !== null
          ? Math.min(92, +(c.baseM2 + boostFactor * 1.15).toFixed(1))
          : null;
      const m3 =
        c.baseM3 !== null
          ? Math.min(88, +(c.baseM3 + boostFactor * 1.25).toFixed(1))
          : null;
      const m6 =
        c.baseM6 !== null
          ? Math.min(84, +(c.baseM6 + boostFactor * 1.35).toFixed(1))
          : null;

      const projectedM3 = m3 !== null ? m3 : +(m2 * 0.88).toFixed(1);
      const projectedM6 = m6 !== null ? m6 : +(projectedM3 * 0.86).toFixed(1);
      const avgActiveMonths12 =
        1 +
        m1 / 100 +
        (m2 !== null ? m2 / 100 : projectedM3 / 100) +
        (projectedM3 / 100) * 2 +
        (projectedM6 / 100) * 7;

      const ltvUsd = Math.round(avgActiveMonths12 * arpuMonthlyUsd);
      const paybackMonths = +(cacUsd / (arpuMonthlyUsd * (m1 / 100 + 0.35))).toFixed(1);

      return {
        ...c,
        m0,
        m1,
        m2,
        m3,
        m6,
        projectedM3,
        projectedM6,
        ltvUsd,
        paybackMonths,
      };
    });
  }, [onboardingBoost]);

  const blendedRow = useMemo(() => {
    const totalUsers = cohortData.reduce((acc, c) => acc + c.users, 0);
    const weightedM1 =
      cohortData.reduce((acc, c) => acc + c.m1 * c.users, 0) / totalUsers;

    const m2Cohorts = cohortData.filter((c) => c.m2 !== null);
    const m2Users = m2Cohorts.reduce((acc, c) => acc + c.users, 0);
    const weightedM2 =
      m2Cohorts.reduce((acc, c) => acc + c.m2 * c.users, 0) / m2Users;

    const m3Cohorts = cohortData.filter((c) => c.m3 !== null);
    const m3Users = m3Cohorts.reduce((acc, c) => acc + c.users, 0);
    const weightedM3 =
      m3Cohorts.reduce((acc, c) => acc + c.m3 * c.users, 0) / m3Users;

    const m6Cohorts = cohortData.filter((c) => c.m6 !== null);
    const m6Users = m6Cohorts.reduce((acc, c) => acc + c.users, 0);
    const weightedM6 =
      m6Cohorts.reduce((acc, c) => acc + c.m6 * c.users, 0) / m6Users;

    const weightedLtv = Math.round(
      cohortData.reduce((acc, c) => acc + c.ltvUsd * c.users, 0) / totalUsers
    );
    const weightedPayback = +(
      cohortData.reduce((acc, c) => acc + c.paybackMonths * c.users, 0) / totalUsers
    ).toFixed(1);

    return {
      totalUsers,
      m0: 100.0,
      m1: +weightedM1.toFixed(1),
      m2: +weightedM2.toFixed(1),
      m3: +weightedM3.toFixed(1),
      m6: +weightedM6.toFixed(1),
      ltvUsd: weightedLtv,
      paybackMonths: weightedPayback,
    };
  }, [cohortData]);

  const survivalCurvePoints = useMemo(() => {
    const xCoords = [48, 140, 232, 324, 480];
    const yFromPct = (pct) => 132 - (pct / 100) * 108;

    const basePcts = [100, 42.0, 31.0, 26.5, 22.0];
    const jan = cohortData[0];
    const boostedJanPcts = [100, jan.m1, jan.m2, jan.m3, jan.m6];
    const feb = cohortData[1];
    const febPcts = [100, feb.m1, feb.m2, feb.m3, feb.projectedM6];

    const toPolyline = (pcts) =>
      pcts.map((p, i) => `${xCoords[i]},${yFromPct(p).toFixed(1)}`).join(' ');

    return {
      xCoords,
      yFromPct,
      basePcts,
      boostedJanPcts,
      febPcts,
      baseLine: toPolyline(basePcts),
      boostedLine: toPolyline(boostedJanPcts),
      febLine: toPolyline(febPcts),
    };
  }, [cohortData]);

  const handleReset = () => {
    setViewMode('cohorts');
    setOnboardingBoost(6);
    setShowMaterializationSql(false);
  };

  const febLtvPct = Math.min(100, Math.round((cohortData[1].ltvUsd / 350) * 100));
  const marLtvPct = Math.min(100, Math.round((cohortData[2].ltvUsd / 350) * 100));
  const ltvCacRatio = +(blendedRow.ltvUsd / cacUsd).toFixed(1);

  const liveReadout =
    viewMode === 'blended'
      ? `En vista global mezclada (+${onboardingBoost}% activación), el promedio oculta la fuga de Febrero (${cohortData[1].m1}% en Mes 1) y distorsiona el Mes 6 (${blendedRow.m6}%), reportando un LTV mezclado de $${blendedRow.ltvUsd} USD (${ltvCacRatio}x CAC).`
      : `En matriz por cohorte con +${onboardingBoost}% en onboarding día 7: Enero retiene ${cohortData[0].m6}% al Mes 6 (LTV $${cohortData[0].ltvUsd}), Febrero cae a ${cohortData[1].m3}% al Mes 3 (Payback ${cohortData[1].paybackMonths} m) y Marzo arranca en ${cohortData[2].m1}% al Mes 1 (LTV $${cohortData[2].ltvUsd}).`;

  return (
    <SimulatorFrame
      kicker="Analítica de producto · Supervivencia y LTV"
      title="Matriz triangular de retención por cohortes y curva de supervivencia"
      instruction="Alterna entre la vista global mezclada y el desglose por cohorte, y mueve el deslizador de mejora de onboarding (+0% a +15%)."
      onReset={handleReset}
      visualType={visualType}
      mode={`${viewMode}:boost-${onboardingBoost}`}
      metrics={{
        viewMode,
        onboardingBoostPct: onboardingBoost,
        blendedM1Pct: blendedRow.m1,
        janM6Pct: cohortData[0].m6,
        febLtvUsd: cohortData[1].ltvUsd,
        marLtvUsd: cohortData[2].ltvUsd,
        ltvCacRatio,
      }}
      liveReadout={liveReadout}
      readoutTone={viewMode === 'blended' ? 'bad' : 'ok'}
      onStateChange={onStateChange}
      controls={
        <>
          <SimSegmented
            ariaLabel="Modo de vista de cohortes"
            value={viewMode}
            onChange={setViewMode}
            options={[
              {
                value: 'blended',
                label: 'Vista global mezclada',
                tone: 'bad',
              },
              {
                value: 'cohorts',
                label: 'Desglose por cohorte (Ene, Feb, Mar)',
                tone: 'ok',
              },
            ]}
          />

          <label className="sim-slider-box tabular">
            <span>
              Onboarding D7:{' '}
              <strong className="sim-text-success">
                +{onboardingBoost}%
              </strong>
            </span>
            <input
              type="range"
              min="0"
              max="15"
              step="1"
              value={onboardingBoost}
              aria-valuemin={0}
              aria-valuemax={15}
              aria-valuenow={onboardingBoost}
              aria-label="Mejora de onboarding día 7 (+0% a +15%)"
              onChange={(e) => setOnboardingBoost(Number(e.target.value))}
            />
          </label>

          <div className="sim-metrics-strip tabular">
            <span className="sim-metric">
              <span className="sim-metric__label">CAC:</span>
              <span className="sim-metric__value">${cacUsd} (ARPU ${arpuMonthlyUsd}/m)</span>
            </span>
            <span className={`sim-metric ${blendedRow.ltvUsd >= cacUsd * 2 ? 'sim-metric--ok' : 'sim-metric--bad'}`}>
              <span className="sim-metric__label">LTV/CAC:</span>
              <span className="sim-metric__value">{ltvCacRatio}x (${blendedRow.ltvUsd} · {blendedRow.paybackMonths} m)</span>
            </span>
          </div>
        </>
      }
    >
      <div className="sim-panel">
        <div className="sim-panel__header">
          <div className="sim-panel__title">
            {viewMode === 'blended'
              ? 'Tabla colapsada: promedio global mezclado (oculta el deterioro de Febrero)'
              : 'Mapa de calor triangular por cohorte de adquisición (escalón diagonal de maduración)'}
          </div>
          <div className="sim-legend-row tabular">
            <span className="sim-legend-pill sim-legend-pill--solid">≥38% sólida</span>
            <span className="sim-legend-pill sim-legend-pill--warn">26–37% alerta</span>
            <span className="sim-legend-pill sim-legend-pill--danger">&lt;26% crítica</span>
          </div>
        </div>

        <div className="sim-table-scroll">
          <table key={`${viewMode}-${onboardingBoost}`} className="sim-table tabular">
            <thead>
              <tr>
                <th>Cohorte</th>
                <th className="num">Usuarios</th>
                <th className="num">Mes 0</th>
                <th className="num">Mes 1</th>
                <th className="num">Mes 2</th>
                <th className="num">Mes 3</th>
                <th className="num">Mes 6</th>
                <th className="num">LTV</th>
                <th className="num">Payback</th>
              </tr>
            </thead>
            <tbody>
              {viewMode === 'blended' ? (
                <tr className="row-duplicated anim-row-stagger">
                  <td>
                    <strong>Promedio mezclado (Ene–Mar)</strong>
                  </td>
                  <td className="num">{blendedRow.totalUsers.toLocaleString('en-US')}</td>
                  <td className={getRetentionCellClass(blendedRow.m0, true)}>
                    {blendedRow.m0.toFixed(1)}%
                  </td>
                  <td className={getRetentionCellClass(blendedRow.m1)}>
                    {blendedRow.m1.toFixed(1)}%
                  </td>
                  <td className={getRetentionCellClass(blendedRow.m2)}>
                    {blendedRow.m2.toFixed(1)}%
                  </td>
                  <td className={getRetentionCellClass(blendedRow.m3)}>
                    {blendedRow.m3.toFixed(1)}%
                  </td>
                  <td className={getRetentionCellClass(blendedRow.m6)}>
                    {blendedRow.m6.toFixed(1)}%
                  </td>
                  <td className="num">
                    <strong>${blendedRow.ltvUsd}</strong>
                  </td>
                  <td className="num">{blendedRow.paybackMonths} m</td>
                </tr>
              ) : (
                cohortData.map((row) => (
                  <tr key={row.id} className="anim-row-stagger">
                    <td>
                      <strong>{row.name}</strong>
                    </td>
                    <td className="num">{row.users.toLocaleString('en-US')}</td>
                    <td className={getRetentionCellClass(row.m0, true)}>
                      {row.m0.toFixed(1)}%
                    </td>
                    <td className={getRetentionCellClass(row.m1)}>{row.m1.toFixed(1)}%</td>
                    <td className={getRetentionCellClass(row.m2)}>
                      {row.m2 !== null ? `${row.m2.toFixed(1)}%` : 'En curso'}
                    </td>
                    <td className={getRetentionCellClass(row.m3)}>
                      {row.m3 !== null ? `${row.m3.toFixed(1)}%` : 'En curso'}
                    </td>
                    <td className={getRetentionCellClass(row.m6)}>
                      {row.m6 !== null ? `${row.m6.toFixed(1)}%` : 'En curso'}
                    </td>
                    <td
                      className={`num ${
                        row.ltvUsd >= cacUsd * 2 ? 'sim-text-success' : 'sim-text-danger'
                      }`}
                    >
                      ${row.ltvUsd}
                    </td>
                    <td
                      className={`num ${
                        row.paybackMonths <= 6.0 ? 'sim-text-success' : 'sim-text-muted'
                      }`}
                    >
                      {row.paybackMonths} m
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sim-two-col">
        <div className="sim-panel tabular">
          <div className="sim-panel__header">
            <div className="sim-panel__title">
              Curva de supervivencia S(t) (+{onboardingBoost}% onboarding)
            </div>
            <div className="sim-legend-row">
              <span className="sim-text-success">
                ● Enero +{onboardingBoost}% ({cohortData[0].m6}% M6)
              </span>
              <span className="sim-text-muted">-- Base (22.0% M6)</span>
              <span className="sim-text-danger">
                ▲ Febrero ({cohortData[1].m3}% M3)
              </span>
            </div>
          </div>

          <svg
            viewBox="0 0 540 156"
            className="sim-chart-svg"
            role="img"
            aria-label="Gráfico de curva de supervivencia por cohorte"
          >
            {[100, 75, 50, 25, 0].map((pct) => {
              const y = survivalCurvePoints.yFromPct(pct);
              return (
                <g key={pct}>
                  <line
                    x1="42"
                    y1={y}
                    x2="510"
                    y2={y}
                    stroke={pct === 25 ? 'var(--line-strong)' : 'var(--line)'}
                    strokeDasharray={pct === 25 ? '4 3' : undefined}
                    strokeWidth="1"
                  />
                  <text x="10" y={y + 4} fontSize="10" fill="var(--ink-2)">
                    {pct}%
                  </text>
                </g>
              );
            })}

            <text
              x="340"
              y={survivalCurvePoints.yFromPct(30) - 4}
              fontSize="9.5"
              fill="var(--ok)"
              fontWeight="600"
            >
              Asíntota rentable (≥ 30%)
            </text>

            <polyline
              fill="none"
              stroke="var(--ink-3)"
              strokeWidth="2"
              strokeDasharray="4 4"
              points={survivalCurvePoints.baseLine}
            />

            <polyline
              fill="none"
              stroke="var(--bad)"
              strokeWidth="2"
              points={survivalCurvePoints.febLine}
            />

            <polyline
              fill="none"
              stroke="var(--ok)"
              strokeWidth="3"
              points={survivalCurvePoints.boostedLine}
            />

            {survivalCurvePoints.boostedJanPcts.map((pct, idx) => {
              const cx = survivalCurvePoints.xCoords[idx];
              const cy = survivalCurvePoints.yFromPct(pct);
              return (
                <g key={idx}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r="4"
                    fill="var(--ok)"
                    stroke="var(--surface)"
                    strokeWidth="1.5"
                  />
                  <text
                    x={cx}
                    y={cy - 7}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight="600"
                    fill="var(--ok)"
                  >
                    {pct.toFixed(1)}%
                  </text>
                </g>
              );
            })}

            {['Mes 0', 'Mes 1', 'Mes 2', 'Mes 3', 'Mes 6'].map((label, idx) => (
              <text
                key={label}
                x={survivalCurvePoints.xCoords[idx]}
                y="148"
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                fill="var(--ink-2)"
              >
                {label}
              </text>
            ))}
          </svg>
        </div>

        <div className="sim-comparison-card">
          <div className="sim-comparison-card__title">
            Comparación de LTV estimado por cohorte frente a CAC ($120 USD)
          </div>
          <div className="sim-comparison-bars">
            <div className="sim-bar-row">
              <div className="sim-bar-header">
                <span className="sim-bar-label">
                  Febrero (campaña masiva · M1: {cohortData[1].m1}%)
                </span>
                <span className="sim-bar-value">
                  ${cohortData[1].ltvUsd} LTV · Payback {cohortData[1].paybackMonths} m
                </span>
              </div>
              <div className="sim-bar-track">
                <div
                  className="sim-bar-fill sim-bar-fill--danger"
                  data-pct={febLtvPct}
                />
              </div>
            </div>
            <div className="sim-bar-row">
              <div className="sim-bar-header">
                <span className="sim-bar-label">
                  Marzo (onboarding guiado · M1: {cohortData[2].m1}%)
                </span>
                <span className="sim-bar-value">
                  ${cohortData[2].ltvUsd} LTV · Payback {cohortData[2].paybackMonths} m
                </span>
              </div>
              <div className="sim-bar-track">
                <div
                  className="sim-bar-fill sim-bar-fill--success"
                  data-pct={marLtvPct}
                />
              </div>
            </div>
          </div>

          <div className="sim-panel__header">
            <button
              type="button"
              className="viz-toggle-btn"
              aria-expanded={showMaterializationSql}
              onClick={() => setShowMaterializationSql((prev) => !prev)}
            >
              <Code2 size={14} aria-hidden="true" />
              {showMaterializationSql
                ? 'Ocultar SQL de materialización (dbt / DuckDB)'
                : 'Ver SQL de materialización de cohortes (DE)'}
            </button>
          </div>

          {showMaterializationSql && (
            <pre className="code-block-dark tabular">
{`-- Grano: (cohort_month, period_number)
WITH user_first_seen AS (
  SELECT user_id, DATE_TRUNC('month', MIN(event_ts)) AS cohort_month
  FROM silver.fact_events GROUP BY user_id
)
SELECT
  u.cohort_month,
  DATE_DIFF('month', u.cohort_month, DATE_TRUNC('month', e.event_ts)) AS period_number,
  COUNT(DISTINCT e.user_id) AS retained_users
FROM silver.fact_events e
JOIN user_first_seen u ON e.user_id = u.user_id
GROUP BY 1, 2;`}
            </pre>
          )}
        </div>
      </div>
    </SimulatorFrame>
  );
}

export default CohortRetentionSim;
