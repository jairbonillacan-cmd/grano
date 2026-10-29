# Investigación curricular y diseño del módulo `de4-plataforma`: Plataforma, seguridad y escala

- **Módulo:** `de4-plataforma` (*Plataforma, seguridad y escala*)
- **Track:** Data Engineering (`de`) — Nivel 4 (Escala y tiempo real / Plataforma)
- **Prerrequisitos del módulo:** `de4-streaming` (y base acumulada de `de2-pipelines`, `de2-formatos`, `de3-lakehouse`, `de3-transformacion`)
- **Duración total:** 135 minutos (6 lecciones: 25 + 25 + 20 + 20 + 20 + 25 min)
- **Fecha de verificación de fuentes:** `2026-10-29`

---

## 1. Fuentes verificadas por lección (Paso 1)

Todas las URLs fueron verificadas mediante petición HTTP directa (`GET`, código `200 OK`) el `2026-10-29`. Cada lección cuenta con 4 fuentes primarias de documentación oficial y especificaciones técnicas.

### Lección 01 — `de4-plataforma-01-spark-4-shuffles-skew-ansi`
*Título en catálogo:* Apache Spark 4.0: particiones, shuffles, sesgo de datos (data skew) y modo ANSI (25 min)

1. **Apache Software Foundation** — *Spark SQL, DataFrames and Datasets Guide: Performance Tuning (Adaptive Query Execution, Coalescing Partitions, Skew Join)*
   - URL: https://spark.apache.org/docs/latest/sql-performance-tuning.html
   - Verificación: HTTP 200 (`accessed: 2026-10-29`)
   - Respalda: Ejecución adaptativa de consultas (`spark.sql.adaptive.enabled`), coalescencia de particiones post-shuffle (`coalescePartitions`), conversión dinámica a Broadcast Hash Join y división automática de particiones con sesgo (`skewJoin`).
2. **Apache Software Foundation** — *ANSI Compliance in Spark SQL*
   - URL: https://spark.apache.org/docs/latest/sql-ref-ansi-compliance.html
   - Verificación: HTTP 200 (`accessed: 2026-10-29`)
   - Respalda: Activación por defecto de `spark.sql.ansi.enabled=true` en Apache Spark 4.0, excepciones en tiempo de ejecución por desbordamiento aritmético, división por cero y fallos de conversión explícita (`CAST` vs `TRY_CAST`).
3. **Apache Software Foundation** — *Tuning Spark: Data Serialization, Memory Management and Shuffle Behavior*
   - URL: https://spark.apache.org/docs/latest/tuning.html
   - Verificación: HTTP 200 (`accessed: 2026-10-29`)
   - Respalda: Mecánica física de los intercambios en red (`shuffle`), derrame a disco (`spill`), serialización y dimensionamiento de particiones por núcleo ejecutor.
4. **Apache Software Foundation** — *Spark Configuration: Runtime SQL and Shuffle Parameters*
   - URL: https://spark.apache.org/docs/latest/configuration.html
   - Verificación: HTTP 200 (`accessed: 2026-10-29`)
   - Respalda: Parámetros `spark.sql.shuffle.partitions`, `spark.sql.adaptive.advisoryPartitionSizeInBytes` y `spark.sql.autoBroadcastJoinThreshold`.

### Lección 02 — `de4-plataforma-02-arquitectura-integral-plataforma`
*Título en catálogo:* Diseño integral de una plataforma de datos: ingesta, almacenamiento, cómputo y consumo (25 min)

1. **Apache Software Foundation** — *Apache Iceberg Table Specification*
   - URL: https://iceberg.apache.org/spec/
   - Verificación: HTTP 200 (`accessed: 2026-10-29`)
   - Respalda: Desacoplamiento entre catálogo transaccional, árboles de metadatos (`manifest lists`, `manifests`) y archivos físicos para permitir múltiples motores de cómputo concurrentes sobre el plano de almacenamiento.
2. **Apache Software Foundation** — *Apache Kafka Documentation: Design and Architecture*
   - URL: https://kafka.apache.org/documentation/
   - Verificación: HTTP 200 (`accessed: 2026-10-29`)
   - Respalda: Plano de ingesta desacoplado basado en registros de eventos particionados, retención acotada en el bus de mensajería y descarga hacia tablas analíticas.
3. **DuckDB Foundation** — *DuckDB SQL Introduction and Embedded Analytical Execution*
   - URL: https://duckdb.org/docs/stable/sql/introduction
   - Verificación: HTTP 200 (`accessed: 2026-10-29`)
   - Respalda: Enrutamiento híbrido de cargas de trabajo hacia motores vectorizados en un solo nodo para conjuntos de datos que caben en memoria/NVMe local frente a clústeres distribuidos.
4. **Apache Software Foundation** — *Apache Parquet File Format Documentation*
   - URL: https://parquet.apache.org/docs/file-format/
   - Verificación: HTTP 200 (`accessed: 2026-10-29`)
   - Respalda: Capa física columnar interoperable entre los planos de ingesta, transformación y consumo analítico.

### Lección 03 — `de4-plataforma-03-seguridad-pii-enmascaramiento`
*Título en catálogo:* Seguridad de datos, clasificación PII, enmascaramiento dinámico y auditoría (20 min)

1. **National Institute of Standards and Technology (NIST)** — *NIST Special Publication 800-122: Guide to Protecting the Confidentiality of Personally Identifiable Information (PII)*
   - URL: https://csrc.nist.gov/pubs/sp/800/122/final
   - Verificación: HTTP 200 (`accessed: 2026-10-29`)
   - Respalda: Taxonomía de identificadores directos frente a cuasi-identificadores vinculables, evaluación de niveles de impacto de confidencialidad y controles de minimización y anonimización.
2. **The PostgreSQL Global Development Group** — *PostgreSQL Documentation: Chapter 5.9 Row Security Policies*
   - URL: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
   - Verificación: HTTP 200 (`accessed: 2026-10-29`)
   - Respalda: Diseño de políticas declarativas de seguridad a nivel de fila (`ENABLE ROW LEVEL SECURITY`, `CREATE POLICY ... USING`) para aislamiento por región o rol.
3. **The PostgreSQL Global Development Group** — *PostgreSQL Documentation: Chapter 5.8 Privileges and Column-Level Access Control*
   - URL: https://www.postgresql.org/docs/current/ddl-priv.html
   - Verificación: HTTP 200 (`accessed: 2026-10-29`)
   - Respalda: Principio de mínimo privilegio, revocación de lectura sobre columnas sensibles y vistas de enmascaramiento dinámico (`Dynamic Data Masking`).
4. **Intersoft Consulting / Official Journal of the EU** — *General Data Protection Regulation (GDPR) Article 32: Security of processing*
   - URL: https://gdpr-info.eu/art-32-gdpr/
   - Verificación: HTTP 200 (`accessed: 2026-10-29`)
   - Respalda: Obligación técnica de seudonimización, cifrado, trazabilidad de accesos y propagación de borrado en registros históricos y tablas SCD Tipo 2.

### Lección 04 — `de4-plataforma-04-iac-terraform-cicd-datos`
*Título en catálogo:* Infraestructura como código (Terraform) y CI/CD para recursos de datos (20 min)

1. **HashiCorp** — *Terraform Language Documentation: Resources Overview*
   - URL: https://developer.hashicorp.com/terraform/language/resources
   - Verificación: HTTP 200 (`accessed: 2026-10-29`)
   - Respalda: Declaración idempotente de recursos de almacenamiento, catálogos y roles IAM, ciclo `plan`/`apply` y meta-argumentos de ciclo de vida (`prevent_destroy`).
2. **HashiCorp** — *Terraform Language Documentation: State*
   - URL: https://developer.hashicorp.com/terraform/language/state
   - Verificación: HTTP 200 (`accessed: 2026-10-29`)
   - Respalda: Almacenamiento de estado remoto (`backend`), bloqueo concurrente (`state locking`) y detección de deriva de configuración (`infrastructure drift`).
3. **HashiCorp** — *Terraform Language Documentation: Modules Overview*
   - URL: https://developer.hashicorp.com/terraform/language/modules
   - Verificación: HTTP 200 (`accessed: 2026-10-29`)
   - Respalda: Empaquetado modular de recursos de datos para promover entornos aislados (`dev`, `staging`, `prod`) sin duplicar plantillas HCL.
4. **GitHub Docs** — *Understanding GitHub Actions*
   - URL: https://docs.github.com/en/actions/about-github-actions/understanding-github-actions
   - Verificación: HTTP 200 (`accessed: 2026-10-29`)
   - Respalda: Automatización de tuberías CI/CD que ejecutan validación de formato/plan de infraestructura y compuertas de calidad de datos antes de fusionar a producción.

### Lección 05 — `de4-plataforma-05-finops-atribucion-retencion`
*Título en catálogo:* FinOps para datos: atribución de costos, dimensionamiento y políticas de retención (20 min)

1. **FinOps Foundation** — *FinOps Framework Overview*
   - URL: https://www.finops.org/framework/
   - Verificación: HTTP 200 (`accessed: 2026-10-29`)
   - Respalda: Principios operativos de FinOps, fases del ciclo (*Inform*, *Optimize*, *Operate*) y economía unitaria aplicada a plataformas de datos.
2. **FinOps Foundation** — *FOCUS: FinOps Open Cost and Usage Specification*
   - URL: https://focus.finops.org/
   - Verificación: HTTP 200 (`accessed: 2026-10-29`)
   - Respalda: Esquema estandarizado de facturación tecnológica (`BilledCost`, `EffectiveCost`, `ResourceId`, `ChargeCategory`) y atribución de gasto por centro de costo o dominio.
3. **FinOps Foundation** — *FinOps Framework Capabilities: Allocation, Anomaly Management and Workload Optimization*
   - URL: https://www.finops.org/framework/capabilities/
   - Verificación: HTTP 200 (`accessed: 2026-10-29`)
   - Respalda: Etiquetado obligatorio de consultas y clústeres, presupuestos por departamento y dimensionamiento de cómputo con apagado automático (`auto-suspend`).
4. **Amazon Web Services** — *Amazon S3 User Guide: Managing the storage lifecycle of objects*
   - URL: https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html
   - Verificación: HTTP 200 (`accessed: 2026-10-29`)
   - Respalda: Reglas automatizadas de transición entre capas de almacenamiento (*Hot*, *Warm*, *Cold/Archive*) y expiración definitiva de instantáneas y archivos huérfanos.

### Lección 06 — `de4-plataforma-06-entrevista-system-design-de`
*Título en catálogo:* Resolución paso a paso de una entrevista de diseño de sistemas (System Design) en DE (25 min)

1. **Google SRE** — *Site Reliability Engineering Book: Service Level Objectives*
   - URL: https://sre.google/sre-book/service-level-objectives/
   - Verificación: HTTP 200 (`accessed: 2026-10-29`)
   - Respalda: Formulación cuantitativa de indicadores (`SLI`), objetivos (`SLO`) y presupuestos de latencia y frescura en el paso 1 de una entrevista de diseño de sistemas.
2. **Apache Software Foundation** — *Apache Flink Documentation: Stateful Stream Processing Concepts*
   - URL: https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/overview/
   - Verificación: HTTP 200 (`accessed: 2026-10-29`)
   - Respalda: Justificación arquitectónica del camino rápido en flujo con estado frente a procesamiento por lotes según los requisitos de latencia extremo a extremo.
3. **Apache Software Foundation** — *Apache Iceberg Documentation: Table Maintenance and Compaction*
   - URL: https://iceberg.apache.org/docs/latest/maintenance/
   - Verificación: HTTP 200 (`accessed: 2026-10-29`)
   - Respalda: Mitigación del problema de archivos pequeños en escrituras de alta frecuencia mediante compactación asíncrona y expiración de instantáneas.
4. **Amazon Web Services Builders' Library** — *Avoiding Fallback in Distributed Systems*
   - URL: https://aws.amazon.com/builders-library/avoiding-fallback-in-distributed-systems/
   - Verificación: HTTP 200 (`accessed: 2026-10-29`)
   - Respalda: Análisis de modos de fallo, aislamiento de carga, contrapresión (`backpressure`) y degradación controlada al defender un diseño ante el entrevistador.

---

## 2. Mapa de conceptos del módulo (Paso 2)

Cada lección introduce un concepto nuevo central y construye sobre los prerrequisitos declarados sin duplicar el contenido de `de2-pipelines`, `de2-formatos`, `de3-lakehouse`, `de3-transformacion` ni `de4-streaming`.

| Orden | ID de lección | Concepto nuevo que introduce | Prerrequisitos declarados | Tablas y anomalías de Mercado Brisa usadas |
|---|---|---|---|---|
| 1 | `de4-plataforma-01-spark-4-shuffles-skew-ansi` | Mecánica de *shuffle*, mitigación de sesgo de datos (*data skew* / *salting* / AQE) y modo ANSI SQL estricto por defecto en Apache Spark 4.0. | `de2-formatos-05-particionado-archivos-pequenos`, `de3-lakehouse-01-iceberg-v3-medallion` | `events` (65 000 filas con 6 715 `customer_id IS NULL` que generan un factor de sesgo de 268.6x sobre la mediana de 25 eventos), `orders`, `order_items`, `stores`. |
| 2 | `de4-plataforma-02-arquitectura-integral-plataforma` | Separación de los 4 planos de una plataforma de datos (ingesta, almacenamiento abierto, cómputo poliglota y consumo) y reconciliación contable entre capas. | `de4-streaming-01-cdc-kafka-streaming`, `de3-lakehouse-01-iceberg-v3-medallion`, `de4-plataforma-01-spark-4-shuffles-skew-ansi` | `events`, `order_items`, `customer_changes`, `marketing_spend`, `orders`, `payments` (19 200 intentos con 405 cobros capturados duplicados que inflan el total cobrado frente al facturado), `refunds`, `stores`. |
| 3 | `de4-plataforma-03-seguridad-pii-enmascaramiento` | Clasificación de PII (identificadores directos vs. cuasi-identificadores según NIST SP 800-122), enmascaramiento dinámico (DDM), seguridad a nivel de fila (RLS) y auditoría de *k*-anonimato e historial SCD2. | `de3-transformacion-03-contracts-semantic-layer`, `de4-plataforma-02-arquitectura-integral-plataforma` | `customers` (2 400 clientes con PII directa en `full_name`, `email`, `postal_code` y grupos de cuasi-identificadores `country_code + city + segment + current_tier` con tamaño mínimo $k=33$ en MX y PE), `customer_changes` (4 100 versiones históricas SCD2). |
| 4 | `de4-plataforma-04-iac-terraform-cicd-datos` | Infraestructura declarativa con Terraform (recursos, módulos, estado remoto con bloqueo, deriva y protección `prevent_destroy`) integrada con compuertas automatizadas de CI/CD de datos. | `de2-pipelines-06-contenedores-docker-compose`, `de3-transformacion-01-dbt-sqlmesh-dag`, `de4-plataforma-03-seguridad-pii-enmascaramiento` | `orders` (18 000 filas únicas), `payments` (405 cobros `captured` duplicados por `order_id`), `refunds` (1 450 reembolsos vinculados a órdenes en estado `completed` o `cancelled` en vez de `refunded`), `events` (6 715 eventos sin `customer_id`). |
| 5 | `de4-plataforma-05-finops-atribucion-retencion` | Ingeniería financiera de datos (FinOps Framework y especificación FOCUS: `BilledCost` vs `EffectiveCost`), economía unitaria por canal y políticas de retención por capas (*Hot*, *Warm*, *Cold*). | `de3-lakehouse-01-iceberg-v3-medallion`, `de4-plataforma-04-iac-terraform-cicd-datos` | `events` (distribución temporal 2023–2025, peso de `page_view` y tamaño de `payload_json` por `device_type`), `marketing_spend` (730 registros de inversión diaria por `channel` y `region`), `orders`. |
| 6 | `de4-plataforma-06-entrevista-system-design-de` | Metodología estructurada en 4 etapas para resolver entrevistas de *System Design* en Ingeniería de Datos: acotación de SLOs, estimación de capacidad a escala 10x, arquitectura extremo a extremo y defensa de compromisos (*trade-offs*). | `de4-streaming-03-flink-watermarks-mv`, `de4-plataforma-02-arquitectura-integral-plataforma`, `de4-plataforma-05-finops-atribucion-retencion` | `events` (1 061 días activos, media de 61 eventos/día y pico de 103 eventos/día, ratio pico/media de 1.68x), `orders`, `order_items` (proyección 10x por año de 2023 a 2025 con 2.32–2.35 líneas por orden), `stores`. |

---

## 3. Verificación de prácticas SQL sobre Mercado Brisa (Paso 3)

Todas las consultas de `workedExample` y `practice` fueron ejecutadas sobre los 13 archivos Parquet reales en `public/datasets/` mediante `@duckdb/node-api`:

1. **`de4-plataforma-01-spark-4-shuffles-skew-ansi`**:
   - *Worked Example:* Cuantifica el sesgo en `events` al agrupar por `COALESCE(CAST(customer_id AS VARCHAR), 'ANON')` (`max_part_rows = 6715`, `median_part_rows = 25`, `skew_factor = 268.6`), aplica *salting* en 8 cubetas (`ABS(HASH(event_id)) % 8`) reduciendo la partición máxima a `869` filas (`new_skew_factor = 34.8`), y calcula porcentajes de descuento con división segura ANSI (`NULLIF`).
   - *Practice:* Diagnóstico de sesgo de carga por `store_type` al cruzar `stores`, `orders` y `order_items` (`retail`: 23 573 ítems / 56.13% / ratio 1.68; `warehouse`: 9 427 ítems / 22.45% / ratio 0.67; `flagship`: 9 000 ítems / 21.43% / ratio 0.64).
2. **`de4-plataforma-02-arquitectura-integral-plataforma`**:
   - *Worked Example:* Inventaría los 4 dominios de ingesta (`events`: 65 000, `order_items`: 42 000, `customer_changes`: 4 100, `marketing_spend`: 730) y audita la brecha de conciliación entre `orders` (`status = 'completed'`, `$6,269,462.42`) y `payments` (`status = 'captured'`, `$6,423,516.34`) causada por cobros reintentados sin deduplicación previa.
   - *Practice:* Conciliación regional en la capa Gold cruzando `stores`, `orders` completadas, `payments` capturados y `refunds` procesados para las 4 regiones (`Cono Sur`, `Andina`, `Iberia`, `Norteamérica`).
3. **`de4-plataforma-03-seguridad-pii-enmascaramiento`**:
   - *Worked Example:* Aplica funciones de enmascaramiento dinámico (`SHA256`, extracción de dominio con `SPLIT_PART`, truncado de `postal_code`) sobre `customers`, evalúa el tamaño mínimo de grupo por cuasi-identificadores (`country_code`, `city`, `segment`, `current_tier`) y audita las 4 100 filas históricas en `customer_changes`.
   - *Practice:* Auditoría de *k*-anonimato ($k \ge 50$) por `country_code` en `customers`, identificando que `MX` ($k=33$), `PE` ($k=33$) y `CL` ($k=34$) requieren generalización (`REQUIERE_GENERALIZACION`), mientras `ES` ($k=66$), `AR` ($k=67$) y `CO` ($k=67$) cumplen `K50_CUMPLIDO`.
4. **`de4-plataforma-04-iac-terraform-cicd-datos`**:
   - *Worked Example:* Evalúa compuertas de calidad pre-despliegue detectando 405 cobros capturados duplicados en `payments`, 1 450 reembolsos en `refunds` asociados a órdenes cuyo estado en `orders` no es `'refunded'` (`1305` en `'completed'` y `145` en `'cancelled'`), y `6715` eventos anónimos en `events`.
   - *Practice:* Compuerta unificada de CI/CD con `UNION ALL` que clasifica 4 controles en `PASS` (`0` violaciones), `WARN_QUARANTINE` (`< 500` violaciones) o `BLOCK_DEPLOY` ($\ge 500$ violaciones).
5. **`de4-plataforma-05-finops-atribucion-retencion`**:
   - *Worked Example:* Analiza la inversión y costo por conversión atribuida (`cpa_usd`) en `marketing_spend` por canal y mide el peso en kilobytes de `payload_json` en `events` por `device_type` (`desktop`: 1 080.73 KB, `mobile`: 1 024.94 KB, `pos_tienda`: 801.95 KB).
   - *Practice:* Clasificación del ciclo de vida de almacenamiento sobre `events` por año (`2025` -> `HOT_NVME` con 22 108 eventos; `2024` -> `WARM_OBJECT` con 24 263 eventos; `2023` -> `COLD_ARCHIVE` con 18 629 eventos) y cálculo del porcentaje de eventos `page_view`.
6. **`de4-plataforma-06-entrevista-system-design-de`**:
   - *Worked Example:* Calcula la línea base diaria sobre `events` (1 061 días, media 61 eventos/día, pico 103 eventos/día, factor pico/media 1.68x), la distribución regional de carga transaccional y la proyección 10x por `event_type`.
   - *Practice:* Dimensionamiento de capacidad transaccional anual (`2023`, `2024`, `2025`) cruzando `orders` y `order_items` para obtener órdenes actuales, líneas actuales, promedio de líneas por orden (`2.35`, `2.32`, `2.34`) y volumen proyectado a escala 10x (`57410`, `183710`, `178880`).

---

## 4. Especificación del proyecto de módulo y rúbrica de 4 criterios (Paso 6)

### Enunciado del proyecto (`projectSpec`)
- **Prompt:** Redactar el diseño de arquitectura completo de la plataforma de datos de Mercado Brisa para escalar 10x el volumen actual.
- **Dataset:** Mercado Brisa (esquema completo de 13 tablas, requisitos de latencia y privacidad PII).
- **Entregable:** Documento de arquitectura (RFC) con diagrama de componentes, política de enmascarado PII, presupuesto FinOps y matriz de riesgos.

### Estructura exigida al entregable del estudiante (RFC)
1. **Dimensionamiento cuantitativo (10x):** Tabla con volumen actual y proyectado a 10x de eventos por segundo (media y hora pico), filas transaccionales por año (`orders`, `order_items`, `payments`, `refunds`) y crecimiento anual en almacenamiento Parquet/Iceberg.
2. **Diagrama y especificación de los 4 planos:**
   - *Ingesta:* Captura CDC sobre bases transaccionales (`orders`, `payments`, `customers`) hacia Apache Kafka y recepción HTTP de clickstream (`events`) e integraciones por lotes (`marketing_spend`).
   - *Almacenamiento:* Arquitectura Medallion (Bronze, Silver, Gold) sobre Apache Iceberg v3 con estrategia de particionado, compactación de archivos pequeños y deduplicación por `idempotency_key`.
   - *Cómputo:* Criterio de enrutamiento entre flujo con estado (Apache Flink), lotes distribuidos (Apache Spark 4.0 con AQE y modo ANSI activo) y ejecución analítica local/embebida (DuckDB).
   - *Consumo:* Acuerdos de nivel de servicio (SLO de frescura y latencia p95) para tableros ejecutivos BI, analítica de producto/experimentos y auditoría financiera.
3. **Política de seguridad, PII y cumplimiento:** Inventario de columnas con identificadores directos y cuasi-identificadores en `customers` y `customer_changes`, reglas de enmascaramiento dinámico (DDM) y seguridad a nivel de fila (RLS) por rol (`de`, `da`, `bi`), y procedimiento de borrado para solicitudes de derecho al olvido sobre el historial SCD Tipo 2.
4. **Infraestructura como código, CI/CD, modelo FinOps y matriz de riesgos:** Estructura de módulos Terraform con estado remoto bloqueado (`prevent_destroy` en cubetas de datos), compuertas SQL de CI/CD que bloquean despliegues ante cobros duplicados o reembolsos inconsistentes, política de retención por capas (*Hot*, *Warm*, *Cold*) alineada con FOCUS y matriz de 4 riesgos arquitectónicos con su mitigación.

### Rúbrica de evaluación (4 criterios, escala 0 a 4)

| Criterio | 0 — Ausente / incorrecto | 1 — Insuficiente | 2 — Básico | 3 — Sólido | 4 — Excelente |
|---|---|---|---|---|---|
| **1. Arquitectura de los 4 planos, Spark 4.0 y dimensionamiento 10x** | No presenta cálculo de capacidad ni separa los planos de la plataforma; ignora el sesgo de datos y las duplicidades de Mercado Brisa. | Enumera herramientas (Kafka, Spark, Iceberg) sin justificar cómo interactúan ni calcular volúmenes reales de las 13 tablas. | Calcula el volumen 10x básico y dibuja las capas Bronze, Silver y Gold, pero omite el manejo del sesgo por `customer_id IS NULL` o la deduplicación de `payments`. | Dimensiona media y pico a 10x con cifras reales del dataset, define los 4 planos con Iceberg, configura AQE y modo ANSI en Spark 4.0 y resuelve la conciliación de `payments` y `refunds`. | Además del nivel 3, justifica umbrales cuantitativos de enrutamiento entre Flink, Spark 4.0 y DuckDB, especifica la estrategia de *salting*/AQE para los 6 715 eventos anónimos y define planes de compactación Iceberg. |
| **2. Seguridad de datos, clasificación PII, DDM/RLS y derecho al olvido** | Expone `full_name`, `email` y `postal_code` sin protección a los roles analíticos o confunde cifrado en reposo con control de acceso por rol. | Identifica `email` como PII directa, pero olvida los cuasi-identificadores (`city`, `segment`, `current_tier`) y el historial en `customer_changes`. | Define vistas de enmascaramiento para `customers` (hash de correo y código postal truncado) y filtrado RLS por país, sin abordar `customer_changes` ni *k*-anonimato. | Clasifica PII directa y cuasi-identificadores según NIST SP 800-122, implementa DDM y RLS por rol (`de`, `da`, `bi`), evalúa el umbral $k \ge 50$ por país y diseña la purga en `customer_changes`. | Además del nivel 3, incorpora separación de claves criptográficas (*crypto-shredding*) o tablas de mapeo aisladas para ejecutar bajas GDPR en `customer_changes` y archivos Iceberg sin reescribir todo el histórico. |
| **3. Infraestructura como código (Terraform) y compuertas CI/CD** | Propone crear cubetas, catálogos y permisos manualmente en la consola de nube sin control de versiones ni pruebas automatizadas. | Incluye fragmentos sueltos de Terraform sin backend de estado remoto ni bloqueo, y carece de validaciones de calidad de datos en CI/CD. | Declara recursos en Terraform con estado remoto y define un flujo de CI/CD que ejecuta `terraform plan`, pero solo valida unicidad de clave primaria en `orders`. | Estructura módulos reutilizables (`dev`/`staging`/`prod`) con `prevent_destroy` en almacenamiento, bloqueo de estado y compuertas SQL en CI/CD que detectan los 405 cobros duplicados y los 1 450 reembolsos inconsistentes. | Además del nivel 3, integra entornos efímeros por *pull request* (patrón Write-Audit-Publish sobre ramas de catálogo Iceberg), detección programada de *drift* y políticas de severidad (`PASS`, `WARN_QUARANTINE`, `BLOCK_DEPLOY`). |
| **4. Modelo FinOps (FOCUS), retención por capas y matriz de riesgos** | No estima costos ni define tiempos de retención; almacena todos los eventos crudos indefinidamente en la capa de mayor costo. | Propone borrar datos antiguos arbitrariamente sin distinguir requisitos legales, valor analítico ni atribución de costos por canal o equipo. | Define una regla de transición básica (*Hot*/*Warm*/*Cold*) para `events` por antigüedad y lista riesgos generales sin cuantificar su impacto. | Aplica etiquetas de atribución alineadas con FOCUS (`BilledCost`, `EffectiveCost`), cuantifica el ahorro de transicionar `events` de 2023 y 2024 a capas tibias/frías, evalúa el CPA de `marketing_spend` y documenta 4 riesgos con mitigación. | Además del nivel 3, vincula las métricas de costo con cuotas de cómputo por consumidor, establece alertas de anomalías de gasto por consulta escaneada y cuantifica el compromiso costo-latencia-frescura en la matriz de riesgos. |
