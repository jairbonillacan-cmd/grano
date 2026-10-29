# Investigación curricular y diseño del módulo `c0-hojas` — Hojas de cálculo con criterio

- **Módulo:** `c0-hojas` (*Hojas de cálculo con criterio*)
- **Área y nivel:** Tronco común (`core`) · Nivel `0` (*Cimientos*)
- **Prerrequisito de módulo:** `c0-datos` (*Qué son los datos*)
- **Duración total:** 70 minutos (`15 + 20 + 20 + 15` min)
- **Fecha de consulta de fuentes:** `2026-10-29`

---

## 1. Investigación de fuentes por lección (Paso 1)

Todas las fuentes listadas a continuación fueron verificadas mediante petición HTTP real (`200 OK`) el `2026-10-29`. Cada lección cuenta con al menos 3 fuentes verificables y un mínimo de 2 fuentes primarias (documentación técnica oficial de Microsoft Excel, especificación de DuckDB, estándar RFC 3339 / ISO 8601 y guía metodológica de Karl W. Broman y Kara H. Woo).

### Lección 1 — `c0-hojas-01-tablas-referencias`
**Título:** `Tablas estructuradas, referencias con nombre y filtros` (15 min)

| # | Tipo | Título y autor / editorial | URL verificada (`200 OK`) | Fecha de consulta | Afirmación técnica que respalda en la lección |
|---|---|---|---|---|---|
| 1 | Primaria | *Overview of Excel tables* — Microsoft Support | https://support.microsoft.com/en-us/office/overview-of-excel-tables-7ab0bb7d-3a9e-4b56-a3c9-6c94334e492c | `2026-10-29` | Al convertir un rango en tabla estructurada (`Ctrl+T`), las filas nuevas añadidas al final se integran automáticamente en el objeto tabla y las columnas calculadas propagan su fórmula a todas las filas sin arrastrar el ratón. |
| 2 | Primaria | *Using structured references with Excel tables* — Microsoft Support | https://support.microsoft.com/en-us/office/using-structured-references-with-excel-tables-f5ed2452-2337-4f71-bed3-c8ae6d2b276e | `2026-10-29` | Las referencias estructuradas nombran la tabla y la columna entre corchetes (`TablaPedidos[total_usd]`) y utilizan el operador `@` (`[@qty]*[@unit_price_usd]`) para operar sobre la fila actual, igual que una expresión por fila en SQL. |
| 3 | Primaria | *SUBTOTAL function* — Microsoft Support | https://support.microsoft.com/en-us/office/subtotal-function-7b027003-f060-4ade-9040-e478765b9939 | `2026-10-29` | La función `SUMA` (`SUM`) incluye siempre las celdas ocultas por un autofiltro, mientras que `SUBTOTALES(109; ...)` suma únicamente las filas visibles en pantalla tras aplicar un filtro. |
| 4 | Primaria / Académica | *Data Organization in Spreadsheets* — Karl W. Broman & Kara H. Woo | https://kbroman.org/dataorg/ | `2026-10-29` | Una tabla de datos limpia debe formar un único rectángulo contiguo donde cada fila es una observación, cada columna es una variable con un nombre único en la primera fila y no se mezclan totales manuales con registros crudos. |

---

### Lección 2 — `c0-hojas-02-tablas-dinamicas`
**Título:** `Tablas dinámicas para resumir ventas sin alterar datos` (20 min)

| # | Tipo | Título y autor / editorial | URL verificada (`200 OK`) | Fecha de consulta | Afirmación técnica que respalda en la lección |
|---|---|---|---|---|---|
| 1 | Primaria | *Create a PivotTable to analyze worksheet data* — Microsoft Support | https://support.microsoft.com/en-us/office/create-a-pivottable-to-analyze-worksheet-data-a9a84538-bfe9-40a9-a8e9-f99134456576 | `2026-10-29` | Una tabla dinámica separa los datos crudos de la vista de resumen mediante cuatro cuadrantes (`Filtros`, `Filas`, `Columnas` y `Valores`) y exige que la tabla de origen no tenga filas vacías ni subtotales intercalados. |
| 2 | Primaria | *GETPIVOTDATA function* — Microsoft Support | https://support.microsoft.com/en-us/office/getpivotdata-function-8c083b99-a922-4ca0-af5e-3af55960761f | `2026-10-29` | Referenciar una celda de una tabla dinámica por coordenada fija (`=C5`) devuelve un dato erróneo si el resumen cambia de forma al actualizarse; `IMPORTARDATOSDINAMICOS` (`GETPIVOTDATA`) extrae el valor por nombre de campo y elemento. |
| 3 | Primaria | *DuckDB SQL Reference: PIVOT and GROUP BY Statements* — DuckDB Foundation | https://duckdb.org/docs/sql/statements/pivot.html | `2026-10-29` | Equivalencia formal entre una tabla dinámica y una consulta SQL: el cuadrante `Filtros` corresponde a `WHERE`, `Filas` a `GROUP BY`, `Columnas` a expresiones condicionales `CASE WHEN` o `PIVOT`, y `Valores` a funciones de agregación como `SUM()`, `COUNT()` y `AVG()`. |

---

### Lección 3 — `c0-hojas-03-buscarx-cruces`
**Título:** `BUSCARX (XLOOKUP): cruces seguros y claves duplicadas` (20 min)

| # | Tipo | Título y autor / editorial | URL verificada (`200 OK`) | Fecha de consulta | Afirmación técnica que respalda en la lección |
|---|---|---|---|---|---|
| 1 | Primaria | *XLOOKUP function* — Microsoft Support | https://support.microsoft.com/en-us/office/xlookup-function-b7fd680e-6d10-43e6-84f9-88eae8bf5929 | `2026-10-29` | `BUSCARX` (`XLOOKUP`) usa coincidencia exacta por defecto (`match_mode = 0`), separa la columna buscada de la columna devuelta sin depender de números de columna fijos y cuando existen claves duplicadas devuelve únicamente la primera coincidencia según el modo de búsqueda. |
| 2 | Primaria | *VLOOKUP function* — Microsoft Support | https://support.microsoft.com/en-us/office/vlookup-function-0bbc8083-26fe-4963-8ab8-93a18ad188a1 | `2026-10-29` | Limitaciones de `BUSCARV` (`VLOOKUP`): obliga a que la clave esté en la primera columna a la izquierda, se rompe al insertar columnas intermedias por su índice estático y aplica coincidencia aproximada si se omite el cuarto argumento. |
| 3 | Primaria | *DuckDB SQL Reference: FROM and JOIN Clauses* — DuckDB Foundation | https://duckdb.org/docs/sql/query_syntax/from.html | `2026-10-29` | Mientras `BUSCARX` oculta silenciosamente las filas repetidas quedándose con la primera aparición, un `LEFT JOIN` en SQL genera tantas filas como coincidencias existan en la tabla derecha (`1:N`), por lo que en ambos entornos es obligatorio verificar primero que la clave del catálogo sea única. |

---

### Lección 4 — `c0-hojas-04-errores-fechas-celdas`
**Título:** `Errores frecuentes: fechas como texto y celdas combinadas` (15 min)

| # | Tipo | Título y autor / editorial | URL verificada (`200 OK`) | Fecha de consulta | Afirmación técnica que respalda en la lección |
|---|---|---|---|---|---|
| 1 | Primaria / Académica | *Data Organization in Spreadsheets* — Karl W. Broman & Kara H. Woo | https://kbroman.org/dataorg/ | `2026-10-29` | Reglas de higiene tabular: escribir fechas en formato `YYYY-MM-DD`, no combinar celdas nunca y no dejar celdas en blanco para indicar que se repite el valor de la fila superior. |
| 2 | Primaria | *Convert dates stored as text to dates* — Microsoft Support | https://support.microsoft.com/en-us/office/convert-dates-stored-as-text-to-dates-8df7663e-98e6-4295-96e4-32a67ec0a680 | `2026-10-29` | Las fechas reales en Excel se almacenan como números enteros de serie alineados a la derecha; las fechas guardadas como texto se alinean a la izquierda, se ordenan alfabéticamente y provocan errores de interpretación entre `DD/MM/YYYY` y `MM/DD/YYYY`. |
| 3 | Primaria | *Merge and unmerge cells in Excel* — Microsoft Support | https://support.microsoft.com/en-us/office/merge-and-unmerge-cells-5cbd15d5-9375-4540-907f-c673a93fcedf | `2026-10-29` | Al combinar un bloque de celdas contiguas, la hoja conserva únicamente el valor de la celda superior izquierda y borra el contenido de todas las demás celdas del bloque, generando valores `NULL` al exportar o consultar la tabla. |
| 4 | Primaria (Estándar) | *RFC 3339: Date and Time on the Internet: Timestamps (ISO 8601 Profile)* — IETF | https://datatracker.ietf.org/doc/html/rfc3339 | `2026-10-29` | El formato estándar `YYYY-MM-DD` y las marcas temporales con desplazamiento explícito (`Z`, `-06:00`, `+01:00`) garantizan lecturas sin ambigüedad regional y hacen coincidir el orden alfabético con el orden cronológico. |

---

## 2. Mapa de conceptos y progresión pedagógica (Paso 2)

### 2.1 Qué asume este módulo de `c0-datos` (y no repite desde cero)
Del módulo previo `c0-datos` (*Qué son los datos*), el alumno ya conoce:
1. Los cinco tipos de dato elementales: entero (`INTEGER`), decimal exacto (`DECIMAL`/`NUMERIC` frente a `DOUBLE`), cadena de texto (`VARCHAR`), fecha/tiempo (`DATE`/`TIMESTAMP`) y booleano (`BOOLEAN`).
2. La diferencia entre `NULL` (ausencia de valor), el número `0` y la cadena vacía `''`.
3. Qué es un archivo CSV frente a un libro Excel (`.xlsx`) o un archivo columnar Parquet (`.parquet`).
4. Qué es una tabla, qué es una clave primaria (`product_id`, `order_id`, `customer_id`) y qué significa el **grano** (*grain*) de una tabla ("qué representa exactamente una fila").

No existe ninguna brecha entre `c0-datos` y `c0-hojas`: todos los conceptos previos requeridos están cubiertos en `c0-datos-01` a `c0-datos-05`.

### 2.2 Progresión de conceptos dentro de `c0-hojas`

| Orden | ID de lección | Concepto central que introduce | Error típico de trabajo que corrige | Puente explícito hacia SQL (DuckDB sobre Mercado Brisa) |
|---|---|---|---|---|
| 1 | `c0-hojas-01-tablas-referencias` | **Tabla estructurada**, **referencia estructurada** (`Tabla[Columna]`, `[@Columna]`) y diferencia entre filtro visual (`SUMA`) y suma filtrada (`SUBTOTALES` / `SUMA.SI.CONJUNTO`). | Usar rangos fijos `A2:G500` que dejan fuera filas nuevas, ordenar una sola columna desalineando el resto de la fila y sumar con `=SUMA()` filas ocultas por un filtro visual. | Columna calculada `=[@qty]*[@unit_price_usd]-[@discount_usd]` ↔ `SELECT qty * unit_price_usd - discount_usd` en `order_items`, y filtro explícito `WHERE status = 'completed'` en `orders` o `WHERE is_active = true AND list_price_usd > 0` en `products`. |
| 2 | `c0-hojas-02-tablas-dinamicas` | **Tabla dinámica** (*PivotTable*): separación entre tabla cruda y reporte, los cuatro cuadrantes (`Filtros`, `Filas`, `Columnas`, `Valores`), cambio de `CUENTA` a `SUMA` y extracción con `IMPORTARDATOSDINAMICOS`. | Insertar filas de subtotales manuales en medio de la tabla cruda (duplicando el total general) o resumir ventas regionales sin filtrar los pedidos cancelados y reembolsados. | `Filtros` ↔ `WHERE status = 'completed'`; `Filas` ↔ `GROUP BY region`; `Columnas` ↔ `SUM(CASE WHEN store_type = '...' THEN total_usd ELSE 0 END)`; `Valores` ↔ `COUNT()`, `SUM()`, `AVG()`. |
| 3 | `c0-hojas-03-buscarx-cruces` | **`BUSCARX` (`XLOOKUP`)**: cruce exacto por defecto entre dos tablas, manejo del cuarto argumento (`si_no_se_encuentra`) y auditoría de unicidad de la clave antes de cruzar. | Usar `BUSCARV` con índice de columna fijo o aplicar `BUSCARX` hacia una tabla con claves repetidas (`payments`), donde la hoja devuelve solo la primera fila e ignora los reintentos exitosos. | Enriquecer `order_items` con `products` (`LEFT JOIN` sobre clave única `product_id`, 180 filas = 180 claves) frente al riesgo de cruzar `orders` con `payments` (19.200 filas para 18.000 pedidos) sin deduplicar antes. |
| 4 | `c0-hojas-04-errores-fechas-celdas` | **Fecha en formato ISO 8601** (`YYYY-MM-DD`), marcas de tiempo con zona horaria (`event_ts_raw`) y peligro de las **celdas combinadas** que dejan huecos `NULL`. | Combinar celdas verticalmente para agrupar regiones o países (borrando el valor en las filas inferiores) y mezclar fechas como texto regional (`DD/MM/YYYY` vs `MM/DD/YYYY`). | Inspección de `events.event_ts_raw` (5 sufijos de zona horaria mezclados frente a `event_ts` en UTC) y auditoría de celdas vacías (`postal_code IS NULL`, 218 filas) y truncadas (`LENGTH <= 2`, 129 filas) en `customers`. |

---

## 3. Proyecto del módulo y rúbrica verificable (Paso 6)

### 3.1 Especificación en el catálogo (`src/data/catalog/modules.js`)
El registro actual de `c0-hojas` en `src/data/catalog/modules.js` ya define:
- **`prompt`:** `'Cruzar el catálogo de productos con las ventas mensuales y auditar errores de captura en hoja de cálculo.'`
- **`dataset`:** `'Mercado Brisa (`orders`, `order_items` y `products` exportados para hoja de cálculo)'`
- **`deliverable`:** `'Libro con tabla dinámica de ingresos por categoría y tienda más hoja de auditoría con los 3 errores corregidos.'`

### 3.2 Rúbrica verificable de 4 criterios (para la vista Proyectos y revisión con IA)

| Criterio | Peso | 4 = Excelente (verificable con cifras exactas de Mercado Brisa) | 2 = Incompleto | 0 = No entregado / Incorrecto |
|---|---|---|---|---|
| **1. Estructura tabular y limpieza del catálogo (`products`)** | 25 % | Convierte los rangos en tablas estructuradas con nombres explícitos (`TablaProductos`, `TablaPedidos`, `TablaLineas`) y aísla los 10 productos inactivos (`is_active = false`), incluyendo el SKU de calibración `SKU-TEST-NEG` (`product_id = 180`, `list_price_usd = -9.99`) para que no distorsione precios ni márgenes. | Usa tablas estructuradas pero mantiene `SKU-TEST-NEG` mezclado en los promedios de catálogo. | Opera sobre rangos sueltos con coordenadas fijas (`A2:F181`) sin filtrar productos inactivos ni precios negativos. |
| **2. Cruce seguro de catálogo y líneas de venta (`BUSCARX` / `LEFT JOIN`)** | 25 % | Verifica que `product_id` sea único en `products` (`180` filas = `180` claves distintas) antes de traer `category` y `unit_cost_usd` hacia las `42.000` filas de `order_items` con coincidencia exacta y texto de respaldo ante no encontrados; al excluir `SKU-TEST-NEG`, las 5 categorías suman exactamente `42.000` líneas válidas y `$6.682.464,31` en `line_total_usd`. | Realiza el cruce con `BUSCARV` por número de columna fijo o sin comprobar unicidad de la clave buscada. | Cruza por nombre de producto con coincidencia aproximada o duplica filas al unir tablas con relación `1:N`. |
| **3. Tabla dinámica por región y tipo de tienda sin alterar datos crudos** | 25 % | Construye la tabla dinámica en una hoja separada filtrando `status = 'completed'` (`14.760` pedidos y `$6.269.462,42` en `total_usd`), colocando `region` en `Filas` y `store_type` (`flagship`, `retail`, `warehouse`) en `Columnas`, verificando que Cono Sur suma `$2.059.786,39`, Andina `$1.990.554,12`, Iberia `$1.348.369,68` y Norteamérica `$870.752,23`. | Construye la tabla dinámica pero olvida filtrar `status = 'completed'`, inflando el total a `$7.669.817,77` (`18.000` pedidos). | Inserta filas de subtotales manuales dentro de la tabla `orders` o sobrescribe los registros originales. |
| **4. Hoja de auditoría de las 3 anomalías de captura** | 25 % | Documenta y cuantifica con exactitud las 3 anomalías sembradas: (a) `SKU-TEST-NEG` con precio `-9.99` en `products` y presencia en `15` pedidos cancelados; (b) `1.200` filas adicionales en `payments` (`19.200` filas para `18.000` pedidos: `750` reintentos y `450` webhooks duplicados); (c) `218` clientes con `postal_code IS NULL` (`9,08 %`) y `129` con código postal truncado de 2 caracteres (`5,38 %`) en `customers`. | Detecta las anomalías de forma cualitativa pero sin cuantificar el número exacto de filas afectadas. | No entrega la hoja de auditoría o borra filas en silencio sin registrar la regla aplicada. |
