import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Check, ChevronRight, RotateCcw, Square } from 'lucide-react';
import { Button } from '../ui/index.js';
import { evaluateInterviewAnswer, normalizeAiError } from '../../ai/client.js';
import { formatInlineText } from '../../utils/formatText.jsx';

const TOTAL_INTERVIEW_QUESTIONS = 5;

const AREA_OPTIONS = [
  { id: 'de', label: 'Ingeniería de Datos (DE)' },
  { id: 'da', label: 'Análisis de Datos (DA)' },
  { id: 'bi', label: 'Business Intelligence (BI)' },
  { id: 'core', label: 'Tronco común' },
];

const LEVEL_OPTIONS = [
  { id: 0, label: 'Nivel 0 · Cimientos' },
  { id: 1, label: 'Nivel 1 · Fundamentos' },
  { id: 2, label: 'Nivel 2 · Intermedio' },
  { id: 3, label: 'Nivel 3 · Avanzado' },
  { id: 4, label: 'Nivel 4 · Experto' },
];

const INITIAL_QUESTIONS_BY_AREA = {
  de: [
    'En Mercado Brisa (empresa ficticia), la tabla orders tiene una fila por pedido y order_items tiene una fila por línea de producto. ¿Cómo construirías una consulta SQL que sume el total facturado y las unidades vendidas sin duplicar shipping_fee_usd?',
    '¿Cómo diseñarías la carga incremental diaria de la tabla orders en Parquet o Iceberg para que un reproceso no duplique registros?',
    'En customer_changes necesitamos conservar el historial de ciudad de cada cliente con SCD tipo 2. ¿Qué columnas de control añadirías y cómo cruzarías un pedido con la dirección vigente en esa fecha?',
    'Una consulta analítica lee 40 archivos Parquet cuando solo filtra por order_ts de la última semana. ¿Cómo organizarías el particionado y el orden físico para que salte bloques innecesarios?',
    'Los eventos de navegación en events llegan con hasta 15 minutos de retraso respecto a su event_ts. ¿Cómo configurarías el watermark y qué harías con los eventos tardíos?',
  ],
  da: [
    'En Mercado Brisa (empresa ficticia), el ticket medio global bajó un 4 % este mes, pero subió tanto en web como en aplicación móvil por separado. ¿Qué fenómeno estadístico explica esto y cómo lo verificarías en SQL?',
    'Dirección quiere saber si el nuevo flujo de pago mejora la conversión. ¿Cómo comprobarías primero si existe Sample Ratio Mismatch (SRM) en experiment_assignments antes de mirar el p-valor?',
    '¿Cómo construirías una matriz de retención semanal por cohorte de alta usando las tablas customers y orders?',
    'En la tabla order_items aparece un producto con importe negativo por un error de carga. ¿Cómo distinguirías un error de datos de un valor extremo real antes de calcular la media y la mediana?',
    '¿Cómo usarías datos previos al experimento (CUPED) sobre orders para reducir la varianza de la métrica de gasto por cliente?',
  ],
  bi: [
    'En Mercado Brisa (empresa ficticia), necesitas modelar orders, order_items, products, stores y calendar en un modelo en estrella. ¿Qué tabla colocarías como hechos, qué grano tendría y por qué evitarías relaciones bidireccionales?',
    'Finanzas y Marketing presentan cifras distintas de "Ingreso neto" porque uno descuenta refunds por fecha de pedido y otro por fecha de reembolso. ¿Cómo definirías la métrica en una capa semántica única?',
    'Un gerente de tienda solo puede ver las ventas de su store_id en el tablero. ¿Cómo implementarías seguridad por filas (RLS) sin duplicar el reporte?',
    'En una medida DAX o SQL analítico, el porcentaje sobre el total por categoría debe mantener el denominador fijo al filtrar una fila. ¿Cómo plantearías ese cálculo sin perder el contexto?',
    'Un tablero ejecutivo tiene 18 gráficos y tarda 9 segundos en abrir. ¿Cómo reorganizarías su jerarquía visual y qué consultas pre-agregarías?',
  ],
  core: [
    'En Mercado Brisa (empresa ficticia), ¿qué representa exactamente una fila de la tabla orders frente a una fila de order_items y por qué importa antes de usar SUM()?',
    '¿Cuál es la diferencia práctica entre COUNT(*), COUNT(shipping_fee_usd) y COUNT(DISTINCT customer_id) cuando hay valores NULL en la tabla?',
    'Si haces un LEFT JOIN de customers hacia orders, ¿cómo filtrarías únicamente los clientes que nunca han hecho un pedido?',
    '¿Cómo obtendrías el pedido más reciente de cada cliente en orders usando ROW_NUMBER() y QUALIFY sin subconsultas anidadas?',
    '¿Qué comprobaciones mínimas ejecutarías sobre una tabla nueva antes de publicar un reporte con sus totales?',
  ],
};

function getFallbackQuestion(area, questionIndex) {
  const list = INITIAL_QUESTIONS_BY_AREA[area] || INITIAL_QUESTIONS_BY_AREA.core;
  return list[questionIndex % list.length];
}

/**
 * Simulacro de entrevista técnica por área y nivel (`interview-grade`).
 * Presenta 5 preguntas una a una, evalúa cada respuesta con `/api/ai/json` validado con Zod
 * y entrega retroalimentación detallada con puntuación, fortalezas, mejoras y respuesta modelo.
 */
export function InterviewSimulator({
  lessonId = 'c1-sql-joins-02-grano-fanout',
  defaultTrack = 'de',
  defaultLevel = 2,
  model = 'gemini-3.8-flash-low',
  disabled = false,
}) {
  const normalizedDefaultTrack =
    defaultTrack === 'de' || defaultTrack === 'da' || defaultTrack === 'bi'
      ? defaultTrack
      : 'de';

  const [selectedArea, setSelectedArea] = useState(normalizedDefaultTrack);
  const [selectedLevel, setSelectedLevel] = useState(
    Number.isFinite(defaultLevel) ? Math.min(4, Math.max(0, defaultLevel)) : 2
  );
  const [currentStep, setCurrentStep] = useState(0); // 0..4
  const [currentQuestion, setCurrentQuestion] = useState(() =>
    getFallbackQuestion(normalizedDefaultTrack, 0)
  );
  const [answerText, setAnswerText] = useState('');
  const [sqlText, setSqlText] = useState('');
  const [loading, setLoading] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [errorState, setErrorState] = useState(null);
  const [history, setHistory] = useState([]); // Array de { step, question, answer, code, evaluation }
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

  const currentEvaluation =
    history.find((item) => item.step === currentStep)?.evaluation || null;
  const isFinished =
    history.length >= TOTAL_INTERVIEW_QUESTIONS &&
    currentStep === TOTAL_INTERVIEW_QUESTIONS - 1 &&
    Boolean(currentEvaluation);

  const handleResetInterview = (nextArea = selectedArea, nextLevel = selectedLevel) => {
    abortRef.current?.abort();
    setLoading(false);
    setErrorState(null);
    setHistory([]);
    setCurrentStep(0);
    setCurrentQuestion(getFallbackQuestion(nextArea, 0));
    setAnswerText('');
    setSqlText('');
  };

  const handleAreaChange = (e) => {
    const nextArea = e.target.value;
    setSelectedArea(nextArea);
    handleResetInterview(nextArea, selectedLevel);
  };

  const handleLevelChange = (e) => {
    const nextLevel = Number(e.target.value);
    setSelectedLevel(nextLevel);
    handleResetInterview(selectedArea, nextLevel);
  };

  const handleStop = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setLoading(false);
  };

  const handleSubmitAnswer = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const cleanAns = answerText.trim();
    if (!cleanAns || loading || disabled) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setErrorState(null);

    try {
      const promptWithQuestion = `Pregunta de entrevista (${currentStep + 1}/${TOTAL_INTERVIEW_QUESTIONS}): ${currentQuestion}\n\nRespuesta de la persona: ${cleanAns}`;

      const res = await evaluateInterviewAnswer({
        lessonId,
        question: promptWithQuestion,
        answer: promptWithQuestion,
        code: sqlText.trim() || undefined,
        model,
        track: selectedArea,
        level: selectedLevel,
        signal: controller.signal,
      });

      const evalData = {
        ...res.data,
        model: res.model || model,
        durationMs: res.durationMs || 0,
      };

      setHistory((prev) => {
        const filtered = prev.filter((item) => item.step !== currentStep);
        return [
          ...filtered,
          {
            step: currentStep,
            question: currentQuestion,
            answer: cleanAns,
            code: sqlText.trim(),
            evaluation: evalData,
          },
        ];
      });
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

  const handleNextQuestion = () => {
    if (currentStep + 1 >= TOTAL_INTERVIEW_QUESTIONS) return;
    const nextStep = currentStep + 1;
    const nextQ =
      currentEvaluation?.siguientePregunta &&
      currentEvaluation.siguientePregunta.trim().length > 12
        ? currentEvaluation.siguientePregunta.trim()
        : getFallbackQuestion(selectedArea, nextStep);

    setCurrentStep(nextStep);
    setCurrentQuestion(nextQ);
    setAnswerText('');
    setSqlText('');
    setErrorState(null);
  };

  const totalScore = history.reduce(
    (acc, item) => acc + (Number(item.evaluation?.score) || 0),
    0
  );
  const maxPossibleScore = history.length * 4;

  return (
    <section
      className="tutor-structured-card tutor-interview"
      aria-label="Simulacro de entrevista técnica"
    >
      <div className="tutor-structured-card__header">
        <div>
          <h3 className="tutor-structured-card__title">Simulacro de entrevista</h3>
          <p className="tutor-structured-card__sub">
            5 preguntas prácticas una a una con evaluación técnica sobre Mercado Brisa.
          </p>
        </div>
        {history.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleResetInterview()}
          >
            Reiniciar
          </Button>
        )}
      </div>

      <div className="tutor-interview__controls">
        <label className="tutor-interview__field">
          <span>Área</span>
          <select
            value={selectedArea}
            onChange={handleAreaChange}
            disabled={loading}
            aria-label="Área de la entrevista"
          >
            {AREA_OPTIONS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </label>

        <label className="tutor-interview__field">
          <span>Nivel</span>
          <select
            value={selectedLevel}
            onChange={handleLevelChange}
            disabled={loading}
            aria-label="Nivel de la entrevista"
          >
            {LEVEL_OPTIONS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="tutor-interview__progress tabular">
        <span>
          Pregunta {currentStep + 1} de {TOTAL_INTERVIEW_QUESTIONS}
        </span>
        <div
          className="tutor-interview__steps-dots"
          aria-label={`Progreso: pregunta ${currentStep + 1} de ${TOTAL_INTERVIEW_QUESTIONS}`}
        >
          {Array.from({ length: TOTAL_INTERVIEW_QUESTIONS }).map((_, idx) => {
            const doneEntry = history.find((h) => h.step === idx);
            const cls = doneEntry
              ? 'is-done'
              : idx === currentStep
                ? 'is-current'
                : '';
            return (
              <span key={idx} className={`tutor-interview__step-cell ${cls}`.trim()} />
            );
          })}
        </div>
        {history.length > 0 && (
          <span>
            Acumulado: {totalScore} / {maxPossibleScore}
          </span>
        )}
      </div>

      <div className="tutor-interview__question-box">
        <span className="tutor-interview__q-tag tabular">
          Caso técnico #{currentStep + 1}
        </span>
        <p className="tutor-interview__q-text">{formatInlineText(currentQuestion)}</p>
      </div>

      {!currentEvaluation && (
        <form className="tutor-interview__form" onSubmit={handleSubmitAnswer}>
          <label htmlFor="tutor-interview-answer" className="tutor-sr-only">
            Tu respuesta a la pregunta {currentStep + 1}
          </label>
          <textarea
            id="tutor-interview-answer"
            className="tutor-feynman__textarea"
            rows={4}
            placeholder="Explica tu planteamiento paso a paso, qué comprobarías y por qué..."
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            disabled={loading || disabled}
          />

          <label htmlFor="tutor-interview-sql" className="tutor-interview__sql-label">
            Consulta SQL o pseudocódigo (opcional)
          </label>
          <textarea
            id="tutor-interview-sql"
            className="tutor-interview__sql-input"
            rows={2}
            placeholder="SELECT ..."
            value={sqlText}
            onChange={(e) => setSqlText(e.target.value)}
            disabled={loading || disabled}
          />

          <div className="tutor-interview__form-footer">
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
                type="submit"
                variant="primary"
                size="sm"
                disabled={disabled || !answerText.trim()}
              >
                Evaluar respuesta
              </Button>
            )}
          </div>
        </form>
      )}

      {errorState && (
        <div className="tutor-honest-error" role="alert">
          <div className="tutor-honest-error__top">
            <AlertCircle size={16} aria-hidden="true" />
            <strong>{errorState.message}</strong>
          </div>
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
              onClick={handleSubmitAnswer}
            >
              <RotateCcw size={13} aria-hidden="true" />
              <span>Reintentar</span>
            </Button>
          </div>
        </div>
      )}

      {currentEvaluation && (
        <div className="tutor-rubric" aria-live="polite">
          <div className="tutor-rubric__score-row">
            <div className="tutor-rubric__score-main">
              <span className="tutor-rubric__score-badge tabular">
                {currentEvaluation.score} / 4
              </span>
              <span className="tutor-rubric__score-label">
                Evaluación de la pregunta {currentStep + 1}
              </span>
            </div>
            <span className="tutor-rubric__meta tabular">
              {currentEvaluation.model}
              {currentEvaluation.durationMs > 0
                ? ` · ${(currentEvaluation.durationMs / 1000).toFixed(1)} s`
                : ''}
            </span>
          </div>

          <div className="tutor-rubric__section">
            <h4 className="tutor-rubric__heading">Fortalezas</h4>
            <ul className="tutor-rubric__list">
              {currentEvaluation.fortalezas.map((f, i) => (
                <li key={i} className="tutor-rubric__item tutor-rubric__item--ok">
                  <Check size={14} aria-hidden="true" />
                  <span>{formatInlineText(f)}</span>
                </li>
              ))}
            </ul>
          </div>

          {currentEvaluation.mejoras.length > 0 && (
            <div className="tutor-rubric__section">
              <h4 className="tutor-rubric__heading">Puntos a precisar</h4>
              <ul className="tutor-rubric__list">
                {currentEvaluation.mejoras.map((m, i) => (
                  <li key={i} className="tutor-rubric__item tutor-rubric__item--gap">
                    <AlertCircle size={14} aria-hidden="true" />
                    <span>{formatInlineText(m)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="tutor-rubric__next">
            <span className="tutor-rubric__next-label">Respuesta de referencia:</span>
            <p className="tutor-rubric__next-body">
              {formatInlineText(currentEvaluation.respuestaModelo)}
            </p>
          </div>

          <div className="tutor-interview__nav">
            {currentStep + 1 < TOTAL_INTERVIEW_QUESTIONS ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleNextQuestion}
              >
                <span>Siguiente pregunta ({currentStep + 2} de {TOTAL_INTERVIEW_QUESTIONS})</span>
                <ChevronRight size={14} aria-hidden="true" />
              </Button>
            ) : (
              <div className="tutor-interview__final tabular">
                <strong>
                  Simulacro completado: {totalScore} / {TOTAL_INTERVIEW_QUESTIONS * 4} puntos
                </strong>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleResetInterview()}
                >
                  Nuevo simulacro
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {isFinished && history.length > 1 && (
        <div className="tutor-interview__history">
          <h4 className="tutor-rubric__heading">Resumen de las 5 respuestas</h4>
          <ol className="tutor-interview__history-list">
            {history.map((h) => (
              <li key={h.step} className="tutor-interview__history-item">
                <span className="tabular">
                  P{h.step + 1}: <strong>{h.evaluation.score}/4</strong>
                </span>
                <span>{h.question}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

export default InterviewSimulator;
