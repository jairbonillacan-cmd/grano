import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Upload,
  RotateCcw,
  Check,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { Button, Dialog, Segmented } from '../components/ui/index.js';
import { TRACKS } from '../data/catalog/tracks.js';
import { LEVELS } from '../data/catalog/levels.js';
import {
  useProfile,
  usePrefs,
  useProgress,
  useReview,
  setTrack,
  setStartLevel,
  setPref,
  exportState,
  importState,
  resetAllProgress,
} from '../state/store.js';

const DEFAULT_AI_MODELS = [
  {
    id: 'gemini-3.8-flash-low',
    label: 'Gemini 3.8 Flash Low (rápido · recomendado para consultas)',
  },
  {
    id: 'gemini-4-argon-medium',
    label: 'Gemini 4 Argon Medium (profundo · recomendado para revisión)',
  },
  {
    id: 'gemini-3.8-pro-low',
    label: 'Gemini 3.8 Pro Low (equilibrado)',
  },
];

const THEME_ITEMS = [
  { id: 'system', label: 'Sistema' },
  { id: 'light', label: 'Claro' },
  { id: 'dark', label: 'Oscuro' },
];

const DENSITY_ITEMS = [
  { id: 'auto', label: 'Automática' },
  { id: 'comfortable', label: 'Cómoda' },
  { id: 'compact', label: 'Compacta' },
];

const SCALE_ITEMS = [
  { id: '0.9', label: '90 %' },
  { id: '1', label: '100 %' },
  { id: '1.1', label: '110 %' },
  { id: '1.25', label: '125 %' },
];

const MOTION_ITEMS = [
  { id: 'system', label: 'Según el sistema' },
  { id: 'on', label: 'Reducir siempre' },
];

const AI_ENABLED_ITEMS = [
  { id: 'true', label: 'Activado' },
  { id: 'false', label: 'Desactivado' },
];

export function SettingsView({ onNavigate, onBack }) {
  const profile = useProfile();
  const prefs = usePrefs();
  const progress = useProgress();
  const review = useReview();

  const [aiModels, setAiModels] = useState(DEFAULT_AI_MODELS);
  const [statusNotice, setStatusNotice] = useState(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [confirmWord, setConfirmWord] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    let active = true;
    fetch('/api/ai/models')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        const rawList = Array.isArray(data.models)
          ? data.models
          : Array.isArray(data)
            ? data
            : [];
        if (rawList.length === 0) return;
        const normalized = rawList
          .map((item) => {
            if (typeof item === 'string') {
              return { id: item, label: item };
            }
            if (item && typeof item === 'object' && item.id) {
              return {
                id: String(item.id),
                label: String(item.label || item.name || item.id),
              };
            }
            return null;
          })
          .filter(Boolean);
        if (normalized.length > 0) {
          setAiModels(normalized);
        }
      })
      .catch(() => {
        // Mantiene lista local verificada si el servidor de desarrollo no expone /api/ai/models
      });
    return () => {
      active = false;
    };
  }, []);

  const modelOptions = React.useMemo(() => {
    const map = new Map();
    for (const m of DEFAULT_AI_MODELS) {
      map.set(m.id, m);
    }
    for (const m of aiModels) {
      map.set(m.id, m);
    }
    if (prefs.aiModelFast && !map.has(prefs.aiModelFast)) {
      map.set(prefs.aiModelFast, {
        id: prefs.aiModelFast,
        label: prefs.aiModelFast,
      });
    }
    if (prefs.aiModelDeep && !map.has(prefs.aiModelDeep)) {
      map.set(prefs.aiModelDeep, {
        id: prefs.aiModelDeep,
        label: prefs.aiModelDeep,
      });
    }
    return Array.from(map.values());
  }, [aiModels, prefs.aiModelFast, prefs.aiModelDeep]);

  const completedCount = Object.values(progress.lessons || {}).filter(
    (entry) => entry?.status === 'completed' || entry?.status === 'known'
  ).length;
  const projectCount = Object.values(progress.projects || {}).filter(
    (entry) => entry?.completed
  ).length;
  const cardCount = Object.keys(review.cards || {}).length;

  const handleExport = () => {
    const res = exportState();
    if (res?.ok) {
      setStatusNotice({
        tone: 'ok',
        message: `Respaldo descargado: ${res.filename}`,
      });
    } else {
      setStatusNotice({
        tone: 'bad',
        message: 'No se pudo exportar el archivo de progreso.',
      });
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const result = await importState(file);
    if (result?.ok) {
      setStatusNotice({
        tone: 'ok',
        message: 'Progreso importado y aplicado en este navegador.',
      });
    } else {
      setStatusNotice({
        tone: 'bad',
        message:
          result?.error ||
          'El archivo seleccionado no cumple el formato de respaldo de Grano.',
      });
    }
  };

  const handleConfirmReset = () => {
    if (confirmWord.trim().toLowerCase() !== 'reiniciar') return;
    resetAllProgress();
    setResetDialogOpen(false);
    setConfirmWord('');
    setStatusNotice({
      tone: 'ok',
      message: 'Todo el progreso local se ha reiniciado a los valores iniciales.',
    });
  };

  const specializationTracks = TRACKS.filter((t) => t.id !== 'core');

  return (
    <div className="sec-view settings-view" data-view="settings">
      <header className="sec-header">
        <div className="sec-header__top">
          <div>
            <span className="sec-kicker">PREFERENCIAS Y DATOS LOCALES</span>
            <h1 className="sec-title">Ajustes</h1>
            <p className="sec-lead">
              Configura tu ruta de estudio, la apariencia de lectura, el tutor local y el respaldo de tu progreso en este dispositivo.
            </p>
          </div>
          {(onBack || onNavigate) && (
            <div className="sec-actions">
              <Button
                variant="secondary"
                size="sm"
                icon={ArrowLeft}
                onClick={() => {
                  if (typeof onBack === 'function') {
                    onBack();
                  } else if (typeof onNavigate === 'function') {
                    onNavigate('home');
                  }
                }}
              >
                Volver a Hoy
              </Button>
            </div>
          )}
        </div>
      </header>

      {statusNotice && (
        <div
          className={`settings-notice settings-notice--${statusNotice.tone}`}
          role="status"
          aria-live="polite"
        >
          {statusNotice.tone === 'ok' ? (
            <Check size={16} aria-hidden="true" />
          ) : (
            <AlertCircle size={16} aria-hidden="true" />
          )}
          <span>{statusNotice.message}</span>
        </div>
      )}

      {/* 1. Ruta y perfil */}
      <section className="sec-section" aria-labelledby="settings-profile-heading">
        <div className="sec-section__head">
          <div>
            <h2 id="settings-profile-heading" className="sec-section__title">
              Ruta y punto de partida
            </h2>
            <p className="sec-section__sub">
              El tronco común es compartido; el área elegida prioriza tus módulos de especialización y proyectos.
            </p>
          </div>
        </div>

        <div className="settings-group">
          <div className="settings-row settings-row--stack">
            <div className="settings-row__info">
              <span className="settings-row__label">Área de especialización</span>
              <span className="settings-row__desc">
                Puedes cambiar de área en cualquier momento sin perder las lecciones ya completadas.
              </span>
            </div>
            <div
              className="settings-track-grid"
              role="radiogroup"
              aria-label="Área de especialización"
            >
              {specializationTracks.map((t) => {
                const isSelected = profile.track === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    className={`settings-track-option ${
                      isSelected ? 'is-selected' : ''
                    }`.trim()}
                    data-track={t.id}
                    onClick={() => setTrack(t.id)}
                  >
                    <div className="settings-track-option__head">
                      <span
                        className={`settings-track-dot settings-track-dot--${t.id}`}
                        aria-hidden="true"
                      />
                      <span className="settings-track-option__name">{t.name}</span>
                      <span className="settings-track-option__code">{t.short}</span>
                    </div>
                    <p className="settings-track-option__summary">{t.summary}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row__info">
              <label htmlFor="settings-start-level" className="settings-row__label">
                Nivel inicial sugerido
              </label>
              <span className="settings-row__desc">
                Define desde qué nivel se priorizan tus siguientes lecciones en Hoy.
              </span>
            </div>
            <div className="settings-row__control">
              <select
                id="settings-start-level"
                className="settings-select"
                value={String(profile.startLevel ?? 0)}
                onChange={(e) => setStartLevel(Number(e.target.value))}
              >
                {LEVELS.map((lvl) => (
                  <option key={lvl.level} value={String(lvl.level)}>
                    Nivel {lvl.level} · {lvl.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Apariencia y lectura */}
      <section className="sec-section" aria-labelledby="settings-appearance-heading">
        <div className="sec-section__head">
          <div>
            <h2 id="settings-appearance-heading" className="sec-section__title">
              Apariencia y lectura
            </h2>
            <p className="sec-section__sub">
              Ajustes aplicados de inmediato sobre el documento actual.
            </p>
          </div>
        </div>

        <div className="settings-group">
          <div className="settings-row">
            <div className="settings-row__info">
              <span className="settings-row__label">Tema de color</span>
              <span className="settings-row__desc">
                Papel cálido en modo claro, pizarra de bajo contraste en oscuro.
              </span>
            </div>
            <div className="settings-row__control">
              <Segmented
                ariaLabel="Tema de color"
                items={THEME_ITEMS}
                value={prefs.theme}
                onChange={(val) => setPref('theme', val)}
                size="sm"
              />
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row__info">
              <span className="settings-row__label">Densidad de interfaz</span>
              <span className="settings-row__desc">
                Controla el espaciado vertical en tablas, listas y paneles.
              </span>
            </div>
            <div className="settings-row__control">
              <Segmented
                ariaLabel="Densidad de interfaz"
                items={DENSITY_ITEMS}
                value={prefs.density}
                onChange={(val) => setPref('density', val)}
                size="sm"
              />
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row__info">
              <span className="settings-row__label">Escala tipográfica</span>
              <span className="settings-row__desc">
                Ajusta el tamaño base del texto de lectura y del código.
              </span>
            </div>
            <div className="settings-row__control">
              <Segmented
                ariaLabel="Escala tipográfica"
                items={SCALE_ITEMS}
                value={String(prefs.scale ?? 1)}
                onChange={(val) => setPref('scale', Number(val))}
                size="sm"
              />
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row__info">
              <span className="settings-row__label">Movimiento reducido</span>
              <span className="settings-row__desc">
                Suprime las transiciones de interfaz independientemente del sistema operativo.
              </span>
            </div>
            <div className="settings-row__control">
              <Segmented
                ariaLabel="Movimiento reducido"
                items={MOTION_ITEMS}
                value={prefs.reducedMotion}
                onChange={(val) => setPref('reducedMotion', val)}
                size="sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Tutor IA */}
      <section className="sec-section" aria-labelledby="settings-ai-heading">
        <div className="sec-section__head">
          <div>
            <h2 id="settings-ai-heading" className="sec-section__title">
              Tutor y modelos de IA
            </h2>
            <p className="sec-section__sub">
              El tutor se ejecuta bajo demanda a través del puente local. Si lo desactivas, las lecciones y laboratorios siguen funcionando sin llamadas externas.
            </p>
          </div>
        </div>

        <div className="settings-group">
          <div className="settings-row">
            <div className="settings-row__info">
              <span className="settings-row__label">Asistente de IA</span>
              <span className="settings-row__desc">
                Habilita o deshabilita el cajón del tutor y los botones de consulta contextual.
              </span>
            </div>
            <div className="settings-row__control">
              <Segmented
                ariaLabel="Estado del asistente de IA"
                items={AI_ENABLED_ITEMS}
                value={String(Boolean(prefs.aiEnabled))}
                onChange={(val) => setPref('aiEnabled', val === 'true')}
                size="sm"
              />
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row__info">
              <label htmlFor="settings-ai-fast" className="settings-row__label">
                Modelo rápido (Modo Rápido)
              </label>
              <span className="settings-row__desc">
                Empleado para aclarar conceptos, pistas breves y glosario.
              </span>
            </div>
            <div className="settings-row__control">
              <select
                id="settings-ai-fast"
                className="settings-select"
                value={prefs.aiModelFast}
                disabled={!prefs.aiEnabled}
                onChange={(e) => setPref('aiModelFast', e.target.value)}
              >
                {modelOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row__info">
              <label htmlFor="settings-ai-deep" className="settings-row__label">
                Modelo profundo (Modo Profundo)
              </label>
              <span className="settings-row__desc">
                Empleado en auditoría de consultas SQL, rúbricas y simulacros de entrevista.
              </span>
            </div>
            <div className="settings-row__control">
              <select
                id="settings-ai-deep"
                className="settings-select"
                value={prefs.aiModelDeep}
                disabled={!prefs.aiEnabled}
                onChange={(e) => setPref('aiModelDeep', e.target.value)}
              >
                {modelOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Datos y almacenamiento local */}
      <section className="sec-section" aria-labelledby="settings-data-heading">
        <div className="sec-section__head">
          <div>
            <h2 id="settings-data-heading" className="sec-section__title">
              Respaldo y reinicio de progreso
            </h2>
            <p className="sec-section__sub">
              Estado actual guardado en este navegador:{' '}
              <strong className="tabular">{completedCount}</strong> lecciones completadas,{' '}
              <strong className="tabular">{projectCount}</strong> proyectos entregados y{' '}
              <strong className="tabular">{cardCount}</strong> tarjetas de repaso registradas.
            </p>
          </div>
        </div>

        <div className="settings-group">
          <div className="settings-row">
            <div className="settings-row__info">
              <span className="settings-row__label">Exportar progreso</span>
              <span className="settings-row__desc">
                Descarga un archivo JSON con tu perfil, avance de lecciones, proyectos y calendario FSRS.
              </span>
            </div>
            <div className="settings-row__control">
              <Button
                variant="secondary"
                size="sm"
                icon={Download}
                onClick={handleExport}
              >
                Exportar progreso
              </Button>
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row__info">
              <span className="settings-row__label">Importar progreso</span>
              <span className="settings-row__desc">
                Restaura un archivo JSON previamente exportado desde Grano (validado antes de aplicarse).
              </span>
            </div>
            <div className="settings-row__control">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="sr-only"
                aria-label="Seleccionar archivo JSON de progreso"
              />
              <Button
                variant="secondary"
                size="sm"
                icon={Upload}
                onClick={() => fileInputRef.current?.click()}
              >
                Importar progreso
              </Button>
            </div>
          </div>

          <div className="settings-row settings-row--danger">
            <div className="settings-row__info">
              <span className="settings-row__label">Reiniciar todo</span>
              <span className="settings-row__desc">
                Borra las lecciones completadas, las tarjetas FSRS, los proyectos entregados y el historial del tutor.
              </span>
            </div>
            <div className="settings-row__control">
              <Button
                variant="danger"
                size="sm"
                icon={RotateCcw}
                onClick={() => {
                  setConfirmWord('');
                  setResetDialogOpen(true);
                }}
              >
                Reiniciar todo
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Dialog
        open={resetDialogOpen}
        onClose={() => {
          setResetDialogOpen(false);
          setConfirmWord('');
        }}
        title="Reiniciar todo el progreso"
        description="Esta acción eliminará el avance de lecciones, tarjetas FSRS, proyectos y preferencias guardadas en este navegador. Exporta antes tu progreso si deseas conservar una copia."
        size="sm"
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setResetDialogOpen(false);
                setConfirmWord('');
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={confirmWord.trim().toLowerCase() !== 'reiniciar'}
              onClick={handleConfirmReset}
            >
              Confirmar reinicio
            </Button>
          </>
        }
      >
        <div className="settings-reset-confirm">
          <label htmlFor="settings-reset-input" className="settings-reset-confirm__label">
            Escribe <code>reiniciar</code> para activar el botón de confirmación:
          </label>
          <input
            id="settings-reset-input"
            type="text"
            className="settings-input"
            value={confirmWord}
            onChange={(e) => setConfirmWord(e.target.value)}
            placeholder="reiniciar"
            autoComplete="off"
          />
        </div>
      </Dialog>
    </div>
  );
}

export default SettingsView;
