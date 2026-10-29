# Investigación curricular y mapa de conceptos · `c1-python` (Python para datos)

- **Módulo:** `c1-python` — *Python para datos*
- **Área y nivel:** `core` (Tronco común) · Nivel 1 (*Fundamentos*)
- **Prerrequisitos de módulo:** `c0-herramientas`, `c1-sql-base`
- **Duración total:** 110 minutos (5 lecciones: 25 + 20 + 25 + 20 + 20 min)
- **Fecha de consulta y verificación:** `2026-10-29`

---

## 1. Investigación de fuentes por lección (Paso 1)

Cada una de las cinco lecciones cuenta con al menos tres fuentes verificadas (`https://...`), de las cuales como mínimo dos son fuentes primarias oficiales (documentación de Polars 2.0, pandas 3.0, Apache Arrow / Parquet, Python 3.13+ y pytest).

### Lección 1 · `c1-python-01-polars-pandas-cow`
**Título:** *DataFrames en Polars y pandas 3.0: modelo columnar y CoW* (`25 min`)

| # | Tipo | Fuente y título | Editorial / Autor | URL | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|---|
| 1 | Primaria | Polars User Guide — Getting Started, Expressions & Lazy API (v2.0) | Polars Project | https://docs.pola.rs/user-guide/getting-started/ | `2026-10-29` | Ausencia de índice de filas (`Index`) en Polars, inmutabilidad de `DataFrame`, motor de ejecución por expresiones y evaluación perezosa con motor `streaming` por defecto en Polars 2.0. |
| 2 | Primaria | pandas 3.0 User Guide — Copy-on-Write (CoW) | PyData / NumFOCUS | https://pandas.pydata.org/docs/user_guide/copy_on_write.html | `2026-10-29` | Activación obligatoria por defecto de Copy-on-Write en pandas 3.0: cualquier indexación o filtro devuelve un objeto que se comporta como copia aislada, eliminando `SettingWithCopyWarning` y prohibiendo la asignación encadenada (`df["a"][0] = 1`). |
| 3 | Primaria | pandas 3.0 User Guide — Working with Text Data (PyArrow String Dtype) | PyData / NumFOCUS | https://pandas.pydata.org/docs/user_guide/text.html | `2026-10-29` | En pandas 3.0 las columnas de texto infieren por defecto el tipo `str` respaldado por PyArrow en memoria contigua en lugar del tipo antiguo `object` de punteros de Python. |
| 4 | Primaria | Apache Arrow Documentation — Columnar Format and Memory Layout | Apache Software Foundation | https://arrow.apache.org/docs/format/Columnar.html | `2026-10-29` | Disposición física en memoria RAM mediante búferes contiguos de validez, desplazamientos y valores que habilitan vectorización SIMD sin copiar memoria entre motores. |

### Lección 2 · `c1-python-02-io-csv-json-parquet`
**Título:** *Lectura y escritura de CSV, JSON y Parquet con tipado* (`20 min`)

| # | Tipo | Fuente y título | Editorial / Autor | URL | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|---|
| 1 | Primaria | Polars User Guide — IO: CSV, JSON and Parquet | Polars Project | https://docs.pola.rs/user-guide/io/ | `2026-10-29` | Lectura y escritura con `read_csv`, `scan_csv`, `read_ndjson`, `read_parquet`, `scan_parquet` y `write_parquet`, así como definición explícita de tipos mediante `schema_overrides`. |
| 2 | Primaria | Apache Parquet Documentation — File Format, Footer Metadata and Compression | Apache Software Foundation | https://parquet.apache.org/docs/file-format/ | `2026-10-29` | Estructura física por grupos de filas (*Row Groups*), preservación del esquema tipado en el pie del archivo (*Footer*), estadísticas `min`/`max` por columna y compresión Zstandard (`ZSTD`). |
| 3 | Primaria | pandas 3.0 User Guide — IO Tools (Text, CSV, HDF5, Parquet) | PyData / NumFOCUS | https://pandas.pydata.org/docs/user_guide/io.html | `2026-10-29` | Uso de `dtype` en `pd.read_csv()` para preservar cadenas con ceros a la izquierda (como códigos postales) y motor `pyarrow` para lectura y escritura de Parquet. |

### Lección 3 · `c1-python-03-expresiones-vectorizadas`
**Título:** *Filtrar, agrupar, unir y transformar con expresiones* (`25 min`)

| # | Tipo | Fuente y título | Editorial / Autor | URL | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|---|
| 1 | Primaria | Polars User Guide — Expressions and Contexts (`select`, `with_columns`, `filter`, `group_by`) | Polars Project | https://docs.pola.rs/user-guide/expressions/ | `2026-10-29` | Evaluación paralelizada de expresiones columnares `pl.col()`, condicionales `pl.when().then().otherwise()`, agregaciones filtradas dentro de `group_by().agg()` y funciones de ventana con `.over()`. |
| 2 | Primaria | Polars User Guide — Transformations: Joins and Unpivot | Polars Project | https://docs.pola.rs/user-guide/transformations/joins/ | `2026-10-29` | Estrategias de unión (`inner`, `left`, `semi`, `anti`), validación de cardinalidad con `validate="1:1"` o `"m:1"` para impedir fan-out, y reemplazo de `.melt()` por `.unpivot()` en Polars 2.0. |
| 3 | Primaria | pandas 3.0 User Guide — Merging, Joining, Concatenating and `pd.col` Expressions | PyData / NumFOCUS | https://pandas.pydata.org/docs/user_guide/merging.html | `2026-10-29` | Validación de relaciones con `merge(..., validate="one_to_one" | "many_to_one")` en pandas 3.0 y sintaxis de expresiones columnares `pd.col()` en `.assign()` y `.loc[]`. |

### Lección 4 · `c1-python-04-limpieza-texto-fechas-tz`
**Título:** *Limpieza de cadenas, fechas y zonas horarias en Python* (`20 min`)

| # | Tipo | Fuente y título | Editorial / Autor | URL | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|---|
| 1 | Primaria | Polars User Guide — Strings (`Expr.str`) and Temporal Data (`Expr.dt`) | Polars Project | https://docs.pola.rs/user-guide/expressions/strings/ | `2026-10-29` | Limpieza vectorizada con `.str.strip_chars()`, `.str.to_uppercase()`, `.str.extract()`, `.str.json_decode()`, conversión con `.str.to_datetime()` y manejo de husos con `.dt.replace_time_zone()` y `.dt.convert_time_zone()`. |
| 2 | Primaria | Polars User Guide — Time Zones and Temporal Operations | Polars Project | https://docs.pola.rs/user-guide/transformations/time-series/timezones/ | `2026-10-29` | Diferencia semántica entre asignar una zona horaria a un timestamp sin zona (`replace_time_zone`) y convertir un instante físico a UTC u otra zona IANA (`convert_time_zone`). |
| 3 | Primaria | Python 3.13 Standard Library — `zoneinfo`: IANA Time Zone Support | Python Software Foundation | https://docs.python.org/3/library/zoneinfo.html | `2026-10-29` | Uso de identificadores oficiales de la base de datos IANA (`America/Mexico_City`, `America/Bogota`, `Europe/Madrid`, `UTC`) frente a desplazamientos fijos que ignoran cambios de horario. |

### Lección 5 · `c1-python-05-cuaderno-a-script-cli`
**Título:** *Del cuaderno interactivo al script modular con pruebas* (`20 min`)

| # | Tipo | Fuente y título | Editorial / Autor | URL | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|---|
| 1 | Primaria | Python 3.13 Standard Library — `argparse`: Parser for Command-Line Options and Arguments | Python Software Foundation | https://docs.python.org/3/library/argparse.html | `2026-10-29` | Construcción de interfaces de línea de comandos reproducibles con argumentos tipados (`--input-dir`, `--output`, `--min-price`), valores por defecto y códigos de salida del proceso. |
| 2 | Primaria | pytest Documentation — Good Integration Practices and Fixtures | pytest-dev | https://docs.pytest.org/en/stable/explanation/goodpractices.html | `2026-10-29` | Estructura de pruebas automatizadas separando funciones puras de transformación de los efectos secundarios de lectura/escritura en disco. |
| 3 | Primaria | Polars API Reference — `polars.testing.assert_frame_equal` | Polars Project | https://docs.pola.rs/api/python/stable/reference/testing.html | `2026-10-29` | Verificación exacta de esquemas, tipos y valores numéricos con tolerancia controlada entre el `DataFrame` producido por una función de transformación y el resultado esperado en pruebas unitarias. |
| 4 | Primaria | Marimo Documentation — Running Notebooks as Scripts and Reactive DAGs | Marimo Team | https://docs.marimo.io/guides/scripts/ | `2026-10-29` | Almacenamiento de cuadernos reactivos como archivos `.py` puros versionables en Git y ejecutables tanto de forma interactiva como desde la terminal. |

---

## 2. Mapa de conceptos y progresión del módulo (Paso 2)

El módulo `c1-python` se apoya en dos prerrequisitos del catálogo:
- De `c0-herramientas` asume el manejo básico de terminal, rutas de archivos, variables, funciones en Python y la diferencia entre un cuaderno interactivo (Jupyter/Marimo) y un archivo `.py`.
- De `c1-sql-base` asume los conceptos tabulares de selección (`SELECT`), filtrado (`WHERE`), agrupación (`GROUP BY`), valores nulos (`NULL`) y funciones de fecha.

### Progresión secuencial de las 5 lecciones

| Orden | ID de lección | Conceptos nuevos que introduce | Conceptos previos que reutiliza | Tablas y anomalías reales de Mercado Brisa |
|---|---|---|---|---|
| 1 | `c1-python-01-polars-pandas-cow` | Memoria columnar Apache Arrow, ausencia de índice en Polars, inmutabilidad de `DataFrame`, **Copy-on-Write (CoW)** obligatorio y tipo `str` PyArrow en pandas 3.0, expresiones `pl.col()` y `pd.col()`. | Tipos de datos tabulares (`c0-datos`), colecciones y funciones en Python (`c0-herramientas-03`), filtrado y proyección (`c1-sql-base-01`). | `products.parquet` (180 filas): aislamiento del producto de calibración `SKU-TEST-NEG` (`list_price_usd = -9.99`, `is_active = false`) y cálculo de margen unitario en las 5 categorías sin mutar la tabla original. |
| 2 | `c1-python-02-io-csv-json-parquet` | Trampas de inferencia en CSV (`infer_schema_length`, pérdida de ceros iniciales), `schema_overrides` / `dtype`, lectura de JSON por líneas (`NDJSON`) y decodificación de JSON anidado (`str.json_decode`), pie de metadatos Parquet + ZSTD, lectura ansiosa (`read_parquet`) frente a escaneo perezoso (`scan_parquet` + `.collect()`) con poda de columnas y predicados. | Formatos CSV, JSON y Parquet (`c0-datos-03`), modelo columnar e inmutabilidad (`c1-python-01`). | `customers.parquet` (2 400 filas: 364 códigos postales en `MX` con cero inicial como `'06102'` y 364 alfanuméricos en `AR` como `'C1051'`), `events.parquet` (`payload_json`) y `orders.parquet` (18 000 filas en 384.1 KB). |
| 3 | `c1-python-03-expresiones-vectorizadas` | Contextos de Polars (`select`, `with_columns`, `filter`, `group_by`), condicionales `pl.when().then().otherwise()`, agregaciones filtradas dentro de `.agg()`, cruces con validación de cardinalidad (`join(..., validate="1:1" \| "m:1")`), pre-agregación contra el fan-out, expresiones de ventana `.over()` y transformación ancho-a-largo con `.unpivot()`. | `GROUP BY` y `FILTER` en SQL (`c1-sql-base-04`, `c1-sql-base-05`), escaneo perezoso (`c1-python-02`). | `orders.parquet`, `order_items.parquet`, `refunds.parquet`, `products.parquet` y `stores.parquet`: comparación exacta entre el cruce ingenuo que infla `total_usd` a `18 003 141.53 USD` (34 830 filas) y el cruce pre-agregado exacto de `6 269 462.42 USD` (14 760 pedidos completados) en las 4 regiones. |
| 4 | `c1-python-04-limpieza-texto-fechas-tz` | Espacio de nombres `.str` (`strip_chars`, `to_uppercase`, `len_chars`, `contains`, `extract`), parseo temporal estricto (`.str.to_date()`, `.str.to_datetime()`), diferencia entre `.dt.replace_time_zone()` y `.dt.convert_time_zone("UTC")`, impacto de truncar cadenas ISO con desplazamientos mixtos antes de normalizar a UTC. | Codificación UTF-8 (`c0-datos-04`), funciones de fecha (`c1-sql-base-06`), expresiones columnares (`c1-python-03`). | `customers.parquet` (218 nulos y 129 códigos postales truncados de 2 caracteres) y `events.parquet` (65 000 eventos con 5 husos en `event_ts_raw`: `-06:00`, `-05:00`, `-03:00`, `+01:00` y `Z`, donde truncar el texto desplaza de fecha a **9 218 eventos**, el 14.18 % del total). |
| 5 | `c1-python-05-cuaderno-a-script-cli` | Riesgos de estado oculto y rutas fijas en cuadernos, extracción de funciones puras tipadas (`LazyFrame -> DataFrame`), interfaz CLI con `argparse` y `pathlib.Path`, registro con `logging`, validaciones bloqueantes de calidad y pruebas unitarias con `pytest` y `assert_frame_equal`. | Terminal, Git, `uv` y cuadernos (`c0-herramientas`), todas las transformaciones de `c1-python-01` a `c1-python-04`. | `orders.parquet`, `order_items.parquet`, `products.parquet` y `stores.parquet`: construcción del pipeline CLI `resumen_ventas.py` que descarta `SKU-TEST-NEG`, filtra `status == "completed"` y exporta el margen diario por tienda verificado (p. ej. el `2025-10-01` o el acumulado por tienda encabezado por `STR-AR-01` con `463 356.09 USD` de margen bruto). |

**Verificación de dependencias conceptuales:** Ninguna lección utiliza un método o concepto sin haberlo introducido antes. El concepto de prevención de fan-out al cruzar `orders` con `order_items` se explica paso a paso dentro de `c1-python-03` (mediante pre-agregación y `validate="1:1"`), sin asumir que la persona haya cursado todavía `c1-sql-joins`.

---

## 3. Especificación y rúbrica del proyecto del módulo (Paso 6)

### Enunciado y entregable en `src/data/catalog/modules.js`
- **Prompt actual en catálogo:** *Construir un script en Polars que limpie el catálogo y calcule el margen diario por tienda.*
- **Dataset:** *Mercado Brisa (`orders.parquet`, `order_items.parquet`, `products.parquet` y `stores.parquet`)*
- **Entregable:** *Script `resumen_ventas.py` reproducible por línea de comandos que exporta un archivo Parquet validado.*

### Cifras reales de referencia sobre Mercado Brisa para corrección del proyecto
Al ejecutar el flujo limpio sobre las cuatro tablas (`orders.status == 'completed'` y `products.list_price_usd > 0`, excluyendo `SKU-TEST-NEG` y pre-agregando `order_items` por `order_id`):
- **Pedidos completados totales:** `14 760` pedidos (`71 050` unidades vendidas).
- **Ingresos brutos de líneas (`item_revenue_usd`):** `5 464 151.18 USD`.
- **Margen bruto de líneas (`gross_margin_usd`):** `2 616 988.87 USD`.
- **Top 3 tiendas por margen bruto acumulado:**
  1. `STR-AR-01` (Buenos Aires): `2 811` pedidos, `12 600` unidades, `966 754.24 USD` en ventas de líneas, `463 356.09 USD` de margen (`47.93 %`).
  2. `STR-PE-01` (Lima): `2 109` pedidos, `9 916` unidades, `769 447.66 USD` en ventas de líneas, `368 106.89 USD` de margen (`47.84 %`).
  3. `WH-ES-01` (Madrid): `1 405` pedidos, `8 885` unidades, `684 417.83 USD` en ventas de líneas, `327 936.77 USD` de margen (`47.91 %`).

### Rúbrica verificable de 4 criterios (escala 0–4)

| Criterio | 0–1 (Insuficiente) | 2 (Básico) | 3 (Competente) | 4 (Excelente) |
|---|---|---|---|---|
| **1. Lectura perezosa y limpieza del catálogo** | Usa rutas absolutas fijas o no filtra `SKU-TEST-NEG` (`list_price_usd = -9.99`), contaminando el margen. | Lee con `read_parquet` ansioso y filtra `list_price_usd > 0`, pero sin validar nulos ni tipos. | Usa `pl.scan_parquet()`, filtra `is_active` y `list_price_usd > 0`, y normaliza cadenas con `.str.strip_chars()`. | Usa `pl.scan_parquet()`, aplica poda de columnas y predicados, limpia cadenas y verifica con una aserción que ningún precio o costo sea negativo antes de cruzar. |
| **2. Expresiones vectorizadas y control de grano** | Usa bucles `for` o `.apply()` fila por fila, o hace un join sin controlar el grano duplicando importes de cabecera. | Calcula el margen con expresiones, pero materializa DataFrames intermedios innecesarios en cada paso. | Encadena expresiones `pl.col()` en un único plan perezoso y valida la cardinalidad de los cruces con `validate="m:1"` o `"1:1"`. | Pre-agrega líneas por pedido y tienda con expresiones vectorizadas, valida cardinalidad con `validate="1:1"` y concilia el total de pedidos (`14 760`) sin desviaciones. |
| **3. Interfaz CLI y escritura en Parquet** | El código solo corre dentro de un cuaderno interactivo y no genera el archivo Parquet desde la terminal. | Se ejecuta como script `.py`, pero tiene las rutas de entrada y salida fijas en el código fuente. | Parametriza `--input-dir` y `--output` con `argparse` y `pathlib.Path`, y escribe el resultado comprimido con `write_parquet(..., compression="zstd")`. | Parametriza argumentos CLI con validación de existencia de archivos, registra métricas de ejecución con `logging` y devuelve código de salida distinto de cero ante fallos. |
| **4. Pruebas unitarias con `pytest`** | No incluye pruebas automatizadas. | Incluye comprobaciones manuales con `print()` al final del mismo script. | Incluye un archivo `test_resumen_ventas.py` con al menos 2 pruebas en `pytest` sobre datos sintéticos en memoria usando `assert_frame_equal`. | Incluye pruebas unitarias con `assert_frame_equal` que cubren el caso normal, el descarte de `SKU-TEST-NEG` (`-9.99`) y pedidos con estado distinto de `completed`. |
