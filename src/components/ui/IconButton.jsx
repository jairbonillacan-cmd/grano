// Botón cuadrado solo-icono (28/34/40px, 44px en pointer: coarse) que exige aria-label y envuelve siempre en Tooltip.
// Soporta estado loading sin cambiar dimensiones y anillo de foco :focus-visible de 2px.
import React from 'react'
import Tooltip from './Tooltip.jsx'

const VARIANT_ALIASES = {
  primary: 'primary',
  secondary: 'secondary',
  ghost: 'ghost',
  danger: 'danger',
}

export function IconButton({
  icon: Icon,
  label,
  'aria-label': ariaLabelProp,
  tooltip,
  tooltipPlacement = 'top',
  variant = 'ghost',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  const resolvedLabel = ariaLabelProp || label || tooltip || 'Acción'
  const resolvedVariant = VARIANT_ALIASES[variant] || 'ghost'
  const isDisabled = disabled || loading

  const classes = [
    'ui-icon-btn',
    `ui-icon-btn--${resolvedVariant}`,
    `ui-icon-btn--${size}`,
    loading ? 'is-loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const buttonEl = (
    <button
      type={type}
      className={classes}
      disabled={isDisabled}
      aria-label={resolvedLabel}
      aria-busy={loading ? 'true' : undefined}
      {...rest}
    >
      {loading ? (
        <span className="ui-btn__spinner" aria-hidden="true" />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} strokeWidth={1.75} aria-hidden="true" />
      ) : (
        children
      )}
    </button>
  )

  return (
    <Tooltip content={tooltip || resolvedLabel} position={tooltipPlacement}>
      {buttonEl}
    </Tooltip>
  )
}

export default IconButton
