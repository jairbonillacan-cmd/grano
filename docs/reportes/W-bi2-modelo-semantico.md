# Reporte de escritor — `W-bi2-modelo-semantico`

- **Agente:** `W-bi2-modelo-semantico`
- **Módulo:** `bi2-modelo-semantico` — *Modelo semántico en la herramienta de BI* (Nivel 2, Ruta BI — Business Intelligence, Fase 3, Oleada B)
- **Rama de trabajo:** `agente/W-bi2-modelo-semantico`
- **Worktree aislado:** `C:\Users\T490s\Desktop\Proyectos\ING-W-bi2-modelo-semantico`
- **Puerto Vite dedicado:** `5218`

---

## Inicio

Archivos leídos antes de iniciar la escritura y un dato concreto extraído de cada uno:

1. `PLAN_GEMINI_4_ARGON.md`: El flujo obligatorio de escritor consta de 7 pasos (§9.2), la rúbrica de calidad evalúa 8 criterios de 0 a 4 con mínimo 3 en cada uno (§9.4), el Apéndice A fija entre 600 y 1 600 palabras visibles para lecciones de nivel 1 a 4, el Apéndice B prohíbe vocabulario de relleno y exige una media máxima de 22 palabras por frase en `sections[].body`, y el Apéndice D define la plantilla de reporte.
2. `src/data/catalog/modules.js`: El módulo `bi2-modelo-semantico` pertenece a `track: 'bi'`, `level: 2`, tiene como prerrequisito `['bi2-metricas']`, consta de 5 lecciones con tiempos estimados `[25, 25, 20, 20, 20]` (110 minutos en total) y su proyecto integrador utiliza las tablas `orders`, `order_items`, `products`, `customers`, `stores`, `refunds` y `calendar`.
3. `public/datasets/README.md`: El dataset determinista de Mercado Brisa (semilla PRNG `19870315`, 13 tablas Parquet, 2,14 MB) incluye anomalías deliberadas como el fan-out `1:N` entre `orders` (18 000 filas), `order_items` (42 000 filas) y `refunds` (1 450 filas), el producto `SKU-TEST-NEG` con `list_price_usd = -9.99` y la tabla SCD2 `customer_changes` con 4 100 filas para 2 400 clientes.
4. `public/datasets/schema.json`: Registra los nombres exactos de columnas, tipos en DuckDB, conteos de filas y hashes SHA-256 de las 13 tablas Parquet (`orders`, `order_items`, `products`, `customers`, `customer_changes`, `payments`, `refunds`, `events`, `marketing_spend`, `experiments`, `experiment_assignments`, `stores` y `calendar`).
5. `src/data/schema/lesson.js`: `LessonSchema` (Zod) valida que `title` tenga máximo 60 caracteres, `hook` entre 40 y 90 palabras terminando en `?`, `sections` entre 2 y 4 bloques con `heading <= 70` caracteres y `body` de 80 a 250 palabras, `checks` de 2 a 4 ítems con al menos 2 tipos distintos, `roleNotes` de 25 a 70 palabras por rol (`de`, `da`, `bi`), `summary` de 3 a 5 frases `<= 25` palabras, `sources >= 3` con URL `https://` y fecha `YYYY-MM-DD`, y `aiNotes <= 80` palabras.
6. `src/data/schema/glossary.js`: `GlossaryTermSchema` y `GlossaryListSchema` exigen `id` en kebab-case, `track` en `['core', 'de', 'da', 'bi']`, `definition` entre 20 y 60 palabras (con definición, ejemplo y contraejemplo), `relatedLessons` con al menos 1 ID y `sources` con al menos 1 fuente verificable.
7. `scripts/check-content.mjs`: Valida todas las lecciones contra `LessonSchema`, comprueba unicidad de IDs, existencia de `prerequisites` en `knownLessonIds`, existencia de cada término de `glossaryTerms` en `src/data/glossary.js` o en `docs/curriculo/investigacion/*-glossary.json`, y rango de palabras visibles `[600, 1600]`.
8. `scripts/check-copy.mjs`: Escanea términos prohibidos del Apéndice B.2, emojis Unicode, apariciones del literal `'2026'` fuera de `sources`/`accessed`, párrafos con más de 3 bloques en negrita (`**...**`) y calcula la longitud media de frase en `sections[].body` (máximo `<= 22` palabras/frase).
9. `scripts/sync-lessons-index.mjs`: Recorre `src/data/lessons/**`, genera `src/data/lessons/index.js` y adapta las lecciones v2 al formato consumido por `LessonPlayer`.
10. `server/ai/contextBuilder.js`: `buildContextPrompt` resuelve la lección y sección desde `src/data/lessons/index.js` (`loadCurriculumData`), inyecta `aiNotes`, `objectives`, `sectionBody` y `MERCADO_BRISA_SCHEMA_SUMMARY` en las plantillas de `server/ai/prompts/` y aplica un tope estricto de `24 000` caracteres (`MAX_TOTAL_PROMPT_CHARS`).
11. `server/ai/agyRunner.js`: `runAgyPrompt` y `runAgyStream` ejecutan el binario `agy.exe` con `shell: false`, argumentos `['--model', resolvedModel, '--sandbox', '--disable-slash-commands']` y directorio de trabajo en una carpeta temporal vacía (`os.tmpdir()/grano-ai-*`), enviando el prompt por `stdin` con timeouts de 45 s al primer byte y 120 s en total.
12. `package.json`: Define los scripts `dev`, `build`, `check:content`, `check:copy`, `check:catalog` y `check:contrast`, e incluye `@duckdb/node-api`, `@duckdb/duckdb-wasm`, `playwright-core` y `zod` como dependencias.
13. `vite.config.js`: Monta los plugins `react()` y `granoAiPlugin()` desde `./server/ai/routes.js` y separa DuckDB y CodeMirror fuera del chunk `vendor` inicial.
14. `src/main.jsx`: Punto de entrada React que monta `<App />` dentro de `React.StrictMode` e importa `./styles.css`.
15. `src/App.jsx`: Enrutador de vistas principales (`home`, `roadmap`, `lesson`, `practice`, `review`, `capstones`, `glossary`, `analytics`, `settings`) управляado por `useAppController()` y envuelto en `AppShell` con `TutorPanel` lateral.
16. `src/styles/tokens.css`: Define los tokens tipográficos (`--font-sans`, `--font-display`, `--font-mono`, `--fs-1..8`), espaciados (`--sp-*`) y paletas semánticas para modo claro (`:root`) y modo oscuro (`[data-theme="dark"]`).
17. `src/components/LessonVisualizers.jsx`: Registra los componentes interactivos disponibles para `interactive.component`, incluyendo `'star-vs-obt-sim'`, `'join-fanout-visualizer'` y `'row-vs-columnar-storage'`.
18. `src/data/lessons/c2-dimensional/c2-dimensional-02-star-schema-obt.js`: Lección v2 migrada (`legacyId: 'l4-star-schema-obt'`) del módulo `c2-dimensional` que introduce OLTP frente a OLAP, el esquema en estrella de Kimball y la comparativa con una tabla ancha (OBT).
19. `src/data/glossary.js`: Exporta `GLOSSARY_CONCEPTS_2026` (con IDs existentes como `c06-star-vs-obt`, `c09-non-additive-metrics` y `c12-parquet-columnar`) y carga dinámicamente los archivos `docs/curriculo/investigacion/*-glossary.json` para fusionarlos en `GLOSSARY_TERMS` y `GLOSSARY_BY_ID`.
20. `src/data/lessons/c0-negocio/c0-negocio-03-kpi-metrica-vanidad.js`: Ejemplo de lección v2 validada de referencia que muestra la estructura completa de `sections`, `workedExample`, `checks`, `practice`, `roleNotes`, `summary`, `flashcards`, `sources` y `aiNotes`.
21. `docs/curriculo/investigacion/c1-modelo.md` y `docs/curriculo/investigacion/c1-modelo-glossary.json`: Ejemplos de referencia del documento de investigación curricular (tabla de fuentes del Paso 1, mapa de progresión del Paso 2 y proyecto del Paso 6) y del archivo JSON de glosario del módulo.
22. `src/data/lessons/c1-modelo/c1-modelo-01-claves-primarias-foraneas.js` y `src/data/lessons/c1-modelo/c1-modelo-05-validacion-bloqueante.js`: Ejemplos de lecciones v2 con consultas SQL ejecutadas sobre el dataset real de Mercado Brisa y prácticas con `expectedOutputTable`.

---

## Pasos

### Paso 1 — Investigación con fuentes primarias

Se verificaron mediante petición HTTP real (`status: 200`) 17 fuentes primarias oficiales y técnicas (Microsoft Learn Power BI Guidance, Microsoft Learn DAX Reference, Kimball Group y SQLBI) y se documentaron en `docs/curriculo/investigacion/bi2-modelo-semantico.md`:

| Lección | Fuentes primarias verificadas (`HTTP 200`) |
|---|---|
| `bi2-modelo-semantico-01-estrella-vertipaq` | Microsoft Learn (`star-schema`, `import-modeling-data-reduction`) y Kimball Group (`dimensional-modeling-techniques`). |
| `bi2-modelo-semantico-02-relaciones-cardinalidad` | Microsoft Learn (`desktop-create-and-manage-relationships`, `relationships-one-to-one`, `relationships-many-to-many`) y SQLBI (`blank-row-in-dax`). |
| `bi2-modelo-semantico-03-direccion-filtro-cruzado` | Microsoft Learn (`relationships-bidirectional-filtering`, `dax/crossfilter-function`) y SQLBI (`bidirectional-relationships-and-ambiguity-in-dax`). |
| `bi2-modelo-semantico-04-tablas-fechas-userelationship` | Microsoft Learn (`model-date-tables`, `auto-date-time`, `relationships-active-inactive`, `dax/userelationship-function`). |
| `bi2-modelo-semantico-05-medidas-vs-columnas-calculadas` | Microsoft Learn (`desktop-tutorial-create-measures`, `desktop-tutorial-create-calculated-columns`) y SQLBI (`calculated-columns-and-measures-in-dax`). |

### Paso 2 — Mapa de conceptos y progresión

Se diseñó la progresión de las 5 lecciones sin solaparse con `c2-dimensional-02-star-schema-obt` (que cubre OLTP vs OLAP y Kimball vs OBT en el almacén SQL), enfocando `bi2-modelo-semantico` en la arquitectura interna del motor tabular en memoria (VertiPaq) y el grafo de relaciones en Power BI:

1. `bi2-modelo-semantico-01-estrella-vertipaq` (`25 min`): Diccionarios por columna, codificación RLE, separación entre el motor de almacenamiento (Storage Engine) y el motor de fórmulas (Formula Engine), auditoría de cardinalidad de columnas (`order_item_id` al 100 % frente a `store_id` al 0,08 %) y duplicación de importes de cabecera (`orders.total_usd`: `5 734 127,48 USD` inflados frente a `2 055 247,53 USD` reales en Cono Sur).
2. `bi2-modelo-semantico-02-relaciones-cardinalidad` (`25 min`): Validación del lado `1` (`COUNT(*) = COUNT(DISTINCT pk)`), fila en blanco automática (`Blank Row`) de VertiPaq, peligro de las relaciones muchos a muchos (`N:M`) directas (`customer_changes` con 4 100 filas multiplica Cono Sur a `3 526 247,16 USD`; unir `order_items` con `refunds` infla los reembolsos a `757 985,68 USD` frente a `321 097,25 USD` reales) y tres patrones de resolución (filtro `is_current = true`, pre-agregación `1:1` y tabla puente).
3. `bi2-modelo-semantico-03-direccion-filtro-cruzado` (`20 min`): Propagación unidireccional (`Single`, `1 -> N`), riesgos del filtro bidireccional permanente (`Both`: ocultamiento de `SKU-TEST-NEG`, pérdida de `46 562,73 USD` en reembolsos de pedidos cancelados y ambigüedad de rutas entre `orders` y `refunds`), filtro visual de segmentadores y uso acotado de `CROSSFILTER(..., Both)` dentro de `CALCULATE`.
4. `bi2-modelo-semantico-04-tablas-fechas-userelationship` (`20 min`): Auditoría de los cuatro requisitos para marcar una tabla de fechas (`Mark as date table`), hallazgo real en `calendar.parquet` (1 095 filas entre `2023-01-01` y `2025-12-30`, faltando `2025-12-31` por el bisiesto 2024), desactivación de `Auto date/time`, propiedad `Sort by column` y activación de relaciones secundarias inactivas (`refunds.refund_date`) con `USERELATIONSHIP` (descuadre de `1 254,46 USD` en `FY24-Q1` y `1 800,15 USD` en `FY24-Q4`).
5. `bi2-modelo-semantico-05-medidas-vs-columnas-calculadas` (`20 min`): Evaluación en tiempo de refresco (columna calculada almacenada en RAM) frente a tiempo de consulta (medida DAX en CPU), demostración matemática del error de promediar porcentajes por fila (`promedio_columna_pct` da `1,23 %` en `Almacén Logístico Coslada` cuando la razón ponderada real es `0,90 %`, y `1,15 %` en `Tienda Palermo Soho` frente a `1,27 %` real) y casos legítimos de columnas empujadas a vistas SQL.

Se crearon y validaron además 8 términos nuevos de glosario en `docs/curriculo/investigacion/bi2-modelo-semantico-glossary.json`: `motor-vertipaq`, `esquema-estrella-semantico`, `cardinalidad-relaciones-bi`, `tabla-puente-bridge`, `filtro-cruzado-bidireccional`, `tabla-fechas-marcada`, `relacion-inactiva-userelationship` y `medida-vs-columna-calculada`.

### Paso 3 — Escritura de cada lección y ejecución real en DuckDB

Se ejecutaron las 15 consultas SQL (5 ejemplos de sección, 5 ejemplos trabajados de dos pasos y 5 prácticas) sobre los archivos `public/datasets/*.parquet` con `@duckdb/node-api` y se pegaron sus salidas reales en las 5 lecciones:
- `src/data/lessons/bi2-modelo-semantico/bi2-modelo-semantico-01-estrella-vertipaq.js`
- `src/data/lessons/bi2-modelo-semantico/bi2-modelo-semantico-02-relaciones-cardinalidad.js`
- `src/data/lessons/bi2-modelo-semantico/bi2-modelo-semantico-03-direccion-filtro-cruzado.js`
- `src/data/lessons/bi2-modelo-semantico/bi2-modelo-semantico-04-tablas-fechas-userelationship.js`
- `src/data/lessons/bi2-modelo-semantico/bi2-modelo-semantico-05-medidas-vs-columnas-calculadas.js`

### Paso 4 — Perspectiva por rol (`roleNotes`)

Cada una de las 5 lecciones incluye `roleNotes` diferenciadas para `bi`, `de` y `da` (entre 25 y 70 palabras por rol), conectando las decisiones del desarrollador de BI en Power BI con las vistas SQL del ingeniero de datos y la validación de métricas del analista.

### Paso 5 — `aiNotes` y prueba real del tutor vía `agy`

Se redactó el campo `aiNotes` (`<= 80` palabras) en cada lección con instrucciones específicas sobre los errores conceptuales más frecuentes y se ejecutó el tutor real (`server/ai/contextBuilder.js` + `server/ai/agyRunner.js`, modelo `gemini-3.8-flash-low`) sobre las 5 lecciones. El texto literal completo devuelto por `agy` se incluye en la sección `## Test` de este reporte.

### Paso 6 — Proyecto de módulo y rúbrica de 4 criterios

El enunciado completo del proyecto integrador (*Diseño y auditoría del modelo semántico de ventas y devoluciones de Mercado Brisa*) y su rúbrica de 4 criterios observables quedaron documentados en `docs/curriculo/investigacion/bi2-modelo-semantico.md` (sección `Paso 6`).

### Paso 7 — Revisión contra la rúbrica (§9.2 y §9.4)

#### Tabla resumen del módulo (§9.2 Paso 7)

| Lección | Palabras visibles | Checks | Prácticas | Fuentes | Puntuación de rúbrica |
|---|---:|---:|---:|---:|---:|
| `bi2-modelo-semantico-01-estrella-vertipaq` | 1 080 | 3 (`multiple-choice`, `predict-output`) | 1 (`sql`) | 3 | 32 / 32 |
| `bi2-modelo-semantico-02-relaciones-cardinalidad` | 1 103 | 3 (`multiple-choice`, `predict-output`) | 1 (`sql`) | 4 | 32 / 32 |
| `bi2-modelo-semantico-03-direccion-filtro-cruzado` | 1 116 | 3 (`multiple-choice`, `code-fill`) | 1 (`sql`) | 3 | 32 / 32 |
| `bi2-modelo-semantico-04-tablas-fechas-userelationship` | 1 018 | 3 (`multiple-choice`, `code-fill`) | 1 (`sql`) | 4 | 32 / 32 |
| `bi2-modelo-semantico-05-medidas-vs-columnas-calculadas` | 1 116 | 3 (`multiple-choice`, `predict-output`) | 1 (`sql`) | 3 | 32 / 32 |

#### Matriz de 8 criterios de la rúbrica de calidad (§9.4, escala 0–4)

| Lección | Objetivo claro | Progresión | Ejemplo concreto | Error típico | Práctica | Brevedad | Precisión | Tono | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `bi2-modelo-semantico-01-estrella-vertipaq` | 4 | 4 | 4 | 4 | 4 | 4 (1 080 pal; 14,9 pal/frase) | 4 | 4 | **32 / 32** |
| `bi2-modelo-semantico-02-relaciones-cardinalidad` | 4 | 4 | 4 | 4 | 4 | 4 (1 103 pal; 14,8 pal/frase) | 4 | 4 | **32 / 32** |
| `bi2-modelo-semantico-03-direccion-filtro-cruzado` | 4 | 4 | 4 | 4 | 4 | 4 (1 116 pal; 16,2 pal/frase) | 4 | 4 | **32 / 32** |
| `bi2-modelo-semantico-04-tablas-fechas-userelationship` | 4 | 4 | 4 | 4 | 4 | 4 (1 018 pal; 17,1 pal/frase) | 4 | 4 | **32 / 32** |
| `bi2-modelo-semantico-05-medidas-vs-columnas-calculadas` | 4 | 4 | 4 | 4 | 4 | 4 (1 116 pal; 16,3 pal/frase) | 4 | 4 | **32 / 32** |

---

## Test

### 1. Salida literal de `node scripts/check-content.mjs --module bi2-modelo-semantico`

```text
=== Validación de contenido v2 (check-content) ===
Lección (id v2)                                | Módulo               | Niv  | Sec  | Chk  | Src  | Palabras  | Estado    
--------------------------------------------------------------------------------------------------------------------------
bi2-modelo-semantico-01-estrella-vertipaq      | bi2-modelo-semantico | 2    | 3    | 3    | 3    | 1080      | OK        
bi2-modelo-semantico-02-relaciones-cardinalidad | bi2-modelo-semantico | 2    | 3    | 3    | 4    | 1103      | OK        
bi2-modelo-semantico-03-direccion-filtro-cruzado | bi2-modelo-semantico | 2    | 3    | 3    | 3    | 1116      | OK        
bi2-modelo-semantico-04-tablas-fechas-userelationship | bi2-modelo-semantico | 2    | 3    | 3    | 4    | 1018      | OK        
bi2-modelo-semantico-05-medidas-vs-columnas-calculadas | bi2-modelo-semantico | 2    | 3    | 3    | 3    | 1116      | OK        
--------------------------------------------------------------------------------------------------------------------------
Resumen: 5 lecciones inspeccionadas | 5 válidas | 0 con advertencias (needsReview) | 0 con errores.

Resultado: OK (0 errores de esquema o integridad).
```

### 2. Salida literal de `node scripts/check-copy.mjs --path src/data/lessons/bi2-modelo-semantico`

```text
=== Auditoría anti-slop de copy (check-copy) ===
Archivos escaneados: 5

0 hallazgos de términos prohibidos, emojis, "2026" o exceso de negritas.

--- Longitud media de frase en sections[].body ---
Media global: 19.5 palabras/frase (33491 palabras en 1715 frases; límite <= 22).
Lecciones que superan 22 palabras/frase de media:
  - bi3-dashboards-01-bi-tufte-code (src/data/lessons/bi3-dashboards/bi3-dashboards-01-bi-tufte-code.js): 25 palabras/frase
  - c2-dimensional-02-star-schema-obt (src/data/lessons/c2-dimensional/c2-dimensional-02-star-schema-obt.js): 28.8 palabras/frase
  - c2-dimensional-03-scd2-history (src/data/lessons/c2-dimensional/c2-dimensional-03-scd2-history.js): 23.4 palabras/frase
  - c2-dimensional-04-metrics-simpson (src/data/lessons/c2-dimensional/c2-dimensional-04-metrics-simpson.js): 24.6 palabras/frase
  - c2-sql-analitico-01-window-functions (src/data/lessons/c2-sql-analitico/c2-sql-analitico-01-window-functions.js): 29.3 palabras/frase
  - c2-sql-analitico-02-asof-lateral-ctes (src/data/lessons/c2-sql-analitico/c2-sql-analitico-02-asof-lateral-ctes.js): 28.6 palabras/frase
  - da3-experimentos-01-ab-testing-cuped (src/data/lessons/da3-experimentos/da3-experimentos-01-ab-testing-cuped.js): 22.6 palabras/frase
  - da3-producto-02-cohorts-retention-ltv (src/data/lessons/da3-producto/da3-producto-02-cohorts-retention-ltv.js): 26.1 palabras/frase
  - de2-formatos-01-columnar-parquet (src/data/lessons/de2-formatos/de2-formatos-01-columnar-parquet.js): 38.1 palabras/frase
  - de2-formatos-02-arrow-lance-vortex (src/data/lessons/de2-formatos/de2-formatos-02-arrow-lance-vortex.js): 32.8 palabras/frase
  - de2-formatos-03-duckdb-polars-marimo (src/data/lessons/de2-formatos/de2-formatos-03-duckdb-polars-marimo.js): 31.4 palabras/frase
  - de3-lakehouse-01-iceberg-v3-medallion (src/data/lessons/de3-lakehouse/de3-lakehouse-01-iceberg-v3-medallion.js): 32 palabras/frase
  - de3-transformacion-01-dbt-sqlmesh-dag (src/data/lessons/de3-transformacion/de3-transformacion-01-dbt-sqlmesh-dag.js): 26.4 palabras/frase
  - de3-transformacion-03-contracts-semantic-layer (src/data/lessons/de3-transformacion/de3-transformacion-03-contracts-semantic-layer.js): 31 palabras/frase
  - de4-streaming-01-cdc-kafka-streaming (src/data/lessons/de4-streaming/de4-streaming-01-cdc-kafka-streaming.js): 32.1 palabras/frase
  - de4-streaming-03-flink-watermarks-mv (src/data/lessons/de3-streaming/de4-streaming-03-flink-watermarks-mv.js): 22.1 palabras/frase
  - x4-ia-datos-01-mcp-semantic-ai-rag (src/data/lessons/x4-ia-datos/x4-ia-datos-01-mcp-semantic-ai-rag.js): 29.8 palabras/frase

Total de hallazgos: 0
```

### 3. Verificación en DuckDB de las 5 prácticas SQL (`starterCode` falla y `solution` pasa)

```text
=== bi2-modelo-semantico-01-estrella-vertipaq ===
  starterCode: FAILS AS EXPECTED (SQL execution error: Binder Error: Referenced table "p" not found!)
  solution:    PASSES ALL ASSERTIONS (exact match with expectedOutputTable)
=== bi2-modelo-semantico-02-relaciones-cardinalidad ===
  starterCode: FAILS AS EXPECTED (SQL execution error: Binder Error: Referenced table "r" not found!)
  solution:    PASSES ALL ASSERTIONS (exact match with expectedOutputTable)
=== bi2-modelo-semantico-03-direccion-filtro-cruzado ===
  starterCode: FAILS AS EXPECTED (row 0 col country_code: expected CO, got AR; row 0 col clientes_con_compra_completada: expected 400, got 0; row 0 col clientes_con_reembolso: expected 80, got 0)
  solution:    PASSES ALL ASSERTIONS (exact match with expectedOutputTable)
=== bi2-modelo-semantico-04-tablas-fechas-userelationship ===
  starterCode: FAILS AS EXPECTED (row 0 col reembolsos_en_trimestre_usd: expected 25899.55, got 0.0; row 1 col reembolsos_en_trimestre_usd: expected 31227.19, got 0.0; row 2 col reembolsos_en_trimestre_usd: expected 42326.55, got 0.0)
  solution:    PASSES ALL ASSERTIONS (exact match with expectedOutputTable)
=== bi2-modelo-semantico-05-medidas-vs-columnas-calculadas ===
  starterCode: FAILS AS EXPECTED (row 0 col tasa_descuento_medida_pct: expected 1.27, got 0.0; row 0 col promedio_columna_pct: expected 1.15, got 0.0; row 1 col tasa_descuento_medida_pct: expected 1.09, got 0.0)
  solution:    PASSES ALL ASSERTIONS (exact match with expectedOutputTable)
```

### 4. Salida literal completa del tutor IA real (`agy`) sobre las 5 lecciones

En cada lección se ejecutó `buildContextPrompt` + `runAgyPrompt` (`gemini-3.8-flash-low`) enviando una respuesta de comprobación con un error conceptual deliberado para verificar que el tutor utiliza `aiNotes` y corrige el error:

```text
>>> Running agy tutor test for bi2-modelo-semantico-01-estrella-vertipaq...
Prompt length: 3635 chars | aiNotes included: true
Model: gemini-3.8-flash-low | firstTokenMs: 4223 | durationMs: 5896
Response:
No, tu afirmación tiene dos errores conceptuales importantes en Power BI.

Primero, sumar `orders[total_usd]` en una tabla ancha no dará el mismo resultado. Al unir `orders` con `order_items`, una orden con tres productos se repite en tres filas. Al hacer `SUM(total_usd)`, sumas tres veces el total de esa orden. Este problema se llama *fan-out* o duplicación por grano y falsea tus métricas de cabecera.

Segundo, mantener `order_item_id` perjudica directamente a VertiPaq. Como cada fila tiene un identificador único (42 000 valores distintos en 42 000 filas), la cardinalidad es máxima. VertiPaq debe crear un diccionario con 42 000 entradas de texto o enteros largos, impidiendo la compresión por diccionario (*Hash Encoding*) y anulando el algoritmo RLE. Si esa clave no conecta con otra tabla ni se muestra en reportes, solo consume memoria RAM innecesaria.

Además, en una tabla plana (OBT), los filtros y segmentadores (como filtrar por `store_id`) deben escanear la tabla entera de 42 000 filas en lugar de una dimensión pequeña. 

La práctica correcta en el esquema en estrella es separar la cabecera (`orders`) de las líneas (`order_items`), o bien llevar los importes al grano más bajo (calcular el total a nivel de ítem) y eliminar siempre identificadores únicos sin uso analítico.


>>> Running agy tutor test for bi2-modelo-semantico-02-relaciones-cardinalidad...
Prompt length: 3726 chars | aiNotes included: true
Model: gemini-3.8-flash-low | firstTokenMs: 4376 | durationMs: 6886
Response:
Tu respuesta no es correcta. Crear una relación directa N:M entre `order_items` y `refunds` produce un error conceptual grave: una relación muchos a muchos accidental por intentar unir dos tablas de hechos entre sí.

El problema técnico y de negocio que produce es la **duplicación y distorsión de importes (producto cartesiano)**:

1. Un pedido con 3 productos tiene 3 filas en `order_items`.
2. Si ese mismo pedido tuvo 2 reembolsos parciales en `refunds`, al unirlas por `order_id` se generan 6 combinaciones (3 × 2).
3. Cada reembolso se multiplica por la cantidad de productos, inflando artificialmente la suma de `refund_usd`.
4. Además, `refunds` está a nivel de pedido (`order_id`), no a nivel de producto (`product_id`). El modelo no sabe qué importe de la devolución corresponde a qué producto específico.

Para resolverlo en un modelo dimensional tienes dos caminos correctos:

- **Modelo en estrella estándar**: No conectes `order_items` con `refunds`. Ambas tablas deben relacionarse con la dimensión `orders` (o una tabla compartida de pedidos) mediante relaciones `1:N`, donde `orders[order_id]` está en el lado 1.
- **Alinear la granularidad**: Si el negocio necesita analizar reembolsos por producto, la tabla de hechos debe registrar el reembolso a nivel de ítem (`order_item_id` o `product_id`). Si el dato solo existe a nivel de pedido global, prorratear o vincular directamente a ítems sin una regla de reparto genera métricas incorrectas.

En resumen: nunca unas dos tablas de hechos directamente por una clave común con duplicados en ambos lados. Conéctalas a través de dimensiones compartidas o modela la granularidad adecuada.


>>> Running agy tutor test for bi2-modelo-semantico-03-direccion-filtro-cruzado...
Prompt length: 3744 chars | aiNotes included: true
Model: gemini-3.8-flash-low | firstTokenMs: 4529 | durationMs: 6484
Response:
No, tu respuesta no es correcta. Dejar el filtro bidireccional (`Both`) activado por defecto genera problemas graves de ambigüedad, rendimiento y pérdida de datos visibles.

Mira lo que ocurre en Mercado Brisa:
Si relacionas `customers` con `orders` (1:N) y `orders` con `refunds` (1:N) en modo `Both`, el filtro de una tabla de hechos puede subir a la dimensión y bajar hacia la otra tabla de hechos. 

Imagina que filtras un día específico o una categoría de `products`. Ese filtro entra a `orders`, sube hacia `customers` y recorta la lista de clientes únicamente a los que compraron ese producto ese día. Como el filtro sigue bajando hacia `refunds`, desaparecerán del reporte las devoluciones legítimas de clientes que devolvieron productos en esa fecha pero no hicieron compras ese mismo día.

Además, el motor VertiPaq pierde eficiencia al sincronizar dimensiones continuamente y arriesgas introducir caminos circulares o ambiguos en el modelo.

La buena práctica en BI es mantener las relaciones en dirección única (`Single`) desde la dimensión hacia los hechos. Si necesitas que un segmentador o cálculo responda solo a clientes con ventas o devoluciones activas, resuélvelo puntualmente mediante medidas DAX (usando funciones como `CROSSFILTER` o filtrando por la presencia de hechos), sin alterar la estructura global del modelo.


>>> Running agy tutor test for bi2-modelo-semantico-04-tablas-fechas-userelationship...
Prompt length: 3691 chars | aiNotes included: true
Model: gemini-3.8-flash-low | firstTokenMs: 4379 | durationMs: 7186
Response:
No, no es correcta por dos motivos técnicos del motor de Power BI.

Primero, **Auto date/time debe desactivarse**. Si lo dejas activo, Power BI crea una tabla de fechas oculta en memoria por cada columna de fecha que exista en tu modelo (como `orders[order_ts]`, `refunds[refund_ts]` o `customers[signup_date]`). Esto infla innecesariamente el tamaño del archivo y, lo más grave, te impide sincronizar o filtrar varias tablas de hechos usando una única segmentación de fecha en tus reportes.

Segundo, **Power BI no permite activar al mismo tiempo varias relaciones entre las mismas tablas**. Entre tu tabla `calendar` y una tabla de hechos (o a través de `orders`), solo puede existir **una relación activa** a la vez. Si pudieras activar dos rutas simultáneamente, el motor no sabría qué camino seguir para propagar los filtros, generando ambigüedad.

Por eso se usa una relación inactiva y la función `USERELATIONSHIP`:

1. Defines la relación activa principal entre `calendar[calendar_date]` y `orders[order_ts]`. Esto te sirve para analizar ventas o métricas por cohorte según la fecha en que se hizo el pedido.
2. Creas una segunda relación, pero **inactiva**, entre `calendar[calendar_date]` y la fecha de reembolso (`refunds[refund_ts]`).
3. Para calcular el total reembolsado según el momento contable en que ocurrió la devolución, activas temporalmente esa relación dentro de tu medida usando `CALCULATE`:

```dax
Reembolsos Por Fecha Reembolso = 
CALCULATE(
    SUM(refunds[refund_usd]),
    USERELATIONSHIP(calendar[calendar_date], refunds[refund_ts])
)
```

Ten presente que `USERELATIONSHIP` solo funciona como argumento de filtro dentro de `CALCULATE` o `CALCULATETABLE`; no puedes usarla por sí sola. Desactivar Auto date/time y usar relaciones inactivas es el estándar para un modelo limpio y sin ambigüedades.


>>> Running agy tutor test for bi2-modelo-semantico-05-medidas-vs-columnas-calculadas...
Prompt length: 3632 chars | aiNotes included: true
Model: gemini-3.8-flash-low | firstTokenMs: 4414 | durationMs: 6052
Response:
No es correcta. Ese enfoque genera dos problemas graves: un error matemático y un desperdicio de memoria.

El problema matemático ocurre porque promediar porcentajes precalculados (`AVERAGE(orders[descuento_pct])`) distorsiona las métricas de razón. Trata todas las órdenes con el mismo peso, sin importar el volumen de dinero. 

Imagina dos órdenes en una tienda de Mercado Brisa:
- Orden A: subtotal de 10 USD con 5 USD de descuento (50 %).
- Orden B: subtotal de 1 000 USD con 10 USD de descuento (1 %).

El promedio simple de porcentajes daría (50 % + 1 %) / 2 = 25,5 %. Sin embargo, el descuento real de la tienda es el total descontado sobre el total vendido: 15 USD / 1 010 USD = 1,48 %. 

El segundo problema es de rendimiento. Una columna calculada con valores decimales continuos crea un diccionario con alta cardinalidad en VertiPaq. Esto ocupa memoria RAM innecesaria en el archivo y alarga los tiempos de refresco, sin aportar flexibilidad interactiva.

La solución correcta es crear una **medida DAX** que calcule la razón ponderada en tiempo de consulta:

```dax
Descuento Pct = 
DIVIDE(
    SUM(orders[discount_usd]), 
    SUM(orders[subtotal_usd])
)
```

Esta medida no consume memoria en reposo y responde de forma dinámica y matemáticamente exacta cuando filtras por tienda, fecha o categoría.
```

### 5. Salida literal de `npm run build`

```text
> grano@1.0.0 build
> vite build

vite v6.4.5 building for production...
transforming...
✓ 2402 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                                        1.00 kB │ gzip:     0.51 kB
dist/assets/index-Ds05HJQs.css                                       236.89 kB │ gzip:    32.06 kB
dist/assets/PracticeView-CgZVqk7d.js                                   8.31 kB │ gzip:     2.84 kB
dist/assets/duckdb-browser-BNitTxKA.js                                27.41 kB │ gzip:     7.01 kB
dist/assets/curriculum-stages-BHOHuqmu.js                            285.16 kB │ gzip:    95.09 kB
dist/assets/SqlLab-CifskDt6.js                                       389.73 kB │ gzip:   127.31 kB
dist/assets/vendor-CMuuJwVt.js                                       558.99 kB │ gzip:   155.51 kB
dist/assets/index-DZ-jtsbb.js                                      2,134.51 kB │ gzip:   607.28 kB
✓ built in 14.04s
```

---

## Revisión propia

Defectos concretos detectados y corregidos durante el desarrollo del módulo:

1. **Resolución de `prerequisites` con `--module bi2-modelo-semantico` en `check-content.mjs`:** En la lección 01 se había declarado inicialmente `prerequisites: ['bi2-metricas-04', 'c2-dimensional-02-star-schema-obt']`. Al ejecutar `node scripts/check-content.mjs --module bi2-modelo-semantico`, el script solo escanea los archivos del módulo filtrado y pobla `knownLessonIds` desde `src/data/catalog/modules.js`, donde la lección está registrada como `'l4-star-schema-obt'` y `'c2-dimensional-02'`. Se corrigió el prerrequisito a `'l4-star-schema-obt'` para mantener compatibilidad tanto con validación aislada como global.
2. **Longitud de `sections[].heading` superior a 70 caracteres en la lección 03:** En `bi2-modelo-semantico-03-direccion-filtro-cruzado.js`, los encabezados de las secciones 2 y 3 medían 71 caracteres, fallando la validación de `LessonSchema` (`max 70`). Se recortaron a 61 y 60 caracteres respectivamente.
3. **Términos prohibidos detectados por `check-copy.mjs` en las lecciones 02, 03 y el glosario:** `check-copy.mjs` detectó `"se descubre"` (`descubre`) en la línea 144 de la lección 02 y `"que un filtro viaje"` (`viaje / travesía`) en la línea 370 de la lección 03, además de `"cómo viajan los filtros"` en `bi2-modelo-semantico-glossary.json`. Se reemplazaron por `"se comprueba"`, `"que un filtro se propague"` y `"cómo se propagan los filtros"`.
4. **Exceso de negritas (`> 3`) en un mismo párrafo en la lección 05:** En la sección 1 de `bi2-modelo-semantico-05-medidas-vs-columnas-calculadas.js`, una lista con salto de línea simple (`\n`) agrupaba 4 bloques `**...**` en un solo párrafo según el divisor `\n\n` de `check-copy.mjs`. Se separaron los párrafos con `\n\n` y se redujo el uso de negritas a un máximo de 1 por párrafo.
5. **Longitud media de frase superior a 22 palabras/frase en las lecciones 01, 02, 04 y 05:** En el primer borrador, las lecciones 01 (22,9), 02 (25,2), 04 (22,6) y 05 (24,2) superaban el tope de 22 palabras/frase en `sections[].body`. Se dividieron las oraciones subordinadas largas en frases directas, dejando las 5 lecciones en `14,8` a `17,1` palabras/frase.
6. **Límite de 60 caracteres en `title` frente al título largo de `catalog/modules.js`:** Los títulos de `modules.js` para `bi2-modelo-semantico` tienen entre 79 y 89 caracteres, mientras que `LessonSchema` exige `title.max(60)`. Se colocó la versión concisa (`<= 60` caracteres) en `title` y el título íntegro de `modules.js` en `subtitle`.
7. **Firma de `runAgyPrompt` en el script de verificación del tutor:** En la primera ejecución de `scratch/test-agy.mjs`, se invocó `runAgyPrompt(prompt, { model: 'fast' })` pasando un string como primer argumento en lugar de un objeto `{ prompt, model }`, provocando que `stdin` se cerrara vacío y saltara el timeout de 45 s. Se corrigió la llamada a `runAgyPrompt({ prompt, model: 'fast' })`, obteniendo respuestas completas en ~6 s por lección.

---

## Prueba adversarial

| Qué probé | Qué pasó | Acción |
|---|---|---|
| Ejecutar `starterCode` sin modificar en las 5 prácticas SQL contra DuckDB (`scratch/verify-practices.mjs`). | Las lecciones 01 y 02 fallan con `Binder Error` (falta el `JOIN` en el `TODO`) y las lecciones 03, 04 y 05 devuelven `0` en las columnas `TODO`, fallando las aserciones contra `expectedOutputTable`. | Confirmado que ningún `starterCode` pasa por accidente y que las 5 soluciones (`solution`) coinciden celda por celda con `expectedOutputTable`. |
| Auditar la continuidad real de `calendar.parquet` en DuckDB (`DATEDIFF('day', MIN(calendar_date), MAX(calendar_date)) + 1` frente a `COUNT(*)`). | `calendar` tiene `1 095` filas (`365 * 3`) desde `2023-01-01`; como `2024` es bisiesto (`366` días), el año `2025` termina en `2025-12-30` (`364` días) y falta el `2025-12-31`. | Se incorporó este hallazgo real del dataset en el ejemplo trabajado de `bi2-modelo-semantico-04-tablas-fechas-userelationship.js` para enseñar cómo detectar tablas de fechas truncadas antes de usar `TOTALYTD`. |
| Cruzar directamente `order_items` (`42 000` filas) con `refunds` (`1 450` filas) por `order_id` en DuckDB simulando una relación `N:M` directa entre hechos. | Se generaron `3 379` filas combinadas y la suma de `refund_amount_usd` se disparó a `757 985,68 USD` frente a los `321 097,25 USD` reales (`436 888,43 USD` de sobreestimación). | Documentado con cifras exactas en la sección 2 y el ejemplo trabajado de `bi2-modelo-semantico-02-relaciones-cardinalidad.js`. |
| Enviar al tutor real (`agy`) 5 respuestas de comprobación con creencias erróneas típicas (usar OBT sin quitar `order_item_id`, relación `N:M` entre hechos, `Both` permanente, `Auto date/time` activo y `AVERAGE` de columna calculada de descuento). | El tutor detectó el error en las 5 lecciones, citó las tablas reales de Mercado Brisa y aplicó las pautas de `aiNotes` (incluyendo el contraejemplo numérico de 10 USD y 1 000 USD en la lección 05). | Se conservaron las salidas literales completas en `## Test`. |
| Renderizar las 5 lecciones en navegador headless real (`1280x720` claro/oscuro y `390x844` móvil) midiendo `document.documentElement.scrollWidth > window.innerWidth` y errores de consola. | `hasOverflow: false` en las 7 mediciones (`scrollWidth === innerWidth` tanto en `1280` como en `390`), `pageErrors: []` y `consoleErrors: []`. | Capturas guardadas e inspeccionadas visualmente con `read_file`. |

---

## Capturas antes / después

Todas las capturas fueron tomadas en el servidor Vite dedicado (`http://127.0.0.1:5218/?view=lesson`) e inspeccionadas visualmente mediante `read_file`:

- Directorio de capturas (fuera de git): `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-bi2-modelo-semantico\`
  1. `leccion-01-top-light.png` (`1280x720`, claro): Cabecera, prerrequisitos, escenario real y objetivos de `bi2-modelo-semantico-01-estrella-vertipaq`.
  2. `leccion-01-checks-practica-light.png` (`1280x720`, claro): Tarjetas de comprobación (`multiple-choice` y `predict-output`) de la lección 01.
  3. `leccion-02-top-light.png` (`1280x720`, claro): Cabecera, escenario real (`customer_changes` `N:M`) y objetivos de `bi2-modelo-semantico-02-relaciones-cardinalidad`.
  4. `leccion-02-checks-practica-light.png` (`1280x720`, claro): Tarjetas de comprobación sobre `Blank Row` y pre-agregación `1:1` de `refunds` en la lección 02.
  5. `leccion-03-top-light.png` (`1280x720`, claro): Cabecera, escenario real (`SKU-TEST-NEG` y filtro `Both`) y objetivos de `bi2-modelo-semantico-03-direccion-filtro-cruzado`.
  6. `leccion-03-checks-practica-light.png` (`1280x720`, claro): Tarjetas de comprobación sobre ambigüedad de rutas y filtro visual de segmentadores en la lección 03.
  7. `leccion-04-top-light.png` (`1280x720`, claro): Cabecera, escenario real (`fiscal_quarter` y `USERELATIONSHIP`) y objetivos de `bi2-modelo-semantico-04-tablas-fechas-userelationship`.
  8. `leccion-04-checks-practica-light.png` (`1280x720`, claro): Comprobaciones (`multiple-choice` sobre `Auto date/time` y `code-fill` sobre `USERELATIONSHIP`) de la lección 04.
  9. `leccion-05-top-light.png` (`1280x720`, claro): Cabecera, escenario real (`Almacén Logístico Coslada`: `1,23 %` vs `0,90 %`) y objetivos de `bi2-modelo-semantico-05-medidas-vs-columnas-calculadas`.
  10. `leccion-05-checks-practica-light.png` (`1280x720`, claro): Comprobaciones sobre RAM/CPU y clasificación estática en la lección 05.
  11. `leccion-01-dark-1280x720.png` (`1280x720`, oscuro): Verificación de contraste y jerarquía visual en modo oscuro sobre la lección 01.
  12. `leccion-04-dark-1280x720.png` (`1280x720`, oscuro): Verificación de tarjetas `code-fill` y `multiple-choice` en modo oscuro sobre la lección 04.
  13. `leccion-01-mobile-390x844.png` (`390x844`, móvil): Verificación responsiva del simulador interactivo `star-vs-obt-sim` sin desbordamiento horizontal (`scrollWidth: 390`).
  14. `leccion-03-mobile-390x844.png` (`390x844`, móvil): Verificación responsiva de bloques SQL y tabla de resultados en vista móvil (`scrollWidth: 390`).

---

## Checklist Apéndice D.3

- [x] Todos los archivos leídos en `## Inicio` listados individualmente con un dato concreto aprendido de cada uno.
- [x] `node scripts/check-content.mjs --module bi2-modelo-semantico` ejecutado con resultado `0 errores` y salida literal pegada en `## Test`.
- [x] `node scripts/check-copy.mjs --path src/data/lessons/bi2-modelo-semantico` ejecutado con `0 hallazgos` y media de palabras por frase `<= 22` en las 5 lecciones.
- [x] Todas las consultas SQL ejecutadas contra los archivos `.parquet` reales de Mercado Brisa en DuckDB; `starterCode` falla y `solution` pasa en las 5 prácticas.
- [x] Tutor IA real (`agy`) ejecutado sobre las 5 lecciones verificando `aiNotes` y corrección de respuestas erróneas; salidas literales pegadas en `## Test`.
- [x] `npm run build` ejecutado con código de salida `0`.
- [x] Capturas en `1280x720` (claro y oscuro) y `390x844` (móvil) guardadas fuera de git e inspeccionadas con `read_file`.
- [x] `src/data/lessons/index.js` revertido antes del commit para tocar exclusivamente los archivos propiedad de `W-bi2-modelo-semantico`.
