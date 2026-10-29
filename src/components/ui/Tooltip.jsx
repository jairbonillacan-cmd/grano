// Accesibilidad: expone role="tooltip" con id único vinculado mediante aria-describedby
// al control hijo, visible al pasar el ratón o al recibir foco por teclado y cerrable con Escape.
import React, { useId, useState } from 'react';

export function Tooltip({
  content,
  label,
  position = 'top',
  className = '',
  children,
  ...rest
}) {
  const tooltipId = useId();
  const [dismissed, setDismissed] = useState(false);
  const text = content ?? label;
  const safePos = position === 'bottom' ? 'bottom' : 'top';

  if (!text) return <>{children}</>;

  const childWithAria =
    React.isValidElement(children) && typeof children.type !== 'symbol'
      ? React.cloneElement(children, {
          'aria-describedby': children.props?.['aria-describedby']
            ? `${children.props['aria-describedby']} ${tooltipId}`
            : tooltipId,
        })
      : children;

  return (
    <span
      className={`ui-tooltip-wrap ui-tooltip-wrap--${safePos} ${
        dismissed ? 'ui-tooltip-wrap--dismissed' : ''
      } ${className}`.trim()}
      aria-describedby={tooltipId}
      onMouseEnter={() => setDismissed(false)}
      onFocus={() => setDismissed(false)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          setDismissed(true);
        }
      }}
      {...rest}
    >
      {childWithAria}
      <span id={tooltipId} role="tooltip" className="ui-tooltip">
        {text}
      </span>
    </span>
  );
}

export default Tooltip;
