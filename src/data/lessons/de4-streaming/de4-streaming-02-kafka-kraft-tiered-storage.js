export const lesson = {
  "id": "de4-streaming-02-kafka-kraft-tiered-storage",
  "moduleId": "de4-streaming",
  "order": 2,
  "title": "Apache Kafka 4.x: particiones, KRaft y almacenamiento",
  "subtitle": "Apache Kafka 4.x por dentro: particiones, consenso KRaft y almacenamiento por niveles",
  "tracks": [
    "de"
  ],
  "level": 4,
  "minutes": 25,
  "prerequisites": [
    "de4-streaming-01-cdc-kafka-streaming"
  ],
  "contentVersion": 2,
  "needsReview": false,
  "dataset": "Mercado Brisa (empresa ficticia) — tabla events (65 000 eventos de telemetría)",
  "block": "Bloque 4 · Flujos en tiempo real y CDC",
  "badge": "Kafka 4.x & KRaft",
  "HookType": "Cuello de botella de arquitectura",
  "hook": "El clúster de eventos de Mercado Brisa (empresa ficticia) procesa 65 000 interacciones web y de tienda, pero un solo broker tiene el procesador al 98 % mientras los otros tres permanecen ociosos. Al revisar el productor, notas que reemplaza los valores nulos de customer_id por la constante ANONIMO antes de particionar y guarda meses de logs en discos NVMe locales. ¿Cómo diseñar el particionamiento, el consenso KRaft y el almacenamiento por niveles en Kafka 4.x?",
  "objectives": [
    "Analizar cómo la función hash murmur2 asigna claves a particiones en Apache Kafka y por qué las claves nulas con valor estático por defecto provocan particiones calientes (hot partitions).",
    "Explicar la arquitectura del protocolo de consenso KRaft sobre el tópico interno __cluster_metadata tras la eliminación definitiva de Apache ZooKeeper en Kafka 4.0.",
    "Dimensionar la retención híbrida mediante almacenamiento por niveles (Tiered Storage, KIP-405), separando segmentos recientes en disco local y segmentos históricos en almacenamiento de objetos.",
    "Auditar con SQL sobre la tabla events de Mercado Brisa el impacto porcentual de las sesiones anónimas por tipo de evento y dispositivo."
  ],
  "sections": [
    {
      "heading": "Particionamiento por clave, réplicas ISR y particiones calientes",
      "body": "En **Apache Kafka**, un tópico se divide físicamente en varias particiones repartidas entre los brokers. Cada partición es un registro de solo adición (*append-only log*). Dentro de ella, cada mensaje recibe un entero secuencial inmutable llamado `offset`. Kafka garantiza el orden de lectura únicamente dentro de una misma partición, nunca entre particiones distintas. Cuando el productor define una clave (`key`), el cliente calcula `murmur2(key_bytes) mod num_partitions`. Así envía todos los eventos de esa entidad a la misma partición.\n\nSin embargo, en tablas con claves nulas (como `customer_id IS NULL` en visitantes sin sesión), reemplazar `NULL` por una constante como `\"ANONIMO\"` crea un cuello de botella. El hash envía el 100 % del tráfico anónimo a una sola **partición caliente** (*hot partition*). En cambio, si la clave se deja en `null`, el *Sticky Partitioner* reparte los lotes de forma equilibrada entre todas las particiones. Para asegurar durabilidad, cada partición mantiene réplicas sincronizadas (**ISR**, *In-Sync Replicas*) y el productor confirma con `acks=all` y `min.insync.replicas=2`.",
      "interactive": {
        "component": "cdc-log-stream",
        "caption": "Distribución de eventos por clave primaria hacia particiones y seguimiento de offsets por consumidor."
      },
      "example": {
        "language": "sql",
        "code": "-- Proporción de eventos sin customer_id (sesiones anónimas) por tipo de evento en Mercado Brisa\nSELECT event_type,\n       COUNT(*) AS total_events,\n       SUM(CASE WHEN customer_id IS NULL THEN 1 ELSE 0 END) AS anonymous_events,\n       ROUND(100.0 * SUM(CASE WHEN customer_id IS NULL THEN 1 ELSE 0 END) / COUNT(*), 2) AS anonymous_pct\nFROM events\nGROUP BY event_type\nORDER BY anonymous_pct DESC, event_type ASC;",
        "expectedOutput": [
          {
            "event_type": "page_view",
            "total_events": 9400,
            "anonymous_events": 1344,
            "anonymous_pct": 14.3
          },
          {
            "event_type": "product_view",
            "total_events": 9400,
            "anonymous_events": 1342,
            "anonymous_pct": 14.28
          },
          {
            "event_type": "add_to_cart",
            "total_events": 15400,
            "anonymous_events": 1344,
            "anonymous_pct": 8.73
          },
          {
            "event_type": "checkout_completed",
            "total_events": 15400,
            "anonymous_events": 1343,
            "anonymous_pct": 8.72
          },
          {
            "event_type": "checkout_started",
            "total_events": 15400,
            "anonymous_events": 1342,
            "anonymous_pct": 8.71
          }
        ]
      },
      "id": "de4-streaming-02-kafka-kraft-tiered-storage-sec-1"
    },
    {
      "heading": "Consenso KRaft en Apache Kafka 4.x: adiós definitivo a ZooKeeper",
      "body": "Durante años, Apache Kafka dependió de un clúster externo de **Apache ZooKeeper** para elegir al controlador y guardar metadatos de tópicos y particiones. Esa arquitectura dual obligaba a operar y asegurar dos sistemas distribuidos distintos. Además, cuando el controlador caía, el nuevo líder debía leer desde ZooKeeper el estado de todas las particiones. En clústeres con más de cien mil particiones, esa reconstrucción congelaba las operaciones de control durante varios minutos.\n\nA partir de **Apache Kafka 4.0** (tras completarse **KIP-833**), ZooKeeper fue eliminado del código base. Hoy, **KRaft** (*Kafka Raft Metadata Mode*) es el único protocolo de consenso disponible. En KRaft, un quórum de nodos con `process.roles=controller` gestiona el estado como un log replicado mediante Raft en el tópico interno `__cluster_metadata`. Los controladores en espera mantienen ese estado cargado en memoria en todo momento. Si el controlador activo falla, el nuevo líder toma el mando en milisegundos y permite escalar a millones de particiones.",
      "example": {
        "language": "sql",
        "code": "-- Simulación de sesgo en 4 particiones cuando customer_id NULL se fuerza a la partición 0\nSELECT CASE WHEN customer_id IS NULL THEN 0 ELSE (customer_id % 4) END AS naive_partition,\n       COUNT(*) AS events_in_partition,\n       ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) AS share_pct\nFROM events\nGROUP BY naive_partition\nORDER BY naive_partition ASC;",
        "expectedOutput": [
          {
            "naive_partition": 0,
            "events_in_partition": 19358,
            "share_pct": 29.78
          },
          {
            "naive_partition": 1,
            "events_in_partition": 15214,
            "share_pct": 23.41
          },
          {
            "naive_partition": 2,
            "events_in_partition": 15214,
            "share_pct": 23.41
          },
          {
            "naive_partition": 3,
            "events_in_partition": 15214,
            "share_pct": 23.41
          }
        ]
      },
      "id": "de4-streaming-02-kafka-kraft-tiered-storage-sec-2"
    },
    {
      "heading": "Almacenamiento por niveles (KIP-405) y desacoplamiento de cómputo",
      "body": "En el diseño clásico de Kafka, retener noventa días de eventos exigía montar decenas de terabytes en discos NVMe locales dentro de cada broker. Además, al sustituir un broker dañado o ampliar el clúster, era forzoso copiar por red todo ese historial hacia el nuevo nodo antes de equilibrar la carga.\n\nEl **almacenamiento por niveles** (*Tiered Storage*, definido en **KIP-405**) divide cada partición en dos capas transparentes para el cliente. La capa local caliente guarda solo el segmento activo y unas horas recientes (`local.retention.ms`) en los discos NVMe del broker. Así sirve a los consumidores en tiempo real desde la caché de página del sistema operativo (*page cache*). Cuando un segmento se cierra y vence el tiempo local, el `RemoteStorageManager` lo copia a la **capa remota fría** en almacenamiento de objetos (S3, GCS o Azure Blob) hasta cumplir `retention.ms`. Los consumidores en vivo leen en milisegundos y los reprocesamientos históricos leen desde el almacenamiento de objetos sin saturar los discos locales.",
      "example": {
        "language": "sql",
        "code": "-- Dimensionamiento de almacenamiento caliente (>= nov 2025) vs frío (< nov 2025) a 1.5 KB/evento\nSELECT device_type,\n       COUNT(*) AS total_events,\n       ROUND(COUNT(*) * 1.5 / 1024.0, 2) AS total_volume_mb,\n       ROUND(SUM(CASE WHEN event_ts >= TIMESTAMP '2025-11-01 00:00:00' THEN 1 ELSE 0 END) * 1.5 / 1024.0, 2) AS hot_local_mb,\n       ROUND(SUM(CASE WHEN event_ts < TIMESTAMP '2025-11-01 00:00:00' THEN 1 ELSE 0 END) * 1.5 / 1024.0, 2) AS cold_remote_mb\nFROM events\nGROUP BY device_type\nORDER BY total_volume_mb DESC;",
        "expectedOutput": [
          {
            "device_type": "desktop",
            "total_events": 23383,
            "total_volume_mb": 34.25,
            "hot_local_mb": 0.73,
            "cold_remote_mb": 33.52
          },
          {
            "device_type": "mobile",
            "total_events": 22524,
            "total_volume_mb": 32.99,
            "hot_local_mb": 0.69,
            "cold_remote_mb": 32.31
          },
          {
            "device_type": "pos_tienda",
            "total_events": 19093,
            "total_volume_mb": 27.97,
            "hot_local_mb": 0.48,
            "cold_remote_mb": 27.48
          }
        ]
      },
      "id": "de4-streaming-02-kafka-kraft-tiered-storage-sec-3"
    }
  ],
  "workedExample": {
    "title": "Diagnóstico de sesgo de partición y retención en el flujo events de Mercado Brisa",
    "description": "Analizamos los 65 000 registros de la tabla events de Mercado Brisa (empresa ficticia) para demostrar por qué sustituir customer_id nulo por una constante desequilibra el clúster y cómo repartir el volumen entre disco local y almacenamiento de objetos.",
    "audit": "Verificado con DuckDB sobre public/datasets/events.parquet (65 000 filas).",
    "steps": [
      {
        "label": "Paso 1 · Medir el volumen de eventos anónimos por tipo de interacción",
        "explanation": "Calculamos cuántos eventos carecen de `customer_id` en cada `event_type`. Observamos que `page_view` y `product_view` superan el 14,2 % de eventos anónimos, frente al 8,7 % en los eventos del embudo de pago.",
        "code": "SELECT event_type,\n       COUNT(*) AS total_events,\n       SUM(CASE WHEN customer_id IS NULL THEN 1 ELSE 0 END) AS null_key_events,\n       ROUND(100.0 * SUM(CASE WHEN customer_id IS NULL THEN 1 ELSE 0 END) / COUNT(*), 2) AS null_key_pct\nFROM events\nGROUP BY event_type\nORDER BY null_key_pct DESC;",
        "expectedOutput": [
          {
            "event_type": "page_view",
            "total_events": 9400,
            "null_key_events": 1344,
            "null_key_pct": 14.3
          },
          {
            "event_type": "product_view",
            "total_events": 9400,
            "null_key_events": 1342,
            "null_key_pct": 14.28
          },
          {
            "event_type": "add_to_cart",
            "total_events": 15400,
            "null_key_events": 1344,
            "null_key_pct": 8.73
          },
          {
            "event_type": "checkout_completed",
            "total_events": 15400,
            "null_key_events": 1343,
            "null_key_pct": 8.72
          },
          {
            "event_type": "checkout_started",
            "total_events": 15400,
            "null_key_events": 1342,
            "null_key_pct": 8.71
          }
        ]
      },
      {
        "label": "Paso 2 · Cuantificar la sobrecarga en la partición 0 frente al resto del clúster",
        "explanation": "Si un tópico tiene 4 particiones y todas las filas con `customer_id IS NULL` se enrutan a la partición 0, esa partición absorbe 19 358 eventos (29,78 %), mientras que las particiones 1, 2 y 3 reciben 15 214 eventos cada una (un 27,2 % más de carga en el broker afectado).",
        "code": "SELECT CASE WHEN customer_id IS NULL THEN 0 ELSE (customer_id % 4) END AS target_partition,\n       COUNT(*) AS events_count,\n       ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) AS partition_share_pct\nFROM events\nGROUP BY target_partition\nORDER BY target_partition ASC;",
        "expectedOutput": [
          {
            "target_partition": 0,
            "events_count": 19358,
            "partition_share_pct": 29.78
          },
          {
            "target_partition": 1,
            "events_count": 15214,
            "partition_share_pct": 23.41
          },
          {
            "target_partition": 2,
            "events_count": 15214,
            "partition_share_pct": 23.41
          },
          {
            "target_partition": 3,
            "events_count": 15214,
            "partition_share_pct": 23.41
          }
        ]
      },
      {
        "label": "Paso 3 · Aislar las combinaciones event_type y device_type con mayor volumen anónimo",
        "explanation": "Cruzamos `event_type` y `device_type` filtrando aquellos pares que acumulan al menos 448 eventos sin `customer_id`, identificando exactamente qué flujos deben usar `session_id` o `event_id` como clave de partición.",
        "code": "SELECT event_type,\n       device_type,\n       COUNT(*) AS total_events,\n       SUM(CASE WHEN customer_id IS NULL THEN 1 ELSE 0 END) AS null_key_events,\n       ROUND(100.0 * SUM(CASE WHEN customer_id IS NULL THEN 1 ELSE 0 END) / COUNT(*), 2) AS null_key_pct\nFROM events\nGROUP BY event_type, device_type\nHAVING SUM(CASE WHEN customer_id IS NULL THEN 1 ELSE 0 END) >= 448\nORDER BY null_key_pct DESC, total_events DESC, event_type ASC;",
        "expectedOutput": [
          {
            "event_type": "page_view",
            "device_type": "mobile",
            "total_events": 3134,
            "null_key_events": 449,
            "null_key_pct": 14.33
          },
          {
            "event_type": "page_view",
            "device_type": "pos_tienda",
            "total_events": 3133,
            "null_key_events": 448,
            "null_key_pct": 14.3
          },
          {
            "event_type": "product_view",
            "device_type": "mobile",
            "total_events": 3133,
            "null_key_events": 448,
            "null_key_pct": 14.3
          },
          {
            "event_type": "checkout_completed",
            "device_type": "pos_tienda",
            "total_events": 4204,
            "null_key_events": 449,
            "null_key_pct": 10.68
          },
          {
            "event_type": "add_to_cart",
            "device_type": "mobile",
            "total_events": 4633,
            "null_key_events": 448,
            "null_key_pct": 9.67
          },
          {
            "event_type": "checkout_started",
            "device_type": "desktop",
            "total_events": 4848,
            "null_key_events": 448,
            "null_key_pct": 9.24
          },
          {
            "event_type": "add_to_cart",
            "device_type": "desktop",
            "total_events": 5920,
            "null_key_events": 449,
            "null_key_pct": 7.58
          }
        ]
      }
    ]
  },
  "checks": [
    {
      "id": "chk-de4-02-ordering",
      "type": "mcq",
      "prompt": "En un tópico de Apache Kafka configurado con 12 particiones, ¿bajo qué condición se garantiza que dos eventos se lean exactamente en el mismo orden en que fueron producidos?",
      "options": [
        {
          "id": "a",
          "text": "Siempre que ambos eventos tengan una marca de tiempo (timestamp) en UTC dentro del mismo segundo.",
          "correct": false,
          "feedback": "El orden de lectura en Kafka no se reorganiza automáticamente por timestamp entre particiones distintas."
        },
        {
          "id": "b",
          "text": "Únicamente cuando ambos eventos se escriben en la misma partición (por ejemplo, al compartir la misma clave de partición).",
          "correct": true,
          "feedback": "Exacto. Kafka garantiza orden secuencial de offsets exclusivamente dentro de cada partición individual."
        },
        {
          "id": "c",
          "text": "Cuando el grupo de consumidores tiene exactamente un hilo por cada broker del clúster.",
          "correct": false,
          "feedback": "Un consumidor que lee de varias particiones recibe lotes entrelazados según la respuesta de red de cada líder."
        },
        {
          "id": "d",
          "text": "Cuando se activa el almacenamiento por niveles (Tiered Storage) sobre el tópico.",
          "correct": false,
          "feedback": "Tiered Storage gestiona la ubicación física de los segmentos cerrados, pero no impone un orden global entre particiones."
        }
      ],
      "explanation": "Cada partición en Kafka es un registro secuencial independiente; por ello, solo los eventos asignados a la misma partición mediante el hash de su clave mantienen orden estricto de offset."
    },
    {
      "id": "chk-de4-02-kraft",
      "type": "mcq",
      "prompt": "¿Por qué la conmutación por error (failover) del controlador en KRaft (Apache Kafka 4.x) tarda milisegundos en lugar de los minutos que podía tardar con Apache ZooKeeper?",
      "options": [
        {
          "id": "a",
          "text": "Porque KRaft elimina el concepto de líderes de partición y permite que cualquier broker escriba sin consenso.",
          "correct": false,
          "feedback": "Las particiones siguen teniendo un único broker líder e ISR; KRaft coordina precisamente quién es ese líder."
        },
        {
          "id": "b",
          "text": "Porque los controladores en espera replican continuamente el tópico __cluster_metadata y mantienen el grafo de metadatos cargado en memoria.",
          "correct": true,
          "feedback": "Correcto. En KRaft el nuevo controlador activo ya posee el estado actualizado en RAM, evitando leer cientos de miles de nodos desde ZooKeeper."
        },
        {
          "id": "c",
          "text": "Porque KRaft delega la elección de líder al balanceador de carga de red de los consumidores.",
          "correct": false,
          "feedback": "Los consumidores nunca eligen líderes de clúster; el consenso Raft ocurre exclusivamente entre los nodos con rol controller."
        }
      ],
      "explanation": "En KRaft (KIP-833), el quórum de controladores replica un registro de eventos en __cluster_metadata y mantiene la vista en memoria lista para asumir el liderazgo al instante."
    },
    {
      "id": "chk-de4-02-tiered",
      "type": "mcq",
      "prompt": "Al habilitar Tiered Storage (KIP-405) en un tópico de Kafka con 12 horas de retención local y 90 días de retención total, ¿qué ocurre cuando un nuevo grupo de consumidores solicita leer desde el offset 0 (hace 30 días)?",
      "options": [
        {
          "id": "a",
          "text": "El consumidor debe conectarse por su cuenta a la API de Amazon S3 y descomprimir archivos Parquet.",
          "correct": false,
          "feedback": "Tiered Storage es transparente para el cliente Kafka y conserva el formato nativo de segmentos de log, no Parquet."
        },
        {
          "id": "b",
          "text": "El broker sirve de forma transparente los segmentos antiguos desde el almacenamiento de objetos remoto mediante el protocolo Fetch estándar de Kafka.",
          "correct": true,
          "feedback": "Exacto. El cliente utiliza el mismo KafkaConsumer de siempre sin cambiar código; el broker recupera los bloques remotos y luego continúa con el segmento local."
        },
        {
          "id": "c",
          "text": "El broker descarga de golpe los 90 días completos al disco NVMe local antes de entregar el primer mensaje.",
          "correct": false,
          "feedback": "Eso agotaría el disco local del broker; el RemoteStorageManager transmite porciones de los segmentos remotos bajo demanda."
        }
      ],
      "explanation": "KIP-405 abstrae la ubicación física del segmento: el protocolo Fetch de Kafka entrega tanto los segmentos fríos desde almacenamiento de objetos como los segmentos calientes desde el page cache local."
    },
    {
      "id": "chk-de4-02-predict",
      "type": "predict-output",
      "prompt": "En la tabla events de Mercado Brisa (65 000 filas), 6 715 eventos tienen customer_id IS NULL. Si el productor reemplaza NULL por la cadena fija \"ANON\" antes de particionar, ¿cómo se distribuyen esos 6 715 eventos entre las 8 particiones del tópico?",
      "options": [
        {
          "id": "a",
          "text": "Se reparten en partes iguales de ~839 eventos en cada una de las 8 particiones.",
          "correct": false,
          "feedback": "Una cadena constante produce siempre exactamente el mismo valor en murmur2(\"ANON\"), por lo que nunca se reparte."
        },
        {
          "id": "b",
          "text": "Los 6 715 eventos caen íntegros en una sola partición porque murmur2(\"ANON\") mod 8 devuelve siempre el mismo índice.",
          "correct": true,
          "feedback": "Correcto. Al usar una clave estática para valores nulos, la función determinista murmur2 concentra todo el tráfico anónimo en una única partición."
        },
        {
          "id": "c",
          "text": "El broker rechaza los mensajes porque Kafka 4.x prohíbe claves repetidas en el mismo segundo.",
          "correct": false,
          "feedback": "Kafka permite millones de mensajes con la misma clave; el problema no es un error de rechazo sino el sesgo de carga."
        }
      ],
      "explanation": "Como murmur2 es determinista, cualquier clave estática de reemplazo mapea el 100 % de los eventos sin cliente a la misma partición; debe dejarse la clave en null o usar session_id."
    }
  ],
  "practice": {
    "type": "sql",
    "title": "Detección de combinaciones con alto sesgo de clave nula en el flujo events",
    "language": "sql",
    "prompt": "Escribe una consulta SQL sobre la tabla `events` de Mercado Brisa que agrupe por `event_type` y `device_type` para calcular: `total_events` (conteo total de filas), `null_key_events` (conteo de filas donde `customer_id IS NULL`) y `null_key_pct` (porcentaje de filas con `customer_id IS NULL` sobre el total del grupo, redondeado a 2 decimales). Filtra con `HAVING` únicamente los grupos donde `null_key_events >= 448` y ordena el resultado por `null_key_pct DESC, total_events DESC, event_type ASC`.",
    "starterCode": "SELECT event_type,\n       device_type,\n       COUNT(*) AS total_events,\n       -- TODO: cuenta cuántas filas tienen customer_id IS NULL\n       0 AS null_key_events,\n       -- TODO: calcula el porcentaje redondeado a 2 decimales: ROUND(100.0 * ... / COUNT(*), 2)\n       0.0 AS null_key_pct\nFROM events\nGROUP BY event_type, device_type\n-- TODO: filtra con HAVING los grupos con al menos 448 eventos sin customer_id\nORDER BY null_key_pct DESC, total_events DESC, event_type ASC;",
    "solution": "SELECT event_type,\n       device_type,\n       COUNT(*) AS total_events,\n       SUM(CASE WHEN customer_id IS NULL THEN 1 ELSE 0 END) AS null_key_events,\n       ROUND(100.0 * SUM(CASE WHEN customer_id IS NULL THEN 1 ELSE 0 END) / COUNT(*), 2) AS null_key_pct\nFROM events\nGROUP BY event_type, device_type\nHAVING SUM(CASE WHEN customer_id IS NULL THEN 1 ELSE 0 END) >= 448\nORDER BY null_key_pct DESC, total_events DESC, event_type ASC;",
    "solutionExplanation": "Al agrupar por event_type y device_type y contar los casos con customer_id IS NULL, detectamos que las vistas de página y producto (page_view y product_view) tienen más de un 14,3 % de sesiones anónimas. Filtrar con HAVING >= 448 aísla los 7 segmentos críticos donde una clave por defecto estática saturaría una partición de Kafka.",
    "orderMatters": true,
    "hints": [
      "Usa SUM(CASE WHEN customer_id IS NULL THEN 1 ELSE 0 END) para calcular null_key_events.",
      "Para null_key_pct multiplica por 100.0 en coma flotante antes de dividir entre COUNT(*) y envuelve todo en ROUND(..., 2).",
      "Añade HAVING SUM(CASE WHEN customer_id IS NULL THEN 1 ELSE 0 END) >= 448 después de GROUP BY event_type, device_type."
    ],
    "expected": "7 filas (event_type, device_type, total_events, null_key_events, null_key_pct)",
    "expectedOutputTable": [
      {
        "event_type": "page_view",
        "device_type": "mobile",
        "total_events": 3134,
        "null_key_events": 449,
        "null_key_pct": 14.33
      },
      {
        "event_type": "page_view",
        "device_type": "pos_tienda",
        "total_events": 3133,
        "null_key_events": 448,
        "null_key_pct": 14.3
      },
      {
        "event_type": "product_view",
        "device_type": "mobile",
        "total_events": 3133,
        "null_key_events": 448,
        "null_key_pct": 14.3
      },
      {
        "event_type": "checkout_completed",
        "device_type": "pos_tienda",
        "total_events": 4204,
        "null_key_events": 449,
        "null_key_pct": 10.68
      },
      {
        "event_type": "add_to_cart",
        "device_type": "mobile",
        "total_events": 4633,
        "null_key_events": 448,
        "null_key_pct": 9.67
      },
      {
        "event_type": "checkout_started",
        "device_type": "desktop",
        "total_events": 4848,
        "null_key_events": 448,
        "null_key_pct": 9.24
      },
      {
        "event_type": "add_to_cart",
        "device_type": "desktop",
        "total_events": 5920,
        "null_key_events": 449,
        "null_key_pct": 7.58
      }
    ],
    "expectedOutput": {
      "columns": [
        "event_type",
        "device_type",
        "total_events",
        "null_key_events",
        "null_key_pct"
      ],
      "rows": [
        [
          "page_view",
          "mobile",
          3134,
          449,
          14.33
        ],
        [
          "page_view",
          "pos_tienda",
          3133,
          448,
          14.3
        ],
        [
          "product_view",
          "mobile",
          3133,
          448,
          14.3
        ],
        [
          "checkout_completed",
          "pos_tienda",
          4204,
          449,
          10.68
        ],
        [
          "add_to_cart",
          "mobile",
          4633,
          448,
          9.67
        ],
        [
          "checkout_started",
          "desktop",
          4848,
          448,
          9.24
        ],
        [
          "add_to_cart",
          "desktop",
          5920,
          449,
          7.58
        ]
      ]
    }
  },
  "pipelineChallenge": {
    "title": "Ciclo de vida de un segmento de log en Apache Kafka 4.x con KRaft y Tiered Storage",
    "description": "Ordena cronológicamente cómo se asigna, replica, sella y archiva un bloque de eventos en un clúster moderno de Apache Kafka 4.x.",
    "steps": [
      {
        "id": "step-murmur-route",
        "label": "1. Cálculo de partición destino en el productor (murmur2 o Sticky Partitioner)",
        "text": "1. Cálculo de partición destino en el productor (murmur2 o Sticky Partitioner)",
        "role": "Kafka Producer",
        "detail": "El productor asigna la partición según el hash de la clave no nula o reparte por lotes si la clave es null."
      },
      {
        "id": "step-isr-append",
        "label": "2. Escritura en el segmento activo del líder y replicación en el conjunto ISR",
        "text": "2. Escritura en el segmento activo del líder y replicación en el conjunto ISR",
        "role": "Broker Líder & ISR",
        "detail": "El líder escribe en su disco local y confirma acks=all cuando las réplicas sincronizadas (min.insync.replicas) persisten el lote."
      },
      {
        "id": "step-kraft-meta",
        "label": "3. Registro de metadatos de segmento y estado de particiones en __cluster_metadata",
        "text": "3. Registro de metadatos de segmento y estado de particiones en __cluster_metadata",
        "role": "Quórum KRaft",
        "detail": "Los controladores KRaft actualizan el estado del clúster mediante consenso Raft sin intervención de ZooKeeper."
      },
      {
        "id": "step-remote-tier",
        "label": "4. Cierre del segmento y transferencia asíncrona al almacenamiento de objetos (KIP-405)",
        "text": "4. Cierre del segmento y transferencia asíncrona al almacenamiento de objetos (KIP-405)",
        "role": "RemoteStorageManager",
        "detail": "Al cerrarse el segmento y expirar local.retention.ms, el archivo se archiva en S3/GCS y se libera el disco NVMe local."
      }
    ],
    "correctOrder": [
      "step-murmur-route",
      "step-isr-append",
      "step-kraft-meta",
      "step-remote-tier"
    ],
    "hint": "El mensaje nace en el productor, se replica en el segmento activo de los brokers ISR, registra sus metadatos en el quórum KRaft y finalmente pasa a almacenamiento frío al cerrarse el segmento."
  },
  "roleNotes": {
    "de": "Nunca sustituyas una clave nula por un literal fijo como \"UNKNOWN\" o \"0\" antes de publicar en Kafka. Deja la clave en null para aprovechar el Sticky Partitioner o usa un identificador de sesión de alta cardinalidad.",
    "da": "Cuando reproceses meses de eventos históricos desde un tópico con Tiered Storage habilitado, ten presente que la lectura inicial proviene de almacenamiento de objetos (mayor latencia por lote, pero alto rendimiento sostenido).",
    "bi": "El porcentaje de eventos sin customer_id en las etapas altas del embudo (14,3 % en page_view frente a 8,7 % en checkout) explica por qué las métricas de conversión por usuario autenticado difieren de las métricas por sesión."
  },
  "summary": [
    "Kafka aplica murmur2(key) mod num_partitions y garantiza orden secuencial de offsets únicamente dentro de cada partición.",
    "Reemplazar claves nulas por una cadena constante concentra todo el tráfico anónimo en una sola partición caliente (hot partition).",
    "En Apache Kafka 4.x, KRaft gestiona los metadatos mediante consenso Raft en __cluster_metadata, eliminando ZooKeeper y acelerando la recuperación a milisegundos.",
    "Tiered Storage (KIP-405) desacopla cómputo y almacenamiento al retener horas recientes en NVMe local y meses históricos en almacenamiento de objetos."
  ],
  "flashcards": [
    {
      "id": "fc-de4-02-skew",
      "front": "¿Qué ocurre si un productor de Kafka reemplaza customer_id = NULL por la constante \"GUEST\" antes de enviar el mensaje?",
      "back": "Todos los mensajes sin cliente producen el mismo hash murmur2(\"GUEST\") y aterrizan en una única partición caliente, saturando un broker del clúster."
    },
    {
      "id": "fc-de4-02-kraft",
      "front": "¿Cómo almacena y replica los metadatos del clúster el protocolo KRaft en Apache Kafka 4.x?",
      "back": "Mediante un quórum de controladores Raft que registra cada cambio de topología como un evento en el tópico interno __cluster_metadata."
    },
    {
      "id": "fc-de4-02-isr",
      "front": "¿Qué combinación de parámetros garantiza que un mensaje confirmado en Kafka no se pierda aunque falle el broker líder inmediatamente después?",
      "back": "Configurar acks=all en el productor junto con min.insync.replicas >= 2 y replication.factor >= 3 en el tópico."
    },
    {
      "id": "fc-de4-02-tiered",
      "front": "¿Qué diferencia existe entre local.retention.ms y retention.ms cuando se activa Tiered Storage (KIP-405)?",
      "back": "local.retention.ms define cuánto tiempo permanece un segmento cerrado en el disco local del broker, mientras que retention.ms define la retención total incluyendo el almacenamiento de objetos remoto."
    }
  ],
  "glossaryTerms": [
    "particionamiento-hash-kafka",
    "consenso-kraft-kafka",
    "almacenamiento-niveles-kafka"
  ],
  "sources": [
    {
      "title": "Apache Kafka 4.0 Documentation — Design, Partitioning and Replication",
      "url": "https://kafka.apache.org/40/documentation.html",
      "publisher": "Apache Software Foundation",
      "accessed": "2026-10-29",
      "supports": "Particionamiento por hash murmur2, garantías de orden por partición, réplicas ISR y arquitectura general de Kafka 4.0."
    },
    {
      "title": "KIP-833: Mark KRaft as Production Ready",
      "url": "https://cwiki.apache.org/confluence/display/KAFKA/KIP-833%3A+Mark+KRaft+as+Production+Ready",
      "publisher": "Apache Software Foundation",
      "accessed": "2026-10-29",
      "supports": "Diseño del consenso Raft sobre __cluster_metadata, controladores con estado en memoria y retiro de ZooKeeper."
    },
    {
      "title": "KIP-405: Kafka Tiered Storage",
      "url": "https://cwiki.apache.org/confluence/display/KAFKA/KIP-405%3A+Kafka+Tiered+Storage",
      "publisher": "Apache Software Foundation",
      "accessed": "2026-10-29",
      "supports": "Separación entre almacenamiento local caliente y almacenamiento remoto en objetos mediante RemoteStorageManager."
    }
  ],
  "aiNotes": "Ayuda al estudiante a relacionar la consulta SQL sobre la tabla events de Mercado Brisa con el comportamiento real del particionador de Kafka. Si olvida multiplicar por 100.0 en coma flotante o colocar la condición >= 448 en la cláusula HAVING, guíalo paso a paso sin darle el bloque completo resuelto de inmediato."
};

export default lesson;
