// Accesibilidad: expone role="progressbar", aria-valuenow, aria-valuemin=0, aria-valuemax=max
// y aria-label descriptivo para lectores de pantalla. Grosores 2px (sm) y 4px (md) en --brand.
import React from 'react'
import { getStageNumber } from './stageTheme.js'

export function ProgressBar({
  value = 0,
  max = 100,
  tone = 'brand',
  size = 'md',
  thickness,
  stage,
  label,
  showValue = false,
  ariaLabel,
  className = '',
  ...rest
}) {
  const safeMax = Number.isFinite(Number(max)) && Number(max) > 0 ? Number(max) : 100
  const rawVal = Number.isFinite(Number(value)) ? Number(value) : 0
  const pct = Math.min(100, Math.max(0, Math.round((rawVal / safeMax) * 100)))

  const isThin =
    thickness === 2 ||
    size === 'sm' ||
    size === 'thin' ||
    size === '2px' ||
    size === 2

  const sizeMod = isThin ? 'ui-progress--sm ui-progress-bar--2' : 'ui-progress--md ui-progress-bar--4'
  const stageAttr = stage ? getStageNumber(stage) : undefined

  const classes = ['ui-progress', 'ui-progress-bar', `ui-progress--${tone}`, sizeMod, className]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(rawVal)}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-label={ariaLabel || label || 'Progreso'}
      data-stage={stageAttr}
      data-tone={tone}
      className={classes}
      {...rest}
    >
      {(label && showValue) || showValue ? (
        <div className="ui-progress__header">
          {label ? <span className="ui-progress__label">{label}</span> : <span />}
          {showValue ? <span className="ui-progress__value">{pct}%</span> : null}
        </div>
      ) : null}
      <div className="ui-progress__track">
        <div
          className="ui-progress__fill ui-progress-bar__fill"
          style={{ width: `${pct}%`, '--value': `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default ProgressBar
