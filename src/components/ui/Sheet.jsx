import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button.jsx';

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
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && typeof onClose === 'function') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const safeSide = side === 'bottom' ? 'bottom' : 'right';

  return (
    <div
      className="ui-sheet-backdrop"
      onClick={() => {
        if (typeof onClose === 'function') onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Panel deslizable'}
      {...rest}
    >
      <div
        className={`ui-sheet ui-sheet--${safeSide} ${className}`.trim()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ui-sheet__handle" aria-hidden="true" />
        <div className="ui-sheet__header">
          <div className="ui-sheet__titles">
            {title && <h2 className="ui-sheet__title">{title}</h2>}
            {subtitle && <p className="ui-sheet__subtitle">{subtitle}</p>}
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

export default Sheet;
