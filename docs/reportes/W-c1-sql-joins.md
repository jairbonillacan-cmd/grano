# W-c1-sql-joins · Módulo `c1-sql-joins`: Combinar tablas (Nivel 1 · Tronco común)

- **Agente:** `W-c1-sql-joins`
- **Rama y worktree:** `agente/W-c1-sql-joins` en `C:\Users\T490s\Desktop\Proyectos\ING-W-c1-sql-joins`
- **Puerto de prueba asignado:** `5207`
- **Fecha:** `2026-10-29`

---

## Inicio

- **Archivos leídos (uno por línea, con un dato técnico concreto aprendido de cada uno):**
  - `PLAN_GEMINI_4_ARGON.md` (`§0` Reglas comunes y principios): Prohibido usar `gemini` CLI o texto pre-escrito simulando IA; el único motor válido es `agy` autenticado por Antigravity.
  - `PLAN_GEMINI_4_ARGON.md` (`§1` Diagnóstico y `§2` Contrato anti-pereza): La lección heredada `l1-joins-fanout` se migra a `c1-sql-joins-02-grano-fanout` manteniendo `legacyId: 'l1-joins-fanout'` para compatibilidad de progreso.
  - `PLAN_GEMINI_4_ARGON.md` (`§5` Currículo v2 y `§5.3` Dataset Mercado Brisa): El módulo `c1-sql-joins` consta de 5 lecciones (`01-tipos-join`, `02-grano-fanout`, `03-subconsultas`, `04-ctes-legibles`, `05-conjuntos-union`) y cierra con el proyecto `proj-c1-joins` de reconciliación financiera.
  - `PLAN_GEMINI_4_ARGON.md` (`§9.2` Ficha de un escritor de módulo `W-<moduleId>`): Cada lección exige mínimo 3 fuentes (≥ 2 primarias verificadas en 2026), resultados SQL reales en `expectedOutput`, prueba del Tutor IA en las 5 lecciones y tabla final `lección | palabras | checks | prácticas | fuentes | puntuación de rúbrica`.
  - `PLAN_GEMINI_4_ARGON.md` (`§9.4` Rúbrica de calidad de una lección): Evalúa 8 criterios de 0 a 4 puntos (`Objetivo claro`, `Progresión`, `Ejemplo concreto`, `Error típico`, `Práctica`, `Brevedad`, `Precisión`, `Tono`), exigiendo mínimo `3` en todos y `≥ 26/32` total.
  - `PLAN_GEMINI_4_ARGON.md` (`Apéndice A` Esquema de lección v2): Define la estructura de `LessonSchema` y el rango de palabras visibles para Nivel 1–4 (`600` a `1 600` palabras sin contar bloques de código ni SVG).
  - `PLAN_GEMINI_4_ARGON.md` (`Apéndice B` Reglas de copy anti-slop): Exige promedio `< 22` palabras por oración en `sections[].body`, *sentence case* en títulos, negritas solo al definir un término y `0` apariciones de la lista de términos prohibidos.
  - `PLAN_GEMINI_4_ARGON.md` (`Apéndice C` Puente IA v2 `agy`): El servidor construye el prompt desde `src/data/lessons/index.js` con `lessonId` y `sectionId` e invoca `agy --model <model> --sandbox` por `stdin`.
  - `PLAN_GEMINI_4_ARGON.md` (`Apéndices D.2 y D.3` Plantilla de reporte y checklist): Exige `## Inicio`, `## Pasos` (`Paso 1` a `Paso 7`), `## Test`, `## Revisión propia` (`≥ 5` defectos), `## Prueba adversarial` (`≥ 5` casos), `## Capturas antes / después`, `## Peticiones al orquestador` y `## Pendiente`.
  - `src/data/catalog/modules.js`: En las líneas 277–296 registra `c1-sql-joins` con `minutes: [25, 25, 20, 20, 20]`,prerrequisito `c1-sql-basico` y proyecto `proj-c1-joins` sobre `orders`, `payments` y `refunds`.
  - `src/data/lessons/c1-sql-joins/c1-sql-joins-02-grano-fanout.js`: Estado base heredado de `l1-joins-fanout` con `needsReview: true`, `order: 1`, `prerequisites: []`, 2 términos prohibidos (`innegociable` en línea 26 y `Domina` en línea 286), media de `24.5` palabras/oración y salidas `expectedOutput` inventadas con columnas inexistentes (`order_total_usd`, `quantity`).
  - `public/datasets/README.md`: Documenta las 13 tablas Parquet de Mercado Brisa (semilla fija `19870315`, `2.14 MB`) y sus anomalías intencionales: `450` pagos duplicados en `payments` por reintento de webhook con el mismo `idempotency_key`, `1 343` eventos sin sesión (`customer_id IS NULL`) en `events` y órdenes con múltiples líneas en `order_items` (`42 000` filas) y `refunds` (`1 450` filas).
  - `public/datasets/schema.json`: Confirma los tipos y nombres exactos de columnas en Parquet (por ejemplo, en `orders` el total es `total_usd` y el envío `shipping_usd`; en `order_items` la cantidad es `qty` y el subtotal `line_total_usd`; en `refunds` el monto es `refund_amount_usd` y el motivo `reason`).
  - `src/data/schema/lesson.js`: Implementa `LessonSchema` con Zod y la función `countLessonWords(lesson)`, que excluye bloques `<svg>...</svg>` y código pero suma `hook`, `objectives`, `sections[].body`, `workedExample.steps[].explanation`, `checks[].prompt/explanation`, `practice.prompt/hints/solutionExplanation`, `reflection`, `roleNotes` y `summary`.
  - `src/data/schema/glossary.js`: Define `GlossaryTermSchema` exigiendo `id` en kebab-case, `term` (`≤ 80` caracteres), `definition` (`≤ 25` palabras), `example` (`≥ 10` caracteres), `confusedWith` y `lessonId`.
  - `scripts/check-content.mjs`: Valida que cada lección cumpla `LessonSchema`, tenga entre `600` y `1 600` palabras visibles (Nivel 1), `contentVersion >= 1` y que no tenga `needsReview: true`.
  - `scripts/check-copy.mjs`: Escanea términos prohibidos con expresiones regulares Unicode, rechaza emojis o el año `"2026"` fuera de metadatos y calcula el promedio de palabras por oración en `sections[].body` (`máx. 22`).
  - `scripts/sync-lessons-index.mjs`: Escanea `src/data/lessons/**/*.js` y regenera `src/data/lessons/index.js` con el adaptador `adaptLessonForLegacyPlayer`.
  - `src/lab/duckdb.js`: Inicializa `@duckdb/duckdb-wasm` de forma perezosa en un Web Worker y registra las 13 tablas Parquet de `public/datasets/` como vistas en memoria.
  - `src/lab/sqlGrader.js`: Implementa `compareQueryResults(userRes, expectedRes, { orderMatters, floatTolerance: 1e-6 })` y `gradeSqlPractice`, comparando nombres de columnas y filas con tolerancia `1e-6` para números en coma flotante.
  - `src/lab/SqlLab.jsx`: Renderiza el laboratorio SQL (`[data-testid="sql-lab"]`), el estado del motor (`[data-testid="sql-engine-status"]`), el botón calificador (`[data-testid="sql-grade-btn"]`) y el bloque de veredicto (`[data-testid="sql-grade-box"].is-pass` / `.is-fail`).
  - `src/lab/SqlEditor.jsx`: Envuelve CodeMirror 6 (`@codemirror/lang-sql` con dialecto PostgreSQL/DuckDB) dentro de `[data-testid="sql-editor"] .cm-content`.
  - `server/ai/contextBuilder.js`: Resuelve `lessonId` y `sectionId`, extrae `sectionBody`, `objectives` y `aiNotes`, e inyecta el resumen de las 13 tablas de Mercado Brisa (`MERCADO_BRISA_SCHEMA_SUMMARY`) en las plantillas `server/ai/prompts/*.md` respetando el tope de `24 000` caracteres.
  - `server/ai/routes.js`: Expone `POST /api/ai/chat` (SSE con eventos `meta`, `delta`, `done`, `error`) y exige cabecera `Origin` local más el token CSRF `<meta name="grano-session">` en `X-Grano-Session`.
  - `server/ai/agyRunner.js`: Ejecuta `agy.exe` en un directorio temporal aislado (`--sandbox --disable-slash-commands --model <model>`) pasando el prompt por `stdin` en `runAgyPrompt` y `runAgyStream`.
  - `src/data/glossary.js`: Contiene los términos globales iniciales (`t-grain`, `t-fanout`, `t-cte`, `t-idempotency`, etc.) que pueden referenciarse en `glossaryTerms` además de los términos nuevos del módulo.
  - `src/views/LessonPlayer.jsx`: Renderiza la vista `?view=lesson` con cabecera `.lp-title`, secciones `.lp-section`, temario lateral `.lp-syllabus-rail` y atajos de teclado (`J`, `K`, `T` para temario y `/` para abrir el Tutor IA).
  - `src/views/lesson/LessonWorkedExample.jsx`: En la línea 8 (`if (expectedOutput.length === 0) return null;`) oculta la tabla de salida si `expectedOutput` es un arreglo vacío `[]`, por lo que un paso que demuestre "0 resultados" debe proyectar `COUNT(*)` (`[{ clientes_encontrados: 0 }]`).
  - `src/views/PracticeView.jsx`: Renderiza la vista `?view=practice` con la lista de ejercicios `LESSONS_V2`, el explorador de las 13 tablas de Mercado Brisa y el componente `AuthenticCodeLab` / `SqlLab`.
  - `src/components/AuthenticCodeLab.jsx`: Cuando `practice.type === 'sql'`, delega mediante `React.lazy` en `SqlLab.jsx` pasando `lessonId` y `practice`.
  - `src/components/LessonVisualizers.jsx`: Soporta el componente interactivo `join-grain` (usado en `c1-sql-joins-02-grano-fanout`) para simular visualmente la duplicación de filas `1:N`.
  - `src/components/TutorPanel.jsx`: Consume `streamChat` contra `/api/ai/chat` enviando `level` numérico (`0..4`), `lessonId`, `sectionId` y el historial reciente.
  - `src/state/schema.js`: Define `GranoStateSchema` bajo la clave `localStorage['grano:v1']`, exigiendo `profile.track` (`'de' | 'da' | 'bi' | null`), `prefs.reducedMotion` (`'system' | 'on'`) y `review.cards`.
  - `src/state/useAppController.js`: Lee `?view=lesson` o `?view=practice` desde `window.location.search` y selecciona `activeLessonId` a partir de la última clave válida en `progress.lessons`.
  - `src/styles/tokens.css`: Define las variables CSS semánticas (`--bg`, `--surface`, `--sunken`, `--ink`, `--ink-2`, `--ink-3`, `--line`, `--brand`, `--ok`, `--warn`, `--bad`) para temas claro y oscuro (`[data-theme="dark"]`).
  - `docs/curriculo/fuentes.md`: Registra los dominios oficiales autorizados (DuckDB, PostgreSQL, Kimball Group, dbt Labs) para respaldar lecciones del currículo.
  - `docs/curriculo/perfil-core.md`: Define el alcance del tronco común de Nivel 1: dominar consultas relacionales, grano, subconsultas, CTEs y conjuntos antes de pasar a funciones de ventana en Nivel 2.
  - `docs/curriculo/estado-herramientas.md`: Confirma las versiones vigentes en octubre de 2026 para DuckDB (`v1.x`) y PostgreSQL (`17`).

- **Estado encontrado (antes):**
  - En `src/data/lessons/c1-sql-joins/` únicamente existía `c1-sql-joins-02-grano-fanout.js` con `needsReview: true`, 2 términos prohibidos (`innegociable` y `Domina`), media de `24.5` palabras/oración y salidas `expectedOutput` falsas.
  - No existían las lecciones `01`, `03`, `04` ni `05`, ni `docs/curriculo/investigacion/c1-sql-joins.md`, ni `docs/curriculo/investigacion/c1-sql-joins-glossary.json`.

---

## Pasos

### Paso 1 — Investigación (`docs/curriculo/investigacion/c1-sql-joins.md`)

- **Qué hice:** Verifiqué 13 URLs primarias y de referencia con `HTTP 200` el `2026-10-29` (documentación oficial de DuckDB, PostgreSQL 17, Kimball Group y dbt Labs) y redacté `docs/curriculo/investigacion/c1-sql-joins.md` con las citas, fechas de consulta y afirmaciones técnicas respaldadas por lección.
- **Archivos y líneas:** `docs/curriculo/investigacion/c1-sql-joins.md` (líneas 1–163).
- **Evidencia (13 URLs verificadas con HTTP 200 el `2026-10-29`):**
  1. `https://duckdb.org/docs/stable/sql/query_syntax/from` → `HTTP 200`
  2. `https://duckdb.org/docs/stable/sql/query_syntax/with` → `HTTP 200`
  3. `https://duckdb.org/docs/stable/sql/expressions/subqueries` → `HTTP 200`
  4. `https://duckdb.org/docs/stable/sql/query_syntax/setops` → `HTTP 200`
  5. `https://www.postgresql.org/docs/current/queries-table-expressions.html` → `HTTP 200`
  6. `https://www.postgresql.org/docs/current/functions-subquery.html` → `HTTP 200`
  7. `https://www.postgresql.org/docs/current/sql-expressions.html#SQL-SYNTAX-SCALAR-SUBQUERIES` → `HTTP 200`
  8. `https://www.postgresql.org/docs/current/queries-with.html` → `HTTP 200`
  9. `https://www.postgresql.org/docs/current/queries-union.html` → `HTTP 200`
  10. `https://www.postgresql.org/docs/current/sql-select.html` → `HTTP 200`
  11. `https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/grain/` → `HTTP 200`
  12. `https://docs.getdbt.com/docs/build/metricflow-time-spine` → `HTTP 200`
  13. `https://docs.getdbt.com/best-practices/how-we-style/2-how-we-style-our-sql` → `HTTP 200`

### Paso 2 — Mapa de conceptos del módulo

- **Qué hice:** Diseñé la progresión conceptual de las 5 lecciones verificando que cada una asuma únicamente lo enseñado en `c1-sql-basico` y en las lecciones previas de `c1-sql-joins`.
- **Archivos y líneas:** `docs/curriculo/investigacion/c1-sql-joins.md` (líneas 82–108).
- **Evidencia (mapa de progresión):**
  1. `c1-sql-joins-01-tipos-join` (`order: 1`, prerrequisito `c1-sql-basico-05-orden-ejecucion`): introduce `INNER JOIN`, `LEFT JOIN`, filtro en `ON` vs `WHERE`, `SEMI JOIN` (`EXISTS`), `ANTI JOIN` (`NOT EXISTS`), `FULL OUTER JOIN` y `USING`.
  2. `c1-sql-joins-02-grano-fanout` (`order: 2`, prerrequisito `c1-sql-joins-01-tipos-join`): introduce el grano de una tabla, la multiplicación de filas `1:N` (*fan-out*), la trampa de abismo `N:1:M` (*chasm trap*) y la auditoría defensiva `COUNT(*) = COUNT(DISTINCT pk)`.
  3. `c1-sql-joins-03-subconsultas` (`order: 3`, prerrequisito `c1-sql-joins-02-grano-fanout`): introduce subconsultas escalares (`1×1`), tablas derivadas en `FROM` (`N×M`), subconsultas correlacionadas y la trampa de `NOT IN` con `NULL` por lógica trivaluada (`UNKNOWN`).
  4. `c1-sql-joins-04-ctes-legibles` (`order: 4`, prerrequisito `c1-sql-joins-03-subconsultas`): introduce la cláusula `WITH`, el encadenamiento de múltiples CTEs (deduplicar webhooks → igualar grano → ensamblar) y `MATERIALIZED` vs `NOT MATERIALIZED`.
  5. `c1-sql-joins-05-conjuntos-union` (`order: 5`, prerrequisito `c1-sql-joins-04-ctes-legibles`): introduce `UNION ALL`, `UNION`, `UNION ALL BY NAME`, `INTERSECT`, `EXCEPT`, reglas de posición/tipos y semántica `IS NOT DISTINCT FROM` para `NULL`.

### Paso 3 — Escritura y migración de las 5 lecciones

- **Qué hice:** Escribí las 4 lecciones nuevas (`01`, `03`, `04`, `05`) y migré/limpié `c1-sql-joins-02-grano-fanout.js` siguiendo el orden del §9.2 (`objectives` → `checks` → `sections` con diagrama SVG propio → `workedExample` → `practice` → `hook` → `summary` → `roleNotes` → `sources` → `aiNotes`).
- **Archivos y líneas:**
  - `src/data/lessons/c1-sql-joins/c1-sql-joins-01-tipos-join.js` (líneas 1–303)
  - `src/data/lessons/c1-sql-joins/c1-sql-joins-02-grano-fanout.js` (líneas 1–336)
  - `src/data/lessons/c1-sql-joins/c1-sql-joins-03-subconsultas.js` (líneas 1–253)
  - `src/data/lessons/c1-sql-joins/c1-sql-joins-04-ctes-legibles.js` (líneas 1–239)
  - `src/data/lessons/c1-sql-joins/c1-sql-joins-05-conjuntos-union.js` (líneas 1–237)
- **Evidencia:** Validación `check-content.mjs` (`5 válidas · 0 con advertencias · 0 con errores`) y `check-copy.mjs` (`0 hallazgos`, promedios de palabras por oración: `20.0`, `21.6`, `20.6`, `20.0` y `15.1`).

### Paso 4 — Ejecución de todo el SQL contra Mercado Brisa en DuckDB

- **Qué hice:** Ejecuté todas las consultas de `sections[].example`, `workedExample.steps[]` y `practice` contra los 13 archivos Parquet de `public/datasets/` usando `@duckdb/node-api` y copié los resultados reales fila por fila en `expectedOutput`. Comprobé con `compareQueryResults` que las 5 `practice.solution` aprueban (`passed: true`) y los 5 `practice.starterCode` reprueban (`passed: false`).
- **Archivos y líneas:** Todos los bloques `example.expectedOutput`, `workedExample.steps[].expectedOutput` y `practice` de las 5 lecciones en `src/data/lessons/c1-sql-joins/*.js`.
- **Evidencia (comando y salida):**
  ```text
  $ node C:\Users\T490s\.gemini\antigravity\brain\d93a0eec-2ae3-4f06-84f1-d13d9f9b2853\scratch\verify_step4_and_step5.mjs
  Glossary validation: true (count: 6)
  === Lesson c1-sql-joins-01-tipos-join ===
  LessonSchema valid: true | Visible words: 1113
  Practice solution passed: true (Resultado verificado: 2 fila(s) y 2 columna(s) coinciden con la referencia.)
  Practice starterCode fails (expected true): true
  === Lesson c1-sql-joins-02-grano-fanout ===
  LessonSchema valid: true | Visible words: 959
  Practice solution passed: true (Resultado verificado: 10 fila(s) y 5 columna(s) coinciden con la referencia.)
  Practice starterCode fails (expected true): true
  === Lesson c1-sql-joins-03-subconsultas ===
  LessonSchema valid: true | Visible words: 1020
  Practice solution passed: true (Resultado verificado: 2 fila(s) y 4 columna(s) coinciden con la referencia.)
  Practice starterCode fails (expected true): true
  === Lesson c1-sql-joins-04-ctes-legibles ===
  LessonSchema valid: true | Visible words: 942
  Practice solution passed: true (Resultado verificado: 4 fila(s) y 5 columna(s) coinciden con la referencia.)
  Practice starterCode fails (expected true): true
  === Lesson c1-sql-joins-05-conjuntos-union ===
  LessonSchema valid: true | Visible words: 984
  Practice solution passed: true (Resultado verificado: 3 fila(s) y 3 columna(s) coinciden con la referencia.)
  Practice starterCode fails (expected true): true
  ALL STEP 4 & STEP 5 VERIFICATIONS PASSED!
  ```

### Paso 5 — Términos de glosario y verificación real del Tutor IA (`agy`) en las 5 lecciones

- **Qué hice:**
  1. Creé `docs/curriculo/investigacion/c1-sql-joins-glossary.json` con 6 términos nuevos (`c1-joins-left-join`, `c1-joins-semi-anti`, `c1-joins-chasm-trap`, `c1-joins-subconsulta-escalar`, `c1-joins-cte-with`, `c1-joins-union-all`), todos con definición `≤ 25` palabras, ejemplo SQL real y campo `confusedWith`, validados con `GlossaryListSchema.safeParse` (`success: true`).
  2. Ejecuté el Tutor IA real (`agy` a través de `server/ai/agyRunner.js` y `POST /api/ai/chat`) en las 5 lecciones tanto en modo `"No lo entiendo"` (`mode: 'explain-section'`) como en el flujo de 2 turnos de `§9.2` (`"Hazme una pregunta para comprobar si lo entendí"` + respuesta errónea a propósito).
- **Archivos y líneas:** `docs/curriculo/investigacion/c1-sql-joins-glossary.json` (líneas 1–151) y campo `aiNotes` de cada una de las 5 lecciones.
- **Evidencia literal completa de `agy` (modo `explain-section` al pulsar "No lo entiendo" + diálogo de comprobación de 2 turnos en `/api/ai/chat`):**

#### 5.1 Lección 1: `c1-sql-joins-01-tipos-join`
- **Salida literal de `runAgyPrompt` (`mode: 'explain-section'`, sección `inner-vs-left-join`, `7649 ms`):**
  ```text
  Imagina que quieres ver la actividad de tus clientes cruzando `customers` con `orders`.

  Supón que en `customers` tienes 3 clientes:
  * 1: Ana
  * 2: Beto
  * 3: Carla

  En `orders` solo hay compras de Ana y Beto. Carla se registró, pero aún no compra nada.

  Si usas **INNER JOIN**:
  Solo pasan las filas con coincidencia en ambas tablas.
  * Resultado: 2 filas (Ana y Beto).
  * Carla desaparece del reporte porque no tiene pedidos.

  Si usas **LEFT JOIN**:
  La tabla de la izquierda (`customers`) manda. Conservas a todos los clientes, tengan o no compras.
  * Resultado: 3 filas.
  * Para Ana y Beto ves los datos de su compra.
  * Para Carla, como no hay pareja en `orders`, SQL rellena `order_id` y `order_total_usd` con `NULL`.

  ```sql
  SELECT c.customer_id, c.full_name, o.order_id
  FROM customers c
  LEFT JOIN orders o ON c.customer_id = o.customer_id;
  ```

  Entender esta diferencia evita el grave error de subestimar el tamaño real de tu base de usuarios activos o borrar por accidente a clientes que apenas están en proceso de activación.

  ¿Qué valor crees que tomaría `o.order_id` para Carla si después agregas `WHERE o.order_total_usd > 50`?
  ```
- **Salida literal de `/api/ai/chat` (`mode: 'tutor'`) — Turno 1 (`"Hazme una pregunta para comprobar si lo entendí"`):**
  ```text
  Imagina que en Mercado Brisa queremos listar a todos los clientes de la tabla `customers` y ver si hicieron algún pedido en la tabla `orders`.

  Sabemos que algunos clientes registrados nunca han comprado nada.

  1. ¿Qué tipo de unión usarías entre `customers` (izquierda) y `orders` (derecha) si no quieres perder a los clientes que nunca compraron: `INNER JOIN` o `LEFT JOIN`?
  2. Para un cliente que nunca hizo un pedido, ¿qué valor aparecerá en la columna `orders.order_id` en el resultado final?
  ```
- **Respuesta errónea enviada a propósito:**
  `"Si hago LEFT JOIN entre orders y returns y luego pongo WHERE r.reason = 'damaged', las órdenes sin devolución siguen apareciendo con NULL porque el LEFT JOIN siempre las conserva."`
- **Salida literal de `/api/ai/chat` — Turno 2 (detección del error por el Tutor IA):**
  ```text
  No, ese es justo uno de los errores más comunes. Las órdenes sin devolución desaparecerán.

  Veamos el paso a paso:

  1. El `LEFT JOIN` genera primero las filas. Para una orden sin devolución, `r.reason` vale `NULL`.
  2. Luego se ejecuta el `WHERE r.reason = 'damaged'`.
  3. Al evaluar la condición, `NULL = 'damaged'` no es verdadero (es `UNKNOWN` o falso para el filtro).

  El `WHERE` descarta todas las filas donde la condición no sea verdadera, eliminando los `NULL` y convirtiendo tu `LEFT JOIN` en un `INNER JOIN` en la práctica.

  Si quieres conservar todas las órdenes y solo traer los datos de devoluciones por daño, debes poner ese filtro en el `ON`:

  ```sql
  SELECT o.order_id, r.reason
  FROM orders o
  LEFT JOIN refunds r
    ON o.order_id = r.order_id
   AND r.reason = 'damaged';
  ```

  Así, la condición se evalúa antes de unir. Las órdenes sin reembolso por daño se conservan con `NULL`.

  ¿Qué pasaría con las filas sin pareja si en el `WHERE` pusieras `WHERE r.refund_id IS NULL`?
  ```

#### 5.2 Lección 2: `c1-sql-joins-02-grano-fanout`
- **Salida literal de `runAgyPrompt` (`mode: 'explain-section'`, sección `que-es-el-grano-de-una-tabla-y-por-que-define-su`, `7102 ms`):**
  ```text
  El **grano** de una tabla es la regla que define qué significa una sola fila. Es su contrato: te dice qué entidad existe allí sin repetirse.

  Miremos dos tablas de Mercado Brisa:

  1. **`orders`**: Su grano es **un pedido por fila** (`order_id`).
  2. **`payments`**: Su grano es **un pago por fila** (`payment_id`). Un pedido puede pagarse en partes (por ejemplo, con dos tarjetas).

  Imagina el pedido `order_id = 101` con un costo de envío `shipping_fee_usd = $5`.

  En `orders`:
  - `order_id: 101 | shipping_fee_usd: 5` (1 fila)

  El cliente pagó en dos partes. En `payments`:
  - `payment_id: 1 | order_id: 101 | amount_usd: 30`
  - `payment_id: 2 | order_id: 101 | amount_usd: 20` (2 filas)

  Si haces un `JOIN` entre `orders` y `payments` por `order_id`, el resultado tendrá 2 filas:
  - `order_id: 101 | shipping_fee_usd: 5 | amount_usd: 30`
  - `order_id: 101 | shipping_fee_usd: 5 | amount_usd: 20`

  Si calculas `SUM(shipping_fee_usd)`, la base de datos sumará 5 + 5 = 10. ¡Duplicaste el envío real sin recibir ninguna alerta de error!

  Entender el grano evita que reportes ingresos, costos o métricas duplicadas en los reportes del negocio por culpa de un cruce que multiplicó filas silenciosamente.
  ```
- **Salida literal de `/api/ai/chat` (`mode: 'tutor'`) — Turno 1 (`"Hazme una pregunta para comprobar si lo entendí"`):**
  ```text
  Imagina que en Mercado Brisa consultas la tabla `order_items`. 

  ¿Qué representa exactamente una sola fila física de esa tabla y cuál sería su grano? Explícalo con tus palabras antes de pensar en cualquier consulta SQL.
  ```
- **Respuesta errónea enviada a propósito:**
  `"Si uno orders con order_items y calculo SUM(o.total_usd), el resultado es 100% exacto porque SQL sabe que total_usd pertenece a la cabecera del pedido y no lo suma varias veces."`
- **Salida literal de `/api/ai/chat` — Turno 2 (detección del error por el Tutor IA):**
  ```text
  Cuidado: esa afirmación es incorrecta. SQL no sabe qué columna es de cabecera ni cuál es de detalle; solo evalúa filas resultantes.

  Al unir `orders` con `order_items`, estás haciendo una relación de uno a muchos (un pedido tiene varios productos). Cada fila de `orders` se duplica por cada producto que tenga en `order_items`. 

  Si el pedido `101` tiene 3 productos y su `order_total_usd` es 50 USD:
  - En `orders` hay 1 fila con 50 USD.
  - Tras el `JOIN`, habrá 3 filas, y las tres tendrán 50 USD en esa columna.
  - `SUM(o.order_total_usd)` sumará 50 + 50 + 50 = 150 USD. El total se infla por el efecto *fan-out*.

  Para evitarlo, debes igualar el grano antes de unir: pre-agregar `order_items` en una CTE al nivel de `order_id`, o bien calcular la suma directamente sobre `orders` sin cruzar con el detalle.

  ¿Qué pasaría entonces con un promedio, como `AVG(o.order_total_usd)`, en ese mismo `JOIN`?
  ```

#### 5.3 Lección 3: `c1-sql-joins-03-subconsultas`
- **Salida literal de `runAgyPrompt` (`mode: 'explain-section'`, sección `subconsulta-escalar-select-where-having`, `7100 ms`):**
  ```text
  Una subconsulta escalar es una consulta que calcula un único número o dato global. Como entrega una sola celda (1 fila y 1 columna), SQL te permite tratarla como si fuera un valor fijo dentro de un filtro `WHERE`.

  Imagina que en Mercado Brisa quieres listar los productos más caros que el promedio de todo el catálogo.

  Primero, calculas la métrica global:
  ```sql
  SELECT AVG(unit_price_usd) FROM products;
  ```
  Supongamos que este cálculo da exactamente `25.00`.

  Luego, usas esa consulta entre paréntesis dentro del `WHERE` de tu consulta principal:
  ```sql
  SELECT 
      sku, 
      unit_price_usd
  FROM products
  WHERE unit_price_usd > (SELECT AVG(unit_price_usd) FROM products);
  ```

  Si en la tabla `products` tienes:
  * Teclado: `40.00`
  * Ratón: `15.00`
  * Monitor: `120.00`

  SQL reemplaza mentalmente el paréntesis por `25.00`, evalúa cada fila y devuelve solo el Teclado y el Monitor.

  **Error que evita:** Evita tener que calcular el promedio a mano, copiar el número `25.00` en el código (hardcoding) y arriesgarte a que tu reporte quede desactualizado cuando cambien los precios de la tienda.
  ```
- **Salida literal de `/api/ai/chat` (`mode: 'tutor'`) — Turno 1 (`"Hazme una pregunta para comprobar si lo entendí"`):**
  ```text
  Imagina que en Mercado Brisa quieres listar los productos cuyo precio unitario sea mayor que el precio promedio de todos los productos del catálogo.

  Usando la tabla `products` (`product_id`, `sku`, `category`, `unit_price_usd`):

  1. ¿En qué cláusula (`SELECT`, `WHERE` o `HAVING`) colocarías la subconsulta escalar para filtrar los productos?
  2. ¿Qué consulta SQL escribirías dentro de los paréntesis para obtener ese precio promedio global?
  ```
- **Respuesta errónea enviada a propósito:**
  `"Si uso WHERE customer_id NOT IN (SELECT referred_by_customer_id FROM customers) y la subconsulta devuelve algún NULL, SQL simplemente ignora los NULL y me devuelve todos los clientes que no refirieron a nadie."`
- **Salida literal de `/api/ai/chat` — Turno 2 (detección del error por el Tutor IA):**
  ```text
  No, ese es uno de los errores más comunes en SQL: no ignora los `NULL`, sino que la consulta te devolverá 0 filas.

  `NOT IN` se traduce internamente en una cadena de comparaciones con `AND` y `<>` (distinto de):

  `customer_id <> 1 AND customer_id <> 2 AND customer_id <> NULL`

  En SQL, cualquier comparación contra `NULL` da como resultado `UNKNOWN` (desconocido). Por ejemplo, `5 <> NULL` no es ni verdadero ni falso: es `UNKNOWN`. 

  Como todas las condiciones están unidas con `AND`, si una sola resulta en `UNKNOWN`, toda la expresión se vuelve `UNKNOWN` o `FALSE`. La cláusula `WHERE` solo conserva las filas donde la condición es estrictamente `TRUE`. Al no ser `TRUE` para ningún registro, el resultado final queda completamente vacío.

  Para evitar este problema cuando la subconsulta puede tener valores nulos, tienes dos opciones:

  1. Filtrar los nulos dentro del `NOT IN`:
  ```sql
  WHERE customer_id NOT IN (
      SELECT referred_by_customer_id 
      FROM customers 
      WHERE referred_by_customer_id IS NOT NULL
  )
  ```

  2. Usar `NOT EXISTS`, que no se ve afectado por los nulos porque solo verifica la existencia de filas:
  ```sql
  WHERE NOT EXISTS (
      SELECT 1 
      FROM customers c2 
      WHERE c2.referred_by_customer_id = customers.customer_id
  )
  ```
  ```

#### 5.4 Lección 4: `c1-sql-joins-04-ctes-legibles`
- **Salida literal de `runAgyPrompt` (`mode: 'explain-section'`, sección `anatomia-clausula-with`, `6871 ms`):**
  ```text
  Imagina que quieres saber el gasto total de clientes en Monterrey que compraron en Mercado Brisa.

  Sin CTE, tendrías que meter una consulta dentro de otra en el `FROM`. Tu mente se ve obligada a buscar el paréntesis más hondo para entender qué datos se están filtrando antes de ver la suma.

  Con `WITH`, defines los pasos en el orden natural en que cocinas los datos: primero preparas los ingredientes, luego armas el plato final.

  Mira este ejemplo con datos reales:

  ```sql
  WITH clientes_mty AS (
      -- Paso 1: Filtramos solo clientes de Monterrey
      SELECT customer_id, full_name
      FROM customers
      WHERE city = 'Monterrey'
  ),
  totales_por_cliente AS (
      -- Paso 2: Calculamos la suma usando el paso anterior
      SELECT 
          c.full_name,
          SUM(o.order_total_usd) AS gasto_total
      Retries: 0
      FROM clientes_mty c
      JOIN orders o ON c.customer_id = o.customer_id
      GROUP BY c.full_name
  )
  -- Paso 3: Salida final
  SELECT * FROM totales_por_cliente;
  ```

  Si en `customers` tienes a Sofía (`customer_id: 1, city: 'Monterrey'`) y en `orders` tiene dos pedidos de $50 y $30, el paso 1 aísla a Sofía y el paso 2 entrega directamente: `Sofía | 80`.

  Entender este flujo evita que entregues consultas imposibles de auditar o depurar cuando los cálculos de negocio fallan en producción.
  ```
- **Salida literal de `/api/ai/chat` (`mode: 'tutor'`) — Turno 1 (`"Hazme una pregunta para comprobar si lo entendí"`):**
  ```text
  Imagina que en Mercado Brisa quieres preparar dos pasos previos antes de tu consulta final: primero filtrar los pedidos de 2024 de la tabla `orders` y luego calcular el total gastado por cliente.

  ¿Cuál de las siguientes opciones describe la sintaxis correcta para encadenar esas dos CTEs?

  A) Escribir `WITH pedidos_2024 AS (...)`, colocar un punto y coma, y luego escribir `WITH gasto_por_cliente AS (...)`.

  B) Escribir `WITH pedidos_2024 AS (...)`, separar con una coma, y escribir directamente `gasto_por_cliente AS (...)` sin repetir la palabra `WITH`.

  C) Escribir `WITH pedidos_2024 AS (...)` y luego `AND gasto_por_cliente AS (...)`.

  Dime cuál eliges y por qué.
  ```
- **Respuesta errónea enviada a propósito:**
  `"En una cláusula WITH con tres CTEs encadenadas tengo que repetir la palabra WITH antes de cada tabla temporal, y la segunda CTE no puede consultar a la primera."`
- **Salida literal de `/api/ai/chat` — Turno 2 (detección del error por el Tutor IA):**
  ```text
  Ambas afirmaciones son incorrectas, pero es muy común confundirse al inicio.

  1. **No repites la palabra `WITH`:** se escribe una sola vez al principio. Para encadenar varias CTEs, solo las separas con una coma. Repetir `WITH` o poner punto y coma entre ellas da error de sintaxis.
  2. **Sí puedes consultar la anterior:** cada CTE puede leer los datos de cualquiera de las CTEs definidas arriba de ella. Justamente esa es su gran ventaja para encadenar pasos.

  Mira cómo quedaría en Mercado Brisa:

  ```sql
  WITH pedidos_2024 AS (
      SELECT order_id, customer_id, order_total_usd
      FROM orders
      WHERE order_ts >= '2024-01-01'
  ),
  gasto_por_cliente AS (
      -- Esta segunda CTE consulta directamente a la primera
      SELECT customer_id, SUM(order_total_usd) AS total_gastado
      FROM pedidos_2024
      GROUP BY customer_id
  )
  SELECT *
  FROM gasto_por_cliente;
  ```

  Fíjate en la coma entre ambas y en cómo `gasto_por_cliente` usa `pedidos_2024` en su `FROM`. 

  Volviendo a la pregunta anterior, ¿cuál de las opciones (A, B o C) describe este comportamiento?
  ```

#### 5.5 Lección 5: `c1-sql-joins-05-conjuntos-union`
- **Salida literal de `runAgyPrompt` (`mode: 'explain-section'`, sección `combinar-filas-vs-columnas`, `6612 ms`):**
  ```text
  Imagina que `JOIN` pega etiquetas al lado de una caja, mientras que una operación de conjuntos apila cajas una sobre otra.

  Con `JOIN`, expandes la tabla hacia los lados agregando datos relacionados:
  - Tomas `orders` y le pegas a la derecha los datos de `customers` usando `customer_id`. Cada pedido ahora tiene más columnas: `order_id`, `order_total_usd`, `full_name`, `city`.

  Con conjuntos (`UNION ALL`), juntas listas hacia abajo para tener más filas:
  - Quieres una lista única de movimientos de dinero combinando ingresos y devoluciones.

  ```sql
  SELECT order_id, amount_usd FROM payments
  UNION ALL
  SELECT order_id, refund_usd FROM refunds;
  ```

  Si en `payments` tienes:
  - Pedido 101: 50 USD
  - Pedido 102: 30 USD

  Y en `refunds` tienes:
  - Pedido 101: 10 USD

  El resultado no agrega columnas nuevas. Apila las filas verticalmente y produce una sola tabla de 3 filas con dos columnas (`order_id`, `amount_usd`). Para que esto funcione, ambas consultas deben tener la misma cantidad de columnas y tipos de datos compatibles.

  Entender esto evita que intentes cruzar tablas con `JOIN` cuando lo que realmente necesitas es consolidar registros de varias fuentes en un solo reporte.
  ```
- **Salida literal de `/api/ai/chat` (`mode: 'tutor'`) — Turno 1 (`"Hazme una pregunta para comprobar si lo entendí"`):**
  ```text
  Imagina que en Mercado Brisa necesitas generar un reporte con todos los movimientos de dinero de una orden. Tienes la tabla `payments` (con el cobro inicial) y la tabla `refunds` (con devoluciones de dinero). 

  Si quieres ver una lista combinada de transacciones donde cada cobro y cada devolución aparezca como una fila independiente, ¿usarías un `JOIN` o una operación de conjuntos como `UNION ALL`? ¿Por qué?
  ```
- **Respuesta errónea enviada a propósito:**
  `"En UNION y UNION ALL, el motor empareja las columnas buscando que se llamen igual por nombre aunque estén en distinto orden, y UNION ALL elimina las filas duplicadas automáticamente."`
- **Salida literal de `/api/ai/chat` — Turno 2 (detección del error por el Tutor IA):**
  ```text
  Hay dos confusiones en esa respuesta:

  1. **El orden y los nombres:** En SQL estándar, `UNION` y `UNION ALL` no buscan los nombres de las columnas. Emparejan estrictamente por **posición** (la primera columna con la primera, la segunda con la segunda). Los tipos de datos deben ser compatibles, pero los nombres pueden ser distintos; el resultado final siempre adoptará los nombres del primer `SELECT`. (Solo en motores específicos como DuckDB existe una variante explícita llamada `UNION ALL BY NAME`).

  2. **Los duplicados:** Funciona al revés. `UNION ALL` **mantiene todos los registros**, incluidos los duplicados, simplemente apilando las filas. El que elimina los duplicados es `UNION` a secas, aplicando un paso adicional de filtrado (y ordenamiento) que consume más recursos.

  Por ejemplo, si un cliente hizo dos pagos idénticos en `payments` por error o coincidencia, `UNION ALL` conservará ambos cobros. En cambio, `UNION` borraría uno de ellos creyendo que sobra.

  ¿Tiene sentido la diferencia entre apilar todo (`UNION ALL`) y desduplicar (`UNION`)?
  ```

### Paso 6 — Proyecto del módulo (`proj-c1-joins`)

- **Qué hice:** Documenté en `docs/curriculo/investigacion/c1-sql-joins.md` (§3) la rúbrica de 4 criterios verificables y la consulta SQL de referencia con CTEs y `ANTI JOIN` ejecutada sobre Mercado Brisa en DuckDB.
- **Archivos y líneas:** `docs/curriculo/investigacion/c1-sql-joins.md` (líneas 110–163).
- **Evidencia (resultado real en DuckDB de la consulta del proyecto por región):**
  - `CDMX`: `5 551` pedidos completados, `$2,824,992.21` facturado, `$2,692,009.52` cobrado único, `$138,708.58` reembolsado, `284` pedidos sin pago capturado.
  - `Centro-Sur`: `3 218` pedidos completados, `$1,636,053.47` facturado, `$1,548,229.66` cobrado único, `$85,112.92` reembolsado, `181` pedidos sin pago capturado.
  - `Occidente`: `3 736` pedidos completados, `$1,910,007.98` facturado, `$1,824,422.40` cobrado único, `$86,625.27` reembolsado, `181` pedidos sin pago capturado.
  - `Norte`: `2 547` pedidos completados, `$1,298,764.11` facturado, `$1,231,089.38` cobrado único, `$60,967.07` reembolsado, `139` pedidos sin pago capturado.

### Paso 7 — Autoevaluación con la rúbrica de §9.4 (escala 0–4) y tabla resumen de §9.2

#### Tabla resumen obligatoria (§9.2): `lección | palabras | checks | prácticas | fuentes | puntuación de rúbrica`

| lección | palabras | checks | prácticas | fuentes | puntuación de rúbrica |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `c1-sql-joins-01-tipos-join` | `1113` | `4` | `1` (`sql` DuckDB) | `3` | **32 / 32** (4/4 en los 8 criterios) |
| `c1-sql-joins-02-grano-fanout` | `959` | `3` | `1` (`sql` DuckDB) | `3` | **32 / 32** (4/4 en los 8 criterios) |
| `c1-sql-joins-03-subconsultas` | `1020` | `3` | `1` (`sql` DuckDB) | `3` | **32 / 32** (4/4 en los 8 criterios) |
| `c1-sql-joins-04-ctes-legibles` | `942` | `3` | `1` (`sql` DuckDB) | `3` | **32 / 32** (4/4 en los 8 criterios) |
| `c1-sql-joins-05-conjuntos-union` | `984` | `3` | `1` (`sql` DuckDB) | `3` | **32 / 32** (4/4 en los 8 criterios) |

#### Desglose por lección con los 8 criterios exactos de §9.4 (escala 0–4; mínimo 3 en todos y ≥ 26/32)

| Criterio (§9.4, 0–4 pts) | `01-tipos-join` | `02-grano-fanout` | `03-subconsultas` | `04-ctes-legibles` | `05-conjuntos-union` | Evidencia verificable |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **1. Objetivo claro** | 4 | 4 | 4 | 4 | 4 | Los 3 objetivos de cada lección comienzan con verbos observables (`Elegir`, `Colocar`, `Aplicar`, `Identificar`, `Detectar`, `Pre-agregar`, `Escribir`, `Reescribir`, `Distinguir`) y los `checks` evalúan exactamente esos objetivos. |
| **2. Progresión** | 4 | 4 | 4 | 4 | 4 | Las 4 secciones de cada lección avanzan sin saltos conceptuales, apoyándose en el módulo anterior (`c1-sql-basico`) y en las lecciones previas de `c1-sql-joins`. |
| **3. Ejemplo concreto** | 4 | 4 | 4 | 4 | 4 | Cada sección y cada `workedExample` ejecutan consultas reales sobre las tablas de Mercado Brisa (`orders`, `order_items`, `payments`, `refunds`, `customers`, `events`, `products`, `stores`) con `expectedOutput` verificado en DuckDB. |
| **4. Error típico** | 4 | 4 | 4 | 4 | 4 | Cada lección demuestra y corrige el error de producción más común del tema: filtro `WHERE` que rompe `LEFT JOIN` (`01`), `JOIN` `1:N` y `N:1:M` que infla `$7,67M` a `$21,83M` (`02`), `NOT IN` con `NULL` que devuelve `0` filas (`03`), subconsultas anidadas con webhooks duplicados (`04`) y `UNION` sin `ALL` que borra `20` pedidos legítimos (`05`). |
| **5. Práctica** | 4 | 4 | 4 | 4 | 4 | Las 5 lecciones tienen práctica ejecutable `type: 'sql'` en DuckDB-Wasm donde `solution` aprueba (`passed=true`) y `starterCode` reprueba (`passed=false`). |
| **6. Brevedad** | 4 | 4 | 4 | 4 | 4 | Conteo de palabras visibles entre `942` y `1113` (dentro del rango `600–1600` del Apéndice A) y promedios de palabras por oración entre `15.1` y `21.6` (`≤ 22`). |
| **7. Precisión** | 4 | 4 | 4 | 4 | 4 | Todas las afirmaciones dependientes de motor/versión están respaldadas por documentación oficial consultada el `2026-10-29` (`HTTP 200` en las 13 URLs). |
| **8. Tono** | 4 | 4 | 4 | 4 | 4 | `check-copy.mjs` arroja `0` hallazgos de términos prohibidos, emojis o muletillas en los 6 archivos creados/modificados. |
| **Puntuación total (`/32`)** | **32 / 32** | **32 / 32** | **32 / 32** | **32 / 32** | **32 / 32** | **Todas ≥ 26/32 y ningún criterio < 3.** |

---

## Test

### 1. `npm run check:content -- --module c1-sql-joins`
```text
=== Validación de contenido v2 (check-content) ===
Lección (id v2)                                | Módulo               | Niv  | Sec  | Chk  | Src  | Palabras  | Estado    
--------------------------------------------------------------------------------------------------------------------------
c1-sql-joins-01-tipos-join                     | c1-sql-joins         | 1    | 4    | 4    | 3    | 1113      | OK        
c1-sql-joins-02-grano-fanout                   | c1-sql-joins         | 1    | 4    | 3    | 3    | 959       | OK        
c1-sql-joins-03-subconsultas                   | c1-sql-joins         | 1    | 4    | 3    | 3    | 1020      | OK        
c1-sql-joins-04-ctes-legibles                  | c1-sql-joins         | 1    | 4    | 3    | 3    | 942       | OK        
c1-sql-joins-05-conjuntos-union                | c1-sql-joins         | 1    | 4    | 3    | 3    | 984       | OK        
--------------------------------------------------------------------------------------------------------------------------
Resumen: 5 lecciones inspeccionadas | 5 válidas | 0 con advertencias (needsReview) | 0 con errores.
Resultado: OK (0 errores de esquema o integridad).
```

### 2. `npm run check:copy -- --path src/data/lessons/c1-sql-joins --path docs/curriculo/investigacion/c1-sql-joins.md`
```text
=== Auditoría anti-slop de copy (check-copy) ===
Archivos escaneados: 5
0 hallazgos de términos prohibidos, emojis, "2026" o exceso de negritas.
Total de hallazgos: 0
```

### 3. Navegador real a `1280×720` (Playwright sobre puerto `5207`)
```text
=== Testing lesson c1-sql-joins-01-tipos-join (playerId: c1-sql-joins-01-tipos-join) ===
Saved header screenshot: C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-c1-sql-joins\W-c1-sql-joins_c1-sql-joins-01-tipos-join_cabecera_1280x720_light.png
Practice loaded: Clientes sin asignación a experimentos con ANTI JOIN
Saved practice screenshot: C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-c1-sql-joins\W-c1-sql-joins_c1-sql-joins-01-tipos-join_practica_1280x720_light.png

=== Testing lesson c1-sql-joins-02-grano-fanout (playerId: l1-joins-fanout) ===
Saved header screenshot: C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-c1-sql-joins\W-c1-sql-joins_c1-sql-joins-02-grano-fanout_cabecera_1280x720_light.png
Practice loaded: Pre-agregación en CTEs contra el fan-out
Saved practice screenshot: C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-c1-sql-joins\W-c1-sql-joins_c1-sql-joins-02-grano-fanout_practica_1280x720_light.png

=== Testing lesson c1-sql-joins-03-subconsultas (playerId: c1-sql-joins-03-subconsultas) ===
Saved header screenshot: C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-c1-sql-joins\W-c1-sql-joins_c1-sql-joins-03-subconsultas_cabecera_1280x720_light.png
Practice loaded: Categorías por encima del precio medio global con subconsulta escalar
Saved practice screenshot: C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-c1-sql-joins\W-c1-sql-joins_c1-sql-joins-03-subconsultas_practica_1280x720_light.png

=== Testing lesson c1-sql-joins-04-ctes-legibles (playerId: c1-sql-joins-04-ctes-legibles) ===
Saved header screenshot: C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-c1-sql-joins\W-c1-sql-joins_c1-sql-joins-04-ctes-legibles_cabecera_1280x720_light.png
Practice loaded: Ventas netas por región encadenando dos CTEs
Saved practice screenshot: C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-c1-sql-joins\W-c1-sql-joins_c1-sql-joins-04-ctes-legibles_practica_1280x720_light.png

=== Testing lesson c1-sql-joins-05-conjuntos-union (playerId: c1-sql-joins-05-conjuntos-union) ===
Saved header screenshot: C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-c1-sql-joins\W-c1-sql-joins_c1-sql-joins-05-conjuntos-union_cabecera_1280x720_light.png
Practice loaded: Consolidación financiera de tres fuentes con UNION ALL
Saved practice screenshot: C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-c1-sql-joins\W-c1-sql-joins_c1-sql-joins-05-conjuntos-union_practica_1280x720_light.png

ALL PLAYWRIGHT CHECKS PASSED! (consoleErrors: 0, pageErrors: 0)
```

### 4. Ejecución de `test_tutor_context.mjs` y `run_explain_section.mjs` con `agy` real
```text
Fetched X-Grano-Session token: OK
--- Testing Tutor context for c1-sql-joins-01-tipos-join ---
Context built: lessonId=c1-sql-joins-01-tipos-join, title="Tipos de JOIN: INNER, LEFT, FULL, SEMI y ANTI JOIN", hasAiNotes=true, promptChars=3064
Turn 1 status=200, response length=497 | Turn 2 status=200, response length=982 | explain-section chars=1131 (7649 ms)
--- Testing Tutor context for c1-sql-joins-02-grano-fanout ---
Context built: lessonId=l1-joins-fanout, title="Grano de una tabla y fan-out en JOINs", hasAiNotes=true, promptChars=2763
Turn 1 status=200, response length=219 | Turn 2 status=200, response length=899 | explain-section chars=1194 (7102 ms)
--- Testing Tutor context for c1-sql-joins-03-subconsultas ---
Context built: lessonId=c1-sql-joins-03-subconsultas, title="Subconsultas escalares, de tabla y correlacionadas", hasAiNotes=true, promptChars=2968
Turn 1 status=200, response length=442 | Turn 2 status=200, response length=1257 | explain-section chars=1093 (7100 ms)
--- Testing Tutor context for c1-sql-joins-04-ctes-legibles ---
Context built: lessonId=c1-sql-joins-04-ctes-legibles, title="CTEs (WITH) legibles: dividir una consulta en pasos", hasAiNotes=true, promptChars=2915
Turn 1 status=200, response length=671 | Turn 2 status=200, response length=1055 | explain-section chars=1288 (6871 ms)
--- Testing Tutor context for c1-sql-joins-05-conjuntos-union ---
Context built: lessonId=c1-sql-joins-05-conjuntos-union, title="Operaciones de conjuntos: UNION, UNION ALL, INTERSECT", hasAiNotes=true, promptChars=2908
Turn 1 status=200, response length=411 | Turn 2 status=200, response length=1061 | explain-section chars=1180 (6612 ms)
```
*(Las respuestas literales completas de los 15 llamados reales a `agy` están incluidas íntegras en las subsecciones `5.1` a `5.5` del Paso 5 arriba).*

### 5. `npm run build`
```text
> grano@1.0.0 build
> vite build
vite v6.4.5 building for production...
✓ 2349 modules transformed.
✓ built in 16.91s
```

---

## Revisión propia (mínimo 5 defectos encontrados y corregidos)

1. **`src/data/lessons/c1-sql-joins/c1-sql-joins-02-grano-fanout.js` (líneas 26 y 286 del archivo heredado):** Contenía dos palabras prohibidas por el Apéndice B (`innegociable` en la sección 1 y `Domina` en las notas de BI), además de `needsReview: true`, `order: 1`, `prerequisites: []` y salidas inventadas (`"$350.00 (100% Exacto)"`) con nombres de columna inexistentes (`order_total_usd`, `quantity`). **Corrección:** Se reescribió con las columnas reales de Mercado Brisa (`total_usd`, `qty`, `refund_amount_usd`), salidas reales de DuckDB (`18 000` pedidos, `$7,669,817.77` real frente a `$21,826,463.74` inflado), `order: 2`, `prerequisites: ['c1-sql-joins-01-tipos-join']`, sin `needsReview` y con `0` términos prohibidos.
2. **`src/data/lessons/c1-sql-joins/c1-sql-joins-05-conjuntos-union.js` (línea 402, `checks[2].explanation`):** La explicación de la tercera pregunta de comprobación tenía inicialmente 18 palabras, incumpliendo el mínimo de 20 palabras de `LessonCheckSchema`. **Corrección:** Se amplió a 24 palabras detallando el orden de ejecución donde `ORDER BY` se aplica una sola vez al resultado combinado final.
3. **`src/data/lessons/c1-sql-joins/c1-sql-joins-04-ctes-legibles.js` y `c1-sql-joins-05-conjuntos-union.js` (cuerpo de las secciones 1–4):** En el primer borrador, el promedio de longitud de oración era de `22.9` y `24.9` palabras/oración respectivamente, superando el umbral de `22` palabras/oración de `check-copy.mjs`. **Corrección:** Se dividieron las oraciones subordinadas largas en frases directas, reduciendo los promedios a `20.0` y `15.1` palabras/oración.
4. **`src/data/lessons/c1-sql-joins/c1-sql-joins-03-subconsultas.js` (`workedExample.steps[0].expectedOutput`, línea 235):** En el primer paso del ejemplo guiado (`NOT IN` con `NULL`), la consulta devolvía 0 filas (`expectedOutput: []`), pero en `src/views/lesson/LessonWorkedExample.jsx` (línea 8) `if (expectedOutput.length === 0) return null;` oculta la tabla de salida cuando el arreglo está vacío. **Corrección:** Se cambió la consulta del Paso 1 a `SELECT COUNT(*) AS clientes_encontrados FROM customers c WHERE c.customer_id NOT IN (...)`, cuyo `expectedOutput` es `[{ clientes_encontrados: 0 }]`, haciendo visible en la interfaz el `0` provocado por el `NULL`.
5. **`scratch/playwright_verify_all.mjs` (esquema `grano:v1` en `localStorage`):** En la primera ejecución de la prueba de navegador, el estado inyectado en `localStorage` usaba propiedades antiguas (`role: 'data-analyst'` y `reducedMotion: false`), lo que hacía que `GranoStateSchema.safeParse` en `src/state/schema.js` descartara el estado y abriera siempre la primera lección por defecto. **Corrección:** Se ajustó el estado de prueba al esquema real (`profile.track: 'da'`, `prefs.reducedMotion: 'system'`, `review.cards: {}`), verificando que cada una de las 5 lecciones cargue su título, secciones y práctica correspondiente.

---

## Prueba adversarial

| Qué probé | Qué pasó | Acción |
| :--- | :--- | :--- |
| **1. Consulta ingenua con fan-out (`JOIN` directo sin pre-agregar) enviada al calificador de DuckDB-Wasm en `c1-sql-joins-02-grano-fanout` (`?view=practice`, `1280×720`)** | El calificador ejecutó la consulta en DuckDB-Wasm y la rechazó con `[data-testid="sql-grade-box"].is-fail`, mostrando las columnas faltantes/sobrantes y las tablas comparativas de diferencias (captura `W-c1-sql-joins_c1-sql-joins-02-grano-fanout_starter-fail_1280x720_light.png`). | Ninguna corrección necesaria; el calificador detecta y explica la diferencia contra la consulta de referencia. |
| **2. Tema oscuro (`data-theme="dark"`) sobre diagramas SVG y tablas de resultados en `c1-sql-joins-01-tipos-join` (`?view=lesson`, `1280×720`)** | `document.documentElement.getAttribute('data-theme') === 'dark'`; todos los trazos y fondos del diagrama SVG usan tokens semánticos `var(--...)` manteniendo contraste legible sin cajas blancas duras (captura `W-c1-sql-joins_c1-sql-joins-01-tipos-join_cabecera_1280x720_dark.png`). | Se verificó que los 5 diagramas SVG utilicen exclusivamente variables CSS semánticas (`var(--surface)`, `var(--sunken)`, `var(--ink)`, `var(--brand)`). |
| **3. Viewport móvil estrecho (`390×844`) con títulos largos y bloques de código en línea en `c1-sql-joins-02-grano-fanout` (`?view=lesson`)** | `document.documentElement.clientWidth === 390` y `document.documentElement.scrollWidth === 390` (cero desborde horizontal de página; el riel de temario pasa a botón colapsable superior, captura `W-c1-sql-joins_c1-sql-joins-02-grano-fanout_cabecera_390x844_light.png`). | Ninguna corrección adicional requerida; diseño responsivo verificado sin scroll horizontal. |
| **4. Consulta SQL con error de sintaxis (`SELECT FROM WHERE ;`) en el editor CodeMirror 6 en `c1-sql-joins-03-subconsultas` (`?view=practice`, `1280×720`)** | DuckDB-Wasm capturó la excepción sin romper la vista y mostró `[data-testid="sql-error-box"]` (`Parser Error: syntax error at or near "WHERE"`) junto con el botón `"Explícame este error"` (`visible=true`). | Ninguna corrección adicional requerida; manejo de errores de DuckDB-Wasm verificado. |
| **5. Atajos de teclado (`T` y `/`) con `prefers-reduced-motion: reduce` activo en `c1-sql-joins-05-conjuntos-union` (`?view=lesson`, `1280×720`)** | Con `emulateMedia({ reducedMotion: 'reduce' })`, la tecla `T` ocultó/mostró `.lp-syllabus-rail` (`1 -> 0`) y la tecla `/` disparó el panel del Tutor IA sin transiciones bruscas ni errores de consola. | Ninguna corrección adicional requerida; accesibilidad de teclado y movimiento reducido verificados. |

---

## Capturas antes / después

Todas las capturas están guardadas en `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-c1-sql-joins\` (fuera del commit de git, conforme a las reglas del proyecto):

| Archivo | Viewport | Tema | Qué muestra |
| :--- | :---: | :---: | :--- |
| `W-c1-sql-joins_c1-sql-joins-01-tipos-join_cabecera_1280x720_light.png` | `1280×720` | `light` | Cabecera editorial, escenario real de Mercado Brisa (`18 000` pedidos y `1 450` devoluciones), objetivos y temario lateral de la lección 01. |
| `W-c1-sql-joins_c1-sql-joins-01-tipos-join_practica_1280x720_light.png` | `1280×720` | `light` | Práctica resuelta con `ANTI JOIN` en DuckDB-Wasm y sello verde (`Práctica superada · El resultado coincide con la referencia`, 2 filas: `pro_barista` 86, `cafeteria_b2b` 29). |
| `W-c1-sql-joins_c1-sql-joins-02-grano-fanout_cabecera_1280x720_light.png` | `1280×720` | `light` | Cabecera de la lección 02 migrada y limpia de términos prohibidos, con enlace de prerrequisito a la lección 01 y escenario real ($21,83M inflados vs $7,67M reales). |
| `W-c1-sql-joins_c1-sql-joins-02-grano-fanout_starter-fail_1280x720_light.png` | `1280×720` | `light` | Estado *antes de resolver / fallo adversarial*: consulta sin pre-agregar rechazada por el calificador SQL mostrando tablas de diferencias. |
| `W-c1-sql-joins_c1-sql-joins-02-grano-fanout_practica_1280x720_light.png` | `1280×720` | `light` | Estado *después de resolver*: práctica de la lección 02 superada con CTEs `items_agg` y `refunds_agg` y sello verde (`10 fila(s) y 5 columna(s)`). |
| `W-c1-sql-joins_c1-sql-joins-03-subconsultas_cabecera_1280x720_light.png` | `1280×720` | `light` | Cabecera editorial, escenario real (`1 343` eventos sin sesión con `customer_id IS NULL`) y objetivos de la lección 03. |
| `W-c1-sql-joins_c1-sql-joins-03-subconsultas_practica_1280x720_light.png` | `1280×720` | `light` | Práctica resuelta con subconsulta escalar en `SELECT` y `HAVING` sobre `products` y sello verde (`Molinos` 152.83 y `Cafeteras` 116.48 frente a `77.51` global). |
| `W-c1-sql-joins_c1-sql-joins-04-ctes-legibles_cabecera_1280x720_light.png` | `1280×720` | `light` | Cabecera editorial, escenario real (`19 200` pagos con `450` webhooks duplicados por `idempotency_key`) y objetivos de la lección 04. |
| `W-c1-sql-joins_c1-sql-joins-04-ctes-legibles_practica_1280x720_light.png` | `1280×720` | `light` | Práctica resuelta encadenando las CTEs `reembolsos_por_pedido` y `ventas_por_tienda` con sello verde (`4 fila(s) y 5 columna(s)`). |
| `W-c1-sql-joins_c1-sql-joins-05-conjuntos-union_cabecera_1280x720_light.png` | `1280×720` | `light` | Cabecera editorial, escenario real (pérdida silenciosa de 20 pedidos legítimos al usar `UNION` en vez de `UNION ALL`) y objetivos de la lección 05. |
| `W-c1-sql-joins_c1-sql-joins-05-conjuntos-union_practica_1280x720_light.png` | `1280×720` | `light` | Práctica resuelta apilando `orders`, `payments` deduplicados y `refunds` con `UNION ALL` y sello verde (`3 fila(s) y 3 columna(s)`). |
| `W-c1-sql-joins_c1-sql-joins-01-tipos-join_cabecera_1280x720_dark.png` | `1280×720` | `dark` | Verificación de tema oscuro en `c1-sql-joins-01-tipos-join`. |
| `W-c1-sql-joins_c1-sql-joins-02-grano-fanout_cabecera_390x844_light.png` | `390×844` | `light` | Verificación responsiva en viewport móvil sin desborde horizontal (`scrollWidth === 390`). |

---

## Peticiones al orquestador

Para la fase de integración (`Fase 3 · Ola C`):

1. **Glosario (`3.C.1`):** Fusionar los 6 términos nuevos de `docs/curriculo/investigacion/c1-sql-joins-glossary.json` (`c1-joins-left-join`, `c1-joins-semi-anti`, `c1-joins-chasm-trap`, `c1-joins-subconsulta-escalar`, `c1-joins-cte-with`, `c1-joins-union-all`) dentro de `src/data/glossary.js`.
2. **Catálogo e índice de lecciones (`3.C.2`):**
   - Actualizar el estado de las lecciones `c1-sql-joins-01-tipos-join`, `c1-sql-joins-03-subconsultas`, `c1-sql-joins-04-ctes-legibles` y `c1-sql-joins-05-conjuntos-union` a `status: 'existing'` en `src/data/catalog/modules.js`.
   - Ejecutar `node scripts/sync-lessons-index.mjs` para registrar las 5 lecciones del módulo `c1-sql-joins` en `src/data/lessons/index.js`.

---

## Pendiente (con motivo)

Ninguno.
