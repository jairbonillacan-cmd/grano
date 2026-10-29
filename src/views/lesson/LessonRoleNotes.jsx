import React, { useState } from 'react';
import { formatInlineText } from '../../utils/formatText.jsx';

const ROLE_CONFIG = {
  de: {
    key: 'de',
    code: 'DE',
    title: 'Ingeniería de Datos',
    subtitle: 'Tuberías, almacenamiento, grano físico y contratos',
    accentClass: 'lp-role-card--de',
  },
  da: {
    key: 'da',
    code: 'DA',
    title: 'Análisis de Datos',
    subtitle: ' Inferencia, cohortes, diagnóstico y consultas analíticas',
    accentClass: 'lp-role-card--da',
  },
  bi: {
    key: 'bi',
    code: 'BI',
    title: 'Business Intelligence',
    subtitle: 'Capa semántica, métricas gobernadas y visualización',
    accentClass: 'lp-role-card--bi',
  },
};

function resolveUserTrack(profileTrack) {
  const candidates = [profileTrack];
  if (typeof window !== 'undefined') {
    try {
      const direct = window.localStorage.getItem('grano_track');
      if (direct) candidates.unshift(direct);
    } catch {
      // Ignorar errores de acceso a localStorage
    }
  }

  for (const raw of candidates) {
    const clean = String(raw || '').trim().toLowerCase();
    if (clean === 'de' || clean === 'da' || clean === 'bi') {
      return { track: clean, isDefaultFallback: false };
    }
  }

  return { track: 'de', isDefaultFallback: true };
}

export function LessonRoleNotes({ roleNotes, profileTrack }) {
  const [showOtherAreas, setShowOtherAreas] = useState(false);

  if (!roleNotes || (!roleNotes.de && !roleNotes.da && !roleNotes.bi)) {
    return null;
  }

  const { track: activeTrackKey, isDefaultFallback } = resolveUserTrack(profileTrack);
  const activeRole = ROLE_CONFIG[activeTrackKey] || ROLE_CONFIG.de;
  const activeNote = roleNotes[activeRole.key] || roleNotes.de || '';

  const otherRoles = Object.values(ROLE_CONFIG).filter(
    (r) => r.key !== activeRole.key && Boolean(roleNotes[r.key])
  );

  return (
    <section
      id="sec-areas"
      data-section-id="areas"
      className="lp-section lp-roles-section"
      aria-labelledby="lp-roles-title"
    >
      <div className="lp-section__head">
        <div className="lp-section__title-row">
          <span className="lp-section__kicker">Aplicación profesional</span>
          <h2 id="lp-roles-title" className="lp-section__title" tabIndex={-1}>
            Desde tu área
          </h2>
        </div>

        {otherRoles.length > 0 ? (
          <button
            type="button"
            className="lp-roles-toggle-btn"
            aria-expanded={showOtherAreas}
            onClick={() => setShowOtherAreas((prev) => !prev)}
          >
            {showOtherAreas ? 'Ocultar las otras áreas' : 'Ver las otras áreas'}
          </button>
        ) : null}
      </div>

      {isDefaultFallback ? (
        <p className="lp-roles-fallback-note">
          Mostrando la perspectiva de <strong>Ingeniería de Datos (DE)</strong> por defecto. Puedes explorar las otras dos especialidades cuando quieras.
        </p>
      ) : null}

      <article className={`lp-role-card is-primary ${activeRole.accentClass}`}>
        <header className="lp-role-card__header">
          <span className="lp-role-card__badge">{activeRole.code}</span>
          <div className="lp-role-card__titles">
            <h3 className="lp-role-card__title">{activeRole.title}</h3>
            <span className="lp-role-card__sub">{activeRole.subtitle}</span>
          </div>
          <span className="lp-role-card__active-tag">Tu área activa</span>
        </header>
        <p className="lp-role-card__body">
          {formatInlineText(activeNote, `role-active-${activeRole.key}`)}
        </p>
      </article>

      {showOtherAreas && otherRoles.length > 0 ? (
        <div className="lp-other-roles-grid">
          {otherRoles.map((role) => (
            <article
              key={role.key}
              className={`lp-role-card is-secondary ${role.accentClass}`}
            >
              <header className="lp-role-card__header">
                <span className="lp-role-card__badge">{role.code}</span>
                <div className="lp-role-card__titles">
                  <h3 className="lp-role-card__title">{role.title}</h3>
                  <span className="lp-role-card__sub">{role.subtitle}</span>
                </div>
              </header>
              <p className="lp-role-card__body">
                {formatInlineText(roleNotes[role.key], `role-other-${role.key}`)}
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
