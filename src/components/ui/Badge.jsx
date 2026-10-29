import React from 'react';
import {
  Database,
  Layers,
  Cpu,
  Workflow,
  BarChart3,
  Sparkles,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { getStageTheme, getStageNumber } from './stageTheme.js';

const STAGE_ICON_MAP = {
  Database,
  Layers,
  Cpu,
  Workflow,
  BarChart3,
  Sparkles,
};

export function Badge({
  stage = 1,
  unlocked = false,
  title,
  subtitle,
  className = '',
  ...rest
}) {
  const stageNum = getStageNumber(stage);
  const meta = getStageTheme(stageNum);
  const StageIcon = STAGE_ICON_MAP[meta.iconName] || Database;

  const displayTitle = title || `Etapa ${stageNum} · ${meta.shortName}`;
  const displaySubtitle = subtitle || meta.name;

  const classes = [
    'ui-badge',
    unlocked ? 'ui-badge--unlocked' : 'ui-badge--locked',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      data-stage={stageNum}
      aria-label={`${displayTitle} (${unlocked ? 'Desbloqueada' : 'Bloqueada'})`}
      {...rest}
    >
      <div className="ui-badge__emblem" aria-hidden="true">
        {unlocked ? <StageIcon size={22} /> : <Lock size={18} />}
      </div>
      <div className="ui-badge__body">
        <div className="ui-badge__header">
          <span className="ui-badge__eyebrow tabular">ETAPA 0{stageNum}</span>
          {unlocked && (
            <span className="ui-badge__status">
              <CheckCircle2 size={13} aria-hidden="true" />
              <span>Logro</span>
            </span>
          )}
        </div>
        <div className="ui-badge__title">{displayTitle}</div>
        {displaySubtitle && <div className="ui-badge__subtitle">{displaySubtitle}</div>}
      </div>
    </div>
  );
}

export default Badge;
