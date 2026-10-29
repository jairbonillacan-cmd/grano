const lesson = {
  id: 'c0-herramientas-03-python-inicial-uv',
  moduleId: 'c0-herramientas',
  tracks: ['core'],
  level: 0,
  order: 3,
  title: 'Python inicial para datos: colecciones y entornos con uv',
  minutes: 25,
  prerequisites: ['c0-herramientas-02-git-commits-ramas'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), una analista escribe un script en Python para auditar los 180 productos del catálogo `products.parquet` y detectar el artículo de calibración `SKU-TEST-NEG` que tiene precio `-9.99` USD. En su computadora el script corre bien porque meses atrás instaló bibliotecas sueltas con `pip install`, pero cuando su compañero lo clona desde Git recibe un `ModuleNotFoundError`. ¿Cómo estructuras registros en Python y empaquetas el entorno con `uv` para que cualquier persona lo ejecute con un solo comando?',

  objectives: [
    'Representar filas, registros clave-valor y valores únicos mediante listas (`list`), diccionarios (`dict`) y conjuntos (`set`) en Python.',
    'Escribir funciones puras con anotaciones de tipo básicas para validar registros antes de agregarlos.',
    'Gestionar entornos virtuales aislados y dependencias exactas usando `uv` (`pyproject.toml`, `uv.lock` y `uv run`).'
  ],

  sections: [
    {
      id: 'colecciones-nativas-para-representar-filas-y-reg',
      heading: 'Listas, diccionarios y conjuntos para modelar datos en memoria',
      body: 'Antes de usar bibliotecas tabulares como Polars o pandas, necesitas manejar con soltura las tres estructuras de datos nativas de Python que aparecen en todo flujo de ingesta y configuración.\n\nUna lista (`list`, escrita con corchetes `[10, 20, 30]`) guarda una secuencia ordenada de elementos donde puede haber duplicados; sirve para recorrer lotes de filas. Un diccionario (`dict`, escrito con llaves `{"sku": "MB-CAF-001", "list_price_usd": 39.76}`) asocia claves únicas con sus valores; es la representación directa de una fila o de un objeto JSON. Un conjunto (`set`, como `{"Molinos", "Cafeteras"}`) elimina duplicados automáticamente y comprueba si un código existe con operador `in` de forma instantánea.',
      example: {
        language: 'python',
        code: '# Lista de diccionarios representando filas de products en Mercado Brisa\nproductos = [\n    {"product_id": 1, "sku": "MB-CAF-001", "category": "Café en grano", "list_price_usd": 39.76},\n    {"product_id": 2, "sku": "MB-MOL-002", "category": "Molinos", "list_price_usd": 226.17},\n    {"product_id": 180, "sku": "SKU-TEST-NEG", "category": "Accesorios", "list_price_usd": -9.99},\n]\n\n# Extraer conjunto de categorías únicas y detectar precios negativos\ncategorias_unicas = {p["category"] for p in productos}\nanomalias = [p["sku"] for p in productos if p["list_price_usd"] <= 0]',
        expectedOutput: [
          {
            product_id: 1,
            sku: 'MB-CAF-001',
            product_name: 'Café en grano Chiapas Serie 1',
            category: 'Café en grano',
            list_price_usd: 39.76,
            is_active: true
          },
          {
            product_id: 2,
            sku: 'MB-MOL-002',
            product_name: 'Molinos Antigua Serie 2',
            category: 'Molinos',
            list_price_usd: 226.17,
            is_active: true
          },
          {
            product_id: 180,
            sku: 'SKU-TEST-NEG',
            product_name: 'Producto de prueba calibración POS (no vender)',
            category: 'Accesorios',
            list_price_usd: -9.99,
            is_active: false
          }
        ]
      }
    },
    {
      id: 'funciones-puras-y-filtrado-de-anomalias-en-pytho',
      heading: 'Funciones pequeñas y predecibles para limpiar registros',
      body: 'Cuando una regla de negocio se repite en varios scripts, copiar y pegar la condición `if` termina provocando discrepancias. En su lugar, encapsula la regla en una función con `def`.\n\nUna función bien diseñada para datos recibe los valores por sus parámetros y devuelve un resultado nuevo con `return`, sin alterar variables globales fuera de ella. Por ejemplo, en el catálogo de Mercado Brisa conviven 170 productos activos con precios válidos y artículos inactivos o de calibración como `SKU-TEST-NEG` (`-9.99` USD). Definir `es_sku_comercial(registro)` permite aplicar exactamente el mismo filtro antes de calcular el precio promedio por categoría.',
      example: {
        language: 'python',
        code: 'def es_sku_comercial(producto: dict) -> bool:\n    """Devuelve True solo si el SKU está activo y tiene precio positivo."""\n    return bool(producto.get("is_active")) and float(producto.get("list_price_usd", 0)) > 0.0\n\n# Filtrar el catálogo antes de resumir precios por categoría\nvalidos = [p for p in catalogo if es_sku_comercial(p)]',
        expectedOutput: [
          {
            category: 'Accesorios',
            skus_activos_validos: 34,
            precio_min_usd: 11.92,
            precio_promedio_usd: 40.97,
            precio_max_usd: 66.28
          },
          {
            category: 'Cafeteras',
            skus_activos_validos: 34,
            precio_min_usd: 38.9,
            precio_promedio_usd: 116.48,
            precio_max_usd: 191.62
          },
          {
            category: 'Café en grano',
            skus_activos_validos: 34,
            precio_min_usd: 15.25,
            precio_promedio_usd: 29.32,
            precio_max_usd: 41.35
          },
          {
            category: 'Molinos',
            skus_activos_validos: 34,
            precio_min_usd: 69.7,
            precio_promedio_usd: 152.83,
            precio_max_usd: 237.01
          },
          {
            category: 'Suscripciones',
            skus_activos_validos: 34,
            precio_min_usd: 24.62,
            precio_promedio_usd: 47.94,
            precio_max_usd: 74.47
          }
        ]
      }
    },
    {
      id: 'entornos-reproducibles-con-uv-pyproject-y-uv-loc',
      heading: 'Entornos virtuales y bloqueo de dependencias con uv',
      body: 'Instalar bibliotecas directamente en el Python del sistema operativo (`pip install polars`) mezcla las versiones de todos tus proyectos. Cuando actualizas una biblioteca para un análisis nuevo, puedes romper un pipeline antiguo.\n\nLa solución estándar es crear un **entorno virtual** por proyecto con `uv`. Al ejecutar `uv init` y `uv add duckdb polars`, la herramienta crea una carpeta `.venv` aislada. También actualiza dos archivos que sí se suben a Git: `pyproject.toml` (que declara qué paquetes pide el proyecto) y `uv.lock` (que fija la versión exacta y el hash criptográfico de cada paquete). Después, cualquier compañero ejecuta `uv run auditar_productos.py` y `uv` sincroniza el entorno exacto en segundos.',
      example: {
        language: 'bash',
        code: '# 1) Inicializar proyecto y declarar dependencias en pyproject.toml + uv.lock\nuv init auditoria-brisa\ncd auditoria-brisa\nuv add duckdb polars\n\n# 2) Ejecutar el script dentro del entorno aislado sin activar .venv a mano\nuv run python auditar_productos.py',
        expectedOutput: [
          {
            archivo_proyecto: 'pyproject.toml',
            versiona_en_git: 'Sí',
            proposito: 'Declara dependencias requeridas (duckdb, polars)'
          },
          {
            archivo_proyecto: 'uv.lock',
            versiona_en_git: 'Sí',
            proposito: 'Fija versiones exactas y hashes para todo el equipo'
          },
          {
            archivo_proyecto: '.venv/',
            versiona_en_git: 'No (en .gitignore)',
            proposito: 'Carpeta local de binarios reconstruida por uv run'
          }
        ]
      }
    }
  ],

  workedExample: {
    title: 'Auditoría reproducible de la categoría Accesorios con Python y uv',
    description: 'Compara qué ocurre al calcular el precio mínimo y medio de la categoría `Accesorios` en `products.parquet` de Mercado Brisa sin filtrar SKUs de prueba ni fijar dependencias, frente a usar una función validadora ejecutada con `uv run`.',
    steps: [
      {
        label: 'Antipatrón: promediar todos los registros sin filtrar inactivos ni precios negativos',
        explanation: 'Si lees los 37 registros de `Accesorios` directamente sin descartar `is_active = false` ni precios menores o iguales a cero, el SKU de calibración `SKU-TEST-NEG` (`-9.99` USD) hunde el mínimo y distorsiona el promedio a `39.88` USD.',
        code: '# MAL: Promediar sin validar reglas de dominio ni aislar dependencias del script\nimport duckdb\n\nres = duckdb.sql("""\n    SELECT category, COUNT(*) AS skus_totales,\n           ROUND(MIN(list_price_usd), 2) AS precio_min_usd,\n           ROUND(AVG(list_price_usd), 2) AS precio_promedio_usd\n    FROM \'public/datasets/products.parquet\'\n    WHERE category = \'Accesorios\'\n    GROUP BY category\n""").fetchall()',
        expectedOutput: [
          {
            category: 'Accesorios',
            skus_totales: 37,
            precio_min_usd: -9.99,
            precio_promedio_usd: 39.88
          }
        ]
      },
      {
        label: 'Solución verificada: filtrar SKUs comerciales activos y ejecutar con uv run',
        explanation: 'Al exigir `is_active = true` y `list_price_usd > 0`, quedan los 34 accesorios comerciales reales de Mercado Brisa: el precio mínimo pasa a ser `11.92` USD y el promedio real sube a `40.97` USD.',
        code: '# CORRECTO: Ejecutar con `uv run` validando estado activo y precio positivo\nimport duckdb\n\nres = duckdb.sql("""\n    SELECT category, COUNT(*) AS skus_validos,\n           ROUND(MIN(list_price_usd), 2) AS precio_min_usd,\n           ROUND(AVG(list_price_usd), 2) AS precio_promedio_usd\n    FROM \'public/datasets/products.parquet\'\n    WHERE category = \'Accesorios\'\n      AND is_active = true\n      AND list_price_usd > 0\n    GROUP BY category\n""").fetchall()',
        expectedOutput: [
          {
            category: 'Accesorios',
            skus_validos: 34,
            precio_min_usd: 11.92,
            precio_promedio_usd: 40.97
          }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: 'Tienes una lista con 18 000 códigos de tienda extraídos de pedidos y quieres obtener rápidamente la colección de códigos únicos sin duplicados. ¿Qué estructura nativa de Python resuelve esto directamente?',
      options: [
        {
          id: 'a',
          text: 'Un conjunto (`set`), porque descarta duplicados automáticamente y verifica pertenencia en tiempo constante.',
          correct: true,
          feedback: 'Exacto. Convertir la lista con `set(codigos)` conserva únicamente los valores distintos.'
        },
        {
          id: 'b',
          text: 'Una lista (`list`), porque impide agregar dos veces el mismo texto.',
          correct: false,
          feedback: 'Las listas mantienen el orden de inserción y permiten todos los elementos repetidos que agregues.'
        },
        {
          id: 'c',
          text: 'Un número entero (`int`), porque resume los textos por orden alfabético.',
          correct: false,
          feedback: 'Un entero solo almacena un valor numérico escalar, no una colección de códigos.'
        }
      ],
      explanation: 'Los conjuntos (`set`) almacenan elementos únicos mediante una tabla hash, por lo que eliminan duplicados al instante y responden consultas `x in conjunto` sin recorrer toda la colección.'
    },
    {
      id: 'c2',
      type: 'mcq',
      prompt: 'En un proyecto gestionado con `uv`, ¿qué archivos debes confirmar en Git y cuál debes ignorar en `.gitignore` para que tu equipo reproduzca exactamente las mismas versiones?',
      options: [
        {
          id: 'a',
          text: 'Subir `pyproject.toml` y `uv.lock` a Git, e ignorar la carpeta `.venv/` en `.gitignore`.',
          correct: true,
          feedback: 'Correcto. `pyproject.toml` y `uv.lock` son archivos de texto ligeros que permiten a `uv` reconstruir `.venv/` idéntico en cualquier sistema operativo.'
        },
        {
          id: 'b',
          text: 'Subir la carpeta `.venv/` completa a Git y borrar `pyproject.toml`.',
          correct: false,
          feedback: 'Incorrecto. `.venv/` pesa cientos de megabytes y contiene binarios compilados para un sistema operativo específico.'
        },
        {
          id: 'c',
          text: 'Ignorar los tres archivos y pedir por chat que cada persona ejecute `pip install` a mano.',
          correct: false,
          feedback: 'Incorrecto. Instalar a mano sin archivo de bloqueo provoca que cada integrante tenga versiones distintas.'
        }
      ],
      explanation: 'El archivo `pyproject.toml` declara las dependencias del proyecto y `uv.lock` congela las versiones exactas; la carpeta `.venv/` se recrea localmente con `uv run` o `uv sync`.'
    },
    {
      id: 'c3',
      type: 'predict-output',
      prompt: 'Observa este código sobre un registro de `stores`: `tienda = {"store_code": "STR-MX-01", "area_sqm": 620}`. ¿Qué devuelve `tienda.get("telefono", "Sin teléfono")`?',
      options: [
        {
          id: 'a',
          text: 'Devuelve `"Sin teléfono"` sin lanzar error, porque la clave `"telefono"` no existe en el diccionario.',
          correct: true,
          feedback: 'Correcto. El método `.get(clave, valor_por_defecto)` evita que el programa se detenga con `KeyError` cuando falta un campo opcional.'
        },
        {
          id: 'b',
          text: 'Detiene el programa con `KeyError: \'telefono\'`.',
          correct: false,
          feedback: 'Eso ocurre cuando accedes con corchetes directos `tienda["telefono"]`, pero no al usar `.get()`.'
        },
        {
          id: 'c',
          text: 'Devuelve `620`, que es el último valor del diccionario.',
          correct: false,
          feedback: '`.get()` busca por el nombre exacto de la clave, no por la posición final.'
        }
      ],
      explanation: 'Acceder a un diccionario con `.get(clave, defecto)` es una práctica defensiva muy útil cuando procesas registros JSON o filas donde algunas claves opcionales pueden no venir.'
    }
  ],

  practice: {
    type: 'fill-blanks',
    title: 'Configuración de entorno con uv y filtrado de productos válidos',
    language: 'python',
    prompt: 'Completa los comandos y la función en Python para agregar `duckdb` al proyecto con `uv`, filtrar los productos activos de Mercado Brisa cuyo `list_price_usd` sea mayor que cero y ejecutar el script dentro del entorno aislado.',
    starterCode: '# En la terminal: registrar la dependencia duckdb en pyproject.toml y uv.lock\n# uv {{blank_1}} duckdb\n\ndef filtrar_catalogo_comercial(productos: list[dict]) -> list[dict]:\n    return [\n        p for p in productos\n        if p.get("is_active") and p["{{blank_2}}"] > 0\n    ]\n\n# En la terminal: ejecutar el script usando el entorno virtual del proyecto\n# uv {{blank_3}} auditar_catalogo.py',
    expected: '# En la terminal: registrar la dependencia duckdb en pyproject.toml y uv.lock\n# uv add duckdb\n\ndef filtrar_catalogo_comercial(productos: list[dict]) -> list[dict]:\n    return [\n        p for p in productos\n        if p.get("is_active") and p["list_price_usd"] > 0\n    ]\n\n# En la terminal: ejecutar el script usando el entorno virtual del proyecto\n# uv run auditar_catalogo.py',
    orderMatters: true,
    hints: [
      'En `uv`, el subcomando que instala un paquete y lo anota en `pyproject.toml` y `uv.lock` es `add`.',
      'En la tabla `products` de Mercado Brisa, la columna con el precio de lista en dólares se llama `list_price_usd`.',
      'Para correr un script dentro del entorno gestionado por `uv` sin activarlo manualmente, usa `uv run`.'
    ],
    solution: '# En la terminal: registrar la dependencia duckdb en pyproject.toml y uv.lock\n# uv add duckdb\n\ndef filtrar_catalogo_comercial(productos: list[dict]) -> list[dict]:\n    return [\n        p for p in productos\n        if p.get("is_active") and p["list_price_usd"] > 0\n    ]\n\n# En la terminal: ejecutar el script usando el entorno virtual del proyecto\n# uv run auditar_catalogo.py',
    solutionExplanation: '`uv add duckdb` declara y bloquea la dependencia; la comprensión de lista descarta SKUs inactivos o con precio negativo como `SKU-TEST-NEG` (`-9.99`); y `uv run` ejecuta el script en el entorno exacto del proyecto.',
    blanks: [
      {
        id: 'blank_1',
        label: 'Subcomando de uv para añadir un paquete',
        correct: 'add',
        options: ['add', 'init', 'status'],
        hint: '`uv add <paquete>` agrega la dependencia a `pyproject.toml` y actualiza `uv.lock`.'
      },
      {
        id: 'blank_2',
        label: 'Clave del precio de lista en products',
        correct: 'list_price_usd',
        options: ['list_price_usd', 'sku', 'category'],
        hint: 'Necesitas comparar que el precio de lista (`list_price_usd`) sea mayor que `0`.'
      },
      {
        id: 'blank_3',
        label: 'Subcomando de uv para ejecutar un script',
        correct: 'run',
        options: ['run', 'lock', 'branch'],
        hint: '`uv run <script.py>` sincroniza el entorno virtual y ejecuta el comando dentro de él.'
      }
    ],
    expectedOutputTable: [
      {
        category: 'Accesorios',
        skus_activos_validos: 34,
        precio_min_usd: 11.92,
        precio_promedio_usd: 40.97
      },
      {
        category: 'Cafeteras',
        skus_activos_validos: 34,
        precio_min_usd: 38.9,
        precio_promedio_usd: 116.48
      },
      {
        category: 'Café en grano',
        skus_activos_validos: 34,
        precio_min_usd: 15.25,
        precio_promedio_usd: 29.32
      },
      {
        category: 'Molinos',
        skus_activos_validos: 34,
        precio_min_usd: 69.7,
        precio_promedio_usd: 152.83
      },
      {
        category: 'Suscripciones',
        skus_activos_validos: 34,
        precio_min_usd: 24.62,
        precio_promedio_usd: 47.94
      }
    ]
  },

  roleNotes: {
    de: 'Empaqueta cada conector y tarea de transformación con su propio `pyproject.toml` y `uv.lock` para que el contenedor en la nube instale exactamente los mismos paquetes que probaste en local.',
    da: 'Usa `uv run` en tus proyectos de análisis para que cualquier colega pueda reproducir tus cálculos estadísticos y gráficos meses después sin conflictos de versiones.',
    bi: 'Aísla en funciones puras de Python los scripts que preparan o validan catálogos como `products.parquet` antes de publicarlos hacia el modelo semántico, y fija siempre el entorno con `uv.lock` para evitar discrepancias.'
  },

  summary: [
    'En Python, usa listas (`list`) para secuencias de filas, diccionarios (`dict`) para registros clave-valor y conjuntos (`set`) para valores únicos.',
    'Encapsula las reglas de limpieza en funciones pequeñas que reciban datos y devuelvan resultados sin efectos colaterales.',
    'Nunca instales paquetes de datos en el Python global del sistema; usa un entorno virtual por proyecto.',
    'Con `uv init`, `uv add` y `uv run`, el archivo `uv.lock` garantiza que todo el equipo ejecute las mismas versiones.'
  ],

  flashcards: [
    {
      id: 'fc-c0-herr-03-a',
      front: '¿Cuándo conviene usar un diccionario (`dict`) y cuándo un conjunto (`set`) al procesar datos en Python?',
      back: 'Usa `dict` para representar un registro con pares clave-valor (como una fila con nombres de columna) y `set` para guardar valores únicos y comprobar pertenencia rápido.'
    },
    {
      id: 'fc-c0-herr-03-b',
      front: '¿Qué diferencia hay entre `pyproject.toml` y `uv.lock`?',
      back: '`pyproject.toml` declara las dependencias que pide tu proyecto; `uv.lock` registra las versiones exactas y hashes de todos los paquetes instalados.'
    },
    {
      id: 'fc-c0-herr-03-c',
      front: '¿Por qué es más seguro leer una clave opcional de un diccionario con `d.get("campo")` que con `d["campo"]`?',
      back: 'Porque si la clave no existe, `d["campo"]` lanza un `KeyError` que detiene la ejecución, mientras que `d.get("campo")` devuelve `None` o el valor por defecto indicado.'
    }
  ],

  glossaryTerms: [
    'entorno-virtual-python',
    'ruta-relativa-absoluta'
  ],

  sources: [
    {
      title: 'Python 3.14 Official Tutorial — Chapter 5: Data Structures',
      url: 'https://docs.python.org/3/tutorial/datastructures.html',
      publisher: 'Python Software Foundation',
      accessed: '2026-10-29',
      supports: 'Operaciones sobre listas, comprensiones de listas, conjuntos (set) y diccionarios (dict).'
    },
    {
      title: 'Astral uv Documentation — Working on Projects',
      url: 'https://docs.astral.sh/uv/guides/projects/',
      publisher: 'Astral',
      accessed: '2026-10-29',
      supports: 'Estructura de proyectos con pyproject.toml, archivo de bloqueo uv.lock, entorno .venv y ejecución con uv run.'
    },
    {
      title: 'PEP 723 — Inline Script Metadata',
      url: 'https://peps.python.org/pep-0723/',
      publisher: 'Python Software Foundation',
      accessed: '2026-10-29',
      supports: 'Estándar para declarar dependencias de scripts autónomos ejecutables de forma reproducible.'
    },
    {
      title: 'Python Packaging User Guide — Managing Dependencies',
      url: 'https://packaging.python.org/en/latest/tutorials/managing-dependencies/',
      publisher: 'Python Packaging Authority (PyPA)',
      accessed: '2026-10-29',
      supports: 'Aislamiento de entornos virtuales y reproducibilidad entre máquinas mediante archivos de bloqueo.'
    }
  ],

  aiNotes: 'Quienes vienen de hojas de cálculo suelen confundir una lista de diccionarios con un único diccionario gigante, o intentan subir la carpeta `.venv` a Git. Recuérdales que cada fila es un `dict` dentro de una `list` y que `.venv` nunca se versiona porque `uv.lock` basta para recrearla.'
};

export default lesson;
