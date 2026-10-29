import React, { useState, useEffect, useCallback } from 'react';
import { Play, CheckCircle2, RotateCcw, Lightbulb, Eye, EyeOff, MessageSquare, AlertTriangle } from 'lucide-react';
import { SqlEditor } from './SqlEditor.jsx';
import { ensureDuckDB, runSqlQuery, subscribeDuckDBState, getDuckDBState } from './duckdb.js';
import { gradeSqlPractice } from './sqlGrader.js';
import { openTutor, solvePractice } from '../state/store.js';
import '../styles/views/lab.css';

function isNumericColumnType(typeStr = '', sampleVal = undefined) {
  const upper = String(typeStr).toUpperCase();
  if (
    upper.includes('INT') ||
    upper.includes('DOUBLE') ||
    upper.includes('FLOAT') ||
    upper.includes('DECIMAL') ||
    upper.includes('NUMERIC') ||
    upper.includes('REAL')
  ) {
    return true;
  }
  return typeof sampleVal === 'number';
}

function formatCellValue(val, isNumeric = false) {
  if (val === null || val === undefined) {
    return <span className="sql-null-pill">NULL</span>;
  }
  if (typeof val === 'boolean') {
    return val ? 'true' : 'false';
  }
  if (isNumeric && typeof val === 'number' && Number.isFinite(val)) {
    if (Number.isInteger(val)) {
      return String(val);
    }
    return Number(val.toFixed(4)).toString();
  }
  return String(val);
}

function MiniDiffTable({ rows, columns }) {
  if (!rows || rows.length === 0) return null;
  const colNames = columns && columns.length > 0 ? columns : Object.keys(rows[0] || {});
  return (
    <table className="sql-results-table">
      <thead>
        <tr>
          {colNames.map((col) => (
            <th key={col}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, rIdx) => (
          <tr key={rIdx}>
            {colNames.map((col) => {
              const v = r[col];
              const num = typeof v === 'number';
              return (
                <td key={col} className={num ? 'is-numeric' : ''}>
                  {formatCellValue(v, num)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function SqlLab({
  lessonId = null,
  title = 'Laboratorio SQL sobre Mercado Brisa',
  prompt = '',
  starterCode = 'SELECT * FROM orders LIMIT 10;',
  practice = null,
  mode = 'practice', // 'practice' | 'free'
  externalCode = null,
  onExternalCodeConsumed = null,
  onSolve = null,
}) {
  const initialSql = practice?.starterCode || starterCode || 'SELECT * FROM orders LIMIT 10;';
  const [code, setCode] = useState(initialSql);
  const [engineState, setEngineState] = useState(() => getDuckDBState());
  const [loadingElapsedMs, setLoadingElapsedMs] = useState(0);
  const [showSlowInitNotice, setShowSlowInitNotice] = useState(false);

  const [isRunning, setIsRunning] = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [gradeReport, setGradeReport] = useState(null);
  const [revealedHints, setRevealedHints] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  const hasGradingTarget = Boolean(
    mode === 'practice' && practice && (practice.expected || practice.solution)
  );
  const hints = Array.isArray(practice?.hints) ? practice.hints : [];

  // Reset state when switching lesson or starterCode
  useEffect(() => {
    const nextStarter = practice?.starterCode || starterCode || 'SELECT * FROM orders LIMIT 10;';
    setCode(nextStarter);
    setQueryResult(null);
    setErrorMessage(null);
    setGradeReport(null);
    setRevealedHints(0);
    setShowSolution(false);
  }, [lessonId, practice?.starterCode, starterCode]);

  // Allow PracticeView schema explorer to inject a query or table snippet
  useEffect(() => {
    if (externalCode) {
      setCode(externalCode);
      if (onExternalCodeConsumed) {
        onExternalCodeConsumed();
      }
    }
  }, [externalCode, onExternalCodeConsumed]);

  // Trigger lazy DuckDB-Wasm initialization on mount
  useEffect(() => {
    const unsub = subscribeDuckDBState((st) => {
      setEngineState(st);
    });
    ensureDuckDB().catch(() => {
      // handled via engineState.error
    });
    return unsub;
  }, []);

  // Track loading time > 300ms for "Preparando el motor SQL…" counter
  useEffect(() => {
    if (engineState.status !== 'loading') {
      setShowSlowInitNotice(false);
      return undefined;
    }

    const start = engineState.startedAt || (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const timer = setInterval(() => {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const elapsed = Math.max(0, Math.round(now - start));
      setLoadingElapsedMs(elapsed);
      if (elapsed > 300) {
        setShowSlowInitNotice(true);
      }
    }, 60);

    return () => clearInterval(timer);
  }, [engineState.status, engineState.startedAt]);

  const handleExecute = useCallback(
    async (sqlToRun = code) => {
      setIsRunning(true);
      setErrorMessage(null);
      setGradeReport(null);
      try {
        const res = await runSqlQuery(sqlToRun, { maxRows: 200 });
        setQueryResult(res);
      } catch (err) {
        setQueryResult(null);
        setErrorMessage(err?.message || String(err));
      } finally {
        setIsRunning(false);
      }
    },
    [code]
  );

  const handleGrade = useCallback(async () => {
    if (!hasGradingTarget) {
      await handleExecute(code);
      return;
    }
    setIsRunning(true);
    setErrorMessage(null);
    try {
      const userRes = await runSqlQuery(code, { maxRows: 200 });
      setQueryResult(userRes);
      const report = await gradeSqlPractice(code, practice, userRes);
      setGradeReport(report);
      if (report.passed) {
        if (lessonId) {
          solvePractice(lessonId, {
            passed: true,
            mode: 'sql',
            code,
            rowCount: userRes.totalRows,
            elapsedMs: userRes.elapsedMs,
          });
        }
        if (onSolve) {
          onSolve();
        }
      }
    } catch (err) {
      setQueryResult(null);
      setGradeReport(null);
      setErrorMessage(err?.message || String(err));
    } finally {
      setIsRunning(false);
    }
  }, [code, handleExecute, hasGradingTarget, lessonId, onSolve, practice]);

  const handleExplainError = () => {
    if (!errorMessage) return;
    openTutor({
      mode: 'explain-error',
      lessonId,
      code,
      result: errorMessage,
    });
  };

  const handleReviewSql = () => {
    const serializedResult = errorMessage
      ? { error: errorMessage }
      : queryResult
        ? {
            columns: queryResult.columns,
            totalRows: queryResult.totalRows,
            sampleRows: queryResult.rows.slice(0, 10),
            gradePassed: gradeReport?.passed ?? null,
            gradeSummary: gradeReport?.summary ?? null,
          }
        : null;

    openTutor({
      mode: 'review-sql',
      lessonId,
      code,
      result: serializedResult,
    });
  };

  const handleReset = () => {
    setCode(initialSql);
    setErrorMessage(null);
    setGradeReport(null);
  };

  return (
    <section className="sql-lab" data-testid="sql-lab">
      <header className="sql-lab-header">
        <div className="sql-lab-title-group">
          <span className="sql-lab-kicker">
            {mode === 'free' ? 'DuckDB-Wasm · Mercado Brisa' : 'Práctica SQL ejecutable'}
          </span>
          <h3 className="sql-lab-title">{practice?.title || title}</h3>
          {(practice?.prompt || prompt) && (
            <p className="sql-lab-prompt">{practice?.prompt || prompt}</p>
          )}
        </div>

        <div
          className={`sql-lab-engine-pill ${
            engineState.status === 'ready'
              ? 'is-ready'
              : engineState.status === 'error'
                ? 'is-error'
                : 'is-loading'
          }`}
          data-testid="sql-engine-status"
        >
          {engineState.status === 'ready' && (
            <span>Motor SQL listo ({engineState.coldInitMs} ms)</span>
          )}
          {engineState.status === 'loading' && (
            <span>
              {showSlowInitNotice
                ? `Preparando el motor SQL… ${(loadingElapsedMs / 1000).toFixed(1)} s`
                : 'Preparando el motor SQL…'}
            </span>
          )}
          {engineState.status === 'idle' && <span>Motor SQL en espera</span>}
          {engineState.status === 'error' && <span>Error al iniciar DuckDB</span>}
        </div>
      </header>

      <SqlEditor
        value={code}
        onChange={setCode}
        onExecute={handleExecute}
        placeholder="SELECT * FROM orders LIMIT 10;"
      />

      <div className="sql-lab-toolbar">
        <div className="sql-lab-actions-left">
          <button
            type="button"
            className="sql-btn sql-btn-primary"
            onClick={() => handleExecute(code)}
            disabled={isRunning}
            data-testid="sql-run-btn"
          >
            <Play size={14} />
            <span>Ejecutar consulta</span>
            <kbd className="sql-kbd-hint">Ctrl+Enter</kbd>
          </button>

          {hasGradingTarget && (
            <button
              type="button"
              className="sql-btn sql-btn-secondary"
              onClick={handleGrade}
              disabled={isRunning}
              data-testid="sql-grade-btn"
            >
              <CheckCircle2 size={14} />
              <span>Comprobar resultado</span>
            </button>
          )}

          <button
            type="button"
            className="sql-btn sql-btn-ghost"
            onClick={handleReset}
            disabled={isRunning}
            data-testid="sql-reset-btn"
          >
            <RotateCcw size={14} />
            <span>Reiniciar código</span>
          </button>
        </div>

        <div className="sql-lab-actions-right">
          {hints.length > 0 && revealedHints < hints.length && (
            <button
              type="button"
              className="sql-btn sql-btn-ghost"
              onClick={() => setRevealedHints((n) => Math.min(hints.length, n + 1))}
              data-testid="sql-hint-btn"
            >
              <Lightbulb size={14} />
              <span>Ver pista ({revealedHints}/{hints.length})</span>
            </button>
          )}

          {practice?.solution && (
            <button
              type="button"
              className="sql-btn sql-btn-ghost"
              onClick={() => setShowSolution((v) => !v)}
              data-testid="sql-solution-btn"
            >
              {showSolution ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>{showSolution ? 'Ocultar solución' : 'Ver solución'}</span>
            </button>
          )}

          <button
            type="button"
            className="sql-btn sql-btn-secondary"
            onClick={handleReviewSql}
            data-testid="sql-review-ai-btn"
          >
            <MessageSquare size={14} />
            <span>Revisar mi consulta con IA</span>
          </button>
        </div>
      </div>

      {revealedHints > 0 && (
        <div className="sql-hints-box" data-testid="sql-hints-box">
          {hints.slice(0, revealedHints).map((hint, idx) => (
            <p key={idx} className="sql-hint-item">
              <strong>Pista {idx + 1}:</strong> {hint}
            </p>
          ))}
        </div>
      )}

      {showSolution && practice?.solution && (
        <div className="sql-solution-box" data-testid="sql-solution-box">
          <div className="sql-grade-header">
            <span className="sql-grade-title">Consulta de referencia</span>
            <button
              type="button"
              className="sql-btn sql-btn-secondary"
              onClick={() => setCode(practice.solution)}
            >
              <span>Copiar al editor</span>
            </button>
          </div>
          <pre className="sql-solution-pre">
            <code>{practice.solution}</code>
          </pre>
          {practice.solutionExplanation && (
            <p className="sql-solution-explanation">{practice.solutionExplanation}</p>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="sql-error-box" role="alert" data-testid="sql-error-box">
          <div className="sql-error-header">
            <span>
              <AlertTriangle size={14} style={{ verticalAlign: 'text-bottom', marginRight: '0.375rem' }} />
              Error de ejecución en DuckDB
            </span>
          </div>
          <pre className="sql-error-pre" data-testid="sql-error-message">
            {errorMessage}
          </pre>
          <div>
            <button
              type="button"
              className="sql-btn sql-btn-secondary"
              onClick={handleExplainError}
              data-testid="sql-explain-error-btn"
            >
              <MessageSquare size={14} />
              <span>Explícame este error</span>
            </button>
          </div>
        </div>
      )}

      {gradeReport && (
        <div
          className={`sql-grade-box ${gradeReport.passed ? 'is-pass' : 'is-fail'}`}
          data-testid="sql-grade-box"
        >
          <div className="sql-grade-header">
            <span className="sql-grade-title">
              {gradeReport.passed
                ? 'Práctica superada · El resultado coincide con la referencia'
                : 'El resultado aún no coincide con la referencia'}
            </span>
          </div>
          <p className="sql-grade-summary">{gradeReport.summary}</p>

          {!gradeReport.passed &&
            (gradeReport.missingRows?.length > 0 || gradeReport.extraRows?.length > 0) && (
              <div className="sql-diff-grid">
                {gradeReport.missingRows?.length > 0 && (
                  <div className="sql-diff-card" data-testid="sql-missing-rows">
                    <h4 className="sql-diff-card-title">
                      Filas esperadas que faltan (máx. 5)
                    </h4>
                    <MiniDiffTable
                      rows={gradeReport.missingRows}
                      columns={gradeReport.expectedColumns}
                    />
                  </div>
                )}
                {gradeReport.extraRows?.length > 0 && (
                  <div className="sql-diff-card" data-testid="sql-extra-rows">
                    <h4 className="sql-diff-card-title">
                      Filas sobrantes en tu consulta (máx. 5)
                    </h4>
                    <MiniDiffTable
                      rows={gradeReport.extraRows}
                      columns={gradeReport.actualColumns}
                    />
                  </div>
                )}
              </div>
            )}
        </div>
      )}

      {queryResult && (
        <div className="sql-results-panel" data-testid="sql-results-panel">
          <div className="sql-results-meta">
            <div className="sql-results-meta-badges">
              <span data-testid="sql-row-count">
                {queryResult.totalRows.toLocaleString('es-ES')}{' '}
                {queryResult.totalRows === 1 ? 'fila' : 'filas'}
              </span>
              <span data-testid="sql-elapsed-ms">{queryResult.elapsedMs} ms</span>
              <span>{queryResult.columns.length} columnas</span>
            </div>
            {queryResult.truncated && (
              <span className="sql-results-truncation" data-testid="sql-truncation-notice">
                Mostrando {queryResult.maxRows} de {queryResult.totalRows.toLocaleString('es-ES')} filas
              </span>
            )}
          </div>

          <div className="sql-table-scroll">
            <table className="sql-results-table" data-testid="sql-results-table">
              <thead>
                <tr>
                  {queryResult.columns.map((col) => {
                    const sampleVal = queryResult.rows[0]?.[col.name];
                    const isNum = isNumericColumnType(col.type, sampleVal);
                    return (
                      <th key={col.name} className={isNum ? 'is-numeric' : ''}>
                        <span>{col.name}</span>
                        <span className="sql-col-type">{col.type}</span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {queryResult.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={Math.max(1, queryResult.columns.length)}
                      style={{ textAlign: 'center', padding: 'var(--sp-4)', color: 'var(--ink-3)' }}
                    >
                      La consulta se ejecutó sin errores pero devolvió 0 filas.
                    </td>
                  </tr>
                ) : (
                  queryResult.rows.map((row, rIdx) => {
                    const animateRow = rIdx < 12;
                    return (
                      <tr
                        key={rIdx}
                        className={animateRow ? 'sql-row-stagger' : ''}
                        style={animateRow ? { animationDelay: `${rIdx * 15}ms` } : undefined}
                      >
                        {queryResult.columns.map((col) => {
                          const cellVal = row[col.name];
                          const isNum = isNumericColumnType(col.type, cellVal);
                          return (
                            <td key={col.name} className={isNum ? 'is-numeric' : ''}>
                              {formatCellValue(cellVal, isNum)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

export default SqlLab;
