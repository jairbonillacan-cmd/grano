const lesson = {
  id: 'bi2-modelo-semantico-02-relaciones-cardinalidad',
  moduleId: 'bi2-modelo-semantico',
  tracks: ['bi'],
  level: 2,
  order: 2,
  title: 'Relaciones 1:N y por qué evitar muchos a muchos directas',
  subtitle: 'Relaciones, cardinalidad (1:N) y por qué evitar relaciones muchos a muchos directas',
  minutes: 25,
  prerequisites: ['bi2-modelo-semantico-01-estrella-vertipaq'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), un desarrollador de BI quiso analizar las ventas actuales por segmento conectando `orders` con la tabla histórica `customer_changes` mediante `customer_id`. Power BI advirtió que `customer_id` tenía valores repetidos en ambos lados y ofreció crear una relación muchos a muchos (`*: *`). Tras aceptar, la facturación del segmento `retail` saltó de 2,44 millones a 5,76 millones de dólares. ¿Cómo validas y restauras la cardinalidad `1:N` antes de enlazar dos tablas?',

  objectives: [
    'Diagnosticar con SQL si una columna candidata a dimensión cumple la unicidad requerida en el lado uno de una relación 1:N.',
    'Explicar cómo funciona la fila en blanco automática (Blank Row) de VertiPaq ante fallos de integridad referencial.',
    'Resolver relaciones con claves repetidas (`customer_changes`, `refunds`) mediante filtrado de versión vigente, pre-agregación 1:1 o tabla puente.',
  ],

  sections: [
    {
      id: 'regla-del-lado-uno-y-fila-en-blanco',
      heading: 'Qué exige el lado uno de una relación 1:N y qué es la Blank Row',
      body: 'En un modelo tabular, el estándar para conectar una dimensión con una tabla de hechos es la relación **uno a muchos** (`1:N` o `1:*`). El motor verifica físicamente que la columna del lado `1` (la dimensión) no tenga valores duplicados ni nulos. Si intentas definir una relación `1:N` y aparece un identificador repetido durante el refresco, la carga se detiene con error.\n\n¿Qué ocurre cuando la dimensión es única, pero la tabla de hechos tiene una clave foránea huérfana que no existe en la dimensión? En lugar de descartar la venta como un `INNER JOIN`, el motor VertiPaq inserta una **fila en blanco** (*Blank Row*) virtual en la dimensión. Allí agrupa todas las filas de hechos sin correspondencia. Así, el total general de `SUM(orders[total_usd])` sigue cuadrando al céntimo. Además, el reporte muestra en una fila `(En blanco)` qué importe carece de dimensión asignada.\n\nPor eso debes auditar con SQL que `COUNT(*)` sea igual a `COUNT(DISTINCT clave)` antes de relacionar tablas en BI. En Mercado Brisa, `customers` cumple `2 400 = 2 400`. Sin embargo, `customer_changes` tiene `4 100` filas para `2 400` clientes (`1 700` duplicados históricos) y `refunds` tiene `1 450` filas para `1 150` pedidos.',
      interactive: {
        component: 'join-fanout-visualizer',
        caption: 'Simulador interactivo: observa cómo se multiplican las filas e importes cuando ambos lados repiten la clave.',
      },
      example: {
        language: 'sql',
        code: `SELECT
  'customers (customer_id)' AS tabla_clave,
  COUNT(*) AS filas_totales,
  COUNT(DISTINCT customer_id) AS claves_unicas,
  COUNT(*) - COUNT(DISTINCT customer_id) AS claves_duplicadas,
  CASE WHEN COUNT(*) = COUNT(DISTINCT customer_id) THEN '1:N valida' ELSE 'Rompe 1:N (requiere puente o filtro)' END AS diagnostico
FROM customers
UNION ALL
SELECT
  'customer_changes sin filtrar (customer_id)',
  COUNT(*),
  COUNT(DISTINCT customer_id),
  COUNT(*) - COUNT(DISTINCT customer_id),
  CASE WHEN COUNT(*) = COUNT(DISTINCT customer_id) THEN '1:N valida' ELSE 'Rompe 1:N (requiere puente o filtro)' END
FROM customer_changes
UNION ALL
SELECT
  'customer_changes actual (is_current = TRUE)',
  COUNT(*),
  COUNT(DISTINCT customer_id),
  COUNT(*) - COUNT(DISTINCT customer_id),
  CASE WHEN COUNT(*) = COUNT(DISTINCT customer_id) THEN '1:N valida' ELSE 'Rompe 1:N (requiere puente o filtro)' END
FROM customer_changes
WHERE is_current = TRUE
UNION ALL
SELECT
  'refunds sin pre-agregar (order_id)',
  COUNT(*),
  COUNT(DISTINCT order_id),
  COUNT(*) - COUNT(DISTINCT order_id),
  CASE WHEN COUNT(*) = COUNT(DISTINCT order_id) THEN '1:N valida' ELSE 'Rompe 1:N (requiere puente o filtro)' END
FROM refunds;`,
        expectedOutput: [
          {
            tabla_clave: 'customers (customer_id)',
            filas_totales: '2400',
            claves_unicas: '2400',
            claves_duplicadas: '0',
            diagnostico: '1:N valida',
          },
          {
            tabla_clave: 'customer_changes sin filtrar (customer_id)',
            filas_totales: '4100',
            claves_unicas: '2400',
            claves_duplicadas: '1700',
            diagnostico: 'Rompe 1:N (requiere puente o filtro)',
          },
          {
            tabla_clave: 'customer_changes actual (is_current = TRUE)',
            filas_totales: '2400',
            claves_unicas: '2400',
            claves_duplicadas: '0',
            diagnostico: '1:N valida',
          },
          {
            tabla_clave: 'refunds sin pre-agregar (order_id)',
            filas_totales: '1450',
            claves_unicas: '1150',
            claves_duplicadas: '300',
            diagnostico: 'Rompe 1:N (requiere puente o filtro)',
          },
        ],
      },
    },
    {
      id: 'peligros-de-las-relaciones-muchos-a-muchos',
      heading: 'Por qué evitar las relaciones muchos a muchos directas',
      body: 'Cuando ninguna de las dos tablas tiene valores únicos en la columna de enlace, Power BI ofrece configurar una **relación de cardinalidad muchos a muchos** (`*:*`, también llamada *relación limitada*). Aunque evita el mensaje de error inicial, esta opción introduce tres riesgos graves.\n\nPrimero, **desaparece la Blank Row**. Las relaciones limitadas no crean la fila `(En blanco)` automática cuando faltan claves. Si una tabla de hechos tiene identificadores huérfanos, esas ventas desaparecen en silencio al filtrar por la otra tabla.\n\nSegundo, provoca **duplicación o no aditividad en las filas**. Si un mismo `customer_id` pertenece a dos segmentos distintos en `customer_changes`, sus pedidos se cuentan en ambos segmentos. En SQL directo esto duplica el total. En DAX la fila de `Total` evalúa sin filtro y no coincide con la suma de las filas visibles.\n\nTercero, añade una **penalización en tiempo de consulta**. En lugar de usar el índice directo de una relación `1:N` en VertiPaq, el motor debe resolver en cada visual los valores únicos compartidos antes de propagar el filtro.',
    },
    {
      id: 'patrones-limpios-puente-y-preagregacion',
      heading: 'Tres patrones limpios: filtro SCD2, pre-agregación 1:1 y tabla puente',
      body: 'Casi todas las relaciones `*:*` accidentales se corrigen restaurando el esquema en estrella con uno de estos tres patrones.\n\n1. **Filtrar la versión actual o enlazar por clave subrogada en SCD2**. Si el reporte requiere el segmento vigente del cliente, filtra `WHERE is_current = TRUE` en `customer_changes` (o usa la dimensión `customers`). Así obtienes exactamente 2 400 filas únicas (`1:N`). Si requieres el segmento histórico al momento de la compra, el almacén debe estampar `change_id` en los hechos durante la transformación.\n\n2. **Pre-agregar al grano de la cabecera (`1:1`)**. En `refunds` existen 1 450 devoluciones para 1 150 pedidos porque 300 pedidos tuvieron devoluciones parciales. Si solo necesitas el importe devuelto por pedido en `orders`, agrupa `refunds` por `order_id` (`SUM(refund_amount_usd)`) antes de unirlo.\n\n3. **Tabla puente (*Bridge Table*) o dimensión conformada**. Si debes analizar `orders` y `refunds` como dos tablas de hechos independientes por fecha y tienda, nunca las unas entre sí. Conecta ambas en `1:N` hacia las dimensiones conformadas `customers`, `stores` y `calendar`.',
    },
  ],

  workedExample: {
    title: 'Impacto de unir orders con customer_changes sin unicidad frente a relación 1:N limpia',
    description: 'Compara el cruce directo por `customer_id` contra `customer_changes` (relación N:M no controlada) frente a garantizar una fila única por cliente (`1:N`).',
    steps: [
      {
        label: 'Paso 1 — Antipatrón: unión con clave repetida en customer_changes (4 100 filas)',
        explanation: 'Como los clientes que cambiaron de nivel o segmento aparecen varias veces en `customer_changes`, unir `orders` por `customer_id` sin garantizar unicidad multiplica los pedidos completados: `retail` reporta 13 973 pedidos y 5 760 434,75 USD.',
        code: `SELECT
  cc.segment,
  COUNT(o.order_id) AS pedidos_contados,
  ROUND(SUM(o.total_usd), 2) AS facturacion_inflada_nm_usd
FROM orders o
JOIN customer_changes cc ON o.customer_id = cc.customer_id
WHERE o.status = 'completed'
GROUP BY cc.segment
ORDER BY facturacion_inflada_nm_usd DESC;`,
        expectedOutput: [
          {
            segment: 'retail',
            pedidos_contados: '13973',
            facturacion_inflada_nm_usd: 5760434.75,
          },
          {
            segment: 'pro_barista',
            pedidos_contados: '8707',
            facturacion_inflada_nm_usd: 3559972.93,
          },
          {
            segment: 'cafeteria_b2b',
            pedidos_contados: '2591',
            facturacion_inflada_nm_usd: 1319604.26,
          },
        ],
      },
      {
        label: 'Paso 2 — Solución 1:N: aislar una fila única por cliente vigente antes de relacionar',
        explanation: 'Al restringir la dimensión a `is_current = TRUE` (2 400 filas únicas para 2 400 `customer_id`), la relación pasa a ser `1:N`. Los pedidos completados suman exactamente los 14 760 reales y se comprueba que `pro_barista` (2 512 933,23 USD) supera a `retail` (2 436 924,93 USD).',
        code: `WITH dim_cliente_actual AS (
  SELECT customer_id, segment
  FROM customer_changes
  WHERE is_current = TRUE
)
SELECT
  d.segment,
  COUNT(o.order_id) AS pedidos_reales_1n,
  ROUND(SUM(o.total_usd), 2) AS facturacion_real_1n_usd
FROM orders o
JOIN dim_cliente_actual d ON o.customer_id = d.customer_id
WHERE o.status = 'completed'
GROUP BY d.segment
ORDER BY facturacion_real_1n_usd DESC;`,
        expectedOutput: [
          {
            segment: 'pro_barista',
            pedidos_reales_1n: '6229',
            facturacion_real_1n_usd: 2512933.23,
          },
          {
            segment: 'retail',
            pedidos_reales_1n: '5940',
            facturacion_real_1n_usd: 2436924.93,
          },
          {
            segment: 'cafeteria_b2b',
            pedidos_reales_1n: '2591',
            facturacion_real_1n_usd: 1319604.26,
          },
        ],
      },
    ],
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: 'En un modelo con relación `1:N` estándar en Power BI, ¿qué hace el motor VertiPaq si la tabla de hechos contiene pedidos cuyo `customer_id` no existe en la dimensión `customers`?',
      options: [
        {
          id: 'a',
          text: 'Añade automáticamente una fila en blanco virtual (Blank Row) en la dimensión para agrupar esos pedidos sin perder su importe en el total.',
          correct: true,
          feedback: 'Exacto. La Blank Row preserva la integridad de las sumas y hace visible en los visuales cualquier fallo de integridad referencial.',
        },
        {
          id: 'b',
          text: 'Borra físicamente las filas huérfanas de la tabla de hechos durante el refresco.',
          correct: false,
          feedback: 'Incorrecto. VertiPaq nunca elimina filas de la tabla de hechos por falta de coincidencia en la dimensión.',
        },
        {
          id: 'c',
          text: 'Convierte la relación automáticamente en muchos a muchos y detiene todas las medidas DAX.',
          correct: false,
          feedback: 'Incorrecto. La relación sigue siendo 1:N siempre que la dimensión no tenga duplicados en su clave.',
        },
      ],
      explanation: 'En relaciones 1:N regulares, VertiPaq genera una fila en blanco en el lado uno cuando existen claves foráneas sin correspondencia en el lado muchos.',
    },
    {
      id: 'c2',
      type: 'predict-output',
      prompt: 'La tabla `refunds` tiene 1 450 filas repartidas en 1 150 `order_id` únicos. Si pre-agregas `refunds` con `GROUP BY order_id` en una CTE, ¿cuántas filas tendrá la CTE y qué cardinalidad tendrá respecto a `orders`?',
      options: [
        {
          id: 'a',
          text: '1 150 filas únicas; tendrá cardinalidad 1:1 (o 1:0..1) respecto a `orders.order_id`.',
          correct: true,
          feedback: 'Correcto. Al agrupar por `order_id`, los 300 reembolsos parciales adicionales se consolidan y cada pedido aparece como máximo una vez.',
        },
        {
          id: 'b',
          text: '1 450 filas; seguirá siendo una relación muchos a muchos.',
          correct: false,
          feedback: 'Incorrecto. `GROUP BY order_id` colapsa las múltiples devoluciones de un mismo pedido en una sola fila.',
        },
        {
          id: 'c',
          text: '18 000 filas, porque rellena automáticamente los pedidos sin reembolso.',
          correct: false,
          feedback: 'Incorrecto. La CTE de `refunds` solo contiene los 1 150 pedidos que tuvieron al menos una devolución.',
        },
      ],
      explanation: 'Pre-agregar una tabla de detalle al grano exacto de la tabla de cabecera garantiza unicidad por `order_id` y permite consolidar el importe en una sola tabla o relación segura.',
    },
    {
      id: 'c3',
      type: 'mcq',
      prompt: 'Necesitas comparar en un mismo tablero de Power BI las ventas mensuales (`orders`) y las devoluciones mensuales (`refunds`) por tienda y cliente. ¿Cuál es el diseño recomendado por Microsoft Learn?',
      options: [
        {
          id: 'a',
          text: 'Mantener `orders` y `refunds` como dos tablas de hechos separadas, conectadas cada una mediante relaciones 1:N a las dimensiones compartidas (`stores`, `customers`, `calendar`).',
          correct: true,
          feedback: 'Correcto. El esquema en estrella multi-hecho con dimensiones conformadas permite filtrar ambos procesos sin unir hechos entre sí.',
        },
        {
          id: 'b',
          text: 'Crear una relación directa muchos a muchos (`*:*`) entre `orders` y `refunds` usando `customer_id`.',
          correct: false,
          feedback: 'Incorrecto. Relacionar dos tablas de hechos por `customer_id` mezcla todos los pedidos de un cliente con todas sus devoluciones sin importar a qué compra pertenecen.',
        },
        {
          id: 'c',
          text: 'Duplicar las dimensiones `stores` y `customers` para que cada tabla de hechos tenga sus propios segmentadores aislados.',
          correct: false,
          feedback: 'Incorrecto. Duplicar dimensiones obliga al usuario a elegir la misma tienda en dos filtros distintos dentro del mismo reporte.',
        },
      ],
      explanation: 'Dos tablas de hechos nunca deben relacionarse directamente entre sí por atributos compartidos; deben converger hacia dimensiones conformadas comunes en relaciones 1:N.',
    },
  ],

  practice: {
    type: 'sql',
    title: 'Pre-agregación de refunds para cruce sin duplicados con orders',
    language: 'sql',
    prompt: 'Como `refunds` tiene 1 450 filas para 1 150 pedidos, pre-agrégala primero en la CTE `refunds_por_pedido` por `order_id` (`SUM(refund_amount_usd) AS reembolso_total_usd`) y luego realiza un `LEFT JOIN` desde `orders` para obtener por cada `status` de pedido: `status`, `total_pedidos` (`COUNT(o.order_id)`), `pedidos_con_reembolso` (`COUNT(r.order_id)`) y `monto_reembolsado_usd` (`ROUND(COALESCE(SUM(r.reembolso_total_usd), 0), 2)`), ordenado por `total_pedidos DESC`.',
    starterCode: `WITH refunds_por_pedido AS (
  SELECT
    order_id,
    -- TODO: Suma refund_amount_usd AS reembolso_total_usd agrupando por order_id
    0.0 AS reembolso_total_usd
  FROM refunds
  GROUP BY order_id
)
SELECT
  o.status,
  COUNT(o.order_id) AS total_pedidos,
  COUNT(r.order_id) AS pedidos_con_reembolso,
  -- TODO: Calcula el monto reembolsado redondeado a 2 decimales con COALESCE
  0.0 AS monto_reembolsado_usd
FROM orders o
-- TODO: Haz LEFT JOIN con refunds_por_pedido r por order_id
GROUP BY o.status
ORDER BY total_pedidos DESC;`,
    expected: `WITH refunds_por_pedido AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS reembolso_total_usd
  FROM refunds
  GROUP BY order_id
)
SELECT
  o.status,
  COUNT(o.order_id) AS total_pedidos,
  COUNT(r.order_id) AS pedidos_con_reembolso,
  ROUND(COALESCE(SUM(r.reembolso_total_usd), 0), 2) AS monto_reembolsado_usd
FROM orders o
LEFT JOIN refunds_por_pedido r ON o.order_id = r.order_id
GROUP BY o.status
ORDER BY total_pedidos DESC;`,
    orderMatters: true,
    hints: [
      'En la CTE `refunds_por_pedido`, escribe `SUM(refund_amount_usd) AS reembolso_total_usd`.',
      'En la consulta principal, añade `LEFT JOIN refunds_por_pedido r ON o.order_id = r.order_id` debajo de `FROM orders o`.',
      'Usa `ROUND(COALESCE(SUM(r.reembolso_total_usd), 0), 2) AS monto_reembolsado_usd` para evitar nulos en los estados sin devolución.',
    ],
    solution: `WITH refunds_por_pedido AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS reembolso_total_usd
  FROM refunds
  GROUP BY order_id
)
SELECT
  o.status,
  COUNT(o.order_id) AS total_pedidos,
  COUNT(r.order_id) AS pedidos_con_reembolso,
  ROUND(COALESCE(SUM(r.reembolso_total_usd), 0), 2) AS monto_reembolsado_usd
FROM orders o
LEFT JOIN refunds_por_pedido r ON o.order_id = r.order_id
GROUP BY o.status
ORDER BY total_pedidos DESC;`,
    solutionExplanation: 'Al consolidar `refunds` por `order_id` en la CTE, pasamos de una relación 1:N (con 300 devoluciones parciales extra) a una relación 1:0..1 contra `orders`, preservando los 18 000 pedidos sin inflar conteos.',
    expectedOutputTable: [
      {
        status: 'completed',
        total_pedidos: 14760,
        pedidos_con_reembolso: 1035,
        monto_reembolsado_usd: 274534.52,
      },
      {
        status: 'refunded',
        total_pedidos: 1440,
        pedidos_con_reembolso: 0,
        monto_reembolsado_usd: 0,
      },
      {
        status: 'cancelled',
        total_pedidos: 1080,
        pedidos_con_reembolso: 115,
        monto_reembolsado_usd: 46562.73,
      },
      {
        status: 'pending',
        total_pedidos: 720,
        pedidos_con_reembolso: 0,
        monto_reembolsado_usd: 0,
      },
    ],
  },

  roleNotes: {
    bi: 'Nunca aceptes el asistente de relación `*:*` como atajo cuando el refresco falle por duplicados en una dimensión: inspecciona qué clave se duplicó y corrige la consulta de origen.',
    de: 'Expón en la capa de consumo tanto la dimensión SCD2 completa (`dim_customer_scd2` con clave subrogada `change_id`) como la vista actual (`dim_customer_current` con `is_current = TRUE`) para facilitar relaciones 1:N directas.',
    da: 'Revisa en la práctica que los 1 150 pedidos con fila en `refunds` están en `completed` (1 035) y `cancelled` (115), mientras que el estado `refunded` de `orders` no tiene filas en `refunds`.',
  },

  summary: [
    'Toda relación 1:N exige que la columna de la dimensión tenga cero duplicados y cero nulos.',
    'Ante una clave foránea huérfana en los hechos, VertiPaq inserta una Blank Row virtual en la dimensión.',
    'Las relaciones muchos a muchos directas omiten la Blank Row, penalizan consultas y producen totales no aditivos.',
    'Corrige las relaciones N:M filtrando la versión actual (`is_current`), pre-agregando al grano 1:1 o usando dimensiones conformadas.',
  ],

  flashcards: [
    {
      id: 'fc-bi2-ms-02-a',
      front: '¿Qué es la Blank Row que genera automáticamente el motor VertiPaq en una relación 1:N?',
      back: 'Una fila virtual en blanco añadida a la dimensión para agrupar todas las filas de la tabla de hechos cuyas claves foráneas no existen en la dimensión.',
    },
    {
      id: 'fc-bi2-ms-02-b',
      front: '¿Por qué falla una relación 1:N si conectas `orders[customer_id]` directamente con `customer_changes[customer_id]` sin filtrar?',
      back: 'Porque `customer_changes` es una tabla SCD Tipo 2 donde un mismo `customer_id` se repite en varias versiones históricas (4 100 filas para 2 400 clientes).',
    },
    {
      id: 'fc-bi2-ms-02-c',
      front: '¿Qué anomalía visual provoca en un reporte una relación muchos a muchos donde una entidad pertenece a dos grupos a la vez?',
      back: 'El importe de la entidad aparece completo en ambos grupos, por lo que la suma manual de las filas supera al Total general del visual.',
    },
  ],

  glossaryTerms: [
    'cardinalidad-relaciones-bi',
    'tabla-puente-bridge',
    'esquema-estrella-semantico',
  ],

  sources: [
    {
      title: 'Microsoft Learn — Create and manage relationships in Power BI Desktop',
      url: 'https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-create-and-manage-relationships',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Reglas de unicidad en relaciones 1:N y generación automática de la fila en blanco (Blank Row).',
    },
    {
      title: 'Microsoft Learn — Many-to-many relationship guidance',
      url: 'https://learn.microsoft.com/en-us/power-bi/guidance/relationships-many-to-many',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Limitaciones de las relaciones muchos a muchos directas y diseño con tabla puente.',
    },
    {
      title: 'Microsoft Learn — One-to-one relationship guidance',
      url: 'https://learn.microsoft.com/en-us/power-bi/guidance/relationships-one-to-one',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Consolidación de tablas con cardinalidad 1:1 que comparten el mismo grano.',
    },
    {
      title: 'SQLBI — Different options to model many-to-many relationships in Power BI and Tabular',
      url: 'https://www.sqlbi.com/articles/different-options-to-model-many-to-many-relationships-in-power-bi-and-tabular/',
      publisher: 'SQLBI',
      accessed: '2026-10-29',
      supports: 'Comparación de rendimiento entre relaciones limitadas y tablas puente con relaciones 1:N.',
    },
  ],

  aiNotes: 'Aclara siempre la diferencia entre dos escenarios que se llaman igual: (1) una relación N:M genuina de negocio (como cuentas bancarias con múltiples titulares, que requiere tabla puente) y (2) una relación N:M accidental causada por no filtrar SCD2 (`customer_changes`) o por intentar unir dos tablas de hechos entre sí.',
};

export default lesson;
