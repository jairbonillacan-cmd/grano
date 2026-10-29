import React, { useState, useEffect, useRef } from 'react';
import { Check, AlertCircle, RotateCcw, Square } from 'lucide-react';
import { Button } from '../ui/index.js';
import { evaluateFeynman, normalizeAiError } from '../../ai/client.js';
import { formatInlineText } from '../../utils/formatText.jsx';

const SCORE_LABELS = {
  0: 'Incorrecto en lo esencial',
  1: 'Términos sueltos sin mecanismo claro',
  2: 'Idea general con omisiones importantes',
  3: 'Explicación correcta y clara',
  4: 'Explicación precisa con ejemplo concreto',
};

function countWords(str) {
  if (!str || typeof str !== 'string') return 0;
  const trimmed = str.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

/**
 * Componente "Explícalo con tus palabras" (técnica Feynman).
 * Envía el texto del alumno a `/api/ai/json` (modo `feynman`), valida la respuesta con Zod
 * y muestra la rúbrica estructurada `{ score: 0..4, aciertos, huecos, siguientePaso }`.
 */
export function FeynmanRubricCard({
  lessonId = 'c1-sql-joins-02-grano-fanout',
  lessonTitle = 'Grano de una tabla y fan-out en JOINs',
  sectionId = null,
  objective = '',
  model = 'gemini-3.8-flash-low',
  track = 'core',
  level = 1,
  disabled = false,
  initialText = '',
  onEvaluationComplete,
}) {
  const [text, setText] = useState(initialText);
  const [loading, setLoading] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [rubricResult, setRubricResult] = useState(null);
  const [errorState, setErrorState] = useState(null);
  const abortRef = useRef(null);

  const wordCount = countWords(text);
  const isOptimalRange = wordCount >= 80 && wordCount <= 200;

  useEffect(() => {
    if (!loading) {
      setElapsedSec(0);
      return undefined;
    }
    const started = Date.now();
    const timer = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - started) / 1000));
    }, 250);
    return () => clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleStop = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setLoading(false);
  };

  const handleEvaluate = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const cleaned = text.trim();
    if (!cleaned || loading || disabled) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setErrorState(null);

    try {
      const response = await evaluateFeynman({
        lessonId,
        sectionId,
        text: cleaned,
        model,
        track,
        level,
        signal: controller.signal,
      });

      setRubricResult({
        ...response.data,
        model: response.model || model,
        durationMs: response.durationMs || 0,
      });
      onEvaluationComplete?.(response.data);
    } catch (err) {
      const normalized = normalizeAiError(err);
      if (!normalized.aborted) {
        setErrorState(normalized);
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setLoading(false);
    }
  };

  const scoreTone =
    rubricResult?.score >= 3
      ? 'ok'
      : rubricResult?.score === 2
        ? 'warn'
        : 'bad';

  return (
    <section
      className="tutor-structured-card tutor-feynman"
      aria-label="Explícalo con tus palabras"
    >
      <div className="tutor-structured-card__header">
        <div>
          <h3 className="tutor-structured-card__title">Explícalo con tus palabras</h3>
          <p className="tutor-structured-card__sub">
            Explica el concepto principal de <strong>{lessonTitle}</strong> sin copiar definiciones.
            {' '}Recomendado: entre 80 y 200 palabras.
          </p>
        </div>
      </div>

      {objective && (
        <div className="tutor-feynman__goal">
          <span className="tutor-feynman__goal-label">Objetivo evaluado:</span>{' '}
          <span>{objective}</span>
        </div>
      )}

      <form className="tutor-feynman__form" onSubmit={handleEvaluate}>
        <label htmlFor="tutor-feynman-textarea" className="tutor-sr-only">
          Tu explicación sobre {lessonTitle}
        </label>
        <textarea
          id="tutor-feynman-textarea"
          className="tutor-feynman__textarea"
          rows={5}
          placeholder="Escribe aquí cómo le explicarías este tema a un compañero de equipo usando un ejemplo concreto..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={loading || disabled}
        />

        <div className="tutor-feynman__footer">
          <span
            className={`tutor-feynman__wordcount tabular ${
              isOptimalRange ? 'is-optimal' : ''
            }`.trim()}
          >
            {wordCount} {wordCount === 1 ? 'palabra' : 'palabras'} · objetivo 80–200
          </span>

          <div className="tutor-feynman__actions">
            {loading ? (
              <div className="tutor-status-inline" role="status">
                <span className="tabular">Pensando… {elapsedSec} s</span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleStop}
                >
                  <Square size={12} aria-hidden="true" />
                  <span>Detener</span>
                </Button>
              </div>
            ) : (
              <>
                {rubricResult && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setRubricResult(null);
                      setErrorState(null);
                    }}
                  >
                    Limpiar rúbrica
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={disabled || !text.trim()}
                >
                  Evaluar explicación
                </Button>
              </>
            )}
          </div>
        </div>
      </form>

      {errorState && (
        <div className="tutor-honest-error" role="alert">
          <div className="tutor-honest-error__top">
            <AlertCircle size={16} aria-hidden="true" />
            <strong>{errorState.message}</strong>
          </div>
          {errorState.validationError && (
            <p className="tutor-honest-error__detail">
              Detalle de validación: {errorState.validationError}
            </p>
          )}
          {Array.isArray(errorState.steps) && errorState.steps.length > 0 && (
            <ol className="tutor-honest-error__steps">
              {errorState.steps.map((step, i) => (
                <li key={i}>{formatInlineText(step)}</li>
              ))}
            </ol>
          )}
          <div className="tutor-honest-error__actions">
            <span className="tutor-honest-error__code tabular">{errorState.code}</span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleEvaluate}
            >
              <RotateCcw size={13} aria-hidden="true" />
              <span>Reintentar</span>
            </Button>
          </div>
        </div>
      )}

      {rubricResult && (
        <div
          className={`tutor-rubric tutor-rubric--${scoreTone}`}
          aria-live="polite"
        >
          <div className="tutor-rubric__score-row">
            <div className="tutor-rubric__score-main">
              <span className="tutor-rubric__score-badge tabular">
                {rubricResult.score} / 4
              </span>
              <span className="tutor-rubric__score-label">
                {SCORE_LABELS[rubricResult.score] || 'Evaluación completada'}
              </span>
            </div>
            <div
              className="tutor-rubric__segments"
              aria-label={`Puntuación ${rubricResult.score} de 4`}
            >
              {[1, 2, 3, 4].map((seg) => (
                <span
                  key={seg}
                  className={`tutor-rubric__segment ${
                    rubricResult.score >= seg ? 'is-filled' : ''
                  }`.trim()}
                />
              ))}
            </div>
          </div>

          <div className="tutor-rubric__section">
            <h4 className="tutor-rubric__heading">Aciertos</h4>
            <ul className="tutor-rubric__list">
              {rubricResult.aciertos.map((item, idx) => (
                <li key={idx} className="tutor-rubric__item tutor-rubric__item--ok">
                  <Check size={14} aria-hidden="true" />
                  <span>{formatInlineText(item)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="tutor-rubric__section">
            <h4 className="tutor-rubric__heading">Huecos o puntos por precisar</h4>
            {rubricResult.huecos.length === 0 ? (
              <p className="tutor-rubric__empty">
                No se detectaron omisiones importantes en tu explicación.
              </p>
            ) : (
              <ul className="tutor-rubric__list">
                {rubricResult.huecos.map((item, idx) => (
                  <li key={idx} className="tutor-rubric__item tutor-rubric__item--gap">
                    <AlertCircle size={14} aria-hidden="true" />
                    <span>{formatInlineText(item)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="tutor-rubric__next">
            <span className="tutor-rubric__next-label">Siguiente paso:</span>
            <p className="tutor-rubric__next-body">
              {formatInlineText(rubricResult.siguientePaso)}
            </p>
          </div>

          <div className="tutor-rubric__meta tabular">
            <span>{rubricResult.model}</span>
            {rubricResult.durationMs > 0 && (
              <span>{(rubricResult.durationMs / 1000).toFixed(1)} s</span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default FeynmanRubricCard;
