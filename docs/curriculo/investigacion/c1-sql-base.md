# Investigación curricular y mapa de conceptos — Módulo `c1-sql-base` ("SQL desde cero")

- **Módulo:** `c1-sql-base` (`SQL desde cero`)
- **Área:** Tronco común (`core`)
- **Nivel:** `1` (`Fundamentos`)
- **Prerrequisito de módulo:** `c0-datos` (`Qué son los datos`)
- **Lecciones del módulo:** 7 lecciones (`140` minutos estimados en total)
- **Fecha de consulta de fuentes (`accessed`):** `2026-10-29`

---

## 1. Investigación de fuentes verificables por lección (Paso 1)

Cada una de las 7 lecciones del módulo se respalda en al menos 3 fuentes técnicas verificadas mediante HTTPS (código de respuesta `200 OK`), incluyendo como mínimo 2 fuentes primarias oficiales de **DuckDB Stable SQL Reference** y **PostgreSQL 17 Documentation**.

### Lección 1 — `c1-sql-base-01-select-from-where`
**Título:** `SELECT, FROM y WHERE: orden lógico frente a escritura`

| # | Tipo | Título de la fuente | Editorial / Autor | URL | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|---|
| 1 | Primaria | DuckDB SQL Reference — `SELECT` Clause | DuckDB Foundation | https://duckdb.org/docs/stable/sql/query_syntax/select | `2026-10-29` | Proyección de columnas, expresiones aritméticas, asignación de alias con `AS` y extensión de DuckDB que permite referenciar alias de proyección en cláusulas posteriores. |
| 2 | Primaria | DuckDB SQL Reference — `WHERE` Clause | DuckDB Foundation | https://duckdb.org/docs/stable/sql/query_syntax/where | `2026-10-29` | Filtrado de filas mediante predicados booleanos evaluados después de `FROM` y antes de la agrupación o el ordenamiento. |
| 3 | Primaria | PostgreSQL 17 Documentation — Chapter 7.2: Table Expressions (`FROM` and `WHERE`) | PostgreSQL Global Development Group | https://www.postgresql.org/docs/17/queries-table-expressions.html | `2026-10-29` | Orden lógico estándar de evaluación (`FROM` genera la tabla virtual de entrada, `WHERE` filtra filas individuales, `SELECT` evalúa expresiones de salida), por el cual un alias de `SELECT` no existe aún dentro de `WHERE` en SQL estándar. |
| 4 | Primaria | DuckDB SQL Reference — Logical Operators (`AND`, `OR`, `NOT`) | DuckDB Foundation | https://duckdb.org/docs/stable/sql/expressions/logical_operators | `2026-10-29` | Precedencia de operadores booleanos donde `AND` se evalúa antes que `OR`, obligando a usar paréntesis al combinar listas de alternativas con filtros adicionales. |

### Lección 2 — `c1-sql-base-02-orderby-limit-distinct`
**Título:** `ORDER BY, LIMIT y DISTINCT: ordenar y acotar resultados`

| # | Tipo | Título de la fuente | Editorial / Autor | URL | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|---|
| 1 | Primaria | DuckDB SQL Reference — `ORDER BY` Clause | DuckDB Foundation | https://duckdb.org/docs/stable/sql/query_syntax/orderby | `2026-10-29` | Ordenamiento ascendente por defecto (`ASC`), descendente (`DESC`), soporte de múltiples claves de desempate y control explícito de nulos con `NULLS FIRST` / `NULLS LAST`. |
| 2 | Primaria | DuckDB SQL Reference — `LIMIT` and `OFFSET` Clause | DuckDB Foundation | https://duckdb.org/docs/stable/sql/query_syntax/limit | `2026-10-29` | Acotación del número de filas devueltas tras el ordenamiento y paginación mediante `OFFSET`. |
| 3 | Primaria | PostgreSQL 17 Documentation — Chapter 7.5 & 7.6: Sorting Rows (`ORDER BY`) and `LIMIT`/`OFFSET` | PostgreSQL Global Development Group | https://www.postgresql.org/docs/17/queries-order.html | `2026-10-29` | Sin `ORDER BY`, el orden de las filas devueltas por el motor es indefinido y `LIMIT` recorta un subconjunto arbitrario; en caso de empate en la primera columna de ordenamiento, se requiere una segunda columna única para obtener un corte determinista. |
| 4 | Primaria | PostgreSQL 17 Documentation — Chapter 7.3: Select Lists (`SELECT DISTINCT`) | PostgreSQL Global Development Group | https://www.postgresql.org/docs/17/queries-select-lists.html | `2026-10-29` | `SELECT DISTINCT` elimina filas duplicadas evaluando la tupla completa de todas las columnas proyectadas en el `SELECT`, no una sola columna aislada. |

### Lección 3 — `c1-sql-base-03-null-logica-coalesce`
**Título:** `NULL, lógica de tres valores, IS NULL y COALESCE`

| # | Tipo | Título de la fuente | Editorial / Autor | URL | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|---|
| 1 | Primaria | DuckDB SQL Reference — Comparison Operators (`IS NULL`, `IS DISTINCT FROM`) | DuckDB Foundation | https://duckdb.org/docs/stable/sql/expressions/comparison_operators | `2026-10-29` | Cualquier comparación ordinaria (`=`, `<>`) con `NULL` produce `NULL` (`UNKNOWN`); para comparar de forma segura ante nulos se emplean `IS NULL`, `IS NOT NULL` o el predicado estándar `IS DISTINCT FROM`. |
| 2 | Primaria | PostgreSQL 17 Documentation — Section 9.2: Comparison Functions and Operators | PostgreSQL Global Development Group | https://www.postgresql.org/docs/17/functions-comparison.html | `2026-10-29` | Tablas de verdad de la lógica trivalente (`TRUE`, `FALSE`, `UNKNOWN`) y comportamiento de `WHERE`, que solo conserva filas cuyo predicado evalúa a `TRUE`. |
| 3 | Primaria | PostgreSQL 17 Documentation — Section 9.18: Conditional Expressions (`COALESCE`, `NULLIF`) | PostgreSQL Global Development Group | https://www.postgresql.org/docs/17/functions-conditional.html | `2026-10-29` | `COALESCE` evalúa sus argumentos de izquierda a derecha y devuelve el primer valor no nulo; `NULLIF(a, b)` devuelve `NULL` cuando ambos argumentos son iguales, evitando divisiones por cero. |
| 4 | Secundaria | Modern SQL — Three-Valued Logic (`3VL`) in SQL | Markus Winand | https://modern-sql.com/concept/three-valued-logic | `2026-10-29` | Explicación de por qué un filtro `WHERE col <> 'X'` descarta silenciosamente todas las filas con `col IS NULL` y cómo prevenir pérdidas de datos en reportes. |

### Lección 4 — `c1-sql-base-04-groupby-having`
**Título:** `GROUP BY y HAVING: agregar filas y filtrar grupos`

| # | Tipo | Título de la fuente | Editorial / Autor | URL | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|---|
| 1 | Primaria | DuckDB SQL Reference — `GROUP BY` Clause and `GROUP BY ALL` | DuckDB Foundation | https://duckdb.org/docs/stable/sql/query_syntax/groupby | `2026-10-29` | Colapso de filas al grano de las claves de agrupación, regla de columnas no agregadas y extensión `GROUP BY ALL` en DuckDB. |
| 2 | Primaria | DuckDB SQL Reference — `HAVING` Clause | DuckDB Foundation | https://duckdb.org/docs/stable/sql/query_syntax/having | `2026-10-29` | Evaluación de condiciones sobre grupos ya formados y sobre resultados de funciones de agregación (`SUM`, `AVG`, `COUNT`). |
| 3 | Primaria | PostgreSQL 17 Documentation — Section 7.2.3: `GROUP BY` and `HAVING` Clauses | PostgreSQL Global Development Group | https://www.postgresql.org/docs/17/queries-table-expressions.html | `2026-10-29` | Separación estricta de fases: `WHERE` filtra filas de entrada antes de agrupar y no admite funciones agregadas, mientras que `HAVING` filtra grupos después de `GROUP BY`. |

### Lección 5 — `c1-sql-base-05-case-when-filter`
**Título:** `Expresiones condicionales con CASE WHEN y cláusula FILTER`

| # | Tipo | Título de la fuente | Editorial / Autor | URL | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|---|
| 1 | Primaria | DuckDB SQL Reference — `CASE` Statement | DuckDB Foundation | https://duckdb.org/docs/stable/sql/expressions/case | `2026-10-29` | Evaluación secuencial de ramas `WHEN ... THEN ...` en orden de aparición, retorno de la primera rama verdadera y retorno implícito de `NULL` cuando se omite `ELSE`. |
| 2 | Primaria | DuckDB SQL Reference — `FILTER` Clause | DuckDB Foundation | https://duckdb.org/docs/stable/sql/query_syntax/filter | `2026-10-29` | Sintaxis `agg_func(expr) FILTER (WHERE cond)` para alimentar cada función de agregación solo con las filas que cumplen su condición particular. |
| 3 | Primaria | PostgreSQL 17 Documentation — Section 4.2.7: Aggregate Expressions (`FILTER`) | PostgreSQL Global Development Group | https://www.postgresql.org/docs/17/sql-expressions.html | `2026-10-29` | Equivalencia y ventaja de `FILTER (WHERE ...)` sobre `CASE WHEN` en promedios (`AVG`), evitando introducir ceros artificiales que distorsionan el denominador. |
| 4 | Secundaria | Modern SQL — Aggregate `FILTER` Clause (`SQL:2003`) | Markus Winand | https://modern-sql.com/feature/filter | `2026-10-29` | Uso de `FILTER` para pivotar métricas por estado o canal en una sola lectura de tabla y comparativa de soporte en dialectos SQL. |

### Lección 6 — `c1-sql-base-06-fechas-date-trunc`
**Título:** `Funciones de fecha y tiempo: DATE_TRUNC y DATE_DIFF`

| # | Tipo | Título de la fuente | Editorial / Autor | URL | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|---|
| 1 | Primaria | DuckDB SQL Reference — Date Functions (`date_trunc`, `date_diff`, `extract`) | DuckDB Foundation | https://duckdb.org/docs/stable/sql/functions/date | `2026-10-29` | Comportamiento de `date_trunc(part, date)` (trunca al inicio de la unidad de calendario conservando el año) y `date_diff(part, startdate, enddate)` (cuenta fronteras de unidad cruzadas entre dos fechas). |
| 2 | Primaria | DuckDB SQL Reference — Timestamp Functions | DuckDB Foundation | https://duckdb.org/docs/stable/sql/functions/timestamp | `2026-10-29` | Aritmética con `TIMESTAMP` e `INTERVAL`, truncado horario/mensual y comparación entre marcas de tiempo y fechas. |
| 3 | Primaria | PostgreSQL 17 Documentation — Section 9.9: Date/Time Functions and Operators | PostgreSQL Global Development Group | https://www.postgresql.org/docs/17/functions-datetime.html | `2026-10-29` | Diferencia semántica entre `date_trunc('month', ts)` (devuelve `YYYY-MM-01 00:00:00`) y `EXTRACT(MONTH FROM ts)` (devuelve un entero `1..12` sin año), así como el uso de intervalos semiabiertos `[inicio, fin)` para filtrar columnas `TIMESTAMP`. |

### Lección 7 — `c1-sql-base-07-count-variantes`
**Título:** `Diferencias entre COUNT(*), COUNT(col) y COUNT(DISTINCT)`

| # | Tipo | Título de la fuente | Editorial / Autor | URL | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|---|
| 1 | Primaria | DuckDB SQL Reference — Aggregate Functions (`count`, `count(arg)`, `DISTINCT`) | DuckDB Foundation | https://duckdb.org/docs/stable/sql/functions/aggregates | `2026-10-29` | Definición exacta de `COUNT(*)` (cuenta filas totales incluyendo nulos), `COUNT(col)` (cuenta valores no nulos de `col`) y `COUNT(DISTINCT col)` (cuenta valores únicos no nulos). |
| 2 | Primaria | PostgreSQL 17 Documentation — Section 9.21: Aggregate Functions | PostgreSQL Global Development Group | https://www.postgresql.org/docs/17/functions-aggregate.html | `2026-10-29` | Comportamiento de las funciones de agregación frente a valores `NULL` (`COUNT` devuelve `0` sobre un conjunto vacío de no nulos, mientras que `SUM` y `AVG` devuelven `NULL`). |
| 3 | Primaria |PostgreSQL 17 Documentation — Section 4.2.7: Aggregate Expressions (`DISTINCT` in aggregates) | PostgreSQL Global Development Group | https://www.postgresql.org/docs/17/sql-expressions.html | `2026-10-29` | Reglas de evaluación de `COUNT(DISTINCT col)` y su combinación con `FILTER (WHERE ...)` para auditar duplicados y cardinalidad de entidades. |

---

## 2. Mapa de conceptos y progresión pedagógica (Paso 2)

El módulo `c1-sql-base` es el primer contacto del estudiante con SQL en toda la ruta de Grano. Parte exclusivamente de los conceptos adquiridos en `c0-datos` (qué es una tabla, qué es una fila y una columna, qué es el grano, tipos de dato básicos y que `NULL` representa ausencia de dato) y construye paso a paso el dominio de consultas sobre una única tabla sin usar `JOIN` (que se aborda en el módulo siguiente, `c1-sql-joins`).

| Orden | ID de lección | Conceptos previos que asume | Conceptos nuevos que introduce | Qué prepara hacia adelante |
|---:|---|---|---|---|
| 1 | `c1-sql-base-01-select-from-where` | Tabla, fila, columna, grano y tipos básicos (`INTEGER`, `DOUBLE`, `VARCHAR`, `BOOLEAN`) de `c0-datos`. | Cláusulas `FROM`, `WHERE` y `SELECT`; alias de columna con `AS`; orden de escritura frente a orden lógico de evaluación (`FROM` → `WHERE` → `SELECT`); operadores `=`, `<>`, `<`, `<=`, `>`, `>=`, `IN`, `BETWEEN`; conectores `AND`, `OR` y precedencia con paréntesis. | Permite filtrar y proyectar cualquier tabla individual en las lecciones 2 a 7. |
| 2 | `c1-sql-base-02-orderby-limit-distinct` | `SELECT`, `FROM`, `WHERE`, alias con `AS` y predicados booleanos (Lección 1). | Deduplicación de filas proyectadas con `SELECT DISTINCT` (sobre la tupla completa); ordenamiento con `ORDER BY` (`ASC`, `DESC`, múltiples columnas de desempate); acotación con `LIMIT` y `OFFSET`; orden lógico ampliado (`FROM` → `WHERE` → `SELECT` → `DISTINCT` → `ORDER BY` → `LIMIT`). | Permite presentar rankings deterministas y muestras acotadas en todas las consultas posteriores. |
| 3 | `c1-sql-base-03-null-logica-coalesce` | Concepto de `NULL` de `c0-datos` y filtrado con `WHERE` / `ORDER BY` (Lecciones 1 y 2). | Lógica trivalente (`TRUE`, `FALSE`, `UNKNOWN`); por qué `= NULL` y `<> NULL` filtran mal en `WHERE`; predicados `IS NULL`, `IS NOT NULL` e `IS DISTINCT FROM`; funciones `COALESCE` y `NULLIF`; posición de los nulos con `NULLS FIRST` / `NULLS LAST`. | Evita perder filas con campos opcionales nulos antes de agrupar o promediar en las lecciones 4, 5 y 7. |
| 4 | `c1-sql-base-04-groupby-having` | `SELECT`, `WHERE`, manejo de `NULL` y concepto de grano (Lecciones 1 a 3). | Agregación y cambio de grano con `GROUP BY`; funciones `SUM`, `AVG`, `MIN`, `MAX`, `COUNT`; regla de columnas en `SELECT` con `GROUP BY` (y atajo `GROUP BY ALL` en DuckDB); filtrado de grupos con `HAVING` frente a filtrado de filas con `WHERE`. | Sienta la base de todas las consultas de resumen, agregación condicional (Lección 5), series temporales (Lección 6) y pre-agregación en `c1-sql-joins`. |
| 5 | `c1-sql-base-05-case-when-filter` | Predicados booleanos, manejo de `NULL` y agregación con `GROUP BY` (Lecciones 1 a 4). | Expresión condicional `CASE WHEN ... THEN ... ELSE ... END` (evaluación en cortocircuito y `NULL` por omisión sin `ELSE`); segmentación en tramos (*bucketing*); agregación condicional con `SUM(CASE WHEN ...)` y cláusula estándar `FILTER (WHERE ...)`; trampa del `ELSE 0` dentro de `AVG`. | Permite construir tablas resumen multicolumna y embudos sin subconsultas ni uniones. |
| 6 | `c1-sql-base-06-fechas-date-trunc` | Tipos `DATE` y `TIMESTAMP`, filtrado en `WHERE` y agrupación con `GROUP BY` (Lecciones 1 a 5). | Diferencia operativa entre `DATE` y `TIMESTAMP`; truncado al inicio del periodo con `DATE_TRUNC` frente a extracción de componente con `EXTRACT` / `DATE_PART`; diferencia entre fechas con `DATE_DIFF`; aritmética con `INTERVAL`; filtros de rango temporal con intervalos semiabiertos `[inicio, fin)`. | Prepara el análisis de cohortes, ventanas temporales y tablas de calendario en `c2-sql-analitico` y `da3-producto`. |
| 7 | `c1-sql-base-07-count-variantes` | `NULL`, `GROUP BY`, `CASE WHEN` / `FILTER` y fechas (Lecciones 1 a 6). | Diferencia exacta entre `COUNT(*)` (filas físicas), `COUNT(columna)` (valores no nulos) y `COUNT(DISTINCT columna)` (valores únicos no nulos); auditoría de completitud (`COUNT(*) - COUNT(col)`) y detección de duplicados (`COUNT(*) - COUNT(DISTINCT pk)`). | Conecta directamente con la auditoría de grano y prevención de *fan-out* en `c1-sql-joins` y las reglas de calidad de `c1-modelo`. |

**Verificación de dependencias conceptuales:** Ninguna lección utiliza `JOIN`, subconsultas, CTEs (`WITH`) ni funciones de ventana (`OVER`), ya que pertenecen a `c1-sql-joins` y `c2-sql-analitico`. Todo concepto utilizado en un ejemplo o práctica ha sido introducido en la misma lección o en una lección anterior de la secuencia.

---

## 3. Especificación y rúbrica del proyecto del módulo (Paso 6)

### Datos del proyecto en `src/data/catalog/modules.js`
- **Enunciado (`prompt`):** Resolver 10 preguntas operativas de ventas, descuentos y entregas sobre una única tabla sin usar JOINs.
- **Dataset (`dataset`):** Mercado Brisa (`orders`).
- **Entregable (`deliverable`):** Archivo `.sql` con las 10 consultas comentadas y sus tablas de salida verificadas en DuckDB.

### Las 10 preguntas operativas verificables sobre `orders`
Para que el alumno y el evaluador verifiquen el entregable de forma determinista sobre `orders.parquet` (`18.000` filas), las 10 consultas del proyecto cubren las 7 lecciones del módulo:

1. **Pedidos de alto valor entregados en tienda física (L1 — `SELECT`, `FROM`, `WHERE`):** Listar `order_id`, `customer_id`, `store_id`, `order_date` y `total_usd` de los pedidos con `status = 'completed'`, `device_type = 'pos_tienda'` y `total_usd >= 1400`.
2. **Ranking de los 10 mayores descuentos otorgados (L2 — `ORDER BY`, `LIMIT`):** Obtener los 10 pedidos completados con mayor `discount_usd`, desempatando por `order_id ASC`, mostrando `order_id`, `customer_id`, `subtotal_usd`, `discount_usd` y `total_usd`.
3. **Catálogo de monedas y dispositivos activos (L2 — `DISTINCT`):** Listar todas las combinaciones únicas de `currency` y `device_type` presentes en `orders`, ordenadas alfabéticamente.
4. **Auditoría de pedidos orgánicos frente a campañas (L3 — `IS NULL`, `COALESCE`, `IS DISTINCT FROM`):** Contar y sumar `total_usd` agrupando por `COALESCE(campaign_id, 'ORGANICO') AS attribution_group` para todos los pedidos cuyo estado sea distinto de `'cancelled'`.
5. **Desempeño por tienda en pedidos completados (L4 — `GROUP BY`, `HAVING`):** Por cada `store_id`, calcular pedidos completados (`COUNT(*)`), ingreso neto (`ROUND(SUM(total_usd), 2)`) y ticket promedio (`ROUND(AVG(total_usd), 2)`), conservando con `HAVING` solo las tiendas que superen `450000` USD de ingreso.
6. **Segmentación de pedidos por tramo de importe (L5 — `CASE WHEN`):** Clasificar los pedidos completados en tres tramos de `total_usd` (`'1. Bajo (< 150 USD)'`, `'2. Medio (150-500 USD)'`, `'3. Alto (> 500 USD)'`) y reportar cantidad de pedidos e ingreso total por tramo.
7. **Cuadro de mando de estados por canal de dispositivo (L5 — `FILTER`):** Por cada `device_type`, calcular en una sola consulta el total de pedidos, los completados (`FILTER (WHERE status = 'completed')`), los reembolsados (`FILTER (WHERE status = 'refunded')`) y el porcentaje de reembolso sobre el total.
8. **Evolución mensual de ingresos en 2025 (L6 — `DATE_TRUNC` e intervalo semiabierto):** Agrupar por `DATE_TRUNC('month', order_date)::DATE AS order_month` los pedidos completados entre `2025-01-01` y `< 2026-01-01`, mostrando pedidos, ingresos y descuento medio.
9. **Antigüedad del primer y último pedido por moneda (L6 — `MIN`, `MAX`, `DATE_DIFF`):** Por cada `currency`, obtener la fecha del primer pedido (`MIN(order_date)`), la del último pedido (`MAX(order_date)`) y los días transcurridos entre ambas con `DATE_DIFF('day', MIN(order_date), MAX(order_date))`.
10. **Censo de cardinalidad y cobertura de campañas por tienda (L7 — `COUNT(*)`, `COUNT(col)`, `COUNT(DISTINCT)`):** Por cada `store_id`, reportar `COUNT(*) AS total_orders`, `COUNT(campaign_id) AS campaign_orders`, `COUNT(DISTINCT campaign_id) AS distinct_campaigns` y `COUNT(DISTINCT customer_id) AS unique_customers`.

### Rúbrica de evaluación del proyecto (4 criterios, escala 0 a 4)

| Criterio | 0–1 (Insuficiente) | 2 (En progreso) | 3 (Competente) | 4 (Excelente) |
|---|---|---|---|---|
| **1. Corrección de filtrado y orden lógico (`WHERE`, `ORDER BY`, `LIMIT`)** | Confunde `WHERE` con `HAVING`, usa `OR` sin paréntesis alterando el filtro o aplica `LIMIT` sin `ORDER BY`. | Las consultas ejecutan, pero omiten cláusulas de desempate en `ORDER BY` o filtran estados incorrectos. | Las consultas 1 a 3 devuelven las filas exactas con predicados booleanos bien agrupados y ordenamiento explícito. | Todas las consultas aplican filtros precisos, usan `ORDER BY` con clave de desempate (`order_id ASC`) y documentan el grano de salida. |
| **2. Tratamiento de `NULL` y lógica trivalente (`IS NULL`, `COALESCE`)** | Usa `= NULL` o `<> NULL`, perdiendo los `6.000` pedidos orgánicos (`campaign_id IS NULL`). | Usa `IS NULL` en filtros simples, pero no etiqueta los nulos en reportes agrupados con `COALESCE`. | Resuelve la consulta 4 sin perder filas nulas utilizando `COALESCE(campaign_id, 'ORGANICO')` e `IS NULL` / `IS DISTINCT FROM`. | Maneja `NULL` de forma explícita en proyecciones, filtros y promedios, evitando sesgar denominadores con ceros artificiales. |
| **3. Agregación, condicionales y series de fechas (`GROUP BY`, `HAVING`, `FILTER`, `DATE_TRUNC`)** | Mezcla años usando `EXTRACT(MONTH)` sin año o filtra marcas de tiempo con `BETWEEN` dejando fuera horas del último día. | Agrupa con `GROUP BY`, pero repite subconsultas en lugar de usar `FILTER (WHERE ...)` o trunca fechas de forma inconsistente. | Resuelve las consultas 5 a 9 combinando `WHERE` previo, `GROUP BY`, `HAVING`, `CASE WHEN`, `FILTER` y `DATE_TRUNC` con intervalos semiabiertos. | Escribe agregaciones limpias en una sola pasada con `FILTER`, redondea importes a 2 decimales y usa intervalos semiabiertos `[inicio, fin)` sobre fechas y timestamps. |
| **4. Precisión en conteos y verificación en DuckDB (`COUNT(*)`, `COUNT(col)`, `COUNT(DISTINCT)`)** | Confunde `COUNT(*)` con `COUNT(DISTINCT customer_id)` o entrega consultas con errores de sintaxis en DuckDB. | Las 10 consultas ejecutan en DuckDB, pero al menos una confunde conteo de filas con conteo de valores no nulos o únicos. | Las 10 consultas ejecutan sin error en DuckDB y la consulta 10 distingue correctamente `COUNT(*)`, `COUNT(campaign_id)` y `COUNT(DISTINCT customer_id)`. | Las 10 consultas ejecutan en DuckDB, incluyen comentarios con el número de filas verificado y reconcilian la suma de pedidos (`18.000` totales, `14.760` completados). |
