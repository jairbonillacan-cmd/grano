export const lesson = {
  id: 'x4-carrera-01-portafolio-publico-de-da-bi',
  moduleId: 'x4-carrera',
  tracks: ['core', 'de', 'da', 'bi'],
  level: 4,
  order: 1,
  title: 'Portafolio público por área: código, datos y decisiones',
  subtitle: 'Cómo estructurar un portafolio público por área (DE, DA, BI) con código, datos y decisiones',
  minutes: 20,
  prerequisites: [
    'c2-dimensional-03-scd2-history',
    'da2-eda-04-diario-analisis-reproducible',
    'bi2-metricas-01-anatomia-metrica',
  ],
  contentVersion: 1,
  glossaryTerms: [
    'registro-decision-arquitectura-adr',
    'reproducibilidad-computacional',
    'prueba-reconciliacion-datos',
    'compensacion-tecnica-tradeoff',
  ],
  hook: 'Un reclutador técnico dedica menos de dos minutos a inspeccionar un repositorio público antes de decidir si agenda una entrevista. Nueve de cada diez carpetas muestran el mismo cuaderno con gráficos descriptivos sobre un CSV limpio, sin pruebas de calidad ni decisiones documentadas. Si el evaluador abre hoy tu proyecto sobre Mercado Brisa, ¿encontrará un script frágil que suma cobros duplicados o una arquitectura reproducible con auditoría de datos y compensaciones técnicas explícitas?',
  objectives: [
    'Estructurar un repositorio público diferenciado por rol (Ingeniería de Datos, Análisis de Datos o Inteligencia de Negocio) con reproducibilidad en un comando.',
    'Documentar elecciones de diseño mediante Registros de Decisión de Arquitectura (ADR) con contexto, alternativas evaluadas y compensaciones aceptadas.',
    'Implementar pruebas SQL de reconciliación financiera y de grano sobre Mercado Brisa para demostrar rigor técnico ante un evaluador.',
  ],
  sections: [
    {
      id: 'sec-anatomia-portafolio-por-area',
      heading: 'Anatomía de un repositorio público que supera el filtro de 90 segundos',
      body: `Un portafolio técnico fracasa cuando parece una tarea escolar sin contexto operativo. Quien evalúa tu repositorio busca tres señales en noventa segundos. Primero, un problema de negocio cuantificado. Segundo, **reproducibilidad computacional** en un comando. Tercero, pruebas automáticas sobre datos imperfectos.

La estructura del repositorio cambia según el rol al que postulas. En **Ingeniería de Datos (DE)**, el centro es la ingesta idempotente, el modelado dimensional con historial SCD Tipo 2 y los contratos de esquema. En **Análisis de Datos (DA)**, la evidencia principal es el diario de exploración con hipótesis refutables y la tabla de atrición. En **Inteligencia de Negocio (BI)**, el núcleo es el árbol de la Métrica Estrella del Norte y la capa semántica sin ambigüedad de grano.

En las tres rutas, el archivo \`README.md\` debe abrir con el impacto económico del problema. Incluye allí mismo una consulta SQL de auditoría inicial. Así demuestras que perfilaste las fuentes crudas antes de graficar o agregar.`,
      example: {
        language: 'sql',
        code: `SELECT
  '1_webhooks_duplicados_payments' AS control_calidad,
  COUNT(*) AS filas_crudas,
  COUNT(DISTINCT idempotency_key) AS filas_limpias,
  COUNT(*) - COUNT(DISTINCT idempotency_key) AS anomalias_detectadas
FROM payments
UNION ALL
SELECT
  '2_eventos_duplicados_events' AS control_calidad,
  COUNT(*) AS filas_crudas,
  COUNT(DISTINCT event_id) AS filas_limpias,
  COUNT(*) - COUNT(DISTINCT event_id) AS anomalias_detectadas
FROM events
UNION ALL
SELECT
  '3_productos_precio_negativo' AS control_calidad,
  COUNT(*) AS filas_crudas,
  COUNT(*) FILTER (WHERE list_price_usd > 0) AS filas_limpias,
  COUNT(*) FILTER (WHERE list_price_usd <= 0) AS anomalias_detectadas
FROM products
ORDER BY control_calidad;`,
        expectedOutput: [
          {
            control_calidad: '1_webhooks_duplicados_payments',
            filas_crudas: 19200,
            filas_limpias: 18750,
            anomalias_detectadas: 450,
          },
          {
            control_calidad: '2_eventos_duplicados_events',
            filas_crudas: 65000,
            filas_limpias: 63800,
            anomalias_detectadas: 1200,
          },
          {
            control_calidad: '3_productos_precio_negativo',
            filas_crudas: 180,
            filas_limpias: 179,
            anomalias_detectadas: 1,
          },
        ],
      },
    },
    {
      id: 'sec-adr-decisiones-y-compensaciones',
      heading: 'Documentar decisiones con Registros de Decisión de Arquitectura (ADR)',
      body: `El código muestra qué programaste, pero no explica por qué descartaste otras alternativas válidas. En equipos de datos profesionales, esa memoria técnica se conserva en la carpeta \`docs/adr/\`. Cada archivo es un **Registro de Decisión de Arquitectura (ADR)** versionado junto con las consultas SQL.

El formato creado por Michael Nygard consta de cinco bloques breves: título numerado, estado, contexto, decisión y consecuencias. En el bloque de consecuencias debes explicitar la **compensación técnica** (*trade-off*). Toda elección real implica ganar en una propiedad a cambio de ceder de forma controlada en otra.

Veamos una decisión concreta sobre Mercado Brisa. Un candidato documenta en \`ADR-001\` por qué cruzó los pedidos con \`customer_changes\` usando intervalos \`valid_from\` y \`valid_to\` (SCD Tipo 2). Descartó usar \`customers.current_tier\` (SCD Tipo 1). La ventaja ganada es eliminar el sesgo retrospectivo en los ingresos por nivel de fidelidad. El costo aceptado es un cruce por desigualdad temporal más exigente en CPU que una unión simple por clave.`,
    },
    {
      id: 'sec-pruebas-reconciliacion-y-antipatrones',
      heading: 'Pruebas de reconciliación financiera y antipatrones de portafolio',
      body: `Cuando un líder técnico revisa tus consultas en \`sql/\`, comprueba primero si respetas el grano de cada tabla. El error más frecuente en portafolios de DA y BI es mezclar granos distintos en un mismo \`JOIN\`. Si unes cabeceras de \`orders\` con líneas de \`order_items\` o devoluciones de \`refunds\` y sumas \`o.subtotal_usd - o.discount_usd\`, duplicas importes.

Para blindar tu repositorio, añade una carpeta \`tests/\` con una **prueba SQL de reconciliación**. Esta consulta compara el conteo de pedidos y la suma de ingresos antes y después de cada transformación. En marcos como dbt o en scripts sobre DuckDB, la prueba se diseña para devolver cero filas discrepantes.

Evita tres antipatrones que descartan candidaturas de inmediato. Primero, no subas cuadernos con celdas ejecutadas fuera de orden (\`In [42]\` antes de \`In [3]\`). Segundo, nunca dejes rutas locales absolutas como \`C:/Users/MiUsuario/datos.csv\`. Tercero, no escribas un \`README.md\` que solo enumera librerías sin cuantificar ningún hallazgo de negocio.`,
    },
  ],
  workedExample: {
    title: 'Auditoría de grano y reconciliación regional para un portafolio de BI y DA',
    description:
      'Un candidato publica en su portafolio un informe regional de ingresos netos de Mercado Brisa sobre pedidos con status IN (\'completed\', \'refunded\'). Compara su primera consulta con error de fan-out frente a la versión conciliada con CTE preagregada.',
    steps: [
      {
        label: 'Paso 1: Reproducir la consulta ingenua que multiplica cabeceras al unir orders con refunds',
        explanation:
          'Al hacer LEFT JOIN directo entre orders (grano: 1 fila por pedido) y refunds (grano: 1 fila por reembolso), los 270 pedidos que tienen dos reembolsos parciales duplican su cabecera y suman dos veces su subtotal neto (subtotal_usd - discount_usd).',
        code: `SELECT
  s.region,
  COUNT(*) AS filas_tras_join,
  COUNT(DISTINCT o.order_id) AS pedidos_reales,
  ROUND(SUM(o.subtotal_usd - o.discount_usd) - SUM(COALESCE(r.refund_amount_usd, 0)), 2) AS ingreso_inflado_usd
FROM orders o
JOIN stores s ON o.store_id = s.store_id
LEFT JOIN refunds r ON o.order_id = r.order_id
WHERE o.status IN ('completed', 'refunded')
GROUP BY s.region
ORDER BY ingreso_inflado_usd DESC;`,
        expectedOutput: [
          {
            region: 'Cono Sur',
            filas_tras_join: 5479,
            pedidos_reales: 5401,
            ingreso_inflado_usd: 1890327.21,
          },
          {
            region: 'Andina',
            filas_tras_join: 5514,
            pedidos_reales: 5400,
            ingreso_inflado_usd: 1798031.32,
          },
          {
            region: 'Iberia',
            filas_tras_join: 3124,
            pedidos_reales: 3085,
            ingreso_inflado_usd: 1248350.06,
          },
          {
            region: 'Norteamérica',
            filas_tras_join: 2353,
            pedidos_reales: 2314,
            ingreso_inflado_usd: 795772.22,
          },
        ],
      },
      {
        label: 'Paso 2: Conciliar el grano preagregando refunds por order_id antes del JOIN',
        explanation:
          'Preagregamos refunds al grano de order_id en la CTE reembolsos_por_pedido. Así conservamos exactamente los 16 200 pedidos reales y eliminamos los +74 534.52 USD de sobreestimación regional.',
        code: `WITH reembolsos_por_pedido AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS total_reembolsado_usd
  FROM refunds
  GROUP BY order_id
)
SELECT
  s.region,
  COUNT(o.order_id) AS pedidos_conciliados,
  ROUND(SUM(o.subtotal_usd - o.discount_usd), 2) AS venta_neta_previa_usd,
  ROUND(SUM(COALESCE(r.total_reembolsado_usd, 0)), 2) AS reembolsos_usd,
  ROUND(SUM(o.subtotal_usd - o.discount_usd - COALESCE(r.total_reembolsado_usd, 0)), 2) AS ingreso_neto_conciliado_usd
FROM orders o
JOIN stores s ON o.store_id = s.store_id
LEFT JOIN reembolsos_por_pedido r ON o.order_id = r.order_id
WHERE o.status IN ('completed', 'refunded')
GROUP BY s.region
ORDER BY ingreso_neto_conciliado_usd DESC;`,
        expectedOutput: [
          {
            region: 'Cono Sur',
            pedidos_conciliados: 5401,
            venta_neta_previa_usd: 1945238.75,
            reembolsos_usd: 77991.82,
            ingreso_neto_conciliado_usd: 1867246.93,
          },
          {
            region: 'Andina',
            pedidos_conciliados: 5400,
            venta_neta_previa_usd: 1879723.73,
            reembolsos_usd: 115379.23,
            ingreso_neto_conciliado_usd: 1764344.5,
          },
          {
            region: 'Iberia',
            pedidos_conciliados: 3085,
            venta_neta_previa_usd: 1278079.8,
            reembolsos_usd: 43170.94,
            ingreso_neto_conciliado_usd: 1234908.86,
          },
          {
            region: 'Norteamérica',
            pedidos_conciliados: 2314,
            venta_neta_previa_usd: 822882.1,
            reembolsos_usd: 37992.53,
            ingreso_neto_conciliado_usd: 784889.57,
          },
        ],
      },
    ],
  },
  checks: [
    {
      id: 'chk-x4-01-adr',
      type: 'mcq',
      prompt:
        'Según el formato de Registro de Decisión de Arquitectura (ADR) de Michael Nygard, ¿qué elemento distingue a un ADR profesional de una simple descripción de herramientas en un portafolio?',
      options: [
        {
          id: 'a',
          text: 'Un listado exhaustivo de todas las librerías de Python y extensiones instaladas en la máquina local.',
          correct: false,
          feedback:
            'Incorrecto. Listar paquetes instalados pertenece a los archivos de entorno, pero no explica por qué tomaste una decisión de diseño.',
        },
        {
          id: 'b',
          text: 'El contraste explícito entre alternativas viables bajo las restricciones del problema y las consecuencias o compensaciones (trade-offs) aceptadas al elegir una.',
          correct: true,
          feedback:
            'Correcto. Un evaluador técnico busca entender qué opciones descartaste, bajo qué restricciones cuantitativas decidiste y qué costo operativo o de cómputo aceptaste.',
        },
        {
          id: 'c',
          text: 'La afirmación de que la arquitectura elegida no tiene ninguna desventaja porque sigue las mejores prácticas universales.',
          correct: false,
          feedback:
            'Incorrecto. En ingeniería de datos y analítica toda decisión real implica una compensación entre latencia, costo, exactitud o simplicidad.',
        },
        {
          id: 'd',
          text: 'Capturas de pantalla del código fuente pegadas dentro de un documento externo sin control de versiones.',
          correct: false,
          feedback:
            'Incorrecto. Los ADRs se escriben en texto plano (Markdown) dentro del propio repositorio Git para evolucionar junto con el código.',
        },
      ],
      explanation:
        'Un ADR documenta el contexto técnico y de negocio, las opciones consideradas, la elección tomada y sus consecuencias positivas y negativas dentro del repositorio.',
    },
    {
      id: 'chk-x4-01-predict',
      type: 'predict-output',
      prompt:
        'En la consulta de auditoría de la Sección 1 sobre Mercado Brisa, ¿cuántos registros anómalos detecta exactamente la regla `COUNT(*) - COUNT(DISTINCT idempotency_key)` en la tabla `payments`?',
      options: [
        {
          id: 'a',
          text: '450 anomalías detectadas (19 200 filas crudas menos 18 750 claves de idempotencia únicas).',
          correct: true,
          feedback:
            'Correcto. La tabla payments contiene 19 200 filas totales, pero solo 18 750 idempotency_key distintas debido a 450 reintentos de webhook duplicados.',
        },
        {
          id: 'b',
          text: '1 200 anomalías detectadas (65 000 filas crudas menos 63 800 claves únicas).',
          correct: false,
          feedback:
            'Incorrecto. Esas cifras (65 000 filas crudas y 1 200 duplicados) corresponden a la tabla events de telemetría web, no a payments.',
        },
        {
          id: 'c',
          text: '0 anomalías detectadas, porque payment_id es único en las 19 200 filas.',
          correct: false,
          feedback:
            'Incorrecto. Aunque payment_id sea único por fila insertada, idempotency_key identifica la transacción lógica y revela los 450 cobros reenviados.',
        },
      ],
      explanation:
        'En Mercado Brisa, la tabla payments registra 19 200 filas para 18 750 claves de idempotencia únicas, lo que arroja exactamente 450 duplicados de webhook.',
    },
    {
      id: 'chk-x4-01-order',
      type: 'order',
      prompt:
        'Ordena la secuencia en que debe estructurarse el archivo `README.md` principal de un repositorio público de portafolio para superar la revisión de 90 segundos:',
      items: [
        'Enunciado del problema de negocio y resumen cuantificado del impacto o hallazgo principal.',
        'Diagrama de arquitectura, linaje de tablas y contratos de calidad de datos aplicados.',
        'Instrucciones de reproducibilidad determinista en un comando (entorno, semilla y ejecución de tests).',
        'Enlaces a los Registros de Decisión de Arquitectura (ADRs) y a las consultas detalladas.',
      ],
      correctOrder: [
        'Enunciado del problema de negocio y resumen cuantificado del impacto o hallazgo principal.',
        'Diagrama de arquitectura, linaje de tablas y contratos de calidad de datos aplicados.',
        'Instrucciones de reproducibilidad determinista en un comando (entorno, semilla y ejecución de tests).',
        'Enlaces a los Registros de Decisión de Arquitectura (ADRs) y a las consultas detalladas.',
      ],
      explanation:
        'Un README eficaz abre con el problema y el impacto medido, presenta la arquitectura y las pruebas de calidad, explica cómo reproducir todo en un comando y enlaza los ADRs.',
    },
  ],
  practice: {
    type: 'sql',
    title: 'Tabla de auditoría de margen neto conciliado por tipo de tienda para el README del portafolio',
    language: 'sql',
    prompt:
      'Construye la consulta maestra de reconciliación financiera por tipo de tienda (`stores.store_type`) sobre los pedidos con `status IN (\'completed\', \'refunded\')` para publicarla en tu portafolio. Debes: 1) preagregar en una CTE `lineas_limpias` las unidades (`SUM(oi.qty) AS unidades`), el ingreso de líneas (`SUM(oi.line_total_usd) AS ingreso_lineas_usd`) y el costo de productos (`SUM(oi.qty * p.unit_cost_usd) AS costo_lineas_usd`) por `order_id`, excluyendo cualquier producto con `p.list_price_usd <= 0`; 2) preagregar en otra CTE `reembolsos_pedido` el monto reembolsado (`SUM(refund_amount_usd) AS reembolso_usd`) por `order_id`; y 3) unir `orders`, `stores`, `lineas_limpias` y `reembolsos_pedido` para devolver `store_type`, `pedidos_auditados` (`COUNT(o.order_id)`), `unidades_totales` (`SUM(l.unidades)`), `ingreso_neto_usd` (`ROUND(SUM(l.ingreso_lineas_usd - COALESCE(r.reembolso_usd, 0)), 2)`) y `margen_neto_usd` (`ROUND(SUM(l.ingreso_lineas_usd - COALESCE(r.reembolso_usd, 0) - l.costo_lineas_usd), 2)`). Ordena por `margen_neto_usd DESC`.',
    starterCode: `-- Consulta inicial incompleta (sin preagregar por order_id ni descontar reembolsos):
SELECT
  s.store_type,
  COUNT(DISTINCT o.order_id) AS pedidos_auditados,
  SUM(oi.qty) AS unidades_totales,
  ROUND(SUM(oi.line_total_usd), 2) AS ingreso_neto_usd,
  ROUND(SUM(oi.line_total_usd - oi.qty * p.unit_cost_usd), 2) AS margen_neto_usd
FROM orders o
JOIN stores s ON o.store_id = s.store_id
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id
WHERE o.status IN ('completed', 'refunded')
GROUP BY s.store_type
ORDER BY margen_neto_usd DESC;`,
    expected: `WITH lineas_limpias AS (
  SELECT
    oi.order_id,
    SUM(oi.qty) AS unidades,
    SUM(oi.line_total_usd) AS ingreso_lineas_usd,
    SUM(oi.qty * p.unit_cost_usd) AS costo_lineas_usd
  FROM order_items oi
  JOIN products p ON oi.product_id = p.product_id
  WHERE p.list_price_usd > 0
  GROUP BY oi.order_id
),
reembolsos_pedido AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS reembolso_usd
  FROM refunds
  GROUP BY order_id
)
SELECT
  s.store_type,
  COUNT(o.order_id) AS pedidos_auditados,
  SUM(l.unidades) AS unidades_totales,
  ROUND(SUM(l.ingreso_lineas_usd - COALESCE(r.reembolso_usd, 0)), 2) AS ingreso_neto_usd,
  ROUND(SUM(l.ingreso_lineas_usd - COALESCE(r.reembolso_usd, 0) - l.costo_lineas_usd), 2) AS margen_neto_usd
FROM orders o
JOIN stores s ON o.store_id = s.store_id
JOIN lineas_limpias l ON o.order_id = l.order_id
LEFT JOIN reembolsos_pedido r ON o.order_id = r.order_id
WHERE o.status IN ('completed', 'refunded')
GROUP BY s.store_type
ORDER BY margen_neto_usd DESC;`,
    orderMatters: true,
    hints: [
      'Crea primero la CTE lineas_limpias agrupando order_items + products por oi.order_id con WHERE p.list_price_usd > 0 para calcular unidades, ingreso_lineas_usd y costo_lineas_usd al grano de pedido.',
      'Crea una segunda CTE reembolsos_pedido agrupando refunds por order_id para obtener SUM(refund_amount_usd) AS reembolso_usd sin multiplicar las filas de orders.',
      'En el SELECT final une orders o con stores s, JOIN lineas_limpias l ON o.order_id = l.order_id y LEFT JOIN reembolsos_pedido r ON o.order_id = r.order_id, filtrando WHERE o.status IN (\'completed\', \'refunded\').',
    ],
    solution: `WITH lineas_limpias AS (
  SELECT
    oi.order_id,
    SUM(oi.qty) AS unidades,
    SUM(oi.line_total_usd) AS ingreso_lineas_usd,
    SUM(oi.qty * p.unit_cost_usd) AS costo_lineas_usd
  FROM order_items oi
  JOIN products p ON oi.product_id = p.product_id
  WHERE p.list_price_usd > 0
  GROUP BY oi.order_id
),
reembolsos_pedido AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS reembolso_usd
  FROM refunds
  GROUP BY order_id
)
SELECT
  s.store_type,
  COUNT(o.order_id) AS pedidos_auditados,
  SUM(l.unidades) AS unidades_totales,
  ROUND(SUM(l.ingreso_lineas_usd - COALESCE(r.reembolso_usd, 0)), 2) AS ingreso_neto_usd,
  ROUND(SUM(l.ingreso_lineas_usd - COALESCE(r.reembolso_usd, 0) - l.costo_lineas_usd), 2) AS margen_neto_usd
FROM orders o
JOIN stores s ON o.store_id = s.store_id
JOIN lineas_limpias l ON o.order_id = l.order_id
LEFT JOIN reembolsos_pedido r ON o.order_id = r.order_id
WHERE o.status IN ('completed', 'refunded')
GROUP BY s.store_type
ORDER BY margen_neto_usd DESC;`,
    solutionExplanation:
      'Al preagregar tanto order_items (con el filtro de dominio p.list_price_usd > 0) como refunds al grano exacto de order_id antes de unir con orders y stores, evitamos el fan-out entre líneas y devoluciones y obtenemos el margen neto auditado por formato de tienda.',
    expectedOutputTable: [
      {
        store_type: 'retail',
        pedidos_auditados: 9229,
        unidades_totales: 43280,
        ingreso_neto_usd: 3202090.76,
        margen_neto_usd: 1468725.33,
      },
      {
        store_type: 'warehouse',
        pedidos_auditados: 2880,
        unidades_totales: 17336,
        ingreso_neto_usd: 1316421.31,
        margen_neto_usd: 623499.35,
      },
      {
        store_type: 'flagship',
        pedidos_auditados: 4091,
        unidades_totales: 17319,
        ingreso_neto_usd: 1198183.19,
        margen_neto_usd: 501849.2,
      },
    ],
  },
  roleNotes: {
    de: 'En un portafolio de Ingeniería de Datos, prioriza demostrar idempotencia en la ingesta (`payments` y `events`), contratos de esquema explícitos, modelado dimensional con SCD Tipo 2 (`customer_changes`) y ejecución automatizada mediante un script o Makefile con pruebas que devuelvan código de salida 0.',
    da: 'En un portafolio de Análisis de Datos, prioriza mostrar preguntas e hipótesis refutables antes de los gráficos, una tabla de atrición que cuantifique cada filtro aplicado y decisiones explícitas sobre por qué descartaste errores de captura (`SKU-TEST-NEG`) pero conservaste extremos legítimos de negocio.',
    bi: 'En un portafolio de Inteligencia de Negocio, prioriza publicar el diccionario de métricas con fórmula matemática y filtros de exclusión, la prueba SQL de reconciliación financiera sin multiplicación de filas y el vínculo entre cada vista del tablero y la decisión operativa que habilita.',
  },
  summary: [
    'Un repositorio de portafolio supera el filtro de 90 segundos con problema cuantificado, reproducibilidad en un comando y pruebas SQL.',
    'Adapta la evidencia al rol: pipelines idempotentes en DE, diario reproducible e hipótesis en DA, y árbol de métricas en BI.',
    'Los Registros de Decisión de Arquitectura (ADR) documentan el contexto, las alternativas evaluadas y las compensaciones técnicas asumidas.',
    'Preagregar detalle y reembolsos al grano de pedido antes del cruce evita publicar métricas infladas por multiplicación de filas.',
  ],
  flashcards: [
    {
      id: 'fc-x4-01-1',
      front: '¿Qué cinco secciones componen un Registro de Decisión de Arquitectura (ADR) según el formato de Michael Nygard?',
      back: '1) Título numerado, 2) Estado (propuesto, aceptado, reemplazado), 3) Contexto con restricciones reales, 4) Decisión adoptada y 5) Consecuencias (incluyendo las compensaciones o trade-offs aceptados).',
    },
    {
      id: 'fc-x4-01-2',
      front: '¿Por qué es un error unir directamente `orders`, `order_items` y `refunds` en una misma consulta sin preagregar?',
      back: 'Porque `order_items` y `refunds` tienen relación uno-a-muchos con `orders`; unirlas en bruto genera un producto cartesiano parcial por pedido (fan-out) que multiplica tanto las líneas como los reembolsos.',
    },
    {
      id: 'fc-x4-01-3',
      front: '¿Qué tres controles de calidad sobre Mercado Brisa demuestran en el `README.md` que auditaste las fuentes crudas?',
      back: '1) Los 450 webhooks duplicados en `payments` (`idempotency_key`), 2) los 1 200 eventos repetidos en `events` (`event_id`) y 3) el producto `SKU-TEST-NEG` con precio `-9.99 USD` en `products`.',
    },
    {
      id: 'fc-x4-01-4',
      front: '¿Qué significa que un repositorio de portafolio cumpla con reproducibilidad computacional?',
      back: 'Que cualquier evaluador puede clonar el repositorio y regenerar exactamente las mismas tablas, pruebas y métricas con un solo comando automatizado, sin rutas locales fijas ni pasos manuales.',
    },
  ],
  sources: [
    {
      title: 'Documenting Architecture Decisions',
      url: 'https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions',
      publisher: 'Cognitect (Michael Nygard)',
      accessed: '2026-10-29',
      supports: 'Estructura de los Registros de Decisión de Arquitectura (ADR) con contexto, decisión y consecuencias.',
    },
    {
      title: 'Ten Simple Rules for Reproducible Computational Research',
      url: 'https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1003285',
      publisher: 'PLOS Computational Biology (Sandve et al.)',
      accessed: '2026-10-29',
      supports: 'Reglas de trazabilidad computacional desde los datos crudos hasta las tablas y figuras finales.',
    },
    {
      title: 'Add data tests to your DAG',
      url: 'https://docs.getdbt.com/docs/build/data-tests',
      publisher: 'dbt Labs Documentation',
      accessed: '2026-10-29',
      supports: 'Diseño de pruebas automatizadas de unicidad, integridad y reconciliación en repositorios de datos.',
    },
    {
      title: 'About READMEs',
      url: 'https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes',
      publisher: 'GitHub Documentation',
      accessed: '2026-10-29',
      supports: 'Organización del archivo README.md como portada técnica y guía de reproducción de un repositorio público.',
    },
  ],
  aiNotes:
    'Al guiar al estudiante en esta lección, verifica que no intente sumar oi.line_total_usd y r.refund_amount_usd en un mismo JOIN sin agrupar antes por order_id. En la práctica SQL, recuerda que el starterCode omite el descuento de reembolsos de refunds (reembolsos_pedido), por lo que sus cifras de ingreso_neto_usd y margen_neto_usd están sobreestimadas respecto a la solución conciliada.',
};

export default lesson;
