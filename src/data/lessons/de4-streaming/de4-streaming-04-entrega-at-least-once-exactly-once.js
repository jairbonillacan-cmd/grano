export const lesson = {
  "id": "de4-streaming-04-entrega-at-least-once-exactly-once",
  "moduleId": "de4-streaming",
  "order": 4,
  "title": "Semántica at-least-once frente a exactly-once y límites",
  "subtitle": "Semántica de entrega (at-least-once frente a exactly-once) y sus límites reales",
  "tracks": [
    "de"
  ],
  "level": 4,
  "minutes": 25,
  "prerequisites": [
    "de4-streaming-03-flink-watermarks-mv"
  ],
  "contentVersion": 2,
  "needsReview": false,
  "dataset": "Mercado Brisa (empresa ficticia) — tabla payments (19 200 registros con reintentos y webhooks duplicados)",
  "block": "Bloque 4 · Flujos en tiempo real y CDC",
  "badge": "2PC & Idempotencia",
  "HookType": "Discrepancia financiera",
  "hook": "El cierre contable de Mercado Brisa (empresa ficticia) muestra un excedente ficticio de 168 674,63 dólares en la tabla de pagos frente a las liquidaciones bancarias. El equipo asegura que no puede haber duplicados porque Apache Flink tiene activo Checkpointing con modo EXACTLY_ONCE. Sin embargo, descubres 405 cobros capturados con idéntica clave de idempotencia enviados dos veces por el webhook externo con cuatro segundos de diferencia. ¿Qué garantiza realmente exactly-once y dónde terminan sus límites?",
  "objectives": [
    "Diferenciar las semánticas at-most-once, at-least-once y exactly-once tanto en el estado interno del motor de streaming como en los sistemas de salida.",
    "Explicar cómo funcionan las barreras asíncronas de Chandy-Lamport en Apache Flink y el protocolo de compromiso en dos fases (TwoPhaseCommitSinkFunction) con Kafka read_committed.",
    "Identificar los límites reales de 2PC (bloqueo por transacciones huérfanas y destinos sin soporte transaccional) y diseñar sumideros idempotentes basados en idempotency_key.",
    "Separar con SQL en la tabla payments de Mercado Brisa los reintentos bancarios legítimos (attempt_number = 2) de los webhooks duplicados y cuantificar la sobrefacturación por método de pago."
  ],
  "sections": [
    {
      "heading": "Entrega at-least-once frente a barreras de control Chandy-Lamport",
      "body": "Cuando un productor o un webhook envía un evento por red y no recibe acuse a tiempo, vuelve a enviar el mismo mensaje. Esta política de **entrega al menos una vez** (*at-least-once*) evita perder cobros durante microcortes de red. Sin embargo, introduce eventos duplicados en el flujo. Si un consumidor suma los importes directamente sin deduplicar, inflará los ingresos en cada reintento.\n\nDentro de **Apache Flink**, mantener el estado interno exacto ante fallos de nodos se logra mediante el algoritmo asíncrono de **Chandy-Lamport**. El coordinador (*JobManager*) inyecta marcadores llamados **barreras de checkpoint** en las fuentes. Estas barreras viajan con los datos por los canales de red. Cuando un operador recibe la barrera $n$ por un canal, retiene ese canal en un búfer hasta recibir la barrera $n$ de los demás canales. Una vez alineadas las entradas, vuelca su estado local desde RocksDB hacia almacenamiento duradero y propaga la barrera. Si un nodo cae, Flink rebobina el offset en Kafka hasta la última barrera confirmada y restaura el estado exacto.",
      "interactive": {
        "component": "cdc-log-stream",
        "caption": "Inspección de offsets, reintentos de entrega y deduplicación por clave de idempotencia."
      },
      "example": {
        "language": "sql",
        "code": "-- Desglose de filas totales, claves de idempotencia únicas y webhooks duplicados en payments\nSELECT status,\n       attempt_number,\n       COUNT(*) AS raw_rows,\n       COUNT(DISTINCT idempotency_key) AS unique_keys,\n       COUNT(*) - COUNT(DISTINCT idempotency_key) AS duplicate_webhook_rows\nFROM payments\nGROUP BY status, attempt_number\nORDER BY status ASC, attempt_number ASC;",
        "expectedOutput": [
          {
            "status": "captured",
            "attempt_number": 1,
            "raw_rows": 15930,
            "unique_keys": 15525,
            "duplicate_webhook_rows": 405
          },
          {
            "status": "captured",
            "attempt_number": 2,
            "raw_rows": 675,
            "unique_keys": 675,
            "duplicate_webhook_rows": 0
          },
          {
            "status": "failed",
            "attempt_number": 1,
            "raw_rows": 1812,
            "unique_keys": 1785,
            "duplicate_webhook_rows": 27
          },
          {
            "status": "failed",
            "attempt_number": 2,
            "raw_rows": 45,
            "unique_keys": 45,
            "duplicate_webhook_rows": 0
          },
          {
            "status": "pending",
            "attempt_number": 1,
            "raw_rows": 708,
            "unique_keys": 690,
            "duplicate_webhook_rows": 18
          },
          {
            "status": "pending",
            "attempt_number": 2,
            "raw_rows": 30,
            "unique_keys": 30,
            "duplicate_webhook_rows": 0
          }
        ]
      },
      "id": "de4-streaming-04-entrega-at-least-once-exactly-once-sec-1"
    },
    {
      "heading": "Compromiso en dos fases (2PC) hacia Kafka y aislamiento read_committed",
      "body": "Restaurar el estado interno de Flink no basta si el sumidero (*sink*) ya escribió en un sistema externo antes de caer. Al rebobinar desde el último *checkpoint*, volvería a escribir esos mismos registros. Para lograr entrega **exactamente una vez de extremo a extremo** (*end-to-end exactly-once*) hacia **Apache Kafka**, el conector aplica un **compromiso en dos fases** (*Two-Phase Commit*, `2PC`).\n\nEl sumidero abre una transacción en Kafka y escribe en ella todos los eventos entre la barrera $n-1$ y la barrera $n$. En la **fase de precompromiso** (*pre-commit*), cuando la barrera $n$ llega al sumidero, este cierra el lote actual y guarda el ID de transacción en el *checkpoint*. Luego abre una transacción nueva para los eventos siguientes. En la **fase de compromiso** (*commit*), el *JobManager* verifica que todos los operadores hayan completado el *checkpoint* $n$. Solo entonces el sumidero confirma la transacción en Kafka. Por ello, todo consumidor posterior debe usar `isolation.level = read_committed`. Si deja el valor por defecto `read_uncommitted`, leerá mensajes en vuelo que podrían abortarse.",
      "example": {
        "language": "sql",
        "code": "-- Inspección de dos pedidos en Mercado Brisa con entregas duplicadas de webhook (+4 segundos)\nSELECT order_id,\n       payment_id,\n       attempt_number,\n       status,\n       amount_usd,\n       idempotency_key,\n       payment_ts::VARCHAR AS payment_ts_utc\nFROM payments\nWHERE order_id IN (\n  SELECT order_id\n  FROM payments\n  GROUP BY order_id\n  HAVING COUNT(*) > COUNT(DISTINCT idempotency_key)\n  ORDER BY order_id ASC\n  LIMIT 2\n)\nORDER BY order_id ASC, payment_ts ASC, payment_id ASC;",
        "expectedOutput": [
          {
            "order_id": 10751,
            "payment_id": 1501,
            "attempt_number": 1,
            "status": "captured",
            "amount_usd": 104.4,
            "idempotency_key": "idem-ord-10751-a1",
            "payment_ts_utc": "2023-05-31 04:07:02"
          },
          {
            "order_id": 10751,
            "payment_id": 1502,
            "attempt_number": 1,
            "status": "captured",
            "amount_usd": 104.4,
            "idempotency_key": "idem-ord-10751-a1",
            "payment_ts_utc": "2023-05-31 04:07:06"
          },
          {
            "order_id": 10752,
            "payment_id": 1503,
            "attempt_number": 1,
            "status": "captured",
            "amount_usd": 103.04,
            "idempotency_key": "idem-ord-10752-a1",
            "payment_ts_utc": "2023-06-24 14:25:13"
          },
          {
            "order_id": 10752,
            "payment_id": 1504,
            "attempt_number": 1,
            "status": "captured",
            "amount_usd": 103.04,
            "idempotency_key": "idem-ord-10752-a1",
            "payment_ts_utc": "2023-06-24 14:25:17"
          }
        ]
      },
      "id": "de4-streaming-04-entrega-at-least-once-exactly-once-sec-2"
    },
    {
      "heading": "Límites reales de exactly-once y diseño de sumideros idempotentes",
      "body": "El protocolo 2PC tiene tres límites operativos importantes. Primero, añade **latencia de visibilidad**: los lectores con `read_committed` no ven los datos hasta que termina el *checkpoint*. Además, una transacción abierta detiene el avance del `Last Stable Offset` (`LSO`) de la partición. Segundo, si Flink cae durante más tiempo que `transaction.timeout.ms`, Kafka aborta la transacción preconfirmada. Tercero, 2PC **no filtra duplicados nacidos en el origen**, como un webhook HTTP externo que envía dos veces el mismo cobro con distinto `payment_id` pero igual `idempotency_key`.\n\nPor eso, la defensa definitiva consiste en diseñar **sumideros idempotentes por clave de negocio**. En la tabla `payments` de Mercado Brisa, un reintento bancario tras un fallo (`attempt_number = 2`) genera una clave nueva (`idem-ord-X-a2`). En cambio, un webhook reenviado por red repite exactamente la misma clave (`idem-ord-X-a1`). Deduplicar particionando por `idempotency_key` elimina las 450 repeticiones de red sin borrar ninguno de los 750 reintentos legítimos.",
      "example": {
        "language": "sql",
        "code": "-- Impacto financiero de no deduplicar por idempotency_key en cobros capturados\nWITH ranked_payments AS (\n  SELECT payment_id, order_id, payment_method, amount_usd, idempotency_key,\n         ROW_NUMBER() OVER (PARTITION BY idempotency_key ORDER BY payment_ts ASC, payment_id ASC) AS rn\n  FROM payments\n  WHERE status = 'captured'\n)\nSELECT payment_method,\n       COUNT(*) AS raw_captured_rows,\n       SUM(CASE WHEN rn = 1 THEN 1 ELSE 0 END) AS idempotent_rows,\n       COUNT(*) - SUM(CASE WHEN rn = 1 THEN 1 ELSE 0 END) AS duplicate_rows,\n       ROUND(SUM(amount_usd) - SUM(CASE WHEN rn = 1 THEN amount_usd ELSE 0 END), 2) AS overcounted_usd\nFROM ranked_payments\nGROUP BY payment_method\nORDER BY overcounted_usd DESC;",
        "expectedOutput": [
          {
            "payment_method": "transferencia_spei",
            "raw_captured_rows": 4059,
            "idempotent_rows": 3960,
            "duplicate_rows": 99,
            "overcounted_usd": 50107.45
          },
          {
            "payment_method": "efectivo_tienda",
            "raw_captured_rows": 4059,
            "idempotent_rows": 3960,
            "duplicate_rows": 99,
            "overcounted_usd": 46603.9
          },
          {
            "payment_method": "billetera_digital",
            "raw_captured_rows": 4244,
            "idempotent_rows": 4140,
            "duplicate_rows": 104,
            "overcounted_usd": 37121.3
          },
          {
            "payment_method": "card",
            "raw_captured_rows": 4243,
            "idempotent_rows": 4140,
            "duplicate_rows": 103,
            "overcounted_usd": 34841.98
          }
        ]
      },
      "id": "de4-streaming-04-entrega-at-least-once-exactly-once-sec-3"
    }
  ],
  "workedExample": {
    "title": "Conciliación idempotente de pagos y detección de sobrefacturación en Mercado Brisa",
    "description": "Auditamos las 19 200 filas de payments en Mercado Brisa (empresa ficticia) para distinguir entre reintentos de negocio (attempt_number = 2) y duplicados de transporte (misma idempotency_key), cuantificando los $168 674,63 USD de sobrefacturación.",
    "audit": "Verificado con DuckDB sobre public/datasets/payments.parquet (19 200 filas).",
    "steps": [
      {
        "label": "Paso 1 · Distinguir entre clave de pedido (order_id) y clave de intento (idempotency_key)",
        "explanation": "Un mismo `order_id` puede tener legítimamente dos filas en `payments` si el primer intento falló (`status = 'failed'`, `attempt_number = 1`) y el cliente reintentó el pago (`attempt_number = 2`). En cambio, dos filas con la misma `idempotency_key` son siempre entregas duplicadas del mismo intento.",
        "code": "SELECT COUNT(*) AS total_payment_rows,\n       COUNT(DISTINCT order_id) AS distinct_orders,\n       COUNT(DISTINCT idempotency_key) AS distinct_idempotency_keys,\n       COUNT(*) - COUNT(DISTINCT idempotency_key) AS total_duplicate_webhooks\nFROM payments;",
        "expectedOutput": [
          {
            "total_payment_rows": 19200,
            "distinct_orders": 18000,
            "distinct_idempotency_keys": 18750,
            "total_duplicate_webhooks": 450
          }
        ]
      },
      {
        "label": "Paso 2 · Numerar por idempotency_key preservando la primera llegada cronológica",
        "explanation": "En los pagos con `status = 'captured'`, aplicamos `ROW_NUMBER() OVER (PARTITION BY idempotency_key ORDER BY payment_ts ASC, payment_id ASC)` para quedarnos con el evento original (`rn = 1`) y marcar como duplicados las repeticiones posteriores (`rn > 1`).",
        "code": "WITH ranked_payments AS (\n  SELECT payment_id, order_id, payment_method, amount_usd, idempotency_key,\n         ROW_NUMBER() OVER (\n           PARTITION BY idempotency_key\n           ORDER BY payment_ts ASC, payment_id ASC\n         ) AS rn\n  FROM payments\n  WHERE status = 'captured'\n)\nSELECT COUNT(*) AS raw_captured,\n       SUM(CASE WHEN rn = 1 THEN 1 ELSE 0 END) AS exact_captured,\n       SUM(CASE WHEN rn > 1 THEN 1 ELSE 0 END) AS duplicate_captured,\n       ROUND(SUM(CASE WHEN rn > 1 THEN amount_usd ELSE 0 END), 2) AS total_overcounted_usd\nFROM ranked_payments;",
        "expectedOutput": [
          {
            "raw_captured": 16605,
            "exact_captured": 16200,
            "duplicate_captured": 405,
            "total_overcounted_usd": 168674.63
          }
        ]
      },
      {
        "label": "Paso 3 · Desglosar la sobrefacturación por método de pago",
        "explanation": "Agrupamos por `payment_method` para reportar a finanzas cuántas filas e ingresos brutos estaban inflados en cada canal antes de aplicar la deduplicación idempotente.",
        "code": "WITH ranked_payments AS (\n  SELECT payment_id, order_id, payment_method, amount_usd, idempotency_key,\n         ROW_NUMBER() OVER (\n           PARTITION BY idempotency_key\n           ORDER BY payment_ts ASC, payment_id ASC\n         ) AS rn\n  FROM payments\n  WHERE status = 'captured'\n)\nSELECT payment_method,\n       COUNT(*) AS raw_captured_rows,\n       SUM(CASE WHEN rn = 1 THEN 1 ELSE 0 END) AS idempotent_rows,\n       COUNT(*) - SUM(CASE WHEN rn = 1 THEN 1 ELSE 0 END) AS duplicate_rows,\n       ROUND(SUM(amount_usd), 2) AS raw_revenue_usd,\n       ROUND(SUM(CASE WHEN rn = 1 THEN amount_usd ELSE 0 END), 2) AS exact_revenue_usd,\n       ROUND(SUM(amount_usd) - SUM(CASE WHEN rn = 1 THEN amount_usd ELSE 0 END), 2) AS overcounted_usd\nFROM ranked_payments\nGROUP BY payment_method\nORDER BY overcounted_usd DESC;",
        "expectedOutput": [
          {
            "payment_method": "transferencia_spei",
            "raw_captured_rows": 4059,
            "idempotent_rows": 3960,
            "duplicate_rows": 99,
            "raw_revenue_usd": 1985280.48,
            "exact_revenue_usd": 1935173.03,
            "overcounted_usd": 50107.45
          },
          {
            "payment_method": "efectivo_tienda",
            "raw_captured_rows": 4059,
            "idempotent_rows": 3960,
            "duplicate_rows": 99,
            "raw_revenue_usd": 1973684.17,
            "exact_revenue_usd": 1927080.27,
            "overcounted_usd": 46603.9
          },
          {
            "payment_method": "billetera_digital",
            "raw_captured_rows": 4244,
            "idempotent_rows": 4140,
            "duplicate_rows": 104,
            "raw_revenue_usd": 1576444.15,
            "exact_revenue_usd": 1539322.85,
            "overcounted_usd": 37121.3
          },
          {
            "payment_method": "card",
            "raw_captured_rows": 4243,
            "idempotent_rows": 4140,
            "duplicate_rows": 103,
            "raw_revenue_usd": 1507753.83,
            "exact_revenue_usd": 1472911.85,
            "overcounted_usd": 34841.98
          }
        ]
      }
    ]
  },
  "checks": [
    {
      "id": "chk-de4-04-chandy-lamport",
      "type": "mcq",
      "prompt": "¿Qué hace un operador de Apache Flink con dos canales de entrada cuando recibe la barrera de checkpoint n por el canal 1, pero aún no la ha recibido por el canal 2 (en un checkpoint alineado)?",
      "options": [
        {
          "id": "a",
          "text": "Vuelca inmediatamente su estado a disco sin esperar al canal 2 y descarta los mensajes en tránsito.",
          "correct": false,
          "feedback": "Tomar la instantánea sin alinear ambos canales mezclaría registros previos y posteriores al checkpoint n."
        },
        {
          "id": "b",
          "text": "Almacena en un búfer temporal los registros que sigan llegando por el canal 1 tras la barrera y continúa procesando el canal 2 hasta recibir su barrera n.",
          "correct": true,
          "feedback": "Exacto. La alineación de barreras garantiza que el snapshot refleje exactamente todos los eventos anteriores a la barrera n en ambos canales."
        },
        {
          "id": "c",
          "text": "Detiene todos los productores de Kafka durante 10 segundos mediante una pausa global.",
          "correct": false,
          "feedback": "El algoritmo Chandy-Lamport en Flink es asíncrono y nunca bloquea a los productores externos."
        }
      ],
      "explanation": "En el checkpointing alineado basado en Chandy-Lamport, el operador alinea las barreras de todos sus canales de entrada antes de capturar su instantánea local."
    },
    {
      "id": "chk-de4-04-read-committed",
      "type": "mcq",
      "prompt": "Un trabajo de Flink escribe en un tópico de Kafka usando DeliveryGuarantee.EXACTLY_ONCE (Two-Phase Commit). ¿Qué ocurrirá si un microservicio consumidor lee ese tópico con la configuración por defecto isolation.level = read_uncommitted?",
      "options": [
        {
          "id": "a",
          "text": "Kafka rechazará la conexión del consumidor lanzando una excepción de seguridad.",
          "correct": false,
          "feedback": "Kafka permite conectarse con read_uncommitted; es responsabilidad del cliente elegir el nivel de aislamiento."
        },
        {
          "id": "b",
          "text": "El consumidor leerá mensajes de transacciones aún no confirmadas y verá duplicados si Flink falla y aborta la transacción antes del checkpoint.",
          "correct": true,
          "feedback": "Correcto. Con read_uncommitted el consumidor ignora los marcadores de control transaccional y lee registros sucios antes del commit."
        },
        {
          "id": "c",
          "text": "El consumidor solo recibirá los mensajes cuando se cierren los segmentos hacia Tiered Storage.",
          "correct": false,
          "feedback": "El aislamiento transaccional depende del Last Stable Offset (LSO), no del almacenamiento por niveles."
        }
      ],
      "explanation": "Para que el protocolo 2PC hacia Kafka proporcione lectura exactamente una vez, todo consumidor posterior debe configurar explícitamente isolation.level = read_committed."
    },
    {
      "id": "chk-de4-04-2pc-limits",
      "type": "mcq",
      "prompt": "¿Por qué habilitar Checkpointing EXACTLY_ONCE en Flink NO impidió que aparecieran los 405 cobros duplicados en la tabla payments de Mercado Brisa?",
      "options": [
        {
          "id": "a",
          "text": "Porque la pasarela de pagos externa reenvió el webhook con un nuevo payment_id 4 segundos después, ingresando como dos eventos distintos en el origen.",
          "correct": true,
          "feedback": "Exacto. El checkpointing de Flink evita duplicados causados por reprocesamientos internos del motor, pero para el motor dos webhooks entrantes son dos registros nuevos salvo que se deduplique por idempotency_key."
        },
        {
          "id": "b",
          "text": "Porque Flink solo soporta exactly-once sobre archivos CSV locales.",
          "correct": false,
          "feedback": "Flink soporta estado exactamente una vez con Kafka, RocksDB e Iceberg."
        },
        {
          "id": "c",
          "text": "Porque la columna amount_usd está almacenada en coma flotante.",
          "correct": false,
          "feedback": "El tipo numérico no tiene relación con la duplicación de filas por reintentos de red del webhook."
        }
      ],
      "explanation": "Las garantías internas de un motor de streaming cubren desde la fuente hasta el sumidero; si un productor externo reenvía el mismo hecho de negocio sin transacción compartida, se requiere deduplicación explícita por clave de idempotencia."
    },
    {
      "id": "chk-de4-04-dedup-key",
      "type": "predict-output",
      "prompt": "En la tabla payments de Mercado Brisa hay 18 000 pedidos únicos (order_id). 750 pedidos tuvieron un primer intento fallido (attempt_number = 1) seguido de un segundo intento (attempt_number = 2). Además existen 450 filas duplicadas por reenvío de webhook. Si deduplicas particionando por order_id en lugar de idempotency_key sin filtrar por status, ¿qué error cometes?",
      "options": [
        {
          "id": "a",
          "text": "Conservas solo una fila por pedido y si ordenas por payment_ts ASC te quedas con el primer intento fallido, descartando los 675 cobros exitosos del segundo intento.",
          "correct": true,
          "feedback": "Exacto. En los pedidos con reintento, el primer registro cronológico es status = \"failed\" (attempt_number = 1); particionar por order_id ASC borraría el pago capturado posterior."
        },
        {
          "id": "b",
          "text": "Obtienes exactamente las 19 200 filas originales sin cambios.",
          "correct": false,
          "feedback": "Particionar por order_id con rn = 1 colapsaría la tabla a 18 000 filas."
        },
        {
          "id": "c",
          "text": "Multiplicas por dos los importes de transferencia_spei.",
          "correct": false,
          "feedback": "Particionar por order_id reduce filas en lugar de multiplicarlas, pero descarta intentos válidos."
        }
      ],
      "explanation": "Cada intento legítimo posee su propia idempotency_key (idem-ord-X-a1 frente a idem-ord-X-a2); por tanto, la clave correcta para eliminar reenvíos de red sin borrar reintentos de negocio es idempotency_key."
    }
  ],
  "practice": {
    "type": "sql",
    "title": "Cuantificación de sobrefacturación por entrega at-least-once en payments",
    "language": "sql",
    "prompt": "Construye una consulta SQL sobre la tabla `payments` de Mercado Brisa filtrando únicamente los pagos con `status = 'captured'`. En una CTE `ranked_payments`, numera cada fila con `ROW_NUMBER() OVER (PARTITION BY idempotency_key ORDER BY payment_ts ASC, payment_id ASC) AS rn`. Luego agrupa por `payment_method` y calcula seis columnas: `raw_captured_rows` (total de filas capturadas sin deduplicar), `idempotent_rows` (filas únicas con `rn = 1`), `duplicate_rows` (diferencia entre filas brutas e idempotentes), `raw_revenue_usd` (suma bruta de `amount_usd` redondeada a 2 decimales), `exact_revenue_usd` (suma de `amount_usd` solo donde `rn = 1`, redondeada a 2 decimales) y `overcounted_usd` (diferencia entre la suma bruta y la suma exacta, redondeada a 2 decimales). Ordena por `overcounted_usd DESC`.",
    "starterCode": "WITH ranked_payments AS (\n  SELECT payment_id,\n         order_id,\n         payment_method,\n         amount_usd,\n         idempotency_key,\n         -- TODO: asigna ROW_NUMBER() particionando por idempotency_key y ordenando por payment_ts ASC, payment_id ASC\n         1 AS rn\n  FROM payments\n  WHERE status = 'captured'\n)\nSELECT payment_method,\n       COUNT(*) AS raw_captured_rows,\n       SUM(CASE WHEN rn = 1 THEN 1 ELSE 0 END) AS idempotent_rows,\n       COUNT(*) - SUM(CASE WHEN rn = 1 THEN 1 ELSE 0 END) AS duplicate_rows,\n       ROUND(SUM(amount_usd), 2) AS raw_revenue_usd,\n       -- TODO: suma amount_usd solo cuando rn = 1, redondeado a 2 decimales\n       0.0 AS exact_revenue_usd,\n       -- TODO: calcula la diferencia redondeada a 2 decimales entre el ingreso bruto y el ingreso exacto\n       0.0 AS overcounted_usd\nFROM ranked_payments\nGROUP BY payment_method\nORDER BY overcounted_usd DESC;",
    "solution": "WITH ranked_payments AS (\n  SELECT payment_id,\n         order_id,\n         payment_method,\n         amount_usd,\n         idempotency_key,\n         ROW_NUMBER() OVER (\n           PARTITION BY idempotency_key\n           ORDER BY payment_ts ASC, payment_id ASC\n         ) AS rn\n  FROM payments\n  WHERE status = 'captured'\n)\nSELECT payment_method,\n       COUNT(*) AS raw_captured_rows,\n       SUM(CASE WHEN rn = 1 THEN 1 ELSE 0 END) AS idempotent_rows,\n       COUNT(*) - SUM(CASE WHEN rn = 1 THEN 1 ELSE 0 END) AS duplicate_rows,\n       ROUND(SUM(amount_usd), 2) AS raw_revenue_usd,\n       ROUND(SUM(CASE WHEN rn = 1 THEN amount_usd ELSE 0 END), 2) AS exact_revenue_usd,\n       ROUND(SUM(amount_usd) - SUM(CASE WHEN rn = 1 THEN amount_usd ELSE 0 END), 2) AS overcounted_usd\nFROM ranked_payments\nGROUP BY payment_method\nORDER BY overcounted_usd DESC;",
    "solutionExplanation": "La ventana particionada por idempotency_key identifica los 405 cobros capturados que entraron duplicados por reenvío del webhook (+4 s). Al sumar solo rn = 1 obtenemos los 16 200 cobros reales ($6 874 488,00 USD) y demostramos que una ingesta at-least-once sin deduplicación inflaba los ingresos en $168 674,63 USD.",
    "orderMatters": true,
    "hints": [
      "En la CTE ranked_payments reemplaza 1 AS rn por ROW_NUMBER() OVER (PARTITION BY idempotency_key ORDER BY payment_ts ASC, payment_id ASC) AS rn.",
      "Para exact_revenue_usd utiliza ROUND(SUM(CASE WHEN rn = 1 THEN amount_usd ELSE 0 END), 2).",
      "Para overcounted_usd calcula ROUND(SUM(amount_usd) - SUM(CASE WHEN rn = 1 THEN amount_usd ELSE 0 END), 2)."
    ],
    "expected": "4 filas (payment_method, raw_captured_rows, idempotent_rows, duplicate_rows, raw_revenue_usd, exact_revenue_usd, overcounted_usd)",
    "expectedOutputTable": [
      {
        "payment_method": "transferencia_spei",
        "raw_captured_rows": 4059,
        "idempotent_rows": 3960,
        "duplicate_rows": 99,
        "raw_revenue_usd": 1985280.48,
        "exact_revenue_usd": 1935173.03,
        "overcounted_usd": 50107.45
      },
      {
        "payment_method": "efectivo_tienda",
        "raw_captured_rows": 4059,
        "idempotent_rows": 3960,
        "duplicate_rows": 99,
        "raw_revenue_usd": 1973684.17,
        "exact_revenue_usd": 1927080.27,
        "overcounted_usd": 46603.9
      },
      {
        "payment_method": "billetera_digital",
        "raw_captured_rows": 4244,
        "idempotent_rows": 4140,
        "duplicate_rows": 104,
        "raw_revenue_usd": 1576444.15,
        "exact_revenue_usd": 1539322.85,
        "overcounted_usd": 37121.3
      },
      {
        "payment_method": "card",
        "raw_captured_rows": 4243,
        "idempotent_rows": 4140,
        "duplicate_rows": 103,
        "raw_revenue_usd": 1507753.83,
        "exact_revenue_usd": 1472911.85,
        "overcounted_usd": 34841.98
      }
    ],
    "expectedOutput": {
      "columns": [
        "payment_method",
        "raw_captured_rows",
        "idempotent_rows",
        "duplicate_rows",
        "raw_revenue_usd",
        "exact_revenue_usd",
        "overcounted_usd"
      ],
      "rows": [
        [
          "transferencia_spei",
          4059,
          3960,
          99,
          1985280.48,
          1935173.03,
          50107.45
        ],
        [
          "efectivo_tienda",
          4059,
          3960,
          99,
          1973684.17,
          1927080.27,
          46603.9
        ],
        [
          "billetera_digital",
          4244,
          4140,
          104,
          1576444.15,
          1539322.85,
          37121.3
        ],
        [
          "card",
          4243,
          4140,
          103,
          1507753.83,
          1472911.85,
          34841.98
        ]
      ]
    }
  },
  "pipelineChallenge": {
    "title": "Protocolo de entrega exactamente una vez con barreras Chandy-Lamport y 2PC",
    "description": "Ordena la secuencia exacta en que Apache Flink coordina una instantánea distribuida con un sumidero transaccional de Kafka.",
    "steps": [
      {
        "id": "step-barrier-inject",
        "label": "1. Inyección de la barrera de checkpoint n en las fuentes y lectura de offsets",
        "text": "1. Inyección de la barrera de checkpoint n en las fuentes y lectura de offsets",
        "role": "JobManager & Source",
        "detail": "La fuente registra su offset actual de Kafka y propaga la barrera n aguas abajo junto con el flujo."
      },
      {
        "id": "step-align-snapshot",
        "label": "2. Alineación de barreras en operadores con estado y volcado asíncrono a RocksDB/S3",
        "text": "2. Alineación de barreras en operadores con estado y volcado asíncrono a RocksDB/S3",
        "role": "Stateful Operators",
        "detail": "Los operadores esperan la barrera n de todos sus canales de entrada y guardan su instantánea local."
      },
      {
        "id": "step-sink-precommit",
        "label": "3. Fase pre-commit en el sumidero al recibir la barrera n y apertura de nueva transacción",
        "text": "3. Fase pre-commit en el sumidero al recibir la barrera n y apertura de nueva transacción",
        "role": "TwoPhaseCommitSink",
        "detail": "El sumidero sella la transacción actual en Kafka sin hacerla visible aún y guarda su ID en el checkpoint."
      },
      {
        "id": "step-sink-commit-lso",
        "label": "4. Confirmación global del JobManager, commit en Kafka y avance del LSO para read_committed",
        "text": "4. Confirmación global del JobManager, commit en Kafka y avance del LSO para read_committed",
        "role": "Kafka Transaction Coordinator",
        "detail": "Completado el checkpoint n en todos los nodos, el sumidero confirma la transacción y los consumidores read_committed leen el lote."
      }
    ],
    "correctOrder": [
      "step-barrier-inject",
      "step-align-snapshot",
      "step-sink-precommit",
      "step-sink-commit-lso"
    ],
    "hint": "La barrera nace en la fuente, alinea y guarda el estado de los operadores intermedios, ejecuta el pre-commit al llegar al sumidero y finalmente hace commit cuando el JobManager confirma el checkpoint completo."
  },
  "roleNotes": {
    "de": "Si configuras un sumidero de Flink hacia Kafka en modo EXACTLY_ONCE, ajusta transaction.timeout.ms por encima de la suma del intervalo de checkpoint más el tiempo máximo de recuperación ante caídas, y exige isolation.level = read_committed a todos los consumidores.",
    "da": "Nunca asumas que una tabla en capa Bronze está libre de duplicados porque provenga de Kafka o Flink. Verifica siempre COUNT(*) frente a COUNT(DISTINCT idempotency_key) o COUNT(DISTINCT event_id).",
    "bi": "En pasarelas de pago, distingue siempre entre intentos de cobro (attempt_number) y duplicados de red. Filtrar por idempotency_key con status = \"captured\" es indispensable para que el ingreso reportado coincida con la tesorería bancaria."
  },
  "summary": [
    "La entrega at-least-once evita perder eventos mediante reintentos de red, pero introduce duplicados que deben deduplicarse.",
    "Las barreras asíncronas de Chandy-Lamport permiten a Apache Flink capturar instantáneas consistentes del estado distribuido sin pausar el flujo.",
    "El protocolo 2PC (TwoPhaseCommitSinkFunction) logra entrega exactamente una vez hacia Kafka solo si los consumidores leen con isolation.level = read_committed.",
    "Como 2PC no filtra webhooks duplicados desde el origen ni aplica a todos los destinos, la idempotencia por idempotency_key es la defensa definitiva."
  ],
  "flashcards": [
    {
      "id": "fc-de4-04-barriers",
      "front": "¿Para qué sirven las barreras de checkpoint basadas en el algoritmo de Chandy-Lamport en Apache Flink?",
      "back": "Dividen el flujo de eventos en épocas consecutivas para que todos los operadores guarden una instantánea de estado mutuamente consistente sin detener el procesamiento global."
    },
    {
      "id": "fc-de4-04-2pc",
      "front": "¿En qué momento exacto hace visible un sumidero 2PC de Flink los mensajes escritos en una transacción de Kafka?",
      "back": "En la fase de commit, después de que el JobManager confirma que absolutamente todos los operadores del grafo completaron el checkpoint correspondiente."
    },
    {
      "id": "fc-de4-04-isolation",
      "front": "¿Por qué un consumidor de Kafka debe usar isolation.level = read_committed cuando lee de un tópico escrito con transacciones 2PC?",
      "back": "Porque el modo por defecto read_uncommitted entrega mensajes de transacciones abiertas que podrían abortarse si el productor falla antes del commit."
    },
    {
      "id": "fc-de4-04-idempotency",
      "front": "En la tabla payments de Mercado Brisa, ¿cómo se distingue un reintento bancario legítimo de un webhook duplicado?",
      "back": "El reintento bancario legítimo incrementa attempt_number a 2 y genera una nueva idempotency_key, mientras que el webhook duplicado repite exactamente la misma idempotency_key 4 segundos después."
    }
  ],
  "glossaryTerms": [
    "barreras-checkpoint-chandy-lamport",
    "entrega-exactamente-una-vez-2pc",
    "captura-cambios-log-wal"
  ],
  "sources": [
    {
      "title": "Apache Flink Documentation — Checkpointing and Barrier Alignment",
      "url": "https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/datastream/fault-tolerance/checkpointing/",
      "publisher": "Apache Software Foundation",
      "accessed": "2026-10-29",
      "supports": "Algoritmo de instantáneas distribuidas asíncronas Chandy-Lamport y alineación de barreras."
    },
    {
      "title": "Apache Flink Documentation — Apache Kafka Connector and Fault Tolerance",
      "url": "https://nightlies.apache.org/flink/flink-docs-stable/docs/connectors/datastream/kafka/",
      "publisher": "Apache Software Foundation",
      "accessed": "2026-10-29",
      "supports": "Configuración de DeliveryGuarantee.EXACTLY_ONCE, transacciones de Kafka y requisito de read_committed."
    },
    {
      "title": "An Overview of End-to-End Exactly-Once Processing in Apache Flink",
      "url": "https://flink.apache.org/2018/02/28/an-overview-of-end-to-end-exactly-once-processing-in-apache-flink-with-apache-kafka-too/",
      "publisher": "Apache Software Foundation",
      "accessed": "2026-10-29",
      "supports": "Ciclo de vida de TwoPhaseCommitSinkFunction (beginTransaction, preCommit, commit) y gestión de fallos."
    }
  ],
  "aiNotes": "Si el estudiante confunde order_id con idempotency_key en la tabla payments de Mercado Brisa, recuérdale que filtrar status = \"captured\" y particionar por idempotency_key conserva los 16 200 cobros legítimos (15 525 del intento 1 más 675 del intento 2) y aisla exactamente los 405 duplicados ($168 674,63 USD)."
};

export default lesson;
