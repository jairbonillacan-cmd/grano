import React from 'react';
import { Info, CheckCircle2, AlertTriangle, AlertOctagon, Sparkles } from 'lucide-react';
import { getStageNumber } from './stageTheme.js';

const VALID_TONES = ['info', 'success', 'danger', 'warning', 'stage'];

const TONE_ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertOctagon,
  stage: Sparkles,
};

export function Callout({
  tone = 'info',
  stage,
  icon: IconProp,
  title,
  children,
  className = '',
  ...rest
}) {
  const safeTone = VALID_TONES.includes(tone) ? tone : stage ? 'stage' : 'info';
  const role = safeTone === 'danger' || safeTone === 'warning' ? 'alert' : 'note';
  const stageAttr = stage ? getStageNumber(stage) : undefined;
  const classes = `ui-callout ui-callout--${safeTone} ${className}`.trim();

  const renderIcon = () => {
    if (IconProp === false) return null;
    if (React.isValidElement(IconProp)) {
      return <span className="ui-callout__icon" aria-hidden="true">{IconProp}</span>;
    }
    const IconComponent =
      typeof IconProp === 'function' || typeof IconProp === 'object'
        ? IconProp
        : TONE_ICONS[safeTone] || Info;
    return (
      <span className="ui-callout__icon" aria-hidden="true">
        <IconComponent size={18} />
      </span>
    );
  };

  return (
    <div role={role} className={classes} data-stage={stageAttr} {...rest}>
      {renderIcon()}
      <div className="ui-callout__content">
        {title && <div className="ui-callout__title">{title}</div>}
        <div className="ui-callout__body">{children}</div>
      </div>
    </div>
  );
}

export default Callout;
