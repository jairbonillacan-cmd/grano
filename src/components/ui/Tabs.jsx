// Accesibilidad: usa role="tablist" y pestañas con role="tab", aria-selected,
// tabIndex roving (0 en activa, -1 en inactivas) y navegación con flechas, Home y End.
import React, { useRef, useState, useLayoutEffect, useEffect } from 'react'
import { getStageNumber } from './stageTheme.js'

const VALID_VARIANTS = ['pills', 'underline', 'segmented']
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

export function Tabs({
  items = [],
  value,
  activeId,
  onChange,
  variant = 'underline',
  stage,
  ariaLabel = 'Pestañas de navegación',
  className = '',
  ...rest
}) {
  const safeVariant = VALID_VARIANTS.includes(variant) ? variant : 'underline'
  const stageAttr = stage ? getStageNumber(stage) : undefined

  const normalizedItems = items.map((item, idx) =>
    typeof item === 'string'
      ? { id: item, label: item }
      : {
          id: item?.id ?? String(idx),
          label: item?.label ?? item?.title ?? `Opción ${idx + 1}`,
          badge: item?.badge ?? item?.count,
          icon: item?.icon,
          disabled: Boolean(item?.disabled),
        }
  )

  const currentActiveId =
    value !== undefined
      ? value
      : activeId !== undefined
      ? activeId
      : normalizedItems[0]?.id

  const activeIndex = Math.max(
    0,
    normalizedItems.findIndex((item) => item.id === currentActiveId)
  )

  const containerRef = useRef(null)
  const tabRefs = useRef([])
  const [indicator, setIndicator] = useState({ x: 0, w: 0, ready: false })

  const updateIndicator = () => {
    const btn = tabRefs.current[activeIndex]
    if (btn) {
      setIndicator({
        x: btn.offsetLeft,
        w: btn.offsetWidth,
        ready: true,
      })
    }
  }

  useIsomorphicLayoutEffect(() => {
    updateIndicator()
  }, [activeIndex, normalizedItems.length, safeVariant])

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined' || !containerRef.current) return undefined
    const ro = new ResizeObserver(() => updateIndicator())
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [activeIndex, normalizedItems.length])

  const focusAndActivate = (targetIndex) => {
    const candidate = normalizedItems[targetIndex]
    if (!candidate || candidate.disabled) return
    tabRefs.current[targetIndex]?.focus()
    if (typeof onChange === 'function') {
      onChange(candidate.id, candidate)
    }
  }

  const handleKeyDown = (e, currentIndex) => {
    const total = normalizedItems.length
    if (total === 0) return

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      for (let i = 1; i <= total; i += 1) {
        const nextIndex = (currentIndex + i) % total
        if (!normalizedItems[nextIndex]?.disabled) {
          focusAndActivate(nextIndex)
          break
        }
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      for (let i = 1; i <= total; i += 1) {
        const prevIndex = (currentIndex - i + total) % total
        if (!normalizedItems[prevIndex]?.disabled) {
          focusAndActivate(prevIndex)
          break
        }
      }
    } else if (e.key === 'Home') {
      e.preventDefault()
      const firstIndex = normalizedItems.findIndex((it) => !it.disabled)
      if (firstIndex !== -1) focusAndActivate(firstIndex)
    } else if (e.key === 'End') {
      e.preventDefault()
      for (let i = total - 1; i >= 0; i -= 1) {
        if (!normalizedItems[i]?.disabled) {
          focusAndActivate(i)
          break
        }
      }
    }
  }

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label={ariaLabel}
      data-stage={stageAttr}
      className={`ui-tabs ui-tabs--${safeVariant} ${className}`.trim()}
      style={{
        '--tab-count': Math.max(1, normalizedItems.length),
        '--tab-index': activeIndex,
        '--tab-x': indicator.ready ? `${indicator.x}px` : undefined,
        '--tab-w': indicator.ready ? `${indicator.w}px` : undefined,
      }}
      {...rest}
    >
      { normalizedItems.map((item, index) => {
        const isSelected = index === activeIndex
        const IconComp = item.icon
        return (
          <button
            key={item.id}
            ref={(el) => {
              tabRefs.current[index] = el
            }}
            type="button"
            role="tab"
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            disabled={item.disabled}
            className={`ui-tabs__tab ${
              isSelected ? 'is-active ui-tabs__tab--active' : ''
            }`.trim()}
            onClick={() => {
              if (!item.disabled && typeof onChange === 'function') {
                onChange(item.id, item)
              }
            }}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {IconComp && (
              <span className="ui-tabs__icon" aria-hidden="true">
                {React.isValidElement(IconComp) ? (
                  IconComp
                ) : (
                  <IconComp size={15} strokeWidth={1.75} />
                )}
              </span>
            )}
            <span className="ui-tabs__label">{item.label}</span>
            {item.badge !== undefined && item.badge !== null && (
              <span className="ui-tabs__count ui-tabs__badge tabular">{item.badge}</span>
            )}
          </button>
        )
      })}
      <span
        className={`ui-tabs__indicator ${
          indicator.ready ? 'ui-tabs__indicator--ready' : ''
        }`.trim()}
        aria-hidden="true"
      />
    </div>
  )
}

export default Tabs
