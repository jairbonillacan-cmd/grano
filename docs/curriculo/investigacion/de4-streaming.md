# Investigación y diseño curricular: `de4-streaming` — Flujos en tiempo real y CDC

**Módulo:** `de4-streaming` (*Flujos en tiempo real y CDC*)
**Pista principal:** Ingeniería de Datos (`de`) — Nivel 4 (Especialización)
**Duración total:** 135 minutos (5 lecciones: 30 + 25 + 30 + 25 + 25 min)
**Prerrequisitos del módulo:** `de3-transformacion` (`de3-transformacion-01-dbt-sqlmesh-dag`, `de3-transformacion-03-contracts-semantic-layer`) y `de3-lakehouse` (`de3-lakehouse-01-iceberg-v3-medallion`)
**Fecha de verificación de fuentes:** `2026-10-29`

---

## 1. Fuentes primarias verificadas por lección

Todas las URLs incluidas a continuación fueron verificadas mediante petición HTTP `GET` con respuesta `200 OK` el `2026-10-29`.

### Lección 1: `de4-streaming-01-cdc-kafka-streaming` (30 min)
*Título:* Captura de cambios (CDC) con Debezium y Kafka (`legacyId: 'l16-cdc-kafka-streaming'`, `legacyOrder: 16`)

1. **Red Hat / Debezium Project — Debezium Connector for PostgreSQL**
   - **URL:** https://debezium.io/documentation/reference/stable/connectors/postgresql.html
   - **Editorial:** Red Hat / Debezium Community
   - **Fecha de acceso:** `2026-10-29` (HTTP 200 OK)
   - **Afirmaciones que respalda:** Arquitectura de lectura del *Write-Ahead Log* (WAL) mediante el plugin nativo `pgoutput` (`wal_level = logical`), estructura del sobre de evento Debezium (`before`, `after`, `op` con códigos `c`, `u`, `d`, `r`, y bloque `source` con `lsn` y `ts_ms`), gestión de *replication slots* y riesgo operativo de saturación de disco en el nodo primario cuando un conector se detiene sin configurar `max_slot_wal_keep_size`.
2. **Red Hat / Debezium Project — Outbox Event Router SMT**
   - **URL:** https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html
   - **Editorial:** Red Hat / Debezium Community
   - **Fecha de acceso:** `2026-10-29` (HTTP 200 OK)
   - **Afirmaciones que respalda:** Solución al problema de doble escritura (*dual write*) mediante el patrón *Transactional Outbox*, estructura canónica de la tabla `outbox` (`id`, `aggregatetype`, `aggregateid`, `type`, `payload`) escrita en la misma transacción ACID local que la tabla operativa, y enrutamiento dinámico a tópicos de Kafka mediante la transformación `io.debezium.transforms.outbox.EventRouter`.
3. **The PostgreSQL Global Development Group — Chapter 47: Logical Decoding Concepts**
   - **URL:** https://www.postgresql.org/docs/current/logicaldecoding-explanation.html
   - **Editorial:** PostgreSQL Documentation
   - **Fecha de acceso:** `2026-10-29` (HTTP 200 OK)
   - **Afirmaciones que respalda:** Decodificación lógica del registro transaccional en flujo ordenado por *Log Sequence Number* (`LSN`), garantías de durabilidad de los *replication slots* (`pg_replication_slots`) y aislamiento de transacciones confirmadas (solo se emiten transacciones con `COMMIT`).

---

### Lección 2: `de4-streaming-02-kafka-kraft-tiered-storage` (25 min)
*Título:* Apache Kafka 4.x: particiones, KRaft y almacenamiento

1. **Apache Software Foundation — Apache Kafka 4.0 Documentation**
   - **URL:** https://kafka.apache.org/40/documentation.html
   - **Editorial:** Apache Software Foundation
   - **Fecha de acceso:** `2026-10-29` (HTTP 200 OK)
   - **Afirmaciones que respalda:** Arquitectura de particionamiento por hash `murmur2(key) mod num_partitions`, garantías de orden estricto únicamente dentro de una misma partición, réplicas *In-Sync* (`ISR`), semántica de `acks=all` con `min.insync.replicas` y eliminación definitiva de Apache ZooKeeper en la rama 4.0.
2. **Apache Software Foundation — KIP-833: Mark KRaft as Production Ready**
   - **URL:** https://cwiki.apache.org/confluence/display/KAFKA/KIP-833%3A+Mark+KRaft+as+Production+Ready
   - **Editorial:** Apache Software Foundation (Kafka Improvement Proposals)
   - **Fecha de acceso:** `2026-10-29` (HTTP 200 OK)
   - **Afirmaciones que respalda:** Sustitución del quórum externo de ZooKeeper por un protocolo de consenso basado en Raft integrado en los controladores de Kafka sobre el tópico interno `__cluster_metadata`, replicación activa de metadatos en memoria hacia controladores en espera (*hot standby*) y escalabilidad a millones de particiones con tiempos de recuperación de controlador en milisegundos.
3. **Apache Software Foundation — KIP-405: Kafka Tiered Storage**
   - **URL:** https://cwiki.apache.org/confluence/display/KAFKA/KIP-405%3A+Kafka+Tiered+Storage
   - **Editorial:** Apache Software Foundation (Kafka Improvement Proposals)
   - **Fecha de acceso:** `2026-10-29` (HTTP 200 OK)
   - **Afirmaciones que respalda:** Separación entre almacenamiento local caliente (*local log*, discos NVMe/SSD en el broker servidos desde el *page cache* para consumidores en tiempo real) y almacenamiento remoto frío (*remote log* en almacenamiento de objetos como S3 o GCS mediante `RemoteStorageManager`), permitiendo retenciones de meses y reconstrucciones (*backfills*) sin sobredimensionar discos locales ni copiar terabytes al reequilibrar brokers.

---

### Lección 3: `de4-streaming-03-flink-watermarks-mv` (30 min)
*Título:* Tiempo de evento y watermarks en Apache Flink (`legacyId: 'l17-flink-watermarks-mv'`, `legacyOrder: 17`)

1. **Apache Software Foundation — Apache Flink: Generating Watermarks & Dealing with Idle Sources**
   - **URL:** https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/datastream/event-time/generating_watermarks/
   - **Editorial:** Apache Software Foundation
   - **Fecha de acceso:** `2026-10-29` (HTTP 200 OK)
   - **Afirmaciones que respalda:** Distinción entre `Event Time` y `Processing Time`, formulación de generadores de marcas de agua por desorden acotado (`forBoundedOutOfOrderness`: $W(t) = \max(\text{event\_time}) - \delta$), regla de avance del *watermark* en operadores con múltiples entradas ($\min(W_1, W_2, \dots, W_k)$) y bloqueo por particiones silenciosas resuelto con `.withIdleness()` / `table.exec.source.idle-timeout`.
2. **Apache Software Foundation — Apache Flink Table API & SQL: Joins (Regular vs Interval Joins)**
   - **URL:** https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/table/sql/queries/joins/
   - **Editorial:** Apache Software Foundation
   - **Fecha de acceso:** `2026-10-29` (HTTP 200 OK)
   - **Afirmaciones que respalda:** Contraste entre un `Regular Join` en streaming (cuyo estado crece indefinidamente si no se configura TTL) y un `Interval Join` acotado temporalmente (`b.ts BETWEEN a.ts - lower_bound AND a.ts + upper_bound`), que permite al motor purgar automáticamente del backend RocksDB los eventos cuyo intervalo ya fue superado por el *watermark*.
3. **Apache Software Foundation — Apache Flink: Working with State and State Time-To-Live (TTL)**
   - **URL:** https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/datastream/fault-tolerance/state/
   - **Editorial:** Apache Software Foundation
   - **Fecha de acceso:** `2026-10-29` (HTTP 200 OK)
   - **Afirmaciones que respalda:** Gestión de estado con clave (*Keyed State*), expiración explícita mediante `StateTtlConfig` y `table.exec.state.ttl`, y compactación incremental en RocksDB para evitar fallos por agotamiento de memoria o disco (`OutOfMemoryError`).

---

### Lección 4: `de4-streaming-04-entrega-at-least-once-exactly-once` (25 min)
*Título:* Semántica at-least-once frente a exactly-once y límites

1. **Apache Software Foundation — Apache Flink: Checkpointing and Barrier Alignment**
   - **URL:** https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/datastream/fault-tolerance/checkpointing/
   - **Editorial:** Apache Software Foundation
   - **Fecha de acceso:** `2026-10-29` (HTTP 200 OK)
   - **Afirmaciones que respalda:** Algoritmo de instantáneas distribuidas asíncronas basado en Chandy-Lamport, inyección de barreras de *checkpoint* en las fuentes, alineación de barreras en operadores con múltiples canales de entrada y diferencias de latencia frente a *unaligned checkpoints* bajo contrapresión (*backpressure*).
2. **Apache Software Foundation — Apache Flink: Apache Kafka Connector & Fault Tolerance**
   - **URL:** https://nightlies.apache.org/flink/flink-docs-stable/docs/connectors/datastream/kafka/
   - **Editorial:** Apache Software Foundation
   - **Fecha de acceso:** `2026-10-29` (HTTP 200 OK)
   - **Afirmaciones que respalda:** Garantías de entrega `DeliveryGuarantee.AT_LEAST_ONCE` frente a `DeliveryGuarantee.EXACTLY_ONCE` en el sumidero de Kafka, uso de transacciones de dos fases (`2PC`) acopladas a la finalización del *checkpoint* y obligación de configurar `isolation.level = read_committed` en los consumidores posteriores.
3. **Apache Software Foundation — An Overview of End-to-End Exactly-Once Processing in Apache Flink**
   - **URL:** https://flink.apache.org/2018/02/28/an-overview-of-end-to-end-exactly-once-processing-in-apache-flink-with-apache-kafka-too/
   - **Editorial:** Apache Flink Official Blog (Apache Software Foundation)
   - **Fecha de acceso:** `2026-10-29` (HTTP 200 OK)
   - **Afirmaciones que respalda:** Ciclo completo de `TwoPhaseCommitSinkFunction` (*beginTransaction*, *preCommit* al recibir la barrera, *commit* tras notificación del *JobManager*), riesgo de bloqueo por transacciones huérfanas si `transaction.timeout.ms` vence durante una caída prolongada, y necesidad de sumideros idempotentes (`UPSERT` / deduplicación por `idempotency_key`) cuando el destino externo no soporta 2PC (APIs HTTP, webhooks, almacenes analíticos).

---

### Lección 5: `de4-streaming-05-vistas-materializadas-streaming-olap` (25 min)
*Título:* Vistas materializadas en streaming y OLAP en vivo

1. **Materialize Inc. — CREATE MATERIALIZED VIEW Documentation**
   - **URL:** https://materialize.com/docs/sql/create-materialized-view/
   - **Editorial:** Materialize Documentation
   - **Fecha de acceso:** `2026-10-29` (HTTP 200 OK)
   - **Afirmaciones que respalda:** Mantenimiento incremental de vistas (*Incremental View Maintenance*, IVM) sobre flujos de cambios mediante *Differential Dataflow*, donde cada mutación se representa como una tupla `(dato, timestamp_lógico, diff)` con `diff = +1` (inserción) o `diff = -1` (retracción), actualizando agregaciones y joins complejos sin recomputar la tabla completa.
2. **RisingWave Labs — What is RisingWave? Streaming SQL & Materialized Views**
   - **URL:** https://docs.risingwave.com/get-started/intro
   - **Editorial:** RisingWave Documentation
   - **Fecha de acceso:** `2026-10-29` (HTTP 200 OK)
   - **Afirmaciones que respalda:** Arquitectura de base de datos en streaming compatible con el protocolo PostgreSQL cuyo estado interno se desacopla en almacenamiento de objetos (motor Hummock sobre S3), permitiendo encadenar vistas materializadas en cascada (*materialized views on materialized views*) y exportar flujos de cambios ya preagregados hacia almacenes OLAP.
3. **ClickHouse Inc. — ReplacingMergeTree Table Engine**
   - **URL:** https://clickhouse.com/docs/en/engines/table-engines/mergetree-family/replacingmergetree
   - **Editorial:** ClickHouse Official Documentation
   - **Fecha de acceso:** `2026-10-29` (HTTP 200 OK)
   - **Afirmaciones que respalda:** Funcionamiento del motor columnar `ReplacingMergeTree(ver)` en ClickHouse: deduplicación asíncrona de filas con la misma clave de ordenación (`ORDER BY`) únicamente durante las fusiones en segundo plano (*background merges*) de partes de datos, lo que obliga a deduplicar en tiempo de consulta (`argMax` o `ROW_NUMBER()`) o usar `FINAL` con el consiguiente coste de CPU.
4. **ClickHouse Inc. — Incremental Materialized Views and AggregatingMergeTree**
   - **URL:** https://clickhouse.com/docs/en/materialized-view/incremental-materialized-view
   - **Editorial:** ClickHouse Official Documentation
   - **Fecha de acceso:** `2026-10-29` (HTTP 200 OK)
   - **Afirmaciones que respalda:** Diferencia estructural entre una vista materializada en Materialize/RisingWave (grafo de flujo con retracciones completas) y una vista materializada incremental en ClickHouse (disparador en tiempo de inserción que evalúa la consulta únicamente sobre el bloque recién insertado y vuelca estados parciales `sumState`/`countState` hacia una tabla `AggregatingMergeTree`).

---

## 2. Mapa de progresión conceptual y uso del almacén Mercado Brisa

Todas las lecciones utilizan las tablas reales en Parquet del almacén de **Mercado Brisa** (empresa ficticia de comercio minorista omnicanal), ejecutadas en el navegador con DuckDB-Wasm:

| Orden | ID de lección | Título corto (≤ 60 car.) | Conceptos nuevos introducidos | Conceptos asumidos (`de3`) | Tablas y anomalías reales de Mercado Brisa utilizadas |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | `de4-streaming-01-cdc-kafka-streaming` | Captura de cambios (CDC) con Debezium y Kafka | CDC basado en log (`WAL` vs *polling*), estructura Debezium (`before`, `after`, `op`, `lsn`), *replication slots*, patrón *Transactional Outbox* y consolidación por versión más reciente. | SCD Tipo 2 (`customer_changes`), idempotencia de ingesta, arquitectura Medallion (`de3-lakehouse`). | `customer_changes` (`4 100` eventos de cambio histórico para `2 400` clientes) y `customers`: reconstrucción del estado vigente por `customer_id` ordenando por `valid_from DESC, change_id DESC` y auditoría de paridad frente a `customers.current_tier` e `is_active`. |
| **2** | `de4-streaming-02-kafka-kraft-tiered-storage` | Apache Kafka 4.x: particiones, KRaft y almacenamiento | Particionamiento por hash de clave, sesgo de partición (*hot partition*) por claves nulas o de baja cardinalidad, réplicas `ISR`, consenso `KRaft` (`__cluster_metadata`, sin ZooKeeper) y *Tiered Storage* (KIP-405). | Particionamiento físico en archivos columnares (`de3-lakehouse-02`) y contratos de esquema (`de3-transformacion-03`). | `events` (`65 000` eventos de clic y telemetría): análisis del sesgo provocado por `customer_id IS NULL` (`14,3 %` en `page_view` y `product_view`, concentrando miles de eventos anónimos en una sola partición si se usa fallback estático) y dimensionamiento de volumen por `event_type` y `device_type`. |
| **3** | `de4-streaming-03-flink-watermarks-mv` | Tiempo de evento y watermarks en Apache Flink | `Event Time` frente a `Processing Time`, formulación de *watermarks* ($W(t) = \max(t_e) - \delta$), bloqueo por particiones inactivas (*idle sources*), ventanas `TUMBLE`/`HOP` e `Interval Joins` con estado acotado en RocksDB. | Uniones temporales `ASOF JOIN` (`de3-lakehouse-03`) y modelado incremental (`de3-transformacion-01`). | `events` (`event_ts` UTC vs `event_ts_raw` con 5 husos horarios `-06:00`, `-05:00`, `-03:00`, `Z`, `+01:00`) y cruce `orders` + `payments`: medición del impacto de un límite de ventana estrecho (`30 s`) que captura el intento 1 (`+15 s`) pero descarta los `675` reintentos legítimos (`attempt_number = 2` a `+110 s`, por `$288 589,29 USD`) que sí se recuperan con un intervalo acotado de `120 s`. |
| **4** | `de4-streaming-04-entrega-at-least-once-exactly-once` | Semántica at-least-once frente a exactly-once y límites | `At-least-once` vs `exactly-once`, barreras de *checkpoint* Chandy-Lamport, *Two-Phase Commit* (`2PC`), `isolation.level = read_committed` en Kafka, y deduplicación idempotente cuando el destino externo no soporta 2PC. | Contratos de datos, claves primarias e integridad referencial (`de3-transformacion-03`). | `payments` (`19 200` filas totales para `18 000` pedidos): separación entre los `750` reintentos legítimos (`attempt_number = 2` con nueva `idempotency_key`) y los `450` webhooks duplicados (`405` de ellos en estado `captured` con la misma `idempotency_key` 4 segundos después), cuantificando la sobrefacturación exacta de `$168 674,63 USD` por método de pago. |
| **5** | `de4-streaming-05-vistas-materializadas-streaming-olap` | Vistas materializadas en streaming y OLAP en vivo | Mantenimiento incremental de vistas (*IVM*) con pares de inserción/retracción (`+1`/`-1`) en Materialize y RisingWave frente a motores OLAP en tiempo real en ClickHouse (`ReplacingMergeTree`, `AggregatingMergeTree`) y disparadores en inserción. | Modelos incrementales en lote (`dbt`/`SQLMesh` en `de3-transformacion-01`) y tablas Iceberg (`de3-lakehouse-01`). | `stores`, `orders`, `payments` y `refunds`: construcción de una vista materializada operativa por formato de tienda (`retail`, `warehouse`, `flagship`) que consolida pagos capturados deduplicados (`$6 874 488,00 USD` brutos) y resta devoluciones procesadas (`$274 534,52 USD`) para servir el flujo de caja neto en vivo (`$6 599 953,48 USD`). |

---

## 3. Especificación del proyecto de módulo (`de4-streaming`) y rúbrica

### Enunciado del proyecto integrador
- **Título:** Consolidación CDC y monitor financiero en tiempo real para Mercado Brisa
- **Dataset:** Almacén de Mercado Brisa (empresa ficticia) — tablas `customer_changes`, `customers`, `orders`, `payments`, `refunds`, `events` y `stores`.
- **Contexto:** El equipo de finanzas y operaciones de Mercado Brisa sufre tres problemas simultáneos en su tubería de tiempo real:
  1. Los cambios de nivel de fidelidad (`customer_changes`) llegan con múltiples actualizaciones por cliente y deben consolidarse sin duplicar filas activas.
  2. La pasarela de pagos reenvía webhooks duplicados bajo entrega *at-least-once* (`405` cobros `captured` repetidos con la misma `idempotency_key` a los `+4 s`), mientras que los reintentos bancarios legítimos (`attempt_number = 2`) llegan a los `+110 s` del pedido.
  3. Las devoluciones confirmadas (`refunds.status = 'processed'`) deben descontarse incrementalmente para mostrar el ingreso neto por formato de tienda (`store_type`) sin reescanear el histórico completo en cada consulta.
- **Entregable requerido:**
  1. **Documento de arquitectura CDC y streaming:** Especificación del conector Debezium sobre PostgreSQL (`wal_level = logical`, `pgoutput`, protección `max_slot_wal_keep_size`), diseño de particionamiento en Apache Kafka 4.x (evitando el sesgo de claves nulas en `events`), política de *watermarks* e `Interval Join` en Apache Flink, y elección justificada entre vista materializada en streaming (RisingWave/Materialize) o tabla `ReplacingMergeTree`/`AggregatingMergeTree` en ClickHouse.
  2. **Consultas SQL verificables en DuckDB:**
     - **Consulta A (Deduplicación e Interval Join con análisis de retraso):** Consolidación de `orders` y `payments` deduplicando primero por `idempotency_key` (`ROW_NUMBER() OVER (PARTITION BY idempotency_key ORDER BY payment_ts ASC, payment_id ASC) = 1`) y comparando los pedidos capturados dentro de una ventana de `30 segundos` frente a la ventana completa de `120 segundos` por `payment_method`.
     - **Consulta B (Vista materializada operativa por tipo de tienda):** Cálculo del flujo de caja neto (`net_revenue_usd`) cruzando `stores`, `orders`, `payments` (deduplicados en estado `captured`) y `refunds` (agregados previamente por `order_id` en estado `processed` para evitar explosión de filas).

### Rúbrica de evaluación del proyecto (4 criterios, escala 0 a 4)

| Criterio | 0 — No entregado / Incorrecto | 1 — Insuficiente | 2 — Básico / Funcional parcial | 3 — Sólido (Estándar esperado) | 4 — Excelente (Dominio técnico completo) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Arquitectura CDC y particionamiento en Kafka 4.x** | No describe el mecanismo de captura o propone consultas periódicas `SELECT *` sobre tablas de producción sin justificación. | Menciona Debezium y Kafka, pero omite la configuración del WAL (`wal_level = logical`), los *replication slots* o la clave de partición. | Define la lectura del WAL con `pgoutput` y el particionamiento por clave, pero no aborda el riesgo de llenado de disco por *slots* inactivos ni el sesgo por claves nulas (`customer_id IS NULL`). | Especifica Debezium con `pgoutput`, `max_slot_wal_keep_size`, el patrón *Transactional Outbox*, el consenso KRaft (`__cluster_metadata`) y una clave de partición sin sesgo con *Tiered Storage* (KIP-405). | Además del nivel 3, cuantifica el impacto del sesgo de `customer_id IS NULL` en `events` (`14,3 %` en `page_view`/`product_view`), dimensiona la retención caliente/fría y define la política de compactación e `ISR`. |
| **2. Manejo de tiempo de evento, watermarks e Interval Joins** | Confunde tiempo de procesamiento con tiempo de evento o realiza un `Regular Join` sin cota temporal ni TTL de estado. | Define un *watermark* genérico sin relación con las latencias reales de `payments` en Mercado Brisa. | Configura un `Interval Join` entre `orders.order_ts` y `payments.payment_ts`, pero elige una ventana arbitraria sin contrastar el intento 1 (`+15 s`) frente al intento 2 (`+110 s`). | Demuestra con SQL sobre Mercado Brisa que una ventana de `30 s` pierde exactamente `675` reintentos legítimos (`$288 589,29 USD`) y justifica una cota de `120 s` junto con `withIdleness` para particiones lentas. | Además del nivel 3, incluye la formulación explícita $W(t) = \max(t_e) - \delta$, detalla la limpieza automática del estado en RocksDB al avanzar el *watermark* y normaliza los 5 husos horarios de `events`. |
| **3. Semántica de entrega e idempotencia extremo a extremo** | Suma `payments.amount_usd` directamente sin deduplicar, inflando los ingresos con los webhooks repetidos, o elimina por error los reintentos `attempt_number = 2`. | Reconoce la existencia de duplicados, pero deduplica por `order_id` sin filtrar por `status` ni distinguir entre intentos fallidos y webhooks repetidos. | Deduplica los pagos capturados por `idempotency_key`, pero no explica por qué las barreras Chandy-Lamport y el 2PC interno no bastan cuando el origen es un webhook HTTP externo. | Deduplica con precisión por `idempotency_key` (`ROW_NUMBER()` ordenado por `payment_ts ASC, payment_id ASC`), preserva los reintentos `attempt_number = 2` y cuantifica los `$168 674,63 USD` de sobrefacturación evitados. | Además del nivel 3, explica la interacción entre barreras de *checkpoint*, `TwoPhaseCommitSinkFunction`, `isolation.level = read_committed` y `transaction.timeout.ms` ante caídas del *JobManager*. |
| **4. Vistas materializadas en streaming y agregación OLAP sin fan-out** | Hace un `JOIN` plano entre `orders`, `payments` y `refunds` sin preagregar ni deduplicar, multiplicando importes o ignorando las devoluciones. | Calcula el ingreso bruto por tienda pero omite las devoluciones (`refunds`) o no filtra `status = 'processed'`. | Obtiene el ingreso neto por `store_type`, pero no distingue cómo mantendría esa vista un motor IVM (Materialize/RisingWave) frente a un motor OLAP (`ReplacingMergeTree`/`AggregatingMergeTree` en ClickHouse). | Construye la consulta modular con CTEs independientes (`dedup_payments` y `order_refunds`), obtiene los importes exactos por `store_type` y contrasta el flujo de retracciones (`+1`/`-1`) con las fusiones asíncronas de ClickHouse. | Además del nivel 3, explica por qué una vista materializada en ClickHouse solo observa el bloque insertado (requiriendo `sumState`/`sumMerge` sobre `AggregatingMergeTree`) mientras que RisingWave/Materialize mantienen el grafo relacional completo con retracciones. |
