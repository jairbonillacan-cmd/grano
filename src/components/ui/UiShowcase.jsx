// Catálogo interactivo de componentes base (?ui=1) con controles de tema, densidad y escala tipográfica.
// Muestra todas las variantes, tamaños y estados accesibles del sistema de diseño Grano.
import React, { useEffect, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  Code2,
  Copy,
  Database,
  Download,
  Filter,
  FolderGit2,
  Layers,
  MoreHorizontal,
  Play,
  RefreshCw,
  Search,
  Settings,
  Sliders,
  Terminal,
  Trash2,
} from 'lucide-react'
import Button from './Button.jsx'
import IconButton from './IconButton.jsx'
import Chip from './Chip.jsx'
import Card from './Card.jsx'
import ProgressBar from './ProgressBar.jsx'
import Stepper from './Stepper.jsx'
import Tabs from './Tabs.jsx'
import Segmented from './Segmented.jsx'
import Tooltip from './Tooltip.jsx'
import Toast, { ToastStack } from './Toast.jsx'
import Sheet, { Drawer } from './Sheet.jsx'
import Dialog from './Dialog.jsx'
import Menu from './Menu.jsx'
import Kbd from './Kbd.jsx'
import Skeleton from './Skeleton.jsx'
import Callout from './Callout.jsx'
import AnswerOption from './AnswerOption.jsx'
import EmptyState from './EmptyState.jsx'

export function UiShowcase() {
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'light'
  )
  const [density, setDensity] = useState(
    () => document.documentElement.getAttribute('data-density') || 'comfortable'
  )
  const [scale, setScale] = useState(
    () => document.documentElement.getAttribute('data-scale') || '1'
  )

  const [isLoadingDemo, setIsLoadingDemo] = useState(true)
  const [selectedTrack, setSelectedTrack] = useState('de')
  const [activeTab, setActiveTab] = useState('sql')
  const [activeSegment, setActiveSegment] = useState('mensual')
  const [stepIdx, setStepIdx] = useState(1)
  const [progressVal, setProgressVal] = useState(67)
  const [selectedAnswer, setSelectedAnswer] = useState(1)
  const [skeletonCycle, setSkeletonCycle] = useState(0)
  const [menuLastAction, setMenuLastAction] = useState('Ninguna')
  const [cardActivations, setCardActivations] = useState(0)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetSide, setSheetSide] = useState('right')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-density', density)
  }, [density])

  useEffect(() => {
    document.documentElement.setAttribute('data-scale', scale)
  }, [scale])

  const pushToast = (tone, title, description) => {
    setToasts((prev) => [
      ...prev.slice(-2),
      {
        id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tone,
        title,
        description,
        duration: 4000,
      },
    ])
  }

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((item) => item.id !== id))
  }

  const openSheetSide = (side) => {
    setSheetSide(side)
    setSheetOpen(true)
  }

  return (
    <div className="ui-showcase" data-testid="ui-showcase">
      <header className="ui-showcase__header">
        <div className="ui-showcase__brand">
          <div className="ui-showcase__eyebrow">
            <Chip track="de">T6 · Componentes base y movimiento</Chip>
            <span className="ui-showcase__meta">Instrumento técnico · Tokens canónicos</span>
          </div>
          <h1 className="ui-showcase__title">Sistema de Componentes Grano</h1>
          <p className="ui-showcase__subtitle">
            Primitivas accesibles con teclado, unidades relativas en rem, indicador deslizante y 6 animaciones con propósito.
          </p>
        </div>

        <div className="ui-showcase__controls" role="region" aria-label="Controles de visualización">
          <div className="ui-showcase__control-group">
            <span className="ui-showcase__control-label">Tema</span>
            <Segmented
              ariaLabel="Selector de tema"
              size="sm"
              value={theme}
              onChange={setTheme}
              options={[
                { id: 'light', label: 'Claro' },
                { id: 'dark', label: 'Oscuro' },
              ]}
            />
          </div>

          <div className="ui-showcase__control-group">
            <span className="ui-showcase__control-label">Densidad</span>
            <Segmented
              ariaLabel="Selector de densidad"
              size="sm"
              value={density}
              onChange={setDensity}
              options={[
                { id: 'comfortable', label: 'Cómoda' },
                { id: 'compact', label: 'Compacta' },
              ]}
            />
          </div>

          <div className="ui-showcase__control-group">
            <span className="ui-showcase__control-label">Escala</span>
            <Segmented
              ariaLabel="Selector de escala tipográfica"
              size="sm"
              value={scale}
              onChange={setScale}
              options={[
                { id: '0.9', label: '90%' },
                { id: '1', label: '100%' },
                { id: '1.1', label: '110%' },
                { id: '1.25', label: '125%' },
              ]}
            />
          </div>
        </div>
      </header>

      <div className="ui-showcase__grid">
        <Card
          title="1. Button e IconButton"
          subtitle="5 variantes, 3 tamaños (28/34/40px) y estado loading sin alterar el ancho"
          actions={
            <Button
              size="sm"
              variant="secondary"
              icon={RefreshCw}
              onClick={() => setIsLoadingDemo((v) => !v)}
              data-testid="toggle-loading-btn"
            >
              {isLoadingDemo ? 'Desactivar carga' : 'Activar carga'}
            </Button>
          }
        >
          <div className="ui-showcase__stack">
            <div className="ui-showcase__row">
              <Button variant="primary" icon={Play}>
                Ejecutar consulta
              </Button>
              <Button variant="secondary" icon={Code2}>
                Ver esquema
              </Button>
              <Button variant="ghost" icon={Sliders}>
                Parámetros
              </Button>
              <Button variant="danger" icon={Trash2}>
                Descartar lote
              </Button>
              <Button variant="link" iconRight={ArrowRight}>
                Documentación técnica
              </Button>
            </div>

            <div className="ui-showcase__row">
              <Button size="sm" variant="secondary">
                Tamaño sm (28px)
              </Button>
              <Button size="md" variant="secondary">
                Tamaño md (34px)
              </Button>
              <Button size="lg" variant="primary" shortcut="Ctrl+Enter">
                Tamaño lg (40px)
              </Button>
              <Button
                size="md"
                variant="primary"
                icon={Database}
                loading={isLoadingDemo}
                data-testid="loading-invariant-btn"
              >
                Validar partición
              </Button>
              <Button size="md" variant="secondary" disabled>
                Deshabilitado
              </Button>
            </div>

            <div className="ui-showcase__row">
              <span className="ui-showcase__inline-label">IconButton (siempre con Tooltip):</span>
              <IconButton
                size="sm"
                variant="ghost"
                icon={Copy}
                label="Copiar consulta SQL"
              />
              <IconButton
                size="md"
                variant="secondary"
                icon={Download}
                label="Exportar resultados CSV"
              />
              <IconButton
                size="lg"
                variant="primary"
                icon={Terminal}
                label="Abrir consola DuckDB"
              />
              <IconButton
                size="md"
                variant="danger"
                icon={Trash2}
                label="Limpiar caché local"
              />
              <IconButton
                size="md"
                variant="secondary"
                icon={RefreshCw}
                loading={isLoadingDemo}
                label="Sincronizando catálogo"
              />
            </div>
          </div>
        </Card>

        <Card
          title="2. Chip, Kbd y Skeleton"
          subtitle="Etiquetas técnicas de 22px con punto de rol (6px), atajos y esqueleto diferido (300ms)"
          actions={
            <Button
              size="sm"
              variant="ghost"
              icon={RefreshCw}
              onClick={() => setSkeletonCycle((c) => c + 1)}
            >
              Probar espera 300ms
            </Button>
          }
        >
          <div className="ui-showcase__stack">
            <div className="ui-showcase__row">
              <Chip>Neutro · SQL</Chip>
              <Chip
                track="de"
                selected={selectedTrack === 'de'}
                onClick={() => setSelectedTrack('de')}
              >
                DE · Ingeniería de Datos
              </Chip>
              <Chip
                track="da"
                selected={selectedTrack === 'da'}
                onClick={() => setSelectedTrack('da')}
              >
                DA · Analítica
              </Chip>
              <Chip
                track="bi"
                selected={selectedTrack === 'bi'}
                onClick={() => setSelectedTrack('bi')}
              >
                BI · Inteligencia de Negocio
              </Chip>
              <Chip icon={Filter} onRemove={() => {}}>
                partición = 2025-Q4
              </Chip>
            </div>

            <div className="ui-showcase__row">
              <span className="ui-showcase__inline-label">Atajos de teclado:</span>
              <Kbd>Ctrl</Kbd>
              <span>+</span>
              <Kbd>Enter</Kbd>
              <span className="ui-showcase__inline-label">Paleta:</span>
              <Kbd>Ctrl</Kbd>
              <span>+</span>
              <Kbd>K</Kbd>
              <span className="ui-showcase__inline-label">Cerrar:</span>
              <Kbd>Esc</Kbd>
              <Tooltip content="Foco visible con anillo de 2px y cierre mediante Escape">
                <Button size="sm" variant="ghost">
                  Pasar o enfocar para Tooltip
                </Button>
              </Tooltip>
            </div>

            <div className="ui-showcase__skeleton-demo">
              <div className="ui-showcase__skeleton-col">
                <span className="ui-showcase__inline-label">Vista inmediata (muestra):</span>
                <Skeleton immediate lines={2} />
              </div>
              <div className="ui-showcase__skeleton-col" key={skeletonCycle}>
                <span className="ui-showcase__inline-label">Diferido (delayMs = 300):</span>
                <Skeleton delayMs={300} lines={2} />
              </div>
            </div>
          </div>
        </Card>

        <Card
          title="3. Tabs y Segmented"
          subtitle="Navegación con flechas (ArrowLeft/ArrowRight/Home/End) e indicador deslizante con transform"
        >
          <div className="ui-showcase__stack">
            <Tabs
              ariaLabel="Secciones del laboratorio"
              value={activeTab}
              onChange={setActiveTab}
              items={[
                { id: 'sql', label: 'Consulta SQL', icon: Terminal, count: 3 },
                { id: 'grain', label: 'Grano y claves', icon: Layers, count: 2 },
                { id: 'lineage', label: 'Linaje DAG', icon: FolderGit2 },
              ]}
            />
            <div className="ui-showcase__tab-panel" role="region" aria-live="polite">
              {activeTab === 'sql' && (
                <span>
                  Panel activo: <strong>Consulta SQL</strong> · Verificación determinista por columnas y filas.
                </span>
              )}
              {activeTab === 'grain' && (
                <span>
                  Panel activo: <strong>Grano y claves</strong> · Una fila por pedido y línea de artículo.
                </span>
              )}
              {activeTab === 'lineage' && (
                <span>
                  Panel activo: <strong>Linaje DAG</strong> · Dependencias entre staging, modelo intermedio y mart.
                </span>
              )}
            </div>

            <div className="ui-showcase__row">
              <span className="ui-showcase__inline-label">Segmented (radiogroup):</span>
              <Segmented
                ariaLabel="Granularidad temporal"
                value={activeSegment}
                onChange={setActiveSegment}
                options={[
                  { id: 'diario', label: 'Diario' },
                  { id: 'semanal', label: 'Semanal' },
                  { id: 'mensual', label: 'Mensual' },
                ]}
              />
              <span className="ui-showcase__meta">Seleccionado: {activeSegment}</span>
            </div>
          </div>
        </Card>

        <Card
          title="4. ProgressBar y Stepper"
          subtitle="Barras sobrias de 2px y 4px en --brand con números tabulares"
          actions={
            <div className="ui-showcase__row">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setProgressVal((v) => Math.max(0, v - 15))}
              >
                -15%
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setProgressVal((v) => Math.min(100, v + 15))}
              >
                +15%
              </Button>
            </div>
          }
        >
          <div className="ui-showcase__stack">
            <ProgressBar
              size="sm"
              value={progressVal}
              max={100}
              label="Grosor 2px (encabezado de lección)"
              showValue
            />
            <ProgressBar
              size="md"
              value={progressVal}
              max={100}
              label="Grosor 4px (progreso de módulo · 12 / 18)"
              showValue
            />
            <Stepper
              steps={[
                { id: 's1', label: 'Contexto' },
                { id: 's2', label: 'Práctica SQL' },
                { id: 's3', label: 'Verificación' },
                { id: 's4', label: 'Cierre' },
              ]}
              currentIndex={stepIdx}
              onStepClick={setStepIdx}
            />
          </div>
        </Card>

        <Card
          title="5. AnswerOption (4 estados)"
          subtitle="Sin anim-pop ni anim-shake: trazo SVG check-draw (260ms) en correct y borde --bad en incorrect"
        >
          <div className="ui-showcase__stack">
            <AnswerOption
              index={0}
              state={selectedAnswer === 0 ? 'selected' : 'neutral'}
              shortcut="1"
              onSelect={() => setSelectedAnswer(0)}
            >
              Neutral / seleccionable: Agrupar por id_cliente antes de unir con la tabla de líneas.
            </AnswerOption>
            <AnswerOption
              index={1}
              state="selected"
              shortcut="2"
              onSelect={() => setSelectedAnswer(1)}
            >
              Seleccionada: Pre-agregar las devoluciones al grano de pedido antes del LEFT JOIN.
            </AnswerOption>
            <AnswerOption
              index={2}
              state="correct"
              shortcut="3"
              explanation="Correcto: preserva la cardinalidad 1:1 con orders y evita duplicar el importe bruto."
            >
              Correcta: Calcular el total por order_id en una CTE y unir por clave primaria.
            </AnswerOption>
            <AnswerOption
              index={3}
              state="incorrect"
              shortcut="4"
              explanation="Incorrecto: unir directamente orders con order_items multiplica las filas del pedido (fan-out)."
            >
              Incorrecta: Unir orders con order_items y sumar orders.shipping_cost directamente.
            </AnswerOption>
          </div>
        </Card>

        <Card
          title="6. Callout (4 tonos) y Toast"
          subtitle="Borde izquierdo de 2px en color semántico, sin fondos saturados"
          actions={
            <div className="ui-showcase__row">
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  pushToast(
                    'ok',
                    'Esquema actualizado',
                    'Tabla dim_clientes sincronizada en el entorno local.'
                  )
                }
              >
                Disparar Toast
              </Button>
            </div>
          }
        >
          <div className="ui-showcase__stack">
            <Callout tone="info" title="Nota de arquitectura (info)">
              El grano de la tabla de hechos define qué representa exactamente cada fila física.
            </Callout>
            <Callout tone="ok" title="Invariante verificado (ok)">
              La clave compuesta (order_id, line_number) no presenta duplicados ni valores nulos.
            </Callout>
            <Callout tone="warn" title="Advertencia de cardinalidad (warn)">
              Un JOIN de muchos a muchos sin agregación previa alterará las sumas aguas abajo.
            </Callout>
            <Callout tone="bad" title="Error de ejecución SQL (bad)">
              Columna ambigua: especifique el alias de tabla para customer_id en la cláusula SELECT.
            </Callout>
            <Toast
              tone="ok"
              duration={0}
              title="Toast: Consulta verificada (4s auto-cierre, pausa en hover)"
              description="12 filas coinciden con el grano esperado de la tabla fct_pedidos."
              onClose={() => {}}
            />
          </div>
        </Card>

        <Card
          title="7. Menu, Dialog, Sheet y Card interactiva"
          subtitle="Superficies modales y menús con navegación por teclado, trampa de foco y cierre con Escape"
        >
          <div className="ui-showcase__stack">
            <div className="ui-showcase__row">
              <Menu
                label="Acciones del lote"
                onSelect={(item) => setMenuLastAction(item.label)}
                items={[
                  { id: 'run', label: 'Ejecutar validación', icon: Play, shortcut: 'Ctrl+R' },
                  { id: 'copy', label: 'Copiar DDL', icon: Copy, shortcut: 'Ctrl+C' },
                  { id: 'export', label: 'Exportar esquema JSON', icon: Download },
                  { divider: true, id: 'd1' },
                  { id: 'delete', label: 'Eliminar partición temporal', icon: Trash2, danger: true },
                ]}
              />
              <Button variant="secondary" onClick={() => setDialogOpen(true)} data-testid="open-dialog-btn">
                Abrir Dialog modal
              </Button>
              <Button variant="secondary" onClick={() => openSheetSide('right')} data-testid="open-sheet-btn">
                Abrir Sheet derecho
              </Button>
              <Button variant="ghost" size="sm" onClick={() => openSheetSide('bottom')}>
                Sheet inferior
              </Button>
            </div>
            <div className="ui-showcase__meta">
              Última acción de menú: <strong>{menuLastAction}</strong> · Activaciones de tarjeta interactiva:{' '}
              <strong>{cardActivations}</strong>
            </div>

            <Card
              interactive
              compact
              onClick={() => setCardActivations((c) => c + 1)}
              title="Tarjeta interactiva enfocable (Enter o Espacio)"
              subtitle="Borde 1px --line que cambia a --line-strong al pasar o enfocar, sin elevación exagerada."
            />
          </div>
        </Card>

        <Card
          title="8. Inputs, Textarea y EmptyState"
          subtitle="Controles de formulario con anillo de foco de 2px y estado vacío sobrio sin ilustración por defecto"
        >
          <div className="ui-showcase__stack">
            <div className="ui-showcase__form-grid">
              <div className="ui-field">
                <label className="ui-label" htmlFor="showcase-input-table">
                  Nombre de tabla destino
                </label>
                <div className="ui-input-wrap">
                  <Search size={14} className="ui-input-icon" aria-hidden="true" />
                  <input
                    id="showcase-input-table"
                    type="text"
                    className="ui-input ui-input--with-icon"
                    defaultValue="fct_pedidos_diarios"
                    placeholder="ej. fct_eventos"
                  />
                </div>
                <span className="ui-hint">Convención recomendada: prefijo fct_ o dim_ en minúsculas.</span>
              </div>

              <div className="ui-field">
                <label className="ui-label" htmlFor="showcase-textarea-sql">
                  Definición de filtro incremental
                </label>
                <textarea
                  id="showcase-textarea-sql"
                  className="ui-textarea"
                  rows={2}
                  defaultValue="WHERE updated_at >= CURRENT_DATE - INTERVAL '7 days'"
                />
              </div>
            </div>

            <div className="ui-showcase__empty-grid">
              <EmptyState
                compact
                title="Sin resultados para este filtro"
                description="Ajusta los criterios de búsqueda o limpia los filtros activos para inspeccionar las lecciones disponibles."
                action={
                  <Button size="sm" variant="secondary" icon={RefreshCw}>
                    Restablecer filtros
                  </Button>
                }
              />
              <EmptyState
                compact
                illustration="data"
                title="Con ilustración técnica opcional (1 línea en --ink-3)"
                description="La ilustración solo se renderiza cuando se solicita explícitamente mediante la prop illustration."
              />
            </div>
          </div>
        </Card>
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Confirmar reconstrucción de tabla"
        description="Esta operación recalculará todas las particiones históricas en el esquema analítico local."
        actions={
          <>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setDialogOpen(false)
                pushToast('info', 'Reconstrucción iniciada', 'Procesando 4 particiones en segundo plano.')
              }}
            >
              Confirmar ejecución
            </Button>
          </>
        }
      >
        <p className="ui-showcase__dialog-copy">
          Tiempo estimado de cómputo: 1.2 s en motor local. Puedes cancelar en cualquier momento con <Kbd>Esc</Kbd>.
        </p>
      </Dialog>

      <Drawer
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        side={sheetSide}
        title="Inspector de metadatos de columna"
        subtitle="Trampa de foco activa (Tab / Shift+Tab) y cierre con Escape"
        footer={
          <div className="ui-showcase__row">
            <Button variant="ghost" onClick={() => setSheetOpen(false)}>
              Cerrar panel
            </Button>
            <Button variant="primary" onClick={() => setSheetOpen(false)}>
              Guardar notas
            </Button>
          </div>
        }
      >
        <div className="ui-showcase__stack">
          <Callout tone="info" title="order_id · BIGINT NOT NULL">
            Clave primaria del pedido verificada frente al catálogo transaccional.
          </Callout>
          <div className="ui-field">
            <label className="ui-label" htmlFor="sheet-note-input">
              Nota de documentación
            </label>
            <input
              id="sheet-note-input"
              type="text"
              className="ui-input"
              defaultValue="Clave natural sin subrogación"
            />
          </div>
        </div>
      </Drawer>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

export default UiShowcase
