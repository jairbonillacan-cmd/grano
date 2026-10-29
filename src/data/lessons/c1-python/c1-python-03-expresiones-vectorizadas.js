const lesson = {
  id: 'c1-python-03-expresiones-vectorizadas',
  moduleId: 'c1-python',
  tracks: ['core'],
  level: 1,
  order: 3,
  title: 'Filtrar, agrupar, unir y transformar con expresiones',
  minutes: 25,
  prerequisites: ['c1-python-02-io-csv-json-parquet'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), un script en Python unió los 14 760 pedidos completados de `orders` directamente con `order_items` y `refunds` para reportar ventas por región. Sin arrojar ningún error, el cruce generó 34 830 filas y reportó `18 003 141.53 USD` en ventas cuando el total real era `6 269 462.42 USD`. ¿Cómo combinas expresiones vectorizadas, pre-agregación y validación de cardinalidad (`validate="1:1"`) en Polars 2.0 para impedir que un cruce multiplique el dinero?',

  objectives: [
    'Escribir transformaciones condicionales y agregaciones filtradas en una sola pasada con `pl.when().then().otherwise()` y `.filter()` dentro de `.agg()`.',
    'Unir tablas con `.join(..., validate="1:1" | "m:1")` pre-agregando el detalle para evitar que una relación uno-a-muchos duplique importes.',
    'Aplicar funciones de ventana con `.over()` y reestructurar columnas con `.unpivot()` en Polars 2.0 sin recurrir a bucles ni `.apply()`.'
  ],

  sections: [
    {
      id: 'anatomia-expresion-vectorizada',
      heading: 'Por qué una expresión pl.col reemplaza a los bucles y a .apply()',
      body: 'Cuando usas un bucle `for` o `.apply(lambda fila: ...)` en Python, el intérprete detiene la vectorización y evalúa una fila tras otra en un solo hilo. Sobre 42 000 líneas de pedido, ese salto constante entre memoria C/Rust y objetos Python multiplica por 30 o 50 el tiempo de cálculo.\n\nEn Polars 2.0, una **expresión columnar vectorizada** (`pl.col()`) describe qué transformación quieres hacer sobre el vector entero y deja que el motor compilado la ejecute en paralelo en todos los núcleos.\n\nPara lógica condicional, sustituye cualquier `if/else` de Python por `pl.when(condicion).then(valor_si).otherwise(valor_no)`. Puedes encadenar múltiples ramas `.when().then()` y nombrar siempre la columna resultante con `.alias("nombre_columna")` dentro de `.with_columns()` o `.select()`.',
      example: {
        language: 'python',
        code: `import polars as pl

# Clasificar pedidos completados y calcular estadísticos en una sola pasada de group_by
resumen_estados = (
    pl.scan_parquet("public/datasets/orders.parquet")
    .group_by("status")
    .agg(
        pl.len().alias("pedidos"),
        pl.col("total_usd").sum().round(2).alias("total_usd"),
        pl.col("total_usd").mean().round(2).alias("avg_ticket_usd"),
    )
    .sort("pedidos", descending=True)
    .collect()
)`,
        expectedOutput: [
          { status: 'completed', pedidos: 14760, total_usd: 6269462.42, avg_ticket_usd: 424.76 },
          { status: 'refunded', pedidos: 1440, total_usd: 605025.58, avg_ticket_usd: 420.16 },
          { status: 'cancelled', pedidos: 1080, total_usd: 489003.49, avg_ticket_usd: 452.78 },
          { status: 'pending', pedidos: 720, total_usd: 306326.28, avg_ticket_usd: 425.45 }
        ]
      }
    },
    {
      id: 'agregaciones-filtradas-en-group-by',
      heading: 'Métricas condicionales con .filter() dentro de un mismo group_by',
      body: 'Un hábito común al venir de hojas de cálculo o de código imperativo es crear tres DataFrames filtrados por separado y luego unirlos para comparar métricas de un mismo grupo.\n\nEn Polars puedes filtrar cada expresión de forma independiente dentro de `.agg()`. Por ejemplo, `pl.col("total_usd").filter(pl.col("status") == "completed").sum()` suma únicamente los pedidos completados, mientras en la línea de abajo `pl.col("total_usd").filter(pl.col("status") == "refunded").sum()` suma los reembolsados en la misma pasada sobre la tabla.\n\nEste patrón equivale exactamente a la cláusula `SUM(total_usd) FILTER (WHERE status = \'completed\')` de SQL en DuckDB: lee la tabla una sola vez, mantiene el código compacto y evita errores al recomponer tablas intermedias.'
    },
    {
      id: 'joins-y-validacion-de-cardinalidad',
      heading: 'Cruces seguros con pre-agregación y el parámetro validate',
      body: 'En Mercado Brisa, `orders` tiene una fila por pedido (`18 000` filas), mientras `order_items` tiene entre 1 y 4 filas por pedido (`42 000` filas) y `refunds` puede tener varias devoluciones parciales para un mismo pedido (`1 450` filas). Si unes `orders` directamente con `order_items`, cada importe de cabecera (`total_usd`, `shipping_usd`) se repite por cada línea de producto.\n\nPara impedir esta multiplicación silenciosa de filas en Python:\n\n1. Pre-agrega primero `order_items` y `refunds` agrupando por `"order_id"` hasta que tengan exactamente una fila por pedido.\n2. Al unir con `orders`, exige **validación de cardinalidad en uniones** mediante `validate="1:1"` (cuando ambas tablas tienen una fila por pedido) o `validate="m:1"` (cuando cruzas muchos pedidos contra una tabla maestra de tiendas `stores`). Si se cuela una clave duplicada en el lado derecho, Polars y pandas 3.0 detienen la ejecución de inmediato.'
    },
    {
      id: 'expresiones-ventana-over-y-unpivot',
      heading: 'Funciones de ventana (.over) y formato largo (.unpivot) en Polars',
      body: 'Cuando necesitas comparar el precio de cada producto contra el promedio de su propia categoría sin colapsar las 170 filas activas en 5 filas de resumen, añade `.over("category")` al final de cualquier expresión. En Polars, `pl.col("list_price_usd").mean().over("category")` actúa igual que `AVG(list_price_usd) OVER (PARTITION BY category)` en SQL.\n\nPor último, si recibes un reporte con una columna por cada mes o métrica (formato ancho) y necesitas pasarlo a dos columnas `variable` y `valor` (formato largo), utiliza `.unpivot(index="sku", on=["list_price_usd", "unit_cost_usd"])`. Recuerda que en Polars 2.0 el método `.unpivot()` reemplazó de forma definitiva al antiguo nombre `.melt()`.',
      example: {
        language: 'python',
        code: `import polars as pl

# Comparar cada SKU activo contra el precio medio de su categoría usando .over("category")
comparativa_cat = (
    pl.scan_parquet("public/datasets/products.parquet")
    .filter(pl.col("is_active") & (pl.col("list_price_usd") > 0))
    .sort("product_id")
    .with_columns(
        pl.col("list_price_usd").mean().over("category").round(2).alias("cat_avg_price_usd"),
        (pl.col("list_price_usd") - pl.col("list_price_usd").mean().over("category"))
        .round(2)
        .alias("diff_vs_cat_usd"),
    )
    .select(["sku", "category", "list_price_usd", "cat_avg_price_usd", "diff_vs_cat_usd"])
    .head(5)
    .collect()
)`,
        expectedOutput: [
          { sku: 'MB-CAF-001', category: 'Café en grano', list_price_usd: 39.76, cat_avg_price_usd: 29.32, diff_vs_cat_usd: 10.44 },
          { sku: 'MB-MOL-002', category: 'Molinos', list_price_usd: 226.17, cat_avg_price_usd: 152.83, diff_vs_cat_usd: 73.34 },
          { sku: 'MB-CAF-003', category: 'Cafeteras', list_price_usd: 143.78, cat_avg_price_usd: 116.48, diff_vs_cat_usd: 27.3 },
          { sku: 'MB-ACC-004', category: 'Accesorios', list_price_usd: 50.17, cat_avg_price_usd: 40.97, diff_vs_cat_usd: 9.2 },
          { sku: 'MB-SUS-005', category: 'Suscripciones', list_price_usd: 28.51, cat_avg_price_usd: 47.94, diff_vs_cat_usd: -19.43 }
        ]
      }
    }
  ],

  workedExample: {
    title: 'Consolidación regional de ventas, unidades y reembolsos en Polars 2.0',
    description: 'Contrasta el cruce directo 1:N que triplica los ingresos regionales de Mercado Brisa frente al flujo con pre-agregación por `order_id` y `validate="1:1"`.',
    audit: 'La suma de `order_total_usd` en las 4 regiones (`2 059 786.39 + 1 990 554.12 + 1 348 369.68 + 870 752.23`) concilia exactamente con los `6 269 462.42 USD` de los 14 760 pedidos completados en `orders.parquet`.',
    steps: [
      {
        label: '1. Antipatrón: join directo sin pre-agregar order_items ni refunds',
        explanation: 'Al unir `orders` directamente con `order_items` (42 000 filas) y `refunds` (1 450 filas), cada pedido completado se repite por cada producto e intento de devolución, inflando el total a más de 18 millones de USD.',
        code: `import polars as pl

# ERROR: unir detalle 1:N sin pre-agregar ni validar cardinalidad
cruce_inflado = (
    pl.scan_parquet("public/datasets/orders.parquet")
    .filter(pl.col("status") == "completed")
    .join(pl.scan_parquet("public/datasets/stores.parquet"), on="store_id", how="inner")
    .join(pl.scan_parquet("public/datasets/order_items.parquet"), on="order_id", how="inner")
    .join(pl.scan_parquet("public/datasets/refunds.parquet"), on="order_id", how="left")
    .group_by("region")
    .agg(
        pl.len().alias("rows_counted"),
        pl.col("total_usd").sum().round(2).alias("inflated_order_total_usd"),
    )
    .sort("inflated_order_total_usd", descending=True)
    .collect()
)`,
        expectedOutput: [
          { region: 'Cono Sur', rows_counted: 11378, inflated_order_total_usd: 5792409.13 },
          { region: 'Andina', rows_counted: 11411, inflated_order_total_usd: 5696401.57 },
          { region: 'Iberia', rows_counted: 7065, inflated_order_total_usd: 4002687.7 },
          { region: 'Norteamérica', rows_counted: 4976, inflated_order_total_usd: 2511643.13 }
        ]
      },
      {
        label: '2. Solución verificada: pre-agregación por order_id y validación 1:1 / m:1',
        explanation: 'Colapsamos `order_items` y `refunds` al grano de `order_id` antes de unirlos con `orders`, y verificamos la relación con `validate="1:1"` y `validate="m:1"`.',
        code: `import polars as pl

items_por_pedido = (
    pl.scan_parquet("public/datasets/order_items.parquet")
    .group_by("order_id")
    .agg(pl.col("qty").sum().alias("total_units"))
)

reembolsos_por_pedido = (
    pl.scan_parquet("public/datasets/refunds.parquet")
    .group_by("order_id")
    .agg(pl.col("refund_amount_usd").sum().alias("refunded_usd"))
)

resumen_regional = (
    pl.scan_parquet("public/datasets/orders.parquet")
    .filter(pl.col("status") == "completed")
    .join(pl.scan_parquet("public/datasets/stores.parquet"), on="store_id", how="inner", validate="m:1")
    .join(items_por_pedido, on="order_id", how="inner", validate="1:1")
    .join(reembolsos_por_pedido, on="order_id", how="left", validate="1:1")
    .group_by("region")
    .agg(
        pl.len().alias("completed_orders"),
        pl.col("total_units").sum().alias("total_units"),
        pl.col("total_usd").sum().round(2).alias("order_total_usd"),
        pl.col("refunded_usd").fill_null(0.0).sum().round(2).alias("refunded_usd"),
    )
    .sort("order_total_usd", descending=True)
    .collect()
)`,
        expectedOutput: [
          { region: 'Cono Sur', completed_orders: 4920, total_units: 23467, order_total_usd: 2059786.39, refunded_usd: 77991.82 },
          { region: 'Andina', completed_orders: 4921, total_units: 22502, order_total_usd: 1990554.12, refunded_usd: 115379.23 },
          { region: 'Iberia', completed_orders: 2811, total_units: 15211, order_total_usd: 1348369.68, refunded_usd: 43170.94 },
          { region: 'Norteamérica', completed_orders: 2108, total_units: 9870, order_total_usd: 870752.23, refunded_usd: 37992.53 }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: 'En Polars 2.0 quieres unir la tabla de pedidos `orders` (muchas filas por tienda) con el catálogo de tiendas `stores` (1 fila única por `store_id`). ¿Qué argumento de `.join()` verifica que `store_id` no esté duplicado en `stores`?',
      options: [
        {
          id: 'a',
          text: 'validate="m:1"',
          correct: true,
          feedback: 'Correcto. `validate="m:1"` (muchos a uno) comprueba que la tabla derecha (`stores`) tenga claves únicas y lanza un error si encuentra duplicados.'
        },
        {
          id: 'b',
          text: 'validate="1:m"',
          correct: false,
          feedback: 'Incorrecto. `"1:m"` exigiría que `store_id` fuera único en la tabla izquierda (`orders`), lo cual es falso porque una tienda tiene miles de pedidos.'
        },
        {
          id: 'c',
          text: 'how="cross"',
          correct: false,
          feedback: 'Incorrecto. Un `cross` join genera el producto cartesiano de todas las filas contra todas las tiendas.'
        }
      ],
      explanation: 'El parámetro `validate="m:1"` protege los enriquecimientos contra dimensiones asegurando que la tabla derecha no tenga claves repetidas que multipliquen las filas de hechos.'
    },
    {
      id: 'c2',
      type: 'mcq',
      prompt: '¿Qué hace la expresión `pl.col("list_price_usd").mean().over("category")` cuando se ejecuta dentro de `df.with_columns(...)`?',
      options: [
        {
          id: 'a',
          text: 'Calcula el precio promedio de cada categoría y lo asigna a cada fila sin reducir el número de filas del DataFrame.',
          correct: true,
          feedback: 'Exacto. `.over("category")` evalúa una función de ventana particionada por categoría conservando el grano original de la tabla.'
        },
        {
          id: 'b',
          text: 'Colapsa el DataFrame a 5 filas (una por categoría) eliminando la columna `sku`.',
          correct: false,
          feedback: 'Incorrecto. Eso lo hace `.group_by("category").agg(...)`, no una expresión `.over()` dentro de `.with_columns()`.'
        },
        {
          id: 'c',
          text: 'Filtra únicamente las filas cuyo precio sea mayor que el promedio.',
          correct: false,
          feedback: 'Incorrecto. `.over()` proyecta el valor calculado por partición; no descarta filas salvo que lo uses dentro de `.filter()`.'
        }
      ],
      explanation: 'En Polars, `.over()` es el equivalente directo de `OVER (PARTITION BY ...)` en SQL: permite comparar cada fila contra el agregado de su grupo sin colapsar la tabla.'
    },
    {
      id: 'c3',
      type: 'predict-output',
      prompt: 'Dentro de un `.group_by("store_id").agg(...)`, escribes `pl.col("total_usd").filter(pl.col("status") == "completed").sum().alias("ventas_ok")`. ¿Qué ocurre con los pedidos cuyo estado es `"cancelled"`?',
      options: [
        {
          id: 'a',
          text: 'Se excluyen únicamente del cálculo de `ventas_ok`, permitiendo que otras expresiones del mismo `.agg()` sí los cuenten.',
          correct: true,
          feedback: 'Correcto. Filtrar dentro de la expresión acota solo esa métrica sin descartar las filas para el resto de agregaciones del grupo.'
        },
        {
          id: 'b',
          text: 'Provocan un error porque `.filter()` no puede usarse dentro de `.agg()`.',
          correct: false,
          feedback: 'Incorrecto. En Polars cualquier expresión `pl.col()` puede encadenar `.filter()` antes de la función de agregación.'
        },
        {
          id: 'c',
          text: 'Se suman como números negativos a `ventas_ok`.',
          correct: false,
          feedback: 'Incorrecto. Las filas que no cumplen la condición de `.filter()` simplemente no participan en la suma.'
        }
      ],
      explanation: 'Usar `pl.col(...).filter(...).sum()` dentro de `.agg()` permite calcular múltiples indicadores condicionales en una sola lectura del grupo, de forma equivalente a la cláusula `FILTER (WHERE ...)` de SQL.'
    },
    {
      id: 'c4',
      type: 'mcq',
      prompt: 'En Polars 2.0 necesitas transformar una tabla ancha con columnas `["sku", "enero_usd", "febrero_usd"]` a una tabla larga con `["sku", "mes", "importe_usd"]`. ¿Qué método debes usar?',
      options: [
        {
          id: 'a',
          text: 'df.unpivot(index="sku", on=["enero_usd", "febrero_usd"], variable_name="mes", value_name="importe_usd")',
          correct: true,
          feedback: 'Correcto. En Polars 2.0 el método oficial es `.unpivot()`, que sustituyó al método `.melt()` de versiones antiguas.'
        },
        {
          id: 'b',
          text: 'df.pivot(on="sku", index="enero_usd")',
          correct: false,
          feedback: 'Incorrecto. `.pivot()` realiza la operación inversa: pasa de formato largo a formato ancho.'
        },
        {
          id: 'c',
          text: 'Iterar con dos bucles `for` anidados en Python construyendo diccionarios fila por fila.',
          correct: false,
          feedback: 'Incorrecto. Un bucle manual en Python es lento y propenso a errores frente a la operación columnar `.unpivot()`.'
        }
      ],
      explanation: 'En Polars 2.0 se eliminó el alias heredado `.melt()` y se estandarizó `.unpivot()` para pasar de columnas anchas a filas clave-valor.'
    }
  ],

  practice: {
    type: 'fill-blanks',
    title: 'Pre-agregación y validación de cardinalidad 1:1 en Polars 2.0',
    language: 'python',
    prompt: 'Completa el código en Polars 2.0 para pre-agregar `order_items` por `order_id`, unirlo de forma segura con los pedidos completados verificando la relación `1:1` y calcular el margen bruto por categoría.',
    starterCode: `import polars as pl

# 1. Pre-agregar líneas de pedido válidas por categoría
lineas_validas = (
    pl.scan_parquet("public/datasets/order_items.parquet")
    .join(
        pl.scan_parquet("public/datasets/products.parquet").filter(pl.col("list_price_usd") > 0),
        on="product_id",
        how="inner",
        {{blank_1}}="m:1",
    )
    .join(
        pl.scan_parquet("public/datasets/orders.parquet").filter(pl.col("status") == "completed"),
        on="order_id",
        how="inner",
        validate="m:1",
    )
    .{{blank_2}}("category")
    .agg(
        pl.col("order_id").n_unique().alias("completed_orders"),
        pl.col("qty").sum().alias("total_units"),
        pl.col("line_total_usd").sum().round(2).alias("revenue_usd"),
        (pl.col("line_total_usd") - (pl.col("qty") * pl.col("unit_cost_usd")))
        .{{blank_3}}()
        .round(2)
        .alias("gross_margin_usd"),
    )
    .sort("revenue_usd", descending=True)
    .collect()
)`,
    expected: `import polars as pl

# 1. Pre-agregar líneas de pedido válidas por categoría
lineas_validas = (
    pl.scan_parquet("public/datasets/order_items.parquet")
    .join(
        pl.scan_parquet("public/datasets/products.parquet").filter(pl.col("list_price_usd") > 0),
        on="product_id",
        how="inner",
        validate="m:1",
    )
    .join(
        pl.scan_parquet("public/datasets/orders.parquet").filter(pl.col("status") == "completed"),
        on="order_id",
        how="inner",
        validate="m:1",
    )
    .group_by("category")
    .agg(
        pl.col("order_id").n_unique().alias("completed_orders"),
        pl.col("qty").sum().alias("total_units"),
        pl.col("line_total_usd").sum().round(2).alias("revenue_usd"),
        (pl.col("line_total_usd") - (pl.col("qty") * pl.col("unit_cost_usd")))
        .sum()
        .round(2)
        .alias("gross_margin_usd"),
    )
    .sort("revenue_usd", descending=True)
    .collect()
)`,
    orderMatters: true,
    hints: [
      'El parámetro de `.join()` que comprueba que la tabla derecha tenga claves únicas se llama `validate`.',
      'En Polars el método para agrupar por una o más columnas se escribe con guion bajo: `group_by`.',
      'Para totalizar el margen bruto de todas las líneas de cada categoría, encadena `.sum()` antes de `.round(2)`.'
    ],
    solution: `import polars as pl

# 1. Pre-agregar líneas de pedido válidas por categoría
lineas_validas = (
    pl.scan_parquet("public/datasets/order_items.parquet")
    .join(
        pl.scan_parquet("public/datasets/products.parquet").filter(pl.col("list_price_usd") > 0),
        on="product_id",
        how="inner",
        validate="m:1",
    )
    .join(
        pl.scan_parquet("public/datasets/orders.parquet").filter(pl.col("status") == "completed"),
        on="order_id",
        how="inner",
        validate="m:1",
    )
    .group_by("category")
    .agg(
        pl.col("order_id").n_unique().alias("completed_orders"),
        pl.col("qty").sum().alias("total_units"),
        pl.col("line_total_usd").sum().round(2).alias("revenue_usd"),
        (pl.col("line_total_usd") - (pl.col("qty") * pl.col("unit_cost_usd")))
        .sum()
        .round(2)
        .alias("gross_margin_usd"),
    )
    .sort("revenue_usd", descending=True)
    .collect()
)`,
    solutionExplanation: 'Verifica la relación muchos-a-uno con `validate="m:1"`, agrupa con `.group_by("category")` y totaliza la expresión vectorizada de margen mediante `.sum()`.',
    blanks: [
      {
        id: 'blank_1',
        label: 'Parámetro de validación de cardinalidad',
        correct: 'validate',
        options: ['validate', 'check_keys', 'cardinality'],
        hint: 'En Polars y pandas recibe "1:1", "1:m" o "m:1" para impedir cruces con claves duplicadas.'
      },
      {
        id: 'blank_2',
        label: 'Método de agrupación en Polars',
        correct: 'group_by',
        options: ['group_by', 'groupby_index', 'partition_on'],
        hint: 'En Polars se escribe separado por guion bajo.'
      },
      {
        id: 'blank_3',
        label: 'Agregación de suma del margen',
        correct: 'sum',
        options: ['sum', 'first', 'count'],
        hint: 'Acumula el margen de todas las líneas pertenecientes a cada categoría.'
      }
    ],
    expectedOutputTable: [
      { category: 'Molinos', completed_orders: 6245, total_units: 14314, revenue_usd: 2163162.27, gross_margin_usd: 928073.23 },
      { category: 'Cafeteras', completed_orders: 6250, total_units: 14270, revenue_usd: 1643366.45, gross_margin_usd: 781890.35 },
      { category: 'Suscripciones', completed_orders: 6167, total_units: 13857, revenue_usd: 657384.31, gross_margin_usd: 338217.74 },
      { category: 'Accesorios', completed_orders: 6247, total_units: 14366, revenue_usd: 586859.56, gross_margin_usd: 340331.54 },
      { category: 'Café en grano', completed_orders: 6246, total_units: 14243, revenue_usd: 413378.59, gross_margin_usd: 228476.01 }
    ]
  },

  roleNotes: {
    de: 'Declara siempre `validate="1:1"` o `validate="m:1"` en los cruces de tus tuberías en Polars. Es una barrera sin costo apreciable que detiene la tarea en segundos si una tabla maestra llega duplicada desde el sistema fuente, en lugar de publicar cifras infladas.',
    da: 'Sustituye cualquier `.apply(axis=1)` por expresiones `pl.when().then().otherwise()` y cálculos de ventana `.over()`. Además de reducir el tiempo de ejecución de minutos a milisegundos, tus transformaciones podrán ejecutarse dentro de un `LazyFrame` sin agotar la RAM.',
    bi: 'Cuando prepares tablas agregadas en Python para un tablero, concilia siempre la suma de control (`SUM(total_usd) = 6 269 462.42 USD` en pedidos completados) antes y después de cruzar con tablas de detalle como `order_items` o `refunds`.'
  },

  summary: [
    'Las expresiones pl.col se ejecutan en paralelo sobre vectores contiguos sin pasar por bucles de Python.',
    'Dentro de group_by().agg() puedes filtrar cada métrica con .filter() en una sola lectura de la tabla.',
    'Pre-agrega las tablas de detalle al mismo grano y usa validate="1:1" o "m:1" al cruzar.',
    'Usa .over() para funciones de ventana sin colapsar filas y .unpivot() para pasar a formato largo.'
  ],

  flashcards: [
    {
      id: 'fc-c1-py-03-a',
      front: '¿Por qué `df.with_columns(pl.when(...).then(...).otherwise(...))` es mucho más rápido que `df.apply(lambda r: ..., axis=1)`?',
      back: 'Porque `pl.when` opera sobre vectores contiguos de Arrow en paralelo en Rust, mientras `.apply` invoca una función de Python fila por fila.'
    },
    {
      id: 'fc-c1-py-03-b',
      front: '¿Cómo impides en Polars que unir `orders` con `order_items` duplique el importe `total_usd` de la cabecera?',
      back: 'Pre-agrupando primero `order_items` por `order_id` y ejecutando `.join(..., on="order_id", validate="1:1")`.'
    },
    {
      id: 'fc-c1-py-03-c',
      front: '¿Para qué sirve `.over("category")` al final de una expresión en Polars?',
      back: 'Calcula una expresión de ventana particionada por `category` y devuelve el resultado alineado con cada fila original sin colapsar la tabla.'
    },
    {
      id: 'fc-c1-py-03-d',
      front: '¿Qué método de Polars 2.0 reemplazó al antiguo `.melt()` para convertir columnas en filas?',
      back: 'El método `.unpivot(index=..., on=...)`.'
    }
  ],

  glossaryTerms: [
    'polars-expresion-columnar',
    'validacion-cardinalidad-join',
    'polars-lazyframe'
  ],

  sources: [
    {
      title: 'Polars User Guide — Expressions and Contexts (select, with_columns, filter, group_by)',
      url: 'https://docs.pola.rs/user-guide/expressions/',
      publisher: 'Polars Project',
      accessed: '2026-10-29',
      supports: 'Evaluación paralelizada de expresiones pl.col(), condicionales when/then/otherwise, agregaciones filtradas y ventanas .over().'
    },
    {
      title: 'Polars User Guide — Transformations: Joins and Unpivot',
      url: 'https://docs.pola.rs/user-guide/transformations/joins/',
      publisher: 'Polars Project',
      accessed: '2026-10-29',
      supports: 'Parámetro validate ("1:1", "m:1", "1:m") en joins y uso de .unpivot() en Polars 2.0.'
    },
    {
      title: 'pandas 3.0 User Guide — Merging, Joining, Concatenating and pd.col Expressions',
      url: 'https://pandas.pydata.org/docs/user_guide/merging.html',
      publisher: 'PyData / NumFOCUS',
      accessed: '2026-10-29',
      supports: 'Validación de cardinalidad con validate="one_to_one" / "many_to_one" en pandas 3.0 y expresiones pd.col().'
    }
  ],

  aiNotes: 'Dos tropiezos habituales en esta lección son escribir `.groupby()` sin guion bajo (sintaxis de pandas; en Polars es `.group_by()`) o usar `.melt()` (eliminado en Polars 2.0 en favor de `.unpivot()`). Recuerda también verificar siempre el grano antes de un `.join()`.'
};

export default lesson;
