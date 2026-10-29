# Plan maestro — De "Manual de Datos" a **Grano**

> **Para quién es este documento:** para Gemini 4 Argon trabajando en Antigravity (Agent Manager) como **orquestador** de muchos subagentes.
> **Proyecto:** `C:\Users\T490s\Desktop\Proyectos\ING` (React 19 + Vite 6, servidor IA local como plugin de Vite).
> **Fecha de referencia:** 29 de octubre de 2026.
> **Redactado tras inspeccionar** el código completo, la app corriendo en `http://127.0.0.1:5174` a 1280×720, 1600×900 y 375×812, y el puente IA ejecutado de verdad contra `agy` y `gemini`.

### Ya hecho antes de entregarte este plan (no lo repitas ni lo deshagas)

1. **Arreglo urgente del tutor** en `server/aiUltraBridge.js`, `src/App.jsx` y `src/components/TutorPanel.jsx`:
   - Usa siempre `agy` con el prompt por `stdin`, `--model <id>`, `--sandbox` y `--disable-slash-commands`, en una carpeta temporal vacía (`os.tmpdir()/grano-ai-*`). `gemini` CLI ya no se usa salvo petición explícita.
   - Selector de modelo: `fast` → `gemini-3.8-flash-low`, `deep` → `gemini-4-argon-medium` (cambiables con `GRANO_AI_MODEL_FAST` / `GRANO_AI_MODEL_DEEP`).
   - **Eliminada** la respuesta pre-escrita (`buildExpertSynthesis`) del servidor y la del `catch` del cliente. Ahora un fallo devuelve `{ ok: false, code, message, fix }` (`classifyCliError`) y el panel lo muestra como error.
   - Medido el 29-oct-2026 vía `/api/ai/query`: Flash **6,1 s**, Argon **15,8 s**; en la interfaz, Flash 7,2 s.
   - Las respuestas se muestran con Markdown básico (`renderMarkdown` en `src/utils/formatText.jsx`: títulos, listas, bloques de código, sin inyectar HTML). El campo de pregunta se vacía al enviar (antes no lo hacía).
   - **Pendiente para T2/T11:** streaming SSE, cancelación (matar el proceso si el cliente se va), historial, contexto por `lessonId` construido en el servidor, servidor `npm start` fuera de Vite, botones "Copiar" / "Abrir en el laboratorio" en los bloques de código,.
2. **Raíz ordenada:** `PROMPT_REDISENO.md`, `PROMPT_ELEARNING.md`, `PROMPT_ITERACION_2.md` y `security_best_practices_report.md` movidos a `docs/archivo/`. Creada `docs/reportes/`. `tests/verify_platform.py` usa `engineMode: "fast"`.
3. **Fase 0 adelantada en parte:** `git init`, `.gitignore` y **commit inicial `8492503`** ya hechos (rama por defecto); a partir de aquí cada subagente trabaja en su rama/worktree. Creado `scripts/shots.mjs` y guardadas 64 capturas de línea base en `docs/reportes/capturas/F0-antes/` (9 vistas × 1280×720, 1440×900, 390×844 × claro/oscuro). La del tutor en móvil se añadió después en `F0-despues-tanda1/`.
4. **Primera tanda visual y de marca (aplicada y verificada en capturas `docs/reportes/capturas/F0-despues-tanda1/`, 52 imágenes):**
   - **Marca Grano:** logo de cuadrícula 3×3 con una celda naranja (`src/assets/brand/BrandMark.jsx`, `public/favicon.svg`), wordmark "grano", `<title>Grano</title>`, `meta description` y `theme-color`, `package.json` → `"name": "grano"`. "Inicio" pasa a llamarse **Hoy** en la navegación.
   - **Fuentes autoalojadas** (`src/styles/fonts.css`): IBM Plex Sans 400/500/600, IBM Plex Mono 400/500, Newsreader variable. Eliminado Google Fonts de `index.html`. Todos los `font-weight: 700/800` de `src/styles/` pasaron a 600 (esos pesos no se cargan).
   - **Paleta de §4.1** en `src/styles/tokens.css` con los tokens nuevos (`--ink*`, `--sunken`, `--line*`, `--brand*`, `--track-*`, `--shadow-pop`, `--dur-1..4`, `--ease-*`). **Los nombres antiguos (`--primary`, `--text`, `--stage*`, `--role-*`…) siguen existiendo como alias** de la paleta nueva. Las 6 etapas ya no tienen color propio: todas usan `--brand`. Radios reducidos (4/6/10 px), sombras de tarjeta eliminadas. Contraste de todos los pares de texto calculado: ≥ 4.5:1 en ambos temas.
   - **Botón primario** en tinta (`--ink`), sin sombra "presionable"; eliminadas también las de los botones `success` y `stage`.
   - **Degradados eliminados** del hero de Inicio, la cabecera de etapa de la Ruta y el resumen de lección. Solo quedan los de sombra de scroll de `simulators.css` (funcionales).
   - **Hoy:** fuera el bloque "Buenos días" con degradado e ilustración; ahora es el título "Hoy" + una línea de estado en mono. Reescritos 8 textos de relleno de esa vista ("inaugurar tu recorrido", "insignia a todo color", "Calibra tu punto de partida"…).
   - **Catálogo de la ruta (borrador):** `src/data/catalog/tracks.js` (core, de, da, bi con "qué harás en tu trabajo"), `levels.js` (0–4 con resultado esperado) y `modules.js` (32 módulos, 154 lecciones, las 18 actuales ubicadas con `legacyId`; cada módulo con objetivo, prerrequisitos y proyecto). Validador `scripts/check-catalog.mjs` (`npm run check:catalog` → OK).
   - **Pendiente de esta tanda (sigue siendo trabajo de T1/T6/T7/T12):** renombrar los alias, escala/densidad (§4.5), `rem`, chips y tarjetas aún con estilo antiguo (bordes naranja de 3 px en "Continuar", chips pastel), el anillo de progreso de la Ruta, las ilustraciones de etapa y el resto del copy.
   - **También arreglado:** el selector de tema del header ahora refleja el tema real (antes marcaba "Claro" con `?theme=dark`), y en móvil la cabecera de la lección tiene un botón **Preguntar** que abre el tutor (solo visible < 768 px). T11 debe rediseñar ese acceso, no quitarlo.
5. **Segunda tanda: tamaño de interfaz y ruta por área (aplicada y verificada con Playwright, sin errores JS):**
   - **Tamaño de la interfaz:** selector "Tamaño" en la cabecera (Auto, 80 %, 90 %, 100 %, 110 %, 125 %), guardado en `localStorage` (`grano_ui_scale`). Se aplica con `zoom` sobre `<html>` mediante `data-scale` y la variable `--zoom` (`tokens.css`, final del archivo). Todas las unidades `vh`/`dvh`/`vw` de `src/styles/` se dividen entre `var(--zoom, 1)` para que los paneles de altura completa sigan ocupando la pantalla. **Auto** = 90 % entre 1024 y 1440 px de ancho o con altura ≤ 800 px. Verificado a 1280×720: la barra lateral ocupa los 720 px en todas las escalas y no hay scroll horizontal.
   - **Ruta por área:** `src/views/TrackPathView.jsx` + `src/styles/views/track-path.css`, montada arriba de la vista Ruta. Sin área elegida muestra tres tarjetas (DE, DA, BI) con "qué harás en tu trabajo"; con área, un selector `DE · DA · BI · Todo`, el progreso de la ruta y los niveles 0–4 con sus módulos como filas expandibles. Las lecciones existentes se abren; las planificadas aparecen como "En preparación"; cada módulo muestra su proyecto. El área se guarda en `localStorage` (`grano_track`). Recuentos verificados: BI 20 módulos / 95 lecciones, DE 20 / 95, DA 20 / 94, Todo 32 / 154.
   - **Lo que T7 y T8 deben hacer con esto:** T7 sustituye el `zoom` por la escala en `rem` de §4.5 **solo si** consigue el mismo resultado sin romper nada (si no, conserva `zoom` y documenta por qué), añade la densidad compacta y los atajos `Ctrl +/-/0`, y mueve el selector a Ajustes y al menú de usuario. T8 convierte `TrackPathView` en la Ruta definitiva (reemplazando el carrusel de 6 etapas), añade el onboarding de 3 pantallas y pasa el área al store de T5 (`profile.track`), migrando `grano_track` y `grano_ui_scale`.

---

## Cómo usar este documento (lee esto antes que nada)

1. Abre Antigravity → Agent Manager. Crea un agente **Orquestador** con el modelo **Gemini 4 Argon (High)**.
2. Pega este archivo completo como primera instrucción del orquestador, o dile: *"Lee `PLAN_GEMINI_4_ARGON.md` completo y ejecútalo como orquestador, empezando por la Fase 0."*
3. El orquestador **no implementa las tareas grandes él mismo**: crea un subagente por tarea (modelo **Gemini 4 Argon High** para diseño/arquitectura/contenido, **Argon Medium** para QA y tareas mecánicas) y le pasa **solo** estas secciones:
   - §1 Reglas comunes (completa, siempre).
   - §2 Contrato de trabajo anti-pereza (completo, siempre).
   - La ficha de su tarea (§6, §7, §8 o §9).
   - Los apéndices que su ficha cita.
4. Cada subagente trabaja en su propia rama/worktree de git (ver Fase 0) y entrega un reporte en `docs/reportes/<ID>.md`. El orquestador revisa el reporte contra la ficha **antes** de fusionar. Si falta evidencia, lo devuelve.

---

## Índice

- §0 Diagnóstico verificado (estado actual)
- §1 Reglas comunes para todos los agentes
- §2 Contrato de trabajo anti-pereza (Definition of Done)
- §3 Nueva marca: **Grano**
- §4 Sistema visual consolidado (tokens, tipografía, botones, movimiento, densidad)
- §5 Arquitectura de la ruta de aprendizaje (áreas, niveles, módulos)
- §6 Fase 0 — Preparación (orquestador)
- §7 Fase 1 — Fundaciones (5 subagentes en paralelo + 1 secuencial)
- §8 Fase 2 — Interfaz (7 subagentes en paralelo)
- §9 Fase 3 — Contenido (1 subagente por módulo + editor + verificador)
- §10 Fase 4 — QA, pulido y cierre
- §11 Mejoras adicionales propuestas (después de terminar)
- Apéndice A — Esquema de lección v2
- Apéndice B — Reglas de copy anti-slop y lista de términos prohibidos
- Apéndice C — Especificación del puente IA v2 (agy / Google AI Ultra)
- Apéndice D — Plantillas: brief de subagente, reporte, prompt de contenido
- Apéndice E — Matriz de pruebas y comandos

---

## §0. Diagnóstico verificado (estado actual)

Todo lo siguiente fue comprobado ejecutando la app y el código el 29-oct-2026. No es opinión: es el punto de partida.

### 0.1 El Tutor IA no funcionaba (crítico; arreglo urgente ya aplicado, ver arriba)

| Hallazgo | Evidencia |
|---|---|
| El puente prefiere `gemini` CLI cuando existe. `gemini` v0.50.0 **ya no está soportado** para esta cuenta. | Ejecutarlo devuelve `IneligibleTierError: This client is no longer supported for Gemini Code Assist for individuals... migrate to the Antigravity suite`. |
| La llamada a `agy` está mal formada. `server/aiUltraBridge.js` usa `['--print', '--', fullPrompt]`. | `agy --print -- "texto"` responde `Error: unexpected argument`. `--print` consume el siguiente argumento como prompt. |
| Cuando falla el CLI, el servidor devuelve **un texto fijo pre-escrito** (`buildExpertSynthesis`) y lo etiqueta como `"Google AI Ultra (Motor Contextual Rápido — Fallback CLI)"`. | `POST /api/ai/query` con "¿qué es el grain?" devuelve en 5 s el mismo bloque genérico sobre Iceberg, SQLMesh y MetricFlow, sin relación con la pregunta. **Es una respuesta falsa presentada como IA.** |
| `agy` **sí funciona** con la sintaxis correcta. | `agy --print "pregunta"` → respuesta correcta en ~10 s. Por `stdin` también funciona: `echo "pregunta" \| agy --model gemini-3.8-flash-low --sandbox` → ~6–8 s. |
| `agy` emite la respuesta **en streaming**. | Medido con Node: primer fragmento a ~9.4 s, luego trozos cada ~25 ms hasta terminar a ~12 s. Se puede usar SSE. |
| `agy --mode plan` **no sirve** para el tutor. | Con ese flag el agente redacta "un plan" y un artefacto en lugar de responder. No usarlo. |
| Modelos disponibles en `agy models` | `gemini-4-argon-{low,medium,high}`, `gemini-3.8-flash-{low,medium,high}`, más modelos Claude y GPT-OSS. |
| La API solo existe en `npm run dev` (es un plugin de Vite). `npm run preview` y `dist/` no tienen tutor. | `vite.config.js` → `googleAiUltraBridgePlugin()`. |

### 0.2 Estética "AI slop"

- **Hero "Buenos días"** en un bloque índigo con degradado (`#4C4DFF`) e ilustración genérica de tarjetas. Es el patrón más reconocible de interfaz generada por IA.
- **Tipografía por defecto de IA:** Plus Jakarta Sans + Inter + JetBrains Mono, cargadas desde Google Fonts (una app local depende de internet para sus fuentes).
- **Arcoíris de 6 colores de etapa** + 3 colores de rol + éxito/peligro/aviso = 12+ acentos compitiendo. Chips pastel por todas partes.
- **Chips `DE · DA · BI` en todas las lecciones**: como aparecen en casi todas, no informan nada.
- Botón primario con "sombra presionable" `0 2px 0` estilo Duolingo, que choca con el tono técnico.
- Tarjetas de métricas vacías en Inicio ("Completa la lección 01 para inaugurar tu recorrido", "Se activa al empezar tu primera lección"): tres cajas que dicen "aún no hay nada".
- Insignias, chispas (`sparkle`), `pulse-ring`, `pop`, `shake`: 14 `@keyframes` distintos.

### 0.3 Copy "slop"

- La palabra **"2026" aparece 251 veces** en `src/`. "clave" 82 veces, "potente" 10, "desbloquea" 10, "innegociable", "de nivel producción", "Cero relleno".
- "**Caso real en NovaPay**": no es un caso real. Es inventado y se presenta como real.
- Títulos tipo "Tríada de Datos", "Lentes Tri-Perspectiva", "Atelier Técnico" y "Frontera 2026": nombres de marketing que no explican nada.
- Párrafos de 120+ palabras con 4–6 términos en negrita cada uno.

### 0.4 UX / layout

- **1280×720 (portátil pequeño, p. ej. un T490s al 150 %):** en la lección, barra lateral + temario de ~300 px + contenido. El simulador recorta tablas (`order_total_usd (` cortado). Arriba hay tres indicadores de progreso que repiten lo mismo (barra, puntos, "2/7").
- **Móvil (390 px):** dentro de una lección no había ningún botón para abrir el tutor (arreglo mínimo ya aplicado: botón "Preguntar").
- **1600×900 con el Tutor abierto:** la columna de la lección queda en ~300 px y el resto de la pantalla en blanco. El layout de tres columnas está roto.
- **Estructura fija de 7 pasos en las 18 lecciones** (Contexto, Simulador, Antipatrón, *Los tres roles*, Comprueba, Práctica, Resumen). El paso "Los tres roles" se fuerza aunque el tema no lo pida.
- Una sola pregunta (`checkpoint`) por lección. La "práctica" es rellenar huecos `{{b1}}`; no se ejecuta SQL real.

### 0.5 Contenido / ruta

- **18 lecciones, 6 etapas.** La lección 1 ya es "fan-out en JOINs y chasm trap". **No existe un nivel 0 real**: nada de qué es una tabla, tipos de datos, `SELECT` básico, estadística descriptiva, hojas de cálculo, Python o métricas de negocio.
- No se puede **elegir área** (Ingeniería de Datos / Analista de Datos / BI). Todo es una sola ruta lineal.
- BI no tiene DAX, Power BI, modelado semántico en herramienta, RLS ni diseño de dashboards en profundidad. DA no tiene probabilidad, inferencia, regresión ni series temporales como lecciones propias.

### 0.6 Código

- **No es un repositorio git.** Cualquier cambio de un agente es irreversible.
- `src/data/curriculum2026.js` (1 533 líneas) **no se importa en ningún sitio**: código muerto.
- El glosario (~900 líneas de datos) vive dentro de `GlossaryAndGraphView.jsx`; las flashcards, dentro de `engine/spacedRepetition.js`.
- `App.jsx` (714 líneas) tiene 15+ `useState` con su propio `localStorage` y dos prefijos de claves mezclados (`manual_datos_*` y `ruta_datos_2026_*`).
- Quedan 36 `style={{}}` inline (24 en `LessonVisualizers.jsx`).
- Los `PROMPT_*.md` antiguos estaban en la raíz (ya movidos a `docs/archivo/`). Siguen ahí `.impeccable/`, `dist/` y `tests/screenshots/` antiguos: ignóralos o exclúyelos con `.gitignore`.

### 0.7 Lo que SÍ está bien y se conserva

- Los simuladores interactivos (fan-out, ventanas, ASOF, SCD2, Simpson, Parquet, Iceberg, cohortes, A/B CUPED, watermarks, MCP) son la mejor parte. Se rediseñan visualmente; **no se tiran**.
- El texto técnico de las 18 lecciones es correcto en lo esencial. Se migra y edita; no se reescribe desde cero.
- Navegación inferior en móvil, `Ctrl+K`, modo oscuro, `prefers-reduced-motion`, componentes UI propios, seguridad del puente (sin shell, límites de tamaño, chequeo de origen).

---

## §1. Reglas comunes para todos los agentes

### 1.1 Qué es el producto

**Grano** es una escuela de datos local, en español, que lleva a una persona **de cero a experto** en tres áreas: **Ingeniería de Datos (DE)**, **Análisis de Datos (DA)** y **Business Intelligence (BI)**. Hay un tronco común y luego cada persona elige su área. Se aprende leyendo poco, practicando mucho (SQL real en el navegador, simuladores) y preguntando a un tutor IA que usa la suscripción Google AI Ultra del usuario a través de `agy`.

Usuario principal: una persona hispanohablante que estudia sola en su portátil (pantalla de 13–14"), a veces en un monitor externo. Quiere saber qué estudiar, en qué orden, y comprobar que lo entendió.

### 1.2 Archivos que todo agente lee ANTES de tocar nada

1. Este documento: §0, §1, §2 y su ficha.
2. `package.json`, `vite.config.js`, `src/main.jsx`, `src/App.jsx`.
3. `src/styles/tokens.css` (o el nuevo, si la Fase 1 ya terminó).
4. Los archivos que su ficha lista en **"Inicio → leer"**.

En la sección "Inicio" de su reporte, el agente escribe una línea por archivo leído con **un dato concreto que aprendió de él**. Sin eso, el reporte se rechaza.

### 1.3 Prohibiciones absolutas

- No borrar ni reescribir desde cero los simuladores de `src/components/visualizers/` ni `LessonVisualizers.jsx`. Se reestilizan y adaptan.
- No añadir frameworks de UI (Tailwind, MUI, Chakra, shadcn, Bootstrap). CSS propio con tokens.
- No añadir dependencias sin justificarlas en el reporte (nombre, versión exacta, tamaño, por qué). Permitidas de antemano: `@fontsource-variable/*` o `@fontsource/*`, `@duckdb/duckdb-wasm`, `@codemirror/*` (solo los paquetes necesarios), `ts-fsrs`, `vitest`, `zod`.
- No usar `shell: true`, `exec`, ni interpolar texto del usuario en comandos.
- No inventar casos "reales", cifras de empresas, citas ni estudios. Los datasets y empresas de ejemplo son **ficticios** y se dice que lo son.
- No poner "2026" en títulos, botones ni encabezados. La fecha solo aparece en metadatos de fuentes ("consultado el 29-oct-2026").
- No emojis en la interfaz ni en el contenido.
- No degradados de color en fondos ni botones. No sombras de color (glow). No glassmorphism.
- No dejar `TODO`, `FIXME`, `placeholder`, `lorem`, `...` de truncado manual, ni datos de relleno.
- No tocar archivos fuera de la lista **"Archivos que posees"** de tu ficha. Si necesitas un cambio fuera, lo pides al orquestador en tu reporte.

### 1.4 Entorno

- Windows 11, Node instalado, `agy` en `C:\Users\T490s\AppData\Local\agy\bin\agy.exe`.
- Dev server: `npm run dev` → `http://127.0.0.1:5174`.
- Navegador para pruebas: `playwright-core` (ya instalado) con `channel: 'msedge'` o `'chrome'`.
- Resoluciones de referencia obligatorias (ver Apéndice E): **1280×720**, 1366×768, 1440×900, 1920×1080, 390×844.

### 1.5 Idioma y tono

Todo en español neutro, tuteo, frases cortas. Ver Apéndice B.

---

## §2. Contrato de trabajo anti-pereza (Definition of Done)

Este proyecto ya pasó por tres iteraciones donde se entregaron cambios superficiales y "listo". Esta vez el trabajo se mide con evidencia. **Ninguna tarea está terminada hasta que se cumple todo esto:**

1. **Cada paso de la ficha tiene evidencia** en el reporte: archivo y líneas cambiadas, comando ejecutado con su salida (recortada a lo relevante, nunca inventada), o captura en `docs/reportes/capturas/<ID>/`.
2. **El bloque "Test" de la ficha se ejecutó completo** y su salida está pegada. Si un test falla, se arregla y se vuelve a ejecutar. No se desactivan tests.
3. **Revisión propia en dos pasadas.** Al terminar, el agente vuelve a abrir **cada archivo que cambió** y lo revisa contra los criterios de su ficha. En el reporte lista **al menos 5 defectos que encontró en su propio trabajo y cómo los corrigió**. "No encontré defectos" no se acepta.
4. **Prueba adversarial.** El agente intenta romper lo que hizo: textos muy largos, cero datos, mil datos, sin IA, ventana de 1280×720, modo oscuro, teclado sin ratón, `prefers-reduced-motion`. Lista qué probó y qué pasó.
5. **Capturas antes/después** en las resoluciones que pide la ficha, con nombre `<ID>_<vista>_<ancho>x<alto>_<tema>.png`.
6. **Cantidades mínimas.** Cuando una ficha dice "mínimo N", es mínimo. Entregar menos es entregar incompleto.
7. **Prohibido resumir el trabajo como hecho cuando es parcial.** Si algo quedó pendiente, va en la sección "Pendiente" del reporte con el motivo.
8. **Tiempo.** No hay prisa. Una tarea de §7–§9 bien hecha requiere decenas de pasos y varias vueltas de verificación. Si terminas una ficha en pocos pasos, casi seguro te saltaste algo: relee la ficha completa y compara punto por punto.
9. **El orquestador rechaza** cualquier reporte que no tenga: Inicio con archivos leídos, evidencia por paso, salida de tests, 5+ autodefectos, prueba adversarial, capturas.

---

## §3. Nueva marca: **Grano**

### 3.1 Nombre

**Grano.** Viene del *grain* de una tabla: la pregunta "¿qué representa exactamente una fila?" es el primer concepto que separa a alguien que sabe de datos de alguien que no. También funciona en español común ("ir al grano", "grano a grano"). Es corto, sin anglicismos y sin "AI", "Lab", "Hub" ni "Academy".

- **Descriptor:** *Escuela de datos*
- **Línea (una sola, solo en onboarding y en `<meta name="description">`):** *De la primera fila al tablero.*
- `<title>`: `Grano` en Inicio; `<Lección> · Grano` dentro de una lección.

Alternativas si el usuario no quiere "Grano": **Linaje** (de *data lineage*) o **Cardinal** (de cardinalidad). El orquestador pregunta al usuario solo si este lo pide; si no, usa **Grano**.

### 3.2 Logotipo

- Una cuadrícula de **3×3 celdas cuadradas** con separación de 1 unidad. Ocho celdas en trazo (`--ink-3`) y **una celda rellena** con el color de marca (`--brand`), en la fila 2, columna 3. Representa "una fila, una celda: el grano".
- Wordmark: "grano" en minúsculas, en la fuente de interfaz (§4.2), peso 600, `letter-spacing: -0.01em`.
- Archivos: `src/assets/brand/BrandMark.jsx` (SVG inline con `currentColor` + variable de marca) y `public/favicon.svg` (solo la cuadrícula, la celda rellena con `#C2410C`).
- Prohibido: degradados en el logo, brillo, sombras, efectos 3D.

### 3.3 Personalidad

| Es | No es |
|---|---|
| Un cuaderno de laboratorio bien ordenado | Un dashboard de startup |
| Preciso, sobrio, con un solo acento de color | Colorido para "dar energía" |
| Habla como una colega senior que explica con paciencia | Un vendedor que promete "dominar" algo |
| Celebra poco y bien (al terminar un módulo) | Confeti en cada clic |

---

## §4. Sistema visual consolidado

Lo implementan T1 (tokens y marca) y T6 (componentes y movimiento). El resto **solo usa** estos tokens; no crea colores, tamaños ni duraciones nuevas.

### 4.1 Color

Un solo acento de marca. Tres colores de área usados **solo como marcadores pequeños** (punto de 8 px, borde izquierdo de 2 px, icono). Nunca como fondo de tarjeta grande.

**Modo claro (`:root`, `[data-theme="light"]`):**

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#FAFAF9` | Fondo de la app |
| `--surface` | `#FFFFFF` | Paneles, tarjetas |
| `--sunken` | `#F4F4F2` | Bloques hundidos: código inline, filas alternas, inputs |
| `--line` | `#E7E5E1` | Bordes 1 px |
| `--line-strong` | `#D6D3CD` | Separadores importantes (decorativos, no de controles) |
| `--line-control` | `#928C85` | Borde de inputs, checkbox, botón `secondary` (3.3:1, cumple WCAG 1.4.11) |
| `--ink` | `#1C1B19` | Texto principal; fondo del botón primario |
| `--ink-2` | `#57534E` | Texto secundario |
| `--ink-3` | `#78716C` | Metadatos, placeholders (verificar ≥ 4.5:1 sobre `--surface`; si no llega, oscurecer) |
| `--brand` | `#C2410C` | Marca: logo, progreso, foco, enlace activo, celda del grano |
| `--brand-soft` | `#FDF1EA` | Fondo de selección y del paso activo |
| `--track-de` | `#2952CC` | Ingeniería de Datos |
| `--track-da` | `#167A52` | Análisis de Datos |
| `--track-bi` | `#7A3FC2` | Business Intelligence |
| `--ok` | `#167A52` | Correcto (siempre con icono ✓ de lucide, nunca solo color) |
| `--bad` | `#C2352B` | Incorrecto / error |
| `--warn` | `#A15C00` | Aviso |
| `--code-bg` | `#1C1B19` | Bloques de código (mismo en ambos temas) |
| `--focus` | `#C2410C` | Anillo de foco 2 px + offset 2 px |

**Modo oscuro (`@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {...} }` y `[data-theme="dark"]`):**

| Token | Valor |
|---|---|
| `--bg` | `#121211` |
| `--surface` | `#1A1A18` |
| `--sunken` | `#222220` |
| `--line` | `#2E2D2A` |
| `--line-strong` | `#3D3B37` |
| `--line-control` | `#6B675F` |
| `--ink` | `#EDECE9` |
| `--ink-2` | `#B5B1AA` |
| `--ink-3` | `#8F8A82` |
| `--brand` | `#F07A3E` |
| `--brand-soft` | `#2D1D14` |
| `--track-de` | `#7C9BF5` |
| `--track-da` | `#5BC79A` |
| `--track-bi` | `#B58CF0` |
| `--ok` / `--bad` / `--warn` | `#5BC79A` / `#F07A70` / `#E0A345` |

**Reglas:**
- Se eliminan **todos** los tokens `--stage-*` y los 6 colores de etapa. Las etapas pasan a ser "niveles" (§5) y no tienen color propio.
- El botón primario es `--ink` sobre `--surface` con texto `--surface`. El naranja de marca **no** es el color del botón: es el color del progreso y del foco. Así el naranja no se confunde con "aviso".
- T1 verifica contraste con un script (`scripts/check-contrast.mjs`) que calcula la razón WCAG de cada par usado y falla si alguno baja de 4.5:1 (texto) o 3:1 (bordes de controles e iconos). Si un valor de esta tabla no cumple, T1 lo ajusta **mínimamente** y lo documenta.

### 4.2 Tipografía (autoalojada, sin Google Fonts)

| Rol | Familia | Paquete | Pesos |
|---|---|---|---|
| Interfaz y lectura | **IBM Plex Sans** | `@fontsource/ibm-plex-sans` | 400, 500, 600 |
| Código, números, datos | **IBM Plex Mono** | `@fontsource/ibm-plex-mono` | 400, 500 |
| Títulos de lección y de módulo | **Newsreader** (variable, eje `opsz`) | `@fontsource-variable/newsreader` | 500–600 |

Motivo: Plex está diseñada para interfaces técnicas y su versión Mono comparte métricas, así que código y texto conviven sin saltos. Newsreader da a las lecciones aspecto de libro técnico, sin parecer plantilla. Las tres funcionan sin internet.

**Escala (en `rem`, base 16 px; la densidad compacta cambia la base, ver §4.5):**

| Token | rem | px a 16 | Uso |
|---|---|---|---|
| `--fs-1` | 0.75 | 12 | Metadatos, chips, atajos |
| `--fs-2` | 0.8125 | 13 | Botones pequeños, tablas densas |
| `--fs-3` | 0.875 | 14 | Interfaz general, botones |
| `--fs-4` | 1 | 16 | Lectura de lección |
| `--fs-5` | 1.125 | 18 | Subtítulos |
| `--fs-6` | 1.375 | 22 | Título de sección (Newsreader) |
| `--fs-7` | 1.75 | 28 | Título de lección (Newsreader) |
| `--fs-8` | 2.25 | 36 | Solo título de onboarding |

- Lectura: `line-height: 1.6`, ancho máximo `68ch`.
- Interfaz: `line-height: 1.4`.
- Números siempre con `font-variant-numeric: tabular-nums`.
- Prohibido usar `clamp()` con `vw` para el texto de la interfaz (hace que la UI crezca en monitores grandes sin control). El tamaño lo controla la escala de usuario (§4.5).

### 4.3 Espaciado, forma y profundidad

- Espaciado en múltiplos de 4 px expresados en `rem`: `--sp-1: .25rem` … `--sp-8: 2rem`, `--sp-10: 2.5rem`, `--sp-12: 3rem`, `--sp-16: 4rem`.
- Radios: `--r-1: 4px` (chips, inputs), `--r-2: 6px` (botones), `--r-3: 10px` (tarjetas, paneles). **Nada de 16–24 px** ni píldoras para botones.
- Sombras: solo `--shadow-pop: 0 8px 24px rgb(0 0 0 / .12), 0 1px 2px rgb(0 0 0 / .08)` para menús, popovers y paneles flotantes. Las tarjetas **no** llevan sombra: se separan con `--line`.
- Iconos: `lucide-react`, tamaño 16 en interfaz y 14 en chips, `stroke-width: 1.75`.

### 4.4 Botones y controles (especificación exacta)

| Variante | Fondo | Texto | Borde | Hover | Uso |
|---|---|---|---|---|---|
| `primary` | `--ink` | `--surface` | — | fondo 8 % más claro (`color-mix`) | Una sola acción principal por vista |
| `secondary` | `--surface` | `--ink` | 1 px `--line-control` | fondo `--sunken` | Acciones secundarias |
| `ghost` | transparente | `--ink-2` | — | fondo `--sunken`, texto `--ink` | Barras de herramientas |
| `danger` | `--surface` | `--bad` | 1 px `--bad` al 40 % | fondo `--bad` al 8 % | Reiniciar progreso, borrar |
| `link` | — | `--ink` subrayado 1 px `--line-strong` | — | subrayado `--brand` | Enlaces en texto |

Tamaños: `sm` 28 px alto / `--fs-2`; `md` 34 px / `--fs-3` (por defecto); `lg` 40 px / `--fs-3` peso 600. En táctil (`@media (pointer: coarse)`) el mínimo es 44 px.

Estados obligatorios en **todas** las variantes: `:hover`, `:active` (`transform: translateY(0.5px)`, sin escalar), `:focus-visible` (anillo `--focus`), `[disabled]` (opacidad .45, `cursor: not-allowed`), `[aria-busy="true"]` (spinner de 14 px que **sustituye el icono sin cambiar el ancho del botón**).

- Botón de solo icono: cuadrado (28/34/40), siempre con `aria-label` y tooltip.
- Se elimina la sombra presionable `0 2px 0`.
- Chips: alto 22 px, `--fs-1`, mono, borde 1 px, sin fondo de color salvo `--sunken`. Un chip de área es: punto de 6 px del color del área + texto.
- Inputs y textarea: alto 34 px, borde `--line-control`, foco con anillo, placeholder `--ink-3`.
- Segmented control (para elegir área, tema, densidad): contenedor `--sunken`, opción activa `--surface` con borde `--line`. La opción activa se desliza con `transform` (ver §4.6).

### 4.5 Densidad y escala (monitores pequeños)

El usuario pidió poder hacer la interfaz más pequeña. Se resuelve en tres capas:

1. **Todo en `rem`.** T7 convierte los `px` de tipografía, espaciado y tamaños de componentes a `rem` en todo `src/styles/` (los bordes de 1 px se quedan en `px`).
2. **Escala de interfaz** en Ajustes: `90 %`, `100 %`, `110 %`, `125 %`. Se aplica con `html { font-size: calc(100% * var(--ui-scale)) }` y `data-scale` en `<html>`. Se guarda en preferencias.
3. **Densidad**: `Cómoda` / `Compacta` / `Automática` (por defecto). `data-density="compact"` reduce el espaciado (`--sp-*` × 0.75), la altura de la barra superior (52 → 44 px), los botones (`md` 34 → 30 px) y el interlineado de lectura (1.6 → 1.5). En `Automática` se activa la compacta con `@media (max-height: 800px), (max-width: 1366px)`.
4. **Atajos:** `Ctrl` + `+` / `Ctrl` + `-` dentro de la app cambian la escala de la interfaz (con `preventDefault`), y `Ctrl` + `0` vuelve a 100 %. Un aviso breve muestra la escala actual.

Criterio de aceptación: a **1280×720 con densidad automática**, la lección muestra título + al menos 12 líneas de texto sin hacer scroll, y el simulador del fan-out se ve completo sin recortar columnas.

### 4.6 Movimiento

Principio: **el movimiento explica de dónde viene y a dónde va algo**. Nunca decora.

| Token | Valor | Uso |
|---|---|---|
| `--dur-1` | 120 ms | hover, pulsado, cambio de color |
| `--dur-2` | 180 ms | aparición de menús, tooltips, chips |
| `--dur-3` | 260 ms | paneles laterales, cambio de vista |
| `--dur-4` | 420 ms | solo barras de progreso que se llenan |
| `--ease-out` | `cubic-bezier(.2, .8, .2, 1)` | entradas |
| `--ease-in` | `cubic-bezier(.4, 0, 1, 1)` | salidas |
| `--ease-move` | `cubic-bezier(.65, 0, .35, 1)` | desplazamientos (segmented, indicador de pestaña) |

Animaciones que **sí** existen:
- **Cambio de vista:** View Transitions API (`document.startViewTransition`) con *fade* de 8 px hacia arriba, `--dur-3`. Fallback sin animación si el navegador no la soporta.
- **Indicador deslizante** en pestañas y segmented controls (una sola barra que se mueve con `transform`).
- **Panel del tutor:** entra desde la derecha (`translateX(16px)` → 0 + opacidad), `--dur-3`.
- **Barra de progreso:** se llena con `--dur-4` cuando cambia el valor.
- **Respuesta correcta:** el borde pasa a `--ok` y aparece un icono check con trazo animado (`stroke-dashoffset`, 260 ms). **Incorrecta:** borde `--bad` + icono X; sin sacudida.
- **Resultado de SQL:** las filas aparecen con un *stagger* de 15 ms hasta un máximo de 12 filas.
- **Fin de módulo:** la celda del logo se rellena en la tarjeta del módulo (una vez). Es la única "celebración".

Se eliminan: `sparkle`, `pulse-ring`, `pop`, `shake`, confeti, insignias animadas, rebotes, cualquier `animation: infinite` salvo el spinner y el skeleton.

`@media (prefers-reduced-motion: reduce)`: todas las duraciones pasan a `0.01ms` excepto la barra de progreso, que cambia sin transición.

### 4.7 Layout por anchura (contrato para T7, T9 y T11)

| Ancho | Navegación | Temario de lección | Tutor IA |
|---|---|---|---|
| ≥ 1600 px | Lateral 232 px (colapsable a 56) | Columna 260 px visible | Columna fija 380 px; el contenido se recoloca, **nunca baja de 640 px** |
| 1280–1599 | Rail de 56 px por defecto | Cajón (drawer) que se abre con botón "Temario" o `T` | Panel superpuesto de 400 px sobre el contenido, con sombra `--shadow-pop`, sin oscurecer el fondo; el contenido no se mueve |
| 1024–1279 | Rail 56 px | Cajón | Panel superpuesto de 360 px |
| < 1024 | Barra inferior (5 ítems) | Hoja inferior | Hoja inferior a pantalla completa |

- Contenido de lectura centrado con `max-width: 68ch`; el simulador puede salir de ese ancho hasta `min(100%, 960px)`.
- La barra superior de la lección muestra **un único indicador de progreso** (barra fina de 2 px bajo la barra superior + texto "3 de 6"). Se eliminan los puntos y el duplicado del pie.
- Usar `container queries` (`container-type: inline-size`) en tarjetas, simuladores y paneles, no solo media queries de viewport.

---

## §5. Arquitectura de la ruta de aprendizaje

### 5.1 Modelo: tronco común + áreas + niveles

```
Nivel 0  Cimientos        ─┐
Nivel 1  Fundamentos      ─┤  TRONCO COMÚN (todos)
Nivel 2  Intermedio común ─┘
                 │
     ┌───────────┼───────────┐
     DE          DA          BI     ← el usuario elige una (puede cambiar cuando quiera)
  N2 → N3 → N4  N2 → N3 → N4  N2 → N3 → N4
                 │
Nivel 4  Experto común: IA + datos, carrera
```

- **Área** (`track`): `core`, `de`, `da`, `bi`.
- **Nivel** (`level`): `0 Cimientos`, `1 Fundamentos`, `2 Intermedio`, `3 Avanzado`, `4 Experto`.
- **Módulo**: 3–7 lecciones de un tema. Tiene id, área, nivel, objetivo del módulo, prerequisitos (ids de módulos) y un proyecto corto al final.
- **Lección**: 10–30 min. Esquema en Apéndice A.
- Las lecciones de otras áreas siguen visibles como **optativas**. Nada se bloquea: los prerrequisitos se muestran como "Recomendado antes: …".
- Una lección puede pertenecer a más de un área (`tracks: ['de', 'bi']`), p. ej. "Capa semántica".

### 5.2 Catálogo de módulos (borrador que T3 investiga, corrige y completa)

Las lecciones marcadas con **[L#]** ya existen y se migran (número = `order` actual).

**TRONCO COMÚN**

| Id | Nivel | Módulo | Temas de lección (borrador) |
|---|---|---|---|
| `c0-datos` | 0 | Qué son los datos | Tipos de dato (entero, decimal, texto, fecha, booleano) · `NULL` no es cero · Archivos: CSV, JSON, Excel, Parquet (intro) · Codificación UTF-8 y por qué aparecen "Ã±" · Tablas: filas, columnas y claves |
| `c0-hojas` | 0 | Hojas de cálculo con criterio | Tablas estructuradas y filtros · Tablas dinámicas · BUSCARX y sus trampas · Errores clásicos (fechas como texto, celdas combinadas) |
| `c0-numeros` | 0 | Números con sentido | Media, mediana y moda · Dispersión y percentiles · Distribuciones y sesgo · Proporciones y tasas · Correlación no es causalidad |
| `c0-negocio` | 0 | Negocio para gente de datos | Ingreso, costo, margen · Embudo y conversión · Qué es un KPI y qué no · Cómo se toma una decisión con datos |
| `c0-herramientas` | 0 | Herramientas del oficio | Terminal básica · Git en 30 minutos · Python mínimo (variables, listas, diccionarios, funciones) · Notebooks · Cómo leer documentación y errores |
| `c1-sql-base` | 1 | SQL desde cero | `SELECT`/`FROM`/`WHERE` · `ORDER BY`/`LIMIT` · `NULL` y lógica de tres valores · `GROUP BY`/`HAVING` · `CASE WHEN` · Funciones de fecha · `COUNT(*)` vs `COUNT(col)` vs `COUNT(DISTINCT)` |
| `c1-sql-joins` | 1 | Combinar tablas | Tipos de JOIN (inner, left, full, anti, semi) · **[L1] Grano y fan-out** · Subconsultas · CTEs legibles · `UNION` vs `UNION ALL` |
| `c1-modelo` | 1 | Modelo relacional y calidad | Claves primarias y foráneas · Normalización 1FN–3FN · Integridad referencial · Calidad: duplicados, nulos, valores imposibles · Validar antes de publicar |
| `c1-python` | 1 | Python para datos | DataFrames (Polars y pandas) · Leer y escribir CSV/Parquet · Filtrar, agrupar, unir · Fechas y texto · Del notebook al script |
| `c1-viz` | 1 | Visualización honesta (fundamentos) | Elegir el gráfico por la pregunta · Ejes, escalas y cero · Color con intención · Tablas bien hechas |
| `c2-sql-analitico` | 2 | SQL analítico | **[L2] Funciones de ventana y `QUALIFY`** · **[L3] `ASOF JOIN` y CTEs** · Zonas horarias y calendarios · Leer un plan de ejecución (`EXPLAIN`) |
| `c2-dimensional` | 2 | Modelado dimensional | Hechos y dimensiones (Kimball) · **[L4] Estrella vs OBT** · **[L5] SCD tipo 2** · **[L6] Métricas no aditivas y Simpson** · Hechos transaccionales, snapshot y acumulativos |

**ÁREA DE — Ingeniería de Datos**

| Id | Nivel | Módulo | Temas |
|---|---|---|---|
| `de2-formatos` | 2 | Formatos y motores locales | **[L7] Parquet y zone maps** · **[L8] Apache Arrow** · **[L9] DuckDB, Polars y Marimo** · Compresión y codificación · Particionado de archivos |
| `de2-pipelines` | 2 | Pipelines | ETL vs ELT · Idempotencia y reprocesos · Carga incremental y *watermarks* de lote · Ingesta desde APIs · Orquestación (Airflow, Dagster, Prefect: comparación honesta) · Docker para datos |
| `de3-lakehouse` | 3 | Lakehouse y almacenes | **[L10] Apache Iceberg** · Delta Lake y formatos interoperables · Catálogos (REST, Unity, Polaris) · Almacenes en la nube (BigQuery, Snowflake, Databricks): modelo de costos |
| `de3-transformacion` | 3 | Transformación y calidad | **[L11] dbt y SQLMesh** · Tests de datos · **[L12] Contratos de datos** (parte DE) · Observabilidad y linaje (OpenLineage) |
| `de4-streaming` | 4 | Tiempo real | **[L16] CDC con Debezium y Kafka** · Kafka por dentro · **[L17] Tiempo de evento y watermarks** · Exactly-once y sus límites · Bases de datos de streaming |
| `de4-plataforma` | 4 | Plataforma y escala | Spark: particiones y *shuffles* · Diseño de una plataforma de datos · Seguridad, PII y enmascarado · Infraestructura como código · FinOps · Entrevista de *system design* para DE |

**ÁREA DA — Análisis de Datos**

| Id | Nivel | Módulo | Temas |
|---|---|---|---|
| `da2-inferencia` | 2 | Probabilidad e inferencia | Probabilidad útil · Distribuciones (normal, binomial, Poisson) · Muestreo y error estándar · Intervalos de confianza · Pruebas de hipótesis y p-valor bien explicado · Potencia y tamaño de muestra |
| `da2-eda` | 2 | Exploración con método | Preguntas antes que gráficos · Perfilado de un dataset · Valores atípicos: detectar sin borrar · Diario de análisis reproducible |
| `da3-producto` | 3 | Analítica de producto | Embudos · **[L13] Cohortes, retención y LTV** · Segmentación · Atribución de marketing |
| `da3-experimentos` | 3 | Experimentación | **[L14] A/B, SRM y CUPED** · Comparaciones múltiples · Pruebas secuenciales · Enfoque bayesiano · Cuándo NO hacer un A/B |
| `da4-modelos` | 4 | Modelos para analistas | Regresión lineal · Regresión logística · Series temporales y estacionalidad · Pronóstico · Clustering |
| `da4-causalidad` | 4 | Causalidad y comunicación | Diferencias en diferencias · Regresión discontinua · Control sintético · Memo analítico · Presentar a dirección |

**ÁREA BI — Business Intelligence**

| Id | Nivel | Módulo | Temas |
|---|---|---|---|
| `bi2-metricas` | 2 | Métricas y KPIs | Definir una métrica sin ambigüedad · Árboles de KPIs · Métricas guardia · Métrica norte: usos y abusos |
| `bi2-modelo-semantico` | 2 | Modelo semántico en la herramienta | Estrella dentro de Power BI · Relaciones y cardinalidad · Dirección de filtro · Tablas de fechas · Medidas vs columnas calculadas |
| `bi2-dax` | 2 | DAX | Contexto de fila y de filtro · `CALCULATE` · Inteligencia de tiempo · Iteradores (`SUMX`) · Variables y legibilidad · Errores típicos |
| `bi3-dashboards` | 3 | Diseño de tableros | **[L15] Percepción visual y reportes como código** (parte de percepción) · Jerarquía y layout · Color y accesibilidad · Interacción y filtros · Tablero ejecutivo vs operativo |
| `bi3-gobierno` | 3 | Capa semántica y gobierno | **[L12] Capa semántica** (parte BI) · Seguridad por filas (RLS) · Métricas certificadas · Rendimiento: Import, DirectQuery, Direct Lake · Looker/LookML y Tableau: conceptos equivalentes |
| `bi4-operacion` | 4 | BI como código y operación | **[L15] BI como código** (parte código) · Power BI Projects (PBIP) + git · CI/CD de reportes · Medir la adopción de un tablero · **[L18] GenBI y MCP** (parte BI) |

**EXPERTO COMÚN**

| Id | Nivel | Módulo | Temas |
|---|---|---|---|
| `x4-ia-datos` | 4 | IA y datos | **[L18] Servidores MCP y capa semántica** · Por qué falla el text-to-SQL directo · RAG sobre datos propios · Evaluar sistemas de IA (evals) |
| `x4-carrera` | 4 | Carrera | Portafolio por área · Entrevista técnica por área · Cómo explicar un proyecto en 2 minutos |

**Total estimado:** ~32 módulos, ~150 lecciones. Se construyen en **tres olas** (ver §9) para que la app sea útil desde la primera.

### 5.3 Dataset ficticio común: **Mercado Brisa**

Todas las lecciones con SQL o Python usan **una sola empresa ficticia**, una tienda de supermercado en línea. Así el alumno conoce las tablas y no reaprende el contexto en cada lección. Se dice explícitamente "empresa ficticia" en la primera lección y en el glosario.

Tablas mínimas (T10 las genera con un script con semilla fija): `customers`, `customer_changes` (para SCD2), `products`, `orders`, `order_items`, `payments`, `refunds`, `events` (navegación web), `marketing_spend`, `experiments`, `experiment_assignments`, `stores`, `calendar`. Tamaño total < 8 MB en Parquet. Con errores **intencionales y documentados** para enseñar calidad (duplicados, nulos, fechas en UTC y hora local, un SKU con precio negativo).

---

## §6. Fase 0 — Preparación (la hace el orquestador, sin subagentes)

### Inicio
- Leer este documento entero.
- Comprobar: `node --version`, `npm --version`, `agy --version`, `git --version`.

### Pasos
1. **Control de versiones.** `git init` y `.gitignore` ya existen (revisa que `.gitignore` incluya `node_modules/`, `dist/`, `.cache/`, `.impeccable/chrome-profile/`, `tests/screenshots/`, `docs/reportes/capturas/**/*.png`). El commit inicial ya existe (`8492503`); solo confirma con `git log` que estás encima de él antes de crear los worktrees.
2. **Ordenar la raíz.** Ya hecho (ver "Ya hecho" al inicio). Solo comprueba que `docs/archivo/` contiene los 4 archivos y que la raíz no tiene otros `.md` sueltos salvo `PLAN_GEMINI_4_ARGON.md`, `DESIGN.md` y `PRODUCT.md`.
3. **Línea base visual.** Ya existe en `docs/reportes/capturas/F0-antes/` (64 capturas) y el script `scripts/shots.mjs` funciona (`node scripts/shots.mjs --help` no existe: lee los comentarios de cabecera). Ábrelas todas y escribe en `F0.md` 10 problemas visuales concretos que veas, con el nombre de la captura. A medida que las fases cambien la navegación, quien la cambie actualiza `scripts/shots.mjs` (T7 es su dueño desde la Fase 2).
4. **Línea base del tutor.** Ejecutar `agy models` y una consulta de prueba por `stdin` con `--model gemini-3.8-flash-low --sandbox`. Guardar salida y tiempo en `docs/reportes/F0.md`.
5. **Estrategia de ramas.** Para cada subagente de la Fase 1: `git worktree add ../ING-<ID> -b agente/<ID>`. Cada subagente trabaja **solo** en su worktree. El orquestador fusiona en `main` con `git merge --no-ff` tras aprobar el reporte. Si dos ramas chocan, el orquestador resuelve el conflicto respetando la ficha del dueño del archivo.
6. Crear `docs/reportes/` y copiar la plantilla de reporte del Apéndice D.

### Resultado esperado
Repo git con historial, raíz limpia, capturas "antes" y reporte `F0.md`.

### Test
- `git log --oneline` muestra al menos 2 commits.
- `ls docs/reportes/capturas/F0-antes/ | wc -l` ≥ 60.
- `F0.md` lista 10 problemas visuales con el nombre de la captura donde se ven.

### Final
Orquestador lanza **en paralelo** T1, T2, T3, T4 y T5.

---

## §7. Fase 1 — Fundaciones

Cinco subagentes en paralelo (T1–T5). T6 empieza cuando T1 se fusiona.

---

### T1 · Marca y tokens

**Archivos que posees:** `src/styles/tokens.css`, `src/styles/reset.css`, `src/styles/fonts.css` (nuevo), `src/assets/brand/**`, `public/favicon.svg`, `index.html`, `DESIGN.md`, `PRODUCT.md`, `scripts/check-contrast.mjs` (nuevo), `package.json` (solo dependencias de fuentes).

**Inicio → leer:** §3, §4.1–4.3, §4.6 (tokens de movimiento); `src/styles/tokens.css`, `src/styles/reset.css`, `src/styles.css`, `src/assets/brand/BrandMark.jsx`, `DESIGN.md`, `PRODUCT.md`, `index.html`.

**Pasos:**
1. **Ya hecho** (ver "Ya hecho" punto 4): fuentes instaladas y `src/styles/fonts.css` creado. Tu trabajo: comprobar en DevTools → Network que solo se descargan los subconjuntos `latin`/`latin-ext` en una página en español, y que no queda ninguna petición a `fonts.googleapis.com`.
2. `tokens.css` ya tiene la paleta de §4.1 y los tokens de movimiento. Te falta: la escala tipográfica `--fs-1..8` en `rem` de §4.2, el espaciado `--sp-*` de §4.3, `--ui-scale: 1` y los bloques `[data-density="compact"]` y `[data-scale="0.9"|"1.1"|"1.25"]` de §4.5.
3. **Compatibilidad temporal:** los alias ya existen dentro de `tokens.css` (bloque "Compatibilidad: nombres antiguos -> paleta nueva"). Agrúpalos al final bajo el comentario `/* ALIAS TEMPORALES — eliminar en T7 */` sin cambiar sus valores, y lista en el reporte cuántas veces aparece cada alias en `src/` (`grep -c`).
4. Crear `scripts/check-contrast.mjs`: lee los pares definidos en un array dentro del script (texto/fondo de cada combinación usada), calcula la razón WCAG 2.x y sale con código 1 si alguno no cumple. Incluir **mínimo 24 pares** (12 por tema).
5. El logo de §3.2 ya existe en `BrandMark.jsx` y `public/favicon.svg`. Compruébalo a 16, 20, 28 y 48 px en ambos temas (captura ampliada) y ajusta grosores si a 16 px no se distingue la celda rellena.
6. `index.html` ya está actualizado. Haz que el `<title>` cambie a `<Lección> · Grano` dentro de una lección.
7. Reescribir `DESIGN.md` como **referencia corta** del nuevo sistema (≤ 250 líneas): tokens, escala, botones, movimiento, densidad, layout §4.7. Reescribir `PRODUCT.md` con el nombre Grano, áreas y niveles. Sin superlativos.
8. `package.json` ya se llama `grano`. Revisa que no quede "Manual de Datos" en ningún sitio: `grep -rni "manual de datos" src server index.html` → vacío (fuera de `docs/archivo/`).

**Resultado esperado:** la app arranca con las fuentes nuevas sin red, colores neutros y un solo acento; nada roto gracias a los alias.

**Test:**
- `node scripts/check-contrast.mjs` → salida con los 24+ pares y `OK`.
- Con red desconectada (o bloqueando `fonts.googleapis.com` en DevTools), las fuentes cargan: captura de DevTools → Network filtrado por `font`.
- `npm run build` sin errores ni warnings nuevos.
- Capturas de Inicio y Lección 1 en 1280×720 claro/oscuro.

**Final:** reporte `docs/reportes/T1.md`. Avisar al orquestador para que lance T6.

---

### T2 · Puente IA v2 (servidor)

**Archivos que posees:** `server/**`, `vite.config.js` (solo la línea del plugin), `package.json` (scripts `start`, `ai:check`), `.env.example` (nuevo), `Grano.cmd` (nuevo).

**Inicio → leer:** §0.1 completo, Apéndice C completo, `server/aiUltraBridge.js` entero, `src/App.jsx` (función que hace `fetch('/api/ai/query')`), `src/components/TutorPanel.jsx`.

**Pasos:**
1. Ejecutar y pegar en el reporte: `agy --help`, `agy models`, y una prueba por `stdin` con `--model gemini-3.8-flash-low --sandbox` midiendo el tiempo. Confirmar los hallazgos de §0.1.
2. Crear la estructura del Apéndice C: `server/ai/agyRunner.js`, `server/ai/prompts/*.md`, `server/ai/contextBuilder.js`, `server/ai/routes.js`, `server/ai/queue.js`, `server/ai/cache.js`, `server/index.js`.
3. **Eliminar por completo** `buildExpertSynthesis` y cualquier respuesta pre-escrita. Si la IA no está disponible, la API responde un error honesto con `code` y pasos de solución (Apéndice C.6).
4. Eliminar la ruta de `gemini` CLI (no soportada para esta cuenta). Dejar un comentario de una línea explicando por qué.
5. Implementar `agyRunner` según C.2: `spawn` con `shell: false`, prompt por `stdin`, `cwd` en una carpeta vacía de `os.tmpdir()`, `--model` validado contra la lista de `agy models` (cacheada 10 min), `--sandbox`, **sin** `--mode plan` y **sin** `--dangerously-skip-permissions`. Cancelación cuando el cliente cierra la conexión (`req.on('close')` → `child.kill()`).
6. Implementar los endpoints de C.3 con **SSE** para `/api/ai/chat`. Medir y enviar eventos `meta` (modelo, inicio), `delta` (texto), `done` (duración, caracteres) y `error`.
7. `contextBuilder`: el cliente envía `lessonId` y `sectionId`; el servidor **carga la lección desde `src/data/`** (importando el módulo ESM) y construye el contexto. El cliente no envía el texto de la lección. Límite total de prompt: 24 000 caracteres; recortar historial antiguo primero.
8. Cola (`queue.js`): máximo 2 procesos `agy` simultáneos; el resto espera con evento `queued`.
9. Caché (`cache.js`): en `.cache/ai/` para modos sin datos personales (`explain-section`, `glossary`), clave SHA-256 de `modo+lessonId+sectionId+modelo+versión del contenido`. TTL 30 días. Nunca cachear chat libre.
10. `server/index.js`: servidor `node:http` sin Express que sirve `dist/` y monta las mismas rutas `/api/ai/*`. Script `npm start` = `vite build && node server/index.js`. Escucha solo en `127.0.0.1`.
11. `Grano.cmd`: arranca `npm start` y abre `http://127.0.0.1:4173` en el navegador por defecto.
12. `npm run ai:check`: script que imprime si `agy` existe, versión, modelos, y hace una consulta de 1 frase midiendo el primer token y el total.
13. Seguridad: mantener chequeo de `Origin`/`Host` (solo `127.0.0.1`/`localhost`), límites de tamaño, cabeceras defensivas. Añadir un token de sesión aleatorio que el servidor inyecta en `index.html` (`<meta name="grano-session">`) y que el cliente envía en `X-Grano-Session`; rechazar si falta (protege de otras webs que llamen a `127.0.0.1`).
14. Tests con `vitest` (`server/ai/*.test.js`): validación de payload, construcción de argumentos (que nunca contenga `--`, `--mode`, `--dangerously-skip-permissions`), recorte de contexto, cola, y un `agyRunner` con `spawn` simulado. **Mínimo 20 tests.**

**Resultado esperado:** preguntar "¿qué es el grain?" en el tutor devuelve una respuesta real de Gemini en streaming en < 12 s, y si `agy` no está, un error claro con instrucciones.

**Test:**
- `npx vitest run server` → 20+ tests en verde.
- `npm run ai:check` → salida pegada en el reporte.
- `curl -N` contra `/api/ai/chat` (con origen y token correctos) → se ven eventos `meta`, varios `delta`, `done`.
- Renombrar temporalmente la ruta de `agy` (variable `GRANO_AGY_PATH` inexistente) → `/api/ai/status` devuelve `available: false` con `code: "AGY_NOT_FOUND"`. Restaurar.
- `npm start` sirve la app compilada con el tutor funcionando.
- Prueba adversarial: prompt de 50 000 caracteres, JSON inválido, origen `http://evil.test`, sin token, 5 peticiones simultáneas, cancelar a mitad.

**Final:** reporte con tiempos medidos (primer token y total) para `gemini-3.8-flash-low`, `gemini-3.8-flash-medium` y `gemini-4-argon-medium`, 3 consultas cada uno.

---

### T3 · Arquitecto curricular (investigación)

**Archivos que posees:** `docs/curriculo/**`, `src/data/catalog/**` (nuevo).

**Inicio → leer:** §5 completo, Apéndice A, `src/data/learningPath2026.js`, los 6 archivos de `src/data/stages/` (al menos títulos, objetivos y secciones de cada lección), `src/components/CapstoneProjectsView.jsx` (solo el array `CAPSTONE_PROJECTS`).

Este agente **investiga en la web** y lanza **sus propios subagentes de investigación** (uno por área: core, DE, DA, BI) si Antigravity lo permite.

**Pasos:**
1. **Investigación de referencia.** Para cada área, revisar al menos **6 fuentes primarias** actuales (consultadas en oct-2026): temarios oficiales de certificaciones vigentes (p. ej. las de Microsoft para Power BI y Fabric, Google, Databricks, dbt, Snowflake), documentación oficial de las herramientas, y rutas públicas reconocidas (p. ej. roadmap.sh). Para cada fuente: URL, fecha de consulta, qué temas aporta. Guardar en `docs/curriculo/fuentes.md`.
2. **Verificar el estado actual de cada herramienta** citada en §5.2 (versión estable a oct-2026, si sigue mantenida, si cambió de nombre o se integró en otro producto). Tabla en `docs/curriculo/estado-herramientas.md` con columna "fuente". Si una herramienta ya no es relevante, proponer su sustituto.
3. **Comparar** el catálogo de §5.2 con lo investigado. Escribir `docs/curriculo/brechas.md`: temas que faltan, temas que sobran, temas mal ubicados de nivel. **Mínimo 15 observaciones concretas.**
4. **Partes de un borrador que ya existe** (`src/data/catalog/*.js`, 32 módulos, 154 lecciones, `npm run check:catalog` → OK). No lo reescribas desde cero: corrígelo con lo investigado en los pasos 1–3 y documenta cada cambio (añadido, quitado, movido de nivel, renombrado) con su motivo y fuente en `docs/curriculo/cambios-catalogo.md`. La forma final es:
   - `src/data/catalog/tracks.js` — 4 áreas (`core`, `de`, `da`, `bi`) con nombre, descripción de 1 frase, y "qué harás en tu trabajo" (3 tareas reales del puesto).
   - `src/data/catalog/levels.js` — 5 niveles con descripción y "al terminar sabrás…".
   - `src/data/catalog/modules.js` — todos los módulos con: `id`, `track`, `level`, `title`, `goal` (una frase con verbo medible), `prerequisites` (ids), `lessons` (array de `{ id, title, minutes, status: 'existing'|'planned', legacyOrder? }`), `project` (proyecto corto del módulo: enunciado, dataset, entregable).
5. Mapear las 18 lecciones existentes a sus módulos (`legacyOrder`). Si una lección vieja mezcla temas de dos módulos (p. ej. L12, L15, L18), indicar cómo dividirla.
6. Escribir para cada área un **perfil de salida** (`docs/curriculo/perfil-<area>.md`): qué puede hacer la persona al terminar cada nivel, con ejemplos de tareas de trabajo reales.
7. Validar el grafo con `scripts/check-catalog.mjs` (ya existe: prerrequisitos, ciclos, niveles, ids, lecciones heredadas). Amplíalo para que también falle si un módulo no tiene `goal` con verbo medible al inicio o si un proyecto no menciona un entregable.

**Resultado esperado:** catálogo completo y justificado, listo para que la Fase 3 escriba lecciones.

**Test:**
- `node scripts/check-catalog.mjs` → OK, con conteo de módulos y lecciones por área y nivel.
- `docs/curriculo/fuentes.md` tiene ≥ 24 fuentes con URL y fecha.
- Cada módulo tiene `goal`, `prerequisites` y `project` no vacíos.

**Final:** reporte con la tabla resumen (área × nivel → nº módulos, nº lecciones, horas).

---

### T4 · Esquema de contenido, validadores y migración

**Archivos que posees:** `src/data/schema/**` (nuevo), `src/data/lessons/**` (nuevo), `src/data/glossary.js` (nuevo), `src/data/flashcards.js` (nuevo), `scripts/check-content.mjs`, `scripts/check-copy.mjs`, `scripts/migrate-legacy.mjs` (nuevos), `package.json` (scripts `check:*`), y **borrar** `src/data/curriculum2026.js`.

**Inicio → leer:** Apéndice A y B completos; `src/data/stages/stage1Sql.js` completo; los demás `stage*.js` por encima; `src/components/GlossaryAndGraphView.jsx` (array de conceptos); `src/engine/spacedRepetition.js` (array de tarjetas); `src/views/LessonPlayer.jsx` (cómo consume los datos).

**Pasos:**
1. Confirmar con `grep -rn "curriculum2026" src server` que no se usa; borrar el archivo; pegar el grep en el reporte.
2. Definir el esquema de lección v2 (Apéndice A) con `zod` en `src/data/schema/lesson.js`, y los de módulo, glosario y flashcard.
3. Escribir `scripts/migrate-legacy.mjs` que transforme las 18 lecciones al esquema v2, **un archivo por lección** en `src/data/lessons/<moduleId>/<lessonId>.js`. Reglas de migración:
   - `storyContext` → `hook` (quitar "Caso real en NovaPay"; reemplazar por la empresa ficticia Mercado Brisa).
   - `sections` → `sections` (se conservan; el editor de la Fase 3 las recorta).
   - `triadPerspectives` → `roleNotes` **solo** para las áreas donde aporta algo distinto; el script las copia todas y marca `needsReview: true`.
   - `checkpoint` → primer elemento de `checks`.
   - `codeChallenge` → `practice` tipo `fill-blanks` (se mantiene hasta que T10 tenga SQL real).
   - `playground` → `workedExample`.
   - `visualType` → `interactive.component`.
4. Mover el glosario a `src/data/glossary.js` y las flashcards a `src/data/flashcards.js`; actualizar imports en sus componentes (avisar a T12 en el reporte: solo cambian imports).
5. `scripts/check-content.mjs`: valida con zod todas las lecciones y además: ids únicos, `prerequisites` existentes, longitud de cada campo (Apéndice A), al menos N `checks`, cada opción de `checks` con `feedback`, `sources` con URL válida y `accessed`. Imprime una tabla por lección con OK/errores.
6. `scripts/check-copy.mjs`: recorre `src/data/**` y `src/**/*.jsx` buscando los términos prohibidos del Apéndice B (sin distinguir mayúsculas, con límites de palabra), emojis (rango Unicode), "2026" fuera de `sources`/`accessed`, y negritas excesivas (> 3 `**` por párrafo). Salida: archivo, línea, término. Código de salida 1 si hay hallazgos.
7. Adaptador temporal `src/data/lessons/index.js` que exporte `LESSONS` y `MODULES` en el formato que el `LessonPlayer` actual espera, para que la app siga funcionando hasta que T9 termine.
8. Scripts en `package.json`: `check:content`, `check:copy`, `check:catalog`, `check:contrast`, y `check` que los ejecute todos.

**Resultado esperado:** las 18 lecciones viven como archivos v2 validados; la app sigue funcionando; hay validadores automáticos.

**Test:**
- `npm run check:content` → 18 lecciones válidas (las advertencias `needsReview` se listan, no fallan).
- `npm run check:copy` → **se espera que falle** ahora y liste los hallazgos; pegar el conteo por término en el reporte (es la línea base para la Fase 3).
- `npm run dev` y abrir las 18 lecciones: ninguna rota (captura de 3).

**Final:** reporte con el conteo de hallazgos de copy por archivo.

---

### T5 · Estado, persistencia y preferencias

**Archivos que posees:** `src/state/**` (nuevo), `src/App.jsx` (solo la parte de estado y efectos; no el JSX de vistas), `src/engine/spacedRepetition.js` → reemplazo por `src/engine/review.js`.

**Inicio → leer:** `src/App.jsx` completo, `src/engine/spacedRepetition.js`, `src/engine/adaptiveEngine.js` (las funciones exportadas y dónde se usan), `src/main.jsx`.

**Pasos:**
1. Inventariar todas las claves de `localStorage` (`grep -rn "localStorage" src`). Tabla en el reporte.
2. Crear un único estado persistido `grano:v1` con forma:
   ```js
   {
     version: 1,
     profile: { track: 'de'|'da'|'bi'|null, startLevel: 0..4, onboarded: boolean, createdAt },
     prefs: { theme: 'system'|'light'|'dark', density: 'auto'|'comfortable'|'compact', scale: 0.9|1|1.1|1.25, aiModelFast, aiModelDeep, aiEnabled: true, reducedMotion: 'system'|'on' },
     progress: { lessons: { [lessonId]: { status, sectionId, startedAt, completedAt, checks: {...}, practice: {...} } }, projects: {...} },
     review: { cards: { [cardId]: FSRSCard } },
     tutor: { threads: { [lessonId]: Message[] } }   // máx. 30 mensajes por lección
   }
   ```
3. `src/state/store.js` con `useSyncExternalStore` (sin librerías), acciones con nombre (`completeLesson`, `answerCheck`, `setTrack`, `setPref`, …) y una acción **no persistida** `openTutor({ mode, lessonId, sectionId, selection, code, result, prefill })` que T9, T10 y T12 usan para abrir el tutor con contexto sin depender de T11, escritura a `localStorage` con *debounce* de 300 ms y `try/catch`.
4. **Migración**: al primer arranque, leer las claves viejas (`manual_datos_*`, `ruta_datos_2026_*`, `leitner*`), convertirlas a `grano:v1` y borrarlas. Test con un fixture de estado viejo.
5. Sustituir Leitner por **FSRS** con `ts-fsrs`. Cada flashcard se programa con FSRS; las tarjetas solo aparecen para lecciones iniciadas.
6. Exportar e importar progreso: `exportState()` → descarga `grano-progreso-AAAA-MM-DD.json`; `importState(file)` valida la forma con zod antes de aplicar.
7. Reducir `App.jsx`: que solo componga proveedores, enrutado de vistas y paneles. Objetivo: **< 250 líneas**.
8. Tests `vitest`: migración, acciones, FSRS (una tarjeta respondida "bien" se aleja en el tiempo), exportar/importar. **Mínimo 15 tests.**

**Resultado esperado:** un solo estado, persistente, migrable, exportable.

**Test:** `npx vitest run src/state src/engine` en verde; `App.jsx` < 250 líneas (`wc -l`); recargar la app conserva progreso; borrar `localStorage` → la app arranca en onboarding.

**Final:** reporte con la tabla de claves antiguas → nuevas.

---

### T6 · Componentes base y movimiento (empieza cuando T1 está fusionado)

**Archivos que posees:** `src/components/ui/**`, `src/styles/components.css`, `src/styles/animations.css`, `src/components/ui/UiShowcase.jsx`.

**Inicio → leer:** §4 completo; todos los archivos de `src/components/ui/`; `components.css`; `animations.css`; capturas de `F0-antes`.

**Pasos:**
1. Rehacer `Button` según §4.4 (variantes, tamaños, estados, `loading` sin saltos de ancho, botón de solo icono con tooltip obligatorio).
2. Rehacer `Chip` (neutral y de área con punto), `Card` (sin sombra, `interactive` con borde `--line-strong` en hover), `ProgressBar` (2 px y 4 px, color `--brand`), `Tabs` y nuevo `Segmented` con indicador deslizante, `Tooltip`, `Toast` (abajo a la derecha, apilable, 4 s), `Sheet`/`Drawer`, `Kbd`, `Skeleton` (solo se muestra si la carga dura > 300 ms), `Callout` (4 tonos sin fondos saturados: borde izquierdo de 2 px + icono).
3. Nuevo `AnswerOption` según §4.6 (sin `pop`/`shake`).
4. Nuevos: `IconButton`, `Menu` (dropdown accesible con flechas y `Esc`), `Dialog` (con `<dialog>` nativo), `EmptyState` sin ilustración por defecto (ilustración opcional de una línea gris).
5. Eliminar `Badge` y `ProgressRing` si nadie más los necesita tras la Fase 2 (consultar con el orquestador); de momento marcarlos `@deprecated` en un comentario.
6. Reescribir `animations.css` con solo las animaciones de §4.6 y el bloque `prefers-reduced-motion`.
7. Implementar el helper `src/components/ui/viewTransition.js` (`withViewTransition(fn)`).
8. Rehacer `UiShowcase` (`?ui=1`) mostrando cada componente en todos sus estados, en ambos temas y en densidad compacta.
9. Accesibilidad: cada componente interactivo con rol, `aria-*` y manejo de teclado. Documentar en un comentario de 1–2 líneas al inicio de cada archivo.
10. **Conversión `px → rem` de todo `src/styles/`** (necesaria para la escala de §4.5). Se hace aquí porque T6 es el único agente activo en ese momento y en la Fase 2 varios agentes editan esos CSS en paralelo. Durante este paso el orquestador te concede la propiedad temporal de todo `src/styles/`. Se permite un script de ayuda, pero revisa el resultado a mano: los bordes de 1 px, las sombras y los `outline` se quedan en `px`. Reporta cuántos `px` quedan por archivo y por qué.

**Resultado esperado:** biblioteca coherente; `?ui=1` muestra todo; `src/styles/` en `rem`.

**Test:**
- Capturas de `?ui=1` en 1280×720 claro, oscuro y compacto.
- Navegar `?ui=1` solo con teclado: cada control alcanzable y con foco visible (lista en el reporte).
- `grep -rn "sparkle\|pulse-ring\|keyframes pop\|keyframes shake" src` → vacío.

**Final:** reporte + aviso al orquestador para lanzar la Fase 2.

---

## §8. Fase 2 — Interfaz

Siete subagentes en paralelo (T7–T13). Requisitos: T1, T4, T5 y T6 fusionados. T11 requiere T2.

---

### T7 · Shell, navegación, densidad y escala

**Archivos que posees:** `src/layout/**`, `src/styles/layout.css`, `src/styles/views/shell.css`, y el bloque de alias temporales de `tokens.css` (para borrarlo al final; ver paso 7). También `scripts/shots.mjs`: actualízalo cuando cambies la navegación para que siga capturando todas las vistas.

**Inicio → leer:** §4.4–4.7; `AppShell.jsx`; `shell.css`; `layout.css`; capturas `F0-antes` de 1280×720 y 390×844.

**Pasos:**
1. Barra superior: logo + "grano" · buscador (`Ctrl+K`) · estado de la IA (punto + "IA lista" / "IA no disponible", con tooltip que dice el modelo) · botón "Preguntar" (abre el tutor) · menú de usuario (Ajustes, Exportar progreso, Tema). Alto 52 px / 44 px compacta. **Quitar** del header el selector de tema de 3 botones (va a Ajustes y al menú).
2. Navegación: **Hoy**, **Ruta**, **Práctica**, **Repaso**, **Glosario**, **Progreso**, y abajo **Ajustes**. Lateral 232 px colapsable a rail de 56 px (con tooltips), estado recordado en `prefs`.
3. Móvil: barra inferior con Hoy, Ruta, Repaso, Práctica, Más.
4. Implementar densidad y escala de §4.5 (atributos en `<html>`, atajos `Ctrl +/-/0`, aviso de escala).
5. Paleta de comandos `Ctrl+K`: buscar lecciones, módulos, términos del glosario y acciones ("Cambiar tema", "Ir a ajustes", "Preguntar al tutor"). Resultados agrupados, navegación con flechas, `Enter`, `Esc`.
6. Comprobar que nada del shell usa `px` para tipografía o espaciado (T6 ya convirtió `src/styles/`); corregir lo que T6 no haya cubierto en tus archivos.
7. **Cuando las demás tareas de la Fase 2 estén fusionadas** (el orquestador lo indica y te concede propiedad temporal de `src/`): borrar los alias temporales de `tokens.css`, sustituir cada uso por el token nuevo y arreglar lo que se rompa. `grep` de cada alias → 0. Capturas de todas las vistas para comprobar que nada cambió de aspecto sin querer.

**Resultado esperado:** shell sobrio, una sola fuente de navegación, interfaz escalable.

**Test:**
- Capturas del shell en las 5 resoluciones, claro/oscuro, cómoda/compacta.
- Con escala 90 % a 1280×720, ninguna etiqueta del lateral se corta (captura).
- `Ctrl +` tres veces → 125 %, `Ctrl 0` → 100 % (captura del aviso).
- Navegación completa por teclado del shell (lista de tabulaciones en el reporte).

**Final:** reporte.

---

### T8 · Onboarding, selección de área y Ruta

**Archivos que posees:** `src/views/Onboarding.jsx` (nuevo), `src/views/RoadmapView.jsx`, `src/styles/views/onboarding.css` (nuevo), `src/styles/views/roadmap.css`, `src/components/DiagnosticModal.jsx`.

**Inicio → leer:** §5 completo; `src/data/catalog/*` (de T3); `RoadmapView.jsx`; `DiagnosticModal.jsx`; `roadmap.css`.

**Pasos:**
1. **Onboarding** (primera vez, 3 pantallas, saltable con "Ya sé lo que quiero" en cada una):
   1. "¿Qué quieres hacer con datos?" — tres tarjetas grandes **sin ilustración**: *Construir la infraestructura* (DE), *Responder preguntas con datos* (DA), *Dar a la empresa sus tableros y métricas* (BI); y un enlace "Aún no lo sé" que explica las tres con "un día de trabajo típico" (3 líneas cada una, contenido de `tracks.js`).
   2. "¿Desde dónde empiezas?" — Desde cero (nivel 0) · Sé algo de SQL y hojas de cálculo (nivel 1) · Trabajo con datos (prueba de nivel).
   3. Resumen: "Tu ruta: Tronco común (N lecciones) → Ingeniería de Datos (M lecciones). Unas X horas." + botón primario "Empezar".
2. **Prueba de nivel** (reutilizar `DiagnosticModal`, rediseñado): 10 preguntas de dificultad creciente del tronco común y del área elegida; sugiere un nivel de inicio y marca como "sabido" (no "completado") lo anterior. El usuario puede corregir la sugerencia.
3. **Ruta** rediseñada:
   - Arriba: segmented control con el área (`DE · DA · BI · Todo`) y el progreso de la ruta (barra de 4 px + "23 de 96 lecciones · 31 h restantes").
   - Cuerpo: niveles como secciones verticales. En cada nivel, los módulos como **filas** (no tarjetas grandes): número, título, objetivo en una línea, nº lecciones, minutos, estado. Al expandir un módulo se ven sus lecciones como lista compacta con estado (pendiente, en curso, hecha, sabida) y "Recomendado antes: …".
   - Módulos de otras áreas: ocultos en la vista de área; visibles en "Todo".
   - Lecciones `planned` (aún no escritas): visibles en gris con "En preparación"; no clicables.
4. Cambiar de área desde Ruta o Ajustes conserva todo el progreso.

**Resultado esperado:** la persona elige área y nivel en < 1 minuto y ve una ruta clara.

**Test:**
- Flujo completo con `localStorage` vacío: onboarding → DA → desde cero → Ruta (capturas de cada pantalla a 1280×720 y 390×844).
- Prueba de nivel acertando todo → sugiere nivel 2 del área (captura).
- Ruta con 0 %, 40 % y 100 % de progreso simulado (capturas).
- Prueba adversarial: título de módulo de 120 caracteres, módulo sin lecciones escritas, cambiar de área 5 veces seguidas.

**Final:** reporte.

---

### T9 · Reproductor de lección v2

**Archivos que posees:** `src/views/LessonPlayer.jsx` (y los subcomponentes que cree en `src/views/lesson/`), `src/styles/views/lesson.css`, `src/utils/formatText.jsx`.

**Inicio → leer:** Apéndice A; §4.5–4.7; `LessonPlayer.jsx` completo; `lesson.css`; `formatText.jsx`; `LessonVisualizers.jsx` (solo la interfaz de props); 3 lecciones en `src/data/lessons/`.

**Pasos:**
1. Cambiar de "7 pasos obligatorios" a **lectura continua con secciones**, porque el contenido es lectura técnica y el pager obligaba a hacer clic para leer:
   - Cabecera compacta: ruta de migas (Área › Módulo), título (Newsreader `--fs-7`), metadatos en una línea (minutos · nivel · prerrequisitos).
   - Bloques en orden: `hook` → `objectives` → `sections` (con `interactive` y `workedExample` intercalados donde el esquema los coloca) → `checks` → `practice` → `summary`.
   - Índice lateral (temario) con las secciones de **esta** lección y su estado; la sección visible se resalta al hacer scroll (`IntersectionObserver`).
2. Una sola barra de progreso (2 px, bajo la barra superior). Pie fijo con "← Anterior" / "Siguiente lección →" que solo aparece al final de la lectura.
3. **Comprobaciones** (`checks`) en línea, una tarjeta cada una, tipos: opción múltiple, predecir el resultado de una consulta, ordenar pasos, completar código. Feedback inmediato por opción. Botón "No lo entiendo" que abre el tutor con el contexto de esa pregunta y la respuesta elegida.
4. `roleNotes` como un bloque plegable "Desde tu área" que muestra **solo** la nota del área del usuario (y "ver las otras" para abrir las demás).
5. **Seleccionar texto** en la lección muestra un botón flotante pequeño "Preguntar" que abre el tutor con la selección como cita.
6. Términos del glosario enlazados automáticamente (primera aparición por sección): subrayado punteado; al pasar el ratón o enfocar, tarjeta con la definición corta.
7. Atajos: `J`/`K` sección siguiente/anterior, `T` temario, `/` preguntar al tutor, `?` muestra los atajos.
8. Completar una lección = leer hasta el final + responder todos los `checks` + enviar la práctica (correcta o no). Mostrar qué falta si intenta marcarla antes.
9. Adaptar `formatText.jsx` para soportar el subconjunto de Markdown del Apéndice A (párrafos, listas, `código`, **negrita** con moderación, enlaces, tablas pequeñas) y nada más.

**Resultado esperado:** a 1280×720 la lección se lee como un capítulo bien maquetado, sin pasos que fragmenten el texto.

**Test:**
- Capturas de L1 completa (scroll por tramos) en 1280×720, 1440×900, 390×844; claro y oscuro.
- Con el tutor abierto a 1280×720 y a 1600×900: el texto de la lección **nunca** queda en menos de 640 px (o el tutor se superpone según §4.7). Captura de ambos.
- Navegar la lección solo con `J`/`K` y responder un check con teclado.
- `prefers-reduced-motion` activado: sin animaciones (captura de la configuración + comprobación).
- Prueba adversarial: lección sin `interactive`, sin `practice`, con 8 `checks`, con una tabla de 7 columnas en el texto.

**Final:** reporte.

---

### T10 · Laboratorio SQL real (DuckDB-Wasm) y dataset Mercado Brisa

**Archivos que posees:** `src/lab/**` (nuevo), `src/styles/views/lab.css` (nuevo), `scripts/generate-dataset.mjs` (nuevo), `public/datasets/**` (nuevo), `src/components/AuthenticCodeLab.jsx`, `src/components/PipelineOrderChallenge.jsx`, `src/views/PracticeView.jsx` (nuevo).

**Inicio → leer:** §5.3; Apéndice A (sección `practice`); `AuthenticCodeLab.jsx`; `PipelineOrderChallenge.jsx`; documentación oficial de `@duckdb/duckdb-wasm` (versión estable a oct-2026: verificarla y anotarla).

**Pasos:**
1. `scripts/generate-dataset.mjs`: genera Mercado Brisa con semilla fija (mismo resultado siempre). Usar DuckDB en Node (`@duckdb/node-api` u otra opción oficial vigente; justificar) para escribir Parquet. Incluir los errores intencionales de §5.3 y un `public/datasets/README.md` que los documente. Tamaño total < 8 MB.
2. `src/lab/duckdb.js`: carga **perezosa** de DuckDB-Wasm (solo al abrir una práctica o la vista Práctica), en un Web Worker, con los archivos de `public/datasets/` registrados como tablas. Mostrar "Preparando el motor SQL…" con tiempo real si tarda > 300 ms.
3. Editor con CodeMirror 6 (`@codemirror/lang-sql`, tema propio con los tokens): resaltado, autocompletado de tablas/columnas del dataset, `Ctrl+Enter` ejecuta.
4. Tabla de resultados: cabecera fija, números alineados a la derecha en mono, máximo 200 filas mostradas con aviso, tiempo de ejecución, filas devueltas. Errores de DuckDB mostrados tal cual en un bloque `--bad`, con botón "Explícame este error" (tutor, modo `explain-error`).
5. **Corrección automática** de prácticas SQL: cada `practice` de tipo `sql` define `expected` como una consulta de referencia; se comparan resultados (mismas columnas por nombre, mismas filas, orden solo si `orderMatters`), tolerancia numérica 1e-6. Mostrar diferencias: filas que faltan / sobran (máximo 5 de cada).
6. Botón "Revisar mi consulta con IA" (modo `review-sql`): envía consulta, resultado resumido y enunciado.
7. Vista **Práctica**: catálogo de ejercicios de todas las lecciones desbloqueadas + un "SQL libre" contra Mercado Brisa, con el esquema de tablas en un panel lateral.
8. Mantener `fill-blanks` y `order-steps` (de `AuthenticCodeLab` y `PipelineOrderChallenge`) reestilizados para lecciones donde SQL real no aplica.
9. Convertir las prácticas de las 18 lecciones migradas a `sql` real cuando el tema lo permita (al menos **10 de 18**); en el resto, justificar por qué no.

**Resultado esperado:** el alumno escribe SQL de verdad contra datos coherentes y recibe corrección precisa.

**Test:**
- `node scripts/generate-dataset.mjs` dos veces → mismos hashes SHA-256 de los archivos (pegar).
- Ejecutar 5 consultas en la vista Práctica (capturas), una con error de sintaxis.
- Práctica de L1 resuelta bien y mal (capturas de ambos feedbacks).
- Medir: tiempo hasta primer resultado en frío y en caliente; tamaño descargado (DevTools → Network). Anotar.
- `npm run build`: DuckDB-Wasm **no** está en el bundle inicial (comprobar los chunks de `dist/assets`).

**Final:** reporte.

---

### T11 · Tutor IA (interfaz) y funciones con IA

**Requiere T2 fusionado.**

**Archivos que posees:** `src/components/TutorPanel.jsx` (y `src/components/tutor/**`), `src/styles/views/tutor.css`, `src/ai/**` (cliente, nuevo).

**Inicio → leer:** Apéndice C completo; §4.7; `TutorPanel.jsx`; `tutor.css`; `server/ai/routes.js` (de T2).

**Pasos:**
1. `src/ai/client.js`: `streamChat({ mode, lessonId, sectionId, messages, selection, code, result, model }, { onMeta, onDelta, onDone, onError, signal })` sobre SSE con `fetch` + `ReadableStream` (no `EventSource`, para poder hacer POST). `getStatus()`, `getModels()`.
2. Panel del tutor según §4.7. Cabecera: "Tutor" + contexto actual en una línea gris ("Lección: Grano y fan-out · Sección 2") + selector de modelo compacto (*Rápido* = Flash, *Profundo* = Argon) + cerrar.
3. Mensajes: usuario alineado a la derecha en `--sunken`; tutor a la izquierda sin burbuja, con Markdown renderizado (mismo subconjunto que las lecciones + bloques de código con botón "Copiar" y "Abrir en el laboratorio" si es SQL).
4. Estados honestos:
   - **Esperando primer token:** "Pensando… 4 s" (contador real) y botón "Detener".
   - **En cola:** "En cola (1 por delante)".
   - **Streaming:** el texto aparece tal como llega; cursor de bloque fino al final.
   - **Error:** tarjeta con el `message` del servidor y sus pasos de solución, botón "Reintentar".
   - **IA no disponible:** el botón "Preguntar" del header se ve deshabilitado con tooltip; el panel explica cómo activarla. **Nunca** se muestra texto pre-escrito como si fuera respuesta.
5. Sugerencias contextuales (máx. 3, cambian por sección): "Explícame esta sección con otro ejemplo", "¿Qué error de trabajo evita esto?", "Hazme una pregunta para comprobar si lo entendí".
6. Historial por lección guardado en el store (máx. 30 mensajes) con "Nueva conversación".
7. **Funciones IA en el resto de la app** (llamadas desde otros componentes a `src/ai/client.js`, coordinando con sus dueños vía el orquestador):
   - `explain-error`: desde un check fallado o un error SQL.
   - `review-sql`: desde la práctica.
   - `feynman`: al final de cada módulo, "Explícalo con tus palabras": el alumno escribe 80–200 palabras; la IA devuelve JSON `{ score: 0-4, aciertos: [], huecos: [], siguientePaso }` validado con zod y se muestra como rúbrica.
   - `quiz-more`: "Dame 3 preguntas más" → JSON validado; si no valida tras 1 reintento, error honesto.
   - `interview`: en Progreso → "Simulacro de entrevista" por área y nivel (5 preguntas, una a una, con feedback).
8. Accesibilidad: `aria-live="polite"` en la zona de respuesta (anunciar al terminar, no cada delta), foco al input al abrir, `Esc` cierra.

**Resultado esperado:** un tutor que responde de verdad, rápido, con contexto y sin fingir.

**Test:**
- Con `agy` real: 5 preguntas en 3 lecciones distintas, capturas con tiempos (primer token y total).
- Cancelar a mitad → el proceso `agy` muere (comprobar con `tasklist | findstr agy` antes/después).
- Simular `agy` no disponible (variable de T2) → capturas del estado deshabilitado y del panel.
- `feynman` con una explicación buena y una mala → rúbricas distintas (capturas).
- A 1280×720 el panel no tapa el botón "Siguiente lección" ni el input del laboratorio (o se puede cerrar con `Esc`).
- A 390×844, dentro de una lección, el tutor se abre desde el botón "Preguntar" y ocupa la hoja inferior completa (captura).

**Final:** reporte con la tabla de tiempos.

---

### T12 · Vistas secundarias: Hoy, Repaso, Glosario, Progreso, Ajustes, Proyectos

**Archivos que posees:** `src/views/HomeView.jsx`, `src/components/SpacedRepetitionView.jsx`, `src/components/GlossaryAndGraphView.jsx`, `src/components/LearningAnalyticsView.jsx`, `src/components/CapstoneProjectsView.jsx`, `src/views/SettingsView.jsx` (nuevo), `src/styles/views/home.css`, `src/styles/views/secondary.css`, `src/assets/illustrations/**`.

**Inicio → leer:** §4; §5; `HomeView.jsx`; las 4 vistas secundarias; `home.css`; `secondary.css`; capturas `F0-antes`.

**Pasos:**
1. **Hoy** (sustituye a Inicio):
   - **Sin hero, sin saludo, sin degradado** (ya hecho: hoy hay un título "Hoy" + línea de estado). Cuando exista el área elegida (T5/T8), la línea pasa a ser: "Ingeniería de Datos · Nivel 1 · 12 de 96 lecciones".
   - Bloque principal "Continuar": lección actual con su sección, minutos restantes y botón primario.
   - "Repaso de hoy": nº de tarjetas FSRS pendientes y botón (si 0, una línea gris "Nada pendiente", no una tarjeta vacía).
   - "Siguiente en tu ruta": las 3 próximas lecciones como lista compacta.
   - "Esta semana": 7 celdas (L–D) rellenas con `--brand` según minutos estudiados. Sin rachas ni fuego.
   - Si el usuario es nuevo, todo esto se sustituye por una sola tarjeta "Empieza por: <primera lección>".
2. **Repaso**: una tarjeta a la vez, grande, con "Mostrar respuesta" y luego 4 botones FSRS: *Otra vez*, *Difícil*, *Bien*, *Fácil* (atajos 1–4), mostrando debajo de cada uno cuándo volverá ("10 min", "2 d"…).
3. **Glosario**: buscador + filtro por área + lista alfabética (término, definición de 1 frase, lecciones donde aparece). Vista del término: definición, ejemplo, "se confunde con…", lecciones relacionadas. El grafo de conceptos solo se conserva si se lee bien a 1280×720; si no, se quita y se justifica.
4. **Progreso**: horas por semana (barras simples), progreso por nivel y módulo, precisión en checks por módulo, temas débiles (checks fallados más de una vez) con enlace a la sección. Seguir la skill `dataviz` si está disponible: ejes limpios, sin 3D, sin donuts.
5. **Proyectos**: uno por módulo (de `modules.js`) + 1 proyecto final por área. Cada uno con enunciado, dataset, entregable, rúbrica de 4 criterios y casilla "Lo entregué" con enlace opcional a su repositorio.
6. **Ajustes**: área, nivel, tema, densidad, escala, movimiento reducido, modelos IA (lista de `/api/ai/models`), IA activada/desactivada, exportar/importar progreso, reiniciar todo (con `Dialog` de confirmación escribiendo "reiniciar").
7. Ilustraciones: eliminar las de etapas y de estado salvo que se reduzcan a dibujos de línea de un solo color (`--ink-3`) y aporten algo. Reportar qué se borró.

**Resultado esperado:** vistas útiles, densas en información y sin cajas vacías.

**Test:** capturas de cada vista en 1280×720 y 390×844 con usuario nuevo y con progreso simulado; repaso de 5 tarjetas solo con teclado; exportar → reiniciar → importar → progreso igual.

**Final:** reporte.

---

### T13 · Simuladores: consolidación visual

**Archivos que posees:** `src/components/LessonVisualizers.jsx`, `src/components/visualizers/**`, `src/styles/views/simulators.css`.

**Inicio → leer:** §4 completo; los tres archivos JS y el CSS; capturas de cada simulador en `F0-antes` (si no están, hacerlas primero, **una por simulador**).

**Pasos:**
1. Inventario: lista de los simuladores (`visualType`), con qué enseñan y qué controles tienen. Tabla en el reporte.
2. Para cada simulador, aplicar un marco común: título corto, una línea de instrucción ("Mueve el control para…"), área de interacción, y **una lectura** debajo que explique en una frase qué está pasando con los valores actuales (dinámica, no fija).
3. Eliminar los 36 `style={{}}` inline (salvo variables CSS dinámicas tipo `--value`, que sí se permiten). `grep -c "style={{" ` antes/después.
4. Colores: datos en `--ink`/`--ink-2`, resaltados en `--brand`, "mal" en `--bad`, "bien" en `--ok`. Los colores de área solo si el simulador compara áreas.
5. Tablas de los simuladores con `container queries`: a < 520 px de contenedor, pasan a tarjetas apiladas o hacen scroll horizontal **dentro** del simulador con sombra de borde que lo indique.
6. Exponer el estado actual de cada simulador mediante un callback `onStateChange` para que el tutor lo reciba como contexto.
7. Animaciones solo según §4.6 (p. ej. filas que se duplican en el fan-out: aparecen con *stagger*).

**Resultado esperado:** los simuladores parecen de la misma familia y caben en 1280×720.

**Test:** captura de **cada** simulador a 1280×720 y 390×844 (claro) y 1440×900 (oscuro); `grep` de estilos inline; manejar cada simulador con teclado.

**Final:** reporte.

---

## §9. Fase 3 — Contenido (muchos subagentes)

### 9.1 Organización

- **Un subagente escritor por módulo** (`W-<moduleId>`), modelo Gemini 4 Argon High. Puede lanzar sus propios subagentes de investigación por lección.
- **Editor de estilo** (`E1`): revisa todas las lecciones contra el Apéndice B; no cambia hechos.
- **Verificador** (`F1`): comprueba cada afirmación técnica que dependa de versión o fecha, y cada fuente.
- **Olas** (no empezar una ola sin cerrar la anterior):
  - **Ola A — Tronco común nivel 0 y 1** (10 módulos: `c0-*`, `c1-*`). Es lo que convierte la app en "de cero".
  - **Ola B — Nivel 2 común + nivel 2 de cada área** (`c2-*`, `de2-*`, `da2-*`, `bi2-*`). Incluye la migración y edición de L2–L9.
  - **Ola C — Niveles 3 y 4** de cada área + experto común.
- Paralelismo: dentro de una ola, todos los `W-*` a la vez; luego `F1` y `E1` en paralelo sobre lo producido; luego el orquestador.

### 9.2 Ficha de un escritor de módulo (`W-<moduleId>`)

**Archivos que posees:** `src/data/lessons/<moduleId>/**`, `docs/curriculo/investigacion/<moduleId>.md`, entradas nuevas en `src/data/glossary.js` y `src/data/flashcards.js` (solo añadir, no editar las de otros; en caso de conflicto, el orquestador fusiona).

**Inicio → leer:** §1, §2, §5 (tu módulo y sus prerrequisitos), Apéndice A, Apéndice B, el registro de tu módulo en `src/data/catalog/modules.js`, las lecciones de los módulos prerrequisito (para no repetir y para enlazar), `public/datasets/README.md` (tablas de Mercado Brisa), y si tu módulo tiene lecciones `[L#]`, su archivo migrado.

**Pasos:**
1. **Investigación** (por cada lección): mínimo **3 fuentes**, de las cuales al menos 2 primarias (documentación oficial, especificación, artículo académico o libro de referencia). Anotar en `docs/curriculo/investigacion/<moduleId>.md`: fuente, fecha de consulta, qué afirmación respalda. Para cualquier dato que dependa de versión (sintaxis, función disponible, límite, precio) la fuente debe ser de 2026.
2. **Mapa de conceptos** del módulo: qué concepto introduce cada lección, qué conceptos asume. Si una lección asume algo que ninguna lección previa enseña, avisar al orquestador.
3. **Escribir cada lección** con el esquema del Apéndice A y las reglas del Apéndice B, en este orden: `objectives` → `checks` (sí, antes del texto: así el texto enseña lo que se evalúa) → `sections` → `workedExample` → `practice` → `hook` → `summary` → `flashcards` → `roleNotes` (solo si aporta) → `sources`.
4. **Ejecutar** todo SQL de `workedExample` y `practice` contra Mercado Brisa en DuckDB y pegar el resultado real en el campo `expectedOutput`. Nada de resultados inventados.
5. **Glosario:** añadir los términos nuevos del módulo (definición de ≤ 25 palabras, ejemplo, "se confunde con").
6. **Proyecto del módulo:** completar enunciado, dataset y rúbrica en `modules.js` (pedir el cambio al orquestador si no posees el archivo).
7. **Autoevaluación** de cada lección con la rúbrica de 9.4, puntuando cada criterio y corrigiendo todo lo que baje de 3.

**Resultado esperado por lección:** pasa `check:content` y `check:copy` sin errores, SQL verificado, ≥ 3 fuentes, rúbrica ≥ 3 en todos los criterios.

**Test:**
- `npm run check:content -- --module <moduleId>` y `npm run check:copy -- --path src/data/lessons/<moduleId>` → 0 errores.
- Abrir cada lección en la app a 1280×720: capturas de la cabecera y de la práctica resuelta.
- Pedir al tutor IA, en cada lección, "Hazme una pregunta para comprobar si lo entendí" y responderla mal a propósito: el tutor debe detectar el error. Anotar el resultado (esto prueba que el contenido da contexto suficiente).

**Final:** reporte con la tabla: lección · palabras · checks · prácticas · fuentes · puntuación de rúbrica.

### 9.3 Ficha del editor (`E1`) y del verificador (`F1`)

**E1 — Editor de estilo**
- **Inicio:** Apéndice B, `npm run check:copy` (línea base).
- **Pasos:** por cada lección de la ola: (1) leerla en voz alta mentalmente, frase por frase; (2) cortar toda frase que no enseñe algo; (3) reemplazar términos prohibidos; (4) partir párrafos de > 90 palabras; (5) negritas solo en el término que se define; (6) títulos de sección como afirmaciones o preguntas concretas ("Por qué el JOIN duplica el importe"), no etiquetas ("Introducción", "Conceptos clave").
- **Test:** `check:copy` → 0 hallazgos. Media de palabras por frase < 22 (el script lo calcula; añadirlo a `check-copy.mjs` si no está, coordinando con el orquestador).
- **Final:** reporte con antes/después de 5 párrafos representativos.

**F1 — Verificador**
- **Pasos:** extraer de cada lección las afirmaciones verificables (versiones, nombres de funciones, comportamientos por defecto, cifras). Para cada una: fuente que la respalda, ¿coincide?, corrección. Comprobar que cada URL de `sources` responde (HTTP 200) y dice lo que la lección afirma.
- **Test:** tabla `docs/curriculo/verificacion-<ola>.md` con 100 % de afirmaciones revisadas; 0 URLs rotas.
- **Final:** lista de correcciones aplicadas (o enviadas al escritor).

### 9.4 Rúbrica de calidad de una lección (0–4 por criterio; mínimo 3 en todos)

| Criterio | 4 = excelente |
|---|---|
| Objetivo claro | Los objetivos usan verbos observables y los `checks` evalúan exactamente eso. |
| Progresión | Cada sección se apoya en la anterior; ningún concepto se usa antes de explicarlo. |
| Ejemplo concreto | Hay un ejemplo con datos de Mercado Brisa y resultado real. |
| Error típico | Se muestra el error más común del tema y cómo detectarlo. |
| Práctica | El alumno hace algo (no solo lee) y recibe corrección automática. |
| Brevedad | Ninguna frase sobra; el texto cabe en el rango de palabras del Apéndice A. |
| Precisión | Todo lo dependiente de versión tiene fuente de 2026 y está verificado por F1. |
| Tono | Cumple el Apéndice B; cero términos prohibidos. |

---

## §10. Fase 4 — QA, pulido y cierre

### Q1 · Pruebas automatizadas
- **Archivos:** `tests/e2e/**` (nuevo), `tests/unit/**`, `package.json` (scripts `test`, `test:e2e`).
- **Pasos:** escribir con `playwright-core` (usando Edge o Chrome instalados) los flujos de la tabla E.2 del Apéndice E. Usar `GRANO_AI_MOCK=1` (un modo de prueba del servidor que **solo existe con esa variable** y devuelve "[MOCK] …" claramente marcado) para que los e2e no dependan de `agy`. Añadir 1 prueba real opcional `test:e2e:ai` que sí usa `agy`.
- **Test:** `npm test` y `npm run test:e2e` en verde, salida pegada.

### Q2 · Accesibilidad y rendimiento
- **Pasos:** ejecutar `axe-core` (vía playwright) en cada vista y corregir todo lo `serious`/`critical`; navegación completa por teclado; lector de pantalla (Narrador de Windows) en la lección y el tutor; Lighthouse (performance, accesibilidad, buenas prácticas) en `npm start`.
- **Objetivos:** 0 violaciones axe serias; Lighthouse accesibilidad ≥ 95, rendimiento ≥ 90 en Inicio; bundle inicial JS < 250 KB gzip (sin DuckDB, que es perezoso); LCP < 1.5 s en local.
- **Test:** informes guardados en `docs/reportes/Q2/`.

### Q3 · Revisión visual y pulido
- **Pasos:** ejecutar `scripts/shots.mjs` con la matriz completa (Apéndice E.1) y comparar con `F0-antes`. Para cada captura, revisar: alineación, recortes, textos que saltan de línea mal, estados vacíos, contraste en oscuro. Abrir incidencias concretas y corregirlas (o devolverlas al dueño).
- **Mínimo 30 correcciones documentadas** con captura antes/después.

### Cierre (orquestador)
1. `npm run check && npm test && npm run test:e2e && npm run build` → todo en verde.
2. `docs/reportes/FINAL.md`: qué se hizo por fase, métricas antes/después (tabla), capturas clave antes/después (Inicio, Ruta, Lección, Tutor, Práctica a 1280×720), problemas conocidos y siguientes pasos.
3. Verificar a mano, con `agy` real, el recorrido: onboarding → lección del nivel 0 → check fallado → "No lo entiendo" → respuesta real del tutor → práctica SQL → repaso.
4. Commit final y tag `v2.0.0-grano`.

**Métricas de éxito (antes → objetivo):**

| Métrica | Antes | Objetivo |
|---|---|---|
| Tutor responde con IA real | No (texto fijo) | Sí, primer token < 10 s con Flash |
| Lecciones | 18 | Ola A+B: ≥ 70; final: ~150 |
| Nivel 0 (desde cero) | 0 lecciones | ≥ 20 lecciones |
| Áreas seleccionables | 0 | 3 + tronco común |
| Prácticas con SQL real | 0 | ≥ 60 % de las lecciones con SQL |
| Apariciones de "2026" en UI/contenido | 251 | 0 (salvo fechas de consulta de fuentes) |
| Términos prohibidos (`check:copy`) | línea base de T4 | 0 |
| Colores de acento | 12+ | 1 de marca + 3 de área |
| `@keyframes` | 14 | ≤ 6 |
| `style={{}}` inline | 36 | 0 (salvo variables CSS) |
| Ancho mínimo del texto de lección con tutor abierto | ~300 px | ≥ 640 px o tutor superpuesto |
| Fuentes externas en runtime | Google Fonts | 0 |

---

## §11. Mejoras adicionales propuestas (después del cierre; no bloquean)

1. **Python en el navegador con Pyodide** (carga perezosa) para las lecciones de `c1-python` y `da*`, con la misma corrección automática que SQL.
2. **Notas del alumno** por sección, exportables a Markdown.
3. **Modo examen por módulo**: 15 preguntas mezcladas de las lecciones, con tiempo opcional; desbloquea "módulo dominado".
4. **PWA instalable** (manifest + service worker) para abrir Grano como app de escritorio sin pestaña del navegador.
5. **Generación de lecciones "En preparación" bajo demanda** con el tutor en modo borrador, marcada claramente como "Borrador generado por IA, no revisado", y con botón para pasarla a revisión.
6. **Conversación persistente con `agy --conversation`** para hilos largos, si las pruebas muestran que mejora el contexto frente a reenviar historial.
7. **Rutas por objetivo** además de por área: "Preparar la certificación X", "Primer empleo como analista en 3 meses" (selección de lecciones ya existentes + calendario).
8. **Datos propios**: permitir cargar un CSV/Parquet del usuario en el laboratorio (solo local) para practicar con sus datos.

---

## Apéndice A — Esquema de lección v2

```js
// src/data/lessons/<moduleId>/<lessonId>.js
export default {
  id: 'c1-sql-joins-02-grano-fanout',      // kebab-case, prefijo = moduleId
  moduleId: 'c1-sql-joins',
  tracks: ['core'],                         // o ['de','bi'] si es compartida
  level: 1,                                 // 0..4
  order: 2,                                 // dentro del módulo
  title: 'Grano de una tabla y fan-out en JOINs',   // ≤ 60 caracteres
  minutes: 25,                              // 10..35
  prerequisites: ['c1-sql-joins-01-tipos-join'],
  contentVersion: 1,                        // subir al editar (invalida la caché de IA)

  hook: '...',            // 40–90 palabras. Un problema concreto con Mercado Brisa. Termina en pregunta.
  objectives: ['...'],    // 2–4. Verbo observable + objeto: "Calcular…", "Detectar…", "Elegir entre…"

  sections: [             // 2–6
    {
      id: 'que-es-el-grano',
      heading: '...',     // ≤ 70 caracteres, afirmación o pregunta concreta
      body: '...',        // 80–250 palabras. Markdown limitado: párrafos, listas, `código`, **negrita** (≤ 2), enlaces, tablas ≤ 5 columnas
      interactive: { component: 'join-fanout-visualizer', caption: '...' },  // opcional
      example: { language: 'sql', code: '...', expectedOutput: [/* filas reales */] } // opcional
    }
  ],

  workedExample: {        // opcional pero recomendado
    title: '...',
    steps: [{ explanation: '...', code: '...', expectedOutput: [] }]  // 2–5 pasos
  },

  checks: [               // 3–6
    {
      id: 'c1',
      type: 'mcq' | 'predict-output' | 'order' | 'fill-code',
      prompt: '...',      // ≤ 60 palabras
      options: [{ id: 'a', text: '...', correct: true, feedback: '...' }],  // mcq/predict: 3–4 opciones, feedback en TODAS
      // order: items[], correctOrder[]; fill-code: template, blanks[{id, accepted[]}]
      explanation: '...'  // 20–60 palabras, se muestra tras responder
    }
  ],

  practice: {             // 1 obligatoria
    type: 'sql' | 'fill-blanks' | 'order-steps' | 'open',
    prompt: '...',
    starterCode: '...',
    expected: 'SELECT ...',   // sql: consulta de referencia
    orderMatters: false,
    hints: ['...', '...'],    // 1–3, de menos a más explícita
    solution: '...',
    solutionExplanation: '...'
  },

  roleNotes: {            // opcional; solo las áreas donde cambia algo real
    de: '...', da: '...', bi: '...'   // 25–70 palabras cada una
  },

  summary: ['...'],       // 3–5 frases de ≤ 25 palabras
  flashcards: [{ id, front: '...', back: '...' }],  // 3–6
  glossaryTerms: ['grano', 'fan-out'],
  sources: [{ title, url, publisher, accessed: '2026-10-29', supports: 'qué afirmación respalda' }],  // ≥ 3
  aiNotes: '...'          // ≤ 80 palabras: malentendidos típicos, para el tutor. No se muestra al alumno.
};
```

**Rangos totales por lección:** 600–1 600 palabras de texto visible (sin código). Nivel 0: 500–1 000.

---

## Apéndice B — Reglas de copy anti-slop

### B.1 Reglas

1. **Una idea por frase.** Media < 22 palabras.
2. **Verbo primero en botones**, máximo 3 palabras: "Continuar", "Ejecutar consulta", "Ver solución". Nunca "¡Vamos!" ni "Comenzar tu viaje".
3. **Sentence case** en todos los títulos: "Funciones de ventana", no "Funciones De Ventana".
4. **Negrita solo** para el término que se está definiendo en ese momento.
5. **Números concretos** en lugar de adjetivos: "lee 3 de 40 archivos" en lugar de "lectura muchísimo más eficiente".
6. **Nada de autopromoción** de la plataforma dentro de las lecciones.
7. **Ejemplos inventados se dicen inventados**: "En Mercado Brisa (empresa ficticia)…".
8. **Estados vacíos** en una línea que diga qué hacer: "Aún no tienes tarjetas. Aparecen al terminar tu primera lección."
9. **Errores**: qué pasó + qué hacer. "No se pudo conectar con agy. Abre Antigravity, inicia sesión y pulsa Reintentar."
10. **Sin metáforas de viaje, superpoderes ni épica.**

### B.2 Términos prohibidos (el script `check-copy.mjs` los detecta)

`clave` (como adjetivo: "concepto clave", "aspecto clave") · `crucial` · `fundamental` (como adjetivo enfático) · `potente` · `poderoso` · `robusto` · `innegociable` · `de nivel producción` · `de clase mundial` · `de vanguardia` · `revolucionario` · `revoluciona` · `transformador` · `desbloquea` / `desbloquear` (salvo funcionalidad técnica real) · `sin fricción` · `sin esfuerzo` · `ecosistema` (salvo uso técnico preciso) · `holístico` · `sinergia` · `empoderar` · `potenciar` · `dominar` / `domina` (en promesas: "domina SQL") · `viaje` / `travesía` · `aventura` · `superpoder` · `mágico` · `sumérgete` · `descubre` (en títulos) · `en este mundo` · `hoy en día` · `en la era de` · `cabe destacar` · `es importante destacar` · `en resumen,` (como muletilla de inicio) · `Tríada` · `Atelier` · `Frontera 2026` · `Cero slop` / `Cero relleno` · `Caso real` (cuando no lo es) · `¡` en interfaz.

### B.3 Ejemplos

**Antes (slop):**
> Antes de escribir una sola línea de SQL o arrastrar una métrica en una herramienta de BI, debes formular y responder una pregunta innegociable: "¿Qué representa exactamente una fila física en esta tabla?". Eso es la granularidad (o grain) y equivale a su clave primaria real.

**Después:**
> Antes de unir dos tablas, responde una pregunta: ¿qué representa una fila? Esa respuesta es el **grano** de la tabla. En `orders`, una fila es un pedido. En `order_items`, una fila es un producto dentro de un pedido. Si no sabes el grano, no sabes qué estás sumando.

**Antes (interfaz):** "Buenos días · Comienza tu recorrido por las 6 etapas técnicas"
**Después:** "Ingeniería de Datos · Nivel 1 · 12 de 96 lecciones" + tarjeta "Continuar".

---

## Apéndice C — Puente IA v2 (agy / Google AI Ultra)

### C.1 Por qué `agy`

La suscripción Google AI Ultra del usuario está disponible a través de **Antigravity**. Su CLI, `agy`, está instalado y autenticado en esta máquina. `gemini` CLI ya no acepta esta cuenta (ver §0.1). No hay que gestionar claves de API: `agy` usa la sesión de Antigravity.

### C.2 Invocación

```js
// server/ai/agyRunner.js (esquema)
spawn(AGY_PATH, ['--model', model, '--sandbox'], {
  cwd: SANDBOX_DIR,          // fs.mkdtempSync(path.join(os.tmpdir(), 'grano-ai-')) creado al arrancar
  shell: false,
  windowsHide: true,
  stdio: ['pipe', 'pipe', 'pipe'],
});
child.stdin.end(prompt, 'utf8');   // prompt completo por stdin (sin límite de longitud de línea de comandos)
```

- `AGY_PATH`: de `GRANO_AGY_PATH` o detectado con `where.exe agy.exe` / `which agy`.
- `model`: debe estar en la lista de `agy models` (cacheada 10 min). Por defecto: rápido `gemini-3.8-flash-low`, profundo `gemini-4-argon-medium`. Configurables en `.env.local` y en Ajustes.
- **Nunca**: `--dangerously-skip-permissions`, `--mode plan` (devuelve un plan en vez de responder), `--add-dir` con la carpeta del proyecto, `shell: true`.
- Timeout: 120 s total; 45 s sin primer byte → error `AGY_TIMEOUT`.
- Flags útiles de la versión instalada (verificar con `agy --help` antes de usarlos): `--disable-slash-commands` (que el texto del usuario no active comandos `/`; **úsalo siempre**), `--output-format stream-json` (streaming estructurado; evalúalo frente a leer `stdout` en texto), `--json-schema <archivo>` (fuerza salida JSON para `/api/ai/json`: `feynman`, `quiz-more`, `interview-grade`; sigue validando con zod en el servidor), `--effort low|medium|high`.
- `stderr` se registra en el log del servidor (recortado), nunca se envía al navegador.
- Al arrancar el servidor y cada 10 min: `agy models` para estado y lista.

### C.3 Endpoints

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| GET | `/api/ai/status` | — | `{ available, engine: 'agy', version, defaultModels: { fast, deep }, code?, message?, fix? }` |
| GET | `/api/ai/models` | — | `{ models: [{ id, label }] }` |
| POST | `/api/ai/chat` | `{ mode, lessonId?, sectionId?, messages: [{role, content}], selection?, code?, result?, simulatorState?, model? }` | **SSE**: `queued`, `meta`, `delta`, `done`, `error` |
| POST | `/api/ai/json` | `{ mode: 'feynman'\|'quiz-more'\|'interview-grade', ... }` | `{ ok, data }` validado con zod en el servidor; 1 reintento si el JSON no valida |

Modos de `/chat`: `tutor`, `explain-section`, `explain-error`, `review-sql`, `interview`.

Límites: cada mensaje del usuario ≤ 2 000 caracteres; historial ≤ 12 mensajes; `code` ≤ 4 000; `result` ≤ 50 filas resumidas; prompt total ≤ 24 000 caracteres.

### C.4 Plantilla de prompt del tutor (`server/ai/prompts/tutor.md`)

```
Eres el tutor de Grano, una escuela de datos en español. La persona está en el nivel {level} del área {trackName}.

Lección: {lessonTitle}
Sección actual: {sectionHeading}
Objetivos de la lección: {objectives}
Texto de la sección (referencia, no lo repitas entero): {sectionBody}
Malentendidos típicos: {aiNotes}
{selection ? 'Texto que la persona seleccionó: ' + selection}
{code ? 'Su consulta: ' + code}
{result ? 'Resultado o error que obtuvo: ' + result}

Cómo responder:
- Español neutro, tuteo, frases cortas. Ve directo a la respuesta.
- Ajusta la profundidad al nivel {level} (0 = no asumas nada técnico).
- Si hay un ejemplo, usa las tablas de Mercado Brisa (empresa ficticia): {schemaSummary}.
- Si la pregunta es sobre otra cosa, respóndela brevemente y conecta con la lección solo si es natural.
- Si no estás seguro de un dato dependiente de versión, dilo.
- No uses encabezados para respuestas de menos de 120 palabras. Máximo 300 palabras salvo que pidan más.
- No uses emojis ni frases de relleno.
- No ejecutes herramientas ni crees archivos: solo responde en texto.

Conversación:
{history}
Persona: {question}
```

### C.5 Contexto construido en el servidor

El servidor importa `src/data/lessons/index.js`, busca `lessonId` y `sectionId`, y arma el contexto. Así el navegador no envía el texto de la lección (menos datos, menos superficie de inyección) y la caché puede usar `contentVersion`.

### C.6 Errores honestos

| `code` | Cuándo | `message` (para mostrar) | `fix` |
|---|---|---|---|
| `AGY_NOT_FOUND` | No hay ejecutable | "No encuentro Antigravity (agy) en este equipo." | "Instala Antigravity o define GRANO_AGY_PATH." |
| `AGY_AUTH` | stderr menciona login/sesión | "Antigravity no tiene una sesión iniciada." | "Abre Antigravity, inicia sesión y pulsa Reintentar." |
| `AGY_TIMEOUT` | sin primer byte en 45 s | "La IA tardó demasiado en responder." | "Reintenta o cambia al modelo Rápido." |
| `AGY_QUOTA` | stderr menciona cuota/límite | "Se alcanzó el límite de uso de tu suscripción." | "Prueba más tarde o usa otro modelo." |
| `AGY_FAILED` | otro | "La IA no pudo responder." | "Reintenta. Si se repite, ejecuta `npm run ai:check`." |

**Prohibido** devolver texto pre-escrito como si fuera respuesta del modelo. `GRANO_AI_MOCK=1` existe solo para tests y cada respuesta empieza por `[MOCK]`.

---

## Apéndice D — Plantillas

### D.1 Brief que el orquestador da a cada subagente

```
Eres el subagente <ID> del proyecto Grano. Trabajas SOLO en el worktree ../ING-<ID>, rama agente/<ID>.

Lee completo, en este orden: §1 Reglas comunes, §2 Contrato anti-pereza, tu ficha <§ y título>, y los apéndices que cita.
Tu ficha define: archivos que posees, qué leer al inicio, pasos, resultado esperado, test y final.

Reglas de entrega:
- No toques archivos fuera de "Archivos que posees". Si necesitas algo de otro archivo, escríbelo en "Peticiones al orquestador".
- Haz commits pequeños con mensajes en español: "<ID>: <qué cambió>".
- No declares la tarea terminada hasta cumplir TODO el §2. Entrega docs/reportes/<ID>.md con la plantilla D.2.
- Si te bloqueas más de 3 intentos en un mismo problema, documenta qué probaste y pide ayuda al orquestador en vez de rebajar el alcance.
```

### D.2 Plantilla de reporte (`docs/reportes/<ID>.md`)

```markdown
# <ID> · <título>

## Inicio
- Archivos leídos (uno por línea, con un dato concreto aprendido de cada uno):
- Estado encontrado (capturas "antes"):

## Pasos
### Paso 1 — <nombre de la ficha>
- Qué hice:
- Archivos y líneas:
- Evidencia (comando + salida / captura):
(repetir por cada paso de la ficha, sin saltarse ninguno)

## Test
(cada punto del bloque Test de la ficha, con su salida o captura)

## Revisión propia (mínimo 5 defectos encontrados y corregidos)
1.

## Prueba adversarial
| Qué probé | Qué pasó | Acción |

## Capturas antes / después

## Peticiones al orquestador

## Pendiente (con motivo)
```

### D.3 Revisión del orquestador (checklist por reporte)

- [ ] Inicio con archivos leídos y datos concretos.
- [ ] Todos los pasos de la ficha presentes, en orden, con evidencia.
- [ ] Bloque Test completo con salidas reales.
- [ ] ≥ 5 autodefectos.
- [ ] Prueba adversarial con ≥ 5 casos.
- [ ] Capturas en las resoluciones pedidas.
- [ ] `git diff --stat main...agente/<ID>` solo toca archivos que el agente posee.
- [ ] `npm run build` pasa en la rama.
- Si falla cualquiera: devolver al subagente con la lista exacta de lo que falta. No fusionar.

---

## Apéndice E — Matriz de pruebas y comandos

### E.1 Matriz de capturas (`scripts/shots.mjs`)

- Vistas: Onboarding (3 pantallas), Hoy, Ruta, Lección (arriba, sección con simulador, checks, práctica), Tutor abierto, Práctica, Repaso, Glosario, Progreso, Proyectos, Ajustes, `?ui=1`.
- Resoluciones: 1280×720, 1366×768, 1440×900, 1920×1080, 390×844.
- Temas: claro, oscuro. Densidad: automática; además compacta forzada en 1920×1080.
- Estados: usuario nuevo y usuario con progreso (fixture en `tests/fixtures/progress.json` cargado en `localStorage` antes de navegar).
- Script: `node scripts/shots.mjs --out docs/reportes/capturas/<carpeta> [--views lesson,tutor] [--sizes 1280x720]`. Usa `playwright-core` con `chromium.launch({ channel: 'msedge' })` (o `'chrome'`).

### E.2 Flujos e2e mínimos (Q1)

1. Usuario nuevo → onboarding → elige BI → desde cero → ve la ruta con el tronco común primero.
2. Abre la primera lección → hace scroll → responde un check mal → ve feedback → responde bien.
3. Práctica SQL: escribe la consulta incorrecta → ve diferencias → la corrige → aprobada.
4. Tutor (mock): pregunta → ve `[MOCK]` en streaming → cancela una segunda pregunta a mitad.
5. Tutor no disponible (mock de estado) → botón deshabilitado con explicación.
6. Repaso: 3 tarjetas con teclas 1–4.
7. Ajustes: cambia densidad a compacta y escala a 90 % → la barra superior mide 44 px.
8. Exportar progreso → reiniciar → importar → progreso restaurado.
9. `Ctrl+K` → busca "fan-out" → abre la lección.
10. A 390×844: navegación inferior funciona en las 5 pestañas.

### E.3 Comandos de verificación (deben existir al final)

```bash
npm run check          # contenido, copy, catálogo, contraste
npm test               # vitest: servidor, estado, motor de repaso, validadores
npm run test:e2e       # playwright con IA simulada
npm run ai:check       # diagnóstico de agy real
npm run build          # compila
npm start              # app compilada + API IA en 127.0.0.1
```
