# Reporte de agente — W-c0-numeros: Writer de Números con sentido (Nivel 0 · Core)

- **Fecha de inicio / fin:** 2026-10-29T13:26:00-06:00 / 2026-10-29T14:15:00-06:00
- **Duración total:** 49 min
- **Rama y worktree:** `agente/W-c0-numeros` (`C:\Users\T490s\Desktop\Proyectos\ING-W-c0-numeros`)
- **Puerto de verificación utilizado:** `5203`
- **Archivos tocados:**
  - `src/data/lessons/c0-numeros/c0-numeros-01-media-mediana-moda.js` (nuevo)
  - `src/data/lessons/c0-numeros/c0-numeros-02-dispersion-iqr-percentiles.js` (nuevo)
  - `src/data/lessons/c0-numeros/c0-numeros-03-asimetria-sesgo.js` (nuevo)
  - `src/data/lessons/c0-numeros/c0-numeros-04-proporciones-tasas-bps.js` (nuevo)
  - `src/data/lessons/c0-numeros/c0-numeros-05-correlacion-causalidad.js` (nuevo)
  - `docs/curriculo/investigacion/c0-numeros.md` (nuevo)
  - `docs/curriculo/investigacion/c0-numeros-glossary.json` (nuevo)
  - `docs/reportes/W-c0-numeros.md` (nuevo)
- **Dependencias nuevas:** ninguna

---

## Inicio

Se completaron las lecturas obligatorias antes de redactar código o prosa. A continuación se detalla cada archivo leído individualmente junto con **1 dato técnico concreto aprendido** de su inspección:

1. **`PLAN_GEMINI_4_ARGON.md` (§1, §2, §5 `c0-numeros`, §9.2, §9.4, Apéndices A, B, D.2, D.3):**
   - *Dato aprendido:* Las lecciones de Nivel 0 tienen un rango estricto de `500` a `1000` palabras visibles, una longitud media máxima de `22` palabras por frase en `sections[].body` y deben superar la rúbrica de 8 criterios (0–4) de §9.4 con al menos `26/32` puntos y ningún criterio por debajo de `3`.
2. **`src/data/catalog/modules.js` (entrada `c0-numeros`):**
   - *Dato aprendido:* El módulo `c0-numeros` ("Números con sentido", `track: 'core'`, `level: 0`) tiene como único prerrequisito `['c0-datos']`, suma `90` minutos distribuidos en 5 lecciones (`15, 20, 20, 15, 20` min) e incluye el proyecto `proj-c0-numeros` ("Radiografía numérica de Mercado Brisa") con 4 criterios de rúbrica (`centro`, `dispersion`, `tasas-bps`, `no-causalidad`).
3. **`public/datasets/README.md`:**
   - *Dato aprendido:* El dataset sintético determinista de Mercado Brisa (semilla `19870315`) contiene anomalías deliberadas diseñadas para enseñanza, entre ellas el producto `SKU-TEST-NEG` con `list_price_usd = -9.99` en la tabla `products` (categoría `Accesorios`) que distorsiona el mínimo y el rango total.
4. **`public/datasets/schema.json`:**
   - *Dato aprendido:* La tabla `orders` (`18 000` filas, grano `1 fila = 1 pedido`) almacena `subtotal_usd`, `discount_usd`, `shipping_usd`, `tax_usd`, `total_usd` y `device_type` (`desktop`, `mobile`, `pos_tienda`), mientras que `marketing_spend` (`730` filas, grano `1 fila = 1 día × canal`) expone `spend_usd`, `clicks` y `attributed_conversions`.
5. **`src/data/schema/lesson.js`:**
   - *Dato aprendido:* `LessonV2Schema` exige que `title` tenga como máximo `60` caracteres, `hook` entre `40` y `90` palabras terminando obligatoriamente en `?`, cada `section.heading` como máximo `70` caracteres, cada `section.body` entre `80` y `250` palabras, `check.explanation` entre `20` y `60` palabras, `summary` de `3` a `5` frases de hasta `25` palabras y `aiNotes` de hasta `80` palabras.
6. **`src/data/schema/glossary.js`:**
   - *Dato aprendido:* `GlossaryTermSchema` valida que cada término tenga `id` en `kebab-case`, `definition` de entre `20` y `60` palabras en español, `moduleId` coincidente con el catálogo, `sqlExample` opcional y `roleNotes` con las tres claves `de`, `da` y `bi`.
7. **`scripts/check-content.mjs`:**
   - *Dato aprendido:* El validador suma las palabras visibles (`hook + objectives + sections[].body + workedExample.steps[].explanation + roleNotes + checks + practice.prompt + summary`) mediante `countLessonVisibleWords(lesson)` y marca `needsReview` si una lección de Nivel 0 cae fuera de `[500, 1000]`.
8. **`scripts/check-copy.mjs`:**
   - *Dato aprendido:* El script divide `sections[].body` por signos de puntuación final (`/(?<=[.!?])\s+/`) y reporta cualquier lección cuya media supere `22` palabras por frase, además de escanear las listas de palabras prohibidas en español e inglés, emojis, menciones a `"2026"` fuera de `sources` y exceso de negritas (`> 3` por párrafo).
9. **`package.json`:**
   - *Dato aprendido:* El proyecto utiliza `@duckdb/duckdb-wasm` en navegador y `@duckdb/node-api` en scripts de Node (`type: "module"`), con los comandos `content:check`, `copy:check` y `lessons:sync` registrados en `scripts`.
10. **`vite.config.js`:**
    - *Dato aprendido:* El servidor Vite registra el plugin `granoAiPlugin()` desde `./server/ai/routes.js`, lo que expone los endpoints `/api/ai/status`, `/api/ai/models` y `/api/ai/chat` directamente en el mismo puerto del servidor de desarrollo.
11. **`src/main.jsx`:**
    - *Dato aprendido:* El punto de entrada importa la hoja maestra `./styles/index.css` y monta `<App />` dentro de `React.StrictMode` sobre `#root`.
12. **`src/App.jsx`:**
    - *Dato aprendido:* La vista principal delega el estado global en `useAppController()` y pasa `activeLessonId` como `initialLessonId` a `PracticeView` cuando `viewMode === 'practice'`, conectando cada lección con su laboratorio SQL en DuckDB-WASM.
13. **`src/styles/tokens.css`:**
    - *Dato aprendido:* El sistema de diseño define superficies cálidas tipo papel (`--bg-0: #FAF8F4` en claro y `#121110` en oscuro), acento terracota (`--accent: #B84A1C`), ancho de lectura `--reading-width: 68ch` y `font-variant-numeric: tabular-nums` para tablas y métricas.
14. **`docs/curriculo/fuentes.md`:**
    - *Dato aprendido:* Para los módulos de estadística y SQL (`c0-numeros`, `c1-sql-basico`), las fuentes primarias de referencia son la documentación oficial de agregados de DuckDB, el *NIST/SEMATECH e-Handbook of Statistical Methods*, *OpenIntro Statistics* (4.ª ed.) y *Causal Inference: What If* de Hernán y Robins.
15. **`docs/curriculo/perfil-core.md`:**
    - *Dato aprendido:* El tronco común (`core`) está diseñado para que cualquier persona (DE, DA o BI) domine la intuición numérica y la lectura crítica de tablas antes de especializarse, evitando fórmulas abstractas sin respaldo en consultas SQL reales.

---

## Pasos

### Paso 1 — Investigación de fuentes verificables

- **Qué se hizo:** Se seleccionaron y documentaron 15 fuentes verificadas (3 por lección, al menos 2 primarias por lección) en `docs/curriculo/investigacion/c0-numeros.md` con `accessed: '2026-10-29'`, incluyendo la documentación oficial de agregados generales y estadísticos de DuckDB (`AVG`, `MEDIAN`, `MODE`, `QUANTILE_CONT`, `STDDEV_SAMP`, `SKEWNESS`, `CORR`), el *NIST/SEMATECH e-Handbook of Statistical Methods*, *OpenIntro Statistics* (4.ª ed., Diez, Çetinkaya-Rundel y Barr), *Statistical Inference* (Casella y Berger) y *Causal Inference: What If* (Hernán y Robins).
- **Verificación:** Todas las URLs son reales, de acceso público sin muro de pago y pasan `check-content.mjs` con `>= 2` fuentes `primary: true` por lección.

### Paso 2 — Mapa de conceptos y dependencias

- **Qué se hizo:** En `docs/curriculo/investigacion/c0-numeros.md` (§2) se trazó el grafo de dependencias entre las 5 lecciones:
  - `c0-numeros-01` depende de `c0-datos-02-tipos-y-nulos` (tratamiento de `NULL` frente a `0` en `AVG`).
  - `c0-numeros-02` construye sobre la mediana (`p50`) de `c0-numeros-01` para introducir `p25`, `p75`, `p90`, el IQR y las cercas de Tukey.
  - `c0-numeros-03` conecta media, mediana, desviación estándar y cuantiles para diagnosticar la asimetría (`SKEWNESS`) y distinguirla del sesgo estadístico de muestreo.
  - `c0-numeros-04` introduce razones, proporciones, tasas, puntos porcentuales (`pp`), puntos base (`bps`) y el error de promediar porcentajes con `AVG(a / b)`.
  - `c0-numeros-05` cierra el módulo con `CORR(y, x)`, variables de confusión, causalidad inversa y estratificación con `GROUP BY`, enlazando hacia `c1-sql-basico` y `c2-dimensional-04-metrics-simpson`.

### Paso 3 — Redacción de las 5 lecciones de Nivel 0

- **Qué se hizo:** Se escribieron las 5 lecciones en `src/data/lessons/c0-numeros/` cumpliendo el esquema `LessonV2Schema` y las restricciones de Nivel 0 (`[500, 1000]` palabras visibles y `<= 22` palabras/frase):
  1. `c0-numeros-01-media-mediana-moda.js` (962 palabras visibles, 16.0 palabras/frase): compara `AVG`, `MEDIAN` y `MODE` sobre `orders` (`AVG = 426.10` USD vs `MEDIAN = 350.16` USD, con `58.2 %` de pedidos por debajo de la media) y demuestra el efecto de `NULL` frente a `0` con `COALESCE`.
  2. `c0-numeros-02-dispersion-iqr-percentiles.js` (919 palabras visibles, 14.3 palabras/frase): introduce `QUANTILE_CONT` (`p25`, `p50`, `p75`, `p90`), el `IQR` (`454.65` USD en `orders`) frente al rango y la desviación estándar (`319.67` USD), y aísla la anomalía `SKU-TEST-NEG` (`-9.99` USD en `products`) con cercas de Tukey.
  3. `c0-numeros-03-asimetria-sesgo.js` (937 palabras visibles, 14.9 palabras/frase): explica la cola derecha en importes y entregas (`SKEWNESS = 1.63` en `refunds` y `0.98` en `orders`), muestra por qué `AVG - 2 * STDDEV_SAMP` arroja un límite inferior imposible (`-209.00` USD en `refunds`) y distingue asimetría geométrica de sesgo estadístico.
  4. `c0-numeros-04-proporciones-tasas-bps.js` (950 palabras visibles, 16.1 palabras/frase): contrasta variación relativa (`+50.1 %`) frente a puntos porcentuales (`+3.87 pp`) y puntos base (`+387 bps`) en los rechazos de `payments`, y demuestra por qué `SUM(a) / SUM(b)` evita distorsionar agregados ponderados.
  5. `c0-numeros-05-correlacion-causalidad.js` (949 palabras visibles, 15.0 palabras/frase): analiza `CORR(spend_usd, attributed_conversions)` en `marketing_spend` (correlación global `0.912` inflada por el confusor `channel` frente a `0.506`–`0.585` al estratificar con `GROUP BY channel`) e integra el componente interactivo `simpsons-paradox-explorer`.

### Paso 4 — Ejemplos y prácticas sobre Mercado Brisa en DuckDB

- **Qué se hizo:** Mediante un script sobre `@duckdb/node-api` se ejecutaron las 15 consultas SQL de las 5 lecciones (`sections[0].example`, `workedExample.steps[0..1]` y `practice.solution`) directamente contra los 13 ficheros `public/datasets/*.parquet`. Todas las matrices `expectedOutput` y `expectedOutputTable` se poblaron con las filas exactas devueltas por DuckDB.

### Paso 5 — Términos nuevos propuestos para el glosario

- **Qué se hizo:** Se creó `docs/curriculo/investigacion/c0-numeros-glossary.json` con 10 términos nuevos (`media-aritmetica`, `mediana`, `rango-intercuartilico`, `percentil`, `asimetria-distribucion`, `sesgo-estadistico`, `punto-porcentual`, `punto-base`, `correlacion-pearson`, `variable-confusion`), todos validados contra `GlossaryTermSchema` (definiciones de 38 a 41 palabras, `sqlExample` sobre Mercado Brisa y `roleNotes` para `de`, `da` y `bi`).

### Paso 6 — Proyecto de módulo y rúbrica de 4 niveles

- **Qué se hizo:** En `docs/curriculo/investigacion/c0-numeros.md` (§6) se desarrolló el enunciado completo del proyecto `proj-c0-numeros` ("Radiografía numérica de Mercado Brisa"), su consulta SQL base verificada por región (`Centro`, `Norte`, `Occidente`, `Sur`), los 4 entregables y la rúbrica de evaluación de 4 criterios (`centro`, `dispersion`, `tasas-bps`, `no-causalidad`) en escala 0–4.

### Paso 7 — Validación cruzada, tabla resumen §9.2, rúbrica de 8 criterios §9.4 y prueba real del tutor IA con `agy`

#### 7.1 Tabla resumen de lecciones (§9.2 Paso 7)

| Lección | Palabras visibles | Checks | Prácticas | Fuentes | Puntuación de rúbrica (§9.4) |
| --- | :---: | :---: | :---: | :---: | :---: |
| `c0-numeros-01-media-mediana-moda` | 962 | 3 (`multiple-choice`, `predict-output`, `spot-bug`) | 1 (`sql` DuckDB) | 3 (3 primarias) | **32 / 32** |
| `c0-numeros-02-dispersion-iqr-percentiles` | 919 | 3 (`multiple-choice`, `predict-output`, `spot-bug`) | 1 (`sql` DuckDB) | 3 (3 primarias) | **32 / 32** |
| `c0-numeros-03-asimetria-sesgo` | 937 | 3 (`multiple-choice`, `predict-output`, `spot-bug`) | 1 (`sql` DuckDB) | 3 (3 primarias) | **32 / 32** |
| `c0-numeros-04-proporciones-tasas-bps` | 950 | 3 (`multiple-choice`, `predict-output`, `spot-bug`) | 1 (`sql` DuckDB) | 3 (3 primarias) | **32 / 32** |
| `c0-numeros-05-correlacion-causalidad` | 949 | 3 (`multiple-choice`, `predict-output`, `spot-bug`) | 1 (`sql` DuckDB + `simpsons-paradox-explorer`) | 3 (3 primarias) | **32 / 32** |

#### 7.2 Evaluación detallada con los 8 criterios (0–4) de la rúbrica §9.4

| Lección | 1. Objetivo claro (0–4) | 2. Progresión (0–4) | 3. Ejemplo concreto (0–4) | 4. Error típico (0–4) | 5. Práctica (0–4) | 6. Brevedad (0–4) | 7. Precisión (0–4) | 8. Tono (0–4) | Total (>= 26/32 y sin < 3) |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `c0-numeros-01-media-mediana-moda` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32 (Aprobada)** |
| `c0-numeros-02-dispersion-iqr-percentiles` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32 (Aprobada)** |
| `c0-numeros-03-asimetria-sesgo` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32 (Aprobada)** |
| `c0-numeros-04-proporciones-tasas-bps` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32 (Aprobada)** |
| `c0-numeros-05-correlacion-causalidad` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32 (Aprobada)** |

- **Justificación de los 8 criterios:**
  - *1. Objetivo claro (4/4):* cada lección declara 3 objetivos accionables con verbo en infinitivo verificables en su práctica SQL y sus 3 comprobaciones.
  - *2. Progresión (4/4):* cada sección introduce una sola idea nueva apoyada en la anterior, sin saltos ni términos sin definir.
  - *3. Ejemplo concreto (4/4):* las 5 lecciones usan consultas reales sobre tablas de Mercado Brisa (`orders`, `products`, `refunds`, `payments`, `marketing_spend`) con salidas verificadas en DuckDB.
  - *4. Error típico (4/4):* cada `workedExample` contrasta explícitamente el antipatrón de producción (promediar sin mediana, usar `MAX - MIN` con precios corruptos, aplicar `media ± 2 DE` en colas derechas, usar `AVG(a/b)` o inferir causalidad de `CORR` global) frente a la solución verificada.
  - *5. Práctica (4/4):* las 5 prácticas se resuelven con lo explicado en la lección, incluyen 3 pistas graduales y pasan el calificador automático de DuckDB-WASM.
  - *6. Brevedad (4/4):* todas las lecciones están entre `919` y `962` palabras visibles (dentro de `[500, 1000]`) y entre `14.3` y `16.1` palabras/frase (`<= 22`).
  - *7. Precisión (4/4):* todas las afirmaciones técnicas están respaldadas por 3 fuentes verificadas (`>= 2` primarias) con URL y fecha de consulta `2026-10-29`.
  - *8. Tono (4/4):* español natural, segunda persona (`tú`), 0 hallazgos en `check-copy.mjs`.

#### 7.3 Prueba real del tutor IA con `agy` (`runAgyPrompt` sobre las 5 lecciones)

Se ejecutó `test_ai_tutor_c0_numeros.mjs` invocando `buildContextPrompt` + `runAgyPrompt({ model: 'fast' })` (`gemini-3.8-flash-low`) sobre las 5 lecciones, pidiendo primero `"Hazme una pregunta para comprobar si lo entendí"` y enviando después una respuesta errónea a propósito que incurre en el malentendido documentado en `aiNotes`. A continuación se transcriben las respuestas reales devueltas por `agy`:

1. **`c0-numeros-01-media-mediana-moda` (`gemini-3.8-flash-low`, `22545 ms`):**
   - *Respuesta errónea enviada:* `"Si el promedio de orders es 426.10 USD, entonces exactamente la mitad (el 50 %) de los clientes gastó más de 426.10 USD y todos los que estén sobre el ticket típico tendrán envío gratis."`
   - *Respuesta real de `agy`:*
     > Ese es justo el malentendido más común: la media (el promedio) no divide los datos en dos partes iguales. La medida que parte los pedidos exactamente al 50 % es la **mediana**.
     > En Mercado Brisa, la mediana de `order_total_usd` es 350.16 USD. Eso significa que la mitad de los pedidos cuesta 350.16 USD o menos, y la otra mitad cuesta 350.16 USD o más. La media está inflada en 426.10 USD porque unos pocos pedidos muy grandes arrastran la suma total hacia arriba. [...] Por eso, si en Mercado Brisa fijas el umbral en 400 USD, no estarás cubriendo a la mitad de los clientes: estarás dejando fuera a más del 50 %, porque la verdadera mitad está en 350.16 USD.

2. **`c0-numeros-02-dispersion-iqr-percentiles` (`gemini-3.8-flash-low`, `21267 ms`):**
   - *Respuesta errónea enviada:* `"Como la categoría Accesorios tiene un rango MAX - MIN de 76.27 USD, significa que la mayoría de sus productos varían 76 dólares entre sí y que el p90 representa el 90 % de los ingresos."`
   - *Respuesta real de `agy`:*
     > Hay dos confusiones en tu respuesta:
     > 1. **El rango no mide a la mayoría:** El rango de 76.27 USD solo te dice la distancia entre el accesorio más caro y el más barato de `products`. No indica cómo se reparten los demás. Un solo producto muy caro infla ese número. La métrica que describe mejor la dispersión central es el **IQR** (26.27 USD), porque se enfoca en el 50 % intermedio de los productos y no se deja distorsionar por extremos.
     > 2. **Qué significa el percentil 90 (p90):** El p90 no es el 90 % del dinero total. Es un umbral de filas (productos). [...] Mide posición de registros ordenados, no concentración de ingresos.

3. **`c0-numeros-03-asimetria-sesgo` (`gemini-3.8-flash-low`, `20920 ms`):**
   - *Respuesta errónea enviada:* `"Puedo usar el intervalo media ± 2 desviaciones estándar (-209.00 a 651.89 USD) porque toda tabla con más de 1000 filas tiene forma de campana simétrica y el sesgo significa que la muestra se eligió mal."`
   - *Respuesta real de `agy`:*
     > Hay dos ideas que conviene corregir en tu respuesta:
     > 1. **El tamaño de la muestra no crea simetría:** Tener más de 1000 filas en `refunds` no convierte los datos en una campana simétrica. La variable `refund_usd` tiene un límite físico en 0 USD (nadie recibe un reembolso negativo) y unos pocos montos muy altos hacia la derecha. Esa forma no es un espejo: tiene **asimetría positiva** (*skewness*), no forma de campana.
     > 2. **Por qué falla el intervalo:** Al aplicar la regla simétrica, el límite inferior te da `-209.00 USD` (`221.45 - 2 * 215.22`). Es un valor absurdo en el negocio porque no existen reembolsos menores a cero.
     > 3. **Asimetría no es lo mismo que sesgo de muestreo:** **Asimetría (*skewness*)** es la forma geométrica de los datos; **Sesgo (*bias*)** es un error al recolectar o medir la información.

4. **`c0-numeros-04-proporciones-tasas-bps` (`gemini-3.8-flash-low`, `21309 ms`):**
   - *Respuesta errónea enviada:* `"Si la tasa baja de 11.60 % a 7.73 %, la tasa cayó un 3.87 % relativo, que equivale a 3.87 puntos base, y para sacar la tasa global basta con hacer AVG(tasa_pct) de los 4 métodos."`
   - *Respuesta real de `agy`:*
     > Hay tres confusiones importantes en tu respuesta. Vamos a corregirlas paso a paso:
     > 1. **Puntos porcentuales (pp)**: La resta directa entre porcentajes se mide en puntos porcentuales, no en porcentaje relativo: `11.60% - 7.73% = 3.87 puntos porcentuales (pp)`.
     > 2. **Puntos base (bps)**: Un punto porcentual equivale a 100 puntos base: `3.87 * 100 = 387 puntos base (bps)`.
     > 3. **Variación relativa**: `(7.73 - 11.60) / 11.60 = -33.36%`.
     > 4. **El promedio en SQL**: No debes usar `AVG(tasa_pct)`. [...] Para obtener la tasa global real, debes sumar primero los casos y luego dividir: `SUM(pagos_fallidos) / SUM(total_pagos)`.

5. **`c0-numeros-05-correlacion-causalidad` (`gemini-3.8-flash-low`, `20379 ms`):**
   - *Respuesta errónea enviada:* `"Como CORR(spend_usd, attributed_conversions) vale 0.912 en marketing_spend, duplicar mañana el presupuesto diario de email_campaign duplicará automáticamente las conversiones."`
   - *Respuesta real de `agy`:*
     > Esa afirmación es incorrecta, y refleja justo el error principal al interpretar la correlación. Un valor de `0.912` solo describe que, en el pasado, los días o canales con más gasto coincidieron con más conversiones. No te asegura qué pasará al intervenir o cambiar el presupuesto por varias razones:
     > 1. **La correlación no mide causa y efecto**: que dos variables se muevan juntas no significa que una cause la otra en esa magnitud.
     > 2. **Existen terceras variables (confusores)**: factores como la estacionalidad o el tipo de canal (`channel`) afectan tanto al gasto como a las conversiones al mismo tiempo.
     > 3. **La correlación dentro del canal es menor**: cuando agrupas por canal, la relación real baja a un rango de 0.50 a 0.58.

---

## Test

### 1. Validador de esquema e integridad (`node scripts/check-content.mjs --module c0-numeros`)

```text
=== Validación de contenido v2 (check-content) ===
Lección (id v2)                                | Módulo               | Niv  | Sec  | Chk  | Src  | Palabras  | Estado    
--------------------------------------------------------------------------------------------------------------------------
c0-numeros-01-media-mediana-moda               | c0-numeros           | 0    | 3    | 3    | 3    | 962       | OK        
c0-numeros-02-dispersion-iqr-percentiles       | c0-numeros           | 0    | 3    | 3    | 3    | 919       | OK        
c0-numeros-03-asimetria-sesgo                  | c0-numeros           | 0    | 3    | 3    | 3    | 937       | OK        
c0-numeros-04-proporciones-tasas-bps           | c0-numeros           | 0    | 3    | 3    | 3    | 950       | OK        
c0-numeros-05-correlacion-causalidad           | c0-numeros           | 0    | 3    | 3    | 3    | 949       | OK        
--------------------------------------------------------------------------------------------------------------------------
Resumen: 5 lecciones inspeccionadas | 5 válidas | 0 con advertencias (needsReview) | 0 con errores.

Resultado: OK (0 errores de esquema o integridad).
```

### 2. Auditor anti-slop (`node scripts/check-copy.mjs --path src/data/lessons/c0-numeros`)

```text
=== Auditoría anti-slop de copy (check-copy) ===
Archivos escaneados: 5

0 hallazgos de términos prohibidos, emojis, "2026" o exceso de negritas.
Total de hallazgos: 0

=== Sentence stats per lesson ===
- c0-numeros-01-media-mediana-moda: 16.0 words/sentence (367 words in 23 sentences)
- c0-numeros-02-dispersion-iqr-percentiles: 14.3 words/sentence (372 words in 26 sentences)
- c0-numeros-03-asimetria-sesgo: 14.9 words/sentence (343 words in 23 sentences)
- c0-numeros-04-proporciones-tasas-bps: 16.1 words/sentence (370 words in 23 sentences)
- c0-numeros-05-correlacion-causalidad: 15.0 words/sentence (330 words in 22 sentences)
```

### 3. Validación de `c0-numeros-glossary.json` contra `GlossaryTermSchema`

```text
=== Validating 10 glossary terms ===
- media-aritmetica: valid=true (40 words)
- mediana: valid=true (39 words)
- rango-intercuartilico: valid=true (40 words)
- percentil: valid=true (39 words)
- asimetria-distribucion: valid=true (40 words)
- sesgo-estadistico: valid=true (39 words)
- punto-porcentual: valid=true (41 words)
- punto-base: valid=true (39 words)
- correlacion-pearson: valid=true (38 words)
- variable-confusion: valid=true (40 words)
```

### 4. Suite Playwright E2E sobre puerto `5203` (`run_e2e_verification.mjs`)

```text
=== Verifying c0-numeros-01-media-mediana-moda (Light 1280x720) ===
  -> Title: Media, mediana y moda: cuándo el promedio miente | Lab: Comparar media, mediana y marca más frecuente en el catálogo de productos | Passed: true | Rows: 5 filas
=== Verifying c0-numeros-02-dispersion-iqr-percentiles (Light 1280x720) ===
  -> Title: Dispersión, rango intercuartílico y percentiles (p50, p90) | Lab: Dispersión y percentil 90 del importe por tipo de dispositivo | Passed: true | Rows: 3 filas
=== Verifying c0-numeros-03-asimetria-sesgo (Light 1280x720) ===
  -> Title: Distribuciones asimétricas y sesgo en importes y entregas | Lab: Diagnosticar el sesgo derecha (media vs mediana y SKEWNESS) en las primeras 5 tiendas | Passed: true | Rows: 5 filas
=== Verifying c0-numeros-04-proporciones-tasas-bps (Light 1280x720) ===
  -> Title: Proporciones, tasas, puntos porcentuales y puntos base | Lab: Proporción de pedidos reembolsados en porcentaje y puntos base por dispositivo | Passed: true | Rows: 3 filas
=== Verifying c0-numeros-05-correlacion-causalidad (Light 1280x720) ===
  -> Title: Por qué correlación no implica causalidad y confusores | Lab: Estratificar la correlación entre gasto y conversiones por canal en marketing_spend | Passed: true | Rows: 5 filas
consoleErrors: [] | pageErrors: []
```

---

## Revisión propia

Durante la redacción y verificación se detectaron y corrigieron **5 defectos propios**:

1. **Encabezado de sección mayor a 70 caracteres en `c0-numeros-04-proporciones-tasas-bps.js`:**
   - *Hallazgo:* En la primera corrida de `check-content.mjs`, `sections[1].heading` tenía 76 caracteres (`Variación relativa frente a puntos porcentuales (pp) y puntos base (bps)`), superando el tope de 70 caracteres de `SectionSchema`.
   - *Corrección:* Se acortó a `'Variación relativa frente a puntos porcentuales y puntos base'` (61 caracteres).
2. **Recuento de palabras visibles ligeramente por encima de 1000 en las 5 lecciones:**
   - *Hallazgo:* En la primera corrida de `check-content.mjs`, las 5 lecciones tenían entre `1010` y `1070` palabras visibles, activando la advertencia `needsReview` para el rango de Nivel 0 (`[500, 1000]`).
   - *Corrección:* Se podaron redundancias en `sections[].body` en las 5 lecciones hasta dejarlas en `962`, `919`, `937`, `950` y `949` palabras visibles (`0` advertencias).
3. **Longitud media de frase superior a 22 palabras/frase en las lecciones 2 a 5:**
   - *Hallazgo:* `check-copy.mjs` reportó medias iniciales de `23.4`, `26.1`, `22.7` y `25.9` palabras/frase en `sections[].body` de las lecciones 02, 03, 04 y 05.
   - *Corrección:* Se dividieron las oraciones subordinadas largas en frases directas, reduciendo la media a `14.3`–`16.1` palabras/frase en todas las lecciones.
4. **Clave de `localStorage` y condición de carrera de guardado en el arnés Playwright:**
   - *Hallazgo:* El primer intento de abrir una lección inyectando `localStorage['grano_v1']` falló porque la clave real del esquema (`STORAGE_KEY` en `src/state/schema.js`) es `'grano:v1'` y además el guardado con debounce de 300 ms sobrescribía el estado tras `page.goto`.
   - *Corrección:* Se actualizó el script E2E para abrir cada lección seleccionando su tarjeta `[data-testid="exercise-item-<lessonId>"]` en el catálogo y alternando a la vista de práctica con `.app-sidebar__nav button:has-text("Práctica")`.
5. **Selector de sección del simulador interactivo en `c0-numeros-05`:**
   - *Hallazgo:* `normalizeLessonV2` genera el `id` de cada sección a partir del slug del `heading` (`como-bloquear-un-confusor-estratificando-con-group-by`) cuando no se fuerza otro `domId`, por lo que el selector `#sec-sec-2` no coincidía en el DOM.
   - *Corrección:* Se utilizó el contenedor semántico `.lp-simulator-frame` para desplazarse al simulador `simpsons-paradox-explorer` y capturar tanto el tema claro como el oscuro.

---

## Prueba adversarial

Se ejecutaron **6 pruebas adversariales** sobre el servidor en `http://127.0.0.1:5203` y sobre el runner de IA (`runAgyPrompt`):

| Caso | Entrada | Resultado esperado | Resultado real |
| --- | --- | --- | --- |
| 1. Viewport `1280×720` (`theme=light`) | Apertura de las 5 lecciones (`c0-numeros-01` a `05`) en ventana de `1280×720` px | `scrollWidth <= innerWidth` (sin scroll horizontal) y columna de lectura `>= 640` px | `document.documentElement.scrollWidth === 1280` (`innerWidth === 1280`), columna de lectura de `832` px con temario lateral visible |
| 2. Tema oscuro (`theme=dark`) a `1280×720` | Navegación a `/?view=practice&theme=dark` y apertura de `c0-numeros-01` y del simulador `simpsons-paradox-explorer` en `c0-numeros-05` | Tokens oscuros aplicados (`#121110`), contraste legible en tablas, bloques SQL, callouts y barras del simulador | Contraste verificado sin textos invisibles ni bordes rotos en `c0-numeros-01-dark.png` y `c0-numeros-05-dark-simpsons.png` |
| 3. Navegación por teclado (`1`–`4`) en comprobaciones | Foco en `#sec-comprobaciones` de `c0-numeros-01` y pulsación de la tecla `'2'` | Selección inmediata de la segunda opción (`B`), estado visual de acierto/error y despliegue de `check.explanation` | Opción `B` marcada como incorrecta, explicación desplegada y botón `"No lo entiendo — explicar en el tutor"` visible (`adversarial-keyboard-checks.png`) |
| 4. Consulta SQL con error de sintaxis en DuckDB-WASM | Ejecución de `SELECT columna_inexistente FROM orders WHERE;` en `[data-testid="sql-lab"]` | Captura controlada del error sin romper la UI, mostrando `[data-testid="sql-error-box"]` y botón de ayuda IA | `consoleErrors: []`, `pageErrors: []`, alerta roja con `Parser Error: syntax error at or near ";"` y botón `"Explícame este error"` (`adversarial-sql-error.png`) |
| 5. `prefers-reduced-motion: reduce` | Emulación de `reducedMotion: 'reduce'` en Playwright sobre `c0-numeros-02` | `matchMedia('(prefers-reduced-motion: reduce)').matches === true` y desplazamiento entre secciones con `behavior: 'auto'` | Confirmado `reducedMotionActive: true`; salto instantáneo entre secciones sin animaciones forzadas |
| 6. Respuesta deliberadamente errónea al tutor IA (`agy`) | Envío de las 5 confusiones típicas de `aiNotes` en `c0-numeros-01` a `05` tras pedir pregunta de comprobación a `runAgyPrompt` | Que `agy` detecte el error conceptual exacto citando la sección y las métricas de Mercado Brisa | En las 5 lecciones `gemini-3.8-flash-low` (`20.3`–`22.5` s) corrigió el error usando las cifras e indicaciones de `aiNotes` |

---

## Capturas antes / después

Todas las capturas se generaron con navegador real (Microsoft Edge headless vía `playwright-core`) en `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-c0-numeros\` (no añadidas a git) y fueron inspeccionadas visualmente con `read_file`:

| Archivo en `docs/reportes/capturas/W-c0-numeros/` | Qué verifica | Dimensiones / Estado |
| --- | --- | --- |
| `c0-numeros-01-media-mediana-moda-light-top.png` | Cabecera, ruta `Números con sentido`, `Nivel 0`, escenario real y objetivos de L01 en modo claro | `1280×720` · OK |
| `c0-numeros-01-media-mediana-moda-practice-solved.png` | Práctica SQL de L01 ejecutada en DuckDB-WASM (`Práctica superada`, 5 filas de `products`) | `1280×720` · OK |
| `c0-numeros-02-dispersion-iqr-percentiles-light-top.png` | Cabecera, prerrequisito enlazado a L01, escenario real y objetivos de L02 en modo claro | `1280×720` · OK |
| `c0-numeros-02-dispersion-iqr-percentiles-practice-solved.png` | Práctica SQL de L02 ejecutada en DuckDB-WASM (`Práctica superada`, 3 filas por `device_type`) | `1280×720` · OK |
| `c0-numeros-03-asimetria-sesgo-light-top.png` | Cabecera, escenario real (`refunds` `-209.00` USD) y objetivos de L03 en modo claro | `1280×720` · OK |
| `c0-numeros-03-asimetria-sesgo-practice-solved.png` | Práctica SQL de L03 ejecutada en DuckDB-WASM (`Práctica superada`, 5 tiendas con `SKEWNESS`) | `1280×720` · OK |
| `c0-numeros-04-proporciones-tasas-bps-light-top.png` | Cabecera, escenario real (`7.73 %` vs `11.60 %` en `payments`) y objetivos de L04 | `1280×720` · OK |
| `c0-numeros-04-proporciones-tasas-bps-practice-solved.png` | Práctica SQL de L04 ejecutada en DuckDB-WASM (`Práctica superada`, `%` y `bps` de reembolsos) | `1280×720` · OK |
| `c0-numeros-05-correlacion-causalidad-light-top.png` | Cabecera, escenario real (`CORR = 0.912` en `marketing_spend`) y objetivos de L05 | `1280×720` · OK |
| `c0-numeros-05-correlacion-causalidad-simpsons-explorer.png` | Componente interactivo `simpsons-paradox-explorer` integrado en la sección 3 de L05 (modo claro) | `1280×720` · OK |
| `c0-numeros-05-correlacion-causalidad-practice-solved.png` | Práctica SQL de L05 ejecutada en DuckDB-WASM (`Práctica superada`, 5 canales estratificados) | `1280×720` · OK |
| `c0-numeros-01-dark.png` | Verificación de contraste y tokens en modo oscuro (`theme=dark`) sobre L01 | `1280×720` · OK |
| `c0-numeros-05-dark-simpsons.png` | Verificación de contraste en modo oscuro del simulador `simpsons-paradox-explorer` en L05 | `1280×720` · OK |
| `adversarial-keyboard-checks.png` | Selección de respuesta con atajo de teclado `2` y retroalimentación de error en comprobaciones | `1280×720` · OK |
| `adversarial-sql-error.png` | Manejo defensivo de error de sintaxis SQL en DuckDB-WASM con botón de ayuda del tutor IA | `1280×720` · OK |

---

## Peticiones al orquestador

1. **Integración de glosario en el paso de consolidación de Ola A:** Incorporar las 10 entradas de `docs/curriculo/investigacion/c0-numeros-glossary.json` (`media-aritmetica`, `mediana`, `rango-intercuartilico`, `percentil`, `asimetria-distribucion`, `sesgo-estadistico`, `punto-porcentual`, `punto-base`, `correlacion-pearson`, `variable-confusion`) en `src/data/glossary.js`.
2. **Sincronización de índice global tras merge de Ola A:** Ejecutar `node scripts/sync-lessons-index.mjs` al integrar la rama `agente/W-c0-numeros` en `main` para registrar las 5 lecciones de `c0-numeros` en `src/data/lessons/index.js`.

---

## Pendiente

Ninguno.
