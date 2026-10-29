export const lesson = {
  id: 'bi3-dashboards-05-tablero-ejecutivo-vs-operativo',
  moduleId: 'bi3-dashboards',
  track: 'bi',
  tracks: ['bi', 'da'],
  level: 3,
  order: 5,
  contentVersion: 2,
  title: 'Tablero estratégico ejecutivo frente a operativo',
  subtitle: 'Diferencias de arquitectura entre un tablero estratégico ejecutivo y uno operativo',
  minutes: 20,
  prerequisites: ['bi3-dashboards-04-interaccion-filtros-drill-tooltips'],
  glossaryTerms: [
    'bi3-tablero-ejecutivo-vs-operativo',
    'bi3-jerarquia-visual',
    'bi3-doble-codificacion',
  ],
  datasets: ['orders', 'stores', 'refunds', 'calendar'],
  needsReview: false,
  hook: 'Para ahorrar tiempo de desarrollo, el equipo de datos de Mercado Brisa entrega un único tablero tanto al director general como a los catorce encargados de tienda. El comité ejecutivo se pierde entre cientos de pedidos pendientes del día y los jefes de tienda no saben qué pedidos retenidos deben despachar hoy. ¿Por qué fracasa el "tablero único para todos"?',
  objectives: [
    'Distinguir los tres arquetipos de tableros de Stephen Few (estratégico ejecutivo, táctico analítico y operativo) según su audiencia, latencia y horizonte de decisión.',
    'Definir el grano de datos, la frecuencia de refresco y el tipo de indicadores (rezagados vs. adelantados y colas de excepción) de cada arquitectura.',
    'Separar el diseño del tablero semanal del comité de dirección del monitor operativo diario de tiendas en Mercado Brisa.',
    'Construir en DuckDB la consulta del monitor operativo de excepciones por tienda para priorizar pedidos cancelados y pendientes.',
  ],
  sections: [
    {
      id: 'sec-tres-arquetipos-few',
      heading: 'Los tres arquetipos de Stephen Few: estratégico, analítico y operativo',
      body: 'En *Information Dashboard Design*, **Stephen Few** demostró que un único tablero no puede servir a toda la organización. Intentar mezclar audiencias produce un lienzo híbrido que confunde a todos. La arquitectura depende del **ciclo de decisión** del usuario y se divide en tres arquetipos: estratégico, analítico y operativo.\n\nEl **tablero estratégico (ejecutivo)** sirve al comité de dirección. Supervisa la salud financiera y el cumplimiento de metas trimestrales o anuales mediante indicadores de resultado (*lagging indicators*). Un ejemplo es el ingreso neto regional frente a la cuota anual. Requiere baja interactividad, grano mensual y actualización diaria o semanal.\n\nEl **tablero operativo**, en cambio, sirve a los jefes de tienda y supervisores logísticos en primera línea. Su propósito es detectar y resolver **excepciones inmediatas** (*leading indicators* y colas operativas), como pedidos atascados en estado `pending` o cancelaciones. Exige grano de tienda o pedido, umbrales de alerta claros y refresco intradía.',
      diagram: `flowchart TD
  subgraph Arquetipos["Arquitectura comparada: Ejecutivo vs. Operativo"]
    direction LR
    E["Tablero Estratégico Ejecutivo<br/>• Audiencia: Comité de Dirección<br/>• Grano: Región / Trimestre / Año<br/>• Refresco: Diario o semanal (Import)<br/>• Foco: Cumplimiento de meta anual y YoY<br/>• Acción: Reasignar presupuesto o precios"]
    O["Monitor Operativo de Tienda<br/>• Audiencia: Jefes de tienda y logística<br/>• Grano: Tienda / Día / Pedido en cola<br/>• Refresco: Intradía o tiempo real<br/>• Foco: Excepciones (pending, cancelled)<br/>• Acción: Liberar envíos o auditar turno"]
    E --- O
  end`,
    },
    {
      id: 'sec-arquitectura-tecnica-latencia-grano',
      heading: 'Implicaciones técnicas: latencia, modelo de almacenamiento y grano SQL',
      body: 'La distinción entre un tablero ejecutivo y uno operativo transforma también la ingeniería de datos subyacente. Así lo documenta **Microsoft Learn** en las guías de Power BI y Real-Time Intelligence en Microsoft Fabric.\n\nUn tablero ejecutivo funciona de forma óptima sobre un **modelo semántico importado en memoria** (*Import mode* / VertiPaq). Se alimenta de tablas agregadas al cierre del día anterior. Como el comité analiza meses o trimestres completos, una latencia de 12 o 24 horas no afecta ninguna decisión estratégica y asegura respuestas instantáneas.\n\nPor el contrario, un monitor operativo necesita consultar la cola viva de eventos o actualizarse cada pocos minutos. Sus consultas SQL no suman únicamente las ventas históricas completadas. En su lugar, filtran y ordenan por **tasa de excepción**: qué tiendas acumulan hoy el mayor porcentaje de pedidos no completados (`cancelled` o `pending`) y cuánto ingreso está en riesgo.',
      example: {
        language: 'sql',
        code: `SELECT
  status,
  COUNT(*) AS order_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS share_orders_pct,
  ROUND(SUM(total_usd), 2) AS total_usd
FROM orders
WHERE EXTRACT(YEAR FROM order_date) = 2024
GROUP BY status
ORDER BY order_count DESC;`,
        explanation: 'Esta consulta radiografía la distribución de estados en 2024 sobre los 7.923 pedidos del año: mientras el tablero ejecutivo se concentra en los 6.497 pedidos completed ($2.731.516,50), el monitor operativo vigila los 497 pedidos cancelled ($228.940,37) y los 313 pedidos pending ($131.618,73) que requieren acción operativa.',
      },
    },
    {
      id: 'sec-diseno-colas-excepcion',
      heading: 'Diseño visual del monitor operativo: colas priorizadas por excepción',
      body: 'El tablero ejecutivo ordena las regiones por volumen de ingresos o cumplimiento anual mediante gráficos de bala. El monitor operativo, en cambio, se diseña como una **lista priorizada de excepciones**. La pregunta del jefe de operaciones cada mañana es directa: *"¿Qué tres tiendas sufren la mayor fricción operativa y cuánto dinero tienen retenido?"*.\n\nSi ordenamos el monitor por el conteo bruto de pedidos, las tiendas más grandes como `Tienda Palermo Soho` (`1.536` pedidos) aparecerán siempre arriba aunque operen bien. Por ello debemos ordenar por la **tasa de excepción** (`exception_rate_pct`), que mide la proporción de pedidos `cancelled` o `pending` sobre el total de cada tienda.\n\nEn Mercado Brisa 2024, `Tienda Polanco Sur` (`store_id = 2`) registra la tasa de excepción más alta con **`14,80 %`** (`41` excepciones sobre `277` pedidos y `$19.367,51` afectados). Le siguen `Tienda Las Condes` (`11,94 %`) y `Almacén Logístico Coslada` (`11,61 %`).',
    },
  ],
  workedExample: {
    title: 'Construcción del monitor operativo de excepciones por tienda (2024)',
    problem: 'El equipo de operaciones de Mercado Brisa necesita la tabla principal de su monitor operativo de tiendas en 2024. Para cada una de las 14 tiendas debemos reportar el total de pedidos recibidos (`total_orders_2024`), la cantidad de pedidos en excepción (`status IN (\'cancelled\', \'pending\')`), la tasa porcentual de excepción (`exception_rate_pct`) y el monto en dólares involucrado en esas excepciones (`backlog_and_cancelled_usd`), ordenando de mayor a menor tasa de excepción.',
    steps: [
      {
        label: 'Paso 1: Contabilizar el volumen total de pedidos y los pedidos en excepción por tienda',
        sql: `SELECT
  s.store_id,
  s.store_name,
  COUNT(o.order_id) AS total_orders_2024,
  SUM(CASE WHEN o.status IN ('cancelled', 'pending') THEN 1 ELSE 0 END) AS exception_orders
FROM stores s
JOIN orders o ON s.store_id = o.store_id
WHERE EXTRACT(YEAR FROM o.order_date) = 2024
GROUP BY s.store_id, s.store_name
ORDER BY exception_orders DESC;`,
        explanation: 'En volumen bruto de incidencias lideran las tiendas de mayor tráfico: Tienda Palermo Soho (144 excepciones en 1.536 pedidos) y Tienda Miraflores (121 en 1.131 pedidos). Pero necesitamos normalizar por el total de pedidos de cada tienda.',
      },
      {
        label: 'Paso 2: Calcular la tasa de excepción porcentual y el importe en riesgo',
        sql: `SELECT
  s.store_id,
  s.store_name,
  s.region,
  COUNT(o.order_id) AS total_orders_2024,
  SUM(CASE WHEN o.status IN ('cancelled', 'pending') THEN 1 ELSE 0 END) AS exception_orders,
  ROUND(
    SUM(CASE WHEN o.status IN ('cancelled', 'pending') THEN 1 ELSE 0 END) * 100.0
    / COUNT(o.order_id),
    2
  ) AS exception_rate_pct,
  ROUND(
    SUM(CASE WHEN o.status IN ('cancelled', 'pending') THEN o.total_usd ELSE 0 END),
    2
  ) AS backlog_and_cancelled_usd
FROM stores s
JOIN orders o ON s.store_id = o.store_id
WHERE EXTRACT(YEAR FROM o.order_date) = 2024
GROUP BY s.store_id, s.store_name, s.region
ORDER BY exception_rate_pct DESC, s.store_id ASC;`,
        explanation: 'Al ordenar por exception_rate_pct DESC emerge la verdadera prioridad operativa: Tienda Polanco Sur lidera con 14,80 % ($19.367,51), seguida por Tienda Las Condes con 11,94 % ($36.081,92) y Almacén Logístico Coslada con 11,61 % ($46.176,13).',
      },
      {
        label: 'Paso 3: Contrastar el ranking operativo con el ranking ejecutivo de la misma tienda',
        sql: `SELECT
  s.store_id,
  s.store_name,
  ROUND(SUM(CASE WHEN o.status = 'completed' THEN o.total_usd ELSE 0 END), 2) AS executive_completed_rev_usd,
  ROUND(
    SUM(CASE WHEN o.status IN ('cancelled', 'pending') THEN 1 ELSE 0 END) * 100.0
    / COUNT(o.order_id),
    2
  ) AS operational_exception_rate_pct
FROM stores s
JOIN orders o ON s.store_id = o.store_id
WHERE EXTRACT(YEAR FROM o.order_date) = 2024
GROUP BY s.store_id, s.store_name
ORDER BY operational_exception_rate_pct DESC
LIMIT 5;`,
        explanation: 'Este contraste demuestra por qué ambos tableros deben separarse: Tienda Polanco Sur ocupa el puesto 11 en ingresos ejecutivos ($101.426,63), por lo que pasaría inadvertida en el comité de dirección, pero es la prioridad número 1 en el monitor operativo (14,80 % de pedidos en excepción).',
      },
    ],
    takeaway: 'El tablero ejecutivo prioriza dónde se genera o incumple el presupuesto anual; el monitor operativo prioriza dónde se está rompiendo el flujo de pedidos hoy mediante tasas normalizadas de excepción.',
  },
  checks: [
    {
      id: 'chk-bi3-05-q1',
      type: 'mcq',
      prompt: '¿Cuál de las siguientes diferencias arquitectónicas distingue correctamente a un tablero estratégico ejecutivo de un monitor operativo de tienda?',
      options: [
        {
          id: 'a',
          text: 'El tablero ejecutivo muestra pedidos individuales en tiempo real cada cinco segundos, mientras el monitor operativo solo se actualiza una vez al año.',
          correct: false,
          feedback: 'Incorrecto. Es exactamente al revés: el monitor operativo requiere baja latencia y grano fino, mientras el ejecutivo trabaja con agregaciones periódicas.',
        },
        {
          id: 'b',
          text: 'El tablero ejecutivo evalúa tendencias agregadas y cumplimiento de metas a medio/largo plazo (grano mensual/regional), mientras el monitor operativo prioriza colas de excepción accionables en el corto plazo (grano tienda/pedido).',
          correct: true,
          feedback: 'Correcto. Cada arquetipo responde a un ciclo de decisión distinto: asignación estratégica de recursos frente a resolución inmediata de cuellos de botella.',
        },
        {
          id: 'c',
          text: 'El monitor operativo no necesita umbrales de alerta ni doble codificación porque solo lo ven analistas técnicos.',
          correct: false,
          feedback: 'Incorrecto. Los monitores operativos son utilizados bajo presión de tiempo en tiendas y almacenes, por lo que exigen alertas accesibles y umbrales claros.',
        },
        {
          id: 'd',
          text: 'Ambos tableros deben compartir siempre el mismo lienzo y las mismas tarjetas para evitar mantener dos páginas en el reporte.',
          correct: false,
          feedback: 'Incorrecto. Mezclar ambas audiencias en un único lienzo viola la regla de los 10 segundos y satura de ruido a ambos roles.',
        },
      ],
      explanation: 'Según Stephen Few y Microsoft Learn, los tableros ejecutivos y operativos difieren en audiencia, grano de datos, latencia de actualización y naturaleza de la acción esperada.',
    },
    {
      id: 'chk-bi3-05-q2',
      type: 'mcq',
      prompt: 'En el monitor operativo de tiendas de Mercado Brisa 2024, ¿por qué ordenamos la tabla principal por `exception_rate_pct DESC` en lugar de ordenar por la cantidad absoluta de pedidos cancelados?',
      options: [
        {
          id: 'a',
          text: 'Porque DuckDB no permite usar funciones de conteo en la cláusula ORDER BY.',
          correct: false,
          feedback: 'Incorrecto. DuckDB permite ordenar por cualquier columna o expresión agregada.',
        },
        {
          id: 'b',
          text: 'Porque el conteo bruto penaliza siempre a las tiendas de mayor volumen de tráfico (como Tienda Palermo Soho) y oculta focos severos de deterioro operativo en tiendas medianas (como Tienda Polanco Sur con 14,80 %).',
          correct: true,
          feedback: 'Correcto. Normalizar como tasa porcentual sobre el total de pedidos de cada tienda permite detectar dónde falla el proceso independientemente del tamaño del local.',
        },
        {
          id: 'c',
          text: 'Porque las tasas porcentuales eliminan la necesidad de mostrar el monto en dólares afectado.',
          correct: false,
          feedback: 'Incorrecto. Un buen monitor operativo muestra tanto la tasa relativa (exception_rate_pct) como el impacto económico absoluto (backlog_and_cancelled_usd).',
        },
        {
          id: 'd',
          text: 'Porque ordenar por tasa porcentual convierte automáticamente los pedidos cancelados en completados.',
          correct: false,
          feedback: 'Incorrecto. El ordenamiento solo prioriza la visualización de las filas sin alterar los datos.',
        },
      ],
      explanation: 'Ordenar por tasa de excepción normaliza por tamaño de tienda y saca a la superficie anomalías operativas agudas (Tienda Polanco Sur con 14,80 %) que quedarían enterradas en un ranking de volumen bruto.',
    },
    {
      id: 'chk-bi3-05-q3',
      type: 'predict-output',
      prompt: 'Si en la consulta del monitor operativo escribimos `WHERE o.status = \'completed\'` en el filtro general de la tabla `orders` antes de calcular `SUM(CASE WHEN o.status IN (\'cancelled\', \'pending\') THEN 1 ELSE 0 END)`, ¿qué devolverá la columna `exception_orders` para todas las tiendas?',
      options: [
        {
          id: 'a',
          text: 'Devolverá 0 en todas las tiendas porque el WHERE previo ya descartó todas las filas con estado cancelled o pending.',
          correct: true,
          feedback: 'Correcto. Al restringir el universo de entrada a status = \'completed\' en el WHERE, ninguna fila cumple la condición del CASE y el monitor queda ciego ante las excepciones.',
        },
        {
          id: 'b',
          text: 'Devolverá el número correcto de excepciones porque CASE WHEN ignora la cláusula WHERE.',
          correct: false,
          feedback: 'Incorrecto. En el orden lógico de evaluación SQL, WHERE se ejecuta antes de SELECT y elimina las filas antes de que se evalúe el CASE.',
        },
        {
          id: 'c',
          text: 'Devolverá NULL en todas las tiendas y provocará una división por cero.',
          correct: false,
          feedback: 'Incorrecto. Como cada tienda tiene pedidos completados y el ELSE del CASE vale 0, SUM() suma ceros y devuelve 0, no NULL.',
        },
      ],
      explanation: 'Mientras las consultas financieras ejecutivas filtran WHERE status = \'completed\', el monitor de excepciones operativas debe evaluar todos los pedidos del año en el WHERE y usar agregación condicional para medir el peso de cancelled y pending.',
    },
  ],
  practice: {
    type: 'sql',
    prompt: 'Construye la consulta del monitor operativo de excepciones por tienda en 2024 (`EXTRACT(YEAR FROM o.order_date) = 2024`). Debes devolver las 14 tiendas con 7 columnas exactas: `store_id`, `store_name`, `region`, `total_orders_2024` (total de pedidos de la tienda en 2024 sin importar su estado), `exception_orders` (cantidad de pedidos con `o.status IN (\'cancelled\', \'pending\')`), `exception_rate_pct` (`exception_orders * 100.0 / total_orders_2024` redondeado a 2 decimales) y `backlog_and_cancelled_usd` (suma de `o.total_usd` de los pedidos con `o.status IN (\'cancelled\', \'pending\')` redondeada a 2 decimales). Ordena por `exception_rate_pct` de mayor a menor y, en caso de empate, por `store_id` ascendente.',
    starterCode: `SELECT
  s.store_id,
  s.store_name,
  s.region,
  -- TODO: cuenta el total de pedidos de 2024 como total_orders_2024
  0 AS total_orders_2024,
  -- TODO: suma 1 cuando o.status IN ('cancelled', 'pending') como exception_orders
  0 AS exception_orders,
  -- TODO: calcula el porcentaje exception_rate_pct redondeado a 2 decimales
  0 AS exception_rate_pct,
  -- TODO: suma o.total_usd para pedidos en ('cancelled', 'pending') redondeado a 2 decimales
  0 AS backlog_and_cancelled_usd
FROM stores s
JOIN orders o ON s.store_id = o.store_id
-- TODO: filtra el año 2024 en o.order_date (sin excluir estados)
GROUP BY s.store_id, s.store_name, s.region
ORDER BY exception_rate_pct DESC, s.store_id ASC;`,
    solution: `SELECT
  s.store_id,
  s.store_name,
  s.region,
  COUNT(o.order_id) AS total_orders_2024,
  SUM(CASE WHEN o.status IN ('cancelled', 'pending') THEN 1 ELSE 0 END) AS exception_orders,
  ROUND(
    SUM(CASE WHEN o.status IN ('cancelled', 'pending') THEN 1 ELSE 0 END) * 100.0
    / COUNT(o.order_id),
    2
  ) AS exception_rate_pct,
  ROUND(
    SUM(CASE WHEN o.status IN ('cancelled', 'pending') THEN o.total_usd ELSE 0 END),
    2
  ) AS backlog_and_cancelled_usd
FROM stores s
JOIN orders o ON s.store_id = o.store_id
WHERE EXTRACT(YEAR FROM o.order_date) = 2024
GROUP BY s.store_id, s.store_name, s.region
ORDER BY exception_rate_pct DESC, s.store_id ASC;`,
    expected: `SELECT
  s.store_id,
  s.store_name,
  s.region,
  COUNT(o.order_id) AS total_orders_2024,
  SUM(CASE WHEN o.status IN ('cancelled', 'pending') THEN 1 ELSE 0 END) AS exception_orders,
  ROUND(
    SUM(CASE WHEN o.status IN ('cancelled', 'pending') THEN 1 ELSE 0 END) * 100.0
    / COUNT(o.order_id),
    2
  ) AS exception_rate_pct,
  ROUND(
    SUM(CASE WHEN o.status IN ('cancelled', 'pending') THEN o.total_usd ELSE 0 END),
    2
  ) AS backlog_and_cancelled_usd
FROM stores s
JOIN orders o ON s.store_id = o.store_id
WHERE EXTRACT(YEAR FROM o.order_date) = 2024
GROUP BY s.store_id, s.store_name, s.region
ORDER BY exception_rate_pct DESC, s.store_id ASC;`,
    solutionExplanation: 'La consulta evalúa todos los pedidos de 2024 por tienda y emplea agregación condicional (CASE WHEN o.status IN (\'cancelled\', \'pending\')) tanto para contar las incidencias como para sumar el importe afectado. Tienda Polanco Sur encabeza el monitor con una tasa de excepción de 14,80 % (41 de 277 pedidos y $19.367,51), seguida por Tienda Las Condes (11,94 %) y Almacén Logístico Coslada (11,61 %).',
    orderMatters: true,
    hints: [
      'En el WHERE filtra únicamente EXTRACT(YEAR FROM o.order_date) = 2024 para conservar todos los estados de pedido en el denominador COUNT(o.order_id).',
      'Calcula exception_orders con SUM(CASE WHEN o.status IN (\'cancelled\', \'pending\') THEN 1 ELSE 0 END).',
      'Calcula exception_rate_pct multiplicando el conteo de excepciones por 100.0, dividiendo entre COUNT(o.order_id) y aplicando ROUND(..., 2).',
    ],
  },
  roleNotes: {
    de: 'Separa los pipelines de agregación histórica para comités ejecutivos (tablas resumen diarias/mensuales) de las vistas operativas de baja latencia sobre colas de pedidos pendientes y cancelados.',
    da: 'En monitores operativos combina siempre la tasa relativa de incidencia (%) con el impacto monetario absoluto ($ en riesgo) para que el equipo priorice tanto gravedad como volumen.',
    bi: 'Entrega dos vistas o aplicaciones diferenciadas por rol: un tablero estratégico de grano regional/mensual para dirección y un monitor de excepciones por tienda para operaciones.',
  },
  summary: [
    'Stephen Few clasifica los tableros en estratégicos, analíticos y operativos según el ciclo de decisión de su audiencia.',
    'Un tablero ejecutivo emplea grano agregado (región y mes) y métricas frente a meta anual con refresco diario o semanal.',
    'Un monitor operativo exige grano fino (tienda o pedido), baja latencia y foco en colas de excepción accionables hoy.',
    'Combinar la tasa porcentual de excepción con el monto en dólares retenido permite priorizar incidencias sin sesgo de tamaño.',
  ],
  flashcards: [
    {
      id: 'fc-bi3-05-1',
      front: '¿Cuáles son los tres tipos de tableros según Stephen Few y qué objetivo persigue cada uno?',
      back: 'Estratégico (monitorear objetivos ejecutivos a largo plazo), Analítico (investigar causas y tendencias con mayor interactividad) y Operativo (supervisar procesos en curso y resolver excepciones inmediatas).',
    },
    {
      id: 'fc-bi3-05-2',
      front: '¿En qué se diferencian el grano y la latencia de refresco de un tablero ejecutivo frente a uno operativo?',
      back: 'El tablero ejecutivo usa grano agregado (mes/región) con refresco diario o semanal; el operativo usa grano de entidad o transacción (tienda/pedido) con refresco intradía o en tiempo real.',
    },
    {
      id: 'fc-bi3-05-3',
      front: '¿Por qué un monitor operativo debe mostrar tanto la tasa porcentual de excepción como el importe en dólares afectado?',
      back: 'Porque la tasa porcentual detecta fallos agudos en tiendas medianas sin sesgo de volumen, mientras el importe en dólares cuantifica el impacto financiero a recuperar.',
    },
    {
      id: 'fc-bi3-05-4',
      front: 'En Mercado Brisa 2024, ¿qué tienda presenta la mayor tasa de excepción operativa (cancelled + pending) y cuál es su valor?',
      back: 'Tienda Polanco Sur (store_id = 2, Norteamérica) con 14,80 % de sus pedidos en excepción (41 de 277 pedidos, por un valor de $19.367,51).',
    },
  ],
  sources: [
    {
      title: 'Dashboards for business users of the Power BI service',
      url: 'https://learn.microsoft.com/en-us/power-bi/explore-reports/end-user-dashboards',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Arquitectura de monitoreo consolidado frente a reportes multipágina y separación de vistas según el rol de negocio.',
    },
    {
      title: 'Real-Time Dashboards in Microsoft Fabric',
      url: 'https://learn.microsoft.com/en-us/fabric/real-time-intelligence/real-time-dashboards-overview',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Diseño de monitores operativos orientados a eventos recientes, baja latencia y alertas sobre umbrales.',
    },
    {
      title: 'Real-time streaming in Power BI',
      url: 'https://learn.microsoft.com/en-us/power-bi/connect-data/service-real-time-streaming',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Diferencias de latencia y almacenamiento entre conjuntos de datos históricos importados y flujos operativos en vivo.',
    },
    {
      title: 'Selecting the Right Graph for Your Message',
      url: 'https://www.perceptualedge.com/articles/ie/the_right_graph.pdf',
      publisher: 'Stephen Few (Perceptual Edge)',
      accessed: '2026-10-29',
      supports: 'Selección de representaciones visuales acordes al grano y al mensaje ejecutivo u operativo.',
    },
  ],
  aiNotes: 'Asegúrate de que el estudiante NO filtre WHERE o.status = \'completed\' en esta práctica operativa: el denominador total_orders_2024 requiere contar todos los pedidos del año 2024 y el numerador usa CASE WHEN o.status IN (\'cancelled\', \'pending\').',
};

export default lesson;
