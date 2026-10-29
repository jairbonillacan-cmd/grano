import React, { useState, useEffect } from 'react';
import { GripVertical, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react';
import { Callout, Chip } from './ui/index.js';
import { formatInlineText } from '../utils/formatText.jsx';

function buildInitialScrambled(canonicalSteps) {
  const copy = [...canonicalSteps];
  if (copy.length >= 2) {
    const first = copy[0];
    copy[0] = copy[1];
    copy[1] = first;
  }
  return copy;
}

export function PipelineOrderChallenge({ challenge, onComplete }) {
  const canonicalSteps = Array.isArray(challenge?.steps) ? challenge.steps : [];
  const [items, setItems] = useState([]);
  const [verified, setVerified] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);

  useEffect(() => {
    if (canonicalSteps.length === 0) return;
    setItems(buildInitialScrambled(canonicalSteps));
    setVerified(false);
    setDragIdx(null);
  }, [challenge?.title]);

  if (!challenge || canonicalSteps.length === 0) return null;

  const moveItem = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const temp = next[index];
    next[index] = next[target];
    next[target] = temp;
    setItems(next);
    setVerified(false);
  };

  const handleDragStart = (idx) => {
    setDragIdx(idx);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (targetIdx) => {
    if (dragIdx === null || dragIdx === targetIdx) {
      setDragIdx(null);
      return;
    }
    const next = [...items];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(targetIdx, 0, moved);
    setItems(next);
    setDragIdx(null);
    setVerified(false);
  };

  const isSolved = items.every((item, idx) => item.id === canonicalSteps[idx]?.id);

  const handleVerify = () => {
    setVerified(true);
    if (isSolved && typeof onComplete === 'function') {
      onComplete();
    }
  };

  const handleReset = () => {
    setItems(buildInitialScrambled(canonicalSteps));
    setVerified(false);
    setDragIdx(null);
  };

  return (
    <section className="pipeline-challenge">
      <div className="pipeline-challenge__header">
        <h3 className="pipeline-challenge__title">
          {challenge.title || 'Secuencia de arquitectura'}
        </h3>
        <p className="pipeline-challenge__desc">
          {formatInlineText(challenge.scenario)}
        </p>
      </div>

      <div className="pipeline-steps-list pipeline-steps-table" role="list">
        {items.map((step, idx) => {
          const isPositionOk = verified && step.id === canonicalSteps[idx]?.id;
          const isPositionErr = verified && step.id !== canonicalSteps[idx]?.id;
          const isDragging = dragIdx === idx;

          const cardClass = [
            'pipeline-step-card',
            'pipeline-step-row',
            isPositionOk ? 'is-ok' : '',
            isPositionErr ? 'is-err' : '',
            isDragging ? 'pipeline-step-card--dragging' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div
              key={step.id}
              role="listitem"
              className={cardClass}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(idx)}
              onDragEnd={() => setDragIdx(null)}
            >
              <span
                className="pipeline-step-handle"
                title="Arrastrar para reordenar"
                aria-hidden="true"
              >
                <GripVertical size={18} />
              </span>

              <span className="pipeline-step-index pipeline-step-num tabular">
                {idx + 1}
              </span>

              <div className="pipeline-step-body">
                <div className="pipeline-step-title-row pipeline-step-title">
                  <strong>{formatInlineText(step.label)}</strong>
                  {step.role && <Chip role={step.role}>{step.role}</Chip>}
                  {isPositionOk && (
                    <span className="pipeline-step-status pipeline-step-status--valid">
                      <CheckCircle2 size={13} />
                      Correcta
                    </span>
                  )}
                  {isPositionErr && (
                    <span className="pipeline-step-status pipeline-step-status--err">
                      <AlertTriangle size={13} />
                      Fuera de orden
                    </span>
                  )}
                </div>
                <p className="pipeline-step-detail">
                  {formatInlineText(step.detail)}
                </p>
              </div>

              <div className="pipeline-step-controls">
                <button
                  type="button"
                  className="pipeline-move-btn"
                  disabled={idx === 0}
                  onClick={() => moveItem(idx, -1)}
                  aria-label={`Subir paso ${idx + 1}`}
                  title="Subir paso"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="pipeline-move-btn"
                  disabled={idx === items.length - 1}
                  onClick={() => moveItem(idx, 1)}
                  aria-label={`Bajar paso ${idx + 1}`}
                  title="Bajar paso"
                >
                  ↓
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="codelab-actions editorial-actions-row">
        <button
          type="button"
          className="ui-btn ui-btn--primary ui-btn--md"
          onClick={handleVerify}
        >
          <CheckCircle2 size={16} />
          Verificar secuencia
        </button>
        <button
          type="button"
          className="ui-btn ui-btn--secondary ui-btn--md"
          onClick={() => {
            setItems([...canonicalSteps]);
            setVerified(true);
            if (typeof onComplete === 'function') onComplete();
          }}
        >
          Mostrar orden correcto
        </button>
        <button
          type="button"
          className="ui-btn ui-btn--ghost ui-btn--md"
          onClick={handleReset}
        >
          <RotateCcw size={15} />
          Reiniciar
        </button>
      </div>

      {verified && (
        <Callout
          tone={isSolved ? 'success' : 'danger'}
          title={
            isSolved
              ? 'Secuencia arquitectónica correcta'
              : 'Algunos pasos están fuera de orden; revisa las dependencias entre etapas'
          }
          className={`editorial-feedback ${isSolved ? 'ok' : 'err'}`}
        >
          {challenge.explanation && <p>{formatInlineText(challenge.explanation)}</p>}
        </Callout>
      )}
    </section>
  );
}

export default PipelineOrderChallenge;
