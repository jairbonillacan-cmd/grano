# Investigación y diseño curricular · Módulo `da2-eda` (Exploración de datos con método)

- **Módulo:** `da2-eda` — Exploración de datos con método
- **Área y nivel:** Análisis de Datos (`da`) · Nivel 2 (Intermedio)
- **Prerrequisitos de módulo:** `c1-viz` (Visualización honesta) y `c1-modelo` (Modelo relacional y calidad de datos), y por transitividad `c0-numeros`, `c1-sql-base`, `c1-sql-joins` y `c1-python`.
- **Lecciones del módulo:** 4 lecciones (`90` minutos estimados en total: `[20, 25, 25, 20]`)
- **Fecha de consulta de fuentes:** `2026-10-29`

---

## Paso 1 — Investigación de fuentes verificables por lección

Todas las fuentes listadas a continuación fueron verificadas mediante petición HTTP (`200 OK`) el `2026-10-29`. Cada lección cuenta con 4 fuentes reales (`https://...`), de las cuales al menos 3 son fuentes primarias (manual estadístico oficial de NIST/SEMATECH, documentación oficial de DuckDB, documentación oficial de Polars, documentación oficial de Marimo y dbt Labs, y el libro de referencia *R for Data Science, 2nd Edition* de Hadley Wickham).

### Lección 1 · `da2-eda-01-hipotesis-preguntas-refutables`
**Título en catálogo:** Formular hipótesis y preguntas refutables antes de abrir un gráfico (`20 min`)  
**Título ajustado (`<= 60` chars en `LessonSchema`):** `Formular hipótesis y preguntas refutables antes de graficar`

| # | Tipo | Título y autor / editorial | URL verificada (`https://`) | Fecha (`accessed`) | Afirmación técnica que respalda en la lección |
|---|---|---|---|---|---|
| 1 | Primaria | NIST/SEMATECH e-Handbook of Statistical Methods — Section 1.1.1: What is Exploratory Data Analysis? (`National Institute of Standards and Technology`) | https://www.itl.nist.gov/div898/handbook/eda/section1/eda11.htm | `2026-10-29` | Distinción metodológica entre Análisis Exploratorio de Datos (EDA, generación y diagnóstico de estructura e hipótesis) y Análisis Confirmatorio de Datos (CDA), y cómo evitar extraer conclusiones causales sin un marco de contraste explícito. |
| 2 | Primaria | Hadley Wickham, Mine Çetinkaya-Rundel & Garrett Grolemund — *R for Data Science (2nd Edition)*, Chapter 10: Exploratory Data Analysis (`O'Reilly Media`) | https://r4ds.hadley.nz/EDA.html | `2026-10-29` | Ciclo iterativo de exploración estructurada: formular preguntas específicas sobre variación y covariación, definir qué observación refutaría la expectativa inicial y usar estratificación antes de agregar. |
| 3 | Primaria | DuckDB Documentation — `FILTER` Clause in Aggregate Functions (`DuckDB Foundation`) | https://duckdb.org/docs/sql/query_syntax/filter.html | `2026-10-29` | Uso de `MEDIAN(col) FILTER (WHERE ...)` y `COUNT(*) FILTER (WHERE ...)` para contrastar en una misma consulta dos subgrupos de una hipótesis refutable sin alterar el grano de la tabla. |
| 4 | Primaria | Statsmodels Developers — User Guide: Statistical Models and Hypothesis Formulation (`Statsmodels / PyData`) | https://www.statsmodels.org/stable/user-guide.html | `2026-10-29` | Separación entre exploración abierta de relaciones (riesgo de *data dredging* o falacia de francotirador de Texas al buscar patrones post-hoc) y evaluación de una afirmación cuantitativa refutable. |

### Lección 2 · `da2-eda-02-perfilado-tablas`
**Título en catálogo:** Perfilado sistemático de tablas: cardinalidad, completitud, asimetría y dominios (`25 min`)  
**Título ajustado (`<= 60` chars en `LessonSchema`):** `Perfilado de tablas: cardinalidad, completitud y asimetría`

| # | Tipo | Título y autor / editorial | URL verificada (`https://`) | Fecha (`accessed`) | Afirmación técnica que respalda en la lección |
|---|---|---|---|---|---|
| 1 | Primaria | DuckDB Documentation — `SUMMARIZE` Statement (`DuckDB Foundation`) | https://duckdb.org/docs/guides/meta/summarize.html | `2026-10-29` | Perfilado automático de tablas con `SUMMARIZE tabla`, que calcula en una pasada `min`, `max`, `approx_unique`, `avg`, `std`, `q25`, `q50`, `q75`, `count` y `null_percentage` para todas las columnas. |
| 2 | Primaria | Polars Official API Reference — `polars.DataFrame.describe` (`Polars Project`) | https://docs.pola.rs/api/python/stable/reference/dataframe/api/polars.DataFrame.describe.html | `2026-10-29` | Perfilado columnar en Python con `df.describe()` (conteo no nulo, `null_count`, media, desviación estándar, mínimo, percentiles y máximo) complementado con `df.n_unique()` para cardinalidad. |
| 3 | Primaria | DuckDB Documentation — Aggregate Functions (`MEDIAN`, `QUANTILE_CONT`, `SKEWNESS`, `COUNT(DISTINCT)`) (`DuckDB Foundation`) | https://duckdb.org/docs/sql/functions/aggregates.html | `2026-10-29` | Cálculo exacto de razón de cardinalidad (`COUNT(DISTINCT col) / COUNT(*)`), tasa de completitud (`COUNT(col) / COUNT(*)`) y asimetría muestral (`SKEWNESS(col)`) en consultas SQL de perfilado. |
| 4 | Primaria | Polars User Guide — Missing Data (`null` and `NaN` handling) (`Polars Project`) | https://docs.pola.rs/user-guide/expressions/missing-data/ | `2026-10-29` | Diferenciación entre nulos estructurales esperados por el dominio del evento (como `product_id IS NULL` en `page_view`) y nulos por defecto de captura (como `postal_code IS NULL` en `customers`). |

### Lección 3 · `da2-eda-03-outliers-errores-extremos`
**Título en catálogo:** Valores atípicos (outliers): cómo distinguir un error de captura de un cliente real extremo (`25 min`)  
**Título ajustado (`<= 60` chars en `LessonSchema`):** `Valores atípicos: error de captura frente a cliente extremo`

| # | Tipo | Título y autor / editorial | URL verificada (`https://`) | Fecha (`accessed`) | Afirmación técnica que respalda en la lección |
|---|---|---|---|---|---|
| 1 | Primaria | NIST/SEMATECH e-Handbook of Statistical Methods — Section 1.3.5.17: Detection of Outliers (Iglewicz and Hoaglin Modified Z-Score with MAD) (`NIST`) | https://www.itl.nist.gov/div898/handbook/eda/section3/eda35h.htm | `2026-10-29` | Definición del puntaje Z modificado de Iglewicz y Hoaglin ($M_i = 0.6745 \cdot |x_i - \tilde{x}| / \text{MAD}$ con umbral $|M_i| > 3.5$) y por qué el puntaje Z clásico falla al hincharse la desviación estándar con el propio valor extremo. |
| 2 | Primaria | NIST/SEMATECH e-Handbook of Statistical Methods — Section 1.3.3.7: Box Plot & Tukey Fences (`NIST`) | https://www.itl.nist.gov/div898/handbook/eda/section3/eda337.htm | `2026-10-29` | Regla de cercas internas ($Q_1 - 1.5 \times \text{IQR}$, $Q_3 + 1.5 \times \text{IQR}$) y cercas externas ($3.0 \times \text{IQR}$) de John W. Tukey para marcar observaciones candidatas a inspección sin borrado automático. |
| 3 | Primaria | NIST/SEMATECH e-Handbook of Statistical Methods — Section 1.3.5.6: Measures of Scale (Median Absolute Deviation — MAD) (`NIST`) | https://www.itl.nist.gov/div898/handbook/eda/section3/eda356.htm | `2026-10-29` | Propiedades de resistencia de la desviación absoluta mediana ($\text{MAD} = \text{mediana}(|x_i - \tilde{x}|)$) frente a estimadores cuadráticos en distribuciones con colas pesadas. |
| 4 | Primaria | DuckDB Documentation — Statistical Aggregates (`MAD`, `QUANTILE_CONT`, `MEDIAN`) (`DuckDB Foundation`) | https://duckdb.org/docs/sql/functions/aggregates.html | `2026-10-29` | Uso nativo de `MAD(col)`, `QUANTILE_CONT(col, 0.99)` y `LEAST(col, p99)` en DuckDB para implementar detección resistente y winsorización sin eliminar clientes corporativos reales. |

### Lección 4 · `da2-eda-04-diario-analisis-reproducible`
**Título en catálogo:** El diario de análisis reproducible: trazabilidad de supuestos, filtros y descartes (`20 min`)  
**Título ajustado (`<= 60` chars en `LessonSchema`):** `Diario de análisis reproducible: supuestos y descartes`

| # | Tipo | Título y autor / editorial | URL verificada (`https://`) | Fecha (`accessed`) | Afirmación técnica que respalda en la lección |
|---|---|---|---|---|---|
| 1 | Primaria | DuckDB Documentation — Common Table Expressions (`WITH` Clause) (`DuckDB Foundation`) | https://duckdb.org/docs/sql/query_syntax/with.html | `2026-10-29` | Encadenamiento de etapas de filtrado mediante CTEs secuenciales (`WITH paso_0 AS (...), paso_1 AS (...)`) para construir una tabla de atrición auditable en una sola consulta SQL. |
| 2 | Primaria | Marimo Official Documentation — Reactive Python Notebooks & Reproducible Execution DAG (`Marimo Team`) | https://docs.marimo.io/ | `2026-10-29` | Garantía de reproducibilidad mediante cuadernos reactivos basados en un grafo acíclico dirigido (DAG) almacenados como scripts `.py` puros en Git, eliminando el estado oculto de celdas ejecutadas fuera de orden. |
| 3 | Primaria | dbt Labs Documentation — Analyses (`analyses/` directory for versioned analytical SQL) (`dbt Labs`) | https://docs.getdbt.com/docs/build/analyses | `2026-10-29` | Versionado de consultas exploratorias y ad-hoc dentro del repositorio de datos para conservar la trazabilidad de supuestos, definiciones de cohortes y filtros aplicados. |
| 4 | Primaria | Hadley Wickham, Mine Çetinkaya-Rundel & Garrett Grolemund — *R for Data Science (2nd Edition)*, Chapter 29: Quarto & Reproducible Communication (`O'Reilly Media`) | https://r4ds.hadley.nz/EDA.html | `2026-10-29` | Documentación explícita de cada recorte muestral, fecha de corte y supuesto de negocio para que un tercero reproduzca exactamente las mismas cifras a partir de los datos crudos. |

---

## Paso 2 — Mapa de conceptos y progresión pedagógica del módulo

### Qué asume este módulo de los módulos previos
- De **`c0-numeros`**: media, mediana, percentiles (`p25`, `p50`, `p75`, `p90`, `p99`), rango intercuartílico (`IQR`), coeficiente de asimetría (`SKEWNESS`) y diferencia entre correlación y causalidad.
- De **`c1-sql-base` y `c1-sql-joins`**: `GROUP BY`, `HAVING`, `CASE WHEN`, `FILTER (WHERE ...)`, `COUNT(DISTINCT ...)`, `LEFT JOIN`, `ANTI JOIN`, `UNION ALL` y CTEs (`WITH`).
- De **`c1-modelo`**: las 4 dimensiones de calidad SQL (unicidad, completitud, validez de formato y validez de rango) y el conocimiento de las anomalías sembradas en Mercado Brisa.
- De **`c1-viz`**: elección honesta de geometrías gráficas y diseño de tablas numéricas con precisión controlada.

### Progresión de conceptos en las 4 lecciones de `da2-eda`

| Orden | ID de lección | Concepto central que introduce | Qué asume de la anterior | Qué problema real de Mercado Brisa resuelve |
|---|---|---|---|---|
| 1 | `da2-eda-01-hipotesis-preguntas-refutables` | **Hipótesis refutable**, criterio de falsación cuantitativo, **pesca de correlaciones** (*data dredging* / falacia de francotirador) y **variable de confusión** por composición de segmento. | Estadística descriptiva (`c0-numeros`) y gráficos/tablas (`c1-viz`). | Refuta con SQL dos creencias intuitivas en `orders` y `refunds`: 1) que los cupones (`discount_usd > 0`) elevan el subtotal mediano (`294.72 USD` con descuento frente a `308.43 USD` sin descuento en pedidos completados), y 2) que `desktop` supera a `pos_tienda` en todos los segmentos (en `pro_barista`, `pos_tienda` tiene mediana de `393.01 USD` frente a `332.62 USD` en `desktop`). |
| 2 | `da2-eda-02-perfilado-tablas` | **Perfilado sistemático de tablas** (*data profiling*), **razón de cardinalidad**, distinción entre **nulo estructural** y **nulo por defecto de captura**, y uso de `SUMMARIZE` en DuckDB y `describe()` en Polars. | Necesidad de conocer la forma y calidad del dataset antes de contrastar las hipótesis de la Lección 1. | Construye la matriz de perfilado de `events`, `orders`, `customers`, `payments` y `products`, demostrando que en `events` el `0 %` de completitud de `product_id` en `page_view` (`9 400` filas) es un nulo estructural del dominio, mientras que los `240` `event_id` repetidos por cada uno de los `5` tipos (`1 200` en total) son duplicados de red. |
| 3 | `da2-eda-03-outliers-errores-extremos` | Clasificación de **valores atípicos (outliers)** en **error de dominio/captura** frente a **extremo legítimo de negocio**, **puntaje Z modificado con MAD** ($M_i$), y comparación entre **borrado**, **winsorización** (`p99`) y **medidas resistentes**. | Perfilado de rangos, cuartiles y asimetría de la Lección 2. | Demuestra por qué la cerca de Tukey de `Accesorios` (`-10.76 USD`) no detecta por sí sola `SKU-TEST-NEG` (`-9.99 USD`, que requiere regla de dominio `list_price_usd <= 0`), mientras que en `orders` borrar los `213` pedidos completados que superan la cerca superior (`1 300.08 USD`) mutila `306 122.18 USD` de ingresos reales (`8.03 %` del segmento `cafeteria_b2b`). |
| 4 | `da2-eda-04-diario-analisis-reproducible` | **Diario de análisis reproducible**, **tabla de atrición** (*attrition table* o embudo de descartes en SQL), análisis de sensibilidad de filtros y eliminación de estado oculto en cuadernos. | Hipótesis (L01), perfilado (L02) y reglas explícitas de tratamiento de extremos y duplicados (L03). | Audita el embudo de filtrado de `payments` (`19 200` filas crudas → `18 750` sin webhooks duplicados → `16 200` `captured` → `14 760` cruzados con `orders` `completed`), revelando cómo un filtro opaco sin paso de deduplicación infla el resultado en `369` pagos (`154 053.92 USD`). |

---

## Paso 6 — Proyecto del módulo `da2-eda` y rúbrica verificable

### Especificación en `src/data/catalog/modules.js`
- **Enunciado (`prompt`):** Realizar el perfilado completo de la navegación web y de los pedidos separando anomalías técnicas de patrones reales de compra.
- **Dataset:** Mercado Brisa (`events`, `orders`, `order_items`, `products`, `customers` y `refunds`).
- **Entregable (`deliverable`):** Informe exploratorio reproducible con matriz de perfilado, tabla de atrición de descartes y 5 hallazgos respaldados por consultas SQL y gráficos.

### Los 5 hallazgos verificables en DuckDB que debe documentar el informe del proyecto
1. **Matriz de perfilado inicial:** `events` contiene `65 000` filas totales pero solo `63 800` `event_id` únicos (`1 200` duplicados de red repartidos a razón de `240` por cada uno de los `5` `event_type`), `6 715` eventos sin sesión iniciada (`customer_id IS NULL`, `10.33 %`) y `9 400` eventos `page_view` con `product_id IS NULL` (nulo estructural legítimo).
2. **Contraste de hipótesis sobre descuentos (`H1` refutada):** en los `14 760` pedidos completados de `orders`, los pedidos con descuento (`3 264` filas) tienen una mediana de subtotal bruto de `294.72 USD` y total de `324.78 USD`, inferior a los pedidos sin descuento (`11 496` filas, subtotal mediano `308.43 USD` y total mediano `357.78 USD`).
3. **Contraste de hipótesis estratificada por segmento y dispositivo (`H2` refutada en `pro_barista`):** aunque en el agregado global de pedidos completados `desktop` (`382.56 USD`) supera a `pos_tienda` (`357.37 USD`), al estratificar por `customers.segment` se comprueba que en `pro_barista` el canal `pos_tienda` (`393.01 USD`) supera a `desktop` (`332.62 USD`) en `+60.39 USD`.
4. **Separación entre error de captura y extremo real:** en `products`, el artículo `product_id = 180` (`SKU-TEST-NEG`, `-9.99 USD`, `0` ventas en `order_items`) se descarta por violar el dominio físico (`list_price_usd <= 0`); en cambio, en `orders` (`status = 'completed'`), los `213` pedidos por encima de la cerca de Tukey (`1 300.08 USD`) suman `306 122.18 USD` (`8.03 %` del ingreso de `cafeteria_b2b`) y se conservan reportando mediana (`444.51 USD` en B2B) y media winsorizada al `p99` (`1 343.24 USD`).
5. **Tabla de atrición reproducible:** toda consulta analítica sobre `events` y `orders` incluye su tabla `UNION ALL` de descartes paso a paso, documentando cuántas filas, sesiones y dólares se retienen en cada etapa.

### Rúbrica verificable de evaluación del proyecto (4 criterios, escala 0 a 4)

| Criterio | 0–1 (Insuficiente) | 2 (En desarrollo) | 3 (Competente — Aprobado) | 4 (Excelente) |
|---|---|---|---|---|
| **1. Formulación de hipótesis refutables** | Presenta gráficos descriptivos sueltos sin enunciar ninguna pregunta ni condición de refutación previa. | Formula preguntas generales ("ver cómo cambian las ventas"), pero sin métrica, dirección ni umbral cuantitativo refutable. | Formula al menos 2 hipótesis explícitas con población, métrica resistente (`MEDIAN`, `IQR`), dirección esperada y condición de refutación antes de consultar `orders` y `customers`. | Contrasta las hipótesis primero en el agregado y luego estratificando por variable de confusión (`segment`, `current_tier`), documentando qué hipótesis quedan refutadas por los datos. |
| **2. Perfilado sistemático de tablas** | Inspecciona las tablas solo con `SELECT * LIMIT 10` sin medir cardinalidad, completitud ni asimetría. | Calcula conteos básicos y `AVG`/`MIN`/`MAX`, pero confunde nulos estructurales (`product_id` en `page_view`) con errores de captura. | Construye una matriz SQL de perfilado que reporta conteo de filas, unicidad de clave, porcentaje de completitud, cardinalidad de dominios, cuantiles (`p25`, `p50`, `p75`, `p90`) y `SKEWNESS`. | Distingue con precisión en `events`, `customers`, `orders` y `products` entre duplicados técnicos (`1 200` eventos), nulos estructurales (`9 400` `page_view`) y defectos de captura (`347` códigos postales incompletos). |
| **3. Tratamiento de valores atípicos (outliers)** | Elimina con un `WHERE` todas las filas que superan `media + 2 * desvio` o `Q3 + 1.5 * IQR`, mutilando pedidos reales. | Detecta `SKU-TEST-NEG` y los pedidos altos de `orders`, pero aplica el mismo filtro de borrado a ambos sin analizar su origen. | Separa los errores de dominio (`SKU-TEST-NEG` con `-9.99 USD` en `products`, que sí se excluye) de los clientes reales extremos (`213` pedidos `> 1 300.08 USD` en `orders`, que se conservan). | Cuantifica en SQL el impacto financiero que tendría borrar los extremos por segmento (`8.03 %` de pérdida en `cafeteria_b2b`) y compara la media original, la media winsorizada al `p99` (`LEAST(total_usd, p99)`) y la mediana. |
| **4. Trazabilidad y tabla de atrición reproducible** | Entrega cifras finales sin mostrar el código SQL o aplicando múltiples filtros en un `WHERE` opaco sin conteos intermedios. | Incluye las consultas SQL, pero no registra cuántas filas o cuánto importe descartó cada filtro de limpieza. | Estructura cada análisis con CTEs secuenciales y una consulta de atrición (`UNION ALL`) que muestra filas e importe restantes en cada etapa desde la tabla cruda hasta la muestra final. | Añade además un análisis de sensibilidad comparando cómo cambian las conclusiones con y sin los registros filtrados, garantizando ejecución determinista de principio a fin. |
