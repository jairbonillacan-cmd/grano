# Investigación curricular y diseño del módulo `c0-negocio`

- **Módulo:** `c0-negocio` — *Negocio para gente de datos*
- **Área y nivel:** Tronco común (`core`) · Nivel `0` (Cimientos)
- **Objetivo del módulo:** Calcular ingreso, costo, margen y tasas de conversión para traducir preguntas de negocio en indicadores medibles.
- **Prerrequisitos de módulo:** Ninguno (`[]`, punto de entrada de negocio en Nivel 0).
- **Lecciones del módulo (70 minutos totales):**
  1. `c0-negocio-01-ingreso-costo-margen` (20 min) — *Ingreso bruto, descuentos, devoluciones y margen bruto*
  2. `c0-negocio-02-embudos-conversion` (15 min) — *Embudos de adquisición y conversión paso a paso*
  3. `c0-negocio-03-kpi-metrica-vanidad` (20 min) — *Qué hace útil a un KPI frente a una métrica de vanidad*
  4. `c0-negocio-04-pregunta-a-decision` (15 min) — *De la pregunta ambigua a la decisión respaldada por datos*

---

## 1. Investigación de fuentes por lección (Paso 1)

### Lección 1: `c0-negocio-01-ingreso-costo-margen`

| # | Tipo | Título y editorial | URL | Consultado | Qué afirmación respalda en la lección |
|---|---|---|---|---|---|
| 1 | Primaria (norma contable) | *IFRS 15 — Revenue from Contracts with Customers* · IFRS Foundation / IASB | https://www.ifrs.org/issued-standards/list-of-standards/ifrs-15-revenue-from-contracts-with-customers/ | `2026-10-29` | El ingreso se reconoce cuando se transfiere el control del bien (`status = 'completed'`), se mide neto de descuentos comerciales y devoluciones esperadas, y excluye los impuestos recaudados en nombre de terceros (`tax_usd`). |
| 2 | Primaria (referencia de modelado) | *Additive, Semi-Additive, and Non-Additive Facts* · Kimball Group (Ralph Kimball & Margy Ross) | https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/additive-semi-additive-non-additive-facts/ | `2026-10-29` | Los importes monetarios (ingreso neto, costo directo, margen en dólares) son hechos aditivos, mientras que el porcentaje de margen bruto es un hecho no aditivo que debe calcularse sumando numerador y denominador antes de dividir (`SUM(margen_usd) / SUM(ingreso_usd)`), nunca con `AVG(margen_pct)`. |
| 3 | Primaria (documentación técnica) | *DuckDB SQL Aggregate Functions Reference* · DuckDB Foundation | https://duckdb.org/docs/sql/functions/aggregates.html | `2026-10-29` | Comportamiento de `SUM`, `AVG`, `COUNT` y `COALESCE` al consolidar líneas de pedido (`order_items`) y devoluciones pre-agregadas (`refunds`) en DuckDB. |

### Lección 2: `c0-negocio-02-embudos-conversion`

| # | Tipo | Título y editorial | URL | Consultado | Qué afirmación respalda en la lección |
|---|---|---|---|---|---|
| 1 | Primaria (documentación de producto) | *Interpret your Funnel Analysis: Conversion Rate, Drop-off & Time to Convert* · Amplitude Documentation | https://amplitude.com/docs/analytics/charts/funnel-analysis/funnel-analysis-interpret | `2026-10-29` | Definición matemática de conversión paso a paso (*step-to-step conversion*), conversión acumulada global (*overall conversion*), tasa de caída (*drop-off*) y exigencia de una unidad de conteo única (sesión o usuario) a lo largo de todas las etapas. |
| 2 | Primaria (documentación oficial) | *GA4 Funnel Exploration: Open vs. Closed Funnels* · Google Analytics Help / Google | https://support.google.com/analytics/answer/9327974 | `2026-10-29` | Diferencia entre embudos cerrados (el usuario debe entrar por el paso 1) y embudos abiertos (puede entrar en un paso intermedio, lo que distorsiona las tasas si se mezclan sin filtro de entrada). |
| 3 | Primaria (documentación SQL) | *DuckDB FILTER Clause in Aggregate Expressions* · DuckDB Foundation | https://duckdb.org/docs/sql/query_syntax/filter.html | `2026-10-29` | Sintaxis estándar SQL `COUNT(DISTINCT col) FILTER (WHERE condicion)` para calcular etapas de un embudo en una sola pasada sin duplicar conteos por reintentos de red. |

### Lección 3: `c0-negocio-03-kpi-metrica-vanidad`

| # | Tipo | Título y editorial | URL | Consultado | Qué afirmación respalda en la lección |
|---|---|---|---|---|---|
| 1 | Primaria (libro de referencia) | *Key Performance Indicators: Developing, Implementing, and Using Winning KPIs (4th Edition)* · David Parmenter (John Wiley & Sons) | https://www.wiley.com/en-us/Key+Performance+Indicators+%28KPI%29%3A+Developing%2C+Implementing%2C+and+Using+Winning+KPIs%2C+4th+Edition-p-9781119620778 | `2026-10-29` | Separación entre indicadores de resultado histórico (KRIs), indicadores operativos (PIs) y KPIs vinculados a una acción concreta, un propietario y una cadencia de revisión definida. |
| 2 | Primaria (libro de referencia) | *Trustworthy Online Controlled Experiments: A Practical Guide to A/B Testing* · Ron Kohavi, Diane Tang & Ya Xu (Cambridge University Press) | https://experimentguide.com/ | `2026-10-29` | Necesidad de emparejar toda métrica objetivo de éxito con métricas guardia (*guardrail metrics*, como tasa de reembolso o cancelación) para impedir que la optimización de volumen destruya valor neto. |
| 3 | Primaria (documentación técnica) | *dbt Semantic Layer & MetricFlow Specification* · dbt Labs | https://docs.getdbt.com/docs/use-dbt-semantic-layer/dbt-sl | `2026-10-29` | Especificación formal de una métrica gobernada: fórmula explícita (numerador y denominador), grano de entidad, dimensión temporal de corte y filtros de exclusión. |

### Lección 4: `c0-negocio-04-pregunta-a-decision`

| # | Tipo | Título y editorial | URL | Consultado | Qué afirmación respalda en la lección |
|---|---|---|---|---|---|
| 1 | Primaria (estándar metodológico) | *CRISP-DM 1.0 Guide — Phase 1: Business Understanding* · IBM Documentation / CRISP-DM Consortium | https://www.ibm.com/docs/en/spss-modeler/saas?topic=dm-crisp-help-overview | `2026-10-29` | Conversión de un problema de negocio vago en objetivos analíticos medibles, criterios de éxito cuantificables y declaración explícita de supuestos y restricciones antes de consultar datos. |
| 2 | Primaria (libro de referencia) | *Trustworthy Online Controlled Experiments — Hypothesis Testing & Decision Thresholds* · Ron Kohavi, Diane Tang & Ya Xu (Cambridge University Press) | https://experimentguide.com/ | `2026-10-29` | Definición previa de la regla de decisión (umbral mínimo de efecto e integridad muestral como chequeo de sesgo SRM) para evitar cambiar el criterio después de ver los datos. |
| 3 | Primaria (referencia de modelado) | *Dimensional Modeling Techniques — Business Process, Grain & Bus Matrix* · Kimball Group | https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/ | `2026-10-29` | Descomposición de un indicador global por dimensiones de negocio (categoría, segmento de cliente, motivo de devolución, tienda) para aislar dónde actuar. |

---

## 2. Mapa de conceptos y progresión del módulo (Paso 2)

El módulo `c0-negocio` no requiere conocimientos previos de programación ni de modelado avanzado: parte de cero y construye el vocabulario cuantitativo que luego consumen `c1-sql-base`, `c1-sql-joins`, `c2-dimensional`, `da3-producto` y `bi2-metricas`.

| Orden | ID de lección | Qué asume del alumno | Conceptos nuevos que introduce | Tablas de Mercado Brisa | Conexión hacia adelante |
|---|---|---|---|---|---|
| 1 | `c0-negocio-01-ingreso-costo-margen` | Aritmética básica (suma, resta, división, porcentaje) y noción intuitiva de fila y columna. | **Ingreso bruto** (`gross revenue`), descuentos de línea y cabecera, **devoluciones** (`refunds`), exclusión de impuestos recaudados (`tax_usd`), **ingreso neto** (`net revenue`), **costo directo** (`COGS`), **margen bruto** en dólares y en porcentaje, y por qué un porcentaje de margen es **no aditivo** (`SUM/SUM` frente a `AVG`). | `orders`, `order_items`, `products`, `refunds` | Prepara la reconciliación sin fan-out en `c1-sql-joins-02` y los hechos no aditivos en `c2-dimensional-04`. |
| 2 | `c0-negocio-02-embudos-conversion` | Diferencia entre pedido creado, cobrado y completado (vista en la lección 01). | **Embudo de conversión** (`funnel`), **unidad de conteo única** (sesión o cliente frente a eventos brutos con reintentos), **conversión paso a paso**, **conversión global**, **tasa de caída** (`drop-off`) y diferencia entre embudo cerrado y abierto. | `events`, `orders`, `payments`, `marketing_spend` | Prepara `COUNT(DISTINCT)` y `FILTER` en `c1-sql-base-07` y embudos por ventana temporal en `da3-producto-01`. |
| 3 | `c0-negocio-03-kpi-metrica-vanidad` | Cálculo de ingreso neto, margen bruto (lección 01) y tasas de conversión de un embudo (lección 02). | **Métrica de vanidad** (`vanity metric`), **KPI** (*Key Performance Indicator*), anatomía de un KPI (fórmula, grano, ventana temporal, filtro canónico y umbral de acción), **costo por adquisición** (`CPA`) y **métrica guardia** (`guardrail metric`). | `marketing_spend`, `orders`, `refunds` | Prepara el diseño de árboles de KPIs y métricas guardia en `bi2-metricas` y `da3-experimentos`. |
| 4 | `c0-negocio-04-pregunta-a-decision` | Distinción entre métrica de vanidad, KPI accionable y métrica guardia (lección 03). | Traducción de **pregunta ambigua** a **hipótesis refutable**, descomposición dimensional para aislar causas raíz, **regla de decisión con umbral** (*decision threshold*) y validación de integridad muestral antes de decidir. | `orders`, `order_items`, `products`, `customers`, `experiments`, `experiment_assignments` | Prepara el método exploratorio en `da2-eda-01`, la evaluación experimental en `da3-experimentos-01` y los memos ejecutivos en `da4-causalidad-04`. |

> **Verificación de dependencias:** Ninguna lección de `c0-negocio` asume conceptos que no se hayan explicado en la propia lección o en la inmediata anterior del módulo. Cuando aparece SQL, se explica qué hace cada cláusula (`SUM`, `COUNT(DISTINCT)`, `FILTER`, `GROUP BY`) sobre el resultado tangible de negocio.

---

## 3. Verificación empírica sobre Mercado Brisa en DuckDB (Paso 4)

Todas las cifras utilizadas en el texto, ejemplos guiados y prácticas provienen de la ejecución real con `@duckdb/node-api` sobre `public/datasets/*.parquet` (semilla `19870315`):

1. **Desglose de `orders` (18 000 filas) por `status`:**
   - `completed`: `14 760` pedidos · `subtotal_usd = 5 464 151.18` · `discount_usd = 59 761.41` · `tax_usd = 864 702.15` · `total_usd = 6 269 462.42`.
   - `refunded`: `1 440` pedidos · `subtotal_usd = 527 078.60` · `discount_usd = 5 543.99` · `total_usd = 605 025.58`.
   - `cancelled`: `1 080` pedidos · `subtotal_usd = 424 380.27` (incluye 15 pedidos de calibración POS con `product_id = 180` y precio `-9.99`).
   - `pending`: `720` pedidos · `subtotal_usd = 266 854.26`.
2. **Margen bruto por categoría en pedidos completados (`orders` + `order_items` + `products`):**
   - `Molinos`: ingreso líneas `2 163 162.27` USD, costo directo `1 235 089.04` USD, margen bruto `928 073.23` USD (`42.90 %`).
   - `Cafeteras`: ingreso líneas `1 643 366.45` USD, costo directo `861 476.10` USD, margen bruto `781 890.35` USD (`47.58 %`).
   - `Accesorios`: ingreso líneas `586 859.56` USD, costo directo `246 528.02` USD, margen bruto `340 331.54` USD (`57.99 %`).
   - `Suscripciones`: ingreso líneas `657 384.31` USD, costo directo `319 166.57` USD, margen bruto `338 217.74` USD (`51.45 %`).
   - `Café en grano`: ingreso líneas `413 378.59` USD, costo directo `184 902.58` USD, margen bruto `228 476.01` USD (`55.27 %`).
   - *Hallazgo pedagógico central de la Lección 1:* `Suscripciones` factura `70 524.75` USD más que `Accesorios`, pero `Accesorios` genera `2 113.80` USD más de margen bruto en caja gracias a su margen del `57.99 %`.
3. **Embudos y duplicados en `events`, `orders`, `payments` y `marketing_spend`:**
   - En `events` (65 000 filas), cada uno de los 5 tipos de evento tiene exactamente `240` filas duplicadas por reintento de red (`1 200` duplicados en total): `add_to_cart`, `checkout_started` y `checkout_completed` pasan de `15 400` eventos brutos a `15 160` sesiones únicas (`COUNT(DISTINCT session_id)`).
   - En `orders` + `payments` por `device_type`:
     - `desktop`: `7 716` pedidos creados → `6 944` pagos capturados (`89.99 %`) → `6 327` pedidos retenidos (`91.11 %` del paso anterior; `82.00 %` global).
     - `mobile`: `6 857` pedidos creados → `6 171` pagos capturados (`90.00 %`) → `5 624` pedidos retenidos (`91.14 %` del paso anterior; `82.02 %` global).
     - `pos_tienda`: `3 427` pedidos creados → `3 085` pagos capturados (`90.02 %`) → `2 809` pedidos retenidos (`91.05 %` del paso anterior; `81.97 %` global).
4. **Métricas de vanidad frente a KPIs en `marketing_spend` y campañas (`orders` + `refunds`):**
   - En `marketing_spend`: `paid_social` lidera en impresiones (`3 213 897`) con `CPA = 13.93` USD, mientras que `referral` tiene el menor `CPA` (`13.59` USD) y la mayor conversión de clic a compra (`5.76 %`).
   - En `orders` cruzado con `refunds` pre-agregado: las cuatro campañas (`CMP-ORIGEN`, `CMP-VERANO`, `CMP-RETENCION`, `CMP-BARISTA`) empatan en `3 000` pedidos brutos cada una, pero `CMP-RETENCION` y `CMP-VERANO` sufren tasas de reembolso del `19.18 %` y `18.46 %`, haciendo que `CMP-ORIGEN` (`428 392.93` USD netos) supere en `65 332.18` USD a `CMP-VERANO` (`363 060.75` USD netos).
5. **De la pregunta ambigua a la decisión en `orders`, `customers` y `experiments`:**
   - Comparación de pedidos completados con y sin descuento de cabecera (`discount_usd > 0`): los pedidos con descuento (`3 264`) tienen un subtotal medio menor (`366.18` USD frente a `371.34` USD sin descuento) y su margen bruto medio cae `21.65` USD por pedido (`156.39` USD frente a `178.04` USD).
   - Comparación por `segment` en `customers`: `cafeteria_b2b` tiene menos pedidos completados (`2 591`), pero el ticket neto medio más alto (`439.05` USD frente a `353.65` USD en `retail` y `347.75` USD en `pro_barista`).

---

## 4. Proyecto del módulo y rúbrica verificable (Paso 6)

### Especificación actual en `src/data/catalog/modules.js`
- **Prompt:** Construir el embudo de compra desde visita web hasta pedido entregado y definir los indicadores financieros del mes.
- **Dataset:** `Mercado Brisa (events, orders, order_items y refunds)`
- **Deliverable:** Documento con el diagrama del embudo de 4 etapas y la ficha formal de 3 KPIs (fórmula, grano y umbral de acción).

### Rúbrica verificable de 4 criterios (escala 0–4) propuesta para `c0-negocio`

| Criterio | 0–1 (Insuficiente) | 2 (Básico) | 3 (Sólido — Nivel esperado) | 4 (Excelente) |
|---|---|---|---|---|
| **1. Reconciliación de ingreso neto y margen bruto** | Suma `total_usd` sin filtrar pedidos cancelados/pendientes o une `refunds` sin pre-agregar, inflando el ingreso. | Filtra `status = 'completed'`, pero olvida restar descuentos o calcula el margen porcentual con `AVG()`. | Pre-agrega `refunds` por `order_id`, excluye `tax_usd` y pedidos `cancelled`/`pending`, y calcula el margen bruto ponderado (`SUM(margen_usd) / SUM(ingreso_usd)`). | Además de reconciliar al centavo, desglosa por categoría o dispositivo y documenta el impacto de los 15 pedidos de prueba con `SKU-TEST-NEG`. |
| **2. Construcción del embudo de conversión** | Cuenta filas brutas (`COUNT(*)`) en `events` o `payments` incluyendo los 1 200 eventos duplicados o reintentos fallidos. | Usa `COUNT(DISTINCT)` pero reporta solo la conversión global sin calcular las tasas paso a paso ni la caída entre etapas. | Construye el embudo sobre una unidad única (`session_id` o `order_id`) y reporta conteo, conversión paso a paso y conversión acumulada en cada etapa. | Compara el embudo entre cortes (`device_type` o `channel`), identifica el cuello de botella exacto y cuantifica cuántas conversiones se pierden en ese paso. |
| **3. Ficha formal de 3 KPIs y métricas guardia** | Propone métricas de vanidad (impresiones acumuladas, pedidos brutos totales) sin denominador ni umbral de acción. | Define 3 tasas o razones válidas, pero omite el grano, los filtros de exclusión o las métricas guardia. | Documenta 3 KPIs completos (fórmula con numerador/denominador, grano, filtro canónico, umbral de alerta) e incluye al menos 1 métrica guardia por KPI. | Vincula cada KPI con su consulta SQL reproducible en DuckDB sobre Mercado Brisa y demuestra cómo la métrica guardia detecta el deterioro de `CMP-VERANO` y `CMP-RETENCION`. |
| **4. Regla de decisión respaldada por datos** | Emite una opinión genérica ("mejorar el marketing") sin umbral numérico ni corte dimensional. | Formula una recomendación ligada a un indicador, pero no especifica qué condición cuantitativa la activa o la descarta. | Traduce una pregunta ambigua de dirección en una hipótesis refutable con umbral explícito ("si el margen bruto cae más de 2 puntos porcentuales, retirar el cupón"). | Cuantifica en dólares el impacto esperado de la decisión sobre Mercado Brisa y explicita los riesgos o supuestos de validez (como sesgo SRM o estacionalidad). |
