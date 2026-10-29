# Investigación y diseño curricular · Módulo `c1-sql-joins` ("Combinar tablas")

> **Módulo:** `c1-sql-joins` — Combinar tablas  
> **Área:** `core` (Tronco común) · **Nivel:** `1` (Fundamentos)  
> **Duración estimada:** `110 minutos` (`[25, 25, 20, 20, 20]`)  
> **Prerrequisito de módulo:** `c1-sql-base` ("SQL desde cero")  
> **Fecha de verificación de fuentes y consultas:** `2026-10-29`

---

## 1. Investigación de fuentes por lección (Paso 1)

Cada una de las 5 lecciones del módulo cuenta con 3 fuentes verificadas con código de respuesta HTTP 200 el `2026-10-29`, incluyendo documentación primaria oficial de **DuckDB**, **PostgreSQL 17**, **Kimball Group** y **dbt Labs**.

### Lección 1 · `c1-sql-joins-01-tipos-join` — Tipos de JOIN: INNER, LEFT, FULL, SEMI y ANTI JOIN

| # | Título de la fuente | Editorial / Autor | URL verificada | Tipo | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|---|
| 1 | DuckDB SQL Reference — `FROM` and `JOIN` Clause (`INNER`, `LEFT`, `FULL`, `SEMI`, `ANTI`) | DuckDB Foundation | https://duckdb.org/docs/sql/query_syntax/from.html | Primaria | `2026-10-29` | Sintaxis nativa de `SEMI JOIN` y `ANTI JOIN` en DuckDB, cláusula `USING`, y garantía de que `SEMI JOIN` devuelve cada fila de la tabla izquierda a lo sumo una vez sin duplicarla cuando hay múltiples coincidencias en la derecha. |
| 2 | PostgreSQL 17 Documentation — Section 7.2: Table Expressions and `JOIN` Clauses | PostgreSQL Global Development Group | https://www.postgresql.org/docs/current/queries-table-expressions.html | Primaria | `2026-10-29` | Orden de evaluación entre el predicado `ON` (aplicado durante la unión antes de rellenar nulos en `LEFT`/`RIGHT`/`FULL OUTER JOIN`) y el filtro `WHERE` (aplicado después del cruce, descartando las filas extendidas con `NULL`). |
| 3 | PostgreSQL 17 Documentation — Section 9.24: Subquery Expressions (`EXISTS`, `NOT EXISTS`) | PostgreSQL Global Development Group | https://www.postgresql.org/docs/current/functions-subquery.html | Primaria | `2026-10-29` | Equivalencia lógica entre `SEMI JOIN` / `ANTI JOIN` y predicados `EXISTS` / `NOT EXISTS` con cortocircuito en la primera fila coincidente. |

### Lección 2 · `c1-sql-joins-02-grano-fanout` — Grano de una tabla y fan-out en JOINs (migrada de `l1-joins-fanout`)

| # | Título de la fuente | Editorial / Autor | URL verificada | Tipo | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|---|
| 1 | The Data Warehouse Toolkit (3rd Ed.), Ch. 2: Dimensional Modeling Techniques — Declare the Grain | Kimball Group (Ralph Kimball & Margy Ross) | https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/grain/ | Primaria | `2026-10-29` | Declaración explícita del grano físico de cada tabla antes de combinar entidades o definir sumas y promedios. |
| 2 | PostgreSQL 17 Documentation — Section 7.2: Table Expressions and `JOIN` Clauses | PostgreSQL Global Development Group | https://www.postgresql.org/docs/current/queries-table-expressions.html | Primaria | `2026-10-29` | Semántica relacional de uniones `1:N` y `N:1:M` (trampa de abismo o *chasm trap*), donde cada fila de la tabla padre se repite por cada combinación de filas hijas. |
| 3 | DuckDB SQL Reference — Common Table Expressions (`WITH` Clause) | DuckDB Foundation | https://duckdb.org/docs/sql/query_syntax/with.html | Primaria | `2026-10-29` | Agrupación previa de tablas de detalle en CTEs al grano de la entidad maestra antes de ejecutar el `LEFT JOIN` final. |
| 4 | dbt Semantic Layer (MetricFlow) Documentation — Entities and Symmetric Aggregations | dbt Labs | https://docs.getdbt.com/docs/use-dbt-semantic-layer/dbt-sl | Primaria | `2026-10-29` | Uso de entidades primarias y foráneas en capas semánticas para generar subconsultas pre-agregadas que impiden la inflación de métricas por fan-out. |

### Lección 3 · `c1-sql-joins-03-subconsultas` — Subconsultas escalares, de tabla y correlacionadas

| # | Título de la fuente | Editorial / Autor | URL verificada | Tipo | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|---|
| 1 | DuckDB SQL Reference — Subqueries (Scalar, `EXISTS`, `IN` and Automatic Decorrelation) | DuckDB Foundation | https://duckdb.org/docs/sql/expressions/subqueries.html | Primaria | `2026-10-29` | Clasificación en subconsultas escalares, de conjunto (`IN`/`ANY`/`ALL`), de existencia (`EXISTS`) y descorrelación automática en el optimizador de DuckDB. |
| 2 | PostgreSQL 17 Documentation — Section 9.24: Subquery Expressions (`IN`, `NOT IN`, `EXISTS`) | PostgreSQL Global Development Group | https://www.postgresql.org/docs/current/functions-subquery.html | Primaria | `2026-10-29` | Comportamiento de `NOT IN` bajo lógica de tres valores: si la subconsulta devuelve al menos un `NULL` y no hay coincidencia previa, `valor NOT IN (...)` evalúa a `UNKNOWN` y filtra todas las filas, mientras que `NOT EXISTS` devuelve `TRUE` o `FALSE` sin caer en esa trampa. |
| 3 | PostgreSQL 17 Documentation — Section 4.2.11: Scalar Subqueries | PostgreSQL Global Development Group | https://www.postgresql.org/docs/current/sql-expressions.html#SQL-SYNTAX-SCALAR-SUBQUERIES | Primaria | `2026-10-29` | Regla de ejecución de subconsultas escalares: deben devolver como máximo una columna y una fila (devolviendo `NULL` si el resultado es vacío, o error en tiempo de ejecución si devuelve más de una fila). |

### Lección 4 · `c1-sql-joins-04-ctes-legibles` — CTEs (WITH) legibles: dividir una consulta en pasos

| # | Título de la fuente | Editorial / Autor | URL verificada | Tipo | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|---|
| 1 | DuckDB SQL Reference — Common Table Expressions (`WITH` Clause and `MATERIALIZED`) | DuckDB Foundation | https://duckdb.org/docs/sql/query_syntax/with.html | Primaria | `2026-10-29` | Sintaxis de múltiples CTEs encadenadas en una única cláusula `WITH`, heurística del optimizador para decidir materialización y controles explícitos `AS MATERIALIZED` / `AS NOT MATERIALIZED`. |
| 2 | PostgreSQL 17 Documentation — Section 7.8: `WITH` Queries (Common Table Expressions) | PostgreSQL Global Development Group | https://www.postgresql.org/docs/current/queries-with.html | Primaria | `2026-10-29` | Regla de fusión (*inlining*) por defecto cuando una CTE no recursiva se referencia una sola vez (permitiendo empujar filtros del `WHERE` exterior) y materialización automática cuando se referencia más de una vez. |
| 3 | dbt Labs Best Practices — How We Style Our SQL (CTE Structure) | dbt Labs | https://docs.getdbt.com/best-practices/how-we-style/2-how-we-style-our-sql | Referencia | `2026-10-29` | Estructura de consultas SQL mantenibles en tres bloques secuenciales: CTEs de entrada y filtrado inicial, CTEs de transformación y agregación con nombres descriptivos, y `SELECT` final corto de ensamblaje. |

### Lección 5 · `c1-sql-joins-05-conjuntos-union` — Operaciones de conjuntos: UNION, UNION ALL, INTERSECT

| # | Título de la fuente | Editorial / Autor | URL verificada | Tipo | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|---|
| 1 | DuckDB SQL Reference — Set Operations (`UNION`, `UNION ALL`, `UNION BY NAME`, `INTERSECT`, `EXCEPT`) | DuckDB Foundation | https://duckdb.org/docs/sql/query_syntax/setops.html | Primaria | `2026-10-29` | Sintaxis y semántica de `UNION`, `UNION ALL`, `INTERSECT` y `EXCEPT` en DuckDB, incluyendo `UNION ALL BY NAME` para emparejar columnas por nombre en lugar de posición. |
| 2 | PostgreSQL 17 Documentation — Section 7.4: Combining Queries (`UNION`, `INTERSECT`, `EXCEPT`) | PostgreSQL Global Development Group | https://www.postgresql.org/docs/current/queries-union.html | Primaria | `2026-10-29` | Requisitos de compatibilidad de número y tipos de columna, precedencia de `INTERSECT` sobre `UNION`/`EXCEPT`, y ubicación de `ORDER BY` / `LIMIT` al final de la operación compuesta. |
| 3 | PostgreSQL 17 Documentation — `SELECT` Reference (Set Operations and `NULL` Duplicate Elimination) | PostgreSQL Global Development Group | https://www.postgresql.org/docs/current/sql-select.html | Primaria | `2026-10-29` | Regla del estándar SQL para deduplicación en conjuntos: a diferencia de un `JOIN` con `=`, los operadores `UNION`, `INTERSECT` y `EXCEPT` consideran dos valores `NULL` como iguales (semántica `IS NOT DISTINCT FROM`). |

---

## 2. Mapa de conceptos y progresión del módulo (Paso 2)

### Qué asume el módulo (`c1-sql-joins`) de los módulos previos
- De **`c0-datos`**: qué es una tabla, qué significa una fila (introducción al concepto de grano), qué representa `NULL` y qué es una clave primaria.
- De **`c1-sql-base`**: evaluación lógica de una consulta sobre una sola tabla (`FROM` → `WHERE` → `GROUP BY` → `HAVING` → `SELECT` → `ORDER BY` → `LIMIT`), lógica trivalente de `NULL` (`IS NULL`, `COALESCE`), expresiones `CASE WHEN` y diferencia entre `COUNT(*)`, `COUNT(col)` y `COUNT(DISTINCT col)`.
- **Verificación de brechas:** ninguna de las 5 lecciones utiliza funciones de ventana (`OVER`, `PARTITION BY`, `QUALIFY`) ni `ASOF JOIN`, ya que esos conceptos pertenecen al módulo posterior `c2-sql-analitico` (Nivel 2).

### Secuencia pedagógica de las 5 lecciones

| Orden | ID de lección | Título | Min | Concepto nuevo que introduce | Concepto previo que asume | Error típico que corrige | Tablas de Mercado Brisa usadas |
|---:|---|---|---:|---|---|---|---|---|
| 1 | `c1-sql-joins-01-tipos-join` | Tipos de JOIN: INNER, LEFT, FULL, SEMI y ANTI JOIN | 25 | Eje horizontal de combinación por clave: `INNER JOIN`, `LEFT JOIN`, `FULL OUTER JOIN`, `SEMI JOIN` (`EXISTS`) y `ANTI JOIN` (`NOT EXISTS`). | `SELECT`, `WHERE`, `GROUP BY`, `NULL` y `COUNT(col)` vs `COUNT(*)` (`c1-sql-base`). | Filtrar una columna de la tabla derecha en el `WHERE` tras un `LEFT JOIN` (convirtiéndolo en `INNER JOIN`) o usar `INNER JOIN` para comprobar existencia cuando la tabla derecha tiene varias filas por clave. | `customers`, `orders`, `refunds`, `products`, `order_items`, `experiment_assignments` |
| 2 | `c1-sql-joins-02-grano-fanout` | Grano de una tabla y fan-out en JOINs | 25 | Invariante de cardinalidad, multiplicación silenciosa en relaciones `1:N` (**fan-out**) y `N:1:M` (**trampa de abismo** o *chasm trap*), y pre-agregación al mismo grano. | `INNER JOIN` y `LEFT JOIN` (`c1-sql-joins-01`), `GROUP BY` y `COUNT(DISTINCT)` (`c1-sql-base`). | Unir una tabla maestra (`orders`, 18 000 filas) con una de detalle (`order_items`, 42 000 filas) y ejecutar `SUM(o.total_usd)`, inflando los ingresos de `$7,669,817.77` a `$21,826,463.74`. | `orders`, `order_items`, `refunds`, `payments` |
| 3 | `c1-sql-joins-03-subconsultas` | Subconsultas escalares, de tabla y correlacionadas | 20 | Subconsulta escalar en `SELECT`/`WHERE`/`HAVING`, tabla derivada en `FROM` (doble agregación) y subconsulta correlacionada con `EXISTS` / `NOT EXISTS`. | Tipos de `JOIN` y `SEMI`/`ANTI JOIN` (`c1-sql-joins-01`), grano (`c1-sql-joins-02`), lógica trivalente de `NULL` (`c1-sql-base`). | Usar `WHERE col NOT IN (SELECT ...)` cuando la subconsulta puede devolver `NULL` (en `events.customer_id` o `events.product_id`), lo que hace que toda la consulta devuelva `0` filas. | `customers`, `orders`, `products`, `events` |
| 4 | `c1-sql-joins-04-ctes-legibles` | CTEs (WITH) legibles: dividir una consulta en pasos | 20 | Cláusula `WITH` con múltiples CTEs encadenadas, patrón en tres capas (limpieza → agregación por grano → ensamblaje), depuración por paso y `MATERIALIZED` vs `NOT MATERIALIZED`. | Subconsultas de tabla (`c1-sql-joins-03`) y pre-agregación contra fan-out (`c1-sql-joins-02`). | Anidar 3 niveles de subconsultas imposibles de auditar o unir `payments` sin una CTE previa que filtre intentos fallidos (`status = 'failed'`) y deduplique webhooks repetidos (`idempotency_key`). | `orders`, `payments`, `refunds`, `stores` |
| 5 | `c1-sql-joins-05-conjuntos-union` | Operaciones de conjuntos: UNION, UNION ALL, INTERSECT | 20 | Eje vertical de combinación de filas: `UNION ALL` frente a `UNION`, `UNION ALL BY NAME`, `INTERSECT` y `EXCEPT`, y comparación de `NULL` como valores iguales en conjuntos. | CTEs modulares (`c1-sql-joins-04`) y tipos de `JOIN` (`c1-sql-joins-01`). | Usar `UNION` en lugar de `UNION ALL` al consolidar movimientos financieros sin clave única visible, borrando 20 pedidos legítimos de `orders` que coinciden en fecha e importe (`$4,903.43` perdidos). | `orders`, `payments`, `refunds`, `customers` |

---

## 3. Especificación y rúbrica del proyecto del módulo (Paso 6)

### Registro actual en `src/data/catalog/modules.js`
- **Enunciado (`prompt`):** Consolidar ingresos brutos, unidades vendidas, pagos y reembolsos por cliente sin provocar fan-out.
- **Dataset (`dataset`):** Mercado Brisa (`customers`, `orders`, `order_items`, `payments` y `refunds`).
- **Entregable (`deliverable`):** Consulta SQL modular con CTEs pre-agregadas y prueba de reconciliación exacta contra la suma de `orders`.

### Rúbrica verificable de 4 criterios (para `CapstoneProjectsView.jsx` / `modules.js`)

| # | Criterio | Qué se comprueba en el SQL entregable | Umbral de aprobación exacto sobre Mercado Brisa |
|---:|---|---|---|
| 1 | **Aislamiento de grano en CTEs** | Cada tabla hija (`order_items`, `payments`, `refunds`) se agrupa a nivel de `order_id` en su propia CTE antes de unirse con `orders`. | La tabla consolidada de pedidos tiene exactamente `18 000` filas (`COUNT(*) = COUNT(DISTINCT order_id)`). |
| 2 | **Limpieza de pagos antes de agregar** | La CTE de `payments` filtra `status = 'captured'` y elimina los 450 duplicados de webhook agrupando primero por `idempotency_key`. | El total de cobros capturados suma exactamente `$6,874,488.00` USD sobre `16 200` claves de idempotencia únicas (no los `$7,043,162.63` sin deduplicar). |
| 3 | **Preservación de clientes y pedidos con `LEFT JOIN`** | El cruce desde `customers` y desde `orders` usa `LEFT JOIN` y envuelve las métricas opcionales con `COALESCE(..., 0)`. | El resultado por cliente contiene los `2 400` clientes de `customers` sin valores `NULL` en unidades, pagos ni reembolsos. |
| 4 | **Prueba de reconciliación financiera** | La consulta de auditoría final compara `SUM(ingresos_brutos_usd)` del resumen por cliente contra `(SELECT SUM(total_usd) FROM orders)`. | Diferencia absoluta igual a `0.0000`: ambos lados suman `$7,669,817.77` USD, `86 912` unidades vendidas y `$321,097.25` USD en reembolsos. |

### Consulta SQL de referencia verificada en DuckDB sobre Mercado Brisa

```sql
WITH items_por_pedido AS (
  SELECT order_id, SUM(qty) AS unidades_pedido
  FROM order_items
  GROUP BY order_id
),
pagos_unicos AS (
  SELECT order_id, idempotency_key, MIN(amount_usd) AS amount_usd
  FROM payments
  WHERE status = 'captured'
  GROUP BY order_id, idempotency_key
),
pagos_por_pedido AS (
  SELECT order_id, SUM(amount_usd) AS pagado_usd
  FROM pagos_unicos
  GROUP BY order_id
),
reembolsos_por_pedido AS (
  SELECT order_id, SUM(refund_amount_usd) AS reembolsado_usd
  FROM refunds
  GROUP BY order_id
),
pedidos_consolidados AS (
  SELECT
    o.order_id,
    o.customer_id,
    o.total_usd AS ingreso_bruto_usd,
    COALESCE(i.unidades_pedido, 0) AS unidades_vendidas,
    COALESCE(p.pagado_usd, 0) AS monto_pagado_usd,
    COALESCE(r.reembolsado_usd, 0) AS monto_reembolsado_usd
  FROM orders o
  LEFT JOIN items_por_pedido i ON o.order_id = i.order_id
  LEFT JOIN pagos_por_pedido p ON o.order_id = p.order_id
  LEFT JOIN reembolsos_por_pedido r ON o.order_id = r.order_id
),
resumen_clientes AS (
  SELECT
    c.customer_id,
    c.segment,
    COUNT(pc.order_id) AS total_pedidos,
    ROUND(SUM(pc.ingreso_bruto_usd), 2) AS ingresos_brutos_usd,
    SUM(pc.unidades_vendidas) AS unidades_vendidas,
    ROUND(SUM(pc.monto_pagado_usd), 2) AS pagos_capturados_usd,
    ROUND(SUM(pc.monto_reembolsado_usd), 2) AS reembolsos_usd
  FROM customers c
  LEFT JOIN pedidos_consolidados pc ON c.customer_id = pc.customer_id
  GROUP BY c.customer_id, c.segment
)
SELECT
  COUNT(*) AS clientes_auditados,
  SUM(total_pedidos) AS suma_pedidos,
  ROUND(SUM(ingresos_brutos_usd), 2) AS suma_ingresos_clientes_usd,
  ROUND((SELECT SUM(total_usd) FROM orders), 2) AS suma_directa_orders_usd,
  ROUND(ABS(SUM(ingresos_brutos_usd) - (SELECT SUM(total_usd) FROM orders)), 4) AS diferencia_reconciliacion_usd,
  SUM(unidades_vendidas) AS total_unidades,
  ROUND(SUM(pagos_capturados_usd), 2) AS total_pagado_usd,
  ROUND(SUM(reembolsos_usd), 2) AS total_reembolsado_usd
FROM resumen_clientes;
```

**Resultado real verificado en DuckDB (`@duckdb/node-api`):**
- `clientes_auditados`: `2400`
- `suma_pedidos`: `18000`
- `suma_ingresos_clientes_usd`: `7669817.77`
- `suma_directa_orders_usd`: `7669817.77`
- `diferencia_reconciliacion_usd`: `0`
- `total_unidades`: `86912`
- `total_pagado_usd`: `6874488`
- `total_reembolsado_usd`: `321097.25`
