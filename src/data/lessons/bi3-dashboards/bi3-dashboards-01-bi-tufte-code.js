export const lesson = {
  id: 'bi3-dashboards-01-bi-tufte-code',
  moduleId: 'bi3-dashboards',
  track: 'bi',
  tracks: ['bi', 'da'],
  level: 3,
  order: 1,
  legacyId: 'l15-bi-tufte-code',
  legacyOrder: 15,
  contentVersion: 2,
  title: 'Percepción visual, razón dato-tinta y narrativa ejecutiva',
  subtitle: 'Razón dato-tinta de Tufte, gráficos de bala de Few y títulos activos bajo el estándar IBCS',
  minutes: 30,
  prerequisites: ['c1-viz-04-tablas-numericas', 'bi2-dax-06-antipatrones-rendimiento-dax'],
  glossaryTerms: [
    'bi3-razon-dato-tinta',
    'bi3-grafico-de-bala',
    'bi3-sparkline',
    'bi3-titulo-accion',
  ],
  datasets: ['orders', 'stores', 'refunds'],
  needsReview: false,
  hook: 'El comité de dirección de Mercado Brisa abre el tablero mensual y encuentra cuatro velocímetros circulares en 3D con leyendas de doce colores. Tras cinco minutos de discusión, nadie sabe qué región incumplió su meta anual ni cuánto restaron las devoluciones. ¿Cómo eliminamos el ruido gráfico para que cada píxel responda una pregunta de negocio?',
  objectives: [
    'Maximizar la razón dato-tinta de Edward Tufte eliminando adornos redundantes (chartjunk) sin suprimir los ejes de contexto.',
    'Reemplazar velocímetros circulares por gráficos de bala (bullet graphs) de Stephen Few, minigráficos (sparklines) y pequeños múltiplos.',
    'Redactar títulos de acción ejecutivos bajo el Principio de la Pirámide de Barbara Minto y la notación semántica IBCS.',
    'Construir en DuckDB la consulta base de un gráfico de bala regional que cruza ingresos completados y metas anuales en Mercado Brisa.',
  ],
  sections: [
    {
      id: 'sec-tufte-razon-dato-tinta',
      heading: 'Razón dato-tinta y erradicación del ruido gráfico (chartjunk)',
      body: 'En *The Visual Display of Quantitative Information*, **Edward Tufte** definió la **razón dato-tinta** (*data-ink ratio*). Esta métrica mide la proporción de tinta dedicada a mostrar números reales no redundantes. Cada borde grueso, sombra 3D, fondo degradado o rejilla oscura reduce esa proporción. Todo adorno innecesario introduce **ruido gráfico** (*chartjunk*).\n\nMaximizar la razón dato-tinta no significa dejar el lienzo desnudo. Como advierte **Claus O. Wilke**, borrar las líneas de referencia obliga al lector a adivinar magnitudes. La regla práctica distingue tres capas: tinta de datos, tinta de contexto necesario y tinta decorativa.\n\nEn los tableros de Mercado Brisa aplicamos tres recortes sistemáticos. Primero, sustituimos las leyendas separadas por etiquetas directas junto a cada barra. Segundo, eliminamos los efectos 3D y las rejillas verticales cuando las cifras ya están rotuladas. Tercero, reservamos los bordes suaves únicamente para separar bloques funcionales.',
    },
    {
      id: 'sec-bullet-graphs-sparklines',
      heading: 'Gráficos de bala, sparklines y pequeños múltiplos',
      body: 'Los velocímetros radiales (*gauges*) y los gráficos de tarta desperdician espacio en pantalla. Además, fuerzan al ojo a estimar ángulos y áreas de baja precisión perceptual. Para sustituirlos en tableros financieros, **Stephen Few** diseñó el **gráfico de bala** (*bullet graph*).\n\nUn gráfico de bala condensa cinco elementos en una fila horizontal. Incluye la etiqueta de la entidad, una escala lineal con base cero y una barra central con el valor real. A esto suma un marcador perpendicular de meta y bandas de fondo en tonos grises que delimitan umbrales cualitativos.\n\nCuando necesitamos mostrar la evolución temporal sin saturar el lienzo, combinamos dos estructuras de Tufte. Los **minigráficos en línea** (*sparklines*) se incrustan en las celdas de una tabla para mostrar la tendencia en el espacio de una palabra. Los **pequeños múltiplos** (*small multiples*) repiten el mismo diseño compacto por región con un eje compartido. Así comparamos las cuatro regiones de Mercado Brisa de un vistazo.',
      example: {
        language: 'sql',
        code: `WITH store_targets AS (
  SELECT
    region,
    ROUND(SUM(monthly_target_usd) * 12, 2) AS annual_target_usd
  FROM stores
  GROUP BY region
),
regional_sales AS (
  SELECT
    s.region,
    ROUND(SUM(o.total_usd), 2) AS gross_revenue_usd
  FROM orders o
  JOIN stores s ON o.store_id = s.store_id
  WHERE o.status = 'completed'
    AND EXTRACT(YEAR FROM o.order_date) = 2024
  GROUP BY s.region
)
SELECT
  t.region,
  rs.gross_revenue_usd,
  t.annual_target_usd,
  ROUND(rs.gross_revenue_usd * 100.0 / t.annual_target_usd, 1) AS attainment_pct
FROM store_targets t
JOIN regional_sales rs ON t.region = rs.region
ORDER BY attainment_pct DESC;`,
        explanation: 'Esta consulta genera la tabla fuente para cuatro gráficos de bala regionales en 2024. Cono Sur lidera el cumplimiento bruto con 45,6 % ($919.026,32 sobre una meta anual de $2.016.000,00), mientras Norteamérica registra apenas 10,2 % ($363.700,11 sobre $3.552.000,00).',
      },
    },
    {
      id: 'sec-narrativa-minto-ibcs',
      heading: 'Títulos activos con el Principio de Minto y el estándar IBCS',
      body: 'Un gráfico limpio sigue incompleto si su encabezado dice únicamente *"Ventas por región"*. Ese rótulo describe los ejes, pero obliga al directivo a calcular restas para deducir qué ocurrió. La comunicación ejecutiva aplica el **Principio de la Pirámide** de **Barbara Minto**: empezar siempre por la conclusión respaldada por datos.\n\nLos estándares **IBCS** (*International Business Communication Standards*) exigen encabezados con un **título de acción** (*action title*) superior. Un título activo declara el sujeto, la métrica, la magnitud del desvío y el periodo. Por ejemplo: *"Cono Sur lidera el cumplimiento neto anual con 43,8 %, mientras Norteamérica cae a 9,8 % en 2024"*.\n\nAdemás, la notación semántica IBCS estandariza la apariencia de los escenarios en toda la empresa. Los valores reales (*Actual*) se representan con barras sólidas oscuras. El presupuesto (*Plan*) usa marcadores huecos o contorneados, y las variaciones se alinean en un eje secundario.',
      diagram: `flowchart TD
  T["Título activo (Minto / IBCS):<br/>Cono Sur lidera el ingreso neto con $882,6k (43,8 % de la meta anual) en 2024"]
  R1["Arg. 1: Cono Sur y Andina concentran el 64,9 % de la venta neta completada ($1,70M)"]
  R2["Arg. 2: Las devoluciones procesadas restan $116,6k (-4,3 % sobre el ingreso bruto)"]
  R3["Arg. 3: Norteamérica opera al 9,8 % de su cuota anual por sobrecapacidad en almacén"]
  T --> R1
  T --> R2
  T --> R3`,
    },
    {
      id: 'sec-declarativo-y-auditoria',
      heading: 'Consistencia entre consulta SQL y representación visual',
      body: 'El diseño visual riguroso fracasa cuando la consulta subyacente suma granos incompatibles. Si alimentamos un gráfico de bala con `orders` sin filtrar `status = \'completed\'`, inflaremos el cumplimiento regional. Ese descuido incluiría pedidos cancelados o pendientes dentro del ingreso real.\n\nDel mismo modo, debemos cuidar el grano al comparar `orders` (`1 fila = 1 pedido`) con `stores` (`1 fila = 1 tienda`). Es obligatorio preagregar las metas de las tiendas por región antes de cruzar las tablas. Si multiplicamos `monthly_target_usd * 12` dentro del `JOIN` con los pedidos, la meta se multiplicará por el número de pedidos.\n\nPor ello separamos la preparación en expresiones de tabla comunes (`WITH`) para metas (`store_targets`), ventas (`regional_sales`) y devoluciones (`regional_refunds`). Así garantizamos que cada barra del tablero sea auditable hasta el céntimo.',
    },
  ],
  interactive: {
    type: 'bi-anti-slop-comparator',
    title: 'Comparador interactivo: Ruido gráfico (Chartjunk) vs. Diseño de alta densidad',
  },
  workedExample: {
    title: 'Tabla maestra para gráficos de bala de ingresos netos frente a meta anual (2024)',
    problem: 'Construir la tabla maestra para los gráficos de bala del Comité Ejecutivo de Mercado Brisa en 2024, reportando por región el número de tiendas, el ingreso bruto de pedidos completados, las devoluciones procesadas asociadas, el ingreso neto resultante, la meta anual agregada y el porcentaje de cumplimiento neto.',
    steps: [
      {
        label: 'Paso 1: Preagregar la meta anual por región en el grano de stores',
        sql: `SELECT
  region,
  COUNT(*) AS num_stores,
  ROUND(SUM(monthly_target_usd) * 12, 2) AS annual_target_usd
FROM stores
GROUP BY region
ORDER BY annual_target_usd DESC;`,
        explanation: 'Calculamos primero la meta anual (12 meses) en el grano exacto de stores (14 tiendas en total): Norteamérica ($3.552.000), Andina ($2.880.000), Iberia ($2.652.000) y Cono Sur ($2.016.000). Esto evita cualquier abanico de filas al cruzar con pedidos.',
      },
      {
        label: 'Paso 2: Agregar los ingresos brutos de pedidos completados en 2024',
        sql: `SELECT
  s.region,
  COUNT(o.order_id) AS completed_orders,
  ROUND(SUM(o.total_usd), 2) AS gross_revenue_usd
FROM orders o
JOIN stores s ON o.store_id = s.store_id
WHERE o.status = 'completed'
  AND EXTRACT(YEAR FROM o.order_date) = 2024
GROUP BY s.region
ORDER BY gross_revenue_usd DESC;`,
        explanation: 'Filtramos exclusivamente status = \'completed\' en 2024 (6.497 pedidos y $2.731.516,50 en total). Cono Sur aporta $919.026,32 y Andina $858.331,08.',
      },
      {
        label: 'Paso 3: Integrar devoluciones procesadas y calcular cumplimiento neto contra meta anual',
        sql: `WITH store_targets AS (
  SELECT
    region,
    COUNT(*) AS num_stores,
    ROUND(SUM(monthly_target_usd) * 12, 2) AS annual_target_usd
  FROM stores
  GROUP BY region
),
regional_sales AS (
  SELECT
    s.region,
    ROUND(SUM(o.total_usd), 2) AS gross_revenue_usd
  FROM orders o
  JOIN stores s ON o.store_id = s.store_id
  WHERE o.status = 'completed'
    AND EXTRACT(YEAR FROM o.order_date) = 2024
  GROUP BY s.region
),
regional_refunds AS (
  SELECT
    s.region,
    ROUND(SUM(r.refund_amount_usd), 2) AS processed_refunds_usd
  FROM refunds r
  JOIN orders o ON r.order_id = o.order_id
  JOIN stores s ON o.store_id = s.store_id
  WHERE o.status = 'completed'
    AND r.status = 'processed'
    AND EXTRACT(YEAR FROM o.order_date) = 2024
  GROUP BY s.region
)
SELECT
  t.region,
  t.num_stores,
  rs.gross_revenue_usd,
  COALESCE(rr.processed_refunds_usd, 0) AS processed_refunds_usd,
  ROUND(rs.gross_revenue_usd - COALESCE(rr.processed_refunds_usd, 0), 2) AS net_revenue_usd,
  t.annual_target_usd,
  ROUND((rs.gross_revenue_usd - COALESCE(rr.processed_refunds_usd, 0)) * 100.0 / t.annual_target_usd, 1) AS attainment_pct
FROM store_targets t
JOIN regional_sales rs ON t.region = rs.region
LEFT JOIN regional_refunds rr ON t.region = rr.region
ORDER BY net_revenue_usd DESC;`,
        explanation: 'Al descontar las devoluciones procesadas ($116.562,26 en las cuatro regiones), obtenemos el ingreso neto real y el porcentaje de cumplimiento para el gráfico de bala: Cono Sur alcanza 43,8 %, Andina 28,3 %, Iberia 21,4 % y Norteamérica 9,8 %.',
      },
    ],
    takeaway: 'Un gráfico de bala ejecutivo requiere separar en CTEs el grano de metas (stores), el grano de ventas (orders) y el grano de devoluciones (refunds) antes de calcular el porcentaje de cumplimiento.',
  },
  checks: [
    {
      id: 'chk-bi3-01-q1',
      type: 'mcq',
      prompt: 'En un tablero ejecutivo de Mercado Brisa, un analista reemplaza cuatro velocímetros circulares 3D por cuatro gráficos de bala horizontales con escala compartida. ¿Qué ventaja perceptual y espacial logra este cambio?',
      options: [
        {
          id: 'a',
          text: 'Permite codificar el cumplimiento mediante ángulos radiales, que el ojo humano juzga con mayor exactitud que la longitud.',
          correct: false,
          feedback: 'Incorrecto. En la jerarquía de Cleveland y McGill, los ángulos y áreas tienen menor precisión perceptual que la posición en una escala común.',
        },
        {
          id: 'b',
          text: 'Sustituye la estimación angular por posición sobre una escala lineal común, integra meta y bandas cualitativas, y reduce el espacio desperdiciado.',
          correct: true,
          feedback: 'Correcto. El gráfico de bala de Stephen Few emplea longitud y posición alineadas, muestra el marcador de meta y los umbrales de fondo, y permite apilar múltiples regiones en poco espacio.',
        },
        {
          id: 'c',
          text: 'Elimina por completo las escalas numéricas y los ejes para alcanzar una razón dato-tinta del 100 %.',
          correct: false,
          feedback: 'Incorrecto. Suprimir la escala cuantitativa elimina el contexto necesario y contradice la especificación de Stephen Few y Claus Wilke.',
        },
        {
          id: 'd',
          text: 'Combina automáticamente las cuatro regiones en una sola barra apilada para ocultar las diferencias regionales.',
          correct: false,
          feedback: 'Incorrecto. Cada región conserva su propio gráfico de bala alineado en paralelo para facilitar la comparación directa.',
        },
      ],
      explanation: 'Los velocímetros circulares ocupan gran superficie para mostrar un único número mediante ángulo. El gráfico de bala codifica valor real, meta y bandas de estado en una escala lineal compacta de alta precisión.',
    },
    {
      id: 'chk-bi3-01-q2',
      type: 'mcq',
      prompt: 'Según el Principio de la Pirámide de Barbara Minto y el estándar IBCS, ¿cuál de los siguientes encabezados constituye un título de acción válido para el cierre 2024 de Mercado Brisa?',
      options: [
        {
          id: 'a',
          text: 'Gráfico comparativo de ventas brutas, devoluciones y metas anuales por región geográfica (USD).',
          correct: false,
          feedback: 'Incorrecto. Es un título meramente descriptivo de los ejes y variables, que no comunica ningún hallazgo ni conclusión.',
        },
        {
          id: 'b',
          text: 'Evolución comercial histórica de las tiendas físicas y almacenes.',
          correct: false,
          feedback: 'Incorrecto. No incluye sujeto específico, magnitud cuantificada ni conclusión accionable.',
        },
        {
          id: 'c',
          text: 'Cono Sur lidera el cumplimiento neto anual con 43,8 %, mientras Norteamérica cae a 9,8 % en 2024.',
          correct: true,
          feedback: 'Correcto. Declara el sujeto, la métrica, los valores cuantificados del hallazgo y el horizonte temporal en una sola oración.',
        },
        {
          id: 'd',
          text: 'Panel interactivo de indicadores clave de rendimiento (KPIs).',
          correct: false,
          feedback: 'Incorrecto. Es un rótulo genérico que no aporta información analítica al lector ejecutivo.',
        },
      ],
      explanation: 'Un título de acción (action title) bajo Minto e IBCS presenta la conclusión principal cuantificada en el encabezado para que el comité comprenda el mensaje antes de inspeccionar las barras.',
    },
    {
      id: 'chk-bi3-01-q3',
      type: 'predict-output',
      prompt: 'Si un analista escribe `SELECT s.region, SUM(s.monthly_target_usd * 12) FROM orders o JOIN stores s ON o.store_id = s.store_id GROUP BY s.region`, ¿qué ocurre con la meta anual calculada?',
      options: [
        {
          id: 'a',
          text: 'Devuelve la meta anual exacta de cada región porque el GROUP BY elimina las repeticiones de tiendas.',
          correct: false,
          feedback: 'Incorrecto. GROUP BY agrupa al final, pero SUM() suma el valor de la tienda una vez por cada fila de pedido que coincida en el JOIN.',
        },
        {
          id: 'b',
          text: 'La meta anual de cada tienda se multiplica por la cantidad de pedidos que tuvo esa tienda, inflando masivamente el objetivo.',
          correct: true,
          feedback: 'Correcto. Se produce un abanico (fan-out) porque stores tiene grano de tienda y orders tiene grano de pedido; sumar una columna del lado 1 tras el JOIN la repite en cada pedido.',
        },
        {
          id: 'c',
          text: 'DuckDB arroja un error de sintaxis porque no permite multiplicar dentro de la función agregada SUM.',
          correct: false,
          feedback: 'Incorrecto. La expresión es sintácticamente válida en SQL, lo que hace que este error lógico sea silencioso y peligroso.',
        },
      ],
      explanation: 'Sumar atributos numéricos de una tabla maestra (stores) después de unirla con una tabla de hechos (orders) multiplica la meta de cada tienda por su volumen de pedidos. Siempre debe preagregarse en una CTE separada.',
    },
  ],
  pipelineChallenge: {
    title: 'Secuencia de diseño de un bloque ejecutivo de alta razón dato-tinta',
    description: 'Ordena los 4 pasos metodológicos para transformar una petición ejecutiva en una visualización limpia y auditable.',
    steps: [
      {
        id: 'step-1-grain',
        text: '1. Preagregar en CTEs separadas las métricas de distinto grano (ventas en orders y metas en stores) verificando los filtros canónicos.',
        label: '1. Preagregar en CTEs separadas las métricas de distinto grano (ventas en orders y metas en stores) verificando los filtros canónicos.',
        role: 'SQL / Grano',
        detail: 'Evita el fan-out de metas y excluye pedidos cancelados o pendientes antes de calcular porcentajes.',
      },
      {
        id: 'step-2-encoding',
        text: '2. Seleccionar la codificación de posición en escala común (gráfico de bala o pequeños múltiplos) descartando velocímetros y tartas 3D.',
        label: '2. Seleccionar la codificación de posición en escala común (gráfico de bala o pequeños múltiplos) descartando velocímetros y tartas 3D.',
        role: 'Codificación Visual',
        detail: 'Aplica la jerarquía de Cleveland-McGill y la especificación de Stephen Few.',
      },
      {
        id: 'step-3-dataink',
        text: '3. Depurar la razón dato-tinta suprimiendo rejillas oscuras, bordes redundantes y leyendas separadas en favor de etiquetas directas.',
        label: '3. Depurar la razón dato-tinta suprimiendo rejillas oscuras, bordes redundantes y leyendas separadas en favor de etiquetas directas.',
        role: 'Razón Dato-Tinta',
        detail: 'Elimina el chartjunk preservando el eje cero y las marcas de referencia.',
      },
      {
        id: 'step-4-title',
        text: '4. Coronar el bloque con un título de acción (Minto / IBCS) que declare la conclusión cuantificada y el periodo evaluado.',
        label: '4. Coronar el bloque con un título de acción (Minto / IBCS) que declare la conclusión cuantificada y el periodo evaluado.',
        role: 'Narrativa Ejecutiva',
        detail: 'Sintetiza qué región lidera o incumple la meta para responder en segundos.',
      },
    ],
    correctOrder: ['step-1-grain', 'step-2-encoding', 'step-3-dataink', 'step-4-title'],
    hint: 'Comienza asegurando la exactitud del grano en SQL, elige luego la estructura geométrica, limpia el ruido visual y redacta finalmente el encabezado con el hallazgo.',
  },
  practice: {
    type: 'sql',
    prompt: 'Construye la consulta que alimenta los gráficos de bala de ingresos brutos por región en 2024. Debes devolver 4 columnas exactas: `region`, `actual_revenue_usd` (suma de `total_usd` de pedidos con `status = \'completed\'` en el año `2024`, redondeada a 2 decimales), `annual_target_usd` (suma de `monthly_target_usd * 12` de las tiendas de cada región en `stores`, redondeada a 2 decimales) y `attainment_pct` (`actual_revenue_usd * 100.0 / annual_target_usd` redondeado a 1 decimal). Ordena el resultado por `attainment_pct` de mayor a menor.',
    starterCode: `WITH store_targets AS (
  SELECT
    region,
    -- TODO: calcula annual_target_usd sumando monthly_target_usd * 12 en stores
    0 AS annual_target_usd
  FROM stores
  GROUP BY region
),
regional_sales AS (
  SELECT
    s.region,
    -- TODO: suma o.total_usd redondeado a 2 decimales
    0 AS actual_revenue_usd
  FROM orders o
  JOIN stores s ON o.store_id = s.store_id
  -- TODO: filtra pedidos completados del año 2024
  GROUP BY s.region
)
SELECT
  t.region,
  rs.actual_revenue_usd,
  t.annual_target_usd,
  -- TODO: calcula attainment_pct redondeado a 1 decimal
  0 AS attainment_pct
FROM store_targets t
JOIN regional_sales rs ON t.region = rs.region
ORDER BY attainment_pct DESC;`,
    solution: `WITH store_targets AS (
  SELECT
    region,
    ROUND(SUM(monthly_target_usd) * 12, 2) AS annual_target_usd
  FROM stores
  GROUP BY region
),
regional_sales AS (
  SELECT
    s.region,
    ROUND(SUM(o.total_usd), 2) AS actual_revenue_usd
  FROM orders o
  JOIN stores s ON o.store_id = s.store_id
  WHERE o.status = 'completed'
    AND EXTRACT(YEAR FROM o.order_date) = 2024
  GROUP BY s.region
)
SELECT
  t.region,
  rs.actual_revenue_usd,
  t.annual_target_usd,
  ROUND(rs.actual_revenue_usd * 100.0 / t.annual_target_usd, 1) AS attainment_pct
FROM store_targets t
JOIN regional_sales rs ON t.region = rs.region
ORDER BY attainment_pct DESC;`,
    expected: `WITH store_targets AS (
  SELECT
    region,
    ROUND(SUM(monthly_target_usd) * 12, 2) AS annual_target_usd
  FROM stores
  GROUP BY region
),
regional_sales AS (
  SELECT
    s.region,
    ROUND(SUM(o.total_usd), 2) AS actual_revenue_usd
  FROM orders o
  JOIN stores s ON o.store_id = s.store_id
  WHERE o.status = 'completed'
    AND EXTRACT(YEAR FROM o.order_date) = 2024
  GROUP BY s.region
)
SELECT
  t.region,
  rs.actual_revenue_usd,
  t.annual_target_usd,
  ROUND(rs.actual_revenue_usd * 100.0 / t.annual_target_usd, 1) AS attainment_pct
FROM store_targets t
JOIN regional_sales rs ON t.region = rs.region
ORDER BY attainment_pct DESC;`,
    solutionExplanation: 'La consulta separa en dos CTEs la suma de metas anuales de stores (store_targets) y la suma de ingresos completados de 2024 en orders (regional_sales). Al unirlas por region (4 filas), calcula attainment_pct sin duplicar las cuotas de las tiendas: Cono Sur alcanza 45,6 %, Andina 29,8 %, Iberia 22,3 % y Norteamérica 10,2 %.',
    orderMatters: true,
    hints: [
      'En la CTE store_targets calcula ROUND(SUM(monthly_target_usd) * 12, 2) AS annual_target_usd agrupando únicamente la tabla stores por region.',
      'En la CTE regional_sales filtra WHERE o.status = \'completed\' AND EXTRACT(YEAR FROM o.order_date) = 2024 antes de agrupar por s.region.',
      'En el SELECT final calcula ROUND(rs.actual_revenue_usd * 100.0 / t.annual_target_usd, 1) AS attainment_pct y ordena con ORDER BY attainment_pct DESC.',
    ],
  },
  roleNotes: {
    de: 'Expón vistas semánticas donde las metas de stores y los hechos de orders estén preagregados o documentados con su grano explícito, evitando que herramientas de BI multipliquen presupuestos al cruzar tablas.',
    da: 'Sustituye los velocímetros y tartas por gráficos de bala y pequeños múltiplos; acompaña siempre cada bloque visual con un título activo que cuantifique el hallazgo principal.',
    bi: 'Aplica las reglas de notación IBCS en tus plantillas corporativas: barras sólidas para el valor real, marcadores perpendiculares para la meta y cero efectos tridimensionales.',
  },
  summary: [
    'La razón dato-tinta de Edward Tufte exige eliminar adornos decorativos conservando siempre los ejes y referencias de escala.',
    'El gráfico de bala de Stephen Few reemplaza a los velocímetros codificando valor real, meta y umbrales en una escala lineal.',
    'Los sparklines y pequeños múltiplos comparan tendencias temporales y regiones con escalas compartidas sin saturar el lienzo.',
    'Bajo Minto e IBCS, todo bloque ejecutivo debe encabezarse con un título de acción que declare la conclusión cuantificada.',
  ],
  flashcards: [
    {
      id: 'fc-bi3-01-1',
      front: '¿Qué mide la razón dato-tinta (data-ink ratio) de Edward Tufte y cuál es su límite práctico?',
      back: 'Mide la fracción de tinta del gráfico dedicada a datos no redundantes. Su límite práctico es no borrar nunca los ejes, unidades ni referencias necesarias para interpretar la escala.',
    },
    {
      id: 'fc-bi3-01-2',
      front: '¿Cuáles son los 5 componentes de un gráfico de bala (bullet graph) según Stephen Few?',
      back: 'Etiqueta de texto, escala cuantitativa lineal, barra central de medida principal, marcador perpendicular de comparación (meta) y bandas cualitativas de fondo.',
    },
    {
      id: 'fc-bi3-01-3',
      front: '¿Qué diferencia a un título de acción (IBCS / Minto) de un título descriptivo?',
      back: 'El título descriptivo solo nombra las variables ("Ventas por región"), mientras el título de acción enuncia la conclusión cuantificada ("Cono Sur lidera el cumplimiento con 45,6 % en 2024").',
    },
    {
      id: 'fc-bi3-01-4',
      front: '¿Por qué debe calcularse la meta anual de stores en una CTE separada antes de unirla con orders?',
      back: 'Porque stores tiene grano de tienda y orders tiene grano de pedido; unir primero y sumar después multiplica la meta de cada tienda por su número de pedidos (fan-out).',
    },
  ],
  sources: [
    {
      title: 'Bullet Graph Design Specification',
      url: 'https://www.perceptualedge.com/articles/misc/Bullet_Graph_Design_Spec.pdf',
      publisher: 'Stephen Few (Perceptual Edge)',
      accessed: '2026-10-29',
      supports: 'Especificación de los cinco componentes del gráfico de bala como reemplazo lineal de los velocímetros radiales.',
    },
    {
      title: 'Fundamentals of Data Visualization — Cap. 23: Balance the data and the context',
      url: 'https://clauswilke.com/dataviz/balance-data-context.html',
      publisher: 'Claus O. Wilke (O\'Reilly)',
      accessed: '2026-10-29',
      supports: 'Formalización de la razón dato-tinta de Tufte, erradicación de chartjunk y preservación del contexto visual.',
    },
    {
      title: 'International Business Communication Standards (IBCS) Version 2.0',
      url: 'https://www.ibcs.com/ibcs-version-2-0/',
      publisher: 'IBCS Association',
      accessed: '2026-10-29',
      supports: 'Estructura de títulos activos con mensaje ejecutivo y notación consistente entre valores reales y metas.',
    },
    {
      title: 'Fundamentals of Data Visualization — Cap. 21: Multi-panel figures',
      url: 'https://clauswilke.com/dataviz/multi-panel-figures.html',
      publisher: 'Claus O. Wilke (O\'Reilly)',
      accessed: '2026-10-29',
      supports: 'Diseño de pequeños múltiplos con escalas compartidas para comparar regiones sin gráficos espagueti.',
    },
  ],
  aiNotes: 'Guía al estudiante para que preagregue las metas de stores en una CTE independiente antes del JOIN con orders. Enfatiza que Cono Sur logra 45,6 % de cumplimiento bruto ($919.026,32 / $2.016.000,00) y 43,8 % neto en 2024, y pide siempre títulos de acción cuantificados.',
};

export default lesson;
