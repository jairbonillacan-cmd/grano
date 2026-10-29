const lesson = {
  id: 'c1-python-04-limpieza-texto-fechas-tz',
  moduleId: 'c1-python',
  tracks: ['core'],
  level: 1,
  order: 4,
  title: 'Limpieza de cadenas, fechas y zonas horarias en Python',
  minutes: 20,
  prerequisites: ['c1-python-03-expresiones-vectorizadas'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), la tabla `events` registra 65 000 eventos web desde México (`-06:00`), Colombia (`-05:00`), Argentina (`-03:00`), España (`+01:00`) y servidores en `Z` (UTC). Un analista extrajo la fecha diaria cortando los primeros 10 caracteres de `event_ts_raw` (`"2025-03-03T22:06:33-03:00"[:10]`) y asignó **9 218 eventos** (el 14.18 % del total) al día equivocado en UTC. ¿Cómo limpias cadenas y normalizas zonas horarias de forma vectorizada en Python?',

  objectives: [
    'Normalizar cadenas y detectar valores truncados o mal formados mediante el espacio de nombres `.str` en Polars 2.0 y pandas 3.0.',
    'Convertir textos ISO-8601 con desplazamientos mixtos a un instante común en UTC usando `.str.to_datetime(time_zone="UTC")`.',
    'Distinguir entre etiquetar una fecha sin zona (`replace_time_zone`) y convertir un instante entre husos horarios (`convert_time_zone`).'
  ],

  sections: [
    {
      id: 'limpieza-vectorizada-cadenas-str',
      heading: 'Cómo auditar y limpiar texto con el espacio de nombres .str',
      body: 'Los datos capturados en formularios llegan con espacios invisibles al inicio o al final, mezcla de mayúsculas y minúsculas o códigos incompletos. Gracias a que Polars 2.0 y pandas 3.0 almacenan el texto en búferes contiguos de Apache Arrow, puedes limpiar millones de cadenas sin escribir expresiones regulares en bucles de Python.\n\nEn Polars, todas las operaciones de texto viven bajo `.str`:\n\n- `.str.strip_chars()`: elimina espacios en blanco (u otros caracteres indicados) en ambos extremos.\n- `.str.to_uppercase()` / `.str.to_lowercase()`: unifica mayúsculas y minúsculas antes de agrupar o unir.\n- `.str.len_chars()`: cuenta caracteres Unicode reales (a diferencia de `.str.len_bytes()`).\n- `.str.contains()` y `.str.extract()`: filtran o extraen grupos con expresiones regulares compiladas en Rust.\n\nEn `customers.parquet` de Mercado Brisa (`2 400` filas), combinar `.str.strip_chars()` y `.str.len_chars()` revela al instante que `218` clientes tienen `postal_code` nulo y `129` tienen un prefijo truncado de solo 2 caracteres.',
      example: {
        language: 'python',
        code: `import polars as pl

auditoria_postal = (
    pl.scan_parquet("public/datasets/customers.parquet")
    .with_columns(pl.col("postal_code").str.strip_chars().alias("cp_limpio"))
    .with_columns(
        pl.when(pl.col("cp_limpio").is_null())
        .then(pl.lit("nulo"))
        .when(pl.col("cp_limpio").str.len_chars() < 4)
        .then(pl.lit("truncado_2_chars"))
        .when(pl.col("cp_limpio").str.contains(r"^C[0-9]{4}$"))
        .then(pl.lit("alfanumerico_ar"))
        .otherwise(pl.lit("numerico_5_digitos"))
        .alias("estado_postal")
    )
    .group_by("estado_postal")
    .agg(pl.len().alias("clientes"))
    .with_columns((pl.col("clientes") * 100.0 / pl.col("clientes").sum()).round(2).alias("pct_clientes"))
    .sort("clientes", descending=True)
    .collect()
)`,
        expectedOutput: [
          { estado_postal: 'numerico_5_digitos', clientes: 1711, pct_clientes: 71.29 },
          { estado_postal: 'alfanumerico_ar', clientes: 342, pct_clientes: 14.25 },
          { estado_postal: 'nulo', clientes: 218, pct_clientes: 9.08 },
          { estado_postal: 'truncado_2_chars', clientes: 129, pct_clientes: 5.38 }
        ]
      }
    },
    {
      id: 'parseo-fechas-y-truncado-temporal',
      heading: 'Conversión segura de cadenas a Date y Datetime con .dt',
      body: 'Cortar una cadena con `.str.slice(0, 10)` deja el dato como texto: no impide fechas inexistentes como `"2025-02-30"`, no permite sumar intervalos ni sabe qué día de la semana fue.\n\nPara convertir texto a tipos temporales usa `.str.to_date("%Y-%m-%d", strict=False)` o `.str.to_datetime()`. Con `strict=True` (por defecto), cualquier cadena corrupta detiene el proceso para que no pase desapercibida; con `strict=False`, las cadenas inválidas se convierten en `null` para que puedas auditarlas y aislarlas.\n\nUna vez convertido el valor a `pl.Date` o `pl.Datetime`, el espacio de nombres `.dt` expone operaciones vectorizadas de calendario: `.dt.year()`, `.dt.month()`, `.dt.weekday()`, `.dt.date()` y `.dt.truncate("1d")` o `.dt.truncate("1h")` para agrupar series temporales en intervalos regulares.'
    },
    {
      id: 'zonas-horarias-replace-vs-convert',
      heading: 'Diferencia entre replace_time_zone y convert_time_zone',
      body: 'En datos de múltiples países existen dos tipos de marcas de tiempo: *naive* (sin zona horaria, como `"2025-03-03 22:06:33"`) y *aware* (con desplazamiento o zona IANA, como `"2025-03-03T22:06:33-03:00"`).\n\nPolars separa con precisión dos operaciones que suelen confundirse:\n\n1. `.dt.replace_time_zone("America/Bogota")`: toma una fecha sin zona y le pone la etiqueta de Bogotá **sin cambiar los números del reloj** (`22:06` sigue siendo `22:06`). Úsalo solo cuando sabes en qué huso local grabó el servidor un timestamp huérfano.\n2. `.dt.convert_time_zone("UTC")`: toma un instante que ya tiene zona y **calcula la hora equivalente** en el nuevo huso. Para el evento `"2025-03-03T22:06:33-03:00"` en Buenos Aires, al sumar 3 horas devuelve `"2025-03-04 01:06:33 UTC"`, cambiando incluso al día siguiente.\n\nCuando una columna de texto como `event_ts_raw` mezcla varios desplazamientos (`-06:00`, `-05:00`, `-03:00`, `+01:00`, `Z`), `.str.to_datetime(time_zone="UTC")` realiza la **normalización de zona horaria a UTC** en un solo paso.',
      example: {
        language: 'python',
        code: `import polars as pl

muestra_utc = (
    pl.scan_parquet("public/datasets/events.parquet")
    .filter(pl.col("event_id").is_in(["evt-ord-1", "evt-ord-2", "evt-ord-3", "evt-ord-4", "evt-ord-10"]))
    .with_columns(
        pl.col("event_ts_raw").str.slice(0, 10).alias("fecha_texto_local"),
        pl.col("event_ts_raw")
        .str.to_datetime(time_zone="UTC")
        .dt.strftime("%Y-%m-%d %H:%M:%S UTC")
        .alias("instante_utc"),
    )
    .select(["event_id", "event_ts_raw", "timezone_offset", "fecha_texto_local", "instante_utc"])
    .sort("event_id")
    .collect()
)`,
        expectedOutput: [
          { event_id: 'evt-ord-1', event_ts_raw: '2024-12-01T17:28:43Z', timezone_offset: 'Z', fecha_texto_local: '2024-12-01', instante_utc: '2024-12-01 17:28:43 UTC' },
          { event_id: 'evt-ord-10', event_ts_raw: '2024-08-06T05:30:53+01:00', timezone_offset: '+01:00', fecha_texto_local: '2024-08-06', instante_utc: '2024-08-06 04:30:53 UTC' },
          { event_id: 'evt-ord-2', event_ts_raw: '2023-12-20T00:23:34-06:00', timezone_offset: '-06:00', fecha_texto_local: '2023-12-20', instante_utc: '2023-12-20 06:23:34 UTC' },
          { event_id: 'evt-ord-3', event_ts_raw: '2025-11-08T15:37:59-05:00', timezone_offset: '-05:00', fecha_texto_local: '2025-11-08', instante_utc: '2025-11-08 20:37:59 UTC' },
          { event_id: 'evt-ord-4', event_ts_raw: '2025-03-03T22:06:33-03:00', timezone_offset: '-03:00', fecha_texto_local: '2025-03-03', instante_utc: '2025-03-04 01:06:33 UTC' }
        ]
      }
    },
    {
      id: 'regla-de-oro-almacenar-utc-mostrar-local',
      heading: 'Almacenar en UTC y convertir a zona IANA solo al presentar',
      body: 'Si en Latinoamérica un cliente hace un pedido a las `21:30` hora de Ciudad de México (`-06:00`), en UTC ya son las `03:30` del día siguiente. Por eso debes seguir dos reglas explícitas:\n\n1. En almacenamiento e ingeniería de datos (tablas Parquet, cruces entre `events` y `payments`, marcas de agua), guarda y cruza todos los instantes normalizados en `UTC`.\n2. Cuando construyas un reporte de ventas diarias para la gerencia de una tienda física, convierte de `UTC` a la zona oficial IANA de esa tienda (por ejemplo `America/Mexico_City` o `Europe/Madrid`, nunca un desplazamiento fijo que ignore el horario de verano) antes de extraer `.dt.date()`.'
    }
  ],

  workedExample: {
    title: 'Cuantificación del error por truncar event_ts_raw sin convertir a UTC',
    description: 'Compara en los 65 000 registros de `events.parquet` la fecha obtenida al cortar los primeros 10 caracteres frente a la fecha real en UTC tras parsear cada desplazamiento horario.',
    audit: 'En total, 9 218 eventos (3 666 en -06:00, 3 097 en -05:00, 1 867 en -03:00 y 588 en +01:00) cambian de día calendario al normalizarlos a UTC.',
    steps: [
      {
        label: '1. Antipatrón: extraer la fecha cortando los primeros 10 caracteres del texto',
        explanation: 'Cortar `event_ts_raw.str.slice(0, 10)` ignora el sufijo `-06:00` o `+01:00`: un evento ocurrido a las 22:06 en Buenos Aires (`-03:00`) se queda en el 3 de marzo aunque en UTC ocurrió el 4 de marzo a las 01:06.',
        code: `import polars as pl

# ERROR: truncar la cadena ISO sin interpretar el desplazamiento horario
fechas_ingenuas = (
    pl.scan_parquet("public/datasets/events.parquet")
    .filter(pl.col("event_ts").dt.date() == pl.date(2023, 12, 20))
    .with_columns(
        pl.col("event_ts_raw").str.slice(0, 10).alias("naive_date"),
        pl.col("event_ts_raw").str.to_datetime(time_zone="UTC").dt.date().cast(pl.String).alias("utc_date"),
    )
    .group_by(["naive_date", "utc_date"])
    .agg(pl.len().alias("eventos"))
    .sort("utc_date")
    .collect()
)`,
        expectedOutput: [
          { naive_date: '2023-12-20', utc_date: '2023-12-20', eventos: 51 },
          { naive_date: '2023-12-20', utc_date: '2023-12-21', eventos: 8 }
        ]
      },
      {
        label: '2. Solución verificada: parseo a UTC y auditoría por desplazamiento en los 65 000 eventos',
        explanation: 'Convertimos `event_ts_raw` con `.str.to_datetime(time_zone="UTC")` y medimos en cada huso horario cuántos eventos cambian de fecha calendario al pasar a UTC.',
        code: `import polars as pl

desfase_por_huso = (
    pl.scan_parquet("public/datasets/events.parquet")
    .with_columns(
        pl.col("event_ts_raw").str.slice(0, 10).str.to_date("%Y-%m-%d").alias("fecha_local_txt"),
        pl.col("event_ts_raw").str.to_datetime(time_zone="UTC").dt.date().alias("fecha_utc"),
    )
    .group_by("timezone_offset")
    .agg(
        pl.len().alias("total_events"),
        (pl.col("fecha_local_txt") != pl.col("fecha_utc")).sum().alias("shifted_day_in_utc"),
    )
    .sort("timezone_offset")
    .collect()
)`,
        expectedOutput: [
          { timezone_offset: '+01:00', total_events: 13000, shifted_day_in_utc: 588 },
          { timezone_offset: '-03:00', total_events: 13000, shifted_day_in_utc: 1867 },
          { timezone_offset: '-05:00', total_events: 13000, shifted_day_in_utc: 3097 },
          { timezone_offset: '-06:00', total_events: 13000, shifted_day_in_utc: 3666 },
          { timezone_offset: 'Z', total_events: 13000, shifted_day_in_utc: 0 }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'predict-output',
      prompt: 'El evento `evt-ord-4` de Mercado Brisa tiene `event_ts_raw = "2025-03-03T22:06:33-03:00"`. ¿Qué fecha devuelve `pl.col("event_ts_raw").str.to_datetime(time_zone="UTC").dt.date()`?',
      options: [
        {
          id: 'a',
          text: '2025-03-04 (al sumar 3 horas para llevar `-03:00` a UTC, el instante pasa a las 01:06:33 del 4 de marzo).',
          correct: true,
          feedback: 'Exacto. Las 22:06 del 3 de marzo en huso -03:00 corresponden a las 01:06 del 4 de marzo en UTC.'
        },
        {
          id: 'b',
          text: '2025-03-03 (porque siempre conserva los primeros 10 caracteres de la cadena).',
          correct: false,
          feedback: 'Incorrecto. Al normalizar a UTC el instante cruza la medianoche y cambia de fecha calendario.'
        },
        {
          id: 'c',
          text: '2025-03-02 (porque resta 3 horas y retrocede al día anterior).',
          correct: false,
          feedback: 'Incorrecto. Un desplazamiento `-03:00` está 3 horas por detrás de UTC, por lo que para llegar a UTC se suman 3 horas.'
        }
      ],
      explanation: 'Cuando una marca temporal local está en `-03:00` (`UTC = hora_local + 3h`), cualquier evento ocurrido a partir de las 21:00 locales pertenece ya al día siguiente en UTC.'
    },
    {
      id: 'c2',
      type: 'mcq',
      prompt: 'Tienes una columna `Datetime` que ya está en `"UTC"` y quieres saber a qué hora local ocurrió cada venta en la tienda de Madrid (`"Europe/Madrid"`). ¿Qué método de Polars debes usar?',
      options: [
        {
          id: 'a',
          text: '.dt.convert_time_zone("Europe/Madrid")',
          correct: true,
          feedback: 'Correcto. `convert_time_zone` mantiene el mismo instante físico y ajusta la hora del reloj al huso de Madrid (incluyendo horario de invierno +01:00 o verano +02:00).'
        },
        {
          id: 'b',
          text: '.dt.replace_time_zone("Europe/Madrid")',
          correct: false,
          feedback: 'Incorrecto. `replace_time_zone` sobrescribe la etiqueta de zona sin ajustar las horas, desplazando el instante real.'
        },
        {
          id: 'c',
          text: '.cast(pl.String).str.slice(0, 10)',
          correct: false,
          feedback: 'Incorrecto. Cortar el texto en UTC no convierte la hora al huso horario de Madrid.'
        }
      ],
      explanation: 'Usa `replace_time_zone` únicamente para asignarle su zona de origen a una fecha que no tenía ninguna; para cambiar de una zona a otra usa siempre `convert_time_zone`.'
    },
    {
      id: 'c3',
      type: 'mcq',
      prompt: 'En la columna `postal_code` de `customers` quieres quitar espacios al inicio y al final y luego medir cuántos caracteres tiene cada código. ¿Qué combinación de expresiones en Polars 2.0 realiza esto?',
      options: [
        {
          id: 'a',
          text: 'pl.col("postal_code").str.strip_chars().str.len_chars()',
          correct: true,
          feedback: 'Exacto. `.str.strip_chars()` recorta los espacios exteriores y `.str.len_chars()` devuelve el número de caracteres de cada cadena.'
        },
        {
          id: 'b',
          text: 'pl.col("postal_code").trim().length()',
          correct: false,
          feedback: 'Incorrecto. En Polars las funciones de cadenas se agrupan dentro del espacio de nombres `.str` (`strip_chars` y `len_chars`).'
        },
        {
          id: 'c',
          text: 'len(df["postal_code"])',
          correct: false,
          feedback: 'Incorrecto. `len()` sobre una columna devuelve el número total de filas de la tabla (2 400), no la longitud de cada código postal.'
        }
      ],
      explanation: 'El espacio de nombres `.str` aplica operaciones de texto elemento a elemento sobre el búfer columnar de Arrow sin usar bucles en Python.'
    },
    {
      id: 'c4',
      type: 'mcq',
      prompt: '¿Qué ocurre al ejecutar `pl.col("fecha_txt").str.to_date("%Y-%m-%d", strict=False)` si 3 de las 10 000 filas contienen el texto `"PENDIENTE"`?',
      options: [
        {
          id: 'a',
          text: 'Convierte las 9 997 fechas válidas al tipo `pl.Date` y asigna `null` a las 3 filas con `"PENDIENTE"` sin abortar el proceso.',
          correct: true,
          feedback: 'Correcto. Con `strict=False`, los valores que no cumplen el formato se transforman en `null`, permitiendo contarlos y filtrarlos después.'
        },
        {
          id: 'b',
          text: 'Reemplaza las 3 filas por la fecha actual del sistema.',
          correct: false,
          feedback: 'Incorrecto. Polars nunca inventa fechas; si el parseo no es estricto, marca el valor como `null`.'
        },
        {
          id: 'c',
          text: 'Deja las 10 000 filas como texto sin convertir ninguna.',
          correct: false,
          feedback: 'Incorrecto. La columna resultante sí cambia al tipo `pl.Date`.'
        }
      ],
      explanation: 'Usar `strict=False` seguido de un conteo `.is_null().sum()` te permite auditar cuántas filas traen fechas corruptas antes de decidir si descartarlas o enviarlas a cuarentena.'
    }
  ],

  practice: {
    type: 'fill-blanks',
    title: 'Normalización de event_ts_raw a UTC y limpieza de cadenas en Polars',
    language: 'python',
    prompt: 'Completa el código en Polars 2.0 para: 1) Recortar espacios y pasar `event_type` a minúsculas con `.str`, 2) Parsear `event_ts_raw` normalizando todos los desplazamientos a `"UTC"`, y 3) Contar cuántos eventos por `timezone_offset` cambian de día calendario.',
    starterCode: `import polars as pl

auditoria_tz = (
    pl.scan_parquet("public/datasets/events.parquet")
    .with_columns(
        pl.col("event_type").str.{{blank_1}}().str.to_lowercase().alias("event_type_clean"),
        pl.col("event_ts_raw").str.slice(0, 10).str.to_date("%Y-%m-%d").alias("fecha_local_txt"),
        pl.col("event_ts_raw").str.{{blank_2}}(time_zone="UTC").dt.{{blank_3}}().alias("fecha_utc"),
    )
    .group_by("timezone_offset")
    .agg(
        pl.len().alias("total_events"),
        (pl.col("fecha_local_txt") != pl.col("fecha_utc")).sum().alias("shifted_day_in_utc"),
    )
    .sort("timezone_offset")
    .collect()
)`,
    expected: `import polars as pl

auditoria_tz = (
    pl.scan_parquet("public/datasets/events.parquet")
    .with_columns(
        pl.col("event_type").str.strip_chars().str.to_lowercase().alias("event_type_clean"),
        pl.col("event_ts_raw").str.slice(0, 10).str.to_date("%Y-%m-%d").alias("fecha_local_txt"),
        pl.col("event_ts_raw").str.to_datetime(time_zone="UTC").dt.date().alias("fecha_utc"),
    )
    .group_by("timezone_offset")
    .agg(
        pl.len().alias("total_events"),
        (pl.col("fecha_local_txt") != pl.col("fecha_utc")).sum().alias("shifted_day_in_utc"),
    )
    .sort("timezone_offset")
    .collect()
)`,
    orderMatters: true,
    hints: [
      'En Polars, el método de `.str` para eliminar espacios en blanco al principio y al final se llama `strip_chars`.',
      'Para convertir cadenas ISO-8601 con hora y zona horaria a un tipo `Datetime`, usa `to_datetime`.',
      'Una vez tienes una expresión `Datetime` en el espacio `.dt`, extrae el día calendario con `date`.'
    ],
    solution: `import polars as pl

auditoria_tz = (
    pl.scan_parquet("public/datasets/events.parquet")
    .with_columns(
        pl.col("event_type").str.strip_chars().str.to_lowercase().alias("event_type_clean"),
        pl.col("event_ts_raw").str.slice(0, 10).str.to_date("%Y-%m-%d").alias("fecha_local_txt"),
        pl.col("event_ts_raw").str.to_datetime(time_zone="UTC").dt.date().alias("fecha_utc"),
    )
    .group_by("timezone_offset")
    .agg(
        pl.len().alias("total_events"),
        (pl.col("fecha_local_txt") != pl.col("fecha_utc")).sum().alias("shifted_day_in_utc"),
    )
    .sort("timezone_offset")
    .collect()
)`,
    solutionExplanation: 'Limpia el texto con `.str.strip_chars()`, unifica los 5 husos horarios a UTC con `.str.to_datetime(time_zone="UTC")` y extrae la fecha canónica con `.dt.date()`.',
    blanks: [
      {
        id: 'blank_1',
        label: 'Método .str para recortar espacios',
        correct: 'strip_chars',
        options: ['strip_chars', 'trim_spaces', 'clean_str'],
        hint: 'Elimina caracteres de espacio al inicio y al final de cada cadena en Polars.'
      },
      {
        id: 'blank_2',
        label: 'Conversión de cadena a Datetime con zona',
        correct: 'to_datetime',
        options: ['to_datetime', 'parse_int', 'as_timezone'],
        hint: 'Interpreta cadenas ISO-8601 y normaliza los desplazamientos al huso indicado en time_zone.'
      },
      {
        id: 'blank_3',
        label: 'Extracción de fecha calendario desde .dt',
        correct: 'date',
        options: ['date', 'day_name', 'epoch_ms'],
        hint: 'Convierte un Datetime al tipo Date (YYYY-MM-DD) dentro de su zona horaria actual.'
      }
    ],
    expectedOutputTable: [
      { timezone_offset: '+01:00', total_events: 13000, shifted_day_in_utc: 588 },
      { timezone_offset: '-03:00', total_events: 13000, shifted_day_in_utc: 1867 },
      { timezone_offset: '-05:00', total_events: 13000, shifted_day_in_utc: 3097 },
      { timezone_offset: '-06:00', total_events: 13000, shifted_day_in_utc: 3666 },
      { timezone_offset: 'Z', total_events: 13000, shifted_day_in_utc: 0 }
    ]
  },

  roleNotes: {
    de: 'En tablas Parquet e Iceberg almacena siempre las marcas de tiempo como `Datetime("us", "UTC")` (`TIMESTAMPTZ`). Si un productor envía cadenas con desplazamientos variables como `event_ts_raw`, normalízalas a UTC en la ingesta antes de particionar por fecha.',
    da: 'Cuando cruces eventos de navegación (`events`) con cobros (`payments`) o sesiones, asegúrate de que ambas columnas estén en UTC. Si agrupas conversiones diarias para una campaña en México o Colombia, convierte primero a la zona IANA local (`convert_time_zone("America/Mexico_City")`) y luego aplica `.dt.date()`.',
    bi: 'Documenta en cada tablero si el corte diario de ventas cierra a medianoche UTC o en la hora local de cada tienda. Una discrepancia de huso horario mueve el 14 % de los eventos nocturnos al día siguiente y genera falsas diferencias frente al cierre contable.'
  },

  summary: [
    'El espacio de nombres .str limpia espacios, unifica mayúsculas y valida longitudes sobre búferes Arrow.',
    'Truncar cadenas ISO con .str.slice(0, 10) ignora el huso horario y desplaza eventos nocturnos de fecha.',
    'replace_time_zone asigna etiqueta a una hora sin zona; convert_time_zone traduce el instante a otro huso.',
    'Almacena y cruza todas las marcas de tiempo en UTC y convierte a zonas IANA solo al presentar.'
  ],

  flashcards: [
    {
      id: 'fc-c1-py-04-a',
      front: '¿Por qué es un error obtener la fecha diaria con `pl.col("event_ts_raw").str.slice(0, 10)` cuando hay varios husos horarios?',
      back: 'Porque ignora el desplazamiento (`-06:00`, `-03:00`, `+01:00`) y mezcla fechas locales distintas sin llevarlas primero a un mismo instante UTC.'
    },
    {
      id: 'fc-c1-py-04-b',
      front: '¿Cuál es la diferencia entre `.dt.replace_time_zone("UTC")` y `.dt.convert_time_zone("UTC")`?',
      back: '`replace_time_zone` etiqueta una fecha sin zona conservando la misma hora del reloj; `convert_time_zone` ajusta la hora de un timestamp que ya tenía zona.'
    },
    {
      id: 'fc-c1-py-04-c',
      front: '¿Por qué debes preferir nombres IANA (`America/Mexico_City`, `Europe/Madrid`) sobre desplazamientos fijos (`-06:00`, `+01:00`) al reportar?',
      back: 'Porque la base de datos IANA conoce las reglas históricas y vigentes de cambio de horario de verano e invierno de cada región.'
    },
    {
      id: 'fc-c1-py-04-d',
      front: '¿Qué diferencia hay entre `.str.len_chars()` y `.str.len_bytes()` en Polars sobre texto en español?',
      back: '`len_chars()` cuenta caracteres reales (en `"Café"` devuelve 4), mientras `len_bytes()` cuenta bytes UTF-8 (en `"Café"` devuelve 5 por la tilde).'
    }
  ],

  glossaryTerms: [
    'normalizacion-utc-tz',
    'pyarrow-string-dtype',
    'polars-expresion-columnar'
  ],

  sources: [
    {
      title: 'Polars User Guide — Strings (Expr.str) and Regular Expressions',
      url: 'https://docs.pola.rs/user-guide/expressions/strings/',
      publisher: 'Polars Project',
      accessed: '2026-10-29',
      supports: 'Operaciones vectorizadas strip_chars, to_uppercase, len_chars y contains sobre arrays UTF-8.'
    },
    {
      title: 'Polars User Guide — Time Zones and Temporal Operations (Expr.dt)',
      url: 'https://docs.pola.rs/user-guide/expressions/time-series/#time-zones',
      publisher: 'Polars Project',
      accessed: '2026-10-29',
      supports: 'Parseo con str.to_datetime(time_zone="UTC") y diferencia entre replace_time_zone y convert_time_zone.'
    },
    {
      title: 'Python 3.13 Standard Library — zoneinfo: IANA Time Zone Support',
      url: 'https://docs.python.org/3/library/zoneinfo.html',
      publisher: 'Python Software Foundation',
      accessed: '2026-10-29',
      supports: 'Uso de identificadores de zona horaria IANA en el estándar de Python.'
    }
  ],

  aiNotes: 'El error más común es usar `replace_time_zone("UTC")` sobre una hora local pensando que la convertirá a UTC, o usar `convert_time_zone` sobre una columna `Datetime` sin zona (lo cual lanza error porque Polars no sabe desde qué huso partir). Recalca siempre ese par de reglas.'
};

export default lesson;
