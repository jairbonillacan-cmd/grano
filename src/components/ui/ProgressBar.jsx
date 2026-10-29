import React from 'react';
import { getStageNumber } from './stageTheme.js';

const VALID_TONES = ['primary', 'stage', 'success', 'warning', 'danger'];
const VALID_SIZES = ['sm', 'md', 'lg'];

export function ProgressBar({
  value = 0,
  tone = 'primary',
  size = 'md',
  stage,
  label,
  ariaLabel,
  className = '',
  ...rest
}) {
  const clamped = Math.min(
    100,
    Math.max(0, Number.isFinite(Number(value)) ? Math.round(Number(value)) : 0)
  );
  const safeTone = VALID_TONES.includes(tone) ? tone : stage ? 'stage' : 'primary';
  const safeSize = VALID_SIZES.includes(size) ? size : 'md';
  const stageAttr = stage ? getStageNumber(stage) : undefined;

  const classes = [
    'ui-progress-bar',
    `ui-progress-bar--${safeSize}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel || label || 'Progreso'}
      data-stage={stageAttr}
      className={classes}
      {...rest}
    >
      <div
        className={`ui-progress-bar__fill ui-progress-bar__fill--${safeTone}`}
        style={{ '--value': `${clamped}%` }}
      />
    </div>
  );
}

export default ProgressBar;
