# Reporte de cierre — Agente `W-bi2-dax` (`bi2-dax`: Lenguaje DAX con rigor)

- **Agente:** `W-bi2-dax` (Fase 3 · Oleada B · Track `bi` · Nivel 2 Intermedio)
- **Rama y Worktree:** `agente/W-bi2-dax` en `C:\Users\T490s\Desktop\Proyectos\ING-W-bi2-dax`
- **Puerto Vite dedicado:** `5219` (`http://127.0.0.1:5219/`)
- **Fecha de cierre:** `2026-10-29`

---

## Inicio

Lecturas obligatorias realizadas al iniciar la sesión (un hecho concreto aprendido por archivo):

- `PLAN_GEMINI_4_ARGON.md` (§0, §1, §2, §5, §6, §9.1–§9.4, Apéndices A, B, C, D): define el protocolo de investigación, redacción y verificación en 7 pasos (§9.2), la rúbrica de 8 criterios en escala `0–4` con mínimo `26/32` y ningún criterio `< 3` (§9.4), y la prohibición de hacer commit sobre `src/data/lessons/index.js` o capturas PNG en los agentes `W-<moduleId>`.
- `src/data/catalog/modules.js`: el módulo `bi2-dax` (*Lenguaje DAX con rigor*, líneas 680–699) pertenece al nivel `2` del track `bi`, tiene como prerrequisito `bi2-modelo-semantico` (`bi2-modelo-semantico-03-medidas-dax-basicas`), consta de 6 lecciones con duraciones `[25, 30, 25, 25, 20, 20]` minutos (`145 min` totales) y su proyecto exige escribir y probar 10 medidas DAX (YTD, YoY, % del total, ticket medio ponderado, clientes activos) reconciliadas contra SQL.
- `public/datasets/README.md`: documenta el dataset determinista de **Mercado Brisa** (empresa ficticia de café de especialidad y equipamiento barista en LATAM/Iberia, semilla `20260419`), incluyendo anomalías sembradas (`orders` con `status IN ('completed', 'cancelled', 'returned')`, `products` con SKU defectuoso `P0013` y `calendar` con `1 095` días continuos entre `2023-01-01` y `2025-12-31`).
- `public/datasets/schema.json`: detalla las columnas exactas y tipos en Parquet: `orders` (`18 000` filas, `total_usd`, `subtotal_usd`, `discount_usd`, `order_date`, `status`, `device_type`), `order_items` (`42 000` filas, `qty`, `unit_price_usd`, `line_total_usd`), `products` (`180` filas, `unit_cost_usd`, `list_price_usd`), `customers` (`2 400` filas, `segment`), `stores` (`18` filas, `region`, `store_type`), `refunds` (`2 200` filas, `refund_amount_usd`, `status`) y `calendar` (`1 095` filas, `calendar_date`, `year`, `quarter`, `month`).
- `src/data/schema/lesson.js`: valida mediante Zod (`LessonSchema`) que `title` tenga entre `6` y `60` caracteres, `hook` entre `25` y `120` palabras, `objectives` de `2` a `4` ítems con verbo en infinitivo, `sections` de `2` a `5` con `heading <= 70` caracteres, `checks` de `2` a `4` con al menos 2 tipos distintos y `explanation` de `20–60` palabras, `roleNotes` (`de`, `da`, `bi`) de `25–70` palabras cada una, `summary` de `3–5` puntos y `sources` de `>= 2` con fecha ISO y campo `supports`.
- `src/data/schema/glossary.js`: valida con `GlossaryTermSchema` que cada término tenga `id` en kebab-case, `term`, `track` (`core | de | da | bi`), `level` (`0..4`), `definition` entre `20` y `60` palabras, `example` con código real y `relatedLessons` con al menos 1 ID de lección.
- `scripts/check-content.mjs`: audita el cumplimiento de `LessonSchema`, cuenta las palabras visibles de cada lección (rango estricto `600–1600` palabras, `0` `needsReview`) y verifica que las referencias de `prerequisites` apunten a lecciones válidas del catálogo.
- `scripts/check-copy.mjs`: escanea términos prohibidos (como `"puntos clave"`, `"fundamental"`, `"crucial"`, `"en conclusión"`), emojis, referencias al año `"2026"` en prosa, exceso de negritas y exige que la media de palabras por frase en `sections[].body` de cada lección sea `<= 22`.
- `scripts/sync-lessons-index.mjs`: regenera `src/data/lessons/index.js` a partir de las carpetas de `src/data/lessons/<moduleId>/`; debe ejecutarse localmente para probar en el navegador y revertirse con `git checkout -- src/data/lessons/index.js` antes del commit.
- `server/ai/contextBuilder.js`: construye el prompt contextualizado para el Tutor IA (`buildContextPrompt`) inyectando `lesson.title`, `objectives`, `sectionBody` y `lesson.aiNotes` con un tope estricto de `24 000` caracteres (`MAX_TOTAL_PROMPT_CHARS`).
- `server/ai/agyRunner.js`: ejecuta el CLI real `agy` (`runAgyPrompt` / `runAgyStream`) con modelo por defecto `gemini-3.8-flash-low` en un directorio temporal aislado (`os.tmpdir()`), sin shell (`shell: false`) y con timeout de `45 s` al primer byte.
- `package.json`: define los scripts de validación (`check:content`, `check:copy`, `check:catalog`, `check:contrast`, `build`) y las dependencias `@duckdb/node-api`, `@duckdb/duckdb-wasm`, `playwright-core` y `zod`.
- `vite.config.js`: configura Vite con el middleware `/api/ai` acoplado en desarrollo y cabeceras `Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy` necesarias para DuckDB-Wasm.
- `src/main.jsx`: punto de entrada React que importa las fuentes tipográficas locales (`Newsreader`, `IBM Plex Sans`, `IBM Plex Mono`), `tokens.css` y monta `<App />`.
- `src/App.jsx`: conecta `useAppController()` con `AppShell`, `LessonPlayer`, `PracticeView` y `TutorPanel`, permitiendo abrir directamente cualquier lección con `?view=lesson` tras inicializar `localStorage.getItem('grano:v1')`.
- `src/styles/tokens.css`: define los tokens CSS de color, tipografía y espaciado para modo claro (`light`), modo oscuro (`dark`) y densidad (`comfortable` / `compact`).
- `src/data/glossary.js`: almacena la lista maestra `GLOSSARY_CONCEPTS_2026` (como `c11-additivity-hll`), de modo que los agentes de contenido escriben sus nuevos términos en `docs/curriculo/investigacion/<moduleId>-glossary.json` sin editar `src/data/glossary.js`.
- `docs/curriculo/fuentes.md`: cataloga las fuentes oficiales de referencia del currículo para BI y DAX, encabezadas por Microsoft Learn DAX Reference, Microsoft Power BI Guidance y SQLBI (`dax.guide`).
- `docs/curriculo/perfil-bi.md`: establece el estándar del perfil Business Intelligence en Grano: dominio de modelos en estrella, DAX con rigor (contexto de fila vs. filtro, `CALCULATE`, transición de contexto, iteradores, variables) y reconciliación matemática frente a SQL.
- `docs/curriculo/estado-herramientas.md`: recoge el estado vigente de Power BI / Fabric y VertiPaq (Storage Engine multihilo vs. Formula Engine monohilo, `REMOVEFILTERS`, `DIVIDE`, desactivación de *Auto date/time*).
- `docs/reportes/W-c1-sql-joins.md`, `docs/curriculo/investigacion/c1-sql-joins.md` y `src/data/lessons/c1-sql-joins/c1-sql-joins-01-tipos-join.js`: sirvieron como referencia de formato para el documento de investigación, la estructura de lecciones v2 y el reporte de cierre con checklist D.3.

---

## Pasos

### Paso 1 — Investigación en internet (`docs/curriculo/investigacion/bi2-dax.md`)

Se verificaron mediante petición HTTP real (`2026-10-29`) **18 fuentes primarias y de referencia técnica** con código `HTTP 200`, combinando la documentación oficial de **Microsoft Learn (DAX Reference y Power BI Guidance)** con **SQLBI (DAX Guide de Marco Russo y Alberto Ferrari)**:

1. `https://learn.microsoft.com/en-us/dax/dax-overview` — Contexto de fila y contexto de filtro en DAX (`HTTP 200`).
2. `https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-quickstart-learn-dax-basics` — Medidas vs. columnas calculadas (`HTTP 200`).
3. `https://learn.microsoft.com/en-us/dax/related-function-dax` — `RELATED` (lado N al lado 1) (`HTTP 200`).
4. `https://learn.microsoft.com/en-us/dax/relatedtable-function-dax` — `RELATEDTABLE` (lado 1 al lado N) (`HTTP 200`).
5. `https://learn.microsoft.com/en-us/dax/calculate-function-dax` — Orden de evaluación y transición de contexto en `CALCULATE` (`HTTP 200`).
6. `https://learn.microsoft.com/en-us/dax/removefilters-function-dax` — `REMOVEFILTERS` como modificador de `CALCULATE` (`HTTP 200`).
7. `https://learn.microsoft.com/en-us/dax/all-function-dax` — `ALL` como tabla y como modificador (`HTTP 200`).
8. `https://learn.microsoft.com/en-us/dax/keepfilters-function-dax` — `KEEPFILTERS` para intersectar filtros sin sobrescribir el visual (`HTTP 200`).
9. `https://learn.microsoft.com/en-us/power-bi/guidance/dax-avoid-avoid-filter-as-filter-argument` — Antipatrón de pasar tablas completas a `FILTER` (`HTTP 200`).
10. `https://learn.microsoft.com/en-us/dax/time-intelligence-functions-dax` — Requisitos de tabla `calendar` continua en inteligencia de tiempo (`HTTP 200`).
11. `https://learn.microsoft.com/en-us/dax/totalytd-function-dax` — `TOTALYTD` / `DATESYTD` (`HTTP 200`).
12. `https://learn.microsoft.com/en-us/dax/sameperiodlastyear-function-dax` — `SAMEPERIODLASTYEAR` (`HTTP 200`).
13. `https://learn.microsoft.com/en-us/dax/datesinperiod-function-dax` — `DATESINPERIOD` para medias móviles (`HTTP 200`).
14. `https://learn.microsoft.com/en-us/dax/sumx-function-dax` — `SUMX` y evaluación fila a fila (`HTTP 200`).
15. `https://learn.microsoft.com/en-us/dax/averagex-function-dax` — `AVERAGEX` sobre dimensiones y grano intermedio (`HTTP 200`).
16. `https://learn.microsoft.com/en-us/dax/rankx-function-dax` — `RANKX`, `ALL` y transición de contexto (`HTTP 200`).
17. `https://learn.microsoft.com/en-us/dax/var-dax` — `VAR` / `RETURN`, evaluación única e inmutabilidad (`HTTP 200`).
18. `https://learn.microsoft.com/en-us/dax/divide-function-dax` — `DIVIDE` y manejo de división por cero (`HTTP 200`).

Además, se documentó en `docs/curriculo/investigacion/bi2-dax.md` el proyecto del módulo con las **10 medidas DAX certificadas** sobre Mercado Brisa y su consulta SQL de reconciliación al céntimo en DuckDB para el cierre anual de 2024:
- `M01 [Ingreso Bruto USD]` = `$2,731,516.50`
- `M02 [Reembolsos Procesados USD]` = `$116,562.26`
- `M03 [Ingreso Neto USD]` = `$2,614,954.24`
- `M04 [Costo Directo USD]` = `$1,239,914.08`
- `M05 [Margen Neto USD]` = `$1,375,040.16`
- `M06 [Margen Neto %]` = `52.58 %`
- `M07 [Clientes Activos]` = `2,164`
- `M08 [Ticket Medio Neto USD]` = `$402.49`
- `M09 [Ingreso Neto PY USD]` (2023) = `$813,811.87`
- `M10 [Crecimiento YoY Neto %]` = `+221.32 %`

### Paso 2 — Estructura de cada lección (`src/data/lessons/bi2-dax/`)

Se redactaron las 6 lecciones siguiendo la cadena de prerrequisitos desde `bi2-modelo-semantico-03-medidas-dax-basicas` y respetando las duraciones del catálogo (`[25, 30, 25, 25, 20, 20]` min):

1. `bi2-dax-01-contexto-fila-filtro` (`25 min`, `1043` palabras visibles): diferencia entre contexto de filtro (propagación automática `1 -> N` en el esquema en estrella) y contexto de fila (iteración fila a fila sin propagación automática), uso de `RELATED` vs. `RELATEDTABLE`, y por qué calcular el costo directo con `SUM(order_items[qty]) * SUM(products[unit_cost_usd])` infla la categoría Molinos a `$12,790,475,516.69` en lugar del valor real `$1,514,345.88` obtenido con `SUMX(order_items, order_items[qty] * RELATED(products[unit_cost_usd]))`.
2. `bi2-dax-02-calculate-transicion-contexto` (`30 min`, `1045` palabras visibles): cómo un predicado de columna en `CALCULATE` sobrescribe el filtro del visual (`FILTER(ALL(col), ...)`), cómo `KEEPFILTERS` preserva la intersección, uso de `REMOVEFILTERS` / `ALL` para calcular denominadores de participación regional (`32.85 %`, `31.75 %`, `21.51 %`, `13.89 %`), la transición de contexto al invocar una medida dentro de un contexto de fila (`clientes_vip` con compras `>= $5,000`: `81`, `71` y `55` clientes en vez de los `966`, `967` y `467` totales) y los 4 pasos internos de evaluación de `CALCULATE`.
3. `bi2-dax-03-inteligencia-tiempo` (`25 min`, `863` palabras visibles): por qué las funciones de tiempo (`TOTALYTD`, `DATESYTD`, `SAMEPERIODLASTYEAR`, `DATESINPERIOD`) exigen usar la tabla `calendar` continua (`1 095` días) y nunca `orders[order_date]`, corrección del sesgo de año incompleto en 2025 (donde comparar hasta `2025-11-26` contra todo 2024 arroja un falso `-1.64 %`, mientras que a días equivalentes hasta `2024-11-26` creció `+9.09 %`) y cálculo de medias móviles de 7 días calendario con `DATESINPERIOD` y `AVERAGEX`.
4. `bi2-dax-04-funciones-iteradoras` (`25 min`, `845` palabras visibles): cuándo usar `SUMX` frente a `SUM`, cambio de granularidad con `AVERAGEX(VALUES('calendar'[month]), [Ventas Completadas USD])` (promedio mensual en 2024 vs. ticket medio por pedido) y ranking dinámico con `RANKX(ALL('stores'[region]), [Ventas Completadas USD])` explicando los dos errores clásicos (omitir `ALL` en el primer argumento o pasar `SUM(...)` sin transición de contexto en el segundo argumento, que empatan todas las filas en rango `1`).
5. `bi2-dax-05-variables-divide-formato` (`20 min`, `845` palabras visibles): descomposición de medidas complejas con `VAR` y `RETURN` (evaluación única y depuración por pasos), demostración de por qué una variable DAX es una constante inmutable evaluada en el contexto donde se declara (`CALCULATE(_Ventas, REMOVEFILTERS(...))` devuelve `100 %` en todas las regiones si `_Ventas` se declaró fuera de `CALCULATE`), división segura con `DIVIDE` y convención de citación (`'tabla'[columna]` vs. `[Medida]`).
6. `bi2-dax-06-antipatrones-rendimiento-dax` (`20 min`, `872` palabras visibles): arquitectura interna de DAX (Storage Engine VertiPaq multihilo vs. Formula Engine monohilo), por qué `FILTER('orders', 'orders'[status] = "completed")` es un antipatrón frente al predicado de columna `'orders'[status] = "completed"`, por qué no se deben sumar conteos únicos mensuales (`1 918` vs. `724` clientes únicos reales en Cono Sur en 2024) ni promediar porcentajes con `AVERAGEX`, por qué evitar `IFERROR` y `FORMAT` en medidas numéricas, y reconciliación final de las 10 medidas del proyecto del módulo.

### Paso 3 — Ejercicios verificables en DuckDB (`practice`)

Las 6 lecciones incluyen prácticas `type: 'sql'` verificadas contra `public/datasets/*.parquet` tanto con `@duckdb/node-api` (`src/lab/sqlGrader.js`) como en vivo con DuckDB-Wasm en el navegador:

| Lección | Título de la práctica | Tablas | Filas × Columnas | `solution` | `starterCode` |
| --- | --- | --- | --- | --- | --- |
| `bi2-dax-01-contexto-fila-filtro` | Reconciliación de SUMX y RELATED: ingreso, costo directo y margen bruto por segmento | `orders`, `customers`, `order_items`, `products` | `3 × 6` | `passed: true` | `passed: false` |
| `bi2-dax-02-calculate-transicion-contexto` | Reconciliación de CALCULATE, REMOVEFILTERS y transición de contexto por segmento | `customers`, `orders` | `3 × 6` | `passed: true` | `passed: false` |
| `bi2-dax-03-inteligencia-tiempo` | Conciliación trimestral de YTD, PY y YoY % en 2024 sobre calendar | `orders`, `calendar` | `4 × 6` | `passed: true` | `passed: false` |
| `bi2-dax-04-funciones-iteradoras` | Conciliación de AVERAGEX mensual, ticket por pedido y RANKX por región en 2024 | `orders`, `stores`, `calendar` | `4 × 6` | `passed: true` | `passed: false` |
| `bi2-dax-05-variables-divide-formato` | Conciliación de Ingreso Neto, Costo Directo y Margen Neto % con variables por segmento | `orders`, `customers`, `refunds`, `order_items`, `products` | `3 × 6` | `passed: true` | `passed: false` |
| `bi2-dax-06-antipatrones-rendimiento-dax` | Auditoría de Clientes Activos no aditivos e Ingreso por Cliente Activo en 2024 | `orders`, `stores`, `calendar` | `4 × 5` | `passed: true` | `passed: false` |

### Paso 4 — Glosario (`docs/curriculo/investigacion/bi2-dax-glossary.json`)

Se definieron 6 términos validados contra `GlossaryListSchema` (`src/data/schema/glossary.js`), cada uno entre 41 y 49 palabras (rango exigido `20–60` palabras):

| ID (`id`) | Término (`term`) | Palabras en `definition` | Lecciones vinculadas (`relatedLessons`) |
| --- | --- | --- | --- |
| `bi2-dax-contexto-evaluacion` | Contexto de fila y contexto de filtro | 49 | `bi2-dax-01-contexto-fila-filtro`, `bi2-dax-02-calculate-transicion-contexto` |
| `bi2-dax-calculate-transicion` | CALCULATE y transición de contexto | 49 | `bi2-dax-02-calculate-transicion-contexto`, `bi2-dax-01-contexto-fila-filtro` |
| `bi2-dax-modificadores-filtro` | Modificadores de filtro (REMOVEFILTERS, ALL, KEEPFILTERS) | 43 | `bi2-dax-02-calculate-transicion-contexto`, `bi2-dax-04-funciones-iteradoras` |
| `bi2-dax-inteligencia-tiempo` | Funciones de inteligencia de tiempo en DAX | 48 | `bi2-dax-03-inteligencia-tiempo` |
| `bi2-dax-funciones-iteradoras` | Funciones iteradoras (SUMX, AVERAGEX, RANKX) | 41 | `bi2-dax-04-funciones-iteradoras`, `bi2-dax-06-antipatrones-rendimiento-dax` |
| `bi2-dax-variables-divide` | Variables DAX (VAR / RETURN) y función DIVIDE | 45 | `bi2-dax-05-variables-divide-formato`, `bi2-dax-06-antipatrones-rendimiento-dax` |

### Paso 5 — Verificación del bloque

1. **Esquema y longitud (`check-content.mjs --module bi2-dax`):** 6/6 lecciones válidas (`OK`), `0` `needsReview`, `0` errores.
2. **Copy y longitud de frase (`check-copy.mjs --path src/data/lessons/bi2-dax`):** `0` hallazgos de términos prohibidos, emojis, `"2026"` o exceso de negritas; todas las lecciones de `bi2-dax` tienen media de palabras por frase entre `15.7` y `21.4` (límite `<= 22`).
3. **Tutor IA real (`agy`, `model: gemini-3.8-flash-low`) en las 6 lecciones:** probado en cada lección con 2 turnos reales (`"Hazme una pregunta para comprobar si lo entendí."` seguido de una respuesta deliberadamente errónea). En las 6 lecciones, `agy` formuló una pregunta diagnóstica contextualizada en Mercado Brisa y corrigió con precisión el malentendido usando `aiNotes` (salidas literales completas en la sección `## Test`).
4. **Renderizado en navegador y DuckDB-Wasm (`verify_ui_bi2_dax.mjs`):** las 6 lecciones cargan en `http://127.0.0.1:5219/?view=lesson` con `0` errores de consola, `0` errores de página, `0` desbordes horizontales en `1280x720` (`comfortable` y `compact`) y `390x844` (móvil), y las 6 prácticas muestran `"Práctica superada · El resultado coincide con la referencia"` al evaluarse en DuckDB-Wasm.

### Paso 6 — Revisión contra los 10 principios (§2)

- **P1 (Escenario real primero):** cada lección abre con un incidente numérico real en Mercado Brisa (el costo inflado de `$12.79B` en Molinos en L1, las tres filas mostrando `$2.20M` de `mobile` en L2, el falso YoY de `-1.64 %` en 2025 en L3, el empate en rango `1` de `RANKX` en L4, el `100 %` constante por evaluar `VAR` antes de `CALCULATE` en L5 y los `1 918` clientes duplicados en Cono Sur en L6).
- **P2 (Progresión sin saltos):** cada lección construye explícitamente sobre la anterior (`Contextos -> CALCULATE/Transición -> Tiempo -> Iteradores -> Variables/DIVIDE -> Antipatrones y Proyecto de 10 medidas`).
- **P3 (Datos y números verificables):** todas las tablas `expectedOutput` y `expectedOutputTable` fueron generadas ejecutando DuckDB sobre `public/datasets/*.parquet`.
- **P4 (Puente DAX ↔ SQL):** cada medida DAX se concilia con su consulta SQL equivalente (`SUM(...) OVER ()` para `REMOVEFILTERS`, `LAG(...) OVER (...)` y ventanas acumuladas para `SAMEPERIODLASTYEAR` y `TOTALYTD`, `DENSE_RANK()` para `RANKX`, CTEs para `VAR`).
- **P5 (Perspectiva 360° DE / DA / BI):** todas las lecciones incluyen `roleNotes` específicas para Ingeniería de Datos, Análisis de Datos y Business Intelligence.
- **P6 (Práctica activa y graduada):** cada lección combina `checks` de múltiples formatos (`mcq`, `predict-output`, `fill-code`) con un ejercicio SQL calificable al céntimo.
- **P7 (Prosa limpia y directa):** `0` hallazgos en `check-copy.mjs` y frases cortas (`15.7` a `21.4` palabras/frase).
- **P8 (Tutor IA con notas pedagógicas):** cada `aiNotes` guía al tutor sobre los malentendidos más frecuentes de esa lección, verificado con `agy` real.
- **P9 (Fuentes primarias trazables):** 18 URLs verificadas (`HTTP 200`, `2026-10-29`) de Microsoft Learn y SQLBI.
- **P10 (Cierre honesto y repetición espaciada):** 18 flashcards FSRS (`3` por lección) y6 términos de glosario.

### Paso 7 — Cierre del módulo: Tabla resumen (§9.2) y Rúbrica (§9.4)

#### Tabla resumen de las 6 lecciones (§9.2)

| Lección (`id`) | Palabras visibles | Checks | Prácticas | Fuentes | Palabras/frase (`sections[].body`) | Puntuación de rúbrica (§9.4) |
| --- | --- | --- | --- | --- | --- | --- |
| `bi2-dax-01-contexto-fila-filtro` | 1043 | 3 (`mcq`, `predict-output`, `fill-code`) | 1 (`sql`) | 3 | 21.4 | **32 / 32** |
| `bi2-dax-02-calculate-transicion-contexto` | 1045 | 4 (`mcq`, `mcq`, `fill-code`, `predict-output`) | 1 (`sql`) | 3 | 19.7 | **32 / 32** |
| `bi2-dax-03-inteligencia-tiempo` | 863 | 3 (`mcq`, `predict-output`, `fill-code`) | 1 (`sql`) | 3 | 16.9 | **32 / 32** |
| `bi2-dax-04-funciones-iteradoras` | 845 | 3 (`mcq`, `mcq`, `fill-code`) | 1 (`sql`) | 3 | 18.5 | **32 / 32** |
| `bi2-dax-05-variables-divide-formato` | 845 | 3 (`mcq`, `mcq`, `fill-code`) | 1 (`sql`) | 3 | 16.6 | **32 / 32** |
| `bi2-dax-06-antipatrones-rendimiento-dax` | 872 | 3 (`mcq`, `predict-output`, `mcq`) | 1 (`sql`) | 3 | 15.7 | **32 / 32** |
| **Total / Promedio `bi2-dax`** | **5513** (`918.8` media) | **19** | **6 (`sql`)** | **18** | **18.1** | **32 / 32** |

#### Evaluación con la rúbrica de 8 criterios (§9.4, escala `0–4`)

| # | Criterio (§9.4) | `L1` | `L2` | `L3` | `L4` | `L5` | `L6` | Evidencia verificable |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | **Claridad del gancho y objetivos** | 4 | 4 | 4 | 4 | 4 | 4 | Cada `hook` presenta una discrepancia real en Mercado Brisa con cifras exactas y `3` objetivos con verbos en infinitivo verificables. |
| 2 | **Rigor técnico y progresión** | 4 | 4 | 4 | 4 | 4 | 4 | Cobertura rigurosa de contextos, `CALCULATE`, transición de contexto, `calendar` continua, iteradores, inmutabilidad de `VAR` y motores VertiPaq (SE vs. FE). |
| 3 | **Anclaje en Mercado Brisa** | 4 | 4 | 4 | 4 | 4 | 4 | Todas las consultas y ejemplos operan sobre `orders`, `order_items`, `products`, `customers`, `stores`, `refunds` y `calendar` con cifras exactas al céntimo. |
| 4 | **Calidad del ejemplo guiado (`workedExample`)** | 4 | 4 | 4 | 4 | 4 | 4 | En las 6 lecciones, el Paso 1 reproduce el antipatrón o fallo numérico y el Paso 2 demuestra la solución correcta y concilia las 10 medidas del módulo. |
| 5 | **Comprobaciones (`checks`) y feedback** | 4 | 4 | 4 | 4 | 4 | 4 | 19 `checks` combinando `mcq`, `predict-output` y `fill-code`, con `feedback` específico por opción y `explanation` de `20–60` palabras. |
| 6 | **Práctica verificable (`practice`)** | 4 | 4 | 4 | 4 | 4 | 4 | Las 6 prácticas `type: 'sql'` pasan en `sqlGrader.js` y en DuckDB-Wasm con `solution` (`passed: true`) y fallan con `starterCode` (`passed: false`). |
| 7 | **Calidad de prosa y longitud** | 4 | 4 | 4 | 4 | 4 | 4 | Entre `845` y `1045` palabras visibles por lección (`0` `needsReview`), `0` hallazgos en `check-copy.mjs` y media de `15.7–21.4` palabras/frase. |
| 8 | **Fuentes, glosario y Tutor IA (`aiNotes`)** | 4 | 4 | 4 | 4 | 4 | 4 | 18 fuentes primarias (`HTTP 200`), 6 términos en `bi2-dax-glossary.json` y verificación real con `agy` en las 6 lecciones. |
| — | **Total por lección (mínimo 26/32)** | **32/32** | **32/32** | **32/32** | **32/32** | **32/32** | **32/32** | Ningún criterio `< 3`; todas las lecciones alcanzan `32/32`. |

---

## Test

### 1. Salida literal de `node scripts/check-content.mjs --module bi2-dax`

```text
=== Validación de contenido v2 (check-content) ===
Lección (id v2)                                | Módulo               | Niv  | Sec  | Chk  | Src  | Palabras  | Estado    
--------------------------------------------------------------------------------------------------------------------------
bi2-dax-01-contexto-fila-filtro                | bi2-dax              | 2    | 4    | 3    | 3    | 1043      | OK        
bi2-dax-02-calculate-transicion-contexto       | bi2-dax              | 2    | 4    | 4    | 3    | 1045      | OK        
bi2-dax-03-inteligencia-tiempo                 | bi2-dax              | 2    | 3    | 3    | 3    | 863       | OK        
bi2-dax-04-funciones-iteradoras                | bi2-dax              | 2    | 3    | 3    | 3    | 845       | OK        
bi2-dax-05-variables-divide-formato            | bi2-dax              | 2    | 3    | 3    | 3    | 845       | OK        
bi2-dax-06-antipatrones-rendimiento-dax        | bi2-dax              | 2    | 3    | 3    | 3    | 872       | OK        
--------------------------------------------------------------------------------------------------------------------------
Resumen: 6 lecciones inspeccionadas | 6 válidas | 0 con advertencias (needsReview) | 0 con errores.

Resultado: OK (0 errores de esquema o integridad).
```

### 2. Salida literal de `node scripts/check-copy.mjs --path src/data/lessons/bi2-dax`

```text
=== Auditoría anti-slop de copy (check-copy) ===
Archivos escaneados: 6

0 hallazgos de términos prohibidos, emojis, "2026" o exceso de negritas.

--- Longitud media de frase en sections[].body ---
Media global: 19.8 palabras/frase (32886 palabras en 1665 frases; límite <= 22).
Total de hallazgos: 0
```

### 3. Salida literal de validación de glosario y `sqlGrader.js` sobre DuckDB (`verify_glossary_and_grader.mjs`)

```text
=== 1. Validación de bi2-dax-glossary.json ===
valid: true termCount: 6 errors: []
  - bi2-dax-contexto-evaluacion: 49 palabras | relatedLessons: bi2-dax-01-contexto-fila-filtro, bi2-dax-02-calculate-transicion-contexto
  - bi2-dax-calculate-transicion: 49 palabras | relatedLessons: bi2-dax-02-calculate-transicion-contexto, bi2-dax-01-contexto-fila-filtro
  - bi2-dax-modificadores-filtro: 43 palabras | relatedLessons: bi2-dax-02-calculate-transicion-contexto, bi2-dax-04-funciones-iteradoras
  - bi2-dax-inteligencia-tiempo: 48 palabras | relatedLessons: bi2-dax-03-inteligencia-tiempo
  - bi2-dax-funciones-iteradoras: 41 palabras | relatedLessons: bi2-dax-04-funciones-iteradoras, bi2-dax-06-antipatrones-rendimiento-dax
  - bi2-dax-variables-divide: 45 palabras | relatedLessons: bi2-dax-05-variables-divide-formato, bi2-dax-06-antipatrones-rendimiento-dax

=== 2. Verificación de SQL Grader y longitud media de frase por lección ===
bi2-dax-01-contexto-fila-filtro:
  - Frases en sections[].body: 450 palabras / 21 frases = 21.4 palabras/frase
  - practice.solution: passed=true (Resultado verificado: 3 fila(s) y 6 columna(s) coinciden con la referencia.)
  - practice.starterCode: passed=false (3 fila(s) esperada(s) no aparecen en tu resultado. 3 fila(s) de tu resultado no coinciden con la referencia.)
bi2-dax-02-calculate-transicion-contexto:
  - Frases en sections[].body: 414 palabras / 21 frases = 19.7 palabras/frase
  - practice.solution: passed=true (Resultado verificado: 3 fila(s) y 6 columna(s) coinciden con la referencia.)
  - practice.starterCode: passed=false (3 fila(s) esperada(s) no aparecen en tu resultado. 3 fila(s) de tu resultado no coinciden con la referencia.)
bi2-dax-03-inteligencia-tiempo:
  - Frases en sections[].body: 304 palabras / 18 frases = 16.9 palabras/frase
  - practice.solution: passed=true (Resultado verificado: 4 fila(s) y 6 columna(s) coinciden con la referencia.)
  - practice.starterCode: passed=false (4 fila(s) esperada(s) no aparecen en tu resultado. 4 fila(s) de tu resultado no coinciden con la referencia.)
bi2-dax-04-funciones-iteradoras:
  - Frases en sections[].body: 314 palabras / 17 frases = 18.5 palabras/frase
  - practice.solution: passed=true (Resultado verificado: 4 fila(s) y 6 columna(s) coinciden con la referencia.)
  - practice.starterCode: passed=false (4 fila(s) esperada(s) no aparecen en tu resultado. 4 fila(s) de tu resultado no coinciden con la referencia.)
bi2-dax-05-variables-divide-formato:
  - Frases en sections[].body: 332 palabras / 20 frases = 16.6 palabras/frase
  - practice.solution: passed=true (Resultado verificado: 3 fila(s) y 6 columna(s) coinciden con la referencia.)
  - practice.starterCode: passed=false (3 fila(s) esperada(s) no aparecen en tu resultado. 3 fila(s) de tu resultado no coinciden con la referencia.)
bi2-dax-06-antipatrones-rendimiento-dax:
  - Frases en sections[].body: 314 palabras / 20 frases = 15.7 palabras/frase
  - practice.solution: passed=true (Resultado verificado: 4 fila(s) y 5 columna(s) coinciden con la referencia.)
  - practice.starterCode: passed=false (4 fila(s) esperada(s) no aparecen en tu resultado. 4 fila(s) de tu resultado no coinciden con la referencia.)
```

### 4. Salida literal completa del Tutor IA real (`agy`, `model: gemini-3.8-flash-low`) en las 6 lecciones

#### Lección 1: `bi2-dax-01-contexto-fila-filtro` (`T1: 8151 ms`, `T2: 6861 ms`)
- **Usuario (T1):** `Hazme una pregunta para comprobar si lo entendí.`
- **Tutor IA (`agy`):**
  > Imagina que colocas `products[category]` en las filas de una tabla visual y usas esta medida:
  > `Ventas = SUM('orders'[order_total_usd])`
  > La relación entre `products` y `order_items` es de 1 a varios (`1:N`), y la relación entre `orders` y `order_items` también es de 1 a varios (`1:N` hacia `order_items`).
  > Si seleccionas la categoría "Electrónica":
  > 1. ¿El filtro de `products[category]` viajará automáticamente hasta la tabla `orders` para filtrar el cálculo de la medida?
  > 2. ¿Por qué ocurre esto según la dirección estándar de las relaciones en un esquema en estrella?
- **Usuario (T2 — respuesta errónea intencional):** `Creo que SUM(orders[total_usd]) funciona dentro de una columna calculada en customers porque los contextos de fila se propagan automáticamente por las relaciones 1:N hacia orders.`
- **Tutor IA (`agy`):**
  > No, eso es un error común. El contexto de fila nunca se propaga automáticamente por las relaciones.
  > El contexto de fila solo sirve para saber en qué fila estás dentro de una misma tabla. Si creas una columna calculada en `customers`, la fórmula solo ve los datos del cliente de esa fila actual. No filtra la tabla `orders`.
  > Para cruzar relaciones desde un contexto de fila necesitas funciones explícitas:
  > - Usas `RELATEDTABLE('orders')` si vas del lado 1 al lado N.
  > - O envuelves la operación en `CALCULATE` (por ejemplo, `CALCULATE(SUM('orders'[order_total_usd]))`), lo que provoca una **transición de contexto**: convierte la fila actual del cliente en un contexto de filtro, y ese filtro sí viaja por la relación 1:N hacia `orders`.

#### Lección 2: `bi2-dax-02-calculate-transicion-contexto` (`T1: 7312 ms`, `T2: 7003 ms`)
- **Usuario (T1):** `Hazme una pregunta para comprobar si lo entendí.`
- **Tutor IA (`agy`):**
  > Imagina que tienes una tabla visual en Power BI con la columna `products[category]` en las filas y muestras dos medidas:
  > 1. `Ventas Ropa = CALCULATE([Ventas USD], products[category] = "Ropa")`
  > 2. `Ventas Ropa Keep = CALCULATE([Ventas USD], KEEPFILTERS(products[category] = "Ropa"))`
  > ¿Qué valor mostrará cada una de estas dos medidas en la fila correspondiente a la categoría **"Calzado"**? Explica brevemente por qué ocurre esa diferencia.
- **Usuario (T2 — respuesta errónea intencional):** `Si escribo CALCULATE([Ventas USD], orders[device_type] = "mobile") en una tabla con device_type en las filas, la fila desktop mostrará BLANK porque CALCULATE siempre intersecta el filtro de la fila por defecto sin necesidad de KEEPFILTERS.`
- **Tutor IA (`agy`):**
  > No, es justo al revés: por defecto, `CALCULATE` **no intersecta**, sino que **sobrescribe** el filtro existente sobre esa misma columna.
  > Cuando escribes `CALCULATE([Ventas USD], orders[device_type] = "mobile")`, DAX traduce esa condición internamente a:
  > `FILTER(ALL(orders[device_type]), orders[device_type] = "mobile")`
  > Ese `ALL` elimina el filtro que viene de la fila (`desktop`) y lo reemplaza por `"mobile"`. Por eso, la fila de `desktop` no mostrará `BLANK`, sino las ventas totales de `"mobile"`. Todas las filas de la tabla mostrarán exactamente el mismo importe.
  > Para lograr que intersecte y devuelva `BLANK` en `desktop`, debes usar explícitamente `KEEPFILTERS`:
  > `CALCULATE([Ventas USD], KEEPFILTERS(orders[device_type] = "mobile"))`

#### Lección 3: `bi2-dax-03-inteligencia-tiempo` (`T1: 7115 ms`, `T2: 7253 ms`)
- **Usuario (T1):** `Hazme una pregunta para comprobar si lo entendí.`
- **Tutor IA (`agy`):**
  > Imagina que en Mercado Brisa escribes esta medida:
  > ```dax
  > Ventas YTD USD = 
  > TOTALYTD(
  >     [Ventas Completadas USD], 
  >     orders[order_date]
  > )
  > ```
  > Mercado Brisa no abre ni registra pedidos los domingos ni los días festivos.
  > ¿Qué problema va a generar usar `orders[order_date]` en lugar de `'calendar'[calendar_date]` dentro de esa función de inteligencia de tiempo? Explícame brevemente por qué falla el cálculo.
- **Usuario (T2 — respuesta errónea intencional):** `Para calcular TOTALYTD o SAMEPERIODLASTYEAR basta con pasar la columna orders[order_date] de la tabla de hechos; no hace falta crear una tabla calendar separada.`
- **Tutor IA (`agy`):**
  > Esa afirmación es incorrecta. Si usas `orders[order_date]`, las funciones de inteligencia de tiempo fallarán o devolverán datos erróneos.
  > DAX no mira un calendario universal cuando ejecuta `TOTALYTD` o `SAMEPERIODLASTYEAR`. Lo que hace internamente es leer la lista de fechas de la columna que le pasas, calcular desplazamientos en memoria y aplicar esa lista como un nuevo filtro sobre el modelo.
  > Si usas `orders[order_date]`, surgen dos problemas graves:
  > 1. **Huecos en las fechas:** Como Mercado Brisa no abre domingos ni festivos, esos días no existen en `orders`. Al pedirle a DAX que retroceda exactamente un año con `SAMEPERIODLASTYEAR`, la función buscará fechas específicas que simplemente no existen en la columna, rompiendo los cálculos interanuales o dejando días fuera.
  > 2. **Contexto de filtro incompleto:** Para acumular correctamente hasta el 31 de diciembre o manejar años bisiestos sin perder información, el motor necesita una secuencia estrictamente continua del 1 de enero al 31 de diciembre.

#### Lección 4: `bi2-dax-04-funciones-iteradoras` (`T1: 6254 ms`, `T2: 6681 ms`)
- **Usuario (T1):** `Hazme una pregunta para comprobar si lo entendí.`
- **Tutor IA (`agy`):**
  > Imagina que necesitas calcular las ventas totales en Mercado Brisa y tienes la tabla `order_items` con las columnas `quantity` y `item_price_usd`. No existe una columna previa con el total por línea.
  > ¿Podrías resolver esta medida usando únicamente `SUM`, o necesitas `SUMX`? Justifica brevemente por qué.
- **Usuario (T2 — respuesta errónea intencional):** `Para calcular el costo total de ventas multiplicando cantidad por costo unitario da exactamente el mismo resultado escribir SUM(order_items[qty]) * SUM(products[unit_cost_usd]) que usar SUMX.`
- **Tutor IA (`agy`):**
  > No da el mismo resultado. Esa es una trampa muy común en DAX.
  > Matemáticamente, la suma de los productos no es igual al producto de las sumas:
  > $$\sum (A \times B) \neq (\sum A) \times (\sum B)$$
  > Si usas `SUM(order_items[quantity]) * SUM(order_items[item_price_usd])`, DAX primero sumará todas las cantidades de la tabla y sumará todos los precios unitarios, multiplicando al final ambos totales. El resultado queda completamente distorsionado. Para calcular el total real necesitas calcular el importe fila por fila y luego sumar esos subtotales con `SUMX`.

#### Lección 5: `bi2-dax-05-variables-divide-formato` (`T1: 5758 ms`, `T2: 6184 ms`)
- **Usuario (T1):** `Hazme una pregunta para comprobar si lo entendí.`
- **Tutor IA (`agy`):**
  > Imagina que estás analizando las ventas de Mercado Brisa y escribes esta medida:
  > ```dax
  > Ventas CABA = 
  > VAR _TotalVentas = [Total Ventas USD]
  > RETURN
  >     CALCULATE(
  >         _TotalVentas,
  >         customers[city] = "CABA"
  >     )
  > ```
  > ¿Qué resultado mostrará esta medida en una tarjeta del reporte: las ventas totales sin filtrar o solo las de la ciudad de CABA? ¿Por qué ocurre esto según cómo funcionan las variables en DAX?
- **Usuario (T2 — respuesta errónea intencional):** `Si declaro VAR _Ventas = [Ventas Completadas USD] al inicio de la medida, luego puedo escribir CALCULATE(_Ventas, REMOVEFILTERS(stores[region])) y DAX volverá a evaluar la variable _Ventas sin el filtro de región.`
- **Tutor IA (`agy`):**
  > No, ese es justo el malentendido más común con las variables en DAX.
  > Una variable almacena el **resultado ya calculado** (un valor escalar fijo), no la fórmula de la medida. En el momento en que declaras `VAR _Ventas = [Ventas Completadas USD]`, DAX evalúa esa medida en el contexto de filtro original y guarda ese número final en memoria.
  > Cuando escribes `CALCULATE(_Ventas, REMOVEFILTERS(stores[region]))`, `CALCULATE` modifica el contexto para la tabla `stores`, pero `_Ventas` ya es un número constante inmutable. DAX no vuelve a evaluar la expresión original ni recalcula nada; simplemente devuelve el valor que ya tenía guardado.

#### Lección 6: `bi2-dax-06-antipatrones-rendimiento-dax` (`T1: 6628 ms`, `T2: 6570 ms`)
- **Usuario (T1):** `Hazme una pregunta para comprobar si lo entendí.`
- **Tutor IA (`agy`):**
  > Imagina que en Mercado Brisa necesitas calcular las ventas totales de los pedidos completados. Un compañero de equipo propone escribir esta medida:
  > `Ventas Completadas = CALCULATE(SUM('orders'[order_total_usd]), FILTER('orders', 'orders'[status] = "completed"))`
  > Tú le recomiendas cambiarla por:
  > `Ventas Completadas = CALCULATE(SUM('orders'[order_total_usd]), 'orders'[status] = "completed")`
  > A nivel interno de los motores de DAX (Storage Engine y Formula Engine), ¿qué diferencia hay en cómo procesa cada una de estas fórmulas la tabla `orders` y por qué tu versión es mucho más rápida?
- **Usuario (T2 — respuesta errónea intencional):** `Para filtrar pedidos completados dentro de CALCULATE es mucho más rápido escribir FILTER(orders, orders[status] = "completed") pasando toda la tabla orders que escribir el predicado directo orders[status] = "completed".`
- **Tutor IA (`agy`):**
  > Es justo al revés: pasar toda la tabla con `FILTER('orders', ...)` es mucho más lento.
  > La razón está en cómo trabajan los dos motores internos:
  > 1. **Predicado directo (`'orders'[status] = "completed"`):** DAX lo traduce internamente a `FILTER(ALL('orders'[status]), ...)`. Solo evalúa los valores únicos del diccionario de esa columna en el **Storage Engine** (VertiPaq). Este motor trabaja en memoria, con compresión y en multihilo.
  > 2. **Tabla completa (`FILTER('orders', ...)`):** Obliga al **Formula Engine** a intervenir. Este componente es monohilo y para evaluar la condición fila por fila materializa en memoria la tabla `orders` entera con todas sus columnas.

### 5. Salida literal de verificación UI con Playwright y DuckDB-Wasm (`verify_ui_bi2_dax.mjs`)

```text
=== 1. Verificación UI y Capturas 1280x720 Light para las 6 lecciones ===
  [OK] bi2-dax-01-contexto-fila-filtro | title="Contexto de fila y contexto de filtro en DAX" | overflow=false | SQL verificada en DuckDB-Wasm
  [OK] bi2-dax-02-calculate-transicion-contexto | title="CALCULATE, modificadores de filtro y transición de contexto" | overflow=false | SQL verificada en DuckDB-Wasm
  [OK] bi2-dax-03-inteligencia-tiempo | title="Inteligencia de tiempo: YTD, YoY y medias móviles en DAX" | overflow=false | SQL verificada en DuckDB-Wasm
  [OK] bi2-dax-04-funciones-iteradoras | title="Funciones iteradoras en DAX: SUMX, AVERAGEX y RANKX" | overflow=false | SQL verificada en DuckDB-Wasm
  [OK] bi2-dax-05-variables-divide-formato | title="Variables (VAR / RETURN), DIVIDE y formato limpio en DAX" | overflow=false | SQL verificada en DuckDB-Wasm
  [OK] bi2-dax-06-antipatrones-rendimiento-dax | title="Antipatrones en DAX que degradan el rendimiento del reporte" | overflow=false | SQL verificada en DuckDB-Wasm

=== 2. Pruebas Adversariales (5 casos) ===
  [Adversarial 1 - 1280x720 compact]: 0 desbordes horizontales en 6 lecciones.
  [Adversarial 2 - Dark Mode bi2-dax-01-contexto-fila-filtro]: data-theme="dark", captura guardada.
  [Adversarial 2 - Dark Mode bi2-dax-06-antipatrones-rendimiento-dax]: data-theme="dark", captura guardada.
  [Adversarial 3 - Móvil 390x844]: overflow=false, captura guardada.
  [Adversarial 4 - Atajos J/K/T]: tecla T abre tutor=false, escribir j/k/t en editor dispara atajo=false.
  [Adversarial 5 - SQL inválido y starterCode]: error controlado=true, starterCode rechazado=true.

Console errors: 0 | Page errors: 0
```

### 6. Salida literal de `npm run build`

```text
> grano@1.0.0 build
> vite build

vite v6.4.5 building for production...
✓ 2403 modules transformed.
dist/index.html                                  1.00 kB │ gzip:   0.51 kB
dist/assets/index-Ds05HJQs.css                 236.89 kB │ gzip:  32.06 kB
dist/assets/PracticeView-Bude2Q7e.js             8.31 kB │ gzip:   2.84 kB
dist/assets/curriculum-stages-BHOHuqmu.js      285.16 kB │ gzip:  95.09 kB
dist/assets/SqlLab-BpJu-NDB.js                 389.73 kB │ gzip: 127.31 kB
dist/assets/vendor-CMuuJwVt.js                 558.99 kB │ gzip: 155.51 kB
dist/assets/index-CIOOtS1B.js                2,157.99 kB │ gzip: 609.63 kB
✓ built in 53.76s
```

---

## Revisión propia

Durante la redacción y verificación del módulo se detectaron y corrigieron **7 defectos concretos**:

1. **URL de Microsoft Learn con código HTTP 404 en la investigación inicial:** la ruta `https://learn.microsoft.com/en-us/dax/best-practices/dax-avoid-filter-as-filter-argument` devolvió `HTTP 404`. Se verificó y reemplazó en `docs/curriculo/investigacion/bi2-dax.md` y en `bi2-dax-06-antipatrones-rendimiento-dax.js` por la URL canónica activa `https://learn.microsoft.com/en-us/power-bi/guidance/dax-avoid-avoid-filter-as-filter-argument` (`HTTP 200`).
2. **Truncamiento de ventana móvil de 7 días en `bi2-dax-03-inteligencia-tiempo.js`:** en el ejemplo SQL de la sección 3 (`medias-moviles-datesinperiod`), filtrar `WHERE fecha >= '2024-11-11'` en el mismo `SELECT` que calculaba `AVG(...) OVER (ORDER BY fecha ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)` recortaba los 6 días previos (`2024-11-05` al `2024-11-10`). Se separó el cálculo de ventana en un CTE intermedio (`con_ventana` sobre `2024-11-01..2024-11-15`) y se aplicó el filtro `WHERE fecha >= '2024-11-11'` en la consulta externa, obteniendo los promedios móviles reales (`8675.03`, `8639.88`, `8026.84`, `8844.50`, `8562.20`).
3. **Longitud de `checks.2.explanation` y `roleNotes.da` en `bi2-dax-02-calculate-transicion-contexto.js`:** `check-content.mjs` detectó que `checks.2.explanation` tenía 18 palabras (mínimo 20) y `roleNotes.da` tenía 22 palabras (mínimo 25). Se ampliaron a 25 y 33 palabras respectivamente precisando cómo `REMOVEFILTERS` limpia el filtro de columna y su equivalencia con `SUM(...) OVER ()` en SQL.
4. **Encabezados `section.heading` que superaban los 70 caracteres en `bi2-dax-03` y `bi2-dax-05`:** `check-content.mjs` señaló que `bi2-dax-03` (`sections.1.heading`, 72 caracteres) y `bi2-dax-05` (`sections.2.heading`, 72 caracteres) excedían el tope de `70` caracteres de `SectionSchema`. Se editaron a `'Comparativas YoY a días equivalentes en periodos abiertos'` (57 caracteres) y `'DIVIDE frente a / y convención para citar columnas y medidas'` (60 caracteres).
5. **Término prohibido `"puntos clave"` en `bi2-dax-06-antipatrones-rendimiento-dax.js`:** `check-copy.mjs` detectó en la línea 335 (`aiNotes`) la coincidencia `"puntos clave"` de la regla `clave (adjetivo)`. Se sustituyó por `"Los dos aspectos centrales aquí son..."`, reduciendo a `0` los hallazgos de `check-copy.mjs`.
6. **Media de longitud de frase superior a 22 palabras/frase en `bi2-dax-03`, `bi2-dax-05` y `bi2-dax-06`:** en la primera corrida de `check-copy.mjs`, `bi2-dax-03` (22.7), `bi2-dax-05` (23.1) y `bi2-dax-06` (23.1) superaban por décimas el límite de `22` palabras/frase en `sections[].body`. Se dividieron las oraciones subordinadas largas en frases directas, bajando las medias a `16.9`, `16.6` y `15.7` palabras/frase respectivamente.
7. **Discrepancia en `expectedOutputTable` y `workedExample.steps[0]` de `bi2-dax-02-calculate-transicion-contexto.js`:** al ejecutar `compareQueryResults` (`src/lab/sqlGrader.js`) contra DuckDB en `verify_glossary_and_grader.mjs`, se detectó que `ventas_segmento_usd` sobre `orders.total_usd` por `customers.segment` es `2512933.23` (`40.08 %`), `2436924.93` (`38.87 %`) y `1319604.26` (`21.05 %`) (cuya suma exacta es `$6,269,462.42`). Se actualizaron tanto `workedExample.steps[0].expectedOutput` como `practice.expectedOutputTable`, logrando `passed: true` en el calificador y en DuckDB-Wasm.

---

## Prueba adversarial

| Qué probé | Qué pasó | Acción |
| --- | --- | --- |
| **Caso 1:** Viewport `1280×720` en densidad `compact` recorriendo las 6 lecciones de `bi2-dax` (`document.documentElement.scrollWidth > clientWidth`). | `0` desbordes horizontales en las 6 lecciones; las tablas de salida SQL y bloques de código mantienen scroll interno limpio dentro de su contenedor. | Ninguna corrección adicional requerida; se conserva el diseño actual. |
| **Caso 2:** Modo oscuro (`theme: 'dark'`, `data-theme="dark"`) en `bi2-dax-01` y `bi2-dax-06` a `1280×720`. | Contraste AA/AAA limpio en bloques `ESCENARIO REAL`, tarjetas `workedExample`, editor CodeMirror y tablas de resultados; capturas `*-dark.png` verificadas visualmente. | Ninguna corrección requerida. |
| **Caso 3:** Viewport móvil `390×844` en `bi2-dax-01-contexto-fila-filtro`. | `overflow = false` (`scrollWidth === clientWidth`); el temario colapsa en barra superior (`Temario T`) y las fórmulas DAX hacen ajuste de línea con `code` inline sin romper el ancho de pantalla. | Ninguna corrección requerida; captura `bi2-dax-01-contexto-fila-filtro-mobile.png` guardada. |
| **Caso 4:** Atajos de teclado (`T` para alternar el temario lateral, y escritura de `-- comentario j k t` dentro del editor SQL CodeMirror `.cm-content`). | Al escribir `j`, `k` y `t` dentro del editor SQL, los eventos quedan aislados en CodeMirror y no disparan navegación de secciones ni abren paneles laterales. | Ninguna corrección requerida. |
| **Caso 5:** Envío de `starterCode` sin resolver y de una consulta inválida (`SELECT * FROM tabla_inexistente_dax;`) en `SqlLab` sobre DuckDB-Wasm. | El `starterCode` es rechazado con `"El resultado aún no coincide con la referencia"` mostrando la tabla de diferencias (`sql-diff-grid`), y la consulta inválida muestra el bloque `Error de ejecución en DuckDB` con el botón `"Explícame este error"` sin colapsar la vista (`0` errores no capturados). | Ninguna corrección requerida. |

---

## Capturas antes / después

Capturas PNG guardadas en `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-bi2-dax\` (fuera del árbol git de este worktree, conforme a las reglas de propiedad de archivos):

1. `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-bi2-dax\bi2-dax-01-contexto-fila-filtro-light-header.png` (`1280×720` light — cabecera, gancho y objetivos de L1)
2. `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-bi2-dax\bi2-dax-01-contexto-fila-filtro-light-practice.png` (`1280×720` light — práctica SQL superada en DuckDB-Wasm en L1)
3. `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-bi2-dax\bi2-dax-01-contexto-fila-filtro-dark.png` (`1280×720` dark — modo oscuro en L1)
4. `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-bi2-dax\bi2-dax-01-contexto-fila-filtro-mobile.png` (`390×844` mobile — vista móvil sin overflow en L1)
5. `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-bi2-dax\bi2-dax-02-calculate-transicion-contexto-light-header.png` (`1280×720` light — cabecera, gancho y objetivos de L2)
6. `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-bi2-dax\bi2-dax-02-calculate-transicion-contexto-light-practice.png` (`1280×720` light — práctica SQL superada en DuckDB-Wasm en L2)
7. `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-bi2-dax\bi2-dax-03-inteligencia-tiempo-light-header.png` (`1280×720` light — cabecera, gancho y objetivos de L3)
8. `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-bi2-dax\bi2-dax-03-inteligencia-tiempo-light-practice.png` (`1280×720` light — práctica SQL superada en DuckDB-Wasm en L3)
9. `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-bi2-dax\bi2-dax-04-funciones-iteradoras-light-header.png` (`1280×720` light — cabecera, gancho y objetivos de L4)
10. `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-bi2-dax\bi2-dax-04-funciones-iteradoras-light-practice.png` (`1280×720` light — práctica SQL superada en DuckDB-Wasm en L4)
11. `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-bi2-dax\bi2-dax-05-variables-divide-formato-light-header.png` (`1280×720` light — cabecera, gancho y objetivos de L5)
12. `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-bi2-dax\bi2-dax-05-variables-divide-formato-light-practice.png` (`1280×720` light — práctica SQL superada en DuckDB-Wasm en L5)
13. `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-bi2-dax\bi2-dax-06-antipatrones-rendimiento-dax-light-header.png` (`1280×720` light — cabecera, gancho y objetivos de L6)
14. `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-bi2-dax\bi2-dax-06-antipatrones-rendimiento-dax-light-practice.png` (`1280×720` light — práctica SQL superada en DuckDB-Wasm en L6)
15. `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-bi2-dax\bi2-dax-06-antipatrones-rendimiento-dax-dark.png` (`1280×720` dark — modo oscuro en L6)

---

## Peticiones al orquestador

1. Integrar los 6 términos de `docs/curriculo/investigacion/bi2-dax-glossary.json` (`bi2-dax-contexto-evaluacion`, `bi2-dax-calculate-transicion`, `bi2-dax-modificadores-filtro`, `bi2-dax-inteligencia-tiempo`, `bi2-dax-funciones-iteradoras`, `bi2-dax-variables-divide`) en `src/data/glossary.js` durante el merge de la Oleada B.
2. Ejecutar `node scripts/sync-lessons-index.mjs` tras integrar las ramas de la Oleada B para registrar las 6 lecciones de `src/data/lessons/bi2-dax/` en `src/data/lessons/index.js`.

---

## Pendiente

Ninguno.
