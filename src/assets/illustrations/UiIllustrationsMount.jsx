import React from 'react';
import { STAGE_ILLUSTRATIONS } from './StageIllustrations.jsx';
import { STATE_ILLUSTRATIONS } from './StateIllustrations.jsx';

/**
 * Catálogo mínimo de trazos monocromáticos en --ink-3 para el escaparate de UI (?ui=1).
 */
export function IllustrationsShowcaseCatalog() {
  return (
    <div className="l-stack l-stack--md">
      <h2 className="ui-showcase__sec-title">Esquemas técnicos en un trazo (--ink-3)</h2>
      <div className="l-grid l-grid--3">
        {Object.entries(STATE_ILLUSTRATIONS).map(([name, SvgComp]) => (
          <div key={name} className="ui-card">
            <code>{name}</code>
            <SvgComp className="ui-illustration-svg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function mountUiShowcaseIllustrationsIfActive() {
  return false;
}

export { STAGE_ILLUSTRATIONS, STATE_ILLUSTRATIONS };
