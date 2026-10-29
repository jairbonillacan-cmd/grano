const lesson = {
  id: 'bi2-modelo-semantico-03-direccion-filtro-cruzado',
  moduleId: 'bi2-modelo-semantico',
  tracks: ['bi'],
  level: 2,
  order: 3,
  title: 'Dirección de filtro cruzado: flujo único vs bidireccional',
  subtitle: 'Dirección de filtro cruzado: flujo único frente al peligro de los filtros bidireccionales',
  minutes: 20,
  prerequisites: ['bi2-modelo-semantico-02-relaciones-cardinalidad'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), el gerente comercial pidió que el segmentador de productos solo mostrara artículos con compras en la región seleccionada. Para lograrlo rápido, un analista cambió todas las relaciones del modelo a filtro cruzado bidireccional (`Ambos`). Al día siguiente, el reporte de auditoría de catálogo dejó de mostrar el artículo `SKU-TEST-NEG` y Power BI bloqueó una nueva relación entre `stores` y `refunds` por ruta ambigua. ¿Por qué el flujo de filtro debe ser unidireccional por defecto?',

  objectives: [
    'Trazar cómo se propaga el contexto de filtro desde el lado uno (dimensión) hacia el lado muchos (hechos) en relaciones de flujo único.',
    'Identificar por qué habilitar filtros bidireccionales permanentes introduce ambigüedad de rutas, oculta miembros de dimensión y frena las consultas.',
    'Resolver el conteo de entidades de dimensión filtradas por tablas de hechos sin activar el filtro bidireccional global.',
  ],

  sections: [
    {
      id: 'propagacion-unidireccional-de-dimension-a-hechos',
      heading: 'Cómo viaja el filtro del lado uno al lado muchos por defecto',
      body: 'Toda relación `1:N` en un modelo semántico tiene una flecha que indica su **dirección de filtro cruzado** (*Cross-filter direction*). En la configuración recomendada de **dirección única** (`Single`), los filtros viajan siempre desde el lado `1` (la tabla de dimensión) hacia el lado `N` (la tabla de hechos), y nunca en sentido inverso.\n\nObserva qué ocurre cuando el usuario selecciona `region = \'Cono Sur\'` en la dimensión `stores`. El filtro baja por la relación `1:N` hacia `orders` y retiene los 4 920 pedidos completados de esa región. Al mismo tiempo, las demás dimensiones (`customers`, `products`, `calendar`) permanecen intactas hasta que una medida evalúa la intersección sobre la tabla de hechos.\n\nEste aislamiento entre dimensiones tiene dos ventajas directas. Primero, el motor VertiPaq no necesita recalcular ni cruzar las tablas de dimensión entre sí cada vez que alguien toca un filtro. Segundo, puedes mostrar en una misma tabla visual cuántas tiendas existen en la dimensión (`tiendas_en_dimension`) junto a cuántos pedidos y clientes únicos compraron en ellas (`clientes_unicos_atendidos`), sin que una tabla de hechos recorte a las demás dimensiones.',
      example: {
        language: 'sql',
        code: `SELECT
  s.region,
  COUNT(DISTINCT s.store_id) AS tiendas_en_dimension,
  COUNT(DISTINCT o.order_id) AS pedidos_completados,
  COUNT(DISTINCT o.customer_id) AS clientes_unicos_atendidos,
  ROUND(SUM(o.total_usd), 2) AS ventas_completadas_usd
FROM stores s
LEFT JOIN orders o
  ON s.store_id = o.store_id
 AND o.status = 'completed'
GROUP BY s.region
ORDER BY ventas_completadas_usd DESC;`,
        expectedOutput: [
          {
            region: 'Cono Sur',
            tiendas_en_dimension: '3',
            pedidos_completados: '4920',
            clientes_unicos_atendidos: '764',
            ventas_completadas_usd: 2059786.39,
          },
          {
            region: 'Andina',
            tiendas_en_dimension: '4',
            pedidos_completados: '4921',
            clientes_unicos_atendidos: '764',
            ventas_completadas_usd: 1990554.12,
          },
          {
            region: 'Iberia',
            tiendas_en_dimension: '3',
            pedidos_completados: '2811',
            clientes_unicos_atendidos: '400',
            ventas_completadas_usd: 1348369.68,
          },
          {
            region: 'Norteamérica',
            tiendas_en_dimension: '4',
            pedidos_completados: '2108',
            clientes_unicos_atendidos: '364',
            ventas_completadas_usd: 870752.23,
          },
        ],
      },
    },
    {
      id: 'riesgos-de-ambiguedad-y-rendimiento-en-both',
      heading: 'Qué rompe el filtro bidireccional: ambigüedad y datos ocultos',
      body: 'Cuando cambias una relación a dirección **bidireccional** (`Both`), cualquier filtro en la tabla de hechos sube hacia la dimensión. Desde allí vuelve a bajar hacia cualquier otra tabla de hechos conectada a esa misma dimensión. Según Microsoft Learn y SQLBI, activar `Both` de forma global provoca tres problemas graves:\n\n1. **Ambigüedad de rutas en el modelo**: imagina que `customers` y `calendar` filtran tanto a `orders` como a `refunds`. Si activas `Both` entre `orders` y `customers`, un filtro sobre `calendar` llega a `refunds` por dos caminos distintos. Puede ir directo (`calendar -> refunds`) o dar un rodeo por los clientes que compraron en esa fecha (`calendar -> orders -> customers -> refunds`). Ambos caminos devuelven conjuntos de devoluciones distintos. Por seguridad, el motor tabular bloquea relaciones que cierren un bucle ambiguo.\n\n2. **Ocultamiento silencioso de miembros sin actividad**: en la categoría `Accesorios` de Mercado Brisa existen 37 productos en catálogo, pero el artículo `SKU-TEST-NEG` solo estuvo en pedidos cancelados. Con un filtro bidireccional desde ventas completadas, ese SKU desaparece del catálogo.\n\n3. **Degradación de rendimiento**: para propagar el filtro del lado `N` al lado `1`, el motor debe escanear la tabla de hechos en cada clic.',
    },
    {
      id: 'alternativas-crossfilter-y-filtro-visual',
      heading: 'Cómo filtrar dimensiones o contar clientes sin relación Both',
      body: '¿Qué haces cuando necesitas contar cuántos clientes o productos tuvieron actividad, o sincronizar dos segmentadores, sin activar relaciones bidireccionales permanentes? Dispones de tres soluciones limpias:\n\n1. **Contar la clave foránea directamente en la tabla de hechos**. Si quieres saber cuántos clientes compraron en `orders`, mide `DISTINCTCOUNT(orders[customer_id])` en lugar de filtrar `customers` en reversa. El filtro fluye en una sola dirección hacia `orders` y la medida cuenta solo los clientes presentes en las filas activas.\n\n2. **Activar `CROSSFILTER` solo dentro de una medida**. Cuando un cálculo puntual necesita que `orders` filtre a `customers`, escribe `CALCULATE(DISTINCTCOUNT(customers[customer_id]), CROSSFILTER(orders[customer_id], customers[customer_id], Both))`. La dirección bidireccional vive solo durante esa medida y no contamina el resto del reporte.\n\n3. **Filtrar el segmentador con una medida en el panel de filtros**. Para ocultar en un menú desplegable los productos sin ventas, añade la condición `NOT ISBLANK([Ventas Completadas])` en el panel de filtros de ese segmentador mientras la relación del modelo sigue en `Single`.',
    },
  ],

  workedExample: {
    title: 'Productos ocultos por filtro bidireccional frente a relación unidireccional 1:N',
    description: 'Compara el efecto de forzar que los hechos de ventas completadas recorten la dimensión `products` frente a mantener el flujo `1 -> N` desde `products`.',
    steps: [
      {
        label: 'Paso 1 — Antipatrón: el filtro desde ventas completadas recorta la dimensión products',
        explanation: 'Si la tabla de hechos con `status = \'completed\'` filtra hacia atrás la dimensión `products` (equivalente a un `INNER JOIN`), la categoría `Accesorios` aparenta tener solo 36 SKUs en el catálogo, ocultando el producto 180 (`SKU-TEST-NEG`) que no tuvo ventas completadas.',
        code: `SELECT
  p.category,
  COUNT(DISTINCT p.product_id) AS skus_visibles_filtro_bidireccional,
  ROUND(SUM(oi.line_total_usd), 2) AS ventas_completadas_usd
FROM products p
JOIN order_items oi ON p.product_id = oi.product_id
JOIN orders o ON oi.order_id = o.order_id
WHERE o.status = 'completed'
GROUP BY p.category
ORDER BY ventas_completadas_usd DESC;`,
        expectedOutput: [
          {
            category: 'Molinos',
            skus_visibles_filtro_bidireccional: '36',
            ventas_completadas_usd: 2163162.27,
          },
          {
            category: 'Cafeteras',
            skus_visibles_filtro_bidireccional: '36',
            ventas_completadas_usd: 1643366.45,
          },
          {
            category: 'Suscripciones',
            skus_visibles_filtro_bidireccional: '35',
            ventas_completadas_usd: 657384.31,
          },
          {
            category: 'Accesorios',
            skus_visibles_filtro_bidireccional: '36',
            ventas_completadas_usd: 586859.56,
          },
          {
            category: 'Café en grano',
            skus_visibles_filtro_bidireccional: '36',
            ventas_completadas_usd: 413378.59,
          },
        ],
      },
      {
        label: 'Paso 2 — Solución unidireccional: la dimensión conserva sus 180 SKUs y las medidas resumen los hechos',
        explanation: 'Con flujo único `1 -> N` desde `products` hacia las ventas completadas (`LEFT JOIN`), `Accesorios` muestra sus 37 SKUs de catálogo, 36 SKUs con venta efectiva y 1 SKU sin venta completada, sin alterar los 586 859,56 USD facturados.',
        code: `WITH ventas_por_producto AS (
  SELECT
    oi.product_id,
    SUM(oi.line_total_usd) AS ventas_completadas_usd
  FROM order_items oi
  JOIN orders o ON oi.order_id = o.order_id
  WHERE o.status = 'completed'
  GROUP BY oi.product_id
)
SELECT
  p.category,
  COUNT(DISTINCT p.product_id) AS skus_totales_catalogo,
  COUNT(DISTINCT v.product_id) AS skus_con_venta,
  COUNT(DISTINCT p.product_id) - COUNT(DISTINCT v.product_id) AS skus_ocultos_por_bidireccional,
  ROUND(COALESCE(SUM(v.ventas_completadas_usd), 0), 2) AS ventas_completadas_usd
FROM products p
LEFT JOIN ventas_por_producto v ON p.product_id = v.product_id
GROUP BY p.category
ORDER BY ventas_completadas_usd DESC;`,
        expectedOutput: [
          {
            category: 'Molinos',
            skus_totales_catalogo: '36',
            skus_con_venta: '36',
            skus_ocultos_por_bidireccional: '0',
            ventas_completadas_usd: 2163162.27,
          },
          {
            category: 'Cafeteras',
            skus_totales_catalogo: '36',
            skus_con_venta: '36',
            skus_ocultos_por_bidireccional: '0',
            ventas_completadas_usd: 1643366.45,
          },
          {
            category: 'Suscripciones',
            skus_totales_catalogo: '35',
            skus_con_venta: '35',
            skus_ocultos_por_bidireccional: '0',
            ventas_completadas_usd: 657384.31,
          },
          {
            category: 'Accesorios',
            skus_totales_catalogo: '37',
            skus_con_venta: '36',
            skus_ocultos_por_bidireccional: '1',
            ventas_completadas_usd: 586859.56,
          },
          {
            category: 'Café en grano',
            skus_totales_catalogo: '36',
            skus_con_venta: '36',
            skus_ocultos_por_bidireccional: '0',
            ventas_completadas_usd: 413378.59,
          },
        ],
      },
    ],
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: 'En un esquema en estrella donde `customers` y `calendar` filtran a dos tablas de hechos (`orders` y `refunds`), ¿por qué es peligroso activar el filtro bidireccional (`Both`) entre `orders` y `customers`?',
      options: [
        {
          id: 'a',
          text: 'Porque un filtro en `calendar` puede propagarse a través de `orders` hacia `customers` y recortar `refunds` solo a los clientes que compraron en ese periodo, creando ambigüedad.',
          correct: true,
          feedback: 'Exacto. El filtro viaja de los hechos a la dimensión y contamina la segunda tabla de hechos por una ruta indirecta.',
        },
        {
          id: 'b',
          text: 'Porque el motor VertiPaq borra la tabla `refunds` cuando detecta dos flechas en una relación.',
          correct: false,
          feedback: 'Incorrecto. El motor no borra tablas; o bien rechaza activar la relación por ambigüedad, o bien sobre-filtra la otra tabla de hechos.',
        },
        {
          id: 'c',
          text: 'Porque las relaciones bidireccionales solo funcionan con columnas de texto y no con `customer_id`.',
          correct: false,
          feedback: 'Incorrecto. El tipo de dato entero sí es válido; el problema es la topología del grafo de propagación de filtros.',
        },
      ],
      explanation: 'En modelos con múltiples tablas de hechos que comparten dimensiones, el filtro bidireccional transmite el contexto de una tabla de hechos hacia otra a través de la dimensión común.',
    },
    {
      id: 'c2',
      type: 'mcq',
      prompt: 'Quieres que un segmentador de la dimensión `products` muestre únicamente los productos que tienen ventas en el mes seleccionado, sin activar el filtro bidireccional en la relación del modelo. ¿Qué recomienda Microsoft Learn?',
      options: [
        {
          id: 'a',
          text: 'Mantener la relación en dirección única (`Single`) y aplicar una medida de ventas (por ejemplo, `no está en blanco`) en el panel de filtros visuales de ese segmentador.',
          correct: true,
          feedback: 'Correcto. Filtrar el visual del segmentador con una medida logra el mismo efecto de interfaz sin alterar las relaciones globales ni crear ambigüedad.',
        },
        {
          id: 'b',
          text: 'Cambiar todas las relaciones del modelo a muchos a muchos con filtro en ambos sentidos.',
          correct: false,
          feedback: 'Incorrecto. Eso degrada el rendimiento de todos los visuales del reporte y expone el modelo a rutas ambiguas.',
        },
        {
          id: 'c',
          text: 'Importar solo la tabla `order_items` y eliminar la tabla `products` del modelo.',
          correct: false,
          feedback: 'Incorrecto. Eliminar la dimensión `products` te deja sin los nombres de producto, categorías y marcas para agrupar.',
        },
      ],
      explanation: 'Para sincronizar segmentadores desde los hechos, aplica un filtro de nivel visual basado en una medida sobre el segmentador o usa `CROSSFILTER` solo dentro de la medida que lo requiera.',
    },
    {
      id: 'c3',
      type: 'fill-code',
      prompt: 'Completa la expresión DAX que activa el filtro bidireccional entre `orders[customer_id]` y `customers[customer_id]` únicamente durante la evaluación de esa medida:',
      template: 'Clientes Con Pedido = CALCULATE( DISTINCTCOUNT( customers[customer_id] ), {{b1}}( orders[customer_id], customers[customer_id], {{b2}} ) )',
      blanks: [
        {
          id: 'b1',
          accepted: ['CROSSFILTER', 'crossfilter'],
        },
        {
          id: 'b2',
          accepted: ['Both', 'BOTH', 'both'],
        },
      ],
      explanation: 'La función `CROSSFILTER(columna1, columna2, Both)` modifica la dirección de filtro de una relación existente solo dentro del alcance de `CALCULATE`, manteniendo la relación física del modelo en flujo único.',
    },
  ],

  practice: {
    type: 'sql',
    title: 'Conteo de clientes registrados, con compra y con reembolso sin filtro bidireccional',
    language: 'sql',
    prompt: 'Manteniendo la dimensión `customers` como eje completo (lado 1 con `LEFT JOIN`), calcula por cada `country_code`: `clientes_registrados` (`COUNT(DISTINCT c.customer_id)`), `clientes_con_compra_completada` (`COUNT(DISTINCT CASE WHEN o.status = \'completed\' THEN o.customer_id END)`) y `clientes_con_reembolso` (`COUNT(DISTINCT CASE WHEN r.refund_id IS NOT NULL THEN o.customer_id END)`), ordenado por `clientes_con_reembolso DESC, c.country_code ASC`.',
    starterCode: `SELECT
  c.country_code,
  COUNT(DISTINCT c.customer_id) AS clientes_registrados,
  -- TODO: Cuenta los clientes distintos con pedido en status = 'completed' AS clientes_con_compra_completada
  0 AS clientes_con_compra_completada,
  -- TODO: Cuenta los clientes distintos cuyos pedidos tienen fila en refunds (r.refund_id IS NOT NULL) AS clientes_con_reembolso
  0 AS clientes_con_reembolso
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
-- TODO: Añade LEFT JOIN hacia refunds r por order_id
GROUP BY c.country_code
ORDER BY clientes_con_reembolso DESC, c.country_code ASC;`,
    expected: `SELECT
  c.country_code,
  COUNT(DISTINCT c.customer_id) AS clientes_registrados,
  COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.customer_id END) AS clientes_con_compra_completada,
  COUNT(DISTINCT CASE WHEN r.refund_id IS NOT NULL THEN o.customer_id END) AS clientes_con_reembolso
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
LEFT JOIN refunds r ON o.order_id = r.order_id
GROUP BY c.country_code
ORDER BY clientes_con_reembolso DESC, c.country_code ASC;`,
    orderMatters: true,
    hints: [
      'Añade `LEFT JOIN refunds r ON o.order_id = r.order_id` debajo del join con `orders`.',
      'Usa `COUNT(DISTINCT CASE WHEN o.status = \'completed\' THEN o.customer_id END) AS clientes_con_compra_completada`.',
      'Usa `COUNT(DISTINCT CASE WHEN r.refund_id IS NOT NULL THEN o.customer_id END) AS clientes_con_reembolso`.',
    ],
    solution: `SELECT
  c.country_code,
  COUNT(DISTINCT c.customer_id) AS clientes_registrados,
  COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.customer_id END) AS clientes_con_compra_completada,
  COUNT(DISTINCT CASE WHEN r.refund_id IS NOT NULL THEN o.customer_id END) AS clientes_con_reembolso
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
LEFT JOIN refunds r ON o.order_id = r.order_id
GROUP BY c.country_code
ORDER BY clientes_con_reembolso DESC, c.country_code ASC;`,
    solutionExplanation: 'La dimensión `customers` conserva los 400 clientes registrados por país, mientras que cada métrica evalúa los clientes distintos presentes en `orders` (`status = \'completed\'`) y en `refunds` sin que una tabla de hechos recorte a la otra.',
    expectedOutputTable: [
      {
        country_code: 'CO',
        clientes_registrados: 400,
        clientes_con_compra_completada: 400,
        clientes_con_reembolso: 80,
      },
      {
        country_code: 'AR',
        clientes_registrados: 400,
        clientes_con_compra_completada: 400,
        clientes_con_reembolso: 40,
      },
      {
        country_code: 'CL',
        clientes_registrados: 400,
        clientes_con_compra_completada: 364,
        clientes_con_reembolso: 40,
      },
      {
        country_code: 'ES',
        clientes_registrados: 400,
        clientes_con_compra_completada: 400,
        clientes_con_reembolso: 40,
      },
      {
        country_code: 'MX',
        clientes_registrados: 400,
        clientes_con_compra_completada: 364,
        clientes_con_reembolso: 40,
      },
      {
        country_code: 'PE',
        clientes_registrados: 400,
        clientes_con_compra_completada: 364,
        clientes_con_reembolso: 40,
      },
    ],
  },

  roleNotes: {
    bi: 'Revisa el diagrama de modelo antes de publicar cualquier reporte: todas las relaciones `1:N` entre dimensiones y hechos deben mostrar una sola punta de flecha (`1 -> *`). Reserva `Both` únicamente para una tabla puente cuando no pueda sustituirse por `CROSSFILTER`.',
    de: 'Si el equipo de BI activa filtros bidireccionales porque necesita atributos de una tabla de hechos en otra (por ejemplo `store_id` dentro de `refunds`), desnormaliza esa clave foránea directamente en la tabla de hechos del almacén.',
    da: 'Observa en los resultados que en Chile (`CL`), México (`MX`) y Perú (`PE`) hay 36 clientes registrados sin compras completadas (`364` de `400`). Con un filtro bidireccional activo desde ventas, esos 36 clientes inactivos quedarían invisibles.',
  },

  summary: [
    'En un esquema en estrella las relaciones deben propagar el filtro en una sola dirección: de la dimensión (1) a los hechos (N).',
    'El filtro bidireccional permanente degrada el rendimiento, oculta miembros sin ventas y genera rutas ambiguas entre tablas de hechos.',
    'Para contar entidades con actividad basta con aplicar `DISTINCTCOUNT` sobre la clave foránea de la tabla de hechos.',
    'Cuando un cálculo puntual requiera invertir o ampliar el flujo de filtro, utiliza `CROSSFILTER(..., Both)` dentro de `CALCULATE`.',
  ],

  flashcards: [
    {
      id: 'fc-bi2-ms-03-a',
      front: '¿En qué dirección fluyen los filtros por defecto en una relación 1:N bien modelada en Power BI?',
      back: 'En dirección única (Single): desde el lado 1 (la tabla de dimensión) hacia el lado N (la tabla de hechos).',
    },
    {
      id: 'fc-bi2-ms-03-b',
      front: '¿Qué problema de modelado aparece cuando activas filtros bidireccionales en un modelo con dos o más tablas de hechos y dimensiones compartidas?',
      back: 'Ambigüedad de rutas: existen dos o más caminos para que un filtro se propague de una tabla a otra, produciendo errores o recortes inesperados.',
    },
    {
      id: 'fc-bi2-ms-03-c',
      front: '¿Qué función DAX permite habilitar el filtrado bidireccional únicamente durante el cálculo de una medida sin tocar la relación física?',
      back: 'La función `CROSSFILTER(columna1, columna2, Both)` utilizada como modificador dentro de `CALCULATE`.',
    },
  ],

  glossaryTerms: [
    'filtro-cruzado-bidireccional',
    'cardinalidad-relaciones-bi',
    'tabla-puente-bridge',
  ],

  sources: [
    {
      title: 'Microsoft Learn — Bi-directional relationship guidance',
      url: 'https://learn.microsoft.com/en-us/power-bi/guidance/relationships-bidirectional-filtering',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Impacto en rendimiento y ambigüedad de los filtros bidireccionales y uso de filtros visuales en segmentadores.',
    },
    {
      title: 'Microsoft Learn — CROSSFILTER function (DAX)',
      url: 'https://learn.microsoft.com/en-us/dax/crossfilter-function',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Sintaxis y comportamiento de CROSSFILTER para alterar la dirección de filtro en tiempo de evaluación de una medida.',
    },
    {
      title: 'SQLBI — Bidirectional relationships and ambiguity in DAX',
      url: 'https://www.sqlbi.com/articles/bidirectional-relationships-and-ambiguity-in-dax/',
      publisher: 'SQLBI',
      accessed: '2026-10-29',
      supports: 'Demostración de ambigüedad entre múltiples tablas de hechos cuando se habilita el filtrado bidireccional.',
    },
  ],

  aiNotes: 'Cuando un estudiante pregunte por qué no dejar `Both` siempre activado si "hace que los segmentadores se filtren solos", muéstrale el caso de `customers`, `orders` y `refunds`: con `Both`, filtrar un producto o fecha en `orders` recorta `customers` y hace desaparecer en `refunds` las devoluciones de clientes que no compraron ese producto en ese día.',
};

export default lesson;
