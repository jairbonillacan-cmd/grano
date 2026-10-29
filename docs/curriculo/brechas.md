# Análisis de brechas curriculares y partición de lecciones heredadas

> **Propósito:** Comparar el borrador inicial de `src/data/catalog/` (§5.2) con las 32 fuentes primarias investigadas (`docs/curriculo/fuentes.md`) y el estado de las herramientas a octubre de 2026 (`docs/curriculo/estado-herramientas.md`).  
> **Total de observaciones documentadas:** 18 observaciones concretas + plan detallado de división para `L12`, `L15` y `L18`.

---

## 1. Observaciones concretas sobre el borrador del catálogo (18 hallazgos)

### A. Estructura del catálogo y compatibilidad con la interfaz

1. **Duplicación de `l12-contracts-semantic-layer` (`L12`) que alteraba el conteo de lecciones existentes (19 en lugar de 18):**
   - **Problema detectado:** En el borrador de `src/data/catalog/modules.js`, la lección heredada `l12-contracts-semantic-layer` estaba marcada con `status: 'existing'` en dos módulos distintos (`de3-transformacion` y `bi3-gobierno`). Por ello, `node scripts/check-catalog.mjs` reportaba 19 lecciones existentes cuando solo existen 18 en `src/data/stages/`.
   - **Corrección:** Mantener `l12-contracts-semantic-layer` (`status: 'existing'`, `legacyOrder: 12`) únicamente en `de3-transformacion` (enfocada en Contratos de datos ODCS v3 y validación en el pipeline) y definir en `bi3-gobierno` una lección propia (`bi3-gobierno-01`: *Capa semántica declarativa con MetricFlow y Cube*) que recibe el contenido de modelado semántico de `L12`.

2. **Falta de duración en minutos (`minutes`) y de `legacyOrder` en las lecciones de `modules.js`:**
   - **Problema detectado:** El helper `mod()` de `modules.js` no asignaba `minutes` a ninguna de las 154 lecciones ni incluía `legacyOrder` (`1..18`) en las lecciones heredadas. Sin `minutes`, la vista `TrackPathView`, el resumen de `Onboarding` (`T8`) y el validador `check-catalog.mjs` no pueden calcular las horas reales por módulo, nivel y ruta.
   - **Corrección:** Añadir `minutes` explícito (entre 15 y 30 minutos según complejidad y nivel) a cada una de las 154 lecciones y `legacyOrder` (`1` a `18`) a las 18 lecciones heredadas.

3. **Falta de `workTasks` y `typicalDay` diferenciados en `src/data/catalog/tracks.js`:**
   - **Problema detectado:** `tracks.js` solo exportaba `dayToDay`, pero la especificación de `T3` (paso 4) y el onboarding de `T8` (paso 1) requieren `workTasks` (3 tareas reales del puesto para las tarjetas de selección) y `typicalDay` (3 líneas que describen una jornada real de mañana a tarde para quien pulsa "Aún no lo sé"), además de mantener `dayToDay` para no romper `TrackPathView.jsx`.
   - **Corrección:** Incluir en cada área de `tracks.js` los campos `workTasks`, `typicalDay` y `dayToDay`.

4. **Formato de `levels.js`: propiedad `level` y redacción de `outcome` con `"Al terminar sabrás…"`:**
   - **Problema detectado:** En `levels.js`, cada objeto tenía `id` pero no `level`, y el texto de `outcome` no empezaba con la fórmula `"Al terminar sabrás…"` requerida por el paso 4 de `T3`.
   - **Corrección:** Conservar `id` (usado por `TrackPathView.jsx`), añadir `level: 0..4` y redactar todos los `outcome` empezando por `"Al terminar sabrás…"`.

5. **Proyectos de módulo (`project`) incompletos respecto a Mercado Brisa y al entregable verificable:**
   - **Problema detectado:** Dieciocho de los 32 módulos tenían en `project` una frase genérica que no citaba las tablas concretas de **Mercado Brisa** (§5.3: `customers`, `customer_changes`, `products`, `orders`, `order_items`, `payments`, `refunds`, `events`, `marketing_spend`, `experiments`, `experiment_assignments`, `stores`, `calendar`) o no precisaba qué artefacto entrega la persona al terminar.
   - **Corrección:** Reescribir los 32 strings `project` para que incluyan siempre enunciado + tablas de Mercado Brisa + entregable explícito, y añadir en cada módulo el objeto estructurado `projectSpec: { prompt, dataset, deliverable }` manteniendo `project` como `string` para compatibilidad directa con `TrackPathView.jsx`.

---

### B. Brechas temáticas en Tronco Común (`core`)

6. **`c0-datos` y `c0-hojas` — Errores intencionales del dataset común y tipos financieros:**
   - **Brecha frente a fuentes (`F01`, `F05`, `F07`):** En `c0-datos` conviene explicitar la diferencia entre coma flotante binaria (`DOUBLE`) y decimal exacto (`DECIMAL`/`NUMERIC`) para importes monetarios, así como la inspección inicial de los errores sembrados en Mercado Brisa (fechas mezcladas, nulos y el SKU con precio negativo). En `c0-hojas` se precisa el uso de `BUSCARX` (`XLOOKUP`) frente a duplicados en la tabla buscada.

7. **`c1-sql-base` y `c1-sql-joins` — Secuencia pedagógica antes de `L1` (Grano y fan-out):**
   - **Brecha frente a fuentes (`F01`, `F04`):** En el diagnóstico original (§0.5), el curso empezaba directamente en fan-out (`L1`) sin haber visto `SELECT`, `GROUP BY` ni tipos de `JOIN`. Al colocar `c1-sql-base` (7 lecciones) y la lección `c1-sql-joins-01` (*Tipos de JOIN: inner, left, full, anti y semi*) antes de `L1`, el alumno llega a `l1-joins-fanout` sabiendo agregar y cruzar tablas. Además, en `c1-sql-joins` se precisa la lección de subconsultas escalares y correlacionadas antes de las CTEs.

8. **`c1-modelo` — Reglas de validación y detección de huérfanos antes del modelado dimensional:**
   - **Brecha frente a fuentes (`F05`, `F25`):** Entre normalizar en 3FN (`c1-modelo`) y construir un esquema en estrella (`c2-dimensional`), faltaba explicitar en `c1-modelo` la detección de claves foráneas huérfanas con `ANTI JOIN` y las reglas de validación bloqueantes antes de publicar datos para análisis.

9. **`c1-python` — Actualización a Polars 2.0 y pandas 3.0:**
   - **Brecha frente a fuentes (`F02`, `F03`, `F08`):** Los títulos del borrador eran genéricos. Con Polars 2.0 (motor `streaming` por defecto, `.unpivot()`) y pandas 3.0 (*Copy-on-Write* obligatorio y cadenas PyArrow), las 5 lecciones de `c1-python` deben explicitar el contraste entre expresiones columnares perezosas e indexación tradicional, y la conversión de un cuaderno Marimo/Jupyter a un script ejecutable desde terminal.

10. **`c2-sql-analitico` — Marcos de ventana (`ROWS` vs `RANGE`), zonas horarias IANA y lectura de `EXPLAIN ANALYZE`:**
    - **Brecha frente a fuentes (`F01`, `F16`):** La lección 3 (*Zonas horarias y calendarios*) y la lección 4 (*Leer un plan de ejecución con EXPLAIN*) requieren precisar la conversión entre `TIMESTAMPTZ` en UTC y hora local con tablas calendario (`calendar`), y la lectura de operadores físicos (`SEQ_SCAN`, podado de filtros y `HASH_JOIN`) en `EXPLAIN ANALYZE`.

---

### C. Brechas temáticas en Ingeniería de Datos (`de`)

11. **`de2-formatos` — Codificaciones columnares (Diccionario, RLE, Zstandard) y problema de archivos pequeños:**
    - **Brecha frente a fuentes (`F10`, `F11`):** Las lecciones 4 y 5 de `de2-formatos` se titulan ahora con precisión técnica: *Codificación por diccionario, RLE y compresión Zstandard* y *Particionado físico y problema de los archivos pequeños*, conectando con `L7` (Parquet), `L8` (Arrow, Lance y Vortex) y `L9` (DuckDB, Polars y Marimo).

12. **`de2-pipelines` — Marcas de agua en lote y comparación actualizada con Airflow 3.0, Dagster y Prefect 3.0:**
    - **Brecha frente a fuentes (`F16`):** La lección 3 debe nombrar explícitamente las *marcas de agua (watermarks) de lote* y el patrón `MERGE`/upsert, y la lección 5 debe reflejar el modelo orientado a activos de **Airflow 3.0** (*Data Assets* y versionado de DAGs) frente a **Dagster** (*Software-Defined Assets*) y **Prefect 3.0**.

13. **`de3-lakehouse` — Interoperabilidad con Delta UniForm y catálogos abiertos (Apache Polaris y Unity Catalog):**
    - **Brecha frente a fuentes (`F09`, `F16`):** Junto a `L10` (Apache Iceberg v3), la lección 2 debe cubrir **Delta Lake 4.0 y metadatos interoperables (UniForm)**, y la lección 3 debe especificar **Catálogos REST abiertos: Apache Polaris y Unity Catalog** (incluyendo credenciales efímeras y control de acceso).

14. **`de3-transformacion` — Pruebas unitarias y singulares en SQL y linaje con OpenLineage:**
    - **Brecha frente a fuentes (`F12`, `F13`):** Además de `L11` (dbt y SQLMesh) y `L12` (Contratos ODCS v3), la lección 2 precisa *Tests de esquemas, pruebas unitarias SQL y auditorías bloqueantes*, y la lección 4 precisa *Observabilidad de datos y linaje con OpenLineage*.

15. **`de4-streaming` y `de4-plataforma` — Kafka 4.x con KRaft (sin ZooKeeper), vistas materializadas en streaming y Spark 4.0:**
    - **Brecha frente a fuentes (`F14`, `F15`, `F16`):** En `de4-streaming`, la lección 2 actualiza su enfoque a *Kafka por dentro: particiones, KRaft y almacenamiento por niveles* (eliminando cualquier referencia obsoleta a ZooKeeper), y la lección 5 se concreta en *Vistas materializadas en streaming y motores OLAP en tiempo real* (Materialize, RisingWave, ClickHouse). En `de4-plataforma`, la lección 1 incorpora el comportamiento ANSI por defecto y el manejo de sesgo de particiones (*data skew*) en **Spark 4.0**.

---

### D. Brechas temáticas en Análisis de Datos (`da`) y Business Intelligence (`bi`)

16. **`da2-inferencia` y `da2-eda` — Conexión entre perfilado de calidad, valores atípicos y error estándar:**
    - **Brecha frente a fuentes (`F21`, `F23`, `F24`):** En `da2-eda`, el tratamiento de valores atípicos debe separar explícitamente los errores de registro (p. ej. precios negativos o fechas rotas en Mercado Brisa) de la asimetría real del gasto (clientes mayoristas), conectando con el uso de mediana/percentiles (`c0-numeros`) y la varianza muestral (`da2-inferencia`).

17. **`da4-modelos` y `da4-causalidad` — Evaluación fuera de muestra en series temporales y supuestos de identificación:**
    - **Brecha frente a fuentes (`F19`, `F20`):** En `da4-modelos`, la lección de pronóstico debe enfatizar la validación por ventana temporal rodante (*backtesting* sin fuga del futuro) y métricas MAE/RMSE frente a un modelo ingenuo estacional (*seasonal naive*). En `da4-causalidad`, las tres lecciones cuasi-experimentales (Diferencias en diferencias, Regresión discontinua y Control sintético) deben incluir sus pruebas de falsación (tendencias previas paralelas y tests de placebo).

18. **`bi2-modelo-semantico`, `bi2-dax`, `bi3-gobierno` y `bi4-operacion` — Alineación completa con PL-300 y DP-600:**
    - **Brecha frente a fuentes (`F25`, `F26`, `F27`, `F28`, `F29`, `F32`):**
      - En `bi2-modelo-semantico` se precisa la configuración de relaciones `1:N`, el peligro de los filtros bidireccionales y el marcado oficial de la tabla `calendar`.
      - En `bi2-dax` se explicita la transición de contexto en `CALCULATE` y el uso de `DIVIDE` y variables `VAR`/`RETURN`.
      - En `bi3-gobierno` se añade la lección propia de capa semántica (separada de `L12`) y la comparación técnica de modos **Import, DirectQuery y Direct Lake** sobre Parquet/Iceberg.
      - En `bi4-operacion` se especifica el formato **Power BI Projects (`PBIP`) con `TMDL`** para revisión en Git y se conecta con la evaluación de asistentes GenBI sobre MCP.

---

## 2. Cómo se dividen las tres lecciones heredadas que mezclaban módulos (`L12`, `L15` y `L18`)

Para que el conteo de lecciones `existing` en el catálogo sea **exactamente 18** (una aparición única por cada `legacyId` de `L1` a `L18`) y los escritores de la Fase 3 tengan una frontera limpia entre módulos, se establece la siguiente partición:

### 2.1 Partición de `L12` (`l12-contracts-semantic-layer`)

| Destino | ID de lección | Estado en catálogo | Qué conserva o desarrolla en la Fase 3 |
|---|---|---|---|
| Módulo `de3-transformacion` (Nivel 3 DE, orden 3) | `l12-contracts-semantic-layer` (`legacyOrder: 12`) | `existing` | **Contratos de datos ejecutables (ODCS v3):** Secciones 1 y 2 de la L12 original. Estructura YAML de un contrato bajo ODCS v3.2 (esquema, tipos lógicos/físicos, clasificación PII, SLAs de frescura y retención), validación automática en el CI/CD del productor, patrón *circuit breaker* / tabla de cuarentena en la ingesta y entrega hacia modelos Gold/semánticos. |
| Módulo `bi3-gobierno` (Nivel 3 BI, orden 1) | `bi3-gobierno-01` | `planned` | **Capa semántica declarativa en MetricFlow y Cube:** Secciones 3 y 4 de la L12 original ampliadas para BI. Definición de `semantic_models`, entidades (`primary`, `unique`, `foreign`), dimensiones categóricas y temporales, medidas aditivas y métricas (`simple`, `ratio`, `cumulative`, `derived`), planificación automática de CTEs simétricas para bloquear fan-out y conexión por JDBC / Arrow Flight SQL. |

### 2.2 Partición de `L15` (`l15-bi-tufte-code`)

| Destino | ID de lección | Estado en catálogo | Qué conserva o desarrolla en la Fase 3 |
|---|---|---|---|
| Módulo `bi3-dashboards` (Nivel 3 BI, orden 1) | `l15-bi-tufte-code` (`legacyOrder: 15`) | `existing` | **Percepción visual, razón dato-tinta y narrativa ejecutiva:** Secciones 1, 2 y 3 de la L15 original. Jerarquía perceptual de Cleveland y McGill, maximización de la razón dato-tinta de Edward Tufte, eliminación de *chartjunk*, múltiplos pequeños (*small multiples*), gráficos de bala (*bullet graphs*) de Stephen Few y títulos activos con la Pirámide de Bárbara Minto. |
| Módulo `bi4-operacion` (Nivel 4 BI, orden 1) | `bi4-operacion-01` | `planned` | **BI como código declarativo (Evidence, Observable Framework y Rill):** Sección 4 y el bloque práctico declarativo de la L15 original desarrollados a fondo. Escritura de reportes en Markdown + SQL parametrizado contra la capa semántica, compilación de cubos Parquet servidos con DuckDB-Wasm en el navegador y validación de consultas del tablero en Pull Requests. |

### 2.3 Partición de `L18` (`l18-mcp-semantic-ai-rag`)

| Destino | ID de lección | Estado en catálogo | Qué conserva o desarrolla en la Fase 3 |
|---|---|---|---|
| Módulo `x4-ia-datos` (Nivel 4 Común, orden 1) | `l18-mcp-semantic-ai-rag` (`legacyOrder: 18`) | `existing` | **Arquitectura de servidores MCP y conexión segura a datos:** Secciones 1 y 2 de la L18 original (el resto del módulo `x4-ia-datos` desglosa en lecciones dedicadas las secciones 1, 3 y 4: por qué falla el text-to-SQL directo en `x4-ia-datos-02`, RAG híbrido BM25 + HNSW con RRF en `x4-ia-datos-03` y evaluación determinista con Golden Evals en `x4-ia-datos-04`). |
| Módulo `bi4-operacion` (Nivel 4 BI, orden 5) | `bi4-operacion-05` | `planned` | **GenBI auditable y preparación semántica para asistentes MCP:** Perspectiva de BI de la L18 original desarrollada como lección propia. Cómo documentar sinónimos, descripciones, filtros canónicos y monedas en la capa semántica para alimentar agentes MCP, y cómo diseñar respuestas auditables en el portal de BI (insignia de métrica certificada, SQL compilado inspeccionable y enlace al tablero oficial). |
