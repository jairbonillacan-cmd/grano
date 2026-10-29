const lesson = {
  id: 'bi2-dax-01-contexto-fila-filtro',
  moduleId: 'bi2-dax',
  tracks: ['bi'],
  level: 2,
  order: 1,
  title: 'Contexto de fila y contexto de filtro en DAX',
  subtitle: 'Contexto de fila y contexto de filtro: los dos pilares de evaluación en DAX',
  minutes: 25,
  prerequisites: ['bi2-modelo-semantico-05'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), un analista quiere calcular el costo directo de las líneas vendidas en `order_items` (`42 000` filas). Como el costo unitario vive en `products`, escribe la medida `Costo = SUM(order_items[qty]) * SUM(products[unit_cost_usd])`. En la categoría Molinos, el reporte muestra `$12 790 475 516.69` en lugar del costo real de `$1 514 345.88`. ¿Por qué DAX multiplicó la suma de todas las unidades por la suma de todos los costos y cómo influyen los dos contextos de evaluación?',

  objectives: [
    'Distinguir cómo actúan el contexto de filtro y el contexto de fila al evaluar una expresión en DAX.',
    'Explicar por qué el contexto de filtro se propaga automáticamente por las relaciones 1:N mientras que el contexto de fila requiere RELATED o RELATEDTABLE.',
    'Conciliar en SQL sobre Mercado Brisa el cálculo fila a fila frente al error de multiplicar agregaciones.'
  ],

  sections: [
    {
      id: 'dos-pilares-evaluacion-dax',
      heading: 'Qué es el contexto de filtro y cómo viaja por el esquema en estrella',
      body: 'Toda fórmula DAX se evalúa bajo dos entornos independientes: el **contexto de filtro** y el **contexto de fila**. El contexto de filtro es el conjunto de restricciones activas sobre las tablas del modelo antes de calcular un número. Nace de las filas y columnas de un visual, de los segmentadores del reporte y de los argumentos de `CALCULATE`.\n\nEn el esquema en estrella de Mercado Brisa (empresa ficticia), las dimensiones `stores`, `customers`, `products` y `calendar` se conectan mediante relaciones `1:N` hacia `orders` y `order_items`. Cuando colocas `stores[region]` en una matriz y evalúas la medida `Ventas Completadas USD = CALCULATE(SUM(\'orders\'[total_usd]), \'orders\'[status] = "completed")`, el filtro de cada región viaja del lado `1` (`stores`) al lado `N` (`orders`). En SQL equivale a un `INNER JOIN` con `WHERE` y `GROUP BY s.region`.',
      example: {
        language: 'sql',
        code: '-- Equivalente SQL del contexto de filtro que propaga stores[region] hacia orders:\nSELECT\n  s.region,\n  COUNT(o.order_id) AS pedidos_completados,\n  ROUND(SUM(o.total_usd), 2) AS ventas_contexto_filtro_usd\nFROM orders o\nINNER JOIN stores s ON o.store_id = s.store_id\nWHERE o.status = \'completed\'\nGROUP BY s.region\nORDER BY ventas_contexto_filtro_usd DESC;',
        expectedOutput: [
          {
            region: 'Cono Sur',
            pedidos_completados: 4920,
            ventas_contexto_filtro_usd: 2059786.39
          },
          {
            region: 'Andina',
            pedidos_completados: 4921,
            ventas_contexto_filtro_usd: 1990554.12
          },
          {
            region: 'Iberia',
            pedidos_completados: 2811,
            ventas_contexto_filtro_usd: 1348369.68
          },
          {
            region: 'Norteamérica',
            pedidos_completados: 2108,
            ventas_contexto_filtro_usd: 870752.23
          }
        ]
      }
    },
    {
      id: 'contexto-de-fila-y-error-agregaciones',
      heading: 'Contexto de fila: por qué una medida no conoce la fila actual',
      body: 'El **contexto de fila** existe únicamente cuando DAX recorre una tabla registro por registro. Aparece de forma automática al definir una columna calculada o de forma explícita dentro de una función iteradora como `SUMX` o `FILTER`. Una medida estándar como `SUM(\'order_items\'[qty])` no tiene contexto de fila: solo ve la columna completa que sobrevivió al contexto de filtro.\n\nPor eso falla escribir `SUM(\'order_items\'[qty]) * SUM(\'products\'[unit_cost_usd])`. En la categoría Molinos hay `17 543` unidades vendidas y la suma de los costos unitarios de sus `36` productos es `$729 092.83`. Al multiplicar dos agregaciones, obtienes `$12 790 475 516.69`. Para multiplicar cantidad por costo en cada línea antes de sumar, necesitas abrir un contexto de fila sobre `order_items` con un iterador.',
      example: {
        language: 'sql',
        code: '-- Comparación en Mercado Brisa entre multiplicar sumas y evaluar fila por fila:\nSELECT\n  p.category,\n  SUM(oi.qty) AS total_unidades,\n  ROUND(SUM(oi.qty * p.unit_cost_usd), 2) AS costo_sumx_correcto_usd,\n  ROUND(SUM(oi.qty) * SUM(p.unit_cost_usd), 2) AS costo_error_producto_sumas_usd\nFROM order_items oi\nINNER JOIN products p ON oi.product_id = p.product_id\nWHERE p.list_price_usd > 0\nGROUP BY p.category\nORDER BY costo_sumx_correcto_usd DESC;',
        expectedOutput: [
          {
            category: 'Molinos',
            total_unidades: 17543,
            costo_sumx_correcto_usd: 1514345.88,
            costo_error_producto_sumas_usd: 12790475516.69
          },
          {
            category: 'Cafeteras',
            total_unidades: 17417,
            costo_sumx_correcto_usd: 1050793.89,
            costo_error_producto_sumas_usd: 8884921843.93
          },
          {
            category: 'Suscripciones',
            total_unidades: 16939,
            costo_sumx_correcto_usd: 389627.18,
            costo_error_producto_sumas_usd: 3198414865.62
          },
          {
            category: 'Accesorios',
            total_unidades: 17553,
            costo_sumx_correcto_usd: 301257.41,
            costo_error_producto_sumas_usd: 2544941539.89
          },
          {
            category: 'Café en grano',
            total_unidades: 17460,
            costo_sumx_correcto_usd: 226808.27,
            costo_error_producto_sumas_usd: 1914804327.6
          }
        ]
      }
    },
    {
      id: 'navegacion-relaciones-related',
      heading: 'RELATED y RELATEDTABLE: cruzar tablas desde un contexto de fila',
      body: 'A diferencia del contexto de filtro, el contexto de fila no atraviesa las relaciones del modelo por sí solo. Si estás iterando `order_items` con `SUMX` y escribes `\'order_items\'[qty] * \'products\'[unit_cost_usd]`, DAX devuelve un error porque no sabe qué fila de `products` corresponde a la línea actual.\n\nPara leer una columna del lado uno (`1`, como `products` o `orders`) mientras iteras el lado muchos (`N`, como `order_items`), debes envolver la columna en **RELATED**: `SUMX(\'order_items\', \'order_items\'[qty] * RELATED(\'products\'[unit_cost_usd]))`. Si en cambio estás en el lado `1` (`customers`) y necesitas obtener las filas asociadas del lado `N` (`orders`), utilizas **RELATEDTABLE**, que devuelve la subtabla de pedidos de ese cliente.'
    },
    {
      id: 'medidas-vs-columnas-vertipaq',
      heading: 'Por qué usar medidas con SUMX en lugar de columnas calculadas',
      body: 'Una tentación habitual cuando se aprende el contexto de fila es crear una columna calculada física en `order_items` con `Costo Linea = \'order_items\'[qty] * RELATED(\'products\'[unit_cost_usd])` y luego hacer `SUM(\'order_items\'[Costo Linea])`. Aunque el resultado numérico coincide, esa columna se materializa en RAM durante el refresco y agranda el diccionario columnar de VertiPaq.\n\nEn cambio, la medida `Costo Directo USD = SUMX(\'order_items\', \'order_items\'[qty] * RELATED(\'products\'[unit_cost_usd]))` no guarda ningún byte adicional en la tabla. El motor de almacenamiento lee los vectores comprimidos de `qty` y `unit_cost_usd` y calcula el producto en memoria solo para las filas visibles en el reporte.'
    }
  ],

  workedExample: {
    title: 'Reconciliación en DuckDB del margen bruto por categoría (contexto de filtro + contexto de fila)',
    description: 'En Mercado Brisa (`order_items` y `products`), compara el error de operar con sumas agregadas en el contexto de filtro frente a la expresión `SUMX` que multiplica cantidad por costo en cada fila y la resta de `line_total_usd`:',
    steps: [
      {
        label: 'Paso 1 — Error frecuente: multiplicar sumas en el contexto de filtro sin iterar filas',
        explanation: 'Escribir `SUM(order_items[qty]) * SUM(order_items[unit_price_usd])` multiplica el total de unidades de la categoría por la suma de todos los precios unitarios de sus 8 449 líneas, produciendo más de 22 618 millones de dólares en Molinos.',
        code: '-- Antipatrón en DAX: SUM(\'order_items\'[qty]) * SUM(\'order_items\'[unit_price_usd])\nSELECT\n  p.category,\n  COUNT(oi.order_item_id) AS lineas_pedido,\n  SUM(oi.qty) AS suma_unidades,\n  ROUND(SUM(oi.unit_price_usd), 2) AS suma_precios_unitarios_usd,\n  ROUND(SUM(oi.qty) * SUM(oi.unit_price_usd), 2) AS producto_sumas_erroneo_usd\nFROM order_items oi\nINNER JOIN products p ON oi.product_id = p.product_id\nWHERE p.list_price_usd > 0\nGROUP BY p.category\nORDER BY producto_sumas_erroneo_usd DESC;',
        expectedOutput: [
          {
            category: 'Molinos',
            lineas_pedido: 8449,
            suma_unidades: 17543,
            suma_precios_unitarios_usd: 1289290.05,
            producto_sumas_erroneo_usd: 22618015347.15
          },
          {
            category: 'Cafeteras',
            lineas_pedido: 8448,
            suma_unidades: 17417,
            suma_precios_unitarios_usd: 983045.99,
            producto_sumas_erroneo_usd: 17121712007.83
          },
          {
            category: 'Suscripciones',
            lineas_pedido: 8212,
            suma_unidades: 16939,
            suma_precios_unitarios_usd: 392761.9,
            producto_sumas_erroneo_usd: 6652993824.1
          },
          {
            category: 'Accesorios',
            lineas_pedido: 8446,
            suma_unidades: 17553,
            suma_precios_unitarios_usd: 348421.63,
            producto_sumas_erroneo_usd: 6115844871.39
          },
          {
            category: 'Café en grano',
            lineas_pedido: 8445,
            suma_unidades: 17460,
            suma_precios_unitarios_usd: 247655.5,
            producto_sumas_erroneo_usd: 4324065030
          }
        ]
      },
      {
        label: 'Paso 2 — Solución exacta: evaluación fila a fila con SUMX y RELATED',
        explanation: 'En DAX, `Margen Bruto USD = SUMX(\'order_items\', \'order_items\'[line_total_usd] - \'order_items\'[qty] * RELATED(\'products\'[unit_cost_usd]))` abre un contexto de fila en `order_items`, busca el costo en `products` y suma la ganancia real de cada línea.',
        code: '-- Medida DAX: SUMX(\'order_items\', \'order_items\'[line_total_usd] - \'order_items\'[qty] * RELATED(\'products\'[unit_cost_usd]))\nSELECT\n  p.category,\n  SUM(oi.qty) AS total_unidades,\n  ROUND(SUM(oi.line_total_usd), 2) AS ingreso_bruto_lineas_usd,\n  ROUND(SUM(oi.qty * p.unit_cost_usd), 2) AS costo_directo_sumx_usd,\n  ROUND(SUM(oi.line_total_usd - (oi.qty * p.unit_cost_usd)), 2) AS margen_bruto_sumx_usd\nFROM order_items oi\nINNER JOIN products p ON oi.product_id = p.product_id\nWHERE p.list_price_usd > 0\nGROUP BY p.category\nORDER BY margen_bruto_sumx_usd DESC;',
        expectedOutput: [
          {
            category: 'Molinos',
            total_unidades: 17543,
            ingreso_bruto_lineas_usd: 2651582.18,
            costo_directo_sumx_usd: 1514345.88,
            margen_bruto_sumx_usd: 1137236.3
          },
          {
            category: 'Cafeteras',
            total_unidades: 17417,
            ingreso_bruto_lineas_usd: 2004650.1,
            costo_directo_sumx_usd: 1050793.89,
            margen_bruto_sumx_usd: 953856.21
          },
          {
            category: 'Accesorios',
            total_unidades: 17553,
            ingreso_bruto_lineas_usd: 716955.84,
            costo_directo_sumx_usd: 301257.41,
            margen_bruto_sumx_usd: 415698.43
          },
          {
            category: 'Suscripciones',
            total_unidades: 16939,
            ingreso_bruto_lineas_usd: 802306.97,
            costo_directo_sumx_usd: 389627.18,
            margen_bruto_sumx_usd: 412679.79
          },
          {
            category: 'Café en grano',
            total_unidades: 17460,
            ingreso_bruto_lineas_usd: 506969.22,
            costo_directo_sumx_usd: 226808.27,
            margen_bruto_sumx_usd: 280160.95
          }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: 'En un modelo en estrella, `products` (lado 1) filtra a `order_items` (lado N). Dentro de `SUMX(\'order_items\', ...)`, necesitas multiplicar `\'order_items\'[qty]` por `\'products\'[unit_cost_usd]`. ¿Qué expresión debes escribir?',
      options: [
        {
          id: 'a',
          text: '\'order_items\'[qty] * RELATED(\'products\'[unit_cost_usd])',
          correct: true,
          feedback: 'Correcto. En un contexto de fila en el lado muchos (N), RELATED navega la relación activa hacia el lado uno (1) y devuelve el costo del producto.'
        },
        {
          id: 'b',
          text: '\'order_items\'[qty] * \'products\'[unit_cost_usd]',
          correct: false,
          feedback: 'Incorrecto. El contexto de fila solo está activo sobre order_items; referenciar directamente una columna de otra tabla produce un error.'
        },
        {
          id: 'c',
          text: '\'order_items\'[qty] * RELATEDTABLE(\'products\')',
          correct: false,
          feedback: 'Incorrecto. RELATEDTABLE devuelve una tabla desde el lado N cuando estás en el lado 1, no un valor escalar desde el lado 1.'
        }
      ],
      explanation: 'El contexto de fila no se propaga automáticamente por las relaciones. Para traer un atributo escalar desde el lado 1 (products) hacia el lado N (order_items), se usa RELATED.'
    },
    {
      id: 'c2',
      type: 'predict-output',
      prompt: 'Una categoría tiene 2 líneas en `order_items`: Línea A (`qty = 2`, costo = `10`) y Línea B (`qty = 3`, costo = `20`). ¿Qué devuelven respectivamente `SUMX` fila a fila y el producto de sumas `SUM(qty) * SUM(costo)`?',
      options: [
        {
          id: 'a',
          text: 'SUMX devuelve 80 (2×10 + 3×20) y el producto de sumas devuelve 150 ((2+3) × (10+20)).',
          correct: true,
          feedback: 'Exacto. SUMX calcula 20 + 60 = 80 fila por fila, mientras que multiplicar las sumas hace 5 × 30 = 150.'
        },
        {
          id: 'b',
          text: 'Ambas fórmulas devuelven 80 porque la multiplicación es distributiva respecto a la suma.',
          correct: false,
          feedback: 'Incorrecto. La suma de productos Σ(a_i × b_i) no es igual al producto de las sumas (Σa_i) × (Σb_i).'
        },
        {
          id: 'c',
          text: 'SUMX devuelve 150 y el producto de sumas devuelve 80.',
          correct: false,
          feedback: 'Incorrecto. Están invertidos: SUMX evalúa cada línea individualmente (80) y el producto de sumas infla el resultado (150).'
        }
      ],
      explanation: 'Multiplicar dos agregaciones suma primero todas las cantidades (5) y todos los costos (30) y luego los multiplica (150), sumando productos cruzados inexistentes.'
    },
    {
      id: 'c3',
      type: 'fill-code',
      prompt: 'Completa la medida DAX que itera sobre `order_items` y multiplica la cantidad por el costo unitario traído desde `products`:',
      template: 'Costo Directo USD =\n{{b1}} (\n    \'order_items\',\n    \'order_items\'[qty] * {{b2}} ( \'products\'[unit_cost_usd] )\n)',
      blanks: [
        { id: 'b1', accepted: ['SUMX', 'sumx'] },
        { id: 'b2', accepted: ['RELATED', 'related'] }
      ],
      explanation: 'SUMX abre un contexto de fila sobre order_items y RELATED recupera el valor correspondiente de unit_cost_usd desde la tabla de dimensión products.'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Reconciliación de margen bruto por segmento de cliente (contexto de filtro + fila)',
    language: 'sql',
    prompt: 'En Mercado Brisa, concilia el reporte por segmento de cliente (`c.segment`) para los pedidos con `o.status = \'completed\'`. Une `orders`, `customers`, `order_items` y `products` y calcula: `pedidos_completados` (`COUNT(DISTINCT o.order_id)`), `unidades_vendidas` (`SUM(oi.qty)`), `ingreso_lineas_usd` (`ROUND(SUM(oi.line_total_usd), 2)`), `costo_directo_usd` (`ROUND(SUM(oi.qty * p.unit_cost_usd), 2)`) y `margen_bruto_usd` (`ROUND(SUM(oi.line_total_usd - (oi.qty * p.unit_cost_usd)), 2)`). Ordena por `margen_bruto_usd DESC`.',
    starterCode: 'SELECT\n  c.segment,\n  COUNT(DISTINCT o.order_id) AS pedidos_completados,\n  SUM(oi.qty) AS unidades_vendidas,\n  ROUND(SUM(oi.line_total_usd), 2) AS ingreso_lineas_usd,\n  -- TODO: Corrige el cálculo fila a fila del costo directo y del margen bruto (no multipliques sumas)\n  ROUND(SUM(oi.qty) * SUM(p.unit_cost_usd), 2) AS costo_directo_usd,\n  0.0 AS margen_bruto_usd\nFROM orders o\nINNER JOIN customers c ON o.customer_id = c.customer_id\nINNER JOIN order_items oi ON o.order_id = oi.order_id\nINNER JOIN products p ON oi.product_id = p.product_id\nWHERE o.status = \'completed\'\nGROUP BY c.segment\nORDER BY margen_bruto_usd DESC;',
    expected: 'SELECT\n  c.segment,\n  COUNT(DISTINCT o.order_id) AS pedidos_completados,\n  SUM(oi.qty) AS unidades_vendidas,\n  ROUND(SUM(oi.line_total_usd), 2) AS ingreso_lineas_usd,\n  ROUND(SUM(oi.qty * p.unit_cost_usd), 2) AS costo_directo_usd,\n  ROUND(SUM(oi.line_total_usd - (oi.qty * p.unit_cost_usd)), 2) AS margen_bruto_usd\nFROM orders o\nINNER JOIN customers c ON o.customer_id = c.customer_id\nINNER JOIN order_items oi ON o.order_id = oi.order_id\nINNER JOIN products p ON oi.product_id = p.product_id\nWHERE o.status = \'completed\'\nGROUP BY c.segment\nORDER BY margen_bruto_usd DESC;',
    orderMatters: true,
    hints: [
      'El contexto de filtro del visual equivale a WHERE o.status = \'completed\' y GROUP BY c.segment.',
      'El contexto de fila de SUMX equivale a multiplicar oi.qty * p.unit_cost_usd dentro de SUM(...), nunca SUM(oi.qty) * SUM(p.unit_cost_usd).',
      'Calcula ROUND(SUM(oi.line_total_usd - (oi.qty * p.unit_cost_usd)), 2) AS margen_bruto_usd y ordena DESC.'
    ],
    solution: 'SELECT\n  c.segment,\n  COUNT(DISTINCT o.order_id) AS pedidos_completados,\n  SUM(oi.qty) AS unidades_vendidas,\n  ROUND(SUM(oi.line_total_usd), 2) AS ingreso_lineas_usd,\n  ROUND(SUM(oi.qty * p.unit_cost_usd), 2) AS costo_directo_usd,\n  ROUND(SUM(oi.line_total_usd - (oi.qty * p.unit_cost_usd)), 2) AS margen_bruto_usd\nFROM orders o\nINNER JOIN customers c ON o.customer_id = c.customer_id\nINNER JOIN order_items oi ON o.order_id = oi.order_id\nINNER JOIN products p ON oi.product_id = p.product_id\nWHERE o.status = \'completed\'\nGROUP BY c.segment\nORDER BY margen_bruto_usd DESC;',
    solutionExplanation: 'La consulta propaga el filtro de pedidos completados y de segmento (contexto de filtro) y evalúa fila por fila el costo `oi.qty * p.unit_cost_usd` antes de sumar, conciliando los `$1,048,791.49` de margen en `pro_barista`.',
    expectedOutputTable: [
      {
        segment: 'pro_barista',
        pedidos_completados: 6229,
        unidades_vendidas: 28508,
        ingreso_lineas_usd: 2189795.58,
        costo_directo_usd: 1141004.09,
        margen_bruto_usd: 1048791.49
      },
      {
        segment: 'retail',
        pedidos_completados: 5940,
        unidades_vendidas: 27635,
        ingreso_lineas_usd: 2123739.67,
        costo_directo_usd: 1107112.16,
        margen_bruto_usd: 1016627.51
      },
      {
        segment: 'cafeteria_b2b',
        pedidos_completados: 2591,
        unidades_vendidas: 14907,
        ingreso_lineas_usd: 1150615.93,
        costo_directo_usd: 599046.06,
        margen_bruto_usd: 551569.87
      }
    ]
  },

  roleNotes: {
    de: 'Si precalculas `line_total_usd` o `line_cost_usd` con el tipo numérico exacto en la tabla de hechos durante la transformación en el almacén, reduces el trabajo en tiempo de consulta del Formula Engine en Power BI.',
    da: 'Al auditar discrepancias entre un cuaderno SQL y un tablero de Power BI, verifica siempre si la métrica DAX multiplica dos agregaciones en el contexto de filtro en lugar de iterar al grano de la línea.',
    bi: 'Prefiere medidas con `SUMX` sobre columnas de baja cardinalidad frente a crear columnas calculadas de importe en tablas de hechos de millones de filas, manteniendo compacto el modelo en VertiPaq.'
  },

  summary: [
    'El contexto de filtro restringe las filas activas del modelo y se propaga automáticamente del lado 1 al lado N.',
    'El contexto de fila identifica el registro actual al iterar una tabla, pero no filtra tablas relacionadas por sí solo.',
    'Una medida agregada como SUM no tiene contexto de fila: multiplicar dos SUM no equivale a multiplicar fila por fila.',
    'Dentro de un contexto de fila en el lado N, usa RELATED para leer atributos de dimensiones del lado 1.'
  ],

  flashcards: [
    {
      id: 'fc-bi2-dax-01-a',
      front: '¿Qué diferencia hay entre el contexto de filtro y el contexto de fila en DAX?',
      back: 'El contexto de filtro filtra subconjuntos de tablas antes de agregar y viaja por las relaciones 1:N; el contexto de fila apunta al registro actual durante una iteración.'
    },
    {
      id: 'fc-bi2-dax-01-b',
      front: '¿Por qué `SUM(order_items[qty]) * SUM(products[unit_cost_usd])` da un resultado erróneo?',
      back: 'Porque suma primero todas las unidades y todos los costos por separado y luego multiplica ambos totales, en lugar de multiplicar fila por fila con `SUMX`.'
    },
    {
      id: 'fc-bi2-dax-01-c',
      front: '¿Cuándo se utiliza `RELATED` frente a `RELATEDTABLE` en DAX?',
      back: '`RELATED` se usa en el lado muchos (N) para traer un valor escalar del lado uno (1); `RELATEDTABLE` se usa en el lado 1 para obtener las filas relacionadas del lado N.'
    }
  ],

  glossaryTerms: [
    'bi2-dax-contexto-evaluacion',
    'bi2-dax-funciones-iteradoras'
  ],

  sources: [
    {
      title: 'Microsoft Learn — Data Analysis Expressions (DAX) Overview: Context in DAX Formulas',
      url: 'https://learn.microsoft.com/en-us/dax/dax-overview',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Definición oficial de contexto de fila y contexto de filtro en expresiones DAX.'
    },
    {
      title: 'Microsoft Learn — RELATED Function (DAX)',
      url: 'https://learn.microsoft.com/en-us/dax/related-function-dax',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Navegación desde el lado muchos hacia el lado uno de una relación activa dentro de un contexto de fila.'
    },
    {
      title: 'Microsoft Learn — Data reduction techniques for Import modeling',
      url: 'https://learn.microsoft.com/en-us/power-bi/guidance/import-modeling-data-reduction',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Ventaja de memoria en VertiPaq al usar medidas iteradoras con SUMX en lugar de columnas calculadas persistidas.'
    }
  ],

  aiNotes: 'El error más frecuente es confundir el contexto de fila con el contexto de filtro, o creer que el contexto de fila propaga filtros por las relaciones automáticamente. Pide siempre a la persona que identifique primero qué filtros vienen del reporte y luego qué tabla se está recorriendo fila por fila.'
};

export default lesson;
