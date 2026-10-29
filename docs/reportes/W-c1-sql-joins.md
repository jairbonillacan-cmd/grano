# Reporte de cierre — `W-c1-sql-joins` (Fase 3 · Ola A · Módulo `c1-sql-joins`: Combinar tablas)

- **Agente:** `W-c1-sql-joins`
- **Rama y worktree:** `agente/W-c1-sql-joins` en `C:\Users\T490s\Desktop\Proyectos\ING-W-c1-sql-joins`
- **Puerto de prueba asignado:** `5207`
- **Fecha:** `2026-10-29`

---

## Inicio

### Documentos leídos antes de modificar archivos

1. `PLAN_GEMINI_4_ARGON.md`:
   - `§0` (Principios rectores: sobriedad editorial, rigor con fuentes primarias verificadas, honestidad con la IA, calidad antes que cantidad, aislamiento de subagentes).
   - `§1` (Diagnóstico del estado previo y migración de la lección heredada `l1-joins-fanout` a `c1-sql-joins-02-grano-fanout`).
   - `§2` (Arquitectura general, modelo de datos en `localStorage` bajo `grano:v1`, esquema `LessonSchema` y `GlossaryTermSchema`).
   - `§5` (Currículo v2: estructura del módulo `c1-sql-joins` — *Combinar tablas*, Nivel 1, 5 lecciones, proyecto `proj-c1-joins`).
   - `§9.2` y `§9.4` (Reglas del protocolo por subagente, aislamiento de archivos en worktree, prohibición de tocar archivos compartidos como `src/data/lessons/index.js`, `src/data/glossary.js` o `src/data/catalog/modules.js`).
   - `Apéndice A` (Fuentes primarias obligatorias: DuckDB Docs, PostgreSQL 17 Docs, Kimball Group, dbt Docs).
   - `Apéndice B` (Rúbrica de calidad de 8 criterios, 0–2 puntos por criterio, mínimo 14/16 sin ceros).
   - `Apéndice C` (Guía de voz y tono: tú directo, español neutro técnico, promedio ≤ 22 palabras/oración, cero términos de la lista prohibida).
   - `Apéndices D.2 y D.3` (Estructura de lección v2 y lista de verificación obligatoria de cierre).
2. Catálogo, esquemas y validadores:
   - `src/data/catalog/modules.js` (definición de `c1-sql-joins` en líneas 277–296 y proyecto `proj-c1-joins`).
   - `src/data/schema/lesson.js` y `src/data/schema/glossary.js`.
   - `scripts/check-content.mjs`, `scripts/check-copy.mjs` y `scripts/sync-lessons-index.mjs`.
3. Conjunto de datos y motor SQL:
   - `public/datasets/README.md` y `public/datasets/schema.json` (13 tablas Parquet de Mercado Brisa con semilla `19870315`).
   - `src/lab/duckdb.js`, `src/lab/SqlLab.jsx`, `src/lab/SqlEditor.jsx`, `src/lab/sqlGrader.js`.
4. Vistas, estilos y servidor del Tutor IA:
   - `package.json`, `vite.config.js`, `src/main.jsx`, `src/App.jsx`, `src/styles/tokens.css`, `src/data/glossary.js`.
   - `docs/curriculo/fuentes.md`, `docs/curriculo/perfil-core.md`, `docs/curriculo/estado-herramientas.md`.
   - `src/views/LessonPlayer.jsx`, `src/views/lesson/LessonWorkedExample.jsx`, `src/views/PracticeView.jsx`, `src/components/AuthenticCodeLab.jsx`, `src/components/LessonVisualizers.jsx`, `src/components/TutorPanel.jsx`.
   - `server/ai/contextBuilder.js` y `server/ai/routes.js`.

### Estado inicial encontrado en `c1-sql-joins`

- En `src/data/lessons/c1-sql-joins/` solo existía 1 archivo: `c1-sql-joins-02-grano-fanout.js` (migración automática inicial de `l1-joins-fanout` con `needsReview: true`).
- Al auditar `c1-sql-joins-02-grano-fanout.js` con `check-copy.mjs` y `@duckdb/node-api`:
  - Contenía **2 términos prohibidos**: `innegociable` (línea 26) y `Domina` (línea 286).
  - Tenía un promedio de **24.5 palabras por oración** (por encima del máximo de 22).
  - Tenía `order: 1` y `prerequisites: []` en lugar de `order: 2` y `prerequisites: ['c1-sql-joins-01-tipos-join']`.
  - Sus bloques `expectedOutput` tenían cadenas inventadas (`"$350.00 (100% Exacto)"`) y sus ejemplos usaban columnas que no existen en los Parquet reales de Mercado Brisa (`order_total_usd` y `quantity` en lugar de `total_usd` y `qty`).
- Las lecciones `01`, `03`, `04` y `05`, el documento de investigación `docs/curriculo/investigacion/c1-sql-joins.md` y el archivo de glosario `docs/curriculo/investigacion/c1-sql-joins-glossary.json` no existían.

---

## Pasos

### Paso 1 — Investigación técnica con fuentes primarias

- **Qué se hizo:** Se consultaron y verificaron 13 URLs de documentación primaria y técnica oficial (DuckDB v1.x, PostgreSQL 17, Kimball Group y dbt Labs) comprobando que todas respondieran `HTTP 200` el `2026-10-29`. Se redactó el documento completo `docs/curriculo/investigacion/c1-sql-joins.md`.
- **Decisiones tomadas:**
  - Documentar las uniones relacionales estándar (`INNER`, `LEFT`, `RIGHT`, `FULL OUTER`) junto con las extensiones relacionales nativas de DuckDB (`SEMI JOIN`, `ANTI JOIN`, `USING`, `UNION ALL BY NAME`) indicando siempre su equivalencia en SQL estándar (`EXISTS`, `NOT EXISTS`, `ON`).
  - Explicar con precisión la diferencia entre filtrar en `ON` (antes de rellenar con `NULL` las filas sin pareja en `LEFT JOIN`) y filtrar en `WHERE` (después de la unión, degradando `LEFT JOIN` a `INNER JOIN`).
  - Explicar la lógica trivaluada de SQL (`TRUE`, `FALSE`, `UNKNOWN`) que provoca que `NOT IN (subconsulta)` devuelva `0` filas cuando la subconsulta contiene al menos un `NULL`.
  - Documentar el comportamiento del optimizador en CTEs (`WITH`, `MATERIALIZED` vs `NOT MATERIALIZED`) tanto en DuckDB como en PostgreSQL 17.
- **Evidencia (13 URLs verificadas con HTTP 200 el `2026-10-29`):**
  1. `https://duckdb.org/docs/stable/sql/query_syntax/from` (`HTTP 200`)
  2. `https://duckdb.org/docs/stable/sql/query_syntax/with` (`HTTP 200`)
  3. `https://duckdb.org/docs/stable/sql/expressions/subqueries` (`HTTP 200`)
  4. `https://duckdb.org/docs/stable/sql/query_syntax/setops` (`HTTP 200`)
  5. `https://www.postgresql.org/docs/current/queries-table-expressions.html` (`HTTP 200`)
  6. `https://www.postgresql.org/docs/current/functions-subquery.html` (`HTTP 200`)
  7. `https://www.postgresql.org/docs/current/sql-expressions.html#SQL-SYNTAX-SCALAR-SUBQUERIES` (`HTTP 200`)
  8. `https://www.postgresql.org/docs/current/queries-with.html` (`HTTP 200`)
  9. `https://www.postgresql.org/docs/current/queries-union.html` (`HTTP 200`)
  10. `https://www.postgresql.org/docs/current/sql-select.html` (`HTTP 200`)
  11. `https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/grain/` (`HTTP 200`)
  12. `https://docs.getdbt.com/docs/build/metricflow-time-spine` (`HTTP 200`)
  13. `https://docs.getdbt.com/best-practices/how-we-style/2-how-we-style-our-sql` (`HTTP 200`)
- **Archivos tocados:** `docs/curriculo/investigacion/c1-sql-joins.md`.

### Paso 2 — Mapa de conceptos y progresión de las 5 lecciones

- **Qué se hizo:** Se diseñó la secuencia pedagógica del módulo `c1-sql-joins` asegurando que cada lección introduzca un bloque conceptual nuevo apoyándose en el anterior y preparando el proyecto integrador `proj-c1-joins`.
- **Decisiones tomadas:**

| Orden | ID de lección | Título | Minutos | Prerrequisito directo | Tablas de Mercado Brisa empleadas | Diagrama SVG propio |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| `1` | `c1-sql-joins-01-tipos-join` | Tipos de JOIN: INNER, LEFT, FULL, SEMI y ANTI JOIN | 25 | `c1-sql-basico-05-orden-ejecucion` | `orders`, `refunds`, `customers`, `experiment_assignments` | Cuadrícula comparativa de 5 tipos de `JOIN` y qué filas conserva cada uno |
| `2` | `c1-sql-joins-02-grano-fanout` | Grano de una tabla y fan-out en JOINs | 25 | `c1-sql-joins-01-tipos-join` | `orders`, `order_items`, `refunds` | Multiplicación `1:N` y trampa de abismo `N:1:M` vs pre-agregación en CTE (`1:1`) + simulador `join-grain` |
| `3` | `c1-sql-joins-03-subconsultas` | Subconsultas escalares, de tabla y correlacionadas | 20 | `c1-sql-joins-02-grano-fanout` | `orders`, `customers`, `events`, `products` | Matriz de subconsultas por cardinalidad (`1×1`, `N×1`, `N×M`) y tabla de verdad de `NOT IN` con `NULL` |
| `4` | `c1-sql-joins-04-ctes-legibles` | CTEs (WITH) legibles: dividir una consulta en pasos | 20 | `c1-sql-joins-03-subconsultas` | `payments`, `refunds`, `orders`, `stores` | Tubería lineal de 3 CTEs (deduplicar webhooks → igualar grano → ensamblar) |
| `5` | `c1-sql-joins-05-conjuntos-union` | Operaciones de conjuntos: UNION, UNION ALL, INTERSECT | 20 | `c1-sql-joins-04-ctes-legibles` | `orders`, `payments`, `refunds`, `events` | Contraste visual entre combinación horizontal (`JOIN`) y apilado vertical (`UNION ALL`, `INTERSECT`, `EXCEPT`) |

- **Archivos tocados:** `docs/curriculo/investigacion/c1-sql-joins.md`.

### Paso 3 — Términos de glosario del módulo

- **Qué se hizo:** Se revisó `src/data/glossary.js` (que ya incluía `t-grain`, `t-fanout`, `t-cte`, `t-idempotency`) y se redactaron 6 términos nuevos en `docs/curriculo/investigacion/c1-sql-joins-glossary.json` para que el integrador los fusione en Fase 3C.
- **Términos creados y validados contra `GlossaryListSchema` (`true`):**
  1. `c1-joins-left-join` (*LEFT OUTER JOIN*) → `lessonId: 'c1-sql-joins-01-tipos-join'`
  2. `c1-joins-semi-anti` (*SEMI JOIN y ANTI JOIN*) → `lessonId: 'c1-sql-joins-01-tipos-join'`
  3. `c1-joins-chasm-trap` (*Trampa de abismo (Chasm Trap)*) → `lessonId: 'c1-sql-joins-02-grano-fanout'`
  4. `c1-joins-subconsulta-escalar` (*Subconsulta escalar*) → `lessonId: 'c1-sql-joins-03-subconsultas'`
  5. `c1-joins-cte-with` (*Expresión de tabla común (CTE / WITH)*) → `lessonId: 'c1-sql-joins-04-ctes-legibles'`
  6. `c1-joins-union-all` (*UNION ALL vs UNION*) → `lessonId: 'c1-sql-joins-05-conjuntos-union'`
- **Archivos tocados:** `docs/curriculo/investigacion/c1-sql-joins-glossary.json`.

### Paso 4 — Redacción y migración de las 5 lecciones

- **Qué se hizo:** Se escribieron desde cero las lecciones `01`, `03`, `04` y `05`, y se migró y limpió por completo `c1-sql-joins-02-grano-fanout.js` (`legacyId: 'l1-joins-fanout'`, `legacyOrder: 1`, `order: 2`, eliminando `needsReview: true`, reemplazando todas las salidas simuladas por salidas reales de DuckDB sobre Mercado Brisa y corrigiendo los términos prohibidos y la longitud de oración).
- **Métricas verificadas de las 5 lecciones:**

| Lección | Palabras visibles (`countLessonWords`) | Promedio palabras/oración (máx. 22) | Secciones | Comprobaciones (`checks`) | Fuentes verificadas |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `c1-sql-joins-01-tipos-join` | `1113` | `20.0` | 4 | 4 (`multiple-choice`) | 3 |
| `c1-sql-joins-02-grano-fanout` | `959` | `21.6` | 4 (con simulador `join-grain`) | 3 (`multiple-choice`) | 3 |
| `c1-sql-joins-03-subconsultas` | `1019` | `20.6` | 4 | 3 (`multiple-choice`) | 4 |
| `c1-sql-joins-04-ctes-legibles` | `942` | `20.0` | 4 | 3 (`multiple-choice`) | 3 |
| `c1-sql-joins-05-conjuntos-union` | `984` | `15.1` | 4 | 3 (`multiple-choice`) | 3 |

- **Archivos tocados:**
  - `src/data/lessons/c1-sql-joins/c1-sql-joins-01-tipos-join.js`
  - `src/data/lessons/c1-sql-joins/c1-sql-joins-02-grano-fanout.js`
  - `src/data/lessons/c1-sql-joins/c1-sql-joins-03-subconsultas.js`
  - `src/data/lessons/c1-sql-joins/c1-sql-joins-04-ctes-legibles.js`
  - `src/data/lessons/c1-sql-joins/c1-sql-joins-05-conjuntos-union.js`

### Paso 5 — Prácticas ejecutables en el laboratorio SQL y verificación del Tutor IA

- **Prácticas SQL verificadas en `@duckdb/node-api` y en navegador real (`?view=practice` con DuckDB-Wasm):**

| Lección | Título de la práctica | `practice.solution` (`compareQueryResults`) | `practice.starterCode` (`compareQueryResults`) | Resultado real verificado |
| :--- | :--- | :---: | :---: | :--- |
| `c1-sql-joins-01-tipos-join` | Clientes sin asignación a experimentos con ANTI JOIN | `passed: true` | `passed: false` (`reprueba: true`) | 2 filas (`pro_barista`: 86, `cafeteria_b2b`: 29) |
| `c1-sql-joins-02-grano-fanout` | Pre-agregación en CTEs contra el fan-out | `passed: true` | `passed: false` (`reprueba: true`) | 10 filas, 5 columnas (`customer_id` 1 a 10 sin duplicación) |
| `c1-sql-joins-03-subconsultas` | Categorías por encima del precio medio global con subconsulta escalar | `passed: true` | `passed: false` (`reprueba: true`) | 2 filas (`Molinos`: 152.83 vs 77.51; `Cafeteras`: 116.48 vs 77.51) |
| `c1-sql-joins-04-ctes-legibles` | Ventas netas por región encadenando dos CTEs | `passed: true` | `passed: false` (`reprueba: true`) | 4 filas (`CDMX`, `Occidente`, `Centro-Sur`, `Norte`) |
| `c1-sql-joins-05-conjuntos-union` | Consolidación financiera de tres fuentes con UNION ALL | `passed: true` | `passed: false` (`reprueba: true`) | 3 filas (`pedidos`: 18 000, `pagos_capturados`: 16 155, `reembolsos_procesados`: 1221) |

- **Verificación del Tutor IA en las 5 lecciones (`/api/ai/chat` + `buildContextPrompt`):**
  - En cada lección se envió el turno 1 (`"Hazme una pregunta para comprobar si lo entendí"`) y en el turno 2 se respondió con un error conceptual deliberado propio de la lección:
    1. **`c1-sql-joins-01-tipos-join`**:
       - *Pregunta del tutor:* Pide elegir entre `INNER JOIN` y `LEFT JOIN` entre `customers` y `orders` para no perder clientes sin compras, y qué valor aparece en `orders.order_id`.
       - *Respuesta errónea enviada:* `"Si hago LEFT JOIN entre orders y returns y luego pongo WHERE r.reason = 'damaged', las órdenes sin devolución siguen apareciendo con NULL porque el LEFT JOIN siempre las conserva."`
       - *Detección del tutor:* Detectó que las órdenes sin devolución desaparecen porque `NULL = 'damaged'` evalúa a `UNKNOWN` en el `WHERE`, degradando el `LEFT JOIN` a un `INNER JOIN`, y mostró cómo mover `AND r.reason = 'damaged'` a la cláusula `ON`.
    2. **`c1-sql-joins-02-grano-fanout`**:
       - *Pregunta del tutor:* Pregunta qué representa una fila física de `order_items` y cuál es su grano.
       - *Respuesta errónea enviada:* `"Si uno orders con order_items y calculo SUM(o.total_usd), el resultado es 100% exacto porque SQL sabe que total_usd pertenece a la cabecera del pedido y no lo suma varias veces."`
       - *Detección del tutor:* Corrigió explicando que SQL no distingue columnas de cabecera y detalle, sino que multiplica las filas de `orders` por cada línea de `order_items` (*fan-out*), e indicó pre-agregar `order_items` en una CTE al grano de `order_id`.
    3. **`c1-sql-joins-03-subconsultas`**:
       - *Pregunta del tutor:* Pregunta en qué cláusula colocar una subconsulta escalar sobre `products` para comparar contra `AVG(unit_price_usd)`.
       - *Respuesta errónea enviada:* `"Si uso WHERE customer_id NOT IN (SELECT referred_by_customer_id FROM customers) y la subconsulta devuelve algún NULL, SQL simplemente ignora los NULL y me devuelve todos los clientes que no refirieron a nadie."`
       - *Detección del tutor:* Explicó que `NOT IN` se traduce en comparaciones unidas por `AND` (`<> NULL` → `UNKNOWN`), vaciando todo el resultado a 0 filas, y propuso usar `NOT EXISTS` o filtrar `IS NOT NULL`.
    4. **`c1-sql-joins-04-ctes-legibles`**:
       - *Pregunta del tutor:* Plantea encadenar dos CTEs (`pedidos_2024` y `gasto_por_cliente`) y pregunta cómo separarlas.
       - *Respuesta errónea enviada:* `"En una cláusula WITH con tres CTEs encadenadas tengo que repetir la palabra WITH antes de cada tabla temporal, y la segunda CTE no puede consultar a la primera."`
       - *Detección del tutor:* Corrigió ambos puntos explicando que `WITH` se escribe una sola vez separando cada CTE con coma, y que toda CTE posterior puede consultar en su `FROM` cualquiera de las CTEs definidas antes.
    5. **`c1-sql-joins-05-conjuntos-union`**:
       - *Pregunta del tutor:* Pregunta si para listar cobros (`payments`) y devoluciones (`refunds`) como filas independientes conviene `JOIN` o `UNION ALL`.
       - *Respuesta errónea enviada:* `"En UNION y UNION ALL, el motor empareja las columnas buscando que se llamen igual por nombre aunque estén en distinto orden, y UNION ALL elimina las filas duplicadas automáticamente."`
       - *Detección del tutor:* Aclaró que `UNION` y `UNION ALL` estándar emparejan por posición (salvo `UNION ALL BY NAME` en DuckDB) y que `UNION ALL` conserva todas las filas mientras que `UNION` elimina duplicados.

### Paso 6 — Rúbrica y consulta de referencia del proyecto del módulo

- **Qué se hizo:** Se documentaron en `docs/curriculo/investigacion/c1-sql-joins.md` (§3) los 4 criterios verificables del proyecto `proj-c1-joins` (*Reconciliación de órdenes, pagos y devoluciones*) y se ejecutó la consulta de referencia con CTEs sobre Mercado Brisa en DuckDB:
  - `CDMX`: `5551` pedidos completados, `$2,824,992.21` facturado, `$2,692,009.52` cobrado único, `$138,708.58` reembolsado, `284` pedidos sin pago capturado (`ANTI JOIN`).
  - `Centro-Sur`: `3218` pedidos completados, `$1,636,053.47` facturado, `$1,548,229.66` cobrado único, `$85,112.92` reembolsado, `181` pedidos sin pago capturado.
  - `Occidente`: `3736` pedidos completados, `$1,910,007.98` facturado, `$1,824,422.40` cobrado único, `$86,625.27` reembolsado, `181` pedidos sin pago capturado.
  - `Norte`: `2547` pedidos completados, `$1,298,764.11` facturado, `$1,231,089.38` cobrado único, `$60,967.07` reembolsado, `139` pedidos sin pago capturado.
- **Archivos tocados:** `docs/curriculo/investigacion/c1-sql-joins.md`.

### Paso 7 — Autoevaluación con la rúbrica de 8 criterios (Apéndice B)

| Criterio (0–2 pts) | `01-tipos-join` | `02-grano-fanout` | `03-subconsultas` | `04-ctes-legibles` | `05-conjuntos-union` | Evidencia verificable |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **1. Exactitud técnica y fuentes** | 2 | 2 | 2 | 2 | 2 | 3 a 4 fuentes primarias por lección (`HTTP 200` el `2026-10-29`); todos los `expectedOutput` obtenidos de DuckDB real sobre Mercado Brisa. |
| **2. Claridad pedagógica y grano** | 2 | 2 | 2 | 2 | 2 | Cada lección abre con un fallo cuantificado en Mercado Brisa (18 000 pedidos vs 1 450 devoluciones; $21,83M inflados vs $7,67M reales; 0 filas por `NOT IN` con `NULL`; 450 webhooks duplicados; 20 transacciones borradas por `UNION`). |
| **3. Prosa y estilo editorial** | 2 | 2 | 2 | 2 | 2 | `check-copy.mjs`: `0` hallazgos prohibidos; promedios de palabras por oración de `20.0`, `21.6`, `20.6`, `20.0` y `15.1` (todos ≤ 22). |
| **4. Visualización y diagrama SVG** | 2 | 2 | 2 | 2 | 2 | Cada lección incluye un `<svg>` propio con `role="img"`, `aria-label` y variables semánticas `var(--...)`; la lección 02 añade además el simulador interactivo `join-grain`. |
| **5. Ejemplo guiado (`workedExample`)** | 2 | 2 | 2 | 2 | 2 | 2 a 3 pasos progresivos por lección contrastando el enfoque erróneo y la solución verificada con tablas `expectedOutput` reales. |
| **6. Práctica ejecutable (`practice`)** | 2 | 2 | 2 | 2 | 2 | Las 5 prácticas son `type: 'sql'` sobre Mercado Brisa; `solution` aprueba (`passed=true`) y `starterCode` reprueba (`reprueba=true`) tanto en `@duckdb/node-api` como en DuckDB-Wasm en el navegador. |
| **7. Comprobaciones y reflexión** | 2 | 2 | 2 | 2 | 2 | 3 a 4 `checks` por lección con distractores basados en errores reales y explicaciones de ≥ 20 palabras + pregunta de reflexión con `rubric` y `guidedPrompts`. |
| **8. Notas por rol (`roleNotes`) y `aiNotes`** | 2 | 2 | 2 | 2 | 2 | `roleNotes` diferenciadas para `de`, `da` y `bi` (≥ 20 palabras cada una) y `aiNotes` probadas en vivo con el Tutor IA en 2 turnos por lección. |
| **Total (mín. 14/16, sin ceros)** | **16/16** | **16/16** | **16/16** | **16/16** | **16/16** | **5 lecciones válidas con 0 errores y 0 advertencias.** |

---

## Test

### 1. Validación de esquema y conteo de palabras (`check-content.mjs`)

- **Comando:** `node scripts/check-content.mjs --module c1-sql-joins`
- **Resultado:**
  ```text
  Verificando contenido (5 archivo(s) de lección)...
  ✓ Todas las lecciones cumplen LessonSchema.
  Resumen: 5 válidas · 0 con advertencias · 0 con errores (en 15ms).
  ```

### 2. Auditoría de estilo, términos prohibidos y longitud de oración (`check-copy.mjs`)

- **Comando:** `node scripts/check-copy.mjs --path src/data/lessons/c1-sql-joins --path docs/curriculo/investigacion/c1-sql-joins.md`
- **Resultado:**
  ```text
  Archivos escaneados: 6
  Hallazgos totales:   0
  ✓ Sin términos prohibidos ni muletillas detectadas.
  ```
  *(Nota: el resumen global de longitud de oración de `check-copy.mjs` solo lista lecciones de otros módulos fuera de nuestro alcance; las 5 lecciones de `c1-sql-joins` están por debajo de 22 palabras/oración: `20.0`, `21.6`, `20.6`, `20.0` y `15.1`).*

### 3. Verificación de consultas y prácticas contra DuckDB (`@duckdb/node-api`)

- **Comando:** `node C:\Users\T490s\.gemini\antigravity\brain\d93a0eec-2ae3-4f06-84f1-d13d9f9b2853\scratch\verify_step4_and_step5.mjs`
- **Resultado:**
  ```text
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
  LessonSchema valid: true | Visible words: 1019
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

### 4. Verificación en navegador real con Playwright (`5207`) y compilación de producción (`npm run build`)

- **Comandos:**
  - `node C:\Users\T490s\.gemini\antigravity\brain\d93a0eec-2ae3-4f06-84f1-d13d9f9b2853\scratch\playwright_verify_all.mjs` → `ALL PLAYWRIGHT CHECKS PASSED!` (`0` errores de consola, `0` errores de página en las 5 lecciones tanto en `?view=lesson` como en `?view=practice`).
  - `node C:\Users\T490s\.gemini\antigravity\brain\d93a0eec-2ae3-4f06-84f1-d13d9f9b2853\scratch\test_tutor_context.mjs` → 10 respuestas SSE `HTTP 200` verificadas contra `/api/ai/chat`.
  - `npm run build` → compilación limpia de producción con Vite v6.4.5.

---

## Revisión propia

Durante la autorrevisión línea por línea antes de cerrar se detectaron y corrigieron **5 defectos concretos**:

1. **`src/data/lessons/c1-sql-joins/c1-sql-joins-02-grano-fanout.js` (líneas 26 y 286 del archivo heredado):** Contenía dos palabras prohibidas por el Apéndice C (`innegociable` en la sección 1 y `Domina` en las notas de BI), además de `needsReview: true`, `order: 1`, `prerequisites: []` y salidas inventadas (`"$350.00 (100% Exacto)"`) con nombres de columna inexistentes (`order_total_usd`, `quantity`). **Corrección:** Se reescribió con las columnas reales de Mercado Brisa (`total_usd`, `qty`, `refund_amount_usd`), salidas reales de DuckDB (`18 000` pedidos, `$7,669,817.77` real frente a `$21,826,463.74` inflado), `order: 2`, `prerequisites: ['c1-sql-joins-01-tipos-join']`, sin `needsReview` y con `0` términos prohibidos.
2. **`src/data/lessons/c1-sql-joins/c1-sql-joins-05-conjuntos-union.js` (línea 402, `checks[2].explanation`):** La explicación de la tercera pregunta de comprobación tenía inicialmente 18 palabras, incumpliendo el mínimo de 20 palabras de `LessonCheckSchema`. **Corrección:** Se amplió a 24 palabras detallando el orden de ejecución donde `ORDER BY` se aplica una sola vez al resultado combinado final.
3. **`src/data/lessons/c1-sql-joins/c1-sql-joins-04-ctes-legibles.js` y `c1-sql-joins-05-conjuntos-union.js` (cuerpo de las secciones 1–4):** En el primer borrador, el promedio de longitud de oración era de `22.9` y `24.9` palabras/oración respectivamente, superando el umbral de `22` palabras/oración de `check-copy.mjs`. **Corrección:** Se dividieron las oraciones subordinadas largas en frases directas, reduciendo los promedios a `20.0` y `15.1` palabras/oración.
4. **`src/data/lessons/c1-sql-joins/c1-sql-joins-03-subconsultas.js` (`workedExample.steps[0].expectedOutput`, línea 235):** En el primer paso del ejemplo guiado (`NOT IN` con `NULL`), la consulta devolvía 0 filas (`expectedOutput: []`), pero en `src/views/lesson/LessonWorkedExample.jsx` (línea 8) `if (expectedOutput.length === 0) return null;` oculta la tabla de salida cuando el arreglo está vacío. **Corrección:** Se cambió la consulta del Paso 1 a `SELECT COUNT(*) AS clientes_encontrados FROM customers c WHERE c.customer_id NOT IN (...)`, cuyo `expectedOutput` es `[{ clientes_encontrados: 0 }]`, haciendo visible en la interfaz el `0` provocado por el `NULL`.
5. **`scratch/playwright_verify_all.mjs` (esquema `grano:v1` en `localStorage`):** En la primera ejecución de la prueba de navegador, el estado inyectado en `localStorage` usaba propiedades antiguas (`role: 'data-analyst'` y `reducedMotion: false`), lo que hacía que `GranoStateSchema.safeParse` en `src/state/schema.js` descartara el estado y abriera siempre la primera lección por defecto. **Corrección:** Se ajustó el estado de prueba al esquema real (`profile.track: 'da'`, `prefs.reducedMotion: 'system'`, `review.cards: {}`), verificando que cada una de las 5 lecciones cargue su título, secciones y práctica correspondiente.

---

## Prueba adversarial

Se ejecutaron **5 casos adversariales** en el navegador real (Chromium vía Playwright contra `http://127.0.0.1:5207`) y contra el servidor:

| # | Caso adversarial probado | Lección / Vista | Resultado observado |
| :---: | :--- | :--- | :--- |
| **1** | **Consulta ingenua con fan-out (JOIN directo sin pre-agregar) enviada al calificador de DuckDB-Wasm** | `c1-sql-joins-02-grano-fanout` (`?view=practice`, `1280×720`) | El calificador ejecuta la consulta en DuckDB-Wasm y la rechaza con `[data-testid="sql-grade-box"].is-fail`, mostrando las columnas faltantes/sobrantes y las tablas comparativas de diferencias (captura `W-c1-sql-joins_c1-sql-joins-02-grano-fanout_starter-fail_1280x720_light.png`). |
| **2** | **Tema oscuro (`data-theme="dark"`) sobre diagramas SVG y tablas de resultados** | `c1-sql-joins-01-tipos-join` (`?view=lesson`, `1280×720`, `dark`) | `document.documentElement.getAttribute('data-theme') === 'dark'`; todos los trazos y fondos del diagrama SVG usan tokens semánticos `var(--...)` manteniendo contraste legible sin cajas blancas duras (captura `W-c1-sql-joins_c1-sql-joins-01-tipos-join_cabecera_1280x720_dark.png`). |
| **3** | **Viewport móvil estrecho (`390×844`) con títulos largos y bloques de código en línea** | `c1-sql-joins-02-grano-fanout` (`?view=lesson`, `390×844`, `light`) | `document.documentElement.clientWidth === 390` y `document.documentElement.scrollWidth === 390` (cero desborde horizontal de página; el riel de temario pasa a botón colapsable superior, captura `W-c1-sql-joins_c1-sql-joins-02-grano-fanout_cabecera_390x844_light.png`). |
| **4** | **Consulta SQL con error de sintaxis (`SELECT FROM WHERE ;`) en el editor CodeMirror 6** | `c1-sql-joins-03-subconsultas` (`?view=practice`, `1280×720`) | DuckDB-Wasm captura la excepción sin romper la vista y muestra `[data-testid="sql-error-box"]` (`Parser Error: syntax error at or near "WHERE"`) junto con el botón `"Explícame este error"` (`visible=true`). |
| **5** | **Atajos de teclado (`T` y `/`) con `prefers-reduced-motion: reduce` activo** | `c1-sql-joins-05-conjuntos-union` (`?view=lesson`, `1280×720`) | Con `emulateMedia({ reducedMotion: 'reduce' })`, la tecla `T` oculta/muestra `.lp-syllabus-rail` (`1 -> 0`) y la tecla `/` dispara el panel del Tutor IA sin transiciones bruscas ni errores de consola. |

---

## Capturas antes / después

Todas las capturas se encuentran guardadas en `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-c1-sql-joins\` (no incluidas en el commit de git, conforme a las reglas del proyecto):

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

## Pendiente

Ninguno.
