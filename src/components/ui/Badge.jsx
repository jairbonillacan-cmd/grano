// Etiqueta heredada para compatibilidad de vistas en migración; expone contenido textual sin capturar foco.
// @deprecated Usar Chip o texto tabular en su lugar; se eliminará cuando T12/T13 migren sus vistas.
import React from 'react'
import { resolveStageToken } from './stageTheme.js'

/**
 * @deprecated Componente heredado. Preferir `Chip` o contadores tabulares planos (`--font-mono`).
 */
export function Badge({
  variant = 'neutral',
  stage,
  size = 'md',
  icon: Icon,
  pulse = false,
  children,
  className = '',
  style,
  ...rest
}) {
  const stageVar = stage !== undefined ? resolveStageToken(stage) : null
  const classes = [
    'ui-badge',
    `ui-badge--${variant}`,
    `ui-badge--${size}`,
    pulse ? 'is-pulse' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const mergedStyle = stageVar ? { '--stage-color': stageVar, ...style } : style

  return (
    <span className={classes} style={mergedStyle} {...rest}>
      {Icon ? (
        <span className="ui-badge__icon" aria-hidden="true">
          <Icon size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14} strokeWidth={1.75} />
        </span>
      ) : null}
      <span className="ui-badge__label">{children}</span>
    </span>
  )
}

export default Badge
