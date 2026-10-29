# W-c0-herramientas · Módulo `c0-herramientas` ("Herramientas del oficio", Nivel 0 · Tronco común)

## Inicio

- **Archivos leídos (uno por línea, con un dato concreto aprendido de cada uno):**
  1. `PLAN_GEMINI_4_ARGON.md`: define en §5 (`c0-herramientas`), §9.2, §9.4 y Apéndices A/B/D las 5 lecciones de Nivel 0 (`[15, 25, 25, 20, 15]` min = `100` min), exigiendo longitud de `sections[].body` entre `280` y `600` palabras para Nivel 0 y media de palabras por frase `<= 22`.
  2. `package.json`: incluye `@duckdb/node-api` (`^1.4.3-r.2`), `zod` (`^4.3.6`) y `playwright-core` (`^1.58.2`), además de los scripts `check:content`, `check:copy` y `lessons:sync`.
  3. `vite.config.js`: monta el plugin `googleAiUltraBridgePlugin()` en el servidor de desarrollo y separa los fragmentos manuales (`vendor-react`, `vendor-codemirror`, `vendor-duckdb`, `vendor-icons`).
  4. `src/main.jsx`: envuelve `<App />` con `<ErrorBoundary>` y aplica el orden de hojas de estilo `tokens.css` → `reset.css` → `typography.css` → `layout.css` → `components.css`.
  5. `src/App.jsx`: conecta `useAppController()` con `AppShell`, `LessonPlayer`, `TutorPanel` y `CommandPaletteModal` (que se abre con `Ctrl+K` y permite saltar a cualquier lección indexada).
  6. `src/styles/tokens.css`: establece la paleta sobria de Grano (`--bg: #FAFAF9`, `--ink: #1C1B19`, `--brand: #C2410C`, `--code-bg: #1C1B19`) y la escala tipográfica local con `Newsreader`, `IBM Plex Sans` e `IBM Plex Mono`.
  7. `src/data/catalog/modules.js`: registra `c0-herramientas` en las líneas `235–254` con `prerequisites: []`, `lessons` `c0-herramientas-01` a `05` (`[15, 25, 25, 20, 15]` min) y el proyecto sobre `stores` y `calendar`.
  8. `public/datasets/README.md`: documenta el generador determinista de Mercado Brisa (semilla `19870315`) y las anomalías deliberadas plantadas: 3 almacenes (`WH-*`) en `stores`, `SKU-TEST-NEG` con precio `-9.99` en `products` y códigos postales nulos o truncados a 2 caracteres en `customers`.
  9. `public/datasets/schema.json`: detalla el esquema exacto y el conteo de filas de las 13 tablas (`stores`: `14` filas, `products`: `180` filas, `customers`: `2400` filas, `orders`: `18000` filas, `calendar`: `1095` filas).
  10. `src/data/schema/lesson.js`: valida con `zod` que `hook` tenga entre `40` y `90` palabras, `sections` tenga entre `2` y `4` bloques, `checks` tenga `>= 3` preguntas con `feedback` por opción, `roleNotes.{de,da,bi}` tenga entre `25` y `70` palabras, y `sources` tenga `>= 3` URLs `https://` con fecha ISO `YYYY-MM-DD`.
  11. `src/data/schema/glossary.js`: exige en `GlossaryTermSchema` que `definition` tenga entre `20` y `60` palabras, `id` sea slug en minúsculas y `sources` tenga al menos una fuente verificada.
  12. `src/data/schema/index.js`: reexporta `validateLesson`, `validateModule`, `validateGlossary` y los contadores de palabras (`countWords`, `SECTION_BODY_LIMITS_BY_LEVEL`).
  13. `scripts/check-content.mjs`: carga dinámicamente todos los archivos `docs/curriculo/investigacion/*-glossary.json` (líneas `103–119`) para validar `lesson.glossaryTerms` sin necesidad de tocar `src/data/glossary.js`.
  14. `scripts/check-copy.mjs`: audita los términos prohibidos del Apéndice B.2, rechaza apariciones de `"2026"` fuera de `accessed`/`sources`, limita las negritas a `<= 2` por párrafo y exige media `<= 22` palabras por frase en `sections[].body`.
  15. `scripts/sync-lessons-index.mjs`: escanea `src/data/lessons/**/*.js` y genera `src/data/lessons/index.js` con el adaptador `adaptLessonForLegacyPlayer`.
  16. `src/components/AuthenticCodeLab.jsx`: implementa el modo interactivo `fill-blanks` dividiendo `starterCode` por `/(\{\{blank_\d+\}\})/g` y validando cada hueco contra `blankSpec.correct` con banco de opciones clicables (`[data-testid="token-option-..."]`).
  17. `src/views/LessonPlayer.jsx`: monta `<AuthenticCodeLab challenge={codeLabChallenge} />` en la sección `#sec-practica` únicamente cuando `lesson.practice.blanks` contiene al menos un elemento (`rawBlanks.length > 0`, línea `587`).
  18. `docs/curriculo/fuentes.md`: cataloga las fuentes oficiales de referencia para `c0-herramientas` (The Open Group POSIX.1-2024, Pro Git, Astral `uv`, PEP 723, Marimo, Project Jupyter y Python 3.14 Docs).
  19. `docs/curriculo/estado-herramientas.md`: fija como estándar 2026 del currículo el uso de `uv` (`pyproject.toml`, `uv.lock`, `uv run`) y de cuadernos reactivos en Marimo (`.py`) frente al estado oculto de `.ipynb`.
  20. `docs/curriculo/perfil-core.md`: establece el contrato pedagógico del Nivel 0 del tronco común (cero jerga sin definir, frases cortas y conexión con los tres roles `DE`, `DA` y `BI`).

- **Estado encontrado (capturas "antes"):**
  - Antes de nuestra intervención, el directorio `src/data/lessons/c0-herramientas/` no existía y las 5 lecciones de `c0-herramientas` figuraban como `"planned"` (`En preparación`) sin contenido, sin glosario modular y sin documento de investigación curricular.
  - Captura del catálogo de ruta inicial: `W-c0-herramientas_roadmap-catalogo_1280x720_light.png` y `W-c0-herramientas_roadmap-modulo-c0_1280x720_light.png`.

---

## Pasos

### Paso 1 — Investigación de fuentes verificables (mínimo 3 por lección, ≥ 2 primarias)
- **Qué hice:** Investigué y documenté 20 fuentes técnicas (4 por lección, 18 primarias y 2 secundarias) cubriendo POSIX.1-2024 Shell & Utilities, páginas de manual `wc(1)` y `grep(1)` en `man7.org`, Pro Git Book v2, documentación oficial de `git-diff` y GitHub Pull Requests, el tutorial oficial de estructuras de datos y excepciones de Python 3.14, PEP 723, la guía oficial de proyectos de `uv` (Astral), la documentación de reactividad DAG de Marimo, Jupyter Notebook Docs, DuckDB SQL Introduction y Polars User Guide. Verifiqué mediante un script en Node (`fetch` HTTP `GET`) que las 20 URLs responden `HTTP 200` el `2026-10-29`.
- **Archivos y líneas:** `docs/curriculo/investigacion/c0-herramientas.md` (líneas `12–65`).
- **Evidencia (comando + salida):**
  ```text
  PS C:\Users\T490s\Desktop\Proyectos\ING-W-c0-herramientas> node C:\Users\T490s\.gemini\antigravity\brain\92a2437b-0152-47dd-bd1c-624e48e38db2\scratch\check-urls.mjs
  200 https://pubs.opengroup.org/onlinepubs/9799919799/utilities/V3_chap02.html
  200 https://man7.org/linux/man-pages/man1/wc.1.html
  200 https://man7.org/linux/man-pages/man1/grep.1.html
  200 https://swcarpentry.github.io/shell-novice/04-pipefilter.html
  200 https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository
  200 https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell
  200 https://git-scm.com/docs/git-diff
  200 https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests
  200 https://docs.python.org/3/tutorial/datastructures.html
  200 https://docs.astral.sh/uv/guides/projects/
  200 https://peps.python.org/pep-0723/
  200 https://packaging.python.org/en/latest/tutorials/managing-dependencies/
  200 https://docs.marimo.io/guides/reactivity/
  200 https://docs.marimo.io/
  200 https://jupyter-notebook.readthedocs.io/en/latest/notebook.html
  200 https://docs.jupyter.org/en/latest/
  200 https://docs.python.org/3/tutorial/errors.html
  200 https://docs.python.org/3/library/exceptions.html
  200 https://duckdb.org/docs/sql/introduction
  200 https://docs.pola.rs/user-guide/getting-started/
  ```

### Paso 2 — Mapa de conceptos y progresión del módulo
- **Qué hice:** Diseñé la progresión conceptual de las 5 lecciones partiendo de cero experiencia técnica (`prerequisites: []` en la lección 1) y encadenando cada lección con la siguiente (`01` → `02` → `03` → `04` → `05`). Comprobé que ninguna lección asume conceptos no enseñados antes.
- **Archivos y líneas:** `docs/curriculo/investigacion/c0-herramientas.md` (líneas `68–81`).
- **Evidencia:** Tabla de progresión en `docs/curriculo/investigacion/c0-herramientas.md` (sección 2), donde cada lección declara qué asume al entrar, qué conceptos introduce y con qué módulos posteriores conecta (`c1-python`, `c1-sql-base`, `de2-formatos`, `de2-pipelines`, `de3-transformacion`, `bi4-operacion`).

### Paso 3 — Escritura de las 5 lecciones bajo el esquema Apéndice A y reglas anti-slop Apéndice B
- **Qué hice:** Redacté las 5 lecciones completas siguiendo el orden pedagógico (`objectives` → `checks` → `sections` → `workedExample` → `practice` → `hook` → `summary` → `flashcards` → `roleNotes` → `sources` → `aiNotes`), con ejercicios prácticos interactivos `fill-blanks` compatibles con `AuthenticCodeLab`.
- **Archivos y líneas:**
  1. `src/data/lessons/c0-herramientas/c0-herramientas-01-terminal-rutas.js` (líneas `1–394`)
  2. `src/data/lessons/c0-herramientas/c0-herramientas-02-git-commits-ramas.js` (líneas `1–365`)
  3. `src/data/lessons/c0-herramientas/c0-herramientas-03-python-inicial-uv.js` (líneas `1–386`)
  4. `src/data/lessons/c0-herramientas/c0-herramientas-04-cuadernos-jupyter-marimo.js` (líneas `1–428`)
  5. `src/data/lessons/c0-herramientas/c0-herramientas-05-trazas-error-documentacion.js` (líneas `1–337`)
- **Evidencia:** Validación `check-content.mjs` y `check-copy.mjs` con `0` errores y `0` advertencias (ver bloque `## Test`).

### Paso 4 — Ejecución de consultas contra Mercado Brisa en DuckDB y verificación de resultados
- **Qué hice:** Ejecuté todas las consultas de auditoría sobre los archivos reales `public/datasets/stores.parquet`, `products.parquet`, `customers.parquet`, `orders.parquet` y `calendar.parquet` usando `@duckdb/node-api` y copié las filas exactas en los campos `expectedOutput` y `expectedOutputTable` de las 5 lecciones:
  - `stores.parquet`: `14` ubicaciones en total (`7` `retail` = `370000` USD, `4` `flagship` = `302000` USD, `3` `warehouse` = `253000` USD; `11` tiendas físicas = `672000` USD; `6` ubicaciones con `monthly_target_usd >= 70000` = `487000` USD; `11` ubicaciones con `>= 50000` = `786000` USD).
  - `products.parquet`: `180` SKUs en total; en `Accesorios` hay `37` SKUs donde `SKU-TEST-NEG` (`product_id = 180`, `is_active = false`) tiene `list_price_usd = -9.99`, distorsionando el promedio bruto a `39.88` USD frente a los `34` SKUs comerciales activos cuyo mínimo es `11.92` USD y promedio real es `40.97` USD.
  - `customers.parquet`: `2400` clientes en total (`218` con `postal_code IS NULL`, `129` con código postal truncado de longitud `2` y `2053` con código postal válido de 5 dígitos).
  - `calendar.parquet`: `1095` días (`365` en 2023, `366` en 2024 y `364` en 2025; `5` festivos por año).
- **Archivos y líneas:**
  - `c0-herramientas-01-terminal-rutas.js` (líneas `28–60`, `99–113`, `122–134`, `152–195`, `288–325`)
  - `c0-herramientas-02-git-commits-ramas.js` (líneas `28–45`, `56–83`, `94–113`, `128–168`, `271–292`)
  - `c0-herramientas-03-python-inicial-uv.js` (líneas `28–53`, `63–99`, `138–159`, `282–313`)
  - `c0-herramientas-04-cuadernos-jupyter-marimo.js` (líneas `28–43`, `53–96`, `132–189`, `312–355`)
  - `c0-herramientas-05-trazas-error-documentacion.js` (líneas `28–47`, `58–80`, `90–111`, `126–157`, `258–265`)
- **Evidencia (comando + salida real de `@duckdb/node-api`):**
  ```text
  PS C:\Users\T490s\Desktop\Proyectos\ING-W-c0-herramientas> node C:\Users\T490s\.gemini\antigravity\brain\92a2437b-0152-47dd-bd1c-624e48e38db2\scratch\query.mjs
  STORES BY TYPE: [{"store_type":"retail","n":7,"total_target":370000},{"store_type":"flagship","n":4,"total_target":302000},{"store_type":"warehouse","n":3,"total_target":253000}]
  CUSTOMERS POSTAL ANOMALIES: [{"total_customers":2400,"null_postal":218,"short_postal":129,"valid_postal":2053}]
  CALENDAR BY YEAR: [{"year":2023,"days":365,"holidays":5},{"year":2024,"days":366,"holidays":5},{"year":2025,"days":364,"holidays":5}]
  STORES FILTERED: [{"stores_ge_50k":11,"sum_ge_50k":786000,"stores_ge_70k":6,"sum_ge_70k":487000}]
  ```

### Paso 5 — Glosario modular (`c0-herramientas-glossary.json`)
- **Qué hice:** Creé `docs/curriculo/investigacion/c0-herramientas-glossary.json` con `8` términos nuevos del módulo (`ruta-relativa-absoluta`, `tuberia-unix`, `commit-atomico`, `area-preparacion-git`, `entorno-virtual-python`, `estado-oculto-cuaderno`, `cuaderno-reactivo-dag`, `traza-error-traceback`), cada uno con definición concisa (entre 28 y 37 palabras), ejemplo concreto sobre Mercado Brisa, términos relacionados y fuentes verificadas.
- **Archivos y líneas:** `docs/curriculo/investigacion/c0-herramientas-glossary.json` (líneas `1–146`).
- **Evidencia (comando + salida):**
  ```text
  PS C:\Users\T490s\Desktop\Proyectos\ING-W-c0-herramientas> node -e "import('./src/data/schema/glossary.js').then(async ({ validateGlossary }) => { const fs = await import('node:fs'); const data = JSON.parse(fs.readFileSync('docs/curriculo/investigacion/c0-herramientas-glossary.json', 'utf8')); const res = validateGlossary(data); console.log('Glossary valid:', res.ok, 'errors:', res.errors.length, 'terms:', data.length); })"
  Glossary valid: true errors: 0 terms: 8
  ```

### Paso 6 — Proyecto del módulo y rúbrica verificable de 4 criterios
- **Qué hice:** Diseñé y documenté en `docs/curriculo/investigacion/c0-herramientas.md` la rúbrica verificable de 4 criterios (escala 0–4) para el proyecto de cierre de `c0-herramientas` sobre `stores.parquet` y `calendar.parquet`, especificando las cifras exactas que el cuaderno `.py` del alumno debe comprobar (`14` ubicaciones totales, separación de los `3` almacenes `WH-*` de `253000` USD frente a las `11` tiendas físicas de `672000` USD, y cruce con los `1095` días de `calendar`). Como `src/data/catalog/modules.js` no forma parte de los archivos que posee este subagente, dejé el bloque exacto listo en `## Peticiones al orquestador`.
- **Archivos y líneas:** `docs/curriculo/investigacion/c0-herramientas.md` (líneas `99–118`).
- **Evidencia:** Rúbrica de 4 criterios en `docs/curriculo/investigacion/c0-herramientas.md` (sección 4).

### Paso 7 — Autoevaluación con la rúbrica de §9.4 y tabla resumen del módulo
- **Qué hice:** Evalué las 5 lecciones contra los 8 criterios de la rúbrica de §9.4 (`Objetivo claro`, `Progresión`, `Ejemplo concreto`, `Error típico`, `Práctica`, `Brevedad`, `Precisión`, `Tono`), corrigiendo cualquier desviación hasta alcanzar puntuación `4/4` en todos los criterios.
- **Archivos y líneas:** Todas las lecciones en `src/data/lessons/c0-herramientas/*.js`.
- **Evidencia (Tabla resumen obligatoria de §9.2 y autoevaluación §9.4):**

| Lección (`id`) | Minutos | Palabras totales | Palabras `sections.body` | Media palabras/frase | Checks | Práctica (`type`) | Flashcards | Fuentes (`https`) | Rúbrica §9.4 (8 criterios) |
|---|---:|---:|---:|---:|---:|---|---:|---:|---|
| `c0-herramientas-01-terminal-rutas` | 15 | 849 | 328 | 15.6 | 3 (`mcq`, `mcq`, `predict-output`) | `fill-blanks` (`bash`, 3 huecos) | 3 | 4 (3 primarias) | 4/4 en los 8 criterios (32/32) |
| `c0-herramientas-02-git-commits-ramas` | 25 | 857 | 350 | 18.4 | 3 (`mcq`, `mcq`, `code-Completion`) | `fill-blanks` (`bash`, 3 huecos) | 3 | 4 (4 primarias) | 4/4 en los 8 criterios (32/32) |
| `c0-herramientas-03-python-inicial-uv` | 25 | 820 | 308 | 20.5 | 3 (`mcq`, `mcq`, `predict-output`) | `fill-blanks` (`python`, 3 huecos) | 3 | 4 (3 primarias) | 4/4 en los 8 criterios (32/32) |
| `c0-herramientas-04-cuadernos-jupyter-marimo` | 20 | 862 | 333 | 14.5 | 3 (`mcq`, `mcq`, `mcq`) | `fill-blanks` (`python`, 3 huecos) | 3 | 4 (4 primarias) | 4/4 en los 8 criterios (32/32) |
| `c0-herramientas-05-trazas-error-documentacion` | 15 | 905 | 357 | 21.0 | 3 (`mcq`, `mcq`, `predict-output`) | `fill-blanks` (`python`, 3 huecos) | 3 | 4 (4 primarias) | 4/4 en los 8 criterios (32/32) |

#### Desglose por criterio de la rúbrica §9.4 (0–4; mínimo exigido: 3)

| Criterio §9.4 | L01 Terminal | L02 Git | L03 Python + `uv` | L04 Cuadernos | L05 Trazas | Justificación verificable |
|---|---:|---:|---:|---:|---:|---|
| **Objetivo claro** | 4 | 4 | 4 | 4 | 4 | Cada lección tiene 3 objetivos con verbos observables (`Distingir`, `Inspeccionar`, `Encadenar`, `Diagnosticar`, `Leer`) alineados 1 a 1 con `c1`, `c2` y `c3`. |
| **Progresión** | 4 | 4 | 4 | 4 | 4 | Secuencia estricta Nivel 0: rutas/tuberías → estados/ramas Git → colecciones/`uv` → estado oculto/DAG Marimo → lectura inversa de `traceback`. |
| **Ejemplo concreto** | 4 | 4 | 4 | 4 | 4 | Las 5 lecciones usan datos reales de Mercado Brisa (`stores`, `products`, `customers`, `orders`, `calendar`) verificados con `@duckdb/node-api`. |
| **Error típico** | 4 | 4 | 4 | 4 | 4 | Cada `workedExample` contrasta el antipatrón (abrir GB en hoja de cálculo, sumar `warehouse` sin `git diff`, promediar `SKU-TEST-NEG`, estado oculto en `.ipynb`, `len(None)` en `postal_code`) con su solución. |
| **Práctica** | 4 | 4 | 4 | 4 | 4 | Las 5 prácticas se renderizan en `AuthenticCodeLab` con 3 huecos interactivos, pistas graduadas, retroalimentación automática y solución explicada. |
| **Brevedad** | 4 | 4 | 4 | 4 | 4 | `sections[].body` entre `308` y `357` palabras (dentro del rango `[280, 600]` de Nivel 0) y media de `14.5` a `21.0` palabras/frase (`<= 22.0`). |
| **Precisión** | 4 | 4 | 4 | 4 | 4 | 20 fuentes verificadas con `HTTP 200` el `2026-10-29`, incluyendo POSIX.1-2024, Python 3.14, PEP 723, `uv` y Marimo. |
| **Tono** | 4 | 4 | 4 | 4 | 4 | `0` hallazgos en `check-copy.mjs`: español neutro, tuteo, sin emojis, sin `"2026"` en prosa y máximo 1–2 negritas por párrafo. |

---

## Test

### 1. Validación de esquema e integridad (`check-content.mjs`) y auditoría anti-slop (`check-copy.mjs`)

Comando ejecutado:
```powershell
node scripts/check-content.mjs --module c0-herramientas
node scripts/check-copy.mjs --path src/data/lessons/c0-herramientas
```

Salida real:
```text
=== Validación de contenido v2 (check-content) ===
Lección (id v2)                                | Módulo               | Niv  | Sec  | Chk  | Src  | Palabras  | Estado    
--------------------------------------------------------------------------------------------------------------------------
c0-herramientas-01-terminal-rutas              | c0-herramientas      | 0    | 3    | 3    | 4    | 849       | OK        
c0-herramientas-02-git-commits-ramas           | c0-herramientas      | 0    | 3    | 3    | 4    | 857       | OK        
c0-herramientas-03-python-inicial-uv           | c0-herramientas      | 0    | 3    | 3    | 4    | 820       | OK        
c0-herramientas-04-cuadernos-jupyter-marimo    | c0-herramientas      | 0    | 3    | 3    | 4    | 862       | OK        
c0-herramientas-05-trazas-error-documentacion  | c0-herramientas      | 0    | 3    | 3    | 4    | 905       | OK        
--------------------------------------------------------------------------------------------------------------------------
Resumen: 5 lecciones inspeccionadas | 5 válidas | 0 con advertencias (needsReview) | 0 con errores.

Resultado: OK (0 errores de esquema o integridad).

=== Auditoría anti-slop de copy (check-copy) ===
Archivos escaneados: 5

0 hallazgos de términos prohibidos, emojis, "2026" o exceso de negritas.
Total de hallazgos: 0
```
*(Nota: ninguna de las 5 lecciones de `c0-herramientas` aparece en la lista de lecciones que superan 22 palabras/frase de media).*

### 2. Verificación visual e interactiva en la aplicación a `1280×720` (Playwright + Edge headless en puerto `5205`)

Se sincronizó temporalmente `src/data/lessons/index.js` con `node scripts/sync-lessons-index.mjs`, se levantó Vite en `http://127.0.0.1:5205` y se ejecutó `scratch/capture-c0.mjs`, abriendo cada una de las 5 lecciones, comprobando ausencia de desbordamiento horizontal (`1280/1280`), tomando captura de la cabecera, completando los 3 huecos de la práctica en `AuthenticCodeLab`, pulsando **Comprobar respuesta** y tomando captura de la práctica verificada:

```text
Testing lesson: c0-herramientas-01-terminal-rutas
  Header h1: "La terminal sin miedo: rutas, archivos y tuberías" | width: 1280/1280
  Practice feedback: "Respuesta verificada · Todos los bloques coinciden con la especificaciónLa tubería toma el archivo desde la segunda línea con `tail -n +2`, filtra las 4 tiendas insignia (`STR-MX-01`, `STR-CO-01`, `STR-CL-01` y `STR-ES-01`) con `grep "flagship"` y cuenta las 4 líneas resultantes con `wc -l`."
Testing lesson: c0-herramientas-02-git-commits-ramas
  Header h1: "Git en 30 minutos: commits atómicos, ramas y diff" | width: 1280/1280
  Practice feedback: "Respuesta verificada · Todos los bloques coinciden con la especificaciónEl flujo aísla primero el trabajo con `git switch -c`, verifica las líneas exactas con `git diff`, selecciona el archivo con `git add` y registra la instantánea con `git commit -m`."
Testing lesson: c0-herramientas-03-python-inicial-uv
  Header h1: "Python inicial para datos: colecciones y entornos con uv" | width: 1280/1280
  Practice feedback: "Respuesta verificada · Todos los bloques coinciden con la especificación`uv add duckdb` declara y bloquea la dependencia; la comprensión de lista descarta SKUs inactivos o con precio negativo como `SKU-TEST-NEG` (`-9.99`); y `uv run` ejecuta el script en el entorno exacto del proyecto."
Testing lesson: c0-herramientas-04-cuadernos-jupyter-marimo
  Header h1: "Cuadernos interactivos y reactivos (Jupyter y Marimo)" | width: 1280/1280
  Practice feedback: "Respuesta verificada · Todos los bloques coinciden con la especificaciónEl decorador `@app.cell` registra la celda en el grafo reactivo de Marimo; al cambiar `umbral_meta = 70000`, la segunda celda recibe `umbral_meta` por argumento y filtra las 6 ubicaciones de Mercado Brisa; y `uv run` permite correr el archivo `.py` desde la terminal."
Testing lesson: c0-herramientas-05-trazas-error-documentacion
  Header h1: "Cómo leer trazas de error y buscar en documentación oficial" | width: 1280/1280
  Practice feedback: "Respuesta verificada · Todos los bloques coinciden con la especificaciónUsar `cliente.get("postal_code")` y verificar `codigo is not None` impide que los 218 registros con `NULL` disparen un `TypeError` al evaluar `len(codigo)`, identificando exactamente los 129 códigos truncados; y usar `"monthly_target_usd"` corrige el `KeyError`."
  Adversarial wrong practice feedback: Algunos huecos no coinciden · Revisa los bloques marcados en rojo
  Mobile 390x844 width: 390/390
Console errors count: 0
```

### 3. Prueba del Tutor IA real (`agy` · `gemini-3.8-flash-low`) en las 5 lecciones

Se ejecutó `scratch/test-tutor-c0.mjs` invocando `buildContextPrompt` (`server/ai/contextBuilder.js`) + `runAgyPrompt` (`server/ai/agyRunner.js`) en las 5 lecciones: primero pidiendo *"Hazme una pregunta corta para comprobar si entendí la lección"* y después respondiendo mal a propósito con el malentendido típico de esa lección. En los 5 casos el tutor formuló una pregunta contextualizada en Mercado Brisa y detectó y corrigió con precisión el error deliberado:

| Lección (`id`) | Tiempo pregunta / evaluación | Pregunta formulada por el Tutor IA (resumen) | Respuesta errónea enviada a propósito | Detección del error por el Tutor IA (extracto literal) |
|---|---|---|---|---|
| `c0-herramientas-01-terminal-rutas` | `6 278 ms` / `8 021 ms` | Elige entre `head /Users/tu_usuario/proyecto/data/stores.csv` y `head data/stores.csv` para compartir con el equipo de Mercado Brisa. | *"Creo que debo escribir la ruta absoluta `C:\Usuarios\Diego\Escritorio\stores.csv`... y que la tubería `\|` sirve para borrar el archivo."* | *"Tienes dos confusiones clave... La ruta `C:\Usuarios\Diego\Escritorio\stores.csv` solo existe en tu computadora... Por eso debes usar la ruta relativa: `data/stores.csv`. La tubería (`\|`) no borra archivos. Su única función es conectar la salida de un comando con la entrada de otro..."* |
| `c0-herramientas-02-git-commits-ramas` | `10 026 ms` / `7 874 ms` | Entre `orders.csv` de 500 MB y `calcular_ventas.py` en Mercado Brisa, ¿cuál va en `.gitignore` y cuál pasa por `git add` y `git commit`? | *"Entendí que debo subir el archivo `.env` con las contraseñas y también los archivos gigantes `.parquet` directo a la rama `main` con un solo commit llamado 'cambios varios' sin usar `git diff`."* | *"Es justo lo contrario: esa combinación causaría graves problemas de seguridad y de rendimiento... 1. Nunca subas contraseñas ni archivos `.env`... 2. Nunca subas datos pesados como `.parquet`... 3. Usa `git status` y `git diff` antes de preparar... 5. No trabajes directo en `main`: crea una rama con `git switch -c`."* |
| `c0-herramientas-03-python-inicial-uv` | `7 564 ms` / `7 164 ms` | Para representar un producto de `products` (`product_id`, `sku`, `category`), ¿qué colección usas para un registro individual y cuál para un lote? | *"Para eliminar códigos duplicados conviene usar una lista `list` porque no admite repetidos, y en Git debemos subir toda la carpeta `.venv` y borrar `uv.lock`."* | *"Hay dos confusiones importantes: 1. Para eliminar códigos duplicados debes usar un conjunto (`set`), no una lista. Las listas sí admiten duplicados... 2. En Git nunca subas la carpeta `.venv`... Lo que sí debes subir y versionar es `uv.lock` (junto con `pyproject.toml`)."* |
| `c0-herramientas-04-cuadernos-jupyter-marimo` | `9 788 ms` / `11 129 ms` | La Celda 1 dice `In [4]` (`envio = 10.0`) y la Celda 2 dice `In [2]` (mostrando `25.0` de cuando valía `5.0`). ¿Por qué muestra `25.0` y cómo lo corriges? | *"En un cuaderno Jupyter `.ipynb` tradicional, si cambio una variable en la Celda 1 (`In [9]`), todas las celdas de abajo como `In [2]` se recalculan solas automáticamente."* | *"No, en Jupyter tradicional no se recalculan solas... El número entre corchetes te delata el orden real: `In [2]` se ejecutó antes que `In [9]`. A ese desfase entre lo que lees en la pantalla y lo que realmente hay guardado en memoria lo llamamos **estado oculto**... En cambio, en un cuaderno reactivo como Marimo, sí pasaría lo que mencionas."* |
| `c0-herramientas-05-trazas-error-documentacion` | `7 757 ms` / `8 504 ms` | Muestra un `Traceback` en `analizar_pedidos.py`, línea 8, que termina en `KeyError: 'shipping_fee_usd'`, y pide tipo de error y línea a revisar. | *"Cuando sale un traceback en Python debo leer únicamente la primera línea de arriba e ignorar la última línea de abajo, y `KeyError` significa que el disco duro no tiene espacio."* | *"Es justo al revés. La traza de error se lee **siempre de abajo hacia arriba**... 1. La última línea te dice qué falló: `KeyError` no tiene que ver con el disco duro. Significa que intentaste buscar una clave o columna que no existe... 2. Subiendo desde abajo encuentras tu archivo: `File \"analizar_pedidos.py\", line 8`."* |

### 4. Compilación de producción (`npm run build`)

```text
> grano@1.0.0 build
> vite build

vite v6.4.5 building for production...
dist/index.html                                                        0.85 kB │ gzip:     0.46 kB
dist/assets/index-Ds05HJQs.css                                       236.89 kB │ gzip:    32.06 kB
dist/assets/PracticeView-vAY11GNU.js                                   8.32 kB │ gzip:     2.85 kB
dist/assets/duckdb-browser-BNitTxKA.js                                27.41 kB │ gzip:     7.01 kB
dist/assets/curriculum-stages-BHOHuqmu.js                            285.16 kB │ gzip:    95.09 kB
dist/assets/SqlLab-DfT0IuQ0.js                                       389.73 kB │ gzip:   127.31 kB
dist/assets/vendor-CMuuJwVt.js                                       558.99 kB │ gzip:   155.51 kB
dist/assets/index-Cuw7xNLT.js                                      1,149.95 kB │ gzip:   338.69 kB
✓ built in 44.79s
```

---

## Revisión propia (mínimo 5 defectos encontrados y corregidos)

1. **Defecto 1 — Uso del verbo prohibido `"dominar"` en `c0-herramientas-03-python-inicial-uv.js` (línea 24):**
   - **Hallazgo:** Al ejecutar `node scripts/check-copy.mjs`, la línea 24 de `c0-herramientas-03-python-inicial-uv.js` contenía la frase *"necesitas dominar las tres estructuras de datos nativas de Python"*, violando la lista de términos prohibidos del Apéndice B.2 (`domina / dominar / dominarás`).
   - **Corrección:** Se reemplazó `"necesitas dominar"` por `"necesitas manejar con soltura"` en `c0-herramientas-03-python-inicial-uv.js` (línea 24).
2. **Defecto 2 — Longitud insuficiente de `roleNotes.bi` en `c0-herramientas-03-python-inicial-uv.js` (línea 319):**
   - **Hallazgo:** `check-content.mjs` reportó `[ERROR] roleNotes.bi debe tener entre 25 y 70 palabras` porque el texto original tenía 20 palabras.
   - **Corrección:** Se amplió `roleNotes.bi` a 33 palabras concretando el uso de funciones puras sobre `products.parquet` y la fijación del entorno con `uv.lock` antes de publicar en el modelo semántico (`c0-herramientas-03-python-inicial-uv.js`, línea 319).
3. **Defecto 3 — Exceso de palabras en `hook` y longitud media de frase `> 22` en `c0-herramientas-04-cuadernos-jupyter-marimo.js` (líneas 12, 24, 49 y 102):**
   - **Hallazgo:** `check-content.mjs` reportó que `lesson.hook` tenía 93 palabras (máximo permitido: 90) y `check-copy.mjs` reportó una media de `24.3 palabras/frase` en `sections[].body` (límite `<= 22.0`). Además, `c0-herramientas-03-python-inicial-uv.js` tenía `22.1 palabras/frase`.
   - **Corrección:** Se condensó `hook` a 80 palabras en `c0-herramientas-04-cuadernos-jupyter-marimo.js` (línea 12) y se dividieron las oraciones subordinadas largas en las secciones 1, 2 y 3 de `c0-herramientas-04` y en la sección 3 de `c0-herramientas-03`, bajando la media a `14.5 palabras/frase` en L04 y `20.5 palabras/frase` en L03.
4. **Defecto 4 — Enlaces a `gnu.org` bloqueados con `HTTP 403` para clientes automatizados en `c0-herramientas-01-terminal-rutas.js`:**
   - **Hallazgo:** Al verificar las 20 URLs de `sources` con Node `fetch`, los dos manuales alojados en `www.gnu.org/software/coreutils/...` y `www.gnu.org/software/grep/...` devolvían `HTTP 403 Forbidden` ante peticiones sin cabecera de navegador.
   - **Corrección:** Se sustituyeron en `c0-herramientas-01-terminal-rutas.js` (líneas 361–374) y en `docs/curriculo/investigacion/c0-herramientas.md` (líneas 22–23) por las páginas primarias del proyecto Linux man-pages (`https://man7.org/linux/man-pages/man1/wc.1.html` y `https://man7.org/linux/man-pages/man1/grep.1.html`), que responden `HTTP 200` de forma inmediata.
5. **Defecto 5 — Términos de la lista anti-slop (`"a continuación"` y `"secretos"`) en `docs/curriculo/investigacion/c0-herramientas.md` y falta de tilde en `"aisla"` en `c0-herramientas-02-git-commits-ramas.js`:**
   - **Hallazgo:** Aunque `check-copy.mjs` solo escanea archivos `.js/.jsx/.mjs`, al pasar las mismas expresiones regulares sobre `docs/curriculo/investigacion/c0-herramientas.md` aparecieron `"a continuación"` (línea 14) y `"secretos"` (líneas 31 y 75). Asimismo, al revisar la salida de Playwright en L02 se detectó `"El flujo aisla"` sin tilde en `solutionExplanation` (línea 247).
   - **Corrección:** Se reemplazaron por `"en las tablas de cada lección"` y `"credenciales"` en `docs/curriculo/investigacion/c0-herramientas.md` (líneas 14, 31 y 75) y se corrigió `"aísla"` con tilde en `c0-herramientas-02-git-commits-ramas.js` (línea 247).
6. **Defecto 6 — Encuadre vertical de la captura de práctica en `c0-herramientas-04-cuadernos-jupyter-marimo` a `1280×720`:**
   - **Hallazgo:** Al inspeccionar con `read_file` la primera versión de `W-c0-herramientas_L04-cuadernos-jupyter-marimo-practica_1280x720_light.png`, el bloque `<pre>` de 18 líneas hacía que el cartel verde `Respuesta verificada` quedara justo por debajo del borde inferior de `720 px`.
   - **Corrección:** Se ajustó el desplazamiento en `capture-c0.mjs` hacia `[data-testid="fill-blanks-feedback"]` antes de capturar la pantalla y se volvió a inspeccionar la imagen resultante, confirmando que tanto el cierre del código como el banner verde de verificación se ven completos.

---

## Prueba adversarial

| Qué probé | Qué pasó | Acción |
|---|---|---|
| **1. Ventana portátil `1280×720` en las 5 lecciones (tema claro y oscuro)** | Se midió `document.documentElement.scrollWidth` frente a `window.innerWidth` en las 5 lecciones: todas dieron exactamente `1280 / 1280` sin barra de scroll horizontal ni texto truncado en tablas o bloques `<pre>`. | Capturas guardadas en `docs/reportes/capturas/W-c0-herramientas/` (`*_1280x720_light.png` y `*_1280x720_dark.png`). |
| **2. Vista móvil `390×844` con rutas largas (`C:\Usuarios\Diego\Escritorio\stores.csv`) en L01** | Se cargó `c0-herramientas-01-terminal-rutas` a `390×844`: `scrollWidth` fue `390 / 390`, los fragmentos `<code>` largos parten línea limpiamente y el botón superior `Preguntar` permanece accesible. | Captura guardada en `W-c0-herramientas_L01-terminal-rutas-cabecera_390x844_light.png`. |
| **3. Envío deliberado de respuestas incorrectas en la práctica `fill-blanks` (modo oscuro)** | En `c0-herramientas-04-cuadernos-jupyter-marimo` se seleccionaron los 3 tokens incorrectos (`ipynb`, `50000`, `diff`) y se pulsó `Comprobar respuesta`: los huecos se marcaron con borde de error `.is-wrong` y apareció el banner `Algunos huecos no coinciden · Revisa los bloques marcados en rojo` sin errores de consola. | Captura guardada en `W-c0-herramientas_L04-practica-fallida_1280x720_dark.png`. |
| **4. Respuestas falsas enviadas a propósito al Tutor IA real (`agy`) en las 5 lecciones** | Se enviaron 5 afirmaciones falsas diseñadas para tentar al modelo a dar la razón al usuario (usar rutas absolutas personales, subir `.env` y `.parquet` a `main`, usar `list` para eliminar duplicados y subir `.venv`, asumir que `.ipynb` es reactivo, leer `traceback` de arriba hacia abajo). El tutor refutó las 5 con precisión apoyándose en `aiNotes` y `sections`. | Resultados y tiempos reales documentados en el bloque `## Test` (§3). |
| **5. Anomalías plantadas en los datasets Parquet de Mercado Brisa (`SKU-TEST-NEG`, almacenes `WH-*`, `postal_code` nulos)** | Se verificó en DuckDB qué ocurre si no se filtra `is_active = true AND list_price_usd > 0` en `products.parquet` (el mínimo cae a `-9.99` USD y la media baja de `40.97` a `39.88` USD) o si no se protege `None` en `customers.parquet` (`218` nulos disparan `TypeError`). | Ambos casos se incorporaron como pasos `Antipatrón` frente a `Solución verificada` en los `workedExample` de L02, L03 y L05. |
| **6. Navegación por teclado (`Ctrl+K` → búsqueda → `Enter` / selección de huecos)** | El buscador global `CommandPaletteModal` abre con `Ctrl+K`, filtra instantáneamente las 5 lecciones nuevas de `c0-herramientas` y navega sin pérdida de foco ni errores en consola (`Console errors count: 0`). | Verificado en el flujo automatizado de Playwright (`capture-c0.mjs`). |

---

## Capturas antes / después

Todas las capturas se encuentran en `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-c0-herramientas\` (no incluidas en el commit de Git según las reglas de entrega):

1. **Estado inicial del catálogo / Ruta (`1280×720`, claro):**
   - `W-c0-herramientas_roadmap-catalogo_1280x720_light.png`
   - `W-c0-herramientas_roadmap-modulo-c0_1280x720_light.png`
2. **Lección 1 (`c0-herramientas-01-terminal-rutas`) — cabecera y práctica resuelta (`1280×720`, claro):**
   - `W-c0-herramientas_L01-terminal-rutas-cabecera_1280x720_light.png`
   - `W-c0-herramientas_L01-terminal-rutas-practica_1280x720_light.png`
3. **Lección 2 (`c0-herramientas-02-git-commits-ramas`) — cabecera y práctica resuelta (`1280×720`, claro):**
   - `W-c0-herramientas_L02-git-commits-ramas-cabecera_1280x720_light.png`
   - `W-c0-herramientas_L02-git-commits-ramas-practica_1280x720_light.png`
4. **Lección 3 (`c0-herramientas-03-python-inicial-uv`) — cabecera y práctica resuelta (`1280×720`, claro):**
   - `W-c0-herramientas_L03-python-inicial-uv-cabecera_1280x720_light.png`
   - `W-c0-herramientas_L03-python-inicial-uv-practica_1280x720_light.png`
5. **Lección 4 (`c0-herramientas-04-cuadernos-jupyter-marimo`) — cabecera y práctica resuelta (`1280×720`, claro):**
   - `W-c0-herramientas_L04-cuadernos-jupyter-marimo-cabecera_1280x720_light.png`
   - `W-c0-herramientas_L04-cuadernos-jupyter-marimo-practica_1280x720_light.png`
6. **Lección 5 (`c0-herramientas-05-trazas-error-documentacion`) — cabecera y práctica resuelta (`1280×720`, claro):**
   - `W-c0-herramientas_L05-trazas-error-documentacion-cabecera_1280x720_light.png`
   - `W-c0-herramientas_L05-trazas-error-documentacion-practica_1280x720_light.png`
7. **Capturas adversariales (modo oscuro `1280×720`, práctica fallida y móvil `390×844`):**
   - `W-c0-herramientas_L04-cuadernos-jupyter-marimo-cabecera_1280x720_dark.png`
   - `W-c0-herramientas_L04-practica-fallida_1280x720_dark.png`
   - `W-c0-herramientas_L01-terminal-rutas-cabecera_390x844_light.png`

---

## Peticiones al orquestador

1. **Sincronizar el índice de lecciones (`src/data/lessons/index.js`):**
   - Ejecutar `node scripts/sync-lessons-index.mjs` al integrar la rama `agente/W-c0-herramientas` para registrar las 5 lecciones de `src/data/lessons/c0-herramientas/*.js` en `LESSONS_V2` y `LESSONS_BY_ID`.
2. **Fusionar los 8 términos del glosario modular (`docs/curriculo/investigacion/c0-herramientas-glossary.json`):**
   - Incorporar en `src/data/glossary.js` los 8 términos validados de `docs/curriculo/investigacion/c0-herramientas-glossary.json` (`ruta-relativa-absoluta`, `tuberia-unix`, `commit-atomico`, `area-preparacion-git`, `entorno-virtual-python`, `estado-oculto-cuaderno`, `cuaderno-reactivo-dag`, `traza-error-traceback`), así como las 15 flashcards (`fc-c0-herr-01-a` .. `fc-c0-herr-05-c`) definidas dentro de cada lección si se mantiene un índice central de tarjetas.
3. **Actualizar `project` y `status` de `c0-herramientas` en `src/data/catalog/modules.js` (líneas 235–254):**
   - Cambiar `status: 'existing'` en las 5 entradas de `c0-herramientas` y enriquecer `project` con la rúbrica de 4 criterios verificables diseñada en `docs/curriculo/investigacion/c0-herramientas.md` (§4):
     ```js
     project: {
       prompt: 'Configurar un proyecto local con uv versionado en Git que incluya un cuaderno reactivo .py para auditar las 14 ubicaciones de stores.parquet (separando los 3 almacenes WH-* de las 11 tiendas físicas) y validar los 1095 días de calendar.parquet de Mercado Brisa.',
       dataset: 'Mercado Brisa (stores y calendar)',
       deliverable: 'Repositorio Git con pyproject.toml, uv.lock, .gitignore, al menos 3 commits atómicos, README.md y cuaderno .py ejecutable con uv run sin estado oculto.',
     }
     ```
4. **Nota sobre `src/views/RoadmapView.jsx` (línea 6):**
   - `RoadmapView.jsx` importa `MODULES` directamente de `../data/catalog/modules.js` en lugar de `../data/lessons/index.js`, por lo que las lecciones nuevas siguen mostrando la etiqueta `En preparación` en la vista Ruta hasta que su `status` en `src/data/catalog/modules.js` pase de `'planned'` a `'existing'` (o `RoadmapView.jsx` consulte `LESSONS_BY_ID[lesson.id]`).

---

## Pendiente (con motivo)

- Ningún punto de la ficha quedó pendiente. Los 7 pasos, las 5 lecciones, los 8 términos de glosario, la rúbrica del proyecto, los tests de contenido/copy, las capturas en navegador y la prueba del Tutor IA en las 5 lecciones están completos y verificados.
