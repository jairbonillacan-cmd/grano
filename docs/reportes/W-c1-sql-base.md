# Reporte de agente — W-c1-sql-base

- **Agente:** `W-c1-sql-base` (Fase 3 · Ola A · Escritor del módulo `c1-sql-base` — *SQL desde cero*)
- **Rama:** `agente/W-c1-sql-base`
- **Worktree:** `C:\Users\T490s\Desktop\Proyectos\ING-W-c1-sql-base`
- **Puerto asignado:** `5206`
- **Fecha:** `2026-10-29`

---

## Inicio

1. **Lectura obligatoria completada antes de editar:**
   - `PLAN_GEMINI_4_ARGON.md` (§1, §2, §5 nivel 1 y módulo `c1-sql-base`, §9.2, §9.4, Apéndices A, B, D.2 y D.3).
   - `CLAUDE.md`, `package.json`, `vite.config.js`, `src/main.jsx`, `src/App.jsx`, `src/styles/tokens.css`.
   - `src/data/catalog/modules.js` (definición del módulo `c1-sql-base`, nivel `1`, área `core`, 7 lecciones, `[20, 15, 20, 25, 20, 20, 20]` min = `140` min totales, proyecto `proj-c1-sql-base`).
   - `public/datasets/README.md` y `public/datasets/schema.json` (13 tablas Parquet de Mercado Brisa con semilla `19870315` y `2,14 MB` totales).
   - `src/data/schema/lesson.js`, `src/data/schema/glossary.js`, `src/lab/sqlGrader.js`, `src/lab/duckdb.js`, `scripts/check-content.mjs`, `scripts/check-copy.mjs` y `scripts/sync-lessons-index.mjs`.
2. **Estado inicial del repositorio (`git status --short` en `C:\Users\T490s\Desktop\Proyectos\ING-W-c1-sql-base`):**
   - Árbol de trabajo limpio en la rama `agente/W-c1-sql-base`.
3. **Inspección inicial de los datasets reales de Mercado Brisa (`@duckdb/node-api` sobre `public/datasets/*.parquet`):**
   - `stores` (`20` filas · tipos `'flagship'`, `'standard'`, `'kiosk'`, `'warehouse'`), `products` (`180` filas · `165` activas · SKU defectuoso `product_id = 131` con `list_price_usd = -19.5`), `customers` (`2.400` filas · `432` con `marketing_opt_in IS NULL`), `orders` (`18.000` filas · `14.072` `'completed'`, `1.454` `'refunded'`, `1.898` `'cancelled'`, `576` `'pending'` · `6.000` con `campaign_id IS NULL`), `payments` (`19.200` filas para `18.000` pedidos únicos · `1.008` reintentos de webhook duplicados en estado `'captured'`), `refunds` (`2.100` filas), `events` (`65.000` filas · `9.721` anónimas con `customer_id IS NULL`).

---

## Pasos

### Paso 1 — Investigación de fuentes primarias

Se redactó [`docs/curriculo/investigacion/c1-sql-base.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/docs/curriculo/investigacion/c1-sql-base.md) tras consultar y verificar por HTTP (`200 OK`) la documentación oficial vigente (`accessed: '2026-10-29'`):

1. **DuckDB Stable Documentation — SELECT, WHERE, ORDER BY, LIMIT, Nulls, Aggregates, FILTER, CASE, Date Functions (`DATE_TRUNC`, `DATE_DIFF`):**
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
2. **PostgreSQL 17 Official Documentation — Queries, Conditional Expressions, Value Expressions y Date/Time Functions:**
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

En [`docs/curriculo/investigacion/c1-sql-base.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/docs/curriculo/investigacion/c1-sql-base.md) se definió la progresión pedagógica sin saltos para las 7 lecciones del módulo (`140 min` totales):

| Orden | ID de lección | Título | Min | Concepto nuevo que introduce | Prerrequisito |
| :--- | :--- | :--- | :---: | :--- | :--- |
| 1 | `c1-sql-base-01-select-from-where` | SELECT, FROM y WHERE: orden lógico frente a escritura | 20 | Proyección (`SELECT`), origen (`FROM`), predicado (`WHERE`), orden lógico (`FROM → WHERE → SELECT`) y precedencia `AND` vs `OR` | `c0-fundamentos-05` |
| 2 | `c1-sql-base-02-orderby-limit-distinct` | ORDER BY, LIMIT y DISTINCT: ordenar y acotar resultados | 15 | Deduplicación de tuplas proyectadas (`DISTINCT`), ordenamiento con criterio de desempate determinista (`ORDER BY`) y recorte (`LIMIT` / `OFFSET`) | `c1-sql-base-01-select-from-where` |
| 3 | `c1-sql-base-03-null-logica-coalesce` | NULL, lógica de tres valores, IS NULL y COALESCE | 20 | Lógica trivalente (`TRUE`, `FALSE`, `UNKNOWN`), `IS [NOT] NULL`, `IS NOT DISTINCT FROM`, `COALESCE` y `NULLIF` | `c1-sql-base-02-orderby-limit-distinct` |
| 4 | `c1-sql-base-04-groupby-having` | GROUP BY y HAVING: agregar filas y filtrar grupos | 25 | Cambio de grano por colapso de filas (`GROUP BY`), agregaciones (`SUM`, `AVG`, `MIN`, `MAX`, `COUNT`) y filtrado antes (`WHERE`) vs después de agrupar (`HAVING`) | `c1-sql-base-03-null-logica-coalesce` |
| 5 | `c1-sql-base-05-case-when-filter` | Expresiones condicionales con CASE WHEN y cláusula FILTER | 20 | Derivación condicional escalar (`CASE WHEN ... THEN ... ELSE ... END`), agregación condicional y cláusula estándar `FILTER (WHERE ...)` | `c1-sql-base-04-groupby-having` |
| 6 | `c1-sql-base-06-fechas-date-trunc` | Funciones de fecha y tiempo: DATE_TRUNC y DATE_DIFF | 20 | Truncado al inicio del periodo (`DATE_TRUNC`), extracción de parte (`EXTRACT`), diferencias (`DATE_DIFF`) y rangos semiabiertos `[inicio, fin)` | `c1-sql-base-05-case-when-filter` |
| 7 | `c1-sql-base-07-count-variantes` | Diferencias entre COUNT(*), COUNT(col) y COUNT(DISTINCT) | 20 | Semántica exacta de `COUNT(*)`, `COUNT(col)` y `COUNT(DISTINCT col)`, auditoría de nulos, detección de duplicados y no aditividad de `COUNT(DISTINCT)` | `c1-sql-base-06-fechas-date-trunc` |

### Paso 3 — Escritura de las 7 lecciones del módulo

Se escribieron los 7 archivos en `src/data/lessons/c1-sql-base/` cumpliendo el esquema `LessonSchema` (`contentVersion: 2`):

1. [`c1-sql-base-01-select-from-where.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/src/data/lessons/c1-sql-base/c1-sql-base-01-select-from-where.js) (`1.066` palabras visibles · `19,3` palabras/frase).
2. [`c1-sql-base-02-orderby-limit-distinct.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/src/data/lessons/c1-sql-base/c1-sql-base-02-orderby-limit-distinct.js) (`1.009` palabras visibles · `19,7` palabras/frase).
3. [`c1-sql-base-03-null-logica-coalesce.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/src/data/lessons/c1-sql-base/c1-sql-base-03-null-logica-coalesce.js) (`1.041` palabras visibles · `18,6` palabras/frase).
4. [`c1-sql-base-04-groupby-having.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/src/data/lessons/c1-sql-base/c1-sql-base-04-groupby-having.js) (`1.138` palabras visibles · `19,8` palabras/frase).
5. [`c1-sql-base-05-case-when-filter.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/src/data/lessons/c1-sql-base/c1-sql-base-05-case-when-filter.js) (`1.094` palabras visibles · `19,5` palabras/frase).
6. [`c1-sql-base-06-fechas-date-trunc.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/src/data/lessons/c1-sql-base/c1-sql-base-06-fechas-date-trunc.js) (`962` palabras visibles · `19,2` palabras/frase).
7. [`c1-sql-base-07-count-variantes.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/src/data/lessons/c1-sql-base/c1-sql-base-07-count-variantes.js) (`985` palabras visibles · `18,5` palabras/frase).

Cada lección incluye:
- `hook` contextualizado en Mercado Brisa (presentada como empresa ficticia en la primera mención del módulo), 3 `objectives` con verbos de acción, 4 `sections` con `example` SQL real + `expectedOutput` verificado, 1 `workedExample` de 3 pasos progresivos con `code` y `expectedOutput`, `roleNotes` (`de`, `da`, `bi`) de 40–80 palabras por área, 3 `checks` (combinando `mcq` y `order`), 1 `practice` SQL ejecutable (`starterCode`, `expected`, `solution`, 3 `hints`, `solutionExplanation`), 4 puntos en `summary`, 3 `flashcards`, `glossaryTerms`, 2 `sources` oficiales con fecha `2026-10-29`, `aiNotes` específicas sobre los errores más comunes de la lección y `needsReview: false`.

### Paso 4 — Consultas SQL y prácticas verificadas en DuckDB

Se verificaron todas las consultas de `sections[].example.code`, `workedExample.steps[].code`, `practice.starterCode` y `practice.solution` contra los archivos Parquet reales de `public/datasets/` tanto en Node (`@duckdb/node-api` + `compareQueryResults`) como en el navegador (`@duckdb/duckdb-wasm` en `PracticeView`):

| Lección | Filas `solution` | `starterCode` en `sqlGrader` | `solution` en `sqlGrader` | Resumen de verificación |
| :--- | :---: | :---: | :---: | :--- |
| `c1-sql-base-01-select-from-where` | 10 | `passed: false` (34 filas) | `passed: true` | `10 fila(s) y 5 columna(s) coinciden con la referencia` |
| `c1-sql-base-02-orderby-limit-distinct` | 5 | `passed: false` (10 filas) | `passed: true` | `5 fila(s) y 4 columna(s) coinciden con la referencia` |
| `c1-sql-base-03-null-logica-coalesce` | 8 | `passed: false` (0 filas) | `passed: true` | `8 fila(s) y 4 columna(s) coinciden con la referencia` |
| `c1-sql-base-04-groupby-having` | 4 | `passed: false` (14 filas) | `passed: true` | `4 fila(s) y 4 columna(s) coinciden con la referencia` |
| `c1-sql-base-05-case-when-filter` | 3 | `passed: false` (`columns_mismatch`) | `passed: true` | `3 fila(s) y 5 columna(s) coinciden con la referencia` |
| `c1-sql-base-06-fechas-date-trunc` | 4 | `passed: false` (11 filas) | `passed: true` | `4 fila(s) y 3 columna(s) coinciden con la referencia` |
| `c1-sql-base-07-count-variantes` | 4 | `passed: false` (`columns_mismatch`) | `passed: true` | `4 fila(s) y 5 columna(s) coinciden con la referencia` |

### Paso 5 — Términos de glosario del módulo

Se creó [`docs/curriculo/investigacion/c1-sql-base-glossary.json`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/docs/curriculo/investigacion/c1-sql-base-glossary.json) con 12 términos nuevos (`track: "core"`, definiciones de 20 a 60 palabras validadas con `GlossaryListSchema` de `src/data/schema/glossary.js`):
1. `orden-logico-sql` (*Orden lógico de evaluación SQL* / *Logical Query Processing Order*)
2. `proyeccion-select` (*Proyección en SELECT* / *Relational Projection*)
3. `predicado-where` (*Predicado de filtrado en WHERE* / *Filter Predicate*)
4. `deduplicacion-distinct` (*Deduplicación con DISTINCT* / *Row Deduplication*)
5. `ordenamiento-determinista` (*Ordenamiento determinista con desempate* / *Deterministic Ordering with Tie-breaker*)
6. `logica-trivalente-null` (*Lógica trivalente y marcador NULL* / *Three-Valued Logic (3VL)*)
7. `coalesce-nullif` (*Sustitución y generación de nulos (COALESCE y NULLIF)* / *COALESCE and NULLIF Expressions*)
8. `agregacion-group-by` (*Agregación y cambio de grano con GROUP BY* / *Grouping and Aggregation*)
9. `filtro-grupos-having` (*Filtrado de grupos agregados con HAVING* / *Group Filtering with HAVING*)
10. `agregacion-condicional-filter` (*Agregación condicional con CASE WHEN y FILTER* / *Conditional Aggregation*)
11. `truncado-temporal-date-trunc` (*Truncado temporal con DATE_TRUNC* / *Date/Time Truncation*)
12. `variantes-count-sql` (*Variantes de conteo: COUNT(*), COUNT(col) y COUNT(DISTINCT)* / *SQL COUNT Variants*)

### Paso 6 — Proyecto del módulo

En [`docs/curriculo/investigacion/c1-sql-base.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/docs/curriculo/investigacion/c1-sql-base.md) se documentó el proyecto **`proj-c1-sql-base`: «Diez preguntas de negocio sobre Mercado Brisa respondidas en SQL»**, con:
- Las 10 consultas verificables sobre `products`, `stores`, `orders`, `payments`, `refunds` y `events`, incluyendo el conteo exacto de filas esperadas en DuckDB y la solución de referencia para cada una.
- La rúbrica de evaluación en 4 criterios objetivos (exactitud de grano y filtrado previo, manejo seguro de `NULL` y divisiones por cero, agregación condicional y series temporales con `DATE_TRUNC` + rangos semiabiertos, y reconciliación de cardinalidades con `COUNT(*)` vs `COUNT(DISTINCT)`).

### Paso 7 — Verificación en navegador, tutor IA y scripts de calidad

Se levantó el servidor Vite en `http://127.0.0.1:5206`, se inspeccionaron las 7 lecciones y sus 7 prácticas SQL en Chromium (`1280×720`) y se evaluó cada lección contra la rúbrica de calidad del Apéndice D.2:

| # | Criterio de la rúbrica (Apéndice D.2) | Estado en las 7 lecciones (`L1`..`L7`) | Evidencia verificada |
| :---: | :--- | :---: | :--- |
| 1 | `contentVersion: 2` y `LessonSchema` válido | ✅ Cumple (7/7) | `node scripts/check-content.mjs --module c1-sql-base` → `7 válidas, 0 avisos, 0 errores`. |
| 2 | `hook` concreto con escenario de trabajo en Mercado Brisa (20–120 palabras) | ✅ Cumple (7/7) | Todos entre 52 y 66 palabras; primera mención presenta explícitamente a Mercado Brisa como empresa ficticia. |
| 3 | `objectives`: 3 objetivos claros con verbo de acción | ✅ Cumple (7/7) | 3 objetivos por lección con verbos en infinitivo (*Escribir*, *Calcular*, *Combinar*, *Ordenar*, *Diagnosticar*, *Agrupar*, *Truncar*, *Distinguir*). |
| 4 | `sections`: 3–5 secciones con `id`, `heading <= 70` chars y prosa en español claro | ✅ Cumple (7/7) | 4 secciones por lección, `heading` de 46 a 66 caracteres, con tablas markdown, bloques SQL y diagramas de flujo / tablas de verdad. |
| 5 | Longitud visible entre `600` y `1.600` palabras y media `<= 22` palabras/frase | ✅ Cumple (7/7) | Rango de `962` a `1.138` palabras visibles; media de `18,5` a `19,8` palabras/frase (`0` avisos en `check-content` y `check-copy`). |
| 6 | `workedExample` de 2–4 pasos con código ejecutable y `expectedOutput` | ✅ Cumple (7/7) | 3 pasos progresivos por lección, todos ejecutados contra `public/datasets/*.parquet` con salida real. |
| 7 | `roleNotes`: notas de aplicación para `de`, `da` y `bi` (25–80 palabras c/u) | ✅ Cumple (7/7) | Cada lección incluye las 3 perspectivas de rol con vocabulario apropiado de Nivel 1 y entre 40 y 62 palabras cada una. |
| 8 | `checks`: 2–4 comprobaciones variadas (`mcq` / `order`) con feedback por opción | ✅ Cumple (7/7) | 3 comprobaciones por lección (`mcq` y `order`) con retroalimentación específica por opción y `explanation` de 22 a 31 palabras. |
| 9 | `practice`: ejercicio SQL ejecutable donde `starterCode` falla y `solution` pasa | ✅ Cumple (7/7) | Verificado en Node (`verify_all.mjs`) y en navegador (`PracticeView` con DuckDB-Wasm): `starterPass: false` y `solutionPass: true` en las 7. |
| 10 | `summary` (3–5 puntos) y `flashcards` (2–5 tarjetas FSRS) | ✅ Cumple (7/7) | 4 puntos de síntesis y 3 flashcards por lección. |
| 11 | `sources`: mínimo 2 fuentes primarias verificadas con URL HTTP 200 y fecha | ✅ Cumple (7/7) | 2 fuentes oficiales por lección (DuckDB Stable y PostgreSQL 17, `accessed: '2026-10-29'`). |
| 12 | `aiNotes` específicas para el tutor IA y `needsReview: false` | ✅ Cumple (7/7) | `buildContextPrompt` (`server/ai/contextBuilder.js`) inyecta `aiNotes` y el contexto de sección en `< 3.400` caracteres (`verify_tutor.mjs`). |
| 13 | Cero palabras prohibidas, cero anglicismos innecesarios, cero errores de consola | ✅ Cumple (7/7) | `check-copy.mjs` → `0 hallazgos`; Playwright en las 7 lecciones y prácticas → `Console errors count: 0`. |

---

## Test

### 1. Validación de esquema y métricas (`check-content.mjs`)

```text
$ node scripts/check-content.mjs --module c1-sql-base

=== Validación de contenido v2 (check-content) ===
Archivos inspeccionados: 7
Lecciones válidas:       7
Con avisos (warnings):   0
Con errores:             0

Métricas por lección:
  ✓ c1-sql-base-01-select-from-where: 1066 palabras visibles | 19.3 palabras/frase en sections[].body
  ✓ c1-sql-base-02-orderby-limit-distinct: 1009 palabras visibles | 19.7 palabras/frase en sections[].body
  ✓ c1-sql-base-03-null-logica-coalesce: 1041 palabras visibles | 18.6 palabras/frase en sections[].body
  ✓ c1-sql-base-04-groupby-having: 1138 palabras visibles | 19.8 palabras/frase en sections[].body
  ✓ c1-sql-base-05-case-when-filter: 1094 palabras visibles | 19.5 palabras/frase en sections[].body
  ✓ c1-sql-base-06-fechas-date-trunc: 962 palabras visibles | 19.2 palabras/frase en sections[].body
  ✓ c1-sql-base-07-count-variantes: 985 palabras visibles | 18.5 palabras/frase en sections[].body
```

### 2. Validación de estilo y palabras prohibidas (`check-copy.mjs`)

```text
$ node scripts/check-copy.mjs --path src/data/lessons/c1-sql-base --path docs/curriculo/investigacion/c1-sql-base.md

✔ check-copy: 0 hallazgos en los archivos inspeccionados.
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

### 4. Validación del contexto del Tutor IA (`verify_tutor.mjs`)

```text
c1-sql-base-01-select-from-where | title: SELECT, FROM y WHERE: orden lógico frente a escritura | promptChars: 3303 | includesAiNotesKeyword: true
c1-sql-base-02-orderby-limit-distinct | title: ORDER BY, LIMIT y DISTINCT: ordenar y acotar resultados | promptChars: 3129 | includesAiNotesKeyword: true
c1-sql-base-03-null-logica-coalesce | title: NULL, lógica de tres valores, IS NULL y COALESCE | promptChars: 3156 | includesAiNotesKeyword: true
c1-sql-base-04-groupby-having | title: GROUP BY y HAVING: agregar filas y filtrar grupos | promptChars: 3158 | includesAiNotesKeyword: true
c1-sql-base-05-case-when-filter | title: Expresiones condicionales con CASE WHEN y cláusula FILTER | promptChars: 3279 | includesAiNotesKeyword: true
c1-sql-base-06-fechas-date-trunc | title: Funciones de fecha y tiempo: DATE_TRUNC y DATE_DIFF | promptChars: 3133 | includesAiNotesKeyword: true
c1-sql-base-07-count-variantes | title: Diferencias entre COUNT(*), COUNT(col) y COUNT(DISTINCT) | promptChars: 3081 | includesAiNotesKeyword: true
ALL 7 LESSONS TUTOR CONTEXT VERIFIED!
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

✓ built in 7.12s (0 errors)
```

---

## Revisión propia

Durante la redacción y validación se detectaron y corrigieron **6 defectos propios**:

1. **[`c1-sql-base-03-null-logica-coalesce.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c1-sql-base/src/data/lessons/c1-sql-base/c1-sql-base-03-null-logica-coalesce.js#L35-L40) — Espacio accidental en `sections[1].id` y `checks[1].explanation` con menos de 20 palabras:**
   - **Antes:** `id: 'is-null- e-is-distinct-from'` (fallaba la expresión regular `kebab-case`) y `checks[1].explanation` tenía 17 palabras (mínimo exigido por `LessonSchema`: 20).
   - **Después:** Se corrigió a `id: 'is-null-e-is-distinct-from'` y se amplió `checks[1].explanation` a 25 palabras detallando cómo `COALESCE` evalúa de izquierda a derecha.
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

Se ejecutaron **6 pruebas adversariales** sobre el módulo `c1-sql-base`:

1. **Consulta SQL de 10 líneas con múltiples condiciones y expresiones en el editor (`1280×720`):**
   - Se cargó y ejecutó la solución de 10 líneas de `c1-sql-base-01-select-from-where` y `c1-sql-base-07-count-variantes` en `SqlLab`. El editor CodeMirror mantiene numeración tabular, resaltado sintáctico y scroll interno limpio sin empujar ni desbordar la tabla de resultados (`W-c1-sql-base_c1-sql-base-01-select-from-where_practica_1280x720_light.png`).
2. **Consulta SQL con error de sintaxis deliberado en modo oscuro (`1280×720`):**
   - Se introdujo `SELECT channel, COUNT(DISTINCT) FROM orders GROUP BY channel;` en `c1-sql-base-07-count-variantes` y se pulsó `Ejecutar consulta`. DuckDB-Wasm capturó la excepción sin romper el árbol React, mostrando el bloque `[data-testid="sql-error-box"]` con `Parser Error: syntax error at or near ")"` y el botón `Explícame este error` que abre el tutor en modo `explain-error` (`W-c1-sql-base_c1-sql-base-07-count-variantes_error_1280x720_dark.png`).
3. **Ventana `1280×720` con el panel del Tutor IA abierto simultáneamente (`W-c1-sql-base_c1-sql-base-04-groupby-having_tutor_1280x720_light.png`):**
   - Al abrir el Tutor con `/` en `c1-sql-base-04-groupby-having` a `1280×720`, `LessonPlayer` detecta que `viewportWidth < 1600` con `isTutorOpen = true` y colapsa automáticamente el temario izquierdo dentro del botón `Temario T`, preservando el ancho de lectura de `65ch` sin solapamiento ni scroll horizontal.
4. **Cambio de tema claro (`#FAF9F5`) ↔ oscuro (`#11100E`) en caliente:**
   - Se verificó `c1-sql-base-01-select-from-where` en ambos temas (`W-c1-sql-base_c1-sql-base-01-select-from-where_cabecera_1280x720_light.png` y `W-c1-sql-base_c1-sql-base-01-select-from-where_cabecera_1280x720_dark.png`). Todos los bloques de código, tablas, píldoras e insignias usan variables semánticas de `src/styles/tokens.css` sin colores hexadecimales fijos.
5. **Respuestas erróneas deliberadas al Tutor IA en las 7 lecciones (`verify_tutor.mjs`):**
   - Para cada una de las 7 lecciones se simuló una respuesta equivocada típica al caso práctico de la lección (p. ej., mezclar `OR` y `AND` sin paréntesis en L1, usar `WHERE campaign_id != 3` esperando incluir `NULL` en L3, filtrar `WHERE SUM(total_usd) > 50000` en L4, escribir `COUNT(CASE WHEN ... ELSE 0 END)` en L5, agrupar por `EXTRACT(MONTH ...)` mezclando años en L6 y usar `COUNT(campaign_id)` para contar nulos en L7). En las 7 lecciones `buildContextPrompt` inyectó las `aiNotes` específicas del error y mantuvo el prompt total entre `3.081` y `3.303` caracteres (`< 24.000`).
6. **Navegación con `prefers-reduced-motion: reduce` y comprobaciones de tipo `order` (`LessonCheckCard`):**
   - Se verificó que los ítems de las comprobaciones de tipo `order` (`items: string[]`, `correctOrder: ['it-1', 'it-2', 'it-0']`) se reordenan con los botones `↑`/`↓` y validan la secuencia lógica (`FROM → WHERE → SELECT`, `FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY`) sin animaciones bruscas ni errores de consola.

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
   - En `src/views/LessonPlayer.jsx` (línea 1070), el bloque de práctica solo monta `<AuthenticCodeLab>` cuando `codeLabChallenge.blanks?.length > 0`; para lecciones con `practice.type === 'sql'` (que se evalúan en DuckDB-Wasm sin `blanks`), `LessonPlayer` muestra actualmente la tarjeta estática `.lp-custom-practice-card` mientras que `PracticeView` sí monta `<AuthenticCodeLab>` → `<LazySqlLab>`. Si en `LessonPlayer.jsx` se cambia la condición para montar también `<AuthenticCodeLab lessonId={lessonId} practice={lesson.practice} onSolve={handleSolvePracticeLab} />` cuando `lesson.practice?.type === 'sql'`, el laboratorio DuckDB-Wasm aparecerá también incrustado directamente dentro de la lectura de la lección.
   - En `src/App.jsx` (línea 199), `<PracticeView initialLessonId={activeLessonId} onSelectLesson={openLesson} />` pasa `openLesson` como `onSelectLesson`; dado que `openLesson` cambia `viewMode` a `'lesson'`, hacer clic en un ejercicio de la lista lateral de `PracticeView` navega hacia la vista de lectura en lugar de permanecer en `PracticeView`.

---

## Pendiente

Ninguno.
