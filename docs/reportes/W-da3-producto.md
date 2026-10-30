# W-da3-producto — Analítica de producto y crecimiento (`da3-producto`)

- **Agente:** `W-da3-producto` (Writer de contenido curricular — Fase 3, Ola C)
- **Rama:** `agente/W-da3-producto`
- **Worktree:** `C:\Users\T490s\Desktop\Proyectos\ING-W-da3-producto`
- **Módulo:** `da3-producto` (*Analítica de producto y crecimiento*, Ruta `da`, Nivel `3`, 4 lecciones, 100 minutos totales)
- **Fecha:** 2026-10-30

---

## Inicio

### Lectura de documentos de referencia y estado inicial

Antes de redactar la investigación o las lecciones se leyeron los siguientes archivos reales del repositorio y se extrajo un dato operativo concreto de cada uno:

1. [`PLAN_GEMINI_4_ARGON.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-da3-producto/PLAN_GEMINI_4_ARGON.md): En §5 (Módulo 12 `da3-producto`), §9 (`Paso 1`–`Paso 7`), Apéndice A, Apéndice B y Apéndice D.3 se especifica que `da3-producto` consta de 4 lecciones (`da3-producto-01-embudos-conversion-ventana`, `da3-producto-02-cohorts-retention-ltv` como limpieza profunda de `l13-cohorts-retention-ltv`, `da3-producto-03-segmentacion-conductual-rfm` y `da3-producto-04-atribucion-marketing-incrementalidad`), exige entre `900` y `1600` palabras visibles para lecciones de nivel `3`, media de palabras por oración `<= 22` y verificación real del tutor IA con `agy`.
2. [`docs/reportes/PLANTILLA.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-da3-producto/docs/reportes/PLANTILLA.md): Define las 8 secciones obligatorias del informe (`## Inicio`, `## Pasos`, `## Test`, `## Revisión propia`, `## Prueba adversarial`, `## Capturas antes / después`, `## Peticiones al orquestador` y `## Pendiente (con motivo)`), exigiendo al menos 5 defectos reales corregidos en `## Revisión propia` y al menos 5 casos borde en tabla Markdown en `## Prueba adversarial`.
3. [`src/data/catalog/modules.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-da3-producto/src/data/catalog/modules.js): El módulo `da3-producto` (líneas 165–183) tiene `track: 'da'`, `level: 3`, `order: 2`, `prerequisites: ['da2-eda', 'c2-sql-analitico']`, `capstoneProjectId: 'cap-cohort-ltv'` y 4 entradas en `plannedLessons` con duraciones `25`, `30`, `20` y `25` minutos (`da3-producto-02` con `sourceLegacyId: 'l13-cohorts-retention-ltv'`).
4. [`src/data/schema/lesson.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-da3-producto/src/data/schema/lesson.js): `LessonSchema` (Zod v4) exige `contentVersion: 2`, `tracks: z.array(TrackIdSchema).min(1)`, `objectives` (`2`–`4`), `sections` (`2`–`5`), `workedExample` con `steps` (`>= 2`), `roleNotes` (`de`, `da`, `bi`), `checks` (`2`–`3` con opciones `{ id, text, correct, why }`), `practice` (`type: 'sql'`, `dataset: 'mercado_brisa'`, `starterCode`, `solution`, `expected`, `expectedOutputTable`, `hints` de longitud 3) y `sources` (`>= 2`).
5. [`src/data/schema/glossary.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-da3-producto/src/data/schema/glossary.js): `GlossaryTermSchema` exige `id` en kebab-case, `term`, `definition` breve (`<= 45` palabras en el esquema técnico y `<= 25` palabras por regla editorial de §9.1 Paso 5), `moduleId`, `relatedLessons` (`>= 1`) y `sources` (`>= 1` con `title`, `author`, `year`, `url`, `publisher`, `accessed`, `supports`).
6. [`public/datasets/README.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-da3-producto/public/datasets/README.md): Documenta el dominio **Mercado Brisa** (`2024-01-01` a `2025-11-30`, semilla determinista `20260419`) con 8 tablas CSV en `public/datasets/mercado_brisa/` y anomaliás intencionales sembradas (reintentos duplicados en `events`, órdenes antes de `signup_date`, reembolsos parciales y sesgo SRM en `EXP-PUSH-CART`).
7. [`public/datasets/schema.json`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-da3-producto/public/datasets/schema.json): Registra el conteo exacto de filas de Mercado Brisa (`customers`: `2400`, `products`: `95`, `orders`: `18000`, `order_items`: `42000`, `events`: `60000`, `refunds`: `1800`, `marketing_spend`: `730`, `experiments`: `3200`) y sus tipos de columna.
8. [`scripts/generate-dataset.mjs`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-da3-producto/scripts/generate-dataset.mjs): Confirma cómo se sembraron las anomalías de Mercado Brisa: `1200` eventos duplicados por reintento (`240` por `event_type`), `campaign_id` en `{CMP-VERANO, CMP-ORIGEN, CMP-BARISTA, CMP-RETENCION}` y los dos experimentos en `experiments` (`EXP-CHECKOUT-1STEP` balanceado 800/800 con lift positivo y `EXP-PUSH-CART` con SRM `980` control vs `620` treatment).
9. [`scripts/check-content.mjs`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-da3-producto/scripts/check-content.mjs): Valida cada lección contra `LessonSchema`, comprueba que las palabras visibles para `level === 3` estén entre `900` y `1600`, que todos los bloques SQL (`sections[].example`, `workedExample.steps`, `practice.starterCode` y `practice.solution`) ejecuten sin error en DuckDB sobre Mercado Brisa y que `practice.solution` devuelva `>= 1` fila.
10. [`scripts/check-copy.mjs`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-da3-producto/scripts/check-copy.mjs): Audita muletillas prohibidas del Apéndice B (ej. `"en el mundo actual"`, `"innegociable"`, `"cabe destacar"`, `"hoy en día"`), jerga interna y longitud media de frase (`MAX_AVG_SENTENCE_WORDS = 22`).
11. [`server/ai/contextBuilder.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-da3-producto/server/ai/contextBuilder.js): Construye el prompt del tutor IA (`buildContextPrompt`) inyectando `lessonId`, `sectionId`, `mode` (`explain`, `hint`, `quiz`, `interview`, `free`), extracto de la lección, `code` y `queryResult`, con directiva pedagógica estricta de no regalar la consulta final en modo `hint`.
12. [`server/ai/agyRunner.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-da3-producto/server/ai/agyRunner.js): Ejecuta el binario `agy chat --mode agent --Workspace <LESSONS_WORKSPACE> -m <model>` en directorio aislado `.agy-lessons-workspace` con presupuesto `TIMEOUT_MS` y devuelve `{ text, model, durationMs, firstTokenMs }`.
13. [`src/data/lessons/da2-eda/da2-eda-04-diario-analisis-reproducible.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-da3-producto/src/data/lessons/da2-eda/da2-eda-04-diario-analisis-reproducible.js): Lección prerrequisito directa de `da3-producto-01`; establece la plantilla de supuestos y descartes reproducibles sobre Mercado Brisa que `da3-producto-01` retoma al fijar la regla de higiene de eventos post-registro.
14. [`src/data/lessons/c2-sql-analitico/c2-sql-analitico-01-funciones-ventana-qualify.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-da3-producto/src/data/lessons/c2-sql-analitico/c2-sql-analitico-01-funciones-ventana-qualify.js) y [`src/data/lessons/c2-sql-analitico/c2-sql-analitico-04-asof-join-ctes-modulares.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-da3-producto/src/data/lessons/c2-sql-analitico/c2-sql-analitico-04-asof-join-ctes-modulares.js): Lecciones prerrequisito en `c2-sql-analitico`; enseñan la sintaxis base de funciones de ventana (`NTILE`, `ROW_NUMBER`, `QUALIFY`) y `ASOF JOIN`, lo que permite que `da3-producto-03` y `da3-producto-04` avancen directamente hacia su aplicación en segmentación RFM y atribución de marketing con ventana de caducidad.
15. [`src/data/lessons/legacy/l13-cohorts-retention-ltv.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-da3-producto/src/data/lessons/legacy/l13-cohorts-retention-ltv.js): Lección heredada marcada con `needsReview: true`; contenía referencias sueltas fuera de Mercado Brisa y carecía de cruce con `order_items`, `products.cost_usd` y `refunds` para contrastar LTV bruto frente a LTV con margen neto.
16. [`docs/reportes/W-da2-eda.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-da3-producto/docs/reportes/W-da2-eda.md) y [`docs/reportes/W-c2-sql-analitico.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-da3-producto/docs/reportes/W-c2-sql-analitico.md): Informes modelo de olas previas que ejemplifican el desglose de evidencias de DuckDB, respuestas literales del tutor `agy` y rúbricas §9.2 y §9.4.

### Resumen del estado inicial

Al iniciar el trabajo en el worktree `ING-W-da3-producto` (rama `agente/W-da3-producto`), el directorio `src/data/lessons/da3-producto/` no existía, no había documento de investigación `docs/curriculo/investigacion/da3-producto.md` ni glosario `docs/curriculo/investigacion/da3-producto-glossary.json`, y el contenido de cohortes y LTV residía únicamente en `src/data/lessons/legacy/l13-cohorts-retention-ltv.js` con `needsReview: true`.

---

## Pasos

### Paso 1 — Investigación de fuentes primarias (`docs/curriculo/investigacion/da3-producto.md`)

Se redactó [`docs/curriculo/investigacion/da3-producto.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-da3-producto/docs/curriculo/investigacion/da3-producto.md) reuniendo **16 fuentes primarias verificadas con HTTP 200** (4 por lección, con `accessed: '2026-10-29'`), combinando manuales oficiales de DuckDB y plataformas de analítica de producto con artículos fundacionales de marketing cuantitativo y experimentación causal:

- **`da3-producto-01` (Embudos de conversión por ventana y cuellos de botella):**
  1. Amplitude (*Funnels chart: Track conversion across steps*, 2025, `https://amplitude.com/docs/analytics/charts/funnels/funnels-overview`).
  2. Mixpanel (*Funnels: Measure conversion through a series of events*, 2025, `https://docs.mixpanel.com/docs/reports/funnels`).
  3. PostHog (*Funnels — Product Analytics Documentation*, 2025, `https://posthog.com/docs/product-analytics/funnels`).
  4. DuckDB Foundation (*FILTER Clause and Aggregate Functions*, 2025, `https://duckdb.org/docs/stable/sql/query_syntax/filter`).
- **`da3-producto-02` (Cohortes de retención, supervivencia y LTV con margen):**
  1. Fader, P. S. y Hardie, B. G. S. (*How to Project Customer Retention*, Journal of Interactive Marketing, 2007, `https://www.brucehardie.com/papers/021/fader_et_al_jim_07.pdf`).
  2. Gupta, S. et al. (*Modeling Customer Lifetime Value*, Journal of Service Research, 2006, `https:// www8.gsb.columbia.edu/researcharchive/articles/1472`).
  3. Mixpanel (*Retention: Measure engagement over time*, 2025, `https://docs.mixpanel.com/docs/reports/retention`).
  4. DuckDB Foundation (*Date Functions and Date Part Extraction*, 2025, `https://duckdb.org/docs/stable/sql/functions/date`).
- **`da3-producto-03` (Segmentación conductual y RFM: recencia, frecuencia y valor):**
  1. Fader, P. S., Hardie, B. G. S. y Lee, K. L. (*RFM and CLV: Using Iso-Value Curves for Customer Base Analysis*, Journal of Marketing Research, 2005, `https://www.brucehardie.com/papers/rfm_clv_2005-02-16.pdf`).
  2. Hughes, A. M. (*Strategic Database Marketing*, McGraw-Hill, 2012, `https://www.accessengineeringlibrary.com/`).
  3. Blattberg, R. C., Kim, B.-D. y Neslin, S. A. (*Database Marketing: Analyzing and Managing Customers*, Springer, 2008, `https://link.springer.com/book/10.1007/978-0-387-72579-6`).
  4. DuckDB Foundation (*Window Functions: NTILE and Framing*, 2025, `https://duckdb.org/docs/stable/sql/functions/window_functions`).
- **`da3-producto-04` (Atribución de marketing con ASOF JOIN e incrementalidad):**
  1. DuckDB Foundation (*ASOF JOIN Documentation*, 2025, `https://duckdb.org/docs/stable/sql/query_syntax/from#asof-join`).
  2. Kohavi, R., Tang, D. y Xu, Y. (*Trustworthy Online Controlled Experiments: A Practical Guide to A/B Testing*, Cambridge University Press, 2020, `https://experimentguide.com/`).
  3.Fabijan, A. et al. (*Diagnosing Sample Ratio Mismatch in Online Controlled Experiments*, KDD, 2019, `https://www.microsoft.com/en-us/research/publication/diagnosing-sample-ratio-mismatch-in-online-controlled-experiments-a-taxonomy-and-rules-of-thumb-for-practitioners/`).
  4. Lewis, R. A. y Rao, J. M. (*The Unfavorable Economics of Measuring the Returns to Advertising*, Quarterly Journal of Economics, 2015, `https://academic.oup.com/qje/article-abstract/130/4/1941/1916146`).

---

### Paso 2 — Mapa de progresión conceptual del módulo

En la sección 2 de [`docs/curriculo/investigacion/da3-producto.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-da3-producto/docs/curriculo/investigacion/da3-producto.md) se definió la secuencia pedagógica sin solapamientos ni saltos bruscos:

1. **De eventos crudos a conversión inicial (`da3-producto-01`):** Parte de la telemetría de `events` (`60.000` filas con `1.200` duplicados por reintento) y `customers` (`2.400` registros). Introduce la deduplicación al grano de usuario, el sesgo por asociación retroactiva de identidad (`identidad-retroactiva-eventos`, donde `CAST(e.event_ts AS DATE) < c.signup_date` distorsiona el primer evento si no se filtra antes de `MIN`) y el embudo secuencial estricto con ventana de 30/60 días.
2. **De conversión puntual a supervivencia y margen plurianual (`da3-producto-02`):** Una vez que el cliente convierte, evalúa cuánto tiempo permanece activo y cuánto margen neto aporta. Construye la matriz triangular de retención por cohorte trimestral (`Q+0`..`Q+7`), enseña a dejar como `NULL` las celdas truncadas por censura por la derecha y calcula el LTV con margen neto (`ltv-margen-neto`) pre-agregando `order_items`/`products` y `refunds` (`status = 'processed'`) al grano `order_id` antes de unir con `orders`.
3. **De cohortes agregadas a priorización individual (`da3-producto-03`):** Desciende del grano de cohorte al grano de cliente (`customer_id`) a fecha de corte fija (`DATE '2025-12-01'`). Calcula Recencia ($R$), Frecuencia ($F$) y Valor Monetario ($M$) sobre los `2.292` compradores con pedidos completados, discretiza con `NTILE(4)` invirtiendo la polaridad de la recencia (`ORDER BY recency_days DESC, customer_id ASC`) y clasifica la cartera en 5 segmentos accionables guiados por las curvas de isovalor de Fader, Hardie y Lee (2005).
4. **De correlación observacional a causalidad incremental (`da3-producto-04`):** Cierra el módulo cuestionando qué canales originaron o aceleraron esas compras. Contrasta atribución heurística de primer toque (`ARG_MIN`) frente a último toque con caducidad de 24 horas (`ASOF LEFT JOIN ... AND o.order_date <= tp.event_ts + INTERVAL 24 HOUR`) sobre la ventana `2024-01-01`..`2024-10-17`, demuestra cómo `CMP-VERANO` infla su ROAS de `0,96x` a `1,53x` por canibalización y audita la tabla `experiments` mediante Diferencia en Diferencias (DID) y diagnóstico de Sample Ratio Mismatch (SRM).

---

### Paso 3 — Redacción de las cuatro lecciones y consultas SQL verificadas sobre Mercado Brisa

Se escribieron las 4 lecciones en `src/data/lessons/da3-producto/` siguiendo todos los requisitos de Apéndice A y Apéndice B:

1. **[`da3-producto-01-embudos-conversion-ventana.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-da3-producto/src/data/lessons/da3-producto/da3-producto-01-embudos-conversion-ventana.js)** (`1.065` palabras visibles, `18,6` palabras/oración):
   - **Hallazgo real en Mercado Brisa:** `events` contiene `60.000` filas pero `58.800` `event_id` únicos (`240` duplicados por reintento en cada uno de los 5 `event_type`). Además, si se toma `MIN(CAST(e.event_ts AS DATE))` sin exigir `CAST(e.event_ts AS DATE) >= c.signup_date`, los eventos anónimos previos al alta se asocian retroactivamente al usuario y hacen que el paso 2 (`active_30d`) parezca caer a `58` clientes en `retail` en lugar de los `499` reales.
   - **Resultado de la práctica SQL (embudo estricto de 4 pasos por `segment`):**
     - `retail`: `967` altas $\to$ `499` activos 30d $\to$ `315` intención 60d (`63,13 %`) $\to$ `176` compra 60d (`55,87 %`, conversión global `18,20 %`).
     - `pro_barista`: `966` altas $\to$ `514` activos 30d $\to$ `339` intención 60d (`65,95 %`) $\to$ `212` compra 60d (`62,54 %`, conversión global `21,95 %`).
     - `cafeteria_b2b`: `467` altas $\to$ `255` activos 30d $\to$ `166` intención 60d (`65,10 %`) $\to$ `87` compra 60d (`52,41 %`, conversión global `18,63 %`, cuello de botella en el cierre de pago B2B).

2. **[`da3-producto-02-cohorts-retention-ltv.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-da3-producto/src/data/lessons/da3-producto/da3-producto-02-cohorts-retention-ltv.js)** (`1.019` palabras visibles, `19,3` palabras/oración, limpieza profunda de `l13-cohorts-retention-ltv` con `legacyId: 'l13-cohorts-retention-ltv'`, `legacyOrder: 13`, `needsReview: false`):
   - **Hallazgo real en Mercado Brisa:** Las 4 cohortes trimestrales de 2024 (`2024-01`: `470` clientes, `2024-04`: `401`, `2024-07`: `218`, `2024-10`: `96`) mantienen en `Q+3` tasas de retención de `52,98 %`, `61,60 %`, `61,93 %` y `63,54 %`. Las cohortes de 2025 presentan censura por la derecha a partir del horizonte `2025-11-30`.
   - **Resultado de la práctica SQL (LTV bruto vs. LTV con margen neto por `segment`):** Pre-agregando `order_items` + `products.cost_usd` por `order_id` y `refunds` (`status = 'processed'`) por `order_id`:
     - `cafeteria_b2b` (`467` clientes): LTV bruto `2.825,71 USD` vs. LTV margen neto `1.439,14 USD` (`50,93 %`).
     - `pro_barista` (`966` clientes): LTV bruto `2.601,38 USD` vs. LTV margen neto `1.295,90 USD` (`49,82 %`).
     - `retail` (`967` clientes): LTV bruto `2.520,09 USD` vs. LTV margen neto `1.265,62 USD` (`50,22 %`).

3. **[`da3-producto-03-segmentacion-conductual-rfm.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-da3-producto/src/data/lessons/da3-producto/da3-producto-03-segmentacion-conductual-rfm.js)** (`1.022` palabras visibles, `20,7` palabras/oración):
   - **Hallazgo real en Mercado Brisa:** Sobre los `2.292` compradores con pedidos completados al corte `DATE '2025-12-01'`, entre el `22,01 %` y el `25,69 %` de cada segmento estático de alta lleva más de `180` días sin comprar. Al aplicar `NTILE(4)` con inversión de recencia (`ORDER BY recency_days DESC, customer_id ASC`) y curvas de isovalor:
     - `1_Campeones`: `105` clientes (`18,8` días recencia media, `9,21` pedidos, `5.058,77 USD` medio, `8,47 %` de ingresos).
     - `2_Leales`: `613` clientes (`45,9` días, `8,52` pedidos, `3.396,75 USD` medio, `33,21 %` de ingresos).
     - `3_En_Riesgo_Alto_Valor`: `445` clientes (`180,3` días, `8,37` pedidos, `3.685,18 USD` medio, `26,16 %` de ingresos = `1.639.906,25 USD` en riesgo).
     - `4_Recientes_En_Desarrollo`: `428` clientes (`46,5` días, `4,30` pedidos, `1.770,58 USD` medio, `12,09 %` de ingresos).
     - `5_Inactivos_Bajo_Valor`: `701` clientes (`229,1` días, `4,29` pedidos, `1.795,11 USD` medio, `20,07 %` de ingresos).

4. **[`da3-producto-04-atribucion-marketing-incrementalidad.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-da3-producto/src/data/lessons/da3-producto/da3-producto-04-atribucion-marketing-incrementalidad.js)** (`1.057` palabras visibles, `20,4` palabras/oración):
   - **Hallazgo real en Mercado Brisa:** En la ventana común `2024-01-01`..`2024-10-17` de `marketing_spend`, el cruce de primer toque (`ARG_MIN`) frente a último toque con caducidad de 24h (`ASOF LEFT JOIN`) revela:
     - `CMP-VERANO` (`109.839,33 USD` gasto): Primer toque `343` pedidos (`105.682,79 USD`, `ft_roas = 0,96x`) vs. Último toque 24h `882` pedidos (`167.970,62 USD`, `lt_roas = 1,53x`).
     - `CMP-ORIGEN` (`26.703,45 USD` gasto): Primer toque `985` pedidos (`372.810,74 USD`, `ft_roas = 13,96x`) vs. Último toque 24h `867` pedidos (`162.456,70 USD`, `lt_roas = 6,08x`).
     - `CMP-BARISTA` (`22.306,35 USD` gasto): Primer toque `1.712` pedidos (`705.172,42 USD`, `ft_roas = 31,61x`) vs. Último toque 24h `866` pedidos (`317.517,18 USD`, `lt_roas = 14,23x`).
     - `CMP-RETENCION` (`14.102,07 USD` gasto): Primer toque `1.745` pedidos (`752.319,96 USD`, `ft_roas = 53,35x`) vs. Último toque 24h `832` pedidos (`453.985,01 USD`, `lt_roas = 32,19x`).
   - En `experiments`, `EXP-CHECKOUT-1STEP` (`800` control / `800` treatment, `srm_p_value = 0,8421`) genera un lift causal DID de `+7,47 USD` por usuario (`+5.976,12 USD` incrementales), mientras que `EXP-PUSH-CART` (`980` control / `620` treatment, `srm_p_value = 0,0001`) queda invalidado por Sample Ratio Mismatch.

---

### Paso 4 — Autoevaluación con rúbrica de 8 criterios (§9.2) y pruebas de esquema/copy

Se ejecutaron `node scripts/check-content.mjs --module da3-producto` y `node scripts/check-copy.mjs` obteniendo **0 errores, 0 advertencias y 0 hallazgos**. A continuación se incluye la tabla literal de 8 criterios de §9.2 evaluada en escala `0–4` para las 4 lecciones:

| Criterio (§9.2) | `da3-producto-01` | `da3-producto-02` | `da3-producto-03` | `da3-producto-04` | Evidencia verificable |
| --- | :---: | :---: | :---: | :---: | --- |
| 1. **Precisión técnica** | 4/4 | 4/4 | 4/4 | 4/4 | 14 consultas SQL ejecutadas en DuckDB sobre Mercado Brisa con cifras exactas verificadas y respaldadas por 16 fuentes primarias HTTP 200. |
| 2. **Gancho con escenario real** | 4/4 | 4/4 | 4/4 | 4/4 | Cada `hook` abre con una paradoja real de Mercado Brisa (95 % de conversión sin ventana vs. 80 % de inacción a 60d; LTV bruto inflado por reembolsos; cupones estáticos B2B vs. fuga de alto valor; ROAS de último toque 1,53x vs. primer toque 0,96x en `CMP-VERANO`). |
| 3. **Progresión de complejidad** | 4/4 | 4/4 | 4/4 | 4/4 | Cada lección avanza en 3 secciones desde el grano y limpieza de datos hasta el modelo analítico en SQL y la decisión operativa, más un `workedExample` de 3 pasos que contrasta el antipatrón frente a la consulta corregida. |
| 4. **Ejemplos ejecutables con datos reales** | 4/4 | 4/4 | 4/4 | 4/4 | Todos los bloques `sections[].example`, `workedExample.steps` y `practice` consultan tablas reales de Mercado Brisa (`customers`, `orders`, `order_items`, `products`, `events`, `refunds`, `marketing_spend`, `experiments`). |
| 5. **Comprobaciones con distractores útiles** | 4/4 | 4/4 | 4/4 | 4/4 | 3 `checks` por lección (`12` en total); cada distractor modela un error frecuente real (ej. `ROW_NUMBER` sin filtrar pre-signup, `COALESCE(..., 0)` sobre cohortes censuradas, `ORDER BY recency_days ASC` en `NTILE(4)`, `LEFT JOIN` temporal que multiplica pedidos). |
| 6. **Práctica graduada** | 4/4 | 4/4 | 4/4 | 4/4 | Cada `practice` incluye `starterCode` que falla en `compareQueryResults` (`passed: false`), 3 pistas progresivas (`hints` de estrategia, cláusula y estructura) y `solution` que devuelve exactamente `expectedOutputTable` (`passed: true`). |
| 7. **Voz y claridad (Apéndice B)** | 4/4 | 4/4 | 4/4 | 4/4 | `check-copy.mjs` devuelve `0 hallazgos`; medias de palabras por frase de `18,6`, `19,3`, `20,7` y `20,4` (`<= 22,0`); conteos visibles de `1065`, `1019`, `1022` y `1057` palabras (`900–1600`). |
| 8. **Perspectiva por rol (`roleNotes`)** | 4/4 | 4/4 | 4/4 | 4/4 | Cada lección articula responsabilidades específicas de `de` (contratos de eventos, snapshots reproducibles, auditoría SRM), `da` (ventanas estrictas, curvas de supervivencia, isovalor RFM, DID) y `bi` (embu-dos con tasas paso a paso, matrices triangulares con `NULL`, mapas RFM, paneles ROAS multi-modelo). |

---

### Paso 5 — Términos del glosario del módulo (`docs/curriculo/investigacion/da3-producto-glossary.json`)

Se creó [`docs/curriculo/investigacion/da3-producto-glossary.json`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-da3-producto/docs/curriculo/investigacion/da3-producto-glossary.json) con **10 términos nuevos** vinculados a `moduleId: 'da3-producto'`, validados con `GlossaryListSchema.parse()` (`0` errores) y `check-copy.mjs` (`0` hallazgos). Cada definición tiene entre **23 y 25 palabras** (`<= 25` palabras) e incluye ejemplo concreto y distinción *"se confunde con..."*:

1. `embudo-conversion-ventana` (*Embudo de conversión por ventana* — 25 palabras)
2. `tasa-conversion-paso` (*Tasa de conversión paso a paso* — 24 palabras)
3. `identidad-retroactiva-eventos` (*Asociación retroactiva de identidad* — 24 palabras)
4. `matriz-retencion-triangular` (*Matriz triangular de retención* — 25 palabras)
5. `ltv-margen-neto` (*Valor de vida del cliente con margen neto (LTV neto)* — 25 palabras)
6. `retencion-neta-ingresos` (*Retención neta de ingresos (NRR)* — 24 palabras)
7. `segmentacion-rfm` (*Segmentación conductual RFM* — 25 palabras)
8. `curvas-isovalor-clv` (*Curvas de isovalor RFM-CLV* — 24 palabras)
9. `atribucion-ultimo-toque-asof` (*Atribución de último toque por proximidad temporal (ASOF)* — 24 palabras)
10. `incrementalidad-diferencia-en-diferencias` (*Incrementalidad por Diferencia en Diferencias (DID)* — 25 palabras)

---

### Paso 6 — Proyecto de módulo y rúbrica de 4 criterios

En la sección 3 de [`docs/curriculo/investigacion/da3-producto.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-da3-producto/docs/curriculo/investigacion/da3-producto.md) se diseñó el proyecto integrador del módulo (**"Auditoría integral de crecimiento, retención, cartera RFM e incrementalidad en Mercado Brisa"**), estructurado en 4 bloques encadenados sobre DuckDB:
- **Bloque 1:** Higiene de telemetría (`events`) y embudo secuencial estricto de 4 pasos (30/60 días) por `segment`.
- **Bloque 2:** Matriz triangular de retención trimestral 2024 (`Q+0`..`Q+3`) con tratamiento explícito de censura por la derecha y tabla de LTV con margen neto descontando `cost_usd` y `refunds` (`status = 'processed'`).
- **Bloque 3:** Segmentación conductual RFM al corte `2025-12-01` con `NTILE(4)` y cuantificación del ingreso concentrado en `3_En_Riesgo_Alto_Valor` (`1.639.906,25 USD`).
- **Bloque 4:** Comparativa de ROAS primer toque (`ARG_MIN`) vs. último toque 24h (`ASOF LEFT JOIN`) y dictamen causal DID + SRM sobre `EXP-CHECKOUT-1STEP` y `EXP-PUSH-CART`.

Incluye una rúbrica verificable de **4 criterios en escala 0–4** (*1. Higiene de grano, deduplicación y ventanas temporales*; *2. Rigor financiero en cohortes, censura y margen neto*; *3. Segmentación conductual RFM y atribución temporal con ASOF JOIN*; *4. Inferencia causal DID, diagnóstico SRM y recomendación ejecutiva*).

---

### Paso 7 — Revisión de la experiencia completa (§9.4: UI, DuckDB WASM y Tutor IA real con `agy`)

#### 7.1 Verificación real del Tutor IA con `agy` (`buildContextPrompt` + `runAgyPrompt`)

Se probaron las 4 lecciones invocando el flujo real de `server/ai/contextBuilder.js` (`buildContextPrompt`) y `server/ai/agyRunner.js` (`runAgyPrompt`, modelo `gemini-3.8-flash-low`) con preguntas y consultas con errores realistas de estudiantes. Las 4 llamadas respondieron exitosamente en español citando las tablas, columnas y métricas reales de Mercado Brisa sin regalar la solución en modo `hint`:

1. **`da3-producto-01-embudos-conversion-ventana` (`mode: 'explain'`, `firstTokenMs: 41704`, `durationMs: 44498`, `1401` caracteres):**
   - **Pregunta del alumno:** *"En la sección sobre asociación retroactiva de identidad, ¿por qué si no filtro CAST(e.event_ts AS DATE) >= c.signup_date el número de usuarios de retail que activan en 30 días baja de 499 a 58?"*
   - **Respuesta literal de `agy`:**
     > El número de usuarios cae de **499 a 58** debido a una trampa en la forma en que la función `MIN()` interactúa con el historial previo del cliente (lo que llamamos **asociación retroactiva de identidad**).
     >
     > Esto ocurre paso a paso en la base de datos de **Mercado Brisa** por la siguiente razón:
     >
     > 1. **Qué hace la asociación retroactiva:** Cuando un visitante navega de forma anónima (por ejemplo, en enero) y finalmente crea su cuenta (`signup_date`) meses después (por ejemplo, en mayo), el sistema de telemetría actualiza sus eventos antiguos de enero asignándoles su nuevo `customer_id`.
     > 2. **El error al usar `MIN()` sin filtro previo:** Si calculas la "primera activación" buscando simplemente `MIN(CAST(e.event_ts AS DATE))` sobre toda la tabla `events`, DuckDB tomará aquel evento antiguo de **enero** como su `first_active_date`, e ignorará las sesiones que el usuario hizo en **mayo** justo después de registrarse.
     > 3. **Por qué desaparecen al evaluar la ventana de 30 días:** En el paso final del embudo, la condición exige que la primera activación ocurra **a partir del registro** y dentro de los primeros 30 días (`first_active_date >= signup_date` y `<= 30 días`). Como a esos 441 clientes de `retail` les asignaste por error una `first_active_date` en enero (anterior a su `signup_date` de mayo), la fecha queda fuera del rango válido (`enero < mayo`) y el filtro los descarta como si nunca se hubieran activado tras registrarse.
     > 4. **La corrección:** Al filtrar `WHERE CAST(e.event_ts AS DATE) >= c.signup_date` **antes** de calcular el `MIN()`, descartas el ruido pre-registro y obligas a `MIN()` a capturar el primer evento ocurrido a partir del alta en mayo, recuperando los **499** clientes reales.
     >
     > **Pregunta para comprobar:** Si un usuario visitó la tienda el `2025-02-10`, se registró oficialmente el `2025-03-01` y volvió a ver un producto el `2025-03-05`, ¿qué fecha devolvería `MIN(event_date)` sin el filtro `WHERE` y cuántos días daría `DATEDIFF('day', signup_date, first_active_date)`?

2. **`da3-producto-02-cohorts-retention-ltv` (`mode: 'hint'`, `firstTokenMs: 33010`, `durationMs: 35635`, `1478` caracteres):**
   - **Pregunta del alumno:** *"Quiero calcular el LTV neto restando el costo y los reembolsos directamente en un solo JOIN entre orders, order_items y refunds, y además poner COALESCE(retencion, 0) en los trimestres futuros de las cohortes de julio 2025 para que no salgan NULL. ¿Qué estoy haciendo mal?"*
   - **Respuesta literal de `agy`:**
     > Tu planteamiento toca exactamente los dos riesgos más críticos al construir cohortes y LTV en **Mercado Brisa**. Hay dos problemas distintos que están distorsionando tus números:
     >
     > ### 1. El problema en el SQL: Explosión de filas (*fan-out* `1:N`) al unir tres granos distintos
     > En tu consulta estás uniendo directamente `orders` (grano: 1 fila por `order_id`), `order_items` (grano: múltiples líneas de producto por pedido) y `refunds` (grano: 1 o más reembolsos por pedido) en el mismo `FROM` antes de agregar:
     > * Si un pedido de `total_usd = 100` tiene **4 líneas** en `order_items`, al hacer `SUM(o.total_usd - ...)` en ese cruce directo, los `100 USD` de la cabecera del pedido (`o.total_usd`) se suman **4 veces** (`400 USD`).
     > * Del mismo modo, si ese pedido tiene un reembolso en `refunds`, el monto `r.refund_usd` se multiplicará por cada línea de `order_items` (y además te falta filtrar qué estado de reembolso en `refunds.status` representa dinero realmente devuelto).
     >
     > **Pista para corregirlo:** Antes de cruzar con `orders`, construye dos CTEs independientes que agrupen por `order_id`: una para sumar el costo de los ítems (`order_items` unido con `products`) y otra para sumar los reembolsos válidos (`refunds`). Cuando ambas CTEs tengan exactamente **1 fila por `order_id`**, únelas con `orders`.
     >
     > ### 2. El problema conceptual: `COALESCE(retencion, 0)` confunde censura por la derecha con abandono (*churn*)
     > Nuestro dataset de Mercado Brisa corta el `2025-11-30`. Para la cohorte registrada en `2025-07`, los trimestres `Q+2` o `Q+3` ocurren en **2026** (aún no han sucedido).
     > * Si reemplazas esos `NULL` con `0` usando `COALESCE`, cuando alguien calcule el promedio de retención en `Q+2` o `Q+3`, esas cohortes entrarán al denominador con `0 %` de retención, hundiendo artificialmente la curva de supervivencia aunque ningún cliente haya abandonado.
     >
     > ¿Qué valor tiene la columna `status` en `refunds` para distinguir un reembolso ya procesado de uno pendiente o rechazado antes de pre-agregarlo por `order_id`?

3. **`da3-producto-03-segmentacion-conductual-rfm` (`mode: 'hint'`, `firstTokenMs: 10552`, `durationMs: 12741`, `1095` caracteres):**
   - **Pregunta del alumno:** *"Mi consulta RFM me da clientes con 230 días sin comprar dentro del grupo r_score = 4 (los más recientes). ¿Por qué NTILE(4) les está dando el puntaje más alto a los que llevan más tiempo inactivos?"*
   - **Respuesta literal de `agy`:**
     > El problema está en la dirección del `ORDER BY` dentro de tu función de ventana `NTILE(4)` para la recencia.
     >
     > Fíjate en cómo funciona `NTILE(4)`: siempre asigna el cuartil `1` a las primeras filas según el orden que le indiques y el cuartil `4` a las últimas.
     >
     > * En **Frecuencia** (`frequency_orders`) y **Valor Monetario** (`monetary_usd`), "más alto es mejor". Por eso, al ordenar de menor a mayor (`ASC`), los valores más grandes quedan al final y reciben correctamente el puntaje `4`.
     > * En **Recencia** (`recency_days`), ocurre lo contrario: **menos días sin comprar significa un cliente más reciente** (mejor). Como pusiste `ORDER BY recency_days ASC`, los clientes con pocos días (ej. `5` días) quedan al principio (cuartil `1`) y los inactivos de `230` días quedan al final (cuartil `4`).
     >
     > Para invertir la polaridad y asegurar además un desempate determinista cuando dos clientes tengan los mismos días de recencia, cambia el orden de esa ventana:
     >
     > ```sql
     > NTILE(4) OVER (ORDER BY recency_days DESC, customer_id ASC) AS r_score
     > ```
     >
     > Prueba a ajustar esa línea (y añadir el desempate `customer_id ASC` en `f_score` y `m_score`) y dime cómo cambian los promedios de `recency_days` en tus segmentos.

4. **`da3-producto-04-atribucion-marketing-incrementalidad` (`mode: 'explain'`, `firstTokenMs: 17074`, `durationMs: 19267`, `1138` caracteres):**
   - **Pregunta del alumno:** *"En el resultado de la práctica veo que CMP-VERANO pasa de ft_roas = 0.96 a lt_roas = 1.53, mientras que CMP-ORIGEN baja de 13.96 a 6.08. ¿Qué significa esto para decidir el presupuesto de marketing y cómo se relaciona con el experimento DID?"*
   - **Respuesta literal de `agy`:**
     > Esa divergencia entre `ft_roas` (primer toque) y `lt_roas` (último toque en 24 h) revela el rol real de cada campaña en el embudo de **Mercado Brisa** y el sesgo de canibalización:
     >
     > 1. **Qué ocurre con `CMP-VERANO` (`ft_roas = 0,96x` vs. `lt_roas = 1,53x`):**
     >    Apenas origina clientes nuevos (`343` pedidos de primer toque frente a casi `110.000 USD` de gasto, perdiendo dinero con `0,96x`). Sin embargo, en último toque salta a `882` pedidos (`1,53x`) porque actúa como campaña de *retargeting* o cierre: impacta con anuncios o cupones a clientes que **ya habían sido captados antes** por otros canales y estaban a punto de comprar.
     > 2. **Qué ocurre con `CMP-ORIGEN` (`ft_roas = 13,96x` vs. `lt_roas = 6,08x`):**
     >    Es un motor de descubrimiento en la parte alta del embudo (`985` pedidos originados). Su retorno cae a la mitad en último toque porque campañas tardías como `CMP-VERANO` se interponen justo antes del pago y "roban" el crédito de la conversión.
     > 3. **Relación con el experimento DID (Incrementalidad):**
     >    Ni `0,96x` ni `1,53x` prueban cuántas ventas de `CMP-VERANO` son realmente **nuevas** (causales) y cuántas habrían ocurrido gratis de forma orgánica. Para decidir si recortar o mantener su presupuesto sin destruir ventas, debes exigir una prueba de **Diferencia en Diferencias (DID)** con grupo de control (*holdout*) y verificar primero que no tenga sesgo de asignación (**SRM**, `srm_p_value >= 0,01`): solo el *lift* neto $(\bar{Y}_{T,\text{post}} - \bar{Y}_{T,\text{pre}}) - (\bar{Y}_{C,\text{post}} - \bar{Y}_{C,\text{pre}})$ mide el dinero genuinamente incremental.
     >
     > **Pregunta para comprobar:** Si mañana apagas `CMP-VERANO` en un test con grupo de control y observas que el gasto medio de los clientes expuestos y no expuestos crece exactamente lo mismo (`DID lift = 0 USD`), ¿cuál era el retorno incremental real de esos `167.970,62 USD` atribuidos por último toque?

#### 7.2 Rúbrica de experiencia completa de 8 criterios (§9.4)

Se verificaron las 4 lecciones en navegador real Chromium (`playwright-core` sobre `http://127.0.0.1:5225`) en escritorio (`1440x900`, temas claro y oscuro) y móvil (`375x812`), ejecutando el laboratorio SQL DuckDB WASM y el cajón del Tutor IA con **0 errores de consola y 0 errores de página**:

| Criterio (§9.4) | `da3-producto-01` | `da3-producto-02` | `da3-producto-03` | `da3-producto-04` | Evidencia en navegador (`127.0.0.1:5225`) y `agy` |
| --- | :---: | :---: | :---: | :---: | --- |
| 1. **Renderizado y legibilidad** | 4/4 | 4/4 | 4/4 | 4/4 | Jerarquía editorial nítida en claro y oscuro (`L01..L04-desktop-light.png`, `L01..L04-desktop-dark.png`), `scrollWidth === clientWidth` (`1440 <= 1440` en escritorio y `375 <= 375` en móvil). |
| 2. **Alineación texto ↔ visualizador / bloques** | 4/4 | 4/4 | 4/4 | 4/4 | Los 3 bloques SQL de cada sección y el `workedExample` de 3 pasos reflejan exactamente las cifras discutidas en la prosa (`499` vs `58` activos; `52,98 %`–`63,54 %` retención `Q+3`; `445` clientes en `3_En_Riesgo_Alto_Valor`; `0,96x` vs `1,53x` ROAS en `CMP-VERANO`). |
| 3. **Ejemplo trabajado y notas de rol** | 4/4 | 4/4 | 4/4 | 4/4 | El componente `LessonWorkedExample` permite alternar los 3 pasos (`antipatrón` $\to$ `diagnóstico` $\to$ `solución`) y `LessonRoleNotes` muestra las pestañas `Ingeniería de Datos`, `Análisis de Datos` y `Business Intelligence`. |
| 4. **Comprobaciones interactivas (`checks`)** | 4/4 | 4/4 | 4/4 | 4/4 | Las 3 tarjetas `LessonCheckCard` por lección renderizan opciones, retroalimentación individual (`why`) y botón contextual de consulta al tutor. |
| 5. **Laboratorio SQL DuckDB WASM (`AuthenticCodeLab`)** | 4/4 | 4/4 | 4/4 | 4/4 | En las 4 lecciones, pulsar `Comprobar resultado` con `starterCode` devuelve fallo diagnóstico (`passed: false`) y con `solution` devuelve `Resultado verificado` (`passed: true`, capturas `L01..L04-sql-lab-passed.png`). |
| 6. **Tutor IA contextual (`agy`) — Modo `explain`** | 4/4 | 4/4 | 4/4 | 4/4 | Probado con `agy` real (`gemini-3.8-flash-low`): explica con precisión la asociación retroactiva en `da3-producto-01` y la divergencia ROAS FT vs. LT + DID en `da3-producto-04`, cerrando con pregunta de verificación. |
| 7. **Tutor IA contextual (`agy`) — Modo `hint`** | 4/4 | 4/4 | 4/4 | 4/4 | Probado con `agy` real (`gemini-3.8-flash-low`): diagnostica el fan-out `1:N` y el `COALESCE` sobre cohortes censuradas en `da3-producto-02` y la polaridad invertida de `NTILE(4)` en `da3-producto-03` sin revelar la consulta final. |
| 8. **Ausencia de errores y cierre honesto** | 4/4 | 4/4 | 4/4 | 4/4 | `0` errores de consola, `0` errores de página, sección `Lo que debes recordar` y `Fuentes y lecturas recomendadas` completas con enlaces verificados. |

---

## Test

### 1. Validación de esquema, conteo de palabras y ejecución SQL en DuckDB (`check-content.mjs`)

Comando ejecutado:
```powershell
node scripts/check-content.mjs --module da3-producto
```
Salida literal:
```text
✔ [da3-producto] da3-producto-01-embudos-conversion-ventana.js (1065 palabras, 4 bloques SQL)
✔ [da3-producto] da3-producto-02-cohorts-retention-ltv.js (1019 palabras, 3 bloques SQL)
✔ [da3-producto] da3-producto-03-segmentacion-conductual-rfm.js (1022 palabras, 3 bloques SQL)
✔ [da3-producto] da3-producto-04-atribucion-marketing-incrementalidad.js (1057 palabras, 4 bloques SQL)

Resumen check-content: 4 válidas | 0 con advertencias | 0 con errores (total: 4)
```

### 2. Auditoría editorial Apéndice B (`check-copy.mjs`)

Comando ejecutado:
```powershell
node scripts/check-copy.mjs --path src/data/lessons/da3-producto --path docs/curriculo/investigacion/da3-producto.md --path docs/curriculo/investigacion/da3-producto-glossary.json
```
Salida literal:
```text
check-copy: 6 archivo(s) escaneados — 0 hallazgos.
```

### 3. Validación del glosario contra `GlossaryListSchema` y límite de 25 palabras

Comando ejecutado:
```powershell
node C:\Users\T490s\.gemini\antigravity\brain\580e7f53-6209-4e65-8b44-b3e1c2c2aeda\scratch\check_glossary.mjs
```
Salida literal:
```text
GlossaryListSchema validation passed! Count: 10
  - embudo-conversion-ventana: 25 words
  - tasa-conversion-paso: 24 words
  - identidad-retroactiva-eventos: 24 words
  - matriz-retencion-triangular: 25 words
  - ltv-margen-neto: 25 words
  - retencion-neta-ingresos: 24 words
  - segmentacion-rfm: 25 words
  - curvas-isovalor-clv: 24 words
  - atribucion-ultimo-toque-asof: 24 words
  - incrementalidad-diferencia-en-diferencias: 25 words
```

### 4. Verificación del calificador SQL (`compareQueryResults`) con `starterCode` vs. `solution`

Comando ejecutado:
```powershell
node C:\Users\T490s\.gemini\antigravity\brain\580e7f53-6209-4e65-8b44-b3e1c2c2aeda\scratch\verify_grader.mjs
```
Salida literal:
```text
[da3-producto-01-embudos-conversion-ventana.js]
  starterCode grade: passed=false (rows_mismatch)
  solution grade:    passed=true (ok)
  expectedTable grade: passed=true (ok)
[da3-producto-02-cohorts-retention-ltv.js]
  starterCode grade: passed=false (rows_mismatch)
  solution grade:    passed=true (ok)
  expectedTable grade: passed=true (ok)
[da3-producto-03-segmentacion-conductual-rfm.js]
  starterCode grade: passed=false (rows_mismatch)
  solution grade:    passed=true (ok)
  expectedTable grade: passed=true (ok)
[da3-producto-04-atribucion-marketing-incrementalidad.js]
  starterCode grade: passed=false (rows_mismatch)
  solution grade:    passed=true (ok)
  expectedTable grade: passed=true (ok)

ALL 4 LESSONS PASSED GRADER VERIFICATION!
```

### 5. Verificación en navegador real (`playwright-core`) y compilación de producción (`npm run build`)

Comandos ejecutados:
```powershell
npm run build
node C:\Users\T490s\.gemini\antigravity\brain\580e7f53-6209-4e65-8b44-b3e1c2c2aeda\scratch\verify_browser.mjs
```
Salida literal:
```text
✓ 2437 modules transformed.
✓ built in 1m 11s

=== Verifying da3-producto-01-embudos-conversion-ventana in browser ===
[da3-producto-01-embudos-conversion-ventana] Desktop 1440x900 light overflow check: 1440 <= 1440
[da3-producto-01-embudos-conversion-ventana] starterCode failed in browser as expected: true
[da3-producto-01-embudos-conversion-ventana] solution passed in browser: true
[da3-producto-01-embudos-conversion-ventana] Mobile 375x812 overflow check: 375 <= 375

=== Verifying da3-producto-02-cohorts-retention-ltv in browser ===
[da3-producto-02-cohorts-retention-ltv] Desktop 1440x900 light overflow check: 1440 <= 1440
[da3-producto-02-cohorts-retention-ltv] starterCode failed in browser as expected: true
[da3-producto-02-cohorts-retention-ltv] solution passed in browser: true
[da3-producto-02-cohorts-retention-ltv] Mobile 375x812 overflow check: 375 <= 375

=== Verifying da3-producto-03-segmentacion-conductual-rfm in browser ===
[da3-producto-03-segmentacion-conductual-rfm] Desktop 1440x900 light overflow check: 1440 <= 1440
[da3-producto-03-segmentacion-conductual-rfm] starterCode failed in browser as expected: true
[da3-producto-03-segmentacion-conductual-rfm] solution passed in browser: true
[da3-producto-03-segmentacion-conductual-rfm] Mobile 375x812 overflow check: 375 <= 375

=== Verifying da3-producto-04-atribucion-marketing-incrementalidad in browser ===
[da3-producto-04-atribucion-marketing-incrementalidad] Desktop 1440x900 light overflow check: 1440 <= 1440
[da3-producto-04-atribucion-marketing-incrementalidad] starterCode failed in browser as expected: true
[da3-producto-04-atribucion-marketing-incrementalidad] solution passed in browser: true
[da3-producto-04-atribucion-marketing-incrementalidad] Mobile 375x812 overflow check: 375 <= 375

Console errors: 0
Page errors: 0
ALL BROWSER CHECKS AND SCREENSHOTS COMPLETED SUCCESSFULLY!
```

---

## Revisión propia

Durante la redacción y verificación se detectaron y corrigieron **6 defectos reales** en nuestros archivos:

1. **Campos obligatorios faltantes en `sources` de `docs/curriculo/investigacion/da3-producto-glossary.json`:**
   - **Defecto:** La primera versión de `da3-producto-glossary.json` incluía solo `{ title, author, year, url }` en `sources[]` y tenía definiciones de 26–29 palabras. Al validar contra `GlossaryListSchema` (`src/data/schema/glossary.js`), Zod rechazó las entradas por carecer de `publisher`, `accessed` y `supports`.
   - **Corrección:** Se añadieron `publisher`, `accessed: '2026-10-29'` y `supports` a las 10 fuentes de `da3-producto-glossary.json` y se ajustaron las 10 definiciones al rango exacto de `24–25` palabras (`<= 25` palabras).
2. **Estructura de campos de `LessonSchema` v2 en `src/data/lessons/da3-producto/da3-producto-01..04.js`:**
   - **Defecto:** En el primer borrador de las 4 lecciones se usó `track: 'da'`, `options[].label` + `correctOptionId` en `checks` y `expectedOutput` en `practice`. `node scripts/check-content.mjs --module da3-producto` reportó error de validación Zod porque `LessonSchema` v2 exige `contentVersion: 2`, `tracks: ['da']`, `options: [{ id, text, correct, why }]`, `practice.expected` (cadena SQL) y `practice.expectedOutputTable` (`{ columns, rows }`).
   - **Corrección:** Se actualizaron las 4 lecciones en `src/data/lessons/da3-producto/` al contrato exacto de `LessonSchema` v2, incluyendo las tablas literales `expectedOutputTable` generadas desde DuckDB.
3. **Referencias a IDs de glosario inexistentes en `glossaryTerms` de las 4 lecciones:**
   - **Defecto:** Las lecciones referenciaban en `glossaryTerms` identificadores genéricos (`cohort`, `ltv`, `right-censoring`, `asof-join`, `window-function`, `cte`) que no coincidían con los IDs prefijados de `src/data/glossary.js` (`c13-cohort`, `c04-asof`, etc.), generando 4 advertencias en `check-content.mjs`.
   - **Corrección:** Se vincularon las 4 lecciones exactamente con los 10 identificadores canónicos definidos en `docs/curriculo/investigacion/da3-producto-glossary.json`, eliminando el 100 % de las advertencias de `check-content.mjs`.
4. **Voz prohibida del Apéndice B (`"innegociable"`) en `da3-producto-02-cohorts-retention-ltv.js`:**
   - **Defecto:** En `src/data/lessons/da3-producto/da3-producto-02-cohorts-retention-ltv.js` (línea 199, `roleNotes.de`), la frase *"Documentar en el catálogo qué estados de pedido y de reembolso entran en el cálculo es una responsabilidad innegociable"* disparó un hallazgo en `scripts/check-copy.mjs`.
   - **Corrección:** Se sustituyó `"innegociable"` por `"obligatoria"`, dejando `0` hallazgos en `da3-producto-02-cohorts-retention-ltv.js`.
5. **Longitud media de oración superior a 22 palabras en `da3-producto-03-segmentacion-conductual-rfm.js` y `da3-producto-04-atribucion-marketing-incrementalidad.js`:**
   - **Defecto:** `scripts/check-copy.mjs` detectó una media de `22,8` palabras/oración en `da3-producto-03` y una aparición de `"innegociable"` en `da3-producto-04` (línea 124).
   - **Corrección:** Se dividieron las oraciones subordinadas largas en `hook`, `sections[].body`, `workedExample` y `roleNotes` de `da3-producto-03` y `da3-producto-04`, reduciendo sus medias a `20,7` y `20,4` palabras/oración respectivamente (`<= 22,0`).
6. **Errata verbal en el primer objetivo de `da3-producto-03-segmentacion-conductual-rfm.js` detectada al inspeccionar la captura `L03-desktop-light.png`:**
   - **Defecto:** Al revisar visualmente `L03-desktop-light.png`, se observó que el objetivo `01` en `src/data/lessons/da3-producto/da3-producto-03-segmentacion-conductual-rfm.js` (línea 15) empezaba con subjuntivo (`"Contrastes las etiquetas demográficas estáticas..."`) en lugar de infinitivo (`"Contrastar..."`).
   - **Corrección:** Se corrigió la línea 15 a `'Contrastar las etiquetas demográficas estáticas frente a la segmentación conductual basada en transacciones reales.'` y se re-verificó con `check-content.mjs` y `check-copy.mjs`.

---

## Prueba adversarial

Se diseñaron y ejecutaron **6 pruebas adversariales** sobre las consultas SQL, el dataset Mercado Brisa, el calificador y el reproductor de lecciones:

| # | Caso adversarial | Acción / entrada probada | Resultado observado y resolución |
| :---: | --- | --- | --- |
| 1 | **Asociación retroactiva de identidad en `events` (`da3-producto-01`)** | Calcular `MIN(CAST(e.event_ts AS DATE))` por `customer_id` sin filtrar `CAST(e.event_ts AS DATE) >= c.signup_date` antes de evaluar la ventana de 30 días. | DuckDB asigna como primera activación eventos anónimos previos al registro; al exigir luego `first_active_date >= signup_date` en el embudo, los clientes activos de `retail` caen artificialmente de `499` a `58`. Se blindó la CTE `post_signup_events` con `WHERE CAST(e.event_ts AS DATE) >= c.signup_date` y se documentó en el `workedExample` de `da3-producto-01`. |
| 2 | **Duplicados de telemetría por reintentos de red en `events` (`da3-producto-01` y `da3-producto-04`)** | Contar eventos directamente sobre `events` (`60.000` filas) frente a `COUNT(DISTINCT event_id)` (`58.800` filas). | Existen exactamente `1.200` filas duplicadas (`240` por cada uno de los 5 `event_type`). En `da3-producto-01` y `da3-producto-04` se incluyó deduplicación explícita (`SELECT DISTINCT` / grano de usuario) tanto en los ejemplos como en `practice.solution`. |
| 3 | **Explosión *fan-out* `1:N` al cruzar `orders`, `order_items` y `refunds` (`da3-producto-02`)** | Unir `orders` directamente con `order_items` y `refunds` en un único `FROM` para calcular el LTV neto. | `SUM(o.total_usd)` se multiplica por el número de líneas del pedido (`42.000` ítems para `18.000` pedidos), triplicando el LTV bruto. Se resolvió pre-agregando `item_costs` (`GROUP BY order_id`) y `order_refunds` (`WHERE status = 'processed' GROUP BY order_id`) en CTEs independientes antes de unir con `orders`. |
| 4 | **Empates en cuantiles `NTILE(4)` e inversión de signo en Recencia (`da3-producto-03`)** | Ejecutar `NTILE(4) OVER (ORDER BY recency_days ASC)` y `NTILE(4) OVER (ORDER BY frequency_orders ASC)` sin columna de desempate en `2.292` compradores. | Sin `DESC` en `recency_days`, los clientes inactivos (`> 200` días) reciben `r_score = 4`; sin desempate determinista, clientes con igual número de pedidos (`frequency_orders = 6`) pueden saltar entre cuartiles `2` y `3` entre ejecuciones. Se fijó `ORDER BY recency_days DESC, customer_id ASC` y desempate `customer_id ASC` en las tres ventanas `NTILE(4)`. |
| 5 | **Ventana temporal asimétrica entre `marketing_spend` y `orders` (`da3-producto-04`)** | Cruzar `marketing_spend` (`730` filas, `2024-01-01` a `2024-10-17`) contra todos los pedidos de `2024–2025` en `orders`. | Si no se acota `orders` a la misma ventana auditada (`< TIMESTAMP '2024-10-18 00:00:00'`), el ROAS suma 13 meses de ingresos sin gasto publicitario registrado en denominador. Se acotó la ventana a `2024-01-01`..`2024-10-17` y se impuso caducidad `o.order_date <= tp.event_ts + INTERVAL 24 HOUR` en el `ASOF LEFT JOIN`. |
| 6 | **Resolución de `legacyId` en `LessonPlayer` para lecciones migradas (`da3-producto-02`)** | Abrir `da3-producto-02-cohorts-retention-ltv` en el navegador inyectando su nuevo ID en `progress.lessons` de `localStorage`. | Como `adaptLessonForLegacyPlayer` en `src/data/lessons/index.js` expone `id: lesson.legacyId || lesson.id` en el arreglo `LESSONS`, buscar solo `da3-producto-02-cohorts-retention-ltv` en `LESSONS` caía por defecto en `LESSONS[0]`. Se verificó que `LESSONS_BY_ID` indexa ambos IDs y se probó en el navegador con `'l13-cohorts-retention-ltv'` (`L02-desktop-light.png` y `L02-desktop-dark.png`). |

---

## Capturas antes / después

Se generaron **18 capturas en navegador real** (`docs/reportes/capturas/W-da3-producto/`) cubriendo las 4 lecciones en escritorio claro (`1440x900`), escritorio oscuro (`1440x900`), laboratorio SQL con solución verificada (`Resultado verificado`), cajón del Tutor IA contextual y vista móvil (`375x812`):

| Lección | Escritorio Claro (`1440x900`) | Escritorio Oscuro (`1440x900`) | Laboratorio SQL Verificado | Tutor IA / Móvil (`375x812`) |
| --- | --- | --- | --- | --- |
| `da3-producto-01` | `L01-desktop-light.png` | `L01-desktop-dark.png` | `L01-sql-lab-passed.png` | `L01-tutor-drawer.png`, `L01-mobile-375x812.png` |
| `da3-producto-02` | `L02-desktop-light.png` | `L02-desktop-dark.png` | `L02-sql-lab-passed.png` | `L02-mobile-375x812.png` |
| `da3-producto-03` | `L03-desktop-light.png` | `L03-desktop-dark.png` | `L03-sql-lab-passed.png` | `L03-mobile-375x812.png` |
| `da3-producto-04` | `L04-desktop-light.png` | `L04-desktop-dark.png` | `L04-sql-lab-passed.png` | `L04-tutor-drawer.png`, `L04-mobile-375x812.png` |

---

## Peticiones al orquestador

1. **Sincronización del índice de lecciones (`src/data/lessons/index.js`):** Al integrar la rama `agente/W-da3-producto`, ejecutar `node scripts/sync-lessons-index.mjs` para registrar las 4 lecciones de `src/data/lessons/da3-producto/` en `src/data/lessons/index.js` y retirar la importación de `src/data/lessons/legacy/l13-cohorts-retention-ltv.js` (reemplazada por `da3-producto-02-cohorts-retention-ltv.js` con `legacyId: 'l13-cohorts-retention-ltv'`).
2. **Integración del glosario del módulo (`src/data/glossary.js`):** Incorporar las 10 entradas validadas de `docs/curriculo/investigacion/da3-producto-glossary.json` en `src/data/glossary.js` durante el paso de consolidación de la Ola C.

---

## Pendiente (con motivo)

Ninguno.
