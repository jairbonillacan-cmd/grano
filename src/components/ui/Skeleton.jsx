import React from 'react';

const VALID_VARIANTS = ['text', 'title', 'card', 'circle', 'block'];

export function Skeleton({
  variant = 'text',
  lines = 1,
  className = '',
  ariaLabel = 'Cargando contenido',
  ...rest
}) {
  const safeVariant = VALID_VARIANTS.includes(variant) ? variant : 'text';
  const count = Math.max(1, Math.min(8, Number(lines) || 1));

  if (count > 1 && safeVariant === 'text') {
    return (
      <div
        className={`ui-skeleton-group ${className}`.trim()}
        role="status"
        aria-label={ariaLabel}
        aria-busy="true"
        {...rest}
      >
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className={`ui-skeleton ui-skeleton--text ${
              idx === count - 1 ? 'ui-skeleton--short' : ''
            }`.trim()}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`ui-skeleton ui-skeleton--${safeVariant} ${className}`.trim()}
      role="status"
      aria-label={ariaLabel}
      aria-busy="true"
      {...rest}
    />
  );
}

export default Skeleton;
