// Esqueleto de carga diferida: aparece solo si la espera supera 300ms (delayMs=300 por defecto).
// Oculto a tecnologías de asistencia con aria-hidden="true" y respeta prefers-reduced-motion.
import React, { useEffect, useState } from 'react'

export function Skeleton({
  variant = 'line',
  width,
  height,
  lines = 1,
  delayMs = 300,
  immediate = false,
  className = '',
  style,
}) {
  const [visible, setVisible] = useState(() => immediate || delayMs <= 0)

  useEffect(() => {
    if (immediate || delayMs <= 0) {
      setVisible(true)
      return undefined
    }
    setVisible(false)
    const timer = window.setTimeout(() => setVisible(true), delayMs)
    return () => window.clearTimeout(timer)
  }, [delayMs, immediate])

  if (!visible) return null

  if (variant === 'line' && lines > 1) {
    return (
      <div className={['ui-skeleton-group', className].filter(Boolean).join(' ')} aria-hidden="true">
        {Array.from({ length: lines }).map((_, idx) => (
          <span
            key={idx}
            className="ui-skeleton ui-skeleton--line"
            style={{
              width: idx === lines - 1 ? '68%' : width || '100%',
              height,
              ...style,
            }}
          />
        ))}
      </div>
    )
  }

  const classes = ['ui-skeleton', `ui-skeleton--${variant}`, className]
    .filter(Boolean)
    .join(' ')
  return (
    <span
      className={classes}
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  )
}

export default Skeleton
