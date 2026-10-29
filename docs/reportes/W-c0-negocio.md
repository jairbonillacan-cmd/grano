# W-c0-negocio — Negocio para gente de datos

**Estado**: `PASS`
**Rama**: `agente/W-c0-negocio`
**Fecha**: `2026-10-29`

---

## Inicio

### 1. Los 3 puntos principales de la tarea

1. **Investigación curricular, mapa conceptual y rúbrica del proyecto (`docs/curriculo/investigacion/c0-negocio.md`) y glosario (`docs/curriculo/investigacion/c0-negocio-glossary.json`)**: documentar para cada una de las 4 lecciones al menos 3 fuentes reales `https://` con fecha de consulta `2026-10-29` (mínimo 2 primarias por lección: IFRS 15, Kimball Group, Amplitude Docs, Google Analytics 4 Docs, Parmenter, Kohavi et al., CRISP-DM IBM, dbt Semantic Layer, DuckDB Docs), definir la progresión conceptual sin saltos, diseñar la rúbrica verificable de 4 criterios (escala 0–4) para el proyecto del módulo y registrar 8 términos del glosario validados con `GlossarySchema`.
2. **Redacción íntegra y código SQL ejecutable de las 4 lecciones de `c0-negocio` (`src/data/lessons/c0-negocio/*.js`)**: escribir `c0-negocio-01-ingreso-costo-margen.js`, `c0-negocio-02-embudos-conversion.js`, `c0-negocio-03-kpi-metrica-vanidad.js` y `c0-negocio-04-pregunta-a-decision.js` en Nivel 0 (`tracks: ['core']`), con datos reales ejecutados en DuckDB sobre `public/datasets/mercado_brisa/*.parquet` (semilla `19870315`), cumpliendo el estilo editorial sobrio del Apéndice A (`check-copy.mjs` con 0 hallazgos y `<= 22` palabras/frase) y el esquema Zod (`check-content.mjs --module c0-negocio` con 0 errores y 0 advertencias).
3. **Verificación integral en navegador (`1280×720`), laboratorio SQL DuckDB-Wasm y tutor IA (`agy`)**: comprobar que las 4 lecciones se renderizan completas en tema claro y oscuro sin desbordes, que todas las comprobaciones muestran retroalimentación por opción, que las 4 prácticas SQL se ejecutan y validan contra la referencia en DuckDB-Wasm, que el tutor IA abre con `/` y con el botón de cabecera y detecta respuestas erróneas deliberadas usando `aiNotes`, y tomar las 8 capturas `1280×720` inspeccionadas con `read_file`.

### 2. Archivos leídos antes de empezar (con 1 dato técnico concreto aprendido por archivo)

1. `PLAN_GEMINI_4_ARGON.md`: aprendí que el procedimiento de 7 pasos (§9.2) y la rúbrica de calidad (§9.4) exigen evaluar cada lección en 8 criterios en escala `0–4` (`Objetivo claro`, `Progresión`, `Ejemplo concreto`, `Error típico`, `Práctica`, `Brevedad`, `Precisión`, `Tono`, exigiendo `>= 3` en todos y `4` en `Ejemplo concreto`, `Práctica` y `Precisión`).
2. `src/data/catalog/modules.js`: aprendí que el módulo `c0-negocio` pertenece a `track: 'core'`, `level: 0`, con tiempos de lectura asignados `[20, 15, 20, 15]` minutos para sus 4 lecciones y con el proyecto `c0-negocio-proj` (*"Hoja de métricas de una tienda"*).
3. `public/datasets/README.md`: aprendí que el dataset determinista **Mercado Brisa** (semilla `19870315`) incluye anomalías sembradas intencionalmente para la enseñanza: `SKU-TEST-NEG` (`product_id = 180`, `list_price_usd = -15.00`), `351` filas duplicadas de webhooks en `payments` (`16 551` filas capturadas frente a `16 200` `idempotency_key` únicos) y sesgo SRM en el experimento `EXP-PUSH-CART` (`980` en `control` frente a `620` en `treatment`, estado `stopped_srm`).
4. `public/datasets/schema.json`: aprendí los nombres y tipos exactos de las columnas en los 13 archivos Parquet (como `subtotal_usd`, `discount_usd`, `shipping_usd`, `tax_usd`, `total_usd` en `orders`, `unit_cost_usd` en `products`, `refund_amount_usd` y `reason` en `refunds`, y `spend_usd` y `attributed_conversions` en `marketing_spend`).
5. `src/data/schema/lesson.js`: aprendí que para una lección de Nivel 0 (`level: 0`), `countLessonWords` exige estrictamente entre `700` y `1100` palabras visibles, cada sección de `roleNotes` (`de`, `da`, `bi`) debe tener entre `25` y `70` palabras, `checks` requiere al menos 2 tipos distintos entre sus `>= 2` ítems, y `sources` exige al menos 3 URLs `https://` con fecha ISO `YYYY-MM-DD`.
6. `src/data/schema/glossary.js`: aprendí que `GlossaryTermSchema` valida que `id` cumpla `/^[a-z0-9-]+$/`, `definition` tenga al menos 20 caracteres, `sqlExample` sea opcional y `relatedTerms` sea un arreglo de IDs en kebab-case.
7. `scripts/check-content.mjs`: aprendí que el validador comprueba además de Zod la unicidad de IDs de lecciones, la existencia de `moduleId` en `src/data/catalog/modules.js`, la validez de `prerequisites` y la ausencia de la bandera `needsReview`.
8. `scripts/check-copy.mjs`: aprendí que el auditor anti-slop escanea términos prohibidos (ES/EN), anglicismos evitables, el año literal `"2026"` fuera de fechas ISO/URLs, emojis, párrafos con más de 3 apariciones de `**` y lecciones cuya media en `sections[].body` supere `22` palabras por frase.
9. `package.json`: aprendí los scripts oficiales de validación (`check:content`, `check:copy`, `build`) y las dependencias instaladas (`@duckdb/node-api`, `@duckdb/duckdb-wasm`, `zod`, `@playwright/test`).
10. `vite.config.js`: aprendí que `granoAiPlugin()` de `./server/ai/routes.js` se monta tanto en `configureServer` como en `configurePreviewServer`, inyectando `<meta name="grano-session">` y sirviendo `/api/ai/*` en ambos modos.
11. `src/main.jsx`: aprendí que antes de montar `<App />`, el arranque ejecuta `migrateLegacyStorage()` e `initThemeSync()`, sincronizando el estado persistido bajo la clave `grano:v1`.
12. `src/App.jsx`: aprendí cómo `useAppController()` conecta `LessonPlayer`, `PracticeView`, `CommandPaletteModal` (`Ctrl+K`) y `TutorPanel` según `viewMode` (`lesson`, `practice`, `roadmap`, etc.).
13. `src/styles/tokens.css`: aprendí la paleta editorial cálida en espacio OKLCH (`--bg`, `--surface`, `--ink`, `--accent`, `--code-bg`) y las tipografías `Newsreader`, `IBM Plex Sans` e `IBM Plex Mono` para tema claro y oscuro.
14. `scripts/generate-dataset.mjs`: aprendí las distribuciones exactas con las que se generan las 13 tablas de Mercado Brisa (por ejemplo, que los pedidos tienen estados `completed` 82 %, `refunded` 8 %, `cancelled` 6 % y `pending` 4 %, y que las campañas `CMP-RETENCION` y `CMP-VERANO` concentran las devoluciones).
15. `scripts/sync-lessons-index.mjs`: aprendí que el script escanea recursivamente `src/data/lessons/**/*.js`, ordena por nivel y módulo, y regenera `src/data/lessons/index.js` exportando `LESSONS_V2`, `LESSONS`, `LESSONS_BY_ID` y `MODULES`.

### 3. Las 3 decisiones principales y su justificación

1. **Reconciliación contable y operativa real sobre Mercado Brisa con `@duckdb/node-api` antes de redactar**: antes de escribir una sola cifra en las lecciones, ejecutamos todas las consultas de ejemplo, `workedExample` y `practice` directamente sobre los 13 ficheros Parquet de `public/datasets/mercado_brisa/` para garantizar que cada tabla `expectedOutput`, cada monto en dólares y cada tasa porcentual coincidan al centavo con lo que DuckDB-Wasm devuelve en el navegador.
2. **Progresión acumulativa apoyada en las anomalías reales del dataset sin saltos técnicos de Nivel 1+**: dado que `c0-negocio` es Nivel 0, evitamos funciones de ventana (`OVER (PARTITION BY ...)`), subconsultas correlacionadas complejas o modelado SCD2, y en su lugar enseñamos a detectar los problemas reales del negocio en Mercado Brisa (impuestos incluidos en `total_usd`, duplicación por `JOIN` `1:N` con `order_items` y `refunds`, reintentos de webhooks en `payments` con `16 551` filas frente a `16 200` `idempotency_key` únicos, `SKU-TEST-NEG` con precio `-15,00` USD y el experimento `EXP-PUSH-CART` invalidado por sesgo SRM `980` vs `620`) mediante agregaciones claras, `COUNT(DISTINCT ...)`, `FILTER (WHERE ...)` y CTEs limpias.
3. **Aislamiento de los términos de glosario en `docs/curriculo/investigacion/c0-negocio-glossary.json`**: para respetar la propiedad exclusiva de archivos de la Ola A y evitar conflictos de merge en `src/data/glossary/terms.json` o `src/data/lessons/index.js`, depositamos los 8 términos validados por `GlossarySchema` en `docs/curriculo/investigacion/c0-negocio-glossary.json` y restauramos `src/data/lessons/index.js` tras las pruebas de navegador y compilación.

---

## Tabla resumen de las lecciones del módulo (§9.2)

| Lección | Palabras | Checks | Prácticas | Fuentes | Puntuación de rúbrica (§9.4) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `c0-negocio-01-ingreso-costo-margen` | `913` | `3` (`mcq`, `predict-output`, `order`) | `1` (`sql` ejecutable en DuckDB) | `3` (3 primarias `https://`) | **32 / 32** |
| `c0-negocio-02-embudos-conversion` | `967` | `3` (`mcq`, `predict-output`, `order`) | `1` (`sql` ejecutable en DuckDB) | `3` (3 primarias `https://`) | **32 / 32** |
| `c0-negocio-03-kpi-metrica-vanidad` | `885` | `3` (`mcq`, `predict-output`, `mcq`) | `1` (`sql` ejecutable en DuckDB) | `3` (2 primarias + 1 libro ref.) | **32 / 32** |
| `c0-negocio-04-pregunta-a-decision` | `904` | `3` (`mcq`, `order`, `predict-output`) | `1` (`sql` ejecutable en DuckDB) | `3` (3 primarias `https://`) | **32 / 32** |

---

## Desarrollo — Pasos 1 a 7 del procedimiento (§9.2)

### Paso 1 — Investigación de fuentes (`docs/curriculo/investigacion/c0-negocio.md`)

Se documentaron 12 fuentes reales con URL `https://` verificada, fecha de consulta `2026-10-29` y nota explícita de respaldo (`supports`), con al menos 2 fuentes primarias por lección:

- **`c0-negocio-01-ingreso-costo-margen`**:
  1. IFRS Foundation — *IFRS 15 Revenue from Contracts with Customers* (`https://www.ifrs.org/issued-standards/list-of-standards/ifrs-15-revenue-from-contracts-with-customers/`, primaria).
  2. Kimball Group — *The Data Warehouse Toolkit: Additive, Semi-Additive, and Non-Additive Facts* (`https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/additive-semi-additive-non-additive-facts/`, primaria).
  3. DuckDB Foundation — *Aggregate Functions (`SUM`, `AVG`, `COALESCE`, `ROUND`)* (`https://duckdb.org/docs/sql/functions/aggregates.html`, primaria).
- **`c0-negocio-02-embudos-conversion`**:
  1. Amplitude Documentation — *Funnel Analysis: Conversion, Drop-off, and Counting By Unique Users* (`https://amplitude.com/docs/analytics/charts/funnel-analysis/funnel-analysis-interpret`, primaria).
  2. Google Analytics 4 Documentation — *Explore Funnel: Open vs. Closed Funnels and Step Elapsed Time* (`https://support.google.com/analytics/answer/9327974`, primaria).
  3. DuckDB Foundation — *FILTER Clause in Aggregate Functions* (`https://duckdb.org/docs/sql/query_syntax/filter.html`, primaria).
- **`c0-negocio-03-kpi-metrica-vanidad`**:
  1. David Parmenter — *Key Performance Indicators (KPI): Developing, Implementing, and Using Winning KPIs, 4th Edition* (`https://www.wiley.com/en-us/Key+Performance+Indicators+%28KPI%29%3A+Developing%2C+Implementing%2C+and+Using+Winning+KPIs%2C+4th+Edition-p-9781119620778`, libro de referencia).
  2. Ron Kohavi, Diane Tang, Ya Xu — *Trustworthy Online Controlled Experiments: Goal Metrics and Guardrail Metrics* (`https://experimentguide.com/`, primaria).
  3. dbt Labs — *dbt Semantic Layer & MetricFlow: Metric Definitions, Grain, and Filters* (`https://docs.getdbt.com/docs/build/metrics-overview`, primaria).
- **`c0-negocio-04-pregunta-a-decision`**:
  1. IBM Documentation — *CRISP-DM: Business Understanding Phase (Determine Business Objectives and Data Mining Goals)* (`https://www.ibm.com/docs/en/spss-modeler/saas?topic=dm-crisp-help-overview`, primaria).
  2. Ron Kohavi et al. — *Sample Ratio Mismatch (SRM) and Data Quality Guardrails* (`https://experimentguide.com/srm/`, primaria).
  3. DuckDB Foundation — *Common Table Expressions (`WITH` Clause) and `GROUP BY`* (`https://duckdb.org/docs/sql/query_syntax/with.html`, primaria).

### Paso 2 — Mapa de conceptos y dependencias

Documentado en `docs/curriculo/investigacion/c0-negocio.md`:
- **Conexión de entrada**: `c0-pensar` introduce el concepto de fila, grano y agregación básica; `c0-negocio` traduce esas operaciones a magnitudes financieras y operativas reales sin requerir aún `WINDOW FUNCTIONS` ni modelado dimensional (Nivel 2).
- **Secuencia interna**:
  1. `c0-negocio-01-ingreso-costo-margen` (`prerequisites: []`): anatomía económica de un pedido (`subtotal_usd`, `discount_usd`, `tax_usd`, `refunds`, `unit_cost_usd`), ingreso bruto frente a ingreso neto, costo directo (COGS), margen bruto y no-aditividad de porcentajes (`SUM(margen) / SUM(ingreso)` frente a `AVG(margen_pct)`).
  2. `c0-negocio-02-embudos-conversion` (`prerequisites: ['c0-negocio-01-ingreso-costo-margen']`): unidad de conteo única (`COUNT(DISTINCT customer_id)` / `COUNT(DISTINCT idempotency_key)`), conversión paso a paso frente a conversión global, tasa de caída (*drop-off*), embudos cerrados frente a abiertos y localización del cuello de botella con `FILTER (WHERE ...)`.
  3. `c0-negocio-03-kpi-metrica-vanidad` (`prerequisites: ['c0-negocio-02-embudos-conversion']`): distinción entre contadores acumulativos de vanidad (`SUM(impressions)`) y KPIs accionables (CPA `SUM(spend_usd) / SUM(attributed_conversions)`), los 5 componentes de un KPI (fórmula, grano, filtro canónico, ventana temporal, umbral) y métricas guardia (*guardrails* como la tasa de reembolsos por campaña).
  4. `c0-negocio-04-pregunta-a-decision` (`prerequisites: ['c0-negocio-03-kpi-metrica-vanidad']`): traducción de preguntas ambiguas de dirección en hipótesis refutables (palanca, segmento, métrica objetivo, umbral previo), fijación del umbral de decisión antes de mirar el dato y auditoría de integridad muestral (`EXP-CHECKOUT-1STEP` equilibrado `800/800` frente a `EXP-PUSH-CART` con sesgo SRM `980/620`).

### Paso 3 — Guion de cada lección

Cada una de las 4 lecciones fue estructurada con:
- `hook` contextualizado en **Mercado Brisa (empresa ficticia)** en la primera mención.
- 3 `objectives` claros con verbos de acción medibles.
- 3 `sections` con prosa directa, ejemplos SQL ejecutables con `expectedOutput` real y enlaces orgánicos a términos del glosario (`glossaryTerms`).
- 1 `workedExample` de 2 pasos (*Paso 1: antipatrón con error de negocio/grano* frente a *Paso 2: solución verificada*) con salidas reales de DuckDB.
- 3 `checks` de al menos 2 tipos distintos por lección (`mcq`, `predict-output`, `order`) con retroalimentación específica por opción (`feedback`) y `explanation`.
- 1 `practice` SQL ejecutable (`type: 'sql'`) con `starterCode`, `expected`, `solution`, `expectedOutput`, 3 `hints` progresivas y `solutionExplanation`.
- `roleNotes` específicas para `de`, `da` y `bi` (entre 25 y 70 palabras cada una).
- `summary` (4 puntos), `flashcards` (3 tarjetas FSRS) y `aiNotes` con las confusiones frecuentes de negocio y SQL para guiar al tutor IA.

### Paso 4 — Redacción y código ejecutable

Todas las consultas de `sections[].example`, `workedExample.steps[]` y `practice` se ejecutaron con `@duckdb/node-api` y con DuckDB-Wasm en el navegador sobre `public/datasets/mercado_brisa/*.parquet`:

| Lección | Palabras visibles (rango Nivel 0: 700–1100) | Media palabras/frase (límite `<= 22`) | Práctica SQL verificada en DuckDB |
| :--- | :---: | :---: | :--- |
| `c0-negocio-01-ingreso-costo-margen` | `913` | `<= 22` | Ingreso neto por `device_type` descontando devoluciones pre-agregadas en CTE (`3 filas × 6 columnas`). |
| `c0-negocio-02-embudos-conversion` | `967` | `<= 22` | Embudo de pedidos por campaña con cláusula `FILTER (WHERE ...)` (`5 filas × 5 columnas`). |
| `c0-negocio-03-kpi-metrica-vanidad` | `885` | `<= 22` | Ranking de los 5 canales en `marketing_spend` por CPA frente a impresiones de vanidad (`5 filas × 6 columnas`). |
| `c0-negocio-04-pregunta-a-decision` | `904` | `<= 22` | Priorización de los 3 segmentos (`pro_barista`, `retail`, `cafeteria_b2b`) por ticket neto medio y margen bruto (`3 filas × 6 columnas`). |

### Paso 5 — Términos de glosario (`docs/curriculo/investigacion/c0-negocio-glossary.json`)

Se redactaron y validaron con `validateGlossary` 8 términos nuevos vinculados a las 4 lecciones:
1. `ingreso-neto` (*Ingreso neto / Net Revenue*) — `c0-negocio-01-ingreso-costo-margen`
2. `margen-bruto` (*Margen bruto / Gross Margin*) — `c0-negocio-01-ingreso-costo-margen`
3. `embudo-conversion` (*Embudo de conversión / Conversion Funnel*) — `c0-negocio-02-embudos-conversion`
4. `tasa-caida-dropoff` (*Tasa de caída / Drop-off Rate*) — `c0-negocio-02-embudos-conversion`
5. `kpi-vs-metrica-vanidad` (*KPI frente a métrica de vanidad*) — `c0-negocio-03-kpi-metrica-vanidad`
6. `metrica-guardia` (*Métrica guardia / Guardrail Metric*) — `c0-negocio-03-kpi-metrica-vanidad`
7. `hipotesis-refutable` (*Hipótesis de negocio refutable*) — `c0-negocio-04-pregunta-a-decision`
8. `umbral-decision` (*Umbral de decisión / Decision Threshold*) — `c0-negocio-04-pregunta-a-decision`

### Paso 6 — Proyecto del módulo (`docs/curriculo/investigacion/c0-negocio.md`)

Se documentó en `docs/curriculo/investigacion/c0-negocio.md` (§ Paso 6) la rúbrica de evaluación en escala 0–4 con evidencia verificable para los 4 criterios del proyecto *"Hoja de métricas de una tienda"*:
1. **Separación contable y reconciliación de ingreso bruto, ingreso neto y margen bruto** (exclusión de `cancelled`/`pending`, exclusión de `tax_usd`, pre-agregación de `refunds` y `order_items`, reconciliación exacta: ingreso neto `5 742 529,97` USD y margen bruto `2 718 073,37` USD / `47,33 %`).
2. **Construcción del embudo con unidad única y diagnóstico del cuello de botella** (`COUNT(DISTINCT customer_id)` en `events` o `COUNT(DISTINCT idempotency_key)` en `payments`, cálculo de conversión paso a paso y tasa de caída).
3. **Sustitución de métricas de vanidad por KPIs con 5 componentes y métrica guardia** (reemplazo de impresiones/pedidos brutos por CPA e ingreso neto más tasa de reembolsos como *guardrail*, detectando `CMP-RETENCION` `19,18 %` y `CMP-VERANO` `18,46 %`).
4. **Traducción de preguntas ambiguas a hipótesis refutables con umbral previo y control de calidad** (desglose de motivos de reembolso liderado por `tueste_incorrecto` con `65 909,73` USD, evaluación del descuento del 5 % en cabecera y bloqueo de `EXP-PUSH-CART` por sesgo SRM `980` frente a `620`).

### Paso 7 — Autoevaluación con la rúbrica de 8 criterios (§9.4, escala 0–4)

Criterios de §9.4: **1. Objetivo claro**, **2. Progresión**, **3. Ejemplo concreto** (obligatorio `4`), **4. Error típico**, **5. Práctica** (obligatorio `4`), **6. Brevedad**, **7. Precisión** (obligatorio `4`), **8. Tono** (mínimo `>= 3` en todos):

| Lección | 1. Objetivo claro (0–4) | 2. Progresión (0–4) | 3. Ejemplo concreto (0–4) | 4. Error típico (0–4) | 5. Práctica (0–4) | 6. Brevedad (0–4) | 7. Precisión (0–4) | 8. Tono (0–4) | Total (/32) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `c0-negocio-01-ingreso-costo-margen` | **4** (3 objetivos medibles con verbos de acción sobre ingreso neto, COGS y margen) | **4** (de los 5 importes de `orders` a `order_items`/`products` y a la no-aditividad de porcentajes sin saltos) | **4** (`workedExample` ejecutable sobre Mercado Brisa: `LEFT JOIN` sin `COALESCE` vs CTEs reconciliadas al centavo) | **4** (contrasta tomar `total_usd` con impuestos, olvidar `COALESCE` y promediar porcentajes con `AVG()`) | **4** (práctica SQL real por `device_type` con 3 pistas graduales y validación en DuckDB-Wasm) | **4** (`913` palabras visibles dentro de `700–1100`, frases `<= 22` palabras) | **4** (4 consultas verificadas en DuckDB y 3 fuentes primarias IFRS 15 / Kimball / DuckDB) | **4** (español neutro, tuteo directo, 0 hallazgos en `check-copy.mjs`) | **32 / 32** |
| `c0-negocio-02-embudos-conversion` | **4** (3 objetivos medibles sobre `COUNT(DISTINCT)`, conversión paso a paso y cuello de botella) | **4** (de la unidad de conteo única a las fórmulas de conversión/drop-off y embudos cerrados vs abiertos) | **4** (`workedExample` ejecutable comparando `COUNT(*)` con webhooks repetidos en `payments` frente a `idempotency_key` únicos) | **4** (contrasta contar eventos brutos y confundir denominador `N_{k-1}` con `N_1`) | **4** (práctica SQL con `FILTER (WHERE ...)` por campaña, 3 pistas graduales y validación en DuckDB-Wasm) | **4** (`967` palabras visibles dentro de `700–1100`, frases `<= 22` palabras) | **4** (4 consultas verificadas en DuckDB y 3 fuentes primarias Amplitude / GA4 / DuckDB) | **4** (español neutro, tuteo directo, 0 hallazgos en `check-copy.mjs`) | **32 / 32** |
| `c0-negocio-03-kpi-metrica-vanidad` | **4** (3 objetivos medibles sobre métricas de vanidad, los 5 componentes de un KPI y métricas guardia) | **4** (de identificar contadores acumulativos a especificar el contrato de 5 piezas y protegerlo con un *guardrail*) | **4** (`workedExample` ejecutable mostrando el empate aparente de 3 000 pedidos por campaña frente al 19,18 % de reembolsos en `CMP-RETENCION`) | **4** (contrasta premiar impresiones brutas, promediar CPAs con `AVG()` e ignorar devoluciones en `refunds`) | **4** (práctica SQL sobre `marketing_spend` calculando CTR y CPA por canal con 3 pistas y validación en DuckDB-Wasm) | **4** (`885` palabras visibles dentro de `700–1100`, frases `<= 22` palabras) | **4** (3 consultas verificadas en DuckDB y 3 fuentes verificadas Parmenter / Kohavi / dbt) | **4** (español neutro, tuteo directo, 0 hallazgos en `check-copy.mjs`) | **32 / 32** |
| `c0-negocio-04-pregunta-a-decision` | **4** (3 objetivos medibles sobre hipótesis refutable, desglose dimensional y umbral de decisión previo) | **4** (de acotar preguntas vagas a fijar umbrales pre-consulta y auditar sesgo SRM en muestras) | **4** (`workedExample` ejecutable contrastando el promedio global engañoso frente al desglose por segmento con y sin cupón del 5 %) | **4** (contrasta fijar el umbral después de ver los datos y aprobar `EXP-PUSH-CART` pese al sesgo SRM `980` vs `620`) | **4** (práctica SQL priorizando segmentos por ticket neto y margen bruto con 3 pistas y validación en DuckDB-Wasm) | **4** (`904` palabras visibles dentro de `700–1100`, frases `<= 22` palabras) | **4** (4 consultas verificadas en DuckDB y 3 fuentes primarias CRISP-DM / Kohavi SRM / DuckDB) | **4** (español neutro, tuteo directo, 0 hallazgos en `check-copy.mjs`) | **32 / 32** |

---

## Test

### 1. Validación estructural y de esquema (`scripts/check-content.mjs`)

Comando ejecutado:
```bash
node scripts/check-content.mjs --module c0-negocio
```
Salida:
```text
=== Validación de contenido v2 (check-content) ===
Lección (id v2)                                | Módulo               | Niv  | Sec  | Chk  | Src  | Palabras  | Estado    
--------------------------------------------------------------------------------------------------------------------------
c0-negocio-01-ingreso-costo-margen             | c0-negocio           | 0    | 3    | 3    | 3    | 913       | OK        
c0-negocio-02-embudos-conversion               | c0-negocio           | 0    | 3    | 3    | 3    | 967       | OK        
c0-negocio-03-kpi-metrica-vanidad              | c0-negocio           | 0    | 3    | 3    | 3    | 885       | OK        
c0-negocio-04-pregunta-a-decision              | c0-negocio           | 0    | 3    | 3    | 3    | 904       | OK        
--------------------------------------------------------------------------------------------------------------------------
Resumen: 4 lecciones inspeccionadas | 4 válidas | 0 con advertencias (needsReview) | 0 con errores.

Resultado: OK (0 errores de esquema o integridad).
```

### 2. Auditoría anti-slop y longitud de frases (`scripts/check-copy.mjs`)

Comando ejecutado:
```bash
node scripts/check-copy.mjs --path src/data/lessons/c0-negocio --path docs/curriculo/investigacion/c0-negocio.md
```
Salida:
```text
=== Auditoría anti-slop de copy (check-copy) ===
Archivos escaneados: 5
0 hallazgos de términos prohibidos, emojis, "2026" o exceso de negritas.
Total de hallazgos: 0
```
Ninguna de las 4 lecciones de `c0-negocio` supera el límite de `22` palabras/frase de media en `sections[].body`.

### 3. Validación de esquema del glosario (`validateGlossary`)

Comando ejecutado:
```bash
node -e "import fs from 'node:fs'; import { validateGlossary } from './src/data/schema/index.js'; const g = JSON.parse(fs.readFileSync('docs/curriculo/investigacion/c0-negocio-glossary.json', 'utf8')); console.log(validateGlossary(g));"
```
Salida:
```text
{ success: true, data: [ ... 8 terms ... ] }
```

### 4. Compilación de producción (`npm run build`)

Comando ejecutado:
```bash
npm run build
```
Salida:
```text
vite v6.4.5 building for production...
✓ 2353 modules transformed.
✓ built in 50.76s
```

### 5. Verificación en navegador (`1280×720`) y DuckDB-Wasm (`capture_and_test.mjs`)

Salida literal de `capture_and_test.mjs`:
```json
{
  "results": [
    {
      "id": "c0-negocio-01-ingreso-costo-margen",
      "renderedTitle": "Ingreso bruto, descuentos, devoluciones y margen bruto",
      "labTitle": "Ingreso neto por tipo de dispositivo descontando devoluciones",
      "darkOverflow": false,
      "lightOverflow": false,
      "domAudit": {
        "sectionsCount": 9,
        "checksCount": 3,
        "hasWorkedExample": true,
        "hasRoleNotes": true,
        "sourcesLinksCount": 3
      },
      "feedbacksShown": 3,
      "tutorBySlash": true,
      "tutorByBtn": true,
      "gradeText": "Práctica superada · El resultado coincide con la referenciaResultado verificado: 3 fila(s) y 6 columna(s) coinciden con la referencia."
    },
    {
      "id": "c0-negocio-02-embudos-conversion",
      "renderedTitle": "Embudos de adquisición y conversión paso a paso",
      "labTitle": "Embudo de pedidos por campaña con cláusula FILTER",
      "darkOverflow": false,
      "lightOverflow": false,
      "domAudit": {
        "sectionsCount": 9,
        "checksCount": 3,
        "hasWorkedExample": true,
        "hasRoleNotes": true,
        "sourcesLinksCount": 3
      },
      "feedbacksShown": 3,
      "tutorBySlash": true,
      "tutorByBtn": true,
      "gradeText": "Práctica superada · El resultado coincide con la referenciaResultado verificado: 5 fila(s) y 5 columna(s) coinciden con la referencia."
    },
    {
      "id": "c0-negocio-03-kpi-metrica-vanidad",
      "renderedTitle": "Qué hace útil a un KPI frente a una métrica de vanidad",
      "labTitle": "Ranking de canales por Costo de Adquisición (CPA) frente a impresiones",
      "darkOverflow": false,
      "lightOverflow": false,
      "domAudit": {
        "sectionsCount": 9,
        "checksCount": 3,
        "hasWorkedExample": true,
        "hasRoleNotes": true,
        "sourcesLinksCount": 3
      },
      "feedbacksShown": 3,
      "tutorBySlash": true,
      "tutorByBtn": true,
      "gradeText": "Práctica superada · El resultado coincide con la referenciaResultado verificado: 5 fila(s) y 6 columna(s) coinciden con la referencia."
    },
    {
      "id": "c0-negocio-04-pregunta-a-decision",
      "renderedTitle": "De la pregunta ambigua a la decisión respaldada por datos",
      "labTitle": "Priorización de segmentos de clientes por ticket neto y margen bruto",
      "darkOverflow": false,
      "lightOverflow": false,
      "domAudit": {
        "sectionsCount": 9,
        "checksCount": 3,
        "hasWorkedExample": true,
        "hasRoleNotes": true,
        "sourcesLinksCount": 3
      },
      "feedbacksShown": 3,
      "tutorBySlash": true,
      "tutorByBtn": true,
      "gradeText": "Práctica superada · El resultado coincide con la referenciaResultado verificado: 3 fila(s) y 6 columna(s) coinciden con la referencia."
    }
  ],
  "consoleErrors": []
}
```

### 6. Salida literal del Tutor IA (`agy`) en las 4 lecciones (`test_ai_tutor.mjs`)

En cada lección se pidió al tutor **"Hazme una pregunta para comprobar si lo entendí"** y a continuación se envió una respuesta errónea a propósito para verificar que detecta el fallo usando `aiNotes`:

```text
================ c0-negocio-01-ingreso-costo-margen ================
Tutor Question: Imagina que un cliente compra café en Mercado Brisa. El cobro final en su tarjeta es de 100 USD (`total_usd`). 

Dentro de esos 100 USD se incluyen 10 USD de impuestos (`tax_usd`). Además, el cliente usó un cupón de descuento de 5 USD (`discount_usd`). El pedido ya fue entregado y no tuvo devoluciones.

¿Por qué no podemos decir que los 100 USD cobrados son el ingreso real de Mercado Brisa y qué parte de ese dinero no le pertenece a la tienda?

Tutor Evaluation of Wrong Answer: Esa afirmación tiene tres errores importantes:

1. **`total_usd` no es el ingreso de la tienda**: Incluye impuestos (`tax_usd`). Ese dinero se recauda para la autoridad fiscal y nunca pertenece a Mercado Brisa. El ingreso parte de la mercancía (`subtotal_usd`), restando descuentos y devoluciones, no del total de la tarjeta.

2. **`INNER JOIN` excluye pedidos válidos**: Si unes `orders` con `refunds` mediante un `INNER JOIN`, descartas todos los pedidos que nunca tuvieron devoluciones (la gran mayoría). Solo contarías los pedidos devueltos.

3. **SQL sí duplica filas de cabecera**: Si un pedido tiene tres productos en `order_items`, el cruce genera tres filas con el mismo `order_id`. Al hacer `SUM(o.total_usd)`, sumas ese importe tres veces en vez de una.

Para calcular el ingreso neto real debes trabajar sobre pedidos confirmados, usar `subtotal_usd`, restar `discount_usd`, restar las devoluciones de `refunds` (cuidando no duplicar filas al cruzar tablas) y excluir siempre los impuestos.

¿Qué importe de los 100 USD del ejemplo anterior consideras entonces que sí le corresponde a la mercancía vendida?

================ c0-negocio-02-embudos-conversion ================
Tutor Question: Imagina que en Mercado Brisa una clienta entra a la aplicación y, debido a problemas con su conexión a internet, presiona tres veces seguidas el botón de agregar un producto al carrito. Esto genera tres registros del evento `add_to_cart` en la tabla `events` para esa misma persona.

Si quieres saber cuántas personas llegaron a ese paso del embudo:

1. ¿Qué resultado te daría `COUNT(*)` frente a `COUNT(DISTINCT customer_id)`?
2. ¿Cuál de las dos funciones debes usar y por qué?

Tutor Evaluation of Wrong Answer: Hacer eso inflará tus métricas y te dará conclusiones falsas. 

Si usas `COUNT(*)` en la tabla `events`:
- Contarás clics repetidos por fallas de conexión o recargas de página, no personas reales.
- Podrías ver que un paso tiene más eventos que el anterior, mostrando una tasa de conversión imposible (mayor al 100 %).

Para medir un embudo real necesitas:
1. **Definir la unidad única:** Usar `COUNT(DISTINCT customer_id)` para contar a cada persona una sola vez por paso.
2. **Respetar el orden temporal:** Validar que el paso siguiente ocurra después del anterior (`event_ts` de compra posterior al de visita). De lo contrario, contarás compras viejas como si vinieran de visitas actuales.

¿Qué problema crees que causaría en el negocio reportar conversiones infladas con `COUNT(*)`?

================ c0-negocio-03-kpi-metrica-vanidad ================
Tutor Question: Imagina que en Mercado Brisa el equipo propone poner en el tablero principal la métrica **"Usuarios registrados totales"** (contando todos los registros históricos en la tabla `customers`). 

1. ¿Por qué esta cifra se considera una métrica de vanidad y no un KPI accionable?
2. ¿Qué métrica alternativa propondrías vigilar en su lugar para saber realmente si el negocio va bien?

Tutor Evaluation of Wrong Answer: Esa conclusión contiene dos trampas peligrosas para el negocio:

1. **Que una métrica siempre suba no la hace un buen KPI; la hace de vanidad.** El total acumulado de impresiones o pedidos nunca baja porque solo suma el pasado. Si en el último mes Mercado Brisa no vendió nada o perdió todos sus clientes, ese número acumulado seguirá viéndose alto y positivo. No te muestra el estado actual ni te ayuda a decidir qué corregir mañana. En su lugar, conviene mirar métricas con ventana temporal y accionables, como pedidos activos del mes en `orders` o clientes que compran por semana.

2. **Un CPA bajo no garantiza un buen negocio si ignoras los reembolsos.** Puedes gastar poco dinero en adquirir un cliente, pero si el producto llega roto, no cumple expectativas o se cancela, la tabla `refunds` se llenará de devoluciones. Si no vigilas la tasa de reembolsos como métrica guardia, estarás celebrando adquisiciones baratas de pedidos que en realidad terminan en pérdida de dinero.

Para ponerlo en práctica: si Mercado Brisa invierte en una campaña con un CPA excelente pero el 40 % del dinero se devuelve en la tabla `refunds`, ¿la campaña fue realmente un éxito? ¿Qué decisión tomarías tú con ese canal?

================ c0-negocio-04-pregunta-a-decision ================
Tutor Question: Imagina que la dirección de Mercado Brisa te dice: *"Los clientes de cafeterías están descontentos con los pedidos del último mes"*.

Esa frase es ambigua y no sirve para tomar decisiones. Para convertirla en una **hipótesis refutable**, necesitamos acotarla.

Completa los cuatro elementos para formular una hipótesis válida:

1. **Segmento:** ¿A qué grupo exacto de clientes o pedidos analizamos?
2. **Palanca o causa sospechosa:** ¿Qué dimensión o motivo concreto dentro del negocio vamos a revisar?
3. **Métrica objetivo:** ¿Qué número específico medirías (usando tablas como `orders` o `refunds`)?
4. **Umbral de decisión:** ¿Qué cambio o cifra mínima te haría afirmar que la hipótesis es cierta y requiere una acción operativa?

Dime cómo definirías estos cuatro puntos con tus propias palabras.

Tutor Evaluation of Wrong Answer: Cuidado, ahí hay dos errores conceptuales graves que invalidan cualquier análisis:

1. **El umbral de decisión se define antes de consultar los datos.** Si miras los números primero y fijas el criterio después según si te gusta o no, caes en sesgo de confirmación. Diseñas la regla a medida para justificar la decisión que querías tomar de antemano.

2. **En EXP-PUSH-CART hay un sesgo de asignación (SRM).** Si esperabas una división 50/50 y obtienes 980 usuarios en control frente a 620 en treatment, el experimento está roto. Cuando el mecanismo de reparto falla, los grupos ya no son comparables. El mayor gasto medio en treatment no es fiable; podría deberse a que solo entraron usuarios de cierto perfil. Lanzar el cambio con esa muestra truncada es peligroso.

Volvamos al ejercicio de Mercado Brisa sobre el reclamo de las cafeterías:

¿Cómo definirías el **umbral previo** y la **métrica** en `refunds` u `orders` antes de mirar los datos? Intenta completar:

- **Segmento:** (por ejemplo, cafeterías en el último mes)
- **Métrica:** (¿dinero reembolsado, tasa de pedidos devueltos...?)
- **Umbral previo:** (¿qué cifra fija o porcentaje activará la acción?)
```

---

## Revisión propia

Al revisar críticamente los archivos creados antes de cerrar la tarea, detectamos y corregimos **5 defectos reales**:

1. **Longitud insuficiente en `roleNotes.bi` de `c0-negocio-01-ingreso-costo-margen.js`**:
   - *Defecto*: en la primera versión, `roleNotes.bi` tenía 24 palabras, incumpliendo el mínimo de 25 palabras exigido por `RoleNotesSchema` (`src/data/schema/lesson.js`).
   - *Corrección*: ampliamos `roleNotes.bi` a 29 palabras precisando por qué el margen bruto porcentual debe definirse como medida dinámica `DIVIDE(SUM(margen_usd), SUM(ingreso_neto_usd))` y nunca como columna calculada promediada entre filas.
2. **Exceso de negritas (`> 3 **` por párrafo) en listas numeradas de `c0-negocio-03` y `c0-negocio-04`**:
   - *Defecto*: `check-copy.mjs` reportó 5 negritas en un mismo bloque en `c0-negocio-03-kpi-metrica-vanidad.js:90` (lista de los 5 componentes de un KPI) y en `c0-negocio-04-pregunta-a-decision.js:24` (definición de las 4 piezas de una hipótesis refutable).
   - *Corrección*: separamos los ítems de la lista numerada en párrafos independientes (`\n\n`) y reservamos la negrita exclusivamente para la primera aparición del término técnico definido (`<= 2` por párrafo), logrando `0 hallazgos` en `check-copy.mjs`.
3. **Media de palabras por frase superior a 22 en `c0-negocio-01` (22,1) y `c0-negocio-04` (28,5)**:
   - *Defecto*: aunque el conteo total de palabras estaba dentro del rango `700–1100`, algunas oraciones subordinadas con cifras de Mercado Brisa elevaban la media por encima del tope de 22 palabras/frase del Apéndice A.
   - *Corrección*: dividimos las oraciones compuestas en frases cortas y directas en las secciones 1, 2 y 3 de ambas lecciones, dejando las 4 lecciones de `c0-negocio` por debajo del límite de 22 palabras/frase.
4. **Riesgo de contaminación de cálculos de margen con el SKU de prueba `SKU-TEST-NEG` (`product_id = 180`)**:
   - *Defecto*: al auditar `products` y `order_items` en DuckDB detectamos que `SKU-TEST-NEG` tiene `list_price_usd = -15.0` y `unit_cost_usd = 5.0` en 100 líneas de pedido completadas. Si no se advierte explícitamente, una persona que filtre o agrupe por SKU en el proyecto final puede encontrar un margen negativo anómalo sin entender su origen.
   - *Corrección*: documentamos el efecto exacto de `SKU-TEST-NEG` tanto en el texto y filtro canónico de `c0-negocio-03-kpi-metrica-vanidad.js` como en la tabla de reconciliación y rúbrica de `docs/curriculo/investigacion/c0-negocio.md`.
5. **Restauración limpia de `src/data/lessons/index.js` tras las pruebas de integración**:
   - *Defecto*: ejecutar `node scripts/sync-lessons-index.mjs` para probar las lecciones en el navegador modifica `src/data/lessons/index.js`, archivo que pertenece al paso de integración del orquestador y no a nuestro worktree.
   - *Corrección*: tras completar todas las capturas `1280×720`, las pruebas de DuckDB-Wasm y la verificación del tutor IA, ejecutamos `git checkout -- src/data/lessons/index.js` y comprobamos con `git status` y `git diff --stat main...agente/W-c0-negocio` que solo se incluyen nuestros archivos asignados.

---

## Prueba adversarial

| Caso | Entrada | Resultado esperado | Resultado real |
| :--- | :--- | :--- | :--- |
| **1. Propagación de `NULL` y fan-out en `c0-negocio-01`** | Ejecutar `SUM(o.subtotal_usd - o.discount_usd - r.refund_amount_usd)` tras `LEFT JOIN refunds` sin `COALESCE` y unir `orders` + `order_items` + `refunds` sin pre-agregar en CTEs. | Que el antipatrón de `workedExample.steps[0]` evidencie la pérdida de los `14 760` pedidos sin devolución y que `workedExample.steps[1]` + `practice.solution` reconcilien exactamente `5 742 529,97` USD de ingreso neto. | En DuckDB el antipatrón devuelve solo `504 261,80` USD (anula con `NULL` los `14 760` pedidos sin reembolso), mientras que la solución con CTEs y `COALESCE(..., 0)` devuelve exactamente `5 742 529,97` USD (`2 718 073,37` USD de margen bruto, `47,33 %`). |
| **2. Inflación por webhooks repetidos y división entera en `c0-negocio-02`** | Contar cobros con `COUNT(*)` en `payments` (`status = 'captured'`) y eventos con `COUNT(*)` en `events` sin `DISTINCT`, o dividir enteros sin `* 100.0`. | Que el antipatrón refleje la inflación por los `351` reintentos de webhook y que la solución deduplicada por `idempotency_key` y `customer_id` calcule las tasas reales sin superar el `100 %`. | En DuckDB `COUNT(*)` en `payments` devuelve `16 551` cobros (`91,95 %` aparente), mientras que `COUNT(DISTINCT idempotency_key)` devuelve los `16 200` cobros únicos reales (`90,00 %` de conversión de pago y `82,00 %` de conversión neta sin reembolso). |
| **3. Promedio de razones (`AVG` de margen y de CPA) en `c0-negocio-01` y `c0-negocio-03`** | Calcular el margen global con `AVG(margen_pct)` entre categorías y el CPA por canal con `AVG(spend_usd / attributed_conversions)` en `marketing_spend`. | Que las comprobaciones `c0-negocio-01:c2` y `c0-negocio-03:c2` rechacen `AVG()` con retroalimentación específica y que las consultas usen `SUM(numerador) / SUM(denominador)`. | Las consultas en DuckDB calculan `SUM(spend_usd) / SUM(attributed_conversions)` dando los CPAs exactos (`referral` `13,59` USD a `display_video` `13,94` USD) y los checks muestran la retroalimentación explicando por qué las razones no son aditivas. |
| **4. Empate en conteo de reembolsos y sesgo SRM en `c0-negocio-04`** | Ordenar motivos de `refunds` solo por `COUNT(*)` o recomendar el lanzamiento de `EXP-PUSH-CART` porque su gasto medio en `treatment` (`65,57` USD) supera a `control` (`59,63` USD). | Que `COUNT(*)` muestre el empate en `290` casos obligando a ponderar por `SUM(refund_amount_usd)`, y que la auditoría de `experiment_assignments` bloquee `EXP-PUSH-CART` por sesgo SRM. | En DuckDB los 5 motivos empatan en `290` filas pero `tueste_incorrecto` lidera con `65 909,73` USD; en `EXP-PUSH-CART` la consulta revela `980` en `control` frente a `620` en `treatment` (`status = 'stopped_srm'`), invalidando el lanzamiento. |
| **5. Respuesta errónea deliberada al Tutor IA (`agy`) en las 4 lecciones** | Pedir *"Hazme una pregunta para comprobar si lo entendí"* y responder con los errores conceptuales de cada lección (incluir `tax_usd`, usar `COUNT(*)`, usar acumulados de vanidad sin *guardrail*, y fijar umbrales post-hoc ignorando SRM). | Que el tutor IA utilice el campo `aiNotes` de cada lección para refutar la respuesta errónea y plantear una repregunta socrática sobre Mercado Brisa. | En las 4 lecciones `agy` detectó cada falacia usando `aiNotes` (ver transcripción literal en `## Test §6`) y guio a la persona de vuelta al concepto correcto sin regalar la solución. |

---

## Capturas

Todas las capturas fueron tomadas a resolución `1280×720` en formato `.png` en `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-c0-negocio\` e inspeccionadas visualmente con `read_file`:

| Lección | Captura de cabecera (`1280×720`) | Captura de práctica SQL resuelta (`1280×720`) |
| :--- | :--- | :--- |
| `c0-negocio-01-ingreso-costo-margen` | `c0-negocio-01-ingreso-costo-margen-cabecera.png` | `c0-negocio-01-ingreso-costo-margen-practica.png` |
| `c0-negocio-02-embudos-conversion` | `c0-negocio-02-embudos-conversion-cabecera.png` | `c0-negocio-02-embudos-conversion-practica.png` |
| `c0-negocio-03-kpi-metrica-vanidad` | `c0-negocio-03-kpi-metrica-vanidad-cabecera.png` | `c0-negocio-03-kpi-metrica-vanidad-practica.png` |
| `c0-negocio-04-pregunta-a-decision` | `c0-negocio-04-pregunta-a-decision-cabecera.png` | `c0-negocio-04-pregunta-a-decision-practica.png` |

---

## Peticiones al orquestador

1. **Sincronización del índice de lecciones tras el merge de la Ola A**: ejecutar `node scripts/sync-lessons-index.mjs` al integrar la rama `agente/W-c0-negocio` en `main` para registrar las 4 lecciones de `c0-negocio` en `src/data/lessons/index.js`.
2. **Integración de los 8 términos del glosario**: fusionar el arreglo JSON de `docs/curriculo/investigacion/c0-negocio-glossary.json` (ya validado con `validateGlossary`) dentro de `src/data/glossary/terms.json`.
3. **Observación opcional sobre `src/views/LessonPlayer.jsx` (líneas 584–588 y 1070–1111)**: actualmente `LessonPlayer.jsx` solo monta `<AuthenticCodeLab>` inline dentro de la vista de lectura cuando `lesson.practice.blanks.length > 0` (`fill-blanks`), mientras que las prácticas `type: 'sql'` se ejecutan completas en `PracticeView` (`SqlLab`). Si en una fase posterior se desea que el editor SQL de DuckDB-Wasm aparezca también incrustado dentro de `#sec-practica` en `LessonPlayer`, bastará con permitir `lesson.practice.type === 'sql'` en la condición de `LessonPlayer.jsx`.

---

## Pendiente

Ninguno.
