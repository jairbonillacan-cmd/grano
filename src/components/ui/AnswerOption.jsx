// Opción de respuesta accesible con soporte de teclado, aria-pressed y estados neutral/selected/correct/incorrect.
// En correct dibuja un check SVG con trazo animado (stroke-dashoffset, 260ms); en incorrect muestra borde --bad e icono X sin shake.
import React from 'react'
import { X } from 'lucide-react'
import Kbd from './Kbd.jsx'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

function AnimatedCheckIcon() {
  return (
    <svg
      className="ui-answer__check-svg"
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        className="ui-answer__check-path"
        d="M3.25 8.5L6.5 11.75L12.75 4.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function AnswerOption({
  index = 0,
  letter,
  state = 'neutral',
  disabled = false,
  onSelect,
  onClick,
  shortcut,
  explanation,
  children,
  className = '',
  ...rest
}) {
  const resolvedLetter = letter || LETTERS[index] || String(index + 1)
  const resolvedState =
    state === 'idle' || state === 'default' ? 'neutral' : state

  const classes = [
    'ui-answer',
    `ui-answer--${resolvedState}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const handleClick = (event) => {
    if (disabled) return
    if (onSelect) onSelect(index, event)
    if (onClick) onClick(event)
  }

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled}
      onClick={handleClick}
      aria-pressed={resolvedState === 'selected' || resolvedState === 'correct'}
      data-state={resolvedState}
      {...rest}
    >
      <span className="ui-answer__badge" aria-hidden="true">
        {resolvedState === 'correct' ? (
          <AnimatedCheckIcon />
        ) : resolvedState === 'incorrect' ? (
          <X size={14} strokeWidth={2} />
        ) : (
          resolvedLetter
        )}
      </span>
      <span className="ui-answer__body">
        <span className="ui-answer__label">{children}</span>
        {explanation ? (
          <span className="ui-answer__explanation">{explanation}</span>
        ) : null}
      </span>
      {shortcut ? (
        <span className="ui-answer__shortcut" aria-hidden="true">
          <Kbd>{shortcut}</Kbd>
        </span>
      ) : null}
    </button>
  )
}

export default AnswerOption
