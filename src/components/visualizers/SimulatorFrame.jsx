import React, { useEffect, useRef } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../ui/index.js';

let latestSimulatorSnapshot = null;
const stateListeners = new Set();

export function getLatestSimulatorState() {
  return latestSimulatorSnapshot;
}

export function subscribeSimulatorState(listener) {
  stateListeners.add(listener);
  return () => stateListeners.delete(listener);
}

/**
 * Sincroniza el estado vivo del simulador con el callback `onStateChange`
 * y actualiza el registro en memoria para que el reproductor o el tutor IA
 * puedan consultarlo como contexto vivo.
 */
export function useSimulatorStateReport({
  visualType,
  mode,
  metrics,
  summary,
  onStateChange,
}) {
  const callbackRef = useRef(onStateChange);
  callbackRef.current = onStateChange;

  const metricsJson = JSON.stringify(metrics || {});

  useEffect(() => {
    const parsedMetrics = JSON.parse(metricsJson);
    const payload = {
      visualType,
      mode,
      metrics: parsedMetrics,
      summary,
    };
    latestSimulatorSnapshot = payload;
    for (const listener of stateListeners) {
      try {
        listener(payload);
      } catch {
        // ignore listener errors
      }
    }
    if (typeof callbackRef.current === 'function') {
      callbackRef.current(payload);
    }
  }, [visualType, mode, metricsJson, summary]);
}

/**
 * Control segmentado accesible con navegación por teclado (ArrowLeft, ArrowRight, Home, End)
 * y estado `aria-pressed` explícito en cada opción.
 */
export function SimSegmented({
  ariaLabel,
  options,
  value,
  onChange,
}) {
  const groupRef = useRef(null);

  const handleKeyDown = (e, idx) => {
    if (!options || options.length === 0) return;
    let nextIdx = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIdx = (idx + 1) % options.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIdx = (idx - 1 + options.length) % options.length;
    } else if (e.key === 'Home') {
      nextIdx = 0;
    } else if (e.key === 'End') {
      nextIdx = options.length - 1;
    }

    if (nextIdx >= 0) {
      e.preventDefault();
      e.stopPropagation();
      const nextOption = options[nextIdx];
      onChange(nextOption.value);
      const buttons = groupRef.current?.querySelectorAll('button.sim-segmented__btn');
      if (buttons && buttons[nextIdx]) {
        buttons[nextIdx].focus();
      }
    }
  };

  return (
    <div
      ref={groupRef}
      className="sim-segmented"
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((opt, idx) => {
        const isActive = value === opt.value;
        const tone = opt.tone || 'default';
        const activeClass = isActive
          ? tone === 'bad' || tone === 'danger'
            ? 'is-active sim-segmented__btn--active sim-segmented__btn--active-danger'
            : tone === 'ok' || tone === 'success'
            ? 'is-active sim-segmented__btn--active sim-segmented__btn--active-ok sim-segmented__btn--active-success'
            : 'is-active sim-segmented__btn--active'
          : '';

        return (
          <button
            key={String(opt.value)}
            type="button"
            aria-pressed={isActive}
            className={`sim-segmented__btn ${activeClass}`.trim()} style={isActive ? { backgroundColor: 'var(--surface-1)', color: 'var(--text-1)', borderColor: 'var(--accent)', fontWeight: 600 } : undefined}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
          >
            {opt.icon && <span className="sim-segmented__icon" aria-hidden="true">{opt.icon}</span>}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Manejador de teclado para filas o tarjetas interactivas dentro de simuladores.
 * Soporta Enter/Space para activar y ArrowUp/ArrowDown para desplazarse entre elementos.
 */
export function handleInteractiveRowKeyDown(e, onSelect, idx, totalCount, onMoveIndex) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    return;
  }
  if (typeof onMoveIndex === 'function' && totalCount > 1) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      e.stopPropagation();
      const next = (idx + 1) % totalCount;
      onMoveIndex(next);
      const parent = e.currentTarget.parentElement;
      const items = parent?.querySelectorAll('[data-sim-interactive="true"]');
      if (items && items[next]) items[next].focus();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      e.stopPropagation();
      const prev = (idx - 1 + totalCount) % totalCount;
      onMoveIndex(prev);
      const parent = e.currentTarget.parentElement;
      const items = parent?.querySelectorAll('[data-sim-interactive="true"]');
      if (items && items[prev]) items[prev].focus();
    }
  }
}

/**
 * Marco común de simulador (<SimulatorFrame>):
 * - Título corto + línea de instrucción clara ("Alterna entre..." / "Mueve el control para...")
 * - Controles interactivos accesibles por teclado
 * - Cuerpo interactivo con container queries
 * - Lectura dinámica inferior (.sim-live-readout) que explica en una frase qué ocurre con los valores actuales
 */
export function SimulatorFrame({
  kicker,
  title,
  instruction,
  subtitle,
  onReset,
  controls,
  liveReadout,
  whatToWatch,
  readoutTone = 'default', // 'default' | 'ok' | 'bad' | 'warn'
  visualType,
  mode,
  metrics,
  onStateChange,
  children,
}) {
  const effectiveInstruction = instruction || subtitle;
  const effectiveReadout = liveReadout || whatToWatch || '';

  useSimulatorStateReport({
    visualType: visualType || 'simulator',
    mode: mode || 'default',
    metrics: metrics || {},
    summary: typeof effectiveReadout === 'string' ? effectiveReadout : '',
    onStateChange,
  });

  const toneClass =
    readoutTone === 'bad' || readoutTone === 'danger'
      ? 'sim-live-readout--bad'
      : readoutTone === 'ok' || readoutTone === 'success'
      ? 'sim-live-readout--ok'
      : readoutTone === 'warn'
      ? 'sim-live-readout--warn'
      : '';

  const StatusIcon =
    readoutTone === 'bad' || readoutTone === 'danger'
      ? AlertTriangle
      : readoutTone === 'ok' || readoutTone === 'success'
      ? CheckCircle2
      : Info;

  return (
    <section
      className="sim-frame viz-card"
      data-visual-type={visualType || undefined}
      data-sim-mode={mode || undefined}
      aria-label={typeof title === 'string' ? title : 'Simulador interactivo'}
      onKeyDown={(e) => {
        if (
          e.key === 'ArrowLeft' ||
          e.key === 'ArrowRight' ||
          e.key === 'ArrowUp' ||
          e.key === 'ArrowDown'
        ) {
          e.stopPropagation();
        }
      }}
    >
      <div className="sim-frame__header">
        <div className="sim-frame__title-group">
          <div className="sim-frame__headings">
            {kicker && <div className="sim-frame__kicker sim-frame__eyebrow">{kicker}</div>}
            <h3 className="sim-frame__title">{title}</h3>
            {effectiveInstruction && (
              <p className="sim-frame__desc sim-frame__instruction">{effectiveInstruction}</p>
            )}
          </div>
        </div>
        {onReset && (
          <Button
            variant="ghost"
            size="sm"
            icon={RotateCcw}
            className="sim-reset-btn"
            onClick={onReset}
            ariaLabel="Reiniciar simulador"
          >
            Reiniciar
          </Button>
        )}
      </div>

      {controls && <div className="sim-frame__controls">{controls}</div>}

      <div className="sim-frame__body">{children}</div>

      {effectiveReadout && (
        <div
          className={`sim-live-readout ${toneClass} tabular`.trim()}
          role="status"
          aria-live="polite"
        >
          <span className="sim-live-readout__badge">
            <StatusIcon size={14} aria-hidden="true" />
            <span>Lectura actual:</span>
          </span>
          <span className="sim-live-readout__text">{effectiveReadout}</span>
        </div>
      )}
    </section>
  );
}

export default SimulatorFrame;
