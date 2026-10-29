import React, { useId } from 'react';

export function Tooltip({
  content,
  label,
  position = 'top',
  className = '',
  children,
  ...rest
}) {
  const tooltipId = useId();
  const text = content ?? label;
  const safePos = position === 'bottom' ? 'bottom' : 'top';

  if (!text) return <>{children}</>;

  return (
    <span
      className={`ui-tooltip-wrap ui-tooltip-wrap--${safePos} ${className}`.trim()}
      aria-describedby={tooltipId}
      {...rest}
    >
      {children}
      <span id={tooltipId} role="tooltip" className="ui-tooltip">
        {text}
      </span>
    </span>
  );
}

export default Tooltip;
