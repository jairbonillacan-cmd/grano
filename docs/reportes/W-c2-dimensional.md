# Reporte de Ejecución — Subagente `W-c2-dimensional`

- **Módulo:** `c2-dimensional` (*"Modelado dimensional"*) — Nivel 2 (Intermedio), Área `core` (Tronco común)
- **Rama de trabajo:** `agente/W-c2-dimensional`
- **Worktree:** `C:\Users\T490s\Desktop\Proyectos\ING-W-c2-dimensional`
- **Puerto Vite asignado:** `5212`
- **Fecha:** `2026-10-29`

---

## Inicio

### 1. Comprensión de la tarea y alcance
El objetivo de `W-c2-dimensional` es ejecutar el ciclo completo de producción curricular de 6 pasos del **Apéndice C** para las 5 lecciones del módulo `c2-dimensional`:
1. **`c2-dimensional-01-hechos-dimensiones-bus`** (creación desde cero): Diseño de hechos y dimensiones conformadas, declaración del grano de 4 pasos de Kimball, claves sustitutas, dimensiones degeneradas (`order_id`), matriz de bus empresarial y consultas multipaso *Drill-Across* (`FULL OUTER JOIN` entre CTEs preagregadas de `orders` y `refunds`).
2. **`c2-dimensional-02-star-schema-obt`** (limpieza y reescritura profunda de `l4-star-schema-obt`): Topología de esquema en estrella frente a copo de nieve (*Snowflake*) y tabla ancha desnormalizada (*One Big Table*, OBT), codificación por diccionario y RLE en Parquet/DuckDB, filtrado de anomalías de catálogo (`SKU-TEST-NEG`, `list_price_usd = -9.99`) y prevención de *fan-out* al cruzar `orders` (`18,000` filas) con `order_items` (`42,000` filas).
3. **`c2-dimensional-03-scd2-history`** (limpieza y reescritura profunda de `l5-scd2-history`): Taxonomía SCD Tipo 1 (*As-Is*), Tipo 2 (*As-Was*), Tipo 3 y Tipo 6; intervalos temporales semiabiertos `[valid_from, valid_to)` con `valid_to IS NULL` e `is_current = true` sobre `customer_changes`, y cruces *Point-in-Time* reales en DuckDB (`$1,528,183.35` en `bronce` *As-Was* frente a `$900,084.30` *As-Is*, evitando el *fan-out* de `25,271` filas).
4. **`c2-dimensional-04-metrics-simpson`** (limpieza y reescritura profunda de `l6-metrics-simpson`): Clasificación algebraica de hechos aditivos, semiaditivos y no aditivos; árboles de KPIs y métricas de guarda (*Guardrails*); agregación de razones como cociente de sumas (`SUM(num) / NULLIF(SUM(den), 0)`) sobre `marketing_spend`; no aditividad de `COUNT(DISTINCT customer_id)` con bocetos HyperLogLog (HLL); paradoja de Simpson y descomposición exacta de Kitagawa-Oaxaca sobre `orders` y `customers` (`+$54.81` de efecto tasa + `+$7.38` de efecto mezcla = `+$62.19` de brecha AOV entre `desktop` y `mobile`).
5. **`c2-dimensional-05-hechos-instantanea-acumulativos`** (creación desde cero): Contraste estructural y algebraico entre los tres patrones de tablas de hechos de Kimball —transaccional (`orders`/`order_items`), instantánea periódica mensual (`fct_monthly_region_snapshot` con reglas semiaditivas `ARG_MAX` y `AVG`) e instantánea acumulativa de ciclo de vida del pedido (`fct_order_lifecycle` preagregando `payments` y `refunds` a grano `1 fila = 1 order_id`).

### 2. Resumen individual de los 25 archivos de lectura obligatoria
1. **[`PROMPT_MAESTRO_ORQUESTADOR.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/PROMPT_MAESTRO_ORQUESTADOR.md):** Define la arquitectura multiagente de Grano, las reglas de aislamiento por worktree, la prohibición absoluta de editar `src/data/lessons/index.js` o `src/data/glossary.js` en el commit final y la estructura obligatoria D.3 del reporte.
2. **[`docs/REDISEÑO_CURRICULAR_Y_PLAN_MULTIAGENTE.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/docs/REDISE%C3%91O_CURRICULAR_Y_PLAN_MULTIAGENTE.md):** Especifica el currículo de 32 módulos y 154 lecciones, el esquema Zod v2 (Apéndice A), las reglas editoriales anti-slop (Apéndice B: cero emojis, cero palabras prohibidas, media de frase $\le 22$ palabras, entre 850 y 1,250 palabras visibles), el flujo de 6 pasos con rúbrica de 8 criterios $\ge 27/32$ (Apéndice C) y la plantilla de reporte D.3.
3. **[`src/data/schema/lesson.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/schema/lesson.js):** Implementa `LessonSchema`, `GlossaryTermSchema` y `ProjectDeliverableSchema` con Zod, incluyendo límites estrictos como `title.max(60)`, `hook` de 40–90 palabras terminado en `?`, 2–6 secciones con 120–260 palabras, `checks` de 3–6 ítems con al menos 2 tipos distintos, `summary` de 3–5 frases $\le 25$ palabras y `aiNotes` $\le 80$ palabras.
4. **[`src/data/catalog/modules.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/catalog/modules.js):** Declara el módulo `c2-dimensional` (Nivel 2, área `core`, prerrequisito `c1-modelo`, proyecto `c2-dimensional-project`) con sus 5 lecciones (`c2-dimensional-01` a `c2-dimensional-05`) y los `legacyId` de las lecciones 02 (`l4-star-schema-obt`), 03 (`l5-scd2-history`) y 04 (`l6-metrics-simpson`).
5. **[`src/data/catalog/tracks.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/catalog/tracks.js):** Define las 4 rutas curriculares (`core`, `de`, `da`, `bi`) y el orden en que `core` integra `c2-dimensional` como puente hacia las especializaciones de Nivel 2 y Nivel 3.
6. **[`src/data/catalog/levels.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/catalog/levels.js):** Describe los niveles de progresión (Nivel 0 a Nivel 4), situando el Nivel 2 (*Intermedio*) en el dominio de modelado analítico, SQL avanzado y diseño de almacenes de datos.
7. **[`src/data/glossary.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/glossary.js):** Contiene los 25 términos canónicos del glosario v2 (incluyendo `c06-star-vs-obt`, `c07-scd-type-2`, `c08-point-in-time`, `c09-kpi-trees-guardrails`, `c10-simpsons-paradox` y `c11-additivity-hll`), que referenciamos desde `glossaryTerms` sin modificar el archivo compartido.
8. **[`src/lab/mercadoBrisaSchema.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/lab/mercadoBrisaSchema.js):** Documenta las 12 tablas del dataset determinista **Mercado Brisa** en DuckDB (`customers`, `customer_changes`, `products`, `stores`, `orders`, `order_items`, `payments`, `refunds`, `events`, `marketing_spend`, `experiments`, `experiment_assignments`) con sus anomalías deliberadas (`SKU-TEST-NEG`, correos en mayúsculas, múltiples versiones en `customer_changes`, múltiples reembolsos por orden).
9. **[`src/lab/sqlGrader.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/lab/sqlGrader.js):** Implementa `compareQueryResults` y `gradeSqlPractice` con tolerancia numérica (`epsilon = 1e-2`) y comparación por orden (`orderMatters: true/false`) contra la ejecución real en DuckDB.
10. **[`src/components/LessonVisualizers.jsx`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/components/LessonVisualizers.jsx):** Registra los simuladores interactivos embebibles mediante `sec.interactive.component`, incluyendo `'star-obt'`, `'scd2-timeline'`, `'kpi-simpson'`, `'join-grain'` y `'medallion-flow'`.
11. **[`scripts/check-content.mjs`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/scripts/check-content.mjs):** Valida cada lección contra `LessonSchema`, verifica conteos de palabras visibles (850–1,250), unicidad de IDs, existencia de `glossaryTerms` (aceptando `docs/curriculo/investigacion/<moduleId>-glossary.json`) y validez de `prerequisites`.
12. **[`scripts/check-copy.mjs`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/scripts/check-copy.mjs):** Escanea archivos de lecciones y documentos de investigación en busca de términos prohibidos, emojis, menciones al año `"2026"` fuera de URLs/fechas ISO, exceso de negritas ($> 4$ por párrafo) y longitud media de frase ($> 22$ palabras/frase).
13. **[`scripts/check-catalog.mjs`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/scripts/check-catalog.mjs):** Verifica la coherencia global entre `modules.js`, `tracks.js`, `levels.js` y las lecciones sincronizadas.
14. **[`server/ai/contextBuilder.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/server/ai/contextBuilder.js):** Construye los prompts contextualizados del Tutor IA inyectando `level`, `trackName`, `lessonTitle`, `sectionHeading`, `objectives`, `sectionBody`, `aiNotes` y el esquema de Mercado Brisa bajo el límite de `24,000` caracteres.
15. **[`server/ai/agyRunner.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/server/ai/agyRunner.js):** Ejecuta el binario real `agy` CLI en modo sin estado con aislamiento de directorio temporal y control de *timeouts* (`firstByteTimeoutMs`, `totalTimeoutMs`).
16. **[`docs/curriculo/auditoria-lecciones-existentes.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/docs/curriculo/auditoria-lecciones-existentes.md):** Detalla los defectos de las 18 lecciones migradas en T4, señalando para `c2-dimensional-02`, `03` y `04` el uso de tablas ficticias en `workedExample` (`silver.fct_orders`, `gold.channel_funnel_comparison`), longitud de frase elevada, frases genéricas (`"Flujo de clase mundial"`) y la bandera `needsReview: true`.
17. **[`docs/curriculo/mapa-curricular.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/docs/curriculo/mapa-curricular.md):** Ubica `c2-dimensional` como el módulo donde el estudiante transita desde el modelo relacional 3FN (`c1-modelo`) hacia el diseño de almacenes analíticos que alimentan `de3-transformacion`, `bi2-metricas` y `bi2-modelo-semantico`.
18. **[`src/data/lessons/c2-dimensional/c2-dimensional-02-star-schema-obt.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/lessons/c2-dimensional/c2-dimensional-02-star-schema-obt.js):** Archivo migrado desde `l4-star-schema-obt`; presentaba `needsReview: true`, desalineación crítica entre `practice.prompt` y `practice.solution`, `starterCode` con error de compilación en DuckDB (`Referenced table "s" not found!`), pasos de `pipelineChallenge` sin propiedad `.text` y media de 23.3 palabras/frase.
19. **[`src/data/lessons/c2-dimensional/c2-dimensional-03-scd2-history.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/lessons/c2-dimensional/c2-dimensional-03-scd2-history.js):** Archivo migrado desde `l5-scd2-history`; presentaba `needsReview: true`, consultas en `workedExample` sobre tablas inexistentes (`silver.fct_orders`, `silver.dim_customer_scd2`), pasos de `pipelineChallenge` sin `.text` y media de 22.8 palabras/frase.
20. **[`src/data/lessons/c2-dimensional/c2-dimensional-04-metrics-simpson.js`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/src/data/lessons/c2-dimensional/c2-dimensional-04-metrics-simpson.js):** Archivo migrado desde `l6-metrics-simpson`; presentaba `needsReview: true`, el título prohibido `"Flujo de clase mundial"`, tablas inexistentes en `workedExample` (`gold.channel_funnel_comparison`), pasos de `pipelineChallenge` sin `.text` y media de 26.3 palabras/frase.
21. **[`docs/reportes/T4-esquema-contenido.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/docs/reportes/T4-esquema-contenido.md):** Documenta cómo se generó el envoltorio inicial de las 18 lecciones existentes y cómo funcionan `check-content.mjs`, `check-copy.mjs` y `sync-lessons-index.mjs`.
22. **[`docs/reportes/T9-reproductor-leccion.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/docs/reportes/T9-reproductor-leccion.md):** Describe la arquitectura del reproductor `LessonPlayer.jsx`, `normalizeLessonV2.js` y el mecanismo `window.__GRANO_LESSON_OVERRIDE__` para previsualizar lecciones en caliente sin tocar `index.js`.
23. **[`docs/reportes/T10-laboratorio-sql-duckdb.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/docs/reportes/T10-laboratorio-sql-duckdb.md):** Explica la integración de DuckDB-Wasm en el navegador (`SqlLab.jsx`, `SqlEditor.jsx`) y el calificador determinista sobre Mercado Brisa.
24. **[`docs/reportes/T11-tutor-ia-agy.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/docs/reportes/T11-tutor-ia-agy.md):** Documenta el pipeline del Tutor IA con `agyRunner.js` y `contextBuilder.js`, así como el uso de `aiNotes` por lección.
25. **[`docs/reportes/W-c1-sql-basico.md`](file:///C:/Users/T490s/Desktop/Proyectos/ING-W-c2-dimensional/docs/reportes/W-c1-sql-basico.md):** Ejemplar canónico de reporte de escritor de Ola A que establece el nivel de detalle esperado en la verificación SQL, las transcripciones reales de `agy` y la rúbrica de calidad.

### 3. Resolución de ambigüedades detectadas al inicio
- **Límite de 60 caracteres en `lesson.title` (`src/data/schema/lesson.js:240`):** Los títulos descriptivos sugeridos en `src/data/catalog/modules.js` para la Lección 01 (`'Diseño de hechos y dimensiones conformadas: grano y matriz de bus de Kimball'`, 76 caracteres) y la Lección 05 (`'Tablas de hechos transaccionales, de instantánea periódica y acumulativas'`, 73 caracteres) superan el máximo estricto de `LessonSchema` (`max(60)`). Para cumplir `check-content.mjs` con `0` errores preservando la fidelidad semántica, definimos `title` en 58 caracteres (`'Hechos, dimensiones conformadas y matriz de bus de Kimball'` y `'Tablas de hechos: transaccional, instantánea y acumulativa'`) y conservamos el título íntegro del catálogo en `subtitle`. Se documenta en `## Peticiones al orquestador`.
- **Prerrequisito de la Lección 01 (`prerequisites`):** El módulo `c2-dimensional` declara `prerequisites: ['c1-modelo']`. Como `check-content.mjs` registra todos los IDs planificados de `modules.js` en `knownLessonIds`, referenciamos `'c1-modelo-05'` en `c2-dimensional-01-hechos-dimensiones-bus` y encadenamos secuencialmente `01 -> 02 -> 03 -> 04 -> 05`.

---

## Plan

1. **Paso 1 (Investigación y fuentes HTTP 200):** Verificar mediante peticiones HTTP reales 20 URLs primarias (Kimball Group Dimensional Modeling Techniques, DuckDB Stable SQL Docs, dbt Labs Docs, SQLMesh Docs y Stanford Encyclopedia of Philosophy) y documentarlas en `docs/curriculo/investigacion/c2-dimensional.md`.
2. **Paso 2 (Mapa de conceptos y glosario del módulo):** Diseñar la progresión conceptual desde 3FN (`c1-modelo`) hacia las 5 lecciones de `c2-dimensional` y sus conexiones aguas abajo (`de3-transformacion`, `bi2-metricas`, `bi2-modelo-semantico`), creando además 10 términos nuevos en `docs/curriculo/investigacion/c2-dimensional-glossary.json` validados contra `GlossaryListSchema`.
3. **Paso 3 (Autoría y limpieza profunda de las 5 lecciones):**
   - Escribir desde cero `c2-dimensional-01-hechos-dimensiones-bus.js` y `c2-dimensional-05-hechos-instantanea-acumulativos.js`.
   - Reescribir y sanear `c2-dimensional-02-star-schema-obt.js`, `c2-dimensional-03-scd2-history.js` y `c2-dimensional-04-metrics-simpson.js`, sustituyendo todas las consultas ficticias por SQL real ejecutable sobre Mercado Brisa y poniendo `needsReview: false`.
4. **Paso 4 (Verificación en DuckDB + validadores estáticos):** Ejecutar todas las consultas de `sections[].example`, `workedExample.steps`, `practice.starterCode` y `practice.solution` contra DuckDB (`@duckdb/node-api` + `compareQueryResults`), asegurando que `starterCode` falle (`passed: false`) y `solution` apruebe (`passed: true`), y pasar `check-content.mjs`, `check-copy.mjs` y `check-catalog.mjs` con `0` errores y `0` advertencias.
5. **Paso 5 (Prueba real del Tutor IA `agy` en 2 turnos y Playwright + DuckDB-Wasm):** Ejecutar `runAgyPrompt` con `buildContextPrompt` en una conversación de 2 turnos para las 5 lecciones y capturar con Playwright en el puerto `5212` las 13 vistas (cabeceras, fallos de `starterCode`, aprobaciones `is-pass` en DuckDB-Wasm, modo oscuro y viewport móvil `390x844`).
6. **Paso 6 (Proyecto integrador `c2-dimensional-project` y cierre):** Documentar el proyecto integrador con 3 entregables SQL ejecutados en DuckDB y rúbrica 0–4 en `docs/curriculo/investigacion/c2-dimensional.md`, revertir `src/data/lessons/index.js`, hacer commit únicamente de los 8 archivos propios y enviar el reporte al orquestador.

---

## Implementación

### Resumen de los Pasos 1 a 6 del Apéndice C
- **Paso 1 y Paso 2 (`docs/curriculo/investigacion/c2-dimensional.md` y `docs/curriculo/investigacion/c2-dimensional-glossary.json`):** Se verificaron 20 fuentes oficiales con `HTTP 200`, se trazó el diagrama Mermaid de arquitectura dimensional sobre Mercado Brisa y se definieron 10 nuevos términos de glosario (`grano-dimensional`, `dimension-conformada`, `matriz-bus-kimball`, `dimension-degenerada`, `drill-across`, `esquema-copo-de-nieve`, `scd-tipo-1-y-3`, `descomposicion-kitagawa`, `hecho-instantanea-periodica`, `hecho-instantanea-acumulativa`).
- **Paso 3 y Paso 4 (`src/data/lessons/c2-dimensional/c2-dimensional-01..05.js`):**
  - `c2-dimensional-01-hechos-dimensiones-bus.js` (`1,120` palabras visibles): Cubre los 4 pasos de Kimball, la distinción entre hechos y dimensiones, claves sustitutas vs. dimensiones degeneradas y el patrón *Drill-Across* con CTEs sobre `orders`, `order_items`, `payments`, `refunds` y `stores`.
  - `c2-dimensional-02-star-schema-obt.js` (`947` palabras visibles): Contrasta esquema en estrella, copo de nieve (*Snowflake*) y OBT en Parquet/DuckDB (diccionario + RLE), filtra `SKU-TEST-NEG` y corrige la desalineación entre `practice.prompt`, `starterCode` y `solution`.
  - `c2-dimensional-03-scd2-history.js` (`906` palabras visibles): Contrasta SCD Tipo 1 (*As-Is*), Tipo 2 (*As-Was*), Tipo 3 y Tipo 6 con intervalos semiabiertos `[valid_from, valid_to)` sobre `customer_changes` y `orders`.
  - `c2-dimensional-04-metrics-simpson.js` (`908` palabras visibles): Desarrolla la aditividad de métricas, cocientes ponderados `SUM(num)/NULLIF(SUM(den),0)` en `marketing_spend`, no aditividad de `COUNT(DISTINCT)` con HLL y la descomposición exacta de Kitagawa-Oaxaca sobre `orders` y `customers`.
  - `c2-dimensional-05-hechos-instantanea-acumulativos.js` (`1,087` palabras visibles): Contrasta tablas de hechos transaccionales, de instantánea periódica (`ARG_MAX` y `AVG` sobre saldos semiaditivos) y de instantánea acumulativa (`fct_order_lifecycle` con hitos de orden, pago y reembolso).
- **Paso 5 y Paso 6:** Se verificaron las 5 lecciones en 2 turnos con el binario real `agy`, se validó la renderización y calificación en DuckDB-Wasm en el navegador (`http://127.0.0.1:5212/?view=lesson`) y se especificó el proyecto integrador `c2-dimensional-project` con 3 entregables SQL verificados en DuckDB.

### Salida literal de `check-content.mjs` y `check-copy.mjs`

```text
=== Validación de contenido v2 (check-content) ===
Lección (id v2)                                | Módulo               | Niv  | Sec  | Chk  | Src  | Palabras  | Estado    
--------------------------------------------------------------------------------------------------------------------------
c2-dimensional-01-hechos-dimensiones-bus       | c2-dimensional       | 2    | 3    | 3    | 4    | 1120      | OK        
c2-dimensional-02-star-schema-obt              | c2-dimensional       | 2    | 2    | 3    | 4    | 947       | OK        
c2-dimensional-03-scd2-history                 | c2-dimensional       | 2    | 2    | 3    | 4    | 906       | OK        
c2-dimensional-04-metrics-simpson              | c2-dimensional       | 2    | 2    | 3    | 4    | 908       | OK        
c2-dimensional-05-hechos-instantanea-acumulativos | c2-dimensional       | 2    | 3    | 3    | 4    | 1087      | OK        
--------------------------------------------------------------------------------------------------------------------------
Resumen: 5 lecciones inspeccionadas | 5 válidas | 0 con advertencias (needsReview) | 0 con errores.

Resultado: OK (0 errores de esquema o integridad).

=== Auditoría anti-slop de copy (check-copy) ===
Archivos escaneados: 5

0 hallazgos de términos prohibidos, emojis, "2026" o exceso de negritas.
Total de hallazgos: 0
```

### Autoevaluación con la rúbrica de 8 criterios (Apéndice C — mínimo requerido: 27/32)

| # | Criterio | L01 | L02 | L03 | L04 | L05 | Justificación técnica |
|---|---|---|---|---|---|---|---|
| 1 | **Fidelidad técnica y fuentes primarias** | 4/4 | 4/4 | 4/4 | 4/4 | 4/4 | Todas las definiciones siguen las especificaciones canónicas de Kimball Group, DuckDB Foundation, dbt Labs, SQLMesh y Stanford Encyclopedia of Philosophy (20 URLs HTTP 200). |
| 2 | **Anclaje real en Mercado Brisa** | 4/4 | 4/4 | 4/4 | 4/4 | 4/4 | Cero tablas ficticias: todas las consultas ejecutan sobre `orders`, `order_items`, `products`, `stores`, `customers`, `customer_changes`, `payments`, `refunds` y `marketing_spend`. |
| 3 | **Calidad pedagógica del `hook` y `objectives`** | 4/4 | 4/4 | 4/4 | 4/4 | 4/4 | Cada `hook` plantea un incidente cuantificado con cifras exactas de Mercado Brisa (ej. `$435.50` vs `$370.50`, `$628,099.05` perdidos en `bronce`, `$14.37` vs `$13.59` en `referral`). |
| 4 | **Claridad editorial y cumplimiento anti-slop** | 4/4 | 4/4 | 4/4 | 4/4 | 4/4 | `0` hallazgos en `check-copy.mjs`; todas las lecciones mantienen longitud media de frase $\le 22$ palabras/frase, cero emojis y cero muletillas grandilocuentes. |
| 5 | **Rigor del `workedExample` (antipatrón vs. solución)** | 4/4 | 4/4 | 4/4 | 4/4 | 4/4 | Los 5 ejemplos guiados contrastan el antipatrón SQL con la solución correcta mostrando tablas de salida reales verificadas en DuckDB. |
| 6 | **Variedad y diagnóstico en `checks`** | 4/4 | 4/4 | 4/4 | 4/4 | 4/4 | Cada lección incluye 3 comprobaciones (`mcq` + `code-Output`) con retroalimentación específica por opción que explica el porqué algebraico de cada distractor. |
| 7 | **Calibración del laboratorio SQL (`practice`)** | 4/4 | 4/4 | 4/4 | 4/4 | 4/4 | En las 5 lecciones `starterCode` ejecuta sin error de sintaxis pero falla la calificación (`passed: false`) por el defecto conceptual de la lección, y `solution` aprueba (`passed: true`). |
| 8 | **Integración con el Tutor IA (`aiNotes`) y roles (`roleNotes`)** | 4/4 | 4/4 | 4/4 | 4/4 | 4/4 | `aiNotes` incluye las cifras exactas y trampas del dataset, comprobadas en conversaciones reales de 2 turnos con `agy`; `roleNotes` diferencia responsabilidades reales de DE, DA y BI. |
| **Total** | **Puntuación por lección (sobre 32)** | **32/32** | **32/32** | **32/32** | **32/32** | **32/32** | **Media del módulo: 32 / 32 ($\ge 27/32$ requeridos).** |

---

## Auto-revisión

Durante la auditoría cruzada de código, validadores, DuckDB y Playwright se detectaron y corrigieron **6 errores concretos**:

1. **Bug crítico en `c2-dimensional-02-star-schema-obt.js` (`practice.prompt` vs. `practice.solution` y error de compilación en `starterCode`):**
   - *Hallazgo:* En el archivo migrado de T4, `practice.prompt` pedía las columnas `region, category, orders_count, units_sold, net_revenue_usd`, pero `practice.solution` contenía la consulta de `pipelineChallenge` (`region, category, total_units, revenue_usd, gross_margin_usd`), y `practice.starterCode` referenciaba `s.region` sin incluir `JOIN stores s`, lanzando un `Binder Error: Referenced table "s" not found!` en DuckDB.
   - *Corrección:* Se reescribieron `practice.starterCode`, `practice.solution` y `practice.expectedOutputTable` (20 filas exactas verificadas en DuckDB) para que `starterCode` ejecute devolviendo el valor inflado sin filtrar `SKU-TEST-NEG` (`rows_mismatch`) y `solution` devuelva exactamente `region, category, orders_count, units_sold, net_revenue_usd` (`matched`).
2. **Consultas sobre tablas inexistentes en `workedExample` de `c2-dimensional-03-scd2-history.js` y `c2-dimensional-04-metrics-simpson.js`:**
   - *Hallazgo:* Los ejemplos guiados heredados de `l5` y `l6` consultaban tablas ficticias (`silver.fct_orders`, `silver.dim_customer_scd2` y `gold.channel_funnel_comparison`) que no existen en `mercadoBrisaSchema.js`.
   - *Corrección:* Se reemplazaron por consultas 100% reales y ejecutables en DuckDB sobre `orders`, `customers`, `customer_changes` y `marketing_spend`, incluyendo la descomposición de Kitagawa-Oaxaca sobre `orders` y `customers` (`+$54.81` efecto tasa + `+$7.38` efecto mezcla = `+$62.19`).
3. **Renderizado de `[object Object]` en `PipelineOrderChallenge` para las lecciones 02, 03 y 04:**
   - *Hallazgo:* En la primera pasada de Playwright (`task-284`), la auditoría automática del DOM detectó `hasObjectObject: true` en `c2-dimensional-02`, `03` y `04`. Al inspeccionar `src/components/PipelineOrderChallenge.jsx` (línea 14), descubrimos que `normalizeSteps` evalúa `item.text || item.label || String(item)`, mientras que los objetos heredados en `pipelineChallenge.steps` solo tenían `{ title, goal, hint }`, renderizando `[object Object]` en pantalla.
   - *Corrección:* Se añadieron las propiedades `id` y `text` a cada paso de `pipelineChallenge.steps` en `c2-dimensional-02`, `03` y `04`. En la segunda ejecución de Playwright (`task-329`), `hasObjectObject` pasó a `false` en las 5 lecciones.
4. **Incumplimiento de longitud media de frase ($> 22$ palabras/frase) y términos prohibidos en el primer borrador:**
   - *Hallazgo:* La primera ejecución de `check-copy.mjs` detectó 3 ocurrencias de palabras prohibidas (`"domina"`, `"fundamentales"`) y medias de longitud de frase de `22.4` a `26.3` palabras/frase en las 5 lecciones.
   - *Corrección:* Se eliminaron las palabras prohibidas y se dividieron las oraciones subordinadas largas en frases directas y concisas, logrando `0` hallazgos y que ninguna de las 5 lecciones de `c2-dimensional` supere el umbral de `22` palabras/frase.
5. **Ajuste de conteo de palabras en `roleNotes.bi` (L03) y `hook` (L05):**
   - *Hallazgo:* `check-content.mjs` reportó que `roleNotes.bi` en `c2-dimensional-03` tenía 24 palabras (mínimo 25) y que `hook` en `c2-dimensional-05` tenía 91 palabras (máximo 90).
   - *Corrección:* Se amplió `roleNotes.bi` en L03 y se condensó `hook` en L05 a 80 palabras manteniendo las cifras exactas y el signo de interrogación final (`?`).
6. **Resolución de contexto de lecciones con `legacyId` en `server/ai/contextBuilder.js` durante la prueba de `agy`:**
   - *Hallazgo:* Al invocar `buildContextPrompt({ lessonId: 'c2-dimensional-02-star-schema-obt' })`, `contextBuilder.js` indexaba `mod.LESSONS` por `lesson.id` (que `adaptLessonForLegacyPlayer` sobrescribe con `legacyId = 'l4-star-schema-obt'`), haciendo que la búsqueda por `v2Id` cayera en el fallback `data.allLessons[0]`.
   - *Corrección:* Se pasó explícitamente `customLesson` en el arnés de prueba para las lecciones 02, 03 y 04 y se documentó la mejora recomendada para `server/ai/contextBuilder.js` en `## Peticiones al orquestador`.

---

## Test

### 1. Validadores estáticos y compilación de producción (`npm run build`)
- `node scripts/check-content.mjs --module c2-dimensional` $\rightarrow$ **`5 lecciones inspeccionadas | 5 válidas | 0 con advertencias (needsReview) | 0 con errores. Resultado: OK`**
- `node scripts/check-copy.mjs --path src/data/lessons/c2-dimensional --path docs/curriculo/investigacion/c2-dimensional.md` $\rightarrow$ **`0 hallazgos de términos prohibidos, emojis, "2026" o exceso de negritas. Total de hallazgos: 0`** (0 lecciones de `c2-dimensional` por encima de 22 palabras/frase).
- `node scripts/check-catalog.mjs` $\rightarrow$ **`Total: 32 módulos, 154 lecciones (18 existentes, 136 planificadas), 3500 min (58.3 h estimadas). OK`**
- `npm run build` $\rightarrow$ **`✓ built in 50.78s` (0 errores).**

### 2. Verificación determinista en DuckDB (`compareQueryResults`)

```text
c2-dimensional-01-hechos-dimensiones-bus -> starter passed: false (rows_mismatch) | solution passed: true (matched)
c2-dimensional-02-star-schema-obt -> starter passed: false (rows_mismatch) | solution passed: true (matched)
c2-dimensional-03-scd2-history -> starter passed: false (rows_mismatch) | solution passed: true (matched)
c2-dimensional-04-metrics-simpson -> starter passed: false (rows_mismatch) | solution passed: true (matched)
c2-dimensional-05-hechos-instantanea-acumulativos -> starter passed: false (rows_mismatch) | solution passed: true (matched)
```

### 3. Casos de prueba adversarios verificados ($\ge 5$ casos)

| # | Lección / Componente | Caso adversario | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|
| 1 | `c2-dimensional-01` (`practice`) | Unir `orders`, `stores` y `refunds` en un solo `SELECT` con `INNER JOIN` (`starterCode`). | Falla por descartar tiendas sin reembolsos (`warehouse`) y distorsionar órdenes con múltiples devoluciones (`8` filas en vez de `11`). | `passed: false` (`rows_mismatch`: 8 filas obtenidas frente a 11 esperadas). |
| 2 | `c2-dimensional-02` (`practice`) | Sumar `o.total_usd` tras unir `order_items` con `orders` y omitir el filtro `p.list_price_usd > 0` (`SKU-TEST-NEG`). | Falla porque `o.total_usd` se multiplica por cada línea del pedido y el SKU negativo distorsiona `Accesorios`. | `passed: false` (`rows_mismatch`: importes inflados por *fan-out* de línea). |
| 3 | `c2-dimensional-03` (`practice`) | Unir `orders` con `customer_changes` únicamente por `o.customer_id = cc.customer_id` sin predicado `[valid_from, valid_to)`. | Falla porque las `14,760` órdenes completadas se multiplican a `25,271` filas al cruzar con todas las versiones históricas del cliente. | `passed: false` (`rows_mismatch`: conteo de órdenes e ingresos inflados). |
| 4 | `c2-dimensional-04` (`practice`) | Calcular `ctr_pct`, `cvr_pct` y `cpa_usd` en `marketing_spend` usando `AVG(num / den)` fila a fila. | Falla porque el promedio no ponderado eleva el CPA de `referral` a `$14.37` en lugar del valor real ponderado `$13.59`. | `passed: false` (`rows_mismatch`: discrepancia en `cpa_usd` y `ctr_pct`). |
| 5 | `c2-dimensional-05` (`practice`) | Unir `orders` directamente con `payments` y `refunds` sin preagregar en CTEs por `order_id`. | Falla porque los `20,200` pagos y `1,450` reembolsos multiplican las órdenes en todas las regiones (`6,510` en Cono Sur en vez de `6,001`). | `passed: false` (`rows_mismatch`: `total_orders` y `captured_orders` inflados). |
| 6 | `PipelineOrderChallenge` (L02–L04) | Inspección DOM de `document.body.innerText` buscando `\bNaN\b`, `\bundefined\b` o `[object Object]`. | `false` en las 3 expresiones tras normalizar `pipelineChallenge.steps` con `id` y `text`. | `hasNaN: false`, `hasUndefined: false`, `hasObjectObject: false` en las 5 lecciones. |

### 4. Transcripciones literales de la prueba de 2 turnos del Tutor IA (`agy`) en las 5 lecciones

#### Lección 01: `c2-dimensional-01-hechos-dimensiones-bus`
- **Turno 1 — Usuario:** `Hazme una pregunta de comprobación sobre la lección.`
- **Turno 1 — Tutor IA (`agy`, `20424 ms`, prompt `3735 chars`):**
  > En Mercado Brisa, necesitas calcular el costo total de envío (`shipping_fee_usd`) y el monto total de productos vendidos (`item_price_usd * quantity`).
  > Para hacerlo, unes la tabla `orders` con `order_items` usando `order_id` y aplicas un `SUM()` a ambas métricas.
  > ¿Qué problema ocurre con el cálculo de `shipping_fee_usd` al hacer este `JOIN`, por qué sucede en términos de la declaración del grano, y cuál de las dos métricas sí arroja un resultado correcto?
- **Turno 2 — Usuario:** `Yo creo que para comparar las ventas brutas de orders y los reembolsos de refunds por región, lo más directo es hacer un solo SELECT con INNER JOIN entre orders, stores y refunds y sumar o.total_usd y r.refund_amount_usd al mismo tiempo.`
- **Turno 2 — Tutor IA (`agy`, `23100 ms`, prompt `4423 chars`):**
  > Ese enfoque genera dos problemas graves por mezclar granos distintos en una misma consulta (el error conocido como abismo de multiplicación o *Chasm Trap*).
  > Primero, al hacer `INNER JOIN` con `refunds`, descartas todas las órdenes que no tuvieron devoluciones y las tiendas o regiones sin reembolsos. El total de ventas quedará incompleto.
  > Segundo, duplicas las ventas en órdenes con reembolsos parciales. En Mercado Brisa hay 1,440 órdenes reembolsadas pero 1,450 registros en `refunds`. Esas órdenes con más de un reembolso multiplican la fila de `orders`, inflando `order_total_usd`.
  > La solución correcta según Kimball es un *Drill-Across*:
  > 1. Creas una CTE para preagregar las ventas de `orders` al grano de región o tienda.
  > 2. Creas otra CTE para preagregar los montos de `refunds` al mismo grano.
  > 3. Unes ambas CTEs usando `FULL OUTER JOIN` sobre la dimensión conformada de tiendas o regiones.
  > ¿Qué pasaría con las métricas de una tienda nueva que vendió productos pero aún no registra ningún reembolso si usaras un `INNER JOIN` entre las dos CTEs en lugar de un `FULL OUTER JOIN`?

#### Lección 02: `c2-dimensional-02-star-schema-obt`
- **Turno 1 — Usuario:** `Hazme una pregunta de comprobación sobre la lección.`
- **Turno 1 — Tutor IA (`agy`, `11225 ms`, prompt `3607 chars`):**
  > Imagina que en Mercado Brisa decides normalizar la tabla de dimensión `products` extrayendo las categorías a una tabla independiente `categories`, y las marcas a otra tabla `brands`.
  > ¿Qué nombre recibe esta nueva topología frente al esquema en estrella tradicional y cuál es la principal desventaja que introduce al momento de consultar las ventas en `order_items`?
- **Turno 2 — Usuario:** `Si armamos una tabla ancha OBT uniendo orders con order_items a nivel de ítem, para obtener el ingreso total y el costo de envío regional basta con ejecutar SUM(o.total_usd) y SUM(o.shipping_usd) directamente sobre la OBT.`
- **Turno 2 — Tutor IA (`agy`, `12752 ms`, prompt `4186 chars`):**
  > No, esa afirmación es incorrecta y es una de las trampas clásicas al trabajar con granos mixtos.
  > Al construir la OBT uniendo `orders` con `order_items`, el grano final de la tabla queda a nivel de ítem (42,000 filas), mientras que `orders` está a nivel de orden (18,000 filas). Cuando una orden contiene tres productos distintos, esa orden se repite en tres filas de la OBT.
  > Si ejecutas `SUM(o.order_total_usd)` o `SUM(o.shipping_fee_usd)`, sumarás los valores de cabecera tantas veces como ítems tenga cada orden, inflando artificialmente las métricas.
  > Para resolverlo correctamente sobre ese grano:
  > - Para el ingreso total, debes sumar el importe a nivel de ítem: `SUM(oi.quantity * oi.item_price_usd)`.
  > - Si necesitas métricas exclusivas de cabecera como `shipping_fee_usd` sin duplicar, debes calcularlas antes de la unión agrupando a nivel de orden, o bien consultar directamente la tabla `orders`.
  > Además, recuerda siempre filtrar registros de prueba como `SKU-TEST-NEG` (`p.unit_price_usd > 0`) para evitar distorsiones en los importes.

#### Lección 03: `c2-dimensional-03-scd2-history`
- **Turno 1 — Usuario:** `Hazme una pregunta de comprobación sobre la lección.`
- **Turno 1 — Tutor IA (`agy`, `5528 ms`, prompt `3621 chars`):**
  > Imagina que estás analizando las ventas de Mercado Brisa y necesitas calcular el total de ingresos según el nivel (`tier`) que tenía cada cliente al momento exacto de su compra.
  > Tienes la tabla `orders` y la tabla `customer_changes` (SCD Tipo 2).
  > 1. ¿Qué sucedería con el número de filas del resultado si unes ambas tablas usando únicamente `ON orders.customer_id = customer_changes.customer_id`?
  > 2. ¿Qué condición adicional debes incluir en el `JOIN` para evitar ese problema y asegurar una consulta *Point-in-Time* correcta?
- **Turno 2 — Usuario:** `Para saber cuánto vendimos históricamente en cada tier usando customer_changes, basta con hacer JOIN por customer_id y filtrar WHERE is_current = true, o bien usar o.order_ts BETWEEN cc.valid_from AND cc.valid_to.`
- **Turno 2 — Tutor IA (`agy`, `6638 ms`, prompt `4352 chars`):**
  > Ambas opciones tienen errores conceptuales importantes para un análisis histórico (*Point-in-Time*):
  > 1. **Filtrar por `is_current = true`**: Esto convierte tu análisis en **SCD Tipo 1 (As-Is)**. Le asigna a cada orden el nivel actual del cliente, ignorando el pasado. En Mercado Brisa, si un cliente compró como `bronce` y hoy es `oro`, esa venta se le atribuiría erróneamente a `oro`. Por ejemplo, la facturación real histórica de `bronce` es de `$1,528,183.35`, pero con `is_current = true` caería a `$900,084.30`.
  > 2. **Usar `BETWEEN cc.valid_from AND cc.valid_to`**:
  >    - **Pierdes las compras actuales**: El registro vigente tiene `valid_to IS NULL`. La condición `BETWEEN` falla contra valores nulos, por lo que descartarías todas las órdenes recientes.
  >    - **Duplicas en los límites**: `BETWEEN` incluye ambos extremos (`>=` y `<=`). Si una versión termina exactamente en el segundo que inicia la siguiente, la orden coincidirá con ambas filas, inflando el conteo de órdenes.
  > El modelo usa intervalos semiabiertos `[valid_from, valid_to)`. La condición correcta para conservar exactamente las 14,760 órdenes completadas sin inflar filas (evitando el producto cartesiano de 25,271 registros) es:
  > ```sql
  > ON o.customer_id = cc.customer_id
  > AND o.order_ts >= cc.valid_from
  > AND (o.order_ts < cc.valid_to OR cc.valid_to IS NULL)
  > ```

#### Lección 04: `c2-dimensional-04-metrics-simpson`
- **Turno 1 — Usuario:** `Hazme una pregunta de comprobación sobre la lección.`
- **Turno 1 — Tutor IA (`agy`, `7199 ms`, prompt `3674 chars`):**
  > Aquí tienes tu pregunta de comprobación con datos de Mercado Brisa:
  > Imagina que quieres calcular el ticket promedio de compra (AOV) por tienda durante el último trimestre a partir de la tabla `orders`.
  > Un analista del equipo propone hacer `SELECT store_id, AVG(order_total_usd) AS aov_tienda FROM orders GROUP BY store_id;` y luego `SELECT AVG(aov_tienda) FROM reporte_tiendas;`.
  > 1. ¿A qué categoría algebraica pertenece el ticket promedio (aditivo, semiaditivo o no aditivo)?
  > 2. ¿Por qué es un error calcular el total general con `AVG(aov_tienda)` y cómo deberías escribir la agregación correcta en SQL?
- **Turno 2 — Usuario:** `Para calcular el CPA mensual de cada canal en marketing_spend uso AVG(spend_usd / attributed_conversions), y para saber el total de clientes únicos del trimestre sumo el COUNT(DISTINCT customer_id) de cada dispositivo.`
- **Turno 2 — Tutor IA (`agy`, `8016 ms`, prompt `4667 chars`):**
  > Ambos planteamientos son errores comunes con hechos no aditivos:
  > 1. **El promedio de un ratio (`AVG(...)`):** Al hacer `AVG(spend_usd / attributed_conversions)`, tratas igual a un día con 2 conversiones que a uno con 500. El CPA no es aditivo. Por ejemplo, en el canal `referral`, este cálculo infla el CPA a **$14.37**, cuando el costo real ponderado es **$13.59**. La forma correcta en SQL es `SUM(spend_usd) / NULLIF(SUM(attributed_conversions), 0) AS cpa_mensual`.
  > 2. **Sumar conteos distintos (`COUNT(DISTINCT ...)`):** Los clientes únicos no son aditivos a través de dimensiones como el dispositivo. Si sumas los clientes de desktop (1,284), mobile (1,312) y pos_tienda (656), obtienes **3,252**, inflando el resultado frente a los **2,292** clientes únicos reales del trimestre. La forma correcta es calcular `COUNT(DISTINCT customer_id)` directamente sobre todo el conjunto.

#### Lección 05: `c2-dimensional-05-hechos-instantanea-acumulativos`
- **Turno 1 — Usuario:** `Hazme una pregunta de comprobación sobre la lección.`
- **Turno 1 — Tutor IA (`agy`, `21524 ms`, prompt `3413 chars`):**
  > Imagina que en Mercado Brisa una tienda no vende ningún producto durante todo un día.
  > ¿Qué filas esperarías encontrar en la tabla de hechos transaccional `order_items` para esa tienda en esa fecha?
  > Además, si quisieras calcular los ingresos totales de una semana sumando `item_price_usd * quantity`, ¿por qué esta medida se considera totalmente aditiva a través de las tiendas y el calendario?
- **Turno 2 — Usuario:** `En una tabla de instantánea periódica mensual de saldos acumulados puedo usar SUM(ytd_balance_usd) para obtener el cierre del trimestre, y en la instantánea acumulativa de órdenes puedo unir orders con payments y refunds directamente sin preagregar.`
- **Turno 2 — Tutor IA (`agy`, `24469 ms`, prompt `4049 chars`):**
  > Ambas afirmaciones contienen errores conceptuales importantes.
  > En primer lugar, un saldo acumulado (`ytd_balance_usd`) en una instantánea periódica es una medida **semiaditiva**. Si aplicas `SUM()` a través de los meses, sumas saldos que ya incluyen los periodos anteriores, inflando el resultado. Para el cierre del trimestre debes tomar el último valor registrado mediante una agregación de cierre (como `ARG_MAX(ytd_balance_usd, snapshot_date)`), o usar `AVG()` si buscas un balance promedio.
  > En segundo lugar, unir `orders` directamente con `payments` y `refunds` genera una relación de uno a muchos (o muchos a muchos). Para construir la instantánea acumulativa sin distorsionar los datos, debes comprimir `payments` y `refunds` al grano de una fila por `order_id` en CTEs separadas (por ejemplo, con `MIN(...)` o `SUM(...)`) antes de unirlas con `orders`.

---

## Capturas

Todas las capturas fueron tomadas con Playwright sobre el servidor Vite en `http://127.0.0.1:5212/?view=lesson` y guardadas fuera de git en `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-c2-dimensional\`. Todas fueron inspeccionadas visualmente con `read_file`:

| Archivo PNG | Viewport / Tema | Verificación visual (`read_file`) |
|---|---|---|
| `01-c2-dimensional-01-hechos-dimensiones-bus-header.png` | `1440x900` · Claro | Cabecera editorial limpia, migas de pan (`Ruta > Modelado dimensional`), `hook` y `objectives` íntegros sin truncamiento. |
| `01-c2-dimensional-01-hechos-dimensiones-bus-starter-fail.png` | `1440x900` · Claro | `starterCode` calificado en DuckDB-Wasm muestra tarjeta ámbar `is-fail` (`Filas esperadas: 11 · Filas obtenidas: 8`) y tablas comparativas de diferencias. |
| `01-c2-dimensional-01-hechos-dimensiones-bus-practica-pass.png` | `1440x900` · Claro | `solution` calificada en DuckDB-Wasm muestra tarjeta verde `is-pass` (`11 fila(s) y 7 columna(s) coinciden con la referencia`) y tabla de resultados (`38 ms`). |
| `02-c2-dimensional-02-star-schema-obt-header.png` | `1440x900` · Claro | Título, metadatos (`25 min · Nivel 2`), escenario real y 3 objetivos con tipografía y espaciado correctos. |
| `02-c2-dimensional-02-star-schema-obt-practica-pass.png` | `1440x900` · Claro | `solution` calificada con tarjeta verde `is-pass` (`20 fila(s) y 5 columna(s) coinciden con la referencia`, `58.2 ms`). |
| `03-c2-dimensional-03-scd2-history-header.png` | `1440x900` · Claro | Cabecera, escenario real con cifras `$628,099.05` y `25,271` filas y objetivos bien alineados. |
| `03-c2-dimensional-03-scd2-history-practica-pass.png` | `1440x900` · Claro | `solution` Point-in-Time calificada con tarjeta verde `is-pass` (`4 fila(s) y 3 columna(s) coinciden con la referencia`, `oro`, `plata`, `bronce`, `platino`). |
| `04-c2-dimensional-04-metrics-simpson-header.png` | `1440x900` · Claro | Cabecera de aditividad y paradoja de Simpson sin solapamientos ni desbordes. |
| `04-c2-dimensional-04-metrics-simpson-practica-pass.png` | `1440x900` · Claro | `solution` sobre `marketing_spend` calificada con tarjeta verde `is-pass` (`5 fila(s) y 5 columna(s) coinciden con la referencia`, `referral` con CPA `13.59`). |
| `05-c2-dimensional-05-hechos-instantanea-acumulativos-header.png` | `1440x900` · Claro | Cabecera de tablas de hechos transaccional, instantánea y acumulativa con temario de 9 secciones. |
| `05-c2-dimensional-05-hechos-instantanea-acumulativos-practica-pass.png` | `1440x900` · Claro | `solution` de `fct_order_lifecycle` calificada con tarjeta verde `is-pass` (`4 fila(s) y 6 columna(s) coinciden con la referencia`). |
| `06-c2-dimensional-03-scd2-history-dark.png` | `1440x900` · Oscuro | Contraste óptimo en tema oscuro (`data-theme="dark"`), píldoras de código inline legibles y bordes sutiles. |
| `07-c2-dimensional-01-hechos-dimensiones-bus-mobile-390x844.png` | `390x844` · Móvil | `scrollWidth === clientWidth === 390` (cero scroll horizontal), barra superior compacta y bloques adaptados al ancho móvil. |

---

## Peticiones al orquestador

1. **Integración de 10 términos nuevos en `src/data/glossary.js`:** Incorporar los 10 términos validados de `docs/curriculo/investigacion/c2-dimensional-glossary.json` (`grano-dimensional`, `dimension-conformada`, `matriz-bus-kimball`, `dimension-degenerada`, `drill-across`, `esquema-copo-de-nieve`, `scd-tipo-1-y-3`, `descomposicion-kitagawa`, `hecho-instantanea-periodica`, `hecho-instantanea-acumulativa`).
2. **Integración del proyecto de módulo `c2-dimensional-project`:** Incorporar la especificación completa y los 3 entregables SQL documentados en la sección **Paso 6** de `docs/curriculo/investigacion/c2-dimensional.md` al registro de proyectos cuando se consolide la vista de proyectos.
3. **Sincronización del índice de lecciones tras el merge:** Ejecutar `node scripts/sync-lessons-index.mjs` tras fusionar la rama `agente/W-c2-dimensional` para registrar `c2-dimensional-01-hechos-dimensiones-bus` y `c2-dimensional-05-hechos-instantanea-acumulativos` en `src/data/lessons/index.js`.
4. **Alineación opcional de títulos de catálogo (`<= 60` caracteres) en `src/data/catalog/modules.js`:** Actualizar en `modules.js` los títulos de `c2-dimensional-01` (`'Hechos, dimensiones conformadas y matriz de bus de Kimball'`, 58 chars) y `c2-dimensional-05` (`'Tablas de hechos: transaccional, instantánea y acumulativa'`, 58 chars) para que coincidan con el límite `title.max(60)` de `LessonSchema`.
5. **Mejora recomendada en `server/ai/contextBuilder.js` (línea 105):** En `loadCurriculumData()`, además de `if (lesson?.id) lessonsById.set(lesson.id, lesson)`, añadir `if (lesson?.v2Id) lessonsById.set(lesson.v2Id, lesson)` para que las lecciones con `legacyId` (`l4`, `l5`, `l6`) puedan resolverse también cuando el cliente envíe su `v2Id` (`c2-dimensional-02-star-schema-obt`, etc.).

---

## Reporte final

Se completó la creación, limpieza profunda, verificación SQL en DuckDB, validación editorial (`check-content`, `check-copy`, `check-catalog`), prueba conversacional de 2 turnos con el binario real `agy` y auditoría visual en navegador con Playwright + DuckDB-Wasm para las 5 lecciones del módulo **`c2-dimensional` (*"Modelado dimensional"*)**, alcanzando `0` errores, `0` advertencias y una puntuación de `32/32` en la rúbrica de calidad del Apéndice C.
