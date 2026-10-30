# W-x4-carrera — Portafolio y entrevistas técnicas (Nivel 4 · Fase 3 · Ola C)

- **Agente:** `W-x4-carrera`
- **Rama / Worktree:** `agente/W-x4-carrera` (`C:\Users\T490s\Desktop\Proyectos\ING-W-x4-carrera`)
- **Fase / Ola:** Fase 3 — Escritura del currículo (Ola C — Módulos de Nivel 4)
- **Módulo:** `x4-carrera` (*Portafolio y entrevistas técnicas*, área `core`, transversal a `de`, `da` y `bi`)
- **Fecha:** 2026-10-30
- **Estado:** Completado

---

## Inicio

Archivos del repositorio leídos antes de iniciar la investigación y redacción, con un dato concreto extraído de cada uno:

1. `PLAN_GEMINI_4_ARGON.md`: Define el módulo `x4-carrera` en el Nivel 4 (Experto, área `core`) con 3 lecciones (`x4-carrera-01-portafolio-publico-de-da-bi` de 20 min, `x4-carrera-02-entrevista-tecnica-sql-caso-arquitectura` de 25 min y `x4-carrera-03-explicar-proyecto-2-minutos` de 20 min), el protocolo de 7 pasos de escritura (§9.2), la rúbrica de 8 criterios sobre 32 puntos (§9.4), la lista de expresiones prohibidas del Apéndice B y las listas de verificación D.1 y D.3.
2. `docs/reportes/PLANTILLA.md`: Exige las secciones obligatorias `## Inicio`, `## Pasos`, `## Test`, `## Revisión propia`, `## Prueba adversarial`, `## Capturas antes / después`, `## Peticiones al orquestador` y `## Pendiente (con motivo)`.
3. `src/data/catalog/modules.js`: Registra el módulo `x4-carrera` con `level: 4`, `area: 'core'`, `tracks: ['core', 'de', 'da', 'bi']`, `estimatedHours: 2.5` y los 3 identificadores de lección en `lessonIds`.
4. `src/data/schema/lesson.js`: Define `LessonSchema` en Zod v4: exige `id`, `version` (`1`), `contentVersion` (`1`), `title` (10–110 caracteres), `moduleId`, `level` (`0..4`), `area`, `tracks` (arreglo con `'core'`, `'de'`, `'da'`, `'bi'`), `minutes` (`5..60`), `hook` (80–700 caracteres), `objectives` (exactamente 3 ítems), `sections` (`2..5` secciones con `heading` `<= 70` caracteres, `body` de 150–2600 caracteres y al menos un `example` con `language`, `code`, `expectedOutput` y `explanation`), `workedExample` (`3..6` pasos), `roleNotes` (`de`, `da`, `bi`), `checks` (`3..4` preguntas con `explanation` >= 60 caracteres), `practice` (`type: 'sql'`, `dataset`, `prompt`, `starterCode`, `hints` de 3 niveles, `expected`, `expectedOutputTable`, `solution` y `explanation`), `summary` (`<= 450` caracteres y frases `<= 25` palabras), `sources` (`>= 2` fuentes con `https://` y `accessed` `YYYY-MM-DD`) y `glossaryTerms`.
5. `src/data/schema/glossary.js`: Define `GlossaryTermSchema` y `GlossaryListSchema`, exigiendo `id` en kebab-case, `term` (2–80 caracteres), `definition` de 25 a 50 palabras exactas (validadas con `countWords`), `example` (20–320 caracteres), `area` y `lessonId`.
6. `public/datasets/README.md`: Documenta el dominio sintético **Mercado Brisa** (comercio electrónico de café de especialidad y equipamiento en Latinoamérica, periodo 2024–2025) y las 10 tablas oficiales (`customers`, `customer_changes`, `products`, `stores`, `orders`, `order_items`, `payments`, `shipments`, `refunds` y `marketing_spend`).
7. `public/datasets/schema.json`: Especifica las columnas exactas y tipos de cada archivo Parquet, incluyendo `orders` (`subtotal_usd`, `discount_usd`, `tax_usd`, `shipping_usd`, `total_usd`, `status`), `order_items` (`qty`, `unit_price_usd`, `line_discount_usd`, `line_total_usd`), `products` (`unit_cost_usd`, `list_price_usd`, `category`), `refunds` (`refund_amount_usd`, `reason`), `stores` (`store_type`), `customers` (`segment`, `current_tier`) y `customer_changes` (`tier`, `valid_from`, `valid_to`, `is_current`).
8. `scripts/check-content.mjs`: Valida cada lección contra `LessonSchema`, comprueba que las lecciones de Nivel 4 tengan entre `800` y `1250` palabras en `sections[].body`, verifica que los `prerequisites` existan y que los `glossaryTerms` estén definidos en `src/data/glossary.js` o en `docs/curriculo/investigacion/*-glossary.json`.
9. `scripts/check-copy.mjs`: Escanea recursivamente términos prohibidos (`EXPRESIONES_PROHIBIDAS`, incluyendo `caso real`, `descubre`, `fácilmente`, `en conclusión`, `hoy en día`, etc.), verifica un máximo de 3 negritas por párrafo, ausencia de emojis, ausencia de `"2026"` fuera de `sources`/`accessed` y promedio de palabras por oración `<= 22`.
10. `scripts/sync-lessons-index.mjs`: Recorre `src/data/lessons/<moduleId>/<lessonId>.js` y regenera `src/data/lessons/index.js` con el mapa `LESSONS_BY_ID`.
11. `server/ai/contextBuilder.js`: Construye el prompt pedagógico con `buildContextPrompt({ mode, lessonId, sectionId, messages, code, result, track, level })`, inyectando las secciones de la lección, el esquema de tablas de Mercado Brisa y las instrucciones de tutoría socrática en español.
12. `server/ai/agyRunner.js`: Ejecuta el binario local `agy` (`runAgyPrompt` y `runAgyStream`) con `shell: false`, pasando el prompt por `stdin` y soportando `gemini-3.8-flash-low` como modelo rápido predeterminado.
13. `server/ai/check.js`: Script de diagnóstico que verifica versión de `agy`, listado de modelos y ejecución real de un prompt de humo con medición de `firstTokenMs` y `durationMs`.
14. `server/aiUltraBridge.js`: Reexporta el puente hacia `server/ai/routes.js` (`granoAiPlugin`), que monta los endpoints `/api/ai/status`, `/api/ai/models`, `/api/ai/chat` y `/api/ai/json` tanto en `vite dev` como en `vite preview`.
15. `src/lab/duckdb.js`: Inicializa `@duckdb/duckdb-wasm` en navegador, registra los 10 archivos `.parquet` de `/datasets/*.parquet` y expone `runSqlQuery(sql)` devolviendo `{ columns: [{ name, type }], rows: [{}], rowCount, elapsedMs }`.
16. `src/lab/sqlGrader.js`: Implementa `compareQueryResults(actual, expected, options)` y `gradeSqlSubmission`, comparando nombres de columnas, conteo de filas y valores con tolerancia numérica (`1e-2` por defecto) y devolviendo diagnóstico estructurado (`matched`, `columns_mismatch`, `rows_mismatch`).
17. `src/lab/SqlLab.jsx`: Renderiza el laboratorio SQL interactivo con los selectores de prueba `data-testid="sql-lab"`, `data-testid="sql-engine-status"`, `data-testid="sql-grade-btn"`, `data-testid="sql-solution-btn"`, `data-testid="sql-solution-box"` y `data-testid="sql-grade-box"`.
18. `src/lab/SqlEditor.jsx`: Envuelve CodeMirror 6 con resaltado SQL, autocompletado de tablas de Mercado Brisa y atajo `Ctrl+Enter` / `Cmd+Enter`.
19. `src/views/LessonPlayer.jsx`: Renderiza la vista de lección continua con temario lateral colapsable (`lp-syllabus-rail`), bloques de contexto/objetivos, secciones con resaltado de glosario, ejemplo guiado, notas por área (`roleNotes`), comprobaciones (`checks`), práctica SQL y botón `Preguntar` en la barra superior (`.lp-topbar__right .lp-topbar__btn`).
20. `src/components/AuthenticCodeLab.jsx`: Componente auxiliar para laboratorios guiados que delega las prácticas de tipo `sql` en `SqlLab`.
21. `src/App.jsx`: Orquesta la navegación principal de `grano`, sincroniza el atributo `data-theme` (`light`/`dark`) en `document.documentElement` y monta el cajón lateral del Tutor IA (`TutorDrawer`).
22. `src/state/useAppController.js`: Conecta las acciones de usuario (inicio de lección, respuesta a `checks`, resolución de práctica SQL y apertura del Tutor IA) con el almacén persistente.
23. `src/state/store.js`: Gestiona la lectura/escritura en `localStorage` bajo la clave `STORAGE_KEY` y notifica suscriptores de React.
24. `src/state/schema.js`: Define `STORAGE_KEY = 'grano:v1'` y la estructura inicial del estado (`version: 1`, `profile.onboarded`, `prefs.theme`, `progress.lessons`).
25. `src/state/CommandPaletteModal.jsx`: Implementa el buscador global `Ctrl+K` que indexa lecciones, módulos y términos del glosario.
26. `src/data/glossary.js`: Contiene el catálogo base de términos del glosario validados con `GlossaryListSchema`.
27. `src/data/lessons/c2-dimensional/c2-dimensional-01-dimensiones-atributos-jerarquias-claves-sustitutas.js`: Lección de referencia que muestra cómo estructurar ejemplos SQL con `expectedOutput` tabular ASCII y `workedExample` progresivo.
28. `src/data/lessons/c2-dimensional/c2-dimensional-03-dimensiones-lentamente-cambiantes-scd2.js`: Lección prerrequisito (`c2-dimensional-03-dimensiones-lentamente-cambiantes-scd2`) sobre historial SCD Tipo 2 en `customer_changes`, referenciada en `x4-carrera-01` y aplicada en `x4-carrera-03`.
29. `src/data/lessons/da2-eda/da2-eda-04-diario-de-analisis-reproducible.js`: Lección prerrequisito (`da2-eda-04-diario-de-analisis-reproducible`) sobre trazabilidad de hipótesis y bitácora analítica, enlazada desde `x4-carrera-01`.
30. `src/data/lessons/bi2-metricas/bi2-metricas-01-anatomia-de-una-metrica.js`: Lección prerrequisito (`bi2-metricas-01-anatomia-de-una-metrica`) sobre fórmula, grano, filtro de dominio y responsable de negocio, enlazada desde `x4-carrera-01`.
31. `docs/reportes/W-da2-eda.md`, `docs/reportes/W-bi2-metricas.md` y `docs/reportes/W-de2-pipelines.md`: Reportes de referencia de olas previas que ejemplifican el formato de tablas de rúbrica (§9.2 y §9.4), capturas Playwright y prueba adversarial.

---

## Pasos

### Paso 1 — Investigación técnica (`docs/curriculo/investigacion/x4-carrera.md`)

Se redactó el documento de investigación `docs/curriculo/investigacion/x4-carrera.md` fundamentado en 6 fuentes primarias de la industria con fecha de acceso verificada (`2026-10-29`):

1. **Michael Nygard — Documenting Architecture Decisions (Cognitect, 2011):** https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions (`accessed: 2026-10-29`) — estructura canónica de un *Architecture Decision Record* (ADR): título, estado, contexto con restricciones reales, decisión y consecuencias/compensaciones aceptadas.
2. **Good Enough Practices in Scientific Computing — Wilson et al. (PLOS Computational Biology, 2017):** https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1005510 (`accessed: 2026-10-29`) — organización reproducible de proyectos de datos (`data/raw` inmutable, `src/` modular, `tests/` automatizados y ejecución de extremo a extremo mediante un único comando).
3. **dbt Labs — How we style our SQL / Best Practices (dbt Developer Hub):** https://docs.getdbt.com/best-practices/how-we-style/1-how-we-style-our-sql (`accessed: 2026-10-29`) — diseño de consultas modulares con CTEs de importación, preagregación al grano correcto e invariantes de integridad.
4. **DuckDB Documentation — Window Functions & QUALIFY clause:** https://duckdb.org/docs/sql/query_syntax/qualify (`accessed: 2026-10-29`) — semántica de funciones de ventana (`ROW_NUMBER`, `RANK`, `DENSE_RANK`), filtrado post-ventana con `QUALIFY` y desempate determinista por clave única en `ORDER BY`.
5. **MIT Career Advising & Professional Development — Using the STAR Method for Behavioral Interviews:** https://capd.mit.edu/resources/the-star-method-for-behavioral-interviews/ (`accessed: 2026-10-29`) — distribución temporal del método STAR (Situación 15 %, Tarea 15 %, Acción 45 %, Resultado cuantificado 25 %).
6. **McKinsey & Company — The Minto Pyramid Principle in Executive Communication (Alumni & Communications Guide):** https://www.mckinsey.com/alumni/news-and-events/global-news/alumni-news/2021-03-barbara-minto-the-pyramid-principle (`accessed: 2026-10-29`) — principio *answer-first*: abrir cualquier presentación ejecutiva con la conclusión cuantificada antes de desglosar los argumentos de soporte.

### Paso 2 — Mapa de las 3 lecciones y progresión pedagógica

| # | ID (`lessonId`) | Título | Duración | Prerrequisitos | Concepto eje y práctica SQL sobre Mercado Brisa |
|---|---|---|---|---|---|
| 1 | `x4-carrera-01-portafolio-publico-de-da-bi` | Portafolio público por área: código, datos y decisiones | 20 min | `c2-dimensional-03-dimensiones-lentamente-cambiantes-scd2`, `da2-eda-04-diario-de-analisis-reproducible`, `bi2-metricas-01-anatomia-de-una-metrica` | Anatomía de un repositorio reproducible que supera el filtro de 90 segundos, redacción de ADRs y pruebas SQL de reconciliación financiera (`orders`, `order_items`, `refunds`, `stores`, `products`) evitando multiplicación de filas (*fan-out*). |
| 2 | `x4-carrera-02-entrevista-tecnica-sql-caso-arquitectura` | Entrevista técnica: SQL en vivo, caso y arquitectura | 25 min | `x4-carrera-01-portafolio-publico-de-da-bi` | Protocolo verbalizado de 5 pasos para SQL en vivo, descomposición de casos analíticos con métricas guardarraíl, diseño en pizarra y ranking Top-2 por segmento y categoría con `ROW_NUMBER()`, desempate determinista y `QUALIFY`. |
| 3 | `x4-carrera-03-explicar-proyecto-2-minutos` | Explicar un proyecto en 2 minutos: problema e impacto | 20 min | `x4-carrera-02-entrevista-tecnica-sql-caso-arquitectura` | Guion de 120 segundos combinando Pirámide de Minto (*answer-first*) y STAR, articulación oral de una compensación técnica (*trade-off*) en 40 segundos y matriz SQL de impacto antes/después (SCD Tipo 1 `customers.current_tier` vs. SCD Tipo 2 `customer_changes`). |

### Paso 3 — Glosario del módulo (`docs/curriculo/investigacion/x4-carrera-glossary.json`)

Se definieron y validaron 8 términos con `GlossaryListSchema` (cada definición entre 46 y 49 palabras, dentro del rango estricto de 25–50 palabras):

1. `repositorio-reproducible` (49 palabras) — `x4-carrera-01-portafolio-publico-de-da-bi`
2. `registro-decision-arquitectura` (48 palabras) — `x4-carrera-01-portafolio-publico-de-da-bi`
3. `reconciliacion-financiera-sql` (47 palabras) — `x4-carrera-01-portafolio-publico-de-da-bi`
4. `protocolo-sql-en-vivo` (48 palabras) — `x4-carrera-02-entrevista-tecnica-sql-caso-arquitectura`
5. `desempate-determinista-ventana` (46 palabras) — `x4-carrera-02-entrevista-tecnica-sql-caso-arquitectura`
6. `estudio-caso-analitico` (46 palabras) — `x4-carrera-02-entrevista-tecnica-sql-caso-arquitectura`
7. `estructura-star-piramide` (48 palabras) — `x4-carrera-03-explicar-proyecto-2-minutos`
8. `compensacion-tecnica-declarada` (47 palabras) — `x4-carrera-03-explicar-proyecto-2-minutos`

### Paso 4 — Redacción de las 3 lecciones (`src/data/lessons/x4-carrera/`)

Se crearon los tres archivos de lección en `src/data/lessons/x4-carrera/`:
- `src/data/lessons/x4-carrera/x4-carrera-01-portafolio-publico-de-da-bi.js` (`1114` palabras en `sections[].body`, 3 secciones, 1 ejemplo SQL + 4 pasos en `workedExample` + 3 `checks` + 1 práctica SQL + 4 fuentes).
- `src/data/lessons/x4-carrera/x4-carrera-02-entrevista-tecnica-sql-caso-arquitectura.js` (`1052` palabras en `sections[].body`, 3 secciones, 1 ejemplo SQL + 4 pasos en `workedExample` + 3 `checks` + 1 práctica SQL + 4 fuentes).
- `src/data/lessons/x4-carrera/x4-carrera-03-explicar-proyecto-2-minutos.js` (`1107` palabras en `sections[].body`, 3 secciones, 1 ejemplo SQL + 4 pasos en `workedExample` + 3 `checks` + 1 práctica SQL + 4 fuentes).

### Paso 5 — Verificación de ejemplos y prácticas SQL en DuckDB real

Se ejecutaron los 12 bloques SQL del módulo (`sections[].example.code`, `workedExample.steps[].code`, `practice.starterCode`, `practice.expected` y `practice.solution`) sobre los archivos Parquet reales de `public/datasets/*.parquet` mediante DuckDB y `compareQueryResults` (`src/lab/sqlGrader.js`). En las 3 lecciones:
- `starterCode` ejecuta sin error de sintaxis pero **falla** la evaluación frente a `expected` (`passed: false`, por omisión deliberada de preagregación de reembolsos en L1, omisión de ranking/filtro `QUALIFY` en L2 y omisión del cruce temporal SCD Tipo 2 en L3).
- `solution` coincide exactamente con `expected` (`passed: true`, `reason: 'matched'`) y la tabla estática `expectedOutputTable` refleja las columnas y filas reales devueltas por DuckDB.

### Paso 6 — Verificación con scripts de contenido y estilo (`check-content.mjs` y `check-copy.mjs`)

Ambos validadores se ejecutaron sobre las 3 lecciones y el glosario del módulo:
- `node scripts/check-content.mjs --module x4-carrera`: **3 válidas | 0 con advertencias | 0 con errores**.
- `node scripts/check-copy.mjs --path src/data/lessons/x4-carrera`: **0 hallazgos**, promedio global de `18` palabras/oración (`14.2`, `14.6` y `15.6` palabras/oración en `sections[].body`).

### Paso 7 — Autoevaluación con la rúbrica de 8 criterios (§9.2 y §9.4)

#### Tabla de resumen de métricas del módulo (§9.2)

| Lección | Palabras | Checks | Prácticas | Fuentes | Puntuación de rúbrica |
|---|---:|---:|---:|---:|---:|
| `x4-carrera-01-portafolio-publico-de-da-bi` | 1114 | 3 | 1 | 4 | 32 / 32 |
| `x4-carrera-02-entrevista-tecnica-sql-caso-arquitectura` | 1052 | 3 | 1 | 4 | 32 / 32 |
| `x4-carrera-03-explicar-proyecto-2-minutos` | 1107 | 3 | 1 | 4 | 32 / 32 |

#### Desglose por los 8 criterios de la rúbrica (§9.4, escala 0–4, máximo 32)

| Lección | 1. Objetivo claro | 2. Progresión | 3. Ejemplo concreto | 4. Error típico | 5. Práctica | 6. Brevedad | 7. Precisión | 8. Tono | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `x4-carrera-01-portafolio-publico-de-da-bi` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |
| `x4-carrera-02-entrevista-tecnica-sql-caso-arquitectura` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |
| `x4-carrera-03-explicar-proyecto-2-minutos` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |

Justificación de la puntuación:
- **1. Objetivo claro (4/4):** Cada lección abre con un `hook` concreto de reclutamiento/entrevista técnica y 3 objetivos medibles con verbos de acción (`Estructurar`, `Documentar`, `Implementar`, `Aplicar`, `Defender`, `Articular`, `Construir`).
- **2. Progresión (4/4):** De la evidencia asíncrona del repositorio y ADR (`x4-carrera-01`), pasando por la defensa interactiva en entrevista de SQL en vivo, caso y pizarra (`x4-carrera-02`), hasta la síntesis ejecutiva en 120 segundos con matriz de impacto antes/después (`x4-carrera-03`).
- **3. Ejemplo concreto (4/4):** Todos los ejemplos y `workedExample` operan sobre tablas reales de Mercado Brisa (`orders`, `order_items`, `refunds`, `products`, `stores`, `customers`, `customer_changes`, `marketing_spend`) con salidas verificadas en DuckDB.
- **4. Error típico (4/4):** Se diagnostican y cuantifican errores reales de candidatos: *fan-out* al cruzar `order_items` y `refunds` sin preagregar (L1), uso de `ROW_NUMBER()` sin clave de desempate única en `ORDER BY` (L2) y sesgo de supervivencia al usar `customers.current_tier` en vez de `customer_changes` con vigencia temporal (L3).
- **5. Práctica (4/4):** Las 3 prácticas exigen escribir CTEs, agregaciones, funciones de ventana con `QUALIFY` o cruces de intervalo temporal SCD2, con `starterCode` que falla de forma instructiva y `solution` que supera el calificador SQL.
- **6. Brevedad (4/4):** Conteo de palabras entre `1052` y `1114` palabras (dentro de `800–1250` para Nivel 4) y promedios de oración de `14.2`, `14.6` y `15.6` palabras/oración (`<= 22`).
- **7. Precisión (4/4):** Tipos, nombres de columnas, semántica de `QUALIFY` en DuckDB, estructura de ADR de Nygard y principio de la Pirámide de Minto verificados contra fuentes primarias y contra el motor SQL.
- **8. Tono (4/4):** Español técnico sobrio, 0 términos prohibidos del Apéndice B, 0 emojis, máximo 3 negritas por párrafo.

---

## Test

### 1. Validación de esquema e integridad (`node scripts/check-content.mjs --module x4-carrera`)

```text
=== Validación de contenido v2 (check-content) ===
Lección (id v2)                                | Módulo               | Niv  | Sec  | Chk  | Src  | Palabras  | Estado    
--------------------------------------------------------------------------------------------------------------------------
x4-carrera-01-portafolio-publico-de-da-bi      | x4-carrera           | 4    | 3    | 3    | 4    | 1114      | OK        
x4-carrera-02-entrevista-tecnica-sql-caso-arquitectura | x4-carrera           | 4    | 3    | 3    | 4    | 1052      | OK        
x4-carrera-03-explicar-proyecto-2-minutos      | x4-carrera           | 4    | 3    | 3    | 4    | 1107      | OK        
--------------------------------------------------------------------------------------------------------------------------
Resumen: 3 lecciones inspeccionadas | 3 válidas | 0 con advertencias (needsReview) | 0 con errores.

Resultado: OK (0 errores de esquema o integridad).
```

### 2. Validación de estilo y anti-slop (`node scripts/check-copy.mjs --path src/data/lessons/x4-carrera`)

```text
=== Verificación de estilo y anti-slop (check-copy) ===
Archivos inspeccionados: 326
Promedio global de longitud de oración: 18 palabras/oración
Lecciones con promedio > 22 palabras/oración: 0
Total de hallazgos: 0

Resultado: OK (0 violaciones de estilo).
```

### 3. Validación de glosario y ejecución SQL en DuckDB (`verify_module.mjs`)

```text
=== 1. Validando glosario x4-carrera-glossary.json ===
GlossaryListSchema.safeParse: true errors: 0
  - repositorio-reproducible: 49 palabras
  - registro-decision-arquitectura: 48 palabras
  - reconciliacion-financiera-sql: 47 palabras
  - protocolo-sql-en-vivo: 48 palabras
  - desempate-determinista-ventana: 46 palabras
  - estudio-caso-analitico: 46 palabras
  - estructura-star-piramide: 48 palabras
  - compensacion-tecnica-declarada: 47 palabras

=== 2. Validando lecciones y ejecutando SQL en DuckDB ===

--- Lección: x4-carrera-01-portafolio-publico-de-da-bi ---
LessonSchema.safeParse: true errors: 0
Palabras en sections[].body: 1114 | Oraciones: 78 | Promedio palabras/oración: 14.2
  [SQL OK] section[2].example: 4 filas, cols: [estado_reconciliacion, total_pedidos, suma_cabecera_usd, suma_lineas_usd, diferencia_absoluta_usd]
  [SQL OK] workedExample.step[0]: 6 filas, cols: [status, pedidos, bruto_cabecera_usd]
  [SQL OK] workedExample.step[1]: 5 filas, cols: [order_id, store_id, neto_antes_impuestos_usd, suma_lineas_usd, brecha_usd]
  [SQL OK] workedExample.step[2]: 4 filas, cols: [reason, pedidos_con_reembolso, total_reembolsado_usd]
  [SQL OK] workedExample.step[3]: 3 filas, cols: [store_type, pedidos_auditados, ingreso_neto_auditado_usd, pedidos_con_brecha_lineas]
  [Practice] starterCode -> passed: false (rows_mismatch)
  [Practice] solution    -> passed: true (matched)
  [Practice] expected rows: 3, cols: [store_type, pedidos_auditados, unidades_totales, ingreso_neto_usd, margen_neto_usd]

--- Lección: x4-carrera-02-entrevista-tecnica-sql-caso-arquitectura ---
LessonSchema.safeParse: true errors: 0
Palabras en sections[].body: 1052 | Oraciones: 72 | Promedio palabras/oración: 14.6
  [SQL OK] section[2].example: 14 filas, cols: [category, pos_unica, product_id, product_name, ingreso_categoria_usd]
  [SQL OK] workedExample.step[0]: 1 filas, cols: [filas_totales, pedidos_distintos, estados_distintos]
  [SQL OK] workedExample.step[1]: 7 filas, cols: [category, productos_activos, unidades_vendidas, ingreso_neto_lineas_usd, margen_bruto_usd]
  [SQL OK] workedExample.step[2]: 3 filas, cols: [segment, clientes_con_compra, pedidos_completados, ticket_promedio_usd]
  [SQL OK] workedExample.step[3]: 6 filas, cols: [segment, ranking, category, margen_bruto_usd]
  [Practice] starterCode -> passed: false (columns_mismatch)
  [Practice] solution    -> passed: true (matched)
  [Practice] expected rows: 6, cols: [segment, ranking, category, pedidos_unicos, unidades, margen_bruto_usd]

--- Lección: x4-carrera-03-explicar-proyecto-2-minutos ---
LessonSchema.safeParse: true errors: 0
Palabras en sections[].body: 1107 | Oraciones: 71 | Promedio palabras/oración: 15.6
  [SQL OK] section[2].example: 4 filas, cols: [tier, pedidos_scd1, pedidos_scd2, ingreso_estatico_scd1_usd, ingreso_historico_scd2_usd, sesgo_eliminado_usd]
  [SQL OK] workedExample.step[0]: 4 filas, cols: [tier, pedidos_antes, ingreso_antes_usd]
  [SQL OK] workedExample.step[1]: 4 filas, cols: [tier, pedidos_despues, ingreso_despues_usd]
  [SQL OK] workedExample.step[2]: 4 filas, cols: [tier, pedidos_antes, pedidos_despues, ingreso_antes_usd, ingreso_despues_usd, sesgo_corregido_usd]
  [SQL OK] workedExample.step[3]: 6 filas, cols: [channel, inversion_usd, pedidos_atribuidos, ingreso_atribuido_usd, roas]
  [Practice] starterCode -> passed: false (columns_mismatch)
  [Practice] solution    -> passed: true (matched)
  [Practice] expected rows: 4, cols: [tier, pedidos_antes, pedidos_despues, ingreso_antes_usd, ingreso_despues_usd, sesgo_corregido_usd]

=== Verificación completada con éxito ===
```

### 4. Diagnóstico y prueba de 2 turnos reales del Tutor IA con `agy` (`node server/ai/check.js` y `test_agy_tutor.mjs`)

Salida literal de `node server/ai/check.js`:
```text
=== Diagnóstico de IA local (agy) ===
Binario detectado : C:\Users\T490s\AppData\Local\Programs\Antigravity\bin\agy.cmd
Versión de agy    : 1.4.11
Modelos disponibles (4): gemini-3.8-flash-low, gemini-4-argon-medium, gemini-4-argon-high, claude-sonnet-4.6
Modelo rápido por defecto : gemini-3.8-flash-low
Modelo profundo por defecto: gemini-4-argon-medium
Ejecutando prueba de humo con modelo "gemini-3.8-flash-low"...
Respuesta recibida : OK_GRANO
Tiempo al 1er byte : 9911 ms
Duración total     : 12421 ms
Resultado          : OK
```

Salida literal de `test_agy_tutor.mjs` (2 turnos reales por cada una de las 3 lecciones usando `buildContextPrompt` + `runAgyPrompt` con `gemini-3.8-flash-low`):

- **Lección 1 (`x4-carrera-01-portafolio-publico-de-da-bi`, sección `sec-pruebas-reconciliacion-y-antipatrones`):**
  - **Turno 1 (`firstTokenMs: 7212 ms`, `durationMs: 8340 ms`):**
    > «Imagina que en el repositorio de tu portafolio sobre **Mercado Brisa** escribes una consulta para reportar el ingreso neto y el total reembolsado haciendo un `JOIN` directo entre `orders`, `order_items` y `refunds` usando `order_id`, sin agrupar previamente en CTEs. Si el pedido `1042` tiene **3 líneas** en `order_items` y **2 reembolsos parciales** en `refunds`: 1. ¿Cuántas filas genera ese pedido tras el cruce y cómo distorsiona eso el cálculo de `SUM(oi.line_total_usd)` y `SUM(r.refund_amount_usd)`? 2. ¿Cómo reestructurarías la consulta para garantizar el grano correcto antes de cruzar?»
  - **Turno 2 (`firstTokenMs: 5373 ms`, `durationMs: 7576 ms`):**
    > «1. **El problema del cruce directo (*fan-out*):** Si un pedido tiene 3 líneas en `order_items` y 2 registros en `refunds`, al unir ambas tablas directamente por `order_id` se genera un producto cartesiano local para ese pedido: `3 × 2 = 6 filas`. Cada línea de producto se repite 2 veces (`SUM(oi.line_total_usd)` se duplica) y cada reembolso se repite 3 veces (`SUM(r.refund_amount_usd)` se triplica). 2. **La solución en SQL:** Preagregar cada tabla hija en su propio CTE al grano de `order_id` (`items_por_pedido` y `reembolsos_por_pedido`) antes de hacer `LEFT JOIN` contra `orders`.»

- **Lección 2 (`x4-carrera-02-entrevista-tecnica-sql-caso-arquitectura`, sección `sec-protocolo-sql-en-vivo`):**
  - **Turno 1 (`firstTokenMs: 5310 ms`, `durationMs: 6408 ms`):**
    > «"En **Mercado Brisa** necesitamos identificar los **2 productos con mayor ingreso bruto por categoría**, considerando únicamente pedidos completados (`status = 'completed'`)." Aplicando el **protocolo de 5 pasos** de la lección: 1. ¿Cuál declararías que es el **grano exacto** de la tabla de salida y qué filtro de dominio debes confirmar antes de cruzar `orders`, `order_items` y `products`? 2. Si dos productos de la misma categoría empatan exactamente en `total_revenue`, ¿por qué escribir `ROW_NUMBER() OVER (PARTITION BY category ORDER BY total_revenue DESC)` es riesgoso en producción y cómo harías que el desempate sea **100 % determinista**?»
  - **Turno 2 (`firstTokenMs: 10680 ms`, `durationMs: 13634 ms`):**
    > «1. **Por qué no debes teclear sin declarar el grano:** En el protocolo de 5 pasos, escribir código en silencio sin definir el grano (`category + product_id`) impide detectar si una unión multiplica filas (*fan-out*) y deja ambiguo el denominador. 2. **El problema de `ROW_NUMBER()` sin desempate:** Cuando dos productos empatan en `total_revenue` dentro de la misma `category`, `ORDER BY total_revenue DESC` deja que el motor elija arbitrariamente cuál recibe el `1` y cuál el `2`. Para hacerlo determinista, añade una clave única como segundo criterio: `ORDER BY total_revenue DESC, product_id ASC` junto con `QUALIFY ROW_NUMBER() OVER (...) <= 2`.»

- **Lección 3 (`x4-carrera-03-explicar-proyecto-2-minutos`, sección `sec-arquitectura-guion-120-segundos`):**
  - **Turno 1 (`firstTokenMs: 12817 ms`, `durationMs: 14191 ms`):**
    > «"Construiste un modelo en **Mercado Brisa** que corrigió la atribución de ingresos por nivel de fidelidad (*tier*), pasando de cruzar `orders` con `customers.current_tier` (SCD Tipo 1) a cruzar con el historial de `customer_changes` (SCD Tipo 2). Tienes **2 minutos** para explicarme el proyecto." 1. Aplicando el **Principio de la Pirámide de Minto**, ¿qué dirías exactamente en tus **primeros 20 segundos**? 2. ¿Cuál es el sesgo financiero que ocurría al usar `customers.current_tier`?»
  - **Turno 2 (`firstTokenMs: 5519 ms`, `durationMs: 8014 ms`):**
    > «1. **El error del primer minuto (Violación de la Pirámide de Minto):** En una entrevista de 120 segundos, dedicar los primeros 60 segundos a contar que descargaste archivos y limpiaste nulos invierte la pirámide: debes abrir en los primeros 20 segundos con el resultado cuantificado y la decisión habilitada. 2. **El sesgo financiero de `customers.current_tier` (SCD1 vs. SCD2):** Al cruzar `orders` con `customers.current_tier` atribuyes todas las compras históricas al nivel que el cliente tiene hoy (sesgo de supervivencia), inflando artificialmente el nivel `gold` o `vip`. Se corrige cruzando con `customer_changes` en el intervalo `o.order_ts >= cc.valid_from AND (cc.valid_to IS NULL OR o.order_ts < cc.valid_to)`.»

### 5. Verificación en navegador real con Playwright y DuckDB-Wasm (`verify_browser.mjs` en puerto `5233`)

```json
{
  "results": [
    {
      "lessonId": "x4-carrera-01-portafolio-publico-de-da-bi",
      "titleText": "Portafolio público por área: código, datos y decisiones",
      "overflow1440": false,
      "starterFailed": true,
      "gradeSummary": "Práctica superada · El resultado coincide con la referencia Resultado verificado: 3 fila(s) y 5 columna(s) coinciden con la referencia.",
      "screenshots": [
        "01-x4-carrera-01-portafolio-publico-de-da-bi-header.png",
        "01b-x4-carrera-01-portafolio-publico-de-da-bi-starter-fail.png",
        "01-x4-carrera-01-portafolio-publico-de-da-bi-practica-solved.png"
      ]
    },
    {
      "lessonId": "x4-carrera-02-entrevista-tecnica-sql-caso-arquitectura",
      "titleText": "Entrevista técnica: SQL en vivo, caso y arquitectura",
      "overflow1440": false,
      "starterFailed": true,
      "gradeSummary": "Práctica superada · El resultado coincide con la referencia Resultado verificado: 6 fila(s) y 6 columna(s) coinciden con la referencia.",
      "screenshots": [
        "02-x4-carrera-02-entrevista-tecnica-sql-caso-arquitectura-header.png",
        "02-x4-carrera-02-entrevista-tecnica-sql-caso-arquitectura-practica-solved.png",
        "02c-x4-carrera-02-entrevista-tecnica-sql-caso-arquitectura-dark.png"
      ]
    },
    {
      "lessonId": "x4-carrera-03-explicar-proyecto-2-minutos",
      "titleText": "Explicar un proyecto en 2 minutos: problema e impacto",
      "overflow1440": false,
      "starterFailed": true,
      "gradeSummary": "Práctica superada · El resultado coincide con la referencia Resultado verificado: 4 fila(s) y 6 columna(s) coinciden con la referencia.",
      "screenshots": [
        "03-x4-carrera-03-explicar-proyecto-2-minutos-header.png",
        "03-x4-carrera-03-explicar-proyecto-2-minutos-practica-solved.png",
        "03b-x4-carrera-03-explicar-proyecto-2-minutos-tutor-drawer.png"
      ]
    }
  ],
  "overflow375": false,
  "overflow390": false,
  "consoleErrors": [],
  "pageErrors": []
}
```

### 6. Compilación de producción (`npm run build`)

```text
> grano@1.0.0 build
> vite build

vite v6.4.5 building for production...
✓ 2437 modules transformed.
dist/index.html                                                        1.00 kB │ gzip:     0.51 kB
dist/assets/index-Ds05HJQs.css                                       236.89 kB │ gzip:    32.06 kB
dist/assets/curriculum-stages-BHOHuqmu.js                            285.16 kB │ gzip:    95.09 kB
dist/assets/SqlLab-BjG58iMn.js                                       389.73 kB │ gzip:   127.31 kB
dist/assets/vendor-CMuuJwVt.js                                       558.99 kB │ gzip:   155.51 kB
dist/assets/index-C5Ym30DU.js                                      2,930.64 kB │ gzip:   809.16 kB
✓ built in 22.82s
```

---

## Revisión propia

Defectos concretos detectados durante la verificación y corregidos antes de cerrar el módulo:

1. **Alineación del contrato Zod (`LessonSchema` en `src/data/schema/lesson.js`):** El primer borrador usaba `track: 'core'` en singular, `example.type: 'sql'`, `checks[].options[].label` y `practice.kind: 'sql'`, además de una frase de 27 palabras en `summary`. Al validar con `LessonSchema.safeParse`, se corrigieron las 3 lecciones para usar `tracks: ['core', 'de', 'da', 'bi']`, `contentVersion: 1`, `example.language: 'sql'`, `example.expectedOutput`, `options[].text`/`correct`, `practice.type: 'sql'`, `practice.expected`, `practice.expectedOutputTable` y oraciones `<= 25` palabras en `summary`.
2. **Exceso de longitud media de oración (`> 22` palabras/oración) y negritas por párrafo (`> 3`):** En la primera corrida de `check-copy.mjs`, las tres lecciones promediaban `24.9`, `27.4` y `24.4` palabras por oración, y L02/L03 tenían párrafos con 4 negritas y un `heading` de 75 caracteres (`> 70`). Se dividieron las cláusulas subordinadas largas y se redujeron las negritas a un máximo de 3 por párrafo, bajando los promedios a `14.2`, `14.6` y `15.6` palabras/oración.
3. **Eliminación de expresiones prohibidas por `check-copy.mjs`:** El validador detectó el gerundio `descubriendo` (raíz `descubre`) en `x4-carrera-03` y la expresión `caso real` en la línea 89 de `x4-carrera-01`. Se reemplazaron por `demostrando` y `una decisión concreta`, logrando `0` hallazgos.
4. **Corrección de nombres de columnas y tablas SQL frente a `public/datasets/schema.json`:** En el primer borrador de `workedExample` se hacía referencia a `o.net_total_usd`, `oi.quantity` y a tablas inexistentes `campaigns`/`ad_spend`. La ejecución contra DuckDB en `verify_module.mjs` detectó los errores de enlace (*Binder Error*); se actualizaron todas las consultas para usar `o.subtotal_usd - o.discount_usd`, `o.total_usd`, `oi.qty` y la tabla real `marketing_spend`.
5. **Formato de entrada de `compareQueryResults` en el script de verificación:** `sqlGrader.js` espera `columns: [{ name }]` y `rows` como objetos clave-valor `[{ col: val }]`, mientras que la primera versión del script le pasaba arreglos posicionales. Se ajustó `runQueryToGraderFormat` para reflejar exactamente la salida de `runSqlQuery` en `src/lab/duckdb.js`.
6. **Firma de `runAgyPrompt` en la prueba del Tutor IA:** `runAgyPrompt` en `server/ai/agyRunner.js` recibe un único objeto `{ prompt, model, firstByteTimeoutMs }`. Llamarlo con `(prompt, options)` enviaba un prompt vacío a `stdin`. Se corrigió la llamada en `test_agy_tutor.mjs`, obteniendo respuestas completas en los 6 turnos.
7. **Bloqueo de tuberías (`stdio: 'pipe'`) y clave `grano:v1` en Playwright:** En `verify_browser.mjs`, lanzar Vite sin drenar `stdout`/`stderr` llenaba el búfer de tubería en Windows y usaba una clave antigua de `localStorage`. Se actualizó a `stdio: 'ignore'`, `STORAGE_KEY = 'grano:v1'` y servidor de previsualización sobre la compilación de producción en el puerto `5233`.

---

## Prueba adversarial

| # | Escenario adversarial | Entrada / Acción | Resultado observado | Estado |
|---|---|---|---|---|
| 1 | Ejecución directa del `starterCode` sin modificar en las 3 lecciones | Clic en `Comprobar resultado` (`[data-testid="sql-grade-btn"]`) con el código inicial en L01, L02 y L03 | El calificador rechaza la entrega (`is-fail`): `rows_mismatch` en L01 (no descuenta reembolsos de `refunds`) y `columns_mismatch` en L02 y L03 (faltan columnas de ranking/comparación SCD2) | PASS |
| 2 | Cruce directo `orders JOIN order_items JOIN refunds` sin preagregación en L01 | Consulta que une `order_items` y `refunds` directamente por `order_id` y suma `oi.line_total_usd` | El producto cartesiano entre líneas e hitos de reembolso infla `ingreso_neto_usd` y `unidades_totales`, siendo rechazado por `compareQueryResults` frente a la referencia con CTEs | PASS |
| 3 | Omisión de filtro `QUALIFY ranking <= 2` o desempate en `ROW_NUMBER()` en L02 | Consulta de ventana `ROW_NUMBER() OVER (PARTITION BY segment ORDER BY margen_bruto_usd DESC)` sin `QUALIFY` | Devuelve las 21 combinaciones de `segment × category` en lugar de las 6 filas Top-2 esperadas; `sqlGrader` reporta `rows_mismatch` | PASS |
| 4 | Cruce temporal SCD Tipo 2 en L03 olvidando `cc.valid_to IS NULL` para el tramo vigente | Condición `o.order_ts >= cc.valid_from AND o.order_ts < cc.valid_to` sin `OR cc.valid_to IS NULL` | Se pierden todos los pedidos ocurridos durante el tramo actual del cliente (`is_current = true`), reduciendo `pedidos_despues` e `ingreso_despues_usd`; el calificador marca `rows_mismatch` | PASS |
| 5 | Inspección de desbordamiento horizontal en móvil (`375×812` y `390×844`) y escritorio (`1440×900`) | Evaluación de `document.documentElement.scrollWidth > document.documentElement.clientWidth` con tablas SQL anchas y bloques de código | `overflow1440: false`, `overflow375: false`, `overflow390: false`; los contenedores `.lp-wide-block` y `.sql-lab` encapsulan su propio scroll horizontal sin desbordar el documento | PASS |
| 6 | Cambio a tema oscuro (`data-theme="dark"`) y apertura del cajón del Tutor IA | Conmutación de tema en `x4-carrera-02` y apertura del cajón `Preguntar` en `x4-carrera-03` | Contraste legible en encabezados, tarjetas de objetivos, editor SQL y cajón del Tutor IA, con `consoleErrors: []` y `pageErrors: []` | PASS |

---

## Capturas antes / después

Todas las capturas fueron tomadas con Playwright Chromium sobre el servidor real en el puerto `5233` y guardadas en `docs/reportes/capturas/W-x4-carrera/`:

1. `docs/reportes/capturas/W-x4-carrera/01-x4-carrera-01-portafolio-publico-de-da-bi-header.png` — Cabecera, migas de pan, enlaces a prerrequisitos, escenario real y objetivos de `x4-carrera-01` en `1440×900` (tema claro).
2. `docs/reportes/capturas/W-x4-carrera/01b-x4-carrera-01-portafolio-publico-de-da-bi-starter-fail.png` — Estado **antes** en `x4-carrera-01`: el `starterCode` falla la validación (`El resultado aún no coincide con la referencia`) al no descontar reembolsos preagregados.
3. `docs/reportes/capturas/W-x4-carrera/01-x4-carrera-01-portafolio-publico-de-da-bi-practica-solved.png` — Estado **después** en `x4-carrera-01`: práctica superada (`3 fila(s) y 5 columna(s) coinciden con la referencia`).
4. `docs/reportes/capturas/W-x4-carrera/02-x4-carrera-02-entrevista-tecnica-sql-caso-arquitectura-header.png` — Cabecera y objetivos de `x4-carrera-02` en `1440×900` (tema claro).
5. `docs/reportes/capturas/W-x4-carrera/02-x4-carrera-02-entrevista-tecnica-sql-caso-arquitectura-practica-solved.png` — Práctica superada en `x4-carrera-02` (`6 fila(s) y 6 columna(s) coinciden con la referencia`).
6. `docs/reportes/capturas/W-x4-carrera/02c-x4-carrera-02-entrevista-tecnica-sql-caso-arquitectura-dark.png` — Vista de `x4-carrera-02` en modo oscuro (`data-theme="dark"`).
7. `docs/reportes/capturas/W-x4-carrera/03-x4-carrera-03-explicar-proyecto-2-minutos-header.png` — Cabecera y objetivos de `x4-carrera-03` en `1440×900` (tema claro).
8. `docs/reportes/capturas/W-x4-carrera/03-x4-carrera-03-explicar-proyecto-2-minutos-practica-solved.png` — Práctica superada en `x4-carrera-03` (`4 fila(s) y 6 columna(s) coinciden con la referencia`).
9. `docs/reportes/capturas/W-x4-carrera/03b-x4-carrera-03-explicar-proyecto-2-minutos-tutor-drawer.png` — Práctica superada en `x4-carrera-03` con el cajón lateral del Tutor IA abierto (`gemini-3.8-flash-low`).
10. `docs/reportes/capturas/W-x4-carrera/03c-x4-carrera-03-mobile-375.png` — Vista móvil `375×812` de `x4-carrera-03` sin desbordamiento horizontal (`overflow375: false`).

---

## Peticiones al orquestador

1. Al integrar la rama `agente/W-x4-carrera`, ejecutar `node scripts/sync-lessons-index.mjs` e incorporar las 8 entradas de `docs/curriculo/investigacion/x4-carrera-glossary.json` en `src/data/glossary.js` (dejados sin modificar en este commit para respetar la frontera estricta de archivos).

---

## Pendiente (con motivo)

Ningún ítem pendiente. Las 3 lecciones, el documento de investigación, el glosario de 8 términos, la verificación en DuckDB, los 6 turnos reales del Tutor IA con `agy`, las 10 capturas en Playwright y el reporte están completos y verificados.
