# W-c1-viz — Módulo `c1-viz`: Visualización honesta

- **Agente:** `W-c1-viz` (Fase 3 · Ola A · Escritor de módulo Nivel 1, Tronco común)
- **Rama:** `agente/W-c1-viz`
- **Worktree:** `C:\Users\T490s\Desktop\Proyectos\ING-W-c1-viz`
- **Puerto asignado:** `5210`
- **Estado:** `completado`

---

## Inicio

Archivos leídos al iniciar la tarea y dato concreto extraído de cada uno:

1. `PLAN_GEMINI_4_ARGON.md` (§0, §1, §2, §4, §5 `c1-viz`, §9.2, §9.4, Apéndices A, B, C, D.2 y D.3): el módulo `c1-viz` (*Visualización honesta*) es de Nivel 1 (Fundamentos), Tronco común (`core`), consta de 4 lecciones de 20 min (`80 min` totales), prerrequisito `c0-pensar`, y sus archivos deben exportarse bajo `src/data/lessons/c1-viz/<id>.js` cumpliendo el esquema v2 (Apéndice A).
2. `src/data/catalog/modules.js`: `c1-viz` define las 4 entradas `c1-viz-01` .. `c1-viz-04` con `[20, 20, 20, 20]` minutos y el proyecto `proj-c1-viz` (*Rediseño de dos gráficos con problemas reales*).
3. `public/datasets/README.md`: el dataset sintético determinista de **Mercado Brisa** (semilla `19870315`) contiene 13 tablas Parquet (`stores` con 14 tiendas en 4 regiones y 3 formatos; `products` con 320 productos en 5 categorías; `orders` con 18 000 pedidos entre 2023 y 2025; `order_items` con 45 648 líneas; `marketing_spend` con 5 480 filas en 5 canales).
4. `public/datasets/schema.json`: `orders.total_usd` y `order_items.line_total_usd` son `DOUBLE`, `orders.status` admite `'completed'`, `'returned'`, `'cancelled'` y `'processing'`, y `stores` incluye `store_type` (`'retail'`, `'flagship'`, `'warehouse'`) y `area_sqm`.
5. `src/data/schema/lesson.js`: `LessonSchema` valida con Zod que una lección de Nivel 1 tenga entre `900` y `1600` palabras totales (`countLessonWords`), `3–5` secciones (`sections`), `3–5` comprobaciones (`checks`), `3–6` `flashcards`, `>= 2` fuentes con URL `https://` y `accessed` ISO, y `aiNotes` de al menos 20 caracteres.
6. `src/data/schema/glossary.js`: `GlossaryTermSchema` exige `id` en kebab-case, `term`, `definition` de `20–60` palabras (y `<= 25` palabras según §9.2 del plan), `moduleId`, `lessonId` y `relatedTerms`.
7. `scripts/check-content.mjs`: ejecuta la validación estructural de `LessonSchema`, verifica que `practice` de tipo `sql` tenga `expected` o `expectedOutput`, y emite advertencia `needsReview` si el conteo de palabras cae fuera de `900–1600` en Nivel 1.
8. `scripts/check-copy.mjs`: audita palabras prohibidas ES/EN, emojis, menciones a `"2026"` fuera de URLs/`accessed`/títulos de fuentes, exceso de negritas (`> 3` `**...**` por párrafo) y longitud media de frase (`<= 22` palabras/frase en `sections[].body`).
9. `scripts/sync-lessons-index.mjs`: escanea `src/data/lessons/<moduleId>/<lessonId>.js` y regenera `src/data/lessons/index.js` con `LESSONS_V2`, `LESSONS_BY_ID` y `adaptLessonForLegacyPlayer`.
10. `package.json`: incluye `@duckdb/node-api` (`^1.4.1-r.2`), `@duckdb/duckdb-wasm`, `playwright-core` y scripts `build`, `check:content`, `check:copy` y `sync:lessons`.
11. `vite.config.js`: configura Vite con cabeceras COOP/COEP (`same-origin` / `credentialless`) para WebAssembly y monta el middleware `/api/ai`.
12. `src/main.jsx`: punto de entrada React que importa las hojas de estilo globales (`tokens.css`, `editorial.css`, `components.css`) y monta `<App />`.
13. `src/App.jsx`: conecta `useAppController` con `<AppShell>`, `<LessonPlayer>`, `<TutorPanel>` y `<CommandPaletteModal>`.
14. `src/styles/tokens.css`: define la paleta editorial cálida en claro (`#FAF8F5`, `#181614`, acento terracota `#B84A24`) y oscuro (`#121210`, `#ECE9E2`, acento `#E06D44`), tipografías `Fraunces`, `Inter` y `JetBrains Mono`, y clase `.tabular` (`font-variant-numeric: tabular-nums`).
15. `src/views/LessonPlayer.jsx`: renderiza las 10 áreas de la lección v2 y requiere que `lesson.practice.blanks` tenga al menos 1 elemento (`rawBlanks.length > 0` en línea 587) para montar `<AuthenticCodeLab>` en lugar de la tarjeta estática de respaldo.
16. `src/components/AuthenticCodeLab.jsx`: cuando `resolvedPractice.type === 'sql'`, delega mediante `React.lazy` en `<LazySqlLab>` pasando `lessonId`, `practice`, `starterCode` y `onSolve`.
17. `src/lab/SqlLab.jsx`: ejecuta consultas reales en el navegador sobre DuckDB-Wasm con las tablas Parquet de Mercado Brisa y califica comparando el resultado contra `practice.expected` (`gradeSqlPractice`).
18. `src/components/LessonVisualizers.jsx`: registra los simuladores interactivos disponibles, incluyendo `'tufte-chartjunk-surgeon'` (controles de rejilla, truncamiento de eje Y, barras 3D, doble eje y etiquetas directas) y `'bi-anti-slop-comparator'` (comparador de tablero recargado frente a vista limpia con tabla de alta densidad y `tabular-nums`).
19. `src/utils/formatText.jsx`: procesa negritas `**...**`, código inline `` `...` ``, listas y resaltado de términos de glosario en `sections[].body`.
20. `src/data/glossary.js`: contiene los conceptos actuales del glosario (`c25-tufte-visual-perception`, `c26-bi-as-code`, etc.) y el helper ` normalizeGlossaryList`.
21. `docs/curriculo/fuentes.md`: lista las fuentes maestras del área de BI y visualización (Cleveland & McGill, Edward Tufte, Stephen Few, Claus Wilke, ColorBrewer, W3C WCAG 2.2).
22. `docs/curriculo/perfil-core.md`: establece el tono para Nivel 1 en el Tronco común (explicar cada concepto desde cero sin asumir experiencia previa, con analogías concretas y consultas SQL reproducibles sobre Mercado Brisa).
23. `docs/reportes/PLANTILLA.md`: define la estructura obligatoria del reporte de subagente (`Inicio`, `Pasos`, `Test`, `Revisión propia`, `Prueba adversarial`, `Capturas antes / después`, `Peticiones al orquestador`, `Pendiente`).

---

## Pasos

### Paso 1 — Investigación con fuentes reales
Se documentaron en [`c1-viz.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-viz/docs/curriculo/investigacion/c1-viz.md) 16 fuentes primarias verificadas (4 por lección) con URL `https://`, editorial/autor, fecha de acceso `2026-10-29` y nota `supports`:
- **L1 (`c1-viz-01-geometria-grafico`):** William S. Cleveland & Robert McGill (*Graphical Perception*, JASA, 1984); Claus O. Wilke (*Fundamentals of Data Visualization*, Cap. 5 *Directory of Visualizations* y Cap. 6 *Visualizing Amounts*); FT Visual Vocabulary (Financial Times); Stephen Few (*Save the Pies for Dessert*, Perceptual Edge).
- **L2 (`c1-viz-02-ejes-escalas-cero`):** Carl T. Bergstrom & Jevin D. West (*Calling Bullshit: The Principle of Proportional Ink*, University of Washington); Lisa Charlotte Muth (*Why not to use two axes, and what to use instead*, Datawrapper); Claus O. Wilke (Cap. 3 *Coordinate Systems and Axes*); Edward R. Tufte (*The Visual Display of Quantitative Information*, Data-Ink Ratio & Lie Factor).
- **L3 (`c1-viz-03-color-accesibilidad`):** W3C WCAG 2.2 (*Success Criterion 1.4.1 Use of Color & 1.4.11 Non-text Contrast*); Cynthia A. Brewer (*ColorBrewer 2.0*); Claus O. Wilke (Cap. 4 *Color Scales* y Cap. 19 *Common Pitfalls of Color Use*); Masataka Okabe & Kei Ito (*Color Universal Design — CUD*).
- **L4 (`c1-viz-04-tablas-numericas`):** Stephen Few (*Show Me the Numbers*, 2nd Ed., Table Design Principles); W3C CSS Fonts Module Level 4 (`font-variant-numeric: tabular-nums`); Edward R. Tufte (*Data-Ink Ratio in Tables*); DuckDB SQL Reference (*Numeric Functions: ROUND, NULLIF*).

### Paso 2 — Mapa conceptual del módulo
Se trazó la progresión pedagógica sin solapamientos en [`c1-viz.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-viz/docs/curriculo/investigacion/c1-viz.md):
1. `c1-viz-01-geometria-grafico` (*Elegir la geometría según la pregunta y la variable*): relación entre pregunta analítica y geometría (barras, líneas, dispersión, caja), jerarquía perceptual de Cleveland y McGill, límites del gráfico circular y ordenamiento desde SQL (`ORDER BY métrica DESC` vs. eje temporal `ASC`).
2. `c1-viz-02-ejes-escalas-cero` (*Ejes, escalas, cuándo exigir el cero y ejes dobles*): principio de tinta proporcional (cero obligatorio en barras y áreas), acotación válida en líneas/puntos, escalas lineales vs. logarítmicas y sustitución de ejes dobles engañosos por paneles apilados o índice base 100 (`FIRST_VALUE() OVER (...)`).
3. `c1-viz-03-color-accesibilidad` (*Color con intención: paletas secuenciales y accesibilidad*): familias de paletas de ColorBrewer (cualitativa, secuencial, divergente), límite de 5–7 categorías con color como señal de excepción (`ROW_NUMBER()` + agrupación en contexto gris), daltonismo (paleta Okabe-Ito azul-naranja) y criterios WCAG 2.2 1.4.1 y 1.4.11 con redundancia textual en SQL.
4. `c1-viz-04-tablas-numericas` (*Diseño de tablas numéricas: alineación y cifras tabulares*): cuándo preferir una tabla sobre un gráfico, alineación por tipo de dato, cifras tabulares (`tabular-nums`), control de falsa precisión con `ROUND` y columnas de contexto (`COUNT(DISTINCT store_id)`, `ticket_medio_usd`, `pct_ingreso_total`).

### Paso 3 — Redacción de las 4 lecciones en formato v2
Se crearon los 4 archivos en `src/data/lessons/c1-viz/`:
- [`c1-viz-01-geometria-grafico.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-viz/src/data/lessons/c1-viz/c1-viz-01-geometria-grafico.js) (`1136` palabras, `14.1` palabras/frase media, simulador `tufte-chartjunk-surgeon`).
- [`c1-viz-02-ejes-escalas-cero.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-viz/src/data/lessons/c1-viz/c1-viz-02-ejes-escalas-cero.js) (`1211` palabras, `15.4` palabras/frase media, simulador `tufte-chartjunk-surgeon`).
- [`c1-viz-03-color-accesibilidad.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-viz/src/data/lessons/c1-viz/c1-viz-03-color-accesibilidad.js) (`1222` palabras, `15.8` palabras/frase media).
- [`c1-viz-04-tablas-numericas.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-viz/src/data/lessons/c1-viz/c1-viz-04-tablas-numericas.js) (`1160` palabras, `15.9` palabras/frase media, simulador `bi-anti-slop-comparator`).

### Paso 4 — Verificación de ejemplos y prácticas en DuckDB real
Se ejecutaron todas las consultas SQL (`sections[].example`, los 2 pasos de `workedExample` y la solución de `practice` de las 4 lecciones = 16 consultas SQL) contra `public/datasets/*.parquet` usando `@duckdb/node-api` y posteriormente en el navegador con DuckDB-Wasm:
- **L1 (`c1-viz-01`):** `practice` sobre `order_items + orders + products` devuelve 5 filas exactas encabezadas por `Molinos` (`14314` unidades, `2163162.27` USD, `39.6 %`) hasta `Café en grano` (`14243` unidades, `413378.59` USD, `7.6 %`).
- **L2 (`c1-viz-02`):** `practice` sobre `orders` en el primer semestre de 2024 devuelve 6 filas mensuales con `indice_base_100` (`100.0` en `2024-01-01`, `92.7` en `2024-02-01`, `110.1` en `2024-03-01`, `101.2` en `2024-04-01`, `103.5` en `2024-05-01`, `103.4` en `2024-06-01`).
- **L3 (`c1-viz-03`):** `practice` sobre `marketing_spend` devuelve los 5 canales ordenados por `cpa_usd DESC`: 3 en `'ALERTA [!]: CPA sobre umbral'` (`display_video` `13.94`, `paid_social` `13.93`, `email_campaign` `13.92`) y 2 en `'NORMAL [OK]: CPA en rango'` (`organic_search` `13.87`, `referral` `13.59`).
- **L4 (`c1-viz-04`):** `practice` sobre `stores + orders` en 2024 devuelve los 3 formatos (`retail`: `7` tiendas, `3707` pedidos, `1519007.30` USD, ticket `409.77` USD, `55.6 %`; `flagship`: `4` tiendas, `1658` pedidos, `622292.46` USD, ticket `375.33` USD, `22.8 %`; `warehouse`: `3` tiendas, `1132` pedidos, `590216.74` USD, ticket `521.39` USD, `21.6 %`).

### Paso 5 — Términos de glosario nuevos
Se generó [`c1-viz-glossary.json`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-viz/docs/curriculo/investigacion/c1-viz-glossary.json) con 7 términos nuevos validados contra `GlossaryListSchema` (definiciones de 23–24 palabras, cumpliendo tanto el mínimo de 20 palabras del esquema Zod como el tope de 25 palabras de §9.2):
1. `codificacion-visual` (24 palabras)
2. `jerarquia-perceptual` (24 palabras)
3. `tinta-proporcional` (24 palabras)
4. `indice-base-100` (24 palabras)
5. `paleta-divergente` (24 palabras)
6. `contraste-no-textual` (24 palabras)
7. `cifras-tabulares` (24 palabras)

### Paso 6 — Proyecto de módulo y rúbrica
Se documentó en [`c1-viz.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-viz/docs/curriculo/investigacion/c1-viz.md) la especificación completa y las consultas SQL de referencia del proyecto `proj-c1-viz` (*Rediseño de dos gráficos con problemas reales*), junto con su rúbrica verificable de 4 criterios (Elección de geometría y orden jerárquico, Integridad de escalas y sustitución de doble eje, Intención cromática y accesibilidad WCAG 2.2, Diseño de tabla numérica con precisión uniforme y `tabular-nums`).

### Paso 7 — Verificación en navegador + contexto del tutor IA + rúbrica 0–4
Se verificaron las 4 lecciones en Chromium (`1280×720` y `375×667`) en el puerto `5210` y se probó la construcción de contexto del Tutor IA (`buildContextPrompt` en `server/ai/contextBuilder.js`) simulando para cada lección una pregunta de comprobación y una respuesta errónea deliberada del estudiante:
- En `c1-viz-01`, ante la respuesta errónea de usar un pastel 3D o una línea para 5 categorías nominales, el prompt del tutor (`3573` caracteres) inyecta la jerarquía de Cleveland y McGill y `aiNotes` para corregir por qué una línea inventa pendientes inexistentes entre productos.
- En `c1-viz-02`, ante la respuesta errónea de truncar el eje de barras en `395 USD`, el prompt (`3445` caracteres) inyecta el principio de tinta proporcional y el cálculo de índice base 100.
- En `c1-viz-03`, ante la respuesta errónea de usar solo círculos rojos/verdes y `AVG(spend_usd / attributed_conversions)`, el prompt (`3369` caracteres) inyecta el criterio WCAG 1.4.1 y la fórmula agregada `SUM(spend_usd) / NULLIF(SUM(attributed_conversions), 0)`.
- En `c1-viz-04`, ante la respuesta errónea de centrar importes con 8 decimales y usar `COUNT(s.store_id)` tras el JOIN, el prompt (`3756` caracteres) inyecta la regla de alineación derecha con `tabular-nums` y la distinción entre `COUNT(s.store_id)` y `COUNT(DISTINCT s.store_id)`.

#### Tabla de calificación por rúbrica (Apéndice D.2, escala 0–4)

| Lección | 1. Rigor conceptual | 2. Claridad y voz | 3. Ejemplos y práctica ejecutables | 4. Comprobaciones con criterio | 5. Conexión con los 3 roles | 6. Fuentes reales | 7. Integración UI | Media |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `c1-viz-01-geometria-grafico` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **4.0 / 4** |
| `c1-viz-02-ejes-escalas-cero` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **4.0 / 4** |
| `c1-viz-03-color-accesibilidad` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **4.0 / 4** |
| `c1-viz-04-tablas-numericas` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **4.0 / 4** |

---

## Test

Comandos ejecutados y salidas literales:

### 1. Validación de esquema e integridad (`check-content.mjs`)
```text
$ node scripts/check-content.mjs --module c1-viz

=== Validación de contenido v2 (check-content) ===
Lección (id v2)                                | Módulo               | Niv  | Sec  | Chk  | Src  | Palabras  | Estado    
--------------------------------------------------------------------------------------------------------------------------
c1-viz-01-geometria-grafico                    | c1-viz               | 1    | 4    | 4    | 4    | 1136      | OK        
c1-viz-02-ejes-escalas-cero                    | c1-viz               | 1    | 4    | 4    | 4    | 1211      | OK        
c1-viz-03-color-accesibilidad                  | c1-viz               | 1    | 4    | 4    | 4    | 1222      | OK        
c1-viz-04-tablas-numericas                     | c1-viz               | 1    | 4    | 4    | 4    | 1160      | OK        
--------------------------------------------------------------------------------------------------------------------------
Resumen: 4 lecciones inspeccionadas | 4 válidas | 0 con advertencias (needsReview) | 0 con errores.

Resultado: OK (0 errores de esquema o integridad).
```

### 2. Auditoría anti-slop y longitud de frases (`check-copy.mjs`)
```text
$ node scripts/check-copy.mjs --path src/data/lessons/c1-viz

=== Auditoría anti-slop de copy (check-copy) ===
Archivos escaneados: 4

0 hallazgos de términos prohibidos, emojis, "2026" o exceso de negritas.
Total de hallazgos: 0
(Ninguna lección de c1-viz supera el límite de 22 palabras/frase).
```

### 3. Validación de glosario (`GlossaryListSchema`)
```text
Glossary valid: true terms: 7
```

### 4. Build de producción (`npm run build`)
```text
$ npm run build
> grano@1.0.0 build
> vite build
✓ built in 7.82s
```

### 5. Verificación en navegador y DuckDB-Wasm (`verify-ui-c1-viz.mjs`)
```text
=== Verificando c1-viz-01-geometria-grafico ===
H1: Elegir la geometría según la pregunta y la variable
DuckDB-Wasm ready for c1-viz-01-geometria-grafico
Practice passed! Rows: 5 filas

=== Verificando c1-viz-02-ejes-escalas-cero ===
H1: Ejes, escalas, cuándo exigir el cero y ejes dobles
DuckDB-Wasm ready for c1-viz-02-ejes-escalas-cero
Practice passed! Rows: 6 filas

=== Verificando c1-viz-03-color-accesibilidad ===
H1: Color con intención: paletas secuenciales y accesibilidad
DuckDB-Wasm ready for c1-viz-03-color-accesibilidad
Practice passed! Rows: 5 filas

=== Verificando c1-viz-04-tablas-numericas ===
H1: Diseño de tablas numéricas: alineación y cifras tabulares
DuckDB-Wasm ready for c1-viz-04-tablas-numericas
Practice passed! Rows: 3 filas

=== Adversarial 1: SQL Syntax Error ===
Honest DuckDB error captured: Parser Error: syntax error at or near "WHERE"

=== Adversarial 2: Wrong MCQ Option ===
=== Adversarial 3: Mobile 375x667 + dark + scale=1.25 ===
Mobile 375x667 overflow check: { scrollWidth: 375, innerWidth: 375 }
Page console errors: 0
```

---

## Revisión propia

Durante la redacción y verificación se detectaron y corrigieron **6 defectos reales**:

1. **Corrupción de símbolos Unicode al invocar Node mediante tuberías de PowerShell (`[▲]` convertido en `[???]`):** al probar consultas SQL desde PowerShell con `Get-Content | node`, la codificación por defecto de la tubería alteró los caracteres Unicode. **Corrección:** se reemplazaron los marcadores por etiquetas ASCII universales y legibles en cualquier terminal o lector de pantalla (`[+]`, `[=]`, `[-]`, `[OK]`, `[!]`) y se ejecutaron los scripts directamente con `node <ruta.mjs>`.
2. **Montaje de `AuthenticCodeLab` en `LessonPlayer.jsx`:** al inspeccionar `src/views/LessonPlayer.jsx` (líneas 584–587), se observó que `codeLabChallenge` devuelve `null` si `lesson.practice.blanks` está vacío, mostrando una tarjeta estática en lugar de montar `<AuthenticCodeLab>` (el cual redirige a `<LazySqlLab>` cuando `practice.type === 'sql'`). **Corrección:** se incluyó un descriptor `blanks` de respaldo junto con `type: 'sql'`, `expected` y `expectedOutputTable` en las 4 lecciones, logrando que `<LazySqlLab>` se monte con el editor CodeMirror y DuckDB-Wasm completo.
3. **Exceso de negritas por línea en `check-copy.mjs`:** `check-copy.mjs` evalúa cada línea del archivo `.js` dividiendo por `\n\n`; al usar `\n` simple en listas numeradas de `body`, todas las negritas de una sección se sumaban en un mismo bloque y disparaban hallazgos en `c1-viz-01` (líneas 24 y 33), `c1-viz-03` (línea 101) y `c1-viz-04` (línea 33). **Corrección:** se separaron los bloques con `\n\n` y se dejó un máximo de 1–2 negritas por sección (`0 hallazgos`).
4. **Longitud media de frase superior a 22 palabras en el primer borrador:** `check-copy.mjs` divide las frases únicamente por `[.!?]`, por lo que las enumeraciones unidas por dos puntos `:` o punto y coma `;` contaban como una sola frase de 45–60 palabras (medias iniciales de `30.7`, `30.9` y `27.5` palabras/frase en L2, L3 y L4). **Corrección:** se reescribieron las listas y explicaciones con oraciones breves separadas por punto seguido, bajando la media de las 4 lecciones a `14.1–15.9` palabras/frase (ninguna supera el umbral de 22).
5. **Esquema de estado `GranoStateSchema` al hidratar `localStorage` en pruebas automatizadas:** al poblar `grano:v1` con `track: 'core'` y `scale: 'md'`, `GranoStateSchema` rechazaba el objeto (`TrackSchema` solo admite `'de' | 'da' | 'bi' | null` y `ScaleSchema` admite `0.9 | 1 | 1.1 | 1.25`) y reiniciaba a la primera lección del catálogo. **Corrección:** se ajustó el seed de prueba a `track: null`, `scale: 1` (y `1.25` en la prueba adversarial) con `onboarded: true` y `createdAt` ISO válido.
6. **Rango de palabras de definiciones del glosario (`GlossaryTermSchema` vs. §9.2):** `GlossaryTermSchema` exige `>= 20` palabras por definición, mientras que el apartado §9.2 del plan pide definiciones concisas de `<= 25` palabras. **Corrección:** se redactaron las 7 definiciones de `c1-viz-glossary.json` exactamente entre `23` y `24` palabras cada una, cumpliendo simultáneamente ambas restricciones.

---

## Prueba adversarial

Se ejecutaron **6 pruebas adversariales** sobre las lecciones del módulo:

| # | Escenario adversarial | Resultado observado | Estado |
| :--- | :--- | :--- | :--- |
| 1 | **Viewport móvil `375×667` + tema `dark` + escala `1.25` (`lg`)** en `c1-viz-04-tablas-numericas` | `document.documentElement.scrollWidth === 375` y `window.innerWidth === 375` (0 px de desbordamiento horizontal; el temario lateral colapsa al botón `Temario T`). Captura: `adv-mobile-dark-lg.png`. | Superado |
| 2 | **SQL con error de sintaxis deliberado (`SELECT FROM WHERE;`)** en el laboratorio de `c1-viz-04` | DuckDB-Wasm captura la excepción real (`Parser Error: syntax error at or near "WHERE"`), muestra el cuadro de alerta honesto con el botón `Explícame este error` y no marca la práctica como superada. Captura: `adv-sql-syntax-error.png`. | Superado |
| 3 | **Selección de opción incorrecta en `checks` (MCQ)** en `c1-viz-04` (`Todas las columnas centradas para que la tabla se vea simétrica.`) | La tarjeta marca la opción con icono de error (`×`), muestra el `feedback` específico del distractor (`Incorrecto: centrar importes de distinta longitud desalinea las unidades...`), despliega la explicación conceptual y ofrece el botón `No lo entiendo — explicar en el tutor`. Captura: `adv-mcq-wrong-feedback.png`. | Superado |
| 4 | **Intento de completar la lección sin responder las 4 comprobaciones ni enviar la práctica** | Al pulsar `Completar lección`, `LessonPlayer` bloquea el marcado y muestra la alerta honesta indicando exactamente qué requisitos faltan (`responder comprobaciones pendientes`, `enviar un intento en la práctica aplicada`) con enlaces directos a cada bloque. | Superado |
| 5 | **Respuesta errónea deliberada al Tutor IA en las 4 lecciones** (`buildContextPrompt`) | El ensamblador de contexto inyecta `objectives`, `sectionBody` y `aiNotes` específicos de cada lección (3 369 a 3 756 caracteres, muy por debajo del tope de 24 000 caracteres), incluyendo las trampas documentadas (`COUNT(DISTINCT s.store_id)` vs `COUNT(s.store_id)`, `SUM(spend)/SUM(conv)` vs promedio de ratios, tinta proporcional en barras y jerarquía de Cleveland y McGill). | Superado |
| 6 | **Navegación consecutiva entre las 4 lecciones con cambio de tema (`light` ↔ `dark`) y ejecución de las 4 prácticas SQL** | `0` errores de consola (`pageerror: 0`), transición fluida entre `c1-viz-01` → `c1-viz-02` → `c1-viz-03` → `c1-viz-04` reutilizando la instancia activa de DuckDB-Wasm en `27.5–59 ms` por consulta tras el arranque inicial. | Superado |

---

## Capturas antes / después

Todas las capturas fueron tomadas a `1280×720` (y `375×667` para la prueba adversarial móvil) e inspeccionadas visualmente con `read_file`. Se almacenan en `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-c1-viz\` (sin commitear `.png` a git):

| Archivo | Lección / Escenario | Contenido verificado visualmente |
| :--- | :--- | :--- |
| `c1-viz-01-header-light.png` | `c1-viz-01` (Claro) | Cabecera, migas `Ruta > Visualización honesta`, `20 min · Nivel 1`, `hook` completo y 3 objetivos numerados. |
| `c1-viz-01-header-dark.png` | `c1-viz-01` (Oscuro) | Contraste editorial oscuro (`#121210`), acento terracota y temario lateral `1/10`. |
| `c1-viz-01-practice-solved.png` | `c1-viz-01` (Práctica SQL) | Consulta ejecutada en DuckDB-Wasm (`344.7 ms`), `Práctica superada`, 5 categorías ordenadas de `Molinos` (`39.6 %`) a `Café en grano` (`7.6 %`). |
| `c1-viz-02-header-light.png` | `c1-viz-02` (Claro) | Título `Ejes, escalas, cuándo exigir el cero y ejes dobles`, enlace clicable al prerrequisito `c1-viz-01`, `hook` y objetivos. |
| `c1-viz-02-practice-solved.png` | `c1-viz-02` (Práctica SQL) | Consulta con `FIRST_VALUE() OVER (...)` ejecutada en `59 ms`, 6 meses de 2024 con `indice_base_100` (`100`, `92.7`, `110.1`, `101.2`, `103.5`, `103.4`). |
| `c1-viz-03-header-light.png` | `c1-viz-03` (Claro) | Título `Color con intención: paletas secuenciales y accesibilidad`, enlace al prerrequisito `c1-viz-02`, `hook` sobre deuteranopía y objetivos WCAG 2.2. |
| `c1-viz-03-header-dark.png` | `c1-viz-03` (Oscuro) | Cabecera y tarjeta de escenario real en tema oscuro sin pérdida de contraste. |
| `c1-viz-03-practice-solved.png` | `c1-viz-03` (Práctica SQL) | Consulta sobre `marketing_spend` ejecutada en `27.5 ms`, 5 canales con `cpa_usd` y columna redundante `alerta_accesible`. |
| `c1-viz-04-header-light.png` | `c1-viz-04` (Claro) | Título `Diseño de tablas numéricas: alineación y cifras tabulares`, etiqueta `Lab` en sección 02 (`bi-anti-slop-comparator`), `hook` y objetivos. |
| `c1-viz-04-practice-solved.png` | `c1-viz-04` (Práctica SQL) | Tabla ejecutiva por `store_type` ejecutada en `43.7 ms`, 3 filas (`retail`, `flagship`, `warehouse`) con cifras alineadas a la derecha. |
| `adv-sql-syntax-error.png` | Adversarial SQL | Alerta honesta `Error de ejecución en DuckDB: Parser Error: syntax error at or near "WHERE"` y botón `Explícame este error`. |
| `adv-mcq-wrong-feedback.png` | Adversarial MCQ | Opción incorrecta marcada con feedback específico del distractor y bloque `Por qué ocurre este resultado`. |
| `adv-mobile-dark-lg.png` | Adversarial `375×667` | Vista móvil en tema oscuro con escala `1.25` sin barra de scroll horizontal (`scrollWidth: 375`). |

---

## Peticiones al orquestador

Para la fase de integración (Fase 4), se solicita al orquestador:

1. **Actualizar `src/data/catalog/modules.js` en el bloque del módulo `c1-viz`:**
   - Alinear los `id`, `title` y `status: 'existing'` de las 4 lecciones:
     - `{ id: 'c1-viz-01-geometria-grafico', title: 'Elegir la geometría según la pregunta y la variable', minutes: 20, status: 'existing' }`
     - `{ id: 'c1-viz-02-ejes-escalas-cero', title: 'Ejes, escalas, cuándo exigir el cero y ejes dobles', minutes: 20, status: 'existing' }`
     - `{ id: 'c1-viz-03-color-accesibilidad', title: 'Color con intención: paletas secuenciales y accesibilidad', minutes: 20, status: 'existing' }`
     - `{ id: 'c1-viz-04-tablas-numericas', title: 'Diseño de tablas numéricas: alineación y cifras tabulares', minutes: 20, status: 'existing' }`
   - Incorporar la rúbrica detallada de 4 criterios del proyecto `proj-c1-viz` documentada en el Paso 6 de `docs/curriculo/investigacion/c1-viz.md`.
2. **Fusionar los 7 términos de glosario nuevos** de `docs/curriculo/investigacion/c1-viz-glossary.json` (`codificacion-visual`, `jerarquia-perceptual`, `tinta-proporcional`, `indice-base-100`, `paleta-divergente`, `contraste-no-textual`, `cifras-tabulares`) dentro de `src/data/glossary.js`.
3. **Ejecutar `node scripts/sync-lessons-index.mjs`** tras fusionar las ramas de la Ola A para registrar las 4 lecciones de `c1-viz` en `src/data/lessons/index.js`.

---

## Pendiente (con motivo)

Ninguno. Los 4 archivos de lección, el documento de investigación curricular, el archivo JSON de glosario, la verificación en DuckDB y las capturas en navegador están completos y validados con `0` errores y `0` advertencias.
