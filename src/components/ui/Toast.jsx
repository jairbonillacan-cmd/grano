// Accesibilidad: usa role="status" (o "alert" en errores) con aria-live="polite",
// pausa el temporizador de 4 s al enfocar o pasar el ratón y permite cierre manual por teclado.
import React, { useEffect, useState } from 'react'
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  X,
} from 'lucide-react'
import { getStageNumber } from './stageTheme.js'

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
}

const TONE_ICONS = {
  info: Info,
  ok: CheckCircle2,
  warn: AlertTriangle,
  bad: AlertOctagon,
}

export function Toast({
  id,
  tone = 'info',
  stage,
  title,
  description,
  action,
  onClose,
  duration = 4000,
  floating = false,
  open = true,
  className = '',
  children,
  ...rest
}) {
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (!open || typeof onClose !== 'function') return undefined
    if (!Number.isFinite(duration) || duration <= 0 || paused) return undefined
    const timer = window.setTimeout(() => {
      onClose(id)
    }, duration)
    return () => window.clearTimeout(timer)
  }, [id, open, onClose, duration, paused])

  if (!open) return null

  const safeTone = TONE_MAP[tone] || 'info'
  const stageAttr = stage ? getStageNumber(stage) : undefined
  const IconComp = TONE_ICONS[safeTone] || Info
  const bodyContent =
    children !== undefined && children !== null ? children : description

  const classes = [
    'ui-toast',
    `ui-toast--${safeTone}`,
    floating ? 'ui-toast--floating' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      role={safeTone === 'bad' ? 'alert' : 'status'}
      aria-live="polite"
      data-stage={stageAttr}
      className={classes}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      {...rest}
    >
      <span className="ui-toast__icon" aria-hidden="true">
        <IconComp size={16} strokeWidth={1.75} />
      </span>
      <div className="ui-toast__body ui-toast__content">
        {title && <div className="ui-toast__title">{title}</div>}
        {bodyContent && (
          <div className="ui-toast__description ui-toast__desc">{bodyContent}</div>
        )}
      </div>
      {action && <div className="ui-toast__action">{action}</div>}
      {typeof onClose === 'function' && (
        <button
          type="button"
          className="ui-toast__close"
          onClick={() => onClose(id)}
          aria-label="Cerrar notificación"
        >
          <X size={15} strokeWidth={1.75} />
        </button>
      )}
    </div>
  )
}

export function ToastStack({ toasts = [], onDismiss, children, className = '', ...rest }) {
  if (!toasts.length && !children) return null
  return (
    <div
      className={`ui-toast-stack ${className}`.trim()}
      aria-live="polite"
      aria-relevant="additions text"
      {...rest}
    >
      {toasts.map((t) => (
        <Toast
          key={t.id}
          {...t}
          onClose={t.onClose || (onDismiss ? () => onDismiss(t.id) : undefined)}
        />
      ))}
      {children}
    </div>
  )
}

export default Toast
