# Reporte de agente — W-c1-python · Módulo c1-python: Python para datos

**Fecha:** 2026-10-29
**Rama:** `agente/W-c1-python`
**Worktree:** `C:\Users\T490s\Desktop\Proyectos\ING-W-c1-python`
**Estado:** Completado

## Inicio
Lecturas obligatorias realizadas antes de escribir código o contenido, con hecho concreto verificado en cada archivo:

1. `PLAN_GEMINI_4_ARGON.md`:
   - **§1 y §2:** La misión del proyecto es construir la aplicación web local-first **Grano** con estética **Editorial Analítica Cálida** (superficie `#FAF7F2` en claro y `#111110` en oscuro, acento terracota `#B84A27` / `#E06B47`, tipografías `Newsreader`, `Plus Jakarta Sans` y `JetBrains Mono`), datos reales de **Mercado Brisa** (13 tablas Parquet deterministas con semilla `20260419`) y tutor IA conectado vía `agy`.
   - **§5 (`c1-python` — Python para datos):** Define el módulo de Nivel 1 (`core`, 110 min, 5 lecciones) con prerrequisitos `c0-herramientas` y `c1-sql-base`, proyecto `resumen_ventas.py` validado con `pytest`, y temas de Polars 2.0, pandas 3.0 (Copy-on-Write y tipo `str` PyArrow), I/O tipado (CSV, NDJSON, Parquet `zstd`), expresiones vectorizadas, limpieza de texto/fechas/husos horarios y empaquetado CLI con `argparse`.
   - **§9.2 y §9.4:** Establece las reglas de copy en español neutro (sin términos prohibidos ni muletillas de IA, media de frase $\le 22$ palabras en `sections[].body`, definiciones de glosario de 20–25 palabras con ejemplo ejecutable y contraejemplo `"Se confunde con: ..."`) y la rúbrica de 6 dimensiones (0–3 puntos por dimensión, mínimo 15/18 y ninguna dimensión en 0).
   - **Apéndices A, B, D.2 y D.3:** Fijan las restricciones de seguridad y aislamiento por worktree, el esquema de las 13 tablas de Mercado Brisa y la plantilla y lista de chequeo obligatorias para el reporte.
2. `docs/curriculo/estado-herramientas.md`:
   - Documenta **Python 3.13/3.14**, **Polars 2.0** (`LazyFrame`, motor `streaming` por defecto, `.unpivot()` en reemplazo de `.melt()`), **pandas 3.0** (Copy-on-Write obligatorio, eliminación de `SettingWithCopyWarning`, `ChainedAssignmentError`, tipo `str` respaldado por PyArrow por defecto y expresiones `pd.col()`), **Apache Arrow / Parquet** con compresión `zstd`, **Marimo** y **uv**.
3. `docs/curriculo/fuentes.md`:
   - Registra las fuentes primarias autorizadas para el bloque de procesamiento columnar local: documentación oficial de Polars (`https://docs.pola.rs/`), pandas 3.0 (`https://pandas.pydata.org/docs/`), Apache Arrow (`https://arrow.apache.org/docs/`), Apache Parquet (`https://parquet.apache.org/docs/`), Python `argparse`/`zoneinfo` y `pytest`.
4. `docs/curriculo/brechas.md`:
   - Identifica el módulo `c1-python` (5 lecciones) dentro de las 66 lecciones nuevas que no tenían lección heredada en `learningPath2026.js` (`legacyId: null`) y que requieren creación íntegra en Fase 3 · Ola A.
5. `docs/curriculo/cambios-catalogo.md`:
   - Confirma que `c1-python` pertenece al Nivel 1 del tronco común (`core`) y sirve de prerrequisito directo para `de2-ingesta`, `de2-formatos`, `da2-exploracion` y `bi2-modelado`.
6. `docs/curriculo/perfil-core.md`:
   - Define el perfil de egreso del tronco común (Niveles 0, 1 y 2): todo profesional de datos debe dominar manipulación tabular reproducible en Python con Polars 2.0 / pandas 3.0, lectura/escritura tipada de Parquet y validación del grano antes de especializarse en DE, DA o BI.
7. `package.json`:
   - Incluye `@duckdb/node-api` (`^1.2.1-alpha.17`), `@duckdb/duckdb-wasm` (`^1.29.0`), `zod` (`^3.24.2`), `playwright-core` (`^1.58.2`) y scripts `dev`, `build`, `test` y `check:content`.
8. `vite.config.js`:
   - Registra `granoAiPlugin()` desde `./server/ai/routes.js`, servidor por defecto en `127.0.0.1` y separación de chunks manuales (`vendor`, `curriculum-stages`).
9. `src/main.jsx`:
   - Punto de entrada React que importa `./styles/tokens.css`, `./styles/base.css`, `./styles/layout.css`, `./styles/components.css`, `./styles/views.css`, `./styles/utilities.css` y monta `<App />`.
10. `src/App.jsx`:
    - Orquesta las vistas principales (`HomeView`, `RoadmapView`, `LessonPlayer`, `PracticeView`, `SpacedRepetitionView`, `CapstoneProjectsView`, `GlossaryAndGraphView`, `LearningAnalyticsView`, `SettingsView`) junto con `TutorPanel`, `DiagnosticModal` y `CommandPaletteModal`.
11. `src/styles/tokens.css`:
    - Declara las variables CSS de la paleta Editorial Analítica Cálida (`--bg-0: #FAF7F2`, `--ink-0: #181614`, `--accent: #B84A27` en claro y `--bg-0: #111110`, `--ink-0: #F3EFE8`, `--accent: #E06B47` en `[data-theme="dark"]`).
12. `src/data/catalog/modules.js`:
    - Define `c1-python` en las líneas 317–336 con `level: 1`, `track: 'core'`, `minutes: 110`, `prerequisites: ['c0-herramientas', 'c1-sql-base']` y las 5 entradas de lecciones `c1-python-01` a `c1-python-05` con sus títulos exactos.
13. `public/datasets/README.md` y `public/datasets/schema.json`:
    - Documentan las 13 tablas Parquet de Mercado Brisa (`154 845` filas totales, `2.14 MB` con compresión `ZSTD`) y sus anomalías pedagógicas deliberadas: `SKU-TEST-NEG` (`list_price_usd = -9.99`, `is_active = false`) en `products`, códigos postales con cero inicial en México (`06102`), códigos alfanuméricos en Argentina (`C1051`), `218` nulos y `129` códigos truncados de 2 caracteres en `customers`, y `event_ts_raw` con 5 husos horarios (`+01:00`, `-03:00`, `-05:00`, `-06:00`, `Z`) en `events`.
14. `src/data/schema/lesson.js` y `src/data/schema/glossary.js`:
    - `LessonSchema` valida con Zod que toda lección tenga `hook` (35–100 palabras), `objectives` (3–4), `sections` (3–5, cada `heading <= 70` caracteres y `body` de 80–280 palabras), `workedExample` ($\ge 2$ pasos con `expectedOutput`), `checks` (3–5, al menos 2 tipos distintos y `explanation` de 20–60 palabras), `practice` (`fill-blanks` para Python con `starterCode`, `expected`, `hints`, `solution`, `solutionExplanation`, `blanks`), `roleNotes` (`de`, `da`, `bi`, 30–90 palabras cada una), `summary` (3–5 puntos de $\le 22$ palabras), `flashcards` (3–5), `glossaryTerms`, `sources` ($\ge 2$ URLs `https://`), `aiNotes` (20–80 palabras) y conteo total de 950–1500 palabras (Nivel 1). `GlossaryTermSchema` valida términos en `kebab-case` con definiciones de 20–60 palabras.
15. `scripts/check-content.mjs`, `scripts/check-copy.mjs` y `scripts/sync-lessons-index.mjs`:
    - `check-content.mjs` valida `LessonSchema`, unicidad de IDs y referencias a glosario (incluyendo `docs/curriculo/investigacion/*-glossary.json`). `check-copy.mjs` audita términos prohibidos, emojis, `"2026"` fuera de `sources/accessed`, límite de negritas y longitud media de frase ($\le 22$ palabras/frase en `sections[].body`). `sync-lessons-index.mjs` reconstruye `src/data/lessons/index.js` con el índice v2 y los alias cortos `<moduleId>-<01..99>`.
16. `src/views/LessonPlayer.jsx`, `src/components/AuthenticCodeLab.jsx`, `src/views/lesson/normalizeLessonV2.js`, `src/views/lesson/LessonCheckCard.jsx` y `src/components/LessonVisualizers.jsx`:
    - `AuthenticCodeLab.jsx` renderiza las prácticas `fill-blanks` dividiendo `starterCode` por `/(\{\{blank_\d+\}\})/g` en botones `[data-testid="blank-slot-blank_1"]` y chips de opciones `[data-testid="token-option-<opt>"]`, y verifica la solución con `[data-testid="verify-blanks-btn"]`. `LessonVisualizers.jsx` incluye los simuladores interactivos `duckdb-polars-sim` y `row-vs-columnar-storage`.
17. `src/data/glossary.js`, `src/data/lessons/de2-formatos/de2-formatos-02-arrow-lance-vortex.js`, `src/data/lessons/de2-formatos/de2-formatos-03-duckdb-polars-marimo.js` y `src/data/lessons/c1-sql-joins/c1-sql-joins-02-grano-fanout.js`:
    - Revisados como referencia del tono técnico directo en español, estructura de lecciones v2 y coherencia con los módulos adyacentes (`c1-sql-joins` y `de2-formatos`).

---

## Pasos

### Paso 1 — Investigación y fuentes primarias (`docs/curriculo/investigacion/c1-python.md`)
Se creó `docs/curriculo/investigacion/c1-python.md` documentando **3 a 4 fuentes primarias verificadas (`https://`, fecha de acceso `2026-10-29`) por cada una de las 5 lecciones** (17 referencias primarias en total across Polars 2.0 User Guide & API Reference, pandas 3.0 User Guide, Apache Arrow Columnar Format, Apache Parquet File Format, Python 3.13 Standard Library `zoneinfo` y `argparse`, IANA Time Zone Database, `pytest` y Marimo), junto con las cifras exactas extraídas de los archivos Parquet de Mercado Brisa.

### Paso 2 — Mapa de conceptos y progresión del módulo
Se diseñó la secuencia conceptual sin solapamientos a lo largo de las 5 lecciones:
1. **`c1-python-01-polars-pandas-cow`:** Disposición columnar en memoria Apache Arrow (`str` PyArrow / `pl.String`), inmutabilidad en Polars 2.0 (`LazyFrame` con `scan_parquet`), modo obligatorio Copy-on-Write en pandas 3.0 (`ChainedAssignmentError`) y expresiones `pl.col()` / `pd.col()`.
2. **`c1-python-02-io-csv-json-parquet`:** Riesgos de inferencia automática en CSV (truncado de ceros iniciales en códigos postales de México y fallos con códigos alfanuméricos de Argentina), declaración explícita con `schema_overrides` y `dtype`, decodificación vectorizada de JSON/NDJSON con `str.json_decode` + `struct.field`, y lectura/escritura de Parquet con `zstd`, *Projection Pushdown* y *Predicate Pushdown*.
3. **`c1-python-03-expresiones-vectorizadas`:** Condicionales vectorizados `pl.when().then().otherwise()`, agregaciones condicionales con `.filter()` dentro de `.agg()`, pre-agregación al mismo grano y validación de cardinalidad en cruces (`validate="1:1" | "m:1"`), funciones de ventana `.over()` y paso a formato largo con `.unpivot()`.
4. **`c1-python-04-limpieza-texto-fechas-tz`:** Limpieza y auditoría de cadenas con `.str` (`strip_chars`, `to_lowercase`, `len_chars` vs `len_bytes`, `contains`), conversión temporal con `.str.to_datetime(time_zone="UTC")`, diferencia entre `replace_time_zone` y `convert_time_zone` con zonas IANA, y cuantificación de los `9 218` eventos de Mercado Brisa que cambian de fecha al truncar texto sin normalizar a UTC.
5. **`c1-python-05-cuaderno-a-script-cli`:** Extracción de funciones puras de transformación tabular tipadas (`LazyFrame -> DataFrame`), parametrización multiplataforma con `argparse` y `pathlib.Path`, validaciones bloqueantes con `exit code != 0` antes de `write_parquet`, y pruebas unitarias deterministas con `pytest` y `polars.testing.assert_frame_equal`.

### Paso 3 — Escritura de las 5 lecciones en `src/data/lessons/c1-python/`
Se escribieron las 5 lecciones completas cumpliendo el esquema `LessonSchema` (Nivel 1: entre `982` y `1 089` palabras por lección) y las reglas de estilo de §9.2:
- `src/data/lessons/c1-python/c1-python-01-polars-pandas-cow.js` (`1 089` palabras, 4 secciones, simulador `duckdb-polars-sim`, `workedExample` de 2 pasos, 4 `checks`, práctica `fill-blanks`, `roleNotes` DE/DA/BI, 4 `summary`, 4 `flashcards`, 4 `sources`).
- `src/data/lessons/c1-python/c1-python-02-io-csv-json-parquet.js` (`1 081` palabras, 4 secciones, simulador `row-vs-columnar-storage`, `workedExample` de 2 pasos, 4 `checks`, práctica `fill-blanks`, `roleNotes` DE/DA/BI, 4 `summary`, 4 `flashcards`, 3 `sources`).
- `src/data/lessons/c1-python/c1-python-03-expresiones-vectorizadas.js` (`982` palabras, 4 secciones, `workedExample` de 2 pasos contrastando el fan-out de `18 003 141.53 USD` contra el total real de `6 269 462.42 USD`, 4 `checks`, práctica `fill-blanks`, `roleNotes` DE/DA/BI, 4 `summary`, 4 `flashcards`, 3 `sources`).
- `src/data/lessons/c1-python/c1-python-04-limpieza-texto-fechas-tz.js` (`1 042` palabras, 4 secciones, `workedExample` de 2 pasos sobre los `2 400` clientes y `65 000` eventos de Mercado Brisa, 4 `checks`, práctica `fill-blanks`, `roleNotes` DE/DA/BI, 4 `summary`, 4 `flashcards`, 3 `sources`).
- `src/data/lessons/c1-python/c1-python-05-cuaderno-a-script-cli.js` (`1 039` palabras, 4 secciones, `workedExample` de 2 pasos con `argparse`, `Path` y `assert_frame_equal`, 4 `checks`, práctica `fill-blanks`, `roleNotes` DE/DA/BI, 4 `summary`, 4 `flashcards`, 4 `sources`).

### Paso 4 — Ejecución real contra los Parquet de Mercado Brisa y prácticas `fill-blanks`
Todos los bloques `expectedOutput` de las secciones, `workedExample` y `expectedOutputTable` de las prácticas se obtuvieron ejecutando consultas reales con `@duckdb/node-api` contra `public/datasets/*.parquet`:
- **Lección 1 (`products.parquet`):** Al excluir `SKU-TEST-NEG` (`list_price_usd = -9.99`), la categoría `Accesorios` pasa de `37` SKUs (`avg_price_usd = 39.88`, `min_price_usd = -9.99`) a `36` SKUs válidos (`avg_price_usd = 41.26`, `min_price_usd = 11.92`, `avg_unit_margin_usd = 24.09`).
- **Lección 2 (`customers.parquet`, `events.parquet`, `orders.parquet`):** En `customers.parquet` (`2 400` filas), los `364` códigos postales válidos de `MX` empiezan con `'0'` (`06102`) y los `364` de `AR` empiezan con `'C'` (`C1051`). En `orders.parquet`, los `14 760` pedidos completados suman `2 867 799.00 USD` en `desktop` (`6 327` pedidos), `2 199 394.23 USD` en `mobile` (`5 624` pedidos) y `1 202 269.19 USD` en `pos_tienda` (`2 809` pedidos).
- **Lección 3 (`orders.parquet`, `order_items.parquet`, `refunds.parquet`, `stores.parquet`):** El cruce directo sin pre-agregar infla los `14 760` pedidos completados a `34 830` filas y triplica el ingreso a `18 003 141.53 USD`; la pre-agregación por `order_id` con `validate="1:1"` concilia exactamente con los `6 269 462.42 USD` (`Cono Sur`: `2 059 786.39`, `Andina`: `1 990 554.12`, `Iberia`: `1 348 369.68`, `Norteamérica`: `870 752.23`).
- **Lección 4 (`customers.parquet`, `events.parquet`):** De las `2 400` filas de `customers`, `1 711` (`71.29 %`) son numéricas de 5 dígitos, `342` (`14.25 %`) son alfanuméricas `^C[0-9]{4}$` en `AR`, `218` (`9.08 %`) son `NULL` y `129` (`5.38 %`) están truncadas a 2 caracteres. En `events.parquet` (`65 000` filas), truncar `event_ts_raw` con `.str.slice(0, 10)` desplaza de fecha a **9 218 eventos** (`588` en `+01:00`, `1 867` en `-03:00`, `3 097` en `-05:00`, `3 666` en `-06:00` y `0` en `Z`).
- **Lección 5 (`orders.parquet`, `order_items.parquet`, `products.parquet`, `stores.parquet`):** El top 5 histórico de margen por tienda lo encabezan `STR-AR-01` (`Buenos Aires`, `966 754.24 USD` de ingreso, `463 356.09 USD` de margen, `47.93 %`) y `STR-PE-01` (`Lima`, `769 447.66 USD` de ingreso, `368 106.89 USD` de margen, `47.84 %`), junto con el corte diario parametrizado `2025-10-15`.

### Paso 5 — Términos de glosario del módulo (`docs/curriculo/investigacion/c1-python-glossary.json`)
Se definieron 8 términos nuevos para el glosario en `docs/curriculo/investigacion/c1-python-glossary.json`, validados con `GlossaryListSchema.safeParse` (definiciones de 22 a 24 palabras, cumpliendo simultáneamente el rango 20–60 de Zod y el tope $\le 25$ palabras de §9.2, más ejemplo y `"Se confunde con:"` en `formula`):
1. `polars-lazyframe` (24 palabras)
2. `pandas-copy-on-write` (23 palabras)
3. `pyarrow-string-dtype` (23 palabras)
4. `esquema-explicito-io` (22 palabras)
5. `polars-expresion-columnar` (23 palabras)
6. `validacion-cardinalidad-join` (23 palabras)
7. `normalizacion-utc-tz` (23 palabras)
8. `funcion-pura-transformacion` (22 palabras)

### Paso 6 — Proyecto de módulo y rúbrica de 4 criterios
En `docs/curriculo/investigacion/c1-python.md` (§3) se especificó el proyecto de módulo **`resumen_ventas.py` + `test_resumen_ventas.py`** y su rúbrica de evaluación de 4 criterios en escala 0–4:
1. **Ingesta tipada y evaluación perezosa** (`schema_overrides`, `scan_parquet`, `write_parquet` con `zstd`).
2. **Integridad de grano, expresiones vectorizadas y limpieza de anomalías** (`SKU-TEST-NEG`, estados válidos, normalización UTC y `validate="1:1" | "m:1"`).
3. **Arquitectura modular y parametrización CLI** (funciones puras tipadas, `argparse`, `pathlib.Path`, `logging` y aserciones con `exit code != 0`).
4. **Pruebas automatizadas con `pytest` y `assert_frame_equal`** (cobertura del caso nominal y de al menos 2 casos borde en memoria).

### Paso 7 — Autoevaluación con la rúbrica de §9.4
Autoevaluación de las 5 lecciones del módulo `c1-python` en las 6 dimensiones de §9.4 (escala 0–3 por dimensión; mínimo requerido: 15/18 y ninguna dimensión en 0):

| Lección | 1. Claridad conceptual | 2. Anclaje en Mercado Brisa | 3. Calidad de código y datos | 4. Comprobaciones y práctica | 5. Perspectiva DE / DA / BI | 6. Fuentes y rigor 2026 | Total |
|---|---|---|---|---|---|---|---|
| `c1-python-01-polars-pandas-cow` | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | **18/18** |
| `c1-python-02-io-csv-json-parquet` | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | **18/18** |
| `c1-python-03-expresiones-vectorizadas` | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | **18/18** |
| `c1-python-04-limpieza-texto-fechas-tz` | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | **18/18** |
| `c1-python-05-cuaderno-a-script-cli` | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | **18/18** |

---

## Test
Comandos de verificación ejecutados en `C:\Users\T490s\Desktop\Proyectos\ING-W-c1-python` con sus códigos de salida reales:

1. **Validador de esquema e integridad de contenido (`check-content.mjs`):**
   - Comando: `node scripts/check-content.mjs --module c1-python`
   - Código de salida: `0`
   - Resultado:
     - `c1-python-01-polars-pandas-cow`: `1089` palabras | 4 secciones | 4 checks | 4 fuentes | `OK`
     - `c1-python-02-io-csv-json-parquet`: `1081` palabras | 4 secciones | 4 checks | 3 fuentes | `OK`
     - `c1-python-03-expresiones-vectorizadas`: `982` palabras | 4 secciones | 4 checks | 3 fuentes | `OK`
     - `c1-python-04-limpieza-texto-fechas-tz`: `1042` palabras | 4 secciones | 4 checks | 3 fuentes | `OK`
     - `c1-python-05-cuaderno-a-script-cli`: `1039` palabras | 4 secciones | 4 checks | 4 fuentes | `OK`
     - `Resumen: 5 lecciones inspeccionadas | 5 válidas | 0 con advertencias (needsReview) | 0 con errores.`
2. **Auditoría anti-slop y longitud de frase (`check-copy.mjs`):**
   - Comando: `node scripts/check-copy.mjs --path src/data/lessons/c1-python --path docs/curriculo/investigacion/c1-python.md`
   - Código de salida: `0`
   - Resultado: `0 hallazgos de términos prohibidos, emojis, "2026" o exceso de negritas. Total de hallazgos: 0.` Ninguna de las 5 lecciones de `c1-python` supera el límite de `22` palabras/frase en `sections[].body`.
3. **Validación Zod del glosario modular (`GlossaryListSchema`):**
   - Comando: `node C:\Users\T490s\.gemini\antigravity\brain\3e47ef27-5368-4eb5-9a5d-41c543aa35c6\scratch\check_all.mjs`
   - Código de salida: `0`
   - Resultado: `success: true` para los 8 términos de `docs/curriculo/investigacion/c1-python-glossary.json` (conteos de palabras entre 22 y 24 palabras por definición).
4. **Verificación en navegador real (`playwright-core` sobre `http://127.0.0.1:5209`) y contexto del tutor IA (`resolveLessonContext` + `buildContextPrompt` + `/api/ai/status`):**
   - Comando: `node C:\Users\T490s\.gemini\antigravity\brain\3e47ef27-5368-4eb5-9a5d-41c543aa35c6\scratch\verify_c1_python.mjs`
   - Código de salida: `0`
   - Resultado: `consoleErrors: []`, `pageErrors: []`, 5/5 lecciones renderizadas y 5/5 prácticas `fill-blanks` resueltas con estado `'Respuesta verificada · Todos los bloques coinciden con la especificación'`. En las 5 lecciones, `resolveLessonContext` y `buildContextPrompt` inyectaron el título, objetivos, sección activa y `aiNotes` específicos de la lección (`aiNotesIncluded: true`).
5. **Build de producción (`npm run build`):**
   - Comando: `npm run build`
   - Código de salida: `0`
   - Resultado: Compilación limpia de Vite en producción sin errores ni advertencias de empaquetado.

---

## Revisión propia
Defectos reales detectados durante la autorrevisión sobre nuestro propio trabajo y corregidos antes de cerrar la tarea:

1. **Explicaciones de `checks` por debajo del mínimo de 20 palabras en `c1-python-02`, `c1-python-03` y `c1-python-05`:**
   - **Hallazgo:** Al ejecutar `node scripts/check-content.mjs --module c1-python`, 5 explicaciones (`c1-python-02` checks `c2` y `c3`, `c1-python-03` check `c3`, y `c1-python-05` checks `c2` y `c3`) tenían entre 14 y 19 palabras, fallando la regla de `LessonCheckSchema` (`20 <= words <= 60`).
   - **Corrección:** Se ampliaron las 5 explicaciones a 26–32 palabras precisando el mecanismo técnico subyacente (metadatos del Footer de Parquet, memoria columnar de Apache Arrow, equivalencia con `FILTER (WHERE ...)` y recolección de pruebas en `pytest`).
2. **Encabezados `section.heading` de más de 70 caracteres en `c1-python-03-expresiones-vectorizadas.js`:**
   - **Hallazgo:** `sections[1].heading` (71 caracteres) y `sections[3].heading` (72 caracteres) superaban por 1 y 2 caracteres el tope de `70` caracteres de `LessonSectionSchema`.
   - **Corrección:** Se reescribieron como `'Métricas condicionales con .filter() dentro de un mismo group_by'` (65 caracteres) y `'Funciones de ventana (.over) y formato largo (.unpivot) en Polars'` (65 caracteres).
3. **Falso positivo de la regla anti-slop `"2026"` por el importe numérico `2026.1` en `c1-python-05-cuaderno-a-script-cli.js`:**
   - **Hallazgo:** En el corte diario inicial del `2025-10-01`, la tienda `WH-ES-01` tenía `net_sales_usd: 2026.1`. El script `check-copy.mjs` detectó la subcadena `\b2026\b` fuera de `sources/accessed` en las líneas 118 y 412.
   - **Corrección:** Se cambió la fecha del corte diario parametrizado al `2025-10-15` y se recalcularon con DuckDB las 5 tiendas reales de ese día (`STR-PE-01: 2068.26`, `STR-ES-01: 1360.15`, `STR-MX-03: 1232.05`, `STR-MX-02: 1006.73`, `STR-CL-01: 850.32`), eliminando las 2 coincidencias en `check-copy.mjs`.
4. **Longitud media de frase en `sections[].body` ligeramente superior a 22 palabras/frase en `c1-python-01`, `c1-python-02` y `c1-python-05`:**
   - **Hallazgo:** En la primera pasada de `check-copy.mjs`, `c1-python-01` promediaba `23.8` palabras/frase, `c1-python-02` `24.8` palabras/frase y `c1-python-05` `22.5` palabras/frase (límite $\le 22$).
   - **Corrección:** Se dividieron las oraciones subordinadas largas en frases directas y breves dentro de `sections[].body`, logrando que las 5 lecciones queden por debajo del umbral de 22 palabras/frase.
5. **Interacción con slots de `AuthenticCodeLab.jsx` en las pruebas automatizadas:**
   - **Hallazgo:** El script inicial de Playwright buscaba elementos `<select>` (`blank-select-blank_1`), pero `AuthenticCodeLab.jsx` renderiza botones interactivos `[data-testid="blank-slot-blank_1"]` y chips de opciones `[data-testid="token-option-<opt>"]`. Además, en `verify_c1_python.mjs` se había escrito `contains` en lugar de `strip_chars` para el primer hueco de la lección 4.
   - **Corrección:** Se actualizó el flujo de prueba para pulsar cada `blank-slot` y su `token-option` correspondiente, verificando la aparición del banner `'Respuesta verificada · Todos los bloques coinciden con la especificación'` en las 5 lecciones.

---

## Prueba adversarial
Se ejecutaron **6 pruebas adversariales** sobre las 5 lecciones en navegador real y sobre el constructor de contexto del tutor IA:

1. **Envío deliberado de opción errónea en práctica `fill-blanks` antes de corregir (`c1-python-01`):**
   - Se seleccionó `read_csv` en lugar de `scan_parquet` en el hueco 1 y se pulsó `Comprobar respuesta`. El componente marcó el hueco con clase `.is-wrong`, mostró el aviso `'Algunos huecos no coinciden · Revisa los bloques marcados en rojo'` y no marcó la práctica como enviada hasta que se seleccionaron los 3 bloques correctos (`scan_parquet`, `with_columns`, `collect`).
2. **Viewport móvil estrecho (`390×844`) con tablas anchas y bloques de código (`c1-python-03`):**
   - Se redimensionó el navegador a `390×844` sobre `c1-python-03-expresiones-vectorizadas` (que incluye tablas de 5 columnas y bloques de código con múltiples `.join()`). Se verificó `document.documentElement.scrollWidth === 390` y `clientWidth === 390` (`0 px` de desborde horizontal global), con desplazamiento horizontal confinado dentro de `.lp-code-example__pre` y las tablas de salida.
3. **Contraste y legibilidad en modo oscuro (`1280×720`, `[data-theme="dark"]`) en `c1-python-01` y `c1-python-04`:**
   - Se activó el tema oscuro y se inspeccionaron visualmente las capturas `W-c1-python_01-polars-pandas-cow_cabecera_1280x720_dark.png` y `W-c1-python_04-limpieza-texto-fechas-tz_cabecera_1280x720_dark.png`. El fondo `#111110`, el borde terracota `#E06B47` del bloque `ESCENARIO REAL` y las píldoras de código inline mantienen contraste nítido sin cajas blancas residuales.
4. **Navegación por teclado (`Ctrl+K` y cierre con `Escape`):**
   - Desde la vista de lección se disparó `Control+k`, verificando la apertura del diálogo modal `[role="dialog"]` de búsqueda rápida y su cierre limpio al pulsar `Escape` sin pérdida de foco ni errores en consola.
5. **Preferencia del sistema `prefers-reduced-motion: reduce`:**
   - Se emuló `reducedMotion: 'reduce'` en Chromium y se recargó `LessonPlayer`. El salto programático entre secciones cambió automáticamente a `behavior: 'auto'` (`prefersReducedMotion()` en `LessonPlayer.jsx`) con `0` errores de página.
6. **Respuestas equivocadas a propósito ante el contexto del tutor IA en las 5 lecciones:**
   - Para cada una de las 5 lecciones se verificó con `resolveLessonContext` y `buildContextPrompt` la respuesta ante el flujo *"Hazme una pregunta para comprobar si lo entendí"* seguido de un error conceptual deliberado:
     - En `c1-python-01`: afirmar que `sub["list_price_usd"] = 0` muta `df` en pandas 3.0 y que Polars usa `.iloc` sobre `Index` $\rightarrow$ el prompt inyecta `aiNotes` advirtiendo específicamente que CoW protege cada subconjunto en pandas 3.0 y que Polars no tiene `Index`.
     - En `c1-python-02`: afirmar que subir `infer_schema_length=100000` evita perder el cero inicial de `'06102'` en México $\rightarrow$ `aiNotes` indica que aumentar la muestra sigue infiriendo `Int64` sobre dígitos y que la única solución es `schema_overrides={"postal_code": pl.String}`.
     - En `c1-python-03`: usar `df.groupby()` sin guion bajo, `df.melt()` y cruzar `orders` con `order_items` sin pre-agregar $\rightarrow$ `aiNotes` corrige `.group_by()`, `.unpivot()` en Polars 2.0 y la pre-agregación con `validate="1:1"`.
     - En `c1-python-04`: usar `dt.replace_time_zone("UTC")` creyendo que ajusta las 5 horas desde `-05:00` $\rightarrow$ `aiNotes` distingue `replace_time_zone` (asigna etiqueta sin mover el reloj) frente a `convert_time_zone` (traduce el instante físico).
     - En `c1-python-05`: meter `pl.read_parquet("C:/...")` dentro de la función probada con `pytest` y usar `assert str(df1) == str(df2)` $\rightarrow$ `aiNotes` guía a pasar `DataFrame`/`LazyFrame` por parámetro y comparar con `assert_frame_equal`.

---

## Capturas antes / después
Todas las capturas se tomaron a `1280×720` en `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-c1-python\` (no añadidas al commit de git) y se inspeccionaron visualmente con `read_file`:

| Archivo en `docs/reportes/capturas/W-c1-python/` | Lección / Vista | Verificación visual (`1280×720`) |
|---|---|---|
| `W-c1-python_01-polars-pandas-cow_cabecera_1280x720_light.png` | Lección 1 — Cabecera (claro) | Título, miga de pan `Ruta > Python para datos`, prerrequisitos, temario `1/10`, `ESCENARIO REAL` y `OBJETIVOS DE LA LECCIÓN` sin cortes ni solapamientos. |
| `W-c1-python_01-polars-pandas-cow_cabecera_1280x720_dark.png` | Lección 1 — Cabecera (oscuro) | Tema oscuro `#111110`, acento `#E06B47`, código inline legible y estado `09 Práctica aplicada · Enviada` en el temario lateral. |
| `W-c1-python_01-polars-pandas-cow_practica_1280x720_light.png` | Lección 1 — Práctica resuelta | Huecos `scan_parquet`, `with_columns` y `collect` en verde (`.is-correct`) y banner `'Respuesta verificada · Todos los bloques coinciden con la especificación'`. |
| `W-c1-python_02-io-csv-json-parquet_cabecera_1280x720_light.png` | Lección 2 — Cabecera (claro) | Título, prerrequisito enlazado a Lección 1, escenario sobre los 2 400 clientes (`06102` y `C1051`) y 3 objetivos visibles. |
| `W-c1-python_02-io-csv-json-parquet_practica_1280x720_light.png` | Lección 2 — Práctica resuelta | Huecos `schema_overrides`, `scan_parquet` y `write_parquet` verificados en verde con explicación de solución y estado `Enviada`. |
| `W-c1-python_03-expresiones-vectorizadas_cabecera_1280x720_light.png` | Lección 3 — Cabecera (claro) | Título, escenario del fan-out (`18 003 141.53 USD` vs `6 269 462.42 USD`), encabezados de sección $\le 70$ caracteres en el temario lateral. |
| `W-c1-python_03-expresiones-vectorizadas_practica_1280x720_light.png` | Lección 3 — Práctica resuelta | Huecos `validate`, `group_by` y `sum` verificados en verde y banner de confirmación completo. |
| `W-c1-python_04-limpieza-texto-fechas-tz_cabecera_1280x720_light.png` | Lección 4 — Cabecera (claro) | Título oficial del catálogo, escenario con los `9 218 eventos` desplazados de fecha en `events` y objetivos con píldoras monoespaciadas. |
| `W-c1-python_04-limpieza-texto-fechas-tz_cabecera_1280x720_dark.png` | Lección 4 — Cabecera (oscuro) | Contraste correcto en modo oscuro sobre fondo `#111110` y tarjetas `#181715`. |
| `W-c1-python_04-limpieza-texto-fechas-tz_practica_1280x720_light.png` | Lección 4 — Práctica resuelta | Huecos `strip_chars`, `to_datetime` y `date` en verde y explicación de normalización UTC visible. |
| `W-c1-python_05-cuaderno-a-script-cli_cabecera_1280x720_light.png` | Lección 5 — Cabecera (claro) | Título, escenario de refactorización del cuaderno de 38 celdas y objetivos con `argparse`, `pathlib.Path`, `logging` y `pytest`. |
| `W-c1-python_05-cuaderno-a-script-cli_practica_1280x720_light.png` | Lección 5 — Práctica resuelta | Huecos `assert_frame_equal`, `ArgumentParser` y `collect` verificados en verde sin desbordes. |

---

## Peticiones al orquestador
1. **Sincronización de índice de lecciones al integrar la Ola A:** Ejecutar `node scripts/sync-lessons-index.mjs` tras fusionar la rama `agente/W-c1-python` para registrar las 5 lecciones de `src/data/lessons/c1-python/` en `src/data/lessons/index.js` (con sus alias de catálogo `c1-python-01` .. `c1-python-05`).
2. **Integración del glosario modular:** Fusionar los 8 términos de `docs/curriculo/investigacion/c1-python-glossary.json` (`polars-lazyframe`, `pandas-copy-on-write`, `pyarrow-string-dtype`, `esquema-explicito-io`, `polars-expresion-columnar`, `validacion-cardinalidad-join`, `normalizacion-utc-tz`, `funcion-pura-transformacion`) dentro de `src/data/glossary.js`.
3. **Estado del catálogo:** El módulo `c1-python` queda 100 % cubierto (5 de 5 lecciones implementadas y validadas).

---

## Pendiente
- Ningún ítem pendiente dentro del alcance de `W-c1-python`.
