import React from 'react';
import { BrandMark, BrandLogo } from '../../assets/brand/BrandMark.jsx';
import { STAGE_ILLUSTRATIONS } from '../../assets/illustrations/StageIllustrations.jsx';
import { STATE_ILLUSTRATIONS } from '../../assets/illustrations/StateIllustrations.jsx';
import { mountUiShowcaseIllustrationsIfActive } from '../../assets/illustrations/UiIllustrationsMount.jsx';

if (typeof window !== 'undefined') {
  mountUiShowcaseIllustrationsIfActive();
}

function resolveStageNumber(stage, name) {
  if (typeof stage === 'number' && stage >= 1 && stage <= 6) {
    return stage;
  }
  if (typeof stage === 'string') {
    const match = stage.match(/([1-6])/);
    if (match) return Number(match[1]);
  }
  if (typeof name === 'number' && name >= 1 && name <= 6) {
    return name;
  }
  if (typeof name === 'string' && name.startsWith('stage-')) {
    const parsed = Number(name.split('-')[1]);
    if (parsed >= 1 && parsed <= 6) return parsed;
  }
  return undefined;
}

function resolveIllustrationKey(name, resolvedStage) {
  if (typeof name === 'string' && STATE_ILLUSTRATIONS[name]) {
    return name;
  }
  if (typeof name === 'string' && STAGE_ILLUSTRATIONS[name]) {
    return name;
  }
  if (typeof name === 'number' && STAGE_ILLUSTRATIONS[name]) {
    return `stage-${name}`;
  }
  if (resolvedStage && STAGE_ILLUSTRATIONS[resolvedStage]) {
    return `stage-${resolvedStage}`;
  }
  return 'stage-1';
}

export function Illustration({
  name,
  stage,
  size = 'md',
  className = '',
  'aria-hidden': ariaHiddenProp = 'true',
  ...rest
}) {
  const resolvedStage = resolveStageNumber(stage, name);
  const resolvedKey = resolveIllustrationKey(name, resolvedStage);
  const SvgComponent =
    STATE_ILLUSTRATIONS[resolvedKey] ||
    STAGE_ILLUSTRATIONS[resolvedKey] ||
    STAGE_ILLUSTRATIONS['stage-1'];

  const safeSize = size === 'sm' || size === 'lg' ? size : 'md';

  return (
    <div
      className={`ui-illustration ui-illustration--${safeSize} ${className}`.trim()}
      data-stage={resolvedStage}
      data-illustration={resolvedKey}
      aria-hidden={ariaHiddenProp}
      {...rest}
    >
      <SvgComponent className="ui-illustration-svg" />
    </div>
  );
}

export { BrandLogo, BrandMark };
export default Illustration;
