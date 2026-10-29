# Perfil de egreso · Ingeniería de Datos (`de`)

**Área:** `de` — Ingeniería de Datos (6 módulos de especialidad + 14 módulos de tronco común = 20 módulos, 95 lecciones, 35.6 horas estimadas)  
**Propósito:** formar profesionales capaces de construir y operar las tuberías incrementales, formatos columnares, tablas abiertas en Apache Iceberg v3 y Delta Lake 4.0, transformaciones declarativas con dbt y SQLMesh, contratos de datos ODCS v3, flujos CDC en tiempo real con Kafka y Flink y plataformas de datos seguras y eficientes en costos.

---

## Niveles 0, 1 y 2 (Tronco común `core`)
Antes de entrar en los módulos específicos de Ingeniería de Datos, la persona completa el tronco común (`c0-datos`, `c0-hojas`, `c0-numeros`, `c0-negocio`, `c0-herramientas`, `c1-sql-base`, `c1-sql-joins`, `c1-modelo`, `c1-python`, `c1-viz`, `c2-sql-analitico`, `c2-dimensional`), dominando SQL relacional y analítico, control del grano, diseño en 3FN y en estrella (Kimball, SCD2) y transformación tabular con Polars 2.0 y pandas 3.0 (ver `docs/curriculo/perfil-core.md`).

---

## Nivel 2 · Intermedio DE (`de2-formatos`, `de2-pipelines`)

### Qué sabe hacer la persona al terminar el Nivel 2 DE
- Optimizar el almacenamiento y la lectura analítica local aprovechando la anatomía física de **Parquet v2** (*row groups*, *zone maps*, filtros de Bloom, codificación por diccionario, RLE y Zstandard; lección `l7-columnar-parquet`), el formato columnar en memoria **Apache Arrow** junto a **Lance** y **Vortex** (`l8-arrow-lance-vortex`), y la ejecución vectorizada y perezosa en **DuckDB 2.0**, **Polars 2.0** y **Marimo** (`l9-duckdb-polars-marimo`), evitando el problema de los archivos pequeños.
- Construir tuberías de ingesta ETL/ELT incrementales, deterministas e idempotentes preparadas para reprocesamiento histórico (*backfill*), implementando marcas de agua de lote (*watermarks*), operaciones `MERGE`, consumo resiliente de APIs HTTP (paginación, *rate limits*, reintentos exponenciales), orquestación orientada a activos (**Airflow 3.0**, **Dagster**, **Prefect 3.0**) y empaquetado reproducible en contenedores **Docker**.

### Tareas laborales reales que puede ejecutar
1. Reestructurar y ordenar físicamente una tabla histórica de eventos en Parquet v2 con compresión Zstandard para reducir en más de un 80 % los bytes leídos por las consultas analíticas.
2. Desarrollar un pipeline horario contenedorizado que ingiera pedidos, pagos y reembolsos desde una API paginada y actualice el almacén de forma idempotente sin duplicar registros ante reintentos.

### Entregables verificables del nivel (sobre Mercado Brisa)
- **`de2-formatos`:** Script en DuckDB y Polars sobre `events` y `orders` de Mercado Brisa con tabla comparativa de tamaño en disco, grupos de filas saltados (*row group pruning*) y tiempo de consulta.
- **`de2-pipelines`:** Pipeline en Python y SQL sobre lotes horarios de `orders`, `payments` y `refunds` empaquetado con `Dockerfile` y prueba automatizada de doble ejecución con conteo invariante.

---

## Nivel 3 · Avanzado DE (`de3-lakehouse`, `de3-transformacion`)

### Qué sabe hacer la persona al terminar el Nivel 3 DE
- Implementar y operar una arquitectura **Lakehouse Medallion (Bronce, Plata, Oro)** sobre **Apache Iceberg v3** (vectores de borrado binarios, evolución de esquemas y particiones ocultas, *time travel*; lección `l10-iceberg-v3-medallion`) y **Delta Lake 4.0 / Delta UniForm**, gobernada mediante catálogos abiertos (**Apache Polaris REST**, **Unity Catalog**) y dimensionada con modelos de costos reales en BigQuery, Snowflake y Databricks.
- Orquestar transformaciones declarativas en **dbt** y **SQLMesh** (entornos virtuales y evaluación AST con SQLGlot; lección `l11-dbt-sqlmesh-dag`), integrando pruebas unitarias y auditorías bloqueantes en el DAG, **contratos de datos ejecutables bajo ODCS v3.2** (`l12-contracts-semantic-layer`) y trazabilidad columna a columna con **OpenLineage**.

### Tareas laborales reales que puede ejecutar
1. Operar una tabla transaccional Apache Iceberg v3 ejecutando actualizaciones `MERGE`, compactación de metadatos y consultas históricas `FOR SYSTEM_TIME AS OF` tras una auditoría financiera.
2. Estructurar el grafo `Staging → Intermediate → Marts` de la compañía con contratos YAML (ODCS v3.2) que desvíen a cuarentena cualquier lote que incumpla tipos, nulabilidad o SLAs de frescura.

### Entregables verificables del nivel (sobre Mercado Brisa)
- **`de3-lakehouse`:** Script SQL con creación de tabla Apache Iceberg v3 sobre `orders`, `order_items` y `events`, actualización `MERGE`, consulta `FOR SYSTEM_TIME AS OF` y estimación de costos cloud.
- **`de3-transformacion`:** Proyecto declarativo (dbt / SQLMesh) sobre `orders`, `order_items`, `payments`, `refunds` y `customers` con contrato YAML bajo ODCS v3.2, 6 tests/audits y grafo de linaje por columna.

---

## Nivel 4 · Experto DE (`de4-streaming`, `de4-plataforma`, `x4-ia-datos`, `x4-carrera`)

### Qué sabe hacer la persona al terminar el Nivel 4 DE
- Diseñar arquitecturas de captura de cambios (**CDC** desde el WAL con **Debezium 3.7** sobre **Apache Kafka 4.x con consenso KRaft** y almacenamiento por niveles; lección `l16-cdc-kafka-streaming`) y procesamiento de flujos por tiempo de evento (*event time*) con marcas de agua (*watermarks*) y estado RocksDB acotado en **Apache Flink 2.3** (`l17-flink-watermarks-mv`), además de vistas materializadas en streaming (Materialize, RisingWave) y motores OLAP en tiempo real (ClickHouse).
- Planificar y dimensionar una plataforma de datos a escala: diagnosticar *shuffles* y sesgo de datos (*data skew*) en **Apache Spark 4.0**, diseñar políticas de clasificación y enmascaramiento dinámico de PII, automatizar infraestructura como código (**Terraform** y CI/CD) y aplicar prácticas **FinOps** para datos.

### Entregables verificables del nivel (sobre Mercado Brisa)
- **`de4-streaming`:** Especificación de arquitectura CDC sobre `orders`, `payments` y `events` + consultas SQL de consolidación por LSN y ventanas por tiempo de evento con marca de agua de 30 segundos.
- **`de4-plataforma`:** Documento de arquitectura (RFC) de la plataforma de datos de Mercado Brisa (esquema completo de 13 tablas) para escalar 10x el volumen, con diagrama de componentes, política de enmascarado PII, presupuesto FinOps y matriz de riesgos.
- **`x4-ia-datos` y `x4-carrera`:** Servidor MCP de solo lectura con suite de 20 *Golden Evals* y portafolio público con 3 casos defendibles en entrevista técnica.
