const lesson = {
  id: 'de2-pipelines-04-ingesta-apis-http',
  moduleId: 'de2-pipelines',
  tracks: ['de'],
  level: 2,
  order: 4,
  title: 'Ingesta desde APIs HTTP: paginación, límites y reintentos',
  subtitle: 'Ingesta resiliente desde APIs HTTP: paginación, límites de tasa y reintentos',
  minutes: 20,
  prerequisites: ['de2-pipelines-02-idempotencia-backfill'],
  contentVersion: 2,

  hook: 'El conector nocturno que descarga la telemetría web de Mercado Brisa hacia la tabla `events` se detuvo en la página 140 tras recibir un código HTTP `429 Too Many Requests`. Al relanzarlo usando desplazamientos numéricos (`?limit=500&offset=70000`), la entrada de nuevas visitas en vivo provocó que 1.200 eventos se leyeran en dos páginas seguidas y que otros se saltaran. Además, las campañas venían anidadas dentro de la cadena JSON `payload_json`. ¿Cómo diseñas un extractor HTTP que pagine sin deriva, respete los límites del servidor y parsee el JSON en SQL?',

  objectives: [
    'Contrastar la paginación por desplazamiento (`limit/offset`) frente a la paginación por cursor (`next_cursor` o `keyset`) ante escrituras concurrentes.',
    'Implementar clientes HTTP con tiempos de espera explícitos (`timeout`), respeto del encabezado `Retry-After` ante códigos `429` y espera exponencial con jitter.',
    'Deduplicar los 65.000 eventos de `events` en Mercado Brisa por `event_id` y extraer atributos anidados desde `payload_json` en DuckDB.'
  ],

  sections: [
    {
      id: 'paginacion-offset-vs-cursor',
      heading: 'Por qué la paginación por offset pierde o duplica filas en vivo',
      body: 'Ninguna API REST devuelve millones de registros en una sola respuesta HTTP. Siempre divide la colección en páginas. El esquema más elemental es la **paginación por desplazamiento** (`?limit=100&offset=200`), donde el cliente pide saltar las primeras doscientas filas según el orden actual del servidor.\n\nEn sistemas con tráfico en vivo, el desplazamiento numérico sufre de **deriva de página** (*page drift*). Imagina que la API ordena los eventos del más reciente al más antiguo (`occurred_at DESC`). Mientras tu script procesa la página 1, entran diez eventos nuevos en el servidor. Cuando pides la página 2 (`offset=100`), todos los registros anteriores se han corrido diez posiciones hacia abajo. Tu script volverá a descargar los últimos diez eventos de la página 1.\n\nPor eso las APIs de pasarelas y telemetría usan **paginación por cursor** (*cursor* o *keyset pagination*). Cada respuesta entrega un puntero opaco (`next_cursor`) que ancla la última marca de tiempo e identificador leídos. Aun así, los reintentos de red entre páginas dejan duplicados en Bronce. En `events` de Mercado Brisa hay **65.000 filas crudas**: 63.800 son `event_id` únicos y 1.200 son duplicados (240 por tipo de evento).',
      interactive: {
        component: 'streaming-watermark-lab',
        caption: 'Simulador interactivo: Ventanas de arribo, eventos tardíos y control de flujo en la ingesta.'
      },
      example: {
        language: 'sql',
        code: `SELECT
  event_type,
  COUNT(*) AS raw_events,
  COUNT(DISTINCT event_id) AS unique_events,
  COUNT(*) - COUNT(DISTINCT event_id) AS duplicate_retries
FROM events
GROUP BY event_type
ORDER BY event_type;`,
        expectedOutput: [
          { event_type: 'add_to_cart', raw_events: 15400, unique_events: 15160, duplicate_retries: 240 },
          { event_type: 'checkout_completed', raw_events: 15400, unique_events: 15160, duplicate_retries: 240 },
          { event_type: 'checkout_started', raw_events: 15400, unique_events: 15160, duplicate_retries: 240 },
          { event_type: 'page_view', raw_events: 9400, unique_events: 9160, duplicate_retries: 240 },
          { event_type: 'product_view', raw_events: 9400, unique_events: 9160, duplicate_retries: 240 }
        ]
      }
    },
    {
      id: 'rate-limits-backoff-jitter',
      heading: 'Límites de tasa (HTTP 429), Retry-After y backoff exponencial',
      body: 'Los proveedores SaaS protegen sus servidores aplicando **límites de tasa** (*rate limits*), como cien peticiones por minuto. Cuando tu extractor supera esa cuota, la API responde con el estado **HTTP `429 Too Many Requests`**. Suele incluir además el encabezado `Retry-After` indicando cuántos segundos debes esperar antes de reintentar.\n\nSi la API devuelve un fallo transitorio del servidor (`500`, `502`, `503` o `504`) o no envía `Retry-After`, reintentar de inmediato en un bucle cerrado satura al servidor. En cambio, ante errores del cliente como `400 Bad Request`, `401 Unauthorized` o `404 Not Found`, reintentar es inútil. El pipeline debe abortar rápido y alertar al equipo.\n\nLa estrategia recomendada para fallos transitorios es la **espera exponencial con variación aleatoria** (*exponential backoff with jitter*). En cada intento $k$, el tiempo base se duplica ($2^k$ segundos) y se suma una fracción aleatoria (*jitter*). Esa variación evita el **problema de la estampida** (*thundering herd*), donde decenas de trabajadores que fallaron al mismo segundo vuelven a golpear la API de forma sincronizada. Además, toda llamada debe fijar un `timeout` explícito.',
      example: {
        language: 'python',
        code: `import random
import time
from typing import Iterator
import httpx

TRANSIENT_CODES = {429, 500, 502, 503, 504}

def fetch_paginated_events(base_url: str, api_token: str) -> Iterator[dict]:
    """Recorre una API paginada por cursor respetando Retry-After y backoff."""
    cursor: str | None = None
    headers = {"Authorization": f"Bearer {api_token}", "Accept": "application/json"}

    with httpx.Client(timeout=httpx.Timeout(10.0, connect=5.0)) as client:
        while True:
            params = {"limit": 500}
            if cursor:
                params["cursor"] = cursor

            for attempt in range(1, 6):
                response = client.get(base_url, headers=headers, params=params)
                if response.status_code == 200:
                    break
                if response.status_code not in TRANSIENT_CODES or attempt == 5:
                    response.raise_for_status()
                retry_after = response.headers.get("Retry-After")
                wait_s = float(retry_after) if retry_after else (2 ** attempt) + random.uniform(0.1, 1.0)
                time.sleep(wait_s)

            payload = response.json()
            for item in payload.get("data", []):
                yield item
            cursor = payload.get("next_cursor")
            if not cursor:
                break`
      }
    },
    {
      id: 'extraccion-json-semi-estructurado-sql',
      heading: 'Aplanado y tipado de cargas JSON semi-estructuradas en la capa Plata',
      body: 'Las APIs HTTP devuelven documentos JSON con campos anidados que cambian con frecuencia. Si el conector en Python recorta sólo tres llaves fijas antes de escribir en disco, cualquier atributo nuevo se perderá. Siguiendo el patrón ELT, guardamos las columnas base junto con el documento íntegro en `payload_json` dentro de la capa Bronce.\n\nDespués, al construir la capa Plata en DuckDB, aplicamos funciones nativas como **`json_extract_string(payload_json, \'$.campaign\')`**. Así proyectamos atributos con tipo de dato explícito en la misma consulta que deduplica por `event_id`.\n\nEn la tabla `events` de Mercado Brisa, una vez deduplicados los **63.800 eventos únicos**, encontramos que **18.000 eventos** traen una campaña dentro de `payload_json`. La campaña `CMP-DIRECT` registra 6.000 eventos, mientras que `CMP-BARISTA`, `CMP-ORIGEN`, `CMP-RETENCION` y `CMP-VERANO` suman 3.000 eventos cada una. Los 45.800 eventos restantes corresponden a tráfico orgánico donde `$.campaign` es nulo. Envolver la extracción con `COALESCE(..., \'SIN_CAMPANA\')` clasifica el total sin perder sesiones orgánicas.',
      example: {
        language: 'sql',
        code: `WITH clean_events AS (
  SELECT
    event_id,
    session_id,
    event_type,
    device_type,
    json_extract_string(payload_json, '$.campaign') AS campaign_code
  FROM events
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY event_id
    ORDER BY event_ts ASC
  ) = 1
)
SELECT
  campaign_code,
  COUNT(*) AS campaign_events,
  COUNT(DISTINCT session_id) AS unique_sessions
FROM clean_events
WHERE campaign_code IS NOT NULL
GROUP BY campaign_code
ORDER BY campaign_events DESC, campaign_code ASC;`,
        expectedOutput: [
          { campaign_code: 'CMP-DIRECT', campaign_events: 6000, unique_sessions: 6000 },
          { campaign_code: 'CMP-BARISTA', campaign_events: 3000, unique_sessions: 3000 },
          { campaign_code: 'CMP-ORIGEN', campaign_events: 3000, unique_sessions: 3000 },
          { campaign_code: 'CMP-RETENCION', campaign_events: 3000, unique_sessions: 3000 },
          { campaign_code: 'CMP-VERANO', campaign_events: 3000, unique_sessions: 3000 }
        ]
      }
    }
  ],

  workedExample: {
    title: 'Limpieza de telemetría HTTP en Mercado Brisa: deduplicación y extracción JSON',
    description: 'El equipo de marketing quiere medir las sesiones por campaña y dispositivo a partir de `events`, pero el volcado crudo de la API tiene 1.200 eventos duplicados y el código de campaña viene anidado en `payload_json`.',
    audit: 'Al deduplicar por event_id se eliminan los 400 duplicados de cada canal (1.200 en total) y json_extract_string recupera exactamente los 18.000 eventos de campañas activas.',
    steps: [
      {
        label: 'Paso 1 — Inspección del lote crudo de la API por tipo de dispositivo',
        explanation: 'Cada canal (`desktop`, `mobile`, `pos_tienda`) arrastra 400 eventos duplicados por reintentos HTTP; contar filas sin deduplicar infla el tráfico.',
        code: `SELECT
  device_type,
  COUNT(*) AS raw_events,
  COUNT(DISTINCT event_id) AS unique_events,
  COUNT(*) - COUNT(DISTINCT event_id) AS duplicate_events
FROM events
GROUP BY device_type
ORDER BY raw_events DESC;`,
        expectedOutput: [
          { device_type: 'desktop', raw_events: 23383, unique_events: 22983, duplicate_events: 400 },
          { device_type: 'mobile', raw_events: 22524, unique_events: 22124, duplicate_events: 400 },
          { device_type: 'pos_tienda', raw_events: 19093, unique_events: 18693, duplicate_events: 400 }
        ]
      },
      {
        label: 'Paso 2 — Deduplicación por event_id y parseo de $.campaign desde JSON',
        explanation: 'Al eliminar primero las copias repetidas de `event_id` y extraer `$.campaign` con `json_extract_string`, obtenemos el conteo exacto de las cinco campañas.',
        code: `WITH clean_events AS (
  SELECT
    event_id,
    session_id,
    json_extract_string(payload_json, '$.campaign') AS campaign_code
  FROM events
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY event_id
    ORDER BY event_ts ASC
  ) = 1
)
SELECT
  campaign_code,
  COUNT(*) AS campaign_events,
  COUNT(DISTINCT session_id) AS unique_sessions
FROM clean_events
WHERE campaign_code IS NOT NULL
GROUP BY campaign_code
ORDER BY campaign_events DESC, campaign_code ASC;`,
        expectedOutput: [
          { campaign_code: 'CMP-DIRECT', campaign_events: 6000, unique_sessions: 6000 },
          { campaign_code: 'CMP-BARISTA', campaign_events: 3000, unique_sessions: 3000 },
          { campaign_code: 'CMP-ORIGEN', campaign_events: 3000, unique_sessions: 3000 },
          { campaign_code: 'CMP-RETENCION', campaign_events: 3000, unique_sessions: 3000 },
          { campaign_code: 'CMP-VERANO', campaign_events: 3000, unique_sessions: 3000 }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: 'Una API REST ordena los pedidos por `created_at DESC`. Mientras tu script descarga páginas con `?limit=100&offset=0`, `?limit=100&offset=100`, entran 15 pedidos nuevos. ¿Qué anomalía ocurre al leer la segunda página?',
      options: [
        {
          id: 'a',
          text: 'Los últimos 15 pedidos de la primera página se desplazan hacia la segunda página y tu script los descarga duplicados.',
          correct: true,
          feedback: 'Correcto. Al insertarse filas al principio del ordenamiento, el desplazamiento numérico empuja registros ya leídos hacia la página siguiente.'
        },
        {
          id: 'b',
          text: 'El servidor convierte automáticamente el parámetro offset en un cursor encriptado.',
          correct: false,
          feedback: 'Incorrecto. Si el cliente solicita paginación por offset, la base de datos simplemente cuenta posiciones físicas sin anclar la última llave.'
        },
        {
          id: 'c',
          text: 'La API devuelve un error HTTP 404 porque el offset supera el límite permitido.',
          correct: false,
          feedback: 'Incorrecto. La petición devuelve HTTP 200 con datos válidos, pero con solapamiento silencioso respecto a la página previa.'
        }
      ],
      explanation: 'La paginación por `offset` cuenta posiciones relativas al estado instantáneo de la tabla. Si entran filas nuevas al inicio mientras el cliente avanza de página, los registros se desplazan y se leen repetidos. La paginación por cursor ancla la posición en el último identificador procesado.'
    },
    {
      id: 'c2',
      type: 'mcq',
      prompt: '¿Por qué se añade una variación aleatoria (jitter) al tiempo de espera exponencial cuando múltiples trabajadores de ingesta reciben un error HTTP 503 o 429 sin encabezado Retry-After?',
      options: [
        {
          id: 'a',
          text: 'Para desincronizar los reintentos y evitar que todos los trabajadores vuelvan a golpear la API exactamente en el mismo segundo.',
          correct: true,
          feedback: 'Correcto. El jitter dispersa las peticiones en el tiempo y previene el efecto de estampida (thundering herd) sobre el servidor en recuperación.'
        },
        {
          id: 'b',
          text: 'Para saltar la autenticación Bearer Token en el siguiente intento.',
          correct: false,
          feedback: 'Incorrecto. Todos los reintentos deben conservar las credenciales de autorización.'
        },
        {
          id: 'c',
          text: 'Para reducir el tamaño del documento JSON devuelto por el servidor.',
          correct: false,
          feedback: 'Incorrecto. El tiempo de espera en el cliente no modifica el contenido ni el peso de la respuesta HTTP.'
        }
      ],
      explanation: 'Si diez procesos concurrentes fallan a las `02:00:00` y aplican una espera exponencial fija de `2, 4, 8` segundos sin variación aleatoria, los diez volverán a impactar al servidor simultáneamente a las `02:00:02` y `02:00:06`, perpetuando la saturación.'
    },
    {
      id: 'c3',
      type: 'mcq',
      prompt: 'Tu conector de ingesta recibe un código HTTP `401 Unauthorized` al invocar el endpoint de pagos. ¿Cuál debe ser el comportamiento del cliente HTTP?',
      options: [
        {
          id: 'a',
          text: 'Abortar de inmediato sin reintentar y registrar el fallo de credenciales para que el equipo renueve el token.',
          correct: true,
          feedback: 'Correcto. Un error 401 indica credenciales ausentes o vencidas; reintentar con el mismo token fallará todas las veces.'
        },
        {
          id: 'b',
          text: 'Reintentar diez veces con espera exponencial durante una hora hasta que responda HTTP 200.',
          correct: false,
          feedback: 'Incorrecto. Reintentar un error de autenticación sólo retrasa la alerta y puede bloquear la cuenta por intentos fallidos.'
        },
        {
          id: 'c',
          text: 'Guardar una tabla vacía como exitosa y avanzar la marca de agua del lote.',
          correct: false,
          feedback: 'Incorrecto. Avanzar la marca de agua tras un fallo oculta la pérdida de datos y deja un hueco en la historia.'
        }
      ],
      explanation: 'Los errores HTTP `400`, `401`, `403` y `404` representan fallos deterministas de la petición o de permisos. A diferencia de `429` o `503`, no se resuelven esperando unos segundos, por lo que deben fallar rápido sin avanzar el cursor ni el watermark.'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Atribución de eventos y sesiones deduplicadas desde payload_json',
    language: 'sql',
    prompt: 'Construye el resumen completo de tráfico web de Mercado Brisa sobre `events` incluyendo tanto las campañas promocionales como el tráfico orgánico. Primero crea una CTE que deduplique `events` por `event_id` usando `QUALIFY ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY event_ts ASC) = 1` y extraiga `COALESCE(json_extract_string(payload_json, \'$.campaign\'), \'SIN_CAMPANA\') AS json_campaign`. Luego agrupa por `json_campaign` y calcula `unique_events` (`COUNT(*)`) y `unique_sessions` (`COUNT(DISTINCT session_id)`). Ordena por `unique_events DESC, json_campaign ASC`.',
    starterCode: `-- Resumen de eventos y sesiones por campaña extraída desde payload_json
-- El código inicial no deduplica por event_id antes de agrupar.
-- Añade una CTE con QUALIFY ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY event_ts ASC) = 1.
SELECT
  COALESCE(json_extract_string(payload_json, '$.campaign'), 'SIN_CAMPANA') AS json_campaign,
  COUNT(*) AS unique_events,
  COUNT(DISTINCT session_id) AS unique_sessions
FROM events
GROUP BY json_campaign
ORDER BY unique_events DESC, json_campaign ASC;`,
    expected: `WITH deduplicated_events AS (
  SELECT
    event_id,
    session_id,
    COALESCE(json_extract_string(payload_json, '$.campaign'), 'SIN_CAMPANA') AS json_campaign
  FROM events
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY event_id
    ORDER BY event_ts ASC
  ) = 1
)
SELECT
  json_campaign,
  COUNT(*) AS unique_events,
  COUNT(DISTINCT session_id) AS unique_sessions
FROM deduplicated_events
GROUP BY json_campaign
ORDER BY unique_events DESC, json_campaign ASC;`,
    orderMatters: true,
    hints: [
      'Si agrupas directamente la tabla events sin deduplicar, los 1.200 reintentos duplicados inflarán el conteo de unique_events.',
      'En la CTE deduplicated_events aplica QUALIFY ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY event_ts ASC) = 1.',
      'Usa COALESCE(json_extract_string(payload_json, \'$.campaign\'), \'SIN_CAMPANA\') para etiquetar los eventos donde $.campaign es NULL.'
    ],
    solution: `WITH deduplicated_events AS (
  SELECT
    event_id,
    session_id,
    COALESCE(json_extract_string(payload_json, '$.campaign'), 'SIN_CAMPANA') AS json_campaign
  FROM events
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY event_id
    ORDER BY event_ts ASC
  ) = 1
)
SELECT
  json_campaign,
  COUNT(*) AS unique_events,
  COUNT(DISTINCT session_id) AS unique_sessions
FROM deduplicated_events
GROUP BY json_campaign
ORDER BY unique_events DESC, json_campaign ASC;`,
    solutionExplanation: 'Elimina primero los 1.200 eventos repetidos por reintentos HTTP mediante `QUALIFY ROW_NUMBER()` por `event_id` y luego proyecta `$.campaign` desde `payload_json` usando `COALESCE` para clasificar los 45.800 eventos orgánicos.',
    expectedOutputTable: [
      { json_campaign: 'SIN_CAMPANA', unique_events: 45800, unique_sessions: 15267 },
      { json_campaign: 'CMP-DIRECT', unique_events: 6000, unique_sessions: 6000 },
      { json_campaign: 'CMP-BARISTA', unique_events: 3000, unique_sessions: 3000 },
      { json_campaign: 'CMP-ORIGEN', unique_events: 3000, unique_sessions: 3000 },
      { json_campaign: 'CMP-RETENCION', unique_events: 3000, unique_sessions: 3000 },
      { json_campaign: 'CMP-VERANO', unique_events: 3000, unique_sessions: 3000 }
    ]
  },

  roleNotes: {
    de: 'Como Ingeniero de Datos, persiste el documento crudo (`payload_json`) en la capa Bronce además de las columnas clave; si mañana el negocio pide un campo nuevo del JSON, podrás extraerlo sin volver a llamar a la API.',
    da: 'Como Analista de Datos, usa `json_extract_string` y `COALESCE` para explorar atributos semi-estructurados en eventos web y verifica siempre que los conteos estén deduplicados por `event_id`.',
    bi: 'Como especialista en BI, solicita que los atributos JSON de uso frecuente (como `campaign` o `channel`) se promuevan como columnas tipadas en la capa Plata en vez de parsear JSON en vivo desde la herramienta de visualización.'
  },

  summary: [
    'La paginación por cursor evita la pérdida o duplicación de registros que sufre la paginación por offset cuando hay escrituras en vivo.',
    'Todo cliente HTTP de ingesta debe definir un timeout explícito para no bloquear trabajadores ante conexiones colgadas.',
    'Ante respuestas HTTP 429 o 5xx, aplica espera exponencial con jitter y respeta siempre el encabezado Retry-After.',
    'Almacenar el payload JSON en Bronce y proyectar columnas tipadas en Plata con json_extract_string protege contra cambios de esquema.'
  ],

  flashcards: [
    {
      id: 'fc-de2-pip-04-a',
      front: '¿Qué es la deriva de página (page drift) en la paginación por offset?',
      back: 'Es el desplazamiento de filas entre páginas cuando se insertan o borran registros en vivo mientras el cliente recorre la colección, provocando duplicados o saltos.'
    },
    {
      id: 'fc-de2-pip-04-b',
      front: '¿Cómo debe responder un extractor de datos cuando recibe HTTP 429 Too Many Requests con encabezado Retry-After?',
      back: 'Debe pausar las peticiones durante el número de segundos indicado en Retry-After (o aplicar espera exponencial con jitter) antes de reintentar la misma página.'
    },
    {
      id: 'fc-de2-pip-04-c',
      front: '¿Por qué conviene guardar payload_json completo en la capa Bronce al ingerir desde una API REST?',
      back: 'Porque permite extraer en el futuro nuevos atributos anidados usando funciones SQL como json_extract_string sin tener que reextraer el historial desde la API.'
    }
  ],

  glossaryTerms: ['paginacion-cursor-backoff', 'almacenamiento-objetos-inmutable'],

  sources: [
    {
      title: 'IETF RFC 9110 — HTTP Semantics (Status 429 Too Many Requests & Retry-After)',
      url: 'https://www.rfc-editor.org/rfc/rfc9110.html',
      publisher: 'Internet Engineering Task Force (IETF)',
      accessed: '2026-10-29',
      supports: 'Semántica oficial de códigos de estado HTTP 4xx/5xx y del encabezado de control de flujo Retry-After.'
    },
    {
      title: 'AWS Architecture Blog — Exponential Backoff And Jitter',
      url: 'https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/',
      publisher: 'Amazon Web Services',
      accessed: '2026-10-29',
      supports: 'Algoritmos de espera exponencial con variación aleatoria (Full Jitter) para evitar tormentas de reintentos.'
    },
    {
      title: 'DuckDB Documentation — JSON Functions (json_extract_string)',
      url: 'https://duckdb.org/docs/stable/data/json/json_functions',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Extracción vectorizada de atributos sobre cadenas semi-estructuradas JSON con rutas JSONPath.'
    }
  ],

  aiNotes: 'Recuérdale al estudiante que en `events` existen 45.800 eventos únicos donde el JSON es `{}` y no contiene la llave `campaign`. Por eso es indispensable envolver `json_extract_string(payload_json, \'$.campaign\')` dentro de `COALESCE(..., \'SIN_CAMPANA\')` después de deduplicar por `event_id`.',

  pipelineChallenge: {
    title: 'Ingesta resiliente desde API de telemetría hasta el modelo de atribución',
    scenario: 'Ordena los 4 pasos entre Ingeniería (DE), Análisis (DA) y BI para descargar los eventos web de Mercado Brisa sin perder páginas y exponer las campañas limpias.',
    steps: [
      {
        id: 'step-1',
        label: '1. Extraer páginas con next_cursor, timeout explícito y backoff con jitter',
        role: 'DE',
        detail: 'Recorrer el endpoint HTTP respetando `Retry-After` ante códigos `429` y aterrizar el lote con `payload_json` en Bronce.'
      },
      {
        id: 'step-2',
        label: '2. Deduplicar por event_id y proyectar columnas tipadas desde el JSON',
        role: 'DE',
        detail: 'Eliminar las 1.200 filas repetidas de reintentos con `QUALIFY ROW_NUMBER()` y extraer `$.campaign` con `json_extract_string`.'
      },
      {
        id: 'step-3',
        label: '3. Auditar la cobertura de sesiones entre tráfico promocional y orgánico',
        role: 'DA',
        detail: 'Comprobar que las 5 campañas activas suman 18.000 eventos y el tráfico `SIN_CAMPANA` suma 45.800 eventos únicos.'
      },
      {
        id: 'step-4',
        label: '4. Publicar el embudo de sesiones por campaña y dispositivo',
        role: 'BI',
        detail: 'Conectar el tablero de marketing a la columna tipada `json_campaign` de la capa Plata sin parsear JSON en el navegador.'
      }
    ],
    explanation: 'Un cliente HTTP con cursor y backoff (Paso 1) seguido de deduplicación y extracción JSON en Plata (Paso 2) permite a DA validar la atribución (Paso 3) y a BI servir reportes rápidos (Paso 4).'
  }
};

export default lesson;
