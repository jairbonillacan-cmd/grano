// Estado vacío sobrio: sin ilustración por defecto (solo se muestra si se pasa explícitamente illustration).
// Texto explicativo conciso de 1 frase en --ink-2 y acción primaria o secundaria opcional.
import React from 'react'
import Illustration from './Illustration.jsx'

export function EmptyState({
  illustration = null,
  icon: Icon = null,
  title,
  description,
  action,
  secondaryAction,
  compact = false,
  className = '',
}) {
  const classes = [
    'ui-empty',
    compact ? 'ui-empty--compact' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} role="status">
      {Icon ? (
        <div className="ui-empty__visual" aria-hidden="true">
          <Icon size={20} strokeWidth={1.5} />
        </div>
      ) : illustration ? (
        <div className="ui-empty__visual" aria-hidden="true">
          {typeof illustration === 'string' ? (
            <Illustration name={illustration} size={compact ? 48 : 64} />
          ) : (
            illustration
          )}
        </div>
      ) : null}
      {title ? <h3 className="ui-empty__title">{title}</h3> : null}
      {description ? <p className="ui-empty__description">{description}</p> : null}
      {action || secondaryAction ? (
        <div className="ui-empty__actions">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  )
}

export default EmptyState
