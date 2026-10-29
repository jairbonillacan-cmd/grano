const lesson = {
  id: 'de4-plataforma-06-entrevista-system-design-de',
  moduleId: 'de4-plataforma',
  tracks: ['de'],
  level: 4,
  order: 6,
  title: 'Entrevista de diseño de sistemas (System Design) en DE',
  subtitle: 'Resolución paso a paso de una entrevista de diseño de sistemas (System Design) en DE',
  minutes: 25,
  prerequisites: [
    'de4-streaming-03-flink-watermarks-mv',
    'de4-plataforma-02-arquitectura-integral-plataforma',
    'de4-plataforma-05-finops-atribucion-retencion',
  ],
  contentVersion: 2,

  hook: 'El entrevistador te entrega un marcador y plantea un reto abierto: "Mercado Brisa planea multiplicar por diez su volumen en doce meses. Necesitamos detección de anomalías de cobro en menos de treinta segundos, tableros regionales conciliados cada hora y privacidad estricta en seis países. Diseña la plataforma". Tienes cuarenta y cinco minutos. Si empiezas dibujando herramientas sin acotar requisitos ni estimar el caudal pico, perderás la entrevista. ¿Con qué método estructurado resuelves y defiendes el diseño paso a paso?',

  objectives: [
    'Aplicar la estructura de 4 etapas en una entrevista de System Design de datos: clarificación de SLOs, estimación cuantitativa de capacidad, arquitectura de los cuatro planos y defensa de compromisos.',
    'Realizar estimaciones rápidas de caudal medio, factor de hora pico y proyección 10x sobre eventos y líneas transaccionales para justificar el tamaño de cada componente.',
    'Defender decisiones de diseño frente a fallos reales: archivos pequeños en Iceberg, sesgo de particiones, reprocesamientos históricos (backfills) y degradación controlada.',
  ],

  sections: [
    {
      id: 'etapas-1-y-2-requisitos-y-capacidad',
      heading: 'Etapas 1 y 2: acotar SLOs y estimar capacidad (media vs. pico 10x)',
      body: 'En una entrevista de **System Design** para Ingeniería de Datos, el error más común es proponer tecnologías antes de hacer preguntas. Dedica los primeros ocho minutos a la Etapa 1: clarificar requisitos funcionales y no funcionales. Define junto al entrevistador los **objetivos de nivel de servicio (SLO)**: ¿qué consumidores requieren latencia sub-minuto y cuáles toleran lotes horarios?, ¿cuál es la garantía de entrega exigida?, ¿qué columnas contienen PII sujeta a enmascaramiento?\n\nEn los siguientes siete minutos ejecuta la Etapa 2: **estimación cuantitativa de capacidad** (*back-of-the-envelope*). Nunca dimensiones un sistema solo por su promedio diario; calcula siempre el **factor de pico**. En la tabla `events` de Mercado Brisa (1 061 días activos), la media es de 61 eventos diarios pero el día pico alcanza 103 eventos (una razón pico/media de `1.68x`). Al proyectar un crecimiento 10x, cada categoría de evento multiplica por diez su caudal de entrada y su huella anual en Parquet.',
      example: {
        language: 'sql',
        code: `WITH daily_events AS (
  SELECT CAST(CAST(event_ts AS TIMESTAMP) AS DATE) AS event_date,
         COUNT(*) AS events_per_day
  FROM events
  GROUP BY 1
)
SELECT COUNT(*) AS total_days,
       CAST(ROUND(AVG(events_per_day), 0) AS INTEGER) AS avg_daily_events,
       MAX(events_per_day) AS max_daily_events,
       ROUND(1.0 * MAX(events_per_day) / AVG(events_per_day), 2) AS peak_to_avg_ratio
FROM daily_events;`,
        expectedOutput: [
          { total_days: 1061, avg_daily_events: 61, max_daily_events: 103, peak_to_avg_ratio: 1.68 },
        ],
      },
    },
    {
      id: 'etapa-3-arquitectura-cuatro-planos',
      heading: 'Etapa 3: trazar los cuatro planos con caminos frío y caliente',
      body: 'Durante los siguientes quince minutos dibuja la Etapa 3: **arquitectura de alto nivel** siguiendo de izquierda a derecha los cuatro planos del módulo. En el plano de ingesta, las tablas transaccionales (`orders`, `order_items`, `payments`, `refunds`, `customers`) se capturan mediante CDC hacia tópicos de **Apache Kafka** particionados por `order_id` o `customer_id`. Por su parte, el flujo de `events` entra por un colector HTTP hacia su propio tópico.\n\nA partir de Kafka, evita duplicar la lógica separando solo por requisito de latencia. Un **camino rápido** (*hot path*) en Apache Flink evalúa ventanas de detección de anomalías de pago en segundos. Al mismo tiempo, el flujo completo aterriza en el plano de almacenamiento sobre **Apache Iceberg** (capas Bronze, Silver y Gold) con confirmaciones cada 1 a 5 minutos para no generar archivos pequeños. Finalmente, en el plano de cómputo por lotes, Apache Spark 4.0 o DuckDB ejecutan las conciliaciones horarias y aplican las políticas de DDM, RLS y compuertas CI/CD.',
      example: {
        language: 'sql',
        code: `SELECT event_type,
       COUNT(*) AS current_events,
       COUNT(*) * 10 AS projected_10x_events,
       ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) AS share_pct
FROM events
GROUP BY event_type
ORDER BY current_events DESC, event_type ASC;`,
        expectedOutput: [
          { event_type: 'add_to_cart', current_events: 15400, projected_10x_events: 154000, share_pct: 23.69 },
          { event_type: 'checkout_completed', current_events: 15400, projected_10x_events: 154000, share_pct: 23.69 },
          { event_type: 'checkout_started', current_events: 15400, projected_10x_events: 154000, share_pct: 23.69 },
          { event_type: 'page_view', current_events: 9400, projected_10x_events: 94000, share_pct: 14.46 },
          { event_type: 'product_view', current_events: 9400, projected_10x_events: 94000, share_pct: 14.46 },
        ],
      },
    },
    {
      id: 'etapa-4-cuellos-botella-tradeoffs',
      heading: 'Etapa 4: defender cuellos de botella, modos de fallo y costos',
      body: 'Los últimos quince minutos definen la evaluación senior: la Etapa 4 de **inmersión profunda** y defensa de compromisos (*trade-offs*). El entrevistador pondrá a prueba tu diseño preguntando qué falla cuando el tráfico crece 10x o cuando cae un servicio. En Mercado Brisa, dos regiones (`Cono Sur` y `Andina`) concentran cada una 13 714 líneas de pedido (más del 65 % del volumen conjunto). Además, el 10.33 % de los eventos carece de `customer_id`.\n\nDebes anticipar cuatro respuestas concretas. Primero, mitigar el **sesgo de partición** en Spark 4.0 mediante AQE y *salting* sobre las llaves nulas o regiones calientes. Segundo, garantizar idempotencia en reprocesamientos (*backfills*) deduplicando `payments` por `idempotency_key` y `order_id` en la capa Silver. Tercero, aislar el cómputo de los reprocesamientos históricos en un clúster separado para no agotar los recursos de los tableros en vivo. Cuarto, justificar el **presupuesto FinOps** migrando las particiones de `2023` y `2024` a almacenamiento tibio y frío.',
      example: {
        language: 'sql',
        code: `SELECT s.region,
       COUNT(DISTINCT o.order_id) AS total_orders,
       COUNT(oi.order_item_id) AS total_items,
       ROUND(SUM(oi.line_total_usd), 2) AS total_gmv_usd
FROM stores s
JOIN orders o ON s.store_id = o.store_id
JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY s.region
ORDER BY total_items DESC;`,
        expectedOutput: [
          { region: 'Cono Sur', total_orders: 6001, total_items: 13714, total_gmv_usd: 2195524.92 },
          { region: 'Andina', total_orders: 6000, total_items: 13714, total_gmv_usd: 2119891.45 },
          { region: 'Iberia', total_orders: 3428, total_items: 8570, total_gmv_usd: 1438103.86 },
          { region: 'Norteamérica', total_orders: 2571, total_items: 6002, total_gmv_usd: 928944.08 },
        ],
      },
    },
  ],

  workedExample: {
    title: 'Cálculos de capacidad y asimetría regional para el RFC 10x de Mercado Brisa',
    description: 'Durante la entrevista de System Design para escalar Mercado Brisa 10x, debes respaldar tu diseño con tres cálculos sobre los datos actuales: el factor de pico diario en events, la concentración regional de carga transaccional y la proyección 10x por tipo de evento.',
    audit: 'Una respuesta sobresaliente de System Design ancla cada componente en números verificables: dimensiona la ingesta para el pico 10x (1.68x sobre la media), separa el camino rápido (Flink) del camino analítico (Iceberg + Spark/DuckDB) y explicita cómo resolver el sesgo, la deduplicación, la privacidad PII y el costo.',
    steps: [
      {
        label: 'Paso 1: Estimar el caudal diario medio y el factor de día pico en events',
        explanation: 'Calculamos los eventos por fecha para obtener los días activos, el promedio diario, el máximo diario registrado y la razón entre el pico y la media.',
        code: `WITH daily_events AS (
  SELECT CAST(CAST(event_ts AS TIMESTAMP) AS DATE) AS event_date,
         COUNT(*) AS events_per_day
  FROM events
  GROUP BY 1
)
SELECT COUNT(*) AS total_days,
       CAST(ROUND(AVG(events_per_day), 0) AS INTEGER) AS avg_daily_events,
       MAX(events_per_day) AS max_daily_events,
       ROUND(1.0 * MAX(events_per_day) / AVG(events_per_day), 2) AS peak_to_avg_ratio
FROM daily_events;`,
        expectedOutput: [
          { total_days: 1061, avg_daily_events: 61, max_daily_events: 103, peak_to_avg_ratio: 1.68 },
        ],
      },
      {
        label: 'Paso 2: Identificar la asimetría regional en órdenes y líneas de pedido',
        explanation: 'Cruzamos stores, orders y order_items para medir cómo se reparte el volumen transaccional y el valor bruto de mercancía (GMV) entre las cuatro regiones.',
        code: `SELECT s.region,
       COUNT(DISTINCT o.order_id) AS total_orders,
       COUNT(oi.order_item_id) AS total_items,
       ROUND(SUM(oi.line_total_usd), 2) AS total_gmv_usd
FROM stores s
JOIN orders o ON s.store_id = o.store_id
JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY s.region
ORDER BY total_items DESC;`,
        expectedOutput: [
          { region: 'Cono Sur', total_orders: 6001, total_items: 13714, total_gmv_usd: 2195524.92 },
          { region: 'Andina', total_orders: 6000, total_items: 13714, total_gmv_usd: 2119891.45 },
          { region: 'Iberia', total_orders: 3428, total_items: 8570, total_gmv_usd: 1438103.86 },
          { region: 'Norteamérica', total_orders: 2571, total_items: 6002, total_gmv_usd: 928944.08 },
        ],
      },
      {
        label: 'Paso 3: Proyectar el volumen 10x por tipo de evento para dimensionar Kafka e Iceberg',
        explanation: 'Calculamos el volumen actual, la proyección multiplicada por 10 y el peso porcentual de cada tipo de evento en el flujo de clickstream.',
        code: `SELECT event_type,
       COUNT(*) AS current_events,
       COUNT(*) * 10 AS projected_10x_events,
       ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) AS share_pct
FROM events
GROUP BY event_type
ORDER BY current_events DESC, event_type ASC;`,
        expectedOutput: [
          { event_type: 'add_to_cart', current_events: 15400, projected_10x_events: 154000, share_pct: 23.69 },
          { event_type: 'checkout_completed', current_events: 15400, projected_10x_events: 154000, share_pct: 23.69 },
          { event_type: 'checkout_started', current_events: 15400, projected_10x_events: 154000, share_pct: 23.69 },
          { event_type: 'page_view', current_events: 9400, projected_10x_events: 94000, share_pct: 14.46 },
          { event_type: 'product_view', current_events: 9400, projected_10x_events: 94000, share_pct: 14.46 },
        ],
      },
    ],
  },

  checks: [
    {
      id: 'de4-p06-check-1',
      type: 'order',
      prompt: 'Ordena las cuatro etapas canónicas para estructurar el tiempo durante una entrevista de System Design en Ingeniería de Datos:',
      items: [
        'Etapa 1: Clarificar requisitos funcionales y no funcionales (SLOs de latencia/frescura, garantías de entrega y restricciones PII).',
        'Etapa 2: Estimar la capacidad cuantitativa (caudal medio, factor de hora pico, fan-out de líneas por orden y almacenamiento anual 10x).',
        'Etapa 3: Trazar el diseño de alto nivel a través de los cuatro planos (ingesta, almacenamiento abierto, cómputo y consumo).',
        'Etapa 4: Profundizar en cuellos de botella, modos de fallo (sesgo, archivos pequeños, backfills) y compromisos FinOps.',
      ],
      correctOrder: ['it-0', 'it-1', 'it-2', 'it-3'],
      explanation: 'Seguir el orden Requisitos -> Capacidad -> Arquitectura -> Deep Dive evita diseñar a ciegas y garantiza que la arquitectura propuesta responda a las cifras de escala y a los acuerdos de nivel de servicio.',
    },
    {
      id: 'de4-p06-check-2',
      type: 'mcq',
      prompt: 'Durante la Etapa 4 de la entrevista, el entrevistador pregunta: "¿Qué ocurre si necesitamos reprocesar (backfill) seis meses de historial en la capa Silver sin degradar el SLO de los tableros ejecutivos en vivo?". ¿Cuál es la respuesta arquitectónica adecuada?',
      options: [
        {
          id: 'a',
          text: 'Ejecutar el backfill en un grupo de cómputo aislado leyendo y escribiendo sobre una rama o tabla candidata en Apache Iceberg (Write-Audit-Publish) antes de actualizar el puntero del catálogo.',
          correct: true,
          feedback: 'Correcto. El desacoplamiento entre almacenamiento Iceberg y cómputo efímero permite reprocesar en un clúster separado sin competir por CPU/RAM con el plano de consumo.',
        },
        {
          id: 'b',
          text: 'Detener la captura CDC de producción durante el fin de semana mientras corre el reprocesamiento sobre el mismo clúster de BI.',
          correct: false,
          feedback: 'Incorrecto. Detener la ingesta arriesga perder eventos si expira la retención del registro transaccional, y compartir el clúster degrada los tableros.',
        },
        {
          id: 'c',
          text: 'Borrar primero la tabla Gold de producción y reconstruirla fila por fila mediante INSERT individuales.',
          correct: false,
          feedback: 'Incorrecto. Borrar producción deja a los usuarios sin datos durante horas y los INSERT fila por fila colapsan el catálogo con archivos pequeños.',
        },
        {
          id: 'd',
          text: 'Desactivar las políticas RLS y DDM temporalmente para que el reprocesamiento termine más rápido.',
          correct: false,
          feedback: 'Incorrecto. Las políticas de seguridad nunca deben desactivarse en producción; el aislamiento se logra separando el plano de cómputo.',
        },
      ],
      explanation: 'Al estar desacoplados el plano de almacenamiento (Iceberg) y el de cómputo, un backfill pesado se lanza en un clúster lote independiente y publica sus resultados de forma atómica tras superar las compuertas de auditoría.',
    },
    {
      id: 'de4-p06-check-3',
      type: 'predict-output',
      prompt: 'En Mercado Brisa el año 2024 registró 7 923 órdenes distintas y 18 371 líneas en order_items (2.32 líneas por orden). En el escenario de diseño 10x manteniendo la misma composición de carrito, ¿cuántas líneas de pedido anuales deberá escribir y compactar la capa Silver para un año equivalente?',
      options: [
        {
          id: 'a',
          text: '79 230 líneas, porque el factor de abanico entre órdenes y líneas desaparece al escalar 10x.',
          correct: false,
          feedback: 'Incorrecto. 79 230 es el número de encabezados de orden (7 923 × 10), pero cada orden sigue generando en promedio 2.32 líneas en order_items.',
        },
        {
          id: 'b',
          text: '183 710 líneas, resultado de multiplicar por 10 las 18 371 líneas actuales manteniendo la razón de 2.32 líneas por orden.',
          correct: true,
          feedback: 'Correcto. Al dimensionar escrituras e índices en order_items debes multiplicar el volumen de órdenes por el factor de expansión (fan-out) de líneas por orden.',
        },
        {
          id: 'c',
          text: '1 837 100 líneas, porque tanto las órdenes como el número de productos por carrito se multiplican por 10 simultáneamente.',
          correct: false,
          feedback: 'Incorrecto. Escalar el tráfico de órdenes 10x con la misma composición de carrito multiplica el total de líneas por 10, no por 100.',
        },
      ],
      explanation: 'Con 18 371 líneas actuales en 2024, un crecimiento de volumen de negocio de 10x con tamaño de carrito constante de 2.32 ítems por pedido produce 183 710 líneas anuales.',
    },
  ],

  practice: {
    type: 'sql',
    title: 'Dimensionamiento anual 10x de órdenes y líneas transaccionales',
    language: 'sql',
    prompt: 'Construye la tabla de dimensionamiento de capacidad transaccional para el RFC de escala 10x de Mercado Brisa. Cruza orders o con order_items oi (ON o.order_id = oi.order_id) y agrupa por el año extraído de order_date (EXTRACT(YEAR FROM CAST(o.order_date AS DATE)) AS anio). Calcula para cada anio: ordenes_actuales (COUNT(DISTINCT o.order_id)), lineas_actuales (COUNT(oi.order_item_id)), lineas_por_orden redondeado a 2 decimales (ROUND(1.0 * COUNT(oi.order_item_id) / COUNT(DISTINCT o.order_id), 2)) y el volumen proyectado lineas_escala_10x (COUNT(oi.order_item_id) * 10). Ordena por anio ascendente.',
    starterCode: `SELECT EXTRACT(YEAR FROM CAST(o.order_date AS DATE)) AS anio,
       COUNT(DISTINCT o.order_id) AS ordenes_actuales,
       COUNT(oi.order_item_id) AS lineas_actuales,
       -- Calcula el promedio de líneas por orden redondeado a 2 decimales
       0.0 AS lineas_por_orden,
       -- Calcula la proyección de líneas a escala 10x
       0 AS lineas_escala_10x
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY 1
ORDER BY anio ASC;`,
    expected: `SELECT EXTRACT(YEAR FROM CAST(o.order_date AS DATE)) AS anio,
       COUNT(DISTINCT o.order_id) AS ordenes_actuales,
       COUNT(oi.order_item_id) AS lineas_actuales,
       ROUND(1.0 * COUNT(oi.order_item_id) / COUNT(DISTINCT o.order_id), 2) AS lineas_por_orden,
       COUNT(oi.order_item_id) * 10 AS lineas_escala_10x
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY 1
ORDER BY anio ASC;`,
    orderMatters: true,
    hints: [
      'Para lineas_por_orden usa ROUND(1.0 * COUNT(oi.order_item_id) / COUNT(DISTINCT o.order_id), 2).',
      'Para lineas_escala_10x multiplica el conteo de líneas por diez: COUNT(oi.order_item_id) * 10.',
      'Conserva GROUP BY 1 y ORDER BY anio ASC.',
    ],
    solution: `SELECT EXTRACT(YEAR FROM CAST(o.order_date AS DATE)) AS anio,
       COUNT(DISTINCT o.order_id) AS ordenes_actuales,
       COUNT(oi.order_item_id) AS lineas_actuales,
       ROUND(1.0 * COUNT(oi.order_item_id) / COUNT(DISTINCT o.order_id), 2) AS lineas_por_orden,
       COUNT(oi.order_item_id) * 10 AS lineas_escala_10x
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY 1
ORDER BY anio ASC;`,
    solutionExplanation: 'La consulta establece la línea base empírica para el documento de arquitectura: confirma que la relación de expansión se mantiene estable entre 2.32 y 2.35 líneas por orden y que el diseño 10x debe dimensionarse para procesar más de 183 000 líneas anuales en los años de ritmo completo.',
    expectedOutputTable: [
      { anio: 2023, ordenes_actuales: 2443, lineas_actuales: 5741, lineas_por_orden: 2.35, lineas_escala_10x: 57410 },
      { anio: 2024, ordenes_actuales: 7923, lineas_actuales: 18371, lineas_por_orden: 2.32, lineas_escala_10x: 183710 },
      { anio: 2025, ordenes_actuales: 7634, lineas_actuales: 17888, lineas_por_orden: 2.34, lineas_escala_10x: 178880 },
    ],
  },

  roleNotes: {
    de: 'En tus entrevistas y documentos RFC, empieza siempre por los SLOs y los números de capacidad antes de nombrar herramientas. Muestra dominio técnico explicando qué ocurre en los bordes: archivos pequeños en Iceberg, sesgo por llaves nulas, deduplicación por llave de idempotencia y aislamiento de backfills.',
    da: 'Cuando participes en revisiones de diseño de sistemas, aporta el perfilado estadístico real de las tablas (tasas de nulos, multiplicadores de día pico, cardinalidad de cuasi-identificadores y razones de fan-out) para evitar que la arquitectura se diseñe sobre supuestos irreales.',
    bi: 'En el diseño de una plataforma, tu rol es definir con precisión los acuerdos de nivel de servicio (frescura requerida, latencia p95 de consultas y reglas de filtrado regional RLS) que determinan cómo debe estructurarse la capa Gold y el plano de consumo.',
  },

  summary: [
    'Una entrevista de System Design en DE se resuelve en cuatro etapas: clarificar SLOs, estimar capacidad 10x, diseñar los cuatro planos y defender compromisos.',
    'El dimensionamiento de capacidad debe calcular tanto el promedio como el factor de pico y la razón de expansión entre entidades (como líneas por orden).',
    'El diseño arquitectónico combina un camino rápido en flujo para alertas sub-minuto con un camino analítico sobre Apache Iceberg para conciliación y BI.',
    'La defensa senior aborda modos de fallo concretos: compactación de archivos pequeños, mitigación de data skew, aislamiento de backfills, privacidad PII y costos FinOps.',
  ],

  flashcards: [
    {
      id: 'de4-plataforma-06-entrevista-system-design-de-fc-1',
      front: '¿Cuáles son las cuatro etapas ordenadas para resolver una entrevista de System Design en Ingeniería de Datos?',
      back: '1) Clarificar requisitos y SLOs (latencia, frescura, entrega, PII); 2) Estimar capacidad (media, pico y escala 10x); 3) Trazar los cuatro planos arquitectónicos; 4) Profundizar en cuellos de botella, fallos y compromisos FinOps.',
    },
    {
      id: 'de4-plataforma-06-entrevista-system-design-de-fc-2',
      front: '¿Por qué es un error dimensionar el plano de ingesta y cómputo usando únicamente el promedio diario de eventos?',
      back: 'Porque el tráfico real presenta picos horarios y estacionales; dimensionar para la media provoca saturación de colas, contrapresión e incumplimiento de SLOs durante las horas de mayor actividad.',
    },
    {
      id: 'de4-plataforma-06-entrevista-system-design-de-fc-3',
      front: '¿Cómo se evita el problema de archivos pequeños (small files) cuando un flujo de streaming aterriza datos en Apache Iceberg?',
      back: 'Agrupando las confirmaciones (commits) en micro-lotes de 1 a 5 minutos y ejecutando trabajos asíncronos periódicos de compactación (bin-packing) y expiración de instantáneas.',
    },
    {
      id: 'de4-plataforma-06-entrevista-system-design-de-fc-4',
      front: '¿Cómo se ejecuta un reprocesamiento histórico (backfill) masivo sin afectar la latencia de los tableros ejecutivos conectados a la capa Gold?',
      back: 'Aprovisionando un clúster de cómputo aislado que escribe sobre una rama o tabla candidata en Iceberg (patrón Write-Audit-Publish) y conmutando el puntero del catálogo solo tras validar las compuertas de calidad.',
    },
  ],

  glossaryTerms: [
    'presupuesto-latencia-capacidad',
    'planos-arquitectura-datos',
    'finops-especificacion-focus',
  ],

  sources: [
    {
      title: 'Google SRE Book — Service Level Objectives',
      url: 'https://sre.google/sre-book/service-level-objectives/',
      publisher: 'Google SRE',
      accessed: '2026-10-29',
      supports: 'Definición de indicadores (SLI), objetivos de nivel de servicio (SLO) y presupuestos de latencia en el diseño de sistemas.',
    },
    {
      title: 'Apache Flink Documentation — Stateful Stream Processing Concepts',
      url: 'https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/overview/',
      publisher: 'Apache Software Foundation',
      accessed: '2026-10-29',
      supports: 'Diseño del camino rápido (hot path) mediante procesamiento de flujo con estado y ventanas temporales.',
    },
    {
      title: 'Apache Iceberg Documentation — Table Maintenance and Compaction',
      url: 'https://iceberg.apache.org/docs/latest/maintenance/',
      publisher: 'Apache Software Foundation',
      accessed: '2026-10-29',
      supports: 'Compactación de archivos pequeños y expiración de instantáneas en escrituras continuas sobre el Lakehouse.',
    },
    {
      title: 'AWS Builders\' Library — Avoiding Fallback in Distributed Systems',
      url: 'https://aws.amazon.com/builders-library/avoiding-fallback-in-distributed-systems/',
      publisher: 'Amazon Web Services',
      accessed: '2026-10-29',
      supports: 'Análisis de modos de fallo, aislamiento entre cargas interactivas y lotes de backfill, y defensa de compromisos arquitectónicos.',
    },
  ],

  aiNotes: 'Guía al estudiante siguiendo el método de las 4 etapas de System Design (SLOs -> Capacidad 10x -> Arquitectura de 4 planos -> Deep dive de fallos y FinOps). En la práctica SQL, ayúdalo a calcular lineas_por_orden dividiendo COUNT(oi.order_item_id) entre COUNT(DISTINCT o.order_id) y proyectar lineas_escala_10x.',
};

export default lesson;
