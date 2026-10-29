// Accesibilidad: contenedor semántico; cuando recibe onClick asigna role="button", tabIndex={0},
// aria-disabled y activación mediante teclado con Enter o Space.
import React from 'react'
import { getStageNumber } from './stageTheme.js'

export function Card({
  as: Component = 'div',
  interactive = false,
  compact = false,
  sunken = false,
  stage,
  accentTop = false,
  padding = 'md',
  title,
  subtitle,
  meta,
  actions,
  footer,
  onClick,
  disabled = false,
  className = '',
  children,
  ariaLabel,
  ...rest
}) {
  const isClickable = typeof onClick === 'function'
  const isInteractive = interactive || isClickable
  const stageAttr = stage ? getStageNumber(stage) : undefined

  const classes = [
    'ui-card',
    isInteractive ? 'ui-card--interactive' : '',
    isClickable ? 'ui-card--clickable' : '',
    compact ? 'ui-card--compact' : '',
    sunken ? 'ui-card--sunken' : '',
    accentTop ? 'ui-card--top-bar' : '',
    padding !== 'md' ? `ui-card--pad-${padding}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const handleKeyDown = (e) => {
    if (!isClickable || disabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick(e)
    }
  }

  const hasStructuredHeader = Boolean(title || subtitle || meta || actions)

  return (
    <Component
      className={classes}
      data-stage={stageAttr}
      onClick={isClickable && !disabled ? onClick : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? (disabled ? -1 : 0) : undefined}
      aria-disabled={isClickable && disabled ? 'true' : undefined}
      aria-label={ariaLabel}
      {...rest}
    >
      {hasStructuredHeader ? (
        <header className="ui-card__header">
          <div className="ui-card__headings">
            {meta ? <span className="ui-card__meta">{meta}</span> : null}
            {title ? <h2 className="ui-card__title">{title}</h2> : null}
            {subtitle ? <p className="ui-card__subtitle">{subtitle}</p> : null}
          </div>
          {actions ? <div className="ui-card__actions">{actions}</div> : null}
        </header>
      ) : null}
      {children ? (
        hasStructuredHeader ? (
          <div className="ui-card__body">{children}</div>
        ) : (
          children
        )
      ) : null}
      {footer ? <footer className="ui-card__footer">{footer}</footer> : null}
    </Component>
  )
}

export default Card
