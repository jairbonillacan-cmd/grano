import React from 'react';

/**
 * Esquemas técnicos de 1 línea en --ink-3 (sin relleno ni color de etapa).
 * Sustituyen a las antiguas ilustraciones decorativas multicolores de 6 etapas.
 */

export function Stage1Illustration({ className = 'ui-illustration-svg' }) {
  return (
    <svg viewBox="0 0 120 64" fill="none" className={className} aria-hidden="true">
      <g stroke="var(--ink-3)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="12" width="36" height="40" rx="3" />
        <line x1="8" y1="24" x2="44" y2="24" />
        <rect x="76" y="12" width="36" height="40" rx="3" />
        <line x1="76" y1="24" x2="112" y2="24" />
        <path d="M44 32H76M68 26L76 32L68 38" />
      </g>
    </svg>
  );
}

export function Stage2Illustration({ className = 'ui-illustration-svg' }) {
  return (
    <svg viewBox="0 0 120 64" fill="none" className={className} aria-hidden="true">
      <g stroke="var(--ink-3)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        <rect x="44" y="18" width="32" height="28" rx="3" />
        <rect x="8" y="8" width="22" height="16" rx="2" />
        <rect x="90" y="8" width="22" height="16" rx="2" />
        <rect x="8" y="40" width="22" height="16" rx="2" />
        <rect x="90" y="40" width="22" height="16" rx="2" />
        <path d="M30 16L44 24M90 16L76 24M30 48L44 40M90 48L76 40" />
      </g>
    </svg>
  );
}

export function Stage3Illustration({ className = 'ui-illustration-svg' }) {
  return (
    <svg viewBox="0 0 120 64" fill="none" className={className} aria-hidden="true">
      <g stroke="var(--ink-3)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        <rect x="14" y="12" width="24" height="40" rx="2" />
        <rect x="48" y="12" width="24" height="40" rx="2" strokeDasharray="3 3" />
        <rect x="82" y="12" width="24" height="40" rx="2" />
        <path d="M26 8C46 2 74 2 94 8" />
      </g>
    </svg>
  );
}

export function Stage4Illustration({ className = 'ui-illustration-svg' }) {
  return (
    <svg viewBox="0 0 120 64" fill="none" className={className} aria-hidden="true">
      <g stroke="var(--ink-3)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        <rect x="16" y="10" width="88" height="12" rx="2" />
        <rect x="16" y="26" width="88" height="12" rx="2" />
        <rect x="16" y="42" width="88" height="12" rx="2" />
      </g>
    </svg>
  );
}

export function Stage5Illustration({ className = 'ui-illustration-svg' }) {
  return (
    <svg viewBox="0 0 120 64" fill="none" className={className} aria-hidden="true">
      <g stroke="var(--ink-3)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="52" x2="108" y2="52" />
        <path d="M16 52C28 52 34 20 50 20C66 20 72 52 84 52" />
        <path d="M36 52C48 52 54 14 70 14C86 14 92 52 104 52" strokeDasharray="3 3" />
      </g>
    </svg>
  );
}

export function Stage6Illustration({ className = 'ui-illustration-svg' }) {
  return (
    <svg viewBox="0 0 120 64" fill="none" className={className} aria-hidden="true">
      <g stroke="var(--ink-3)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="22" x2="64" y2="22" />
        <line x1="12" y1="42" x2="64" y2="42" />
        <circle cx="80" cy="32" r="14" />
        <line x1="94" y1="32" x2="110" y2="32" />
      </g>
    </svg>
  );
}

export const STAGE_ILLUSTRATIONS = {
  1: Stage1Illustration,
  2: Stage2Illustration,
  3: Stage3Illustration,
  4: Stage4Illustration,
  5: Stage5Illustration,
  6: Stage6Illustration,
  'stage-1': Stage1Illustration,
  'stage-2': Stage2Illustration,
  'stage-3': Stage3Illustration,
  'stage-4': Stage4Illustration,
  'stage-5': Stage5Illustration,
  'stage-6': Stage6Illustration,
};

export default STAGE_ILLUSTRATIONS;
