import React, { useState, useEffect } from 'react';
import { Code2, CheckCircle2, Sparkles } from 'lucide-react';
import { Callout } from './ui/index.js';
import { formatInlineText, isNumericCell } from '../utils/formatText.jsx';

function normalizeCode(val) {
  if (!val || typeof val !== 'string') return '';
  return val
    .trim()
    .replace(/;+$/, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function AuthenticCodeLab({ challenge, onSolve, onAskAiTutor }) {
  const blanks = Array.isArray(challenge?.blanks) ? challenge.blanks : [];
  const [values, setValues] = useState({});
  const [hintShown, setHintShown] = useState({});
  const [checked, setChecked] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [animMode, setAnimMode] = useState(''); // '' | 'pop' | 'shake'

  useEffect(() => {
    const init = {};
    blanks.forEach((b) => {
      init[b.id] = '';
    });
    setValues(init);
    setHintShown({});
    setChecked(false);
    setAttemptCount(0);
    setAnimMode('');
  }, [challenge?.title]);

  if (!challenge || blanks.length === 0) return null;

  const results = {};
  let allCorrect = true;
  blanks.forEach((b) => {
    const userVal = normalizeCode(values[b.id]);
    const accepted = Array.isArray(b.acceptedAnswers) ? b.acceptedAnswers : [];
    const ok = accepted.some((ans) => normalizeCode(ans) === userVal);
    results[b.id] = ok;
    if (!ok) allCorrect = false;
  });

  const triggerAnimation = (nextMode) => {
    setAnimMode('');
    setTimeout(() => {
      setAnimMode(nextMode);
    }, 10);
  };

  const handleCheck = () => {
    const nextAttempt = attemptCount + 1;
    setAttemptCount(nextAttempt);
    setChecked(true);

    if (allCorrect) {
      triggerAnimation('pop');
      if (typeof onSolve === 'function') {
        onSolve({ passed: true });
      }
    } else {
      triggerAnimation('shake');
      // Pista progresiva automática para los campos con error
      const nextHints = { ...hintShown };
      blanks.forEach((b) => {
        if (!results[b.id]) {
          nextHints[b.id] = true;
        }
      });
      setHintShown(nextHints);
    }
  };

  const handleFillSolution = () => {
    const filled = {};
    blanks.forEach((b) => {
      filled[b.id] = b.acceptedAnswers?.[0] || '';
    });
    setValues(filled);
    setChecked(true);
    triggerAnimation('pop');
    if (typeof onSolve === 'function') {
      onSolve({ passed: true });
    }
  };

  const renderLiveCode = () => {
    let code = String(challenge.templateCode || '');
    blanks.forEach((b, idx) => {
      const replacement = values[b.id]?.trim()
        ? values[b.id]
        : `/* [${idx + 1}: ${b.placeholder}] */`;
      code = code
        .replace(`{{${b.id}}}`, replacement)
        .replace(`___${b.id}___`, replacement)
        .replace(`__${b.id}__`, replacement);
    });
    return code;
  };

  const codeLines = renderLiveCode().split('\n');
  const outputRows = Array.isArray(challenge.expectedOutputTable)
    ? challenge.expectedOutputTable
    : [];

  const firstPendingBlank = blanks.find((b) => !results[b.id]);

  return (
    <section
      className={`codelab ${animMode === 'pop' ? 'codelab--pop' : ''} ${
        animMode === 'shake' ? 'codelab--shake' : ''
      }`.trim()}
    >
      <div className="codelab__header">
        <h3 className="codelab__title">
          {challenge.title || 'Ejercicio práctico de código'}
        </h3>
        <p className="codelab__desc">{formatInlineText(challenge.instruction)}</p>
      </div>

      <div className="codelab-editor">
        <div className="codelab-editor__topbar">
          <span className="codelab-editor__dots" aria-hidden="true">
            <span className="codelab-editor__dot" />
            <span className="codelab-editor__dot" />
            <span className="codelab-editor__dot" />
            <Code2 size={14} />
            <span>laboratorio_interactivo.sql</span>
          </span>
          <span>
            {codeLines.length} líneas · {blanks.length}{' '}
            {blanks.length === 1 ? 'espacio' : 'espacios'}
          </span>
        </div>

        <div className="codelab-editor__viewport">
          <div className="codelab-lines tabular" role="region" aria-label="Código del ejercicio">
            {codeLines.map((line, idx) => (
              <div key={idx} className="codelab-line">
                <span className="codelab-gutter">{idx + 1}</span>
                <span className="codelab-code">{line || ' '}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="codelab-inputs-panel lab-blanks-list">
          {blanks.map((blank, idx) => {
            const isOk = checked && results[blank.id];
            const isErr = checked && !results[blank.id];
            const showHint = Boolean(hintShown[blank.id]);

            return (
              <div
                key={blank.id}
                className={`codelab-blank-row lab-blank-row ${
                  isOk ? 'codelab-blank-row--valid' : ''
                } ${isErr ? 'codelab-blank-row--err' : ''}`.trim()}
              >
                <div className="codelab-blank-header lab-blank-header">
                  <label htmlFor={`blank-${blank.id}`} className="tabular">
                    <strong>Espacio {idx + 1}:</strong> {formatInlineText(blank.placeholder)}
                  </label>
                  <button
                    type="button"
                    className="codelab-hint-btn text-action-btn"
                    onClick={() =>
                      setHintShown((prev) => ({ ...prev, [blank.id]: !prev[blank.id] }))
                    }
                  >
                    {showHint ? 'Ocultar pista' : 'Ver pista'}
                  </button>
                </div>

                <input
                  id={`blank-${blank.id}`}
                  type="text"
                  className={`codelab-code-input lab-code-input tabular ${
                    isOk ? 'is-ok' : ''
                  } ${isErr ? 'is-err' : ''}`.trim()}
                  value={values[blank.id] || ''}
                  onChange={(e) => {
                    setValues((prev) => ({ ...prev, [blank.id]: e.target.value }));
                    setChecked(false);
                  }}
                  placeholder={`Completa el espacio ${idx + 1}...`}
                />

                {showHint && (
                  <p className="codelab-hint-text lab-hint-text">
                    <strong>Pista progresiva:</strong> {formatInlineText(blank.hint)}{' '}
                    {attemptCount >= 2 || hintShown[blank.id] ? (
                      <>
                        (Sintaxis de referencia: <code>{blank.acceptedAnswers?.[0]}</code>)
                      </>
                    ) : null}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="codelab-actions editorial-actions-row">
        <button
          type="button"
          className="ui-btn ui-btn--primary ui-btn--md codelab-check-btn"
          onClick={handleCheck}
        >
          <CheckCircle2 size={16} />
          Comprobar código
        </button>
        <button
          type="button"
          className="ui-btn ui-btn--secondary ui-btn--md"
          onClick={handleFillSolution}
        >
          Completar con solución de referencia
        </button>
        {onAskAiTutor && (
          <button
            type="button"
            className="ui-btn ui-btn--ghost ui-btn--md"
            onClick={() =>
              onAskAiTutor(
                `Explícame paso a paso cómo resolver el ejercicio "${challenge.title}" y por qué se usan las cláusulas ${blanks.map((b) => b.acceptedAnswers?.[0]).join(', ')}.`
              )
            }
          >
            <Sparkles size={16} />
            Consultar duda al Tutor IA
          </button>
        )}
      </div>

      {checked && allCorrect && (
        <Callout
          tone="success"
          title="Código verificado correctamente"
          className="editorial-feedback ok"
        >
          <p>
            Todas las cláusulas respetan el grano y las invariantes del motor analítico.
          </p>
          {outputRows.length > 0 && (
            <div className="sim-panel">
              <div className="sim-panel__title">
                Tabla de salida producida por tu consulta:
              </div>
              <div className="sim-table-scroll">
                <table className="sim-table tabular">
                  <thead>
                    <tr>
                      {Object.entries(outputRows[0]).map(([col, sampleVal]) => (
                        <th key={col} className={isNumericCell(sampleVal) ? 'num' : ''}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {outputRows.map((row, rIdx) => (
                      <tr key={rIdx} className="row-optimal row-flash">
                        {Object.values(row).map((val, cIdx) => (
                          <td key={cIdx} className={isNumericCell(val) ? 'num' : ''}>
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Callout>
      )}

      {checked && !allCorrect && (
        <Callout
          tone="danger"
          title="Hay cláusulas pendientes o con sintaxis distinta a la esperada"
          className="editorial-feedback err"
        >
          <p>
            {firstPendingBlank ? (
              <>
                Revisa <strong>{formatInlineText(firstPendingBlank.placeholder)}</strong>:{' '}
                {formatInlineText(firstPendingBlank.hint)}
                {attemptCount >= 2 && (
                  <>
                    {' '}
                    — Prueba con <code>{firstPendingBlank.acceptedAnswers?.[0]}</code>.
                  </>
                )}
              </>
            ) : (
              'Verifica las pistas activadas en cada espacio marcado en rojo.'
            )}
          </p>
        </Callout>
      )}
    </section>
  );
}

export default AuthenticCodeLab;
