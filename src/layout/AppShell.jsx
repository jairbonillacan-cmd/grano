import React, { useState, useEffect, useMemo } from 'react';
import {
  Home,
  Compass,
  Repeat,
  FolderKanban,
  BookOpen,
  BarChart3,
  Search,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  Monitor,
  Sparkles,
} from 'lucide-react';
import {
  Button,
  ProgressRing,
  Kbd,
  BrandLogo,
  Tooltip,
  Sheet,
} from '../components/ui/index.js';

export const SIDEBAR_NAV_ITEMS = [
  { id: 'home', label: 'Hoy', Icon: Home },
  { id: 'roadmap', label: 'Ruta', Icon: Compass },
  { id: 'practice', label: 'Repaso', Icon: Repeat },
  { id: 'capstones', label: 'Proyectos', Icon: FolderKanban },
  { id: 'glossary', label: 'Glosario', Icon: BookOpen },
  { id: 'analytics', label: 'Mi progreso', Icon: BarChart3 },
];

export const BOTTOM_TAB_ITEMS = [
  { id: 'home', label: 'Hoy', Icon: Home },
  { id: 'roadmap', label: 'Ruta', Icon: Compass },
  { id: 'practice', label: 'Repaso', Icon: Repeat },
  { id: 'capstones', label: 'Proyectos', Icon: FolderKanban },
  { id: 'more', label: 'Más', Icon: MoreHorizontal },
];

// Tamaño de la interfaz: se aplica con data-scale en <html> (ver tokens.css).
const SCALE_OPTIONS = [
  { id: 'auto', label: 'Auto' },
  { id: '0.8', label: '80 %' },
  { id: '0.9', label: '90 %' },
  { id: '1', label: '100 %' },
  { id: '1.1', label: '110 %' },
  { id: '1.25', label: '125 %' },
];
const SCALE_KEY = 'grano_ui_scale';

function readInitialScale() {
  try {
    const saved = window.localStorage.getItem(SCALE_KEY);
    if (SCALE_OPTIONS.some((o) => o.id === saved)) return saved;
  } catch {
    // ignore storage errors
  }
  return 'auto';
}

const THEME_OPTIONS = [
  { id: 'light', label: 'Claro', Icon: Sun },
  { id: 'dark', label: 'Oscuro', Icon: Moon },
  { id: 'system', label: 'Sistema', Icon: Monitor },
];

function useViewportWidth() {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1440
  );

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
}

function readInitialThemePreference(themeProp) {
  try {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('manual_datos_theme');
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    }
  } catch {
    // ignore storage errors
  }
  if (themeProp === 'dark' || themeProp === 'light') return themeProp;
  return 'system';
}

function hasSavedLessonProgress() {
  try {
    if (typeof window === 'undefined') return false;
    const raw = window.localStorage.getItem('manual_datos_lesson_step');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return false;
    return Object.keys(parsed).some(
      (k) => k !== 'lastLessonId' && k !== 'activeLessonId'
    );
  } catch {
    return false;
  }
}

export function AppShell({
  viewMode = 'home',
  onNavigate = () => {},
  completedIds = [],
  totalLessons = 18,
  dueCardsCount = 0,
  tutorOpen = false,
  onToggleTutor = () => {},
  onOpenCommandPalette = () => {},
  theme = 'light',
  onThemeChange,
  tutorPanel = null,
  children,
}) {
  const viewportWidth = useViewportWidth();
  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth >= 768 && viewportWidth < 1024;
  const isDesktop = viewportWidth >= 1024;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const w = window.innerWidth;
    if (w >= 768 && w < 1024) return true;
    if (w >= 1280 && viewMode === 'lesson') return true;
    return false;
  });

  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [themePreference, setThemePreference] = useState(() =>
    readInitialThemePreference(theme)
  );
  const [syncedDueCount, setSyncedDueCount] = useState(null);

  const [uiScale, setUiScale] = useState(readInitialScale);

  useEffect(() => {
    document.documentElement.dataset.scale = uiScale;
    try {
      window.localStorage.setItem(SCALE_KEY, uiScale);
    } catch {
      // ignore storage errors
    }
  }, [uiScale]);

  // El tema real lo decide App (p. ej. ?theme=dark); el selector debe reflejarlo.
  useEffect(() => {
    setThemePreference((prev) => (prev === 'system' ? prev : theme));
  }, [theme]);

  useEffect(() => {
    if (viewportWidth >= 768 && viewportWidth < 1024) {
      setSidebarCollapsed(true);
    } else if (viewportWidth >= 1280 && viewMode === 'lesson') {
      setSidebarCollapsed(true);
    } else if (viewportWidth >= 1024 && viewMode !== 'lesson') {
      setSidebarCollapsed(false);
    }
  }, [viewportWidth, viewMode]);

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

  const handleSelectTheme = (nextMode) => {
    setThemePreference(nextMode);
    if (nextMode === 'light' || nextMode === 'dark') {
      if (typeof onThemeChange === 'function') {
        onThemeChange(nextMode);
      }
      if (typeof document !== 'undefined') {
        document.documentElement.dataset.theme = nextMode;
      }
    } else if (typeof document !== 'undefined') {
      delete document.documentElement.dataset.theme;
    }
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('manual_datos_theme', nextMode);
      }
    } catch {
      // ignore storage errors
    }
  };

  const completedCount = Array.isArray(completedIds) ? completedIds.length : 0;
  const safeTotal = Math.max(1, Number(totalLessons) || 18);
  const progressPct = Math.round((completedCount / safeTotal) * 100);

  const effectiveDueCount = useMemo(() => {
    if (typeof syncedDueCount === 'number') {
      return syncedDueCount;
    }
    const rawCount = Math.max(0, Number(dueCardsCount) || 0);
    if (rawCount === 24 && completedCount === 0 && !hasSavedLessonProgress()) {
      return 0;
    }
    return rawCount;
  }, [syncedDueCount, dueCardsCount, completedCount]);

  const isEffectiveCollapsed = isTablet ? sidebarCollapsed : sidebarCollapsed;

  const handleSelectNav = (targetView) => {
    setMoreSheetOpen(false);
    onNavigate(targetView);
  };

  const handleBottomTabClick = (tabId) => {
    if (tabId === 'more') {
      setMoreSheetOpen(true);
      return;
    }
    handleSelectNav(tabId);
  };

  const hideBottomBar = viewMode === 'lesson';

  return (
    <div className={`app-shell ${hideBottomBar ? 'app-shell--lesson-focus' : ''}`.trim()}>
      <div className="app-layout">
        <aside
          className={`app-sidebar ${
            isEffectiveCollapsed ? 'app-sidebar--collapsed' : ''
          }`.trim()}
          aria-label="Navegación principal"
        >
          <div className="app-sidebar__top">
            <div className="app-sidebar__brand-row">
              <button
                type="button"
                className="app-sidebar__brand"
                onClick={() => handleSelectNav('home')}
                aria-label="Grano — Ir a Hoy"
              >
                <BrandLogo collapsed={isEffectiveCollapsed} />
              </button>
            </div>

            <nav className="app-sidebar__nav" aria-label="Secciones del manual">
              {SIDEBAR_NAV_ITEMS.map(({ id, label, Icon }) => {
                const isActive =
                  viewMode === id || (id === 'roadmap' && viewMode === 'lesson');
                const showDueBadge = id === 'practice' && effectiveDueCount > 0;
                const tooltipText = showDueBadge
                  ? `${label} (${effectiveDueCount} vencidas)`
                  : label;

                const navButton = (
                  <button
                    key={id}
                    type="button"
                    className={`app-sidebar__item ${
                      isActive ? 'app-sidebar__item--active' : ''
                    }`.trim()}
                    onClick={() => handleSelectNav(id)}
                    aria-current={viewMode === id ? 'page' : undefined}
                    aria-label={
                      showDueBadge
                        ? `${label} (${effectiveDueCount} tarjetas vencidas)`
                        : label
                    }
                  >
                    <span className="app-sidebar__item-main">
                      <Icon size={20} aria-hidden="true" className="app-sidebar__item-icon" />
                      {!isEffectiveCollapsed && (
                        <span className="app-sidebar__item-label">{label}</span>
                      )}
                    </span>

                    {!isEffectiveCollapsed && showDueBadge && (
                      <span className="app-sidebar__badge tabular">
                        {effectiveDueCount}
                      </span>
                    )}

                    {isEffectiveCollapsed && showDueBadge && (
                      <span
                        className="app-sidebar__badge-dot tabular"
                        aria-hidden="true"
                      >
                        {effectiveDueCount}
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
                      {navButton}
                    </Tooltip>
                  );
                }

                return navButton;
              })}
            </nav>
          </div>

          <div className="app-sidebar__footer">
            <div
              className={`app-sidebar__progress-card ${
                isEffectiveCollapsed ? 'app-sidebar__progress-card--collapsed' : ''
              }`.trim()}
            >
              <ProgressRing
                size={38}
                value={progressPct}
                label={`${progressPct}%`}
                tone={completedCount === safeTotal ? 'success' : 'primary'}
                ariaLabel={`Progreso global: ${completedCount} de ${safeTotal} lecciones completadas`}
              />
              {!isEffectiveCollapsed && (
                <div className="app-sidebar__progress-copy">
                  <span className="app-sidebar__progress-title tabular">
                    {completedCount} de {safeTotal} lecciones
                  </span>
                  <span className="app-sidebar__progress-sub">
                    {completedCount === safeTotal
                      ? 'Ruta completada'
                      : 'Progreso acumulado'}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              className="app-sidebar__collapse-btn"
              onClick={() => setSidebarCollapsed((c) => !c)}
              aria-label={
                isEffectiveCollapsed
                  ? 'Expandir barra lateral'
                  : 'Colapsar barra lateral'
              }
              title={
                isEffectiveCollapsed
                  ? 'Expandir barra lateral'
                  : 'Colapsar barra lateral'
              }
            >
              {isEffectiveCollapsed ? (
                <PanelLeftOpen size={18} aria-hidden="true" />
              ) : (
                <>
                  <PanelLeftClose size={18} aria-hidden="true" />
                  <span>Colapsar</span>
                </>
              )}
            </button>
          </div>
        </aside>

        <div className="app-workspace">
          <header className="app-topbar">
            <div className="app-topbar__left">
              <button
                type="button"
                className="app-topbar__brand"
                onClick={() => handleSelectNav('home')}
                aria-label="Grano — Ir a Hoy"
              >
                <BrandLogo />
              </button>

              {isDesktop && (
                <button
                  type="button"
                  className="app-topbar__search-full"
                  onClick={onOpenCommandPalette}
                  aria-label="Buscar lección o término del glosario (Ctrl+K)"
                >
                  <span className="app-topbar__search-lead">
                    <Search size={18} aria-hidden="true" />
                    <span>Buscar lecciones o glosario...</span>
                  </span>
                  <Kbd>Ctrl+K</Kbd>
                </button>
              )}

              {!isDesktop && !isMobile && (
                <button
                  type="button"
                  className="app-topbar__search-icon"
                  onClick={onOpenCommandPalette}
                  aria-label="Buscar lección o término del glosario (Ctrl+K)"
                >
                  <Search size={20} aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="app-topbar__right">
              {isMobile && (
                <button
                  type="button"
                  className="app-topbar__search-icon"
                  onClick={onOpenCommandPalette}
                  aria-label="Buscar lección o término del glosario"
                >
                  <Search size={20} aria-hidden="true" />
                </button>
              )}

              {!isMobile && (
                <label className="app-scale-select" title="Tamaño de la interfaz">
                  <span className="app-scale-select__label">Tamaño</span>
                  <select
                    value={uiScale}
                    onChange={(e) => setUiScale(e.target.value)}
                    aria-label="Tamaño de la interfaz"
                  >
                    {SCALE_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {!isMobile && (
                <div
                  className="app-theme-switch"
                  role="group"
                  aria-label="Selector de tema"
                >
                  {THEME_OPTIONS.map(({ id, label, Icon }) => {
                    const active = themePreference === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        className={`app-theme-switch__btn ${
                          active ? 'is-active' : ''
                        }`.trim()}
                        onClick={() => handleSelectTheme(id)}
                        aria-pressed={active}
                        aria-label={`Tema ${label}`}
                        title={`Tema ${label}`}
                      >
                        <Icon size={16} aria-hidden="true" />
                        <span className="app-theme-switch__label">{label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <ProgressRing
                size={isMobile ? 36 : 40}
                value={progressPct}
                label={`${completedCount}/${safeTotal}`}
                tone={completedCount === safeTotal ? 'success' : 'primary'}
                ariaLabel={`Progreso global: ${completedCount} de ${safeTotal} lecciones completadas`}
              />

              {!isMobile && (
                <Button
                  variant={tutorOpen ? 'primary' : 'secondary'}
                  size="md"
                  className="app-topbar__tutor-btn"
                  onClick={onToggleTutor}
                  aria-expanded={tutorOpen}
                  ariaLabel="Alternar panel de Tutor IA"
                  icon={Sparkles}
                >
                  Tutor IA
                </Button>
              )}
            </div>
          </header>

          <main className="app-main">
            <div className="app-main__inner">{children}</div>
          </main>
        </div>
      </div>

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
                  viewMode === 'analytics'
                : viewMode === id;
            const showDueBadge = id === 'practice' && effectiveDueCount > 0;

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
                    ? `${label} (${effectiveDueCount} tarjetas vencidas)`
                    : label
                }
              >
                <span className="app-bottom-nav__icon-wrap">
                  <Icon size={20} aria-hidden="true" />
                  {showDueBadge && (
                    <span
                      className="app-bottom-nav__badge tabular"
                      aria-hidden="true"
                    >
                      {effectiveDueCount}
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
        title="Más opciones"
        subtitle="Recursos adicionales, progreso y apariencia"
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
                <BookOpen size={20} aria-hidden="true" />
              </span>
              <span className="app-more-sheet__item-copy">
                <strong>Glosario</strong>
                <span>Conceptos clave y grafo de relaciones</span>
              </span>
            </button>

            <button
              type="button"
              className={`app-more-sheet__item ${
                viewMode === 'analytics' ? 'is-active' : ''
              }`.trim()}
              onClick={() => handleSelectNav('analytics')}
            >
              <span className="app-more-sheet__item-icon">
                <BarChart3 size={20} aria-hidden="true" />
              </span>
              <span className="app-more-sheet__item-copy">
                <strong>Mi progreso</strong>
                <span>Métricas de dominio por etapa y rol</span>
              </span>
            </button>

            <button
              type="button"
              className={`app-more-sheet__item ${
                tutorOpen ? 'is-active' : ''
              }`.trim()}
              onClick={() => {
                setMoreSheetOpen(false);
                onToggleTutor();
              }}
            >
              <span className="app-more-sheet__item-icon">
                <Sparkles size={20} aria-hidden="true" />
              </span>
              <span className="app-more-sheet__item-copy">
                <strong>Tutor IA</strong>
                <span>Consultas contextuales sobre la lección</span>
              </span>
            </button>
          </div>

          <div className="app-more-sheet__theme">
            <span className="app-more-sheet__section-title">Apariencia</span>
            <div
              className="app-more-sheet__theme-grid"
              role="group"
              aria-label="Selector de tema"
            >
              {THEME_OPTIONS.map(({ id, label, Icon }) => {
                const active = themePreference === id;
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
                    <Icon size={18} aria-hidden="true" />
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
