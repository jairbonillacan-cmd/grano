# Investigación curricular y diseño pedagógico — Módulo `c0-datos`: Qué son los datos

- **Módulo:** `c0-datos` (*Qué son los datos*)
- **Área y nivel:** Tronco común (`core`) · Nivel `0` (Cimientos)
- **Objetivo del módulo:** Distinguir tipos de dato, formatos de archivo, codificación UTF-8 y el grano de una tabla.
- **Prerrequisitos del módulo:** Ninguno (primer módulo de la ruta desde cero absoluto).
- **Lecciones del módulo (5 lecciones, 85 minutos totales):**
  1. `c0-datos-01-tipos-dato` — *Tipos de dato: entero, decimal exacto, texto, fecha y booleano* (15 min)
  2. `c0-datos-02-null-vacio` — *Por qué NULL no es cero ni texto vacío* (15 min)
  3. `c0-datos-03-formatos-archivo` — *Archivos de datos: CSV, JSON, Excel y Parquet frente a frente* (20 min)
  4. `c0-datos-04-utf8-separadores` — *Codificación UTF-8, separadores decimales y caracteres rotos* (15 min)
  5. `c0-datos-05-tablas-grano` — *Tablas: filas, columnas, claves y qué significa el grano* (20 min)

---

## 1. Investigación de fuentes por lección (Paso 1)

Cada lección cuenta con al menos **3 fuentes verificables** (`https://`), de las cuales mínimo **2 son primarias** (especificaciones técnicas del IETF/IEEE/Unicode, documentación oficial de PostgreSQL y DuckDB, Apache Software Foundation y metodología de Ralph Kimball).

### 1.1 Lección 1: `c0-datos-01-tipos-dato`
*Tipos de dato: entero, decimal exacto, texto, fecha y booleano*

| # | Tipo | Título de la fuente | Editorial / Autor | URL | Fecha (`accessed`) | Qué afirmación respalda en la lección |
|---|---|---|---|---|---|---|
| 1 | Primaria | PostgreSQL 17 Documentation — Chapter 8: Data Types (Numeric, Character, Date/Time, Boolean) | PostgreSQL Global Development Group | https://www.postgresql.org/docs/current/datatype.html | `2026-10-29` | Diferencia entre tipos exactos (`INTEGER`, `NUMERIC`/`DECIMAL`) e inexactos de coma flotante binaria (`REAL`, `DOUBLE PRECISION`), donde `NUMERIC` se recomienda para importes monetarios. |
| 2 | Primaria | DuckDB Documentation — Data Types Overview | DuckDB Foundation | https://duckdb.org/docs/sql/data_types/overview.html | `2026-10-29` | Catálogo de tipos nativos en DuckDB (`INTEGER`, `DECIMAL(p,s)`, `DOUBLE`, `VARCHAR`, `DATE`, `TIMESTAMP`, `BOOLEAN`) y reglas de conversión explícita con `CAST(valor AS tipo)`. |
| 3 | Primaria | IEEE Standard for Floating-Point Arithmetic (IEEE 754-2019) | IEEE Computer Society | https://ieeexplore.ieee.org/document/8766229 | `2026-10-29` | Representación binaria en base 2 de los números de coma flotante (`DOUBLE`), razón matemática por la cual fracciones decimales como `0.1` y `0.2` no tienen representación finita exacta en binario (`0.1 + 0.2 != 0.3`). |
| 4 | Primaria | ISO 8601 Date and Time Format Standard | International Organization for Standardization (ISO) | https://www.iso.org/iso-8601-date-and-time-format.html | `2026-10-29` | Formato internacional `YYYY-MM-DD` para fechas (`DATE`) y `YYYY-MM-DDTHH:MM:SS` para marcas de tiempo (`TIMESTAMP`), que evita la ambigüedad entre el orden día/mes y mes/día y permite ordenar cronológicamente e inspeccionar intervalos. |

### 1.2 Lección 2: `c0-datos-02-null-vacio`
*Por qué NULL no es cero ni texto vacío*

| # | Tipo | Título de la fuente | Editorial / Autor | URL | Fecha (`accessed`) | Qué afirmación respalda en la lección |
|---|---|---|---|---|---|---|
| 1 | Primaria | PostgreSQL 17 Documentation — Section 4.2: Value Expressions and Section 9.2: Comparison Functions and Operators (`IS NULL`, `COALESCE`, `NULLIF`) | PostgreSQL Global Development Group | https://www.postgresql.org/docs/current/functions-comparison.html | `2026-10-29` | Semántica de la lógica de tres valores (`TRUE`, `FALSE`, `UNKNOWN`): cualquier comparación con `=` o `<>` frente a `NULL` produce `UNKNOWN`, por lo que se requiere `IS NULL` o `IS NOT NULL`. |
| 2 | Primaria | DuckDB Documentation — Null Values and Aggregate Functions | DuckDB Foundation | https://duckdb.org/docs/sql/data_types/nulls.html | `2026-10-29` | Comportamiento de `NULL` en expresiones aritméticas (`10 + NULL = NULL`) y en funciones de agregación (`COUNT(*)` cuenta todas las filas, `COUNT(columna)` y `AVG(columna)` ignoran los valores `NULL`). |
| 3 | Primaria | E. F. Codd — Extending the Database Relational Model to Capture More Meaning (ACM TODS, Vol. 4, No. 4) | Association for Computing Machinery (ACM) | https://dl.acm.org/doi/10.1145/320107.320109 | `2026-10-29` | Fundamento formal del marcador de información ausente o desconocida en el modelo relacional y las tablas de verdad para la lógica trivalente. |

### 1.3 Lección 3: `c0-datos-03-formatos-archivo`
*Archivos de datos: CSV, JSON, Excel y Parquet frente a frente*

| # | Tipo | Título de la fuente | Editorial / Autor | URL | Fecha (`accessed`) | Qué afirmación respalda en la lección |
|---|---|---|---|---|---|---|
| 1 | Primaria | RFC 4180 — Common Format and MIME Type for Comma-Separated Values (CSV) Files | IETF (Y. Shafranovich) | https://datatracker.ietf.org/doc/html/rfc4180 | `2026-10-29` | Estructura de texto plano separado por delimitadores de un archivo CSV: carece de esquema tipado adjunto, todo se transmite como texto y requiere escapar comillas y saltos de línea. |
| 2 | Primaria | RFC 8259 — The JavaScript Object Notation (JSON) Data Interchange Format | IETF (T. Bray) | https://datatracker.ietf.org/doc/html/rfc8259 | `2026-10-29` | Especificación de JSON como formato jerárquico de pares clave-valor y arreglos anidados, adecuado para eventos web y APIs pero redundante al repetir los nombres de clave en cada registro. |
| 3 | Primaria | Apache Parquet Official Documentation — File Format Overview | Apache Software Foundation | https://parquet.apache.org/docs/file-format/ | `2026-10-29` | Organización columnar binaria de Apache Parquet con esquema tipado y estadísticas en el pie del archivo (*footer*), que permite comprimir por columna y leer solo las columnas solicitadas en una consulta. |
| 4 | Primaria | DuckDB Documentation — Importing Data (CSV, JSON, Parquet, Excel) | DuckDB Foundation | https://duckdb.org/docs/data/overview.html | `2026-10-29` | Consulta directa de archivos Parquet, CSV y JSON desde SQL y extracción de atributos de cadenas JSON mediante operadores y funciones nativas. |

### 1.4 Lección 4: `c0-datos-04-utf8-separadores`
*Codificación UTF-8, separadores decimales y caracteres rotos*

| # | Tipo | Título de la fuente | Editorial / Autor | URL | Fecha (`accessed`) | Qué afirmación respalda en la lección |
|---|---|---|---|---|---|---|
| 1 | Primaria | RFC 3629 — UTF-8, a transformation format of ISO 10646 | IETF (F. Yergeau) | https://datatracker.ietf.org/doc/html/rfc3629 | `2026-10-29` | Codificación de longitud variable UTF-8 (1 a 4 bytes por carácter): los caracteres ASCII básicos ocupan 1 byte y las vocales acentuadas o la letra `ñ` ocupan 2 bytes (`0xC3 0xB1` para `ñ`, `0xC3 0xA9` para `é`). |
| 2 | Primaria | The Unicode Standard, Core Specification — Chapter 2: General Structure (UTF-8 and Byte Order Mark) | Unicode Consortium | https://www.unicode.org/versions/latest/ | `2026-10-29` | Causa del texto corrupto (*mojibake* como `Ã±` o `MÃ©xico`) cuando una secuencia de 2 bytes en UTF-8 se interpreta erróneamente bajo una tabla de 1 byte por carácter como Latin-1 (ISO-8859-1) o Windows-1252. |
| 3 | Primaria | DuckDB Documentation — Text Functions (`LENGTH`, `STRLEN`) and CSV Reader Parameters (`encoding`, `delim`, `decimal_separator`) | DuckDB Foundation | https://duckdb.org/docs/sql/functions/char.html | `2026-10-29` | Diferencia entre contar caracteres Unicode con `LENGTH(texto)` y contar bytes físicos en UTF-8 con `STRLEN(texto)`, así como configuración explícita de delimitador de columnas y separador decimal al ingerir archivos. |

### 1.5 Lección 5: `c0-datos-05-tablas-grano`
*Tablas: filas, columnas, claves y qué significa el grano*

| # | Tipo | Título de la fuente | Editorial / Autor | URL | Fecha (`accessed`) | Qué afirmación respalda en la lección |
|---|---|---|---|---|---|---|
| 1 | Primaria | Kimball Group — Dimensional Modeling Techniques: Declare the Grain | Kimball Group (Ralph Kimball & Margy Ross) | https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/grain/ | `2026-10-29` | Definición del **grano** (*grain*) como la declaración exacta de qué representa una fila física de una tabla, y por qué mezclar granos distintos invalida cualquier suma o conteo. |
| 2 | Primaria | PostgreSQL 17 Documentation — Section 5.4: Constraints (Primary Keys and Foreign Keys) | PostgreSQL Global Development Group | https://www.postgresql.org/docs/current/ddl-constraints.html | `2026-10-29` | Definición de **clave primaria** (columna o combinación de columnas única y no nula que identifica cada fila) y **clave foránea** (columna que referencia la clave primaria de otra tabla). |
| 3 | Primaria | DuckDB Documentation — Aggregates (`COUNT`, `COUNT(DISTINCT)`) and `GROUP BY` | DuckDB Foundation | https://duckdb.org/docs/sql/aggregates.html | `2026-10-29` | Verificación empírica del grano de una tabla comparando el total de filas `COUNT(*)` frente al total de valores únicos `COUNT(DISTINCT columna_clave)`. |

---

## 2. Mapa de conceptos y progresión pedagógica (Paso 2)

El módulo `c0-datos` recibe a una persona en el **Nivel 0 (desde cero absoluto)**: no asume experiencia previa con bases de datos ni programación. Cada lección introduce un bloque conceptual y se apoya únicamente en lo explicado en las lecciones anteriores:

| Orden | ID de lección | Qué asume al empezar | Conceptos nuevos que introduce | Cómo prepara para la siguiente lección |
| :---: | --- | --- | --- | --- |
| **1** | `c0-datos-01-tipos-dato` | Cero absoluto. Solo lectura de números y fechas cotidianas. | Dato crudo frente a valor con **tipo de dato**; los 5 tipos básicos (`INTEGER`, `DECIMAL`/`NUMERIC` frente a `DOUBLE`, `VARCHAR`, `DATE`/`TIMESTAMP` en ISO 8601 y `BOOLEAN`); coerción errónea (ordenar `"100"` antes que `"20"`); precio negativo de prueba en Mercado Brisa (`SKU-TEST-NEG`). | Al saber que cada columna tiene un dominio y un tipo esperado, surge la pregunta: ¿cómo se representa cuando un valor todavía no existe o se desconoce? |
| **2** | `c0-datos-02-null-vacio` | Los 5 tipos de dato básicos (`c0-datos-01-tipos-dato`). | Marcador **`NULL`** frente al número `0` y al texto vacío `''`; por qué `0` altera un promedio (`AVG`) mientras `NULL` se excluye; **lógica de tres valores** (`TRUE`, `FALSE`, `UNKNOWN`); por qué `= NULL` nunca devuelve filas y cómo usar `IS NULL`, `IS NOT NULL` y `COALESCE`. | Una vez claros los tipos y los nulos en abstracto, la persona necesita ver dónde viven físicamente esos datos cuando se guardan o intercambian en archivos. |
| **3** | `c0-datos-03-formatos-archivo` | Tipos de dato (`01`) y valores `NULL` (`02`). | Diferencia entre formato en texto y binario; **CSV** (por filas, sin tipos adjuntos), **JSON** (jerárquico con claves repetidas, ej. `events.payload_json`), hojas de cálculo **Excel** (límites de filas y conversión silenciosa de tipos) y **Apache Parquet** (almacenamiento columnar comprimido con esquema adjunto). | Como CSV y JSON son archivos de texto plano, abrirlos en distintos sistemas operativos o países expone dos fallos cotidianos: caracteres rotos (`Ã±`) y confusión entre coma y punto decimal. |
| **4** | `c0-datos-04-utf8-separadores` | Tipos (`01`), nulos (`02`) y archivos de texto CSV/JSON (`03`). | **Codificación de caracteres** y estándar **UTF-8** (1 byte para ASCII, 2 bytes para tildes y `ñ`); diferencia entre caracteres (`LENGTH`) y bytes (`STRLEN`); origen del **mojibake** (`Ciudad de MÃ©xico` al leer UTF-8 como Latin-1/Windows-1252); colisión entre coma decimal (`1.250,50`) y coma separadora de columnas en CSV; sufijos de huso horario en marcas de tiempo crudas (`event_ts_raw`). | Cuando un archivo se carga sin errores de tipos, nulos ni codificación, obtenemos una tabla limpia; ahora falta entender su estructura lógica y qué significa exactamente cada fila. |
| **5** | `c0-datos-05-tablas-grano` | Tipos (`01`), nulos (`02`), formatos (`03`) y codificación (`04`). | Anatomía de una **tabla** (filas como registros, columnas como atributos tipados); **clave primaria** (simple y compuesta) y **clave foránea**; definición del **grano** (*grain*: "¿qué representa exactamente una fila?"); contraste real en Mercado Brisa entre `orders` (18 000 filas = 18 000 pedidos), `order_items` (42 000 filas = 42 000 líneas de pedido) y `payments` (19 200 filas = intentos de cobro con reintentos y duplicados). | Deja a la persona lista para resumir tablas en hojas de cálculo (`c0-hojas`), calcular estadísticos descriptivos (`c0-numeros`), escribir consultas en `c1-sql-base` y evitar el *fan-out* en `c1-sql-joins`. |

> **Verificación de dependencias:** Ninguna lección de `c0-datos` asume conceptos no explicados previamente. Las consultas SQL incluidas en los ejemplos y prácticas de nivel 0 usan un subconjunto mínimo e intuitivo (`SELECT`, `FROM`, `WHERE`, `GROUP BY`, `COUNT`, `MIN`, `MAX`, `ROUND`), explicado línea por línea dentro de cada sección y en las pistas guiadas.

---

## 3. Especificación y rúbrica del proyecto del módulo `c0-datos` (Paso 6)

### 3.1 Registro actual en `src/data/catalog/modules.js`
- **`prompt`:** `'Inspeccionar tres archivos de entrada y definir el grano, el tipo de dato y los nulos de cada columna.'`
- **`dataset`:** `'Mercado Brisa (`customers.csv`, `products.json`, `orders.parquet`)'`
- **`deliverable`:** `'Diccionario de datos en Markdown con 15 columnas documentadas y 3 anomalías de formato detectadas.'`

### 3.2 Alcance detallado del entregable
El alumno inspecciona las tablas `customers`, `products` y `orders` de **Mercado Brisa** (empresa ficticia) en el laboratorio SQL de Grano y redacta un diccionario de datos en Markdown que documenta:
1. **Declaración de grano y clave primaria de cada tabla:**
   - `customers`: 1 fila = 1 cliente actual (2 400 filas, clave primaria `customer_id`).
   - `products`: 1 fila = 1 producto del catálogo o SKU (180 filas, clave primaria `product_id`).
   - `orders`: 1 fila = 1 pedido realizado por un cliente (18 000 filas, clave primaria `order_id`, claves foráneas `customer_id` y `store_id`).
2. **Diccionario de 15 columnas seleccionadas (5 por tabla):** nombre de la columna, tipo de dato SQL recomendado (`INTEGER`, `DECIMAL(10,2)`, `VARCHAR`, `DATE`, `TIMESTAMP`, `BOOLEAN`), si admite `NULL` y qué significa funcionalmente ese `NULL`.
3. **Informe de 3 anomalías detectadas con consultas de verificación:**
   - **Anomalía 1 (`products`):** el producto `product_id = 180` (`sku = 'SKU-TEST-NEG'`) tiene un precio de lista negativo (`list_price_usd = -9.99`) y `is_active = false`.
   - **Anomalía 2 (`customers`):** existen `218` filas con `postal_code IS NULL` (~9,1 % del padrón) y `129` filas con un código postal truncado de 2 caracteres (`LENGTH(postal_code) = 2`).
   - **Anomalía 3 (`orders`):** existen `6 000` pedidos orgánicos con `campaign_id IS NULL` que no deben confundirse con un error de carga ni reemplazarse por `'0'`, sino tratarse con `COALESCE(campaign_id, 'SIN_CAMPANA')` al reportar por campaña.

### 3.3 Rúbrica verificable del proyecto (4 criterios, escala 0–4)

| Criterio | 0–1 (Insuficiente) | 2 (Básico) | 3 (Sólido — Nivel esperado) | 4 (Excelente) |
|---|---|---|---|---|
| **1. Declaración del grano y claves** | No indica qué representa una fila o confunde la tabla de pedidos (`orders`) con las líneas de producto (`order_items`). | Declara qué representa cada tabla con frases generales, sin indicar la clave primaria ni comprobar el conteo de filas. | Declara con exactitud el grano de `customers`, `products` y `orders`, identifica su clave primaria (`customer_id`, `product_id`, `order_id`) y aporta el conteo `COUNT(*)` frente a `COUNT(DISTINCT pk)`. | Además de verificar el grano y las claves primarias de las tres tablas, identifica las claves foráneas (`customer_id` y `store_id` en `orders`) y explica por qué `orders` (18 000 filas) no tiene el mismo grano que `order_items` (42 000 filas). |
| **2. Selección de tipos de dato** | Asigna `VARCHAR` a fechas o importes, o no distingue entre enteros, decimales y booleanos. | Asigna tipos generales ("número", "texto", "fecha") a las 15 columnas sin precisar la diferencia entre coma flotante y decimal exacto. | Documenta las 15 columnas asignando `INTEGER` a identificadores, `DECIMAL(10,2)` a importes monetarios, `DATE` / `TIMESTAMP` en ISO 8601 a fechas y `BOOLEAN` a indicadores lógicos (`is_active`). | Justifica por qué las columnas monetarias (`list_price_usd`, `total_usd`, `discount_usd`) deben operarse como `DECIMAL(10,2)` en lugar de coma flotante binaria (`DOUBLE`) e incluye expresiones `CAST` verificadas. |
| **3. Auditoría de valores `NULL`** | Ignora los nulos o afirma que `postal_code = NULL` o `campaign_id = ''` sirve para contarlos. | Menciona que existen valores vacíos en `customers` y `orders`, pero sin cuantificarlos con `COUNT(*) - COUNT(columna)`. | Cuantifica con exactitud los `218` nulos de `customers.postal_code` y los `6 000` nulos de `orders.campaign_id` usando `IS NULL` o `COUNT(*) - COUNT(col)`, explicando la diferencia entre `NULL`, `0` y `''`. | Distingue entre un `NULL` por dato faltante de captura (`postal_code IS NULL`) y un `NULL` estructural de negocio (`campaign_id IS NULL` en compras orgánicas), proponiendo la regla `COALESCE` adecuada para cada caso. |
| **4. Detección de anomalías de formato y dominio** | Detecta menos de 2 anomalías o inventa problemas que no existen en los datos de Mercado Brisa. | Describe 2 o 3 anomalías de forma cualitativa sin adjuntar la consulta ni el número exacto de filas afectadas. | Documenta las 3 anomalías reales (el SKU de prueba `SKU-TEST-NEG` con precio `-9.99`, los códigos postales nulos/truncados en `customers` y la codificación/estructura de los archivos) con sus cifras exactas. | Incluye para cada una de las 3 anomalías la consulta SQL reproducible en DuckDB, el resultado exacto devuelto y la regla defensiva (`WHERE is_active = true AND list_price_usd > 0`, validación de longitud y lectura UTF-8) que evita contaminar reportes posteriores. |
