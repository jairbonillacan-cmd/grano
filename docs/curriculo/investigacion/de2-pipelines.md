# Investigación curricular y fuentes — Módulo `de2-pipelines` (Pipelines de ingesta y orquestación)

- **Área y nivel:** Ingeniería de Datos (`de`) · Nivel 2 (Intermedio)
- **Prerrequisitos:** `de2-formatos`, `c1-python`
- **Duración total:** 135 minutos (6 lecciones: `20, 25, 25, 20, 25, 20` min)
- **Fecha de verificación documental y HTTP 200:** `2026-10-29`

---

## 1. Fuentes primarias verificadas por lección

Todas las URLs fueron verificadas mediante petición HTTP (`200 OK`) el `2026-10-29`.

### Lección 1 — `de2-pipelines-01-etl-vs-elt`
1. **DuckDB Documentation — Parquet Overview and Direct Export (`COPY`)**
   - URL: https://duckdb.org/docs/data/parquet/overview
   - Editorial: DuckDB Foundation (`accessed: 2026-10-29`)
   - Respalda: Lectura y escritura directa sobre archivos Parquet en almacenamiento desacoplado sin servidores intermedios.
2. **Apache Parquet Format Specification**
   - URL: https://parquet.apache.org/docs/file-format/
   - Editorial: Apache Software Foundation (`accessed: 2026-10-29`)
   - Respalda: Persistencia inmutable de lotes crudos con esquema embebido, compresión Zstandard y metadatos de bloque en la capa de aterrizaje.
3. **Kimball Dimensional Modeling Techniques**
   - URL: https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/
   - Editorial: Kimball Group (`accessed: 2026-10-29`)
   - Respalda: Separación entre extracción cruda, área de preparación (*staging*) y tablas analíticas conformadas para consumo.

### Lección 2 — `de2-pipelines-02-idempotencia-backfill`
1. **Apache Airflow Documentation — Best Practices: Writing a DAG (Idempotency & Determinism)**
   - URL: https://airflow.apache.org/docs/apache-airflow/stable/best-practices.html
   - Editorial: Apache Software Foundation (`accessed: 2026-10-29`)
   - Respalda: Reglas de diseño de tareas idempotentes, prohibición de relojes dinámicos (`NOW()`) y uso de intervalos lógicos parametrizados.
2. **Dagster Documentation — Assets and Partitions Guide**
   - URL: https://docs.dagster.io/guides/build/assets
   - Editorial: Dagster Labs (`accessed: 2026-10-29`)
   - Respalda: Particionado temporal determinista y reprocesamiento histórico (*backfill*) acotado por ventana lógica.
3. **DuckDB Documentation — INSERT and Transactional Partition Replacement**
   - URL: https://duckdb.org/docs/stable/sql/statements/insert
   - Editorial: DuckDB Foundation (`accessed: 2026-10-29`)
   - Respalda: Reemplazo atómico de particiones e inserción deduplicada mediante funciones de ventana y `QUALIFY`.

### Lección 3 — `de2-pipelines-03-cargas-incrementales-merge`
1. **DuckDB Documentation — MERGE INTO Statement**
   - URL: https://duckdb.org/docs/stable/sql/statements/merge_into
   - Editorial: DuckDB Foundation (`accessed: 2026-10-29`)
   - Respalda: Sintaxis SQL estándar `MERGE INTO ... USING ... WHEN MATCHED / WHEN NOT MATCHED` y requisito de clave única en la fuente.
2. **PostgreSQL Documentation — SQL MERGE Command**
   - URL: https://www.postgresql.org/docs/current/sql-merge.html
   - Editorial: PostgreSQL Global Development Group (`accessed: 2026-10-29`)
   - Respalda: Comportamiento determinista ante múltiples filas coincidentes en la tabla origen durante una operación `MERGE`.
3. **dbt Documentation — About Incremental Models**
   - URL: https://docs.getdbt.com/docs/build/incremental-models
   - Editorial: dbt Labs (`accessed: 2026-10-29`)
   - Respalda: Patrón de marca de agua de lote (*high-watermark*), ventana de seguridad retroactiva (*lookback window*) para eventos tardíos y estrategias `merge` vs `delete+insert`.

### Lección 4 — `de2-pipelines-04-ingesta-apis-http`
1. **IETF RFC 9110 — HTTP Semantics (Status Codes 429, 503, Retry-After & Idempotent Methods)**
   - URL: https://www.rfc-editor.org/rfc/rfc9110.html
   - Editorial: Internet Engineering Task Force (`accessed: 2026-10-29`)
   - Respalda: Semántica de métodos HTTP idempotentes (§9.2.2), códigos de estado `429 Too Many Requests` y `503 Service Unavailable`, y cabecera `Retry-After`.
2. **IETF RFC 8288 — Web Linking (Pagination Link Relations)**
   - URL: https://www.rfc-editor.org/rfc/rfc8288.html
   - Editorial: Internet Engineering Task Force (`accessed: 2026-10-29`)
   - Respalda: Navegación entre páginas de recursos HTTP mediante punteros y cursores opacos (`rel="next"`).
3. **AWS Architecture Blog — Exponential Backoff And Jitter**
   - URL: https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
   - Editorial: Amazon Web Services (`accessed: 2026-10-29`)
   - Respalda: Algoritmo de retroceso exponencial con *Full Jitter* para evitar tormentas de reintentos sincronizados contra una API.

### Lección 5 — `de2-pipelines-05-orquestacion-airflow-dagster`
1. **Apache Airflow Documentation — Data-Aware Scheduling and Assets**
   - URL: https://airflow.apache.org/docs/apache-airflow/stable/authoring-and-scheduling/datasets.html
   - Editorial: Apache Software Foundation (`accessed: 2026-10-29`)
   - Respalda: Planificación basada en activos de datos (*Data Assets*), versionado de grafos y separación entre tareas y activos en Airflow 3.
2. **Dagster Documentation — Software-Defined Assets**
   - URL: https://docs.dagster.io/guides/build/assets
   - Editorial: Dagster Labs (`accessed: 2026-10-29`)
   - Respalda: Definición declarativa de activos con `@asset`, chequeos de calidad integrados (`@asset_check`) y seguimiento de linaje y frescura.
3. **Prefect 3 Documentation — Writing Flows and Tasks**
   - URL: https://docs.prefect.io/v3/develop/write-flows
   - Editorial: Prefect Technologies (`accessed: 2026-10-29`)
   - Respalda: Flujos dinámicos en Python puro (`@flow`, `@task`), caché por clave de entrada y semántica transaccional con compensación en Prefect 3.

### Lección 6 — `de2-pipelines-06-contenedores-docker-compose`
1. **Docker Documentation — Multi-Stage Builds**
   - URL: https://docs.docker.com/build/building/multi-stage/
   - Editorial: Docker Inc. (`accessed: 2026-10-29`)
   - Respalda: Construcción de imágenes ligeras y seguras separando la etapa de compilación de la imagen final de ejecución.
2. **Docker Documentation — Compose File Reference (`compose.yaml`)**
   - URL: https://docs.docker.com/reference/compose-file/
   - Editorial: Docker Inc. / Compose Specification (`accessed: 2026-10-29`)
   - Respalda: Declaración de servicios multicontenedor, redes aisladas, volúmenes persistentes y condiciones `depends_on` con `service_healthy`.
3. **Astral uv Documentation — Using uv in Docker**
   - URL: https://docs.astral.sh/uv/guides/integration/docker/
   - Editorial: Astral (`accessed: 2026-10-29`)
   - Respalda: Instalación determinista de dependencias Python en contenedores mediante `uv sync --frozen --no-dev` y aprovechamiento de caché de capas.

---

## 2. Mapa de conceptos y progresión del módulo

| Orden | ID de lección | Concepto nuevo introducido | Conceptos asumidos (prerrequisitos) | Anomalía o tabla de Mercado Brisa utilizada |
|---|---|---|---|---|
| 1 | `de2-pipelines-01-etl-vs-elt` | Desacoplamiento entre almacenamiento (Parquet en objetos) y cómputo (DuckDB); zona cruda inmutable (*Bronze*) frente a transformación en destino (*Silver*). | Formato Parquet (`de2-formatos-01`), lectura perezosa (`c1-python-02`). | `products` (`SKU-TEST-NEG`, `-9.99 USD`, 10 SKUs inactivos), `orders` (`14 760` completados vs `3 240` no completados) y `order_items` (`42 000` filas). |
| 2 | `de2-pipelines-02-idempotencia-backfill` | Idempotencia matemática $f(f(x)) = f(x)$, determinismo temporal (intervalo lógico `[start, end)` vs `CURRENT_DATE`), deduplicación por `idempotency_key` y *backfill* por partición. | Funciones puras (`c1-python-05`), `ROW_NUMBER()` y `QUALIFY` (`c2-sql-analitico-01`). | `payments` (`19 200` filas crudas, `18 750` `idempotency_key` únicas y `450` duplicados exactos por reintento de webhook que inflan el monto en `188 563.84 USD`). |
| 3 | `de2-pipelines-03-cargas-incrementales-merge` | Marca de agua de lote (*high-watermark*), ventana de seguridad retroactiva (*lookback window*), deduplicación por entidad (`order_id`) y sentencia `MERGE INTO`. | Idempotencia (`de2-pipelines-02`), grano y claves primarias (`c1-modelo-01`). | `payments` (`750` segundos intentos `attempt_number = 2`, donde `675` recuperan el cobro `captured` por `288 589.29 USD` tras un fallo previo) cruzado con `orders`. |
| 4 | `de2-pipelines-04-ingesta-apis-http` | Paginación por cursor opaco vs `OFFSET`, códigos HTTP `429`/`503`, cabecera `Retry-After`, retroceso exponencial con *Full Jitter* y extracción JSON en la capa cruda. | Archivos JSON/NDJSON (`c1-python-02`), idempotencia (`de2-pipelines-02`). | `events` (`65 000` eventos totales, `63 800` `event_id` únicos, `1 200` duplicados por reintento de red y extracción de atributos desde `payload_json`). |
| 5 | `de2-pipelines-05-orquestacion-airflow-dagster` | Evolución de grafos de tareas a activos de datos (*Data Assets* en Airflow 3, `@asset` en Dagster, transacciones `@task` en Prefect 3), sensores y validación entre activos. | Backfill y particiones (`de2-pipelines-02`), scripts CLI (`c1-python-05`). | Conciliación mensual de activos entre `orders`, `payments` deduplicados y `refunds` en el segundo semestre de `2025` (`2025-07` a `2025-11`). |
| 6 | `de2-pipelines-06-contenedores-docker-compose` | Aislamiento reproducible con `Dockerfile` multi-etapa, fijación con `uv.lock`, usuario sin privilegios, `compose.yaml` con `healthcheck` y verificación de invariantes del pipeline. | Scripts CLI y `pytest` (`c1-python-05`), orquestación (`de2-pipelines-05`). | Auditoría invariante multi-país entre `stores` (`14` tiendas en `6` países), `orders` (`14 760` pedidos completados, `6 269 462.42 USD`) y `payments`. |

---

## 3. Especificación del proyecto de módulo y rúbrica

- **Enunciado:** Construir un pipeline horario que ingiera pedidos y pagos nuevos de forma idempotente y tolere reintentos sin duplicar.
- **Dataset:** Mercado Brisa (`orders.parquet`, `payments.parquet` y `refunds.parquet` procesados en lotes horarios e históricos).
- **Entregable:** Pipeline en Python y SQL (`ingesta_pagos.py` + `merge_orders_payments.sql`) empaquetado con `Dockerfile` multi-etapa, `compose.yaml` y prueba automatizada con `pytest` que ejecuta dos veces el mismo lote horario y comprueba que el conteo de filas (`18 000` pedidos, `18 750` intentos únicos) y el importe cobrado permanecen invariantes.

### Rúbrica de evaluación del proyecto (4 criterios, escala 0–4)

| Criterio | 0–1 (Insuficiente) | 2 (Básico) | 3 (Sólido) | 4 (Excelente) |
|---|---|---|---|---|
| 1. Separación ELT y aterrizaje crudo | Sobrescribe o modifica los datos crudos al extraerlos sin conservar copia en Parquet. | Guarda archivos crudos pero mezcla lógica de negocio con extracción HTTP. | Separa la zona cruda inmutable en Parquet de la transformación SQL en DuckDB. | Particiona la zona cruda por fecha de lote, preserva el esquema original y ejecuta toda la limpieza en SQL auditable. |
| 2. Idempotencia y parametrización temporal | Usa `INSERT INTO` directo y `CURRENT_DATE`, duplicando filas al reintentar. | Deduplica parcialmente pero no permite reprocesar una fecha histórica por parámetro. | Recibe `--start-ts` y `--end-ts` por CLI y deduplica `payments` por `idempotency_key` con `QUALIFY`. | Garantiza $f(f(x)) = f(x)$ en cualquier ventana histórica y verifica con `pytest` que dos corridas seguidas producen idéntico hash y suma. |
| 3. Carga incremental con watermark y `MERGE` | Recarga toda la tabla en cada ejecución o falla ante múltiples intentos por pedido. | Filtra por `MAX(payment_ts)` sin ventana de seguridad ni deduplicación previa al `MERGE`. | Aplica ventana de seguridad retroactiva, quédate con el último `attempt_number` por `order_id` y ejecuta `MERGE INTO`. | Reconcilia cobros recuperados en segundo intento (`675` pedidos, `288 589.29 USD`) y devoluciones de `refunds` sin inflación ni pérdida de filas. |
| 4. Empaquetado en Docker y `compose.yaml` | Sin `Dockerfile` o con versiones sin fijar (`pip install` abierto) corriendo como `root`. | `Dockerfile` funcional de una sola etapa sin `healthcheck` en `compose.yaml`. | `Dockerfile` multi-etapa con `uv.lock`, usuario no privilegiado y `compose.yaml` con volúmenes y variables de entorno. | Imagen reproducible con `uv sync --frozen`, `depends_on` con `service_healthy` y contenedor de pruebas que retorna código `0` solo si cuadran los totales. |
