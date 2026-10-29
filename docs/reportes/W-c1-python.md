# Reporte de agente — W-c1-python · Módulo c1-python: Python para datos

**Fecha:** 2026-10-29
**Rama:** `agente/W-c1-python`
**Worktree:** `C:\Users\T490s\Desktop\Proyectos\ING-W-c1-python`
**Estado:** Completado

## Inicio
Lecturas obligatorias realizadas antes de escribir código o contenido, con 1 dato técnico concreto aprendido de cada archivo individual:

1. `PLAN_GEMINI_4_ARGON.md`:
   - Define en §5 el módulo `c1-python` ("Python para datos", Nivel 1, `core`, 110 min, 5 lecciones, prerrequisitos `c0-herramientas` y `c1-sql-base`, proyecto `resumen_ventas.py` probado con `pytest`), en §9.2 el método de escritura de 7 pasos con media de frase $\le 22$ palabras y glosario $\le 25$ palabras, en §9.4 la rúbrica de 8 criterios (escala 0–4, sobre 32 puntos) y en Apéndice D.2/D.3 la plantilla y checklist del reporte.
2. `docs/curriculo/estado-herramientas.md`:
   - Fija las versiones vigentes en 2026 para el stack Python: **Python 3.13/3.14**, **Polars 2.0** (`LazyFrame`, motor `streaming` por defecto y `.unpivot()` en lugar del eliminado `.melt()`), **pandas 3.0** (Copy-on-Write obligatorio, eliminación de `SettingWithCopyWarning`, `ChainedAssignmentError`, tipo `str` respaldado por PyArrow por defecto y expresiones `pd.col()`), **Apache Arrow / Parquet** con `zstd`, **Marimo** y **uv**.
3. `docs/curriculo/fuentes.md`:
   - Establece el catálogo de fuentes primarias autorizadas (`https://docs.pola.rs/`, `https://pandas.pydata.org/docs/`, `https://arrow.apache.org/docs/`, `https://parquet.apache.org/docs/`, `https://docs.python.org/3/library/`, `https://docs.pytest.org/` y `https://docs.marimo.io/`), prohibiendo blogs de terceros o contenido sin respaldo documental primario.
4. `docs/curriculo/brechas.md`:
   - Registra que las 5 lecciones de `c1-python` (`c1-python-01` a `c1-python-05`) carecen de `legacyId` en `learningPath2026.js` y forman parte de las 66 lecciones nuevas que se escriben desde cero en la Fase 3.
5. `docs/curriculo/cambios-catalogo.md`:
   - Documenta que `c1-python` se ubica en Nivel 1 (`core`) tras `c0-herramientas` y `c1-sql-base`, y actúa como prerrequisito directo para `de2-ingesta`, `de2-formatos`, `da2-exploracion` y `bi2-modelado`.
6. `docs/curriculo/perfil-core.md`:
   - Especifica que al completar el tronco común (`core`), el estudiante debe transformar tablas en Python sin mutaciones accidentales, declarar esquemas explícitos al ingerir CSV/JSON, persistir en Parquet comprimido y probar funciones puras con `pytest`.
7. `package.json`:
   - Incluye `@duckdb/node-api` (`^1.2.1-alpha.17`) para ejecutar consultas analíticas desde Node, `@duckdb/duckdb-wasm` (`^1.29.0`) para el navegador, `zod` (`^3.24.2`) para validación de esquemas y `playwright-core` (`^1.58.2`) para verificación en navegador real.
8. `vite.config.js`:
   - Monta el plugin `granoAiPlugin()` desde `./server/ai/routes.js` en el servidor Vite y separa en `manualChunks` los paquetes `vendor` y `curriculum-stages` excluyendo `@duckdb` y `@codemirror`.
9. `src/main.jsx`:
   - Importa en orden estricto las hojas de estilo `./styles/tokens.css`, `./styles/base.css`, `./styles/layout.css`, `./styles/components.css`, `./styles/views.css` y `./styles/utilities.css` antes de renderizar `<App />`.
10. `src/App.jsx`:
    - Conecta `useAppController()` con `AppShell`, `LessonPlayer` y `TutorPanel`, pasando `currentLesson`, `activeStepLabel`, `quizAnswers`, `completedLabIds` y `onSolveLab`.
11. `src/styles/tokens.css`:
    - Define los tokens de color de la estética Editorial Analítica Cálida (`--bg-0: #FAF7F2`, `--ink-0: #181614`, `--accent: #B84A27` en modo claro y `--bg-0: #111110`, `--ink-0: #F3EFE8`, `--accent: #E06B47` en `[data-theme="dark"]`).
12. `src/data/catalog/modules.js`:
    - Declara el objeto del módulo `c1-python` (líneas 317–336) con los 5 IDs cortos `c1-python-01` .. `c1-python-05` y sus títulos canónicos.
13. `public/datasets/README.md`:
    - Detalla las anomalías sembradas con semilla `20260419` en Mercado Brisa: el producto inactivo `SKU-TEST-NEG` con `list_price_usd = -9.99` en `products.parquet`, los códigos postales con cero inicial en México y alfanuméricos en Argentina dentro de `customers.parquet`, y la columna `event_ts_raw` con 5 desplazamientos horarios mezclados en `events.parquet`.
14. `public/datasets/schema.json`:
    - Especifica los nombres exactos de columnas, tipos DuckDB/Parquet y conteos de filas de las 13 tablas (`customers`: 2 400, `products`: 180, `stores`: 18, `orders`: 18 000, `order_items`: 42 000, `payments`: 19 500, `refunds`: 1 450, `events`: 65 000).
15. `src/data/schema/lesson.js`:
    - Define `LessonSchema` con Zod exigiendo entre 950 y 1 500 palabras totales para Nivel 1 (`WORD_LIMITS_BY_LEVEL[1]`), `hook` de 35–100 palabras, `sections[].heading` $\le 70$ caracteres, `sections[].body` de 80–280 palabras, `checks[].explanation` de 20–60 palabras, `roleNotes` (`de`, `da`, `bi`) de 30–90 palabras, `summary` de 3–5 puntos de $\le 22$ palabras y `aiNotes` de 20–80 palabras.
16. `src/data/schema/glossary.js`:
    - Define `GlossaryTermSchema` y `GlossaryListSchema` exigiendo `id` en `kebab-case`, `track` en `['core', 'de', 'da', 'bi']`, `definition` de 20 a 60 palabras y `relatedLessons` con al menos 1 lección.
17. `scripts/check-content.mjs`:
    - Escanea recursivamente `src/data/lessons/**/*.js`, valida cada lección contra `LessonSchema` y carga automáticamente `docs/curriculo/investigacion/*-glossary.json` (líneas 103–119) para validar `lesson.glossaryTerms` sin requerir editar `src/data/glossary.js`.
18. `scripts/check-copy.mjs`:
    - Audita la ausencia de términos prohibidos, emojis, menciones a `"2026"` fuera de `sources/accessed`, exceso de negritas ($>3$ por párrafo) y verifica que la longitud media de frase en `sections[].body` sea $\le 22$ palabras/frase.
19. `scripts/sync-lessons-index.mjs`:
    - Genera `src/data/lessons/index.js` exportando `LESSONS_V2`, `LESSONS` y `LESSONS_BY_ID`, registrando automáticamente tanto el `id` largo v2 (`c1-python-01-polars-pandas-cow`) como el alias corto del catálogo (`c1-python-01`).
20. `src/views/LessonPlayer.jsx`:
    - Renderiza las secciones de lectura con `id="sec-<secId>"`, las comprobaciones en `#sec-comprobaciones` y la práctica en `#sec-practica`, bloqueando el botón de completar lección hasta haber leído hasta `#sec-resumen`, respondido todos los `checks` y enviado la práctica.
21. `src/components/AuthenticCodeLab.jsx`:
    - Implementa el modo `fill-blanks` dividiendo `starterCode` mediante la expresión regular `/(\{\{blank_\d+\}\})/g` en botones `[data-testid="blank-slot-blank_1"]` y chips `[data-testid="token-option-<opt>"]`, comprobando `blanks.every((b) => selectedValues[b.id] === b.correct)` al pulsar `[data-testid="verify-blanks-btn"]`.
22. `src/views/lesson/normalizeLessonV2.js`:
    - Normaliza cualquier objeto de lección v2 o legacy fusionándolo con los metadatos de `MODULES_BY_ID` y `TRACKS`, y construyendo los ítems del temario lateral con `buildLessonSyllabusItems`.
23. `src/views/lesson/LessonCheckCard.jsx`:
    - Muestra cada comprobación (`mcq` o `predict-output`), exige seleccionar una opción antes de verificar, presenta el `feedback` específico de la opción elegida junto con `check.explanation` y ofrece el botón `Reintentar` si la respuesta fue incorrecta.
24. `src/components/LessonVisualizers.jsx`:
    - Registra el diccionario de simuladores interactivos en línea, incluyendo `duckdb-polars-sim` (usado en `c1-python-01`) y `row-vs-columnar-storage` (usado en `c1-python-02`).
25. `src/data/glossary.js`:
    - Exporta `GLOSSARY_TERMS` y `GLOSSARY_CONCEPTS_2026` validados por `GlossaryListSchema`, mostrando la estructura exacta de `id`, `term`, `englishTerm`, `track`, `definition`, `formula`, `relatedLessons`, `relatedTerms` y `sources`.
26. `src/data/lessons/de2-formatos/de2-formatos-02-arrow-lance-vortex.js`:
    - Sirvió como referencia de cómo presentar la disposición física de búferes contiguos de Apache Arrow (`validity bitmap`, `offsets`, `values`) para conectar Nivel 1 (`c1-python-01`) con Nivel 2 (`de2-formatos-02`).
27. `src/data/lessons/de2-formatos/de2-formatos-03-duckdb-polars-marimo.js`:
    - Sirvió como referencia del uso de `pl.scan_parquet()`, `Predicate Pushdown` y cuadernos reactivos Marimo (`.py`) para alinear la progresión hacia `c1-python-05`.
28. `src/data/lessons/c1-sql-joins/c1-sql-joins-02-grano-fanout.js`:
    - Sirvió como referencia del caso de fan-out entre `orders`, `order_items` y `refunds` en SQL para diseñar su contraparte exacta en Python con pre-agregación y `.join(..., validate="1:1")` en `c1-python-03`.

---

## Pasos

### Paso 1 — Investigación y fuentes primarias (`docs/curriculo/investigacion/c1-python.md`)
Se creó `docs/curriculo/investigacion/c1-python.md` documentando **3 a 4 fuentes primarias verificadas (`https://`, fecha de acceso `2026-10-29`) por cada una de las 5 lecciones** (17 referencias primarias en total: Polars 2.0 User Guide & API Reference, pandas 3.0 User Guide, Apache Arrow Columnar Format, Apache Parquet File Format, Python 3.13 Standard Library `zoneinfo` y `argparse`, IANA Time Zone Database, `pytest` y Marimo), junto con las cifras exactas extraídas de los archivos Parquet de Mercado Brisa.

### Paso 2 — Mapa de conceptos y progresión del módulo
Se diseñó la secuencia conceptual sin solapamientos a lo largo de las 5 lecciones:
1. **`c1-python-01-polars-pandas-cow`:** Disposición columnar en memoria Apache Arrow (`str` PyArrow / `pl.String`), inmutabilidad en Polars 2.0 (`LazyFrame` con `scan_parquet`), modo obligatorio Copy-on-Write en pandas 3.0 (`ChainedAssignmentError`) y expresiones `pl.col()` / `pd.col()`.
2. **`c1-python-02-io-csv-json-parquet`:** Riesgos de inferencia automática en CSV (truncado de ceros iniciales en códigos postales de México y fallos con códigos alfanuméricos de Argentina), declaración explícita con `schema_overrides` y `dtype`, decodificación vectorizada de JSON/NDJSON con `str.json_decode` + `struct.field`, y lectura/escritura de Parquet con `zstd`, *Projection Pushdown* y *Predicate Pushdown*.
3. **`c1-python-03-expresiones-vectorizadas`:** Condicionales vectorizados `pl.when().then().otherwise()`, agregaciones condicionales con `.filter()` dentro de `.agg()`, pre-agregación al mismo grano y validación de cardinalidad en cruces (`validate="1:1" | "m:1"`), funciones de ventana `.over()` y paso a formato largo con `.unpivot()`.
4. **`c1-python-04-limpieza-texto-fechas-tz`:** Limpieza y auditoría de cadenas con `.str` (`strip_chars`, `to_lowercase`, `len_chars` vs `len_bytes`, `contains`), conversión temporal con `.str.to_datetime(time_zone="UTC")`, diferencia entre `replace_time_zone` y `convert_time_zone` con zonas IANA, y cuantificación de los `9 218` eventos de Mercado Brisa que cambian de fecha al truncar texto sin normalizar a UTC.
5. **`c1-python-05-cuaderno-a-script-cli`:** Extracción de funciones puras de transformación tabular tipadas (`LazyFrame -> DataFrame`), parametrización multiplataforma con `argparse` y `pathlib.Path`, validaciones bloqueantes con `exit code != 0` antes de `write_parquet`, y pruebas unitarias deterministas con `pytest` y `polars.testing.assert_frame_equal`.

### Paso 3 — Escritura de las 5 lecciones en `src/data/lessons/c1-python/`
Tabla resumen obligatoria de las 5 lecciones escritas (§9.2):

| Lección | Palabras | Checks | Prácticas | Fuentes | Puntuación de rúbrica (§9.4) |
|---|---|---|---|---|---|
| `c1-python-01-polars-pandas-cow` | 1 089 | 4 (`2 predict-output`, `2 mcq`) | 1 (`fill-blanks`, 3 huecos) | 4 | **32 / 32** |
| `c1-python-02-io-csv-json-parquet` | 1 081 | 4 (`3 mcq`, `1 predict-output`) | 1 (`fill-blanks`, 3 huecos) | 3 | **32 / 32** |
| `c1-python-03-expresiones-vectorizadas` | 982 | 4 (`3 mcq`, `1 predict-output`) | 1 (`fill-blanks`, 3 huecos) | 3 | **32 / 32** |
| `c1-python-04-limpieza-texto-fechas-tz` | 1 042 | 4 (`2 mcq`, `2 predict-output`) | 1 (`fill-blanks`, 3 huecos) | 3 | **32 / 32** |
| `c1-python-05-cuaderno-a-script-cli` | 1 039 | 4 (`3 mcq`, `1 predict-output`) | 1 (`fill-blanks`, 3 huecos) | 4 | **32 / 32** |

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

### Paso 6 — Proyecto de módulo (`resumen_ventas.py`), rúbrica de 4 criterios y prueba real del Tutor IA con `agy`
En `docs/curriculo/investigacion/c1-python.md` (§3) se especificó el proyecto de módulo **`resumen_ventas.py` + `test_resumen_ventas.py`** y su rúbrica de evaluación de 4 criterios en escala 0–4 (1. Ingesta tipada y evaluación perezosa; 2. Integridad de grano, expresiones vectorizadas y limpieza de anomalías; 3. Arquitectura modular y parametrización CLI; 4. Pruebas automatizadas con `pytest` y `assert_frame_equal`).

Asimismo, cumpliendo el **Paso 6 de §9.2 y la Checklist D.3**, se ejecutó `runAgyPrompt` (`server/ai/agyRunner.js`, modelo `gemini-3.8-flash-low`) sobre las 5 lecciones simulando el flujo en que el estudiante pide *"Hazme una pregunta para comprobar si lo entendí"* y responde equivocándose a propósito con el error típico de cada lección. Respuestas reales íntegras devueltas por `agy`:

1. **`c1-python-01-polars-pandas-cow` (`6 893 ms`, modelo `gemini-3.8-flash-low`):**
   - **Respuesta errónea enviada por el estudiante:** `"Creo que en pandas 3.0 sí se altera df salvo que ponga .copy(), y que en Polars puedo usar df.iloc[0] sobre el Index."`
   - **Respuesta real de `agy`:**
     > En ambos casos la intuición viene de las versiones antiguas, pero en las versiones actuales no funciona así.
     >
     > Primero, en pandas 3.0 **no se altera `df`**, y ya no necesitas escribir `.copy()`. Con Copy-on-Write (CoW), cualquier subconjunto se comporta como una copia independiente. Comparte la memoria para ahorrar recursos, pero en el instante en que modificas `sub["list_price_usd"] = 0`, pandas clona únicamente esa columna. La tabla original `df` queda intacta.
     >
     > Segundo, en Polars **no existe el concepto de `Index`** ni existen `.loc` o `.iloc`. Para filtrar filas en la tabla `products`, debes usar expresiones con `filter()` y `pl.col()`.
     >
     > Por ejemplo, para quedarte con la categoría de molinos en Polars:
     > ```python
     > import polars as pl
     > products.filter(pl.col("category") == "Molinos")
     > ```
     > ¿Tiene sentido la diferencia entre cómo protege los datos pandas 3.0 frente al diseño sin índices de Polars?

2. **`c1-python-02-io-csv-json-parquet` (`9 896 ms`, modelo `gemini-3.8-flash-low`):**
   - **Respuesta errónea enviada por el estudiante:** `"Basta con subir infer_schema_length=100000 en pl.read_csv() sin pasar schema_overrides, porque leyendo más filas ya no borra el cero inicial."`
   - **Respuesta real de `agy`:**
     > No, eso no lo soluciona.
     >
     > Subir `infer_schema_length` solo hace que Polars revise más filas para intentar adivinar el tipo. Si todas las filas contienen valores formados solo por números (como `06102`), Polars seguirá concluyendo que la columna es numérica (`Int64`). Al convertirla a entero, el cero a la izquierda se elimina de todos modos.
     >
     > La única forma de conservarlo es forzar el tipo texto al leer el archivo con `schema_overrides`:
     > ```python
     > pl.read_csv(
     >     "customers.csv",
     >     schema_overrides={"postal_code": pl.String}
     > )
     > ```
     > Así le ordenas a Polars que trate el valor como texto sin intentar adivinarlo.

3. **`c1-python-03-expresiones-vectorizadas` (`11 658 ms`, modelo `gemini-3.8-flash-low`):**
   - **Respuesta errónea enviada por el estudiante:** `"Agrupo con df.groupby() sin guion bajo, uno orders con order_items directamente sin pre-agregar y uso df.melt() en Polars 2.0."`
   - **Respuesta real de `agy`:**
     > Tienes tres errores clave en tu respuesta:
     >
     > 1. **Agrupación**: En Polars se escribe con guion bajo, `df.group_by()`. Escribir `df.groupby()` es sintaxis de pandas y te dará error.
     > 2. **Cruce de tablas**: Si unes `orders` con `order_items` directamente sin pre-agregar, un pedido con 3 productos repetirá 3 veces su cabecera y triplicará importes como `shipping_fee_usd` u `order_total_usd`. Primero debes pre-agregar `order_items` agrupando por `"order_id"` para que quede una sola fila por pedido. Luego ya puedes hacer el cruce usando `orders.join(items_agrupados, on="order_id", validate="1:1")`.
     > 3. **Formato largo**: En Polars 2.0 el método `.melt()` quedó eliminado. Debes usar `.unpivot()`.

4. **`c1-python-04-limpieza-texto-fechas-tz` (`8 347 ms`, modelo `gemini-3.8-flash-low`):**
   - **Respuesta errónea enviada por el estudiante:** `"Uso .dt.replace_time_zone('UTC') porque reemplaza la zona y suma automáticamente las 5 horas para llevarla a UTC."`
   - **Respuesta real de `agy`:**
     > Ese es justo el error más común.
     >
     > `.dt.replace_time_zone("UTC")` no ajusta las horas: solo cambia la etiqueta. Si tienes `10:00 -05:00` y aplicas `replace_time_zone("UTC")`, el valor se convierte en `10:00 UTC`, alterando el instante real en el tiempo. Además, su uso principal es etiquetar una columna que no tenía zona horaria previa.
     >
     > Para convertir un instante preservando el momento exacto (es decir, sumando o restando la diferencia horaria), debes usar:
     > ```python
     > pl.col("order_ts").dt.convert_time_zone("UTC")
     > ```
     > Con `convert_time_zone("UTC")`, las `10:00 -05:00` de una orden en Mercado Brisa pasan correctamente a ser las `15:00 UTC`.

5. **`c1-python-05-cuaderno-a-script-cli` (`8 529 ms`, modelo `gemini-3.8-flash-low`):**
   - **Respuesta errónea enviada por el estudiante:** `"Meto pl.read_parquet('C:/Users/carlos/Downloads/orders.parquet') dentro de la función y en pytest comparo con assert str(resultado) == str(esperado)."`
   - **Respuesta real de `agy`:**
     > Hay dos detalles clave que conviene corregir en tu respuesta:
     >
     > 1. **No leas el archivo dentro de la función.** Si pones `pl.read_parquet(...)` adentro con una ruta fija, tu función dependerá de tu disco local y no podrás probarla con datos simulados en memoria. La función de transformación debe ser pura: recibe un `pl.DataFrame` (o `LazyFrame`) por parámetro y devuelve otro.
     > 2. **No compares con `str(...)`.** Convertir a texto oculta diferencias en tipos de datos (como `Int32` frente a `Int64`) o desajustes pequeños en decimales. La forma correcta de verificar tablas en Polars es con `assert_frame_equal`.

### Paso 7 — Autoevaluación con la rúbrica de 8 criterios de §9.4 (escala 0–4, sobre 32)
Evaluación de las 5 lecciones con los **8 criterios exactos de §9.4** (escala `0–4`; requisito de aprobación: ningún criterio `< 3` y suma total $\ge 26/32$):

| Lección | 1. Objetivo claro | 2. Progresión | 3. Ejemplo concreto | 4. Error típico | 5. Práctica | 6. Brevedad | 7. Precisión | 8. Tono | Total (/32) |
|---|---|---|---|---|---|---|---|---|---|
| `c1-python-01-polars-pandas-cow` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |
| `c1-python-02-io-csv-json-parquet` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |
| `c1-python-03-expresiones-vectorizadas` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |
| `c1-python-04-limpieza-texto-fechas-tz` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |
| `c1-python-05-cuaderno-a-script-cli` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |

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
4. **Verificación en navegador real (`playwright-core` sobre `http://127.0.0.1:5209`):**
   - Comando: `node C:\Users\T490s\.gemini\antigravity\brain\3e47ef27-5368-4eb5-9a5d-41c543aa35c6\scratch\verify_c1_python.mjs`
   - Código de salida: `0`
   - Resultado: `consoleErrors: []`, `pageErrors: []`, 5/5 lecciones renderizadas y 5/5 prácticas `fill-blanks` resueltas con estado `'Respuesta verificada · Todos los bloques coinciden con la especificación'`.
5. **Prueba real del Tutor IA con `agy` (`runAgyPrompt` sobre las 5 lecciones):**
   - Comando: `node C:\Users\T490s\.gemini\antigravity\brain\3e47ef27-5368-4eb5-9a5d-41c543aa35c6\scratch\run_agy_tutor_5.mjs`
   - Código de salida: `0`
   - Resultado: 5 respuestas reales generadas por `agy` (`gemini-3.8-flash-low`) en `6 893 ms`, `9 896 ms`, `11 658 ms`, `8 347 ms` y `8 529 ms`, detectando y corrigiendo los errores conceptuales de cada lección.
6. **Build de producción (`npm run build`):**
   - Comando: `npm run build`
   - Código de salida: `0`
   - Resultado: Compilación limpia de Vite en producción (`✓ built in 40.43s`).

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

| Caso | Entrada | Resultado esperado | Resultado real |
|---|---|---|---|
| 1. Opción errónea en práctica `fill-blanks` antes de corregir (`c1-python-01`) | Seleccionar chip `read_csv` en `blank_1` (donde la opción correcta es `scan_parquet`) y pulsar `[data-testid="verify-blanks-btn"]`. | El hueco se marca con `.is-wrong`, aparece el aviso `'Algunos huecos no coinciden · Revisa los bloques marcados en rojo'` y la práctica no se da por aprobada hasta corregir los 3 huecos. | `ok: true` — Se mostró la alerta de error en rojo y solo pasó a `'Respuesta verificada · Todos los bloques coinciden con la especificación'` tras elegir `scan_parquet`, `with_columns` y `collect`. |
| 2. Viewport móvil estrecho (`390×844`) con tablas de 5 columnas y código largo (`c1-python-03`) | Redimensionar Chromium a `390×844` y cargar `?view=lesson` con `c1-python-03-expresiones-vectorizadas`. | Sin barra de desplazamiento horizontal global (`document.documentElement.scrollWidth <= clientWidth`), con scroll horizontal confinado en `.lp-code-example__pre` y las tablas. | `ok: true` — `docScrollWidth: 390`, `docClientWidth: 390` (`0 px` de desborde horizontal global) y `0` errores en consola. |
| 3. Modo oscuro (`1280×720`, `[data-theme="dark"]`) en `c1-python-01` y `c1-python-04` | Fijar `prefs.theme = 'dark'` en `localStorage` (`grano:v1`) y capturar las vistas a `1280×720`. | Superficie `#111110`, texto `#F3EFE8`, acento `#E06B47`, píldoras de código legibles y sin bloques blancos residuales. | `ok: true` — Verificado visualmente en `W-c1-python_01-polars-pandas-cow_cabecera_1280x720_dark.png` y `W-c1-python_04-limpieza-texto-fechas-tz_cabecera_1280x720_dark.png`. |
| 4. Navegación por teclado (`Ctrl+K` y cierre con `Escape`) | Pulsar `Control+k` dentro de `LessonPlayer` y luego pulsar `Escape`. | Se abre el diálogo modal `[role="dialog"]` de Command Palette con foco en el buscador y se cierra limpiamente al pulsar `Escape`. | `ok: true` — `[role="dialog"]` visible tras `Control+k` y cerrado tras `Escape` con `0` errores de página. |
| 5. Emulación de `prefers-reduced-motion: reduce` | Activar `page.emulateMedia({ reducedMotion: 'reduce' })` y recargar `LessonPlayer`. | `window.matchMedia('(prefers-reduced-motion: reduce)').matches === true`, desplazamiento instantáneo (`behavior: 'auto'`) y `0` errores de renderizado. | `ok: true` — Media query activa y `0` errores en consola o página. |
| 6. Respuestas erróneas a propósito ante el Tutor IA real (`runAgyPrompt` con `agy`) en las 5 lecciones | Enviar a `runAgyPrompt` (`gemini-3.8-flash-low`) los 5 errores conceptuales (`df.copy()`/`.iloc`, `infer_schema_length=100000` para ceros iniciales, `.groupby()`/`.melt()`/join sin pre-agregar, `replace_time_zone("UTC")` para ajustar horas, e I/O fijo + `assert str()` en `pytest`). | `agy` detecta cada error usando `aiNotes` y el cuerpo de la sección, explica la causa técnica y muestra el código correcto sobre Mercado Brisa. | `ok: true` — Las 5 llamadas a `agy` respondieron en `6.8 s – 11.6 s` corrigiendo con precisión cada uno de los 5 errores conceptuales (ver transcripciones en Paso 6). |

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
