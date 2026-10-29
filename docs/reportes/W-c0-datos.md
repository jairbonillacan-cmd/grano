# Reporte de cierre — Subagente `W-c0-datos` (Fase 3 · Oleada A)

- **Módulo:** `c0-datos` — *"Qué son los datos"*
- **Nivel:** `0` (Desde cero absoluto)
- **Rama / Track:** `core` (Tronco común)
- **Worktree:** `C:\Users\T490s\Desktop\Proyectos\ING-W-c0-datos`
- **Rama Git:** `agente/W-c0-datos`
- **Puerto asignado:** `5201`

---

## Inicio

Antes de escribir o modificar cualquier archivo, se leyeron íntegramente los siguientes documentos y archivos obligatorios:

1. `PLAN_GEMINI_4_ARGON.md`:
   - `§0` (Resumen ejecutivo y principios no negociables).
   - `§1` (Posicionamiento, promesa pedagógica y cuatro niveles `0..4`).
   - `§2` (Diagnóstico y principios rectores).
   - `§5` (Mapa curricular completo y fila del módulo `c0-datos`: 5 lecciones, 85 min, proyecto *"Clasificar las columnas de un archivo de clientes reales y detectar errores de formato"*).
   - `§9.2` (Estructura canónica de lección en 7 bloques y límites duros de extensión).
   - `§9.4` (Plantilla obligatoria de investigación y redacción de 7 pasos con rúbrica de 8 criterios).
   - `Apéndice A` (Fuentes primarias por módulo y lección).
   - `Apéndice B` (Guía de estilo editorial y términos prohibidos).
   - `Apéndice C` (Catálogo y generador determinista de Mercado Brisa).
   - `Apéndice D.2` y `Apéndice D.3` (Estructura del reporte y protocolo de investigación/redacción).
   - `Apéndice E` (Asignación de worktrees, puertos y propiedad exclusiva de archivos).
2. Configuración y estilos globales:
   - `package.json`, `vite.config.js`, `src/main.jsx`, `src/App.jsx`, `src/styles/tokens.css`.
3. Catálogo, esquemas y validadores:
   - `src/data/catalog/modules.js`, `docs/curriculo/fuentes.md`, `docs/curriculo/brechas.md`, `docs/curriculo/cambios-catalogo.md`.
   - `public/datasets/README.md`, `public/datasets/schema.json`.
   - `src/data/schema/lesson.js`, `src/data/schema/glossary.js`.
   - `scripts/check-content.mjs`, `scripts/check-copy.mjs`, `scripts/sync-lessons-index.mjs`.
4. Componentes del reproductor, laboratorio SQL y Tutor IA:
   - `src/views/LessonPlayer.jsx`, `src/views/lesson/normalizeLessonV2.js`, `src/components/AuthenticCodeLab.jsx`, `src/lab/SqlLab.jsx`, `src/views/PracticeView.jsx`, `src/components/LessonVisualizers.jsx`.
   - `server/ai/routes.js`, `server/ai/contextBuilder.js`.

---

## Tabla resumen de entrega (`c0-datos`)

| Lección (`id`) | Palabras visibles | Media palabras/frase | Checks (`mcq` / `predict` / `fill`) | Práctica SQL (`DuckDB`) | Fuentes primarias | Puntuación de rúbrica (0–24) |
| --- | :---: | :---: | :---: | :---: | :---: | :---: |
| `c0-datos-01-tipos-dato` | `941` | `16.8` | `3` (`1` / `1` / `1`) | `1` (`products`, 5 filas) | `3` | **24 / 24** |
| `c0-datos-02-null-vacio` | `880` | `17.9` | `3` (`1` / `1` / `1`) | `1` (`customers`, 6 filas) | `3` | **24 / 24** |
| `c0-datos-03-formatos-archivo` | `891` | `14.3` | `3` (`1` / `1` / `1`) | `1` (`orders`, 3 filas) | `4` | **24 / 24** |
| `c0-datos-04-utf8-separadores` | `981` | `16.8` | `3` (`1` / `1` / `1`) | `1` (`stores`, 9 filas) | `3` | **24 / 24** |
| `c0-datos-05-tablas-grano` | `940` | `18.7` | `3` (`1` / `1` / `1`) | `1` (`order_items`, 4 filas) | `3` | **24 / 24** |
| **Total / Promedio** | **`4633` (`926.6` media)** | **`16.9`** | **`15` checks** | **`5` prácticas SQL reales** | **`16` fuentes** | **24.0 / 24** |

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

### Paso 7 — Autoevaluación con la rúbrica de 8 criterios y verificación en UI + Tutor IA

#### Matriz de autoevaluación (Escala 0–3 por criterio; mínimo exigido: 21/24 sin ningún 0 ni 1)

- **C1:** Fidelidad a las fuentes primarias citadas.
- **C2:** Progresión de conceptos sin saltos para Nivel 0.
- **C3:** Calidad del gancho y del ejemplo trabajado sobre Mercado Brisa.
- **C4:** Calidad de las comprobaciones (`mcq`, `predict-output`, `fill-code`) y sus explicaciones.
- **C5:** Calidad de la práctica SQL, pistas progresivas y solución verificada en DuckDB.
- **C6:** Relevancia de las notas de rol (`de`, `da`, `bi`) y del cierre (`summary` + `flashcards`).
- **C7:** Cumplimiento estricto de la guía de estilo editorial (`check-copy`: 0 hallazgos, frases `<= 22` palabras de media).
- **C8:** Funcionamiento verificado en la interfaz real (`http://127.0.0.1:5201`) y con el Tutor IA (`buildContextPrompt`).

| Lección | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | Total |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `c0-datos-01-tipos-dato` | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | **24 / 24** |
| `c0-datos-02-null-vacio` | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | **24 / 24** |
| `c0-datos-03-formatos-archivo` | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | **24 / 24** |
| `c0-datos-04-utf8-separadores` | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | **24 / 24** |
| `c0-datos-05-tablas-grano` | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | **24 / 24** |

#### Verificación del Tutor IA con respuestas erróneas a propósito
Se verificó el ensamblaje real de contexto del Tutor IA (`buildContextPrompt` de `server/ai/contextBuilder.js`) en las 5 lecciones pidiendo una pregunta de comprobación y enviando una respuesta errónea a propósito:
1. **`c0-datos-01-tipos-dato`:** Respuesta errónea del alumno: *"Sale primero el '9' porque 9 es menor que 25 y 100, y para precios usaría DOUBLE"*. El prompt (`3522` chars) inyecta `aiNotes` y el cuerpo de la sección para que el tutor corrija el orden lexicográfico (`"100"` va antes que `"25"` y `"9"` en `VARCHAR`) y explique por qué `DOUBLE` sufre error de representación binaria IEEE 754 frente a `DECIMAL(10, 2)`.
2. **`c0-datos-02-null-vacio`:** Respuesta errónea del alumno: *"WHERE postal_code = NULL devuelve 218 filas"*. El prompt (`3199` chars) inyecta `aiNotes` sobre lógica trivalente para que el tutor explique que `= NULL` evalúa a `UNKNOWN` (0 filas) y debe usarse `IS NULL`.
3. **`c0-datos-03-formatos-archivo`:** Respuesta errónea del alumno: *"CSV guarda los datos por columnas y Parquet fila por fila"*. El prompt (`3217` chars) inyecta el contexto de `parquet-almacenamiento-columnar-tipado` y el visualizador `row-vs-columnar-storage` para corregir la inversión entre formato por filas (CSV) y columnar binario con *footer* (Parquet).
4. **`c0-datos-04-utf8-separadores`:** Respuesta errónea del alumno: *"BogotÃ¡ aparece porque el archivo se corrompió al descargarse por internet"*. El prompt (`3584` chars) inyecta `aiNotes` explicando que los 2 bytes de la `"á"` en UTF-8 están intactos pero fueron leídos con una tabla de 1 byte como Windows-1252 (*mojibake*).
5. **`c0-datos-05-tablas-grano`:** Respuesta errónea del alumno: *"El grano de payments es una fila por pedido igual que orders"*. El prompt (`3469` chars) inyecta los conteos reales (`19 200` filas vs `18 000` `order_id` distintos) para demostrar que el grano de `payments` es un intento/notificación de cobro por fila.

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

Se ejecutaron **5 pruebas adversariales** sobre el contenido, las consultas SQL y la integración con validadores:

1. **Contaminación de agregados por el SKU centinela negativo (`products` en Lección 1):** Se probó ejecutar `MIN(list_price_usd)` y `AVG(list_price_usd)` sin filtrar `is_active = true AND list_price_usd > 0`. Se comprobó que el registro centinela `product_id = 180` (`SKU-TEST-NEG`, `-9.99`, `is_active = false`) hunde el mínimo a `-9.99` y sesga la media de `77.51` a `77.15` USD, caso documentado paso a paso en el `workedExample` de la lección 1.
2. **Trampa de lógica trivalente `WHERE postal_code = NULL` (`customers` en Lección 2):** Se verificó en DuckDB que `SELECT COUNT(*) FROM customers WHERE postal_code = NULL` devuelve `0` filas a pesar de existir `218` clientes sin código postal, mientras que `WHERE postal_code IS NULL` devuelve exactamente `218`.
3. **Colisión entre código postal corto (`LENGTH(postal_code) = 2`) y valor `NULL` (`customers` en Lección 2):** Se verificó en `customers` que además de los `218` registros con `postal_code IS NULL`, existen `129` registros con código postal truncado de 2 caracteres (defecto sembrado #11), garantizando que las consultas de la lección 2 no confundan valores truncados con `NULL`.
4. **Detección de bytes multibyte UTF-8 frente a ASCII (`stores` en Lección 4):** Se verificó que `WHERE STRLEN(city) > LENGTH(city)` en `stores` aísla únicamente las 6 sedes con tildes (`Ciudad de México`, `Bogotá`, `Medellín`) y excluye las 8 sedes puramente ASCII (`Guadalajara`, `Madrid`, `Barcelona`, `Buenos Aires`, `Santiago`, `Lima`).
5. **Descuadre de grano en `payments` frente a `orders` (`payments` en Lección 5):** Se probó comparar `COUNT(*)` (`19 200`) con `COUNT(DISTINCT order_id)` (`18 000`) en `payments` y desglosar por `attempt_number`, demostrando que las `1200` filas extra provienen exactamente de `750` segundos intentos (`attempt_number = 2`) y `450` notificaciones repetidas en el intento 1 (`405` en `captured`, `27` en `failed`, `18` en `pending`).

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
