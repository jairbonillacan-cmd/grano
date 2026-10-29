const lesson = {
  id: 'c1-python-02-io-csv-json-parquet',
  moduleId: 'c1-python',
  tracks: ['core'],
  level: 1,
  order: 2,
  title: 'Lectura y escritura de CSV, JSON y Parquet con tipado',
  minutes: 20,
  prerequisites: ['c1-python-01-polars-pandas-cow'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), un proveedor logístico exportó el padrón de 2 400 clientes en un archivo CSV. Las primeras filas tenían códigos postales numéricos como `11017` en Bogotá, por lo que el lector infirió una columna entera (`Int64`): truncó el cero inicial de los 364 códigos de México (`06102` pasó a `6102`) y abortó al llegar a los 364 códigos alfanuméricos de Argentina (`C1051`). ¿Cómo declaras tipos explícitos al leer texto y por qué Parquet evita este fallo de raíz?',

  objectives: [
    'Prevenir la pérdida de ceros iniciales y fallos de inferencia en CSV declarando tipos explícitos con `schema_overrides` y `dtype`.',
    'Extraer campos tipados desde archivos JSON por líneas (`NDJSON`) y cadenas JSON anidadas en columnas tabulares.',
    'Aplicar lectura perezosa (`scan_parquet`) y escritura comprimida (`write_parquet`) aprovechando el esquema embebido de Parquet.'
  ],

  sections: [
    {
      id: 'trampas-inferencia-csv',
      heading: 'Por qué falla la inferencia automática al leer archivos CSV',
      body: 'Un archivo CSV es texto plano sin diccionario de tipos. Cuando ejecutas `pl.read_csv()` o `pd.read_csv()`, el lector inspecciona una muestra inicial de filas (`infer_schema_length` en Polars, 100 filas por defecto). Con esa muestra intenta adivinar si cada columna es entera, decimal, booleana o texto.\n\nEsa adivinanza provoca dos errores frecuentes en datos de negocio. Primero, corrompe identificadores numéricos que no representan cantidades. Un código postal como `06102` en Ciudad de México se convierte en el entero `6102` y pierde su cero inicial. Segundo, si en la fila 500 aparece el código postal argentino `C1051`, la lectura falla porque una letra no cabe en un `Int64`.\n\nPara blindar la ingesta, usa siempre **sobrescritura de esquema en lectura**. Pasa `schema_overrides={"postal_code": pl.String}` en Polars o `dtype={"postal_code": "str"}` en pandas 3.0. Además, declara `null_values=["", "NA", "N/A", "null"]` cuando el sistema origen mezcle marcadores de ausencia.',
      example: {
        language: 'python',
        code: `import polars as pl

# Lectura segura: forzamos postal_code como pl.String aunque parezca número
df_clientes = (
    pl.read_csv(
        "clientes_export.csv",
        schema_overrides={"customer_id": pl.Int64, "postal_code": pl.String},
        null_values=["", "NULL", "N/A"],
    )
    .select(["customer_id", "country_code", "postal_code"])
    .head(6)
)`,
        expectedOutput: [
          { customer_id: 1, country_code: 'CO', postal_code: '11017', str_len: 5, as_int_corrupted: 11017 },
          { customer_id: 2, country_code: 'CL', postal_code: '75034', str_len: 5, as_int_corrupted: 75034 },
          { customer_id: 3, country_code: 'AR', postal_code: 'C1051', str_len: 5, as_int_corrupted: null },
          { customer_id: 4, country_code: 'PE', postal_code: '15068', str_len: 5, as_int_corrupted: 15068 },
          { customer_id: 5, country_code: 'ES', postal_code: '28085', str_len: 5, as_int_corrupted: 28085 },
          { customer_id: 6, country_code: 'MX', postal_code: '06102', str_len: 5, as_int_corrupted: 6102 }
        ]
      }
    },
    {
      id: 'lectura-json-ndjson-y-estructuras',
      heading: 'Cómo procesar JSON delimitado por líneas y campos anidados',
      body: 'Las aplicaciones web y los webhooks rara vez emiten un único arreglo JSON gigante. Hacerlo obligaría a cargar todo el archivo en RAM para validar el corchete final. En su lugar escriben **NDJSON** (*Newline Delimited JSON*, extensión `.jsonl`). Allí cada línea es un objeto JSON independiente que Polars escanea en paralelo con `pl.scan_ndjson()`.\n\nOtras veces, una tabla ya almacenada incluye una columna de texto con atributos variables en formato JSON. En la tabla `events` de Mercado Brisa, la columna `payload_json` guarda cadenas como `{"source":"web","campaign":"CMP-VERANO","step":"checkout_completed"}`.\n\nNo conviertas la columna a diccionarios de Python con `json.loads()` fila por fila. Usa `.str.json_decode()` pasándole un tipo `pl.Struct` explícito. Así Polars convierte el texto en subcolumnas columnares tipadas y extrae cualquier campo con `.struct.field("campaign")` a velocidad nativa.',
      example: {
        language: 'python',
        code: `import polars as pl

payload_dtype = pl.Struct([
    pl.Field("source", pl.String),
    pl.Field("campaign", pl.String),
    pl.Field("step", pl.String),
])

eventos_campana = (
    pl.scan_parquet("public/datasets/events.parquet")
    .with_columns(
        pl.col("payload_json").str.json_decode(dtype=payload_dtype).struct.field("campaign").alias("campaign")
    )
    .filter(pl.col("campaign").is_not_null())
    .group_by("campaign")
    .agg(
        pl.len().alias("total_events"),
        pl.col("session_id").n_unique().alias("unique_sessions"),
    )
    .sort("total_events", descending=True)
    .collect()
)`,
        expectedOutput: [
          { campaign: 'CMP-DIRECT', total_events: 6000, unique_sessions: 6000 },
          { campaign: 'CMP-BARISTA', total_events: 3000, unique_sessions: 3000 },
          { campaign: 'CMP-ORIGEN', total_events: 3000, unique_sessions: 3000 },
          { campaign: 'CMP-VERANO', total_events: 3000, unique_sessions: 3000 },
          { campaign: 'CMP-RETENCION', total_events: 3000, unique_sessions: 3000 }
        ]
      }
    },
    {
      id: 'parquet-esquema-y-compresion-zstd',
      heading: 'Por qué Parquet conserva los tipos y reduce el tamaño en disco',
      body: 'Cuando guardas una tabla limpia en CSV, pierdes toda la información de tipos que tanto costó declarar. La siguiente persona que abra el archivo volverá a sufrir la inferencia de texto.\n\n**Apache Parquet** resuelve esto guardando los datos en formato binario columnar junto con un pie de archivo (*Footer*). Ese bloque final registra el esquema exacto (`Int64`, `Float64`, `String`, `Date`, `Datetime`), el conteo de nulos y los valores mínimo y máximo de cada bloque.\n\nAdemás, al agrupar valores del mismo tipo juntos, algoritmos como `zstd` (*Zstandard*) logran tasas de compresión muy altas con descompresión rápida. En Mercado Brisa, las 13 tablas completas suman `154 845` filas y ocupan apenas `2.14 MB` en Parquet con `zstd`. Por ejemplo, `orders.parquet` almacena `18 000` pedidos con 14 columnas tipadas en `384.1 KB`.',
      interactive: {
        component: 'row-vs-columnar-storage',
        caption: 'Simulador interactivo: Lectura por filas en CSV frente a proyección columnar y poda en Parquet'
      }
    },
    {
      id: 'escaneo-perezoso-y-escritura-validada',
      heading: 'De scan_parquet a write_parquet con poda de columnas y filtros',
      body: 'Para leer Parquet en Polars 2.0 tienes dos funciones: `pl.read_parquet()`, que carga el archivo de inmediato en un `DataFrame`, y `pl.scan_parquet()`, que devuelve un `LazyFrame` sin tocar los bloques de datos hasta el final.\n\nSi la tabla `orders.parquet` tiene 14 columnas pero tu consulta solo necesita `device_type`, `status` y `total_usd` para los pedidos completados, `pl.scan_parquet()` aplica dos optimizaciones automáticas antes de leer el disco:\n\n- **Poda de proyección** (*Projection Pushdown*): ignora los bytes de las otras 11 columnas.\n- **Empuje de predicados** (*Predicate Pushdown*): usa las estadísticas del pie de Parquet para saltar bloques que no contengan `status == "completed"`.\n\nAl terminar de transformar, persiste siempre el resultado en Parquet con `df.write_parquet("salida.parquet", compression="zstd")` (o `.sink_parquet()` si el resultado no cabe entero en RAM).'
    }
  ],

  workedExample: {
    title: 'Ingesta tipada de clientes y resumen de pedidos desde Parquet',
    description: 'Verifica primero cuántas filas de `customers` se corrompen o fallan si no fuerzas `postal_code` como texto, y luego ejecuta un escaneo perezoso sobre `orders.parquet`.',
    audit: 'En `customers.parquet` (2 400 filas), los 364 códigos válidos de México empiezan por `0` y los 364 de Argentina empiezan por `C`; solo `pl.String` conserva ambos intactos.',
    steps: [
      {
        label: '1. Diagnóstico de códigos postales por país en Mercado Brisa',
        explanation: 'Inspeccionamos en `customers.parquet` cuántos registros por país empiezan con cero (que se truncarían a entero) o contienen letras (que romperían una columna `Int64`).',
        code: `import polars as pl

auditoria_postal = (
    pl.scan_parquet("public/datasets/customers.parquet")
    .group_by("country_code")
    .agg(
        pl.len().alias("total_clientes"),
        pl.col("postal_code").str.starts_with("0").sum().alias("con_cero_inicial"),
        pl.col("postal_code").str.contains(r"^[A-Za-z]").sum().alias("alfanumericos"),
    )
    .sort("country_code")
    .collect()
)`,
        expectedOutput: [
          { country_code: 'AR', total_clientes: 400, con_cero_inicial: 0, alfanumericos: 364 },
          { country_code: 'CL', total_clientes: 400, con_cero_inicial: 0, alfanumericos: 0 },
          { country_code: 'CO', total_clientes: 400, con_cero_inicial: 0, alfanumericos: 0 },
          { country_code: 'ES', total_clientes: 400, con_cero_inicial: 0, alfanumericos: 0 },
          { country_code: 'MX', total_clientes: 400, con_cero_inicial: 364, alfanumericos: 0 },
          { country_code: 'PE', total_clientes: 400, con_cero_inicial: 0, alfanumericos: 0 }
        ]
      },
      {
        label: '2. Escaneo perezoso de pedidos completados por tipo de dispositivo',
        explanation: 'Leemos `orders.parquet` con `pl.scan_parquet()`, empujando el filtro `status == "completed"` y leyendo solo 3 de las 14 columnas antes de guardar el resumen comprimido con `zstd`.',
        code: `import polars as pl

ventas_dispositivo = (
    pl.scan_parquet("public/datasets/orders.parquet")
    .filter(pl.col("status") == "completed")
    .group_by("device_type")
    .agg(
        pl.len().alias("total_orders"),
        pl.col("total_usd").sum().round(2).alias("revenue_usd"),
        pl.col("total_usd").mean().round(2).alias("avg_order_usd"),
    )
    .sort("revenue_usd", descending=True)
    .collect()
)

ventas_dispositivo.write_parquet("ventas_por_dispositivo.parquet", compression="zstd")`,
        expectedOutput: [
          { device_type: 'desktop', total_orders: 6327, revenue_usd: 2867799.0, avg_order_usd: 453.26 },
          { device_type: 'mobile', total_orders: 5624, revenue_usd: 2199394.23, avg_order_usd: 391.07 },
          { device_type: 'pos_tienda', total_orders: 2809, revenue_usd: 1202269.19, avg_order_usd: 428.01 }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: 'Recibes un archivo `customers.csv` donde las primeras 300 filas tienen códigos postales numéricos (`11017`) y en la fila 350 aparece `C1051` (Argentina). ¿Cómo evitas que `pl.read_csv()` falle o trunque ceros iniciales?',
      options: [
        {
          id: 'a',
          text: 'Pasando `schema_overrides={"postal_code": pl.String}` al llamar a `pl.read_csv()` o `pl.scan_csv()`.',
          correct: true,
          feedback: 'Correcto. Declarar `postal_code` como `pl.String` impide que Polars lo infiera como entero y conserva tanto ceros iniciales (`06102`) como letras (`C1051`).'
        },
        {
          id: 'b',
          text: 'Convirtiendo la columna a entero con `.cast(pl.Int64)` después de haber leído el CSV.',
          correct: false,
          feedback: 'Incorrecto. El error ocurre durante el parseo del CSV antes de devolver el DataFrame, y además un código postal alfanumérico no es un entero.'
        },
        {
          id: 'c',
          text: 'Borrando manualmente del CSV todas las filas de México y Argentina antes de leerlo.',
          correct: false,
          feedback: 'Incorrecto. Eliminar clientes válidos mutila un tercio del padrón cuando el problema es solo la inferencia de tipos.'
        }
      ],
      explanation: 'Todo identificador que no se sume ni reste (códigos postales, teléfonos, SKUs, documentos) debe declararse como `pl.String` en `schema_overrides` al leer texto.'
    },
    {
      id: 'c2',
      type: 'mcq',
      prompt: '¿Qué dos optimizaciones automáticas realiza `pl.scan_parquet("orders.parquet")` antes de leer el disco cuando encadenas `.filter(pl.col("status") == "completed").select(["order_id", "total_usd"])`?',
      options: [
        {
          id: 'a',
          text: 'Poda de proyección (lee solo las columnas pedidas) y empuje de predicados (salta bloques que no cumplen el filtro).',
          correct: true,
          feedback: 'Exacto. El optimizador de Polars inspecciona el plan antes de tocar el archivo Parquet y evita leer las otras 12 columnas y los grupos de filas irrelevantes.'
        },
        {
          id: 'b',
          text: 'Convierte el archivo Parquet en un archivo CSV temporal y lo comprime en formato ZIP.',
          correct: false,
          feedback: 'Incorrecto. `scan_parquet` lee directamente los bloques binarios columnares de Parquet sin pasar por texto.'
        },
        {
          id: 'c',
          text: 'Carga las 14 columnas completas en memoria RAM y luego borra las 12 sobrantes.',
          correct: false,
          feedback: 'Incorrecto. Eso es lo que ocurre con la lectura ansiosa `read_parquet` seguida de `select`, no con `scan_parquet`.'
        }
      ],
      explanation: 'Con `scan_parquet`, el optimizador de consultas aplica Projection Pushdown y Predicate Pushdown directamente sobre los metadatos del pie del archivo Parquet antes de leer los bloques de disco.'
    },
    {
      id: 'c3',
      type: 'predict-output',
      prompt: 'En la tabla `events` de Mercado Brisa, la columna `payload_json` contiene texto JSON con la clave `"campaign"`. ¿Qué devuelve `pl.col("payload_json").str.json_decode(dtype).struct.field("campaign")`?',
      options: [
        {
          id: 'a',
          text: 'Una serie columnar de tipo texto (`pl.String`) con el valor de `"campaign"` de cada fila o `null` cuando la clave no está presente.',
          correct: true,
          feedback: 'Correcto. `str.json_decode` transforma la cadena JSON en un `Struct` tipado de Arrow y `struct.field("campaign")` extrae ese campo como columna.'
        },
        {
          id: 'b',
          text: 'Un único diccionario de Python con las 65 000 filas concatenadas.',
          correct: false,
          feedback: 'Incorrecto. Las expresiones `.str.json_decode()` y `.struct.field()` operan vectorizadamente devolviendo una columna del mismo largo que la tabla.'
        },
        {
          id: 'c',
          text: 'Un error de sintaxis porque Polars no puede leer texto con llaves `{}`.',
          correct: false,
          feedback: 'Incorrecto. Polars incluye un decodificador JSON vectorizado dentro del espacio de nombres `.str`.'
        }
      ],
      explanation: 'Combinar `.str.json_decode(dtype=...)` con `.struct.field(...)` permite extraer atributos de un JSON anidado de forma vectorizada sin salir de la memoria columnar de Apache Arrow ni crear diccionarios en Python.'
    },
    {
      id: 'c4',
      type: 'mcq',
      prompt: 'Acabas de limpiar y tipar un archivo CSV de 2 millones de filas en Python y otros tres scripts deben consultarlo a diario. ¿En qué formato conviene guardarlo y por qué?',
      options: [
        {
          id: 'a',
          text: 'En Parquet con compresión `zstd`, porque preserva el esquema exacto de tipos en el archivo, ocupa una fracción del espacio y permite leer solo las columnas necesarias.',
          correct: true,
          feedback: 'Exacto. Guardar en Parquet congela los tipos de datos (`Date`, `Int64`, `String`) y habilita lecturas selectivas instantáneas.'
        },
        {
          id: 'b',
          text: 'De nuevo en CSV sin cabeceras, para que cada script vuelva a inferir los tipos desde cero.',
          correct: false,
          feedback: 'Incorrecto. Volver a exportar a CSV destruye los tipos declarados y multiplica el tamaño en disco y el tiempo de parseo.'
        },
        {
          id: 'c',
          text: 'En un archivo `.pkl` (pickle) sin especificar versión, para compartirlo con motores SQL.',
          correct: false,
          feedback: 'Incorrecto. Pickle no es interoperable con motores SQL como DuckDB, puede romperse entre versiones y conlleva riesgos de ejecución de código al cargar archivos externos.'
        }
      ],
      explanation: 'El patrón estándar de ingesta consiste en recibir CSV o JSON crudos aplicando `schema_overrides` una sola vez y persistir de inmediato en Parquet con `zstd`.'
    }
  ],

  practice: {
    type: 'fill-blanks',
    title: 'Ingesta con esquema explícito y escritura en Parquet ZSTD',
    language: 'python',
    prompt: 'Completa el código en Polars 2.0 para: 1) Leer `customers.csv` forzando `postal_code` como `pl.String` mediante `schema_overrides`, 2) Filtrar en `orders.parquet` los pedidos con `status == "completed"` usando escaneo perezoso, y 3) Guardar el resultado en Parquet comprimido.',
    starterCode: `import polars as pl

# 1. Leer CSV declarando explícitamente postal_code como texto
df_clientes = pl.read_csv(
    "customers.csv",
    {{blank_1}}={"customer_id": pl.Int64, "postal_code": pl.String},
)

# 2. Escanear orders.parquet en modo perezoso y agregar por device_type
resumen_dispositivo = (
    pl.{{blank_2}}("public/datasets/orders.parquet")
    .filter(pl.col("status") == "completed")
    .group_by("device_type")
    .agg(
        pl.len().alias("total_orders"),
        pl.col("total_usd").sum().round(2).alias("revenue_usd"),
        pl.col("total_usd").mean().round(2).alias("avg_order_usd"),
    )
    .sort("revenue_usd", descending=True)
    .collect()
)

# 3. Escribir la tabla resultante en formato Parquet con compresión zstd
resumen_dispositivo.{{blank_3}}("ventas_dispositivo.parquet", compression="zstd")`,
    expected: `import polars as pl

# 1. Leer CSV declarando explícitamente postal_code como texto
df_clientes = pl.read_csv(
    "customers.csv",
    schema_overrides={"customer_id": pl.Int64, "postal_code": pl.String},
)

# 2. Escanear orders.parquet en modo perezoso y agregar por device_type
resumen_dispositivo = (
    pl.scan_parquet("public/datasets/orders.parquet")
    .filter(pl.col("status") == "completed")
    .group_by("device_type")
    .agg(
        pl.len().alias("total_orders"),
        pl.col("total_usd").sum().round(2).alias("revenue_usd"),
        pl.col("total_usd").mean().round(2).alias("avg_order_usd"),
    )
    .sort("revenue_usd", descending=True)
    .collect()
)

# 3. Escribir la tabla resultante en formato Parquet con compresión zstd
resumen_dispositivo.write_parquet("ventas_dispositivo.parquet", compression="zstd")`,
    orderMatters: true,
    hints: [
      'En `pl.read_csv()` y `pl.scan_csv()`, el parámetro para fijar tipos de columnas específicas se llama `schema_overrides`.',
      'Usa `scan_parquet` para que Polars empuje el filtro `status == "completed"` y lea únicamente las columnas requeridas.',
      'El método de un `DataFrame` de Polars para exportar a un archivo Parquet en disco es `write_parquet`.'
    ],
    solution: `import polars as pl

# 1. Leer CSV declarando explícitamente postal_code como texto
df_clientes = pl.read_csv(
    "customers.csv",
    schema_overrides={"customer_id": pl.Int64, "postal_code": pl.String},
)

# 2. Escanear orders.parquet en modo perezoso y agregar por device_type
resumen_dispositivo = (
    pl.scan_parquet("public/datasets/orders.parquet")
    .filter(pl.col("status") == "completed")
    .group_by("device_type")
    .agg(
        pl.len().alias("total_orders"),
        pl.col("total_usd").sum().round(2).alias("revenue_usd"),
        pl.col("total_usd").mean().round(2).alias("avg_order_usd"),
    )
    .sort("revenue_usd", descending=True)
    .collect()
)

# 3. Escribir la tabla resultante en formato Parquet con compresión zstd
resumen_dispositivo.write_parquet("ventas_dispositivo.parquet", compression="zstd")`,
    solutionExplanation: 'Fija `postal_code: pl.String` con `schema_overrides` al ingerir CSV, usa `pl.scan_parquet()` para aprovechar la poda de columnas y predicados, y persiste con `.write_parquet(..., compression="zstd")`.',
    blanks: [
      {
        id: 'blank_1',
        label: 'Parámetro para fijar tipos al leer CSV',
        correct: 'schema_overrides',
        options: ['schema_overrides', 'infer_types', 'force_int'],
        hint: 'Diccionario que sobrescribe el tipo inferido de columnas puntuales en Polars.'
      },
      {
        id: 'blank_2',
        label: 'Función de lectura perezosa de Parquet',
        correct: 'scan_parquet',
        options: ['scan_parquet', 'read_json', 'open_csv'],
        hint: 'Crea un LazyFrame que aplica poda de columnas y filtros sobre el archivo Parquet.'
      },
      {
        id: 'blank_3',
        label: 'Método de escritura a Parquet',
        correct: 'write_parquet',
        options: ['write_parquet', 'to_csv_text', 'save_pickle'],
        hint: 'Guarda el DataFrame en formato columnar binario preservando su esquema tipado.'
      }
    ],
    expectedOutputTable: [
      { device_type: 'desktop', total_orders: 6327, revenue_usd: 2867799.0, avg_order_usd: 453.26 },
      { device_type: 'mobile', total_orders: 5624, revenue_usd: 2199394.23, avg_order_usd: 391.07 },
      { device_type: 'pos_tienda', total_orders: 2809, revenue_usd: 1202269.19, avg_order_usd: 428.01 }
    ]
  },

  roleNotes: {
    de: 'En la capa de aterrizaje, convierte inmediatamente los archivos CSV y NDJSON entrantes a Parquet con `zstd` aplicando un esquema explícito (`schema` o `schema_overrides`). Si un archivo supera la memoria disponible del contenedor, encadena `pl.scan_csv(...).sink_parquet(...)` para transformar en flujo continuo sin materializar la tabla completa.',
    da: 'Nunca guardes tablas intermedias de tu análisis en CSV; al reabrirlas perderás los tipos de fecha, los booleanos y los ceros a la izquierda de códigos postales o sucursales. Usa `write_parquet` para que tu cuaderno siguiente cargue los datos tipados en milisegundos.',
    bi: 'Cuando exportes datos para que los consuma Power BI (modo Import o Direct Lake) o un cubo local en DuckDB, entrega archivos Parquet tipados y sin columnas JSON crudas: extrae antes atributos como `campaign` con `str.json_decode` a columnas planas.'
  },

  summary: [
    'La inferencia automática de CSV trunca ceros iniciales en códigos postales y falla ante valores alfanuméricos tardíos.',
    'Declara siempre schema_overrides en Polars o dtype en pandas 3.0 para columnas de códigos e identificadores.',
    'Extrae atributos de JSON anidado de forma vectorizada con str.json_decode y struct.field.',
    'Persiste tus tablas en Parquet con compresión zstd y léelas con scan_parquet para aprovechar la poda de datos.'
  ],

  flashcards: [
    {
      id: 'fc-c1-py-02-a',
      front: '¿Qué ocurre si un lector CSV infiere `postal_code` como `Int64` sobre clientes de México (`06102`) y Argentina (`C1051`)?',
      back: 'Pierde el cero inicial en México (convirtiendo `06102` en `6102`) y lanza un error de conversión al encontrar la letra `C` en Argentina.'
    },
    {
      id: 'fc-c1-py-02-b',
      front: '¿Por qué los registros de eventos se intercambian en NDJSON (`.jsonl`) en lugar de un único arreglo JSON `[...]`?',
      back: 'Porque en NDJSON cada línea es un objeto independiente que se puede leer en paralelo y por lotes sin cargar todo el archivo en RAM.'
    },
    {
      id: 'fc-c1-py-02-c',
      front: '¿Dónde guarda un archivo Apache Parquet los tipos de datos y las estadísticas `min`/`max` de sus bloques?',
      back: 'En el pie del archivo (Footer), lo que permite al motor conocer el esquema al instante y saltar bloques sin descomprimirlos.'
    },
    {
      id: 'fc-c1-py-02-d',
      front: '¿Cuándo debes usar `.sink_parquet()` en lugar de `.collect().write_parquet()` en Polars?',
      back: 'Cuando el `LazyFrame` resultante es más grande que la memoria RAM disponible y necesitas volcar el flujo directamente a disco por lotes.'
    }
  ],

  glossaryTerms: [
    'esquema-explicito-io',
    'polars-lazyframe',
    'pyarrow-string-dtype'
  ],

  sources: [
    {
      title: 'Polars User Guide — IO: CSV, JSON and Parquet',
      url: 'https://docs.pola.rs/user-guide/io/',
      publisher: 'Polars Project',
      accessed: '2026-10-29',
      supports: 'Uso de read_csv, scan_csv con schema_overrides, scan_ndjson, scan_parquet y write_parquet.'
    },
    {
      title: 'Apache Parquet Documentation — File Format, Footer Metadata and Compression',
      url: 'https://parquet.apache.org/docs/file-format/',
      publisher: 'Apache Software Foundation',
      accessed: '2026-10-29',
      supports: 'Almacenamiento de esquema tipado y estadísticas por columna en el Footer de Parquet y compresión ZSTD.'
    },
    {
      title: 'pandas 3.0 User Guide — IO Tools (Text, CSV, HDF5, Parquet)',
      url: 'https://pandas.pydata.org/docs/user_guide/io.html',
      publisher: 'PyData / NumFOCUS',
      accessed: '2026-10-29',
      supports: 'Declaración explícita de dtype en read_csv y lectura/escritura de Parquet con motor pyarrow.'
    }
  ],

  aiNotes: 'Un error frecuente es subir `infer_schema_length=100000` creyendo que eso arregla los códigos postales con cero inicial; explica que si todas las filas de un país son dígitos (`06102`), aumentar la muestra sigue infiriendo `Int64` y borrando el cero. La única solución correcta es `schema_overrides={"postal_code": pl.String}`.'
};

export default lesson;
