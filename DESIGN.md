# Grano — Sistema de diseño

Referencia técnica de marca, tokens, tipografía, controles, densidad, movimiento y layout de **Grano** (*Escuela de datos*). Definido en `src/styles/tokens.css` y `src/styles/reset.css`.

## 1. Marca y personalidad

- **Nombre:** Grano (*Escuela de datos*). Línea descriptiva en onboarding y `<meta name="description">`: *De la primera fila al tablero.*
- **Título de documento (`<title>`):** `Grano` fuera de lección; `<Lección> · Grano` dentro de una lección.
- **Logotipo (`src/assets/brand/BrandMark.jsx`, `public/favicon.svg`):** cuadrícula de 3×3 celdas cuadradas con separación de 1 unidad. Ocho celdas en trazo (`--ink-3`) y una celda rellena con `--brand` en la fila 2, columna 3. Wordmark `"grano"` en minúsculas, fuente de interfaz, peso 600, `letter-spacing: -0.01em`.
- **Criterio visual:** aspecto de cuaderno de laboratorio ordenado. Un solo acento de marca (`--brand`), superficies neutras separadas por bordes de 1 px (`--line`), sin degradados decorativos, sin brillo y sin sombras de color.

---

## 2. Paleta de color y contraste WCAG 2.x

Tres colores de área (`--track-de`, `--track-da`, `--track-bi`) se usan únicamente como marcadores pequeños (punto de 6–8 px, borde izquierdo de 2 px o icono), nunca como fondo de bloque grande. Las etapas antiguas no tienen color propio.

| Token | Modo claro (`:root`, `[data-theme="light"]`) | Modo oscuro (`[data-theme="dark"]`) | Uso |
| :--- | :--- | :--- | :--- |
| `--bg` | `#FAFAF9` | `#121211` | Fondo general de la aplicación |
| `--surface` | `#FFFFFF` | `#1A1A18` | Paneles, tarjetas y superficies elevadas |
| `--sunken` | `#F4F4F2` | `#222220` | Bloques hundidos: `code` inline, filas alternas, controles |
| `--line` | `#E7E5E1` | `#2E2D2A` | Bordes divisorios de 1 px |
| `--line-strong` | `#D6D3CD` | `#3D3B37` | Separadores de estructura (no de controles) |
| `--line-control` | `#928C85` | `#6B675F` | Bordes de inputs, casillas y botón `secondary` (≥ 3.0:1) |
| `--ink` | `#1C1B19` | `#EDECE9` | Texto principal y fondo del botón primario |
| `--ink-2` | `#57534E` | `#B5B1AA` | Texto secundario |
| `--ink-3` | `#78716C` | `#8F8A82` | Metadatos y texto guía en campos (≥ 4.5:1 sobre `--surface` y `--bg`) |
| `--brand` | `#C2410C` | `#F07A3E` | Acento de marca: celda del logo, progreso, foco, enlace activo |
| `--brand-soft` | `#FDF1EA` | `#2D1D14` | Fondo de selección de texto y del paso activo |
| `--brand-deep` | `#9A3412` | `#F5A47A` | Variante intensa de marca |
| `--track-de` | `#2952CC` | `#7C9BF5` | Marcador de Ingeniería de Datos |
| `--track-da` | `#167A52` | `#5BC79A` | Marcador de Análisis de Datos |
| `--track-bi` | `#7A3FC2` | `#B58CF0` | Marcador de Business Intelligence |
| `--ok` | `#167A52` | `#5BC79A` | Estado correcto (siempre acompañado de icono) |
| `--bad` | `#C2352B` | `#F07A70` | Estado de error o acción destructiva |
| `--warn` | `#A15C00` | `#E0A345` | Estado de aviso |
| `--code-bg` | `#1C1B19` | `#1C1B19` | Fondo de bloques `<pre>` (idéntico en ambos temas) |
| `--focus` | `#C2410C` | `#F07A3E` | Anillo `:focus-visible` de 2 px con `outline-offset: 2px` |

Verificación automática: `node scripts/check-contrast.mjs` comprueba 42 pares (21 en claro y 21 en oscuro) y exige ≥ 4.5:1 para texto normal y ≥ 3.0:1 para `--line-control` y marcadores de área.

---

## 3. Tipografía autoalojada y escala en `rem`

Cargada localmente en `src/styles/fonts.css` mediante paquetes `@fontsource` con `unicode-range` (sin peticiones a servidores externos):

| Token | Familia | Paquete | Pesos cargados | Uso |
| :--- | :--- | :--- | :--- | :--- |
| `--font-sans` | `IBM Plex Sans` | `@fontsource/ibm-plex-sans` | 400, 500, 600 | Interfaz y cuerpo de lectura |
| `--font-mono` | `IBM Plex Mono` | `@fontsource/ibm-plex-mono` | 400, 500 | Código, tablas de datos, números y atajos |
| `--font-display` | `Newsreader Variable` | `@fontsource-variable/newsreader` | `opsz` (500–600) | Títulos de lección, sección y módulo (`h1`, `h2`) |

### Escala tipográfica (base 16 px)

| Token | Valor (`rem`) | Equivalente a 16 px | Uso |
| :--- | :--- | :--- | :--- |
| `--fs-1` | `0.75rem` | 12 px | Metadatos, chips, atajos de teclado, `code` inline |
| `--fs-2` | `0.8125rem` | 13 px | Botones pequeños (`sm`), tablas densas |
| `--fs-3` | `0.875rem` | 14 px | Interfaz general, botones `md`/`lg`, bloques `<pre>` |
| `--fs-4` | `1rem` | 16 px | Lectura de lección y subtítulos `h4` |
| `--fs-5` | `1.125rem` | 18 px | Subtítulos `h3` |
| `--fs-6` | `1.375rem` | 22 px | Título de sección `h2` (Newsreader) |
| `--fs-7` | `1.75rem` | 28 px | Título de lección `h1` (Newsreader) |
| `--fs-8` | `2.25rem` | 36 px | Título de bienvenida en onboarding |

- **Lectura:** `line-height: 1.6` (`--lh-reading`), ancho máximo `68ch`.
- **Interfaz:** `line-height: 1.4` (`--lh-ui`).
- **Números:** `font-variant-numeric: tabular-nums` en `.tabular`, `code`, `pre`, `table` y `kbd`.
- Prohibido usar `clamp()` con unidades `vw` para texto de interfaz.

---

## 4. Espaciado, radios y profundidad

- **Espaciado (`rem`):** `--sp-1: 0.25rem` (4 px), `--sp-2: 0.5rem` (8 px), `--sp-3: 0.75rem` (12 px), `--sp-4: 1rem` (16 px), `--sp-5: 1.25rem` (20 px), `--sp-6: 1.5rem` (24 px), `--sp-8: 2rem` (32 px), `--sp-10: 2.5rem` (40 px), `--sp-12: 3rem` (48 px), `--sp-16: 4rem` (64 px).
- **Radios:** `--r-1: 4px` (chips, inputs, `code`), `--r-2: 6px` (botones, bloques `<pre>`), `--r-3: 10px` (tarjetas y paneles).
- **Sombras:** únicamente `--shadow-pop` para menús desplegables, popovers y paneles superpuestos. Las tarjetas no llevan sombra.
- **Iconos:** `lucide-react`, 16 px en controles de interfaz y 14 px en chips, `stroke-width: 1.75`.

---

## 5. Botones y controles

| Variante | Fondo | Texto | Borde | Hover | Uso |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `primary` | `--ink` | `--surface` | — | `color-mix` 8 % más claro | Acción principal única por vista |
| `secondary` | `--surface` | `--ink` | 1 px `--line-control` | Fondo `--sunken` | Acciones secundarias |
| `ghost` | Transparente | `--ink-2` | — | Fondo `--sunken`, texto `--ink` | Barras de herramientas |
| `danger` | `--surface` | `--bad` | 1 px `--bad` al 40 % | Fondo `--bad` al 8 % | Reiniciar progreso o borrar datos |
| `link` | Transparente | `--ink` | Subrayado 1 px `--line-strong` | Subrayado `--brand` | Enlaces dentro de texto |

- **Alturas:** `sm` 28 px (`--fs-2`), `md` 34 px (`--fs-3`), `lg` 40 px (`--fs-3`, peso 600). En puntero táctil (`pointer: coarse`), mínimo 44 px.
- **Estados:** `:hover`, `:active` (`transform: translateY(0.5px)`), `:focus-visible` (anillo `--focus`), `[disabled]` (opacidad `0.45`, `cursor: not-allowed`), `[aria-busy="true"]` (spinner de 14 px que reemplaza al icono conservando el ancho).
- **Chips:** 22 px de alto, `--fs-1`, fuente mono, borde 1 px `--line`, fondo `--sunken`. Chip de área: punto de 6 px en `--track-*` + etiqueta.
- **Inputs y `textarea`:** 34 px de alto, borde `--line-control`, anillo `--focus`, texto guía `--ink-3`.
- **Segmented control:** contenedor `--sunken`, opción activa `--surface` con borde `--line` e indicador deslizante con `transform`.

---

## 6. Densidad y escala

- **Escala (`data-scale` en `<html>`):** `0.9` (90 %), `1` (100 %), `1.1` (110 %), `1.25` (125 %) y `auto` (90 % entre 1024–1440 px de ancho o altura ≤ 800 px). Actualiza `--ui-scale` (y `--zoom` mientras conviven las vistas heredadas). Atajos: `Ctrl +`, `Ctrl -` y `Ctrl 0`.
- **Densidad (`data-density`):** `comfortable`, `compact` o `auto` (activa compacta en `@media (max-height: 800px), (max-width: 1366px)`). El modo compacto multiplica `--sp-*` por `0.75`, reduce la barra superior de 52 a 44 px (`--topbar-h: 2.75rem`), los botones `md` de 34 a 30 px (`--btn-h-md: 1.875rem`) y `--lh-reading` de `1.6` a `1.5`.

---

## 7. Movimiento

| Token | Valor | Uso |
| :--- | :--- | :--- |
| `--dur-1` | `120ms` | Hover, pulsado, cambio de color |
| `--dur-2` | `180ms` | Aparición de menús, tooltips y chips |
| `--dur-3` | `260ms` | Paneles laterales y transición entre vistas |
| `--dur-4` | `420ms` | Llenado de barras de progreso |
| `--ease-out` | `cubic-bezier(.2, .8, .2, 1)` | Entradas |
| `--ease-in` | `cubic-bezier(.4, 0, 1, 1)` | Salidas |
| `--ease-move` | `cubic-bezier(.65, 0, .35, 1)` | Desplazamiento de indicadores en pestañas y segmented controls |

Con `@media (prefers-reduced-motion: reduce)`, las duraciones se reducen a `0.01ms` y las barras de progreso cambian sin transición.

---

## 8. Layout por anchura

| Ancho de ventana | Navegación | Temario de lección | Tutor IA |
| :--- | :--- | :--- | :--- |
| `≥ 1600 px` | Lateral 232 px (colapsable a 56 px) | Columna visible de 260 px | Columna fija de 380 px; la lectura nunca baja de 640 px |
| `1280–1599 px` | Rail lateral de 56 px | Cajón abrible con botón "Temario" o tecla `T` | Panel superpuesto de 400 px con `--shadow-pop` |
| `1024–1279 px` | Rail lateral de 56 px | Cajón lateral | Panel superpuesto de 360 px |
| `< 1024 px` | Barra inferior de 5 ítems | Hoja inferior | Hoja inferior a pantalla completa |

- Lectura centrada a `max-width: 68ch`; simuladores hasta `min(100%, 960px)` con `container-type: inline-size`.
- La cabecera de lección muestra un único indicador de progreso (barra de 2 px + contador de sección).
