// Vistas de respaldo del shell para 'settings' y 'review' cuando App.jsx aún no las enruta directamente.
// Cuando T12 y el orquestador conectan SettingsView y SpacedRepetitionView en App.jsx, AppShell renderiza el hijo de App.jsx.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Download,
  Upload,
  Trash2,
} from 'lucide-react';
import {
  Button,
  Card,
  Dialog,
  Kbd,
  Segmented,
} from '../components/ui/index.js';
import SpacedRepetitionView from '../components/SpacedRepetitionView.jsx';
import { normalizeReviewState } from '../engine/review.js';
import {
  exportState,
  importState,
  resetAllProgress,
  resetDeck,
  reviewFlashcard,
  setPref,
  setStartLevel,
  setTrack,
  usePrefs,
  useProfile,
  useProgress,
  useReview,
} from '../state/store.js';

const THEME_ITEMS = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'system', label: 'Sistema' },
];

const DENSITY_ITEMS = [
  { value: 'auto', label: 'Automática' },
  { value: 'comfortable', label: 'Cómoda' },
  { value: 'compact', label: 'Compacta' },
];

const SCALE_ITEMS = [
  { value: '0.9', label: '90 %' },
  { value: '1', label: '100 %' },
  { value: '1.1', label: '110 %' },
  { value: '1.25', label: '125 %' },
];

const MOTION_ITEMS = [
  { value: 'system', label: 'Según el sistema' },
  { value: 'on', label: 'Reducir siempre' },
];

const TRACK_ITEMS = [
  { value: 'core', label: 'Tronco común' },
  { value: 'de', label: 'Ingeniería (DE)' },
  { value: 'da', label: 'Análisis (DA)' },
  { value: 'bi', label: 'BI' },
];

export function ShellSettingsFallback({ onThemeChange, onScaleChanged }) {
  const prefs = usePrefs();
  const profile = useProfile();
  const fileInputRef = useRef(null);
  const [models, setModels] = useState([
    { id: 'gemini-3.8-flash-low', label: 'Gemini 3.8 Flash (Low)' },
    { id: 'gemini-3.8-flash-medium', label: 'Gemini 3.8 Flash (Medium)' },
    { id: 'gemini-4-argon-medium', label: 'Gemini 4 Argon (Medium)' },
    { id: 'gemini-4-argon-high', label: 'Gemini 4 Argon (High)' },
  ]);
  const [statusMessage, setStatusMessage] = useState('');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/ai/models')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data?.models) && data.models.length > 0) {
          setModels(data.models);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleThemeSelect = (val) => {
    setPref('theme', val);
    if (typeof onThemeChange === 'function') {
      onThemeChange(val);
    }
  };

  const handleScaleSelect = (val) => {
    const num = Number(val) || 1;
    setPref('scale', num);
    if (typeof onScaleChanged === 'function') {
      onScaleChanged(num);
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await importState(file);
    if (res.ok) {
      setStatusMessage('Progreso importado correctamente.');
    } else {
      setStatusMessage(res.error || 'No se pudo importar el archivo.');
    }
    e.target.value = '';
  };

  return (
    <section className="app-settings-fallback" aria-label="Ajustes de Grano">
      <header className="app-settings-fallback__header">
        <h1 className="app-settings-fallback__title">Ajustes</h1>
        <p className="app-settings-fallback__sub">
          Apariencia, densidad, escala de interfaz, área de estudio, tutor IA y respaldo de datos.
        </p>
      </header>

      <div className="app-settings-fallback__grid">
        <Card
          title="Apariencia y escala"
          subtitle="Adapta el tamaño de letra, el espaciado y el contraste a tu pantalla."
        >
          <div className="app-settings-fallback__field">
            <span className="app-settings-fallback__label">Tema de color</span>
            <Segmented
              ariaLabel="Tema de color"
              items={THEME_ITEMS}
              value={prefs.theme}
              onChange={handleThemeSelect}
            />
          </div>

          <div className="app-settings-fallback__field">
            <span className="app-settings-fallback__label">Densidad de interfaz</span>
            <Segmented
              ariaLabel="Densidad de interfaz"
              items={DENSITY_ITEMS}
              value={prefs.density}
              onChange={(val) => setPref('density', val)}
            />
            <span className="app-settings-fallback__help">
              En modo automático se activa la densidad compacta en pantallas de hasta 1366×800 px.
            </span>
          </div>

          <div className="app-settings-fallback__field">
            <span className="app-settings-fallback__label">
              Escala de interfaz (<Kbd>Ctrl +</Kbd> / <Kbd>Ctrl -</Kbd> / <Kbd>Ctrl 0</Kbd>)
            </span>
            <Segmented
              ariaLabel="Escala de interfaz"
              items={SCALE_ITEMS}
              value={String(prefs.scale)}
              onChange={handleScaleSelect}
            />
          </div>

          <div className="app-settings-fallback__field">
            <span className="app-settings-fallback__label">Movimiento reducido</span>
            <Segmented
              ariaLabel="Movimiento reducido"
              items={MOTION_ITEMS}
              value={prefs.reducedMotion}
              onChange={(val) => setPref('reducedMotion', val)}
            />
          </div>
        </Card>

        <Card
          title="Ruta y tutor IA"
          subtitle="Elige tu área principal y los modelos de Antigravity (agy) para tus consultas."
        >
          <div className="app-settings-fallback__field">
            <span className="app-settings-fallback__label">Área de estudio</span>
            <Segmented
              ariaLabel="Área de estudio"
              items={TRACK_ITEMS}
              value={profile.track || 'core'}
              onChange={(val) => setTrack(val === 'core' ? null : val)}
            />
          </div>

          <div className="app-settings-fallback__field">
            <label className="app-settings-fallback__label" htmlFor="settings-start-level">
              Nivel inicial recomendado
            </label>
            <select
              id="settings-start-level"
              className="app-settings-fallback__select"
              value={profile.startLevel ?? 0}
              onChange={(e) => setStartLevel(Number(e.target.value))}
            >
              <option value={0}>Nivel 0 · Cimientos (desde cero)</option>
              <option value={1}>Nivel 1 · Fundamentos (SQL y Python base)</option>
              <option value={2}>Nivel 2 · Intermedio</option>
              <option value={3}>Nivel 3 · Avanzado</option>
              <option value={4}>Nivel 4 · Experto</option>
            </select>
          </div>

          <div className="app-settings-fallback__field">
            <label className="app-settings-fallback__checkbox">
              <input
                type="checkbox"
                checked={prefs.aiEnabled !== false}
                onChange={(e) => setPref('aiEnabled', e.target.checked)}
              />
              <span>Activar funciones del Tutor IA local</span>
            </label>
          </div>

          <div className="app-settings-fallback__row">
            <div className="app-settings-fallback__field">
              <label className="app-settings-fallback__label" htmlFor="settings-model-fast">
                Modelo rápido
              </label>
              <select
                id="settings-model-fast"
                className="app-settings-fallback__select"
                value={prefs.aiModelFast}
                onChange={(e) => setPref('aiModelFast', e.target.value)}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label || m.id}
                  </option>
                ))}
              </select>
            </div>

            <div className="app-settings-fallback__field">
              <label className="app-settings-fallback__label" htmlFor="settings-model-deep">
                Modelo profundo
              </label>
              <select
                id="settings-model-deep"
                className="app-settings-fallback__select"
                value={prefs.aiModelDeep}
                onChange={(e) => setPref('aiModelDeep', e.target.value)}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label || m.id}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        <Card
          title="Datos y progreso"
          subtitle="Tu avance se guarda en este navegador (grano:v1). Puedes exportarlo o restaurarlo."
        >
          <div className="app-settings-fallback__actions">
            <Button
              variant="secondary"
              icon={Download}
              onClick={() => {
                exportState();
                setStatusMessage('Archivo de progreso exportado.');
              }}
            >
              Exportar progreso
            </Button>

            <Button
              variant="secondary"
              icon={Upload}
              onClick={() => fileInputRef.current?.click()}
            >
              Importar progreso
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={handleImportFile}
              aria-label="Seleccionar archivo JSON de progreso"
            />

            <Button
              variant="danger"
              icon={Trash2}
              onClick={() => {
                setResetConfirmText('');
                setResetDialogOpen(true);
              }}
            >
              Reiniciar todo
            </Button>
          </div>

          {statusMessage && (
            <p className="app-settings-fallback__status" role="status">
              {statusMessage}
            </p>
          )}
        </Card>
      </div>

      <Dialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        title="Reiniciar todo el progreso"
        description="Esta acción borra tus lecciones completadas, tarjetas FSRS e historial del tutor. Escribe «reiniciar» para confirmar."
        actions={
          <>
            <Button variant="secondary" onClick={() => setResetDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              disabled={resetConfirmText.trim().toLowerCase() !== 'reiniciar'}
              onClick={() => {
                resetAllProgress();
                setResetDialogOpen(false);
                setStatusMessage('Todo el progreso se ha reiniciado.');
              }}
            >
              Borrar progreso
            </Button>
          </>
        }
      >
        <input
          type="text"
          className="app-settings-fallback__input"
          placeholder="Escribe reiniciar"
          value={resetConfirmText}
          onChange={(e) => setResetConfirmText(e.target.value)}
          aria-label="Escribe reiniciar para confirmar"
        />
      </Dialog>
    </section>
  );
}

export function ShellReviewFallback({ completedIds = [], onOpenLesson = () => {} }) {
  const review = useReview();
  const progress = useProgress();

  const leitnerState = useMemo(
    () => normalizeReviewState(review.cards),
    [review.cards]
  );

  const lessonSteps = useMemo(() => {
    const map = {};
    for (const [id, entry] of Object.entries(progress.lessons || {})) {
      if (!entry) continue;
      if (entry.status !== 'not_started' || (entry.stepIndex ?? 0) > 0) {
        map[id] = Number(entry.stepIndex ?? 0);
      }
    }
    return map;
  }, [progress.lessons]);

  return (
    <SpacedRepetitionView
      leitnerState={leitnerState}
      completedIds={completedIds}
      lessonSteps={lessonSteps}
      onReviewCard={(cardId, quality) => reviewFlashcard(cardId, quality)}
      onResetDeck={() => resetDeck()}
      onOpenLesson={onOpenLesson}
    />
  );
}
