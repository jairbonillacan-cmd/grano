# Investigación y diseño curricular · Módulo `bi2-modelo-semantico` (Modelo semántico en la herramienta de BI)

- **Módulo:** `bi2-modelo-semantico` — Modelo semántico en la herramienta de BI
- **Área y nivel:** Business Intelligence (`bi`) · Nivel 2 (Intermedio)
- **Prerrequisitos de módulo:** `bi2-metricas` (y por transitividad `c0-negocio`, `c2-dimensional`, `c1-modelo`, `c1-sql-joins`, `c1-sql-base` y `c0-datos`)
- **Lecciones del módulo:** 5 lecciones (`110` minutos estimados en total: `[25, 25, 20, 20, 20]`)
- **Fecha de consulta de fuentes:** `2026-10-29`

---

## Paso 1 — Investigación de fuentes verificables por lección

Todas las fuentes listadas a continuación fueron verificadas mediante petición HTTP (`200 OK`) el `2026-10-29`. Cada lección cuenta con al menos 3 fuentes reales (`https://...`), de las cuales mínimo 2 son fuentes primarias oficiales de Microsoft Learn (Power BI Guidance, Power BI Transform & Model y DAX Reference) complementadas por Kimball Group y SQLBI.

### Lección 1 · `bi2-modelo-semantico-01-estrella-vertipaq`
**Título en catálogo:** Del almacén de datos al esquema en estrella dentro de Power BI (motor VertiPaq) (`25 min`)
**Título corto (`<= 60` caracteres):** Esquema en estrella en Power BI y motor VertiPaq

| # | Tipo | Título y autor / editorial | URL verificada (`https://`) | Fecha (`accessed`) | Afirmación técnica que respalda en la lección |
|---|---|---|---|---|---|
| 1 | Primaria | Microsoft Learn — *Understand star schema and the importance for Power BI* (`Microsoft Corporation`) | https://learn.microsoft.com/en-us/power-bi/guidance/star-schema | `2026-10-29` | Separación de tablas del modelo semántico en dos roles exclusivos: tablas de dimensión (entidades con clave única para filtrar y agrupar) y tablas de hechos (observaciones numéricas y claves foráneas para resumir). |
| 2 | Primaria | Microsoft Learn — *Data reduction techniques for Import modeling* (`Microsoft Corporation`) | https://learn.microsoft.com/en-us/power-bi/guidance/import-modeling-data-reduction | `2026-10-29` | Arquitectura columnar en memoria del motor VertiPaq (diccionarios por columna, codificación Value/Hash y compresión RLE por segmentos) y por qué eliminar columnas de clave primaria de hechos como `order_item_id` reduce drásticamente la memoria RAM. |
| 3 | Secundaria de referencia | Kimball Group — *Dimensional Modeling Techniques: Star Schemas and OLAP Cubes* (`Ralph Kimball & Margy Ross`) | https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/star-schema-olap-cube/ | `2026-10-29` | Separación de granos entre cabecera (`orders`) y línea de detalle (`order_items`) y prevención de inflación de importes de cabecera (`total_usd`, `shipping_usd`) al evitar tablas anchas desnormalizadas sin control de grano. |

### Lección 2 · `bi2-modelo-semantico-02-relaciones-cardinalidad`
**Título en catálogo:** Relaciones, cardinalidad (1:N) y por qué evitar relaciones muchos a muchos directas (`25 min`)
**Título corto (`<= 60` caracteres):** Relaciones 1:N y por qué evitar muchos a muchos directas

| # | Tipo | Título y autor / editorial | URL verificada (`https://`) | Fecha (`accessed`) | Afirmación técnica que respalda en la lección |
|---|---|---|---|---|---|
| 1 | Primaria | Microsoft Learn — *Create and manage relationships in Power BI Desktop* (`Microsoft Corporation`) | https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-create-and-manage-relationships | `2026-10-29` | Reglas de cardinalidad (`1:N`, `N:1`, `1:1`, `N:M`), validación de unicidad en el lado uno y comportamiento de la fila en blanco (*Blank Row*) cuando una clave foránea en la tabla de hechos no existe en la dimensión. |
| 2 | Primaria | Microsoft Learn — *Many-to-many relationship guidance* (`Microsoft Corporation`) | https://learn.microsoft.com/en-us/power-bi/guidance/relationships-many-to-many | `2026-10-29` | Peligros de las relaciones con cardinalidad muchos a muchos directa (totales que no suman la suma de las filas, omisión de validación de fila en blanco y sobrecarga de consulta) y cuándo preferir una tabla puente (*bridge table*) o pre-agregar al grano `1:1`. |
| 3 | Primaria | Microsoft Learn — *One-to-one relationship guidance* (`Microsoft Corporation`) | https://learn.microsoft.com/en-us/power-bi/guidance/relationships-one-to-one | `2026-10-29` | Recomendación de consolidar en una sola tabla las relaciones `1:1` del mismo grano o pre-agregar tablas de detalle (`refunds`) por `order_id` antes de unirlas con la cabecera `orders`. |
| 4 | Secundaria de referencia | SQLBI — *Different options to model many-to-many relationships in Power BI and Tabular* (`Marco Russo & Alberto Ferrari`) | https://www.sqlbi.com/articles/different-options-to-model-many-to-many-relationships-in-power-bi-and-tabular/ | `2026-10-29` | Comparación técnica de rendimiento y semántica entre tabla puente clásica con dos relaciones `1:N` frente a relaciones débiles (`Many-to-Many` / `Limited relationships`). |

### Lección 3 · `bi2-modelo-semantico-03-direccion-filtro-cruzado`
**Título en catálogo:** Dirección de filtro cruzado: flujo único frente al peligro de los filtros bidireccionales (`20 min`)
**Título corto (`<= 60` caracteres):** Dirección de filtro cruzado: flujo único vs bidireccional

| # | Tipo | Título y autor / editorial | URL verificada (`https://`) | Fecha (`accessed`) | Afirmación técnica que respalda en la lección |
|---|---|---|---|---|---|
| 1 | Primaria | Microsoft Learn — *Bi-directional relationship guidance* (`Microsoft Corporation`) | https://learn.microsoft.com/en-us/power-bi/guidance/relationships-bidirectional-filtering | `2026-10-29` | Flujo único (`Single`) del lado `1` al lado `N` como configuración por defecto, degradación de rendimiento del filtro bidireccional (`Both`) y aparición de rutas ambiguas cuando existen múltiples tablas de hechos. |
| 2 | Primaria | Microsoft Learn — *CROSSFILTER function (DAX)* (`Microsoft Corporation`) | https://learn.microsoft.com/en-us/dax/crossfilter-function | `2026-10-29` | Activación programática y puntual de la dirección de filtro (`Both`, `OneWay`, `None`) dentro de `CALCULATE` para resolver conteos de dimensiones filtradas por hechos sin alterar el modelo global. |
| 3 | Secundaria de referencia | SQLBI — *Bidirectional relationships and ambiguity in DAX* (`Alberto Ferrari & Marco Russo`) | https://www.sqlbi.com/articles/bidirectional-relationships-and-ambiguity-in-dax/ | `2026-10-29` | Demostración de cómo dos caminos de propagación de filtro entre dimensiones compartidas (`customers`, `products`, `stores`) y dos tablas de hechos (`orders`, `refunds`) producen resultados silenciosamente distintos o errores de ambigüedad. |

### Lección 4 · `bi2-modelo-semantico-04-tablas-fechas-userelationship`
**Título en catálogo:** Tablas de fechas marcadas, jerarquías fiscales y relaciones inactivas (USERELATIONSHIP) (`20 min`)
**Título corto (`<= 60` caracteres):** Tablas de fechas marcadas y relaciones USERELATIONSHIP

| # | Tipo | Título y autor / editorial | URL verificada (`https://`) | Fecha (`accessed`) | Afirmación técnica que respalda en la lección |
|---|---|---|---|---|---|
| 1 | Primaria | Microsoft Learn — *Model date tables in Power BI Desktop* (`Microsoft Corporation`) | https://learn.microsoft.com/en-us/power-bi/guidance/model-date-tables | `2026-10-29` | Requisitos obligatorios para marcar una tabla de fechas oficial (`Mark as date table`): columna de tipo `Date`, valores únicos, sin nulos, sin días faltantes y cobertura de años completos de enero a diciembre, además de la recomendación de desactivar `Auto date/time`. |
| 2 | Primaria | Microsoft Learn — *Active vs inactive relationship guidance* (`Microsoft Corporation`) | https://learn.microsoft.com/en-us/power-bi/guidance/relationships-active-inactive | `2026-10-29` | Por qué solo puede existir una relación activa simultánea entre dos tablas (`calendar` y `orders` / `refunds`) y cuándo emplear relaciones inactivas con medidas frente a clonar dimensiones de rol (*role-playing dimensions*). |
| 3 | Primaria | Microsoft Learn — *USERELATIONSHIP function (DAX)* (`Microsoft Corporation`) | https://learn.microsoft.com/en-us/dax/userelationship-function-dax | `2026-10-29` | Sintaxis `USERELATIONSHIP(<column1>, <column2>)` dentro de `CALCULATE` para activar una relación inactiva por fecha de devolución o envío durante la evaluación de una medida. |
| 4 | Secundaria de referencia | Kimball Group — *Dimensional Modeling Techniques: Role-Playing Dimensions* (`Ralph Kimball & Margy Ross`) | https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/role-playing-dimension/ | `2026-10-29` | Concepto de dimensión de rol donde una única dimensión física de calendario representa múltiples hitos temporales del negocio (`order_date`, `refund_date`). |

### Lección 5 · `bi2-modelo-semantico-05-medidas-vs-columnas-calculadas`
**Título en catálogo:** Medidas frente a columnas calculadas: impacto en memoria RAM y tiempo de refresco (`20 min`)
**Título corto (`<= 60` caracteres):** Medidas frente a columnas calculadas en memoria y refresco

| # | Tipo | Título y autor / editorial | URL verificada (`https://`) | Fecha (`accessed`) | Afirmación técnica que respalda en la lección |
|---|---|---|---|---|---|
| 1 | Primaria | Microsoft Learn — *Tutorial: Create your own measures in Power BI Desktop* (`Microsoft Corporation`) | https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-measures | `2026-10-29` | Evaluación dinámica de las medidas en tiempo de consulta según el contexto de filtro activo, consumo nulo de memoria RAM en reposo y necesidad de definir medidas explícitas para razones y porcentajes. |
| 2 | Primaria | Microsoft Learn — *Tutorial: Create calculated columns in Power BI Desktop* (`Microsoft Corporation`) | https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-calculated-columns | `2026-10-29` | Evaluación fila por fila de las columnas calculadas durante el refresco de datos, almacenamiento físico en memoria dentro de la tabla y casos legítimos de uso (como segmentadores o ejes discretos de baja cardinalidad). |
| 3 | Secundaria de referencia | SQLBI — *Calculated Columns and Measures in DAX* (`Marco Russo & Alberto Ferrari`) | https://www.sqlbi.com/articles/calculated-columns-and-measures-in-dax/ | `2026-10-29` | Regla de oro para elegir entre medida y columna calculada: por qué calcular un porcentaje fila a fila y luego promediarlo produce un error matemático frente a dividir sumas (`SUM(numerador) / SUM(denominador)`), y por qué las columnas calculadas DAX comprimen peor en VertiPaq que las columnas creadas en el almacén SQL o Power Query. |

---

## Paso 2 — Mapa de conceptos y progresión pedagógica del módulo

### Qué asume este módulo de los módulos previos
- De **`c1-modelo`**: claves primarias, claves subrogadas, claves foráneas, integridad referencial, detección de huérfanos y duplicados.
- De **`c2-dimensional`**: diferencia entre sistemas transaccionales (OLTP en 3FN) y analíticos (OLAP), diseño de hechos (`fct_`) y dimensiones conformadas (`dim_`) de Kimball, historial SCD tipo 2 (`customer_changes` con `valid_from`, `valid_to`, `is_current`) y métricas no aditivas (por qué los porcentajes no se suman ni promedian directamente).
- De **`bi2-metricas`** (y **`c0-negocio`**): definición formal de un KPI (fórmula, grano, filtro canónico, ventana temporal y umbral), ingreso neto descontando devoluciones (`refunds`) y métricas guardia.

### Progresión de conceptos en las 5 lecciones de `bi2-modelo-semantico`

| Orden | ID de lección | Concepto central que introduce | Qué asume de la anterior | Qué problema real de Mercado Brisa resuelve |
|---|---|---|---|---|
| 1 | `bi2-modelo-semantico-01-estrella-vertipaq` | **Motor VertiPaq** (diccionarios por columna, RLE, segmentos), **poda de columnas de alta cardinalidad** (`order_item_id`) y separación en **tablas de dimensión** y **tablas de hechos** por grano dentro de Power BI. | Esquema en estrella vs OBT (`c2-dimensional`) y definición de grano (`c0-datos`, `c1-sql-joins`). | Demuestra que importar una OBT que une `orders` y `order_items` infla `SUM(total_usd)` en Cono Sur de `2 059 786,39 USD` a `5 728 199,93 USD`, y que quitar `order_item_id` (`42 000` valores únicos) deja solo `product_id` (`179` entradas de diccionario) y `store_id` (`14` entradas). |
| 2 | `bi2-modelo-semantico-02-relaciones-cardinalidad` | **Cardinalidad `1:N`**, **fila en blanco (*Blank Row*)** de VertiPaq ante huérfanos, peligro de las **relaciones `N:M` directas** y resolución con **tabla puente (*bridge table*)** o **pre-agregación `1:1`**. | Separación de dimensiones y hechos en VertiPaq (Lección 1) y SCD2 (`c2-dimensional`). | Audita que `customer_changes` tiene `4 100` filas para `2 400` clientes (`1 700` duplicados de `customer_id`): unirla sin filtrar `is_current = TRUE` infla los pedidos completados de `retail` de `5 940` (`2 436 924,93 USD`) a `13 973` (`5 760 434,75 USD`). También pre-agrega `refunds` (`1 450` filas en `1 150` pedidos) para cruzarla en `1:1` con `orders`. |
| 3 | `bi2-modelo-semantico-03-direccion-filtro-cruzado` | **Dirección de filtro cruzado única (`1 -> N`)** frente a **bidireccional (`Both`)**, **rutas ambiguas** entre múltiples tablas de hechos y activación puntual con **`CROSSFILTER`** dentro de una medida. | Relaciones `1:N` válidas entre dimensiones y hechos (Lección 2). | Muestra cómo un filtro bidireccional permanente entre `products` y `order_items` oculta silenciosamente el producto sin ventas en `Accesorios` (`36` visibles de `37` en catálogo), y cómo contar clientes registrados (`400` por país), con compra completada y con reembolso sin crear bucles ambiguos entre `customers`, `orders` y `refunds`. |
| 4 | `bi2-modelo-semantico-04-tablas-fechas-userelationship` | **Tabla de fechas marcada (*Mark as date table*)**, desactivación de **`Auto date/time`**, **jerarquías fiscales** (`fiscal_quarter`) y **relaciones inactivas** con **`USERELATIONSHIP`** para dimensiones de rol. | Propagación unidireccional de filtros desde dimensiones a hechos (Lección 3). | Audita la tabla `calendar` (`1 095` filas) detectando que al año `2025` le falta el día `2025-12-31` por el bisiesto `2024` (`366` días), y concilia en `2024` por `fiscal_quarter` las ventas por `order_date` (relación activa) frente a los reembolsos por `refund_date` (`USERELATIONSHIP`), revelando una diferencia de `-1 254,46 USD` en `FY24-Q1` y `+462,43 USD` en `FY24-Q4`. |
| 5 | `bi2-modelo-semantico-05-medidas-vs-columnas-calculadas` | **Medidas dinámicas** (evaluadas en consulta bajo contexto de filtro) frente a **columnas calculadas** (evaluadas en refresco y guardadas en RAM), impacto en diccionarios VertiPaq y error matemático de promediar porcentajes por fila. | Almacenamiento columnar en VertiPaq (Lección 1), contexto de filtro por relaciones (Lecciones 2–4) y métricas de razón (`c2-dimensional`, `bi2-metricas`). | Demuestra en `order_items` que una columna calculada continua de margen genera `1 333` valores distintos en el diccionario frente a `3` valores de un tramo discreto de descuento, y comprueba en `stores` que la tasa de descuento como medida (`SUM(discount_usd) / SUM(subtotal_usd)`) en Almacén Logístico Coslada es `0,90 %` frente al `1,23 %` erróneo de promediar la columna fila a fila. |

### Cómo conecta con los módulos siguientes
- Prepara directamente **`bi2-dax`** (Lenguaje DAX con rigor): el alumno ya comprende qué es el lado `1` y el lado `N`, cómo viaja el contexto de filtro por las relaciones activas, por qué existe una tabla `calendar` marcada para las funciones de inteligencia de tiempo (`TOTALYTD`, `SAMEPERIODLASTYEAR`) y por qué los KPIs se escriben como medidas explícitas.
- Prepara **`bi3-gobierno`** y **`bi4-operacion`**: sienta las bases del diseño físico sobre VertiPaq (que también gobierna Direct Lake sobre archivos Parquet) y de las relaciones limpias donde luego se aplican reglas de seguridad a nivel de fila (RLS) y versionado TMDL/PBIP.

---

## Paso 6 — Proyecto del módulo `bi2-modelo-semantico` y rúbrica verificable

### Especificación en `src/data/catalog/modules.js`
- **Enunciado (`prompt`):** Diseñar el modelo semántico en estrella de ventas, reembolsos y calendario sin relaciones ambiguas ni columnas redundantes.
- **Dataset:** Mercado Brisa (`orders`, `order_items`, `products`, `customers`, `stores`, `refunds` y `calendar`).
- **Entregable (`deliverable`):** Diagrama relacional del modelo semántico, especificación de relaciones `1:N` (activas e inactivas), auditoría SQL de unicidad y continuidad de `calendar` y catálogo de medidas base frente a columnas de segmentación.

### Rúbrica verificable de evaluación del proyecto (4 criterios, escala 0 a 4)

| Criterio | 0–1 (Insuficiente) | 2 (En desarrollo) | 3 (Competente — Aprobado) | 4 (Excelente) |
|---|---|---|---|---|
| **1. Separación de hechos y dimensiones para VertiPaq** | Importa una única tabla ancha (OBT) mezclando cabeceras de `orders` y líneas de `order_items`, inflando `SUM(total_usd)`. | Separa dimensiones pero conserva columnas de alta cardinalidad innecesarias (`order_item_id`) o mezcla importes de cabecera en el detalle sin documentar el grano. | Define las dimensiones conformadas (`customers`, `products`, `stores`, `calendar`) y separa claramente los hechos por grano (`orders` a nivel pedido y `order_items` a nivel línea), eliminando claves primarias de fila de hechos que no participan en relaciones. | Además de separar hechos y dimensiones, cuantifica con consultas SQL sobre Mercado Brisa el tamaño de diccionario (valores distintos) de cada clave foránea y demuestra que `SUM(orders.total_usd)` y `SUM(order_items.line_total_usd)` cuadran por región sin fan-out. |
| **2. Cardinalidad `1:N` y tratamiento de `refunds` / `customer_changes`** | Conecta tablas con claves duplicadas mediante relaciones `N:M` directas sin advertir la multiplicación de filas ni el impacto en totales. | Identifica que `refunds` (`1 450` filas para `1 150` pedidos) y `customer_changes` (`4 100` filas para `2 400` clientes) tienen duplicados, pero no resuelve cómo modelarlas en `1:N`. | Garantiza que el lado `1` de toda relación tenga `0` duplicados (`COUNT(*) = COUNT(DISTINCT pk)`), filtrando `is_current = TRUE` para la foto actual de clientes o pre-agregando `refunds` por `order_id` cuando se consolida a nivel pedido. | Documenta tanto la opción de pre-agregación `1:1` por `order_id` como el diseño multi-hecho (mantener `fct_orders` y `fct_refunds` separados compartiendo dimensiones conformadas `customers`, `stores` y `calendar`). |
| **3. Flujo de filtro único (`Single`) y tabla `calendar` con `USERELATIONSHIP`** | Activa filtro bidireccional (`Both`) en todas las relaciones del modelo o deja `Auto date/time` encendido sin tabla de calendario oficial. | Configura relaciones `1:N` de flujo único con `calendar`, pero crea dos copias físicas innecesarias del calendario o ignora las devoluciones por fecha de reembolso. | Configura todas las relaciones dimensión -> hechos con filtro cruzado único (`Single`), audita `calendar` (detectando el día faltante `2025-12-31` por el bisiesto `2024`) y define la relación activa por `order_date` más la relación inactiva por `refund_date` activada mediante `USERELATIONSHIP`. | Incluye la consulta SQL de reconciliación trimestral (`FY24-Q1` a `FY24-Q4`) que demuestra numéricamente la diferencia contable entre atribuir reembolsos por fecha de pedido frente a fecha de devolución con `USERELATIONSHIP`. |
| **4. Disciplina de medidas frente a columnas calculadas** | Crea columnas calculadas fila a fila para el porcentaje de margen y la tasa de descuento, promediándolas en los visuales. | Usa medidas para las sumas básicas pero sigue materializando razones o columnas intermedias de alta cardinalidad en la tabla de hechos. | Define todos los indicadores agregados y de razón (Ingreso Neto, Margen Bruto %, Tasa de Descuento %, Reembolsos por fecha de devolución) como medidas dinámicas (`DIVIDE(SUM(...), SUM(...))`) y restringe las columnas calculadas/derivadas a atributos discretos de baja cardinalidad (`tramo_descuento`). | Contrasta con cifras reales de Mercado Brisa el sesgo de promediar porcentajes por fila frente a la medida agregada por categoría y tienda, y explica por qué las columnas derivadas necesarias deben crearse en SQL/Power Query antes de llegar a DAX. |
