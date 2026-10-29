import React, { useEffect } from 'react';

// Logo de Grano (§3.2): cuadrícula de 3×3 celdas cuadradas con una sola celda rellena
// en la fila 2, columna 3. Representa "una fila, una celda: el grano de una tabla".
const CELL = 6;
const GAP = 2;
const FILLED = { row: 1, col: 2 };
const DEFAULT_TITLE = 'Grano';

export function syncDocumentTitle(explicitLessonTitle) {
  if (typeof document === 'undefined') return;
  if (typeof explicitLessonTitle === 'string') {
    const clean = explicitLessonTitle.replace(/\s+/g, ' ').trim();
    const target = clean ? `${clean} · ${DEFAULT_TITLE}` : DEFAULT_TITLE;
    if (document.title !== target) document.title = target;
    return;
  }

  const lessonNode =
    document.querySelector('.lesson-player .lp-header-title') ||
    document.querySelector('.lesson-player h1') ||
    document.querySelector('[data-view="lesson"] h1');

  const rawTitle = lessonNode?.getAttribute('title') || lessonNode?.textContent || '';
  const cleanTitle = rawTitle.replace(/\s+/g, ' ').trim();
  const nextTitle = cleanTitle ? `${cleanTitle} · ${DEFAULT_TITLE}` : DEFAULT_TITLE;

  if (document.title !== nextTitle) {
    document.title = nextTitle;
  }
}

export function initDocumentTitleSync() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__granoTitleObserverInstalled) return;
  window.__granoTitleObserverInstalled = true;

  const attachObserver = () => {
    const root = document.getElementById('root') || document.body;
    if (!root) return;
    syncDocumentTitle();
    const observer = new MutationObserver(() => {
      syncDocumentTitle();
    });
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['title'],
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachObserver, { once: true });
  } else {
    attachObserver();
  }
}

if (typeof window !== 'undefined') {
  initDocumentTitleSync();
}

export function BrandMark({ size = 28, className = '' }) {
  const numericSize = Number(size) || 28;
  // A 16-20 px usamos trazo de 1.5 en el viewBox 26×26 (~0.92 px reales a 16 px)
  // para que las 8 celdas en línea y la celda rellena se distingan con nitidez.
  const strokeWidth = numericSize <= 20 ? 1.5 : 1.35;

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
          strokeWidth={strokeWidth}
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
      shapeRendering="geometricPrecision"
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
  useEffect(() => {
    initDocumentTitleSync();
    syncDocumentTitle();
  }, []);

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
