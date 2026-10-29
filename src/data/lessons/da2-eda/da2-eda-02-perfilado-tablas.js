const lesson = {
  id: 'da2-eda-02-perfilado-tablas',
  moduleId: 'da2-eda',
  tracks: ['da'],
  level: 2,
  order: 2,
  title: 'Perfilado de tablas: cardinalidad, completitud y asimetría',
  subtitle: 'Perfilado sistemático de tablas: cardinalidad, completitud, asimetría y dominios',
  minutes: 25,
  prerequisites: ['da2-eda-01-hipotesis-preguntas-refutables'],
  contentVersion: 1,

  hook: 'Ejecutar `SELECT * FROM events LIMIT 10` al recibir una tabla nueva equivale a evaluar la calidad de un lote de café mirando solo los diez primeros granos del saco. En `events` existen 65 000 filas, pero 1 200 son reintentos duplicados de red, 6 715 provienen de sesiones sin cliente autenticado y 9 400 carecen de identificador de producto. ¿Cómo radiografías en una sola lectura la cardinalidad, la completitud, los dominios y la asimetría de cualquier tabla antes de calcular una métrica comercial?',

  objectives: [
    'Construir consultas de perfilado en una sola lectura con conteos, cuantiles, completitud y coeficiente de asimetría.',
    'Calcular la cardinalidad y razón de unicidad para distinguir claves candidatas, llaves foráneas y dominios discretos.',
    'Diferenciar nulos estructurales propios del proceso de negocio frente a nulos por fallos de captura.',
  ],

  sections: [
    {
      id: 'sec-anatomia-perfilado',
      heading: 'Radiografía en una pasada: más allá de SELECT * LIMIT 10',
      body: 'Cuando abres una tabla desconocida con `SELECT * LIMIT 10`, solo compruebas que las columnas tienen nombre y tipo legible. Esa muestra minúscula no revela si la clave primaria se repite en la fila cuatro mil. Tampoco muestra si un tercio de las campañas está vacío o si los importes tienen cola derecha.\n\nEl **perfilado sistemático de tablas** (*data profiling*) sustituye la inspección visual por un resumen estadístico en una sola lectura columnar. En DuckDB dispones de `SUMMARIZE orders;`, que calcula conteo, porcentaje de nulos, cardinalidad aproximada (`approx_unique`), mínimo, máximo, media, desviación estándar y cuartiles (`q25`, `q50`, `q75`). En Python con Polars, el equivalente combina `df.describe()` con `df.n_unique()`.\n\nPara auditar columnas con precisión exacta dentro de un script versionado, escribes una consulta SQL de perfilado explícito. En `orders`, una sola pasada confirma `18 000` filas, `18 000` `order_id` únicos, `2 400` clientes distintos, `66.67 %` de completitud en `campaign_id`, mediana de `350.16 USD`, media de `426.10 USD` y asimetría de `0.98`.',
      example: {
        language: 'sql',
        code: `SELECT
  COUNT(*) AS filas_totales,
  COUNT(DISTINCT order_id) AS pk_distintos,
  COUNT(DISTINCT customer_id) AS clientes_distintos,
  ROUND(COUNT(campaign_id) * 100.0 / COUNT(*), 2) AS completitud_campana_pct,
  ROUND(MIN(total_usd), 2) AS min_usd,
  ROUND(QUANTILE_CONT(total_usd, 0.50), 2) AS p50_usd,
  ROUND(AVG(total_usd), 2) AS media_usd,
  ROUND(QUANTILE_CONT(total_usd, 0.90), 2) AS p90_usd,
  ROUND(MAX(total_usd), 2) AS max_usd,
  ROUND(SKEWNESS(total_usd), 2) AS asimetria
FROM orders;`,
        expectedOutput: [
          {
            filas_totales: 18000,
            pk_distintos: 18000,
            clientes_distintos: 2400,
            completitud_campana_pct: 66.67,
            min_usd: 13.13,
            p50_usd: 350.16,
            media_usd: 426.1,
            p90_usd: 876.17,
            max_usd: 1925.73,
            asimetria: 0.98,
          },
        ],
      },
    },
    {
      id: 'sec-cardinalidad-dominios',
      heading: 'Cardinalidad, razón de unicidad y dominios categóricos',
      body: 'La **cardinalidad** de una columna es su cantidad de valores distintos (`COUNT(DISTINCT col)`). Al dividirla entre el total de filas (`COUNT(*)`), obtienes la **razón de unicidad**. Este cociente clasifica de inmediato el papel estructural de cada atributo:\n\n- **Razón igual a `1.0` (`100 %`):** identifica una clave candidata limpia, como `order_id` en `orders` (`18 000 / 18 000`). Si una clave de evento o de idempotencia arroja menos de `1.0` —como `event_id` en `events` (`0.9815`) o `idempotency_key` en `payments` (`0.9766`)—, existen duplicados técnicos.\n\n- **Razón intermedia (`0.01` a `0.50`):** corresponde a llaves foráneas repetidas, como `customer_id` en `orders` (`2 400 / 18 000 = 0.1333`, con media de `7.5` pedidos por cliente).\n\n- **Razón muy baja (`< 0.001`):** señala un **dominio categórico discreto**, como `orders.status` (`4` valores) o `events.event_type` (`5` valores).\n\nEn toda columna de baja cardinalidad debes listar sus valores distintos y frecuencias (`GROUP BY col`). Así verificas que no existan etiquetas fuera de contrato ni errores de mayúsculas.',
    },
    {
      id: 'sec-nulos-estructurales-captura',
      heading: 'Completitud: nulo estructural frente a fallo de captura',
      body: 'La tasa de completitud (`COUNT(col) * 100.0 / COUNT(*)`) mide qué porcentaje de filas contiene un valor no nulo. Sin embargo, hallar nulos no implica que la tabla esté dañada. El perfilado distingue dos orígenes opuestos.\n\nUn **nulo estructural** ocurre cuando el atributo no aplica por la naturaleza del evento. En `orders`, el `33.33 %` de filas sin `campaign_id` (`6 000` pedidos) corresponde a compras orgánicas sin anuncio pagado. En `events`, las `9 400` filas de `page_view` tienen `0 %` en `product_id` porque visitar la portada no apunta a ningún producto. Asimismo, los `6 715` eventos con `customer_id IS NULL` (`10.33 %`) provienen de visitantes sin sesión iniciada.\n\nEn cambio, un **nulo por fallo de captura** representa un dato real perdido o mal grabado. En `customers`, hay `218` filas con `postal_code IS NULL` (`90.92 %` de completitud nominal). Además existen `129` filas donde `postal_code` quedó truncado a solo dos caracteres (`LENGTH(postal_code) < 5`). Si perfilas solo con `COUNT(postal_code)`, ignorarás esas `129` cadenas truncadas y no verás los `347` registros incompletos.',
    },
    {
      id: 'sec-asimetria-cuantiles',
      heading: 'Asimetría y cuantiles: diagnosticar la forma sin graficar',
      body: 'En las columnas numéricas continuas, consultar únicamente `MIN`, `AVG` y `MAX` oculta la distribución interna. El perfilado completo incorpora cuantiles (`p25`, `p50` o mediana, `p75` y `p90`) junto con el coeficiente de **asimetría muestral** (`SKEWNESS(col)`).\n\nEn `orders.total_usd`, el perfilado en una pasada mostró mínimo de `13.13 USD`, mediana (`p50`) de `350.16 USD`, media de `426.10 USD`, percentil 90 de `876.17 USD`, máximo de `1 925.73 USD` y asimetría de `0.98`. Dos señales numéricas saltan a la vista sin trazar un gráfico:\n\n1. La media supera a la mediana en `75.94 USD` (`+21.7 %`). Esto confirma un sesgo positivo hacia la derecha impulsado por pedidos corporativos de cafeterías.\n\n2. La distancia entre el `p50` y el `p90` (`526.01 USD`) supera en un cincuenta por ciento a toda la mitad inferior (`337.03 USD`).\n\nAdemás, revisar el mínimo (`MIN`) permite detectar de inmediato violaciones de dominio físico —como precios negativos de prueba— antes de sumar o promediar.',
    },
  ],

  workedExample: {
    title: 'Matriz de perfilado de events por tipo de evento (event_type)',
    description:
      'Perfila las 65 000 filas de events desglosadas por event_type para cuantificar duplicados de red, sesiones anónimas y nulos estructurales en product_id antes de armar un embudo de conversión.',
    steps: [
      {
        label: 'Paso 1: Conteo superficial por event_type sin auditar unicidad ni product_id',
        explanation:
          'Un conteo ingenuo sugiere que hay 15 400 eventos de compra y carrito, ocultando los reintentos duplicados de red y pasando por alto el estado de `product_id`.',
        code: `SELECT
  event_type,
  COUNT(*) AS filas_totales,
  COUNT(customer_id) AS con_cliente
FROM events
GROUP BY event_type
ORDER BY filas_totales DESC, event_type ASC;`,
        expectedOutput: [
          { event_type: 'add_to_cart', filas_totales: 15400, con_cliente: 14056 },
          { event_type: 'checkout_completed', filas_totales: 15400, con_cliente: 14057 },
          { event_type: 'checkout_started', filas_totales: 15400, con_cliente: 14058 },
          { event_type: 'page_view', filas_totales: 9400, con_cliente: 8056 },
          { event_type: 'product_view', filas_totales: 9400, con_cliente: 8058 },
        ],
      },
      {
        label: 'Paso 2: Matriz completa con eventos únicos, duplicados de red y tasas de completitud',
        explanation:
          'El perfilado expone tres hechos: 1) cada uno de los 5 tipos de evento tiene exactamente 240 duplicados de red (1 200 en total); 2) entre el 8.7 % y el 14.3 % del tráfico ocurre sin sesión iniciada (`customer_id IS NULL`); y 3) el 0 % de `product_id` en `page_view` es un nulo estructural.',
        code: `SELECT
  event_type,
  COUNT(*) AS filas_totales,
  COUNT(DISTINCT event_id) AS eventos_unicos,
  COUNT(*) - COUNT(DISTINCT event_id) AS duplicados_red,
  ROUND(COUNT(customer_id) * 100.0 / COUNT(*), 2) AS completitud_cliente_pct,
  ROUND(COUNT(product_id) * 100.0 / COUNT(*), 2) AS completitud_producto_pct
FROM events
GROUP BY event_type
ORDER BY filas_totales DESC, event_type ASC;`,
        expectedOutput: [
          {
            event_type: 'add_to_cart',
            filas_totales: 15400,
            eventos_unicos: 15160,
            duplicados_red: 240,
            completitud_cliente_pct: 91.27,
            completitud_producto_pct: 100,
          },
          {
            event_type: 'checkout_completed',
            filas_totales: 15400,
            eventos_unicos: 15160,
            duplicados_red: 240,
            completitud_cliente_pct: 91.28,
            completitud_producto_pct: 100,
          },
          {
            event_type: 'checkout_started',
            filas_totales: 15400,
            eventos_unicos: 15160,
            duplicados_red: 240,
            completitud_cliente_pct: 91.29,
            completitud_producto_pct: 100,
          },
          {
            event_type: 'page_view',
            filas_totales: 9400,
            eventos_unicos: 9160,
            duplicados_red: 240,
            completitud_cliente_pct: 85.7,
            completitud_producto_pct: 0,
          },
          {
            event_type: 'product_view',
            filas_totales: 9400,
            eventos_unicos: 9160,
            duplicados_red: 240,
            completitud_cliente_pct: 85.72,
            completitud_producto_pct: 100,
          },
        ],
      },
    ],
  },

  checks: [
    {
      id: 'chk-da2-eda-02-cardinalidad',
      type: 'mcq',
      prompt:
        'Al perfilar `payments` (`19 200` filas), la columna `idempotency_key` arroja `COUNT(DISTINCT idempotency_key) = 18 750` (razón de unicidad `0.9766`). ¿Qué diagnóstico se desprende de esta cifra?',
      options: [
        {
          id: 'a',
          text: 'Que idempotency_key es un dominio categórico discreto similar a payment_method.',
          correct: false,
          feedback:
            'Incorrecto. Un dominio categórico tendría una razón cercana a 0 (pocas categorías en miles de filas), no 0.9766.',
        },
        {
          id: 'b',
          text: 'Que existen 450 filas repetidas para una misma clave de idempotencia (duplicados técnicos de webhook).',
          correct: true,
          feedback:
            'Exacto. 19 200 filas totales menos 18 750 claves distintas revela exactamente 450 registros duplicados.',
        },
        {
          id: 'c',
          text: 'Que 450 filas tienen idempotency_key con valor NULL.',
          correct: false,
          feedback:
            'Incorrecto. En payments no hay idempotency_key nulos; la diferencia proviene de claves repetidas.',
        },
      ],
      explanation:
        'Si todas las filas tienen idempotency_key no nulo pero COUNT(DISTINCT idempotency_key) es 18 750 frente a 19 200 filas, la diferencia (19 200 - 18 750 = 450) corresponde a webhooks repetidos que inflarían cualquier suma directa.',
    },
    {
      id: 'chk-da2-eda-02-nulo-estructural',
      type: 'predict-output',
      prompt:
        'En `events`, `product_id` tiene `0 %` de completitud en las `9 400` filas de `page_view` y `100 %` en los demás tipos de evento. ¿Qué acción debe tomar el analista?',
      options: [
        {
          id: 'a',
          text: 'Eliminar las 9 400 filas de page_view porque están corruptas al carecer de product_id.',
          correct: false,
          feedback:
            'Incorrecto. Borrar page_view destruiría el conteo de visitas a la portada y páginas generales.',
        },
        {
          id: 'b',
          text: 'Imputar en esas 9 400 filas el product_id más vendido del catálogo para alcanzar el 100 % de completitud.',
          correct: false,
          feedback:
            'Incorrecto. Asignar un producto falso a una visita de portada fabricaría miles de vistas ficticias para ese SKU.',
        },
        {
          id: 'c',
          text: 'Conservar las filas reconociendo un nulo estructural: un evento page_view general no está asociado a un producto específico.',
          correct: true,
          feedback:
            'Correcto. Un nulo estructural refleja que el atributo no aplica a ese tipo de evento y no constituye un error.',
        },
      ],
      explanation:
        'Un nulo estructural refleja que el atributo no aplica a esa entidad o evento. Imputar un producto ficticio o borrar las visitas a páginas generales destruiría el denominador real del tráfico web.',
    },
    {
      id: 'chk-da2-eda-02-fill-postal',
      type: 'fill-code',
      prompt:
        'Completa la expresión para contar en `customers` los `347` registros cuyo `postal_code` es nulo o quedó truncado a menos de 5 caracteres:',
      template: `SELECT
  COUNT(*) {{b1}} (WHERE postal_code IS NULL OR {{b2}}(postal_code) < 5) AS cp_incompletos
FROM customers;`,
      blanks: [
        { id: 'b1', accepted: ['FILTER', 'filter'] },
        { id: 'b2', accepted: ['LENGTH', 'length', 'STRLEN', 'strlen'] },
      ],
      explanation:
        'Usar `COUNT(*) FILTER (WHERE postal_code IS NULL OR LENGTH(postal_code) < 5)` captura tanto los 218 valores `NULL` como las 129 cadenas truncadas de 2 caracteres que `COUNT(postal_code)` daba por válidas.',
    },
    {
      id: 'chk-da2-eda-02-asimetria',
      type: 'mcq',
      prompt:
        'El perfilado de `orders.total_usd` reporta `p50 = 350.16 USD`, `media = 426.10 USD`, `p90 = 876.17 USD` y `asimetria = 0.98`. ¿Qué indica esta combinación?',
      options: [
        {
          id: 'a',
          text: 'Que la distribución es simétrica y la media representa fielmente al pedido típico.',
          correct: false,
          feedback:
            'Incorrecto. En una distribución simétrica la media y la mediana coinciden y la asimetría es cercana a 0.',
        },
        {
          id: 'b',
          text: 'Que existe asimetría positiva (cola derecha larga) donde una minoría de pedidos altos eleva la media 75.94 USD por encima de la mediana.',
          correct: true,
          feedback:
            'Exacto. El coeficiente 0.98 y la brecha entre 426.10 USD (media) y 350.16 USD (mediana) confirman sesgo positivo.',
        },
        {
          id: 'c',
          text: 'Que el 90 % de los pedidos de Mercado Brisa supera los 876.17 USD.',
          correct: false,
          feedback:
            'Incorrecto. Un p90 de 876.17 USD significa que el 90 % de los pedidos es menor o igual a 876.17 USD y solo el 10 % lo supera.',
        },
      ],
      explanation:
        'Un coeficiente de asimetría positivo (0.98) acompañado de una media bastante mayor que la mediana (426.10 USD frente a 350.16 USD) confirma una cola derecha pronunciada.',
    },
  ],

  practice: {
    type: 'sql',
    title: 'Matriz de perfilado transversal sobre customers, orders, payments y products',
    language: 'sql',
    prompt:
      'Construye una matriz de perfilado transversal que audite en una sola consulta cuatro tablas centrales de Mercado Brisa (`customers`, `orders`, `payments` y `products`) uniendo cuatro bloques con `UNION ALL`. Para cada tabla devuelve: `tabla` (`\'1_customers\'`, `\'2_orders\'`, `\'3_payments\'` y `\'4_products\'`), `filas_totales` (`COUNT(*)`), `claves_unicas` (`COUNT(DISTINCT ...)` de su clave de negocio o idempotencia: `customer_id`, `order_id`, `idempotency_key`, `product_id`), `duplicados_pk` (`COUNT(*) - COUNT(DISTINCT ...)`), y `registros_alerta` definido así: en `customers`, filas con `postal_code IS NULL OR LENGTH(postal_code) < 5`; en `orders`, filas con `campaign_id IS NULL`; en `payments`, filas con `amount_usd <= 0`; y en `products`, filas con `list_price_usd <= 0`. Ordena el resultado por `tabla ASC`.',
    starterCode: `SELECT
  '1_customers' AS tabla,
  COUNT(*) AS filas_totales,
  COUNT(DISTINCT customer_id) AS claves_unicas,
  COUNT(*) - COUNT(DISTINCT customer_id) AS duplicados_pk,
  -- Cuenta clientes con postal_code IS NULL OR LENGTH(postal_code) < 5
  0 AS registros_alerta
FROM customers
UNION ALL
SELECT
  '2_orders' AS tabla,
  COUNT(*) AS filas_totales,
  COUNT(DISTINCT order_id) AS claves_unicas,
  COUNT(*) - COUNT(DISTINCT order_id) AS duplicados_pk,
  -- Cuenta pedidos con campaign_id IS NULL
  0 AS registros_alerta
FROM orders
-- Completa los bloques UNION ALL para '3_payments' (usando idempotency_key) y '4_products'
ORDER BY tabla ASC;`,
    expected: `SELECT
  '1_customers' AS tabla,
  COUNT(*) AS filas_totales,
  COUNT(DISTINCT customer_id) AS claves_unicas,
  COUNT(*) - COUNT(DISTINCT customer_id) AS duplicados_pk,
  COUNT(*) FILTER (WHERE postal_code IS NULL OR LENGTH(postal_code) < 5) AS registros_alerta
FROM customers
UNION ALL
SELECT
  '2_orders' AS tabla,
  COUNT(*) AS filas_totales,
  COUNT(DISTINCT order_id) AS claves_unicas,
  COUNT(*) - COUNT(DISTINCT order_id) AS duplicados_pk,
  COUNT(*) FILTER (WHERE campaign_id IS NULL) AS registros_alerta
FROM orders
UNION ALL
SELECT
  '3_payments' AS tabla,
  COUNT(*) AS filas_totales,
  COUNT(DISTINCT idempotency_key) AS claves_unicas,
  COUNT(*) - COUNT(DISTINCT idempotency_key) AS duplicados_pk,
  COUNT(*) FILTER (WHERE amount_usd <= 0) AS registros_alerta
FROM payments
UNION ALL
SELECT
  '4_products' AS tabla,
  COUNT(*) AS filas_totales,
  COUNT(DISTINCT product_id) AS claves_unicas,
  COUNT(*) - COUNT(DISTINCT product_id) AS duplicados_pk,
  COUNT(*) FILTER (WHERE list_price_usd <= 0) AS registros_alerta
FROM products
ORDER BY tabla ASC;`,
    orderMatters: true,
    hints: [
      'En el bloque de customers, usa COUNT(*) FILTER (WHERE postal_code IS NULL OR LENGTH(postal_code) < 5) para capturar tanto los 218 NULL como las 129 cadenas truncadas (347 en total).',
      'En el bloque de payments (clave de idempotencia idempotency_key), calcula duplicados_pk como COUNT(*) - COUNT(DISTINCT idempotency_key) y registros_alerta con COUNT(*) FILTER (WHERE amount_usd <= 0).',
      'En el bloque de products (clave primaria product_id), calcula registros_alerta con COUNT(*) FILTER (WHERE list_price_usd <= 0) y cierra la consulta con ORDER BY tabla ASC.',
    ],
    solution: `SELECT
  '1_customers' AS tabla,
  COUNT(*) AS filas_totales,
  COUNT(DISTINCT customer_id) AS claves_unicas,
  COUNT(*) - COUNT(DISTINCT customer_id) AS duplicados_pk,
  COUNT(*) FILTER (WHERE postal_code IS NULL OR LENGTH(postal_code) < 5) AS registros_alerta
FROM customers
UNION ALL
SELECT
  '2_orders' AS tabla,
  COUNT(*) AS filas_totales,
  COUNT(DISTINCT order_id) AS claves_unicas,
  COUNT(*) - COUNT(DISTINCT order_id) AS duplicados_pk,
  COUNT(*) FILTER (WHERE campaign_id IS NULL) AS registros_alerta
FROM orders
UNION ALL
SELECT
  '3_payments' AS tabla,
  COUNT(*) AS filas_totales,
  COUNT(DISTINCT idempotency_key) AS claves_unicas,
  COUNT(*) - COUNT(DISTINCT idempotency_key) AS duplicados_pk,
  COUNT(*) FILTER (WHERE amount_usd <= 0) AS registros_alerta
FROM payments
UNION ALL
SELECT
  '4_products' AS tabla,
  COUNT(*) AS filas_totales,
  COUNT(DISTINCT product_id) AS claves_unicas,
  COUNT(*) - COUNT(DISTINCT product_id) AS duplicados_pk,
  COUNT(*) FILTER (WHERE list_price_usd <= 0) AS registros_alerta
FROM products
ORDER BY tabla ASC;`,
    solutionExplanation:
      'La matriz resume el estado de las cuatro tablas: `customers` tiene 347 códigos postales incompletos (`218` nulos y `129` truncados); `orders` tiene 6 000 nulos estructurales en `campaign_id` (pedidos orgánicos); `payments` presenta 450 `idempotency_key` duplicadas; y `products` contiene 1 artículo con precio negativo (`SKU-TEST-NEG`).',
    expectedOutputTable: [
      {
        tabla: '1_customers',
        filas_totales: 2400,
        claves_unicas: 2400,
        duplicados_pk: 0,
        registros_alerta: 347,
      },
      {
        tabla: '2_orders',
        filas_totales: 18000,
        claves_unicas: 18000,
        duplicados_pk: 0,
        registros_alerta: 6000,
      },
      {
        tabla: '3_payments',
        filas_totales: 19200,
        claves_unicas: 18750,
        duplicados_pk: 450,
        registros_alerta: 0,
      },
      {
        tabla: '4_products',
        filas_totales: 180,
        claves_unicas: 180,
        duplicados_pk: 0,
        registros_alerta: 1,
      },
    ],
  },

  roleNotes: {
    da: 'Como analista de datos, ejecuta siempre tu consulta de perfilado transversal antes de abrir cualquier gráfico o escribir un `JOIN`. Quince segundos invertidos en auditar unicidad y completitud evitan presentar un informe inflado por los `450` webhooks repetidos de `payments` o los `1 200` eventos duplicados de `events`.',
    de: 'Desde ingeniería de datos, las métricas de perfilado (`duplicados_pk`, porcentaje de cadenas truncadas y valores fuera de dominio como `list_price_usd <= 0`) deben convertirse en aserciones automatizadas en la etapa de publicación para bloquear lotes corruptos antes de que lleguen al almacén analítico.',
    bi: 'En inteligencia de negocios, distingue en la documentación del modelo semántico qué columnas tienen nulos estructurales (`campaign_id` en compras orgánicas o `product_id` en `page_view`) para que los diseñadores de reportes usen `COALESCE(campaign_id, \'organico\')` en lugar de filtrar esas filas.',
  },

  summary: [
    'El perfilado sistemático reemplaza `SELECT * LIMIT 10` por una lectura columnar con conteos, unicidad, completitud, cuantiles y asimetría.',
    'La razón de unicidad (`COUNT(DISTINCT col) / COUNT(*)`) distingue claves limpias, llaves con duplicados técnicos, llaves foráneas y dominios discretos.',
    'Un nulo estructural indica que el atributo no aplica al evento (`product_id` en `page_view`), a diferencia de un fallo de captura.',
    'En columnas de texto, medir completitud exige validar también la longitud mínima (`LENGTH(col) >= 5`), pues `COUNT(col)` solo ignora `NULL`.',
  ],

  flashcards: [
    {
      id: 'fc-da2-eda-02-01',
      front: '¿Qué información aporta la razón de unicidad COUNT(DISTINCT col) * 1.0 / COUNT(*) durante el perfilado?',
      back: 'Si vale 1.0 identifica una clave candidata sin duplicados; si es menor a 1.0 en una supuesta clave primaria revela duplicados técnicos; y si es muy cercana a 0 señala un dominio categórico discreto.',
    },
    {
      id: 'fc-da2-eda-02-02',
      front: '¿En qué se diferencia un nulo estructural de un nulo por fallo de captura en Mercado Brisa?',
      back: 'El nulo estructural ocurre porque el dato no aplica al proceso (como product_id nulo en las 9 400 filas de page_view); el fallo de captura es un dato real omitido o truncado (como los 347 códigos postales incompletos en customers).',
    },
    {
      id: 'fc-da2-eda-02-03',
      front: '¿Por qué COUNT(postal_code) sobreestima la completitud en la tabla customers?',
      back: 'Porque COUNT(columna) solo ignora los 218 valores NULL y cuenta como válidas las 129 filas cuyo código postal quedó truncado a 2 caracteres, pasando por alto 129 registros incompletos.',
    },
    {
      id: 'fc-da2-eda-02-04',
      front: '¿Cuándo conviene usar SUMMARIZE frente a una consulta SQL explícita con COUNT(DISTINCT) en DuckDB?',
      back: 'SUMMARIZE es ideal para una primera exploración rápida de todas las columnas, pero usa HyperLogLog (approx_unique); para auditar duplicados exactos de clave primaria se requiere COUNT(*) - COUNT(DISTINCT pk).',
    },
  ],

  glossaryTerms: [
    'perfilado-datos',
    'cardinalidad-relativa',
    'nulo-estructural',
    'idempotencia-duplicados',
  ],

  sources: [
    {
      title: 'DuckDB Documentation — SUMMARIZE Statement',
      url: 'https://duckdb.org/docs/guides/meta/summarize.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports:
        'Perfilado automático de todas las columnas de una tabla con estadísticos descriptivos, cuartiles y porcentaje de nulos.',
    },
    {
      title: 'Polars Official API Reference — polars.DataFrame.describe',
      url: 'https://docs.pola.rs/api/python/stable/reference/dataframe/api/polars.DataFrame.describe.html',
      publisher: 'Polars Project',
      accessed: '2026-10-29',
      supports:
        'Inspección columnar rápida en Python mediante conteos no nulos, null_count y cuantiles.',
    },
    {
      title: 'DuckDB Documentation — Aggregate Functions (COUNT, MEDIAN, QUANTILE_CONT, SKEWNESS)',
      url: 'https://duckdb.org/docs/sql/functions/aggregates.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports:
        'Cálculo exacto de cardinalidad, cuantiles continuos y coeficiente de asimetría muestral en SQL.',
    },
    {
      title: 'Polars User Guide — Missing Data',
      url: 'https://docs.pola.rs/user-guide/expressions/missing-data/',
      publisher: 'Polars Project',
      accessed: '2026-10-29',
      supports:
        'Evaluación contextual de datos ausentes antes de decidir si imputar, conservar o filtrar.',
    },
  ],

  aiNotes:
    'Recuerda al estudiante que `COUNT(columna)` en SQL solo descuenta `NULL` y no detecta códigos postales truncados a 2 caracteres (`LENGTH(postal_code) < 5`). En la práctica con `UNION ALL`, verifica que use los alias exactos (`tabla`, `filas_totales`, `claves_unicas`, `duplicados_pk`, `registros_alerta`) y las etiquetas `\'1_customers\'`, `\'2_orders\'`, `\'3_payments\'`, `\'4_products\'`.',
};

export default lesson;
