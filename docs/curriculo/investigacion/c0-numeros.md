# Investigación y diseño curricular · Módulo `c0-numeros` ("Números con sentido")

- **Módulo:** `c0-numeros` — Números con sentido
- **Nivel:** `0` (Cimientos) · **Área:** `core` (Tronco común)
- **Prerrequisito de módulo:** `c0-datos` (Qué son los datos)
- **Duración total estimada:** 90 minutos (5 lecciones: 15, 20, 20, 15 y 20 minutos)
- **Fecha de consulta y verificación de fuentes:** `2026-10-29`

---

## 1. Investigación de fuentes por lección (Paso 1)

Cada una de las 5 lecciones se respalda en al menos 3 fuentes verificables (`https://...`), con un mínimo de 2 fuentes primarias (manuales estadísticos oficiales del NIST, documentación oficial de DuckDB v2.0 y PostgreSQL 17, guías metodológicas de CDC y Eurostat, y literatura primaria de inferencia causal).

### Lección 1 · `c0-numeros-01-media-mediana-moda`
**Título:** *Media, mediana y moda: cuándo el promedio miente* (15 min)

| Tipo | Título de la fuente | Editorial / Autor | URL | Consultado | Qué afirmación respalda |
|---|---|---|---|---|---|
| Primaria | NIST/SEMATECH e-Handbook of Statistical Methods — Section 1.3.5.1: Measures of Location | National Institute of Standards and Technology (NIST) | https://www.itl.nist.gov/div898/handbook/eda/section3/eda351.htm | `2026-10-29` | Definición matemática de media aritmética, mediana, moda y media recortada, y vulnerabilidad de la media ante valores extremos frente a la resistencia de la mediana (punto de ruptura del 50 %). |
| Primaria | DuckDB Documentation — Statistical Aggregate Functions (`avg`, `median`, `mode`) | DuckDB Foundation | https://duckdb.org/docs/sql/functions/aggregates | `2026-10-29` | Sintaxis y semántica de `AVG(x)`, `MEDIAN(x)` y `MODE(x)` en DuckDB, incluyendo el descarte automático de valores `NULL` y la interpolación en conteos pares. |
| Primaria | PostgreSQL 17 Documentation — Section 9.21: Aggregate Functions (`percentile_cont`, `mode`) | PostgreSQL Global Development Group | https://www.postgresql.org/docs/current/functions-aggregate.html | `2026-10-29` | Estándar SQL de funciones de conjunto ordenado (`PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ...)` y `MODE() WITHIN GROUP`) para calcular mediana y moda en motores relacionales. |

### Lección 2 · `c0-numeros-02-dispersion-iqr-percentiles`
**Título:** *Dispersión, rango intercuartílico y percentiles (p50, p90)* (20 min)

| Tipo | Título de la fuente | Editorial / Autor | URL | Consultado | Qué afirmación respalda |
|---|---|---|---|---|---|
| Primaria | NIST/SEMATECH e-Handbook of Statistical Methods — Section 1.3.5.6: Measures of Scale | National Institute of Standards and Technology (NIST) | https://www.itl.nist.gov/div898/handbook/eda/section3/eda356.htm | `2026-10-29` | Definición de rango total, varianza muestral ($s^2$) y desviación estándar ($s$), y por qué elevar al cuadrado las distancias amplifica el peso de los valores extremos. |
| Primaria | NIST/SEMATECH e-Handbook of Statistical Methods — Section 1.3.3.7: Box Plot (Tukey Five-Number Summary & IQR) | National Institute of Standards and Technology (NIST) | https://www.itl.nist.gov/div898/handbook/eda/section3/eda337.htm | `2026-10-29` | Resumen de cinco números de John W. Tukey (mínimo, $Q_1$, mediana, $Q_3$, máximo), definición del rango intercuartílico ($\text{IQR} = Q_3 - Q_1$) y regla de cercas ($Q_1 - 1.5 \times \text{IQR}$, $Q_3 + 1.5 \times \text{IQR}$) para aislar valores atípicos. |
| Primaria | DuckDB Documentation — Quantile and Dispersion Aggregates (`quantile_cont`, `quantile_disc`, `stddev_samp`) | DuckDB Foundation | https://duckdb.org/docs/sql/functions/aggregates | `2026-10-29` | Cálculo de percentiles continuos (`QUANTILE_CONT(x, p)`) y discretos (`QUANTILE_DISC(x, p)`) para `p25`, `p50`, `p75`, `p90` y `p99`, así como `STDDEV_SAMP(x)`. |

### Lección 3 · `c0-numeros-03-asimetria-sesgo`
**Título:** *Distribuciones asimétricas y sesgo en importes y entregas* (20 min)

| Tipo | Título de la fuente | Editorial / Autor | URL | Consultado | Qué afirmación respalda |
|---|---|---|---|---|---|
| Primaria | NIST/SEMATECH e-Handbook of Statistical Methods — Section 1.3.5.11: Measures of Skewness and Kurtosis | National Institute of Standards and Technology (NIST) | https://www.itl.nist.gov/div898/handbook/eda/section3/eda35b.htm | `2026-10-29` | Coeficiente de asimetría de Fisher-Pearson, interpretación del signo positivo (cola larga hacia la derecha) y negativo (cola larga hacia la izquierda), y fracaso de intervalos simétricos $\mu \pm 2s$ bajo asimetría pronunciada. |
| Primaria | DuckDB Documentation — Statistical Aggregates (`skewness`, `kurtosis`, `histogram`) | DuckDB Foundation | https://duckdb.org/docs/sql/functions/aggregates | `2026-10-29` | Uso de `SKEWNESS(x)` en DuckDB para cuantificar la asimetría de importes monetarios y tiempos operativos directamente en SQL. |
| Secundaria | SciPy Reference Guide — Statistical Functions (`scipy.stats.skew` and Lognormal Distributions) | SciPy Community | https://docs.scipy.org/doc/scipy/reference/stats.html | `2026-10-29` | Comportamiento de variables con cota física inferior en cero (precios, reembolsos, tiempos de entrega) que generan colas derechas y relación empírica $\text{moda} < \text{mediana} < \text{media}$ en distribuciones unimodales con asimetría positiva. |

### Lección 4 · `c0-numeros-04-proporciones-tasas-bps`
**Título:** *Proporciones, tasas, puntos porcentuales y puntos base* (15 min)

| Tipo | Título de la fuente | Editorial / Autor | URL | Consultado | Qué afirmación respalda |
|---|---|---|---|---|---|
| Primaria | Principles of Epidemiology in Public Health Practice — Lesson 3, Section 1: Frequency Measures (Ratios, Proportions, and Rates) | Centers for Disease Control and Prevention (CDC) | https://archive.cdc.gov/www_cdc_gov/csels/dsepd/ss1978/lesson3/section1.html | `2026-10-29` | Distinción matemática entre razón ($A/B$), proporción ($A/(A+B)$, donde el numerador es subconjunto del denominador y el valor vive en $[0, 1]$) y tasa (eventos por unidad de exposición o tiempo). |
| Primaria | Eurostat Statistics Explained — Beginners: Statistical Concept — Percentage Change and Percentage Points | European Commission / Eurostat | https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Beginners:Statistical_concept_-_Percentage_change_and_percentage_points | `2026-10-29` | Diferencia exacta entre variación relativa porcentual ($\frac{p_2 - p_1}{p_1} \times 100$) y diferencia aritmética en puntos porcentuales ($\text{pp} = p_2 - p_1$) y puntos base ($1\text{ pp} = 100\text{ bps} = 0.01\%$). |
| Primaria | Kimball Group — Additive, Semi-Additive, and Non-Additive Facts | Kimball Group (Ralph Kimball & Margy Ross) | https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/additive-semi-additive-non-additive-fact/ | `2026-10-29` | Carácter no aditivo de las proporciones y razones: prohibición de promediar porcentajes con `AVG(a / b)` y obligación de agregar `SUM(a) / SUM(b)`. |

### Lección 5 · `c0-numeros-05-correlacion-causalidad`
**Título:** *Por qué correlación no implica causalidad y confusores* (20 min)

| Tipo | Título de la fuente | Editorial / Autor | URL | Consultado | Qué afirmación respalda |
|---|---|---|---|---|---|
| Primaria | Causal Inference: What If — Part I: Causal Inference Without Models (Confounding, DAGs, and Selection Bias) | Miguel A. Hernán & James M. Robins (Harvard T.H. Chan School of Public Health / CRC Press) | https://miguelhernan.org/whatifbook | `2026-10-29` | Definición formal de variable de confusión (*confounder*) como causa común de la exposición y del resultado, bloqueo del camino trasero mediante estratificación y distinción frente a causalidad inversa y azar. |
| Primaria | Stanford Encyclopedia of Philosophy — Simpson's Paradox | Stanford University | https://plato.stanford.edu/entries/paradox-simpson/ | `2026-10-29` | Cómo una variable de confusión no controlada puede inflar, atenuar o invertir el signo de una asociación al agregar datos de subgrupos con distinto peso y distinta línea base. |
| Primaria | DuckDB Documentation — Correlation and Regression Aggregates (`corr`, `covar_pop`, `regr_slope`) | DuckDB Foundation | https://duckdb.org/docs/sql/functions/aggregates | `2026-10-29` | Cálculo del coeficiente de correlación lineal de Pearson `CORR(y, x)` acotado en $[-1, 1]$ y su evaluación estratificada por segmento mediante `GROUP BY`. |

---

## 2. Mapa de conceptos y progresión del módulo (Paso 2)

El módulo `c0-numeros` asume únicamente los conceptos del módulo prerrequisito `c0-datos`: qué es una tabla, qué significa el **grano** (una fila = una entidad u observación), la diferencia entre números enteros y decimales, y qué representa `NULL` (dato ausente, no cero). No asume `JOIN` ni funciones de ventana (que se enseñan en `c1-sql-joins` y `c2-sql-analitico`), por lo que todas las consultas SQL del módulo operan sobre una única tabla a la vez.

| Orden | ID de lección | Conceptos que asume | Conceptos nuevos que introduce | Términos de glosario (`c0-numeros-glossary.json`) |
|---|---|---|---|---|
| 1 | `c0-numeros-01-media-mediana-moda` | Tabla, fila, columna numérica, `NULL` (`c0-datos`). | **Media aritmética** (`AVG`), **mediana** (`MEDIAN`), **moda** (`MODE`), sensibilidad al valor extremo y comportamiento de agregaciones ante `NULL`. | `media-aritmetica`, `mediana` |
| 2 | `c0-numeros-02-dispersion-iqr-percentiles` | Media y mediana (`c0-numeros-01`). | Rango total, **desviación estándar** (`STDDEV_SAMP`), **percentiles** (`p25`, `p50`, `p75`, `p90`, `p99` con `QUANTILE_CONT`), **rango intercuartílico** ($\text{IQR} = \text{p75} - \text{p25}$) y regla de Tukey ($1.5 \times \text{IQR}$) para detectar valores atípicos. | `rango-intercuartilico`, `percentil` |
| 3 | `c0-numeros-03-asimetria-sesgo` | Media, mediana, IQR y percentiles (`c0-numeros-01`, `c0-numeros-02`). | **Asimetría positiva** (cola derecha) y negativa (cola izquierda), coeficiente de asimetría (`SKEWNESS`), brecha $\text{media} - \text{mediana}$, cota inferior en cero y **sesgo estadístico** (error sistemático de muestreo o medición) frente a asimetría de forma. | `asimetria-distribucion`, `sesgo-estadistico` |
| 4 | `c0-numeros-04-proporciones-tasas-bps` | Conteos, sumas y medidas de resumen (`c0-numeros-01`..`03`). | Diferencia entre razón, **proporción** y **tasa**; no aditividad de porcentajes (`SUM(num)/SUM(den)` frente al error `AVG(num/den)`); diferencia entre variación relativa (`%`), **puntos porcentuales** (`pp`) y **puntos base** (`bps`). | `punto-porcentual`, `punto-base` |
| 5 | `c0-numeros-05-correlacion-causalidad` | Tasas, proporciones y agregación por grupos (`c0-numeros-01`..`04`). | **Coeficiente de correlación de Pearson** (`CORR`), linealidad, tres mecanismos no causales (azar, causalidad inversa y **variable de confusión**), estratificación por el confusor y conexión visual con la paradoja de Simpson (`simpsons-paradox-explorer`). | `correlacion-pearson`, `variable-confusion` |

### Verificación de dependencias hacia adelante y hacia atrás
- **Hacia atrás (`c0-datos`):** Todas las lecciones refuerzan que antes de resumir una columna hay que verificar el grano de la tabla y si existen valores `NULL` o códigos centinela (como el producto `SKU-TEST-NEG` con `list_price_usd = -9.99` en `products`).
- **Hacia adelante (`c0-negocio`, `c1-sql-base`, `c1-viz`, `c2-dimensional`, `da2-inferencia`, `da2-eda`):** Este módulo sienta las bases para el diseño de KPIs en `c0-negocio`, escalas honestas e histogramas en `c1-viz`, métricas no aditivas y paradoja de Simpson en `c2-dimensional`, pruebas de hipótesis en `da2-inferencia` y perfilado exploratorio en `da2-eda`.

---

## 3. Verificación SQL real sobre Mercado Brisa (Paso 4)

Todas las consultas de `sections[].example`, `workedExample` y `practice` fueron ejecutadas con `@duckdb/node-api` contra los archivos Parquet oficiales de `public/datasets/` (semilla `19870315`):

1. **Lección 1 (`orders` y `products`):**
   - En `orders` (18 000 filas): `AVG(total_usd) = 426.10`, `MEDIAN(total_usd) = 350.16`, `MODE(device_type) = 'desktop'`. Exactamente `10 470` pedidos (`58.2 %`) están por debajo de la media de `426.10` USD.
   - Por `status` en `orders`: `completed` (`14 760` pedidos, media `424.76`, mediana `348.28`, brecha `76.49`), `refunded` (`1 440`, media `420.16`, mediana `335.29`, brecha `84.86`), `cancelled` (`1 080`, media `452.78`, mediana `386.42`, brecha `66.36`), `pending` (`720`, media `425.45`, mediana `351.90`, brecha `73.56`).
   - En `products WHERE list_price_usd > 0`: `Molinos` (`36` SKUs, media `152.57`, mediana `158.58`, moda `'Brisa Taller'`), `Cafeteras` (`36`, media `116.36`, mediana `115.02`, moda `'Viento Sur'`), `Suscripciones` (`35`, media `47.83`, mediana `47.61`, moda `'Brisa Origen'`), `Accesorios` (`36`, media `41.26`, mediana `42.34`, moda `'Andes Roast'`), `Café en grano` (`36`, media `29.34`, mediana `30.31`, moda `'Kona Lab'`).
2. **Lección 2 (`orders` y `products`):**
   - En `orders`: `min = 13.13`, `p25 = 166.71`, `p50 = 350.16`, `p75 = 621.35`, `iqr = 454.65`, `p90 = 876.17`, `max = 1925.73`.
   - En `products` sin filtrar: la categoría `Accesorios` (`37` SKUs) incluye el SKU de prueba `SKU-TEST-NEG` (`-9.99` USD), lo que infla su rango total a `76.27` USD (`66.28 - (-9.99)`), mientras su `IQR` (`p75 - p25 = 54.91 - 28.64 = 26.27` USD) permanece estable.
   - Por `device_type` en `orders`: `desktop` (`7 716` pedidos, `p50 = 386.39`, `iqr = 473.09`, `p90 = 917.84`), `pos_tienda` (`3 427`, `p50 = 357.37`, `iqr = 445.79`, `p90 = 876.34`), `mobile` (`6 857`, `p50 = 309.13`, `iqr = 434.35`, `p90 = 824.31`).
3. **Lección 3 (`refunds` y `orders`):**
   - En `refunds` (`1 450` filas): `AVG(refund_amount_usd) = 221.45`, `MEDIAN(refund_amount_usd) = 150.04`, `STDDEV_SAMP = 215.22`, `p90 = 519.52`, `SKEWNESS = 1.63`. Un intervalo ingenuo $\mu \pm 2s$ produce una cota inferior imposible de `-209.00` USD.
   - Por `store_id <= 5` en `orders`: las 5 tiendas presentan asimetría positiva (`coef_asimetria` entre `0.78` y `1.28`) y una brecha `media - mediana` de entre `68.86` y `83.27` USD.
4. **Lección 4 (`payments` y `orders`):**
   - En `payments` (`19 200` filas, `4 800` por método): `transferencia_spei` falla en `557` intentos (`11.60 %` = `1160 bps`), `efectivo_tienda` en `556` (`11.58 %` = `1158 bps`), `card` en `373` (`7.77 %` = `777 bps`) y `billetera_digital` en `371` (`7.73 %` = `773 bps`). La brecha entre `transferencia_spei` y `billetera_digital` es de `3.87` puntos porcentuales (`387 bps`), lo que equivale a un `50.1 %` más de fallos relativos.
   - En `orders WHERE store_id >= 12` (almacenes): promediar porcentajes fila por fila con `AVG(100.0 * shipping_usd / total_usd)` en `desktop` arroja `0.45 %`, más de 11 veces por encima del peso real `100.0 * SUM(shipping_usd) / SUM(total_usd) = 0.04 %` (`4 bps`).
   - En `orders` por `device_type`: la proporción de pedidos con `status = 'refunded'` es `8.00 %` (`800 bps`) en `desktop`, `7.98 %` (`798 bps`) en `mobile` y `8.05 %` (`805 bps`) en `pos_tienda`.
5. **Lección 5 (`marketing_spend` y `orders`):**
   - En `marketing_spend` (`730` filas): la correlación global `CORR(spend_usd, attributed_conversions)` es `0.912` porque mezcla cinco canales con presupuestos base muy distintos (`paid_social` gasta `432.06` USD de media frente a `96.59` USD en `email_campaign`). Al estratificar por `channel` (el confusor), la correlación dentro de cada canal baja al rango `0.506`–`0.585`.
   - En `orders`: los pedidos con descuento tienen un `subtotal_usd` medio de `365.16` USD, pero eso no significa que el descuento cause carritos grandes: la regla operativa de Mercado Brisa solo activa el descuento de cabecera cuando `subtotal_usd > 80` USD. Al estratificar en el tramo `subtotal_usd > 80`, los pedidos sin descuento tienen un subtotal medio mayor (`436.10` USD frente a `365.16` USD).

---

## 4. Proyecto del módulo y rúbrica verificable (Paso 6)

### Especificación actual en `src/data/catalog/modules.js`
- **Enunciado (`prompt`):** Resumir el importe por pedido y el tiempo de reparto usando percentiles y comparar media frente a mediana.
- **Dataset (`dataset`):** Mercado Brisa (`orders` y `payments`). *(Nota para el orquestador: las columnas de demora en días entre pedido y devolución están en `orders` + `refunds`, mientras que `orders` y `payments` contienen los importes `total_usd` y `amount_usd` y las tasas de fallo en `bps`; se propone en `## Peticiones al orquestador` precisar la mención a `refunds` o tiempos entre intento de cobro y pedido).*
- **Entregable (`deliverable`):** Ficha estadística con 5 indicadores (mediana, media, IQR, `p90`, tasa de reembolso) e interpretación en 150 palabras.

### Rúbrica de evaluación del proyecto (4 criterios verificables, escala 0–4)

| Criterio | 0–1 (Insuficiente) | 2 (En desarrollo) | 3 (Competente) | 4 (Excelente) |
|---|---|---|---|---|
| **1. Exactitud de los 5 indicadores en SQL** | Calcula menos de 3 indicadores o confunde media con mediana. | Calcula los 5 indicadores pero promedia porcentajes con `AVG()` en lugar de `SUM()/SUM()`. | Calcula con exactitud en DuckDB sobre `orders` la media (`426.10` USD), mediana (`350.16` USD), IQR (`454.65` USD), `p90` (`876.17` USD) y tasa de reembolso (`8.00 %` / `800 bps`). | Además de los 5 indicadores globales exactos, desglosa la ficha por `device_type` o `status` verificando que no existan valores `NULL` ni filas duplicadas de `payments`. |
| **2. Diagnóstico de asimetría y dispersión** | Reporta solo la media o usa `AVG ± 2 * STDDEV` sin notar la asimetría. | Menciona que la media supera a la mediana pero no explica por qué ni usa el IQR. | Explica por qué la brecha de `+75.94` USD entre media (`426.10`) y mediana (`350.16`) y el coeficiente `SKEWNESS = 0.98` evidencian asimetría positiva (cola derecha). | Contrasta el rango total (`1912.60` USD) frente al IQR (`454.65` USD) y justifica el uso de `p50` y `p90` para fijar metas operativas y umbrales de revisión. |
| **3. Precisión en proporciones, `pp` y `bps`** | Confunde variación relativa (`%`) con puntos porcentuales (`pp`) o suma tasas entre segmentos. | Reporta la tasa de reembolso o fallo de cobro en porcentaje pero omite el denominador o los puntos base. | Expresa las proporciones con su numerador y denominador explícitos y reporta diferencias entre segmentos en puntos porcentuales (`pp`) y puntos base (`bps`). | Audita la tabla `payments` separando la tasa de fallo por método de pago (`1160 bps` en SPEI frente a `773 bps` en billetera digital, diferencia de `387 bps` y `+50.1 %` relativo). |
| **4. Prevención de falacias causales (150 palabras)** | Atribuye causalidad directa a partir de una correlación o diferencia de medias sin controlar confusores. | Advierte que correlación no es causalidad de forma genérica sin señalar la variable de confusión del caso. | Redacta la interpretación en 120–160 palabras, sin términos prohibidos, identificando al menos un confusor concreto (como `subtotal_usd > 80` en descuentos o `channel` en marketing). | Propone la estratificación SQL exacta para bloquear el confusor y distingue con claridad qué pregunta requiere un experimento controlado A/B antes de tomar una decisión. |
