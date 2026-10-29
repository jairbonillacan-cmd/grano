import React from 'react';
import { getStageNumber } from './stageTheme.js';

const VALID_VARIANTS = ['primary', 'secondary', 'ghost', 'success', 'danger', 'stage'];
const VALID_SIZES = ['sm', 'md', 'lg'];

export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  fullWidth = false,
  icon: IconProp,
  iconRight: IconRightProp,
  stage,
  className = '',
  children,
  onClick,
  ariaLabel,
  ...rest
}) {
  const safeVariant = VALID_VARIANTS.includes(variant) ? variant : 'primary';
  const safeSize = VALID_SIZES.includes(size) ? size : 'md';
  const stageAttr = stage ? getStageNumber(stage) : undefined;

  const classes = [
    'ui-btn',
    `ui-btn--${safeVariant}`,
    `ui-btn--${safeSize}`,
    fullWidth ? 'ui-btn--full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const renderIcon = (iconItem) => {
    if (!iconItem) return null;
    if (React.isValidElement(iconItem)) {
      return <span className="ui-btn__icon" aria-hidden="true">{iconItem}</span>;
    }
    if (typeof iconItem === 'function' || typeof iconItem === 'object') {
      const IconComponent = iconItem;
      return (
        <span className="ui-btn__icon" aria-hidden="true">
          <IconComponent size={safeSize === 'sm' ? 15 : 17} />
        </span>
      );
    }
    return null;
  };

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      aria-label={ariaLabel}
      data-stage={stageAttr}
      onClick={disabled ? undefined : onClick}
      {...rest}
    >
      {renderIcon(IconProp)}
      {children !== undefined && children !== null && (
        <span className="ui-btn__label">{children}</span>
      )}
      {renderIcon(IconRightProp)}
    </button>
  );
}

export default Button;
