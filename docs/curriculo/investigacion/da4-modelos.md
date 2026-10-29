# Investigación curricular y diseño pedagógico: `da4-modelos`

**Módulo:** `da4-modelos` — *Modelos estadísticos y pronóstico*  
**Área:** Analista de Datos (`da`) · **Nivel:** 4 (Especialización) · **Duración total:** 120 min (5 lecciones: 25 + 25 + 25 + 25 + 20 min)  
**Prerrequisitos de módulo:** `da3-experimentos` (*Diseño y análisis de experimentos A/B*), `da2-inferencia` (*Probabilidad e inferencia estadística*) y `c2-sql-analitico` (*SQL analítico con funciones de ventana*).

---

## Paso 1. Fuentes primarias verificadas (HTTP 200)

Todas las fuentes citadas en las cinco lecciones y en el glosario fueron consultadas y verificadas con respuesta HTTP `200 OK`:

| # | Lección / Ámbito | Título de la fuente primaria | URL canónica | Estado HTTP | Fecha de acceso |
|---|---|---|---|---|---|
| 1 | L1, Glosario | DuckDB Documentation — *Aggregate Functions (`REGR_SLOPE`, `REGR_INTERCEPT`, `REGR_R2`, `CORR`)* | `https://duckdb.org/docs/stable/sql/functions/aggregates.html` | `200 OK` | `2025-10-15` |
| 2 | L1, Glosario | statsmodels — *Linear Regression (`OLS`, `WLS`, Regression Diagnostics)* | `https://www.statsmodels.org/stable/regression.html` | `200 OK` | `2025-10-15` |
| 3 | L1, Glosario | statsmodels — *`variance_inflation_factor` (Multicollinearity Diagnostics)* | `https://www.statsmodels.org/stable/generated/statsmodels.stats.outliers_influence.variance_inflation_factor.html` | `200 OK` | `2025-10-15` |
| 4 | L1, L2, L5 | James, Witten, Hastie, Tibshirani & Taylor — *An Introduction to Statistical Learning (ISLP)* | `https://www.statlearning.com/` | `200 OK` | `2025-10-15` |
| 5 | L2, Glosario | statsmodels — *Regression with Discrete Dependent Variable (`Logit`, Odds Ratios)* | `https://www.statsmodels.org/stable/discretemod.html` | `200 OK` | `2025-10-15` |
| 6 | L2, Glosario | scikit-learn — *Probability Calibration (`CalibratedClassifierCV`, `brier_score_loss`, Reliability Curves)* | `https://scikit-learn.org/stable/modules/calibration.html` | `200 OK` | `2025-10-15` |
| 7 | L1, L2 | scikit-learn — *Linear Models (`LinearRegression`, `LogisticRegression`, Regularization)* | `https://scikit-learn.org/stable/modules/linear_model.html` | `200 OK` | `2025-10-15` |
| 8 | L3, L4 | Hyndman & Athanasopoulos — *Forecasting: Principles and Practice (3rd ed., fpp3)* | `https://otexts.com/fpp3/` | `200 OK` | `2025-10-15` |
| 9 | L3, Glosario | Hyndman & Athanasopoulos — *fpp3 Chapter 3: Time Series Decomposition* | `https://otexts.com/fpp3/decomposition.html` | `200 OK` | `2025-10-15` |
| 10 | L3, Glosario | Hyndman & Athanasopoulos — *fpp3 Section 3.6: STL Decomposition* | `https://otexts.com/fpp3/stl.html` | `200 OK` | `2025-10-15` |
| 11 | L3, L4, Glosario | DuckDB Documentation — *Window Functions (`AVG OVER`, `LAG`, `ROWS BETWEEN`)* | `https://duckdb.org/docs/stable/sql/functions/window_functions.html` | `200 OK` | `2025-10-15` |
| 12 | L3 | statsmodels — *Time Series Analysis (`tsa`, `seasonal_decompose`, `STL`)* | `https://www.statsmodels.org/stable/tsa.html` | `200 OK` | `2025-10-15` |
| 13 | L4, Glosario | Hyndman & Athanasopoulos — *fpp3 Section 5.8: Evaluating Point Forecast Accuracy (MAE, RMSE, MASE)* | `https://otexts.com/fpp3/accuracy.html` | `200 OK` | `2025-10-15` |
| 14 | L4, Glosario | Hyndman & Athanasopoulos — *fpp3 Section 5.10: Time Series Cross-Validation* | `https://otexts.com/fpp3/tscv.html` | `200 OK` | `2025-10-15` |
| 15 | L4, Glosario | scikit-learn — *Cross-Validation: `TimeSeriesSplit`* | `https://scikit-learn.org/stable/modules/cross_validation.html` | `200 OK` | `2025-10-15` |
| 16 | L5, Glosario | scikit-learn — *Clustering (`KMeans`, `silhouette_score`)* | `https://scikit-learn.org/stable/modules/clustering.html` | `200 OK` | `2025-10-15` |
| 17 | L5, Glosario | scikit-learn — *Preprocessing Data (`StandardScaler`, Z-Score Standardization)* | `https://scikit-learn.org/stable/modules/preprocessing.html` | `200 OK` | `2025-10-15` |

---

## Paso 2. Mapa de conceptos y tabla de progresión del módulo

El módulo `da4-modelos` lleva al analista desde la estimación e interpretación de relaciones lineales y probabilísticas hasta la descomposición de series cronológicas, el pronóstico validado sin fuga del futuro y la segmentación multivariable en escala comparable.

```
[da2-inferencia + da3-experimentos + c2-sql-analitico]
       │
       ▼
L1: Regresión lineal múltiple (OLS, coeficientes parciales, VIF, diagnóstico de residuos)
       │
       ▼
L2: Regresión logística (log-odds, odds ratios e^β, calibración por bandas, puntaje de Brier y umbral)
       │
       ▼
L3: Series temporales (date spine con calendar, tendencia móvil 7d, estacionalidad semanal y residuo)
       │
       ▼
L4: Pronóstico y backtesting (ventana rodante sin fuga temporal, línea base ingenua, MAE, RMSE y MASE)
       │
       ▼
L5: Agrupamiento y perfiles (estandarización z-score, distancia euclidiana, silueta y perfiles RFM)
```

### Tabla de progresión curricular

| Orden | ID de lección | Título corto (`<= 60` car.) | Duración | Prerrequisitos | Conceptos nucleares y fórmulas | Tablas de Mercado Brisa |
|---|---|---|---|---|---|---|
| 1 | `da4-modelos-01-regresion-lineal-multiple` | Regresión lineal múltiple: coeficientes y diagnósticos | 25 min | `da3-experimentos-01-ab-testing-cuped`, `da2-inferencia-05-pruebas-hipotesis-valor-p` | Pendiente e intercepto OLS (`REGR_SLOPE`, `REGR_INTERCEPT`, `REGR_R2`), interpretación *ceteris paribus*, colinealidad ($\text{VIF}_j = \frac{1}{1 - R_j^2}$) y análisis de residuos ($e_i = y_i - \hat{y}_i$, RMSE, homocedasticidad). | `marketing_spend`, `experiment_assignments` |
| 2 | `da4-modelos-02-regresion-logistica-calibracion` | Regresión logística: momios, calibración y umbral | 25 min | `da4-modelos-01-regresion-lineal-multiple`, `da2-inferencia-01-probabilidad-bayes` | Función sigmoide, momios ($\frac{p}{1-p}$), razón de momios ($\text{OR} = e^{\beta}$), calibración por quintiles, puntaje de Brier ($\frac{1}{N}\sum(\hat{p}_i - y_i)^2$) y umbral óptimo por matriz de costes. | `orders`, `refunds`, `customers` |
| 3 | `da4-modelos-03-series-temporales-descomposicion` | Series temporales: tendencia, estacionalidad y residuo | 25 min | `da4-modelos-02-regresion-logistica-calibracion`, `c2-sql-analitico-01-window-functions` | Continuidad cronológica con `calendar`, descomposición aditiva ($Y_t = T_t + S_t + R_t$) vs multiplicativa, media móvil centrada de 7 días y detección de anomalías en el residuo $R_t$. | `calendar`, `orders` |
| 4 | `da4-modelos-04-pronostico-backtesting-mae-mase` | Pronóstico con ventana rodante y métricas MAE y MASE | 25 min | `da4-modelos-03-series-temporales-descomposicion`, `c2-sql-analitico-01-window-functions` | Fuga temporal en validación aleatoria, ventana rodante (`ROWS BETWEEN 4 PRECEDING AND 1 PRECEDING`), referencia ingenua ($\hat{Y}_t = Y_{t-1}$), MAE, RMSE y MASE ($\frac{\text{MAE}_{\text{modelo}}}{\text{MAE}_{\text{ingenuo}}}$). | `orders`, `order_items`, `products`, `calendar` |
| 5 | `da4-modelos-05-clustering-segmentacion-perfiles` | Agrupamiento (clustering) e interpretación de perfiles | 20 min | `da4-modelos-04-pronostico-backtesting-mae-mase`, `da3-producto-02-cohorts-retention-ltv` | Dominancia de escala en distancia euclidiana, estandarización z-score ($z = \frac{x-\bar{x}}{s_x}$), k-medias, coeficiente de silueta y traducción de centroides a perfiles accionables sin sobreajustar $k$. | `customers`, `orders` |

---

## Paso 4. Verificación SQL sobre Parquet de Mercado Brisa (DuckDB)

Se ejecutaron y verificaron en DuckDB (`@duckdb/node-api`) las consultas de ejemplo, casos guiados (`workedExample`) y ejercicios prácticos (`practice`) sobre los archivos Parquet de `public/datasets/`:

1. **Lección 1 (`da4-modelos-01-regresion-lineal-multiple`):**
   - En `marketing_spend` (730 filas, 5 canales $\times$ 146 días), la correlación entre `spend_usd` e `impressions` oscila entre `0.7582` (`display_video`, $\text{VIF} = 2.35$) y `0.8404` (`organic_search`, $\text{VIF} = 3.41$). La pendiente `REGR_SLOPE(clicks, spend_usd)` va de `1.1551` en `paid_social` a `1.3318` en `display_video`.
   - En `experiment_assignments` (9,600 filas, 6 experimentos $\times$ 2 variantes), el ajuste lineal de `post_experiment_spend_usd` sobre `pre_experiment_spend_usd` arroja pendientes estables entre `0.6424` y `0.6610`, $R^2$ entre `0.9343` y `0.9395`, e interceptos superiores en `treatment` (~`19.16`–`21.01` USD) frente a `control` (~`13.31`–`14.27` USD), con RMSE residual entre `4.46` y `4.73` USD.
2. **Lección 2 (`da4-modelos-02-regresion-logistica-calibracion`):**
   - Al cruzar `orders` (`status IN ('completed', 'refunded')`, 16,200 pedidos) con `refunds` (`SELECT DISTINCT order_id FROM refunds`), la tasa de reembolso por `device_type` es `0.0792` en `desktop` (momios `0.0860`), `0.0587` en `pos_tienda` (momios `0.0623`) y `0.0493` en `mobile` (momios `0.0518`).
   - Tomando `mobile` como referencia base, la razón de momios ($\text{OR}$) es `1.6601` para `desktop` ($\ln(\text{OR}) = 0.5069$) y `1.2029` para `pos_tienda` ($\ln(\text{OR}) = 0.1847$).
3. **Lección 3 (`da4-modelos-03-series-temporales-descomposicion`):**
   - Al unir `calendar` (`year = 2024`, 366 días) con `orders` (`status = 'completed'`), se descompone el ingreso diario `ingresos_usd` en tendencia centrada de 7 días (`ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING`), estacionalidad media por `day_of_week` y residuo $R_t = Y_t - T_t - S_t$, identificando el mayor choque positivo el `2024-08-29` (`residuo_usd = 6232.98` USD).
4. **Lección 4 (`da4-modelos-04-pronostico-backtesting-mae-mase`):**
   - Agregando unidades semanales (`SUM(oi.qty)`) por `category` para pedidos completados y productos con `list_price_usd > 0` (excluyendo `SKU-TEST-NEG`), el backtesting por ventana rodante de 4 semanas previas (`ROWS BETWEEN 4 PRECEDING AND 1 PRECEDING`) supera al pronóstico ingenuo `LAG(unidades, 1)` en las 5 categorías: `Suscripciones` ($\text{MASE} = 0.8144$), `Café en grano` ($\text{MASE} = 0.8156$), `Molinos` ($\text{MASE} = 0.8339$), `Cafeteras` ($\text{MASE} = 0.8349$) y `Accesorios` ($\text{MASE} = 0.8583$).
5. **Lección 5 (`da4-modelos-05-clustering-segmentacion-perfiles`):**
   - Sobre los 2,292 clientes con pedidos completados en `customers` + `orders`, la desviación estándar de `gasto_total_usd` (~`1,520` USD) es casi setecientas veces mayor que la de `frecuencia_pedidos` (~`2.2` pedidos). Al estandarizar con puntaje z (`z_recencia`, `z_frecuencia`, `z_gasto`), la segmentación clasifica `404` clientes en `alto_valor_activo` (gasto medio `4,935.00` USD, `z_gasto = 1.4382`), `399` en `en_riesgo_inactividad` (recencia media `361.32` días) y `1,489` en `comprador_regular` (gasto medio `2,240.38` USD).

---

## Paso 5. Términos del glosario (`da4-modelos-glossary.json`)

Se incorporaron 11 términos nuevos en `docs/curriculo/investigacion/da4-modelos-glossary.json`, validados contra `GlossaryListSchema` (`src/data/schema/glossary.js`):

1. `minimos-cuadrados-ordinarios` (*Mínimos cuadrados ordinarios (OLS)*)
2. `factor-inflacion-varianza` (*Factor de inflación de la varianza (VIF)*)
3. `homocedasticidad-residuos` (*Homocedasticidad de residuos*)
4. `razon-de-momios` (*Razón de momios (odds ratio)*)
5. `puntaje-brier-calibracion` (*Puntaje de Brier y calibración de probabilidades*)
6. `descomposicion-serie-temporal` (*Descomposición de serie temporal*)
7. `media-movil-centrada` (*Media móvil de tendencia*)
8. `validacion-ventana-rodante` (*Validación por ventana rodante (backtesting)*)
9. `error-absoluto-escalado-medio` (*Error absoluto escalado medio (MASE)*)
10. `estandarizacion-puntaje-z` (*Estandarización por puntaje z*)
11. `coeficiente-silueta` (*Coeficiente de silueta*)

---

## Paso 6. Especificación del proyecto de módulo y rúbrica (0–4)

### Enunciado del proyecto (`projectSpec`)

- **Título:** Pronóstico semanal de demanda por categoría con evaluación fuera de muestra (MASE)
- **Escenario en Mercado Brisa:** El equipo de operaciones e inventario de Mercado Brisa necesita planificar las compras de café verde, empaques y equipamiento para las próximas 4 semanas en sus cinco categorías (`Café en grano`, `Cafeteras`, `Molinos`, `Accesorios` y `Suscripciones`). Actualmente reponen inventario copiando las ventas de la última semana, lo que provoca quiebres de stock tras semanas promocionales y sobreinventario después de picos puntuales.
- **Tablas requeridas:** `orders`, `order_items`, `products`, `calendar`.
- **Entregable técnico:**
  1. Construcción de la serie semanal continua de unidades (`SUM(qty)`) e ingresos por `category`, filtrando `orders.status = 'completed'` y saneando `products.list_price_usd > 0` (excluyendo `SKU-TEST-NEG`).
  2. Descomposición de tendencia y estacionalidad para distinguir semanas atípicas genuinas (`residuo`) de variaciones normales del calendario.
  3. Evaluación comparativa mediante validación por ventana rodante (*backtesting*) sin fuga de datos futuros entre tres enfoques: pronóstico ingenuo ($Y_{t-1}$), media móvil de 4 semanas (`ROWS BETWEEN 4 PRECEDING AND 1 PRECEDING`) y regresión lineal temporal por ventana.
  4. Tabla resumen de exactitud fuera de muestra reportando `MAE`, `RMSE` y `MASE` por categoría, acompañada de una recomendación operativa de abastecimiento para las próximas 4 semanas.

### Rúbrica de evaluación (4 criterios, escala 0–4)

| Criterio | 0 — No entregado / Inválido | 1 — Insuficiente | 2 — Básico | 3 — Competente | 4 — Excelente |
|---|---|---|---|---|---|
| **1. Higiene de serie temporal y grano semanal** | No construye la serie semanal o mezcla pedidos cancelados y SKUs de prueba negativos. | Agrupa ventas sin filtrar `status = 'completed'` o incluye `SKU-TEST-NEG` (`list_price_usd < 0`), distorsionando ingresos y conteos. | Filtra pedidos completados y SKUs válidos, pero omite el cruce con el calendario o deja huecos temporales sin documentar. | Construye la serie semanal limpia por categoría con grano `(category, semana)` verificado y sin duplicación por `JOIN`. | Garantiza continuidad cronológica con `calendar`, sanea valores centinela, verifica unicidad de clave semanal y documenta el rango de fechas evaluado. |
| **2. Prevención de fuga temporal en ventana rodante** | Evalúa el modelo sobre los mismos datos de ajuste o incluye la fila actual (`CURRENT ROW`) o filas futuras (`FOLLOWING`) en el pronóstico. | Utiliza promedios globales de toda la tabla para imputar o predecir semanas pasadas, introduciendo fuga del futuro. | Usa `LAG` para el modelo ingenuo pero incluye la semana actual en la media móvil (`ROWS BETWEEN 3 PRECEDING AND CURRENT ROW`). | Define correctamente el marco `ROWS BETWEEN 4 PRECEDING AND 1 PRECEDING` particionado por categoría y ordenado cronológicamente. | Implementa la ventana rodante estrictamente sobre el pasado disponible, exige ventana completa (`semanas_previas = 4`) y demuestra ausencia total de fuga temporal. |
| **3. Rigor en métricas fuera de muestra (MAE, RMSE y MASE)** | No calcula métricas de error o solo reporta $R^2$ dentro de muestra. | Calcula el error medio con signo (donde positivos y negativos se cancelan) en lugar de `ABS` o error cuadrático. | Calcula `MAE` y `RMSE` correctamente, pero omite la comparación contra el pronóstico ingenuo mediante `MASE`. | Calcula `MAE`, `RMSE` y `MASE` por categoría usando `NULLIF` en el denominador e interpreta cuándo $\text{MASE} < 1$. | Reporta `MAE`, `RMSE` y `MASE` con precisión, contrasta el castigo cuadrático del `RMSE` ante picos y justifica qué modelo gana en cada categoría. |
| **4. Traducción operativa a decisiones de inventario** | Entrega código SQL sin interpretación ni recomendación para compras. | Describe los números de la tabla sin conectar el error de pronóstico con el riesgo de quiebre o sobreinventario. | Recomienda un modelo global sin matizar diferencias de volatilidad entre `Suscripciones` y `Accesorios`. | Traduce el `MAE` y el `RMSE` en márgenes de seguridad de unidades por categoría para las próximas 4 semanas. | Formula una política diferenciada por categoría (reposición base con media móvil más colchón de seguridad proporcional al `RMSE` y alerta sobre residuos extremos). |
