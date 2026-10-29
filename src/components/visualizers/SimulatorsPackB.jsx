import React, { useState, useMemo } from 'react';
import { BarChart3, Code2, RotateCcw } from 'lucide-react';
import { Button } from '../ui/index.js';

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

export function CohortRetentionSim() {
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
        name: 'Cohorte Enero 2026',
        channelNote: 'Tráfico orgánico + búsqueda',
        users: 1200,
        baseM1: 42.0,
        baseM2: 31.0,
        baseM3: 26.5,
        baseM6: 22.0,
        maturedStage: 6,
      },
      {
        id: 'febrero',
        name: 'Cohorte Febrero 2026',
        channelNote: 'Campaña pagada masiva (baja activación)',
        users: 3400,
        baseM1: 29.0,
        baseM2: 19.5,
        baseM3: 15.0,
        baseM6: null,
        maturedStage: 3,
      },
      {
        id: 'marzo',
        name: 'Cohorte Marzo 2026',
        channelNote: 'Nuevo flujo guiado de activación',
        users: 2100,
        baseM1: 48.0,
        baseM2: 39.0,
        baseM3: null,
        baseM6: null,
        maturedStage: 2,
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
    const yFromPct = (pct) => 140 - (pct / 100) * 116;

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

  return (
    <div className="sim-frame viz-card" data-stage="5">
      <div className="sim-frame__header">
        <div className="sim-frame__title-group">
          <span className="sim-frame__stage-icon" aria-hidden="true">
            <BarChart3 size={18} />
          </span>
          <div className="sim-frame__headings">
            <div className="sim-frame__kicker">Etapa 5 · Análisis de Supervivencia y LTV</div>
            <h3 className="sim-frame__title">
              Matriz Triangular de Retención por Cohortes y Curva de Supervivencia
            </h3>
            <p className="sim-frame__desc">
              Compara la <strong>Vista Global Mezclada</strong> frente al{' '}
              <strong>Desglose por Cohorte de Adquisición (Enero, Febrero, Marzo)</strong> y ajusta
              la <strong>Mejora de Onboarding Día 7 (+0% a +15%)</strong> para observar cómo se
              aplana la curva de supervivencia y cambia el retorno sobre CAC.
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
        <div className="sim-segmented" role="group" aria-label="Modo de vista de cohortes">
          <button
            type="button"
            className={`sim-segmented__btn ${
              viewMode === 'blended' ? 'sim-segmented__btn--active-danger' : ''
            }`}
            onClick={() => setViewMode('blended')}
          >
            Vista Global Mezclada
          </button>
          <button
            type="button"
            className={`sim-segmented__btn ${
              viewMode === 'cohorts' ? 'sim-segmented__btn--active' : ''
            }`}
            onClick={() => setViewMode('cohorts')}
          >
            Desglose por Cohorte de Adquisición (Enero, Febrero, Marzo)
          </button>
        </div>

        <label className="sim-slider-box tabular">
          <span>
            Mejora de Onboarding Día 7 (+0% a +15%):{' '}
            <strong className="sim-text-success">
              +{onboardingBoost}% en activación temprana
            </strong>
          </span>
          <input
            type="range"
            min="0"
            max="15"
            step="1"
            value={onboardingBoost}
            onChange={(e) => setOnboardingBoost(Number(e.target.value))}
            aria-label="Mejora de Onboarding Día 7 (+0% a +15%)"
          />
          <span className="sim-slider-caption">
            Desliza de +0% a +15% para simular el impacto de guiar al usuario a su primer hábito de
            valor antes del día 7.
          </span>
        </label>
      </div>

      <div className="sim-frame__body">
        <div className="sim-two-col tabular">
          <div className="sim-metric-box">
            <div className="sim-metric-title">Costo de Adquisición (CAC)</div>
            <div className="sim-metric-nums">
              <strong>${cacUsd} USD</strong> fijo por usuario
            </div>
          </div>
          <div
            className={`sim-metric-box ${
              blendedRow.ltvUsd >= cacUsd * 2 ? 'box-ok' : 'box-danger'
            }`}
          >
            <div className="sim-metric-title">Ratio LTV / CAC Promedio</div>
            <div className="sim-metric-nums">
              <strong>{(blendedRow.ltvUsd / cacUsd).toFixed(1)}x</strong> (${blendedRow.ltvUsd} USD
              LTV)
            </div>
          </div>
        </div>

        <div className="sim-panel">
          <div className="sim-panel__header">
            <div className="sim-panel__title">
              {viewMode === 'blended'
                ? 'Tabla Colapsada: Vista Global Mezclada (Oculta el deterioro de Febrero y la censura de meses recientes)'
                : 'Mapa de Calor Triangular por Cohorte de Adquisición (Observa el escalón diagonal de maduración)'}
            </div>
            <div className="sim-legend-row tabular">
              <span className="sim-legend-pill sim-legend-pill--solid">≥38% Estable/Sólida</span>
              <span className="sim-legend-pill sim-legend-pill--warn">26–37% Alerta</span>
              <span className="sim-legend-pill sim-legend-pill--danger">&lt;26% Fuga Crítica</span>
            </div>
          </div>

          <div className="sim-table-scroll">
            <table key={`${viewMode}-${onboardingBoost}`} className="sim-table tabular">
              <thead>
                <tr>
                  <th>Cohorte de Adquisición</th>
                  <th className="num">Usuarios (N)</th>
                  <th className="num">Mes 0</th>
                  <th className="num">Mes 1</th>
                  <th className="num">Mes 2</th>
                  <th className="num">Mes 3</th>
                  <th className="num">Mes 6</th>
                  <th className="num">LTV estimado</th>
                  <th className="num">Payback CAC</th>
                </tr>
              </thead>
              <tbody>
                {viewMode === 'blended' ? (
                  <tr className="row-duplicated row-flash">
                    <td>
                      <strong>Promedio Global Mezclado (Ene–Mar)</strong>
                      <div className="sim-subnote sim-subnote--danger">
                        Mezcla usuarios de 1 mes de antigüedad con usuarios de 6 meses
                      </div>
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
                      <strong>${blendedRow.ltvUsd} USD</strong>
                    </td>
                    <td className="num">{blendedRow.paybackMonths} meses</td>
                  </tr>
                ) : (
                  cohortData.map((row) => (
                    <tr key={row.id} className="row-flash">
                      <td>
                        <strong>{row.name}</strong>
                        <div className="sim-subnote">{row.channelNote}</div>
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
                        ${row.ltvUsd} USD
                      </td>
                      <td
                        className={`num ${
                          row.paybackMonths <= 6.0 ? 'sim-text-success' : 'sim-text-muted'
                        }`}
                      >
                        {row.paybackMonths} meses
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="sim-comparison-card">
          <div className="sim-comparison-card__title">
            Comparación de LTV Estimado por Cohorte frente a CAC ($120 USD)
          </div>
          <div className="sim-comparison-bars">
            <div className="sim-bar-row">
              <div className="sim-bar-header">
                <span className="sim-bar-label">
                  Cohorte Febrero (Campaña masiva · M1: {cohortData[1].m1}%)
                </span>
                <span className="sim-bar-value">
                  ${cohortData[1].ltvUsd} USD LTV · Payback {cohortData[1].paybackMonths} meses
                </span>
              </div>
              <div className="sim-bar-track">
                <div
                  className="sim-bar-fill sim-bar-fill--danger"
                  style={{ '--bar-pct': `${febLtvPct}%` }}
                />
              </div>
            </div>
            <div className="sim-bar-row">
              <div className="sim-bar-header">
                <span className="sim-bar-label">
                  Cohorte Marzo (Onboarding guiado · M1: {cohortData[2].m1}%)
                </span>
                <span className="sim-bar-value">
                  ${cohortData[2].ltvUsd} USD LTV · Payback {cohortData[2].paybackMonths} meses
                </span>
              </div>
              <div className="sim-bar-track">
                <div
                  className="sim-bar-fill sim-bar-fill--success"
                  style={{ '--bar-pct': `${marLtvPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="sim-panel tabular">
          <div className="sim-panel__header">
            <div className="sim-panel__title">
              Curva de Supervivencia S(t) y Aplanamiento de Asíntota (Efecto Onboarding +
              {onboardingBoost}%)
            </div>
            <div className="sim-legend-row">
              <span className="sim-text-success">
                ● Cohorte Enero con +{onboardingBoost}% Onboarding ({cohortData[0].m6}% en Mes 6)
              </span>
              <span className="sim-text-muted">-- Línea Base sin Mejora (22.0% en Mes 6)</span>
              <span className="sim-text-danger">
                ▲ Cohorte Febrero (Campaña masiva: {cohortData[1].m3}% en Mes 3)
              </span>
            </div>
          </div>

          <svg
            viewBox="0 0 540 168"
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
                    stroke={pct === 25 ? 'var(--border)' : 'var(--surface-2)'}
                    strokeDasharray={pct === 25 ? '4 3' : undefined}
                    strokeWidth="1"
                  />
                  <text x="10" y={y + 4} fontSize="10" fill="var(--text-2)">
                    {pct}%
                  </text>
                </g>
              );
            })}

            <text
              x="345"
              y={survivalCurvePoints.yFromPct(30) - 4}
              fontSize="9.5"
              fill="var(--success)"
              fontWeight="600"
            >
              Umbral de aplanamiento rentable (PMF ≥ 30%)
            </text>

            <polyline
              fill="none"
              stroke="var(--border)"
              strokeWidth="2"
              strokeDasharray="4 4"
              points={survivalCurvePoints.baseLine}
            />

            <polyline
              fill="none"
              stroke="var(--danger)"
              strokeWidth="2"
              points={survivalCurvePoints.febLine}
            />

            <polyline
              fill="none"
              stroke="var(--success)"
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
                    r="4.5"
                    fill="var(--success)"
                    stroke="var(--surface)"
                    strokeWidth="1.5"
                  />
                  <text
                    x={cx}
                    y={cy - 8}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="var(--success)"
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
                y="158"
                textAnchor="middle"
                fontSize="10.5"
                fontWeight="600"
                fill="var(--text-2)"
              >
                {label}
              </text>
            ))}
          </svg>
        </div>

        <div
          className={`viz-result-banner ${viewMode === 'blended' ? 'danger' : 'success'} tabular`}
        >
          {viewMode === 'blended' ? (
            <>
              <div className="viz-banner-title">
                Trampa de la Vista Global Mezclada: Oculta la caída de Febrero y distorsiona el Mes
                6
              </div>
              <p>
                Al promediar todas las cohortes en una sola fila, el{' '}
                <strong>Mes 1 ({blendedRow.m1}%)</strong> parece mediocre porque mezcla la campaña
                masiva de Febrero (3,400 usuarios con baja retención) con Marzo (alta retención),
                mientras que el <strong>Mes 6 ({blendedRow.m6}%)</strong> solo refleja a los
                usuarios de Enero porque Febrero y Marzo aún no cumplen 6 meses.
              </p>
            </>
          ) : (
            <>
              <div className="viz-banner-title">
                Lectura Diagonal y Longitudinal Correcta (+{onboardingBoost}% Onboarding Día 7)
              </div>
              <p>
                Al separar por cohorte de adquisición se revela la verdad: <strong>Febrero</strong>{' '}
                trajo volumen pero con un Payback lento de{' '}
                <strong>{cohortData[1].paybackMonths} meses</strong>, mientras que{' '}
                <strong>Marzo</strong> arrancó en <strong>{cohortData[2].m1}% en Mes 1</strong>{' '}
                gracias al nuevo onboarding, elevando su LTV estimado a{' '}
                <strong>${cohortData[2].ltvUsd} USD</strong>.
              </p>
            </>
          )}
        </div>

        <div className="triad-roles-grid tabular">
          <div className="triad-role-card">
            <span className="role-badge DE">DE · Ingeniería de Datos</span>
            <h4>Materialización de la Tabla de Cohortes</h4>
            <ul>
              <li>
                Calcula una sola vez <code>cohort_month = DATE_TRUNC(&apos;month&apos;, MIN(event_date))</code>{' '}
                por <code>user_id</code> y persiste la tabla agregada{' '}
                <code>mart_cohort_retention</code> en Parquet/Iceberg.
              </li>
              <li>
                Deriva el índice entero{' '}
                <code>period_number = DATE_DIFF(&apos;month&apos;, cohort_month, activity_month)</code> para
                evitar costosos <code>SELF JOIN</code> sobre miles de millones de eventos crudos en
                el dashboard.
              </li>
            </ul>
          </div>

          <div className="triad-role-card">
            <span className="role-badge DA">DA · Análisis y Estadística</span>
            <h4>Aplanamiento de la Curva de Supervivencia</h4>
            <ul>
              <li>
                Evalúa si la curva <em>S(t)</em> converge a una asíntota horizontal (ej.{' '}
                <strong>{cohortData[0].m6}% en Mes 6</strong>) en vez de caer hacia 0%.
              </li>
              <li>
                Controla la <strong>censura a la derecha</strong>: las celdas <em>En curso</em> de
                Febrero y Marzo no son ceros; incluirlas como 0% hundiría artificialmente la
                retención a largo plazo.
              </li>
            </ul>
          </div>

          <div className="triad-role-card">
            <span className="role-badge BI">BI · LTV / CAC y Payback Period</span>
            <h4>Economía Unitaria por Cohorte</h4>
            <ul>
              <li>
                Con un CAC de <strong>${cacUsd} USD</strong>, subir la activación Día 7 en{' '}
                <strong>+{onboardingBoost}%</strong> eleva el LTV de Enero a{' '}
                <strong>${cohortData[0].ltvUsd} USD</strong> y reduce el Payback a{' '}
                <strong>{cohortData[0].paybackMonths} meses</strong>.
              </li>
              <li>
                Permite cortar presupuesto a canales con LTV/CAC &lt; 3.0x (como Febrero sin
                onboarding) antes de quemar caja.
              </li>
            </ul>
          </div>
        </div>

        <div className="sim-panel__header">
          <button
            type="button"
            className="viz-toggle-btn"
            onClick={() => setShowMaterializationSql((prev) => !prev)}
          >
            <Code2 size={14} />
            {showMaterializationSql
              ? 'Ocultar SQL de Materialización de Cohortes (DE / dbt)'
              : 'Ver cómo DE materializa esta matriz triangular en SQL (DuckDB / Iceberg)'}
          </button>
          <span className="sim-slider-caption">
            Grano del modelo: <code>(cohort_month, period_number)</code>
          </span>
        </div>

        {showMaterializationSql && (
          <pre className="code-block-dark tabular">
{`-- Modelo dbt / SQLMesh: mart_cohort_retention.sql
WITH user_first_seen AS (
  SELECT
    user_id,
    DATE_TRUNC('month', MIN(event_timestamp)) AS cohort_month
  FROM silver.fact_user_events
  GROUP BY user_id
),
monthly_active AS (
  SELECT DISTINCT
    e.user_id,
    u.cohort_month,
    DATE_DIFF('month', u.cohort_month, DATE_TRUNC('month', e.event_timestamp)) AS period_number
  FROM silver.fact_user_events e
  INNER JOIN user_first_seen u ON e.user_id = u.user_id
),
cohort_sizes AS (
  SELECT cohort_month, COUNT(*) AS cohort_users
  FROM user_first_seen
  GROUP BY cohort_month
)
SELECT
  m.cohort_month,
  s.cohort_users,
  m.period_number,
  COUNT(DISTINCT m.user_id) AS retained_users,
  ROUND(100.0 * COUNT(DISTINCT m.user_id) / s.cohort_users, 1) AS retention_pct
FROM monthly_active m
INNER JOIN cohort_sizes s ON m.cohort_month = s.cohort_month
GROUP BY m.cohort_month, s.cohort_users, m.period_number
ORDER BY m.cohort_month, m.period_number;`}
          </pre>
        )}
      </div>

      <div className="sim-frame__footer">
        <span className="sim-frame__footer-label">Qué observar:</span>
        <span className="sim-frame__footer-text">
          Separar por cohorte evita mezclar usuarios nuevos con maduros y permite detectar canales
          con baja activación temprana antes de distorsionar el LTV.
        </span>
      </div>
    </div>
  );
}

export default CohortRetentionSim;
