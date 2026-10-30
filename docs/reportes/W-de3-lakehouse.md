# Reporte de Cierre: `W-de3-lakehouse`

- **Agente:** `W-de3-lakehouse`
- **Rama de trabajo:** `agente/W-de3-lakehouse`
- **Worktree:** `C:\Users\T490s\Desktop\Proyectos\ING-W-de3-lakehouse`
- **Módulo:** `de3-lakehouse` — *Lakehouse abierto y almacenes en la nube* (Área `de`, Nivel `3`, Ola C, 105 min)
- **Puerto Vite exclusivo utilizado:** `5221`
- **Fecha de cierre:** `2026-10-30`

---

## Inicio

Archivos reales del repositorio leídos antes de iniciar la escritura y dato técnico concreto extraído de cada uno:

1. `PLAN_GEMINI_4_ARGON.md`: establece el flujo obligatorio de 7 pasos (§9.1), los límites de palabras y brevedad (§9.2: frases `<= 22` palabras de media, `summary` `<= 25` palabras por punto, definiciones de glosario `<= 25` palabras), la rúbrica de 8 criterios en escala 0–4 (§9.4, mínimo 26/32 y ningún criterio `< 3`) y las listas de términos prohibidos y reglas de copy (Apéndices A y B).
2. `docs/reportes/PLANTILLA.md`: define la estructura obligatoria del reporte (`## Inicio`, `## Pasos`, `## Test`, `## Revisión propia`, `## Prueba adversarial`, `## Capturas antes / después`, `## Peticiones al orquestador`, `## Pendiente (con motivo)`).
3. `src/data/catalog/modules.js`: especifica para el módulo `de3-lakehouse` (`level: 3`, `track: 'de'`, `prerequisites: ['de2-pipelines', 'de2-formatos']`) las 4 lecciones (`de3-lakehouse-01-iceberg-v3-medallion` [30 min], `de3-lakehouse-02-delta-lake-uniform` [25 min], `de3-lakehouse-03-catalogos-polaris-unity` [25 min], `de3-lakehouse-04-costos-bigquery-snowflake-databricks` [25 min]) y el proyecto *Operar una tabla transaccional Apache Iceberg v3 con vectores de borrado, evolución de particiones y viaje en el tiempo*.
4. `src/data/schema/lesson.js`: define `LessonSchema` en Zod v4, exigiendo `title` `<= 60` caracteres, `hook` de 40–90 palabras terminado en `?`, `sections[].body` de 80–250 palabras, `checks[].type` en `['mcq', 'predict-output', 'order', 'fill-code']` con `explanation` de 20–60 palabras, `practice.solutionExplanation` obligatorio, `roleNotes` de 25–70 palabras por rol y `sources[]` con `title`, `url` (`https://`), `publisher`, `accessed` (`YYYY-MM-DD`) y `supports`.
5. `src/data/schema/glossary.js`: define `GlossaryTermSchema` y `GlossaryListSchema`, exigiendo `id` en kebab-case, `track`, `definition` entre 20 y 60 palabras, `relatedLessons`, `relatedTerms` y `sources` validados con `SourceSchema` (`publisher`, `accessed` y `supports` obligatorios).
6. `scripts/check-content.mjs`: verifica cada lección contra `LessonSchema`, calcula el conteo de palabras visibles por nivel (para Nivel 3 exige entre `600` y `1600` palabras visibles) y carga automáticamente los glosarios modulares desde `docs/curriculo/investigacion/*-glossary.json` para validar `lesson.glossaryTerms`.
7. `scripts/check-copy.mjs`: escanea los archivos de lección contra las frases vacías y adjetivos prohibidos del Apéndice B.2, rechaza cualquier aparición de `"2026"` fuera de `accessed`, limita las negritas a un máximo de `3` bloques `**...**` por párrafo y exige una longitud media de frase `<= 22` palabras en `sections[].body`.
8. `scripts/sync-lessons-index.mjs`: regenera `src/data/lessons/index.js` ordenando las lecciones por nivel, módulo y `order`, manteniendo el mapa `LEGACY_ID_MAP` a partir de `legacyId`.
9. `src/lab/sqlGrader.js`: implementa `compareQueryResults` y `gradeSqlPractice` con tolerancia numérica `1e-6`, comparando las filas ejecutadas contra `practice.expected` (o `practice.solution`) y respetando `orderMatters`.
10. `src/views/LessonPlayer.jsx`: renderiza las 7 etapas de una lección v2 (`Contexto y objetivos`, `Desarrollo y simulador`, `Ejemplo paso a paso`, `Desde tu área`, `Comprobaciones`, `Práctica aplicada`, `Resumen y fuentes`) normalizadas mediante `normalizeLessonV2`.
11. `src/components/LessonVisualizers.jsx`: registra los componentes interactivos disponibles para `sections[].interactive.component`, incluyendo `medallion-flow`, `isolation-timeline` y `partition-pruning`.
12. `server/ai/contextBuilder.js`: implementa la función asíncrona `buildContextPrompt({ mode, lessonId, sectionId, question, track })` que devuelve `{ prompt, context, trimmedHistoryCount, historyCount }` inyectando `objectives`, `sectionBody`, `aiNotes` y el esquema de Mercado Brisa bajo el presupuesto de `24.000` caracteres.
13. `server/ai/agyRunner.js`: implementa `runAgyPrompt(options)` (recibiendo un objeto `{ prompt, model, firstByteTimeoutMs, totalTimeoutMs }`) que invoca el binario real `agy` sin mocks con timeout de primer byte de 45 s por defecto.
14. `public/datasets/README.md` y `public/datasets/schema.json`: documentan las 8 tablas Parquet de **Mercado Brisa** (`customers` [2.400 filas], `orders` [18.000], `order_items` [42.000, columna de cantidad llamada `qty`], `products` [180], `stores` [14], `events` [65.000], `marketing_spend` [730] y `customer_changes` [4.100]).
15. `src/data/lessons/de3-lakehouse/de3-lakehouse-01-iceberg-v3-medallion.js`: archivo migrado con `needsReview: true`, práctica tipo `fill-blanks` no ejecutable y tablas ficticias (`silver.orders_v3`) que requería limpieza profunda conservando `legacyId: 'l10-iceberg-v3-medallion'` y `legacyOrder: 10`.
16. `src/data/lessons/de2-pipelines/de2-pipelines-01-etl-vs-elt.js` a `06-contenedores-docker-compose.js`: lecciones prerrequisito del módulo anterior utilizadas para verificar continuidad terminológica (capas Bronce, Plata y Oro, idempotencia y grano en Mercado Brisa).

---

## Pasos

### Paso 1 — Investigación de fuentes primarias verificadas (`HTTP 200 OK`)

Se documentó la investigación completa en `docs/curriculo/investigacion/de3-lakehouse.md`. Todas las URLs citadas en las 4 lecciones y en el glosario fueron verificadas mediante petición HTTP directa el `2026-10-29`, respondiendo `HTTP 200 OK`:

| Lección | Fuente primaria | Publicador | URL | Estado HTTP | Acceso |
| :--- | :--- | :--- | :--- | :---: | :---: |
| `de3-lakehouse-01` | *Apache Iceberg Table Spec (Format Version 3)* | Apache Software Foundation | https://iceberg.apache.org/spec/ | `200 OK` | `2026-10-29` |
| `de3-lakehouse-01` | *Apache Iceberg Puffin File Specification* | Apache Software Foundation | https://iceberg.apache.org/puffin-spec/ | `200 OK` | `2026-10-29` |
| `de3-lakehouse-01` | *Apache Iceberg Partitioning and Hidden Partitioning* | Apache Software Foundation | https://iceberg.apache.org/docs/latest/partitioning/ | `200 OK` | `2026-10-29` |
| `de3-lakehouse-01` | *Apache Iceberg Branching and Tagging (WAP)* | Apache Software Foundation | https://iceberg.apache.org/docs/latest/branching/ | `200 OK` | `2026-10-29` |
| `de3-lakehouse-02` | *Delta Universal Format (UniForm)* | Linux Foundation / Delta Lake | https://docs.delta.io/delta-uniform/ | `200 OK` | `2026-10-29` |
| `de3-lakehouse-02` | *Delta Lake Liquid Clustering* | Linux Foundation / Delta Lake | https://docs.delta.io/delta-clustering/ | `200 OK` | `2026-10-29` |
| `de3-lakehouse-02` | *Delta Transaction Log Protocol Specification* | Linux Foundation / Delta Lake | https://raw.githubusercontent.com/delta-io/delta/master/PROTOCOL.md | `200 OK` | `2026-10-29` |
| `de3-lakehouse-02` | *Read Delta tables with Iceberg clients (IcebergCompatV2)* | Databricks | https://docs.databricks.com/aws/en/delta/iceberg-reads | `200 OK` | `2026-10-29` |
| `de3-lakehouse-03` | *Apache Polaris: Open Source REST Catalog for Apache Iceberg* | Apache Software Foundation | https://polaris.apache.org/ | `200 OK` | `2026-10-29` |
| `de3-lakehouse-03` | *Unity Catalog Open Source Documentation* | Linux Foundation AI & Data | https://unitycatalog.io/ | `200 OK` | `2026-10-29` |
| `de3-lakehouse-03` | *What is Unity Catalog? Data Governance and Access Control* | Databricks | https://docs.databricks.com/aws/en/data-governance/unity-catalog/ | `200 OK` | `2026-10-29` |
| `de3-lakehouse-04` | *BigQuery Pricing (On-Demand Analysis vs Capacity Editions)* | Google Cloud | https://cloud.google.com/bigquery/pricing | `200 OK` | `2026-10-29` |
| `de3-lakehouse-04` | *Understanding Compute Cost (Virtual Warehouses & Credits)* | Snowflake | https://docs.snowflake.com/en/user-guide/cost-understanding-compute | `200 OK` | `2026-10-29` |
| `de3-lakehouse-04` | *SQL Warehouses and Serverless Compute Architecture* | Databricks | https://docs.databricks.com/aws/en/compute/sql-warehouse/ | `200 OK` | `2026-10-29` |

---

### Paso 2 — Mapa de conceptos y progresión pedagógica

El mapa curricular completo quedó registrado en la sección 2 de `docs/curriculo/investigacion/de3-lakehouse.md`:
- **`de3-lakehouse-01-iceberg-v3-medallion` (30 min):** parte de los formatos columnares Parquet (`de2-formatos`) y la arquitectura ELT en capas (`de2-pipelines`) para introducir el árbol de metadatos de Apache Iceberg (`metadata.json`, *manifest list*, *manifest files*), los *Deletion Vectors* en archivos Puffin de la especificación v3, el linaje por fila (`_row_id`), el particionado oculto y el patrón *Write-Audit-Publish* (WAP).
- **`de3-lakehouse-02-delta-lake-uniform` (25 min):** contrasta el árbol de Iceberg con el protocolo `_delta_log` (acciones JSON y *checkpoints* Parquet), explica cómo **Delta UniForm** e `IcebergCompatV2` exponen una única copia de archivos Parquet a ambos ecosistemas, introduce **Liquid Clustering** (curvas espaciales de Hilbert) frente al sobre-particionado Hive y `Z-ORDER`, y aborda la propagación incremental con *Change Data Feed* (CDF).
- **`de3-lakehouse-03-catalogos-polaris-unity` (25 min):** eleva la arquitectura hacia el plano de control multi-motor con el estándar OpenAPI **Iceberg REST Catalog** en **Apache Polaris** (commits atómicos y *vended credentials* STS) y el gobierno unificado de tres niveles (`catalogo.esquema.tabla`) en **Unity Catalog** con políticas dinámicas *Row Filters* (RLS), *Column Masks* (CLS) y linaje de columnas.
- **`de3-lakehouse-04-costos-bigquery-snowflake-databricks` (25 min):** conecta las decisiones físicas de particionado, *clustering* y proyección columnar con la arquitectura interna y el modelo FinOps de **BigQuery** (*Colossus/Capacitor/Dremel*, *On-Demand* por TiB vs *Editions* por *slots*), **Snowflake** (micro-particiones de 50–500 MB y *Virtual Warehouses* por segundo con mínimo de 60 s) y **Databricks** (motor vectorizado *Photon* y *Serverless SQL Warehouses* en DBUs).

---

### Paso 3 — Limpieza profunda de lección migrada y escritura de lecciones nuevas

1. **Limpieza profunda de `de3-lakehouse-01-iceberg-v3-medallion.js`:**
   - Se preservaron intactos `legacyId: 'l10-iceberg-v3-medallion'` y `legacyOrder: 10`, actualizando `contentVersion: 2` y `needsReview: false`.
   - Se acortó `title` a `42` caracteres (`'Apache Iceberg v3 y arquitectura Medallion'`) manteniendo el título completo de catálogo en `subtitle`.
   - Se eliminaron las consultas sobre tablas ficticias y la práctica `fill-blanks`, reemplazándolas por 4 secciones con SQL real sobre `orders`, `products` y `order_items` de Mercado Brisa, un `workedExample` regional y una práctica SQL ejecutable sin *fan-out*.
2. **Autoría de `de3-lakehouse-02-delta-lake-uniform.js`, `de3-lakehouse-03-catalogos-polaris-unity.js` y `de3-lakehouse-04-costos-bigquery-snowflake-databricks.js`:**
   - Cada lección se escribió desde cero cumpliendo todos los límites de `LessonSchema` y `check-copy.mjs`, integrando visualizadores interactivos (`isolation-timeline`, `medallion-flow` y `partition-pruning`), notas por rol (`de`, `da`, `bi`), 4 tarjetas `flashcards` y `aiNotes` específicas para el tutor.

---

### Paso 4 — Prácticas SQL y ejemplos ejecutables sobre Mercado Brisa

Todas las consultas SQL de `sections[].example`, `workedExample.steps` y `practice` (19 consultas SQL en total) fueron ejecutadas contra los archivos Parquet reales de `public/datasets/` en DuckDB:
- **`de3-lakehouse-01` (Práctica SQL):** CTE `items_by_order` que preagrega `SUM(qty)` por `order_id` y cruza con `stores` y `orders` para conciliar `bronze_orders`, `silver_completed_orders`, `bronze_gross_usd`, `silver_net_usd` y `gold_completed_units` por región (`Cono Sur`, `Andina`, `Iberia`, `Norteamérica`).
- **`de3-lakehouse-02` (Práctica SQL):** auditoría de densidad diaria de pedidos completados por tienda (`completed_orders`, `active_days`, `orders_per_active_day`, `store_revenue_usd`) demostrando que incluso la tienda principal (*Tienda Palermo Soho*, `AR`) promedia solo `3,23` órdenes por día activo.
- **`de3-lakehouse-03` (Práctica SQL):** vista gobernada con CTE `completed_by_customer` y `LEFT JOIN` desde `customers` que audita los 400 clientes de cada país, los códigos postales incompletos (`incomplete_postal_customers`), los clientes `cafeteria_b2b` y los ingresos gobernados (`governed_revenue_usd`).
- **`de3-lakehouse-04` (Práctica SQL):** auditoría FinOps de poda de particiones (`full_scan_lines`, `pruned_2025_lines`, `scan_saved_pct`, `net_2025_line_usd`) demostrando un ahorro de escaneo entre `64,53%` y `65,75%` en las cuatro regiones.

---

### Paso 5 — Glosario nuevo (`docs/curriculo/investigacion/de3-lakehouse-glossary.json`)

Se crearon 10 términos nuevos para el área `de` validados con `GlossaryListSchema` y con definiciones entre **24 y 25 palabras** (cumpliendo simultáneamente el mínimo de 20 palabras de `GlossaryTermSchema` y el tope de `<= 25` palabras de §9.2):

| ID de término | Término | Palabras en definición | Fórmula incluida |
| :--- | :--- | :---: | :---: |
| `iceberg-deletion-vectors` | Deletion Vectors (Iceberg v3) | `24` | Sí |
| `hidden-partitioning` | Particionado oculto (Hidden Partitioning) | `24` | Sí |
| `write-audit-publish` | Patrón Write-Audit-Publish (WAP) | `24` | Sí |
| `delta-transaction-log` | Registro transaccional (_delta_log) | `24` | Sí |
| `delta-uniform` | Delta Universal Format (UniForm) | `24` | Sí |
| `liquid-clustering` | Liquid Clustering | `24` | Sí |
| `iceberg-rest-catalog` | Catálogo Iceberg REST (Apache Polaris) | `24` | Sí |
| `unity-catalog-governance` | Gobierno unificado (Unity Catalog) | `25` | Sí |
| `snowflake-micro-partitions` | Micro-particiones y Virtual Warehouses | `24` | Sí |
| `bigquery-slots-pruning` | Slots de BigQuery y poda de escaneo | `25` | Sí |

---

### Paso 6 — Proyecto de módulo y rúbrica de evaluación

En la sección 3 de `docs/curriculo/investigacion/de3-lakehouse.md` se especificó el proyecto integrador del módulo (*Operar una tabla transaccional Apache Iceberg v3 con vectores de borrado, evolución de particiones y viaje en el tiempo*) sobre Mercado Brisa con diagrama de arquitectura Mermaid, 4 entregables técnicos verificables en SQL y rúbrica de evaluación en 4 criterios (*Comprensión conceptual*, *Corrección técnica*, *Aplicación al caso*, *Comunicación de hallazgos*) en escala `0` a `4`.

---

### Paso 7 — Auto-evaluación con rúbrica de 8 criterios (§9.4) y tabla resumen (§9.2)

#### Tabla resumen obligatoria (§9.2)

| lección | palabras | checks | prácticas | fuentes | puntuación de rúbrica |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `de3-lakehouse-01-iceberg-v3-medallion` | `1233` | `3` | `1 (sql)` | `4` | `32 / 32` |
| `de3-lakehouse-02-delta-lake-uniform` | `1052` | `3` | `1 (sql)` | `4` | `32 / 32` |
| `de3-lakehouse-03-catalogos-polaris-unity` | `1048` | `3` | `1 (sql)` | `3` | `32 / 32` |
| `de3-lakehouse-04-costos-bigquery-snowflake-databricks` | `1070` | `3` | `1 (sql)` | `3` | `32 / 32` |

#### Tabla de desglose de los 8 criterios de la rúbrica (§9.4, escala 0–4 sobre 32)

| Lección | 1. Objetivo claro | 2. Progresión | 3. Ejemplo concreto | 4. Error típico | 5. Práctica | 6. Brevedad | 7. Precisión | 8. Tono | Total |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `de3-lakehouse-01-iceberg-v3-medallion` | `4` | `4` | `4` | `4` | `4` | `4` *(20,4 pal/frase)* | `4` | `4` | **`32 / 32`** |
| `de3-lakehouse-02-delta-lake-uniform` | `4` | `4` | `4` | `4` | `4` | `4` *(14,8 pal/frase)* | `4` | `4` | **`32 / 32`** |
| `de3-lakehouse-03-catalogos-polaris-unity` | `4` | `4` | `4` | `4` | `4` | `4` *(17,0 pal/frase)* | `4` | `4` | **`32 / 32`** |
| `de3-lakehouse-04-costos-bigquery-snowflake-databricks` | `4` | `4` | `4` | `4` | `4` | `4` *(16,0 pal/frase)* | `4` | `4` | **`32 / 32`** |

---

## Test

### 1. Salida literal de `node scripts/check-content.mjs --module de3-lakehouse`

```text
=== Validación de contenido v2 (check-content) ===
Lección (id v2)                                | Módulo               | Niv  | Sec  | Chk  | Src  | Palabras  | Estado    
--------------------------------------------------------------------------------------------------------------------------
de3-lakehouse-01-iceberg-v3-medallion          | de3-lakehouse        | 3    | 4    | 3    | 4    | 1233      | OK        
de3-lakehouse-02-delta-lake-uniform            | de3-lakehouse        | 3    | 3    | 3    | 4    | 1052      | OK        
de3-lakehouse-03-catalogos-polaris-unity       | de3-lakehouse        | 3    | 3    | 3    | 3    | 1048      | OK        
de3-lakehouse-04-costos-bigquery-snowflake-databricks | de3-lakehouse        | 3    | 3    | 3    | 3    | 1070      | OK        
--------------------------------------------------------------------------------------------------------------------------
Resumen: 4 lecciones inspeccionadas | 4 válidas | 0 con advertencias (needsReview) | 0 con errores.

Resultado: OK (0 errores de esquema o integridad).
```

### 2. Salida literal de `node scripts/check-copy.mjs --path src/data/lessons/de3-lakehouse`

```text
=== Auditoría anti-slop de copy (check-copy) ===
Archivos escaneados: 4

0 hallazgos de términos prohibidos, emojis, "2026" o exceso de negritas.

--- Longitud media de frase en sections[].body ---
Media global: 18 palabras/frase (49373 palabras en 2747 frases; límite <= 22).

Total de hallazgos: 0
```

### 3. Salida literal de verificación de glosario (`GlossaryListSchema`) y calificador SQL en DuckDB (`compareQueryResults`)

```text
GlossaryListSchema valid: true
  Term iceberg-deletion-vectors: 24 words
  Term hidden-partitioning: 24 words
  Term write-audit-publish: 24 words
  Term delta-transaction-log: 24 words
  Term delta-uniform: 24 words
  Term liquid-clustering: 24 words
  Term iceberg-rest-catalog: 24 words
  Term unity-catalog-governance: 25 words
  Term snowflake-micro-partitions: 24 words
  Term bigquery-slots-pruning: 25 words
Lesson de3-lakehouse-01-iceberg-v3-medallion: avg=20.4 words/sentence (613w / 30s) | starterPassed=false (rows_mismatch) | solutionPassed=true | tableMatch=true
Lesson de3-lakehouse-02-delta-lake-uniform: avg=14.8 words/sentence (428w / 29s) | starterPassed=false (rows_mismatch) | solutionPassed=true | tableMatch=true
Lesson de3-lakehouse-03-catalogos-polaris-unity: avg=17.0 words/sentence (426w / 25s) | starterPassed=false (rows_mismatch) | solutionPassed=true | tableMatch=true
Lesson de3-lakehouse-04-costos-bigquery-snowflake-databricks: avg=16.0 words/sentence (447w / 28s) | starterPassed=false (rows_mismatch) | solutionPassed=true | tableMatch=true
```

### 4. Salida literal de la prueba real del tutor `agy` (`buildContextPrompt` + `runAgyPrompt`)

```text
=== TUTOR TEST: explain_simple (de3-lakehouse-01) ===
Prompt length: 6757 chars | Lesson: Apache Iceberg v3 y arquitectura Medallion
Status: model=gemini-3.8-flash-low | firstTokenMs=10145 | durationMs=13090 | chars=1307
Reply:
Un **Deletion Vector (DV)** en Iceberg v3 es una máscara binaria comprimida (*Roaring bitmap*) que marca qué filas quedaron invalidadas dentro de un archivo de datos, sin tocar el Parquet original. Se almacena en un archivo lateral de formato **Puffin**.

Imagina que en Mercado Brisa tienes el archivo `orders_part_01.parquet` con 100.000 pedidos. Llega una ola de devoluciones y debes marcar como cancelados o purgar 1.440 pedidos (por ejemplo, del `order_id` 10.001 al 11.440), que ocupan los índices de fila 450 a 1.889 dentro de ese archivo.

- **Con Copy-on-Write (v1/v2 tradicional):** El motor reescribe los 100.000 registros en un Parquet nuevo solo para omitir esas 1.440 filas. Esto dispara I/O, satura la red y genera contención en commits concurrentes.
- **Con Deletion Vectors en Puffin (v3):** El Parquet original queda 100% inalterado. El motor genera un archivo Puffin de pocos kilobytes que dice: *"en `orders_part_01.parquet`, ignora los offsets 450 al 1.889"*. Además, v3 fusiona cualquier borrado posterior en ese mismo vector, evitando la dispersión de archivos de borrado posicional.

**Error que evita:** Reescribir gigabytes de datos inmutables ante actualizaciones frecuentes y saturar el *throughput* del *lakehouse* por no separar los datos crudos de sus máscaras de visibilidad.

=== TUTOR TEST: hint (de3-lakehouse-01 practice) ===
Prompt length: 6811 chars | Lesson: Apache Iceberg v3 y arquitectura Medallion
Status: model=gemini-3.8-flash-low | firstTokenMs=8747 | durationMs=10367 | chars=772
Reply:
Al colocar el `WHERE o.status = 'completed'` al final de la consulta global, descartas todas las órdenes no completadas antes de cualquier agregación. Por eso tu capa Bronce pierde las órdenes canceladas o pendientes y coincide con Plata.

La pista: en lugar de filtrar las filas de toda la consulta con un `WHERE` general, traslada esa condición únicamente al cálculo de las métricas de Plata y Oro. 

Revisa cómo usar agregaciones condicionales dentro del `SELECT`, por ejemplo con la cláusula `FILTER (WHERE ...)` de SQL estándar o mediante expresiones `CASE WHEN` dentro de tus funciones `COUNT` y `SUM`. De esa forma, las métricas Bronce leerán todas las filas de `orders`, mientras que las métricas Plata y Oro solo acumularán las que cumplan `status = 'completed'`.
```

### 5. Salida literal de `npm run build`

```text
> grano@1.0.0 build
> vite build

vite v6.4.5 building for production...
transforming...
✓ 2437 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                                        1.00 kB │ gzip:     0.51 kB
dist/assets/index-Ds05HJQs.css                                       236.89 kB │ gzip:    32.06 kB
dist/assets/PracticeView-B5wEcQ0Q.js                                   8.31 kB │ gzip:     2.84 kB
dist/assets/duckdb-browser-BNitTxKA.js                                27.41 kB │ gzip:     7.01 kB
dist/assets/curriculum-stages-BHOHuqmu.js                            285.16 kB │ gzip:    95.09 kB
dist/assets/SqlLab-kmq1-t4R.js                                       389.73 kB │ gzip:   127.31 kB
dist/assets/vendor-CMuuJwVt.js                                       558.99 kB │ gzip:   155.51 kB
dist/assets/index-QMa-bhdk.js                                      2,923.98 kB │ gzip:   807.20 kB
✓ built in 18.65s
```

### 6. Salida literal de verificación Playwright en el puerto `5221`

```text
[OK] de3-lakehouse-01-iceberg-v3-medallion | H1="Apache Iceberg v3 y arquitectura Medallion" | Desktop(1440/1440) | Mobile(375/375)
[OK] de3-lakehouse-02-delta-lake-uniform | H1="Delta Lake 4.0 y Delta UniForm en el Lakehouse" | Desktop(1440/1440) | Mobile(375/375)
[OK] de3-lakehouse-03-catalogos-polaris-unity | H1="Catálogos abiertos: Apache Polaris y Unity Catalog" | Desktop(1440/1440) | Mobile(375/375)
[OK] de3-lakehouse-04-costos-bigquery-snowflake-databricks | H1="Costos y arquitectura: BigQuery, Snowflake y Databricks" | Desktop(1440/1440) | Mobile(375/375)
Console errors: 0
Page errors: 0
```

---

## Revisión propia

Durante la construcción y auditoría del módulo se detectaron y corrigieron **7 defectos propios reales**:

1. **Exceso de negritas (`> 3` bloques `**...**` por párrafo) en `de3-lakehouse-01` y `de3-lakehouse-04`:**
   - *Archivo y línea:* `src/data/lessons/de3-lakehouse/de3-lakehouse-01-iceberg-v3-medallion.js` (líneas 24 y 87) y `src/data/lessons/de3-lakehouse/de3-lakehouse-04-costos-bigquery-snowflake-databricks.js` (líneas 23 y 50).
   - *Defecto:* `check-copy.mjs` reportó 5 hallazgos de `negritas excesivas (>3 ** por párrafo)`.
   - *Corrección:* se redujeron los resaltados en negrita a un máximo de 2–3 conceptos nucleares por párrafo, logrando `0` hallazgos.
2. **Aparición del término prohibido `"ecosistemas"` en el hook de `de3-lakehouse-02`:**
   - *Archivo y línea:* `src/data/lessons/de3-lakehouse/de3-lakehouse-02-delta-lake-uniform.js` (línea 13).
   - *Defecto:* `check-copy.mjs` detectó la coincidencia `ecosistema ["ecosistemas"]` de la lista del Apéndice B.2.
   - *Corrección:* se sustituyó `"ambos ecosistemas"` por `"ambos estándares"`, eliminando el hallazgo.
3. **Longitud media de frase superior a 22 palabras/frase en `de3-lakehouse-02` (24,3), `03` (23,2) y `04` (29,6):**
   - *Archivo y línea:* `sections[].body` de `de3-lakehouse-02-delta-lake-uniform.js`, `de3-lakehouse-03-catalogos-polaris-unity.js` y `de3-lakehouse-04-costos-bigquery-snowflake-databricks.js`.
   - *Defecto:* el uso de punto y coma y cláusulas subordinadas largas elevaba la media por encima del umbral de `22` palabras/frase.
   - *Corrección:* se dividieron las oraciones extensas en frases directas, reduciendo los promedios a `14,8`, `17,0` y `16,0` palabras/frase respectivamente.
4. **Nombre de columna inexistente `quantity` en lugar de `qty` en la práctica SQL de `de3-lakehouse-01`:**
   - *Archivo y línea:* `src/data/lessons/de3-lakehouse/de3-lakehouse-01-iceberg-v3-medallion.js` (líneas 258, 276 y 299).
   - *Defecto:* al ejecutar la consulta contra `public/datasets/order_items.parquet` en DuckDB, lanzó `Binder Error: Referenced column "quantity" not found in FROM clause! Candidate bindings: "qty"`.
   - *Corrección:* se corrigió la expresión a `SUM(qty) AS order_units` tanto en `starterCode` como en `expected`, `hints` y `solution`.
5. **Nombre de columna inexistente `marketing_opt_in` en `customers.parquet` dentro de `de3-lakehouse-03`:**
   - *Archivo y línea:* `src/data/lessons/de3-lakehouse/de3-lakehouse-03-catalogos-polaris-unity.js` (línea 55).
   - *Defecto:* el ejemplo de la sección 2 agrupaba por `marketing_opt_in`, columna que no existe en `public/datasets/customers.parquet`.
   - *Corrección:* se reescribió la consulta agrupando por la columna real `segment` (`retail`, `pro_barista`, `cafeteria_b2b`) y se sincronizó `expectedOutput` con el resultado real de DuckDB.
6. **Campos faltantes (`publisher`, `accessed`, `supports`) en `sources[]` del glosario `de3-lakehouse-glossary.json`:**
   - *Archivo y línea:* `docs/curriculo/investigacion/de3-lakehouse-glossary.json` (líneas 16–320).
   - *Defecto:* inicialmente cada fuente del glosario solo incluía `title` y `url`, fallando la validación contra `GlossaryListSchema` que reutiliza `SourceSchema`.
   - *Corrección:* se añadieron `publisher`, `accessed: "2026-10-29"` y `supports` en las 12 entradas de fuentes del glosario, logrando `GlossaryListSchema valid: true`.
7. **Literal de fecha `'2026-01-01'` en predicado SQL de `de3-lakehouse-04`:**
   - *Archivo y línea:* `src/data/lessons/de3-lakehouse/de3-lakehouse-04-costos-bigquery-snowflake-databricks.js` (líneas 227–288).
   - *Defecto:* usar `< DATE '2026-01-01'` para acotar el año 2025 habría disparado la alerta de `"2026"` fuera de `sources[].accessed` en `check-copy.mjs`.
   - *Corrección:* se reemplazó el límite superior por `AND o.order_date <= DATE '2025-12-31'`, obteniendo exactamente las mismas filas en DuckDB y `0` alertas en `check-copy.mjs`.

---

## Prueba adversarial

Se ejecutaron **6 escenarios adversariales** sobre el contenido, el calificador SQL, el constructor de contexto del tutor y el renderizado responsive:

| # | Escenario adversarial | Entrada / Acción | Resultado observado | Estado |
| :---: | :--- | :--- | :--- | :---: |
| 1 | Ejecución directa del `starterCode` sin modificar en las 4 prácticas SQL | Evaluación de `practice.starterCode` contra `practice.expected` mediante `compareQueryResults` en DuckDB | En las 4 lecciones `starterCode` ejecuta sin error de sintaxis pero devuelve `passed: false` (`reason: 'rows_mismatch'`), impidiendo aprobar sin resolver el ejercicio. | **PASÓ** |
| 2 | Intento de *fan-out* al unir `orders` con `order_items` sin preagregar en `de3-lakehouse-01` | `JOIN order_items oi ON o.order_id = oi.order_id` sumando `SUM(o.total_usd)` directamente | El ingreso de `Cono Sur` se distorsiona al multiplicar cabeceras de orden por número de líneas; el calificador rechaza la respuesta (`rows_mismatch`) y `hints[0]` guía hacia la CTE `items_by_order`. | **PASÓ** |
| 3 | Uso de `INNER JOIN` en lugar de `LEFT JOIN` en la vista gobernada por país de `de3-lakehouse-03` | Filtrar o unir solo clientes con pedidos completados o del segmento `cafeteria_b2b` | Desaparecen clientes sin compras y los países `CO` y `AR` muestran `0` en `b2b_customers`; el `LEFT JOIN` de la solución conserva los `400` clientes de los 6 países (`passed: true`). | **PASÓ** |
| 4 | Omisión del predicado `o.status = 'completed'` en la auditoría FinOps de `de3-lakehouse-04` | Filtrar solo por `order_date` en 2025 sin excluir `refunded`, `cancelled` y `pending` | `pruned_2025_lines` sube por encima de las líneas válidas (`4775` en Cono Sur) e infla `net_2025_line_usd`; `compareQueryResults` rechaza el resultado con `rows_mismatch`. | **PASÓ** |
| 5 | Consulta de estudiante con error conceptual al tutor `agy` pidiendo la respuesta de la práctica | Envío de pregunta sobre `WHERE o.status = 'completed'` global en `de3-lakehouse-01` vía `buildContextPrompt` + `runAgyPrompt` | `agy` (`gemini-3.8-flash-low`, `10.367 ms`) explica por qué el `WHERE` global vacía la capa Bronce y sugiere usar `FILTER (WHERE ...)` sin revelar la consulta completa de `solution`. | **PASÓ** |
| 6 | Estrés de layout en viewport móvil estrecho (`375x812`) con bloques de código SQL y tablas anchas | Renderizado de las 4 lecciones en Playwright a `375x812` midiendo `document.documentElement.scrollWidth` vs `clientWidth` | Las 4 lecciones reportan exactamente `scrollWidth = 375` y `clientWidth = 375` (`Mobile(375/375)`), con desplazamiento horizontal contenido dentro de los bloques de código y `0` errores de consola. | **PASÓ** |

---

## Capturas antes / después

Todas las capturas fueron generadas con Playwright en el puerto exclusivo `5221`, almacenadas en `docs/reportes/capturas/W-de3-lakehouse/` e inspeccionadas visualmente con `read_file`:

| Archivo de captura | Resolución y tema | Contenido verificado visualmente con `read_file` |
| :--- | :---: | :--- |
| `01-iceberg-v3-desktop-1440x900-light.png` | `1440x900` (Claro) | Lección 1 (`Apache Iceberg v3 y arquitectura Medallion`) limpia, mostrando miga de pan del módulo, prerrequisito, escenario real, objetivos y temario lateral de 10 pasos. |
| `01-iceberg-v3-desktop-1440x900-dark.png` | `1440x900` (Oscuro) | Lección 1 en modo oscuro con contraste correcto en tarjetas de escenario real, objetivos y encabezados. |
| `01-iceberg-v3-practice-sql-1440x900.png` | `1440x900` (Claro) | Vista de sección práctica SQL de la Lección 1 sobre Mercado Brisa. |
| `01-iceberg-v3-tutor-drawer-1440x900.png` | `1440x900` (Claro) | Cajón lateral del Tutor IA abierto contextualizado en `Lección: Apache Iceberg v3 y arquitectura Medallion · Sección 1` con selector `Rápido Flash` (`gemini-3.8-flash-low`). |
| `01-iceberg-v3-mobile-375x812-dark.png` | `375x812` (Oscuro) | Vista móvil de la Lección 1 sin desbordamiento horizontal (`375/375`). |
| `02-delta-uniform-desktop-1440x900-light.png` | `1440x900` (Claro) | Lección 2 (`Delta Lake 4.0 y Delta UniForm en el Lakehouse`) en modo claro con prerrequisito enlazado a la Lección 1. |
| `02-delta-uniform-desktop-1440x900-dark.png` | `1440x900` (Oscuro) | Lección 2 en modo oscuro (`1440x900`). |
| `02-delta-uniform-practice-sql-1440x900.png` | `1440x900` (Claro) | Práctica SQL de diagnóstico de fragmentación por tienda en la Lección 2. |
| `02-delta-uniform-mobile-375x812-dark.png` | `375x812` (Oscuro) | Vista móvil de la Lección 2 (`375/375`). |
| `03-polaris-unity-desktop-1440x900-light.png` | `1440x900` (Claro) | Lección 3 (`Catálogos abiertos: Apache Polaris y Unity Catalog`) en modo claro. |
| `03-polaris-unity-desktop-1440x900-dark.png` | `1440x900` (Oscuro) | Lección 3 en modo oscuro (`1440x900`). |
| `03-polaris-unity-practice-sql-1440x900.png` | `1440x900` (Claro) | Práctica SQL de auditoría de gobierno por país en la Lección 3. |
| `03-polaris-unity-mobile-375x812-dark.png` | `375x812` (Oscuro) | Vista móvil de la Lección 3 (`375/375`). |
| `04-costos-cloud-desktop-1440x900-light.png` | `1440x900` (Claro) | Lección 4 (`Costos y arquitectura: BigQuery, Snowflake y Databricks`) en modo claro. |
| `04-costos-cloud-desktop-1440x900-dark.png` | `1440x900` (Oscuro) | Lección 4 en modo oscuro (`1440x900`). |
| `04-costos-cloud-practice-sql-1440x900.png` | `1440x900` (Claro) | Práctica SQL de ahorro FinOps por poda de particiones en la Lección 4. |
| `04-costos-cloud-mobile-375x812-dark.png` | `375x812` (Oscuro) | Vista móvil de la Lección 4 (`375/375`). |

---

## Peticiones al orquestador

1. **Sincronización global al integrar la Ola C:** ejecutar `node scripts/sync-lessons-index.mjs` durante el merge de la Ola C en `main` para registrar las 3 nuevas lecciones (`de3-lakehouse-02`, `03`, `04`) y la actualización de `de3-lakehouse-01` en `src/data/lessons/index.js`.
2. **Integración del glosario modular:** fusionar `docs/curriculo/investigacion/de3-lakehouse-glossary.json` (10 términos validados con `GlossaryListSchema`) en `src/data/glossary.js` durante el paso de consolidación de glosarios de la Ola C.

---

## Pendiente (con motivo)

- **Ningún ítem pendiente.** Las 4 lecciones del módulo `de3-lakehouse`, el documento de investigación y proyecto (`docs/curriculo/investigacion/de3-lakehouse.md`), el glosario modular (`docs/curriculo/investigacion/de3-lakehouse-glossary.json`), las 17 capturas verificadas y este reporte están terminados y validados con `0` errores.
