# Iteración 2 — Manual de Datos: más color, más e-learning, responsive de verdad

> Pega todo lo que está debajo de la línea en el Agent Manager de Antigravity.
> El agente líder lee el documento completo, entrega a cada sub-agente **la sección "Reglas comunes" + su propia sección**, y coordina las fases.

---

## 0. Mensaje al equipo

Van por buen camino. La Fase 1 y 2 de la iteración anterior funcionan: ya hay Inicio con "Continuar", Ruta en tarjetas, reproductor por pasos con stepper, barra lateral, `Ctrl+K`, componentes en `src/components/ui/` y `App.jsx` partido en `src/views/` y `src/layout/`. **No tiren eso**; esta iteración lo construye encima.

El problema ahora es otro: **se ve gris, plano y genérico**, como un panel de administración, no como una plataforma donde dan ganas de aprender. Y el responsive está a medias. Objetivo de esta iteración:

1. **Más color con sistema**: cada etapa tiene identidad propia; el color comunica dónde estás y cómo vas.
2. **Más bonito**: tipografía con personalidad, ilustraciones propias, profundidad sutil, micro-interacciones.
3. **Más e-learning**: feedback inmediato y celebración del avance, sensación de progreso en cada pantalla.
4. **Responsive real**: diseñado para 360 px primero, no "encogido" desde escritorio.

## 1. Diagnóstico del estado actual (verificado en el navegador a 1280×800 y 375×812)

**Inicio**
- El hero repite "Manual de Datos" (el mismo texto que el logo) en escritorio; en móvil dice "Continúa tu aprendizaje". Inconsistente.
- Todo es tarjeta blanca sobre gris claro con texto gris. El único color es el botón azul y la barra ámbar de repaso.
- La fila "Ruta de las 6 etapas" son 6 tarjetitas idénticas ("0% No iniciada") con títulos partidos en 3–4 líneas; no se distinguen entre sí.
- Muestra "24 tarjetas de repaso para hoy" a un usuario que no ha completado ninguna lección. No tiene sentido pedagógico.

**Ruta**
- 18 tarjetas iguales en blanco y gris. Los chips `DE DA BI` aparecen en casi todas, así que no aportan información.
- Subtítulos cortados con "..." a media frase.

**Reproductor de lección (escritorio)**
- Dos columnas a la izquierda (navegación 240 px + temario 280 px) dejan el contenido en ~55 % del ancho a 1280 px.
- El stepper desborda horizontalmente con barra de scroll visible ("Comprueba..." cortado).
- El encabezado de la lección (chips + título + subtítulo) se repite completo en **cada** paso y empuja el contenido real hacia abajo.
- El paso Contexto es un bloque de texto denso con borde azul; no hay jerarquía ni ritmo.
- El pie repite "Paso 1/7 · Contexto" además del stepper y la barra de arriba.

**Móvil (375 px)**
- Header: el buscador se monta sobre el anillo de progreso.
- En la tarjeta Continuar el chip "Etapa 2 · Modelado dimensional y diseño de mé…" se sale de la tarjeta.
- En la lección, "Paso 5 de 7" aparece **tres veces**; el bloque sticky de progreso + stepper ocupa ~35 % de la pantalla; el stepper está cortado.
- Opciones del quiz en negrita de 17 px: cada opción ocupa media pantalla.

**Código**
- **~455 bloques `style={{...}}` inline** repartidos en componentes y vistas (DiagnosticModal 57, LessonPlayer 48, CapstoneProjectsView 44, GlossaryAndGraphView 42, SimulatorsPackA 41, HomeView 38, LearningAnalyticsView 38, SimulatorsPackB 35, SpacedRepetitionView 30...). Con estilos inline no hay media queries, ni hover, ni modo oscuro coherente. Es la causa principal del mal responsive.
- `src/styles/base.css` es un monolito de 1741 líneas con solo 2 media queries (`max-width: 1279px` y `899px`).
- `tokens.css` todavía tiene alias heredados (`--paper`, `--ink`, `--accent`, `--rule`, `--ok`) y el modo oscuro usa el mismo `--primary` que el claro.

## 2. Reglas comunes (todos los agentes deben conocerlas)

### 2.1 Qué es el producto
Plataforma de autoaprendizaje en español para Ingeniería de Datos (DE), Análisis de Datos (DA) y BI. 6 etapas × 3 lecciones = 18 lecciones. Cada lección tiene 7 pasos: Contexto → Simulador → Antipatrón vs. solución → Los tres roles → Comprueba lo aprendido → Práctica → Resumen. Hay repaso espaciado (Leitner), diagnóstico de nivel, proyectos finales, glosario, analítica de progreso y un tutor IA. Público: estudiantes y profesionales junior/mid de datos. Tono: cercano, preciso, sin hype.

### 2.2 Archivos que todos deben leer antes de tocar nada
- `src/styles/tokens.css` y `src/styles/base.css` (después de la Fase 1, los nuevos archivos de estilo).
- `src/components/ui/index.js` y cada componente de `src/components/ui/`.
- `src/App.jsx` (estado y claves `localStorage`).
- `src/data/curriculum2026.js` y un archivo de `src/data/stages/` para entender la forma de una lección.
- Este documento completo, secciones 2 y 3.

### 2.3 Prohibiciones
- **No tocar** la lógica de `src/engine/`, ni las claves de `localStorage` existentes (`ruta_datos_2026_*`, `manual_datos_lesson_step`), ni la estructura de `src/data/`.
- **No agregar dependencias** de UI (Tailwind, shadcn, MUI, Chakra, framer-motion, GSAP, Lottie). Permitido: `lucide-react` (ya está). Las animaciones son CSS.
- **Cero `style={{}}` nuevos.** Cada agente elimina los inline de sus propios archivos y los convierte a clases. Única excepción: valores dinámicos de datos (ancho de una barra `--value`, color de etapa) pasados como **variable CSS** `style={{ '--value': pct }}`.
- **No inventar datos** (horas, rankings, otros usuarios, XP ficticio). Todo número visible sale del estado real.
- Nada de: emojis en la UI, mascotas, confeti a pantalla completa, sombras de colores neón, glassmorphism, fondos con blobs difusos, textos "¡Desbloquea tu potencial!", gradientes arcoíris.
- Español con mayúscula solo al inicio. Tecnicismos en inglés en minúscula salvo nombres propios.

### 2.4 Referencias (estudiar el **patrón**, nunca copiar marca, layout exacto, ilustraciones ni textos)
| Referencia | Qué mirar |
|---|---|
| **Brilliant** | Cómo una lección avanza pantalla a pantalla, feedback inmediato al responder, barra de progreso de lección delgada arriba. |
| **Duolingo** | Estados de respuesta correcta/incorrecta (color de fondo de la barra inferior, sonido visual), celebración al terminar una unidad, colores sólidos y saturados. |
| **Khan Academy** | Mapa de curso con progreso por unidad, indicadores de dominio por habilidad. |
| **DataCamp** | Cómo mezcla teoría + ejercicio de código en una misma lección técnica; densidad aceptable de contenido técnico. |
| **Codecademy / Scrimba** | Panel de práctica de código junto a instrucciones; estado "ejecutar / comprobar". |
| **Exercism** | Tarjetas de ejercicio con dificultad y estado, tono serio pero amable. |
| **Coursera / edX** | Estructura semanal / módulo y página de progreso. |
| **Linear** | Calidad de detalle: espaciados, estados hover/focus, atajos de teclado, rendimiento percibido. |
| **Radix Colors** (radix-ui.com/colors) | Cómo construir escalas de 12 pasos por color con usos claros (fondo, borde, sólido, texto). |
| **Refactoring UI** (libro) | Jerarquía con peso y color en vez de tamaño, color en grises, sombras de dos capas. |
| **Every Layout** (every-layout.dev) | Layouts intrínsecos (Stack, Cluster, Sidebar, Switcher, Grid) que no necesitan media queries. |
| **web.dev: container queries, `clamp()`, `prefers-reduced-motion`** | Responsive por componente y tipografía fluida. |
| **WCAG 2.2 AA** | Contraste 4.5:1 texto, 3:1 componentes; objetivo táctil ≥ 44 px; foco visible. |

### 2.5 Sistema visual (lo implementa el Agente 1; el resto lo usa sin cambiarlo)

**Tipografía**
- Display/títulos: **Plus Jakarta Sans** 700/800. UI y texto: **Inter** 400/500/600. Código y números: **JetBrains Mono** 400/600.
- Escala fluida con `clamp()`:
  `--fs-xs: 12px` · `--fs-sm: 14px` · `--fs-md: 16px` · `--fs-lg: clamp(17px, 1.1vw + 13px, 18px)` · `--fs-xl: clamp(20px, 1.4vw + 14px, 24px)` · `--fs-2xl: clamp(24px, 2vw + 16px, 32px)` · `--fs-3xl: clamp(30px, 3vw + 18px, 44px)`.
- Texto de lección 17–18 px, `line-height: 1.7`, máx. 70ch. Opciones de quiz: 16 px peso 500 (no negrita).

**Color base (claro / oscuro)**
```
--bg           #F6F7FB / #0F1117     fondo con un toque frío, no gris sucio
--surface      #FFFFFF / #171A23
--surface-2    #EFF1F7 / #1F2330
--border       #E2E5EE / #2A2F3D
--text         #141824 / #EEF0F6
--text-2       #586079 / #A3AAC0
--primary      #4C4DFF / #8B8CFF     índigo eléctrico: acciones y foco
--primary-deep #3434D6 / #B4B5FF     texto sobre fondo claro de primary
--primary-soft #ECEBFF / #23234A
--success      #12A150 / #3DD68C     --success-soft #E3F8EC / #12301F
--danger       #E5484D / #FF6369     --danger-soft  #FEECEC / #3B1618
--warning      #F5A300 / #FFC53D     --warning-soft #FFF6DC / #3A2A05
--code-bg      #121521 / #0B0D14
```

**Color por etapa** (identidad; se aplica con `[data-stage="1"]` … `[data-stage="6"]` que define `--stage`, `--stage-soft`, `--stage-deep`, `--stage-contrast`):
| Etapa | Nombre | `--stage` | `--stage-soft` | `--stage-deep` |
|---|---|---|---|---|
| 1 | Fundamentos y SQL | Coral `#FF6B4A` | `#FFEDE7` | `#B4381C` |
| 2 | Modelado dimensional | Ámbar `#F2A516` | `#FFF4DA` | `#8A5300` |
| 3 | Motores columnares | Esmeralda `#1DB371` | `#E1F7EB` | `#0B6B40` |
| 4 | Lakehouse | Turquesa `#16A8B8` | `#DFF5F7` | `#0A6370` |
| 5 | Estadística y BI | Azul `#3C7BFF` | `#E5EDFF` | `#1D47B3` |
| 6 | Streaming e IA | Violeta `#8A5CFF` | `#EFE9FF` | `#5127C7` |
- Texto sobre `--stage` sólido: blanco solo si cumple 4.5:1; si no, usar `--stage-deep`. **Verificar cada combinación** y anotarla en `DESIGN.md`.
- En modo oscuro: `--stage` se mantiene, `--stage-soft` pasa a `color-mix(in oklab, var(--stage) 18%, var(--surface))`.

**Roles** (solo en chips de rol y en el paso "Los tres roles"): DE `#2F6BFF` + ícono `Database`; DA `#0FA968` + ícono `Sigma`; BI `#F08A24` + ícono `LayoutDashboard`. Chip: fondo `color-mix(... 14%)`, texto en el tono oscuro del rol, ícono 14 px.

**Forma y profundidad**
- Radios: `--r-sm 8px` (inputs, chips), `--r-md 12px` (botones), `--r-lg 16px` (tarjetas), `--r-xl 24px` (hero, modales).
- Sombras (solo estas dos): `--shadow-1: 0 1px 2px rgb(16 24 40 / .06), 0 1px 3px rgb(16 24 40 / .08)`; `--shadow-2: 0 4px 8px -2px rgb(16 24 40 / .08), 0 12px 24px -6px rgb(16 24 40 / .10)` (hover de tarjeta, modales).
- Gradientes: **solo** en el hero de Inicio y en la cabecera de cada etapa; dos paradas del **mismo** tono (`--stage` → `--stage-deep` a 135°) o `--primary` → `#7B5CFF`. Nunca en botones ni texto.
- Botón primario: alto 44 px (40 px en `sm`), sombra inferior "presionable" `0 2px 0 var(--primary-deep)` que desaparece en `:active` con `translateY(2px)`.

**Movimiento** (tokens `--ease-out: cubic-bezier(.2,.8,.2,1)`, `--dur-1: 120ms`, `--dur-2: 220ms`, `--dur-3: 420ms`)
- Hover de tarjeta: `translateY(-2px)` + `--shadow-2`.
- Barras y anillos de progreso animan su valor al cambiar.
- Respuesta correcta: la opción se vuelve verde con un "pop" de escala 1 → 1.03 → 1; incorrecta: "shake" horizontal de 6 px, 2 ciclos.
- Al completar lección: anillo que se llena + check que se dibuja (`stroke-dashoffset`) + chispas CSS pequeñas **alrededor del anillo**, no a pantalla completa.
- Todo envuelto en `@media (prefers-reduced-motion: no-preference)`.

**Responsive**
- Breakpoints: `480px`, `768px`, `1024px`, `1280px`, `1536px`, mobile-first (`min-width`).
- Componentes de tarjeta con **container queries** (`container-type: inline-size`) para cambiar su layout según el espacio que tienen, no según la ventana.
- Objetivo táctil ≥ 44×44 px. Nada depende de hover para funcionar.
- Tablas de simuladores: dentro de un contenedor con `overflow-x: auto`, sombra lateral que indica "hay más", primera columna sticky.
- Probar siempre en: **360, 390, 768, 1024, 1280, 1440** px.

## 3. Fases y agentes

```
Fase 1 (secuencial)   Agente 1 · Sistema
Fase 2 (en paralelo)  Agente 2 · Shell + Inicio
                      Agente 3 · Ruta
                      Agente 4 · Reproductor
                      Agente 5 · Simuladores y práctica
                      Agente 6 · Vistas secundarias + tutor
                      Agente 7 · Ilustraciones
Fase 3 (secuencial)   Agente 8 · QA y pulido
```
Cada agente edita **solo** los archivos de su sección. Si necesita un cambio en un archivo ajeno, lo pide al líder; no lo hace. Ninguna fase empieza hasta que la anterior pasa `npm run build` sin warnings.

Cada agente entrega al terminar:
1. Lista de archivos tocados.
2. Capturas a 390 px y 1440 px de cada pantalla suya (y de cada estado: vacío, en curso, completado, error).
3. Número de `style={{` que quedaban y que quedan en sus archivos.
4. Cualquier decisión que se salió de este documento, con el porqué.

---

### Agente 1 · Sistema (Fase 1)

**Debe conocer**: sección 2 completa; todos los componentes de `src/components/ui/`; `base.css` entero.
**Referencias**: Radix Colors (escalas y uso por paso), Refactoring UI (sombras y jerarquía), Every Layout (primitivas), web.dev sobre `clamp()` y container queries.
**Archivos**: `src/styles/**`, `src/components/ui/**`, `index.html` (fuentes), `DESIGN.md`.
**Tareas**
1. Reescribir `tokens.css` con la sección 2.5: color base, etapas, roles, radios, sombras, movimiento, tipografía fluida. Eliminar los alias heredados (`--paper`, `--ink`, `--accent`, `--rule`, `--ok`) y reemplazar su uso en todo `base.css`.
2. Partir `base.css` en: `reset.css`, `layout.css` (primitivas Stack/Cluster/Grid/Sidebar como clases utilitarias), `components.css` (ui), `animations.css` (keyframes pop, shake, draw-check, sparkle, fill), y un archivo por vista que los agentes de Fase 2 llenarán: `views/home.css`, `views/roadmap.css`, `views/lesson.css`, `views/simulators.css`, `views/secondary.css`, `views/tutor.css`, `views/shell.css`. Deja en cada archivo de vista las reglas que hoy existen para esa vista.
3. Utilidad `[data-stage]` que define las 4 variables de etapa. Helper `src/components/ui/stageTheme.js` que devuelve el número de etapa de una lección.
4. Rediseñar los componentes ui con el nuevo sistema y agregar los que faltan: `Button` (primary, secondary, ghost, success, danger; sm/md/lg; con ícono), `ProgressBar` (animada, color por prop o por `--stage`), `ProgressRing` (animado, con slot central), `Chip` (neutral, primary, stage, role), `Card` (interactive, con `data-stage` opcional y franja superior de color), `Stepper` (modo completo y modo compacto de puntos), `Callout`, `EmptyState` (con slot de ilustración), `Kbd`, **nuevos**: `Badge` (logro de etapa), `Sheet` (panel inferior en móvil), `Tabs`, `Tooltip`, `Skeleton`, `Toast`, `AnswerOption` (estados: idle, selected, correct, incorrect, disabled).
5. Modo oscuro completo con tokens propios (no copiar los claros).
6. Una página interna `?ui=1` (renderizada desde `App.jsx` solo si existe ese query param) que muestre todos los componentes en todos sus estados y las 6 etapas en claro y oscuro. Es la referencia visual para los demás agentes.
7. Reescribir `DESIGN.md` con el sistema nuevo y la tabla de contrastes verificados.

**Entregable extra**: captura de `?ui=1` en claro y oscuro.

---

### Agente 2 · Shell + Inicio

**Debe conocer**: sección 2; `src/layout/AppShell.jsx`, `src/views/HomeView.jsx`, el estado de `App.jsx`, `?ui=1`.
**Referencias**: Khan Academy y Coursera (dashboard del estudiante), Duolingo (bloque "siguiente lección" protagonista), Linear (command palette y atajos).
**Archivos**: `src/layout/AppShell.jsx`, `src/views/HomeView.jsx`, `src/styles/views/shell.css`, `src/styles/views/home.css`.
**Tareas — Shell**
1. **≥ 1024 px**: barra lateral 248 px con logo (ver Agente 7), navegación con ícono + texto, indicador activo con barra de 3 px `--primary` y fondo `--primary-soft`; abajo, tarjeta mini con anillo de progreso global y "7 de 18 lecciones". Colapsable a 72 px (solo íconos con tooltip).
2. **768–1023 px**: barra lateral colapsada a 72 px por defecto.
3. **< 768 px**: sin barra lateral. **Barra inferior de pestañas** fija de 64 px + `env(safe-area-inset-bottom)` con 5 destinos: Inicio, Ruta, Repaso (con contador), Proyectos, Más (abre `Sheet` con Glosario, Mi progreso, Tutor, tema). Header superior de 56 px solo con logo, ícono de búsqueda (abre palette a pantalla completa) y anillo de 32 px.
4. El buscador en header solo es campo completo ≥ 1024 px; por debajo, botón de ícono. Nada se superpone a ningún ancho.
5. Selector de tema claro/oscuro/sistema (guardar en clave nueva `manual_datos_theme`).

**Tareas — Inicio**
1. **Hero con gradiente** (`--primary` → `#7B5CFF`, radio `--r-xl`): saludo según hora ("Buenos días"), una frase de estado real ("Vas por la etapa 2 · 5 de 18 lecciones"), ilustración de la etapa actual a la derecha (oculta < 480 px). Quitar el título "Manual de Datos" duplicado.
2. **Tarjeta Continuar** con `data-stage` de la lección: franja de color de etapa, número de lección grande en `--stage`, título, paso actual, `ProgressBar` de la lección en `--stage`, botón primario grande. Si no hay lección empezada: "Empieza por aquí" con la lección recomendada por el diagnóstico o la 01.
3. **Métricas**: 3 tarjetas con ícono en círculo de color, número grande en mono, mini barra. Si un valor es 0, mostrar texto motivador corto en vez de "0%" ("Responde tu primer quiz en la lección 1").
4. **Mapa de etapas**: camino visual (línea que conecta 6 nodos circulares, horizontal ≥ 1024 px, vertical < 1024 px). Cada nodo con color de su etapa, ícono de la etapa, anillo de progreso, nombre corto (máx. 3 palabras: "SQL", "Modelado", "Columnar", "Lakehouse", "Estadística y BI", "Streaming e IA"). Etapa actual con anillo pulsante suave. Completadas con check e insignia.
5. **Repaso de hoy**: solo cuenta tarjetas de lecciones que el estudiante ya empezó o completó (filtrar en la vista, sin tocar el motor). Si son 0: estado vacío con ilustración.
6. **Diagnóstico**: visible solo si no hay resultado; tarjeta con ilustración y CTA.
7. **Insignias de etapa**: fila de 6 `Badge` (gris bloqueada → color al completar la etapa). Solo con datos reales.

---

### Agente 3 · Ruta

**Debe conocer**: sección 2; `src/views/RoadmapView.jsx`, los datos de etapas, `?ui=1`.
**Referencias**: Khan Academy (unidades con progreso), Exercism (tarjetas de ejercicio), Coursera (módulos).
**Archivos**: `src/views/RoadmapView.jsx`, `src/styles/views/roadmap.css`.
**Tareas**
1. Cabecera: título "Tu ruta", barra de progreso global gruesa (10 px) con marcadores de las 6 etapas, texto "5 de 18 lecciones · 7 h 30 min restantes" calculado.
2. **Navegación por etapas**: tabs/pills horizontales con scroll (en móvil) con el color de cada etapa; clic hace scroll suave a la sección; la activa se resalta según scroll (IntersectionObserver).
3. **Cabecera de etapa** con `data-stage`: banda con gradiente de la etapa, ilustración de la etapa (Agente 7), "Etapa 2", título, descripción ≤ 20 palabras, `ProgressRing` grande y la `Badge` de la etapa.
4. **Tarjeta de lección** (`Card interactive data-stage`): número grande en `--stage`, título, subtítulo **completo** (sin `...`; si es largo, el copy se acorta, no se trunca), duración con ícono de reloj, **solo los roles protagonistas** de la lección (máx. 2 chips de rol con color), estado con ícono + color: pendiente (círculo vacío), en curso (anillo con % en `--stage`), completada (check sólido `--success`, tarjeta con fondo `--stage-soft`).
5. Lección recomendada por diagnóstico: borde 2 px `--primary` + chip "Recomendada".
6. Grilla con `repeat(auto-fill, minmax(280px, 1fr))`; la tarjeta usa container queries para pasar de vertical a horizontal cuando tiene > 520 px.

---

### Agente 4 · Reproductor de lección

**Debe conocer**: sección 2; `src/views/LessonPlayer.jsx`, `src/utils/formatText.jsx`, el estado de pasos, `?ui=1`. Coordinar con el Agente 5 la interfaz de props de los simuladores (no editar sus archivos).
**Referencias**: Brilliant (avance por pantalla, barra delgada), Duolingo (barra inferior de feedback verde/roja), DataCamp (teoría técnica legible).
**Archivos**: `src/views/LessonPlayer.jsx`, `src/utils/formatText.jsx`, `src/styles/views/lesson.css`.
**Tareas — Layout**
1. Envolver toda la vista en `data-stage` de la lección: el color de la etapa tiñe barra de progreso, stepper, números y acentos.
2. **≥ 1280 px**: al entrar a una lección, la barra lateral de navegación global se colapsa a 72 px automáticamente. Temario de la etapa a la izquierda (280 px, colapsable). Contenido centrado.
3. **1024–1279 px**: temario como panel deslizable desde la izquierda (botón "Temario").
4. **< 1024 px**: temario en `Sheet` inferior. La barra inferior de pestañas del shell se **oculta** dentro de la lección (modo foco) y aparece un botón "← Salir".
5. **Cabecera de lección compacta y única**: una sola línea sticky de 56 px con: botón salir/temario, título corto de la lección truncado, `Stepper` compacto (7 puntos con el actual alargado, en color de etapa) y "5/7". Quitar el bloque grande de chips + título + subtítulo de cada paso: el título grande aparece **solo en el paso 1**.
6. Barra de progreso de 4 px pegada bajo la cabecera, en `--stage`, animada.
7. Eliminar duplicados: "Paso X de 7" aparece **una** vez. Quitar los `Kbd ← →` del pie en móvil.

**Tareas — Pasos**
1. **Contexto**: dividir en bloques visuales: tarjeta "El problema" (ícono, fondo `--stage-soft`, 2–3 líneas), "Objetivo" como lista de 2–4 checks, el resto como prosa con subtítulos y listas reales. Términos de código con estilo inline-code legible.
2. **Simulador**: instrucción en una tarjeta con ícono de mano/cursor + "Prueba esto", simulador a ancho completo (hasta 1040 px).
3. **Antipatrón vs. solución**: `Tabs` con pestaña roja "Con error" y verde "Correcto", resumen de una línea arriba del código con ícono. En ≥ 1280 px, vista lado a lado opcional.
4. **Los tres roles**: 3 tarjetas con color e ícono de rol, encabezado con el rol, máx. 3 bullets; en móvil carrusel horizontal con scroll-snap y puntos.
5. **Comprueba lo aprendido**: `AnswerOption` en lista, botón "Comprobar" deshabilitado hasta elegir; al comprobar, **barra inferior de feedback** que sube desde abajo: verde con "Correcto" + explicación, o roja "No es esa" + explicación + "Ver la respuesta". Animaciones pop/shake.
6. **Práctica**: monta los componentes del Agente 5.
7. **Resumen**: pantalla de celebración: anillo de la lección llenándose, check dibujado, chispas, "Lección completada", 3 ideas clave en tarjetas, "+N tarjetas añadidas a tu repaso", si completa la etapa → la `Badge` de la etapa aparece con animación. Botones: "Siguiente lección" (primario) y "Volver a la ruta".
8. Pie fijo: "Anterior" (ghost) y "Siguiente"/"Comprobar" (primario, ancho completo en móvil), alto 64 px + safe area.
9. Transición entre pasos: fade + desplazamiento 12 px en la dirección de avance. Scroll al inicio del paso al cambiar.

---

### Agente 5 · Simuladores y práctica

**Debe conocer**: sección 2; `src/components/LessonVisualizers.jsx`, `src/components/visualizers/SimulatorsPackA.jsx`, `SimulatorsPackB.jsx`, `AuthenticCodeLab.jsx`, `PipelineOrderChallenge.jsx`. Probar los 18 simuladores antes y después.
**Referencias**: Brilliant (manipulables con respuesta visual inmediata), Observable/Explorable Explanations de Bret Victor y Nicky Case (explicaciones interactivas), Codecademy/Scrimba (panel de código + comprobar).
**Archivos**: los 5 anteriores + `src/styles/views/simulators.css`.
**Tareas**
1. **Eliminar todos los `style={{}}`** (~130 en estos archivos) y pasarlos a clases en `simulators.css`. Colores dinámicos vía variables CSS.
2. Marco común de simulador: cabecera con ícono de etapa + título + botón "Reiniciar"; zona de controles (toggles como segmented control con color de etapa); zona de resultado; pie con "Qué observar" en una línea.
3. Tablas: componente común con cabecera sticky, primera columna sticky en móvil, números alineados a la derecha en mono, filas resaltadas cuando el simulador las cambia (fondo que se desvanece de `--warning-soft` a transparente en 900 ms), filas duplicadas/erróneas en `--danger-soft`.
4. Resultados numéricos grandes con animación de conteo (`requestAnimationFrame`, respetando reduced-motion).
5. Comparaciones (antes/después, SCD1/SCD2, fila vs columnar) como barras horizontales de color en lugar de solo texto.
6. `AuthenticCodeLab`: editor con números de línea, tema de código con colores de sintaxis simples (palabras clave en `--primary` claro, strings en verde, números en ámbar) sobre `--code-bg`; botón "Comprobar" con estados (cargando, correcto con pop, incorrecto con shake + pista).
7. `PipelineOrderChallenge`: tarjetas arrastrables con asa visible, alternativa con botones ↑↓ en móvil (sin depender de drag), feedback por tarjeta.
8. Todo usable a 360 px sin scroll horizontal de la página (solo dentro de tablas).

---

### Agente 6 · Vistas secundarias + tutor

**Debe conocer**: sección 2; `SpacedRepetitionView.jsx`, `CapstoneProjectsView.jsx`, `GlossaryAndGraphView.jsx`, `LearningAnalyticsView.jsx`, `DiagnosticModal.jsx`, `TutorPanel.jsx`.
**Referencias**: Anki / Quizlet (flashcards y calificación), Khan Academy (página de progreso y dominio), Exercism (proyectos), Duolingo (diagnóstico de nivel con una pregunta por pantalla).
**Archivos**: esos 6 + `src/styles/views/secondary.css`, `src/styles/views/tutor.css`.
**Tareas**
1. Eliminar todos los `style={{}}` de sus archivos (~220).
2. **Repaso**: flashcard grande centrada con color de la etapa de la tarjeta, volteo 3D al revelar (reduced-motion: fundido), 4 botones de calificación de colores (Otra vez rojo, Difícil ámbar, Bien verde, Fácil azul) con atajos 1–4 y el intervalo siguiente debajo de cada uno, barra de sesión "3 de 12". Al terminar: pantalla de sesión completada con resumen.
3. **Proyectos**: tarjetas grandes con ilustración/ícono, etapas requeridas como chips de color, lista de requisitos con checks reales, estado bloqueado/disponible/completado.
4. **Glosario**: buscador sticky, filtro por etapa (chips de color), índice A–Z; detalle con definición, ejemplo de código y "Aparece en" con enlaces a lecciones coloreados por etapa. En móvil, detalle en `Sheet`.
5. **Mi progreso**: anillos por etapa en grilla, barras de aciertos por rol (colores de rol), calendario/lista de lecciones completadas con fecha si existe en el estado; si no existe, no se muestra.
6. **Diagnóstico**: modal a pantalla completa en móvil, una pregunta por pantalla con `AnswerOption`, barra de progreso, resultado final con la etapa recomendada destacada en su color y botón "Empezar ahí".
7. **Tutor**: panel derecho 400 px en ≥ 1280 px (empuja contenido), `Sheet` a pantalla casi completa en móvil. Burbujas de chat diferenciadas, chip con la lección actual como contexto, sugerencias rápidas, indicador "escribiendo" con 3 puntos animados, input con botón enviar de 44 px.

---

### Agente 7 · Ilustraciones y marca

**Debe conocer**: sección 2.5 (colores de etapa) y la temática de cada etapa (leer los títulos y descripciones de `src/data/stages/`).
**Referencias** (solo estilo, no copiar): ilustraciones planas geométricas de Stripe y Linear, iconografía de Phosphor/Lucide para grosor de trazo, estilo "isometric data" de diagramas técnicos.
**Archivos**: `src/assets/illustrations/**`, `src/assets/brand/**`, `src/components/ui/Illustration.jsx`, `public/favicon.svg`.
**Tareas**
1. **6 ilustraciones de etapa** en SVG inline (≤ 6 KB cada una, `viewBox` 240×160), estilo geométrico plano, 3 tonos de su etapa (`--stage`, `--stage-soft`, `--stage-deep`) + un neutro, usando `currentColor`/variables para que funcionen en oscuro. Temas: 1 tablas unidas por líneas (JOIN); 2 estrella con nodos (star schema); 3 columnas de bloques apiladas (Parquet); 4 lago con capas bronce/plata/oro; 5 curva de campana con barras; 6 flujo de eventos entrando a un nodo con chispa (IA).
2. **5 ilustraciones de estado vacío**: sin repaso pendiente, sin proyectos completados, búsqueda sin resultados, lección completada, error de conexión del tutor.
3. **Logo**: isotipo simple (tres barras o tres nodos que representen DE/DA/BI con los colores de rol) + logotipo "Manual de Datos" en Plus Jakarta Sans 800. Versión solo isotipo para la barra colapsada y favicon.
4. Componente `Illustration` con prop `name` y `size`, `aria-hidden` por defecto.
5. Nada de personajes, caras ni mascotas.

---

### Agente 8 · QA y pulido (Fase 3)

**Debe conocer**: todo el documento. No escribe funcionalidades; corrige detalles pequeños o reporta al dueño del archivo con captura + `archivo:línea`.
**Referencias**: WCAG 2.2 AA, Lighthouse, checklist de responsive de web.dev.
**Tareas**: recorrer la app a 360, 390, 768, 1024, 1280 y 1440 px, en claro y oscuro, con ratón, teclado y táctil emulado, y verificar la lista de abajo. Entregar un informe con ✅/❌ por punto y capturas de todas las pantallas.

## 4. Criterios de aceptación

**Visual**
- [ ] Cada una de las 6 etapas es reconocible por su color en Inicio, Ruta, reproductor, repaso y glosario.
- [ ] Ninguna pantalla es solo blanco + gris: cada vista tiene al menos un elemento de color con significado (etapa, estado o acción).
- [ ] Las 6 ilustraciones de etapa y 5 de estado vacío están en uso.
- [ ] `?ui=1` muestra todos los componentes y estados en claro y oscuro.

**E-learning**
- [ ] Responder un quiz muestra feedback inmediato (barra inferior + animación) sin recargar.
- [ ] Completar una lección muestra la pantalla de celebración y actualiza anillo global, nodo de etapa, tarjeta de la Ruta y métricas de Inicio.
- [ ] Completar las 3 lecciones de una etapa desbloquea su insignia (probar con la etapa 1).
- [ ] "Continuar" lleva al paso exacto (avanzar a paso 3 de la lección 2, recargar, pulsar Continuar).
- [ ] Un usuario nuevo ve 0 tarjetas de repaso hasta que empieza una lección.

**Responsive**
- [ ] Sin scroll horizontal de página a 360 px en ninguna vista (`document.documentElement.scrollWidth === innerWidth`).
- [ ] Ningún elemento se superpone ni se sale de su contenedor a 360/390/768/1024/1280/1440 px.
- [ ] < 768 px: barra inferior de pestañas visible fuera de lecciones y oculta dentro.
- [ ] En la lección a 390 px, la cabecera sticky + barra de progreso ocupan ≤ 64 px; "Paso X de 7" aparece una sola vez.
- [ ] Todos los objetivos táctiles ≥ 44 px.

**Código**
- [ ] `grep -rc "style={{" src/` → solo usos con variables CSS (`'--...'`); reportar el total.
- [ ] `grep -rE "--paper|--ink|--accent|--rule|--ok\b" src/` → 0.
- [ ] No hay dependencias nuevas en `package.json`.
- [ ] Las claves `ruta_datos_2026_*` siguen intactas; el progreso guardado antes de esta iteración sigue apareciendo.
- [ ] Los 18 simuladores, quiz, laboratorio, reto de pipeline, diagnóstico, repaso y tutor funcionan (probar lecciones 1, 5, 7, 10, 14, 18).
- [ ] Lighthouse móvil: Accesibilidad ≥ 95, Rendimiento ≥ 85.
- [ ] Contraste AA verificado en claro y oscuro, incluido texto sobre cada color de etapa.
- [ ] `npm run build` sin errores ni warnings.
