import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, CheckCircle2, RotateCcw } from 'lucide-react';
import { solvePractice } from '../state/store.js';
import '../styles/views/lab.css';

function normalizeSteps(challenge) {
  const raw = challenge?.steps || challenge?.items || [];
  return raw.map((item, idx) => {
    if (typeof item === 'string') {
      return { id: `step-${idx}`, text: item, correctOrder: idx };
    }
    return {
      id: item.id || `step-${idx}`,
      text: item.text || item.label || String(item),
      correctOrder: typeof item.correctOrder === 'number' ? item.correctOrder : idx,
    };
  });
}

function deterministicShuffle(items) {
  const copy = [...items];
  if (copy.length <= 1) return copy;
  // Rotate/interleave deterministically so initial order is not already solved
  const rotated = copy.slice(1).concat(copy[0]);
  return rotated;
}

export function PipelineOrderChallenge({ lessonId = null, challenge, onComplete }) {
  const canonicalSteps = normalizeSteps(challenge);
  const [items, setItems] = useState(() => deterministicShuffle(canonicalSteps));
  const [status, setStatus] = useState(null); // null | 'passed' | 'failed'

  useEffect(() => {
    setItems(deterministicShuffle(normalizeSteps(challenge)));
    setStatus(null);
  }, [challenge]);

  if (!challenge || canonicalSteps.length === 0) return null;

  const moveStep = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const next = [...items];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    setItems(next);
    setStatus(null);
  };

  const handleCheckOrder = () => {
    const isCorrect = items.every((item, idx) => item.correctOrder === idx);
    setStatus(isCorrect ? 'passed' : 'failed');
    if (isCorrect) {
      if (lessonId) {
        solvePractice(lessonId, {
          passed: true,
          mode: 'order-steps',
          order: items.map((i) => i.id),
        });
      }
      if (onComplete) {
        onComplete();
      }
    }
  };

  const handleReset = () => {
    setItems(deterministicShuffle(canonicalSteps));
    setStatus(null);
  };

  return (
    <section className="code-challenge-card" data-testid="pipeline-order-challenge">
      <header className="sql-lab-header">
        <div className="sql-lab-title-group">
          <span className="sql-lab-kicker">Secuencia de arquitectura</span>
          <h3 className="sql-lab-title">
            {challenge.title || 'Ordenar etapas del flujo de datos'}
          </h3>
          {(challenge.prompt || challenge.description || challenge.instruction) && (
            <p className="sql-lab-prompt">
              {challenge.prompt || challenge.description || challenge.instruction}
            </p>
          )}
        </div>
      </header>

      <div className="pipeline-list">
        {items.map((step, idx) => {
          let rowStateClass = '';
          if (status) {
            rowStateClass = step.correctOrder === idx ? 'is-correct' : 'is-wrong';
          }
          return (
            <div key={step.id} className={`pipeline-step-row ${rowStateClass}`}>
              <span className="pipeline-step-index">{idx + 1}.</span>
              <span className="pipeline-step-text">{step.text}</span>
              <div className="pipeline-step-controls">
                <button
                  type="button"
                  className="sql-btn sql-btn-secondary"
                  onClick={() => moveStep(idx, -1)}
                  disabled={idx === 0}
                  aria-label={`Subir paso ${idx + 1}`}
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  className="sql-btn sql-btn-secondary"
                  onClick={() => moveStep(idx, 1)}
                  disabled={idx === items.length - 1}
                  aria-label={`Bajar paso ${idx + 1}`}
                >
                  <ArrowDown size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sql-lab-toolbar">
        <div className="sql-lab-actions-left">
          <button
            type="button"
            className="sql-btn sql-btn-primary"
            onClick={handleCheckOrder}
            data-testid="verify-order-btn"
          >
            <CheckCircle2 size={14} />
            <span>Comprobar orden</span>
          </button>
          <button
            type="button"
            className="sql-btn sql-btn-ghost"
            onClick={handleReset}
          >
            <RotateCcw size={14} />
            <span>Reiniciar secuencia</span>
          </button>
        </div>
      </div>

      {status && (
        <div className={`sql-grade-box ${status === 'passed' ? 'is-pass' : 'is-fail'}`}>
          <span className="sql-grade-title">
            {status === 'passed'
              ? 'Secuencia verificada · El orden de ejecución es consistente'
              : 'Algunas etapas están fuera de lugar · Revisa las dependencias del flujo'}
          </span>
          {status === 'passed' && challenge.explanation && (
            <p className="sql-grade-summary">{challenge.explanation}</p>
          )}
        </div>
      )}
    </section>
  );
}

export default PipelineOrderChallenge;
