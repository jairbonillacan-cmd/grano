import React from 'react';
import { getStageNumber } from './stageTheme.js';

const VALID_VARIANTS = ['pills', 'underline', 'segmented'];

export function Tabs({
  items = [],
  activeId,
  onChange,
  variant = 'pills',
  stage,
  ariaLabel = 'Pestañas de navegación',
  className = '',
  ...rest
}) {
  const safeVariant = VALID_VARIANTS.includes(variant) ? variant : 'pills';
  const stageAttr = stage ? getStageNumber(stage) : undefined;

  const normalizedItems = items.map((item, idx) =>
    typeof item === 'string'
      ? { id: item, label: item }
      : {
          id: item?.id ?? String(idx),
          label: item?.label ?? item?.title ?? `Opción ${idx + 1}`,
          badge: item?.badge,
          icon: item?.icon,
          disabled: Boolean(item?.disabled),
        }
  );

  const currentActiveId =
    activeId !== undefined ? activeId : normalizedItems[0]?.id;

  const handleKeyDown = (e, currentIndex) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    const total = normalizedItems.length;
    if (total === 0) return;
    for (let i = 1; i <= total; i += 1) {
      const nextIndex = (currentIndex + dir * i + total) % total;
      const candidate = normalizedItems[nextIndex];
      if (candidate && !candidate.disabled) {
        if (typeof onChange === 'function') {
          onChange(candidate.id, candidate);
        }
        break;
      }
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      data-stage={stageAttr}
      className={`ui-tabs ui-tabs--${safeVariant} ${className}`.trim()}
      {...rest}
    >
      {normalizedItems.map((item, index) => {
        const isSelected = item.id === currentActiveId;
        const IconComp = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            disabled={item.disabled}
            className={`ui-tabs__tab ${isSelected ? 'ui-tabs__tab--active' : ''}`.trim()}
            onClick={() => {
              if (!item.disabled && typeof onChange === 'function') {
                onChange(item.id, item);
              }
            }}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {IconComp && (
              <span className="ui-tabs__icon" aria-hidden="true">
                {React.isValidElement(IconComp) ? IconComp : <IconComp size={15} />}
              </span>
            )}
            <span>{item.label}</span>
            {item.badge !== undefined && item.badge !== null && (
              <span className="ui-tabs__badge tabular">{item.badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
