# Tarea FIX-U: corregir fallos, rehacer el tutor, instalar shadcn/ui y aplicar unslop a Grano

Eres el ORQUESTADOR. Proyecto: `C:\Users\T490s\Desktop\Proyectos\ING`.

Esta tarea no está terminada cuando parece terminada. Está terminada cuando **todas** las compuertas de este archivo pasan y su salida real está pegada en `docs/reportes/FIX-U.md`. Si te queda la duda de si algo está hecho, no está hecho.

No uses 21st.dev en ningún paso: es de pago y el usuario lo descartó.

**Por qué existe esta tarea.** `docs/reportes/FINAL.md` y la etiqueta `v2.0.0-grano` declararon el proyecto cerrado con 10/10 flujos e2e, 73 tests y `D.3 OK`. Aun así, una revisión manual el 30-oct-2026 en esa misma versión encontró:

- La app queda **en blanco** al ir de Ajustes a Hoy.
- La lección anterior a "Tipos de dato" es "Servidores MCP".
- Hay texto en Arial y comillas invertidas visibles.
- Las filas de los resultados SQL se pintan **encima** del encabezado.
- En el tutor, los mensajes ocupan menos de la mitad del panel.

Tener las pruebas en verde no basta: **hay que mirar la pantalla y usarla como un alumno.** `FINAL.md` no cuenta como evidencia de nada de esta tarea.

---

## Reglas que no se negocian

1. **No declares nada terminado sin evidencia.** Cada paso necesita archivo y líneas, salida real de un comando o captura. Prohibido escribir "debería funcionar", "implementado correctamente" o "listo" sin esa evidencia.
2. **No uses en `main` ni en ningún worktree ajeno:** `git clean`, `git stash -u`, `git reset --hard`, `git checkout .` ni `git restore .`. Una instalación de shadcn sin commitear ya se perdió en este proyecto. Antes de cualquier operación de git que toque archivos, ejecuta `git status --short` y confirma que nada sin commitear se va a perder.
3. **Trabaja en un worktree:** `git worktree add ../ING-FIX-U -b agente/FIX-U main`. Haz commit al terminar cada fase. Fusiona a `main` con `git merge --no-ff` solo en la Fase 7.
4. **No hagas `git push`.** Lo decide el usuario.
5. **No debilites ninguna prueba.** Prohibido borrar, saltar o relajar tests, cambiar compuertas o desactivar scripts de `check`. Si un test e2e depende de un texto que este archivo manda cambiar (por ejemplo `CONTINUAR`), actualiza solo ese texto y anótalo en el reporte.
6. **No cambies lo que hace el producto.** Conserva funciones, contenido de las lecciones, orden de las secciones, nombre, logo, colores de marca y fuentes. No inventes datos, cifras, testimonios ni funciones.
7. **No sustituyas una decoración por otra.** Prohibido agregar degradados de color, brillos, glassmorphism, ruido, blobs, emojis, iconos de chispa o animaciones en bucle.
8. **Si te bloqueas 3 veces en lo mismo,** escribe en `docs/reportes/bloqueos.md` qué probaste y qué error salió, y sigue con el siguiente paso independiente. Un bloqueo abierto impide declarar el final: al terminar lo demás, vuelve a él. Si sigue sin resolverse, entrégalo como **INCOMPLETO** y di qué falta.
9. **Quien implementa no se aprueba a sí mismo.** Cada fase la revisa un subagente distinto, en una conversación nueva, que repite las compuertas y no confía en lo que dice el reporte.
10. **Si una tarea se resuelve en pocos pasos, sospecha.** Relee el paso y compáralo punto por punto con lo que hiciste.

## Subagentes

| Subagente | Fases | Modelo |
|---|---|---|
| `FIX-U-BUGS` | 1 | Gemini 4 Argon High |
| `FIX-U-SHADCN` | 2 y 3 | Gemini 4 Argon High |
| `FIX-U-TUTOR` | 3T | Gemini 4 Argon High |
| `FIX-U-UNSLOP` | 4 y 5 | Gemini 4 Argon High |
| `FIX-U-REVISOR` | Revisa cada fase y hace la Fase 6 | Gemini 4 Argon Medium; nunca el mismo agente que implementó |

Las fases van en orden. No lances una hasta que el revisor apruebe la anterior.

Cada subagente lee antes de tocar nada: este archivo completo, `DESIGN.md`, `PRODUCT.md`, `src/styles/tokens.css` y los archivos que su fase nombra. `FIX-U-UNSLOP` además lee completos `.claude/skills/unslop/SKILL.md`, `references/signs.md` y `references/tokens.md`.

Los números de línea de este archivo son aproximados. Localiza el código por su contenido.

## Formato del reporte `docs/reportes/FIX-U.md`

Por cada paso: qué cambió (archivo y líneas), comando ejecutado, salida real recortada a lo relevante y captura si aplica.

Por cada fase: la tabla de compuertas con `PASA` o `FALLA`, la salida pegada y el veredicto del revisor. Al final: sección **Pendiente**, con el motivo de cada cosa que quedó sin hacer. Dejarla vacía cuando falta algo cuenta como un reporte falso.

---

## Fase 0: preparación

**Inicio.** Q1, Q2, Q3 y FINAL ya están fusionadas (`main` en `6ad6155` o posterior). Si otro agente sigue trabajando en este proyecto, detente y avísale al usuario.

**Pasos.**
1. En `main`, ejecuta `git status --short` y pega la salida en el reporte. Al escribir este plan estaban sin commitear `Grano.cmd`, `skills-lock.json`, `.agents/skills/shadcn/`, `.agents/skills/unslop/`, `.claude/`, este archivo y las carpetas `.agents/skills/21st-*`.
2. Haz commit, en `main` y nombrando cada ruta en el `git add`, de `.claude/skills/unslop/`, este archivo, `Grano.cmd`, `skills-lock.json`, `.agents/skills/shadcn/` y `.agents/skills/unslop/`. Antes revisa `git diff Grano.cmd`: si no entiendes un cambio, repórtalo. Prohibido `git add -A`.
3. Borra las 8 carpetas `.agents/skills/21st-*` (no están en git) y, si existe, `.21st/`. Quita de `skills-lock.json` las entradas de 21st, si las hay.
4. Crea el worktree `../ING-FIX-U`, instala dependencias (`npm install`) y corre la línea base: `npm test`, `npm run build`, `npm run check`, `npm run test:e2e`. Pega las salidas. Si algo ya fallaba, anótalo como "fallaba antes" con el mensaje exacto.
5. Lee `scripts/shots.mjs` y guarda capturas "antes" en `docs/reportes/capturas/FIX-U/antes/` de Hoy, Ruta, Lección, Práctica, Repaso, Glosario, Progreso, Proyectos y Ajustes, a 1280×720 y 390×844, en tema claro y oscuro, con usuario nuevo y con el fixture `tests/fixtures/progress.json`.
6. Agrega capturas "antes" de estos dos estados, que son los que el usuario reclamó, a 1280×720 y 390×844:
   - **`sql-scroll`:** en Práctica, ejecuta una consulta de 14 filas o más y desplaza la tabla de resultados 40 px.
   - **`tutor-chat`:** panel del tutor abierto en una lección, con una conversación de 2 preguntas y 2 respuestas con bloque SQL (usa `GRANO_AI_MOCK=1`).

**Resultado esperado.** Worktree creado, línea base registrada y 72 capturas de vistas (9 vistas × 2 tamaños × 2 temas × 2 estados) más las de los 2 estados nuevos, o una lista de las que faltan con el motivo.

**Compuerta 0.** `git log -1 --stat` en `main` muestra el commit de la skill. `ls .agents/skills | grep -c 21st` da `0`. `git status --short` en el worktree está limpio.

---

## Fase 1: fallos funcionales (`FIX-U-BUGS`)

Para **cada** fallo: primero escribe una prueba que falle, pega esa salida en rojo, corrígelo y pega la salida en verde. Sin el rojo, el fallo cuenta como no corregido.

### 1.1 Pantalla en blanco de Ajustes a Hoy

- **Causa:** en `src/views/HomeView.jsx` (línea ~91) hay un `return <SettingsView .../>` condicional antes de varios `useMemo`. React lanza `Rendered more hooks than during the previous render` y la app queda vacía.
- **Arreglo:** mueve esa decisión fuera de `HomeView` o divide el componente en dos: un contenedor que decide y un `HomeContent` con todos los hooks. Ningún hook puede quedar después de un `return` condicional.
- **Prueba e2e:** Ajustes → Hoy → Ajustes → Hoy, cinco veces. `#root` no queda vacío, `main h1` dice `Hoy` y la consola no tiene errores.

### 1.2 Sin red de seguridad

- Crea `src/components/ErrorBoundary.jsx` y envuelve con él la vista activa en `src/App.jsx`, de modo que la barra lateral siga viva.
- Muestra una frase que diga qué pasó y qué hacer, y un botón `Volver a Hoy`. Escribe el error en `console.error`.
- **Prueba:** un componente de prueba que lanza un error muestra ese mensaje y no una página en blanco.

### 1.3 Orden de lecciones

- **Síntomas:** en "Tipos de dato", `Lección anterior` lleva a "Servidores MCP" (experto). En Hoy, "Siguiente en tu ruta" propone JOINs en vez de "Por qué NULL no es cero".
- **Causa:** `scripts/sync-lessons-index.mjs` pone primero las lecciones heredadas (`legacyOrder`), y `src/state/useAppController.js` (líneas ~215-221) y `upcomingLessons` en `HomeView.jsx` (línea ~253) recorren ese arreglo.
- **Arreglo:** crea en `src/data/lessons/index.js` una función `getRouteLessons(trackId)` que devuelva las lecciones en el orden de `getTrackPath(trackId)`, usando `entry.v2Id` y comparando contra `lesson.v2Id`. Sin área elegida, usa `de`, igual que `routeModules` en Hoy. Úsala para `prevLesson`, `nextLesson` y `upcomingLessons`. Agrega la función también a la plantilla de `scripts/sync-lessons-index.mjs`, porque ese script reescribe `index.js` completo.
- **Pruebas:**
  - Para `de`, `da` y `bi`: la primera lección no tiene anterior y la última no tiene siguiente.
  - Niveles no decrecientes a lo largo de cada ruta.
  - Ningún salto dentro de un módulo: `order` consecutivo.
  - La siguiente de `c0-datos-01-tipos-dato` es `c0-datos-02-null-vacio`.
  - Correr `node scripts/sync-lessons-index.mjs` deja `git diff --stat src/data/lessons/index.js` vacío.

### 1.4 Arial dentro de botones

- **Causa:** `src/styles/reset.css` no hace heredar la fuente a los controles.
- **Arreglo:** agrega en el reset `button, input, select, textarea, optgroup { font: inherit; color: inherit; letter-spacing: inherit; }`. Revisa que no se rompan los botones con `color` propio; los que dependan de ese comportamiento se corrigen en su regla.
- **Prueba e2e:** en las 9 vistas, en ambos temas, recorre todos los nodos con texto de `main` y falla si la primera familia de `getComputedStyle(e).fontFamily` no es `IBM Plex Sans`, `IBM Plex Mono` o `Newsreader Variable`.

### 1.5 Comillas invertidas visibles

- **Síntoma:** en Hoy se lee `` `INTEGER` `` literalmente.
- **Arreglo:** renderiza `goal` con `formatInlineText` de `src/utils/formatText.jsx` en `HomeView.jsx` (líneas ~360 y ~470) y en cualquier otro lugar donde aparezca. Busca con `grep -rn "\.goal\|\.subtitle\|\.summary" src/views src/components` y revisa cada resultado.
- **Prueba e2e:** en las 9 vistas y en 5 lecciones, ninguna cadena de `main.innerText` contiene una comilla invertida, salvo dentro de `pre` o `code`.

### 1.6 Tarjetas vencidas incoherentes

- **Síntoma:** Hoy mostró `3 tarjetas vencidas` sin ninguna lección completada, mientras Repaso decía `0 pendientes`.
- **Arreglo:** localiza `effectiveDueCount` en `HomeView.jsx` y la cuenta de `SpacedRepetitionView.jsx`. Hoy y Repaso deben obtener el número de una sola función. Si al investigar resulta que no es un fallo, explica por qué con evidencia y haz que ambas pantallas digan lo mismo.
- **Prueba e2e:** usuario nuevo que abre una lección y vuelve a Hoy: el número es el mismo en Hoy y en Repaso, y es `0` si no completó ninguna lección.

### 1.7 Temario en móvil

- **Síntoma:** al pasar de 1280 a 375 de ancho sin recargar, el temario se queda abierto y deja el texto en una columna estrecha, con palabras partidas como `equipami-ento`.
- **Arreglo:** por debajo de 768 px, el temario solo puede abrirse como panel superpuesto y empieza cerrado.
- **Prueba e2e:** en una lección a 1280, reduce a 375 sin recargar: `main h1` mide al menos 320 px de ancho.

### 1.8 Filas de resultados SQL encima del encabezado

- **Síntoma:** en Práctica, al desplazar los resultados, el texto de las filas (`Cono Sur`, `Tienda Palermo Soho`) se superpone a `region`, `store_name` y demás encabezados. Reproducido: con la tabla desplazada 40 px, `document.elementsFromPoint` en un `th` devuelve primero `TD`.
- **Causa confirmada:** `src/styles/views/lab.css` (línea ~324) aplica `animation: row-stagger ... both` a `.sql-results-table tr:nth-child(-n + 12)`. Ese selector incluye **la fila de `thead`**. El `both` deja un `transform` activo en cada `tr`, y eso crea un contexto de apilamiento que deja atrapado el `z-index: 2` del `th`. Al desactivar esa animación desde el navegador, el `th` volvió a quedar arriba.
- **Arreglo:**
  1. Elimina esa regla y el escalonado de filas de `src/lab/SqlLab.jsx` (`sql-row-stagger` y `animationDelay`). Una tabla de datos aparece de inmediato.
  2. Usa `border-collapse: separate; border-spacing: 0` en `.sql-results-table`, porque con `collapse` los bordes del `th` fijo se pierden al desplazarse.
  3. Da al `th` una línea inferior que siga visible al desplazarse (`box-shadow: inset 0 -1px 0 var(--line-control)`).
  4. Revisa con `grep -rn "<thead" src` las demás tablas (`LessonPlayer.jsx`, `LessonWorkedExample.jsx`, `tutor/CodeBlockWithActions.jsx`, `utils/formatText.jsx`, `LessonVisualizers.jsx`, `visualizers/SimulatorsPack*.jsx`) y anota en el reporte, una por una, si tiene encabezado fijo y si le afecta. Ninguna tabla con `th` fijo puede tener `animation`, `transform`, `filter` ni `opacity` menor a 1 en un ancestro dentro del área de desplazamiento.
- **Prueba e2e, en Práctica y en la práctica dentro de una lección, en ambos temas:** ejecuta una consulta de 14 filas o más y desplaza a 0, 40 y 200 px. En cada posición, para **cada** `th`: `document.elementFromPoint(centroX, centroY)` debe ser ese `th` o un descendiente. Además, `getComputedStyle(tr).transform` debe ser `none` en todas las filas.
- **Prueba visual:** captura `sql-scroll`, ábrela y describe qué se ve bajo el encabezado.

### 1.9 Etiquetas de ejercicios

- **Síntoma:** la lista de Práctica muestra `L70 · SQL DuckDB`. El número no le dice nada al alumno y, en lecciones sobre DAX o Power BI, puede sugerir un motor equivocado.
- **Arreglo:** reemplaza esa línea por el título del módulo, por ejemplo `Combinar tablas`. Revisa en `src/views/PracticeView.jsx` de dónde sale el tipo y confirma que cada ejercicio de una lección de DAX o Power BI pida de verdad lo que indica su etiqueta. Si un ejercicio pide SQL dentro de una lección de DAX, anótalo en Pendiente con la lista de lecciones; **no cambies el contenido de la lección.**
- **Prueba e2e:** ningún elemento de la lista contiene el patrón `L\d+ ·`.

**Compuerta 1.** `npm test`, `npm run test:e2e` y `npm run build` pasan. Cada uno de los 9 fallos tiene su salida en rojo y en verde en el reporte.

---

## Fase 2: instalar shadcn/ui (`FIX-U-SHADCN`)

Grano ya tiene `src/components/ui/Button.jsx` y otros componentes. Windows no distingue mayúsculas en los nombres de archivo, así que **los componentes de shadcn van en `src/components/shadcn/`** y nunca en `src/components/ui/`.

**Pasos.**
1. Instala dependencias:
   - `npm install class-variance-authority clsx tailwind-merge radix-ui`
   - `npm install -D tailwindcss @tailwindcss/vite tw-animate-css shadcn @types/node @types/react @types/react-dom typescript`
2. Crea `tsconfig.json` con `target` ES2022, `module` ESNext, `moduleResolution` bundler, `jsx` react-jsx, `allowJs` true, `strict` false, `noEmit` true, `skipLibCheck` true, `baseUrl` `.`, `paths` `{"@/*": ["./src/*"]}` e `include` `["src"]`.
3. En `vite.config.js`: agrega el plugin `tailwindcss()` antes de `granoAiPlugin()`, el alias `@` a `./src` y extensiones `.tsx`, `.ts`, `.mjs`, `.js`, `.jsx`, `.json`. **Conserva** el plugin de IA y todo lo demás.
4. Crea `components.json` con `style` new-york, `rsc` false, `tsx` true, `tailwind.css` `src/styles/shadcn.css`, `tailwind.baseColor` stone, `tailwind.cssVariables` true, `iconLibrary` lucide y estos alias: `components` `@/components`, `ui` `@/components/shadcn`, `lib` `@/lib`, `utils` `@/lib/utils`, `hooks` `@/hooks`. Sin registro `@21st`.
5. Crea `src/lib/utils.ts` con la función `cn` estándar (`twMerge(clsx(inputs))`). Si un componente generado importa `cn` del paquete `cn`, cámbialo a `@/lib/utils`.
6. Crea `src/styles/shadcn.css` e impórtalo como **última** línea de `src/styles.css`. Debe contener:
   - `@import "tailwindcss/theme" layer(theme);`
   - `@import "tailwindcss/utilities" source(none);`
   - `@import "tw-animate-css";`
   - `@source "../components/shadcn";`
   - `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));`
   - **No importes el preflight de Tailwind**: rompería `reset.css`.
   - El puente de variables en `:root, [data-theme="light"], [data-theme="dark"]`: `--background: var(--bg)`, `--foreground: var(--ink)`, `--card` y `--popover: var(--surface)`, `--card-foreground` y `--popover-foreground: var(--ink)`, `--primary: var(--ink)`, `--primary-foreground: var(--surface)`, `--secondary` y `--muted: var(--sunken)`, `--secondary-foreground: var(--ink)`, `--muted-foreground: var(--ink-2)`, `--accent: var(--brand-soft)`, `--accent-foreground: var(--ink)`, `--destructive: var(--bad)`, `--border: var(--line)`, `--input: var(--line-control)`, `--ring: var(--focus)`, `--radius: var(--r-2)`.
   - Un bloque `@theme inline` que exponga cada una como `--color-*` y los radios `--radius-sm/md/lg`. Confirma en `tokens.css` que todas las variables de origen existen.
7. Agrega a `package.json`: `"ui": "shadcn"` y `"ui:add": "shadcn add"`.
8. Instala los componentes: `npx shadcn@latest add select checkbox slider accordion dialog command tooltip chart`. Confirma que quedaron en `src/components/shadcn/`. Si `chart` trae Recharts, cárgalo solo en Progreso con `React.lazy`.
9. **Haz commit de inmediato.**

**Compuerta 2.**
- `git ls-files components.json tsconfig.json src/lib/utils.ts src/styles/shadcn.css` lista los 4 archivos.
- `ls src/components/shadcn` lista los 8 componentes y `src/components/ui` no contiene `.tsx`.
- `npx shadcn info` responde sin error. Pega la salida.
- En el CSS de `npm run build` no existen `.container{`, `.hidden{` ni `.table{` salvo que los use un componente de `src/components/shadcn/`. Si `source(none)` no funciona con esta importación, encuentra la forma correcta en la documentación de Tailwind v4, no quites la restricción. Pega la búsqueda.
- Las capturas de Hoy y Ruta, comparadas con las de "antes", no cambian nada visible. Pega ambas rutas de archivo y describe la comparación.
- `npm test` y `npm run build` pasan.

---

## Fase 3: usar shadcn donde aporta (`FIX-U-SHADCN`)

No reemplaces `Button.jsx`, `Card.jsx` ni otros componentes propios que funcionan. Solo estos cambios:

| Componente | Reemplaza en |
|---|---|
| `Select` | `SettingsView.jsx` (3), `CapstoneProjectsView.jsx` (1), `LearningAnalyticsView.jsx` (2), `tutor/InterviewSimulator.jsx` (2) y los `select` de `layout/ShellFallbackViews.jsx` |
| `Checkbox` | `CapstoneProjectsView.jsx` (2) y los `type="checkbox"` de `ShellFallbackViews.jsx` |
| `Slider` | `LessonVisualizers.jsx` y `visualizers/SimulatorsPackB.jsx` |
| `Accordion` | Módulos de `RoadmapView.jsx`, conservando la lógica actual de cuál abre |
| `Dialog` | La envoltura de `DiagnosticModal.jsx`, sin tocar sus preguntas ni su lógica |
| `Command` | La paleta `Ctrl+K`. Averigua cuál de `layout/CommandPalette.jsx` y `state/CommandPaletteModal.jsx` se usa, migra esa y elimina la otra. Conserva resultados, navegación por teclado y acciones |
| `Chart` | Los gráficos de `LearningAnalyticsView.jsx`, con un solo color de acento |

**Pasos para cada fila.** Lee el código, reemplaza, conserva `value`, `onChange`, las etiquetas y los `aria-*`, ajusta los estilos para que use los tokens de Grano y prueba con el ratón y con el teclado. Para los archivos con varios controles, cuenta antes y después.

**Compuerta 3.**
- `grep -rnE "<select|type=\"checkbox\"|type=\"range\"" src --include=*.jsx | grep -v UiShowcase` no devuelve nada. Pega la salida.
- Prueba e2e con solo teclado: `Ctrl+K` → busca `fan-out` → `Enter` abre la lección; un `Select` de Ajustes cambia con flechas; `Esc` cierra el diagnóstico y el foco vuelve al botón que lo abrió.
- Cambiar densidad, escala y tema en Ajustes sigue guardando el valor tras recargar.
- `axe-core` no reporta violaciones `critical` ni `serious` en Ajustes, Ruta, Progreso ni la paleta abierta, en ambos temas.
- El chunk principal no crece más de 15 KB en gzip respecto a la línea base. Pega ambos tamaños.
- Capturas a 1280×720 y 390×844 en claro y oscuro de cada vista tocada. Abre cada captura y describe lo que ves: los controles de shadcn deben parecer de Grano, sin azul ni gris por defecto.

---

## Fase 3T: el tutor es un chat (`FIX-U-TUTOR`)

**Problema medido.** A 1280×720, el panel mide 676 px de alto y 400 de ancho. Los controles se comen 358 px y los mensajes solo 319 (47 %):

| Bloque | Alto |
|---|---|
| Cabecera: título, línea de lección, modelo y 4 pestañas | 135 px |
| Modos: `Duda de la sección`, `Explicar error`, `Revisar SQL` | 64 px |
| **Mensajes** | **319 px** |
| 3 sugerencias, que siguen visibles durante toda la conversación | 91 px |
| Campo de texto | 68 px |

Además, el texto va a 14 px, el panel se queda al final de la respuesta en vez de al principio, y una respuesta corta con un bloque SQL ya llena lo visible.

**Inicio.** Lee completos `src/components/TutorPanel.jsx`, `src/styles/views/tutor.css`, `src/components/tutor/*` y `tests/e2e/run-e2e.mjs`. Haz una lista de **todas** las funciones actuales del panel: pestañas, modos, modelos, adjuntos, sugerencias, cancelar, nueva conversación, copiar, abrir en el laboratorio, errores y estado sin IA. Pégala en el reporte. Al final, cada una debe seguir funcionando.

**Pasos.**
1. **Cabecera de una sola fila, máximo 48 px.** Contiene: `Tutor`, el selector de vista (Chat, Explícalo, +3 preguntas, Entrevista) como `Select` compacto y, a la derecha, `Nueva conversación` y `Cerrar` como botones de icono con `aria-label`.
2. **Modelo y contexto en un menú.** Rápido/Profundo y la línea `Lección: ...` pasan a un menú abierto desde un botón de icono en la cabecera. El nombre de la lección no ocupa una fila fija.
3. **Modos dentro del campo de texto.** `Duda de la sección`, `Explicar error` y `Revisar SQL` salen de su fila y pasan a un selector pequeño a la izquierda del botón de enviar. El modo activo se ve como texto. La fila `.tutor-chat-modes` desaparece.
4. **Sugerencias solo con la conversación vacía.** Se muestran dentro del área de mensajes, junto al estado vacío, y desaparecen tras el primer mensaje.
5. **Campo de texto compacto.** Una línea de inicio (44 px como mínimo), crece con el texto hasta 5 líneas y luego se desplaza. Enter envía y Shift+Enter hace salto de línea.
6. **Ancho.**
   - De 900 a 1279 px de ventana: 420 px.
   - De 1280 px en adelante: 480 px.
   - Un botón `Ampliar` en la cabecera lleva el panel a 720 px, o a la ventana menos 240 px si es menor. La preferencia se guarda en `grano:v1` y sobrevive a recargar.
   - El panel superpuesto nunca tapa el campo de texto de la lección sin poder cerrarse con `Esc`.
7. **Móvil (menos de 900 px).** Hoja a pantalla completa (`100dvh`), con cabecera de 48 px y campo de texto fijo abajo, respetando `env(safe-area-inset-bottom)` y el teclado.
8. **Lectura de mensajes.**
   - Texto del tutor: `0.9375rem` (15 px), interlineado 1.6, color `--ink`, sin burbuja y a todo el ancho.
   - Mensaje del alumno: la misma fuente, con fondo `--sunken`, alineado a la derecha, máximo 85 %.
   - 24 px entre turnos y 12 px entre párrafos del mismo turno. Quita la línea inferior entre turnos.
   - El modelo y el tiempo pasan a una línea discreta de 12 px, en `--ink-3`, debajo de la respuesta.
   - Listas, títulos y negritas de la respuesta se renderizan como Markdown, sin asteriscos visibles.
9. **Código en mensajes.** Fuente de 13 px y altura máxima de 280 px con desplazamiento interno. `Copiar` y `Abrir en el laboratorio` son botones de icono con `aria-label` y tooltip, para que la barra del bloque no ocupe la mitad de una línea. Las tablas dentro de mensajes se desplazan en horizontal sin ensanchar el panel.
10. **Desplazamiento.**
    - Al enviar, el mensaje del alumno sube a la parte superior del área visible.
    - Durante el streaming, la vista **no** se mueve si el alumno se desplazó hacia arriba.
    - Si no está al final, aparece un botón `Ir al final`.
    - Al terminar la respuesta, el principio de la respuesta sigue visible; nunca salta al final de un texto largo.
    - El foco vuelve al campo de texto.
11. **Estados.** Mientras responde, muestra una sola línea discreta con el botón `Detener`. Los errores conservan el texto del alumno para reintentar. Sin `agy`, el mensaje dice qué hacer y el panel no se rompe.
12. **Limpieza.** Quita de `tutor.css` las reglas que queden sin uso y pega cuántas líneas tenía antes y después. Usa los componentes de shadcn instalados en la Fase 2 (`Select`, `Tooltip`).

**Resultado esperado.** Al abrir una conversación, lo que domina el panel es la conversación. Los controles están a un clic, pero no ocupan el espacio de lectura.

**Compuerta 3T.** Agrega estas pruebas e2e con `GRANO_AI_MOCK=1` y una respuesta simulada larga (al menos 3 párrafos, una lista y un bloque SQL):

| Medida | Dónde | Criterio |
|---|---|---|
| Alto de `.tutor-panel__messages` / alto del panel, con conversación | 1280×720, 1366×768 y 390×844 | **≥ 72 %** |
| Alto de la cabecera | Todas | ≤ 48 px |
| `.tutor-chat-modes` en el DOM | Todas | No existe |
| Sugerencias tras el primer mensaje | Todas | 0 visibles |
| `font-size` del cuerpo de la respuesta | Todas | ≥ 15 px |
| Ancho del panel | 1280×720 | 480 px |
| Ancho tras `Ampliar` y recargar | 1440×900 | 720 px |
| Desbordamiento horizontal del panel con SQL y tabla anchos | Todas | `scrollWidth <= clientWidth` |
| Desplazar arriba durante el streaming | 1280×720 | `scrollTop` no cambia y aparece `Ir al final` |
| Principio de la respuesta visible al terminar | 1280×720 | Su borde superior está dentro del área de mensajes |
| Shift+Enter | Todas | Salto de línea, sin enviar |
| `Esc` | Todas | Cierra el panel y el foco vuelve al botón `Preguntar` |

También:
- Cada función de la lista inicial tiene una prueba o evidencia. Ninguna se perdió.
- Prueba **una vez con `agy` real** (`npm run test:e2e:ai` y una pregunta manual) y pega la respuesta.
- `axe-core` sin `critical` ni `serious` en el panel, en ambos temas.
- Capturas `tutor-chat` "después" a 1280×720 y 390×844, en claro y oscuro, junto a las "antes". Ábrelas y describe: ¿cuántas líneas de respuesta se leen sin desplazar, antes y después?

---

## Fase 4: unslop, modo polish (`FIX-U-UNSLOP`)

El nivel es slop ligero: **no es un rediseño**. Conserva paleta, fuentes, logo y estructura.

**Dirección aprobada para todas las decisiones:**
- **Producto:** escuela de datos para hispanohablantes que estudian solos, de cero a experto.
- **Carácter:** paciente, exacto, de oficio.
- **Mundo:** cuaderno de trabajo y hoja de datos impresa: papel, tinta y filas.
- **Momentos:** la tabla de Hoy y la cuadrícula de Progreso (Fase 5).
- **Detalle propio:** la **fila marcada**.

Aplica las pasadas en este orden, en las 9 vistas y la lección completa. Termina una pasada en todas las vistas antes de empezar la siguiente, y haz un commit por pasada.

### Pasada 1: espaciado
En los CSS de `src/styles/views/`, los valores de margen, relleno y separación están en múltiplos de 4 px (se permite 2 px dentro de controles pequeños). Las filas de una misma lista miden igual y las tarjetas hermanas tienen el mismo relleno. Reporta cuántos valores cambiaste.

### Pasada 2: color
El acento (`--brand`) solo marca la acción principal, la selección y la fila marcada. Los fondos y bordes son neutros. Quita los degradados de las reglas de CSS que no sean un cambio de tono dentro de un mismo neutro.

### Pasada 3: iconos
Un solo set (`lucide-react`), a 16 px y trazo 1.5, con el color de su texto. Quita iconos que no aporten. Sin emojis en la interfaz.

### Pasada 4: textos

Reemplaza exactamente:

| Antes | Después |
|---|---|
| `PUNTO DE PARTIDA` | `Tu primera lección` |
| `CONTINUAR` (etiqueta) | `Continúa donde ibas` |
| `PREFERENCIAS Y DATOS LOCALES` | Quitar; el título `Ajustes` basta |
| `LABORATORIO PRÁCTICO · DUCKDB-WASM` | `Consultas reales sobre Mercado Brisa` |
| Título `Práctica interactiva y motor SQL` | `Práctica` |
| `REPETICIÓN ESPACIADA FSRS · N PENDIENTES HOY · N REPASADAS EN SESIÓN` | `N para hoy · N repasadas` |
| `REFERENCIA TÉCNICA · N TÉRMINOS VERIFICADOS` | `N términos` |
| `REGISTRO DE ESTUDIO · N LECCIONES COMPLETADAS · N COMPROBACIONES RESPONDIDAS` | `N lecciones · N comprobaciones` |
| `Escenario real` (`LessonPlayer.jsx` ~846) | `El caso` |
| `Las tarjetas FSRS se activan...` | `Aparecen al completar tu primera lección.` |
| `Hacer test diagnóstico (5 min)` | `Medir mi nivel (5 min)` |

Busca también el resto de los `sec-kicker` y aplica el mismo criterio: en minúsculas normales, sin jerga y sin punto final. La palabra `FSRS` no puede quedar en texto visible. `npm run check:copy` debe seguir en 0.

### Pasada 5: tipografía
- `text-transform: uppercase` desaparece de `src/styles/`: hoy son 29 reglas.
- Quita la separación amplia de letras de esas etiquetas.
- Títulos en Newsreader: peso 500. Interfaz: 400 y 500. El 600 solo para énfasis poco frecuente. Nada en 700 u 800.
- Cifras con `tabular-nums` y un solo formato.
- En `.lp-` y el texto de lectura, no toques el tamaño de `--fs-4` ni el interlineado.

### Pasada 6: disposición
Hoy tiene solo una acción principal (`Empezar lección`) y una secundaria (`Explorar ruta completa`). `Medir mi nivel` pasa a enlace de texto, debajo de ambas. Conserva las tarjetas de área.

### Pasada 7: detalles
Radios anidados coherentes: el interior es igual al exterior menos el relleno, con un mínimo de 4 px. Los contadores son texto discreto, sin pastillas de color. Los atajos usan `Kbd`. Hover y foco visibles, dentro de la paleta.

### Pasada 8: movimiento
Sin animaciones en bucle, salvo un indicador de carga mientras algo carga de verdad (revisa las 4 reglas con `infinite`). Sin `transition: all`. Sin animar `width`, `height`, `top`, `left` ni márgenes. Respeta `prefers-reduced-motion`.

**Compuerta 4.**
- `grep -rn "text-transform: *uppercase" src/styles | wc -l` da `0`.
- `grep -rnE "font-weight: *(700|800|900|bold)" src/styles | wc -l` da `0`.
- `grep -rnE "transition: *all" src/styles | wc -l` da `0`.
- `grep -rln "FSRS" src/views src/components --include=*.jsx` solo devuelve archivos donde `FSRS` aparece en comentarios o identificadores. Muestra cada caso.
- Prueba e2e: en las 9 vistas, ningún nodo de `main` con texto tiene `text-transform: uppercase` ni un peso de 700 o más.
- `npm run check`: los hallazgos no aumentan respecto a la línea base. `npm run check:contrast` da OK.
- Capturas "después" con la misma matriz de la Fase 0.

---

## Fase 5: los momentos propios de Grano (`FIX-U-UNSLOP`)

El nombre del producto viene de "grano": lo que representa una fila. El logo es una cuadrícula con una celda naranja.

### 5.1 La fila marcada
Crea una sola clase, `.grano-row-mark`: fondo `var(--brand-soft)` y línea izquierda de 2 px en `var(--brand)`, sin sombras ni brillos. Úsala **solo** en:
- la fila clave de la tabla de Hoy;
- la lección actual en la Ruta;
- la sección activa del temario;
- el ejercicio seleccionado en Práctica.

Quita los estilos de selección anteriores en esos 4 lugares. No la uses en ningún otro sitio.

### 5.2 La tabla de Hoy
En la tarjeta de la lección actual de Hoy, agrega a la derecha, en escritorio, una tabla pequeña con datos reales de esa lección.

- **Fuente de datos:** el `expectedOutput` del primer paso de `workedExample` que sea un arreglo no vacío, luego el de la primera sección con `example`. Son resultados ya verificados por `check:sql`. **No inventes filas.**
- Máximo 4 filas y 4 columnas, en IBM Plex Mono a 12 px.
- La fila 1 lleva `.grano-row-mark`.
- Debajo, en texto discreto: `Mercado Brisa · empresa ficticia`.
- Si la lección no tiene datos tabulares, no se muestra la tabla ni una caja vacía.
- En móvil va debajo de las acciones y, si no cabe, muestra menos columnas; sin texto bajo 11 px ni desborde.

### 5.3 La cuadrícula de Progreso
En Progreso, agrega arriba una cuadrícula con **una celda por lección de la ruta del usuario**, agrupada por nivel y en orden de `getRouteLessons`.

- Cuadrado de 12 px y separación de 4 px.
- Sin completar: `--sunken` con borde `--line`. Completada: `--ink`. Actual: `--brand`.
- Cada celda es un botón que abre su lección, con `aria-label` con el título y el estado.
- Arriba, una frase real: `N de M lecciones`.
- Con 0 lecciones se ve la cuadrícula vacía y la frase, sin mensajes motivacionales.

**Compuerta 5.**
- `grep -rn "grano-row-mark" src | wc -l` muestra exactamente la definición y los 4 usos. Pega la salida.
- Prueba unitaria: las filas de la tabla de Hoy salen del `expectedOutput` de la lección, y sin datos no se renderiza.
- Prueba e2e: con el fixture, el número de celdas completadas en Progreso es igual a las lecciones completadas de la ruta. Hacer clic en una celda abre esa lección.
- `axe-core` sin `critical` ni `serious` en Hoy y Progreso, en ambos temas.
- Sin desborde horizontal a 390×844 en Hoy, Ruta, Lección y Progreso: `document.documentElement.scrollWidth <= innerWidth`.

---

## Fase 6: revisión adversarial (`FIX-U-REVISOR`)

Un agente nuevo, sin contexto de la implementación, trabajando contra el reporte como si estuviera equivocado.

**Pasos.**
1. Corre desde cero, con `node_modules` limpio en el worktree: `npm install`, `npm test`, `npm run build`, `npm run check`, `npm run test:e2e`, `npm run test:e2e:ai`, `npm run ai:check`. Pega las salidas.
2. Repite **todas** las compuertas de las Fases 0 a 5 con tus propios comandos. No copies las salidas del reporte.
3. Con la app corriendo, recorre esto como usuario nuevo con el almacenamiento vacío: Hoy → elegir BI → nivel 0 → Ruta → abrir "Tipos de dato" → responder mal y bien una comprobación → resolver la práctica → completar → Siguiente → volver a Hoy → Progreso → Ajustes → Hoy → `Ctrl+K`. Anota errores de consola en cada paso. Debe haber **0 errores de consola**.
4. Abre tú mismo las capturas "antes" y "después" de cada vista. Por cada una escribe qué mejoró y qué sigue viéndose mal o genérico.
5. Pasa la lista de `.claude/skills/unslop/references/signs.md` y el "Checklist" de `SKILL.md` por las 9 vistas y marca cada punto con evidencia.
6. Comprueba estos casos límite: tema oscuro, ventana de 1280×720, `prefers-reduced-motion`, navegación solo con teclado, sin `agy` disponible, títulos de lección muy largos, usuario con todas las lecciones completadas.
7. Reclamos del usuario, en su propio uso:
   - En Práctica, ejecuta una consulta real de 14 filas o más y desplaza despacio: ninguna fila cruza por encima del encabezado.
   - Conversa con el tutor en una lección durante 4 turnos con `agy` real: ¿se lee cómodo sin desplazarse a cada rato? Si la respuesta es no, la Fase 3T no cumplió, aunque sus medidas pasen.
8. Pregúntate: si se cambiara el nombre de Grano por el de otro producto, ¿la pantalla Hoy seguiría encajando? Si la respuesta es sí, la Fase 5 no cumplió.

**Resultado.** Lista de defectos con severidad, archivo y captura. Todo defecto alto o medio regresa a su fase. Después de corregirlos, repite esta fase completa. **No hay límite de vueltas.** Solo pueden quedar en Pendiente los defectos bajos.

**Compuerta 6.** Veredicto escrito del revisor: `APROBADO`, con 0 defectos altos o medios, y la lista de comandos que él mismo ejecutó.

---

## Fase 7: cierre

**Pasos.**
1. Reúne en `docs/reportes/FIX-U.md`: el resumen por fase, todas las compuertas, las rutas de las capturas antes y después y la sección Pendiente.
2. Actualiza `docs/reportes/ESTADO.md` con una fila `FIX-U`.
3. En `main`, confirma con `git status --short` que no se perderá nada y ejecuta `git merge --no-ff agente/FIX-U`.
3b. Copia `docs/reportes/capturas/FIX-U/` del worktree a la misma ruta en `main`. Esas imágenes están en `.gitignore`, así que no viajan con la fusión, y el usuario las necesita para revisar.
4. **Desde `main`,** vuelve a correr `npm test`, `npm run build`, `npm run check` y `npm run test:e2e`, y confirma que `git ls-files components.json src/components/shadcn` no está vacío. Pega las salidas.
5. Si `npm run check` tiene hallazgos, compáralos con la línea base y lístalos con su motivo.
6. No hagas `git push`.

## Condición de terminado

Solo puedes decir que terminaste si se cumple **todo**:

- [ ] Las compuertas 0, 1, 2, 3, 3T, 4, 5 y 6 están en `PASA` con salida real en el reporte.
- [ ] Los 9 fallos de la Fase 1 tienen prueba en rojo y en verde.
- [ ] Ningún `th` queda tapado por filas en ninguna posición de desplazamiento.
- [ ] Los mensajes del tutor ocupan al menos 72 % del panel, medido.
- [ ] shadcn está commiteado y sus archivos están en `main`.
- [ ] Las pruebas y el build pasan desde `main`, después de la fusión.
- [ ] Hay capturas antes y después de las 9 vistas en ambos tamaños y temas.
- [ ] El revisor, que no implementó nada, escribió `APROBADO`.
- [ ] Ningún test se borró, saltó ni debilitó. `git diff main~1 --stat -- tests` y la revisión de sus cambios lo demuestran.

Tu mensaje final debe contener: la tabla de compuertas, la salida final de `npm test` y `npm run test:e2e`, el commit de fusión, la lista de Pendiente y la ruta del reporte.

Si algo falta, tu mensaje final empieza con **INCOMPLETO** y dice qué falta. Decir INCOMPLETO con honestidad está permitido. Decir "terminado" sin cumplir esta lista es la única forma de fallar esta tarea.
