# Prompt de rediseño e-learning — Manual de Datos

> Pega todo lo que está debajo de la línea en el Agent Manager de Antigravity.
> Está pensado para que un agente "líder" lo lea completo y reparta el trabajo a sub-agentes.

---

## Contexto

Proyecto: plataforma de aprendizaje de Ingeniería de Datos (DE), Análisis (DA) y BI. React 19 + Vite + lucide-react, sin router, sin librería de UI. Corre en http://127.0.0.1:5174/.

- `src/App.jsx` (~1000 líneas) contiene el header, el índice (`viewMode === 'roadmap'`), la vista de lección (`'lesson'`), el panel del tutor y monta las demás vistas (`'practice'`, `'capstones'`, `'glossary'`, `'analytics'`).
- `src/components/`: `DiagnosticModal`, `LessonVisualizers`, `AuthenticCodeLab`, `PipelineOrderChallenge`, `SpacedRepetitionView`, `CapstoneProjectsView`, `GlossaryAndGraphView`, `LearningAnalyticsView`.
- `src/data/stages/*.js`: 6 etapas × 3 lecciones = **18 lecciones**. `src/engine/`: motor adaptativo y repetición espaciada (Leitner).
- Estado ya persistido en `localStorage` (claves `ruta_datos_2026_*`): lecciones completadas, respuestas de quiz, retos de código resueltos, retos de pipeline, proyectos, resultado del diagnóstico, estado Leitner.
- CSS: `src/styles.css` + `src/styles/editorialStudio.css` (se pisan entre sí).

## Objetivo

Hoy se ve como un documento largo generado por IA. Debe sentirse como una **plataforma de e-learning de verdad**: el estudiante siempre sabe dónde está, qué le falta, qué hacer a continuación, y cada lección se recorre por pasos con feedback inmediato. Referencias de *calidad* (no copiar marca ni layout): la claridad de Linear, la sensación de avance de Brilliant, la densidad de DataCamp.

## Restricciones duras (todos los agentes)

1. **No tocar la lógica** de `src/engine/`, las claves de `localStorage` ni el formato de datos de `src/data/`. Se puede reescribir texto (títulos, subtítulos, copy de UI), no estructura.
2. **No agregar dependencias** salvo `react-router-dom` si el agente líder lo aprueba. Nada de Tailwind, shadcn, MUI, framer-motion.
3. **Nada de patrones "AI slop"**: gradientes morados/azules, glassmorphism, sombras grandes difusas, emojis en la UI, íconos decorativos junto a cada título, tarjetas con borde de color a la izquierda en todo, textos tipo "¡Desbloquea tu potencial!", confeti, rachas con fuego, mascotas.
4. **No inventar datos**: si algo no existe en el estado (horas estudiadas, ranking, otros usuarios), no se muestra.
5. Español correcto: mayúscula solo al inicio de títulos (sentence case). Tecnicismos en inglés se quedan en inglés.
6. Nombre único del producto: **Manual de Datos** (en `<title>`, header, `package.json`, `DESIGN.md`).

## Sistema de diseño (lo define el Agente 1, los demás lo usan sin modificarlo)

### Tokens en `:root` (y versión dark bajo `prefers-color-scheme: dark` + `[data-theme="dark"]`)
```
--bg:          #F7F7F5    --bg-dark:          #111214
--surface:     #FFFFFF    --surface-dark:     #1A1B1E
--surface-2:   #F0F0EC    --surface-2-dark:   #222327
--border:      #E3E3DE    --border-dark:      #2E2F34
--text:        #18181B    --text-dark:        #ECECEE
--text-2:      #5B5B63    --text-2-dark:      #A0A0A8
--primary:     #3D5AFE  (acción, progreso, foco)   hover #2F49E0
--primary-soft:#EEF1FF                              dark #1E2440
--success:     #1F8A4C  --success-soft: #E8F5EE   (completado, respuesta correcta)
--danger:      #C8372D  --danger-soft:  #FBECEA   (antipatrón, respuesta incorrecta)
--warning:     #B7791F  (solo "repaso pendiente")
--code-bg:     #16171A
```
- Los roles **DE / DA / BI no tienen color propio**: se muestran como chips neutros (`--surface-2`, texto `--text-2`, fuente mono 12px). El color se reserva para estado (progreso, correcto, incorrecto, pendiente).
- Radios: 6px controles, 10px tarjetas, 999px solo en barras de progreso y chips. Sombra única permitida: `0 1px 2px rgb(0 0 0 / .06)` en tarjetas; ninguna otra.
- Espaciado: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64.

### Tipografía
- **Inter** (UI y títulos, pesos 400/500/600/700) + **JetBrains Mono** (código, chips, métricas). Google Fonts con preconnect y `display=swap`.
- Escala única: 12 / 14 / 16 / 18 / 22 / 28 / 36 px. Prohibido cualquier otro tamaño.
- Texto de lección: 17px, `line-height: 1.7`, máximo 72ch. `font-variant-numeric: tabular-nums` en todos los números de progreso.

### Componentes base (en `src/components/ui/`)
`Button` (primary, secondary, ghost; sm/md), `ProgressBar` (lineal, 6px), `ProgressRing` (SVG, 40px y 64px), `Chip`, `Card`, `Stepper`, `Callout` (info/success/danger), `EmptyState`, `Kbd`. Todos con estados hover, focus-visible (anillo 2px `--primary`), disabled y `aria-*` correctos.

## Arquitectura de pantallas

### A. Shell de la app
- **Barra superior** (56px, sticky): logo "Manual de Datos" · buscador de lecciones/glosario (`Ctrl+K` abre un command palette simple) · a la derecha `ProgressRing` 40px con "7/18" y botón "Tutor IA" (ghost). Nada se parte en dos líneas a ningún ancho.
- **Navegación lateral izquierda** (240px, colapsable a 64px solo íconos; drawer en móvil < 900px): Inicio · Ruta · Repaso (con contador de tarjetas vencidas en `--warning`) · Proyectos · Glosario · Mi progreso. Íconos lucide de 18px, solo aquí.
- El "Diagnóstico de nivel" deja de ser botón del hero: aparece como tarjeta en Inicio **solo si** `diagnosticResult` es null.

### B. Inicio (nuevo, reemplaza al hero actual como vista por defecto)
1. Saludo corto + **tarjeta "Continuar"** grande: lección en curso (o la siguiente no completada), etapa, paso en el que se quedó, barra de progreso de esa lección, botón primario "Continuar".
2. Fila de 3 métricas reales: lecciones completadas (x/18), quizzes acertados (%), tarjetas de repaso para hoy. Números en mono 28px, etiqueta 12px.
3. **Ruta compacta**: las 6 etapas en horizontal (o vertical en móvil) como línea de tiempo con estado: completada (check `--success`), en curso (anillo con %), bloqueada/no iniciada (gris). Clic → vista Ruta en esa etapa.
4. Tarjeta de diagnóstico (si aplica) y tarjeta "Repaso de hoy" (si hay tarjetas vencidas).

### C. Ruta (antes "Índice")
- Cabecera: título "Ruta de aprendizaje", progreso global (barra + "7 de 18 lecciones · 41 h restantes" calculado de los minutos reales).
- Cada etapa es una sección con: número de etapa, título, descripción de máximo 20 palabras, `ProgressRing` de la etapa, y su **grilla de tarjetas de lección** (3 columnas ≥ 1200px, 2 en tablet, 1 en móvil).
- **Tarjeta de lección**: número "01" en mono, título (máx. 7 palabras), subtítulo (máx. 16 palabras, 2 líneas con clamp), pie con duración · chips DE/DA/BI · estado (No iniciada / En curso 40% / Completada ✓). Toda la tarjeta es clicable. Eliminar el texto "Leer".
- Si el diagnóstico recomendó un punto de inicio, la tarjeta recomendada lleva un chip "Recomendada para ti".

### D. Reproductor de lección (lo más importante)
Convertir la lección larga en **pasos**. Layout de 3 zonas:
- **Izquierda (280px)**: temario de la etapa actual con estado por lección (check, en curso, pendiente) y, dentro de la lección activa, la lista de sus pasos.
- **Centro**: el paso actual, máximo 72ch para texto (los simuladores pueden ocupar hasta 960px).
- **Arriba del centro, sticky**: `Stepper` con los pasos y barra de progreso de la lección.

Pasos (en este orden, usando el contenido que ya existe en cada lección):
1. **Contexto** — el problema de negocio y la explicación conceptual. Partir el texto por sus subtítulos; los "1) 2) 3)" dentro de párrafos se convierten en listas reales (`src/utils/formatText.jsx`). Sin numeración manual en los h3.
2. **Simulador** — el visualizador de `LessonVisualizers` a ancho completo, con instrucciones de una línea arriba ("Cambia el tipo de JOIN y observa el total").
3. **Antipatrón vs. solución** — el comparador de código actual como tabs "Código con error" / "Código correcto" con un resumen de 1 línea en `Callout` danger/success.
4. **Los tres roles** — DE / DA / BI como 3 tarjetas iguales en altura con chip de rol y máximo 3 bullets cada una (o tabs en móvil).
5. **Comprueba lo aprendido** — el quiz, una pregunta por pantalla, feedback inmediato (correcto/incorrecto + explicación), botón "Siguiente".
6. **Práctica** — `AuthenticCodeLab` y `PipelineOrderChallenge` si la lección los tiene.
7. **Resumen** — 3 ideas clave, botón "Marcar como completada" (usa `completedIds`), siguiente lección sugerida, y aviso de que sus tarjetas entraron a Repaso.

Navegación: botones "Anterior" / "Siguiente" fijos abajo, atajos `←` `→`. Guardar el paso actual por lección en `localStorage` con una **clave nueva** `manual_datos_lesson_step` (no tocar las existentes) para que "Continuar" funcione.

### E. Repaso, Proyectos, Glosario, Mi progreso
- **Repaso** (`SpacedRepetitionView`): una tarjeta centrada tipo flashcard, botones de calificación grandes con atajos 1–4, contador "3 de 12", estado vacío cuando no hay pendientes ("Nada que repasar hoy. Vuelve mañana.").
- **Proyectos** (`CapstoneProjectsView`): grilla de tarjetas con requisitos (qué lecciones necesitas), estado y botón.
- **Glosario** (`GlossaryAndGraphView`): buscador arriba, lista A–Z a la izquierda, detalle a la derecha con "Aparece en: lección 3, lección 10".
- **Mi progreso** (`LearningAnalyticsView`): progreso por etapa, aciertos por rol DE/DA/BI, historial de lecciones completadas. Solo datos que existen.

### F. Tutor IA
Panel lateral derecho de 380px que empuja el contenido (no lo tapa) en ≥1280px y es drawer en pantallas menores. Arriba indica la lección actual como contexto. Sugerencias rápidas como chips ("Explícame el paso actual", "Dame otro ejemplo"). Sin la marca "Google AI Ultra" en botones; puede aparecer en letra pequeña dentro del panel.

## Copy
- Títulos de lección ≤ 7 palabras, subtítulos ≤ 16 palabras. Ej.: "Granularidad y fan-out en JOINs" / "Por qué una consulta correcta puede duplicar los ingresos del dashboard."
- Prohibido en UI y datos: "Oct 2026", "octubre de 2026" (salvo footer), "erradicar", "para siempre", "0% de alucinaciones", "a la mitad", "360°", "espagueti", "de principio a fin", signos de exclamación.
- Botones con verbo: "Continuar", "Empezar etapa", "Comprobar respuesta", "Marcar como completada".

## Reparto de agentes

Ejecuta en **3 fases**. Dentro de una fase los agentes corren en paralelo y **cada uno solo edita los archivos que se le asignan**. Ningún agente empieza una fase hasta que la anterior esté integrada y `npm run build` pase.

**Fase 1 — un solo agente**
- **Agente 1 · Fundaciones**: fusiona los dos CSS en `src/styles/tokens.css` + `src/styles/base.css`; crea los componentes de `src/components/ui/`; **parte `App.jsx`** en `src/layout/AppShell.jsx`, `src/views/HomeView.jsx`, `src/views/RoadmapView.jsx`, `src/views/LessonPlayer.jsx`, `src/components/TutorPanel.jsx`, dejando en `App.jsx` solo estado y enrutado por `viewMode` (agrega `'home'` como vista por defecto). Comportamiento idéntico al actual al terminar. Entrega: lista de archivos y props de cada vista.

**Fase 2 — cuatro agentes en paralelo**
- **Agente 2 · Shell + Inicio**: `AppShell.jsx`, `HomeView.jsx`, command palette.
- **Agente 3 · Ruta**: `RoadmapView.jsx` y tarjeta de lección.
- **Agente 4 · Reproductor**: `LessonPlayer.jsx`, `formatText.jsx`, adaptación visual de `LessonVisualizers`, `AuthenticCodeLab`, `PipelineOrderChallenge` (solo estilos/props, no lógica), clave `manual_datos_lesson_step`.
- **Agente 5 · Vistas secundarias + tutor**: `SpacedRepetitionView`, `CapstoneProjectsView`, `GlossaryAndGraphView`, `LearningAnalyticsView`, `DiagnosticModal`, `TutorPanel`.

**Fase 3**
- **Agente 6 · Copy** (puede correr en paralelo con la Fase 2 porque solo toca `src/data/`): antes de editar, entrega una tabla con los 18 títulos y subtítulos viejos → nuevos y espera aprobación.
- **Agente 7 · QA**: no escribe features. Recorre la app en el navegador y verifica la checklist de abajo; reporta fallos con captura y archivo:línea al agente dueño de ese archivo.

Cada agente, al terminar, entrega: archivos tocados, capturas a 1440px y 390px de sus pantallas, y cualquier decisión que se salió de este documento.

## Criterios de aceptación (Agente 7 los verifica)
- [ ] Vista por defecto es Inicio y "Continuar" lleva al paso exacto donde se quedó el estudiante (probar: avanzar al paso 3 de la lección 2, recargar, pulsar Continuar).
- [ ] Completar una lección actualiza el anillo del header, la etapa en Ruta y las métricas de Inicio sin recargar.
- [ ] Ningún texto del header/barra lateral se parte en dos líneas a 1440, 1024, 768 y 390 px. Sin scroll horizontal a 390 px.
- [ ] El progreso guardado antes del rediseño sigue apareciendo (las claves `ruta_datos_2026_*` no cambiaron).
- [ ] Los 18 simuladores, el quiz, el laboratorio de código, el reto de pipeline, el diagnóstico y el repaso funcionan (probar al menos lecciones 1, 5, 7, 10, 14 y 18).
- [ ] Navegación completa con teclado: Tab con foco visible, `←`/`→` en el reproductor, `1–4` en repaso, `Ctrl+K`.
- [ ] Contraste ≥ 4.5:1 en modo claro y oscuro.
- [ ] `grep -rE "#1D4ED8|#047857|#B45309|#EFF6FF|!important|linear-gradient" src/` → 0 resultados.
- [ ] `grep -rhoE "font-size:\s*[^;]+" src/ | sort -u` solo devuelve los 7 tamaños definidos (o sus variables).
- [ ] Ningún título de lección supera 7 palabras; la palabra "Leer" no aparece en Ruta.
- [ ] `npm run build` sin errores ni warnings.
- [ ] `DESIGN.md` reescrito con el sistema nuevo (tokens, escala, componentes, 18 lecciones).
