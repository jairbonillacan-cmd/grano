# W-bi2-metricas · Diseño de métricas y árboles de KPIs (`bi2-metricas`)

- **Módulo:** `bi2-metricas` (*Diseño de métricas y árboles de KPIs*, Nivel 2, Track `bi`)
- **Rama y worktree:** `agente/W-bi2-metricas` en `C:\Users\T490s\Desktop\Proyectos\ING-W-bi2-metricas`
- **Puerto Vite utilizado:** `5217` (`http://127.0.0.1:5217`)

---

## Inicio

Archivos reales del repositorio leídos antes de iniciar la escritura (uno por viñeta, con un dato concreto aprendido de cada uno):

- `PLAN_GEMINI_4_ARGON.md`: define en §1, §2, §5, §9.2, §9.4 y Apéndices A, B y D las reglas de entrega por oleadas, el esquema v2 de lección, la lista de términos prohibidos anti-slop, la tabla resumen de §9.2, la rúbrica de 8 criterios (0–4 sobre 32) de §9.4 y la Checklist D.3 del orquestador.
- `src/data/catalog/modules.js`: registra en las líneas 640–658 el módulo `bi2-metricas` (`track: 'bi'`, `level: 2`, `title: 'Diseño de métricas y árboles de KPIs'`, `prerequisites: ['c0-negocio', 'c2-dimensional']`) con sus 4 lecciones de 20, 25, 20 y 20 minutos (`85` minutos totales).
- `public/datasets/README.md`: documenta el dominio de negocio de la empresa ficticia Mercado Brisa (tostador y distribuidor omnicanal de café de especialidad) y los errores intencionales sembrados en el dataset (como el experimento `EXP-PUSH-CART` con Sample Ratio Mismatch y las devoluciones concentradas por campaña).
- `public/datasets/schema.json`: detalla las columnas, tipos físicos y conteos de filas de los archivos Parquet generados en `public/datasets/` (`orders`: 15,000 filas; `order_items`: 37,438 filas; `refunds`: 2,949 filas; `customers`: 2,500 filas; `products`: 48 filas; `stores`: 12 filas; `experiments`: 3 filas; `experiment_assignments`: 4,400 filas).
- `src/data/schema/lesson.js`: define con Zod `LessonSchema` (líneas 115–145), exigiendo `contentVersion: 1`, `tracks` como arreglo, entre 4 y 6 `sections` con `900` a `1300` palabras totales en `body`, 3 a 5 `checkpoints` con 4 opciones (`id`, `text`, `correct`), `workedExample.expectedOutput` como arreglo de objetos y `practice` con `dataset: 'mercado_brisa'`, `starter`, `solution`, `expected` (SQL string), `hints` (3 pistas) y `sources` (`>= 2`).
- `src/data/schema/glossary.js`: define `GlossaryTermSchema` (líneas 14–38), exigiendo `id` en kebab-case, `term`, `english`, `category` restringida a 6 valores (`sql`, `metricas`, `experimentacion`, `ingenieria-datos`, `visualizacion`, `estadistica`), `definition`, `whyItMatters`, `example`, `relatedLessons` y `sources`.
- `src/data/glossary.js`: almacena el arreglo `GLOSSARY_TERMS` con los términos canónicos actuales de la plataforma, permitiendo verificar los IDs existentes y estructurar sin colisiones los 8 términos nuevos propuestos en `docs/curriculo/investigacion/bi2-metricas-glossary.json`.
- `scripts/check-content.mjs`: valida cada archivo de lección contra `LessonSchema`, comprueba unicidad de IDs, conteo de palabras (`900–1300`) y referencias cruzadas con `--module bi2-metricas`.
- `scripts/check-copy.mjs`: audita el cumplimiento del Apéndice B en `src/data/lessons/bi2-metricas`, detectando términos prohibidos, emojis, apariciones de `"2026"` fuera de fechas de acceso, párrafos con más de 3 negritas y lecciones con media `> 22` palabras por oración en `sections[].body`.
- `scripts/sync-lessons-index.mjs`: regenera automáticamente `src/data/lessons/index.js` escaneando recursivamente las carpetas de `src/data/lessons/<moduleId>/` para conectar las lecciones nuevas con el reproductor.
- `src/ai/promptBuilder.js`: implementa `async function buildContextPrompt` (línea 139), que carga dinámicamente la lección desde `src/data/lessons/index.js` y ensambla el prompt contextual del tutor IA con objetivos, resumen, extracto de secciones y práctica SQL.
- `server/agyCliRunner.js`: implementa `runAgyPrompt` (línea 98), que ejecuta el binario local `agy.exe` pasando el prompt por `stdin` en un directorio temporal aislado y devuelve la respuesta real del modelo.
- `src/lab/duckdb.js`: define en `MERCADO_BRISA_TABLES` (líneas 3–17) las 13 tablas que se montan en el motor DuckDB-Wasm del navegador (`customers`, `customer_changes`, `products`, `orders`, `order_items`, `payments`, `refunds`, `events`, `marketing_spend`, `experiments`, `experiment_assignments`, `stores`, `calendar`).
- `src/data/lessons/c0-negocio/c0-negocio-01-ingreso-costo-margen.js`: introduce en el Nivel 0 la diferencia básica entre ingreso bruto, descuento, devolución y margen bruto en Mercado Brisa, base sobre la que `bi2-metricas-01` formaliza la anatomía de 6 piezas y la prevención de *fan-out* en SQL.
- `src/data/lessons/c0-negocio/c0-negocio-02-embudos-conversion.js`: explica los embudos secuenciales de adquisición y conversión en Nivel 0, permitiendo que `bi2-metricas-02` avance hacia árboles híbridos de KPIs (ramas aditivas por dimensión y ramas multiplicativas de palancas operativas).
- `src/data/lessons/c0-negocio/c0-negocio-03-kpi-metrica-vanidad.js`: distingue entre métricas de vanidad e indicadores accionables en Nivel 0, lo que permite a `bi2-metricas-03` y `bi2-metricas-04` profundizar en umbrales de guardia, Sample Ratio Mismatch (SRM), North Star Metric y ley de Goodhart.
- `src/data/lessons/c0-negocio/c0-negocio-04-pregunta-a-decision.js`: muestra cómo traducir preguntas de negocio en reglas de decisión, antecedente directo de la matriz de decisión con guardias SQL (`CASE WHEN`) en `bi2-metricas-03`.
- `src/data/lessons/c2-dimensional/c2-dimensional-02-star-schema-obt.js`: cubre el diseño de tablas de hechos y dimensiones en estrella, prerrequisito directo para declarar el grano atómico de una métrica en `bi2-metricas-01`.
- `src/data/lessons/c2-dimensional/c2-dimensional-03-scd2-history.js`: enseña el seguimiento histórico de atributos cambiantes en `customer_changes` (SCD Tipo 2), contexto necesario al cruzar `customers` con `orders` por segmento en `bi2-metricas-02`.
- `src/data/lessons/c2-dimensional/c2-dimensional-04-metrics-simpson.js`: explica las métricas no aditivas y la paradoja de Simpson al promediar tasas ya divididas, fundamento matemático de la regla de agregar numerador y denominador por separado antes de dividir en `bi2-metricas-01` y `bi2-metricas-02`.

---

## Pasos

### Paso 1 — Investigación de fuentes primarias
- **Qué hice:** investigué y documenté 6 fuentes primarias autoritativas para respaldar todas las definiciones, fórmulas y criterios de diseño del módulo.
- **Archivos y líneas:** `docs/curriculo/investigacion/bi2-metricas.md` (líneas 1–68).
- **Evidencia:**
  1. **Goodhart, C. A. E. (1975)** — *Problems of Monetary Management: The U.K. Experience* (Reserve Bank of Australia) y **Strathern, M. (1997)** — *‘Improving ratings’: audit in the British University system* (European Review).
  2. **Kohavi, R., Tang, D., & Xu, Y. (2020)** — *Trustworthy Online Controlled Experiments: A Practical Guide to A/B Testing* (Cambridge University Press, caps. 6, 7 y 21 sobre OEC, métricas guardia, invariantes y Sample Ratio Mismatch).
  3. **Ellis, S., & Brown, M. (2017)** / **Schurman, B. — Amplitude (2020)** — *Hacking Growth* (Crown Currency) y *The North Star Playbook* (Amplitude).
  4. **Kimball, R., & Ross, M. (2013)** — *The Data Warehouse Toolkit* (3.ª ed., Wiley, cap. 2 sobre declaración de grano atómico y aditividad).
  5. **dbt Labs (2024)** — *MetricFlow & dbt Semantic Layer Specification* (medidas, dimensiones, grano temporal, filtros canónicos y métricas de ratio).
  6. **Parmenter, D. (2019)** — *Key Performance Indicators (KPI): Developing, Implementing, and Using Winning KPIs* (4.ª ed., Wiley).

### Paso 2 — Mapa de conceptos y términos del glosario
- **Qué hice:** diseñé el mapa conceptual del módulo con su diagrama de dependencias en Mermaid (`flowchart LR`), verifiqué que ningún concepto requerido quedara sin cubrir por los prerrequisitos (`c0-negocio` y `c2-dimensional`) y redacté los 8 términos nuevos del glosario.
- **Archivos y líneas:** `docs/curriculo/investigacion/bi2-metricas.md` (líneas 70–125) y `docs/curriculo/investigacion/bi2-metricas-glossary.json` (líneas 1–261).
- **Evidencia:** validación con Zod contra `GlossaryTermSchema`:
  ```text
  All 8 glossary terms in bi2-metricas-glossary.json are 100% valid against GlossaryTermSchema!
  ```

### Paso 3 — Diseño de las 4 lecciones y verificación de SQL contra DuckDB (`public/datasets/`)
- **Qué hice:** ejecuté todas las consultas de `workedExample` y `practice` contra los archivos Parquet de `public/datasets/` y contra las 13 tablas canónicas de `MERCADO_BRISA_TABLES` en DuckDB-Wasm, pegando las salidas reales en `expectedOutput`.
- **Archivos y líneas:**
  - `src/data/lessons/bi2-metricas/bi2-metricas-01-anatomia-metrica.js` (`workedExample`: líneas 196–281; `practice`: líneas 342–402).
  - `src/data/lessons/bi2-metricas/bi2-metricas-02-arboles-kpis-palancas.js` (`workedExample`: líneas 216–331; `practice`: líneas 396–483).
  - `src/data/lessons/bi2-metricas/bi2-metricas-03-metricas-guardia.js` (`workedExample`: líneas 234–395; `practice`: líneas 464–570).
  - `src/data/lessons/bi2-metricas/bi2-metricas-04-north-star-goodhart.js` (`workedExample`: líneas 237–385; `practice`: líneas 454–549).

### Paso 4 — Redacción y validación automática de las lecciones (`check:content` y `check:copy`)
- **Qué hice:** redacté las 4 lecciones siguiendo el orden pedagógico (`objectives` → `checkpoints` → `sections` → `workedExample` → `practice` → `hook` → `summary` → `roleApplications` → `sources`) y verifiqué el cumplimiento del Apéndice A y Apéndice B.
- **Archivos y líneas:** `src/data/lessons/bi2-metricas/bi2-metricas-01..04.js` y `docs/curriculo/investigacion/bi2-metricas.md` (líneas 127–160).
- **Evidencia:** `0` errores en `check-content.mjs` y `0` hallazgos en `check-copy.mjs` (promedios de palabras por oración: L1 = `19.2`, L2 = `19.6`, L3 = `19.7`, L4 = `19.4`).

### Paso 5 — Prueba del tutor IA (`agy`) sobre cada lección
- **Qué hice:** ejecuté `await buildContextPrompt(...)` (`src/ai/promptBuilder.js`) + `runAgyPrompt(...)` (`server/agyCliRunner.js`) invocando el CLI real de `agy` en las 4 lecciones con `"Hazme una pregunta para comprobar si lo entendí."` seguido de una respuesta errónea a propósito.
- **Evidencia (salidas reales de `agy`):**
  - **`bi2-metricas-01-anatomia-metrica`:**
    - *Pregunta del tutor:* «Un pedido puede tener más de un reembolso registrado en `refunds`. Si haces un `LEFT JOIN` directo entre `orders` y `refunds` usando `order_id` antes de sumar los montos: 1. ¿Qué problema numérico ocurre con las filas y el valor de `orders.order_total_usd`? 2. ¿Cómo debes transformar la tabla `refunds` antes de unirla para respetar el grano atómico de la métrica?»
    - *Evaluación de respuesta errónea:* Detectó la **inflación por fan-out** al duplicar filas de `orders` con múltiples reembolsos y el **filtro canónico incompleto** al usar solo `status = 'completed'` en vez de `status IN ('completed', 'refunded')`, proporcionando la CTE `refunds_agg` preagregada por `order_id`.
  - **`bi2-metricas-02-arboles-kpis-palancas`:**
    - *Pregunta del tutor:* «Tienes dos opciones de desglose inicial: 1. Separar el ingreso neto sumando los segmentos `pro_barista`, `retail` y `cafeteria_b2b`. 2. Descomponer el ingreso neto multiplicando `Clientes Activos × (Pedidos / Cliente) × (Unidades / Pedido) × (Ingreso Neto / Unidad)`. ¿Cuál representa una rama aditiva y cuál una multiplicativa, y cuál te dice qué palanca de comportamiento falló?»
    - *Evaluación de respuesta errónea:* Corrigió el error de asumir que `cafeteria_b2b` compra pocas unidades por pedido, citando las cifras reales de la lección (`cafeteria_b2b` lidera con **5.75 unidades por pedido**, mientras `pro_barista` gana por **936 clientes activos** y **6.65 pedidos por cliente**).
  - **`bi2-metricas-03-metricas-guardia`:**
    - *Pregunta del tutor:* «1. Si calculas el margen bruto neto restando únicamente el costo de los productos a las ventas brutas, ¿qué incentivo perverso o distorsión estás pasando por alto? 2. Al escribir la consulta SQL uniendo `orders` con `refunds`, ¿por qué debes filtrar `WHERE status IN ('completed', 'refunded')` a nivel general de la consulta?»
    - *Evaluación de respuesta errónea:* Rechazó lanzar `EXP-PUSH-CART` explicando que `980` usuarios en control frente a `620` en tratamiento (`srm_p_value = 0.0001 < 0.01`) constituye un **Sample Ratio Mismatch (SRM)** que rompe la causalidad e invalida la mejora aparente de `+5.94 USD`.
  - **`bi2-metricas-04-north-star-goodhart`:**
    - *Pregunta del tutor:* «La campaña `CMP-VERANO` alcanzó los `3,000` pedidos brutos fijados como meta, pero tuvo `325` pedidos cancelados y `730` con devoluciones. 1. Según la ley de Goodhart, ¿por qué el conteo de pedidos brutos dejó de ser una métrica útil? 2. ¿Qué condiciones exactas en SQL definen la Métrica Estrella Polar?»
    - *Evaluación de respuesta errónea:* Explicó que contar filas brutas mide volumen fabricado y no valor entregado (`CMP-VERANO` solo logró `1,945` pedidos limpios), y mostró el filtro exacto `COUNT(o.order_id) FILTER (WHERE o.status = 'completed' AND COALESCE(d.devuelto_usd, 0) = 0) AS nsm_pedidos_valor_entregado`.

### Paso 6 — Verificación en navegador + DuckDB-Wasm en vivo (`1280x720` y `390x844`)
- **Qué hice:** levanté Vite en `http://127.0.0.1:5217/` y ejecuté Playwright sobre las 4 lecciones en `1280x720` y `390x844`, comprobando que el código `starter` falla, que el código `solution` aprueba en DuckDB-Wasm con el banner verde `"Práctica superada · El resultado coincide con la referencia"`, que hay `0` errores de consola y `0` desbordamiento horizontal, e inspeccioné las capturas con `read_file`.
- **Archivos:** 12 capturas en `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-bi2-metricas\` y registro en `docs/curriculo/investigacion/bi2-metricas.md` (líneas 162–182).

### Paso 7 — Autoevaluación con la Tabla Resumen (§9.2) y la Rúbrica de 8 criterios 0–4 sobre 32 (§9.4)

#### Tabla resumen final (§9.2)

| lección | palabras | checks | prácticas | fuentes | puntuación de rúbrica |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `bi2-metricas-01-anatomia-metrica` | 1,066 | 3 (`mcq`) | 1 (`sql` verificada en DuckDB: `3 filas × 4 cols`) | 3 (Kimball 2013, dbt Labs 2024, Kohavi et al. 2020) | **32 / 32** |
| `bi2-metricas-02-arboles-kpis-palancas` | 1,094 | 3 (`mcq`) | 1 (`sql` verificada en DuckDB: `3 filas × 7 cols`) | 3 (Parmenter 2019, Amplitude 2020, Kimball 2013) | **32 / 32** |
| `bi2-metricas-03-metricas-guardia` | 1,140 | 3 (`mcq`) | 1 (`sql` verificada en DuckDB: `5 filas × 6 cols`) | 3 (Kohavi et al. 2020 cap. 6/7, Kohavi et al. 2020 cap. 21, dbt Labs 2024) | **32 / 32** |
| `bi2-metricas-04-north-star-goodhart` | 1,159 | 3 (`mcq`) | 1 (`sql` verificada en DuckDB: `4 filas × 6 cols`) | 4 (Goodhart 1975, Strathern 1997, Ellis & Brown 2017 / Amplitude 2020, Kohavi et al. 2020) | **32 / 32** |

#### Tabla de rúbrica de calidad §9.4 (8 criterios exactos en escala 0–4; total sobre 32)

| Criterio (§9.4) | `bi2-metricas-01` | `bi2-metricas-02` | `bi2-metricas-03` | `bi2-metricas-04` | Justificación verificable |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **1. Objetivo claro** | 4 / 4 | 4 / 4 | 4 / 4 | 4 / 4 | Los 3 `objectives` de cada lección usan verbos observables (*Descomponer*, *Prevenir*, *Codificar*, *Construir*, *Diagnosticar*, *Emparejar*, *Diseñar*) y los 3 `checkpoints` evalúan exactamente esos objetivos. |
| **2. Progresión** | 4 / 4 | 4 / 4 | 4 / 4 | 4 / 4 | Cada sección construye sobre la anterior sin saltos: de la anatomía de 6 piezas (L1) al árbol aditivo/multiplicativo (L2), a los umbrales de guardia y SRM (L3), hasta la Estrella Polar y la ley de Goodhart (L4). |
| **3. Ejemplo concreto** | 4 / 4 | 4 / 4 | 4 / 4 | 4 / 4 | Todos los `workedExample` ejecutan SQL real sobre Mercado Brisa (`orders`, `order_items`, `products`, `customers`, `refunds`, `stores`, `experiments`, `experiment_assignments`) con `expectedOutput` verificado al céntimo. |
| **4. Error típico** | 4 / 4 | 4 / 4 | 4 / 4 | 4 / 4 | Cada lección demuestra con cifras reales el error más frecuente del tema: *fan-out* al unir `orders` y `refunds` sin preagregar (L1), promediar ratios o mezclar ramas aditivas y multiplicativas (L2), diluir el denominador con `cancelled` o ignorar SRM (L3), y premiar `COUNT(*)` bruto provocando Goodhart (L4). |
| **5. Práctica** | 4 / 4 | 4 / 4 | 4 / 4 | 4 / 4 | Cada lección incluye una práctica SQL real en DuckDB-Wasm donde el `starter` falla legítimamente y la `solution` obtiene `"Práctica superada · El resultado coincide con la referencia"`. |
| **6. Brevedad** | 4 / 4 | 4 / 4 | 4 / 4 | 4 / 4 | Longitudes dentro del rango (`1066`, `1094`, `1140` y `1159` palabras) y media de palabras por oración por debajo de 20 (`19.2`, `19.6`, `19.7` y `19.4` <= `22`). |
| **7. Precisión** | 4 / 4 | 4 / 4 | 4 / 4 | 4 / 4 | Fórmulas, sintaxis DuckDB (`FILTER (WHERE ...)`, `COALESCE`, CTEs) y referencias bibliográficas primarias verificadas sin cifras ni tablas inventadas. |
| **8. Tono** | 4 / 4 | 4 / 4 | 4 / 4 | 4 / 4 | Cumple íntegramente el Apéndice B: `0` hallazgos en `check-copy.mjs`, español neutro técnico, sin emojis ni clichés de IA. |
| **Total (sobre 32)** | **32 / 32** | **32 / 32** | **32 / 32** | **32 / 32** | Todas las lecciones cumplen `>= 3` en los 8 criterios (`32 / 32`). |

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

## Revisión propia (mínimo 5 defectos encontrados y corregidos)

1. **Consultas sobre tablas legadas (`order_lines` y `campaigns`) no montadas en `src/lab/duckdb.js`:**
   - *Dónde:* `src/data/lessons/bi2-metricas/bi2-metricas-02-arboles-kpis-palancas.js` (líneas 96–254 y 414–483), `src/data/lessons/bi2-metricas/bi2-metricas-03-metricas-guardia.js` (líneas 109–196 y 498–570) y `src/data/lessons/bi2-metricas/bi2-metricas-04-north-star-goodhart.js` (líneas 126–294 y 476–549).
   - *Defecto:* Aunque `public/datasets/` contiene archivos Parquet legados `order_lines.parquet` y `campaigns.parquet`, `src/lab/duckdb.js` (`MERCADO_BRISA_TABLES`, líneas 3–17) solo monta en el navegador las 13 tablas canónicas (`order_items`, `products`, `stores`, `experiments`, `experiment_assignments`, etc.). Al probar inicialmente la práctica en el navegador, DuckDB-Wasm arrojó `Table with name order_lines does not exist!`.
   - *Corrección:* Reescribí las consultas SQL, tablas y explicaciones de L2, L3 y L4 (y de `docs/curriculo/investigacion/bi2-metricas.md`, líneas 90–158) usando `order_items` unido con `products` (`SUM(oi.qty * p.unit_cost_usd)`), `stores.region`, `orders.campaign_id` y `experiments` unido con `experiment_assignments`.
2. **Promedio de longitud de oración superior a 22 palabras en las 4 lecciones:**
   - *Dónde:* `src/data/lessons/bi2-metricas/bi2-metricas-01-anatomia-metrica.js` (líneas 22–134), `bi2-metricas-02-arboles-kpis-palancas.js` (líneas 22–155), `bi2-metricas-03-metricas-guardia.js` (líneas 22–169) y `bi2-metricas-04-north-star-goodhart.js` (líneas 22–173).
   - *Defecto:* La primera ejecución de `node scripts/check-copy.mjs` reportó promedios de `26.5`, `24.5`, `26.9` y `29.3` palabras por oración (superando el máximo de `22`).
   - *Corrección:* Partí las oraciones compuestas y subordinadas en frases directas de una sola idea hasta reducir los promedios a `19.2`, `19.6`, `19.7` y `19.4` palabras por oración.
3. **Aparición de términos prohibidos del Apéndice B (`ecosistema`, `mágico`, `robusto`) y exceso de negritas en un párrafo:**
   - *Dónde:* `src/data/lessons/bi2-metricas/bi2-metricas-01-anatomia-metrica.js` (línea 112), `bi2-metricas-02-arboles-kpis-palancas.js` (línea 88), `bi2-metricas-03-metricas-guardia.js` (línea 48) y `bi2-metricas-04-north-star-goodhart.js` (líneas 54 y 142).
   - *Defecto:* `scripts/check-copy.mjs` detectó 2 apariciones de `ecosistema`, 1 de `mágico`, 1 de `robusto` y 1 párrafo con 4 bloques `**...**` en L4.
   - *Corrección:* Sustituí los adjetivos prohibidos por términos técnicos exactos (`catálogo de datos`, `número aislado`, `consistente`) y dejé las negritas únicamente en los conceptos definidos (`<= 3` por párrafo), logrando `0` hallazgos en `check-copy.mjs`.
4. **Discrepancias con `LessonSchema` en el primer borrador de las 4 lecciones:**
   - *Dónde:* `src/data/lessons/bi2-metricas/bi2-metricas-01..04.js` (líneas 1–18, bloques `checkpoints` en líneas 285–340 y bloques `practice` en líneas 342–570).
   - *Defecto:* En la primera pasada usé `track: 'bi'` en lugar de `tracks: ['bi']` + `contentVersion: 1`, `options[].label` en lugar de `options[].text` + `correct: boolean`, y `practice.expected` como arreglo JSON en vez de la consulta SQL de referencia.
   - *Corrección:* Ajusté todos los campos para cumplir exactamente con `src/data/schema/lesson.js` (líneas 52–145), obteniendo `4 válidas | 0 con advertencias | 0 con errores` en `check-content.mjs`.
5. **Categorías fuera del enum y campos faltantes en `docs/curriculo/investigacion/bi2-metricas-glossary.json`:**
   - *Dónde:* `docs/curriculo/investigacion/bi2-metricas-glossary.json` (líneas 1–261).
   - *Defecto:* Los términos propuestos usaban inicialmente `category: 'bi'` y carecían de `english`, `whyItMatters` y `sources[].publisher`/`supports` requeridos por `src/data/schema/glossary.js` (líneas 14–38).
   - *Corrección:* Normalicé las categorías a `'metricas'` y `'experimentacion'` y completé todos los campos requeridos por `GlossaryTermSchema`.
6. **Invocación sin `await` de `buildContextPrompt` en la prueba del tutor IA (`agy`):**
   - *Dónde:* integración con `src/ai/promptBuilder.js` (línea 139) y `server/agyCliRunner.js` (línea 98) durante el Paso 5.
   - *Defecto:* `buildContextPrompt` es asíncrona porque importa dinámicamente `src/data/lessons/index.js`; llamarla sin `await` pasaba `[object Promise]` al runner de `agy`.
   - *Corrección:* Añadí `await buildContextPrompt(...)` y usé el modelo por defecto validado de `agy`, obteniendo las 8 respuestas contextualizadas del tutor IA.

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

> Al tratarse de un módulo nuevo (`bi2-metricas`), antes de esta entrega las 4 lecciones estaban en estado `planned` (*En preparación*). Las capturas siguientes corresponden al estado final verificado en `http://127.0.0.1:5217/` e inspeccionado con `read_file`:

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
   - Incorporar en `src/data/glossary.js` los 8 términos validados contra `GlossaryTermSchema` (`metrica-canonica`, `filtro-canonico`, `arbol-de-kpis`, `palanca-operativa`, `metrica-rezagada-vs-adelantada`, `umbral-de-guardia`, `metrica-estrella-polar`, `ley-de-goodhart`) o actualizar `relatedLessons` en los términos equivalentes existentes.
3. **Nota informativa sobre `public/datasets/` vs. `src/lab/duckdb.js`:**
   - En `public/datasets/` existen dos archivos Parquet adicionales (`order_lines.parquet` y `campaigns.parquet`) que no están listados en `MERCADO_BRISA_TABLES` dentro de `src/lab/duckdb.js`. Todas las consultas de `bi2-metricas` usan exclusivamente las 13 tablas canónicas de `MERCADO_BRISA_TABLES` (`orders`, `order_items`, `products`, `customers`, `refunds`, `stores`, `experiments`, `experiment_assignments`), pero conviene tenerlo presente para otros módulos.

---

## Pendiente (con motivo)

Ninguno.
