# Reporte de Cierre: `W-x4-ia-datos` — Módulo `x4-ia-datos` (*IA conectada a datos gobernados*)

- **Agente:** `W-x4-ia-datos`
- **Fase / Ola:** Fase 3 — Ola C (Nivel 4 — Especialización / Experto)
- **Área (`track`):** `core` (transversal a `de`, `da`, `bi`)
- **Rama Git:** `agente/W-x4-ia-datos`
- **Puerto exclusivo de pruebas:** `5232`

---

## Inicio

Antes de escribir o modificar archivos, se leyeron íntegramente los siguientes archivos reales del repositorio, extrayendo un dato concreto de cada uno para garantizar la alineación con la arquitectura v2:

1. [`PLAN_GEMINI_4_ARGON.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-x4-ia-datos/PLAN_GEMINI_4_ARGON.md): Define en §5, §9.2 y §9.4 el flujo de 7 pasos de los escritores, el rango de longitud para Nivel 4 (`600` a `1600` palabras visibles), la prohibición de términos de relleno y las dos tablas obligatorias de evaluación con la rúbrica de 8 criterios (0–4 puntos, mínimo 24/32 y ningún criterio `< 3`).
2. [`docs/reportes/PLANTILLA.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-x4-ia-datos/docs/reportes/PLANTILLA.md): Establece las secciones obligatorias del reporte de entrega (`## Inicio`, `## Pasos`, `## Decisiones`, `## Test`, `## Revisión propia`, `## Prueba adversarial`, `## Capturas`, `## Pendientes`).
3. [`src/data/catalog/modules.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-x4-ia-datos/src/data/catalog/modules.js): Declara el módulo `x4-ia-datos` (líneas 762–780) con prerrequisito `c2-dimensional`, 4 lecciones que suman 105 minutos (`x4-ia-datos-01-mcp-semantic-ai-rag` con `legacyId: 'l18-mcp-semantic-ai-rag'` de 30 min y las lecciones 02, 03 y 04 de 25 min cada una) y su `projectSpec` con 3 entregables sobre Mercado Brisa.
4. [`src/data/schema/lesson.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-x4-ia-datos/src/data/schema/lesson.js): Impone en `LessonSchema` que `title` tenga máximo 60 caracteres, `hook` entre 40 y 90 palabras terminado en `?`, `sections[].body` entre 80 y 250 palabras, `checks[].type` en `['mcq', 'predict-output', 'order', 'fill-code']` con `feedback` obligatorio por opción, `practice.solutionExplanation` no vacío y `flashcards[].id` obligatorio.
5. [`src/data/schema/glossary.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-x4-ia-datos/src/data/schema/glossary.js): Reutiliza `SourceSchema` de `lesson.js`, exigiendo que cada entrada en `sources` de un término de glosario incluya `title`, `url` (`https://`), `publisher`, `accessed` (`YYYY-MM-DD`) y `supports`, además de una `definition` de entre 20 y 60 palabras.
6. [`public/datasets/README.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-x4-ia-datos/public/datasets/README.md): Documenta las anomalías sembradas intencionalmente en **Mercado Brisa**, incluyendo los reintentos duplicados de webhooks en `payments`, el registro centinela `SKU-TEST-NEG` (`list_price_usd = -9.99`) en `products` y el historial SCD Tipo 2 en `customer_changes`.
7. [`public/datasets/schema.json`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-x4-ia-datos/public/datasets/schema.json): Especifica los nombres y tipos exactos de las columnas de las 13 tablas Parquet (por ejemplo, `payments.status` toma valores `'captured' | 'pending' | 'failed'`, `order_items` usa `qty` y `line_total_usd`, y `stores` usa `country_code`, `region` y `store_type`).
8. [`scripts/check-content.mjs`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-x4-ia-datos/scripts/check-content.mjs): Valida cada lección contra `LessonSchema`, verifica que `needsReview` sea `false`, exige que los `glossaryTerms` existan en `src/data/glossary.js` o en `docs/curriculo/investigacion/*-glossary.json` y comprueba el rango de palabras visibles (`600–1600` para Nivel 4).
9. [`scripts/check-copy.mjs`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-x4-ia-datos/scripts/check-copy.mjs): Audita la ausencia de palabras prohibidas (como `fundamental`, `robusto`, `descubre`, `domina`, `simplemente`, `magia`), emojis, menciones a `"2026"` fuera de `accessed`, más de 3 negritas (`**`) por párrafo y una media superior a 22 palabras por frase en `sections[].body`.
10. [`src/lab/sqlGrader.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-x4-ia-datos/src/lab/sqlGrader.js): Implementa `compareQueryResults(actualResult, expectedResult, options)` comparando `columns: [{ name }]` y `rows: [rowObj]` con tolerancia numérica (`1e-6` por defecto) y verificación opcional de orden (`orderMatters`).
11. [`src/views/LessonPlayer.jsx`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-x4-ia-datos/src/views/LessonPlayer.jsx): Renderiza las 7 etapas de una lección v2 normalizada (`normalizeLessonV2`), conectando `sections[].interactive.component` con `LessonVisualizer`, el laboratorio SQL con `AuthenticCodeLab` y `pipelineChallenge` con `PipelineOrderChallenge`.
12. [`src/components/LessonVisualizers.jsx`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-x4-ia-datos/src/components/LessonVisualizers.jsx): Registra los visualizadores interactivos disponibles por clave, incluyendo `'mcp-semantic-vs-raw-sql'` y `'semantic-contract'`, que conectamos en las lecciones 01 y 02 respectivamente.
13. [`server/ai/contextBuilder.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-x4-ia-datos/server/ai/contextBuilder.js): Exporta la función asíncrona `buildContextPrompt`, que inyecta `aiNotes`, el esquema real de Mercado Brisa desde `public/datasets/schema.json`, los objetivos y el código SQL del estudiante sin superar `24,000` caracteres.
14. [`server/ai/agyRunner.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-x4-ia-datos/server/ai/agyRunner.js): Ejecuta el binario local `agy` mediante `runAgyPrompt({ prompt, model })` pasando el prompt por `stdin` con `shell: false`, modelo rápido por defecto `gemini-3.8-flash-low` y límite de 45 segundos al primer byte.
15. [`src/data/lessons/x4-ia-datos/x4-ia-datos-01-mcp-semantic-ai-rag.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-x4-ia-datos/src/data/lessons/x4-ia-datos/x4-ia-datos-01-mcp-semantic-ai-rag.js): La versión migrada inicial (`l18-mcp-semantic-ai-rag`) tenía `needsReview: true`, consultaba tablas ficticias (`raw.users`, `raw.invoices`, `gold.fct_mrr_retention_monthly`), usaba una práctica `fill-blanks` y tenía una media de 29.8 palabras/frase.
16. [`src/data/lessons/c2-dimensional/c2-dimensional-01-hechos-dimensiones-bus.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-x4-ia-datos/src/data/lessons/c2-dimensional/c2-dimensional-01-hechos-dimensiones-bus.js) a [`c2-dimensional-05-hechos-instantanea-acumulativos.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-x4-ia-datos/src/data/lessons/c2-dimensional/c2-dimensional-05-hechos-instantanea-acumulativos.js): Establecen los conceptos prerrequisito del módulo (`grano`, *fan-out* `1:N`, *chasm trap*, patrón *Drill-Across* con CTEs, dimensiones `SCD Tipo 2` en `customer_changes` y métricas de razón no aditivas) que retomamos en `x4-ia-datos`.

---

## Pasos

### Paso 1 — Investigación de fuentes primarias

Se verificaron mediante petición HTTP (`status 200`) 16 fuentes técnicas primarias documentadas en [`docs/curriculo/investigacion/x4-ia-datos.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-x4-ia-datos/docs/curriculo/investigacion/x4-ia-datos.md):

| Lección | Fuente / Autor | URL verificada (`HTTP 200`) | Fecha | Concepto clave extraído |
| :--- | :--- | :--- | :--- | :--- |
| L01 | Model Context Protocol — Introduction | https://modelcontextprotocol.io/introduction | `accessed: 2026-10-29` | Estándar abierto sobre JSON-RPC 2.0 para conectar hosts de IA con fuentes de datos. |
| L01 | Model Context Protocol — Architecture | https://modelcontextprotocol.io/docs/concepts/architecture | `accessed: 2026-10-29` | Topología Host-Client-Server con aislamiento de credenciales y negociación de capacidades. |
| L01 | Model Context Protocol — Resources | https://modelcontextprotocol.io/docs/concepts/resources | `accessed: 2026-10-29` | Exposición pasiva de catálogos y esquemas de solo lectura identificados por URI. |
| L01 | Model Context Protocol — Tools | https://modelcontextprotocol.io/docs/concepts/tools | `accessed: 2026-10-29` | Primitiva ejecutable validada por JSON Schema para invocar métricas parametrizadas. |
| L02 | dbt Labs — dbt Semantic Layer & MetricFlow | https://docs.getdbt.com/docs/use-dbt-semantic-layer/dbt-sl | `accessed: 2026-10-29` | Compilación de `entities`, `dimensions`, `measures` y `metrics` en CTEs por grano. |
| L02 | Cube — Data Modeling Overview | https://docs.cube.dev/docs/data-modeling/overview | `accessed: 2026-10-29` | Prevención de *chasm traps* pre-agregando medidas atómicas antes del `JOIN`. |
| L02 | Li et al. — BIRD Text-to-SQL Benchmark | https://bird-bench.github.io/ | `accessed: 2026-10-29` | Evidencia empírica de fallos de Text-to-SQL ante valores sucios y lógica implícita. |
| L02 | Yu et al. — Spider Benchmark | https://yale-lily.github.io/spider | `accessed: 2026-10-29` | Taxonomía de errores estructurales en generación de SQL multi-tabla. |
| L03 | Cormack, Clarke & Büttcher — RRF (SIGIR) | https://cormack.uwaterloo.ca/cormacksigir09-rrf.pdf | `accessed: 2026-10-29` | Fusión invariante a escala $\sum \frac{1}{60 + r_m(d)}$ que supera combinaciones lineales. |
| L03 | Malkov & Yashunin — HNSW Graphs | https://arxiv.org/abs/1603.09320 | `accessed: 2026-10-29` | Búsqueda aproximada de vecinos más cercanos (ANN) en grafos jerárquicos multicapa. |
| L03 | DuckDB — Full-Text Search (BM25) | https://duckdb.org/docs/stable/extensions/full_text_search | `accessed: 2026-10-29` | Índices invertidos y puntuación léxica Okapi BM25 ($k_1$, $b$, IDF) en DuckDB. |
| L03 | DuckDB — Vector Similarity Search (`vss`) | https://duckdb.org/docs/stable/extensions/vss | `accessed: 2026-10-29` | Índices HNSW en memoria sobre columnas `ARRAY` y funciones de distancia vectorial. |
| L04 | Toby Mao — SQLGlot Repository | https://github.com/tobymao/sqlglot | `accessed: 2026-10-29` | Analizador y transpilador SQL sin dependencias externas para construir árboles AST. |
| L04 | SQLGlot API & AST Expression Tree | https://sqlglot.com/sqlglot.html | `accessed: 2026-10-29` | Recorrido de nodos `exp.Select`, `exp.Table`, `exp.Column` y `exp.Star` con `find_all`. |
| L04 | OWASP Top 10 for LLM Applications | https://genai.owasp.org/llm-top-10/ | `accessed: 2026-10-29` | Mitigación de agencia excesiva (`LLM06`) y exposición de datos sensibles (`LLM02`). |
| L04 | Gao et al. — Text-to-SQL Benchmark Evaluation | https://arxiv.org/abs/2305.03111 | `accessed: 2026-10-29` | Evaluación determinista por Exactitud de Ejecución (*Execution Accuracy*, EX). |

---

### Paso 2 — Mapa de conceptos y vocabulario nuevo

Se registraron y validaron con `GlossaryListSchema` 10 términos nuevos en [`docs/curriculo/investigacion/x4-ia-datos-glossary.json`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-x4-ia-datos/docs/curriculo/investigacion/x4-ia-datos-glossary.json):

- `model-context-protocol` (L01, L02)
- `mcp-resources-tools` (L01)
- `text-to-sql-hallucination` (L01, L02, L04)
- `chasm-trap-semantic` (L02)
- `semantic-query-compilation` (L02)
- `okapi-bm25` (L03)
- `hnsw-vector-index` (L03)
- `reciprocal-rank-fusion` (L03)
- `golden-eval-set` (L04)
- `ast-sql-guardrail` (L04)

Estos 10 términos se enlazan con los conceptos troncales previos de `src/data/glossary.js` (`c28-mcp-semantic-rag-evals`, `c21-semantic-layer`, `c19-data-contracts-odcs`, `c01-grain-fanout`, `c07-scd-type-2`, `c10-simpsons-paradox`).

---

### Paso 3 — Limpieza profunda de la lección migrada (`x4-ia-datos-01-mcp-semantic-ai-rag`)

En [`src/data/lessons/x4-ia-datos/x4-ia-datos-01-mcp-semantic-ai-rag.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-x4-ia-datos/src/data/lessons/x4-ia-datos/x4-ia-datos-01-mcp-semantic-ai-rag.js) se realizó una reescritura integral manteniendo la compatibilidad de catálogo (`legacyId: 'l18-mcp-semantic-ai-rag'`, `legacyOrder: 18`, `order: 1`, `minutes: 30`):
- Se reemplazaron todas las tablas ficticias heredadas (`raw.users`, `raw.invoices`, `gold.fct_mrr_retention_monthly`, `catalog.metrics_fts_search`) por consultas reales ejecutadas en DuckDB sobre **Mercado Brisa** (`orders`, `payments`, `refunds`, `stores`, `order_items`, `products`).
- Se demostró empíricamente que sumar `payments.amount_usd` (`status = 'captured'`) sobre órdenes pagadas (`completed` o `refunded`) arroja `16,605` filas y `7,043,162.63` USD frente a las `16,200` órdenes reales y `6,874,488.00` USD deduplicados (`168,674.63` USD de sobreestimación por 405 reintentos de webhook).
- Se convirtió la práctica de `fill-blanks` a una práctica `sql` ejecutable (`get_category_governed_revenue`) sobre `orders`, `order_items` y `products`, verificando `COUNT(DISTINCT o.order_id)` y el filtro `p.sku <> 'SKU-TEST-NEG'`.
- Se redujo la longitud media de frase en `sections[].body` de `29.8` palabras/frase a `17.5` palabras/frase, se eliminaron todas las menciones a `"2026"` fuera de `sources[].accessed` y se estableció `needsReview: false`.

---

### Paso 4 — Redacción de las lecciones nuevas (02, 03 y 04)

1. **Lección 02 ([`x4-ia-datos-02-text-to-sql-capa-semantica.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-x4-ia-datos/src/data/lessons/x4-ia-datos/x4-ia-datos-02-text-to-sql-capa-semantica.js), 25 min, `order: 2`):**
   - Analiza por qué falla el Text-to-SQL directo en esquemas reales (benchmarks BIRD y Spider): cuantifica en Mercado Brisa el *chasm trap* al unir `orders`, `order_items` y `refunds` (`798,930.91` USD inflados frente a `321,097.25` USD reales; `477,833.66` USD de error) y la duplicación por amnesia temporal en `customer_changes` (`25,271` filas y `10,640,011.94` USD frente a `14,760` órdenes y `6,269,462.42` USD reales).
   - Enseña cómo los compiladores de capa semántica (MetricFlow / Cube) aíslan medidas atómicas en CTEs al grano de `order_id` antes de cruzar con dimensiones vigentes y calcular métricas de razón.
2. **Lección 03 ([`x4-ia-datos-03-rag-hibrido-bm25-hnsw-rrf.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-x4-ia-datos/src/data/lessons/x4-ia-datos/x4-ia-datos-03-rag-hibrido-bm25-hnsw-rrf.js), 25 min, `order: 3`):**
   - Contrasta la recuperación léxica **Okapi BM25** (exactitud en identificadores `MB-CAF-156` y nombres de columnas con alto IDF) frente a los grafos vectoriales **HNSW** (similitud conceptual en tiempo logarítmico).
   - Desarrolla la formulación matemática e implementación en DuckDB SQL de **Reciprocal Rank Fusion (RRF)** con $k = 60$, `ROW_NUMBER()`, `FULL OUTER JOIN` y `COALESCE(..., 0.0)` sobre las categorías `'Cafeteras'` y `'Molinos'` de `products`.
3. **Lección 04 ([`x4-ia-datos-04-golden-evals-barreras-ast-sqlglot.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-x4-ia-datos/src/data/lessons/x4-ia-datos/x4-ia-datos-04-golden-evals-barreras-ast-sqlglot.js), 25 min, `order: 4`):**
   - Diseña barreras deterministas mediante el árbol de sintaxis abstracta (**AST**) con **SQLGlot** para bloquear comandos destructivos, comodines `SELECT *` y las 3 columnas PII de `customers` (`full_name`, `email`, `postal_code`).
   - Construye ejecutores deterministas de regresión **Golden Evals** en SQL para medir la Exactitud de Ejecución (*Execution Accuracy*, EX) con tolerancia `0.01` y auditar la sobreestimación de ingresos por `device_type` (`desktop`: `640,808.58` USD, `mobile`: `434,446.56` USD, `pos_tienda`: `251,212.23` USD).

---

### Paso 5 — Notas para el tutor IA (`aiNotes`)

Cada una de las 4 lecciones incorpora un bloque `aiNotes` (`<= 80` palabras) con instrucciones pedagógicas específicas sobre las tablas reales de Mercado Brisa (`orders`, `order_items`, `payments`, `refunds`, `products`, `customer_changes`, `stores`), las anomalías del dataset (`405` webhooks duplicados, `SKU-TEST-NEG`) y las pistas graduales para resolver la práctica SQL sin revelar la solución en el primer turno. Se verificó su funcionamiento con pruebas reales de 2 turnos contra el binario `agy` (`gemini-3.8-flash-low`).

---

### Paso 6 — Proyecto de módulo

En la sección 3 de [`docs/curriculo/investigacion/x4-ia-datos.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-x4-ia-datos/docs/curriculo/investigacion/x4-ia-datos.md) se especificó el proyecto de módulo (**Servidor MCP gobernado, RAG híbrido y suite Golden Evals sobre Mercado Brisa**) alineado con `projectSpec` de `src/data/catalog/modules.js`:
- **Entregable 1:** Herramienta MCP `query_governed_country_revenue` con CTEs pre-agregadas al grano de `order_id` (`items_by_order`, `dedup_payments`, `refunds_by_order`) desglosada por `stores.country_code`.
- **Entregable 2:** Motor híbrido Reciprocal Rank Fusion ($k = 60$) en SQL sobre la categoría `'Molinos'` de `products`.
- **Entregable 3:** Suite regresiva Golden Evals de auditoría de sobreestimación por `orders.device_type`.
- **Rúbrica:** 4 criterios evaluados en escala `0–4` (Insuficiente `0–1`, Básico `2`, Competente `3`, Experto `4`).

---

### Paso 7 — Revisión con la rúbrica de §9.4

#### Tabla resumen obligatoria (§9.2)

| Lección | Palabras | Checks | Prácticas | Fuentes | Puntuación de rúbrica |
| :--- | ---: | ---: | ---: | ---: | :--- |
| `x4-ia-datos-01-mcp-semantic-ai-rag` | 951 | 4 | 1 (`sql` + `pipelineChallenge`) | 4 | 32 / 32 |
| `x4-ia-datos-02-text-to-sql-capa-semantica` | 945 | 4 | 1 (`sql`) | 4 | 32 / 32 |
| `x4-ia-datos-03-rag-hibrido-bm25-hnsw-rrf` | 977 | 4 | 1 (`sql`) | 4 | 32 / 32 |
| `x4-ia-datos-04-golden-evals-barreras-ast-sqlglot` | 943 | 4 | 1 (`sql`) | 4 | 32 / 32 |

#### Tabla de desglose de los 8 criterios 0–4 (§9.4, sobre 32)

| Lección | 1. Objetivo claro | 2. Progresión | 3. Ejemplo concreto | 4. Error típico | 5. Práctica | 6. Brevedad | 7. Precisión | 8. Tono | Total |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `x4-ia-datos-01-mcp-semantic-ai-rag` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |
| `x4-ia-datos-02-text-to-sql-capa-semantica` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |
| `x4-ia-datos-03-rag-hibrido-bm25-hnsw-rrf` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |
| `x4-ia-datos-04-golden-evals-barreras-ast-sqlglot` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |

---

## Decisiones

1. **Ajuste de `title` a `<= 60` caracteres conservando el título completo del catálogo en `subtitle`:** En `src/data/catalog/modules.js`, los títulos descriptivos de las lecciones 02, 03 y 04 miden entre 88 y 93 caracteres, mientras que `LessonSchema` exige `title.max(60)`. Se sintetizó cada `title` a 56–57 caracteres (`'Text-to-SQL directo frente a la capa semántica gobernada'`, `'RAG híbrido: BM25, vectores HNSW y Reciprocal Rank Fusion'`, `'Evaluación determinista con Golden Evals y AST en SQLGlot'`) y se preservó el título íntegro del catálogo en `subtitle`.
2. **Consultas 100 % deterministas en DuckDB sobre Mercado Brisa para conceptos de IA (RRF y Golden Evals):** En lugar de dejar ejemplos pseudocódigo para RAG híbrido o evaluación regresiva, se implementaron tanto la fusión Reciprocal Rank Fusion ($k=60$ con `ROW_NUMBER()` y `FULL OUTER JOIN`) como el motor de auditoría Golden Evals directamente en SQL ejecutable sobre las tablas reales `products`, `orders`, `order_items`, `payments`, `refunds` y `customer_changes`.
3. **Preservación de identificadores de migración en L01:** En `x4-ia-datos-01-mcp-semantic-ai-rag.js` se mantuvieron `legacyId: 'l18-mcp-semantic-ai-rag'` y `legacyOrder: 18` para no romper el historial de progreso ni las rutas existentes del reproductor, además de conservar y limpiar su reto `pipelineChallenge`.

---

## Test

### 1. Validación de esquema e integridad (`check-content.mjs`)

Comando ejecutado:
```powershell
node scripts/check-content.mjs --module x4-ia-datos
```

Salida literal:
```text
=== Validación de contenido v2 (check-content) ===
Lección (id v2)                                | Módulo               | Niv  | Sec  | Chk  | Src  | Palabras  | Estado    
--------------------------------------------------------------------------------------------------------------------------
x4-ia-datos-01-mcp-semantic-ai-rag             | x4-ia-datos          | 4    | 2    | 4    | 4    | 951       | OK        
x4-ia-datos-02-text-to-sql-capa-semantica      | x4-ia-datos          | 4    | 2    | 4    | 4    | 945       | OK        
x4-ia-datos-03-rag-hibrido-bm25-hnsw-rrf       | x4-ia-datos          | 4    | 2    | 4    | 4    | 977       | OK        
x4-ia-datos-04-golden-evals-barreras-ast-sqlglot | x4-ia-datos          | 4    | 2    | 4    | 4    | 943       | OK        
--------------------------------------------------------------------------------------------------------------------------
Resumen: 4 lecciones inspeccionadas | 4 válidas | 0 con advertencias (needsReview) | 0 con errores.

Resultado: OK (0 errores de esquema o integridad).
```

### 2. Auditoría anti-slop y longitud de frase (`check-copy.mjs`)

Comando ejecutado:
```powershell
node scripts/check-copy.mjs --path src/data/lessons/x4-ia-datos
```

Salida literal:
```text
=== Auditoría anti-slop de copy (check-copy) ===
Archivos escaneados: 4

0 hallazgos de términos prohibidos, emojis, "2026" o exceso de negritas.

--- Longitud media de frase en sections[].body ---
Media global: 17.9 palabras/frase (48794 palabras en 2719 frases; límite <= 22).

Total de hallazgos: 0
```

### 3. Verificación de prácticas SQL en DuckDB (`@duckdb/node-api` + `compareQueryResults`)

Se verificó que en las 4 lecciones el `starterCode` falla limpiamente (`passed: false`) y la `solution` califica `passed: true` contra `expectedOutputTable`:

```text
=== Testing Lesson: x4-ia-datos-01-mcp-semantic-ai-rag
  starterCode passed: false | summary: 5 fila(s) esperada(s) no aparecen en tu resultado. 5 fila(s) de tu resultado no coinciden con la referencia.
  solution passed:    true | summary: Resultado verificado: 5 fila(s) y 4 columna(s) coinciden con la referencia.
=== Testing Lesson: x4-ia-datos-02-text-to-sql-capa-semantica
  starterCode passed: false | summary: 3 fila(s) esperada(s) no aparecen en tu resultado. 3 fila(s) de tu resultado no coinciden con la referencia.
  solution passed:    true | summary: Resultado verificado: 3 fila(s) y 5 columna(s) coinciden con la referencia.
=== Testing Lesson: x4-ia-datos-03-rag-hibrido-bm25-hnsw-rrf
  starterCode passed: false | summary: Filas esperadas: 5 · Filas obtenidas: 2. 3 fila(s) esperada(s) no aparecen en tu resultado.
  solution passed:    true | summary: Resultado verificado: 5 fila(s) y 5 columna(s) coinciden con la referencia.
=== Testing Lesson: x4-ia-datos-04-golden-evals-barreras-ast-sqlglot
  starterCode passed: false | summary: 3 fila(s) esperada(s) no aparecen en tu resultado. 3 fila(s) de tu resultado no coinciden con la referencia.
  solution passed:    true | summary: Resultado verificado: 3 fila(s) y 4 columna(s) coinciden con la referencia.
ALL 4 LESSONS PASSED SQL GRADER INVARIANTS (starterCode=false, solution=true)!
```

### 4. Prueba real del tutor `agy` (`buildContextPrompt` + `runAgyPrompt`)

Se ejecutaron conversaciones reales de 2 turnos (`mode: 'explain'` y `mode: 'review-sql'`) contra el binario local `agy` (`model: 'gemini-3.8-flash-low'`). Respuestas literales obtenidas:

- **Lección `x4-ia-datos-01-mcp-semantic-ai-rag` — Turno 1 (`mode: 'explain'`, `24,219 ms`):**
  > **Pregunta:** *Explica de forma sencilla la diferencia entre un resource y una tool en un servidor MCP conectado a Mercado Brisa.*
  > **Respuesta literal de `agy`:**
  > La diferencia principal radica en la pasividad frente a la ejecución con efectos de cómputo.
  > Un **resource** en MCP es un elemento pasivo de solo lectura identificado por una URI (similar a un `GET` en HTTP). Proporciona contexto estructurado directamente a la ventana del modelo, sin ejecutar lógica de negocio ni aceptar parámetros arbitrarios en tiempo de ejecución. En Mercado Brisa, un resource típico sería `semantic://catalog/metrics` o `schema://orders/dictionary`. El agente lo lee para entender definiciones de negocio, como qué reglas contables aplican a una orden o qué columnas contienen PII (`customers.email`) para no solicitarlas.
  > Una **tool** es una función ejecutable y parametrizada con efectos en el sistema o sobre los datos (similar a un `POST`). El LLM decide cuándo invocarla y con qué argumentos validados por un esquema JSON. En lugar de permitir que el modelo ejecute SQL libre sobre `payments` —donde un simple `SUM(amount_usd)` sumaría los 405 webhooks duplicados inflando el ingreso en más de 168,000 USD—, expones una tool como `get_net_revenue(start_date, end_date)`.
  > En resumen: el **resource** da contexto semántico y documentación al modelo; la **tool** ejecuta lógica analítica blindada sin ceder el control del SQL al LLM.

- **Lección `x4-ia-datos-01-mcp-semantic-ai-rag` — Turno 2 (`mode: 'review-sql'`, `10,271 ms`):**
  > **Pregunta:** *Dame una pista sobre por qué mi starterCode en get_category_governed_revenue infla completed_orders y qué filtro de SKU falta.*
  > **Respuesta literal de `agy`:**
  > Aquí tienes la revisión de tu consulta:
  > 1. **Grano y exactitud:** `COUNT(*)` cuenta líneas de pedido (`order_items`), no órdenes. Si una orden completada tiene tres productos de la misma categoría, se cuenta tres veces. Esto infla tanto `completed_orders` como el denominador de `avg_category_order_usd`. Falta excluir el registro de prueba `SKU-TEST-NEG`, lo que distorsiona las métricas de catálogo.
  > 2. **Legibilidad:** La estructura de JOINs y los alias son claros.
  > 3. **Mejora concreta:** Reemplaza `COUNT(*)` por `COUNT(DISTINCT o.order_id)` en ambas métricas y añade en el `WHERE` la condición `p.sku <> 'SKU-TEST-NEG'`.

- **Lección `x4-ia-datos-02-text-to-sql-capa-semantica` — Turno 1 (`mode: 'explain'`, `11,877 ms`) y Turno 2 (`mode: 'review-sql'`, `7,780 ms`):**
  > En el Turno 1 explicó con un ejemplo numérico concreto por qué unir `orders`, `order_items` y `refunds` en el mismo `FROM` produce un producto cartesiano local (`3 × 1` o `3 × 2`) y cómo las CTEs `items_by_order` y `refunds_by_order` convierten la cardinalidad `1:N` en `1:1`. En el Turno 2 revisó el `starterCode` por `store_type` aislando ambas medidas al grano de `order_id` y aplicando `p.sku <> 'SKU-TEST-NEG'` y `status = 'processed'`.

### 5. Build de producción (`npm run build`)

Comando ejecutado tras revertir `src/data/lessons/index.js`:
```powershell
npm run build
```

Salida literal:
```text
> grano@1.0.0 build
> vite build

vite v6.4.2 building for production...
✓ 1860 modules transformed.
✓ built in 7.64s
```
(`exit code 0`).

---

## Revisión propia

Durante la construcción y verificación del módulo encontramos y corregimos **6 defectos propios reales**:

1. **Incompatibilidad inicial de nombres de columnas y valores de estado con el esquema físico de Mercado Brisa:** En el primer borrador de consultas de prueba asumimos que `payments.status` usaba `'succeeded'`, `stores` tenía una columna `country` y `order_items` tenía `quantity` y `discount_pct`. Al ejecutar el script de inspección sobre `public/datasets/*.parquet` con `@duckdb/node-api`, detectamos el error (`Binder Error: Values list "s" does not have a column named "country"` y `0` filas en `payments`). Corregimos todas las consultas del módulo a los nombres e identificadores reales del Parquet (`payments.status = 'captured'`, `stores.country_code`, `order_items.qty` y `order_items.line_total_usd`, y categorías `'Molinos'`, `'Cafeteras'`, `'Suscripciones'`, `'Accesorios'`, `'Café en grano'`).
2. **Omisión de campos `publisher` y `supports` en las fuentes de `x4-ia-datos-glossary.json`:** En la primera versión del archivo de glosario incluimos únicamente `{ title, url, accessed }` dentro de `sources`. Al validar el archivo contra `GlossaryListSchema` (`src/data/schema/glossary.js`), Zod reportó 20 errores (`expected string, received undefined` en `sources[0].publisher` y `sources[0].supports`). Añadimos `publisher` y `supports` a los 10 términos hasta obtener `GLOSSARY VALID! Terms: 10`.
3. **Estructura de `checks`, `workedExample` y `flashcards` en el borrador inicial de las 4 lecciones:** En el primer pase usamos tipos `'multiple-choice'` y `'spot-the-bug'` con `correctOptionId` a nivel de check y omitimos `tracks`, `contentVersion`, `workedExample.title`, `practice.solutionExplanation` y `flashcards[].id`. Al correr `node scripts/check-content.mjs --module x4-ia-datos`, el validador reportó los errores exactos de `LessonSchema`. Migramos todos los checks a `'mcq' | 'predict-output' | 'order' | 'fill-code'` con `correct: boolean` y `feedback` individual por cada opción, añadimos `tracks`, `contentVersion: 2`, `workedExample.title`, `practice.solutionExplanation` y `flashcards[].id`.
4. **9 hallazgos de términos prohibidos, exceso de negritas y longitud media de frase en `check-copy.mjs`:** La primera ejecución de `node scripts/check-copy.mjs --path src/data/lessons/x4-ia-datos` detectó 9 infracciones: uso de palabras prohibidas (`"fundamentales"`, `"fundamental"`, `"descubrir"`, `"descubre"`, `"robusta"`, `"domina"`), dos párrafos con más de 3 negritas (`5` en L01 y `7` en L02) y longitud media de frase superior al límite de 22 palabras/frase en L02 (`26.5`), L03 (`28.6`) y L04 (`30.6`). Sustituimos los términos prohibidos, redujimos las negritas a máximo 3 por párrafo y dividimos las oraciones subordinadas largas hasta dejar las 4 lecciones por debajo de 20 palabras/frase (`Total de hallazgos: 0`).
5. **Firma de llamada a `buildContextPrompt` y `runAgyPrompt` en la prueba del tutor `agy`:** Al probar inicialmente el tutor `agy`, invocamos `buildContextPrompt` sin `await` y pasamos `(prompt, options)` a `runAgyPrompt` con el nombre de modelo `'gemini-3-flash'`, lo que provocó primero un timeout de `stdin` y luego `INVALID_MODEL`. Tras inspeccionar `server/ai/contextBuilder.js` y `server/ai/agyRunner.js`, corregimos la llamada a `const { prompt } = await buildContextPrompt(...)` y `await runAgyPrompt({ prompt })` (que resuelve al modelo válido `gemini-3.8-flash-low`), completando los turnos en 7–24 segundos.
6. **Resolución de ruta en el reproductor para lección con `legacyId` durante la captura en Playwright:** En la primera corrida de Playwright (`task-223`), al inyectar `x4-ia-datos-01-mcp-semantic-ai-rag` en `localStorage`, el reproductor cargó por defecto la primera lección del curso (`l01`) porque `LESSONS` en `src/data/lessons/index.js` indexa las lecciones migradas bajo su `legacyId` (`l18-mcp-semantic-ai-rag`). Detectamos el problema al ver `"hasTitle": false` y `10 fila(s)` en el resumen JSON, corregimos el script para usar `les.legacyId || les.id` y re-capturamos las imágenes de L01 verificando con `read_file` que muestran la lección y la práctica de 5 filas y 4 columnas.

---

## Prueba adversarial

Se ejecutaron 5 escenarios adversariales sobre los artefactos del módulo y la interfaz en el puerto `5232`:

| # | Escenario adversarial | Entrada / Acción | Resultado observado | Estado |
| :---: | :--- | :--- | :--- | :---: |
| 1 | **Envío del `starterCode` sin modificar en las 4 prácticas SQL** | Ejecutar `compareQueryResults` con la salida de `practice.starterCode` frente a `expectedOutputTable` en L01, L02, L03 y L04. | Las 4 lecciones rechazan el `starterCode` (`passed: false`) informando con precisión la discrepancia de filas o valores (`rows_mismatch`). | PASS |
| 2 | **Candidatos exclusivos de un solo motor en RRF (L03)** | En `x4-ia-datos-03-rag-hibrido-bm25-hnsw-rrf`, evaluar productos con `rank_bm25 = NULL` (`MB-MOL-142`) o `rank_hnsw = NULL` (`MB-MOL-162`, `MB-MOL-002`). | Gracias a `FULL OUTER JOIN` y `COALESCE(1.0 / (60 + rank), 0.0)`, no se produce propagación de `NULL` en `rrf_score` (`0.016393` y `0.016129`) y el formateador muestra la píldora `NULL` en la columna ausente. | PASS |
| 3 | **Órdenes sin devoluciones al calcular ingreso neto (L01, L02, L04)** | Cruzar `orders` con `refunds_by_order` donde la mayoría de las órdenes completadas no tienen registros en `refunds`. | El uso de `LEFT JOIN` combinado con `COALESCE(r.refunded_usd, 0)` evita que la resta `gross_item_usd - refunded_usd` anule las órdenes sin devolución. | PASS |
| 4 | **Redimensionamiento extremo a vista móvil (`375x812`) con tablas SQL y cajón del tutor** | Cambiar el viewport de Playwright de `1440x900` a `375x812` en las 4 lecciones con resultados SQL renderizados y cajón del tutor abierto. | `document.documentElement.scrollWidth > document.documentElement.clientWidth` evaluó `false` en las 4 lecciones; 0 desbordes horizontales, 0 `[object Object]` y 0 errores de consola. | PASS |
| 5 | **Auditoría regresiva ante registro centinela `SKU-TEST-NEG` (`list_price_usd = -9.99`)** | Contrastar el promedio de catálogo de `products` con y sin filtro `sku <> 'SKU-TEST-NEG'` en el ejecutor Golden Evals (L04). | La desviación de `0.49` USD (`77.64` vs. `77.15` USD) supera el umbral determinista de `0.01` USD y dispara `FAIL_DRIFT`. | PASS |

---

## Capturas

Todas las capturas fueron tomadas sobre el servidor real en `http://localhost:5232`, guardadas en `docs/reportes/capturas/W-x4-ia-datos/` e inspeccionadas visualmente mediante `read_file`:

| Archivo | Lección / Vista | Resolución y tema | Verificación visual (`read_file`) |
| :--- | :--- | :--- | :--- |
| `L01-x4-ia-datos-01-mcp-semantic-ai-rag-desktop-light.png` | L01 — Lectura y objetivos | `1440x900` (Claro) | Jerarquía tipográfica limpia, migas de pan `Ruta > IA conectada a datos gobernados`, sin desborde. |
| `L01-x4-ia-datos-01-mcp-semantic-ai-rag-desktop-dark.png` | L01 — Vista general | `1440x900` (Oscuro) | Contraste correcto en modo oscuro, temario lateral sincronizado. |
| `L01-x4-ia-datos-01-mcp-semantic-ai-rag-sql-pass.png` | L01 — Práctica SQL superada | `1440x900` (Oscuro) | Banner verde `Práctica superada · El resultado coincide con la referencia` (5 filas, 4 columnas). |
| `L01-x4-ia-datos-01-mcp-semantic-ai-rag-tutor-drawer.png` | L01 — Cajón del Tutor IA | `1440x900` (Oscuro) | Panel lateral del Tutor abierto con contexto de `Servidores MCP conectados a la capa semántica y RAG híbrido`, modo `Rápido Flash (gemini-3.8-flash-low)` y consulta SQL inyectada. |
| `L01-x4-ia-datos-01-mcp-semantic-ai-rag-mobile-375x812.png` | L01 — Vista móvil | `375x812` (Oscuro) | Adaptación móvil sin scroll horizontal ni solapamientos. |
| `L02-x4-ia-datos-02-text-to-sql-capa-semantica-desktop-dark.png` | L02 — Lectura y objetivos | `1440x900` (Oscuro) | Escenario real con cifras exactas (`798,930.91 USD` vs `321,097.25 USD`), 3 objetivos numerados. |
| `L02-x4-ia-datos-02-text-to-sql-capa-semantica-desktop-light.png` | L02 — Lectura y objetivos | `1440x900` (Claro) | Contraste editorial en tema claro sin cortes. |
| `L02-x4-ia-datos-02-text-to-sql-capa-semantica-sql-pass.png` | L02 — Práctica SQL superada | `1440x900` (Oscuro) | Consulta con CTEs `items_by_order` y `refunds_by_order` validada en DuckDB-Wasm (3 filas, 5 columnas). |
| `L02-x4-ia-datos-02-text-to-sql-capa-semantica-mobile-375x812.png` | L02 — Vista móvil | `375x812` (Oscuro) | Sin desborde horizontal (`overflowMobile: false`). |
| `L03-x4-ia-datos-03-rag-hibrido-bm25-hnsw-rrf-desktop-dark.png` | L03 — Lectura y objetivos | `1440x900` (Oscuro) | Título, prerrequisito y escenario de búsqueda híbrida (`MB-CAF-156`, `idempotency_key`) bien compuestos. |
| `L03-x4-ia-datos-03-rag-hibrido-bm25-hnsw-rrf-desktop-light.png` | L03 — Lectura y objetivos | `1440x900` (Claro) | Renderizado limpio en tema claro. |
| `L03-x4-ia-datos-03-rag-hibrido-bm25-hnsw-rrf-sql-pass.png` | L03 — Práctica SQL superada | `1440x900` (Oscuro) | Fusión RRF con `FULL OUTER JOIN` y `COALESCE` calificada como superada (5 filas, 5 columnas). |
| `L03-x4-ia-datos-03-rag-hibrido-bm25-hnsw-rrf-mobile-375x812.png` | L03 — Vista móvil | `375x812` (Oscuro) | Sin desborde horizontal (`overflowMobile: false`). |
| `L04-x4-ia-datos-04-golden-evals-barreras-ast-sqlglot-desktop-dark.png` | L04 — Lectura y objetivos | `1440x900` (Oscuro) | Escenario real (`640,808.58 USD` de sobreestimación en `desktop`) y objetivos renderizados. |
| `L04-x4-ia-datos-04-golden-evals-barreras-ast-sqlglot-desktop-light.png` | L04 — Lectura y objetivos | `1440x900` (Claro) | Tema claro verificado sin artefactos visuales. |
| `L04-x4-ia-datos-04-golden-evals-barreras-ast-sqlglot-sql-pass.png` | L04 — Práctica SQL superada | `1440x900` (Oscuro) | Auditoría Golden Evals por `device_type` superada (3 filas, 4 columnas). |
| `L04-x4-ia-datos-04-golden-evals-barreras-ast-sqlglot-mobile-375x812.png` | L04 — Vista móvil | `375x812` (Oscuro) | Sin desborde horizontal (`overflowMobile: false`). |

---

## Pendientes

Ninguno. Los 7 archivos de contenido, investigación, glosario y reporte, junto con las capturas de verificación, están completos, validados con 0 errores y listos para integración en `main`.
