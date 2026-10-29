// Lección migrada de l3-asof-lateral-ctes y editada en Fase 3 (esquema v2, SQL real sobre Mercado Brisa)
const lesson = {
  id: 'c2-sql-analitico-02-asof-lateral-ctes',
  moduleId: 'c2-sql-analitico',
  tracks: ['core'],
  level: 2,
  order: 2,
  title: 'Cruces temporales con ASOF JOIN y CTEs modulares',
  minutes: 30,
  prerequisites: ['c2-sql-analitico-01-window-functions'],
  contentVersion: 2,

  hook: 'En Mercado Brisa (empresa ficticia), el pedido `order_id = 10001` se confirma a las `18:18:49`, mientras que los eventos web del cliente en `events` ocurrieron a las `16:40:12`, `17:28:43` y al día siguiente. Si haces un `INNER JOIN` buscando igualdad exacta de marcas temporales, pierdes el pedido; si unes con la desigualdad `o.order_ts >= e.event_ts`, multiplicas los primeros 5 pedidos en 75 filas e inflas su importe de $1,311.59 a $23,327.99 USD. ¿Cómo asignas a cada compra únicamente el evento previo más reciente sin provocar fan-out?',

  objectives: [
    'Emparejar eventos de distinta frecuencia temporal mediante ASOF JOIN y ASOF LEFT JOIN conservando el grano de la tabla izquierda.',
    'Utilizar LEFT JOIN LATERAL con ORDER BY y LIMIT para recuperar los N registros previos por entidad en motores sin ASOF nativo.',
    'Estructurar consultas analíticas en cuatro capas de CTEs: acotación, limpieza, cruce punto en el tiempo y proyección final.'
  ],

  sections: [
    {
      id: 'exactitud-punto-en-el-tiempo-point-in-time-corre',
      heading: 'Exactitud punto en el tiempo: fallo del JOIN igual y desigual',
      body: 'En los sistemas transaccionales, cada tabla registra su propio reloj. Un pedido en `orders` ocurre a las `18:18:49`, la navegación web en `events` quedó grabada a las `17:28:43` y el nivel de fidelidad del cliente en `customer_changes` cambió semanas atrás.\n\nIntentar cruzar estas tablas con un `JOIN` de igualdad (`o.order_ts = e.event_ts`) devuelve cero filas porque los relojes no coinciden al segundo. Por otro lado, escribir una unión con desigualdad abierta (`ON o.customer_id = e.customer_id AND o.order_ts >= e.event_ts`) empareja cada pedido con todos los eventos pasados de ese cliente.\n\nEn Mercado Brisa, los pedidos `10001` a `10005` suman `$1,311.59` USD. Como esos 5 clientes acumulan entre 5 y 25 eventos previos cada uno, el `JOIN` con `>=` genera 75 filas e infla `SUM(o.total_usd)` a `$23,327.99` USD. Y si inviertes el signo por error (`<=`), asignas eventos del futuro a compras del pasado, introduciendo **fuga de datos futuros** (*data leakage*).',
      interactive: {
        component: 'asof-join-timeline',
        caption: 'Simulador interactivo: observa cómo ASOF JOIN selecciona únicamente la marca temporal previa más cercana sin duplicar filas ni tomar datos futuros.'
      },
      example: {
        language: 'sql',
        code: 'SELECT\n  o.order_id,\n  o.customer_id,\n  COUNT(e.event_id) AS eventos_previos_emparejados,\n  ROUND(o.total_usd, 2) AS total_real_usd,\n  ROUND(SUM(o.total_usd), 2) AS total_inflado_usd\nFROM orders o\nINNER JOIN events e\n  ON o.customer_id = e.customer_id\n AND o.order_ts >= e.event_ts\nWHERE o.order_id BETWEEN 10001 AND 10005\nGROUP BY o.order_id, o.customer_id, o.total_usd\nORDER BY o.order_id;',
        expectedOutput: [
          { order_id: 10001, customer_id: 1, eventos_previos_emparejados: 19, total_real_usd: 39.14, total_inflado_usd: 743.66 },
          { order_id: 10002, customer_id: 14, eventos_previos_emparejados: 9, total_real_usd: 53.07, total_inflado_usd: 477.63 },
          { order_id: 10003, customer_id: 27, eventos_previos_emparejados: 25, total_real_usd: 479.16, total_inflado_usd: 11979 },
          { order_id: 10004, customer_id: 40, eventos_previos_emparejados: 17, total_real_usd: 535.55, total_inflado_usd: 9104.35 },
          { order_id: 10005, customer_id: 53, eventos_previos_emparejados: 5, total_real_usd: 204.67, total_inflado_usd: 1023.35 }
        ]
      }
    },
    {
      id: 'asof-join-para-emparejar-series-temporales',
      heading: 'ASOF JOIN: emparejar la observación previa más cercana en relación 1:1',
      body: 'Para resolver cruces punto en el tiempo sin multiplicar filas, motores como DuckDB, Snowflake, ClickHouse y Databricks implementan el operador nativo **ASOF JOIN**. Su regla es determinista: para cada fila de la tabla izquierda (`orders`), busca en la tabla derecha (`events`), dentro de la misma clave de igualdad (`customer_id`), la única fila cuya marca temporal sea la más próxima que cumpla la desigualdad (`o.order_ts >= e.event_ts`).\n\nSi usas `ASOF LEFT JOIN`, los pedidos de clientes que no tengan ningún evento previo se conservan en el resultado con `NULL` en las columnas de la derecha.De esta forma garantizas dos invariantes a la vez: la tabla de salida mantiene exactamente el mismo número de filas que la tabla izquierda (cardinalidad `1:1`) y ningún evento posterior al segundo de la compra contamina el análisis.',
      example: {
        language: 'sql',
        code: 'WITH orders_scoped AS (\n  SELECT order_id, customer_id, order_ts, total_usd\n  FROM orders\n  WHERE order_id BETWEEN 10001 AND 10005\n),\nevents_clean AS (\n  SELECT customer_id, event_ts, event_type, COALESCE(campaign_id, \'ORGANIC_DIRECT\') AS campaign\n  FROM events\n  WHERE customer_id IS NOT NULL\n)\nSELECT\n  o.order_id,\n  o.customer_id,\n  CAST(o.order_ts AS VARCHAR) AS order_ts,\n  CAST(e.event_ts AS VARCHAR) AS matched_event_ts,\n  e.event_type AS last_touch_type,\n  e.campaign AS attributed_campaign,\n  o.total_usd\nFROM orders_scoped o\nASOF LEFT JOIN events_clean e\n  ON o.customer_id = e.customer_id\n AND o.order_ts >= e.event_ts\nORDER BY o.order_id;',
        expectedOutput: [
          { order_id: 10001, customer_id: 1, order_ts: '2024-12-01 18:18:49', matched_event_ts: '2024-12-01 17:28:43', last_touch_type: 'checkout_completed', attributed_campaign: 'CMP-VERANO', total_usd: 39.14 },
          { order_id: 10002, customer_id: 14, order_ts: '2023-12-20 01:46:00', matched_event_ts: '2023-12-20 00:23:34', last_touch_type: 'checkout_started', attributed_campaign: 'CMP-ORIGEN', total_usd: 53.07 },
          { order_id: 10003, customer_id: 27, order_ts: '2025-11-08 16:52:16', matched_event_ts: '2025-11-08 15:37:59', last_touch_type: 'add_to_cart', attributed_campaign: 'CMP-BARISTA', total_usd: 479.16 },
          { order_id: 10004, customer_id: 40, order_ts: '2025-03-03 22:47:27', matched_event_ts: '2025-03-03 22:06:33', last_touch_type: 'checkout_completed', attributed_campaign: 'CMP-RETENCION', total_usd: 535.55 },
          { order_id: 10005, customer_id: 53, order_ts: '2024-03-26 21:01:10', matched_event_ts: '2024-03-26 19:51:29', last_touch_type: 'checkout_started', attributed_campaign: 'ORGANIC_DIRECT', total_usd: 204.67 }
        ]
      }
    },
    {
      id: 'lateral-join-para-subconsultas-correlacionadas-p',
      heading: 'LEFT JOIN LATERAL: recuperar los N eventos previos por fila',
      body: '¿Qué ocurre si necesitas recuperar los **3 últimos eventos** previos a cada compra en lugar de uno solo, o si trabajas en PostgreSQL 17 donde no existe la palabra clave `ASOF`? En SQL estándar, una subconsulta en el `FROM` no puede leer columnas de la tabla que tiene a su izquierda, salvo que antepongas la palabra **LATERAL**.\n\nUn `LEFT JOIN LATERAL (SELECT ... WHERE c.customer_id = o.customer_id AND c.valid_from <= o.order_ts ORDER BY c.valid_from DESC LIMIT 1) cc ON TRUE` evalúa la subconsulta interna para cada fila de `orders`. Al ordenar de forma descendente por fecha y aplicar `LIMIT 1`, obtiene exactamente el estado histórico vigente en el segundo del pedido.\n\nEn Mercado Brisa, cruzar `orders` con `customer_changes` mediante `LEFT JOIN LATERAL` permite saber qué nivel de fidelidad (`tier`: bronce, plata, oro o platino) tenía cada cliente en el instante exacto de su compra.',
      example: {
        language: 'sql',
        code: 'SELECT\n  o.order_id,\n  o.customer_id,\n  CAST(o.order_ts AS VARCHAR) AS order_ts,\n  cc.tier AS tier_en_compra,\n  CAST(cc.valid_from AS VARCHAR) AS vigente_desde\nFROM orders o\nLEFT JOIN LATERAL (\n  SELECT tier, valid_from\n  FROM customer_changes c\n  WHERE c.customer_id = o.customer_id\n    AND c.valid_from <= o.order_ts\n  ORDER BY c.valid_from DESC\n  LIMIT 1\n) cc ON TRUE\nWHERE o.order_id BETWEEN 10001 AND 10005\nORDER BY o.order_id;',
        expectedOutput: [
          { order_id: 10001, customer_id: 1, order_ts: '2024-12-01 18:18:49', tier_en_compra: 'platino', vigente_desde: '2023-12-02 08:00:00' },
          { order_id: 10002, customer_id: 14, order_ts: '2023-12-20 01:46:00', tier_en_compra: 'plata', vigente_desde: '2023-09-05 08:00:00' },
          { order_id: 10003, customer_id: 27, order_ts: '2025-11-08 16:52:16', tier_en_compra: 'platino', vigente_desde: '2024-12-14 08:00:00' },
          { order_id: 10004, customer_id: 40, order_ts: '2025-03-03 22:47:27', tier_en_compra: 'oro', vigente_desde: '2024-05-25 08:00:00' },
          { order_id: 10005, customer_id: 53, order_ts: '2024-03-26 21:01:10', tier_en_compra: 'plata', vigente_desde: '2024-02-27 08:00:00' }
        ]
      }
    },
    {
      id: 'ctes-modulares-importacion-limpieza-preparacion-',
      heading: 'Arquitectura de CTEs modulares en cuatro capas temporales',
      body: 'Combinar deduplicación de ventanas, filtros de sesiones nulas y uniones temporales dentro de un solo bloque `SELECT` produce consultas frágiles. Si un `ASOF JOIN` recibe en la tabla derecha dos eventos con la misma marca temporal exacta o claves `NULL`, el emparejamiento deja de ser determinista.\n\nPor eso conviene organizar toda consulta analítica compleja en cuatro etapas de CTEs:\n1. **CTEs de acotación (*scoped*):** seleccionan únicamente las columnas y el rango de fechas necesario de cada tabla origen.\n2. **CTEs de limpieza (*clean*):** descartan claves nulas (`WHERE customer_id IS NOT NULL`), normalizan marcas temporales a UTC y deduplican empates con `QUALIFY ROW_NUMBER() = 1`.\n3. **CTEs de cruce punto en el tiempo:** ejecutan el `ASOF LEFT JOIN` o las pre-agregaciones verificando que el conteo de filas no cambie.\n4. **`SELECT` final:** aplica `COALESCE` a las columnas sin pareja y ordena la salida.'
    }
  ],

  workedExample: {
    title: 'Atribución de pedidos a eventos web en Mercado Brisa: desigualdad abierta frente a ASOF JOIN',
    description: 'Compara qué sucede con el conteo de pedidos y la suma de `total_usd` para los pedidos `10001` a `10005` de Mercado Brisa cuando unes `orders` con `events` mediante `>=` frente a `ASOF LEFT JOIN`:',
    audit: 'Con ASOF LEFT JOIN se conservan exactamente los 5 pedidos originales y los $1,311.59 USD reales, mientras que el JOIN con desigualdad abierta genera 75 filas e infla la suma a $23,327.99 USD.',
    steps: [
      {
        label: 'Paso 1 — Antipatrón: JOIN con desigualdad abierta (o.order_ts >= e.event_ts)',
        explanation: 'Unir con `o.order_ts >= e.event_ts` sin `ASOF` multiplica cada pedido por todos los eventos históricos del cliente (75 filas en lugar de 5) y multiplica por 17,8 el importe total.',
        code: 'SELECT\n  COUNT(*) AS filas_generadas,\n  COUNT(DISTINCT o.order_id) AS pedidos_unicos,\n  ROUND(SUM(o.total_usd), 2) AS monto_usd_inflado\nFROM orders o\nINNER JOIN events e\n  ON o.customer_id = e.customer_id\n AND o.order_ts >= e.event_ts\nWHERE o.order_id BETWEEN 10001 AND 10005;',
        expectedOutput: [
          {
            filas_generadas: 75,
            pedidos_unicos: 5,
            monto_usd_inflado: 23327.99
          }
        ]
      },
      {
        label: 'Paso 2 — Solución verificada: CTEs modulares + ASOF LEFT JOIN exacto 1:1',
        explanation: 'Al usar `ASOF LEFT JOIN`, cada uno de los 5 pedidos se empareja únicamente con el evento previo más cercano de ese cliente, preservando las 5 filas y los $1,311.59 USD.',
        code: 'WITH orders_scoped AS (\n  SELECT order_id, customer_id, order_ts, total_usd\n  FROM orders\n  WHERE order_id BETWEEN 10001 AND 10005\n),\nevents_clean AS (\n  SELECT customer_id, event_ts, event_type, campaign_id\n  FROM events\n  WHERE customer_id IS NOT NULL\n)\nSELECT\n  COUNT(*) AS filas_generadas,\n  COUNT(DISTINCT o.order_id) AS pedidos_unicos,\n  ROUND(SUM(o.total_usd), 2) AS monto_usd_exacto\nFROM orders_scoped o\nASOF LEFT JOIN events_clean e\n  ON o.customer_id = e.customer_id\n AND o.order_ts >= e.event_ts;',
        expectedOutput: [
          {
            filas_generadas: 5,
            pedidos_unicos: 5,
            monto_usd_exacto: 1311.59
          }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: 'Un pedido ocurre a las `14:05:10`. El cliente tiene tres eventos en `events`: a las `13:50:00`, a las `14:02:00` y a las `14:06:00`. Si ejecutas `FROM orders o ASOF JOIN events e ON o.customer_id = e.customer_id AND o.order_ts >= e.event_ts`, ¿qué evento se asigna?',
      options: [
        {
          id: 'a',
          text: 'Únicamente el evento de las `14:02:00`, porque es el más reciente entre los que ocurrieron antes o en el instante del pedido (`<= 14:05:10`).',
          correct: true,
          feedback: 'Exacto. ASOF JOIN descarta el de las 14:06:00 (futuro) y prefiere el de las 14:02:00 sobre el de las 13:50:00 por ser el inmediato anterior.'
        },
        {
          id: 'b',
          text: 'El evento de las `14:06:00`, porque está a solo 50 segundos de distancia.',
          correct: false,
          feedback: 'Incorrecto. Con la condición `o.order_ts >= e.event_ts`, nunca se empareja un registro posterior al pedido.'
        },
        {
          id: 'c',
          text: 'Devuelve dos filas para ese pedido: la de las `13:50:00` y la de las `14:02:00`.',
          correct: false,
          feedback: 'Incorrecto. A diferencia de un JOIN normal con desigualdad, ASOF JOIN devuelve como máximo una fila por cada registro izquierdo.'
        }
      ],
      explanation: 'ASOF JOIN evalúa la condición de desigualdad temporal y conserva únicamente el registro previo más cercano, manteniendo intacto el grano de la tabla izquierda.'
    },
    {
      id: 'c2',
      type: 'mcq',
      prompt: '¿Qué error introduces en un conjunto de entrenamiento o reporte histórico si escribes `ASOF JOIN ... ON o.customer_id = c.customer_id AND o.order_ts <= c.valid_from`?',
      options: [
        {
          id: 'a',
          text: 'Fuga de datos del futuro (data leakage), porque asignas a la compra un estado o segmento que el cliente adquirió después del pedido.',
          correct: true,
          feedback: 'Correcto. La desigualdad `o.order_ts <= c.valid_from` busca hacia adelante en el tiempo en lugar de mirar el estado vigente en el pasado.'
        },
        {
          id: 'b',
          text: 'Un producto cartesiano que multiplica cada pedido por todos los clientes.',
          correct: false,
          feedback: 'Incorrecto. ASOF JOIN sigue devolviendo a lo sumo una fila por pedido, pero toma la fila equivocada (del futuro).'
        },
        {
          id: 'c',
          text: 'Un error de sintaxis, porque ASOF JOIN no admite el operador `<=`.',
          correct: false,
          feedback: 'Incorrecto. La sintaxis es válida en SQL, lo que hace que este error lógico sea silencioso si no verificas el sentido de la desigualdad.'
        }
      ],
      explanation: 'Para atribuir el estado vigente en el momento de un evento, la marca temporal del hecho debe ser mayor o igual (>=) que la marca de inicio del atributo o evento previo.'
    },
    {
      id: 'c3',
      type: 'mcq',
      prompt: 'En PostgreSQL 17 (donde no existe sintaxis `ASOF JOIN` nativa), ¿qué construcción recupera el último cambio de nivel de fidelidad previo a cada pedido?',
      options: [
        {
          id: 'a',
          text: 'LEFT JOIN LATERAL (SELECT ... FROM customer_changes c WHERE c.customer_id = o.customer_id AND c.valid_from <= o.order_ts ORDER BY c.valid_from DESC LIMIT 1) cc ON TRUE',
          correct: true,
          feedback: 'Correcto. LATERAL correlaciona la subconsulta con cada fila de orders y ORDER BY ... DESC LIMIT 1 detiene la búsqueda en el registro más reciente.'
        },
        {
          id: 'b',
          text: 'INNER JOIN customer_changes c ON c.customer_id = o.customer_id AND c.valid_from = o.order_ts',
          correct: false,
          feedback: 'Incorrecto. El instante de cambio de nivel rara vez coincide al segundo con la marca temporal del pedido.'
        },
        {
          id: 'c',
          text: 'CROSS JOIN customer_changes c WHERE c.valid_from <= o.order_ts',
          correct: false,
          feedback: 'Incorrecto. Cruza todos los clientes entre sí y devuelve todo el historial pasado sin limitar al registro más cercano.'
        }
      ],
      explanation: 'LEFT JOIN LATERAL con ORDER BY ... DESC LIMIT 1 es el patrón estándar en PostgreSQL para emular un ASOF JOIN o recuperar los N eventos previos por fila.'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Atribución temporal al último evento con ASOF JOIN',
    language: 'sql',
    prompt: 'Completa la consulta con CTEs sobre Mercado Brisa para atribuir cada pedido (`order_id BETWEEN 10001 AND 10010`) al último evento (`events`) del mismo `customer_id` ocurrido antes o en el mismo instante de la compra (`o.order_ts >= e.event_ts`).',
    starterCode: 'WITH orders_clean AS (\n  SELECT\n    order_id,\n    customer_id,\n    order_ts,\n    total_usd\n  FROM orders\n  WHERE order_id BETWEEN 10001 AND 10010\n),\nevents_clean AS (\n  SELECT\n    customer_id,\n    event_ts,\n    event_type,\n    campaign_id\n  FROM events\n  WHERE customer_id IS NOT NULL\n)\nSELECT\n  o.order_id,\n  o.customer_id,\n  e.event_type AS last_touch_type,\n  COALESCE(e.campaign_id, \'ORGANIC_DIRECT\') AS attributed_campaign,\n  o.total_usd\nFROM orders_clean o\n-- Reemplaza LEFT JOIN por ASOF LEFT JOIN y usa la desigualdad o.order_ts >= e.event_ts\nLEFT JOIN events_clean e\n  ON o.customer_id = e.customer_id\n  AND o.order_ts = e.event_ts\nORDER BY o.order_id;',
    expected: 'WITH orders_clean AS (\n  SELECT\n    order_id,\n    customer_id,\n    order_ts,\n    total_usd\n  FROM orders\n  WHERE order_id BETWEEN 10001 AND 10010\n),\nevents_clean AS (\n  SELECT\n    customer_id,\n    event_ts,\n    event_type,\n    campaign_id\n  FROM events\n  WHERE customer_id IS NOT NULL\n)\nSELECT\n  o.order_id,\n  o.customer_id,\n  e.event_type AS last_touch_type,\n  COALESCE(e.campaign_id, \'ORGANIC_DIRECT\') AS attributed_campaign,\n  o.total_usd\nFROM orders_clean o\nASOF LEFT JOIN events_clean e\n  ON o.customer_id = e.customer_id\n  AND o.order_ts >= e.event_ts\nORDER BY o.order_id;',
    orderMatters: true,
    hints: [
      'Cambia `LEFT JOIN events_clean e` por `ASOF LEFT JOIN events_clean e`.',
      'Sustituye la igualdad `AND o.order_ts = e.event_ts` por la condición temporal `AND o.order_ts >= e.event_ts`.',
      'Conserva el `ORDER BY o.order_id` al final para devolver los 10 pedidos en orden.'
    ],
    solution: 'WITH orders_clean AS (\n  SELECT\n    order_id,\n    customer_id,\n    order_ts,\n    total_usd\n  FROM orders\n  WHERE order_id BETWEEN 10001 AND 10010\n),\nevents_clean AS (\n  SELECT\n    customer_id,\n    event_ts,\n    event_type,\n    campaign_id\n  FROM events\n  WHERE customer_id IS NOT NULL\n)\nSELECT\n  o.order_id,\n  o.customer_id,\n  e.event_type AS last_touch_type,\n  COALESCE(e.campaign_id, \'ORGANIC_DIRECT\') AS attributed_campaign,\n  o.total_usd\nFROM orders_clean o\nASOF LEFT JOIN events_clean e\n  ON o.customer_id = e.customer_id\n  AND o.order_ts >= e.event_ts\nORDER BY o.order_id;',
    solutionExplanation: 'Aísla los pedidos y eventos con cliente válido en dos CTEs y ejecuta `ASOF LEFT JOIN` con `o.customer_id = e.customer_id AND o.order_ts >= e.event_ts`, conservando exactamente 10 filas.'
  },

  roleNotes: {
    de: 'Normaliza todas las marcas de tiempo a UTC antes de ejecutar un `ASOF JOIN` entre tablas de distintas fuentes. Ordena físicamente las tablas Parquet o Iceberg por `(customer_id, event_ts)` para que el motor resuelva el emparejamiento temporal sin reordenar toda la tabla en memoria. Estructura las transformaciones en CTEs modulares con una responsabilidad por bloque.',
    da: 'Utiliza `ASOF LEFT JOIN` para construir variables predictivas punto en el tiempo (*feature engineering*) evitando filtrar eventos posteriores a la fecha de corte. Resuelve la atribución de último toque emparejando cada pedido con la sesión previa más reciente del cliente. Usa `LEFT JOIN LATERAL` con `LIMIT 3` cuando analices la secuencia de acciones previas a una baja.',
    bi: 'Asegura que la atribución de campañas y el nivel del cliente (`customer_changes`) en los reportes financieros reflejen el estado vigente en el segundo del pedido y no el atributo actual sobrescrito. Define con el negocio qué valor por defecto mostrar (`COALESCE(campaign_id, \'ORGANIC_DIRECT\')`) cuando un pedido no tiene eventos previos.'
  },

  summary: [
    'ASOF JOIN empareja cada fila izquierda con el único registro derecho previo más cercano sin provocar fan-out.',
    'La condición temporal (hecho_ts >= atributo_ts) impide usar datos del futuro que aún no existían.',
    'LEFT JOIN LATERAL permite correlacionar una subconsulta con ORDER BY y LIMIT N por cada fila izquierda.',
    'Dividir la consulta en CTEs de acotación, limpieza y cruce temporal facilita auditar cada etapa.'
  ],

  flashcards: [
    {
      id: 'fc-c2-asof-01',
      front: '¿Qué diferencia a un ASOF JOIN de un JOIN normal con condición de desigualdad (a.ts >= b.ts)?',
      back: 'Un JOIN con desigualdad devuelve todas las filas pasadas (multiplicando filas); ASOF JOIN devuelve como máximo una fila: la inmediatamente anterior o igual.'
    },
    {
      id: 'fc-c2-asof-02',
      front: '¿Cuándo conviene usar LEFT JOIN LATERAL en lugar de ASOF JOIN?',
      back: 'Cuando necesitas recuperar las N filas previas (por ejemplo, LIMIT 3) en lugar de una sola, o en motores como PostgreSQL sin ASOF nativo.'
    },
    {
      id: 'fc-c2-asof-03',
      front: '¿Qué ocurre si inviertes la desigualdad a (pedido_ts <= evento_ts) en un cruce histórico?',
      back: 'Emparejas cada pedido con eventos ocurridos después de la compra, introduciendo fuga de datos futuros (data leakage).'
    }
  ],

  glossaryTerms: [
    'c04-asof-join',
    'c08-point-in-time',
    'c2-sql-asof-join',
    'c2-sql-lateral-join'
  ],

  sources: [
    {
      title: 'DuckDB SQL Reference — ASOF Join',
      url: 'https://duckdb.org/docs/sql/query_syntax/from.html#asof-join',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Sintaxis y semántica de ASOF JOIN y ASOF LEFT JOIN preservando la cardinalidad de la tabla izquierda.'
    },
    {
      title: 'PostgreSQL 17 Documentation — Section 7.2.1.5: LATERAL Subqueries',
      url: 'https://www.postgresql.org/docs/current/queries-table-expressions.html#QUERIES-LATERAL',
      publisher: 'PostgreSQL Global Development Group',
      accessed: '2026-10-29',
      supports: 'Evaluación correlacionada por fila mediante LEFT JOIN LATERAL con ORDER BY y LIMIT.'
    },
    {
      title: 'Snowflake SQL Reference — ASOF JOIN',
      url: 'https://docs.snowflake.com/en/sql-reference/constructs/asof-join',
      publisher: 'Snowflake Inc.',
      accessed: '2026-10-29',
      supports: 'Comportamiento de cruces punto en el tiempo sobre series temporales de distinta frecuencia.'
    },
    {
      title: 'dbt Labs Best Practices — How We Style Our SQL (CTE Layers)',
      url: 'https://docs.getdbt.com/best-practices/how-we-style/2-how-we-style-our-sql',
      publisher: 'dbt Labs',
      accessed: '2026-10-29',
      supports: 'Organización de consultas analíticas en CTEs de importación, limpieza, lógica de negocio y proyección final.'
    }
  ],

  aiNotes: 'El error más común es invertir el signo de desigualdad en ASOF JOIN (usando <= en lugar de >= para la tabla de hechos y trayendo datos del futuro) o olvidar filtrar customer_id IS NOT NULL en events. En Mercado Brisa usa orders (10001..10010), events y customer_changes.',
  legacyId: 'l3-asof-lateral-ctes',
  legacyOrder: 3,
  stageId: 'stage-1',
  subtitle: 'Emparejar eventos de distinta frecuencia sin multiplicar filas ni filtrar datos del futuro hacia el pasado.',
  goal: 'Implementar cruces punto en el tiempo mediante ASOF JOIN, aplicar subconsultas correlacionadas con LATERAL y estructurar consultas con CTEs modulares.',
  pipelineChallenge: {
    title: 'Atribución temporal y estado histórico del cliente sin fan-out',
    scenario: 'Ordena los pasos técnicos para atribuir cada pedido de Mercado Brisa al último evento web del cliente y a su nivel de fidelidad vigente en el segundo de la compra.',
    steps: [
      {
        id: 'step-1',
        label: '1. Acotar pedidos y eventos válidos en CTEs de entrada',
        role: 'DE',
        detail: 'Crear `orders_scoped` y `events_clean` descartando sesiones anónimas (`customer_id IS NULL`) y asegurando marcas temporales en UTC.'
      },
      {
        id: 'step-2',
        label: '2. Deduplicar eventos con marca temporal idéntica mediante QUALIFY',
        role: 'DE',
        detail: 'Garantizar con `ROW_NUMBER()` que no existan dos eventos duplicados por webhook en el mismo segundo para el mismo cliente.'
      },
      {
        id: 'step-3',
        label: '3. Ejecutar ASOF LEFT JOIN hacia atrás en el tiempo',
        role: 'DA',
        detail: 'Unir `orders_scoped` con `events_clean` usando `ON o.customer_id = e.customer_id AND o.order_ts >= e.event_ts`.'
      },
      {
        id: 'step-4',
        label: '4. Verificar reconciliación de filas y exponer campaña atribuida',
        role: 'BI',
        detail: 'Comprobar que el número de pedidos permanece intacto (1:1) y asignar `ORGANIC_DIRECT` con `COALESCE` a los pedidos sin evento previo.'
      }
    ],
    explanation: 'Un `ASOF LEFT JOIN` requiere marcas temporales en la misma zona horaria y tablas derechas sin duplicados exactos; así conserva 1 fila por pedido y evita fugas del futuro.'
  },
  relatedLessons: [
    {
      id: 'c1-sql-joins-02-grano-fanout',
      reason: 'Un JOIN con desigualdad temporal sin `ASOF` multiplica cada hecho por toda la historia previa de esa clave.'
    },
    {
      id: 'c2-sql-analitico-01-window-functions',
      reason: 'Usa `QUALIFY ROW_NUMBER() = 1` en tus CTEs de limpieza antes del `ASOF JOIN` para resolver empates exactos de timestamp.'
    }
  ]
};

export default lesson;
