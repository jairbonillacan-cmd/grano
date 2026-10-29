// Ilustración técnica SVG de 1 trazo en gris (--ink-3) para estados vacíos explícitos; aria-hidden por defecto.
// Reexporta BrandLogo y BrandMark para compatibilidad con AppShell y vistas existentes.
import React from 'react'
import { BrandMark, BrandLogo } from '../../assets/brand/BrandMark.jsx'

const SCENES = {
  search: () => (
    <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="14" y="18" width="52" height="36" rx="4" />
      <line x1="22" y1="28" x2="50" y2="28" />
      <line x1="22" y1="36" x2="42" y2="36" />
      <circle cx="58" cy="48" r="10" />
      <line x1="65" y1="55" x2="74" y2="64" />
    </g>
  ),
  completed: () => (
    <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="44" cy="40" r="22" />
      <path d="M34 40.5L41 47.5L55 33.5" />
    </g>
  ),
  data: () => (
    <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="44" cy="24" rx="20" ry="6" />
      <path d="M24 24v16c0 3.3 9 6 20 6s20-2.7 20-6V24" />
      <path d="M24 40v16c0 3.3 9 6 20 6s20-2.7 20-6V40" />
    </g>
  ),
  pipeline: () => (
    <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="12" y="30" width="16" height="16" rx="3" />
      <rect x="36" y="30" width="16" height="16" rx="3" />
      <rect x="60" y="30" width="16" height="16" rx="3" />
      <line x1="28" y1="38" x2="36" y2="38" />
      <line x1="52" y1="38" x2="60" y2="38" />
    </g>
  ),
  tutor: () => (
    <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 22h52a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H34l-12 10V54h-4a4 4 0 0 1-4-4V26a4 4 0 0 1 4-4Z" />
      <line x1="28" y1="34" x2="60" y2="34" />
      <line x1="28" y1="42" x2="48" y2="42" />
    </g>
  ),
  empty: () => (
    <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="18" y="20" width="52" height="40" rx="4" strokeDasharray="4 4" />
      <line x1="32" y1="36" x2="56" y2="36" />
      <line x1="36" y1="44" x2="52" y2="44" />
    </g>
  ),
}

export function Illustration({
  name = 'empty',
  size = 64,
  title,
  className = '',
  ...rest
}) {
  const Scene = SCENES[name] || SCENES.empty
  const numericSize =
    typeof size === 'number' ? size : size === 'sm' ? 48 : size === 'lg' ? 80 : 64
  const classes = ['ui-illustration', className].filter(Boolean).join(' ')

  return (
    <svg
      className={classes}
      width={numericSize}
      height={Math.round(numericSize * 0.82)}
      viewBox="0 0 88 76"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : 'true'}
      aria-label={title || undefined}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <Scene />
    </svg>
  )
}

export { BrandLogo, BrandMark }
export default Illustration
