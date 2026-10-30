// Shell principal de Grano: barra superior, navegación lateral colapsable, barra inferior móvil (< 900px),
// control de densidad/escala (§4.5) con atajos globales (Ctrl +/-/0) y paleta de comandos (Ctrl+K).
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Home,
  Compass,
  Terminal,
  Repeat,
  BookOpen,
  BarChart3,
  Settings,
  FolderKanban,
  Search,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  Monitor,
  MessageSquare,
  User,
  Download,
  SlidersHorizontal,
} from 'lucide-react';
import {
  Button,
  Kbd,
  BrandMark,
  Tooltip,
  Sheet,
  Menu,
  withViewTransition,
} from '../components/ui/index.js';
import {
  exportState,
  resolveEffectiveTheme,
  setPref,
  setTrack,
  usePrefs,
} from '../state/store.js';
import { CommandPalette } from './CommandPalette.jsx';
import { ShellReviewFallback, ShellSettingsFallback } from './ShellFallbackViews.jsx';

export const SIDEBAR_NAV_ITEMS = [
  { id: 'home', label: 'Hoy', Icon: Home },
  { id: 'roadmap', label: 'Ruta', Icon: Compass },
  { id: 'practice', label: 'Práctica', Icon: Terminal },
  { id: 'review', label: 'Repaso', Icon: Repeat },
  { id: 'glossary', label: 'Glosario', Icon: BookOpen },
  { id: 'analytics', label: 'Progreso', Icon: BarChart3 },
];

export const BOTTOM_TAB_ITEMS = [
  { id: 'home', label: 'Hoy', Icon: Home },
  { id: 'roadmap', label: 'Ruta', Icon: Compass },
  { id: 'review', label: 'Repaso', Icon: Repeat },
  { id: 'practice', label: 'Práctica', Icon: Terminal },
  { id: 'more', label: 'Más', Icon: MoreHorizontal },
];

const SCALE_STEPS = [0.9, 1, 1.1, 1.25];
const SCALE_NOTICE_MS = 1500;

const THEME_OPTIONS = [
  { id: 'light', label: 'Claro', Icon: Sun },
  { id: 'dark', label: 'Oscuro', Icon: Moon },
  { id: 'system', label: 'Sistema', Icon: Monitor },
];

function useViewportSize() {
  const [size, setSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1440,
    height: typeof window !== 'undefined' ? window.innerHeight : 900,
  }));

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

function isEditableElementFocused(target) {
  const el = target instanceof Element ? target : document.activeElement;
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') {
    return true;
  }
  if (el.getAttribute?.('contenteditable') === 'true') {
    return true;
  }
  if (typeof el.closest === 'function') {
    if (el.closest('.cm-editor, .cm-content, [contenteditable="true"]')) {
      return true;
    }
  }
  return false;
}

function isCommandPaletteElement(child) {
  if (!React.isValidElement(child)) return false;
  const typeName =
    typeof child.type === 'function'
      ? child.type.displayName || child.type.name || ''
      : '';
  if (typeName === 'CommandPaletteModal' || typeName === 'CommandPalette') {
    return true;
  }
  return Boolean(
    child.props &&
      'onSelectLesson' in child.props &&
      'onSelectGlossary' in child.props &&
      'onChangeQuery' in child.props
  );
}

function isDiagnosticModalElement(child) {
  if (!React.isValidElement(child)) return false;
  const typeName =
    typeof child.type === 'function'
      ? child.type.displayName || child.type.name || ''
      : '';
  if (typeName === 'DiagnosticModal') return true;
  return Boolean(child.props && 'onCompleteDiagnostic' in child.props);
}

export function AppShell({
  viewMode = 'home',
  onNavigate = () => {},
  completedIds = [],
  dueCardsCount = 0,
  tutorOpen = false,
  onToggleTutor = () => {},
  onOpenCommandPalette,
  theme = 'light',
  onThemeChange,
  tutorPanel = null,
  children,
}) {
  const prefs = usePrefs();
  const { width: viewportWidth, height: viewportHeight } = useViewportSize();
  const isMobile = viewportWidth < 900;
  const isCompactViewport = viewportWidth >= 900 && viewportWidth < 1280;

  const [manualLessonSidebarOverride, setManualLessonSidebarOverride] = useState(null);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [localPaletteOpen, setLocalPaletteOpen] = useState(false);
  const [localPaletteQuery, setLocalPaletteQuery] = useState('');
  const [syncedDueCount, setSyncedDueCount] = useState(null);

  const [aiStatus, setAiStatus] = useState({
    loading: true,
    available: true,
    engine: 'agy',
    defaultModels: {
      fast: prefs.aiModelFast || 'gemini-3.8-flash-low',
      deep: prefs.aiModelDeep || 'gemini-4-argon-medium',
    },
    message: '',
  });

  const [scaleNotice, setScaleNotice] = useState('');
  const scaleTimerRef = useRef(null);

  const triggerScaleNotice = useCallback((scaleVal) => {
    const pct = Math.round((Number(scaleVal) || 1) * 100);
    setScaleNotice(`Escala: ${pct} % · Ctrl+0 para restablecer`);
    if (scaleTimerRef.current) {
      clearTimeout(scaleTimerRef.current);
    }
    scaleTimerRef.current = setTimeout(() => {
      scaleTimerRef.current = null;
      setScaleNotice('');
    }, SCALE_NOTICE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (scaleTimerRef.current) {
        clearTimeout(scaleTimerRef.current);
      }
    };
  }, []);

  // Resetear override temporal de barra lateral cuando se sale de una lección
  useEffect(() => {
    if (viewMode !== 'lesson') {
      setManualLessonSidebarOverride(null);
    }
  }, [viewMode]);

  // Consultar /api/ai/status para el indicador de estado de la IA en la barra superior
  useEffect(() => {
    let cancelled = false;
    fetch('/api/ai/status')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data || typeof data !== 'object') return;
        setAiStatus({
          loading: false,
          available: Boolean(data.available),
          engine: data.engine || 'agy',
          defaultModels: data.defaultModels || {
            fast: prefs.aiModelFast || 'gemini-3.8-flash-low',
            deep: prefs.aiModelDeep || 'gemini-4-argon-medium',
          },
          message: data.message || '',
        });
      })
      .catch(() => {
        if (cancelled) return;
        setAiStatus((prev) => ({
          ...prev,
          loading: false,
          available: false,
          message: 'Servidor IA local sin conexión.',
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [prefs.aiEnabled, prefs.aiModelFast, prefs.aiModelDeep]);

  // Resolución de densidad y sincronización de data-density y data-scale en <html> (§4.5)
  const isCompactResolved = useMemo(() => {
    if (prefs.density === 'compact') return true;
    if (prefs.density === 'comfortable') return false;
    return viewportWidth <= 1366 || viewportHeight <= 800;
  }, [prefs.density, viewportWidth, viewportHeight]);

  useEffect(() => {
    if (typeof document === 'undefined' || !document.documentElement) return;
    const root = document.documentElement;
    const effectiveTheme = resolveEffectiveTheme(prefs.theme);
    root.setAttribute('data-theme', effectiveTheme);
    root.setAttribute('data-density', prefs.density || 'auto');
    root.setAttribute(
      'data-resolved-density',
      isCompactResolved ? 'compact' : 'comfortable'
    );
    root.setAttribute('data-scale', String(prefs.scale || 1));
    root.setAttribute('data-reduced-motion', prefs.reducedMotion || 'system');
  }, [prefs.theme, prefs.density, prefs.scale, prefs.reducedMotion, isCompactResolved]);

  // Atajos globales Ctrl + / Ctrl =, Ctrl -, Ctrl 0 cuando el foco no está en un editor (§4.5)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      if (isEditableElementFocused(event.target)) return;

      const key = event.key;
      const code = event.code;
      const isZoomIn =
        key === '+' ||
        key === '=' ||
        code === 'Equal' ||
        code === 'NumpadAdd';
      const isZoomOut =
        key === '-' ||
        key === '_' ||
        code === 'Minus' ||
        code === 'NumpadSubtract';
      const isZoomReset =
        key === '0' ||
        code === 'Digit0' ||
        code === 'Numpad0';

      if (!isZoomIn && !isZoomOut && !isZoomReset) return;

      event.preventDefault();
      const currentScale = Number(prefs.scale) || 1;
      const currentIdx = SCALE_STEPS.indexOf(currentScale);
      const safeIdx = currentIdx === -1 ? 1 : currentIdx;

      if (isZoomReset) {
        setPref('scale', 1);
        triggerScaleNotice(1);
        return;
      }

      if (isZoomIn) {
        const nextIdx = Math.min(SCALE_STEPS.length - 1, safeIdx + 1);
        const nextScale = SCALE_STEPS[nextIdx];
        setPref('scale', nextScale);
        triggerScaleNotice(nextScale);
        return;
      }

      if (isZoomOut) {
        const prevIdx = Math.max(0, safeIdx - 1);
        const nextScale = SCALE_STEPS[prevIdx];
        setPref('scale', nextScale);
        triggerScaleNotice(nextScale);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prefs.scale, triggerScaleNotice]);

  useEffect(() => {
    if (!isMobile && moreSheetOpen) {
      setMoreSheetOpen(false);
    }
  }, [isMobile, moreSheetOpen]);

  useEffect(() => {
    const handleDueSync = (e) => {
      if (typeof e?.detail === 'number') {
        setSyncedDueCount(e.detail);
      }
    };
    window.addEventListener('manual_datos_due_count', handleDueSync);
    return () => window.removeEventListener('manual_datos_due_count', handleDueSync);
  }, []);

  const handleSelectTheme = useCallback(
    (nextMode) => {
      setPref('theme', nextMode);
      if (typeof onThemeChange === 'function') {
        onThemeChange(nextMode);
      }
    },
    [onThemeChange]
  );

  const handleToggleThemeQuick = useCallback(() => {
    const currentEffective = resolveEffectiveTheme(prefs.theme);
    const nextTheme = currentEffective === 'dark' ? 'light' : 'dark';
    handleSelectTheme(nextTheme);
  }, [prefs.theme, handleSelectTheme]);

  const handleCycleDensity = useCallback(() => {
    const order = ['auto', 'compact', 'comfortable'];
    const idx = order.indexOf(prefs.density);
    const nextDensity = order[(idx + 1) % order.length];
    setPref('density', nextDensity);
  }, [prefs.density]);

  const effectiveDueCount = useMemo(() => {
    if (typeof syncedDueCount === 'number') {
      return syncedDueCount;
    }
    return Math.max(0, Number(dueCardsCount) || 0);
  }, [syncedDueCount, dueCardsCount]);

  // En lección (< 1600px) o entre 900-1279px se colapsa a rail de 56px salvo override explícito;
  // en >= 1280px fuera de lección se respeta prefs.sidebarCollapsed (false por defecto).
  const isEffectiveCollapsed = useMemo(() => {
    if (viewMode === 'lesson' && viewportWidth < 1600) {
      if (typeof manualLessonSidebarOverride === 'boolean') {
        return manualLessonSidebarOverride;
      }
      return true;
    }
    if (isCompactViewport) {
      if (typeof manualLessonSidebarOverride === 'boolean') {
        return manualLessonSidebarOverride;
      }
      return true;
    }
    return Boolean(prefs.sidebarCollapsed);
  }, [
    viewMode,
    viewportWidth,
    isCompactViewport,
    manualLessonSidebarOverride,
    prefs.sidebarCollapsed,
  ]);

  const handleToggleSidebar = () => {
    const nextCollapsed = !isEffectiveCollapsed;
    if ((viewMode === 'lesson' && viewportWidth < 1600) || isCompactViewport) {
      setManualLessonSidebarOverride(nextCollapsed);
    }
    setPref('sidebarCollapsed', nextCollapsed);
  };

  const handleSelectNav = useCallback(
    (targetView) => {
      setMoreSheetOpen(false);
      const mappedView =
        targetView === 'projects'
          ? 'capstones'
          : targetView === 'progress'
            ? 'analytics'
            : targetView;
      withViewTransition(() => {
        onNavigate(mappedView);
      });
    },
    [onNavigate]
  );

  const handleBottomTabClick = (tabId) => {
    if (tabId === 'more') {
      setMoreSheetOpen(true);
      return;
    }
    handleSelectNav(tabId);
  };

  // Separar CommandPaletteModal de los hijos de vista para reemplazarlo por el CommandPalette mejorado
  const {
    paletteChildProps,
    modalChildren,
    viewChildren,
  } = useMemo(() => {
    const childList = React.Children.toArray(children);
    let extractedPaletteProps = null;
    const modals = [];
    const views = [];

    for (const child of childList) {
      if (!React.isValidElement(child)) continue;
      if (isCommandPaletteElement(child)) {
        extractedPaletteProps = child.props;
      } else if (isDiagnosticModalElement(child)) {
        modals.push(child);
      } else {
        views.push(child);
      }
    }

    return {
      paletteChildProps: extractedPaletteProps,
      modalChildren: modals,
      viewChildren: views,
    };
  }, [children]);

  const isPaletteOpen = Boolean(paletteChildProps?.isOpen || localPaletteOpen);
  const paletteQuery =
    paletteChildProps?.query !== undefined ? paletteChildProps.query : localPaletteQuery;

  const handleChangePaletteQuery = useCallback(
    (nextQ) => {
      setLocalPaletteQuery(nextQ);
      paletteChildProps?.onChangeQuery?.(nextQ);
    },
    [paletteChildProps]
  );

  const handleOpenPalette = useCallback(() => {
    setLocalPaletteQuery('');
    if (typeof onOpenCommandPalette === 'function') {
      onOpenCommandPalette();
    }
    if (!paletteChildProps) {
      setLocalPaletteOpen(true);
    }
  }, [onOpenCommandPalette, paletteChildProps]);

  const handleClosePalette = useCallback(() => {
    setLocalPaletteOpen(false);
    paletteChildProps?.onClose?.();
  }, [paletteChildProps]);

  const isAiReady = Boolean(aiStatus.available && prefs.aiEnabled !== false);
  const activeFastModel =
    prefs.aiModelFast || aiStatus.defaultModels?.fast || 'gemini-3.8-flash-low';
  const activeDeepModel =
    prefs.aiModelDeep || aiStatus.defaultModels?.deep || 'gemini-4-argon-medium';

  const aiTooltipText = isAiReady
    ? `Modelo activo: ${activeFastModel} (rápido) · ${activeDeepModel} (profundo)`
    : prefs.aiEnabled === false
      ? `Tutor IA desactivado en Ajustes (${activeFastModel})`
      : `${aiStatus.message || 'Antigravity (agy) no disponible'} · Modelo: ${activeFastModel}`;

  const densityLabel =
    prefs.density === 'compact'
      ? 'Compacta'
      : prefs.density === 'comfortable'
        ? 'Cómoda'
        : 'Automática';

  const userMenuItems = useMemo(
    () => [
      {
        id: 'user-settings',
        label: 'Ajustes',
        icon: Settings,
        shortcut: 'Preferencias',
        onSelect: () => handleSelectNav('settings'),
      },
      {
        id: 'user-projects',
        label: 'Proyectos',
        icon: FolderKanban,
        shortcut: 'Entregables',
        onSelect: () => handleSelectNav('capstones'),
      },
      {
        id: 'user-export',
        label: 'Exportar progreso',
        icon: Download,
        shortcut: 'JSON',
        onSelect: () => exportState(),
      },
      { id: 'div-theme', divider: true },
      {
        id: 'theme-light',
        label: 'Tema: Claro',
        icon: Sun,
        shortcut: prefs.theme === 'light' ? '✓' : '',
        onSelect: () => handleSelectTheme('light'),
      },
      {
        id: 'theme-dark',
        label: 'Tema: Oscuro',
        icon: Moon,
        shortcut: prefs.theme === 'dark' ? '✓' : '',
        onSelect: () => handleSelectTheme('dark'),
      },
      {
        id: 'theme-system',
        label: 'Tema: Sistema',
        icon: Monitor,
        shortcut: prefs.theme === 'system' ? '✓' : '',
        onSelect: () => handleSelectTheme('system'),
      },
      { id: 'div-density', divider: true },
      {
        id: 'density-cycle',
        label: `Densidad: ${densityLabel}`,
        icon: SlidersHorizontal,
        shortcut: isCompactResolved ? 'Compacta' : 'Cómoda',
        onSelect: () => handleCycleDensity(),
      },
    ],
    [prefs.theme, densityLabel, isCompactResolved, handleSelectNav, handleSelectTheme, handleCycleDensity]
  );

  const renderSidebarNavButton = ({ id, label, Icon, isFooter = false }) => {
    const isActive =
      viewMode === id ||
      (id === 'roadmap' && viewMode === 'lesson') ||
      (id === 'analytics' && viewMode === 'progress');
    const showDueBadge = id === 'review' && effectiveDueCount > 0;
    const tooltipText = showDueBadge
      ? `${label} (${effectiveDueCount} pendientes)`
      : label;

    const buttonNode = (
      <button
        key={id}
        type="button"
        className={`app-sidebar__item ${
          isActive ? 'app-sidebar__item--active' : ''
        } ${isFooter ? 'app-sidebar__item--footer' : ''}`.trim()}
        onClick={() => handleSelectNav(id)}
        aria-current={isActive ? 'page' : undefined}
        aria-label={
          showDueBadge
            ? (isEffectiveCollapsed ? `${label} ${effectiveDueCount > 99 ? '99+' : effectiveDueCount} tarjetas pendientes` : undefined)
            : label
        }
      >
        <span className="app-sidebar__item-main">
          <Icon size={16} strokeWidth={1.75} aria-hidden="true" className="app-sidebar__item-icon" />
          {!isEffectiveCollapsed && (
            <span className="app-sidebar__item-label">{label}</span>
          )}
        </span>

        {!isEffectiveCollapsed && showDueBadge && (
          <span className="app-sidebar__badge tabular" aria-hidden="true">
            {effectiveDueCount > 99 ? '99+' : effectiveDueCount}
          </span>
        )}

        {isEffectiveCollapsed && showDueBadge && (
          <span
            className="app-sidebar__badge-dot tabular"
            aria-hidden="true"
          >
            {effectiveDueCount > 99 ? '99+' : effectiveDueCount}
          </span>
        )}
      </button>
    );

    if (isEffectiveCollapsed) {
      return (
        <Tooltip
          key={id}
          content={tooltipText}
          position="bottom"
          className="app-sidebar__tooltip"
        >
          {buttonNode}
        </Tooltip>
      );
    }

    return buttonNode;
  };

  const collapseButtonNode = (
    <button
      type="button"
      className="app-sidebar__collapse-btn"
      onClick={handleToggleSidebar}
      aria-label={
        isEffectiveCollapsed
          ? 'Expandir barra lateral'
          : 'Colapsar barra lateral'
      }
    >
      {isEffectiveCollapsed ? (
        <PanelLeftOpen size={16} strokeWidth={1.75} aria-hidden="true" />
      ) : (
        <>
          <PanelLeftClose size={16} strokeWidth={1.75} aria-hidden="true" />
          <span className="app-sidebar__item-label">Colapsar</span>
        </>
      )}
    </button>
  );

  const hideBottomBar = viewMode === 'lesson';

  return (
    <div className={`app-shell ${hideBottomBar ? 'app-shell--lesson-focus' : ''}`.trim()}>
      <header className="app-topbar">
        <div className="app-topbar__left">
          <button
            type="button"
            className="app-topbar__brand"
            onClick={() => handleSelectNav('home')}
            aria-label="grano — Ir a Hoy"
          >
            <BrandMark size={20} />
            <span className="app-topbar__wordmark">grano</span>
          </button>

          <button
            type="button"
            className="app-topbar__search"
            onClick={handleOpenPalette}
            aria-label="Buscar lecciones, módulos o glosario… Ctrl+K"
          >
            <span className="app-topbar__search-lead">
              <Search size={16} strokeWidth={1.75} aria-hidden="true" />
              <span className="app-topbar__search-placeholder">
                Buscar lecciones, módulos o glosario…
              </span>
            </span>
            <Kbd>Ctrl+K</Kbd>
          </button>
        </div>

        <div className="app-topbar__right">
          <Tooltip
            content={aiTooltipText}
            position="bottom"
            className="app-topbar__ai-tooltip"
          >
            <button
              type="button"
              className="app-topbar__ai-status"
              onClick={() => handleSelectNav('settings')}
              aria-label={`${isAiReady ? 'IA lista' : 'IA no disponible'}. ${aiTooltipText}`}
            >
              <span
                className={`app-topbar__ai-dot ${
                  isAiReady ? 'app-topbar__ai-dot--ready' : 'app-topbar__ai-dot--offline'
                }`.trim()}
                aria-hidden="true"
              />
              <span className="app-topbar__ai-label">
                {isAiReady ? 'IA lista' : 'IA no disponible'}
              </span>
            </button>
          </Tooltip>

          <Button
            variant={tutorOpen ? 'primary' : 'secondary'}
            size="md"
            className="app-topbar__ask-btn"
            onClick={onToggleTutor}
            aria-expanded={tutorOpen}
            ariaLabel="Preguntar al tutor IA"
            icon={MessageSquare}
          >
            Preguntar
          </Button>

          <Menu
            align="end"
            label="Menú de usuario"
            items={userMenuItems}
            trigger={
              <button
                type="button"
                className="ui-btn ui-btn--ghost ui-btn--md app-topbar__user-btn"
                aria-label="Menú de usuario"
              >
                <User size={16} strokeWidth={1.75} aria-hidden="true" />
                <span className="app-topbar__user-label">Menú</span>
              </button>
            }
          />
        </div>
      </header>

      <div className="app-layout">
        <aside
          className={`app-sidebar ${
            isEffectiveCollapsed ? 'app-sidebar--collapsed' : ''
          }`.trim()}
          aria-label="Navegación principal"
        >
          <nav className="app-sidebar__nav" aria-label="Secciones de Grano">
            {SIDEBAR_NAV_ITEMS.map((item) => renderSidebarNavButton(item))}
          </nav>

          <div className="app-sidebar__footer">
            {renderSidebarNavButton({
              id: 'settings',
              label: 'Ajustes',
              Icon: Settings,
              isFooter: true,
            })}

            {isEffectiveCollapsed ? (
              <Tooltip
                content="Expandir barra lateral"
                position="bottom"
                className="app-sidebar__tooltip"
              >
                {collapseButtonNode}
              </Tooltip>
            ) : (
              collapseButtonNode
            )}
          </div>
        </aside>

        <div className="app-workspace">
          <main className="app-main">
            <div className="app-main__inner">
              {modalChildren}
              {viewChildren.length > 0 ? (
                viewChildren
              ) : viewMode === 'settings' ? (
                <ShellSettingsFallback
                  onThemeChange={onThemeChange}
                  onScaleChanged={triggerScaleNotice}
                />
              ) : viewMode === 'review' ? (
                <ShellReviewFallback
                  completedIds={completedIds}
                  onOpenLesson={(lessonId) => paletteChildProps?.onSelectLesson?.(lessonId)}
                />
              ) : null}
            </div>
          </main>
        </div>
      </div>

      <CommandPalette
        isOpen={isPaletteOpen}
        query={paletteQuery}
        onChangeQuery={handleChangePaletteQuery}
        onClose={handleClosePalette}
        lessons={paletteChildProps?.lessons}
        glossary={paletteChildProps?.glossary}
        completedIds={paletteChildProps?.completedIds || completedIds}
        theme={resolveEffectiveTheme(prefs.theme)}
        density={prefs.density}
        scale={prefs.scale}
        onSelectLesson={(lessonId) => {
          if (typeof paletteChildProps?.onSelectLesson === 'function') {
            paletteChildProps.onSelectLesson(lessonId);
          } else {
            handleSelectNav('lesson');
          }
        }}
        onSelectModule={(mod) => {
          if (mod?.track === 'de' || mod?.track === 'da' || mod?.track === 'bi') {
            setTrack(mod.track);
          }
          handleSelectNav('roadmap');
        }}
        onSelectGlossary={(concept) => {
          if (typeof paletteChildProps?.onSelectGlossary === 'function') {
            paletteChildProps.onSelectGlossary(concept);
          } else {
            handleSelectNav('glossary');
          }
        }}
        onNavigate={handleSelectNav}
        onToggleTheme={handleToggleThemeQuick}
        onCycleDensity={handleCycleDensity}
        onResetScale={() => {
          setPref('scale', 1);
          triggerScaleNotice(1);
        }}
        onExportProgress={() => exportState()}
        onAskTutor={() => {
          if (!tutorOpen) {
            onToggleTutor();
          }
        }}
      />

      {scaleNotice && (
        <div
          className="app-scale-notice tabular"
          role="status"
          aria-live="polite"
        >
          {scaleNotice}
        </div>
      )}

      {!hideBottomBar && (
        <nav
          className="app-bottom-nav"
          aria-label="Navegación principal móvil"
        >
          {BOTTOM_TAB_ITEMS.map(({ id, label, Icon }) => {
            const isActive =
              id === 'more'
                ? moreSheetOpen ||
                  viewMode === 'glossary' ||
                  viewMode === 'analytics' ||
                  viewMode === 'progress' ||
                  viewMode === 'capstones' ||
                  viewMode === 'projects' ||
                  viewMode === 'settings'
                : viewMode === id || (id === 'roadmap' && viewMode === 'lesson');
            const showDueBadge = id === 'review' && effectiveDueCount > 0;

            return (
              <button
                key={id}
                type="button"
                className={`app-bottom-nav__item ${
                  isActive ? 'app-bottom-nav__item--active' : ''
                }`.trim()}
                onClick={() => handleBottomTabClick(id)}
                aria-current={viewMode === id ? 'page' : undefined}
                aria-label={
                  showDueBadge
                    ? (isEffectiveCollapsed ? `${label} ${effectiveDueCount > 99 ? '99+' : effectiveDueCount} tarjetas pendientes` : undefined)
                    : label
                }
              >
                <span className="app-bottom-nav__icon-wrap">
                  <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                  {showDueBadge && (
                    <span
                      className="app-bottom-nav__badge tabular"
                      aria-hidden="true"
                    >
                      {effectiveDueCount > 99 ? '99+' : effectiveDueCount}
                    </span>
                  )}
                </span>
                <span className="app-bottom-nav__label">{label}</span>
              </button>
            );
          })}
        </nav>
      )}

      <Sheet
        open={moreSheetOpen}
        onClose={() => setMoreSheetOpen(false)}
        side="bottom"
        title="Más secciones"
        subtitle="Recursos, estadísticas, proyectos y preferencias"
      >
        <div className="app-more-sheet">
          <div className="app-more-sheet__nav">
            <button
              type="button"
              className={`app-more-sheet__item ${
                viewMode === 'glossary' ? 'is-active' : ''
              }`.trim()}
              onClick={() => handleSelectNav('glossary')}
            >
              <span className="app-more-sheet__item-icon">
                <BookOpen size={18} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span className="app-more-sheet__item-copy">
                <strong>Glosario</strong>
                <span>Definiciones técnicas y relaciones entre términos</span>
              </span>
            </button>

            <button
              type="button"
              className={`app-more-sheet__item ${
                viewMode === 'analytics' || viewMode === 'progress' ? 'is-active' : ''
              }`.trim()}
              onClick={() => handleSelectNav('analytics')}
            >
              <span className="app-more-sheet__item-icon">
                <BarChart3 size={18} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span className="app-more-sheet__item-copy">
                <strong>Progreso</strong>
                <span>Horas de estudio, avance por nivel y precisión</span>
              </span>
            </button>

            <button
              type="button"
              className={`app-more-sheet__item ${
                viewMode === 'capstones' || viewMode === 'projects' ? 'is-active' : ''
              }`.trim()}
              onClick={() => handleSelectNav('capstones')}
            >
              <span className="app-more-sheet__item-icon">
                <FolderKanban size={18} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span className="app-more-sheet__item-copy">
                <strong>Proyectos</strong>
                <span>Entregables prácticos por módulo y área</span>
              </span>
            </button>

            <button
              type="button"
              className={`app-more-sheet__item ${
                viewMode === 'settings' ? 'is-active' : ''
              }`.trim()}
              onClick={() => handleSelectNav('settings')}
            >
              <span className="app-more-sheet__item-icon">
                <Settings size={18} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span className="app-more-sheet__item-copy">
                <strong>Ajustes</strong>
                <span>Tema, densidad, escala, modelos IA y respaldo</span>
              </span>
            </button>
          </div>

          <div className="app-more-sheet__theme">
            <span className="app-more-sheet__section-title">Tema</span>
            <div
              className="app-more-sheet__theme-grid"
              role="group"
              aria-label="Selector de tema"
            >
              {THEME_OPTIONS.map(({ id, label, Icon }) => {
                const active = prefs.theme === id;
                return (
                  <button
                    key={id}
                    type="button"
                    className={`app-more-sheet__theme-btn ${
                      active ? 'is-active' : ''
                    }`.trim()}
                    onClick={() => handleSelectTheme(id)}
                    aria-pressed={active}
                  >
                    <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Sheet>

      {tutorOpen && tutorPanel && (
        <>
          <div
            className="tutor-backdrop"
            onClick={onToggleTutor}
            aria-hidden="true"
          />
          <aside className="tutor-panel-slot" aria-label="Tutor IA">
            {tutorPanel}
          </aside>
        </>
      )}
    </div>
  );
}

export default AppShell;
