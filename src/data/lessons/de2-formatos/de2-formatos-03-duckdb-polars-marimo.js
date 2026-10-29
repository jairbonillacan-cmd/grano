// Lección migrada al esquema v2 mediante scripts/migrate-legacy.mjs
const lesson = {
  "id": "de2-formatos-03-duckdb-polars-marimo",
  "moduleId": "de2-formatos",
  "tracks": [
    "de"
  ],
  "level": 2,
  "order": 3,
  "title": "Ejecución local con DuckDB, Polars perezoso y Marimo",
  "minutes": 30,
  "prerequisites": [
    "de2-formatos-02-arrow-lance-vortex"
  ],
  "contentVersion": 1,
  "hook": "En Mercado Brisa (empresa ficticia), un proceso diario de 45 GB de ventas corría en un clúster de 8 nodos: tardaba 7 minutos en arrancar máquinas y 9 minutos enviando datos por red. Además, los cuadernos Jupyter fallaban cuando alguien ejecutaba celdas fuera de orden dejando estado oculto. Al pasar a DuckDB, Polars en modo perezoso (`scan_parquet`) y Marimo en una sola máquina, terminó en 19 segundos. ¿Cuándo basta un solo nodo y cómo evita la ejecución perezosa agotar la RAM?",
  "objectives": [
    "Dimensionar cuándo una carga analítica cabe en un motor local multiproceso (DuckDB / Polars) sin pagar el costo de red de un clúster.",
    "Reemplazar lecturas ansiosas (`read_parquet`) por planes perezosos (`scan_parquet` + `.collect()`) con poda de predicados y columnas.",
    "Construir cuadernos reproducibles basados en un grafo reactivo acíclico (Marimo) sin estado oculto entre celdas."
  ],
  "sections": [
    {
      "id": "escalamiento-vertical-local-cuando-basta-un-solo",
      "heading": "Escalamiento vertical local: cuándo basta un solo nodo",
      "body": "Durante una década se asumió que cualquier dataset de más de 5 GB requería un clúster distribuido (Spark, Presto) con toda su complejidad de red, serialización JVM y tiempos de arranque. Pero el hardware cambió: hoy una sola instancia en la nube o estación de trabajo lee discos NVMe a **7 GB/s** y cuenta con entre 16 y 64 núcleos con instrucciones SIMD.\nPara el **90% de las cargas analíticas corporativas** (datasets activos de hasta 100 GB – 500 GB por ejecución), un motor columnar in-process escrito en C++ o Rust (**DuckDB 1.x** o **Polars**) corriendo en un solo nodo es más rápido, más simple de depurar y hasta un 85% más barato porque elimina el *Network Shuffle* entre servidores.",
      "interactive": {
        "component": "row-vs-columnar-storage",
        "caption": "Simulador interactivo: Ejecución local con DuckDB, Polars perezoso y Marimo"
      }
    },
    {
      "id": "paralelismo-por-fragmentos-morsel-driven-en-duck",
      "heading": "Paralelismo por fragmentos (morsel-driven) en DuckDB",
      "body": "**DuckDB** es un motor SQL OLAP embebido (corre dentro de tu proceso Python, Node, R o directamente en el navegador vía **DuckDB-Wasm** sin instalar servidores). Su arquitectura se basa en **Morsel-Driven Parallelism**: divide el trabajo en fragmentos de ~100,000 filas (*morsels*) que reparte dinámicamente entre todos los hilos del CPU evitando bloqueos.\nSi una consulta (un `GROUP BY` o `JOIN` masivo) supera la memoria RAM disponible, el gestor de buffers de DuckDB 1.x vuelca automáticamente las particiones intermedias a disco (**Out-of-Core Spilling**) y las procesa en streaming, permitiéndote agregar un archivo Parquet de 120 GB en una portátil con solo 16 GB de RAM.",
      "example": {
        "language": "sql",
        "code": "# EXCELENTE: 1) pl.scan_parquet() solo registra el plan lógico (0 MB leídos aún).\n# 2) El optimizador empuja el filtro y las 3 columnas hasta el archivo Parquet.\n# 3) DuckDB o Polars ejecutan en streaming respetando el límite de RAM.\nimport polars as pl\nimport duckdb\n\nlf_eventos = (\n    pl.scan_parquet(\"s3://lakehouse/silver/eventos_80gb.parquet\")\n    .filter(pl.col(\"event_year\") == 2026)\n    .select([\"region\", \"channel\", \"net_revenue_usd\"])\n)\n\n# Consulta SQL en DuckDB directamente sobre el LazyFrame de Polars (Zero-Copy):\nres_pl = duckdb.sql(\"\"\"\n    SELECT\n      region,\n      channel,\n      SUM(net_revenue_usd) AS revenue_total_usd,\n      APPROX_QUANTILE(net_revenue_usd, 0.95) AS p95_ticket_usd\n    FROM lf_eventos\n    GROUP BY ALL\n    ORDER BY revenue_total_usd DESC\n\"\"\").pl()",
        "expectedOutput": [
          {
            "consumo_pico_ram": "680 MB (Ejecución por lotes en streaming)",
            "optimizacion_previa": "Predicate + Projection Pushdown activos",
            "estado_ejecucion": "Completado en 1.85 seg"
          }
        ]
      }
    },
    {
      "id": "evaluacion-inmediata-frente-a-evaluacion-perezos",
      "heading": "Evaluación inmediata frente a evaluación perezosa en Polars",
      "body": "En `pandas` (o en Polars modo Eager `pl.read_parquet()`), cada línea de código se ejecuta de inmediato a ciegas: primero carga toda la tabla en RAM, luego filtra, luego borra columnas, creando múltiples copias pesadas en el camino.\nEn **Polars Lazy API (`pl.scan_parquet()`)**, escribir `.filter(...)`, `.with_columns(...)` y `.select(...)` no toca ni un byte del disco: construye un **Grafo Lógico de Consulta**. Cuando finalmente llamas a `.collect(engine=\"streaming\")`, el optimizador de consultas de Polars:\n1) Empuja los filtros `WHERE` hasta el lector Parquet (**Predicate Pushdown**).\n2) Descarta todas las columnas que no se usan al final (**Projection Pushdown**).\n3) Fusiona expresiones en una sola pasada por lotes en streaming."
    },
    {
      "id": "cuadernos-reactivos-como-grafos-aciclicos-en-mar",
      "heading": "Cuadernos reactivos como grafos acíclicos en Marimo",
      "body": "El talón de Aquiles de los notebooks tradicionales (`.ipynb`) en Análisis de Datos y BI es el **estado oculto**: si defines `umbral = 100` en la Celda 1, calculas `clientes_vip` en la Celda 2, y luego cambias `umbral = 500` en la Celda 1 sin volver a ejecutar la Celda 2, la pantalla muestra números contradictorios. Además, los archivos `.ipynb` son bloques JSON gigantes con imágenes incrustadas que producen conflictos imposibles de revisar en `git diff`.\n**Marimo** resuelve ambos problemas de raíz:\n- **Reactividad determinista (DAG de celdas)**: Marimo analiza qué variables define y consume cada celda. Cuando cambias un parámetro o un slider interactivo en una celda, Marimo **re-ejecuta automáticamente en orden topológico todas las celdas dependientes** (igual que una hoja de cálculo reactiva o un DAG de dbt).\n- **Archivos `.py` puros versionables en Git**: Un notebook Marimo se guarda como un script Python limpio (`.py`), ejecutable como pipeline desde la terminal (`python analisis.py`), como app interactiva (`marimo run analisis.py`) y 100% auditable en Pull Requests."
    }
  ],
  "workedExample": {
    "title": "Ejemplo guiado: Ejecución local con DuckDB, Polars perezoso y Marimo",
    "description": "Compara el enfoque tradicional Eager en Pandas (que agota la RAM cargando todo el archivo) frente al pipeline híbrido Polars Lazy + DuckDB 1.x en streaming:",
    "audit": "",
    "steps": [
      {
        "label": "Antipatrón: lectura inmediata completa en memoria RAM",
        "explanation": "Compara el enfoque tradicional Eager en Pandas (que agota la RAM cargando todo el archivo) frente al pipeline híbrido Polars Lazy + DuckDB 1.x en streaming:",
        "code": "# MAL: 1) pd.read_parquet() intenta descomprimir las 50 columnas completas en RAM de golpe.\n# 2) Crea copias intermedias del DataFrame en cada paso antes de agrupar.\nimport pandas as pd\n\ndf_all = pd.read_parquet(\"s3://lakehouse/silver/eventos_80gb.parquet\")\ndf_filtered = df_all[df_all[\"event_year\"] == 2026]\ndf_clean = df_filtered[[\"region\", \"channel\", \"net_revenue_usd\"]]\nres = df_clean.groupby([\"region\", \"channel\"])[\"net_revenue_usd\"].sum()",
        "expectedOutput": [
          {
            "consumo_pico_ram": "92.0 GB (Crash por OOM en nodo de 16 GB)",
            "optimizacion_previa": "Ninguna (Lee 50 columnas antes de filtrar)",
            "estado_ejecucion": "MemoryError"
          }
        ]
      },
      {
        "label": "Solución óptima: escaneo perezoso en Polars y flujo en DuckDB",
        "explanation": "Compara ahora la consulta corregida y verifica cómo las filas y totales coinciden con la auditoría.",
        "code": "# EXCELENTE: 1) pl.scan_parquet() solo registra el plan lógico (0 MB leídos aún).\n# 2) El optimizador empuja el filtro y las 3 columnas hasta el archivo Parquet.\n# 3) DuckDB o Polars ejecutan en streaming respetando el límite de RAM.\nimport polars as pl\nimport duckdb\n\nlf_eventos = (\n    pl.scan_parquet(\"s3://lakehouse/silver/eventos_80gb.parquet\")\n    .filter(pl.col(\"event_year\") == 2026)\n    .select([\"region\", \"channel\", \"net_revenue_usd\"])\n)\n\n# Consulta SQL en DuckDB directamente sobre el LazyFrame de Polars (Zero-Copy):\nres_pl = duckdb.sql(\"\"\"\n    SELECT\n      region,\n      channel,\n      SUM(net_revenue_usd) AS revenue_total_usd,\n      APPROX_QUANTILE(net_revenue_usd, 0.95) AS p95_ticket_usd\n    FROM lf_eventos\n    GROUP BY ALL\n    ORDER BY revenue_total_usd DESC\n\"\"\").pl()",
        "expectedOutput": [
          {
            "consumo_pico_ram": "680 MB (Ejecución por lotes en streaming)",
            "optimizacion_previa": "Predicate + Projection Pushdown activos",
            "estado_ejecucion": "Completado en 1.85 seg"
          }
        ]
      }
    ]
  },
  "checks": [
    {
      "id": "c1",
      "type": "mcq",
      "prompt": "¿Qué problema crítico resuelve un cuaderno reactivo basado en un grafo acíclico dirigido (como **Marimo**) frente a un notebook tradicional `.ipynb` cuando un equipo de Datos y BI colabora en un análisis financiero?",
      "options": [
        {
          "id": "a",
          "text": "Elimina el estado oculto re-ejecutando automáticamente en orden topológico todas las celdas dependientes cuando cambia una variable, y guarda el código como un archivo `.py` puro limpio para control de versiones en Git y ejecución en producción.",
          "correct": true,
          "feedback": "Exacto. En un `.ipynb` tradicional, ejecutar celdas desordenadas deja variables en memoria que ya no corresponden al código visible. En Marimo el estado en memoria siempre es una función pura y determinista del código visible."
        },
        {
          "id": "b",
          "text": "Impide usar SQL o gráficos dentro del cuaderno.",
          "correct": false,
          "feedback": "Al contrario: Marimo integra celdas SQL nativas (con DuckDB) y componentes visuales interactivos que actualizan variables de Python automáticamente."
        },
        {
          "id": "c",
          "text": "Obliga a subir todos los datos privados de la empresa a un servidor público.",
          "correct": false,
          "feedback": "Marimo se ejecuta 100% localmente en tu entorno Python o contenedor privado sobre tus propios archivos `.py`."
        }
      ],
      "explanation": "Exacto. En un `.ipynb` tradicional, ejecutar celdas desordenadas deja variables en memoria que ya no corresponden al código visible. En Marimo el estado en memoria siempre es una función pura y determinista del código visible."
    },
    {
      "id": "c2",
      "type": "mcq",
      "prompt": "Tienes un archivo Parquet de 30 GB con 80 columnas en una portátil con 16 GB de RAM. En Polars necesitas filtrar un mes y agrupar por 2 columnas. ¿Qué patrón evita un error de memoria (`OutOfMemory`)?",
      "options": [
        {
          "id": "a",
          "text": "Usar pl.scan_parquet(...).filter(...).group_by(...).agg(...).collect(streaming=True)",
          "correct": true,
          "feedback": "Correcto: la API Lazy empuja los predicados y la proyección de 2 columnas al lector Parquet y procesa por lotes sin cargar los 30 GB."
        },
        {
          "id": "b",
          "text": "Usar df = pl.read_parquet(...) y luego borrar las 78 columnas sobrantes con df.drop(...).",
          "correct": false,
          "feedback": "Incorrecto: pl.read_parquet intenta cargar las 80 columnas completas en RAM antes de que se ejecute drop()."
        },
        {
          "id": "c",
          "text": "Convertir primero el archivo Parquet a un diccionario de Python.",
          "correct": false,
          "feedback": "Incorrecto: los objetos nativos de Python multiplican varias veces el consumo de memoria."
        }
      ],
      "explanation": "La evaluación perezosa permite al optimizador de consultas inspeccionar toda la cadena de transformaciones antes de tocar el disco, leyendo solo los bloques y columnas indispensables."
    },
    {
      "id": "c3",
      "type": "mcq",
      "prompt": "¿Qué ventaja aporta que un cuaderno de Marimo se guarde como un archivo `.py` estándar en lugar de un JSON `.ipynb` con salidas binarias incrustadas?",
      "options": [
        {
          "id": "a",
          "text": "Permite revisar diffs limpios en Git, ejecutarlo directamente como script o test de CI y evita conflictos por imágenes base64.",
          "correct": true,
          "feedback": "Correcto: al ser código Python puro sin blobs de salida ni contadores de ejecución mutables, se versiona y prueba como cualquier módulo."
        },
        {
          "id": "b",
          "text": "Hace que las consultas SQL ignoren los tipos de datos.",
          "correct": false,
          "feedback": "Incorrecto: el formato del archivo del cuaderno no desactiva la verificación de tipos de los motores SQL o DataFrame."
        },
        {
          "id": "c",
          "text": "Reemplaza el almacenamiento en Parquet por archivos de texto.",
          "correct": false,
          "feedback": "Incorrecto: Marimo es el entorno de código y reactividad; los datos siguen almacenándose en Parquet o bases analíticas."
        }
      ],
      "explanation": "Guardar los cuadernos como scripts Python puros con dependencias declaradas por un DAG elimina la brecha entre la exploración del analista y la puesta en producción."
    }
  ],
  "practice": {
    "type": "fill-blanks",
    "title": "Evaluación perezosa en Polars sin agotar RAM",
    "language": "sql",
    "prompt": "Completa el código para construir un plan perezoso (`LazyFrame`) sobre un dataset masivo en Parquet, aplicar el filtro de estado activo y materializar el resumen en modo `streaming` para que pueda ejecutarse en un contenedor ligero.",
    "starterCode": "import polars as pl\n\n# 1. Iniciar escaneo perezoso (Lazy) sin cargar el archivo completo en RAM\nplan_optimo = (\n    pl.{{b1}}(\"s3://lakehouse/silver/subscriptions_2026.parquet\")\n    .filter(pl.col(\"status\") == \"ACTIVE\")\n    .group_by(\"plan_tier\")\n    .agg([\n        pl.len().alias(\"active_subs\"),\n        pl.col(\"mrr_usd\").{{b2}}().alias(\"total_mrr_usd\")\n    ])\n)\n\n# 2. Ejecutar el plan optimizado en modo streaming (Out-of-Core)\ndf_resultado = plan_optimo.{{b3}}(engine=\"streaming\")",
    "expected": "import polars as pl\n\n# 1. Iniciar escaneo perezoso (Lazy) sin cargar el archivo completo en RAM\nplan_optimo = (\n    pl.{{b1}}(\"s3://lakehouse/silver/subscriptions_2026.parquet\")\n    .filter(pl.col(\"status\") == \"ACTIVE\")\n    .group_by(\"plan_tier\")\n    .agg([\n        pl.len().alias(\"active_subs\"),\n        pl.col(\"mrr_usd\").{{b2}}().alias(\"total_mrr_usd\")\n    ])\n)\n\n# 2. Ejecutar el plan optimizado en modo streaming (Out-of-Core)\ndf_resultado = plan_optimo.{{b3}}(engine=\"streaming\")",
    "orderMatters": true,
    "hints": [
      "Función de lectura perezosa en Polars: A diferencia de `read_parquet` (Eager), `scan_parquet` crea un `LazyFrame` que optimiza toda la consulta antes de tocar el disco.",
      "Agregación de suma en Polars: Usa el método `.sum()` sobre la expresión `pl.col(\"mrr_usd\")` para sumar el ingreso recurrente mensual.",
      "Método para materializar el LazyFrame: En Polars Lazy, el grafo de consulta se compila y ejecuta al invocar `.collect(engine=\"streaming\")`."
    ],
    "solution": "import polars as pl\n\n# 1. Iniciar escaneo perezoso (Lazy) sin cargar el archivo completo en RAM\nplan_optimo = (\n    pl.{{b1}}(\"s3://lakehouse/silver/subscriptions_2026.parquet\")\n    .filter(pl.col(\"status\") == \"ACTIVE\")\n    .group_by(\"plan_tier\")\n    .agg([\n        pl.len().alias(\"active_subs\"),\n        pl.col(\"mrr_usd\").{{b2}}().alias(\"total_mrr_usd\")\n    ])\n)\n\n# 2. Ejecutar el plan optimizado en modo streaming (Out-of-Core)\ndf_resultado = plan_optimo.{{b3}}(engine=\"streaming\")",
    "solutionExplanation": "Inicia el pipeline con `pl.scan_parquet()` para habilitar el optimizador de consultas (Predicate y Projection Pushdown). Expresa las agregaciones con métodos nativos vectorizados de Polars (`.sum()`, `pl.len()`). Materializa el `LazyFrame` con `.collect(engine=\"streaming\")` para acotar el uso de memoria RAM.",
    "blanks": [
      {
        "id": "b1",
        "placeholder": "Función de lectura perezosa en Polars",
        "acceptedAnswers": [
          "scan_parquet"
        ],
        "hint": "A diferencia de `read_parquet` (Eager), `scan_parquet` crea un `LazyFrame` que optimiza toda la consulta antes de tocar el disco."
      },
      {
        "id": "b2",
        "placeholder": "Agregación de suma en Polars",
        "acceptedAnswers": [
          "sum"
        ],
        "hint": "Usa el método `.sum()` sobre la expresión `pl.col(\"mrr_usd\")` para sumar el ingreso recurrente mensual."
      },
      {
        "id": "b3",
        "placeholder": "Método para materializar el LazyFrame",
        "acceptedAnswers": [
          "collect"
        ],
        "hint": "En Polars Lazy, el grafo de consulta se compila y ejecuta al invocar `.collect(engine=\"streaming\")`."
      }
    ],
    "expectedOutputTable": [
      {
        "plan_tier": "Enterprise",
        "active_subs": 1420,
        "total_mrr_usd": "$708,580.00"
      },
      {
        "plan_tier": "Growth",
        "active_subs": 8650,
        "total_mrr_usd": "$856,350.00"
      },
      {
        "plan_tier": "Starter",
        "active_subs": 24100,
        "total_mrr_usd": "$698,900.00"
      }
    ],
    "rubricCriteria": [
      "Inicia el pipeline con `pl.scan_parquet()` para habilitar el optimizador de consultas (Predicate y Projection Pushdown).",
      "Expresa las agregaciones con métodos nativos vectorizados de Polars (`.sum()`, `pl.len()`).",
      "Materializa el `LazyFrame` con `.collect(engine=\"streaming\")` para acotar el uso de memoria RAM."
    ]
  },
  "roleNotes": {
    "de": "Ejecuta transformaciones Silver/Gold ligeras y medianas (<500 GB) en contenedores serverless usando DuckDB o Polars Lazy, eliminando costos ociosos de clústeres JVM. Integra scripts de Marimo (`.py`) directamente en el CI/CD y en el orquestador (Dagster / Airflow) sin tener que reescribir el código de los analistas. Configura límites explícitos de memoria y directorio temporal (`SET memory_limit = '12GB'`, `SET temp_directory = '/nvme/tmp'`) para garantizar ejecuciones Out-of-Core seguras.",
    "da": "Inicia siempre sus pipelines con `pl.scan_parquet()` en lugar de `read_parquet()`, encadenando filtros y transformaciones antes de materializar con `.collect(engine=\"streaming\")`. Combina en un mismo cuaderno **Marimo** expresiones programáticas de Polars con bloques SQL nativos de DuckDB sobre el mismo LazyFrame sin duplicar memoria. Garantiza reproducibilidad científica total: ningún análisis entregado a negocio depende del orden manual en que se presionó `Shift+Enter`.",
    "bi": "Publica cuadernos Marimo en modo aplicación (`marimo run --headless`) o compila tableros con **DuckDB-Wasm** para ofrecer simuladores de escenarios de negocio en vivo. Audita en Pull Requests de Git la lógica exacta de las consultas que alimentan los reportes ejecutivos gracias a que viven en archivos `.py` y `.sql` limpios. Pre-calcula cubos Parquet compactos con DuckDB para que los dashboards carguen en menos de 100 milisegundos."
  },
  "summary": [
    "Para conjuntos de decenas de gigabytes, el costo de red de un clúster supera al cómputo local vectorizado.",
    "DuckDB procesa datos mayores que la RAM en fragmentos (morsels) volcando intermedios a disco.",
    "En Polars, scan_parquet optimiza el plan completo antes de leer disco; read_parquet carga todo de golpe.",
    "Marimo modela las celdas como un DAG reactivo y reproducible almacenado como script .py puro."
  ],
  "flashcards": [
    {
      "id": "fc-de2-local-01",
      "front": "¿Por qué `pl.scan_parquet()` consume mucha menos RAM que `pl.read_parquet()` antes de un filtro y selección?",
      "back": "Porque `scan_parquet` construye un plan lógico y empuja el filtro y las columnas al lector Parquet; `read_parquet` materializa toda la tabla primero."
    },
    {
      "id": "fc-de2-local-02",
      "front": "¿Qué es la ejecución guiada por fragmentos (morsel-driven parallelism) en DuckDB?",
      "back": "Divide las tablas en lotes de ~100 000 filas que los hilos de CPU toman dinámicamente con robo de trabajo y vuelcan a disco si superan la RAM."
    },
    {
      "id": "fc-de2-local-03",
      "front": "¿Cómo impide Marimo el problema del estado oculto que ocurre en los cuadernos Jupyter tradicionales?",
      "back": "Analiza estáticamente qué variables define y consume cada celda, prohíbe redefinir variables globales y reejecuta en orden topológico las celdas dependientes."
    }
  ],
  "glossaryTerms": [
    "c15-duckdb-polars-lazy",
    "c16-duckdb-wasm-bi"
  ],
  "sources": [
    {
      "title": "DuckDB Documentation — Why DuckDB and Out-of-Core Execution",
      "url": "https://duckdb.org/why_duckdb.html",
      "publisher": "DuckDB Foundation",
      "accessed": "2026-10-29",
      "supports": "Ejecución vectorizada en proceso y gestión de memoria más allá de la RAM en un solo nodo."
    },
    {
      "title": "Polars User Guide — Lazy API and Query Optimization",
      "url": "https://docs.pola.rs/user-guide/lazy/",
      "publisher": "Polars Project",
      "accessed": "2026-10-29",
      "supports": "Diferencia entre evaluación ansiosa y perezosa, predicate pushdown y projection pushdown."
    },
    {
      "title": "Marimo Documentation — Reactive Execution and Reproducible Python Notebooks",
      "url": "https://docs.marimo.io/guides/reactivity/",
      "publisher": "Marimo Team",
      "accessed": "2026-10-29",
      "supports": "Ejecución determinista guiada por grafo acíclico dirigido (DAG) en archivos Python puros."
    }
  ],
  "aiNotes": "El error común es mezclar `pl.read_parquet` con transformaciones pesadas o creer que cualquier tarea de 20 GB necesita Spark. Anima a verificar primero cuánto pesan las columnas realmente proyectadas tras aplicar predicate y projection pushdown.",
  "needsReview": true,
  "legacyId": "l9-duckdb-polars-marimo",
  "legacyOrder": 9,
  "stageId": "stage-3",
  "subtitle": "Procesamiento analítico en un solo nodo, evaluación perezosa y cuadernos reactivos reproducibles en Git.",
  "goal": "Aplicar la API Lazy de Polars (`scan_parquet`) junto con el motor SQL paralelizado de DuckDB 1.x para procesar datasets mayores que la RAM, y estructurar análisis reproducibles en cuadernos reactivos con Marimo.",
  "pipelineChallenge": {
    "title": "Consulta perezosa reactiva en Marimo y DuckDB",
    "scenario": "Ordena los 4 pasos que ocurren cuando un analista modifica un filtro en un cuaderno reactivo Marimo conectado a Polars Lazy y DuckDB sobre un archivo Parquet de 80 GB.",
    "steps": [
      {
        "id": "step-1",
        "label": "1. Actualización reactiva del grafo de celdas en Marimo",
        "role": "DA",
        "detail": "Al cambiar el selector de fecha o región, Marimo identifica mediante su grafo estático qué celdas dependen del parámetro y las marca para re-ejecución determinista."
      },
      {
        "id": "step-2",
        "label": "2. Construcción y optimización del plan lógico de consulta",
        "role": "DA",
        "detail": "Polars y DuckDB combinan los filtros y selecciones en un árbol lógico, eliminando columnas no referenciadas y empujando predicados hacia la fuente."
      },
      {
        "id": "step-3",
        "label": "3. Ejecución paralela por fragmentos y volcado a disco",
        "role": "DE",
        "detail": "El motor lee únicamente los Row Groups válidos en lotes pequeños que caben en RAM, usando todos los núcleos del CPU y volcando a disco NVMe si una agregación excede el límite."
      },
      {
        "id": "step-4",
        "label": "4. Renderizado inmediato de la tabla y métricas certificadas",
        "role": "BI",
        "detail": "El resultado agregado final (pocas filas) actualiza automáticamente los gráficos y tablas del cuaderno o app sin discrepancias de estado oculto."
      }
    ],
    "explanation": "La combinación de reactividad determinista (Marimo), optimización perezosa de consultas (Polars Lazy) y ejecución paralelizada Out-of-Core (DuckDB 1.x) permite que un solo nodo ofrezca rendimiento de supercomputadora con reproducibilidad garantizada."
  },
  "relatedLessons": [
    {
      "id": "l7-columnar-parquet",
      "reason": "El optimizador Lazy de Polars y DuckDB empuja tus filtros directamente a los Zone Maps de Parquet."
    },
    {
      "id": "l8-arrow-lance-vortex",
      "reason": "Apache Arrow es el puente Zero-Copy que permite a DuckDB consultar un LazyFrame de Polars sin copiar RAM."
    },
    {
      "id": "l15-bi-tufte-code",
      "reason": "Conecta el flujo reproducible de DuckDB y Marimo con las herramientas declarativas de BI-as-Code."
    }
  ]
};

export default lesson;
