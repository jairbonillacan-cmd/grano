# W-de4-streaming — Flujos en tiempo real y CDC

**Fecha:** 2026-10-30
**Rama / Worktree:** `agente/W-de4-streaming` (`C:\Users\T490s\Desktop\Proyectos\ING-W-de4-streaming`)
**Puerto de pruebas:** `5223` (exclusivo)

---

## Inicio

Archivos del repositorio leídos antes de iniciar la escritura e implementación:

- `PLAN_GEMINI_4_ARGON.md`: define el flujo obligatorio de 7 pasos de los agentes Writer (§9.2), el contrato del esquema de lección v2 (§6.1), las reglas editoriales anti-slop (§8) y la rúbrica de autoevaluación de 8 criterios de 0 a 4 puntos con corte `>= 26/32` y ningún criterio `< 3` (§9.4).
- `src/data/catalog/modules.js`: especifica el módulo `de4-streaming` (*Flujos en tiempo real y CDC*, `level: 4`, `area: 'de'`, `estimatedHours: 3.5`, `prerequisites: ['de2-pipelines', 'de3-lakehouse']`, `milestoneProjectId: 'p-de4-streaming'`) y sus 5 lecciones (`de4-streaming-01` y `de4-streaming-03` con estado `existing` y `legacyId` `l16-cdc-kafka-streaming` / `l17-flink-watermarks-mv`; `de4-streaming-02`, `de4-streaming-04` y `de4-streaming-05` con estado `planned`).
- `src/data/schema/lesson.js`: define `LessonSchema` con Zod, exigiendo presupuesto de `700..1500` palabras totales, `hook` de `40..90` palabras con mención a *Mercado Brisa*, `3..5` objetivos accionables, `3..4` secciones de `160..320` palabras con `commonPitfalls` (`>= 2`), `workedExample` con `>= 2` pasos, `practice` ejecutable con `starterCode != solution` y `1..3` `hints`, `3..4` `checks` con `explanation` de `20..60` palabras, `roleNotes` (`de`, `da`, `bi`), `summary` (`3..5` puntos) y `>= 2` `sources` con URLs `https://` y fecha ISO `YYYY-MM-DD`.
- `src/data/schema/glossary.js`: define `GlossaryTermSchema` y `GlossaryListSchema`, requiriendo `id` en kebab-case, `term`, `area`, `level` (`0..4`), `definition` concisa y `example` contextualizado en Mercado Brisa con longitud entre `10` y `60` palabras.
- `public/datasets/README.md`: documenta el caso transversal **Mercado Brisa** y las anomalías deliberadas sembradas en los Parquet: `customer_changes` (`4 100` filas SCD2 con clientes que cambian de `tier` y `segment`), `events` (`65 000` filas con `customer_id IS NULL` en sesiones anónimas y desfases de huso horario), `orders` (`18 000` filas), `payments` (`19 200` filas con `405` cobros `captured` duplicados por reenvío de webhook con el mismo `idempotency_key` a `+4 s` y `675` reintentos tardíos a `+110 s`), `refunds` (`1 450` filas) y `stores` (`14` tiendas).
- `public/datasets/schema.json`: detalla la estructura física y tipos de columna de las 13 tablas Parquet (`customer_changes.valid_from`, `customers.current_tier`, `events.customer_id`, `orders.order_ts`, `payments.idempotency_key`, `payments.payment_ts`, `refunds.refund_amount_usd`, `stores.store_type`), permitiendo construir consultas SQL 100 % ejecutables en DuckDB.
- `scripts/check-content.mjs`: valida cada lección contra `LessonSchema`, verifica que los enlaces cruzados (`prerequisites`, `relatedLessons`, `moduleId`) existan en el catálogo y exige que `starterCode` normalizado sea distinto de `solution`.
- `scripts/check-copy.mjs`: audita la ausencia de 22 palabras/frases prohibidas, emojis, la cadena `"2026"` fuera de `sources`, párrafos con más de 2 negritas `**...**` y oraciones con media superior a `22` palabras por frase en `sections[].body`.
- `server/ai/contextBuilder.js`: construye el prompt contextualizado para el tutor `agy` (`buildContextPrompt`) soportando `customLesson` en memoria y los modos `tutor`, `hint`, `explain-error`, `review-sql`, `interview` y `quiz`.
- `server/ai/agyRunner.js`: ejecuta el binario `agy chat --mode agent -m <model>` pasando el prompt por `stdin` y devolviendo `{ text, model, durationMs, firstTokenMs, chars }`.
- `src/lab/sqlGrader.js`: implementa `compareQueryResults` y `gradeSqlPractice` en DuckDB-Wasm; revela que `const referenceSql = practice?.expected || practice?.solution` ejecuta `practice.expected` como SQL si está definido, por lo que `practice.expected` no debe contener texto descriptivo sino omitirse para que el calificador evalúe `practice.solution`.
- `src/lab/SqlLab.jsx`: monta el editor CodeMirror y los selectores de prueba `[data-testid="sql-lab"]`, `[data-testid="sql-grade-btn"]`, `[data-testid="sql-solution-btn"]`, `[data-testid="sql-solution-box"]`, `[data-testid="sql-grade-box"]` y `[data-testid="sql-review-ai-btn"]`.
- `src/views/LessonPlayer.jsx`: renderiza las secciones de la lección v2 con `id="sec-<sectionId>"`, el componente interactivo `sections[].interactive.component` (`CdcLogStreamSim`, `KafkaPartitionVisual`, `WatermarkVisual`, `PipelineDagSim`) y los bloques de práctica SQL y secuencia de arquitectura (`pipelineChallenge`).
- `docs/reportes/PLANTILLA.md`: establece la estructura obligatoria del reporte de agente, incluyendo `## Inicio`, `## Pasos`, `## Test`, `## Revisión propia`, `## Prueba adversarial`, `## Capturas antes / después`, `## Peticiones al orquestador` y `## Pendiente (con motivo)`.

---

## Pasos

### Paso 1: Investigación web y verificación de fuentes primarias

Se consultaron y verificaron con `HTTP 200 OK` (fecha de acceso `2026-10-29`) 16 fuentes primarias de documentación oficial y especificaciones técnicas:
- **Debezium & PostgreSQL 17 Logical Decoding:** documentación oficial del conector PostgreSQL de Debezium (`pgoutput`, estructura de eventos `before`/`after`/`op`/`source.lsn`, snapshots `incremental` vs `initial`), *Outbox Event Router* SMT y documentación oficial de PostgreSQL 17 cap. 47 (*Logical Decoding* y riesgo de retención de segmentos WAL por `replication slots` inactivos mitigado con `max_slot_wal_keep_size`).
- **Apache Kafka 4.0, KIP-833 y KIP-405:** notas de lanzamiento de Apache Kafka 4.0 y KIP-833 (eliminación definitiva de Apache ZooKeeper y quórum de controladores KRaft sobre `__cluster_metadata`), diseño de particionamiento `murmur2` / réplicas `ISR` y KIP-405 (*Tiered Storage* para desacoplar almacenamiento local NVMe y almacenamiento de objetos S3/GCS).
- **Apache Flink 1.20 (Watermarks, Interval Joins, Checkpointing y 2PC):** documentación oficial de Flink sobre generadores de marcas de agua (`forBoundedOutOfOrderness` y `withIdleness` para evitar bloqueo del reloj por particiones ociosas), *Interval Joins* acotados en estado RocksDB con *State TTL*, barreras de control de Chandy-Lamport y protocolo de compromiso en dos fases (`TwoPhaseCommitSinkFunction` / `KafkaSink` con `DeliveryGuarantee.EXACTLY_ONCE` e `isolation.level=read_committed`).
- **Vistas materializadas en streaming y OLAP en tiempo real:** documentación de Materialize (*Incremental View Maintenance* sobre *Differential Dataflow*), RisingWave (vistas materializadas incrementales desacopladas en almacenamiento de objetos) y ClickHouse (`ReplacingMergeTree` con deduplicación eventual / `FINAL` y `AggregatingMergeTree` con estados combinadores `-State` / `-Merge`).

### Paso 2: Nota de investigación curricular (`docs/curriculo/investigacion/de4-streaming.md`)

Se redactó `docs/curriculo/investigacion/de4-streaming.md` documentando:
1. Tabla de las 16 fuentes primarias verificadas con URL, título oficial, fecha `2026-10-29` y hallazgos técnicos clave.
2. Mapa de progresión conceptual de las 5 lecciones sin solapamiento entre ellas ni con `c2-dimensional-03-scd2-history`, `de2-pipelines-02-idempotencia-backfill` o `de3-lakehouse-01-iceberg-v3-medallion`.
3. Mapeo de prácticas SQL ejecutables sobre las tablas reales de Mercado Brisa (`customer_changes`, `customers`, `events`, `orders`, `payments`, `refunds`, `stores`).
4. Rúbrica específica del módulo con 4 criterios graduados de 0 a 4 puntos (arquitectura CDC/Outbox, topología Kafka 4.x KRaft/Tiered Storage, semántica temporal/estado en Flink y garantías extremo a extremo con capa de servicio IVM/OLAP).

### Paso 3: Redacción de las 5 lecciones v2 (`src/data/lessons/de4-streaming/`)

Se escribieron y/o reescribieron íntegramente las 5 lecciones del módulo en `src/data/lessons/de4-streaming/`:
- `de4-streaming-01-cdc-kafka-streaming.js` (`legacyId: 'l16-cdc-kafka-streaming'`, `order: 1`, `minutes: 30`): captura basada en el log transaccional (`WAL` + `pgoutput`), anatomía del sobre de Debezium (`before`, `after`, `op`, `source.lsn`), prevención del agotamiento de disco por `replication slots` inactivos (`max_slot_wal_keep_size`), compactación por clave en Kafka (`cleanup.policy=compact` y *tombstones*) y patrón *Transactional Outbox*. Incluye simulador interactivo `CdcLogStreamSim`, práctica SQL real sobre `customer_changes` y `customers` y reto `pipelineChallenge`.
- `de4-streaming-02-kafka-kraft-tiered-storage.js` (`order: 2`, `minutes: 25`): particionamiento determinista `murmur2`, diagnóstico de particiones calientes (*hot partitions*) causadas por claves nulas reemplazadas por constantes estáticas, quórum de consenso KRaft en Apache Kafka 4.0 sin ZooKeeper (`__cluster_metadata`, `acks=all`, `min.insync.replicas=2`) y dimensionamiento de almacenamiento por niveles (*Tiered Storage*, KIP-405). Incluye visualizador `KafkaPartitionVisual`, práctica SQL de auditoría de sesgo de claves nulas sobre `events` (`65 000` filas) y reto `pipelineChallenge`.
- `de4-streaming-03-flink-watermarks-mv.js` (`legacyId: 'l17-flink-watermarks-mv'`, `order: 3`, `minutes: 35`): diferencia entre *Event Time* (normalizado a UTC) y *Processing Time*, marcas de agua por desorden acotado (`forBoundedOutOfOrderness`), prevención del bloqueo del reloj por particiones inactivas (`withIdleness`), *Interval Joins* acotados en tiempo y limpieza de estado en RocksDB (*State TTL*). Incluye visualizador `WatermarkVisual`, práctica SQL sobre `orders` y `payments` que cuantifica los `675` cobros con reintento tardío (`+110 s`, `\$288 589,29 USD`) frente a la ventana de `30 s`, y reto `pipelineChallenge`.
- `de4-streaming-04-entrega-at-least-once-exactly-once.js` (`order: 4`, `minutes: 30`): contraste entre entrega *at-least-once* y *exactamente una vez*, algoritmo de barreras de control distribuidas de Chandy-Lamport, protocolo de compromiso en dos fases (*Two-Phase Commit*, 2PC) hacia Kafka con `isolation.level=read_committed`, timeout transaccional (`transaction.timeout.ms`) y diseño de sumideros externos idempotentes por clave (`idempotency_key`). Incluye simulador `PipelineDagSim`, práctica SQL sobre `payments` que aísla los `405` cobros `captured` duplicados (`\$168 674,63 USD` de sobrecobro en bruto) y reto `pipelineChallenge`.
- `de4-streaming-05-vistas-materializadas-streaming-olap.js` (`order: 5`, `minutes: 35`): mantenimiento incremental de vistas (*IVM*) en Materialize y RisingWave mediante deltas de inserción y retracción ($\Delta = +1 / -1$), motores OLAP de baja latencia en ClickHouse (`ReplacingMergeTree` con deduplicación eventual y `AggregatingMergeTree` con estados combinadores), prevención de explosión de filas (*fan-out*) mediante preagregación por grano antes de unir flujos 1:N, y guía del proyecto integrador `p-de4-streaming`. Incluye simulador `PipelineDagSim`, práctica SQL multi-CTE sobre `stores`, `orders`, `payments` y `refunds`, y reto `pipelineChallenge`.

### Paso 4: Verificación de prácticas ejecutables en DuckDB y tutor `agy`

Se verificaron las 5 prácticas SQL contra los archivos Parquet reales de `public/datasets/` usando `@duckdb/node-api` y `compareQueryResults` (`src/lab/sqlGrader.js`), comprobando que los 5 `starterCode` son consultas SQL válidas que devuelven un resultado incompleto (`passed: false`) y que las 5 `solution` devuelven el resultado exacto (`passed: true`). Asimismo, se ejecutó el CLI real `agy` a través de `buildContextPrompt` y `runAgyPrompt` para los modos `tutor` (`explain_simple`) y `hint` en las 5 lecciones.

### Paso 5: Glosario del módulo (`docs/curriculo/investigacion/de4-streaming-glossary.json`)

Se creó `docs/curriculo/investigacion/de4-streaming-glossary.json` con 10 términos técnicos del módulo (`captura-cambios-log-wal`, `patron-transactional-outbox`, `particionamiento-hash-kafka`, `consenso-kraft-kafka`, `almacenamiento-niveles-kafka`, `marca-agua-acotada-flink`, `join-intervalo-temporal`, `barreras-checkpoint-chandy-lamport`, `entrega-exactamente-una-vez-2pc`, `vista-materializada-incremental-streaming`). Se validó contra `GlossaryListSchema` (`valid: true`) y se comprobó que cada definición tiene entre 23 y 25 palabras (`<= 25` palabras según §9.2 y `>= 20` según `GlossaryTermSchema`).

### Paso 6: Validadores de contenido, copy anti-slop y recorrido Playwright

Se ejecutaron `node scripts/check-content.mjs --module de4-streaming` (5 válidas, 0 advertencias, 0 errores) y `node scripts/check-copy.mjs --path src/data/lessons/de4-streaming` (0 hallazgos, media de palabras por frase entre `16.7` y `18.3` `<= 22`). A continuación se levantó Vite en el puerto exclusivo `5223` y se recorrieron las 5 lecciones con Playwright en `1440x900` (claro y oscuro) y `375x812` (móvil), ejecutando la calificación SQL (`is-fail` -> `is-pass`) y abriendo el cajón del Tutor IA, generando 22 capturas e inspeccionándolas visualmente.

### Paso 7: Autoevaluación con la rúbrica de 8 criterios (§9.2 y §9.4)

#### Tabla resumen (§9.2)

| Lección | Palabras | Checks | Prácticas | Fuentes | Puntuación de rúbrica |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `de4-streaming-01-cdc-kafka-streaming` | 1 159 | 4 | 1 SQL + 1 DAG (`pipelineChallenge`) | 3 | 31 / 32 |
| `de4-streaming-02-kafka-kraft-tiered-storage` | 1 204 | 4 | 1 SQL + 1 DAG (`pipelineChallenge`) | 3 | 31 / 32 |
| `de4-streaming-03-flink-watermarks-mv` | 1 269 | 4 | 1 SQL + 1 DAG (`pipelineChallenge`) | 3 | 32 / 32 |
| `de4-streaming-04-entrega-at-least-once-exactly-once` | 1 242 | 4 | 1 SQL + 1 DAG (`pipelineChallenge`) | 3 | 31 / 32 |
| `de4-streaming-05-vistas-materializadas-streaming-olap` | 1 316 | 4 | 1 SQL + 1 DAG (`pipelineChallenge`) | 4 | 32 / 32 |

#### Desglose de los 8 criterios de la rúbrica (§9.4, escala 0–4)

| Lección | 1. Objetivo claro | 2. Progresión | 3. Ejemplo concreto | 4. Error típico | 5. Práctica | 6. Brevedad | 7. Precisión | 8. Tono | Total |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `de4-streaming-01-cdc-kafka-streaming` | 4 | 4 | 4 | 4 | 4 | 3 | 4 | 4 | **31 / 32** |
| `de4-streaming-02-kafka-kraft-tiered-storage` | 4 | 4 | 4 | 4 | 4 | 3 | 4 | 4 | **31 / 32** |
| `de4-streaming-03-flink-watermarks-mv` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |
| `de4-streaming-04-entrega-at-least-once-exactly-once` | 4 | 4 | 4 | 4 | 4 | 3 | 4 | 4 | **31 / 32** |
| `de4-streaming-05-vistas-materializadas-streaming-olap` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |

Todas las lecciones superan holgadamente el umbral `>= 26/32` sin ningún criterio `< 3`.

---

## Test

### 1. Validador de esquema e integridad (`check-content.mjs`)

Comando ejecutado:
```bash
node scripts/check-content.mjs --module de4-streaming
```

Salida literal:
```text
=== Validación de contenido v2 (check-content) ===
Lección (id v2)                                | Módulo               | Niv  | Sec  | Chk  | Src  | Palabras  | Estado    
--------------------------------------------------------------------------------------------------------------------------
de4-streaming-01-cdc-kafka-streaming           | de4-streaming        | 4    | 3    | 4    | 3    | 1159      | OK        
de4-streaming-02-kafka-kraft-tiered-storage    | de4-streaming        | 4    | 3    | 4    | 3    | 1204      | OK        
de4-streaming-03-flink-watermarks-mv           | de4-streaming        | 4    | 3    | 4    | 3    | 1269      | OK        
de4-streaming-04-entrega-at-least-once-exactly-once | de4-streaming        | 4    | 3    | 4    | 3    | 1242      | OK        
de4-streaming-05-vistas-materializadas-streaming-olap | de4-streaming        | 4    | 4    | 4    | 4    | 1316      | OK        
--------------------------------------------------------------------------------------------------------------------------
Resumen: 5 lecciones inspeccionadas | 5 válidas | 0 con advertencias (needsReview) | 0 con errores.

Resultado: OK (0 errores de esquema o integridad).
```

### 2. Auditoría anti-slop y longitud de frase (`check-copy.mjs`)

Comando ejecutado:
```bash
node scripts/check-copy.mjs --path src/data/lessons/de4-streaming
```

Salida literal:
```text
=== Auditoría anti-slop de copy (check-copy) ===
Archivos escaneados: 5

0 hallazgos de términos prohibidos, emojis, "2026" o exceso de negritas.

Total de hallazgos: 0
```
*(Media de longitud de frase verificada por lección en `sections[].body`: L1 = `17.2`, L2 = `18.3`, L3 = `17.3`, L4 = `16.7`, L5 = `17.1` palabras/frase; todas `<= 22`).*

### 3. Ejecución de SQL y calificador (`sqlGrader.js`) sobre Parquet reales en DuckDB

Salida literal de la verificación sobre `public/datasets/*.parquet`:
```text
=== Verificación DuckDB + sqlGrader (5 lecciones de4-streaming) ===
de4-streaming-01-cdc-kafka-streaming: starterCode passed=false (8 fila(s) esperada(s) no aparecen en tu resultado. 8 fila(s) de tu resultado no coinciden con la referencia.) | solution passed=true (Resultado verificado: 8 fila(s) y 4 columna(s) coinciden con la referencia.) | rows=8
de4-streaming-02-kafka-kraft-tiered-storage: starterCode passed=false (Filas esperadas: 7 · Filas obtenidas: 15. 7 fila(s) esperada(s) no aparecen en tu resultado. 15 fila(s) de tu resultado no coinciden con la referencia.) | solution passed=true (Resultado verificado: 7 fila(s) y 5 columna(s) coinciden con la referencia.) | rows=7
de4-streaming-03-flink-watermarks-mv: starterCode passed=false (4 fila(s) esperada(s) no aparecen en tu resultado. 4 fila(s) de tu resultado no coinciden con la referencia.) | solution passed=true (Resultado verificado: 4 fila(s) y 5 columna(s) coinciden con la referencia.) | rows=4
de4-streaming-04-entrega-at-least-once-exactly-once: starterCode passed=false (4 fila(s) esperada(s) no aparecen en tu resultado. 4 fila(s) de tu resultado no coinciden con la referencia.) | solution passed=true (Resultado verificado: 4 fila(s) y 7 columna(s) coinciden con la referencia.) | rows=4
de4-streaming-05-vistas-materializadas-streaming-olap: starterCode passed=false (3 fila(s) esperada(s) no aparecen en tu resultado. 3 fila(s) de tu resultado no coinciden con la referencia.) | solution passed=true (Resultado verificado: 3 fila(s) y 6 columna(s) coinciden con la referencia.) | rows=3
```

### 4. Prueba real del tutor `agy` (`explain_simple` y `hint`)

Salida literal de `explain_simple` (`mode: 'tutor'`) sobre `de4-streaming-01-cdc-kafka-streaming`:
```text
=== Prueba agy explain_simple (tutor) en de4-streaming-01 ===
model: gemini-3.8-flash-low | durationMs: 9868 | firstTokenMs: 7056 | chars: 1679
Un *replication slot* es un marcador o cursor administrado por PostgreSQL que rastrea la posición exacta del último cambio confirmado por un consumidor externo, como Debezium. 

En PostgreSQL, cualquier operación (`INSERT`, `UPDATE`, `DELETE`) en tablas como `customers` o `orders` de Mercado Brisa se escribe primero de forma secuencial en el Write-Ahead Log (`WAL`). En condiciones normales, PostgreSQL elimina o recicla los segmentos antiguos del WAL en cuanto ya no los necesita para recuperación de caídas o puntos de control (*checkpoints*).

Sin embargo, cuando existe un *replication slot*, la base de datos asume una garantía estricta: **no borrará ningún segmento del WAL que el consumidor aún no haya confirmado mediante su LSN (*Log Sequence Number*)**. El slot actúa como un ancla que retiene esos archivos en disco.

Si el conector de Debezium se cae, deja de enviar confirmaciones (*acknowledgments*). Mientras tanto, las transacciones operativas de Mercado Brisa continúan generando registros en el WAL. Como el *slot* sigue apuntando a la posición anterior a la caída, PostgreSQL acumula y retiene indefinidamente todos los archivos de WAL generados desde ese instante. Si no intervienes, este crecimiento continuo consume todo el almacenamiento disponible y bloquea la base de datos primaria.

Para mitigar este riesgo, debes definir el parámetro `max_slot_wal_keep_size` en PostgreSQL. Este valor fija un límite máximo de retención para el slot. Si se supera ese umbral de espacio, PostgreSQL invalida el slot y purga el WAL para proteger el disco del servidor, priorizando la disponibilidad de la base de datos operativa sobre la continuidad del flujo de CDC.
```

Salidas literales de `mode: 'hint'` ejecutadas con `runAgyPrompt` (`gemini-3.8-flash-low`) en las 5 lecciones:
```text
--- Testing agy on de4-streaming-01-cdc-kafka-streaming ---
Duration: 17352ms, Chars: 392
Para consolidar el historial CDC en `cambios_ordenados`, usa `ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY valid_from DESC, change_id DESC) AS rn`. Así numeras cada cambio por cliente desde el más reciente (`rn = 1`) y desempatas eventos con la misma marca temporal antes de cruzar con `customers`.

--- Testing agy on de4-streaming-02-kafka-kraft-tiered-storage ---
Duration: 10191ms, Chars: 363
Ya tienes el conteo total por grupo; ahora necesitas aislar solo las filas donde `customer_id IS NULL`. Usa una expresión condicional dentro de una agregación, como `SUM(CASE WHEN customer_id IS NULL THEN 1 ELSE 0 END)`, tanto en el `SELECT` (para calcular `null_key_events` y el porcentaje con `100.0 * ... / COUNT(*)`) como en la cláusula `HAVING` para filtrar los grupos con al menos 448 eventos sin clave.

--- Testing agy on de4-streaming-03-flink-watermarks-mv ---
Duration: 10788ms, Chars: 615
Para emular la unión por intervalo temporal en SQL, tras deduplicar `payments` por `idempotency_key` (`rn = 1`), acota el `JOIN` con `orders` exigiendo `AND p.payment_ts BETWEEN o.order_ts AND o.order_ts + INTERVAL '120 seconds'`. Después, en el `SELECT`, clasifica cada cobro comparando `p.payment_ts` contra el umbral `o.order_ts + INTERVAL '30 seconds'`.

--- Testing agy on de4-streaming-04-entrega-at-least-once-exactly-once ---
Duration: 11219ms, Chars: 616
En la CTE `ranked_payments`, asigna `ROW_NUMBER() OVER (PARTITION BY idempotency_key ORDER BY payment_ts ASC, payment_id ASC) AS rn` filtrando `WHERE status = 'captured'`. En la consulta principal, usa `SUM(CASE WHEN rn = 1 THEN amount_usd ELSE 0 END)` para obtener el ingreso exacto deduplicado y réstalo de `SUM(amount_usd)` para cuantificar el sobrecobro por reintentos.

--- Testing agy on de4-streaming-05-vistas-materializadas-streaming-olap ---
Duration: 16016ms, Chars: 512
Antes de unir las devoluciones con `orders`, crea la CTE `order_refunds` agrupando `refunds` (`WHERE status = 'processed'`) por `order_id` para obtener una sola fila por pedido. Así garantizas una relación 1:1 en el `LEFT JOIN` y evitas multiplicar el monto de `dedup_payments`; recuerda envolver la suma de devoluciones en `COALESCE(..., 0)` para los pedidos sin reembolsos.
```

### 5. Verificación visual e interactiva en Playwright (`http://127.0.0.1:5223`)

Se recorrieron las 5 lecciones en Chromium headless verificando:
- **0 errores de consola y 0 `pageerror`** en las 5 lecciones.
- **0 apariciones de `[object Object]`** en el DOM antes y después de interactuar con el laboratorio SQL y los simuladores.
- **0 px de desbordamiento horizontal** (`scrollWidth - clientWidth === 0`) en `1440x900` (tema claro y oscuro) y `375x812` (móvil).
- **Calificación interactiva en `SqlLab`:** en las 5 lecciones, al pulsar `Comprobar resultado` con `starterCode` se muestra la caja de fallo (`is-fail`), y al copiar la consulta de referencia y volver a calificar se muestra `Práctica superada · El resultado coincide con la referencia` (`is-pass`).
- **Cajón del Tutor IA:** al pulsar `Revisar mi consulta con IA` (`[data-testid="sql-review-ai-btn"]`), el cajón lateral se abre con la consulta SQL y el resultado JSON precargados.

### 6. Build de producción (`npm run build`)

Comando ejecutado:
```bash
npm run build
```

Salida literal:
```text
> grano-data-academy@1.0.0 build
> vite build

vite v8.0.8 building client environment for production...
✓ 2437 modules transformed.
dist/index.html                                         1.22 kB │ gzip:   0.61 kB
dist/assets/duckdb-eh-B220364C.wasm                33,574.16 kB
dist/assets/duckdb-mvp-G973059C.wasm               37,935.75 kB
dist/assets/index-D_yL4k8p.css                        102.63 kB │ gzip:  18.92 kB
dist/assets/duckdb-browser-mvp.worker-DjK8bO8P.js     987.21 kB │ gzip: 234.12 kB
dist/assets/duckdb-browser-eh.worker-C8m9aL1R.js    1,004.58 kB │ gzip: 239.45 kB
dist/assets/index-C7mPq2xN.js                       1,412.84 kB │ gzip: 412.37 kB
✓ built in 36.98s
```

---

## Revisión propia

Durante la autorrevisión y las pruebas de extremo a extremo se detectaron y corrigieron **6 defectos reales**:

1. **Prácticas de tipo `fill-blanks` con tablas ficticias en las lecciones heredadas `l16` y `l17`:** Las versiones previas de `de4-streaming-01` (`l16`) y `de4-streaming-03` (`l17`) utilizaban ejercicios de rellenar huecos (`fill-blanks`) sobre tablas inexistentes (`raw_cdc_customers`, `kafka_orders`, `kafka_payments`) que no podían ejecutarse en DuckDB-Wasm. Se sustituyeron por prácticas `type: 'sql'` 100 % ejecutables sobre los Parquet reales de Mercado Brisa (`customer_changes`, `customers`, `orders`, `payments`).
2. **Incompatibilidad de `practice.expected` con `src/lab/sqlGrader.js` en el navegador:** En la primera versión de las 5 lecciones se incluyó el campo opcional `practice.expected` con un resumen textual (`"8 filas (cdc_tier, is_active, ...)"`). Al probar la calificación en Playwright con `SqlLab.jsx`, DuckDB-Wasm lanzó `Parser Error: syntax error at or near "8"` porque `gradeSqlPractice` (`src/lab/sqlGrader.js:208`) evalúa `const referenceSql = practice?.expected || practice?.solution` y ejecuta `referenceSql` como SQL. Se eliminó `practice.expected` de las 5 lecciones para que `sqlGrader.js` ejecute `practice.solution` como consulta de referencia.
3. **Alineación de `starterCode` ejecutable en las 5 lecciones:** En la primera iteración, `starterCode` en L1, L3, L4 y L5 tenía comentarios `/* COMPLETA */` en medio de cláusulas `SELECT` o `WHERE` vacías que producían errores de sintaxis en lugar de mostrar la tabla comparativa de diferencias (`MiniDiffTable`) de `SqlLab`. Se rediseñaron los 5 `starterCode` como consultas SQL sintácticamente válidas sobre las columnas exactas de Mercado Brisa que devuelven resultados parciales (`is-fail`) hasta que el estudiante completa la ventana `ROW_NUMBER()` o las métricas condicionales.
4. **Exceso de longitud media de frase (`> 22` palabras/frase) y abuso de negritas en `l16` y `l17`:** Las lecciones heredadas tenían medias de `26.9` y `29.8` palabras por oración y párrafos con 5 a 7 negritas seguidas. Al reescribir las 5 lecciones del módulo se dividieron las oraciones subordinadas largas y se eliminaron las negritas decorativas, dejando la media entre `16.7` y `18.3` palabras/frase y 0 hallazgos en `check-copy.mjs`.
5. **Término prohibido (`fundamental`) y comilla simple sin escapar en borradores iniciales:** En el primer borrador de `de4-streaming-02` apareció una comilla simple sin escapar alrededor de `'ANONIMO'` dentro de un string JS delimitado por comillas simples, y en `de4-streaming-05` apareció la palabra prohibida `fundamental` (línea 112). Ambos fueron detectados por `node scripts/check-copy.mjs` y corregidos de inmediato.
6. **Ajuste del presupuesto de palabras en `de4-streaming-glossary.json`:** En la primera redacción del glosario, 3 de las 10 definiciones tenían entre 26 y 28 palabras (superando el tope `<= 25` palabras de §9.2). Se editaron las 10 definiciones para situarlas exactamente entre 23 y 25 palabras, cumpliendo simultáneamente el mínimo `>= 20` de `GlossaryTermSchema` y el máximo `<= 25` de §9.2.

---

## Prueba adversarial

| # | Escenario adversarial | Entrada / Acción | Resultado observado | Estado |
| :-: | :--- | :--- | :--- | :---: |
| 1 | Calificación directa del `starterCode` sin modificar en las 5 lecciones | Pulsar `Comprobar resultado` (`[data-testid="sql-grade-btn"]`) nada más abrir cada lección | Los 5 `starterCode` se ejecutan en DuckDB-Wasm sin error de sintaxis y el calificador devuelve `passed: false` (`is-fail`) mostrando en `MiniDiffTable` las filas esperadas que faltan y las sobrantes | PASS |
| 2 | Desempate determinista ante colisión de marcas temporales en CDC (`de4-streaming-01`) | Múltiples cambios de un mismo `customer_id` en `customer_changes` | La ventana `ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY valid_from DESC, change_id DESC)` desempata por `change_id DESC`, consolidando exactamente `2 400` clientes únicos que cuadran al 100 % con `customers` | PASS |
| 3 | División entera vs decimal en porcentaje de claves nulas de Kafka (`de4-streaming-02`) | Cálculo de `null_key_pct` sobre `events` (`65 000` filas) con `SUM(...) / COUNT(*)` | El uso de `ROUND(100.0 * SUM(...) / COUNT(*), 2)` fuerza aritmética en coma flotante en DuckDB y evita el truncamiento entero, devolviendo las 7 combinaciones con `>= 448` eventos anónimos (`15,96 %` a `14,68 %`) | PASS |
| 4 | Duplicados de webhook (`+4 s`) mezclados con reintentos tardíos (`+110 s`) en `payments` (`de4-streaming-03` y `04`) | Cruce de `orders` y `payments` sin deduplicar previamente por `idempotency_key` | Sin la CTE de deduplicación (`PARTITION BY idempotency_key ORDER BY payment_ts ASC, payment_id ASC`), los `405` webhooks repetidos inflan el ingreso en `\$168 674,63 USD`; con `rn = 1` se aíslan exactamente los `16 200` cobros únicos (`\$6 874 488,00 USD`) y los `675` reintentos tardíos (`\$288 589,29 USD`) | PASS |
| 5 | Riesgo de explosión de filas (*fan-out*) al unir `orders`, `payments` y `refunds` (`de4-streaming-05`) | Pedido con múltiples intentos en `payments` y devoluciones en `refunds` más pedidos sin devolución (`NULL`) | Al preagregar `order_refunds` por `order_id` (`status = 'processed'`) y deduplicar `dedup_payments` (`rn = 1`) antes del `LEFT JOIN`, ambas CTEs quedan a grano 1:1 con `orders` y `COALESCE(SUM(r.refunded_usd), 0)` evita que `NULL` anule la resta `net_revenue_usd` | PASS |
| 6 | Viewport móvil estrecho (`375x812`) con tablas de resultados SQL anchas (6–7 columnas) y diagramas interactivos | Redimensionar a `375x812` en las 5 lecciones y medir `document.documentElement.scrollWidth - document.documentElement.clientWidth` | El contenedor `.sql-table-scroll` absorbe el desplazamiento horizontal internamente y el documento global mantiene `0 px` de overflow horizontal en las 5 lecciones | PASS |

---

## Capturas antes / después

*(Las lecciones `02`, `04` y `05` son nuevas; `01` y `03` fueron migradas al esquema v2 con prácticas SQL reales sobre Mercado Brisa. Todas las capturas verificadas en `1440x900` claro/oscuro, `375x812` móvil, SQL Lab calificado y Tutor IA abierto se encuentran en `docs/reportes/capturas/W-de4-streaming/`):*

- **Lección 1 (`de4-streaming-01-cdc-kafka-streaming`):**
  - Vista escritorio claro (`1440x900`): `docs/reportes/capturas/W-de4-streaming/L01-de4-streaming-01-cdc-kafka-streaming-desktop-light.png`
  - Vista escritorio oscuro (`1440x900`): `docs/reportes/capturas/W-de4-streaming/L01-de4-streaming-01-cdc-kafka-streaming-desktop-dark.png`
  - Vista móvil (`375x812`): `docs/reportes/capturas/W-de4-streaming/L01-de4-streaming-01-cdc-kafka-streaming-mobile-375x812.png`
  - Práctica SQL superada (`is-pass`): `docs/reportes/capturas/W-de4-streaming/L01-de4-streaming-01-cdc-kafka-streaming-sqllab-pass.png`
  - Cajón del Tutor IA abierto (`review-sql`): `docs/reportes/capturas/W-de4-streaming/L01-de4-streaming-01-cdc-kafka-streaming-tutor-drawer.png`
- **Lección 2 (`de4-streaming-02-kafka-kraft-tiered-storage`):**
  - Vista escritorio claro (`1440x900`): `docs/reportes/capturas/W-de4-streaming/L02-de4-streaming-02-kafka-kraft-tiered-storage-desktop-light.png`
  - Vista escritorio oscuro (`1440x900`): `docs/reportes/capturas/W-de4-streaming/L02-de4-streaming-02-kafka-kraft-tiered-storage-desktop-dark.png`
  - Vista móvil (`375x812`): `docs/reportes/capturas/W-de4-streaming/L02-de4-streaming-02-kafka-kraft-tiered-storage-mobile-375x812.png`
  - Práctica SQL superada (`is-pass`): `docs/reportes/capturas/W-de4-streaming/L02-de4-streaming-02-kafka-kraft-tiered-storage-sqllab-pass.png`
- **Lección 3 (`de4-streaming-03-flink-watermarks-mv`):**
  - Vista escritorio claro (`1440x900`): `docs/reportes/capturas/W-de4-streaming/L03-de4-streaming-03-flink-watermarks-mv-desktop-light.png`
  - Vista escritorio oscuro (`1440x900`): `docs/reportes/capturas/W-de4-streaming/L03-de4-streaming-03-flink-watermarks-mv-desktop-dark.png`
  - Vista móvil (`375x812`): `docs/reportes/capturas/W-de4-streaming/L03-de4-streaming-03-flink-watermarks-mv-mobile-375x812.png`
  - Práctica SQL superada (`is-pass`): `docs/reportes/capturas/W-de4-streaming/L03-de4-streaming-03-flink-watermarks-mv-sqllab-pass.png`
  - Cajón del Tutor IA abierto (`review-sql`): `docs/reportes/capturas/W-de4-streaming/L03-de4-streaming-03-flink-watermarks-mv-tutor-drawer.png`
- **Lección 4 (`de4-streaming-04-entrega-at-least-once-exactly-once`):**
  - Vista escritorio claro (`1440x900`): `docs/reportes/capturas/W-de4-streaming/L04-de4-streaming-04-entrega-at-least-once-exactly-once-desktop-light.png`
  - Vista escritorio oscuro (`1440x900`): `docs/reportes/capturas/W-de4-streaming/L04-de4-streaming-04-entrega-at-least-once-exactly-once-desktop-dark.png`
  - Vista móvil (`375x812`): `docs/reportes/capturas/W-de4-streaming/L04-de4-streaming-04-entrega-at-least-once-exactly-once-mobile-375x812.png`
  - Práctica SQL superada (`is-pass`): `docs/reportes/capturas/W-de4-streaming/L04-de4-streaming-04-entrega-at-least-once-exactly-once-sqllab-pass.png`
- **Lección 5 (`de4-streaming-05-vistas-materializadas-streaming-olap`):**
  - Vista escritorio claro (`1440x900`): `docs/reportes/capturas/W-de4-streaming/L05-de4-streaming-05-vistas-materializadas-streaming-olap-desktop-light.png`
  - Vista escritorio oscuro (`1440x900`): `docs/reportes/capturas/W-de4-streaming/L05-de4-streaming-05-vistas-materializadas-streaming-olap-desktop-dark.png`
  - Vista móvil (`375x812`): `docs/reportes/capturas/W-de4-streaming/L05-de4-streaming-05-vistas-materializadas-streaming-olap-mobile-375x812.png`
  - Práctica SQL superada (`is-pass`): `docs/reportes/capturas/W-de4-streaming/L05-de4-streaming-05-vistas-materializadas-streaming-olap-sqllab-pass.png`

---

## Peticiones al orquestador

1. **Regeneración de `src/data/lessons/index.js` al integrar la ola:** ejecutar `node scripts/sync-lessons-index.mjs` tras fusionar la rama `agente/W-de4-streaming` para que las 3 lecciones nuevas (`de4-streaming-02-kafka-kraft-tiered-storage`, `de4-streaming-04-entrega-at-least-once-exactly-once` y `de4-streaming-05-vistas-materializadas-streaming-olap`) queden exportadas en `LESSONS_V2` y su estado pase de `planned` a `existing` en `MODULES`.
2. **Integración de `docs/curriculo/investigacion/de4-streaming-glossary.json`:** fusionar las 10 entradas nuevas del glosario de `de4-streaming` en `src/data/glossary/terms.js` durante el paso de consolidación de archivos compartidos.

---

## Pendiente (con motivo)

Ningún ítem pendiente dentro del alcance de `W-de4-streaming`.
