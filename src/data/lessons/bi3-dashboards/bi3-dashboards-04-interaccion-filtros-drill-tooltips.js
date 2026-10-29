export const lesson = {
  id: 'bi3-dashboards-04-interaccion-filtros-drill-tooltips',
  moduleId: 'bi3-dashboards',
  track: 'bi',
  tracks: ['bi', 'da'],
  level: 3,
  order: 4,
  contentVersion: 2,
  title: 'Interacción útil: filtros, drill-through y tooltips',
  subtitle: 'Interacción útil: filtros, perforación (drill-through), tooltips y estados vacíos',
  minutes: 20,
  prerequisites: ['bi3-dashboards-03-color-contraste-wcag-daltonismo'],
  glossaryTerms: [
    'bi3-perforacion-drill-through',
    'bi3-estado-vacio-informativo',
    'bi3-jerarquia-visual',
  ],
  datasets: ['orders', 'refunds', 'stores'],
  needsReview: false,
  hook: 'Un gerente regional de Mercado Brisa selecciona "Iberia", "4.º trimestre" y "Defecto de molino" en un tablero con nueve segmentadores. De repente, tres gráficos quedan completamente en blanco sin ningún mensaje explicativo: ¿se rompió la conexión SQL o realmente hubo cero devoluciones en ciertas tiendas?',
  objectives: [
    'Gobernar la arquitectura interactiva del tablero mediante el mantra de Ben Shneiderman: vista general primero, zoom y filtro, y detalles bajo demanda.',
    'Elegir con criterio entre segmentadores en lienzo, filtrado cruzado (cross-filtering), resaltado cruzado (cross-highlighting), tooltips de página y perforación (drill-through).',
    'Prevenir estados vacíos silenciosos diseñando consultas con LEFT JOIN y COALESCE que distingan entre "cero incidencias" y un error de datos.',
    'Construir en DuckDB la vista de perforación de devoluciones por tienda para el cuarto trimestre de 2024 preservando las catorce tiendas del catálogo.',
  ],
  sections: [
    {
      id: 'sec-mantra-shneiderman-slicers',
      heading: 'El mantra de Shneiderman y la disciplina en los filtros',
      body: 'En 1996, **Ben Shneiderman** formuló el principio rector de la exploración visual interactiva: *"Overview first, zoom and filter, then details-on-demand"*. Esto significa mostrar primero la vista general, aplicar zoom y filtro después, y desplegar detalles bajo demanda al final. Muchos tableros fracasan porque invierten este orden y reciben al usuario con diez filtros antes del resumen.\n\nLa disciplina en los **segmentadores** (*slicers*) exige separar los filtros cotidianos de los filtros estructurales. En el lienzo visible solo deben colocarse de **2 a 3 segmentadores** principales, como periodo y región. Los filtros secundarios de auditoría se delegan al panel lateral de filtros (*Filter pane*).\n\nAdemás, **Microsoft Learn** distingue entre **filtrado cruzado** (*cross-filtering*) y **resaltado cruzado** (*cross-highlighting*). El filtrado cruzado reescala el eje completo al elegir una categoría, ocultando el peso sobre el total. El resaltado cruzado, en cambio, conserva la barra total de fondo y atenúa el resto para mostrar la proporción real.',
    },
    {
      id: 'sec-tooltips-vs-drillthrough',
      heading: 'Detalles bajo demanda: tooltips emergentes frente a drill-through',
      body: 'Para entregar detalles bajo demanda sin saturar la vista principal, existen dos mecanismos complementarios: las **descripciones emergentes** (*report page tooltips*) y las **páginas de perforación** (*drill-through*).\n\nUn **tooltip emergente** responde dudas rápidas sin que el usuario abandone la página actual. Al pasar el cursor sobre las devoluciones de una región, una tarjeta flotante muestra el desglose de los cinco motivos de reembolso. Por diseño, un tooltip debe ser muy ligero, no admite clics internos y debe responder en milisegundos.\n\nUna **página de perforación** (*drill-through*), por el contrario, sirve para una investigación profunda. El usuario hace clic derecho o pulsa un botón contextual sobre una tienda y navega hacia una página dedicada. Esa vista hereda automáticamente el filtro de la entidad elegida, muestra la tabla de pedidos afectados e incluye un botón de retorno.',
      diagram: `flowchart LR
  O["1. Vista general (Overview):<br/>KPIs globales y cumplimiento por región"]
  F["2. Zoom y filtro (Slicers / Cross-filter):<br/>Acotar año 2024 o región Andina"]
  T["3a. Tooltip emergente (Hover):<br/>Micro-desglose rápido de los 5 motivos<br/>sin salir de la página"]
  D["3b. Perforación / Drill-through (Clic):<br/>Navegar a página de auditoría por tienda<br/>con tabla detallada y botón Volver"]
  O --> F
  F --> T
  F --> D`,
    },
    {
      id: 'sec-estados-vacios-left-join-coalesce',
      heading: 'Diseño defensivo de estados vacíos con LEFT JOIN y COALESCE',
      body: 'Al combinar múltiples filtros o perforar por tienda y trimestre, una selección legítima puede devolver **cero filas** en la tabla de hechos. Si la consulta une `stores` con `refunds` mediante un `INNER JOIN`, toda tienda sin devoluciones en ese trimestre desaparecerá silenciosamente.\n\nEn la interfaz, un conjunto vacío mal gestionado produce tarjetas con el texto `(En blanco)` o tablas vacías sin explicación. El usuario no sabe si la tienda tuvo un desempeño perfecto (`0` incidencias) o si falló la carga de datos.\n\nUn **estado vacío informativo** (*informative empty state*) resuelve esto en dos capas. En SQL, anclamos la consulta en la dimensión (`stores`) usando `LEFT JOIN` hacia los hechos prefiltrados y aplicamos `COALESCE(..., 0)` para conservar las 14 tiendas. En la capa visual, acompañamos el valor `0` con el mensaje *"Sin incidencias en el periodo"* y un botón para restablecer filtros.',
      example: {
        language: 'sql',
        code: `SELECT
  r.reason,
  COUNT(r.refund_id) AS refund_count,
  ROUND(SUM(r.refund_amount_usd), 2) AS total_refund_usd,
  ROUND(AVG(r.refund_amount_usd), 2) AS avg_refund_usd
FROM refunds r
JOIN orders o ON r.order_id = o.order_id
WHERE r.status = 'processed'
  AND EXTRACT(YEAR FROM o.order_date) = 2024
GROUP BY r.reason
ORDER BY total_refund_usd DESC;`,
        explanation: 'Esta consulta alimenta el tooltip emergente de motivos de devolución procesados en 2024: cambio_opinion lidera con $33.416,51 (142 casos), seguido por retraso_envio ($30.682,89), defecto_molino ($26.800,30), tueste_incorrecto ($26.681,68) y empaque_danado ($24.055,25).',
      },
    },
  ],
  workedExample: {
    title: 'Auditoría drill-through de devoluciones por defecto de molino en Q4 2024 con estado vacío explícito',
    problem: 'El equipo de calidad perfora (drill-through) hacia las devoluciones procesadas por motivo `\'defecto_molino\'` durante el cuarto trimestre de 2024 (`2024-10-01` a `2024-12-31`). Debemos listar las 14 tiendas de Mercado Brisa sin que desaparezcan aquellas que tuvieron cero incidencias en ese trimestre, mostrando una etiqueta explícita de estado vacío.',
    steps: [
      {
        label: 'Paso 1: Comprobar qué ocurre si usamos INNER JOIN en Q4 2024 (pérdida de tiendas)',
        sql: `SELECT
  o.store_id,
  COUNT(r.refund_id) AS defect_refunds,
  ROUND(SUM(r.refund_amount_usd), 2) AS defect_amount_usd
FROM orders o
JOIN refunds r ON o.order_id = r.order_id
WHERE r.status = 'processed'
  AND r.reason = 'defecto_molino'
  AND o.order_date >= DATE '2024-10-01'
  AND o.order_date < DATE '2025-01-01'
GROUP BY o.store_id
ORDER BY defect_amount_usd DESC;`,
        explanation: 'Esta consulta solo devuelve 10 tiendas. Las tiendas 5 (El Poblado), 11 (Eixample), 13 (Sabana) y 14 (Coslada) no tuvieron devoluciones por defecto_molino en Q4 2024 y desaparecen del resultado.',
      },
      {
        label: 'Paso 2: Anclar en stores con LEFT JOIN y proteger nulos mediante COALESCE',
        sql: `WITH q4_defects AS (
  SELECT
    o.store_id,
    COUNT(r.refund_id) AS defect_refunds,
    ROUND(SUM(r.refund_amount_usd), 2) AS defect_amount_usd
  FROM orders o
  JOIN refunds r ON o.order_id = r.order_id
  WHERE r.status = 'processed'
    AND r.reason = 'defecto_molino'
    AND o.order_date >= DATE '2024-10-01'
    AND o.order_date < DATE '2025-01-01'
  GROUP BY o.store_id
)
SELECT
  s.store_id,
  s.store_name,
  s.region,
  COALESCE(q.defect_refunds, 0) AS defect_refunds,
  COALESCE(q.defect_amount_usd, 0.00) AS defect_amount_usd
FROM stores s
LEFT JOIN q4_defects q ON s.store_id = q.store_id
ORDER BY defect_amount_usd DESC, s.store_id ASC;`,
        explanation: 'Al prefiltrar los hechos en la CTE q4_defects y hacer LEFT JOIN desde stores, las 14 tiendas permanecen visibles. Tienda Miraflores encabeza la lista con 9 devoluciones ($1.889,48) y las 4 tiendas sin casos muestran exactamente 0.',
      },
      {
        label: 'Paso 3: Incorporar la etiqueta de estado vacío informativo para la interfaz',
        sql: `WITH q4_defects AS (
  SELECT
    o.store_id,
    COUNT(r.refund_id) AS defect_refunds,
    ROUND(SUM(r.refund_amount_usd), 2) AS defect_amount_usd
  FROM orders o
  JOIN refunds r ON o.order_id = r.order_id
  WHERE r.status = 'processed'
    AND r.reason = 'defecto_molino'
    AND o.order_date >= DATE '2024-10-01'
    AND o.order_date < DATE '2025-01-01'
  GROUP BY o.store_id
)
SELECT
  s.store_id,
  s.store_name,
  s.region,
  COALESCE(q.defect_refunds, 0) AS defect_refunds,
  COALESCE(q.defect_amount_usd, 0.00) AS defect_amount_usd,
  CASE
    WHEN COALESCE(q.defect_refunds, 0) = 0 THEN 'Sin incidencias en el periodo'
    ELSE 'Con devoluciones por defecto'
  END AS empty_state_label
FROM stores s
LEFT JOIN q4_defects q ON s.store_id = q.store_id
ORDER BY defect_amount_usd DESC, s.store_id ASC;`,
        explanation: 'La columna empty_state_label informa explícitamente "Sin incidencias en el periodo" para las 4 tiendas con 0 casos, eliminando toda ambigüedad cuando el gerente filtra una de esas tiendas.',
      },
    ],
    takeaway: 'En vistas de perforación (drill-through), filtra siempre los hechos dentro de una CTE y une desde la tabla de dimensión con LEFT JOIN y COALESCE para garantizar estados vacíos explícitos.',
  },
  checks: [
    {
      id: 'chk-bi3-04-q1',
      type: 'mcq',
      prompt: 'Según la guía de arquitectura de Microsoft Learn para Power BI, ¿cuándo debe utilizarse una página de perforación (drill-through) en lugar de un tooltip de página (report page tooltip)?',
      options: [
        {
          id: 'a',
          text: 'Cuando solo se desea mostrar un número adicional rápido al pasar el cursor menos de dos segundos.',
          correct: false,
          feedback: 'Incorrecto. Para una consulta rápida al pasar el cursor (hover) sin cambiar de vista, el mecanismo adecuado es el tooltip.',
        },
        {
          id: 'b',
          text: 'Cuando el usuario necesita navegar a una vista dedicada de investigación profunda, con tablas detalladas e interacción propia, filtrada por la entidad seleccionada.',
          correct: true,
          feedback: 'Correcto. El drill-through lleva al usuario a una página completa enfocada en la entidad elegida, donde puede ordenar filas, inspeccionar registros y volver atrás.',
        },
        {
          id: 'c',
          text: 'Nunca; los tooltips emergentes deben contener tablas de 500 filas con barras de desplazamiento para evitar crear páginas de drill-through.',
          correct: false,
          feedback: 'Incorrecto. Los tooltips no admiten interacción interna ni desplazamiento y se vuelven ilegibles y lentos si se cargan con tablas extensas.',
        },
        {
          id: 'd',
          text: 'Únicamente cuando el tablero no tiene ninguna dimensión de tiempo ni de geografía.',
          correct: false,
          feedback: 'Incorrecto. Las páginas de drill-through funcionan precisamente propagando el contexto de dimensiones como tienda, región, producto o fecha.',
        },
      ],
      explanation: 'Los tooltips ofrecen contexto suplementario instantáneo al pasar el cursor, mientras el drill-through transfiere al usuario a una página completa de análisis granular para la entidad seleccionada.',
    },
    {
      id: 'chk-bi3-04-q2',
      type: 'predict-output',
      prompt: 'Un analista intenta conservar las 14 tiendas escribiendo `SELECT s.store_id, COUNT(r.refund_id) FROM stores s LEFT JOIN orders o ON s.store_id = o.store_id LEFT JOIN refunds r ON o.order_id = r.order_id WHERE r.reason = \'defecto_molino\' GROUP BY s.store_id`. ¿Qué ocurre con las 4 tiendas que no tuvieron devoluciones por ese motivo?',
      options: [
        {
          id: 'a',
          text: 'Aparecen en el resultado con COUNT = 0 gracias al uso de LEFT JOIN.',
          correct: false,
          feedback: 'Incorrecto. Al colocar la condición r.reason = \'defecto_molino\' en la cláusula WHERE final, se descartan las filas donde r.reason es NULL.',
        },
        {
          id: 'b',
          text: 'Desaparecen del resultado porque filtrar una columna de la tabla derecha en el WHERE convierte el LEFT JOIN en un INNER JOIN efectivo.',
          correct: true,
          feedback: 'Correcto. Para las tiendas sin devoluciones de ese motivo, r.reason vale NULL; el predicado WHERE r.reason = \'defecto_molino\' evalúa a UNKNOWN y elimina esas tiendas.',
        },
        {
          id: 'c',
          text: 'Devuelven un valor negativo (-1) en la columna COUNT(r.refund_id).',
          correct: false,
          feedback: 'Incorrecto. COUNT() nunca devuelve números negativos en SQL.',
        },
      ],
      explanation: 'Filtrar en el WHERE externo una columna de la tabla derecha anula el efecto del LEFT JOIN. El filtro debe aplicarse dentro de una CTE previa o en la condición ON del JOIN.',
    },
    {
      id: 'chk-bi3-04-q3',
      type: 'order',
      prompt: 'Ordena las tres etapas del mantra de búsqueda de información visual de Ben Shneiderman (1996):',
      items: [
        '1. Vista general primero (Overview first): presentar el resumen global del sistema de un vistazo.',
        '2. Zoom y filtro (Zoom and filter): acotar interactivamente el periodo, región o segmento de interés.',
        '3. Detalles bajo demanda (Details-on-demand): inspeccionar registros o motivos vía tooltips y drill-through.',
      ],
      correctOrder: [
        '1. Vista general primero (Overview first): presentar el resumen global del sistema de un vistazo.',
        '2. Zoom y filtro (Zoom and filter): acotar interactivamente el periodo, región o segmento de interés.',
        '3. Detalles bajo demanda (Details-on-demand): inspeccionar registros o motivos vía tooltips y drill-through.',
      ],
      explanation: 'El mantra de Shneiderman estructura la interacción progresiva: orientación global primero, acotación del subconjunto relevante después e inspección de detalle solo cuando se solicita.',
    },
  ],
  practice: {
    type: 'sql',
    prompt: 'Construye la consulta para la página de perforación (drill-through) de calidad en el cuarto trimestre de 2024 (`o.order_date >= DATE \'2024-10-01\' AND o.order_date < DATE \'2025-01-01\'`) evaluando las devoluciones con `r.status = \'processed\'` y `r.reason = \'defecto_molino\'`. Debes devolver las 14 tiendas de `stores` con 6 columnas exactas: `store_id`, `store_name`, `region`, `defect_refunds` (cantidad de devoluciones, `0` si no hubo), `defect_amount_usd` (suma de `refund_amount_usd` redondeada a 2 decimales, `0` si no hubo) y `empty_state_label` (`\'Sin incidencias en el periodo\'` cuando `defect_refunds` sea `0`, y `\'Con devoluciones por defecto\'` en caso contrario). Ordena por `defect_amount_usd` de mayor a menor y, en caso de empate, por `store_id` ascendente.',
    starterCode: `WITH q4_defects AS (
  SELECT
    o.store_id,
    -- TODO: cuenta r.refund_id y suma r.refund_amount_usd redondeado a 2 decimales
    0 AS defect_refunds,
    0 AS defect_amount_usd
  FROM orders o
  JOIN refunds r ON o.order_id = r.order_id
  -- TODO: filtra r.status = 'processed', r.reason = 'defecto_molino' y Q4 2024 en o.order_date
  GROUP BY o.store_id
)
SELECT
  s.store_id,
  s.store_name,
  s.region,
  -- TODO: usa COALESCE para devolver 0 cuando no haya coincidencias
  q.defect_refunds,
  q.defect_amount_usd,
  -- TODO: construye el CASE para empty_state_label
  '' AS empty_state_label
FROM stores s
LEFT JOIN q4_defects q ON s.store_id = q.store_id
ORDER BY defect_amount_usd DESC, s.store_id ASC;`,
    solution: `WITH q4_defects AS (
  SELECT
    o.store_id,
    COUNT(r.refund_id) AS defect_refunds,
    ROUND(SUM(r.refund_amount_usd), 2) AS defect_amount_usd
  FROM orders o
  JOIN refunds r ON o.order_id = r.order_id
  WHERE r.status = 'processed'
    AND r.reason = 'defecto_molino'
    AND o.order_date >= DATE '2024-10-01'
    AND o.order_date < DATE '2025-01-01'
  GROUP BY o.store_id
)
SELECT
  s.store_id,
  s.store_name,
  s.region,
  COALESCE(q.defect_refunds, 0) AS defect_refunds,
  COALESCE(q.defect_amount_usd, 0.00) AS defect_amount_usd,
  CASE
    WHEN COALESCE(q.defect_refunds, 0) = 0 THEN 'Sin incidencias en el periodo'
    ELSE 'Con devoluciones por defecto'
  END AS empty_state_label
FROM stores s
LEFT JOIN q4_defects q ON s.store_id = q.store_id
ORDER BY defect_amount_usd DESC, s.store_id ASC;`,
    expected: `WITH q4_defects AS (
  SELECT
    o.store_id,
    COUNT(r.refund_id) AS defect_refunds,
    ROUND(SUM(r.refund_amount_usd), 2) AS defect_amount_usd
  FROM orders o
  JOIN refunds r ON o.order_id = r.order_id
  WHERE r.status = 'processed'
    AND r.reason = 'defecto_molino'
    AND o.order_date >= DATE '2024-10-01'
    AND o.order_date < DATE '2025-01-01'
  GROUP BY o.store_id
)
SELECT
  s.store_id,
  s.store_name,
  s.region,
  COALESCE(q.defect_refunds, 0) AS defect_refunds,
  COALESCE(q.defect_amount_usd, 0.00) AS defect_amount_usd,
  CASE
    WHEN COALESCE(q.defect_refunds, 0) = 0 THEN 'Sin incidencias en el periodo'
    ELSE 'Con devoluciones por defecto'
  END AS empty_state_label
FROM stores s
LEFT JOIN q4_defects q ON s.store_id = q.store_id
ORDER BY defect_amount_usd DESC, s.store_id ASC;`,
    solutionExplanation: 'Al aislar el filtro del cuarto trimestre y del motivo defecto_molino dentro de la CTE q4_defects y unir desde stores con LEFT JOIN, conservamos las 14 tiendas. Diez tiendas registran devoluciones (lideradas por Tienda Miraflores con $1.889,48) y cuatro tiendas (store_id 5, 11, 13 y 14) muestran 0 y el mensaje "Sin incidencias en el periodo".',
    orderMatters: true,
    hints: [
      'En q4_defects filtra WHERE r.status = \'processed\' AND r.reason = \'defecto_molino\' AND o.order_date >= DATE \'2024-10-01\' AND o.order_date < DATE \'2025-01-01\'.',
      'En el SELECT principal aplica COALESCE(q.defect_refunds, 0) AS defect_refunds y COALESCE(q.defect_amount_usd, 0.00) AS defect_amount_usd.',
      'En el CASE evalúa WHEN COALESCE(q.defect_refunds, 0) = 0 THEN \'Sin incidencias en el periodo\' ELSE \'Con devoluciones por defecto\' END.',
    ],
  },
  roleNotes: {
    de: 'Garantiza la integridad referencial entre dimensiones (stores, products, calendar) y hechos (orders, refunds) para que los LEFT JOIN de las vistas de perforación nunca generen huérfanos ni pierdan entidades.',
    da: 'Diseña cada página de drill-through pensando en qué ocurre cuando el usuario elige una entidad con cero eventos; reemplaza siempre los nulos por ceros y mensajes explicativos.',
    bi: 'Limita los segmentadores visibles en el lienzo a un máximo de 3, incluye un botón de "Borrar filtros" (Reset filters) y configura tooltips ligeros solo para desgloses de lectura rápida.',
  },
  summary: [
    'El mantra de Ben Shneiderman ordena la interacción en tres pasos: vista general primero, zoom y filtro después, y detalles bajo demanda.',
    'El resaltado cruzado conserva la referencia del total, mientras el filtrado cruzado reescala los ejes al subconjunto seleccionado.',
    'Los tooltips emergentes resuelven dudas rápidas al pasar el cursor; las páginas de drill-through permiten auditar una entidad en profundidad.',
    'Un estado vacío informativo usa LEFT JOIN y COALESCE para distinguir explícitamente entre cero eventos y un fallo técnico.',
  ],
  flashcards: [
    {
      id: 'fc-bi3-04-1',
      front: '¿Cuál es el mantra de búsqueda de información visual de Ben Shneiderman y cómo guía el diseño de un tablero?',
      back: '"Overview first, zoom and filter, then details-on-demand": mostrar primero el estado global, ofrecer filtros acotados después y desplegar el grano fino solo bajo demanda.',
    },
    {
      id: 'fc-bi3-04-2',
      front: '¿Qué diferencia práctica existe entre un report page tooltip y una página de drill-through?',
      back: 'El tooltip aparece al pasar el cursor (hover) para un vistazo rápido sin interacción interna; el drill-through navega a una página completa filtrada por la entidad para auditar detalles.',
    },
    {
      id: 'fc-bi3-04-3',
      front: '¿Por qué es peligroso filtrar una columna de la tabla de hechos en el WHERE externo después de un LEFT JOIN desde la dimensión?',
      back: 'Porque en las entidades sin hechos esa columna vale NULL, y el predicado WHERE descarta esas filas convirtiendo el LEFT JOIN en un INNER JOIN silencioso.',
    },
    {
      id: 'fc-bi3-04-4',
      front: '¿Qué elementos componen un estado vacío informativo (informative empty state) en un tablero?',
      back: 'Un valor numérico explícito (0 mediante COALESCE en lugar de blanco), un mensaje que explique que no hubo eventos para ese filtro y una acción clara para restablecer los filtros.',
    },
  ],
  sources: [
    {
      title: 'The Eyes Have It: A Task by Data Type Taxonomy for Information Visualizations',
      url: 'https://www.cs.umd.edu/~ben/papers/Shneiderman1996eyes.pdf',
      publisher: 'Ben Shneiderman (IEEE Symposium on Visual Languages, 1996)',
      accessed: '2026-10-29',
      supports: 'Formulación original del mantra de interacción: overview first, zoom and filter, then details-on-demand.',
    },
    {
      title: 'Set up drillthrough in Power BI reports',
      url: 'https://learn.microsoft.com/en-us/power-bi/create-reports/desktop-drillthrough',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Arquitectura de páginas de destino de perforación con propagación de filtros contextuales y botón de retorno.',
    },
    {
      title: 'Report page tooltips in Power BI',
      url: 'https://learn.microsoft.com/en-us/power-bi/guidance/report-page-tooltips',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Criterios de diseño ligero y rendimiento para descripciones emergentes contextuales.',
    },
    {
      title: 'Change how visuals interact in a Power BI report',
      url: 'https://learn.microsoft.com/en-us/power-bi/create-reports/service-reports-visual-interactions',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Diferencia entre filtrado cruzado (cross-filtering) y resaltado cruzado (cross-highlighting) entre objetos visuales.',
    },
    {
      title: 'Slicers in Power BI',
      url: 'https://learn.microsoft.com/en-us/power-bi/visuals/power-bi-visualization-slicers',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Buenas prácticas de uso de segmentadores y manejo de selecciones sin datos coincidentes.',
    },
  ],
  aiNotes: 'Si el estudiante coloca el filtro r.reason = \'defecto_molino\' en el WHERE externo y obtiene solo 10 filas en lugar de 14, explícale por qué el WHERE elimina los NULL del LEFT JOIN y guíalo para mover el filtro dentro de la CTE q4_defects.',
};

export default lesson;
