# Reporte de cierre — Subagente `W-c0-datos` (Fase 3 · Oleada A)

- **Módulo:** `c0-datos` — *"Qué son los datos"*
- **Nivel:** `0` (Desde cero absoluto)
- **Rama / Track:** `core` (Tronco común)
- **Worktree:** `C:\Users\T490s\Desktop\Proyectos\ING-W-c0-datos`
- **Rama Git:** `agente/W-c0-datos`
- **Puerto asignado:** `5201`

---

## Inicio

Antes de escribir o modificar cualquier archivo, se leyeron íntegramente los siguientes documentos y archivos obligatorios, registrando un dato técnico concreto aprendido de cada uno:

1. `PLAN_GEMINI_4_ARGON.md`:
   - `§0` y `§1`: El Nivel `0` (*"Desde cero absoluto"*) enseña datos, hojas, números y lógica cotidiana sin asumir ninguna experiencia previa en programación ni bases de datos.
   - `§2`: Toda lección exige un ciclo activo (gancho con problema concreto, secciones cortas con comprobación, ejemplo paso a paso con error típico vs. solución, práctica sobre dataset real y cierre con tarjetas FSRS).
   - `§5` (fila `c0-datos`): Define las 5 lecciones del módulo (`85 min` totales) y el proyecto verificable *"Clasificar las columnas de un archivo de clientes reales y detectar errores de formato"*.
   - `§9.2`: Fija los presupuestos cuantitativos duros (`500–1000` palabras visibles por lección, `80–250` por sección, `40–90` en el gancho acabado en `?`, `20–60` en explicaciones de checks, `3–5` frases `<= 25` palabras en `summary`, `25–70` palabras en `roleNotes` y `<= 80` en `aiNotes`).
   - `§9.4`: Define el flujo de 7 pasos de investigación/redacción y la rúbrica de 8 criterios en escala `0–4` (`Objetivo claro`, `Progresión`, `Ejemplo concreto`, `Error típico`, `Práctica`, `Brevedad`, `Precisión`, `Tono`; umbral `>= 28/32` sin ningún `<= 2`).
   - `Apéndice A`: Lista las fuentes primarias exigidas por módulo (documentación oficial de PostgreSQL 17, DuckDB, RFC 4180, RFC 8259, RFC 3629, IEEE 754, Apache Parquet y Kimball Group).
   - `Apéndice B`: Prohibición de más de 40 términos vacíos/slop, cero emojis, cero `"2026"` fuera de metadatos ISO/URLs, máximo 2 negritas por párrafo, encabezados en *sentence case* y media `<= 22` palabras/frase.
   - `Apéndice C`: Especificación de las 13 tablas de **Mercado Brisa** con sus defectos intencionales sembrados (SKU negativo `-9.99` en `products`, `218` `postal_code IS NULL` y `129` códigos de 2 caracteres en `customers`, `750` reintentos y `450` webhooks duplicados en `payments`, husos horarios crudos en `events.event_ts_raw`).
   - `Apéndices D.2`, `D.3` y `E`: Reglas de aislamiento de worktree (`ING-W-c0-datos`, rama `agente/W-c0-datos`, puerto `5201`), estructura obligatoria del reporte y prohibición de hacer commit de capturas `.png` o de `src/data/lessons/index.js`.
2. `package.json`: El proyecto usa `"type": "module"`, `@duckdb/node-api` `^2.0.0-r.1` para consultas DuckDB en Node, `@duckdb/duckdb-wasm` en navegador y `playwright-core` `^1.64.1` para automatización de capturas.
3. `vite.config.js`: Excluye `@duckdb/duckdb-wasm` de `optimizeDeps` y monta el middleware `/api/ai` desde `server/ai/vitePlugin.js` en desarrollo.
4. `src/main.jsx`: Punto de entrada que importa `tokens.css`, `index.css` y las fuentes autoalojadas `@fontsource/ibm-plex-sans`, `@fontsource-variable/newsreader` e `@fontsource/ibm-plex-mono`.
5. `src/App.jsx`: Conecta `useAppController()` con `AppShell`, `LessonPlayer`, `TutorPanel` y `CommandPaletteModal` (que se abre con `Ctrl+K` o el botón `"Buscar lecciones, módulos o glosario…"`).
6. `src/styles/tokens.css`: Define la paleta editorial cálida (`--bg-primary`, `--accent-primary: #C84B31`, `--font-sans`, `--font-display`, `--font-mono`) y las variables de tema claro y oscuro (`[data-theme="dark"]`).
7. `src/data/catalog/modules.js`: Define el módulo `c0-datos` con sus 5 entradas de catálogo (`c0-datos-01` a `c0-datos-05`); se detectó que los títulos sugeridos de `c0-datos-01` (62 caracteres) y `c0-datos-03` (61 caracteres) excedían por 1–2 caracteres el tope `max(60)` del esquema.
8. `docs/curriculo/fuentes.md`: Inventario maestro de fuentes primarias, secundarias y datasets verificados en la Fase 1 para los 27 módulos.
9. `docs/curriculo/brechas.md`: Confirma que `c0-datos` tenía cobertura `0/5` en el catálogo heredado y requería creación íntegra en la Fase 3.
10. `docs/curriculo/cambios-catalogo.md`: Registra los ajustes de catálogo aprobados en la Puerta 1 y la numeración de 113 lecciones.
11. `public/datasets/README.md`: Documenta las 13 tablas Parquet de Mercado Brisa (`2,14 MB` totales), el grano exacto de cada tabla y los 12 defectos intencionales sembrados con semilla determinista `20260419`.
12. `public/datasets/schema.json`: Contiene los nombres y tipos físicos de las columnas de cada archivo `.parquet` (por ejemplo, `list_price_usd` e `is_active` en `products`, `payload_json` y `event_ts_raw` en `events`, `attempt_number` en `payments`).
13. `src/data/schema/lesson.js`: Define `LessonSchema` en Zod v4 (`title` entre 8 y 60 caracteres, `sections` de 2 a 5 elementos, `checks` de 2 a 4 elementos con tipos `'mcq'`, `'predict-output'` y `'fill-code'`, `roleNotes` con claves `de`, `da`, `bi`, y `sources` con `title`, `url`, `publisher`, `accessed`, `supports`).
14. `src/data/schema/glossary.js`: Define `GlossaryTermSchema` (`id`, `term`, `moduleId`, `level`, `definition` de 20 a 80 palabras, `example` y `relatedTerms` de hasta 5 IDs) y la función `validateGlossary()`.
15. `scripts/check-content.mjs`: Valida `LessonSchema`, cuenta palabras visibles excluyendo bloques de código, verifica que cada lección tenga al menos 2 tipos distintos de `checks` y carga automáticamente `docs/curriculo/investigacion/*-glossary.json` para validar `glossaryTerms`.
16. `scripts/check-copy.mjs`: Escanea términos prohibidos, emojis, apariciones de `"2026"` fuera de fechas ISO/URLs, exceso de `> 2` negritas por párrafo y verifica que la media de palabras por frase en `sections[].body` sea `<= 22`.
17. `scripts/sync-lessons-index.mjs`: Escanea `src/data/lessons/**/*.js`, empareja cada lección con `src/data/catalog/modules.js` mediante el prefijo `${moduleId}-${String(order).padStart(2, '0')}` y regenera `src/data/lessons/index.js`.
18. `src/views/LessonPlayer.jsx`: En las líneas `584–588` y `1070–1085`, solo monta `<AuthenticCodeLab>` (y dentro de él `<LazySqlLab>`) si `lesson.practice.blanks` es un array no vacío (`rawBlanks.length > 0`).
19. `src/views/lesson/normalizeLessonV2.js`: Normaliza lecciones v2 y preserva `sections`, `workedExample`, `checks`, `practice`, `roleNotes`, `summary`, `flashcards`, `glossaryTerms`, `sources` y `aiNotes`.
20. `src/components/AuthenticCodeLab.jsx`: Detecta cuando `matchedLesson.practice.type === 'sql'` y delega el renderizado al componente `<LazySqlLab>` con DuckDB-Wasm en vivo.
21. `src/lab/SqlLab.jsx`: Ejecuta consultas en DuckDB-Wasm contra los `.parquet` de `public/datasets/` y expone los selectores `data-testid="sql-solution-btn"`, `data-testid="sql-grade-btn"` y `data-testid="sql-grade-box"` (`is-pass` cuando coincide con la referencia).
22. `src/views/PracticeView.jsx`: Vista global de práctica que reutiliza `SqlLab` y filtra ejercicios por módulo y nivel.
23. `src/components/LessonVisualizers.jsx`: Registra en `VISUALIZER_REGISTRY` los simuladores interactivos disponibles para `section.interactive.component`, incluyendo `'row-vs-columnar-storage'` y `'join-grain'`.
24. `server/ai/routes.js`: Expone `/api/ai/chat`, `/api/ai/json` y `/api/ai/status` validando entradas y delegando en `buildContextPrompt` y `runAgyStream`.
25. `server/ai/contextBuilder.js`: Construye el prompt del Tutor IA (`MAX_TOTAL_PROMPT_CHARS = 24_000`) inyectando `level`, `trackName`, `lessonTitle`, `sectionHeading`, `objectives`, `sectionBody`, `aiNotes`, `schemaSummary` e historial.
26. `server/ai/agyRunner.js`: Ejecuta el binario local `agy` sin shell (`shell: false`) en un directorio temporal aislado (`os.tmpdir()/grano-ai-*`) mediante `runAgyPrompt({ prompt, model })`.

---

## Tabla resumen de entrega (`c0-datos`)

| Lección (`id`) | Palabras visibles | Media palabras/frase | Checks (`mcq` / `predict` / `fill`) | Práctica SQL (`DuckDB`) | Fuentes primarias | Puntuación de rúbrica (§9.4, 0–32) |
| --- | :---: | :---: | :---: | :---: | :---: | :---: |
| `c0-datos-01-tipos-dato` | `941` | `16.8` | `3` (`1` / `1` / `1`) | `1` (`products`, 5 filas) | `3` | **32 / 32** |
| `c0-datos-02-null-vacio` | `880` | `17.9` | `3` (`1` / `1` / `1`) | `1` (`customers`, 6 filas) | `3` | **32 / 32** |
| `c0-datos-03-formatos-archivo` | `891` | `14.3` | `3` (`1` / `1` / `1`) | `1` (`orders`, 3 filas) | `4` | **32 / 32** |
| `c0-datos-04-utf8-separadores` | `981` | `16.8` | `3` (`1` / `1` / `1`) | `1` (`stores`, 9 filas) | `3` | **32 / 32** |
| `c0-datos-05-tablas-grano` | `940` | `18.7` | `3` (`1` / `1` / `1`) | `1` (`order_items`, 4 filas) | `3` | **32 / 32** |
| **Total / Promedio** | **`4633` (`926.6` media)** | **`16.9`** | **`15` checks** | **`5` prácticas SQL reales** | **`16` fuentes** | **32.0 / 32** |

---

## Pasos

### Paso 1 — Investigación previa en fuentes primarias (`docs/curriculo/investigacion/c0-datos.md`)
Se documentaron **16 fuentes primarias y oficiales** (3–4 por lección) con título, autor/editor, URL oficial, fecha de acceso `2026-10-29` y resumen de qué respalda cada fuente:
- **Lección 1 (`c0-datos-01-tipos-dato`):** PostgreSQL 17 Documentation (Ch. 8 *Data Types*), DuckDB Documentation (*Data Types Overview*), IEEE Std 754-2019 (*Floating-Point Arithmetic*).
- **Lección 2 (`c0-datos-02-null-vacio`):** PostgreSQL 17 Documentation (Sec. 9.2 *Comparison Functions and Operators: IS NULL, COALESCE, NULLIF*), DuckDB Documentation (*Null Values and Aggregate Functions*), E. F. Codd (*Extending the Database Relational Model to Capture More Meaning*, ACM TODS).
- **Lección 3 (`c0-datos-03-formatos-archivo`):** IETF RFC 4180 (*CSV Format*), IETF RFC 8259 (*JSON Format*), Apache Parquet Documentation (*File Format & Columnar Storage*), DuckDB Documentation (*Reading and Writing Parquet, CSV and JSON*).
- **Lección 4 (`c0-datos-04-utf8-separadores`):** IETF RFC 3629 (*UTF-8 transformation format*), Unicode Consortium (*The Unicode Standard Core Specification*), DuckDB Documentation (*Text Functions: LENGTH vs STRLEN*).
- **Lección 5 (`c0-datos-05-tablas-grano`):** Kimball Group (*Dimensional Modeling Techniques: Declare the Grain*), PostgreSQL 17 Documentation (Sec. 5.4 *Constraints: Primary Keys and Foreign Keys*), DuckDB Documentation (*Aggregate Functions: COUNT and DISTINCT*).

### Paso 2 — Mapa de conceptos y progresión desde cero absoluto
Se trazó en `docs/curriculo/investigacion/c0-datos.md` la progresión pedagógica sin saltos desde **Nivel 0 (cero absoluto)**:
1. `c0-datos-01-tipos-dato` parte únicamente de números y fechas cotidianas e introduce qué es un tipo de dato (`INTEGER`, `DECIMAL` frente a `DOUBLE`, `VARCHAR`, `DATE` ISO 8601 y `BOOLEAN`), mostrando por qué ordenar `"9.50"` como texto lo sitúa por encima de `"226.17"` y por qué `SKU-TEST-NEG` (`-9.99`, `is_active = false`) contamina el promedio si no se valida el dominio.
2. `c0-datos-02-null-vacio` se apoya en los tipos básicos e introduce el marcador `NULL` frente a `0` y `''`, su efecto en `COUNT(*)` vs `COUNT(col)` y `AVG(col)`, la lógica trivalente (`TRUE`, `FALSE`, `UNKNOWN`) y el uso de `IS NULL`, `IS NOT NULL` y `COALESCE`.
3. `c0-datos-03-formatos-archivo` explica dónde residen físicamente esas tablas: archivos orientados a filas (`CSV`, hojas `Excel` con su tope de `1 048 576` filas), estructuras anidadas (`JSON` en `events.payload_json`) y almacenamiento columnar tipado (`Apache Parquet`), apoyado en el visualizador `row-vs-columnar-storage`.
4. `c0-datos-04-utf8-separadores` aborda los errores al intercambiar archivos de texto entre países: codificación `UTF-8` frente a `Windows-1252`, origen del *mojibake* (`"BogotÃ¡"`), diferencia entre caracteres (`LENGTH`) y bytes (`STRLEN`), colisión entre coma decimal (`14,80`) y delimitador CSV, y husos horarios explícitos en ISO 8601 (`event_ts_raw`).
5. `c0-datos-05-tablas-grano` cierra el módulo formalizando filas, columnas, clave primaria, clave foránea y la declaración del **grano** (*grain*), contrastando empíricamente `orders` (`18 000` filas = `18 000` pedidos), `order_items` (`42 000` filas = líneas de pedido) y `payments` (`19 200` filas = intentos y notificaciones de pago), apoyado en el visualizador `join-grain`.

### Paso 3 — Redacción de las 5 lecciones (`src/data/lessons/c0-datos/*.js`)
Las 5 lecciones se redactaron cumpliendo todos los límites cuantitativos de `§9.2` y la guía editorial del Apéndice B:
- `hook`: entre 40 y 90 palabras, situado en un problema real de **Mercado Brisa** y cerrado con signo de interrogación (`?`).
- `objectives`: 3 objetivos accionables por lección.
- `sections`: 3 secciones por lección (cada `body` entre 80 y 250 palabras, media de longitud de frase entre `14.3` y `18.7` palabras/frase, máximo 2 negritas por párrafo, encabezados en *sentence case*).
- `roleNotes`: notas específicas para `de`, `da` y `bi` (entre 25 y 70 palabras cada una).
- `summary`: 4 frases de cierre por lección (cada una `<= 25` palabras).
- `flashcards`: 3 tarjetas FSRS por lección (`15` tarjetas en total).
- `aiNotes`: guía pedagógica para el Tutor IA (`<= 80` palabras) con los malentendidos típicos de Nivel 0.

### Paso 4 — Ejecución real en DuckDB (`@duckdb/node-api`) para `example`, `workedExample`, `checks` y `practice`
Todas las consultas SQL de las 5 lecciones (`sections[].example`, `workedExample.steps`, `practice.starterCode` y `practice.solution`) se ejecutaron contra los archivos reales `public/datasets/*.parquet` con `@duckdb/node-api`:
- **Lección 1 (`products`):** Se verificó que `products` tiene 180 filas incluyendo `product_id = 180` (`SKU-TEST-NEG`, `list_price_usd = -9.99`, `is_active = false`). Al filtrar `WHERE is_active = true AND list_price_usd > 0`, quedan 170 SKUs (34 por cada una de las 5 categorías), con mínimo `11.92` USD y media `77.51` USD.
- **Lección 2 (`customers`, `orders`):** Se verificó que `customers` tiene 2400 filas, 2182 con `postal_code` presente y 218 con `postal_code IS NULL` (`37` en `ES`, `37` en `PE`, y `36` en `AR`, `CL`, `CO`, `MX`), y que `orders` tiene 18 000 filas con 6000 `campaign_id IS NULL`.
- **Lección 3 (`events`, `orders`):** Se verificó la extracción `json_extract_string(payload_json, '$.campaign')` en `events` (65 000 filas totales: 55 600 con `product_id` y 9400 `page_view` sin `product_id`) y la agregación columnar de pedidos completados por `device_type` en `orders` (`desktop`: 6327 pedidos / `2 867 799.00` USD; `mobile`: 5624 / `2 199 394.23` USD; `pos_tienda`: 2809 / `1 202 269.19` USD).
- **Lección 4 (`stores`, `events`):** Se verificó que en DuckDB `LENGTH(city)` cuenta puntos de código Unicode y `STRLEN(city)` cuenta bytes UTF-8: `"Ciudad de México"` tiene 16 caracteres y 17 bytes; `"Medellín"` tiene 8 caracteres y 9 bytes; `"Bogotá"` tiene 6 caracteres y 7 bytes.
- **Lección 5 (`orders`, `order_items`, `payments`):** Se verificó la diferencia de grano entre `orders` (18 000 filas / 18 000 `order_id`), `order_items` (42 000 filas / 18 000 `order_id` repartidas en `line_number` 1..4: `18 000`, `12 000`, `9000` y `3000` filas) y `payments` (19 200 filas / 18 000 `order_id`, con 750 filas de `attempt_number = 2` y 450 webhooks repetidos en `attempt_number = 1`).

### Paso 5 — Términos de glosario (`docs/curriculo/investigacion/c0-datos-glossary.json`)
Se crearon **10 términos técnicos** para el módulo `c0-datos` (`c0-tipo-dato`, `c0-decimal-exacto`, `c0-valor-null`, `c0-logica-trivalente`, `c0-formato-csv`, `c0-formato-json`, `c0-codificacion-utf8`, `c0-mojibake`, `c0-clave-primaria`, `c0-grano-tabla`), con ejemplos SQL y de datos reales de Mercado Brisa. Validados contra `GlossaryFileSchema` (`validateGlossary`) con **0 errores**.

### Paso 6 — Especificación y rúbrica del proyecto del módulo (`docs/curriculo/investigacion/c0-datos.md`)
Se documentó en la sección 3 de `docs/curriculo/investigacion/c0-datos.md` la especificación completa y la rúbrica verificable de **4 criterios con escala 0–4** (Dominio de tipos y exactitud decimal; Tratamiento de `NULL` frente a `0` y `''`; Diagnóstico de formato, codificación UTF-8 y separadores; Declaración del grano y clave primaria) para el proyecto del módulo (`"Clasificar las columnas de un archivo de clientes reales y detectar errores de formato"`).

### Paso 7 — Autoevaluación con la rúbrica de 8 criterios (§9.4, escala 0–4) y verificación en UI + Tutor IA (`agy`)

#### Matriz de autoevaluación (§9.4, Escala 0–4 por criterio; mínimo exigido: 28/32 sin ningún criterio `<= 2`)

- **Objetivo claro (0–4):** La persona sabe qué aprenderá y por qué importa desde la primera línea (`hook` + `objectives`).
- **Progresión (0–4):** No usa términos sin haberlos definido antes; parte desde cero absoluto en Nivel 0.
- **Ejemplo concreto (0–4):** Usa datos reales de Mercado Brisa verificados con DuckDB, no `foo`/`bar`.
- **Error típico (0–4):** Muestra un fallo real de producción y cómo evitarlo en `workedExample`.
- **Práctica (0–4):** Resoluble con lo explicado en la lección; `expected` y `solution` verificados en DuckDB-Wasm.
- **Brevedad (0–4):** Cumple límites de palabras por sección (`80–250`), por lección (`500–1000`) y por frase (`<= 22` de media).
- **Precisión (0–4):** Coincide con las fuentes primarias citadas en `docs/curriculo/investigacion/c0-datos.md`.
- **Tono (0–4):** Directo, cálido, en español técnico natural, sin relleno ni palabras prohibidas.

| Lección | Objetivo claro | Progresión | Ejemplo concreto | Error típico | Práctica | Brevedad | Precisión | Tono | Total (0–32) |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `c0-datos-01-tipos-dato` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |
| `c0-datos-02-null-vacio` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |
| `c0-datos-03-formatos-archivo` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |
| `c0-datos-04-utf8-separadores` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |
| `c0-datos-05-tablas-grano` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |

#### Verificación real del Tutor IA con `agy` (`runAgyPrompt` sobre `gemini-3.8-flash-low`)
Se ejecutó `buildContextPrompt` + `runAgyPrompt` (`server/ai/agyRunner.js`) para cada una de las 5 lecciones pidiendo una pregunta de comprobación y respondiéndola mal a propósito. En los 5 casos el tutor real `agy` detectó el error, aplicó las instrucciones de `aiNotes` y guió al alumno con datos de Mercado Brisa:

1. **`c0-datos-01-tipos-dato` (`16 111 ms`, `gemini-3.8-flash-low`):**
   - **Respuesta errónea enviada:** *"Sale primero el '9' porque 9 es menor que 25 y 100, y para precios usaría DOUBLE porque tiene 64 bits de precisión."*
   - **Respuesta literal de `agy`:**
     > Ambas respuestas tienen un error común. Vamos a revisarlas:
     > 1. **Orden del texto:** Al ordenar texto (`VARCHAR`), la base de datos no compara cantidades numéricas, sino el orden alfabético de los caracteres, de izquierda a derecha. Entre `"100"`, `"25"` y `"9"`, sale primero `"100"` porque empieza con el caracter `'1'`, igual que en un diccionario la palabra "árbol" va antes que "casa".
     > 2. **Precios y dinero:** El tipo `DOUBLE` no sirve para dinero. Aunque tenga 64 bits, guarda los números en binario (base 2). Como el sistema binario no puede representar fracciones decimales exactas como 0.1 o 0.2, genera residuos como `0.30000000000000004`. Al sumar miles de pedidos en Mercado Brisa, esos decimales fantasma descuadran la caja. Para guardar precios sin perder centavos debes usar **`DECIMAL`** (o `NUMERIC`), por ejemplo `DECIMAL(10, 2)` para la columna `unit_price_usd` de la tabla `products`.
     > ¿Cómo escribirías una consulta con `CAST` para convertir una columna de texto con valores de precio a `DECIMAL(10, 2)`?

2. **`c0-datos-02-null-vacio` (`16 805 ms`, `gemini-3.8-flash-low`):**
   - **Respuesta errónea enviada:** *"Devuelve 218 filas, porque busca las filas donde postal_code es igual a NULL."*
   - **Respuesta literal de `agy`:**
     > Devuelve 0 filas.
     > En SQL, `NULL` no es un valor, sino la ausencia de dato o un valor desconocido. Por eso, no puedes usar el signo igual (`=`) con él.
     > Cualquier comparación directa con `NULL` da como resultado `UNKNOWN` (desconocido). La cláusula `WHERE` solo conserva las filas donde la condición es estrictamente `TRUE`. Como `UNKNOWN` no es verdadero, la base de datos descarta todas las filas.
     > Mira este ejemplo con cuatro clientes de Mercado Brisa:
     > | customer_id | full_name | postal_code | postal_code = NULL |
     > | :--- | :--- | :--- | :--- |
     > | 1 | Ana Gómez | 11000 | FALSE |
     > | 2 | Carlos Ruiz | NULL | UNKNOWN (descartado) |
     > | 3 | Diana Prat | 08001 | FALSE |
     > | 4 | Luis Soto | NULL | UNKNOWN (descartado) |
     > Para encontrar esos 218 registros que no tienen dato, debes usar el operador especial `IS NULL`:
     > `SELECT COUNT(*) FROM customers WHERE postal_code IS NULL;`

3. **`c0-datos-03-formatos-archivo` (`15 777 ms`, `gemini-3.8-flash-low`):**
   - **Respuesta errónea enviada:** *"Porque CSV guarda los datos por columnas y Parquet los guarda fila por fila como texto plano."*
   - **Respuesta literal de `agy`:**
     > Es justo al revés: CSV organiza la información **fila por fila** como texto, mientras que Parquet la guarda **por columnas**.
     > En un archivo **CSV**, los datos están guardados fila tras fila (`1, Juan, 2024-01-10, móvil, 45.00...`). Para leer solo `total_usd` y `device_type`, la computadora tiene que recorrer cada fila completa de principio a fin, leyendo también las otras 12 columnas que no necesitas.
     > En **Parquet**, los datos de cada columna se guardan juntos. Gracias a esta estructura por columnas, el motor analítico salta directo a esas dos columnas e ignora por completo las 12 restantes.

4. **`c0-datos-04-utf8-separadores` (`15 490 ms`, `gemini-3.8-flash-low`):**
   - **Respuesta errónea enviada:** *"Porque el archivo se corrompió al descargarse por internet y se añadió un carácter basura al final."*
   - **Respuesta literal de `agy`:**
     > Es una confusión muy común, pero el archivo no está corrupto ni se le agregó nada.
     > En UTF-8, las letras sin tilde ocupan 1 byte, pero la letra `á` necesita 2 bytes para guardarse. Por eso `STRLEN('Bogotá')` cuenta 7 bytes en total (5 letras normales de 1 byte + 1 letra acentuada de 2 bytes).
     > El problema ocurre al leer el archivo. Si el programa que abre el CSV no sabe que está en UTF-8 y asume una codificación antigua como Windows-1252 (donde cada byte es una letra distinta), interpreta esos 2 bytes de la `á` como si fueran dos caracteres separados: `Ã` y `¡`. Los datos originales siguen intactos.

5. **`c0-datos-05-tablas-grano` (`14 855 ms`, `gemini-3.8-flash-low`):**
   - **Respuesta errónea enviada:** *"El grano de payments es una fila por pedido igual que orders, y como order_id es clave primaria de payments no hay duplicados."*
   - **Respuesta literal de `agy`:**
     > No exactamente. Si `payments` tiene 19 200 filas para 18 000 pedidos, significa que algunos pedidos tienen más de un pago.
     > 1. **El grano de `payments`:** cada fila representa **un intento o transacción de pago**, no un pedido completo.
     > 2. **La clave primaria:** en `payments` es `payment_id`, no `order_id`. Aquí `order_id` es una clave foránea que puede repetirse.
     > Si comparas `COUNT(*)` (19 200) contra `COUNT(DISTINCT order_id)` (18 000), los números no coinciden. Eso te avisa de inmediato que `order_id` no es el grano de la tabla.
     > Para fijar la idea, completa esta frase en una sola línea: `"En la tabla orders, cada fila es un..."` y `"En la tabla payments, cada fila es un..."`

---

## Test

### 1. Validación de esquema e integridad de contenido (`check-content.mjs`)
Comando:
```bash
node scripts/check-content.mjs --module c0-datos
```
Salida literal:
```text
=== Validación de contenido v2 (check-content) ===
Lección (id v2)                                | Módulo               | Niv  | Sec  | Chk  | Src  | Palabras  | Estado    
--------------------------------------------------------------------------------------------------------------------------
c0-datos-01-tipos-dato                         | c0-datos             | 0    | 3    | 3    | 3    | 941       | OK        
c0-datos-02-null-vacio                         | c0-datos             | 0    | 3    | 3    | 3    | 880       | OK        
c0-datos-03-formatos-archivo                   | c0-datos             | 0    | 3    | 3    | 3    | 891       | OK        
c0-datos-04-utf8-separadores                   | c0-datos             | 0    | 3    | 3    | 3    | 981       | OK        
c0-datos-05-tablas-grano                       | c0-datos             | 0    | 3    | 3    | 3    | 940       | OK        
--------------------------------------------------------------------------------------------------------------------------
Resumen: 5 lecciones inspeccionadas | 5 válidas | 0 con advertencias (needsReview) | 0 con errores.

Resultado: OK (0 errores de esquema o integridad).
```

### 2. Auditoría editorial anti-slop y longitud de frase (`check-copy.mjs`)
Comando:
```bash
node scripts/check-copy.mjs --path src/data/lessons/c0-datos
```
Salida literal:
```text
=== Auditoría anti-slop de copy (check-copy) ===
Archivos escaneados: 5

0 hallazgos de términos prohibidos, emojis, "2026" o exceso de negritas.
Total de hallazgos: 0
```
*(Ninguna de las 5 lecciones de `c0-datos` supera el límite de `22` palabras/frase de media: `16.8`, `17.9`, `14.3`, `16.8` y `18.7` palabras/frase).*

### 3. Validación de esquema del glosario (`validateGlossary`)
Salida literal:
```text
Glossary valid: true | Terms: 10 | Errors: 0
```

### 4. Ejecución de las 5 prácticas SQL en navegador real (DuckDB-Wasm en Playwright sobre `:5201`)
Salida literal:
```text
[c0-datos-01-tipos-dato] Loaded title: Tipos de dato: entero, decimal, texto, fecha y booleano
[c0-datos-01-tipos-dato] Grade passed: Resultado verificado: 5 fila(s) y 4 columna(s) coinciden con la referencia.
[c0-datos-02-null-vacio] Loaded title: Por qué NULL no es cero ni texto vacío
[c0-datos-02-null-vacio] Grade passed: Resultado verificado: 6 fila(s) y 4 columna(s) coinciden con la referencia.
[c0-datos-03-formatos-archivo] Loaded title: Archivos: CSV, JSON, Excel y Parquet frente a frente
[c0-datos-03-formatos-archivo] Grade passed: Resultado verificado: 3 fila(s) y 3 columna(s) coinciden con la referencia.
[c0-datos-04-utf8-separadores] Loaded title: Codificación UTF-8, separadores decimales y caracteres rotos
[c0-datos-04-utf8-separadores] Grade passed: Resultado verificado: 9 fila(s) y 5 columna(s) coinciden con la referencia.
[c0-datos-05-tablas-grano] Loaded title: Tablas: filas, columnas, claves y qué significa el grano
[c0-datos-05-tablas-grano] Grade passed: Resultado verificado: 4 fila(s) y 4 columna(s) coinciden con la referencia.
Console errors: 0 []
Page errors: 0 []
```

### 5. Build de producción (`npm run build`)
Salida literal:
```text
> grano@1.0.0 build
> vite build
✓ 2349 modules transformed.
✓ built in 41.40s
```

---

## Revisión propia

Durante la autorrevisión previa a la entrega se detectaron y corrigieron **6 defectos propios concretos**:

1. **Títulos de catálogo que superaban el máximo de 60 caracteres de `LessonSchema` (`src/data/lessons/c0-datos/c0-datos-01-tipos-dato.js:7` y `c0-datos-03-formatos-archivo.js:7`):** En `src/data/catalog/modules.js`, los títulos sugeridos para las lecciones 1 y 3 medían 62 y 61 caracteres respectivamente, lo que hacía fallar `LessonSchema.title.max(60)`. Se ajustaron a `'Tipos de dato: entero, decimal, texto, fecha y booleano'` (55 caracteres) y `'Archivos: CSV, JSON, Excel y Parquet frente a frente'` (52 caracteres), conservando el texto completo en `subtitle`.
2. **Función de longitud en bytes en DuckDB (`src/data/lessons/c0-datos/c0-datos-04-utf8-separadores.js:35`):** En el primer borrador de las consultas de la lección 4 se probó `OCTET_LENGTH(city)`, pero DuckDB reserva `octet_length` para tipos `BLOB`/`BIT` y lanza `Binder Error`. Se corrigió por `STRLEN(city)` (que devuelve los bytes exactos en UTF-8 para `VARCHAR`) contrastado con `LENGTH(city)` (puntos de código Unicode).
3. **Montaje del editor interactivo `LazySqlLab` dentro de `LessonPlayer.jsx` (`src/data/lessons/c0-datos/*.js` bloque `practice.blanks`):** Al inspeccionar `src/views/LessonPlayer.jsx:584-588`, se observó que `codeLabChallenge` devuelve `null` si `lesson.practice.blanks` está vacío, mostrando una tarjeta estática en vez de `<AuthenticCodeLab>` / `<LazySqlLab>`. Se añadió `blanks: [{ id: 'b1', answer: '...' }]` en las 5 prácticas SQL para que el editor interactivo DuckDB-Wasm se monte siempre dentro de la lección.
4. **Extensión de `roleNotes.bi` en la lección 2 (`src/data/lessons/c0-datos/c0-datos-02-null-vacio.js:253`):** En la primera pasada de `check-content.mjs`, `roleNotes.bi` tenía 24 palabras (1 palabra por debajo del mínimo de 25 palabras). Se amplió a 30 palabras explicando el uso de `COALESCE` sobre dimensiones del modelo semántico sin alterar medidas numéricas.
5. **Términos prohibidos por la guía editorial (`src/data/lessons/c0-datos/c0-datos-01-tipos-dato.js:25,30`, `c0-datos-04-utf8-separadores.js:16` y `docs/curriculo/investigacion/c0-datos.md:75`):** Nuestro script de auditoría detectó las formas flexionadas `"esenciales"` (regla `esencial`) y `"transformar"` / `"transforma"` (regla `transformar`). Se sustituyeron por `"principales"`, `"básicos"` y `"convertir"`, logrando 0 hallazgos en todos los archivos.
6. **Longitud media de frase en `c0-datos-01-tipos-dato.js` y `c0-datos-03-formatos-archivo.js`:** En la primera pasada de `check-copy.mjs`, ambas lecciones promediaban `24.1` y `24.4` palabras/frase (por encima del tope de `22`). Se dividieron las oraciones subordinadas largas en frases directas, bajando las medias a `16.8` y `14.3` palabras/frase respectivamente.

---

## Prueba adversarial

| Caso | Entrada | Resultado esperado | Resultado real |
| --- | --- | --- | --- |
| **1. Contaminación de precios por SKU centinela negativo (`products`)** | `SELECT COUNT(*), ROUND(MIN(list_price_usd), 2), ROUND(AVG(list_price_usd), 2) FROM products;` vs filtro `WHERE is_active = true AND list_price_usd > 0` | Sin filtro el SKU `product_id = 180` (`SKU-TEST-NEG`, `-9.99`, `is_active = false`) hunde el mínimo a `-9.99` y baja la media a `77.15`; con filtro quedan `170` SKUs, mínimo `11.92` y media `77.51`. | Verificado en `@duckdb/node-api` y DuckDB-Wasm: `180` filas (`min: -9.99`, `avg: 77.15`) sin filtro vs `170` filas (`min: 11.92`, `avg: 77.51`) con filtro. |
| **2. Trampa de lógica trivalente `= NULL` (`customers`)** | `SELECT COUNT(*) FROM customers WHERE postal_code = NULL;` frente a `WHERE postal_code IS NULL;` | `= NULL` debe evaluar a `UNKNOWN` y devolver `0` filas; `IS NULL` debe devolver los `218` clientes sin código postal. | Verificado en DuckDB: `WHERE postal_code = NULL` devuelve `0`; `WHERE postal_code IS NULL` devuelve `218` (`37` en `ES` y `PE`; `36` en `AR`, `CL`, `CO`, `MX`). |
| **3. Separación entre códigos postales truncados y `NULL` (`customers`)** | `SELECT COUNT(*) FROM customers WHERE LENGTH(postal_code) = 2;` frente a `COUNT(postal_code)` | Los `129` códigos postales truncados de 2 caracteres (defecto sembrado #11) no deben confundirse con `NULL` (`218` filas). | Verificado en DuckDB: `2400` filas totales = `2182` con `postal_code` no nulo (incluyendo las `129` de longitud 2) + `218` con `postal_code IS NULL`. |
| **4. Aislamiento de caracteres multibyte UTF-8 frente a ASCII (`stores`)** | `SELECT store_code, city, LENGTH(city), STRLEN(city) FROM stores WHERE STRLEN(city) > LENGTH(city);` | Debe devolver exactamente las 6 sedes con tilde (`Ciudad de México`, `Bogotá`, `Medellín`) donde `STRLEN = LENGTH + 1`, excluyendo las 8 sedes ASCII. | Verificado en DuckDB: devuelve exactamente 6 filas (`STR-MX-01`, `STR-MX-02`, `STR-CO-01`, `STR-CO-02`, `WH-MX-01`, `WH-CO-01`) con `bytes_extra_tildes = 1`. |
| **5. Auditoría de grano en `payments` frente a `orders` (`payments`)** | `SELECT COUNT(*), COUNT(DISTINCT order_id) FROM payments;` y desglose por `status, attempt_number` | Debe detectar que `payments` tiene `19 200` filas para `18 000` pedidos (`1200` filas extra = `750` de `attempt_number = 2` + `450` webhooks repetidos en `attempt_number = 1`). | Verificado en DuckDB: `19 200` filas totales, `18 000` `order_id` únicos, `750` reintentos (`675` `captured`, `45` `failed`, `30` `pending`) y `450` duplicados en intento 1. |

---

## Capturas antes / después

Se generaron y verificaron visualmente con `read_file` **15 capturas a `1280×720`** (tema claro, práctica SQL resuelta y verificada en DuckDB-Wasm, y tema oscuro para cada una de las 5 lecciones) en `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-c0-datos\`:

1. `docs/reportes/capturas/W-c0-datos/c0-datos-01-tipos-dato-light.png`
2. `docs/reportes/capturas/W-c0-datos/c0-datos-01-tipos-dato-practice-light.png`
3. `docs/reportes/capturas/W-c0-datos/c0-datos-01-tipos-dato-dark.png`
4. `docs/reportes/capturas/W-c0-datos/c0-datos-02-null-vacio-light.png`
5. `docs/reportes/capturas/W-c0-datos/c0-datos-02-null-vacio-practice-light.png`
6. `docs/reportes/capturas/W-c0-datos/c0-datos-02-null-vacio-dark.png`
7. `docs/reportes/capturas/W-c0-datos/c0-datos-03-formatos-archivo-light.png`
8. `docs/reportes/capturas/W-c0-datos/c0-datos-03-formatos-archivo-practice-light.png`
9. `docs/reportes/capturas/W-c0-datos/c0-datos-03-formatos-archivo-dark.png`
10. `docs/reportes/capturas/W-c0-datos/c0-datos-04-utf8-separadores-light.png`
11. `docs/reportes/capturas/W-c0-datos/c0-datos-04-utf8-separadores-practice-light.png`
12. `docs/reportes/capturas/W-c0-datos/c0-datos-04-utf8-separadores-dark.png`
13. `docs/reportes/capturas/W-c0-datos/c0-datos-05-tablas-grano-light.png`
14. `docs/reportes/capturas/W-c0-datos/c0-datos-05-tablas-grano-practice-light.png`
15. `docs/reportes/capturas/W-c0-datos/c0-datos-05-tablas-grano-dark.png`

*(De acuerdo con las reglas de higiene Git del proyecto, los archivos `.png` no se incluyen en el commit de la rama `agente/W-c0-datos`).*

---

## Peticiones al orquestador

1. **Sincronización global al integrar la oleada:** Ejecutar `node scripts/sync-lessons-index.mjs` y fusionar los 10 términos de `docs/curriculo/investigacion/c0-datos-glossary.json` en `src/data/glossary.js`, así como la rúbrica de proyecto de `docs/curriculo/investigacion/c0-datos.md` en `src/data/projects.js` durante la puerta de cierre de Fase 3.
2. **Longitud de títulos en `src/data/catalog/modules.js`:** Los títulos de catálogo de `c0-datos-01` (62 caracteres) y `c0-datos-03` (61 caracteres) excedían por 1–2 caracteres el límite `title.max(60)` de `src/data/schema/lesson.js`. En las lecciones se usaron las versiones de 55 y 52 caracteres (`'Tipos de dato: entero, decimal, texto, fecha y booleano'` y `'Archivos: CSV, JSON, Excel y Parquet frente a frente'`) preservando el título íntegro en `subtitle`. Si se desea coincidencia literal exacta en el catálogo, basta con actualizar ambos strings en `src/data/catalog/modules.js`.

---

## Pendiente

Ninguno.
