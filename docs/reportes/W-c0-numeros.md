# Reporte de agente — W-c0-numeros: Writer de Números con sentido (Nivel 0 · Core)

- **Fecha de inicio / fin:** 2026-10-29T13:26:00-06:00 / 2026-10-29T14:10:00-06:00
- **Duración total:** 44 min
- **Rama y worktree:** `agente/W-c0-numeros` (`C:\Users\T490s\Desktop\Proyectos\ING-W-c0-numeros`)
- **Puerto de verificación utilizado:** `5203`
- **Archivos tocados:**
  - `src/data/lessons/c0-numeros/c0-numeros-01-media-mediana-moda.js` (nuevo)
  - `src/data/lessons/c0-numeros/c0-numeros-02-dispersion-iqr-percentiles.js` (nuevo)
  - `src/data/lessons/c0-numeros/c0-numeros-03-asimetria-sesgo.js` (nuevo)
  - `src/data/lessons/c0-numeros/c0-numeros-04-proporciones-tasas-bps.js` (nuevo)
  - `src/data/lessons/c0-numeros/c0-numeros-05-correlacion-causalidad.js` (nuevo)
  - `docs/curriculo/investigacion/c0-numeros.md` (nuevo)
  - `docs/curriculo/investigacion/c0-numeros-glossary.json` (nuevo)
  - `docs/reportes/W-c0-numeros.md` (nuevo)
- **Dependencias nuevas:** ninguna

---

## Inicio

Se completaron las lecturas obligatorias antes de redactar código o prosa:

1. **`PLAN_GEMINI_4_ARGON.md` (§1, §2, §5 `c0-numeros`, §9.2, §9.4, Apéndices A, B, D.2, D.3):**
   - Se verificaron las reglas de arquitectura de currículum por niveles (Nivel 0: 500–1000 palabras visibles por lección, tono accesible para personas sin experiencia previa, media de frase `<= 22` palabras en `sections[].body`), la lista de expresiones prohibidas del Apéndice A y la rúbrica editorial de 6 criterios de §9.4.
2. **`src/data/catalog/modules.js` (entrada `c0-numeros`):**
   - Módulo `c0-numeros` ("Números con sentido"), `track: 'core'`, `level: 0`, `estimatedMinutes: 90` (`15 + 20 + 20 + 15 + 20`), `prerequisites: ['c0-datos']`, 5 lecciones (`c0-numeros-01` a `c0-numeros-05`) y `projectSpec` (`proj-c0-numeros`, "Radiografía numérica de Mercado Brisa").
3. **`public/datasets/README.md` y `public/datasets/schema.json`:**
   - Se revisaron las 13 tablas Parquet de Mercado Brisa (semilla `19870315`) y sus anomalías intencionales relevantes para estadística descriptiva: `SKU-TEST-NEG` (`list_price_usd = -9.99` en `products`, categoría `Accesorios`), cola derecha pronunciada en `orders.total_usd` y `refunds.refund_amount_usd`, tasas de rechazo diferenciadas por método en `payments` y confusión por `channel` en `marketing_spend` y por el umbral `subtotal_usd > 80` en `orders.discount_usd`.
4. **`src/data/schema/lesson.js` y `src/data/schema/glossary.js`:**
   - Se verificaron las restricciones de `LessonV2Schema` (`title <= 60` caracteres, `hook` 40–90 palabras terminado en `?`, `objectives` 2–4 frases con verbo en infinitivo, 3 secciones con `body` 80–250 palabras, `workedExample` de >= 2 pasos con `code` + `expectedOutput` + `explanation`, `roleNotes` `de`/`da`/`bi` de 15–80 palabras, 3 `checks` de distinto `kind` con `explanation` 20–60 palabras, `practice` SQL ejecutable, `summary` 3–5 frases `<= 25` palabras, `sources` >= 2 primarias, `aiNotes <= 80` palabras) y `GlossaryTermSchema` (`definition` 20–60 palabras, `sqlExample`, `roleNotes`).
5. **`scripts/check-content.mjs`, `scripts/check-copy.mjs`, `package.json`, `vite.config.js`, `src/main.jsx`, `src/App.jsx`, `src/styles/tokens.css`, `docs/curriculo/fuentes.md` y `docs/curriculo/perfil-core.md`:**
   - Se inspeccionó cómo el validador mide palabras visibles (`[500, 1000]` en Nivel 0) y cómo el auditor anti-slop evalúa términos prohibidos y longitud media de frase (`<= 22` palabras/frase).

---

## Pasos

### Paso 1 — Investigación de fuentes verificables

- **Qué se hizo:** Se seleccionaron y documentaron 15 fuentes verificadas (3 por lección, al menos 2 primarias por lección) en `docs/curriculo/investigacion/c0-numeros.md` con `accessed: '2026-10-29'`, incluyendo la documentación oficial de agregados generales y estadísticos de DuckDB (`AVG`, `MEDIAN`, `MODE`, `QUANTILE_CONT`, `STDDEV_SAMP`, `SKEWNESS`, `CORR`), el *NIST/SEMATECH e-Handbook of Statistical Methods*, *OpenIntro Statistics* (4.ª ed., Diez, Çetinkaya-Rundel y Barr), *Statistical Inference* (Casella y Berger) y *Causal Inference: What If* (Hernán y Robins).
- **Verificación:** Todas las URLs son reales, de acceso público sin muro de pago y pasan `check-content.mjs` con `>= 2` fuentes `primary: true` por lección.

### Paso 2 — Mapa de conceptos y dependencias

- **Qué se hizo:** En `docs/curriculo/investigacion/c0-numeros.md` (§2) se trazó el grafo de dependencias entre las 5 lecciones:
  - `c0-numeros-01` depende de `c0-datos-02-tipos-y-nulos` (tratamiento de `NULL` frente a `0` en `AVG`).
  - `c0-numeros-02` construye sobre la mediana (`p50`) de `c0-numeros-01` para introducir `p25`, `p75`, `p90`, el IQR y las cercas de Tukey.
  - `c0-numeros-03` conecta media, mediana, desviación estándar y cuantiles para diagnosticar la asimetría (`SKEWNESS`) y distinguirla del sesgo estadístico de muestreo.
  - `c0-numeros-04` introduce razones, proporciones, tasas, puntos porcentuales (`pp`), puntos base (`bps`) y el error de promediar porcentajes con `AVG(a / b)`.
  - `c0-numeros-05` cierra el módulo con `CORR(y, x)`, variables de confusión, causalidad inversa y estratificación con `GROUP BY`, enlazando hacia `c1-sql-basico` y `c2-dimensional-04-metrics-simpson`.

### Paso 3 — Redacción de las 5 lecciones de Nivel 0

- **Qué se hizo:** Se escribieron las 5 lecciones en `src/data/lessons/c0-numeros/` cumpliendo el esquema `LessonV2Schema` y las restricciones de Nivel 0 (`[500, 1000]` palabras visibles y `<= 22` palabras/frase):
  1. `c0-numeros-01-media-mediana-moda.js` (962 palabras visibles, 16.0 palabras/frase): compara `AVG`, `MEDIAN` y `MODE` sobre `orders` (`AVG = 426.10` USD vs `MEDIAN = 350.16` USD, con `58.2 %` de pedidos por debajo de la media) y demuestra el efecto de `NULL` frente a `0` con `COALESCE`.
  2. `c0-numeros-02-dispersion-iqr-percentiles.js` (919 palabras visibles, 14.3 palabras/frase): introduce `QUANTILE_CONT` (`p25`, `p50`, `p75`, `p90`), el `IQR` (`454.65` USD en `orders`) frente al rango y la desviación estándar (`319.67` USD), y aisla la anomalía `SKU-TEST-NEG` (`-9.99` USD en `products`) con cercas de Tukey.
  3. `c0-numeros-03-asimetria-sesgo.js` (937 palabras visibles, 14.9 palabras/frase): explica la cola derecha en importes y entregas (`SKEWNESS = 1.63` en `refunds` y `0.98` en `orders`), muestra por qué `AVG - 2 * STDDEV_SAMP` arroja un límite inferior imposible (`-209.00` USD en `refunds`) y distingue asimetría geométrica de sesgo estadístico.
  4. `c0-numeros-04-proporciones-tasas-bps.js` (950 palabras visibles, 16.1 palabras/frase): contrasta variación relativa (`+50.1 %`) frente a puntos porcentuales (`+3.87 pp`) y puntos base (`+387 bps`) en los rechazos de `payments`, y demuestra por qué `SUM(a) / SUM(b)` evita distorsionar agregados ponderados.
  5. `c0-numeros-05-correlacion-causalidad.js` (949 palabras visibles, 15.0 palabras/frase): analiza `CORR(spend_usd, attributed_conversions)` en `marketing_spend` (correlación global `0.912` inflada por el confusor `channel` frente a `0.506`–`0.585` al estratificar con `GROUP BY channel`) e integra el componente interactivo `simpsons-paradox-explorer`.

### Paso 4 — Ejemplos y prácticas sobre Mercado Brisa en DuckDB

- **Qué se hizo:** Mediante un script sobre `@duckdb/node-api` se ejecutaron las 15 consultas SQL de las 5 lecciones (`sections[0].example`, `workedExample.steps[0..1]` y `practice.solution`) directamente contra los 13 ficheros `public/datasets/*.parquet`. Todas las matrices `expectedOutput` y `expectedOutputTable` se poblaron con las filas exactas devueltas por DuckDB.

### Paso 5 — Términos nuevos propuestos para el glosario

- **Qué se hizo:** Se creó `docs/curriculo/investigacion/c0-numeros-glossary.json` con 10 términos nuevos (`media-aritmetica`, `mediana`, `rango-intercuartilico`, `percentil`, `asimetria-distribucion`, `sesgo-estadistico`, `punto-porcentual`, `punto-base`, `correlacion-pearson`, `variable-confusion`), todos validados contra `GlossaryTermSchema` (definiciones de 38 a 41 palabras, `sqlExample` sobre Mercado Brisa y `roleNotes` para `de`, `da` y `bi`).

### Paso 6 — Proyecto de módulo y rúbrica de 4 niveles

- **Qué se hizo:** En `docs/curriculo/investigacion/c0-numeros.md` (§6) se desarrolló el enunciado completo del proyecto `proj-c0-numeros` ("Radiografía numérica de Mercado Brisa"), su consulta SQL base verificada por región (`Centro`, `Norte`, `Occidente`, `Sur`), los 4 entregables y la rúbrica de evaluación de 4 criterios (`centro`, `dispersion`, `tasas-bps`, `no-causalidad`) en escala 0–4.

### Paso 7 — Validación cruzada, rúbrica §9.4, navegador y tutor IA

1. **Autoevaluación según la rúbrica de 6 criterios (§9.4):**

| Lección | 1. Claridad (0–3) | 2. Anclaje en Mercado Brisa (0–3) | 3. Fuentes verificables (0–3) | 4. Práctica ejecutable (0–3) | 5. Cobertura de roles (0–3) | 6. Tono y anti-slop (0–3) | Cumple umbral (>= 15/18 y ningún < 2) |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `c0-numeros-01-media-mediana-moda` | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | **18/18 (Sí)** |
| `c0-numeros-02-dispersion-iqr-percentiles` | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | **18/18 (Sí)** |
| `c0-numeros-03-asimetria-sesgo` | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | **18/18 (Sí)** |
| `c0-numeros-04-proporciones-tasas-bps` | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | **18/18 (Sí)** |
| `c0-numeros-05-correlacion-causalidad` | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | **18/18 (Sí)** |

   - **Justificación por criterio:**
     - *1. Claridad:* cada lección abre con un `hook` de escenario real en Mercado Brisa terminado en `?`, define cada término técnico antes de su primer uso y mantiene una media de 14.3 a 16.1 palabras/frase.
     - *2. Anclaje en Mercado Brisa:* todas las cifras provienen de consultas reales sobre `orders`, `products`, `refunds`, `payments` y `marketing_spend`, incluyendo anomalías documentadas como `SKU-TEST-NEG` (`-9.99` USD).
     - *3. Fuentes verificables:* 3 fuentes por lección (`>= 2` primarias) con URLs reales de DuckDB Docs, NIST, OpenIntro, Casella & Berger y Hernán & Robins.
     - *4. Práctica ejecutable:* las 5 prácticas son de tipo `sql` y pasan el calificador en vivo de DuckDB-WASM (`Práctica superada · El resultado coincide con la referencia`).
     - *5. Cobertura de roles:* `roleNotes` diferenciados y concretos para Ingeniería de Datos (`de`), Análisis de Datos (`da`) y Business Intelligence (`bi`) en cada lección.
     - *6. Tono y anti-slop:* 0 hallazgos en `check-copy.mjs`, 0 emojis, 0 anglicismos innecesarios y 0 promesas vacías.

2. **Prueba del tutor IA (`buildContextPrompt` y detección de errores con `aiNotes`):**
   - Se verificó en las 5 lecciones (`test_ai_tutor_c0_numeros.mjs`) el flujo de pedir una pregunta de comprobación (`"Hazme una pregunta para comprobar si lo entendí"`) y responder deliberadamente con el error conceptual típico de cada lección:
     - `c0-numeros-01`: afirmar que el `50 %` de los pedidos supera la media de `426.10` USD -> el contexto inyecta la sección `tres-formas-de-resumir-el-centro` y las `aiNotes` que contrastan la mediana (`350.16` USD) y el `58.2 %` de pedidos por debajo de la media.
     - `c0-numeros-02`: afirmar que el rango de `76.27` USD en `Accesorios` refleja la variación habitual de sus productos -> el contexto inyecta `por-que-el-centro-no-basta` y las `aiNotes` sobre el impacto de `SKU-TEST-NEG` (`-9.99` USD) en el rango frente al `IQR` (`26.27` USD).
     - `c0-numeros-03`: usar `media ± 2 desviaciones estándar` (`-209.00` a `651.89` USD) en `refunds` -> el contexto inyecta `forma-de-la-distribucion-y-cola-derecha` y las `aiNotes` sobre la asimetría positiva (`1.63`) y la cota inferior en cero.
     - `c0-numeros-04`: llamar "caída de `3.87` puntos base" a una bajada de `11.60 %` a `7.73 %` -> el contexto inyecta `razon-proporcion-y-tasa` y las `aiNotes` que distinguen `-3.87 pp` (`-387 bps`) de `-33.4 %` relativo.
     - `c0-numeros-05`: asumir que duplicar el gasto en `email` duplicará las conversiones porque `CORR` global es `0.912` -> el contexto inyecta `que-mide-la-correlacion-lineal` y las `aiNotes` sobre el confusor `channel` (`0.506`–`0.585` intragrupo).

---

## Test

### 1. Validador de esquema e integridad (`node scripts/check-content.mjs --module c0-numeros`)

```text
=== Validación de contenido v2 (check-content) ===
Lección (id v2)                                | Módulo               | Niv  | Sec  | Chk  | Src  | Palabras  | Estado    
--------------------------------------------------------------------------------------------------------------------------
c0-numeros-01-media-mediana-moda               | c0-numeros           | 0    | 3    | 3    | 3    | 962       | OK        
c0-numeros-02-dispersion-iqr-percentiles       | c0-numeros           | 0    | 3    | 3    | 3    | 919       | OK        
c0-numeros-03-asimetria-sesgo                  | c0-numeros           | 0    | 3    | 3    | 3    | 937       | OK        
c0-numeros-04-proporciones-tasas-bps           | c0-numeros           | 0    | 3    | 3    | 3    | 950       | OK        
c0-numeros-05-correlacion-causalidad           | c0-numeros           | 0    | 3    | 3    | 3    | 949       | OK        
--------------------------------------------------------------------------------------------------------------------------
Resumen: 5 lecciones inspeccionadas | 5 válidas | 0 con advertencias (needsReview) | 0 con errores.

Resultado: OK (0 errores de esquema o integridad).
```

### 2. Auditor anti-slop (`node scripts/check-copy.mjs --path src/data/lessons/c0-numeros`)

```text
=== Auditoría anti-slop de copy (check-copy) ===
Archivos escaneados: 5

0 hallazgos de términos prohibidos, emojis, "2026" o exceso de negritas.
Total de hallazgos: 0

=== Sentence stats per lesson ===
- c0-numeros-01-media-mediana-moda: 16.0 words/sentence (367 words in 23 sentences)
- c0-numeros-02-dispersion-iqr-percentiles: 14.3 words/sentence (372 words in 26 sentences)
- c0-numeros-03-asimetria-sesgo: 14.9 words/sentence (343 words in 23 sentences)
- c0-numeros-04-proporciones-tasas-bps: 16.1 words/sentence (370 words in 23 sentences)
- c0-numeros-05-correlacion-causalidad: 15.0 words/sentence (330 words in 22 sentences)
```

### 3. Validación de `c0-numeros-glossary.json` contra `GlossaryTermSchema`

```text
=== Validating 10 glossary terms ===
- media-aritmetica: valid=true (40 words)
- mediana: valid=true (39 words)
- rango-intercuartilico: valid=true (40 words)
- percentil: valid=true (39 words)
- asimetria-distribucion: valid=true (40 words)
- sesgo-estadistico: valid=true (39 words)
- punto-porcentual: valid=true (41 words)
- punto-base: valid=true (39 words)
- correlacion-pearson: valid=true (38 words)
- variable-confusion: valid=true (40 words)
```

### 4. Suite Playwright E2E sobre puerto `5203` (`run_e2e_verification.mjs`)

```text
=== Verifying c0-numeros-01-media-mediana-moda (Light 1280x720) ===
  -> Title: Media, mediana y moda: cuándo el promedio miente | Lab: Comparar media, mediana y marca más frecuente en el catálogo de productos | Passed: true | Rows: 5 filas
=== Verifying c0-numeros-02-dispersion-iqr-percentiles (Light 1280x720) ===
  -> Title: Dispersión, rango intercuartílico y percentiles (p50, p90) | Lab: Dispersión y percentil 90 del importe por tipo de dispositivo | Passed: true | Rows: 3 filas
=== Verifying c0-numeros-03-asimetria-sesgo (Light 1280x720) ===
  -> Title: Distribuciones asimétricas y sesgo en importes y entregas | Lab: Diagnosticar el sesgo derecha (media vs mediana y SKEWNESS) en las primeras 5 tiendas | Passed: true | Rows: 5 filas
=== Verifying c0-numeros-04-proporciones-tasas-bps (Light 1280x720) ===
  -> Title: Proporciones, tasas, puntos porcentuales y puntos base | Lab: Proporción de pedidos reembolsados en porcentaje y puntos base por dispositivo | Passed: true | Rows: 3 filas
=== Verifying c0-numeros-05-correlacion-causalidad (Light 1280x720) ===
  -> Title: Por qué correlación no implica causalidad y confusores | Lab: Estratificar la correlación entre gasto y conversiones por canal en marketing_spend | Passed: true | Rows: 5 filas
consoleErrors: [] | pageErrors: []
```

---

## Revisión propia

Durante la redacción y verificación se detectaron y corrigieron **5 defectos propios**:

1. **Encabezado de sección mayor a 70 caracteres en `c0-numeros-04-proporciones-tasas-bps.js`:**
   - *Hallazgo:* En la primera corrida de `check-content.mjs`, `sections[1].heading` tenía 76 caracteres (`Variación relativa frente a puntos porcentuales (pp) y puntos base (bps)`), superando el tope de 70 caracteres de `SectionSchema`.
   - *Corrección:* Se acortó a `'Variación relativa frente a puntos porcentuales y puntos base'` (61 caracteres).
2. **Recuento de palabras visibles ligeramente por encima de 1000 en las 5 lecciones:**
   - *Hallazgo:* En la primera corrida de `check-content.mjs`, las 5 lecciones tenían entre `1010` y `1070` palabras visibles, activando la advertencia `needsReview` para el rango de Nivel 0 (`[500, 1000]`).
   - *Corrección:* Se podaron redundancias en `sections[].body` en las 5 lecciones hasta dejarlas en `962`, `919`, `937`, `950` y `949` palabras visibles (`0` advertencias).
3. **Longitud media de frase superior a 22 palabras/frase en las lecciones 2 a 5:**
   - *Hallazgo:* `check-copy.mjs` reportó medias iniciales de `23.4`, `26.1`, `22.7` y `25.9` palabras/frase en `sections[].body` de las lecciones 02, 03, 04 y 05.
   - *Corrección:* Se dividieron las oraciones subordinadas largas en frases directas, reduciendo la media a `14.3`–`16.1` palabras/frase en todas las lecciones.
4. **Clave de `localStorage` y condición de carrera de guardado en el arnés Playwright:**
   - *Hallazgo:* El primer intento de abrir una lección inyectando `localStorage['grano_v1']` falló porque la clave real del esquema (`STORAGE_KEY` en `src/state/schema.js`) es `'grano:v1'` y además el guardado con debounce de 300 ms sobrescribía el estado tras `page.goto`.
   - *Corrección:* Se actualizó el script E2E para abrir cada lección seleccionando su tarjeta `[data-testid="exercise-item-<lessonId>"]` en el catálogo y alternando a la vista de práctica con `.app-sidebar__nav button:has-text("Práctica")`.
5. **Selector de sección del simulador interactivo en `c0-numeros-05`:**
   - *Hallazgo:* `normalizeLessonV2` genera el `id` de cada sección a partir del slug del `heading` (`como-bloquear-un-confusor-estratificando-con-group-by`) cuando no se fuerza otro `domId`, por lo que el selector `#sec-sec-2` no coincidía en el DOM.
   - *Corrección:* Se utilizó el contenedor semántico `.lp-simulator-frame` para desplazarse al simulador `simpsons-paradox-explorer` y capturar tanto el tema claro como el oscuro.

---

## Prueba adversarial

Se ejecutaron **6 pruebas adversariales** sobre el servidor en `http://127.0.0.1:5203`:

1. **Viewport `1280×720` en las 5 lecciones (`theme=light`):**
   - *Resultado:* `document.documentElement.scrollWidth === 1280` (`innerWidth === 1280`), cero desbordamiento horizontal, columna de lectura de `832 px` (`> 640 px` mínimo) con temario lateral visible.
2. **Tema oscuro (`theme=dark`) a `1280×720` en `c0-numeros-01` y `c0-numeros-05`:**
   - *Resultado:* Contraste verificado en bloques de código, tablas de resultados, tarjetas del simulador `simpsons-paradox-explorer` y callouts sin textos invisibles ni bordes rotos (`c0-numeros-01-dark.png`, `c0-numeros-05-dark-simpsons.png`).
3. **Navegación por teclado (`1`–`4`) en las comprobaciones de comprensión (`LessonCheckCard`):**
   - *Resultado:* Al enfocar la primera comprobación de `c0-numeros-01` y pulsar la tecla `2`, se seleccionó la opción `B` (incorrecta), mostrando de inmediato el estado de error y la explicación pedagógica con el botón `"No lo entiendo — explicar en el tutor"` (`adversarial-keyboard-checks.png`).
4. **Consulta SQL con error de sintaxis en el laboratorio DuckDB-WASM:**
   - *Resultado:* Al ejecutar `SELECT columna_inexistente FROM orders WHERE;`, DuckDB-WASM capturó la excepción sin colapsar la pestaña (`0` errores no controlados), renderizó `[data-testid="sql-error-box"]` con `Parser Error: syntax error at or near ";"` y habilitó el botón `"Explícame este error"` (`adversarial-sql-error.png`).
5. ** Preferencia del sistema `prefers-reduced-motion: reduce`:**
   - *Resultado:* Emulada con `page.emulateMedia({ reducedMotion: 'reduce' })` en `c0-numeros-02`; `window.matchMedia('(prefers-reduced-motion: reduce)').matches` devolvió `true` y la navegación entre secciones del temario utilizó salto instantáneo (`behavior: 'auto'`).
6. **Respuestas deliberadamente erróneas al tutor IA en las 5 lecciones:**
   - *Resultado:* `buildContextPrompt` inyectó en las 5 lecciones las `aiNotes` específicas y el cuerpo de la sección activa (prompts de `3284` a `3371` caracteres), permitiendo detectar la confusión entre media y mediana, rango e IQR, asimetría y sesgo, puntos porcentuales y puntos base, y correlación y causalidad.

---

## Capturas antes / después

Todas las capturas se generaron con navegador real (Microsoft Edge headless vía `playwright-core`) en `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-c0-numeros\` (no añadidas a git) y fueron inspeccionadas visualmente con `read_file`:

| Archivo en `docs/reportes/capturas/W-c0-numeros/` | Qué verifica | Dimensiones / Estado |
| --- | --- | --- |
| `c0-numeros-01-media-mediana-moda-light-top.png` | Cabecera, ruta `Números con sentido`, `Nivel 0`, escenario real y objetivos de L01 en modo claro | `1280×720` · OK |
| `c0-numeros-01-media-mediana-moda-practice-solved.png` | Práctica SQL de L01 ejecutada en DuckDB-WASM (`Práctica superada`, 5 filas de `products`) | `1280×720` · OK |
| `c0-numeros-02-dispersion-iqr-percentiles-light-top.png` | Cabecera, prerrequisito enlazado a L01, escenario real y objetivos de L02 en modo claro | `1280×720` · OK |
| `c0-numeros-02-dispersion-iqr-percentiles-practice-solved.png` | Práctica SQL de L02 ejecutada en DuckDB-WASM (`Práctica superada`, 3 filas por `device_type`) | `1280×720` · OK |
| `c0-numeros-03-asimetria-sesgo-light-top.png` | Cabecera, escenario real (`refunds` `-209.00` USD) y objetivos de L03 en modo claro | `1280×720` · OK |
| `c0-numeros-03-asimetria-sesgo-practice-solved.png` | Práctica SQL de L03 ejecutada en DuckDB-WASM (`Práctica superada`, 5 tiendas con `SKEWNESS`) | `1280×720` · OK |
| `c0-numeros-04-proporciones-tasas-bps-light-top.png` | Cabecera, escenario real (`7.73 %` vs `11.60 %` en `payments`) y objetivos de L04 | `1280×720` · OK |
| `c0-numeros-04-proporciones-tasas-bps-practice-solved.png` | Práctica SQL de L04 ejecutada en DuckDB-WASM (`Práctica superada`, `%` y `bps` de reembolsos) | `1280×720` · OK |
| `c0-numeros-05-correlacion-causalidad-light-top.png` | Cabecera, escenario real (`CORR = 0.912` en `marketing_spend`) y objetivos de L05 | `1280×720` · OK |
| `c0-numeros-05-correlacion-causalidad-simpsons-explorer.png` | Componente interactivo `simpsons-paradox-explorer` integrado en la sección 3 de L05 (modo claro) | `1280×720` · OK |
| `c0-numeros-05-correlacion-causalidad-practice-solved.png` | Práctica SQL de L05 ejecutada en DuckDB-WASM (`Práctica superada`, 5 canales estratificados) | `1280×720` · OK |
| `c0-numeros-01-dark.png` | Verificación de contraste y tokens en modo oscuro (`theme=dark`) sobre L01 | `1280×720` · OK |
| `c0-numeros-05-dark-simpsons.png` | Verificación de contraste en modo oscuro del simulador `simpsons-paradox-explorer` en L05 | `1280×720` · OK |
| `adversarial-keyboard-checks.png` | Selección de respuesta con atajo de teclado `2` y retroalimentación de error en comprobaciones | `1280×720` · OK |
| `adversarial-sql-error.png` | Manejo defensivo de error de sintaxis SQL en DuckDB-WASM con botón de ayuda del tutor IA | `1280×720` · OK |

---

## Peticiones al orquestador

1. **Integración de glosario en el paso de consolidación de Ola A:** Incorporar las 10 entradas de `docs/curriculo/investigacion/c0-numeros-glossary.json` (`media-aritmetica`, `mediana`, `rango-intercuartilico`, `percentil`, `asimetria-distribucion`, `sesgo-estadistico`, `punto-porcentual`, `punto-base`, `correlacion-pearson`, `variable-confusion`) en `src/data/glossary.js`.
2. **Sincronización de índice global tras merge de Ola A:** Ejecutar `node scripts/sync-lessons-index.mjs` al integrar la rama `agente/W-c0-numeros` en `main` para registrar las 5 lecciones de `c0-numeros` en `src/data/lessons/index.js`.

---

## Pendiente

Ninguno.
