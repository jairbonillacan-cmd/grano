export const lesson = {
  id: 'bi3-dashboards-02-jerarquia-visual-reticula-10s',
  moduleId: 'bi3-dashboards',
  track: 'bi',
  tracks: ['bi', 'da'],
  level: 3,
  order: 2,
  contentVersion: 2,
  title: 'Jerarquía visual, retícula y lectura en 10 segundos',
  subtitle: 'Jerarquía visual, retícula y patrón de lectura para responder en 10 segundos',
  minutes: 20,
  prerequisites: ['bi3-dashboards-01-bi-tufte-code'],
  glossaryTerms: [
    'bi3-jerarquia-visual',
    'bi3-patron-lectura-f-z',
    'bi3-titulo-accion',
    'bi3-grafico-de-bala',
  ],
  datasets: ['orders', 'stores', 'calendar'],
  needsReview: false,
  hook: 'La directora de operaciones de Mercado Brisa abre el informe semanal y encuentra nueve tarjetas numéricas sin variación histórica, una tabla de catorce tiendas arriba a la izquierda y un gráfico de tendencia escondido al final de la página. ¿Cómo estructuramos una retícula que responda el estado del negocio en menos de diez segundos?',
  objectives: [
    'Aplicar la regla de los 5 a 10 segundos de Stephen Few organizando el tablero en tres niveles de jerarquía visual.',
    'Alinear la retícula modular de 12 columnas con los patrones de escaneo ocular en F y en Z documentados por Nielsen Norman Group.',
    'Diseñar tarjetas de indicadores principales con contexto comparativo obligatorio (variación interanual o desviación contra meta).',
    'Escribir en DuckDB las consultas de resumen ejecutivo y productividad por formato de tienda que alimentan las franjas superior y media del tablero.',
  ],
  sections: [
    {
      id: 'sec-regla-10-segundos-few',
      heading: 'La regla de los 10 segundos y los tres niveles de jerarquía',
      body: 'Para **Stephen Few**, un tablero es un monitor visual concentrado en una sola pantalla. Su función es supervisar la información crítica para alcanzar objetivos de negocio de un vistazo. La prueba operativa de este principio es la **regla de los 10 segundos**. Un directivo debe detectar cualquier desviación crítica en menos de diez segundos y sin usar barras de desplazamiento.\n\nCuando todos los bloques tienen el mismo tamaño, grosor tipográfico y borde, nada destaca en el lienzo. La **jerarquía visual** resuelve esta competencia por la atención mediante cuatro variables: posición espacial, tamaño relativo, peso tipográfico y espacio en blanco (*whitespace*).\n\nUn tablero bien estructurado divide la pantalla en tres franjas jerárquicas. La **franja superior** presenta de 3 a 4 indicadores globales con su variación porcentual. La **franja media** explica las causas mediante comparaciones por categoría y series temporales. Finalmente, la **franja inferior** ofrece una tabla compacta de entidades para verificar casos concretos.',
    },
    {
      id: 'sec-patrones-f-z-reticula',
      heading: 'Patrones de lectura en F y Z sobre una retícula de 12 columnas',
      body: 'Los estudios de seguimiento ocular (*eye-tracking*) de **Nielsen Norman Group** demuestran que no leemos un tablero celda por celda. En interfaces densas predomina el **patrón de escaneo en F**. El ojo fija primero la esquina superior izquierda y recorre horizontalmente la fila superior. Luego desciende por el margen izquierdo y realiza un segundo barrido horizontal más corto. En tableros modulares simples aparece también el **patrón en Z**, que cruza la parte superior y baja en diagonal.\n\nEsta evidencia empírica dicta qué colocar en cada coordenada de una **retícula de 12 columnas**. La esquina superior izquierda es la zona más valiosa del tablero. Allí debe ubicarse el indicador primario del negocio con su variación interanual, nunca un logotipo gigante ni diez filtros.\n\nPara evitar la fatiga cognitiva, **Microsoft Learn** recomienda limitar cada vista a un máximo de 6 a 8 objetos visuales. Cada tarjeta superior ocupa 3 o 4 columnas de la retícula, mientras los gráficos comparativos centrales ocupan 6 columnas cada uno.',
      diagram: `flowchart TD
  subgraph Reticula["Retícula modular de 12 columnas (lectura en 10 segundos)"]
    direction TB
    F1["Franja 1 (Arriba-Izquierda a Derecha, 3x4 cols):<br/>KPI 1: Ingreso 2024 ($2,73M, +220,9 % YoY) | KPI 2: Pedidos (6.497) | KPI 3: Cumplimiento (24,6 %)"]
    F2["Franja 2 (Centro, 6 + 6 cols):<br/>Izq: Crecimiento YoY por región (2023 vs 2024) | Der: Productividad por formato ($/m²)"]
    F3["Franja 3 (Pie, 12 cols):<br/>Tabla ordenada de las 14 tiendas con cifra tabular, meta anual y sparkline mensual"]
    F1 --> F2 --> F3
  end`,
    },
    {
      id: 'sec-tarjetas-kpi-con-contexto',
      heading: 'Prohibición de cifras huérfanas: contexto en tarjetas y franja media',
      body: 'Un defecto frecuente en Business Intelligence es publicar tarjetas con un número aislado en fuente gigante, como `$2.731.516,50`. Sin un punto de comparación, ese número es mudo. El lector no sabe si representa un récord histórico o una caída del 30 % frente al presupuesto.\n\nToda tarjeta de la franja superior debe incluir tres datos obligatorios en menos de 120 píxeles de altura. Debe mostrar el valor del periodo actual, la referencia comparativa (`YoY` o `Plan`) y la variación relativa (`+220,9 % vs. 2023`).\n\nDebajo de las tarjetas, la franja media desglosa ese titular por las dimensiones principales del negocio. En Mercado Brisa comparamos los ingresos completados de 2023 (`$851.117,35`) contra los de 2024 (`$2.731.516,50`) por región. Así revelamos en dos segundos que Cono Sur y Andina lideran tanto en volumen absoluto como en crecimiento interanual.',
      example: {
        language: 'sql',
        code: `SELECT
  s.region,
  ROUND(SUM(CASE WHEN EXTRACT(YEAR FROM o.order_date) = 2023 THEN o.total_usd ELSE 0 END), 2) AS rev_2023_usd,
  ROUND(SUM(CASE WHEN EXTRACT(YEAR FROM o.order_date) = 2024 THEN o.total_usd ELSE 0 END), 2) AS rev_2024_usd,
  ROUND(
    (SUM(CASE WHEN EXTRACT(YEAR FROM o.order_date) = 2024 THEN o.total_usd ELSE 0 END)
     - SUM(CASE WHEN EXTRACT(YEAR FROM o.order_date) = 2023 THEN o.total_usd ELSE 0 END))
    * 100.0
    / SUM(CASE WHEN EXTRACT(YEAR FROM o.order_date) = 2023 THEN o.total_usd ELSE 0 END),
    1
  ) AS yoy_growth_pct
FROM orders o
JOIN stores s ON o.store_id = s.store_id
WHERE o.status = 'completed'
  AND EXTRACT(YEAR FROM o.order_date) IN (2023, 2024)
GROUP BY s.region
ORDER BY rev_2024_usd DESC;`,
        explanation: 'Esta consulta alimenta el bloque izquierdo de la franja media: calcula en una sola pasada los ingresos completados de 2023 y 2024 junto con su variación porcentual YoY. Cono Sur crece un 243,0 % (de $267.940,97 a $919.026,32) y Andina un 222,6 % (de $266.101,54 a $858.331,08).',
      },
    },
  ],
  workedExample: {
    title: 'Diseño de consultas para las franjas 1 y 2 del tablero ejecutivo (2024)',
    problem: 'El Comité de Dirección necesita poblar la franja media del tablero con una comparativa de productividad comercial en 2024 según el formato físico de tienda (`store_type`: `retail`, `flagship`, `warehouse`), reportando cantidad de tiendas, pedidos completados, ingresos totales en USD e ingreso por metro cuadrado (`revenue_per_sqm_usd`).',
    steps: [
      {
        label: 'Paso 1: Agregar la superficie física en metros cuadrados por formato en stores',
        sql: `SELECT
  store_type,
  COUNT(*) AS store_count,
  SUM(area_sqm) AS total_area_sqm
FROM stores
GROUP BY store_type
ORDER BY total_area_sqm DESC;`,
        explanation: 'Calculamos en el grano de stores la superficie total de cada formato: 3 almacenes (warehouse) suman 10.800 m², 7 tiendas retail suman 2.520 m² y 4 tiendas insignia (flagship) suman 2.130 m².',
      },
      {
        label: 'Paso 2: Agregar pedidos e ingresos completados de 2024 por formato de tienda',
        sql: `SELECT
  s.store_type,
  COUNT(o.order_id) AS completed_orders,
  ROUND(SUM(o.total_usd), 2) AS revenue_2024_usd
FROM orders o
JOIN stores s ON o.store_id = s.store_id
WHERE o.status = 'completed'
  AND EXTRACT(YEAR FROM o.order_date) = 2024
GROUP BY s.store_type
ORDER BY revenue_2024_usd DESC;`,
        explanation: 'En 2024 el formato retail genera $1.519.007,30 en 3.707 pedidos completados, seguido por flagship con $622.292,46 (1.658 pedidos) y warehouse con $590.216,74 (1.132 pedidos).',
      },
      {
        label: 'Paso 3: Combinar ambos granos para obtener la productividad por metro cuadrado',
        sql: `WITH type_area AS (
  SELECT
    store_type,
    COUNT(*) AS store_count,
    SUM(area_sqm) AS total_area_sqm
  FROM stores
  GROUP BY store_type
),
type_sales AS (
  SELECT
    s.store_type,
    COUNT(o.order_id) AS completed_orders,
    ROUND(SUM(o.total_usd), 2) AS revenue_2024_usd
  FROM orders o
  JOIN stores s ON o.store_id = s.store_id
  WHERE o.status = 'completed'
    AND EXTRACT(YEAR FROM o.order_date) = 2024
  GROUP BY s.store_type
)
SELECT
  a.store_type,
  a.store_count,
  ts.completed_orders,
  ts.revenue_2024_usd,
  ROUND(ts.revenue_2024_usd / a.total_area_sqm, 2) AS revenue_per_sqm_usd
FROM type_area a
JOIN type_sales ts ON a.store_type = ts.store_type
ORDER BY revenue_2024_usd DESC;`,
        explanation: 'Al cruzar ambas CTEs, el tablero revela de inmediato que las tiendas retail rinden $602,78 por m², más del doble que las tiendas flagship ($292,16/m²) y once veces más que los almacenes ($54,65/m²).',
      },
    ],
    takeaway: 'Ubicar el resumen global en la franja superior y el desglose por formato y región en la franja media permite diagnosticar qué canal impulsa la rentabilidad en menos de diez segundos.',
  },
  checks: [
    {
      id: 'chk-bi3-02-q1',
      type: 'mcq',
      prompt: 'De acuerdo con los estudios de seguimiento ocular de Nielsen Norman Group y las guías de diseño de Power BI, ¿qué elemento debe ocupar la esquina superior izquierda de un tablero ejecutivo?',
      options: [
        {
          id: 'a',
          text: 'El logotipo corporativo a gran escala junto con la fecha de última actualización del servidor.',
          correct: false,
          feedback: 'Incorrecto. Ocupar la zona de primera fijación ocular con metadatos decorativos desperdicia el área de mayor atención visual.',
        },
        {
          id: 'b',
          text: 'El indicador clave principal del negocio acompañado de su comparación contra meta o periodo anterior.',
          correct: true,
          feedback: 'Correcto. Tanto el patrón en F como el patrón en Z inician el recorrido en la esquina superior izquierda, por lo que allí debe situarse el KPI más crítico con su contexto.',
        },
        {
          id: 'c',
          text: 'Una tabla transaccional con todas las columnas de pedidos para que el usuario filtre manualmente.',
          correct: false,
          feedback: 'Incorrecto. Las tablas de grano fino pertenecen a la franja inferior o a páginas de perforación (drill-through), nunca al punto de entrada del escaneo.',
        },
        {
          id: 'd',
          text: 'Un bloque de ocho segmentadores desplegables con todas las dimensiones del modelo semántico.',
          correct: false,
          feedback: 'Incorrecto. Colocar una pared de filtros arriba a la izquierda retrasa la respuesta a la pregunta principal y rompe la regla de los 10 segundos.',
        },
      ],
      explanation: 'La esquina superior izquierda es el punto de anclaje inicial del escaneo ocular en F y Z; reservarla para el KPI primario con su variación permite evaluar el estado general al instante.',
    },
    {
      id: 'chk-bi3-02-q2',
      type: 'mcq',
      prompt: '¿Por qué una tarjeta KPI que muestra únicamente el texto "$2.731.516,50 — Ingresos 2024" incumple las reglas de jerarquía e información de Stephen Few?',
      options: [
        {
          id: 'a',
          text: 'Porque los ingresos monetarios nunca deben mostrarse con decimales en un modelo analítico.',
          correct: false,
          feedback: 'Incorrecto. El nivel de redondeo depende de la escala, pero el fallo estructural de la tarjeta no son los decimales sino la falta de referencia comparativa.',
        },
        {
          id: 'b',
          text: 'Porque carece de contexto comparativo (meta o periodo previo), impidiendo saber en diez segundos si el desempeño es favorable o crítico.',
          correct: true,
          feedback: 'Correcto. Una cifra aislada sin variación contra presupuesto (Plan) o año anterior (YoY) no permite emitir un juicio de valor ni tomar decisiones.',
        },
        {
          id: 'c',
          text: 'Porque las tarjetas numéricas están prohibidas en los tableros y deben sustituirse siempre por mapas coropléticos.',
          correct: false,
          feedback: 'Incorrecto. Las tarjetas de resumen son válidas en la franja superior siempre que incluyan comparación explícita y variación.',
        },
        {
          id: 'd',
          text: 'Porque en una retícula de 12 columnas las tarjetas solo pueden colocarse en el margen inferior derecho.',
          correct: false,
          feedback: 'Incorrecto. Las tarjetas de resumen global se ubican en la franja superior, no en el pie del lienzo.',
        },
      ],
      explanation: 'Un indicador clave de rendimiento (KPI) requiere por definición una medida real comparada contra un objetivo o referencia histórica; sin esa variación, es solo un número huérfano.',
    },
    {
      id: 'chk-bi3-02-q3',
      type: 'order',
      prompt: 'Ordena de arriba hacia abajo (del primer vistazo al detalle) los tres niveles de una retícula de tablero diseñada para responder en 10 segundos:',
      items: [
        'Franja superior: 3 a 4 indicadores globales con variación porcentual contra meta y año anterior.',
        'Franja media: Gráficos comparativos por región o formato y evolución temporal para explicar causas.',
        'Franja inferior: Tabla ordenada de tiendas o productos con cifras tabulares para auditar entidades.',
      ],
      correctOrder: [
        'Franja superior: 3 a 4 indicadores globales con variación porcentual contra meta y año anterior.',
        'Franja media: Gráficos comparativos por región o formato y evolución temporal para explicar causas.',
        'Franja inferior: Tabla ordenada de tiendas o productos con cifras tabulares para auditar entidades.',
      ],
      explanation: 'El flujo de lectura desciende desde la síntesis global (qué ocurre) hacia el diagnóstico dimensional y temporal (por qué ocurre) y culmina en la evidencia granular por entidad (dónde actuar).',
    },
  ],
  practice: {
    type: 'sql',
    prompt: 'Construye la consulta que alimenta el bloque de productividad por formato de tienda en la franja media del tablero para el año 2024. Debes devolver 5 columnas exactas: `store_type`, `store_count` (cantidad de tiendas del formato en `stores`), `completed_orders` (cantidad de pedidos con `status = \'completed\'` en `2024`), `revenue_2024_usd` (suma de `total_usd` de esos pedidos redondeada a 2 decimales) y `revenue_per_sqm_usd` (`revenue_2024_usd` dividido entre la suma de `area_sqm` de las tiendas del formato en `stores`, redondeado a 2 decimales). Ordena por `revenue_2024_usd` de mayor a menor.',
    starterCode: `WITH type_area AS (
  SELECT
    store_type,
    COUNT(*) AS store_count,
    -- TODO: suma area_sqm como total_area_sqm
    0 AS total_area_sqm
  FROM stores
  GROUP BY store_type
),
type_sales AS (
  SELECT
    s.store_type,
    -- TODO: cuenta pedidos y suma o.total_usd redondeado a 2 decimales
    0 AS completed_orders,
    0 AS revenue_2024_usd
  FROM orders o
  JOIN stores s ON o.store_id = s.store_id
  -- TODO: filtra status = 'completed' y año 2024
  GROUP BY s.store_type
)
SELECT
  a.store_type,
  a.store_count,
  ts.completed_orders,
  ts.revenue_2024_usd,
  -- TODO: calcula revenue_per_sqm_usd redondeado a 2 decimales
  0 AS revenue_per_sqm_usd
FROM type_area a
JOIN type_sales ts ON a.store_type = ts.store_type
ORDER BY revenue_2024_usd DESC;`,
    solution: `WITH type_area AS (
  SELECT
    store_type,
    COUNT(*) AS store_count,
    SUM(area_sqm) AS total_area_sqm
  FROM stores
  GROUP BY store_type
),
type_sales AS (
  SELECT
    s.store_type,
    COUNT(o.order_id) AS completed_orders,
    ROUND(SUM(o.total_usd), 2) AS revenue_2024_usd
  FROM orders o
  JOIN stores s ON o.store_id = s.store_id
  WHERE o.status = 'completed'
    AND EXTRACT(YEAR FROM o.order_date) = 2024
  GROUP BY s.store_type
)
SELECT
  a.store_type,
  a.store_count,
  ts.completed_orders,
  ts.revenue_2024_usd,
  ROUND(ts.revenue_2024_usd / a.total_area_sqm, 2) AS revenue_per_sqm_usd
FROM type_area a
JOIN type_sales ts ON a.store_type = ts.store_type
ORDER BY revenue_2024_usd DESC;`,
    expected: `WITH type_area AS (
  SELECT
    store_type,
    COUNT(*) AS store_count,
    SUM(area_sqm) AS total_area_sqm
  FROM stores
  GROUP BY store_type
),
type_sales AS (
  SELECT
    s.store_type,
    COUNT(o.order_id) AS completed_orders,
    ROUND(SUM(o.total_usd), 2) AS revenue_2024_usd
  FROM orders o
  JOIN stores s ON o.store_id = s.store_id
  WHERE o.status = 'completed'
    AND EXTRACT(YEAR FROM o.order_date) = 2024
  GROUP BY s.store_type
)
SELECT
  a.store_type,
  a.store_count,
  ts.completed_orders,
  ts.revenue_2024_usd,
  ROUND(ts.revenue_2024_usd / a.total_area_sqm, 2) AS revenue_per_sqm_usd
FROM type_area a
JOIN type_sales ts ON a.store_type = ts.store_type
ORDER BY revenue_2024_usd DESC;`,
    solutionExplanation: 'La CTE type_area suma los metros cuadrados en el grano de stores sin duplicarlos por pedido, mientras type_sales agrega los pedidos e ingresos completados de 2024. El resultado muestra que retail genera $1.519.007,30 ($602,78/m²), flagship $622.292,46 ($292,16/m²) y warehouse $590.216,74 ($54,65/m²).',
    orderMatters: true,
    hints: [
      'En type_area utiliza SUM(area_sqm) AS total_area_sqm agrupando solo la tabla stores por store_type.',
      'En type_sales filtra WHERE o.status = \'completed\' AND EXTRACT(YEAR FROM o.order_date) = 2024 y calcula COUNT(o.order_id) y ROUND(SUM(o.total_usd), 2).',
      'En el SELECT principal divide ts.revenue_2024_usd entre a.total_area_sqm envolviendo el cociente en ROUND(..., 2) AS revenue_per_sqm_usd.',
    ],
  },
  roleNotes: {
    de: 'Precalcula o expón atributos dimensionales como area_sqm y monthly_target_usd en tablas de dimensiones conformadas para que las consultas de productividad por superficie no sufran fan-out.',
    da: 'Limita cada vista a un máximo de 6 a 8 bloques sobre una retícula de 12 columnas y nunca publiques una tarjeta numérica sin su comparación porcentual contra meta o año previo.',
    bi: 'Alinea tus plantillas corporativas al patrón de lectura en F: reserva la fila superior para KPIs globales con contexto, la franja central para comparaciones y el pie para tablas detalladas.',
  },
  summary: [
    'La regla de los 10 segundos de Stephen Few exige que un tablero comunique el estado del negocio en una sola pantalla sin desplazamiento.',
    'Los patrones de escaneo ocular en F y Z sitúan el punto de entrada en la esquina superior izquierda, reservada para el KPI primario.',
    'Una retícula de 12 columnas organiza el lienzo en tres niveles: resumen global arriba, comparaciones causales en el centro y detalle abajo.',
    'Toda tarjeta ejecutiva debe acompañar la cifra actual con su variación relativa frente a la meta o al periodo anterior.',
  ],
  flashcards: [
    {
      id: 'fc-bi3-02-1',
      front: '¿Qué establece la regla de los 10 segundos en el diseño de tableros?',
      back: 'Que el usuario debe identificar el estado general del negocio y detectar cualquier anomalía crítica en menos de 10 segundos dentro de una sola pantalla sin hacer scroll.',
    },
    {
      id: 'fc-bi3-02-2',
      front: '¿Cómo influyen los patrones de lectura en F y en Z en la distribución de una retícula de 12 columnas?',
      back: 'Ambos patrones inician la fijación ocular en la esquina superior izquierda y barren horizontalmente la fila superior, por lo que allí deben colocarse los KPIs globales más importantes.',
    },
    {
      id: 'fc-bi3-02-3',
      front: '¿Qué tres datos mínimos debe contener una tarjeta KPI en la franja superior de un tablero?',
      back: 'La cifra del periodo actual, el valor de referencia (meta o periodo anterior) y la variación explícita (porcentual o absoluta).',
    },
    {
      id: 'fc-bi3-02-4',
      front: 'En Mercado Brisa 2024, ¿qué formato de tienda lidera la productividad en dólares por metro cuadrado?',
      back: 'El formato retail con $602,78/m² ($1.519.007,30 en 2.520 m²), superando a flagship ($292,16/m²) y warehouse ($54,65/m²).',
    },
  ],
  sources: [
    {
      title: 'Common Problems in Dashboard Design',
      url: 'https://www.perceptualedge.com/articles/Whitepapers/Dashboard_Design.pdf',
      publisher: 'Stephen Few (Perceptual Edge)',
      accessed: '2026-10-29',
      supports: 'Definición de tablero como monitor visual en una sola pantalla para responder en pocos segundos sin fragmentación.',
    },
    {
      title: 'Tips for designing a great Power BI dashboard',
      url: 'https://learn.microsoft.com/en-us/power-bi/create-reports/service-dashboards-design-tips',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Recomendaciones de ubicación en la esquina superior izquierda, límite de objetos visuales por vista y uso de espacio en blanco.',
    },
    {
      title: 'F-Shaped Pattern of Reading on the Web: Misunderstood, But Still Relevant',
      url: 'https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/',
      publisher: 'Nielsen Norman Group',
      accessed: '2026-10-29',
      supports: 'Evidencia de seguimiento ocular sobre fijación superior izquierda y barrido horizontal-vertical en pantallas de información.',
    },
    {
      title: 'Visual Hierarchy in UX: Definition',
      url: 'https://www.nngroup.com/articles/visual-hierarchy-ux-definition/',
      publisher: 'Nielsen Norman Group',
      accessed: '2026-10-29',
      supports: 'Uso de escala, peso tipográfico, posición y agrupación para guiar la secuencia de inspección visual.',
    },
  ],
  aiNotes: 'Recuerda al estudiante que la superficie area_sqm reside en stores (grano tienda) y debe sumarse en una CTE previa antes de dividir los ingresos de orders. En 2024, retail logra $602,78/m², flagship $292,16/m² y warehouse $54,65/m².',
};

export default lesson;
