const lesson = {
  id: 'c1-python-01-polars-pandas-cow',
  moduleId: 'c1-python',
  tracks: ['core'],
  level: 1,
  order: 1,
  title: 'DataFrames en Polars y pandas 3.0: modelo columnar y CoW',
  minutes: 25,
  prerequisites: ['c0-herramientas-03', 'c1-sql-base-04'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), una analista filtró en un cuaderno los 36 molinos activos de la tabla `products` y rebajó un 10 % su columna `list_price_usd` para simular una promoción. Con código heredado de pandas 1.x sin copia explícita, esa prueba alteró por accidente la tabla maestra en memoria y además dejó colado el registro inactivo `SKU-TEST-NEG` con precio `-9.99 USD`. ¿Cómo impiden Polars 2.0 y el modo Copy-on-Write de pandas 3.0 que una simulación corrompa tus datos originales?',

  objectives: [
    'Explicar cómo se almacenan las columnas en memoria contigua Apache Arrow frente a listas de objetos de Python.',
    'Prevenir mutaciones accidentales entre subconjuntos aplicando Copy-on-Write (CoW) en pandas 3.0 y DataFrames inmutables en Polars 2.0.',
    'Construir selecciones, filtros y columnas calculadas sobre el catálogo de Mercado Brisa con expresiones `pl.col()` y `pd.col()`.'
  ],

  sections: [
    {
      id: 'memoria-columnar-apache-arrow',
      heading: 'Por qué una tabla columnar supera a una lista de diccionarios',
      body: 'En Python puro, una lista de diccionarios guarda cada fila como objetos dispersos en memoria. Cada celda requiere un puntero individual. Sumar una columna numérica obliga al intérprete a saltar dirección por dirección. Además, debe comprobar el tipo de dato en cada fila.\n\nTanto **Polars 2.0** como **pandas 3.0** organizan sus tablas sobre el formato columnar en memoria de Apache Arrow. Cada columna vive en un bloque contiguo de bytes del mismo tipo. Los enteros de 64 bits quedan juntos, los decimales en coma flotante quedan juntos y un mapa de bits separado indica los valores nulos.\n\nEn pandas 3.0 las columnas de texto dejaron atrás el antiguo tipo `object`. Ahora usan por defecto el **tipo de texto PyArrow** (`str`), igual que `pl.String` en Polars. Además, Polars prescinde por completo del índice de filas (`Index`). Cada fila se identifica solo por su posición física o por las columnas de negocio de la tabla.',
      interactive: {
        component: 'duckdb-polars-sim',
        caption: 'Simulador interactivo: Ejecución columnar en Polars frente a copias intermedias en memoria'
      }
    },
    {
      id: 'pandas-3-copy-on-write',
      heading: 'Qué garantiza Copy-on-Write (CoW) por defecto en pandas 3.0',
      body: 'En versiones antiguas de pandas, filtrar una tabla podía devolver una vista compartida o una copia según cómo estuviera indexada. Modificar el subconjunto alteraba a veces la tabla original. Ese comportamiento disparaba la advertencia `SettingWithCopyWarning`.\n\nEn pandas 3.0 la regla **Copy-on-Write (CoW)** es el único modo de operación. Cualquier filtro o selección se comporta siempre como una copia independiente para el usuario. Por debajo, pandas comparte los búferes de memoria para no gastar RAM extra. Solo clona la columna específica en el instante exacto en que escribes sobre ella.\n\nCon CoW activo, la asignación encadenada como `df["list_price_usd"][df["category"] == "Molinos"] = 100` nunca funciona y lanza `ChainedAssignmentError`. Para modificar un `DataFrame` en su lugar debes usar `.loc[fila, columna]` en una sola operación. También puedes crear una tabla nueva con `.assign()`.',
      example: {
        language: 'python',
        code: `import pandas as pd

# Leemos los 180 productos de Mercado Brisa en pandas 3.0 (CoW activo)
df_prod = pd.read_parquet("public/datasets/products.parquet")
df_limpio = df_prod.loc[df_prod["is_active"] & (df_prod["list_price_usd"] > 0)]

# Simulamos -10 % en Molinos sobre un subconjunto: df_limpio NO se altera
molinos_promo = df_limpio.loc[df_limpio["category"] == "Molinos"].copy()
molinos_promo["list_price_usd"] = (molinos_promo["list_price_usd"] * 0.90).round(2)

print("Media original Molinos:", df_limpio.loc[df_limpio["category"] == "Molinos", "list_price_usd"].mean().round(2))
print("Media promo Molinos:", molinos_promo["list_price_usd"].mean().round(2))`,
        expectedOutput: [
          {
            category: 'Molinos',
            active_skus: 36,
            original_avg_usd: 152.57,
            promo_avg_usd: 137.31,
            original_mutated: false
          }
        ]
      }
    },
    {
      id: 'inmutabilidad-y-expresiones-en-polars',
      heading: 'Inmutabilidad, expresiones pl.col y modo perezoso en Polars 2.0',
      body: 'Polars lleva la protección un paso más allá: sus tablas no se mutan en el sitio. Toda operación como `.filter()`, `.select()` o `.with_columns()` devuelve un nuevo `DataFrame`. Las columnas que no cambiaron se comparten sin copiarse.\n\nEn lugar de indexar con corchetes anidados, en Polars escribes cada cálculo mediante una **expresión columnar** `pl.col("nombre")`. El motor analiza todas las expresiones juntas. Luego las reparte entre todos los núcleos del procesador en Rust.\n\nCuando trabajas con archivos en disco, Polars distingue dos modos de ejecución. El modo ansioso (`pl.read_parquet`) ejecuta cada línea al instante. En cambio, la **evaluación perezosa** (`pl.scan_parquet`) construye un `LazyFrame`. En Polars 2.0, al cerrar el plan con `.collect()`, el motor `streaming` por defecto procesa los datos por lotes sin cargar columnas ni filas descartadas.',
      example: {
        language: 'python',
        code: `import polars as pl

# Top 4 molinos activos por precio de lista con su margen unitario y precio promocional
top_molinos = (
    pl.scan_parquet("public/datasets/products.parquet")
    .filter(pl.col("is_active") & (pl.col("list_price_usd") > 0) & (pl.col("category") == "Molinos"))
    .with_columns(
        (pl.col("list_price_usd") - pl.col("unit_cost_usd")).round(2).alias("unit_margin_usd"),
        (pl.col("list_price_usd") * 0.90).round(2).alias("promo_price_usd"),
    )
    .select(["sku", "category", "list_price_usd", "unit_cost_usd", "unit_margin_usd", "promo_price_usd"])
    .sort("list_price_usd", descending=True)
    .head(4)
    .collect()
)`,
        expectedOutput: [
          {
            sku: 'MB-MOL-162',
            category: 'Molinos',
            list_price_usd: 237.01,
            unit_cost_usd: 134.16,
            unit_margin_usd: 102.85,
            promo_price_usd: 213.31
          },
          {
            sku: 'MB-MOL-002',
            category: 'Molinos',
            list_price_usd: 226.17,
            unit_cost_usd: 130.86,
            unit_margin_usd: 95.31,
            promo_price_usd: 203.55
          },
          {
            sku: 'MB-MOL-172',
            category: 'Molinos',
            list_price_usd: 223.71,
            unit_cost_usd: 133.1,
            unit_margin_usd: 90.61,
            promo_price_usd: 201.34
          },
          {
            sku: 'MB-MOL-137',
            category: 'Molinos',
            list_price_usd: 214.05,
            unit_cost_usd: 113.09,
            unit_margin_usd: 100.96,
            promo_price_usd: 192.65
          }
        ]
      }
    },
    {
      id: 'equivalencia-polars-y-pandas-3',
      heading: 'Cómo traducir patrones entre Polars 2.0 y pandas 3.0',
      body: 'En tu trabajo encontrarás proyectos nuevos escritos en Polars y repositorios consolidados en pandas. A partir de pandas 3.0 existe además `pd.col()`, que permite referenciar columnas dentro de `.loc[]` y `.assign()` sin repetir el nombre de la variable del `DataFrame`.\n\n| Operación | Polars 2.0 | pandas 3.0 (con CoW y `pd.col`) |\n|---|---|---|\n| Filtrar filas | `df.filter(pl.col("list_price_usd") > 0)` | `df.loc[pd.col("list_price_usd") > 0]` |\n| Crear columna | `df.with_columns((pl.col("a") - pl.col("b")).alias("c"))` | `df.assign(c=pd.col("a") - pd.col("b"))` |\n| Seleccionar | `df.select(["sku", "list_price_usd"])` | `df[["sku", "list_price_usd"]]` |\n| Agrupar | `df.group_by("category").agg(pl.col("list_price_usd").mean())` | `df.groupby("category", as_index=False)["list_price_usd"].mean()` |\n\nUsa Polars para tuberías nuevas de transformación y archivos grandes; usa pandas 3.0 con `.assign()` y CoW cuando interactúes con bibliotecas estadísticas como `statsmodels` o `scikit-learn`.'
    }
  ],

  workedExample: {
    title: 'Auditoría y resumen de márgenes del catálogo de Mercado Brisa',
    description: 'Compara el resumen directo de `products.parquet` sin filtrar anomalías frente al flujo limpio e inmutable en Polars 2.0 y pandas 3.0.',
    audit: 'Al excluir el SKU de prueba `SKU-TEST-NEG` (-9.99 USD) en la categoría Accesorios, el precio mínimo pasa de -9.99 USD a 11.92 USD y el promedio sube de 39.88 USD a 41.26 USD.',
    steps: [
      {
        label: '1. Antipatrón: agregar el catálogo crudo con el SKU negativo de prueba',
        explanation: 'Si agrupas los 180 registros de `products.parquet` sin filtrar precios positivos, el producto de calibración `SKU-TEST-NEG` (`list_price_usd = -9.99`) distorsiona la categoría `Accesorios`.',
        code: `import polars as pl

# Error común: agrupar sin validar el dominio de list_price_usd
resumen_crudo = (
    pl.read_parquet("public/datasets/products.parquet")
    .group_by("category")
    .agg(
        pl.len().alias("total_skus"),
        pl.col("list_price_usd").mean().round(2).alias("avg_price_usd"),
        pl.col("list_price_usd").min().round(2).alias("min_price_usd"),
    )
    .sort("total_skus", descending=True)
)`,
        expectedOutput: [
          { category: 'Accesorios', total_skus: 37, avg_price_usd: 39.88, min_price_usd: -9.99 },
          { category: 'Cafeteras', total_skus: 36, avg_price_usd: 116.36, min_price_usd: 38.9 },
          { category: 'Molinos', total_skus: 36, avg_price_usd: 152.57, min_price_usd: 69.7 },
          { category: 'Café en grano', total_skus: 36, avg_price_usd: 29.34, min_price_usd: 15.25 },
          { category: 'Suscripciones', total_skus: 35, avg_price_usd: 47.83, min_price_usd: 24.62 }
        ]
      },
      {
        label: '2. Solución verificada: filtrado perezoso y margen unitario por categoría',
        explanation: 'Filtramos `list_price_usd > 0`, calculamos el margen unitario (`list_price_usd - unit_cost_usd`) con expresiones vectorizadas y agregamos las 5 categorías limpias (179 SKUs con precio válido).',
        code: `import polars as pl

resumen_limpio = (
    pl.scan_parquet("public/datasets/products.parquet")
    .filter(pl.col("list_price_usd") > 0)
    .with_columns(
        (pl.col("list_price_usd") - pl.col("unit_cost_usd")).alias("unit_margin_usd")
    )
    .group_by("category")
    .agg(
        pl.len().alias("total_skus"),
        pl.col("list_price_usd").mean().round(2).alias("avg_price_usd"),
        pl.col("list_price_usd").min().round(2).alias("min_price_usd"),
        pl.col("unit_margin_usd").mean().round(2).alias("avg_unit_margin_usd"),
    )
    .sort("avg_price_usd", descending=True)
    .collect()
)`,
        expectedOutput: [
          { category: 'Molinos', total_skus: 36, avg_price_usd: 152.57, min_price_usd: 69.7, avg_unit_margin_usd: 66.29 },
          { category: 'Cafeteras', total_skus: 36, avg_price_usd: 116.36, min_price_usd: 38.9, avg_unit_margin_usd: 55.98 },
          { category: 'Suscripciones', total_skus: 35, avg_price_usd: 47.83, min_price_usd: 24.62, avg_unit_margin_usd: 24.84 },
          { category: 'Accesorios', total_skus: 36, avg_price_usd: 41.26, min_price_usd: 11.92, avg_unit_margin_usd: 24.09 },
          { category: 'Café en grano', total_skus: 36, avg_price_usd: 29.34, min_price_usd: 15.25, avg_unit_margin_usd: 16.35 }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'predict-output',
      prompt: 'En pandas 3.0 ejecutas `sub = df[df["category"] == "Molinos"]` y en la línea siguiente haces `sub["list_price_usd"] = 0`. ¿Qué ocurre con la columna `list_price_usd` dentro del DataFrame original `df`?',
      options: [
        {
          id: 'a',
          text: 'Permanece intacta en `df` porque Copy-on-Write clona el búfer de `list_price_usd` solo para `sub` al momento de modificarlo.',
          correct: true,
          feedback: 'Correcto. Con Copy-on-Write obligatorio en pandas 3.0, cualquier subconjunto se comporta como una copia aislada y nunca muta al DataFrame padre.'
        },
        {
          id: 'b',
          text: 'Cambia a `0` en `df` para todas las filas de la categoría Molinos y muestra `SettingWithCopyWarning`.',
          correct: false,
          feedback: 'Incorrecto. Ese comportamiento ambiguo y la advertencia `SettingWithCopyWarning` fueron eliminados en pandas 3.0.'
        },
        {
          id: 'c',
          text: 'Duplica toda la tabla `df` en memoria RAM en el instante en que se ejecuta el filtro `df[df["category"] == "Molinos"]`.',
          correct: false,
          feedback: 'Incorrecto. CoW retrasa la copia física hasta que una columna se modifica, compartiendo antes los búferes de lectura.'
        }
      ],
      explanation: 'En pandas 3.0 el modo Copy-on-Write comparte la memoria al filtrar pero separa el búfer en cuanto escribes en `sub`, garantizando que `df` nunca sufra mutaciones colaterales.'
    },
    {
      id: 'c2',
      type: 'mcq',
      prompt: '¿Qué ventaja aporta que pandas 3.0 y Polars 2.0 almacenen las columnas de texto en búferes contiguos de Apache Arrow (`str` / `pl.String`) en lugar del antiguo tipo `object`?',
      options: [
        {
          id: 'a',
          text: 'Evita saltar entre punteros de objetos Python dispersos en RAM, reduce el consumo de memoria y acelera las operaciones de texto.',
          correct: true,
          feedback: 'Exacto. Un array de texto Arrow guarda todos los bytes UTF-8 seguidos junto a un búfer de desplazamientos, aprovechando la caché del procesador.'
        },
        {
          id: 'b',
          text: 'Convierte automáticamente todas las cadenas de texto en números enteros de 32 bits.',
          correct: false,
          feedback: 'Incorrecto. Las cadenas siguen siendo texto UTF-8 completo; lo que cambia es su disposición contigua en memoria.'
        },
        {
          id: 'c',
          text: 'Obliga a definir un índice jerárquico `MultiIndex` en todas las tablas.',
          correct: false,
          feedback: 'Incorrecto. De hecho, Polars no utiliza `Index` en absoluto y opera directamente sobre las columnas Arrow.'
        }
      ],
      explanation: 'El tipo `object` antiguo guardaba un puntero de Python por cada celda de texto; el formato columnar de Arrow almacena los caracteres UTF-8 contiguos en memoria.'
    },
    {
      id: 'c3',
      type: 'mcq',
      prompt: 'En Polars 2.0 quieres añadir la columna `unit_margin_usd` restando `unit_cost_usd` a `list_price_usd` sobre un `LazyFrame` llamado `lf`. ¿Cuál es la sintaxis correcta?',
      options: [
        {
          id: 'a',
          text: 'lf.with_columns((pl.col("list_price_usd") - pl.col("unit_cost_usd")).alias("unit_margin_usd"))',
          correct: true,
          feedback: 'Correcto. `.with_columns()` añade o reemplaza columnas evaluando expresiones `pl.col()` en paralelo sin mutar el objeto anterior.'
        },
        {
          id: 'b',
          text: 'lf["unit_margin_usd"] = lf["list_price_usd"] - lf["unit_cost_usd"]',
          correct: false,
          feedback: 'Incorrecto. Polars no permite asignación por corchetes sobre un `LazyFrame` ni mutación en el sitio.'
        },
        {
          id: 'c',
          text: 'lf.apply(lambda row: row["list_price_usd"] - row["unit_cost_usd"], axis=1)',
          correct: false,
          feedback: 'Incorrecto. Ese patrón pertenece a pandas fila por fila y rompe la ejecución vectorizada en Rust.'
        }
      ],
      explanation: 'En Polars las transformaciones de columnas se declaran dentro de `.with_columns()` o `.select()` combinando expresiones `pl.col()` y nombrando la salida con `.alias()`.'
    },
    {
      id: 'c4',
      type: 'predict-output',
      prompt: 'En pandas 3.0 alguien escribe la asignación encadenada `df["list_price_usd"][df["sku"] == "SKU-TEST-NEG"] = 0`. ¿Qué resultado obtiene al ejecutar esa línea?',
      options: [
        {
          id: 'a',
          text: 'Lanza `ChainedAssignmentError` y no modifica `df`, obligando a escribir `df.loc[df["sku"] == "SKU-TEST-NEG", "list_price_usd"] = 0`.',
          correct: true,
          feedback: 'Exacto. Como `df["list_price_usd"]` se comporta como copia bajo CoW, escribir sobre ella con un segundo corchete fallaría siempre, por lo que pandas 3.0 lanza un error explícito.'
        },
        {
          id: 'b',
          text: 'Actualiza el precio a `0` silenciosamente sin mostrar errores ni advertencias.',
          correct: false,
          feedback: 'Incorrecto. Bajo Copy-on-Write el primer índice devuelve un objeto protegido y la asignación encadenada nunca puede mutar `df`.'
        },
        {
          id: 'c',
          text: 'Borra la fila completa donde `sku` es igual a `SKU-TEST-NEG`.',
          correct: false,
          feedback: 'Incorrecto. Una asignación de valores no elimina filas y en pandas 3.0 es bloqueada por `ChainedAssignmentError`.'
        }
      ],
      explanation: 'En pandas 3.0 la asignación encadenada (`df["col"][cond] = valor`) nunca tiene efecto sobre `df` y arroja `ChainedAssignmentError`; siempre debe usarse `.loc[cond, "col"] = valor`.'
    }
  ],

  practice: {
    type: 'fill-blanks',
    title: 'Cálculo inmutable de márgenes por categoría en Polars 2.0',
    language: 'python',
    prompt: 'Completa el script en Polars 2.0 para escanear `products.parquet` de forma perezosa, excluir el SKU negativo (`list_price_usd > 0`), calcular la columna `unit_margin_usd` y materializar el resumen por categoría.',
    starterCode: `import polars as pl

resumen = (
    pl.{{blank_1}}("public/datasets/products.parquet")
    .filter(pl.col("list_price_usd") > 0)
    .{{blank_2}}(
        (pl.col("list_price_usd") - pl.col("unit_cost_usd")).alias("unit_margin_usd")
    )
    .group_by("category")
    .agg(
        pl.len().alias("total_skus"),
        pl.col("list_price_usd").mean().round(2).alias("avg_price_usd"),
        pl.col("unit_margin_usd").mean().round(2).alias("avg_unit_margin_usd"),
    )
    .sort("avg_price_usd", descending=True)
    .{{blank_3}}()
)`,
    expected: `import polars as pl

resumen = (
    pl.scan_parquet("public/datasets/products.parquet")
    .filter(pl.col("list_price_usd") > 0)
    .with_columns(
        (pl.col("list_price_usd") - pl.col("unit_cost_usd")).alias("unit_margin_usd")
    )
    .group_by("category")
    .agg(
        pl.len().alias("total_skus"),
        pl.col("list_price_usd").mean().round(2).alias("avg_price_usd"),
        pl.col("unit_margin_usd").mean().round(2).alias("avg_unit_margin_usd"),
    )
    .sort("avg_price_usd", descending=True)
    .collect()
)`,
    orderMatters: true,
    hints: [
      'Para iniciar un plan perezoso (`LazyFrame`) sin cargar todo el archivo Parquet de golpe en memoria, usa `scan_parquet`.',
      'El método de Polars para añadir una columna calculada conservando las existentes es `with_columns`.',
      'Para ejecutar el plan perezoso optimizado y obtener el `DataFrame` final, llama a `collect`.'
    ],
    solution: `import polars as pl

resumen = (
    pl.scan_parquet("public/datasets/products.parquet")
    .filter(pl.col("list_price_usd") > 0)
    .with_columns(
        (pl.col("list_price_usd") - pl.col("unit_cost_usd")).alias("unit_margin_usd")
    )
    .group_by("category")
    .agg(
        pl.len().alias("total_skus"),
        pl.col("list_price_usd").mean().round(2).alias("avg_price_usd"),
        pl.col("unit_margin_usd").mean().round(2).alias("avg_unit_margin_usd"),
    )
    .sort("avg_price_usd", descending=True)
    .collect()
)`,
    solutionExplanation: 'Inicia el plan perezoso con `pl.scan_parquet()`, añade `unit_margin_usd` mediante `.with_columns()` y ejecuta el grafo optimizado con `.collect()`.',
    blanks: [
      {
        id: 'blank_1',
        label: 'Lector perezoso de Parquet',
        correct: 'scan_parquet',
        options: ['scan_parquet', 'read_csv', 'from_dicts'],
        hint: 'Construye un LazyFrame sobre el archivo Parquet para empujar el filtro de precios positivos.'
      },
      {
        id: 'blank_2',
        label: 'Método para añadir columnas calculadas',
        correct: 'with_columns',
        options: ['with_columns', 'assign_column', 'mutate_in_place'],
        hint: 'Recibe expresiones pl.col() y devuelve un nuevo LazyFrame con la columna añadida.'
      },
      {
        id: 'blank_3',
        label: 'Materializar el LazyFrame',
        correct: 'collect',
        options: ['collect', 'execute_now', 'to_list'],
        hint: 'Dispara el optimizador de consultas de Polars 2.0 y devuelve el DataFrame resultante.'
      }
    ],
    expectedOutputTable: [
      { category: 'Molinos', total_skus: 36, avg_price_usd: 152.57, avg_unit_margin_usd: 66.29 },
      { category: 'Cafeteras', total_skus: 36, avg_price_usd: 116.36, avg_unit_margin_usd: 55.98 },
      { category: 'Suscripciones', total_skus: 35, avg_price_usd: 47.83, avg_unit_margin_usd: 24.84 },
      { category: 'Accesorios', total_skus: 36, avg_price_usd: 41.26, avg_unit_margin_usd: 24.09 },
      { category: 'Café en grano', total_skus: 36, avg_price_usd: 29.34, avg_unit_margin_usd: 16.35 }
    ]
  },

  roleNotes: {
    de: 'Estandariza Polars en modo perezoso (`scan_parquet` + `.collect()`) para contenedores de transformación que procesan decenas de gigabytes sin agotar la memoria RAM. Cuando mantengas servicios heredados en pandas, actualiza a pandas 3.0 para eliminar copias defensivas `.copy()` innecesarias y aprovechar cadenas PyArrow de menor huella en memoria.',
    da: 'En cuadernos exploratorios, el modo Copy-on-Write de pandas 3.0 y la inmutabilidad de Polars evitan que una prueba de escenarios en una celda inferior altere las tablas base cargadas al inicio. Sustituye la indexación encadenada por `.loc[]`, `.assign(col=pd.col(...))` o expresiones `pl.col()`.',
    bi: 'Al preparar tablas intermedias en Python antes de publicarlas hacia Power BI o DuckDB, filtra explícitamente registros de calibración como `SKU-TEST-NEG` y conserva los tipos columnares de Arrow. Así evitas que columnas de texto o identificadores lleguen al modelo semántico como objetos lentos de serializar.'
  },

  summary: [
    'Polars 2.0 y pandas 3.0 almacenan columnas en búferes contiguos de Apache Arrow, incluyendo cadenas UTF-8.',
    'En pandas 3.0 el modo Copy-on-Write es obligatorio: ningún subconjunto filtrado puede mutar la tabla original.',
    'La asignación encadenada lanza ChainedAssignmentError en pandas 3.0; usa siempre .loc o .assign.',
    'Polars no usa índice de filas, opera con DataFrames inmutables y optimiza consultas con LazyFrame.'
  ],

  flashcards: [
    {
      id: 'fc-c1-py-01-a',
      front: '¿Qué garantiza Copy-on-Write (CoW) en pandas 3.0 al filtrar un DataFrame?',
      back: 'Garantiza que el subconjunto se comporte siempre como una copia aislada: comparte memoria al leer, pero clona el búfer si modificas una columna.'
    },
    {
      id: 'fc-c1-py-01-b',
      front: '¿Por qué falla `df["precio"][df["activo"]] = 10` en pandas 3.0 y cómo se corrige?',
      back: 'Falla con ChainedAssignmentError porque intenta escribir sobre una selección temporal. Se corrige con `df.loc[df["activo"], "precio"] = 10`.'
    },
    {
      id: 'fc-c1-py-01-c',
      front: '¿Qué diferencia estructural existe entre Polars y pandas respecto al índice de filas (`Index`)?',
      back: 'Polars no tiene `Index`; identifica las filas únicamente por su posición entera o mediante columnas explícitas de datos.'
    },
    {
      id: 'fc-c1-py-01-d',
      front: '¿Cómo almacena pandas 3.0 las columnas de texto por defecto frente a pandas 1.x?',
      back: 'Usa el tipo `str` respaldado por búferes contiguos UTF-8 de PyArrow en lugar de arrays `object` llenos de punteros a objetos Python.'
    }
  ],

  glossaryTerms: [
    'pandas-copy-on-write',
    'polars-lazyframe',
    'pyarrow-string-dtype',
    'polars-expresion-columnar'
  ],

  sources: [
    {
      title: 'Polars User Guide — Getting Started, Expressions & Lazy API (v2.0)',
      url: 'https://docs.pola.rs/user-guide/getting-started/',
      publisher: 'Polars Project',
      accessed: '2026-10-29',
      supports: 'Modelo inmutable sin índice, expresiones pl.col() y ejecución perezosa con motor streaming por defecto en Polars 2.0.'
    },
    {
      title: 'pandas 3.0 User Guide — Copy-on-Write (CoW)',
      url: 'https://pandas.pydata.org/docs/user_guide/copy_on_write.html',
      publisher: 'PyData / NumFOCUS',
      accessed: '2026-10-29',
      supports: 'Activación por defecto de Copy-on-Write en pandas 3.0, eliminación de SettingWithCopyWarning y bloqueo de asignación encadenada.'
    },
    {
      title: 'pandas 3.0 User Guide — Working with Text Data (PyArrow String Dtype)',
      url: 'https://pandas.pydata.org/docs/user_guide/text.html',
      publisher: 'PyData / NumFOCUS',
      accessed: '2026-10-29',
      supports: 'Adopción por defecto del tipo str respaldado por PyArrow para columnas de texto en pandas 3.0.'
    },
    {
      title: 'Apache Arrow Documentation — Columnar Format and Memory Layout',
      url: 'https://arrow.apache.org/docs/format/Columnar.html',
      publisher: 'Apache Software Foundation',
      accessed: '2026-10-29',
      supports: 'Disposición física de búferes contiguos de validez, desplazamientos y valores en memoria RAM.'
    }
  ],

  aiNotes: 'Las personas que vienen de tutoriales antiguos de pandas suelen poner `.copy()` en cada filtro por miedo a `SettingWithCopyWarning` o intentan usar `.iloc`/`.loc` en Polars buscando un `Index`. Aclara que en pandas 3.0 CoW ya protege cada subconjunto automáticamente y que en Polars toda selección se expresa mediante `filter()` y `pl.col()`.'
};

export default lesson;
