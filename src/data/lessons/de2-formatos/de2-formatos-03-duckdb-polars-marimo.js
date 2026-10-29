const lesson = {
  id: 'de2-formatos-03-duckdb-polars-marimo',
  legacyId: 'l9-duckdb-polars-marimo',
  legacyOrder: 9,
  moduleId: 'de2-formatos',
  tracks: ['de'],
  level: 2,
  order: 3,
  title: 'Ejecución local con DuckDB, Polars perezoso y Marimo',
  subtitle: 'Motores vectorizados embebidos, planes LazyFrame y cuadernos reactivos deterministas',
  minutes: 30,
  prerequisites: ['de2-formatos-02-arrow-lance-vortex'],
  glossaryTerms: [
    'vectorized-execution',
    'predicate-pushdown',
    'arrow-c-data-interface',
    'marimo-dag-reactivo'
  ],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), las 13 tablas completas del comercio electrónico (146 214 filas entre eventos, pedidos, líneas, pagos y reembolsos) pesan apenas **2.14 MB** en archivos Parquet comprimidos. Sin embargo, muchos equipos levantan un clúster distribuido con decenas de gigabytes de RAM solo para cruzar `orders` (`18 000` filas), `customers` (`2 400` filas) y `stores` (`14` filas). ¿Cómo procesan DuckDB y Polars decenas de millones de filas en una sola máquina local y cómo garantiza Marimo que el análisis sea 100 % reproducible?',

  objectives: [
    'Explicar cómo la ejecución vectorizada por lotes en DuckDB (DataChunks de 2 048 tuplas) aprovecha la caché del procesador y el derrame a disco.',
    'Combinar planes perezosos de Polars (scan_parquet y LazyFrame) con consultas SQL en DuckDB mediante intercambio zero-copy sobre Apache Arrow.',
    'Diseñar flujos analíticos reproducibles en cuadernos reactivos de Marimo eliminando el problema de estado oculto de los cuadernos tradicionales.'
  ],

  sections: [
    {
      id: 'duckdb-ejecucion-vectorizada-local',
      heading: 'Ejecución vectorizada en proceso y paralelismo en DuckDB',
      body: 'Los motores transaccionales clásicos (como PostgreSQL o MySQL) procesan las consultas siguiendo el modelo **Volcano** tupla por tupla. El operador superior invoca `next()` millones de veces y provoca fallos constantes en la caché de instrucciones de la CPU. En el extremo opuesto, cargar archivos enteros de una sola vez en memoria agota la RAM rápidamente.\n\n**DuckDB** es un motor SQL analítico embebido (*in-process*, sin servidor externo). Opera sobre lotes columnares llamados **DataChunks** de 2 048 valores. Este tamaño hace que los vectores de entrada y salida de cada operador quepan íntegros dentro de la caché L1 y L2 del procesador. Así ejecuta bucles estrechos con instrucciones vectoriales SIMD.\n\nAdemás, aplica planificación **morsel-driven**. Divide el trabajo en fragmentos pequeños que reparte dinámicamente entre todos los núcleos de la CPU. Si una agregación o un `HASH JOIN` supera la memoria física disponible, DuckDB comprime y vuelca particiones intermedias a disco temporal (*out-of-core spilling*) sin abortar el proceso.',
      example: {
        language: 'sql',
        code: `SELECT
  s.region,
  o.device_type,
  COUNT(*) AS completed_orders,
  ROUND(MEDIAN(o.total_usd), 2) AS median_ticket_usd,
  ROUND(SUM(o.total_usd), 2) AS revenue_total_usd
FROM orders AS o
INNER JOIN stores AS s ON o.store_id = s.store_id
WHERE o.status = 'completed'
  AND o.order_date >= DATE '2025-01-01'
GROUP BY ALL
ORDER BY revenue_total_usd DESC
LIMIT 6;`,
        expectedOutput: [
          { region: 'Iberia', device_type: 'desktop', completed_orders: 890, median_ticket_usd: 429.28, revenue_total_usd: 449168.72 },
          { region: 'Andina', device_type: 'mobile', completed_orders: 891, median_ticket_usd: 338.95, revenue_total_usd: 371625.13 },
          { region: 'Cono Sur', device_type: 'mobile', completed_orders: 912, median_ticket_usd: 298.34, revenue_total_usd: 355688.64 },
          { region: 'Andina', device_type: 'desktop', completed_orders: 921, median_ticket_usd: 283.39, revenue_total_usd: 335544.1 },
          { region: 'Cono Sur', device_type: 'desktop', completed_orders: 588, median_ticket_usd: 484.16, revenue_total_usd: 317530.04 },
          { region: 'Cono Sur', device_type: 'pos_tienda', completed_orders: 581, median_ticket_usd: 251.92, revenue_total_usd: 199600.42 }
        ],
        explanation: 'DuckDB ejecuta el cruce entre orders y stores junto con el cálculo exacto de MEDIAN y GROUP BY ALL en pocos milisegundos.'
      },
      interactive: {
        component: 'duckdb-polars',
        props: {
          mode: 'local-engine',
          datasetSizeMb: 2.14
        },
        caption: 'Inspecciona cómo el planificador local empuja predicados y proyecciones hasta los archivos Parquet antes de ejecutar el cruce.'
      }
    },
    {
      id: 'polars-lazyframe-puente-duckdb',
      heading: 'Planes perezosos en Polars y puente zero-copy con DuckDB',
      body: 'En Python, **Polars** comparte la misma filosofía de ejecución columnar escrita en Rust. Su diferencia central está entre la API ansiosa (`pl.read_parquet()`) y la API perezosa (`pl.scan_parquet()`). Cuando invocas `scan_parquet()`, Polars no lee ningún byte de datos. Solo construye un grafo lógico llamado **LazyFrame**.\n\nAntes de materializar el resultado con `.collect(engine="streaming")`, el optimizador de Polars reescribe el plan aplicando cuatro transformaciones automáticas.\n\n- **Projection pushdown**: descarta todas las columnas que no participan en el resultado final.\n- **Predicate pushdown**: empuja los filtros `.filter()` hacia el lector Parquet para aprovechar *zone maps* y filtros de Bloom.\n- `Slice pushdown`: si encadenas `.head(100)`, detiene la lectura en cuanto reúne 100 filas válidas.\n- `Common subplan elimination`: evalúa una sola vez las subconsultas reutilizadas.\n\nComo DuckDB y Polars hablan **Apache Arrow**, puedes preparar expresiones en un `LazyFrame` de Polars y consultarlo por nombre en una sentencia SQL de DuckDB (`duckdb.sql("SELECT ... FROM lf_limpio")`). Ambos motores colaboran sin copiar memoria.',
      example: {
        language: 'python',
        code: `import duckdb
import polars as pl

pedidos_validos = (
    pl.scan_parquet("orders.parquet")
    .filter(pl.col("status") == "completed")
    .select(["order_id", "customer_id", "total_usd"])
)
clientes = pl.scan_parquet("customers.parquet").select(["customer_id", "segment"])

resumen_segmento = duckdb.sql("""
  SELECT
    c.segment,
    COUNT(*) AS completed_orders,
    ROUND(MEDIAN(o.total_usd), 2) AS median_ticket_usd,
    COUNT(*) FILTER (WHERE o.total_usd >= 120) AS high_value_orders,
    ROUND(SUM(o.total_usd), 2) AS revenue_usd
  FROM pedidos_validos AS o
  INNER JOIN clientes AS c ON o.customer_id = c.customer_id
  GROUP BY ALL
  ORDER BY revenue_usd DESC
""").pl()
print(resumen_segmento.to_dicts())`,
        expectedOutput: [
          { segment: 'pro_barista', completed_orders: 6229, median_ticket_usd: 327.26, high_value_orders: 5016, revenue_usd: 2512933.23 },
          { segment: 'retail', completed_orders: 5940, median_ticket_usd: 332.62, high_value_orders: 4851, revenue_usd: 2436924.93 },
          { segment: 'cafeteria_b2b', completed_orders: 2591, median_ticket_usd: 444.51, high_value_orders: 2340, revenue_usd: 1319604.26 }
        ],
        explanation: 'DuckDB consume directamente los objetos LazyFrame de Polars mediante la interfaz Arrow C Stream, transfiriendo al lector únicamente las columnas y filtros requeridos.'
      }
    },
    {
      id: 'marimo-cuadernos-reactivos-dag',
      heading: 'Cuadernos reactivos en Marimo y grafo DAG determinista',
      body: 'Los cuadernos tradicionales basados en celdas mutables (`.ipynb`) sufren dos defectos graves en ingeniería de datos. El primero es el **estado oculto**. Ejecutar la celda 8 antes que la celda 3 o borrar una celda deja variables huérfanas en RAM que producen resultados imposibles de reproducir. El segundo es el almacenamiento en JSON con salidas binarias que dificulta las revisiones en Git.\n\n**Marimo** modela el cuaderno interactivo como un **grafo acíclico dirigido (DAG)** estático de dependencias entre celdas.\n\n1. Analiza el árbol sintáctico (AST) de cada celda para identificar qué variables define y cuáles consume.\n2. Cuando modificas un filtro o una consulta SQL integrada (`mo.sql(f"...")`), Marimo recalcula **en orden topológico** todas las celdas dependientes.\n3. Prohíbe redefinir la misma variable global en dos celdas distintas. Así el estado en memoria coincide siempre con el código visible.\n4. Guarda el cuaderno como un archivo **Python puro (`.py`)**. Puedes versionarlo en Git, probarlo con `pytest` y ejecutarlo desde la terminal.',
      example: {
        language: 'python',
        code: `import marimo

app = marimo.App()

@app.cell
def _():
    import duckdb
    import marimo as mo
    umbral_alto_valor = 120
    return duckdb, mo, umbral_alto_valor

@app.cell
def _(duckdb, umbral_alto_valor):
    df_segmentos = duckdb.sql(f"""
      SELECT
        c.segment,
        COUNT(*) AS completed_orders,
        ROUND(MEDIAN(o.total_usd), 2) AS median_ticket_usd,
        COUNT(*) FILTER (WHERE o.total_usd >= {umbral_alto_valor}) AS high_value_orders,
        ROUND(SUM(o.total_usd), 2) AS revenue_usd
      FROM 'orders.parquet' AS o
      INNER JOIN 'customers.parquet' AS c ON o.customer_id = c.customer_id
      WHERE o.status = 'completed'
      GROUP BY ALL
      ORDER BY revenue_usd DESC
    """).df()
    return (df_segmentos,)`,
        expectedOutput: [
          { segment: 'pro_barista', completed_orders: 6229, median_ticket_usd: 327.26, high_value_orders: 5016, revenue_usd: 2512933.23 },
          { segment: 'retail', completed_orders: 5940, median_ticket_usd: 332.62, high_value_orders: 4851, revenue_usd: 2436924.93 },
          { segment: 'cafeteria_b2b', completed_orders: 2591, median_ticket_usd: 444.51, high_value_orders: 2340, revenue_usd: 1319604.26 }
        ],
        explanation: 'En Marimo, la segunda celda declara explícitamente que depende de duckdb y umbral_alto_valor. Al cambiar umbral_alto_valor en la primera celda, df_segmentos se recalcula de inmediato.'
      }
    }
  ],

  workedExample: {
    title: 'Análisis local con SQL expresivo en DuckDB sobre Mercado Brisa',
    description: 'Vamos a construir paso a paso un diagnóstico comercial local en DuckDB cruzando `orders`, `stores` y `customers`, aprovechando constructos analíticos modernos (`MEDIAN`, `FILTER (WHERE ...)` y `GROUP BY ALL`) sobre vectores Arrow.',
    steps: [
      {
        label: 'Paso 1 — Auditar la distribución de pedidos por estado en orders.parquet',
        code: `SELECT
  status,
  COUNT(*) AS total_orders,
  ROUND(MEDIAN(total_usd), 2) AS median_ticket_usd,
  ROUND(SUM(total_usd), 2) AS gross_total_usd
FROM orders
GROUP BY ALL
ORDER BY total_orders DESC;`,
        expectedOutput: [
          { status: 'completed', total_orders: 14760, median_ticket_usd: 348.28, gross_total_usd: 6269462.42 },
          { status: 'refunded', total_orders: 1440, median_ticket_usd: 335.29, gross_total_usd: 605025.58 },
          { status: 'cancelled', total_orders: 1080, median_ticket_usd: 386.42, gross_total_usd: 489003.49 },
          { status: 'pending', total_orders: 720, median_ticket_usd: 351.9, gross_total_usd: 306326.28 }
        ],
        explanation: 'De los 18 000 pedidos de orders.parquet, exactamente 14 760 tienen estado completed y suman 6 269 462.42 USD.'
      },
      {
        label: 'Paso 2 — Cruzar pedidos completados de 2025 con stores por región y dispositivo',
        code: `SELECT
  s.region,
  o.device_type,
  COUNT(*) AS completed_orders,
  ROUND(MEDIAN(o.total_usd), 2) AS median_ticket_usd,
  ROUND(SUM(o.total_usd), 2) AS revenue_total_usd
FROM orders AS o
INNER JOIN stores AS s ON o.store_id = s.store_id
WHERE o.status = 'completed'
  AND o.order_date >= DATE '2025-01-01'
GROUP BY ALL
ORDER BY revenue_total_usd DESC
LIMIT 6;`,
        expectedOutput: [
          { region: 'Iberia', device_type: 'desktop', completed_orders: 890, median_ticket_usd: 429.28, revenue_total_usd: 449168.72 },
          { region: 'Andina', device_type: 'mobile', completed_orders: 891, median_ticket_usd: 338.95, revenue_total_usd: 371625.13 },
          { region: 'Cono Sur', device_type: 'mobile', completed_orders: 912, median_ticket_usd: 298.34, revenue_total_usd: 355688.64 },
          { region: 'Andina', device_type: 'desktop', completed_orders: 921, median_ticket_usd: 283.39, revenue_total_usd: 335544.1 },
          { region: 'Cono Sur', device_type: 'desktop', completed_orders: 588, median_ticket_usd: 484.16, revenue_total_usd: 317530.04 },
          { region: 'Cono Sur', device_type: 'pos_tienda', completed_orders: 581, median_ticket_usd: 251.92, revenue_total_usd: 199600.42 }
        ],
        explanation: 'El cruce con la tabla de dimensiones stores (14 filas) se ejecuta mediante un Hash Join en caché L1 y permite comparar la mediana de ticket por canal y región.'
      },
      {
        label: 'Paso 3 — Consolidar métricas por segmento de cliente usando FILTER y GROUP BY ALL',
        code: `SELECT
  c.segment,
  COUNT(*) AS completed_orders,
  ROUND(MEDIAN(o.total_usd), 2) AS median_ticket_usd,
  COUNT(*) FILTER (WHERE o.total_usd >= 120) AS high_value_orders,
  ROUND(SUM(o.total_usd), 2) AS revenue_usd
FROM orders AS o
INNER JOIN customers AS c ON o.customer_id = c.customer_id
WHERE o.status = 'completed'
GROUP BY ALL
ORDER BY revenue_usd DESC;`,
        expectedOutput: [
          { segment: 'pro_barista', completed_orders: 6229, median_ticket_usd: 327.26, high_value_orders: 5016, revenue_usd: 2512933.23 },
          { segment: 'retail', completed_orders: 5940, median_ticket_usd: 332.62, high_value_orders: 4851, revenue_usd: 2436924.93 },
          { segment: 'cafeteria_b2b', completed_orders: 2591, median_ticket_usd: 444.51, high_value_orders: 2340, revenue_usd: 1319604.26 }
        ],
        explanation: 'El segmento cafeteria_b2b presenta la mediana de ticket más alta (444.51 USD), mientras que pro_barista lidera en facturación acumulada (2 512 933.23 USD).'
      }
    ]
  },

  practice: {
    type: 'sql',
    title: 'Agregación vectorizada con MEDIAN, FILTER y GROUP BY ALL sobre orders y customers',
    prompt: 'Cruza las tablas `orders` (`o`) y `customers` (`c`) por `customer_id`, filtrando únicamente los pedidos con `o.status = \'completed\'`. Devuelve por cada segmento de cliente (`c.segment`): `segment`, `completed_orders` (`COUNT(*)`), `median_ticket_usd` (`ROUND(MEDIAN(o.total_usd), 2)`), `high_value_orders` (`COUNT(*) FILTER (WHERE o.total_usd >= 120)`) y `revenue_usd` (`ROUND(SUM(o.total_usd), 2)`). Agrupa con `GROUP BY ALL` y ordena por `revenue_usd` de mayor a menor.',
    starterCode: `SELECT
  c.segment,
  COUNT(*) AS completed_orders,
  -- Calcula median_ticket_usd, high_value_orders (total_usd >= 120) y revenue_usd
FROM orders AS o
INNER JOIN customers AS c ON o.customer_id = c.customer_id
WHERE o.status = 'completed'
GROUP BY ALL
ORDER BY revenue_usd DESC;`,
    solution: `SELECT
  c.segment,
  COUNT(*) AS completed_orders,
  ROUND(MEDIAN(o.total_usd), 2) AS median_ticket_usd,
  COUNT(*) FILTER (WHERE o.total_usd >= 120) AS high_value_orders,
  ROUND(SUM(o.total_usd), 2) AS revenue_usd
FROM orders AS o
INNER JOIN customers AS c ON o.customer_id = c.customer_id
WHERE o.status = 'completed'
GROUP BY ALL
ORDER BY revenue_usd DESC;`,
    expectedOutputTable: [
      { segment: 'pro_barista', completed_orders: 6229, median_ticket_usd: 327.26, high_value_orders: 5016, revenue_usd: 2512933.23 },
      { segment: 'retail', completed_orders: 5940, median_ticket_usd: 332.62, high_value_orders: 4851, revenue_usd: 2436924.93 },
      { segment: 'cafeteria_b2b', completed_orders: 2591, median_ticket_usd: 444.51, high_value_orders: 2340, revenue_usd: 1319604.26 }
    ],
    orderMatters: true,
    hints: [
      'Usa ROUND(MEDIAN(o.total_usd), 2) AS median_ticket_usd para calcular la mediana exacta del pedido.',
      'Usa COUNT(*) FILTER (WHERE o.total_usd >= 120) AS high_value_orders para contar los pedidos de alto valor.',
      'Completa con ROUND(SUM(o.total_usd), 2) AS revenue_usd y mantén GROUP BY ALL ORDER BY revenue_usd DESC.'
    ],
    solutionExplanation: 'DuckDB empuja el filtro status = completed hacia el escaneo de orders.parquet y evalúa simultáneamente MEDIAN, COUNT(*) FILTER y SUM sobre los lotes vectorizados de cada segmento.'
  },

  checks: [
    {
      id: 'chk-duckdb-datachunks',
      type: 'mcq',
      prompt: '¿Por qué DuckDB procesa las columnas en lotes vectorizados (`DataChunks`) de 2 048 valores en lugar de procesar una fila a la vez o cargar toda la columna entera en un solo arreglo gigante?',
      options: [
        {
          id: 'a',
          text: 'Porque los vectores de 2 048 valores caben dentro de la caché L1/L2 del procesador, permitiendo aplicar instrucciones SIMD sin saturar el ancho de banda de la memoria RAM principal.',
          correct: true,
          feedback: 'Correcto. Los DataChunks mantienen los vectores dentro de la caché L1/L2 entre operadores.'
        },
        {
          id: 'b',
          text: 'Porque el estándar SQL-92 prohíbe que un motor relacional lea más de 2 048 filas por transacción.',
          correct: false,
          feedback: 'Incorrecto. El estándar SQL no impone ningún límite al tamaño de lote interno del motor.'
        },
        {
          id: 'c',
          text: 'Porque los archivos Parquet siempre tienen exactamente 2 048 filas por cada Row Group.',
          correct: false,
          feedback: 'Incorrecto. Un Row Group de Parquet suele tener entre 10 000 y 1 000 000 de filas.'
        },
        {
          id: 'd',
          text: 'Porque DuckDB delega cada lote de 2 048 filas a un contenedor Docker distinto a través de la red local.',
          correct: false,
          feedback: 'Incorrecto. DuckDB corre en el mismo proceso sin contenedores ni llamadas de red.'
        }
      ],
      explanation: 'Materializar una columna entera de millones de elementos en cada paso intermedio expulsa los datos hacia la RAM principal. Procesar lotes de 2 048 tuplas mantiene los vectores calientes en la caché L1/L2 de la CPU.'
    },
    {
      id: 'chk-polars-lazyframe-optim',
      type: 'mcq',
      prompt: 'En Polars, encadenas `pl.scan_parquet("events.parquet").filter(pl.col("device_type") == "mobile").select(["event_id", "event_type"]).collect()`. ¿Qué hace el optimizador del `LazyFrame` antes de tocar el disco?',
      options: [
        {
          id: 'a',
          text: 'Aplica projection pushdown para leer únicamente las 3 columnas involucradas (device_type, event_id, event_type) y predicate pushdown para filtrar device_type == "mobile" durante el escaneo.',
          correct: true,
          feedback: 'Exacto. El optimizador reescribe el plan antes de ejecutar collect() para leer solo 3 columnas.'
        },
        {
          id: 'b',
          text: 'Carga primero las 12 columnas completas en memoria RAM y luego borra las 10 columnas sobrantes.',
          correct: false,
          feedback: 'Incorrecto. Ese sería el comportamiento ansioso de read_parquet(), no de scan_parquet().'
        },
        {
          id: 'c',
          text: 'Convierte el archivo Parquet en un archivo CSV temporal para poder leerlo línea por línea.',
          correct: false,
          feedback: 'Incorrecto. Polars lee directamente el formato binario Parquet con su lector nativo en Rust.'
        },
        {
          id: 'd',
          text: 'Ejecuta inmediatamente la lectura al invocar scan_parquet(), antes de conocer las llamadas a filter() y select().',
          correct: false,
          feedback: 'Incorrecto. scan_parquet() es perezoso y no lee datos hasta que se invoca collect().'
        }
      ],
      explanation: 'scan_parquet() solo registra el nodo de entrada en el plan lógico. Al invocar collect(), el optimizador analiza todo el grafo y determina que solo necesita leer 3 de las 12 columnas y aplicar el predicado sobre device_type.'
    },
    {
      id: 'chk-marimo-reactive-dag',
      type: 'mcq',
      prompt: '¿Qué problema estructural de los cuadernos `.ipynb` tradicionales elimina Marimo mediante su grafo acíclico dirigido (DAG) reactivo?',
      options: [
        {
          id: 'a',
          text: 'El estado oculto producido por ejecutar celdas fuera de orden o redefinir variables globales en múltiples celdas, además de almacenar el cuaderno como un script .py puro versionable en Git.',
          correct: true,
          feedback: 'Correcto. El DAG estático de Marimo mantiene el estado en memoria sincronizado con el código visible.'
        },
        {
          id: 'b',
          text: 'La necesidad de instalar Python en el sistema operativo, ya que Marimo compila todo el código directamente a ensamblador.',
          correct: false,
          feedback: 'Incorrecto. Marimo se ejecuta sobre el intérprete de Python estándar.'
        },
        {
          id: 'c',
          text: 'La obligación de escribir consultas SQL con cláusula GROUP BY cuando se agregan métricas.',
          correct: false,
          feedback: 'Incorrecto. Las reglas sintácticas de SQL dependen del motor (como DuckDB), no del cuaderno.'
        },
        {
          id: 'd',
          text: 'El límite físico de 65 536 filas que tenían los archivos Parquet en disco.',
          correct: false,
          feedback: 'Incorrecto. Parquet nunca ha tenido ese límite de filas (ese era el límite del antiguo formato Excel .xls).'
        }
      ],
      explanation: 'En un cuaderno tradicional puedes modificar una celda superior sin reejecutar las inferiores, dejando en RAM resultados obsoletos. Marimo prohíbe redefinir variables globales entre celdas, recalcula las celdas dependientes en orden topológico y guarda archivos .py limpios.'
    }
  ],

  roleNotes: {
    de: 'Como persona de Ingeniería de Datos, antes de aprovisionar un clúster distribuido para cargas de trabajo menores a 100 GB, evalúa un nodo único con DuckDB o Polars en modo streaming sobre archivos Parquet: eliminarás el costo de barajado por red (shuffle) y reducirás drásticamente la factura de infraestructura.',
    da: 'En Análisis de Datos, adopta pl.scan_parquet() en lugar de pl.read_parquet() como hábito por defecto y desarrolla tus exploraciones en cuadernos reactivos de Marimo para que cualquier cambio en un parámetro de fecha o tienda actualice todas las tablas y gráficos sin estados inconsistentes.',
    bi: 'En Business Intelligence, aprovecha la capacidad de DuckDB para consultar archivos Parquet locales o en almacenamiento de objetos y entregar tablas Arrow a tus herramientas de visualización, prototipando modelos semánticos completos en tu portátil con tiempos de respuesta sub-segundo.'
  },

  summary: [
    'DuckDB ejecuta consultas en proceso mediante lotes vectorizados (DataChunks de 2 048 filas) dentro de la caché L1/L2.',
    'El modo perezoso de Polars (scan_parquet y LazyFrame) aplica poda de columnas y filtros antes de tocar el disco.',
    'DuckDB y Polars colaboran en el mismo script sin copiar memoria gracias a la Arrow C Data Interface.',
    'Marimo modela las celdas como un DAG reactivo en un archivo .py puro, impidiendo el estado oculto.'
  ],

  flashcards: [
    {
      id: 'fc-de2-03-a',
      front: '¿Por qué el tamaño de DataChunk en DuckDB es de 2 048 tuplas?',
      back: 'Porque ese volumen cabe dentro de las cachés rápidas L1 y L2 de la CPU, permitiendo procesar bucles vectorizados SIMD sin esperar a la memoria RAM principal.'
    },
    {
      id: 'fc-de2-03-b',
      front: '¿Qué diferencia de ejecución hay entre `pl.read_parquet()` y `pl.scan_parquet()` en Polars?',
      back: '`read_parquet()` lee y materializa el archivo de inmediato en RAM; `scan_parquet()` devuelve un LazyFrame que optimiza proyecciones y filtros antes de ejecutar `.collect()`.'
    },
    {
      id: 'fc-de2-03-c',
      front: '¿Cómo impide Marimo el problema de estado oculto típico de Jupyter?',
      back: 'Construye un DAG estático de referencias entre celdas, prohíbe redefinir una misma variable global en dos celdas y reejecuta en orden topológico las celdas dependientes.'
    }
  ],

  sources: [
    {
      title: 'DuckDB Documentation — SQL on Apache Arrow',
      url: 'https://duckdb.org/docs/stable/guides/python/sql_on_arrow.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Consulta directa zero-copy de tablas Arrow y LazyFrames de Polars desde DuckDB con empuje de filtros y proyecciones.'
    },
    {
      title: 'Polars User Guide — Lazy API and Query Optimization',
      url: 'https://docs.pola.rs/user-guide/lazy/',
      publisher: 'Polars Project',
      accessed: '2026-10-29',
      supports: 'Optimización de planes lógicos mediante predicate pushdown, projection pushdown y ejecución streaming.'
    },
    {
      title: 'Marimo Documentation — Reactivity and Execution Model',
      url: 'https://docs.marimo.io/guides/reactivity/',
      publisher: 'Marimo Team',
      accessed: '2026-10-29',
      supports: 'Grafo acíclico dirigido (DAG) determinista entre celdas y almacenamiento en archivos Python puros.'
    },
    {
      title: 'DuckDB — Why DuckDB: Vectorized Push-Based Execution',
      url: 'https://duckdb.org/why_duckdb.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Arquitectura de ejecución vectorizada por DataChunks y paralelismo morsel-driven.'
    }
  ],

  aiNotes: 'Recuerda que las 13 tablas de Mercado Brisa suman 2.14 MB en Parquet y 146 214 filas, ejemplo directo de por qué los motores locales vectorizados (DuckDB y Polars) resuelven cruces en milisegundos sin requerir clústeres distribuidos. Guía en el uso de `MEDIAN()`, `COUNT(*) FILTER (WHERE ...)` y `GROUP BY ALL` sobre `orders` y `customers`.',

  relatedLessons: [
    'de2-formatos-01-columnar-parquet',
    'de2-formatos-02-arrow-lance-vortex',
    'de2-formatos-05-particionado-archivos-pequenos'
  ]
};

export default lesson;
