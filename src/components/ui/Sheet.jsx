// Accesibilidad: usa role="dialog" con aria-modal="true", aria-labelledby, foco atrapado
// con Tab/Shift+Tab, cierre con Escape y restauración del foco al elemento previo.
import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button.jsx';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Sheet({
  open = false,
  onClose,
  title,
  subtitle,
  side = 'right',
  footer,
  className = '',
  children,
  ...rest
}) {
  const titleId = useId();
  const subtitleId = useId();
  const sheetRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    previousFocusRef.current =
      typeof document !== 'undefined' ? document.activeElement : null;

    const focusTimer = window.setTimeout(() => {
      const panel = sheetRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll(FOCUSABLE_SELECTOR);
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        panel.focus();
      }
    }, 0);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && typeof onClose === 'function') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab' && sheetRef.current) {
        const nodes = Array.from(
          sheetRef.current.querySelectorAll(FOCUSABLE_SELECTOR)
        );
        if (nodes.length === 0) {
          e.preventDefault();
          return;
        }
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey) {
          if (
            document.activeElement === first ||
            !sheetRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            last.focus();
          }
        } else if (
          document.activeElement === last ||
          !sheetRef.current.contains(document.activeElement)
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      if (
        previousFocusRef.current &&
        typeof previousFocusRef.current.focus === 'function'
      ) {
        try {
          previousFocusRef.current.focus();
        } catch {}
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  const safeSide =
    side === 'bottom' ? 'bottom' : side === 'left' ? 'left' : 'right';

  return (
    <div
      className={`ui-sheet-backdrop ui-sheet-backdrop--${safeSide}`}
      onClick={() => {
        if (typeof onClose === 'function') onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={subtitle ? subtitleId : undefined}
      aria-label={!title ? 'Panel lateral' : undefined}
      {...rest}
    >
      <div
        ref={sheetRef}
        tabIndex={-1}
        className={`ui-sheet ui-sheet--${safeSide} ${className}`.trim()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ui-sheet__handle" aria-hidden="true" />
        <div className="ui-sheet__header">
          <div className="ui-sheet__titles">
            {title && (
              <h2 id={titleId} className="ui-sheet__title">
                {title}
              </h2>
            )}
            {subtitle && (
              <p id={subtitleId} className="ui-sheet__subtitle">
                {subtitle}
              </p>
            )}
          </div>
          {typeof onClose === 'function' && (
            <Button
              variant="ghost"
              size="sm"
              ariaLabel="Cerrar panel"
              onClick={onClose}
              icon={X}
            />
          )}
        </div>
        <div className="ui-sheet__body">{children}</div>
        {footer && <div className="ui-sheet__footer">{footer}</div>}
      </div>
    </div>
  );
}

export const Drawer = Sheet;
export default Sheet;
