import React from 'react';
import { getStageNumber } from './stageTheme.js';

export function Card({
  as: Component = 'div',
  interactive = false,
  stage,
  accentTop = false,
  padding = 'md',
  onClick,
  disabled = false,
  className = '',
  children,
  ariaLabel,
  ...rest
}) {
  const isClickable = typeof onClick === 'function';
  const isInteractive = interactive || isClickable;
  const stageAttr = stage ? getStageNumber(stage) : undefined;

  const classes = [
    'ui-card',
    isInteractive ? 'ui-card--interactive' : '',
    isClickable ? 'ui-card--clickable' : '',
    accentTop ? 'ui-card--top-bar' : '',
    padding !== 'md' ? `ui-card--pad-${padding}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleKeyDown = (e) => {
    if (!isClickable || disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(e);
    }
  };

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
      {children}
    </Component>
  );
}

export default Card;
