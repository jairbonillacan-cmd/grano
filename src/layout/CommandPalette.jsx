// Paleta de comandos global (Ctrl+K) con búsqueda agrupada de acciones, lecciones, módulos y glosario.
// Soporta navegación completa por teclado (ArrowUp, ArrowDown, Home, End, Enter, Escape) y atributos ARIA combobox/listbox.
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Search,
  BookOpen,
  Compass,
  Layers,
  MessageSquare,
  Settings,
  SunMoon,
  SlidersHorizontal,
  Download,
  RotateCcw,
  Terminal,
  Repeat,
  BarChart3,
  FolderKanban,
  Home,
} from 'lucide-react';
import { Button, Chip, Kbd } from '../components/ui/index.js';
import { MODULES } from '../data/catalog/modules.js';
import { LESSONS as CATALOG_LESSONS } from '../data/lessons/index.js';
import { GLOSSARY_TERMS } from '../data/glossary.js';

const TRACK_LABELS = {
  core: 'Tronco común',
  de: 'DE',
  da: 'DA',
  bi: 'BI',
};

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function CommandPalette({
  isOpen = false,
  query = '',
  onChangeQuery = () => {},
  onClose = () => {},
  lessons = CATALOG_LESSONS,
  modules = MODULES,
  glossary = GLOSSARY_TERMS,
  completedIds = [],
  theme = 'light',
  density = 'auto',
  scale = 1,
  onSelectLesson = () => {},
  onSelectModule = () => {},
  onSelectGlossary = () => {},
  onNavigate = () => {},
  onToggleTheme = () => {},
  onCycleDensity = () => {},
  onResetScale = () => {},
  onExportProgress = () => {},
  onAskTutor = () => {},
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const itemRefs = useRef([]);
  const listboxId = useId();

  const safeLessons = Array.isArray(lessons) && lessons.length > 0 ? lessons : CATALOG_LESSONS;
  const safeModules = Array.isArray(modules) && modules.length > 0 ? modules : MODULES;
  const safeGlossary = Array.isArray(glossary) && glossary.length > 0 ? glossary : GLOSSARY_TERMS;

  const normalizedQuery = useMemo(() => normalizeText(query), [query]);

  const actionsList = useMemo(() => {
    const nextThemeLabel = theme === 'dark' ? 'claro' : 'oscuro';
    const nextDensityLabel =
      density === 'compact' ? 'cómoda' : density === 'comfortable' ? 'automática' : 'compacta';

    const allActions = [
      {
        id: 'act-theme',
        title: 'Cambiar tema',
        subtitle: `Alternar a modo ${nextThemeLabel}`,
        badge: theme === 'dark' ? 'Oscuro' : 'Claro',
        Icon: SunMoon,
        keywords: 'cambiar tema modo claro oscuro apariencia color',
        onExecute: () => {
          onToggleTheme();
          onClose();
        },
      },
      {
        id: 'act-settings',
        title: 'Ir a ajustes',
        subtitle: 'Configurar área, densidad, escala, modelos IA y datos',
        badge: 'Vista',
        Icon: Settings,
        keywords: 'ir a ajustes configuracion preferencias opciones escala tema ia',
        onExecute: () => {
          onNavigate('settings');
          onClose();
        },
      },
      {
        id: 'act-tutor',
        title: 'Preguntar al tutor',
        subtitle: 'Abrir el panel del tutor IA en la lección actual',
        badge: 'Tutor IA',
        Icon: MessageSquare,
        keywords: 'preguntar al tutor ia consulta ayuda duda',
        onExecute: () => {
          onAskTutor();
          onClose();
        },
      },
      {
        id: 'act-density',
        title: 'Cambiar densidad',
        subtitle: `Pasar a densidad ${nextDensityLabel}`,
        badge: density === 'compact' ? 'Compacta' : density === 'comfortable' ? 'Cómoda' : 'Auto',
        Icon: SlidersHorizontal,
        keywords: 'cambiar densidad compacta comoda automatica espaciado',
        onExecute: () => {
          onCycleDensity();
          onClose();
        },
      },
      {
        id: 'act-scale-reset',
        title: 'Restablecer escala (100 %)',
        subtitle: `Escala actual: ${Math.round((Number(scale) || 1) * 100)} % · Atajo Ctrl+0`,
        badge: 'Ctrl+0',
        Icon: RotateCcw,
        keywords: 'restablecer escala tamano 100 zoom interfaz ctrl 0',
        onExecute: () => {
          onResetScale();
          onClose();
        },
      },
      {
        id: 'act-export',
        title: 'Exportar progreso',
        subtitle: 'Descargar respaldo local en archivo JSON',
        badge: 'JSON',
        Icon: Download,
        keywords: 'exportar progreso respaldo descargar json guardar',
        onExecute: () => {
          onExportProgress();
          onClose();
        },
      },
      {
        id: 'act-nav-home',
        title: 'Ir a Hoy',
        subtitle: 'Resumen diario, lección en curso y repaso pendiente',
        badge: 'Navegar',
        Icon: Home,
        keywords: 'ir a hoy inicio resumen principal',
        onExecute: () => {
          onNavigate('home');
          onClose();
        },
      },
      {
        id: 'act-nav-roadmap',
        title: 'Ir a Ruta',
        subtitle: 'Ver niveles, módulos y progreso por área',
        badge: 'Navegar',
        Icon: Compass,
        keywords: 'ir a ruta temario niveles modulos camino',
        onExecute: () => {
          onNavigate('roadmap');
          onClose();
        },
      },
      {
        id: 'act-nav-practice',
        title: 'Ir a Práctica',
        subtitle: 'Laboratorio SQL y ejercicios interactivos',
        badge: 'Navegar',
        Icon: Terminal,
        keywords: 'ir a practica sql laboratorio ejercicios duckdb',
        onExecute: () => {
          onNavigate('practice');
          onClose();
        },
      },
      {
        id: 'act-nav-review',
        title: 'Ir a Repaso',
        subtitle: 'Tarjetas de memoria espaciada (FSRS)',
        badge: 'Navegar',
        Icon: Repeat,
        keywords: 'ir a repaso tarjetas flashcards memoria fsrs',
        onExecute: () => {
          onNavigate('review');
          onClose();
        },
      },
      {
        id: 'act-nav-glossary',
        title: 'Ir a Glosario',
        subtitle: 'Definiciones técnicas y relaciones por área',
        badge: 'Navegar',
        Icon: BookOpen,
        keywords: 'ir a glosario definiciones terminos diccionario',
        onExecute: () => {
          onNavigate('glossary');
          onClose();
        },
      },
      {
        id: 'act-nav-analytics',
        title: 'Ir a Progreso',
        subtitle: 'Estadísticas de avance y horas de estudio',
        badge: 'Navegar',
        Icon: BarChart3,
        keywords: 'ir a progreso estadisticas metricas avance',
        onExecute: () => {
          onNavigate('analytics');
          onClose();
        },
      },
      {
        id: 'act-nav-projects',
        title: 'Ir a Proyectos',
        subtitle: 'Entregables prácticos por módulo y área',
        badge: 'Navegar',
        Icon: FolderKanban,
        keywords: 'ir a proyectos capstones entregables portafolio',
        onExecute: () => {
          onNavigate('capstones');
          onClose();
        },
      },
    ];

    if (!normalizedQuery) {
      return allActions.slice(0, 4);
    }

    return allActions.filter((action) => {
      const haystack = normalizeText(
        `${action.title} ${action.subtitle} ${action.keywords}`
      );
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, theme, density, scale, onToggleTheme, onNavigate, onAskTutor, onCycleDensity, onResetScale, onExportProgress, onClose]);

  const filteredLessons = useMemo(() => {
    if (!normalizedQuery) {
      return safeLessons.slice(0, 8);
    }
    return safeLessons.filter((lesson) => {
      const haystack = normalizeText(
        `${lesson.order || ''} ${lesson.title || ''} ${lesson.subtitle || ''} ${lesson.goal || ''} ${lesson.id || ''} ${lesson.moduleId || ''}`
      );
      return haystack.includes(normalizedQuery);
    });
  }, [safeLessons, normalizedQuery]);

  const filteredModules = useMemo(() => {
    if (!normalizedQuery) {
      return safeModules.slice(0, 6);
    }
    return safeModules.filter((mod) => {
      const trackLabel = TRACK_LABELS[mod.track] || mod.track || '';
      const haystack = normalizeText(
        `${mod.id || ''} ${mod.title || ''} ${mod.goal || ''} ${trackLabel} nivel ${mod.level ?? ''}`
      );
      return haystack.includes(normalizedQuery);
    });
  }, [safeModules, normalizedQuery]);

  const filteredGlossary = useMemo(() => {
    if (!normalizedQuery) {
      return safeGlossary.slice(0, 6);
    }
    return safeGlossary.filter((concept) => {
      const haystack = normalizeText(
        `${concept.term || ''} ${concept.definition || ''} ${concept.plainDefinition || ''} ${concept.englishTerm || ''} ${concept.track || ''} ${concept.primaryRole || ''}`
      );
      return haystack.includes(normalizedQuery);
    });
  }, [safeGlossary, normalizedQuery]);

  const groupedSections = useMemo(() => {
    const groups = [];

    if (actionsList.length > 0) {
      groups.push({
        id: 'actions',
        label: `Acciones (${actionsList.length})`,
        items: actionsList.map((act) => ({
          key: `action-${act.id}`,
          type: 'action',
          title: act.title,
          subtitle: act.subtitle,
          badge: act.badge,
          badgeTone: 'neutral',
          Icon: act.Icon,
          onSelect: act.onExecute,
        })),
      });
    }

    if (filteredLessons.length > 0) {
      groups.push({
        id: 'lessons',
        label: `Lecciones (${filteredLessons.length})`,
        items: filteredLessons.map((lesson) => {
          const isDone =
            completedIds.includes(lesson.id) ||
            (lesson.v2Id && completedIds.includes(lesson.v2Id));
          const orderPrefix = lesson.order
            ? `${String(lesson.order).padStart(2, '0')}. `
            : '';
          const durationLabel = lesson.minutes
            ? `${lesson.minutes} min`
            : lesson.duration || '25 min';
          return {
            key: `lesson-${lesson.id}`,
            type: 'lesson',
            title: `${orderPrefix}${lesson.title}`,
            subtitle: lesson.subtitle || lesson.goal || lesson.moduleId || '',
            badge: isDone ? 'Completada' : durationLabel,
            badgeTone: isDone ? 'ok' : 'neutral',
            Icon: BookOpen,
            onSelect: () => {
              onSelectLesson(lesson.id);
              onClose();
            },
          };
        }),
      });
    }

    if (filteredModules.length > 0) {
      groups.push({
        id: 'modules',
        label: `Módulos (${filteredModules.length})`,
        items: filteredModules.map((mod) => {
          const trackLabel = TRACK_LABELS[mod.track] || String(mod.track || '').toUpperCase();
          const count = Array.isArray(mod.lessons) ? mod.lessons.length : 0;
          return {
            key: `module-${mod.id}`,
            type: 'module',
            title: mod.title,
            subtitle: `Nivel ${mod.level} · ${trackLabel} · ${count} lecciones — ${mod.goal}`,
            badge: trackLabel,
            badgeTone: 'neutral',
            Icon: Layers,
            onSelect: () => {
              onSelectModule(mod);
              onClose();
            },
          };
        }),
      });
    }

    if (filteredGlossary.length > 0) {
      groups.push({
        id: 'glossary',
        label: `Glosario (${filteredGlossary.length})`,
        items: filteredGlossary.map((concept) => {
          const rawDef = concept.definition || concept.plainDefinition || '';
          const snippet = rawDef.length > 110 ? `${rawDef.slice(0, 108)}…` : rawDef;
          const badge =
            concept.primaryRole ||
            TRACK_LABELS[concept.track] ||
            'Glosario';
          return {
            key: `glossary-${concept.id || concept.term}`,
            type: 'glossary',
            title: concept.term,
            subtitle: snippet,
            badge,
            badgeTone: 'neutral',
            Icon: BookOpen,
            onSelect: () => {
              onSelectGlossary(concept);
              onClose();
            },
          };
        }),
      });
    }

    return groups;
  }, [
    actionsList,
    filteredLessons,
    filteredModules,
    filteredGlossary,
    completedIds,
    onSelectLesson,
    onSelectModule,
    onSelectGlossary,
    onClose,
  ]);

  const flatItems = useMemo(
    () => groupedSections.flatMap((group) => group.items),
    [groupedSections]
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [normalizedQuery, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const raf = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(raf);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const activeEl = itemRefs.current[activeIndex];
    if (activeEl && typeof activeEl.scrollIntoView === 'function') {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, isOpen]);

  if (!isOpen) return null;

  const safeActiveIndex =
    flatItems.length > 0
      ? Math.min(Math.max(0, activeIndex), flatItems.length - 1)
      : -1;

  const activeOptionId =
    safeActiveIndex >= 0 && flatItems[safeActiveIndex]
      ? `${listboxId}-opt-${safeActiveIndex}`
      : undefined;

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }

    if (flatItems.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % flatItems.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
      return;
    }

    if (event.key === 'Home' && event.ctrlKey) {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }

    if (event.key === 'End' && event.ctrlKey) {
      event.preventDefault();
      setActiveIndex(flatItems.length - 1);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const target = flatItems[safeActiveIndex];
      if (target && typeof target.onSelect === 'function') {
        target.onSelect();
      }
    }
  };

  let runningIndex = -1;

  return (
    <div
      className="cmd-palette-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Paleta de comandos y buscador global"
      onKeyDown={handleKeyDown}
    >
      <div
        className="cmd-palette-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cmd-palette-header">
          <Search size={16} aria-hidden="true" className="cmd-palette-search-icon" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listboxId}
            aria-activedescendant={activeOptionId}
            aria-autocomplete="list"
            className="cmd-palette-input"
            placeholder="Buscar lecciones, módulos, glosario o acciones..."
            value={query}
            onChange={(e) => onChangeQuery(e.target.value)}
            aria-label="Buscar lecciones, módulos, términos del glosario o acciones"
          />
          <Button variant="ghost" size="sm" onClick={onClose} ariaLabel="Cerrar buscador (Escape)">
            <Kbd>Esc</Kbd>
          </Button>
        </div>

        <div
          id={listboxId}
          role="listbox"
          aria-label="Resultados de búsqueda"
          className="cmd-palette-list"
        >
          {groupedSections.map((group) => (
            <div key={group.id} className="cmd-palette-group" role="group" aria-label={group.label}>
              <div className="cmd-palette-section-label tabular">
                {group.label}
              </div>
              {group.items.map((item) => {
                runningIndex += 1;
                const itemIndex = runningIndex;
                const isSelected = itemIndex === safeActiveIndex;
                const ItemIcon = item.Icon || BookOpen;

                return (
                  <button
                    key={item.key}
                    id={`${listboxId}-opt-${itemIndex}`}
                    ref={(el) => {
                      itemRefs.current[itemIndex] = el;
                    }}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`cmd-palette-item ${isSelected ? 'is-active' : ''}`.trim()}
                    onMouseEnter={() => setActiveIndex(itemIndex)}
                    onClick={() => item.onSelect()}
                  >
                    <span className="cmd-palette-item__main">
                      <span className="cmd-palette-item__icon" aria-hidden="true">
                        <ItemIcon size={16} strokeWidth={1.75} />
                      </span>
                      <span className="cmd-palette-item__copy">
                        <strong className="cmd-palette-item__title tabular">
                          {item.title}
                        </strong>
                        {item.subtitle && (
                          <span className="cmd-palette-item__sub">
                            {item.subtitle}
                          </span>
                        )}
                      </span>
                    </span>
                    <Chip variant={item.badgeTone === 'ok' ? 'ok' : 'neutral'}>
                      {item.badge}
                    </Chip>
                  </button>
                );
              })}
            </div>
          ))}

          {flatItems.length === 0 && (
            <div className="cmd-palette-empty">
              No se encontraron lecciones, módulos, términos ni acciones para «{query}».
            </div>
          )}
        </div>

        <div className="cmd-palette-footer">
          <span className="cmd-palette-footer__hint">
            <Kbd>↑</Kbd> <Kbd>↓</Kbd> navegar
          </span>
          <span className="cmd-palette-footer__hint">
            <Kbd>Enter</Kbd> abrir
          </span>
          <span className="cmd-palette-footer__hint">
            <Kbd>Esc</Kbd> cerrar
          </span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
