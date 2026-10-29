# Reporte de cierre — Subagente `W-c1-modelo` (Fase 3 · Ola A)

- **Agente:** `W-c1-modelo`
- **Módulo:** `c1-modelo` — *Modelo relacional y calidad de datos* (Nivel 1, Tronco común `core`, orden 5)
- **Rama / Worktree:** `agente/W-c1-modelo` (`C:\Users\T490s\Desktop\Proyectos\ING-W-c1-modelo`)
- **Puerto de verificación asignado:** `5208`
- **Fecha:** 2026-10-29

---

## Inicio

### 1. Archivos leídos antes de escribir código (un archivo por línea con 1 dato concreto aprendido)

1. `PLAN_GEMINI_4_ARGON.md`: define en §5 (`c1-modelo`), §9.2, §9.4 y Apéndices A/B/D las 5 lecciones de Nivel 1 (`[20, 25, 20, 20, 20]` min = `105` min), exigiendo entre `380` y `750` palabras en `sections[].body` para Nivel 1 y media `<= 22` palabras por frase.
2. `src/data/catalog/modules.js`: registra `c1-modelo` en las líneas `297–316` con `prerequisites: ['c1-sql-joins']`, `lessons` `c1-modelo-01` a `c1-modelo-05` y proyecto final de auditoría de integridad y calidad sobre el esquema de Mercado Brisa.
3. `public/datasets/README.md`: documenta el generador determinista de Mercado Brisa (semilla `19870315`) y las anomalías deliberadas: `450` webhooks duplicados en `payments` (`19 200` filas para `18 000` pedidos, con `750` reintentos legítimos `attempt_number = 2`), `1 200` eventos duplicados y `6 715` eventos anónimos (`customer_id IS NULL`) en `events`, `218` códigos postales nulos y `129` truncados a 2 caracteres en `customers`, y `product_id = 180` (`SKU-TEST-NEG`, `-9.99` USD) en `products`.
4. `public/datasets/schema.json`: especifica las columnas, tipos físicos y conteos exactos de las 13 tablas (`customers`: `2 400`, `customer_changes`: `4 100`, `products`: `180`, `orders`: `18 000`, `order_items`: `42 000`, `payments`: `19 200`, `refunds`: `1 620`, `events`: `65 000`, `marketing_spend`: `730`, `stores`: `14`, `calendar`: `1 095`).
5. `src/data/schema/lesson.js`: impone en `LessonSchema` (línea `86`) `title: z.string().min(8).max(60)`, `hook` entre `40` y `90` palabras terminado en `?`, `checks` `>= 3` de al menos 2 tipos con `explanation` entre `20` y `60` palabras, `roleNotes.{de,da,bi}` entre `25` y `70` palabras, y `sources` `>= 3` con URL `https://`.
6. `src/data/schema/glossary.js`: exige en `GlossaryTermSchema` que `id` sea slug en minúsculas (`^[a-z0-9]+(-[a-z0-9]+)*$`), `definition` tenga entre `20` y `60` palabras y `sources` incluya al menos una fuente verificada.
7. `scripts/check-content.mjs`: carga dinámicamente todos los archivos `docs/curriculo/investigacion/*-glossary.json` (líneas `103–119`) para validar `lesson.glossaryTerms` sin requerir editar `src/data/glossary.js` durante la Ola A.
8. `scripts/check-copy.mjs`: rechaza los términos prohibidos del Apéndice B.2 (como `desbloquear`, `dominar`, `esencial`, `a continuación`), prohíbe más de 3 negritas (`**...**`) en un mismo bloque separado por `\n\n` y reporta cualquier lección cuya media supere `22` palabras/frase en `sections[].body`.
9. `scripts/sync-lessons-index.mjs`: escanea `src/data/lessons/**/*.js` y genera `src/data/lessons/index.js` exportando `LESSONS_V2`, `LESSONS_BY_ID` y el adaptador `adaptLessonForLegacyPlayer`.
10. `scripts/generate-dataset.mjs`: revela en su lógica de generación que `product_id = 180` (`SKU-TEST-NEG`, `is_active = false`) tiene `0` líneas en `order_items.parquet`, mientras que otros `9` productos inactivos (`is_active = false`, `list_price_usd > 0`) acumulan `2 106` líneas históricas en `order_items.parquet`.
11. `package.json`: declara `@duckdb/node-api` (`^2.0.0-r.1`), `@duckdb/duckdb-wasm`, `zod` (`^4.6.7`) y `playwright-core` (`^1.64.1`), además de los scripts `check:content`, `check:copy` y `build`.
12. `vite.config.js`: registra el plugin `granoAiPlugin()` desde `./server/ai/routes.js` y configura el servidor local en `127.0.0.1` permitiendo dividir fragmentos de DuckDB y CodeMirror en `build`.
13. `src/main.jsx`: inicializa la aplicación React en `#root` e importa el sistema de estilos globales encabezado por `src/styles/tokens.css`.
14. `src/App.jsx`: conecta `useAppController()` con `LessonPlayer` (`?view=lesson`), `PracticeView` (`?view=practice`, que recibe `initialLessonId={activeLessonId}`) y `TutorPanel`.
15. `src/styles/tokens.css`: define los tokens visuales de tema claro y oscuro (`--bg`, `--surface`, `--ink`, `--brand`, `--ok`, `--err`) y las familias tipográficas `Newsreader`, `IBM Plex Sans` e `IBM Plex Mono`.
16. `src/views/LessonPlayer.jsx`: renderiza los 7 bloques canónicos de la lección (`contexto`, `desarrollo`, `ejemplo-guiado`, `areas`, `comprobaciones`, `practica`, `resumen`) con el contador de comprobaciones en `#sec-comprobaciones`.
17. `src/views/PracticeView.jsx`: monta el laboratorio interactivo `SqlLab` (`[data-testid="sql-lab"]`) y el explorador de las 13 tablas de Mercado Brisa (`[data-testid="schema-explorer"]`) sobre la lección activa.
18. `src/lab/SqlLab.jsx`: ejecuta las consultas en `DuckDB-Wasm` (`[data-testid="sql-run-btn"]`), califica contra `practice.expected` (`[data-testid="sql-grade-btn"]`) y muestra el banner `[data-testid="sql-grade-box"]` con clases `is-pass` / `is-fail` y tablas de diferencias.
19. `src/lab/sqlGrader.js`: implementa `compareQueryResults(actualResult, expectedResult)` comparando nombres de columnas insensibles a mayúsculas, conteo de filas y valores numéricos con tolerancia `1e-2`.
20. `server/ai/agyRunner.js`: implementa `runAgyPrompt({ prompt, model })` invocando el binario real `agy.exe` en un directorio temporal aislado (`os.tmpdir()`) sin shell (`shell: false`).
21. `server/ai/contextBuilder.js`: construye con `buildContextPrompt` el prompt completo del Tutor IA inyectando título, sección activa, objetivos, contenido de la lección y resumen del esquema de Mercado Brisa.
22. `docs/curriculo/fuentes.md`: establece el catálogo de fuentes primarias recomendadas para el currículo (Codd 1970, Kent 1983, PostgreSQL 17, DuckDB, dbt Core y SQLMesh).
23. `docs/curriculo/perfil-core.md`: define el perfil de egreso del tronco común (Nivel 1), exigiendo dominio de grano, integridad referencial y validación de calidad de datos antes de construir métricas.
24. `src/data/lessons/c1-sql-joins/c1-sql-joins-02-grano-fanout.js`: muestra la estructura de referencia de una lección v2 de Nivel 1 con `workedExample` de 2 pasos sobre `orders` y `order_items` y práctica SQL verificable.

### 2. Ambigüedades detectadas y cómo se resolvieron

1. **Límite de 60 caracteres en `lesson.title` (`LessonSchema`) frente a títulos sugeridos en `modules.js`:**
   - En `src/data/schema/lesson.js` (línea 86), `title` exige `z.string().min(8).max(60)`. Dos títulos sugeridos en `src/data/catalog/modules.js` superaban los 60 caracteres:
     - Lección 03: `'Integridad referencial y detección de huérfanos con ANTI JOIN'` (61 caracteres) -> ajustado a `'Integridad referencial: detectar huérfanos con ANTI JOIN'` (56 caracteres).
     - Lección 04: `'Auditoría de calidad: duplicados, nulos y valores fuera de rango'` (64 caracteres) -> ajustado a `'Auditoría SQL: duplicados, nulos y valores fuera de rango'` (57 caracteres).
   - Con este ajuste, las 5 lecciones pasan `check-content.mjs` con 0 errores. Se documenta en `## Peticiones al orquestador` para sincronizar ambos títulos en `src/data/catalog/modules.js` durante la Fase 4.
2. **Comportamiento real de `product_id = 180` (`SKU-TEST-NEG`) e inactivos en `public/datasets/products.parquet` y `order_items.parquet`:**
   - Al consultar los archivos Parquet reales con `@duckdb/node-api`, se verificó que `product_id = 180` (`sku = 'SKU-TEST-NEG'`, `list_price_usd = -9.99`, `unit_cost_usd = 0.0`, `is_active = false`) tiene exactamente `0` líneas en `order_items.parquet`, mientras que otros `9` productos desactivados (`is_active = false`, `list_price_usd > 0`, `product_id IN (19, 38, 57, 76, 95, 114, 133, 152, 171)`) suman `2 106` líneas históricas en `order_items.parquet` por `344 098.48 USD`. Todas las explicaciones, consultas y `expectedOutput` reflejan los conteos reales de los Parquet.

---

## Pasos

### Paso 1 — Investigación de fuentes primarias (`docs/curriculo/investigacion/c1-modelo.md`)

- Se redactó la sección `§1` de `docs/curriculo/investigacion/c1-modelo.md` con **17 fuentes primarias verificadas** (papers fundacionales de Edgar F. Codd 1970/1971 y William Kent 1983, documentación oficial de PostgreSQL 17, DuckDB Stable, dbt Core y SQLMesh).
- Se verificó programáticamente con `fetch` que las 17 URLs responden `HTTP 200 OK` (sustituyendo el DOI de ACM que devolvía `403` por el PDF académico abierto de UPenn CIS 550 `https://www.seas.upenn.edu/~zives/03f/cis550/codd.pdf`). Cada una de las 5 lecciones cuenta con 3 a 4 fuentes primarias en su campo `sources[]`.

### Paso 2 — Mapa de conceptos y progresión del módulo

- Se documentó en `§2` de `docs/curriculo/investigacion/c1-modelo.md` la secuencia de conceptos nuevos, errores frecuentes y cadenas de prerrequisitos desde `c1-sql-joins-05` hasta `c1-modelo-05-validacion-bloqueante`, conectando hacia adelante con `c2-dimensional-01` y `de3-transformacion-03-contracts-semantic-layer`.

### Paso 3 — Redacción de las 5 lecciones v2

Se crearon las 5 lecciones en `src/data/lessons/c1-modelo/`:
1. `c1-modelo-01-claves-primarias-foraneas.js` (*Claves primarias, naturales, subrogadas y foráneas*, 20 min, 1 137 palabras).
2. `c1-modelo-02-normalizacion-1fn-3fn.js` (*Normalización de 1FN a 3FN: evitar anomalías al actualizar*, 25 min, 1 171 palabras).
3. `c1-modelo-03-integridad-huerfanos.js` (*Integridad referencial: detectar huérfanos con ANTI JOIN*, 20 min, 1 223 palabras).
4. `c1-modelo-04-auditoria-calidad.js` (*Auditoría SQL: duplicados, nulos y valores fuera de rango*, 20 min, 1 141 palabras).
5. `c1-modelo-05-validacion-bloqueante.js` (*Reglas de validación bloqueantes antes de publicar una tabla*, 20 min, 1 083 palabras).

### Paso 4 — Ejecución real de ejemplos y prácticas en DuckDB

- Se ejecutaron las **20 consultas SQL** de las 5 lecciones (`5` en `sections[].example`, `10` en `workedExample.steps[]` y `5` en `practice.solution` / `practice.expected`) contra los 13 archivos Parquet reales de `public/datasets/` usando `@duckdb/node-api`.
- Todas las filas devueltas por DuckDB fueron volcadas literalmente en `expectedOutput` y `expectedOutputTable`.
- Se verificó con `compareQueryResults` (`src/lab/sqlGrader.js`) que en las 5 lecciones el `starterCode` falla la calificación (`passed: false`) y `solution` aprueba (`passed: true`).

### Paso 5 — Términos de glosario nuevos (`docs/curriculo/investigacion/c1-modelo-glossary.json`)

- Se creó `docs/curriculo/investigacion/c1-modelo-glossary.json` con **8 términos nuevos** vinculados a las lecciones de `c1-modelo`:
  1. `primary-key`
  2. `foreign-key`
  3. `surrogate-key`
  4. `natural-key`
  5. `normalizacion-3fn`
  6. `integridad-referencial`
  7. `registro-huerfano`
  8. `regla-validacion-bloqueante`
- Todos los términos pasaron `validateGlossary(data)` (`src/data/schema/glossary.js`) con 0 errores.

### Paso 6 — Proyecto del módulo y prueba real del Tutor IA con `agy` (`runAgyPrompt`)

- Se redactó en `§6` de `docs/curriculo/investigacion/c1-modelo.md` la propuesta completa del proyecto de módulo `c1-modelo-project` (*Suite de auditoría de integridad y calidad sobre el esquema completo de Mercado Brisa*), con enunciado, batería de 8 consultas SQL verificadas contra los Parquet reales (`fallos` reales antes y después del saneamiento WAP) y rúbrica de 4 criterios verificables (escala 0–4).
- Se probó el Tutor IA real ejecutando `buildContextPrompt` (`server/ai/contextBuilder.js`) + `runAgyPrompt` (`server/ai/agyRunner.js`, modelo `gemini-3.8-flash-low`) sobre las 5 lecciones de `c1-modelo`: en el Turno 1 se pidió *"Hazme una pregunta corta para comprobar si entendí la lección"* y en el Turno 2 se respondió mal a propósito con el error típico de la lección. Las respuestas literales de `agy` se documentan en `## Test` (§6).

### Paso 7 — Tabla resumen obligatoria (§9.2) y autoevaluación con la rúbrica de 8 criterios (§9.4)

#### 7.1 Tabla resumen obligatoria del módulo (`§9.2`)

| Lección (`id`) | Palabras | Checks | Prácticas | Fuentes | Puntuación de rúbrica (§9.4) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `c1-modelo-01-claves-primarias-foraneas` | `1 137` (`500` en `sections.body`, `18.5` pal/frase) | `3` (`mcq`, `predict-output`, `fill-code`) | `1` (`sql` sobre `products`, `customers`, `customer_changes`, `orders`, `payments`) | `4` (4 primarias HTTP 200) | **32 / 32** (`4/4` en los 8 criterios) |
| `c1-modelo-02-normalizacion-1fn-3fn` | `1 171` (`545` en `sections.body`, `18.8` pal/frase) | `3` (`mcq`, `mcq`, `order`) | `1` (`sql` sobre `customers` y `orders`) | `3` (3 primarias HTTP 200) | **32 / 32** (`4/4` en los 8 criterios) |
| `c1-modelo-03-integridad-huerfanos` | `1 223` (`564` en `sections.body`, `20.1` pal/frase) | `3` (`predict-output`, `mcq`, `fill-code`) | `1` (`sql` con `ANTI JOIN` sobre `order_items` y `products`) | `3` (3 primarias HTTP 200) | **32 / 32** (`4/4` en los 8 criterios) |
| `c1-modelo-04-auditoria-calidad` | `1 141` (`518` en `sections.body`, `21.6` pal/frase) | `3` (`mcq`, `predict-output`, `fill-code`) | `1` (`sql` con `FILTER` y `UNION ALL` sobre `payments`, `events`, `customers`, `products`) | `3` (3 primarias HTTP 200) | **32 / 32** (`4/4` en los 8 criterios) |
| `c1-modelo-05-validacion-bloqueante` | `1 083` (`501` en `sections.body`, `18.6` pal/frase) | `3` (`mcq`, `mcq`, `order`) | `1` (`sql` de compuerta WAP sobre `payments_silver`, `products_silver`, `order_items`, `orders`) | `4` (4 primarias HTTP 200) | **32 / 32** (`4/4` en los 8 criterios) |
| **Total / Promedio** | **`5 755` (`1 151` media)** | **`15` checks** | **`5` prácticas SQL verificables** | **`17` fuentes HTTP 200** | **32.0 / 32** |

#### 7.2 Matriz de autoevaluación de las 8 dimensiones de la rúbrica `§9.4` (escala 0–4; mínimo exigido: 3)

| Dimensión `§9.4` | L01 Claves PK/FK | L02 1FN–3FN | L03 Huérfanos | L04 Auditoría SQL | L05 Compuerta WAP | Evidencia verificable |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **1. Objetivo claro** | 4 | 4 | 4 | 4 | 4 | Cada lección declara 3 objetivos con verbos medibles (`Distinguir`, `Verificar`, `Aplicar`, `Escribir`, `Perfilar`, `Implementar`) alineados con los 3 `checks` y la práctica SQL. |
| **2. Progresión** | 4 | 4 | 4 | 4 | 4 | Secuencia sin saltos desde `c1-sql-joins-05`: identidad de fila y claves (L01) → dependencias funcionales 1FN–3FN (L02) → integridad referencial y `ANTI JOIN` (L03) → perfilado de duplicados/nulos/rango (L04) → compuerta bloqueante WAP (L05). |
| **3. Ejemplo concreto** | 4 | 4 | 4 | 4 | 4 | Las 20 consultas SQL operan sobre las tablas reales de Mercado Brisa (`customer_changes`, `stores`, `orders`, `order_items`, `products`, `payments`, `events`, `customers`) con resultados exactos de DuckDB. |
| **4. Error típico** | 4 | 4 | 4 | 4 | 4 | Cada `workedExample` contrasta el error real (usar `customer_id` como PK en historial, repetir atributos de tienda en `orders`, usar `NOT IN` con `NULL` o `INNER JOIN` con inactivos, deduplicar `payments` por `order_id`, publicar sin auditar en Silver) frente a su solución. |
| **5. Práctica** | 4 | 4 | 4 | 4 | 4 | En las 5 prácticas SQL, `starterCode` falla la calificación (`is-fail`) y `solution` aprueba (`is-pass`) tanto en Node (`compareQueryResults`) como en `DuckDB-Wasm` en el navegador. |
| **6. Brevedad** | 4 | 4 | 4 | 4 | 4 | `sections[].body` entre `500` y `564` palabras (dentro del rango `[380, 750]` de Nivel 1) y longitud media de frase entre `18.5` y `21.6` palabras/frase (`<= 22.0`). |
| **7. Precisión** | 4 | 4 | 4 | 4 | 4 | 17 fuentes primarias verificadas con `HTTP 200` (Codd 1970/1971, Kent 1983, PostgreSQL 17, DuckDB Stable, dbt Core y SQLMesh) y conteos idénticos a los archivos Parquet. |
| **8. Tono** | 4 | 4 | 4 | 4 | 4 | `0` hallazgos en `check-copy.mjs`: español directo en segunda persona (`tú`), sin jerga vacía, sin emojis, sin `"2026"` en prosa y máximo 1–2 negritas por párrafo. |

---

## Test

### 1. Validación de contenido (`node scripts/check-content.mjs --module c1-modelo`)

```text
=== Validación de contenido v2 (check-content) ===
Lección (id v2)                                | Módulo               | Niv  | Sec  | Chk  | Src  | Palabras  | Estado    
--------------------------------------------------------------------------------------------------------------------------
c1-modelo-01-claves-primarias-foraneas         | c1-modelo            | 1    | 4    | 3    | 4    | 1137      | OK        
c1-modelo-02-normalizacion-1fn-3fn             | c1-modelo            | 1    | 4    | 3    | 3    | 1171      | OK        
c1-modelo-03-integridad-huerfanos              | c1-modelo            | 1    | 4    | 3    | 3    | 1223      | OK        
c1-modelo-04-auditoria-calidad                 | c1-modelo            | 1    | 4    | 3    | 3    | 1141      | OK        
c1-modelo-05-validacion-bloqueante             | c1-modelo            | 1    | 4    | 3    | 4    | 1083      | OK        
--------------------------------------------------------------------------------------------------------------------------
Resumen: 5 lecciones inspeccionadas | 5 válidas | 0 con advertencias (needsReview) | 0 con errores.

Resultado: OK (0 errores de esquema o integridad).
```

### 2. Auditoría de copy (`node scripts/check-copy.mjs --path src/data/lessons/c1-modelo --path docs/curriculo/investigacion/c1-modelo.md`)

```text
=== Auditoría anti-slop de copy (check-copy) ===
Archivos escaneados: 5

0 hallazgos de términos prohibidos, emojis, "2026" o exceso de negritas.
Total de hallazgos: 0
```
*(Ninguna de las 5 lecciones de `c1-modelo` supera el umbral de 22 palabras/frase de media en `sections[].body`).*

### 3. Validación de esquema de glosario (`validateGlossary`)

```text
OK 8 terms validated with GlossaryTermSchema (0 errors)
```

### 4. Verificación de ejecución SQL y calificador (`compareQueryResults` sobre DuckDB)

```text
c1-modelo-01-claves-primarias-foraneas:
  starterCode -> passed: false (Filas esperadas: 5 · Filas obtenidas: 4. 2 fila(s) esperada(s) no aparecen en tu resultado. 1 fila(s) de tu resultado no coinciden con la referencia.)
  solution    -> passed: true (Resultado verificado: 5 fila(s) y 5 columna(s) coinciden con la referencia.)
  expectedOutputTable exact match: true
  section[claves-naturales-frente-a-subrogadas].example exact match: true (2 rows)
  workedExample[Paso 1: Inspecc...] exact match: true (5 rows)
  workedExample[Paso 2: Verific...] exact match: true (1 rows)
c1-modelo-02-normalizacion-1fn-3fn:
  starterCode -> passed: false (10 fila(s) esperada(s) no aparecen en tu resultado. 10 fila(s) de tu resultado no coinciden con la referencia.)
  solution    -> passed: true (Resultado verificado: 10 fila(s) y 5 columna(s) coinciden con la referencia.)
  expectedOutputTable exact match: true
  section[primera-y-segunda-forma-normal].example exact match: true (5 rows)
  workedExample[Paso 1: Medir e...] exact match: true (5 rows)
  workedExample[Paso 2: Auditar...] exact match: true (5 rows)
c1-modelo-03-integridad-huerfanos:
  starterCode -> passed: false (Filas esperadas: 9 · Filas obtenidas: 179. 170 fila(s) de tu resultado no coinciden con la referencia.)
  solution    -> passed: true (Resultado verificado: 9 fila(s) y 6 columna(s) coinciden con la referencia.)
  expectedOutputTable exact match: true
  section[tres-patrones-sql-para-detectar-huerfanos].example exact match: true (2 rows)
  workedExample[Paso 1: Comprob...] exact match: true (1 rows)
  workedExample[Paso 2: Clasifi...] exact match: true (1 rows)
c1-modelo-04-auditoria-calidad:
  starterCode -> passed: false (Filas esperadas: 4 · Filas obtenidas: 183. 1 fila(s) esperada(s) no aparecen en tu resultado. 180 fila(s) de tu resultado no coinciden con la referencia.)
  solution    -> passed: true (Resultado verificado: 4 fila(s) y 3 columna(s) coinciden con la referencia.)
  expectedOutputTable exact match: true
  section[duplicados-webhook-frente-a-reintentos-legitimos].example exact match: true (3 rows)
  workedExample[Paso 1: Auditar...] exact match: true (6 rows)
  workedExample[Paso 2: Aislar ...] exact match: true (1 rows)
c1-modelo-05-validacion-bloqueante:
  starterCode -> passed: false (2 fila(s) esperada(s) no aparecen en tu resultado. 2 fila(s) de tu resultado no coinciden con la referencia.)
  solution    -> passed: true (Resultado verificado: 4 fila(s) y 3 columna(s) coinciden con la referencia.)
  expectedOutputTable exact match: true
  section[contrato-asercion-cero-filas].example exact match: true (1 rows)
  workedExample[Paso 1: Ejecuta...] exact match: true (3 rows)
  workedExample[Paso 2: Aplicar...] exact match: true (3 rows)
```

### 5. Build de producción (`npm run build`)

```text
> grano@1.0.0 build
> vite build

vite v6.4.5 building for production...
✓ 2349 modules transformed.
dist/index.html                                  1.00 kB │ gzip:   0.51 kB
dist/assets/index-Ds05HJQs.css                 236.89 kB │ gzip:  32.06 kB
dist/assets/PracticeView-vAY11GNU.js             8.32 kB │ gzip:   2.85 kB
dist/assets/curriculum-stages-BHOHuqmu.js      285.16 kB │ gzip:  95.09 kB
dist/assets/SqlLab-DfT0IuQ0.js                 389.73 kB │ gzip: 127.31 kB
dist/assets/vendor-CMuuJwVt.js                 558.99 kB │ gzip: 155.51 kB
dist/assets/index-Cuw7xNLT.js                1,149.95 kB │ gzip: 338.69 kB
✓ built in 1m 43s
```

### 6. Prueba real del Tutor IA con `agy` (`runAgyPrompt` · `gemini-3.8-flash-low`) en las 5 lecciones

Se ejecutó `run-real-agy-tutor.mjs` invocando `buildContextPrompt` (`server/ai/contextBuilder.js`) + `runAgyPrompt` (`server/ai/agyRunner.js`) en las 5 lecciones: en el Turno 1 se pidió *"Hazme una pregunta corta para comprobar si entendí la lección"* y en el Turno 2 se envió una respuesta errónea a propósito:

| Lección (`id`) | Latencia Turno 1 / Turno 2 | Pregunta formulada por `agy` (Turno 1) | Respuesta errónea enviada a propósito (Turno 2) | Respuesta real de `agy` corrigiendo el error (extracto literal) |
| :--- | :---: | :--- | :--- | :--- |
| `c1-modelo-01-claves-primarias-foraneas` | `10 828 ms` / `21 693 ms` | *"En la tabla `orders` de Mercado Brisa tienes las columnas `order_id` y `customer_id`. Si un cliente puede hacer varias compras a lo largo del tiempo, ¿cuál de esas dos columnas puede actuar como clave primaria (`PRIMARY KEY`) de la tabla y qué dos condiciones obligatorias debe cumplir para serlo?"* | *"Creo que `customer_id` es la clave primaria perfecta de la tabla `customer_changes` porque nunca tiene valores `NULL`, y que en `orders` la columna `customer_id` no puede repetirse."* | *"No exactamente, hay dos puntos importantes que debes corregir: Primero, en la tabla `orders`, un cliente puede hacer varias compras. Por lo tanto, `customer_id` sí se repite (una fila por cada pedido que haga). La clave primaria de `orders` es `order_id`... Segundo, para ser clave primaria no basta con no tener valores `NULL`. Debe cumplir dos condiciones al mismo tiempo: 1. Obligatoriedad (`NOT NULL`)... 2. Unicidad (`UNIQUE`)... En `customer_changes` se guarda el historial de cambios de los clientes. Si un cliente cambia de ciudad dos veces, tendrá más de una fila con el mismo `customer_id`, por lo que allí tampoco es único."* |
| `c1-modelo-02-normalizacion-1fn-3fn` | `16 373 ms` / `10 785 ms` | *"Imagina que en Mercado Brisa guardamos los pedidos y los datos de los clientes en una única tabla llamada `orders_con_clientes`. Si un cliente cancela su única compra y borramos esa fila de la tabla, ¿qué tipo de anomalía ocurre y qué problema nos causa?"* | *"Entendí que guardar `unit_price_usd` dentro de `order_items` viola la Tercera Forma Normal (3FN) porque el precio ya existe en `products.list_price_usd` y deberíamos borrarlo de `order_items`."* | *"Es una confusión muy común, pero no viola la 3FN. En `products`, el precio representa el valor actual de catálogo. Ese valor cambia con el tiempo por promociones, inflación o decisiones comerciales. En cambio, `item_price_usd` en `order_items` representa un hecho histórico: el precio exacto al que se vendió ese producto en ese instante concreto. Si borraras ese campo de `order_items` y consultaras el precio haciendo una unión con `products`, las ventas del pasado cambiarían cada vez que actualices el catálogo. Perderías la precisión contable de lo que el cliente pagó realmente."* |
| `c1-modelo-03-integridad-huerfanos` | `7 214 ms` / `6 456 ms` | *"Imagina que en Mercado Brisa llega un pago a la tabla `payments` con `order_id = 450`, pero en la tabla `orders` todavía no existe ninguna fila con ese identificador. 1. ¿Cómo se llama técnicamente esa fila de `payments`? 2. ¿Por qué ocurre este desfase en un almacén de datos si en la base operativa no se permitiría?"* | *"Para encontrar clientes sin eventos ejecuté `WHERE customer_id NOT IN (SELECT customer_id FROM events)` y como devolvió 0 filas significa que ningún cliente carece de eventos."* | *"Cuidado, esa conclusión puede ser falsa debido a una trampa clásica de SQL con los valores nulos. Si en la tabla `events` hay al menos una fila con `customer_id IS NULL` (por ejemplo, eventos de usuarios anónimos que aún no inician sesión), la subconsulta devuelve ese `NULL`. Cuando el motor evalúa `customer_id NOT IN (..., NULL)` la comparación se transforma internamente en `customer_id <> ... AND customer_id <> NULL`. En SQL, cualquier comparación directa con `NULL` no da ni verdadero ni falso, sino `UNKNOWN`... Por eso la consulta devuelve 0 filas, aunque existan muchos clientes sin ningún evento."* |
| `c1-modelo-04-auditoria-calidad` | `6 936 ms` / `6 997 ms` | *"Ambos intentos comparten el mismo `order_id`. Si quieres comprobar que no existan duplicados accidentales causados por un reenvío de red o webhook, ¿por qué columna debes agrupar para contar repeticiones: por `order_id` o por `idempotency_key`?"* | *"Para limpiar los pagos duplicados en `payments` basta con agrupar por `order_id` y quedarnos con una sola fila por pedido, y `COUNT(postal_code)` en `customers` ya descarta los códigos postales truncados de 2 caracteres."* | *"Ojo con ambas conclusiones, porque esconden dos errores comunes de auditoría. Primero, en `payments`, agrupar por `order_id` y dejar una sola fila borraría reintentos legítimos de negocio (por ejemplo, un pago rechazado y otro aprobado para la misma orden). Para detectar duplicados técnicos causados por reenvíos de red o webhooks, debes agrupar por `idempotency_key`... Segundo, `COUNT(postal_code)` no descarta códigos postales truncados de 2 caracteres. Lo único que hace `COUNT(columna)` es ignorar los valores `NULL`; cualquier texto no nulo, incluso de 2 caracteres, lo cuenta como válido."* |
| `c1-modelo-05-validacion-bloqueante` | `6 223 ms` / `6 903 ms` | *"Quieres validar en la tabla `order_items` que ninguna fila tenga una cantidad (`quantity`) menor o igual a cero ni nula. Bajo el contrato de aserción de dbt o SQLMesh, ¿cuál de estas dos consultas deberías usar como prueba de calidad: `WHERE quantity > 0` o `WHERE quantity IS NULL OR quantity <= 0`?"* | *"En una prueba bloqueante de dbt para validar precios positivos debo escribir `SELECT * FROM products WHERE list_price_usd > 0` para que devuelva los 179 productos válidos y apruebe."* | *"No, es justo al revés. Ese es el malentendido más común en este nivel. En dbt y SQLMesh, la prueba busca las filas culpables (los registros que rompen la regla), no los casos correctos: Si la consulta devuelve 0 filas, la prueba aprueba (`PASS`). Si devuelve 1 o más filas, la prueba falla (`FAIL` / `BLOCKED`). Si escribes `WHERE unit_price_usd > 0`, la consulta devolverá los 179 productos válidos. Al recibir 179 filas, dbt asumirá que hay 179 errores y bloqueará la publicación de tu tabla."* |

---

## Revisión propia

Durante la construcción y auditoría del módulo se detectaron y corrigieron **6 defectos reales**:

1. **URL de DOI de ACM bloqueada con HTTP 403 (`docs/curriculo/investigacion/c1-modelo.md` y lecciones 01/02):**
   - *Antes:* `https://dl.acm.org/doi/10.1145/362384.362685` devolvió `HTTP 403 Forbidden` ante peticiones automatizadas.
   - *Corrección:* Se reemplazó por el PDF académico abierto de UPenn CIS 550 (`https://www.seas.upenn.edu/~zives/03f/cis550/codd.pdf`), verificando que las 17 fuentes del módulo respondan `HTTP 200 OK`.
2. **Longitud de `checks[2].explanation` inferior a 20 palabras (`src/data/lessons/c1-modelo/c1-modelo-04-auditoria-calidad.js:263`):**
   - *Antes:* `'Para filtrar grupos después de aplicar GROUP BY idempotency_key, se utiliza la cláusula HAVING COUNT(*) > 1.'` (16 palabras, rechazado por `check-content.mjs`).
   - *Corrección:* Se amplió a 30 palabras explicando por qué `WHERE` no admite funciones de agregación y filtra filas antes de agrupar.
3. **Exceso de negritas en un mismo bloque en lista numerada (`src/data/lessons/c1-modelo/c1-modelo-04-auditoria-calidad.js:24`):**
   - *Antes:* Los cuatro ítems numerados (`1. **Unicidad**... 4. **Validez de rango**...`) estaban separados por `\n` simple, por lo que `check-copy.mjs` los evaluó como un único párrafo con 4 negritas (`> 3`).
   - *Corrección:* Se separaron los ítems con doble salto de línea `\n\n`, dejando 1 negrita por párrafo y 0 hallazgos en `check-copy.mjs`.
4. **Término prohibido `Desbloquear` en el título de la práctica 05 (`src/data/lessons/c1-modelo/c1-modelo-05-validacion-bloqueante.js:258`):**
   - *Antes:* `title: 'Desbloquear la compuerta WAP saneando payments_silver y products_silver'` activó la regla anti-slop `desbloquea / desbloquear`.
   - *Corrección:* Se sustituyó por `title: 'Superar la compuerta WAP saneando payments_silver y products_silver'`.
5. **Longitud media de frase ligeramente superior a 22 palabras/frase en lecciones 01, 02 y 05:**
   - *Antes:* Las lecciones 01 (`23.2`), 02 (`23.5`) y 05 (`23.4`) superaban por ~1.3 palabras el umbral de 22 palabras/frase de `check-copy.mjs`.
   - *Corrección:* Se dividieron las oraciones subordinadas largas en dos frases independientes en `c1-modelo-01-claves-primarias-foraneas.js:24-29`, `c1-modelo-02-normalizacion-1fn-3fn.js:24` y `c1-modelo-05-validacion-bloqueante.js:58-63`, logrando que ninguna de las 5 lecciones aparezca en la lista de exceso de longitud de frase.
6. **Encuadre vertical de la tabla de resultados en capturas de práctica de las lecciones 04 y 05:**
   - *Antes:* Al tener consultas SQL de 24 y 46 líneas, hacer scroll a `[data-testid="sql-run-btn"]` dejaba la tabla `[data-testid="sql-results-table"]` justo debajo del borde inferior de `720px` en las capturas de las lecciones 04 y 05.
   - *Corrección:* Se ajustó el encuadre hacia `[data-testid="sql-results-table"]` y se recapturaron ambas imágenes, verificando con `read_file` que el código final, la barra de botones, el banner verde `Práctica superada` y las filas de resultado se vean completos.

---

## Prueba adversarial

| Caso | Entrada | Resultado esperado | Resultado real |
| :--- | :--- | :--- | :--- |
| **1. Calificación de `starterCode` sin modificar en las 5 lecciones** | Pulsar `Comprobar resultado` (`[data-testid="sql-grade-btn"]`) con el `starterCode` inicial en `c1-modelo-01`..`05` tanto en Node (`compareQueryResults`) como en `DuckDB-Wasm`. | Las 5 prácticas deben rechazar el `starterCode` (`passed: false`, banner `.is-fail`) y mostrar las filas faltantes/sobrantes en `[data-testid="sql-grade-box"]`. | En las 5 lecciones devolvió `passed: false` (`El resultado aún no coincide con la referencia`) con tabla de diferencias (`W-c1-modelo_c1-modelo-04-auditoria-calidad_starter-fail_1280x720_light.png`). |
| **2. Trampa de lógica trivalente `NOT IN` con `NULL` en `events`** | Ejecutar `SELECT COUNT(*) FROM customers WHERE customer_id NOT IN (SELECT customer_id FROM events)` sobre `events.parquet` (`6 715` filas con `customer_id IS NULL`). | `NOT IN` evalúa a `UNKNOWN` y devuelve `0` filas; `ANTI JOIN` y `NOT EXISTS` aíslan los clientes sin eventos sin verse afectados por los `NULL`. | `NOT IN` devolvió `0` filas en DuckDB; `ANTI JOIN` y `NOT EXISTS` operaron correctamente sin perder filas por culpa de los `6 715` nulos. |
| **3. Cruce contra catálogo activo (`is_active = TRUE`) frente a SKU negativo (`SKU-TEST-NEG`)** | Ejecutar `INNER JOIN products WHERE is_active = TRUE` desde `order_items` frente a `ANTI JOIN` y filtro de rango `WHERE list_price_usd <= 0` en `products`. | El `INNER JOIN` descarta silenciosamente las ventas de los 9 productos inactivos (`2 106` líneas = `344 098.48 USD`), mientras que el filtro de dominio aísla `product_id = 180` (`SKU-TEST-NEG`, `-9.99 USD`, `0` líneas en `order_items`). | Verificado en DuckDB: `2 106` líneas huérfanas de catálogo activo (`344 098.48 USD`) detectadas con `ANTI JOIN` en L03, y `SKU-TEST-NEG` (`-9.99 USD`) aislado en L04 y L05. |
| **4. Deduplicación errónea por `order_id` frente a `idempotency_key` en `payments`** | Agrupar `payments` (`19 200` filas para `18 000` pedidos) por `order_id` en vez de por `idempotency_key`. | Agrupar por `order_id` destruye los `750` segundos intentos legítimos (`attempt_number = 2`); agrupar por `idempotency_key` aísla exactamente las `450` copias de webhook (`405` `captured` = `168 674.63 USD`, `27` `failed`, `18` `pending`). | Verificado en DuckDB y en el `workedExample` de L04 y L05: `19 200 - 18 750 = 450` duplicados técnicos de red. |
| **5. Viewports extremos (`375×667`, `390×844`, `768×1024`, `1920×1080`) y tema oscuro** | Redimensionar Playwright a móvil (`375×667` y `390×844`), tablet (`768×1024`) y escritorio (`1280×720` y `1920×1080`) en temas `light` y `dark`. | `document.documentElement.scrollWidth <= document.documentElement.clientWidth` (`overflow: false`), `0` errores de consola y `0` errores de página. | `horizontal overflow: false` en todos los viewports, `Console errors: 0`, `Page errors: 0` (`W-c1-modelo_c1-modelo-01-claves-primarias-foraneas_cabecera_390x844_light.png` y `*_dark.png`). |
| **6. Respuestas falsas enviadas a propósito al Tutor IA real (`agy`) en las 5 lecciones** | Invocar `runAgyPrompt` (`server/ai/agyRunner.js`) en las 5 lecciones enviando afirmaciones falsas diseñadas para inducir complacencia del modelo. | El Tutor IA debe refutar las 5 afirmaciones falsas explicando la causa técnica sobre las tablas de Mercado Brisa. | En las 5 lecciones `agy` (`gemini-3.8-flash-low`) refutó el error del alumno con ejemplos SQL sobre Mercado Brisa (ver tabla en `## Test` §6). |

---

## Capturas antes / después

Se generaron en Playwright e inspeccionaron visualmente con `read_file` **14 capturas PNG reales** almacenadas en disco en `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-c1-modelo\` (no incluidas en el commit de git para respetar la lista estricta de archivos en propiedad):

1. `docs/reportes/capturas/W-c1-modelo/W-c1-modelo_c1-modelo-01-claves-primarias-foraneas_cabecera_1280x720_light.png` (125 676 bytes)
2. `docs/reportes/capturas/W-c1-modelo/W-c1-modelo_c1-modelo-01-claves-primarias-foraneas_practica_1280x720_light.png` (91 788 bytes)
3. `docs/reportes/capturas/W-c1-modelo/W-c1-modelo_c1-modelo-01-claves-primarias-foraneas_cabecera_1280x720_dark.png` (126 737 bytes)
4. `docs/reportes/capturas/W-c1-modelo/W-c1-modelo_c1-modelo-01-claves-primarias-foraneas_cabecera_390x844_light.png` (62 428 bytes)
5. `docs/reportes/capturas/W-c1-modelo/W-c1-modelo_c1-modelo-02-normalizacion-1fn-3fn_cabecera_1280x720_light.png` (128 450 bytes)
6. `docs/reportes/capturas/W-c1-modelo/W-c1-modelo_c1-modelo-02-normalizacion-1fn-3fn_practica_1280x720_light.png` (119 966 bytes)
7. `docs/reportes/capturas/W-c1-modelo/W-c1-modelo_c1-modelo-03-integridad-huerfanos_cabecera_1280x720_light.png` (128 555 bytes)
8. `docs/reportes/capturas/W-c1-modelo/W-c1-modelo_c1-modelo-03-integridad-huerfanos_practica_1280x720_light.png` (120 585 bytes)
9. `docs/reportes/capturas/W-c1-modelo/W-c1-modelo_c1-modelo-04-auditoria-calidad_cabecera_1280x720_light.png` (133 340 bytes)
10. `docs/reportes/capturas/W-c1-modelo/W-c1-modelo_c1-modelo-04-auditoria-calidad_starter-fail_1280x720_light.png` (102 125 bytes)
11. `docs/reportes/capturas/W-c1-modelo/W-c1-modelo_c1-modelo-04-auditoria-calidad_practica_1280x720_light.png` (88 471 bytes)
12. `docs/reportes/capturas/W-c1-modelo/W-c1-modelo_c1-modelo-05-validacion-bloqueante_cabecera_1280x720_light.png` (126 247 bytes)
13. `docs/reportes/capturas/W-c1-modelo/W-c1-modelo_c1-modelo-05-validacion-bloqueante_practica_1280x720_light.png` (73 523 bytes)
14. `docs/reportes/capturas/W-c1-modelo/W-c1-modelo_c1-modelo-05-validacion-bloqueante_practica_1280x720_dark.png` (74 084 bytes)

---

## Peticiones al orquestador

1. **Integración de glosario en Fase 4:** Fusionar los 8 términos validados de `docs/curriculo/investigacion/c1-modelo-glossary.json` (`primary-key`, `foreign-key`, `surrogate-key`, `natural-key`, `normalizacion-3fn`, `integridad-referencial`, `registro-huerfano`, `regla-validacion-bloqueante`) en `src/data/glossary.js`.
2. **Integración de proyecto de módulo en Fase 4:** Incorporar la especificación y rúbrica de `c1-modelo-project` documentada en `docs/curriculo/investigacion/c1-modelo.md` (§6) dentro del catálogo de proyectos.
3. **Sincronización de títulos de lecciones 03 y 04 en `src/data/catalog/modules.js`:** Actualizar en `src/data/catalog/modules.js` los títulos planificados de `c1-modelo-03` (`'Integridad referencial: detectar huérfanos con ANTI JOIN'`, 56 chars) y `c1-modelo-04` (`'Auditoría SQL: duplicados, nulos y valores fuera de rango'`, 57 chars) para que respeten el límite `max(60)` de `LessonSchema`.
4. **Lectura de `lesson.aiContext` en `server/ai/contextBuilder.js`:** En `server/ai/contextBuilder.js` (línea 211), añadir `lesson?.aiContext` como primera prioridad en `const aiNotes = lesson?.aiContext || lesson?.aiNotes || ...` para que el servidor inyecte directamente el campo `aiContext` del esquema v2.

---

## Pendiente

Ninguno. Las 5 lecciones de `c1-modelo`, el documento de investigación, el archivo JSON de glosario, las 14 capturas reales y este reporte están completos y verificados con 0 errores.
