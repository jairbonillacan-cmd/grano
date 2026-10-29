# Reporte de cierre · Subagente `W-de2-formatos`

- **Módulo:** `de2-formatos` — *Formas físicas y motores locales* (Nivel 2 · Área `de` Ingeniería de Datos)
- **Rama y worktree:** `agente/W-de2-formatos` en `C:\Users\T490s\Desktop\Proyectos\ING-W-de2-formatos`
- **Puerto de verificación Vite:** `http://localhost:5213/`
- **Fecha:** `2026-10-29`

---

## 1. Archivos creados y actualizados (propiedad exclusiva de `W-de2-formatos`)

| # | Archivo | Tipo / Rol | Estado |
|---|---|---|---|
| 1 | `src/data/lessons/de2-formatos/de2-formatos-01-columnar-parquet.js` | Lección 1 (`order: 1`, `minutes: 30`, `legacyId: 'l7-columnar-parquet'`, `legacyOrder: 7`) — Reescrita desde cero sin `needsReview` | Completado (`1 151` palabras, `16.45` palabras/frase) |
| 2 | `src/data/lessons/de2-formatos/de2-formatos-02-arrow-lance-vortex.js` | Lección 2 (`order: 2`, `minutes: 30`, `legacyId: 'l8-arrow-lance-vortex'`, `legacyOrder: 8`) — Reescrita desde cero sin `needsReview` | Completado (`1 089` palabras, `13.22` palabras/frase) |
| 3 | `src/data/lessons/de2-formatos/de2-formatos-03-duckdb-polars-marimo.js` | Lección 3 (`order: 3`, `minutes: 30`, `legacyId: 'l9-duckdb-polars-marimo'`, `legacyOrder: 9`) — Reescrita desde cero sin `needsReview` | Completado (`1 059` palabras, `12.70` palabras/frase) |
| 4 | `src/data/lessons/de2-formatos/de2-formatos-04-codificacion-compresion-zstd.js` | Lección 4 nueva (`order: 4`, `minutes: 25`) — *Codificación diccionario, RLE, delta y compresión Zstandard* | Completado (`1 039` palabras, `16.38` palabras/frase) |
| 5 | `src/data/lessons/de2-formatos/de2-formatos-05-particionado-archivos-pequenos.js` | Lección 5 nueva (`order: 5`, `minutes: 25`) — *Particionado Hive, archivos pequeños y ordenamiento físico* | Completado (`1 037` palabras, `19.92` palabras/frase) |
| 6 | `docs/curriculo/investigacion/de2-formatos.md` | Investigación de 18 fuentes verificadas (`HTTP 200`), mapa de progresión de conceptos y rúbrica 0–4 del proyecto del módulo | Completado |
| 7 | `docs/curriculo/investigacion/de2-formatos-glossary.json` | 14 términos del glosario del módulo (definiciones de 20 a 25 palabras validadas con `GlossaryListSchema`) | Completado |
| 8 | `docs/reportes/W-de2-formatos.md` | Reporte técnico de verificación, respuestas reales de `agy`, capturas Playwright y autoevaluación | Completado |

---

## 2. Validación de esquema (`check-content`) y auditoría de copy (`check-copy`)

Salida real ejecutada en el worktree (`node scripts/check-content.mjs --module de2-formatos` y `node scripts/check-copy.mjs --path src/data/lessons/de2-formatos`):

```text
=== Validación de contenido v2 (check-content) ===
Lección (id v2)                                | Módulo               | Niv  | Sec  | Chk  | Src  | Palabras  | Estado    
--------------------------------------------------------------------------------------------------------------------------
de2-formatos-01-columnar-parquet               | de2-formatos         | 2    | 3    | 3    | 4    | 1151      | OK        
de2-formatos-02-arrow-lance-vortex             | de2-formatos         | 2    | 3    | 3    | 4    | 1089      | OK        
de2-formatos-03-duckdb-polars-marimo           | de2-formatos         | 2    | 3    | 3    | 4    | 1059      | OK        
de2-formatos-04-codificacion-compresion-zstd   | de2-formatos         | 2    | 3    | 3    | 3    | 1039      | OK        
de2-formatos-05-particionado-archivos-pequenos | de2-formatos         | 2    | 3    | 3    | 3    | 1037      | OK        
--------------------------------------------------------------------------------------------------------------------------
Resumen: 5 lecciones inspeccionadas | 5 válidas | 0 con advertencias (needsReview) | 0 con errores.

Resultado: OK (0 errores de esquema o integridad).

=== Auditoría anti-slop de copy (check-copy) ===
Archivos escaneados: 5

0 hallazgos de términos prohibidos, emojis, "2026" o exceso de negritas.
Total de hallazgos: 0
```

### Métricas de legibilidad (`sections[].body`) y verificación de URLs

| Lección | Palabras totales | Palabras en `sections[].body` | Frases | Media (`<= 22` palabras/frase) | Fuentes verificadas (`HTTP 200`) |
|---|---:|---:|---:|---:|---:|
| `de2-formatos-01-columnar-parquet` | `1 151` | `510` | `31` | **`16.45`** | `4 / 4` (`200 OK`) |
| `de2-formatos-02-arrow-lance-vortex` | `1 089` | `476` | `36` | **`13.22`** | `4 / 4` (`200 OK`) |
| `de2-formatos-03-duckdb-polars-marimo` | `1 059` | `470` | `37` | **`12.70`** | `4 / 4` (`200 OK`) |
| `de2-formatos-04-codificacion-compresion-zstd` | `1 039` | `475` | `29` | **`16.38`** | `3 / 3` (`200 OK`) |
| `de2-formatos-05-particionado-archivos-pequenos` | `1 037` | `478` | `24` | **`19.92`** | `3 / 3` (`200 OK`) |

---

## 3. Verificación de consultas SQL, `expectedOutputTable` y guardia de `starterCode` en DuckDB

Todas las consultas SQL de `sections[].example.code`, `workedExample.steps[].code` y `practice.solution` fueron ejecutadas contra `@duckdb/node-api` y contra DuckDB-WASM en navegador sobre `public/datasets/*.parquet`:

```text
========================================
LECCIÓN: de2-formatos-01-columnar-parquet
  [Section anatomia-parquet-poda-columnas] SQL match: true (6 rows)
  [Section zone-maps-indice-paginas] SQL match: true (3 rows)
  [Section filtros-bloom-alta-cardinalidad] SQL match: true (1 rows)
  [WorkedExample "Paso 1 — Medir el ahorro de proyect..."] SQL match: true (1 rows)
  [WorkedExample "Paso 2 — Inspeccionar las columnas ..."] SQL match: true (5 rows)
  [WorkedExample "Paso 3 — Ejecutar un filtro SARGabl..."] SQL match: true (3 rows)
  [Practice Solution] SQL match: true (6 rows)
  [Practice StarterCode Guard] Fails as expected: true (Throws SQL error: Binder Error: Referenced column "net_revenue_usd" not found in FROM clause!)

========================================
LECCIÓN: de2-formatos-02-arrow-lance-vortex
  [Section arrow-memoria-zero-copy] SQL match: true (5 rows)
  [Section materializacion-tardia-parquet] SQL match: true (3 rows)
  [Section lance-vortex-nueva-generacion] SQL match: true (5 rows)
  [WorkedExample "Paso 1 — Inspeccionar los conteos d..."] SQL match: true (5 rows)
  [WorkedExample "Paso 2 — Filtrar primero en columna..."] SQL match: true (3 rows)
  [WorkedExample "Paso 3 — Ejecutar cálculo vectoriza..."] SQL match: true (5 rows)
  [Practice Solution] SQL match: true (5 rows)
  [Practice StarterCode Guard] Fails as expected: true (Throws SQL error: Binder Error: Referenced column "gross_margin_usd" not found in FROM clause!)

========================================
LECCIÓN: de2-formatos-03-duckdb-polars-marimo
  [Section duckdb-ejecucion-vectorizada-local] SQL match: true (6 rows)
  [WorkedExample "Paso 1 — Auditar la distribución de..."] SQL match: true (4 rows)
  [WorkedExample "Paso 2 — Cruzar pedidos completados..."] SQL match: true (6 rows)
  [WorkedExample "Paso 3 — Consolidar métricas por se..."] SQL match: true (3 rows)
  [Practice Solution] SQL match: true (3 rows)
  [Practice StarterCode Guard] Fails as expected: true (Throws SQL error: Binder Error: Referenced column "revenue_usd" not found in FROM clause!)

========================================
LECCIÓN: de2-formatos-04-codificacion-compresion-zstd
  [Section codificacion-diccionario-rle-bitpacking] SQL match: true (6 rows)
  [Section empaquetado-delta-enteros-timestamps] SQL match: true (6 rows)
  [Section compresion-bloques-zstandard-rfc8878] SQL match: true (2 rows)
  [WorkedExample "Paso 1 — Inspeccionar codificacione..."] SQL match: true (6 rows)
  [WorkedExample "Paso 2 — Medir el potencial de rach..."] SQL match: true (6 rows)
  [WorkedExample "Paso 3 — Comparar el peso total de ..."] SQL match: true (2 rows)
  [Practice Solution] SQL match: true (6 rows)
  [Practice StarterCode Guard] Fails as expected: true (Throws SQL error: Binder Error: Referenced column "compression_ratio" not found in FROM clause!)

========================================
LECCIÓN: de2-formatos-05-particionado-archivos-pequenos
  [Section particionado-hive-y-pruning] SQL match: true (1 rows)
  [Section small-files-problem] SQL match: true (6 rows)
  [Section ordenamiento-fisico-clustering] SQL match: true (5 rows)
  [WorkedExample "Paso 1 — Cuantificar el sobre-parti..."] SQL match: true (1 rows)
  [WorkedExample "Paso 2 — Evaluar particionado anual..."] SQL match: true (3 rows)
  [WorkedExample "Paso 3 — Auditar el volumen por par..."] SQL match: true (12 rows)
  [Practice Solution] SQL match: true (12 rows)
  [Practice StarterCode Guard] Fails as expected: true (Throws SQL error: Binder Error: Referenced column "partition_revenue_usd" not found in FROM clause!)
```

---

## 4. Verificación real con `agy` (`runAgyPrompt` + `buildContextPrompt`)

Se invocó `runAgyPrompt` de `server/ai/agyRunner.js` (sin `GRANO_AI_MOCK`, ejecutando el binario real `agy` con modelo `gemini-3.8-flash-low`) usando el prompt ensamblado por `buildContextPrompt` (`server/ai/contextBuilder.js`) con los `aiNotes` de cada lección para los modos `explain`, `hint`, `example` y `review`.

### 4.1. Lección 1 (`de2-formatos-01-columnar-parquet`) · Modo `explain` (`8 083 ms`, primer token `6 496 ms`)
> En Parquet, los datos se organizan en bloques horizontales (**Row Groups**) y dentro de ellos cada columna se guarda de forma vertical e independiente (**Column Chunk**). Al final, el **Footer** guarda el diccionario con los offsets en bytes y las estadísticas (`min`/`max`) de cada trozo.
>
> La **poda de columnas** (*projection pushdown*) usa esos offsets para saltar con el puntero de lectura directo a los bytes que pides, ignorando el resto. Si consultas solo `event_type` en `events.parquet`, el motor omite columnas pesadas de marcas de tiempo o identificadores que concentran la gran mayoría del peso del archivo.
>
> Los **zone maps** aplican la poda horizontal (*predicate pushdown*). Cada Row Group registra su rango de valores en los metadatos. Supón un Row Group con 15 000 eventos donde `min(event_ts) = '2024-03-01'` y `max(event_ts) = '2024-03-05'`. Si filtras `WHERE event_ts >= '2024-04-01'`, el motor compara el predicado contra el pie del archivo y descarta todo el bloque sin leer un solo byte de sus datos.
>
> Entender esto evita sobredimensionar la memoria del clúster o saturar la red por ejecutar `SELECT *` y filtrar en memoria datos que Parquet puede descartar a nivel de almacenamiento.

### 4.2. Lección 1 (`de2-formatos-01-columnar-parquet`) · Modo `hint` (`5 884 ms`, primer token `4 605 ms` — verifica que NO entrega la solución completa)
> Para relacionar órdenes con sus líneas de pedido, une `orders` con `order_items` mediante la clave común `order_id`.
>
> Aplica el filtro temporal sobre `o.order_ts >= TIMESTAMPTZ '2025-01-01 00:00:00Z'` en la cláusula `WHERE`. Como es una condición de rango sobre una columna temporal (usualmente ordenada o semiordenada en ingestión), el motor aprovechará los *zone maps* (`[min, max]`) de los metadatos de Parquet para podar grupos de filas enteros sin leerlos.
>
> Por último, proyecta solo las columnas necesarias para que el lector aplique poda de columnas (*column pruning*) y reduce los datos con `GROUP BY` según las métricas que te pida el ejercicio.

### 4.3. Lección 2 (`de2-formatos-02-arrow-lance-vortex`) · Modo `example` (`6 907 ms`, primer token `4 600 ms`)
> En la tabla `events` de Mercado Brisa, supón un lote (*RecordBatch*) de 65 000 filas. Para columnas con nulos, como `customer_id` (sesiones anónimas con 6 715 nulos) o `campaign_id` (tráfico orgánico con 17 750 nulos), Apache Arrow no inserta marcadores especiales ni valores centinela dentro del arreglo de datos. En su lugar, usa un búfer independiente: el **mapa de bits de validez** (*validity bitmap*).
>
> Este mapa asigna exactamente 1 bit por fila, donde `1` indica que el valor existe y `0` representa un `NULL`. 
>
> Para las 65 000 filas de `events`:
> - Cada columna reserva `65 000 / 8 = 8 125` bytes contiguos en memoria RAM.
> - Si la fila 0 tiene `customer_id = "CUST-101"`, el bit 0 vale `1`.
> - Si la fila 1 es de un usuario anónimo (`customer_id` nulo), el bit 1 vale `0`.
> - Si las primeras 8 filas fueran `[válido, nulo, válido, válido, nulo, nulo, válido, válido]`, ese primer byte en memoria se almacena a nivel de bits como `11001101` (orden *least-significant bit first*).
>
> En `customer_id`, ese búfer de 8 125 bytes contiene exactamente 6 715 bits en `0` y 58 285 bits en `1`. En `campaign_id`, contiene 17 750 bits en `0`. 
>
> La gran ventaja técnica es la eficiencia: el motor de ejecución (como DuckDB o DataFusion) examina palabras completas del procesador (64 bits a la vez) con instrucciones vectoriales SIMD para filtrar nulos rápidamente, sin ramificaciones condicionales (*if/else*) fila por fila y sin tocar el búfer de valores en las posiciones nulas.

### 4.4. Lección 3 (`de2-formatos-03-duckdb-polars-marimo`) · Modo `review` (`6 878 ms`, primer token `4 770 ms`)
> Tu consulta aprovecha muy bien las funciones analíticas de DuckDB, en especial `MEDIAN()`, el modificador `FILTER (WHERE ...)` y `GROUP BY ALL`. 
>
> Aquí tienes la revisión de tres puntos clave:
>
> **1. Grano y exactitud**
> El grano resultante es por cliente/segmento. Al cruzar `orders` con `customers` por `customer_id` no se duplican filas porque la relación es de muchos a uno. Sin embargo, revisa dos detalles del esquema de Mercado Brisa:
> - En `orders`, la columna para el monto total se llama `order_total_usd` (no `total_usd`).
> - En `customers`, no existe la columna `segment`; tienes `city`, `full_name` y `signup_date`. Si `segment` viene de otra transformación o de `customer_changes`, debes definirlo antes.
> - Respecto a `NULL`, `MEDIAN()` y `SUM()` los ignoran automáticamente, pero si `customer_id` en `orders` puede ser nulo, un `INNER JOIN` descartará esas órdenes.
>
> **2. Legibilidad**
> La estructura es limpia. El uso de alias (`o`, `c`) es claro y los nombres de las métricas (`completed_orders`, `median_ticket_usd`, `high_value_orders`) describen con precisión el resultado. 
>
> **3. Mejora concreta**
> Ajusta los nombres al esquema real y usa una CTE para enriquecer al cliente antes del cruce si necesitas agrupar por atributos calculados (por ejemplo, por `city` o por cohorte de `signup_date`).

### 4.5. Lección 4 (`de2-formatos-04-codificacion-compresion-zstd`) · Modo `explain` (`15 786 ms`, primer token `12 554 ms`)
> La diferencia clave radica en la cardinalidad y el orden de los datos antes de aplicar el algoritmo de compresión general (Zstandard).
>
> Parquet procesa cada columna en dos pasos: primero aplica una codificación lógica (*encoding*) y luego comprime el bloque de bytes resultante (*codec*). 
>
> En `orders.parquet`, columnas como `status` solo tienen un puñado de valores (`'completed'`, `'cancelled'`, `'shipped'`). Parquet crea un diccionario asignando un ID entero mínimo a cada texto (ej. 0, 1, 2) y reemplaza miles de bytes por índices de apenas 2 bits. Si varios pedidos seguidos tienen el mismo estado, RLE agrupa esa racha en un único registro `(conteo, id)`. Cuando Zstandard entra a comprimir esa secuencia casi homogénea de bytes, el factor de reducción supera 30x. Lo mismo ocurre con `store_id` o `campaign_id` en lotes con valores repetidos.
>
> En cambio, `order_total_usd` (o `total_usd`) maneja números continuos con decimales (`15.42`, `89.10`, `120.05`). Al haber casi tantos valores distintos como filas, el diccionario se desborda y Parquet cae a codificación `PLAIN`: escribe cada float/double en bruto (4 u 8 bytes por fila). Zstandard comprime estos bytes aleatorios, pero sin la ayuda del diccionario solo logra una reducción modesta (~2.45x).
>
> Entender esto te evita forzar compresión agresiva en columnas continuas creyendo que resolverá problemas de I/O cuando el verdadero cuello de botella es la alta cardinalidad.

### 4.6. Lección 5 (`de2-formatos-05-particionado-archivos-pequenos`) · Modo `hint` (`9 936 ms`, primer token `8 457 ms` — verifica que NO entrega la solución completa)
> Para calcular esas dos columnas en tu consulta agrupada, apóyate en funciones de agregación sobre las columnas de `orders`:
>
> - **`active_days`**: Necesitas contar cuántas fechas distintas existen en cada grupo. Trunca o extrae la parte de fecha de `order_ts` (por ejemplo con `DATE(o.order_ts)`) y aplica un conteo de valores únicos (`COUNT(DISTINCT ...)`).
> - **`partition_revenue_usd`**: Se trata del monto acumulado en cada partición lógica. Usa una suma simple (`SUM(...)`) sobre la columna numérica que representa el valor de cada orden, que en la tabla `orders` es `order_total_usd`.
>
> Ambas expresiones van directamente en el `SELECT`, manteniendo el mismo `GROUP BY` que ya definiste para definir los límites de cada partición.

---

## 5. Verificación visual e interactiva en navegador (Playwright · `http://localhost:5213/`)

Se ejecutó `playwright-core` sobre `http://localhost:5213/` probando las 5 lecciones en escritorio (`1280x720` modo claro y modo oscuro) y móvil (`390x844`), además de las 3 pruebas adversariales por lección:

| Lección | `console.error` / `pageerror` | Bloqueo de completado prematuro | Guardia `starterCode` sin cambios | Ejecución de `practice.solution` en DuckDB-WASM | Móvil `390x844` (`scrollWidth <= 390`) |
|---|---:|---|---|---|---|
| `de2-formatos-01-columnar-parquet` | `0 / 0` | Bloqueado (`3` checks + práctica pendientes) | Falla como se espera | Aprobada (`true`) | `390px / 390px` (`overflow=false`) |
| `de2-formatos-02-arrow-lance-vortex` | `0 / 0` | Bloqueado (`3` checks + práctica pendientes) | Falla como se espera | Aprobada (`true`) | `390px / 390px` (`overflow=false`) |
| `de2-formatos-03-duckdb-polars-marimo` | `0 / 0` | Bloqueado (`3` checks + práctica pendientes) | Falla como se espera | Aprobada (`true`) | `390px / 390px` (`overflow=false`) |
| `de2-formatos-04-codificacion-compresion-zstd` | `0 / 0` | Bloqueado (`3` checks + práctica pendientes) | Falla como se espera | Aprobada (`true`) | `390px / 390px` (`overflow=false`) |
| `de2-formatos-05-particionado-archivos-pequenos` | `0 / 0` | Bloqueado (`3` checks + práctica pendientes) | Falla como se espera | Aprobada (`true`) | `390px / 390px` (`overflow=false`) |

### Capturas generadas e inspeccionadas (`C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-de2-formatos\`)
- `de2-formatos-01-columnar-parquet-desktop-light.png`
- `de2-formatos-01-columnar-parquet-desktop-dark.png`
- `de2-formatos-01-columnar-parquet-mobile-390x844.png`
- `de2-formatos-02-arrow-lance-vortex-desktop-light.png`
- `de2-formatos-02-arrow-lance-vortex-desktop-dark.png`
- `de2-formatos-02-arrow-lance-vortex-mobile-390x844.png`
- `de2-formatos-03-duckdb-polars-marimo-desktop-light.png`
- `de2-formatos-03-duckdb-polars-marimo-desktop-dark.png`
- `de2-formatos-03-duckdb-polars-marimo-mobile-390x844.png`
- `de2-formatos-04-codificacion-compresion-zstd-desktop-light.png`
- `de2-formatos-04-codificacion-compresion-zstd-desktop-dark.png`
- `de2-formatos-04-codificacion-compresion-zstd-mobile-390x844.png`
- `de2-formatos-05-particionado-archivos-pequenos-desktop-light.png`
- `de2-formatos-05-particionado-archivos-pequenos-desktop-dark.png`
- `de2-formatos-05-particionado-archivos-pequenos-mobile-390x844.png`

---

## 6. Autoevaluación con la rúbrica de 8 dimensiones

| # | Dimensión | Puntuación (0–4) | Justificación con evidencia verificada |
|---|---|---:|---|
| 1 | **Rigor técnico y fuentes verificadas** | **4 / 4** | 18 fuentes primarias oficiales (Apache Parquet, Apache Arrow, DuckDB, Polars, Vortex, Lance, Marimo e IETF RFC 8878) verificadas con `HTTP 200` y documentadas en `docs/curriculo/investigacion/de2-formatos.md`. |
| 2 | **Alineación con el dataset real de Mercado Brisa** | **4 / 4** | Todas las cifras de `events.parquet` (`65 000` filas, `1 089 111 bytes` comprimidos en páginas, `6 715` nulos en `customer_id`, `17 750` nulos en `campaign_id`) y `orders.parquet` (`18 000` filas, `380 895 bytes` comprimidos en páginas, razones `38.96x` en `campaign_id`, `34.52x` en `store_id` y `32.48x` en `status`) fueron medidas con `parquet_metadata()` en DuckDB. |
| 3 | **Calidad pedagógica y estructura completa** | **4 / 4** | Las 5 lecciones incluyen `hook` interrogativo con cifras reales, 3 objetivos con verbos medibles, 3 secciones con código y `expectedOutput` verificado, `workedExample` de 3 pasos, 3 `checks` con `feedback` específico por opción, `practice` ejecutable, `roleNotes` (`de`/`da`/`bi`), `summary`, `flashcards` y `aiNotes`. |
| 4 | **Ejecución real de prácticas SQL y guardia de `starterCode`** | **4 / 4** | Las 5 consultas de `practice.solution` producen exactamente `expectedOutputTable` en `@duckdb/node-api` y en DuckDB-WASM en navegador, mientras que las 5 plantillas `practice.starterCode` fallan sin cambios. |
| 5 | **Calidad editorial y cumplimiento anti-slop (`check-copy`)** | **4 / 4** | `0` hallazgos en `check-copy.mjs`, `0` términos prohibidos, `0` emojis, `0` ocurrencias de `"2026"` fuera de `sources[].accessed`, `<= 3` negritas por párrafo, y longitud media de frase entre `12.70` y `19.92` palabras/frase (límite `<= 22`). |
| 6 | **Glosario y proyecto del módulo** | **4 / 4** | 14 términos creados en `docs/curriculo/investigacion/de2-formatos-glossary.json` (20–25 palabras por definición, validados por `GlossaryListSchema`) y rúbrica de 4 criterios (escala 0–4) para el proyecto del módulo en `docs/curriculo/investigacion/de2-formatos.md`. |
| 7 | **Integración con el tutor IA (`agy` real)** | **4 / 4** | Verificación real con `runAgyPrompt` + `buildContextPrompt` en modos `explain`, `hint`, `example` y `review`, con respuestas en español que citan las tablas y columnas reales de Mercado Brisa y sin filtrar la solución en modo `hint`. |
| 8 | **Verificación visual e interactiva en navegador** | **4 / 4** | 15 capturas verificadas en `1280x720` (light y dark) y `390x844` (móvil sin scroll horizontal), con `0` errores de consola, `0` `pageerror` y las 3 pruebas adversariales superadas en las 5 lecciones. |
| **Total** | | **32 / 32** | Cumplimiento íntegro de todos los requisitos de `W-de2-formatos` (`>= 28/32`, sin dimensiones `< 3`). |
