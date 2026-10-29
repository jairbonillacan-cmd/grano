const lesson = {
  id: 'c0-hojas-03-buscarx-cruces',
  moduleId: 'c0-hojas',
  tracks: ['core'],
  level: 0,
  order: 3,
  title: 'BUSCARX (XLOOKUP): cruces seguros y claves duplicadas',
  minutes: 20,
  prerequisites: ['c0-hojas-02-tablas-dinamicas'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), la tabla `order_items` tiene 42.000 líneas con `product_id`, pero el nombre y la categoría del producto viven en `products` (180 filas). Al mismo tiempo, finanzas intenta traer el estado de cobro desde `payments` (19.200 filas) hacia `orders` (18.000 pedidos) usando `=BUSCARX([@order_id]; TablaPagos[order_id]; TablaPagos[status])`. En 675 pedidos ya pagados en un segundo intento, la hoja reporta que el pago falló. ¿Qué ocurre cuando la clave buscada aparece repetida en la tabla destino?',

  objectives: [
    'Cruzar tablas en hoja de cálculo con `BUSCARX` (`XLOOKUP`) aprovechando su coincidencia exacta por defecto y su argumento `si_no_se_encuentra`.',
    'Explicar por qué `BUSCARX` sustituye a `BUSCARV` (`VLOOKUP`) al separar la columna de búsqueda de la columna devuelta.',
    'Auditar si la clave de la tabla buscada es única antes de usar `BUSCARX` o `LEFT JOIN` para evitar ocultar reintentos o duplicar importes.'
  ],

  sections: [
    {
      id: 'por-que-buscarx-reemplaza-a-buscarv',
      heading: 'Por qué BUSCARX reemplaza a BUSCARV al cruzar tablas por clave',
      body: 'Durante décadas se usó `BUSCARV` (`VLOOKUP`) para traer datos de otra hoja. Sin embargo, arrastraba tres defectos: exigía que la clave estuviera en la primera columna a la izquierda, pedía un número fijo de columna (como `3`) y usaba coincidencia aproximada si omitías el cuarto argumento `FALSO`. Si alguien insertaba una columna intermedia, la fórmula devolvía el dato equivocado.\n\nLa función **`BUSCARX`** (`XLOOKUP`) corrige esos tres defectos. Su sintaxis nombra dos columnas independientes: `=BUSCARX([@product_id]; TablaProductos[product_id]; TablaProductos[category]; "Sin catálogo")`. Busca por coincidencia exacta por defecto, permite buscar hacia la izquierda o la derecha y define en el cuarto argumento qué mostrar cuando un código no existe.'
    },
    {
      id: 'trampa-claves-duplicadas-buscarx-vs-join',
      heading: 'Qué pasa cuando la clave buscada está duplicada en la otra tabla',
      body: 'Antes de escribir `BUSCARX` o un `LEFT JOIN` en SQL, hazte una pregunta: ¿la clave que busco aparece una sola vez en la tabla destino? En `products`, `product_id` es único (`180` filas y `180` claves distintas). En cambio, en `payments` hay `19.200` filas para `18.000` pedidos: existen `750` segundos intentos (`attempt_number = 2`) y `450` webhooks duplicados.\n\nAquí aparece una diferencia crítica entre la hoja de cálculo y SQL. Si aplicas `BUSCARX` desde `orders` hacia `payments`, la función devuelve en silencio **solo la primera fila encontrada**. En 675 pedidos cobrados en el intento 2, reporta el fallo del intento 1. Si haces un `JOIN` directo en SQL, el motor devuelve todas las coincidencias y multiplica las filas.',
      example: {
        language: 'sql',
        code: `SELECT
  'products (product_id)' AS tabla_clave,
  COUNT(*) AS total_filas,
  COUNT(DISTINCT product_id) AS claves_unicas,
  COUNT(*) - COUNT(DISTINCT product_id) AS filas_duplicadas
FROM products
UNION ALL
SELECT
  'payments (order_id)' AS tabla_clave,
  COUNT(*) AS total_filas,
  COUNT(DISTINCT order_id) AS claves_unicas,
  COUNT(*) - COUNT(DISTINCT order_id) AS filas_duplicadas
FROM payments;`,
        expectedOutput: [
          {
            tabla_clave: 'products (product_id)',
            total_filas: 180,
            claves_unicas: 180,
            filas_duplicadas: 0
          },
          {
            tabla_clave: 'payments (order_id)',
            total_filas: 19200,
            claves_unicas: 18000,
            filas_duplicadas: 1200
          }
        ]
      }
    },
    {
      id: 'equivalencia-buscarx-y-left-join',
      heading: 'Cómo traducir un BUSCARX seguro a un LEFT JOIN en SQL',
      body: 'Cuando has comprobado que el catálogo tiene una sola fila por clave (como `products` por `product_id`), un `BUSCARX` equivale a un `LEFT JOIN` en SQL. La tabla principal va en el `FROM` (`order_items oi`) y el catálogo va en el `LEFT JOIN` (`products p ON oi.product_id = p.product_id`). El cuarto argumento `"Sin catálogo"` de `BUSCARX` se escribe en SQL con `COALESCE(p.category, \'Sin catálogo\')`.\n\nSi la tabla derecha tiene varias filas por clave (como `payments` por `order_id`), no cruces nunca de forma directa. Primero agrupa o filtra la tabla derecha hasta dejar una única fila por `order_id`.'
    }
  ],

  workedExample: {
    title: 'Cruce con claves duplicadas en pagos frente a deduplicación previa',
    description: 'Compara el efecto de cruzar `orders` (`18.000` pedidos) con `payments` (`19.200` filas) sin verificar antes la unicidad de `order_id`:',
    steps: [
      {
        label: 'Enfoque con error: cruzar sin deduplicar la tabla buscada (payments)',
        explanation: 'Como `payments` tiene 1.200 filas extra (750 reintentos y 450 duplicados de red), unir directamente genera 19.200 filas e infla la suma de `orders.total_usd` de 7,67 a 8,18 millones de dólares.',
        code: `SELECT
  COUNT(*) AS filas_tras_cruce,
  COUNT(DISTINCT o.order_id) AS pedidos_reales,
  ROUND(SUM(o.total_usd), 2) AS total_pedidos_inflado_usd
FROM orders o
JOIN payments p ON o.order_id = p.order_id;`,
        expectedOutput: [
          {
            filas_tras_cruce: 19200,
            pedidos_reales: 18000,
            total_pedidos_inflado_usd: 8178100.18
          }
        ]
      },
      {
        label: 'Solución verificada: colapsar payments a una fila por order_id antes del cruce',
        explanation: 'Al resumir `payments` a una sola fila por `order_id` antes de cruzar (clave única 1:1), tanto `LEFT JOIN` como `BUSCARX` mantienen los 18.000 pedidos exactos (`$7.669.817,77`) y rescatan los pagos capturados en el segundo intento.',
        code: `WITH pago_unico_por_pedido AS (
  SELECT
    order_id,
    COUNT(*) AS intentos_registrados,
    ROUND(MAX(CASE WHEN status = 'captured' THEN amount_usd ELSE 0 END), 2) AS monto_capturado_usd
  FROM payments
  GROUP BY order_id
)
SELECT
  COUNT(*) AS filas_tras_cruce,
  COUNT(DISTINCT o.order_id) AS pedidos_reales,
  ROUND(SUM(o.total_usd), 2) AS total_pedidos_exacto_usd,
  ROUND(SUM(p.monto_capturado_usd), 2) AS total_capturado_usd
FROM orders o
LEFT JOIN pago_unico_por_pedido p ON o.order_id = p.order_id;`,
        expectedOutput: [
          {
            filas_tras_cruce: 18000,
            pedidos_reales: 18000,
            total_pedidos_exacto_usd: 7669817.77,
            total_capturado_usd: 6874488
          }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'chk-c0-hojas-03-buscarv-vs-buscarx',
      type: 'mcq',
      prompt: 'En una hoja tienes `=BUSCARV(A2; Productos!A:F; 4; FALSO)` para traer el precio desde la cuarta columna. Si alguien inserta una columna nueva `"marca"` entre las columnas `B` y `C` de `Productos`, ¿qué ocurre?',
      options: [
        {
          id: 'a',
          text: '`BUSCARV` sigue leyendo la cuarta columna física (que ahora es otra columna) y devuelve el dato equivocado, mientras `BUSCARX` con `TablaProductos[list_price_usd]` no se rompe.',
          correct: true,
          feedback: 'Correcto. El número de columna fijo (`4`) de `BUSCARV` no se actualiza al insertar columnas; `BUSCARX` apunta directamente a la columna de retorno.'
        },
        {
          id: 'b',
          text: '`BUSCARV` cambia el número `4` por un `5` automáticamente al detectar la columna nueva.',
          correct: false,
          feedback: 'Incorrecto. El tercer argumento de `BUSCARV` es un número entero estático que no se ajusta al insertar columnas.'
        },
        {
          id: 'c',
          text: 'Tanto `BUSCARV` como `BUSCARX` borran la columna insertada para proteger la fórmula.',
          correct: false,
          feedback: 'Incorrecto. Ninguna función de búsqueda impide insertar columnas en la hoja.'
        }
      ],
      explanation: '`BUSCARV` depende de un número de índice fijo (`4`) y exige que la clave esté a la izquierda. `BUSCARX` referencia la columna buscada y la columna devuelta por separado, por lo que insertar columnas no altera el resultado.'
    },
    {
      id: 'chk-c0-hojas-03-duplicados',
      type: 'predict-output',
      prompt: 'En `payments`, el pedido `10001` tiene dos filas: la fila 1 con `attempt_number = 1` y `status = "failed"`, y la fila 2 con `attempt_number = 2` y `status = "captured"`. ¿Qué devuelve `=BUSCARX(10001; TablaPagos[order_id]; TablaPagos[status])` por defecto?',
      options: [
        {
          id: 'a',
          text: 'Devuelve `"failed"`, porque en su modo por defecto recorre de arriba abajo y se detiene en la primera coincidencia.',
          correct: true,
          feedback: 'Exacto. `BUSCARX` devuelve únicamente la primera aparición y oculta en silencio que hubo una segunda fila con `"captured"`.'
        },
        {
          id: 'b',
          text: 'Devuelve `"failed, captured"` concatenando todas las filas que coinciden con `10001`.',
          correct: false,
          feedback: 'Incorrecto. `BUSCARX` devuelve un único valor escalar correspondiente a la primera coincidencia encontrada.'
        },
        {
          id: 'c',
          text: 'Muestra el error `#¡DUPLICADO!` para avisar que `10001` aparece dos veces.',
          correct: false,
          feedback: 'Incorrecto. `BUSCARX` nunca lanza un error cuando hay claves duplicadas: toma la primera fila sin avisar.'
        }
      ],
      explanation: 'Por defecto (`search_mode = 1`), `BUSCARX` busca desde la primera fila hacia abajo y devuelve el primer valor que coincide con la clave, ignorando cualquier fila repetida posterior.'
    },
    {
      id: 'chk-c0-hojas-03-auditoria-unicidad',
      type: 'mcq',
      prompt: 'Antes de cruzar `order_items` con `products` mediante `product_id`, ¿cómo compruebas en hoja de cálculo o en SQL que `product_id` no tiene duplicados en `products`?',
      options: [
        {
          id: 'a',
          text: 'Verificando en SQL que `COUNT(*) = COUNT(DISTINCT product_id)` o en hoja de cálculo que `=MAX(CONTAR.SI(TablaProductos[product_id]; TablaProductos[product_id]))` sea `1`.',
          correct: true,
          feedback: 'Correcto. Si el total de filas es igual al total de claves distintas (o el conteo máximo por clave es 1), la clave es única.'
        },
        {
          id: 'b',
          text: 'Revisando visualmente las primeras 10 filas de la tabla `products`.',
          correct: false,
          feedback: 'Incorrecto. Inspeccionar 10 filas no garantiza que no existan duplicados en la fila 150 o en la fila 19.000.'
        },
        {
          id: 'c',
          text: 'Comprobando que `SUM(product_id)` sea un número par.',
          correct: false,
          feedback: 'Incorrecto. Sumar identificadores numéricos no aporta ninguna información sobre si existen claves repetidas.'
        }
      ],
      explanation: 'Comprobar que el número total de filas coincide con el número de claves distintas (`COUNT(*) = COUNT(DISTINCT pk)`) garantiza una relación `1:1` en el catálogo antes de ejecutar `BUSCARX` o `LEFT JOIN`.'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Cruzar líneas de pedido con el catálogo de productos por clave única',
    language: 'sql',
    prompt: 'En Mercado Brisa ya verificamos que `product_id` es único en `products` (180 filas = 180 claves). Escribe la consulta SQL equivalente a traer `category` con `BUSCARX` hacia `order_items` (`LEFT JOIN products p ON oi.product_id = p.product_id`), excluyendo el producto de prueba con precio negativo (`WHERE p.list_price_usd > 0`), y calcula por `p.category`: `lineas_vendidas` (`COUNT(oi.order_item_id)`), `unidades_totales` (`SUM(oi.qty)`) e `ingresos_catalogo_usd` (`ROUND(SUM(oi.line_total_usd), 2)`), ordenando por `ingresos_catalogo_usd DESC`.',
    starterCode: `SELECT
  p.category,
  COUNT(oi.order_item_id) AS lineas_vendidas,
  SUM(oi.qty) AS unidades_totales,
  ROUND(SUM(oi.line_total_usd), 2) AS ingresos_catalogo_usd
FROM order_items oi
-- Une con products p por product_id usando LEFT JOIN
-- Filtra únicamente los productos con p.list_price_usd > 0
GROUP BY p.category
ORDER BY ingresos_catalogo_usd DESC;`,
    expected: `SELECT
  p.category,
  COUNT(oi.order_item_id) AS lineas_vendidas,
  SUM(oi.qty) AS unidades_totales,
  ROUND(SUM(oi.line_total_usd), 2) AS ingresos_catalogo_usd
FROM order_items oi
LEFT JOIN products p ON oi.product_id = p.product_id
WHERE p.list_price_usd > 0
GROUP BY p.category
ORDER BY ingresos_catalogo_usd DESC;`,
    orderMatters: true,
    hints: [
      'Debajo de `FROM order_items oi`, añade `LEFT JOIN products p ON oi.product_id = p.product_id`.',
      'Debajo del `LEFT JOIN`, añade `WHERE p.list_price_usd > 0` para excluir el SKU de calibración negativo (`SKU-TEST-NEG`).',
      'Conserva el `GROUP BY p.category` y el `ORDER BY ingresos_catalogo_usd DESC`.'
    ],
    solution: `SELECT
  p.category,
  COUNT(oi.order_item_id) AS lineas_vendidas,
  SUM(oi.qty) AS unidades_totales,
  ROUND(SUM(oi.line_total_usd), 2) AS ingresos_catalogo_usd
FROM order_items oi
LEFT JOIN products p ON oi.product_id = p.product_id
WHERE p.list_price_usd > 0
GROUP BY p.category
ORDER BY ingresos_catalogo_usd DESC;`,
    solutionExplanation: 'Como `product_id` es clave única en `products`, el `LEFT JOIN` enriquece cada una de las 42.000 líneas de `order_items` con su categoría exacta sin duplicar filas, tal como haría `=BUSCARX([@product_id]; TablaProductos[product_id]; TablaProductos[category])` seguido de una tabla dinámica.',
    expectedOutputTable: [
      {
        category: 'Molinos',
        lineas_vendidas: 8449,
        unidades_totales: 17543,
        ingresos_catalogo_usd: 2651582.18
      },
      {
        category: 'Cafeteras',
        lineas_vendidas: 8448,
        unidades_totales: 17417,
        ingresos_catalogo_usd: 2004650.1
      },
      {
        category: 'Suscripciones',
        lineas_vendidas: 8212,
        unidades_totales: 16939,
        ingresos_catalogo_usd: 802306.97
      },
      {
        category: 'Accesorios',
        lineas_vendidas: 8446,
        unidades_totales: 17553,
        ingresos_catalogo_usd: 716955.84
      },
      {
        category: 'Café en grano',
        lineas_vendidas: 8445,
        unidades_totales: 17460,
        ingresos_catalogo_usd: 506969.22
      }
    ]
  },

  roleNotes: {
    de: 'En los pipelines de datos, el equivalente al error de claves duplicadas en `BUSCARX` es hacer un `LEFT JOIN` contra una dimensión con historial (`customer_changes`) sin filtrar `is_current = true` o la ventana de validez.',
    da: 'Antes de cruzar dos hojas con `BUSCARX`, comprueba siempre si la clave buscada tiene duplicados en la tabla destino; si los tiene, `BUSCARX` ocultará todas las filas salvo la primera.',
    bi: 'En Power BI, cuando intentas crear una relación `1:N` hacia una tabla de catálogo que tiene una clave duplicada, el motor bloquea la relación o te empuja a una relación muchos-a-muchos: limpia los duplicados primero.'
  },

  summary: [
    '`BUSCARX` busca por coincidencia exacta por defecto y no se rompe al insertar columnas.',
    'Usa el cuarto argumento de `BUSCARX` (o `COALESCE` en SQL) para etiquetar claves no encontradas.',
    'Si la clave buscada está repetida, `BUSCARX` devuelve solo la primera fila y oculta el resto.',
    'Verifica siempre que `COUNT(*) = COUNT(DISTINCT clave)` en el catálogo antes de cruzar.'
  ],

  flashcards: [
    {
      id: 'fc-c0-hojas-03-a',
      front: '¿Cuáles son las tres ventajas de `BUSCARX` (`XLOOKUP`) frente a `BUSCARV` (`VLOOKUP`)?',
      back: 'Usa coincidencia exacta por defecto, puede buscar hacia la izquierda o derecha, y referencia la columna devuelta sin un número de columna fijo.'
    },
    {
      id: 'fc-c0-hojas-03-b',
      front: '¿Qué diferencia hay entre `BUSCARX` y `LEFT JOIN` cuando la clave buscada aparece 2 veces en la tabla destino?',
      back: '`BUSCARX` devuelve silenciosamente solo la primera coincidencia (1 fila), mientras que `LEFT JOIN` genera 2 filas y duplica los importes de la tabla izquierda.'
    },
    {
      id: 'fc-c0-hojas-03-c',
      front: '¿A qué expresión SQL equivale el cuarto argumento (`"Sin catálogo"`) de `BUSCARX` tras hacer un `LEFT JOIN`?',
      back: 'Equivale a envolver la columna de la tabla derecha en `COALESCE(p.category, \'Sin catálogo\')` para reemplazar los valores `NULL`.'
    }
  ],

  glossaryTerms: [
    'c0-hojas-buscarx',
    'c0-hojas-referencia-estructurada',
    'c01-grain-fanout'
  ],

  sources: [
    {
      title: 'XLOOKUP function',
      url: 'https://support.microsoft.com/en-us/office/xlookup-function-b7fd680e-6d10-43e6-84f9-88eae8bf5929',
      publisher: 'Microsoft Support',
      accessed: '2026-10-29',
      supports: 'Sintaxis de BUSCARX/XLOOKUP, coincidencia exacta predeterminada y retorno de la primera coincidencia ante duplicados.'
    },
    {
      title: 'VLOOKUP function',
      url: 'https://support.microsoft.com/en-us/office/vlookup-function-0bbc8083-26fe-4963-8ab8-93a18ad188a1',
      publisher: 'Microsoft Support',
      accessed: '2026-10-29',
      supports: 'Comportamiento del índice de columna estático y coincidencia aproximada por omisión en BUSCARV/VLOOKUP.'
    },
    {
      title: 'DuckDB SQL Reference — FROM and JOIN Clauses',
      url: 'https://duckdb.org/docs/sql/query_syntax/from.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Equivalencia entre cruces de catálogo por clave única con LEFT JOIN y multiplicación de filas ante claves repetidas.'
    }
  ],

  aiNotes: 'El punto ciego más peligroso en `BUSCARX` es asumir que si la fórmula no da `#N/D` el cruce es correcto. Recuerda siempre a la persona que `BUSCARX` oculta los duplicados quedándose con la primera fila, mientras que `JOIN` en SQL los multiplica; en ambos casos hay que auditar la unicidad de la clave antes de cruzar.'
};

export default lesson;
