import React from 'react';

// Logo de Grano: cuadrícula de 3×3 celdas con una sola celda rellena (fila 2, columna 3).
// Representa "una fila, una celda: el grano de una tabla".
const CELL = 6;
const GAP = 2;
const FILLED = { row: 1, col: 2 };

export function BrandMark({ size = 28, className = '' }) {
  const cells = [];
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const filled = row === FILLED.row && col === FILLED.col;
      cells.push(
        <rect
          key={`${row}-${col}`}
          x={2 + col * (CELL + GAP) + 0.5}
          y={2 + row * (CELL + GAP) + 0.5}
          width={CELL - 1}
          height={CELL - 1}
          rx="1"
          fill={filled ? 'var(--brand, #C2410C)' : 'none'}
          stroke={filled ? 'var(--brand, #C2410C)' : 'var(--ink-3, #78716C)'}
          strokeWidth="1"
        />
      );
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 26 26"
      fill="none"
      aria-hidden="true"
      className={`ui-brand-mark ${className}`.trim()}
    >
      {cells}
    </svg>
  );
}

export function BrandLogo({
  collapsed = false,
  size = 28,
  className = '',
  label = 'grano',
}) {
  return (
    <span
      className={`ui-brand-logo ${collapsed ? 'is-collapsed' : ''} ${className}`.trim()}
      aria-label={collapsed ? label : undefined}
    >
      <BrandMark size={size} />
      {!collapsed && <span className="ui-brand-wordmark">{label}</span>}
    </span>
  );
}

export default BrandLogo;
