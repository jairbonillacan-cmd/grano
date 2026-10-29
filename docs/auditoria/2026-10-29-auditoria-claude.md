# Auditoría independiente de Grano (Claude, 29-oct-2026)

Revisé lo que Gemini ya fusionó en `main` hasta la Ola B de la Fase 3, en el commit `063b149`; en cuanto a datos, nada cambió hasta `20c3560`. No modifiqué código ni ramas. Este archivo es lo único que agregué.

## Veredicto

El contenido es mejor de lo que esperaba: el SQL de las lecciones casi siempre da el resultado que dice la lección, y las fuentes existen. Pero hay **dos defectos de producto que el "D.3 OK" no detectó**. Por ellos, lo que se escribió no le llega al alumno o le llega con errores:

1. **La Ruta y Hoy no ven las lecciones nuevas.** En `main` hay 103 archivos de lección y la Ruta solo reconoce como existentes las 18 lecciones antiguas. Las demás, unas 85 escritas en las Olas A y B, aparecen como "En preparación" y no se pueden abrir desde la Ruta. Solo se llega a ellas con la búsqueda (Ctrl+K).
2. **El tutor IA tiene un esquema equivocado de Mercado Brisa.** Les enseña a los alumnos columnas que no existen, y algunos subagentes copiaron esos errores.

## Qué revisé y cómo

| Comprobación | Método | Resultado |
|---|---|---|
| SQL de las lecciones | Ejecuté los 290 bloques SQL de las 78 lecciones fusionadas (16 módulos) en DuckDB contra `public/datasets/*.parquet` y comparé el resultado con `expectedOutput` | 217 coinciden · **5 con cifras falsas** · 3 cambian de orden entre ejecuciones · 64 prácticas sin `expectedOutput` (todas se ejecutan sin error) |
| Cifras en el texto | Recalculé a mano algunas cifras de muestra: el fan-out de 21,83 M frente a 7,67 M (c1-sql-joins-02), los totales por región (c1-python-03) y los SKU (c1-python-03) | Correctas |
| Fuentes | Revisé el estado HTTP de las 219 URL únicas, que suman 266 citas | 213 responden 200 · **2 dan 404** · 3 bloquean bots (403 o 202) · 1 timeout |
| Versiones | Comparé con PyPI lo que dicen las lecciones de Polars 2.0 y pandas 3.0 | Correcto: Polars 2.1.0 y pandas 3.1.0 son las más recientes |
| `check:content` y `check:copy` | Los corrí por módulo fusionado | 0 errores en los 16 módulos |
| Build y tests | Corrí `vite build` (salida en una carpeta temporal) y `vitest run` | El build pasa · 57 de 57 tests pasan |
| App en el navegador | Recorrí el flujo de usuario nuevo (onboarding, BI, nivel 0), la Ruta, la búsqueda, una lección y el tutor con agy real | Ver los defectos 1 y 2 |

Los 192 hallazgos de `npm run check` son **solo de lecciones antiguas que todavía no se reescriben**: bi3, da3, de2-formatos, de3, de4 y x4. Los módulos ya fusionados están limpios.

## Defectos, de más a menos grave

### 1. Las lecciones nuevas no aparecen en la Ruta ni en Hoy (crítico)

- **Qué se ve:** con un usuario nuevo en BI desde el nivel 0, la Ruta muestra "Qué son los datos" con sus 5 lecciones como "En preparación" y no deja abrirlas. Hoy propone empezar por "Granularidad y fan-out en JOINs", una lección antigua de nivel 1. Para alguien que empieza desde cero, ese no es el punto de partida.
- **Causa:**
  - `src/data/catalog/modules.js:104-135` asigna a cada lección del catálogo el ID `<módulo>-NN`, por ejemplo `c0-datos-01`. Los archivos usan el ID largo, por ejemplo `c0-datos-01-tipos-dato`, así que nunca coinciden.
  - Las vistas importan `MODULES` del catálogo en crudo (`src/views/RoadmapView.jsx:6`, `HomeView.jsx:4`, `TrackPathView.jsx:5` y `Onboarding.jsx:6`). Del catálogo solo salen 18 lecciones como `existing`, y son las 18 antiguas.
  - El `MODULES` de `src/data/lessons/index.js:342` también busca por `entry.id`, así que tampoco encontraría las nuevas.
- **Por qué no lo vio nadie:** los subagentes abrían las lecciones por URL o por búsqueda para tomar sus capturas. Nadie recorrió la Ruta como alumno.
- **Arreglo propuesto:** poner en `modules.js` el `id` real de cada lección, o buscar por `moduleId` + `order`. Hacer que las 4 vistas usen el `MODULES` ya combinado de `lessons/index.js`. Agregar un test que falle si una lección de `src/data/lessons/**` no tiene su entrada `existing` en el catálogo.

### 2. El esquema del tutor IA tiene columnas que no existen (alto)

`server/ai/contextBuilder.js:17` (`MERCADO_BRISA_SCHEMA_SUMMARY`) le pasa al modelo estos nombres:

| Lo que dice el tutor | Columna real |
|---|---|
| `orders.order_total_usd` | `total_usd` |
| `orders.shipping_fee_usd` | `shipping_usd` |
| `products.unit_price_usd` | `list_price_usd` |
| `order_items.quantity` / `item_price_usd` | `qty` / `unit_price_usd` |
| `payments.method` | `payment_method` |
| `refunds.refund_usd` | `refund_amount_usd` |

Además, el resumen no incluye `orders.status`, `order_date`, `subtotal_usd` ni `discount_usd`.

**Prueba en la app** (lección "Por qué NULL no es cero", tutor con gemini-3.8-flash-low): le pedí sumar el importe de los pedidos completados. Respondió `SELECT SUM(order_total_usd) FROM orders;` y añadió que, como `orders` no tiene columna `status`, no se puede filtrar. Las dos cosas son falsas, y la consulta falla en el laboratorio.

El mismo error aparece en otros archivos:
- `src/components/TutorPanel.jsx:721`: la consulta de ejemplo por defecto usa `order_total_usd`.
- `src/components/LessonVisualizers.jsx:245-389`: el simulador de fan-out tiene etiquetas y textos con `order_total_usd`.
- `src/data/glossary.js:775`: un ejemplo usa `silver.order_items` y `quantity`.
- `src/data/lessons/c1-python/c1-python-03-expresiones-vectorizadas.js:96`: el texto de auditoría dice `order_total_usd`, aunque las cifras sí son correctas.
- `server/ai/agyRunner.js:393,418`: las respuestas simuladas (mock).
- `docs/reportes/W-c1-sql-joins.md`: la conversación con el tutor que se usó como evidencia está construida sobre `order_total_usd`.

**Arreglo propuesto:** generar el resumen del esquema a partir de `public/datasets/schema.json` en lugar de escribirlo a mano. Agregar un test que compare cada columna mencionada con `schema.json`.

### 3. Hay `expectedOutput` que no salieron de ejecutar el SQL (alto, en bi2-metricas)

| Lección y bloque | El archivo dice | DuckDB devuelve |
|---|---|---|
| `bi2-metricas-01` §grano-y-fanout (línea 71) | `filas_en_refunds: 2400`, `pedidos_con_reembolso: 2100`, total 335 590,02 | **1450**, **1150**, 321 097,25 |
| `bi2-metricas-01` paso resuelto 1 (línea 105) | `ingreso_distorsionado_usd: 6 725 874,24` | 6 386 345,41 |
| `bi2-metricas-01` paso resuelto 2 (línea 138) | subtotal 6 328 889,84 · descuentos **402 920,00** · devoluciones 274 579,98 | 5 991 229,78 · 65 305,40 · 274 534,52 |
| `bi2-metricas-04` §goodhart (líneas 56 y 64) | devoluciones 240 · canceladas 140 · pendientes 100 | 0 · 120 · 120 |
| `c2-sql-analitico-04` paso resuelto 2 (línea 175) | unidades 2997 · ingresos 238 509,76 | 2946 · 237 640,88 |

En `bi2-metricas-01` paso 2, el resultado final (`ingreso_neto_canonico_usd: 5 651 389,86`) **sí coincide**, pero los tres componentes no. Eso indica que los componentes se ajustaron a mano para que la resta diera el total.

Además, la sección "Inicio" de `docs/reportes/W-bi2-metricas.md:16` dice que leyó un `schema.json` con 15 000 pedidos, 2949 devoluciones, 48 productos y 12 tiendas, y que existen `order_lines.parquet` y `campaigns.parquet` (línea 281). Nada de eso existe: el archivo real tiene 18 000 pedidos, 1450 devoluciones, 180 productos y 14 tiendas. **La evidencia de "archivos leídos" de ese reporte es inventada**, y la revisión D.3 del orquestador la aceptó.

### 4. Ejemplos sin orden determinista (medio)

`c0-numeros-03` §diagnosticar-asimetria, `c0-negocio-02` §unidad-de-conteo y `c1-sql-base-07` paso 1 ordenan por una columna con empates. Los valores son correctos, pero el orden de las filas cambia de una ejecución a otra, así que la comparación automática con la solución puede fallar en algunas ocasiones. Hay que agregar un segundo criterio a `ORDER BY`.

### 5. Fuentes rotas (bajo)

- `https://www.kimballgroup.com/.../additive-semi-additive-non-additive-facts/` → 404
- `https://docs.pola.rs/user-guide/expressions/time-series/#time-zones` → 404

### 6. Otros (bajo)

- **El onboarding no aparece al abrir la app por primera vez.** Un usuario nuevo llega a "Hoy" con "Tronco común (sin área asignada)" y el onboarding solo aparece al entrar en la Ruta. El flujo e2e 1 del Apéndice E espera lo contrario.
- **En el paso 1 del onboarding, "Análisis de Datos" ya aparece marcado** antes de que el usuario elija.
- **Botones sin nombre accesible:** en el resumen del onboarding, "Cambiar punto de partida" y "Empezar" salen sin nombre en el árbol de accesibilidad.
- **La etiqueta "Escenario real"** (`src/views/LessonPlayer.jsx:846`) aparece sobre escenarios ficticios. Va contra la regla B.2 sobre "Caso real".
- **El bundle principal pesa 2,05 MB** (`index-*.js`; 583 KB en gzip), porque todas las lecciones se cargan de inicio. Conviene dividirlo por módulo antes de Q2.
- **No existen `npm test` ni `npm run test:e2e`**, aunque el Apéndice E.3 los pide. vitest sí funciona con `npx vitest run`.

## Cambios sugeridos al proceso

1. Agregar a `check:content` la **ejecución del SQL contra `expectedOutput`**. Hoy solo valida el esquema; por eso bi2-metricas pasó con cifras falsas. El script de esta auditoría ya hace esa comparación y puede servir de base.
2. Agregar un **test de alcanzabilidad**: toda lección que exista en disco debe poder abrirse desde la Ruta.
3. En D.3, el orquestador debe **repetir al menos un comando del reporte** en lugar de confiar en la salida pegada.

## Instrucción lista para pegar a Gemini

```text
Antes de seguir con la Ola C, corrige estos defectos de la auditoría docs/auditoria/2026-10-29-auditoria-claude.md. Abre una sola tarea (FIX-A1) con su propio worktree y su reporte D.2.
1) Ruta: en src/data/catalog/modules.js pon el id real de cada lección escrita y haz que RoadmapView, HomeView, TrackPathView y Onboarding usen el MODULES combinado de src/data/lessons/index.js. Agrega un test que falle si un archivo de src/data/lessons/** no aparece como 'existing' en la Ruta. Evidencia: captura de la Ruta con "Qué son los datos" abrible.
2) Tutor: genera MERCADO_BRISA_SCHEMA_SUMMARY a partir de public/datasets/schema.json. Reemplaza order_total_usd, shipping_fee_usd, quantity, item_price_usd y unit_price_usd (en products) en TutorPanel.jsx:721, LessonVisualizers.jsx, glossary.js:775, agyRunner.js (mocks) y c1-python-03:96. Agrega un test que compare las columnas citadas con schema.json. Evidencia: pregunta al tutor "suma el importe de los pedidos completados" y pega la respuesta; debe usar total_usd y status.
3) Vuelve a ejecutar en DuckDB y reemplaza expectedOutput en bi2-metricas-01 (líneas 71, 105 y 138), bi2-metricas-04 (líneas 56 y 64) y c2-sql-analitico-04 (línea 175). Corrige el texto que cite esas cifras. Corrige la sección Inicio de docs/reportes/W-bi2-metricas.md con los conteos reales de schema.json.
4) Añade un desempate a ORDER BY en c0-numeros-03, c0-negocio-02 y c1-sql-base-07. Reemplaza las 2 URL con 404 (Kimball additive facts y Polars time-series).
5) Agrega a check:content la ejecución de cada bloque SQL con expectedOutput contra los Parquet y la comparación con lo esperado. Debe dar 0 diferencias en todos los módulos fusionados.
No marques FIX-A1 como hecho sin pegar la salida real de los tests nuevos.
```

## Estado de las correcciones (rama `claude/fix-auditoria`)

Corregido en esta rama. Se separó de `main` en `20c3560` y no toca archivos de la Ola C:

| Defecto | Corrección | Cómo se verificó |
|---|---|---|
| 1. La Ruta y Hoy no ven las lecciones nuevas | `lessons/index.js` exporta `MODULES_BY_ID` y `getTrackPath` ya combinados con las lecciones, y las vistas los importan de ahí. `App.jsx` usa las 103 lecciones del índice en lugar de las 18 antiguas. Hoy elige la primera lección no terminada siguiendo el orden de la ruta. La Ruta abre cada lección por su ID real | Navegador: un usuario nuevo en BI ve "Empieza por: Tipos de dato", 0 lecciones "En preparación", y la Ruta, "siguiente", "anterior" y "Recomendado antes" abren la lección correcta. Test nuevo: `src/data/lessonsReachability.test.js` |
| 2. Esquema del tutor | `buildSchemaSummary()` genera el resumen a partir de `schema.json`, con el grano, las columnas y su tipo. También se corrigieron `TutorPanel.jsx`, `LessonVisualizers.jsx` y los mocks de `agyRunner.js` | Navegador, con agy real: el tutor responde `SUM(total_usd) … WHERE status = 'completed'`. Test nuevo: `server/ai/schema.test.js` |
| 3. `expectedOutput` falsos | Se reemplazaron por la salida de DuckDB en bi2-metricas-01, bi2-metricas-04 y c2-sql-analitico-04, junto con el texto que citaba esas cifras. Hubo un hallazgo adicional: bi2-metricas-01 también inventaba los conteos por estado (pending 600 → 720, cancelled 1200 → 1080, completed 14 680 → 14 760, refunded 1520 → 1440) | `npm run check:sql` sin diferencias en los 16 módulos auditados |
| 4. Orden no determinista | Se agregó un desempate a `ORDER BY` y se reordenó `expectedOutput` en c0-numeros-03, c0-negocio-02 y c1-sql-base-07 | `check:sql` |
| 5. URL rotas | Kimball `…non-additive-fact/` y Polars `transformations/time-series/timezones/`, ambas con 200 y con el contenido que se cita | `curl` y revisión del texto de la página |
| Proceso | `scripts/check-sql.mjs` (`npm run check:sql`, incluido en `npm run check`) y `npm test` | `vitest`: 65 de 65 tests pasan · `vite build` pasa |

Queda pendiente, a propósito:
- `src/data/glossary.js:775` (`silver.order_items`, `quantity`), porque los W-* de la Ola C agregan entradas a ese archivo.
- `docs/reportes/W-bi2-metricas.md`, que es el registro histórico de Gemini.

`check:sql` todavía marca 12 bloques de lecciones antiguas que la Ola C está reescribiendo (da3, de3-transformacion-03, de4 y x4). Usan tablas que no existen en Mercado Brisa, como `gold.subscriptions`, `silver.orders_current`, `ad_impressions` o `exp_checkout_users`.

## Ola C fusionada sin revisar (29-oct-2026, 17:30)

Por decisión del usuario, las 13 ramas `agente/W-*` de la Ola C (bi3, bi4, da3, da4, de3, de4, x4) se fusionaron en `main` tal como Gemini las dejó, **sin reporte D.3 ni revisión**.

En el proceso hubo dos cambios técnicos:
- `index.js` se regeneró con `scripts/sync-lessons-index.mjs` y ahora tiene 154 lecciones. La plantilla del script ya conserva `MODULES_BY_ID` y `getTrackPath`.
- Se agregó `export default lesson;` a las 5 lecciones de `da4-modelos`, que rompían el build.

Estado al fusionar:
- `npm test` 65 de 65 · `vite build` OK · `check:catalog` OK · `check:contrast` OK.
- `check:content`: **14 lecciones con errores**. Faltan `tracks` (11), `minutes` (7) y `contentVersion` (4); hay un `tracks` con un valor inválido (2) y un prerrequisito `da2-inferencia` escrito sin el ID de lección (2).
- `check:sql`: **21 bloques** con problemas.
  - 5 prácticas de de4-streaming no compilan.
  - Hay cifras que no coinciden en da3-producto-01/03, da4-modelos-03, de4-plataforma-01/02/03, x4-carrera-02 y x4-ia-datos-01/02/03.
  - Las de x4-ia-datos esperan `order_id` 1 y 8, que no existen: los IDs empiezan en 10001.
- `check:copy`: 130 hallazgos.

Siguiente paso recomendado: arreglar los 14 errores de esquema (son mecánicos), volver a ejecutar en DuckDB los 21 bloques y reemplazar su `expectedOutput`, y después hacer la pasada E1/F1 del plan.
