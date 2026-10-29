import React from 'react';
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Sparkles,
  X,
} from 'lucide-react';
import { getStageNumber } from './stageTheme.js';

const VALID_TONES = ['info', 'success', 'warning', 'danger', 'stage'];

const TONE_ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertOctagon,
  stage: Sparkles,
};

export function Toast({
  tone = 'info',
  stage,
  title,
  description,
  action,
  onClose,
  floating = false,
  open = true,
  className = '',
  children,
  ...rest
}) {
  if (!open) return null;

  const safeTone = VALID_TONES.includes(tone) ? tone : stage ? 'stage' : 'info';
  const stageAttr = stage ? getStageNumber(stage) : undefined;
  const IconComp = TONE_ICONS[safeTone] || Info;
  const bodyContent = children !== undefined && children !== null ? children : description;

  const classes = [
    'ui-toast',
    `ui-toast--${safeTone}`,
    floating ? 'ui-toast--floating' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      role={safeTone === 'danger' ? 'alert' : 'status'}
      aria-live="polite"
      data-stage={stageAttr}
      className={classes}
      {...rest}
    >
      <span className="ui-toast__icon" aria-hidden="true">
        <IconComp size={18} />
      </span>
      <div className="ui-toast__content">
        {title && <div className="ui-toast__title">{title}</div>}
        {bodyContent && <div className="ui-toast__desc">{bodyContent}</div>}
      </div>
      {action && <div className="ui-toast__action">{action}</div>}
      {typeof onClose === 'function' && (
        <button
          type="button"
          className="ui-toast__close"
          onClick={onClose}
          aria-label="Cerrar notificación"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export default Toast;
