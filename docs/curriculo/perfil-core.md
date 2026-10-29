# Perfil de egreso · Tronco común (`core`)

**Área:** `core` — Tronco común (14 módulos, 65 lecciones, 1 375 minutos / 22.9 horas estimadas)  
**Propósito:** construir los cimientos de datos, hojas de cálculo, pensamiento estadístico, criterio de negocio, terminal, Git, SQL desde cero hasta analítico, modelado relacional y dimensional, Python tabular, visualización honesta, agentes conectados vía MCP y preparación de portafolio que comparten las tres especializaciones (`de`, `da`, `bi`).

---

## Nivel 0 · Cimientos (`c0-datos`, `c0-hojas`, `c0-numeros`, `c0-negocio`, `c0-herramientas`)

### Qué sabe hacer la persona al terminar el Nivel 0
- Distinguir tipos de dato (`INTEGER`, `DECIMAL` exacto frente a coma flotante, texto UTF-8, fechas ISO-8601 y booleanos), formatos de archivo (`CSV`, `JSON`, `Excel`, `Parquet`), el significado de `NULL` y qué representa una fila en una tabla (**el grano**).
- Resumir, cruzar y auditar tablas en hojas de cálculo usando tablas estructuradas, tablas dinámicas y `BUSCARX` (`XLOOKUP`) sin corromper fechas ni duplicar filas por claves repetidas.
- Describir cualquier variable numérica mediante medidas de centro (media, mediana, moda), dispersión (rango intercuartílico, percentiles `p50`, `p90`, `p99`) y proporciones (tasas, puntos porcentuales y puntos base) sin confundir correlación con causalidad.
- Calcular ingreso bruto, descuentos, devoluciones, costo directo y margen bruto, estructurar un embudo de conversión y distinguir un KPI accionable de una métrica de vanidad.
- Desenvolverse en la terminal, registrar commits atómicos en Git y ejecutar scripts y cuadernos reactivos de Python (`uv`, Jupyter, Marimo).

### Tareas laborales reales que puede ejecutar
1. Auditar un lote de archivos recién recibidos (`customers.csv`, `products.json`, `orders.parquet`) para documentar su diccionario de datos y aislar errores de codificación o importes negativos.
2. Construir en hoja de cálculo el cierre mensual de ventas por categoría y tienda verificando que no existan cruces duplicados.
3. Redactar la ficha técnica de los indicadores financieros y de conversión del mes con su fórmula exacta y su grano.

### Entregables verificables del nivel (sobre Mercado Brisa)
- **`c0-datos`:** Diccionario de datos en Markdown con 15 columnas documentadas y 3 anomalías de formato detectadas sobre `customers.csv`, `products.json` y `orders.parquet`.
- **`c0-hojas`:** Libro con tabla dinámica de ingresos por categoría y tienda más hoja de auditoría con 3 errores corregidos sobre `orders`, `order_items` y `products`.
- **`c0-numeros`:** Ficha estadística con 5 indicadores (mediana, media, IQR, `p90`, tasa de reembolso) e interpretación en 150 palabras sobre `orders` y `payments`.
- **`c0-negocio`:** Documento con el diagrama del embudo de 4 etapas y la ficha formal de 3 KPIs sobre `events`, `orders`, `order_items` y `refunds`.
- **`c0-herramientas`:** Repositorio Git con al menos 3 commits limpios, `README.md` y cuaderno `.py` ejecutable sobre `stores` y `calendar`.

---

## Nivel 1 · Fundamentos (`c1-sql-base`, `c1-sql-joins`, `c1-modelo`, `c1-python`, `c1-viz`)

### Qué sabe hacer la persona al terminar el Nivel 1
- Consultar, filtrar, agrupar y transformar una tabla en SQL dominando el orden lógico de evaluación (`FROM` → `WHERE` → `GROUP BY` → `HAVING` → `SELECT` → `ORDER BY`), la lógica trivalente de `NULL`, `CASE WHEN`, `FILTER`, funciones de fecha y la diferencia entre `COUNT(*)`, `COUNT(col)` y `COUNT(DISTINCT col)`.
- Combinar múltiples tablas mediante `INNER`, `LEFT`, `FULL`, `SEMI` (`EXISTS`) y `ANTI JOIN` (`NOT EXISTS`), diagnosticando y evitando la multiplicación silenciosa de filas (**fan-out**, lección existente `l1-joins-fanout`) mediante CTEs pre-agregadas.
- Diseñar esquemas relacionales normalizados (1FN a 3FN) y escribir consultas de auditoría que detecten duplicados, claves foráneas huérfanas y valores fuera de rango.
- Transformar archivos CSV y Parquet en Python con **Polars 2.0** y **pandas 3.0** (*Copy-on-Write* y tipos PyArrow), pasando de un cuaderno interactivo a un script modular reproducible por línea de comandos.
- Construir gráficos y tablas numéricas con escalas honestas, paletas accesibles y alineación tabular.

### Entregables verificables del nivel (sobre Mercado Brisa)
- **`c1-sql-base`:** Archivo `.sql` con 10 consultas operativas comentadas y verificadas en DuckDB sobre `orders`.
- **`c1-sql-joins`:** Consulta SQL modular con CTEs pre-agregadas y prueba de reconciliación exacta contra la suma de `orders` cruzando `customers`, `orders`, `order_items`, `payments` y `refunds`.
- **`c1-modelo`:** Suite de 8 consultas SQL de validación (que devuelven 0 filas cuando todo es correcto) e informe de hallazgos sobre las tablas transaccionales.
- **`c1-python`:** Script `resumen_ventas.py` en Polars reproducible por CLI que limpia el catálogo y exporta un archivo Parquet validado.
- **`c1-viz`:** Tres gráficos corregidos con título activo, escala honesta y nota técnica sobre `orders`, `stores` y `calendar`.

---

## Nivel 2 · Intermedio común (`c2-sql-analitico`, `c2-dimensional`)

### Qué sabe hacer la persona al terminar el Nivel 2 común
- Resolver problemas de series temporales, rankings y emparejamiento por tiempo en SQL con funciones de ventana y `QUALIFY` (`l2-window-functions`), cruces temporales `ASOF JOIN` y CTEs modulares (`l3-asof-lateral-ctes`), manejo de zonas horarias con espinas de calendario (*Date Spine*) y lectura de planes físicos con `EXPLAIN ANALYZE`.
- Diseñar esquemas dimensionales en estrella y tablas anchas desnormalizadas (`l4-star-schema-obt`), implementar dimensiones lentamente cambiantes con historial **SCD Tipo 2** (`l5-scd2-history`) y agregar métricas no aditivas evitando la paradoja de Simpson (`l6-metrics-simpson`).

### Entregables verificables del nivel (sobre Mercado Brisa)
- **`c2-sql-analitico`:** Script SQL con media móvil de 7 días calendario, ranking semanal de productos, atribución temporal con `ASOF JOIN` y análisis del plan `EXPLAIN ANALYZE` en DuckDB.
- **`c2-dimensional`:** DDL y consultas SQL de `dim_customer_scd2`, `dim_product`, `fct_orders` y tabla ancha `obt_sales` verificadas sobre `customers`, `customer_changes`, `products`, `orders`, `order_items` y `refunds`.

---

## Nivel 4 · Experto transversal (`x4-ia-datos`, `x4-carrera`)

### Qué sabe hacer la persona al terminar el Nivel 4 común
- Conectar agentes de lenguaje a capas semánticas y catálogos mediante servidores **Model Context Protocol (MCP)** (`l18-mcp-semantic-ai-rag`), búsqueda híbrida BM25 + vectores HNSW con *Reciprocal Rank Fusion* (RRF), barreras sintácticas AST con **SQLGlot** y conjuntos deterministas de evaluación (*Golden Evals*).
- Estructurar un portafolio público verificable con proyectos reales de su especialidad (`de`, `da` o `bi`) y defender sus decisiones técnicas y compensaciones en entrevistas de SQL en vivo, estudio de caso y diseño de arquitectura.

### Entregables verificables del nivel (sobre Mercado Brisa)
- **`x4-ia-datos`:** Especificación de herramientas MCP de solo lectura sobre la capa semántica de Mercado Brisa, consulta de búsqueda híbrida RRF y suite de 20 *Golden Evals* con resultado esperado exacto.
- **`x4-carrera`:** Repositorio de portafolio con 3 casos documentados (contexto, arquitectura/método, código reproducible y guion de defensa de 2 minutos).
