// Indicador secuencial de pasos con lista ordenada (<ol>), aria-current="step" en el paso activo
// y botones enfocables por teclado cuando se proporciona onStepClick.
import React from 'react'
import { Check } from 'lucide-react'
import { resolveStageToken } from './stageTheme.js'

export function Stepper({
  steps = [],
  currentIndex = 0,
  completedIndices = [],
  onStepClick,
  stage,
  compact = false,
  className = '',
}) {
  const completedSet = new Set(completedIndices)
  const stageVar = stage !== undefined ? resolveStageToken(stage) : null
  const classes = [
    'ui-stepper',
    compact ? 'ui-stepper--compact' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <ol
      className={classes}
      style={stageVar ? { '--stage-color': stageVar } : undefined}
      aria-label="Pasos de la lección"
    >
      {steps.map((step, idx) => {
        const isCurrent = idx === currentIndex
        const isCompleted = completedSet.has(idx) || idx < currentIndex
        const stateClass = isCurrent
          ? 'is-current'
          : isCompleted
          ? 'is-done'
          : 'is-upcoming'
        const clickable = typeof onStepClick === 'function'

        const content = (
          <>
            <span className="ui-stepper__dot" aria-hidden="true">
              {isCompleted && !isCurrent ? (
                <Check size={11} strokeWidth={2.25} />
              ) : (
                <span>{idx + 1}</span>
              )}
            </span>
            {!compact && step?.label ? (
              <span className="ui-stepper__label">{step.label}</span>
            ) : null}
          </>
        )

        return (
          <li
            key={step?.id ?? idx}
            className={`ui-stepper__item ${stateClass}`}
            aria-current={isCurrent ? 'step' : undefined}
          >
            {clickable ? (
              <button
                type="button"
                className="ui-stepper__button"
                onClick={() => onStepClick(idx)}
                title={step?.label || `Paso ${idx + 1}`}
              >
                {content}
              </button>
            ) : (
              <div className="ui-stepper__static" title={step?.label || `Paso ${idx + 1}`}>
                {content}
              </div>
            )}
            {idx < steps.length - 1 ? (
              <span
                className={`ui-stepper__connector ${isCompleted ? 'is-filled' : ''}`}
                aria-hidden="true"
              />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

export default Stepper
