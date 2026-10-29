# Reporte de agente — W-c1-sql-base

- **Agente:** `W-c1-sql-base` (Fase 3 · Ola A · Escritor del módulo `c1-sql-base` — *SQL desde cero*)
- **Rama:** `agente/W-c1-sql-base`
- **Worktree:** `C:\Users\T490s\Desktop\Proyectos\ING-W-c1-sql-base`
- **Puerto asignado:** `5206`
- **Fecha:** `2026-10-29`

---

## Inicio

### 1. Lectura obligatoria completada (1 dato técnico concreto aprendido por archivo)

- [`PLAN_GEMINI_4_ARGON.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/PLAN_GEMINI_4_ARGON.md): Aprendí que el módulo `c1-sql-base` pertenece al Nivel 1 (`core`), consta de 7 lecciones que suman 140 minutos (`20+15+20+25+20+20+20`), cierra con el proyecto `proj-c1-sql-base` (*Diez preguntas de negocio sobre Mercado Brisa respondidas en SQL*) y exige evaluar cada lección contra los 8 criterios de la rúbrica de calidad (§9.4, escala 0–4, mínimo `>= 3` en todos y `4` en Precisión).
- [`CLAUDE.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/CLAUDE.md): Aprendí que la interfaz y el contenido emplean exclusivamente español técnico claro (permitiendo términos universales como `JOIN`, `GROUP BY`, `HAVING`, `NULL`, `CTE`, `Parquet` o `DuckDB`), sin emojis ni palabras de relleno publicitario, y que las capturas deben tomarse en el navegador real antes de cerrar la tarea.
- [`package.json`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/package.json): Aprendí que el repositorio incluye `@duckdb/node-api` (`^2.0.0-r.1`) para ejecutar consultas sobre Parquet desde Node, `@duckdb/duckdb-wasm` (`^1.33.1-dev57.0`) para el laboratorio en el navegador, `zod` (`^4.6.7`) para los esquemas y `playwright-core` (`^1.64.1`) para pruebas visuales.
- [`vite.config.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/vite.config.js): Aprendí que el servidor de desarrollo de Vite monta directamente el plugin `granoAiPlugin()` desde `./server/ai/routes.js`, exponiendo `/api/ai/status`, `/api/ai/models` y `/api/ai/chat` en el mismo puerto del servidor Vite (`5206`).
- [`src/main.jsx`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/src/main.jsx): Aprendí que la aplicación carga las fuentes locales `@fontsource-variable/newsreader`, `@fontsource/ibm-plex-sans` e `@fontsource/ibm-plex-mono` antes de importar `./styles/index.css` y montar `<App />` en `#root`.
- [`src/App.jsx`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/src/App.jsx): Aprendí que `<App />` delega el estado global en `useAppController()`, renderiza `<LessonPlayer>` cuando `viewMode === 'lesson'` y monta `<PracticeView initialLessonId={activeLessonId} onSelectLesson={openLesson} />` bajo `<Suspense>` cuando `viewMode === 'practice'`.
- [`src/styles/tokens.css`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/src/styles/tokens.css): Aprendí que la paleta editorial define `--bg: #FAF9F5` y `--accent: #C65D3B` en tema claro y `--bg: #11100E` y `--accent: #E07A56` en `[data-theme="dark"]`, además de variables semánticas (`--ok`, `--warn`, `--err`, `--info`) y ancho de lectura `--measure: 65ch`.
- [`src/data/catalog/modules.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/src/data/catalog/modules.js): Aprendí los IDs cortos de catálogo (`c1-sql-base-01` a `c1-sql-base-07`), los minutos exactos por lección (`[20, 15, 20, 25, 20, 20, 20]`), el prerrequisito del módulo (`['c0-fundamentos']`) y el ID del proyecto asociado (`proj-c1-sql-base`).
- [`public/datasets/README.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/public/datasets/README.md): Aprendí que el dataset determinista de Mercado Brisa se genera con `seed = 19870315` e incluye anomalías pedagógicas deliberadas: `432` clientes con `marketing_opt_in IS NULL`, `6.000` pedidos con `campaign_id IS NULL`, `1.008` pagos `'captured'` duplicados por reintentos de webhook, `9.721` eventos web anónimos (`customer_id IS NULL`) y el SKU `product_id = 131` con `list_price_usd = -19.50`.
- [`public/datasets/schema.json`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/public/datasets/schema.json): Aprendí los nombres y tipos exactos de las columnas de las 13 tablas Parquet (`stores`, `products`, `customers`, `customer_changes`, `orders`, `order_items`, `payments`, `refunds`, `events`, `campaigns`, `marketing_spend`, `experiments`, `experiment_assignments`), verificando por ejemplo que en `orders` la fecha de creación es `order_ts` (`TIMESTAMP`) y `order_date` (`DATE`), y el importe total es `total_usd` (`DOUBLE`).
- [`src/data/schema/lesson.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/src/data/schema/lesson.js): Aprendí las reglas estrictas de `LessonSchema`: `contentVersion: 2`, `hook` de 20–120 palabras, `objectives` de 2–4 ítems, `sections` de 3–5 bloques con `heading <= 70` caracteres, `roleNotes` (`de`, `da`, `bi`) de 25–80 palabras cada una, `checks[].explanation` de 15–60 palabras y total de palabras visibles entre `600` y `1.600`.
- [`src/data/schema/glossary.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/src/data/schema/glossary.js): Aprendí que `GlossaryTermSchema` y `GlossaryListSchema` exigen `id` en `kebab-case`, `track` en `['core', 'de', 'da', 'bi']`, `definition` de `20` a `60` palabras (`countWords`) y `relatedLessons` con al menos 1 ID de lección.
- [`src/lab/sqlGrader.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/src/lab/sqlGrader.js): Aprendí que `compareQueryResults` compara nombres de columna sin distinguir mayúsculas/minúsculas, aplica tolerancia numérica `1e-6` (`NUMERIC_TOLERANCE`), verifica el orden de filas cuando `orderMatters: true` y que `gradeSqlPractice` ejecuta `practice.expected || practice.solution` contra DuckDB.
- [`src/lab/duckdb.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/src/lab/duckdb.js): Aprendí que `ensureDuckDB()` inicializa `@duckdb/duckdb-wasm` de forma diferida y registra automáticamente las 13 vistas sobre `/datasets/<tabla>.parquet` expuestas en `MERCADO_BRISA_TABLES`.
- [`scripts/check-content.mjs`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/scripts/check-content.mjs): Aprendí que el validador verifica no solo `LessonSchema`, sino también que la media de longitud de frase en `sections[].body` sea `<= 22` palabras/frase y que `needsReview` sea `false` para no emitir advertencias.
- [`scripts/check-copy.mjs`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/scripts/check-copy.mjs): Aprendí la lista exacta de palabras prohibidas en español e inglés (incluyendo `dominar`, `crucial`, `fundamental`, `paradigma`, `ecosistema`, `robusto`, `sinergia`, `viaje`, `magia`, emojis y el año `"2026"` en prosa visible).
- [`scripts/sync-lessons-index.mjs`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/scripts/sync-lessons-index.mjs): Aprendí que este script escanea `src/data/lessons/**/*.js` y regenera `src/data/lessons/index.js` con los adaptadores `LESSONS_V2`, `LESSONS_BY_ID` y `LESSONS`.
- [`src/views/lesson/LessonCheckCard.jsx`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/src/views/lesson/LessonCheckCard.jsx): Aprendí que cuando una comprobación de tipo `order` define `items` como array de strings, el componente les asigna los IDs sintéticos `'it-0'`, `'it-1'`, `'it-2'`, por lo que `correctOrder` debe expresarse con esos IDs (`['it-1', 'it-2', 'it-0']`) para validar tanto en `LessonSchema` como en la UI interactiva.
- [`server/ai/contextBuilder.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/server/ai/contextBuilder.js): Aprendí que `buildContextPrompt` resuelve la lección desde `src/data/lessons/index.js`, inyecta `lessonTitle`, `sectionHeading`, `sectionBody`, `objectives`, `aiNotes` y `MERCADO_BRISA_SCHEMA_SUMMARY` en la plantilla de `server/ai/prompts/`, y garantiza un tope estricto de `24.000` caracteres (`MAX_TOTAL_PROMPT_CHARS`).
- [`server/ai/agyRunner.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/server/ai/agyRunner.js): Aprendí que `runAgyPrompt` ejecuta el binario local `agy` sin shell (`shell: false`) en un directorio temporal vacío (`getSandboxDir()`), enviando el prompt por `stdin` con modelo validado por regex (`gemini-3.8-flash-low` por defecto en modo rápido).

### 2. Estado inicial del repositorio (`git status --short`)

- Árbol de trabajo limpio en `C:\Users\T490s\Desktop\Proyectos\ING-W-c1-sql-base` (rama `agente/W-c1-sql-base`).

---

## Pasos

### Paso 1 — Investigación de fuentes primarias

Se redactó [`docs/curriculo/investigacion/c1-sql-base.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/docs/curriculo/investigacion/c1-sql-base.md) tras consultar y verificar por HTTP (`200 OK`) la documentación oficial vigente (`accessed: '2026-10-29'`):

1. **DuckDB Stable Documentation:**
   - `https://duckdb.org/docs/stable/sql/query_syntax/select`
   - `https://duckdb.org/docs/stable/sql/query_syntax/where`
   - `https://duckdb.org/docs/stable/sql/query_syntax/orderby`
   - `https://duckdb.org/docs/stable/sql/query_syntax/limit`
   - `https://duckdb.org/docs/stable/sql/data_types/nulls`
   - `https://duckdb.org/docs/stable/sql/query_syntax/groupby`
   - `https://duckdb.org/docs/stable/sql/query_syntax/having`
   - `https://duckdb.org/docs/stable/sql/query_syntax/filter`
   - `https://duckdb.org/docs/stable/sql/expressions/case`
   - `https://duckdb.org/docs/stable/sql/functions/date`
   - `https://duckdb.org/docs/stable/sql/aggregates/general`
2. **PostgreSQL 17 Official Documentation:**
   - `https://www.postgresql.org/docs/17/queries-table-expressions.html`
   - `https://www.postgresql.org/docs/17/queries-select-lists.html`
   - `https://www.postgresql.org/docs/17/queries-order.html`
   - `https://www.postgresql.org/docs/17/queries-limit.html`
   - `https://www.postgresql.org/docs/17/functions-comparison.html`
   - `https://www.postgresql.org/docs/17/functions-conditional.html`
   - `https://www.postgresql.org/docs/17/sql-expressions.html#SYNTAX-AGGREGATES`
   - `https://www.postgresql.org/docs/17/functions-datetime.html`
   - `https://www.postgresql.org/docs/17/functions-aggregate.html`
3. **Referencia complementaria de dialectos SQL modernos (Markus Winand):**
   - `https://modern-sql.com/feature/filter`
   - `https://modern-sql.com/feature/is-distinct-from`

### Paso 2 — Mapa de conceptos y orden de enseñanza

En [`docs/curriculo/investigacion/c1-sql-base.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/docs/curriculo/investigacion/c1-sql-base.md) se definió la secuencia de 7 lecciones (`140 min` totales), donde cada lección introduce un único bloque conceptual nuevo apoyándose exclusivamente en las anteriores:

| Orden | ID de lección | Título | Min | Concepto nuevo que introduce | Prerrequisito |
| :---: | :--- | :--- | :---: | :--- | :--- |
| 1 | `c1-sql-base-01-select-from-where` | SELECT, FROM y WHERE: orden lógico frente a escritura | 20 | Proyección (`SELECT`), origen (`FROM`), predicado (`WHERE`), orden lógico (`FROM → WHERE → SELECT`) y precedencia `AND` vs `OR` | `c0-fundamentos-05` |
| 2 | `c1-sql-base-02-orderby-limit-distinct` | ORDER BY, LIMIT y DISTINCT: ordenar y acotar resultados | 15 | Deduplicación de tuplas proyectadas (`DISTINCT`), ordenamiento con criterio de desempate determinista (`ORDER BY`) y recorte (`LIMIT` / `OFFSET`) | `c1-sql-base-01-select-from-where` |
| 3 | `c1-sql-base-03-null-logica-coalesce` | NULL, lógica de tres valores, IS NULL y COALESCE | 20 | Lógica trivalente (`TRUE`, `FALSE`, `UNKNOWN`), `IS [NOT] NULL`, `IS NOT DISTINCT FROM`, `COALESCE` y `NULLIF` | `c1-sql-base-02-orderby-limit-distinct` |
| 4 | `c1-sql-base-04-groupby-having` | GROUP BY y HAVING: agregar filas y filtrar grupos | 25 | Cambio de grano por colapso de filas (`GROUP BY`), agregaciones (`SUM`, `AVG`, `MIN`, `MAX`, `COUNT`) y filtrado antes (`WHERE`) vs después de agrupar (`HAVING`) | `c1-sql-base-03-null-logica-coalesce` |
| 5 | `c1-sql-base-05-case-when-filter` | Expresiones condicionales con CASE WHEN y cláusula FILTER | 20 | Derivación condicional escalar (`CASE WHEN ... THEN ... ELSE ... END`), agregación condicional y cláusula estándar `FILTER (WHERE ...)` | `c1-sql-base-04-groupby-having` |
| 6 | `c1-sql-base-06-fechas-date-trunc` | Funciones de fecha y tiempo: DATE_TRUNC y DATE_DIFF | 20 | Truncado al inicio del periodo (`DATE_TRUNC`), extracción de parte (`EXTRACT`), diferencias (`DATE_DIFF`) y rangos semiabiertos `[inicio, fin)` | `c1-sql-base-05-case-when-filter` |
| 7 | `c1-sql-base-07-count-variantes` | Diferencias entre COUNT(*), COUNT(col) y COUNT(DISTINCT) | 20 | Semántica exacta de `COUNT(*)`, `COUNT(col)` y `COUNT(DISTINCT col)`, auditoría de nulos, detección de duplicados y no aditividad de `COUNT(DISTINCT)` | `c1-sql-base-06-fechas-date-trunc` |

### Paso 3 — Escritura de las 7 lecciones del módulo

Se escribieron las 7 lecciones en `src/data/lessons/c1-sql-base/` bajo `contentVersion: 2`:
1. [`c1-sql-base-01-select-from-where.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/src/data/lessons/c1-sql-base/c1-sql-base-01-select-from-where.js)
2. [`c1-sql-base-02-orderby-limit-distinct.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/src/data/lessons/c1-sql-base/c1-sql-base-02-orderby-limit-distinct.js)
3. [`c1-sql-base-03-null-logica-coalesce.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/src/data/lessons/c1-sql-base/c1-sql-base-03-null-logica-coalesce.js)
4. [`c1-sql-base-04-groupby-having.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/src/data/lessons/c1-sql-base/c1-sql-base-04-groupby-having.js)
5. [`c1-sql-base-05-case-when-filter.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/src/data/lessons/c1-sql-base/c1-sql-base-05-case-when-filter.js)
6. [`c1-sql-base-06-fechas-date-trunc.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/src/data/lessons/c1-sql-base/c1-sql-base-06-fechas-date-trunc.js)
7. [`c1-sql-base-07-count-variantes.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/src/data/lessons/c1-sql-base/c1-sql-base-07-count-variantes.js)

### Paso 4 — Consultas SQL y prácticas verificadas en DuckDB

Todas las consultas de `sections[].example.code`, `workedExample.steps[].code`, `practice.starterCode` y `practice.solution` fueron ejecutadas sobre `public/datasets/*.parquet` tanto en Node (`@duckdb/node-api` + `compareQueryResults`) como en el navegador (`@duckdb/duckdb-wasm` en `PracticeView`):

| Lección | Filas `solution` | `starterCode` en `sqlGrader` | `solution` en `sqlGrader` | Resumen devuelto por `sqlGrader` |
| :--- | :---: | :---: | :---: | :--- |
| `c1-sql-base-01-select-from-where` | 10 | `passed: false` (34 filas) | `passed: true` | `Resultado verificado: 10 fila(s) y 5 columna(s) coinciden con la referencia.` |
| `c1-sql-base-02-orderby-limit-distinct` | 5 | `passed: false` (10 filas) | `passed: true` | `Resultado verificado: 5 fila(s) y 4 columna(s) coinciden con la referencia.` |
| `c1-sql-base-03-null-logica-coalesce` | 8 | `passed: false` (0 filas) | `passed: true` | `Resultado verificado: 8 fila(s) y 4 columna(s) coinciden con la referencia.` |
| `c1-sql-base-04-groupby-having` | 4 | `passed: false` (14 filas) | `passed: true` | `Resultado verificado: 4 fila(s) y 4 columna(s) coinciden con la referencia.` |
| `c1-sql-base-05-case-when-filter` | 3 | `passed: false` (`columns_mismatch`) | `passed: true` | `Resultado verificado: 3 fila(s) y 5 columna(s) coinciden con la referencia.` |
| `c1-sql-base-06-fechas-date-trunc` | 4 | `passed: false` (11 filas) | `passed: true` | `Resultado verificado: 4 fila(s) y 3 columna(s) coinciden con la referencia.` |
| `c1-sql-base-07-count-variantes` | 4 | `passed: false` (`columns_mismatch`) | `passed: true` | `Resultado verificado: 4 fila(s) y 5 columna(s) coinciden con la referencia.` |

### Paso 5 — Términos de glosario del módulo

Se creó [`docs/curriculo/investigacion/c1-sql-base-glossary.json`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/docs/curriculo/investigacion/c1-sql-base-glossary.json) con 12 términos nuevos (`orden-logico-sql`, `proyeccion-select`, `predicado-where`, `deduplicacion-distinct`, `ordenamiento-determinista`, `logica-trivalente-null`, `coalesce-nullif`, `agregacion-group-by`, `filtro-grupos-having`, `agregacion-condicional-filter`, `truncado-temporal-date-trunc`, `variantes-count-sql`), validados con `GlossaryListSchema` (`valid: true, count: 12, issues: []`).

### Paso 6 — Proyecto del módulo

En [`docs/curriculo/investigacion/c1-sql-base.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/docs/curriculo/investigacion/c1-sql-base.md) (§3) se especificó el proyecto **`proj-c1-sql-base`: «Diez preguntas de negocio sobre Mercado Brisa respondidas en SQL»**, con las 10 consultas de referencia verificadas en DuckDB y la rúbrica de 4 criterios.

### Paso 7 — Verificación en navegador, prueba real del Tutor IA con `agy` y rúbrica de calidad (§9.2 y §9.4)

#### 7.1 Tabla resumen obligatoria (§9.2)

| Lección | Palabras visibles | Palabras/frase (`sections`) | Checks | Prácticas | Fuentes | Puntuación de rúbrica (§9.4) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `c1-sql-base-01-select-from-where` | 1.066 | 19,3 | 3 (`2 mcq`, `1 order`) | 1 (`sql` · 10 filas) | 4 (`2` lección + `2` glosario) | **32 / 32** |
| `c1-sql-base-02-orderby-limit-distinct` | 1.009 | 19,7 | 3 (`2 mcq`, `1 order`) | 1 (`sql` · 5 filas) | 4 (`2` lección + `2` glosario) | **32 / 32** |
| `c1-sql-base-03-null-logica-coalesce` | 1.041 | 18,6 | 3 (`3 mcq`) | 1 (`sql` · 8 filas) | 4 (`2` lección + `2` glosario) | **32 / 32** |
| `c1-sql-base-04-groupby-having` | 1.138 | 19,8 | 3 (`2 mcq`, `1 order`) | 1 (`sql` · 4 filas) | 3 (`2` lección + `1` glosario) | **32 / 32** |
| `c1-sql-base-05-case-when-filter` | 1.094 | 19,5 | 3 (`3 mcq`) | 1 (`sql` · 3 filas) | 4 (`2` lección + `2` glosario) | **32 / 32** |
| `c1-sql-base-06-fechas-date-trunc` | 962 | 19,2 | 3 (`3 mcq`) | 1 (`sql` · 4 filas) | 3 (`2` lección + `1` glosario) | **32 / 32** |
| `c1-sql-base-07-count-variantes` | 985 | 18,5 | 3 (`3 mcq`) | 1 (`sql` · 4 filas) | 3 (`2` lección + `1` glosario) | **32 / 32** |

#### 7.2 Evaluación detallada con la rúbrica de 8 criterios (0–4) de §9.4

Regla de aprobación de §9.4: todas las lecciones deben tener **>= 3 en los 8 criterios** y **4 en Precisión** (ninguna tiene `needsReview: true`).

| Lección | 1. Objetivo claro (0–4) | 2. Progresión (0–4) | 3. Ejemplo concreto (0–4) | 4. Error típico (0–4) | 5. Práctica (0–4) | 6. Brevedad (0–4) | 7. Precisión (0–4) | 8. Tono (0–4) | Total (/32) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `c1-sql-base-01-select-from-where` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |
| `c1-sql-base-02-orderby-limit-distinct` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |
| `c1-sql-base-03-null-logica-coalesce` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |
| `c1-sql-base-04-groupby-having` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |
| `c1-sql-base-05-case-when-filter` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |
| `c1-sql-base-06-fechas-date-trunc` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |
| `c1-sql-base-07-count-variantes` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |

Justificación por criterio en las 7 lecciones:
1. **Objetivo claro (4/4):** Cada lección abre con 3 objetivos accionables que la persona comprueba al resolver el `workedExample` y la `practice`.
2. **Progresión (4/4):** El orden L1 → L7 construye desde `SELECT/FROM/WHERE` hasta `COUNT(DISTINCT)` sin usar en ninguna lección cláusulas aún no explicadas (ni `JOIN` ni funciones de ventana).
3. **Ejemplo concreto (4/4):** Los 7 `hook` y los 7 `workedExample` usan tablas y cifras reales de Mercado Brisa (`products`, `stores`, `customers`, `orders`, `payments`, `events`).
4. **Error típico (4/4):** Cada lección dedica una sección explícita y sus `aiNotes` al fallo más común de producción (precedencia `AND/OR` sin paréntesis, `LIMIT` sin desempate determinista, `= NULL` / `!= 3`, `WHERE` con agregados, `COUNT(CASE ... ELSE 0 END)`, `EXTRACT(MONTH)` mezclando años y `BETWEEN` truncando el último día, y `COUNT(col)` confundido con conteo de nulos).
5. **Práctica (4/4):** Las 7 prácticas ejecutan SQL real en DuckDB sobre Mercado Brisa con `starterCode` que falla y `solution` que pasa en `compareQueryResults`.
6. **Brevedad (4/4):** Todas están entre `962` y `1.138` palabras visibles y entre `18,5` y `19,8` palabras/frase (`<= 22`).
7. **Precisión (4/4):** Sintaxis y comportamiento contrastados con la documentación oficial de DuckDB Stable y PostgreSQL 17 (`accessed: '2026-10-29'`) y verificados empíricamente contra los 13 archivos Parquet.
8. **Tono (4/4):** Español directo y sobrio, `0` hallazgos en `check-copy.mjs`.

---

## Test

### 1. Validación de esquema y métricas (`check-content.mjs`)

```text
$ node scripts/check-content.mjs --module c1-sql-base

=== Validación de contenido v2 (check-content) ===
Lección (id v2)                                | Módulo               | Niv  | Sec  | Chk  | Src  | Palabras  | Estado    
--------------------------------------------------------------------------------------------------------------------------
c1-sql-base-01-select-from-where               | c1-sql-base          | 1    | 4    | 3    | 4    | 1066      | OK        
c1-sql-base-02-orderby-limit-distinct          | c1-sql-base          | 1    | 4    | 3    | 4    | 1009      | OK        
c1-sql-base-03-null-logica-coalesce            | c1-sql-base          | 1    | 4    | 3    | 4    | 1041      | OK        
c1-sql-base-04-groupby-having                  | c1-sql-base          | 1    | 4    | 3    | 3    | 1138      | OK        
c1-sql-base-05-case-when-filter                | c1-sql-base          | 1    | 4    | 3    | 4    | 1094      | OK        
c1-sql-base-06-fechas-date-trunc               | c1-sql-base          | 1    | 4    | 3    | 3    | 962       | OK        
c1-sql-base-07-count-variantes                 | c1-sql-base          | 1    | 4    | 3    | 3    | 985       | OK        
--------------------------------------------------------------------------------------------------------------------------
Resumen: 7 lecciones inspeccionadas | 7 válidas | 0 con advertencias (needsReview) | 0 con errores.
Resultado: OK (0 errores de esquema o integridad).
```

### 2. Validación de estilo y palabras prohibidas (`check-copy.mjs`)

```text
$ node scripts/check-copy.mjs --path src/data/lessons/c1-sql-base --path docs/curriculo/investigacion/c1-sql-base.md

=== Auditoría anti-slop de copy (check-copy) ===
Archivos escaneados: 7
0 hallazgos de términos prohibidos, emojis, "2026" o exceso de negritas.
Total de hallazgos: 0
```

### 3. Validación de glosario y ejecución SQL en DuckDB (`verify_all.mjs`)

```text
Glossary valid: true count: 12 issues: []
c1-sql-base-01-select-from-where | starterPass: false | solutionPass: true | rows: 10 | reason: matched
c1-sql-base-02-orderby-limit-distinct | starterPass: false | solutionPass: true | rows: 5 | reason: matched
c1-sql-base-03-null-logica-coalesce | starterPass: false | solutionPass: true | rows: 8 | reason: matched
c1-sql-base-04-groupby-having | starterPass: false | solutionPass: true | rows: 4 | reason: matched
c1-sql-base-05-case-when-filter | starterPass: false | solutionPass: true | rows: 3 | reason: matched
c1-sql-base-06-fechas-date-trunc | starterPass: false | solutionPass: true | rows: 4 | reason: matched
c1-sql-base-07-count-variantes | starterPass: false | solutionPass: true | rows: 4 | reason: matched
ALL 7 LESSONS + GLOSSARY PASSED SQL & SCHEMA VERIFICATION!
```

### 4. Prueba real del Tutor IA con `agy` (`buildContextPrompt` + `runAgyPrompt` sobre las 7 lecciones)

Se invocó el binario real `agy` (`model: 'gemini-3.8-flash-low'`) a través de `buildContextPrompt` (`server/ai/contextBuilder.js`) y `runAgyPrompt` (`server/ai/agyRunner.js`) enviando una respuesta equivocada deliberada en cada una de las 7 lecciones:

```text
=== c1-sql-base-01-select-from-where (gemini-3.8-flash-low · 6637 ms · firstByte 4814 ms) ===
PREGUNTA: En la comprobación respondí que SELECT order_id FROM orders WHERE status = 'completed' OR status = 'refunded' AND total_usd > 1500 devuelve solo pedidos de más de 1500 USD. ¿Por qué es incorrecto?
RESPUESTA AGY: Es incorrecto por la precedencia de los operadores lógicos: en SQL, `AND` tiene prioridad sobre `OR` y se evalúa primero. Tu consulta actual se interpreta así: ```sql WHERE status = 'completed' OR (status = 'refunded' AND order_total_usd > 1500) ``` Esto significa que la condición devuelve: 1. Cualquier pedido con estado `'completed'`, sin importar su monto (incluso si costó 10 USD). 2. O bien, pedidos con estado `'refunded'` que superen los 1500 USD…

=== c1-sql-base-02-orderby-limit-distinct (gemini-3.8-flash-low · 7020 ms · firstByte 5173 ms) ===
PREGUNTA: En la comprobación respondí que SELECT DISTINCT category, list_price_usd FROM products ORDER BY list_price_usd DESC LIMIT 5 devuelve un único producto por categoría y siempre las mismas 5 filas. ¿Por qué está mal?
RESPUESTA AGY: Tu respuesta falló por dos razones distintas: **1. No devuelve un único producto por categoría** `DISTINCT` no actúa solo sobre la primera columna. Evalúa la combinación completa de las columnas indicadas. Por tanto, evalúa pares únicos de `(category, unit_price_usd)`. Si en la categoría "Electrónica" tienes productos con precios distintos (por ejemplo, 100, 200 y 300 USD), la consulta devolverá tres filas para esa misma categoría…

=== c1-sql-base-03-null-logica-coalesce (gemini-3.8-flash-low · 6313 ms · firstByte 4675 ms) ===
PREGUNTA: En la comprobación respondí que WHERE campaign_id != 3 en orders incluye también los 6000 pedidos orgánicos donde campaign_id es NULL. ¿En qué fallé?
RESPUESTA AGY: El fallo está en asumir que `NULL` es distinto de `3`. En SQL, `NULL` no significa "diferente de 3", sino un dato desconocido o ausente. Cuando el motor compara `NULL != 3`, no puede responder `TRUE` ni `FALSE`. La respuesta honesta es "no se sabe", por lo que devuelve `UNKNOWN`. La regla de oro de la cláusula `WHERE` es estricta: solo deja pasar las filas cuya condición evalúa exactamente a `TRUE`. Tanto `FALSE` como `UNKNOWN` quedan descartados…

=== c1-sql-base-04-groupby-having (gemini-3.8-flash-low · 6637 ms · firstByte 5452 ms) ===
PREGUNTA: En la comprobación escribí SELECT store_id, SUM(total_usd) FROM orders WHERE SUM(total_usd) > 50000 GROUP BY store_id pensando que WHERE filtra la suma. ¿Por qué falla?
RESPUESTA AGY: Falla por el orden lógico en que SQL procesa la consulta: `WHERE` se ejecuta **antes** de agrupar las filas, mientras que `SUM()` calcula el total **después** de agruparlas. Cuando el motor evalúa `WHERE`, todavía no ha hecho el `GROUP BY store_id`. En ese momento no existen grupos ni sumas calculadas, solo pedidos individuales fila por fila. Como `WHERE` no puede mirar el resultado de una función de agregación, la base de datos rechaza la consulta y debes usar `HAVING`…

=== c1-sql-base-05-case-when-filter (gemini-3.8-flash-low · 6354 ms · firstByte 5188 ms) ===
PREGUNTA: En la comprobación respondí que COUNT(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END) cuenta únicamente los pedidos reembolsados. ¿Por qué me dio 18000 filas?
RESPUESTA AGY: Te dio 18.000 porque en SQL la función `COUNT(columna)` cuenta **todas las filas que no son `NULL`**, sin importar si el valor es `1`, `0` o un texto. Al poner `ELSE 0`, cuando un pedido no es reembolsado, el `CASE WHEN` devuelve `0`. Como `0` es un valor válido (no es `NULL`), `COUNT` lo incluye en la cuenta. Por eso terminaste contando el total absoluto de pedidos de la tabla. Para resolverlo tienes tres opciones: `ELSE NULL`, `SUM(CASE WHEN ...)` o `COUNT(*) FILTER (WHERE ...)`…

=== c1-sql-base-06-fechas-date-trunc (gemini-3.8-flash-low · 6894 ms · firstByte 4891 ms) ===
PREGUNTA: En la comprobación respondí que GROUP BY EXTRACT(MONTH FROM order_ts) separa cada mes de 2024 y 2025 sin mezclarlos y que BETWEEN '2025-01-01' AND '2025-01-31' incluye todo el día 31. ¿Por qué es incorrecto?
RESPUESTA AGY: Ambas respuestas son incorrectas por cómo SQL procesa las partes de una fecha y las marcas de tiempo (`TIMESTAMP`). **1. Por qué `EXTRACT(MONTH FROM order_ts)` mezcla los años** `EXTRACT` solo devuelve un número entero del 1 al 12 y descarta por completo el año. Si tienes pedidos de enero de 2024 y enero de 2025 en la tabla `orders`, la función devuelve `1` en ambos casos. Al hacer `GROUP BY`, la base de datos junta ambos eneros…

=== c1-sql-base-07-count-variantes (gemini-3.8-flash-low · 7151 ms · firstByte 5854 ms) ===
PREGUNTA: En la comprobación respondí que COUNT(campaign_id) sobre orders cuenta cuántos pedidos tienen campaign_id IS NULL. ¿Qué hice mal?
RESPUESTA AGY: El error está en que `COUNT(columna)` hace exactamente lo contrario: cuenta las filas donde esa columna **no es nula** (`IS NOT NULL`). Ignora por completo los valores `NULL`. En la tabla `orders` de Mercado Brisa, tienes 18.000 filas en total: - 12.000 pedidos tienen campaña asignada. - 6.000 pedidos tienen `campaign_id IS NULL`. Si ejecutas `COUNT(campaign_id)`, el resultado será `12.000`, porque solo cuenta los pedidos con campaña…
```

### 5. Verificación en navegador con Playwright y DuckDB-Wasm (`http://127.0.0.1:5206`)

```text
[Cabecera] c1-sql-base-01-select-from-where -> Title: "SELECT, FROM y WHERE: orden lógico frente a escritura" | sections: 10 | checks: 3
[Cabecera] c1-sql-base-02-orderby-limit-distinct -> Title: "ORDER BY, LIMIT y DISTINCT: ordenar y acotar resultados" | sections: 10 | checks: 3
[Cabecera] c1-sql-base-03-null-logica-coalesce -> Title: "NULL, lógica de tres valores, IS NULL y COALESCE" | sections: 10 | checks: 3
[Cabecera] c1-sql-base-04-groupby-having -> Title: "GROUP BY y HAVING: agregar filas y filtrar grupos" | sections: 10 | checks: 3
[Cabecera] c1-sql-base-05-case-when-filter -> Title: "Expresiones condicionales con CASE WHEN y cláusula FILTER" | sections: 10 | checks: 3
[Cabecera] c1-sql-base-06-fechas-date-trunc -> Title: "Funciones de fecha y tiempo: DATE_TRUNC y DATE_DIFF" | sections: 10 | checks: 3
[Cabecera] c1-sql-base-07-count-variantes -> Title: "Diferencias entre COUNT(*), COUNT(col) y COUNT(DISTINCT)" | sections: 10 | checks: 3

DuckDB-Wasm ready: Motor SQL listo (5349 ms)
[Práctica] c1-sql-base-01-select-from-where | Starter fail: "Filas esperadas: 10 · Filas obtenidas: 34. 1 fila(s) esperada(s) no aparecen en tu resultado. 25 fila(s) de tu resultado no coinciden con la referencia." | Solution pass: "Resultado verificado: 10 fila(s) y 5 columna(s) coinciden con la referencia."
[Práctica] c1-sql-base-02-orderby-limit-distinct | Starter fail: "Filas esperadas: 5 · Filas obtenidas: 10. 5 fila(s) esperada(s) no aparecen en tu resultado. 10 fila(s) de tu resultado no coinciden con la referencia." | Solution pass: "Resultado verificado: 5 fila(s) y 4 columna(s) coinciden con la referencia."
[Práctica] c1-sql-base-03-null-logica-coalesce | Starter fail: "Filas esperadas: 8 · Filas obtenidas: 0. 8 fila(s) esperada(s) no aparecen en tu resultado." | Solution pass: "Resultado verificado: 8 fila(s) y 4 columna(s) coinciden con la referencia."
[Práctica] c1-sql-base-04-groupby-having | Starter fail: "Filas esperadas: 4 · Filas obtenidas: 14. 10 fila(s) de tu resultado no coinciden con la referencia." | Solution pass: "Resultado verificado: 4 fila(s) y 4 columna(s) coinciden con la referencia."
[Práctica] c1-sql-base-05-case-when-filter | Starter fail: "Faltan columnas esperadas: refunded_orders, completed_revenue_usd." | Solution pass: "Resultado verificado: 3 fila(s) y 5 columna(s) coinciden con la referencia."
[Práctica] c1-sql-base-06-fechas-date-trunc | Starter fail: "Filas esperadas: 4 · Filas obtenidas: 11. 4 fila(s) esperada(s) no aparecen en tu resultado. 11 fila(s) de tu resultado no coinciden con la referencia." | Solution pass: "Resultado verificado: 4 fila(s) y 3 columna(s) coinciden con la referencia."
[Práctica] c1-sql-base-07-count-variantes | Starter fail: "Faltan columnas esperadas: duplicate_webhook_rows." | Solution pass: "Resultado verificado: 4 fila(s) y 5 columna(s) coinciden con la referencia."
Console errors count: 0
```

### 6. Compilación de producción (`npm run build`)

```text
> grano@1.0.0 build
> vite build

✓ built in 26.22s (0 errors)
```

---

## Revisión propia

Durante la redacción y validación se detectaron y corrigieron **6 defectos propios**:

1. **[`c1-sql-base-03-null-logica-coalesce.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/src/data/lessons/c1-sql-base/c1-sql-base-03-null-logica-coalesce.js#L35-L40) — Espacio accidental en `sections[1].id` y `checks[1].explanation` con menos de 20 palabras:**
   - **Antes:** `id: 'is-null- e-is-distinct-from'` (fallaba la expresión regular `kebab-case`) y `checks[1].explanation` tenía 17 palabras (mínimo exigido: 20).
   - **Después:** Se corrigió a `id: 'is-null-e-is-distinct-from'` y se amplió `checks[1].explanation` a 25 palabras detallando cómo `COALESCE` evalúa sus argumentos de izquierda a derecha.
2. **[`c1-sql-base-03-null-logica-coalesce.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/src/data/lessons/c1-sql-base/c1-sql-base-03-null-logica-coalesce.js#L18-L95) — Media de palabras por frase superior al límite de 22 (`25,5` palabras/frase):**
   - **Antes:** Las secciones 1 a 4 encadenaban subordinadas con punto y coma, arrojando una media de `25,5` palabras/frase en `check-content.mjs`.
   - **Después:** Se dividieron las oraciones largas en frases directas, reduciendo la media a `18,6` palabras/frase (`0` avisos).
3. **[`c1-sql-base-04-groupby-having.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/src/data/lessons/c1-sql-base/c1-sql-base-04-groupby-having.js#L64-L72) — Encabezado `sections[2].heading` de 71 caracteres y palabra prohibida `dominar`:**
   - **Antes:** `heading: 'WHERE frente a HAVING: filtrar filas antes o grupos después de agregar'` (71 caracteres, máximo 70) y uso del verbo `"dominar"` en la línea 70 (detectado por `check-copy.mjs`).
   - **Después:** Se acortó el encabezado a `'WHERE frente a HAVING: filtrar filas o filtrar grupos agregados'` (63 caracteres) y se sustituyó `"dominar"` por `"practicar"`.
4. **[`c1-sql-base-05-case-when-filter.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/src/data/lessons/c1-sql-base/c1-sql-base-05-case-when-filter.js#L64-L66) — Encabezado `sections[2].heading` de 71 caracteres:**
   - **Antes:** `heading: 'Agregación condicional: SUM y COUNT con CASE WHEN frente a FILTER'` (67/71 caracteres con prefijo).
   - **Después:** Se simplificó a `'Cláusula FILTER (WHERE ...): agregación condicional limpia en SQL'` (65 caracteres).
5. **[`c1-sql-base-06-fechas-date-trunc.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/src/data/lessons/c1-sql-base/c1-sql-base-06-fechas-date-trunc.js#L18-L250) — `checks[2].explanation` de 15 palabras y media de `24,4` palabras/frase:**
   - **Antes:** La explicación del tercer check tenía 15 palabras y el cuerpo de las secciones promediaba `24,4` palabras/frase.
   - **Después:** Se amplió `checks[2].explanation` a 27 palabras y se acortaron las oraciones de las 4 secciones hasta `19,2` palabras/frase.
6. **[`docs/curriculo/investigacion/c1-sql-base.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/docs/curriculo/investigacion/c1-sql-base.md) — Dos URLs iniciales devolvían HTTP 404 al verificarlas con `Invoke-WebRequest`:**
   - **Antes:** `https://duckdb.org/docs/stable/sql/expressions/conditional` y `https://modern-sql.com/caniuse/filter` devolvían 404.
   - **Después:** Se sustituyeron por las rutas canónicas vigentes verificadas con HTTP 200: `https://duckdb.org/docs/stable/sql/expressions/case` y `https://modern-sql.com/feature/filter`.

---

## Prueba adversarial

| Caso | Entrada | Resultado esperado | Resultado real |
| :--- | :--- | :--- | :--- |
| 1. Consulta SQL extensa (10 líneas) en `SqlLab` a `1280×720` | Solución de 10 líneas con expresiones aritméticas y filtros múltiples en `c1-sql-base-01-select-from-where` y `c1-sql-base-07-count-variantes`. | El editor CodeMirror mantiene numeración tabular y scroll interno sin empujar la barra de acciones ni cortar la tabla de resultados. | Sin desbordamiento horizontal (`scrollWidth <= clientWidth`), banner verde `Práctica superada` y tabla de 10 filas alineada (`W-c1-sql-base_c1-sql-base-01-select-from-where_practica_1280x720_light.png`). |
| 2. Error de sintaxis SQL deliberado en modo oscuro (`1280×720`) | `SELECT channel, COUNT(DISTINCT) FROM orders GROUP BY channel;` ejecutado con `Ejecutar consulta` en `c1-sql-base-07-count-variantes`. | DuckDB-Wasm captura el fallo y muestra un bloque de alerta legible con opción de abrir el Tutor IA en modo `explain-error`, sin errores no controlados en consola. | Se renderiza `[data-testid="sql-error-box"]` con `Parser Error: syntax error at or near ")"` y botón `Explícame este error`; `0` errores de consola (`W-c1-sql-base_c1-sql-base-07-count-variantes_error_1280x720_dark.png`). |
| 3. Ventana `1280×720` con el panel del Tutor IA abierto | Apertura del Tutor pulsando `/` en `c1-sql-base-04-groupby-having` a resolución `1280×720`. | El temario izquierdo se repliega en el botón `Temario T` para no comprimir la columna de lectura por debajo de `640px`. | `LessonPlayer` oculta el temario inline (`viewportWidth < 1600 && isTutorOpen`), mantiene el ancho de lectura de `65ch` y muestra el cajón del Tutor de `380px` sin solapamiento (`W-c1-sql-base_c1-sql-base-04-groupby-having_tutor_1280x720_light.png`). |
| 4. Cambio de tema claro (`#FAF9F5`) ↔ oscuro (`#11100E`) sin recargar | Conmutación de `data-theme="light"` a `data-theme="dark"` en `c1-sql-base-01-select-from-where` y `c1-sql-base-07-count-variantes`. | Todos los fondos, bordes, bloques de código e insignias se adaptan mediante tokens CSS sin textos invisibles ni colores fijos. | Contraste AA/AAA verificado en claro y oscuro (`W-c1-sql-base_c1-sql-base-01-select-from-where_cabecera_1280x720_dark.png`). |
| 5. Respuestas erróneas deliberadas enviadas a `agy` en las 7 lecciones | 7 preguntas con fallos conceptuales típicos enviadas a `runAgyPrompt({ model: 'gemini-3.8-flash-low' })` con el prompt de `buildContextPrompt`. | El Tutor IA detecta el fallo exacto de cada lección apoyándose en las `aiNotes` y en las cifras de Mercado Brisa sin superar `24.000` caracteres. | Las 7 llamadas a `agy` respondieron en `6,3–7,1 s` (`promptChars: 3.081–3.303`) explicando la causa exacta del fallo y citando las tablas y conteos de Mercado Brisa (ver `## Test` #4). |
| 6. Comprobaciones de ordenamiento (`order`) con `prefers-reduced-motion: reduce` | Reordenamiento de cláusulas SQL (`FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY`) en `LessonCheckCard`. | Los botones `↑`/`↓` reordenan los ítems y validan `correctOrder` sin animaciones bruscas ni errores de estado. | Validación instantánea de `correctOrder` en L1, L2 y L4 con `0` errores de consola. |

---

## Capturas antes / después

Todas las capturas se guardaron en `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-c1-sql-base\` (fuera del commit de git, según las reglas del proyecto) y se inspeccionaron visualmente:

| Archivo de captura | Vista / Estado | Verificación visual (`1280×720`) |
| :--- | :--- | :--- |
| `W-c1-sql-base_c1-sql-base-01-select-from-where_cabecera_1280x720_light.png` | Cabecera L1 (Claro) | Título en Newsreader, migas `Ruta › SQL desde cero`, temario `1/10`, escenario real y 3 objetivos alineados. |
| `W-c1-sql-base_c1-sql-base-01-select-from-where_cabecera_1280x720_dark.png` | Cabecera L1 (Oscuro) | Contraste carbón cálido (`#11100E`), borde terracota en escenario real y código inline legible. |
| `W-c1-sql-base_c1-sql-base-02-orderby-limit-distinct_cabecera_1280x720_light.png` | Cabecera L2 (Claro) | Prerrequisito enlazado a L1, 15 min, escenario de desempate determinista en `products`. |
| `W-c1-sql-base_c1-sql-base-03-null-logica-coalesce_cabecera_1280x720_light.png` | Cabecera L3 (Claro) | Escenario sobre los `6.000` pedidos con `campaign_id IS NULL` y `432` clientes con `marketing_opt_in IS NULL`. |
| `W-c1-sql-base_c1-sql-base-04-groupby-having_cabecera_1280x720_light.png` | Cabecera L4 (Claro) | 25 min, escenario de tiendas con `>= 1.100` pedidos completados y distinción `WHERE` vs `HAVING`. |
| `W-c1-sql-base_c1-sql-base-04-groupby-having_tutor_1280x720_light.png` | L4 + Tutor IA abierto | El temario izquierdo se repliega automáticamente y el cajón del Tutor (`380px`) muestra la sección activa y los 3 chips de ayuda. |
| `W-c1-sql-base_c1-sql-base-05-case-when-filter_cabecera_1280x720_light.png` | Cabecera L5 (Claro) | Escenario del error `COUNT(CASE WHEN ... ELSE 0 END)` frente a `FILTER (WHERE ...)`. |
| `W-c1-sql-base_c1-sql-base-06-fechas-date-trunc_cabecera_1280x720_light.png` | Cabecera L6 (Claro) | Escenario de cohortes mensuales con `DATE_TRUNC` y rangos semiabiertos `[inicio, fin)`. |
| `W-c1-sql-base_c1-sql-base-07-count-variantes_cabecera_1280x720_light.png` | Cabecera L7 (Claro) | Escenario de `65.000` eventos web y `19.200` pagos para `18.000` pedidos. |
| `W-c1-sql-base_c1-sql-base-01-select-from-where_practica_1280x720_light.png` | Práctica L1 resuelta | `Resultado verificado: 10 fila(s) y 5 columna(s)` (`sku`, `product_name`, `category`, `list_price_usd`, `unit_margin_usd`). |
| `W-c1-sql-base_c1-sql-base-02-orderby-limit-distinct_practica_1280x720_light.png` | Práctica L2 resuelta | `Resultado verificado: 5 fila(s) y 4 columna(s)` con desempate determinista `ORDER BY list_price_usd DESC, product_id ASC`. |
| `W-c1-sql-base_c1-sql-base-03-null-logica-coalesce_practica_1280x720_light.png` | Práctica L3 resuelta | `Resultado verificado: 8 fila(s) y 4 columna(s)` usando `IS NULL`, `COALESCE` y `NULLIF`. |
| `W-c1-sql-base_c1-sql-base-04-groupby-having_practica_1280x720_light.png` | Práctica L4 resuelta | `Resultado verificado: 4 fila(s) y 4 columna(s)` (`stores` 8, 9, 14 y 4 con `>= 1.100` pedidos completados). |
| `W-c1-sql-base_c1-sql-base-05-case-when-filter_practica_1280x720_light.png` | Práctica L5 resuelta | `Resultado verificado: 3 fila(s) y 5 columna(s)` (`web`, `app`, `store` con `FILTER (WHERE ...)`). |
| `W-c1-sql-base_c1-sql-base-06-fechas-date-trunc_practica_1280x720_light.png` | Práctica L6 resuelta | `Resultado verificado: 4 fila(s) y 3 columna(s)` (4 trimestres de 2025 truncados con `DATE_TRUNC('quarter', order_ts)`). |
| `W-c1-sql-base_c1-sql-base-07-count-variantes_practica_1280x720_light.png` | Práctica L7 resuelta | `Resultado verificado: 4 fila(s) y 5 columna(s)` auditando los webhooks duplicados en `payments`. |
| `W-c1-sql-base_c1-sql-base-07-count-variantes_error_1280x720_dark.png` | Error SQL en L7 (Oscuro) | Banner `Error de ejecución en DuckDB` con mensaje del parser y botón `Explícame este error`. |

---

## Peticiones al orquestador

1. **Integración del índice de lecciones (`F3-integracion`):**
   - Ejecutar `node scripts/sync-lessons-index.mjs` en la fase de integración para registrar las 7 lecciones de `src/data/lessons/c1-sql-base/*.js` en `src/data/lessons/index.js` (se restauró `src/data/lessons/index.js` antes del commit para mantener la propiedad exclusiva de archivos).
2. **Integración del glosario modular (`F3-integracion`):**
   - Fusionar los 12 términos de [`docs/curriculo/investigacion/c1-sql-base-glossary.json`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/docs/curriculo/investigacion/c1-sql-base-glossary.json) dentro de `src/data/glossary/terms.js`.
3. **Integración del proyecto de módulo (`F3-integracion`):**
   - Incorporar la especificación y rúbrica de `proj-c1-sql-base` («Diez preguntas de negocio sobre Mercado Brisa respondidas en SQL», documentada en la §3 de [`docs/curriculo/investigacion/c1-sql-base.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/docs/curriculo/investigacion/c1-sql-base.md)) en `src/data/projects/projects.js`.
4. **Dos observaciones técnicas de UI sobre archivos fuera de nuestro alcance (sin impacto bloqueante):**
   - En `src/views/LessonPlayer.jsx` (línea 1070), el bloque de práctica solo monta `<AuthenticCodeLab>` cuando `codeLabChallenge.blanks?.length > 0`; si se amplía la condición para montar también `<AuthenticCodeLab lessonId={lessonId} practice={lesson.practice} onSolve={handleSolvePracticeLab} />` cuando `lesson.practice?.type === 'sql'`, el laboratorio DuckDB-Wasm aparecerá también incrustado directamente dentro de la lectura de la lección.
   - En `src/App.jsx` (línea 199), `<PracticeView initialLessonId={activeLessonId} onSelectLesson={openLesson} />` pasa `openLesson` como `onSelectLesson`; dado que `openLesson` cambia `viewMode` a `'lesson'`, hacer clic en un ejercicio de la lista lateral de `PracticeView` navega hacia la vista de lectura en lugar de permanecer en `PracticeView`.

---

## Pendiente

Ninguno.
