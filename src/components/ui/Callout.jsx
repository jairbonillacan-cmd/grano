// Bloque de aviso contextual con 4 tonos (info, ok, warn, bad), borde izquierdo de 2px e icono lucide-react.
// Usa role="note" o role="alert" según severidad, sin fondos saturados.
import React from 'react'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { resolveStageToken } from './stageTheme.js'

const TONE_MAP = {
  info: 'info',
  neutral: 'info',
  stage: 'info',
  ok: 'ok',
  success: 'ok',
  warn: 'warn',
  warning: 'warn',
  bad: 'bad',
  danger: 'bad',
  error: 'bad',
}

const DEFAULT_ICONS = {
  info: Info,
  ok: CheckCircle2,
  warn: AlertTriangle,
  bad: XCircle,
}

export function Callout({
  tone = 'info',
  stage,
  title,
  icon: IconOverride,
  actions,
  children,
  className = '',
  style,
  ...rest
}) {
  const resolvedTone = TONE_MAP[tone] || 'info'
  const stageVar = stage !== undefined ? resolveStageToken(stage) : null
  const Icon = IconOverride !== undefined ? IconOverride : DEFAULT_ICONS[resolvedTone] || Info
  const classes = ['ui-callout', `ui-callout--${resolvedTone}`, className]
    .filter(Boolean)
    .join(' ')
  const mergedStyle = stageVar ? { '--stage-color': stageVar, ...style } : style
  const role = resolvedTone === 'bad' || resolvedTone === 'warn' ? 'alert' : 'note'

  return (
    <aside className={classes} style={mergedStyle} role={role} {...rest}>
      {Icon ? (
        <span className="ui-callout__icon" aria-hidden="true">
          <Icon size={16} strokeWidth={1.75} />
        </span>
      ) : null}
      <div className="ui-callout__body">
        {title ? <div className="ui-callout__title">{title}</div> : null}
        {children ? <div className="ui-callout__content">{children}</div> : null}
        {actions ? <div className="ui-callout__actions">{actions}</div> : null}
      </div>
    </aside>
  )
}

export default Callout
