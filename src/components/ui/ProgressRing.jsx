import React from 'react';
import { getStageNumber } from './stageTheme.js';

const VALID_TONES = ['primary', 'stage', 'success', 'warning', 'danger'];

export function ProgressRing({
  size = 40,
  value = 0,
  label,
  tone = 'primary',
  stage,
  celebrate = false,
  ariaLabel,
  className = '',
  children,
  ...rest
}) {
  const numericSize = Number.isFinite(Number(size)) && Number(size) >= 24 ? Number(size) : 40;
  const strokeWidth = numericSize >= 60 ? 5 : 4;
  const radius = (numericSize - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(
    100,
    Math.max(0, Number.isFinite(Number(value)) ? Math.round(Number(value)) : 0)
  );
  const offset = circumference - (clamped / 100) * circumference;
  const safeTone = VALID_TONES.includes(tone) ? tone : stage ? 'stage' : 'primary';
  const stageAttr = stage ? getStageNumber(stage) : undefined;

  const classes = [
    'ui-progress-ring',
    celebrate ? 'ui-progress-ring--celebrate' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const centerContent = children !== undefined && children !== null ? children : label;

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={
        ariaLabel ||
        (typeof label === 'string' ? `Progreso ${label}` : `Progreso ${clamped}%`)
      }
      data-stage={stageAttr}
      className={classes}
      {...rest}
    >
      <svg
        width={numericSize}
        height={numericSize}
        viewBox={`0 0 ${numericSize} ${numericSize}`}
        className="ui-progress-ring__svg"
        aria-hidden="true"
      >
        <circle
          className="ui-progress-ring__track"
          cx={numericSize / 2}
          cy={numericSize / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className={`ui-progress-ring__indicator ui-progress-ring__indicator--${safeTone}`}
          cx={numericSize / 2}
          cy={numericSize / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>

      {celebrate ? (
        <span className="ui-progress-ring__celebration" aria-hidden="true">
          <svg
            width={Math.round(numericSize * 0.45)}
            height={Math.round(numericSize * 0.45)}
            viewBox="0 0 24 24"
            fill="none"
            className="ui-progress-ring__check"
          >
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="anim-draw-check"
            />
          </svg>
          <span className="ui-progress-ring__sparkle ui-progress-ring__sparkle--1 anim-sparkle" />
          <span className="ui-progress-ring__sparkle ui-progress-ring__sparkle--2 anim-sparkle" />
          <span className="ui-progress-ring__sparkle ui-progress-ring__sparkle--3 anim-sparkle" />
        </span>
      ) : (
        centerContent !== undefined &&
        centerContent !== null && (
          <span className="ui-progress-ring__label tabular">{centerContent}</span>
        )
      )}
    </div>
  );
}

export default ProgressRing;
