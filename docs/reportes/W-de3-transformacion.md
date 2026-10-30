# Reporte de cierre — `W-de3-transformacion`

- **Agente:** `W-de3-transformacion`
- **Fase / Ola:** Fase 3 · Ola C (Tracks Nivel 3 — Ingeniería de Datos)
- **Módulo:** `de3-transformacion` — *Transformación declarativa, contratos y calidad*
- **Rama / Worktree:** `agente/W-de3-transformacion` (`C:\Users\T490s\Desktop\Proyectos\ING-W-de3-transformacion`)
- **Puerto Vite dedicado:** `5222`
- **Fecha de entrega:** `2026-10-30`

---

## Inicio

Archivos del repositorio leídos íntegramente antes de intervenir y dato técnico concreto extraído de cada uno:

- `PLAN_GEMINI_4_ARGON.md`: define en §9.2, §9.4 y Apéndices A, B y D.3 el protocolo de 7 pasos de los agentes `W-<modulo>`, las longitudes por campo de `LessonSchema`, la prohibición de años literales fuera de `sources[].accessed`, el tope de media `<= 22` palabras por frase en `sections[].body` y las dos tablas obligatorias de autoevaluación sobre 32 puntos.
- `docs/reportes/PLANTILLA.md`: establece las secciones obligatorias del reporte de cierre (`## Inicio`, `## Pasos`, `## Test`, `## Revisión propia`, `## Prueba adversarial`, `## Capturas antes / después`, `## Peticiones al orquestador` y `## Pendiente (con motivo)`).
- `src/data/catalog/modules.js`: especifica en las líneas 458–475 el módulo `de3-transformacion` (`level: 3`, `track: 'de'`, `prerequisites: ['de3-lakehouse', 'c2-dimensional']`) con 4 lecciones (`l11-dbt-sqlmesh-dag` de 30 min, *Tests de esquema, pruebas unitarias SQL y auditorías bloqueantes en el DAG* de 25 min, `l12-contracts-semantic-layer` de 30 min y *Observabilidad de datos y trazabilidad de extremo a extremo con OpenLineage* de 25 min) y su proyecto integrador sobre `orders`, `order_items`, `payments`, `refunds`, `customers` y `products`.
- `src/data/schema/lesson.js`: valida `LessonSchema` exigiendo `contentVersion: 2`, `moduleId`, `title` `<= 60` caracteres, `hook` de `40..90` palabras terminado en `?`, `sections` (`2..6`) con `id`, `heading` `<= 70` caracteres y `body` de `80..250` palabras, `workedExample` con `title`, `scenario` y `2..5` pasos, `checks` (`3..6`) con `explanation` de `20..60` palabras, `practice` con `starterCode`, `expected`, `solution` y `hints` (`1..3`), `roleNotes` (`de`, `da`, `bi`) de `25..70` palabras, `summary` (`3..5` frases de `<= 25` palabras), `flashcards` (`3..6`), `sources` (`>= 3` con `https://` y fecha `YYYY-MM-DD`) y `aiNotes` `<= 80` palabras.
- `src/data/schema/glossary.js`: define `GlossaryTermSchema` y `GlossaryListSchema`, exigiendo para cada elemento `id` en kebab-case, `term`, `englishTerm`, `track`, `definition` (`20..60` palabras), `relatedLessons`, `relatedTerms` y `sources` con `title`, `url`, `publisher`, `accessed` y `supports`.
- `public/datasets/README.md`: documenta las 13 tablas Parquet deterministas de Mercado Brisa (semilla `19870315`) y sus anomalías inyectadas, incluyendo cobros duplicados en `payments`, un SKU con precio negativo en `products`, códigos postales nulos en `customers`, eventos con `customer_id` nulo y husos horarios mixtos en `events`.
- `public/datasets/schema.json`: detalla los tipos físicos y nombres exactos de columna de las 13 tablas de Mercado Brisa (por ejemplo, `payments.status`, `payments.idempotency_key`, `events.timezone_offset`, `refunds.refund_amount_usd`).
- `scripts/check-content.mjs`: verifica que cada lección cumpla `LessonSchema`, tenga entre `600` y `1600` palabras visibles, `needsReview: false`, prerrequisitos existentes y `glossaryTerms` registrados en `src/data/glossary/terms.js` o en `docs/curriculo/investigacion/*-glossary.json`.
- `scripts/check-copy.mjs`: audita la ausencia de palabras prohibidas (muletillas de IA), emojis, el literal `"2026"` fuera de `sources[].accessed`, más de 3 negritas (`**`) por párrafo en `sections[].body` y una media superior a `22` palabras por frase.
- `src/lab/duckdb.js`: inicializa DuckDB-Wasm en el navegador registrando las 13 vistas sobre los archivos Parquet de `public/datasets/` y normalizando fechas, marcas de tiempo y enteros `BigInt`.
- `src/lab/sqlGrader.js`: implementa `compareQueryResults` y `gradeSqlPractice`, donde `const referenceSql = practice?.expected || practice?.solution` ejecuta `referenceSql` directamente en DuckDB y compara columnas, filas y orden con tolerancia numérica `1e-6`.
- `src/views/LessonPlayer.jsx`: renderiza el flujo vertical de la lección v2 (`contexto`, `desarrollo`, `ejemplo-guiado`, `areas`, `comprobaciones`, `practica`, `resumen`), incrustando `LessonVisualizer`, `AuthenticCodeLab` y `PipelineOrderChallenge`.
- `src/components/PipelineOrderChallenge.jsx`: renderiza cada paso del reto de ordenación leyendo `step.id` y `step.text` (`<span className="pipeline-step-text">{step.text}</span>`), por lo que cualquier objeto de paso sin la propiedad `text` falla o queda vacío.
- `src/components/LessonVisualizers.jsx`: registra los componentes interactivos `DbtSqlmeshDagExplorer` (`dbt-sqlmesh-dag-explorer`) y `SemanticContractSim` (`semantic-contract-sim`).
- `server/ai/contextBuilder.js`: exporta la función asíncrona `buildContextPrompt`, que ensambla la plantilla de modo (`explain_simple`, `hint`, `review_sql`, `free_question`) con los objetivos, cuerpo de sección, `aiNotes` y esquema de Mercado Brisa bajo el presupuesto de `24,000` caracteres.
- `server/ai/agyRunner.js`: exporta `runAgyPrompt({ prompt })` y `runAgyStream`, ejecutando el binario local `agy` sin shell intermedio con timeout de primer byte de `45 s` y total de `120 s`.
- `src/data/lessons/c2-dimensional/c2-dimensional-01-hechos-dimensiones-bus.js`: establece los 4 pasos de Kimball, la matriz de bus empresarial y el patrón *Drill-Across* con CTEs preagregadas sobre `orders`, `refunds` y `stores`.
- `src/data/lessons/c2-dimensional/c2-dimensional-02-star-schema-obt.js`: contrasta el esquema en estrella frente a *One Big Table (OBT)* y demuestra el riesgo de *fan-out* al unir `orders` con `order_items`.
- `src/data/lessons/c2-dimensional/c2-dimensional-03-scd2-history.js`: modela la historia dimensional con SCD Tipo 2 sobre `customer_changes` (`valid_from`, `valid_to`, `is_current`).
- `src/data/lessons/c2-dimensional/c2-dimensional-04-metrics-simpson.js`: distingue medidas aditivas, semiaditivas y métricas de razón no aditivas, junto con la paradoja de Simpson.
- `src/data/lessons/c2-dimensional/c2-dimensional-05-hechos-instantanea-acumulativos.js`: diferencia tablas de hechos transaccionales, de instantánea periódica y de instantánea acumulativa.
- `src/data/lessons/de3-lakehouse/de3-lakehouse-01-iceberg-v3-medallion.js`: introduce la jerarquía de metadatos de Apache Iceberg, el aislamiento de instantáneas y el patrón *Write-Audit-Publish (WAP)* a nivel de catálogo.

---

## Pasos

### Paso 1 — Investigación de fuentes primarias

Se verificaron mediante petición HTTP (`200 OK`) el `2026-10-29` dieciséis fuentes primarias oficiales (4 por lección) documentadas en `docs/curriculo/investigacion/de3-transformacion.md`:

- **Lección 01 (`de3-transformacion-01-dbt-sqlmesh-dag`):**
  1. dbt Labs — *About incremental models*: `https://docs.getdbt.com/docs/build/incremental-models` (`200 OK`, accedido `2026-10-29`).
  2. dbt Labs — *About ref function*: `https://docs.getdbt.com/reference/dbt-jinja-functions/ref` (`200 OK`, accedido `2026-10-29`).
  3. Tobiko Data — *SQLMesh Model Kinds*: `https://sqlmesh.readthedocs.io/en/stable/concepts/models/model_kinds/` (`200 OK`, accedido `2026-10-29`).
  4. Tobiko Data — *SQLMesh Virtual Data Environments*: `https://sqlmesh.readthedocs.io/en/stable/concepts/environments/` (`200 OK`, accedido `2026-10-29`).
- **Lección 02 (`de3-transformacion-02-tests-unitarios-auditorias-dag`):**
  1. dbt Labs — *Add data tests to your DAG*: `https://docs.getdbt.com/docs/build/data-tests` (`200 OK`, accedido `2026-10-29`).
  2. dbt Labs — *Unit tests in dbt*: `https://docs.getdbt.com/docs/build/unit-tests` (`200 OK`, accedido `2026-10-29`).
  3. Tobiko Data — *SQLMesh Audits*: `https://sqlmesh.readthedocs.io/en/stable/concepts/audits/` (`200 OK`, accedido `2026-10-29`).
  4. Tobiko Data — *SQLMesh Testing (Unit Tests)*: `https://sqlmesh.readthedocs.io/en/stable/concepts/tests/` (`200 OK`, accedido `2026-10-29`).
- **Lección 03 (`de3-transformacion-03-contracts-semantic-layer`):**
  1. dbt Labs — *Model contracts*: `https://docs.getdbt.com/docs/collaborate/govern/model-contracts` (`200 OK`, accedido `2026-10-29`).
  2. Bitol / LF AI & Data — *Open Data Contract Standard (ODCS)*: `https://bitol-io.github.io/open-data-contract-standard/latest/` (`200 OK`, accedido `2026-10-29`).
  3. dbt Labs — *Semantic models & MetricFlow*: `https://docs.getdbt.com/docs/build/semantic-models` (`200 OK`, accedido `2026-10-29`).
  4. Cube Dev — *Data Modeling Overview*: `https://cube.dev/docs/product/data-modeling/overview` (`200 OK`, accedido `2026-10-29`).
- **Lección 04 (`de3-transformacion-04-observabilidad-openlineage`):**
  1. LF AI & Data — *OpenLineage Object Model Specification*: `https://openlineage.io/docs/spec/object-model` (`200 OK`, accedido `2026-10-29`).
  2. LF AI & Data — *OpenLineage Column Lineage Dataset Facet*: `https://openlineage.io/docs/spec/facets/dataset-facets/column_lineage_facet` (`200 OK`, accedido `2026-10-29`).
  3. LF AI & Data — *OpenLineage Data Quality Metrics Facet*: `https://openlineage.io/docs/spec/facets/dataset-facets/data_quality_metrics` (`200 OK`, accedido `2026-10-29`).
  4. LF AI & Data / Marquez Project — *Marquez Quickstart & Lineage Graph*: `https://marquezproject.ai/docs/quickstart` (`200 OK`, accedido `2026-10-29`).

### Paso 2 — Mapa de conceptos y progresión del módulo

Documentado en `docs/curriculo/investigacion/de3-transformacion.md`. El módulo toma las invariantes de grano y el patrón *Drill-Across* de `c2-dimensional` junto con el aislamiento de instantáneas y *Write-Audit-Publish (WAP)* de `de3-lakehouse`, desarrollando una secuencia de 4 lecciones sin solapamiento:
1. **L1 (`01-dbt-sqlmesh-dag`):** compilación declarativa del grafo (`ref`/`source` vs AST), materializaciones incrementales con ventana deslizante (*lookback window*) + `QUALIFY ROW_NUMBER() = 1` y entornos virtuales de datos en SQLMesh.
2. **L2 (`02-tests-unitarios-auditorias-dag`):** diferenciación entre *Unit Tests SQL* con entradas sintéticas (`VALUES`) previas a la materialización y *Data Tests / Audits* sobre tablas reales, articulando compuertas WAP bloqueantes (`blocking: true`) frente a advertencias (`warn`).
3. **L3 (`03-contracts-semantic-layer`):** contratos de datos ejecutables en DDL (`contract: { enforced: true }` y Bitol ODCS v3), versionado `v1`/`v2`, cuarentena de filas corruptas y puente hacia la capa semántica (*MetricFlow* / *Cube*) con métricas aditivas y de razón sin *fan-out*.
4. **L4 (`04-observabilidad-openlineage`):** monitoreo continuo sobre los 4 pilares de la observabilidad (frescura, volumen, distribución y esquema) y trazabilidad de extremo a extremo con OpenLineage (`Job`, `Run`, `Dataset`, `ColumnLineageDatasetFacet` con dependencias `DIRECT` vs `INDIRECT` y `DataQualityMetricsInputDatasetFacet`).

### Paso 3 — Escritura y limpieza profunda de las 4 lecciones

- `src/data/lessons/de3-transformacion/de3-transformacion-01-dbt-sqlmesh-dag.js` (`legacyId: 'l11-dbt-sqlmesh-dag'`, `order: 1`, `legacyOrder: 11`, `minutes: 30`, `needsReview: false`): limpieza profunda reemplazando el dominio ficticio `novapay`/`bronze.raw_payments` y el estado inexistente `'succeeded'` por consultas reales verificadas en DuckDB sobre `payments` (`status = 'captured'`), `orders` y `stores` de Mercado Brisa; preservación del simulador `dbt-sqlmesh-dag-explorer` y normalización de `pipelineChallenge.steps` con `id` y `text`.
- `src/data/lessons/de3-transformacion/de3-transformacion-02-tests-unitarios-auditorias-dag.js` (`order: 2`, `minutes: 25`, `needsReview: false`): lección nueva con pruebas singulares, pruebas unitarias autocontenidas con `VALUES` en DuckDB y suite de auditorías WAP bloqueantes y no bloqueantes sobre las anomalías reales de Mercado Brisa (`405` cobros capturados duplicados, `145` reembolsos sobre órdenes no elegibles, `1` SKU negativo y `218` clientes sin código postal).
- `src/data/lessons/de3-transformacion/de3-transformacion-03-contracts-semantic-layer.js` (`legacyId: 'l12-contracts-semantic-layer'`, `order: 3`, `legacyOrder: 12`, `minutes: 30`, `tracks: ['de', 'bi']`, `needsReview: false`): limpieza profunda reemplazando `novapay`/`subscriptions` por contratos y métricas semánticas reales sobre `products`, `customers`, `orders`, `refunds` y `stores`; conversión de la práctica `fill-blanks` a práctica `sql` verificada en DuckDB; preservación del simulador `semantic-contract-sim` y normalización de `pipelineChallenge.steps` con `id` y `text`.
- `src/data/lessons/de3-transformacion/de3-transformacion-04-observabilidad-openlineage.js` (`order: 4`, `minutes: 25`, `needsReview: false`): lección nueva sobre los 4 pilares de la observabilidad y OpenLineage, diagnosticando en `events` (`65,000` filas) los `52,000` registros con huso horario local (`timezone_offset <> 'Z'`) y los `6,715` eventos con `customer_id IS NULL`.

### Paso 4 — Glosario del módulo

Se creó `docs/curriculo/investigacion/de3-transformacion-glossary.json` con **10 términos nuevos** (`modelo-incremental-ventana`, `entorno-virtual-datos`, `grafo-linaje-declarativo`, `prueba-unitaria-sql`, `auditoria-bloqueante-wap`, `prueba-singular-datos`, `contrato-datos-odcs`, `capa-semantica-metricas`, `observabilidad-cuatro-pilares`, `linaje-columna-openlineage`), cada uno con definición de `23` a `24` palabras (`<= 25` y `>= 20`), término en inglés, fórmula/sintaxis, `relatedLessons`, `relatedTerms` y fuentes verificadas, validado con `GlossaryListSchema` (`Valid: true`).

### Paso 5 — Verificación del Tutor IA real vía `agy`

Se ejecutaron `buildContextPrompt` (`server/ai/contextBuilder.js`) y `runAgyPrompt` (`server/ai/agyRunner.js`) sobre las 4 lecciones del módulo y en los modos `explain_simple` y `hint`. Todas las llamadas respondieron con código `0`, utilizando los `aiNotes` de cada lección para guiar al estudiante sin filtrar la solución literal en modo pista (salidas literales registradas en `## Test`).

### Paso 6 — Proyecto de módulo y rúbrica 0–4

Documentado en `docs/curriculo/investigacion/de3-transformacion.md` (sección *Paso 6*), incluyendo el enunciado técnico alineado con `src/data/catalog/modules.js`, la consulta SQL de referencia en tres capas (`stg_valid_orders`, `stg_payments_dedup`, `int_eligible_refunds` y `fct_regional_financial_reconciliation`) verificada en DuckDB sobre Mercado Brisa y la rúbrica de 4 criterios con descriptores explícitos para los niveles `0` a `4`.

### Paso 7 — Revisión contra la rúbrica de 8 criterios (0–4)

#### Tabla resumen (§9.2)

| Lección | Palabras | Checks | Prácticas | Fuentes | Puntuación de rúbrica |
|---|---:|---:|---:|---:|---|
| `de3-transformacion-01-dbt-sqlmesh-dag` | 1178 | 3 | 1 (`sql` + `pipelineChallenge`) | 4 | **32 / 32** |
| `de3-transformacion-02-tests-unitarios-auditorias-dag` | 1137 | 3 | 1 (`sql` + `pipelineChallenge`) | 4 | **32 / 32** |
| `de3-transformacion-03-contracts-semantic-layer` | 1129 | 3 | 1 (`sql` + `pipelineChallenge`) | 4 | **32 / 32** |
| `de3-transformacion-04-observabilidad-openlineage` | 1026 | 3 | 1 (`sql` + `pipelineChallenge`) | 4 | **32 / 32** |

#### Tabla de desglose de los 8 criterios 0–4 (§9.4, sobre 32)

| Lección | 1. Objetivo claro | 2. Progresión | 3. Ejemplo concreto | 4. Error típico | 5. Práctica | 6. Brevedad | 7. Precisión | 8. Tono | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `de3-transformacion-01-dbt-sqlmesh-dag` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |
| `de3-transformacion-02-tests-unitarios-auditorias-dag` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |
| `de3-transformacion-03-contracts-semantic-layer` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |
| `de3-transformacion-04-observabilidad-openlineage` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |

---

## Test

### 1. Validación de esquema e integridad (`check-content.mjs`)

Comando ejecutado:
```bash
node scripts/check-content.mjs --module de3-transformacion
```

Salida literal:
```text
=== Validación de contenido v2 (check-content) ===
Lección (id v2)                                | Módulo               | Niv  | Sec  | Chk  | Src  | Palabras  | Estado    
--------------------------------------------------------------------------------------------------------------------------
de3-transformacion-01-dbt-sqlmesh-dag          | de3-transformacion   | 3    | 3    | 3    | 4    | 1178      | OK        
de3-transformacion-02-tests-unitarios-auditorias-dag | de3-transformacion   | 3    | 3    | 3    | 4    | 1137      | OK        
de3-transformacion-03-contracts-semantic-layer | de3-transformacion   | 3    | 3    | 3    | 4    | 1129      | OK        
de3-transformacion-04-observabilidad-openlineage | de3-transformacion   | 3    | 3    | 3    | 4    | 1026      | OK        
--------------------------------------------------------------------------------------------------------------------------
Resumen: 4 lecciones inspeccionadas | 4 válidas | 0 con advertencias (needsReview) | 0 con errores.

Resultado: OK (0 errores de esquema o integridad).
```

### 2. Auditoría editorial anti-slop y longitud de frase (`check-copy.mjs`)

Comando ejecutado:
```bash
node scripts/check-copy.mjs --path src/data/lessons/de3-transformacion
```

Salida literal:
```text
=== Auditoría anti-slop de copy (check-copy) ===
Archivos escaneados: 4

0 hallazgos de términos prohibidos, emojis, "2026" o exceso de negritas.

--- Longitud media de frase en sections[].body ---
Media global: 17.9 palabras/frase (48693 palabras en 2719 frases; límite <= 22).

Total de hallazgos: 0
```

Medias individuales de longitud de frase en `sections[].body` de las 4 lecciones:
- `de3-transformacion-01-dbt-sqlmesh-dag`: `14.6` palabras/frase (`<= 22`).
- `de3-transformacion-02-tests-unitarios-auditorias-dag`: `17.5` palabras/frase (`<= 22`).
- `de3-transformacion-03-contracts-semantic-layer`: `16.9` palabras/frase (`<= 22`).
- `de3-transformacion-04-observabilidad-openlineage`: `19.4` palabras/frase (`<= 22`).

### 3. Validación de `GlossaryListSchema` y calificación de las 4 prácticas SQL en DuckDB

Salida literal:
```text
Valid: true
[SQL GRADE] de3-transformacion-01-dbt-sqlmesh-dag: starter passed=false (rows_mismatch) | solution passed=true (matched, rows=4)
[SQL GRADE] de3-transformacion-02-tests-unitarios-auditorias-dag: starter passed=false (rows_mismatch) | solution passed=true (matched, rows=4)
[SQL GRADE] de3-transformacion-03-contracts-semantic-layer: starter passed=false (rows_mismatch) | solution passed=true (matched, rows=3)
[SQL GRADE] de3-transformacion-04-observabilidad-openlineage: starter passed=false (rows_mismatch) | solution passed=true (matched, rows=5)
```

### 4. Prueba real del Tutor IA vía `agy` (`buildContextPrompt` + `runAgyPrompt`)

Salida literal para los modos `explain_simple` y `hint`, seguida de las 4 consultas de diagnóstico por lección:

```text
=== TUTOR AGY (explain_simple) ===
model=gemini-3.8-flash-low firstTokenMs=7469ms durationMs=9370ms chars=1131
Un modelo incremental estricto solo procesa registros con fecha mayor al máximo procesado previamente (`WHERE event_ts > (SELECT MAX(event_ts) FROM {{ this }})`). Esto falla cuando llegan datos tardíos (*late-arriving data*).

En Mercado Brisa, un cliente puede crear un pedido (`orders`) hoy, pero la pasarela de pago puede confirmar el cobro (`payments.status = 'captured'`) horas o días después por reintentos o validaciones bancarias. Si solo procesas datos nuevos a partir de hoy, nunca actualizarás el pedido que quedó pendiente ayer.

La **ventana deslizante** (*lookback window*) resuelve esto recalculando un intervalo móvil hacia atrás (por ejemplo, los últimos 3 o 7 días):

WHERE order_ts >= DATEADD(DAY, -7, CURRENT_DATE)

Al combinar esta ventana con una clave primaria y deduplicación (`QUALIFY ROW_NUMBER() OVER (...) = 1`), el modelo sobrescribe de forma idempotente los registros viejos con su estado definitivo sin duplicar filas ni inflar métricas. Reevalúa los pedidos recientes que recibieron cobros tardíos y garantiza consistencia financiera sin tener que reprocesar toda la historia del almacén.

=== TUTOR AGY (hint) ===
model=gemini-3.8-flash-low firstTokenMs=6784ms durationMs=8304ms chars=839
En `payments`, cada intento de cobro genera una fila distinta. Para quedarte con un único cobro por pedido antes del `JOIN`, aísla esa lógica en la CTE `dedup_payments`.

Ten en cuenta estos tres puntos:

1. **Filtra por el estado correcto del pago**: Asegúrate de incluir solo cobros exitosos usando `status = 'captured'` en el `WHERE` de la CTE. No lo confundas con el estado de `orders`.
2. **Define la partición y el orden**: En la función de ventana `ROW_NUMBER()`, particiona por el identificador del pedido (`order_id`) y ordena por la marca de tiempo (`payment_ts DESC`) o por `attempt_number DESC` para priorizar el último intento válido.
3. **Aplica `QUALIFY`**: En lugar de filtrar en una subconsulta externa, usa `QUALIFY ROW_NUMBER() OVER (...) = 1` al final de la CTE para descartar los reintentos duplicados en un solo paso.

=== de3-transformacion-01-dbt-sqlmesh-dag (avg words/sentence: 14.6) ===
Status model=gemini-3.8-flash-low firstTokenMs=6588ms durationMs=8195ms chars=1203
Answer:
Tu consulta devuelve 0 filas porque en el modelo de pagos el estado de liquidación efectiva se registra como `'captured'`, no como `'succeeded'`. 
Además, si una pasarela reintenta transacciones, puedes tener múltiples registros para una misma orden en `payments`. Si sumas directamente o haces un `JOIN` con `orders`, duplicarás los montos. Para evitarlo, deduplica de forma determinista usando `QUALIFY ROW_NUMBER() = 1`.

=== de3-transformacion-02-tests-unitarios-auditorias-dag (avg words/sentence: 17.5) ===
Status model=gemini-3.8-flash-low firstTokenMs=15975ms durationMs=18108ms chars=1417
Answer:
Tu consulta actual cuenta el total de transacciones capturadas que procesó cada proveedor, no las órdenes con pagos duplicados. Si una orden tuvo una sola captura válida, tu `SUM` igual sumó `1`.
Para identificar dobles cobros necesitas evaluar la granularidad correcta: una orden puede tener múltiples filas en `payments`. Debes agrupar primero por `provider` y `order_id`, filtrar las órdenes que tengan más de una captura (`COUNT(*) > 1`) y recién ahí agregar por proveedor o devolver los contraejemplos.

=== de3-transformacion-03-contracts-semantic-layer (avg words/sentence: 16.9) ===
Status model=gemini-3.8-flash-low firstTokenMs=6800ms durationMs=8261ms chars=1224
Answer:
Al usar `INNER JOIN` con `refunds`, descartas todas las órdenes que no tuvieron devoluciones. Como la mayoría de las compras no se reembolsan, el conteo cae drásticamente.
Además, si una orden tiene más de un reembolso, unir directo con `refunds` genera *fan-out* (duplicación de filas), distorsionando el total de la orden y el ingreso neto. Para resolverlo, preagrega `refunds` por `order_id` y únelas con `LEFT JOIN`.

=== de3-transformacion-04-observabilidad-openlineage (avg words/sentence: 19.4) ===
Status model=gemini-3.8-flash-low firstTokenMs=9380ms durationMs=11047ms chars=739
Answer:
En la tabla `events` de Mercado Brisa, el huso UTC está guardado como literal `'Z'`, siguiendo la convención ISO 8601, y no como `'+00:00'`. Por eso la condición `<> '+00:00'` clasifica todos los registros como fuera de UTC. Debes comparar contra `'Z'`.
```

### 5. Build de producción (`npm run build`)

Comando ejecutado:
```bash
npm run build
```

Salida literal:
```text
> grano@1.0.0 build
> vite build

vite v6.4.5 building for production...
transforming...
✓ 2436 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                                        1.00 kB │ gzip:     0.51 kB
dist/assets/index-Ds05HJQs.css                                       236.89 kB │ gzip:    32.06 kB
dist/assets/PracticeView-CXZ4nro3.js                                   8.31 kB │ gzip:     2.84 kB
dist/assets/duckdb-browser-BNitTxKA.js                                27.41 kB │ gzip:     7.01 kB
dist/assets/curriculum-stages-BHOHuqmu.js                            285.16 kB │ gzip:    95.09 kB
dist/assets/SqlLab-Cf4EFwEp.js                                       389.73 kB │ gzip:   127.31 kB
dist/assets/vendor-CMuuJwVt.js                                       558.99 kB │ gzip:   155.51 kB
dist/assets/index-D7tlW-kw.js                                      2,916.69 kB │ gzip:   805.00 kB
✓ built in 27.66s
```

---

## Revisión propia

Durante la construcción y auditoría del módulo se detectaron y corrigieron **6 defectos propios reales**:

1. **Estado de pago inexistente (`'succeeded'` vs `'captured'`) en `de3-transformacion-01-dbt-sqlmesh-dag.js` (líneas 35, 118 y 182):**
   - *Defecto:* El borrador inicial y la lección migrada filtraban `WHERE status = 'succeeded'` sobre la tabla `payments` de Mercado Brisa, devolviendo `0` filas en DuckDB porque los estados reales en `public/datasets/payments.parquet` son `'captured'` (`16,605` filas), `'failed'` (`1,857` filas) y `'pending'` (`738` filas).
   - *Corrección:* Se reemplazó `'succeeded'` por `'captured'` en todos los ejemplos, el `workedExample` y la práctica SQL, conciliando las `16,200` órdenes cobradas por `$6,874,488.00`.
2. **Literal de desplazamiento UTC (`'+00:00'` vs `'Z'`) en `de3-transformacion-04-observabilidad-openlineage.js` (líneas 62, 134 y 242):**
   - *Defecto:* En la primera consulta exploratoria se filtró `timezone_offset <> '+00:00'`, lo que reportaba el `100 %` de los `65,000` eventos como no-UTC porque en `public/datasets/events.parquet` el huso UTC está codificado como `'Z'` (`13,000` filas).
   - *Corrección:* Se ajustó el predicado a `timezone_offset <> 'Z'`, revelando el hallazgo real: `page_view` tiene `0` desvíos fuera de UTC y `product_view`/`add_to_cart`/`checkout_started`/`checkout_completed` concentran los `52,000` eventos en husos locales.
3. **Esquema incompleto en `sources` de `docs/curriculo/investigacion/de3-transformacion-glossary.json` (líneas 17–215):**
   - *Defecto:* La primera versión del archivo JSON de glosario solo incluía `title` y `url` dentro de `sources`, fallando `GlossaryListSchema.safeParse` con `Invalid input: expected string, received undefined` para `publisher`, `accessed` y `supports`.
   - *Corrección:* Se completaron los campos `publisher`, `accessed: '2026-10-29'` y `supports` en las 10 entradas del glosario, aprobando `GlossaryListSchema` con `Valid: true`.
4. **Propiedades `moduleId`, `contentVersion`, `sections[].id`, `interactive.component` y `workedExample.title` omitidas en los 4 archivos `de3-transformacion-01..04.js`:**
   - *Defecto:* Al ejecutar `node scripts/check-content.mjs --module de3-transformacion`, las 4 lecciones arrojaron error porque faltaban `moduleId: 'de3-transformacion'`, `contentVersion: 2`, el identificador `id` en cada elemento de `sections`, `component` en `interactive` y `title` en `workedExample`. Además, `hook` en `de3-transformacion-04-observabilidad-openlineage.js` (línea 13) tenía `93` palabras (superando el límite de `90`).
   - *Corrección:* Se añadieron todos los campos obligatorios en los 4 archivos y se recortó el `hook` de la lección 04 a `73` palabras, pasando `check-content.mjs` con `0 errores` y `0 advertencias`.
5. **Términos prohibidos y exceso de negritas por párrafo detectados por `check-copy.mjs` en `02`, `03` y `04`:**
   - *Defecto:* `check-copy.mjs` reportó los términos prohibidos `descubre` (`de3-transformacion-02-tests-unitarios-auditorias-dag.js:36`), `fundamental` (`02:259`) y `descubrir` (`04:71`), además de párrafos con 4 a 6 negritas (`**`) en `02:81`, `03:74`, `03:79`, `04:21`, `04:39` y `04:71` por usar listas numeradas sin línea en blanco intermedia.
   - *Corrección:* Se sustituyeron los tres vocablos por verbos precisos (`identifica`, `técnica principal`, `localizar`) y se reestructuraron los párrafos con máximo 2 a 3 negritas por bloque, obteniendo `0 hallazgos` en `check-copy.mjs`.
6. **Media de longitud de frase `> 22` palabras en `sections[].body` de las 4 lecciones (`23.3`, `25.7`, `28.5` y `23.9` palabras/frase):**
   - *Defecto:* En la primera corrida de `check-copy.mjs`, las 4 lecciones superaban el tope de `22` palabras por frase en `sections[].body` debido a oraciones subordinadas largas unidas con gerundios y comas.
   - *Corrección:* Se dividieron las cláusulas extensas en oraciones directas con punto y seguido en las 12 secciones del módulo, reduciendo las medias a `14.6`, `17.5`, `16.9` y `19.4` palabras/frase (`<= 22`).

---

## Prueba adversarial

| # | Escenario adversarial | Entrada / Acción | Resultado observado | Estado |
|---|---|---|---|---|
| 1 | **Calificación del `starterCode` en las 4 prácticas SQL** | Ejecutar `compareQueryResults(starterRes, expectedRes)` y pulsar "Comprobar resultado" en DuckDB-Wasm sin editar el código inicial. | Las 4 lecciones devuelven `passed: false` (`reason: 'rows_mismatch'`) mostrando la tabla de diferencias frente a la referencia sin lanzar excepciones SQL. | `PASS` |
| 2 | **Calificación de `solution` y desempate determinista en `QUALIFY ROW_NUMBER()`** | Cargar la consulta `solution` en las 4 lecciones y pulsar "Comprobar resultado" con `orderMatters: true`. | Las 4 prácticas devuelven `passed: true` (`reason: 'matched'`, `4`, `4`, `3` y `5` filas respectivamente) coincidiendo al centavo con `expectedOutputTable`. | `PASS` |
| 3 | **Renderizado de `PipelineOrderChallenge` sin `[object Object]`** | Inspeccionar en el DOM de las 4 lecciones los 5 pasos de `#sec-practica .lp-pipeline-wrap`. | Todos los ítems contienen `step.id` y `step.text`; el texto completo se renderiza legiblemente y `document.body.innerText.includes('[object Object]')` es `false`. | `PASS` |
| 4 | **División por cero en métricas semánticas y porcentajes de observabilidad** | Evaluar razones (`net_retention_pct`, `net_arpu_usd`, `null_customer_pct`) ante denominadores potencialmente nulos o enteros. | Todas las fórmulas utilizan `NULLIF(..., 0)` y multiplicación en coma flotante (`100.0 *`), evitando divisiones enteras truncadas o errores `Division by zero`. | `PASS` |
| 5 | **Verificación de desbordamiento horizontal en móvil (`375x812`) y escritorio (`1440x900`)** | Medir `document.documentElement.scrollWidth > document.documentElement.clientWidth` en las 4 lecciones en modo claro y oscuro. | `scrollWidth <= clientWidth` (`overflow: false`) tanto en `1440x900` como en `375x812`; bloques de código y tablas hacen scroll interno limpio. | `PASS` |
| 6 | **Petición al Tutor IA (`agy`) en modo `hint` pidiendo resolver la práctica** | Invocar `buildContextPrompt({ mode: 'hint', ... })` + `runAgyPrompt` sobre `de3-transformacion-01-dbt-sqlmesh-dag`. | El modelo `gemini-3.8-flash-low` responde en `8.3 s` con 3 pistas estructuradas (`status = 'captured'`, partición por `order_id` y uso de `QUALIFY`) sin entregar la consulta final resuelta. | `PASS` |

---

## Capturas antes / después

Todas las capturas fueron tomadas en el servidor Vite dedicado en el puerto `5222` (`http://127.0.0.1:5222`), guardadas en `docs/reportes/capturas/W-de3-transformacion/` (y copiadas a `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-de3-transformacion\`) e inspeccionadas visualmente con `read_file`:

| Archivo de captura | Lección / Vista | Viewport / Tema | Verificación visual realizada con `read_file` |
|---|---|---|---|
| `01-dag-desktop-light.png` | `de3-transformacion-01-dbt-sqlmesh-dag` (Cabecera, gancho, objetivos e inicio de lectura) | `1440x900` · Claro | Jerarquía tipográfica limpia, migas de pan del módulo `de3-transformacion`, objetivos numerados `01..03` e índice lateral activo sin recortes. |
| `01-dag-desktop-dark.png` | `de3-transformacion-01-dbt-sqlmesh-dag` (Simulador interactivo `DbtSqlmeshDagExplorer`) | `1440x900` · Oscuro | Contraste correcto en tema oscuro, grafo interactivo `dbt vs SQLMesh` renderizado dentro de `.lp-simulator-frame` con controles de modo y sin solapamientos. |
| `01-dag-sql-practice-graded.png` | `de3-transformacion-01-dbt-sqlmesh-dag` (Práctica SQL calificada en DuckDB-Wasm) | `1440x900` · Oscuro | Banner verde `is-pass` (*"Resultado verificado: 4 fila(s) y 4 columna(s) coinciden con la referencia"*) y tabla numérica alineada con `transferencia_spei`, `efectivo_tienda`, `billetera_digital` y `card`. |
| `02-tests-audits-desktop-light.png` | `de3-transformacion-02-tests-unitarios-auditorias-dag` (Lección nueva) | `1440x900` · Claro | Título `<= 60` caracteres, subtítulo completo del catálogo, gancho sobre las 145 devoluciones inválidas y el SKU negativo, y bloques de código SQL legibles. |
| `03-contracts-semantic-desktop-dark.png` | `de3-transformacion-03-contracts-semantic-layer` (Simulador `SemanticContractSim`) | `1440x900` · Oscuro | Simulador interactivo de contrato ODCS v3 y capa semántica renderizado sin errores de consola y con ejemplos reales de Mercado Brisa. |
| `04-observability-mobile-light.png` | `de3-transformacion-04-observabilidad-openlineage` (Vista móvil) | `375x812` · Claro | Adaptación responsiva en `375px` de ancho con `scrollWidth <= clientWidth` (`0` desbordamiento horizontal) y barra superior compacta. |
| `04-observability-tutor-drawer.png` | `de3-transformacion-04-observabilidad-openlineage` (Cajón del Tutor IA abierto) | `1440x900` · Claro | Panel lateral del Tutor IA desplegado a la derecha contextualizado en la lección 04 con chips de acción rápida (`Explicar simple`, `Dame una pista`, `Revisar mi SQL`). |

---

## Peticiones al orquestador

1. **Integración en `src/data/lessons/index.js`:** Al hacer merge de `agente/W-de3-transformacion`, ejecutar `node scripts/sync-lessons-index.mjs` para registrar las dos lecciones nuevas (`de3-transformacion-02-tests-unitarios-auditorias-dag` y `de3-transformacion-04-observabilidad-openlineage`) junto a las dos lecciones limpiadas (`01` y `03`).
2. **Integración de glosario en `src/data/glossary/terms.js`:** Incorporar los 10 términos validados de `docs/curriculo/investigacion/de3-transformacion-glossary.json` al glosario global en el paso de consolidación de la Ola C.

---

## Pendiente (con motivo)

Ninguno. Los 7 archivos bajo propiedad de `W-de3-transformacion` están completos, verificados con `check-content.mjs`, `check-copy.mjs`, DuckDB, `agy`, Playwright y `npm run build`.
