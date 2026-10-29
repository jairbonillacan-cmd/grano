// Lección migrada al esquema v2 mediante scripts/migrate-legacy.mjs
const lesson = {
  "id": "bi3-dashboards-01-bi-tufte-code",
  "moduleId": "bi3-dashboards",
  "tracks": [
    "bi"
  ],
  "level": 3,
  "order": 1,
  "title": "Percepción visual, razón dato-tinta y reportes como código",
  "minutes": 30,
  "prerequisites": [
    "c1-viz-01"
  ],
  "contentVersion": 1,
  "hook": "En Mercado Brisa (empresa ficticia), el tablero semanal que recibe la dirección contiene siete gráficos de pastel en 3D, velocímetros que ocupan media pantalla para mostrar una sola cifra sin contexto histórico, 14 colores saturados y títulos pasivos como `\"Gráfico de ventas por tienda\"`. Además, cada vez que alguien edita un filtro en la herramienta visual, nadie sabe quién lo cambió ni por qué contradice al repositorio SQL. ¿Cómo rediseñas el tablero aplicando principios perceptuales y reportes versionados en Git?",
  "objectives": [
    "Seleccionar codificaciones visuales según la jerarquía de precisión perceptual de Cleveland y McGill (posición sobre ángulo o área).",
    "Maximizar la razón dato-tinta de Tufte eliminando ruido visual y aplicando color semántico de alerta con referencias explícitas.",
    "Construir reportes declarativos en código (Markdown + SQL parametrizado) versionados en Git con pruebas de CI."
  ],
  "sections": [
    {
      "id": "jerarquia-de-precision-perceptual-segun-clevelan",
      "heading": "Jerarquía de precisión perceptual según Cleveland y McGill",
      "body": "El sistema visual humano no procesa todas las formas geométricas con la misma exactitud. Los experimentos psicofísicos de William Cleveland y Robert McGill demostraron un orden estricto de precisión al comparar magnitudes cuantitativas:\n1) **Posición a lo largo de una escala común alineada** (gráficos de barras horizontales, puntos en un eje común): máxima precisión.\n2) **Longitud no alineada y pendiente** (barras apiladas, gráficos de líneas).\n3) **Área y Volumen** (gráficos de burbujas, treemaps): el ojo humano subestima sistemáticamente las diferencias de área.\n4) **Ángulo, Curvatura y Saturación de color** (gráficos de pastel, donas, velocímetros radiales): mínima precisión.\nCuando usas un gráfico de pastel con 6 regiones (`19%, 18%, 17%, 16%...`), obligas al cerebro del ejecutivo a resolver geometría angular para la cual es torpe; una tabla ordenada con barras integradas o un **Bullet Graph** de Stephen Few transmite el ranking, el valor exacto y la distancia contra la meta en menos de 400 milisegundos.",
      "interactive": {
        "component": "bi-anti-slop-comparator",
        "caption": "Simulador interactivo: Percepción visual, razón dato-tinta y reportes como código"
      }
    },
    {
      "id": "razon-dato-tinta-de-tufte-multiplos-pequenos-y-c",
      "heading": "Razón dato-tinta de Tufte, múltiplos pequeños y color",
      "body": "Edward Tufte formuló en *The Visual Display of Quantitative Information* la ley central del diseño analítico: **Maximizar la Relación Dato-Tinta (Data-Ink Ratio)** eliminando toda tinta que no represente información nueva (*Chartjunk*).\n- **Poda el ruido visual**: elimina bordes dobles, fondos oscuros decorativos, efectos 3D, rejillas gruesas y leyendas flotantes que obligan al ojo a viajar de un extremo al otro (*eye-ping-pong*). Etiqueta las líneas directamente al final de su serie.\n- **Rompe el \"gráfico saturado\" con Small Multiples**: si tienes que comparar la tendencia temporal de 8 países o 10 productos, nunca superpongas 10 líneas de colores en un solo eje. Crea una cuadrícula de pequeños gráficos idénticos (**Small Multiples**) o una tabla de alta densidad con **Sparklines**, donde cada fila tiene su propia pista limpia.\n- **Usa el color como señal de excepción, no como decoración**: pinta el histórico, el plan y las categorías normales en tonos neutros/grises serenos, y reserva el color saturado (rojo diagnóstico o esmeralda) exclusivamente para los puntos que rompen el umbral y requieren decisión.",
      "example": {
        "language": "sql",
        "code": "# Reporte mensual del comité ejecutivo (Evidence.dev / BI-as-Code en Git)\n## LATAM y EMEA superaron el plan de octubre en +$130K (+12.7%), compensando a NORAM\n\n```sql regional_performance\nSELECT\n  region,\n  SUM(net_revenue_usd) AS actual_rev_usd,\n  SUM(plan_revenue_usd) AS plan_rev_usd,\n  ROUND(100.0 * (SUM(net_revenue_usd) - SUM(plan_revenue_usd)) / NULLIF(SUM(plan_revenue_usd), 0), 1) AS vs_plan_pct,\n  ROUND(100.0 * (SUM(net_revenue_usd) - SUM(prev_year_revenue_usd)) / NULLIF(SUM(prev_year_revenue_usd), 0), 1) AS yoy_pct\nFROM gold.fct_regional_revenue\nWHERE fiscal_month = '2026-10-01'\nGROUP BY region\nORDER BY actual_rev_usd DESC;\n```\n\n<DataTable data={regional_performance} rows=all>\n  <Column id=region title=\"Región\" />\n  <Column id=actual_rev_usd title=\"Ingreso Neto Real\" fmt=usd0 contentType=bar barColor=#cbd5e1 />\n  <Column id=plan_rev_usd title=\"Meta (Plan)\" fmt=usd0 />\n  <Column id=vs_plan_pct title=\"vs. Plan (%)\" fmt=pct1 contentType=delta />\n  <Column id=yoy_pct title=\"Crecimiento YoY\" fmt=pct1 contentType=delta />\n</DataTable>",
        "expectedOutput": [
          {
            "region": "LATAM",
            "actual_rev_usd": "$640,000",
            "plan_rev_usd": "$540,000",
            "vs_plan_pct": "+18.5% (Supera Plan)",
            "yoy_pct": "+24.1%"
          },
          {
            "region": "EMEA",
            "actual_rev_usd": "$510,000",
            "plan_rev_usd": "$480,000",
            "vs_plan_pct": "+6.3% (Supera Plan)",
            "yoy_pct": "+11.8%"
          },
          {
            "region": "NORAM",
            "actual_rev_usd": "$390,000",
            "plan_rev_usd": "$430,000",
            "vs_plan_pct": "-9.3% (Requiere Acción)",
            "yoy_pct": "+2.4%"
          }
        ]
      }
    },
    {
      "id": "estructura-piramidal-de-minto-y-comparacion-con-",
      "heading": "Estructura piramidal de Minto y comparación con referencias",
      "body": "Un número aislado en una tarjeta (`\"$1.54M\"`) es mudo: el director general inmediatamente preguntará *\"¿Eso es bueno o malo? ¿Cómo íbamos el mes pasado? ¿Cuál era el presupuesto?\"*.\nTodo indicador ejecutivo bien diseñado incluye su **Tríada de Contexto**:\n1) El valor real observado (`$1.54M`).\n2) La comparación contra la Meta / Plan (`+$120K / +8.4% vs. Plan`) y contra el período anterior ajustado por estacionalidad (`+14.2% YoY`).\n3) Un **Título Activo (Principio de la Pirámide de Bárbara Minto)**: empieza siempre por la conclusión gobernante. Sustituye el título pasivo *\"Ventas por Región Q3\"* por *\"LATAM y EMEA superaron el plan en +$180K (+14.2%), compensando la desaceleración de NORAM (-9.3%)\"*."
    },
    {
      "id": "reportes-declarativos-en-git-con-evidence-observ",
      "heading": "Reportes declarativos en Git con Evidence, Observable y Rill",
      "body": "El talón de Aquiles del BI tradicional de clic-y-arrastrar (Point-and-Click BI) es que la lógica visual y los filtros terminan encerrados en archivos binarios opacos fuera del control de versiones. Si Ingeniería de Datos renombra una columna en dbt/SQLMesh, nadie se entera de que el dashboard del CEO se rompió hasta el lunes a las 8:00 AM.\nCon **BI-as-Code** (herramientas como **Evidence.dev, Observable Framework y Rill**), los reportes ejecutivos se escriben en archivos `.md` o `.js` que combinan narrativa Markdown, bloques SQL parametrizados contra la Capa Semántica y componentes visuales declarativos (`<DataTable>`, `<BarChart>`, `<BulletChart>`) potenciados en el navegador por **DuckDB-Wasm**.\nEsto desbloquea tres superpoderes:\n1) **Gobernanza en Git y Pull Requests**: un cambio en un reporte se revisa en el mismo PR que el modelo SQL.\n2) **Continuous Integration (CI) para BI**: el pipeline de GitHub Actions compila todas las consultas del reporte en cada commit; si falta una columna o falla un contrato, el despliegue se bloquea automáticamente.\n3) **Interactividad sub-50ms**: DuckDB-Wasm filtra cubos Parquet pre-compilados directamente en la memoria del navegador del usuario sin latencia de red ni costos por consulta en el Data Warehouse."
    }
  ],
  "workedExample": {
    "title": "Ejemplo guiado: Percepción visual, razón dato-tinta y reportes como código",
    "description": "Compara un flujo manual frágil con gráficos circulares de baja señal frente a un reporte declarativo BI-as-Code con alta densidad Dato-Tinta:",
    "audit": "",
    "steps": [
      {
        "label": "Antipatrón: exportación CSV manual y gráfico de pastel 3D sin meta",
        "explanation": "Compara un flujo manual frágil con gráficos circulares de baja señal frente a un reporte declarativo BI-as-Code con alta densidad Dato-Tinta:",
        "code": "# FLUJO MANUAL FRÁGIL Y CON CHARTJUNK:\n# 1) Descargar manualmente \"ventas_octubre_v4_final_2.csv\" cada lunes a las 7am\n# 2) Pegar en hoja de cálculo local sin tests ni control de versiones Git\n# 3) Insertar Gráfico de Pastel 3D con 8 regiones y colores arcoíris\n# 4) Título pasivo: \"Gráfico de Ventas\" (sin mostrar Meta/Plan ni variación YoY)",
        "expectedOutput": [
          {
            "claridad_perceptual": "Baja (El ojo no distingue ángulos de 16% vs 18% en un pastel 3D)",
            "contexto_ejecutivo": "Nulo (Muestra $640K sin decir si la meta era $500K o $800K)",
            "gobernanza_git": "0% (Archivo local desconectado de dbt/SQLMesh)"
          }
        ]
      },
      {
        "label": "Solución óptima: reportes como código en Git y tabla de alta densidad",
        "explanation": "Compara ahora la consulta corregida y verifica cómo las filas y totales coinciden con la auditoría.",
        "code": "# Reporte mensual del comité ejecutivo (Evidence.dev / BI-as-Code en Git)\n## LATAM y EMEA superaron el plan de octubre en +$130K (+12.7%), compensando a NORAM\n\n```sql regional_performance\nSELECT\n  region,\n  SUM(net_revenue_usd) AS actual_rev_usd,\n  SUM(plan_revenue_usd) AS plan_rev_usd,\n  ROUND(100.0 * (SUM(net_revenue_usd) - SUM(plan_revenue_usd)) / NULLIF(SUM(plan_revenue_usd), 0), 1) AS vs_plan_pct,\n  ROUND(100.0 * (SUM(net_revenue_usd) - SUM(prev_year_revenue_usd)) / NULLIF(SUM(prev_year_revenue_usd), 0), 1) AS yoy_pct\nFROM gold.fct_regional_revenue\nWHERE fiscal_month = '2026-10-01'\nGROUP BY region\nORDER BY actual_rev_usd DESC;\n```\n\n<DataTable data={regional_performance} rows=all>\n  <Column id=region title=\"Región\" />\n  <Column id=actual_rev_usd title=\"Ingreso Neto Real\" fmt=usd0 contentType=bar barColor=#cbd5e1 />\n  <Column id=plan_rev_usd title=\"Meta (Plan)\" fmt=usd0 />\n  <Column id=vs_plan_pct title=\"vs. Plan (%)\" fmt=pct1 contentType=delta />\n  <Column id=yoy_pct title=\"Crecimiento YoY\" fmt=pct1 contentType=delta />\n</DataTable>",
        "expectedOutput": [
          {
            "region": "LATAM",
            "actual_rev_usd": "$640,000",
            "plan_rev_usd": "$540,000",
            "vs_plan_pct": "+18.5% (Supera Plan)",
            "yoy_pct": "+24.1%"
          },
          {
            "region": "EMEA",
            "actual_rev_usd": "$510,000",
            "plan_rev_usd": "$480,000",
            "vs_plan_pct": "+6.3% (Supera Plan)",
            "yoy_pct": "+11.8%"
          },
          {
            "region": "NORAM",
            "actual_rev_usd": "$390,000",
            "plan_rev_usd": "$430,000",
            "vs_plan_pct": "-9.3% (Requiere Acción)",
            "yoy_pct": "+2.4%"
          }
        ]
      }
    ]
  },
  "checks": [
    {
      "id": "c1",
      "type": "mcq",
      "prompt": "En la revisión trimestral tienes que mostrar en una sola pantalla: 1) la evolución semanal de ingresos de 9 líneas de producto durante las últimas 52 semanas y 2) cómo cerró cada línea en el trimestre respecto a su meta en dólares y porcentaje. Según los principios de Cleveland & McGill, Edward Tufte y Stephen Few, ¿qué diseño debes construir?",
      "options": [
        {
          "id": "a",
          "text": "Una tabla ejecutiva ordenada de mayor a menor ingreso que integre por cada fila un Sparkline de las 52 semanas, una barra horizontal / Bullet Graph del ingreso real frente a la meta en tonos neutros, y una columna de variación % vs. Plan destacando en color únicamente las líneas fuera de umbral.",
          "correct": true,
          "feedback": "Exacto. Combinar una tabla estructurada con Sparklines (o una cuadrícula de Small Multiples) y Bullet Graphs aprovecha la comparación de longitudes alineadas, evita el caos de cruzar 9 líneas en un mismo eje y maximiza la relación Dato-Tinta."
        },
        {
          "id": "b",
          "text": "Un único gráfico de líneas con las 9 series reales más las 9 líneas de meta (18 líneas superpuestas en total) con una leyenda de 18 colores a la derecha y un gráfico de dona 3D al lado.",
          "correct": false,
          "feedback": "Superponer 18 líneas crea un \"gráfico saturado\" ilegible donde el ojo no puede seguir ninguna serie individual, y la dona 3D distorsiona las proporciones."
        },
        {
          "id": "c",
          "text": "Nueve velocímetros tipo tablero de automóvil a todo color que muestren solo el porcentaje final sin la serie semanal ni el monto en dólares.",
          "correct": false,
          "feedback": "Los velocímetros radiales tienen una pésima relación Dato-Tinta: desperdician el 80% de los píxeles de la pantalla para mostrar un único número y ocultan la tendencia de las 52 semanas y el volumen absoluto en dólares."
        }
      ],
      "explanation": "Exacto. Combinar una tabla estructurada con Sparklines (o una cuadrícula de Small Multiples) y Bullet Graphs aprovecha la comparación de longitudes alineadas, evita el caos de cruzar 9 líneas en un mismo eje y maximiza la relación Dato-Tinta."
    },
    {
      "id": "c2",
      "type": "mcq",
      "prompt": "Quieres mostrar la evolución mensual de ventas de las 12 categorías de supermercado durante los últimos 24 meses. Un único gráfico con 12 líneas de colores cruzándose resulta ilegible. ¿Qué diseño resuelve el problema sin ocultar datos?",
      "options": [
        {
          "id": "a",
          "text": "Múltiplos pequeños (small multiples): una cuadrícula de 12 minigráficos con escalas compartidas, destacando cada categoría en primer plano contra las demás en gris suave.",
          "correct": true,
          "feedback": "Correcto: separar las series en paneles alineados elimina el cruce de líneas (spaghetti chart) y permite comparar tendencias al instante."
        },
        {
          "id": "b",
          "text": "Un gráfico de pastel 3D con 12*24 = 288 rebanadas.",
          "correct": false,
          "feedback": "Incorrecto: 288 ángulos en un círculo son perceptualmente imposibles de leer."
        },
        {
          "id": "c",
          "text": "Usar 12 ejes verticales (Y) distintos en el mismo gráfico.",
          "correct": false,
          "feedback": "Incorrecto: múltiples ejes Y con distintas escalas inducen cruces falsos y confunden al lector."
        }
      ],
      "explanation": "Los múltiplos pequeños aprovechan la constancia de diseño: el lector aprende los ejes una sola vez y escanea visualmente las diferencias entre categorías."
    },
    {
      "id": "c3",
      "type": "mcq",
      "prompt": "¿Qué ventaja operativa aporta gestionar un reporte en herramientas BI-as-Code (como Evidence o Power BI Projects `.pbip` en Git) frente a editar un archivo binario cerrado en producción?",
      "options": [
        {
          "id": "a",
          "text": "Permite revisar en un Pull Request qué consulta o métrica cambió, ejecutar CI para comprobar que ninguna columna fue eliminada y revertir con git revert.",
          "correct": true,
          "feedback": "Correcto: integra la capa de visualización en el mismo ciclo de control de versiones y pruebas automáticas que los modelos de datos."
        },
        {
          "id": "b",
          "text": "Hace que las bases de datos no necesiten índices ni particiones.",
          "correct": false,
          "feedback": "Incorrecto: el control de versiones del reporte no sustituye la optimización física del almacén."
        },
        {
          "id": "c",
          "text": "Impide usar filtros interactivos en el navegador.",
          "correct": false,
          "feedback": "Incorrecto: los reportes declarativos compilan componentes interactivos con parámetros y filtros en el cliente."
        }
      ],
      "explanation": "Tratar los reportes como código fuente en texto plano cierra la brecha entre los modelos de transformación y las pantallas que consume el negocio."
    }
  ],
  "practice": {
    "type": "sql",
    "title": "Tabla ejecutiva de desempeño frente a meta por región",
    "language": "sql",
    "prompt": "Construye la consulta ejecutiva que compara las ventas completadas de `orders` en el año 2024 frente a la meta anual de cada tienda (`stores.monthly_target_usd * 12`) agrupando por `region`: `actual_rev_usd`, `plan_rev_usd` y `vs_plan_pct`, ordenado por `actual_rev_usd DESC`.",
    "starterCode": "WITH store_sales_2024 AS (\n  SELECT\n    store_id,\n    SUM(total_usd) AS actual_rev_usd\n  FROM orders\n  WHERE status = 'completed'\n    AND order_date BETWEEN DATE '2024-01-01' AND DATE '2024-12-31'\n  GROUP BY store_id\n)\nSELECT\n  s.region,\n  ROUND(SUM(COALESCE(ss.actual_rev_usd, 0)), 2) AS actual_rev_usd,\n  ROUND(SUM(s.monthly_target_usd * 12), 2) AS plan_rev_usd,\n  -- TODO: Calcula vs_plan_pct redondeado a 1 decimal: 100.0 * (actual - plan) / NULLIF(plan, 0)\n  0.0 AS vs_plan_pct\nFROM stores s\nLEFT JOIN store_sales_2024 ss ON s.store_id = ss.store_id\nGROUP BY s.region\nORDER BY actual_rev_usd DESC;",
    "expected": "WITH store_sales_2024 AS (\n  SELECT\n    store_id,\n    SUM(total_usd) AS actual_rev_usd\n  FROM orders\n  WHERE status = 'completed'\n    AND order_date BETWEEN DATE '2024-01-01' AND DATE '2024-12-31'\n  GROUP BY store_id\n)\nSELECT\n  s.region,\n  ROUND(SUM(COALESCE(ss.actual_rev_usd, 0)), 2) AS actual_rev_usd,\n  ROUND(SUM(s.monthly_target_usd * 12), 2) AS plan_rev_usd,\n  ROUND(\n    100.0 * (SUM(COALESCE(ss.actual_rev_usd, 0)) - SUM(s.monthly_target_usd * 12))\n      / NULLIF(SUM(s.monthly_target_usd * 12), 0),\n    1\n  ) AS vs_plan_pct\nFROM stores s\nLEFT JOIN store_sales_2024 ss ON s.store_id = ss.store_id\nGROUP BY s.region\nORDER BY actual_rev_usd DESC;",
    "orderMatters": true,
    "hints": [
      "Pre-agregar las ventas de 2024 por `store_id` antes de unir con `stores` evita que `monthly_target_usd` se multiplique por cada pedido.",
      "La desviación porcentual contra el plan es `ROUND(100.0 * (SUM(COALESCE(ss.actual_rev_usd, 0)) - SUM(s.monthly_target_usd * 12)) / NULLIF(SUM(s.monthly_target_usd * 12), 0), 1) AS vs_plan_pct`.",
      "Conserva `ORDER BY actual_rev_usd DESC` para presentar las regiones jerárquicamente."
    ],
    "solution": "WITH store_sales_2024 AS (\n  SELECT\n    store_id,\n    SUM(total_usd) AS actual_rev_usd\n  FROM orders\n  WHERE status = 'completed'\n    AND order_date BETWEEN DATE '2024-01-01' AND DATE '2024-12-31'\n  GROUP BY store_id\n)\nSELECT\n  s.region,\n  ROUND(SUM(COALESCE(ss.actual_rev_usd, 0)), 2) AS actual_rev_usd,\n  ROUND(SUM(s.monthly_target_usd * 12), 2) AS plan_rev_usd,\n  ROUND(\n    100.0 * (SUM(COALESCE(ss.actual_rev_usd, 0)) - SUM(s.monthly_target_usd * 12))\n      / NULLIF(SUM(s.monthly_target_usd * 12), 0),\n    1\n  ) AS vs_plan_pct\nFROM stores s\nLEFT JOIN store_sales_2024 ss ON s.store_id = ss.store_id\nGROUP BY s.region\nORDER BY actual_rev_usd DESC;",
    "solutionExplanation": "Pre-agrega las ventas reales de 2024 al grano `store_id` antes de unirlas con `stores`, y calcula la variación porcentual frente a la meta anual (`monthly_target_usd * 12`) protegiendo el denominador con `NULLIF(..., 0)`."
  },
  "roleNotes": {
    "de": "Integra el paso `npm run build:reports` del proyecto BI-as-Code dentro del pipeline CI/CD de dbt/SQLMesh para garantizar cero dashboards rotos tras cambios de esquema. Materializa extractos Parquet compactos y ordenados desde la capa Gold para que DuckDB-Wasm los sirva desde CDN con latencia inferior a 50ms. Audita que ningún reporte ejecute consultas pesadas directas contra tablas Bronze/Silver saltándose la Capa Semántica.",
    "da": "Enriquece las tablas ejecutivas con bandas de variación esperada (intervalos de confianza o desviaciones estándar) para evitar que la dirección sobrerreaccione al ruido normal. Escribe documentos analíticos reproducibles (Data Memos en Evidence / Marimo) donde el texto explicativo se alimenta dinámicamente de variables SQL en vivo. Descompone las variaciones contra el Plan en efectos de volumen, precio y mix antes de presentarlas en el comité.",
    "bi": "Reemplaza gráficos circulares, donas y velocímetros por tablas de alta densidad con barras integradas, Bullet Graphs y Small Multiples. Aplica títulos activos basados en la Pirámide de Minto y reserva el color semántico exclusivamente para desvíos accionables. Versiona los dashboards y árboles de KPIs en Git mediante BI-as-Code conectado a las métricas certificadas de MetricFlow / Cube."
  },
  "summary": [
    "El ojo humano compara longitudes en una base común con mucha más precisión que ángulos de un pastel.",
    "Cada elemento visual debe representar datos reales; elimina bordes redundantes, fondos pesados y efectos 3D.",
    "Una cifra aislada no informa: acompáñala siempre de comparación temporal, objetivo y estado.",
    "Definir reportes como código en Git permite revisar cambios en Pull Requests y detectar consultas rotas."
  ],
  "flashcards": [
    {
      "id": "fc-bi3-viz-01",
      "front": "Según la jerarquía de Cleveland y McGill, ¿por qué un gráfico de barras horizontales supera a un gráfico de pastel para comparar 8 categorías?",
      "back": "Porque la posición a lo largo de una escala común se juzga con mucha menor tasa de error perceptual que los ángulos o las áreas."
    },
    {
      "id": "fc-bi3-viz-02",
      "front": "¿Qué propone la regla del uso intencional del color en un tablero operativo?",
      "back": "Mantener el 90 % de las series contextuales en tonos neutros y reservar el color de acento o semántico solo para las anomalías o metas incumplidas."
    },
    {
      "id": "fc-bi3-viz-03",
      "front": "¿Qué es un título activo (Action Title) en la parte superior de un gráfico ejecutivo?",
      "back": "Un encabezado que enuncia el hallazgo cuantitativo (\"El margen cayó 180 pb en Norte por costo de flete\") en vez de describir los ejes (\"Margen por región\")."
    }
  ],
  "glossaryTerms": [
    "c25-tufte-visual-perception",
    "c21-semantic-layer"
  ],
  "sources": [
    {
      "title": "Cleveland & McGill (JASA 1984) — Graphical Perception: Theory, Experimentation, and Application to the Development of Graphical Methods",
      "url": "https://www.jstor.org/stable/2288400",
      "publisher": "Journal of the American Statistical Association",
      "accessed": "2026-10-29",
      "supports": "Jerarquía experimental de precisión en la percepción de atributos gráficos."
    },
    {
      "title": "Evidence Documentation — BI as Code with Markdown and Parameterized SQL",
      "url": "https://docs.evidence.dev/",
      "publisher": "Evidence",
      "accessed": "2026-10-29",
      "supports": "Construcción de reportes declarativos versionados en Git con consultas SQL y DuckDB."
    },
    {
      "title": "Observable Framework Documentation — Data Loaders and Static Report Generation",
      "url": "https://observablehq.com/framework/",
      "publisher": "Observable",
      "accessed": "2026-10-29",
      "supports": "Arquitectura de cargadores de datos precompilados y tableros rápidos en código."
    }
  ],
  "aiNotes": "Evita que el alumno piense que el diseño de tableros es cuestión de gusto estético subjetivo: fundamenta cada corrección en carga cognitiva, precisión de comparación de longitudes y presencia de una referencia explícita.",
  "needsReview": true,
  "legacyId": "l15-bi-tufte-code",
  "legacyOrder": 15,
  "stageId": "stage-5",
  "subtitle": "Jerarquía gráfica de Cleveland y Tufte combinada con tableros declarativos versionados en Git.",
  "goal": "Diseñar tableros ejecutivos basados en la relación Dato-Tinta de Tufte y Stephen Few, estructurar narrativas con la Pirámide de Minto y construir reportes reproducibles mediante BI-as-Code.",
  "pipelineChallenge": {
    "title": "Publicación de reportes declarativos como código",
    "scenario": "Ordena el ciclo de vida moderno de un reporte ejecutivo cuando Ingeniería (DE), Análisis (DA) y BI trabajan bajo un flujo BI-as-Code versionado en Git.",
    "steps": [
      {
        "id": "step-1",
        "label": "1. Exponer la métrica y la meta en la capa semántica Gold",
        "role": "DE",
        "detail": "Materializar `gold.fct_regional_revenue` con tests de contrato y exponer las medidas certificadas de ingreso real y presupuesto."
      },
      {
        "id": "step-2",
        "label": "2. Incorporar bandas de varianza y descomposición analítica en SQL",
        "role": "DA",
        "detail": "Escribir la consulta parametrizada que calcula deltas YoY, cumplimiento vs. Plan y significancia de las desviaciones."
      },
      {
        "id": "step-3",
        "label": "3. Diseñar la vista con alta relación dato-tinta y título activo en Markdown",
        "role": "BI",
        "detail": "Estructurar el reporte con titular ejecutivo (Pirámide de Minto), Small Multiples y tablas con barras alineadas y color solo por excepción."
      },
      {
        "id": "step-4",
        "label": "4. Compilar consultas en CI/CD y publicar cubo Parquet a DuckDB-Wasm",
        "role": "DE",
        "detail": "Validar automáticamente en GitHub Actions que ninguna consulta SQL del reporte falle y desplegar los artefactos Parquet para lectura en <50ms."
      }
    ],
    "explanation": "BI-as-Code cierra la brecha entre ingeniería y negocio: las métricas nacen gobernadas en Gold, se contextualizan estadísticamente, se presentan siguiendo los principios visuales de Tufte/Few y se validan en CI/CD antes de llegar al comité."
  },
  "relatedLessons": [
    {
      "id": "l12-contracts-semantic-layer",
      "reason": "Los reportes BI-as-Code consumen las métricas certificadas de la Capa Semántica para garantizar que Finanzas y Marketing vean exactamente la misma cifra."
    },
    {
      "id": "l9-duckdb-polars-marimo",
      "reason": "Las plataformas modernas de BI-as-Code utilizan DuckDB-Wasm y archivos Parquet columnares para lograr filtrado instantáneo en el navegador."
    },
    {
      "id": "l18-mcp-semantic-ai-rag",
      "reason": "Tanto tu dashboard BI-as-Code como los Agentes IA vía MCP leen el mismo catálogo semántico gobernado."
    }
  ]
};

export default lesson;
