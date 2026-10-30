# W-da4-modelos · Modelos estadísticos y pronóstico

- **Agente:** `W-da4-modelos` (Escritor del módulo `da4-modelos`: *"Modelos estadísticos y pronóstico"*, Nivel 4, Track `da` — Fase 3, Oleada C)
- **Rama y worktree:** `agente/W-da4-modelos` en `C:\Users\T490s\Desktop\Proyectos\ING-W-da4-modelos`
- **Puerto de verificación Vite:** `5227` (`http://localhost:5227`)

---

## Inicio

- **Archivos leídos (uno por línea, con un dato concreto aprendido de cada uno):**
  - `PLAN_GEMINI_4_ARGON.md`: verifiqué las reglas comunes (§1), el contrato anti-pereza (§2), el alcance de `da4-modelos` (§5, 5 lecciones: regresión lineal múltiple, regresión logística y calibración, descomposición de series temporales, pronóstico con backtesting y MAE/MASE, clustering y perfiles), el flujo de 7 pasos del escritor (§9.2), la rúbrica de 8 criterios (§9.4), el esquema de lección v2 (Apéndice A) y la guía de estilo (Apéndice B).
  - `src/data/catalog/modules.js`: comprobé el registro del módulo `da4-modelos` (`level: 4`, `track: 'da'`, `prerequisites: ['da3-experimentos', 'da3-producto']`, `estimatedMinutes: 120`), los IDs de catálogo de sus 5 lecciones (`da4-modelos-01` a `05`) y su proyecto integrador *"Construir y evaluar un pronóstico semanal de demanda por categoría en Mercado Brisa contra una referencia simple"*.
  - `src/data/schema/lesson.js`: confirmé que `LessonSchema` (Zod v4) exige `contentVersion: 2`, `moduleId`, `tracks`, `level`, `order`, `minutes` (`10..40`), `sections[].body` (`80..250` palabras), `checks[].type` (`'mcq' | 'predict-output' | 'order' | 'fill-code' | 'code-Locate'`), `practice.expected`, `practice.solutionExplanation`, `practice.expectedOutputTable`, `roleNotes` (`25..60` palabras por rol), `flashcards[].id` y `sources[].supports`.
  - `src/data/schema/glossary.js`: verifiqué que `GlossaryListSchema` exige términos con `id` en kebab-case, `definition` de `20..60` palabras, `example` obligatorio, `relatedLessons` y `sources` con `title`, `url` (`https://`), `publisher`, `accessed` y `supports`.
  - `public/datasets/README.md`: revisé el proceso generador determinista de *Mercado Brisa* (semilla `20260419`, `18 000` pedidos en `orders`, `42 661` líneas en `order_items`, `1 260` reembolsos en `refunds`, `1 096` días en `calendar` `2023-01-01` a `2025-12-31`, y `1` SKU de prueba con `list_price_usd = -15.00`).
  - `public/datasets/schema.json`: comprobé los nombres y tipos exactos de columnas en Parquet (`orders.total_usd`, `orders.discount_usd`, `orders.shipping_usd`, `orders.device_type`, `orders.status`, `order_items.qty`, `products.list_price_usd`, `products.category`, `calendar.calendar_date`, `calendar.day_of_week`, `calendar.day_name`, `refunds.order_id`).
  - `src/data/lessons/da2-inferencia/da2-inferencia-01-probabilidad-bayes.js`: verifiqué cómo se introducen momios y probabilidades condicionales en Nivel 2 para conectar con la transformación logit y las razones de momios (*odds ratios*) en `da4-modelos-02`.
  - `src/data/lessons/da3-experimentos/da3-experimentos-01-ab-testing-cuped.js`: revisé el uso de `REGR_SLOPE` y ajuste lineal de covariables en Nivel 3 para construir sobre esa base la regresión múltiple, la paradoja de Simpson y el diagnóstico de residuos en `da4-modelos-01`.
  - `src/data/lessons/da3-producto/da3-producto-02-cohorts-retention-ltv.js`: comprobé cómo se calculan recencia, frecuencia y valor monetario por cohorte en Nivel 3 para enlazar con la estandarización en escala $z$ y el agrupamiento de perfiles en `da4-modelos-05`.
  - `scripts/check-content.mjs`: constaté que valida tanto `LessonSchema` como el conteo de palabras visibles (`700..1600` para Nivel 4) y la existencia de IDs en `prerequisites`.
  - `scripts/check-copy.mjs`: verifiqué la lista de términos prohibidos (`"robusto"`, `"crucial"`, `"fundamental"`, `"tríada"`, `"domina"`, `"clave"`), el límite de `<= 3` negritas por párrafo y el límite de `<= 22` palabras/frase de media en `sections[].body`.
  - `server/ai/contextBuilder.js` y `server/ai/agyRunner.js`: comprobé que `buildContextPrompt` ensambla el contexto de la lección (`objectives`, `sectionBody`, `aiNotes`, `schemaSummary`) y `runAgyPrompt` invoca `agy --model gemini-3.8-flash-low --sandbox --disable-slash-commands` por `stdin`.
- **Estado encontrado:** el directorio `src/data/lessons/da4-modelos/` no existía y las 5 lecciones de `da4-modelos` figuraban con `status: 'planned'` en `src/data/catalog/modules.js`.

---

## Pasos

### Paso 1 — Investigación (`docs/curriculo/investigacion/da4-modelos.md`)
- **Qué hice:** ejecuté búsquedas web (`search_web`) y verifiqué con peticiones HTTP reales (`200 OK`) 17 URLs de documentación técnica y fuentes primarias con fecha de consulta `2026-04-19`:
  1. **Gareth James, Daniela Witten, Trevor Hastie, Robert Tibshirani & Jonathan Taylor (2023)**, *An Introduction to Statistical Learning (ISLP, 2nd Ed.)*, Springer (`https://www.statlearning.com/`) — respalda coeficientes parciales *ceteris paribus*, heterocedasticidad, multicolinealidad (VIF), regresión logística, razones de momios y agrupamiento $k$-medias.
  2. **Rob J. Hyndman & George Athanasopoulos (2021)**, *Forecasting: Principles and Practice (3rd Ed., fpp3)*, OTexts (`https://otexts.com/fpp3/`, `https://otexts.com/fpp3/decomposition.html`, `https://otexts.com/fpp3/tscv.html`, `https://otexts.com/fpp3/accuracy.html`) — respalda descomposición en tendencia-ciclo, estacionalidad y residuo ($Y_t = T_t + S_t + R_t$), validación por origen de pronóstico rodante (*backtesting*), líneas base (*naive*, *seasonal naive*) y métricas MAE, RMSE y MASE.
  3. **Rob J. Hyndman & Anne B. Koehler (2006)**, *"Another look at measures of forecast accuracy"*, *International Journal of Forecasting* (`https://robjhyndman.com/papers/mase.pdf`) — respalda la formulación original del MASE y las limitaciones matemáticas del MAPE ante ceros y errores asimétricos.
  4. **Scikit-learn User Guide v1.6 — Probability Calibration & Clustering** (`https://scikit-learn.org/stable/modules/calibration.html`, `https://scikit-learn.org/stable/modules/clustering.html`) — respalda curvas de calibración por cuantiles, puntaje de Brier ($BS = \frac{1}{n}\sum (\hat{p}_i - y_i)^2$), umbral óptimo bajo costes asimétricos, inercia intra-grupo y coeficiente de silueta.
  5. **Statsmodels Documentation v0.14 — OLS, Logit & Time Series (`tsa`)** (`https://www.statsmodels.org/stable/regression.html`, `https://www.statsmodels.org/stable/discretemod.html`, `https://www.statsmodels.org/stable/tsa.html`) — respalda inferencia en MCO, estimación por máxima verosimilitud en modelos logit y descomposición de series temporales.
  6. **DuckDB Documentation v1.2 — Statistical Aggregates & Window Functions** (`https://duckdb.org/docs/stable/sql/functions/aggregates.html`, `https://duckdb.org/docs/stable/sql/functions/window_functions.html`) — respalda `REGR_SLOPE`, `REGR_INTERCEPT`, `REGR_R2`, `CORR`, `STDDEV_SAMP`, `LAG`, `NTILE` y marcos `ROWS BETWEEN`.
- **Archivos y líneas:** `docs/curriculo/investigacion/da4-modelos.md` (líneas 1–285).
- **Evidencia:** archivo creado con tabla de 17 URLs verificadas (`HTTP 200 OK`) y trazabilidad fuente ↔ lección ↔ afirmación.

### Paso 2 — Mapa de conceptos del módulo
- **Qué hice:** tracé la progresión conceptual entre las 5 lecciones verificando que ningún concepto se utilice antes de haberse definido:
  - **L01 (`da4-modelos-01-regresion-lineal-multiple`):** asume correlación/confusores (`c0-numeros-05`) y regresión simple/CUPED (`da3-experimentos-01`); introduce pendiente parcial *ceteris paribus*, paradoja de Simpson por omisión de estrato, coeficiente de determinación $R^2$ frente a $R^2$ ajustado, residuos ($e_i = y_i - \hat{y}_i$), heterocedasticidad y factor de inflación de la varianza ($\text{VIF}_j = \frac{1}{1 - R_j^2}$).
  - **L02 (`da4-modelos-02-regresion-logistica-calibracion`):** asume L01 y probabilidad/momios (`da2-inferencia-01`); introduce momios (*odds*), transformación logit, función sigmoide ($\sigma(z) = \frac{1}{1 + e^{-z}}$), razón de momios ($\text{OR}_j = e^{\beta_j}$), calibración por bandas (`NTILE`), puntaje de Brier y umbral óptimo según costes asimétricos ($\tau^* = \frac{C_{\text{FP}}}{C_{\text{FP}} + C_{\text{FN}}}$).
  - **L03 (`da4-modelos-03-series-temporales-descomposicion`):** asume L02 y funciones de ventana (`c2-sql-analitico-01`); introduce continuidad temporal sobre `calendar`, descomposición aditiva ($Y_t = T_t + S_t + R_t$) y multiplicativa, tendencia por media móvil centrada de 7 días (`ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING`), índice estacional por día de la semana y aislamiento del residuo para detección de choques operativos.
  - **L04 (`da4-modelos-04-pronostico-backtesting-mae-mase`):** asume L03 y funciones de ventana (`c2-sql-analitico-01`); introduce prevención de fuga del futuro (*data leakage*), validación por ventana rodante (*backtesting* con `ROWS BETWEEN k PRECEDING AND 1 PRECEDING`), líneas base obligatorias (*naive* con `LAG` e ingenuo estacional), MAE, RMSE y el error absoluto escalado medio ($\text{MASE} = \frac{\text{MAE}_{\text{modelo}}}{\text{MAE}_{\text{ingenuo}}}$).
  - **L05 (`da4-modelos-05-clustering-segmentacion-perfiles`):** asume L04 y métricas RFM/LTV (`da3-producto-02`); introduce distancia euclidiana, sesgo de escala por disparidad de varianzas, estandarización por puntaje $z$ (`(x - AVG(x) OVER ()) / STDDEV_SAMP(x) OVER ()`), inercia intra-grupo, coeficiente de silueta y traducción de centroides a perfiles operativos accionables.
- **Archivos y líneas:** `docs/curriculo/investigacion/da4-modelos.md` (sección `## Paso 2 — Mapa de conceptos del módulo`) y arrays `prerequisites` y `glossaryTerms` de las 5 lecciones.
- **Evidencia:** `node scripts/check-content.mjs --module da4-modelos` valida los prerrequisitos y referencias cruzadas con `0` errores.

### Paso 3 — Escritura de las 5 lecciones (`src/data/lessons/da4-modelos/*.js`)
- **Qué hice:** redacté las 5 lecciones completas siguiendo el orden de diseño pedagógico (`objectives` → `checks` → `sections` → `workedExample` → `practice` → `hook` → `summary` → `flashcards` → `roleNotes` → `sources` → `aiNotes`) y las reglas de estilo del Apéndice B (longitud media de frase entre `15.5` y `19.6` palabras/frase, cero términos prohibidos, máximo 3 negritas por párrafo).
- **Archivos y líneas:**
  1. `src/data/lessons/da4-modelos/da4-modelos-01-regresion-lineal-multiple.js` (líneas 1–412)
  2. `src/data/lessons/da4-modelos/da4-modelos-02-regresion-logistica-calibracion.js` (líneas 1–363)
  3. `src/data/lessons/da4-modelos/da4-modelos-03-series-temporales-descomposicion.js` (líneas 1–464)
  4. `src/data/lessons/da4-modelos/da4-modelos-04-pronostico-backtesting-mae-mase.js` (líneas 1–406)
  5. `src/data/lessons/da4-modelos/da4-modelos-05-clustering-segmentacion-perfiles.js` (líneas 1–316)
- **Evidencia:** `check-content.mjs --module da4-modelos` reporta `5 válidas | 0 con advertencias | 0 con errores` y `check-copy.mjs --path src/data/lessons/da4-modelos` reporta `0 hallazgos`.

### Paso 4 — Ejecución de todo SQL contra Mercado Brisa en DuckDB
- **Qué hice:** ejecuté las 15 consultas SQL de las 5 lecciones (`sections[0].example`, `workedExample.steps[0..1]` y `practice.solution` + `practice.starterCode`) contra los archivos Parquet reales de *Mercado Brisa* en `@duckdb/node-api` y copié literalmente los resultados:
  - **L01 (`orders` + `order_items` + `products`):** al cruzar líneas de pedido sin pre-agregar se demuestra el fan-out; al controlar por categoría (`p.list_price_usd > 0`, `o.status = 'completed'`), las pendientes intragrupo `slope_subtotal_por_unidad` van de `52.32 USD` (`Accesorios`) a `127.67 USD` (`Métodos de preparación`), el $R^2$ va de `0.8582` a `0.8732` y el `rmse_residuos` de `2.45` a `4.70 USD`.
  - **L02 (`orders` + `refunds`):** sobre los `16 200` pedidos finalizados (`completed` o `refunded`) tras deduplicar `refunds` por `order_id`, `desktop` presenta una tasa de reembolso de `7.92 %` (`momios = 0.086`, `OR = 1.6602` frente a `mobile` con `4.93 %`, `log_odds_ratio = 0.5069`), mientras `pos_tienda` registra `5.87 %` (`OR = 1.2028`, `log_odds_ratio = 0.1846`).
  - **L03 (`calendar` + `orders`):** sobre los `366` días de `2024`, la descomposición aditiva con media móvil centrada de 7 días revela que los sábados suman `+314.83 USD` y los miércoles restan `-322.27 USD`; en `2024-11`, los mayores choques residuales positivos ocurren en `2024-11-29` (`+6 263.48 USD`) y en el miércoles `2024-11-20` (`+5 681.39 USD`).
  - **L04 (`orders` + `order_items` + `products`):** en el backtesting semanal por categoría (`ROWS BETWEEN 4 PRECEDING AND 1 PRECEDING` frente a `LAG(..., 1)`), la media móvil causal de 4 semanas supera al pronóstico ingenuo en las 5 categorías con `MASE` entre `0.8144` (`Regalos y kits`) y `0.8583` (`Accesorios`).
  - **L05 (`customers` + `orders`):** sobre los `2 292` clientes con compras completadas al `2025-12-31`, las desviaciones estándar brutas son `sd_gasto = 1 529.42 USD`, `sd_recencia = 115.36 días` y `sd_frecuencia = 2.21 pedidos`; al estandarizar con puntaje $z$, emergen `404` clientes de `alto_valor_activo` (`media_gasto_usd = 4 935.00 USD`, `media_z_gasto = 1.4382`), `399` `en_riesgo_inactividad` (`361.32 días`, `2 355.38 USD`) y `1 489` de `comprador_regular` (`122.16 días`, `2 240.38 USD`).
- **Archivos y líneas:** bloques `sections[0].example`, `workedExample` y `practice` de las 5 lecciones en `src/data/lessons/da4-modelos/`.
- **Evidencia:** script `verify-all-sql-and-stats.mjs` confirma `starterPassed=false | solutionPassed=true` en las 5 lecciones.

### Paso 5 — Glosario (`docs/curriculo/investigacion/da4-modelos-glossary.json`)
- **Qué hice:** redacté 11 términos nuevos del módulo (`regresion-lineal-multiple`, `factor-de-inflacion-de-la-varianza`, `heterocedasticidad`, `razon-de-momios`, `calibracion-de-probabilidades`, `puntaje-de-brier`, `descomposicion-de-series-temporales`, `validacion-por-ventana-rodante`, `error-absoluto-escalado-medio`, `estandarizacion-puntaje-z`, `coeficiente-de-silueta`) con definiciones de `32..48` palabras, fórmulas en KaTeX, ejemplos sobre *Mercado Brisa*, lecciones relacionadas y fuentes primarias verificadas.
- **Archivos y líneas:** `docs/curriculo/investigacion/da4-modelos-glossary.json` (líneas 1–264).
- **Evidencia:** validado con `GlossaryListSchema.safeParse` → `GlossaryListSchema valid: true Terms: 11`.

### Paso 6 — Proyecto del módulo
- **Qué hice:** documenté la especificación completa del proyecto integrador de `da4-modelos` registrado en `src/data/catalog/modules.js` (*"Construir y evaluar un pronóstico semanal de demanda por categoría en Mercado Brisa contra una referencia simple"*), incluyendo las tablas de *Mercado Brisa* (`orders`, `order_items`, `products`, `calendar`), la consulta SQL de referencia con resultado real verificado en DuckDB y la rúbrica de 4 criterios verificables en escala `0–4` (1. Integridad del grano semanal y exclusión de SKU de prueba; 2. Prevención de fuga temporal en ventana rodante `ROWS BETWEEN 4 PRECEDING AND 1 PRECEDING`; 3. Cálculo exacto de MAE, RMSE y MASE frente al método ingenuo; 4. Diagnóstico de sesgo e intervalos empíricos de predicción para abastecimiento).
- **Archivos y líneas:** `docs/curriculo/investigacion/da4-modelos.md` (sección `## Paso 6 — Proyecto del módulo`).
- **Evidencia:** especificación completa y petición registrada en `## Peticiones al orquestador`.

### Paso 7 — Autoevaluación con la rúbrica de §9.4 y tabla resumen de §9.2
- **Qué hice:** evalué cada una de las 5 lecciones contra los 8 criterios de la rúbrica de §9.4 (escala `0–4`, exigiendo `>= 3` en todos) tras corregir los 7 defectos propios detectados durante la revisión.

#### Tabla resumen obligatoria (§9.2)

| lección | palabras | checks | prácticas | fuentes | puntuación de rúbrica |
|---|---:|---:|---|---:|---:|
| `da4-modelos-01-regresion-lineal-multiple` | 1 116 | 3 (`2 mcq`, `1 predict-output`) | 1 (`sql`, 5 filas × 7 cols en `orders` + `order_items` + `products`) | 4 | **32 / 32** (promedio 4.0) |
| `da4-modelos-02-regresion-logistica-calibracion` | 1 194 | 3 (`2 mcq`, `1 predict-output`) | 1 (`sql`, 3 filas × 6 cols en `orders` + `refunds`) | 4 | **32 / 32** (promedio 4.0) |
| `da4-modelos-03-series-temporales-descomposicion` | 1 217 | 3 (`2 mcq`, `1 predict-output`) | 1 (`sql`, 5 filas × 6 cols en `calendar` + `orders`) | 4 | **32 / 32** (promedio 4.0) |
| `da4-modelos-04-pronostico-backtesting-mae-mase` | 1 212 | 3 (`2 mcq`, `1 predict-output`) | 1 (`sql`, 5 filas × 6 cols en `orders` + `order_items` + `products`) | 4 | **32 / 32** (promedio 4.0) |
| `da4-modelos-05-clustering-segmentacion-perfiles` | 1 165 | 3 (`2 mcq`, `1 predict-output`) | 1 (`sql`, 3 filas × 6 cols en `customers` + `orders`) | 3 | **32 / 32** (promedio 4.0) |

#### Desglose de la rúbrica de calidad (§9.4 — escala 0 a 4 por criterio)

| Lección (`id`) | 1. Objetivo claro | 2. Progresión | 3. Ejemplo concreto | 4. Error típico | 5. Práctica | 6. Brevedad | 7. Precisión | 8. Tono | Total (/32) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `da4-modelos-01-regresion-lineal-multiple` | 4 | 4 | 4 | 4 | 4 | 4 (`15.6` pal/frase) | 4 | 4 | **32 / 32** |
| `da4-modelos-02-regresion-logistica-calibracion` | 4 | 4 | 4 | 4 | 4 | 4 (`15.5` pal/frase) | 4 | 4 | **32 / 32** |
| `da4-modelos-03-series-temporales-descomposicion` | 4 | 4 | 4 | 4 | 4 | 4 (`17.9` pal/frase) | 4 | 4 | **32 / 32** |
| `da4-modelos-04-pronostico-backtesting-mae-mase` | 4 | 4 | 4 | 4 | 4 | 4 (`18.0` pal/frase) | 4 | 4 | **32 / 32** |
| `da4-modelos-05-clustering-segmentacion-perfiles` | 4 | 4 | 4 | 4 | 4 | 4 (`18.1` pal/frase) | 4 | 4 | **32 / 32** |

---

## Test

### 1. Validador de esquema y métricas (`check-content.mjs`)
Comando ejecutado:
```powershell
node scripts/check-content.mjs --module da4-modelos
```
Salida literal:
```text
=== Validación de contenido v2 (check-content) ===
Lección (id v2)                                | Módulo               | Niv  | Sec  | Chk  | Src  | Palabras  | Estado    
--------------------------------------------------------------------------------------------------------------------------
da4-modelos-01-regresion-lineal-multiple       | da4-modelos          | 4    | 4    | 3    | 4    | 1116      | OK        
da4-modelos-02-regresion-logistica-calibracion | da4-modelos          | 4    | 4    | 3    | 4    | 1194      | OK        
da4-modelos-03-series-temporales-descomposicion | da4-modelos          | 4    | 4    | 3    | 4    | 1217      | OK        
da4-modelos-04-pronostico-backtesting-mae-mase | da4-modelos          | 4    | 4    | 3    | 4    | 1212      | OK        
da4-modelos-05-clustering-segmentacion-perfiles | da4-modelos          | 4    | 4    | 3    | 3    | 1165      | OK        
--------------------------------------------------------------------------------------------------------------------------
Resumen: 5 lecciones inspeccionadas | 5 válidas | 0 con advertencias (needsReview) | 0 con errores.

Resultado: OK (0 errores de esquema o integridad).
```

### 2. Auditoría anti-slop de copy (`check-copy.mjs`)
Comando ejecutado:
```powershell
node scripts/check-copy.mjs --path src/data/lessons/da4-modelos
```
Salida literal:
```text
=== Auditoría anti-slop de copy (check-copy) ===
Archivos escaneados: 5

0 hallazgos de términos prohibidos, emojis, "2026" o exceso de negritas.
Total de hallazgos: 0
```
*(Ninguna lección de `da4-modelos` supera el umbral de 22 palabras/frase en `check-copy.mjs`).*

### 3. Verificación DuckDB de todas las consultas SQL y `GlossaryListSchema`
Salida literal de `verify-all-sql-and-stats.mjs`:
```text
GlossaryListSchema valid: true Terms: 11
da4-modelos-01-regresion-lineal-multiple: avgWordsPerSentence=15.61 (515w/33s) | ex=5r | we1=5r | we2=5r | starterPassed=false | solutionPassed=true
da4-modelos-02-regresion-logistica-calibracion: avgWordsPerSentence=15.48 (480w/31s) | ex=3r | we1=3r | we2=5r | starterPassed=false | solutionPassed=true
da4-modelos-03-series-temporales-descomposicion: avgWordsPerSentence=17.86 (500w/28s) | ex=5r | we1=7r | we2=10r | starterPassed=false | solutionPassed=true
da4-modelos-04-pronostico-backtesting-mae-mase: avgWordsPerSentence=18.04 (505w/28s) | ex=5r | we1=6r | we2=5r | starterPassed=false | solutionPassed=true
da4-modelos-05-clustering-segmentacion-perfiles: avgWordsPerSentence=18.11 (489w/27s) | ex=1r | we1=1r | we2=3r | starterPassed=false | solutionPassed=true
```

### 4. Prueba real del tutor IA (`agy`, modelo `gemini-3.8-flash-low`)
Se ejecutó `test-agy-tutor.mjs` invocando `buildContextPrompt` (`server/ai/contextBuilder.js`) + `runAgyPrompt` (`server/ai/agyRunner.js`) contra el binario real `C:\Users\T490s\AppData\Local\agy\bin\agy.exe`:
- **Modo `explain-section` sobre `da4-modelos-01-regresion-lineal-multiple` (`DurationMs: 6 343 ms`, `FirstTokenMs: 4 598 ms`):**
  > Imagina que analizas la relación entre descuento (`discount_usd`) y cantidad vendida (`qty`) en `order_items`, cruzando con `products`. Si ejecutas una regresión simple global con `REGR_SLOPE(qty, discount_usd)`, mezclas productos de alta rotación con artículos prémium... Al juntar todo sin estratificar, la pendiente global resulta negativa: a mayor descuento en dólares, menos unidades vendidas. Es un artefacto por mezclar escalas de negocio dispares (paradoja de Simpson). Al controlar por `category` con `GROUP BY category`... La condición *ceteris paribus* aísla el impacto del descuento manteniendo idéntico el tipo de producto. **Error que evita:** Atribuir a una palanca comercial un efecto inexistente o inverso por ignorar variables de confusión que distorsionan la pendiente agregada.
- **Modo `tutor` (pista socrática sobre el `starterCode` con fuga temporal de `da4-modelos-04-pronostico-backtesting-mae-mase`, `DurationMs: 10 185 ms`, `FirstTokenMs: 8 610 ms`):**
  > El pronóstico da métricas artificialmente buenas porque tienes fuga temporal (*data leakage*): estás incluyendo la semana que intentas predecir dentro del cálculo. Revisa el límite superior de tu ventana en `ROWS BETWEEN 4 PRECEDING AND CURRENT ROW`. Al usar `CURRENT ROW`, estás promediando el valor real de la semana actual con las cuatro anteriores. Para que sea un pronóstico fuera de muestra (*out-of-sample*), el marco debe cerrarse estrictamente en la última observación pasada disponible, no en la fila actual. Además, ten en cuenta dos detalles clave de la lección para evitar otros fallos en el validador: 1. Asegúrate de filtrar únicamente los periodos que cuenten con la historia previa completa (las 4 semanas anteriores) antes de evaluar. 2. Al calcular las unidades vendidas desde `order_items` y `products`, excluye los SKU de prueba filtrando por `p.list_price_usd > 0`.

### 5. Build de producción (`npm run build`)
Comando ejecutado:
```powershell
npm run build
```
Salida literal:
```text
> grano@1.0.0 build
> vite build

vite v6.4.5 building for production...
✓ 2439 modules transformed.
✓ built in 25.59s
```

---

## Revisión propia (mínimo 5 defectos encontrados y corregidos)

1. **Nombres reales de columnas en `calendar`, `orders` y `order_items` (`schema.json`):** durante las primeras pruebas exploratorias contra DuckDB se invocaron `c.date`, `o.channel` y `oi.quantity`, que no existen en el esquema Parquet de *Mercado Brisa*. Se inspeccionó `public/datasets/schema.json` y se corrigieron todas las consultas a `c.calendar_date`, `o.device_type`, `oi.qty` y `p.list_price_usd`.
2. **Alineación con `LessonSchema` v2 (`src/data/schema/lesson.js`):** el primer borrador de las lecciones utilizaba campos v1 (`track`, `durationMinutes`, `checks[].type = 'multiple-choice'`, `flashcards[].question/answer`). Se migraron las 5 lecciones a la especificación v2 (`tracks: ['da']`, `minutes`, `contentVersion: 2`, `checks[].type = 'mcq' | 'predict-output'`, `practice.expected`, `practice.expectedOutputTable`, `flashcards[].front/back` y `sources[].publisher/supports`).
3. **Conteo de palabras en `roleNotes` de L02 y L04:** `check-content.mjs` detectó que `roleNotes.bi` en L02 (24 palabras) y `roleNotes.de`/`bi` en L04 (23 palabras) quedaban por debajo del mínimo de 25 palabras de `RoleNotesSchema`. Se ampliaron a `30–36` palabras con criterios técnicos específicos de cada rol, pasando `check-content.mjs` con `0` errores.
4. **Eliminación de términos prohibidos por `check-copy.mjs`:** el escaneo inicial detectó `"robustos"` en L01, `"crucial"` en L02, `"tríada"` en L04 y `"fundamental"`, `"robusta"`, `"domina"` y `"dominan"` en L05. Se sustituyeron por formulaciones precisas (`"errores estándar de Huber-White"`, `"conviene"`, `"tres métricas"`, `"principal"`, `"fiable"`, `"acapara"`, `"absorben"`), reduciendo los hallazgos a `0`.
5. **Longitud de `sections[].body` y media de palabras por oración (`<= 22`):** en una iteración intermedia, varias secciones superaron el tope de 250 palabras de `SectionSchema` y tuvieron una media de `23.9–27.7` palabras/frase. Se reescribieron los cuerpos teóricos de las 5 lecciones con oraciones concisas y directas, logrando que todas las secciones tengan entre `115` y `165` palabras y medias de `15.5` a `18.1` palabras/frase.
6. **Redondeo de `rmse_residuos` en `expectedOutputTable` de L01:** al contrastar `expectedOutputTable` contra `practice.expected.rows` en `da4-modelos-01-regresion-lineal-multiple.js`, se detectó que tres filas de `expectedOutputTable` mostraban `4.65`, `4.54` y `4.57` en vez de los valores reales de DuckDB (`4.7`, `4.63` y `4.59`). Se sincronizó `expectedOutputTable` exactamente con el resultado de DuckDB.
7. **Campos de `sources[]` en `da4-modelos-glossary.json`:** el validador `GlossaryListSchema` rechazó inicialmente `da4-modelos-glossary.json` porque a los objetos de `sources[]` les faltaban `publisher`, `accessed` y `supports`. Se completaron los metadatos en las 11 entradas del glosario hasta obtener `GlossaryListSchema valid: true`.

---

## Prueba adversarial

| Qué probé | Qué pasó | Acción |
|---|---|---|
| **1. Ejecución de los 5 `starterCode` en el evaluador de prácticas (`gradeSqlPractice`)** | Los 5 `starterCode` contienen defectos metodológicos deliberados (omisión de control/redondeo en L01, falta de log-odds en L02, falta de residuo en L03, fuga temporal `AND CURRENT ROW` en L04 y falta de estandarización en L05). Los 5 fallan limpiamente (`starterPassed: false`) sin aprobar por accidente. | Verificado en `verify-all-sql-and-stats.mjs` (`starterPassed=false` en L01..L05). |
| **2. Fan-out `1:N` entre `orders` y `refunds` en L02 y entre `orders` y `order_items` en L01** | En `refunds` existen pedidos con múltiples reembolsos parciales y en `order_items` múltiples líneas por pedido. Un `LEFT JOIN refunds` directo duplicaría pedidos; un `JOIN order_items` sin pre-agregar infla los totales de cabecera. | En L02 se deduplicó explícitamente con `LEFT JOIN (SELECT DISTINCT order_id FROM refunds) r` y en L01 se demostró la diferencia y se pre-agregó por `order_id` y `category`. |
| **3. Presencia del SKU de prueba con `list_price_usd = -15.00` en `products`** | Incluir el SKU de prueba negativo distorsiona tanto las pendientes de regresión en L01 como las series de demanda semanal por categoría en L04. | Se incluyó el filtro `WHERE p.list_price_usd > 0` en todas las consultas sobre `products` de L01 y L04, y se advirtió en `aiNotes` y `hints`. |
| **4. Fuga temporal (`ROWS BETWEEN 4 PRECEDING AND CURRENT ROW`) enviada al tutor IA real (`agy`)** | Se envió la consulta con fuga temporal al tutor `agy` (`gemini-3.8-flash-low`) pidiendo una pista. El tutor detectó que `CURRENT ROW` incluye la semana actual en el pronóstico y guió socráticamente hacia el límite pasado sin revelar el bloque SQL de solución. | Verificado en `test-agy-tutor.mjs` (`RES 2`, `10 185 ms`). |
| **5. Renderizado de fórmulas KaTeX y tablas anchas en viewport móvil (`375x812`) y escritorio (`1440x900`) en modo claro y oscuro** | Se renderizaron las 5 lecciones en `1440x900` (light y dark) y `375x812` (dark). Todas las ecuaciones KaTeX renderizan con `.katex-error = 0` y el documento mantiene `overflowPx = 0` sin errores de consola ni de página. | Verificado en `capture-da4.mjs` e inspeccionado en las capturas PNG de `docs/reportes/capturas/W-da4-modelos/`. |

---

## Capturas antes / después

Las capturas de verificación en `http://localhost:5227` se generaron en `docs/reportes/capturas/W-da4-modelos/` (y se copiaron a `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-da4-modelos\`) y fueron inspeccionadas visualmente con `read_file`:

1. `da4-modelos-01-desktop-light.png` (`1440x900`, L01 Regresión lineal múltiple en modo claro, `overflowPx: 0`, `.katex-error: 0`).
2. `da4-modelos-01-desktop-dark.png` (`1440x900`, L01 en modo oscuro).
3. `da4-modelos-01-mobile-dark.png` (`375x812`, L01 en vista móvil oscura, `overflowPx: 0`).
4. `da4-modelos-01-practica-sql.png` (`1440x900`, sección de práctica SQL de L01).
5. `da4-modelos-01-tutor-drawer.png` (`1440x900`, panel del Tutor IA abierto en L01).
6. `da4-modelos-02-desktop-light.png`, `da4-modelos-02-desktop-dark.png`, `da4-modelos-02-mobile-dark.png` (L02 Regresión logística, calibración y umbral).
7. `da4-modelos-03-desktop-light.png`, `da4-modelos-03-desktop-dark.png`, `da4-modelos-03-mobile-dark.png` (L03 Series temporales: tendencia, estacionalidad y residuo).
8. `da4-modelos-04-desktop-light.png`, `da4-modelos-04-desktop-dark.png`, `da4-modelos-04-mobile-dark.png`, `da4-modelos-04-practica-sql.png`, `da4-modelos-04-tutor-drawer.png` (L04 Pronóstico con ventana rodante y métricas MAE y MASE).
9. `da4-modelos-05-desktop-light.png`, `da4-modelos-05-desktop-dark.png`, `da4-modelos-05-mobile-dark.png` (L05 Agrupamiento e interpretación de perfiles).

---

## Peticiones al orquestador

- **Para el integrador `I-contenido` (T-12):**
  1. Registrar e importar las 5 lecciones de `src/data/lessons/da4-modelos/da4-modelos-01..05-*.js` en `src/data/lessons/index.js` y actualizar su estado a `'ready'` en `src/data/catalog/modules.js` (durante las pruebas locales se revirtió el cambio temporal en `src/data/lessons/index.js` con `git checkout -- src/data/lessons/index.js` para respetar la propiedad de archivos).
  2. Fusionar los 11 términos validados de `docs/curriculo/investigacion/da4-modelos-glossary.json` en `src/data/glossary.js` y las 16 flashcards del módulo en `src/data/flashcards.js`.
  3. Incorporar la rúbrica de 4 criterios del proyecto de módulo de `da4-modelos` documentada en el Paso 6 de `docs/curriculo/investigacion/da4-modelos.md` cuando se enriquezca el catálogo de proyectos.

---

## Pendiente (con motivo)

- Ningún ítem pendiente dentro del alcance de `W-da4-modelos`. Todos los entregables propietarios están creados, validados y commiteados en la rama `agente/W-da4-modelos`.
