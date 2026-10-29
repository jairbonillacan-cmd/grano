// Accesibilidad: usa <button> nativo con type explícito, foco visible (--focus-ring),
// soporte de teclado (Enter/Space), aria-disabled y aria-busy="true" con spinner sin cambio de ancho.
import React from 'react'
import { getStageNumber } from './stageTheme.js'

const VARIANT_MAP = {
  primary: 'primary',
  secondary: 'secondary',
  ghost: 'ghost',
  danger: 'danger',
  link: 'link',
  success: 'primary',
  stage: 'secondary',
}

const VALID_SIZES = ['sm', 'md', 'lg']

function ButtonSpinner() {
  return <span className="ui-btn__spinner" aria-hidden="true" />
}

export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  fullWidth = false,
  block = false,
  icon: IconProp,
  iconRight: IconRightProp,
  shortcut,
  stage,
  className = '',
  children,
  onClick,
  ariaLabel,
  ...rest
}) {
  const safeVariant = VARIANT_MAP[variant] || 'primary'
  const safeSize = VALID_SIZES.includes(size) ? size : 'md'
  const isBusy = Boolean(loading || rest['aria-busy'] === true || rest['aria-busy'] === 'true')
  const stageAttr = stage ? getStageNumber(stage) : undefined

  const hasLeadingIcon = Boolean(IconProp)
  const hasTrailingIcon = Boolean(IconRightProp)
  const hasAnyIcon = hasLeadingIcon || hasTrailingIcon
  const hasLabel = children !== undefined && children !== null && children !== ''

  const classes = [
    'ui-btn',
    `ui-btn--${safeVariant}`,
    `ui-btn--${safeSize}`,
    fullWidth || block ? 'ui-btn--block ui-btn--full' : '',
    isBusy ? 'is-loading ui-btn--loading' : '',
    !hasLabel && hasAnyIcon ? 'ui-btn--icon-only' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const iconSize = safeSize === 'sm' ? 14 : 16

  const renderIconNode = (iconItem, replaceWithSpinner) => {
    if (!iconItem && !replaceWithSpinner) return null
    if (replaceWithSpinner) {
      return (
        <span className="ui-btn__icon" aria-hidden="true">
          <ButtonSpinner />
        </span>
      )
    }
    if (React.isValidElement(iconItem)) {
      return (
        <span className="ui-btn__icon" aria-hidden="true">
          {iconItem}
        </span>
      )
    }
    if (typeof iconItem === 'function' || typeof iconItem === 'object') {
      const IconComponent = iconItem
      return (
        <span className="ui-btn__icon" aria-hidden="true">
          <IconComponent size={iconSize} strokeWidth={1.75} />
        </span>
      )
    }
    return null
  }

  const replaceLeading = isBusy && hasLeadingIcon
  const replaceTrailing = isBusy && !hasLeadingIcon && hasTrailingIcon
  const overlaySpinner = isBusy && !hasAnyIcon

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || isBusy}
      aria-disabled={disabled || isBusy || undefined}
      aria-busy={isBusy ? 'true' : undefined}
      aria-label={ariaLabel}
      data-stage={stageAttr}
      onClick={disabled || isBusy ? undefined : onClick}
      {...rest}
    >
      <span
        className={`ui-btn__content ${overlaySpinner ? 'ui-btn__content--hidden' : ''}`.trim()}
      >
        {renderIconNode(IconProp, replaceLeading)}
        {hasLabel && <span className="ui-btn__label">{children}</span>}
        {renderIconNode(IconRightProp, replaceTrailing)}
        {shortcut ? (
          <kbd className="ui-btn__kbd" aria-hidden="true">
            {shortcut}
          </kbd>
        ) : null}
      </span>
      {overlaySpinner && (
        <span className="ui-btn__spinner-overlay" aria-hidden="true">
          <ButtonSpinner />
        </span>
      )}
    </button>
  )
}

export default Button
