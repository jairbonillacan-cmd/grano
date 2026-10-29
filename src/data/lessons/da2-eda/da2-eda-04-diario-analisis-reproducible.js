const lesson = {
  id: 'da2-eda-04-diario-analisis-reproducible',
  moduleId: 'da2-eda',
  tracks: ['da'],
  level: 2,
  order: 4,
  title: 'Diario de análisis reproducible: supuestos y descartes',
  subtitle: 'El diario de análisis reproducible: trazabilidad de supuestos, filtros y descartes',
  minutes: 20,
  prerequisites: ['da2-eda-03-outliers-errores-extremos'],
  contentVersion: 1,

  hook: 'Tres semanas después de presentar un estudio de ingresos, la dirección financiera te pide repetir el cálculo exacto para el cierre trimestral. Abres tu carpeta y encuentras tres archivos llamados `eda_final_v2.sql`, un cuaderno con celdas ejecutadas fuera de orden y una cifra de `6 423 516.34 USD` que nadie logra conciliar con tesorería porque olvidó descontar 369 webhooks duplicados. ¿Cómo estructuras tus consultas como un diario de análisis reproducible que deje rastro auditable de cada supuesto, filtro y descarte?',

  objectives: [
    'Construir tablas de atrición en SQL con CTEs secuenciales para auditar cuántas filas descarta cada filtro.',
    'Documentar supuestos de negocio, fechas de corte y reglas de deduplicación dentro del propio código analítico.',
    'Garantizar la ejecución determinista en consultas versionadas y cuadernos reactivos sin estado oculto.',
  ],

  sections: [
    {
      id: 'sec-anatomia-diario',
      heading: 'Por qué los filtros silenciosos destruyen la reproducibilidad',
      body: 'El enemigo principal de la reproducibilidad analítica no es un fallo del motor SQL, sino el filtro silencioso. Cuando un analista acumula cinco condiciones en un único `WHERE` (`status = \'completed\' AND is_active = true AND customer_id IS NOT NULL`), la consulta salta directamente de miles de filas crudas a un único número final.\n\nSi dos semanas después otro colega obtiene un importe distinto, resulta imposible saber en qué paso divergieron ambos cálculos. ¿Uno de los dos eliminó antes los duplicados de red? ¿Filtró las cuentas inactivas? ¿Incluyó pedidos reembolsados?\n\nUn **diario de análisis reproducible** convierte esas decisiones implícitas en código auditable. En lugar de esconder las reglas de limpieza en notas sueltas, cada transformación queda registrada en secuencia. Cada paso muestra qué condición exacta se aplicó, cuántas filas o dólares se descartaron y cómo cambió la métrica central tras el recorte.',
    },
    {
      id: 'sec-tabla-atricion-sql',
      heading: 'La tabla de atrición en SQL: trazabilidad paso a paso con CTEs',
      body: 'En epidemiología y analítica de producto, el instrumento estándar para documentar descartes se llama **tabla de atrición** (*attrition table*). En SQL se construye encadenando expresiones de tabla común (`WITH paso_0 AS (...), paso_1 AS (...), paso_2 AS (...)`). Cada CTE toma como entrada única la CTE inmediata anterior y aplica una sola regla.\n\nAl final de la consulta, una serie de bloques unidos con `UNION ALL` resume el estado de la muestra en cada etapa. Observa cómo opera sobre las `65 000` filas de `events` en Mercado Brisa:\n\n- **Paso 1 (`0_eventos_crudos`):** parte de los `65 000` registros y `33 267` sesiones tal como entraron.\n\n- **Paso 2 (`1_deduplicar_event_id`):** conserva una fila por `event_id`, reteniendo `63 800` eventos únicos (descarta `1 200` duplicados técnicos sin perder sesiones).\n\n- **Paso 3 (`2_excluir_anonimos_null`):** filtra `customer_id IS NOT NULL`, dejando `57 257` eventos autenticados.\n\n- **Paso 4 (`3_solo_clientes_activos`):** cruza con `customers` donde `is_active = true`, cerrando en `53 443` eventos y `32 070` sesiones.',
      example: {
        language: 'sql',
        code: `WITH paso_0 AS (
  SELECT event_id, session_id, customer_id, event_type
  FROM events
),
paso_1 AS (
  SELECT
    event_id,
    ANY_VALUE(session_id) AS session_id,
    ANY_VALUE(customer_id) AS customer_id
  FROM paso_0
  GROUP BY event_id
),
paso_2 AS (
  SELECT event_id, session_id, customer_id
  FROM paso_1
  WHERE customer_id IS NOT NULL
),
paso_3 AS (
  SELECT p.event_id, p.session_id, p.customer_id
  FROM paso_2 p
  JOIN customers c ON p.customer_id = c.customer_id
  WHERE c.is_active = true
)
SELECT 1 AS paso, '0_eventos_crudos' AS etapa, COUNT(*) AS eventos, COUNT(DISTINCT session_id) AS sesiones FROM paso_0
UNION ALL
SELECT 2, '1_deduplicar_event_id', COUNT(*), COUNT(DISTINCT session_id) FROM paso_1
UNION ALL
SELECT 3, '2_excluir_anonimos_null', COUNT(*), COUNT(DISTINCT session_id) FROM paso_2
UNION ALL
SELECT 4, '3_solo_clientes_activos', COUNT(*), COUNT(DISTINCT session_id) FROM paso_3
ORDER BY paso;`,
        expectedOutput: [
          { paso: 1, etapa: '0_eventos_crudos', eventos: 65000, sesiones: 33267 },
          { paso: 2, etapa: '1_deduplicar_event_id', eventos: 63800, sesiones: 33267 },
          { paso: 3, etapa: '2_excluir_anonimos_null', eventos: 57257, sesiones: 33267 },
          { paso: 4, etapa: '3_solo_clientes_activos', eventos: 53443, sesiones: 32070 },
        ],
      },
    },
    {
      id: 'sec-sensibilidad-supuestos',
      heading: 'Análisis de sensibilidad: cómo cambia la mediana según el filtro',
      body: 'Una tabla de atrición completa no solo cuenta filas (`COUNT(*)`). También monitorea el importe acumulado (`SUM`) y la métrica central (`MEDIAN`) en cada escalón. Esta práctica cumple una función de **análisis de sensibilidad**.\n\nCuando un paso elimina defectos técnicos puros —como deduplicar webhooks repetidos distribuidos al azar—, el conteo y la suma bajan pero la mediana permanece casi intacta. En cambio, cuando un paso aplica un **supuesto de negocio** —como restringir el estudio a clientes activos o a pedidos con cupón promocional—, la mediana puede desplazarse de forma notable.\n\nMostrar la mediana en cada fila de la tabla de atrición ofrece una ventaja inmediata. Cualquier lector distingue al instante si una caída o subida del ticket proviene del comportamiento de los clientes o del sesgo de selección introducido por el propio filtro.',
    },
    {
      id: 'sec-cuadernos-reactivos-versionado',
      heading: 'Del cuaderno con estado oculto al DAG reactivo y SQL versionado',
      body: 'Incluso la mejor consulta SQL pierde su trazabilidad si vive dentro de un cuaderno tradicional donde alguien ejecutó la celda 9, luego modificó la celda 3 y jamás reinició el entorno. Ese **estado oculto en memoria** explica por qué tantos análisis fallan al intentar correrlos de arriba abajo desde cero.\n\nLa ingeniería analítica moderna resuelve este problema con dos prácticas complementarias:\n\n1. **Cuadernos reactivos basados en un DAG (*Directed Acyclic Graph*) como Marimo:** a diferencia de los archivos `.ipynb` en JSON con salidas guardadas, Marimo almacena el cuaderno como un script `.py` limpio en Git. Si cambias un filtro en una celda superior, todas las celdas dependientes se recalculan en orden determinista.\n\n2. **Consultas exploratorias versionadas (`analyses/` en dbt):** permite guardar las consultas de diagnóstico y sus tablas de atrición dentro del repositorio Git del proyecto. Así se compilan contra el esquema oficial sin crear tablas huérfanas en producción.',
    },
  ],

  workedExample: {
    title: 'Conciliación de pagos capturados con tabla de atrición en 4 pasos',
    description:
      'Finanzas pide conciliar los pagos capturados (payments.status = \'captured\') de pedidos completados (orders.status = \'completed\'). Compara la consulta opaca que arroja 6 423 516.34 USD contra la tabla de atrición reproducible que llega a los 6 269 462.42 USD reales.',
    steps: [
      {
        label: 'Paso 1: Reproducir la consulta opaca que omite deduplicar idempotency_key',
        explanation:
          'Al saltar directo al filtro final sin perfilar ni mostrar etapas intermedias, la consulta incluye 369 webhooks duplicados de pagos capturados e infla el ingreso conciliado en `154 053.92 USD`.',
        code: `SELECT
  COUNT(*) AS pagos_finales,
  ROUND(SUM(p.amount_usd), 2) AS importe_final_usd,
  ROUND(MEDIAN(p.amount_usd), 2) AS mediana_final_usd
FROM payments p
JOIN orders o ON p.order_id = o.order_id
WHERE p.status = 'captured'
  AND o.status = 'completed';`,
        expectedOutput: [
          {
            pagos_finales: 15129,
            importe_final_usd: 6423516.34,
            mediana_final_usd: 348.17,
          },
        ],
      },
      {
        label: 'Paso 2: Construir la tabla de atrición en 4 etapas separando deduplicación y negocio',
        explanation:
          'La tabla de atrición documenta todo el recorrido: el paso 2 elimina 450 webhooks duplicados por `idempotency_key` (`188 563.84 USD` repetidos) sin mover la mediana (`350.37 USD`); el paso 3 descarta 2 550 pagos fallidos o pendientes; y el paso 4 descarta 1 440 pagos cuyos pedidos fueron reembolsados, cerrando en `14 760` pagos y `6 269 462.42 USD`.',
        code: `WITH paso_0 AS (
  SELECT payment_id, idempotency_key, order_id, status, amount_usd
  FROM payments
),
paso_1 AS (
  SELECT
    idempotency_key,
    MIN(payment_id) AS payment_id,
    ANY_VALUE(order_id) AS order_id,
    ANY_VALUE(status) AS status,
    ANY_VALUE(amount_usd) AS amount_usd
  FROM paso_0
  GROUP BY idempotency_key
),
paso_2 AS (
  SELECT payment_id, order_id, amount_usd
  FROM paso_1
  WHERE status = 'captured'
),
paso_3 AS (
  SELECT p.payment_id, p.order_id, p.amount_usd
  FROM paso_2 p
  JOIN orders o ON p.order_id = o.order_id
  WHERE o.status = 'completed'
)
SELECT 1 AS paso, '0_crudo_payments' AS etapa, COUNT(*) AS filas, ROUND(SUM(amount_usd), 2) AS importe_usd, ROUND(MEDIAN(amount_usd), 2) AS mediana_usd FROM paso_0
UNION ALL
SELECT 2, '1_sin_webhooks_duplicados', COUNT(*), ROUND(SUM(amount_usd), 2), ROUND(MEDIAN(amount_usd), 2) FROM paso_1
UNION ALL
SELECT 3, '2_solo_pagos_captured', COUNT(*), ROUND(SUM(amount_usd), 2), ROUND(MEDIAN(amount_usd), 2) FROM paso_2
UNION ALL
SELECT 4, '3_cruce_pedidos_completed', COUNT(*), ROUND(SUM(amount_usd), 2), ROUND(MEDIAN(amount_usd), 2) FROM paso_3
ORDER BY paso;`,
        expectedOutput: [
          {
            paso: 1,
            etapa: '0_crudo_payments',
            filas: 19200,
            importe_usd: 8178100.18,
            mediana_usd: 350.37,
          },
          {
            paso: 2,
            etapa: '1_sin_webhooks_duplicados',
            filas: 18750,
            importe_usd: 7989536.34,
            mediana_usd: 350.37,
          },
          {
            paso: 3,
            etapa: '2_solo_pagos_captured',
            filas: 16200,
            importe_usd: 6874488,
            mediana_usd: 347.07,
          },
          {
            paso: 4,
            etapa: '3_cruce_pedidos_completed',
            filas: 14760,
            importe_usd: 6269462.42,
            mediana_usd: 348.28,
          },
        ],
      },
    ],
  },

  checks: [
    {
      id: 'chk-da2-eda-04-proposito',
      type: 'mcq',
      prompt:
        '¿Cuál es la ventaja principal de estructurar un análisis mediante una tabla de atrición con CTEs encadenadas frente a escribir un único `WHERE` con múltiples condiciones?',
      options: [
        {
          id: 'a',
          text: 'Hace que DuckDB ignore las restricciones de tipos de datos en las columnas numéricas.',
          correct: false,
          feedback:
            'Incorrecto. Las CTEs respetan exactamente los mismos tipos de datos que cualquier consulta SQL.',
        },
        {
          id: 'b',
          text: 'Permite auditar cuántas filas, cuánto importe y qué cambio en la mediana produce cada regla de limpieza o recorte de negocio por separado.',
          correct: true,
          feedback:
            'Exacto. Encadenar una regla por etapa expone el efecto individual de cada filtro sobre el volumen y sobre la métrica central.',
        },
        {
          id: 'c',
          text: 'Oculta al equipo de negocio los registros que fueron descartados durante la exploración.',
          correct: false,
          feedback:
            'Incorrecto. El propósito de una tabla de atrición es hacer explícitos y visibles todos los descartes.',
        },
      ],
      explanation:
        'Encadenar una regla por CTE y resumir con UNION ALL expone el impacto exacto de cada descarte, separando la limpieza técnica (duplicados) de los supuestos de alcance (clientes activos o descuentos).',
    },
    {
      id: 'chk-da2-eda-04-webhooks',
      type: 'predict-output',
      prompt:
        'En el ejemplo guiado sobre `payments`, al pasar de `0_crudo_payments` (`19 200` filas) a `1_sin_webhooks_duplicados` (`18 750` filas), el importe total baja en `188 563.84 USD`, pero la mediana permanece exactamente en `350.37 USD`. ¿Qué indica esto?',
      options: [
        {
          id: 'a',
          text: 'Que la función MEDIAN no funciona sobre tablas agrupadas por payment_id.',
          correct: false,
          feedback:
            'Incorrecto. MEDIAN recalcula el percentil 50 sobre las 18 750 filas deduplicadas sin ningún impedimento.',
        },
        {
          id: 'b',
          text: 'Que los 450 webhooks duplicados se distribuían sin sesgo sistemático de monto, por lo que deduplicar corrige la suma inflada sin desplazar el centro de la distribución.',
          correct: true,
          feedback:
            'Correcto. Al ser reintentos técnicos de red independientes del monto, quitarlos sanea la suma total dejando intacta la mediana.',
        },
        {
          id: 'c',
          text: 'Que los 450 pagos eliminados tenían un importe igual a cero dólares.',
          correct: false,
          feedback:
            'Incorrecto. Esos 450 registros sumaban 188 563.84 USD repetidos.',
        },
      ],
      explanation:
        'Como los reintentos de webhook ocurren por latencia técnica de red sin depender del monto del pedido, retirarlos resta los 188 563.84 USD duplicados pero deja intacto el punto medio de la distribución (350.37 USD).',
    },
    {
      id: 'chk-da2-eda-04-fill-cte',
      type: 'fill-code',
      prompt:
        'En una tabla de atrición acumulativa donde `paso_1` ya filtró `status = \'completed\'`, completa `paso_2` para que los descartes sean secuenciales al cruzar con `customers`:',
      template: `paso_2 AS (
  SELECT p.order_id, p.customer_id, p.total_usd
  FROM {{b1}} p
  JOIN customers c ON p.customer_id = c.customer_id
  WHERE c.is_active = {{b2}}
)`,
      blanks: [
        { id: 'b1', accepted: ['paso_1'] },
        { id: 'b2', accepted: ['true', 'TRUE'] },
      ],
      explanation:
        'Para que una tabla de atrición sea estrictamente acumulativa, cada etapa (`paso_2`) debe leer desde la CTE inmediata anterior (`FROM paso_1`) y aplicar su condición adicional (`c.is_active = true`).',
    },
    {
      id: 'chk-da2-eda-04-marimo',
      type: 'mcq',
      prompt:
        '¿Por qué los cuadernos reactivos basados en un DAG (como Marimo) evitan el problema de irreproducibilidad típico de los cuadernos tradicionales?',
      options: [
        {
          id: 'a',
          text: 'Porque prohíben escribir consultas SQL y solo aceptan gráficos estáticos.',
          correct: false,
          feedback:
            'Incorrecto. Marimo integra celdas nativas de SQL sobre DuckDB y DataFrames de Polars.',
        },
        {
          id: 'b',
          text: 'Porque almacenan el código como texto plano .py e impiden el estado oculto recalculando en orden determinista todas las celdas que dependen de una variable modificada.',
          correct: true,
          feedback:
            'Exacto. El grafo acíclico dirigido (DAG) garantiza que el estado en memoria coincida siempre con el código visible.',
        },
        {
          id: 'c',
          text: 'Porque borran automáticamente cualquier fila que contenga valores atípicos.',
          correct: false,
          feedback:
            'Incorrecto. El entorno de ejecución no altera ni filtra datos por su cuenta.',
        },
      ],
      explanation:
        'Al modelar las dependencias entre celdas como un grafo acíclico dirigido (DAG), cualquier cambio en un parámetro o filtro propaga la actualización a las celdas descendientes sin dejar variables obsoletas en memoria.',
    },
  ],

  practice: {
    type: 'sql',
    title: 'Tabla de atrición en 4 etapas para la cohorte de pedidos con descuento',
    language: 'sql',
    prompt:
      'Construye una tabla de atrición reproducible en 4 etapas sobre `orders` y `customers` para auditar cómo cambia la muestra y la mediana del ticket cuando el equipo de marketing restringe su análisis a pedidos promocionales de clientes activos. Encadena cuatro CTEs acumulativas: `paso_0` (todas las filas de `orders`), `paso_1` (filtra `paso_0` con `status = \'completed\'`), `paso_2` (une `paso_1` con `customers` filtrando `c.is_active = true`) y `paso_3` (filtra `paso_2` con `discount_usd > 0`). Devuelve con `UNION ALL` las columnas `paso` (`1` a `4`), `etapa` (`\'0_pedidos_crudos\'`, `\'1_estado_completed\'`, `\'2_clientes_activos\'`, `\'3_con_descuento_aplicado\'`), `pedidos_restantes` (`COUNT(*)`), `importe_total_usd` (`ROUND(SUM(total_usd), 2)`) y `mediana_usd` (`ROUND(MEDIAN(total_usd), 2)`). Ordena por `paso ASC`.',
    starterCode: `WITH paso_0 AS (
  SELECT order_id, customer_id, status, discount_usd, total_usd
  FROM orders
),
paso_1 AS (
  SELECT order_id, customer_id, discount_usd, total_usd
  FROM paso_0
  WHERE status = 'completed'
)
-- Define paso_2 (clientes con c.is_active = true) y paso_3 (discount_usd > 0)
SELECT
  1 AS paso,
  '0_pedidos_crudos' AS etapa,
  COUNT(*) AS pedidos_restantes,
  ROUND(SUM(total_usd), 2) AS importe_total_usd,
  ROUND(MEDIAN(total_usd), 2) AS mediana_usd
FROM paso_0
-- Une con UNION ALL las etapas 2, 3 y 4 y ordena por paso ASC;`,
    expected: `WITH paso_0 AS (
  SELECT order_id, customer_id, status, discount_usd, total_usd
  FROM orders
),
paso_1 AS (
  SELECT order_id, customer_id, discount_usd, total_usd
  FROM paso_0
  WHERE status = 'completed'
),
paso_2 AS (
  SELECT p.order_id, p.customer_id, p.discount_usd, p.total_usd
  FROM paso_1 p
  JOIN customers c ON p.customer_id = c.customer_id
  WHERE c.is_active = true
),
paso_3 AS (
  SELECT order_id, customer_id, discount_usd, total_usd
  FROM paso_2
  WHERE discount_usd > 0
)
SELECT 1 AS paso, '0_pedidos_crudos' AS etapa, COUNT(*) AS pedidos_restantes, ROUND(SUM(total_usd), 2) AS importe_total_usd, ROUND(MEDIAN(total_usd), 2) AS mediana_usd FROM paso_0
UNION ALL
SELECT 2, '1_estado_completed', COUNT(*), ROUND(SUM(total_usd), 2), ROUND(MEDIAN(total_usd), 2) FROM paso_1
UNION ALL
SELECT 3, '2_clientes_activos', COUNT(*), ROUND(SUM(total_usd), 2), ROUND(MEDIAN(total_usd), 2) FROM paso_2
UNION ALL
SELECT 4, '3_con_descuento_aplicado', COUNT(*), ROUND(SUM(total_usd), 2), ROUND(MEDIAN(total_usd), 2) FROM paso_3
ORDER BY paso ASC;`,
    orderMatters: true,
    hints: [
      'Asegúrate de que paso_2 consulte desde paso_1 haciendo JOIN con customers c ON p.customer_id = c.customer_id WHERE c.is_active = true.',
      'Define paso_3 seleccionando desde paso_2 con la condición WHERE discount_usd > 0.',
      'Une los 4 bloques con UNION ALL respetando los nombres exactos de etapa (\'0_pedidos_crudos\', \'1_estado_completed\', \'2_clientes_activos\', \'3_con_descuento_aplicado\') y cierra con ORDER BY paso ASC.',
    ],
    solution: `WITH paso_0 AS (
  SELECT order_id, customer_id, status, discount_usd, total_usd
  FROM orders
),
paso_1 AS (
  SELECT order_id, customer_id, discount_usd, total_usd
  FROM paso_0
  WHERE status = 'completed'
),
paso_2 AS (
  SELECT p.order_id, p.customer_id, p.discount_usd, p.total_usd
  FROM paso_1 p
  JOIN customers c ON p.customer_id = c.customer_id
  WHERE c.is_active = true
),
paso_3 AS (
  SELECT order_id, customer_id, discount_usd, total_usd
  FROM paso_2
  WHERE discount_usd > 0
)
SELECT 1 AS paso, '0_pedidos_crudos' AS etapa, COUNT(*) AS pedidos_restantes, ROUND(SUM(total_usd), 2) AS importe_total_usd, ROUND(MEDIAN(total_usd), 2) AS mediana_usd FROM paso_0
UNION ALL
SELECT 2, '1_estado_completed', COUNT(*), ROUND(SUM(total_usd), 2), ROUND(MEDIAN(total_usd), 2) FROM paso_1
UNION ALL
SELECT 3, '2_clientes_activos', COUNT(*), ROUND(SUM(total_usd), 2), ROUND(MEDIAN(total_usd), 2) FROM paso_2
UNION ALL
SELECT 4, '3_con_descuento_aplicado', COUNT(*), ROUND(SUM(total_usd), 2), ROUND(MEDIAN(total_usd), 2) FROM paso_3
ORDER BY paso ASC;`,
    solutionExplanation:
      'La tabla de atrición muestra que la mediana apenas varía entre los pasos 1, 2 y 3 (`350.16 USD` → `348.28 USD` → `350.96 USD`), pero desciende a `324.43 USD` en el paso 4 (`3 047` pedidos) al restringir la muestra a pedidos con descuento.',
    expectedOutputTable: [
      {
        paso: 1,
        etapa: '0_pedidos_crudos',
        pedidos_restantes: 18000,
        importe_total_usd: 7669817.77,
        mediana_usd: 350.16,
      },
      {
        paso: 2,
        etapa: '1_estado_completed',
        pedidos_restantes: 14760,
        importe_total_usd: 6269462.42,
        mediana_usd: 348.28,
      },
      {
        paso: 3,
        etapa: '2_clientes_activos',
        pedidos_restantes: 13786,
        importe_total_usd: 5875124.87,
        mediana_usd: 350.96,
      },
      {
        paso: 4,
        etapa: '3_con_descuento_aplicado',
        pedidos_restantes: 3047,
        importe_total_usd: 1230223.63,
        mediana_usd: 324.43,
      },
    ],
  },

  roleNotes: {
    da: 'Como analista de datos, adjunta siempre la tabla de atrición al principio de cada informe o entrega exploratoria. Mostrar cómo se pasa de `18 000` pedidos crudos a `3 047` pedidos promocionales evita discusiones estériles en las reuniones de dirección.',
    de: 'Para ingeniería de datos, las CTEs de atrición redactadas por los analistas sirven como especificación exacta para promover una consulta exploratoria (por ejemplo, desde `analyses/` en dbt) hacia un modelo intermedio o tabla agregada gobernada.',
    bi: 'En inteligencia de negocios, cuando un tablero aplique recortes por defecto (como mostrar solo clientes activos y pedidos completados), documenta esos filtros en una nota visible del reporte junto con el porcentaje del universo total que representan.',
  },

  summary: [
    'Los filtros silenciosos que apilan múltiples condiciones en un solo `WHERE` impiden conciliar cifras y ocultan sesgos de selección.',
    'Una tabla de atrición encadena CTEs secuenciales donde cada etapa aplica una regla y registra con `UNION ALL` las filas restantes.',
    'Incluir la mediana en cada escalón permite separar el efecto de limpiezas técnicas frente al desplazamiento causado por recortes de negocio.',
    'El uso de consultas SQL versionadas en Git y cuadernos reactivos basados en un DAG elimina el estado oculto en memoria.',
  ],

  flashcards: [
    {
      id: 'fc-da2-eda-04-01',
      front: '¿Qué es una tabla de atrición en el análisis exploratorio de datos?',
      back: 'Es una consulta secuencial (construida con CTEs encadenadas y UNION ALL) que registra cuántas filas, entidades e importe permanecen y cuántos se descartan tras cada filtro aplicado desde la tabla cruda.',
    },
    {
      id: 'fc-da2-eda-04-02',
      front: '¿Por qué cada CTE de una tabla de atrición debe consultar únicamente a la CTE inmediata anterior?',
      back: 'Para garantizar que los recortes sean estrictamente acumulativos y que la diferencia entre el paso k y el paso k-1 mida el efecto aislado de una sola regla.',
    },
    {
      id: 'fc-da2-eda-04-03',
      front: 'En Mercado Brisa, ¿cuánto dinero inflaba la conciliación de pagos al omitir el paso de deduplicación de webhooks en payments?',
      back: 'Inflaba el resultado en 154 053.92 USD (369 pagos duplicados en estado captured asociados a pedidos completados: 6 423 516.34 USD frente a los 6 269 462.42 USD reales).',
    },
    {
      id: 'fc-da2-eda-04-04',
      front: '¿Qué problema técnico de los cuadernos tradicionales resuelve un cuaderno reactivo basado en un DAG como Marimo?',
      back: 'Elimina el estado oculto de celdas ejecutadas fuera de orden al almacenar el cuaderno como script .py puro y recalcular automáticamente en orden determinista todas las celdas dependientes.',
    },
  ],

  glossaryTerms: [
    'tabla-atricion-descartes',
    'perfilado-datos',
    'idempotencia-duplicados',
    'validacion-bloqueante-wap',
  ],

  sources: [
    {
      title: 'DuckDB Documentation — Common Table Expressions (WITH Clause)',
      url: 'https://duckdb.org/docs/sql/query_syntax/with.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports:
        'Encadenamiento modular de transformaciones secuenciales mediante CTEs para auditoría de descartes.',
    },
    {
      title: 'Marimo Official Documentation — Reactive Python Notebooks',
      url: 'https://docs.marimo.io/',
      publisher: 'Marimo Team',
      accessed: '2026-10-29',
      supports:
        'Ejecución determinista basada en un grafo acíclico dirigido (DAG) almacenado como código Python puro.',
    },
    {
      title: 'dbt Labs Documentation — Analyses',
      url: 'https://docs.getdbt.com/docs/build/analyses',
      publisher: 'dbt Labs',
      accessed: '2026-10-29',
      supports:
        'Versionado de consultas SQL exploratorias dentro del repositorio analítico sin materializar artefactos huérfanos.',
    },
    {
      title: 'R for Data Science (2nd Edition) — Exploratory Data Analysis & Workflow',
      url: 'https://r4ds.hadley.nz/EDA.html',
      publisher: "O'Reilly Media",
      accessed: '2026-10-29',
      supports:
        'Trazabilidad de supuestos, filtros y decisiones de limpieza para garantizar análisis reproducibles.',
    },
  ],

  aiNotes:
    'Guía al estudiante para que encadene cada CTE a partir de la anterior (`paso_1` lee de `paso_0`, `paso_2` lee de `paso_1`, `paso_3` lee de `paso_2`). En la práctica, hazle notar cómo la mediana casi no cambia entre los pasos 1, 2 y 3 (`350.16 USD` → `348.28 USD` → `350.96 USD`), pero cae a `324.43 USD` en el paso 4 al filtrar `discount_usd > 0`.',
};

export default lesson;
