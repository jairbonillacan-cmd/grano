import React from 'react';
import { Database, Sigma, LayoutDashboard } from 'lucide-react';
import { getStageNumber, getRoleMeta } from './stageTheme.js';

const VALID_VARIANTS = ['neutral', 'primary', 'stage', 'role', 'success', 'warning', 'danger'];

const ROLE_ICON_MAP = {
  DE: Database,
  DA: Sigma,
  BI: LayoutDashboard,
};

export function Chip({
  variant = 'neutral',
  tone,
  role: roleProp,
  stage,
  icon: IconProp,
  onClick,
  disabled = false,
  active = false,
  className = '',
  children,
  ariaLabel,
  ...rest
}) {
  const rawVariant = roleProp ? 'role' : tone || variant || 'neutral';
  const safeVariant = VALID_VARIANTS.includes(rawVariant) ? rawVariant : 'neutral';
  const effectiveVariant = active && safeVariant === 'neutral' ? 'primary' : safeVariant;

  const roleMeta = effectiveVariant === 'role' ? getRoleMeta(roleProp || children) : null;
  const RoleIcon = roleMeta ? ROLE_ICON_MAP[roleMeta.key] || Database : null;
  const stageAttr = stage ? getStageNumber(stage) : undefined;

  const classes = [
    'ui-chip',
    `ui-chip--${effectiveVariant}`,
    roleMeta ? `ui-chip--role-${roleMeta.key.toLowerCase()}` : '',
    active ? 'ui-chip--active' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const renderLeadingIcon = () => {
    if (RoleIcon) {
      return (
        <span className="ui-chip__icon" aria-hidden="true">
          <RoleIcon size={14} />
        </span>
      );
    }
    if (!IconProp) return null;
    if (React.isValidElement(IconProp)) {
      return <span className="ui-chip__icon" aria-hidden="true">{IconProp}</span>;
    }
    if (typeof IconProp === 'function' || typeof IconProp === 'object') {
      const CustomIcon = IconProp;
      return (
        <span className="ui-chip__icon" aria-hidden="true">
          <CustomIcon size={14} />
        </span>
      );
    }
    return null;
  };

  const content = children !== undefined && children !== null ? children : roleMeta?.short;

  if (typeof onClick === 'function') {
    return (
      <button
        type="button"
        className={classes}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        aria-disabled={disabled || undefined}
        aria-pressed={active || undefined}
        aria-label={ariaLabel}
        data-stage={stageAttr}
        {...rest}
      >
        {renderLeadingIcon()}
        <span>{content}</span>
      </button>
    );
  }

  return (
    <span className={classes} aria-label={ariaLabel} data-stage={stageAttr} {...rest}>
      {renderLeadingIcon()}
      <span>{content}</span>
    </span>
  );
}

export default Chip;
