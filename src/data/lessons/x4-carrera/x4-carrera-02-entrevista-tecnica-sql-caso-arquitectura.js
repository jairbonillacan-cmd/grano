export const lesson = {
  id: 'x4-carrera-02-entrevista-tecnica-sql-caso-arquitectura',
  moduleId: 'x4-carrera',
  tracks: ['core', 'de', 'da', 'bi'],
  level: 4,
  order: 2,
  title: 'Entrevista técnica: SQL en vivo, caso y arquitectura',
  subtitle: 'La entrevista técnica por área: SQL en vivo, estudio de caso y diseño de arquitectura',
  minutes: 25,
  prerequisites: ['x4-carrera-01-portafolio-publico-de-da-bi'],
  contentVersion: 1,
  glossaryTerms: [
    'protocolo-sql-en-vivo',
    'desempate-determinista-ventana',
    'prueba-reconciliacion-datos',
    'compensacion-tecnica-tradeoff',
  ],
  hook: 'En una entrevista técnica en vivo, el mayor error no es olvidar una función, sino teclear un SELECT en silencio sin preguntar antes cuál es el grano de las tablas ni cómo deshacer empates. Quien evalúa la prueba observa cómo diagnosticas llaves duplicadas, cómo evitas multiplicar filas en un cruce y cómo justificas tus decisiones bajo presión. ¿Qué protocolo separa una respuesta improvisada de una resolución sistemática en SQL en vivo, estudio de caso y arquitectura?',
  objectives: [
    'Aplicar el protocolo de 5 pasos en pruebas de SQL en vivo (grano, cardinalidad de cruce, filtros de dominio, CTEs modulares y desempate determinista con QUALIFY).',
    'Estructurar la resolución de un estudio de caso de análisis o negocio (DA y BI) descomponiendo métricas, formulando hipótesis refutables y definiendo métricas guardarraíl.',
    'Defender un diseño de arquitectura en pizarra (DE y BI) especificando contratos de ingesta idempotente, grano de tablas de hechos y estrategia de historial SCD Tipo 2.',
  ],
  sections: [
    {
      id: 'sec-protocolo-sql-en-vivo',
      heading: 'El protocolo de 5 pasos para resolver SQL en vivo sin bloquearse',
      body: `Cuando recibes un enunciado de SQL en vivo, dedica los primeros sesenta segundos a pensar en voz alta con el **protocolo de 5 pasos**. Nunca escribas código sin declarar antes qué representa una fila de entrada y qué debe representar una fila de salida.

Primero, declara el **grano de entrada y salida**. Segundo, verifica la **cardinalidad del cruce** (uno-a-uno o uno-a-muchos) para decidir qué tablas requieren preagregación. Tercero, enumera los filtros de negocio y los casos borde como precios inválidos o reintentos.

Cuarto, divide el problema en **CTEs modulares** con nombres descriptivos en lugar de anidar subconsultas. Quinto, aplica un **desempate determinista** añadiendo una llave única al final del \`ORDER BY\` en las funciones de ventana. En DuckDB, la cláusula \`QUALIFY\` filtra directamente el resultado de \`ROW_NUMBER()\` o \`DENSE_RANK()\` sin requerir una subconsulta envolvente.`,
      example: {
        language: 'sql',
        code: `WITH pagos_unicos AS (
  SELECT
    payment_id,
    order_id,
    payment_method,
    amount_usd,
    status,
    idempotency_key
  FROM payments
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY idempotency_key
    ORDER BY payment_ts ASC, payment_id ASC
  ) = 1
)
SELECT
  payment_method,
  COUNT(*) FILTER (WHERE status = 'captured') AS cobros_exitosos,
  COUNT(*) FILTER (WHERE status = 'failed') AS cobros_fallidos,
  ROUND(SUM(amount_usd) FILTER (WHERE status = 'captured'), 2) AS importe_capturado_usd
FROM pagos_unicos
GROUP BY payment_method
ORDER BY importe_capturado_usd DESC;`,
        expectedOutput: [
          {
            payment_method: 'transferencia_spei',
            cobros_exitosos: 3960,
            cobros_fallidos: 548,
            importe_capturado_usd: 1935173.03,
          },
          {
            payment_method: 'efectivo_tienda',
            cobros_exitosos: 3960,
            cobros_fallidos: 547,
            importe_capturado_usd: 1927080.27,
          },
          {
            payment_method: 'billetera_digital',
            cobros_exitosos: 4140,
            cobros_fallidos: 367,
            importe_capturado_usd: 1539322.85,
          },
          {
            payment_method: 'card',
            cobros_exitosos: 4140,
            cobros_fallidos: 368,
            importe_capturado_usd: 1472911.85,
          },
        ],
      },
    },
    {
      id: 'sec-estudio-caso-y-arquitectura-pizarra',
      heading: 'Estudio de caso analítico (DA/BI) y diseño en pizarra (DE/BI)',
      body: `Tras la prueba de SQL, la entrevista se adapta a tu especialidad. En **Análisis de Datos (DA)** e **Inteligencia de Negocio (BI)** resolverás un estudio de caso. Por ejemplo, el entrevistador pregunta por qué cayó el margen neto un ocho por ciento en la región Andina. En **Ingeniería de Datos (DE)** y modelado BI enfrentarás un diseño de arquitectura en pizarra.

Para el estudio de caso, sigue cuatro etapas en orden. Primero, descarta **fallos de instrumentación** como caídas de webhooks o eventos duplicados. Segundo, descompón la métrica en su **árbol algebraico** (pedidos, ticket medio, descuentos, reembolsos y costos).

Tercero, estratifica por dimensión (canal, segmento, categoría y tienda) para aislar dónde se concentra el cambio. Cuarto, propón una acción acompañada de una **métrica guardarraíl**. En el diseño de pizarra, dibuja siempre tres capas: ingesta cruda inmutable, limpieza idempotente y modelo estrella con dimensiones SCD Tipo 2.`,
    },
    {
      id: 'sec-errores-frecuentes-entrevista',
      heading: 'Trampas de funciones de ventana y defensa de compensaciones',
      body: `En los ejercicios de ranking Top-N por grupo surgen siempre tres preguntas del entrevistador. Primero, cuál es la diferencia entre \`ROW_NUMBER()\`, \`RANK()\` y \`DENSE_RANK()\`. Segundo, cómo garantizas reproducibilidad cuando hay empates. Tercero, por qué no puedes filtrar una función de ventana dentro del \`WHERE\` de la misma consulta.

Recuerda el **orden lógico de evaluación** en SQL. El motor ejecuta primero \`FROM\` y \`JOIN\`, luego \`WHERE\`, después \`GROUP BY\` y \`HAVING\`, y recién en \`SELECT\` calcula las funciones de ventana. Por eso un filtro \`WHERE ranking <= 2\` falla en el mismo bloque. Debes usar una CTE previa o la cláusula \`QUALIFY\`.

Si el entrevistador cuestiona una elección de tu diseño, no cambies de postura al azar. Defiende tu **compensación técnica** explicando para qué volumen de datos o latencia es óptima tu solución. Luego indica qué cambiarías si el tráfico se multiplicara por cien.`,
    },
  ],
  workedExample: {
    title: 'Simulacro de SQL en vivo: Top 2 tiendas por región según ingreso neto post-reembolsos',
    description:
      'El entrevistador pide obtener para los pedidos con status IN (\'completed\', \'refunded\') las 2 primeras tiendas de cada región según su ingreso neto conciliado (subtotal_usd - discount_usd menos reembolsos), incluyendo conteo de pedidos y porcentaje regional. Compara la consulta con trampa de fan-out frente a la solución modular con QUALIFY.',
    steps: [
      {
        label: 'Paso 1: Identificar la trampa de fan-out al cruzar orders, stores y refunds sin preagregar',
        explanation:
          'Si el candidato une orders, stores y refunds en un solo bloque, los pedidos con múltiples reembolsos duplican su cabecera e inflan tanto el conteo de pedidos como el ingreso de Tienda Palermo Soho y Tienda Miraflores.',
        code: `SELECT
  s.region,
  s.store_name,
  COUNT(*) AS filas_contadas,
  ROUND(SUM(o.subtotal_usd - o.discount_usd - COALESCE(r.refund_amount_usd, 0)), 2) AS ingreso_erroneo_usd
FROM orders o
JOIN stores s ON o.store_id = s.store_id
LEFT JOIN refunds r ON o.order_id = r.order_id
WHERE o.status IN ('completed', 'refunded')
GROUP BY s.region, s.store_name
QUALIFY ROW_NUMBER() OVER (
  PARTITION BY s.region
  ORDER BY ingreso_erroneo_usd DESC, s.store_name ASC
) = 1
ORDER BY ingreso_erroneo_usd DESC;`,
        expectedOutput: [
          {
            region: 'Cono Sur',
            store_name: 'Tienda Palermo Soho',
            filas_contadas: 3125,
            ingreso_erroneo_usd: 1019005.74,
          },
          {
            region: 'Andina',
            store_name: 'Tienda Miraflores',
            filas_contadas: 2352,
            ingreso_erroneo_usd: 805211.4,
          },
          {
            region: 'Iberia',
            store_name: 'Almacén Logístico Coslada',
            filas_contadas: 1542,
            ingreso_erroneo_usd: 746275.83,
          },
          {
            region: 'Norteamérica',
            store_name: 'Tienda Polanco Sur',
            filas_contadas: 573,
            ingreso_erroneo_usd: 231245.95,
          },
        ],
      },
      {
        label: 'Paso 2: Resolver con CTE preagregada, peso regional en ventana y QUALIFY DENSE_RANK() <= 2',
        explanation:
          'Preagregamos refunds por order_id en reembolsos_pedido, calculamos las métricas limpias por tienda en metricas_tienda y aplicamos DENSE_RANK() con desempate determinista por store_name ASC junto con el porcentaje regional.',
        code: `WITH reembolsos_pedido AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS reembolso_usd
  FROM refunds
  GROUP BY order_id
),
metricas_tienda AS (
  SELECT
    s.region,
    s.store_name,
    COUNT(o.order_id) AS pedidos,
    SUM(o.subtotal_usd - o.discount_usd - COALESCE(r.reembolso_usd, 0)) AS ingreso_neto_usd
  FROM orders o
  JOIN stores s ON o.store_id = s.store_id
  LEFT JOIN reembolsos_pedido r ON o.order_id = r.order_id
  WHERE o.status IN ('completed', 'refunded')
  GROUP BY s.region, s.store_name
)
SELECT
  region,
  DENSE_RANK() OVER (
    PARTITION BY region
    ORDER BY ingreso_neto_usd DESC, store_name ASC
  ) AS ranking_region,
  store_name,
  pedidos,
  ROUND(ingreso_neto_usd, 2) AS ingreso_neto_usd,
  ROUND(100.0 * ingreso_neto_usd / SUM(ingreso_neto_usd) OVER (PARTITION BY region), 2) AS pct_region
FROM metricas_tienda
QUALIFY ranking_region <= 2
ORDER BY region ASC, ranking_region ASC;`,
        expectedOutput: [
          {
            region: 'Andina',
            ranking_region: 1,
            store_name: 'Tienda Miraflores',
            pedidos: 2301,
            ingreso_neto_usd: 792204.22,
            pct_region: 44.9,
          },
          {
            region: 'Andina',
            ranking_region: 2,
            store_name: 'Tienda Chapinero Norte',
            pedidos: 1467,
            ingreso_neto_usd: 491741.78,
            pct_region: 27.87,
          },
          {
            region: 'Cono Sur',
            ranking_region: 1,
            store_name: 'Tienda Palermo Soho',
            pedidos: 3077,
            ingreso_neto_usd: 1006870.5,
            pct_region: 53.92,
          },
          {
            region: 'Cono Sur',
            ranking_region: 2,
            store_name: 'Tienda Providencia',
            pedidos: 2324,
            ingreso_neto_usd: 860376.43,
            pct_region: 46.08,
          },
          {
            region: 'Iberia',
            ranking_region: 1,
            store_name: 'Almacén Logístico Coslada',
            pedidos: 1523,
            ingreso_neto_usd: 739392.23,
            pct_region: 59.87,
          },
          {
            region: 'Iberia',
            ranking_region: 2,
            store_name: 'Tienda Salamanca',
            pedidos: 792,
            ingreso_neto_usd: 252677.12,
            pct_region: 20.46,
          },
          {
            region: 'Norteamérica',
            ranking_region: 1,
            store_name: 'Tienda Polanco Sur',
            pedidos: 564,
            ingreso_neto_usd: 228242.98,
            pct_region: 29.08,
          },
          {
            region: 'Norteamérica',
            ranking_region: 2,
            store_name: 'Tienda Roma Norte',
            pedidos: 638,
            ingreso_neto_usd: 216094.88,
            pct_region: 27.53,
          },
        ],
      },
    ],
  },
  checks: [
    {
      id: 'chk-x4-02-protocolo',
      type: 'order',
      prompt:
        'Ordena los 5 pasos del protocolo para resolver un ejercicio de SQL en vivo durante una entrevista técnica:',
      items: [
        'Declarar en voz alta el grano de las tablas de entrada y el grano exacto de la tabla de salida.',
        'Identificar las llaves de cruce y la cardinalidad (1:1 o 1:N) para detectar dónde se requiere preagregar.',
        'Explicitar los filtros de negocio, las reglas de limpieza de dominio y los casos borde.',
        'Escribir la solución en CTEs modulares con nombres descriptivos en lugar de subconsultas anidadas.',
        'Añadir desempate determinista en funciones de ventana y verificar el conteo de filas.',
      ],
      correctOrder: [
        'Declarar en voz alta el grano de las tablas de entrada y el grano exacto de la tabla de salida.',
        'Identificar las llaves de cruce y la cardinalidad (1:1 o 1:N) para detectar dónde se requiere preagregar.',
        'Explicitar los filtros de negocio, las reglas de limpieza de dominio y los casos borde.',
        'Escribir la solución en CTEs modulares con nombres descriptivos en lugar de subconsultas anidadas.',
        'Añadir desempate determinista en funciones de ventana y verificar el conteo de filas.',
      ],
      explanation:
        'Declarar el grano y la cardinalidad antes de escribir código evita la mayoría de los errores de multiplicación de filas en entrevistas de SQL en vivo.',
    },
    {
      id: 'chk-x4-02-fill-qualify',
      type: 'fill-code',
      prompt:
        'Completa la cláusula de DuckDB que filtra directamente las filas donde la función de ventana `ROW_NUMBER()` vale `1` sin envolver la consulta en otra CTE:',
      template: `SELECT
  payment_id,
  idempotency_key,
  amount_usd
FROM payments
{{b1}} ROW_NUMBER() OVER (
  PARTITION BY idempotency_key
  ORDER BY payment_ts ASC, payment_id ASC
) = 1;`,
      blanks: [{ id: 'b1', accepted: ['QUALIFY', 'qualify'] }],
      explanation:
        'La cláusula QUALIFY se evalúa después de las funciones de ventana y permite filtrar sus resultados directamente en el mismo bloque SELECT sin subconsultas adicionales.',
    },
    {
      id: 'chk-x4-02-caso',
      type: 'mcq',
      prompt:
        'En una entrevista de estudio de caso para DA o BI, el entrevistador pregunta: "La conversión web cayó un 12 % ayer; ¿cuál es tu primer paso?". ¿Qué respuesta demuestra mayor madurez técnica?',
      options: [
        {
          id: 'a',
          text: 'Recomendar de inmediato duplicar el presupuesto de marketing en la campaña de redes sociales.',
          correct: false,
          feedback:
            'Incorrecto. Proponer una acción de gasto sin haber diagnosticado siquiera si el dato es real o qué etapa del embudo cayó es un error grave.',
        },
        {
          id: 'b',
          text: 'Entrenar un modelo predictivo complejo para estimar la probabilidad de compra del mes siguiente.',
          correct: false,
          feedback:
            'Incorrecto. Un cambio brusco de un día requiere diagnóstico de integridad y descomposición de métricas, no un modelo predictivo.',
        },
        {
          id: 'c',
          text: 'Verificar primero la integridad de la telemetría (retrasos de ingesta, eventos duplicados o caída de un webhook) y luego descomponer el embudo por dispositivo, región y segmento.',
          correct: true,
          feedback:
            'Correcto. Todo diagnóstico serio descarta primero fallos de captura o pipeline y a continuación aísla en qué numerador, denominador o segmento ocurrió la caída.',
        },
        {
          id: 'd',
          text: 'Eliminar del tablero los datos del día anterior considerándolos un valor atípico sin investigarlos.',
          correct: false,
          feedback:
            'Incorrecto. Borrar una caída abrupta oculta posibles incidentes operativos en el cobro o en la plataforma web.',
        },
      ],
      explanation:
        'En un estudio de caso siempre se valida primero la calidad e integridad del dato y después se descompone el árbol algebraico de la métrica por dimensiones.',
    },
  ],
  practice: {
    type: 'sql',
    title: 'Reto de SQL en vivo: Top 2 categorías por segmento de cliente según margen bruto limpio',
    language: 'sql',
    prompt:
      'Resuelve este ejercicio típico de entrevista técnica en vivo sobre Mercado Brisa: para los pedidos completados (`o.status = \'completed\'`) y excluyendo productos con precio de lista inválido (`p.list_price_usd > 0`), encuentra las **2 categorías de producto (`p.category`) con mayor margen bruto** dentro de cada segmento de cliente (`c.segment`). Define el margen bruto como `ROUND(SUM(oi.line_total_usd - oi.qty * p.unit_cost_usd), 2)`. Devuelve exactamente las columnas `segment`, `ranking` (`ROW_NUMBER()` particionado por `segment` y ordenado por `margen_bruto_usd DESC, category ASC`), `category`, `pedidos_unicos` (`COUNT(DISTINCT o.order_id)`), `unidades` (`SUM(oi.qty)`) y `margen_bruto_usd`. Filtra las 2 primeras posiciones por segmento usando `QUALIFY` y ordena el resultado final por `segment ASC, ranking ASC`.',
    starterCode: `-- Consulta base sin particionar por segmento ni filtrar el Top 2 con QUALIFY:
SELECT
  c.segment,
  p.category,
  COUNT(DISTINCT o.order_id) AS pedidos_unicos,
  SUM(oi.qty) AS unidades,
  ROUND(SUM(oi.line_total_usd - oi.qty * p.unit_cost_usd), 2) AS margen_bruto_usd
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id
WHERE o.status = 'completed'
GROUP BY c.segment, p.category
ORDER BY c.segment ASC, margen_bruto_usd DESC;`,
    expected: `WITH margen_por_segmento_categoria AS (
  SELECT
    c.segment,
    p.category,
    COUNT(DISTINCT o.order_id) AS pedidos_unicos,
    SUM(oi.qty) AS unidades,
    ROUND(SUM(oi.line_total_usd - oi.qty * p.unit_cost_usd), 2) AS margen_bruto_usd
  FROM orders o
  JOIN customers c ON o.customer_id = c.customer_id
  JOIN order_items oi ON o.order_id = oi.order_id
  JOIN products p ON oi.product_id = p.product_id
  WHERE o.status = 'completed'
    AND p.list_price_usd > 0
  GROUP BY c.segment, p.category
)
SELECT
  segment,
  ROW_NUMBER() OVER (
    PARTITION BY segment
    ORDER BY margen_bruto_usd DESC, category ASC
  ) AS ranking,
  category,
  pedidos_unicos,
  unidades,
  margen_bruto_usd
FROM margen_por_segmento_categoria
QUALIFY ranking <= 2
ORDER BY segment ASC, ranking ASC;`,
    orderMatters: true,
    hints: [
      'Asegúrate de incluir el filtro de dominio AND p.list_price_usd > 0 en el WHERE al cruzar order_items con products.',
      'Agrupa primero en una CTE margen_por_segmento_categoria por c.segment y p.category calculando pedidos_unicos, unidades y margen_bruto_usd.',
      'En el SELECT externo calcula ROW_NUMBER() OVER (PARTITION BY segment ORDER BY margen_bruto_usd DESC, category ASC) AS ranking y filtra con QUALIFY ranking <= 2.',
    ],
    solution: `WITH margen_por_segmento_categoria AS (
  SELECT
    c.segment,
    p.category,
    COUNT(DISTINCT o.order_id) AS pedidos_unicos,
    SUM(oi.qty) AS unidades,
    ROUND(SUM(oi.line_total_usd - oi.qty * p.unit_cost_usd), 2) AS margen_bruto_usd
  FROM orders o
  JOIN customers c ON o.customer_id = c.customer_id
  JOIN order_items oi ON o.order_id = oi.order_id
  JOIN products p ON oi.product_id = p.product_id
  WHERE o.status = 'completed'
    AND p.list_price_usd > 0
  GROUP BY c.segment, p.category
)
SELECT
  segment,
  ROW_NUMBER() OVER (
    PARTITION BY segment
    ORDER BY margen_bruto_usd DESC, category ASC
  ) AS ranking,
  category,
  pedidos_unicos,
  unidades,
  margen_bruto_usd
FROM margen_por_segmento_categoria
QUALIFY ranking <= 2
ORDER BY segment ASC, ranking ASC;`,
    solutionExplanation:
      'Al calcular primero las métricas agregadas por (segment, category) excluyendo precios no positivos y aplicar después ROW_NUMBER() OVER (PARTITION BY segment ORDER BY margen_bruto_usd DESC, category ASC) con QUALIFY ranking <= 2, obtenemos un Top-2 determinista y limpio por segmento.',
    expectedOutputTable: [
      {
        segment: 'cafeteria_b2b',
        ranking: 1,
        category: 'Molinos',
        pedidos_unicos: 1122,
        unidades: 2951,
        margen_bruto_usd: 192608.32,
      },
      {
        segment: 'cafeteria_b2b',
        ranking: 2,
        category: 'Cafeteras',
        pedidos_unicos: 1134,
        unidades: 3032,
        margen_bruto_usd: 167645.9,
      },
      {
        segment: 'pro_barista',
        ranking: 1,
        category: 'Molinos',
        pedidos_unicos: 2600,
        unidades: 5750,
        margen_bruto_usd: 372406.55,
      },
      {
        segment: 'pro_barista',
        ranking: 2,
        category: 'Cafeteras',
        pedidos_unicos: 2598,
        unidades: 5728,
        margen_bruto_usd: 313083.01,
      },
      {
        segment: 'retail',
        ranking: 1,
        category: 'Molinos',
        pedidos_unicos: 2523,
        unidades: 5613,
        margen_bruto_usd: 363058.36,
      },
      {
        segment: 'retail',
        ranking: 2,
        category: 'Cafeteras',
        pedidos_unicos: 2518,
        unidades: 5510,
        margen_bruto_usd: 301161.44,
      },
    ],
  },
  roleNotes: {
    de: 'En entrevistas de Ingeniería de Datos, espera preguntas sobre reintentos de red (entrega at-least-once), deduplicación determinista con claves de idempotencia, particionamiento físico de tablas y cómo diseñar dimensiones SCD Tipo 2 que soporten reprocesos históricos sin duplicar registros.',
    da: 'En entrevistas de Análisis de Datos, verbaliza siempre tus supuestos sobre valores nulos y extremos antes de agregar, usa COUNT(DISTINCT ...) cuando cruces cabeceras con líneas y estructura los estudios de caso formulando hipótesis refutables con métricas resistentes.',
    bi: 'En entrevistas de Inteligencia de Negocio, demuestra dominio del grano al combinar múltiples tablas de hechos (ventas, reembolsos y gasto publicitario) y acompaña cada métrica principal de su métrica guardarraíl para evitar optimizaciones locales dañinas.',
  },
  summary: [
    'El protocolo de 5 pasos en SQL exige declarar grano, cardinalidad, filtros, CTEs modulares y desempates deterministas.',
    'La cláusula QUALIFY en DuckDB filtra funciones de ventana como ROW_NUMBER() y DENSE_RANK() tras su evaluación.',
    'Un estudio de caso analítico verifica primero la integridad del dato, descompone la métrica y fija métricas guardarraíl.',
    'En pizarra debes justificar la ingesta idempotente, el grano de hechos y las compensaciones entre SCD1 y SCD2.',
  ],
  flashcards: [
    {
      id: 'fc-x4-02-1',
      front: '¿Cuáles son los 5 pasos del protocolo para resolver un ejercicio de SQL en vivo?',
      back: '1) Declarar el grano de entrada y salida, 2) identificar llaves y cardinalidad del JOIN, 3) definir filtros de dominio y casos borde, 4) modularizar en CTEs y 5) añadir desempate determinista y verificar conteos.',
    },
    {
      id: 'fc-x4-02-2',
      front: '¿Por qué es obligatorio añadir una columna única (como `payment_id ASC` o `category ASC`) al final del `ORDER BY` de `ROW_NUMBER()`?',
      back: 'Porque si dos filas empatan en la métrica principal o en la marca temporal, el motor podría asignarles el número 1 de forma no determinista entre ejecuciones distintas.',
    },
    {
      id: 'fc-x4-02-3',
      front: '¿Cuál es el primer paso al responder un estudio de caso del tipo "la métrica X cayó un 10 % ayer"?',
      back: 'Descartar un fallo de instrumentación o pipeline (retraso de carga, caída de un webhook, cambio en la versión de la app o duplicación de eventos) antes de buscar causas comerciales.',
    },
    {
      id: 'fc-x4-02-4',
      front: '¿Qué diferencia práctica hay entre `ROW_NUMBER()` y `DENSE_RANK()` al pedir un Top-N por partición?',
      back: '`ROW_NUMBER()` asigna números consecutivos únicos (1, 2, 3) rompiendo empates; `DENSE_RANK()` asigna la misma posición a los empatados sin dejar huecos en la numeración siguiente.',
    },
  ],
  sources: [
    {
      title: 'DuckDB SQL Query Syntax — QUALIFY Clause',
      url: 'https://duckdb.org/docs/stable/sql/query_syntax/qualify.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Uso de QUALIFY para filtrar funciones de ventana por partición y orden determinista.',
    },
    {
      title: 'Declaring the Grain',
      url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/grain/',
      publisher: 'Kimball Group (Ralph Kimball & Margy Ross)',
      accessed: '2026-10-29',
      supports: 'Declaración del grano como primer paso antes de diseñar esquemas o escribir consultas con múltiples uniones.',
    },
    {
      title: 'Trustworthy Online Controlled Experiments: A Practical Guide to A/B Testing',
      url: 'https://experimentguide.com/',
      publisher: 'Cambridge University Press (Kohavi, Tang & Xu)',
      accessed: '2026-10-29',
      supports: 'Diagnóstico de anomalías en métricas, formulación de hipótesis y uso de métricas guardarraíl en estudios de caso.',
    },
    {
      title: 'Timeouts, retries, and backoff with jitter',
      url: 'https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/',
      publisher: "Amazon Web Services Builders' Library (Marc Brooker)",
      accessed: '2026-10-29',
      supports: 'Origen de los eventos duplicados por reintentos de red y diseño de ingesta idempotente en entrevistas de arquitectura.',
    },
  ],
  aiNotes:
    'Cuando el estudiante practique esta lección, actúa como un entrevistador técnico constructivo: pídele que declare primero el grano de la tabla de salida antes de revisar su sintaxis. En la práctica SQL, recuerda que el starterCode no filtra p.list_price_usd > 0 ni aplica ROW_NUMBER() con QUALIFY ranking <= 2, por lo que devuelve las 15 combinaciones de segmento y categoría en lugar de las 6 filas del Top 2.',
};

export default lesson;
