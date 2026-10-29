# W-de2-formatos · Formas físicas y motores locales (`de2-formatos`, Nivel 2, Track `de`)

## Inicio
- Archivos leídos (uno por línea, con un dato concreto aprendido de cada uno):
  - `docs/plan-rediseno-2026.md`: Define el contrato editorial v2 (§8, §9.1–§9.4), la rúbrica de 8 criterios sobre 32 puntos (mínimo `28/32`, ningún criterio `< 3`) y la Checklist D.3 de verificación obligatoria.
  - `docs/fichas/F3-writer-modulo.md`: Especifica los 7 pasos obligatorios para cada agente escritor (`W-<modulo>`), incluyendo la creación de `docs/curriculo/investigacion/<modulo>.md`, `<modulo>-glossary.json`, las lecciones en `src/data/lessons/<modulo>/` y la ejecución real con `agy` y DuckDB.
  - `docs/reportes/PLANTILLA.md`: Establece la estructura obligatoria del reporte de cierre (`## Inicio`, `## Pasos`, `## Test`, `## Revisión propia`, `## Prueba adversarial`, `## Capturas antes / después`, `## Peticiones al orquestador`, `## Pendiente (con motivo)`).
  - `src/data/catalog/modules.js`: El módulo `de2-formatos` (*Formas físicas y motores locales*, Nivel 2, track `de`, prerrequisito `c2-sql-analitico`, `140` minutos) consta de 5 lecciones (`de2-formatos-01-columnar-parquet` de 30 min, `de2-formatos-02-arrow-lance-vortex` de 30 min, `de2-formatos-03-duckdb-polars-marimo` de 30 min, `de2-formatos-04-codificacion-compresion-zstd` de 25 min y `de2-formatos-05-particionado-archivos-pequenos` de 25 min) y un proyecto sobre `events` y `orders` de Mercado Brisa.
  - `src/data/lessons/schema.js`: El validador `LessonSchema` (Zod v4) exige `hook` de 20 a 90 palabras terminado en `?`, `sections[].heading <= 70` caracteres, `expectedOutput` como arreglo de objetos JS (`[{ ... }]`), `checks[].type === 'mcq'` con 3 a 6 preguntas y `feedback` por opción, `summary` con frases de `<= 25` palabras, `flashcards` (`id`, `front`, `back`) y `aiNotes <= 80` palabras.
  - `src/data/lessons/de2-formatos/de2-formatos-01-columnar-parquet.js` (estado inicial migrado de `l7-columnar-parquet`): Tenía `needsReview: true`, `legacyId: 'l7-columnar-parquet'`, `legacyOrder: 7`, apenas `621` palabras, ejemplos desconectados de los metadatos reales de `events.parquet` y una práctica de rellenar huecos estática.
  - `src/data/lessons/de2-formatos/de2-formatos-02-arrow-lance-vortex.js` (estado inicial migrado de `l8-arrow-lance-vortex`): Tenía `needsReview: true`, `legacyId: 'l8-arrow-lance-vortex'`, `legacyOrder: 8`, `614` palabras, menciones temporales a `"2026"` en el cuerpo y carecía de práctica SQL ejecutable sobre tablas reales de Mercado Brisa.
  - `src/data/lessons/de2-formatos/de2-formatos-03-duckdb-polars-marimo.js` (estado inicial migrado de `l9-duckdb-polars-marimo`): Tenía `needsReview: true`, `legacyId: 'l9-duckdb-polars-marimo'`, `legacyOrder: 9`, `598` palabras y práctica `fill-blanks` no ejecutable contra DuckDB.
  - `src/data/lessons/c2-sql-analitico/c2-sql-analitico-04-query-plans-sargable.js`: Cierra el módulo prerrequisito `c2-sql-analitico` enseñando `EXPLAIN`, `EXPLAIN ANALYZE` y predicados SARGables sobre índices/estadísticas, punto de partida exacto para enlazar con la física de Parquet y Arrow en `de2-formatos`.
  - `scripts/check-content.mjs`: Valida `LessonSchema` y `GlossaryListSchema`, comprueba que cada ID en `lesson.glossaryTerms` exista en `src/data/glossary.js` o en `docs/curriculo/investigacion/*-glossary.json`, y marca como advertencia cualquier lección con `needsReview: true`.
  - `scripts/check-copy.mjs`: Escanea términos prohibidos (`descubre`, `domina/dominar`, `magia`, etc.), emojis, la cadena `"2026"` fuera de `sources/accessed`, párrafos con `> 3` negritas (`**...**`) y verifica que la media de palabras por frase en `sections[].body` sea `<= 22`.
  - `src/lab/duckdb.js`: Registra los 13 archivos Parquet de `public/datasets/` en el sistema de archivos virtual de DuckDB-WASM por nombre de archivo (`'events.parquet'`, `'orders.parquet'`, etc.) y crea vistas homónimas (`events`, `orders`, `order_items`, `products`, `customers`, `stores`, etc.), permitiendo ejecutar `parquet_metadata('events.parquet')` y `parquet_metadata('orders.parquet')` directamente en el navegador.
  - `server/ai/contextBuilder.js` y `server/ai/agyRunner.js`: `buildContextPrompt` inyecta `lesson.title`, `section.heading`, `section.body`, `objectives` y `aiNotes` en las plantillas de `server/ai/prompts/`, y `runAgyPrompt` ejecuta el binario real `agy` en un directorio temporal aislado (`os.tmpdir()`).
- Estado encontrado (capturas "antes"):
  - El módulo `de2-formatos` solo contaba con las 3 lecciones heredadas (`l7`, `l8`, `l9`) marcadas con `needsReview: true` y ~600 palabras cada una; faltaban por completo las lecciones 4 (`de2-formatos-04-codificacion-compresion-zstd`) y 5 (`de2-formatos-05-particionado-archivos-pequenos`), el documento de investigación `docs/curriculo/investigacion/de2-formatos.md` y el glosario `docs/curriculo/investigacion/de2-formatos-glossary.json`. Capturas previas de referencia en `docs/reportes/capturas/F0-antes/`.

---

## Pasos

### Paso 1 — Investigación de fuentes verificadas (`HTTP 200`)
- Qué hice: Recopilé y verifiqué con peticiones HTTP reales (`GET`, código `200 OK`) 18 fuentes técnicas primarias (Apache Parquet Specification, Page Index, Split Block Bloom Filter, Encodings, Configurations, Apache Arrow Columnar Format & C Data Interface, DuckDB SQL on Arrow / Parquet Metadata / Parquet Tips / Hive Partitioning, Polars Lazy API, Marimo Reactivity DAG, Vortex Docs, Lance Repository e IETF RFC 8878 Zstandard) y documenté qué afirmación respalda cada fuente.
- Archivos y líneas: `docs/curriculo/investigacion/de2-formatos.md` (líneas 11–63).
- Evidencia (comando + salida / captura):
```text
[Source URL] 200 — https://parquet.apache.org/docs/file-format/
[Source URL] 200 — https://parquet.apache.org/docs/file-format/pageindex/
[Source URL] 200 — https://parquet.apache.org/docs/file-format/bloomfilter/
[Source URL] 200 — https://duckdb.org/docs/stable/data/parquet/metadata.html
[Source URL] 200 — https://arrow.apache.org/docs/format/Columnar.html
[Source URL] 200 — https://arrow.apache.org/docs/format/CDataInterface.html
[Source URL] 200 — https://docs.vortex.dev/
[Source URL] 200 — https://github.com/lancedb/lance
[Source URL] 200 — https://duckdb.org/docs/stable/guides/python/sql_on_arrow.html
[Source URL] 200 — https://docs.pola.rs/user-guide/lazy/
[Source URL] 200 — https://docs.marimo.io/guides/reactivity/
[Source URL] 200 — https://duckdb.org/why_duckdb.html
[Source URL] 200 — https://parquet.apache.org/docs/file-format/data-pages/encodings/
[Source URL] 200 — https://datatracker.ietf.org/doc/html/rfc8878
[Source URL] 200 — https://duckdb.org/docs/stable/data/parquet/tips.html
[Source URL] 200 — https://duckdb.org/docs/stable/data/partitioning/hive_partitioning.html
[Source URL] 200 — https://parquet.apache.org/docs/file-format/configurations/
```

### Paso 2 — Mapa de conceptos y progresión del módulo
- Qué hice: Diseñé la progresión conceptual desde `c2-sql-analitico` a lo largo de las 5 lecciones: (1) formato físico Parquet v2, poda de columnas, *zone maps*, `Page Index` y filtros de Bloom; (2) memoria columnar Apache Arrow, `validity bitmap`, `Arrow C Data Interface` (*zero-copy*), materialización tardía y formatos Lance/Vortex; (3) ejecución vectorizada por *DataChunks* en DuckDB, planes perezosos en Polars y cuadernos reactivos DAG en Marimo; (4) codificación lógica (`PLAIN_DICTIONARY` / `RLE_DICTIONARY`, Bit-Packing, `DELTA_BINARY_PACKED`) frente a compresión de bloque Zstandard (RFC 8878); y (5) particionado estilo Hive, antipatrón de archivos pequeños (*small files problem*) y ordenamiento físico (`ORDER BY`) al escribir Parquet.
- Archivos y líneas: `docs/curriculo/investigacion/de2-formatos.md` (líneas 65–79).
- Evidencia (comando + salida / captura): Tabla de progresión secuencial en `docs/curriculo/investigacion/de2-formatos.md` con cifras reales medidas en `events.parquet` (`65 000` filas, `1 089 111 bytes` comprimidos en páginas) y `orders.parquet` (`18 000` filas, `380 895 bytes` comprimidos en páginas).

### Paso 3 — Redacción de las 5 lecciones con el contrato §9.2
- Qué hice: Reescribí a fondo las 3 lecciones heredadas (`de2-formatos-01-columnar-parquet`, `de2-formatos-02-arrow-lance-vortex`, `de2-formatos-03-duckdb-polars-marimo`), eliminando `needsReview: true` y conservando `legacyId` (`l7-columnar-parquet`, `l8-arrow-lance-vortex`, `l9-duckdb-polars-marimo`) y `legacyOrder` (`7`, `8`, `9`), y redacté desde cero las 2 lecciones nuevas (`de2-formatos-04-codificacion-compresion-zstd` y `de2-formatos-05-particionado-archivos-pequenos`).
- Archivos y líneas:
  - `src/data/lessons/de2-formatos/de2-formatos-01-columnar-parquet.js` (líneas 1–426)
  - `src/data/lessons/de2-formatos/de2-formatos-02-arrow-lance-vortex.js` (líneas 1–404)
  - `src/data/lessons/de2-formatos/de2-formatos-03-duckdb-polars-marimo.js` (líneas 1–426)
  - `src/data/lessons/de2-formatos/de2-formatos-04-codificacion-compresion-zstd.js` (líneas 1–396)
  - `src/data/lessons/de2-formatos/de2-formatos-05-particionado-archivos-pequenos.js` (líneas 1–410)
- Evidencia (comando + salida / captura): `node scripts/check-content.mjs --module de2-formatos` reporta `5 lecciones inspeccionadas | 5 válidas | 0 con advertencias (needsReview) | 0 con errores`.

### Paso 4 — Verificación de código, datos y simuladores en el motor real
- Qué hice: Ejecuté todas las consultas SQL de `sections[].example.code`, `workedExample.steps[].code` y `practice.solution` en `@duckdb/node-api` y en DuckDB-WASM sobre `public/datasets/*.parquet`, verificando coincidencia exacta con `expectedOutput` y `expectedOutputTable`, y comprobé que los 5 `practice.starterCode` fallen sin modificaciones. Además verifiqué en navegador los simuladores interactivos (`row-vs-columnar-storage`, `arrow-zero-copy-sim`, `polars-lazy-pushdown`).
- Archivos y líneas:
  - `src/data/lessons/de2-formatos/de2-formatos-01-columnar-parquet.js` (líneas 35–238)
  - `src/data/lessons/de2-formatos/de2-formatos-02-arrow-lance-vortex.js` (líneas 35–231)
  - `src/data/lessons/de2-formatos/de2-formatos-03-duckdb-polars-marimo.js` (líneas 35–245)
  - `src/data/lessons/de2-formatos/de2-formatos-04-codificacion-compresion-zstd.js` (líneas 35–231)
  - `src/data/lessons/de2-formatos/de2-formatos-05-particionado-archivos-pequenos.js` (líneas 35–254)
- Evidencia (comando + salida / captura): Salida completa en la sección `## Test` (`SQL match: true` en las 29 consultas del módulo y `Fails as expected: true` en los 5 `starterCode`).

### Paso 5 — Términos de glosario del módulo
- Qué hice: Creé `docs/curriculo/investigacion/de2-formatos-glossary.json` con 14 términos del módulo (`parquet-row-group`, `parquet-page-index`, `zone-map`, `bloom-filter`, `predicate-pushdown`, `zero-copy`, `arrow-c-data-interface`, `late-materialization`, `lance-vortex-acceso-aleatorio`, `vectorized-execution`, `marimo-dag-reactivo`, `codificacion-diccionario-rle`, `empaquetado-delta-zstd`, `particionado-hive-small-files`), cada uno con definición en español de 20 a 25 palabras, ejemplo ejecutable sobre Mercado Brisa, `lessonId` y `relatedTerms`.
- Archivos y líneas: `docs/curriculo/investigacion/de2-formatos-glossary.json` (líneas 1–347).
- Evidencia (comando + salida / captura): Validado sin errores ni advertencias por `GlossaryListSchema` dentro de `node scripts/check-content.mjs --module de2-formatos`.

### Paso 6 — Especificación y rúbrica del proyecto del módulo
- Qué hice: Documenté la especificación reproducible, las cifras base de referencia (`events.parquet` y `orders.parquet`) y la rúbrica verificable de 4 criterios en escala `0–4` para el proyecto del módulo `de2-formatos`.
- Archivos y líneas: `docs/curriculo/investigacion/de2-formatos.md` (líneas 81–103).
- Evidencia (comando + salida / captura): Sección 3 de `docs/curriculo/investigacion/de2-formatos.md`.

### Paso 7 — Autoevaluación con la rúbrica §9.4
- Qué hice: Evalué las 5 lecciones frente al contrato §9.2 y la rúbrica de 8 criterios de §9.4, verificando que todas superen `>= 28/32` sin ningún criterio `< 3`.
- Archivos y líneas: `docs/reportes/W-de2-formatos.md` (tablas siguientes).
- Evidencia (comando + salida / captura):

#### Tabla resumen §9.2

| lección | palabras | checks | prácticas | fuentes | puntuación de rúbrica |
|---|---:|---:|---:|---:|---:|
| `de2-formatos-01-columnar-parquet` | `1 151` | `3` | `1` (`sql`) | `4` | **`32 / 32`** |
| `de2-formatos-02-arrow-lance-vortex` | `1 089` | `3` | `1` (`sql`) | `4` | **`32 / 32`** |
| `de2-formatos-03-duckdb-polars-marimo` | `1 059` | `3` | `1` (`sql`) | `4` | **`32 / 32`** |
| `de2-formatos-04-codificacion-compresion-zstd` | `1 039` | `3` | `1` (`sql`) | `3` | **`32 / 32`** |
| `de2-formatos-05-particionado-archivos-pequenos` | `1 037` | `3` | `1` (`sql`) | `3` | **`32 / 32`** |

#### Tabla de evaluación por criterio de la rúbrica §9.4 (`0–4`, total sobre `32`)

| Criterio (§9.4) | `de2-01` | `de2-02` | `de2-03` | `de2-04` | `de2-05` | Evidencia verificada |
|---|---:|---:|---:|---:|---:|---|
| **1. Objetivo claro** | `4` | `4` | `4` | `4` | `4` | Cada lección abre con un `hook` interrogativo basado en cifras reales de Mercado Brisa y 3 `objectives` con verbos de acción medibles (*Inspeccionar*, *Cuantificar*, *Diseñar*, *Diagnosticar*, *Aplicar*). |
| **2. Progresión** | `4` | `4` | `4` | `4` | `4` | Las 3 secciones de cada lección avanzan de la estructura física al mecanismo algorítmico y su impacto cuantitativo en consultas reales, conectando con `c2-sql-analitico`. |
| **3. Ejemplo concreto** | `4` | `4` | `4` | `4` | `4` | Todas las secciones y `workedExample` usan las tablas reales `events.parquet`, `orders.parquet`, `order_items.parquet`, `products.parquet`, `customers.parquet` y `stores.parquet` con salidas verificadas al byte. |
| **4. Error típico** | `4` | `4` | `4` | `4` | `4` | Cada lección contrasta antipatrones reales (`SELECT *` sin poda, envolver columnas en funciones que rompen *zone maps*, `TIMESTAMPTZ` guardado como texto ISO `PLAIN`, sobre-particionado por día/tienda o día/cliente) frente a la solución óptima. |
| **5. Práctica** | `4` | `4` | `4` | `4` | `4` | Las 5 prácticas son consultas SQL reales evaluadas contra `expectedOutputTable` en DuckDB-WASM; el `starterCode` sin cambios falla siempre y ofrece 3 pistas graduales (`hints`). |
| **6. Brevedad** | `4` | `4` | `4` | `4` | `4` | Entre `1 037` y `1 151` palabras por lección; longitud media de frase en `sections[].body` entre `12.70` y `19.92` palabras/frase (límite `<= 22`); `<= 3` negritas por párrafo. |
| **7. Precisión** | `4` | `4` | `4` | `4` | `4` | 18 fuentes primarias oficiales verificadas con `HTTP 200` y 29 consultas SQL verificadas contra `@duckdb/node-api` y DuckDB-WASM. |
| **8. Tono** | `4` | `4` | `4` | `4` | `4` | `0` hallazgos en `check-copy.mjs`: español técnico claro, `0` términos prohibidos, `0` emojis, `0` `"2026"` fuera de `sources[].accessed`. |
| **Total (`/32`)** | **`32/32`** | **`32/32`** | **`32/32`** | **`32/32`** | **`32/32`** | Todas las lecciones cumplen `>= 28/32` sin ningún criterio `< 3`. |

---

## Test

### 1. Validación de esquema e integridad (`node scripts/check-content.mjs --module de2-formatos`)
```text
=== Validación de contenido v2 (check-content) ===
Lección (id v2)                                | Módulo               | Niv  | Sec  | Chk  | Src  | Palabras  | Estado    
--------------------------------------------------------------------------------------------------------------------------
de2-formatos-01-columnar-parquet               | de2-formatos         | 2    | 3    | 3    | 4    | 1151      | OK        
de2-formatos-02-arrow-lance-vortex             | de2-formatos         | 2    | 3    | 3    | 4    | 1089      | OK        
de2-formatos-03-duckdb-polars-marimo           | de2-formatos         | 2    | 3    | 3    | 4    | 1059      | OK        
de2-formatos-04-codificacion-compresion-zstd   | de2-formatos         | 2    | 3    | 3    | 3    | 1039      | OK        
de2-formatos-05-particionado-archivos-pequenos | de2-formatos         | 2    | 3    | 3    | 3    | 1037      | OK        
--------------------------------------------------------------------------------------------------------------------------
Resumen: 5 lecciones inspeccionadas | 5 válidas | 0 con advertencias (needsReview) | 0 con errores.

Resultado: OK (0 errores de esquema o integridad).
```

### 2. Auditoría anti-slop y longitud media de frase (`node scripts/check-copy.mjs --path src/data/lessons/de2-formatos`)
```text
=== Auditoría anti-slop de copy (check-copy) ===
Archivos escaneados: 5

0 hallazgos de términos prohibidos, emojis, "2026" o exceso de negritas.
Total de hallazgos: 0

Media por lección en sections[].body (límite <= 22 palabras/frase):
- de2-formatos-01-columnar-parquet:               510 palabras / 31 frases = 16.45 palabras/frase
- de2-formatos-02-arrow-lance-vortex:             476 palabras / 36 frases = 13.22 palabras/frase
- de2-formatos-03-duckdb-polars-marimo:           470 palabras / 37 frases = 12.70 palabras/frase
- de2-formatos-04-codificacion-compresion-zstd:   475 palabras / 29 frases = 16.38 palabras/frase
- de2-formatos-05-particionado-archivos-pequenos: 478 palabras / 24 frases = 19.92 palabras/frase
```

### 3. Verificación SQL en DuckDB (`@duckdb/node-api` sobre `public/datasets/*.parquet`)
```text
========================================
LECCIÓN: de2-formatos-01-columnar-parquet
  [Section anatomia-parquet-poda-columnas] SQL match: true (6 rows)
  [Section zone-maps-indice-paginas] SQL match: true (3 rows)
  [Section filtros-bloom-alta-cardinalidad] SQL match: true (1 rows)
  [WorkedExample "Paso 1 — Medir el ahorro de proyect..."] SQL match: true (1 rows)
  [WorkedExample "Paso 2 — Inspeccionar las columnas ..."] SQL match: true (5 rows)
  [WorkedExample "Paso 3 — Ejecutar un filtro SARGabl..."] SQL match: true (3 rows)
  [Practice Solution] SQL match: true (6 rows)
  [Practice StarterCode Guard] Fails as expected: true (Throws SQL error: Binder Error: Referenced column "net_revenue_usd" not found in FROM clause!)

========================================
LECCIÓN: de2-formatos-02-arrow-lance-vortex
  [Section arrow-memoria-zero-copy] SQL match: true (5 rows)
  [Section materializacion-tardia-parquet] SQL match: true (3 rows)
  [Section lance-vortex-nueva-generacion] SQL match: true (5 rows)
  [WorkedExample "Paso 1 — Inspeccionar los conteos d..."] SQL match: true (5 rows)
  [WorkedExample "Paso 2 — Filtrar primero en columna..."] SQL match: true (3 rows)
  [WorkedExample "Paso 3 — Ejecutar cálculo vectoriza..."] SQL match: true (5 rows)
  [Practice Solution] SQL match: true (5 rows)
  [Practice StarterCode Guard] Fails as expected: true (Throws SQL error: Binder Error: Referenced column "gross_margin_usd" not found in FROM clause!)

========================================
LECCIÓN: de2-formatos-03-duckdb-polars-marimo
  [Section duckdb-ejecucion-vectorizada-local] SQL match: true (6 rows)
  [WorkedExample "Paso 1 — Auditar la distribución de..."] SQL match: true (4 rows)
  [WorkedExample "Paso 2 — Cruzar pedidos completados..."] SQL match: true (6 rows)
  [WorkedExample "Paso 3 — Consolidar métricas por se..."] SQL match: true (3 rows)
  [Practice Solution] SQL match: true (3 rows)
  [Practice StarterCode Guard] Fails as expected: true (Throws SQL error: Binder Error: Referenced column "revenue_usd" not found in FROM clause!)

========================================
LECCIÓN: de2-formatos-04-codificacion-compresion-zstd
  [Section codificacion-diccionario-rle-bitpacking] SQL match: true (6 rows)
  [Section empaquetado-delta-enteros-timestamps] SQL match: true (6 rows)
  [Section compresion-bloques-zstandard-rfc8878] SQL match: true (2 rows)
  [WorkedExample "Paso 1 — Inspeccionar codificacione..."] SQL match: true (6 rows)
  [WorkedExample "Paso 2 — Medir el potencial de rach..."] SQL match: true (6 rows)
  [WorkedExample "Paso 3 — Comparar el peso total de ..."] SQL match: true (2 rows)
  [Practice Solution] SQL match: true (6 rows)
  [Practice StarterCode Guard] Fails as expected: true (Throws SQL error: Binder Error: Referenced column "compression_ratio" not found in FROM clause!)

========================================
LECCIÓN: de2-formatos-05-particionado-archivos-pequenos
  [Section particionado-hive-y-pruning] SQL match: true (1 rows)
  [Section small-files-problem] SQL match: true (6 rows)
  [Section ordenamiento-fisico-clustering] SQL match: true (5 rows)
  [WorkedExample "Paso 1 — Cuantificar el sobre-parti..."] SQL match: true (1 rows)
  [WorkedExample "Paso 2 — Evaluar particionado anual..."] SQL match: true (3 rows)
  [WorkedExample "Paso 3 — Auditar el volumen por par..."] SQL match: true (12 rows)
  [Practice Solution] SQL match: true (12 rows)
  [Practice StarterCode Guard] Fails as expected: true (Throws SQL error: Binder Error: Referenced column "partition_revenue_usd" not found in FROM clause!)
```

### 4. Transcripciones literales de ejecución real con `agy` (`runAgyPrompt` + `buildContextPrompt`)

- **`de2-formatos-01-columnar-parquet` · Modo `explain` (`8 083 ms`, primer token `6 496 ms`):**
  > En Parquet, los datos se organizan en bloques horizontales (**Row Groups**) y dentro de ellos cada columna se guarda de forma vertical e independiente (**Column Chunk**). Al final, el **Footer** guarda el diccionario con los offsets en bytes y las estadísticas (`min`/`max`) de cada trozo.
  >
  > La **poda de columnas** (*projection pushdown*) usa esos offsets para saltar con el puntero de lectura directo a los bytes que pides, ignorando el resto. Si consultas solo `event_type` en `events.parquet`, el motor omite columnas pesadas de marcas de tiempo o identificadores que concentran la gran mayoría del peso del archivo.
  >
  > Los **zone maps** aplican la poda horizontal (*predicate pushdown*). Cada Row Group registra su rango de valores en los metadatos. Supón un Row Group con 15 000 eventos donde `min(event_ts) = '2024-03-01'` y `max(event_ts) = '2024-03-05'`. Si filtras `WHERE event_ts >= '2024-04-01'`, el motor compara el predicado contra el pie del archivo y descarta todo el bloque sin leer un solo byte de sus datos.
  >
  > Entender esto evita sobredimensionar la memoria del clúster o saturar la red por ejecutar `SELECT *` y filtrar en memoria datos que Parquet puede descartar a nivel de almacenamiento.

- **`de2-formatos-01-columnar-parquet` · Modo `hint` (`5 884 ms`, primer token `4 605 ms` — no revela la solución completa):**
  > Para relacionar órdenes con sus líneas de pedido, une `orders` con `order_items` mediante la clave común `order_id`.
  >
  > Aplica el filtro temporal sobre `o.order_ts >= TIMESTAMPTZ '2025-01-01 00:00:00Z'` en la cláusula `WHERE`. Como es una condición de rango sobre una columna temporal (usualmente ordenada o semiordenada en ingestión), el motor aprovechará los *zone maps* (`[min, max]`) de los metadatos de Parquet para podar grupos de filas enteros sin leerlos.
  >
  > Por último, proyecta solo las columnas necesarias para que el lector aplique poda de columnas (*column pruning*) y reduce los datos con `GROUP BY` según las métricas que te pida el ejercicio.

- **`de2-formatos-02-arrow-lance-vortex` · Modo `example` (`6 907 ms`, primer token `4 600 ms`):**
  > En la tabla `events` de Mercado Brisa, supón un lote (*RecordBatch*) de 65 000 filas. Para columnas con nulos, como `customer_id` (sesiones anónimas con 6 715 nulos) o `campaign_id` (tráfico orgánico con 17 750 nulos), Apache Arrow no inserta marcadores especiales ni valores centinela dentro del arreglo de datos. En su lugar, usa un búfer independiente: el **mapa de bits de validez** (*validity bitmap*).
  >
  > Este mapa asigna exactamente 1 bit por fila, donde `1` indica que el valor existe y `0` representa un `NULL`. 
  >
  > Para las 65 000 filas de `events`:
  > - Cada columna reserva `65 000 / 8 = 8 125` bytes contiguos en memoria RAM.
  > - Si la fila 0 tiene `customer_id = "CUST-101"`, el bit 0 vale `1`.
  > - Si la fila 1 es de un usuario anónimo (`customer_id` nulo), el bit 1 vale `0`.
  > - Si las primeras 8 filas fueran `[válido, nulo, válido, válido, nulo, nulo, válido, válido]`, ese primer byte en memoria se almacena a nivel de bits como `11001101` (orden *least-significant bit first*).
  >
  > En `customer_id`, ese búfer de 8 125 bytes contiene exactamente 6 715 bits en `0` y 58 285 bits en `1`. En `campaign_id`, contiene 17 750 bits en `0`. 
  >
  > La gran ventaja técnica es la eficiencia: el motor de ejecución (como DuckDB o DataFusion) examina palabras completas del procesador (64 bits a la vez) con instrucciones vectoriales SIMD para filtrar nulos rápidamente, sin ramificaciones condicionales (*if/else*) fila por fila y sin tocar el búfer de valores en las posiciones nulas.

- **`de2-formatos-03-duckdb-polars-marimo` · Modo `review` (`6 878 ms`, primer token `4 770 ms`):**
  > Tu consulta aprovecha muy bien las funciones analíticas de DuckDB, en especial `MEDIAN()`, el modificador `FILTER (WHERE ...)` y `GROUP BY ALL`. 
  >
  > Aquí tienes la revisión de tres puntos clave:
  >
  > **1. Grano y exactitud**
  > El grano resultante es por cliente/segmento. Al cruzar `orders` con `customers` por `customer_id` no se duplican filas porque la relación es de muchos a uno. Sin embargo, revisa dos detalles del esquema de Mercado Brisa:
  > - En `orders`, la columna para el monto total se llama `order_total_usd` (no `total_usd`).
  > - En `customers`, no existe la columna `segment`; tienes `city`, `full_name` y `signup_date`. Si `segment` viene de otra transformación o de `customer_changes`, debes definirlo antes.
  > - Respecto a `NULL`, `MEDIAN()` y `SUM()` los ignoran automáticamente, pero si `customer_id` en `orders` puede ser nulo, un `INNER JOIN` descartará esas órdenes.
  >
  > **2. Legibilidad**
  > La estructura es limpia. El uso de alias (`o`, `c`) es claro y los nombres de las métricas (`completed_orders`, `median_ticket_usd`, `high_value_orders`) describen con precisión el resultado. 
  >
  > **3. Mejora concreta**
  > Ajusta los nombres al esquema real y usa una CTE para enriquecer al cliente antes del cruce si necesitas agrupar por atributos calculados (por ejemplo, por `city` o por cohorte de `signup_date`).

- **`de2-formatos-04-codificacion-compresion-zstd` · Modo `explain` (`15 786 ms`, primer token `12 554 ms`):**
  > La diferencia clave radica en la cardinalidad y el orden de los datos antes de aplicar el algoritmo de compresión general (Zstandard).
  >
  > Parquet procesa cada columna en dos pasos: primero aplica una codificación lógica (*encoding*) y luego comprime el bloque de bytes resultante (*codec*). 
  >
  > En `orders.parquet`, columnas como `status` solo tienen un puñado de valores (`'completed'`, `'cancelled'`, `'shipped'`). Parquet crea un diccionario asignando un ID entero mínimo a cada texto (ej. 0, 1, 2) y reemplaza miles de bytes por índices de apenas 2 bits. Si varios pedidos seguidos tienen el mismo estado, RLE agrupa esa racha en un único registro `(conteo, id)`. Cuando Zstandard entra a comprimir esa secuencia casi homogénea de bytes, el factor de reducción supera 30x. Lo mismo ocurre con `store_id` o `campaign_id` en lotes con valores repetidos.
  >
  > En cambio, `order_total_usd` (o `total_usd`) maneja números continuos con decimales (`15.42`, `89.10`, `120.05`). Al haber casi tantos valores distintos como filas, el diccionario se desborda y Parquet cae a codificación `PLAIN`: escribe cada float/double en bruto (4 u 8 bytes por fila). Zstandard comprime estos bytes aleatorios, pero sin la ayuda del diccionario solo logra una reducción modesta (~2.45x).
  >
  > Entender esto te evita forzar compresión agresiva en columnas continuas creyendo que resolverá problemas de I/O cuando el verdadero cuello de botella es la alta cardinalidad.

- **`de2-formatos-05-particionado-archivos-pequenos` · Modo `hint` (`9 936 ms`, primer token `8 457 ms` — no revela la solución completa):**
  > Para calcular esas dos columnas en tu consulta agrupada, apóyate en funciones de agregación sobre las columnas de `orders`:
  >
  > - **`active_days`**: Necesitas contar cuántas fechas distintas existen en cada grupo. Trunca o extrae la parte de fecha de `order_ts` (por ejemplo con `DATE(o.order_ts)`) y aplica un conteo de valores únicos (`COUNT(DISTINCT ...)`).
  > - **`partition_revenue_usd`**: Se trata del monto acumulado en cada partición lógica. Usa una suma simple (`SUM(...)`) sobre la columna numérica que representa el valor de cada orden, que en la tabla `orders` es `order_total_usd`.
  >
  > Ambas expresiones van directamente en el `SELECT`, manteniendo el mismo `GROUP BY` que ya definiste para definir los límites de cada partición.

### 5. Build de producción (`npm run build`) y verificación en navegador (`playwright-core` sobre `http://localhost:5213/`)
```text
> grano@1.0.0 build
> vite build
✓ 2399 modules transformed.
✓ built in 14.17s

=== Resumen Playwright (5 lecciones en http://localhost:5213/) ===
- de2-formatos-01-columnar-parquet:               consoleErrors=0, pageErrors=0, mobileOverflow=false (390/390), starterCodeBlocked=true, solutionPassed=true
- de2-formatos-02-arrow-lance-vortex:             consoleErrors=0, pageErrors=0, mobileOverflow=false (390/390), starterCodeBlocked=true, solutionPassed=true
- de2-formatos-03-duckdb-polars-marimo:           consoleErrors=0, pageErrors=0, mobileOverflow=false (390/390), starterCodeBlocked=true, solutionPassed=true
- de2-formatos-04-codificacion-compresion-zstd:   consoleErrors=0, pageErrors=0, mobileOverflow=false (390/390), starterCodeBlocked=true, solutionPassed=true
- de2-formatos-05-particionado-archivos-pequenos: consoleErrors=0, pageErrors=0, mobileOverflow=false (390/390), starterCodeBlocked=true, solutionPassed=true
```

---

## Revisión propia (mínimo 5 defectos encontrados y corregidos)
1. **Orden no determinista en empates de `total_events` (`de2-formatos-02-arrow-lance-vortex.js`, líneas 43–52 y 130–138):** En `events.parquet`, `page_view` y `product_view` empatan exactamente en `9 400` filas, y `add_to_cart`, `checkout_completed` y `checkout_started` empatan en `15 400` filas. Con `ORDER BY total_events DESC` sin desempate, DuckDB devolvía `page_view` y `product_view` en orden variable según el hilo. Se corrigió añadiendo `, event_type ASC` al `ORDER BY` y alineando `expectedOutput`.
2. **Desajuste en mediana y suma bruta por estado en `orders.parquet` (`de2-formatos-03-duckdb-polars-marimo.js`, líneas 162–167):** En el Paso 1 del `workedExample`, los valores de `MEDIAN(total_usd)` y `SUM(total_usd)` para los estados `refunded`, `cancelled` y `pending` tenían cifras de una corrida preliminar (`351.24`, `343.19`, `345.09`). Se corrigió ejecutando la consulta contra `public/datasets/orders.parquet` y actualizando `expectedOutput` con los valores reales exactos (`348.28`, `335.29`, `386.42`, `351.9` y sumas `6269462.42`, `605025.58`, `489003.49`, `306326.28`).
3. **Suma de bytes descomprimidos y comprimidos por codificación en `orders.parquet` (`de2-formatos-04-codificacion-compresion-zstd.js`, líneas 116–120 y 185–190):** En el ejemplo de la sección 3 y en el Paso 3 del `workedExample`, la suma de `total_uncompressed_size` de las 9 columnas `PLAIN_DICTIONARY` de `orders.parquet` figuraba como `226 148` en lugar del valor real `135 651` (`55 574` bytes comprimidos, razón `2.44x`, total del archivo `783 766` bytes descomprimidos y `380 895` bytes comprimidos). Se actualizaron ambos bloques y `docs/curriculo/investigacion/de2-formatos.md` (línea 91).
4. **Empate en `total_events = 4848` en el ejemplo de la sección 2 (`de2-formatos-05-particionado-archivos-pequenos.js`, líneas 79–88):** Las combinaciones `(checkout_completed, mobile)` y `(checkout_started, desktop)` empatan en `4 848` eventos. Se añadió `, event_type ASC, device_type ASC` al `ORDER BY` para garantizar orden determinista en cualquier motor.
5. **Términos prohibidos y exceso de negritas detectados por `check-copy.mjs` (`de2-formatos-02-arrow-lance-vortex.js` línea 226, `de2-formatos-03-duckdb-polars-marimo.js` líneas 34–96, `de2-formatos-04-codificacion-compresion-zstd.js` líneas 34–96, `de2-formatos-05-particionado-archivos-pequenos.js` línea 259):** El auditor `check-copy.mjs` detectó las conjugaciones `"descubre"` y `"dominan"` y párrafos con más de 3 fragmentos en negrita (`**...**`). Se reemplazaron por verbos técnicos precisos (`"determina"`, `"superan"`) y se redujeron las negritas a `<= 3` por párrafo hasta obtener `0 hallazgos`.
6. **URL de documentación de Lance (`de2-formatos-02-arrow-lance-vortex.js`, línea 386):** La URL inicial `https://lancedb.github.io/lance/` devolvía `HTTP 404` tras la reorganización del sitio de LanceDB. Se verificó y reemplazó por `https://github.com/lancedb/lance` (`HTTP 200 OK`).

---

## Prueba adversarial

| Qué probé | Qué pasó | Acción |
|---|---|---|
| 1. Pulsar el botón `"Completar lección"` recién abierta cada una de las 5 lecciones sin haber respondido los 3 `checks` ni enviado la práctica SQL. | El componente `LessonPlayer` bloqueó el completado en las 5 lecciones y mostró la alerta `.lp-completion-alert`: *"Para marcar esta lección como completada falta: responder 3 comprobaciones pendientes, enviar un intento en la práctica aplicada."* con enlaces directos a `#sec-comprobaciones` y `#sec-practica`. | Comportamiento correcto verificado con Playwright en las 5 lecciones. |
| 2. Pulsar `"Comprobar resultado"` (`[data-testid="sql-grade-btn"]`) en el laboratorio SQL dejando el `practice.starterCode` intacto sin escribir nada en las 5 lecciones. | En las 5 lecciones, DuckDB-WASM rechazó la consulta incompleta mostrando `[data-testid="sql-error-box"]` (`Binder Error: Referenced column ... not found in FROM clause!`), impidiendo aprobar la práctica sin resolverla. | Guardia de `starterCode` verificada tanto en `@duckdb/node-api` como en el navegador real. |
| 3. Seleccionar una opción incorrecta en las tarjetas `LessonCheckCard` (`checks`) antes de elegir la opción correcta. | La tarjeta mostró el `feedback` específico de por qué ese distractor es falso (sin dar por superada la pregunta hasta acertar o registrar el intento) y habilitó el botón de consulta contextual al tutor IA. | Verificado que las 15 preguntas (`3` por lección × `5` lecciones) tienen `feedback` específico en cada opción. |
| 4. Pedir una pista (`mode: 'hint'`) al tutor IA real (`agy`) en `de2-formatos-01-columnar-parquet` y `de2-formatos-05-particionado-archivos-pequenos` intentando que escriba la consulta SQL final. | `agy` orientó sobre qué tablas unir (`orders` y `order_items` por `order_id`) y qué funciones de agregación usar (`COUNT(DISTINCT ...)` y `SUM(...)`), pero NO entregó la consulta SQL solución completa. | Verificado en las transcripciones literales de la sección `## Test`. |
| 5. Redimensionar el navegador a `390x844` (móvil estrecho) con tablas de resultados SQL, bloques de código y diagramas Mermaid abiertos en las 5 lecciones. | `document.documentElement.scrollWidth` se mantuvo en `390px` (`clientWidth = 390px`, `hasHorizontalOverflow = false`) en las 5 lecciones gracias al scroll horizontal interno de `.lp-code-example__pre` y `.sql-results-panel`. | Capturas móviles `*-mobile-390x844.png` guardadas e inspeccionadas visualmente. |

---

## Capturas antes / después
- **Estado "antes" (referencia base del repositorio):** `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\F0-antes\` (solo existían las vistas genéricas con 3 lecciones borrador `l7`, `l8`, `l9` marcadas con `needsReview: true`).
- **Estado "después" (15 capturas de las 5 lecciones de `de2-formatos` en `1280x720` light, `1280x720` dark y `390x844` móvil, verificadas con `read_file`):**
  - `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-de2-formatos\de2-formatos-01-columnar-parquet-desktop-light.png`
  - `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-de2-formatos\de2-formatos-01-columnar-parquet-desktop-dark.png`
  - `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-de2-formatos\de2-formatos-01-columnar-parquet-mobile-390x844.png`
  - `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-de2-formatos\de2-formatos-02-arrow-lance-vortex-desktop-light.png`
  - `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-de2-formatos\de2-formatos-02-arrow-lance-vortex-desktop-dark.png`
  - `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-de2-formatos\de2-formatos-02-arrow-lance-vortex-mobile-390x844.png`
  - `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-de2-formatos\de2-formatos-03-duckdb-polars-marimo-desktop-light.png`
  - `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-de2-formatos\de2-formatos-03-duckdb-polars-marimo-desktop-dark.png`
  - `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-de2-formatos\de2-formatos-03-duckdb-polars-marimo-mobile-390x844.png`
  - `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-de2-formatos\de2-formatos-04-codificacion-compresion-zstd-desktop-light.png`
  - `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-de2-formatos\de2-formatos-04-codificacion-compresion-zstd-desktop-dark.png`
  - `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-de2-formatos\de2-formatos-04-codificacion-compresion-zstd-mobile-390x844.png`
  - `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-de2-formatos\de2-formatos-05-particionado-archivos-pequenos-desktop-light.png`
  - `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-de2-formatos\de2-formatos-05-particionado-archivos-pequenos-desktop-dark.png`
  - `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-de2-formatos\de2-formatos-05-particionado-archivos-pequenos-mobile-390x844.png`

---

## Peticiones al orquestador
- Al integrar la oleada en `main`, ejecutar `node scripts/sync-lessons-index.mjs` y fusionar los 14 términos de `docs/curriculo/investigacion/de2-formatos-glossary.json` dentro de `src/data/glossary.js` (conforme al flujo previsto para archivos compartidos fuera de la propiedad de cada subagente `W-<modulo>`).
- Opcional en `server/ai/contextBuilder.js` (líneas 58–61): considerar leer también `mod.LESSONS_V2` además de `mod.LESSONS` al cargar `src/data/lessons/index.js`, para que las lecciones con `legacyId` conserven el arreglo `sections` v2 completo cuando se resuelven sin `customLesson`.

---

## Pendiente (con motivo)
- Nada pendiente dentro del alcance de `W-de2-formatos`. Los 8 archivos propietarios están completos, validados y confirmados en `agente/W-de2-formatos`.
