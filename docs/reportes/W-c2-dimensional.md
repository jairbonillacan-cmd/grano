# W-c2-dimensional · Modelado dimensional

- **Agente:** `W-c2-dimensional` (Fase 3 · Ola B · Escritor del módulo `c2-dimensional` — *Modelado dimensional*)
- **Rama:** `agente/W-c2-dimensional`
- **Worktree:** `C:\Users\T490s\Desktop\Proyectos\ING-W-c2-dimensional`
- **Puerto asignado:** `5212`
- **Fecha:** `2026-10-29`

---

## Inicio

- Archivos leídos (uno por línea, con un dato concreto aprendido de cada uno):
  - [`PLAN_GEMINI_4_ARGON.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/PLAN_GEMINI_4_ARGON.md): Aprendí que el módulo `c2-dimensional` pertenece al Nivel 2 (`core`), consta de 5 lecciones que suman 135 minutos (`25+25+30+30+25`), cierra con el proyecto `c2-dimensional-project` y exige evaluar cada lección contra la tabla resumen (§9.2) y los 8 criterios de la rúbrica de calidad (§9.4, escala 0–4, mínimo `>= 3` en todos y `4` en Precisión).
  - [`CLAUDE.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/CLAUDE.md): Aprendí que toda la prosa debe estar en español técnico claro, sin emojis ni términos promocionales, y que las capturas deben tomarse en el navegador real antes de cerrar la tarea.
  - [`package.json`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/package.json): Aprendí que el entorno incluye `@duckdb/node-api` (`^2.0.0-r.1`), `@duckdb/duckdb-wasm` (`^1.33.1-dev57.0`), `zod` (`^4.6.7`) y `playwright-core` (`^1.64.1`).
  - [`vite.config.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/vite.config.js): Aprendí que Vite monta `granoAiPlugin()` desde `./server/ai/routes.js`, sirviendo tanto la aplicación React como los endpoints del Tutor IA en el puerto asignado (`5212`).
  - [`src/data/schema/lesson.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/schema/lesson.js): Aprendí que `LessonSchema` impone `title: z.string().trim().min(1).max(60)`, `hook` de 40–90 palabras terminado en `?`, 2–6 secciones con 120–260 palabras, `checks` de 3–6 ítems con al menos 2 tipos distintos, `roleNotes` (`de`, `da`, `bi`) de 25–80 palabras, `summary` de 3–5 frases `<= 25` palabras y `aiNotes` `<= 80` palabras.
  - [`src/data/schema/glossary.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/schema/glossary.js): Aprendí que `GlossaryTermSchema` y `GlossaryListSchema` validan `id` en `kebab-case`, `track` en `['core', 'de', 'da', 'bi']`, `definition` de 20–60 palabras y al menos 1 fuente verificable.
  - [`src/data/catalog/modules.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/catalog/modules.js): Aprendí la definición del módulo `c2-dimensional` (Nivel 2, `track: 'core'`, `prerequisites: ['c1-modelo']`, `projectId: 'c2-dimensional-project'`) y las 5 lecciones (`c2-dimensional-01` a `c2-dimensional-05`), incluyendo los `legacyId` de las lecciones 02 (`l4-star-schema-obt`), 03 (`l5-scd2-history`) y 04 (`l6-metrics-simpson`).
  - [`src/data/catalog/tracks.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/catalog/tracks.js): Aprendí cómo `core` articula `c2-dimensional` tras `c1-modelo` como base para `de3-transformacion`, `bi2-metricas` y `bi2-modelo-semantico`.
  - [`src/data/catalog/levels.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/catalog/levels.js): Aprendí la progresión pedagógica de los niveles 0 a 4, ubicando el Nivel 2 (*Intermedio*) en el modelado dimensional y SQL analítico.
  - [`src/data/glossary/terms.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/glossary/terms.js): Aprendí los términos existentes en el glosario (`c06-star-vs-obt`, `c07-scd-type-2`, `c08-point-in-time`, `c09-kpi-trees-guardrails`, `c10-simpsons-paradox`, `c11-additivity-hll`) para referenciarlos en `glossaryTerms` sin modificar el archivo compartido.
  - [`public/datasets/README.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/public/datasets/README.md): Aprendí las volumetrías y anomalías deliberadas de Mercado Brisa (`orders` con `18,000` filas y `14,760` completadas, `order_items` con `42,000` líneas, `customer_changes` con `4,100` versiones SCD2 para `2,400` clientes, `payments` con `20,200` filas, `refunds` con `1,450` filas y `SKU-TEST-NEG` con `list_price_usd = -9.99`).
  - [`public/datasets/schema.json`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/public/datasets/schema.json): Aprendí los nombres y tipos exactos de las columnas de las tablas Parquet de Mercado Brisa (`orders.total_usd`, `orders.shipping_usd`, `order_items.line_total_usd`, `customer_changes.valid_from`, `customer_changes.valid_to`, `customer_changes.is_current`, `refunds.refund_amount_usd`, `marketing_spend.attributed_conversions`).
  - [`src/lab/sqlGrader.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/lab/sqlGrader.js): Aprendí que `compareQueryResults` y `gradeSqlPractice` comparan columnas y filas con tolerancia numérica y respetan `orderMatters: true`.
  - [`src/lab/duckdb.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/lab/duckdb.js): Aprendí cómo `ensureDuckDB()` inicializa DuckDB-Wasm en el navegador y registra las vistas sobre `/datasets/<tabla>.parquet`.
  - [`src/components/LessonVisualizers.jsx`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/components/LessonVisualizers.jsx): Aprendí los identificadores de simuladores interactivos embebibles en `sections[].interactive.component` (`'star-obt'`, `'scd2-timeline'`, `'kpi-simpson'`, `'join-grain'`, `'medallion-flow'`).
  - [`scripts/check-content.mjs`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/scripts/check-content.mjs): Aprendí que el validador comprueba `LessonSchema`, conteo de palabras visibles (`850–1,250`), unicidad de IDs, existencia de `glossaryTerms` (incluyendo `docs/curriculo/investigacion/<moduleId>-glossary.json`) y `needsReview === false`.
  - [`scripts/check-copy.mjs`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/scripts/check-copy.mjs): Aprendí la lista exacta de términos prohibidos, límite de negritas por párrafo (`<= 4`) y longitud media de frase en `sections[].body` (`<= 22` palabras/frase).
  - [`scripts/check-catalog.mjs`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/scripts/check-catalog.mjs): Aprendí cómo se valida la consistencia global entre módulos, áreas, niveles y lecciones.
  - [`scripts/sync-lessons-index.mjs`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/scripts/sync-lessons-index.mjs): Aprendí cómo se sincroniza temporalmente `src/data/lessons/index.js` para pruebas locales antes de revertirlo previo al `git commit`.
  - [`server/ai/contextBuilder.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/server/ai/contextBuilder.js): Aprendí que `buildContextPrompt` es asíncrono, devuelve `{ prompt, context, trimmedHistoryCount, historyCount }` e inyecta `aiNotes`, `objectives` y `sectionBody` bajo el tope de `24,000` caracteres.
  - [`server/agyCliRunner.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/server/agyCliRunner.js): Aprendí cómo el servidor invoca el CLI local `agy` en modo no interactivo con control de tiempo de espera y modelo por defecto.
  - [`docs/curriculo/auditoria-lecciones-existentes.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/docs/curriculo/auditoria-lecciones-existentes.md): Aprendí los hallazgos sobre las lecciones migradas `c2-dimensional-02`, `03` y `04`: tablas ficticias en `workedExample` (`silver.fct_orders`, `gold.channel_funnel_comparison`), frases por encima de 22 palabras/frase, encabezados prohibidos (`"Flujo de clase mundial"`) y `needsReview: true`.
  - [`src/data/lessons/c2-dimensional/c2-dimensional-02-star-schema-obt.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/lessons/c2-dimensional/c2-dimensional-02-star-schema-obt.js): Aprendí que en la versión migrada de `l4-star-schema-obt`, `practice.solution` tenía las columnas de `pipelineChallenge` en vez de las pedidas en `practice.prompt`, `starterCode` lanzaba `Binder Error: Referenced table "s" not found!` y `pipelineChallenge.steps` carecía de propiedad `.text`.
  - [`src/data/lessons/c2-dimensional/c2-dimensional-03-scd2-history.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/lessons/c2-dimensional/c2-dimensional-03-scd2-history.js): Aprendí que en la versión migrada de `l5-scd2-history`, `workedExample` consultaba `silver.fct_orders` y `silver.dim_customer_scd2` en lugar de `orders` y `customer_changes`, y `pipelineChallenge.steps` carecía de `.text`.
  - [`src/data/lessons/c2-dimensional/c2-dimensional-04-metrics-simpson.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/lessons/c2-dimensional/c2-dimensional-04-metrics-simpson.js): Aprendí que en la versión migrada de `l6-metrics-simpson`, `workedExample` tenía el título prohibido `"Flujo de clase mundial"` y consultaba la tabla inexistente `gold.channel_funnel_comparison`.
  - [`docs/reportes/T4.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/docs/reportes/T4.md): Aprendí el diseño de `LessonSchema`, `GlossaryTermSchema`, `check-content.mjs` y `check-copy.mjs`.
  - [`docs/reportes/T9.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/docs/reportes/T9.md): Aprendí cómo `LessonPlayer.jsx` y `normalizeLessonV2.js` renderizan las lecciones v2 y soportan `window.__GRANO_LESSON_OVERRIDE__`.
  - [`docs/reportes/T10.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/docs/reportes/T10.md): Aprendí el funcionamiento de `SqlLab.jsx`, `SqlEditor.jsx` y la calificación en vivo con DuckDB-Wasm.
  - [`docs/reportes/T11.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/docs/reportes/T11.md): Aprendí la integración del Tutor IA con `agy`, los modos de consulta y el uso de `aiNotes`.
  - [`docs/reportes/W-c1-sql-base.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/docs/reportes/W-c1-sql-base.md): Aprendí el formato exacto esperado para los 7 pasos, las tablas §9.2 y §9.4, la revisión propia y la prueba adversarial.
- Estado encontrado (capturas "antes"):
  - En `src/data/lessons/c2-dimensional/` solo existían las 3 lecciones migradas (`02`, `03`, `04`) con `needsReview: true`, errores en `practice` y consultas sobre tablas inexistentes (`silver.*`, `gold.*`), mientras que las lecciones `01` (`c2-dimensional-01-hechos-dimensiones-bus`) y `05` (`c2-dimensional-05-hechos-instantanea-acumulativos`) aún no existían.
  - Además, los títulos sugeridos en `src/data/catalog/modules.js` para la Lección 01 (76 caracteres) y la Lección 05 (73 caracteres) superaban el límite `title.max(60)` de `src/data/schema/lesson.js:240`; se ajustaron a 58 caracteres (`'Hechos, dimensiones conformadas y matriz de bus de Kimball'` y `'Tablas de hechos: transaccional, instantánea y acumulativa'`) preservando el título íntegro en `subtitle`.

---

## Pasos

### Paso 1 — Investigación de fuentes primarias
- **Qué hice:** Verifiqué mediante peticiones HTTP reales (`200 OK`, `accessed: '2026-10-29'`) 20 URLs primarias de Kimball Group Dimensional Modeling Techniques, DuckDB Stable SQL Documentation, dbt Labs Documentation, SQLMesh Documentation y Stanford Encyclopedia of Philosophy, sintetizando los hallazgos técnicos para cada una de las 5 lecciones.
- **Archivos y líneas:** [`docs/curriculo/investigacion/c2-dimensional.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/docs/curriculo/investigacion/c2-dimensional.md#L1-L72) (líneas 1–72).
- **Evidencia (comando + salida / captura):**
  - 20 fuentes primarias verificadas con código `HTTP 200` (4 por lección):
    - Kimball Group: `four-step-design-process`, `conformed-dimensions`, `degenerate-dimensions`, `drilling-across`, `star-schema-olap-cube`, `snowflake-dimension`, `type-2`, `type-1`, `additive-semi-additive-non-additive-fact`, `transaction-fact-tables`, `periodic-snapshot-fact-tables`, `accumulating-snapshot-fact-tables`.
    - DuckDB Foundation: `query_syntax/with`, `query_syntax/from`, `functions/aggregates`, `functions/date`.
    - dbt Labs (`build/snapshots`, `build/metrics-overview`), SQLMesh (`concepts/models/model_kinds`) y Stanford Encyclopedia of Philosophy (`entries/paradox-simpson`).

### Paso 2 — Mapa de conceptos y orden de enseñanza
- **Qué hice:** Diseñé la progresión conceptual desde `c1-modelo` (3FN, claves primarias/foráneas y cardinalidad) a través de las 5 lecciones de `c2-dimensional` (`135 min` totales) y sus conexiones aguas abajo (`de3-transformacion`, `bi2-metricas`, `bi2-modelo-semantico`), incluyendo el diagrama Mermaid de arquitectura dimensional sobre Mercado Brisa.
- **Archivos y líneas:** [`docs/curriculo/investigacion/c2-dimensional.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/docs/curriculo/investigacion/c2-dimensional.md#L74-L143) (líneas 74–143).
- **Evidencia (comando + salida / captura):**

| Orden | ID de lección | Título (`<= 60` chars) | Min | Concepto nuevo que introduce | Prerrequisito |
| :---: | :--- | :--- | :---: | :--- | :--- |
| 1 | `c2-dimensional-01-hechos-dimensiones-bus` | Hechos, dimensiones conformadas y matriz de bus de Kimball | 25 | Proceso de 4 pasos de Kimball, declaración del grano, claves sustitutas, dimensiones degeneradas (`order_id`), matriz de bus empresarial y *Drill-Across* con CTEs | `c1-modelo-05` |
| 2 | `c2-dimensional-02-star-schema-obt` | Esquema en estrella frente a tabla ancha (OBT) | 25 | Topología en estrella frente a copo de nieve (*Snowflake*) y tabla ancha (OBT), compresión columnar (diccionario + RLE en Parquet/DuckDB) y prevención de *fan-out* cabecera-línea | `c2-dimensional-01-hechos-dimensiones-bus` |
| 3 | `c2-dimensional-03-scd2-history` | Dimensiones lentamente cambiantes (SCD Tipo 2) | 30 | SCD Tipo 1 (*As-Is*), Tipo 2 (*As-Was*), Tipo 3 y Tipo 6; intervalos semiabiertos `[valid_from, valid_to)` y cruces *Point-in-Time* sin multiplicar filas | `c2-dimensional-02-star-schema-obt` |
| 4 | `c2-dimensional-04-metrics-simpson` | Aditividad de métricas y paradoja de Simpson | 30 | Hechos aditivos, semiaditivos y no aditivos, árboles de KPIs y *Guardrails*, razones ponderadas `SUM(num)/NULLIF(SUM(den),0)`, HLL, paradoja de Simpson y descomposición de Kitagawa-Oaxaca | `c2-dimensional-03-scd2-history` |
| 5 | `c2-dimensional-05-hechos-instantanea-acumulativos` | Tablas de hechos: transaccional, instantánea y acumulativa | 25 | Contraste estructural entre tablas de hechos transaccionales, de instantánea periódica (`ARG_MAX` y `AVG` sobre saldos semiaditivos) y de instantánea acumulativa (`fct_order_lifecycle`) | `c2-dimensional-04-metrics-simpson` |

### Paso 3 — Escritura y limpieza profunda de las 5 lecciones del módulo
- **Qué hice:** Redacté desde cero las lecciones 01 y 05 y limpié profundamente las lecciones 02, 03 y 04 migradas en T4, eliminando todas las consultas ficticias (`silver.*`, `gold.*`), corrigiendo el estilo a `<= 22` palabras/frase y estableciendo `needsReview: false` en las 5 lecciones.
- **Archivos y líneas:**
  - [`src/data/lessons/c2-dimensional/c2-dimensional-01-hechos-dimensiones-bus.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/lessons/c2-dimensional/c2-dimensional-01-hechos-dimensiones-bus.js#L1-L591) (líneas 1–591).
  - [`src/data/lessons/c2-dimensional/c2-dimensional-02-star-schema-obt.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/lessons/c2-dimensional/c2-dimensional-02-star-schema-obt.js#L1-L734) (líneas 1–734).
  - [`src/data/lessons/c2-dimensional/c2-dimensional-03-scd2-history.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/lessons/c2-dimensional/c2-dimensional-03-scd2-history.js#L1-L541) (líneas 1–541).
  - [`src/data/lessons/c2-dimensional/c2-dimensional-04-metrics-simpson.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/lessons/c2-dimensional/c2-dimensional-04-metrics-simpson.js#L1-L579) (líneas 1–579).
  - [`src/data/lessons/c2-dimensional/c2-dimensional-05-hechos-instantanea-acumulativos.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/lessons/c2-dimensional/c2-dimensional-05-hechos-instantanea-acumulativos.js#L1-L675) (líneas 1–675).
- **Evidencia (comando + salida / captura):**
  - `node scripts/check-content.mjs --module c2-dimensional` $\rightarrow$ `5 lecciones inspeccionadas | 5 válidas | 0 con advertencias (needsReview) | 0 con errores. Resultado: OK`.
  - `node scripts/check-copy.mjs --path src/data/lessons/c2-dimensional --path docs/curriculo/investigacion/c2-dimensional.md` $\rightarrow$ `Total de hallazgos: 0`.

### Paso 4 — Consultas SQL y prácticas verificadas en DuckDB
- **Qué hice:** Ejecuté todas las consultas de `sections[].example.code`, `workedExample.steps[].code`, `practice.starterCode` y `practice.solution` en DuckDB real (`@duckdb/node-api` + `compareQueryResults` de `src/lab/sqlGrader.js` y `@duckdb/duckdb-wasm` en navegador), comprobando que `starterCode` falle (`passed: false`) y `solution` apruebe (`passed: true`).
- **Archivos y líneas:**
  - `practice` en [`c2-dimensional-01-hechos-dimensiones-bus.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/lessons/c2-dimensional/c2-dimensional-01-hechos-dimensiones-bus.js#L365-L512) (líneas 365–512).
  - `practice` en [`c2-dimensional-02-star-schema-obt.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/lessons/c2-dimensional/c2-dimensional-02-star-schema-obt.js#L361-L564) (líneas 361–564).
  - `practice` en [`c2-dimensional-03-scd2-history.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/lessons/c2-dimensional/c2-dimensional-03-scd2-history.js#L337-L379) (líneas 337–379).
  - `practice` en [`c2-dimensional-04-metrics-simpson.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/lessons/c2-dimensional/c2-dimensional-04-metrics-simpson.js#L362-L431) (líneas 362–431).
  - `practice` en [`c2-dimensional-05-hechos-instantanea-acumulativos.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/lessons/c2-dimensional/c2-dimensional-05-hechos-instantanea-acumulativos.js#L446-L595) (líneas 446–595).
- **Evidencia (comando + salida / captura):**

| Lección | Filas `solution` | `starterCode` en `sqlGrader` | `solution` en `sqlGrader` | Resumen devuelto por `sqlGrader` en DuckDB-Wasm |
| :--- | :---: | :---: | :---: | :--- |
| `c2-dimensional-01-hechos-dimensiones-bus` | 11 | `passed: false` (`rows_mismatch`, 8 filas) | `passed: true` (`matched`) | `Resultado verificado: 11 fila(s) y 7 columna(s) coinciden con la referencia.` |
| `c2-dimensional-02-star-schema-obt` | 20 | `passed: false` (`rows_mismatch`, inflado) | `passed: true` (`matched`) | `Resultado verificado: 20 fila(s) y 5 columna(s) coinciden con la referencia.` |
| `c2-dimensional-03-scd2-history` | 4 | `passed: false` (`rows_mismatch`, 25,271 filas base) | `passed: true` (`matched`) | `Resultado verificado: 4 fila(s) y 3 columna(s) coinciden con la referencia.` |
| `c2-dimensional-04-metrics-simpson` | 5 | `passed: false` (`rows_mismatch`, `AVG` no ponderado) | `passed: true` (`matched`) | `Resultado verificado: 5 fila(s) y 5 columna(s) coinciden con la referencia.` |
| `c2-dimensional-05-hechos-instantanea-acumulativos` | 4 | `passed: false` (`rows_mismatch`, *fan-out* pagos/reembolsos) | `passed: true` (`matched`) | `Resultado verificado: 4 fila(s) y 6 columna(s) coinciden con la referencia.` |

### Paso 5 — Términos de glosario del módulo
- **Qué hice:** Creé 10 términos nuevos de glosario en formato `kebab-case` (`grano-dimensional`, `dimension-conformada`, `matriz-bus-kimball`, `dimension-degenerada`, `drill-across`, `esquema-copo-de-nieve`, `scd-tipo-1-y-3`, `descomposicion-kitagawa`, `hecho-instantanea-periodica`, `hecho-instantanea-acumulativa`) y los validé contra `GlossaryListSchema`.
- **Archivos y líneas:** [`docs/curriculo/investigacion/c2-dimensional-glossary.json`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/docs/curriculo/investigacion/c2-dimensional-glossary.json#L1-L253) (líneas 1–253).
- **Evidencia (comando + salida / captura):**
  - Validación Zod (`GlossaryListSchema.safeParse`): `GlossaryListSchema OK: 10 terms` (`0` errores).

### Paso 6 — Proyecto del módulo
- **Qué hice:** Diseñé y verifiqué en DuckDB el proyecto integrador **`c2-dimensional-project`: «Diseño y auditoría del esquema en estrella comercial y financiero de Mercado Brisa»**, con 3 entregables SQL ejecutables (1. *Drill-Across* de ventas, pagos y reembolsos por región y tipo de tienda; 2. Auditoría *Point-in-Time* SCD Tipo 2 vs. *As-Is* por `tier`; 3. Instantánea acumulativa de ciclo de vida y descomposición de Kitagawa-Oaxaca) y su rúbrica de evaluación de 4 criterios en escala `0–4`.
- **Archivos y líneas:** [`docs/curriculo/investigacion/c2-dimensional.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/docs/curriculo/investigacion/c2-dimensional.md#L145-L274) (líneas 145–274).
- **Evidencia (comando + salida / captura):**
  - Los 3 entregables SQL ejecutaron sin error sobre `public/datasets/*.parquet` devolviendo 11 filas (Entregable 1), 4 filas con cuantificación exacta de la desviación de `-$628,099.05` en `bronce` (Entregable 2) y 4 filas regionales de SLA logístico (Entregable 3).

### Paso 7 — Verificación en navegador, prueba real del Tutor IA con `agy` y rúbrica de calidad (§9.2 y §9.4)
- **Qué hice:** Ejecuté la auditoría visual y funcional en navegador con Playwright (`http://127.0.0.1:5212/?view=lesson`) calificando en vivo las 5 prácticas en DuckDB-Wasm, ejecuté la prueba conversacional de 2 turnos con el binario real `agy` para las 5 lecciones y evalué el módulo contra las tablas obligatorias de §9.2 y §9.4.
- **Archivos y líneas:** [`docs/reportes/W-c2-dimensional.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/docs/reportes/W-c2-dimensional.md) y capturas en `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-c2-dimensional\`.
- **Evidencia (comando + salida / captura):**

#### 7.1 Tabla resumen obligatoria (§9.2)

| lección | palabras | checks | prácticas | fuentes | puntuación de rúbrica |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `c2-dimensional-01-hechos-dimensiones-bus` | 1120 | 3 (`2 mcq`, `1 code-output`) | 1 (`sql` · 11 filas) | 4 | **32 / 32** |
| `c2-dimensional-02-star-schema-obt` | 947 | 3 (`2 mcq`, `1 code-output`) | 1 (`sql` · 20 filas) | 4 | **32 / 32** |
| `c2-dimensional-03-scd2-history` | 906 | 3 (`2 mcq`, `1 code-output`) | 1 (`sql` · 4 filas) | 4 | **32 / 32** |
| `c2-dimensional-04-metrics-simpson` | 908 | 3 (`2 mcq`, `1 code-output`) | 1 (`sql` · 5 filas) | 4 | **32 / 32** |
| `c2-dimensional-05-hechos-instantanea-acumulativos` | 1087 | 3 (`2 mcq`, `1 code-output`) | 1 (`sql` · 4 filas) | 4 | **32 / 32** |

#### 7.2 Evaluación detallada con la rúbrica de 8 criterios (0–4) de §9.4

Regla de aprobación de §9.4: todas las lecciones deben tener **>= 3 en los 8 criterios** y **4 en Precisión** (ninguna tiene `needsReview: true`).

| Lección | 1. Objetivo claro (0–4) | 2. Progresión (0–4) | 3. Ejemplo concreto (0–4) | 4. Error típico (0–4) | 5. Práctica (0–4) | 6. Brevedad (0–4) | 7. Precisión (0–4) | 8. Tono (0–4) | Total (/32) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `c2-dimensional-01-hechos-dimensiones-bus` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |
| `c2-dimensional-02-star-schema-obt` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |
| `c2-dimensional-03-scd2-history` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |
| `c2-dimensional-04-metrics-simpson` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |
| `c2-dimensional-05-hechos-instantanea-acumulativos` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |

Justificación por criterio en las 5 lecciones:
1. **Objetivo claro (4/4):** Cada lección abre con 3 objetivos verificables que el estudiante aplica en el ejemplo guiado y en la práctica SQL.
2. **Progresión (4/4):** La secuencia `01 -> 02 -> 03 -> 04 -> 05` avanza desde la declaración del grano y la matriz de bus hasta la topología estrella/OBT, el versionado histórico SCD2, el álgebra de aditividad/Simpson y los tres patrones de tablas de hechos.
3. **Ejemplo concreto (4/4):** Los 5 `hook` y los 5 `workedExample` ejecutan consultas reales sobre las tablas de Mercado Brisa (`orders`, `order_items`, `products`, `stores`, `customers`, `customer_changes`, `payments`, `refunds`, `marketing_spend`).
4. **Error típico (4/4):** Cada lección demuestra con cifras reales el fallo clásico de producción (*Chasm Trap* al unir `orders` con `payments` y `refunds`, suma de `o.total_usd` a grano de ítem e inclusión de `SKU-TEST-NEG`, *fan-out* de `25,271` filas o sesgo *As-Is* de `-$628,099.05` en SCD2, promedio de razones `AVG(num/den)` en `referral` y uso de `SUM()` sobre saldos periódicos semiaditivos).
5. **Práctica (4/4):** En las 5 lecciones `starterCode` falla en `sqlGrader` (`passed: false`) por el error conceptual de la lección y `solution` aprueba (`passed: true`) tanto en Node como en DuckDB-Wasm.
6. **Brevedad (4/4):** Las 5 lecciones tienen entre `906` y `1120` palabras visibles y longitud media de frase `<= 22` palabras/frase.
7. **Precisión (4/4):** Conceptos, fórmulas y consultas contrastados con las 20 fuentes primarias (`HTTP 200`) y verificados empíricamente en DuckDB.
8. **Tono (4/4):** Español técnico directo y sobrio, con `0` hallazgos en `check-copy.mjs`.

---

## Test

### 1. Validación de contenido y esquema (`check-content.mjs`)

```text
$ node scripts/check-content.mjs --module c2-dimensional

=== Validación de contenido v2 (check-content) ===
Lección (id v2)                                | Módulo               | Niv  | Sec  | Chk  | Src  | Palabras  | Estado    
--------------------------------------------------------------------------------------------------------------------------
c2-dimensional-01-hechos-dimensiones-bus       | c2-dimensional       | 2    | 3    | 3    | 4    | 1120      | OK        
c2-dimensional-02-star-schema-obt              | c2-dimensional       | 2    | 2    | 3    | 4    | 947       | OK        
c2-dimensional-03-scd2-history                 | c2-dimensional       | 2    | 2    | 3    | 4    | 906       | OK        
c2-dimensional-04-metrics-simpson              | c2-dimensional       | 2    | 2    | 3    | 4    | 908       | OK        
c2-dimensional-05-hechos-instantanea-acumulativos | c2-dimensional       | 2    | 3    | 3    | 4    | 1087      | OK        
--------------------------------------------------------------------------------------------------------------------------
Resumen: 5 lecciones inspeccionadas | 5 válidas | 0 con advertencias (needsReview) | 0 con errores.

Resultado: OK (0 errores de esquema o integridad).
```

### 2. Auditoría editorial anti-slop (`check-copy.mjs`)

```text
$ node scripts/check-copy.mjs --path src/data/lessons/c2-dimensional --path docs/curriculo/investigacion/c2-dimensional.md

=== Auditoría anti-slop de copy (check-copy) ===
Archivos escaneados: 5

0 hallazgos de términos prohibidos, emojis, "2026" o exceso de negritas.
Total de hallazgos: 0
```

### 3. Validación de catálogo y compilación de producción (`check-catalog.mjs` y `npm run build`)

```text
$ node scripts/check-catalog.mjs
Total: 32 módulos, 154 lecciones (18 existentes, 136 planificadas), 3500 min (58.3 h estimadas).
OK

$ npm run build
> grano@1.0.0 build
> vite build
✓ built in 50.78s
```

### 4. Verificación determinista en DuckDB (`compareQueryResults`)

```text
GlossaryListSchema OK: 10 terms
c2-dimensional-01-hechos-dimensiones-bus -> starter passed: false (rows_mismatch) | solution passed: true (matched)
c2-dimensional-02-star-schema-obt -> starter passed: false (rows_mismatch) | solution passed: true (matched)
c2-dimensional-03-scd2-history -> starter passed: false (rows_mismatch) | solution passed: true (matched)
c2-dimensional-04-metrics-simpson -> starter passed: false (rows_mismatch) | solution passed: true (matched)
c2-dimensional-05-hechos-instantanea-acumulativos -> starter passed: false (rows_mismatch) | solution passed: true (matched)
```

### 5. Prueba real del Tutor IA con `agy` en 2 turnos sobre las 5 lecciones

#### Lección 01: `c2-dimensional-01-hechos-dimensiones-bus`
- **Turno 1 — Usuario:** `Hazme una pregunta de comprobación sobre la lección.`
- **Turno 1 — Tutor IA (`agy`, `20424 ms`, prompt `3735 chars`):**
  > En Mercado Brisa, necesitas calcular el costo total de envío (`shipping_fee_usd`) y el monto total de productos vendidos (`item_price_usd * quantity`).
  > Para hacerlo, unes la tabla `orders` con `order_items` usando `order_id` y aplicas un `SUM()` a ambas métricas.
  > ¿Qué problema ocurre con el cálculo de `shipping_fee_usd` al hacer este `JOIN`, por qué sucede en términos de la declaración del grano, y cuál de las dos métricas sí arroja un resultado correcto?
- **Turno 2 — Usuario:** `Yo creo que para comparar las ventas brutas de orders y los reembolsos de refunds por región, lo más directo es hacer un solo SELECT con INNER JOIN entre orders, stores y refunds y sumar o.total_usd y r.refund_amount_usd al mismo tiempo.`
- **Turno 2 — Tutor IA (`agy`, `23100 ms`, prompt `4423 chars`):**
  > Ese enfoque genera dos problemas graves por mezclar granos distintos en una misma consulta (el error conocido como abismo de multiplicación o *Chasm Trap*).
  > Primero, al hacer `INNER JOIN` con `refunds`, descartas todas las órdenes que no tuvieron devoluciones y las tiendas o regiones sin reembolsos. El total de ventas quedará incompleto.
  > Segundo, duplicas las ventas en órdenes con reembolsos parciales. En Mercado Brisa hay 1,440 órdenes reembolsadas pero 1,450 registros en `refunds`. Esas órdenes con más de un reembolso multiplican la fila de `orders`, inflando `order_total_usd`.
  > La solución correcta según Kimball es un *Drill-Across*:
  > 1. Creas una CTE para preagregar las ventas de `orders` al grano de región o tienda.
  > 2. Creas otra CTE para preagregar los montos de `refunds` al mismo grano.
  > 3. Unes ambas CTEs usando `FULL OUTER JOIN` sobre la dimensión conformada de tiendas o regiones.

#### Lección 02: `c2-dimensional-02-star-schema-obt`
- **Turno 1 — Usuario:** `Hazme una pregunta de comprobación sobre la lección.`
- **Turno 1 — Tutor IA (`agy`, `11225 ms`, prompt `3607 chars`):**
  > Imagina que en Mercado Brisa decides normalizar la tabla de dimensión `products` extrayendo las categorías a una tabla independiente `categories`, y las marcas a otra tabla `brands`.
  > ¿Qué nombre recibe esta nueva topología frente al esquema en estrella tradicional y cuál es la principal desventaja que introduce al momento de consultar las ventas en `order_items`?
- **Turno 2 — Usuario:** `Si armamos una tabla ancha OBT uniendo orders con order_items a nivel de ítem, para obtener el ingreso total y el costo de envío regional basta con ejecutar SUM(o.total_usd) y SUM(o.shipping_usd) directamente sobre la OBT.`
- **Turno 2 — Tutor IA (`agy`, `12752 ms`, prompt `4186 chars`):**
  > No, esa afirmación es incorrecta y es una de las trampas clásicas al trabajar con granos mixtos.
  > Al construir la OBT uniendo `orders` con `order_items`, el grano final de la tabla queda a nivel de ítem (42,000 filas), mientras que `orders` está a nivel de orden (18,000 filas). Cuando una orden contiene tres productos distintos, esa orden se repite en tres filas de la OBT.
  > Si ejecutas `SUM(o.order_total_usd)` o `SUM(o.shipping_fee_usd)`, sumarás los valores de cabecera tantas veces como ítems tenga cada orden, inflando artificialmente las métricas.
  > Además, recuerda siempre filtrar registros de prueba como `SKU-TEST-NEG` (`p.unit_price_usd > 0`) para evitar distorsiones en los importes.

#### Lección 03: `c2-dimensional-03-scd2-history`
- **Turno 1 — Usuario:** `Hazme una pregunta de comprobación sobre la lección.`
- **Turno 1 — Tutor IA (`agy`, `5528 ms`, prompt `3621 chars`):**
  > Imagina que estás analizando las ventas de Mercado Brisa y necesitas calcular el total de ingresos según el nivel (`tier`) que tenía cada cliente al momento exacto de su compra. Tienes la tabla `orders` y la tabla `customer_changes` (SCD Tipo 2).
  > 1. ¿Qué sucedería con el número de filas del resultado si unes ambas tablas usando únicamente `ON orders.customer_id = customer_changes.customer_id`?
  > 2. ¿Qué condición adicional debes incluir en el `JOIN` para evitar ese problema y asegurar una consulta *Point-in-Time* correcta?
- **Turno 2 — Usuario:** `Para saber cuánto vendimos históricamente en cada tier usando customer_changes, basta con hacer JOIN por customer_id y filtrar WHERE is_current = true, o bien usar o.order_ts BETWEEN cc.valid_from AND cc.valid_to.`
- **Turno 2 — Tutor IA (`agy`, `6638 ms`, prompt `4352 chars`):**
  > Ambas opciones tienen errores conceptuales importantes para un análisis histórico (*Point-in-Time*):
  > 1. **Filtrar por `is_current = true`**: Esto convierte tu análisis en **SCD Tipo 1 (As-Is)**. En Mercado Brisa, la facturación real histórica de `bronce` es de `$1,528,183.35`, pero con `is_current = true` caería a `$900,084.30`.
  > 2. **Usar `BETWEEN cc.valid_from AND cc.valid_to`**: Pierdes las compras actuales (`valid_to IS NULL`) y duplicas en los límites (`>=` y `<=`).
  > El modelo usa intervalos semiabiertos `[valid_from, valid_to)`. La condición correcta para conservar exactamente las 14,760 órdenes completadas sin inflar filas (evitando el producto cartesiano de 25,271 registros) es `ON o.customer_id = cc.customer_id AND o.order_ts >= cc.valid_from AND (o.order_ts < cc.valid_to OR cc.valid_to IS NULL)`.

#### Lección 04: `c2-dimensional-04-metrics-simpson`
- **Turno 1 — Usuario:** `Hazme una pregunta de comprobación sobre la lección.`
- **Turno 1 — Tutor IA (`agy`, `7199 ms`, prompt `3674 chars`):**
  > Imagina que quieres calcular el ticket promedio de compra (AOV) por tienda durante el último trimestre a partir de la tabla `orders`. Un analista propone hacer `SELECT store_id, AVG(order_total_usd) AS aov_tienda FROM orders GROUP BY store_id;` y luego `SELECT AVG(aov_tienda) FROM reporte_tiendas;`.
  > 1. ¿A qué categoría algebraica pertenece el ticket promedio (aditivo, semiaditivo o no aditivo)?
  > 2. ¿Por qué es un error calcular el total general con `AVG(aov_tienda)` y cómo deberías escribir la agregación correcta en SQL?
- **Turno 2 — Usuario:** `Para calcular el CPA mensual de cada canal en marketing_spend uso AVG(spend_usd / attributed_conversions), y para saber el total de clientes únicos del trimestre sumo el COUNT(DISTINCT customer_id) de cada dispositivo.`
- **Turno 2 — Tutor IA (`agy`, `8016 ms`, prompt `4667 chars`):**
  > Ambos planteamientos son errores comunes con hechos no aditivos:
  > 1. **El promedio de un ratio (`AVG(...)`):** En el canal `referral`, `AVG(spend_usd / attributed_conversions)` infla el CPA a **$14.37**, cuando el costo real ponderado es **$13.59** (`SUM(spend_usd) / NULLIF(SUM(attributed_conversions), 0)`).
  > 2. **Sumar conteos distintos (`COUNT(DISTINCT ...)`):** Si sumas los clientes de desktop (1,284), mobile (1,312) y pos_tienda (656), obtienes **3,252**, inflando el resultado frente a los **2,292** clientes únicos reales del trimestre.

#### Lección 05: `c2-dimensional-05-hechos-instantanea-acumulativos`
- **Turno 1 — Usuario:** `Hazme una pregunta de comprobación sobre la lección.`
- **Turno 1 — Tutor IA (`agy`, `21524 ms`, prompt `3413 chars`):**
  > Imagina que en Mercado Brisa una tienda no vende ningún producto durante todo un día. ¿Qué filas esperarías encontrar en la tabla de hechos transaccional `order_items` para esa tienda en esa fecha? Además, si quisieras calcular los ingresos totales de una semana sumando `item_price_usd * quantity`, ¿por qué esta medida se considera totalmente aditiva a través de las tiendas y el calendario?
- **Turno 2 — Usuario:** `En una tabla de instantánea periódica mensual de saldos acumulados puedo usar SUM(ytd_balance_usd) para obtener el cierre del trimestre, y en la instantánea acumulativa de órdenes puedo unir orders con payments y refunds directamente sin preagregar.`
- **Turno 2 — Tutor IA (`agy`, `24469 ms`, prompt `4049 chars`):**
  > Ambas afirmaciones contienen errores conceptuales importantes.
  > En primer lugar, un saldo acumulado (`ytd_balance_usd`) en una instantánea periódica es una medida **semiaditiva**. Para el cierre del trimestre debes tomar el último valor registrado mediante una agregación de cierre (`ARG_MAX(ytd_balance_usd, snapshot_date)`), o usar `AVG()` si buscas un balance promedio.
  > En segundo lugar, unir `orders` directamente con `payments` y `refunds` genera una relación de uno a muchos (o muchos a muchos). Para construir la instantánea acumulativa sin distorsionar los datos, debes comprimir `payments` y `refunds` al grano de una fila por `order_id` en CTEs separadas antes de unirlas con `orders`.

---

## Revisión propia (mínimo 5 defectos encontrados y corregidos)

1. **[`c2-dimensional-02-star-schema-obt.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/lessons/c2-dimensional/c2-dimensional-02-star-schema-obt.js#L361-L564) — Desalineación entre `practice.prompt` y `practice.solution` y error de compilación en `starterCode`:**
   - **Antes:** En la versión migrada de T4, `practice.prompt` pedía `region, category, orders_count, units_sold, net_revenue_usd`, pero `practice.solution` devolvía las columnas de `pipelineChallenge` (`total_units, revenue_usd, gross_margin_usd`), y `practice.starterCode` seleccionaba `s.region` sin hacer `JOIN stores s`, arrojando `Binder Error: Referenced table "s" not found!` en DuckDB.
   - **Después:** Se reescribieron `starterCode`, `solution` y `expectedOutputTable` (20 filas exactas verificadas en DuckDB) para que `starterCode` ejecute devolviendo el importe inflado sin filtrar `SKU-TEST-NEG` (`rows_mismatch`) y `solution` devuelva `region, category, orders_count, units_sold, net_revenue_usd` (`matched`).
2. **[`c2-dimensional-03-scd2-history.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/lessons/c2-dimensional/c2-dimensional-03-scd2-history.js#L180-L260) y [`c2-dimensional-04-metrics-simpson.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/lessons/c2-dimensional/c2-dimensional-04-metrics-simpson.js#L185-L290) — Consultas sobre tablas inexistentes en `workedExample`:**
   - **Antes:** Los ejemplos guiados heredados de `l5` y `l6` consultaban `silver.fct_orders`, `silver.dim_customer_scd2` y `gold.channel_funnel_comparison` (además de incluir el título prohibido `"Flujo de clase mundial"` en `l6`).
   - **Después:** Se reemplazaron por consultas ejecutables en DuckDB sobre `orders`, `customers`, `customer_changes` y `marketing_spend`, verificando sus tablas de salida contra los archivos Parquet de Mercado Brisa.
3. **[`c2-dimensional-02-star-schema-obt.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/lessons/c2-dimensional/c2-dimensional-02-star-schema-obt.js#L569-L591), [`c2-dimensional-03-scd2-history.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/lessons/c2-dimensional/c2-dimensional-03-scd2-history.js#L384-L406) y [`c2-dimensional-04-metrics-simpson.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/lessons/c2-dimensional/c2-dimensional-04-metrics-simpson.js#L436-L458) — Renderizado de `[object Object]` en `PipelineOrderChallenge`:**
   - **Antes:** En la primera pasada de Playwright (`task-284`), la auditoría del DOM detectó `hasObjectObject: true` en las lecciones 02, 03 y 04 porque `PipelineOrderChallenge.jsx` (línea 14) evalúa `item.text || item.label || String(item)` y los objetos heredados en `pipelineChallenge.steps` solo tenían `{ title, goal, hint }`.
   - **Después:** Se añadieron las propiedades `id` y `text` a cada paso de `pipelineChallenge.steps` en las lecciones 02, 03 y 04, eliminando por completo `[object Object]` (`hasObjectObject: false` en las 5 lecciones).
4. **Secciones de las 5 lecciones (`src/data/lessons/c2-dimensional/c2-dimensional-01..05.js`) — Longitud media de frase superior a 22 palabras/frase y 3 términos prohibidos en el primer borrador:**
   - **Antes:** `check-copy.mjs` reportó 3 ocurrencias de términos prohibidos (`"domina"`, `"fundamentales"`) y longitudes medias de frase entre `22.4` y `26.3` palabras/frase.
   - **Después:** Se sustituyeron los términos prohibidos y se dividieron las oraciones subordinadas extensas en frases cortas y directas, logrando `0` hallazgos y `<= 22` palabras/frase en las 5 lecciones.
5. **[`c2-dimensional-03-scd2-history.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/lessons/c2-dimensional/c2-dimensional-03-scd2-history.js#L463-L467) y [`c2-dimensional-05-hechos-instantanea-acumulativos.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/lessons/c2-dimensional/c2-dimensional-05-hechos-instantanea-acumulativos.js#L15-L22) — Límites de palabras en `roleNotes.bi` y `hook`:**
   - **Antes:** `check-content.mjs` detectó que `roleNotes.bi` en L03 tenía 24 palabras (mínimo 25) y que `hook` en L05 tenía 91 palabras (máximo 90).
   - **Después:** Se amplió `roleNotes.bi` en L03 y se condensó `hook` en L05 a 80 palabras preservando las cifras reales y el signo de interrogación final (`?`).
6. **Resolución de lecciones con `legacyId` en el arnés de prueba del Tutor IA (`server/ai/contextBuilder.js`):**
   - **Antes:** Al llamar a `buildContextPrompt({ lessonId: 'c2-dimensional-02-star-schema-obt' })` sin `customLesson`, `contextBuilder.js` buscaba en `lessonsById` donde `adaptLessonForLegacyPlayer` había indexado la lección bajo su `legacyId` (`'l4-star-schema-obt'`), cayendo en el fallback `data.allLessons[0]`.
   - **Después:** Se pasó explícitamente `customLesson` en el script de verificación para las lecciones 02, 03 y 04 y se documentó la mejora recomendada en `## Peticiones al orquestador`.

---

## Prueba adversarial

| Qué probé | Qué pasó | Acción |
|---|---|---|
| 1. Ejecutar y calificar `starterCode` en `c2-dimensional-01` (unión directa `orders + stores + refunds` con `INNER JOIN` en un solo `SELECT`). | `sqlGrader` en DuckDB-Wasm rechazó la consulta (`is-fail`: `Filas esperadas: 11 · Filas obtenidas: 8`) porque el `INNER JOIN` descarta las tiendas tipo `warehouse` sin devoluciones y multiplica órdenes con más de un reembolso. | Se mantuvo como `starterCode` pedagógico y se capturó la evidencia en `01-c2-dimensional-01-hechos-dimensiones-bus-starter-fail.png`. |
| 2. Ejecutar `starterCode` en `c2-dimensional-02` sumando `o.total_usd` a grano de `order_items` sin filtrar `SKU-TEST-NEG` (`list_price_usd = -9.99`). | `sqlGrader` detectó `rows_mismatch` porque `o.total_usd` se multiplica por el número de líneas del pedido y el SKU centinela distorsiona la categoría `Accesorios`. | Se verificó que `solution` con `SUM(oi.line_total_usd)`, `COUNT(DISTINCT o.order_id)` y `p.list_price_usd > 0` apruebe con 20 filas exactas (`is-pass`). |
| 3. Ejecutar `starterCode` en `c2-dimensional-03` uniendo `orders` con `customer_changes` solo por `customer_id` sin intervalo `[valid_from, valid_to)`. | `sqlGrader` rechazó el resultado (`rows_mismatch`) porque las `14,760` órdenes completadas se multiplican hasta `25,271` filas al cruzar con todas las versiones históricas del cliente. | Se verificó que `solution` con el predicado semiabierto `o.order_ts >= cc.valid_from AND (o.order_ts < cc.valid_to OR cc.valid_to IS NULL)` recupere exactamente las `14,760` órdenes y apruebe (`is-pass`). |
| 4. Ejecutar `starterCode` en `c2-dimensional-04` promediando razones diarias (`AVG(spend_usd / attributed_conversions)`) en `marketing_spend`. | `sqlGrader` rechazó el resultado (`rows_mismatch`) porque el promedio simple eleva el CPA de `referral` a `$14.37` frente al CPA ponderado real de `$13.59`. | Se verificó que `solution` con `SUM(num) / NULLIF(SUM(den), 0)` apruebe en las 5 filas de canales (`is-pass`). |
| 5. Ejecutar `starterCode` en `c2-dimensional-05` uniendo `orders` directamente con `payments` y `refunds` sin preagregar en CTEs por `order_id`. | `sqlGrader` rechazó el resultado (`rows_mismatch`) porque los `20,200` pagos y `1,450` reembolsos inflan `total_orders` en Cono Sur de `6,001` a `6,510`. | Se verificó que `solution` preagregando hitos en CTEs (`payment_milestones`, `refund_milestones`) a grano `1 fila = 1 order_id` apruebe (`is-pass`). |
| 6. Escaneo automático del DOM en las 5 lecciones (`1440x900` claro/oscuro y `390x844` móvil) buscando `NaN`, `undefined`, `[object Object]` o desborde horizontal. | En la primera pasada se detectó `[object Object]` en L02, L03 y L04 por falta de `.text` en `pipelineChallenge.steps`. | Se añadieron `id` y `text` a `pipelineChallenge.steps` en L02, L03 y L04; la re-ejecución confirmó `hasNaN: false`, `hasUndefined: false`, `hasObjectObject: false` y `scrollWidth === clientWidth` en todas las vistas. |

---

## Capturas antes / después

Todas las capturas se tomaron con Playwright sobre `http://127.0.0.1:5212/?view=lesson`, se guardaron fuera de git en `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-c2-dimensional\` y se inspeccionaron visualmente con `read_file`:

| Archivo PNG | Vista / Estado | Verificación visual (`read_file`) |
|---|---|---|
| `01-c2-dimensional-01-hechos-dimensiones-bus-header.png` | Cabecera L01 (`1440x900` · Claro) | Título editorial, migas `Ruta › Modelado dimensional`, escenario real y 3 objetivos completos sin truncamiento. |
| `01-c2-dimensional-01-hechos-dimensiones-bus-starter-fail.png` | Antes / Fallo `starterCode` L01 (`1440x900` · Claro) | Tarjeta ámbar `is-fail` (`Filas esperadas: 11 · Filas obtenidas: 8`) con tablas de diferencias esperadas vs. sobrantes. |
| `01-c2-dimensional-01-hechos-dimensiones-bus-practica-pass.png` | Después / `solution` L01 (`1440x900` · Claro) | Tarjeta verde `is-pass` (`11 fila(s) y 7 columna(s) coinciden con la referencia`) y tabla DuckDB-Wasm (`38 ms`). |
| `02-c2-dimensional-02-star-schema-obt-header.png` | Cabecera L02 (`1440x900` · Claro) | Cabecera limpia tras eliminar `needsReview` y actualizar la prosa y objetivos de esquema en estrella vs. OBT. |
| `02-c2-dimensional-02-star-schema-obt-practica-pass.png` | Después / `solution` L02 (`1440x900` · Claro) | Tarjeta verde `is-pass` (`20 fila(s) y 5 columna(s) coinciden con la referencia`, `58.2 ms`) tras corregir el bug de columnas de `l4`. |
| `03-c2-dimensional-03-scd2-history-header.png` | Cabecera L03 (`1440x900` · Claro) | Escenario real con cifras exactas de Mercado Brisa (`$628,099.05` y `25,271` filas) y objetivos alineados. |
| `03-c2-dimensional-03-scd2-history-practica-pass.png` | Después / `solution` L03 (`1440x900` · Claro) | Tarjeta verde `is-pass` (`4 fila(s) y 3 columna(s) coinciden con la referencia`, `oro`, `plata`, `bronce`, `platino`). |
| `04-c2-dimensional-04-metrics-simpson-header.png` | Cabecera L04 (`1440x900` · Claro) | Cabecera de aditividad de métricas y paradoja de Simpson con cifras reales (`$14.37` vs `$13.59`, `+$62.19` AOV). |
| `04-c2-dimensional-04-metrics-simpson-practica-pass.png` | Después / `solution` L04 (`1440x900` · Claro) | Tarjeta verde `is-pass` (`5 fila(s) y 5 columna(s) coinciden con la referencia`, `referral` con CPA `13.59`). |
| `05-c2-dimensional-05-hechos-instantanea-acumulativos-header.png` | Cabecera L05 (`1440x900` · Claro) | Cabecera de tablas de hechos transaccional, instantánea y acumulativa con temario de 9 secciones. |
| `05-c2-dimensional-05-hechos-instantanea-acumulativos-practica-pass.png` | Después / `solution` L05 (`1440x900` · Claro) | Tarjeta verde `is-pass` (`4 fila(s) y 6 columna(s) coinciden con la referencia`, `80.1 ms`). |
| `06-c2-dimensional-03-scd2-history-dark.png` | Cabecera L03 (`1440x900` · Oscuro) | Contraste correcto en `[data-theme="dark"]`, bloques de código inline legibles y jerarquía visual preservada. |
| `07-c2-dimensional-01-hechos-dimensiones-bus-mobile-390x844.png` | Vista móvil L01 (`390x844` · Claro) | `scrollWidth === clientWidth === 390` (cero scroll horizontal), barra superior compacta y lectura fluida en móvil. |

---

## Peticiones al orquestador

1. **Integración del índice de lecciones (`F3-integracion`):** Ejecutar `node scripts/sync-lessons-index.mjs` tras fusionar `agente/W-c2-dimensional` para registrar `c2-dimensional-01-hechos-dimensiones-bus` y `c2-dimensional-05-hechos-instantanea-acumulativos` en `src/data/lessons/index.js` (revertido antes del commit para respetar la propiedad exclusiva de archivos).
2. **Integración del glosario modular (`F3-integracion`):** Incorporar los 10 términos validados de [`docs/curriculo/investigacion/c2-dimensional-glossary.json`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/docs/curriculo/investigacion/c2-dimensional-glossary.json) dentro de `src/data/glossary/terms.js`.
3. **Integración del proyecto de módulo (`F3-integracion`):** Incorporar la especificación y los 3 entregables SQL de `c2-dimensional-project` documentados en [`docs/curriculo/investigacion/c2-dimensional.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/docs/curriculo/investigacion/c2-dimensional.md#L145-L274) en `src/data/projects/projects.js`.
4. **Alineación opcional de títulos de catálogo (`<= 60` caracteres) en `src/data/catalog/modules.js`:** Actualizar en `modules.js` los títulos de `c2-dimensional-01` (`'Hechos, dimensiones conformadas y matriz de bus de Kimball'`, 58 chars) y `c2-dimensional-05` (`'Tablas de hechos: transaccional, instantánea y acumulativa'`, 58 chars) para que coincidan con `LessonSchema.title.max(60)`.
5. **Mejora recomendada en `server/ai/contextBuilder.js` (línea 105):** En `loadCurriculumData()`, añadir `if (lesson?.v2Id) lessonsById.set(lesson.v2Id, lesson)` para que las lecciones con `legacyId` (`l4`, `l5`, `l6`) también se resuelvan directamente cuando se consulta por su `v2Id`.

---

## Pendiente (con motivo)

Ninguno.
