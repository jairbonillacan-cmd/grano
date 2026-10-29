// Accesibilidad: usa role="radiogroup" con opciones role="radio", aria-checked,
// tabIndex roving (0 en activa, -1 en inactivas) y navegación con flechas, Home y End.
import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function Segmented({
  items = [],
  options,
  value,
  activeId,
  onChange,
  size = 'md',
  fullWidth = false,
  ariaLabel = 'Selector de opción',
  className = '',
  ...rest
}) {
  const rawList = Array.isArray(options) ? options : items;
  const normalizedItems = rawList.map((item, idx) =>
    typeof item === 'string' || typeof item === 'number'
      ? { id: String(item), label: String(item) }
      : {
          id: item?.id ?? item?.value ?? String(idx),
          label: item?.label ?? item?.title ?? String(item?.value ?? idx + 1),
          track: item?.track,
          icon: item?.icon,
          disabled: Boolean(item?.disabled),
        }
  );

  const selectedId =
    value !== undefined
      ? String(value)
      : activeId !== undefined
        ? String(activeId)
        : normalizedItems[0]?.id;

  const activeIndex = Math.max(
    0,
    normalizedItems.findIndex((item) => String(item.id) === String(selectedId))
  );

  const containerRef = useRef(null);
  const itemRefs = useRef([]);
  const [indicator, setIndicator] = useState({ x: 0, w: 0, ready: false });

  const updateIndicator = () => {
    const btn = itemRefs.current[activeIndex];
    if (btn) {
      setIndicator({
        x: btn.offsetLeft,
        w: btn.offsetWidth,
        ready: true,
      });
    }
  };

  useIsomorphicLayoutEffect(() => {
    updateIndicator();
  }, [activeIndex, normalizedItems.length, size, fullWidth]);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined' || !containerRef.current) return undefined;
    const ro = new ResizeObserver(() => updateIndicator());
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [activeIndex, normalizedItems.length]);

  const focusAndSelect = (targetIndex) => {
    const candidate = normalizedItems[targetIndex];
    if (!candidate || candidate.disabled) return;
    itemRefs.current[targetIndex]?.focus();
    if (typeof onChange === 'function') {
      onChange(candidate.id, candidate);
    }
  };

  const handleKeyDown = (e, currentIndex) => {
    const total = normalizedItems.length;
    if (total === 0) return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      for (let i = 1; i <= total; i += 1) {
        const nextIndex = (currentIndex + i) % total;
        if (!normalizedItems[nextIndex]?.disabled) {
          focusAndSelect(nextIndex);
          break;
        }
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      for (let i = 1; i <= total; i += 1) {
        const prevIndex = (currentIndex - i + total) % total;
        if (!normalizedItems[prevIndex]?.disabled) {
          focusAndSelect(prevIndex);
          break;
        }
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      const firstIndex = normalizedItems.findIndex((it) => !it.disabled);
      if (firstIndex !== -1) focusAndSelect(firstIndex);
    } else if (e.key === 'End') {
      e.preventDefault();
      for (let i = total - 1; i >= 0; i -= 1) {
        if (!normalizedItems[i]?.disabled) {
          focusAndSelect(i);
          break;
        }
      }
    }
  };

  const safeSize = size === 'sm' ? 'sm' : 'md';
  const classes = [
    'ui-segmented',
    `ui-segmented--${safeSize}`,
    fullWidth ? 'ui-segmented--full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label={ariaLabel}
      className={classes}
      style={{
        '--seg-count': Math.max(1, normalizedItems.length),
        '--seg-index': activeIndex,
        '--seg-x': indicator.ready ? `${indicator.x}px` : undefined,
        '--seg-w': indicator.ready ? `${indicator.w}px` : undefined,
      }}
      {...rest}
    >
      <span
        className={`ui-segmented__indicator ${
          indicator.ready ? 'ui-segmented__indicator--ready' : ''
        }`.trim()}
        aria-hidden="true"
      />
      {normalizedItems.map((item, index) => {
        const isSelected = index === activeIndex;
        const IconComp = item.icon;
        return (
          <button
            key={item.id}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            disabled={item.disabled}
            data-track={item.track || undefined}
            className={`ui-segmented__option ${
              isSelected ? 'ui-segmented__option--active' : ''
            }`.trim()}
            onClick={() => {
              if (!item.disabled && typeof onChange === 'function') {
                onChange(item.id, item);
              }
            }}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {item.track && (
              <span
                className={`ui-segmented__dot ui-segmented__dot--${item.track}`}
                aria-hidden="true"
              />
            )}
            {IconComp && (
              <span className="ui-segmented__icon" aria-hidden="true">
                {React.isValidElement(IconComp) ? (
                  IconComp
                ) : (
                  <IconComp size={14} strokeWidth={1.75} />
                )}
              </span>
            )}
            <span className="ui-segmented__label">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default Segmented;
