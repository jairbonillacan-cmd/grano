const lesson = {
  id: 'c0-hojas-04-errores-fechas-celdas',
  moduleId: 'c0-hojas',
  tracks: ['core'],
  level: 0,
  order: 4,
  title: 'Errores frecuentes: fechas como texto y celdas combinadas',
  minutes: 15,
  prerequisites: ['c0-hojas-03-buscarx-cruces'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), logística recibe un archivo de eventos donde las fechas mezclan cinco zonas horarias como texto (`event_ts_raw`) y una hoja de clientes donde alguien combinó celdas o dejó códigos postales en blanco (`218` filas con `NULL`) y truncados a dos caracteres (`129` filas). Al ordenar las fechas como texto, el 2 de diciembre aparece antes que el 15 de enero, y al filtrar por código postal desaparece el 14,46 % de los clientes. ¿Cómo se detectan y corrigen estos dos errores de captura?',

  objectives: [
    'Identificar cuándo una fecha está guardada como texto en una hoja de cálculo y por qué el estándar ISO 8601 (`YYYY-MM-DD`) evita errores de orden y región.',
    'Explicar por qué combinar celdas borra los valores de las filas inferiores convirtiéndolos en `NULL` al filtrar o exportar a SQL.',
    'Auditar en SQL columnas con celdas vacías (`IS NULL`), textos truncados (`LENGTH`) y marcas de tiempo en texto crudo (`event_ts_raw`).'
  ],

  sections: [
    {
      id: 'fechas-como-texto-y-formato-iso',
      heading: 'Fechas guardadas como texto frente a números de serie e ISO 8601',
      body: 'En una hoja de cálculo, una fecha real es un número entero que cuenta los días desde enero de 1900. Por ser numérica, se alinea a la derecha de la celda. Cuando importas un CSV con `"04/03/2025"`, un equipo en España lee 4 de marzo y otro en Estados Unidos lee 3 de abril. Si la fecha entra como texto (alineada a la izquierda), el ordenamiento compara letra por letra. Así, `"02/12/2025"` queda colocado antes que `"15/01/2025"`.\n\nPara evitar este problema, escribe y exporta siempre con el estándar **fecha en formato ISO 8601**: `YYYY-MM-DD` (como `2025-03-04`). Al ir de año a mes y día, ninguna región invierte los valores. Además, el orden alfabético coincide siempre con el orden cronológico.'
    },
    {
      id: 'marcas-de-tiempo-crudas-y-zonas-horarias',
      heading: 'Qué ocurre cuando mezclas zonas horarias en cadenas de texto',
      body: 'El problema de las fechas como texto empeora cuando registras hora y minuto desde varios países. En la tabla `events` de Mercado Brisa (`65.000` filas), la columna `event_ts_raw` guarda el texto crudo enviado por el navegador. Ese campo mezcla cinco zonas horarias distintas: `-06:00` en México, `-05:00` en Colombia y Perú, `-03:00` en Chile y Argentina, `+01:00` en España y `Z` en servidores UTC.\n\nSi recortas los primeros caracteres en una hoja sin leer el sufijo horario, mezclas cinco relojes distintos. Comparas horas locales diferentes como si hubieran ocurrido al mismo instante. Por eso los motores analíticos convierten el texto crudo a una marca de tiempo en UTC (`event_ts`) antes de agrupar.',
      example: {
        language: 'sql',
        code: `SELECT
  timezone_offset,
  COUNT(*) AS total_eventos,
  MIN(event_ts_raw) AS muestra_texto_crudo,
  CAST(MIN(event_ts) AS VARCHAR) AS muestra_utc_normalizada
FROM events
GROUP BY timezone_offset
ORDER BY timezone_offset;`,
        expectedOutput: [
          {
            timezone_offset: '+01:00',
            total_eventos: 13000,
            muestra_texto_crudo: '2023-01-01T01:37:15+01:00',
            muestra_utc_normalizada: '2023-01-01 01:37:15'
          },
          {
            timezone_offset: '-03:00',
            total_eventos: 13000,
            muestra_texto_crudo: '2023-01-01T00:14:03-03:00',
            muestra_utc_normalizada: '2023-01-01 00:14:03'
          },
          {
            timezone_offset: '-05:00',
            total_eventos: 13000,
            muestra_texto_crudo: '2023-01-01T01:35:05-05:00',
            muestra_utc_normalizada: '2023-01-01 01:35:05'
          },
          {
            timezone_offset: '-06:00',
            total_eventos: 13000,
            muestra_texto_crudo: '2023-01-01T01:48:22-06:00',
            muestra_utc_normalizada: '2023-01-01 01:48:22'
          },
          {
            timezone_offset: 'Z',
            total_eventos: 13000,
            muestra_texto_crudo: '2023-01-01T09:31:04Z',
            muestra_utc_normalizada: '2023-01-01 09:31:04'
          }
        ]
      }
    },
    {
      id: 'peligro-de-las-celdas-combinadas',
      heading: 'Por qué las celdas combinadas vacían tus datos y rompen los filtros',
      body: 'Combinar celdas verticalmente para centrar el nombre de una región junto a varias filas daña la tabla. Cuando aplicas **celdas combinadas** sobre el rango `A2:A5`, la hoja conserva el valor solo en la celda superior izquierda (`A2`). El contenido de `A3`, `A4` y `A5` se borra por completo.\n\nEn cuanto filtras por esa columna, creas una tabla dinámica o exportas a CSV o Parquet, las filas `3`, `4` y `5` llegan como `NULL`. Esos registros quedan fuera del análisis sin dar aviso. Nunca combines celdas en una tabla de datos: repite el valor en cada fila para que cada registro esté completo.'
    }
  ],

  workedExample: {
    title: 'Conteo ingenuo de códigos postales frente a auditoría de vacíos y truncados',
    description: 'Observa en la tabla `customers` (`2.400` clientes) cómo `COUNT(postal_code)` ignora en silencio las celdas vacías (`NULL`) y no detecta los códigos postales truncados a 2 caracteres durante la captura en hoja de cálculo:',
    steps: [
      {
        label: 'Enfoque con error: contar la columna sin auditar nulos ni longitud del texto',
        explanation: 'En SQL, `COUNT(postal_code)` cuenta las 2.182 celdas no vacías e ignora las 218 celdas `NULL`, además de dar por válidos 129 códigos postales incompletos de solo 2 caracteres.',
        code: `SELECT
  COUNT(*) AS total_clientes,
  COUNT(postal_code) AS celdas_no_vacias,
  COUNT(*) - COUNT(postal_code) AS celdas_vacias_ignoradas
FROM customers;`,
        expectedOutput: [
          {
            total_clientes: 2400,
            celdas_no_vacias: 2182,
            celdas_vacias_ignoradas: 218
          }
        ]
      },
      {
        label: 'Solución verificada: clasificar celdas vacías (NULL), truncadas y completas',
        explanation: 'Con una expresión `CASE WHEN` que evalúa primero `postal_code IS NULL` y luego `LENGTH(TRIM(postal_code)) <= 2`, cuantificamos exactamente el 9,08 % de celdas vacías y el 5,38 % de códigos truncados.',
        code: `SELECT
  CASE
    WHEN postal_code IS NULL THEN '1. Vacío (NULL por celda sin rellenar)'
    WHEN LENGTH(TRIM(postal_code)) <= 2 THEN '2. Truncado (<= 2 caracteres)'
    ELSE '3. Código postal completo'
  END AS diagnostico_captura,
  COUNT(*) AS clientes,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) AS porcentaje_clientes
FROM customers
GROUP BY 1
ORDER BY 1;`,
        expectedOutput: [
          {
            diagnostico_captura: '1. Vacío (NULL por celda sin rellenar)',
            clientes: 218,
            porcentaje_clientes: 9.08
          },
          {
            diagnostico_captura: '2. Truncado (<= 2 caracteres)',
            clientes: 129,
            porcentaje_clientes: 5.38
          },
          {
            diagnostico_captura: '3. Código postal completo',
            clientes: 2053,
            porcentaje_clientes: 85.54
          }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'chk-c0-hojas-04-celdas-combinadas',
      type: 'predict-output',
      prompt: 'En una hoja de tiendas, un analista escribe `"Andina"` en `A2` y combina el rango `A2:A4` para abarcar las 3 tiendas de esa región. Si luego filtra la columna `A` por `"Andina"` o exporta la hoja a una tabla SQL, ¿cuántas tiendas aparecen con `region = \'Andina\'`?',
      options: [
        {
          id: 'a',
          text: 'Solo 1 tienda (la de la fila 2), porque al combinar `A2:A4` las celdas `A3` y `A4` quedan vacías (`NULL`).',
          correct: true,
          feedback: 'Exacto. Combinar celdas conserva el dato solo en la esquina superior izquierda y vacía el resto de las celdas del bloque.'
        },
        {
          id: 'b',
          text: 'Las 3 tiendas, porque la hoja copia internamente `"Andina"` en `A3` y `A4`.',
          correct: false,
          feedback: 'Incorrecto. La combinación es puramente visual: las celdas `A3` y `A4` quedan vacías en memoria y al exportar.'
        },
        {
          id: 'c',
          text: 'Ninguna tienda, porque las celdas combinadas borran todas las filas de la hoja.',
          correct: false,
          feedback: 'Incorrecto. La primera fila (`A2`) sí conserva el valor `"Andina"`, mientras que `A3` y `A4` pierden el suyo.'
        }
      ],
      explanation: 'Al combinar un rango de celdas como `A2:A4`, solo `A2` guarda el valor y `A3:A4` quedan vacías. Para que los filtros, tablas dinámicas y consultas SQL funcionen, cada fila debe repetir explícitamente el valor.'
    },
    {
      id: 'chk-c0-hojas-04-fecha-texto',
      type: 'mcq',
      prompt: 'Importas tres fechas como texto (`"15/01/2025"`, `"02/12/2025"` y `"20/05/2025"`) sin convertirlas a fecha real ni usar ISO 8601. Si ordenas la columna de menor a mayor (A → Z), ¿qué fecha queda en primer lugar?',
      options: [
        {
          id: 'a',
          text: '"02/12/2025", porque al ordenar texto compara primero el primer carácter (`"0"` va antes que `"1"` y `"2"`).',
          correct: true,
          feedback: 'Correcto. El orden alfabético evalúa carácter por carácter de izquierda a derecha, colocando diciembre (`02/...`) antes que enero (`15/...`).'
        },
        {
          id: 'b',
          text: '"15/01/2025", porque enero es el primer mes del año.',
          correct: false,
          feedback: 'Incorrecto. Cuando las fechas son cadenas de texto con formato `DD/MM/YYYY`, la hoja no sabe que `/01/` es enero.'
        },
        {
          id: 'c',
          text: 'Con el formato `YYYY-MM-DD` también quedaría diciembre antes que enero.',
          correct: false,
          feedback: 'Incorrecto. En formato ISO (`2025-01-15`, `2025-05-20`, `2025-12-02`), el orden alfabético coincide con el cronológico.'
        }
      ],
      explanation: 'Cuando una fecha se almacena como texto en formato `DD/MM/YYYY`, el ordenamiento compara primero el día (`"02"` < `"15"`). El formato ISO 8601 (`YYYY-MM-DD`) ordena año, luego mes y luego día sin ambigüedad.'
    },
    {
      id: 'chk-c0-hojas-04-senal-visual',
      type: 'mcq',
      prompt: 'Sin cambiar la alineación manual de la hoja de cálculo, ¿qué pista visual rápida te indica que una celda con `"2025-03-04"` fue guardada como texto en lugar de como fecha numérica real?',
      options: [
        {
          id: 'a',
          text: 'El texto se alinea por defecto a la izquierda de la celda, mientras que las fechas y números reales se alinean a la derecha.',
          correct: true,
          feedback: 'Exacto. Por defecto, toda hoja de cálculo alinea el texto a la izquierda y los números (incluidas las fechas reales) a la derecha.'
        },
        {
          id: 'b',
          text: 'Las fechas reales se ponen en letra cursiva automáticamente y el texto en negrita.',
          correct: false,
          feedback: 'Incorrecto. El tipo de dato no aplica cursiva ni negrita; la diferencia visual por defecto es la alineación izquierda frente a derecha.'
        },
        {
          id: 'c',
          text: 'No existe ninguna diferencia: para la hoja de cálculo una fecha y un texto son el mismo tipo de dato.',
          correct: false,
          feedback: 'Incorrecto. Una fecha real es un número de serie con el que puedes restar días, mientras que una cadena de texto no permite aritmética de fechas.'
        }
      ],
      explanation: 'Las hojas de cálculo alinean por defecto las cadenas de texto a la izquierda y los valores numéricos (incluidas las fechas almacenadas como número de serie) a la derecha.'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Auditar celdas vacías y códigos postales truncados por país',
    language: 'sql',
    prompt: 'Audita la calidad de captura de `postal_code` en la tabla `customers` agrupando por `country_code`: calcula `total_clientes` (`COUNT(*)`), `celdas_vacias` (`SUM(CASE WHEN postal_code IS NULL THEN 1 ELSE 0 END)`), `codigos_truncados` (`SUM(CASE WHEN postal_code IS NOT NULL AND LENGTH(TRIM(postal_code)) <= 2 THEN 1 ELSE 0 END)`) y `codigos_completos` (`SUM(CASE WHEN postal_code IS NOT NULL AND LENGTH(TRIM(postal_code)) > 2 THEN 1 ELSE 0 END)`), ordenando por `total_clientes DESC` y `country_code ASC`.',
    starterCode: `SELECT
  country_code,
  COUNT(*) AS total_clientes,
  SUM(CASE WHEN postal_code IS NULL
    THEN 1 ELSE 0 END) AS celdas_vacias,
  -- Cuenta codigos_truncados cuando LENGTH(TRIM(postal_code)) <= 2
  0 AS codigos_truncados,
  SUM(CASE WHEN postal_code IS NOT NULL
    AND LENGTH(TRIM(postal_code)) > 2
    THEN 1 ELSE 0 END) AS codigos_completos
FROM customers
GROUP BY country_code
ORDER BY total_clientes DESC, country_code ASC;`,
    expected: `SELECT
  country_code,
  COUNT(*) AS total_clientes,
  SUM(CASE WHEN postal_code IS NULL THEN 1 ELSE 0 END) AS celdas_vacias,
  SUM(CASE WHEN postal_code IS NOT NULL AND LENGTH(TRIM(postal_code)) <= 2 THEN 1 ELSE 0 END) AS codigos_truncados,
  SUM(CASE WHEN postal_code IS NOT NULL AND LENGTH(TRIM(postal_code)) > 2 THEN 1 ELSE 0 END) AS codigos_completos
FROM customers
GROUP BY country_code
ORDER BY total_clientes DESC, country_code ASC;`,
    orderMatters: true,
    hints: [
      'Reemplaza `0 AS codigos_truncados` por `SUM(CASE WHEN postal_code IS NOT NULL AND LENGTH(TRIM(postal_code)) <= 2 THEN 1 ELSE 0 END) AS codigos_truncados`.',
      'Observa que en cada país `celdas_vacias + codigos_truncados + codigos_completos` debe sumar exactamente `400` (`total_clientes`).',
      'Mantén el `GROUP BY country_code` y el `ORDER BY total_clientes DESC, country_code ASC`.'
    ],
    solution: `SELECT
  country_code,
  COUNT(*) AS total_clientes,
  SUM(CASE WHEN postal_code IS NULL THEN 1 ELSE 0 END) AS celdas_vacias,
  SUM(CASE WHEN postal_code IS NOT NULL AND LENGTH(TRIM(postal_code)) <= 2 THEN 1 ELSE 0 END) AS codigos_truncados,
  SUM(CASE WHEN postal_code IS NOT NULL AND LENGTH(TRIM(postal_code)) > 2 THEN 1 ELSE 0 END) AS codigos_completos
FROM customers
GROUP BY country_code
ORDER BY total_clientes DESC, country_code ASC;`,
    solutionExplanation: 'Separar explícitamente `IS NULL` (celdas dejadas en blanco o combinadas) de `LENGTH(TRIM(postal_code)) <= 2` (textos recortados o ceros a la izquierda perdidos) permite cuantificar cada defecto de captura por país antes de publicar un reporte.',
    expectedOutputTable: [
      {
        country_code: 'AR',
        total_clientes: 400,
        celdas_vacias: 36,
        codigos_truncados: 22,
        codigos_completos: 342
      },
      {
        country_code: 'CL',
        total_clientes: 400,
        celdas_vacias: 36,
        codigos_truncados: 21,
        codigos_completos: 343
      },
      {
        country_code: 'CO',
        total_clientes: 400,
        celdas_vacias: 36,
        codigos_truncados: 21,
        codigos_completos: 343
      },
      {
        country_code: 'ES',
        total_clientes: 400,
        celdas_vacias: 37,
        codigos_truncados: 22,
        codigos_completos: 341
      },
      {
        country_code: 'MX',
        total_clientes: 400,
        celdas_vacias: 36,
        codigos_truncados: 21,
        codigos_completos: 343
      },
      {
        country_code: 'PE',
        total_clientes: 400,
        celdas_vacias: 37,
        codigos_truncados: 22,
        codigos_completos: 341
      }
    ]
  },

  roleNotes: {
    de: 'Los códigos postales (`postal_code`), teléfonos y códigos SKU deben declararse siempre como texto (`VARCHAR`), nunca como enteros, porque el tipo numérico borra los ceros a la izquierda (convirtiendo `"08001"` en `8001`).',
    da: 'Cuando recibas una hoja con celdas combinadas, descombínalas primero y rellena hacia abajo el valor superior antes de importar el archivo a DuckDB, Python o una tabla dinámica.',
    bi: 'En Power Query y Power BI, el paso que corrige una columna con celdas combinadas en el Excel de origen es la transformación "Rellenar hacia abajo" (*Fill Down*) sobre los valores `null`.'
  },

  summary: [
    'Las fechas reales se guardan como números alineados a la derecha; el texto se alinea a la izquierda.',
    'Escribe las fechas en formato ISO 8601 (`YYYY-MM-DD`) para evitar confusiones entre día y mes.',
    'Combinar celdas conserva solo el valor superior izquierdo y convierte el resto del bloque en `NULL`.',
    'Guarda los códigos postales como texto (`VARCHAR`) y audita vacíos (`IS NULL`) y longitudes (`LENGTH`).'
  ],

  flashcards: [
    {
      id: 'fc-c0-hojas-04-a',
      front: '¿Por qué el formato de fecha ISO 8601 (`YYYY-MM-DD`) es superior a `DD/MM/YYYY` o `MM/DD/YYYY` al intercambiar datos?',
      back: 'Porque elimina la ambigüedad regional entre día y mes y hace que el orden alfabético coincida exactamente con el orden cronológico.'
    },
    {
      id: 'fc-c0-hojas-04-b',
      front: '¿Qué les ocurre en memoria a las celdas `A3`, `A4` y `A5` cuando combinas el rango `A2:A5` en una hoja de cálculo?',
      back: 'Pierden su contenido y quedan vacías (`NULL`), conservándose únicamente el valor de la celda superior izquierda (`A2`).'
    },
    {
      id: 'fc-c0-hojas-04-c',
      front: '¿Por qué un código postal como `"01000"` o `"08001"` nunca debe guardarse en una columna de tipo entero?',
      back: 'Porque los tipos numéricos descartan los ceros a la izquierda y truncan el código postal a `"1000"` u `"8001"`.'
    }
  ],

  glossaryTerms: [
    'c0-hojas-fecha-iso',
    'c0-hojas-celdas-combinadas'
  ],

  sources: [
    {
      title: 'Data Organization in Spreadsheets (Karl W. Broman & Kara H. Woo)',
      url: 'https://kbroman.org/dataorg/',
      publisher: 'The American Statistician / kbroman.org',
      accessed: '2026-10-29',
      supports: 'Reglas de no combinar celdas, no dejar celdas vacías por repetición y usar fechas YYYY-MM-DD.'
    },
    {
      title: 'Convert dates stored as text to dates',
      url: 'https://support.microsoft.com/en-us/office/convert-dates-stored-as-text-to-dates-8df7663e-98e6-4295-96e4-32a67ec0a680',
      publisher: 'Microsoft Support',
      accessed: '2026-10-29',
      supports: 'Detección de fechas almacenadas como texto (alineación izquierda) y conversión a número de serie.'
    },
    {
      title: 'Merge and unmerge cells in Excel',
      url: 'https://support.microsoft.com/en-us/office/merge-and-unmerge-cells-5cbd15d5-9375-4540-907f-c673a93fcedf',
      publisher: 'Microsoft Support',
      accessed: '2026-10-29',
      supports: 'Conservación exclusiva del valor superior izquierdo al combinar celdas y pérdida del resto del rango.'
    },
    {
      title: 'RFC 3339: Date and Time on the Internet: Timestamps (ISO 8601 Profile)',
      url: 'https://datatracker.ietf.org/doc/html/rfc3339',
      publisher: 'IETF',
      accessed: '2026-10-29',
      supports: 'Estándar internacional YYYY-MM-DD y marcas de tiempo con sufijo de zona horaria explícito.'
    }
  ],

  aiNotes: 'Las personas que empiezan suelen combinar celdas por estética sin saber que las filas inferiores quedan en `NULL`, o intentan guardar códigos postales como números enteros perdiendo el cero inicial. Ayúdalas a distinguir el formato visual (que va en la tabla dinámica o reporte) de la tabla de datos crudos (donde cada celda debe tener su valor explícito).'
};

export default lesson;
