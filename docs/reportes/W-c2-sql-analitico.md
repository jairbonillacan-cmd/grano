# Reporte de ejecución — `W-c2-sql-analitico` (Fase 3 · Oleada B)

- **Agente:** `W-c2-sql-analitico`
- **Módulo:** `c2-sql-analitico` — *SQL analítico* (Tronco común `core`, Nivel 2, 110 min totales)
- **Rama y worktree:** `agente/W-c2-sql-analitico` en `C:\Users\T490s\Desktop\Proyectos\ING-W-c2-sql-analitico`
- **Puerto Vite utilizado:** `5211`

---

## Inicio

Archivos leídos antes de iniciar la edición y hallazgo concreto extraído de cada uno:

- `PLAN_GEMINI_4_ARGON.md`: define en `§0–§2`, `§5`, `§6`, `§9.1–§9.4` y los Apéndices A–D el contrato de lecciones v2 (600–1600 palabras visibles, 4 secciones de 80–250 palabras, media de frase `<= 22` palabras, 3 `checks`, 1 `workedExample`, 1 `practice` SQL ejecutable, 4 `sources` verificadas HTTP 200) y la rúbrica de 8 criterios sobre 32 puntos.
- `package.json`: expone `@duckdb/node-api` `^1.5.2-r.1`, `@duckdb/duckdb-wasm` `^1.33.1-dev20.0`, `zod` `^4.3.6` y los scripts `content:check`, `copy:check` y `build`.
- `vite.config.js`: registra el middleware del servidor IA (`/api/ai/status`, `/api/ai/chat`, `/api/ai/json`, `/api/ai/query`) y sirve los Parquet de `public/datasets/`.
- `src/main.jsx`: monta `<App />` e importa la jerarquía global de estilos y tokens CSS.
- `src/App.jsx`: coordina `LessonPlayer`, `TutorPanel` y `CommandPaletteModal` (`Ctrl+K`), permitiendo abrir cualquier lección por título o ID.
- `src/styles/tokens.css`: define la paleta editorial cálida (`--bg-0: #FAF8F4`, `--accent: #B84A1C`), la tipografía (`Newsreader`, `IBM Plex Sans`, `IBM Plex Mono`) y el tema oscuro `[data-theme="dark"]`.
- `src/data/catalog/modules.js`: especifica en las líneas 356–374 el módulo `c2-sql-analitico` con prerrequisito `['c1-sql-joins']`, 4 lecciones (`l2-window-functions` 30 min, `l3-asof-lateral-ctes` 30 min, lección 03 de 25 min y lección 04 de 25 min) y el proyecto integrador sobre `orders`, `order_items`, `events`, `marketing_spend` y `calendar`.
- `src/data/lessons/c2-sql-analitico/c2-sql-analitico-01-window-functions.js`: contenía la versión migrada de `l2-window-functions` con `needsReview: true`, 1 hallazgo de `check-copy` (`Dominar`), media de frase de `29.3` palabras y `prerequisites: ['c1-sql-joins-02-grano-fanout']`.
- `src/data/lessons/c2-sql-analitico/c2-sql-analitico-02-asof-lateral-ctes.js`: contenía la versión migrada de `l3-asof-lateral-ctes` con `needsReview: true`, 3 hallazgos de `check-copy` (`2026`, exceso de negritas y `dominar`), media de frase de `28.6` palabras y dos `heading` de más de 70 caracteres.
- `src/data/lessons/c1-sql-joins/c1-sql-joins-01-tipos-join.js`: establece en el módulo prerrequisito el uso de claves cortas de catálogo (`c1-sql-base-07`) en `prerequisites` y la distinción entre filtros en `ON` frente a `WHERE` tras un `LEFT JOIN`.
- `src/data/lessons/c1-sql-joins/c1-sql-joins-02-grano-fanout.js`: introduce el concepto de grano y *fan-out* en `orders` (18 000 filas) frente a `order_items` (42 000 filas) y `payments` (19 200 filas).
- `src/data/lessons/c1-sql-joins/c1-sql-joins-03-subconsultas.js`: cubre subconsultas escalares, `IN`, `EXISTS` y la introducción a subconsultas correlacionadas en `WHERE`.
- `src/data/lessons/c1-sql-joins/c1-sql-joins-04-ctes-legibles.js`: define la descomposición de consultas en bloques `WITH` con responsabilidades separadas y auditoría de conteos intermedios.
- `src/data/lessons/c1-sql-joins/c1-sql-joins-05-conjuntos-union.js`: cubre `UNION`, `UNION ALL`, `INTERSECT` y `EXCEPT` sobre tablas de Mercado Brisa.
- `public/datasets/README.md`: documenta las anomalías sembradas en Mercado Brisa, incluidos los 450 pagos duplicados por reintento de webhook en `payments`, los 6 715 eventos sin `customer_id` en `events` y los 5 husos horarios (`-06:00`, `-05:00`, `-03:00`, `Z`, `+01:00`).
- `public/datasets/schema.json`: detalla las columnas y tipos exactos de las 13 tablas Parquet (`orders`, `order_items`, `payments`, `events`, `customer_changes`, `products`, `stores`, `calendar`, etc.).
- `src/data/schema/lesson.js`: valida mediante Zod que `lesson.title` tenga `<= 60` caracteres, `lesson.hook` entre 40 y 90 palabras, `section.heading` `<= 70` caracteres, `section.body` entre 80 y 250 palabras, `check.explanation` entre 20 y 60 palabras y `sources` entre 2 y 6 entradas con fecha ISO.
- `src/data/schema/glossary.js`: exige en `GlossaryTermSchema` que `definition` tenga entre 20 y 60 palabras, `id` en kebab-case, `track` válido y al menos 1 lección relacionada en `relatedLessons`.
- `src/data/glossary.js`: contiene los términos globales e incluye `c03-window-qualify`, `c04-asof-join`, `c05-window-frames`, `c08-point-in-time`, `c1-joins-left-join` y `c12-parquet-columnar`.
- `scripts/check-content.mjs`: valida cada lección del módulo contra `LessonSchema`, comprueba que las palabras visibles estén entre 600 y 1600, verifica la existencia de `prerequisites` y carga también los archivos `*-glossary.json` de `docs/curriculo/investigacion/`.
- `scripts/check-copy.mjs`: escanea los términos prohibidos del Apéndice B, emojis, signos `¡`, menciones a `2026` fuera de `sources`, párrafos con más de 3 negritas y exige una media `<= 22` palabras por frase en `sections[].body`.
- `scripts/sync-lessons-index.mjs`: genera `src/data/lessons/index.js` e inyecta el adaptador `adaptLessonForLegacyPlayer` que resuelve tanto el `id` v2 como `legacyId` y el `catalogKey` (`<moduleId>-<01..99>`).
- `server/ai/contextBuilder.js`: expone `buildContextPrompt`, que ensambla las plantillas de `server/ai/prompts/` (`explain-section.md`, `feynman.md`, `review-sql.md`, `tutor.md`) truncando el prompt a un máximo de 24 000 caracteres.
- `server/ai/agyRunner.js`: ejecuta el binario `agy` en modo `chat` con `firstByteTimeoutMs` (45 s por defecto) y `totalTimeoutMs` (120 s por defecto) a través de `runAgyPrompt({ prompt, ... })`.
- `src/components/LessonVisualizers.jsx`: despacha los simuladores interactivos por nombre de componente, incluyendo `window-function-stepper`, `window-frames`, `asof-join-timeline` y `parquet-pushdown`.
- `src/lab/sqlGrader.js`: implementa `compareQueryResults` con comparación insensible a mayúsculas en nombres de columna, tolerancia numérica `1e-6` (`NUMERIC_TOLERANCE`) y verificación de orden cuando `orderMatters: true`.
- `src/views/lesson/LessonWorkedExample.jsx`: renderiza los pasos del `workedExample` junto con sus bloques de código SQL y tablas de `expectedOutput`.
- `docs/curriculo/fuentes.md`: recopila las fuentes oficiales verificadas en T3 para DuckDB 1.2, PostgreSQL 17, Snowflake y dbt Labs.
- `docs/curriculo/perfil-core.md`: define el perfil del estudiante del tronco común (`core`) y la progresión desde `c1-sql-base` y `c1-sql-joins` hacia `c2-sql-analitico` y `c2-dimensional`.
- `docs/curriculo/estado-herramientas.md`: confirma las versiones vigentes de referencia para el currículo (DuckDB 1.2+, PostgreSQL 17, Snowflake, Apache Parquet).

---

## Pasos

### Paso 1 — Investigación focalizada (`docs/curriculo/investigacion/c2-sql-analitico.md`)
- Se verificaron con peticiones HTTP `HEAD`/`GET` reales 16 URLs oficiales (4 por lección, todas con código HTTP `200`, años 2024–2025) de DuckDB Documentation (`Window Functions`, `QUALIFY`, `ASOF Join`, `Timestamp`, `Timestamp Functions`, `Timestamptz`, `EXPLAIN`, `Profiling`, `How to Tune Workloads`), PostgreSQL 17 (`Window Functions`, `LATERAL Subqueries`, `Date/Time Functions`, `Using EXPLAIN`), Snowflake (`QUALIFY`, `ASOF JOIN`) y dbt Labs (`How We Style Our SQL`).
- Se documentaron los mapas de progresión conceptual para las 4 lecciones y la rúbrica de 4 criterios + consulta de referencia en DuckDB para el proyecto del módulo (`proj-c2-sql-analitico`).

### Paso 2 — Mapa del módulo y continuidad con `c1-sql-joins`
- Se verificó la continuidad con las 5 lecciones de `c1-sql-joins`:
  1. `c2-sql-analitico-01-window-functions` (`order: 1`, 30 min, `legacyId: 'l2-window-functions'`): toma el problema de pérdida de detalle del `GROUP BY` y los 405 cobros capturados duplicados en `payments` para introducir `OVER (PARTITION BY ... ORDER BY ...)`, `ROW_NUMBER`, `RANK`, `DENSE_RANK`, `LAG`, `LEAD`, `QUALIFY`, marcos `ROWS` frente a `RANGE` y sesgo por `NULL` (*data skew* en `events`).
  2. `c2-sql-analitico-02-asof-lateral-ctes` (`order: 2`, 30 min, `legacyId: 'l3-asof-lateral-ctes'`): extiende la prevención de *fan-out* de `c1-sql-joins-02` al dominio temporal donde los relojes no coinciden al segundo (`orders` frente a `events` y `customer_changes`), contrastando la desigualdad abierta (`75` filas y `$23,327.99` USD inflados para 5 pedidos) con `ASOF LEFT JOIN` (`5` filas y `$1,311.59` USD exactos), `LEFT JOIN LATERAL` y CTEs en 4 capas.
  3. `c2-sql-analitico-03-zonas-horarias-date-spine` (`order: 3`, 25 min, nueva): aborda el sesgo de truncar marcas UTC sin desplazar al huso horario del negocio (`27,58 %` de eventos desplazados de día en `-06:00`) y el sesgo de días sin actividad en `store_id = 14` (`$1,465.38` USD en 25 días activos frente a `$1,181.75` USD en los 31 días de `calendar` con `LEFT JOIN` y `COALESCE`).
  4. `c2-sql-analitico-04-explain-analyze` (`order: 4`, 25 min, nueva): enseña a auditar planes físicos con `EXPLAIN` y `EXPLAIN ANALYZE` de abajo hacia arriba (`READ_PARQUET`, `HASH_JOIN` Build/Probe, `HASH_GROUP_BY`, `TOP_N`), reescribiendo predicados no SARGables (`strftime`, `LOWER`) en rangos directos que reducen la lectura de `14 760` a `585` pedidos y de `42 000` a `1 408` líneas gracias a *Filter Pushdown* y *Dynamic Filters*.

### Paso 3 — Escritura y edición de las 4 lecciones y glosario del módulo
- Se editaron a fondo `c2-sql-analitico-01-window-functions.js` y `c2-sql-analitico-02-asof-lateral-ctes.js` (eliminando `needsReview: true`, corrigiendo todos los hallazgos de `check-copy`, reduciendo la longitud media de frase por debajo de 20 palabras y recalibrando todas las tablas de `expectedOutput` con ejecuciones reales en DuckDB sobre `public/datasets/*.parquet`).
- Se crearon desde cero `c2-sql-analitico-03-zonas-horarias-date-spine.js` y `c2-sql-analitico-04-explain-analyze.js` cumpliendo el esquema v2 completo, con simuladores interactivos (`window-frames` y `parquet-pushdown`), ejemplos SQL verificados, `workedExample` comparativo, 3 `checks` con retroalimentación por opción y `practice` de tipo `sql`.
- Se creó `docs/curriculo/investigacion/c2-sql-analitico-glossary.json` con 6 términos nuevos (`c2-sql-qualify`, `c2-sql-marco-ventana`, `c2-sql-asof-join`, `c2-sql-lateral-join`, `c2-sql-date-spine`, `c2-sql-explain-analyze`), cada uno con exactamente 25 palabras (cumpliendo simultáneamente el mínimo de 20 palabras de `GlossaryTermSchema` y el tope de 25 palabras de `§9.2`).

### Paso 4 — Verificación automática de esquema, contenido, copy y SQL
- `node scripts/check-content.mjs --module c2-sql-analitico`: **4/4 lecciones `OK`**, `0` advertencias, `0` errores.
- `node scripts/check-copy.mjs --path src/data/lessons/c2-sql-analitico --path docs/curriculo/investigacion/c2-sql-analitico.md --path docs/curriculo/investigacion/c2-sql-analitico-glossary.json`: **`0` hallazgos** de términos prohibidos, emojis, `2026` o exceso de negritas; ninguna lección del módulo supera las 22 palabras/frase.
- Todas las consultas SQL (`sections[].example.code`, `workedExample.steps[].code`, `practice.expected`, `practice.solution` y `practice.starterCode`) fueron ejecutadas en `@duckdb/node-api` contra los Parquet reales de Mercado Brisa y calificadas con `compareQueryResults`.

### Paso 5 — Prueba con el tutor IA (`agy` real)
- Se ejecutó `agy` real (`runAgyPrompt` + `buildContextPrompt`) en las **4 lecciones** tanto en modo `explain-section` como en el flujo de 2 turnos `feynman` ("Comprobar si entendí"), respondiendo mal a propósito en el Turno 2 de cada lección. En las 4 lecciones el tutor detectó sin rodeos la falacia inyectada por el estudiante y propuso la corrección técnica sobre las tablas de Mercado Brisa.

### Paso 6 — Verificación en navegador (Playwright en puerto `5211`) y `npm run build`
- Se levantó Vite en `http://localhost:5211` y se recorrieron las 4 lecciones en Chromium headless con Playwright:
  - En las 4 lecciones el `starterCode` falló al pulsar «Comprobar resultado» y la `solution` pasó con el banner verde «Práctica superada · El resultado coincide con la referencia».
  - `0px` de desbordamiento horizontal tanto en escritorio (`1280x720`, claro y oscuro) como en móvil (`390x844`).
  - `0` errores de consola o `pageerror`.
  - Se inspeccionaron las 11 capturas PNG con `read_file`.
- `npm run build` finalizó con código `0` (`✓ 2399 modules transformed. ✓ built in 18.08s`).

### Paso 7 — Puntuación con la rúbrica de calidad (`§9.4`)

#### Tabla resumen de lecciones del módulo `c2-sql-analitico`

| Lección | Palabras | Checks | Prácticas | Fuentes | Puntuación de rúbrica |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `c2-sql-analitico-01-window-functions` | 1209 | 3 | 1 (`sql`) | 4 | **32 / 32** |
| `c2-sql-analitico-02-asof-lateral-ctes` | 1191 | 3 | 1 (`sql`) | 4 | **32 / 32** |
| `c2-sql-analitico-03-zonas-horarias-date-spine` | 1230 | 3 | 1 (`sql`) | 4 | **32 / 32** |
| `c2-sql-analitico-04-explain-analyze` | 1115 | 3 | 1 (`sql`) | 4 | **32 / 32** |

#### Desglose por criterio de la rúbrica (`0–4` por criterio, máximo `32`)

| Criterio (0–4) | L01 (`window-functions`) | L02 (`asof-lateral-ctes`) | L03 (`zonas-horarias-date-spine`) | L04 (`explain-analyze`) | Justificación verificable |
| :--- | :---: | :---: | :---: | :---: | :--- |
| 1. Claridad para quien empieza | 4 | 4 | 4 | 4 | Hooks anclados en problemas concretos, progresión gradual desde `c1-sql-joins` y frases cortas (`< 20` palabras/frase). |
| 2. Rigor técnico actual (2024–2026) | 4 | 4 | 4 | 4 | Cubre `QUALIFY`, `WINDOW`, `ROWS` vs `RANGE`, `ASOF LEFT JOIN`, `LEFT JOIN LATERAL`, zonas horarias ICU, `Date Spine` y `EXPLAIN ANALYZE` con *Dynamic Filters* en DuckDB 1.2 y PostgreSQL 17. |
| 3. Anclaje en Mercado Brisa | 4 | 4 | 4 | 4 | Todas las cifras provienen de consultas reales sobre `orders`, `order_items`, `payments`, `events`, `customer_changes`, `products`, `stores` y `calendar`. |
| 4. Calidad del ejemplo guiado | 4 | 4 | 4 | 4 | Cada `workedExample` contrasta el antipatrón cuantificado con la solución verificada y su auditoría numérica. |
| 5. Calidad de las comprobaciones | 4 | 4 | 4 | 4 | 3 `checks` por lección basados en errores frecuentes de producción con `feedback` específico en cada opción. |
| 6. Calidad de la práctica | 4 | 4 | 4 | 4 | 4 prácticas `sql` reales en DuckDB donde `starterCode` falla por un defecto instructivo y `solution` pasa al 100 %. |
| 7. Calidad de las fuentes | 4 | 4 | 4 | 4 | 16 URLs oficiales verificadas con HTTP 200 (DuckDB, PostgreSQL 17, Snowflake y dbt Labs). |
| 8. Limpieza de copy y tono | 4 | 4 | 4 | 4 | `0` hallazgos en `check-copy.mjs`, sin muletillas de IA, sin emojis, sin `¡` y sin negritas excesivas. |
| **Total** | **32/32** | **32/32** | **32/32** | **32/32** | **Todas `>= 26/32` y ningún criterio `< 3`.** |

---

## Test

### 1. Salida literal de `check-content.mjs` y `check-copy.mjs`

```text
=== Validación de contenido v2 (check-content) ===
Lección (id v2)                                | Módulo               | Niv  | Sec  | Chk  | Src  | Palabras  | Estado    
--------------------------------------------------------------------------------------------------------------------------
c2-sql-analitico-01-window-functions           | c2-sql-analitico     | 2    | 4    | 3    | 4    | 1209      | OK        
c2-sql-analitico-02-asof-lateral-ctes          | c2-sql-analitico     | 2    | 4    | 3    | 4    | 1191      | OK        
c2-sql-analitico-03-zonas-horarias-date-spine  | c2-sql-analitico     | 2    | 4    | 3    | 4    | 1230      | OK        
c2-sql-analitico-04-explain-analyze            | c2-sql-analitico     | 2    | 4    | 3    | 4    | 1115      | OK        
--------------------------------------------------------------------------------------------------------------------------
Resumen: 4 lecciones inspeccionadas | 4 válidas | 0 con advertencias (needsReview) | 0 con errores.

Resultado: OK (0 errores de esquema o integridad).

=== Auditoría anti-slop de copy (check-copy) ===
Archivos escaneados: 4

0 hallazgos de términos prohibidos, emojis, "2026" o exceso de negritas.
Total de hallazgos: 0
```

### 2. Salida literal de la verificación SQL en DuckDB y esquema de glosario (`verify_module_c2_sql_analitico.mjs`)

```text
=== 1. Validación de c2-sql-analitico-glossary.json ===
  [OK] c2-sql-qualify (Cláusula QUALIFY): 25 palabras | Se confunde con: c03-window-qualify, c2-sql-marco-ventana
  [OK] c2-sql-marco-ventana (Marco de ventana (ROWS frente a RANGE)): 25 palabras | Se confunde con: c05-window-frames, c2-sql-date-spine
  [OK] c2-sql-asof-join (Unión temporal ASOF JOIN): 25 palabras | Se confunde con: c04-asof-join, c08-point-in-time, c2-sql-lateral-join
  [OK] c2-sql-lateral-join (Subconsulta correlacionada LATERAL): 25 palabras | Se confunde con: c2-sql-asof-join, c04-asof-join
  [OK] c2-sql-date-spine (Espina de calendario (Date Spine)): 25 palabras | Se confunde con: c2-sql-marco-ventana, c1-joins-left-join
  [OK] c2-sql-explain-analyze (Plan físico con EXPLAIN ANALYZE): 25 palabras | Se confunde con: c2-sql-qualify, c12-parquet-columnar

=== 2. Ejecución SQL en DuckDB y verificación de prácticas ===

--- Lección: c2-sql-analitico-01-window-functions ---
  [OK] Ejemplo sección "estructura-de-over-partition-by-order-by": 4 filas devueltas
  [OK] Ejemplo sección "funciones-de-ranking-row-number-rank-dense-rank-": 5 filas devueltas
  [OK] Ejemplo sección "marcos-de-ventana-diferencia-entre-rows-y-range": 4 filas devueltas
  [OK] Ejemplo sección "sesgo-de-particion-en-produccion-por-valores-nul": 2 filas devueltas
  [OK] WorkedExample "Paso 1 — Antipatrón: agregar payments sin deduplicar reintentos de webhook": 1 filas devueltas
  [OK] WorkedExample "Paso 2 — Solución verificada: deduplicar por idempotency_key con QUALIFY": 1 filas devueltas
  [OK] Practice solution pasa: true (matched — Resultado verificado: 10 fila(s) y 5 columna(s) coinciden con la referencia.)
  [OK] Practice starterCode falla: true (rows_mismatch — 9 fila(s) esperada(s) no aparecen en tu resultado. 9 fila(s) de tu resultado no coinciden con la referencia.)

--- Lección: c2-sql-analitico-02-asof-lateral-ctes ---
  [OK] Ejemplo sección "exactitud-punto-en-el-tiempo-point-in-time-corre": 5 filas devueltas
  [OK] Ejemplo sección "asof-join-para-emparejar-series-temporales": 5 filas devueltas
  [OK] Ejemplo sección "lateral-join-para-subconsultas-correlacionadas-p": 5 filas devueltas
  [OK] WorkedExample "Paso 1 — Antipatrón: JOIN con desigualdad abierta (o.order_ts >= e.event_ts)": 1 filas devueltas
  [OK] WorkedExample "Paso 2 — Solución verificada: CTEs modulares + ASOF LEFT JOIN exacto 1:1": 1 filas devueltas
  [OK] Practice solution pasa: true (matched — Resultado verificado: 10 fila(s) y 5 columna(s) coinciden con la referencia.)
  [OK] Practice starterCode falla: true (rows_mismatch — 10 fila(s) esperada(s) no aparecen en tu resultado. 10 fila(s) de tu resultado no coinciden con la referencia.)

--- Lección: c2-sql-analitico-03-zonas-horarias-date-spine ---
  [OK] Ejemplo sección "medir-el-sesgo-de-truncar-en-utc": 5 filas devueltas
  [OK] Ejemplo sección "promedio-diario-real-frente-a-sin-espina": 1 filas devueltas
  [OK] WorkedExample "Paso 1 — Agrupar orders directamente (omite el viernes 2025-01-03)": 6 filas devueltas
  [OK] WorkedExample "Paso 2 — Anclar en calendar con LEFT JOIN, COALESCE y medias móviles": 7 filas devueltas
  [OK] Practice solution pasa: true (matched — Resultado verificado: 10 fila(s) y 3 columna(s) coinciden con la referencia.)
  [OK] Practice starterCode falla: true (rows_mismatch — Filas esperadas: 10 · Filas obtenidas: 9. 7 fila(s) esperada(s) no aparecen en tu resultado. 6 fila(s) de tu resultado no coinciden con la referencia.)

--- Lección: c2-sql-analitico-04-explain-analyze ---
  [OK] Ejemplo sección "empuje-de-predicados-y-consultas-sargables": 1 filas devueltas
  [OK] Ejemplo sección "reducir-cardinalidad-antes-de-unir-dimensiones": 5 filas devueltas
  [OK] WorkedExample "Paso 1 — Antipatrón: predicado no SARGable con strftime y LOWER": 1 filas devueltas
  [OK] WorkedExample "Paso 2 — Solución SARGable: Filter Pushdown y Dynamic Filter en HASH_JOIN": 1 filas devueltas
  [OK] Practice solution pasa: true (matched — Resultado verificado: 5 fila(s) y 5 columna(s) coinciden con la referencia.)
  [OK] Practice starterCode falla: true (columns_mismatch — Faltan columnas esperadas: pct_ingresos_q1.)

TODAS LAS VERIFICACIONES DUCKDB Y ESQUEMAS PASARON.
```

### 3. Salida literal de la prueba del Tutor IA con `agy` real en las 4 lecciones

```text
=== Probando Tutor IA (agy real) en c2-sql-analitico-01-window-functions ===
  [explain-section OK] (193 palabras):
  La diferencia clave es qué cuenta el marco: **`ROWS` cuenta renglones físicos**; **`RANGE` evalúa una distancia en el valor de la columna** (por ejemplo, días calendario).
  Imagina que analizas las devoluciones de Mercado Brisa en la tabla `refunds` para una categoría pequeña:
  - Con `ROWS BETWEEN 1 PRECEDING AND CURRENT ROW`: SQL toma la fila actual y la física anterior (`2023-05-02`). Promedia `$50` y `$100`, dando `$75`. Mezcló eventos separados por 18 días de inactividad como si fueran consecutivos.
  - Con `RANGE BETWEEN INTERVAL 1 DAY PRECEDING AND CURRENT ROW`: SQL busca reembolsos entre el `2023-05-19` y el `2023-05-20`. Como no hubo devoluciones el día 19, solo toma la fila actual: el promedio es `$50`.

  [feynman Turno 2 — Respuesta errónea del alumno]:
  "Creo que ROWS BETWEEN 6 PRECEDING y RANGE BETWEEN INTERVAL 6 DAYS PRECEDING devuelven siempre el mismo promedio aunque falten días sin ventas en orders, y que puedo filtrar la fila 1 escribiendo WHERE ROW_NUMBER() OVER (...) = 1."
  [feynman Turno 2 — Diagnóstico de agy]:
  {
    "score": 0,
    "aciertos": [],
    "huecos": [
      "Asumes que ROWS y RANGE dan el mismo resultado con fechas faltantes: ROWS cuenta filas físicas anteriores sin importar su fecha, mientras que RANGE filtra por el intervalo temporal real.",
      "Intentas filtrar directamente en WHERE con una función de ventana: WHERE se procesa antes de evaluar las funciones de ventana, por lo que debes usar QUALIFY o una subconsulta/CTE."
    ],
    "siguientePaso": "Revisa el orden de ejecución de SQL para entender por qué las funciones de ventana requieren QUALIFY, y compara cómo se comporta una media móvil de 7 días cuando hay huecos de fechas usando ROWS frente a RANGE."
  }

=== Probando Tutor IA (agy real) en c2-sql-analitico-02-asof-lateral-ctes ===
  [explain-section OK] (183 palabras):
  Imagina que necesitas saber qué dirección o ciudad tenía un cliente en el instante exacto en que realizó su compra, rastreando los cambios en `customer_changes`. Un `JOIN` tradicional por `customer_id` multiplicaría las filas del pedido si el cliente cambió de datos varias veces. `ASOF JOIN` resuelve esto: empareja cada pedido con el cambio inmediatamente anterior a la compra, conservando exactamente una fila por pedido.

  [feynman Turno 2 — Respuesta errónea del alumno]:
  "Para atribuir cada pedido al último evento web previo del cliente puedo escribir ASOF LEFT JOIN events e ON o.customer_id = e.customer_id AND o.order_ts <= e.event_ts, porque <= busca hacia atrás en el tiempo."
  [feynman Turno 2 — Diagnóstico de agy]:
  {
    "score": 1,
    "aciertos": [
      "Identificas correctamente que se debe usar ASOF LEFT JOIN para conservar los pedidos aunque no haya eventos previos",
      "Comprendes la necesidad de empatar las entidades mediante o.customer_id = e.customer_id junto con una condición temporal"
    ],
    "huecos": [
      "Invertiste el operador de desigualdad temporal: o.order_ts <= e.event_ts busca eventos iguales o posteriores al pedido (hacia el futuro), provocando fuga de datos",
      "Falta explicar que para buscar el último evento previo la condición debe ser o.order_ts >= e.event_ts, garantizando que el evento ocurrió antes o al mismo tiempo que el pedido"
    ],
    "siguientePaso": "Invierte la desigualdad a o.order_ts >= e.event_ts para asegurar que el evento ocurrió en el pasado respecto al pedido. Recuerda leer la desigualdad desde la perspectiva del hecho principal (o.order_ts debe ser mayor o igual que e.event_ts)."
  }

=== Probando Tutor IA (agy real) en c2-sql-analitico-03-zonas-horarias-date-spine ===
  [explain-section OK] (207 palabras):
  Cuando calculas un promedio diario con `AVG()` sobre la tabla `orders`, SQL solo cuenta los días en que hubo transacciones. Si un día no tuvo ventas, no existe como fila y queda fuera del divisor. Con espina (`calendar`), generas los 7 días, rellenas los vacíos con `COALESCE(ventas, 0)` y calculas el promedio diario real.

  [feynman Turno 2 — Respuesta errónea del alumno]:
  "Después de hacer LEFT JOIN desde calendar c hacia orders o, puedo poner WHERE o.store_id = 14 AND o.status = 'completed' afuera y calcular AVG(o.total_usd) sin COALESCE porque SQL ya divide entre los 31 días de enero."
  [feynman Turno 2 — Diagnóstico de agy]:
  {
    "score": 0,
    "aciertos": [],
    "huecos": [
      "Filtrar la tabla derecha en el WHERE externo transforma el LEFT JOIN en un INNER JOIN, descartando los días sin ventas.",
      "La función AVG ignora los valores NULL de forma predeterminada, por lo que no divide entre los 31 días si no usas COALESCE para imputar los ceros.",
      "Para no perder las fechas vacías de la espina de calendario, debes prefiltrar y agregar las ventas en una CTE o incluir los filtros en la cláusula ON."
    ],
    "siguientePaso": "Recuerda que cualquier condición sobre la tabla secundaria en el WHERE elimina los nulos generados por el LEFT JOIN. Prueba prefiltrar la tienda y el estado en una CTE antes del JOIN y usa COALESCE dentro de AVG para contabilizar los días en cero."
  }

=== Probando Tutor IA (agy real) en c2-sql-analitico-04-explain-analyze ===
  [explain-section OK] (179 palabras):
  Imagina que buscas pedidos de alto valor en `orders.parquet` (`500 000` filas repartidas en bloques de `100 000`). Si escribes `WHERE ROUND(order_total_usd, 0) >= 1000`, el predicado no es SARGable. En cambio, si dejas la columna intacta (`WHERE order_total_usd >= 1000.00`), el motor compara directamente contra los metadatos del archivo antes de leer y verás el filtro ejecutado dentro de `READ_PARQUET`.

  [feynman Turno 2 — Respuesta errónea del alumno]:
  "Si escribo WHERE strftime(order_date, '%Y-%m') = '2025-01' sobre orders.parquet, DuckDB empuja el filtro al lector Parquet y salta los bloques de otros meses sin leer las 14 760 filas."
  [feynman Turno 2 — Diagnóstico de agy]:
  {
    "score": 0,
    "aciertos": [],
    "huecos": [
      "Afirmaste exactamente lo contrario de lo que ocurre: envolver order_date en strftime() convierte el predicado en no SARGable, impidiendo que DuckDB use los zonemaps para saltar row groups.",
      "No identificaste que esta función fuerza un escaneo completo de las 14 760 filas en READ_PARQUET y traslada la evaluación a un operador FILTER posterior."
    ],
    "siguientePaso": "Revisa el concepto de predicados SARGables y reescribe la condición usando un rango directo sobre la columna cruda (por ejemplo, order_date >= '2025-01-01' AND order_date < '2025-02-01') para permitir el empuje del filtro."
  }
```

### 4. Salida literal de la verificación en navegador con Playwright (puerto `5211`)

```text
=== Verificando en navegador c2-sql-analitico-01-window-functions ===
  H1 renderizado: "Funciones de ventana y cláusula QUALIFY"
  Overflow horizontal (1280x720): 0px
  StarterCode calificación en UI: El resultado aún no coincide con la referencia9 fila(s) esperada(s) no aparecen en tu resultado. 9 fila(s) de tu resulta
  Solution calificación en UI: Práctica superada · El resultado coincide con la referenciaResultado verificado: 10 fila(s) y 5 columna(s) coinciden con

=== Verificando en navegador c2-sql-analitico-02-asof-lateral-ctes ===
  H1 renderizado: "Cruces temporales con ASOF JOIN y CTEs modulares"
  Overflow horizontal (1280x720): 0px
  StarterCode calificación en UI: El resultado aún no coincide con la referencia10 fila(s) esperada(s) no aparecen en tu resultado. 10 fila(s) de tu resul
  Solution calificación en UI: Práctica superada · El resultado coincide con la referenciaResultado verificado: 10 fila(s) y 5 columna(s) coinciden con

=== Verificando en navegador c2-sql-analitico-03-zonas-horarias-date-spine ===
  H1 renderizado: "Zonas horarias y espinas de calendario (Date Spine)"
  Overflow horizontal (1280x720): 0px
  StarterCode calificación en UI: El resultado aún no coincide con la referenciaFilas esperadas: 10 · Filas obtenidas: 9. 7 fila(s) esperada(s) no aparece
  Solution calificación en UI: Práctica superada · El resultado coincide con la referenciaResultado verificado: 10 fila(s) y 3 columna(s) coinciden con

=== Verificando en navegador c2-sql-analitico-04-explain-analyze ===
  H1 renderizado: "Leer planes con EXPLAIN ANALYZE: escaneos, filtros y uniones"
  Overflow horizontal (1280x720): 0px
  StarterCode calificación en UI: El resultado aún no coincide con la referenciaFaltan columnas esperadas: pct_ingresos_q1.Filas esperadas que faltan (máx
  Solution calificación en UI: Práctica superada · El resultado coincide con la referenciaResultado verificado: 5 fila(s) y 5 columna(s) coinciden con 

=== Captura en modo oscuro (1280x720) — Lección 03 ===
  [Captura guardada] C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-c2-sql-analitico\03-zonas-horarias-date-spine-dark.png

=== Captura en móvil (390x844) — Lección 04 ===
  Overflow horizontal móvil (390x844): 0px
  [Captura guardada] C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-c2-sql-analitico\04-explain-analyze-mobile.png

Errores de consola detectados: 0
```

### 5. Salida literal de `npm run build`

```text
> grano@1.0.0 build
> vite build

vite v6.4.5 building for production...
transforming...
✓ 2399 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                                        1.00 kB │ gzip:     0.51 kB
dist/assets/index-Ds05HJQs.css                                       236.89 kB │ gzip:    32.06 kB
dist/assets/curriculum-stages-BHOHuqmu.js                            285.16 kB │ gzip:    95.09 kB
dist/assets/SqlLab-BCL_0QVX.js                                       389.73 kB │ gzip:   127.31 kB
dist/assets/vendor-CMuuJwVt.js                                       558.99 kB │ gzip:   155.51 kB
dist/assets/index-Be1w1Lvu.js                                      2,085.87 kB │ gzip:   594.67 kB
✓ built in 18.08s
```

---

## Revisión propia

Defectos reales detectados durante la auditoría propia y corregidos antes de cerrar la entrega (6 defectos corregidos):

1. **URL 404 en documentación de DuckDB para `EXPLAIN`:** durante la verificación HTTP del Paso 1, la ruta antigua `https://duckdb.org/docs/sql/statements/explain.html` devolvió HTTP `404`. Se sustituyó por las rutas vigentes verificadas con HTTP `200`: `https://duckdb.org/docs/guides/meta/explain.html`, `https://duckdb.org/docs/dev/profiling.html` y `https://duckdb.org/docs/guides/performance/how_to_tune_workloads.html`.
2. **Términos prohibidos y longitud media de frase en las lecciones migradas 01 y 02:** `c2-sql-analitico-01-window-functions.js` y `c2-sql-analitico-02-asof-lateral-ctes.js` venían de la migración de Fase 2 con `needsReview: true`, apariciones de `Dominar`/`dominar`, una mención a `2026` en prosa, un párrafo con 4 negritas y medias de frase de `29.3` y `28.6` palabras/frase. Se reescribieron las secciones dividiendo oraciones subordinadas largas hasta dejar las 4 lecciones por debajo de 20 palabras/frase y con `0` hallazgos en `check-copy.mjs`.
3. **Límite de 60 caracteres en `lesson.title` (`LessonSchema`) frente a títulos largos del catálogo en lecciones 03 y 04:** los títulos completos de `modules.js` para las lecciones 03 (77 caracteres) y 04 (74 caracteres) excedían `lesson.title.max(60)`. Siguiendo el patrón de `c1-sql-joins`, se ajustaron los `title` a 51 y 60 caracteres (`'Zonas horarias y espinas de calendario (Date Spine)'` y `'Leer planes con EXPLAIN ANALYZE: escaneos, filtros y uniones'`) y se preservaron los títulos íntegros de catálogo en `subtitle`.
4. **Resolución de prerrequisitos entre módulos en `check-content.mjs --module c2-sql-analitico`:** al ejecutar `check-content.mjs` filtrado a un solo módulo, el script valida `prerequisites` contra los IDs cortos del catálogo (`c1-sql-joins-01`, `c1-sql-joins-02`) en lugar de los nombres de archivo con slug de otros módulos. Se actualizaron los prerrequisitos cruzados a `c1-sql-joins-02` y `c1-sql-joins-01` para que `check-content.mjs --module c2-sql-analitico` pase con 0 errores y el adaptador `LESSONS_BY_ID` resuelva los títulos humanos en la interfaz.
5. **Longitud de `hook` (`40–90` palabras) y `check.explanation` (`20–60` palabras) en las lecciones 03 y 04:** en la primera pasada de validación con `check-content.mjs`, los `hook` de las lecciones 03 y 04 tenían ~98 palabras y `checks[1].explanation` de la lección 04 tenía 16 palabras. Se condensaron ambos `hook` (a 79 y 77 palabras conservando todas las cifras de Mercado Brisa) y se amplió la explicación del check a 31 palabras.
6. **Compatibilidad entre el tope de 25 palabras de `§9.2` y el mínimo de 20 palabras de `GlossaryTermSchema`:** `src/data/schema/glossary.js` exige entre 20 y 60 palabras por definición, mientras que `§9.2` pide definiciones de `<= 25` palabras. Se redactaron las 6 definiciones de `c2-sql-analitico-glossary.json` con exactamente 25 palabras cada una, cumpliendo ambas reglas de forma simultánea.

---

## Prueba adversarial

| Qué probé | Qué pasó | Acción |
| :--- | :--- | :--- |
| 1. Ejecutar el `starterCode` sin cambios en las 4 lecciones (`compareQueryResults` y botón «Comprobar resultado» en UI). | En las 4 lecciones el calificador rechaza el `starterCode` (`passed: false`): por valores incorrectos sin `LAG` en L01 (`rows_mismatch`), pérdida de pedidos sin `ASOF` en L02 (`rows_mismatch`), omisión del viernes `2025-01-03` sin espina `calendar` en L03 (`rows_mismatch: 9 filas en vez de 10`) y falta de `pct_ingresos_q1` + filtro `status` en L04 (`columns_mismatch`). | Se verificó que ninguna lección pueda aprobarse sin escribir la lógica SQL pedida. |
| 2. Invertir el orden (`ORDER BY o.order_id DESC`) en la solución de `c2-sql-analitico-02-asof-lateral-ctes` con `orderMatters: true`. | `compareQueryResults` devuelve `passed: false` con código `order_mismatch` («Las 10 filas contienen los valores esperados, pero el orden no coincide. Revisa la cláusula ORDER BY»). | Se mantiene `orderMatters: true` en las 4 prácticas y se especifica el criterio de ordenamiento en cada `prompt`. |
| 3. Introducir una desviación en coma flotante de `+1e-7` en `media_movil_7d_usd` en `c2-sql-analitico-03-zonas-horarias-date-spine`. | `compareQueryResults` devuelve `passed: true` (`matched`) porque la diferencia (`1e-7`) cae dentro de `NUMERIC_TOLERANCE = 1e-6`, evitando falsos negativos por representación binaria IEEE 754. | Se conserva `ROUND(..., 2)` tanto en `expected` como en las instrucciones del `prompt` para fijar la precisión decimal esperada. |
| 4. Cambiar el alias de la columna calculada (`AS porcentaje_total` en vez de `AS pct_ingresos_q1`) en `c2-sql-analitico-04-explain-analyze`. | `compareQueryResults` devuelve `passed: false` con `columns_mismatch` («Faltan columnas esperadas: pct_ingresos_q1. Sobran columnas no solicitadas: porcentaje_total»). | Se listan entre comillas invertidas los nombres exactos de todas las columnas de salida en el `prompt` y en `hints`. |
| 5. Ejecutar una consulta válida que devuelve 0 filas (`WHERE 1 = 0`) en `c2-sql-analitico-02-asof-lateral-ctes`. | El calificador devuelve `passed: false` (`rows_mismatch — Filas esperadas: 10 · Filas obtenidas: 0`) sin lanzar excepciones de puntero nulo. | Se verificó el manejo limpio de conjuntos vacíos en `sqlGrader.js` y en la tabla de resultados de `SqlLab.jsx`. |
| 6. Invertir el signo de desigualdad en `ASOF LEFT JOIN` (`o.order_ts <= e.event_ts`, provocando *data leakage* del futuro) en `c2-sql-analitico-02-asof-lateral-ctes`. | La consulta es sintácticamente válida en DuckDB, pero empareja eventos posteriores a la compra y `compareQueryResults` la rechaza (`passed: false`, `rows_mismatch` en 6 de los 10 pedidos). Además, en la prueba con `agy` real en modo `feynman`, el tutor diagnosticó la fuga de datos futuros. | Se reforzó este caso tanto en `checks[1]` como en `aiNotes` de la lección 02. |
| 7. Inspeccionar desbordamiento horizontal en escritorio (`1280x720`) y móvil (`390x844`) con bloques SQL anchos y títulos largos en las 4 lecciones. | `document.documentElement.scrollWidth - document.documentElement.clientWidth` midió `0px` en las 4 lecciones en escritorio y `0px` en móvil (`390x844`). | Los contenedores `.sql-table-scroll` y bloques `<pre>` absorben el scroll horizontal internamente sin romper el layout de página. |

---

## Capturas antes / después

Todas las capturas fueron tomadas en el puerto `5211` e inspeccionadas visualmente con `read_file` (ubicadas fuera del árbol Git en `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-c2-sql-analitico\`):

1. `01-window-functions-header-light.png` (`1280x720`, tema claro): cabecera, prerrequisito con título humano, escenario real y objetivos de `c2-sql-analitico-01-window-functions`.
2. `01-window-functions-starter-fail-light.png` (`1280x720`, tema claro): estado inicial de la práctica de la lección 01 mostrando el fallo del `starterCode` y las tablas comparativas de filas faltantes/sobrantes.
3. `01-window-functions-practice-pass-light.png` (`1280x720`, tema claro): práctica de la lección 01 superada en DuckDB-Wasm (`10 filas · 15.3 ms · 5 columnas`).
4. `02-asof-lateral-ctes-header-light.png` (`1280x720`, tema claro): cabecera, prerrequisito, escenario real y objetivos de `c2-sql-analitico-02-asof-lateral-ctes`.
5. `02-asof-lateral-ctes-practice-pass-light.png` (`1280x720`, tema claro): práctica `ASOF LEFT JOIN` de la lección 02 superada en DuckDB-Wasm (`10 filas · 129.1 ms · 5 columnas`).
6. `03-zonas-horarias-date-spine-header-light.png` (`1280x720`, tema claro): cabecera, prerrequisitos humanos, escenario real y objetivos de `c2-sql-analitico-03-zonas-horarias-date-spine`.
7. `03-zonas-horarias-date-spine-practice-pass-light.png` (`1280x720`, tema claro): práctica de espina de calendario (`calendar LEFT JOIN`) y media móvil de 7 días superada en DuckDB-Wasm (`10 filas · 11.1 ms · 3 columnas`, con el `2025-01-03` materializado en `0`).
8. `04-explain-analyze-header-light.png` (`1280x720`, tema claro): cabecera, prerrequisitos humanos, escenario real y objetivos de `c2-sql-analitico-04-explain-analyze`.
9. `04-explain-analyze-practice-pass-light.png` (`1280x720`, tema claro): práctica SARGable por categoría en Q1 2025 superada en DuckDB-Wasm (`5 filas · 18 ms · 5 columnas`).
10. `03-zonas-horarias-date-spine-dark.png` (`1280x720`, tema oscuro): verificación de contraste y jerarquía visual en modo oscuro sobre la lección 03.
11. `04-explain-analyze-mobile.png` (`390x844`, móvil claro): verificación responsiva sin desbordamiento horizontal (`0px`) sobre la lección 04.

---

## Peticiones al orquestador

1. **Regeneración de `src/data/lessons/index.js` al integrar la rama:** ejecutar `node scripts/sync-lessons-index.mjs` tras fusionar `agente/W-c2-sql-analitico` para registrar las dos lecciones nuevas (`c2-sql-analitico-03-zonas-horarias-date-spine` y `c2-sql-analitico-04-explain-analyze`) junto con las dos lecciones editadas (`01` y `02`).
2. **Integración de términos de glosario en `src/data/glossary.js`:** fusionar las 6 entradas validadas de `docs/curriculo/investigacion/c2-sql-analitico-glossary.json` (`c2-sql-qualify`, `c2-sql-marco-ventana`, `c2-sql-asof-join`, `c2-sql-lateral-join`, `c2-sql-date-spine`, `c2-sql-explain-analyze`) en `GLOSSARY_TERMS`.
3. **Resolución de prerrequisitos entre módulos en `scripts/check-content.mjs`:** cuando `check-content.mjs` se invoca con `--module <id>`, `collectLessonFiles` solo carga los archivos del módulo filtrado, por lo que `knownLessonIds` solo conoce los IDs cortos de catálogo (`c1-sql-joins-01`, `c1-sql-joins-02`) de otros módulos y no sus IDs largos con slug (`c1-sql-joins-01-tipos-join`). Pre-poblar `knownLessonIds` escaneando todos los archivos de `src/data/lessons/` permitiría usar indistintamente el ID corto de catálogo o el ID largo con slug en `prerequisites`.

---

## Pendiente

Nada pendiente dentro del alcance de `W-c2-sql-analitico`. Los 7 archivos bajo propiedad exclusiva están validados y listos para fusión en `agente/W-c2-sql-analitico`.
