# Investigación curricular y diseño del módulo `c1-viz` — Visualización honesta

- **Módulo:** `c1-viz` ("Visualización honesta")
- **Área y nivel:** `core` (Tronco común) · Nivel 1 (Fundamentos)
- **Prerrequisito de módulo:** `c0-numeros` ("Números con sentido")
- **Módulos posteriores que dependen de `c1-viz`:** `da2-eda` ("Exploración de datos con método") y `bi3-dashboards` ("Diseño de tableros ejecutivos y operativos")
- **Duración total:** 80 minutos (4 lecciones de 20 minutos cada una)
- **Fecha de consulta de fuentes:** `2026-10-29`

---

## 1. Investigación de fuentes por lección (Paso 1)

Cada lección cuenta con 4 fuentes verificables (`https://...`), incluyendo al menos 3 fuentes primarias (artículos experimentales, especificaciones del W3C, libros de referencia técnica de visualización y documentación oficial de DuckDB).

### Lección 1: `c1-viz-01-geometria-grafico` — *Elegir la geometría según la pregunta y la variable*

| Tipo | Título de la fuente | Editorial / Autor | URL | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|
| Primaria (artículo experimental) | *Graphical Perception: Theory, Experimentation, and Application to the Development of Graphical Methods* | William S. Cleveland & Robert McGill (*Journal of the American Statistical Association*, Vol. 79, No. 387) | https://www.jstor.org/stable/2288400 | `2026-10-29` | El juicio perceptual de posición a lo largo de una escala común alineada es entre 1.4 y 2.5 veces más exacto que el juicio de longitud no alineada, área o ángulo circular. |
| Primaria (libro de referencia) | *Fundamentals of Data Visualization — Chapter 5: Directory of Visualizations & Chapter 6: Visualizing Amounts* | Claus O. Wilke (O'Reilly Media) | https://clauswilke.com/dataviz/directory-of-visualizations.html | `2026-10-29` | Correspondencia entre tipo de variable (categórica, numérica continua, temporal) y geometría adecuada: barras horizontales ordenadas para cantidades por categoría, líneas para tendencias temporales, histogramas/cajas para distribuciones y dispersión para relaciones bivariadas. |
| Primaria (libro de referencia) | *Visualization Analysis and Design — Chapter 5: Marks and Channels* | Tamara Munzner (A K Peters / CRC Press) | https://www.cs.ubc.ca/~tmm/vadbook/ | `2026-10-29` | Distinción entre canales de magnitud (posición, longitud, luminancia) para atributos ordenados y canales de identidad (tono de color, forma, agrupación espacial) para atributos categóricos. |
| Primaria (documentación oficial) | *DuckDB SQL Reference — GROUP BY and Window Aggregates* | DuckDB Foundation | https://duckdb.org/docs/sql/query_syntax/groupby.html | `2026-10-29` | Agregación por categoría (`GROUP BY`) combinada con funciones de ventana (`SUM(SUM(col)) OVER ()`) para calcular participación porcentual sobre el total y ordenar de mayor a menor. |

### Lección 2: `c1-viz-02-ejes-escalas-cero` — *Ejes, escalas, cuándo exigir el cero y ejes dobles*

| Tipo | Título de la fuente | Editorial / Autor | URL | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|
| Primaria (libro de referencia) | *Fundamentals of Data Visualization — Chapter 17: The Principle of Proportional Ink* | Claus O. Wilke (O'Reilly Media) | https://clauswilke.com/dataviz/proportional-ink.html | `2026-10-29` | Cuando una forma rellena (barra o área sombreada) representa una magnitud, el área visual debe ser proporcional al valor numérico; por tanto, el eje cuantitativo de todo gráfico de barras debe incluir el cero. |
| Primaria (guía metodológica universitaria) | *Calling Bullshit: Tools — The Principle of Proportional Ink* | Carl T. Bergstrom & Jevin D. West (University of Washington) | https://www.callingbullshit.org/tools/tools_proportional_ink.html | `2026-10-29` | Diferencia entre gráficos de barras (codifican magnitud mediante longitud rellena y exigen partir de cero) y gráficos de líneas (codifican posición del cambio y pueden acotar su eje si declaran el rango con honestidad). |
| Primaria (monografía técnica) | *Dual-Scaled Axes in Graphs: Are They Ever the Best Solution?* | Stephen Few (*Perceptual Edge Visual Business Intelligence Newsletter*) | https://www.perceptualedge.com/articles/visual_business_intelligence/dual-scaled_axes.pdf | `2026-10-29` | Los gráficos con doble eje vertical permiten fabricar cruces y pendientes arbitrarias al alterar el rango de cualquiera de las dos escalas; deben sustituirse por paneles separados con eje temporal compartido o series indexadas a base 100. |
| Primaria (documentación oficial) | *DuckDB SQL Reference — Window Functions (`FIRST_VALUE`)* | DuckDB Foundation | https://duckdb.org/docs/sql/functions/window_functions.html | `2026-10-29` | Uso de `FIRST_VALUE(metrica) OVER (ORDER BY periodo)` para normalizar series con unidades distintas a un índice común base 100 en el período inicial. |

### Lección 3: `c1-viz-03-color-accesibilidad` — *Color con intención: paletas secuenciales y accesibilidad*

| Tipo | Título de la fuente | Editorial / Autor | URL | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|
| Primaria (estándar normativo) | *Web Content Accessibility Guidelines (WCAG) 2.2 — Success Criterion 1.4.1 Use of Color & 1.4.11 Non-text Contrast* | World Wide Web Consortium (W3C) | https://www.w3.org/TR/WCAG22/#non-text-contrast | `2026-10-29` | El color no debe ser el único medio visual para transmitir información o distinguir un estado (1.4.1), y los objetos gráficos necesarios para comprender el contenido deben alcanzar un contraste mínimo de 3:1 frente a colores adyacentes (1.4.11). |
| Primaria (herramienta e investigación cartográfica) | *ColorBrewer 2.0: Color Advice for Cartography* | Cynthia A. Brewer & The Pennsylvania State University | https://colorbrewer2.org/ | `2026-10-29` | Taxonomía de esquemas cromáticos en tres tipos: secuenciales (magnitud ordenada de un extremo a otro), divergentes (desviación en dos sentidos respecto a un punto medio crítico) y cualitativos (categorías nominales sin orden). |
| Primaria (libro de referencia) | *Fundamentals of Data Visualization — Chapter 4: Color Scales & Chapter 19: Common Pitfalls of Color Use* | Claus O. Wilke (O'Reilly Media) | https://clauswilke.com/dataviz/color-basics.html | `2026-10-29` | Límite práctico de 5 a 7 tonos cualitativos distinguibles antes de saturar la memoria visual, uso del color como acento para resaltar excepciones sobre un contexto neutro y problemas de las escalas arcoíris. |
| Primaria (guía científica de diseño universal) | *Color Universal Design (CUD): How to Make Figures and Presentations That Are Friendly to Colorblind People* | Masataka Okabe & Kei Ito (Jikei Medical School / National Institute for Basic Biology) | https://jfly.uni-koeln.de/color/ | `2026-10-29` | Prevalencia de la deficiencia rojo-verde (deuteranopía y protanopía en cerca del 8 % de los hombres), paleta segura de Okabe-Ito (azul-naranja/bermellón) y codificación redundante mediante símbolos, etiquetas o trazos. |

### Lección 4: `c1-viz-04-tablas-numericas` — *Diseño de tablas numéricas: alineación y cifras tabulares*

| Tipo | Título de la fuente | Editorial / Autor | URL | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|
| Primaria (libro de referencia) | *Show Me the Numbers: Designing Tables and Graphs to Enlighten (2nd Edition)* | Stephen Few (Analytics Press / Perceptual Edge) | https://www.perceptualedge.com/library.php | `2026-10-29` | Criterios para elegir tablas frente a gráficos (búsqueda de valores exactos y comparación de múltiples unidades), alineación de texto a la izquierda y números a la derecha, precisión decimal uniforme y eliminación de rejillas verticales pesadas. |
| Primaria (especificación técnica) | *CSS Fonts Module Level 4 — Section 6.6: Numeric Formatting (`font-variant-numeric: tabular-nums`)* | World Wide Web Consortium (W3C) | https://www.w3.org/TR/css-fonts-4/#font-variant-numeric-prop | `2026-10-29` | La propiedad `tabular-nums` asigna el mismo ancho de avance a todos los glifos numéricos para que las unidades, decenas y separadores decimales queden alineados verticalmente en tablas. |
| Primaria (libro de referencia) | *The Visual Display of Quantitative Information (2nd Edition) & Sparklines* | Edward R. Tufte (Graphics Press) | https://www.edwardtufte.com/bboard/q-and-a-fetch-msg?msg_id=0001OR | `2026-10-29` | Uso del espacio en blanco y reglas horizontales ligeras para separar grupos sin encerrar celdas en cajas, orden jerárquico de filas por magnitud y adición de contexto comparativo (tasas, cuotas y promedios). |
| Primaria (documentación oficial) | *DuckDB SQL Reference — Numeric Functions (`ROUND`, `NULLIF`)* | DuckDB Foundation | https://duckdb.org/docs/sql/functions/numeric.html | `2026-10-29` | Redondeo explícito con `ROUND(valor, decimales)` y división protegida con `NULLIF(denominador, 0)` para evitar falsas precisiones de coma flotante en tablas de salida. |

---

## 2. Mapa de conceptos y progresión del módulo (Paso 2)

### Conceptos previos asumidos (de `c0-numeros` y `c1-sql-base`)
- Medidas de centro (media y mediana), dispersión (percentiles) y asimetría (`c0-numeros-01` a `c0-numeros-03`).
- Proporciones, porcentajes, puntos porcentuales y tasas con denominador explícito (`c0-numeros-04`).
- Diferencia entre correlación observada y relación causal (`c0-numeros-05`).
- Consultas SQL con `SELECT`, `WHERE`, `GROUP BY`, `ORDER BY`, `CASE WHEN` y funciones de agregación (`SUM`, `AVG`, `COUNT`) sobre las tablas de Mercado Brisa (`c1-sql-base`).

### Progresión entre las 4 lecciones de `c1-viz`

| Orden | ID de lección | Título (≤ 60 caracteres) | Concepto nuevo que introduce | Concepto previo en que se apoya | Error típico que corrige |
|---|---|---|---|---|---|
| 1 | `c1-viz-01-geometria-grafico` | `Elegir la geometría según la pregunta y la variable` | `codificacion-visual`, `jerarquia-perceptual`, matriz pregunta-variable-geometría | Tipos de variables y proporciones (`c0-numeros`) | Usar gráficos circulares para comparar 5+ categorías con cuotas cercanas o barras desordenadas. |
| 2 | `c1-viz-02-ejes-escalas-cero` | `Ejes, escalas, cuándo exigir el cero y ejes dobles` | `tinta-proporcional`, factor de distorsión, escalas logarítmicas, `indice-base-100` | Diferencia entre codificar longitud (barras) y posición (líneas) de `c1-viz-01` | Truncar el eje vertical de un gráfico de barras o superponer dos unidades distintas en un eje doble. |
| 3 | `c1-viz-03-color-accesibilidad` | `Color con intención: paletas secuenciales y accesibilidad` | Escalas cualitativa, secuencial y `paleta-divergente`, `contraste-no-textual` (WCAG 1.4.1 / 1.4.11), paleta Okabe-Ito | Escalas cuantitativas y punto de referencia central de `c1-viz-02` | Colorear 14 categorías con un arcoíris o usar semáforos rojo-verde sin símbolo ni texto de respaldo. |
| 4 | `c1-viz-04-tablas-numericas` | `Diseño de tablas numéricas: alineación y cifras tabulares` | `cifras-tabulares` (`tabular-nums`), alineación por tipo de dato, redondeo con precisión uniforme, columnas de contexto | Jerarquía visual, orden por magnitud y señal accesible de `c1-viz-01` a `c1-viz-03` | Mostrar tablas con texto y números centrados, 8 decimales de coma flotante, orden alfabético y sin cuota del total. |

### Conexión hacia módulos posteriores
- Hacia `da2-eda` ("Exploración de datos con método"): el analista aplica la elección de geometría, escalas sin distorsión y tablas perfiladas para inspeccionar distribuciones y valores atípicos.
- Hacia `bi3-dashboards` ("Diseño de tableros ejecutivos y operativos"): el especialista BI integra las 4 reglas en tableros completos con múltiplos pequeños, gráficos de bala y reportes declarativos en código.

---

## 3. Verificación SQL real sobre Mercado Brisa en DuckDB (Paso 4)

Todas las consultas de `sections[].example`, `workedExample` y `practice` de las 4 lecciones fueron ejecutadas con `@duckdb/node-api` contra los archivos Parquet de `public/datasets/`:

1. **`c1-viz-01-geometria-grafico`**:
   - Ejemplo de sección: ingresos completados en 2024 por `region` (`Cono Sur`: `919026.32` USD / `33.6 %`, `Andina`: `858331.08` USD / `31.4 %`, `Iberia`: `590458.99` USD / `21.6 %`, `Norteamérica`: `363700.11` USD / `13.3 %`).
   - Ejemplo guiado: comparación entre categorías en orden alfabético sin denominador frente al ranking ordenado de 2024 (`Molinos` `39.1 %`, `Cafeteras` `30.3 %`, `Suscripciones` `12.2 %`, `Accesorios` `10.9 %`, `Café en grano` `7.5 %`).
   - Práctica: ranking histórico de las 5 categorías en pedidos completados (`Molinos`: `2163162.27` USD y `39.6 %` del ingreso total).
2. **`c1-viz-02-ejes-escalas-cero`**:
   - Ejemplo de sección: ticket medio trimestral en 2024 (`FY24-Q1`: `418.26` USD, `FY24-Q2`: `419.19` USD, `FY24-Q3`: `415.49` USD, `FY24-Q4`: `428.34` USD), mostrando que oscila entre `-1.1 %` y `+1.9 %` respecto a la media anual.
   - Ejemplo guiado: contraste entre mezclar `spend_usd` e `impressions` en crudo frente a indexar `spend_usd` y `attributed_conversions` a base `100.0` en `2024-01-01` (`100`, `99.1`, `102.1`, `19.2`).
   - Práctica: serie mensual del primer semestre de 2024 en `orders` completados con índice base 100 respecto a enero (`100` en enero hasta `124.7` en junio).
3. **`c1-viz-03-color-accesibilidad`**:
   - Ejemplo de sección: desviación del ticket medio regional en 2024 frente a la referencia de `420.00` USD con etiqueta accesible (`SOBRE META [+]`, `EN RANGO [=]`, `BAJO META [-]`).
   - Ejemplo guiado: reducción de 14 tiendas a las 4 principales (`FOCO [ACENTO]`) más `'Otras tiendas (10)'` (`CONTEXTO [GRIS]`, `47.3 %` de cuota).
   - Práctica: auditoría de CPA por canal en `marketing_spend` clasificando canales con CPA superior a `13.90` USD mediante `'ALERTA [!]: CPA sobre umbral'` frente a `'NORMAL [OK]: CPA en rango'`.
4. **`c1-viz-04-tablas-numericas`**:
   - Ejemplo de sección: tabla regional de 2024 con conteo de tiendas, pedidos, ingreso total, ticket medio y cuota porcentual redondeada a 1 decimal.
   - Ejemplo guiado: comparación de tiendas `flagship` en 2024 pasando de decimales flotantes crudos y orden alfabético a 2 decimales fijos, código de país, ticket medio e ingreso por metro cuadrado (`ingreso_m2_usd`).
   - Práctica: tabla de resumen por `store_type` en 2024 (`retail`: `1519007.3` USD / `55.6 %`, `flagship`: `622292.46` USD / `22.8 %`, `warehouse`: `590216.74` USD / `21.6 %`).

---

## 4. Glosario modular (Paso 5)

Se documentaron y validaron 7 términos nuevos en `docs/curriculo/investigacion/c1-viz-glossary.json`:
1. `codificacion-visual` (*Visual Encoding*)
2. `jerarquia-perceptual` (*Graphical Perception Hierarchy*)
3. `tinta-proporcional` (*Principle of Proportional Ink*)
4. `indice-base-100` (*Indexed Series Base 100*)
5. `paleta-divergente` (*Diverging Color Palette*)
6. `contraste-no-textual` (*Non-text Contrast & Redundant Coding*)
7. `cifras-tabulares` (*Tabular Numerals*)

---

## 5. Proyecto del módulo `c1-viz` y rúbrica verificable (Paso 6)

### Especificación en `src/data/catalog/modules.js`
- **Enunciado (`prompt`):** Diagnosticar y rediseñar tres visualizaciones defectuosas de las ventas y entregas de Mercado Brisa.
- **Tablas (`dataset`):** Mercado Brisa (`orders`, `stores` y `calendar`).
- **Entregable (`deliverable`):** Tres gráficos corregidos con título activo, escala honesta y nota técnica justificando cada decisión visual.

### Escenario detallado del proyecto
El comité operativo de Mercado Brisa (empresa ficticia) recibe un informe trimestral con tres piezas defectuosas:
1. **Pieza 1 (Geometría equivocada):** Un gráfico circular en 3D con las 14 tiendas de `stores` ordenadas alfabéticamente para responder qué tiendas aportan más ingreso en 2024.
2. **Pieza 2 (Eje truncado y eje doble):** Un gráfico de barras del ticket medio trimestral con el eje vertical recortado entre `410` y `430` USD superpuesto con una línea de conteo de pedidos en un segundo eje vertical.
3. **Pieza 3 (Color inaccesible y tabla desalineada):** Una tabla resumen por región y tipo de tienda con números centrados, 6 decimales de coma flotante y celdas coloreadas solo en rojo o verde sin texto ni referencia contra la meta.

### Rúbrica de evaluación verificable (4 criterios, escala 0 a 4, mínimo 3 por criterio)

| Criterio | 0–1 (Insuficiente) | 2 (En desarrollo) | 3 (Competente — mínimo requerido) | 4 (Excelente) |
|---|---|---|---|---|
| **1. Elección de geometría y orden jerárquico (`c1-viz-01`)** | Conserva gráficos circulares para más de 4 categorías o presenta barras en orden arbitrario. | Cambia el gráfico circular por barras, pero mantiene orden alfabético o no incluye la participación porcentual. | Sustituye el gráfico circular de 14 tiendas por barras horizontales ordenadas de mayor a menor ingreso e incluye el porcentaje sobre el total verificado en SQL. | Además de ordenar las barras horizontales y mostrar la cuota porcentual, agrupa la cola en una categoría de contexto cuando corresponde y redacta un título activo con la cifra principal. |
| **2. Honestidad de escalas y manejo de unidades (`c1-viz-02`)** | Mantiene ejes de barras truncados o conserva un eje doble con dos unidades distintas superpuestas. | Inicia las barras en cero, pero sigue superponiendo dólares y conteo de pedidos en un eje doble. | Inicia todo gráfico de barras en `0` y elimina el eje doble separando las series en dos paneles alineados o transformándolas a un índice base `100.0` con SQL verificable. | Calcula en SQL tanto la variación porcentual respecto al promedio anual como la serie indexada a base `100.0` y justifica por escrito el factor de distorsión evitado. |
| **3. Uso intencional del color y accesibilidad WCAG (`c1-viz-03`)** | Usa más de 7 colores saturados sin jerarquía o codifica alertas únicamente con rojo y verde. | Reduce la paleta, pero depende solo del color para distinguir cumplimientos e incumplimientos de meta. | Aplica una paleta secuencial o divergente acorde al dato, reserva el color de acento para las excepciones y añade etiquetas o signos (`+`, `-`, `[!]`) con contraste mínimo 3:1 en marcas y 4.5:1 en texto. | Verifica explícitamente que la codificación se entienda en escala de grises y ante deuteranopía (paleta azul-naranja tipo Okabe-Ito) e incluye la columna de etiqueta accesible desde la consulta SQL. |
| **4. Diseño tipográfico y precisión de tabla numérica (`c1-viz-04`)** | Presenta números centrados o con cantidad variable de decimales de coma flotante y sin fila o columna de contexto. | Redondea los importes, pero mantiene orden alfabético o carece de tasas comparativas (ticket medio, cuota o ingreso por m²). | Alinea texto a la izquierda, códigos de longitud fija al centro y números a la derecha con cifras tabulares (`tabular-nums`), decimales uniformes (`ROUND(..., 2)`) y orden descendente por la métrica principal. | Incorpora métricas normalizadas (`ticket_medio_usd`, `ingreso_m2_usd` y `pct_ingreso_total`), separa grupos con jerarquía limpia y concilia los totales al centavo contra `orders` en DuckDB. |
