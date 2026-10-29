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

### 2. Archivos leídos antes de empezar

1. `PLAN_GEMINI_4_ARGON.md` (§1, §2, §5 `c0-negocio`, §9.2, §9.4, Apéndices A, B, D.2 y D.3)
2. `src/data/catalog/modules.js` (definición del módulo `c0-negocio`, 4 lecciones, tiempos `[20, 15, 20, 15]`, meta y `projectSpec`)
3. `public/datasets/README.md` y `public/datasets/schema.json` (13 tablas de Mercado Brisa, semilla `19870315`, anomalías intencionales documentadas)
4. `src/data/schema/lesson.js` y `src/data/schema/glossary.js` (esquemas Zod v2, rangos de palabras y restricciones de niveles)
5. `scripts/check-content.mjs` y `scripts/check-copy.mjs` (reglas de validación estructural y auditoría anti-slop)
6. `package.json`, `vite.config.js`, `src/main.jsx`, `src/App.jsx`, `src/styles/tokens.css`, `scripts/generate-dataset.mjs` y `scripts/sync-lessons-index.mjs`

### 3. Las 3 decisiones principales y su justificación

1. **Reconciliación contable y operativa real sobre Mercado Brisa con `@duckdb/node-api` antes de redactar**: antes de escribir una sola cifra en las lecciones, ejecutamos todas las consultas de ejemplo, `workedExample` y `practice` directamente sobre los 13 ficheros Parquet de `public/datasets/mercado_brisa/` para garantizar que cada tabla `expectedOutput`, cada monto en dólares y cada tasa porcentual coincidan al centavo con lo que DuckDB-Wasm devuelve en el navegador.
2. **Progresión acumulativa apoyada en las anomalías reales del dataset sin saltos técnicos de Nivel 1+**: dado que `c0-negocio` es Nivel 0, evitamos funciones de ventana (`OVER (PARTITION BY ...)`), subconsultas correlacionadas complejas o modelado SCD2, y en su lugar enseñamos a detectar los problemas reales del negocio en Mercado Brisa (impuestos incluidos en `total_usd`, duplicación por `JOIN` `1:N` con `order_items` y `refunds`, reintentos de webhooks en `payments` con `16 551` filas frente a `16 200` `idempotency_key` únicos, `SKU-TEST-NEG` con precio `-15,00` USD y el experimento `EXP-PUSH-CART` invalidado por sesgo SRM `980` vs `620`) mediante agregaciones claras, `COUNT(DISTINCT ...)`, `FILTER (WHERE ...)` y CTEs limpias.
3. **Aislamiento de los términos de glosario en `docs/curriculo/investigacion/c0-negocio-glossary.json`**: para respetar la propiedad exclusiva de archivos de la Ola A y evitar conflictos de merge en `src/data/glossary/terms.json` o `src/data/lessons/index.js`, depositamos los 8 términos validados por `GlossarySchema` en `docs/curriculo/investigacion/c0-negocio-glossary.json` y restauramos `src/data/lessons/index.js` tras las pruebas de navegador y compilación.

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

### Paso 7 — Autoevaluación con la rúbrica de calidad de lección (Apéndice B)

Escala 0–3 por dimensión (mínimo para aprobar: `>= 14/18` y ningún criterio `<= 1`):

| Lección | 1. Claridad y gancho (0–3) | 2. Rigor técnico (0–3) | 3. Código ejecutable (0–3) | 4. Comprobaciones y práctica (0–3) | 5. Voz y estilo Apéndice A (0–3) | 6. Fuentes y glosario (0–3) | Total (/18) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `c0-negocio-01-ingreso-costo-margen` | **3** (gancho real con `7,67 M` USD vs ingreso neto y margen de Suscripciones vs Accesorios) | **3** (IFRS 15, exclusión de impuestos, pre-agregación de `refunds`/`order_items`, aditividad de razones) | **3** (4 consultas ejecutadas en DuckDB con `expectedOutput` idéntico al centavo) | **3** (3 checks `mcq` + `predict-output` + `order` con `feedback` por opción; práctica SQL con 3 pistas) | **3** (913 palabras visibles, `<= 22` palabras/frase, 0 hallazgos en `check-copy`) | **3** (3 fuentes `https://` primarias `2026-10-29`, términos `ingreso-neto` y `margen-bruto`) | **18 / 18** |
| `c0-negocio-02-embudos-conversion` | **3** (gancho con el 18 % de caída de pedidos y reintentos duplicados en `events` y `payments`) | **3** (`COUNT(DISTINCT)` vs `COUNT(*)`, conversión paso a paso vs global, embudos cerrados vs abiertos) | **3** (4 consultas ejecutadas en DuckDB con `FILTER (WHERE ...)` y `expectedOutput` exacto) | **3** (3 checks `mcq` + `predict-output` + `order` con `feedback` por opción; práctica SQL con 3 pistas) | **3** (967 palabras visibles, `<= 22` palabras/frase, 0 hallazgos en `check-copy`) | **3** (3 fuentes `https://` primarias `2026-10-29`, términos `embudo-conversion` y `tasa-caida-dropoff`) | **18 / 18** |
| `c0-negocio-03-kpi-metrica-vanidad` | **3** (gancho con `3,21 M` de impresiones en `paid_social` y campañas empatadas con 19 % de reembolso) | **3** (los 5 componentes formales de un KPI según Parmenter/MetricFlow y métricas guardia según Kohavi) | **3** (3 consultas ejecutadas en DuckDB sobre `marketing_spend`, `orders` y `refunds` con `expectedOutput` real) | **3** (3 checks `mcq` + `predict-output` con `feedback` por opción; práctica SQL sobre CPA con 3 pistas) | **3** (885 palabras visibles, `<= 22` palabras/frase, 0 hallazgos en `check-copy`) | **3** (3 fuentes `https://` verificadas `2026-10-29`, términos `kpi-vs-metrica-vanidad` y `metrica-guardia`) | **18 / 18** |
| `c0-negocio-04-pregunta-a-decision` | **3** (gancho con las preguntas ambiguas del comité sobre descuentos del 5 % y devoluciones) | **3** (fase Business Understanding de CRISP-DM, umbral previo contra sesgo post-hoc y detección de SRM en `EXP-PUSH-CART`) | **3** (4 consultas ejecutadas en DuckDB sobre `refunds`, `orders`, `experiments` y `customers` con `expectedOutput` real) | **3** (3 checks `mcq` + `order` + `predict-output` con `feedback` por opción; práctica SQL por segmento con 3 pistas) | **3** (904 palabras visibles, `<= 22` palabras/frase, 0 hallazgos en `check-copy`) | **3** (3 fuentes `https://` primarias `2026-10-29`, términos `hipotesis-refutable` y `umbral-decision`) | **18 / 18** |

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

### 5. Verificación en navegador (`1280×720`), DuckDB-Wasm y Tutor IA (`agy`)

Se ejecutó la batería automatizada en Chromium (`1280×720`) sobre `http://127.0.0.1:5204` (`capture_and_test.mjs`) y la verificación de dos turnos del tutor IA (`test_ai_tutor.mjs`):
- **Renderizado DOM (`LessonPlayer`)**: las 4 lecciones renderizan sus 9 bloques de temario (gancho + objetivos, 3 secciones con código y tablas, ejemplo guiado paso a paso, notas por rol DE/DA/BI, 3 comprobaciones interactivas, práctica aplicada, resumen + flashcards + 3 fuentes `https://`).
- **Temas claro y oscuro**: `darkOverflow: false` y `lightOverflow: false` (`scrollWidth <= clientWidth`) en las 4 lecciones, con `0` errores de consola (`consoleErrors: []`).
- **Comprobaciones**: las 3 comprobaciones de cada lección responden al clic y muestran retroalimentación específica por opción (`feedbacksShown: 3/3`).
- **Prácticas SQL en DuckDB-Wasm (`PracticeView` / `SqlLab`)**:
  - `c0-negocio-01-ingreso-costo-margen`: `Práctica superada · El resultado coincide con la referencia · Resultado verificado: 3 fila(s) y 6 columna(s) coinciden con la referencia.`
  - `c0-negocio-02-embudos-conversion`: `Práctica superada · El resultado coincide con la referencia · Resultado verificado: 5 fila(s) y 5 columna(s) coinciden con la referencia.`
  - `c0-negocio-03-kpi-metrica-vanidad`: `Práctica superada · El resultado coincide con la referencia · Resultado verificado: 5 fila(s) y 6 columna(s) coinciden con la referencia.`
  - `c0-negocio-04-pregunta-a-decision`: `Práctica superada · El resultado coincide con la referencia · Resultado verificado: 3 fila(s) y 6 columna(s) coinciden con la referencia.`
- **Tutor IA contextualizado (`/` + botón `Preguntar` + `aiNotes`)**:
  - En las 4 lecciones el panel del tutor abre tanto con el atajo `/` (`tutorBySlash: true`) como con el botón `Preguntar` de la cabecera (`tutorByBtn: true`).
  - Al pedir *"Hazme una pregunta para comprobar si lo entendí"* y responder mal a propósito en cada lección:
    - En `c0-negocio-01-ingreso-costo-margen`, ante la respuesta errónea de usar `INNER JOIN` directo y sumar `o.total_usd`, el tutor detectó los 3 fallos usando `aiNotes`: que `total_usd` incluye impuestos (`tax_usd`) que pertenecen al fisco, que `INNER JOIN` con `refunds` descarta pedidos sin devolución y que cruzar con `order_items` sin pre-agregar multiplica la cabecera.
    - En `c0-negocio-02-embudos-conversion`, ante la respuesta errónea de contar `COUNT(*)` en `events` sin `DISTINCT` ni orden temporal, el tutor señaló que `COUNT(*)` infla el embudo por recargas/reintentos pudiendo dar conversiones imposibles (`> 100 %`) y exigió `COUNT(DISTINCT customer_id)` y validación de secuencia temporal.
    - En `c0-negocio-03-kpi-metrica-vanidad`, ante la respuesta errónea de usar el acumulado histórico de impresiones como KPI e ignorar `refunds` cuando el CPA es bajo, el tutor explicó por qué los acumulados históricos son métricas de vanidad y por qué la tasa de reembolsos en `refunds` es indispensable como métrica guardia.
    - En `c0-negocio-04-pregunta-a-decision`, ante la respuesta errónea de elegir el umbral después de ver los datos y lanzar `EXP-PUSH-CART` ignorando el reparto `980` vs `620`, el tutor identificó el sesgo de confirmación post-hoc y bloqueó el lanzamiento por *Sample Ratio Mismatch* (SRM).

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

Se ejecutaron **5 pruebas adversariales** diseñadas para intentar romper las lecciones del módulo:

1. **Prueba adversarial de propagación de `NULL` y fan-out en `c0-negocio-01-ingreso-costo-margen`**:
   - *Ataque*: ejecutar el cálculo de ingreso neto restando directamente `o.subtotal_usd - o.discount_usd - d.devuelto_usd` tras un `LEFT JOIN` con `refunds`, y unir `orders` con `order_items` y `refunds` en un mismo `SELECT` sin CTEs.
   - *Resultado*: verificamos en DuckDB que sin `COALESCE(d.devuelto_usd, 0)` los `14 760` pedidos completados sin devolución producen `NULL` y anulan el ingreso neto de esos pedidos (`workedExample.steps[0]` devuelve solo `504 261,80` USD de los `1 440` pedidos reembolsados en vez de los `5 742 529,97` USD reales), y que la solución en CTEs (`workedExample.steps[1]` y `practice.solution`) resuelve ambos ataques.
2. **Prueba adversarial de inflación por reintentos y truncamiento entero en `c0-negocio-02-embudos-conversion`**:
   - *Ataque*: calcular el embudo sobre `events` y `payments` usando `COUNT(*)` en lugar de `COUNT(DISTINCT customer_id)` / `COUNT(DISTINCT idempotency_key)` y dividiendo enteros sin multiplicar por `100.0`.
   - *Resultado*: comprobamos en DuckDB que `COUNT(*)` en `payments` cuenta `16 551` cobros capturados por los webhooks repetidos frente a `16 200` cobros únicos reales (`351` filas duplicadas), inflando la conversión aparente de `90,00 %` a `91,95 %` (`workedExample.steps[0]`). Nuestra solución exige `COUNT(DISTINCT ...)` y `* 100.0`.
3. **Prueba adversarial de promedio de razones (`AVG` de CPA y de margen) en `c0-negocio-01` y `c0-negocio-03`**:
   - *Ataque*: calcular el margen bruto global con `AVG(margen_pct_categoria)` y el CPA de cada canal con `AVG(spend_usd / attributed_conversions)` en `marketing_spend`.
   - *Resultado*: verificamos que promediar porcentajes o CPAs mensuales distorsiona la métrica al ignorar el volumen de cada categoría o mes; todas las consultas del módulo usan estrictamente `SUM(numerador) / SUM(denominador)` y las comprobaciones `c0-negocio-01:c2` y `c0-negocio-03:c2` penalizan explícitamente el uso de `AVG()` sobre razones con retroalimentación detallada.
4. **Prueba adversarial de sesgo de selección (SRM) y paradoja de motivos de reembolso en `c0-negocio-04-pregunta-a-decision`**:
   - *Ataque*: ordenar los motivos de `refunds` solo por número de casos (`COUNT(*)`) o aprobar el experimento `EXP-PUSH-CART` mirando únicamente que `treatment` tuvo mayor gasto medio (`65,57` USD vs `59,63` USD).
   - *Resultado*: en Mercado Brisa los 5 motivos de reembolso empatan exactamente en `290` casos (`COUNT(*)` no discrimina), pero al ponderar por `SUM(refund_amount_usd)` emerge `tueste_incorrecto` con `65 909,73` USD; asimismo, `EXP-PUSH-CART` tiene `980` usuarios en control y `620` en tratamiento (`stopped_srm`), lo que la lección enseña a auditar antes de recomendar el lanzamiento.
5. **Prueba adversarial de inyección de errores conceptuales al Tutor IA (`agy`)**:
   - *Ataque*: enviar a `/api/ai/chat` (`buildContextPrompt` + `runAgyPrompt`) en cada una de las 4 lecciones una afirmación que contradice directamente las reglas de negocio de la lección pero suena plausible (sumar `total_usd` con impuestos, usar `COUNT(*)` en embudos, usar acumulados históricos como KPI sin métrica guardia, y fijar umbrales post-hoc ignorando SRM).
   - *Resultado*: en los 4 casos el tutor utilizó el campo `aiNotes` de la lección correspondiente para desmontar punto por punto la afirmación errónea y devolver una pregunta socrática de verificación sobre las tablas de Mercado Brisa.

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
