# W-c0-hojas — Hojas de cálculo con criterio (Nivel 0 · Tronco común)

- **Agente:** `W-c0-hojas`
- **Fase y ola:** Fase 3 · Ola A (módulos de Nivel 0, paralelos)
- **Rama y worktree:** `agente/W-c0-hojas` en `C:\Users\T490s\Desktop\Proyectos\ING-W-c0-hojas`
- **Puerto asignado:** `5202`
- **Fecha:** `2026-10-29`

---

## Inicio

Lectura íntegra de `PLAN_GEMINI_4_ARGON.md` (§0–§11 y Apéndices A, B, C, D y E) y de los archivos de arquitectura, esquemas, validadores y vistas del repositorio:

1. `PLAN_GEMINI_4_ARGON.md:1-1474` — Principios de voz en español con término inglés entre paréntesis la primera vez (§2.3, §9.1), dataset unificado Mercado Brisa con 13 tablas y anomalías sembradas (§6.3), modelo de datos de lección v2 y glosario (§6.4, §6.5), proceso de creación en 7 pasos (§9.2), plantilla de lección (§9.3), rúbrica de calidad de 10 criterios con mínimo 18/20 y ningún 0 (§9.4), protocolo de git worktrees (Apéndice B) y plantilla/checklist de reporte (Apéndices D.2 y D.3).
2. `src/data/catalog/modules.js:18-45` — Definición canónica del módulo `c0-hojas` (`title: 'Hojas de cálculo con criterio'`, `track: 'core'`, `level: 0`, `prerequisites: ['c0-datos']`, `projectId: 'p0-hoja-auditada'`) con sus 4 lecciones planeadas:
   - `c0-hojas-01`: *Tablas estructuradas, referencias con nombre y filtros* (`15 min`)
   - `c0-hojas-02`: *Tablas dinámicas para resumir ventas sin alterar datos* (`20 min`)
   - `c0-hojas-03`: *BUSCARX (XLOOKUP): cruces seguros y claves duplicadas* (`20 min`)
   - `c0-hojas-04`: *Errores frecuentes: fechas como texto y celdas combinadas* (`15 min`)
3. `src/data/schema/lesson.js:1-141` — Esquema Zod `LessonSchema`: `id` kebab-case, `moduleId`, `level` (`0..4`), `order` (`1..20`), `title` (`8..90` caracteres), `minutes` (`8..45`), `tracks` (`['core']`), `prerequisites`, `objectives` (exactamente 3), `hook` (`80..600` caracteres), `sections` (`3..6`, con `heading` `4..70` caracteres y `body` `>= 120` caracteres), `workedExample` (`2..5` pasos con código), `practice` (`type: 'sql'`, `starterCode`, `solution`, `hints` `1..3`), `checks` (`2..3` preguntas con `3..4` opciones, 1 correcta y `feedback` por opción), `roleNotes` (`de`, `da`, `bi`), `summary` (`3..5` puntos), `sources` (`>= 2` con `url` HTTPS y `accessed` `YYYY-MM-DD`) y `aiNotes`.
4. `src/data/schema/glossary.js:1-38` — Esquema Zod `GlossaryTermSchema` y `GlossaryListSchema` (`id`, `term`, `en`, `category`, `level`, `definition`, `example`, `relatedLessons`, `relatedTerms`).
5. `public/datasets/README.md:1-106` y `public/datasets/schema.json:1-420` — Esquema real de las 13 tablas Parquet de Mercado Brisa (semilla `19870315`): `orders` (`18.000` filas, `status` en `'completed'`, `'refunded'`, `'cancelled'`, `'pending'`), `order_items` (`42.000` filas), `products` (`180` filas, incluye `product_id = 180` con `sku = 'SKU-TEST-NEG'` y `list_price_usd = -9.99`), `payments` (`19.200` filas con reintentos `attempt_number = 2` y 450 webhooks duplicados), `stores` (`14` tiendas en 4 regiones y 3 `store_type`), `customers` (`2.400` filas con `218` `postal_code IS NULL` y `129` códigos truncados `<= 2` caracteres) y `events` (`65.000` filas con `event_ts_raw` en 5 formatos/zonas horarias).
6. `scripts/check-content.mjs:1-430`, `scripts/check-copy.mjs:1-315` y `scripts/sync-lessons-index.mjs:1-145` — Validadores de esquema e integridad curricular (`--module c0-hojas`), detector de palabras prohibidas, longitud media de frase (`<= 22` palabras/frase en Nivel 0) y límite de negritas por párrafo (`<= 3`).
7. `src/views/LessonPlayer.jsx:1-1532`, `src/views/lesson/normalizeLessonV2.js:1-265`, `src/views/PracticeView.jsx:1-335`, `src/components/AuthenticCodeLab.jsx:1-372` y `src/lab/SqlLab.jsx:1-538` — Flujo de renderizado de lecciones v2, ejemplo guiado, tarjetas de comprobación, bloque de práctica y laboratorio DuckDB-Wasm.
8. `server/ai/contextBuilder.js:1-447` y `server/ai/agyRunner.js:1-678` — Construcción asíncrona de prompts contextuales (`buildContextPrompt`) e invocación sin shell de `agy` (`runAgyPrompt`).

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

### Paso 7 — Revisión contra la rúbrica (§9.4), capturas y prueba del Tutor IA

#### Autoevaluación con la rúbrica de §9.4 (escala 0–2 por criterio, mínimo 18/20)

| # | Criterio | `c0-hojas-01` | `c0-hojas-02` | `c0-hojas-03` | `c0-hojas-04` | Evidencia verificable |
|---|---|---:|---:|---:|---:|---|
| 1 | **Claridad para el nivel** | 2 | 2 | 2 | 2 | Media de `14,1` a `17,8` palabras/frase (`<= 22` exigido en Nivel 0); cada sigla o función se define al aparecer. |
| 2 | **Voz y español natural** | 2 | 2 | 2 | 2 | `check-copy.mjs` devuelve `0 hallazgos`; términos en español con equivalente en inglés entre paréntesis la primera vez. |
| 3 | **Rigor técnico** | 2 | 2 | 2 | 2 | Fórmulas de Excel/Sheets y consultas DuckDB verificadas contra las 13 tablas reales; al menos 2 fuentes oficiales por lección. |
| 4 | **Escenario realista** | 2 | 2 | 2 | 2 | Los 4 `hook` parten de incidentes concretos de Mercado Brisa y se cierran con cifras exactas en el ejemplo guiado. |
| 5 | **Ejemplo guiado completo** | 2 | 2 | 2 | 2 | Cada `workedExample` tiene 3 pasos ejecutables: diagnóstico del error, corrección y verificación numérica en SQL. |
| 6 | **Práctica evaluable** | 2 | 2 | 2 | 2 | Las 4 prácticas (`type: 'sql'`) ejecutan en DuckDB sin error y devuelven resultados deterministas con 3 pistas graduales. |
| 7 | **Comprobaciones útiles** | 2 | 2 | 2 | 2 | 2 preguntas por lección con 3 opciones y `feedback` específico por opción que explica el error conceptual de cada distractor. |
| 8 | **Conexión con las 3 rutas** | 2 | 2 | 2 | 2 | `roleNotes` específicos para DE, DA y BI en cada lección, conectados con el mismo problema técnico. |
| 9 | **Contexto para el tutor IA** | 2 | 2 | 2 | 2 | `aiNotes` detalla los errores conceptuales esperados, las tablas implicadas y las cifras exactas de Mercado Brisa. |
| 10 | **Renderizado limpio** | 2 | 2 | 2 | 2 | Verificado en `1280x720` (claro y oscuro) y `390x844` (móvil) con `0` errores de consola y sin recortes horizontales. |
| **Total** | **Puntuación sobre 20** | **20/20** | **20/20** | **20/20** | **20/20** | **Supera el umbral de 18/20 sin ningún 0.** |

#### Verificación del Tutor IA en las 4 lecciones (`buildContextPrompt` + `runAgyPrompt`)

Se probó en cada lección el flujo real del tutor (`server/ai/contextBuilder.js` + `server/ai/agyRunner.js` con el modelo `gemini-3.8-flash-low`), pidiendo primero `"Hazme una pregunta para comprobar si lo entendí"` y enviando después una respuesta equivocada a propósito:

1. **`c0-hojas-01-tablas-referencias` (`sec-3`)**
   - **Pregunta generada por el tutor:** plantea un rango `A2:F100` de `orders` en Mercado Brisa con `=SUMA(F2:F100)` al que se pegan 20 pedidos en las filas 101–120 y se ordena únicamente la columna de importes.
   - **Respuesta errónea enviada:** *"Creo que si aplico un filtro visual en la columna status para ver solo completed, la función =SUMA(H2:H18001) automáticamente ignora las filas ocultas y suma solo los pedidos visibles."*
   - **Detección del error por el tutor:** corrigió de inmediato que `=SUMA()` suma todas las celdas del rango aunque estén ocultas por un filtro visual, explicó que para sumar solo filas visibles se requiere `=SUBTOTALES(109; H2:H18001)` y lo contrastó con `WHERE status = 'completed'` en SQL.
2. **`c0-hojas-02-tablas-dinamicas` (`sec-2`)**
   - **Pregunta generada por el tutor:** plantea 10 pedidos de 100 USD en `orders` (total 1.000 USD) donde alguien inserta una fila manual `"Subtotal tienda norte"` de 400 USD y aplica `=SUMA()` a la columna.
   - **Respuesta errónea enviada:** *"Para calcular el ticket promedio de toda la región Cono Sur, basta con promediar los tickets promedios de sus tres tipos de tienda (flagship, retail y warehouse) sin importar cuántos pedidos tenga cada tipo."*
   - **Detección del error por el tutor:** detectó el error de promediar promedios, construyó un contraejemplo numérico en Mercado Brisa (1 pedido de 100 USD en Warehouse frente a 99 pedidos de 10 USD en Retail: promedio simple 55 USD frente al promedio ponderado real de 10,90 USD) y explicó que la tabla dinámica calcula `SUM / COUNT` sobre los datos crudos.
3. **`c0-hojas-03-buscarx-cruces` (`sec-3`)**
   - **Pregunta generada por el tutor:** pregunta qué ocurre en `order_items` al traer `unit_price_usd` desde `products` con `BUSCARV` si alguien inserta una columna intermedia, y cómo lo evita `BUSCARX`.
   - **Respuesta errónea enviada:** *"Como BUSCARX siempre trae todas las filas coincidentes igual que un LEFT JOIN en SQL, ni las hojas de cálculo ni SQL cambian el total cuando hay pagos duplicados en payments."*
   - **Detección del error por el tutor:** señaló la confusión entre ambos motores: explicó que `BUSCARX` devuelve únicamente la primera coincidencia y oculta las demás en silencio, mientras que un `LEFT JOIN` en SQL multiplica las filas del pedido por cada pago repetido en `payments`, inflando las sumas finales.
4. **`c0-hojas-04-errores-fechas-celdas` (`sec-3`)**
   - **Pregunta generada por el tutor:** plantea dos fechas guardadas como texto en `orders` (`"03/11/2024"` y `"15/02/2024"`) y pregunta cuál aparece primero al ordenarlas como texto y cómo se escriben en ISO 8601.
   - **Respuesta errónea enviada:** *"Combinar celdas verticalmente en la columna region es una buena práctica porque ahorra espacio y al exportar a CSV o consultar con SQL todas las filas debajo heredan automáticamente el nombre de la región."*
   - **Detección del error por el tutor:** corrigió que combinar celdas solo conserva el valor en la celda superior izquierda y convierte las celdas inferiores en `NULL` al exportar a CSV o SQL, provocando la pérdida de esas filas al filtrar o agrupar por región.

---

## Test

1. **Validación de esquema e integridad curricular del módulo (`check-content.mjs`):**
   - Comando: `node scripts/check-content.mjs --module c0-hojas`
   - Resultado: `Lecciones verificadas: 4 · 0 con errores · 0 con advertencias · Resultado: OK (0 errores de esquema o integridad)` (código de salida `0`).
2. **Validación de estilo, palabras prohibidas y longitud de frase (`check-copy.mjs`):**
   - Comando: `node scripts/check-copy.mjs --path src/data/lessons/c0-hojas --path docs/curriculo/investigacion/c0-hojas.md`
   - Resultado: `Archivos escaneados: 5 · Lecciones analizadas: 22 · Total de hallazgos: 0` (código de salida `0`). Ninguna de las 4 lecciones de `c0-hojas` aparece en el aviso informativo de `> 22 palabras/frase` (`14,1`, `15,1`, `17,8` y `17,3` palabras/frase).
3. **Validación del esquema de glosario (`GlossaryListSchema`):**
   - Comando: validación con `GlossaryListSchema.safeParse` sobre `docs/curriculo/investigacion/c0-hojas-glossary.json`.
   - Resultado: `success: true`, `6` términos válidos (código de salida `0`).
4. **Verificación de consultas SQL contra Parquet en DuckDB (`@duckdb/node-api`):**
   - Se ejecutaron las 12 consultas de `workedExample.steps` y las 4 consultas de `practice.solution` sobre las vistas Parquet de `public/datasets/*.parquet`. Todas ejecutaron sin errores y devolvieron las filas esperadas.
5. **Verificación del puente de IA y tutor contextual (`ai:check` y `test-tutor-c0-hojas.mjs`):**
   - Comando: `node server/ai/check.js` → `Resultado: OK` (`agy` v1.4.10, primer token en `4,92 s`).
   - Comando: `node test-tutor-c0-hojas.mjs` → `Command exited with code 0` en las 4 lecciones.
6. **Build de producción (`npm run build`):**
   - Comando: `npm run build` (`vite build`) en `C:\Users\T490s\Desktop\Proyectos\ING-W-c0-hojas`.
   - Resultado: compilación limpia sin errores (código de salida `0`).

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

1. **Verificación contra duplicación por fan-out 1:N (`c0-hojas-03`):**
   - Se probó cruzar `orders` (`18.000` filas) directamente con `payments` (`19.200` filas) sin pre-agregar por `order_id`. El `LEFT JOIN` directo produjo `19.200` filas y sumó `$8.176.266,22` (`+$506.448,45` ficticios), mientras que la CTE pre-agregada (`GROUP BY order_id`) preservó exactamente las `18.000` filas y el total real de `$7.669.817,77`.
2. **Verificación del SKU negativo sembrado (`product_id = 180`, `list_price_usd = -9.99`):**
   - Se verificó qué ocurre en `c0-hojas-01` y `c0-hojas-03` si no se filtra `list_price_usd > 0` o `is_active = true`: el producto de prueba `SKU-TEST-NEG` distorsiona los promedios de catálogo y genera márgenes negativos (`-10.99 USD`). Ambas prácticas exigen filtrar explícitamente `list_price_usd > 0`.
3. **Verificación de códigos postales nulos y truncados en `customers` (`c0-hojas-04`):**
   - Se verificó que `COUNT(postal_code)` devuelve `2.182` en lugar de `2.400` (ignorando las `218` celdas `NULL`) y que existen `129` códigos truncados de longitud `<= 2` caracteres. La consulta de práctica usa `CASE WHEN postal_code IS NULL` y `LENGTH(TRIM(postal_code)) <= 2` para que la suma de las tres columnas (`218 + 129 + 2053 = 2400`) cuadre en los 9 países.
4. **Inspección visual en tema oscuro (`1280x720` compact) y móvil (`390x844` light):**
   - Se verificó que los encabezados, migas de pan, bloques de escenario real, objetivos y bloques de código en línea no sufren desbordamiento horizontal ni pérdida de contraste ni en tema oscuro compacto (`W-c0-hojas_c0-hojas-03_cabecera_1280x720_dark.png`) ni en viewport móvil de `390px` (`W-c0-hojas_c0-hojas-04_cabecera_390x844_light.png`).
5. **Concurrencia y respuestas falaces ante el Tutor IA (`test-tutor-c0-hojas.mjs`):**
   - Se enviaron 4 afirmaciones falsas plausibles al tutor IA (que `=SUMA()` ignora filas filtradas, que el promedio de promedios es exacto, que `BUSCARX` devuelve todas las filas duplicadas igual que `LEFT JOIN`, y que combinar celdas hereda el valor hacia abajo en CSV/SQL). En los 4 casos el tutor refutó la afirmación con ejemplos de Mercado Brisa sin aceptar la premisa errónea.

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
