import React from 'react';

/**
 * Trazos técnicos monocromáticos de 1 línea en --ink-3 para estados vacíos.
 * Sustituyen a las antiguas ilustraciones decorativas de estado.
 */

export function EmptyReviewsIllustration({ className = 'ui-illustration-svg' }) {
  return (
    <svg viewBox="0 0 88 64" fill="none" className={className} aria-hidden="true">
      <g stroke="var(--ink-3)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        <rect x="20" y="14" width="48" height="34" rx="4" />
        <path d="M36 31L42 37L54 25" />
      </g>
    </svg>
  );
}

export function EmptyProjectsIllustration({ className = 'ui-illustration-svg' }) {
  return (
    <svg viewBox="0 0 88 64" fill="none" className={className} aria-hidden="true">
      <g stroke="var(--ink-3)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        <rect x="18" y="14" width="52" height="36" rx="4" strokeDasharray="4 3" />
        <line x1="30" y1="28" x2="58" y2="28" />
        <line x1="30" y1="36" x2="48" y2="36" />
      </g>
    </svg>
  );
}

export function EmptySearchIllustration({ className = 'ui-illustration-svg' }) {
  return (
    <svg viewBox="0 0 88 64" fill="none" className={className} aria-hidden="true">
      <g stroke="var(--ink-3)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="40" cy="28" r="14" />
        <line x1="50" y1="38" x2="64" y2="52" />
      </g>
    </svg>
  );
}

export function LessonCompleteIllustration({ className = 'ui-illustration-svg' }) {
  return (
    <svg viewBox="0 0 88 64" fill="none" className={className} aria-hidden="true">
      <g stroke="var(--ink-3)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="44" cy="32" r="18" />
        <path d="M36 32.5L41.5 38L53 26.5" />
      </g>
    </svg>
  );
}

export function TutorErrorIllustration({ className = 'ui-illustration-svg' }) {
  return (
    <svg viewBox="0 0 88 64" fill="none" className={className} aria-hidden="true">
      <g stroke="var(--ink-3)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        <rect x="14" y="22" width="20" height="20" rx="3" />
        <rect x="54" y="22" width="20" height="20" rx="3" />
        <line x1="34" y1="32" x2="54" y2="32" strokeDasharray="3 3" />
      </g>
    </svg>
  );
}

export function DiagnosticIllustration({ className = 'ui-illustration-svg' }) {
  return (
    <svg viewBox="0 0 88 64" fill="none" className={className} aria-hidden="true">
      <g stroke="var(--ink-3)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="44" cy="32" r="18" />
        <line x1="44" y1="14" x2="44" y2="32" />
        <line x1="44" y1="32" x2="58" y2="42" />
      </g>
    </svg>
  );
}

export const STATE_ILLUSTRATIONS = {
  'empty-reviews': EmptyReviewsIllustration,
  'empty-projects': EmptyProjectsIllustration,
  'empty-search': EmptySearchIllustration,
  'lesson-complete': LessonCompleteIllustration,
  'tutor-error': TutorErrorIllustration,
  diagnostic: DiagnosticIllustration,
};

export default STATE_ILLUSTRATIONS;
