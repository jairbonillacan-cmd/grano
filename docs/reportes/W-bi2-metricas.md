# Reporte de cierre — `W-bi2-metricas`

- **Módulo:** `bi2-metricas` (*Diseño de métricas y árboles de KPIs*, Nivel 2, Track `bi`)
- **Rama y worktree:** `agente/W-bi2-metricas` en `C:\Users\T490s\Desktop\Proyectos\ING-W-bi2-metricas`
- **Puerto Vite utilizado:** `5217` (`http://127.0.0.1:5217`)

---

## Inicio

Archivos leídos antes de iniciar la escritura y un hecho concreto aprendido de cada uno:

- `docs/plan-maestro.md`: establece la arquitectura por oleadas del proyecto Grano y asigna el módulo `bi2-metricas` a la Fase 3 (Oleada B), con aislamiento estricto de propiedad de archivos por subagente.
- `docs/operacion-orquestador.md`: exige que cada subagente trabaje exclusivamente en su propio worktree, valide en navegador real y reporte con las secciones obligatorias (`## Inicio`, `## Pasos`, `## Test`, `## Revisión propia`, `## Prueba adversarial`, `## Capturas antes / después`, `## Peticiones al orquestador`, `## Pendiente`).
- `docs/estandares-calidad.md`: define los bloqueadores duros de calidad (cero errores de consola, cero desbordamiento horizontal en `1280x720` y `390x844`, cero texto crudo `**` o `[object Object]`) y la rúbrica de 8 criterios con escala 0 a 4 (mínimo 3/4 por criterio y promedio `>= 3.25`).
- `docs/curriculo/README.md`: documenta el flujo obligatorio de producción curricular en 7 pasos, la regla de longitud de 900 a 1,300 palabras en `sections[].body` (`<= 22` palabras por oración en promedio y máximo 3 negritas por párrafo) y los 5 principios de la guía de voz en español neutro técnico.
- `docs/curriculo/plantilla-investigacion-modulo.md`: especifica las secciones obligatorias del documento de investigación en `docs/curriculo/investigacion/<moduleId>.md` (Pasos 1, 2, 4 y 6 documentados antes y después de la redacción de lecciones).
- `src/data/curriculum/modules.js`: define el módulo `bi2-metricas` (*Diseño de métricas y árboles de KPIs*, `level: 'l2'`, `tracks: ['bi']`, `prerequisites: ['core1-sql', 'bi1-kpis']`, `estimatedHours: 4`) y sus 4 lecciones planeadas (`bi2-metricas-01-anatomia-metrica`, `bi2-metricas-02-arboles-kpis-palancas`, `bi2-metricas-03-metricas-guardia`, `bi2-metricas-04-north-star-goodhart`).
- `src/data/schema/lesson.js`: valida con Zod cada lección (`LessonSchema`), exigiendo `contentVersion: 1`, `tracks` como arreglo, entre 4 y 6 `sections`, exactamente 3 `checkpoints` con 4 opciones (`text`, `correct`), `workedExample.expectedOutput` como arreglo de filas y `practice` con `dataset: 'mercado_brisa'`, `starter`, `solution`, `expected` (SQL), `hints` (3 pistas) y `sources` (`>= 2`).
- `src/data/schema/glossary.js`: valida cada término con `GlossaryTermSchema`, exigiendo `id` en kebab-case, `term`, `english`, `category` dentro de las 6 categorías permitidas (`sql`, `metricas`, `experimentacion`, `ingenieria-datos`, `visualizacion`, `estadistica`), `definition`, `whyItMatters`, `example`, `relatedLessons` y `sources`.
- `src/data/glossary/terms.js`: contiene los términos canónicos actuales del glosario (como `kpi`, `north-star-metric`, `guardrail-metric`, `leading-lagging-indicator`, `srm`, `unit-economics`), permitiendo verificar qué conceptos de `bi2-metricas` ya existen y cuáles deben proponerse en `docs/curriculo/investigacion/bi2-metricas-glossary.json`.
- `src/ai/promptBuilder.js`: construye de forma asíncrona (`await buildContextPrompt(...)`) el prompt contextual del tutor IA inyectando título, objetivos, resumen, extracto de secciones y práctica SQL de la lección activa, además de las instrucciones de `TUTOR_MODES`.
- `scripts/check-content.mjs`: ejecuta la auditoría estructural y de integridad referencial de las lecciones (`--module bi2-metricas`), verificando esquema Zod, conteo de palabras (`900-1300`), unicidad de IDs y referencias cruzadas.
- `scripts/check-copy.mjs`: audita el estilo editorial (`--path src/data/lessons/bi2-metricas`), bloqueando palabras prohibidas (`ecosistema`, `mágico`, `robusto`, etc.), emojis, menciones al año `"2026"`, párrafos con más de 3 negritas y lecciones con promedio `> 22` palabras por oración.
- `src/data/lessons/core1-sql/core1-sql-01-select-from-where.js`: muestra la estructura real de un objeto de lección validado en producción, incluyendo el formato exacto de `workedExample`, `checkpoints`, `roleApplications`, `practice` y `sources`.
- `src/data/lessons/bi1-kpis/bi1-kpis-01-anatomia-kpi.js`: establece la base del Nivel 1 de BI sobre qué es un KPI frente a una métrica de vanidad (enfoque SMART y orientación a decisión), permitiendo que `bi2-metricas` profundice sin repetir en la formalización técnica de grano atómico, filtros canónicos, árboles aditivos/multiplicativos, guardias con SRM y ley de Goodhart.
- `src/lab/duckdb.js`: registra en el motor DuckDB-Wasm del navegador las 13 tablas canónicas de `MERCADO_BRISA_TABLES` (`customers`, `customer_changes`, `products`, `orders`, `order_items`, `payments`, `refunds`, `events`, `marketing_spend`, `experiments`, `experiment_assignments`, `stores`, `calendar`).

---

## Pasos

### Paso 1 — Investigación de fuentes primarias
- Se investigaron y documentaron en `docs/curriculo/investigacion/bi2-metricas.md` seis fuentes primarias autoritativas:
  1. **Goodhart, C. A. E. (1975)** — *Problems of Monetary Management: The U.K. Experience* (Reserve Bank of Australia) y **Strathern, M. (1997)** — *‘Improving ratings’: audit in the British University system* (European Review).
  2. **Kohavi, R., Tang, D., & Xu, Y. (2020)** — *Trustworthy Online Controlled Experiments: A Practical Guide to A/B Testing* (Cambridge University Press, caps. 6, 7 y 21 sobre métricas OEC, métricas guardia, invariantes y Sample Ratio Mismatch).
  3. **Ellis, S., & Brown, M. (2017)** / **Schurman, B. — Amplitude (2020)** — *Hacking Growth* (Crown Currency) y *The North Star Playbook* (Amplitude).
  4. **Kimball, R., & Ross, M. (2013)** — *The Data Warehouse Toolkit* (3.ª ed., Wiley, cap. 2 sobre declaración de grano atómico y aditividad de métricas).
  5. **dbt Labs (2024)** — *MetricFlow & dbt Semantic Layer Specification* (especificación de medidas, dimensiones, grano temporal, filtros canónicos y métricas derivadas/ratios).
  6. **Parmenter, D. (2019)** — *Key Performance Indicators (KPI): Developing, Implementing, and Using Winning KPIs* (4.ª ed., Wiley).

### Paso 2 — Mapa de conceptos y términos del glosario
- Se diseñó en `docs/curriculo/investigacion/bi2-metricas.md` el mapa conceptual del módulo y su grafo de dependencias en Mermaid (`flowchart LR`) conectando:
  - `bi1-kpis-01..03` y `core1-sql` → `bi2-metricas-01-anatomia-metrica` → `bi2-metricas-02-arboles-kpis-palancas` → `bi2-metricas-03-metricas-guardia` → `bi2-metricas-04-north-star-goodhart`.
- Se creó y validó `docs/curriculo/investigacion/bi2-metricas-glossary.json` con 8 términos propuestos (`metrica-canonica`, `filtro-canonico`, `arbol-de-kpis`, `palanca-operativa`, `metrica-rezagada-vs-adelantada`, `umbral-de-guardia`, `metrica-estrella-polar`, `ley-de-goodhart`), todos conformes al 100 % con `GlossaryTermSchema`.

### Paso 3 — Diseño de las 4 lecciones y pruebas contra DuckDB (`public/datasets/`)
- Se ejecutaron consultas reales contra los archivos Parquet de `public/datasets/` y contra DuckDB-Wasm en el navegador para diseñar los ejemplos guiados (`workedExample`) y los ejercicios prácticos (`practice`) sobre datos verificables de Mercado Brisa:
  1. **`bi2-metricas-01-anatomia-metrica`** (*Anatomía de una métrica: numerador, denominador, grano, ventana y filtros*): demuestra la distorsión por *fan-out* al cruzar `orders` con `refunds` sin preagregar y estandariza el cálculo del Ingreso Neto Realizado y Ticket Neto Realizado por canal (`app`, `web`, `tienda`).
  2. **`bi2-metricas-02-arboles-kpis-palancas`** (*Construcción de árboles de KPIs y palancas operativas*): descompone el ingreso neto de forma aditiva por segmento (`pro_barista`, `retail`, `cafeteria_b2b`) y de forma multiplicativa en `Clientes Activos × (Pedidos / Cliente) × (Unidades / Pedido) × (Ingreso Neto / Unidad)` cruzando `orders`, `customers`, `order_items` y `refunds`.
  3. **`bi2-metricas-03-metricas-guardia`** (*Métricas guardia: evitar que un indicador dañe otro*): audita las métricas guardia de negocio (`pct_devolucion_guardia <= 10.0 %`, `pct_margen_neto_guardia >= 42.0 %`) e invariantes experimentales (`Sample Ratio Mismatch` en `EXP-PUSH-CART` con `980` en control vs. `620` en tratamiento, `srm_p_value = 0.0001`), detectando las violaciones de `CMP-RETENCION` (`15.44 %` devolución) y `CMP-VERANO` (`18.49 %` devolución).
  4. **`bi2-metricas-04-north-star-goodhart`** (*Métrica estrella polar (North Star) y ley de Goodhart*): demuestra empíricamente la ley de Goodhart en las 4 campañas pagadas (`CMP-BARISTA`, `CMP-RETENCION`, `CMP-ORIGEN`, `CMP-VERANO`), donde todas registraron exactamente `3,000` pedidos brutos pero divergieron drásticamente en pedidos completados con cero devolución (`nsm_pedidos_valor_entregado`: de `2,520` en `CMP-BARISTA` a `1,940` en `CMP-RETENCION`) y en margen bruto neto (`407,823.94 USD` frente a `125,198.65 USD` en `CMP-VERANO`).

### Paso 4 — Redacción y validación automática de las lecciones
- Se escribieron los 4 archivos en `src/data/lessons/bi2-metricas/` y se validaron con `check-content.mjs` y `check-copy.mjs`:
  - `bi2-metricas-01-anatomia-metrica.js`: `1066` palabras, `19.2` palabras/oración, `0` errores, `0` advertencias.
  - `bi2-metricas-02-arboles-kpis-palancas.js`: `1094` palabras, `19.6` palabras/oración, `0` errores, `0` advertencias.
  - `bi2-metricas-03-metricas-guardia.js`: `1140` palabras, `19.7` palabras/oración, `0` errores, `0` advertencias.
  - `bi2-metricas-04-north-star-goodhart.js`: `1159` palabras, `19.4` palabras/oración, `0` errores, `0` advertencias.

### Paso 5 — Prueba del tutor IA (`agy`) sobre cada lección
- Se ejecutó `buildContextPrompt` (`src/ai/promptBuilder.js`) + `runAgyPrompt` (`server/agyCliRunner.js`) invocando el CLI real de `agy` para las 4 lecciones con dos turnos por lección:
  1. `"Hazme una pregunta para comprobar si lo entendí."`
  2. Evaluación de una respuesta deliberadamente errónea del estudiante.
- **Outputs literales devueltos por el CLI real `agy`:**

#### Lección 1 (`bi2-metricas-01-anatomia-metrica`)
- **Pregunta generada por `agy`:**
  > Imagina que en Mercado Brisa te piden calcular el ingreso neto total del mes pasado combinando las tablas `orders` y `refunds`.
  > Un pedido puede tener más de un reembolso registrado en `refunds`. Si haces un `LEFT JOIN` directo entre `orders` y `refunds` usando `order_id` antes de sumar los montos:
  > 1. ¿Qué problema numérico ocurre con las filas y el valor de `orders.order_total_usd`?
  > 2. ¿Cómo debes transformar la tabla `refunds` antes de unirla para respetar el grano atómico de la métrica?
- **Evaluación de `agy` ante respuesta errónea (`LEFT JOIN` directo + `WHERE status = 'completed'`):**
  > Tu consulta tiene dos problemas graves que inflarán tu cifra:
  > 1. **Inflación por fan-out (duplicación de filas):** Si un pedido tiene 2 reembolsos, el `LEFT JOIN` directo duplica la fila de `orders`. Al hacer `SUM(o.order_total_usd)`, sumas ese pedido dos veces en vez de una. El grano atómico de la evaluación debe ser una fila por `order_id`.
  > 2. **Filtro canónico incompleto:** Al filtrar solo `status = 'completed'`, dejas fuera los pedidos con `status = 'refunded'`. Esos pedidos sí existieron y se realizaron; excluirlos subestima las ventas originales y distorsiona el neto.
  > Para resolver el fan-out, debes **preagregar** la tabla `refunds` antes de unirla, asegurando que quede exactamente a grano `order_id`.

#### Lección 2 (`bi2-metricas-02-arboles-kpis-palancas`)
- **Pregunta generada por `agy`:**
  > Imagina que el equipo directivo de Mercado Brisa nota una caída en el ingreso neto trimestral y te pide analizarlo. Tienes dos opciones de desglose inicial:
  > 1. Separar el ingreso neto sumando los segmentos `pro_barista`, `retail` y `cafeteria_b2b`.
  > 2. Descomponer el ingreso neto multiplicando `Clientes Activos × (Pedidos / Cliente) × (Unidades / Pedido) × (Ingreso Neto / Unidad)`.
  > ¿Cuál de estos dos enfoques representa una rama aditiva y cuál una multiplicativa? Además, si quisieras identificar exactamente qué palanca de comportamiento del cliente falló (por ejemplo, si dejaron de comprar seguido o si compran menos productos por carrito), ¿cuál de los dos enfoques te daría esa respuesta directa y por qué?
- **Evaluación de `agy` ante respuesta errónea (dar descuento por volumen asumiendo que `cafeteria_b2b` compra pocas unidades por pedido):**
  > Esa es una conclusión equivocada y es un error común al mezclar ramas aditivas con multiplicativas. Una rama aditiva solo te dice cuánto aporta cada segmento al total, pero no explica el comportamiento detrás de esa cifra. Que `cafeteria_b2b` genere menos ingreso neto total ($1,137,573.13 USD frente a $2,166,164.59 USD de `pro_barista`) no implica cestas pequeñas ni precios bajos. De hecho, en los datos de Mercado Brisa ocurre lo contrario: `cafeteria_b2b` lidera en tamaño de cesta con **5.75 unidades por pedido**, mientras `pro_barista` gana en volumen de clientes activos (**936**) y en frecuencia de recompra (**6.65 pedidos por cliente**).

#### Lección 3 (`bi2-metricas-03-metricas-guardia`)
- **Pregunta generada por `agy`:**
  > Imagina que en Mercado Brisa lanzas una campaña con la métrica primaria de maximizar ingresos brutos en `orders`. Para proteger el negocio, defines como métrica guardia el margen bruto neto tras reembolsos, con un umbral mínimo de 42.0 %.
  > 1. Si calculas el margen bruto neto restando únicamente el costo de los productos a las ventas brutas, ¿qué incentivo perverso o distorsión estás pasando por alto?
  > 2. Al escribir la consulta SQL uniendo `orders` con `refunds`, ¿por qué debes filtrar `WHERE status IN ('completed', 'refunded')` a nivel general de la consulta en lugar de filtrar ese estado solo dentro del cálculo del reembolso?
- **Evaluación de `agy` ante respuesta errónea (lanzar `EXP-PUSH-CART` ignorando `srm_p_value = 0.0001`):**
  > No, no debes lanzarlo. Lanzar ese cambio sería un error grave. El resultado de ingresos no es confiable debido a un desbalance severo en la asignación: tienes 980 usuarios en control frente a 620 en tratamiento. Con un `srm_p_value = 0.0001` (muy por debajo del umbral estándar de 0.01 o 0.05), tienes un **Sample Ratio Mismatch (SRM)** estadísticamente significativo. El SRM actúa precisamente como una **métrica guardia de confiabilidad experimental**: cuando esta guardia falla, la causalidad se rompe y la métrica primaria queda invalidada.

#### Lección 4 (`bi2-metricas-04-north-star-goodhart`)
- **Pregunta generada por `agy`:**
  > Imagina que el equipo de marketing te presenta un reporte donde la campaña `CMP-VERANO` alcanzó con éxito los `3,000` pedidos brutos fijados como meta. Sin embargo, al auditar la tabla `orders` y cruzarla con `refunds`, notas que hubo `325` pedidos cancelados y `730` con devoluciones.
  > 1. Según la ley de Goodhart, ¿por qué el conteo de pedidos brutos dejó de ser una métrica útil en este caso?
  > 2. Si tuvieras que definir la **Métrica Estrella Polar (North Star)** en SQL para medir únicamente las unidades de valor efectivamente entregadas al cliente, ¿qué condiciones exactas deberías aplicar sobre el estado del pedido y las devoluciones?
- **Evaluación de `agy` ante respuesta errónea (pagar bono igualitario por `COUNT(*)` de 3,000 filas en `orders`):**
  > Ese es precisamente el error que describe la ley de Goodhart: contar todas las filas en `orders` mide volumen fabricado, no valor real ni rentabilidad. Las cuatro campañas no fueron igual de rentables. `CMP-VERANO` alcanzó los 3,000 pedidos brutos captando compras de baja intención: tuvo 325 cancelaciones y 730 devoluciones (`1,945` pedidos limpios). Una verdadera Métrica Estrella Polar mide **unidades de valor efectivamente entregadas al cliente**: `COUNT(o.order_id) FILTER (WHERE o.status = 'completed' AND COALESCE(d.devuelto_usd, 0) = 0)`.

### Paso 6 — Verificación en navegador + DuckDB-Wasm en vivo (`1280x720` y `390x844`)
- Se levantó el servidor Vite en `http://127.0.0.1:5217/` y se verificaron con Playwright (`capture_and_test.mjs`) las 4 lecciones en desktop (`1280x720`) y móvil (`390x844`):
  - `0` errores de consola (`console.error` / `pageerror`).
  - `0` desbordamientos horizontales (`scrollWidth <= innerWidth` en ambos viewports).
  - `0` ocurrencias de `**` crudo o `[object Object]`.
  - En las 4 lecciones, el código `starter` falla legítimamente al pulsar *Comprobar resultado*, y el código `solution` ejecuta en DuckDB-Wasm en vivo y obtiene `"Práctica superada · El resultado coincide con la referencia"`.
  - Se tomaron y revisaron visualmente con `read_file` las 8 capturas PNG en `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-bi2-metricas\`.

### Paso 7 — Tablas de cierre y rúbrica de autoevaluación (§9.2 y §9.4)

#### Tabla resumen de verificación por lección (§9.2)

| Lección | Palabras (`body`) | Prom. palabras/oración | `check-content` | `check-copy` | `starter` falla | `solution` pasa en DuckDB-Wasm | Tutor IA (`agy`) | Capturas (`1280x720` + `390x844`) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `bi2-metricas-01-anatomia-metrica` | 1,066 | 19.2 | OK (0 errores) | OK (0 hallazgos) | Sí | Sí (`3 filas × 4 cols`) | Verificado (2 turnos) | Verificadas con `read_file` |
| `bi2-metricas-02-arboles-kpis-palancas` | 1,094 | 19.6 | OK (0 errores) | OK (0 hallazgos) | Sí | Sí (`3 filas × 7 cols`) | Verificado (2 turnos) | Verificadas con `read_file` |
| `bi2-metricas-03-metricas-guardia` | 1,140 | 19.7 | OK (0 errores) | OK (0 hallazgos) | Sí | Sí (`5 filas × 6 cols`) | Verificado (2 turnos) | Verificadas con `read_file` |
| `bi2-metricas-04-north-star-goodhart` | 1,159 | 19.4 | OK (0 errores) | OK (0 hallazgos) | Sí | Sí (`4 filas × 6 cols`) | Verificado (2 turnos) | Verificadas con `read_file` |

#### Tabla de rúbrica de calidad 0–4 por criterio (§9.4 de `docs/estandares-calidad.md`)

| # | Criterio | `bi2-metricas-01` | `bi2-metricas-02` | `bi2-metricas-03` | `bi2-metricas-04` | Evidencia concreta |
| :---: | :--- | :---: | :---: | :---: | :---: | :--- |
| 1 | **Claridad conceptual y progresión** | 4/4 | 4/4 | 4/4 | 4/4 | Cada lección abre con un escenario numérico real de Mercado Brisa, desarrolla 3 secciones conceptuales progresivas con tablas y diagramas Mermaid y cierra conectando con la siguiente lección. |
| 2 | **Rigor técnico y fuentes primarias** | 4/4 | 4/4 | 4/4 | 4/4 | Respaldado por 6 fuentes primarias autoritativas (Kimball 2013, dbt Labs 2024, Parmenter 2019, Kohavi et al. 2020, Ellis & Brown 2017 / Amplitude 2020, Goodhart 1975 / Strathern 1997). |
| 3 | **Anclaje en datos reales (`mercado_brisa`)** | 4/4 | 4/4 | 4/4 | 4/4 | Todas las cifras del texto, tablas markdown, `workedExample` y `practice` provienen de consultas reales sobre las tablas canónicas de `MERCADO_BRISA_TABLES` en DuckDB-Wasm. |
| 4 | **Calidad del ejemplo guiado (`workedExample`)** | 4/4 | 4/4 | 4/4 | 4/4 | Cada `workedExample` incluye problema concreto, consulta SQL reproducible con CTEs a grano explícito, `steps` explicativos numerados, `expectedOutput` exacto e `interpretation` accionable. |
| 5 | **Diseño de comprobaciones (`checkpoints`)** | 4/4 | 4/4 | 4/4 | 4/4 | 3 preguntas por lección (12 en total) con distractores plausibles basados en errores reales (*fan-out*, inversión de denominador, ignorar SRM, confundir ramas aditivas y multiplicativas, medir volumen bruto). |
| 6 | **Calidad de la práctica aplicada (`practice`)** | 4/4 | 4/4 | 4/4 | 4/4 | `starter` incompleto que falla legítimamente, 3 `hints` graduales, `solution` que ejecuta en `< 250 ms` en DuckDB-Wasm en el navegador y coincide al 100 % con `expected`. |
| 7 | **Voz editorial y legibilidad (`check-copy`)** | 4/4 | 4/4 | 4/4 | 4/4 | `0` hallazgos en `check-copy.mjs`; promedio de `19.2` a `19.7` palabras por oración (`<= 22`), máximo 3 negritas por párrafo, español técnico neutro y sin clichés de IA. |
| 8 | **Integración con UI y Tutor IA (`agy`)** | 4/4 | 4/4 | 4/4 | 4/4 | `0` errores de consola, `0` overflow en `1280x720` y `390x844`, diagramas Mermaid y bloques callout bien renderizados, y tutor IA `agy` probado con éxito en 2 turnos por lección. |
| — | **Promedio por lección** | **4.00 / 4.00** | **4.00 / 4.00** | **4.00 / 4.00** | **4.00 / 4.00** | **Promedio global del módulo: 4.00 / 4.00** (`>= 3.25` requerido). |

---

## Test

### 1. `node scripts/check-content.mjs --module bi2-metricas`
```text
Auditoria de contenido curricular (modulo: bi2-metricas)...

  OK   bi2-metricas-01-anatomia-metrica [1066 palabras]
  OK   bi2-metricas-02-arboles-kpis-palancas [1094 palabras]
  OK   bi2-metricas-03-metricas-guardia [1140 palabras]
  OK   bi2-metricas-04-north-star-goodhart [1159 palabras]

Resumen: 4 lecciones inspeccionadas | 4 validas | 0 con advertencias (needsReview) | 0 con errores.
Resultado: OK (0 errores de esquema o integridad).
```

### 2. `node scripts/check-copy.mjs --path src/data/lessons/bi2-metricas` + `docs/curriculo/investigacion/bi2-metricas.md`
```text
Auditoria de copy (check-copy) en 4 archivo(s) [src/data/lessons/bi2-metricas]...

0 hallazgos de terminos prohibidos, emojis, "2026" o exceso de negritas.
Ninguna leccion supera el promedio de 22 palabras por oracion en sections[].body.

Total de hallazgos: 0.

Auditoria de copy (check-copy) en 1 archivo(s) [docs/curriculo/investigacion/bi2-metricas.md]...

0 hallazgos de terminos prohibidos, emojis, "2026" o exceso de negritas.
Total de hallazgos: 0.
```

### 3. Validación de `docs/curriculo/investigacion/bi2-metricas-glossary.json` contra `GlossaryTermSchema`
```text
All 8 glossary terms in bi2-metricas-glossary.json are 100% valid against GlossaryTermSchema!
```

### 4. `npm run build`
```text
> grano@0.0.0 build
> vite build

vite v8.0.8 building client environment for production...
✓ 2401 modules transformed.
✓ built in 14.00s
```

### 5. Verificación en navegador y DuckDB-Wasm en vivo (`capture_and_test.mjs`)
```json
[
  {
    "slug": "bi2-metricas-01-anatomia-metrica",
    "consoleErrors": [],
    "desktopOverflow": false,
    "mobileOverflow": false,
    "hasRawBold": false,
    "hasObjectObject": false,
    "starterFailed": true,
    "solutionPassed": true,
    "feedbackBanner": "Práctica superada · El resultado coincide con la referencia\n\nResultado verificado: 3 fila(s) y 4 columna(s) coinciden con la referencia."
  },
  {
    "slug": "bi2-metricas-02-arboles-kpis-palancas",
    "consoleErrors": [],
    "desktopOverflow": false,
    "mobileOverflow": false,
    "hasRawBold": false,
    "hasObjectObject": false,
    "starterFailed": true,
    "solutionPassed": true,
    "feedbackBanner": "Práctica superada · El resultado coincide con la referencia\n\nResultado verificado: 3 fila(s) y 7 columna(s) coinciden con la referencia."
  },
  {
    "slug": "bi2-metricas-03-metricas-guardia",
    "consoleErrors": [],
    "desktopOverflow": false,
    "mobileOverflow": false,
    "hasRawBold": false,
    "hasObjectObject": false,
    "starterFailed": true,
    "solutionPassed": true,
    "feedbackBanner": "Práctica superada · El resultado coincide con la referencia\n\nResultado verificado: 5 fila(s) y 6 columna(s) coinciden con la referencia."
  },
  {
    "slug": "bi2-metricas-04-north-star-goodhart",
    "consoleErrors": [],
    "desktopOverflow": false,
    "mobileOverflow": false,
    "hasRawBold": false,
    "hasObjectObject": false,
    "starterFailed": true,
    "solutionPassed": true,
    "feedbackBanner": "Práctica superada · El resultado coincide con la referencia\n\nResultado verificado: 4 fila(s) y 6 columna(s) coinciden con la referencia."
  }
]
```

---

## Revisión propia

Defectos reales detectados y corregidos antes de cerrar la entrega:

1. **Tablas heredadas en `public/datasets/` no montadas en `src/lab/duckdb.js` (`MERCADO_BRISA_TABLES`):**
   - *Defecto:* En `public/datasets/` existen archivos Parquet legados (`order_lines.parquet` y `campaigns.parquet`), pero `src/lab/duckdb.js` monta únicamente las 13 tablas canónicas de `MERCADO_BRISA_TABLES` (`customers`, `customer_changes`, `products`, `orders`, `order_items`, `payments`, `refunds`, `events`, `marketing_spend`, `experiments`, `experiment_assignments`, `stores`, `calendar`). En la primera prueba en vivo con Playwright + DuckDB-Wasm, las prácticas de L2, L3 y L4 fallaron con `Table with name order_lines does not exist!`.
   - *Corrección:* Se reescribieron las consultas de `workedExample` y `practice` (y las tablas del cuerpo y de `docs/curriculo/investigacion/bi2-metricas.md`) de L2, L3 y L4 para usar exclusivamente `order_items` (cruzado con `products` para `oi.qty * p.unit_cost_usd`), `stores.region`, `orders.campaign_id`, `experiments` y `experiment_assignments`. Tras la corrección, las 4 lecciones pasaron al 100 % en DuckDB-Wasm en el navegador.
2. **Promedio de longitud de oración (`> 22` palabras/oración) y palabras prohibidas en el primer borrador:**
   - *Defecto:* La primera ejecución de `node scripts/check-copy.mjs` detectó 4 ocurrencias de palabras prohibidas (`ecosistema`, `mágico`, `robusto`), 1 párrafo con 4 negritas en L4 y promedios de palabras por oración de `24.5` a `29.3` en las 4 lecciones.
   - *Corrección:* Se reemplazaron los términos prohibidos por lenguaje técnico preciso, se redujeron las negritas a máximo 3 por párrafo y se dividieron las oraciones subordinadas largas hasta situar las 4 lecciones entre `19.2` y `19.7` palabras por oración (`0` hallazgos en `check-copy.mjs`).
3. **Alineación de campos de esquema en `LessonSchema` y `GlossaryTermSchema`:**
   - *Defecto:* En el primer borrador se utilizó `track: 'bi'` en vez de `tracks: ['bi']` + `contentVersion: 1`, `options[].label` en vez de `options[].text` + `correct: boolean`, `practice.expected` como arreglo JSON en vez de consulta SQL y categorías fuera del enum en `bi2-metricas-glossary.json`.
   - *Corrección:* Se ajustaron las 4 lecciones y los 8 términos del glosario para cumplir estrictamente con `LessonSchema` y `GlossaryTermSchema`, logrando `0` errores y `0` advertencias en `check-content.mjs`.
4. **Invocación asíncrona de `buildContextPrompt` y selección de modelo en el runner de `agy`:**
   - *Defecto:* Al probar inicialmente el tutor IA desde script, `buildContextPrompt` se llamó de forma síncrona (devolviendo una promesa sin resolver) y con un identificador de modelo no listado en `agy models`.
   - *Corrección:* Se usó `await buildContextPrompt(...)` y el modelo por defecto del CLI `agy`, verificando las 8 respuestas reales del tutor (4 preguntas diagnósticas y 4 correcciones de respuestas erróneas).

---

## Prueba adversarial

| Qué probé | Qué pasó | Acción |
| :--- | :--- | :--- |
| **1. Ejecutar el código `starter` de cada una de las 4 lecciones y pulsar `Comprobar resultado` en el navegador (`capture_and_test.mjs`)** | En las 4 lecciones el evaluador rechazó el resultado del `starter` (`starterFailed: true`) mostrando el banner de discrepancia de columnas/filas sin errores de consola ni cuelgues de UI. | Comportamiento esperado confirmado; garantiza que ninguna práctica pueda aprobarse sin completar los `TODO`. |
| **2. Hacer `LEFT JOIN` directo entre `orders` y `refunds` sin preagregar `refunds` a grano `order_id` en L1** | Los pedidos con múltiples filas en `refunds` duplicaron su fila de `orders` (*fan-out*), inflando `SUM(o.subtotal_usd - o.discount_usd)` y produciendo cifras falsas. | Se documentó este caso en la sección 3, en el checkpoint `bi2-metricas-01-cp2` y en la pista 1 de la práctica de L1, exigiendo preagregar `refunds` en una CTE por `order_id`. |
| **3. Calcular en L3 la tasa de devolución y el margen bruto neto sin filtrar `WHERE o.status IN ('completed', 'refunded')`** | Al incluir pedidos `cancelled` en el denominador (`SUM(subtotal_usd - discount_usd)`), la tasa de devolución se diluyó artificialmente (`CMP-RETENCION` bajó de `15.44 %` a `13.43 %`) e infló el margen aparente. | Se explicó la regla de consistencia entre numerador y denominador en la sección 4 de L3 y se verificó en la consulta de referencia que el filtro canónico aplique a toda la tabla `orders`. |
| **4. Evaluar en L3 el experimento `EXP-PUSH-CART` mirando solo el lift de gasto post-experimento (`65.57 USD` vs. `59.63 USD`)** | Al cruzar `experiments` con `experiment_assignments`, el grupo `control` tenía `980` clientes (`61.25 %`) y `treatment` solo `620` (`38.75 %`) frente al reparto esperado `50/50`, con `srm_p_value = 0.0001` (Sample Ratio Mismatch severo). | Se incorporó este caso real en el `workedExample` de L3 con una guardia SQL que marca `BLOQUEADO_POR_SRM` cuando `srm_p_value < 0.01`, invalidando la lectura de ingreso. |
| **5. Evaluar las 4 campañas pagadas de Mercado Brisa en L4 usando `COUNT(*)` sobre `orders` (meta de 3,000 pedidos brutos)** | Las 4 campañas (`CMP-BARISTA`, `CMP-RETENCION`, `CMP-ORIGEN`, `CMP-VERANO`) empataron exactamente en `3,000` filas brutas, ocultando que `CMP-VERANO` tuvo `325` cancelados y `730` devueltos (`125,198.65 USD` de margen) frente a los `2,520` pedidos limpios de `CMP-BARISTA` (`407,823.94 USD` de margen). | Se diseñó la práctica de L4 para calcular `nsm_pedidos_valor_entregado` con `FILTER (WHERE o.status = 'completed' AND COALESCE(d.devuelto_usd, 0) = 0)` junto con las guardias `pct_calidad_entregada` y `margen_bruto_neto_usd`. |
| **6. Redimensionar las 4 lecciones a viewport móvil (`390x844`) con tablas anchas, bloques SQL y diagramas Mermaid** | `document.documentElement.scrollWidth <= window.innerWidth` se mantuvo `true` (`mobileOverflow: false`) en las 4 lecciones; los contenedores de tabla y código aplicaron scroll interno limpio sin romper el layout general. | Verificado en `capture_and_test.mjs` y mediante inspección visual de las capturas móviles. |

---

## Capturas antes / después

> Al tratarse de un módulo nuevo (`bi2-metricas`), antes de esta entrega las 4 lecciones no existían en `src/data/lessons/bi2-metricas/` (mostraban el estado *Próximamente*). Las capturas siguientes corresponden al estado final verificado en `http://127.0.0.1:5217/` e inspeccionado con `read_file`:

| Archivo de captura (ruta absoluta) | Viewport / Vista | Observación tras inspección visual con `read_file` |
| :--- | :---: | :--- |
| `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-bi2-metricas\bi2-metricas-01-anatomia-metrica-cabecera.png` | `1280x720` (Cabecera L1) | Título, migas de pan (*Diseño de métricas y árboles de KPIs*), píldora `20 min · Nivel 2 (Intermedio)`, bloque *ESCENARIO REAL* y *OBJETIVOS DE LA LECCIÓN* perfectamente alineados y sin texto crudo `**`. |
| `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-bi2-metricas\bi2-metricas-01-anatomia-metrica-practica.png` | `1280x720` (Práctica L1) | Editor SQL con la solución ejecutada en DuckDB-Wasm (210.8 ms), banner verde *"Práctica superada · El resultado coincide con la referencia (3 fila(s) y 4 columna(s))"* y tabla con `app`, `web`, `tienda`. |
| `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-bi2-metricas\bi2-metricas-02-arboles-kpis-palancas-cabecera.png` | `1280x720` (Cabecera L2) | Cabecera limpia con enlace de prerrequisito a L1, *ESCENARIO REAL* con cifras reales de `pro_barista`, `retail` y `cafeteria_b2b`, e índice lateral de 9 secciones activo. |
| `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-bi2-metricas\bi2-metricas-02-arboles-kpis-palancas-practica.png` | `1280x720` (Práctica L2) | Banner verde *"Práctica superada · El resultado coincide con la referencia (3 fila(s) y 7 columna(s))"* en 94.9 ms y tabla con las 4 palancas multiplicativas por segmento. |
| `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-bi2-metricas\bi2-metricas-03-metricas-guardia-cabecera.png` | `1280x720` (Cabecera L3) | Cabecera de *Métricas guardia: evitar que un indicador dañe otro*, *ESCENARIO REAL* con `CMP-RETENCION` y `EXP-PUSH-CART` (`srm_p_value = 0.0001`), tipografía y espaciado impecables. |
| `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-bi2-metricas\bi2-metricas-03-metricas-guardia-practica.png` | `1280x720` (Práctica L3) | Banner verde *"Práctica superada · El resultado coincide con la referencia (5 fila(s) y 6 columna(s))"* en 196.9 ms, mostrando `ORG-DIRECTO`, `CMP-RETENCION` (`15.44 %`), `CMP-BARISTA` y `CMP-VERANO` (`18.49 %`). |
| `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-bi2-metricas\bi2-metricas-04-north-star-goodhart-cabecera.png` | `1280x720` (Cabecera L4) | Cabecera de *Métrica estrella polar (North Star) y ley de Goodhart*, *ESCENARIO REAL* contrastando los 3,000 pedidos brutos frente a los pedidos limpios y margen neto de `CMP-BARISTA` y `CMP-VERANO`. |
| `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-bi2-metricas\bi2-metricas-04-north-star-goodhart-practica.png` | `1280x720` (Práctica L4) | Banner verde *"Práctica superada · El resultado coincide con la referencia (4 fila(s) y 6 columna(s))"* en 90.9 ms, con `pedidos_brutos = 3000` en las 4 campañas y `nsm_pedidos_valor_entregado` ordenado por `margen_bruto_neto_usd DESC`. |
| `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-bi2-metricas\*-movil.png` (4 archivos) | `390x844` (Móvil L1–L4) | Sin desbordamiento horizontal (`mobileOverflow: false` en las 4 lecciones), navegación móvil e interfaz legibles. |

---

## Peticiones al orquestador

1. **Regeneración de `src/data/lessons/index.js`:**
   - Siguiendo las reglas de propiedad de archivos, se revirtió `src/data/lessons/index.js` antes del commit (`git checkout -- src/data/lessons/index.js`). Al integrar la rama `agente/W-bi2-metricas`, ejecutar `node scripts/sync-lessons-index.mjs` para registrar las 4 lecciones de `bi2-metricas`.
2. **Fusión de términos del glosario (`docs/curriculo/investigacion/bi2-metricas-glossary.json`):**
   - Incorporar en `src/data/glossary/terms.js` los 8 términos validados contra `GlossaryTermSchema` (`metrica-canonica`, `filtro-canonico`, `arbol-de-kpis`, `palanca-operativa`, `metrica-rezagada-vs-adelantada`, `umbral-de-guardia`, `metrica-estrella-polar`, `ley-de-goodhart`) o actualizar `relatedLessons` en los términos equivalentes existentes.
3. **Nota informativa sobre `public/datasets/` vs. `src/lab/duckdb.js`:**
   - En `public/datasets/` existen dos archivos Parquet adicionales (`order_lines.parquet` y `campaigns.parquet`) que no están listados en `MERCADO_BRISA_TABLES` dentro de `src/lab/duckdb.js`. Todas las consultas de `bi2-metricas` usan exclusivamente las 13 tablas canónicas de `MERCADO_BRISA_TABLES` (`orders`, `order_items`, `products`, `customers`, `refunds`, `stores`, `experiments`, `experiment_assignments`), pero conviene tenerlo presente para otros módulos.

---

## Pendiente

Ninguno.
