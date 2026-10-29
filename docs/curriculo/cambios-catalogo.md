# Cambios y justificación del catálogo (`src/data/catalog/`)

**Fecha de consolidación:** `2026-10-29`  
**Ámbito:** `src/data/catalog/tracks.js`, `src/data/catalog/levels.js`, `src/data/catalog/modules.js`  
**Objetivo:** consolidar la arquitectura curricular de Grano (**32 módulos**, **154 lecciones**, **4 áreas** y **5 niveles**, **3 500 minutos / 58.3 horas estimadas**) bajo las directrices de Apéndice B, las 32 fuentes primarias investigadas (`docs/curriculo/fuentes.md`), el inventario verificado de herramientas a octubre de 2026 (`docs/curriculo/estado-herramientas.md`) y el análisis de brechas y partición de las 18 lecciones heredadas (`docs/curriculo/brechas.md`).

---

## 1. Cambios estructurales en `src/data/catalog/tracks.js`

Se conservaron las 4 áreas (`core`, `de`, `da`, `bi`) y `TRACK_IDS`, incorporando los campos normativos exigidos por el plan sin romper la compatibilidad con `src/views/TrackPathView.jsx`:

1. **`id`, `name`, `short`, `summary`**: refinados para describir el oficio real sin jerga publicitaria ni menciones al año en curso.
2. **`workTasks` (arreglo de 3 tareas laborales reales)** y **`dayToDay` (alias sincronizado para compatibilidad con `TrackPathView.jsx`)**: cada área detalla tres encargos verificables del puesto (por ejemplo, en `de`: tuberías incrementales e idempotentes, tablas abiertas en Parquet v2 e Iceberg v3, y contratos de datos ODCS v3 con dbt/SQLMesh y OpenLineage).
3. **`typicalDay` (arreglo de 3 líneas con horarios de una jornada laboral real)**: añadido para alimentar el selector de perfil y el onboarding de `T8` (sección *"¿Aún no lo sabes? Así se ve un día en cada área"*), mostrando qué resuelve cada rol a las 09:30, al mediodía y por la tarde sobre **Mercado Brisa**.

---

## 2. Cambios estructurales en `src/data/catalog/levels.js`

Se normalizaron los 5 niveles (`0` a `4`) manteniendo tanto `id` (consumido por `TrackPathView.jsx`) como `level` (clave numérica `0..4` especificada en el paso 4 de `T3`), y redactando cada `outcome` con la fórmula **`"Al terminar sabrás…"`**:

| Nivel (`id` / `level`) | Nombre (`name`) | Resumen (`summary`) | Resultado medible (`outcome`) |
| :---: | :--- | :--- | :--- |
| `0` | **Cimientos** | Para empezar desde cero, sin experiencia técnica previa. | *Al terminar sabrás distinguir tipos de datos y archivos, resumir tablas en hojas de cálculo, calcular medidas descriptivas sin engaños, interpretar indicadores de negocio y manejarte en la terminal, Git y Python inicial.* |
| `1` | **Fundamentos** | SQL relacional, control del grano en JOINs, calidad de datos, Python tabular y gráficos honestos. | *Al terminar sabrás escribir consultas SQL sobre múltiples tablas sin duplicar importes, validar la integridad de un esquema relacional, transformar datos con Polars y pandas y presentar resultados en tablas y gráficos claros.* |
| `2` | **Intermedio** | SQL analítico, modelado dimensional de Kimball y el primer bloque técnico de tu área. | *Al terminar sabrás resolver series y cruces temporales con funciones de ventana y ASOF JOIN, diseñar esquemas en estrella con historial SCD tipo 2 y ejecutar con solvencia las tareas cotidianas de tu área.* |
| `3` | **Avanzado** | Lakehouse abierto y transformación, experimentación y producto, o diseño y gobierno de BI. | *Al terminar sabrás construir y auditar soluciones completas en tu especialidad (tablas Iceberg y contratos en DE, cohortes y pruebas A/B con CUPED en DA, o tableros y capas semánticas con RLS en BI).* |
| `4` | **Experto** | Streaming y arquitectura de plataforma, inferencia causal, BI como código, agentes MCP y portafolio. | *Al terminar sabrás diseñar sistemas de datos de extremo a extremo, justificar compensaciones técnicas y de costo, conectar agentes de lenguaje a métricas gobernadas vía MCP y defender tu portafolio en entrevistas técnicas.* |

---

## 3. Cambios estructurales y pedagógicos en `src/data/catalog/modules.js`

Se conservaron exactamente los **32 identificadores (`id`) de módulos** para garantizar estabilidad total con `T4`, `T5`, `T6`, `T7` y `T8`:
- **`core` (14 módulos — 65 lecciones, 22.9 h):** `c0-datos`, `c0-hojas`, `c0-numeros`, `c0-negocio`, `c0-herramientas`, `c1-sql-base`, `c1-sql-joins`, `c1-modelo`, `c1-python`, `c1-viz`, `c2-sql-analitico`, `c2-dimensional`, `x4-ia-datos`, `x4-carrera`.
- **`de` (6 módulos — 30 lecciones, 12.7 h):** `de2-formatos`, `de2-pipelines`, `de3-lakehouse`, `de3-transformacion`, `de4-streaming`, `de4-plataforma`.
- **`da` (6 módulos — 29 lecciones, 11.4 h):** `da2-inferencia`, `da2-eda`, `da3-producto`, `da3-experimentos`, `da4-modelos`, `da4-causalidad`.
- **`bi` (6 módulos — 30 lecciones, 11.5 h):** `bi2-metricas`, `bi2-modelo-semantico`, `bi2-dax`, `bi3-dashboards`, `bi3-gobierno`, `bi4-operacion`.

### 3.1. Resumen cuantitativo por área y nivel (`node scripts/check-catalog.mjs`)

| Área | Nivel | Módulos | Lecciones | Existentes (`existing`) | Planificadas (`planned`) | Minutos | Horas estimadas |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `core` | `0 Cimientos` | 5 | 23 | 0 | 23 | 415 | 6.9 h |
| `core` | `1 Fundamentos` | 5 | 26 | 1 | 25 | 545 | 9.1 h |
| `core` | `2 Intermedio` | 2 | 9 | 5 | 4 | 245 | 4.1 h |
| `core` | `4 Experto` | 2 | 7 | 1 | 6 | 170 | 2.8 h |
| `de` | `2 Intermedio` | 2 | 11 | 3 | 8 | 275 | 4.6 h |
| `de` | `3 Avanzado` | 2 | 8 | 3 | 5 | 215 | 3.6 h |
| `de` | `4 Experto` | 2 | 11 | 2 | 9 | 270 | 4.5 h |
| `da` | `2 Intermedio` | 2 | 10 | 0 | 10 | 225 | 3.8 h |
| `da` | `3 Avanzado` | 2 | 9 | 2 | 7 | 220 | 3.7 h |
| `da` | `4 Experto` | 2 | 10 | 0 | 10 | 235 | 3.9 h |
| `bi` | `2 Intermedio` | 3 | 15 | 0 | 15 | 340 | 5.7 h |
| `bi` | `3 Avanzado` | 2 | 10 | 1 | 9 | 225 | 3.8 h |
| `bi` | `4 Experto` | 1 | 5 | 0 | 5 | 120 | 2.0 h |
| **Total** | **0 a 4** | **32** | **154** | **18** | **136** | **3 500** | **58.3 h** |

### 3.2. Mejoras aplicadas a los 32 módulos
1. **Verbo medible en infinitivo al inicio de cada `goal`**: los 32 módulos inician su objetivo con un verbo de acción evaluable en infinitivo (`Distinguir`, `Resumir`, `Describir`, `Calcular`, `Ejecutar`, `Consultar`, `Combinar`, `Diseñar`, `Transformar`, `Construir`, `Resolver`, `Modelar`, `Optimizar`, `Implementar`, `Orquestar`, `Planificar`, `Estimar`, `Explorar`, `Analizar`, `Evaluar`, `Ajustar`, `Definir`, `Escribir`, `Gobernar`, `Operar`, `Conectar`, `Preparar`).
2. **Duración explícita (`minutes`) en las 154 lecciones y `estimatedMinutes` por módulo**: cada lección tiene asignada una duración entre `15` y `30` minutos según su densidad conceptual y práctica.
3. **Atributo `legacyOrder` (`1..18`) y unicidad de `status: 'existing'`**: se corrigió la duplicidad original donde `l12-contracts-semantic-layer` figuraba como `existing` tanto en `de3-transformacion` como en `bi3-gobierno` (lo que arrojaba 19 lecciones existentes para un inventario real de 18 lecciones en `src/data/learningPath2026.js`). Ahora las 18 lecciones heredadas (`L1` a `L18`) tienen una correspondencia 1-a-1 exacta.
4. **Proyectos prácticos (`project` y `projectSpec`) anclados en las 13 tablas de Mercado Brisa**: cada módulo especifica en `project` (y de forma estructurada en `projectSpec: { prompt, dataset, deliverable }`) la tarea técnica, las tablas exactas de **Mercado Brisa** (`customers`, `customer_changes`, `products`, `orders`, `order_items`, `payments`, `refunds`, `events`, `marketing_spend`, `experiments`, `experiment_assignments`, `stores`, `calendar`) y el **entregable concreto y verificable**.

---

## 4. Mapeo exacto de las 18 lecciones existentes (`L1`–`L18`)

La siguiente tabla documenta la ubicación definitiva de cada una de las 18 lecciones existentes (`src/data/learningPath2026.js` / `src/data/stages/stage1Sql.js` a `stage6StreamingAi.js`) dentro de `src/data/catalog/modules.js`:

| Orden heredado (`legacyOrder`) | `legacyId` | Título en catálogo (`modules.js`) | Módulo destino (`id`) | Área / Nivel | Orden en módulo | Minutos (`minutes`) |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: |
| **1** | `l1-joins-fanout` | *Grano de una tabla y fan-out en JOINs* | `c1-sql-joins` | `core` · N1 | 2 | 25 |
| **2** | `l2-window-functions` | *Funciones de ventana y cláusula QUALIFY* | `c2-sql-analitico` | `core` · N2 | 1 | 30 |
| **3** | `l3-asof-lateral-ctes` | *Cruces temporales con ASOF JOIN y CTEs modulares* | `c2-sql-analitico` | `core` · N2 | 2 | 30 |
| **4** | `l4-star-schema-obt` | *Esquema en estrella frente a tabla ancha (OBT)* | `c2-dimensional` | `core` · N2 | 2 | 25 |
| **5** | `l5-scd2-history` | *Dimensiones cambiantes: historial con SCD tipo 2* | `c2-dimensional` | `core` · N2 | 3 | 30 |
| **6** | `l6-metrics-simpson` | *Métricas no aditivas y paradoja de Simpson* | `c2-dimensional` | `core` · N2 | 4 | 30 |
| **7** | `l7-columnar-parquet` | *Formato físico Parquet v2, zone maps y filtros de Bloom* | `de2-formatos` | `de` · N2 | 1 | 30 |
| **8** | `l8-arrow-lance-vortex` | *Memoria columnar con Apache Arrow, Lance y Vortex* | `de2-formatos` | `de` · N2 | 2 | 30 |
| **9** | `l9-duckdb-polars-marimo` | *Ejecución local con DuckDB, Polars perezoso y Marimo* | `de2-formatos` | `de` · N2 | 3 | 30 |
| **10** | `l10-iceberg-v3-medallion` | *Tablas abiertas con Apache Iceberg v3 y arquitectura Medallion* | `de3-lakehouse` | `de` · N3 | 1 | 30 |
| **11** | `l11-dbt-sqlmesh-dag` | *Transformación declarativa con dbt y SQLMesh* | `de3-transformacion` | `de` · N3 | 1 | 30 |
| **12** | `l12-contracts-semantic-layer` | *Contratos de datos ejecutables (ODCS v3) y puente semántico* | `de3-transformacion` | `de` · N3 | 3 | 30 |
| **13** | `l13-cohorts-retention-ltv` | *Cohortes de retención, supervivencia y LTV con margen* | `da3-producto` | `da` · N3 | 2 | 30 |
| **14** | `l14-ab-testing-cuped` | *Pruebas A/B, diagnóstico SRM y reducción de varianza CUPED* | `da3-experimentos` | `da` · N3 | 1 | 30 |
| **15** | `l15-bi-tufte-code` | *Percepción visual, razón dato-tinta y narrativa ejecutiva* | `bi3-dashboards` | `bi` · N3 | 1 | 30 |
| **16** | `l16-cdc-kafka-streaming` | *Captura de cambios (CDC) con Debezium y Kafka* | `de4-streaming` | `de` · N4 | 1 | 30 |
| **17** | `l17-flink-watermarks-mv` | *Tiempo de evento y watermarks en Apache Flink* | `de4-streaming` | `de` · N4 | 3 | 30 |
| **18** | `l18-mcp-semantic-ai-rag` | *Servidores MCP conectados a la capa semántica y RAG híbrido* | `x4-ia-datos` | `core` · N4 | 1 | 30 |

---

## 5. Desglose de las divisiones de alcance (`L12`, `L15` y `L18`)

Tal como se documentó en `docs/curriculo/brechas.md`, tres lecciones heredadas condensaban responsabilidades de módulos distintos. Así quedó resuelta su separación en `src/data/catalog/modules.js`:

### 5.1. División de `L12` (`l12-contracts-semantic-layer`)
- **En `de3-transformacion` (Ingeniería de Datos · Nivel 3, orden 3):**
  - Se conserva `l12-contracts-semantic-layer` (`status: 'existing'`, `legacyOrder: 12`, 30 min) enfocada en **Contratos de datos ejecutables (ODCS v3.2)**: esquema, tipos físicos y lógicos, SLAs de frescura, validación en CI/CD y tablas de cuarentena (*circuit breaker*) antes de publicar hacia la capa Oro.
- **En `bi3-gobierno` (Business Intelligence · Nivel 3, orden 1):**
  - Se reemplaza la referencia duplicada por la lección dedicada `bi3-gobierno-01` (`status: 'planned'`, 25 min): *Capa semántica declarativa con MetricFlow y Cube: entidades, medidas y agregaciones simétricas*, que desarrolla las secciones de modelado semántico (`semantic_models`, medidas no aditivas, prevención automática de *fan-out* y exposición por APIs).

### 5.2. División de `L15` (`l15-bi-tufte-code`)
- **En `bi3-dashboards` (Business Intelligence · Nivel 3, orden 1):**
  - Se conserva `l15-bi-tufte-code` (`status: 'existing'`, `legacyOrder: 15`, 30 min) enfocada en *Percepción visual, razón dato-tinta y narrativa ejecutiva* (jerarquía perceptual de Cleveland-McGill, principio de Tufte, gráficos de bala de Stephen Few y estructura de la Pirámide de Minto).
- **En `bi4-operacion` (Business Intelligence · Nivel 4, orden 1):**
  - El bloque declarativo de BI-como-código pasa a la lección propia `bi4-operacion-01` (`status: 'planned'`, 25 min): *BI como código declarativo con Evidence, Observable Framework y Rill sobre DuckDB-Wasm*, complementada por `bi4-operacion-02` (*Proyectos Power BI (PBIP) y lenguaje TMDL: revisión de modelos y medidas en Git*).

### 5.3. División de `L18` (`l18-mcp-semantic-ai-rag`)
- **En `x4-ia-datos` (Tronco común · Nivel 4, orden 1):**
  - Se conserva `l18-mcp-semantic-ai-rag` (`status: 'existing'`, `legacyOrder: 18`, 30 min) centrada en la arquitectura de servidores **Model Context Protocol (MCP)** conectados a datos gobernados, mientras que las demás responsabilidades antes condensadas en `L18` se desglosan en `x4-ia-datos-02` (*Por qué falla el text-to-SQL directo sobre tablas crudas*), `x4-ia-datos-03` (*RAG híbrido sobre esquemas y documentos: BM25 + vectores HNSW con Reciprocal Rank Fusion*) y `x4-ia-datos-04` (*Evaluación determinista de sistemas de IA con conjuntos Golden Evals y barreras AST en SQLGlot*).
- **En `bi4-operacion` (Business Intelligence · Nivel 4, orden 5):**
  - La gobernanza semántica para consumo conversacional desde portales de BI se desarrolla en la lección dedicada `bi4-operacion-05` (`status: 'planned'`, 25 min): *GenBI auditable: preparar sinónimos, contexto y citas verificables en la capa semántica para MCP*.
