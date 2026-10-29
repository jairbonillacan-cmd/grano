import React from 'react';

/**
 * empty-reviews: Sin repaso pendiente hoy — tarjetas Leitner ordenadas en calma con check
 */
export function EmptyReviewsIllustration({ className = 'ui-illustration-svg' }) {
  return (
    <svg viewBox="0 0 240 160" fill="none" className={className} aria-hidden="true">
      <rect
        x="8"
        y="8"
        width="224"
        height="144"
        rx="14"
        fill="var(--surface-2)"
        stroke="var(--border)"
        strokeWidth="1.25"
      />
      {/* Líneas de horizonte en calma */}
      <line x1="28" y1="126" x2="212" y2="126" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="56" y1="136" x2="184" y2="136" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />

      {/* Pila de 3 tarjetas Leitner alineadas */}
      <rect
        x="62"
        y="30"
        width="116"
        height="72"
        rx="9"
        fill="var(--surface)"
        stroke="var(--border)"
        strokeWidth="1.5"
      />
      <rect
        x="54"
        y="40"
        width="116"
        height="72"
        rx="9"
        fill="var(--surface)"
        stroke="var(--border)"
        strokeWidth="1.5"
      />
      <rect
        x="46"
        y="50"
        width="116"
        height="72"
        rx="10"
        fill="var(--surface)"
        stroke="var(--primary)"
        strokeWidth="1.75"
      />

      {/* Indicadores de las 3 disciplinas en la tarjeta frontal */}
      <rect x="58" y="62" width="16" height="5" rx="2.5" fill="var(--role-de)" />
      <rect x="78" y="62" width="16" height="5" rx="2.5" fill="var(--role-da)" />
      <rect x="98" y="62" width="16" height="5" rx="2.5" fill="var(--role-bi)" />
      <rect x="58" y="76" width="76" height="5" rx="2.5" fill="var(--primary-soft)" />
      <rect x="58" y="86" width="56" height="4" rx="2" fill="var(--border)" />
      <rect x="58" y="96" width="42" height="4" rx="2" fill="var(--surface-2)" />

      {/* Medalla geométrica de verificación al día */}
      <circle
        cx="166"
        cy="92"
        r="24"
        fill="var(--success-soft)"
        stroke="var(--success)"
        strokeWidth="2"
      />
      <path
        d="M156 92.5L163 99.5L177 85.5"
        stroke="var(--success)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * empty-projects: Sin proyectos o lecciones completadas aún — plano arquitectónico listo para construir
 */
export function EmptyProjectsIllustration({ className = 'ui-illustration-svg' }) {
  return (
    <svg viewBox="0 0 240 160" fill="none" className={className} aria-hidden="true">
      <rect
        x="8"
        y="8"
        width="224"
        height="144"
        rx="14"
        fill="var(--primary-soft)"
        stroke="var(--border)"
        strokeWidth="1.25"
      />
      {/* Cuadrícula de plano arquitectónico */}
      <path
        d="M8 40H232M8 72H232M8 104H232M8 136H232M48 8V152M96 8V152M144 8V152M192 8V152"
        stroke="var(--border)"
        strokeWidth="0.75"
      />

      {/* Marcas de registro técnicas (+) en esquinas */}
      <path d="M22 24H30M26 20V28M210 24H218M214 20V28M22 136H30M26 132V140M210 136H218M214 132V140" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" />

      {/* Plataforma base isométrica en línea discontinua (lista para construir) */}
      <polygon
        points="120,30 192,66 120,102 48,66"
        fill="var(--surface)"
        stroke="var(--primary)"
        strokeWidth="1.75"
        strokeDasharray="5 3.5"
      />
      <polygon
        points="120,52 176,80 120,108 64,80"
        fill="var(--primary-soft)"
        stroke="var(--primary-deep)"
        strokeWidth="1.5"
      />

      {/* Módulo fundacional sólido en el vértice izquierdo */}
      <polygon
        points="92,52 120,66 92,80 64,66"
        fill="var(--primary)"
        stroke="var(--primary-deep)"
        strokeWidth="1.5"
      />
      <polygon
        points="64,66 92,80 92,98 64,84"
        fill="var(--primary-deep)"
      />
      <polygon
        points="120,66 92,80 92,98 120,84"
        fill="var(--surface)"
        stroke="var(--primary-deep)"
        strokeWidth="1.5"
      />

      {/* Guías de cota dimensional y nodos de ensamblaje */}
      <path d="M120 66L148 80L120 94" stroke="var(--primary-deep)" strokeWidth="1.75" strokeDasharray="3 3" />
      <circle cx="120" cy="30" r="3.5" fill="var(--surface)" stroke="var(--primary-deep)" strokeWidth="1.75" />
      <circle cx="192" cy="66" r="3.5" fill="var(--surface)" stroke="var(--primary-deep)" strokeWidth="1.75" />
      <circle cx="120" cy="108" r="3.5" fill="var(--primary)" />
      <circle cx="148" cy="80" r="3.5" fill="var(--role-bi)" />
    </svg>
  );
}

/**
 * empty-search: Búsqueda sin resultados — lupa geométrica sobre retícula
 */
export function EmptySearchIllustration({ className = 'ui-illustration-svg' }) {
  return (
    <svg viewBox="0 0 240 160" fill="none" className={className} aria-hidden="true">
      <rect
        x="8"
        y="8"
        width="224"
        height="144"
        rx="14"
        fill="var(--surface-2)"
        stroke="var(--border)"
        strokeWidth="1.25"
      />

      {/* Retícula de registros indexados */}
      <rect
        x="26"
        y="24"
        width="188"
        height="112"
        rx="9"
        fill="var(--surface)"
        stroke="var(--border)"
        strokeWidth="1.5"
      />
      <line x1="26" y1="52" x2="214" y2="52" stroke="var(--border)" strokeWidth="1" />
      <line x1="26" y1="80" x2="214" y2="80" stroke="var(--border)" strokeWidth="1" />
      <line x1="26" y1="108" x2="214" y2="108" stroke="var(--border)" strokeWidth="1" />
      <line x1="82" y1="24" x2="82" y2="136" stroke="var(--border)" strokeWidth="1" />
      <line x1="154" y1="24" x2="154" y2="136" stroke="var(--border)" strokeWidth="1" />

      {/* Celdas atenuadas */}
      <rect x="38" y="35" width="32" height="6" rx="3" fill="var(--surface-2)" />
      <rect x="94" y="35" width="46" height="6" rx="3" fill="var(--surface-2)" />
      <rect x="166" y="35" width="34" height="6" rx="3" fill="var(--surface-2)" />
      <rect x="38" y="63" width="26" height="6" rx="3" fill="var(--surface-2)" />
      <rect x="166" y="63" width="28" height="6" rx="3" fill="var(--surface-2)" />
      <rect x="38" y="91" width="34" height="6" rx="3" fill="var(--surface-2)" />
      <rect x="166" y="91" width="36" height="6" rx="3" fill="var(--surface-2)" />

      {/* Lupa geométrica de precisión enfocando celda vacía */}
      <circle
        cx="118"
        cy="76"
        r="30"
        fill="var(--primary-soft)"
        stroke="var(--primary-deep)"
        strokeWidth="2.5"
      />
      <circle
        cx="118"
        cy="76"
        r="22"
        fill="var(--surface)"
        stroke="var(--primary)"
        strokeWidth="1.25"
        strokeDasharray="4 3"
      />
      {/* Mira técnica sin coincidencias (0 hits) */}
      <line x1="108" y1="76" x2="128" y2="76" stroke="var(--primary)" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="118" cy="76" r="3.5" fill="var(--surface)" stroke="var(--primary-deep)" strokeWidth="1.75" />

      {/* Mango geométrico de la lupa */}
      <path
        d="M140 98L164 122"
        stroke="var(--primary-deep)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M140 98L164 122"
        stroke="var(--primary)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * lesson-complete: Lección completada — insignia geométrica radiante
 */
export function LessonCompleteIllustration({ className = 'ui-illustration-svg' }) {
  return (
    <svg viewBox="0 0 240 160" fill="none" className={className} aria-hidden="true">
      <rect
        x="8"
        y="8"
        width="224"
        height="144"
        rx="14"
        fill="var(--stage-soft, var(--primary-soft))"
        stroke="var(--border)"
        strokeWidth="1.25"
      />

      {/* Anillos y rayos geométricos de celebración */}
      <circle
        cx="120"
        cy="78"
        r="56"
        stroke="var(--stage, var(--primary))"
        strokeWidth="1.25"
        strokeDasharray="4 4"
      />
      <path
        d="M120 14V24M120 132V142M48 78H58M182 78H192M72 32L79 39M161 117L168 124M168 32L161 39M79 117L72 124"
        stroke="var(--stage-deep, var(--primary-deep))"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Nodos satélite con los 3 colores de rol */}
      <circle cx="56" cy="48" r="5" fill="var(--role-de)" />
      <circle cx="184" cy="48" r="5" fill="var(--role-da)" />
      <circle cx="184" cy="108" r="5" fill="var(--role-bi)" />
      <circle cx="56" cy="108" r="5" fill="var(--warning)" />

      {/* Escudo hexagonal exterior */}
      <polygon
        points="120,30 162,54 162,102 120,126 78,102 78,54"
        fill="var(--surface)"
        stroke="var(--stage-deep, var(--primary-deep))"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Escudo interior */}
      <polygon
        points="120,40 153,59 153,97 120,116 87,97 87,59"
        fill="var(--success-soft)"
        stroke="var(--success)"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />

      {/* Checkmark de logro */}
      <path
        d="M104 78.5L115 89.5L137 66.5"
        stroke="var(--success)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * tutor-error: Error de conexión del tutor — nodos desconectados con puente de síntesis local
 */
export function TutorErrorIllustration({ className = 'ui-illustration-svg' }) {
  return (
    <svg viewBox="0 0 240 160" fill="none" className={className} aria-hidden="true">
      <rect
        x="8"
        y="8"
        width="224"
        height="144"
        rx="14"
        fill="var(--surface-2)"
        stroke="var(--border)"
        strokeWidth="1.25"
      />

      {/* Nodo Izquierdo: Estación Local */}
      <rect
        x="22"
        y="58"
        width="56"
        height="48"
        rx="8"
        fill="var(--surface)"
        stroke="var(--primary)"
        strokeWidth="1.75"
      />
      <rect x="30" y="68" width="24" height="5" rx="2.5" fill="var(--primary)" />
      <rect x="30" y="78" width="40" height="4" rx="2" fill="var(--border)" />
      <rect x="30" y="86" width="32" height="4" rx="2" fill="var(--primary-soft)" />
      <circle cx="78" cy="82" r="4" fill="var(--primary)" />

      {/* Nodo Derecho: Motor Remoto CLI / Tutor */}
      <rect
        x="162"
        y="58"
        width="56"
        height="48"
        rx="8"
        fill="var(--surface)"
        stroke="var(--border)"
        strokeWidth="1.75"
      />
      <rect x="170" y="68" width="24" height="5" rx="2.5" fill="var(--danger)" />
      <rect x="170" y="78" width="40" height="4" rx="2" fill="var(--border)" />
      <rect x="170" y="86" width="28" height="4" rx="2" fill="var(--surface-2)" />
      <circle cx="162" cy="82" r="4" fill="var(--danger)" />

      {/* Línea principal interrumpida */}
      <line x1="82" y1="82" x2="104" y2="82" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" />
      <line x1="136" y1="82" x2="158" y2="82" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="120" cy="82" r="13" fill="var(--danger-soft)" stroke="var(--danger)" strokeWidth="1.75" />
      <path d="M115 77L125 87M125 77L115 87" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" />

      {/* Puente superior de respaldo (Fallback Síntesis Local activo) */}
      <path
        d="M78 68C92 32 148 32 162 68"
        stroke="var(--warning)"
        strokeWidth="2.25"
        strokeDasharray="5 3"
        strokeLinecap="round"
      />
      <rect
        x="96"
        y="28"
        width="48"
        height="18"
        rx="9"
        fill="var(--warning-soft)"
        stroke="var(--warning)"
        strokeWidth="1.5"
      />
      <circle cx="108" cy="37" r="3" fill="var(--warning)" />
      <rect x="115" y="35" width="20" height="4" rx="2" fill="var(--warning)" />
    </svg>
  );
}

/**
 * diagnostic: Diagnóstico de nivel — brújula/radar técnico de las 3 disciplinas (DE, DA, BI)
 */
export function DiagnosticIllustration({ className = 'ui-illustration-svg' }) {
  return (
    <svg viewBox="0 0 240 160" fill="none" className={className} aria-hidden="true">
      <rect
        x="8"
        y="8"
        width="224"
        height="144"
        rx="14"
        fill="var(--surface-2)"
        stroke="var(--border)"
        strokeWidth="1.25"
      />

      {/* Círculos concéntricos del radar IRT */}
      <circle cx="120" cy="84" r="56" fill="var(--surface)" stroke="var(--border)" strokeWidth="1.5" />
      <circle cx="120" cy="84" r="38" stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
      <circle cx="120" cy="84" r="20" stroke="var(--border)" strokeWidth="1" />

      {/* Ejes de las 3 disciplinas (DE arriba, DA abajo-derecha, BI abajo-izquierda) */}
      <line x1="120" y1="84" x2="120" y2="24" stroke="var(--border)" strokeWidth="1.5" />
      <line x1="120" y1="84" x2="172" y2="114" stroke="var(--border)" strokeWidth="1.5" />
      <line x1="120" y1="84" x2="68" y2="114" stroke="var(--border)" strokeWidth="1.5" />

      {/* Polígono calibrado de perfil de habilidades */}
      <polygon
        points="120,38 162,108 80,107"
        fill="var(--primary-soft)"
        stroke="var(--primary)"
        strokeWidth="2.25"
        strokeLinejoin="round"
      />

      {/* Vértice DE (Ingeniería de Datos · #2F6BFF) */}
      <circle cx="120" cy="38" r="6" fill="var(--role-de)" stroke="var(--surface)" strokeWidth="2" />
      <rect x="104" y="14" width="32" height="12" rx="6" fill="var(--surface)" stroke="var(--role-de)" strokeWidth="1.5" />
      <rect x="112" y="18.5" width="16" height="3" rx="1.5" fill="var(--role-de)" />

      {/* Vértice DA (Análisis de Datos · #0FA968) */}
      <circle cx="162" cy="108" r="6" fill="var(--role-da)" stroke="var(--surface)" strokeWidth="2" />
      <rect x="176" y="106" width="32" height="12" rx="6" fill="var(--surface)" stroke="var(--role-da)" strokeWidth="1.5" />
      <rect x="184" y="110.5" width="16" height="3" rx="1.5" fill="var(--role-da)" />

      {/* Vértice BI (Business Intelligence · #F08A24) */}
      <circle cx="80" cy="107" r="6" fill="var(--role-bi)" stroke="var(--surface)" strokeWidth="2" />
      <rect x="32" y="106" width="32" height="12" rx="6" fill="var(--surface)" stroke="var(--role-bi)" strokeWidth="1.5" />
      <rect x="40" y="110.5" width="16" height="3" rx="1.5" fill="var(--role-bi)" />

      {/* Aguja central de calibración */}
      <circle cx="120" cy="84" r="4.5" fill="var(--primary-deep)" />
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
