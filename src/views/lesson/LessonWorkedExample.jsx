import React, { useState } from 'react';
import { formatInlineText, isNumericCell } from '../../utils/formatText.jsx';

function normalizeExpectedOutput(expectedOutput) {
  if (!expectedOutput) return null;

  if (Array.isArray(expectedOutput)) {
    if (expectedOutput.length === 0) return null;
    const first = expectedOutput[0];
    if (first && typeof first === 'object' && !Array.isArray(first)) {
      const columns = Object.keys(first);
      const rows = expectedOutput.map((rowObj) =>
        columns.map((col) => rowObj[col] ?? '')
      );
      return { columns, rows };
    }
    return null;
  }

  if (
    typeof expectedOutput === 'object' &&
    Array.isArray(expectedOutput.columns) &&
    expectedOutput.columns.length > 0
  ) {
    const columns = expectedOutput.columns;
    const rawRows = Array.isArray(expectedOutput.rows) ? expectedOutput.rows : [];
    const rows = rawRows.map((r) =>
      Array.isArray(r) ? r : columns.map((c) => r?.[c] ?? '')
    );
    return { columns, rows };
  }

  return null;
}

export function ExpectedOutputTable({ expectedOutput, keyPrefix = 'out' }) {
  const normalized = normalizeExpectedOutput(expectedOutput);
  if (!normalized || normalized.columns.length === 0) {
    return null;
  }

  const { columns, rows } = normalized;

  return (
    <div className="lp-output-block">
      <div className="lp-output-block__head">
        <span className="lp-output-block__label">Resultado en motor SQL</span>
        <span className="lp-output-block__meta tabular">
          {rows.length} {rows.length === 1 ? 'fila' : 'filas'}
        </span>
      </div>
      <div
        className="md-table-scroll"
        role="region"
        aria-label="Tabla de salida esperada"
        tabIndex={0}
      >
        <table className="md-table lp-output-table">
          <thead>
            <tr>
              {columns.map((col, colIdx) => {
                const isNumCol =
                  rows.length > 0 &&
                  rows.every(
                    (r) =>
                      r[colIdx] === null ||
                      r[colIdx] === undefined ||
                      isNumericCell(String(r[colIdx]))
                  );
                return (
                  <th
                    key={`${keyPrefix}-col-${colIdx}`}
                    className={`md-table__th${
                      isNumCol ? ' md-table__th--num tabular' : ''
                    }`}
                  >
                    {col}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={`${keyPrefix}-row-${rowIdx}`}>
                {columns.map((_, colIdx) => {
                  const val = row[colIdx] ?? '';
                  const strVal = String(val);
                  const numeric = isNumericCell(strVal);
                  return (
                    <td
                      key={`${keyPrefix}-cell-${rowIdx}-${colIdx}`}
                      className={`md-table__td${
                        numeric ? ' md-table__td--num tabular' : ''
                      }`}
                    >
                      {strVal}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function InlineCodeExample({ example, sectionId, onAskTutor }) {
  const [copied, setCopied] = useState(false);

  if (!example || !example.code) return null;

  const lang = String(example.language || 'sql').toUpperCase();

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(example.code).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className="lp-code-example">
      <div className="lp-code-example__bar">
        <span className="lp-code-example__lang">{lang}</span>
        <div className="lp-code-example__actions">
          <button
            type="button"
            className="lp-ghost-action"
            onClick={handleCopy}
          >
            {copied ? 'Copiado' : 'Copiar código'}
          </button>
          {onAskTutor ? (
            <button
              type="button"
              className="lp-ghost-action"
              onClick={() =>
                onAskTutor({
                  mode: 'explain-error',
                  sectionId,
                  code: example.code,
                  selection: example.explanation || '',
                  prefill: `Explica línea por línea este bloque ${lang}:\n\n\`\`\`${lang.toLowerCase()}\n${example.code}\n\`\`\``,
                })
              }
            >
              Explicar en el tutor
            </button>
          ) : null}
        </div>
      </div>
      <pre className="lp-code-example__pre">
        <code>{example.code}</code>
      </pre>
      {example.explanation ? (
        <p className="lp-code-example__note">
          {formatInlineText(example.explanation, `ex-note-${sectionId}`)}
        </p>
      ) : null}
      {example.expectedOutput ? (
        <ExpectedOutputTable
          expectedOutput={example.expectedOutput}
          keyPrefix={`ex-out-${sectionId}`}
        />
      ) : null}
    </div>
  );
}

export function LessonWorkedExample({ workedExample, onAskTutor }) {
  const steps = Array.isArray(workedExample?.steps) ? workedExample.steps : [];
  const [activeIdx, setActiveIdx] = useState(0);

  if (steps.length === 0) return null;

  const safeIdx = Math.min(Math.max(activeIdx, 0), steps.length - 1);
  const currentStep = steps[safeIdx];
  const descriptionText = workedExample.description || workedExample.problem || '';

  return (
    <section
      id="sec-ejemplo-guiado"
      data-section-id="ejemplo-guiado"
      className="lp-section lp-worked-example"
      aria-labelledby="lp-worked-title"
    >
      <div className="lp-section__head">
        <div className="lp-section__title-row">
          <span className="lp-section__kicker">Caso aplicado</span>
          <h2 id="lp-worked-title" className="lp-section__title" tabIndex={-1}>
            {workedExample.title || 'Ejemplo paso a paso: antipatrón frente a solución'}
          </h2>
        </div>
      </div>

      {descriptionText ? (
        <p className="lp-worked-example__problem">
          {formatInlineText(descriptionText, 'we-prob')}
        </p>
      ) : null}

      <div className="lp-worked-tabs" role="tablist" aria-label="Pasos del ejemplo guiado">
        {steps.map((step, idx) => {
          const isCurrent = idx === safeIdx;
          const isAntipattern =
            idx === 0 && /antipatr|incorrect|error|trampa/i.test(step.label || '');
          const isSolution =
            idx > 0 && /soluci|correct|verific/i.test(step.label || '');
          return (
            <button
              key={`we-tab-${idx}`}
              type="button"
              role="tab"
              aria-selected={isCurrent}
              className={`lp-worked-tab${isCurrent ? ' is-active' : ''}${
                isAntipattern ? ' is-warn' : ''
              }${isSolution ? ' is-ok' : ''}`}
              onClick={() => setActiveIdx(idx)}
            >
              <span className="lp-worked-tab__num tabular">0{idx + 1}</span>
              <span className="lp-worked-tab__label">
                {step.label || `Paso ${idx + 1}`}
              </span>
            </button>
          );
        })}
      </div>

      <div className="lp-worked-panel" role="tabpanel">
        <div className="lp-worked-panel__header">
          <h3 className="lp-worked-panel__title">
            {currentStep.label || `Paso ${safeIdx + 1}`}
          </h3>
          {onAskTutor && currentStep.code ? (
            <button
              type="button"
              className="lp-ghost-action"
              onClick={() =>
                onAskTutor({
                  mode: 'explain-error',
                  sectionId: 'ejemplo-guiado',
                  code: currentStep.code,
                  selection: currentStep.explanation || currentStep.label,
                  prefill: `Compara y explica este paso del ejemplo ("${currentStep.label}"):\n\n\`\`\`sql\n${currentStep.code}\n\`\`\``,
                })
              }
            >
              Preguntar sobre este código
            </button>
          ) : null}
        </div>

        {currentStep.explanation ? (
          <p className="lp-worked-panel__desc">
            {formatInlineText(currentStep.explanation, `we-desc-${safeIdx}`)}
          </p>
        ) : null}

        {currentStep.code ? (
          <div className="lp-code-example">
            <div className="lp-code-example__bar">
              <span className="lp-code-example__lang">SQL</span>
              <span className="lp-code-example__step-tag tabular">
                Paso {safeIdx + 1} de {steps.length}
              </span>
            </div>
            <pre className="lp-code-example__pre">
              <code>{currentStep.code}</code>
            </pre>
          </div>
        ) : null}

        {currentStep.expectedOutput ? (
          <ExpectedOutputTable
            expectedOutput={currentStep.expectedOutput}
            keyPrefix={`we-out-${safeIdx}`}
          />
        ) : null}
      </div>
    </section>
  );
}
