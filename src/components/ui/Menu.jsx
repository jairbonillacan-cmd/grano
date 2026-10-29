// Menú desplegable accesible con aria-haspopup="menu", aria-expanded, role="menu" y role="menuitem".
// Navegación completa por teclado (ArrowDown, ArrowUp, Home, End, Enter, Space, Escape) y cierre por clic fuera.
import React, { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

export function Menu({
  label = 'Opciones',
  trigger,
  items = [],
  align = 'start',
  className = '',
  onSelect,
}) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const menuId = useId()
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const itemRefs = useRef([])

  const enabledIndices = items
    .map((item, idx) => (item && !item.disabled && !item.divider ? idx : -1))
    .filter((idx) => idx !== -1)

  const focusItem = (idx) => {
    setActiveIndex(idx)
    window.requestAnimationFrame(() => {
      itemRefs.current[idx]?.focus()
    })
  }

  const openMenu = (initialPos = 'first') => {
    if (!enabledIndices.length) return
    setOpen(true)
    const targetIdx =
      initialPos === 'last'
        ? enabledIndices[enabledIndices.length - 1]
        : enabledIndices[0]
    focusItem(targetIdx)
  }

  const closeMenu = (restoreFocus = true) => {
    setOpen(false)
    if (restoreFocus) {
      triggerRef.current?.focus()
    }
  }

  useEffect(() => {
    if (!open) return undefined
    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    window.addEventListener('mousedown', handlePointerDown)
    return () => window.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  const handleTriggerKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openMenu('first')
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      openMenu('last')
    } else if (event.key === 'Escape' && open) {
      event.preventDefault()
      closeMenu(true)
    }
  }

  const handleMenuKeyDown = (event) => {
    if (!enabledIndices.length) return
    const currentPos = enabledIndices.indexOf(activeIndex)

    if (event.key === 'Escape') {
      event.preventDefault()
      closeMenu(true)
      return
    }
    if (event.key === 'Tab') {
      setOpen(false)
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      const nextPos = currentPos === -1 ? 0 : (currentPos + 1) % enabledIndices.length
      focusItem(enabledIndices[nextPos])
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      const prevPos =
        currentPos === -1
          ? enabledIndices.length - 1
          : (currentPos - 1 + enabledIndices.length) % enabledIndices.length
      focusItem(enabledIndices[prevPos])
      return
    }
    if (event.key === 'Home') {
      event.preventDefault()
      focusItem(enabledIndices[0])
      return
    }
    if (event.key === 'End') {
      event.preventDefault()
      focusItem(enabledIndices[enabledIndices.length - 1])
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      const item = items[activeIndex]
      if (item && !item.disabled && !item.divider) {
        item.onSelect?.(item)
        onSelect?.(item)
        closeMenu(true)
      }
    }
  }

  const classes = ['ui-menu', `ui-menu--${align}`, className].filter(Boolean).join(' ')

  return (
    <div ref={rootRef} className={classes}>
      {trigger ? (
        React.cloneElement(trigger, {
          ref: triggerRef,
          'aria-haspopup': 'menu',
          'aria-expanded': open,
          'aria-controls': open ? menuId : undefined,
          onClick: (event) => {
            trigger.props.onClick?.(event)
            if (open) closeMenu(false)
            else openMenu('first')
          },
          onKeyDown: (event) => {
            trigger.props.onKeyDown?.(event)
            handleTriggerKeyDown(event)
          },
        })
      ) : (
        <button
          ref={triggerRef}
          type="button"
          className="ui-btn ui-btn--secondary ui-btn--md ui-menu__trigger"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          onClick={() => (open ? closeMenu(false) : openMenu('first'))}
          onKeyDown={handleTriggerKeyDown}
        >
          <span className="ui-btn__label">{label}</span>
          <ChevronDown size={14} strokeWidth={1.75} aria-hidden="true" />
        </button>
      )}
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={typeof label === 'string' ? label : 'Menú'}
          className="ui-menu__popover"
          onKeyDown={handleMenuKeyDown}
        >
          {items.map((item, idx) => {
            if (item.divider) {
              return <div key={item.id || `div-${idx}`} className="ui-menu__divider" role="separator" />
            }
            const Icon = item.icon
            const isActive = idx === activeIndex
            return (
              <button
                key={item.id || item.label || idx}
                ref={(el) => {
                  itemRefs.current[idx] = el
                }}
                type="button"
                role="menuitem"
                tabIndex={isActive ? 0 : -1}
                disabled={item.disabled}
                className={[
                  'ui-menu__item',
                  item.danger ? 'ui-menu__item--danger' : '',
                  isActive ? 'is-active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onMouseEnter={() => {
                  if (!item.disabled) setActiveIndex(idx)
                }}
                onClick={() => {
                  if (item.disabled) return
                  item.onSelect?.(item)
                  onSelect?.(item)
                  closeMenu(true)
                }}
              >
                {Icon ? (
                  <span className="ui-menu__item-icon" aria-hidden="true">
                    <Icon size={15} strokeWidth={1.75} />
                  </span>
                ) : null}
                <span className="ui-menu__item-label">{item.label}</span>
                {item.shortcut ? (
                  <span className="ui-menu__item-shortcut" aria-hidden="true">
                    {item.shortcut}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export default Menu
