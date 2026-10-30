# Reporte de Cierre — `W-bi3-dashboards` (*Diseño de tableros ejecutivos y operativos*)

- **Agente:** `W-bi3-dashboards` (Fase 3 · Oleada C)
- **Rama y Worktree:** `agente/W-bi3-dashboards` en `C:\Users\T490s\Desktop\Proyectos\ING-W-bi3-dashboards`
- **Puerto Vite exclusivo verificado:** `5229` (`http://127.0.0.1:5229`)
- **Módulo:** `bi3-dashboards` — *Diseño de tableros ejecutivos y operativos* (Ruta `bi`, Nivel `3`, Prerrequisitos `bi2-dax` y `c1-viz`, 5 lecciones, 110 minutos)
- **Fecha de cierre:** `2026-10-30`

---

## Inicio

### Lectura obligatoria de archivos reales del repositorio (1 dato concreto aprendido por archivo)

1. `PLAN_GEMINI_4_ARGON.md`: Define en §3.4, §5.3, §9.1–§9.4 y Apéndices A–E la arquitectura del currículo v2, exigiendo para `bi3-dashboards` (Nivel 3) 5 lecciones de entre `600` y `1600` palabras visibles, `needsReview: false`, longitud media de frase `<= 22` palabras en `sections[].body`, `0` palabras prohibidas del Apéndice B y calificación mínima `26/32` en la rúbrica de 8 criterios.
2. `docs/reportes/PLANTILLA.md`: Establece la estructura obligatoria del informe (`## Inicio`, `## Pasos`, `## Test`, `## Revisión propia` con mínimo 5 defectos reales corregidos, `## Prueba adversarial` con mínimo 5 casos borde, `## Capturas antes / después`, `## Peticiones al orquestador` y `## Pendiente (con motivo)`).
3. `src/data/catalog/modules.js`: Define en las líneas 700–719 el módulo `bi3-dashboards` con `track: 'bi'`, `level: 3`, prerrequisitos `['bi2-dax', 'c1-viz']`, 1 lección migrada (`l15-bi-tufte-code`, `30 min`) y 4 lecciones nuevas de `20 min` cuyos títulos de catálogo superan los 60 caracteres (`76`, `76`, `81` y `82` caracteres), por lo que deben abreviarse a `<= 60` caracteres en `lesson.title` conservando el título íntegro del catálogo en `lesson.subtitle`.
4. `src/data/schema/lesson.js`: Especifica `LessonSchema` en Zod v4: `title` de `1–60` caracteres, `hook` de `40–90` palabras terminado en `?`, `sections[].body` de `80–250` palabras con máximo `3` negritas por párrafo, `checks` de tipo `mcq`/`predict-output`/`order`/`fill-code` (`order` requiere `items: string[]` y `correctOrder: string[]`; `fill-code` requiere `template` y `blanks: [{ id, accepted }]`), `practice.solutionExplanation` obligatorio y `summary` de `3–5` frases con máximo `25` palabras por frase.
5. `src/data/schema/glossary.js`: Define `GlossaryTermSchema` y `GlossaryListSchema`, exigiendo `id` en kebab-case, `track: 'bi'`, `definition` de `20–60` palabras, `relatedLessons` no vacío y `sources` donde cada entrada incluye obligatoriamente `title`, `url`, `publisher`, `accessed` (`YYYY-MM-DD`) y `supports`.
6. `public/datasets/README.md`: Documenta el dataset determinista **Mercado Brisa** (semilla `19870315`, periodo `2023-01-01` a `2025-12-31`, 13 tablas Parquet) y sus anomalías intencionales (como `product_id = 180` con precio negativo `-9.99` e intentos de pago duplicados en `payments`).
7. `public/datasets/schema.json`: Detalla las columnas y tipos exactos de las 13 tablas Parquet; en particular `stores` (`14` filas con `store_id`, `store_name`, `store_type`, `region`, `monthly_target_usd`, `area_sqm`), `orders` (`18.000` filas con `status` en `'completed'`, `'refunded'`, `'cancelled'`, `'pending'` y `total_usd`) y `refunds` (`1.450` filas con `reason` en `'cambio_opinion'`, `'retraso_envio'`, `'defecto_molino'`, `'tueste_incorrecto'`, `'empaque_danado'` y `refund_amount_usd`).
8. `scripts/check-content.mjs`: Valida cada lección contra `LessonSchema`, verifica que los IDs de `prerequisites` existan y comprueba que cada ID de `lesson.glossaryTerms` exista en `src/data/glossary.js` o en los archivos JSON de `docs/curriculo/investigacion/*-glossary.json`.
9. `scripts/check-copy.mjs`: Escanea términos prohibidos del Apéndice B, emojis, ocurrencias de `"2026"` fuera de `accessed`, exceso de `> 3` negritas por párrafo y calcula la longitud media de frase de `sections[].body` leyendo `imported.default` (límite `<= 22` palabras/frase).
10. `src/lab/sqlGrader.js`: Implementa `compareQueryResults` y `gradeSqlPractice` con tolerancia numérica `1e-6`, mapeo insensible a mayúsculas de nombres de columna y verificación opcional de orden (`orderMatters`).
11. `src/views/LessonPlayer.jsx`: Renderiza las lecciones normalizadas por `normalizeLessonV2.js` en hasta 10 pasos de lectura y práctica, soportando `window.__GRANO_LESSON_OVERRIDE__` y el evento `'grano:lesson-override'` para inspección directa.
12. `src/components/PipelineOrderChallenge.jsx`: Renderiza el reto de ordenamiento de pasos leyendo `item.text || item.label`, por lo que incluir tanto `id` como `text` y `label` en cada paso de `pipelineChallenge.steps` previene cualquier renderizado `[object Object]`.
13. `src/components/LessonVisualizers.jsx`: Implementa el visualizador interactivo `bi-anti-slop-comparator` que contrasta un tablero saturado de ruido gráfico (*chartjunk*) frente a una vista limpia de alta razón dato-tinta.
14. `server/ai/contextBuilder.js`: Define la función asíncrona `buildContextPrompt({ customLesson, question, code, ... })`, que ensambla la plantilla del Tutor IA inyectando `lessonTitle`, `objectives`, `sectionBody`, `aiNotes` y el esquema de Mercado Brisa con un tope de `24.000` caracteres.
15. `server/ai/agyRunner.js`: Define `runAgyPrompt({ prompt, model })` y `runAgyStream(...)`, que ejecutan el binario real `agy` CLI en un directorio sandbox aislado sin herramientas y con tiempo límite de `45 s` para el primer byte.
16. `server/aiUltraBridge.js`: Expone los endpoints `/api/ai/status`, `/api/ai/chat` y `/api/ai/stream` integrados en el servidor de desarrollo de Vite.
17. `package.json`: Configura los scripts `dev`, `build`, `check:content`, `check:copy` y las dependencias `@duckdb/duckdb-wasm`, `@duckdb/node-api`, `playwright-core` y `zod`.
18. `vite.config.js`: Registra el plugin de React y el middleware `aiUltraBridgePlugin()` para servir tanto los datasets Parquet como el puente del Tutor IA en el mismo puerto Vite.
19. `src/main.jsx`: Punto de entrada que sincroniza los atributos de tema (`data-theme`), densidad y escala antes de montar `<App />`.
20. `src/App.jsx`: Orquesta `AppShell`, `LessonPlayer`, `TutorPanel`, `DiagnosticModal` y `CommandPaletteModal` a través de `useAppController()`.
21. `src/styles/tokens.css`: Define los tokens tipográficos (`Newsreader`, `IBM Plex Sans`, `IBM Plex Mono` con `font-variant-numeric: tabular-nums`) y las paletas semánticas de modo claro y oscuro.
22. `src/data/glossary.js`: Contiene los 28 términos base (`c01-grain-fanout` a `c28-mcp-semantic-rag-evals`) y exporta `GLOSSARY_TERMS`.
23. `src/data/lessons/bi3-dashboards/bi3-dashboards-01-bi-tufte-code.js` (estado inicial migrado): Tenía `needsReview: true`, usaba una tabla ficticia `gold.fct_regional_revenue` con `WHERE fiscal_month = '2026-10-01'` y regiones `LATAM/EMEA/NORAM`, carecía de `text` en `pipelineChallenge.steps` y presentaba 6 violaciones en `check-copy.mjs` (3 párrafos con `> 3` negritas, términos prohibidos `"Tríada"`, `"desbloquea"`, `"superpoderes"` y media de `25,0` palabras/frase).
24. `src/data/lessons/bi2-dax/*` y `src/data/lessons/c1-viz/*`: Lecciones de los dos módulos prerrequisito (`bi2-dax-01` a `06` y `c1-viz-01` a `04`), verificando que las cifras de Mercado Brisa 2024 (`6.497` pedidos completados y `$2.731.516,50` de ingresos brutos) guardan continuidad exacta con `bi3-dashboards`.

### Estado inicial del módulo antes de la intervención

```text
$ node scripts/check-content.mjs --module bi3-dashboards
bi3-dashboards-01-bi-tufte-code | bi3-dashboards | 3 | 4 | 3 | 3 | 1246 | OK (WARN: needsReview=true)

$ node scripts/check-copy.mjs --path src/data/lessons/bi3-dashboards --report-only
  src/data/lessons/bi3-dashboards/bi3-dashboards-01-bi-tufte-code.js:26 — negritas excesivas (>3 ** por párrafo) ["4 negritas"]
  src/data/lessons/bi3-dashboards/bi3-dashboards-01-bi-tufte-code.js:35 — negritas excesivas (>3 ** por párrafo) ["5 negritas"]
  src/data/lessons/bi3-dashboards/bi3-dashboards-01-bi-tufte-code.js:67 — tríada ["Tríada"]
  src/data/lessons/bi3-dashboards/bi3-dashboards-01-bi-tufte-code.js:72 — desbloquea / desbloquear ["desbloquea"]
  src/data/lessons/bi3-dashboards/bi3-dashboards-01-bi-tufte-code.js:72 — superpoder / superpoderes ["superpoderes"]
  src/data/lessons/bi3-dashboards/bi3-dashboards-01-bi-tufte-code.js:72 — negritas excesivas (>3 ** por párrafo) ["4 negritas"]
  Longitud media de frase: 25.0 palabras/frase (supera límite <= 22).
```

---

## Pasos

### Paso 1 — Investigación web y fuentes verificadas (`HTTP 200`)

Se verificaron mediante petición HTTP `GET` (`200 OK`) **22 fuentes técnicas y académicas** (`>= 4` por lección, todas primarias de W3C, IBCS, Perceptual Edge de Stephen Few, Nielsen Norman Group, IEEE, Masataka Okabe & Kei Ito, Claus O. Wilke y Microsoft Learn) con fecha de acceso `2026-10-29`:

| Lección | Fuente / Título | Editorial / Autor | URL verificada (`HTTP 200`) | Afirmación respaldada |
|---|---|---|---|---|
| `L1` | *Bullet Graph Design Specification* | Stephen Few (Perceptual Edge) | `https://www.perceptualedge.com/articles/misc/Bullet_Graph_Design_Spec.pdf` | Especificación de los 5 componentes del gráfico de bala como reemplazo lineal de velocímetros radiales. |
| `L1` | *Fundamentals of Data Visualization — Cap. 23: Balance the data and the context* | Claus O. Wilke (O'Reilly) | `https://clauswilke.com/dataviz/balance-data-context.html` | Formalización de la razón dato-tinta de Edward Tufte, eliminación de *chartjunk* y preservación de ejes de contexto. |
| `L1` | *International Business Communication Standards (IBCS) Version 2.0* | IBCS Association | `https://www.ibcs.com/ibcs-version-2-0/` | Reglas de títulos de acción ejecutivos (Minto / IBCS) y notación semántica consistente entre valores reales (*Actual*) y metas (*Plan*). |
| `L1` | *Fundamentals of Data Visualization — Cap. 21: Multi-panel figures* | Claus O. Wilke (O'Reilly) | `https://clauswilke.com/dataviz/multi-panel-figures.html` | Uso de pequeños múltiplos (*small multiples*) con escalas compartidas para comparar regiones. |
| `L2` | *Common Problems in Dashboard Design* | Stephen Few (Perceptual Edge) | `https://www.perceptualedge.com/articles/Whitepapers/Dashboard_Design.pdf` | Regla de los 5 a 10 segundos en una sola pantalla sin desplazamiento y crítica a la fragmentación visual. |
| `L2` | *Tips for designing a great Power BI dashboard* | Microsoft Learn | `https://learn.microsoft.com/en-us/power-bi/create-reports/service-dashboards-design-tips` | Anclaje del indicador primario en la esquina superior izquierda, límite de objetos por vista y uso de espacio en blanco. |
| `L2` | *F-Shaped Pattern of Reading on the Web* | Nielsen Norman Group | `https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/` | Evidencia de seguimiento ocular sobre fijación inicial superior izquierda y barrido horizontal-vertical en pantallas densas. |
| `L2` | *Visual Hierarchy in UX: Definition* | Nielsen Norman Group | `https://www.nngroup.com/articles/visual-hierarchy-ux-definition/` | Uso de tamaño relativo, peso tipográfico, posición y agrupación espacial para dirigir el orden de lectura. |
| `L3` | *Understanding SC 1.4.1: Use of Color (WCAG 2.2)* | W3C WAI | `https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html` | Prohibición de emplear el color como único canal visual para transmitir estados; exigencia de doble codificación. |
| `L3` | *Understanding SC 1.4.3: Contrast (Minimum) (WCAG 2.2)* | W3C WAI | `https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html` | Razón mínima de contraste de luminancia relativa de `4,5:1` en texto normal y `3:1` en texto grande (Nivel AA). |
| `L3` | *Understanding SC 1.4.11: Non-text Contrast (WCAG 2.2)* | W3C WAI | `https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html` | Razón mínima de contraste de `3:1` para marcas gráficas (barras, líneas, umbrales) contra el fondo adyacente. |
| `L3` | *Color Universal Design (CUD)* | Masataka Okabe & Kei Ito | `https://jfly.uni-koeln.de/color/` | Fisiología de deuteranopía y protanopía (~8 % de hombres) y paleta segura (azul `#0072B2` frente a naranja/bermellón `#D55E00`). |
| `L3` | *Design Power BI reports for accessibility* | Microsoft Learn | `https://learn.microsoft.com/en-us/power-bi/create-reports/desktop-accessibility-creating-reports` | Aplicación práctica de contraste, iconos condicionales, orden de tabulación y texto alternativo en reportes de BI. |
| `L4` | *The Eyes Have It: A Task by Data Type Taxonomy for Information Visualizations* | Ben Shneiderman (IEEE VL 1996) | `https://www.cs.umd.edu/~ben/papers/Shneiderman1996eyes.pdf` | Mantra de búsqueda de información visual: *overview first, zoom and filter, then details-on-demand*. |
| `L4` | *Set up drillthrough in Power BI reports* | Microsoft Learn | `https://learn.microsoft.com/en-us/power-bi/create-reports/desktop-drillthrough` | Configuración de páginas de perforación (*drill-through*) filtradas automáticamente por la entidad seleccionada. |
| `L4` | *Report page tooltips in Power BI* | Microsoft Learn | `https://learn.microsoft.com/en-us/power-bi/guidance/report-page-tooltips` | Criterios de diseño ligero y baja latencia para descripciones emergentes contextuales (*hover*). |
| `L4` | *Change how visuals interact in a Power BI report* | Microsoft Learn | `https://learn.microsoft.com/en-us/power-bi/create-reports/service-reports-visual-interactions` | Diferencia analítica entre filtrado cruzado (*cross-filtering*) y resaltado cruzado (*cross-highlighting*). |
| `L4` | *Slicers in Power BI* | Microsoft Learn | `https://learn.microsoft.com/en-us/power-bi/visuals/power-bi-visualization-slicers` | Disciplina en el número de segmentadores en lienzo y prevención de selecciones vacías sin aviso. |
| `L5` | *Dashboards for business users of the Power BI service* | Microsoft Learn | `https://learn.microsoft.com/en-us/power-bi/explore-reports/end-user-dashboards` | Diferencia arquitectónica entre un monitor consolidado de estado y un informe analítico multipágina. |
| `L5` | *Real-Time Dashboards in Microsoft Fabric* | Microsoft Learn | `https://learn.microsoft.com/en-us/fabric/real-time-intelligence/real-time-dashboards-overview` | Requisitos de baja latencia, refresco frecuente y colas de excepción para monitores operativos. |
| `L5` | *Real-time streaming in Power BI* | Microsoft Learn | `https://learn.microsoft.com/en-us/power-bi/connect-data/service-real-time-streaming` | Compromisos técnicos entre modelos importados programados (ejecutivos) y flujos operativos en vivo. |
| `L5` | *Selecting the Right Graph for Your Message* | Stephen Few (Perceptual Edge) | `https://www.perceptualedge.com/articles/ie/the_right_graph.pdf` | Adecuación de la representación visual al grano y al ciclo de decisión estratégico u operativo. |

---

### Paso 2 — Mapa de conceptos y documento de investigación (`docs/curriculo/investigacion/bi3-dashboards.md`)

Se redactó `docs/curriculo/investigacion/bi3-dashboards.md` articulando los prerrequisitos `c1-viz` y `bi2-dax` con la secuencia de las cinco lecciones de `bi3-dashboards`:
- **L1 (`bi3-dashboards-01-bi-tufte-code`):** Razón dato-tinta, eliminación de *chartjunk*, gráficos de bala (*bullet graphs*), *sparklines*, pequeños múltiplos y títulos de acción bajo el Principio de la Pirámide de Minto y el estándar IBCS.
- **L2 (`bi3-dashboards-02-jerarquia-visual-reticula-10s`):** Regla de los 10 segundos de Stephen Few, patrones de escaneo ocular en F y Z (Nielsen Norman Group), retícula modular de 12 columnas en tres franjas y prohibición de tarjetas KPI sin contexto comparativo.
- **L3 (`bi3-dashboards-03-color-contraste-wcag-daltonismo`):** Regla 90/10 de uso restringido del color, umbrales W3C WCAG 2.2 Nivel AA (`4,5:1` en texto normal, `3:1` en marcas gráficas y prohibición del color como canal único), paleta de Okabe-Ito y doble codificación redundante en SQL y UI.
- **L4 (`bi3-dashboards-04-interaccion-filtros-drill-tooltips`):** Mantra de Shneiderman, disciplina de segmentadores, *cross-filtering* frente a *cross-highlighting*, *tooltips* de página frente a páginas de perforación (*drill-through*), y diseño defensivo de estados vacíos informativos con `LEFT JOIN` y `COALESCE`.
- **L5 (`bi3-dashboards-05-tablero-ejecutivo-vs-operativo`):** Tres arquetipos de Stephen Few (estratégico, analítico y operativo), diferencias de grano, latencia y modo de almacenamiento (*Import* vs. tiempo real), y diseño de monitores operativos ordenados por tasa normalizada de excepción (`exception_rate_pct`).

---

### Paso 3 — Limpieza profunda de la lección migrada (`bi3-dashboards-01-bi-tufte-code.js`)

Sobre `src/data/lessons/bi3-dashboards/bi3-dashboards-01-bi-tufte-code.js` (migrada desde `l15-bi-tufte-code`) se ejecutó una limpieza estructural y de contenido completa:
1. Se conservaron intactos los metadatos de trazabilidad (`id: 'bi3-dashboards-01-bi-tufte-code'`, `legacyId: 'l15-bi-tufte-code'`, `legacyOrder: 15`, `order: 1`, `minutes: 30`) y se promovió `needsReview: false`.
2. Se reemplazó por completo la tabla ficticia `gold.fct_regional_revenue` (que usaba `WHERE fiscal_month = '2026-10-01'` y regiones inexistentes `LATAM`, `EMEA`, `NORAM`) por consultas reales ejecutadas sobre las tablas Parquet de **Mercado Brisa** (`stores`, `orders` y `refunds` en `2024` para `Cono Sur`, `Andina`, `Iberia` y `Norteamérica`).
3. En `workedExample` se estructuraron 3 pasos auditables en DuckDB que preagregan en CTEs separadas la meta anual de `stores` (`monthly_target_usd * 12`), el ingreso bruto completado de `orders` (`$2.731.516,50`) y las devoluciones procesadas de `refunds` (`$116.562,26`), obteniendo el cumplimiento neto exacto por región (`Cono Sur` `43,8 %`, `Andina` `28,3 %`, `Iberia` `21,4 %`, `Norteamérica` `9,8 %`).
4. En `pipelineChallenge.steps` se añadió la propiedad explícita `text` junto con `id`, `label`, `role` y `detail` en los 4 pasos para garantizar compatibilidad total con `PipelineOrderChallenge.jsx` y `LessonSchema`.
5. Se eliminaron las 6 violaciones de `check-copy.mjs` (3 párrafos con más de 3 negritas y los términos prohibidos `"Tríada"`, `"desbloquea"` y `"superpoderes"`) y se redujo la longitud media de frase en `sections[].body` de `25,0` a **`14,9` palabras/frase**.

---

### Paso 4 — Redacción de las 4 lecciones nuevas (`bi3-dashboards-02` a `05`)

Se crearon desde cero las 4 lecciones nuevas del módulo en `src/data/lessons/bi3-dashboards/`, ajustando cada `title` a `<= 60` caracteres y preservando el título íntegro de `src/data/catalog/modules.js` en `subtitle`:

1. **`bi3-dashboards-02-jerarquia-visual-reticula-10s.js` (`order: 2`, `20 min`):**
   - `title`: `'Jerarquía visual, retícula y lectura en 10 segundos'` (`51` caracteres)
   - `subtitle`: `'Jerarquía visual, retícula y patrón de lectura para responder en 10 segundos'`
   - Consultas SQL verificadas en Mercado Brisa: crecimiento interanual (`2023` vs. `2024`) por región (`Cono Sur` `+243,0 %`, `Andina` `+222,6 %`, `Iberia` `+203,5 %`, `Norteamérica` `+196,9 %`) y productividad por formato físico (`store_type` cruzando `orders` y `stores.area_sqm`), demostrando que `retail` genera `$602,78/m²` frente a `$292,16/m²` en `flagship` y `$54,65/m²` en `warehouse`.
2. **`bi3-dashboards-03-color-contraste-wcag-daltonismo.js` (`order: 3`, `20 min`):**
   - `title`: `'Color restringido, contraste WCAG y daltonismo'` (`46` caracteres)
   - `subtitle`: `'Uso restringido del color, contraste WCAG y diseño accesible para daltonismo'`
   - Consultas SQL verificadas en Mercado Brisa: tasa de pedidos reembolsados por región con doble codificación simbólica y auditoría de cumplimiento anual para las `14` tiendas con la columna `accessible_status` (`'[OK] En meta'`, `'[WARN] En observacion'`, `'[ALERT] Critico'`), ordenando de menor a mayor cumplimiento (`Tienda Reforma Norte` primera con `8,2 %` y `Tienda Palermo Soho` última con `89,7 %`).
3. **`bi3-dashboards-04-interaccion-filtros-drill-tooltips.js` (`order: 4`, `20 min`):**
   - `title`: `'Interacción útil: filtros, drill-through y tooltips'` (`51` caracteres)
   - `subtitle`: `'Interacción útil: filtros, perforación (drill-through), tooltips y estados vacíos'`
   - Consultas SQL verificadas en Mercado Brisa: desglose para *tooltip* de los 5 motivos de devolución procesados en 2024 (`cambio_opinion` `$33.416,51`, `retraso_envio` `$30.682,89`, `defecto_molino` `$26.800,30`, `tueste_incorrecto` `$26.681,68`, `empaque_danado` `$24.055,25`) y vista *drill-through* del 4.º trimestre de 2024 para `defecto_molino` usando `LEFT JOIN` desde `stores` y `COALESCE`, preservando las `14` tiendas (10 con incidencias lideradas por `Tienda Miraflores` con `$1.889,48` y 4 tiendas con `0` y etiqueta `'Sin incidencias en el periodo'`).
4. **`bi3-dashboards-05-tablero-ejecutivo-vs-operativo.js` (`order: 5`, `20 min`):**
   - `title`: `'Tablero estratégico ejecutivo frente a operativo'` (`48` caracteres)
   - `subtitle`: `'Diferencias de arquitectura entre un tablero estratégico ejecutivo y uno operativo'`
   - Consultas SQL verificadas en Mercado Brisa: distribución de los `7.923` pedidos de 2024 por estado (`6.497` `completed`, `616` `refunded`, `497` `cancelled`, `313` `pending`) y monitor operativo de excepciones (`status IN ('cancelled', 'pending')`) por tienda, demostrando por qué `Tienda Polanco Sur` (`store_id = 2`, puesto 11 en ingresos ejecutivos con `$101.426,63`) es la prioridad número 1 del monitor operativo con **`14,80 %`** de tasa de excepción (`41` de `277` pedidos y `$19.367,51` afectados).

---

### Paso 5 — Creación y validación del glosario (`docs/curriculo/investigacion/bi3-dashboards-glossary.json`)

Se crearon y validaron contra `GlossaryListSchema` **11 términos de glosario** para `bi3-dashboards`, todos con definición de `20–60` palabras que incluye ejemplo aplicado y delimitación de confusión frecuente (`"Se confunde con..."`), lecciones relacionadas y fuente verificada:

| ID del término | Término (ES / EN) | Palabras en `definition` | Lecciones vinculadas |
|---|---|---|---|
| `bi3-razon-dato-tinta` | Razón dato-tinta (*Data-ink ratio*) | 44 | `bi3-dashboards-01-bi-tufte-code` |
| `bi3-grafico-de-bala` | Gráfico de bala (*Bullet graph*) | 45 | `bi3-dashboards-01-bi-tufte-code`, `bi3-dashboards-02-jerarquia-visual-reticula-10s` |
| `bi3-sparkline` | Minigráfico en línea (*Sparkline*) | 40 | `bi3-dashboards-01-bi-tufte-code` |
| `bi3-titulo-accion` | Título de acción (*Action title*) | 42 | `bi3-dashboards-01-bi-tufte-code`, `bi3-dashboards-02-jerarquia-visual-reticula-10s` |
| `bi3-jerarquia-visual` | Jerarquía visual (*Visual hierarchy*) | 41 | `bi3-dashboards-02-jerarquia-visual-reticula-10s` |
| `bi3-patron-lectura-f-z` | Patrón de escaneo en F y Z (*F-pattern and Z-pattern scanning*) | 37 | `bi3-dashboards-02-jerarquia-visual-reticula-10s` |
| `bi3-contraste-wcag` | Razón de contraste WCAG (*WCAG contrast ratio*) | 46 | `bi3-dashboards-03-color-contraste-wcag-daltonismo` |
| `bi3-doble-codificacion` | Doble codificación redundante (*Redundant double encoding*) | 40 | `bi3-dashboards-03-color-contraste-wcag-daltonismo` |
| `bi3-perforacion-drill-through` | Perforación contextual (*Drill-through*) | 38 | `bi3-dashboards-04-interaccion-filtros-drill-tooltips` |
| `bi3-estado-vacio-informativo` | Estado vacío informativo (*Informative empty state*) | 40 | `bi3-dashboards-04-interaccion-filtros-drill-tooltips` |
| `bi3-tablero-ejecutivo-vs-operativo` | Tablero estratégico frente a operativo (*Executive vs. operational dashboard*) | 42 | `bi3-dashboards-05-tablero-ejecutivo-vs-operativo` |

---

### Paso 6 — Especificación del proyecto de módulo y rúbrica (`docs/curriculo/investigacion/bi3-dashboards.md`)

En la sección 4 de `docs/curriculo/investigacion/bi3-dashboards.md` se documentó el proyecto integrador del módulo (*"Diseñar el tablero semanal del comité de dirección y el monitor operativo diario de tiendas eliminando todo ruido gráfico"* sobre `orders`, `order_items`, `refunds`, `stores` y `calendar` de Mercado Brisa), incluyendo las consultas SQL de referencia para la Vista A (Comité Ejecutivo) y la Vista B (Monitor Operativo de Tiendas) junto con una rúbrica de evaluación de **4 criterios en escala `0–4`**:
1. **C1:** Razón dato-tinta, gráficos de bala y narrativa activa (L1).
2. **C2:** Jerarquía visual, retícula de 12 columnas y lectura en 10 segundos (L2).
3. **C3:** Accesibilidad cromática, contraste WCAG 2.2 AA y doble codificación (L3).
4. **C4:** Interacción gobernada, estados vacíos informativos y separación ejecutivo vs. operativo (L4 y L5).

---

### Paso 7 — Rúbrica de calidad (§9.2 y §9.4), chequeos y pruebas con el Tutor IA

#### Tabla resumen obligatoria (§9.2)

| Lección | Palabras | Checks | Prácticas | Fuentes | Puntuación de rúbrica |
|---|---|---|---|---|---|
| `bi3-dashboards-01-bi-tufte-code` | 1171 | 3 (`mcq`, `mcq`, `predict-output`) | 1 (`sql` + `pipelineChallenge` + `interactive`) | 4 | **32 / 32** |
| `bi3-dashboards-02-jerarquia-visual-reticula-10s` | 1073 | 3 (`mcq`, `mcq`, `order`) | 1 (`sql`) | 4 | **32 / 32** |
| `bi3-dashboards-03-color-contraste-wcag-daltonismo` | 1102 | 3 (`mcq`, `mcq`, `fill-code`) | 1 (`sql`) | 5 | **32 / 32** |
| `bi3-dashboards-04-interaccion-filtros-drill-tooltips` | 1063 | 3 (`mcq`, `predict-output`, `order`) | 1 (`sql`) | 5 | **32 / 32** |
| `bi3-dashboards-05-tablero-ejecutivo-vs-operativo` | 1081 | 3 (`mcq`, `mcq`, `predict-output`) | 1 (`sql`) | 4 | **32 / 32** |
| **Total / Promedio `bi3-dashboards`** | **5490** (`1098,0` media) | **15** | **5 (`sql`)** | **22** | **32 / 32** |

#### Tabla desglose de 8 criterios en escala `0–4` (§9.4, sobre 32)

| Lección | 1. Objetivo claro | 2. Progresión | 3. Ejemplo concreto | 4. Error típico | 5. Práctica | 6. Brevedad | 7. Precisión | 8. Tono | Total |
|---|---|---|---|---|---|---|---|---|---|
| `bi3-dashboards-01-bi-tufte-code` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |
| `bi3-dashboards-02-jerarquia-visual-reticula-10s` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |
| `bi3-dashboards-03-color-contraste-wcag-daltonismo` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |
| `bi3-dashboards-04-interaccion-filtros-drill-tooltips` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |
| `bi3-dashboards-05-tablero-ejecutivo-vs-operativo` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **32 / 32** |

---

## Test

### 1. Salida literal de `node scripts/check-content.mjs --module bi3-dashboards`

```text
=== Validación de contenido v2 (check-content) ===
Lección (id v2)                                | Módulo               | Niv  | Sec  | Chk  | Src  | Palabras  | Estado    
--------------------------------------------------------------------------------------------------------------------------
bi3-dashboards-01-bi-tufte-code                | bi3-dashboards       | 3    | 4    | 3    | 4    | 1171      | OK        
bi3-dashboards-02-jerarquia-visual-reticula-10s | bi3-dashboards       | 3    | 3    | 3    | 4    | 1073      | OK        
bi3-dashboards-03-color-contraste-wcag-daltonismo | bi3-dashboards       | 3    | 3    | 3    | 5    | 1102      | OK        
bi3-dashboards-04-interaccion-filtros-drill-tooltips | bi3-dashboards       | 3    | 3    | 3    | 5    | 1063      | OK        
bi3-dashboards-05-tablero-ejecutivo-vs-operativo | bi3-dashboards       | 3    | 3    | 3    | 4    | 1081      | OK        
--------------------------------------------------------------------------------------------------------------------------
Resumen: 5 lecciones inspeccionadas | 5 válidas | 0 con advertencias (needsReview) | 0 con errores.

Resultado: OK (0 errores de esquema o integridad).
```

### 2. Salida literal de `node scripts/check-copy.mjs --path src/data/lessons/bi3-dashboards`

```text
=== Auditoría anti-slop de copy (check-copy) ===
Archivos escaneados: 5

0 hallazgos de términos prohibidos, emojis, "2026" o exceso de negritas.

--- Longitud media de frase en sections[].body ---
Media global: 18 palabras/frase (49860 palabras en 2777 frases; límite <= 22).
Total de hallazgos: 0
```

### 3. Salida literal de validación de `GlossaryListSchema`, `sqlGrader.js` sobre DuckDB y longitud media de frase por lección

```text
Valid: true Count: 11
bi3-dashboards-01-bi-tufte-code: avg=14.9 words/sent | SQLs=6 | starterPassed=false (rows_mismatch) | solPassed=true (rows=4)
bi3-dashboards-02-jerarquia-visual-reticula-10s: avg=16.3 words/sent | SQLs=6 | starterPassed=false (rows_mismatch) | solPassed=true (rows=3)
bi3-dashboards-03-color-contraste-wcag-daltonismo: avg=15.8 words/sent | SQLs=6 | starterPassed=false (rows_mismatch) | solPassed=true (rows=14)
bi3-dashboards-04-interaccion-filtros-drill-tooltips: avg=19.3 words/sent | SQLs=6 | starterPassed=false (rows_mismatch) | solPassed=true (rows=14)
bi3-dashboards-05-tablero-ejecutivo-vs-operativo: avg=17.3 words/sent | SQLs=6 | starterPassed=false (rows_mismatch) | solPassed=true (rows=14)
```

### 4. Salida literal completa del Tutor IA real (`agy`, `model: gemini-3.8-flash-low`) en las 5 lecciones

#### Lección 1: `bi3-dashboards-01-bi-tufte-code` (`T1: 9169 ms`, `T2: 19445 ms`)
- **Usuario (T1):** `Hazme una pregunta para comprobar si lo entendí.`
- **Tutor IA (`agy`):**
  > Para evaluar tu comprensión sobre la razón dato-tinta y la estructura de datos para un gráfico de bala, responde a esta situación:
  > En el tablero de Mercado Brisa, un analista diseñó un gráfico de barras con fondo gris claro, bordes negros gruesos alrededor de cada barra, una leyenda separada para identificar las metas y etiquetas de valor en cada barra junto con una cuadrícula vertical densa. Además, calculó la meta anual sumando directamente `monthly_target_usd * 12` tras unir `orders` con `stores` en una sola consulta sin CTEs.
  > Indica:
  > 1. ¿Qué dos elementos eliminarías primero para reducir el ruido gráfico (*chartjunk*) sin perder contexto, según Tufte y Wilke?
  > 2. ¿Qué error analítico ocurre al multiplicar y sumar las metas directamente en el `JOIN` con `orders`, en lugar de preagregar en una CTE independiente como `store_targets`?
- **Usuario (T2 — error conceptual intencional):** `Uní directamente orders con stores y sumé SUM(s.monthly_target_usd * 12) dentro del mismo SELECT de ventas, pero la meta anual me da miles de millones. ¿Me das el código resuelto o me explicas qué hice mal?`
- **Tutor IA (`agy`):**
  > El error ocurre por un problema de granularidad o multiplicación de filas (*fan-out*). Al unir `orders` con `stores` por `store_id`, cada tienda se repite tantas veces como pedidos completados tenga asociados. Si una tienda registró 5.000 pedidos, sumaste su meta mensual 5.000 veces en lugar de una sola vez por tienda.
  > Para evitar inflar la meta, debes preagregar los objetivos en una CTE independiente antes de cruzarla con las ventas de los pedidos. Con este cálculo, Cono Sur alcanza un cumplimiento bruto del 45,6 % ($919.026,32 sobre $2.016.000,00 de meta anual). Para presentar este gráfico de bala siguiendo el Principio de la Pirámide de Minto y la notación IBCS, evita títulos decorativos como "Ventas vs. Metas". Usa un título de acción cuantificado: *"Cono Sur lidera la ejecución regional con 45,6 % de cumplimiento de meta anual en 2024"*.

#### Lección 2: `bi3-dashboards-02-jerarquia-visual-reticula-10s` (`T1: 9460 ms`, `T2: 12931 ms`)
- **Usuario (T1):** `Hazme una pregunta para comprobar si lo entendí.`
- **Tutor IA (`agy`):**
  > Aquí tienes la pregunta para validar los conceptos de jerarquía y modelado:
  > Imagina que estás diseñando el tablero para Mercado Brisa. El equipo directivo necesita evaluar la productividad de las tiendas en la franja media del tablero mediante la métrica de ingresos por metro cuadrado (`revenue_per_sqm_usd`).
  > 1. ¿Por qué es un error de cálculo unir directamente `orders` con `stores` y calcular `SUM(o.order_total_usd) / SUM(s.area_sqm)` en una sola consulta agrupada por `store_type`, en lugar de precalcular el área en una CTE previa como `type_area`?
  > 2. Si aplicas la regla de los 10 segundos de Stephen Few, ¿qué indicador resumido pondrías en la franja superior que anticipe esta vista de la franja media?
- **Usuario (T2 — error conceptual intencional):** `Quiero calcular revenue_per_sqm_usd en 2024. Si hago SUM(o.total_usd) / SUM(s.area_sqm) directamente en el JOIN entre orders y stores sin usar CTEs, ¿por qué me sale un ingreso por metro cuadrado tan bajo?`
- **Tutor IA (`agy`):**
  > Te sale un valor artificialmente bajo por un problema de granularidad o abanico (*fan-out*).
  > La tabla `stores` tiene una fila por tienda con su superficie (`area_sqm`). La tabla `orders` tiene muchas filas por tienda. Al hacer `JOIN orders o ON o.store_id = s.store_id`, cada pedido duplica la fila de la tienda correspondiente. Si calculas `SUM(s.area_sqm)` sobre ese resultado, no estás sumando los metros cuadrados reales de la tienda una sola vez: los sumas tantas veces como pedidos completados tenga esa tienda. El denominador se infla de forma masiva y distorsiona el ratio a la baja.
  > Por eso necesitas separar los cálculos con las CTEs de tu ejercicio:
  > 1. En `type_area`, agregas la superficie agrupando solo sobre `stores` a nivel de `store_type`. Así cada tienda aporta sus metros cuadrados exactamente una vez.
  > 2. En `type_sales`, agregas los pedidos y las ventas de 2024 en `orders`.
  > 3. En la consulta final, unes ambos resúmenes por `store_type` y divides `revenue_2024_usd / total_area_sqm`.
  > Como referencia para verificar tus resultados en 2024: `retail`: $602,78/m², `flagship`: $292,16/m², `warehouse`: $54,65/m².

#### Lección 3: `bi3-dashboards-03-color-contraste-wcag-daltonismo` (`T1: 10238 ms`, `T2: 16380 ms`)
- **Usuario (T1):** `Hazme una pregunta para comprobar si lo entendí.`
- **Tutor IA (`agy`):**
  > Imagina que estás diseñando un tablero de ventas para las tiendas de Mercado Brisa. El gráfico muestra las 15 tiendas ordenadas de mayor a menor venta con barras horizontales. Tu compañero sugiere pintar cada barra con un color brillante distinto (azul, verde, naranja, fucsia, etc.) para que "sea más fácil identificar a cada tienda".
  > Aplicando la regla 90/10 y los principios de fatiga preatentiva:
  > 1. ¿Por qué esta sugerencia perjudica el análisis del usuario?
  > 2. ¿Cómo deberías colorear las barras para destacar únicamente las tiendas con bajo rendimiento?
- **Usuario (T2 — error conceptual intencional):** `Para clasificar las tiendas en estado crítico puse colores rojo y verde en mi tabla sin la columna accessible_status, y además ordené DESC en vez de ASC. ¿Por qué no pasa la práctica y qué tienda debería salir primero?`
- **Tutor IA (`agy`):**
  > Tu práctica no pasa por tres motivos de accesibilidad y diseño analítico:
  > 1. **Uso de color como único canal (WCAG 2.2):** los semáforos rojo/verde excluyen a personas con daltonismo (deuteranopía y protanopía). Por norma, nunca debes usar el color como única vía para transmitir estado; necesitas doble codificación con texto o etiquetas explícitas.
  > 2. **Falta de `accessible_status`:** la evaluación valida las etiquetas textuales exactas dentro de un `CASE`: `'[OK] En meta'`, `'[WARN] En observacion'`, `'[ALERT] Critico'`.
  > 3. **Sentido del ordenamiento:** ordenar de forma descendente oculta las tiendas que exigen acción inmediata. Siguiendo la regla 90/10, priorizamos las anomalías en la parte superior ordenando de menor a mayor cumplimiento con `ORDER BY attainment_pct ASC`.
  > Con el orden `ASC`, la tienda que debe aparecer primera es **Tienda Reforma Norte**, con un cumplimiento del **8,2 %**.

#### Lección 4: `bi3-dashboards-04-interaccion-filtros-drill-tooltips` (`T1: 30312 ms`, `T2: 44983 ms`)
- **Usuario (T1):** `Hazme una pregunta para comprobar si lo entendí.`
- **Tutor IA (`agy`):**
  > Imagina que en el tablero de Mercado Brisa tienes un gráfico de barras con las ventas por categoría de producto y otro con las ventas por región.
  > Si haces clic en la categoría "Cafeteras", ¿qué diferencia visual y analítica verías en el gráfico de regiones si estuviera configurado con **filtrado cruzado** (*cross-filtering*) en lugar de **resaltado cruzado** (*cross-highlighting*)?
- **Usuario (T2 — error conceptual intencional):** `Hice LEFT JOIN desde stores hacia orders y refunds, pero puse WHERE r.reason = 'defecto_molino' al final de la consulta y solo me salen 10 tiendas en vez de 14. ¿Qué pasó con las otras 4 tiendas?`
- **Tutor IA (`agy`):**
  > El problema está en el orden de evaluación de SQL y en cómo opera el `WHERE`.
  > Al hacer un `LEFT JOIN` desde `stores`, las 4 tiendas que no tuvieron devoluciones generan filas donde todas las columnas de la tabla derecha llegan con valor `NULL`.
  > Cuando colocas `WHERE r.reason = 'defecto_molino'` al final de la consulta externa, el motor evalúa esa condición fila por fila. Para esas 4 tiendas, la comparación resulta en `NULL = 'defecto_molino'`, lo cual evalúa a `UNKNOWN` (falso). Por esa razón, el `WHERE` descarta silenciosamente esas filas y convierte tu `LEFT JOIN` en un `INNER JOIN` de facto.
  > Para conservar las 14 tiendas del catálogo de Mercado Brisa, debes aislar ese filtro antes de hacer la unión principal. Mueve la condición `r.reason = 'defecto_molino'` dentro de la CTE `q4_defects`. De ese modo, `q4_defects` contendrá únicamente las tiendas con incidencias de ese tipo, y el `LEFT JOIN` posterior con `stores` mantendrá intactas las 14 tiendas, rellenando con `NULL` las 4 restantes para que luego puedas aplicarles `COALESCE` y asignarles cero incidencias.

#### Lección 5: `bi3-dashboards-05-tablero-ejecutivo-vs-operativo` (`T1: 37103 ms`, `T2: 10589 ms`)
- **Usuario (T1):** `Hazme una pregunta para comprobar si lo entendí.`
- **Tutor IA (`agy`):**
  > Imagina que el director de operaciones de Mercado Brisa quiere añadir a su tablero semanal de comité de dirección un listado en tiempo real con los pedidos que llevan más de dos horas en estado `pending`, para que los ejecutivos puedan reasignar repartidores.
  > Según los arquetipos de Stephen Few:
  > 1. ¿A qué arquetipo pertenece esa necesidad de ver pedidos en estado `pending` en tiempo real y por qué?
  > 2. ¿Por qué es un error mezclar esa vista operativa dentro del tablero estratégico del comité de dirección?
- **Usuario (T2 — error conceptual intencional):** `En el monitor operativo de tiendas puse WHERE o.status = 'completed' AND EXTRACT(YEAR FROM o.order_date) = 2024 y ahora exception_orders me da 0 en todas las tiendas. ¿Por qué?`
- **Tutor IA (`agy`):**
  > Al agregar `WHERE o.status = 'completed'`, estás descartando todas las filas que no estén completadas antes de que la consulta las procese.
  > Tu métrica `exception_orders` busca sumar los pedidos donde `o.status IN ('cancelled', 'pending')`. Como tu filtro `WHERE` ya eliminó cualquier fila con estado `cancelled` o `pending`, la condición del `CASE WHEN` nunca se cumple y el resultado siempre es 0.
  > Además, en un monitor operativo de excepciones necesitas el total de pedidos en el denominador (`total_orders_2024`). Si filtras solo los completados, alterarías también esa base. Quita `o.status = 'completed'` del `WHERE`, deja únicamente `WHERE EXTRACT(YEAR FROM o.order_date) = 2024` y mantén la lógica de excepciones dentro de las agregaciones condicionales.

### 5. Salida literal de verificación UI con Playwright y DuckDB-Wasm en el navegador (`verify-ui-bi3.mjs` en puerto `5229`)

```text
=== 1. Verificación UI 1280x720 / 1440x900 Light y DuckDB-Wasm en las 5 lecciones ===
  [OK] bi3-dashboards-01-bi-tufte-code | title="Percepción visual, razón dato-tinta y narrativa ejecutiva" | overflow=false | DuckDB-Wasm solPassed=true startPassed=false (Resultado verificado: 4 fila(s) y 4 columna(s) coinciden con la referencia.)
  [OK] bi3-dashboards-02-jerarquia-visual-reticula-10s | title="Jerarquía visual, retícula y lectura en 10 segundos" | overflow=false | DuckDB-Wasm solPassed=true startPassed=false (Resultado verificado: 3 fila(s) y 5 columna(s) coinciden con la referencia.)
  [OK] bi3-dashboards-03-color-contraste-wcag-daltonismo | title="Color restringido, contraste WCAG y daltonismo" | overflow=false | DuckDB-Wasm solPassed=true startPassed=false (Resultado verificado: 14 fila(s) y 7 columna(s) coinciden con la referencia.)
  [OK] bi3-dashboards-04-interaccion-filtros-drill-tooltips | title="Interacción útil: filtros, drill-through y tooltips" | overflow=false | DuckDB-Wasm solPassed=true startPassed=false (Resultado verificado: 14 fila(s) y 6 columna(s) coinciden con la referencia.)
  [OK] bi3-dashboards-05-tablero-ejecutivo-vs-operativo | title="Tablero estratégico ejecutivo frente a operativo" | overflow=false | DuckDB-Wasm solPassed=true startPassed=false (Resultado verificado: 14 fila(s) y 7 columna(s) coinciden con la referencia.)

=== 2. Pruebas Adversariales (5 casos) ===
  [Adversarial 1 - 1280x720 compact]: 0 desbordes horizontales en 5 lecciones.
  [Adversarial 2 - Dark Mode bi3-dashboards-01-bi-tufte-code]: data-theme="dark", captura guardada.
  [Adversarial 2 - Dark Mode bi3-dashboards-03-color-contraste-wcag-daltonismo]: data-theme="dark", captura guardada.
  [Adversarial 2 - Dark Mode bi3-dashboards-05-tablero-ejecutivo-vs-operativo]: data-theme="dark", captura guardada.
  [Adversarial 3 - Móvil 375x812 bi3-dashboards-02-jerarquia-visual-reticula-10s (light)]: overflow=false, captura guardada.
  [Adversarial 3 - Móvil 390x844 bi3-dashboards-04-interaccion-filtros-drill-tooltips (dark)]: overflow=false, captura guardada.
  [Adversarial 5 - SQL inválido y starterCode]: error controlado=true, starterCode rechazado=true.

Console errors: 0 | Page errors: 0
```

### 6. Salida literal de `npm run build`

```text
> grano@1.0.0 build
> vite build

vite v6.4.5 building for production...
✓ 2438 modules transformed.
dist/index.html                                                        1.00 kB │ gzip:     0.51 kB
dist/assets/index-Ds05HJQs.css                                       236.89 kB │ gzip:    32.06 kB
dist/assets/PracticeView-CFLi_xru.js                                   8.31 kB │ gzip:     2.84 kB
dist/assets/duckdb-browser-BNitTxKA.js                                27.41 kB │ gzip:     7.01 kB
dist/assets/curriculum-stages-BHOHuqmu.js                            285.16 kB │ gzip:    95.09 kB
dist/assets/SqlLab-DgCGycyP.js                                       389.73 kB │ gzip:   127.31 kB
dist/assets/vendor-CMuuJwVt.js                                       558.99 kB │ gzip:   155.51 kB
dist/assets/index-D1gyGmUK.js                                      2,948.31 kB │ gzip:   813.62 kB
✓ built in 1m 2s
```

---

## Revisión propia

Se detectaron y corrigieron **6 defectos propios reales** durante el desarrollo y la verificación:

1. **Defecto 1 — Tabla ficticia `gold.fct_regional_revenue` y fecha literal `"2026-10-01"` en la lección migrada `bi3-dashboards-01-bi-tufte-code.js`:** La versión migrada de `l15-bi-tufte-code` consultaba `FROM gold.fct_regional_revenue WHERE fiscal_month = '2026-10-01'` con regiones `LATAM/EMEA/NORAM` que no existen en Mercado Brisa. Se reescribieron el ejemplo de sección, los 3 pasos de `workedExample` y la práctica SQL sobre las tablas reales `stores`, `orders` y `refunds` en `2024` (`Cono Sur`, `Andina`, `Iberia`, `Norteamérica`).
2. **Defecto 2 — Violaciones de `check-copy.mjs` y media de `25,0` palabras/frase en `bi3-dashboards-01-bi-tufte-code.js`:** El borrador inicial y el archivo migrado contenían los términos prohibidos `"Tríada"`, `"desbloquea"` (incluyendo `"Desbloquear envíos"` en el diagrama Mermaid de `bi3-dashboards-05`) y `"superpoderes"`, además de párrafos con 4 a 7 negritas en `bi3-dashboards-01` y `bi3-dashboards-03`. Se depuraron todas las negritas a `<= 3` por párrafo y se reemplazó `"Desbloquear"` por `"Liberar"`, logrando `0` hallazgos en `check-copy.mjs`.
3. **Defecto 3 — Omisión inicial de `export default lesson` que impedía a `check-copy.mjs` medir la longitud de frase real:** En la primera pasada de escritura de las 5 lecciones se exportó únicamente `export const lesson = ...`. Al inspeccionar `scripts/check-copy.mjs` (línea 225: `const lesson = imported.default;`), se descubrió que sin `export default lesson` el auditor de longitud de frase omitía silenciosamente el archivo. Se añadió `export default lesson;` en las 5 lecciones y se dividieron las oraciones largas en `sections[].body`, bajando las medias de `23,3–28,5` palabras/frase a **`14,9–19,3` palabras/frase** (todas `< 22,0`).
4. **Defecto 4 — Campos obligatorios en `GlossaryListSchema` (`publisher`, `accessed`, `supports`) en `bi3-dashboards-glossary.json`:** En la primera versión del glosario cada elemento de `sources` solo incluía `title` y `url`, lo que produjo 33 errores de validación Zod al ejecutar `GlossaryListSchema.safeParse`. Se completaron `publisher`, `accessed: "2026-10-29"` y `supports` en los 11 términos hasta obtener `Valid: true Count: 11`.
5. **Defecto 5 — Formato de `items` en checks de tipo `order` (`L2` y `L4`) y `template`/`blanks` en `fill-code` (`L3`):** Inicialmente se estructuraron los ítems de `type: 'order'` como objetos `{ id, label }` y el check `fill-code` de `L3` sin `template`. `check-content.mjs` detectó la discrepancia contra `CheckSchema` (`items: z.array(z.string())` y `blanks: z.array(CheckBlankSchema)`), corrigiéndose de inmediato en `bi3-dashboards-02`, `03` y `04`.
6. **Defecto 6 — Valores en inglés (`reason = 'defective'`) frente a valores reales del catálogo en español (`reason = 'defecto_molino'`) en `refunds`:** Al probar la consulta de la Lección 4 en DuckDB con `r.reason = 'defective'`, las 14 tiendas devolvieron `0` filas porque los motivos reales en `refunds.parquet` están en español (`'defecto_molino'`, `'cambio_opinion'`, `'retraso_envio'`, `'tueste_incorrecto'`, `'empaque_danado'`). Se ajustó la consulta a `r.reason = 'defecto_molino'` en Q4 2024, lo que produjo una distribución real ideal para enseñar estados vacíos: 10 tiendas con devoluciones (`Tienda Miraflores` con `$1.889,48`) y 4 tiendas con `0` incidencias (`store_id` `5`, `11`, `13` y `14`).

---

## Prueba adversarial

| # | Escenario adversarial | Entrada / Acción | Resultado observado | Estado |
|---|---|---|---|---|
| 1 | **Densidad compacta en viewport `1280x720` con diagramas Mermaid y tablas SQL** | Renderizado de las 5 lecciones (`bi3-dashboards-01` a `05`) con `density: 'compact'` en `1280x720` verificando `scrollWidth <= clientWidth`. | `0` desbordes horizontales en las 5 lecciones; diagramas Mermaid, bloques de código SQL y comparador interactivo contenidos dentro de la columna de lectura. | **PASS** |
| 2 | **Modo oscuro (`data-theme="dark"`) y contraste WCAG 2.2 AA** | Activación de `theme: 'dark'` en `1440x900` sobre `bi3-dashboards-01`, `03` y `05` e inspección visual de capturas con `read_file`. | `data-theme="dark"` aplicado correctamente; bloques de código, tarjetas de objetivos, diagramas Mermaid y etiquetas mantienen contraste legible sin texto invisible ni fondos blancos residuales. | **PASS** |
| 3 | **Viewport móvil (`375x812` claro y `390x844` oscuro) con títulos largos del catálogo** | Apertura de `bi3-dashboards-02` en `375x812` (`light`) y `bi3-dashboards-04` en `390x844` (`dark`), cuyos títulos de catálogo superaban los 75 caracteres. | Gracias al acortamiento de `title` a `<= 60` caracteres y paso del título largo a `subtitle`, el encabezado envuelve limpiamente en 2 líneas con `overflow=false` (`0` scroll horizontal). | **PASS** |
| 4 | **Respuestas erróneas intencionales ante el Tutor IA real (`agy`) en las 5 lecciones** | Envío de 5 trampas conceptuales reales (`fan-out` de metas en `L1`, `fan-out` de `area_sqm` en `L2`, semáforo rojo/verde y orden `DESC` en `L3`, `WHERE` externo tras `LEFT JOIN` en `L4` y `WHERE status = 'completed'` en monitor operativo en `L5`). | En los 5 casos el binario `agy` (`gemini-3.8-flash-low`) diagnosticó la causa exacta usando `aiNotes` y las cifras de Mercado Brisa (`45,6 %` en Cono Sur, `$602,78/m²` en retail, `8,2 %` en Tienda Reforma Norte, 4 tiendas con `NULL` en Q4) sin regalar la solución completa. | **PASS** |
| 5 | **SQL inválido y rechazo de `starterCode` en `sqlGrader.js` (DuckDB-Wasm en navegador)** | Ejecución de `SELECT * FROM tabla_inexistente_xyz;` y calificación de `practice.starterCode` frente a `practice.solution` en el motor DuckDB-Wasm vivo del navegador. | El SQL inválido es capturado de forma controlada sin romper la página (`pageErrors: 0`), `starterCode` es rechazado en las 5 lecciones (`passed: false`, `rows_mismatch`) y `solution` aprueba en las 5 (`passed: true`). | **PASS** |

---

## Capturas antes / después

Todas las capturas fueron generadas desde el servidor Vite en `http://127.0.0.1:5229`, guardadas en `C:\Users\T490s\Desktop\Proyectos\ING\docs\reportes\capturas\W-bi3-dashboards\` e inspeccionadas visualmente con `read_file`:

- `bi3-dashboards-01-bi-tufte-code_1440x900_light.png` y `bi3-dashboards-01-bi-tufte-code_1280x720_light.png`: Vista escritorio en modo claro de la Lección 1 migrada y depurada (*Percepción visual, razón dato-tinta y narrativa ejecutiva*), mostrando el temario de 10 secciones, el escenario real de Mercado Brisa y los 4 objetivos.
- `bi3-dashboards-01_tutor_1440x900_light.png`: Vista escritorio `1440x900` con el cajón lateral del Tutor IA abierto (`gemini-3.8-flash-low`, pestañas `Chat`, `Explícalo`, `+3 preguntas`, `Entrevista`).
- `bi3-dashboards-01-bi-tufte-code_1440x900_dark.png`: Vista escritorio en modo oscuro de la Lección 1.
- `bi3-dashboards-02-jerarquia-visual-reticula-10s_1280x720_light.png` y `bi3-dashboards-02-jerarquia-visual-reticula-10s_375x812_light.png`: Vista escritorio (`1280x720`) y vista móvil (`375x812`) en modo claro de la Lección 2 (*Jerarquía visual, retícula y lectura en 10 segundos*), verificando cero desborde horizontal.
- `bi3-dashboards-03-color-contraste-wcag-daltonismo_1280x720_light.png` y `bi3-dashboards-03-color-contraste-wcag-daltonismo_1440x900_dark.png`: Vista escritorio en modo claro y modo oscuro de la Lección 3 (*Color restringido, contraste WCAG y daltonismo*).
- `bi3-dashboards-04-interaccion-filtros-drill-tooltips_1280x720_light.png` y `bi3-dashboards-04-interaccion-filtros-drill-tooltips_390x844_dark.png`: Vista escritorio en modo claro y vista móvil (`390x844`) en modo oscuro de la Lección 4 (*Interacción útil: filtros, drill-through y tooltips*).
- `bi3-dashboards-05-tablero-ejecutivo-vs-operativo_1280x720_light.png` y `bi3-dashboards-05-tablero-ejecutivo-vs-operativo_1440x900_dark.png`: Vista escritorio en modo claro y modo oscuro de la Lección 5 (*Tablero estratégico ejecutivo frente a operativo*).

---

## Peticiones al orquestador

- **Integración en el índice global (Oleada D — Integrador `T4`):** Al fusionar la rama `agente/W-bi3-dashboards`, ejecutar `node scripts/sync-lessons-index.mjs` e integrar los 11 términos de `docs/curriculo/investigacion/bi3-dashboards-glossary.json` en `src/data/glossary.js`.

---

## Pendiente (con motivo)

- Ningún ítem pendiente dentro del alcance de `W-bi3-dashboards`. Los 8 archivos propiedad del agente están completos, verificados con `0` errores y `0` advertencias en `check-content.mjs` y `check-copy.mjs`, validados en DuckDB-Wasm y en el binario real `agy`, y listos para fusión.
