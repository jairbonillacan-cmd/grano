# Investigación y diseño curricular · Módulo `bi2-dax` ("Lenguaje DAX con rigor")

> **Módulo:** `bi2-dax` — Lenguaje DAX con rigor  
> **Área:** `bi` (Business Intelligence) · **Nivel:** `2` (Intermedio)  
> **Duración estimada:** `145 minutos` (`[25, 30, 25, 25, 20, 20]`)  
> **Prerrequisito de módulo:** `bi2-modelo-semantico` ("Modelo semántico en la herramienta de BI")  
> **Fecha de verificación de fuentes y consultas:** `2026-10-29`

---

## 1. Investigación de fuentes por lección (Paso 1)

Cada una de las 6 lecciones del módulo cuenta con 3 fuentes verificadas con código de respuesta `HTTP 200` el `2026-10-29`, compuestas por documentación oficial de **Microsoft Learn (DAX Reference y Power BI Guidance)** y **SQLBI (DAX Guide)**.

### Lección 1 · `bi2-dax-01-contexto-fila-filtro` — Contexto de fila y contexto de filtro en DAX

| # | Título de la fuente | Editorial / Autor | URL verificada | Tipo | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|---|
| 1 | Data Analysis Expressions (DAX) Overview — Context in DAX Formulas | Microsoft Learn | https://learn.microsoft.com/en-us/dax/dax-overview | Primaria | `2026-10-29` | Distinción entre el contexto de fila (registro actual en una columna calculada o función iteradora) y el contexto de filtro (subconjunto de filas activas impuesto por el reporte y propagado por las relaciones). |
| 2 | RELATED Function (DAX) — Navigating Many-to-One Relationships in Row Context | Microsoft Learn | https://learn.microsoft.com/en-us/dax/related-function-dax | Primaria | `2026-10-29` | Uso de `RELATED` para traer un valor desde el lado uno (`1`) hacia el lado muchos (`N`) de una relación activa cuando existe un contexto de fila activo. |
| 3 | Power BI Guidance — Avoid using calculated columns when measures suffice | Microsoft Learn | https://learn.microsoft.com/en-us/power-bi/guidance/import-modeling-data-reduction | Primaria | `2026-10-29` | Impacto en el diccionario columnar de VertiPaq al materializar columnas calculadas frente a medidas dinámicas evaluadas en tiempo de consulta. |

### Lección 2 · `bi2-dax-02-calculate-transicion-contexto` — CALCULATE, modificadores de filtro y transición de contexto

| # | Título de la fuente | Editorial / Autor | URL verificada | Tipo | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|---|
| 1 | CALCULATE Function (DAX) — Evaluation Order and Context Transition | Microsoft Learn | https://learn.microsoft.com/en-us/dax/calculate-function-dax | Primaria | `2026-10-29` | Orden de ejecución de `CALCULATE`: evalúa los argumentos de filtro en el contexto original, transforma cualquier contexto de fila activo en filtros equivalentes (transición de contexto), aplica modificadores y por último evalúa la expresión. |
| 2 | REMOVEFILTERS Function (DAX) — Clearing Filters in CALCULATE | Microsoft Learn | https://learn.microsoft.com/en-us/dax/removefilters-function-dax | Primaria | `2026-10-29` | Uso semántico de `REMOVEFILTERS` (equivalente a `ALL` como modificador de `CALCULATE`) para limpiar filtros de una columna o tabla completa y construir denominadores de porcentaje sobre el total. |
| 3 | KEEPFILTERS Function (DAX) — Intersecting Filter Contexts | Microsoft Learn | https://learn.microsoft.com/en-us/dax/keepfilters-function-dax | Primaria | `2026-10-29` | Diferencia entre el predicado estándar de `CALCULATE` (que sobrescribe el filtro existente en la misma columna) y `KEEPFILTERS` (que intersecta el filtro externo con el nuevo predicado). |

### Lección 3 · `bi2-dax-03-inteligencia-tiempo` — Inteligencia de tiempo: YTD, YoY y medias móviles en DAX

| # | Título de la fuente | Editorial / Autor | URL verificada | Tipo | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|---|
| 1 | Time Intelligence Functions (DAX) — Contiguous Date Table Requirements | Microsoft Learn | https://learn.microsoft.com/en-us/dax/time-intelligence-functions-dax | Primaria | `2026-10-29` | Requisito obligatorio de contar con una tabla de calendario dedicada con fechas contiguas sin huecos desde el 1 de enero hasta el 31 de diciembre para que las funciones de tiempo desplacen intervalos con exactitud. |
| 2 | TOTALYTD and SAMEPERIODLASTYEAR Functions (DAX) | Microsoft Learn | https://learn.microsoft.com/en-us/dax/sameperiodlastyear-function-dax | Primaria | `2026-10-29` | Cálculo de acumulados anuales (`TOTALYTD` / `DATESYTD`) y desplazamiento de un año hacia atrás (`SAMEPERIODLASTYEAR`) para comparativas interanuales (`YoY`), junto al cuidado necesario en periodos parciales aún no cerrados. |
| 3 | DATESINPERIOD Function (DAX) — Rolling Windows and Moving Averages | Microsoft Learn | https://learn.microsoft.com/en-us/dax/datesinperiod-function-dax | Primaria | `2026-10-29` | Construcción de ventanas móviles de $N$ días o meses mediante `DATESINPERIOD` combinada con `AVERAGEX` sobre la dimensión calendario. |

### Lección 4 · `bi2-dax-04-funciones-iteradoras` — Funciones iteradoras en DAX: SUMX, AVERAGEX y RANKX

| # | Título de la fuente | Editorial / Autor | URL verificada | Tipo | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|---|
| 1 | SUMX Function (DAX) — Row-by-Row Expression Aggregation | Microsoft Learn | https://learn.microsoft.com/en-us/dax/sumx-function-dax | Primaria | `2026-10-29` | Evaluación de expresiones aritméticas fila por fila (`cantidad * costo`) sobre una tabla física o filtrada sin necesidad de persistir una columna calculada en memoria. |
| 2 | AVERAGEX Function (DAX) — Averaging Over Virtual Granularities | Microsoft Learn | https://learn.microsoft.com/en-us/dax/averagex-function-dax | Primaria | `2026-10-29` | Uso de `AVERAGEX(VALUES('calendar'[month]), [Ventas USD])` para calcular el promedio mensual de ventas en lugar del promedio por línea transaccional que devuelve `AVERAGE`. |
| 3 | RANKX Function (DAX) — Ranking Entities, ALLSELECTED and Dense Ties | Microsoft Learn | https://learn.microsoft.com/en-us/dax/rankx-function-dax | Primaria | `2026-10-29` | Sintaxis de `RANKX(ALL(stores[store_code]), [Ventas USD], , DESC, Dense)`, necesidad de remover el filtro del atributo clasificado y transición de contexto obligatoria en el segundo argumento. |

### Lección 5 · `bi2-dax-05-variables-divide-formato` — Variables (VAR / RETURN), DIVIDE y formato limpio en DAX

| # | Título de la fuente | Editorial / Autor | URL verificada | Tipo | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|---|
| 1 | Use variables to improve your DAX formulas (`VAR` / `RETURN`) | Microsoft Learn | https://learn.microsoft.com/en-us/dax/best-practices/dax-variables | Primaria | `2026-10-29` | Las variables `VAR` almacenan un valor escalar o una tabla evaluada una única vez en el contexto donde se declaran, eliminando evaluaciones repetidas de subárboles de consulta y facilitando la depuración paso a paso. |
| 2 | DIVIDE function vs. divide operator (`/`) in DAX | Microsoft Learn | https://learn.microsoft.com/en-us/dax/best-practices/dax-divide-function-operator | Primaria | `2026-10-29` | `DIVIDE(numerador, denominador)` intercepta divisiones entre cero o `BLANK` devolviendo `BLANK()` (o un resultado alternativo) sin requerir un `IF` que evalúe dos veces el denominador. |
| 3 | SQLBI DAX Guide — `VAR`, `DIVIDE` and Measure Formatting Conventions | SQLBI (Marco Russo & Alberto Ferrari) | https://dax.guide/divide/ | Referencia | `2026-10-29` | Regla de citación en DAX: calificar siempre las columnas con su tabla (`'orders'[total_usd]`) y nunca calificar las medidas (`[Ingreso Neto USD]`) para distinguirlas al instante. |

### Lección 6 · `bi2-dax-06-antipatrones-rendimiento-dax` — Antipatrones en DAX que degradan el rendimiento del reporte

| # | Título de la fuente | Editorial / Autor | URL verificada | Tipo | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|---|
| 1 | Power BI Guidance — Avoid using FILTER as a filter argument in CALCULATE | Microsoft Learn | https://learn.microsoft.com/en-us/power-bi/guidance/dax-avoid-avoid-filter-as-filter-argument | Primaria | `2026-10-29` | Pasar `FILTER(orders, ...)` a `CALCULATE` obliga a iterar toda la tabla de hechos y sus columnas expandidas en el Formula Engine, mientras que un predicado booleano de columna se traduce en `FILTER(ALL(orders[col]), ...)` resuelto en el Storage Engine. |
| 2 | Power BI Guidance — Appropriate use of error functions in DAX | Microsoft Learn | https://learn.microsoft.com/en-us/power-bi/guidance/dax-error-functions | Primaria | `2026-10-29` | Envolver expresiones en `IFERROR` o `ISERROR` desactiva optimizaciones vectorizadas del motor de almacenamiento y oculta fallos de calidad de datos que deben prevenirse con `DIVIDE` o validación previa. |
| 3 | SQLBI DAX Guide — `FILTER` vs Column Predicates and Storage Engine Materialization | SQLBI (Marco Russo & Alberto Ferrari) | https://dax.guide/filter/ | Referencia | `2026-10-29` | Costo de iterar tablas de hechos completas con transición de contexto anidada frente a filtrar columnas de baja cardinalidad en tablas de dimensión. |

---

## 2. Mapa de conceptos y progresión del módulo (Paso 2)

### Qué asume el módulo (`bi2-dax`) de los módulos previos
- De **`c1-sql-joins` y `c2-dimensional`**: qué es el grano de una tabla de hechos (`orders` frente a `order_items`), cómo funciona un esquema en estrella y la diferencia entre métricas aditivas (`SUM`), semi-aditivas y no aditivas (`SUM(num)/SUM(den)` y `COUNT(DISTINCT)`).
- De **`bi2-metricas`**: anatomía de una métrica sin ambigüedad (fórmula, grano, filtros canónicos como `status = 'completed'`) y árboles de KPIs.
- De **`bi2-modelo-semantico`**: relaciones `1:N` con propagación de filtro único desde dimensiones (`customers`, `products`, `stores`, `calendar`) hacia hechos (`orders`, `order_items`, `refunds`), tabla de fechas marcada y distinción entre medidas y columnas calculadas en VertiPaq.

### Secuencia pedagógica de las 6 lecciones

| Orden | ID de lección | Título | Min | Concepto nuevo que introduce | Concepto previo que asume | Error típico que corrige | Tablas de Mercado Brisa usadas |
|---:|---|---|---:|---|---|---|---|
| 1 | `bi2-dax-01-contexto-fila-filtro` | Contexto de fila y contexto de filtro en DAX | 25 | Separación entre **contexto de filtro** (subconjunto activo que viaja de `1` a `N`) y **contexto de fila** (iteración registro a registro), y uso de `RELATED`. | Esquema en estrella `1:N` y medidas vs columnas calculadas (`bi2-modelo-semantico`). | Multiplicar dos sumas agregadas (`SUM(qty) * SUM(unit_cost_usd)`) en una medida creyendo que DAX opera fila por fila, inflando el costo de Molinos de `$1.51M` a `$12,790M`. | `orders`, `order_items`, `products`, `customers`, `stores` |
| 2 | `bi2-dax-02-calculate-transicion-contexto` | CALCULATE, modificadores de filtro y transición de contexto | 30 | Función `CALCULATE`, sobrescritura frente a intersección (`KEEPFILTERS`), limpieza de filtros (`REMOVEFILTERS` / `ALL`) y **transición de contexto**. | Contexto de fila y contexto de filtro (`bi2-dax-01`). | Olvidar que una llamada a medida implica `CALCULATE` (y por tanto transición de contexto), o escribir una expresión agregada dentro de `FILTER(customers, SUM(...) >= 5000)` sin `CALCULATE`, evaluando el total global en cada fila. | `orders`, `customers`, `stores` |
| 3 | `bi2-dax-03-inteligencia-tiempo` | Inteligencia de tiempo: YTD, YoY y medias móviles en DAX | 25 | Acumulados anuales (`TOTALYTD` / `DATESYTD`), periodo previo (`SAMEPERIODLASTYEAR`), comparativas a días equivalentes y medias móviles con `DATESINPERIOD`. | Tabla de fechas marcada (`bi2-modelo-semantico-04`) y `CALCULATE` (`bi2-dax-02`). | Comparar el acumulado parcial de 2025 (corte al `2025-11-26`: `$2,686,828.57`) contra todo 2024 completo (`$2,731,516.50`), reportando una caída falsa de `-1.64 %` cuando a días equivalentes (`2024-11-26`: `$2,463,052.33`) las ventas subieron `+9.09 %`. | `orders`, `calendar`, `stores` |
| 4 | `bi2-dax-04-funciones-iteradoras` | Funciones iteradoras en DAX: SUMX, AVERAGEX y RANKX | 25 | Iteradores sobre tablas físicas y virtuales (`SUMX`, `AVERAGEX(VALUES(...))`, `RANKX(ALL(...), [Medida], , DESC, Dense)`). | Contexto de fila (`bi2-dax-01`) y transición de contexto con `ALL` (`bi2-dax-02`). | Usar `AVERAGE(orders[total_usd])` (`$417.93` por pedido en Cono Sur) cuando dirección pide el promedio mensual de ventas (`AVERAGEX(VALUES('calendar'[month]), [Ventas USD])` = `$76,585.53`), o pasar `SUM(orders[total_usd])` sin corchetes de medida en el segundo argumento de `RANKX`, devolviendo rango `1` para todas las tiendas. | `orders`, `stores`, `calendar`, `order_items`, `products` |
| 5 | `bi2-dax-05-variables-divide-formato` | Variables (VAR / RETURN), DIVIDE y formato limpio en DAX | 20 | Bloques `VAR` / `RETURN`, inmutabilidad léxica de las variables, función `DIVIDE` y convención de nombres (`'tabla'[columna]` vs `[Medida]`). | `CALCULATE` (`bi2-dax-02`) e iteradores (`bi2-dax-04`). | Definir `VAR _Ventas = [Ventas USD]` y luego intentar cambiar su contexto con `CALCULATE(_Ventas, REMOVEFILTERS())` (devolviendo siempre `100 %` porque la variable ya es una constante), o repetir la misma medida 4 veces en un `IF`. | `orders`, `refunds`, `order_items`, `products`, `stores`, `customers` |
| 6 | `bi2-dax-06-antipatrones-rendimiento-dax` | Antipatrones en DAX que degradan el rendimiento del reporte | 20 | Arquitectura **Storage Engine (VertiPaq)** vs **Formula Engine**, antipatrón `FILTER(hechos, ...)` frente a predicados de columna, conteos `DISTINCTCOUNT` no aditivos y prohibición de promediar porcentajes. | Todo el módulo (`bi2-dax-01` a `05`) y aditividad (`c2-dimensional-04`). | Pasar la tabla `orders` entera a `FILTER` dentro de `CALCULATE`, sumar los `DISTINCTCOUNT` mensuales para obtener clientes anuales (inflando Cono Sur en 2024 de `724` a `1 918` clientes), o promediar márgenes por SKU en lugar de dividir sumas. | `orders`, `order_items`, `products`, `stores`, `calendar` |

---

## 3. Especificación y rúbrica del proyecto del módulo (Paso 6)

### Registro en `src/data/catalog/modules.js`
- **Enunciado (`prompt`):** Programar el conjunto de medidas financieras y de retención del modelo semántico y conciliarlas contra SQL.
- **Dataset (`dataset`):** Mercado Brisa (`orders`, `order_items`, `refunds`, `customers` y `calendar`).
- **Entregable (`deliverable`):** Archivo con 10 medidas DAX (`Ingreso Neto`, `Margen %`, `YoY %`, `YTD`, `Clientes Activos`, `Ticket Medio`) reconciliadas al céntimo con DuckDB.

### Catálogo de las 10 medidas DAX oficiales del proyecto (con convención `'tabla'[columna]` y `[Medida]`)

```dax
-- 1. Ingreso Bruto USD (pedidos completados)
Ingreso Bruto USD =
CALCULATE (
    SUM ( 'orders'[total_usd] ),
    'orders'[status] = "completed"
)

-- 2. Reembolsos Procesados USD (sobre pedidos completados)
Reembolsos Procesados USD =
CALCULATE (
    SUM ( 'refunds'[refund_amount_usd] ),
    'refunds'[status] = "processed",
    'orders'[status] = "completed"
)

-- 3. Ingreso Neto USD
Ingreso Neto USD =
VAR _Bruto = [Ingreso Bruto USD]
VAR _Reembolsos = COALESCE ( [Reembolsos Procesados USD], 0 )
RETURN
    _Bruto - _Reembolsos

-- 4. Costo Directo USD (iteración fila a fila sobre líneas de pedidos completados)
Costo Directo USD =
CALCULATE (
    SUMX (
        'order_items',
        'order_items'[qty] * RELATED ( 'products'[unit_cost_usd] )
    ),
    'orders'[status] = "completed"
)

-- 5. Margen Neto USD
Margen Neto USD =
[Ingreso Neto USD] - [Costo Directo USD]

-- 6. Margen Neto % (no aditivo: cociente seguro de medidas aditivas)
Margen Neto % =
DIVIDE ( [Margen Neto USD], [Ingreso Neto USD] )

-- 7. Clientes Activos (conteo único no aditivo)
Clientes Activos =
CALCULATE (
    DISTINCTCOUNT ( 'orders'[customer_id] ),
    'orders'[status] = "completed"
)

-- 8. Ticket Medio Neto USD
Ticket Medio Neto USD =
VAR _Pedidos =
    CALCULATE ( COUNTROWS ( 'orders' ), 'orders'[status] = "completed" )
RETURN
    DIVIDE ( [Ingreso Neto USD], _Pedidos )

-- 9. Ingreso Neto YTD USD (acumulado anual sobre tabla calendar marcada)
Ingreso Neto YTD USD =
TOTALYTD ( [Ingreso Neto USD], 'calendar'[calendar_date] )

-- 10. Crecimiento YoY Neto % (comparativa interanual con variables y DIVIDE)
Crecimiento YoY Neto % =
VAR _Actual = [Ingreso Neto USD]
VAR _Anterior =
    CALCULATE ( [Ingreso Neto USD], SAMEPERIODLASTYEAR ( 'calendar'[calendar_date] ) )
RETURN
    DIVIDE ( _Actual - _Anterior, _Anterior )
```

### Rúbrica verificable de 4 criterios

| # | Criterio | Qué se comprueba en las medidas DAX y en el SQL de reconciliación | Valor exacto de auditoría en 2024 sobre Mercado Brisa |
|---:|---|---|---|
| 1 | **Filtros de columna en `CALCULATE` sin `FILTER(tabla)`** | Las medidas base (`[Ingreso Bruto USD]`, `[Reembolsos Procesados USD]`, `[Clientes Activos]`) aplican predicados de columna directos (`'orders'[status] = "completed"`). | En el año 2024: `Ingreso Bruto USD = $2,731,516.50`, `Reembolsos Procesados USD = $116,562.26` y `Ingreso Neto USD = $2,614,954.24`. |
| 2 | **Iteración fila a fila en `SUMX` con `RELATED`** | `[Costo Directo USD]` multiplica `'order_items'[qty] * RELATED('products'[unit_cost_usd])` dentro de `SUMX` sin crear columnas calculadas. | En el año 2024: `Costo Directo USD = $1,239,914.08` y `Margen Neto USD = $1,375,040.16`. |
| 3 | **Razones y conteos no aditivos con `VAR` y `DIVIDE`** | `[Margen Neto %]`, `[Ticket Medio Neto USD]` y `[Crecimiento YoY Neto %]` usan variables `VAR` / `RETURN` y `DIVIDE`, y `[Clientes Activos]` usa `DISTINCTCOUNT`. | En 2024: `Margen Neto % = 52.58 %`, `Clientes Activos = 2 164` y `Ticket Medio Neto USD = $402.49`. |
| 4 | **Inteligencia de tiempo y reconciliación al céntimo en DuckDB** | Al cierre del T4 de 2024, `[Ingreso Neto YTD USD]` iguala el total anual de 2024 y `[Crecimiento YoY Neto %]` compara contra 2023 (`$813,811.87`). | Diferencia entre las medidas DAX y la consulta SQL en DuckDB igual a `$0.00`: `Crecimiento YoY Neto % (2024 vs 2023) = +221.32 %`. |

### Consulta SQL de reconciliación verificada en DuckDB (`@duckdb/node-api`)

```sql
WITH reembolsos_pedido AS (
  SELECT order_id, SUM(refund_amount_usd) AS reembolsado_usd
  FROM refunds
  WHERE status = 'processed'
  GROUP BY order_id
),
costos_pedido AS (
  SELECT oi.order_id, SUM(oi.qty * p.unit_cost_usd) AS costo_usd
  FROM order_items oi
  INNER JOIN products p ON oi.product_id = p.product_id
  GROUP BY oi.order_id
),
base_anual AS (
  SELECT
    cal.year AS anio,
    COUNT(o.order_id) AS pedidos_completados,
    COUNT(DISTINCT o.customer_id) AS clientes_activos,
    ROUND(SUM(o.total_usd), 2) AS ingreso_bruto_usd,
    ROUND(SUM(COALESCE(r.reembolsado_usd, 0)), 2) AS reembolsos_usd,
    ROUND(SUM(o.total_usd) - SUM(COALESCE(r.reembolsado_usd, 0)), 2) AS ingreso_neto_usd,
    ROUND(SUM(COALESCE(cp.costo_usd, 0)), 2) AS costo_directo_usd
  FROM orders o
  INNER JOIN calendar cal ON o.order_date = cal.calendar_date
  LEFT JOIN reembolsos_pedido r ON o.order_id = r.order_id
  LEFT JOIN costos_pedido cp ON o.order_id = cp.order_id
  WHERE o.status = 'completed' AND cal.year IN (2023, 2024)
  GROUP BY cal.year
)
SELECT
  b24.ingreso_bruto_usd AS m01_ingreso_bruto_2024_usd,
  b24.reembolsos_usd AS m02_reembolsos_2024_usd,
  b24.ingreso_neto_usd AS m03_ingreso_neto_2024_usd,
  b24.costo_directo_usd AS m04_costo_directo_2024_usd,
  ROUND(b24.ingreso_neto_usd - b24.costo_directo_usd, 2) AS m05_margen_neto_2024_usd,
  ROUND(100.0 * (b24.ingreso_neto_usd - b24.costo_directo_usd) / NULLIF(b24.ingreso_neto_usd, 0), 2) AS m06_margen_neto_pct,
  b24.clientes_activos AS m07_clientes_activos_2024,
  ROUND(b24.ingreso_neto_usd / NULLIF(b24.pedidos_completados, 0), 2) AS m08_ticket_medio_neto_usd,
  b23.ingreso_neto_usd AS m09_ingreso_neto_py_2023_usd,
  ROUND(100.0 * (b24.ingreso_neto_usd - b23.ingreso_neto_usd) / NULLIF(b23.ingreso_neto_usd, 0), 2) AS m10_crecimiento_yoy_neto_pct
FROM base_anual b24
CROSS JOIN base_anual b23
WHERE b24.anio = 2024 AND b23.anio = 2023;
```
