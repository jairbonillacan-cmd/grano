const lesson = {
  id: 'c0-hojas-01-tablas-referencias',
  moduleId: 'c0-hojas',
  tracks: ['core'],
  level: 0,
  order: 1,
  title: 'Tablas estructuradas, referencias con nombre y filtros',
  minutes: 15,
  prerequisites: ['c0-datos-05'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), operaciones exporta los pedidos del mes a una hoja de cálculo y escribe `=SUMA(H2:H15000)` al final. El viernes llegan 3.000 pedidos nuevos en las filas 15001 a 18000 y además alguien filtra la columna `status` para ver solo los pedidos completados (`completed`). Sin embargo, la celda de suma sigue mostrando exactamente el mismo número que el jueves e incluye pedidos cancelados. ¿Por qué un rango fijo y la función `SUMA` ignoran las filas nuevas y los filtros activos?',

  objectives: [
    'Convertir un rango suelto en una tabla estructurada para que las fórmulas y el formato abarquen las filas nuevas automáticamente.',
    'Escribir fórmulas legibles con referencias estructuradas por nombre de columna (`[@qty] * [@unit_price_usd]`) y traducirlas a expresiones SQL.',
    'Distinguir entre ocultar filas con un filtro visual (`SUMA`) y agregar únicamente los registros filtrados con `SUBTOTALES` o `WHERE`.'
  ],

  sections: [
    {
      id: 'rango-suelto-frente-a-tabla-estructurada',
      heading: 'Por qué un rango de celdas sueltas se rompe al crecer o al ordenar',
      body: 'Un rango de celdas con bordes (`A2:H15000`) no es una tabla para la hoja de cálculo. Si pegas 3.000 filas debajo de la fila 15000, la fórmula `=SUMA(H2:H15000)` no se actualiza. Esos registros nuevos quedan fuera del cálculo. Peor aún: si seleccionas solo la columna `total_usd` y la ordenas, esa columna se mueve sola. Los importes quedan asignados a un `order_id` equivocado.\n\nAl convertir el rango en una **tabla estructurada** (`Ctrl + T` en Excel), el bloque funciona como una unidad. Cada fila conserva juntos sus campos al ordenar. Además, los encabezados quedan visibles al bajar y toda fila nueva amplía el rango automáticamente.'
    },
    {
      id: 'referencias-estructuradas-y-columnas-calculadas',
      heading: 'Referencias estructuradas: nombrar columnas en lugar de coordenadas',
      body: 'Leer una fórmula como `=D2*E2-F2` obliga a subir hasta la fila 1 para ver qué significa cada letra. En una tabla estructurada llamada `TablaLineas`, escribes una **referencia estructurada**: `=[@qty]*[@unit_price_usd]-[@discount_usd]`. El símbolo `@` significa "usa el valor de esta columna en la fila actual". La hoja copia esa misma fórmula desde la primera hasta la última fila automáticamente.\n\nEsta sintaxis se traduce de forma directa a SQL. Al escribir `SELECT qty * unit_price_usd - discount_usd AS line_total_calculado FROM order_items`, el motor recorre la tabla fila por fila. Calcula la expresión usando los nombres de columna, sin depender nunca de coordenadas como `D2` o `E42000`.',
      example: {
        language: 'sql',
        code: `SELECT
  order_item_id,
  order_id,
  product_id,
  qty,
  unit_price_usd,
  discount_usd,
  ROUND(qty * unit_price_usd - discount_usd, 2) AS line_total_calculado
FROM order_items
ORDER BY order_item_id
LIMIT 5;`,
        expectedOutput: [
          {
            order_item_id: 1,
            order_id: 10001,
            product_id: 30,
            qty: 1,
            unit_price_usd: 33.74,
            discount_usd: 0,
            line_total_calculado: 33.74
          },
          {
            order_item_id: 2,
            order_id: 10002,
            product_id: 41,
            qty: 3,
            unit_price_usd: 15.25,
            discount_usd: 0,
            line_total_calculado: 45.75
          },
          {
            order_item_id: 3,
            order_id: 10003,
            product_id: 52,
            qty: 2,
            unit_price_usd: 186.16,
            discount_usd: 0,
            line_total_calculado: 372.32
          },
          {
            order_item_id: 4,
            order_id: 10003,
            product_id: 81,
            qty: 1,
            unit_price_usd: 40.75,
            discount_usd: 0,
            line_total_calculado: 40.75
          },
          {
            order_item_id: 5,
            order_id: 10004,
            product_id: 63,
            qty: 3,
            unit_price_usd: 78.77,
            discount_usd: 0,
            line_total_calculado: 236.31
          }
        ]
      }
    },
    {
      id: 'filtros-visuales-frente-a-subtotales-y-where',
      heading: 'La trampa de SUMA sobre filas filtradas frente a SUBTOTALES y WHERE',
      body: 'Cuando filtras los encabezados de una hoja y eliges `status = "completed"`, las demás filas no se borran. Los pedidos `cancelled`, `refunded` y `pending` solo se ocultan en la pantalla. Si en otra celda escribes `=SUMA(TablaPedidos[total_usd])`, la función suma las 18.000 filas completas (`$7.669.817,77`), incluidas las ocultas.\n\nPara sumar solo las filas visibles debes activar la fila de totales, que usa `=SUBTOTALES(109; [total_usd])`. También puedes declarar la condición con `=SUMA.SI.CONJUNTO(TablaPedidos[total_usd]; TablaPedidos[status]; "completed")`. En SQL, la cláusula `WHERE` filtra antes de sumar: `SUM(total_usd)` agrega únicamente los 14.760 pedidos completados (`$6.269.462,42`).'
    }
  ],

  workedExample: {
    title: 'Suma ciega con filas ocultas frente a filtrado explícito en pedidos',
    description: 'Compara qué ocurre en Mercado Brisa al sumar toda la columna `total_usd` de `orders` sin filtrar estados frente a aplicar un filtro explícito equivalente a `SUBTOTALES(109)` o `WHERE`:',
    steps: [
      {
        label: 'Enfoque con error: SUMA incluye filas ocultas (canceladas y reembolsadas)',
        explanation: 'Equivalente a escribir `=SUMA(TablaPedidos[total_usd])`: aunque ocultes filas en pantalla con un autofiltro, la suma agrega los 18.000 pedidos e infla el ingreso en 1,4 millones de dólares.',
        code: `SELECT
  COUNT(*) AS filas_sumadas,
  ROUND(SUM(total_usd), 2) AS total_usd_sin_filtrar
FROM orders;`,
        expectedOutput: [
          {
            filas_sumadas: 18000,
            total_usd_sin_filtrar: 7669817.77
          }
        ]
      },
      {
        label: 'Solución verificada: filtrar antes de agregar (SUBTOTALES / WHERE)',
        explanation: 'Equivalente a `=SUBTOTALES(109; TablaPedidos[total_usd])` con el filtro activo en `completed` o a `=SUMA.SI.CONJUNTO`: solo entran en el cálculo los 14.760 pedidos completados.',
        code: `SELECT
  status,
  COUNT(*) AS pedidos_visibles,
  ROUND(SUM(total_usd), 2) AS total_usd_filtrado
FROM orders
WHERE status = 'completed'
GROUP BY status;`,
        expectedOutput: [
          {
            status: 'completed',
            pedidos_visibles: 14760,
            total_usd_filtrado: 6269462.42
          }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'chk-c0-hojas-01-rango',
      type: 'mcq',
      prompt: 'Tienes una hoja con ventas en el rango `A2:F500` y una celda con `=SUMA(F2:F500)`. Si pegas 120 ventas nuevas en `A501:F620` sin usar una tabla estructurada, ¿qué devuelve la fórmula?',
      options: [
        {
          id: 'a',
          text: 'Sigue sumando solo desde `F2` hasta `F500` e ignora las 120 filas nuevas.',
          correct: true,
          feedback: 'Correcto. Un rango por coordenadas fijas no se expande al pegar filas debajo; necesitas una tabla estructurada para que la columna crezca sola.'
        },
        {
          id: 'b',
          text: 'Actualiza la fórmula automáticamente a `=SUMA(F2:F620)` porque las filas son contiguas.',
          correct: false,
          feedback: 'Incorrecto. Esa expansión automática de referencias solo ocurre cuando el rango fue convertido previamente en tabla estructurada.'
        },
        {
          id: 'c',
          text: 'Muestra el error `#¡REF!` porque el tamaño de la hoja cambió.',
          correct: false,
          feedback: 'Incorrecto. La hoja no muestra ningún aviso de error: devuelve un número desactualizado en silencio.'
        }
      ],
      explanation: 'Los rangos fijos como `F2:F500` no crecen al pegar datos nuevos al final. Convertir el bloque en una tabla estructurada y usar `=SUMA(TablaVentas[importe])` evita que las filas nuevas queden fuera del total.'
    },
    {
      id: 'chk-c0-hojas-01-arroba',
      type: 'mcq',
      prompt: 'Dentro de la tabla estructurada `TablaProductos`, ¿qué significa el símbolo `@` en la fórmula `=[@list_price_usd] - [@unit_cost_usd]`?',
      options: [
        {
          id: 'a',
          text: 'Indica que debe restar los valores de `list_price_usd` y `unit_cost_usd` pertenecientes únicamente a la fila actual.',
          correct: true,
          feedback: 'Exacto. El operador de intersección implícita `@` evalúa la expresión fila por fila usando los valores de esa misma fila.'
        },
        {
          id: 'b',
          text: 'Indica que debe restar el promedio de toda la columna `list_price_usd` menos el de `unit_cost_usd`.',
          correct: false,
          feedback: 'Incorrecto. Para referenciar toda la columna se usa `TablaProductos[list_price_usd]` sin el prefijo `@`.'
        },
        {
          id: 'c',
          text: 'Convierte el resultado numérico en una dirección de correo electrónico o texto.',
          correct: false,
          feedback: 'Incorrecto. En referencias estructuradas de hojas de cálculo, `@` es el especificador de fila actual.'
        }
      ],
      explanation: 'En una referencia estructurada, `[@columna]` apunta al valor de esa columna en la fila donde se encuentra la celda calculada, igual que una expresión `list_price_usd - unit_cost_usd` en el `SELECT` de SQL.'
    },
    {
      id: 'chk-c0-hojas-01-subtotales',
      type: 'predict-output',
      prompt: 'En `TablaPedidos` (18.000 filas, `$7.669.817,77` en total) filtras visualmente `status = "completed"` (14.760 filas, `$6.269.462,42`). ¿Qué devuelven `=SUMA(TablaPedidos[total_usd])` y `=SUBTOTALES(109; TablaPedidos[total_usd])`?',
      options: [
        {
          id: 'a',
          text: '`SUMA` devuelve `$7.669.817,77` (incluye filas ocultas) y `SUBTOTALES(109; ...)` devuelve `$6.269.462,42` (solo filas visibles).',
          correct: true,
          feedback: 'Correcto. `SUMA` ignora los filtros visuales de la hoja, mientras que el código `109` de `SUBTOTALES` suma exclusivamente las filas visibles.'
        },
        {
          id: 'b',
          text: 'Ambas fórmulas devuelven `$6.269.462,42` porque la tabla tiene un filtro activo.',
          correct: false,
          feedback: 'Incorrecto. `SUMA` siempre agrega todas las celdas del rango aunque estén ocultas por un filtro.'
        },
        {
          id: 'c',
          text: '`SUMA` devuelve `$6.269.462,42` y `SUBTOTALES` devuelve el promedio por pedido.',
          correct: false,
          feedback: 'Incorrecto. El código `109` en `SUBTOTALES` calcula la suma excluyendo filas ocultas, no el promedio.'
        }
      ],
      explanation: 'Un autofiltro en hoja de cálculo solo oculta filas en la vista. `SUMA` suma tanto celdas visibles como ocultas; para respetar el filtro activo debes usar `SUBTOTALES(109; ...)` o una condición explícita.'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Filtro limpio y columna calculada de margen sobre el catálogo',
    language: 'sql',
    prompt: 'En Mercado Brisa, la tabla `products` contiene productos inactivos (`is_active = false`) y un SKU de prueba con precio negativo (`list_price_usd = -9.99`). Completa la consulta equivalente a filtrar una tabla estructurada para obtener los 5 productos activos de la categoría `\'Café en grano\'` con `list_price_usd > 0` y mayor margen unitario (`ROUND(list_price_usd - unit_cost_usd, 2) AS unit_margin_usd`), ordenados por `unit_margin_usd DESC` y `product_id ASC`.',
    starterCode: `SELECT
  sku,
  product_name,
  list_price_usd,
  unit_cost_usd,
  -- Calcula unit_margin_usd redondeado a 2 decimales
  ROUND(list_price_usd - unit_cost_usd, 2) AS unit_margin_usd
FROM products
-- Filtra activos, list_price_usd > 0 y 'Café en grano'
WHERE is_active = true
ORDER BY unit_margin_usd DESC, product_id ASC
LIMIT 5;`,
    expected: `SELECT
  sku,
  product_name,
  list_price_usd,
  unit_cost_usd,
  ROUND(list_price_usd - unit_cost_usd, 2) AS unit_margin_usd
FROM products
WHERE is_active = true
  AND list_price_usd > 0
  AND category = 'Café en grano'
ORDER BY unit_margin_usd DESC, product_id ASC
LIMIT 5;`,
    orderMatters: true,
    hints: [
      'En la cláusula `WHERE`, combina las tres condiciones con `AND`: `is_active = true`, `list_price_usd > 0` y `category = \'Café en grano\'`.',
      'Respeta las tildes y mayúsculas exactas del texto `\'Café en grano\'` entre comillas simples.',
      'Mantén la columna calculada `ROUND(list_price_usd - unit_cost_usd, 2) AS unit_margin_usd` y el orden `ORDER BY unit_margin_usd DESC, product_id ASC LIMIT 5`.'
    ],
    solution: `SELECT
  sku,
  product_name,
  list_price_usd,
  unit_cost_usd,
  ROUND(list_price_usd - unit_cost_usd, 2) AS unit_margin_usd
FROM products
WHERE is_active = true
  AND list_price_usd > 0
  AND category = 'Café en grano'
ORDER BY unit_margin_usd DESC, product_id ASC
LIMIT 5;`,
    solutionExplanation: 'La expresión `ROUND(list_price_usd - unit_cost_usd, 2)` equivale a la columna calculada `=[@list_price_usd]-[@unit_cost_usd]` de una tabla estructurada, y el `WHERE` filtra explícitamente los productos inactivos y el SKU de prueba antes de ordenar.',
    expectedOutputTable: [
      {
        sku: 'MB-CAF-156',
        product_name: 'Café en grano Oaxaca Serie 156',
        list_price_usd: 41.35,
        unit_cost_usd: 16.73,
        unit_margin_usd: 24.62
      },
      {
        sku: 'MB-CAF-081',
        product_name: 'Café en grano Chiapas Serie 81',
        list_price_usd: 40.75,
        unit_cost_usd: 16.52,
        unit_margin_usd: 24.23
      },
      {
        sku: 'MB-CAF-141',
        product_name: 'Café en grano Chiapas Serie 141',
        list_price_usd: 39.7,
        unit_cost_usd: 16.78,
        unit_margin_usd: 22.92
      },
      {
        sku: 'MB-CAF-001',
        product_name: 'Café en grano Chiapas Serie 1',
        list_price_usd: 39.76,
        unit_cost_usd: 16.88,
        unit_margin_usd: 22.88
      },
      {
        sku: 'MB-CAF-146',
        product_name: 'Café en grano Oaxaca Serie 146',
        list_price_usd: 38.01,
        unit_cost_usd: 15.32,
        unit_margin_usd: 22.69
      }
    ]
  },

  roleNotes: {
    de: 'Cuando ingieres hojas Excel hacia un almacén de datos, exige que los equipos operativos entreguen un objeto de tabla estructurada con nombre fijo en lugar de rangos libres, para evitar leer filas de notas al pie.',
    da: 'Reemplaza siempre las referencias por coordenadas (`C2:C500`) por referencias estructuradas (`TablaPedidos[total_usd]`) y verifica con `SUBTOTALES` o `SUMA.SI.CONJUNTO` que ningún filtro visual esté distorsionando tus totales.',
    bi: 'Al conectar Power BI a un archivo Excel, importa siempre el objeto Tabla (`TablaPedidos`) y nunca la pestaña completa (`Hoja1$`), porque la pestaña arrastra celdas vacías y totales manuales.'
  },

  summary: [
    'Una tabla estructurada une las columnas de cada fila y se expande sola al añadir registros nuevos.',
    'Las referencias estructuradas usan nombres de columna (`[@qty] * [@unit_price_usd]`) igual que las expresiones en SQL.',
    'La función `SUMA` incluye siempre las filas ocultas por un filtro visual de la hoja.',
    'Para sumar solo filas filtradas usa `SUBTOTALES(109; ...)` en hoja de cálculo o `WHERE` en SQL.'
  ],

  flashcards: [
    {
      id: 'fc-c0-hojas-01-a',
      front: '¿Qué ventaja aporta convertir un rango en tabla estructurada frente a dejar celdas sueltas?',
      back: 'Expande el rango automáticamente al añadir filas nuevas, propaga las columnas calculadas e impide desalinear columnas al ordenar.'
    },
    {
      id: 'fc-c0-hojas-01-b',
      front: '¿Cómo se interpreta `=[@qty] * [@unit_price_usd]` en una tabla estructurada y cuál es su equivalente en SQL?',
      back: 'Multiplica `qty` por `unit_price_usd` en la fila actual (`@`). En SQL equivale a escribir `SELECT qty * unit_price_usd FROM order_items`.'
    },
    {
      id: 'fc-c0-hojas-01-c',
      front: '¿Por qué `=SUMA(TablaPedidos[total_usd])` no cambia su resultado al filtrar la tabla en pantalla?',
      back: 'Porque el filtro solo oculta filas visualmente y `SUMA` agrega tanto celdas visibles como ocultas; para respetar el filtro se usa `SUBTOTALES(109; ...)`.'
    }
  ],

  glossaryTerms: [
    'c0-hojas-tabla-estructurada',
    'c0-hojas-referencia-estructurada'
  ],

  sources: [
    {
      title: 'Overview of Excel tables',
      url: 'https://support.microsoft.com/en-us/office/overview-of-excel-tables-7ab0bb7d-3a9e-4b56-a3c9-6c94334e492c',
      publisher: 'Microsoft Support',
      accessed: '2026-10-29',
      supports: 'Creación de tablas estructuradas, expansión automática de filas y propagación de columnas calculadas.'
    },
    {
      title: 'Using structured references with Excel tables',
      url: 'https://support.microsoft.com/en-us/office/using-structured-references-with-excel-tables-f5ed2452-2337-4f71-bed3-c8ae6d2b276e',
      publisher: 'Microsoft Support',
      accessed: '2026-10-29',
      supports: 'Sintaxis de referencias estructuradas por nombre de tabla y columna y operador de fila actual (@).'
    },
    {
      title: 'SUBTOTAL function',
      url: 'https://support.microsoft.com/en-us/office/subtotal-function-7b027003-f060-4ade-9040-e478765b9939',
      publisher: 'Microsoft Support',
      accessed: '2026-10-29',
      supports: 'Diferencia entre SUMA y SUBTOTALES(109) al agregar rangos con filas ocultas por filtros.'
    },
    {
      title: 'Data Organization in Spreadsheets (Karl W. Broman & Kara H. Woo)',
      url: 'https://kbroman.org/dataorg/',
      publisher: 'The American Statistician / kbroman.org',
      accessed: '2026-10-29',
      supports: 'Organización de hojas de cálculo como un único rectángulo contiguo con encabezados limpios.'
    }
  ],

  aiNotes: 'El error más común en nivel 0 es pensar que filtrar una hoja borra o excluye las filas para cualquier función `=SUMA()` externa, o creer que pintar bordes convierte un rango en tabla estructurada. Contrasta siempre la ocultación visual en hoja de cálculo frente al filtrado explícito con `SUBTOTALES(109)` o `WHERE` en SQL.'
};

export default lesson;
