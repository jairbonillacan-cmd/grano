# Investigación y diseño curricular · Módulo `c2-sql-analitico` ("SQL analítico")

> **Módulo:** `c2-sql-analitico` — SQL analítico  
> **Área:** `core` (Tronco común) · **Nivel:** `2` (Intermedio)  
> **Duración estimada:** `110 minutos` (`[30, 30, 25, 25]`)  
> **Prerrequisito de módulo:** `c1-sql-joins` ("Combinar tablas")  
> **Fecha de verificación de fuentes y consultas:** `2026-10-29`

---

## 1. Investigación de fuentes por lección (Paso 1)

Cada una de las 4 lecciones del módulo cuenta con 3 o 4 fuentes verificadas con código de respuesta `HTTP 200` el `2026-10-29`, incluyendo documentación primaria oficial de **DuckDB**, **PostgreSQL 17**, **Snowflake** y **dbt Labs (MetricFlow)**.

### Lección 1 · `c2-sql-analitico-01-window-functions` — Funciones de ventana y cláusula QUALIFY (migrada de `l2-window-functions`)

| # | Título de la fuente | Editorial / Autor | URL verificada | Tipo | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|---|
| 1 | DuckDB SQL Reference — Window Functions (`OVER`, `PARTITION BY`, `ORDER BY`, `WINDOW`) | DuckDB Foundation | https://duckdb.org/docs/sql/functions/window_functions.html | Primaria | `2026-10-29` | Evaluación de funciones de ventana después de `GROUP BY` y `HAVING` conservando el grano de cada fila, funciones de ranking (`ROW_NUMBER`, `RANK`, `DENSE_RANK`), desplazamiento (`LAG`, `LEAD`) y reutilización de ventanas nombradas con `WINDOW w AS (...)`. |
| 2 | DuckDB SQL Reference — `QUALIFY` Clause | DuckDB Foundation | https://duckdb.org/docs/sql/query_syntax/qualify.html | Primaria | `2026-10-29` | Filtrado directo de expresiones de ventana en el orden lógico posterior a `WINDOW` sin requerir envolver la consulta en una CTE o subconsulta adicional. |
| 3 | PostgreSQL 17 Documentation — Section 3.5: Window Functions | PostgreSQL Global Development Group | https://www.postgresql.org/docs/current/tutorial-window.html | Primaria | `2026-10-29` | Comportamiento de `PARTITION BY` y `ORDER BY` dentro de `OVER (...)` frente al colapso de filas de `GROUP BY`. |
| 4 | PostgreSQL 17 Documentation — Section 4.2.8: Window Function Calls (Frame Clause) | PostgreSQL Global Development Group | https://www.postgresql.org/docs/current/sql-expressions.html#SYNTAX-WINDOW-FUNCTIONS | Primaria | `2026-10-29` | Definición formal de marcos `ROWS`, `RANGE` y `GROUPS` en el estándar SQL, y regla por la que incluir `ORDER BY` aplica por defecto `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`. |

### Lección 2 · `c2-sql-analitico-02-asof-lateral-ctes` — Cruces temporales con ASOF JOIN y CTEs modulares (migrada de `l3-asof-lateral-ctes`)

| # | Título de la fuente | Editorial / Autor | URL verificada | Tipo | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|---|
| 1 | DuckDB SQL Reference — `ASOF` Join | DuckDB Foundation | https://duckdb.org/docs/sql/query_syntax/from.html#asof-join | Primaria | `2026-10-29` | Sintaxis `ASOF JOIN` y `ASOF LEFT JOIN` con condición de desigualdad temporal (`>=` o `>`), garantizando como máximo una fila emparejada por cada fila de la tabla izquierda sin provocar fan-out. |
| 2 | PostgreSQL 17 Documentation — Section 7.2.1.5: `LATERAL` Subqueries | PostgreSQL Global Development Group | https://www.postgresql.org/docs/current/queries-table-expressions.html#QUERIES-LATERAL | Primaria | `2026-10-29` | Uso de `LEFT JOIN LATERAL (SELECT ... WHERE ... ORDER BY ... DESC LIMIT N) ON TRUE` para evaluar subconsultas correlacionadas por fila y recuperar los N eventos previos en motores sin `ASOF JOIN` nativo. |
| 3 | Snowflake SQL Reference — `ASOF JOIN` | Snowflake Inc. | https://docs.snowflake.com/en/sql-reference/constructs/asof-join | Primaria | `2026-10-29` | Semántica de exactitud punto en el tiempo (*point-in-time correctness*) para emparejar series temporales de distinta frecuencia evitando fugas de datos futuros (*data leakage*). |
| 4 | dbt Labs Best Practices — How We Style Our SQL (CTE Layers) | dbt Labs | https://docs.getdbt.com/best-practices/how-we-style/2-how-we-style-our-sql | Referencia | `2026-10-29` | Organización de consultas analíticas complejas en capas secuenciales de CTEs: importación acotada, limpieza/deduplicación, lógica de negocio temporal y proyección final. |

### Lección 3 · `c2-sql-analitico-03-zonas-horarias-date-spine` — Zonas horarias y espinas de calendario (Date Spine)

| # | Título de la fuente | Editorial / Autor | URL verificada | Tipo | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|---|
| 1 | DuckDB SQL Reference — Timestamp Data Types (`TIMESTAMP` vs `TIMESTAMPTZ` and `AT TIME ZONE`) | DuckDB Foundation | https://duckdb.org/docs/sql/data_types/timestamp.html | Primaria | `2026-10-29` | Diferencia entre `TIMESTAMP` (marca temporal sin zona) y `TIMESTAMPTZ` (`TIMESTAMP WITH TIME ZONE`, almacenado internamente en UTC en microsegundos) y conversión de huso horario mediante `AT TIME ZONE` con la extensión ICU. |
| 2 | PostgreSQL 17 Documentation — Section 8.5.3: Time Zones and `AT TIME ZONE` | PostgreSQL Global Development Group | https://www.postgresql.org/docs/current/datatype-datetime.html#DATATYPE-TIMEZONES | Primaria | `2026-10-29` | Regla de conversión de `AT TIME ZONE` en SQL estándar y uso de nombres de zona IANA (`America/Mexico_City`, `Europe/Madrid`) frente a desplazamientos fijos para respetar cambios de horario de verano (DST). |
| 3 | dbt Semantic Layer (MetricFlow) Documentation — Time Spine | dbt Labs | https://docs.getdbt.com/docs/build/metricflow-time-spine | Primaria | `2026-10-29` | Necesidad de una tabla continua de fechas (*Date Spine* / *Time Spine*) sin huecos para materializar días con valor cero antes de calcular promedios diarios, acumulados o medias móviles. |
| 4 | DuckDB SQL Reference — Date Functions and `generate_series` | DuckDB Foundation | https://duckdb.org/docs/sql/functions/date.html | Primaria | `2026-10-29` | Generación de secuencias de fechas con `GENERATE_SERIES` y truncado temporal con `DATE_TRUNC` sobre fechas y marcas de tiempo. |

### Lección 4 · `c2-sql-analitico-04-explain-analyze` — Leer planes con EXPLAIN ANALYZE: escaneos, filtros y uniones

| # | Título de la fuente | Editorial / Autor | URL verificada | Tipo | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|---|
| 1 | DuckDB Documentation — `EXPLAIN` and `EXPLAIN ANALYZE` Statements | DuckDB Foundation | https://duckdb.org/docs/guides/meta/explain.html | Primaria | `2026-10-29` | Diferencia entre `EXPLAIN` (plan lógico y físico estimado sin ejecutar la consulta) y `EXPLAIN ANALYZE` (ejecución real con conteo exacto de filas y tiempo de CPU por operador). |
| 2 | DuckDB Documentation — Query Profiling and Physical Operators | DuckDB Foundation | https://duckdb.org/docs/dev/profiling.html | Primaria | `2026-10-29` | Lectura de abajo hacia arriba del árbol de operadores físicos en DuckDB (`READ_PARQUET` / `SEQ_SCAN`, `FILTER`, `HASH_JOIN`, `HASH_GROUP_BY`, `WINDOW`, `ORDER_BY`). |
| 3 | DuckDB Performance Guide — How to Tune Workloads (Projection and Filter Pushdown) | DuckDB Foundation | https://duckdb.org/docs/guides/performance/how_to_tune_workloads.html | Primaria | `2026-10-29` | Empuje de proyección (*projection pushdown*) y empuje de filtros (*filter pushdown* y *dynamic join filters*) hacia la lectura de archivos Parquet mediante estadísticas `min`/`max` (*zone maps*). |
| 4 | PostgreSQL 17 Documentation — Section 14.1: Using `EXPLAIN` | PostgreSQL Global Development Group | https://www.postgresql.org/docs/current/using-explain.html | Primaria | `2026-10-29` | Comparación entre cardinalidad estimada y cardinalidad real (`rows`), costo de inicialización frente a costo total, y elección entre `Hash Join`, `Merge Join` y `Nested Loop`. |

---

## 2. Mapa de conceptos y progresión del módulo (Paso 2)

### Qué asume el módulo (`c2-sql-analitico`) de los módulos previos
- De **`c1-sql-base`**: orden lógico de evaluación (`FROM` → `WHERE` → `GROUP BY` → `HAVING` → `SELECT` → `ORDER BY` → `LIMIT`), lógica trivalente de `NULL`, `COALESCE`, `CASE WHEN` y funciones básicas de fecha (`DATE_TRUNC`, `EXTRACT`).
- De **`c1-sql-joins`**: tipos de `JOIN` (`INNER`, `LEFT`, `SEMI`, `ANTI`), concepto de **grano** y prevención del **fan-out** mediante pre-agregación en CTEs (`WITH`), subconsultas correlacionadas y operaciones de conjuntos (`UNION ALL`).
- **Verificación de brechas:** todos los conceptos requeridos están cubiertos en `c0-datos`, `c1-sql-base` y `c1-sql-joins`. Ninguna lección asume conceptos de modelado dimensional (`SCD2`, `Star Schema`), que se introducen en el módulo siguiente `c2-dimensional`.

### Secuencia pedagógica de las 4 lecciones

| Orden | ID de lección | Título | Min | Concepto nuevo que introduce | Concepto previo que asume | Error típico que corrige | Tablas de Mercado Brisa usadas |
|---:|---|---|---:|---|---|---|---|---|
| 1 | `c2-sql-analitico-01-window-functions` | Funciones de ventana y cláusula QUALIFY | 30 | `OVER (PARTITION BY ... ORDER BY ...)`, `ROW_NUMBER`, `RANK`, `DENSE_RANK`, `LAG`, `LEAD`, cláusula `QUALIFY`, marcos `ROWS` frente a `RANGE` y sesgo de partición por `NULL`. | `GROUP BY`, `HAVING`, `ORDER BY` (`c1-sql-base`) y CTEs (`c1-sql-joins-04`). | Usar `ROWS BETWEEN 6 PRECEDING` sobre series con días faltantes creyendo que calcula 7 días calendario, o sumar `payments` sin deduplicar antes los `450` webhooks repetidos con `QUALIFY ROW_NUMBER() = 1`. | `orders`, `payments`, `order_items`, `products`, `events` |
| 2 | `c2-sql-analitico-02-asof-lateral-ctes` | Cruces temporales con ASOF JOIN y CTEs modulares | 30 | Exactitud punto en el tiempo (*point-in-time*), `ASOF JOIN` / `ASOF LEFT JOIN`, `LEFT JOIN LATERAL` con `LIMIT N` y arquitectura de CTEs en 4 capas. | `LEFT JOIN` y fan-out (`c1-sql-joins-01/02`), CTEs (`c1-sql-joins-04`) y `QUALIFY` (`c2-sql-analitico-01`). | Unir pedidos y eventos con una desigualdad abierta (`o.order_ts >= e.event_ts`) que multiplica 5 pedidos en 75 filas e infla `SUM(total_usd)` de `$1,311.59` a `$23,327.99`, o invertir el signo (`<=`) provocando fuga del futuro. | `orders`, `events`, `customer_changes`, `payments` |
| 3 | `c2-sql-analitico-03-zonas-horarias-date-spine` | Zonas horarias y espinas de calendario (Date Spine) | 25 | `TIMESTAMP` frente a `TIMESTAMPTZ`, conversión a hora local antes de truncar con `AT TIME ZONE`, huecos en series temporales y construcción de una espina de calendario (*Date Spine*) con `calendar` + `LEFT JOIN` + `COALESCE`. | `DATE_TRUNC` y `COALESCE` (`c1-sql-base`), `LEFT JOIN` (`c1-sql-joins-01`) y marcos de ventana (`c2-sql-analitico-01`). | Truncar timestamps en UTC sin convertir a la zona local de la tienda (desplazando el `27,58 %` de los eventos de `-06:00` al día siguiente) o promediar ventas diarias sin Date Spine (inflando el promedio de la tienda 14 de `$1,181.75` a `$1,465.38`). | `events`, `orders`, `calendar`, `stores` |
| 4 | `c2-sql-analitico-04-explain-analyze` | Leer planes con EXPLAIN ANALYZE: escaneos, filtros y uniones | 25 | Árbol de ejecución física de abajo hacia arriba, `EXPLAIN` frente a `EXPLAIN ANALYZE`, `READ_PARQUET` con *projection/filter pushdown*, predicados SARGables, `HASH_JOIN` (build/probe), `HASH_GROUP_BY` y costo de `ORDER_BY` en `WINDOW`. | `JOIN`, CTEs (`c1-sql-joins`) y funciones de ventana (`c2-sql-analitico-01`). | Envolver columnas de fecha en funciones de texto dentro del `WHERE` (`strftime(order_date, '%Y-%m') = '2025-01'`), impidiendo el *filter pushdown* en Parquet y escaneando `14 760` filas en lugar de `585`. | `orders`, `order_items`, `products`, `stores` |

---

## 3. Especificación y rúbrica del proyecto del módulo (Paso 6)

### Registro actual en `src/data/catalog/modules.js`
- **Enunciado (`prompt`):** Calcular la media móvil de 7 días calendario, el ranking semanal de productos y la atribución temporal de campañas.
- **Dataset (`dataset`):** Mercado Brisa (`orders`, `order_items`, `events`, `marketing_spend` y `calendar`).
- **Entregable (`deliverable`):** Script SQL con las 3 consultas analíticas y el análisis escrito del plan `EXPLAIN ANALYZE` en DuckDB.

### Rúbrica verificable de 4 criterios (para `CapstoneProjectsView.jsx` / `modules.js`)

| # | Criterio | Qué se comprueba en el SQL entregable | Umbral de aprobación exacto sobre Mercado Brisa |
|---:|---|---|---|
| 1 | **Media móvil de 7 días sobre espina de calendario (`calendar`)** | La serie diaria de enero de 2025 para la tienda `store_id = 14` parte de `calendar` con `LEFT JOIN` sobre `orders` (`status = 'completed'`), rellena días sin ventas con `COALESCE(..., 0)` y calcula la ventana de 7 días. | Devuelve las `31` filas de enero de 2025 (no solo los `25` días con ventas), con promedio diario real de `$1,181.75` USD y media móvil de 7 días en `2025-01-07` igual a `$1,573.66` USD. |
| 2 | **Ranking por categoría con `ROW_NUMBER()` y `QUALIFY`** | Agrega `order_items` + `orders` (`status = 'completed'`) + `products` por `(category, sku)` y filtra el producto líder de cada categoría usando `QUALIFY ROW_NUMBER() OVER (PARTITION BY category ORDER BY ingresos_usd DESC) = 1`. | Devuelve exactamente `5` filas (1 por categoría), encabezadas por `Molinos` (`MB-MOL-162`, `$100,693.74` USD) y `Cafeteras` (`MB-CAF-098`, `$76,973.84` USD). |
| 3 | **Atribución punto en el tiempo con `ASOF LEFT JOIN`** | Atribuye los pedidos completados del Q1 2025 (`order_date >= DATE '2025-01-01' AND order_date < DATE '2025-04-01'`) al último evento previo del cliente (`o.order_ts >= e.event_ts`) sin multiplicar filas. | Conserva exactamente los `1 739` pedidos completados del Q1 2025 y suma `$775,823.98` USD (`ORGANIC_DIRECT`: `617` pedidos / `$386,938.54` USD; `CMP-RETENCION`: `297` pedidos / `$166,355.64` USD). |
| 4 | **Diagnóstico de `EXPLAIN ANALYZE` con empuje de filtros** | Utiliza predicados de rango SARGables (`order_date >= DATE '2025-01-01' AND order_date < DATE '2025-04-01'`) y documenta en el árbol `EXPLAIN ANALYZE` qué filtros empuja `READ_PARQUET` y qué tabla actúa como lado *build* en el `HASH_JOIN`. | El nodo `Table Scan (READ_PARQUET)` sobre `orders` muestra `Filters: order_date >= ... AND status = 'completed'` emitiendo `1 739` filas en lugar de las `18 000` filas totales. |

### Consulta SQL de referencia verificada en DuckDB sobre Mercado Brisa (Atribución + Participación con ventana)

```sql
WITH eventos_clientes AS (
  SELECT
    customer_id,
    event_ts,
    campaign_id
  FROM events
  WHERE customer_id IS NOT NULL
),
pedidos_q1_atribuidos AS (
  SELECT
    o.order_id,
    o.customer_id,
    o.order_date,
    o.total_usd,
    COALESCE(e.campaign_id, 'ORGANIC_DIRECT') AS campaign_atribuida
  FROM orders o
  ASOF LEFT JOIN eventos_clientes e
    ON o.customer_id = e.customer_id
   AND o.order_ts >= e.event_ts
  WHERE o.status = 'completed'
    AND o.order_date >= DATE '2025-01-01'
    AND o.order_date < DATE '2025-04-01'
)
SELECT
  campaign_atribuida,
  COUNT(order_id) AS pedidos_atribuidos,
  ROUND(SUM(total_usd), 2) AS ingresos_atribuidos_usd,
  ROUND(
    100.0 * SUM(total_usd) / SUM(SUM(total_usd)) OVER (),
    2
  ) AS pct_ingresos
FROM pedidos_q1_atribuidos
GROUP BY campaign_atribuida
ORDER BY ingresos_atribuidos_usd DESC;
```

**Resultado real verificado en DuckDB (`@duckdb/node-api`):**
- `ORGANIC_DIRECT`: `617` pedidos · `$386,938.54` USD (`49.87 %`)
- `CMP-RETENCION`: `297` pedidos · `$166,355.64` USD (`21.44 %`)
- `CMP-BARISTA`: `297` pedidos · `$114,350.35` USD (`14.74 %`)
- `CMP-ORIGEN`: `270` pedidos · `$56,549.64` USD (`7.29 %`)
- `CMP-VERANO`: `258` pedidos · `$51,629.81` USD (`6.65 %`)
- **Total reconciliado Q1 2025:** `1 739` pedidos · `$775,823.98` USD (`100.00 %`)
