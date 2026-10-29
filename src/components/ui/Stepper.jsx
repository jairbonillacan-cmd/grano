import React from 'react';
import { Check } from 'lucide-react';
import { getStageNumber } from './stageTheme.js';

export function Stepper({
  steps = [],
  activeStep = 0,
  completedSteps = [],
  variant = 'full',
  stage,
  onStepClick,
  ariaLabel = 'Pasos de la lección',
  className = '',
  ...rest
}) {
  const completedSet = new Set(Array.isArray(completedSteps) ? completedSteps : []);
  const stageAttr = stage ? getStageNumber(stage) : undefined;
  const isCompact = variant === 'compact';

  const normalizedSteps = steps.map((step, index) => {
    const isString = typeof step === 'string';
    const stepObj = isString ? { id: index, label: step } : step || {};
    const stepId = stepObj.id ?? index;
    const isActive =
      stepObj.status === 'active' || activeStep === index || activeStep === stepId;
    const isCompleted =
      stepObj.status === 'completed' ||
      Boolean(stepObj.completed) ||
      completedSet.has(index) ||
      completedSet.has(stepId) ||
      (typeof activeStep === 'number' && index < activeStep);

    return {
      ...stepObj,
      stepId,
      index,
      label: stepObj.label || stepObj.title || `Paso ${index + 1}`,
      isActive,
      isCompleted,
      disabled: Boolean(stepObj.disabled),
    };
  });

  const activeItem =
    normalizedSteps.find((s) => s.isActive) || normalizedSteps[0] || null;

  if (isCompact) {
    return (
      <div
        className={`ui-stepper-compact ${className}`.trim()}
        data-stage={stageAttr}
        {...rest}
      >
        <ol className="ui-stepper-compact__dots" aria-label={ariaLabel}>
          {normalizedSteps.map((step) => {
            const dotState = step.isActive
              ? 'ui-stepper-compact__dot--active'
              : step.isCompleted
                ? 'ui-stepper-compact__dot--completed'
                : 'ui-stepper-compact__dot--pending';

            return (
              <li key={step.stepId} className="ui-stepper-compact__item">
                <button
                  type="button"
                  className={`ui-stepper-compact__dot ${dotState}`}
                  aria-current={step.isActive ? 'step' : undefined}
                  aria-label={`Paso ${step.index + 1}: ${step.label}`}
                  disabled={step.disabled}
                  onClick={() => {
                    if (typeof onStepClick === 'function' && !step.disabled) {
                      onStepClick(step.index, step);
                    }
                  }}
                />
              </li>
            );
          })}
        </ol>
        {activeItem && (
          <div className="ui-stepper-compact__caption tabular">
            <span className="ui-stepper-compact__count">
              Paso {activeItem.index + 1} de {normalizedSteps.length}
            </span>
            <span className="ui-stepper-compact__sep" aria-hidden="true">·</span>
            <span className="ui-stepper-compact__label">{activeItem.label}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <ol
      className={`ui-stepper ${className}`.trim()}
      aria-label={ariaLabel}
      data-stage={stageAttr}
      {...rest}
    >
      {normalizedSteps.map((step, index) => {
        const stateClass = step.isActive
          ? 'ui-stepper__btn--active'
          : step.isCompleted
            ? 'ui-stepper__btn--completed'
            : 'ui-stepper__btn--pending';

        return (
          <li key={step.stepId} className="ui-stepper__item">
            <button
              type="button"
              className={`ui-stepper__btn ${stateClass}`}
              aria-current={step.isActive ? 'step' : undefined}
              disabled={step.disabled}
              onClick={() => {
                if (typeof onStepClick === 'function' && !step.disabled) {
                  onStepClick(step.index, step);
                }
              }}
            >
              <span className="ui-stepper__index tabular">
                {step.isCompleted && !step.isActive ? (
                  <Check size={12} strokeWidth={2.75} />
                ) : (
                  step.number ?? index + 1
                )}
              </span>
              <span className="ui-stepper__label">{step.label}</span>
            </button>
            {index < normalizedSteps.length - 1 && (
              <span className="ui-stepper__divider" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default Stepper;
