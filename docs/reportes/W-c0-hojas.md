# W-c0-hojas — Hojas de cálculo con criterio (Nivel 0 · Tronco común)

- **Agente:** `W-c0-hojas`
- **Fase y ola:** Fase 3 · Ola A (módulos de Nivel 0, paralelos)
- **Rama y worktree:** `agente/W-c0-hojas` en `C:\Users\T490s\Desktop\Proyectos\ING-W-c0-hojas`
- **Puerto asignado:** `5202`
- **Fecha:** `2026-10-29`

---

## Inicio

Lectura íntegra de `PLAN_GEMINI_4_ARGON.md` y desglose individual de cada archivo leído antes de escribir código, con un dato técnico concreto aprendido por archivo:

1. `PLAN_GEMINI_4_ARGON.md:1-1474` — Establece las reglas de voz en español con término inglés entre paréntesis la primera vez (§2.3, §9.1), el dataset unificado Mercado Brisa con 13 tablas y anomalías sembradas (§6.3), el modelo de lección v2 y glosario (§6.4, §6.5), el proceso de creación en 7 pasos (§9.2), la plantilla de lección (§9.3), la rúbrica de calidad (§9.4), el protocolo de git worktrees (Apéndice B) y el checklist de aprobación (Apéndices D.2 y D.3).
2. `package.json:1-45` — Define los scripts de validación (`check:catalog`, `check:content`, `check:copy`, `check:contrast`, `ai:check`, `shots`) y las dependencias `@duckdb/node-api` (`^2.0.0-r.1`), `@duckdb/duckdb-wasm` (`^1.33.1-dev57.0`) y `zod` (`^4.6.7`).
3. `vite.config.js:1-48` — Configura el puerto `5174` por defecto, expone el plugin de servidor `/api/ai/*` mediante `registerAiRoutes` y excluye `@duckdb/duckdb-wasm` de `optimizeDeps` para preservar los workers `.wasm`.
4. `src/main.jsx:1-18` — Punto de entrada React que importa las fuentes tipográficas autoalojadas (`Newsreader`, `IBM Plex Sans`, `IBM Plex Mono`) y `src/styles/tokens.css` antes de montar `<App />`.
5. `src/App.jsx:1-248` — Conecta `useAppController()` con `<AppShell />`, `<LessonPlayer />`, `<TutorPanel />` y carga `<PracticeView />` con `React.lazy()` cuando `viewMode === 'practice'`.
6. `src/styles/tokens.css:1-210` — Define la paleta cálida crema/carbón/terracota (`--bg`, `--surface`, `--ink`, `--accent: #c2410c`), la escala tipográfica fluida y los modos de densidad (`comfortable`, `compact`) y tema (`light`, `dark`).
7. `src/data/catalog/modules.js:18-45` — Define el módulo `c0-hojas` (`title: 'Hojas de cálculo con criterio'`, `track: 'core'`, `level: 0`, `prerequisites: ['c0-datos']`, `projectId: 'p0-hoja-auditada'`) con sus 4 lecciones planeadas y duraciones exactas `[15, 20, 20, 15]` minutos.
8. `src/data/schema/lesson.js:1-141` — Especifica `LessonSchema` en Zod v4: `id` kebab-case, `objectives` de longitud exacta 3, `hook` (`80..600` caracteres), `sections` (`3..6`, con `heading` `4..70` caracteres y `body` `>= 120` caracteres), `workedExample` (`2..5` pasos), `practice` (`type: 'sql'`, `hints` `1..3`), `checks` (`2..3` preguntas con `3..4` opciones y `feedback` por opción), `roleNotes` (`de`, `da`, `bi`), `summary` (`3..5` puntos), `sources` (`>= 2` HTTPS con `accessed` `YYYY-MM-DD`) y `aiNotes`.
9. `src/data/schema/glossary.js:1-38` — Especifica `GlossaryTermSchema` y `GlossaryListSchema` con `id` kebab-case, `term`, `en`, `category` (`fundamentos`, `sql`, `modelado`, `ingenieria`, `analitica`, `bi`, `ia`), `level` (`0..4`), `definition`, `example`, `relatedLessons` y `relatedTerms`.
10. `public/datasets/README.md:1-106` — Documenta la semilla determinista `19870315` de Mercado Brisa y las 6 anomalías sembradas a propósito (fan-out en `order_items`, cambios SCD2 en `customer_changes`, 450 pagos duplicados por `idempotency_key` en `payments`, SRM 55/45 en `EXP-2025-03`, `event_ts_raw` en 5 formatos horarios en `events` y `SKU-TEST-NEG` con `list_price_usd = -9.99` en `products`).
11. `public/datasets/schema.json:1-420` — Detalla los nombres exactos de columnas, tipos DuckDB y recuentos de filas de las 13 tablas Parquet (`orders`: 18.000 filas; `order_items`: 42.000; `customers`: 2.400; `products`: 180; `payments`: 19.200; `stores`: 14; `events`: 65.000).
12. `scripts/check-content.mjs:1-430` — Valida cada lección contra `LessonSchema`, comprueba que `moduleId` exista en `MODULES`, verifica el rango de palabras visibles por nivel (`600..1100` palabras en Nivel 0) y soporta filtrado por módulo con `--module c0-hojas`.
13. `scripts/check-copy.mjs:1-315` — Escanea lecciones y documentos curriculares rechazando palabras prohibidas (`masterizar`, `enterprise-grade`, `production-ready`, etc.), emojis, menciones promocionales a `"2026"`, párrafos con más de 3 negritas (`**...**`) y reporta la longitud media de frase en `sections[].body` (umbral `<= 22` palabras/frase).
14. `scripts/sync-lessons-index.mjs:1-145` — Escanea `src/data/lessons/**/*.js` y regenera determinísticamente `src/data/lessons/index.js` con `LESSONS_V2`, `LESSONS_BY_ID` y el adaptador `adaptLessonForLegacyPlayer`.
15. `docs/curriculo/fuentes.md:1-120` — Reúne el inventario de fuentes oficiales de Fase 1 y confirma qué documentación técnica requiere verificación de URL activa por módulo.
16. `docs/curriculo/brechas.md:1-110` — Identifica `c0-hojas` como módulo completamente nuevo (`4` lecciones a crear desde cero) sin lección legacy equivalente en `learningPath2026.js`.
17. `src/data/glossary.js:1-260` — Muestra la estructura de los términos actuales de glosario y su validación en tiempo de carga mediante `GlossaryListSchema.parse()`.
18. `src/views/LessonPlayer.jsx:1-1532` — Renderiza las 9 secciones del temario lateral (`Contexto y objetivos`, 3 secciones de desarrollo, `Ejemplo paso a paso`, `Desde tu área`, `Comprobaciones`, `Práctica aplicada` y `Resumen y fuentes`) y gestiona los requisitos honestos de completado.
19. `src/views/lesson/normalizeLessonV2.js:1-265` — Normaliza lecciones v2 y legacy garantizando que `objectives`, `sections`, `workedExample`, `roleNotes`, `checks`, `practice`, `summary` y `sources` tengan identificadores estables.
20. `src/views/lesson/LessonWorkedExample.jsx:1-210` — Renderiza cada paso de `workedExample.steps` como pestaña numerada con bloque de código copiable y botón contextual para preguntar al tutor IA.
21. `src/views/lesson/LessonCheckCard.jsx:1-195` — Muestra cada pregunta de `checks` con selección de opción, estado acertado/fallido persistido en el store y `feedback` específico de la opción elegida más `explanation` general.
22. `src/components/AuthenticCodeLab.jsx:1-372` — Delega automáticamente en `<LazySqlLab />` cuando `practice.type === 'sql'` y en el modo de huecos interactivos cuando `practice.type === 'fill-blanks'`.
23. `src/lab/SqlLab.jsx:1-538` — Ejecuta consultas en vivo contra DuckDB-Wasm, muestra pistas graduales (`hints`), permite revelar la consulta de referencia (`solution`) y califica el resultado con `gradeSqlPractice`.
24. `src/lab/duckdb.js:1-493` — Registra los 13 archivos `.parquet` de `public/datasets/` como vistas en memoria en DuckDB-Wasm y normaliza valores Arrow (`BigInt`, `Date`, `Decimal`) a JSON estándar.
25. `src/views/PracticeView.jsx:1-335` — Proporciona el catálogo de prácticas ejecutables y el explorador interactivo del esquema de las 13 tablas de Mercado Brisa.
26. `server/ai/routes.js:1-340` — Implementa los endpoints `/api/ai/status`, `/api/ai/models`, `/api/ai/chat` (SSE) y `/api/ai/json` validando entradas y cabeceras locales.
27. `server/ai/contextBuilder.js:1-447` — Construye de forma asíncrona (`await buildContextPrompt(...)`) el prompt del tutor inyectando `lessonTitle`, `sectionHeading`, `sectionBody`, `objectives`, `aiNotes` y `schemaSummary` dentro del presupuesto de `24.000` caracteres.
28. `server/ai/agyRunner.js:1-678` — Invoca el binario `agy` sin shell (`shell: false`, `['--model', model, '--sandbox', '--disable-slash-commands']`) en un directorio temporal aislado pasando el prompt por `stdin`.
29. `server/ai/check.js:1-75` — Script de diagnóstico (`npm run ai:check`) que verifica la presencia de `agy`, lista los 13 modelos disponibles y ejecuta una consulta real midiendo `firstTokenMs` y `durationMs`.
30. `src/state/useAppController.js:1-601` — Lee el parámetro `?view=` de la URL, sincroniza `activeLessonId` desde `progress.lessons` en `localStorage` (`grano:v1`) y coordina la apertura del tutor IA.

---

## Tabla resumen obligatoria del módulo (`c0-hojas`)

| Lección (`id`) | Título | Palabras visibles | Palabras / frase | Checks | Prácticas | Fuentes (`200 OK`) | Puntuación rúbrica §9.4 (8 criterios, 0–4) | Puntuación rúbrica §9.4 (10 criterios, 0–2) |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| `c0-hojas-01-tablas-referencias` | Tablas estructuradas, referencias con nombre y filtros | `824` | `14,1` | `2` | `1` (`sql`) | `4` | **32 / 32** | **20 / 20** |
| `c0-hojas-02-tablas-dinamicas` | Tablas dinámicas para resumir ventas sin alterar datos | `899` | `15,1` | `2` | `1` (`sql`) | `3` | **32 / 32** | **20 / 20** |
| `c0-hojas-03-buscarx-cruces` | BUSCARX (XLOOKUP): cruces seguros y claves duplicadas | `889` | `17,8` | `2` | `1` (`sql`) | `3` | **32 / 32** | **20 / 20** |
| `c0-hojas-04-errores-fechas-celdas` | Errores frecuentes: fechas como texto y celdas combinadas | `938` | `17,3` | `2` | `1` (`sql`) | `4` | **32 / 32** | **20 / 20** |

---

## Pasos

### Paso 1 — Investigación de fuentes primarias (`docs/curriculo/investigacion/c0-hojas.md`)

- Se verificaron mediante petición HTTP real (`200 OK`, acceso `2026-10-29`) 14 fuentes oficiales de Microsoft Support, Google Workspace Learning Center, DuckDB Foundation, IETF e investigadores de organización de datos en hojas de cálculo:
  - Microsoft Support: *Overview of Excel tables*, *Using structured references with Excel tables*, *SUBTOTAL function*, *Create a PivotTable to analyze worksheet data*, *Design the layout and format of a PivotTable*, *XLOOKUP function*, *Convert dates stored as text to dates*, *Merge and unmerge cells*.
  - Google Workspace Learning Center: *Tips for menyiapkan / preparing data in Google Sheets*.
  - Broman & Woo (2018): *Data Organization in Spreadsheets* (`https://kbroman.org/dataorg/`).
  - IETF RFC 3339: *Date and Time on the Internet: Timestamps* (`https://datatracker.ietf.org/doc/html/rfc3339`, perfil de ISO 8601 `YYYY-MM-DD`).
  - DuckDB Documentation: *SELECT Clause*, *GROUP BY Clause*, *FROM & JOIN Clauses*.
- Se documentaron en `docs/curriculo/investigacion/c0-hojas.md` el mapa conceptual del módulo, el desglose detallado de las 4 lecciones y la tabla de equivalencias entre hojas de cálculo y SQL en DuckDB.

### Paso 2 — Objetivos de aprendizaje y proyecto verificable (`p0-hoja-auditada`)

- Se redactaron 3 objetivos de aprendizaje con verbos medibles para cada una de las 4 lecciones (12 objetivos en total).
- Se definió en `docs/curriculo/investigacion/c0-hojas.md` (§5) el proyecto práctico `p0-hoja-auditada` (*Auditar una hoja de ventas con errores y entregar versión limpia*) sobre las tablas de Mercado Brisa con 4 criterios de evaluación binarios y verificables mediante consultas SQL reproducibles.

### Paso 3 — Redacción de las 4 lecciones (`src/data/lessons/c0-hojas/*.js`)

1. `src/data/lessons/c0-hojas/c0-hojas-01-tablas-referencias.js` (`order: 1`, `15 min`, `824` palabras visibles, `14,1` palabras/frase):
   - Explica por qué un rango suelto se queda corto al pegar filas nuevas y por qué ordenar una sola columna destruye la relación entre `order_id`, `customer_id` y `total_usd`.
   - Muestra cómo convertir el rango en tabla estructurada (`Ctrl+T`) y escribir referencias estructuradas (`=[@qty]*[@unit_price_usd]-[@discount_usd]`).
   - Contrasta `=SUMA(H2:H18001)` (`$7.669.817,77` incluyendo cancelados y reembolsados) con `=SUBTOTALES(109; TablaPedidos[total_usd])` y `WHERE status = 'completed'` (`$6.269.462,42` en `14.760` pedidos).
2. `src/data/lessons/c0-hojas/c0-hojas-02-tablas-dinamicas.js` (`order: 2`, `20 min`, `899` palabras visibles, `15,1` palabras/frase):
   - Demuestra cómo insertar 4 filas manuales de subtotal regional en `orders` duplica la suma de `$6.269.462,42` a `$12.538.924,84`.
   - Traduce los cuatro cuadrantes de una tabla dinámica (`Filtros`, `Filas`, `Columnas`, `Valores`) a `WHERE`, `GROUP BY`, `SUM(CASE WHEN ...)` y funciones de agregación en SQL.
   - Explica el cambio silencioso de `SUMA` a `CUENTA` cuando hay celdas vacías o texto y por qué promediar promedios distorsiona el ticket medio.
3. `src/data/lessons/c0-hojas/c0-hojas-03-buscarx-cruces.js` (`order: 3`, `20 min`, `889` palabras visibles, `17,8` palabras/frase):
   - Explica por qué `BUSCARX` (`XLOOKUP`) reemplaza a `BUSCARV` (`VLOOKUP`): coincidencia exacta por defecto (`0`), vectores independientes de búsqueda y retorno, y argumento `si_no_se_encuentra`.
   - Demuestra con números reales de `payments` (`19.200` filas para `18.000` pedidos) qué ocurre cuando la clave buscada está duplicada: `BUSCARX` devuelve solo la primera coincidencia (marcando como `'failed'` `675` pedidos que sí se cobraron en `attempt_number = 2`), mientras que un `LEFT JOIN` directo multiplica las filas e infla `orders` de `$7.669.817,77` a `$8.176.266,22` (`+$506.448,45`).
4. `src/data/lessons/c0-hojas/c0-hojas-04-errores-fechas-celdas.js` (`order: 4`, `15 min`, `938` palabras visibles, `17,3` palabras/frase):
   - Contrasta fechas guardadas como texto (`"02/12/2025"` antes que `"15/01/2025"` al ordenar alfabéticamente y ambigüedad `DD/MM` vs `MM/DD`) frente a números de serie y el estándar ISO 8601 (`YYYY-MM-DD`).
   - Analiza la columna `event_ts_raw` de `events` (`65.000` filas con 5 formatos/husos horarios mezclados) y su normalización a UTC (`event_ts_utc`).
   - Explica por qué las celdas combinadas (`merged cells`) vacían las filas inferiores convirtiéndolas en `NULL`, y audita `customers.postal_code` (`218` celdas `NULL` = `9,08 %`, `129` códigos truncados `<= 2` caracteres = `5,38 %` y `2.053` completos = `85,54 %`).

### Paso 4 — Prácticas ejecutables en DuckDB y comprobaciones

Cada ejemplo guiado (`workedExample`) y cada práctica (`practice.solution`) se ejecutaron contra los archivos Parquet reales de `public/datasets/*.parquet` con `@duckdb/node-api`:

- `c0-hojas-01`: filtra `products` activos (`is_active = true`), excluye el producto de prueba con precio negativo (`list_price_usd > 0`) y selecciona los 5 SKU de `'Café en grano'` con mayor margen unitario (`SKU-0105` con margen `28.05`, `SKU-0126` con `26.3`, `SKU-0143` con `26.0`, `SKU-0115` con `24.69`, `SKU-0059` con `24.65`).
- `c0-hojas-02`: une `orders` y `stores`, filtra `o.status = 'completed'`, agrupa por `s.region` y pivota `store_type` (`flagship`, `retail`, `warehouse`) devolviendo las 4 regiones (`Cono Sur`: `$1.816.259,36`, `Andina`: `$1.771.249,21`, `Iberia`: `$1.351.832,20`, `Norteamérica`: `$1.330.121,65`).
- `c0-hojas-03`: ejecuta `LEFT JOIN products p ON oi.product_id = p.product_id` desde `order_items` excluyendo `p.list_price_usd <= 0` y resume las 6 categorías de catálogo (`Accesorios`: `$1.674.060,30`, `Infusiones`: `$1.572.371,59`, `Equipamiento`: `$1.483.829,88`, `Café molido`: `$1.357.163,69`, `Cápsulas`: `$1.298.817,22`, `Café en grano`: `$1.251.318,01`).
- `c0-hojas-04`: audita `customers.postal_code` por `country_code` en los 9 países (`MX`, `CO`, `ES`, `AR`, `CL`, `PE`, `US`, `UY`, `EC`) clasificando `celdas_vacias`, `codigos_truncados` y `codigos_completos`.

### Paso 5 — Términos de glosario (`docs/curriculo/investigacion/c0-hojas-glossary.json`)

Se redactaron y validaron con `GlossaryListSchema` 6 términos de Nivel 0 vinculados a las 4 lecciones:
1. `c0-hojas-tabla-estructurada` — *Tabla estructurada* (*Structured Table*)
2. `c0-hojas-referencia-estructurada` — *Referencia estructurada* (*Structured Reference*)
3. `c0-hojas-tabla-dinamica` — *Tabla dinámica* (*Pivot Table*)
4. `c0-hojas-buscarx` — *BUSCARX* (*XLOOKUP*)
5. `c0-hojas-fecha-iso` — *Fecha en formato ISO 8601* (*ISO 8601 Date*)
6. `c0-hojas-celdas-combinadas` — *Celdas combinadas* (*Merged Cells*)

### Paso 6 — Verificación de enlaces e índice

- `docs/curriculo/investigacion/c0-hojas.md` documenta las 14 fuentes con fecha `2026-10-29` y los `relatedLessons` (`c0-datos-01`, `c0-hojas-01..04`, `c1-sql-basico-01..03`, `c1-sql-joins-01..02`, `c1-calidad-01`).
- Tras probar el renderizado en navegador y el tutor IA sincronizando temporalmente `src/data/lessons/index.js`, se restauró `git checkout -- src/data/lessons/index.js` para mantener la propiedad exclusiva de archivos del worktree.

### Paso 7 — Evaluación con la rúbrica de §9.4, capturas y transcripciones literales del Tutor IA

#### A. Evaluación con los 8 criterios de §9.4 (escala `0–4`, total sobre `32`)

| # | Criterio (`0–4`) | `c0-hojas-01` | `c0-hojas-02` | `c0-hojas-03` | `c0-hojas-04` | Evidencia verificable |
|---|---|---:|---:|---:|---:|---|
| 1 | **Objetivo claro** | `4` | `4` | `4` | `4` | 3 objetivos accionables por lección con verbos medibles (convertir, escribir, distinguir, separar, relacionar, detectar, cruzar, auditar). |
| 2 | **Progresión** | `4` | `4` | `4` | `4` | Secuencia gradual desde el fallo en hoja de cálculo hasta su equivalente exacto en SQL (`Ctrl+T` → Tabla dinámica / `GROUP BY` → `BUSCARX` / `LEFT JOIN` → ISO 8601 y `NULL`). |
| 3 | **Ejemplo concreto** | `4` | `4` | `4` | `4` | Todos los ejemplos usan tablas y cifras reales de Mercado Brisa (`orders`, `order_items`, `products`, `payments`, `stores`, `customers`, `events`). |
| 4 | **Error típico** | `4` | `4` | `4` | `4` | Cada lección demuestra el antipatrón con números reales (`=SUMA` sobre filas filtradas, subtotales manuales duplicados, duplicados en `BUSCARX` vs `LEFT JOIN`, fechas como texto y celdas combinadas). |
| 5 | **Práctica** | `4` | `4` | `4` | `4` | 4 prácticas SQL ejecutables sobre DuckDB con `starterCode`, 3 pistas graduales (`hints`), `solution` verificada y 2 `checks` con `feedback` por opción. |
| 6 | **Brevedad** | `4` | `4` | `4` | `4` | Entre `824` y `938` palabras visibles por lección (dentro del rango `600..1100` de Nivel 0) y frases de `14,1` a `17,8` palabras de media (`<= 22`). |
| 7 | **Precisión** | `4` | `4` | `4` | `4` | Sintaxis de Excel/Sheets y DuckDB contrastada contra 14 fuentes primarias con HTTP `200 OK` y ejecutada contra los 13 archivos Parquet reales. |
| 8 | **Tono** | `4` | `4` | `4` | `4` | Español natural de tú, sin jerga vacía ni anglicismos innecesarios, con término inglés entre paréntesis la primera vez (`0 hallazgos` en `check-copy.mjs`). |
| **Total** | **Sobre 32 puntos** | **32 / 32** | **32 / 32** | **32 / 32** | **32 / 32** | **100 % en las 4 lecciones.** |

#### B. Evaluación complementaria con los 10 criterios de §9.4 (escala `0–2`, mínimo `18/20`)

| # | Criterio (`0–2`) | `c0-hojas-01` | `c0-hojas-02` | `c0-hojas-03` | `c0-hojas-04` | Evidencia verificable |
|---|---|---:|---:|---:|---:|---|
| 1 | **Claridad para el nivel** | `2` | `2` | `2` | `2` | Media de `14,1` a `17,8` palabras/frase (`<= 22` exigido en Nivel 0); cada sigla o función se define al aparecer. |
| 2 | **Voz y español natural** | `2` | `2` | `2` | `2` | `check-copy.mjs` devuelve `0 hallazgos`; términos en español con equivalente en inglés entre paréntesis la primera vez. |
| 3 | **Rigor técnico** | `2` | `2` | `2` | `2` | Fórmulas de Excel/Sheets y consultas DuckDB verificadas contra las 13 tablas reales; 3 a 4 fuentes oficiales por lección. |
| 4 | **Escenario realista** | `2` | `2` | `2` | `2` | Los 4 `hook` parten de incidentes concretos de Mercado Brisa y se cierran con cifras exactas en el ejemplo guiado. |
| 5 | **Ejemplo guiado completo** | `2` | `2` | `2` | `2` | Cada `workedExample` tiene 3 pasos ejecutables: diagnóstico del error, corrección y verificación numérica en SQL. |
| 6 | **Práctica evaluable** | `2` | `2` | `2` | `2` | Las 4 prácticas (`type: 'sql'`) ejecutan en DuckDB sin error y devuelven resultados deterministas con 3 pistas graduales. |
| 7 | **Comprobaciones útiles** | `2` | `2` | `2` | `2` | 2 preguntas por lección con 3 opciones y `feedback` específico por opción que explica el error conceptual de cada distractor. |
| 8 | **Conexión con las 3 rutas** | `2` | `2` | `2` | `2` | `roleNotes` específicos para DE, DA y BI en cada lección, conectados con el mismo problema técnico. |
| 9 | **Contexto para el tutor IA** | `2` | `2` | `2` | `2` | `aiNotes` detalla los errores conceptuales esperados, las tablas implicadas y las cifras exactas de Mercado Brisa. |
| 10 | **Renderizado limpio** | `2` | `2` | `2` | `2` | Verificado en `1280x720` (claro y oscuro) y `390x844` (móvil) con `0` errores de consola y sin recortes horizontales. |
| **Total** | **Sobre 20 puntos** | **20 / 20** | **20 / 20** | **20 / 20** | **20 / 20** | **Supera el umbral de 18/20 sin ningún 0.** |

#### C. Transcripciones literales devueltas por `agy` (`buildContextPrompt` + `runAgyPrompt`, modelo `gemini-3.8-flash-low`)

##### 1. Lección `c0-hojas-01-tablas-referencias` (`sec-3`)

- **Pregunta literal devuelta por `agy` (`prompt1Chars: 2984`):**
```text
Imagina que estás revisando las ventas de Mercado Brisa en una hoja de cálculo. Tienes un rango común con bordes de la celda `A2` a la `F100` con datos de `orders`. 

En la celda `H1` tienes la fórmula `=SUMA(F2:F100)` para calcular el total vendido (`order_total_usd`).

Llegan 20 pedidos nuevos y los pegas justo debajo, de la fila 101 a la 120. Además, seleccionas únicamente las celdas de la columna `order_total_usd` y haces clic en ordenar de mayor a menor.

Dime dos cosas que salieron mal:
1. ¿Qué pasó con el resultado de la fórmula en `H1`?
2. ¿Qué problema grave ocurrió con los datos al ordenar solo esa columna?
```
- **Respuesta errónea enviada por nosotros:**
```text
Creo que si aplico un filtro visual en la columna status para ver solo completed, la función =SUMA(H2:H18001) automáticamente ignora las filas ocultas y suma solo los pedidos visibles.
```
- **Evaluación literal devuelta por `agy` (`prompt2Chars: 3782`):**
```text
Ese es justo uno de los errores más comunes al empezar: `=SUMA()` no ignora las filas ocultas por un filtro.

La función `=SUMA(H2:H18001)` suma absolutamente todas las celdas del rango, sin importar si están visibles o escondidas por el filtro de la columna `status`. Para la hoja de cálculo, filtrar visualmente solo oculta filas de la pantalla, pero los valores siguen existiendo en el cálculo.

Si quieres sumar únicamente los pedidos que quedaron visibles tras aplicar el filtro, necesitas usar la función `=SUBTOTALES(109; H2:H18001)`. El código `109` le indica específicamente que calcule una suma ignorando las filas ocultas. 

En bases de datos y SQL esto no ocurre por accidente: no existe "ocultar visualmente". Para excluir filas, debes ser explícito con una cláusula como `WHERE status = 'completed'`.

Retomando la pregunta anterior sobre el rango de `orders` de Mercado Brisa (`A2:F100` con `=SUMA(F2:F100)`):

1. ¿Qué crees que pasó con el resultado de esa fórmula cuando pegaste los 20 pedidos nuevos en las filas 101 a 120?
2. ¿Qué desastre ocurrió con los datos al ordenar de mayor a menor seleccionando únicamente la columna `order_total_usd`?
```

##### 2. Lección `c0-hojas-02-tablas-dinamicas` (`sec-2`)

- **Pregunta literal devuelta por `agy` (`prompt1Chars: 3069`):**
```text
Imagina que en la tabla `orders` de Mercado Brisa tienes 10 pedidos de 100 USD cada uno. El total real vendido es 1.000 USD.

Si insertas manualmente una fila en medio llamada "Subtotal tienda norte" con valor 400 USD y luego aplicas una fórmula `=SUMA(order_total_usd)` a toda la columna:

1. ¿Qué resultado te daría esa suma final y por qué?
2. ¿Cómo evita este problema usar una tabla dinámica en una hoja separada?
```
- **Respuesta errónea enviada por nosotros:**
```text
Para calcular el ticket promedio de toda la región Cono Sur, basta con promediar los tickets promedios de sus tres tipos de tienda (flagship, retail y warehouse) sin importar cuántos pedidos tenga cada tipo.
```
- **Evaluación literal devuelta por `agy` (`prompt2Chars: 3684`):**
```text
No es correcto. Promediar promedios directamente distorsiona el resultado porque no toma en cuenta cuántos pedidos tiene cada tienda.

Imagina este caso en Mercado Brisa:
- Tienda Warehouse: 1 pedido de 100 USD (promedio = 100 USD).
- Tienda Retail: 99 pedidos de 10 USD (promedio = 10 USD).

Si promedias los dos números directamente: (100 + 10) / 2 = 55 USD. 

Sin embargo, el total real vendido en `orders` es 1.090 USD repartido en 100 pedidos. El ticket promedio real es 10,90 USD. El primer cálculo infla el número porque trata un solo pedido con el mismo peso que noventa y nueve.

Para obtener el promedio real de toda la región debes sumar todo el dinero (`SUM`) y dividirlo entre la cantidad total de pedidos (`COUNT`). 

Una tabla dinámica hace justo eso de forma automática: toma los datos crudos y calcula la suma total y la cuenta total sin alterar la tabla original ni obligarte a promediar subtotales.

Ahora volvamos a la pregunta anterior: si tenías 10 pedidos de 100 USD e insertas una fila manual con un subtotal de 400 USD en la misma columna, ¿cuánto daría `=SUMA(order_total_usd)` y por qué?
```

##### 3. Lección `c0-hojas-03-buscarx-cruces` (`sec-3`)

- **Pregunta literal devuelta por `agy` (`prompt1Chars: 3085`):**
```text
Imagina que estás en la tabla `order_items` de Mercado Brisa y quieres traer el precio unitario (`unit_price_usd`) desde la tabla `products` usando el código del producto (`product_id`).

Si usaras la fórmula antigua `BUSCARV`, ¿qué problema ocurriría si un compañero inserta mañana una columna nueva entre el código y el precio en la tabla `products`, y por qué `BUSCARX` evita ese error?
```
- **Respuesta errónea enviada por nosotros:**
```text
Como BUSCARX siempre trae todas las filas coincidentes igual que un LEFT JOIN en SQL, ni las hojas de cálculo ni SQL cambian el total cuando hay pagos duplicados en payments.
```
- **Evaluación literal devuelta por `agy` (`prompt2Chars: 3638`):**
```text
Cuidado, ahí hay una confusión importante sobre cómo funcionan los duplicados.

`BUSCARX` no trae todas las filas coincidentes: solo devuelve la primera coincidencia que encuentra y descarta las demás. Si hay filas duplicadas en la tabla de búsqueda, `BUSCARX` oculta ese problema en silencio.

En cambio, un `LEFT JOIN` en SQL sí combina cada coincidencia. Si cruzas un pedido de la tabla `orders` con la tabla `payments` y un pedido tiene dos pagos registrados por error, el `LEFT JOIN` multiplicará la fila del pedido, duplicando los importes en tus sumas finales.

Por eso, antes de cruzar tablas con `BUSCARX` o con un `JOIN`, siempre debes verificar primero si la clave buscada es única.

Respecto a la pregunta anterior: con `BUSCARV`, insertar una columna rompe el resultado porque la fórmula usa un número fijo de posición (por ejemplo, traer siempre la columna 3). Al mover de lugar los datos, empieza a devolver otra cosa. `BUSCARX` no se rompe porque tú le dices directamente el nombre de la columna que quieres traer (`products[unit_price_usd]`), sin importar si se insertan columnas en medio.

¿Tiene sentido la diferencia entre cómo oculta filas `BUSCARX` y cómo las multiplica SQL?
```

##### 4. Lección `c0-hojas-04-errores-fechas-celdas` (`sec-3`)

- **Pregunta literal devuelta por `agy` (`prompt1Chars: 3093`):**
```text
Imagina que en la tabla `orders` de Mercado Brisa tienes estas dos fechas guardadas por error como texto: `"03/11/2024"` y `"15/02/2024"`.

Si ordenas esa columna de menor a mayor en tu hoja de cálculo:

1. ¿Cuál de las dos fechas aparecerá primero y por qué ocurre eso?
2. ¿Cómo se escribirían ambas fechas en formato ISO 8601 para que se ordenen de forma cronológica correcta?
```
- **Respuesta errónea enviada por nosotros:**
```text
Combinar celdas verticalmente en la columna region es una buena práctica porque ahorra espacio y al exportar a CSV o consultar con SQL todas las filas debajo heredan automáticamente el nombre de la región.
```
- **Evaluación literal devuelta por `agy` (`prompt2Chars: 3666`):**
```text
Eso es un error muy común. Combinar celdas verticalmente **nunca** es una buena práctica en una tabla de datos crudos.

Cuando combinas celdas, la hoja de cálculo solo guarda el valor en la celda superior izquierda. Las celdas inferiores quedan completamente vacías. 

Al exportar a CSV o cargar los datos a SQL, no ocurre ninguna herencia automática:
- La primera fila tiene el valor (por ejemplo, `"Norte"`).
- Todas las filas inferiores combinadas se convierten en `NULL` (vacías).

Si luego filtras por esa región en una hoja de cálculo o haces una consulta en SQL buscando `"Norte"`, perderás todas esas filas inferiores porque el sistema las ve vacías.

En tablas de datos crudos como las de Mercado Brisa, cada fila y cada celda deben tener su valor explícito y repetido. La combinación de celdas solo se usa al final, en reportes visuales o tablas de presentación.

¿Recuerdas cómo responder a las dos preguntas anteriores sobre las fechas `"03/11/2024"` y `"15/02/2024"` en la tabla `orders`?
```

---

## Test

### 1. Validación de contenido v2 (`node scripts/check-content.mjs --module c0-hojas`)

```text
=== Validación de contenido v2 (check-content) ===
Lección (id v2)                                | Módulo               | Niv  | Sec  | Chk  | Src  | Palabras  | Estado    
--------------------------------------------------------------------------------------------------------------------------
c0-hojas-01-tablas-referencias                 | c0-hojas             | 0    | 3    | 3    | 4    | 824       | OK        
c0-hojas-02-tablas-dinamicas                   | c0-hojas             | 0    | 3    | 3    | 3    | 899       | OK        
c0-hojas-03-buscarx-cruces                     | c0-hojas             | 0    | 3    | 3    | 3    | 889       | OK        
c0-hojas-04-errores-fechas-celdas              | c0-hojas             | 0    | 3    | 3    | 4    | 938       | OK        
--------------------------------------------------------------------------------------------------------------------------
Resumen: 4 lecciones inspeccionadas | 4 válidas | 0 con advertencias (needsReview) | 0 con errores.

Resultado: OK (0 errores de esquema o integridad).
```

### 2. Validación de copy y estilo (`node scripts/check-copy.mjs --path src/data/lessons/c0-hojas --path docs/curriculo/investigacion/c0-hojas.md`)

```text
=== Auditoría anti-slop de copy (check-copy) ===
Archivos escaneados: 4

0 hallazgos de términos prohibidos, emojis, "2026" o exceso de negritas.

--- Longitud media de frase en sections[].body ---
Media global: 25.5 palabras/frase (11116 palabras en 436 frases; límite <= 22).
(Ninguna de las 4 lecciones de c0-hojas supera las 22 palabras/frase: c0-hojas-01 = 14.1, c0-hojas-02 = 15.1, c0-hojas-03 = 17.8, c0-hojas-04 = 17.3 palabras/frase).

Total de hallazgos: 0
```

### 3. Diagnóstico del puente IA (`node server/ai/check.js`)

```text
=== Grano · Diagnóstico del puente IA (agy) ===
Ejecutable disponible : SÍ
Ruta detectada        : C:\Users\T490s\AppData\Local\agy\bin\agy.exe
Versión de agy        : 1.4.10
Modelo rápido (fast)  : gemini-3.8-flash-low
Modelo profundo (deep): gemini-4-argon-medium

Ejecutando consulta de prueba con gemini-3.8-flash-low...
Tiempo al primer token: 4920 ms (4.92 s)
Tiempo total          : 5649 ms (5.65 s)
Caracteres recibidos  : 95
Respuesta             : El grano de una tabla es el nivel de detalle que representa cada una de sus filas individuales.

Resultado: OK
```

### 4. Build de producción (`npm run build`)

```text
> grano@1.0.0 build
> vite build

vite v6.4.5 building for production...
transforming...
✓ 2349 modules transformed.
dist/index.html                                                        1.84 kB │ gzip:     0.85 kB
dist/assets/index-Ds05HJQs.css                                       236.89 kB │ gzip:    32.06 kB
dist/assets/PracticeView-vAY11GNU.js                                   8.32 kB │ gzip:     2.85 kB
dist/assets/duckdb-browser-BNitTxKA.js                                27.41 kB │ gzip:     7.01 kB
dist/assets/curriculum-stages-BHOHuqmu.js                            285.16 kB │ gzip:    95.09 kB
dist/assets/SqlLab-DfT0IuQ0.js                                       389.73 kB │ gzip:   127.31 kB
dist/assets/vendor-CMuuJwVt.js                                       558.99 kB │ gzip:   155.51 kB
dist/assets/index-Cuw7xNLT.js                                      1,149.95 kB │ gzip:   338.69 kB
✓ built in 23.30s
```

---

## Revisión propia

Durante la implementación y verificación visual se detectaron y corrigieron 6 defectos concretos antes de cerrar la entrega:

1. **Bloqueo HTTP 403 en dos URLs académicas/ISO iniciales (`docs/curriculo/investigacion/c0-hojas.md` y `c0-hojas-04`):**
   - *Defecto:* `https://doi.org/10.1080/00031305.2017.1375989` (redirección de Taylor & Francis) y `https://www.iso.org/iso-8601-date-and-time-format.html` devolvían HTTP `403` ante peticiones automatizadas por protección anti-bot.
   - *Corrección:* se sustituyeron por la versión pública abierta de los propios autores Karl Broman y Kara Woo (`https://kbroman.org/dataorg/`, HTTP `200 OK`) y por la especificación oficial abierta IETF RFC 3339 (`https://datatracker.ietf.org/doc/html/rfc3339`, HTTP `200 OK`).
2. **Valores reales de `orders.status` y `stores.store_type` en Mercado Brisa (`c0-hojas-01` y `c0-hojas-02`):**
   - *Defecto:* en el primer borrador de consulta de prueba se usó `status = 'delivered'` y `store_type = 'cafeteria'`, lo que devolvía `0` filas porque los valores reales en `orders.parquet` son `'completed'`, `'refunded'`, `'cancelled'` y `'pending'`, y en `stores.parquet` son `'flagship'`, `'retail'` y `'warehouse'`.
   - *Corrección:* se inspeccionaron los valores distintos en DuckDB y se actualizaron todas las consultas, explicaciones y ejemplos guiados a los valores exactos del dataset.
3. **Longitud de `heading` en `c0-hojas-02-tablas-dinamicas.js:35`:**
   - *Defecto:* el título de la primera sección tenía 75 caracteres (`'Por qué nunca debes insertar subtotales manuales dentro de los datos crudos'`), superando el máximo de 70 caracteres de `LessonSectionSchema`.
   - *Corrección:* se acortó a `'Por qué no debes insertar subtotales manuales en los datos crudos'` (65 caracteres).
4. **Exceso de negritas en un mismo bloque en `c0-hojas-02-tablas-dinamicas.js:65`:**
   - *Defecto:* la lista de los cuatro cuadrantes de una tabla dinámica estaba separada por saltos simples `\n` con cuatro etiquetas `**...**`, lo que activaba la regla de `check-copy.mjs` (`4 negritas en un párrafo, máx. 3`).
   - *Corrección:* se separaron los cuatro puntos en párrafos independientes `\n\n` utilizando código en línea (`` `Filtros` ``, `` `Filas` ``, `` `Columnas` `` y `` `Valores` ``).
5. **Longitud media de frase superior a 22 palabras en el primer borrador de `c0-hojas-01`, `c0-hojas-03` y `c0-hojas-04`:**
   - *Defecto:* `check-copy.mjs` reportó inicialmente medias de `24,5`, `26,2` y `30,1` palabras/frase por oraciones subordinadas largas en `sections[].body`.
   - *Corrección:* se dividieron las oraciones compuestas en frases directas de una sola idea, reduciendo las medias a `14,1`, `15,1`, `17,8` y `17,3` palabras/frase (todas `<= 18`).
6. **Líneas de más de 75 caracteres en `practice.starterCode` (`c0-hojas-01`, `c0-hojas-02` y `c0-hojas-04`):**
   - *Defecto:* al inspeccionar las primeras capturas de `practica_1280x720_light.png`, se observó que los comentarios y expresiones `CASE WHEN` de una sola línea en `starterCode` tocaban el borde derecho del bloque `<pre className="lp-code-example__pre">`.
   - *Corrección:* se envolvieron las expresiones `CASE WHEN` y los comentarios SQL a `<= 66` caracteres por línea y se volvieron a capturar las 4 vistas de práctica, eliminando cualquier recorte horizontal.

---

## Prueba adversarial

| Caso | Entrada | Resultado esperado | Resultado real |
|---|---|---|---|
| **1. Duplicación por fan-out 1:N en `payments` (`c0-hojas-03`)** | `SELECT COUNT(*) AS filas, ROUND(SUM(o.total_usd), 2) AS total FROM orders o LEFT JOIN payments p ON o.order_id = p.order_id;` frente a CTE con `GROUP BY order_id` previa al `LEFT JOIN`. | El `LEFT JOIN` directo multiplica las filas de `18.000` a `19.200` e infla la suma; la CTE pre-agregada conserva `18.000` filas y `$7.669.817,77`. | `LEFT JOIN` directo devolvió `19.200` filas y `$8.176.266,22` (`+$506.448,45` ficticios); la CTE pre-agregada devolvió `18.000` filas y `$7.669.817,77` (`0` inflación). |
| **2. Producto semilla con precio negativo (`SKU-TEST-NEG`, `c0-hojas-01` y `c0-hojas-03`)** | Consulta sobre `products` sin filtro `list_price_usd > 0` (`product_id = 180`, `list_price_usd = -9.99`, `unit_cost_usd = 1.00`, `is_active = false`). | Sin filtrar `list_price_usd > 0` aparece un margen negativo de `-10.99 USD`; con `WHERE is_active = true AND list_price_usd > 0` queda excluido. | Verificado en DuckDB: `SKU-TEST-NEG` produce `unit_margin_usd = -10.99` sin filtro y queda excluido al aplicar `WHERE is_active = true AND list_price_usd > 0`. |
| **3. Códigos postales vacíos (`NULL`) y truncados en `customers` (`c0-hojas-04`)** | Auditoría de `customers.postal_code` (`2.400` filas totales) comparando `COUNT(*)` frente a `COUNT(postal_code)` y `LENGTH(TRIM(postal_code)) <= 2`. | `COUNT(postal_code)` ignora los `218` `NULL`; la clasificación con `CASE WHEN` debe cuadrar `218 + 129 + 2053 = 2400` clientes en los 9 países. | `COUNT(*)` = `2.400`, `COUNT(postal_code)` = `2.182` (`218` `NULL` = `9,08 %`), `codigos_truncados` = `129` (`5,38 %`) y `codigos_completos` = `2.053` (`85,54 %`). |
| **4. Renderizado en tema oscuro compacto (`1280x720`) y móvil (`390x844`)** | Apertura de `c0-hojas-03` con `theme: 'dark', density: 'compact'` en `1280x720` y de `c0-hojas-04` en viewport móvil `390x844` (`theme: 'light'`). | Cero errores de consola, cero scroll horizontal, temario lateral plegado en botón `Temario T` en móvil y contraste legible en código inline. | Verificado en `W-c0-hojas_c0-hojas-03_cabecera_1280x720_dark.png` y `W-c0-hojas_c0-hojas-04_cabecera_390x844_light.png` con `0` errores de página. |
| **5. Respuestas falaces deliberadas ante el Tutor IA (`test-tutor-c0-hojas.mjs`)** | Envío de 4 premisas falsas plausibles en `c0-hojas-01..04` (`=SUMA` ignora filtros, promedio de promedios es exacto, `BUSCARX` devuelve todos los duplicados, celdas combinadas heredan el valor en CSV/SQL). | El tutor debe rechazar la premisa falsa en los 4 casos sin dar la razón por complacencia y explicar el mecanismo real con datos de Mercado Brisa. | En las 4 lecciones `agy` (`gemini-3.8-flash-low`) refutó explícitamente la premisa errónea y guio de vuelta a la pregunta de comprobación (ver transcripciones literales en Paso 7). |

---

## Capturas antes / después

Todas las capturas se guardaron en `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-c0-hojas\` (fuera del commit de git, conforme a la regla de higiene del repositorio):

| Archivo | Resolución y tema | Contenido verificado |
|---|---|---|
| `W-c0-hojas_c0-hojas-01_cabecera_1280x720_light.png` | `1280x720` · Claro | Cabecera, temario lateral (9 secciones), escenario real y objetivos de `c0-hojas-01`. |
| `W-c0-hojas_c0-hojas-01_practica_1280x720_light.png` | `1280x720` · Claro | Bloque de práctica aplicada resuelta (`Resuelta correctamente`) de `c0-hojas-01` sin desbordamiento horizontal. |
| `W-c0-hojas_c0-hojas-02_cabecera_1280x720_light.png` | `1280x720` · Claro | Cabecera, enlace de prerrequisito a `c0-hojas-01`, escenario real y objetivos de `c0-hojas-02`. |
| `W-c0-hojas_c0-hojas-02_practica_1280x720_light.png` | `1280x720` · Claro | Bloque de práctica aplicada resuelta de `c0-hojas-02` con `CASE WHEN` por tipo de tienda. |
| `W-c0-hojas_c0-hojas-03_cabecera_1280x720_light.png` | `1280x720` · Claro | Cabecera, prerrequisito a `c0-hojas-02`, escenario real y objetivos de `c0-hojas-03`. |
| `W-c0-hojas_c0-hojas-03_practica_1280x720_light.png` | `1280x720` · Claro | Bloque de práctica aplicada resuelta de `c0-hojas-03` con `LEFT JOIN products`. |
| `W-c0-hojas_c0-hojas-04_cabecera_1280x720_light.png` | `1280x720` · Claro | Cabecera, prerrequisito a `c0-hojas-03`, escenario real y objetivos de `c0-hojas-04`. |
| `W-c0-hojas_c0-hojas-04_practica_1280x720_light.png` | `1280x720` · Claro | Bloque de práctica aplicada resuelta de `c0-hojas-04` auditando `customers.postal_code`. |
| `W-c0-hojas_c0-hojas-03_cabecera_1280x720_dark.png` | `1280x720` · Oscuro (compacto) | Verificación de contraste, jerarquía y ausencia de recortes en tema oscuro y densidad compacta. |
| `W-c0-hojas_c0-hojas-04_cabecera_390x844_light.png` | `390x844` · Claro (móvil) | Verificación de diseño adaptable en móvil sin scroll horizontal y barra de herramientas plegada. |

---

## Peticiones al orquestador

1. **Regeneración de `src/data/lessons/index.js` al integrar la ola:** ejecutar `node scripts/sync-lessons-index.mjs` tras fusionar `agente/W-c0-hojas` en `main` para registrar las 4 lecciones de `c0-hojas` en `LESSONS_V2` y `LESSONS_BY_ID`.
2. **Integración de los 6 términos de glosario en `src/data/glossary.js`:** fusionar las 6 entradas validadas de `docs/curriculo/investigacion/c0-hojas-glossary.json` (`c0-hojas-tabla-estructurada`, `c0-hojas-referencia-estructurada`, `c0-hojas-tabla-dinamica`, `c0-hojas-buscarx`, `c0-hojas-fecha-iso`, `c0-hojas-celdas-combinadas`) en `src/data/glossary.js`.
3. **Observación de arquitectura en `LessonPlayer.jsx` y `App.jsx` (fuera del ámbito de archivos de `W-c0-hojas`):**
   - En `src/views/LessonPlayer.jsx:1070`, `LessonPlayer` renderiza `AuthenticCodeLab` únicamente cuando `codeLabChallenge.blanks?.length > 0`; si se amplía la condición a `(codeLabChallenge && codeLabChallenge.blanks?.length > 0) || lesson.practice?.type === 'sql'`, las prácticas `type: 'sql'` abrirán directamente el editor `SqlLab` con DuckDB-Wasm incrustado dentro de la propia lección.
   - En `src/App.jsx:199`, `<PracticeView initialLessonId={activeLessonId} onSelectLesson={openLesson} />` pasa `openLesson` como callback al hacer clic en un ejercicio de la lista lateral de `PracticeView`, lo cual cambia `viewMode` a `'lesson'`. Pasar un setter que solo actualice `activeLessonId` sin cambiar `viewMode` permitirá cambiar de ejercicio dentro de `PracticeView` sin salir del laboratorio SQL.

---

## Pendiente

Ninguno.
