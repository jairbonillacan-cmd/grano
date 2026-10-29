import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrandLogo } from '../brand/BrandMark.jsx';
import { STAGE_ILLUSTRATIONS } from './StageIllustrations.jsx';
import { STATE_ILLUSTRATIONS } from './StateIllustrations.jsx';

const STAGE_ITEMS = [
  { stage: 1, name: 'stage-1', title: 'Etapa 1 · Coral', subtitle: 'SQL Analítico, JOINs y Cardinalidad 1:N' },
  { stage: 2, name: 'stage-2', title: 'Etapa 2 · Ámbar', subtitle: 'Esquema Estrella y Dimensiones SCD2' },
  { stage: 3, name: 'stage-3', title: 'Etapa 3 · Esmeralda', subtitle: 'Parquet Columnar y Salto por Zone Maps' },
  { stage: 4, name: 'stage-4', title: 'Etapa 4 · Turquesa', subtitle: 'Arquitectura Lakehouse Bronce / Plata / Oro' },
  { stage: 5, name: 'stage-5', title: 'Etapa 5 · Azul', subtitle: 'Inferencia A/B Testing, CUPED y BI' },
  { stage: 6, name: 'stage-6', title: 'Etapa 6 · Violeta', subtitle: 'Streaming con Watermarks y Nodo MCP' },
];

const STATE_ITEMS = [
  { name: 'empty-reviews', title: 'empty-reviews', subtitle: 'Tarjetas Leitner en calma con verificación' },
  { name: 'empty-projects', title: 'empty-projects', subtitle: 'Plano arquitectónico isométrico listo' },
  { name: 'empty-search', title: 'empty-search', subtitle: 'Lupa geométrica de precisión sobre retícula' },
  { name: 'lesson-complete', title: 'lesson-complete', subtitle: 'Insignia geométrica radiante de logro', stage: 3 },
  { name: 'tutor-error', title: 'tutor-error', subtitle: 'Nodos desconectados con puente local' },
  { name: 'diagnostic', title: 'diagnostic', subtitle: 'Brújula / radar técnico DE · DA · BI' },
];

export function IllustrationsShowcaseCatalog() {
  return (
    <div className="l-stack l-stack--lg">
      {/* Marca y Favicon */}
      <div className="l-stack l-stack--md">
        <div className="l-cluster l-cluster--between">
          <div>
            <h2 className="ui-showcase__sec-title">
              Marca y Sistema de Ilustraciones SVG (Agente 7)
            </h2>
            <p className="ui-showcase__sec-sub">
              Isotipo geométrico ascendente (<code>DE #2F6BFF</code> · <code>DA #0FA968</code> · <code>BI #F08A24</code>),
              6 ilustraciones de etapa y 6 ilustraciones de estado adaptables a modo claro y oscuro.
            </p>
          </div>
        </div>

        <div className="l-grid l-grid--2">
          <div className="ui-card">
            <div className="l-stack l-stack--sm">
              <span className="ui-showcase__label">BrandLogo (Expandido · Plus Jakarta Sans 800)</span>
              <div className="l-cluster l-cluster--between">
                <BrandLogo size={32} />
                <span className="ui-chip ui-chip--neutral">collapsed=false</span>
              </div>
            </div>
          </div>

          <div className="ui-card">
            <div className="l-stack l-stack--sm">
              <span className="ui-showcase__label">BrandLogo (Isotipo colapsado 72px &amp; Favicon SVG)</span>
              <div className="l-cluster l-cluster--between">
                <div className="l-cluster l-cluster--md">
                  <BrandLogo collapsed size={28} />
                  <BrandLogo collapsed size={36} />
                </div>
                <span className="ui-chip ui-chip--primary">collapsed=true</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Ilustraciones de Etapa */}
      <div className="l-stack l-stack--md">
        <h3 className="ui-showcase__card-title">
          Ilustraciones de las 6 Etapas (viewBox 240×160 · &lt;= 6 KB · Tokens --stage / --stage-soft / --stage-deep)
        </h3>
        <div className="l-grid l-grid--3">
          {STAGE_ITEMS.map((item) => {
            const StageSvg = STAGE_ILLUSTRATIONS[item.name];
            return (
              <div
                key={item.name}
                className="ui-card ui-card--top-bar"
                data-stage={item.stage}
              >
                <div className="l-stack l-stack--sm">
                  <div className="l-cluster l-cluster--between">
                    <span className="ui-chip ui-chip--stage">{item.title}</span>
                    <code>{item.name}</code>
                  </div>
                  <div
                    className="ui-illustration ui-illustration--lg"
                    data-stage={item.stage}
                    aria-hidden="true"
                  >
                    <StageSvg className="ui-illustration-svg" />
                  </div>
                  <span className="ui-showcase__sec-sub">{item.subtitle}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6 Ilustraciones de Estado y Momentos Clave */}
      <div className="l-stack l-stack--md">
        <h3 className="ui-showcase__card-title">
          Ilustraciones de Estado Vacío y Momentos Clave (StateIllustrations.jsx)
        </h3>
        <div className="l-grid l-grid--3">
          {STATE_ITEMS.map((item) => {
            const StateSvg = STATE_ILLUSTRATIONS[item.name];
            return (
              <div
                key={item.name}
                className="ui-card"
                data-stage={item.stage}
              >
                <div className="l-stack l-stack--sm">
                  <div className="l-cluster l-cluster--between">
                    <code>{item.title}</code>
                    <span className="ui-chip ui-chip--neutral">240×160</span>
                  </div>
                  <div
                    className="ui-illustration ui-illustration--lg"
                    data-stage={item.stage}
                    aria-hidden="true"
                  >
                    <StateSvg className="ui-illustration-svg" />
                  </div>
                  <span className="ui-showcase__sec-sub">{item.subtitle}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function mountUiShowcaseIllustrationsIfActive() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  if (params.get('ui') !== '1') return;

  const tryMount = () => {
    const main = document.querySelector('.ui-showcase__main');
    if (!main) return false;
    if (main.querySelector('[data-agente7-illustrations="true"]')) return true;

    const section = document.createElement('section');
    section.className = 'l-stack l-stack--md';
    section.setAttribute('data-agente7-illustrations', 'true');
    section.setAttribute('aria-label', 'Catálogo de Ilustraciones y Marca');

    const hero = main.querySelector('.ui-showcase__hero');
    if (hero && hero.nextSibling) {
      main.insertBefore(section, hero.nextSibling);
    } else {
      main.prepend(section);
    }

    const root = createRoot(section);
    root.render(<IllustrationsShowcaseCatalog />);
    return true;
  };

  if (!tryMount()) {
    const observer = new MutationObserver(() => {
      if (tryMount()) {
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
}
