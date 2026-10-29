# Reporte de agente — `W-da2-inferencia`

- **Agente:** `W-da2-inferencia` (Escritor del módulo `da2-inferencia`: *"Probabilidad e inferencia estadística"*, Nivel 2, Track `da` — Fase 3, Oleada B)
- **Rama y worktree:** `agente/W-da2-inferencia` en `C:\Users\T490s\Desktop\Proyectos\ING-W-da2-inferencia`
- **Puerto de verificación Vite:** `5215` (`http://127.0.0.1:5215`)

---

## Inicio

Lectura obligatoria de contexto y estándares antes de redactar:

- `PLAN_GEMINI_4_ARGON.md` (§5, §6, §9 y Apéndice D.3): se verificó el contrato de las 6 lecciones de `da2-inferencia`, la investigación web previa obligatoria, el límite de media de palabras por oración (`<= 22`), el tope de negritas (`<= 3` por párrafo), la prohibición de términos corporativos/muletillas/emojis/`"2026"` fuera de `sources`, la prueba real de `agy` (`gemini-3.8-flash-low`) y la verificación E2E en navegador real sin ensuciar git con capturas ni con `src/data/lessons/index.js`.
- `docs/estandares/calidad-copy-y-diseno.md`: se confirmó la lista de términos prohibidos (incluyendo `"tríada"`, `"sinergia"`, `"paradigma"`, `"delve"`, `"sumérgete"`, etc.), la estructura pedagógica por bloques y la exigencia de tono sobrio, técnico y directo en español.
- `docs/curriculo/matriz-competencias.md`: se identificó que el módulo `da2-inferencia` desarrolla la competencia transversal de cuantificación de incertidumbre, inferencia frecuentista/bayesiana y diseño muestral previo a `da3-experimentos`.
- `docs/curriculo/mapa-curricular.md`: se revisaron las 6 lecciones asignadas a `da2-inferencia` (Nivel 2, ruta `da`, 135 minutos totales) y su engarce con `c0-numeros-04`, `c0-numeros-05`, `c1-python-05` como prerrequisitos y `da3-experimentos-01-ab-testing-cuped` como continuación directa.
- `src/data/schema/lesson.js`: se inspeccionó `LessonSchema` (Zod v4), validando los nombres exactos de propiedades (`moduleId`, `minutes`, `sections[].heading`, `checks[].type = 'mcq'`, `options[].text`, `practice.expected`, `practice.solutionExplanation`, `practice.expectedOutputTable`, `flashcards[].id`, `sources[].publisher/accessed/supports`).
- `src/data/schema/glossary.js`: se verificó `GlossaryListSchema` y `GlossaryEntrySchema`, que exigen definición de `20..60` palabras, `formula` opcional, `example` obligatorio, `relatedLessons` y `sources` con URLs `https://`.
- `src/data/lessons/da3-experimentos/da3-experimentos-01-ab-testing-cuped.js`: se estudió la lección canónica de referencia del track `da` para alinear tono, profundidad técnica, uso de la base de datos *Mercado Brisa* (`orders`, `payments`, `stores`, `customers`, `experiment_assignments`, `experiments`) y calibración de `aiNotes`.

---

## Pasos

### Paso 1 — Investigación web real (`docs/curriculo/investigacion/da2-inferencia.md`)
Se ejecutaron búsquedas web (`search_web`) sobre 5 fuentes primarias autoritativas y se documentaron en `docs/curriculo/investigacion/da2-inferencia.md`:
1. **Ronald L. Wasserstein & Nicole A. Lazar (2016)**, *"The ASA Statement on p-Values: Context, Process, and Purpose"*, *The American Statistician* (`https://doi.org/10.1080/00031305.2016.1154108`) — los 6 principios oficiales de la ASA sobre qué es y qué no es el valor $p$.
2. **NIST/SEMATECH e-Handbook of Statistical Methods** (`https://www.itl.nist.gov/div898/handbook/eda/section3/eda366.htm` y `prc/section1/prc14.htm`) — galería de distribuciones discretas y continuas, teorema del límite central e intervalos de confianza.
3. **Ron Kohavi, Diane Tang & Ya Xu (2020)**, *Trustworthy Online Controlled Experiments: A Practical Guide to A/B Testing*, Cambridge University Press (`https://experimentguide.com/`) — ecuación de tamaño de muestra por brazo, MDE, potencia $(1-\beta)$ y asimetría de colas en métricas monetarias.
4. **David Spiegelhalter (2019)**, *The Art of Statistics: Learning from Data*, Pelican / Penguin (`https://www.penguin.co.uk/books/306600/the-art-of-statistics-by-spiegelhalter-david/9780241258767`) — árboles de frecuencias naturales para actualización bayesiana y falacia de la tasa base.
5. **Documentación oficial de DuckDB v1.5 — Aggregate Functions** (`https://duckdb.org/docs/stable/sql/functions/aggregates`) — semántica exacta de `STDDEV_SAMP`, `VAR_SAMP`, `MEDIAN`, `QUANTILE_CONT` y funciones matemáticas en SQL analítico.

### Paso 2 — Auditoría cuantitativa contra DuckDB (*Mercado Brisa*)
Antes de redactar los ejemplos guiados y las prácticas SQL, se ejecutaron todas las consultas contra el dataset determinista de *Mercado Brisa* (`public/datasets/mercado_brisa/*.parquet`) verificando los números exactos:
- **L01 (`payments` y `orders`):** 18 450 primeros intentos de pago (`attempt_number = 1`) repartidos equitativamente (25 % por método) con 1 812 fallos totales; `transferencia_spei` presenta tasa condicional de fallo de `11.75 %` (`542 / 4612`) y probabilidad posterior dado un fallo de `29.91 %` (`542 / 1812`). En `orders` + `customers`, `cafeteria_b2b` tiene `19.81 %` de pedidos altos (`>= 800 USD`), pero representa `25.67 %` del total de pedidos altos (`628 / 2446`) frente a `38.68 %` de `pro_barista` (`946 / 2446`).
- **L02 (`orders`):** `desktop` (`7 716` pedidos, media `456.14 USD`, mediana `386.39 USD`, media geométrica `328.00 USD`, $\sigma_{\ln} = 0.910$), `mobile` (`6 857` pedidos, media `390.52 USD`, mediana `309.13 USD`, media geométrica `267.58 USD`, $\sigma_{\ln} = 0.957$) y `pos_tienda` (`3 427` pedidos, media `429.66 USD`, mediana `357.37 USD`, media geométrica `314.84 USD`, $\sigma_{\ln} = 0.866$).
- **L03 (`orders` + `stores`):** error estándar del ticket medio por país: `AR` (`5.11 USD`, `1.30 %`), `CO` (`5.32 USD`, `1.34 %`), `ES` (`5.72 USD`, `1.19 %`), `MX` (`6.18 USD`, `1.49 %`), `PE` (`6.27 USD`, `1.50 %`), `CL` (`6.54 USD`, `1.44 %`).
- **L04 (`orders` + `stores`):** intervalos de confianza al 95 % para las primeras 5 tiendas: `STR-MX-01` (`[325.08, 367.17] USD`) y `STR-MX-03` (`[329.50, 371.39] USD`) se solapan ampliamente pese a la diferencia puntual de `4.32 USD`, mientras que `STR-MX-02` (`[468.22, 523.25] USD`) se separa con claridad.
- **L05 (`experiment_assignments` + `experiments`):** en los 5 experimentos de *Mercado Brisa*, `EXP-CHECKOUT-1STEP` pasa de `61.49 USD` (control) a `68.40 USD` (tratamiento, `+6.91 USD`), con estadístico $t = 7.56$ y tamaño del efecto $d = 0.378$.
- **L06 (`orders` + `customers`):** cálculo de tamaño de muestra por brazo para detectar un MDE relativo del 5 % con $\alpha = 0.05$ y potencia $1-\beta = 0.80$: `cafeteria_b2b` requiere `2 825` pedidos por brazo (`MDE = 25.69 USD`), `retail` requiere `3 599` (`MDE = 20.50 USD`) y `pro_barista` requiere `3 716` (`MDE = 20.24 USD`).

### Paso 3 — Creación de las 6 lecciones y del glosario (`da2-inferencia-glossary.json`)
Se redactaron los 6 archivos en `src/data/lessons/da2-inferencia/` y los 12 términos en `docs/curriculo/investigacion/da2-inferencia-glossary.json`.

#### Tabla resumen de métricas de contenido (§9.2)

| # | Lección (`id`) | Palabras | Media oración | Secciones | Checks | Práctica | Flashcards | Fuentes | Check-content | Check-copy | Agy real |
|---|---|---:|---:|---:|---:|---|---:|---:|---|---|---|
| 1 | `da2-inferencia-01-probabilidad-bayes` | 1 140 | 17.6 | 3 (`bayes-posterior`) | 3 (`mcq` + `code-Locate`) | SQL (4 filas, 6 cols) | 4 | 3 | OK (0 warn, 0 err) | OK (0 hallazgos) | OK (9.3 s) |
| 2 | `da2-inferencia-02-distribuciones-probabilidad` | 1 041 | 17.9 | 3 (`distribution-gallery`) | 3 (`mcq` + `code-Locate`) | SQL (3 filas, 6 cols) | 4 | 3 | OK (0 warn, 0 err) | OK (0 hallazgos) | OK (9.4 s) |
| 3 | `da2-inferencia-03-muestreo-tlc-error-estandar` | 1 030 | 15.3 | 3 (`clt-sampler`) | 3 (`mcq` + `code-Locate`) | SQL (6 filas, 6 cols) | 3 | 3 | OK (0 warn, 0 err) | OK (0 hallazgos) | OK (7.3 s) |
| 4 | `da2-inferencia-04-intervalos-confianza` | 1 029 | 15.9 | 3 (`ci-coverage-sim`) | 3 (`mcq` + `code-Locate`) | SQL (5 filas, 7 cols) | 3 | 3 | OK (0 warn, 0 err) | OK (0 hallazgos) | OK (10.3 s) |
| 5 | `da2-inferencia-05-pruebas-hipotesis-valor-p` | 1 064 | 17.9 | 3 (`ab-simulator`) | 3 (`mcq` + `code-Locate`) | SQL (5 filas, 6 cols) | 4 | 3 | OK (0 warn, 0 err) | OK (0 hallazgos) | OK (7.7 s) |
| 6 | `da2-inferencia-06-errores-potencia-tamano-muestra` | 1 119 | 17.2 | 3 (`power-sample-calc`) | 3 (`mcq` + `code-Locate`) | SQL (3 filas, 6 cols) | 4 | 3 | OK (0 warn, 0 err) | OK (0 hallazgos) | OK (6.6 s) |

### Paso 4 — Autoevaluación con la rúbrica de 8 criterios (§9.4)

| # | Lección (`id`) | C1 Claridad | C2 Rigor técnico | C3 Anclaje negocio | C4 Calidad SQL | C5 Comprobaciones | C6 Notas de área | C7 Guía tutor IA | C8 Fuentes | Total (/32) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | `da2-inferencia-01-probabilidad-bayes` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32/32** |
| 2 | `da2-inferencia-02-distribuciones-probabilidad` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32/32** |
| 3 | `da2-inferencia-03-muestreo-tlc-error-estandar` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32/32** |
| 4 | `da2-inferencia-04-intervalos-confianza` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32/32** |
| 5 | `da2-inferencia-05-pruebas-hipotesis-valor-p` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32/32** |
| 6 | `da2-inferencia-06-errores-potencia-tamano-muestra` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32/32** |

### Paso 5 — Prueba real del tutor IA (`agy`) en las 6 lecciones
Se construyó el prompt completo con `buildContextPrompt` (`src/ai/promptBuilder.js`) y se invocó `runAgyPrompt` (`src/ai/agyBridge.js`) con el modelo rápido `gemini-3.8-flash-low` simulando en cada lección el error específico descrito en `aiNotes`. Los 6 llamados respondieron con explicaciones pedagógicas alineadas a las guías socráticas de `aiNotes` (ver transcripción literal en `## Test`).

### Paso 6 — Verificación E2E en navegador real (Playwright + DuckDB-Wasm)
Se levantó el servidor Vite en el puerto `5215` y se ejecutó un script E2E en Chromium real verificando para las 6 lecciones:
1. Renderizado completo del encabezado, escenario real, objetivos y secciones sin errores de consola (`0` errores).
2. Ejecución de `Comprobar resultado` con `starterCode` → verificación de estado `.is-fail` en `[data-testid="sql-grade-box"]`.
3. Carga de `practice.solution` y ejecución de `Comprobar resultado` → verificación de estado `.is-pass` en `[data-testid="sql-grade-box"]` y coincidencia exacta de filas y columnas en DuckDB-Wasm.
4. Captura e inspección visual mediante `read_file` de 16 capturas PNG (`1280x720` light/dark y `390x844` móvil light/dark + prueba adversarial).

---

## Test

### 1. Validador de esquema y métricas (`check-content.mjs`)
Comando ejecutado:
```powershell
node scripts/check-content.mjs --module da2-inferencia
```
Salida literal:
```text
========================================================================
 Reporte de validación de contenido (LessonSchema v2)
========================================================================

  ✓ [OK]  da2-inferencia-01-probabilidad-bayes             (da2-inferencia · N2 · 1140 palabras · 3 secciones · 3 checks · 4 flashcards · 3 fuentes)
  ✓ [OK]  da2-inferencia-02-distribuciones-probabilidad    (da2-inferencia · N2 · 1041 palabras · 3 secciones · 3 checks · 4 flashcards · 3 fuentes)
  ✓ [OK]  da2-inferencia-03-muestreo-tlc-error-estandar    (da2-inferencia · N2 · 1030 palabras · 3 secciones · 3 checks · 3 flashcards · 3 fuentes)
  ✓ [OK]  da2-inferencia-04-intervalos-confianza           (da2-inferencia · N2 · 1029 palabras · 3 secciones · 3 checks · 3 flashcards · 3 fuentes)
  ✓ [OK]  da2-inferencia-05-pruebas-hipotesis-valor-p      (da2-inferencia · N2 · 1064 palabras · 3 secciones · 3 checks · 4 flashcards · 3 fuentes)
  ✓ [OK]  da2-inferencia-06-errores-potencia-tamano-muestra (da2-inferencia · N2 · 1119 palabras · 3 secciones · 3 checks · 4 flashcards · 3 fuentes)

------------------------------------------------------------------------
 Total lecciones analizadas: 6
   ✓ Válidas:                6
   ⚠ Con advertencias:       0 (needsReview)
   ✗ Con errores:            0
------------------------------------------------------------------------
 Resultado: OK — Todas las lecciones cumplen LessonSchema.
```

### 2. Auditoría de copy y estilo (`check-copy.mjs`)
Comando ejecutado:
```powershell
node scripts/check-copy.mjs --path src/data/lessons/da2-inferencia
```
Salida literal:
```text
=== Auditoría de Copy y Estilo (T-04) ===
Archivos escaneados: 6

✓ Sin hallazgos de términos prohibidos, emojis, "2026" o exceso de negritas.
Total de hallazgos: 0
```

### 3. Validación de media de palabras por oración (`<= 22`) y `GlossaryListSchema`
Salida literal de `stats_da2.mjs`:
```text
da2-inferencia-01-probabilidad-bayes: words=896, sentences=51, avg=17.6
da2-inferencia-02-distribuciones-probabilidad: words=788, sentences=44, avg=17.9
da2-inferencia-03-muestreo-tlc-error-estandar: words=780, sentences=51, avg=15.3
da2-inferencia-04-intervalos-confianza: words=779, sentences=49, avg=15.9
da2-inferencia-05-pruebas-hipotesis-valor-p: words=805, sentences=45, avg=17.9
da2-inferencia-06-errores-potencia-tamano-muestra: words=858, sentences=50, avg=17.2
Glossary valid: true count: 12
  probabilidad-condicional: 37 words
  teorema-de-bayes: 40 words
  tasa-base: 38 words
  distribucion-binomial: 40 words
  distribucion-de-poisson: 42 words
  distribucion-log-normal: 43 words
  teorema-del-limite-central: 42 words
  error-estandar: 41 words
  intervalo-de-confianza: 43 words
  valor-p: 42 words
  tamano-del-efecto: 41 words
  potencia-estadistica: 43 words
```

### 4. Respuestas literales de `agy` (`gemini-3.8-flash-low`) sobre las 6 lecciones
- **`da2-inferencia-01-probabilidad-bayes` (9 347 ms):**
  > El problema está en el denominador que elegiste para cada cálculo. Recuerda la regla de oro: el denominador define qué representa tu 100 %.
  > 1. **`prob_fallo_dado_metodo_pct` ($P(\text{Fallo} \mid \text{Método})$):** Tu universo de referencia (el 100 %) es ese método de pago específico. Quieres saber qué porcentaje de los intentos con ese método falló. Por tanto, debes dividir entre el total de intentos de esa fila (`total_intentos`).
  > 2. **`posterior_metodo_dado_fallo_pct` ($P(\text{Método} \mid \text{Fallo})$):** Tu universo de referencia son todos los fallos globales de la plataforma. Quieres saber qué porcentaje de los fallos totales vino de ese método. Por tanto, debes dividir entre la suma global de fallos (`SUM(intentos_fallidos) OVER ()`).
- **`da2-inferencia-02-distribuciones-probabilidad` (9 424 ms):**
  > Te falta aplicar la función exponencial `EXP()` al promedio de los logaritmos. El valor `5.79` está en escala logarítmica ($\ln(\text{USD})$). Para regresar a la escala original en dólares y obtener la media geométrica, debes revertir el logaritmo con `EXP()`: `ROUND(EXP(AVG(LN(total_usd))), 2) AS media_geometrica_usd`. Al calcular $e^{5.79}$ obtendrás los aproximadamente `328.00 USD`.
- **`da2-inferencia-03-muestreo-tlc-error-estandar` (7 313 ms):**
  > El valor te da demasiado pequeño porque estás dividiendo entre el tamaño de la muestra ($n$) en lugar de dividir entre su raíz cuadrada ($\sqrt{n}$). La fórmula del error estándar de la media es $SE = \frac{s}{\sqrt{n}}$. Para corregirlo en tu consulta, aplica la función `SQRT()` al denominador: `ROUND(STDDEV_SAMP(o.total_usd) / SQRT(COUNT(o.order_id)), 2) AS error_estandar_usd`.
- **`da2-inferencia-04-intervalos-confianza` (10 315 ms):**
  > La diferencia se debe a un problema de **doble redondeo**. En tu consulta estás sumando y restando valores que ya pasaron por `ROUND(..., 2)`. Al truncar decimales intermedios antes de hacer la operación aritmética, el error de redondeo se acumula y altera el último centavo. Para obtener el resultado exacto, debes realizar toda la operación aritmética con la precisión completa y aplicar `ROUND(..., 2)` una sola vez al final.
- **`da2-inferencia-05-pruebas-hipotesis-valor-p` (7 738 ms):**
  > El error ocurre porque la variabilidad total siempre se acumula. En el numerador restas las medias para saber la diferencia entre grupos. En el denominador calculas el **error estándar**, que mide la incertidumbre combinada de ambas muestras. La incertidumbre de un grupo nunca cancela ni reduce la incertidumbre del otro: siempre se suma: `ROUND((media_trat - media_ctrl) / SQRT(var_ctrl / n_ctrl + var_trat / n_trat), 2) AS estadistico_t`.
- **`da2-inferencia-06-errores-potencia-tamano-muestra` (6 597 ms):**
  > Tienes dos detalles importantes en la fórmula del numerador:
  > 1. **Usaste la desviación estándar en vez de la varianza**: la fórmula del tamaño de muestra requiere la varianza ($\sigma^2$), no la desviación estándar ($\sigma$). Debes usar `VAR_SAMP(o.total_usd)`.
  > 2. **Olvidaste el factor 2**: al comparar dos brazos (control y tratamiento), se suman las varianzas de ambos grupos ($\sigma_A^2 + \sigma_B^2$). Si asumimos varianzas iguales, el numerador debe multiplicarse por 2.

### 5. Build de producción (`npm run build`)
Comando ejecutado:
```powershell
npm run build
```
Salida literal:
```text
> manual-interactivo-datos-2026@2.0.0 build
> vite build

vite v8.0.8 building client environment for production...
✓ 2403 modules transformed.
✓ built in 48.04s
```

---

## Revisión propia

Durante la construcción y auditoría se detectaron y corrigieron **6 defectos propios**:

1. **Desajuste inicial de claves en `LessonSchema` y `GlossaryListSchema`:** en el primer borrador se utilizaron alias antiguos (`module` en lugar de `moduleId`, `durationMinutes` en lugar de `minutes`, `sections[].title` en lugar de `heading`, `checks[].type = 'multiple-choice'` en lugar de `'mcq'` y `sources[].note` en lugar de `publisher/accessed/supports`). Se inspeccionaron `src/data/schema/lesson.js` y `src/data/schema/glossary.js` y se normalizaron las 6 lecciones y los 12 términos del glosario hasta obtener `0` errores y `0` advertencias.
2. **Oraciones largas con media `> 22` palabras por oración:** el script de conteo de oraciones detectó que los borradores iniciales tenían promedios entre `22.7` y `25.8` palabras/oración. Se dividieron las cláusulas subordinadas extensas en las secciones teóricas de las 6 lecciones, reduciendo los promedios al rango `15.3–17.9` palabras/oración.
3. **Exceso de negritas (`> 3` por párrafo) en L01 y L06:** `check-copy.mjs` señaló dos párrafos con 4 marcas `**...**` (la enumeración de conceptos de probabilidad en L01 sección 1 y los 4 cuadrantes de decisión en L06 sección 1). Se sustituyeron las negritas de términos secundarios por cursivas/código inline, dejando `<= 3` negritas por párrafo.
4. **Aparición del término prohibido `"tríada"` en `roleNotes.da` de L05:** `check-copy.mjs` detectó la frase `"Esta tríada evita tanto..."` en `da2-inferencia-05-pruebas-hipotesis-valor-p.js`. Se reemplazó por `"Reportar estos tres indicadores juntos evita tanto..."`, logrando `0` hallazgos en `check-copy.mjs`.
5. **Resolución de prerrequisitos de L01 en validación aislada (`--module da2-inferencia`):** al validar únicamente el módulo `da2-inferencia`, el validador comprueba `prerequisites` contra las claves de `MODULES` (`c0-numeros-04`, `c0-numeros-05`, `c1-python-05`). Se ajustó `prerequisites` en `da2-inferencia-01-probabilidad-bayes.js` a esos IDs canónicos de catálogo, que además `LESSONS_BY_ID` resuelve automáticamente en la interfaz hacia sus títulos completos.
6. **Doble redondeo en el cálculo de intervalos de confianza (L04):** al verificar la consulta SQL de `da2-inferencia-04-intervalos-confianza.js` contra DuckDB, se comprobó que restar o sumar columnas ya redondeadas a 2 decimales desplazaba un centavo en `STR-MX-02` (`523.24` vs `523.25`) y `STR-MX-03` (`371.40` vs `371.39`). Se documentó explícitamente esta regla en el `prompt` de la práctica, en `hints` y en `aiNotes`, calculando `AVG(o.total_usd) ± 1.96 * STDDEV_SAMP(o.total_usd) / SQRT(COUNT(o.order_id))` antes del `ROUND(..., 2)` final.

---

## Prueba adversarial

Se ejecutaron **6 pruebas adversariales** sobre el código, el motor DuckDB-Wasm y los validadores:

| Qué probé | Qué pasó | Acción |
|---|---|---|
| **1. Consulta SQL vacía o solo con espacios (`'   '`) en `SqlLab`** | Al pulsar `Comprobar resultado` con el editor en blanco en L01, `SqlLab` capturó la entrada vacía sin romper la interfaz (`0` errores de consola) y mostró la alerta `[data-testid="sql-error-box"]` indicando que la consulta está vacía. | Verificado en Playwright (`Adversarial 1: errorVisible=true, gradeVisible=false`). |
| **2. SQL con error de sintaxis y tabla inexistente (`SELECT * FROM tabla_inexistente_xyz WHERE ???;`)** | DuckDB-Wasm devolvió `Parser Error: syntax error at or near "?"` dentro del contenedor `[data-testid="sql-error-box"]` y habilitó el botón `Explícame este error` para abrir el tutor IA con el contexto del fallo. | Capturado e inspeccionado en `adversarial-sql-error-handling.png`. |
| **3. División entre cero en SQL (`SELECT 1 / 0 AS div_zero;`)** | DuckDB ejecutó la división en punto flotante devolviendo `Infinity` sin colapsar el Web Worker, y el evaluador `gradeSqlPractice` reportó limpiamente las columnas faltantes (`payment_method`, `total_intentos`, etc.) y la fila sobrante (`div_zero: Infinity`). | Verificado en Playwright (`Adversarial 3`) y documentado el uso de `NULLIF(..., 0)` en las guías del módulo. |
| **4. Ejecución de los 6 `starterCode` en el calificador SQL (`Comprobar resultado`)** | Ninguno de los 6 `starterCode` aprueba por accidente: todos producen `.is-fail` en `[data-testid="sql-grade-box"]` porque inicializan las columnas analíticas con `0`, mostrando la tabla comparativa de filas esperadas vs. filas sobrantes. | Verificado en E2E para las 6 lecciones (`starterFailed: true` en L01..L06). |
| **5. Inyección de consultas de estudiante con errores conceptuales sutiles al tutor `agy`** | Se enviaron a `agy` (`gemini-3.8-flash-low`) 6 consultas con errores sutiles (denominadores invertidos en Bayes, falta de `EXP()` en media geométrica, división entre `COUNT` sin `SQRT`, doble redondeo en IC 95 %, resta de varianzas bajo la raíz en Welch y uso de `STDDEV_SAMP` sin factor `2` en tamaño de muestra). | `agy` diagnosticó con precisión los 6 errores usando las pautas de `aiNotes` sin regalar la solución completa de golpe. |
| **6. Viewport móvil estrecho (`390x844`) en tema claro y oscuro con fórmulas y tablas anchas** | Se renderizaron L01 (claro) y L06 (oscuro) a `390x844`. Los bloques de código y tablas activan scroll interno horizontal sin generar desborde horizontal del documento ni solapar la barra superior. | Verificado visualmente en `L01-da2-inferencia-01-mobile-390x844.png` y `L06-da2-inferencia-06-mobile-dark-390x844.png`. |

---

## Capturas antes / después

Todas las capturas se guardaron fuera del árbol git en `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-da2-inferencia\` y fueron inspeccionadas visualmente con `read_file`:

1. `L01-da2-inferencia-01-probabilidad-bayes-top-light.png` (`1280x720`, encabezado y escenario real de L01 en modo claro).
2. `L01-da2-inferencia-01-probabilidad-bayes-practice-solved.png` (`1280x720`, práctica SQL de Bayes superada en DuckDB-Wasm con 4 filas y 6 columnas).
3. `L02-da2-inferencia-02-distribuciones-probabilidad-top-light.png` (`1280x720`, encabezado y escenario real de L02 en modo claro).
4. `L02-da2-inferencia-02-distribuciones-probabilidad-practice-solved.png` (`1280x720`, práctica SQL de parámetros log-normales superada con 3 filas y 6 columnas).
5. `L03-da2-inferencia-03-muestreo-tlc-error-estandar-top-light.png` (`1280x720`, encabezado y escenario real de L03 en modo claro).
6. `L03-da2-inferencia-03-muestreo-tlc-error-estandar-practice-solved.png` (`1280x720`, práctica SQL de error estándar por país superada con 6 filas y 6 columnas).
7. `L04-da2-inferencia-04-intervalos-confianza-top-light.png` (`1280x720`, encabezado y escenario real de L04 en modo claro).
8. `L04-da2-inferencia-04-intervalos-confianza-practice-solved.png` (`1280x720`, práctica SQL de intervalos de confianza al 95 % superada con 5 filas y 7 columnas).
9. `L05-da2-inferencia-05-pruebas-hipotesis-valor-p-top-light.png` (`1280x720`, encabezado y escenario real de L05 en modo claro).
10. `L05-da2-inferencia-05-pruebas-hipotesis-valor-p-practice-solved.png` (`1280x720`, práctica SQL de estadístico $t$ de Welch y $d$ de Cohen superada con 5 filas y 6 columnas).
11. `L06-da2-inferencia-06-errores-potencia-tamano-muestra-top-light.png` (`1280x720`, encabezado y escenario real de L06 en modo claro).
12. `L06-da2-inferencia-06-errores-potencia-tamano-muestra-practice-solved.png` (`1280x720`, práctica SQL de tamaño de muestra por brazo al 80 % de potencia superada con 3 filas y 6 columnas).
13. `L05-da2-inferencia-05-dark-desktop.png` (`1280x720`, verificación de contraste y jerarquía tipográfica en modo oscuro).
14. `L01-da2-inferencia-01-mobile-390x844.png` (`390x844`, vista móvil en modo claro).
15. `L06-da2-inferencia-06-mobile-dark-390x844.png` (`390x844`, vista móvil en modo oscuro).
16. `adversarial-sql-error-handling.png` (`1280x720`, manejo visual de errores de ejecución SQL en DuckDB-Wasm).

---

## Peticiones al orquestador

- **Para el integrador `I-contenido` (T-12):**
  1. Registrar e importar las 6 lecciones de `src/data/lessons/da2-inferencia/da2-inferencia-01..06-*.js` en `src/data/lessons/index.js` (durante las pruebas locales se revirtió el cambio temporal en `src/data/lessons/index.js` con `git checkout -- src/data/lessons/index.js` para respetar estrictamente la propiedad de archivos).
  2. Fusionar los 12 términos validados de `docs/curriculo/investigacion/da2-inferencia-glossary.json` en `src/data/glossary.js` y las 22 flashcards del módulo en el mazo global si corresponde.

---

## Pendiente

- Ningún ítem pendiente dentro del alcance de `W-da2-inferencia`. Los 9 archivos propietarios están creados, validados y listos en la rama `agente/W-da2-inferencia`.
