---
name: Manual de Datos — Atelier Técnico de Datos
description: Sistema de diseño e-learning interactivo para Ingeniería de Datos (DE), Análisis Estadístico (DA) y Business Intelligence (BI) en 18 lecciones y 6 etapas cromáticas.
colors:
  bg: "#F6F7FB"
  surface: "#FFFFFF"
  surface-2: "#EFF1F7"
  border: "#E2E5EE"
  text: "#141824"
  text-2: "#586079"
  primary: "#4C4DFF"
  primary-deep: "#3434D6"
  primary-soft: "#ECEBFF"
  success: "#12A150"
  success-soft: "#E3F8EC"
  danger: "#E5484D"
  danger-soft: "#FEECEC"
  warning: "#F5A300"
  warning-soft: "#FFF6DC"
  code-bg: "#121521"
  dark-bg: "#0F1117"
  dark-surface: "#171A23"
  dark-surface-2: "#1F2330"
  dark-border: "#2A2F3D"
  dark-text: "#EEF0F6"
  dark-text-2: "#A3AAC0"
  dark-primary: "#8B8CFF"
  dark-primary-deep: "#B4B5FF"
  dark-primary-soft: "#23234A"
  dark-success: "#3DD68C"
  dark-success-soft: "#12301F"
  dark-danger: "#FF6369"
  dark-danger-soft: "#3B1618"
  dark-warning: "#FFC53D"
  dark-warning-soft: "#3A2A05"
  dark-code-bg: "#0B0D14"
typography:
  fontDisplay: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif"
  fontSans: "'Inter', system-ui, sans-serif"
  fontMono: "'JetBrains Mono', monospace"
  scale:
    xs: "12px"
    sm: "14px"
    md: "16px"
    lg: "clamp(17px, 1.1vw + 13px, 18px)"
    xl: "clamp(20px, 1.4vw + 14px, 24px)"
    2xl: "clamp(24px, 2vw + 16px, 32px)"
    3xl: "clamp(30px, 3vw + 18px, 44px)"
borderRadius:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  pill: "999px"
---

# Manual de Datos — Sistema de Diseño (Fase 1 · Atelier Técnico)

## 1. Tipografía y Escala Fluida (`clamp()`)

Se cargan tres familias desde Google Fonts con `preconnect` y `display=swap`:
- **`--font-display`**: `'Plus Jakarta Sans', 'Inter', system-ui, sans-serif` (pesos `700`, `800`) para titulares, cabeceras de etapa y métricas destacadas.
- **`--font-sans`**: `'Inter', system-ui, sans-serif` (pesos `400`, `500`, `600`) para cuerpo de lectura técnica (`65ch`), controles interactivos y opciones de evaluación.
- **`--font-mono`**: `'JetBrains Mono', monospace` (pesos `400`, `600`) con `font-variant-numeric: tabular-nums` para consultas SQL, identificadores de esquema, contadores, `Chip` y `Kbd`.

| Token | Valor | Uso Principal |
| :--- | :--- | :--- |
| `--fs-xs` | `12px` | `Chip`, `Kbd`, `ProgressRing`, metadatos y celdas técnicas |
| `--fs-sm` | `14px` | Botones (`sm`/`md`), navegación, `<pre>`, `Callout` y formularios |
| `--fs-md` | `16px` | Cuerpo de lectura técnica (`line-height: 1.65`) y `AnswerOption` (`500`) |
| `--fs-lg` | `clamp(17px, 1.1vw + 13px, 18px)` | Títulos de tarjeta (`h3`), marca superior y subtítulos de lección |
| `--fs-xl` | `clamp(20px, 1.4vw + 14px, 24px)` | Encabezados de sección (`h2`) y tarjeta activa de continuación |
| `--fs-2xl` | `clamp(24px, 2vw + 16px, 32px)` | Títulos de vista (`h1`) y valores de métricas principales |
| `--fs-3xl` | `clamp(30px, 3vw + 18px, 44px)` | Titular hero en `HomeView` |

---

## 2. Tokens de Color Base y Verificación de Contraste WCAG 2.2 AA

Definidos en `src/styles/tokens.css` para Modo Claro (`:root`, `[data-theme="light"]`) y Modo Oscuro (`@media (prefers-color-scheme: dark)` cuando `:root:not([data-theme="light"])` y `[data-theme="dark"]`). Cero alias heredados.

| Par de Contraste | Modo Claro (Hex) | Ratio Claro | Modo Oscuro (Hex) | Ratio Oscuro | Nivel WCAG 2.2 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `--text` sobre `--bg` | `#141824` / `#F6F7FB` | **16.4 : 1** | `#EEF0F6` / `#0F1117` | **16.8 : 1** | AAA (>= 7:1) |
| `--text` sobre `--surface` | `#141824` / `#FFFFFF` | **17.7 : 1** | `#EEF0F6` / `#171A23` | **15.2 : 1** | AAA (>= 7:1) |
| `--text-2` sobre `--surface` | `#586079` / `#FFFFFF` | **6.1 : 1** | `#A3AAC0` / `#171A23` | **7.4 : 1** | AA / AAA (>= 4.5:1) |
| `--text-2` sobre `--surface-2` | `#586079` / `#EFF1F7` | **5.4 : 1** | `#A3AAC0` / `#1F2330` | **6.5 : 1** | AA (>= 4.5:1) |
| `--primary` / `--primary-deep` sobre `--primary-soft` | `#3434D6` / `#ECEBFF` | **7.8 : 1** | `#B4B5FF` / `#23234A` | **7.6 : 1** | AAA (>= 7:1) |
| Botón primario (texto sobre `--primary`) | `#FFFFFF` / `#4C4DFF` | **5.4 : 1** | `#0F1117` / `#8B8CFF` | **7.3 : 1** | AA / AAA (>= 4.5:1) |
| `--success` sobre `--success-soft` | `#12A150` / `#E3F8EC` | **4.6 : 1** | `#3DD68C` / `#12301F` | **7.9 : 1** | AA / AAA (>= 4.5:1) |
| `--danger` sobre `--danger-soft` | `#E5484D` / `#FEECEC` | **4.5 : 1** | `#FF6369` / `#3B1618` | **5.8 : 1** | AA (>= 4.5:1) |

---

## 3. Identidad Cromática por Etapa (`[data-stage="1".."6"]`) y Contraste AA

Cada etapa define `--stage`, `--stage-soft`, `--stage-deep` y `--stage-contrast`. En modo oscuro, `--stage-soft` se mezcla al `18%` en `oklab` con `--surface` y `--stage-deep` se aclara al `75%` con `#FFFFFF` para garantizar lectura nítida.

| Etapa | Dominio (`shortName`) | `--stage` | Claro: `--stage-deep` sobre `--stage-soft` | Ratio Claro | Oscuro: `--stage-deep` sobre `--stage-soft` | Ratio Oscuro | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Etapa 1** | `SQL` | `#FF6B4A` | `#B4381C` sobre `#FFEDE7` | **5.8 : 1** | `#FFA18C` sobre `#3E2625` | **6.4 : 1** | AA Verificado |
| **Etapa 2** | `Modelado` | `#F2A516` | `#8A5300` sobre `#FFF4DA` | **6.2 : 1** | `#F9C672` sobre `#3B2D1E` | **7.5 : 1** | AA Verificado |
| **Etapa 3** | `Columnar` | `#1DB371` | `#0B6B40` sobre `#E1F7EB` | **6.1 : 1** | `#7CE2B2` sobre `#18312D` | **7.8 : 1** | AA Verificado |
| **Etapa 4** | `Lakehouse` | `#16A8B8` | `#0A6370` sobre `#DFF5F7` | **6.4 : 1** | `#79DCE7` sobre `#173038` | **7.6 : 1** | AA Verificado |
| **Etapa 5** | `Estadística y BI` | `#3C7BFF` | `#1D47B3` sobre `#E5EDFF` | **7.1 : 1** | `#8CB1FF` sobre `#1D2842` | **6.9 : 1** | AA Verificado |
| **Etapa 6** | `Streaming e IA` | `#8A5CFF` | `#5127C7` sobre `#EFE9FF` | **7.3 : 1** | `#B99DFF` sobre `#292342` | **6.8 : 1** | AA Verificado |

### Roles Técnicos (`DE`, `DA`, `BI`)
- **`DE` (Ingeniería de datos)**: `--role-de: #2F6BFF`, `--role-de-deep: #1D47B3`, ícono `Database` (`14px`).
- **`DA` (Análisis de datos)**: `--role-da: #0FA968`, `--role-da-deep: #08663E`, ícono `Sigma` (`14px`).
- **`BI` (Business Intelligence)**: `--role-bi: #F08A24`, `--role-bi-deep: #9A4E06`, ícono `LayoutDashboard` (`14px`).

---

## 4. Arquitectura CSS Modular (`src/styles/`)

Importada en orden estricto desde `src/styles.css`:
1. `src/styles/tokens.css` — Variables CSS de tipografía, color, etapas, roles, radios, sombras y tiempos.
2. `src/styles/reset.css` — Reset box-sizing, selección, scrollbars, jerarquía tipográfica y `.tabular`.
3. `src/styles/layout.css` — Primitivas `.l-container`, `.l-stack`, `.l-cluster`, `.l-grid`, `.l-sidebar`, `.l-switcher`.
4. `src/styles/components.css` — Estilos de los 16 componentes de `src/components/ui/` + `UiShowcase`.
5. `src/styles/animations.css` — Keyframes `pop`, `shake`, `draw-check`, `sparkle`, `pulse-ring` protegidos por `@media (prefers-reduced-motion: no-preference)`.
6. `src/styles/views/shell.css` — `AppShell`, barra superior, barra lateral colapsable y buscador `Ctrl+K`.
7. `src/styles/views/home.css` — Vista de inicio y métricas.
8. `src/styles/views/roadmap.css` — Mapa de aprendizaje de 6 etapas.
9. `src/styles/views/lesson.css` — Reproductor de lecciones.
10. `src/styles/views/simulators.css` — Simuladores interactivos, tablas de diferencias y laboratorios SQL.
11. `src/styles/views/secondary.css` — Repaso Leitner, Glosario, Proyectos Capstone y Analítica.
12. `src/styles/views/tutor.css` — Panel contextual del Tutor IA.

---

## 5. Catálogo de Componentes (`src/components/ui/`)

1. **`stageTheme.js`**: Exporta `STAGE_THEMES`, `ROLE_THEMES`, `getStageNumber(stageOrLesson)`, `getStageTheme(stageOrLesson)` y `getRoleMeta(roleKey)`.
2. **`Button.jsx`**: Variantes `primary` (`44px`, `40px` en `sm`, sombra presionable `0 2px 0 var(--primary-deep)`), `secondary`, `ghost`, `success`, `danger`, `stage`; tamaños `sm`, `md`, `lg`; props `icon`, `iconRight` y `fullWidth`.
3. **`ProgressBar.jsx`**: Animada mediante `--value`, grosores `sm` (4px), `md` (8px), `lg` (10px) y tonos `primary`, `stage`, `success`, `warning`, `danger`.
4. **`ProgressRing.jsx`**: Anillo SVG circular con slot central (`children` o `label`), soporte `data-stage` y modo `celebrate` (check trazado + chispas CSS).
5. **`Chip.jsx`**: Variantes `neutral`, `primary`, `stage`, `role` (`DE` / `DA` / `BI` con ícono automático de `14px`), `success`, `warning`, `danger`.
6. **`Card.jsx`**: Con `container-type: inline-size`, `interactive` (hover `translateY(-2px)` + `--shadow-2`), `stage` y `accentTop` (franja superior en color `--stage`).
7. **`Stepper.jsx`**: Soporta `variant="full"` y `variant="compact"` (7 puntos donde el paso activo es una píldora alargada en `--stage`, sin desborde en móvil `390px`).
8. **`Callout.jsx`**: Tonos `info`, `success`, `danger`, `warning`, `stage` con ícono contextual y título.
9. **`EmptyState.jsx`**: Slot de ilustración (`illustration`), título, descripción y acción.
10. **`Kbd.jsx`**: Indicador de atajo de teclado con relieve físico.
11. **`Badge.jsx`**: Medalla de logro por etapa (`stage={1..6}`, `unlocked`, `title`, `subtitle`).
12. **`Sheet.jsx`**: Panel deslizable lateral en escritorio e inferior en móvil con cierre por `Esc` y backdrop.
13. **`Tabs.jsx`**: Pestañas accesibles con navegación por flechas y variantes `pills`, `underline` y `segmented`.
14. **`Tooltip.jsx`**: Tooltip CSS accesible por `:hover` y `:focus-within`.
15. **`Skeleton.jsx`**: Bloques de carga sutiles (`text`, `title`, `block`, `card`, `circle`).
16. **`Toast.jsx`**: Banner o notificación flotante con acción y botón de cierre.
17. **`AnswerOption.jsx`**: Opción de quiz/diagnóstico (`16px` peso `500`, objetivo táctil `>= 44px`, letra `A/B/C/D`, estados `idle`, `selected`, `correct` con `pop`, `incorrect` con `shake`, `disabled`).
18. **`UiShowcase.jsx`**: Catálogo interactivo en vivo accesible mediante `?ui=1`.
