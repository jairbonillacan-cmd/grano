# Investigación y diseño curricular · Módulo `c1-modelo` (Modelo relacional y calidad de datos)

- **Módulo:** `c1-modelo` — Modelo relacional y calidad de datos
- **Área y nivel:** Tronco común (`core`) · Nivel 1 (Fundamentos)
- **Prerrequisitos de módulo:** `c1-sql-joins` (y por transitividad `c1-sql-base` y `c0-datos`)
- **Lecciones del módulo:** 5 lecciones (`105` minutos estimados en total: `[20, 25, 20, 20, 20]`)
- **Fecha de consulta de fuentes:** `2026-10-29`

---

## Paso 1 — Investigación de fuentes verificables por lección

Todas las fuentes listadas a continuación fueron verificadas mediante petición HTTP (`200 OK`) el `2026-10-29`. Cada lección cuenta con al menos 3 fuentes reales (`https://...`), de las cuales mínimo 2 son fuentes primarias (artículo fundacional de E. F. Codd de 1970, documentación oficial de PostgreSQL 17, documentación oficial de DuckDB, documentación oficial de dbt Labs y SQLMesh, y especificación Open Data Contract Standard de la Linux Foundation).

### Lección 1 · `c1-modelo-01-claves-primarias-foraneas`
**Título:** Claves primarias, naturales, subrogadas y foráneas (`20 min`)

| # | Tipo | Título y autor / editorial | URL verificada (`https://`) | Fecha (`accessed`) | Afirmación técnica que respalda en la lección |
|---|---|---|---|---|---|
| 1 | Primaria | E. F. Codd (1970) — *A Relational Model of Data for Large Shared Data Banks*, Communications of the ACM, 13(6), 377–387 | https://www.seas.upenn.edu/~zives/03f/cis550/codd.pdf | `2026-10-29` | Definición formal de relación, clave primaria no redundante para identificar cada tupla sin ambigüedad y enlace entre relaciones mediante claves foráneas. |
| 2 | Primaria | PostgreSQL 17 Documentation — Section 5.4: Constraints (Primary Keys, Unique Constraints, and Foreign Keys) (`PostgreSQL Global Development Group`) | https://www.postgresql.org/docs/current/ddl-constraints.html | `2026-10-29` | Semántica técnica de `PRIMARY KEY` como la combinación de `UNIQUE` y `NOT NULL`, diferencia frente a `UNIQUE` (que admite valores nulos salvo `NULLS NOT DISTINCT`) y declaración de `FOREIGN KEY`. |
| 3 | Primaria | DuckDB Documentation — Constraints (`DuckDB Foundation`) | https://duckdb.org/docs/sql/constraints.html | `2026-10-29` | Comportamiento de restricciones `PRIMARY KEY`, `UNIQUE`, `NOT NULL` y `FOREIGN KEY` en tablas analíticas de DuckDB y verificación de unicidad mediante consultas SQL sobre archivos Parquet. |
| 4 | Secundaria de referencia | Kimball Group — Dimensional Modeling Techniques: Surrogate Keys (`Ralph Kimball & Margy Ross`) | https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/surrogate-key/ | `2026-10-29` | Separación entre claves naturales de negocio (`sku`, `email`) y claves subrogadas enteras sin significado de negocio (`product_id`, `change_id`) para aislar el almacén de cambios operativos e historizar versiones SCD2. |

### Lección 2 · `c1-modelo-02-normalizacion-1fn-3fn`
**Título:** Normalización de 1FN a 3FN: evitar anomalías al actualizar (`25 min`)

| # | Tipo | Título y autor / editorial | URL verificada (`https://`) | Fecha (`accessed`) | Afirmación técnica que respalda en la lección |
|---|---|---|---|---|---|
| 1 | Primaria | E. F. Codd (1970) — *A Relational Model of Data for Large Shared Data Banks* (Sección 1.4: Normal Form) | https://www.seas.upenn.edu/~zives/03f/cis550/codd.pdf | `2026-10-29` | Eliminación de grupos repetitivos y dominios no atómicos (Primera Forma Normal, 1FN) y análisis de anomalías de inserción, actualización y borrado causadas por redundancia de datos. |
| 2 | Primaria | PostgreSQL 17 Documentation — Chapter 5: Data Definition (Table Basics & Schema Design) (`PostgreSQL Global Development Group`) | https://www.postgresql.org/docs/current/ddl.html | `2026-10-29` | Descomposición de tablas transaccionales para evitar repetir atributos descriptivos de entidades maestras (`stores`, `products`, `customers`) en tablas de eventos (`orders`, `order_items`). |
| 3 | Primaria | DuckDB Documentation — CREATE TABLE Statement & Data Types (`DuckDB Foundation`) | https://duckdb.org/docs/sql/statements/create_table.html | `2026-10-29` | Representación de esquemas normalizados en motores analíticos y diferenciación entre atributos maestros en `products` (`list_price_usd`) y atributos congelados en el evento transaccional (`order_items.unit_price_usd`). |

### Lección 3 · `c1-modelo-03-integridad-huerfanos`
**Título:** Integridad referencial: detectar huérfanos con ANTI JOIN (`20 min`)

| # | Tipo | Título y autor / editorial | URL verificada (`https://`) | Fecha (`accessed`) | Afirmación técnica que respalda en la lección |
|---|---|---|---|---|---|
| 1 | Primaria | PostgreSQL 17 Documentation — Section 5.4.5: Foreign Keys (`PostgreSQL Global Development Group`) | https://www.postgresql.org/docs/current/ddl-constraints.html | `2026-10-29` | Reglas de integridad referencial entre tabla hija (`referencing table`) y tabla padre (`referenced table`), y por qué en lagos de datos sobre archivos Parquet o cargas desacopladas las claves foráneas deben auditarse explícitamente con consultas. |
| 2 | Primaria | DuckDB Documentation — FROM & JOIN Clauses (`ANTI JOIN` and `SEMI JOIN`) (`DuckDB Foundation`) | https://duckdb.org/docs/sql/query_syntax/from.html | `2026-10-29` | Sintaxis nativa `FROM tabla_hija ANTI JOIN tabla_padre ON ...` en DuckDB, equivalencia con `WHERE NOT EXISTS (...)` y `LEFT JOIN ... WHERE pk IS NULL`, y comportamiento seguro ante valores `NULL` frente a `NOT IN`. |
| 3 | Primaria | dbt Labs Documentation — Add Data Tests to Your DAG (`relationships` generic test) (`dbt Labs`) | https://docs.getdbt.com/docs/build/data-tests | `2026-10-29` | Implementación industrial del test de integridad referencial (`relationships`) como una consulta que devuelve los registros huérfanos de la tabla hija cuyo identificador no existe en la tabla padre. |

### Lección 4 · `c1-modelo-04-auditoria-calidad`
**Título:** Auditoría SQL: duplicados, nulos y valores fuera de rango (`20 min`)

| # | Tipo | Título y autor / editorial | URL verificada (`https://`) | Fecha (`accessed`) | Afirmación técnica que respalda en la lección |
|---|---|---|---|---|---|
| 1 | Primaria | DuckDB Documentation — FILTER Clause in Aggregate Functions (`DuckDB Foundation`) | https://duckdb.org/docs/sql/query_syntax/filter.html | `2026-10-29` | Uso de `COUNT(*) FILTER (WHERE condicion)` para perfilar en una sola lectura de tabla múltiples reglas de completitud (nulos), formato (`LENGTH`) y dominio numérico (`<= 0`). |
| 2 | Primaria | PostgreSQL 17 Documentation — Section 9.18: Conditional Expressions (`PostgreSQL Global Development Group`) | https://www.postgresql.org/docs/current/functions-conditional.html | `2026-10-29` | Evaluación condicional con `CASE WHEN` y `COALESCE` para clasificar anomalías de datos en categorías mutuamente excluyentes sin perder filas por lógica trivalente de `NULL`. |
| 3 | Primaria | dbt Labs Documentation — Generic Data Tests (`unique`, `not_null`, `accepted_values`) (`dbt Labs`) | https://docs.getdbt.com/docs/build/data-tests | `2026-10-29` | Las cuatro dimensiones operativas de calidad de datos en tablas analíticas: unicidad (`unique`), completitud (`not_null`), validez de dominio (`accepted_values` / rangos numéricos) e integridad referencial (`relationships`). |

### Lección 5 · `c1-modelo-05-validacion-bloqueante`
**Título:** Reglas de validación bloqueantes antes de publicar una tabla (`20 min`)

| # | Tipo | Título y autor / editorial | URL verificada (`https://`) | Fecha (`accessed`) | Afirmación técnica que respalda en la lección |
|---|---|---|---|---|---|
| 1 | Primaria | SQLMesh Documentation — Audits (Blocking vs. Non-Blocking Data Quality Audits) (`Tobiko Data`) | https://sqlmesh.readthedocs.io/en/stable/concepts/audits/ | `2026-10-29` | Diseño de auditorías SQL que devuelven `0` filas cuando la regla se cumple, ejecución automática tras construir el modelo y detención del pipeline (`blocking = true`) antes de promover datos corruptos a producción. |
| 2 | Primaria | Bitol / Linux Foundation AI & Data — Open Data Contract Standard (ODCS v3) (`LF AI & Data`) | https://bitol-io.github.io/open-data-contract-standard/latest/ | `2026-10-29` | Especificación de reglas de calidad verificables dentro de contratos de datos entre productores y consumidores, distinguiendo umbrales críticos bloqueantes de advertencias operativas. |
| 3 | Primaria | Apache Iceberg Official Specification — Write-Audit-Publish (WAP) Pattern (`Apache Software Foundation`) | https://iceberg.apache.org/spec/ | `2026-10-29` | Patrón **Write-Audit-Publish (WAP)**: escribir los datos transformados en una tabla o versión aislada, ejecutar las consultas de validación bloqueantes y publicar la tabla únicamente si todas las reglas devuelven `0` fallos. |
| 4 | Primaria | dbt Labs Documentation — Data Tests & Severity Configuration (`error` vs `warn`) (`dbt Labs`) | https://docs.getdbt.com/docs/build/data-tests | `2026-10-29` | Configuración de severidad (`severity: error` frente a `severity: warn`) e invariantes de reconciliación antes de exponer modelos a herramientas de Business Intelligence. |

---

## Paso 2 — Mapa de conceptos y progresión pedagógica del módulo

### Qué asume este módulo de los módulos previos
- De **`c0-datos`**: qué es una tabla, tipos de dato (`INTEGER`, `DOUBLE`, `VARCHAR`, `DATE`, `TIMESTAMP`, `BOOLEAN`), el significado de `NULL` y el concepto de **grano** (qué representa exactamente una fila).
- De **`c1-sql-base`**: `SELECT`, `FROM`, `WHERE`, `GROUP BY`, `HAVING`, `ORDER BY`, `LIMIT`, `CASE WHEN`, cláusula `FILTER (WHERE ...)`, `IS NULL` / `IS NOT NULL`, `COALESCE` y la diferencia entre `COUNT(*)`, `COUNT(col)` y `COUNT(DISTINCT col)`.
- De **`c1-sql-joins`**: combinaciones `INNER JOIN`, `LEFT JOIN`, `ANTI JOIN` (`NOT EXISTS`), subconsultas, expresiones de tabla común (`WITH` / CTEs), `UNION ALL` y el riesgo de multiplicar filas (**fan-out**) al unir relaciones `1:N`.

### Progresión de conceptos en las 5 lecciones de `c1-modelo`

| Orden | ID de lección | Concepto central que introduce | Qué asume de la anterior | Qué anomalía real de Mercado Brisa resuelve |
|---|---|---|---|---|
| 1 | `c1-modelo-01-claves-primarias-foraneas` | **Clave primaria (PK)**, **clave natural**, **clave subrogada**, **clave compuesta** y **clave foránea (FK)**. Diferencia entre identidad de la entidad y versión histórica. | Concepto de grano (`c0-datos`, `c1-sql-joins`) y conteo de únicos (`COUNT(DISTINCT)`). | Verifica en `products`, `customers`, `customer_changes`, `orders` y `payments` qué columnas son claves subrogadas únicas y dónde se repite la clave natural o de negocio (`customer_id` en `customer_changes` con 4 100 filas para 2 400 clientes; `idempotency_key` en `payments` con 450 repeticiones). |
| 2 | `c1-modelo-02-normalizacion-1fn-3fn` | ** dependencia funcional**, **1FN** (atomicidad, sin grupos repetidos), **2FN** (sin dependencia parcial de una clave compuesta), **3FN** (sin dependencia transitiva) y **anomalías de actualización, inserción y borrado**. Cuándo congelar un atributo histórico (`unit_price_usd`). | Claves primarias simples, compuestas y foráneas de la Lección 1. | Cuantifica en `orders`, `order_items`, `stores` y `products` cuántas miles de filas habría que reescribir si `store_name`, `region` o `segment` vivieran repetidos en la tabla de pedidos en lugar de en sus tablas maestras en 3FN. |
| 3 | `c1-modelo-03-integridad-huerfanos` | **Integridad referencial**, **registro huérfano**, auditoría con **`ANTI JOIN`** / **`NOT EXISTS`** / `LEFT JOIN ... IS NULL` y por qué `NOT IN` falla silenciosamente cuando la subconsulta contiene `NULL`. Integridad referencial lógica (apuntar a registros desactivados). | Relaciones padre-hijo mediante claves foráneas (Lección 1) y separación en tablas maestras y transaccionales (Lección 2). | Detecta en `events` las 6 715 filas anónimas sin cliente en `customers`, audita pedidos sin pago `'captured'` en `payments` (`1 080` cancelados y `720` pendientes) y aísla en `order_items` las líneas que apuntan a los 9 productos inactivos (`is_active = FALSE`) de `products`. |
| 4 | `c1-modelo-04-auditoria-calidad` | Las 4 dimensiones operativas de calidad SQL: **unicidad** (duplicados de ingesta), **completitud** (nulos inesperados), **validez de formato** (`LENGTH`) y **validez de dominio/rango** (valores negativos o imposibles). Perfilado en una pasada con `COUNT(*) FILTER (WHERE ...)`. | Claves y grano (Lección 1), dependencias entre columnas (Lección 2) e integridad referencial (Lección 3). | Localiza y cuantifica con precisión las 4 anomalías sembradas en Mercado Brisa: `450` cobros duplicados por webhook en `payments`, `1 200` eventos duplicados en `events`, `347` clientes con `postal_code` nulo (`218`) o truncado de 2 caracteres (`129`) en `customers`, y el producto `SKU-TEST-NEG` con `list_price_usd = -9.99` en `products`. |
| 5 | `c1-modelo-05-validacion-bloqueante` | **Asersión de cero filas** (*zero-row test*), clasificación de severidad (**bloqueante `BLOCKED`** frente a **aviso `WARN`**), invariantes de reconciliación y patrón **Write-Audit-Publish (WAP)** mediante CTEs antes de exponer una tabla limpia. | Los 4 tipos de pruebas de calidad de las Lecciones 1 a 4. | Construye una compuerta SQL de validación que detiene la publicación (`BLOCKED`) ante los `450` duplicados de `payments` y el precio `-9.99` de `products`, aplica las reglas de limpieza en CTEs (`payments_silver`, `products_silver`, `order_items_silver`) y demuestra que las pruebas pasan a `0` fallos (`PASS`). |

### Cómo conecta con los módulos siguientes
- Prepara directamente **`c2-dimensional`** (Modelado dimensional): el alumno ya distingue claves naturales de claves subrogadas (`change_id` en `customer_changes`) y comprende por qué el OLTP normaliza en 3FN para proteger la escritura mientras que el almacén analítico desnormaliza de forma controlada en esquema en estrella.
- Prepara **`de3-transformacion`** (dbt y SQLMesh) y **`da2-eda`** (Exploración de datos con método): las consultas de auditoría de cero filas de las Lecciones 3, 4 y 5 son exactamente el código que ejecutan los `data_tests` de dbt y los `AUDITS` bloqueantes de SQLMesh.

---

## Paso 6 — Proyecto del módulo `c1-modelo` y rúbrica verificable

### Especificación actual en `src/data/catalog/modules.js`
- **Enunciado (`prompt`):** Auditar la calidad de las tablas transaccionales y localizar todos los errores sembrados en el dataset.
- **Dataset:** Mercado Brisa (`customers`, `products`, `orders`, `order_items`, `payments` y `events`).
- **Entregable (`deliverable`):** Suite de 8 consultas SQL de validación (que devuelven 0 filas cuando todo es correcto, o un resumen consolidado con el conteo exacto de violaciones sobre las tablas crudas) e informe técnico de hallazgos con propuesta de remediación.

### Las 8 comprobaciones obligatorias de la suite del proyecto (verificadas en DuckDB)
1. **Unicidad de claves primarias subrogadas:** verificar que `customer_id` en `customers`, `product_id` en `products`, `order_id` en `orders`, `order_item_id` en `order_items` y `payment_id` en `payments` tienen `0` duplicados y `0` nulos.
2. **Idempotencia de webhooks en `payments`:** detectar las `450` filas duplicadas que repiten `idempotency_key` con `4` segundos de diferencia (`19 200` filas totales menos `18 750` claves únicas).
3. **Idempotencia de telemetría en `events`:** detectar las `1 200` filas duplicadas por reintento móvil que repiten `event_id` (`65 000` filas totales menos `63 800` eventos únicos).
4. **Completitud y formato de `postal_code` en `customers`:** aislar los `218` registros con `postal_code IS NULL` y los `129` registros con código postal truncado de 2 caracteres (`347` clientes afectados en total).
5. **Dominio de precios y costos en `products`:** detectar el registro `product_id = 180` (`sku = 'SKU-TEST-NEG'`, `list_price_usd = -9.99`, `is_active = FALSE`) que viola `list_price_usd > 0`.
6. **Integridad referencial estricta en transacciones (`orders`, `order_items`, `payments`, `refunds`):** comprobar con `ANTI JOIN` que `0` pedidos apuntan a clientes o tiendas inexistentes, `0` líneas apuntan a pedidos o productos inexistentes y `0` pagos o reembolsos apuntan a pedidos inexistentes.
7. **Integridad referencial lógica e inventario activo (`order_items` -> `products`):** identificar los `9` productos con `is_active = FALSE` que acumulan líneas históricas en `order_items` y distinguirlos del producto `180` (`SKU-TEST-NEG`), que tiene `0` líneas en `order_items`.
8. **Consistencia aritmética entre cabecera y detalle (`orders` vs `order_items`):** comprobar que para los `18 000` pedidos se cumple `ABS(o.subtotal_usd - SUM(oi.line_total_usd)) < 0.01` y `ABS(o.total_usd - (o.subtotal_usd - o.discount_usd + o.shipping_usd + o.tax_usd)) < 0.01` (`0` discrepancias).

### Rúbrica verificable de evaluación del proyecto (4 criterios, escala 0 a 4)

| Criterio | 0–1 (Insuficiente) | 2 (En desarrollo) | 3 (Competente — Aprobado) | 4 (Excelente) |
|---|---|---|---|---|
| **1. Cobertura de las 4 dimensiones de calidad** | Solo revisa nulos o duplicados aislados en una tabla sin cubrir claves, dominios ni referencias. | Cubre 2 o 3 dimensiones pero omite la validación de rangos numéricos (`list_price_usd <= 0`) o de formato (`LENGTH(postal_code)`). | Incluye las 8 consultas cubriendo unicidad de PK/idempotencia, completitud/formato, validez de dominio e integridad referencial sobre las tablas de Mercado Brisa. | Además de las 8 consultas individuales, entrega una vista consolidada (`UNION ALL`) que ejecuta toda la suite en una sola consulta con código de regla, severidad (`BLOCKED` / `WARN`) y conteo exacto. |
| **2. Corrección de `ANTI JOIN` y manejo de `NULL`** | Usa `NOT IN` sobre columnas anulables (como `events.customer_id`) obteniendo `0` filas por error de lógica trivalente. | Usa `LEFT JOIN` sin filtrar `WHERE pk_padre IS NULL` o confunde un valor `NULL` legítimo (sesión web anónima) con una clave foránea rota. | Utiliza `ANTI JOIN` o `NOT EXISTS` correctamente y separa en su consulta las referencias nulas esperadas (`events.customer_id IS NULL`: `6 715` filas) de posibles claves huérfanas no nulas (`0` filas). | Audita tanto la integridad referencial estructural (clave inexistente en tabla padre) como la integridad lógica de negocio (pedidos sin pago `'captured'` o líneas asociadas a productos con `is_active = FALSE`). |
| **3. Exactitud cuantitativa sobre Mercado Brisa** | Los conteos no coinciden con el dataset o confunde reintentos legítimos de pago (`attempt_number = 2`, `750` filas) con duplicados de webhook (`450` filas). | Localiza `SKU-TEST-NEG` y los nulos de `postal_code`, pero cuenta mal los duplicados de `payments` al agrupar por `order_id` en vez de `idempotency_key`. | Reporta las cifras exactas verificables en DuckDB: `450` webhooks duplicados en `payments`, `1 200` eventos duplicados en `events`, `347` códigos postales defectuosos (`218` nulos + `129` truncados) y `1` producto con precio negativo (`-9.99`). | Incluye además la prueba de reconciliación aritmética entre `orders.subtotal_usd` y `SUM(order_items.line_total_usd)` demostrando `0` descuadres con tolerancia `0.01`. |
| **4. Diseño de compuerta bloqueante (WAP)** | Propone borrar filas manualmente en producción sin diferenciar severidad ni definir consultas de verificación. | Propone filtros `WHERE` sueltos pero no estructura las pruebas bajo el contrato de aserción de cero filas. | Formula las reglas críticas como aserciones que devuelven `0` filas tras aplicar las CTEs de saneamiento (`payments_silver`, `products_silver`). | Implementa el flujo **Write-Audit-Publish (WAP)** completo en SQL y clasifica con criterio qué reglas detienen el pipeline (`BLOCKED`: duplicados de cobro, precios negativos, huérfanos) y cuáles solo emiten alerta (`WARN`: código postal incompleto). |
