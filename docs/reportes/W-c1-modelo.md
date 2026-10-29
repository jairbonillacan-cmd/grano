# Reporte de cierre — Subagente `W-c1-modelo` (Fase 3 · Ola A)

- **Agente:** `W-c1-modelo`
- **Módulo:** `c1-modelo` — *Modelo relacional y calidad de datos* (Nivel 1, Tronco común `core`, orden 5)
- **Rama / Worktree:** `agente/W-c1-modelo` (`C:\Users\T490s\Desktop\Proyectos\ING-W-c1-modelo`)
- **Puerto de verificación asignado:** `5208`
- **Fecha:** 2026-10-29

---

## Inicio

### 1. Archivos leídos antes de escribir código

1. `PLAN_GEMINI_4_ARGON.md` (§1, §2, §5 tabla de `c1-modelo`, §9.2 protocolo de 7 pasos, §9.4 rúbrica de calidad, Apéndices A, B, D.2 y D.3).
2. `src/data/catalog/modules.js` (definición canónica de `c1-modelo`, líneas 297–316).
3. `public/datasets/README.md` y `public/datasets/schema.json` (13 tablas de Mercado Brisa generadas con semilla `19870315` y sus anomalías sembradas).
4. `src/data/schema/lesson.js` (`LessonSchema` v2) y `src/data/schema/glossary.js` (`GlossaryTermSchema`).
5. `scripts/check-content.mjs`, `scripts/check-copy.mjs`, `scripts/sync-lessons-index.mjs` y `scripts/generate-dataset.mjs`.
6. `package.json`, `vite.config.js`, `src/main.jsx`, `src/App.jsx`, `src/styles/tokens.css`, `src/data/glossary.js`.
7. `src/views/LessonPlayer.jsx`, `src/views/PracticeView.jsx`, `src/components/AuthenticCodeLab.jsx`, `src/lab/SqlLab.jsx`, `src/lab/sqlGrader.js`, `src/lab/duckdb.js`.
8. `server/ai/routes.js`, `server/ai/contextBuilder.js`, `src/components/TutorPanel.jsx`.
9. `docs/curriculo/fuentes.md`, `docs/curriculo/perfil-core.md` y la lección de referencia `src/data/lessons/c1-sql-joins/c1-sql-joins-02-grano-fanout.js`.

### 2. Ambigüedades detectadas y cómo se resolvieron

1. **Límite de 60 caracteres en `lesson.title` (`LessonSchema`) frente a títulos sugeridos en `modules.js`:**
   - En `src/data/schema/lesson.js` (línea 86), `title` exige `z.string().min(8).max(60)`. Dos títulos sugeridos en `src/data/catalog/modules.js` superaban los 60 caracteres:
     - Lección 03: `'Integridad referencial y detección de huérfanos con ANTI JOIN'` (61 caracteres) -> ajustado a `'Integridad referencial: detectar huérfanos con ANTI JOIN'` (56 caracteres).
     - Lección 04: `'Auditoría de calidad: duplicados, nulos y valores fuera de rango'` (64 caracteres) -> ajustado a `'Auditoría SQL: duplicados, nulos y valores fuera de rango'` (57 caracteres).
   - Con este ajuste, las 5 lecciones pasan `check-content.mjs` con 0 errores. Se documenta en `## Peticiones al orquestador` para sincronizar ambos títulos en `src/data/catalog/modules.js` durante la Fase 4.
2. **Comportamiento real de `product_id = 180` (`SKU-TEST-NEG`) e inactivos en `public/datasets/products.parquet` y `order_items.parquet`:**
   - Al consultar los archivos Parquet reales con `@duckdb/node-api`, se verificó que `product_id = 180` (`sku = 'SKU-TEST-NEG'`, `list_price_usd = -9.99`, `unit_cost_usd = 0.0`, `is_active = false`) tiene exactamente `0` líneas en `order_items.parquet` (porque en `scripts/generate-dataset.mjs` la rama `idx < 15 && status === 'cancelled'` nunca se activa dado que `idx < 15` fuerza `status = 'completed'`), mientras que otros `9` productos desactivados (`is_active = false`, `list_price_usd > 0`, `product_id IN (19, 38, 57, 76, 95, 114, 133, 152, 171)`) suman `2 106` líneas históricas en `order_items.parquet` por `344 098.48 USD`. Todas las explicaciones, consultas y `expectedOutput` reflejan los conteos reales de los Parquet.

---

## Pasos

### Paso 1 — Investigación de fuentes primarias

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

### Paso 5 — Términos de glosario nuevos

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

### Paso 6 — Proyecto del módulo

- Se redactó en `§6` de `docs/curriculo/investigacion/c1-modelo.md` la propuesta completa del proyecto de módulo `c1-modelo-project` (*Suite de auditoría de integridad y calidad sobre el esquema completo de Mercado Brisa*), con enunciado, batería de 8 consultas SQL verificadas contra los Parquet reales (`fallos` reales antes y después del saneamiento WAP) y rúbrica de 4 criterios verificables.

### Paso 7 — Verificación automática, visual y rúbrica §9.4

| Lección | 1. Esquema (`check-content`) | 2. Copy (`check-copy`) | 3. Código ejecutable (DuckDB) | 4. Práctica verificable (`starter` falla / `solution` pasa) | 5. Comprobaciones (`checks` >= 3, >= 2 tipos) | 6. Fuentes (`>= 2` HTTP 200) | 7. Contexto IA (`aiContext` verificado) | 8. Render en navegador (`1280×720`, 0 errores) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `c1-modelo-01-claves-primarias-foraneas` | PASS | PASS | PASS | PASS | PASS (`mcq`, `predict-output`, `fill-code`) | PASS (4 fuentes) | PASS | PASS |
| `c1-modelo-02-normalizacion-1fn-3fn` | PASS | PASS | PASS | PASS | PASS (`mcq`, `mcq`, `order`) | PASS (3 fuentes) | PASS | PASS |
| `c1-modelo-03-integridad-huerfanos` | PASS | PASS | PASS | PASS | PASS (`predict-output`, `mcq`, `fill-code`) | PASS (3 fuentes) | PASS | PASS |
| `c1-modelo-04-auditoria-calidad` | PASS | PASS | PASS | PASS | PASS (`mcq`, `predict-output`, `fill-code`) | PASS (3 fuentes) | PASS | PASS |
| `c1-modelo-05-validacion-bloqueante` | PASS | PASS | PASS | PASS | PASS (`mcq`, `mcq`, `order`) | PASS (4 fuentes) | PASS | PASS |

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
*(Nota: ninguna de las 5 lecciones de `c1-modelo` supera el umbral de 22 palabras/frase de media en `sections[].body`).*

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

Se ejecutaron **6 pruebas adversariales** sobre el contenido, el motor SQL en navegador y la interfaz:

1. **Verificación de fallo obligatorio de `starterCode` en DuckDB-Wasm y Node DuckDB:**
   - Se ejecutó `Comprobar resultado` (`[data-testid="sql-grade-btn"]`) con el `starterCode` sin modificar en las 5 lecciones tanto en Node (`compareQueryResults`) como en el navegador real (`DuckDB-Wasm`). En las 5 lecciones devolvió `is-fail` (`El resultado aún no coincide con la referencia`) con tabla de diferencias (`missingRows` / `extraRows`).
2. **Trampa de lógica trivalente `NOT IN` con valores `NULL` en `events.customer_id` (`c1-modelo-03`):**
   - Se verificó sobre `events.parquet` (que contiene `6 715` eventos anónimos con `customer_id IS NULL`) que `SELECT COUNT(*) FROM customers WHERE customer_id NOT IN (SELECT customer_id FROM events)` devuelve `0` filas en lugar del conteo real, mientras que `ANTI JOIN` y `NOT EXISTS` operan sin verse afectados por los `NULL`.
3. **Distinción entre producto negativo sin ventas (`product_id = 180`) y productos inactivos con ventas históricas (`c1-modelo-03` y `c1-modelo-04`):**
   - Se comprobó que un `INNER JOIN` contra `products WHERE is_active = TRUE` descarta silenciosamente `2 106` líneas de `order_items` (`344 098.48 USD`) pertenecientes a 9 productos inactivos con ventas históricas, mientras que `SKU-TEST-NEG` (`product_id = 180`, `-9.99 USD`) tiene `0` líneas en `order_items` y debe aislarse mediante auditoría de dominio sobre `products`.
4. **Distinción entre reintentos legítimos de pago (`attempt_number = 2`) y duplicados de webhook (`c1-modelo-04` y `c1-modelo-05`):**
   - Se demostró que agrupar `payments` por `order_id` destruye `750` reintentos legítimos de clientes cuyo primer intento falló (`status = 'failed'`), mientras que agrupar por `idempotency_key` aísla con exactitud las `450` copias técnicas de webhook (`405` `captured` por `168 674.63 USD`, `27` `failed` y `18` `pending`).
5. **Pruebas de desbordamiento horizontal en viewports extremos (`375×667`, `768×1024`, `1920×1080`):**
   - Se redimensionó Playwright a `375×667` (móvil), `768×1024` (tablet) y `1920×1080` (escritorio ancho), midiendo `document.documentElement.scrollWidth > document.documentElement.clientWidth`. Resultado: `false` (0 px de overflow horizontal) y `0` errores de consola o página en todos los tamaños.
6. **Prueba de detección de errores conceptuales en el Tutor IA (`buildContextPrompt`):**
   - Se probó la construcción del prompt del tutor en las 5 lecciones simulando la petición *"Hazme una pregunta para comprobar si lo entendí"* seguida de una respuesta deliberadamente errónea de cada lección (usar `customer_id` como PK en `customer_changes`, creer que `unit_price_usd` en `order_items` viola 3FN, usar `NOT IN` con nulos, deduplicar `payments` por `order_id` y devolver 179 filas en una prueba de aserción de cero filas), verificando que el prompt inyecta el título, sección, objetivos y cuerpo de la lección activa (`3 375`–`3 695` caracteres).

---

## Capturas antes / después

Las 10 capturas verificadas con `read_file` se encuentran en `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-c1-modelo\` (fuera del commit de git según las reglas del proyecto):

1. `docs/reportes/capturas/W-c1-modelo/W-c1-modelo_c1-modelo-01-claves-primarias-foraneas_cabecera_1280x720_light.png`
2. `docs/reportes/capturas/W-c1-modelo/W-c1-modelo_c1-modelo-01-claves-primarias-foraneas_practica_1280x720_light.png`
3. `docs/reportes/capturas/W-c1-modelo/W-c1-modelo_c1-modelo-02-normalizacion-1fn-3fn_cabecera_1280x720_light.png`
4. `docs/reportes/capturas/W-c1-modelo/W-c1-modelo_c1-modelo-02-normalizacion-1fn-3fn_practica_1280x720_light.png`
5. `docs/reportes/capturas/W-c1-modelo/W-c1-modelo_c1-modelo-03-integridad-huerfanos_cabecera_1280x720_light.png`
6. `docs/reportes/capturas/W-c1-modelo/W-c1-modelo_c1-modelo-03-integridad-huerfanos_practica_1280x720_light.png`
7. `docs/reportes/capturas/W-c1-modelo/W-c1-modelo_c1-modelo-04-auditoria-calidad_cabecera_1280x720_light.png`
8. `docs/reportes/capturas/W-c1-modelo/W-c1-modelo_c1-modelo-04-auditoria-calidad_practica_1280x720_light.png`
9. `docs/reportes/capturas/W-c1-modelo/W-c1-modelo_c1-modelo-05-validacion-bloqueante_cabecera_1280x720_light.png`
10. `docs/reportes/capturas/W-c1-modelo/W-c1-modelo_c1-modelo-05-validacion-bloqueante_practica_1280x720_light.png`

---

## Peticiones al orquestador

1. **Integración de glosario en Fase 4:** Fusionar los 8 términos validados de `docs/curriculo/investigacion/c1-modelo-glossary.json` (`primary-key`, `foreign-key`, `surrogate-key`, `natural-key`, `normalizacion-3fn`, `integridad-referencial`, `registro-huerfano`, `regla-validacion-bloqueante`) en `src/data/glossary.js`.
2. **Integración de proyecto de módulo en Fase 4:** Incorporar la especificación y rúbrica de `c1-modelo-project` documentada en `docs/curriculo/investigacion/c1-modelo.md` (§6) dentro del catálogo de proyectos.
3. **Sincronización de títulos de lecciones 03 y 04 en `src/data/catalog/modules.js`:** Actualizar en `src/data/catalog/modules.js` los títulos planificados de `c1-modelo-03` (`'Integridad referencial: detectar huérfanos con ANTI JOIN'`, 56 chars) y `c1-modelo-04` (`'Auditoría SQL: duplicados, nulos y valores fuera de rango'`, 57 chars) para que respeten el límite `max(60)` de `LessonSchema`.
4. **Lectura de `lesson.aiContext` en `server/ai/contextBuilder.js`:** En `server/ai/contextBuilder.js` (línea 211), añadir `lesson?.aiContext` como primera prioridad en `const aiNotes = lesson?.aiContext || lesson?.aiNotes || ...` para que el servidor inyecte directamente el campo `aiContext` del esquema v2.

---

## Pendiente

Ninguno. Las 5 lecciones de `c1-modelo`, el documento de investigación, el archivo JSON de glosario y este reporte están completos y verificados con 0 errores.
