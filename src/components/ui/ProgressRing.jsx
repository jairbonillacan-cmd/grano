// Anillo de progreso circular heredado con role="progressbar" y atributos aria-valuenow/aria-valuemin/aria-valuemax.
// @deprecated Usar ProgressBar (2px/4px) o fracción tabular en su lugar; sin destellos decorativos.
import React from 'react'
import { resolveStageToken } from './stageTheme.js'

/**
 * @deprecated Componente heredado. Preferir `ProgressBar` o fracción tabular (`12 / 18 · 67%`).
 */
export function ProgressRing({
  value = 0,
  max = 100,
  size = 56,
  strokeWidth = 4,
  tone = 'brand',
  stage,
  label,
  sublabel,
  showValue = true,
  className = '',
  children,
}) {
  const safeMax = max > 0 ? max : 100
  const pct = Math.max(0, Math.min(100, (value / safeMax) * 100))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (pct / 100) * circumference
  const stageVar = stage !== undefined ? resolveStageToken(stage) : null
  const resolvedTone = tone === 'stage' ? 'brand' : tone

  const classes = [
    'ui-progress-ring',
    `ui-progress-ring--${resolvedTone}`,
    pct >= 100 ? 'is-complete' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const style = {
    width: `${size}px`,
    height: `${size}px`,
    ...(stageVar ? { '--stage-color': stageVar } : {}),
  }

  return (
    <div
      className={classes}
      style={style}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-label={label || 'Progreso'}
    >
      <svg
        className="ui-progress-ring__svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          className="ui-progress-ring__track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="ui-progress-ring__fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="ui-progress-ring__center">
        {children !== undefined ? (
          children
        ) : showValue ? (
          <>
            <span className="ui-progress-ring__value">{Math.round(pct)}%</span>
            {sublabel ? (
              <span className="ui-progress-ring__sublabel">{sublabel}</span>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  )
}

export default ProgressRing
