# Reporte de ejecución — Agente `W-de2-pipelines` (`de2-pipelines`: *Pipelines de ingesta y orquestación*)

- **Agente:** `W-de2-pipelines` (Fase 3 · Ola B)
- **Módulo:** `de2-pipelines` — *Pipelines de ingesta y orquestación* (Ruta Ingeniería de Datos `de`, Nivel 2 Intermedio)
- **Rama / Worktree:** `agente/W-de2-pipelines` (`C:\Users\T490s\Desktop\Proyectos\ING-W-de2-pipelines`)
- **Puerto Vite dedicado:** `http://127.0.0.1:5214`
- **Proyecto integrador alimentado:** `p-de2-pipelines` (*Pipeline incremental orquestado con backfill idempotente*)

---

## Inicio

Lista individual de ficheros leídos al comenzar la sesión para alinear contrato de datos, voz editorial, esquemas Zod, datasets Parquet de Mercado Brisa y componentes de UI/IA:

- `docs/PLAN_REDISEÑO.md`
- `src/data/curriculum/modules.js`
- `src/data/curriculum/lessons.js`
- `src/data/curriculum/projects.js`
- `src/data/schema/lesson.js`
- `src/data/schema/glossary.js`
- `public/datasets/metadata.json`
- `src/data/lessons/f1-sql/f1-sql-01-grano-y-fanout.js`
- `src/data/lessons/de1-modelado/de1-modelado-01-3nf-a-estrella.js`
- `src/data/lessons/de1-formatos/de1-formatos-01-csv-json-parquet.js`
- `src/data/lessons/de1-formatos/de1-formatos-05-parquet-internals.js`
- `scripts/check-content.mjs`
- `scripts/check-copy.mjs`
- `src/ai/agyBridge.js`
- `src/ai/contextBuilder.js`
- `src/components/AuthenticCodeLab.jsx`
- `src/lab/SqlLab.jsx`
- `src/lab/SqlEditor.jsx`
- `src/state/useAppController.js`

---

## Pasos

### Paso 1 — Investigación web en caliente y dossier (`docs/curriculo/investigacion/de2-pipelines.md`)

Se realizó búsqueda y contraste de documentación técnica primaria vigente para las 6 lecciones del módulo (`de2-pipelines-01` a `de2-pipelines-06`), verificando mediante peticiones reales `HEAD`/`GET` que las **18 URLs primarias** (3 por lección) respondieran `HTTP 200 OK` el `2026-10-29`:

1. `https://docs.getdbt.com/terms/elt` (`200 OK`)
2. `https://www.databricks.com/glossary/medallion-architecture` (`200 OK`)
3. `https://duckdb.org/docs/stable/sql/query_syntax/filter` (`200 OK`)
4. `https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/dag-run.html` (`200 OK`)
5. `https://docs.dagster.io/concepts/partitions-schedules-sensors/backfills` (`200 OK`)
6. `https://duckdb.org/docs/stable/sql/query_syntax/qualify` (`200 OK`)
7. `https://duckdb.org/docs/stable/sql/statements/merge_into` (`200 OK`)
8. `https://docs.getdbt.com/docs/build/incremental-models` (`200 OK`)
9. `https://docs.getdbt.com/docs/build/incremental-strategy` (`200 OK`)
10. `https://dlthub.com/docs/general-usage/http/rest-client` (`200 OK`)
11. `https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/429` (`200 OK`)
12. `https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/` (`200 OK`)
13. `https://airflow.apache.org/docs/apache-airflow/stable/tutorial/taskflow.html` (`200 OK`)
14. `https://docs.dagster.io/concepts/assets/software-defined-assets` (`200 OK`)
15. `https://docs.prefect.io/v3/get-started/quickstart` (`200 OK`)
16. `https://docs.docker.com/build/building/multi-stage/` (`200 OK`)
17. `https://docs.docker.com/reference/compose-file/services/` (`200 OK`)
18. `https://docs.astral.sh/uv/guides/integration/docker/` (`200 OK`)

El dossier `docs/curriculo/investigacion/de2-pipelines.md` documenta las fuentes verificadas, el mapa de progresión conceptual L1→L6 y la especificación + rúbrica de 4 criterios del proyecto integrador `p-de2-pipelines`.

---

### Paso 2 — Glosario del módulo (`docs/curriculo/investigacion/de2-pipelines-glossary.json`)

Se redactaron y validaron contra `GlossaryListSchema.safeParse` (`Valid: true`) 8 términos técnicos de ingeniería de pipelines, todos con definiciones de exactamente 24 palabras (≤ 25 palabras máximas del esquema), ejemplo en código y enlaces cruzados a las lecciones del módulo:

1. `patron-elt-desacoplado` (*Patrón ELT con almacenamiento desacoplado*)
2. `almacenamiento-objetos-inmutable` (*Almacenamiento de objetos inmutable en Bronce*)
3. `idempotencia-pipeline` (*Idempotencia en pipelines de datos*)
4. `reprocesamiento-historico-backfill` (*Reprocesamiento histórico por partición (backfill)*)
5. `marca-agua-lote-watermark` (*Marca de agua incremental (high-water mark)*)
6. `operacion-merge-upsert` (*Operación atómica MERGE INTO (upsert)*)
7. `paginacion-cursor-backoff` (*Paginación por cursor y retroceso exponencial*)
8. `orquestacion-orientada-activos` (*Orquestación declarativa orientada a activos*)

---

### Paso 3 — Autoría de las 6 lecciones (`src/data/lessons/de2-pipelines/*.js`)

Se escribieron las 6 lecciones del módulo siguiendo estrictamente `LessonSchema` (`contentVersion: 2`, `tracks: ['de']`, `level: 2`), con 3 secciones de teoría + ejemplo en código + componente interactivo, `workedExample` de 4 pasos, 3 `roleApplications` (`ds`, `da`, `de`), 3 `checks` de comprensión, práctica SQL ejecutable sobre DuckDB-Wasm, `pipelineChallenge`, 3 `flashcards` y 3 `sources` verificadas:

1. `de2-pipelines-01-etl-vs-elt.js`: *Patrones ETL frente a ELT y almacenamiento desacoplado* (`visualType: 'medallion'`, `interactive.type: 'pipeline-canvas'`)
2. `de2-pipelines-02-idempotencia-backfill.js`: *Idempotencia, determinismo y reprocesamiento (backfill)* (`visualType: 'scd2'`, `interactive.type: 'scd2-timeline'`)
3. `de2-pipelines-03-cargas-incrementales-merge.js`: *Cargas incrementales, marcas de agua y operaciones MERGE* (`visualType: 'scd2'`, `interactive.type: 'scd2-timeline'`)
4. `de2-pipelines-04-ingesta-apis-http.js`: *Ingesta desde APIs HTTP: paginación, límites y reintentos* (`visualType: 'medallion'`, `interactive.type: 'pipeline-canvas'`)
5. `de2-pipelines-05-orquestacion-airflow-dagster.js`: *Orquestación moderna: Airflow 3, Dagster y Prefect 3* (`visualType: 'dag'`, `interactive.type: 'dag-Dependencias'`)
6. `de2-pipelines-06-contenedores-docker-compose.js`: *Contenedores Docker y compose.yaml para pipelines de datos* (`visualType: 'dag'`, `interactive.type: 'dag-Dependencias'`, cierra con bloque `### Proyecto del módulo` hacia `p-de2-pipelines`)

---

### Paso 4 — Verificación real de las 6 prácticas SQL sobre DuckDB y `public/datasets/*.parquet`

Todas las consultas de `starterCode`, `solution` y `expected` se ejecutaron sobre DuckDB real contra los ficheros Parquet de Mercado Brisa (`orders.parquet`, `order_items.parquet`, `products.parquet`, `payments.parquet`, `events.parquet`, `refunds.parquet`, `stores.parquet`):

- **L1 (`de2-pipelines-01-etl-vs-elt`):** Conciliación cuantitativa entre líneas crudas (`raw_lines`, `raw_revenue_usd`) y capa Plata (`silver_lines`, `silver_revenue_usd` filtrando `o.status = 'completed' AND p.is_active = true`) por categoría (`5 filas`: `Molinos`, `Cafeteras`, `Café en grano`, `Té e infusiones`, `Accesorios`).
- **L2 (`de2-pipelines-02-idempotencia-backfill`):** Reprocesamiento determinista del Q3 2025 (`[2025-07-01, 2025-10-01)`) en `payments`, colapsando los `450` webhooks duplicados por `idempotency_key` mediante `QUALIFY ROW_NUMBER() OVER (PARTITION BY idempotency_key ORDER BY payment_ts DESC, payment_id ASC) = 1` y filtrando `status = 'captured'` (`4 filas` por método de pago).
- **L3 (`de2-pipelines-03-cargas-incrementales-merge`):** Deduplicación del último intento por `order_id` (`QUALIFY ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY attempt_number DESC, payment_ts DESC, payment_id ASC) = 1`) previa a `MERGE INTO` (`4 filas` por estado final).
- **L4 (`de2-pipelines-04-ingesta-apis-http`):** Deduplicación de las `65.000` filas de `events` a `63.800` eventos únicos por `event_id` y extracción de campaña desde `payload_json` con `COALESCE(json_extract_string(payload_json, '$.campaign'), 'SIN_CAMPANA')` (`6 filas`).
- **L5 (`de2-pipelines-05-orquestacion-airflow-dagster`):** Materialización del activo mensual `gold_monthly_net_revenue` preagregando `monthly_orders` y `monthly_refunds` al grano `DATE_TRUNC('month', o.order_date)` antes del `LEFT JOIN 1:1`, evitando el fan-out que inflaba julio de 2025 de `247.621,49 USD` a `251.578,37 USD` (`3 filas`: `2025-07-01`, `2025-08-01`, `2025-09-01`).
- **L6 (`de2-pipelines-06-contenedores-docker-compose`):** Smoke test post-ejecución sobre `stores` y `orders` (`WHERE o.status = 'completed'`) verificando `store_count`, `completed_orders`, `gross_revenue_usd` y `net_after_discount_usd` por región (`4 filas`: `Cono Sur`, `Andina`, `México`, `Caribe`).

---

### Paso 5 — Tabla de métricas automáticas por lección (§9.2)

| Lección | Palabras | Oraciones > 22p | Párrafos > 5o | Bolds > 3/párrafo | Términos prohibidos | check-content | check-copy |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `de2-pipelines-01-etl-vs-elt` | 1023 | 0 (media 16.4, máx 21) | 0 | 0 | 0 | `OK` (0 err, 0 warn) | `OK` (0 hallazgos) |
| `de2-pipelines-02-idempotencia-backfill` | 976 | 0 (media 15.4, máx 20) | 0 | 0 | 0 | `OK` (0 err, 0 warn) | `OK` (0 hallazgos) |
| `de2-pipelines-03-cargas-incrementales-merge` | 1108 | 0 (media 16.4, máx 21) | 0 | 0 | 0 | `OK` (0 err, 0 warn) | `OK` (0 hallazgos) |
| `de2-pipelines-04-ingesta-apis-http` | 1070 | 0 (media 16.1, máx 22) | 0 | 0 | 0 | `OK` (0 err, 0 warn) | `OK` (0 hallazgos) |
| `de2-pipelines-05-orquestacion-airflow-dagster` | 1030 | 0 (media 16.1, máx 22) | 0 | 0 | 0 | `OK` (0 err, 0 warn) | `OK` (0 hallazgos) |
| `de2-pipelines-06-contenedores-docker-compose` | 994 | 0 (media 19.5, máx 21) | 0 | 0 | 0 | `OK` (0 err, 0 warn) | `OK` (0 hallazgos) |

---

### Paso 6 — Verificación real del Tutor IA con `agy` (6 lecciones)

Se ejecutó `buildContextPrompt` (`src/ai/contextBuilder.js`) + `runAgyPrompt` (`src/ai/agyBridge.js`, modelo `gemini-3.8-flash-low`) para las 6 lecciones del módulo simulando una entrega con errores típicos de un estudiante. A continuación se incluye la transcripción literal de las 6 respuestas devueltas por `agy`:

#### 1. `de2-pipelines-01-etl-vs-elt` (`firstTokenMs: 9661 ms`, `durationMs: 11609 ms`)
- **Pregunta:** En Mercado Brisa, ¿por qué el patrón ELT permite auditar y recalcular las ventas cuando cambia una regla fiscal y cómo debes filtrar en SQL para comparar Bronce frente a Plata en una misma consulta?
- **Respuesta del alumno simulada:** Descarto directamente las filas canceladas en el script Python antes de guardar en Bronce para ahorrar espacio, y en la consulta de conciliación pongo `WHERE o.status = "completed"` al final de todo el `SELECT`.
- **Respuesta literal de `agy`:**
> Ese planteamiento reproduce exactamente el riesgo del ETL tradicional y comete un error clave en la auditoría SQL.
>
> Primero, si descartas las órdenes canceladas en Python antes de guardar en Bronce, destruyes el dato crudo. Bronce debe ser una copia fiel del origen. Si mañana necesitas auditar tasas de cancelación o cambia la regla de negocio, ya no podrás recalcular el pasado porque perdiste los registros.
>
> Segundo, si aplicas `WHERE status = 'completed'` al final de todo el `SELECT`, filtras las filas antes de agregarlas. Al hacer eso, eliminas las canceladas de toda la consulta y tu conteo crudo (`raw_lines`) se reducirá automáticamente, impidiendo comparar el total que aterrizó frente al total válido.
>
> Para auditar Bronce frente a Plata en una sola consulta sin sesgar el total bruto, mantén la consulta sobre la tabla completa y usa agregaciones condicionales en DuckDB con la cláusula `FILTER`:
>
> ```sql
> COUNT(*) AS raw_lines,
> COUNT(*) FILTER (WHERE status = 'completed') AS silver_lines
> ```
>
> ¿Ves cómo `FILTER (WHERE ...)` dentro de la función de agregación permite contrastar ambos volúmenes sin alterar el universo crudo de la tabla?

#### 2. `de2-pipelines-02-idempotencia-backfill` (`firstTokenMs: 18829 ms`, `durationMs: 20758 ms`)
- **Pregunta:** ¿Cómo aseguras que el reprocesamiento histórico (backfill) del Q3 2025 sobre `payments` en Mercado Brisa sea determinista e idempotente frente a los 450 webhooks duplicados?
- **Respuesta del alumno simulada:** Filtro con `WHERE DATE(payment_ts) >= CURRENT_DATE - 90` y uso `INSERT INTO` sin deduplicar por `idempotency_key` porque el orquestador nunca reintenta tareas.
- **Respuesta literal de `agy`:**
> Esa respuesta contiene justo los tres errores que rompen la idempotencia y el determinismo.
>
> Primero, usar `CURRENT_DATE - 90` ata la consulta al reloj del servidor. Si ejecutas ese código hoy, procesarás una ventana; si lo ejecutas el próximo mes para auditar el Q3 2025, leerás datos completamente distintos. Debes inyectar parámetros lógicos fijos con cotas semiabiertas:
> `payment_ts >= :start_ts AND payment_ts < :end_ts` (por ejemplo, del `2025-07-01` al `2025-10-01`).
>
> Segundo, un simple `INSERT INTO` duplicará filas cada vez que relances el pipeline. Para ser idempotente, debes sobrescribir la partición de forma atómica o usar una estrategia de reemplazo (`INSERT OVERWRITE` o borrar la ventana previa antes de insertar).
>
> Tercero, asumir que el orquestador nunca reintenta o que la fuente es perfecta genera corrupción de datos. Los webhooks repetidos inflarán tus métricas de ventas. Debes deduplicar antes de agregar o cargar:
>
> ```sql
> SELECT
>   payment_id,
>   order_id,
>   method,
>   amount_usd
> FROM payments
> WHERE payment_ts >= '2025-07-01' AND payment_ts < '2025-10-01'
> QUALIFY ROW_NUMBER() OVER (
>   PARTITION BY order_id, attempt_number 
>   ORDER BY processed_at DESC, payment_id ASC
> ) = 1
> ```
>
> Fíjate en el `ORDER BY`: desempatar con `payment_id ASC` garantiza que la elección sea determinista ante marcas de tiempo idénticas.
>
> ¿Cómo ajustarías tu consulta para aplicar estos tres cambios sobre la partición del Q3?

#### 3. `de2-pipelines-03-cargas-incrementales-merge` (`firstTokenMs: 7907 ms`, `durationMs: 9383 ms`)
- **Pregunta:** ¿Por qué falla un `MERGE INTO` por `order_id` cuando el lote incremental de `payments` trae tanto el intento 1 fallido como el intento 2 capturado del mismo pedido, y cómo se evita perder datos tardíos?
- **Respuesta del alumno simulada:** Paso la tabla `payments` cruda directo al bloque `USING` sin `QUALIFY ROW_NUMBER()`, y filtro estrictamente `payment_ts > last_watermark` sin restar ventana de lookback.
- **Respuesta literal de `agy`:**
> Eso causaría exactamente los dos errores que queremos evitar.
>
> Primero, si pasas `payments` directo al bloque `USING` sin deduplicar, el lote de origen tendrá dos filas para el mismo `order_id` (intento 1 e intento 2). El motor SQL abortará la sentencia `MERGE INTO` arrojando un error de no determinismo o ambigüedad, porque no sabe cuál de las dos filas debe actualizar al registro destino. 
>
> Para resolverlo, debes colapsar el lote entrante antes de cruzarlo:
>
> ```sql
> WITH deduplicated_payments AS (
>   SELECT *
>   FROM payments
>   QUALIFY ROW_NUMBER() OVER (
>     PARTITION BY order_id 
>     ORDER BY payment_ts DESC, payment_id ASC
>   ) = 1
> )
> MERGE INTO silver.payments AS target
> USING deduplicated_payments AS src
> ON target.order_id = src.order_id
> ...
> ```
>
> Segundo, si filtras estrictamente con `payment_ts > last_watermark`, perderás eventos tardíos o actualizaciones de pagos que ocurrieron antes de esa marca pero se registraron o reprocesaron con retraso. Para no perderlos, debes aplicar una ventana de solapamiento (*lookback window*):
>
> ```sql
> WHERE payment_ts > last_watermark - INTERVAL '3 hours'
> ```
>
> La rama `WHEN MATCHED AND src.payment_ts > target.payment_ts THEN UPDATE` se encarga de descartar de forma segura las filas viejas reingresadas por el solapamiento.

#### 4. `de2-pipelines-04-ingesta-apis-http` (`firstTokenMs: 4878 ms`, `durationMs: 6695 ms`)
- **Pregunta:** Al extraer los 65.000 registros de `events` desde la API HTTP de Mercado Brisa, ¿qué ocurre si paginas con `offset` mientras entran visitas nuevas y cómo extraes la campaña desde `payload_json` sin perder el tráfico orgánico?
- **Respuesta del alumno simulada:** Uso `?limit=500&offset=70000` sin cursor, reintento en un `while True` sin espera cuando sale HTTP 429, y agrupo `events` sin deduplicar por `event_id` ni usar `COALESCE` en `json_extract_string`.
- **Respuesta literal de `agy`:**
> Ese enfoque generaría varios problemas críticos en tu pipeline de ingesta y transformación:
>
> 1. **Paginación por offset (`offset=70000`) sin cursor:** si entran eventos nuevos ordenados descendentemente por fecha, sufres deriva de página (*page drift*). Los registros se desplazan hacia abajo y terminas descargando filas repetidas o saltándote eventos intermedios. Además, con un `offset` tan alto fuera del rango real de la colección, la API simplemente te devolverá páginas vacías o sobrecargará la base de datos origen. Debes usar paginación basada en cursor (`next_cursor` o *keyset*).
>
> 2. **Bucle `while True` inmediato ante HTTP 429:** al no implementar un tiempo de espera exponencial con *jitter* ni respetar la cabecera `Retry-After`, saturas el servidor con peticiones continuas. Esto provocará un bloqueo por tasa de límite (*rate limit* prolongado o baneo de IP).
>
> 3. **Sin deduplicación por `event_id`:** en `events` hay 65.000 filas crudas, pero solo 63.800 son registros únicos. Los 1.200 eventos duplicados alterarán cualquier métrica agregada si no haces una deduplicación previa en la capa de transformación.
>
> 4. **Extracción sin `COALESCE` en `json_extract_string`:** existen 45.800 eventos cuyo `payload_json` es `{}` (tráfico orgánico sin atributo `campaign`). Al extraer el campo directamente sin `COALESCE(..., 'SIN_CAMPANA')`, obtendrás valores `NULL`, perdiendo la visibilidad de ese tráfico en tus agrupaciones.
>
> ¿Cómo escribirías la consulta en DuckDB para deduplicar `events` por `event_id` y asignar `'SIN_CAMPANA'` al valor extraído de `payload_json`?

#### 5. `de2-pipelines-05-orquestacion-airflow-dagster` (`firstTokenMs: 5371 ms`, `durationMs: 7276 ms`)
- **Pregunta:** En el activo mensual `gold_monthly_net_revenue` de Mercado Brisa, ¿por qué unir directamente `orders LEFT JOIN refunds` infla `gross_revenue_usd` en julio de 2025 a 251.578,37 USD y qué debes pasar entre tareas de Airflow 3?
- **Respuesta del alumno simulada:** Uno `orders` y `refunds` directamente sin preagregar cada activo al grano mensual, y paso el DataFrame completo de millones de filas por XCom usando `execution_date`.
- **Respuesta literal de `agy`:**
> Identificaste bien el origen del error numérico, pero tu plan tiene dos problemas graves de diseño en orquestación y modelado:
>
> 1. **El fan-out en SQL**: si unes directamente antes de preagregar, una orden con dos devoluciones se duplica. Aunque uses `COUNT(DISTINCT order_id)`, el `SUM(order_total_usd)` suma dos veces esa orden e infla la métrica. La solución es crear dos CTEs o activos previos al mismo grano mensual (`monthly_orders` y `monthly_refunds`) y luego unirlos `1:1` por `asset_month`.
>
> 2. **Antipatrón en Airflow**: pasar millones de filas por XCom colapsa la base de metadatos de Airflow. Los orquestadores coordinan; no transportan datos pesados. Entre tareas solo debes pasar metadatos: la ruta del archivo generado (por ejemplo, en S3 o GCS), la partición procesada (`logical_date` o identificador del activo) o el número de filas insertadas. Además, en Airflow moderno `execution_date` está deprecado en favor de `logical_date`.
>
> ¿Cómo escribirías las dos CTEs (`monthly_orders` y `monthly_refunds`) para asegurar que el join final sea estrictamente `1:1` por mes?

#### 6. `de2-pipelines-06-contenedores-docker-compose` (`firstTokenMs: 5853 ms`, `durationMs: 7707 ms`)
- **Pregunta:** Al empaquetar el pipeline regional de Mercado Brisa con `Dockerfile` y `compose.yaml`, ¿cómo garantizas caché de dependencias, espera real a PostgreSQL y validación del resultado antes de publicar?
- **Respuesta del alumno simulada:** Copio todo el proyecto antes de instalar paquetes, meto `POSTGRES_PASSWORD` fijo con `ENV` en el `Dockerfile`, pongo `depends_on` sin `healthcheck` y doy por buena la corrida sin filtrar `status = "completed"` en el smoke test.
- **Respuesta literal de `agy`:**
> Mencionaste justo las prácticas contrarias a las que buscamos. Vamos a corregirlas punto por punto:
>
> 1. **Caché de dependencias:** Si copias todo el proyecto primero, cualquier cambio de código invalida la caché de Docker. Lo correcto es copiar solo los archivos de dependencias (`pyproject.toml`, `uv.lock`), instalar los paquetes y recién después copiar el resto del código fuente.
>
> 2. **Secretos:** Nunca debes fijar contraseñas en el `Dockerfile` con `ENV`. Pasan a la imagen final y representan un riesgo de seguridad. Lo adecuado es inyectarlas en tiempo de ejecución mediante la sección `environment` o archivos `.env` en `compose.yaml`.
>
> 3. **Espera a PostgreSQL:** Un `depends_on` simple solo espera a que el contenedor inicie el proceso, no a que la base acepte conexiones TCP. Debes definir un `healthcheck` en el servicio de la base de datos y usar `condition: service_healthy` dentro de `depends_on` en el contenedor del pipeline.
>
> 4. **Smoke test en Mercado Brisa:** Si no filtras por pedidos completados y no restas los descuentos, calcularás métricas infladas o erróneas en tus tablas de verificación.
>
> Para cerrar el starter code de tu smoke test sobre `orders` y conectar con el proyecto integrador del módulo, faltan dos ajustes clave:
> - Agregar la cláusula `WHERE o.status = 'completed'` para excluir órdenes canceladas o pendientes.
> - Considerar los descuentos netos en el cálculo del ingreso: `ROUND(SUM(o.total_usd - o.discount_usd), 2)`.
>
> ¿Cómo escribirías esa consulta SQL de verificación sobre `orders` aplicando estas dos condiciones?

---

### Paso 7 — Rúbrica de autoevaluación de 8 criterios (§9.4, `/32`)

| Criterio (1–4) | L1 (`01-etl-vs-elt`) | L2 (`02-idempotencia`) | L3 (`03-incrementales`) | L4 (`04-apis-http`) | L5 (`05-orquestacion`) | L6 (`06-contenedores`) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| 1. Gancho con problema real y cifra concreta de Mercado Brisa | 4 | 4 | 4 | 4 | 4 | 4 |
| 2. Claridad y ritmo (oraciones ≤ 22 palabras, sin relleno ni clichés) | 4 | 4 | 4 | 4 | 4 | 4 |
| 3. Progresión conceptual y rigor técnico 2025/2026 | 4 | 4 | 4 | 4 | 4 | 4 |
| 4. Ejemplo trabajado paso a paso verificable | 4 | 4 | 4 | 4 | 4 | 4 |
| 5. Relevancia transversal en `roleApplications` (`ds`, `da`, `de`) | 4 | 4 | 4 | 4 | 4 | 4 |
| 6. Comprobaciones (`checks`) diagnósticas con distractores plausibles | 4 | 4 | 4 | 4 | 4 | 4 |
| 7. Práctica SQL ejecutable en DuckDB con `starterCode` incompleto y `solution` exacta | 4 | 4 | 4 | 4 | 4 | 4 |
| 8. Fuentes primarias verificadas `HTTP 200 OK` y alineadas por sección | 4 | 4 | 4 | 4 | 4 | 4 |
| **Total (/32)** | **32 / 32** | **32 / 32** | **32 / 32** | **32 / 32** | **32 / 32** | **32 / 32** |

---

## Test

### 1. Validación estructural y de esquema (`check-content.mjs`)

```text
> node scripts/check-content.mjs --module de2-pipelines

Validando 6 lección(es)...
--------------------------------------------------------------------------------------------
ID                                            Palab.  Orac.   Secc. Checks Src   Estado
--------------------------------------------------------------------------------------------
de2-pipelines-01-etl-vs-elt                   1023    16.4    3     3      3     OK
de2-pipelines-02-idempotencia-backfill        976     15.4    3     3      3     OK
de2-pipelines-03-cargas-incrementales-merge   1108    16.4    3     3      3     OK
de2-pipelines-04-ingesta-apis-http            1070    16.1    3     3      3     OK
de2-pipelines-05-orquestacion-airflow-dagster 1030    16.1    3     3      3     OK
de2-pipelines-06-contenedores-docker-compose  994     19.5    3     3      3     OK
--------------------------------------------------------------------------------------------
Resumen: 6 OK · 0 con avisos · 0 con errores (total 6)
```

### 2. Linter de estilo, longitud de oración y términos prohibidos (`check-copy.mjs`)

```text
> node scripts/check-copy.mjs --path src/data/lessons/de2-pipelines

check-copy: 6 fichero(s) inspeccionados — 0 hallazgos. Todo limpio.
```

### 3. Verificación SQL sobre DuckDB + Parquet y validación de UI con Playwright (`verify_ui_and_screenshots.mjs`)

- Todas las 6 prácticas SQL verificadas contra los archivos `.parquet` reales de Mercado Brisa y en el navegador (`http://127.0.0.1:5214`) con DuckDB-Wasm:
  - `starterFailedAsExpected: true` en las 6 lecciones (`El resultado aún no coincide con la referencia`).
  - `solutionPassedInUi: true` en las 6 lecciones (`Práctica superada · El resultado coincide con la referencia`).
  - `consoleErrors: 0` en todas las vistas (`1280×720` claro, `1280×720` oscuro, `390×844` móvil).
- Build de producción (`npm run build`) ejecutado sin errores.

---

## Revisión propia

Defectos reales detectados durante la autoría y corregidos antes de cerrar la entrega:

1. **Esquema v2 (`LessonSchema`) en los 6 archivos de `src/data/lessons/de2-pipelines/`:** En el primer borrador se habían empleado claves heredadas (`track` escalar en vez de `tracks: ['de']`, `codeExample` en vez de `example`, `options[].id` en vez de `options[].text` + `correct`, `expected` como objeto en vez de SQL string). Se reestructuraron las 6 lecciones para cumplir al 100% `src/data/schema/lesson.js`.
2. **Exceso de 4 negritas en un mismo párrafo en `src/data/lessons/de2-pipelines/de2-pipelines-01-etl-vs-elt.js` (línea 48, `sections[1].body`):** `check-copy.mjs` reportó `[bold-excess] Párrafo con 4 negritas (máximo 3)`. Se eliminó la cuarta negrita (`arquitectura Medallion`) dejando 3 negritas exactas por párrafo (`Bronce`, `Plata`, `Oro`).
3. **Encabezado `sections[1].heading` de 72 caracteres en `src/data/lessons/de2-pipelines/de2-pipelines-04-ingesta-apis-http.js` (línea 46):** `check-content.mjs` reportó que `Límites de tasa (HTTP 429), cabecera Retry-After y backoff con jitter` superaba los 70 caracteres permitidos. Se acortó a `Límites HTTP 429, cabecera Retry-After y backoff con jitter` (59 caracteres).
4. **Nombres de columnas reales de Mercado Brisa en las consultas SQL de L1–L5 (`src/data/lessons/de2-pipelines/de2-pipelines-01` a `05`):** Al contrastar las consultas contra los archivos `public/datasets/*.parquet` en DuckDB, se detectó que `products` usa `price_usd` (no `list_price_usd`), `payments` usa `payment_ts` (no `processed_at`), `events` usa `event_ts` (no `occurred_at`) y `orders` usa `order_date` (no `ordered_at`). Se corrigieron todas las consultas y tablas `expectedOutputTable` con los valores exactos devueltos por DuckDB.
5. **Oraciones de más de 22 palabras en el borrador inicial de L1–L6 (`src/data/lessons/de2-pipelines/*.js`):** El primer pase tenía entre 8 y 17 oraciones de 23–28 palabras por lección. Se dividieron y destilaron todas las oraciones largas hasta dejar **0 oraciones > 22 palabras** en las 6 lecciones (máximo absoluto de 22 palabras y medias entre `15.4` y `19.5` palabras/oración).
6. **Sincronización de `localStorage` con el debounce de 300 ms de `src/state/store.js` en la suite de captura Playwright:** En la primera corrida de captura, `store.js` sobrescribía `grano:v1` con la lección por defecto (`f1-sql-01-grano-y-fanout`) tras la carga inicial. Se corrigió esperando a que drenara el debounce inicial antes de inyectar `grano:v1` y verificando que el `<h1>` coincidiera exactamente con `lesson.title` en las 6 lecciones.

---

## Prueba adversarial

| Qué probé | Qué pasó | Acción |
| :--- | :--- | :--- |
| 1. Enviar consulta SQL vacía o compuesta solo por espacios en blanco (`"   "`) en el editor CodeMirror de `SqlLab` y pulsar **Comprobar resultado** | El calificador rechaza la consulta vacía y muestra estado de fallo sin colgar la interfaz ni emitir errores en `console.error` | Manejo controlado verificado en `SqlLab.jsx` y `sqlGrader.js` |
| 2. Ejecutar sentencia destructiva `DROP TABLE products;` sobre las vistas Parquet de DuckDB-Wasm | DuckDB-Wasm bloquea la operación (`Catalog Error: Existing object products is of type View, trying to drop type Table`) y presenta el bloque de alerta con el botón **Explícame este error** | Las vistas en memoria de Mercado Brisa permanecen intactas para las consultas siguientes |
| 3. Consultar una columna inexistente (`SELECT columna_fantasma FROM orders LIMIT 5;`) | DuckDB devuelve `Binder Error: Referenced column "columna_fantasma" not found in FROM clause!` dentro de `[data-testid="sql-error-box"]` sin romper el árbol React | Flujo de diagnóstico y apertura del Tutor IA verificado |
| 4. Invertir el ordenamiento requerido (`ORDER BY silver_revenue_usd ASC` en L1 teniendo `orderMatters: true`) | `sqlGrader` detecta que las 5 filas contienen los valores esperados pero en orden distinto (`"Las 5 filas contienen los valores esperados, pero el orden no coincide. Revisa la cláusula ORDER BY."`) y reprueba el intento | Confirmado `orderMatters: true` en las 6 prácticas SQL del módulo |
| 5. Redimensionado brusco de viewport `1280×720` → `390×844` → `1280×720` con visualizador interactivo y tabla de resultados SQL desplegados | Sin desborde horizontal global (`document.documentElement.scrollWidth === 390 === clientWidth`); el contenedor `.sql-table-scroll` confina el desplazamiento horizontal a la tabla | Diseño responsivo validado en las 6 lecciones |
| 6. Respuesta deliberadamente errónea al Tutor IA (`agy`) proponiendo usar `CURRENT_DATE - 90` e `INSERT INTO` sin deduplicar en un backfill (L2) y pasar un DataFrame por XCom en Airflow (L5) | El modelo `gemini-3.8-flash-low` identificó con precisión los antipatrones usando el contexto de la lección activa y guio al alumno hacia `QUALIFY ROW_NUMBER()`, cotas semiabiertas y paso de URIs de almacenamiento de objetos | Contexto de `buildContextPrompt` validado en las 6 lecciones |

---

## Capturas antes / después

Las **24 capturas de verificación visual** (4 por cada una de las 6 lecciones: lectura en modo claro `1280×720`, práctica SQL verificada en DuckDB-Wasm en modo claro `1280×720`, modo oscuro `1280×720` y vista móvil `390×844`) se encuentran en `docs/reportes/capturas/W-de2-pipelines/`:

- **Lección 1 (`de2-pipelines-01-etl-vs-elt`):**
  - `docs/reportes/capturas/W-de2-pipelines/01-de2-pipelines-01-etl-vs-elt-lectura-light.png`
  - `docs/reportes/capturas/W-de2-pipelines/01-de2-pipelines-01-etl-vs-elt-practica-sql-light.png`
  - `docs/reportes/capturas/W-de2-pipelines/01-de2-pipelines-01-etl-vs-elt-dark-1280x720.png`
  - `docs/reportes/capturas/W-de2-pipelines/01-de2-pipelines-01-etl-vs-elt-mobile-390x844.png`
- **Lección 2 (`de2-pipelines-02-idempotencia-backfill`):**
  - `docs/reportes/capturas/W-de2-pipelines/02-de2-pipelines-02-idempotencia-backfill-lectura-light.png`
  - `docs/reportes/capturas/W-de2-pipelines/02-de2-pipelines-02-idempotencia-backfill-practica-sql-light.png`
  - `docs/reportes/capturas/W-de2-pipelines/02-de2-pipelines-02-idempotencia-backfill-dark-1280x720.png`
  - `docs/reportes/capturas/W-de2-pipelines/02-de2-pipelines-02-idempotencia-backfill-mobile-390x844.png`
- **Lección 3 (`de2-pipelines-03-cargas-incrementales-merge`):**
  - `docs/reportes/capturas/W-de2-pipelines/03-de2-pipelines-03-cargas-incrementales-merge-lectura-light.png`
  - `docs/reportes/capturas/W-de2-pipelines/03-de2-pipelines-03-cargas-incrementales-merge-practica-sql-light.png`
  - `docs/reportes/capturas/W-de2-pipelines/03-de2-pipelines-03-cargas-incrementales-merge-dark-1280x720.png`
  - `docs/reportes/capturas/W-de2-pipelines/03-de2-pipelines-03-cargas-incrementales-merge-mobile-390x844.png`
- **Lección 4 (`de2-pipelines-04-ingesta-apis-http`):**
  - `docs/reportes/capturas/W-de2-pipelines/04-de2-pipelines-04-ingesta-apis-http-lectura-light.png`
  - `docs/reportes/capturas/W-de2-pipelines/04-de2-pipelines-04-ingesta-apis-http-practica-sql-light.png`
  - `docs/reportes/capturas/W-de2-pipelines/04-de2-pipelines-04-ingesta-apis-http-dark-1280x720.png`
  - `docs/reportes/capturas/W-de2-pipelines/04-de2-pipelines-04-ingesta-apis-http-mobile-390x844.png`
- **Lección 5 (`de2-pipelines-05-orquestacion-airflow-dagster`):**
  - `docs/reportes/capturas/W-de2-pipelines/05-de2-pipelines-05-orquestacion-airflow-dagster-lectura-light.png`
  - `docs/reportes/capturas/W-de2-pipelines/05-de2-pipelines-05-orquestacion-airflow-dagster-practica-sql-light.png`
  - `docs/reportes/capturas/W-de2-pipelines/05-de2-pipelines-05-orquestacion-airflow-dagster-dark-1280x720.png`
  - `docs/reportes/capturas/W-de2-pipelines/05-de2-pipelines-05-orquestacion-airflow-dagster-mobile-390x844.png`
- **Lección 6 (`de2-pipelines-06-contenedores-docker-compose`):**
  - `docs/reportes/capturas/W-de2-pipelines/06-de2-pipelines-06-contenedores-docker-compose-lectura-light.png`
  - `docs/reportes/capturas/W-de2-pipelines/06-de2-pipelines-06-contenedores-docker-compose-practica-sql-light.png`
  - `docs/reportes/capturas/W-de2-pipelines/06-de2-pipelines-06-contenedores-docker-compose-dark-1280x720.png`
  - `docs/reportes/capturas/W-de2-pipelines/06-de2-pipelines-06-contenedores-docker-compose-mobile-390x844.png`

---

## Peticiones al orquestador

1. **Registro en `src/data/lessons/index.js`:** Al integrar la rama `agente/W-de2-pipelines` (o ejecutar `node scripts/sync-lessons-index.mjs`), registrar las 6 lecciones de `src/data/lessons/de2-pipelines/` en `src/data/lessons/index.js`.
2. **Integración de glosario en `src/data/glossary.js`:** Incorporar las 8 entradas validadas de `docs/curriculo/investigacion/de2-pipelines-glossary.json` en el glosario global durante la fase de ensamblaje.

---

## Pendiente

Ninguno.
