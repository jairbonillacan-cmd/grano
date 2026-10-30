export const STAGE_1_LESSONS = [
  {
    id: 'l1-joins-fanout',
    stageId: 'stage-1',
    order: 1,
    title: 'Granularidad y el fan-out en JOINs',
    subtitle: 'Por qué una consulta sintácticamente válida puede duplicar los ingresos de un reporte.',
    duration: '25 min',
    level: 'Fundamentos',
    bloomLevel: 'analyze',
    coreFocus: ['DE', 'DA', 'BI'],
    goal: 'Identificar la granularidad (grain) de cualquier tabla, diagnosticar relaciones 1:N y N:M (Chasm Trap) y evitar que un JOIN infle métricas financieras o de conteo.',
    visualType: 'join-fanout-visualizer',
    storyContext:
      'Escenario en Mercado Brisa (empresa ficticia): Tenemos dos tablas en producción: `orders` (1 fila por pedido único, incluye el costo de envío total `shipping_fee_usd` y el importe total `order_total_usd`) y `order_items` (1 fila por cada SKU dentro del pedido). Un analista las une con un JOIN directo para un reporte ejecutivo y anuncia que los ingresos por envío subieron un 142%. Finanzas audita el balance y comprueba que el dinero no existe en el banco. ¿Qué ocurrió exactamente dentro del motor SQL?',
    sections: [
      {
        heading: 'Qué es la granularidad (grain) y por qué define el contrato de una tabla',
        body: 'Antes de escribir una sola línea de SQL o arrastrar una métrica en una herramienta de BI, responde una pregunta obligatoria: "¿Qué representa exactamente una fila física en esta tabla?". Esa respuesta es el **grano** (granularidad) de la tabla y equivale a su clave primaria real.\nEn la tabla `orders`, una fila es un pedido único (`order_id`). En `order_items`, una fila es una línea de producto dentro de un pedido (`order_id + product_id`). Cuando cruzas tablas sin declarar el grano de entrada y el grano de salida esperado, pierdes el control matemático de tus agregaciones.',
      },
      {
        heading: 'Anatomía del fan-out (1:N) y del chasm trap (N:1:M)',
        body: 'El Fan-Out ocurre cuando haces un `JOIN` entre una tabla de granularidad gruesa (`orders`: 1 fila por pedido) y una tabla de granularidad fina (`order_items`: 3 productos para ese mismo pedido). El motor relacional repite las columnas de la cabecera (`orders`) 3 veces en la tabla intermedia en memoria. Si luego ejecutas `SUM(orders.order_total_usd)`, sumarás el mismo pedido tres veces.\nPeor aún es el Chasm Trap (abismo N:1:M): imagina unir `orders` con `order_items` (3 ítems) y al mismo tiempo con `order_payments` (2 intentos de pago con tarjeta dividida). El producto cartesiano por pedido genera 3 × 2 = 6 filas por pedido, multiplicando tanto las unidades vendidas como el dinero cobrado.',
      },
      {
        heading: 'Tres estrategias técnicas para evitar el fan-out',
        body: '1) Pre-agregación en CTEs: Agrupa cada tabla hija (`order_items`, `order_payments`) a nivel de `order_id` en su propia CTE antes de hacer el `LEFT JOIN` contra `orders`. Así garantizas una relación estricta `1:1`.\n2) Prorrateo (Allocation) en Ingeniería de Datos: En la capa Silver/Gold, distribuye los montos de cabecera (descuentos globales, costo de envío) proporcionalmente al peso de cada línea de ítem para que la tabla detallada sea 100% aditiva.\n3) Agregación simétrica en la Capa Semántica: Declara entidades primarias y foráneas en herramientas como MetricFlow o Cube para que el motor genere subconsultas pre-agregadas automáticamente.',
      },
      {
        heading: 'Auditoría defensiva: cómo detectar un fan-out antes de publicar',
        body: 'Nunca confíes en una consulta compleja sin verificar su invariante de cardinalidad. Antes y después de tus JOINs, compara `COUNT(*)` contra `COUNT(DISTINCT order_id)` y verifica que la suma de la métrica maestra (`SUM(order_total_usd)`) en tu consulta coincida al centavo con el `SUM(order_total_usd)` de la tabla `orders` aislada.',
      },
    ],
    triadPerspectives: {
      DE: {
        title: 'Qué construye y audita ingeniería (DE)',
        points: [
          'Diseña tablas Silver con granularidad homogénea: nunca mezcla medidas de cabecera sin prorratear en una tabla de líneas de detalle.',
          'Implementa tests automáticos en dbt/SQLMesh (`assert_sum_reconciliation`) que fallan el pipeline si `SUM(order_total)` cambia tras un enriquecimiento.',
          'Documenta explícitamente el `grain` en el contrato YAML de cada tabla del Lakehouse.',
        ],
      },
      DA: {
        title: 'Qué analiza y valida análisis (DA)',
        points: [
          'Antes de ejecutar cualquier `JOIN`, diagnostica la relación real (`1:1`, `1:N`, `N:M`) comparando `COUNT(*)` frente a `COUNT(DISTINCT pk)`.',
          'Aísla cada fuente de eventos (clics, ítems, reembolsos) en CTEs pre-agregadas al mismo nivel de entidad antes de consolidar.',
          'Usa `COUNT(DISTINCT order_id)` para conteos de entidades cuando es inevitable trabajar sobre una tabla denormalizada.',
        ],
      },
      BI: {
        title: 'Qué gobierna business intelligence (BI)',
        points: [
          'Configura relaciones `Muchos-a-Uno` con dirección de filtro segura en el modelo semántico para impedir sumas ingenuas de tablas padre.',
          'Oculta las columnas numéricas de cabecera en vistas de detalle o expone únicamente métricas certificadas desde la Capa Semántica.',
          'Incluye tarjetas de control de reconciliación financiera contra el libro mayor (General Ledger).',
        ],
      },
    },
    relatedLessons: [
      { id: 'l2-window-functions', reason: 'Aprende a usar funciones de ventana para prorratear importes o deduplicar filas antes de un JOIN.' },
      { id: 'l3-asof-lateral-ctes', reason: 'Aplica el diseño de CTEs modulares y cruces temporales que mantienen la cardinalidad exacta.' },
    ],
    playground: {
      description: 'Compara la consulta ingenua (que duplica importes de cabecera por cada ítem del pedido) contra la arquitectura con CTE pre-agregada:',
      badQueryLabel: 'Antipatrón: JOIN directo 1:N que infla ingresos un 142%',
      badQuery: `-- ERROR COMÚN: Unir cabecera (orders) con detalle (order_items) y sumar la cabecera
SELECT
  COUNT(o.order_id) AS pedidos_contados,
  SUM(o.order_total_usd) AS ingresos_cabecera_inflados,
  SUM(i.quantity) AS unidades_vendidas
FROM orders o
JOIN order_items i ON o.order_id = i.order_id;`,
      badResult: [
        {
          pedidos_contados: 4,
          ingresos_cabecera_inflados: '$850.00 (Falso. Real: $350.00)',
          unidades_vendidas: 6,
        },
      ],
      goodQueryLabel: 'Solución óptima: CTE pre-agregada al mismo grano (order_id)',
      goodQuery: `-- CORRECTO: Pre-agregar primero order_items al mismo grain (order_id) que orders
WITH items_por_pedido AS (
  SELECT
    order_id,
    SUM(quantity) AS unidades_pedido,
    COUNT(DISTINCT product_id) AS skus_distintos
  FROM order_items
  GROUP BY order_id
)
SELECT
  COUNT(o.order_id) AS pedidos_reales,
  SUM(o.order_total_usd) AS ingresos_reales_usd,
  SUM(COALESCE(i.unidades_pedido, 0)) AS unidades_vendidas
FROM orders o
LEFT JOIN items_por_pedido i ON o.order_id = i.order_id;`,
      goodResult: [
        {
          pedidos_reales: 2,
          ingresos_reales_usd: '$350.00 (100% Exacto)',
          unidades_vendidas: 6,
        },
      ],
    },
    codeChallenge: {
      title: 'Pre-agregación en CTEs contra el fan-out',
      instruction:
        'Completa la consulta para calcular por cada cliente sus ingresos brutos reales (`orders.order_total_usd`), total de unidades (`order_items.quantity`) y monto reembolsado (`refunds.refund_usd`) igualando primero la granularidad a `order_id`.',
      templateCode: `WITH items_agg AS (
  SELECT
    order_id,
    SUM(quantity) AS total_units
  FROM order_items
  {{b1}}
),
refunds_agg AS (
  SELECT
    order_id,
    SUM(refund_usd) AS total_refund_usd
  FROM refunds
  GROUP BY order_id
)
SELECT
  o.customer_id,
  {{b2}} AS pedidos_unicos,
  SUM(o.order_total_usd) AS gross_revenue_usd,
  SUM(COALESCE(i.total_units, 0)) AS unidades_compradas,
  SUM({{b3}}) AS refunded_usd
FROM orders o
LEFT JOIN items_agg i ON o.order_id = i.order_id
LEFT JOIN refunds_agg r ON o.order_id = r.order_id
GROUP BY o.customer_id;`,
      blanks: [
        {
          id: 'b1',
          placeholder: 'Cláusula para agrupar por pedido',
          acceptedAnswers: ['GROUP BY order_id', 'GROUP BY 1'],
          hint: 'Debes colapsar `order_items` para que quede exactamente 1 fila por `order_id`.',
        },
        {
          id: 'b2',
          placeholder: 'Conteo de pedidos',
          acceptedAnswers: ['COUNT(o.order_id)', 'COUNT(DISTINCT o.order_id)', 'COUNT(*)'],
          hint: 'Como la relación ya es 1:1 a nivel `orders`, cuenta los `o.order_id`.',
        },
        {
          id: 'b3',
          placeholder: 'Manejo de nulos en reembolsos',
          acceptedAnswers: ['COALESCE(r.total_refund_usd, 0)', 'IFNULL(r.total_refund_usd, 0)'],
          hint: 'No todos los pedidos tienen reembolso; convierte el `NULL` del `LEFT JOIN` en `0` con `COALESCE`.',
        },
      ],
      expectedOutputTable: [
        {
          customer_id: 'CUST-01',
          pedidos_unicos: 2,
          gross_revenue_usd: '$350.00',
          unidades_compradas: 6,
          refunded_usd: '$25.00',
        },
        {
          customer_id: 'CUST-02',
          pedidos_unicos: 1,
          gross_revenue_usd: '$120.00',
          unidades_compradas: 2,
          refunded_usd: '$0.00',
        },
      ],
      rubricCriteria: [
        'Pre-agrega la tabla hija `order_items` por `order_id` antes de unirla con la cabecera `orders`.',
        'Usa `LEFT JOIN` en lugar de `INNER JOIN` para no perder pedidos sin reembolsos o sin líneas accesorias.',
        'Protege las sumas de tablas opcionales con `COALESCE(..., 0)` para evitar resultados `NULL`.',
      ],
    },
    pipelineChallenge: {
      title: 'Flujo anti-fan-out del webhook al reporte',
      scenario:
        'Ordena el flujo correcto entre Ingeniería (DE), Análisis (DA) y BI para garantizar que ningún reporte ejecutivo duplique ingresos al cruzar cabeceras de pedidos con líneas de productos y pagos.',
      steps: [
        {
          id: 'step-1',
          label: '1. Declarar el grano y la clave primaria en el contrato de datos',
          role: 'DE',
          detail: 'Documentar que `raw_orders` tiene grain `order_id` (1:1) y `raw_order_items` tiene grain `order_id + item_seq` (1:N).',
        },
        {
          id: 'step-2',
          label: '2. Pre-agregar o prorratear en el modelo silver (dbt/SQLMesh)',
          role: 'DE',
          detail: 'Construir CTEs pre-agregadas a nivel `order_id` o prorratear el envío e impuestos proporcionalmente a cada línea de producto.',
        },
        {
          id: 'step-3',
          label: '3. Auditar invariantes de cardinalidad y reconciliación',
          role: 'DA',
          detail: 'Verificar que `COUNT(*) = COUNT(DISTINCT order_id)` y que la suma de ingresos en la vista analítica cuadra al centavo con pagos.',
        },
        {
          id: 'step-4',
          label: '4. Publicar métricas certificadas en la capa semántica',
          role: 'BI',
          detail: 'Exponer `gross_revenue_usd` y `units_sold` con agregación simétrica controlada para el dashboard ejecutivo.',
        },
      ],
      explanation:
        'Cuando DE fija el grain y prorratea en Silver, DA valida la reconciliación matemática sin duplicados y BI gobierna las métricas en la Capa Semántica, el error de Fan-Out queda estructuralmente bloqueado.',
    },
    checkpoint: {
      question:
        'Tienes una tabla `campaigns` (1 fila por campaña con su columna `budget_usd`) y la unes con `ad_clicks` (miles de clics por campaña). Si ejecutas `SELECT campaign_name, SUM(budget_usd), COUNT(click_id) ... GROUP BY campaign_name`, ¿qué ocurrirá con el presupuesto?',
      options: [
        {
          id: 'a',
          text: 'El presupuesto (`budget_usd`) se multiplicará por el número de clics de cada campaña debido al fan-out 1:N.',
          correct: true,
          feedback:
            'Exacto. Como `budget_usd` está al nivel de campaña y `ad_clicks` tiene miles de filas por campaña, sumar `budget_usd` después del JOIN multiplica el presupuesto miles de veces.',
        },
        {
          id: 'b',
          text: 'SQL detectará que `budget_usd` viene de la tabla izquierda y solo lo sumará una vez.',
          correct: false,
          feedback:
            'SQL estándar opera sobre la tabla resultante del JOIN fila por fila; no distingue de qué tabla venía originalmente el valor al ejecutar `SUM()`.',
        },
        {
          id: 'c',
          text: 'La consulta dará un error de sintaxis porque no se pueden usar `SUM` y `COUNT` juntos.',
          correct: false,
          feedback:
            'Sintácticamente es 100% válida, y por eso el error es tan peligroso: no falla, pero entrega un número falso.',
        },
      ],
    },
  },
  {
    id: 'l2-window-functions',
    stageId: 'stage-1',
    order: 2,
    title: 'Window functions, particiones y cláusula QUALIFY',
    subtitle: 'Cómo calcular rankings, variaciones mensuales y promedios móviles sin agrupar ni colapsar filas.',
    duration: '30 min',
    level: 'Fundamentos',
    bloomLevel: 'apply',
    coreFocus: ['DE', 'DA', 'BI'],
    goal: 'Escribir `OVER (PARTITION BY ... ORDER BY ...)`, elegir correctamente entre marcos `ROWS` y `RANGE`, y filtrar funciones de ventana con `QUALIFY`.',
    visualType: 'window-function-stepper',
    storyContext:
      'Escenario en CloudPulse SaaS (empresa ficticia): El webhook de facturación envía eventos duplicados cuando la red parpadea y, además, el comité directivo necesita clasificar cada mes de cada cliente en "Alta Nueva", "Expansión (Upgrade)", "Contracción (Downgrade)" o "Renovación Plana" comparando su ingreso recurrente (`mrr_usd`) contra el mes inmediato anterior. Con `GROUP BY` perderías el detalle temporal; con subconsultas anidadas el código se vuelve ilegible. Aquí entran las Window Functions y `QUALIFY`.',
    sections: [
      {
        heading: 'Estructura de OVER (PARTITION BY ... ORDER BY ...)',
        body: 'A diferencia de `GROUP BY` (que colapsa las filas en un único resumen destruyendo el grain individual), una Window Function calcula un valor agregado, un ranking o un desplazamiento manteniendo intacta cada fila.\nPiensa en `PARTITION BY user_id` como crear cubetas independientes (una por cliente) y en `ORDER BY event_date` como ordenar cronológicamente los eventos dentro de cada cubeta. Funciones de desplazamiento como `LAG(mrr_usd, 1, 0)` miran la fila inmediatamente anterior del mismo cliente, permitiéndote calcular `mrr_usd - LAG(mrr_usd, 1, 0)` en una sola línea.',
      },
      {
        heading: 'Funciones de ranking (ROW_NUMBER, RANK, DENSE_RANK) y cláusula QUALIFY',
        body: 'Cuando recibes eventos duplicados desde Kafka o webhooks, `ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY ingested_at DESC)` asigna el número `1` a la versión más reciente de cada evento (siempre entrega números únicos consecutivos `1, 2, 3`, mientras que `RANK` salta a `1, 1, 3` en empates y `DENSE_RANK` asigna `1, 1, 2`).\nEn SQL moderno (DuckDB, Snowflake, BigQuery, Databricks), la cláusula `QUALIFY` actúa como el `HAVING` de las funciones de ventana: te permite escribir `QUALIFY ROW_NUMBER() OVER (...) = 1` directamente sin envolver la consulta en una subconsulta adicional.',
      },
      {
        heading: 'Marcos de ventana: diferencia entre ROWS y RANGE',
        body: 'Cuando agregas un `ORDER BY` dentro de `OVER (...)`, SQL aplica por defecto el marco acumulado desde el inicio de la partición hasta la fila actual (`RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`).\nSi quieres una media móvil de 7 días, debes elegir con precisión quirúrgica:\n- `ROWS BETWEEN 6 PRECEDING AND CURRENT ROW`: cuenta 6 filas físicas hacia atrás. Si un producto no tuvo ventas el sábado ni el domingo, saltará a jueves y viernes de la semana anterior, promediando en realidad 9 días calendario.\n- `RANGE BETWEEN INTERVAL 6 DAYS PRECEDING AND CURRENT ROW`: evalúa la ventana lógica de tiempo exacto de los últimos 6 días calendario sin importar si faltan fechas intermedias.',
      },
      {
        heading: 'Sesgo de partición en producción por valores nulos en PARTITION BY',
        body: 'En motores distribuidos (Spark, Snowflake, BigQuery), `PARTITION BY session_id` envía todas las filas con el mismo `session_id` al mismo nodo trabajador (Worker) mediante un Hash Shuffle. Si el 65% de tu tráfico anónimo tiene `session_id IS NULL`, un único nodo recibirá el 65% de todo el dataset, provocando un cuello de botella severo (Data Skew / Out-Of-Memory) mientras los otros 31 nodos esperan ociosos.',
      },
    ],
    triadPerspectives: {
      DE: {
        title: 'Qué construye y optimiza ingeniería (DE)',
        points: [
          'Estandariza la deduplicación idempotente en la capa Silver con `QUALIFY ROW_NUMBER() OVER (PARTITION BY pk ORDER BY ingested_at DESC) = 1`.',
          'Previene el Data Skew en clústeres reemplazando claves nulas por un identificador salado (`COALESCE(session_id, CONCAT(\'anon_\', UUID()))`) antes de particionar.',
          'Reutiliza definiciones de ventana con la cláusula `WINDOW w AS (...)` para que el optimizador ejecute un único ordenamiento físico (`Sort`).',
        ],
      },
      DA: {
        title: 'Qué analiza y modela análisis (DA)',
        points: [
          'Utiliza `LAG()` y `LEAD()` para medir tiempos entre compras (inter-purchase time), detectar sesiones de usuario y clasificar cambios de MRR.',
          'Emplea marcos `RANGE BETWEEN INTERVAL ...` al calcular medias móviles sobre series temporales con días sin actividad.',
          'Calcula percentiles y Pareto acumulado combinando `SUM(revenue) OVER (ORDER BY revenue DESC) / SUM(revenue) OVER ()`.',
        ],
      },
      BI: {
        title: 'Qué presenta y gobierna BI',
        points: [
          'Construye tablas de cascada de ingresos (MRR Waterfall: New, Expansion, Contraction, Churn) basadas en deltas de ventana auditados en la capa Gold.',
          'Garantiza que las comparativas YoY (`LAG(..., 12)`) y MoM (`LAG(..., 1)`) operen sobre una tabla calendario densa (Date Spine) sin meses faltantes.',
          'Expone promedios móviles de 7 y 28 días para suavizar la estacionalidad semanal en dashboards operativos.',
        ],
      },
    },
    relatedLessons: [
      { id: 'l1-joins-fanout', reason: 'Deduplica primero tus tablas de dimensiones o eventos con `QUALIFY` para evitar provocar un Fan-Out al hacer JOIN.' },
      { id: 'l3-asof-lateral-ctes', reason: 'Cuando las marcas de tiempo entre dos tablas no coinciden exactamente, combina tus ventanas con `ASOF JOIN`.' },
    ],
    playground: {
      description: 'Observa cómo `QUALIFY` y `LAG` permiten deduplicar webhooks y clasificar el movimiento de ingresos recurrentes (MRR) con código limpio:',
      badQueryLabel: 'Antipatrón: subconsultas anidadas difíciles de mantener',
      badQuery: `-- DIFÍCIL DE LEER: Tres niveles de subconsultas para deduplicar y calcular LAG
SELECT user_id, event_date, mrr_usd, prev_mrr_usd, (mrr_usd - prev_mrr_usd) AS mrr_delta
FROM (
  SELECT user_id, event_date, mrr_usd,
         LAG(mrr_usd, 1, 0) OVER (PARTITION BY user_id ORDER BY event_date) AS prev_mrr_usd
  FROM (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id, event_date ORDER BY updated_at DESC) AS rn
    FROM raw_subscriptions
  ) t1 WHERE rn = 1
) t2;`,
      badResult: [
        { user_id: 'U-101', event_date: '2026-09-01', mrr_usd: '$49', prev_mrr_usd: '$0', mrr_delta: '+$49 (Alta)' },
        { user_id: 'U-101', event_date: '2026-10-01', mrr_usd: '$99', prev_mrr_usd: '$49', mrr_delta: '+$50 (Expansion)' },
      ],
      goodQueryLabel: 'Solución óptima: QUALIFY y cláusula WINDOW nombrada',
      goodQuery: `-- LIMPIO Y ÓPTIMO: Deduplicación directa con QUALIFY y ventana reutilizable
WITH clean_subs AS (
  SELECT user_id, event_date, mrr_usd
  FROM raw_subscriptions
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY user_id, event_date
    ORDER BY updated_at DESC
  ) = 1
)
SELECT
  user_id,
  event_date,
  mrr_usd,
  LAG(mrr_usd, 1, 0) OVER user_timeline AS prev_mrr_usd,
  mrr_usd - LAG(mrr_usd, 1, 0) OVER user_timeline AS mrr_delta
FROM clean_subs
WINDOW user_timeline AS (PARTITION BY user_id ORDER BY event_date);`,
      goodResult: [
        { user_id: 'U-101', event_date: '2026-09-01', mrr_usd: '$49', prev_mrr_usd: '$0', mrr_delta: '+$49 (Alta)' },
        { user_id: 'U-101', event_date: '2026-10-01', mrr_usd: '$99', prev_mrr_usd: '$49', mrr_delta: '+$50 (Expansion)' },
      ],
    },
    codeChallenge: {
      title: 'Deduplicación con QUALIFY y media móvil',
      instruction:
        'Completa la consulta para: (1) quedarte únicamente con el último registro enviado por cada `store_id` y `sale_date` usando `QUALIFY`, y (2) calcular el ingreso previo con `LAG` y la media móvil de 7 días calendario usando un marco `RANGE`.',
      templateCode: `WITH daily_store_sales AS (
  SELECT
    store_id,
    sale_date,
    revenue_usd
  FROM raw_pos_uploads
  {{b1}} ROW_NUMBER() OVER (
    PARTITION BY store_id, sale_date
    ORDER BY ingested_at DESC
  ) = 1
)
SELECT
  store_id,
  sale_date,
  revenue_usd,
  {{b2}}(revenue_usd, 1, 0) OVER (
    PARTITION BY store_id
    ORDER BY sale_date
  ) AS prev_day_revenue_usd,
  ROUND(
    AVG(revenue_usd) OVER (
      PARTITION BY store_id
      ORDER BY sale_date
      {{b3}} BETWEEN INTERVAL 6 DAYS PRECEDING AND CURRENT ROW
    ),
    2
  ) AS rolling_7d_avg_usd
FROM daily_store_sales;`,
      blanks: [
        {
          id: 'b1',
          placeholder: 'Cláusula para filtrar ventanas',
          acceptedAnswers: ['QUALIFY'],
          hint: 'Es el equivalente a `HAVING`, pero diseñado específicamente para filtrar funciones de ventana sin subconsultas.',
        },
        {
          id: 'b2',
          placeholder: 'Función para leer la fila anterior',
          acceptedAnswers: ['LAG'],
          hint: 'Esta función mira N filas hacia atrás dentro de la misma partición ordenada.',
        },
        {
          id: 'b3',
          placeholder: 'Tipo de marco por intervalo de fechas',
          acceptedAnswers: ['RANGE'],
          hint: 'Para ventanas basadas en `INTERVAL 6 DAYS` (fechas calendario y no conteo físico de filas), debes usar este tipo de marco.',
        },
      ],
      expectedOutputTable: [
        {
          store_id: 'MAD-01',
          sale_date: '2026-10-01',
          revenue_usd: '$1,200.00',
          prev_day_revenue_usd: '$0.00',
          rolling_7d_avg_usd: '$1,200.00',
        },
        {
          store_id: 'MAD-01',
          sale_date: '2026-10-03',
          revenue_usd: '$1,500.00',
          prev_day_revenue_usd: '$1,200.00',
          rolling_7d_avg_usd: '$1,350.00',
        },
      ],
      rubricCriteria: [
        'Filtra duplicados en la misma pasada usando `QUALIFY ROW_NUMBER() OVER (...) = 1`.',
        'Utiliza `LAG(revenue_usd, 1, 0)` particionando por tienda y ordenando por fecha.',
        'Selecciona `RANGE BETWEEN INTERVAL 6 DAYS PRECEDING AND CURRENT ROW` para respetar días sin ventas en la ventana de 7 días.',
      ],
    },
    pipelineChallenge: {
      title: 'Cascada de ingresos recurrentes sin duplicados',
      scenario:
        'Organiza la secuencia técnica para transformar eventos crudos de suscripciones con reintentos de red en un reporte oficial de Expansión y Churn de MRR.',
      steps: [
        {
          id: 'step-1',
          label: '1. Deduplicar eventos crudos por clave natural con QUALIFY',
          role: 'DE',
          detail: 'Aplicar `QUALIFY ROW_NUMBER() OVER (PARTITION BY subscription_id, billing_month ORDER BY webhook_ts DESC) = 1` en la capa Silver.',
        },
        {
          id: 'step-2',
          label: '2. Cruzar con calendario mensual continuo por cliente',
          role: 'DE',
          detail: 'Asegurar que cada suscripción activa tenga una fila por mes calendario para que los desplazamientos temporales sean continuos.',
        },
        {
          id: 'step-3',
          label: '3. Calcular ingreso previo y variación con LAG() por cliente',
          role: 'DA',
          detail: 'Evaluar `mrr_usd - LAG(mrr_usd, 1, 0) OVER (PARTITION BY customer_id ORDER BY billing_month)` para etiquetar Alta, Upgrade, Downgrade o Churn.',
        },
        {
          id: 'step-4',
          label: '4. Exponer la cascada de retención neta en el tablero',
          role: 'BI',
          detail: 'Visualizar la evolución mensual del Net Revenue Retention (NRR) con desglose auditable por cohorte.',
        },
      ],
      explanation:
        'Si calculas `LAG()` antes de deduplicar con `QUALIFY`, compararás un evento consigo mismo (delta = 0). Y si no garantizas un calendario continuo antes del `LAG()`, compararás octubre contra julio creyendo que fue el mes inmediato anterior.',
    },
    checkpoint: {
      question:
        '¿Cuál es la diferencia crítica entre usar `ROWS BETWEEN 6 PRECEDING AND CURRENT ROW` y `RANGE BETWEEN INTERVAL 6 DAYS PRECEDING AND CURRENT ROW` al calcular una media móvil de 7 días?',
      options: [
        {
          id: 'a',
          text: '`ROWS` cuenta 6 filas físicas hacia atrás (si faltan 2 días sin ventas en la tabla, promedia 9 días calendario), mientras que `RANGE` mira la ventana exacta de tiempo de 6 días calendario.',
          correct: true,
          feedback:
            'Correcto. Si un producto no tuvo ventas el domingo, `ROWS 6 PRECEDING` saltará un día más atrás y distorsionará la ventana temporal.',
        },
        {
          id: 'b',
          text: 'No hay ninguna diferencia; son sinónimos exactos en SQL.',
          correct: false,
          feedback:
            'Son muy distintos cuando existen fechas faltantes o múltiples filas con la misma fecha.',
        },
        {
          id: 'c',
          text: '`RANGE` solo funciona con columnas de texto.',
          correct: false,
          feedback:
            '`RANGE` con `INTERVAL` está diseñado específicamente para columnas de fecha (`DATE`) y tiempo (`TIMESTAMP`).',
        },
      ],
    },
  },
  {
    id: 'l3-asof-lateral-ctes',
    stageId: 'stage-1',
    order: 3,
    title: 'Cruces temporales con ASOF JOIN y CTEs',
    subtitle: 'Emparejar eventos de distinta frecuencia sin filtrar datos del futuro hacia el pasado.',
    duration: '30 min',
    level: 'Intermedio',
    bloomLevel: 'apply',
    coreFocus: ['DE', 'DA', 'BI'],
    goal: 'Implementar cruces Point-in-Time sin fuga de datos del futuro mediante `ASOF JOIN`, aplicar subconsultas correlacionadas con `LATERAL` y estructurar pipelines SQL con CTEs modulares.',
    visualType: 'asof-join-timeline',
    storyContext:
      'Escenario en Finanzas y Atribución de NovaPay (empresa ficticia): Un cliente realiza un pago en pesos mexicanos a las `10:14:22.410`. Las tasas de cambio oficiales (`fx_rates`) se actualizan en momentos irregulares (`09:58:00`, `10:12:05`, `10:19:40`). Si haces un `INNER JOIN` por igualdad de timestamp, pierdes el 99.9% de los pagos porque los milisegundos no coinciden. Y si haces un `JOIN` con `fx_ts <= payment_ts`, obtienes cientos de tasas pasadas por cada pago (Fan-Out masivo). ¿Cómo obtienes exactamente la tasa vigente a las `10:12:05` en una sola operación?',
    sections: [
      {
        heading: 'Exactitud punto en el tiempo (point-in-time correctness)',
        body: 'En la vida real, los sistemas no emiten eventos al mismo segundo: tienes compras a las `10:14:22`, cambios de tarifa de envío a las `08:00:00`, actualizaciones de segmento del cliente a las `10:05:00` y clics de campaña publicitaria 40 minutos antes de la conversión.\nUnir estas tablas con un `JOIN` tradicional de igualdad (`=`) fracasa porque los relojes no coinciden. Pero unirlas con una desigualdad abierta (`ON f.currency = r.currency AND r.quote_ts <= f.payment_ts`) multiplica cada pago por todas las cotizaciones históricas desde que existe la empresa, provocando un Fan-Out catastrófico.',
      },
      {
        heading: 'ASOF JOIN para emparejar series temporales',
        body: 'Motores modernos como DuckDB, Snowflake, ClickHouse y Databricks incorporan de forma nativa `ASOF JOIN`. Su semántica es elegante y determinista: para cada fila de la tabla izquierda (`payments`), busca en la tabla derecha (`fx_rates`) dentro de la misma clave de partición (`currency`) la **única fila cuyo timestamp sea el más cercano menor o igual (`<=`)** al timestamp del evento.\nDe este modo, el pago de las `10:14:22` se empareja instantáneamente con la cotización de las `10:12:05` e ignora tanto las cotizaciones más antiguas (`09:58:00`) como las cotizaciones del futuro (`10:19:40`), evitando el temido *Data Leakage* (fuga de información futura) en análisis y Machine Learning.',
      },
      {
        heading: 'LATERAL JOIN para subconsultas correlacionadas por fila',
        body: '¿Qué pasa si necesitas los **3 últimos tickets de soporte** previos a cada encuesta de satisfacción, o si estás en PostgreSQL/BigQuery donde necesitas emular un cruce correlacionado flexible? Un `LEFT JOIN LATERAL (SELECT ... WHERE s.user_id = o.user_id AND s.ticket_ts <= o.survey_ts ORDER BY s.ticket_ts DESC LIMIT 1)` actúa como un bucle `for-each` optimizado en el motor SQL: evalúa la subconsulta derecha para cada fila de la tabla izquierda y devuelve exactamente las N filas solicitadas.',
      },
      {
        heading: 'Estructura de CTEs modulares: importación, limpieza, preparación y salida',
        body: 'Las subconsultas anidadas de 200 líneas se leen de adentro hacia afuera y dificultan la depuración en equipo. La convención de **CTEs modulares** en ingeniería analítica organiza toda consulta compleja en bloques (`WITH ...`) lineales de arriba hacia abajo:\n1) CTEs de importación (`import`): Seleccionan solo las columnas y particiones de fechas necesarias de las tablas origen.\n2) CTEs de limpieza (`clean`): Estandarizan tipos, zonas horarias (`UTC`) y deduplican con `QUALIFY`.\n3) CTEs de lógica de negocio: Ejecutan los `ASOF JOIN` o pre-agregaciones sin Fan-Out.\n4) Proyección final (`SELECT`): Expone el contrato de salida limpio y listo para pruebas o visualización.',
      },
    ],
    triadPerspectives: {
      DE: {
        title: 'Qué construye y optimiza ingeniería (DE)',
        points: [
          'Normaliza rigurosamente todas las marcas de tiempo a `TIMESTAMP WITH TIME ZONE` (UTC) en la ingesta antes de permitir cualquier `ASOF JOIN`.',
          'Ordena físicamente las tablas de series temporales por `(partition_key, event_ts)` en Parquet/Iceberg para que el `ASOF JOIN` se ejecute como un Merge Sort en tiempo lineal `O(N + M)`.',
          'Factoriza pipelines complejos en CTEs modulares con nombres semánticos claros en dbt y SQLMesh.',
        ],
      },
      DA: {
        title: 'Qué analiza y modela análisis (DA)',
        points: [
          'Usa `ASOF JOIN` para construir conjuntos de entrenamiento Point-in-Time (Feature Engineering) garantizando cero Data Leakage del futuro.',
          'Resuelve modelos de atribución ("último toque antes de la compra dentro de una ventana de 7 días") combinando `ASOF JOIN` con una condición de caducidad temporal.',
          'Emplea `LATERAL JOIN` para extraer las N acciones inmediatamente anteriores a una cancelación (Churn).',
        ],
      },
      BI: {
        title: 'Qué gobierna y audita BI',
        points: [
          'Garantiza que la conversión multimoneda en reportes financieros utilice la tasa spot vigente al minuto de la transacción (`ASOF JOIN`) y no el promedio mensual.',
          'Audita que cada métrica atribuida a una campaña o segmento respete el estado histórico exacto del cliente cuando ocurrió el evento.',
          'Documenta la política de manejo de eventos sin match previo (`LEFT ASOF JOIN` con tasa de respaldo).',
        ],
      },
    },
    relatedLessons: [
      { id: 'l1-joins-fanout', reason: 'Un JOIN desigual sin `ASOF` genera el peor Fan-Out posible al multiplicar cada hecho por toda la historia previa.' },
      { id: 'l2-window-functions', reason: 'Cuando el motor no soporta `ASOF JOIN`, la alternativa clásica requiere combinar un JOIN desigual con `QUALIFY ROW_NUMBER() = 1`.' },
    ],
    playground: {
      description: 'Compara el error clásico de unir por desigualdad temporal (que multiplica filas o filtra datos del futuro) contra la precisión de `ASOF JOIN` con CTEs modulares:',
      badQueryLabel: 'Antipatrón: JOIN con desigualdad abierta que multiplica filas',
      badQuery: `-- ERROR GRAVE: Unir con r.quote_ts <= p.payment_ts sin acotar al único registro
-- más reciente empareja el pago de las 10:14 con TODAS las tasas anteriores del día
SELECT
  p.payment_id,
  p.payment_ts,
  p.amount_mxn,
  COUNT(r.quote_ts) AS tasas_emparejadas_por_error,
  SUM(ROUND(p.amount_mxn / r.usd_mxn_rate, 2)) AS monto_usd_inflado
FROM payments p
JOIN fx_rates r
  ON p.currency = r.currency
  AND r.quote_ts <= p.payment_ts
GROUP BY 1, 2, 3;`,
      badResult: [
        {
          payment_id: 'PAY-901',
          payment_ts: '10:14:22',
          amount_mxn: '$1,980 MXN',
          tasas_emparejadas_por_error: '3 tasas (08:30, 09:58, 10:12)',
          monto_usd_inflado: '$301.50 USD (Triplicado. Real: $100.00)',
        },
      ],
      goodQueryLabel: 'Solución óptima: CTEs modulares y ASOF JOIN exacto',
      goodQuery: `-- EXCELENTE: CTEs modulares + ASOF JOIN que empareja solo la cotización
-- inmediata anterior o igual (10:12:05) sin duplicar filas ni mirar al futuro
WITH payments_scoped AS (
  SELECT payment_id, currency, payment_ts, amount_mxn
  FROM payments
  WHERE payment_ts >= TIMESTAMP '2026-10-28 00:00:00'
),
fx_rates_clean AS (
  SELECT currency, quote_ts, usd_mxn_rate
  FROM fx_rates
  WHERE quote_ts >= TIMESTAMP '2026-10-28 00:00:00'
)
SELECT
  p.payment_id,
  p.payment_ts,
  r.quote_ts AS matched_fx_ts,
  r.usd_mxn_rate,
  ROUND(p.amount_mxn / r.usd_mxn_rate, 2) AS exact_amount_usd
FROM payments_scoped p
ASOF JOIN fx_rates_clean r
  ON p.currency = r.currency
  AND p.payment_ts >= r.quote_ts;`,
      goodResult: [
        {
          payment_id: 'PAY-901',
          payment_ts: '10:14:22',
          matched_fx_ts: '10:12:05 (Inmediata anterior)',
          usd_mxn_rate: '19.80',
          exact_amount_usd: '$100.00 USD (Exacto 1:1)',
        },
      ],
    },
    codeChallenge: {
      title: 'Atribución temporal al último clic con ASOF',
      instruction:
        'Completa el pipeline modular con CTEs para atribuir cada pedido (`orders`) al último clic publicitario (`ad_clicks`) del mismo `user_id` que haya ocurrido antes o en el mismo instante de la compra (`order_ts >= click_ts`).',
      templateCode: `{{b1}} orders_clean AS (
  SELECT
    order_id,
    user_id,
    order_ts,
    order_total_usd
  FROM raw_orders
  WHERE order_ts >= TIMESTAMP '2026-10-01 00:00:00'
),
clicks_clean AS (
  SELECT
    user_id,
    click_ts,
    campaign_code
  FROM raw_ad_clicks
  WHERE click_ts >= TIMESTAMP '2026-09-24 00:00:00'
)
SELECT
  o.order_id,
  o.user_id,
  o.order_ts,
  c.click_ts AS attributed_click_ts,
  COALESCE(c.campaign_code, 'ORGANIC_DIRECT') AS attributed_campaign,
  o.order_total_usd
FROM orders_clean o
LEFT {{b2}} clicks_clean c
  ON o.user_id = c.user_id
  AND {{b3}};`,
      blanks: [
        {
          id: 'b1',
          placeholder: 'Palabra clave para iniciar CTEs',
          acceptedAnswers: ['WITH'],
          hint: 'Toda arquitectura modular de Common Table Expressions comienza con esta palabra clave.',
        },
        {
          id: 'b2',
          placeholder: 'Operador de join temporal exacto',
          acceptedAnswers: ['ASOF JOIN'],
          hint: 'Une cada fila izquierda con la fila derecha más reciente que cumpla la desigualdad temporal.',
        },
        {
          id: 'b3',
          placeholder: 'Condición temporal Point-in-Time',
          acceptedAnswers: ['o.order_ts >= c.click_ts', 'c.click_ts <= o.order_ts'],
          hint: 'El clic (`c.click_ts`) debe haber ocurrido antes o en el mismo instante que el pedido (`o.order_ts`).',
        },
      ],
      expectedOutputTable: [
        {
          order_id: 'ORD-501',
          user_id: 'U-101',
          order_ts: '2026-10-28 14:20:00',
          attributed_click_ts: '2026-10-28 13:55:10',
          attributed_campaign: 'CAMP_SEARCH_Q4',
          order_total_usd: '$180.00',
        },
        {
          order_id: 'ORD-502',
          user_id: 'U-309',
          order_ts: '2026-10-28 15:10:00',
          attributed_click_ts: 'NULL',
          attributed_campaign: 'ORGANIC_DIRECT',
          order_total_usd: '$95.00',
        },
      ],
      rubricCriteria: [
        'Estructura la consulta en CTEs modulares (`WITH orders_clean AS (...), clicks_clean AS (...)`).',
        'Utiliza `LEFT ASOF JOIN` para conservar también los pedidos orgánicos que no tuvieron clic previo.',
        'Define la desigualdad temporal correcta (`o.order_ts >= c.click_ts`) impidiendo atribuir clics ocurridos después de la compra.',
      ],
    },
    pipelineChallenge: {
      title: 'Conversión multimoneda sin fuga del futuro',
      scenario:
        'Ordena los pasos técnicos para construir una tabla Gold de transacciones internacionales con tipo de cambio exacto al segundo del pago y atribución de campaña.',
      steps: [
        {
          id: 'step-1',
          label: '1. Estandarizar marcas de tiempo a UTC en CTEs de entrada',
          role: 'DE',
          detail: 'Crear las CTEs `payments_scoped` y `fx_rates_scoped` convirtiendo toda hora local a UTC para evitar desfases horarios.',
        },
        {
          id: 'step-2',
          label: '2. Deduplicar cotizaciones y ordenar por clave y tiempo',
          role: 'DE',
          detail: 'Garantizar con `QUALIFY` que no existan dos tasas distintas en el mismo milisegundo para la misma divisa.',
        },
        {
          id: 'step-3',
          label: '3. Ejecutar LEFT ASOF JOIN con condición temporal hacia atrás',
          role: 'DA',
          detail: 'Emparejar cada transacción con la cotización y el estado de membresía vigentes en `quote_ts <= payment_ts` sin Data Leakage.',
        },
        {
          id: 'step-4',
          label: '4. Auditar cobertura de tasas y publicar ingresos en USD',
          role: 'BI',
          detail: 'Verificar que el 100% de las transacciones tengan tasa asignada y exponer `net_revenue_usd` para reportes globales.',
        },
      ],
      explanation:
        'Un `ASOF JOIN` solo es confiable si ambas series temporales comparten la misma zona horaria (UTC) y están libres de duplicados exactos en el mismo instante; así DA evita fugas del futuro y BI reporta ingresos auditables.',
    },
    checkpoint: {
      question:
        'Un pago ocurre a las `14:05:10`. En la tabla `fx_rates` hay tres cotizaciones para esa moneda: a las `13:50:00` (19.50), a las `14:02:00` (19.80) y a las `14:06:00` (20.10). Si ejecutas `FROM payments p ASOF JOIN fx_rates r ON p.currency = r.currency AND p.payment_ts >= r.quote_ts`, ¿qué cotización se asignará al pago?',
      options: [
        {
          id: 'a',
          text: 'Únicamente la cotización de las `14:02:00` (19.80), porque es la más reciente entre las que ocurrieron antes o en el momento del pago (`<= 14:05:10`).',
          correct: true,
          feedback:
            'Exacto. `ASOF JOIN` ignora la de las `14:06:00` (porque ocurrió en el futuro respecto al pago) y descarta la de las `13:50:00` porque la de las `14:02:00` está más cerca del evento.',
        },
        {
          id: 'b',
          text: 'La cotización de las `14:06:00` (20.10), porque está a solo 50 segundos de distancia.',
          correct: false,
          feedback:
            'Con la condición `p.payment_ts >= r.quote_ts`, jamás se toma un registro del futuro (`14:06:00`), lo cual protege tus análisis y modelos contra el Data Leakage.',
        },
        {
          id: 'c',
          text: 'Devolverá dos filas para ese pago: la de las `13:50:00` y la de las `14:02:00`.',
          correct: false,
          feedback:
            'A diferencia de un `JOIN` normal con `<=`, `ASOF JOIN` devuelve como máximo 1 fila emparejada por cada fila de la tabla izquierda, evitando el Fan-Out.',
        },
      ],
    },
  },
];
