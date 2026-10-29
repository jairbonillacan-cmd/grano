// Accesibilidad: estático como <span> o interactivo como <button type="button"> con aria-pressed,
// foco visible (--focus-ring), soporte de teclado (Enter/Space) y punto de 6px para rol DE/DA/BI.
import React from 'react'
import { X } from 'lucide-react'
import { getStageNumber, getRoleMeta } from './stageTheme.js'

const TRACK_VARS = {
  de: 'var(--track-de)',
  da: 'var(--track-da)',
  bi: 'var(--track-bi)',
}

function resolveTrackKey(trackProp, roleProp) {
  const raw = trackProp || roleProp
  if (!raw) return null
  const norm = String(raw).trim().toLowerCase()
  if (norm === 'de' || norm.includes('ingenier')) return 'de'
  if (norm === 'da' || norm.includes('análisis') || norm.includes('analisis')) return 'da'
  if (norm === 'bi' || norm.includes('business')) return 'bi'
  const meta = getRoleMeta(raw)
  return meta?.key ? meta.key.toLowerCase() : null
}

export function Chip({
  variant = 'neutral',
  tone,
  track,
  role: roleProp,
  stage,
  icon: IconProp,
  onClick,
  onRemove,
  disabled = false,
  active = false,
  selected = false,
  className = '',
  style,
  children,
  ariaLabel,
  ...rest
}) {
  const trackKey = resolveTrackKey(track, roleProp)
  const isSelected = Boolean(active || selected)
  const stageAttr = stage ? getStageNumber(stage) : undefined
  const chipAccent = trackKey ? TRACK_VARS[trackKey] : undefined
  const mergedStyle = chipAccent ? { '--chip-accent': chipAccent, ...style } : style

  const classes = [
    'ui-chip',
    `ui-chip--${tone || variant || 'neutral'}`,
    trackKey ? `ui-chip--track-${trackKey}` : '',
    isSelected ? 'is-selected ui-chip--active' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const renderLeading = () => {
    if (trackKey) {
      return <span className="ui-chip__dot" aria-hidden="true" />
    }
    if (!IconProp) return null
    if (React.isValidElement(IconProp)) {
      return (
        <span className="ui-chip__icon" aria-hidden="true">
          {IconProp}
        </span>
      )
    }
    if (typeof IconProp === 'function' || typeof IconProp === 'object') {
      const CustomIcon = IconProp
      return (
        <span className="ui-chip__icon" aria-hidden="true">
          <CustomIcon size={12} strokeWidth={1.75} />
        </span>
      )
    }
    return null
  }

  const defaultTrackLabel = trackKey ? trackKey.toUpperCase() : ''
  const content =
    children !== undefined && children !== null ? children : defaultTrackLabel

  if (typeof onClick === 'function') {
    return (
      <button
        type="button"
        className={classes}
        style={mergedStyle}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        aria-disabled={disabled || undefined}
        aria-pressed={isSelected}
        aria-label={ariaLabel}
        data-stage={stageAttr}
        data-track={trackKey || undefined}
        {...rest}
      >
        {renderLeading()}
        <span className="ui-chip__label ui-chip__text">{content}</span>
      </button>
    )
  }

  return (
    <span
      className={classes}
      style={mergedStyle}
      aria-label={ariaLabel}
      data-stage={stageAttr}
      data-track={trackKey || undefined}
      {...rest}
    >
      {renderLeading()}
      <span className="ui-chip__label ui-chip__text">{content}</span>
      {typeof onRemove === 'function' ? (
        <button
          type="button"
          className="ui-chip__remove"
          onClick={onRemove}
          aria-label="Quitar filtro"
        >
          <X size={11} strokeWidth={2} aria-hidden="true" />
        </button>
      ) : null}
    </span>
  )
}

export default Chip
