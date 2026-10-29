# W-da2-inferencia · Probabilidad e inferencia estadística

- **Agente:** `W-da2-inferencia` (Escritor del módulo `da2-inferencia`: *"Probabilidad e inferencia estadística"*, Nivel 2, Track `da` — Fase 3, Oleada B)
- **Rama y worktree:** `agente/W-da2-inferencia` en `C:\Users\T490s\Desktop\Proyectos\ING-W-da2-inferencia`
- **Puerto de verificación Vite:** `5215` (`http://127.0.0.1:5215`)

---

## Inicio

- **Archivos leídos (uno por línea, con un dato concreto aprendido de cada uno):**
  - `PLAN_GEMINI_4_ARGON.md`: verifiqué las reglas comunes (§1), el contrato anti-pereza (§2), el alcance de `da2-inferencia` (§5), los 7 pasos obligatorios de la ficha del escritor (§9.2), los 8 criterios de la rúbrica de autoevaluación (§9.4) y las reglas de esquema y copy de los Apéndices A y B.
  - `src/data/catalog/modules.js`: comprobé el registro del módulo `da2-inferencia` (`level: 2`, `track: 'da'`, `prerequisites: ['c0-numeros', 'c1-python']`, `estimatedMinutes: 135`), los IDs de catálogo de sus 6 lecciones (`da2-inferencia-01` a `06`) y su proyecto integrador *"Calcular intervalos de confianza para las métricas mensuales de Mercado Brisa y distinguir cambios reales de fluctuación"*.
  - `src/data/schema/lesson.js`: confirmé que `LessonSchema` (Zod v4) exige `moduleId`, `minutes` (`10..40`), `sections[].heading`, `checks[].type` (`'mcq' | 'predict-output' | 'order' | 'fill-code' | 'code-Locate'`), `practice.expected`, `practice.solutionExplanation`, `practice.expectedOutputTable`, `flashcards[].id` y `sources[].supports`.
  - `src/data/schema/glossary.js`: verifiqué que `GlossaryListSchema` valida arreglos de términos con `id` en kebab-case, `definition` de `20..60` palabras, `example` obligatorio, `relatedLessons` y `sources` con URLs `https://`.
  - `public/datasets/README.md`: revisé el proceso generador determinista de *Mercado Brisa* (semilla fija, `18 000` pedidos en `orders`, `18 450` pagos en `payments`, `18` tiendas en `stores` y `5` experimentos en `experiments`/`experiment_assignments`) y los sesgos e imperfecciones intencionales del dataset.
  - `public/datasets/schema.json`: comprobé los nombres y tipos exactos de columnas en Parquet (`orders.total_usd`, `payments.attempt_number`, `payments.status`, `stores.country_code`, `experiment_assignments.metric_value`, `customers.segment`).
  - `src/data/lessons/c0-numeros/c0-numeros-04-proporciones-tasas-bps.js`: confirmé que el alumno ya domina proporciones, tasas, puntos porcentuales (`pp`) y puntos base (`bps`), lo que permite apoyar directamente la probabilidad condicional y la tasa base de la lección 1 sin repetir definiciones aritméticas elementales.
  - `src/data/lessons/c0-numeros/c0-numeros-05-correlacion-causalidad.js`: verifiqué que el alumno ya conoce variables confusoras y correlación espuria, sirviendo de puente hacia muestreo aleatorio y pruebas de hipótesis.
  - `src/data/lessons/c1-python/c1-python-05-cuaderno-a-script-cli.js`: comprobé cómo se estructuran validaciones reproducibles antes de automatizar cálculos estadísticos en producción.
  - `src/data/lessons/da3-experimentos/da3-experimentos-01-ab-testing-cuped.js`: revisé la lección canónica del track `da` (Nivel 3) para asegurar continuidad pedagógica entre nuestras lecciones 5–6 ($t$ de Welch, $d$ de Cohen, errores Tipo I/II, potencia y tamaño de muestra) y el diseño de experimentos A/B con CUPED.
  - `scripts/check-content.mjs`: constaté que valida tanto `LessonSchema` como el conteo de palabras visibles (`600..1600` para Nivel 2) y la existencia de IDs en `prerequisites` contra `MODULES`.
  - `scripts/check-copy.mjs`: verifiqué la expresión regular de términos prohibidos (incluyendo `"tríada"`, `"clave"`, `"crucial"`, `"fundamental"`, `"robusto"`, `"sumérgete"`), el límite de `<= 3` negritas por párrafo y el cálculo de longitud media de oración (`<= 22` palabras/frase en `sections[].body`).
  - `src/ai/promptBuilder.js` y `server/agyCliRunner.js`: comprobé que `buildContextPrompt` es asíncrono y ensambla el contexto de la lección (`objectives`, `sections`, `aiNotes`) para enviarlo por `stdin` a `agy --disable-slash-commands --sandbox` con el modelo rápido `gemini-3.8-flash-low`.
  - `src/views/LessonPlayer.jsx` y `src/lab/SqlLab.jsx`: identifiqué los selectores reales del reproductor continuo y del laboratorio DuckDB-Wasm (`[data-testid="sql-lab"]`, `[data-testid="sql-engine-status"]`, `[data-testid="sql-grade-btn"]`, `[data-testid="sql-grade-box"]`).
- **Estado encontrado:** el directorio `src/data/lessons/da2-inferencia/` no existía y las 6 lecciones de `da2-inferencia` figuraban con `status: 'planned'` en `src/data/catalog/modules.js`.

---

## Pasos

### Paso 1 — Investigación (`docs/curriculo/investigacion/da2-inferencia.md`)
- **Qué hice:** ejecuté búsquedas web (`search_web`) y documenté 5 fuentes primarias y técnicas verificadas (con fecha de consulta `2026-10-29` y desglose de qué afirmación respalda cada una) cubriendo las 6 lecciones del módulo:
  1. **Ronald L. Wasserstein & Nicole A. Lazar (2016)**, *"The ASA Statement on p-Values: Context, Process, and Purpose"*, *The American Statistician* (`https://doi.org/10.1080/00031305.2016.1154108`) — respalda los 6 principios de la ASA sobre el valor $p$ y la distinción entre significancia estadística y efecto práctico en L05.
  2. **NIST/SEMATECH e-Handbook of Statistical Methods** (`https://www.itl.nist.gov/div898/handbook/eda/section3/eda366.htm` y `https://www.itl.nist.gov/div898/handbook/prc/section1/prc14.htm`) — respalda las familias de distribuciones discretas y continuas en L02, el teorema del límite central en L03 y la cobertura frecuentista de intervalos de confianza en L04.
  3. **Ron Kohavi, Diane Tang & Ya Xu (2020)**, *Trustworthy Online Controlled Experiments: A Practical Guide to A/B Testing*, Cambridge University Press (`https://experimentguide.com/`) — respalda el modelo log-normal para métricas monetarias asimétricas en L02, el contraste de dos muestras independientes en L05 y la ecuación de tamaño de muestra por brazo y MDE en L06.
  4. **David Spiegelhalter (2019)**, *The Art of Statistics: Learning from Data*, Pelican / Penguin (`https://www.penguin.co.uk/books/306600/the-art-of-statistics-by-spiegelhalter-david/9780241258767`) — respalda el método de frecuencias naturales para actualización bayesiana y prevención de la falacia de la tasa base en L01.
  5. **DuckDB Documentation v1.5 — Aggregate Functions** (`https://duckdb.org/docs/stable/sql/functions/aggregates`) — respalda el uso exacto de `STDDEV_SAMP`, `VAR_SAMP`, `MEDIAN`, `LN`, `EXP` y `SQRT` en las 6 lecciones.
- **Archivos y líneas:** `docs/curriculo/investigacion/da2-inferencia.md` (líneas 1–165).
- **Evidencia:** archivo creado y validado con matriz de trazabilidad fuente ↔ lección ↔ afirmación técnica.

### Paso 2 — Mapa de conceptos del módulo
- **Qué hice:** tracé la progresión conceptual entre las 6 lecciones verificando que ningún concepto se utilice antes de haberse definido:
  - **L01 (`da2-inferencia-01-probabilidad-bayes`):** asume proporciones y tasas (`c0-numeros-04`); introduce espacio muestral, probabilidad conjunta, marginal y condicional, inversión de la condición, tasa base (*prior*), verosimilitud, probabilidad posterior y teorema de Bayes con frecuencias naturales.
  - **L02 (`da2-inferencia-02-distribuciones-probabilidad`):** asume probabilidad condicional (L01) y asimetría descriptiva (`c0-numeros-03`); introduce variable aleatoria, distribuciones discretas binomial y de Poisson, y distribuciones continuas normal y log-normal (incluyendo media geométrica $\exp(\mu_{\ln})$).
  - **L03 (`da2-inferencia-03-muestreo-tlc-error-estandar`):** asume distribuciones (L02) y confusores (`c0-numeros-05`); introduce población frente a muestra aleatoria, sesgo de selección, distribución muestral de la media, teorema del límite central (TLC), error estándar ($SE = s / \sqrt{n}$) y ley de la raíz cuadrada de $n$.
  - **L04 (`da2-inferencia-04-intervalos-confianza`):** asume el TLC y el error estándar (L03); introduce estimación puntual, valor crítico $z$, margen de error, intervalo de confianza al 95 % para medias y proporciones, interpretación frecuentista de cobertura y auditoría de rankings con solapamiento.
  - **L05 (`da2-inferencia-05-pruebas-hipotesis-valor-p`):** asume intervalos de confianza (L04); introduce hipótesis nula ($H_0$) y alternativa ($H_1$), estadístico $t$ de Welch para dos muestras independientes, valor $p$ según los principios de la ASA y tamaño del efecto estandarizado ($d$ de Cohen).
  - **L06 (`da2-inferencia-06-errores-potencia-tamano-muestra`):** asume pruebas de hipótesis y tamaño del efecto (L05); introduce matriz de decisión, error Tipo I ($\alpha$), error Tipo II ($\beta$), potencia estadística ($1 - \beta$), efecto mínimo detectable (MDE), fórmula de tamaño de muestra a priori por brazo y conversión a días de tráfico.
- **Archivos y líneas:** documentado en `docs/curriculo/investigacion/da2-inferencia.md` (sección de progresión curricular) y reflejado en los arrays `prerequisites` y `glossaryTerms` de las 6 lecciones.
- **Evidencia:** `node scripts/check-content.mjs --module da2-inferencia` verifica el encadenamiento de `prerequisites` sin referencias huérfanas.

### Paso 3 — Escritura de las 6 lecciones (`src/data/lessons/da2-inferencia/*.js`)
- **Qué hice:** redacté las 6 lecciones siguiendo el orden de diseño pedagógico (`objectives` → `checks` → `sections` → `workedExample` → `practice` → `hook` → `summary` → `flashcards` → `roleNotes` → `sources` → `aiNotes`) y las reglas del Apéndice B (oraciones cortas con media `< 18` palabras, máximo 3 negritas por párrafo, cero jerga vacía).
- **Archivos y líneas:**
  1. `src/data/lessons/da2-inferencia/da2-inferencia-01-probabilidad-bayes.js` (líneas 1–417)
  2. `src/data/lessons/da2-inferencia/da2-inferencia-02-distribuciones-probabilidad.js` (líneas 1–377)
  3. `src/data/lessons/da2-inferencia/da2-inferencia-03-muestreo-tlc-error-estandar.js` (líneas 1–420)
  4. `src/data/lessons/da2-inferencia/da2-inferencia-04-intervalos-confianza.js` (líneas 1–449)
  5. `src/data/lessons/da2-inferencia/da2-inferencia-05-pruebas-hipotesis-valor-p.js` (líneas 1–468)
  6. `src/data/lessons/da2-inferencia/da2-inferencia-06-errores-potencia-tamano-muestra.js` (líneas 1–395)
- **Evidencia:** `check-content.mjs` reporta `6 válidas | 0 con advertencias | 0 con errores` y `check-copy.mjs` reporta `0 hallazgos`.

### Paso 4 — Ejecución de todo SQL contra Mercado Brisa en DuckDB
- **Qué hice:** ejecuté todas las consultas SQL de `sections[].example`, `workedExample.steps` y `practice` contra los archivos Parquet reales de *Mercado Brisa* en DuckDB e inserté las filas exactas en `expectedOutput` y `expectedOutputTable`:
  - **L01 (`payments` / `orders`):** en `payments` (`attempt_number = 1`), `transferencia_spei` registra `4 612` intentos y `542` fallos (`prior = 25.00 %`, `prob_fallo_dado_metodo = 11.75 %`, `posterior_metodo_dado_fallo = 29.91 %`).
  - **L02 (`orders`):** por `device_type`, `desktop` tiene `7 716` pedidos con media aritmética `456.14 USD`, mediana `386.39 USD`, media geométrica `328.00 USD` y desvío logarítmico `0.910`.
  - **L03 (`orders` + `stores`):** por `country_code`, Argentina (`AR`, `3 429` pedidos) presenta desvío individual `299.00 USD` y error estándar `5.11 USD` (`1.30 %`), mientras Chile (`CL`, `2 572` pedidos) presenta desvío `331.79 USD` y error estándar `6.54 USD` (`1.44 %`).
  - **L04 (`orders` + `stores`):** en las 5 primeras tiendas (`store_id <= 5`), `STR-MX-01` tiene media `346.13 USD` e IC 95 % `[325.08, 367.17] USD` (`±21.05 USD`), solapándose con `STR-MX-03` (`350.45 USD`, IC 95 % `[329.50, 371.39] USD`), mientras `STR-MX-02` (`495.73 USD`, IC 95 % `[468.22, 523.25] USD`) se separa estadísticamente.
  - **L05 (`experiment_assignments` + `experiments`):** en los 5 experimentos, `EXP-CHECKOUT-1STEP` muestra `61.49 USD` en control vs. `68.40 USD` en tratamiento (`+6.91 USD`), con $t = 7.56$ y $d = 0.378$.
  - **L06 (`orders` + `customers`):** para un MDE relativo del 5 % con $\alpha = 0.05$ y potencia $80\text{ \%}$, `cafeteria_b2b` requiere `2 825` pedidos por brazo (`MDE = 25.69 USD`), `retail` `3 599` (`MDE = 20.50 USD`) y `pro_barista` `3 716` (`MDE = 20.24 USD`).
- **Archivos y líneas:** bloques `workedExample` y `practice` de los 6 archivos en `src/data/lessons/da2-inferencia/`.
- **Evidencia:** las 6 prácticas SQL aprueban en el calificador en vivo de `SqlLab.jsx` sobre DuckDB-Wasm en Playwright (`Solution grade: class="sql-grade-box is-pass"` en L01 a L06).

### Paso 5 — Glosario (`docs/curriculo/investigacion/da2-inferencia-glossary.json`)
- **Qué hice:** redacté 12 términos nuevos del módulo (`probabilidad-condicional`, `teorema-de-bayes`, `tasa-base`, `distribucion-binomial`, `distribucion-de-poisson`, `distribucion-log-normal`, `teorema-del-limite-central`, `error-estandar`, `intervalo-de-confianza`, `valor-p`, `tamano-del-efecto`, `potencia-estadistica`) con definición concisa (cumpliendo el validador `GlossaryListSchema` de `src/data/schema/glossary.js`), fórmula matemática, ejemplo concreto sobre *Mercado Brisa* que aclara con qué concepto suele confundirse, lecciones relacionadas y fuentes primarias.
- **Archivos y líneas:** `docs/curriculo/investigacion/da2-inferencia-glossary.json` (líneas 1–303).
- **Evidencia:** validado con `GlossaryListSchema.safeParse` → `Glossary valid: true count: 12`.

### Paso 6 — Proyecto del módulo
- **Qué hice:** revisé el proyecto de módulo registrado en `src/data/catalog/modules.js` (`"Calcular intervalos de confianza para las métricas mensuales de Mercado Brisa y distinguir cambios reales de fluctuación"`) y diseñé la especificación completa de enunciado, tablas de *Mercado Brisa* (`orders`, `stores`, `customers`) y rúbrica de 4 criterios verificables (1. Cálculo SQL sin doble redondeo de error estándar e IC 95 %; 2. Comparación entre media aritmética y media geométrica log-normal; 3. Diagnóstico de solapamiento de intervalos para evitar rankings espurios; 4. Dimensionamiento muestral de potencia al 80 % para el trimestre siguiente), dejando la petición lista en `## Peticiones al orquestador` dado que `src/data/catalog/modules.js` no pertenece a los archivos propietarios de `W-da2-inferencia`.
- **Archivos y líneas:** documentado en `## Peticiones al orquestador` de este reporte.
- **Evidencia:** especificación lista para integrar en `modules.js` / `CapstoneProjectsView.jsx`.

### Paso 7 — Autoevaluación con la rúbrica de §9.4 y tabla resumen de §9.2
- **Qué hice:** evalué cada una de las 6 lecciones contra los 8 criterios de la rúbrica de §9.4 (escala `0–4`, exigiendo `>= 3` en todos) tras corregir los 6 defectos propios detectados durante la revisión.

#### Tabla resumen obligatoria (§9.2)

| lección | palabras | checks | prácticas | fuentes | puntuación de rúbrica |
|---|---:|---:|---|---:|---:|
| `da2-inferencia-01-probabilidad-bayes` | 1 140 | 3 (`2 mcq`, `1 code-Locate`) | 1 (`sql`, 4 filas × 6 cols en `payments`) | 3 | **32 / 32** (promedio 4.0) |
| `da2-inferencia-02-distribuciones-probabilidad` | 1 041 | 3 (`2 mcq`, `1 code-Locate`) | 1 (`sql`, 3 filas × 6 cols en `orders`) | 3 | **32 / 32** (promedio 4.0) |
| `da2-inferencia-03-muestreo-tlc-error-estandar` | 1 030 | 3 (`2 mcq`, `1 code-Locate`) | 1 (`sql`, 6 filas × 6 cols en `orders` + `stores`) | 3 | **32 / 32** (promedio 4.0) |
| `da2-inferencia-04-intervalos-confianza` | 1 029 | 3 (`2 mcq`, `1 code-Locate`) | 1 (`sql`, 5 filas × 7 cols en `orders` + `stores`) | 3 | **32 / 32** (promedio 4.0) |
| `da2-inferencia-05-pruebas-hipotesis-valor-p` | 1 064 | 3 (`2 mcq`, `1 code-Locate`) | 1 (`sql`, 5 filas × 6 cols en `experiment_assignments`) | 3 | **32 / 32** (promedio 4.0) |
| `da2-inferencia-06-errores-potencia-tamano-muestra` | 1 119 | 3 (`2 mcq`, `1 code-Locate`) | 1 (`sql`, 3 filas × 6 cols en `orders` + `customers`) | 3 | **32 / 32** (promedio 4.0) |

#### Desglose de la rúbrica de calidad (§9.4 — escala 0 a 4 por criterio)

| Lección (`id`) | 1. Objetivo claro | 2. Progresión | 3. Ejemplo concreto | 4. Error típico | 5. Práctica | 6. Brevedad | 7. Precisión | 8. Tono | Total (/32) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `da2-inferencia-01-probabilidad-bayes` | 4 | 4 | 4 | 4 | 4 | 4 (`17.6` pal/frase) | 4 | 4 | **32 / 32** |
| `da2-inferencia-02-distribuciones-probabilidad` | 4 | 4 | 4 | 4 | 4 | 4 (`17.9` pal/frase) | 4 | 4 | **32 / 32** |
| `da2-inferencia-03-muestreo-tlc-error-estandar` | 4 | 4 | 4 | 4 | 4 | 4 (`15.3` pal/frase) | 4 | 4 | **32 / 32** |
| `da2-inferencia-04-intervalos-confianza` | 4 | 4 | 4 | 4 | 4 | 4 (`15.9` pal/frase) | 4 | 4 | **32 / 32** |
| `da2-inferencia-05-pruebas-hipotesis-valor-p` | 4 | 4 | 4 | 4 | 4 | 4 (`17.9` pal/frase) | 4 | 4 | **32 / 32** |
| `da2-inferencia-06-errores-potencia-tamano-muestra` | 4 | 4 | 4 | 4 | 4 | 4 (`17.2` pal/frase) | 4 | 4 | **32 / 32** |

---

## Test

### 1. Validador de esquema y métricas (`check-content.mjs`)
Comando ejecutado:
```powershell
node scripts/check-content.mjs --module da2-inferencia
```
Salida literal:
```text
=== Validación de contenido v2 (check-content) ===
Lección (id v2)                                | Módulo               | Niv  | Sec  | Chk  | Src  | Palabras  | Estado    
--------------------------------------------------------------------------------------------------------------------------
da2-inferencia-01-probabilidad-bayes           | da2-inferencia       | 2    | 3    | 3    | 3    | 1140      | OK        
da2-inferencia-02-distribuciones-probabilidad  | da2-inferencia       | 2    | 3    | 3    | 3    | 1041      | OK        
da2-inferencia-03-muestreo-tlc-error-estandar  | da2-inferencia       | 2    | 3    | 3    | 3    | 1030      | OK        
da2-inferencia-04-intervalos-confianza         | da2-inferencia       | 2    | 3    | 3    | 3    | 1029      | OK        
da2-inferencia-05-pruebas-hipotesis-valor-p    | da2-inferencia       | 2    | 3    | 3    | 3    | 1064      | OK        
da2-inferencia-06-errores-potencia-tamano-muestra | da2-inferencia       | 2    | 3    | 3    | 3    | 1119      | OK        
--------------------------------------------------------------------------------------------------------------------------
Resumen: 6 lecciones inspeccionadas | 6 válidas | 0 con advertencias (needsReview) | 0 con errores.

Resultado: OK (0 errores de esquema o integridad).
```

### 2. Auditoría anti-slop de copy (`check-copy.mjs`)
Comando ejecutado:
```powershell
node scripts/check-copy.mjs --path src/data/lessons/da2-inferencia
```
Salida literal:
```text
=== Auditoría anti-slop de copy (check-copy) ===
Archivos escaneados: 6

0 hallazgos de términos prohibidos, emojis, "2026" o exceso de negritas.
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

### 4. Prueba del tutor IA real (`agy`, modelo `gemini-3.8-flash-low`) en las 6 lecciones
Se invocó `buildContextPrompt` + `runAgyPrompt` en cada lección con una consulta deliberadamente errónea del alumno para verificar que el contexto de la lección y `aiNotes` permiten al tutor detectar el error:
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

### 5. Verificación E2E en Playwright (`http://127.0.0.1:5215`) + DuckDB-Wasm
Salida literal de `e2e_da2_inferencia.mjs`:
```text
=== Verificando L01-da2-inferencia-01-probabilidad-bayes ===
Title rendered: Probabilidad condicional y teorema de Bayes en negocio
Starter grade: class="sql-grade-box is-fail" -> El resultado aún no coincide con la referencia 4 fila(s) esperada(s) no aparecen en tu resultado.
Solution grade: class="sql-grade-box is-pass" (4 filas) -> Práctica superada · El resultado coincide con la referencia Resultado verificado: 4 fila(s) y 6 columna(s) coinciden con la referencia.

=== Verificando L02-da2-inferencia-02-distribuciones-probabilidad ===
Title rendered: Distribuciones: binomial, Poisson, normal y log-normal
Starter grade: class="sql-grade-box is-fail" -> El resultado aún no coincide con la referencia 3 fila(s) esperada(s) no aparecen en tu resultado.
Solution grade: class="sql-grade-box is-pass" (3 filas) -> Práctica superada · El resultado coincide con la referencia Resultado verificado: 3 fila(s) y 6 columna(s) coinciden con la referencia.

=== Verificando L03-da2-inferencia-03-muestreo-tlc-error-estandar ===
Title rendered: Muestreo, teorema del límite central y error estándar
Starter grade: class="sql-grade-box is-fail" -> El resultado aún no coincide con la referencia 6 fila(s) esperada(s) no aparecen en tu resultado.
Solution grade: class="sql-grade-box is-pass" (6 filas) -> Práctica superada · El resultado coincide con la referencia Resultado verificado: 6 fila(s) y 6 columna(s) coinciden con la referencia.

=== Verificando L04-da2-inferencia-04-intervalos-confianza ===
Title rendered: Intervalos de confianza: qué significan y cómo comunicarlos
Starter grade: class="sql-grade-box is-fail" -> El resultado aún no coincide con la referencia 5 fila(s) esperada(s) no aparecen en tu resultado.
Solution grade: class="sql-grade-box is-pass" (5 filas) -> Práctica superada · El resultado coincide con la referencia Resultado verificado: 5 fila(s) y 7 columna(s) coinciden con la referencia.

=== Verificando L05-da2-inferencia-05-pruebas-hipotesis-valor-p ===
Title rendered: Pruebas de hipótesis, valor p y tamaño del efecto
Starter grade: class="sql-grade-box is-fail" -> El resultado aún no coincide con la referencia 5 fila(s) esperada(s) no aparecen en tu resultado.
Solution grade: class="sql-grade-box is-pass" (5 filas) -> Práctica superada · El resultado coincide con la referencia Resultado verificado: 5 fila(s) y 6 columna(s) coinciden con la referencia.

=== Verificando L06-da2-inferencia-06-errores-potencia-tamano-muestra ===
Title rendered: Errores tipo I y II, potencia y tamaño de muestra
Starter grade: class="sql-grade-box is-fail" -> El resultado aún no coincide con la referencia 3 fila(s) esperada(s) no aparecen en tu resultado.
Solution grade: class="sql-grade-box is-pass" (3 filas) -> Práctica superada · El resultado coincide con la referencia Resultado verificado: 3 fila(s) y 6 columna(s) coinciden con la referencia.

ALL E2E CHECKS PASSED! Console errors: 0
```

### 6. Build de producción (`npm run build`)
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

## Revisión propia (mínimo 5 defectos encontrados y corregidos)

1. **Desajuste inicial de claves en `LessonSchema` y `GlossaryListSchema`:** en el primer borrador se utilizaron alias antiguos (`module` en lugar de `moduleId`, `durationMinutes` en lugar de `minutes`, `sections[].title` en lugar de `heading`, `checks[].type = 'multiple-choice'` en lugar de `'mcq'` y `sources[].note` en lugar de `publisher/accessed/supports`). Se inspeccionaron `src/data/schema/lesson.js` y `src/data/schema/glossary.js` y se normalizaron las 6 lecciones y los 12 términos del glosario hasta obtener `0` errores y `0` advertencias.
2. **Oraciones largas con media `> 22` palabras por oración:** el script de conteo de oraciones detectó que los borradores iniciales tenían promedios entre `22.7` y `25.8` palabras/oración. Se dividieron las cláusulas subordinadas extensas en las secciones teóricas de las 6 lecciones, reduciendo los promedios al rango `15.3–17.9` palabras/oración.
3. **Exceso de negritas (`> 3` por párrafo) en L01 y L06:** `check-copy.mjs` señaló dos párrafos con 4 marcas `**...**` (la enumeración de conceptos de probabilidad en L01 sección 1 y los 4 cuadrantes de decisión en L06 sección 1). Se sustituyeron las negritas de términos secundarios por cursivas/código inline, dejando `<= 3` negritas por párrafo.
4. **Aparición del término prohibido `"tríada"` en `roleNotes.da` de L05:** `check-copy.mjs` detectó la frase `"Esta tríada evita tanto..."` en `da2-inferencia-05-pruebas-hipotesis-valor-p.js`. Se reemplazó por `"Reportar estos tres indicadores juntos evita tanto..."`, logrando `0` hallazgos en `check-copy.mjs`.
5. **Resolución de prerrequisitos de L01 en validación aislada (`--module da2-inferencia`):** al validar únicamente el módulo `da2-inferencia`, el validador comprueba `prerequisites` contra las claves de `MODULES` (`c0-numeros-04`, `c0-numeros-05`, `c1-python-05`). Se ajustó `prerequisites` en `da2-inferencia-01-probabilidad-bayes.js` a esos IDs canónicos de catálogo, que además `LESSONS_BY_ID` resuelve automáticamente en la interfaz hacia sus títulos completos.
6. **Doble redondeo en el cálculo de intervalos de confianza (L04):** al verificar la consulta SQL de `da2-inferencia-04-intervalos-confianza.js` contra DuckDB, se comprobó que restar o sumar columnas ya redondeadas a 2 decimales desplazaba un centavo en `STR-MX-02` (`523.24` vs `523.25`) y `STR-MX-03` (`371.40` vs `371.39`). Se documentó explícitamente esta regla en el `prompt` de la práctica, en `hints` y en `aiNotes`, calculando `AVG(o.total_usd) ± 1.96 * STDDEV_SAMP(o.total_usd) / SQRT(COUNT(o.order_id))` antes del `ROUND(..., 2)` final.

---

## Prueba adversarial

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
  2. Fusionar los 12 términos validados de `docs/curriculo/investigacion/da2-inferencia-glossary.json` en `src/data/glossary.js` y las 22 flashcards del módulo en `src/data/flashcards.js`.
  3. Si se amplía el objeto `project` de `da2-inferencia` en `src/data/catalog/modules.js`, incluir el dataset (`orders`, `stores`, `customers`) y los 4 criterios de rúbrica detallados en el Paso 6.

---

## Pendiente (con motivo)

- Ningún ítem pendiente dentro del alcance de `W-da2-inferencia`. Los 9 archivos propietarios están creados, validados y commiteados en la rama `agente/W-da2-inferencia`.
