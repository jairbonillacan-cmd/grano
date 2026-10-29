const lesson = {
  id: 'c0-negocio-01-ingreso-costo-margen',
  moduleId: 'c0-negocio',
  tracks: ['core'],
  level: 0,
  order: 1,
  title: 'Ingreso bruto, descuentos, devoluciones y margen bruto',
  minutes: 20,
  prerequisites: [],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), el panel de ventas muestra 7,67 millones de dólares facturados en 18 000 pedidos. Sin embargo, tesorería informa que una parte corresponde a impuestos recaudados para el fisco, pedidos cancelados o pendientes, descuentos promocionales y devoluciones de clientes. Además, la categoría Suscripciones factura más que Accesorios, pero deja menos dinero libre tras pagar a los proveedores. ¿Cómo calculas cuánto dinero entra y cuánto queda realmente en la empresa?',

  objectives: [
    'Distinguir entre ingreso bruto, descuentos, impuestos recaudados, devoluciones e ingreso neto sobre pedidos reales.',
    'Calcular el costo directo de ventas (COGS) y el margen bruto en dólares y en porcentaje.',
    'Agregar porcentajes de margen dividiendo la suma del margen entre la suma del ingreso sin promediar porcentajes.'
  ],

  sections: [
    {
      id: 'del-ingreso-bruto-al-ingreso-neto',
      heading: 'Por qué el total cobrado en caja no es el ingreso de la empresa',
      body: 'Cuando alguien compra café en Mercado Brisa (empresa ficticia), la tabla `orders` guarda cinco importes por pedido. Estos son `subtotal_usd` (suma de líneas), `discount_usd` (cupón al pedido), `shipping_usd` (envío), `tax_usd` (impuestos) y `total_usd` (cobro en tarjeta).\n\nSegún las normas contables (IFRS 15), el dinero recaudado por impuestos (`tax_usd`) pertenece a la autoridad fiscal, no a la tienda. Tampoco son ingreso los pedidos con estado `cancelled` (1 080 filas) o `pending` (720 filas).\n\nEl **ingreso bruto** de mercancía parte de `subtotal_usd` en pedidos entregados o reembolsados. Al restarle los descuentos (`discount_usd`) y las devoluciones procesadas en `refunds`, obtenemos el **ingreso neto**: el dinero de ventas que conserva el negocio.',
      example: {
        language: 'sql',
        code: `SELECT
  status,
  COUNT(order_id) AS pedidos,
  ROUND(SUM(subtotal_usd), 2) AS ingreso_bruto_usd,
  ROUND(SUM(discount_usd), 2) AS descuentos_cabecera_usd,
  ROUND(SUM(subtotal_usd - discount_usd), 2) AS venta_neta_antes_dev_usd,
  ROUND(SUM(tax_usd), 2) AS impuestos_recaudados_usd,
  ROUND(SUM(total_usd), 2) AS total_cobrado_usd
FROM orders
GROUP BY status
ORDER BY pedidos DESC;`,
        expectedOutput: [
          {
            status: 'completed',
            pedidos: 14760,
            ingreso_bruto_usd: 5464151.18,
            descuentos_cabecera_usd: 59761.41,
            venta_neta_antes_dev_usd: 5404389.77,
            impuestos_recaudados_usd: 864702.15,
            total_cobrado_usd: 6269462.42
          },
          {
            status: 'refunded',
            pedidos: 1440,
            ingreso_bruto_usd: 527078.6,
            descuentos_cabecera_usd: 5543.99,
            venta_neta_antes_dev_usd: 521534.61,
            impuestos_recaudados_usd: 83445.47,
            total_cobrado_usd: 605025.58
          },
          {
            status: 'cancelled',
            pedidos: 1080,
            ingreso_bruto_usd: 424380.27,
            descuentos_cabecera_usd: 2847.94,
            venta_neta_antes_dev_usd: 421532.33,
            impuestos_recaudados_usd: 67445.16,
            total_cobrado_usd: 489003.49
          },
          {
            status: 'pending',
            pedidos: 720,
            ingreso_bruto_usd: 266854.26,
            descuentos_cabecera_usd: 2779.81,
            venta_neta_antes_dev_usd: 264074.45,
            impuestos_recaudados_usd: 42251.83,
            total_cobrado_usd: 306326.28
          }
        ]
      }
    },
    {
      id: 'costo-directo-y-margen-bruto',
      heading: 'Costo directo (COGS) y la diferencia entre facturar y ganar',
      body: 'Vender mucho no sirve si cada unidad cuesta casi lo mismo que su precio de venta. En la tabla `products`, cada artículo tiene un costo unitario de adquisición o tueste (`unit_cost_usd`) y un precio de lista (`list_price_usd`). Al multiplicar las unidades vendidas (`qty` en `order_items`) por `unit_cost_usd`, obtenemos el **costo directo** de ventas, conocido por sus siglas en inglés como COGS (*Cost of Goods Sold*).\n\nLa resta `ingreso_lineas_usd - costo_directo_usd` es el **margen bruto** en dólares: lo que queda para pagar sueldos, almacenes y marketing. En los pedidos completados de Mercado Brisa, `Suscripciones` ingresa 657 384,31 USD mientras que `Accesorios` ingresa 586 859,56 USD. Sin embargo, `Accesorios` tiene un costo directo mucho menor y aporta 340 331,54 USD de margen bruto, superando los 338 217,74 USD de `Suscripciones`.'
    },
    {
      id: 'por-que-el-margen-porcentual-no-se-promedia',
      heading: 'Por qué nunca debes promediar porcentajes de margen con AVG',
      body: 'El margen bruto también se expresa como porcentaje del ingreso: `(ingreso - costo) / ingreso * 100`. En modelado dimensional (Kimball), los importes en dólares son **hechos aditivos** porque puedes sumarlos libremente entre productos, días o tiendas. En cambio, un porcentaje es un **hecho no aditivo**.\n\nImagina que vendes un molino de 200 USD con 40 % de margen (ganas 80 USD) y un paquete de filtros de 10 USD con 60 % de margen (ganas 6 USD). El promedio simple `AVG` de 40 % y 60 % da 50 %, pero en realidad ingresaste 210 USD y ganaste 86 USD, lo que representa un 40,95 %. En SQL, calcula siempre el porcentaje agregado como la razón de las sumas: `SUM(margen_usd) * 100.0 / SUM(ingreso_usd)`.'
    }
  ],

  workedExample: {
    title: 'Facturación aparente frente a margen bruto real por categoría',
    description: 'Compara una consulta que mezcla pedidos cancelados y promedia porcentajes con AVG frente al cálculo contable sobre pedidos completados.',
    steps: [
      {
        label: 'Paso 1 — Error frecuente: incluir todo estado y usar AVG sobre porcentajes',
        explanation: 'Si sumamos `order_items` sin filtrar el estado del pedido en `orders` y calculamos el margen porcentual con `AVG()`, incluimos pedidos cancelados y damos el mismo peso a una línea de 10 USD que a una de 400 USD.',
        code: `SELECT
  p.category,
  COUNT(oi.order_item_id) AS lineas,
  ROUND(SUM(oi.line_total_usd), 2) AS venta_bruta_lineas_usd,
  ROUND(AVG((oi.line_total_usd - (oi.qty * p.unit_cost_usd)) / NULLIF(oi.line_total_usd, 0) * 100), 2) AS margen_promedio_ingenuo_pct
FROM order_items oi
JOIN products p ON oi.product_id = p.product_id
GROUP BY p.category
ORDER BY venta_bruta_lineas_usd DESC;`,
        expectedOutput: [
          {
            category: 'Molinos',
            lineas: 8449,
            venta_bruta_lineas_usd: 2651582.18,
            margen_promedio_ingenuo_pct: 42.93
          },
          {
            category: 'Cafeteras',
            lineas: 8448,
            venta_bruta_lineas_usd: 2004650.1,
            margen_promedio_ingenuo_pct: 47.58
          },
          {
            category: 'Suscripciones',
            lineas: 8212,
            venta_bruta_lineas_usd: 802306.97,
            margen_promedio_ingenuo_pct: 51.4
          },
          {
            category: 'Accesorios',
            lineas: 8446,
            venta_bruta_lineas_usd: 716955.84,
            margen_promedio_ingenuo_pct: 57.89
          },
          {
            category: 'Café en grano',
            lineas: 8445,
            venta_bruta_lineas_usd: 506969.22,
            margen_promedio_ingenuo_pct: 55.25
          }
        ]
      },
      {
        label: 'Paso 2 — Cálculo correcto: pedidos completados, costo directo y SUM/SUM',
        explanation: 'Al filtrar `o.status = \'completed\'` y ordenar por `margen_bruto_usd`, descubrimos que `Accesorios` (340 331,54 USD y 57,99 %) supera en ganancia bruta a `Suscripciones` (338 217,74 USD y 51,45 %).',
        code: `SELECT
  p.category,
  SUM(oi.qty) AS unidades_vendidas,
  ROUND(SUM(oi.line_total_usd), 2) AS ingreso_lineas_usd,
  ROUND(SUM(oi.qty * p.unit_cost_usd), 2) AS costo_directo_usd,
  ROUND(SUM(oi.line_total_usd - (oi.qty * p.unit_cost_usd)), 2) AS margen_bruto_usd,
  ROUND(SUM(oi.line_total_usd - (oi.qty * p.unit_cost_usd)) * 100.0 / SUM(oi.line_total_usd), 2) AS margen_bruto_pct
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
JOIN products p ON oi.product_id = p.product_id
WHERE o.status = 'completed'
GROUP BY p.category
ORDER BY margen_bruto_usd DESC;`,
        expectedOutput: [
          {
            category: 'Molinos',
            unidades_vendidas: 14314,
            ingreso_lineas_usd: 2163162.27,
            costo_directo_usd: 1235089.04,
            margen_bruto_usd: 928073.23,
            margen_bruto_pct: 42.9
          },
          {
            category: 'Cafeteras',
            unidades_vendidas: 14270,
            ingreso_lineas_usd: 1643366.45,
            costo_directo_usd: 861476.1,
            margen_bruto_usd: 781890.35,
            margen_bruto_pct: 47.58
          },
          {
            category: 'Accesorios',
            unidades_vendidas: 14366,
            ingreso_lineas_usd: 586859.56,
            costo_directo_usd: 246528.02,
            margen_bruto_usd: 340331.54,
            margen_bruto_pct: 57.99
          },
          {
            category: 'Suscripciones',
            unidades_vendidas: 13857,
            ingreso_lineas_usd: 657384.31,
            costo_directo_usd: 319166.57,
            margen_bruto_usd: 338217.74,
            margen_bruto_pct: 51.45
          },
          {
            category: 'Café en grano',
            unidades_vendidas: 14243,
            ingreso_lineas_usd: 413378.59,
            costo_directo_usd: 184902.58,
            margen_bruto_usd: 228476.01,
            margen_bruto_pct: 55.27
          }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: 'Un pedido completado en `orders` tiene `subtotal_usd = 100`, `discount_usd = 10`, `shipping_usd = 0`, `tax_usd = 14.40` y `total_usd = 104.40`. Si no tuvo devoluciones, ¿cuál es el ingreso neto de mercancía para la empresa?',
      options: [
        {
          id: 'a',
          text: '90.00 USD (subtotal de 100 menos el descuento de 10, excluyendo el impuesto recaudado).',
          correct: true,
          feedback: 'Correcto. El descuento reduce el precio de la transacción y el impuesto de 14.40 USD se recauda para el fisco, por lo que no forma parte del ingreso neto.'
        },
        {
          id: 'b',
          text: '104.40 USD, porque es el monto total que entró por la pasarela de pagos.',
          correct: false,
          feedback: 'Incorrecto. El total cobrado incluye 14.40 USD de impuestos al consumo que la empresa debe transferir a la agencia tributaria.'
        },
        {
          id: 'c',
          text: '100.00 USD, porque los descuentos comerciales se registran como ganancia.',
          correct: false,
          feedback: 'Incorrecto. Un descuento comercial nunca se cobra al cliente y debe deducirse del ingreso bruto.'
        }
      ],
      explanation: 'Según IFRS 15, el ingreso de actividades ordinarias se registra neto de descuentos comerciales y excluye los importes recaudados en nombre de terceros como el impuesto al valor agregado.'
    },
    {
      id: 'c2',
      type: 'predict-output',
      prompt: 'La tienda A vende 1 000 USD con 30 % de margen (300 USD) y la tienda B vende 100 USD con 70 % de margen (70 USD). ¿Qué devuelven `AVG(margen_pct)` frente a `SUM(margen_usd) * 100 / SUM(ingreso_usd)`?',
      options: [
        {
          id: 'a',
          text: 'AVG devuelve 50.00 %, pero el margen bruto real de la empresa es 33.64 % (370 / 1 100).',
          correct: true,
          feedback: 'Exacto. Promediar los dos porcentajes ignora que la tienda A vende diez veces más volumen que la tienda B.'
        },
        {
          id: 'b',
          text: 'Ambas expresiones devuelven 50.00 % porque solo hay dos tiendas.',
          correct: false,
          feedback: 'Incorrecto. Como las tiendas tienen ingresos distintos, el promedio simple no coincide con el margen ponderado real.'
        },
        {
          id: 'c',
          text: 'AVG devuelve 33.64 % y la división de sumas devuelve 100.00 %.',
          correct: false,
          feedback: 'Incorrecto. AVG suma 30 y 70 y los divide entre 2 (50 %), distorsionando la rentabilidad real de 370 / 1 100 = 33.64 %.'
        }
      ],
      explanation: 'Los porcentajes son métricas no aditivas. Para agregar el margen de varias filas o tiendas, primero se suman los dólares de margen (370) y se dividen entre la suma de los dólares de ingreso (1 100).'
    },
    {
      id: 'c3',
      type: 'mcq',
      prompt: 'En Mercado Brisa existen 300 pedidos que tienen dos devoluciones parciales en la tabla `refunds`. ¿Qué ocurre si unes `orders` con `refunds` directamente y ejecutas `SUM(orders.subtotal_usd)`?',
      options: [
        {
          id: 'a',
          text: 'El `subtotal_usd` de esos 300 pedidos se suma dos veces, inflando artificialmente el ingreso bruto.',
          correct: true,
          feedback: 'Correcto. Al haber dos filas en `refunds` para un mismo `order_id`, el JOIN repite la fila de `orders` y duplica su subtotal.'
        },
        {
          id: 'b',
          text: 'El motor SQL resta automáticamente las dos devoluciones sin duplicar el subtotal.',
          correct: false,
          feedback: 'Incorrecto. SQL repite las columnas de la tabla padre por cada fila coincidente de la tabla hija si no pre-agregas antes.'
        },
        {
          id: 'c',
          text: 'Los 300 pedidos desaparecen del resultado porque tienen clave repetida.',
          correct: false,
          feedback: 'Incorrecto. Un JOIN no elimina claves repetidas; por el contrario, multiplica las filas resultantes.'
        }
      ],
      explanation: 'Para cruzar pedidos (`1 fila = 1 pedido`) con devoluciones (`1 fila = 1 reembolso parcial`), primero hay que agrupar `refunds` por `order_id` en una subconsulta o CTE.'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Ingreso neto por tipo de dispositivo descontando devoluciones',
    language: 'sql',
    prompt: 'Calcula para cada `device_type` en los pedidos con estado `completed` o `refunded`: el conteo de pedidos (`pedidos_validos`), el ingreso bruto (`ingreso_bruto_usd`), los descuentos de cabecera (`descuentos_usd`), las devoluciones pre-agregadas (`devoluciones_usd`) y el ingreso neto final (`ingreso_neto_usd`, restando descuentos y devoluciones al subtotal). Ordena de mayor a menor `ingreso_neto_usd`.',
    starterCode: `WITH devoluciones_por_pedido AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS devuelto_usd
  FROM refunds
  GROUP BY order_id
)
SELECT
  o.device_type,
  COUNT(o.order_id) AS pedidos_validos,
  ROUND(SUM(o.subtotal_usd), 2) AS ingreso_bruto_usd,
  ROUND(SUM(o.discount_usd), 2) AS descuentos_usd,
  ROUND(SUM(COALESCE(d.devuelto_usd, 0)), 2) AS devoluciones_usd,
  -- Completa el cálculo de ingreso_neto_usd restando discount_usd y COALESCE(d.devuelto_usd, 0) a subtotal_usd
  0.0 AS ingreso_neto_usd
FROM orders o
LEFT JOIN devoluciones_por_pedido d ON o.order_id = d.order_id
WHERE o.status IN ('completed', 'refunded')
GROUP BY o.device_type
ORDER BY ingreso_neto_usd DESC;`,
    expected: `WITH devoluciones_por_pedido AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS devuelto_usd
  FROM refunds
  GROUP BY order_id
)
SELECT
  o.device_type,
  COUNT(o.order_id) AS pedidos_validos,
  ROUND(SUM(o.subtotal_usd), 2) AS ingreso_bruto_usd,
  ROUND(SUM(o.discount_usd), 2) AS descuentos_usd,
  ROUND(SUM(COALESCE(d.devuelto_usd, 0)), 2) AS devoluciones_usd,
  ROUND(SUM(o.subtotal_usd - o.discount_usd - COALESCE(d.devuelto_usd, 0)), 2) AS ingreso_neto_usd
FROM orders o
LEFT JOIN devoluciones_por_pedido d ON o.order_id = d.order_id
WHERE o.status IN ('completed', 'refunded')
GROUP BY o.device_type
ORDER BY ingreso_neto_usd DESC;`,
    orderMatters: true,
    hints: [
      'La CTE `devoluciones_por_pedido` ya entrega una sola fila por `order_id`, por lo que puedes restar `COALESCE(d.devuelto_usd, 0)` sin riesgo de duplicar pedidos.',
      'Recuerda envolver `d.devuelto_usd` en `COALESCE(d.devuelto_usd, 0)` porque la mayoría de los pedidos no tienen devoluciones y vienen como `NULL` tras el `LEFT JOIN`.',
      'Escribe `ROUND(SUM(o.subtotal_usd - o.discount_usd - COALESCE(d.devuelto_usd, 0)), 2) AS ingreso_neto_usd`.'
    ],
    solution: `WITH devoluciones_por_pedido AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS devuelto_usd
  FROM refunds
  GROUP BY order_id
)
SELECT
  o.device_type,
  COUNT(o.order_id) AS pedidos_validos,
  ROUND(SUM(o.subtotal_usd), 2) AS ingreso_bruto_usd,
  ROUND(SUM(o.discount_usd), 2) AS descuentos_usd,
  ROUND(SUM(COALESCE(d.devuelto_usd, 0)), 2) AS devoluciones_usd,
  ROUND(SUM(o.subtotal_usd - o.discount_usd - COALESCE(d.devuelto_usd, 0)), 2) AS ingreso_neto_usd
FROM orders o
LEFT JOIN devoluciones_por_pedido d ON o.order_id = d.order_id
WHERE o.status IN ('completed', 'refunded')
GROUP BY o.device_type
ORDER BY ingreso_neto_usd DESC;`,
    solutionExplanation: 'Pre-agregamos `refunds` por `order_id` para mantener una relación 1:1 con `orders`, filtramos solo pedidos entregados o reembolsados (`completed`, `refunded`) y restamos tanto descuentos como devoluciones al subtotal.',
    expectedOutputTable: [
      {
        device_type: 'desktop',
        pedidos_validos: 6944,
        ingreso_bruto_usd: 2743540.8,
        descuentos_usd: 24941.57,
        devoluciones_usd: 150928.63,
        ingreso_neto_usd: 2567670.6
      },
      {
        device_type: 'mobile',
        pedidos_validos: 6171,
        ingreso_bruto_usd: 2102122.54,
        descuentos_usd: 27880.31,
        devoluciones_usd: 72186.7,
        ingreso_neto_usd: 2002055.53
      },
      {
        device_type: 'pos_tienda',
        pedidos_validos: 3085,
        ingreso_bruto_usd: 1145566.44,
        descuentos_usd: 12483.52,
        devoluciones_usd: 51419.19,
        ingreso_neto_usd: 1081663.73
      }
    ]
  },

  roleNotes: {
    de: 'Almacena siempre los componentes aditivos en bruto (`subtotal_usd`, `discount_usd`, `tax_usd`, `unit_cost_usd`) en lugar de guardar únicamente porcentajes precalculados. Excluye registros de calibración como `SKU-TEST-NEG` mediante reglas de validación antes de publicar la capa analítica.',
    da: 'Cuando compares la rentabilidad de categorías o campañas, ordena por dólares de margen bruto además de por porcentaje. Una categoría con margen del 60 % pero poco volumen aporta menos caja que una del 43 % con alta rotación.',
    bi: 'En tu herramienta de tableros, define el margen bruto porcentual como una medida dinámica (`DIVIDE(SUM(margen_usd), SUM(ingreso_neto_usd))`) y nunca como una columna calculada que luego se promedia entre filas.'
  },

  summary: [
    'El ingreso neto parte de pedidos efectivos y resta descuentos comerciales y devoluciones procesadas.',
    'Los impuestos recaudados en la venta pertenecen al fisco y nunca se suman al ingreso.',
    'El margen bruto en dinero es el ingreso neto menos el costo directo de los productos vendidos.',
    'El porcentaje de margen es no aditivo: se calcula dividiendo la suma del margen entre la suma del ingreso.'
  ],

  flashcards: [
    {
      id: 'fc-c0-negocio-01-a',
      front: '¿Qué diferencia hay entre ingreso bruto, ingreso neto y margen bruto?',
      back: 'El ingreso bruto es el valor de venta antes de deducciones; el ingreso neto descuenta rebajas y devoluciones; el margen bruto resta además el costo directo del producto (COGS).'
    },
    {
      id: 'fc-c0-negocio-01-b',
      front: '¿Por qué no se debe usar AVG(margen_pct) para calcular el margen bruto total de varias categorías?',
      back: 'Porque el porcentaje de margen es un hecho no aditivo: promediar porcentajes da el mismo peso a ventas pequeñas y grandes. Debe calcularse como SUM(margen_usd) / SUM(ingreso_usd).'
    },
    {
      id: 'fc-c0-negocio-01-c',
      front: '¿Por qué los impuestos sobre las ventas (`tax_usd`) y los pedidos `cancelled` se excluyen del ingreso?',
      back: 'Porque los impuestos se recaudan por cuenta del Estado y los pedidos cancelados no transfieren bienes ni generan derecho de cobro.'
    }
  ],

  glossaryTerms: [
    'ingreso-neto',
    'margen-bruto'
  ],

  sources: [
    {
      title: 'IFRS 15 — Revenue from Contracts with Customers',
      url: 'https://www.ifrs.org/issued-standards/list-of-standards/ifrs-15-revenue-from-contracts-with-customers/',
      publisher: 'IFRS Foundation / IASB',
      accessed: '2026-10-29',
      supports: 'Reconocimiento de ingresos cuando se transfiere el control del producto, neto de descuentos y devoluciones y sin impuestos de terceros.'
    },
    {
      title: 'Dimensional Modeling Techniques: Additive, Semi-Additive, and Non-Additive Facts',
      url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/additive-semi-additive-non-additive-facts/',
      publisher: 'Kimball Group',
      accessed: '2026-10-29',
      supports: 'Clasificación de importes monetarios como hechos aditivos y de porcentajes de margen como hechos no aditivos que requieren SUM/SUM.'
    },
    {
      title: 'DuckDB SQL Aggregate Functions Reference',
      url: 'https://duckdb.org/docs/sql/functions/aggregates.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Funciones de agregación SUM, AVG y COUNT aplicadas a cálculos financieros sobre tablas relacionales.'
    }
  ],

  aiNotes: 'Las confusiones más comunes son tomar `total_usd` (que incluye impuestos) como ingreso de la empresa, olvidar `COALESCE` al restar devoluciones tras un `LEFT JOIN` (convirtiendo el ingreso neto en `NULL`), y promediar porcentajes de margen con `AVG()` en vez de dividir `SUM(margen_usd) / SUM(ingreso_usd)`.'
};

export default lesson;
