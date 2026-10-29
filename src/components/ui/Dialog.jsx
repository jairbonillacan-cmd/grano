// Diálogo modal basado en el elemento nativo <dialog> (showModal/close) con trampa de foco y cierre con Escape.
// Incluye título etiquetado por aria-labelledby, descripción opcional (aria-describedby) y pie de acciones.
import React, { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'

export function Dialog({
  open = false,
  onClose,
  title,
  description,
  actions,
  size = 'md',
  children,
  className = '',
}) {
  const dialogRef = useRef(null)
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return undefined

    if (open) {
      if (!dialog.open) {
        if (typeof dialog.showModal === 'function') {
          try {
            dialog.showModal()
          } catch {
            dialog.setAttribute('open', '')
          }
        } else {
          dialog.setAttribute('open', '')
        }
      }
    } else if (dialog.open) {
      if (typeof dialog.close === 'function') {
        dialog.close()
      } else {
        dialog.removeAttribute('open')
      }
    }
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return undefined

    const handleCancel = (event) => {
      event.preventDefault()
      onClose?.()
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && open) {
        event.preventDefault()
        onClose?.()
      }
    }
    dialog.addEventListener('cancel', handleCancel)
    dialog.addEventListener('keydown', handleKeyDown)
    return () => {
      dialog.removeEventListener('cancel', handleCancel)
      dialog.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  const handleBackdropClick = (event) => {
    if (event.target === dialogRef.current) {
      onClose?.()
    }
  }

  const classes = ['ui-dialog', `ui-dialog--${size}`, className].filter(Boolean).join(' ')

  return (
    <dialog
      ref={dialogRef}
      className={classes}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
      onClick={handleBackdropClick}
    >
      <div className="ui-dialog__panel">
        <header className="ui-dialog__header">
          <div className="ui-dialog__headings">
            {title ? (
              <h2 id={titleId} className="ui-dialog__title">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p id={descId} className="ui-dialog__description">
                {description}
              </p>
            ) : null}
          </div>
          {onClose ? (
            <button
              type="button"
              className="ui-dialog__close"
              onClick={onClose}
              aria-label="Cerrar diálogo"
            >
              <X size={16} strokeWidth={1.75} aria-hidden="true" />
            </button>
          ) : null}
        </header>
        {children ? <div className="ui-dialog__body">{children}</div> : null}
        {actions ? <footer className="ui-dialog__footer">{actions}</footer> : null}
      </div>
    </dialog>
  )
}

export default Dialog
