import React, { useState } from 'react';
import AnswerOption from '../../components/ui/AnswerOption.jsx';
import { formatInlineText } from '../../utils/formatText.jsx';

export function LessonCheckCard({
  check,
  index,
  total,
  savedAnswer,
  onAnswer,
  onAskTutor,
}) {
  const checkType = check.type || 'mcq';
  const options = Array.isArray(check.options) ? check.options : [];

  // Estado local para checks tipo 'order' o 'fill-code'
  const [orderList, setOrderList] = useState(() =>
    Array.isArray(check.items) ? check.items.map((it, idx) => (typeof it === 'string' ? { id: `it-${idx}`, text: it, origIdx: idx } : { ...it, origIdx: idx })) : []
  );
  const [fillValue, setFillValue] = useState(() => savedAnswer?.textValue || '');

  const selectedOptionId = savedAnswer?.optionId ?? null;
  const isAnswered = Boolean(savedAnswer?.answered || selectedOptionId !== null);
  const isCorrect = Boolean(savedAnswer?.correct);

  const isOptionCorrect = (opt) =>
    typeof opt.correct === 'boolean'
      ? opt.correct
      : Boolean(check.correctOptionId && opt.id === check.correctOptionId);

  const handleSelectOption = (opt, optIdx) => {
    const correct = isOptionCorrect(opt);
    onAnswer(check.id, {
      answered: true,
      optionId: opt.id || `opt-${optIdx}`,
      optionIndex: optIdx,
      optionText: opt.text,
      correct,
    });
  };

  const handleCardKeyDown = (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      return;
    }
    if (options.length === 0) return;

    const key = e.key.toUpperCase();
    let idx = -1;
    if (key >= '1' && key <= '9') {
      idx = Number.parseInt(key, 10) - 1;
    } else if (key >= 'A' && key <= 'D') {
      idx = key.charCodeAt(0) - 65;
    }

    if (idx >= 0 && idx < options.length) {
      e.preventDefault();
      e.stopPropagation();
      handleSelectOption(options[idx], idx);
    }
  };

  const moveOrderItem = (fromIdx, dir) => {
    const toIdx = fromIdx + dir;
    if (toIdx < 0 || toIdx >= orderList.length) return;
    const next = [...orderList];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setOrderList(next);
  };

  const handleVerifyOrder = () => {
    const expectedOrder = check.correctOrder || orderList.map((it) => it.id);
    const currentOrder = orderList.map((it) => it.id);
    const correct = expectedOrder.length === orderList.length && expectedOrder.every((exp, i) => { const cur = orderList[i]; return exp === cur.id || exp === cur.text || exp === cur.origIdx; });

    onAnswer(check.id, {
      answered: true,
      optionId: currentOrder.join(','),
      optionText: orderList.map((it) => it.text).join(' -> '),
      correct,
    });
  };

  const handleVerifyFillCode = (e) => {
    e.preventDefault();
    const cleanInput = String(fillValue || '').trim().toLowerCase();
    const blanks = Array.isArray(check.blanks) ? check.blanks : [];
    let accepted = Array.isArray(check.acceptedAnswers)
      ? check.acceptedAnswers.map((a) => String(a).trim().toLowerCase())
      : check.correctAnswer
        ? [String(check.correctAnswer).trim().toLowerCase()]
        : [];
    if (accepted.length === 0 && blanks.length > 0) {
      if (blanks.length === 1 && Array.isArray(blanks[0].accepted)) {
        accepted = blanks[0].accepted.map((a) => String(a).trim().toLowerCase());
      } else {
        const parts = cleanInput.split(/\s*[,;|]\s*|\s+/).filter(Boolean);
        const multiMatch =
          parts.length >= blanks.length &&
          blanks.every((b, idx) =>
            (b.accepted || []).some((a) => String(a).trim().toLowerCase() === parts[idx])
          );
        const firstBlankAccepted = (blanks[0]?.accepted || []).map((a) =>
          String(a).trim().toLowerCase()
        );
        accepted = multiMatch ? [cleanInput] : firstBlankAccepted;
      }
    }
    const correct = accepted.length > 0 ? accepted.includes(cleanInput) : cleanInput.length > 0;

    onAnswer(check.id, {
      answered: true,
      optionId: cleanInput || 'enviado',
      textValue: fillValue,
      optionText: fillValue,
      correct,
    });
  };

  const selectedOptionObj = options.find(
    (o, idx) => (o.id || `opt-${idx}`) === selectedOptionId
  );

  const typeBadgeLabel =
    checkType === 'predict-output'
      ? 'Predecir salida'
      : checkType === 'order' || checkType === 'order-steps'
        ? 'Ordenar pasos'
        : checkType === 'fill-code' || checkType === 'fill-blank'
          ? 'Completar código'
          : 'Opción múltiple';

  return (
    <article
      className={`lp-check-card${isAnswered ? (isCorrect ? ' is-correct' : ' is-incorrect') : ''}`}
      tabIndex={0}
      onKeyDown={handleCardKeyDown}
      aria-label={`Comprobación ${index + 1} de ${total}`}
    >
      <header className="lp-check-card__head">
        <div className="lp-check-card__meta">
          <span className="lp-check-card__num tabular">
            Comprobación {index + 1} de {total}
          </span>
          <span className="lp-check-card__type">{typeBadgeLabel}</span>
        </div>
        <span
          className={`lp-check-card__status${
            isAnswered ? (isCorrect ? ' is-ok' : ' is-bad') : ''
          }`}
        >
          {isAnswered
            ? isCorrect
              ? 'Correcta'
              : 'Revisar razonamiento'
            : 'Teclas 1–4 para responder'}
        </span>
      </header>

      <h3 className="lp-check-card__prompt">
        {formatInlineText(check.prompt, `chk-prompt-${check.id}`)}
      </h3>

      {check.code || check.template ? (
        <pre className="lp-check-card__code">
          <code>{check.code || check.template}</code>
        </pre>
      ) : null}

      {options.length > 0 ? (
        <div className="lp-check-card__options" role="group" aria-label={check.prompt}>
          {options.map((opt, optIdx) => {
            const optId = opt.id || `opt-${optIdx}`;
            const isSelected = selectedOptionId === optId;
            const isOptCorrect = isOptionCorrect(opt);

            let optionState = 'neutral';
            if (isAnswered) {
              if (isSelected && isOptCorrect) {
                optionState = 'correct';
              } else if (isSelected && !isOptCorrect) {
                optionState = 'incorrect';
              } else if (isOptCorrect) {
                optionState = 'correct';
              }
            }

            return (
              <AnswerOption
                key={optId}
                index={optIdx}
                state={optionState}
                shortcut={String(optIdx + 1)}
                onSelect={() => handleSelectOption(opt, optIdx)}
                explanation={
                  isSelected && opt.feedback
                    ? formatInlineText(opt.feedback, `chk-fb-${check.id}-${optId}`)
                    : null
                }
              >
                {formatInlineText(opt.text, `chk-opt-${check.id}-${optId}`)}
              </AnswerOption>
            );
          })}
        </div>
      ) : null}

      {(checkType === 'order' || checkType === 'order-steps') && orderList.length > 0 ? (
        <div className="lp-check-order">
          <ol className="lp-check-order__list">
            {orderList.map((item, itemIdx) => (
              <li key={item.id} className="lp-check-order__item">
                <span className="lp-check-order__idx tabular">{itemIdx + 1}</span>
                <span className="lp-check-order__text">
                  {formatInlineText(item.text, `ord-${check.id}-${item.id}`)}
                </span>
                <div className="lp-check-order__controls">
                  <button
                    type="button"
                    className="lp-ghost-action"
                    disabled={itemIdx === 0}
                    onClick={() => moveOrderItem(itemIdx, -1)}
                    aria-label="Subir paso"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="lp-ghost-action"
                    disabled={itemIdx === orderList.length - 1}
                    onClick={() => moveOrderItem(itemIdx, 1)}
                    aria-label="Bajar paso"
                  >
                    ↓
                  </button>
                </div>
              </li>
            ))}
          </ol>
          <button
            type="button"
            className="lp-btn lp-btn--secondary"
            onClick={handleVerifyOrder}
          >
            Verificar orden
          </button>
        </div>
      ) : null}

      {(checkType === 'fill-code' || checkType === 'fill-blank') && options.length === 0 ? (
        <form className="lp-check-fill" onSubmit={handleVerifyFillCode}>
          <label className="lp-check-fill__label" htmlFor={`fill-${check.id}`}>
            Completa la expresión faltante:
          </label>
          <div className="lp-check-fill__row">
            <input
              id={`fill-${check.id}`}
              type="text"
              className="lp-check-fill__input"
              value={fillValue}
              onChange={(e) => setFillValue(e.target.value)}
              placeholder={check.placeholder || 'Escribe la cláusula o expresión SQL...'}
            />
            <button type="submit" className="lp-btn lp-btn--secondary">
              Comprobar
            </button>
          </div>
        </form>
      ) : null}

      {isAnswered ? (
        <div className={`lp-check-feedback ${isCorrect ? 'is-ok' : 'is-bad'}`}>
          <div className="lp-check-feedback__body">
            <strong className="lp-check-feedback__title">
              {isCorrect ? 'Razonamiento verificado:' : 'Por qué ocurre este resultado:'}
            </strong>
            {check.explanation ? (
              <p className="lp-check-feedback__text">
                {formatInlineText(check.explanation, `chk-exp-${check.id}`)}
              </p>
            ) : selectedOptionObj?.feedback ? (
              <p className="lp-check-feedback__text">
                {formatInlineText(selectedOptionObj.feedback, `chk-sfb-${check.id}`)}
              </p>
            ) : null}
          </div>

          <div className="lp-check-feedback__actions">
            <button
              type="button"
              className="lp-check-tutor-btn"
              onClick={() =>
                onAskTutor?.({
                  mode: 'explain-error',
                  sectionId: 'comprobaciones',
                  selection: check.prompt,
                  code: check.code || '',
                  result: selectedOptionObj?.text || savedAnswer?.optionText || '',
                  prefill: `No termino de entender esta comprobación:\n\nPregunta: "${check.prompt}"\nMi respuesta: "${selectedOptionObj?.text || savedAnswer?.optionText || ''}"\n\nExplícame paso a paso por qué la opción correcta funciona así.`,
                })
              }
            >
              No lo entiendo — explicar en el tutor
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
