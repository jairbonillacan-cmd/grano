import React from 'react';
import { Check, X } from 'lucide-react';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const VALID_STATES = ['idle', 'selected', 'correct', 'incorrect'];

export function AnswerOption({
  letter,
  index = 0,
  state = 'idle',
  selected = false,
  correct = false,
  incorrect = false,
  disabled = false,
  label,
  feedback,
  onClick,
  className = '',
  children,
  ...rest
}) {
  let resolvedState = VALID_STATES.includes(state) ? state : 'idle';
  if (resolvedState === 'idle') {
    if (correct) resolvedState = 'correct';
    else if (incorrect) resolvedState = 'incorrect';
    else if (selected) resolvedState = 'selected';
  }

  const displayLetter =
    letter || LETTERS[Number(index) % LETTERS.length] || 'A';

  const animClass =
    resolvedState === 'correct'
      ? 'anim-pop'
      : resolvedState === 'incorrect'
        ? 'anim-shake'
        : '';

  const classes = [
    'ui-answer-option',
    `ui-answer-option--${resolvedState}`,
    animClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = children !== undefined && children !== null ? children : label;

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      aria-pressed={resolvedState !== 'idle'}
      onClick={disabled ? undefined : onClick}
      {...rest}
    >
      <span className="ui-answer-option__badge tabular" aria-hidden="true">
        {resolvedState === 'correct' ? (
          <Check size={15} strokeWidth={2.75} />
        ) : resolvedState === 'incorrect' ? (
          <X size={15} strokeWidth={2.75} />
        ) : (
          displayLetter
        )}
      </span>
      <span className="ui-answer-option__body">
        <span className="ui-answer-option__text">{content}</span>
        {feedback && (
          <span className="ui-answer-option__feedback">{feedback}</span>
        )}
      </span>
    </button>
  );
}

export default AnswerOption;
