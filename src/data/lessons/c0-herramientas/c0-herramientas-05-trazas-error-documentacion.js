const lesson = {
  id: 'c0-herramientas-05-trazas-error-documentacion',
  moduleId: 'c0-herramientas',
  tracks: ['core'],
  level: 0,
  order: 5,
  title: 'Cómo leer trazas de error y buscar en documentación oficial',
  minutes: 15,
  prerequisites: ['c0-herramientas-04-cuadernos-jupyter-marimo'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), un analista escribe un script para contar cuántos de los 2 400 clientes de `customers.parquet` tienen el código postal truncado a 2 caracteres. Al ejecutarlo, la terminal imprime quince líneas de texto técnico que terminan en `TypeError: object of type \'NoneType\' has no len()`. En lugar de leer el mensaje, empieza a borrar líneas al azar durante una hora. ¿Cómo encuentras en diez segundos la línea exacta que falló y el motivo real del error?',

  objectives: [
    'Leer una traza de error (traceback) de abajo hacia arriba identificando la excepción, el archivo propio y el número de línea.',
    'Distinguir las causas de `KeyError`, `TypeError`, `ValueError`, `FileNotFoundError` y `Binder Error` al procesar tablas.',
    'Interpretar la firma de una función (parámetros, valores por defecto y tipo de retorno) en la documentación técnica oficial.'
  ],

  sections: [
    {
      id: 'leer-una-traza-de-error-de-abajo-hacia-arriba',
      heading: 'Por qué una traza de error se lee siempre de abajo hacia arriba',
      body: 'Cuando un programa falla, Python no se cierra en silencio: imprime una **traza de error** (*traceback*) que reconstruye el camino recorrido hasta el fallo. El encabezado `Traceback (most recent call last):` te da la pista de lectura: la llamada más reciente, donde ocurrió el choque real, está al final.\n\nPara diagnosticar cualquier traza en diez segundos sigue tres pasos desde abajo hacia arriba. Primero, lee la última línea: dice el tipo exacto de error y su descripción (`KeyError: \'target_usd\'`). Segundo, sube un escalón hasta encontrar el nombre de tu archivo (`File "auditar_tiendas.py", line 14`), ignorando las rutas internas de bibliotecas dentro de `.venv/`. Tercero, mira la línea de código impresa justo debajo y el cursor `^` que señala la expresión exacta.',
      example: {
        language: 'python',
        code: '# Ejemplo de traza cuando pides una clave mal escrita en stores de Mercado Brisa:\n# Traceback (most recent call last):\n#   File "auditar_tiendas.py", line 8, in <module>\n#     total = sum(t["target_usd"] for t in tiendas)\n#                 ~^^^^^^^^^^^^^^\n# KeyError: \'target_usd\'\n\n# Corrección tras leer la última línea y verificar el esquema de stores:\ntotal = sum(t["monthly_target_usd"] for t in tiendas)',
        expectedOutput: [
          {
            paso_lectura: '1. Última línea de la traza',
            contenido_observado: "KeyError: 'target_usd'",
            significado: 'La clave buscada no existe en el diccionario'
          },
          {
            paso_lectura: '2. Penúltimo bloque (archivo y línea)',
            contenido_observado: 'File "auditar_tiendas.py", line 8',
            significado: 'Archivo tuyo y número exacto de línea donde falló'
          },
          {
            paso_lectura: '3. Verificación contra esquema real',
            contenido_observado: 'Columna real: monthly_target_usd',
            significado: 'Las 14 filas de stores suman 925 000 USD'
          }
        ]
      }
    },
    {
      id: 'cuatro-excepciones-frecuentes-al-procesar-datos',
      heading: 'Las cuatro excepciones que explican casi todos los fallos con datos',
      body: 'En el trabajo diario con datos se repiten cuatro tipos de excepciones en Python y un equivalente directo en motores SQL como DuckDB:\n\n- `KeyError`: intentas leer una columna o clave que no existe (`"target_usd"` en lugar de `"monthly_target_usd"`). En DuckDB aparece como `Binder Error` y el propio mensaje te sugiere `Candidate bindings: "stores.monthly_target_usd"`.\n- `TypeError`: aplicas una operación a un tipo incompatible, casi siempre porque una celda viene vacía (`None` en Python, `NULL` en SQL). En `customers.parquet`, 218 clientes tienen `postal_code` nulo; evaluar `len(None)` lanza `TypeError`.\n- `ValueError`: el tipo es correcto, pero el contenido no se puede convertir (`int("STR-MX-01")`).\n- `FileNotFoundError`: la ruta relativa al archivo está mal escrita o ejecutas desde la carpeta equivocada.',
      example: {
        language: 'sql',
        code: '-- En DuckDB, si escribes mal una columna, Binder Error indica línea y sugerencia:\n-- Binder Error: Referenced column "target_usd" not found in FROM clause!\n-- Candidate bindings: "stores.monthly_target_usd"\n\nSELECT\n  COUNT(*) AS total_customers,\n  COUNT(*) FILTER (WHERE postal_code IS NULL) AS null_postal_codes,\n  COUNT(*) FILTER (WHERE LENGTH(postal_code) = 2) AS truncated_postal_codes,\n  COUNT(*) FILTER (WHERE postal_code IS NOT NULL AND LENGTH(postal_code) > 2) AS valid_postal_codes\nFROM \'public/datasets/customers.parquet\';',
        expectedOutput: [
          {
            total_customers: 2400,
            null_postal_codes: 218,
            truncated_postal_codes: 129,
            valid_postal_codes: 2053
          }
        ]
      }
    },
    {
      id: 'consultar-la-documentacion-oficial-y-leer-firmas',
      heading: 'Cómo leer firmas en la documentación oficial sin copiar a ciegas',
      body: 'Pegar en un buscador o foro un error sin haber leído la última línea suele llevarte a respuestas escritas hace seis años para versiones antiguas de pandas o Polars. Las bibliotecas evolucionan: por ejemplo, en Polars 2.0 el antiguo método `.melt()` fue reemplazado por `.unpivot()`.\n\nAntes de copiar código de terceros, abre la referencia oficial de la herramienta y mira la firma de la función: `pl.read_parquet(source, *, columns=None, n_rows=None)`. Los nombres sin signo `=` (`source`) son argumentos obligatorios; los que tienen `=None` son opcionales y muestran su comportamiento por defecto; el asterisco `*` indica que los argumentos a su derecha deben pasarse por nombre (`n_rows=10`). Leer la firma oficial tarda medio minuto y evita horas de ensayo y error.',
      example: {
        language: 'python',
        code: '# Firma en la documentación oficial de Polars 2.0:\n# pl.scan_parquet(source, *, n_rows=None, low_memory=False)\n\nimport polars as pl\n\n# Usamos argumentos por nombre documentados para inspeccionar calendar.parquet\ndf_festivos = (\n    pl.scan_parquet("public/datasets/calendar.parquet")\n    .filter(pl.col("is_holiday") & (pl.col("year") == 2024))\n    .select(["calendar_date", "day_name", "holiday_name", "season"])\n    .collect()\n)',
        expectedOutput: [
          {
            calendar_date: '2024-01-01',
            day_name: 'Lunes',
            holiday_name: 'Año Nuevo',
            season: 'Invierno'
          },
          {
            calendar_date: '2024-05-01',
            day_name: 'Miércoles',
            holiday_name: 'Día del Trabajo',
            season: 'Primavera'
          },
          {
            calendar_date: '2024-09-16',
            day_name: 'Lunes',
            holiday_name: 'Día de la Independencia',
            season: 'Otoño'
          },
          {
            calendar_date: '2024-11-24',
            day_name: 'Domingo',
            holiday_name: 'Viernes de Descuento',
            season: 'Otoño'
          },
          {
            calendar_date: '2024-12-25',
            day_name: 'Miércoles',
            holiday_name: 'Navidad',
            season: 'Invierno'
          }
        ]
      }
    }
  ],

  workedExample: {
    title: 'Diagnóstico de un TypeError al auditar códigos postales nulos en customers',
    description: 'En `customers.parquet` de Mercado Brisa (2 400 clientes), 218 registros tienen `postal_code` nulo (`None` en Python) y 129 tienen un código truncado de 2 caracteres. Observa cómo la traza revela el fallo al medir la longitud y cómo se corrige.',
    steps: [
      {
        label: 'Antipatrón: aplicar len() sin proteger valores None y cambiar código al azar',
        explanation: 'Al evaluar `len(c["postal_code"]) == 2` sobre los 2 400 clientes, el script choca en el primer cliente con `postal_code = None` y lanza `TypeError: object of type \'NoneType\' has no len()`.',
        code: '# ERROR: Asumir que postal_code siempre es un texto (str) y nunca viene en None\ntruncados = [\n    c["customer_id"]\n    for c in clientes\n    if len(c["postal_code"]) == 2\n]\n# TypeError: object of type \'NoneType\' has no len()',
        expectedOutput: [
          {
            excepcion: 'TypeError',
            mensaje: "object of type 'NoneType' has no len()",
            causa_en_mercado_brisa: '218 filas de customers tienen postal_code = NULL (None)'
          }
        ]
      },
      {
        label: 'Solución verificada: leer el TypeError y validar que el valor no sea None',
        explanation: 'La última línea de la traza dice que `postal_code` puede ser `None`. Si verificamos que sea cadena o sustituimos `None` por `""`, el script termina y separa los 218 nulos, los 129 truncados y los 2 053 válidos.',
        code: '# CORRECTO: Proteger valores None antes de medir la longitud del código postal\ndef clasificar_codigo_postal(cliente: dict) -> str:\n    cp = cliente.get("postal_code")\n    if cp is None:\n        return "nulo"\n    if len(cp) == 2:\n        return "truncado_2_chars"\n    return "valido"',
        expectedOutput: [
          {
            total_customers: 2400,
            null_postal_codes: 218,
            truncated_postal_codes: 129,
            valid_postal_codes: 2053
          }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: 'Ejecutas un script y aparece una traza de 12 líneas donde las primeras 10 apuntan a archivos dentro de `.venv/lib/python3.14/site-packages/...`, una línea apunta a `File "mi_reporte.py", line 19` y la última dice `KeyError: \'store_name_es\'`. ¿Dónde debes buscar primero?',
      options: [
        {
          id: 'a',
          text: 'En la última línea (`KeyError: \'store_name_es\'`) y en la línea 19 de `mi_reporte.py`, donde pediste una clave que no existe.',
          correct: true,
          feedback: 'Exacto. La última línea indica qué falló y el marco de tu propio archivo (`mi_reporte.py`, línea 19) indica dónde lo invocaste.'
        },
        {
          id: 'b',
          text: 'Debes abrir y editar los archivos internos de `.venv/lib/...` para borrar la validación.',
          correct: false,
          feedback: 'Nunca edites el código interno de las bibliotecas dentro de `.venv/`; el error se originó por la clave que pasaste desde tu script.'
        },
        {
          id: 'c',
          text: 'En la línea 1 de `mi_reporte.py`, porque las trazas siempre ponen el error arriba del todo.',
          correct: false,
          feedback: 'El encabezado dice `most recent call last`: la llamada más reciente y el error están al final de la traza.'
        }
      ],
      explanation: 'Las trazas de Python imprimen la pila desde la llamada más antigua arriba hasta la más reciente abajo. Siempre se empieza leyendo la última línea y ubicando tu propio archivo.'
    },
    {
      id: 'c2',
      type: 'predict-output',
      prompt: 'En `customers.parquet` hay 218 filas donde `postal_code` es `None`. Si en Python ejecutas `len(cliente["postal_code"])` sobre una de esas filas, ¿qué excepción aparecerá al final de la traza?',
      options: [
        {
          id: 'a',
          text: '`TypeError`, porque `None` (`NoneType`) no tiene longitud ni admite `len()`.',
          correct: true,
          feedback: 'Correcto. Aplicar `len()` o sumar un número con `None` produce un `TypeError`.'
        },
        {
          id: 'b',
          text: '`FileNotFoundError`, porque falta el archivo en el disco.',
          correct: false,
          feedback: '`FileNotFoundError` solo ocurre al intentar abrir una ruta de archivo inexistente.'
        },
        {
          id: 'c',
          text: '`KeyError`, porque la clave `"postal_code"` no está en el diccionario.',
          correct: false,
          feedback: 'La clave `"postal_code"` sí existe en el diccionario, pero su valor asociado es `None`.'
        }
      ],
      explanation: 'Cuando la clave existe en el registro pero su valor es `None` (un `NULL` de la tabla), operar sobre ese valor sin comprobarlo antes dispara `TypeError`.'
    },
    {
      id: 'c3',
      type: 'mcq',
      prompt: 'En la documentación oficial lees la firma `duckdb.read_parquet(file_glob, binary_as_string=False, *, filename=False)`. ¿Qué significa `binary_as_string=False`?',
      options: [
        {
          id: 'a',
          text: 'Que `binary_as_string` es un parámetro opcional cuyo valor por defecto es `False` si no lo especificas.',
          correct: true,
          feedback: 'Correcto. En la firma de una función, `parametro=valor` indica que es opcional y muestra qué valor toma por omisión.'
        },
        {
          id: 'b',
          text: 'Que está prohibido pasarle `True` a ese parámetro.',
          correct: false,
          feedback: 'Puedes pasarle `binary_as_string=True` cuando lo necesites; `False` es únicamente el valor por defecto.'
        },
        {
          id: 'c',
          text: 'Que la función devuelve siempre `False` al terminar de leer el archivo Parquet.',
          correct: false,
          feedback: 'El valor por defecto de un parámetro de entrada no es el valor de retorno de la función.'
        }
      ],
      explanation: 'En la documentación de Python, un signo `=` en la lista de parámetros señala el valor por defecto que usa la función cuando no pasas ese argumento.'
    }
  ],

  practice: {
    type: 'fill-blanks',
    title: 'Corrección defensiva tras diagnosticar TypeError y KeyError',
    language: 'python',
    prompt: 'Tras leer dos trazas de error (`TypeError: object of type \'NoneType\' has no len()` en `customers` y `KeyError: \'target_usd\'` en `stores`), completa las funciones corregidas usando `.get()`, comprobando `is not None` y leyendo la columna real `monthly_target_usd`.',
    starterCode: 'def es_postal_truncado(cliente: dict) -> bool:\n    # 1. Leer postal_code de forma segura con .get()\n    codigo = cliente.{{blank_1}}("postal_code")\n    # 2. Evitar TypeError comprobando que no sea None antes de medir len()\n    return codigo {{blank_2}} and len(codigo) == 2\n\ndef sumar_metas_tiendas(tiendas: list[dict]) -> float:\n    # 3. Usar el nombre real de la columna en stores.parquet\n    return sum(t["{{blank_3}}"] for t in tiendas)',
    expected: 'def es_postal_truncado(cliente: dict) -> bool:\n    # 1. Leer postal_code de forma segura con .get()\n    codigo = cliente.get("postal_code")\n    # 2. Evitar TypeError comprobando que no sea None antes de medir len()\n    return codigo is not None and len(codigo) == 2\n\ndef sumar_metas_tiendas(tiendas: list[dict]) -> float:\n    # 3. Usar el nombre real de la columna en stores.parquet\n    return sum(t["monthly_target_usd"] for t in tiendas)',
    orderMatters: true,
    hints: [
      'Para extraer un valor de un diccionario en Python sin lanzar error si falta la clave, usa el método `get`.',
      'En Python se comprueba que una variable no sea nula con el operador `is not None` antes de llamar a `len(codigo)`.',
      'Según el esquema de `stores.parquet` de Mercado Brisa, la meta mensual se llama `monthly_target_usd`.'
    ],
    solution: 'def es_postal_truncado(cliente: dict) -> bool:\n    # 1. Leer postal_code de forma segura con .get()\n    codigo = cliente.get("postal_code")\n    # 2. Evitar TypeError comprobando que no sea None antes de medir len()\n    return codigo is not None and len(codigo) == 2\n\ndef sumar_metas_tiendas(tiendas: list[dict]) -> float:\n    # 3. Usar el nombre real de la columna en stores.parquet\n    return sum(t["monthly_target_usd"] for t in tiendas)',
    solutionExplanation: 'Usar `cliente.get("postal_code")` y verificar `codigo is not None` impide que los 218 registros con `NULL` disparen un `TypeError` al evaluar `len(codigo)`, identificando exactamente los 129 códigos truncados; y usar `"monthly_target_usd"` corrige el `KeyError`.',
    blanks: [
      {
        id: 'blank_1',
        label: 'Método seguro de diccionario',
        correct: 'get',
        options: ['get', 'len', 'pop'],
        hint: '`cliente.get("postal_code")` devuelve el valor o `None` sin lanzar `KeyError`.'
      },
      {
        id: 'blank_2',
        label: 'Comprobación de valor no nulo en Python',
        correct: 'is not None',
        options: ['is not None', '== None', 'in None'],
        hint: 'En Python la forma estándar de verificar que un objeto no sea nulo es `is not None`.'
      },
      {
        id: 'blank_3',
        label: 'Nombre real de la columna de meta en stores',
        correct: 'monthly_target_usd',
        options: ['monthly_target_usd', 'target_usd', 'store_code'],
        hint: 'En `stores.parquet`, la columna de meta comercial en dólares se llama `monthly_target_usd`.'
      }
    ],
    expectedOutputTable: [
      {
        total_customers: 2400,
        null_postal_codes: 218,
        truncated_postal_codes: 129,
        valid_postal_codes: 2053
      }
    ]
  },

  roleNotes: {
    de: 'Registra siempre la traza completa en los logs del orquestador cuando falla una tarea nocturna; la última línea y el número de línea permiten corregir el pipeline en minutos.',
    da: 'Cuando una función de Polars, pandas o DuckDB falle, lee primero el tipo de excepción (`KeyError`, `TypeError`, `Binder Error`) y revisa la firma en la documentación oficial antes de buscar en foros.',
    bi: 'Usa los mensajes de error de esquema y de enlace de columnas para detectar cuándo cambió el nombre de un campo en la fuente antes de que llegue vacío al tablero.'
  },

  summary: [
    'Lee toda traza de error de abajo hacia arriba: última línea para la excepción y penúltimo bloque propio para el archivo y línea.',
    'Un `KeyError` o `Binder Error` indica un nombre de columna inexistente; verifica el esquema real antes de tocar la lógica.',
    'Un `TypeError` con `NoneType` suele significar que la columna contiene valores `NULL` que debes proteger antes de operar.',
    'En la documentación oficial, revisa la firma de la función para distinguir parámetros obligatorios de opcionales con valor por defecto.'
  ],

  flashcards: [
    {
      id: 'fc-c0-herr-05-a',
      front: '¿Cuáles son los tres datos que debes buscar al leer una traza de error (traceback) de abajo hacia arriba?',
      back: '1) El tipo de excepción y mensaje en la última línea, 2) el nombre de tu archivo y número de línea, y 3) la expresión señalada por el cursor `^`.'
    },
    {
      id: 'fc-c0-herr-05-b',
      front: '¿Qué diferencia hay entre `KeyError` y `TypeError` al procesar un diccionario que representa una fila de datos?',
      back: '`KeyError` ocurre cuando pides un nombre de columna que no existe; `TypeError` ocurre cuando el valor existe pero su tipo es incompatible (como aplicar `len()` a `None`).'
    },
    {
      id: 'fc-c0-herr-05-c',
      front: 'En una firma de documentación de Python como `func(a, b=10, *, c=True)`, ¿qué indican `=10` y el asterisco `*`?',
      back: '`=10` indica que `b` es opcional con valor por defecto `10`; el `*` obliga a pasar los argumentos siguientes (`c=True`) por nombre explícito.'
    }
  ],

  glossaryTerms: [
    'traza-error-traceback'
  ],

  sources: [
    {
      title: 'Python 3.14 Official Tutorial — Chapter 8: Errors and Exceptions',
      url: 'https://docs.python.org/3/tutorial/errors.html',
      publisher: 'Python Software Foundation',
      accessed: '2026-10-29',
      supports: 'Estructura de las trazas de pila (Most recent call last) y diferencia entre errores de sintaxis y excepciones.'
    },
    {
      title: 'Python Standard Library Reference — Built-in Exceptions',
      url: 'https://docs.python.org/3/library/exceptions.html',
      publisher: 'Python Software Foundation',
      accessed: '2026-10-29',
      supports: 'Definición oficial de KeyError, TypeError, ValueError y FileNotFoundError.'
    },
    {
      title: 'DuckDB Documentation — SQL Introduction & Query Error Diagnostics',
      url: 'https://duckdb.org/docs/sql/introduction',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Mensajes de diagnóstico Binder Error y Catalog Error con sugerencia de columnas candidatas.'
    },
    {
      title: 'Polars User Guide — Getting Started & Expressions API Reference',
      url: 'https://docs.pola.rs/user-guide/getting-started/',
      publisher: 'Polars Project',
      accessed: '2026-10-29',
      supports: 'Lectura de firmas de funciones, tipos de datos y métodos vigentes en Polars 2.0.'
    }
  ],

  aiNotes: 'Las personas principiantes suelen asustarse al ver diez líneas de rutas internas de `.venv/` en un traceback y creen que rompieron Python. Enseña a saltar directamente a la última línea de la traza y luego buscar la línea que menciona su propio archivo `.py`.'
};

export default lesson;
