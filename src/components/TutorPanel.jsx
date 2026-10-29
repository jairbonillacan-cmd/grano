import React from 'react';
import { Send, Sparkles, X } from 'lucide-react';
import {
  Button,
  Chip,
  Illustration,
  getStageNumber,
} from './ui/index.js';
import { renderMarkdown } from '../utils/formatText.jsx';

export function TutorPanel({
  currentLesson,
  currentStage,
  activeStepLabel,
  engineMode = 'fast',
  onChangeEngineMode = () => {},
  aiLoading = false,
  aiError = null,
  aiInput = '',
  onChangeAiInput = () => {},
  aiMessages = [],
  onAskTutor = () => {},
  onClose = () => {},
}) {
  const lessonTitle = currentLesson?.title || 'Fundamentos de Datos';
  const lessonOrder = currentLesson?.order || 1;
  const stageNum = getStageNumber(
    currentStage?.number || currentLesson?.stageId || 1
  );
  const stepLabel = activeStepLabel || '1. Concepto';

  const quickPrompts = [
    {
      label: 'Explícame el paso actual',
      prompt: `Explícame en detalle el paso actual (${stepLabel}) de la lección "${lessonTitle}".`,
    },
    {
      label: 'Dame otro ejemplo',
      prompt: `Dame otro ejemplo práctico y numérico aplicado a "${lessonTitle}".`,
    },
    {
      label: '¿Qué error evita este patrón?',
      prompt: `¿Qué error de producción en DE, DA o BI evita el patrón central de "${lessonTitle}"?`,
    },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!aiInput.trim() || aiLoading) return;
    onAskTutor(aiInput);
  };

  // Solo el último intercambio (los mensajes se anteponen) decide si hay error visible.
  const latest = aiMessages[0];
  const hasErrorMsg =
    Boolean(aiError) || Boolean(latest?.isError || latest?.error);

  return (
    <div className="tutor-panel" data-stage={stageNum}>
      <div className="tutor-panel__handle" aria-hidden="true" />

      <div className="tutor-panel__header">
        <div className="tutor-panel__title-group">
          <Sparkles size={16} aria-hidden="true" />
          <h2 className="tutor-panel__title">Tutor IA</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          ariaLabel="Cerrar Tutor IA"
        >
          <X size={16} aria-hidden="true" />
          <span>Cerrar</span>
        </Button>
      </div>

      {/* Chip con la lección actual como contexto */}
      <div className="tutor-panel__context">
        <div className="tutor-panel__context-row">
          <Chip variant="stage" stage={stageNum}>
            Etapa {stageNum} · L{String(lessonOrder).padStart(2, '0')}
          </Chip>
          <span className="tutor-panel__step-badge tabular">
            Paso: {stepLabel}
          </span>
        </div>
        <div className="tutor-panel__lesson-name">
          <strong>{lessonTitle}</strong>
        </div>
      </div>

      <div className="tutor-panel__engine">
        <label htmlFor="tutor-engine-select">Modelo</label>
        <select
          id="tutor-engine-select"
          value={engineMode}
          onChange={(e) => onChangeEngineMode(e.target.value)}
        >
          <option value="fast">Rápido · Gemini 3.8 Flash</option>
          <option value="deep">Profundo · Gemini 4 Argon</option>
        </select>
      </div>

      <div className="tutor-panel__messages" aria-live="polite">
        {aiLoading && (
          <div
            className="tutor-bubble tutor-bubble--tutor tutor-bubble--loading"
            role="status"
          >
            <div className="tutor-typing">
              <span>Pensando… suele tardar entre 5 y 15 s</span>
              <span className="tutor-typing-dots" aria-hidden="true">
                <span className="tutor-typing-dots__dot" />
                <span className="tutor-typing-dots__dot" />
                <span className="tutor-typing-dots__dot" />
              </span>
            </div>
            <div className="tutor-typing__context">
              Consultando contexto de &ldquo;{lessonTitle}&rdquo; ({stepLabel})
            </div>
          </div>
        )}

        {hasErrorMsg && (
          <div className="tutor-error-state" role="alert">
            <div className="tutor-error-state__illus">
              <Illustration name="tutor-error" size="sm" />
            </div>
            <p className="tutor-error-state__title">
              No se pudo conectar con el motor de IA
            </p>
            <p className="tutor-error-state__desc">
              {typeof aiError === 'string'
                ? aiError
                : 'El detalle y cómo solucionarlo está en el último mensaje.'}
            </p>
          </div>
        )}

        {aiMessages.map((m, idx) => (
          <div key={idx} className="tutor-thread-item">
            {m.question && (
              <div className="tutor-bubble tutor-bubble--user">
                <div className="tutor-msg-q">{m.question}</div>
              </div>
            )}
            <div className="tutor-bubble tutor-bubble--tutor">
              <div className="tutor-msg-source tabular">
                <span>{m.source || 'Tutor IA'}</span>
              </div>
              <div className="tutor-msg-a">{renderMarkdown(m.answer)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="tutor-panel__chips" aria-label="Sugerencias rápidas">
        {quickPrompts.map((item) => (
          <Chip
            key={item.label}
            variant="neutral"
            onClick={() => onAskTutor(item.prompt)}
            disabled={aiLoading}
          >
            {item.label}
          </Chip>
        ))}
      </div>

      <form className="tutor-panel__form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="tutor-panel__input"
          placeholder="Escribe tu duda técnica..."
          value={aiInput}
          onChange={(e) => onChangeAiInput(e.target.value)}
          aria-label="Consulta para el Tutor IA"
        />
        <Button
          type="submit"
          variant="primary"
          size="md"
          className="tutor-panel__send-btn"
          disabled={aiLoading || !aiInput.trim()}
          ariaLabel="Enviar consulta al Tutor IA"
          title="Enviar consulta"
        >
          <Send size={18} aria-hidden="true" />
        </Button>
      </form>

      <div className="tutor-panel__footer-note">
        Responde Gemini con tu suscripción Google AI Ultra, a través de Antigravity (agy).
      </div>
    </div>
  );
}

export default TutorPanel;
