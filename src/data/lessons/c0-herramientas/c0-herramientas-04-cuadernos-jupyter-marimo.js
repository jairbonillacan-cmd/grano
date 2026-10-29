const lesson = {
  id: 'c0-herramientas-04-cuadernos-jupyter-marimo',
  moduleId: 'c0-herramientas',
  tracks: ['core'],
  level: 0,
  order: 4,
  title: 'Cuadernos interactivos y reactivos (Jupyter y Marimo)',
  minutes: 20,
  prerequisites: ['c0-herramientas-03-python-inicial-uv'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), un analista filtra en un cuaderno las ubicaciones de `stores` con meta mensual mayor o igual a `umbral_meta`. Primero prueba con `50000` USD en la Celda 1 y obtiene 11 ubicaciones (`786 000` USD) en la Celda 2. Luego cambia la Celda 1 a `70000` USD, pero olvida reejecutar la Celda 2 y reporta 11 tiendas en vez de las 6 reales (`487 000` USD). ¿Cómo evitas que el orden de clic distorsione tus resultados?',

  objectives: [
    'Diagnosticar el problema del estado oculto cuando las celdas de un cuaderno `.ipynb` se ejecutan fuera de orden.',
    'Explicar cómo un cuaderno reactivo (Marimo) actualiza las celdas dependientes mediante un grafo acíclico dirigido (DAG).',
    'Comparar el formato JSON `.ipynb` frente a los archivos `.py` puros al revisar diferencias con `git diff`.'
  ],

  sections: [
    {
      id: 'anatomia-de-un-cuaderno-interactivo-y-el-peligro',
      heading: 'Cómo funciona un cuaderno tradicional y por qué surge el estado oculto',
      body: 'Un cuaderno interactivo divide tu código en bloques llamados celdas. Estas celdas combinan texto en Markdown, código Python y tablas de salida. Detrás de la pantalla corre un proceso persistente en memoria llamado *kernel*. Ese proceso guarda las variables a medida que ejecutas celdas con `Shift + Enter`.\n\nEn Jupyter (`.ipynb`), tú decides en qué orden ejecutar las celdas. El número entre corchetes (`In [1]`, `In [2]`, `In [9]`) muestra la secuencia real de clics. Si cambias un parámetro en la primera celda (`In [9]`) pero no vuelves a correr la segunda (`In [2]`), la tabla visible conserva los números viejos. Ese desfase entre el código escrito y la memoria del kernel se llama **estado oculto**.',
      example: {
        language: 'python',
        code: '# En Jupyter: el contador In [n] delata que la Celda 2 quedó desactualizada\n# In [5] (ejecutada después): se subió el umbral a 70 000 USD\numbral_meta = 70000\n\n# In [2] (NO se volvió a ejecutar): muestra el cálculo viejo con 50 000 USD\n# Regla obligatoria en Jupyter antes de entregar: "Restart Kernel and Run All Cells"',
        expectedOutput: [
          {
            escenario_cuaderno: 'Celda 2 sin reejecutar (In [2] tras In [5])',
            umbral_visible_en_codigo: 70000,
            ubicaciones_mostradas: 11,
            suma_mostrada_usd: 786000,
            consistencia: 'Falsa (muestra datos del umbral 50000)'
          },
          {
            escenario_cuaderno: 'Tras reiniciar kernel y correr todo en orden',
            umbral_visible_en_codigo: 70000,
            ubicaciones_mostradas: 6,
            suma_mostrada_usd: 487000,
            consistencia: 'Correcta (coincide con el código visible)'
          }
        ]
      }
    },
    {
      id: 'cuadernos-reactivos-como-grafo-aciclico-en-marim',
      heading: 'Cuadernos reactivos en Marimo: el código como un grafo sin desfase',
      body: 'Para eliminar el estado oculto de raíz, herramientas como Marimo usan un **cuaderno reactivo**. En lugar de depender del orden en que pulsas `Shift + Enter`, Marimo inspecciona qué variables define cada celda y qué variables lee cada una de las demás.\n\nCon esa información construye un grafo acíclico dirigido (DAG), igual que una hoja de cálculo. Si la Celda A define `umbral_meta = 70000` y la Celda B usa `umbral_meta` para filtrar `stores.parquet`, modificar la Celda A recalcula de inmediato la Celda B. Además, Marimo prohíbe definir la misma variable global en dos celdas distintas. Así la pantalla siempre coincide con el código visible.',
      example: {
        language: 'python',
        code: 'import marimo as mo\nimport duckdb\n\n# Celda 1: define umbral_meta\numbral_meta = 70000\n\n# Celda 2: lee umbral_meta -> Marimo la reejecuta sola cuando cambia la Celda 1\ntop_tiendas = duckdb.sql(f"""\n    SELECT store_code, store_name, store_type, region, monthly_target_usd\n    FROM \'public/datasets/stores.parquet\'\n    WHERE monthly_target_usd >= {umbral_meta}\n    ORDER BY monthly_target_usd DESC\n""")',
        expectedOutput: [
          {
            store_code: 'WH-MX-01',
            store_name: 'Almacén Central Vallejo',
            store_type: 'warehouse',
            region: 'Norteamérica',
            monthly_target_usd: 95000
          },
          {
            store_code: 'STR-MX-01',
            store_name: 'Tienda Reforma Norte',
            store_type: 'flagship',
            region: 'Norteamérica',
            monthly_target_usd: 85000
          },
          {
            store_code: 'WH-ES-01',
            store_name: 'Almacén Logístico Coslada',
            store_type: 'warehouse',
            region: 'Iberia',
            monthly_target_usd: 82000
          },
          {
            store_code: 'STR-ES-01',
            store_name: 'Tienda Salamanca',
            store_type: 'flagship',
            region: 'Iberia',
            monthly_target_usd: 78000
          },
          {
            store_code: 'WH-CO-01',
            store_name: 'Almacén Logístico Sabana',
            store_type: 'warehouse',
            region: 'Andina',
            monthly_target_usd: 76000
          },
          {
            store_code: 'STR-CO-01',
            store_name: 'Tienda Chapinero Alto',
            store_type: 'flagship',
            region: 'Andina',
            monthly_target_usd: 71000
          }
        ]
      }
    },
    {
      id: 'archivos-py-puros-versionables-en-git-y-ejecucio',
      heading: 'Por qué guardar el cuaderno como script .py facilita el uso de Git',
      body: 'Los cuadernos `.ipynb` se guardan en disco como un archivo JSON. Ese archivo mezcla tu código con contadores de ejecución, metadatos y gráficos codificados en texto base64. Cuando dos personas editan un `.ipynb` en Git, `git diff` muestra cientos de líneas ilegibles aunque solo cambie un filtro.\n\nPor el contrario, un cuaderno de Marimo se guarda como un archivo `.py` de Python puro. Cada celda es una función decorada con `@app.cell`. Esto aporta tres ventajas directas. Primero, `git diff` muestra únicamente las líneas de código que cambiaron. Segundo, puedes abrirlo como cuaderno interactivo con `uv run marimo edit analisis.py`. Tercero, puedes ejecutarlo como script desde la terminal con `uv run python analisis.py`.',
      example: {
        language: 'bash',
        code: '# 1) Abrir el cuaderno reactivo en el navegador para explorar datos\nuv run marimo edit validar_tiendas.py\n\n# 2) Ejecutar el mismo archivo como script automatizado en la terminal\nuv run python validar_tiendas.py\n\n# 3) Revisar cambios limpios en Git sin ruido JSON ni imágenes base64\ngit diff validar_tiendas.py',
        expectedOutput: [
          {
            formato: 'Jupyter (.ipynb)',
            estructura_disco: 'JSON con salidas e imágenes base64 incrustadas',
            lectura_git_diff: 'Difícil (cientos de líneas de metadatos por cambio)',
            ejecucion_directa_cli: 'Requiere herramientas adicionales (nbconvert / papermill)'
          },
          {
            formato: 'Marimo (.py)',
            estructura_disco: 'Script Python puro con celdas @app.cell',
            lectura_git_diff: 'Limpia (muestra solo las líneas de código modificadas)',
            ejecucion_directa_cli: 'Directa con `uv run python archivo.py`'
          }
        ]
      }
    }
  ],

  workedExample: {
    title: 'Comparación de estado oculto en Jupyter frente a ejecución reactiva en Marimo',
    description: 'Observa qué ocurre cuando cambias el filtro `umbral_meta` de `50000` a `70000` USD sobre `stores.parquet` de Mercado Brisa en un cuaderno tradicional sin reejecutar celdas frente a un cuaderno reactivo.',
    steps: [
      {
        label: 'Antipatrón: cambiar un parámetro en .ipynb sin reejecutar las celdas de abajo',
        explanation: 'En un `.ipynb`, editar `umbral_meta = 70000` en la Celda 1 (`In [4]`) no actualiza automáticamente la Celda 2 (`In [2]`). El reporte muestra 11 ubicaciones y 786 000 USD, que pertenecían al valor anterior de 50 000 USD.',
        code: '# Celda 1 [In 4]: se cambió de 50000 a 70000\numbral_meta = 70000\n\n# Celda 2 [In 2]: NO se volvió a ejecutar; conserva en RAM el resultado de 50000\n# Resultado obsoleto en pantalla: 11 ubicaciones y 786 000 USD',
        expectedOutput: [
          {
            stores_ge_50k: 11,
            sum_ge_50k: 786000,
            stores_ge_70k: 6,
            sum_ge_70k: 487000
          }
        ]
      },
      {
        label: 'Solución verificada: celda reactiva en Marimo que recalcula el grafo automáticamente',
        explanation: 'En Marimo, cambiar `umbral_meta = 70000` en la primera celda dispara de inmediato la segunda celda porque forma parte de su grafo de dependencias, mostrando las 6 ubicaciones reales (`487 000` USD).',
        code: '@app.cell\ndef _():\n    umbral_meta = 70000\n    return (umbral_meta,)\n\n@app.cell\ndef _(duckdb, umbral_meta):\n    resumen = duckdb.sql(f"""\n        SELECT store_code, store_name, store_type, region, monthly_target_usd\n        FROM \'public/datasets/stores.parquet\'\n        WHERE monthly_target_usd >= {umbral_meta}\n        ORDER BY monthly_target_usd DESC\n    """)\n    return (resumen,)',
        expectedOutput: [
          {
            store_code: 'WH-MX-01',
            store_name: 'Almacén Central Vallejo',
            store_type: 'warehouse',
            region: 'Norteamérica',
            monthly_target_usd: 95000
          },
          {
            store_code: 'STR-MX-01',
            store_name: 'Tienda Reforma Norte',
            store_type: 'flagship',
            region: 'Norteamérica',
            monthly_target_usd: 85000
          },
          {
            store_code: 'WH-ES-01',
            store_name: 'Almacén Logístico Coslada',
            store_type: 'warehouse',
            region: 'Iberia',
            monthly_target_usd: 82000
          },
          {
            store_code: 'STR-ES-01',
            store_name: 'Tienda Salamanca',
            store_type: 'flagship',
            region: 'Iberia',
            monthly_target_usd: 78000
          },
          {
            store_code: 'WH-CO-01',
            store_name: 'Almacén Logístico Sabana',
            store_type: 'warehouse',
            region: 'Andina',
            monthly_target_usd: 76000
          },
          {
            store_code: 'STR-CO-01',
            store_name: 'Tienda Chapinero Alto',
            store_type: 'flagship',
            region: 'Andina',
            monthly_target_usd: 71000
          }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: 'Recibes un cuaderno Jupyter (`.ipynb`) donde la Celda 1 tiene el marcador `In [8]`, la Celda 2 tiene `In [3]` y la Celda 3 tiene `In [4]`. ¿Qué riesgo indica esa numeración y cómo lo verificas?',
      options: [
        {
          id: 'a',
          text: 'La Celda 1 fue modificada y ejecutada después de las Celdas 2 y 3, por lo que las tablas de abajo pueden mostrar resultados obsoletos; debes reiniciar el kernel y ejecutar todas las celdas desde arriba.',
          correct: true,
          feedback: 'Exacto. `In [8]` arriba de `In [3]` demuestra que las celdas dependientes no se volvieron a correr tras el último cambio.'
        },
        {
          id: 'b',
          text: 'Significa que la Celda 1 tardó 8 segundos en ejecutarse y la Celda 2 tardó 3 segundos.',
          correct: false,
          feedback: 'El número dentro de `In [n]` es el contador secuencial de ejecuciones en la sesión del kernel, no el tiempo en segundos.'
        },
        {
          id: 'c',
          text: 'No hay ningún riesgo porque Jupyter recalcula automáticamente todas las celdas inferiores aunque no las ejecutes.',
          correct: false,
          feedback: 'Jupyter tradicional no es reactivo: solo ejecuta la celda donde pulsas `Shift + Enter`.'
        }
      ],
      explanation: 'En un cuaderno `.ipynb` tradicional, antes de confiar en un resultado o compartir el archivo es obligatorio reiniciar el kernel y ejecutar todas las celdas en orden (*Restart Kernel and Run All*).'
    },
    {
      id: 'c2',
      type: 'mcq',
      prompt: '¿Por qué Marimo prohíbe definir una misma variable global (por ejemplo, `tiendas_filtradas`) en dos celdas distintas del mismo cuaderno?',
      options: [
        {
          id: 'a',
          text: 'Para construir un grafo acíclico dirigido (DAG) sin ambigüedad y saber exactamente qué celdas recalcular cuando cambia esa variable.',
          correct: true,
          feedback: 'Correcto. Si cada variable tiene una única celda que la define, el orden de actualización reactiva es 100 % determinista.'
        },
        {
          id: 'b',
          text: 'Porque Python no permite crear más de tres variables por archivo `.py`.',
          correct: false,
          feedback: 'Python permite miles de variables; la restricción de Marimo es que cada variable compartida entre celdas tenga un único origen claro.'
        },
        {
          id: 'c',
          text: 'Para obligar a guardar todos los resultados en archivos Excel.',
          correct: false,
          feedback: 'Marimo trabaja directamente con DataFrames de Polars, pandas y tablas de DuckDB en memoria.'
        }
      ],
      explanation: 'Al exigir que cada variable global tenga una sola celda productora, Marimo garantiza que el estado en memoria sea siempre una función limpia del código visible.'
    },
    {
      id: 'c3',
      type: 'mcq',
      prompt: '¿Qué ventaja práctica ofrece que un cuaderno de Marimo se guarde como un archivo `.py` en lugar de un documento JSON `.ipynb` cuando trabajas con Git?',
      options: [
        {
          id: 'a',
          text: 'Permite revisar en `git diff` únicamente las líneas de código que cambiaron y ejecutar el cuaderno directamente como script desde la terminal.',
          correct: true,
          feedback: 'Correcto. Al ser un archivo `.py` puro sin salidas binarias ni contadores de ejecución en JSON, se versiona y ejecuta de forma limpia.'
        },
        {
          id: 'b',
          text: 'Hace que el archivo no necesite tener Python instalado para ejecutarse.',
          correct: false,
          feedback: 'Sigue siendo un programa de Python que corre dentro de tu entorno virtual con `uv run`.'
        },
        {
          id: 'c',
          text: 'Impide que otras personas vean las consultas SQL dentro del repositorio.',
          correct: false,
          feedback: 'Al contrario: el código SQL y Python queda legible en texto plano para que el equipo lo audite en Pull Requests.'
        }
      ],
      explanation: 'Guardar los cuadernos como scripts `.py` puros elimina los conflictos de unión en JSON y permite que el mismo archivo sirva para explorar datos y para correr en un flujo automatizado.'
    }
  ],

  practice: {
    type: 'fill-blanks',
    title: 'Definición de celdas reactivas en Marimo sobre stores.parquet',
    language: 'python',
    prompt: 'Completa el cuaderno reactivo de Marimo para declarar una celda con el decorador de Marimo, fijar el umbral en `70000` USD para filtrar las 6 ubicaciones principales de Mercado Brisa y ejecutar el cuaderno como script reproducible con `uv run`.',
    starterCode: 'import marimo\n\napp = marimo.App()\n\n@app.{{blank_1}}\ndef _():\n    umbral_meta = {{blank_2}}\n    return (umbral_meta,)\n\n@app.cell\ndef _(duckdb, umbral_meta):\n    df_top = duckdb.sql(f"""\n        SELECT store_code, store_name, monthly_target_usd\n        FROM \'public/datasets/stores.parquet\'\n        WHERE monthly_target_usd >= {umbral_meta}\n        ORDER BY monthly_target_usd DESC\n    """)\n    return (df_top,)\n\n# En la terminal: ejecutar el cuaderno .py como script reproducible\n# uv {{blank_3}} python validar_tiendas.py',
    expected: 'import marimo\n\napp = marimo.App()\n\n@app.cell\ndef _():\n    umbral_meta = 70000\n    return (umbral_meta,)\n\n@app.cell\ndef _(duckdb, umbral_meta):\n    df_top = duckdb.sql(f"""\n        SELECT store_code, store_name, monthly_target_usd\n        FROM \'public/datasets/stores.parquet\'\n        WHERE monthly_target_usd >= {umbral_meta}\n        ORDER BY monthly_target_usd DESC\n    """)\n    return (df_top,)\n\n# En la terminal: ejecutar el cuaderno .py como script reproducible\n# uv run python validar_tiendas.py',
    orderMatters: true,
    hints: [
      'En un archivo `.py` de Marimo, cada celda se define decorando una función con `@app.cell`.',
      'Para obtener las 6 ubicaciones de Mercado Brisa que suman `487 000` USD, asigna `70000` a `umbral_meta`.',
      'Para ejecutar el archivo `.py` dentro del entorno virtual gestionado por `uv`, usa `uv run`.'
    ],
    solution: 'import marimo\n\napp = marimo.App()\n\n@app.cell\ndef _():\n    umbral_meta = 70000\n    return (umbral_meta,)\n\n@app.cell\ndef _(duckdb, umbral_meta):\n    df_top = duckdb.sql(f"""\n        SELECT store_code, store_name, monthly_target_usd\n        FROM \'public/datasets/stores.parquet\'\n        WHERE monthly_target_usd >= {umbral_meta}\n        ORDER BY monthly_target_usd DESC\n    """)\n    return (df_top,)\n\n# En la terminal: ejecutar el cuaderno .py como script reproducible\n# uv run python validar_tiendas.py',
    solutionExplanation: 'El decorador `@app.cell` registra la celda en el grafo reactivo de Marimo; al cambiar `umbral_meta = 70000`, la segunda celda recibe `umbral_meta` por argumento y filtra las 6 ubicaciones de Mercado Brisa; y `uv run` permite correr el archivo `.py` desde la terminal.',
    blanks: [
      {
        id: 'blank_1',
        label: 'Decorador de celda en Marimo',
        correct: 'cell',
        options: ['cell', 'ipynb', 'kernel'],
        hint: 'En Marimo cada bloque reactivo lleva el decorador `@app.cell`.'
      },
      {
        id: 'blank_2',
        label: 'Umbral de meta mensual en USD',
        correct: '70000',
        options: ['70000', '50000', '-9.99'],
        hint: 'El umbral que filtra las 6 ubicaciones principales (`487 000` USD en total) es `70000`.'
      },
      {
        id: 'blank_3',
        label: 'Subcomando de uv para ejecutar el script',
        correct: 'run',
        options: ['run', 'init', 'diff'],
        hint: '`uv run python validar_tiendas.py` ejecuta el cuaderno como script dentro del entorno virtual.'
      }
    ],
    expectedOutputTable: [
      {
        store_code: 'WH-MX-01',
        store_name: 'Almacén Central Vallejo',
        store_type: 'warehouse',
        region: 'Norteamérica',
        monthly_target_usd: 95000
      },
      {
        store_code: 'STR-MX-01',
        store_name: 'Tienda Reforma Norte',
        store_type: 'flagship',
        region: 'Norteamérica',
        monthly_target_usd: 85000
      },
      {
        store_code: 'WH-ES-01',
        store_name: 'Almacén Logístico Coslada',
        store_type: 'warehouse',
        region: 'Iberia',
        monthly_target_usd: 82000
      },
      {
        store_code: 'STR-ES-01',
        store_name: 'Tienda Salamanca',
        store_type: 'flagship',
        region: 'Iberia',
        monthly_target_usd: 78000
      },
      {
        store_code: 'WH-CO-01',
        store_name: 'Almacén Logístico Sabana',
        store_type: 'warehouse',
        region: 'Andina',
        monthly_target_usd: 76000
      },
      {
        store_code: 'STR-CO-01',
        store_name: 'Tienda Chapinero Alto',
        store_type: 'flagship',
        region: 'Andina',
        monthly_target_usd: 71000
      }
    ]
  },

  roleNotes: {
    de: 'Prefiere cuadernos guardados como `.py` (Marimo) o scripts modulares para poder ejecutarlos directamente desde el orquestador sin mantener servidores Jupyter ni lidiar con JSON en Git.',
    da: 'Si trabajas en Jupyter (`.ipynb`), ejecuta siempre "Restart Kernel and Run All Cells" antes de publicar una conclusión; si usas Marimo, aprovecha el grafo reactivo para explorar umbrales sin estado oculto.',
    bi: 'Publica cuadernos reactivos con `marimo run` para compartir calculadoras de escenarios con negocio garantizando que al mover un control todas las tablas se actualicen a la vez.'
  },

  summary: [
    'En un cuaderno `.ipynb` tradicional, ejecutar celdas desordenadas crea estado oculto en la memoria del kernel.',
    'Antes de compartir cualquier `.ipynb`, reinicia siempre el kernel y ejecuta todas las celdas de arriba hacia abajo.',
    'Marimo construye un grafo acíclico dirigido (DAG) entre celdas y recalcula automáticamente las celdas dependientes.',
    'Guardar el cuaderno como archivo `.py` puro permite revisar cambios limpios en `git diff` y correrlo por terminal.'
  ],

  flashcards: [
    {
      id: 'fc-c0-herr-04-a',
      front: '¿Qué es el estado oculto en un cuaderno interactivo `.ipynb`?',
      back: 'Ocurre cuando las variables en la memoria del kernel provienen de celdas borradas o ejecutadas fuera de orden y ya no coinciden con el código visible.'
    },
    {
      id: 'fc-c0-herr-04-b',
      front: '¿Qué paso de verificación es obligatorio antes de dar por bueno un análisis en Jupyter (`.ipynb`)?',
      back: 'Reiniciar el kernel y ejecutar todas las celdas de principio a fin ("Restart Kernel and Run All Cells").'
    },
    {
      id: 'fc-c0-herr-04-c',
      front: '¿Cómo sabe Marimo qué celdas debe volver a ejecutar cuando modificas una variable?',
      back: 'Analiza estáticamente qué variables define y lee cada celda para construir un grafo acíclico dirigido (DAG) y ejecuta las dependientes en orden topológico.'
    }
  ],

  glossaryTerms: [
    'estado-oculto-cuaderno',
    'cuaderno-reactivo-dag'
  ],

  sources: [
    {
      title: 'Marimo Documentation — Reactive Execution and Reproducible Notebooks',
      url: 'https://docs.marimo.io/guides/reactivity/',
      publisher: 'Marimo Team',
      accessed: '2026-10-29',
      supports: 'Ejecución reactiva determinista mediante grafo acíclico dirigido (DAG) y prevención del estado oculto.'
    },
    {
      title: 'Marimo Documentation — Overview and Git-Friendly Python File Format',
      url: 'https://docs.marimo.io/',
      publisher: 'Marimo Team',
      accessed: '2026-10-29',
      supports: 'Almacenamiento en archivos .py puros ejecutables como script CLI y auditables en Git.'
    },
    {
      title: 'Jupyter Notebook Documentation — Notebook Basics and Kernel Execution',
      url: 'https://jupyter-notebook.readthedocs.io/en/latest/notebook.html',
      publisher: 'Project Jupyter',
      accessed: '2026-10-29',
      supports: 'Funcionamiento del kernel interactivo, celdas de código/Markdown y formato de archivo .ipynb.'
    },
    {
      title: 'Project Jupyter Official Documentation — Architecture and Guides',
      url: 'https://docs.jupyter.org/en/latest/',
      publisher: 'Project Jupyter',
      accessed: '2026-10-29',
      supports: 'Buenas prácticas de ejecución ordenada y reinicio de kernel en cuadernos interactivos.'
    }
  ],

  aiNotes: 'El alumno suele pensar que en Jupyter las celdas se actualizan solas como en Excel, o no entiende por qué los contadores `In [10]` seguidos de `In [2]` son peligrosos. Pídele siempre fijarse en el orden de los números `In [n]` y compara ese comportamiento con el grafo reactivo de Marimo.'
};

export default lesson;
