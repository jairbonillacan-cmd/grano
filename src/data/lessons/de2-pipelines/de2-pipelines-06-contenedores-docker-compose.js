const lesson = {
  id: 'de2-pipelines-06-contenedores-docker-compose',
  moduleId: 'de2-pipelines',
  tracks: ['de'],
  level: 2,
  order: 6,
  title: 'Contenedores Docker y compose.yaml para pipelines de datos',
  subtitle: 'Contenedores Docker y compose.yaml para empaquetar pipelines reproducibles',
  minutes: 20,
  prerequisites: ['de2-pipelines-05-orquestacion-airflow-dagster', 'c1-python-05'],
  contentVersion: 2,

  hook: 'El viernes por la tarde, el pipeline de cierre regional de Mercado Brisa pasaba todas las pruebas en la portátil del desarrollador con Python 3.12 y DuckDB 1.2. Sin embargo, al desplegarse en el servidor falló por una librería nativa ausente y luego escribió un reporte regional que incluía pedidos cancelados por carecer de una validación post-ejecución (*smoke test*). ¿Cómo empaquetas el entorno exacto en una imagen inmutable y levantas los servicios con `compose.yaml` verificando invariantes antes de dar por buena la corrida?',

  objectives: [
    'Escribir un `Dockerfile` multietapa reproducible que fije la imagen base, instale dependencias bloqueadas con `uv.lock` y ejecute sin privilegios de `root`.',
    'Orquestar servicios locales (base de datos con `healthcheck`, volúmenes y contenedor del pipeline) mediante la especificación `compose.yaml` y `docker compose`.',
    'Diseñar consultas de verificación post-ejecución (smoke tests) sobre `stores` y `orders` en Mercado Brisa e integrar el proyecto completo del módulo.'
  ],

  sections: [
    {
      id: 'anatomia-dockerfile-reproducible',
      heading: 'Anatomía de un Dockerfile multietapa para ingeniería de datos',
      body: 'La frase *"en mi máquina sí funcionaba"* suele esconder diferencias entre el equipo del desarrollador y el nodo de ejecución. Cambiar la versión menor de Python o de un paquete puede alterar tipos de datos o fallar en mitad de la noche.\n\nUn **contenedor Docker** empaqueta el código del pipeline junto con el intérprete de Python, los binarios nativos y las librerías exactas en una **imagen inmutable**.\n\nPara construir imágenes ligeras y seguras en proyectos de datos, aplicamos cuatro reglas en el `Dockerfile`. Primero, fijamos la etiqueta exacta de la imagen base (`python:3.12-slim-bookworm`) en vez de `:latest`. Segundo, ordenamos las capas por frecuencia de cambio: copiamos primero `pyproject.toml` y `uv.lock` e instalamos dependencias antes de copiar `src/`. Así Docker reutiliza la caché cuando sólo editas una consulta SQL. Tercero, usamos **construcción multietapa** (*multi-stage build*) para copiar sólo el entorno virtual `.venv` a la imagen final. Cuarto, creamos un usuario sin privilegios (`USER appuser`) y jamás horneamos contraseñas ni archivos `.env` dentro de la imagen.',
      interactive: {
        component: 'semantic-contract',
        caption: 'Simulador interactivo: Contratos de datos y verificación de invariantes antes de publicar la salida.'
      },
      example: {
        language: 'dockerfile',
        code: `# syntax=docker/dockerfile:1
FROM ghcr.io/astral-sh/uv:0.5-python3.12-bookworm-slim AS builder
WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

COPY src/ ./src/
RUN uv sync --frozen --no-dev

FROM python:3.12-slim-bookworm AS runtime
RUN groupadd --gid 10001 appgroup \\
    && useradd --uid 10001 --gid appgroup --create-home appuser
WORKDIR /app

COPY --from=builder --chown=appuser:appgroup /app/.venv /app/.venv
COPY --from=builder --chown=appuser:appgroup /app/src /app/src
ENV PATH="/app/.venv/bin:$PATH" PYTHONUNBUFFERED=1

USER appuser
ENTRYPOINT ["python", "-m", "src.pipeline_cli"]`
      }
    },
    {
      id: 'compose-yaml-servicios-healthchecks',
      heading: 'Orquestación local de servicios con la especificación compose.yaml',
      body: 'Un pipeline rara vez vive aislado. Necesita conectarse a una base PostgreSQL, leer un bucket local o montar una carpeta con archivos Parquet de las capas Bronce, Plata y Oro. La **Compose Specification** permite declarar toda esa topología en un archivo estándar llamado `compose.yaml` y gestionarla con `docker compose` (sin guion).\n\nEn la especificación vigente de Compose ya no se incluye el campo obsoleto `version: \'3.8\'` al inicio del archivo. Tres bloques aseguran que el entorno local sea reproducible.\n\nEl primero es combinar **`healthcheck` con `condition: service_healthy`**. Declarar sólo `depends_on: [warehouse-db]` espera a que el contenedor arranque, no a que PostgreSQL acepte conexiones TCP. El segundo bloque es el montaje de volúmenes (`volumes`), que vincula `./public/datasets` en modo sólo lectura (`:ro`) con `/data/bronze` dentro del contenedor. El tercer bloque es la inyección de variables (`environment`), que parametriza la ventana lógica (`WINDOW_START`, `WINDOW_END`) y las credenciales en tiempo de ejecución.',
      example: {
        language: 'yaml',
        code: `services:
  warehouse-db:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: \${POSTGRES_USER:-brisa_user}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:?Define POSTGRES_PASSWORD en .env}
      POSTGRES_DB: mercado_brisa
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${POSTGRES_USER:-brisa_user} -d mercado_brisa"]
      interval: 5s
      timeout: 3s
      retries: 5

  ingesta-pipeline:
    build:
      context: .
      dockerfile: Dockerfile
    depends_on:
      warehouse-db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://\${POSTGRES_USER:-brisa_user}:\${POSTGRES_PASSWORD}@warehouse-db:5432/mercado_brisa
      DATA_DIR: /data
      WINDOW_START: "2025-07-01T00:00:00"
      WINDOW_END: "2025-10-01T00:00:00"
    volumes:
      - ./public/datasets:/data/bronze:ro
      - ./output/silver:/data/silver

volumes:
  pgdata:`
      }
    },
    {
      id: 'smoke-tests-y-proyecto-integrador',
      heading: 'Smoke tests de datos y proyecto integrador del módulo',
      body: 'Que un contenedor finalice con código `0` no garantiza que los datos escritos sean correctos. Antes de dar por buena la corrida, el contenedor debe ejecutar una **prueba de humo de datos** (*data smoke test*). Esta consulta rápida valida invariantes de negocio: cero llaves primarias nulas, presencia de las 14 tiendas activas de Mercado Brisa y cuadratura entre ingreso bruto y descuento.\n\n**Proyecto integrador del módulo `de2-pipelines`:** construirás un pipeline ELT contenerizado para Mercado Brisa que procese `payments`, `events`, `orders` y `stores`. Aterrizarás los lotes en Bronce, promoverás a Plata deduplicando con `QUALIFY ROW_NUMBER()` y sincronizando estados con `MERGE INTO`, y publicarás el cierre regional Oro validado por un *smoke test*.\n\nTu entrega se evalúa con cuatro criterios observables: (1) Aterrizaje ELT e inmutabilidad en Bronce sin pérdidas; (2) Idempotencia y parametrización de backfills con intervalos semiabiertos; (3) Carga incremental con watermark, ventana lookback y `MERGE` sin colisiones; y (4) Orquestación de activos y empaquetado reproducible en `Dockerfile` multietapa y `compose.yaml`.',
      example: {
        language: 'sql',
        code: `SELECT
  s.country_code,
  COUNT(DISTINCT s.store_id) AS active_stores,
  COUNT(o.order_id) AS completed_orders,
  ROUND(SUM(o.total_usd), 2) AS total_revenue_usd
FROM stores s
JOIN orders o ON s.store_id = o.store_id
WHERE o.status = 'completed'
GROUP BY s.country_code
ORDER BY total_revenue_usd DESC;`,
        expectedOutput: [
          { country_code: 'ES', active_stores: 3, completed_orders: 2811, total_revenue_usd: 1348369.68 },
          { country_code: 'CO', active_stores: 3, completed_orders: 2812, total_revenue_usd: 1107715.87 },
          { country_code: 'AR', active_stores: 1, completed_orders: 2811, total_revenue_usd: 1107208.91 },
          { country_code: 'CL', active_stores: 2, completed_orders: 2109, total_revenue_usd: 952577.48 },
          { country_code: 'PE', active_stores: 1, completed_orders: 2109, total_revenue_usd: 882838.25 },
          { country_code: 'MX', active_stores: 4, completed_orders: 2108, total_revenue_usd: 870752.23 }
        ]
      }
    }
  ],

  workedExample: {
    title: 'Smoke test del cierre regional en Mercado Brisa: salida sin filtrar frente a invariantes validados',
    description: 'El contenedor del pipeline regional generó la tabla de cierre para las cuatro regiones (`Cono Sur`, `Andina`, `Iberia`, `Norteamérica`), pero olvidó filtrar `status = \'completed\'` y restar `discount_usd`.',
    audit: 'El smoke test verifica las 4 regiones, las 14 tiendas activas, los 14.760 pedidos completados y la diferencia exacta entre 6.269.462,42 USD brutos y 6.209.701,01 USD netos tras descuento.',
    steps: [
      {
        label: 'Paso 1 — Salida del contenedor sin filtro de estado ni verificación de descuentos',
        explanation: 'Incluir los 18.000 pedidos sin filtrar `status = \'completed\'` mezcla cancelaciones y reembolsos, inflando el reporte regional en más de 1,39 millones de dólares.',
        code: `SELECT
  s.region,
  COUNT(DISTINCT s.store_id) AS store_count,
  COUNT(o.order_id) AS all_orders,
  ROUND(SUM(o.total_usd), 2) AS unverified_total_usd
FROM stores s
JOIN orders o ON s.store_id = o.store_id
GROUP BY s.region
ORDER BY unverified_total_usd DESC;`,
        expectedOutput: [
          { region: 'Cono Sur', store_count: 3, all_orders: 6001, unverified_total_usd: 2517001.37 },
          { region: 'Andina', store_count: 4, all_orders: 6000, unverified_total_usd: 2434901.41 },
          { region: 'Iberia', store_count: 3, all_orders: 3428, unverified_total_usd: 1651332.57 },
          { region: 'Norteamérica', store_count: 4, all_orders: 2571, unverified_total_usd: 1066582.42 }
        ]
      },
      {
        label: 'Paso 2 — Smoke test regional de pedidos completados e ingreso neto tras descuento',
        explanation: 'Valida las 4 regiones, las 14 tiendas, los 14.760 pedidos completados y la consistencia entre el total facturado y el neto descontado.',
        code: `SELECT
  s.region,
  COUNT(DISTINCT s.store_id) AS store_count,
  COUNT(o.order_id) AS completed_orders,
  ROUND(SUM(o.total_usd), 2) AS gross_revenue_usd,
  ROUND(SUM(o.total_usd - o.discount_usd), 2) AS net_after_discount_usd
FROM stores s
JOIN orders o ON s.store_id = o.store_id
WHERE o.status = 'completed'
GROUP BY s.region
ORDER BY gross_revenue_usd DESC;`,
        expectedOutput: [
          { region: 'Cono Sur', store_count: 3, completed_orders: 4920, gross_revenue_usd: 2059786.39, net_after_discount_usd: 2037991.98 },
          { region: 'Andina', store_count: 4, completed_orders: 4921, gross_revenue_usd: 1990554.12, net_after_discount_usd: 1972955.12 },
          { region: 'Iberia', store_count: 3, completed_orders: 2811, gross_revenue_usd: 1348369.68, net_after_discount_usd: 1336263.78 },
          { region: 'Norteamérica', store_count: 4, completed_orders: 2108, gross_revenue_usd: 870752.23, net_after_discount_usd: 862490.13 }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: 'En un `Dockerfile`, ¿por qué es una buena práctica copiar primero `pyproject.toml` y `uv.lock` y ejecutar `uv sync --frozen` antes de hacer `COPY src/ ./src/`?',
      options: [
        {
          id: 'a',
          text: 'Porque Docker reutiliza la capa en caché de las dependencias instaladas mientras los archivos de bloqueo no cambien, acelerando las reconstrucciones al editar código.',
          correct: true,
          feedback: 'Correcto. Si copias todo el código antes de instalar paquetes, cualquier cambio en un script invalida la caché y reinstala todas las librerías.'
        },
        {
          id: 'b',
          text: 'Porque Python no permite leer archivos `.py` si se copian antes que el archivo `pyproject.toml`.',
          correct: false,
          feedback: 'Incorrecto. A Python le resulta indiferente el orden en que fueron copiados; el beneficio pertenece al sistema de capas de Docker BuildKit.'
        },
        {
          id: 'c',
          text: 'Para que las contraseñas guardadas dentro de `src/` se encripten automáticamente.',
          correct: false,
          feedback: 'Incorrecto. Docker no encripta secretos en el código y las credenciales jamás deben copiarse dentro de la imagen.'
        }
      ],
      explanation: 'Cada instrucción `COPY` o `RUN` en un `Dockerfile` crea una capa inmutable. En cuanto una capa cambia, todas las capas siguientes deben reconstruirse. Aislar la instalación de dependencias antes de copiar el código fuente reduce el tiempo de compilación de minutos a segundos.'
    },
    {
      id: 'c2',
      type: 'mcq',
      prompt: 'En `compose.yaml`, si defines `depends_on: [warehouse-db]` sin configurar un `healthcheck` ni `condition: service_healthy`, ¿qué ocurre cuando ejecutas `docker compose up`?',
      options: [
        {
          id: 'a',
          text: 'Compose inicia el contenedor del pipeline apenas arranca el proceso de `warehouse-db`, aunque PostgreSQL aún esté inicializando archivos y rechace conexiones.',
          correct: true,
          feedback: 'Correcto. Sin `condition: service_healthy`, `depends_on` sólo controla el orden de arranque del contenedor, no la disponibilidad del protocolo SQL.'
        },
        {
          id: 'b',
          text: 'Compose inspecciona automáticamente el puerto 5432 y espera a que existan todas las tablas de negocio.',
          correct: false,
          feedback: 'Incorrecto. Docker no conoce el protocolo interno de cada motor a menos que declares explícitamente el comando de prueba en `healthcheck`.'
        },
        {
          id: 'c',
          text: 'El archivo `compose.yaml` falla por error de sintaxis porque `version: "3.8"` es obligatorio.',
          correct: false,
          feedback: 'Incorrecto. La clave `version:` está obsoleta en la especificación Compose actual y no debe incluirse.'
        }
      ],
      explanation: 'Un contenedor de base de datos tarda varios segundos desde que el proceso del sistema operativo inicia hasta que termina de montar el almacenamiento y abre el socket TCP. Usar `healthcheck` con `pg_isready` y `condition: service_healthy` sincroniza el pipeline con la disponibilidad real del motor.'
    },
    {
      id: 'c3',
      type: 'mcq',
      prompt: '¿Cuál es la forma segura de entregar el token de una API HTTP o la contraseña de la base de datos a un contenedor de ingesta?',
      options: [
        {
          id: 'a',
          text: 'Inyectarlos en tiempo de ejecución mediante variables de entorno o secretos montados desde el orquestador o desde un archivo `.env` excluido en `.gitignore`.',
          correct: true,
          feedback: 'Correcto. Así la imagen permanece libre de credenciales y puede compartirse o promoverse entre entornos de prueba y producción.'
        },
        {
          id: 'b',
          text: 'Declararlos con `ENV API_TOKEN=...` dentro del `Dockerfile` y borrar el archivo en una capa posterior con `RUN rm`.',
          correct: false,
          feedback: 'Incorrecto. Borrar un archivo en una capa posterior no lo elimina de las capas previas de la imagen; cualquiera puede extraerlo con `docker history`.'
        },
        {
          id: 'c',
          text: 'Subir el archivo `.env` con las llaves reales al repositorio Git para que `docker build` lo copie siempre.',
          correct: false,
          feedback: 'Incorrecto. Versionar credenciales en Git y copiarlas en la imagen compromete la seguridad de toda la infraestructura.'
        }
      ],
      explanation: 'Las imágenes de contenedores son artefactos distribuibles cuyas capas pueden inspeccionarse. La configuración sensible y las credenciales deben mantenerse fuera del `Dockerfile` y suministrarse únicamente al contenedor en ejecución.'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Smoke test SQL post-ejecución por región comercial',
    language: 'sql',
    prompt: 'Escribe la consulta de verificación post-ejecución (*smoke test*) para el cierre regional contenerizado de Mercado Brisa. Une `stores` y `orders`, filtra únicamente pedidos con `o.status = \'completed\'` y agrupa por `s.region`. Calcula cuatro columnas de control: `store_count` (`COUNT(DISTINCT s.store_id)`), `completed_orders` (`COUNT(o.order_id)`), `gross_revenue_usd` (`ROUND(SUM(o.total_usd), 2)`) y `net_after_discount_usd` (`ROUND(SUM(o.total_usd - o.discount_usd), 2)`). Ordena por `gross_revenue_usd DESC`.',
    starterCode: `-- Smoke test de invariantes regionales del pipeline contenerizado
-- El código inicial no filtra pedidos completados ni resta discount_usd en net_after_discount_usd.
-- Corrige el filtro WHERE y la fórmula de net_after_discount_usd.
SELECT
  s.region,
  COUNT(DISTINCT s.store_id) AS store_count,
  COUNT(o.order_id) AS completed_orders,
  ROUND(SUM(o.total_usd), 2) AS gross_revenue_usd,
  ROUND(SUM(o.total_usd), 2) AS net_after_discount_usd
FROM stores s
JOIN orders o ON s.store_id = o.store_id
GROUP BY s.region
ORDER BY gross_revenue_usd DESC;`,
    expected: `SELECT
  s.region,
  COUNT(DISTINCT s.store_id) AS store_count,
  COUNT(o.order_id) AS completed_orders,
  ROUND(SUM(o.total_usd), 2) AS gross_revenue_usd,
  ROUND(SUM(o.total_usd - o.discount_usd), 2) AS net_after_discount_usd
FROM stores s
JOIN orders o ON s.store_id = o.store_id
WHERE o.status = 'completed'
GROUP BY s.region
ORDER BY gross_revenue_usd DESC;`,
    orderMatters: true,
    hints: [
      'Añade WHERE o.status = \'completed\' antes del GROUP BY para excluir los pedidos cancelados, reembolsados y pendientes.',
      'En la última columna calcula ROUND(SUM(o.total_usd - o.discount_usd), 2) AS net_after_discount_usd.',
      'Mantén el ordenamiento ORDER BY gross_revenue_usd DESC para que Cono Sur aparezca en la primera fila.'
    ],
    solution: `SELECT
  s.region,
  COUNT(DISTINCT s.store_id) AS store_count,
  COUNT(o.order_id) AS completed_orders,
  ROUND(SUM(o.total_usd), 2) AS gross_revenue_usd,
  ROUND(SUM(o.total_usd - o.discount_usd), 2) AS net_after_discount_usd
FROM stores s
JOIN orders o ON s.store_id = o.store_id
WHERE o.status = 'completed'
GROUP BY s.region
ORDER BY gross_revenue_usd DESC;`,
    solutionExplanation: 'Une `stores` con `orders` filtrando `o.status = \'completed\'` y verifica el conteo de tiendas activas (`store_count`), órdenes completadas (`completed_orders`), facturación bruta (`gross_revenue_usd`) y facturación descontada (`net_after_discount_usd`) en cada región.',
    expectedOutputTable: [
      { region: 'Cono Sur', store_count: 3, completed_orders: 4920, gross_revenue_usd: 2059786.39, net_after_discount_usd: 2037991.98 },
      { region: 'Andina', store_count: 4, completed_orders: 4921, gross_revenue_usd: 1990554.12, net_after_discount_usd: 1972955.12 },
      { region: 'Iberia', store_count: 3, completed_orders: 2811, gross_revenue_usd: 1348369.68, net_after_discount_usd: 1336263.78 },
      { region: 'Norteamérica', store_count: 4, completed_orders: 2108, gross_revenue_usd: 870752.23, net_after_discount_usd: 862490.13 }
    ]
  },

  roleNotes: {
    de: 'Como Ingeniero de Datos, fija versiones en `uv.lock` y en el `FROM` del `Dockerfile`, ejecuta como usuario no privilegiado y añade un smoke test SQL al final de cada contenedor de carga.',
    da: 'Como Analista de Datos, utiliza `docker compose up` para levantar una réplica local exacta del almacén y probar tus consultas de la capa Plata antes de abrir un Pull Request.',
    bi: 'Como especialista en BI, apóyate en los smoke tests regionales del pipeline para confirmar que las sumas de control cuadran antes de disparar la distribución de reportes ejecutivos.'
  },

  summary: [
    'Un Dockerfile multietapa con uv.lock empaqueta código y dependencias exactas en una imagen ligera e inmutable.',
    'Ordenar las capas copiando primero los archivos de bloqueo permite aprovechar la caché de construcción de Docker.',
    'La especificación compose.yaml coordina servicios locales usando healthcheck, volúmenes persistentes y variables de entorno.',
    'Un smoke test SQL post-ejecución verifica invariantes de conteo e importes antes de publicar la salida del contenedor.'
  ],

  flashcards: [
    {
      id: 'fc-de2-pip-06-a',
      front: '¿Qué aporta un Dockerfile multietapa (multi-stage build) al empaquetar un pipeline en Python?',
      back: 'Permite compilar e instalar dependencias en una imagen builder y copiar únicamente el entorno virtual limpio a una imagen runtime pequeña y segura.'
    },
    {
      id: 'fc-de2-pip-06-b',
      front: '¿Por qué es necesario combinar depends_on con healthcheck y condition: service_healthy en compose.yaml?',
      back: 'Porque depends_on por sí solo únicamente espera al arranque del contenedor, no a que la base de datos haya terminado de inicializar y acepte conexiones SQL.'
    },
    {
      id: 'fc-de2-pip-06-c',
      front: '¿Qué es un smoke test de datos al finalizar la ejecución de un contenedor de ingesta?',
      back: 'Es una consulta SQL de verificación que comprueba invariantes (conteo de filas, llaves no nulas y cuadratura de sumas) antes de publicar el activo.'
    }
  ],

  glossaryTerms: ['patron-elt-desacoplado', 'idempotencia-pipeline'],

  sources: [
    {
      title: 'Docker Documentation — Building best practices & Multi-stage builds',
      url: 'https://docs.docker.com/build/building/best-practices/',
      publisher: 'Docker Inc.',
      accessed: '2026-10-29',
      supports: 'Optimización de caché de capas, imágenes mínimas multietapa y ejecución con usuario sin privilegios.'
    },
    {
      title: 'Docker Documentation — Compose Specification (compose.yaml)',
      url: 'https://docs.docker.com/reference/compose-file/',
      publisher: 'Docker Inc.',
      accessed: '2026-10-29',
      supports: 'Especificación vigente de archivos compose.yaml, healthchecks, volúmenes y variables de entorno.'
    },
    {
      title: 'Astral uv Documentation — Using uv in Docker',
      url: 'https://docs.astral.sh/uv/guides/integration/docker/',
      publisher: 'Astral',
      accessed: '2026-10-29',
      supports: 'Instalación reproducible de dependencias bloqueadas con uv sync --frozen en contenedores.'
    }
  ],

  aiNotes: 'En esta última lección guía al estudiante para completar las dos condiciones que le faltan al starterCode del smoke test: añadir `WHERE o.status = \'completed\'` y restar `o.discount_usd` en `ROUND(SUM(o.total_usd - o.discount_usd), 2)`. Anímalo también a relacionar esta validación con el proyecto integrador del módulo.',

  pipelineChallenge: {
    title: 'Empaquetado, ejecución en contenedor y smoke test del proyecto integrador',
    scenario: 'Ordena las 4 etapas entre Ingeniería (DE), Análisis (DA) y BI para empaquetar y validar el pipeline contenerizado de Mercado Brisa.',
    steps: [
      {
        id: 'step-1',
        label: '1. Construir la imagen multietapa con uv.lock y usuario no privilegiado',
        role: 'DE',
        detail: 'Fijar `python:3.12-slim-bookworm`, instalar dependencias con `uv sync --frozen` y ejecutar como `USER appuser`.'
      },
      {
        id: 'step-2',
        label: '2. Orquestar servicios y volúmenes en compose.yaml con healthcheck',
        role: 'DE',
        detail: 'Montar `/data/bronze:ro`, inyectar variables de ventana lógica y esperar `condition: service_healthy` de la base de datos.'
      },
      {
        id: 'step-3',
        label: '3. Ejecutar el smoke test SQL regional al finalizar el contenedor',
        role: 'DA',
        detail: 'Confirmar que las 4 regiones suman 14 tiendas activas, 14.760 órdenes completadas y cuadratura exacta tras descuentos.'
      },
      {
        id: 'step-4',
        label: '4. Promover los activos verificados al catálogo ejecutivo de BI',
        role: 'BI',
        detail: 'Habilitar el consumo de la capa Oro regional sólo cuando el contenedor y su smoke test devuelven código de salida 0.'
      }
    ],
    explanation: 'Empaquetar en imagen inmutable (Paso 1) y coordinar con compose.yaml (Paso 2) asegura reproducibilidad técnica, mientras que el smoke test SQL (Paso 3) certifica la calidad antes del consumo en BI (Paso 4).'
  }
};

export default lesson;
