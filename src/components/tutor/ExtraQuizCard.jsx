import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Check, RotateCcw, Square, X } from 'lucide-react';
import { Button } from '../ui/index.js';
import { generateExtraQuiz, normalizeAiError } from '../../ai/client.js';
import { formatInlineText } from '../../utils/formatText.jsx';

/**
 * Componente "Dame 3 preguntas más" (`quiz-more`).
 * Solicita a `/api/ai/json` 3 preguntas adicionales de opción múltiple sobre la lección actual,
 * valida el resultado con Zod en cliente y permite responderlas con retroalimentación inmediata.
 */
export function ExtraQuizCard({
  lessonId = 'c1-sql-joins-02-grano-fanout',
  lessonTitle = 'Grano de una tabla y fan-out en JOINs',
  sectionId = null,
  model = 'gemini-3.8-flash-low',
  track = 'core',
  level = 1,
  disabled = false,
  onExplainMistake,
}) {
  const [loading, setLoading] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [quizData, setQuizData] = useState(null);
  const [selectedByQ, setSelectedByQ] = useState({});
  const [errorState, setErrorState] = useState(null);
  const abortRef = useRef(null);

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

  const handleGenerate = async () => {
    if (loading || disabled) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setErrorState(null);

    try {
      const res = await generateExtraQuiz({
        lessonId,
        sectionId,
        model,
        track,
        level,
        signal: controller.signal,
      });

      setQuizData({
        questions: res.data.questions,
        model: res.model || model,
        durationMs: res.durationMs || 0,
      });
      setSelectedByQ({});
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

  const handleSelectOption = (qId, optionId) => {
    setSelectedByQ((prev) => ({
      ...prev,
      [qId]: optionId,
    }));
  };

  const questions = quizData?.questions || [];
  const answeredCount = Object.keys(selectedByQ).length;
  const correctCount = questions.filter((q) => {
    const chosenId = selectedByQ[q.id];
    const opt = q.options.find((o) => o.id === chosenId);
    return Boolean(opt?.correct);
  }).length;

  return (
    <section
      className="tutor-structured-card tutor-extra-quiz"
      aria-label="Dame 3 preguntas más"
    >
      <div className="tutor-structured-card__header">
        <div>
          <h3 className="tutor-structured-card__title">Dame 3 preguntas más</h3>
          <p className="tutor-structured-card__sub">
            Genera preguntas de aplicación sobre <strong>{lessonTitle}</strong> y el esquema de
            Mercado Brisa (empresa ficticia).
          </p>
        </div>

        <div className="tutor-extra-quiz__header-actions">
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
            <Button
              type="button"
              variant={questions.length > 0 ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleGenerate}
              disabled={disabled}
            >
              {questions.length > 0 ? 'Generar otras 3 preguntas' : 'Dame 3 preguntas más'}
            </Button>
          )}
        </div>
      </div>

      {errorState && (
        <div className="tutor-honest-error" role="alert">
          <div className="tutor-honest-error__top">
            <AlertCircle size={16} aria-hidden="true" />
            <strong>{errorState.message}</strong>
          </div>
          {errorState.validationError && (
            <p className="tutor-honest-error__detail">
              Validación de esquema: {errorState.validationError}
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
              onClick={handleGenerate}
            >
              <RotateCcw size={13} aria-hidden="true" />
              <span>Reintentar</span>
            </Button>
          </div>
        </div>
      )}

      {questions.length > 0 && (
        <div className="tutor-extra-quiz__list" aria-live="polite">
          <div className="tutor-extra-quiz__summary tabular">
            <span>
              Respondidas: {answeredCount} de {questions.length} · Aciertos: {correctCount}
            </span>
            {quizData.durationMs > 0 && (
              <span>
                {quizData.model} · {(quizData.durationMs / 1000).toFixed(1)} s
              </span>
            )}
          </div>

          {questions.map((q, idx) => {
            const chosenId = selectedByQ[q.id];
            const chosenOption = q.options.find((o) => o.id === chosenId) || null;

            return (
              <article key={q.id || idx} className="tutor-quiz-item">
                <div className="tutor-quiz-item__head">
                  <span className="tutor-quiz-item__num tabular">
                    Pregunta {idx + 1} de {questions.length}
                  </span>
                </div>
                <p className="tutor-quiz-item__prompt">{formatInlineText(q.prompt)}</p>

                <div className="tutor-quiz-item__options" role="group" aria-label={q.prompt}>
                  {q.options.map((opt) => {
                    const isSelected = chosenId === opt.id;
                    const stateClass = isSelected
                      ? opt.correct
                        ? 'is-correct'
                        : 'is-wrong'
                      : '';

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        className={`tutor-quiz-opt ${stateClass}`.trim()}
                        onClick={() => handleSelectOption(q.id, opt.id)}
                        aria-pressed={isSelected}
                      >
                        <span className="tutor-quiz-opt__id tabular">
                          {String(opt.id).toUpperCase()}
                        </span>
                        <span className="tutor-quiz-opt__text">
                          {formatInlineText(opt.text)}
                        </span>
                        {isSelected && (
                          <span className="tutor-quiz-opt__icon" aria-hidden="true">
                            {opt.correct ? <Check size={15} /> : <X size={15} />}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {chosenOption && (
                  <div
                    className={`tutor-quiz-feedback ${
                      chosenOption.correct ? 'is-ok' : 'is-bad'
                    }`}
                  >
                    <p className="tutor-quiz-feedback__option">
                      <strong>
                        {chosenOption.correct ? 'Correcto:' : 'Incorrecto:'}
                      </strong>{' '}
                      {formatInlineText(chosenOption.feedback)}
                    </p>
                    <p className="tutor-quiz-feedback__explanation">
                      {formatInlineText(q.explanation)}
                    </p>
                    {!chosenOption.correct && typeof onExplainMistake === 'function' && (
                      <div className="tutor-quiz-feedback__actions">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            onExplainMistake({
                              question: q.prompt,
                              selectedOption: chosenOption.text,
                              feedback: chosenOption.feedback,
                            })
                          }
                        >
                          Explicar este fallo en el chat
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default ExtraQuizCard;
