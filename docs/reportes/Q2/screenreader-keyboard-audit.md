# Auditoría de Lector de Pantalla (Windows Narrator / ARIA) y Navegación por Teclado — Q2

Fecha de ejecución: `2026-10-30T16:33:56.932Z`  
Motor de verificación: `playwright-core` + `axe-core v4.14.0` + árbol de accesibilidad de Chromium (expuesto a Windows Narrator vía UI Automation).

---

## 1. Resumen de violaciones `axe-core` (12 vistas × 2 temas = 24 auditorías)

- **Critical:** `0`
- **Serious:** `0`
- **Moderate:** `0`
- **Minor:** `0`
- **Criterio de aceptación (0 serious / 0 critical):** **CUMPLIDO**

---

## 2. Regiones Landmark expuestas a Windows Narrator (`LessonPlayer`)

- **Cantidad de regiones `<main>` en el documento:** `1` (anidadas: `0`)

| Rol ARIA / Landmark | Elemento HTML | Clase CSS | Etiqueta accesible (`aria-label` / `aria-labelledby`) |
| :--- | :--- | :--- | :--- |
| `banner` | `<header>` | `app-topbar` | — |
| `banner` | `<header>` | `lp-topbar` | — |
| `banner` | `<header>` | `lp-header` | — |
| `banner` | `<header>` | `lp-role-card__header` | — |
| `banner` | `<header>` | `lp-check-card__head` | — |
| `banner` | `<header>` | `lp-check-card__head` | — |
| `banner` | `<header>` | `lp-check-card__head` | — |
| `banner` | `<header>` | `sql-lab-header` | — |
| `banner` | `<header>` | `sql-lab-header` | — |
| `banner` | `<header>` | `ui-dialog__header` | — |
| `navigation` | `<nav>` | `app-sidebar__nav` | `Secciones de Grano` |
| `navigation` | `<nav>` | `lp-syllabus-nav` | `Temario de la lección` |
| `main` | `<main>` | `app-main` | — |
| `complementary` | `<aside>` | `app-sidebar app-sidebar--collapsed` | `Navegación principal` |
| `complementary` | `<aside>` | `lp-syllabus-rail` | — |

---

## 3. Secuencia de foco con `Tab` en `LessonPlayer` (sin trampas de teclado)

| Paso | Elemento | Rol | Nombre accesible anunciado | Indicador visual (`outline` / `box-shadow`) | Visible |
| :---: | :--- | :--- | :--- | :--- | :---: |
| 1 | `<button>` | `button` | grano — Ir a Hoy | `solid 2px` / `none` | Sí |
| 2 | `<button>` | `button` | Buscar lecciones, módulos o glosario… Ctrl+K | `solid 2px` / `none` | Sí |
| 3 | `<button>` | `button` | IA lista. Modelo activo: gemini-3.8-flash-low (rápido) · gemini-4-argon-medium (profundo) | `solid 2px` / `none` | Sí |
| 4 | `<button>` | `button` | Preguntar al tutor IA | `solid 2px` / `none` | Sí |
| 5 | `<button>` | `button` | Menú de usuario | `solid 2px` / `none` | Sí |
| 6 | `<button>` | `button` | Hoy | `solid 2px` / `none` | Sí |
| 7 | `<button>` | `button` | Ruta | `solid 2px` / `none` | Sí |
| 8 | `<button>` | `button` | Práctica | `solid 2px` / `none` | Sí |
| 9 | `<button>` | `button` | Repaso 1 tarjetas pendientes | `solid 2px` / `none` | Sí |
| 10 | `<button>` | `button` | Glosario | `solid 2px` / `none` | Sí |
| 11 | `<button>` | `button` | Progreso | `solid 2px` / `none` | Sí |
| 12 | `<button>` | `button` | Ajustes | `solid 2px` / `none` | Sí |
| 13 | `<button>` | `button` | Expandir barra lateral | `solid 2px` / `none` | Sí |
| 14 | `<button>` | `button` | ← Ruta | `solid 2px` / `none` | Sí |

---

## 4. Atajos de teclado verificados sin ratón

### 4.1 Paleta de comandos (`Ctrl+K`, `ArrowDown`, `Escape`)
- **Apertura con `Control+KeyK`:** `true` (`role="dialog"`, `aria-modal="true"`, `aria-labelledby="Paleta de comandos y buscador global"`)
- **Foco automático en combobox:** `true` (`role="combobox"`, `aria-controls="_r_e_"`)
- **Navegación con `ArrowDown` (`aria-activedescendant`):** `_r_e_-opt-1`
- **Cierre limpio con `Escape`:** `true`

### 4.2 Reproductor de lecciones (`?`, `Escape`, `J`, `K`, `/`)
- **Apertura de diálogo de atajos con `?`:** `true`
- **Cierre de diálogo de atajos con `Escape`:** `true`
- **Avance/retroceso de sección con `J` y `K`:** `true`
  - Sección inicial: *Sección 1 de 10 · Contexto y objetivos*
  - Tras `J`: *Sección 2 de 10 · Qué es el grano de una tabla y por qué define su contrato*
  - Tras `K`: *Sección 1 de 10 · Contexto y objetivos*

### 4.3 Panel del Tutor IA (`/`, `aria-live="polite"`, `Escape`)
- **Apertura con atajo `/`:** `true` (`<aside aria-label="Tutor IA">`)
- **Foco automático en `#tutor-question-textarea`:** `true`
- **Historial con `role="log"` y `aria-live="null"`:** `true`
- **Región de estado para lector de pantalla (`role="status" aria-live="polite"`):** `true`
- **Anuncio tras enviar consulta al tutor:** `"Respuesta del tutor completada en 0.0 segundos."` (`1` mensajes en el log)
- **Cierre del panel con `Escape`:** `true`

### 4.4 Repaso espaciado FSRS (`Space`, `1`–`4`)
- **Revelar respuesta con `Space`:** `true`
- **Calificar tarjeta con tecla `3` (Bien):** `true`

---

## 5. Instantánea del Árbol de Accesibilidad (AXTree / Narrator)

### 5.1 Vista `Lección` (extracto del árbol ARIA)
```yaml
- banner:
  - button "grano — Ir a Hoy": grano
  - button "Buscar lecciones, módulos o glosario… Ctrl+K"
  - 'button "IA lista. Modelo activo: gemini-3.8-flash-low (rápido) · gemini-4-argon-medium (profundo)"': IA lista
  - button "Preguntar al tutor IA": Preguntar
  - button "Menú de usuario": Menú
- complementary "Navegación principal":
  - navigation "Secciones de Grano":
    - button "Hoy"
    - button "Ruta"
    - button "Práctica"
    - button "Repaso 1 tarjetas pendientes"
    - button "Glosario"
    - button "Progreso"
  - button "Ajustes"
  - button "Expandir barra lateral"
- main:
  - button "← Ruta"
  - button "Temario T" [expanded]
  - text: Sección 1 de 10 · Contexto y objetivos
  - button "Preguntar /"
  - button "Atajos de teclado de la lección (?)": "?"
  - progressbar "Progreso de lectura de la lección"
  - complementary:
    - navigation "Temario de la lección":
      - text: En esta lección 1/10
      - list:
        - listitem:
          - button "01 Contexto y objetivos"
        - listitem:
          - button "02 Qué es el grano de una tabla y por qué define su contrato Lab"
        - listitem:
          - button "03 Anatomía del fan-out (1:N) y de la trampa de abismo (N:1:M)"
        - listitem:
          - button "04 Tres estrategias técnicas para evitar el fan-out"
        - listitem:
          - 'button "05 Auditoría defensiva: cómo detectar un fan-out antes de publicar"'
        - listitem:
          - button "06 Ejemplo paso a paso"
        - listitem:
          - button "07 Desde tu área"
        - listitem:
          - button "08 Comprobaciones 0/3"
        - listitem:
          - button "09 Práctica aplicada Pendiente"
        - listitem:
          - button "10 Resumen y fuentes"
  - article "Grano de una tabla y fan-out en JOINs":
    - button "Ruta"
    - text: Combinar tablas
    - heading "Grano de una tabla y fan-out en JOINs" [level=1]
    - text: "25 min Nivel 1 (Fundamentos) Recomendado antes:"
    - 'button "Tipos de JOIN: INNER, LEFT, FULL, SEMI y ANTI JOIN"'
    - region "Contexto y objetivos de aprendizaje":
      - text: Escenario real
      - paragraph:
        - text: En Mercado Brisa (empresa ficticia), la tabla
        - code: orders
        - text: tiene 18 000 pedidos (con el importe total
        - code: total_usd
        - text: y el envío
        - code: shipping_usd
        - text: ) y
        - code: order_items
        - text: tiene 42 000 líneas de producto. Un analista las une con un
```

### 5.2 Vista `Repaso` (extracto del árbol ARIA)
```yaml
- main:
  - text: REPETICIÓN ESPACIADA FSRS · 9 PENDIENTES HOY · 1 REPASADAS EN SESIÓN
  - heading "Repaso" [level=1]
  - paragraph: Cada tarjeta se programa según su estabilidad y dificultad de recuerdo. Pulsa Espacio para mostrar la respuesta y 1 – 4 para calificar.
  - button "Practicar catálogo (566)"
  - button "Reiniciar calendario"
  - radiogroup "Filtrar tarjetas por área":
    - radio "Todas" [checked]
    - radio "Tronco común"
    - radio "DE"
    - radio "DA"
    - radio "BI"
  - text: Tarjeta 1 de 9
  - region "Tarjeta de repaso activa":
    - article:
      - text: Tronco común Nivel 1 · Combinar tablas Nueva PREGUNTA
      - heading "¿Qué es el grano (grain) de una tabla y cómo se verifica en SQL?" [level=2]
      - button "Mostrar respuesta"
```
