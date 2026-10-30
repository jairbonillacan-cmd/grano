# Reporte de Cierre Maestro — `FINAL` (Grano `v2.0.0-grano`)

- **Tarea:** `FINAL` · Cierre del plan maestro `PLAN_GEMINI_4_ARGON.md` (Fase 0 → Fase 4)
- **Responsable:** Orquestador (`Gemini 4 Argon`)
- **Fecha:** 2026-10-30
- **Rama:** `main` (con etiqueta `v2.0.0-grano`)
- **Estado:** Aprobado (Checklist D.3 cumplida al 100 % en los 52 reportes del proyecto)

---

## Inicio

### Archivos leídos
1. `PLAN_GEMINI_4_ARGON.md` (lectura completa de `§1` a `§11` y Apéndices `A`–`F`).
2. `docs/reportes/F0.md`, `docs/reportes/ESTADO.md` y los 50 reportes de subagentes (`T1.md`–`T13.md`, 32 `W-*.md`, `F1.md`, `E1.md`, `Q1.md`, `Q2.md`, `Q3.md`).
3. `src/data/catalog/modules.js`, `src/data/catalog/tracks.js`, `src/data/lessons/index.js`, `src/data/glossary/terms.js`, `src/data/flashcards/cards.js`.
4. `package.json`, `vite.config.js`, `server/ai/routes.js`, `server/ai/agyRunner.js`.
5. `scripts/check-catalog.mjs`, `scripts/check-content.mjs`, `scripts/check-copy.mjs`, `scripts/check-contrast.mjs`, `scripts/check-sql.mjs`, `scripts/shots.mjs`, `scripts/audit-a11y-perf.mjs`.
6. `tests/unit/curriculum-integrity.test.js`, `tests/e2e/run-e2e.mjs`, `tests/e2e/run-e2e-ai.mjs`.

---

## Pasos

### Paso 1 — Verificación de reportes y fusiones `--no-ff` en `main` (`§7`, `§8`, `§9`, `§10`)
- **Qué se hizo:** Se auditaron con la lista de comprobación del Apéndice D.3 los **52 reportes** del proyecto (`F0.md`, `T1.md`…`T13.md`, los 32 reportes `W-<módulo>.md` de las Olas A, B y C, `F1.md`, `E1.md`, `Q1.md`, `Q2.md`, `Q3.md` y `FINAL.md`) y se verificó que cada tarea de Fase 1, Fase 2, Fase 3 y Fase 4 cuenta con su propio commit de fusión `--no-ff` en `main` (49 commits de fusión de subagentes más los cierres del Orquestador).
- **Evidencia:**
  - Fase 0: `F0` (`304975f`).
  - Fase 1 (`T1`–`T6`): `T1` (`f51954b`), `T2` (`ad4683d`), `T3` (`1760902`), `T4` (`612deca`), `T5` (`cc28fbd`), `T6` (`0ea2947`).
  - Fase 2 (`T7`–`T13`): `T11` (`0fa2b7b`), `T9` (`49a46ad`), `T8` (`dd110e5`), `T13` (`cc4fb1f`), `T12` (`cf0821a`), `T10` (`d2ff04e`), `T7` (`f4c2d60`).
  - Fase 3 — Ola A (10 módulos, 49 lecciones): `W-c0-herramientas` (`8781fb7`), `W-c0-datos` (`eb01798`), `W-c0-hojas` (`5e0d643`), `W-c0-numeros` (`ca83f79`), `W-c0-negocio` (`be8724e`), `W-c1-sql-base` (`b7873e7`), `W-c1-sql-joins` (`2417e0b`), `W-c1-viz` (`8382734`), `W-c1-modelo` (`6c33c20`), `W-c1-python` (`3e688f9`).
  - Fase 3 — Ola B (9 módulos, 45 lecciones): `W-bi2-modelo-semantico` (`d10675e`), `W-bi2-dax` (`247b1fd`), `W-c2-sql-analitico` (`1278a6b`), `W-da2-eda` (`dc3f2fb`), `W-bi2-metricas` (`5b13e0b`), `W-da2-inferencia` (`063b149`), `W-de2-pipelines` (`8f853b5`), `W-c2-dimensional` (`dafa63b`), `W-de2-formatos` (`2c9aea5`).
  - Fase 3 — Ola C (13 módulos, 60 lecciones): `W-de3-transformacion` (`409427a`), `W-de3-lakehouse` (`387039f`), `W-x4-ia-datos` (`4049708`), `W-bi3-gobierno` (`ceb96d5`), `W-bi3-dashboards` (`70baa70`), `W-de4-plataforma` (`f1afc95`), `W-da4-modelos` (`261488b`), `W-de4-streaming` (`722028c`), `W-bi4-operacion` (`449a329`), `W-x4-carrera` (`1d404ed`), `W-da3-experimentos` (`18160f5`), `W-da3-producto` (`b6344a0`), `W-da4-causalidad` (`d30fa2c`).
  - Fase 3 — Cierre de contenido: `F1` (`34296bd`), `E1` (`fb268a3`).
  - Fase 4 — Calidad y cierre: `Q1` (`bdea13a`), `Q2` (`49e97b8`), `Q3` (`7c7c1ee`).

### Paso 2 — Ejecución de toda la batería de validadores, pruebas y empaquetado de producción
- **Qué se hizo:** Se ejecutaron en `main` los comandos obligatorios de cierre: `npm run check` (`check:catalog`, `check:content`, `check:copy`, `check:contrast`, `check:sql`), `npm test` (73 tests unitarios de Vitest), `npm run test:e2e` (10 flujos E2E de Playwright del Apéndice E.2 + suite con IA real), `npm run ai:check` (prueba real del CLI `agy`) y `npm run build` (empaquetado de producción con partición de chunks).
- **Evidencia:**
  - `npm run check:catalog`: `32 módulos | 154 lecciones (154 existentes, 0 planificadas) | 0 errores | 0 avisos`.
  - `npm run check:content`: `154 archivos escaneados | 154 válidas | 0 con errores | 0 avisos`.
  - `npm run check:copy`: `229 archivos escaneados | 0 hallazgos | media global: 17.5 palabras/frase (objetivo <= 22)`.
  - `npm run check:contrast`: `42/42 pares cumplen WCAG 2.x (21 claro + 21 oscuro)`.
  - `npm run check:sql`: `509 bloques SQL ejecutados en DuckDB | 0 errores | 0 diferencias`.
  - `npm test`: `7 test files passed | 73 tests passed | 0 failed`.
  - `npm run test:e2e`: `10/10 flujos E2E en verde + flujo E2E con IA real agy en verde`.
  - `npm run ai:check`: `CLI agy v1.4.11 disponible y respondiendo en vivo`.
  - `npm run build`: `index-*.js` inicial reducido a **`132.52 kB gzip`** (`< 250 kB gzip`), con `sql-engine` (`duckdb-wasm`), `sql-datasets` y `curriculum-lessons` divididos bajo demanda.

### Paso 3 — Recorrido manual extremo a extremo con `agy` real (`§10`)
- **Qué se hizo:** Se ejecutó sobre el servidor en vivo (`http://127.0.0.1:5173/`) el recorrido completo de un estudiante real desde cero con el motor `agy` (`v1.4.11`, modelo rápido `gemini-3.8-flash-low`, cero mocks):
  1. **Bienvenida / Onboarding:** Selección del área **Análisis de Datos (`da`)** y **Nivel 0 (`Desde cero`)** → clic en `Empezar` (`3 904 ms`).
  2. **Apertura de lección de Nivel 0:** Navegación a `Tipos de dato: entero, decimal, texto, fecha y booleano` (`c0-02-tipos-de-dato`, `1 834 ms`).
  3. **Pregunta fallada:** Respuesta errónea deliberada en la Comprobación 1 (`"9", "25", "100"` al ordenar `VARCHAR`) → visualización del bloque `.is-bad` y del botón contextual `"No lo entiendo — explicar en el tutor"` (`930 ms`).
  4. **Clic en `"No lo entiendo"`:** Apertura automática del panel del Tutor IA con el contexto de la lección, la pregunta fallada y la opción elegida pre-cargados.
  5. **Respuesta real del Tutor IA (`agy`):** Streaming SSE en vivo desde `agy --mode agent --model gemini-3.8-flash-low --print` con **primer token en `4.3 s`** y **respuesta completa en `6.1 s`** (`6 519 ms` extremo a extremo en interfaz, `1 015` caracteres explicando por qué `'100' < '25' < '9'` en orden lexicográfico carácter a carácter frente a `INTEGER`).
  6. **Práctica SQL en vivo:** Ejecución de la consulta SQL en el laboratorio DuckDB-Wasm sobre la tabla `products` de *Mercado Brisa* → estado `"Práctica superada · El resultado coincide con la referencia"` (`1 150 ms`).
  7. **Repaso FSRS:** Apertura de la vista `Repaso`, volteo de tarjeta de Nivel 0 con barra espaciadora y calificación con tecla `3` (`Bien · 9d`, `991 ms`).
- **Evidencia:** Capturas guardadas e inspeccionadas en `docs/reportes/capturas/FINAL-recorrido/01-bienvenida-onboarding.png` a `07-repaso-fsrs.png` y telemetría en `docs/reportes/capturas/FINAL-recorrido/timings.json` (`17 827 ms` de tiempo total).

### Paso 4 — Etiquetado de versión `v2.0.0-grano`
- **Qué se hizo:** Se consolidaron los artefactos finales en `main` y se creó el tag anotado `v2.0.0-grano`.
- **Evidencia:** `git tag -l "v2.0.0-grano"` devuelve `v2.0.0-grano`.

---

## Test

```text
$ npm run check
> grano@1.0.0 check
> npm run check:catalog && npm run check:content && npm run check:copy && npm run check:contrast && npm run check:sql

[check:catalog] OK — 32 módulos | 154 lecciones (154 existentes, 0 planificadas) | 0 errores | 0 avisos
[check:content] OK — 154 archivos escaneados | 154 válidas | 0 con errores | 0 avisos
[check:copy] OK — 229 archivos escaneados | 0 hallazgos | media global: 17.5 palabras/frase (objetivo <= 22)
OK — 42/42 pares cumplen WCAG 2.x (21 claro + 21 oscuro).
Resumen: 154 lecciones | 509 bloques SQL | 0 errores | 0 diferencias
OK — todas las consultas SQL ejecutaron sin errores y coinciden con expectedResult.

$ npm test
Test Files  7 passed (7)
     Tests  73 passed (73)

$ npm run test:e2e
====================================================
RESUMEN E2E: 10 PASARON, 0 FALLARON (de 10 flujos)
====================================================
Flujo E2E con IA real (agy) COMPLETADO CON ÉXITO.

$ npm run ai:check
[ai:check] ÉXITO: El puente IA con agy funciona correctamente.

$ npm run build
✓ built in 7.8s (index-*.js: 132.52 kB gzip)
```

---

## Revisión propia

1. **Restauración de `granoAiPlugin()` tras la partición de chunks de `Q2`:** Al introducir `build.rollupOptions.output.manualChunks` en `vite.config.js` durante `Q2`, se había omitido la llamada a `granoAiPlugin()` en el arreglo `plugins` de Vite. Se restauró `plugins: [react(), granoAiPlugin()]` en `vite.config.js`, garantizando que `/api/ai/status` y `/api/ai/chat` funcionen tanto en desarrollo como en pruebas E2E.
2. **Eliminación del 100 % de estilos inline estáticos (`style={{}}`) en `src/`:** Tras integrar todas las vistas y simuladores, quedaban estilos inline estáticos en componentes de vistas y simuladores. Se migraron todos a clases semánticas en `src/styles/utilities.css` y hojas de componentes, dejando **0 estilos inline estáticos** en `src/` (los 12 usos restantes corresponden exclusivamente a variables CSS dinámicas `--value`, `--seg-*`, `--tab-*`, `--sk-*`, `--cell-bg` y `--sel-*`).
3. **Normalización de variantes de comprobación (`fill-blank` con `template` y `order-steps` con `origIdx`):** Algunas lecciones de las Olas B y C utilizaban `check.template` + `check.blanks` o arreglos de cadenas en `check.correctOrder`. Se amplió `src/views/lesson/LessonCheckCard.jsx` para soportar de forma transparente todos los formatos del catálogo, verificándolo con los flujos E2E.
4. **Fechas de consulta (`accessed`) en `W-da4-modelos`:** Cinco lecciones de `da4-modelos` tenían fecha `2025-10-15` en una fuente bibliográfica; se actualizaron a `2026-04-20` tras verificar las fuentes vigentes, dejando `npm run check:content` con `0 errores y 0 avisos`.
5. **Contraste WCAG AA auditado por `axe-core` en 24 estados (`Q2` + `Q3`):** Además de los 42 pares estáticos de `scripts/check-contrast.mjs`, se corrigieron bordes, insignias semánticas y botones de peligro/éxito en modo claro y oscuro para que la auditoría real en navegador con `axe-core` arroje **0 violaciones (`critical: 0, serious: 0, moderate: 0, minor: 0`)** en las 12 vistas × 2 temas.

---

## Prueba adversarial

| Caso adversarial probado | Entrada / Acción | Resultado observado | Estado |
|---|---|---|---|
| **1. Solicitud simultánea al Tutor IA + cancelación con `AbortController`** | Enviar pregunta en el Tutor IA y pulsar `"Detener generación"` antes de que termine el stream SSE. | El cliente aborta el `fetch`, el servidor recibe el evento `close` y ejecuta `killProcessTree(child.pid)` (`taskkill /PID /T /F` en Windows) sin dejar procesos `agy` huérfanos ni bloquear la cola (`concurrency: 1`). | **PASA** |
| **2. Consulta SQL maliciosa o infinita en el Laboratorio DuckDB-Wasm** | Ejecutar `SELECT * FROM tabla_inexistente` y una consulta con error de sintaxis `SELEC FROM orders`. | DuckDB-Wasm captura la excepción en el Web Worker, muestra el mensaje de error traducido en español con sugerencia contextual y mantiene la interfaz responsiva sin colgar el hilo principal. | **PASA** |
| **3. Importación de JSON de progreso corrupto o de versión v1 en Ajustes** | Subir un archivo JSON truncado (`{ "version": 1, "completed`) y un respaldo legítimo `v1` sin campos FSRS ni `selectedTrack`. | El JSON corrupto es rechazado limpiamente mostrando alerta de validación sin sobrescribir `localStorage`; el respaldo `v1` se migra automáticamente a `v2` preservando las lecciones completadas y creando tarjetas FSRS iniciales. | **PASA** |
| **4. Viewport móvil estrecho (`390×844`) con texto a escala `115 %` (`lg`) y densidad `compact`** | Abrir `Hoy`, `Ruta`, `Lección` (con Tutor IA en hoja inferior) y `Laboratorio SQL` a `390×844`. | `document.documentElement.scrollWidth <= window.innerWidth` (`390 <= 390`, `overflowX = 0 px`), barra de navegación inferior accesible con áreas táctiles `≥ 44×44 px` y cero solapamientos. | **PASA** |
| **5. Validador de estilo (`check:copy`) frente a muletillas de IA, anglicismos crudos y fechas `"2026"`** | Escaneo completo de los 229 archivos de `src/` con `npm run check:copy`. | `0 hallazgos` en los 229 archivos y media global de `17.5` palabras por frase (`<= 22`). | **PASA** |

---

## Métricas de éxito (`§10`)

| Métrica | Antes (`F0`) | Objetivo (`§10`) | Valor final medido (`v2.0.0-grano`) | Estado |
|---|---|---|---|---|
| **Tutor responde con IA real** | No (texto fijo) | Sí, primer token < 10 s con Flash | **Sí** (`agy` v1.4.11 real; 1.º token en **`4.3 s`** en recorrido manual y **`5.35 s`** en `ai:check` con `gemini-3.8-flash-low`) | **CUMPLE** |
| **Lecciones** | 18 | Ola A+B: ≥ 70; final: ~150 | **154 lecciones existentes** (Ola A+B: **94**; Total: **154** en 32 módulos, `0` planificadas) | **CUMPLE** |
| **Nivel 0 (desde cero)** | 0 lecciones | ≥ 20 lecciones | **23 lecciones** distribuidas en 5 módulos de Nivel 0 (`c0-herramientas`, `c0-datos`, `c0-hojas`, `c0-numeros`, `c0-negocio`) | **CUMPLE** |
| **Áreas seleccionables** | 0 | 3 + tronco común | **3 especialidades** (`de`, `da`, `bi`) + **tronco común compartido** (`core`) | **CUMPLE** |
| **Prácticas con SQL real** | 0 | ≥ 60 % de las lecciones con SQL | **93.5 %** (144 de 154 lecciones con práctica SQL ejecutable en DuckDB-Wasm; 509 bloques SQL verificados con `check:sql`) | **CUMPLE** |
| **Apariciones de `"2026"` en UI/contenido** | 251 | 0 (salvo fechas de consulta de fuentes) | **0** (`npm run check:copy` → `0 hallazgos` en 229 archivos) | **CUMPLE** |
| **Términos prohibidos (`check:copy`)** | 184 (línea base `T4`) | 0 | **0 hallazgos** (media global: `17.5` palabras/frase `<= 22`) | **CUMPLE** |
| **Colores de acento** | 12+ | 1 de marca + 3 de área | **1 de marca** (`--brand` terracota `#B84A27` / `#E07350`) + **3 de área** (`--track-de`, `--track-da`, `--track-bi`) | **CUMPLE** |
| **`@keyframes`** | 14 | ≤ 6 | **6** (`view-fade`, `check-draw`, `row-stagger`, `shimmer`, `flow-dash`, `cursor-blink` en `src/styles/animations.css`) | **CUMPLE** |
| **`style={{}}` inline** | 36 | 0 (salvo variables CSS) | **0 estáticos** (los 12 usos en `src/` asignan únicamente variables CSS dinámicas `--*`) | **CUMPLE** |
| **Ancho mínimo del texto de lección con tutor abierto** | ~300 px | ≥ 640 px o tutor superpuesto | **≥ 640 px (`40rem`–`68ch`)** en `≥ 1600px` con tutor acoplado; **superpuesto (overlay)** en `900–1599px` y hoja inferior en `< 900px` | **CUMPLE** |
| **Fuentes externas en runtime** | Google Fonts | 0 | **0** (`IBM Plex Sans`, `IBM Plex Mono` y `Newsreader` autoalojadas localmente vía `@fontsource`) | **CUMPLE** |

---

## Recorrido manual con `agy` real (`§10`)

Ejecutado contra `http://127.0.0.1:5173/` con `agy` `v1.4.11` (`gemini-3.8-flash-low`):

| Paso del recorrido | Archivo de captura | Tiempo medido | Detalle verificado |
|---|---|---:|---|
| 1. Bienvenida y selección de área/nivel | `docs/reportes/capturas/FINAL-recorrido/01-bienvenida-onboarding.png` | `3 904 ms` | Modal de bienvenida → elige **Análisis de Datos (DA)** y **Nivel 0 (Desde cero)** → pulsa `Empezar`. |
| 2. Lección de Nivel 0 | `docs/reportes/capturas/FINAL-recorrido/02-leccion-nivel-0.png` | `1 834 ms` | Abre `c0-02-tipos-de-dato` (*Tipos de dato: entero, decimal, texto, fecha y booleano*). |
| 3. Pregunta fallada | `docs/reportes/capturas/FINAL-recorrido/03-pregunta-fallada.png` | `930 ms` | Elige opción incorrecta en Comprobación 1 → feedback `.is-bad` + botón `"No lo entiendo — explicar en el tutor"`. |
| 4. Envío de `"No lo entiendo"` al Tutor IA | `docs/reportes/capturas/FINAL-recorrido/04-no-lo-entiendo-enviado.png` | `< 100 ms` | El panel del Tutor IA se abre con el contexto de la pregunta fallada y lanza la petición SSE a `/api/ai/chat`. |
| 5. Respuesta real del Tutor IA (`agy`) | `docs/reportes/capturas/FINAL-recorrido/05-respuesta-real-tutor-agy.png` | **1.º token: `4.3 s`** / **Total IA: `6.1 s`** (`6 519 ms` UI) | Respuesta en vivo de `agy` (`1 015` caracteres) explicando con analogía de diccionario por qué `'100'` va antes que `'25'` y `'9'` en `VARCHAR` y cómo usar `INTEGER`/`CAST`. |
| 6. Práctica SQL en DuckDB-Wasm | `docs/reportes/capturas/FINAL-recorrido/06-practica-sql-resuelta.png` | `1 150 ms` | Ejecución real en DuckDB-Wasm sobre `products` de *Mercado Brisa* → `"Práctica superada · El resultado coincide con la referencia"`. |
| 7. Repaso espaciado FSRS | `docs/reportes/capturas/FINAL-recorrido/07-repaso-fsrs.png` | `991 ms` | Tarjeta de Nivel 0 volteada con `Espacio` y calificada con tecla `3` (`Bien · 9d`). |

---

## Capturas antes / después

- **Antes (`F0`):** 67 capturas de línea base en `docs/reportes/capturas/F0-antes/` (estética neón/cian, 18 lecciones, sin Nivel 0, sin DuckDB-Wasm, tutor estático sin IA real).
- **Después (`Q3` y `FINAL`):**
  - **197 capturas** de la matriz completa del Apéndice E.1 (12 vistas × 2 temas × 3 anchos + estados interactivos, escalas tipográficas, densidades y recorridos por área DE/DA/BI) en `docs/reportes/capturas/Q3-despues/`.
  - **7 capturas** del recorrido manual extremo a extremo con `agy` real en `docs/reportes/capturas/FINAL-recorrido/`.

---

## Problemas conocidos y siguientes pasos (`§11`)

1. **Dependencia del entorno local para el Tutor IA (`agy` CLI):** El puente IA (`server/ai/routes.js`) ejecuta el binario local `agy` autenticado en la máquina del estudiante. Si el usuario despliega Grano en un hosting estático sin backend Node local, la interfaz detecta automáticamente `available: false` en `/api/ai/status` y muestra las instrucciones de diagnóstico sin romper ninguna funcionalidad curricular ni el motor SQL (`DuckDB-Wasm` corre 100 % en el navegador).
2. **Tamaño del worker WebAssembly de DuckDB (`duckdb-eh.wasm` ~32 MB sin comprimir):** Aunque está completamente aislado del bundle de arranque (`index-*.js` pesa solo `132.52 kB gzip`) y se carga de forma diferida (`lazy`) únicamente al abrir el Laboratorio SQL o el bloque de práctica de una lección, en conexiones móviles lentas la primera inicialización del motor SQL puede tardar 1–2 segundos mientras se instancia el Web Worker.
3. **Siguientes pasos sugeridos para futuras versiones (`v2.1+`):**
   - Añadir un entorno Python en el navegador (`Pyodide`) opcional para las lecciones de `c1-python`, `da2-eda` y `da4-modelos`, complementando el laboratorio DuckDB-Wasm.
   - Permitir exportar el portafolio de los 6 proyectos guiados como un sitio estático o documento Markdown/PDF listo para enlazar en GitHub/LinkedIn.
   - Incorporar sincronización opcional cifrada de extremo a extremo además de la exportación/importación JSON local actual.
