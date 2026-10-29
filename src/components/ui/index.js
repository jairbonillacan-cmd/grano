// Punto de entrada de la biblioteca de componentes base de Grano (src/components/ui).
// Exporta primitivas accesibles, utilidades de transición de vista y componentes heredados deprecados.
export {
  STAGE_THEMES,
  ROLE_THEMES,
  STAGE_VARS,
  getStageNumber,
  getStageTheme,
  getRoleMeta,
  resolveStageToken,
  stageStyle,
} from './stageTheme.js'
export { Button } from './Button.jsx'
export { IconButton } from './IconButton.jsx'
export { Badge } from './Badge.jsx'
export { Chip } from './Chip.jsx'
export { Card } from './Card.jsx'
export { ProgressBar } from './ProgressBar.jsx'
export { ProgressRing } from './ProgressRing.jsx'
export { Stepper } from './Stepper.jsx'
export { Tabs } from './Tabs.jsx'
export { Segmented } from './Segmented.jsx'
export { Tooltip } from './Tooltip.jsx'
export { Toast, ToastStack } from './Toast.jsx'
export { Sheet, Drawer } from './Sheet.jsx'
export { Dialog } from './Dialog.jsx'
export { Menu } from './Menu.jsx'
export { Kbd } from './Kbd.jsx'
export { Skeleton } from './Skeleton.jsx'
export { Callout } from './Callout.jsx'
export { AnswerOption } from './AnswerOption.jsx'
export { EmptyState } from './EmptyState.jsx'
export { Illustration, BrandLogo, BrandMark } from './Illustration.jsx'
export { UiShowcase } from './UiShowcase.jsx'
export { withViewTransition } from './viewTransition.js'
