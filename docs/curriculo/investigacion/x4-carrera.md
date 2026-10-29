# Investigación y diseño curricular · Módulo `x4-carrera` (Portafolio y entrevistas técnicas)

- **Módulo:** `x4-carrera` — Portafolio y entrevistas técnicas
- **Área y nivel:** Tronco común transversal de salida profesional (`core`) · Nivel 4 (Especialización y cierre)
- **Prerrequisitos de módulo:** `c2-dimensional` (Modelado dimensional con Kimball), `da2-eda` (Exploración de datos con método) y `bi2-metricas` (Árboles de métricas y KPIs de negocio), más sus prerrequisitos transitivos (`c0-pensamiento`, `c0-numeros`, `c0-sql-mental`, `c1-sql-base`, `c1-sql-joins`, `c1-modelo`, `c1-viz`, `c1-python`, `c2-calidad`).
- **Lecciones del módulo:** 3 lecciones (`65` minutos estimados en total: `[20, 25, 20]`)
- **Metadato de consulta de fuentes:** `accessed: '2026-10-29'`

---

## Paso 1 — Investigación de fuentes verificables por lección

Todas las fuentes listadas en las tablas siguientes fueron verificadas mediante petición HTTP (`200 OK`). Cada lección cuenta con 4 fuentes reales (`https://...`), incluyendo documentación técnica oficial (DuckDB Foundation, dbt Labs, GitHub Docs, AWS Builders' Library, MIT Career Advising & Professional Development) y literatura fundacional de arquitectura, reproducibilidad e impacto ejecutivo (Michael Nygard, Sandve et al. en PLOS Computational Biology, Kimball Group, Ron Kohavi et al., Barbara Minto y Martin Fowler).

### Lección 1 · `x4-carrera-01-portafolio-publico-de-da-bi`
**Título en catálogo:** Cómo estructurar un portafolio público por área (DE, DA, BI) con código, datos y decisiones (`20 min`)  
**Título ajustado (`<= 60` chars en `LessonSchema`):** `Portafolio público por área: código, datos y decisiones`

| # | Tipo | Título y autor / editorial | URL verificada (`https://`) | Metadato de acceso | Afirmación técnica que respalda en la lección |
|---|---|---|---|---|---|
| 1 | Primaria | Michael Nygard — *Documenting Architecture Decisions* (`Cognitect`) | https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions | `accessed: '2026-10-29'` | Estructura canónica de un Registro de Decisión de Arquitectura (ADR): título, contexto con restricciones reales, decisión adoptada, estado y consecuencias (incluyendo las compensaciones aceptadas). |
| 2 | Primaria | Geir Kjetil Sandve, Anton Nekrutenko, James Taylor & Eivind Hovig — *Ten Simple Rules for Reproducible Computational Research* (`PLOS Computational Biology`) | https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1003285 | `accessed: '2026-10-29'` | Trazabilidad completa desde los datos crudos hasta cada tabla o gráfico publicado, fijando semillas pseudoaleatorias, versiones exactas de dependencias y scripts de ejecución determinista sin pasos manuales ocultos. |
| 3 | Primaria | dbt Labs — *Add data tests to your DAG* (`dbt Labs Documentation`) | https://docs.getdbt.com/docs/build/data-tests | `accessed: '2026-10-29'` | Verificación automatizada de invariantes sobre modelos de datos (`unique`, `not_null`, `accepted_values`, `relationships` y pruebas singulares de reconciliación financiera) como prueba de calidad en un repositorio público. |
| 4 | Primaria | GitHub Docs — *About READMEs* (`GitHub Documentation`) | https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes | `accessed: '2026-10-29'` | Diseño del `README.md` como punto de entrada de evaluación técnica: enunciado del problema operativo, arquitectura reproducible, instrucciones de ejecución en un comando y enlaces directos a la evidencia verificable. |

### Lección 2 · `x4-carrera-02-entrevista-tecnica-sql-caso-arquitectura`
**Título en catálogo:** La entrevista técnica por área: SQL en vivo, estudio de caso y diseño de arquitectura (`25 min`)  
**Título ajustado (`<= 60` chars en `LessonSchema`):** `Entrevista técnica: SQL en vivo, caso y arquitectura`

| # | Tipo | Título y autor / editorial | URL verificada (`https://`) | Metadato de acceso | Afirmación técnica que respalda en la lección |
|---|---|---|---|---|---|
| 1 | Primaria | DuckDB Foundation — *`QUALIFY` Clause* (`DuckDB Documentation`) | https://duckdb.org/docs/stable/sql/query_syntax/qualify.html | `accessed: '2026-10-29'` | Filtrado directo sobre funciones de ventana (`ROW_NUMBER()`, `RANK()`, `DENSE_RANK()`) con `QUALIFY` para resolver problemas de deduplicación y ranking Top-N por partición en entrevistas de SQL en vivo sin subconsultas envolventes redundantes. |
| 2 | Primaria | Ralph Kimball & Margy Ross — *Declaring the Grain* (`Kimball Group`) | https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/grain/ | `accessed: '2026-10-29'` | Declaración explícita del grano antes de escribir un `JOIN` o diseñar un esquema en pizarra, previniendo errores de multiplicación de filas (*fan-out*) al cruzar cabeceras de pedidos (`orders`) con líneas (`order_items`) o reembolsos (`refunds`). |
| 3 | Primaria | Ron Kohavi, Diane Tang & Ya Xu — *Trustworthy Online Controlled Experiments: A Practical Guide to A/B Testing* (`Cambridge University Press`) | https://experimentguide.com/ | `accessed: '2026-10-29'` | Estructura de resolución de un estudio de caso analítico y de negocio: descomposición de la caída o subida de una métrica, formulación de hipótesis refutables y par de métrica de éxito con métrica guardarraíl (*guardrail metric*). |
| 4 | Primaria | Marc Brooker — *Timeouts, retries, and backoff with jitter* (`Amazon Web Services Builders' Library`) | https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/ | `accessed: '2026-10-29'` | Comportamiento de sistemas distribuidos bajo reintentos de red (entrega *at-least-once*) y necesidad de claves de idempotencia (`idempotency_key`) en la ingesta y almacenamiento analítico durante entrevistas de diseño de arquitectura. |

### Lección 3 · `x4-carrera-03-explicar-proyecto-2-minutos`
**Título en catálogo:** Explicar un proyecto técnico en 2 minutos: problema, compensaciones y resultado medido (`20 min`)  
**Título ajustado (`<= 60` chars en `LessonSchema`):** `Explicar un proyecto en 2 minutos: problema e impacto`

| # | Tipo | Título y autor / editorial | URL verificada (`https://`) | Metadato de acceso | Afirmación técnica que respalda en la lección |
|---|---|---|---|---|---|
| 1 | Primaria | MIT Career Advising & Professional Development (CAPD) — *The STAR Method for Behavioral Interviews* (`Massachusetts Institute of Technology`) | https://capd.mit.edu/resources/the-star-method-for-behavioral-interviews/ | `accessed: '2026-10-29'` | Estructuración de respuestas técnicas de impacto mediante Situación, Tarea, Acción y Resultado cuantificado, evitando relatos cronológicos difusos o centrados solo en la lista de herramientas. |
| 2 | Primaria | Barbara Minto — *The Minto Pyramid Principle: Logic in Writing, Thinking, & Problem Solving* (`Minto International`) | https://barbaraminto.com/ | `accessed: '2026-10-29'` | Comunicación *answer-first* (principio de la pirámide): abrir la intervención con la conclusión cuantificada y la decisión de negocio, sustentándola en argumentos agrupados con rigor lógico y evidencia empírica auditable. |
| 3 | Primaria | Architectural Decision Records Organization — *Architectural Decision Records (ADR)* (`adr.github.io`) | https://adr.github.io/ | `accessed: '2026-10-29'` | Presentación oral y escrita de una elección de ingeniería como una compensación explícita (*trade-off*) entre dos alternativas viables bajo restricciones reales de latencia, costo, volumen y mantenimiento. |
| 4 | Primaria | Martin Fowler — *Software Architecture Guide* (`martinfowler.com`) | https://martinfowler.com/architecture/ | `accessed: '2026-10-29'` | Definición de las decisiones arquitectónicas como aquellas decisiones de diseño costosas de cambiar posteriormente y cómo justificar por qué se descartó una alternativa más compleja o más frágil. |

---

## Paso 2 — Mapa de conceptos y progresión pedagógica del módulo

### Qué asume este módulo de los módulos previos
- De **`c2-dimensional`**: declaración del grano (*grain*), separación entre tablas de hechos (`fact_order_items`, `fact_orders`) y dimensiones (`dim_customers`, `dim_products`, `dim_stores`), manejo de relaciones uno-a-muchos sin *fan-out* y dimensiones lentamente cambiantes Tipo 1 (`As-Is`) frente a Tipo 2 (`As-Was` con `valid_from` y `valid_to`).
- De **`da2-eda`**: formulación de hipótesis refutables, perfilado sistemático de tablas, distinción entre errores de dominio (`SKU-TEST-NEG` con `-9.99 USD`) y valores extremos reales de negocio, y construcción de tablas de atrición reproducibles mediante CTEs secuenciales.
- De **`bi2-metricas`**: anatomía de una métrica accionable, árboles de descomposición de la Métrica Estrella del Norte (NSM), pares de métrica objetivo con métricas guardarraíl (*guardrails*) y conciliación entre métricas operativas y financieras.

### Progresión de conceptos en las 3 lecciones de `x4-carrera`

| Orden | ID de lección | Concepto central que introduce | Qué asume de la anterior | Qué problema real de Mercado Brisa resuelve |
|---|---|---|---|---|
| 1 | `x4-carrera-01-portafolio-publico-de-da-bi` | **Anatomía de un repositorio público de portafolio** diferenciado por área (DE, DA, BI), **Registro de Decisión de Arquitectura (ADR)**, **reproducibilidad determinista** y **pruebas SQL de reconciliación financiera**. | Modelado dimensional (`c2-dimensional`), diario reproducible (`da2-eda`) y definiciones de métricas (`bi2-metricas`). | Audita en SQL las tres anomalías de calidad de Mercado Brisa (`450` webhooks duplicados en `payments`, `1 200` eventos repetidos en `events` y `1` SKU con `-9.99 USD` en `products`) y demuestra cómo un repositorio sin prueba de grano infla las ventas regionales al cruzar `orders` con `refunds` (`16 470` filas frente a `16 200` pedidos reales y `+74 534.52 USD` de sesgo). |
| 2 | `x4-carrera-02-entrevista-tecnica-sql-caso-arquitectura` | **Protocolo de 5 pasos para SQL en vivo**, **desempate determinista en funciones de ventana** con `QUALIFY`, **resolución estructurada de estudios de caso** (DA/BI) y **diseño de arquitectura en pizarra** (DE/BI). | Estándares de calidad, grano y decisiones documentadas de la Lección 1. | Resuelve en vivo la deduplicación de `payments` por `idempotency_key` (`18 750` cobros únicos y `6 874 488.00 USD` capturados), corrige la trampa de *fan-out* en el ranking Top-2 de tiendas por región con CTEs preagregadas y `DENSE_RANK()`, y construye el Top-2 de categorías por segmento de cliente según margen bruto limpio. |
| 3 | `x4-carrera-03-explicar-proyecto-2-minutos` | **Estructura de presentación técnica de 2 minutos (`120 s`)** combinando el **Principio de la Pirámide de Minto** (*answer-first*) y **STAR**, **articulación de compensaciones técnicas (*trade-offs*)** y **matriz SQL de impacto antes/después**. | Portafolio auditable (L01) y defensa técnica bajo preguntas de entrevista (L02). | Cuantifica en una sola tabla SQL el impacto antes/después de tres proyectos sobre Mercado Brisa: 1) deduplicar `payments` elimina `168 674.63 USD` de sobreestimación de caja; 2) evaluar las campañas comerciales (`orders` y `marketing_spend`) por margen neto limpio en vez de GMV bruto revela que `CMP-VERANO` apenas rinde `1.14x` sobre `109 839.33 USD` de gasto; y 3) auditar `customer_changes` con SCD Tipo 2 (`As-Was`) corrige `+412 601.01 USD` sobreasignados al nivel `oro` y `-628 099.05 USD` subestimados en `bronce`. |

---

## Paso 4 — Verificación empírica en DuckDB sobre Mercado Brisa

Todas las consultas SQL incluidas en las tres lecciones fueron ejecutadas directamente con `@duckdb/node-api` contra los 13 archivos Parquet reales de `public/datasets/`:

1. **Lección 1 (`x4-carrera-01-portafolio-publico-de-da-bi`):**
   - **Ejemplo de sección 1 (Scorecard de auditoría de datos del portafolio):**
     - `1_webhooks_duplicados_payments`: `filas_crudas = 19200`, `filas_limpias = 18750`, `anomalias_detectadas = 450`.
     - `2_eventos_duplicados_events`: `filas_crudas = 65000`, `filas_limpias = 63800`, `anomalias_detectadas = 1200`.
     - `3_productos_precio_negativo`: `filas_crudas = 180`, `filas_limpias = 179`, `anomalias_detectadas = 1`.
   - **WorkedExample (Reconciliación regional `orders` + `stores` + `refunds`):**
     - Paso 1 (cruce ingenuo 1:N sin preagregar `refunds`): `Cono Sur` (`5 479` filas, `1 890 327.21 USD`), `Andina` (`5 514` filas, `1 798 031.32 USD`), `Iberia` (`3 124` filas, `1 248 350.06 USD`), `Norteamérica` (`2 353` filas, `795 772.22 USD`).
     - Paso 2 (CTE `reembolsos_por_pedido` al grano de `order_id`): `Cono Sur` (`5 401` pedidos, venta neta previa `1 945 238.75 USD`, reembolsos `77 991.82 USD`, ingreso neto conciliado `1 867 246.93 USD`), `Andina` (`5 400` pedidos, `1 879 723.73 USD`, `115 379.23 USD`, `1 764 344.50 USD`), `Iberia` (`3 085` pedidos, `1 278 079.80 USD`, `43 170.94 USD`, `1 234 908.86 USD`), `Norteamérica` (`2 314` pedidos, `822 882.10 USD`, `37 992.53 USD`, `784 889.57 USD`).
   - **Práctica SQL (Auditoría de margen neto conciliado por `store_type` excluyendo `list_price_usd <= 0` y preagregando `order_items` y `refunds`):**
     - `retail`: `pedidos_auditados = 9229`, `unidades_totales = 43280`, `ingreso_neto_usd = 3202090.76`, `margen_neto_usd = 1468725.33`.
     - `warehouse`: `pedidos_auditados = 2880`, `unidades_totales = 17336`, `ingreso_neto_usd = 1316421.31`, `margen_neto_usd = 623499.35`.
     - `flagship`: `pedidos_auditados = 4091`, `unidades_totales = 17319`, `ingreso_neto_usd = 1198183.19`, `margen_neto_usd = 501849.20`.

2. **Lección 2 (`x4-carrera-02-entrevista-tecnica-sql-caso-arquitectura`):**
   - **Ejemplo de sección 1 (Deduplicación de `payments` en vivo con `QUALIFY ROW_NUMBER()`):**
     - `transferencia_spei`: `cobros_exitosos = 3960`, `cobros_fallidos = 548`, `importe_capturado_usd = 1935173.03`.
     - `efectivo_tienda`: `cobros_exitosos = 3960`, `cobros_fallidos = 547`, `importe_capturado_usd = 1927080.27`.
     - `billetera_digital`: `cobros_exitosos = 4140`, `cobros_fallidos = 367`, `importe_capturado_usd = 1539322.85`.
     - `card`: `cobros_exitosos = 4140`, `cobros_fallidos = 368`, `importe_capturado_usd = 1472911.85`.
   - **WorkedExample (Ranking Top-2 de tiendas por región según ingreso neto post-reembolsos):**
     - `Andina`: `#1 Tienda Miraflores` (`2 301` pedidos, `792 204.22 USD`, `44.9 %`), `#2 Tienda Chapinero Norte` (`1 467` pedidos, `491 741.78 USD`, `27.87 %`).
     - `Cono Sur`: `#1 Tienda Palermo Soho` (`3 077` pedidos, `1 006 870.50 USD`, `53.92 %`), `#2 Tienda Providencia` (`2 324` pedidos, `860 376.43 USD`, `46.08 %`).
     - `Iberia`: `#1 Almacén Logístico Coslada` (`1 523` pedidos, `739 392.23 USD`, `59.87 %`), `#2 Tienda Salamanca` (`792` pedidos, `252 677.12 USD`, `20.46 %`).
     - `Norteamérica`: `#1 Tienda Polanco Sur` (`564` pedidos, `228 242.98 USD`, `29.08 %`), `#2 Tienda Roma Norte` (`638` pedidos, `216 094.88 USD`, `27.53 %`).
   - **Práctica SQL (Top-2 de categorías por `segment` de cliente según `margen_bruto_usd` en pedidos `completed` con `list_price_usd > 0`):**
     - `cafeteria_b2b`: `#1 Molinos` (`1 122` pedidos, `2 951` unidades, `192 608.32 USD`), `#2 Cafeteras` (`1 134` pedidos, `3 032` unidades, `167 645.90 USD`).
     - `pro_barista`: `#1 Molinos` (`2 600` pedidos, `5 750` unidades, `372 406.55 USD`), `#2 Cafeteras` (`2 598` pedidos, `5 728` unidades, `313 083.01 USD`).
     - `retail`: `#1 Molinos` (`2 523` pedidos, `5 613` unidades, `363 058.36 USD`), `#2 Cafeteras` (`2 518` pedidos, `5 510` unidades, `301 161.44 USD`).

3. **Lección 3 (`x4-carrera-03-explicar-proyecto-2-minutos`):**
   - **Ejemplo de sección 1 (Cuantificación del impacto antes/después en `payments`):**
     - `cobros_antes_duplicados_usd = 7043162.63`, `cobros_despues_limpios_usd = 6874488.00`, `sobreestimacion_eliminada_usd = 168674.63`.
   - **WorkedExample (Reevaluación ejecutiva de campañas antes [GMV bruto] frente a después [margen neto conciliado frente a inversión publicitaria]):**
     - `CMP-BARISTA`: `3 000` pedidos brutos (`1 109 051.51 USD` GMV) frente a `2 520` pedidos limpios, `407 823.94 USD` de margen neto y `22 306.35 USD` de gasto (`ratio_margen_inversion = 18.28x`).
     - `CMP-RETENCION`: `3 000` pedidos brutos (`1 648 915.21 USD` GMV) frente a `1 940` pedidos limpios, `404 620.44 USD` de margen neto y `14 102.07 USD` de gasto (`28.69x`).
     - `CMP-ORIGEN`: `3 000` pedidos brutos (`565 542.84 USD` GMV) frente a `2 400` pedidos limpios, `205 572.39 USD` de margen neto y `26 703.45 USD` de gasto (`7.70x`).
     - `CMP-VERANO`: `3 000` pedidos brutos (`561 465.69 USD` GMV) frente a `1 945` pedidos limpios, `125 198.65 USD` de margen neto y `109 839.33 USD` de gasto (`1.14x`).
   - **Práctica SQL (Matriz antes/después para un pitch de 2 minutos comparando atribución `As-Is` en `customers.current_tier` frente a atribución histórica `As-Was` en `customer_changes` sobre los `14 760` pedidos completados):**
     - `oro`: `pedidos_antes = 6468`, `pedidos_despues = 5485`, `ingreso_antes_usd = 2910010.27`, `ingreso_despues_usd = 2497409.26`, `sesgo_corregido_usd = 412601.01`.
     - `plata`: `pedidos_antes = 4630`, `pedidos_despues = 4567`, `ingreso_antes_usd = 1873949.75`, `ingreso_despues_usd = 1856698.12`, `sesgo_corregido_usd = 17251.63`.
     - `bronce`: `pedidos_antes = 2247`, `pedidos_despues = 3746`, `ingreso_antes_usd = 900084.30`, `ingreso_despues_usd = 1528183.35`, `sesgo_corregido_usd = -628099.05`.
     - `platino`: `pedidos_antes = 1415`, `pedidos_despues = 962`, `ingreso_antes_usd = 585418.10`, `ingreso_despues_usd = 387171.69`, `sesgo_corregido_usd = 198246.41`.

---

## Paso 6 — Proyecto del módulo `x4-carrera` y rúbrica verificable

### Especificación en `src/data/catalog/modules.js`
- **Enunciado (`prompt`):** Preparar la presentación pública del proyecto integrador elegido (DE, DA o BI) con documento de arquitectura, decisiones tomadas y resumen ejecutivo.
- **Dataset:** Proyecto propio del estudiante sobre Mercado Brisa.
- **Entregable (`deliverable`):** Repositorio público documentado con `README` ejecutivo, diagrama de arquitectura y guion de presentación de 2 minutos.

### Estructura obligatoria del entregable del proyecto
1. **`README.md` ejecutivo de lectura en 90 segundos:**
   - **Problema operativo y decisión que habilita:** qué riesgo financiero, operativo o analítico de Mercado Brisa resuelve el proyecto y quién consume el entregable.
   - **Arquitectura y linaje de tablas:** diagrama en sintaxis Mermaid o ASCII mostrando las tablas fuente de Mercado Brisa (`orders`, `order_items`, `products`, `customers`, `customer_changes`, `payments`, `refunds`, `events`, `marketing_spend`, `experiments`, `experiment_assignments`, `stores`, `calendar`), las capas de transformación y las pruebas de calidad aplicadas.
   - **Reproducibilidad en un comando:** instrucciones exactas para ejecutar las consultas y validaciones desde cero con semilla determinista y sin pasos manuales.
2. **Al menos 2 Registros de Decisión de Arquitectura (`docs/adr/ADR-001.md` y `ADR-002.md`):**
   - Cada ADR documenta el contexto con restricciones cuantitativas reales de Mercado Brisa, al menos dos alternativas evaluadas, la decisión elegida y las compensaciones (*trade-offs*) aceptadas según el área:
     - **Ruta DE:** deduplicación idempotente de `payments` (`450` webhooks repetidos) y `events` (`1 200` duplicados de red) + modelo estrella con dimensión histórica SCD Tipo 2 en `customer_changes`.
     - **Ruta DA:** diario reproducible con tabla de atrición, exclusión del error de captura `SKU-TEST-NEG` (`-9.99 USD`) sin mutilar los `213` pedidos extremos reales de `cafeteria_b2b`, y reevaluación de campañas por margen neto.
     - **Ruta BI:** árbol de la Métrica Estrella del Norte (Pedidos Completados a Tiempo sin Incidencia), conciliación de grano entre `orders`, `order_items` y `refunds`, y capa semántica con métricas guardarraíl.
3. **Suite de pruebas SQL de reconciliación financiera (`tests/reconciliacion.sql`):**
   - Consultas que verifican unicidad de clave primaria, ausencia de multiplicación de filas (*fan-out*) en cruces uno-a-muchos y cuadre exacto de totales antes y después de cada transformación.
4. **Guion de presentación de 2 minutos (`docs/guion-2-minutos.md`, 240 a 300 palabras):**
   - Estructurado en 4 bloques cronometrados (`0:00–0:20` Conclusión e impacto medido; `0:20–0:45` Problema y diagnóstico cuantificado; `0:45–1:25` Acción técnica y compensación de ingeniería; `1:25–2:00` Matriz antes/después y decisión de negocio habilitada).

### Rúbrica verificable de evaluación del proyecto (4 criterios, escala 0 a 4)

| Criterio | 0–1 (Insuficiente) | 2 (En desarrollo) | 3 (Competente — Aprobado) | 4 (Excelente) |
|---|---|---|---|---|
| **1. Estructura del repositorio y reproducibilidad** | Sube scripts o cuadernos sueltos con rutas locales absolutas, sin `README.md` ni instrucciones de ejecución. | Incluye un `README.md` que enumera las librerías usadas, pero no explica el problema de negocio ni permite reproducir las cifras en un comando. | Entrega un repositorio estructurado (`README.md`, `sql/`, `tests/`, `docs/adr/`) con instrucciones reproducibles desde los Parquet crudos de Mercado Brisa y linaje explícito de tablas. | Incluye además un script o comando único que ejecuta las transformaciones y las pruebas de calidad de principio a fin devolviendo código de salida `0` sin intervención manual. |
| **2. Rigor en calidad de datos y pruebas de reconciliación SQL** | Las consultas del portafolio ignoran las anomalías de Mercado Brisa o contienen errores de *fan-out* al unir `orders` con `order_items` o `refunds`. | Filtra algunas filas inválidas (`status = 'completed'`), pero no incluye pruebas automatizadas de unicidad, grano ni reconciliación financiera. | Documenta y ejecuta al menos 3 pruebas SQL verificables (unicidad de clave primaria, dominio válido excluyendo `SKU-TEST-NEG` y cuadre de grano entre cabeceras y detalle/reembolsos). | Cuantifica en una tabla de auditoría el sesgo exacto que habría introducido cada anomalía sin las pruebas (`+168 674.63 USD` en `payments`, `+74 534.52 USD` por *fan-out* en `refunds` o `+412 601.01 USD` en `oro` por SCD1). |
| **3. Registros de Decisión de Arquitectura (ADR) y compensaciones (*trade-offs*)** | No justifica las decisiones técnicas o afirma que eligió una herramienta o diseño porque es "el estándar moderno". | Describe qué hizo en el proyecto, pero sin contrastarlo contra una alternativa viable ni mencionar qué desventaja aceptó. | Incluye al menos 2 ADRs completos (Contexto, Alternativas A y B, Decisión y Consecuencias) adaptados a su ruta (DE, DA o BI) con restricciones numéricas reales del dataset. | Cuantifica el costo computacional, de mantenimiento o de precisión de cada alternativa descartada y define bajo qué umbral futuro de volumen o latencia debería revisarse la decisión. |
| **4. Guion ejecutivo de 2 minutos y matriz de impacto antes/después** | El guion supera los 3 minutos, narra el proyecto en orden cronológico ("primero limpié los datos...") y no presenta ninguna métrica de resultado. | Presenta cifras descriptivas del dataset final, pero no compara el estado antes y después del proyecto ni conecta el hallazgo con una decisión operativa. | Redacta un guion de `240` a `300` palabras con apertura *answer-first* (Pirámide de Minto + STAR) respaldado por una consulta SQL que calcula la matriz antes/después del proyecto. | Incluye preguntas anticipadas de entrevista técnica (SQL en vivo, caso de negocio y arquitectura) con respuestas verificadas sobre su propio repositorio. |
