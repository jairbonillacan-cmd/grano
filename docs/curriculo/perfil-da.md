# Perfil de egreso · Análisis de Datos (`da`)

**Área:** `da` — Análisis de Datos (6 módulos de especialidad + 14 módulos de tronco común = 20 módulos, 94 lecciones, 34.3 horas estimadas)  
**Propósito:** formar analistas cuantitativos capaces de responder preguntas de producto y negocio mediante inferencia estadística, exploración sistemática de datos, análisis de embudos, cohortes de retención y LTV con margen, experimentación controlada (pruebas A/B con diagnóstico SRM y ajuste CUPED), modelos estadísticos y pronóstico de series temporales, inferencia causal cuasi-experimental y comunicación ejecutiva.

---

## Niveles 0, 1 y 2 (Tronco común `core`)
Antes de cursar los módulos de especialidad, la persona completa el tronco común (`c0-datos`, `c0-hojas`, `c0-numeros`, `c0-negocio`, `c0-herramientas`, `c1-sql-base`, `c1-sql-joins`, `c1-modelo`, `c1-python`, `c1-viz`, `c2-sql-analitico`, `c2-dimensional`), dominando estadística descriptiva, SQL analítico (`QUALIFY`, `ASOF JOIN`, `EXPLAIN`), modelado dimensional, Polars 2.0, pandas 3.0 y visualización honesta (ver `docs/curriculo/perfil-core.md`).

---

## Nivel 2 · Intermedio DA (`da2-inferencia`, `da2-eda`)

### Qué sabe hacer la persona al terminar el Nivel 2 DA
- Aplicar probabilidad condicional, teorema de Bayes y distribuciones clave (binomial, Poisson, normal y log-normal) a decisiones comerciales, estimar parámetros mediante intervalos de confianza, contrastar hipótesis interpretando el valor $p$ y el tamaño del efecto sin falacias, y calcular la potencia estadística ($1 - \beta$) y el tamaño de muestra necesario antes de lanzar una medición.
- Explorar un conjunto de datos desconocido formulando primero hipótesis refutables, perfilando cardinalidad, completitud, asimetría y dominios, distinguiendo errores de captura de clientes reales extremos (*outliers*) y registrando cada supuesto en un diario de análisis reproducible.

### Tareas laborales reales que puede ejecutar
1. Determinar si una caída semanal en la tasa de conversión de una tienda física u online es fluctuación muestral esperada o un cambio estadísticamente significativo, reportando intervalos de confianza al 95 %.
2. Ejecutar el perfilado completo de las tablas de navegación y compras para aislar registros corruptos antes de alimentar un estudio de producto.

### Entregables verificables del nivel (sobre Mercado Brisa)
- **`da2-inferencia`:** Cuaderno reproducible sobre `orders`, `events` y `stores` con intervalos de confianza al 95 %, prueba de hipótesis y calculadora de tamaño muestral.
- **`da2-eda`:** Informe exploratorio reproducible sobre `events`, `orders`, `order_items` y `products` con matriz de perfilado y 5 hallazgos respaldados por consultas SQL y gráficos.

---

## Nivel 3 · Avanzado DA (`da3-producto`, `da3-experimentos`)

### Qué sabe hacer la persona al terminar el Nivel 3 DA
- Analizar embudos de conversión por ventana temporal, construir matrices triangulares de retención por cohorte, curvas de supervivencia y valor de vida del cliente (**LTV**) neto de devoluciones y ajustado por margen bruto (`l13-cohorts-retention-ltv`), aplicar segmentación conductual RFM y comparar modelos de atribución de marketing con `ASOF JOIN`.
- Diseñar y auditar **experimentos controlados (pruebas A/B)**: ejecutar el chequeo $\chi^2$ de desviación en la proporción muestral (**Sample Ratio Mismatch, SRM**), reducir la varianza mediante **CUPED** usando covariables pre-experimento (`l14-ab-testing-cuped`), controlar la tasa de descubrimientos falsos en comparaciones múltiples (*Benjamini-Hochberg*), aplicar pruebas secuenciales (*mSPRT*), interpretar probabilidades bayesianas y diseñar pruebas *switchback* cuando existe interferencia en la red.

### Tareas laborales reales que puede ejecutar
1. Calcular el ratio `LTV:CAC` real por canal de adquisición a los 6 meses corrigiendo el sesgo de censura derecha y proponer una reasignación de presupuesto de marketing.
2. Dictaminar si una nueva versión del flujo de pago debe desplegarse a producción tras verificar ausencia de SRM, calcular el estimador ajustado con CUPED y comprobar que las métricas guardia (reembolsos y latencia) no se degraden.

### Entregables verificables del nivel (sobre Mercado Brisa)
- **`da3-producto`:** Consultas SQL de cohortes sin sesgo de censura sobre `customers`, `orders`, `order_items`, `refunds` y `marketing_spend` y recomendación cuantificada de reasignación de presupuesto.
- **`da3-experimentos`:** Informe técnico de decisión (*Lanzar / No lanzar*) sobre `experiments`, `experiment_assignments`, `orders`, `refunds` y `events` con consultas SQL de SRM, estimador CUPED e intervalos al 95 %.

---

## Nivel 4 · Experto DA (`da4-modelos`, `da4-causalidad`, `x4-ia-datos`, `x4-carrera`)

### Qué sabe hacer la persona al terminar el Nivel 4 DA
- Ajustar, diagnosticar y validar modelos de regresión lineal múltiple (controlando colinealidad y heterocedasticidad), regresión logística (calibración de probabilidades y selección de umbral óptimo), descomposición y pronóstico de series temporales con **validación por ventana temporal rodante (*backtesting*)** y métricas `MAE`, `RMSE` y `MASE`, y agrupamiento (*clustering*) interpretable.
- Estimar efectos causales mediante métodos cuasi-experimentales cuando no es posible aleatorizar: **Diferencias en diferencias (DiD)** con verificación de tendencias paralelas y pruebas de placebo, **Regresión discontinua (RDD)** y **Control sintético / emparejamiento**, comunicando los resultados en memos ejecutivos estructurados para dirección.

### Entregables verificables del nivel (sobre Mercado Brisa)
- **`da4-modelos`:** Cuaderno reproducible de pronóstico semanal de demanda por categoría (`orders`, `order_items`, `products`, `calendar`) con evaluación en ventana rodante, tabla comparativa `MAE`/`MASE` contra modelo base y bandas de predicción.
- **`da4-causalidad`:** Memo ejecutivo de 1 página estimando por Diferencias en diferencias el impacto causal de una promoción de envío gratuito lanzada en un subconjunto de tiendas (`orders`, `stores`, `calendar`, `marketing_spend`), con gráfico de tendencias previas y recomendación de negocio.
- **`x4-ia-datos` y `x4-carrera`:** Servidor MCP evaluado con 20 *Golden Evals* y portafolio público con 3 estudios de caso reproducibles.
