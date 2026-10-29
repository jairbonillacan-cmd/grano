const lesson = {
  id: 'c1-sql-base-07-count-variantes',
  moduleId: 'c1-sql-base',
  tracks: ['core'],
  level: 1,
  order: 7,
  title: 'Diferencias entre COUNT(*), COUNT(col) y COUNT(DISTINCT)',
  minutes: 20,
  prerequisites: ['c1-sql-base-06-fechas-date-trunc'],
  contentVersion: 1,
  hook: 'En Mercado Brisa, la tabla `events` registra 65.000 eventos web (el 15 % son de visitantes anónimos con `customer_id IS NULL`) y la tabla `payments` tiene 19.200 filas para 18.000 pedidos debido a reintentos y webhooks duplicados. Un analista ejecuta `COUNT(*)` sobre `events` y afirma que 65.000 clientes distintos visitaron la tienda; otro ejecuta `COUNT(campaign_id)` sobre `orders` y dice que solo hubo 12.000 pedidos en total. ¿Qué cuenta exactamente cada variante de `COUNT`?',
  objectives: [
    'Distinguir con exactitud qué miden COUNT(*), COUNT(columna) y COUNT(DISTINCT columna) ante valores NULL y repetidos.',
    'Auditar la completitud de una columna calculando los nulos como COUNT(*) - COUNT(columna).',
    'Detectar filas duplicadas y verificar el grano de una tabla comparando COUNT(*) frente a COUNT(DISTINCT clave).'
  ],
  sections: [
    {
      id: 'las-tres-variantes-de-count',
      heading: 'Qué cuenta cada una de las tres variantes de COUNT',
      body: 'En SQL existen tres formas de escribir `COUNT`, y cada una responde a una pregunta distinta sobre la misma tabla:\n\n1. `COUNT(*)`: cuenta el total de **filas físicas** que llegaron al grupo, sin importar si todas sus columnas contienen `NULL` o valores repetidos.\n2. `COUNT(columna)`: cuenta únicamente las filas donde `columna` **no es `NULL`** (`columna IS NOT NULL`), pero sí incluye los valores repetidos.\n3. `COUNT(DISTINCT columna)`: cuenta cuántos **valores únicos no nulos** existen en `columna`, ignorando tanto los `NULL` como las repeticiones.\n\nMira cómo cambian los números en una sola consulta sobre la tabla `orders` de Mercado Brisa (`18.000` pedidos de `2.400` clientes, donde `12.000` pedidos tienen una de las `4` campañas promocionales y `6.000` tienen `campaign_id IS NULL`):',
      example: {
        language: 'sql',
        code: `SELECT
  COUNT(*) AS total_orders,
  COUNT(campaign_id) AS orders_with_campaign,
  COUNT(DISTINCT campaign_id) AS unique_campaigns,
  COUNT(DISTINCT customer_id) AS unique_customers
FROM orders;`,
        expectedOutput: [
          {
            total_orders: 18000,
            orders_with_campaign: 12000,
            unique_campaigns: 4,
            unique_customers: 2400
          }
        ]
      }
    },
    {
      id: 'auditoria-de-completitud-y-nulos',
      heading: 'Cómo medir la completitud de una columna sin filtrar la tabla',
      body: 'Gracias a la diferencia entre `COUNT(*)` y `COUNT(columna)`, puedes auditar cuántos valores `NULL` tiene cualquier columna sin necesidad de escribir una consulta aparte con `WHERE columna IS NULL`. La resta `COUNT(*) - COUNT(columna)` te da exactamente el número de filas con `NULL` en esa columna.\n\nPor ejemplo, en `orders`, `COUNT(*) - COUNT(campaign_id)` devuelve `18000 - 12000 = 6000` pedidos orgánicos sin campaña. Si además divides `COUNT(columna) * 100.0 / COUNT(*)`, obtienes el porcentaje de **completitud** de la columna (`66.67 %` para `campaign_id` en `orders`, o `90.92 %` para `postal_code` en `customers`). Este patrón te permite perfilar la calidad de diez columnas de una tabla en una sola lectura.'
    },
    {
      id: 'auditoria-de-cardinalidad-y-duplicados',
      heading: 'Cómo detectar duplicados y verificar el grano con COUNT(DISTINCT)',
      body: 'La comparación entre `COUNT(*)` y `COUNT(DISTINCT clave)` es la prueba diagnóstica principal antes de cruzar tablas o publicar un reporte. Si crees que el grano de una tabla es "1 fila = 1 pedido" (`order_id`), entonces `COUNT(*)` debe coincidir exactamente con `COUNT(DISTINCT order_id)`.\n\nVeamos qué ocurre al auditar la tabla `payments` de Mercado Brisa:\n\n- `COUNT(*)` devuelve `19.200` filas.\n- `COUNT(DISTINCT order_id)` devuelve `18.000` pedidos únicos.\n- `COUNT(DISTINCT idempotency_key)` devuelve `18.750` intentos reales de cobro.\n\nEsa sola línea revela toda la historia técnica: hubo `750` segundos intentos legítimos tras un fallo (`18.750 - 18.000`) y además existen `450` filas duplicadas por reenvío de webhook (`19.200 - 18.750`) que comparten la misma clave de idempotencia.'
    },
    {
      id: 'no-aditividad-de-count-distinct',
      heading: 'Por qué no puedes sumar los COUNT(DISTINCT) de varios grupos',
      body: 'Hay una propiedad matemática que separa a `COUNT(*)` de `COUNT(DISTINCT columna)`. `COUNT(*)` es aditivo: la suma de los pedidos de enero, febrero y marzo es exactamente igual al total de pedidos del trimestre. En cambio, **COUNT(DISTINCT)** es una métrica no aditiva.\n\nSi un mismo cliente compra en enero y vuelve a comprar en febrero, aparecerá contado en el `COUNT(DISTINCT customer_id)` de enero (`1`) y también en el de febrero (`1`). Si sumas los clientes únicos de cada mes, habrás contado a ese cliente dos veces. Del mismo modo, en la tabla `events` de Mercado Brisa, hay `1.600` clientes únicos que hicieron `add_to_cart` y los mismos `1.600` hicieron `checkout_started`; sumarlos daría `3.200`, cuando el total de clientes únicos en toda la tabla sigue siendo `1.600`. Para obtener el conteo único global debes recalcular `COUNT(DISTINCT)` al grano total.'
    }
  ],
  workedExample: {
    title: 'Tráfico web en events: eventos totales, eventos con sesión iniciada y clientes únicos',
    description: 'En la tabla `events` de Mercado Brisa (`65.000` filas), el 15 % de los eventos provienen de navegación sin sesión iniciada (`customer_id IS NULL`) y cada cliente realiza decenas de eventos. Compara el error de reportar filas como usuarios frente a usar las tres variantes.',
    steps: [
      {
        label: 'Antipatrón: usar COUNT(*) o COUNT(customer_id) como si fueran clientes únicos',
        explanation: 'Llamar `usuarios` a `COUNT(*)` infla el número con cada clic repetido y con sesiones anónimas; usar `COUNT(customer_id)` descarta los anónimos pero sigue contando múltiples clics de la misma persona.',
        code: `SELECT
  event_type,
  COUNT(*) AS supuestos_usuarios_totales,
  COUNT(customer_id) AS supuestos_usuarios_logueados
FROM events
GROUP BY event_type
ORDER BY supuestos_usuarios_totales DESC;`,
        expectedOutput: [
          {
            event_type: 'checkout_completed',
            supuestos_usuarios_totales: 15400,
            supuestos_usuarios_logueados: 14057
          },
          {
            event_type: 'checkout_started',
            supuestos_usuarios_totales: 15400,
            supuestos_usuarios_logueados: 14058
          },
          {
            event_type: 'add_to_cart',
            supuestos_usuarios_totales: 15400,
            supuestos_usuarios_logueados: 14056
          },
          {
            event_type: 'page_view',
            supuestos_usuarios_totales: 9400,
            supuestos_usuarios_logueados: 8056
          },
          {
            event_type: 'product_view',
            supuestos_usuarios_totales: 9400,
            supuestos_usuarios_logueados: 8058
          }
        ]
      },
      {
        label: 'Solución verificada: distinguir filas, eventos autenticados, anónimos y clientes únicos',
        explanation: 'Al poner juntos `COUNT(*)`, `COUNT(customer_id)`, `COUNT(*) - COUNT(customer_id)` y `COUNT(DISTINCT customer_id)`, separas el volumen de eventos del alcance real de personas únicas (`1.600` y `480`).',
        code: `SELECT
  event_type,
  COUNT(*) AS total_events,
  COUNT(customer_id) AS logged_in_events,
  COUNT(*) - COUNT(customer_id) AS anonymous_events,
  COUNT(DISTINCT customer_id) AS unique_logged_in_customers
FROM events
GROUP BY event_type
ORDER BY total_events DESC, event_type ASC;`,
        expectedOutput: [
          {
            event_type: 'add_to_cart',
            total_events: 15400,
            logged_in_events: 14056,
            anonymous_events: 1344,
            unique_logged_in_customers: 1600
          },
          {
            event_type: 'checkout_completed',
            total_events: 15400,
            logged_in_events: 14057,
            anonymous_events: 1343,
            unique_logged_in_customers: 1600
          },
          {
            event_type: 'checkout_started',
            total_events: 15400,
            logged_in_events: 14058,
            anonymous_events: 1342,
            unique_logged_in_customers: 1600
          },
          {
            event_type: 'page_view',
            total_events: 9400,
            logged_in_events: 8056,
            anonymous_events: 1344,
            unique_logged_in_customers: 480
          },
          {
            event_type: 'product_view',
            total_events: 9400,
            logged_in_events: 8058,
            anonymous_events: 1342,
            unique_logged_in_customers: 480
          }
        ]
      }
    ]
  },
  checks: [
    {
      id: 'chk-c1-sql-07-cinco-filas',
      type: 'predict-output',
      prompt: 'Una tabla de 5 filas contiene en la columna `cupon` los valores: `\'DESC10\'`, `\'DESC10\'`, `\'ENVIO\'`, `NULL`, `NULL`. ¿Qué devuelven `COUNT(*)`, `COUNT(cupon)` y `COUNT(DISTINCT cupon)`?',
      options: [
        {
          id: 'a',
          text: 'COUNT(*) = 5, COUNT(cupon) = 3 y COUNT(DISTINCT cupon) = 2.',
          correct: true,
          feedback: 'Exacto: hay 5 filas físicas en total, 3 filas con valor no nulo (\'DESC10\', \'DESC10\', \'ENVIO\') y 2 textos distintos (\'DESC10\' y \'ENVIO\').'
        },
        {
          id: 'b',
          text: 'COUNT(*) = 5, COUNT(cupon) = 5 y COUNT(DISTINCT cupon) = 3 (contando NULL como un valor más).',
          correct: false,
          feedback: 'Incorrecto. Tanto COUNT(cupon) como COUNT(DISTINCT cupon) ignoran por completo los valores NULL.'
        },
        {
          id: 'c',
          text: 'COUNT(*) = 3, COUNT(cupon) = 3 y COUNT(DISTINCT cupon) = 2.',
          correct: false,
          feedback: 'Incorrecto. COUNT(*) cuenta las filas de la tabla sin importar que tengan NULL en la columna cupon.'
        }
      ],
      explanation: 'COUNT(*) cuenta las 5 filas; COUNT(cupon) descarta los 2 NULL y devuelve 3; COUNT(DISTINCT cupon) descarta los NULL y las repeticiones de \'DESC10\', devolviendo 2.'
    },
    {
      id: 'chk-c1-sql-07-completitud',
      type: 'mcq',
      prompt: 'En la tabla `customers` (`2.400` filas), `COUNT(postal_code)` devuelve `2.182`. ¿Qué expresión calcula directamente cuántos clientes tienen `postal_code` en `NULL` dentro de la misma consulta?',
      options: [
        {
          id: 'a',
          text: 'COUNT(*) - COUNT(postal_code), que da 218 clientes sin código postal.',
          correct: true,
          feedback: 'Correcto. Restar las filas no nulas al total de filas entrega exactamente la cantidad de registros con NULL.'
        },
        {
          id: 'b',
          text: 'COUNT(postal_code) - COUNT(DISTINCT postal_code).',
          correct: false,
          feedback: 'Incorrecto. Esa resta mide cuántos clientes comparten un código postal repetido entre los que sí tienen dato, no cuántos son NULL.'
        },
        {
          id: 'c',
          text: 'COUNT(NULL), porque cuenta únicamente los valores nulos de la tabla.',
          correct: false,
          feedback: 'Incorrecto. COUNT(NULL) evalúa siempre a 0 porque COUNT(expresion) ignora todo argumento nulo.'
        }
      ],
      explanation: '`COUNT(*) - COUNT(col)` (o `COUNT(*) FILTER (WHERE col IS NULL)`) mide el total de valores nulos de una columna en una sola pasada.'
    },
    {
      id: 'chk-c1-sql-07-no-aditivo',
      type: 'mcq',
      prompt: 'Calculas `COUNT(DISTINCT customer_id)` por cada mes de 2025 en `orders` y obtienes 12 números. Si sumas esos 12 números, ¿el resultado coincide con el total de clientes únicos del año 2025?',
      options: [
        {
          id: 'a',
          text: 'No; la suma será mayor porque cualquier cliente que haya comprado en dos o más meses distintos se sumará varias veces.',
          correct: true,
          feedback: 'Exacto. COUNT(DISTINCT) no es aditivo a través del tiempo ni de otras dimensiones donde una entidad puede repetirse.'
        },
        {
          id: 'b',
          text: 'Sí; la suma de los clientes únicos mensuales siempre es igual al total anual de clientes únicos.',
          correct: false,
          feedback: 'Incorrecto. Eso solo ocurriría si ningún cliente volviera a comprar en otro mes del año.'
        },
        {
          id: 'c',
          text: 'No; la suma será menor porque COUNT(DISTINCT) descarta a los clientes recurrentes.',
          correct: false,
          feedback: 'Incorrecto. Cada mes incluye a sus clientes recurrentes, por lo que sumarlos infla el conteo en lugar de reducirlo.'
        }
      ],
      explanation: 'Un conteo distinto solo es válido para el grano exacto en que se calculó; nunca sumes columnas de `COUNT(DISTINCT)` de una tabla agrupada.'
    }
  ],
  practice: {
    type: 'sql',
    title: 'Auditoría de webhooks duplicados y pedidos únicos en payments',
    language: 'sql',
    prompt: 'Audita la tabla `payments` de Mercado Brisa agrupando por `payment_method`. Devuelve cinco columnas: `payment_method`, `COUNT(*) AS total_rows`, `COUNT(DISTINCT idempotency_key) AS unique_attempts`, `COUNT(*) - COUNT(DISTINCT idempotency_key) AS duplicate_webhook_rows` y `COUNT(DISTINCT order_id) AS unique_orders`. Ordena el resultado por `total_rows DESC, payment_method ASC`.',
    starterCode: `SELECT
  payment_method,
  COUNT(*) AS total_rows,
  COUNT(idempotency_key) AS unique_attempts,
  COUNT(order_id) AS unique_orders
FROM payments
GROUP BY payment_method
ORDER BY total_rows DESC, payment_method ASC;`,
    expected: `SELECT
  payment_method,
  COUNT(*) AS total_rows,
  COUNT(DISTINCT idempotency_key) AS unique_attempts,
  COUNT(*) - COUNT(DISTINCT idempotency_key) AS duplicate_webhook_rows,
  COUNT(DISTINCT order_id) AS unique_orders
FROM payments
GROUP BY payment_method
ORDER BY total_rows DESC, payment_method ASC;`,
    orderMatters: true,
    hints: [
      'Cambia `COUNT(idempotency_key)` por `COUNT(DISTINCT idempotency_key) AS unique_attempts` para contar las claves de idempotencia sin duplicados.',
      'Añade la cuarta columna restando `COUNT(*) - COUNT(DISTINCT idempotency_key) AS duplicate_webhook_rows`.',
      'Cambia `COUNT(order_id)` por `COUNT(DISTINCT order_id) AS unique_orders` para no contar dos veces los reintentos de un mismo pedido.'
    ],
    solution: `SELECT
  payment_method,
  COUNT(*) AS total_rows,
  COUNT(DISTINCT idempotency_key) AS unique_attempts,
  COUNT(*) - COUNT(DISTINCT idempotency_key) AS duplicate_webhook_rows,
  COUNT(DISTINCT order_id) AS unique_orders
FROM payments
GROUP BY payment_method
ORDER BY total_rows DESC, payment_method ASC;`,
    solutionExplanation: 'Usa `COUNT(*)` para el total de filas físicas (`4.800` por método), `COUNT(DISTINCT idempotency_key)` para los intentos únicos, su diferencia para aislar los `112`–`113` duplicados de webhook por método (`450` en total) y `COUNT(DISTINCT order_id)` para los `4.500` pedidos únicos.',
    expectedOutputTable: [
      {
        payment_method: 'billetera_digital',
        total_rows: 4800,
        unique_attempts: 4687,
        duplicate_webhook_rows: 113,
        unique_orders: 4500
      },
      {
        payment_method: 'card',
        total_rows: 4800,
        unique_attempts: 4688,
        duplicate_webhook_rows: 112,
        unique_orders: 4500
      },
      {
        payment_method: 'efectivo_tienda',
        total_rows: 4800,
        unique_attempts: 4687,
        duplicate_webhook_rows: 113,
        unique_orders: 4500
      },
      {
        payment_method: 'transferencia_spei',
        total_rows: 4800,
        unique_attempts: 4688,
        duplicate_webhook_rows: 112,
        unique_orders: 4500
      }
    ]
  },
  roleNotes: {
    de: 'Incluye siempre en tus pruebas de ingesta la comparación `COUNT(*) = COUNT(DISTINCT primary_key)`: es la forma más rápida de detectar si un reintento de red o un webhook duplicó registros en la capa de entrada.',
    da: 'En el primer bloque de cualquier análisis exploratorio, ejecuta una consulta con `COUNT(*)`, `COUNT(col)` y `COUNT(DISTINCT col)` sobre las claves principales; en cinco segundos sabrás el grano real, los nulos y los duplicados.',
    bi: 'Nunca pre-calcules `COUNT(DISTINCT customer_id)` en una tabla agregada diaria pensando en sumarla luego por mes en el tablero; las métricas de conteo distinto deben evaluarse sobre las filas detalladas o en la capa semántica.'
  },
  summary: [
    'COUNT(*) cuenta todas las filas físicas del grupo, tengan o no valores NULL.',
    'COUNT(columna) cuenta solo las filas donde esa columna no es NULL, incluyendo valores repetidos.',
    'COUNT(DISTINCT columna) cuenta cuántos valores únicos no nulos existen en la columna.',
    'Compara COUNT(*) contra COUNT(DISTINCT clave) para verificar el grano y detectar duplicados antes de hacer un JOIN.'
  ],
  flashcards: [
    {
      id: 'fc-c1-sql-07-a',
      front: '¿Qué diferencia exacta hay entre `COUNT(*)` y `COUNT(campaign_id)`?',
      back: '`COUNT(*)` cuenta todas las filas de la tabla; `COUNT(campaign_id)` ignora las filas donde `campaign_id` es `NULL`.'
    },
    {
      id: 'fc-c1-sql-07-b',
      front: '¿Cómo verificas en una sola línea SQL si la columna `order_id` tiene duplicados o nulos en una tabla?',
      back: 'Comprobando si `COUNT(*)` es exactamente igual a `COUNT(DISTINCT order_id)`.'
    },
    {
      id: 'fc-c1-sql-07-c',
      front: '¿Por qué `COUNT(DISTINCT customer_id)` se considera una métrica no aditiva?',
      back: 'Porque sumar los conteos únicos de varios días o categorías vuelve a contar a las personas que aparecen en más de un grupo.'
    }
  ],
  glossaryTerms: ['variantes-count-sql', 'deduplicacion-distinct', 'logica-trivalente-null'],
  sources: [
    {
      title: 'DuckDB SQL Reference — Aggregate Functions (count)',
      url: 'https://duckdb.org/docs/stable/sql/functions/aggregates',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Comportamiento de count(*), count(arg) y modificador DISTINCT en agregaciones.'
    },
    {
      title: 'PostgreSQL 17 Documentation — Section 9.21: Aggregate Functions',
      url: 'https://www.postgresql.org/docs/17/functions-aggregate.html',
      publisher: 'PostgreSQL Global Development Group',
      accessed: '2026-10-29',
      supports: 'Definición estándar de count(*) frente a count(any) y exclusión de valores nulos.'
    },
    {
      title: 'PostgreSQL 17 Documentation — Section 4.2.7: Aggregate Expressions (DISTINCT)',
      url: 'https://www.postgresql.org/docs/17/sql-expressions.html',
      publisher: 'PostgreSQL Global Development Group',
      accessed: '2026-10-29',
      supports: 'Sintaxis y evaluación de funciones agregadas con DISTINCT y FILTER.'
    }
  ],
  aiNotes: 'Conecta esta última lección del módulo con lo que viene en `c1-sql-joins`: antes de hacer cualquier `JOIN`, el alumno debe comparar `COUNT(*)` con `COUNT(DISTINCT clave)` en ambas tablas. Asegúrate de que no confunda `SELECT DISTINCT col` (devuelve filas) con `SELECT COUNT(DISTINCT col)` (devuelve un número).'
};

export default lesson;
