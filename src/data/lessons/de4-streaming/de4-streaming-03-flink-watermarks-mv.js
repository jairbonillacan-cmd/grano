export const lesson = {
  "id": "de4-streaming-03-flink-watermarks-mv",
  "moduleId": "de4-streaming",
  "legacyId": "l17-flink-watermarks-mv",
  "legacyOrder": 17,
  "order": 3,
  "title": "Tiempo de evento y watermarks en Apache Flink",
  "subtitle": "Manejo de eventos desordenados, ventanas temporales con estado acotado e Interval Joins",
  "tracks": [
    "de"
  ],
  "level": 4,
  "minutes": 30,
  "prerequisites": [
    "de4-streaming-02-kafka-kraft-tiered-storage"
  ],
  "contentVersion": 2,
  "needsReview": false,
  "dataset": "Mercado Brisa (empresa ficticia) — tablas events, orders y payments",
  "block": "Bloque 4 · Flujos en tiempo real y CDC",
  "badge": "Flink & Watermarks",
  "HookType": "Anomalía de ventanas",
  "hook": "El panel financiero de Mercado Brisa (empresa ficticia) une el flujo de pedidos con el de pagos usando una ventana de 30 segundos. Cada noche, la contabilidad detecta un faltante de 675 pedidos pagados por más de 288 000 dólares sin que Flink reporte errores. Al auditar los tiempos, notas que los reintentos bancarios tardan 110 segundos y conviven cinco husos horarios en la telemetría. ¿Cómo configurar marcas de agua e Interval Joins acotados sin descartar cobros válidos?",
  "objectives": [
    "Distinguir entre Tiempo de Evento (Event Time) normalizado en UTC y Tiempo de Procesamiento (Processing Time) cuando llegan registros desde múltiples husos horarios o redes móviles.",
    "Formular marcas de agua por desorden acotado (W(t) = max(event_time) - delta) y evitar que una partición silenciosa congele el avance temporal mediante withIdleness.",
    "Diseñar uniones por intervalo temporal (Interval Joins) en Apache Flink para acotar y purgar automáticamente el estado en RocksDB.",
    "Cuantificar con SQL sobre orders y payments de Mercado Brisa los pedidos e ingresos perdidos cuando la ventana del Interval Join excluye el segundo intento de cobro (+110 s)."
  ],
  "sections": [
    {
      "heading": "Tiempo de evento frente a tiempo de procesamiento y normalización UTC",
      "body": "En un motor de flujo como **Apache Flink**, agrupar registros usando el reloj local del servidor (**Processing Time**) genera resultados irreproducibles. Si un punto de venta pierde red durante dos minutos, el reloj local asigna sus ventas a una ventana tardía. Lo mismo ocurre al reprocesar un archivo histórico desde el almacenamiento remoto de Kafka. En cambio, operar por **Event Time** evalúa cada registro según el instante real en que ocurrió el hecho (`order_ts`, `payment_ts` o `event_ts`). Así garantizamos conteos idénticos tanto en vivo como en un reprocesamiento histórico.\n\nPara comparar el tiempo de evento entre países, todas las marcas deben convertirse a **UTC** antes de abrir ventanas. En la tabla `events` de Mercado Brisa conviven cinco husos horarios (`-06:00`, `-05:00`, `-03:00`, `Z` y `+01:00`) dentro de la columna `event_ts_raw`. Si un operador compara esas cadenas locales sin normalizarlas al instante UTC canónico (`event_ts`), desplazará los eventos varias horas y corromperá las métricas por hora.",
      "interactive": {
        "component": "streaming-watermark-lab",
        "caption": "Simulador de marcas de agua (watermarks), tolerancia al desorden y descarte de eventos tardíos en Apache Flink."
      },
      "example": {
        "language": "sql",
        "code": "-- Distribución de los 5 husos horarios de origen en events normalizados a UTC\nSELECT timezone_offset,\n       COUNT(*) AS raw_events,\n       COUNT(DISTINCT event_id) AS unique_events,\n       MIN(event_ts)::VARCHAR AS min_utc_ts,\n       MAX(event_ts)::VARCHAR AS max_utc_ts\nFROM events\nGROUP BY timezone_offset\nORDER BY timezone_offset ASC;",
        "expectedOutput": [
          {
            "timezone_offset": "+01:00",
            "raw_events": 13000,
            "unique_events": 12760,
            "min_utc_ts": "2023-01-01 01:37:15",
            "max_utc_ts": "2025-11-26 02:00:53"
          },
          {
            "timezone_offset": "-03:00",
            "raw_events": 13000,
            "unique_events": 12760,
            "min_utc_ts": "2023-01-01 00:14:03",
            "max_utc_ts": "2025-11-25 03:29:16"
          },
          {
            "timezone_offset": "-05:00",
            "raw_events": 13000,
            "unique_events": 12760,
            "min_utc_ts": "2023-01-01 01:35:05",
            "max_utc_ts": "2025-11-26 03:35:13"
          },
          {
            "timezone_offset": "-06:00",
            "raw_events": 13000,
            "unique_events": 12760,
            "min_utc_ts": "2023-01-01 01:48:22",
            "max_utc_ts": "2025-11-26 04:37:48"
          },
          {
            "timezone_offset": "Z",
            "raw_events": 13000,
            "unique_events": 12760,
            "min_utc_ts": "2023-01-01 09:31:04",
            "max_utc_ts": "2025-11-26 00:39:12"
          }
        ]
      },
      "id": "de4-streaming-03-flink-watermarks-mv-sec-1"
    },
    {
      "heading": "Watermarks por desorden acotado y bloqueo por particiones inactivas",
      "body": "Los eventos llegan desordenados por latencias de red o reintentos. Por eso el motor necesita saber cuándo cerrar una ventana sin esperar para siempre. Una **marca de agua** (*watermark*) es un marcador temporal monótono $W(t)$. Indica que ya no deberían llegar eventos con marca de tiempo menor o igual a $W(t)$. Con la estrategia `forBoundedOutOfOrderness`, Flink calcula $W(t) = \\max(\\text{event\\_time}) - \\delta$, donde $\\delta$ es la holgura de retraso tolerada. Una ventana $[t_{\\text{inicio}}, t_{\\text{fin}})$ se cierra y emite su resultado cuando $W(t) \\ge t_{\\text{fin}}$.\n\nCuando un operador lee de $k$ particiones en paralelo, Flink avanza su reloj tomando el **mínimo** de todas las entradas: $W_{\\text{op}} = \\min(W_1, W_2, \\dots, W_k)$. Esto causa un fallo clásico en producción. Si una sola partición de Kafka queda en silencio durante la noche, su marca $W_i$ deja de crecer. El mínimo global se congela y ninguna ventana vuelve a cerrarse. Para resolverlo, se configura `.withIdleness(Duration.ofSeconds(60))` o `table.exec.source.idle-timeout`, excluyendo del cálculo a las particiones silenciosas.",
      "example": {
        "language": "sql",
        "code": "-- Latencia en segundos entre order_ts y payment_ts por número de intento en Mercado Brisa\nSELECT p.status,\n       p.attempt_number,\n       COUNT(*) AS total_rows,\n       ROUND(MIN(epoch(p.payment_ts - o.order_ts)), 2) AS min_lag_s,\n       ROUND(MAX(epoch(p.payment_ts - o.order_ts)), 2) AS max_lag_s\nFROM payments p\nJOIN orders o ON o.order_id = p.order_id\nGROUP BY p.status, p.attempt_number\nORDER BY p.status ASC, p.attempt_number ASC;",
        "expectedOutput": [
          {
            "status": "captured",
            "attempt_number": 1,
            "total_rows": 15930,
            "min_lag_s": 15,
            "max_lag_s": 19
          },
          {
            "status": "captured",
            "attempt_number": 2,
            "total_rows": 675,
            "min_lag_s": 110,
            "max_lag_s": 110
          },
          {
            "status": "failed",
            "attempt_number": 1,
            "total_rows": 1812,
            "min_lag_s": 15,
            "max_lag_s": 19
          },
          {
            "status": "failed",
            "attempt_number": 2,
            "total_rows": 45,
            "min_lag_s": 110,
            "max_lag_s": 110
          },
          {
            "status": "pending",
            "attempt_number": 1,
            "total_rows": 708,
            "min_lag_s": 15,
            "max_lag_s": 19
          },
          {
            "status": "pending",
            "attempt_number": 2,
            "total_rows": 30,
            "min_lag_s": 110,
            "max_lag_s": 110
          }
        ]
      },
      "id": "de4-streaming-03-flink-watermarks-mv-sec-2"
    },
    {
      "heading": "Uniones por intervalo temporal (Interval Joins) y estado en RocksDB",
      "body": "Si escribimos un `INNER JOIN` convencional (`Regular Join`) entre dos flujos en Flink SQL, el motor guarda ambos flujos en **RocksDB** por tiempo indefinido. Lo hace porque cualquier pedido antiguo podría recibir un pago meses después. Sin un tiempo de expiración (`table.exec.state.ttl`), el estado crece sin pausa hasta agotar el disco y derribar el clúster.\n\nEn cambio, un **Interval Join** exige una cota temporal explícita entre ambos flujos: `p.payment_ts BETWEEN o.order_ts AND o.order_ts + INTERVAL '120' SECOND`. Con esta regla, Flink sabe que un pedido ya no podrá emparejarse cuando el *watermark* supere `o.order_ts + 120 s`. En ese instante borra el pedido de RocksDB de forma automática. En los datos de Mercado Brisa, el intento 1 de cobro ocurre entre `+15 s` y `+19 s`. Sin embargo, el reintento bancario (`attempt_number = 2`) llega a los `+110 s`. Una ventana corta de `30 s` pierde los 675 reintentos válidos, mientras que una ventana de `120 s` recupera todos los cobros manteniendo solo dos minutos de estado en memoria.",
      "example": {
        "language": "sql",
        "code": "-- Comparación de Interval Join con cota de 30 s frente a 120 s sobre pagos deduplicados\nWITH dedup_payments AS (\n  SELECT order_id, payment_id, payment_ts, payment_method, amount_usd, status,\n         ROW_NUMBER() OVER (PARTITION BY idempotency_key ORDER BY payment_ts ASC, payment_id ASC) AS rn\n  FROM payments\n)\nSELECT p.payment_method,\n       COUNT(DISTINCT o.order_id) AS total_captured_orders,\n       SUM(CASE WHEN p.payment_ts <= o.order_ts + INTERVAL '30 seconds' THEN 1 ELSE 0 END) AS within_30s_window,\n       SUM(CASE WHEN p.payment_ts > o.order_ts + INTERVAL '30 seconds' THEN 1 ELSE 0 END) AS late_retry_orders,\n       ROUND(SUM(CASE WHEN p.payment_ts > o.order_ts + INTERVAL '30 seconds' THEN p.amount_usd ELSE 0 END), 2) AS late_retry_usd\nFROM orders o\nJOIN dedup_payments p\n  ON p.order_id = o.order_id\n AND p.rn = 1\n AND p.status = 'captured'\n AND p.payment_ts BETWEEN o.order_ts AND o.order_ts + INTERVAL '120 seconds'\nGROUP BY p.payment_method\nORDER BY late_retry_usd DESC;",
        "expectedOutput": [
          {
            "payment_method": "transferencia_spei",
            "total_captured_orders": 3960,
            "within_30s_window": 3795,
            "late_retry_orders": 165,
            "late_retry_usd": 81508.97
          },
          {
            "payment_method": "efectivo_tienda",
            "total_captured_orders": 3960,
            "within_30s_window": 3795,
            "late_retry_orders": 165,
            "late_retry_usd": 81222.72
          },
          {
            "payment_method": "billetera_digital",
            "total_captured_orders": 4140,
            "within_30s_window": 3968,
            "late_retry_orders": 172,
            "late_retry_usd": 65070.28
          },
          {
            "payment_method": "card",
            "total_captured_orders": 4140,
            "within_30s_window": 3967,
            "late_retry_orders": 173,
            "late_retry_usd": 60787.32
          }
        ]
      },
      "id": "de4-streaming-03-flink-watermarks-mv-sec-3"
    }
  ],
  "workedExample": {
    "title": "Calibración del Interval Join entre pedidos y pagos en Mercado Brisa",
    "description": "Auditamos las marcas de tiempo de orders (18 000 pedidos) y payments (19 200 registros) en Mercado Brisa (empresa ficticia) para demostrar por qué una ventana de 30 segundos pierde $288 589,29 USD en reintentos legítimos y cómo dimensionar la ventana de 120 segundos.",
    "audit": "Verificado con DuckDB sobre public/datasets/orders.parquet y public/datasets/payments.parquet.",
    "steps": [
      {
        "label": "Paso 1 · Medir el retraso real entre order_ts y payment_ts según el número de intento",
        "explanation": "Calculamos en segundos la diferencia `epoch(p.payment_ts - o.order_ts)` agrupando por `status` y `attempt_number`. Descubrimos un patrón bimodal claro: el intento 1 tarda entre 15 y 19 segundos, pero el intento 2 tarda 110 segundos.",
        "code": "SELECT p.status,\n       p.attempt_number,\n       COUNT(*) AS rows_count,\n       ROUND(MIN(epoch(p.payment_ts - o.order_ts)), 2) AS min_lag_s,\n       ROUND(MAX(epoch(p.payment_ts - o.order_ts)), 2) AS max_lag_s\nFROM payments p\nJOIN orders o ON o.order_id = p.order_id\nGROUP BY p.status, p.attempt_number\nORDER BY p.status, p.attempt_number;",
        "expectedOutput": [
          {
            "status": "captured",
            "attempt_number": 1,
            "rows_count": 15930,
            "min_lag_s": 15,
            "max_lag_s": 19
          },
          {
            "status": "captured",
            "attempt_number": 2,
            "rows_count": 675,
            "min_lag_s": 110,
            "max_lag_s": 110
          },
          {
            "status": "failed",
            "attempt_number": 1,
            "rows_count": 1812,
            "min_lag_s": 15,
            "max_lag_s": 19
          },
          {
            "status": "failed",
            "attempt_number": 2,
            "rows_count": 45,
            "min_lag_s": 110,
            "max_lag_s": 110
          },
          {
            "status": "pending",
            "attempt_number": 1,
            "rows_count": 708,
            "min_lag_s": 15,
            "max_lag_s": 19
          },
          {
            "status": "pending",
            "attempt_number": 2,
            "rows_count": 30,
            "min_lag_s": 110,
            "max_lag_s": 110
          }
        ]
      },
      {
        "label": "Paso 2 · Deduplicar entregas repetidas de webhook antes de cruzar flujos",
        "explanation": "Antes de evaluar la ventana temporal, numeramos por `idempotency_key` (`rn = 1`) para descartar los 405 webhooks duplicados del intento 1 que llegan 4 segundos después del cobro original.",
        "code": "WITH dedup_payments AS (\n  SELECT order_id, payment_id, payment_ts, payment_method, amount_usd, status, attempt_number,\n         ROW_NUMBER() OVER (PARTITION BY idempotency_key ORDER BY payment_ts ASC, payment_id ASC) AS rn\n  FROM payments\n)\nSELECT attempt_number,\n       COUNT(*) AS unique_captured_payments,\n       ROUND(SUM(amount_usd), 2) AS total_usd\nFROM dedup_payments\nWHERE rn = 1 AND status = 'captured'\nGROUP BY attempt_number\nORDER BY attempt_number;",
        "expectedOutput": [
          {
            "attempt_number": 1,
            "unique_captured_payments": 15525,
            "total_usd": 6585898.71
          },
          {
            "attempt_number": 2,
            "unique_captured_payments": 675,
            "total_usd": 288589.29
          }
        ]
      },
      {
        "label": "Paso 3 · Cuantificar por método de pago los cobros tardíos entre 30 s y 120 s",
        "explanation": "Aplicamos el predicado de `Interval Join` (`p.payment_ts BETWEEN o.order_ts AND o.order_ts + INTERVAL '120 seconds'`) y desglosamos cuántos pedidos e ingresos caen dentro de los primeros 30 segundos frente a los que llegan entre 30 y 120 segundos.",
        "code": "WITH dedup_payments AS (\n  SELECT order_id, payment_id, payment_ts, payment_method, amount_usd, status,\n         ROW_NUMBER() OVER (PARTITION BY idempotency_key ORDER BY payment_ts ASC, payment_id ASC) AS rn\n  FROM payments\n)\nSELECT p.payment_method,\n       COUNT(DISTINCT o.order_id) AS total_captured_orders,\n       SUM(CASE WHEN p.payment_ts <= o.order_ts + INTERVAL '30 seconds' THEN 1 ELSE 0 END) AS within_30s_window,\n       SUM(CASE WHEN p.payment_ts > o.order_ts + INTERVAL '30 seconds' THEN 1 ELSE 0 END) AS late_retry_orders,\n       ROUND(SUM(CASE WHEN p.payment_ts > o.order_ts + INTERVAL '30 seconds' THEN p.amount_usd ELSE 0 END), 2) AS late_retry_usd\nFROM orders o\nJOIN dedup_payments p\n  ON p.order_id = o.order_id\n AND p.rn = 1\n AND p.status = 'captured'\n AND p.payment_ts BETWEEN o.order_ts AND o.order_ts + INTERVAL '120 seconds'\nGROUP BY p.payment_method\nORDER BY late_retry_usd DESC;",
        "expectedOutput": [
          {
            "payment_method": "transferencia_spei",
            "total_captured_orders": 3960,
            "within_30s_window": 3795,
            "late_retry_orders": 165,
            "late_retry_usd": 81508.97
          },
          {
            "payment_method": "efectivo_tienda",
            "total_captured_orders": 3960,
            "within_30s_window": 3795,
            "late_retry_orders": 165,
            "late_retry_usd": 81222.72
          },
          {
            "payment_method": "billetera_digital",
            "total_captured_orders": 4140,
            "within_30s_window": 3968,
            "late_retry_orders": 172,
            "late_retry_usd": 65070.28
          },
          {
            "payment_method": "card",
            "total_captured_orders": 4140,
            "within_30s_window": 3967,
            "late_retry_orders": 173,
            "late_retry_usd": 60787.32
          }
        ]
      }
    ]
  },
  "checks": [
    {
      "id": "chk-de4-03-watermark-math",
      "type": "predict-output",
      "prompt": "Un operador de Apache Flink usa una estrategia de watermark por desorden acotado con holgura delta = 20 segundos y ventanas TUMBLE de 1 minuto ([10:00:00, 10:01:00)). Hasta ahora el mayor event_time recibido es 10:01:15. ¿Qué ocurre cuando llega un evento con event_time = 10:01:22?",
      "options": [
        {
          "id": "a",
          "text": "El watermark avanza a 10:01:02 y dispara el cierre y emisión de la ventana [10:00:00, 10:01:00).",
          "correct": true,
          "feedback": "Exacto. W(t) = 10:01:22 - 00:00:20 = 10:01:02. Al superar el límite superior 10:01:00, la ventana se cierra y emite su agregado."
        },
        {
          "id": "b",
          "text": "El watermark retrocede si el siguiente evento trae una marca 10:00:55.",
          "correct": false,
          "feedback": "Un watermark es estrictamente monótono creciente: depende del máximo histórico observado y nunca retrocede."
        },
        {
          "id": "c",
          "text": "La ventana se cerró a las 10:01:00 del reloj del servidor independientemente de los eventos.",
          "correct": false,
          "feedback": "Eso ocurriría en Processing Time; en Event Time el cierre depende exclusivamente del avance del watermark."
        }
      ],
      "explanation": "Con forBoundedOutOfOrderness(20s), el watermark vale max(event_time) - 20s = 10:01:02, superando el fin de la ventana 10:01:00 y disparando su evaluación."
    },
    {
      "id": "chk-de4-03-idle-source",
      "type": "mcq",
      "prompt": "Tu trabajo de Flink lee un tópico de Kafka con 6 particiones. Durante la noche, la partición 4 no recibe ningún evento durante 40 minutos mientras las otras 5 siguen recibiendo miles de registros. Si NO has configurado withIdleness, ¿qué síntoma observarás?",
      "options": [
        {
          "id": "a",
          "text": "Solo se retrasan los eventos de la partición 4, pero las otras 5 particiones cierran sus ventanas con normalidad.",
          "correct": false,
          "feedback": "En un operador con clave compartida (keyBy), el watermark de entrada es el mínimo de todas las subtareas origen."
        },
        {
          "id": "b",
          "text": "El watermark global del operador queda congelado en el último valor de la partición 4, deteniendo el cierre de ventanas y reteniendo todo el estado en memoria.",
          "correct": true,
          "feedback": "Correcto. Como W_op = min(W_1, ..., W_6), una sola partición silenciosa impide que avance el mínimo global hasta que se marque como idle."
        },
        {
          "id": "c",
          "text": "Flink elimina automáticamente la partición 4 del tópico de Kafka tras 30 segundos sin tráfico.",
          "correct": false,
          "feedback": "Flink es un consumidor y nunca borra particiones del broker Kafka."
        }
      ],
      "explanation": "Al propagar el mínimo de las marcas de agua de todas las particiones de entrada, una partición sin tráfico detiene el reloj de evento global salvo que se active withIdleness."
    },
    {
      "id": "chk-de4-03-interval-join",
      "type": "mcq",
      "prompt": "¿Por qué un Interval Join (p.payment_ts BETWEEN o.order_ts AND o.order_ts + INTERVAL '120' SECOND) protege la estabilidad del backend RocksDB frente a un Regular Join en streaming?",
      "options": [
        {
          "id": "a",
          "text": "Porque ejecuta el cruce directamente en los discos de Kafka sin usar memoria ni estado en Flink.",
          "correct": false,
          "feedback": "Flink necesita almacenar temporalmente los eventos de ambos flujos en su propio backend de estado para emparejarlos."
        },
        {
          "id": "b",
          "text": "Porque permite a Flink descartar automáticamente del estado cualquier pedido cuyo límite superior (order_ts + 120 s) ya haya sido superado por el watermark.",
          "correct": true,
          "feedback": "Exacto. Al estar acotada la ventana de emparejamiento, el estado activo en RocksDB solo retiene los últimos minutos en lugar de crecer sin límite."
        },
        {
          "id": "c",
          "text": "Porque muestrea aleatoriamente el 10 % de los pagos para reducir el uso de disco.",
          "correct": false,
          "feedback": "Un Interval Join es 100 % exacto dentro de los límites temporales definidos; nunca realiza muestreo."
        }
      ],
      "explanation": "Un Regular Join retiene ambos flujos indefinidamente por si llega una coincidencia futura; el Interval Join acota la espera y limpia el estado en cuanto avanza el watermark."
    },
    {
      "id": "chk-de4-03-brisa-lag",
      "type": "mcq",
      "prompt": "En Mercado Brisa, los pagos de intento 1 llegan entre +15 s y +19 s respecto a order_ts, mientras que los reintentos (attempt_number = 2) llegan a +110 s. Si configuras un Interval Join de 30 segundos sin allowedLateness adicional, ¿qué pasa con los 675 reintentos capturados?",
      "options": [
        {
          "id": "a",
          "text": "Se emparejan igualmente porque Flink ignora el límite superior cuando attempt_number = 2.",
          "correct": false,
          "feedback": "El predicado temporal del Interval Join se evalúa de forma estricta sobre las marcas de tiempo de todos los registros."
        },
        {
          "id": "b",
          "text": "Quedan fuera del predicado temporal de 30 segundos y no se emiten en el resultado del join, subestimando los ingresos en $288 589,29 USD.",
          "correct": true,
          "feedback": "Exacto. Al llegar a los 110 segundos, caen fuera del rango [order_ts, order_ts + 30 s] y el pedido ya fue purgado del estado del join."
        },
        {
          "id": "c",
          "text": "Se duplican automáticamente en la tabla de reembolsos.",
          "correct": false,
          "feedback": "Un registro descartado por la condición de unión temporal no genera filas en otras tablas."
        }
      ],
      "explanation": "Si el límite superior del Interval Join (30 s) es menor que la latencia real del segundo intento de cobro (110 s), esos 675 cobros válidos nunca cumplen la condición de unión."
    }
  ],
  "practice": {
    "type": "sql",
    "title": "Auditoría de cobros tardíos en un Interval Join de 30 s frente a 120 s",
    "language": "sql",
    "prompt": "Construye una consulta SQL en DuckDB que primero deduplique la tabla `payments` en una CTE `dedup_payments` usando `ROW_NUMBER() OVER (PARTITION BY idempotency_key ORDER BY payment_ts ASC, payment_id ASC) AS rn`. Luego realiza un `Interval Join` con `orders` filtrando únicamente pagos únicos confirmados (`p.rn = 1 AND p.status = 'captured'`) cuya marca `p.payment_ts` caiga entre `o.order_ts` y `o.order_ts + INTERVAL '120 seconds'`. Agrupa por `p.payment_method` y calcula: `total_captured_orders` (`COUNT(DISTINCT o.order_id)`), `within_30s_window` (pagos con `p.payment_ts <= o.order_ts + INTERVAL '30 seconds'`), `late_retry_orders` (pagos con `p.payment_ts > o.order_ts + INTERVAL '30 seconds'`) y `late_retry_usd` (suma de `p.amount_usd` para los pagos que superan los 30 segundos, redondeada a 2 decimales). Ordena por `late_retry_usd DESC`.",
    "starterCode": "WITH dedup_payments AS (\n  SELECT order_id,\n         payment_id,\n         payment_ts,\n         payment_method,\n         amount_usd,\n         status,\n         -- COMPLETA: reemplaza 1 por ROW_NUMBER() OVER (PARTITION BY idempotency_key ORDER BY payment_ts ASC, payment_id ASC)\n         1 AS rn\n  FROM payments\n)\nSELECT p.payment_method,\n       COUNT(DISTINCT o.order_id) AS total_captured_orders,\n       -- COMPLETA: calcula within_30s_window, late_retry_orders y late_retry_usd\n       0 AS within_30s_window,\n       0 AS late_retry_orders,\n       0 AS late_retry_usd\nFROM orders o\nJOIN dedup_payments p\n  ON p.order_id = o.order_id\n AND p.rn = 1\n AND p.status = 'captured'\n -- COMPLETA: añade AND p.payment_ts BETWEEN o.order_ts AND o.order_ts + INTERVAL '120 seconds'\nGROUP BY p.payment_method\nORDER BY late_retry_usd DESC;",
    "solution": "WITH dedup_payments AS (\n  SELECT order_id,\n         payment_id,\n         payment_ts,\n         payment_method,\n         amount_usd,\n         status,\n         ROW_NUMBER() OVER (\n           PARTITION BY idempotency_key\n           ORDER BY payment_ts ASC, payment_id ASC\n         ) AS rn\n  FROM payments\n)\nSELECT p.payment_method,\n       COUNT(DISTINCT o.order_id) AS total_captured_orders,\n       SUM(CASE WHEN p.payment_ts <= o.order_ts + INTERVAL '30 seconds' THEN 1 ELSE 0 END) AS within_30s_window,\n       SUM(CASE WHEN p.payment_ts > o.order_ts + INTERVAL '30 seconds' THEN 1 ELSE 0 END) AS late_retry_orders,\n       ROUND(SUM(CASE WHEN p.payment_ts > o.order_ts + INTERVAL '30 seconds' THEN p.amount_usd ELSE 0 END), 2) AS late_retry_usd\nFROM orders o\nJOIN dedup_payments p\n  ON p.order_id = o.order_id\n AND p.rn = 1\n AND p.status = 'captured'\n AND p.payment_ts BETWEEN o.order_ts AND o.order_ts + INTERVAL '120 seconds'\nGROUP BY p.payment_method\nORDER BY late_retry_usd DESC;",
    "solutionExplanation": "Al deduplicar primero por idempotency_key (rn = 1) eliminamos los webhooks repetidos a los +19 s y nos quedamos con un único cobro válido por transacción. Al cruzar con un intervalo de 120 segundos comprobamos que 15 525 pedidos se resuelven dentro de 30 segundos, mientras que los 675 reintentos (attempt_number = 2 a +110 s) representan $288 589,29 USD que una ventana estrecha de 30 segundos descartaría.",
    "orderMatters": true,
    "hints": [
      "En dedup_payments usa ROW_NUMBER() OVER (PARTITION BY idempotency_key ORDER BY payment_ts ASC, payment_id ASC) AS rn.",
      "Para late_retry_orders escribe SUM(CASE WHEN p.payment_ts > o.order_ts + INTERVAL '30 seconds' THEN 1 ELSE 0 END).",
      "Para late_retry_usd envuelve en ROUND(..., 2) la suma condicional SUM(CASE WHEN p.payment_ts > o.order_ts + INTERVAL '30 seconds' THEN p.amount_usd ELSE 0 END)."
    ],
    "expectedOutputTable": [
      {
        "payment_method": "transferencia_spei",
        "total_captured_orders": 3960,
        "within_30s_window": 3795,
        "late_retry_orders": 165,
        "late_retry_usd": 81508.97
      },
      {
        "payment_method": "efectivo_tienda",
        "total_captured_orders": 3960,
        "within_30s_window": 3795,
        "late_retry_orders": 165,
        "late_retry_usd": 81222.72
      },
      {
        "payment_method": "billetera_digital",
        "total_captured_orders": 4140,
        "within_30s_window": 3968,
        "late_retry_orders": 172,
        "late_retry_usd": 65070.28
      },
      {
        "payment_method": "card",
        "total_captured_orders": 4140,
        "within_30s_window": 3967,
        "late_retry_orders": 173,
        "late_retry_usd": 60787.32
      }
    ],
    "expectedOutput": {
      "columns": [
        "payment_method",
        "total_captured_orders",
        "within_30s_window",
        "late_retry_orders",
        "late_retry_usd"
      ],
      "rows": [
        [
          "transferencia_spei",
          3960,
          3795,
          165,
          81508.97
        ],
        [
          "efectivo_tienda",
          3960,
          3795,
          165,
          81222.72
        ],
        [
          "billetera_digital",
          4140,
          3968,
          172,
          65070.28
        ],
        [
          "card",
          4140,
          3967,
          173,
          60787.32
        ]
      ]
    }
  },
  "pipelineChallenge": {
    "title": "Procesamiento por tiempo de evento e Interval Join acotado en Apache Flink",
    "description": "Ordena las etapas técnicas desde que un evento ingresa con huso horario local hasta que el operador limpia su estado en RocksDB.",
    "steps": [
      {
        "id": "step-utc-extract",
        "label": "1. Extracción del timestamp de negocio y normalización a UTC (TimestampAssigner)",
        "text": "1. Extracción del timestamp de negocio y normalización a UTC (TimestampAssigner)",
        "role": "Fuente & Asignador",
        "detail": "Convierte marcas con desplazamientos heterogéneos (-06:00, +01:00, Z) al instante UTC canónico."
      },
      {
        "id": "step-watermark-emit",
        "label": "2. Generación de watermarks acotados (max(event_time) - delta) con withIdleness",
        "text": "2. Generación de watermarks acotados (max(event_time) - delta) con withIdleness",
        "role": "WatermarkGenerator",
        "detail": "Calcula el avance temporal por partición y excluye canales silenciosos para no congelar el mínimo global."
      },
      {
        "id": "step-interval-match",
        "label": "3. Emparejamiento en estado por clave dentro del rango [order_ts, order_ts + 120 s]",
        "text": "3. Emparejamiento en estado por clave dentro del rango [order_ts, order_ts + 120 s]",
        "role": "Operador IntervalJoin",
        "detail": "Cruza cada pedido con su pago (incluyendo el reintento a +110 s) manteniendo los registros en RocksDB."
      },
      {
        "id": "step-state-purge",
        "label": "4. Expiración y limpieza automática del estado en RocksDB al superar el watermark la cota",
        "text": "4. Expiración y limpieza automática del estado en RocksDB al superar el watermark la cota",
        "role": "Backend de Estado",
        "detail": "Cuando W(t) > order_ts + 120 s, el temporizador interno borra la entrada del pedido para acotar la memoria."
      }
    ],
    "correctOrder": [
      "step-utc-extract",
      "step-watermark-emit",
      "step-interval-match",
      "step-state-purge"
    ],
    "hint": "Primero se extrae y normaliza el timestamp a UTC, luego se emite el watermark, después se evalúa el emparejamiento en el Interval Join y por último se purga el estado vencido."
  },
  "roleNotes": {
    "de": "Nunca despliegues un JOIN entre dos flujos en Flink SQL sin una condición de intervalo temporal o sin configurar table.exec.state.ttl. Además, define siempre source.idle-timeout para que una partición con poco tráfico no detenga todo el grafo.",
    "da": "Antes de fijar el tamaño de ventana o la holgura de un watermark, consulta la distribución empírica de latencias (p95, p99 y tiempos de reintento) sobre los datos históricos.",
    "bi": "Ten presente el compromiso entre latencia y completitud: un panel que emite métricas a los 30 segundos omitirá el 4,17 % de los pedidos que se pagan en el segundo intento (+110 s) salvo que la vista acepte actualizaciones tardías."
  },
  "summary": [
    "El Tiempo de Evento (Event Time) normalizado en UTC garantiza resultados reproducibles ante retrasos de red o reprocesamientos históricos.",
    "Un watermark por desorden acotado vale W(t) = max(event_time) - delta y avanza en operadores paralelos según el mínimo de todas las entradas activas.",
    "Configurar withIdleness (source.idle-timeout) evita que una partición sin tráfico congele el avance global del watermark.",
    "Un Interval Join acota la ventana temporal entre dos flujos (como los 120 s entre orders y payments) y purga automáticamente el estado en RocksDB."
  ],
  "flashcards": [
    {
      "id": "fc-de4-03-event-vs-proc",
      "front": "¿Por qué Processing Time produce conteos incorrectos cuando se reprocesa un incidente de red ocurrido horas atrás?",
      "back": "Porque agrupa los eventos según el reloj actual del servidor que los lee, mezclando horas históricas distintas en la ventana del momento de ejecución."
    },
    {
      "id": "fc-de4-03-min-watermark",
      "front": "¿Cómo calcula un operador de Apache Flink su watermark cuando recibe datos de múltiples particiones o canales de entrada?",
      "back": "Toma el valor mínimo entre los watermarks de todos los canales de entrada activos: W_op = min(W_1, W_2, ..., W_k)."
    },
    {
      "id": "fc-de4-03-idleness",
      "front": "¿Qué problema resuelve el método .withIdleness() en la estrategia de watermarks de Flink?",
      "back": "Evita que una partición que deja de recibir eventos congele el mínimo global de watermarks, marcándola temporalmente como inactiva tras superar el umbral configurado."
    },
    {
      "id": "fc-de4-03-interval-vs-regular",
      "front": "¿Qué diferencia de uso de memoria en RocksDB existe entre un Regular Join y un Interval Join en Flink SQL?",
      "back": "El Regular Join retiene todos los registros de ambos flujos de forma indefinida (salvo que se configure TTL), mientras que el Interval Join purga automáticamente los registros en cuanto el watermark supera el límite superior del intervalo."
    }
  ],
  "glossaryTerms": [
    "marca-agua-acotada-flink",
    "join-intervalo-temporal",
    "captura-cambios-log-wal"
  ],
  "sources": [
    {
      "title": "Apache Flink Documentation — Generating Watermarks and Dealing with Idle Sources",
      "url": "https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/datastream/event-time/generating_watermarks/",
      "publisher": "Apache Software Foundation",
      "accessed": "2026-10-29",
      "supports": "Estrategias forBoundedOutOfOrderness, propagación del watermark mínimo y configuración de withIdleness."
    },
    {
      "title": "Apache Flink Table API & SQL — Joins in Continuous Queries",
      "url": "https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/table/sql/queries/joins/",
      "publisher": "Apache Software Foundation",
      "accessed": "2026-10-29",
      "supports": "Diferencias entre Regular Joins e Interval Joins y limpieza automática del estado acotado."
    },
    {
      "title": "Apache Flink Documentation — Working with State and State TTL",
      "url": "https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/datastream/fault-tolerance/state/",
      "publisher": "Apache Software Foundation",
      "accessed": "2026-10-29",
      "supports": "Almacenamiento de Keyed State en RocksDB y expiración de estado mediante StateTtlConfig."
    }
  ],
  "aiNotes": "Recuerda al estudiante que en la tabla payments de Mercado Brisa conviven dos fenómenos distintos: webhooks duplicados a los +19 s (misma idempotency_key) y reintentos bancarios legítimos a los +110 s (attempt_number = 2, nueva idempotency_key). Por eso la consulta debe deduplicar primero por idempotency_key y luego comparar el corte de 30 segundos frente al de 120 segundos."
};

export default lesson;
