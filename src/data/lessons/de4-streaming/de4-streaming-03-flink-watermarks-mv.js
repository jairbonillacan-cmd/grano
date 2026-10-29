// Lección migrada al esquema v2 mediante scripts/migrate-legacy.mjs
const lesson = {
  "id": "de4-streaming-03-flink-watermarks-mv",
  "moduleId": "de4-streaming",
  "tracks": [
    "de"
  ],
  "level": 4,
  "order": 3,
  "title": "Tiempo de evento y watermarks en Apache Flink",
  "minutes": 30,
  "prerequisites": [
    "de4-streaming-01-cdc-kafka-streaming"
  ],
  "contentVersion": 1,
  "hook": "En Mercado Brisa (empresa ficticia), un repartidor confirma una entrega en la app a las `11:59:42` en un túnel sin señal. A las `12:03:10` recupera cobertura y el teléfono sincroniza el evento. El tablero que agrupaba por hora de recepción (`Processing Time`) reportó una caída falsa a las 11:59. Además, un trabajo de Flink que unía pedidos y entregas sin límite temporal agotó los 64 GB de disco en cuatro días. ¿Cómo gobiernas el desorden y el estado?",
  "objectives": [
    "Distinguir entre tiempo de evento (Event Time) y tiempo de procesamiento (Processing Time) ante retrasos de red.",
    "Configurar watermarks de desorden acotado (bounded out-of-orderness), tolerancia de retraso y salidas laterales.",
    "Acotar el estado en RocksDB mediante Interval Joins o tiempo de vida (State TTL) para evitar fugas de memoria."
  ],
  "sections": [
    {
      "id": "tiempo-de-evento-frente-a-tiempo-de-procesamient",
      "heading": "Tiempo de evento frente a tiempo de procesamiento",
      "body": "En cualquier sistema distribuido existen dos relojes fundamentalmente distintos:\n- **Event Time**: el instante exacto en que ocurrió el hecho físico en el dispositivo o pasarela de origen (grabado dentro del payload JSON/Protobuf, ej. `event_ts = 11:59:42`).\n- **Processing Time**: el instante según el reloj de pared de la máquina que ejecuta el motor de streaming cuando procesa el mensaje (`proc_ts = 12:03:10`).\nAgrupar por **Processing Time** es trivial pero analíticamente falso: cualquier congestión de red, lote móvil offline o reintento de un microservicio deforma las series temporales. Agrupar por **Event Time** garantiza que los resultados sean **deterministas y reproducibles** (incluso si reprocesas un mes histórico de Kafka a 10x de velocidad, cada minuto tendrá exactamente las mismas ventas).",
      "interactive": {
        "component": "streaming-watermark-lab",
        "caption": "Simulador interactivo: Tiempo de evento y watermarks en Apache Flink"
      }
    },
    {
      "id": "funcionamiento-de-watermarks-retraso-y-salidas-l",
      "heading": "Funcionamiento de watermarks, retraso y salidas laterales",
      "body": "Si agrupas por `Event Time` en ventanas de 1 minuto (`11:59:00` a `12:00:00`) y los eventos llegan desordenados, ¿cuándo sabe **Apache Flink** o **Arroyo (motor de streaming en Rust)** que ya puede cerrar la ventana de las `11:59` y emitir el resultado?\nMediante un **Watermark (Marca de Agua)**: un reloj lógico monotónicamente creciente que fluye dentro del stream declarando `W(t) = max(event_time_observado) - tolerancia`. Si defines `WATERMARK FOR event_time AS event_time - INTERVAL '30' SECOND`, cuando llega un evento con hora `12:00:30`, el Watermark avanza a `12:00:00` y cierra la ventana `11:59–12:00`.\n¿Y si un evento llega con 4 minutos de retraso cuando la ventana ya cerró? Tienes dos mecanismos:\n1) **Allowed Lateness**: mantiene el estado de la ventana vivo un margen extra y emite una actualización de retracción/refinamiento (`upsert`).\n2) **Side Output / Dead-Letter Stream**: desvía los eventos extremadamente tardíos a una tabla de auditoría en Iceberg para reconciliación al cierre del día.",
      "example": {
        "language": "sql",
        "code": "-- EXCELENTE: Define Watermarks por Event Time y acota el JOIN a una ventana de 15 min\n-- para que Flink/Arroyo limpie automáticamente el estado de RocksDB tras vencer el intervalo.\nCREATE TABLE ad_impressions (\n  impression_id STRING,\n  campaign_id STRING,\n  imp_ts TIMESTAMP(3),\n  WATERMARK FOR imp_ts AS imp_ts - INTERVAL '30' SECOND\n) WITH ('connector' = 'kafka', 'topic' = 'ads.impressions');\n\nCREATE TABLE ad_clicks (\n  click_id STRING,\n  impression_id STRING,\n  click_ts TIMESTAMP(3),\n  WATERMARK FOR click_ts AS click_ts - INTERVAL '30' SECOND\n) WITH ('connector' = 'kafka', 'topic' = 'ads.clicks');\n\nSELECT\n  window_start,\n  window_end,\n  i.campaign_id,\n  COUNT(i.impression_id) AS impressions,\n  COUNT(c.click_id) AS attributed_clicks_15m\nFROM TABLE(\n  TUMBLE(TABLE ad_impressions, DESCRIPTOR(imp_ts), INTERVAL '5' MINUTE)\n) i\nLEFT JOIN ad_clicks c\n  ON i.impression_id = c.impression_id\n  AND c.click_ts BETWEEN i.imp_ts AND i.imp_ts + INTERVAL '15' MINUTE\nGROUP BY window_start, window_end, i.campaign_id;",
        "expectedOutput": [
          {
            "estado_rocksdb": "Estable en 1.8 GB (Purgado automático a los 15m30s)",
            "precision_temporal": "100% Determinista por Event Time",
            "latencia_emision": "Sub-segundo tras cierre de Watermark"
          }
        ]
      }
    },
    {
      "id": "ventanas-temporales-y-control-del-estado-con-ttl",
      "heading": "Ventanas temporales y control del estado con TTL en RocksDB",
      "body": "En streaming SQL operamos tres tipos principales de ventanas:\n- **Tumbling (Fijas sin solapamiento)**: ej. cada 1 minuto exacto (`12:00-12:01`, `12:01-12:02`). Cada evento pertenece a una sola ventana.\n- **Hopping / Sliding (Deslizantes con solapamiento)**: ej. ventana de 10 minutos que se actualiza cada 1 minuto (ideal para medias móviles suaves de detección de anomalías).\n- **Session (Por inactividad del usuario)**: se cierra cuando pasan *N* minutos sin eventos del mismo `user_id`.\n**Peligro crítico en producción**: Si escribes un `JOIN` normal entre dos streams (`FROM ad_impressions i JOIN ad_clicks c ON i.imp_id = c.imp_id`) sin acotar el tiempo, Flink debe guardar cada impresión en su backend de estado (**RocksDB / SlateDB**) **por completo** por si el clic llega dentro de 3 años. El estado crecerá sin límite hasta reventar el disco. **Solución obligatoria**: usa siempre **Interval Joins** (`AND c.click_ts BETWEEN i.imp_ts AND i.imp_ts + INTERVAL '30' MINUTE`) o configura `table.exec.state.ttl` para purgar automáticamente el estado antiguo."
    },
    {
      "id": "mantenimiento-incremental-de-vistas-en-materiali",
      "heading": "Mantenimiento incremental de vistas en Materialize y RisingWave",
      "body": "Tradicionalmente, para mostrar un dashboard en vivo había que escribir complejo código Java/Scala en Flink y volcar los resultados a Redis o PostgreSQL. En producción han madurado dos patrones mucho más ágiles para conectar DE, DA y BI:\n1) **Motores de Vistas Materializadas en Streaming (Materialize — basado en Timely/Differential Dataflow — y RisingWave)**: Te permiten escribir una consulta SQL estándar con joins complejos y funciones de ventana (`CREATE MATERIALIZED VIEW mv_live_funnel AS SELECT ...`). El motor mantiene el resultado incrementalmente en memoria a medida que llegan cambios por CDC desde Kafka, actualizando el dashboard en `<50 ms`.\n2) **OLAP en Tiempo Real (ClickHouse / Apache Pinot) + Rill**: Ingesta directa desde Kafka hacia tablas columnares ultra-rápidas para exploración interactiva sub-segundo."
    }
  ],
  "workedExample": {
    "title": "Ejemplo guiado: Tiempo de evento y watermarks en Apache Flink",
    "description": "Compara un Join y agrupación en streaming mal diseñados (reloj de servidor + estado infinito que explota la RAM/Disco) frente a Flink SQL con Event Time, Watermark e Interval Join acotado:",
    "audit": "",
    "steps": [
      {
        "label": "Antipatrón: tiempo de procesamiento y join sin límite temporal",
        "explanation": "Compara un Join y agrupación en streaming mal diseñados (reloj de servidor + estado infinito que explota la RAM/Disco) frente a Flink SQL con Event Time, Watermark e Interval Join acotado:",
        "code": "-- PELIGRO EN PRODUCCIÓN:\n-- 1) Usa PROCTIME() (distorsiona métricas cuando la red móvil se retrasa)\n-- 2) Hace un JOIN abierto entre impresiones y clics sin rango de tiempo:\n--    Flink guardará cada impresión en RocksDB por completo hasta agotar el disco (OOM).\nSELECT\n  TUMBLE_START(i.proc_time, INTERVAL '5' MINUTE) AS window_start,\n  i.campaign_id,\n  COUNT(DISTINCT i.impression_id) AS impressions,\n  COUNT(DISTINCT c.click_id) AS clicks\nFROM ad_impressions i\nLEFT JOIN ad_clicks c ON i.impression_id = c.impression_id\nGROUP BY TUMBLE(i.proc_time, INTERVAL '5' MINUTE), i.campaign_id;",
        "expectedOutput": [
          {
            "estado_rocksdb": "Crece +40 GB/día sin límite → Crash en día 4",
            "precision_temporal": "Sesgada por retrasos de red móvil",
            "alerta_pagerduty": "Falsos positivos en cada micro-corte"
          }
        ]
      },
      {
        "label": "Solución óptima: tiempo de evento, watermark y join acotado",
        "explanation": "Compara ahora la consulta corregida y verifica cómo las filas y totales coinciden con la auditoría.",
        "code": "-- EXCELENTE: Define Watermarks por Event Time y acota el JOIN a una ventana de 15 min\n-- para que Flink/Arroyo limpie automáticamente el estado de RocksDB tras vencer el intervalo.\nCREATE TABLE ad_impressions (\n  impression_id STRING,\n  campaign_id STRING,\n  imp_ts TIMESTAMP(3),\n  WATERMARK FOR imp_ts AS imp_ts - INTERVAL '30' SECOND\n) WITH ('connector' = 'kafka', 'topic' = 'ads.impressions');\n\nCREATE TABLE ad_clicks (\n  click_id STRING,\n  impression_id STRING,\n  click_ts TIMESTAMP(3),\n  WATERMARK FOR click_ts AS click_ts - INTERVAL '30' SECOND\n) WITH ('connector' = 'kafka', 'topic' = 'ads.clicks');\n\nSELECT\n  window_start,\n  window_end,\n  i.campaign_id,\n  COUNT(i.impression_id) AS impressions,\n  COUNT(c.click_id) AS attributed_clicks_15m\nFROM TABLE(\n  TUMBLE(TABLE ad_impressions, DESCRIPTOR(imp_ts), INTERVAL '5' MINUTE)\n) i\nLEFT JOIN ad_clicks c\n  ON i.impression_id = c.impression_id\n  AND c.click_ts BETWEEN i.imp_ts AND i.imp_ts + INTERVAL '15' MINUTE\nGROUP BY window_start, window_end, i.campaign_id;",
        "expectedOutput": [
          {
            "estado_rocksdb": "Estable en 1.8 GB (Purgado automático a los 15m30s)",
            "precision_temporal": "100% Determinista por Event Time",
            "latencia_emision": "Sub-segundo tras cierre de Watermark"
          }
        ]
      }
    ]
  },
  "checks": [
    {
      "id": "c1",
      "type": "mcq",
      "prompt": "Tu trabajo de Apache Flink lee un tópico de Kafka con 16 particiones (una por país) usando tiempo de evento y watermarks. A las 03:00, la partición 14 no registra compras durante 20 minutos y Flink deja de emitir ventanas para los otros 15 países activos. ¿Por qué ocurre y cómo se corrige?",
      "options": [
        {
          "id": "a",
          "text": "En Flink, el Watermark de un operador downstream avanza al MÍNIMO de los Watermarks de todas sus particiones de entrada (`min(W_0, ..., W_15)`). Si la partición #14 está inactiva, su Watermark se queda congelado en el pasado y frena a todo el trabajo; se soluciona activando `withIdleness()` / `table.exec.source.idle-timeout` para excluir temporalmente particiones silenciosas.",
          "correct": true,
          "feedback": "Brillante. El progreso del Watermark sigue al canal más lento para garantizar completitud. Marcar una fuente como `Idle` tras unos segundos sin tráfico permite que las otras 15 particiones sigan cerrando ventanas con normalidad."
        },
        {
          "id": "b",
          "text": "Flink avanza el Watermark usando el MÁXIMO de las particiones, por lo que una partición vacía acelera el reloj al infinito.",
          "correct": false,
          "feedback": "Es al revés: Flink toma el mínimo de los canales de entrada para no cerrar ventanas antes de que una partición rezagada termine de entregar sus datos."
        },
        {
          "id": "c",
          "text": "Es un límite físico de Kafka: si una partición no recibe mensajes, los brokers borran las otras 15 particiones.",
          "correct": false,
          "feedback": "Kafka mantiene cada partición de forma independiente; el bloqueo ocurre en el reloj lógico de Watermarks del motor de procesamiento si no se configura detección de inactividad."
        }
      ],
      "explanation": "Brillante. El progreso del Watermark sigue al canal más lento para garantizar completitud. Marcar una fuente como `Idle` tras unos segundos sin tráfico permite que las otras 15 particiones sigan cerrando ventanas con normalidad."
    },
    {
      "id": "c2",
      "type": "mcq",
      "prompt": "Configuras un watermark con retraso máximo de 2 minutos (`maxOutOfOrderness = 2 min`). Si el evento más reciente observado en la partición tiene timestamp `14:10:00`, ¿qué valor tiene el watermark emitido y qué ventanas horarias pueden cerrarse?",
      "options": [
        {
          "id": "a",
          "text": "El watermark vale 14:08:00; puede cerrarse cualquier ventana cuyo fin sea menor o igual a 14:08:00 (por ejemplo, la de 13:00 a 14:00).",
          "correct": true,
          "feedback": "Correcto: W(t) = max(event_time) - 2 minutos = 14:08:00, lo que garantiza el cierre de toda ventana anterior a esa marca."
        },
        {
          "id": "b",
          "text": "El watermark vale 14:12:00 (suma 2 minutos al reloj).",
          "correct": false,
          "feedback": "Incorrecto: el watermark retrocede respecto al máximo observado para dar margen a los eventos rezagados."
        },
        {
          "id": "c",
          "text": "El watermark toma la hora del reloj de la máquina del servidor.",
          "correct": false,
          "feedback": "Incorrecto: en modo Event Time el watermark depende de los timestamps contenidos en los datos, no del reloj del sistema."
        }
      ],
      "explanation": "Restar un margen de tolerancia al timestamp máximo observado ofrece una espera controlada para absorber el desorden de red antes de emitir el cierre de la ventana."
    },
    {
      "id": "c3",
      "type": "mcq",
      "prompt": "En Flink SQL necesitas unir cada pedido con su pago correspondiente sabiendo que el pago ocurre como máximo hasta 30 minutos después del pedido. ¿Qué construcción evita que el estado crezca sin límite?",
      "options": [
        {
          "id": "a",
          "text": "Un Interval Join añadiendo en el ON: p.pay_ts BETWEEN o.order_ts AND o.order_ts + INTERVAL '30' MINUTE.",
          "correct": true,
          "feedback": "Correcto: con cotas inferior y superior de tiempo de evento, Flink purga automáticamente de RocksDB los pedidos cuando el watermark supera los 30 minutos."
        },
        {
          "id": "b",
          "text": "Un JOIN sin condición temporal y reiniciar el clúster cada sábado.",
          "correct": false,
          "feedback": "Incorrecto: reiniciar borrando estado pierde los cruces en vuelo y no resuelve el crecimiento ilimitado."
        },
        {
          "id": "c",
          "text": "Desactivar los checkpoints de tolerancia a fallos.",
          "correct": false,
          "feedback": "Incorrecto: el estado local sigue creciendo en memoria y disco aunque no se copien snapshots a almacenamiento remoto."
        }
      ],
      "explanation": "Los Interval Joins permiten a Flink calcular exactamente hasta qué marca de watermark debe retener cada fila en RocksDB antes de descartarla con seguridad."
    }
  ],
  "practice": {
    "type": "fill-blanks",
    "title": "Ventanas por tiempo de evento en Flink",
    "language": "sql",
    "prompt": "Completa la definición en Flink SQL para procesar órdenes (`orders_stream`) y pagos (`payments_stream`) en tiempo real: 1) Declara un Watermark con tolerancia de 20 segundos de retraso sobre `order_ts`; 2) Aplica una ventana fija (`TUMBLE`) de 1 minuto sobre `order_ts`; 3) Acota el `LEFT JOIN` para que el pago ocurra entre `order_ts` y `order_ts + INTERVAL '10' MINUTE`, evitando que el estado crezca infinitamente.",
    "starterCode": "CREATE TABLE orders_stream (\n  order_id STRING,\n  region STRING,\n  order_ts TIMESTAMP(3),\n  {{b1}} FOR order_ts AS order_ts - INTERVAL '20' SECOND\n) WITH ('connector' = 'kafka', 'topic' = 'commerce.orders');\n\nSELECT\n  window_start,\n  window_end,\n  o.region,\n  COUNT(o.order_id) AS total_orders,\n  COUNT(p.payment_id) AS paid_within_10m\nFROM TABLE(\n  {{b2}}(TABLE orders_stream, DESCRIPTOR(order_ts), INTERVAL '1' MINUTE)\n) o\nLEFT JOIN payments_stream p\n  ON o.order_id = p.order_id\n  AND p.pay_ts {{b3}} o.order_ts AND o.order_ts + INTERVAL '10' MINUTE\nGROUP BY window_start, window_end, o.region;",
    "expected": "CREATE TABLE orders_stream (\n  order_id STRING,\n  region STRING,\n  order_ts TIMESTAMP(3),\n  {{b1}} FOR order_ts AS order_ts - INTERVAL '20' SECOND\n) WITH ('connector' = 'kafka', 'topic' = 'commerce.orders');\n\nSELECT\n  window_start,\n  window_end,\n  o.region,\n  COUNT(o.order_id) AS total_orders,\n  COUNT(p.payment_id) AS paid_within_10m\nFROM TABLE(\n  {{b2}}(TABLE orders_stream, DESCRIPTOR(order_ts), INTERVAL '1' MINUTE)\n) o\nLEFT JOIN payments_stream p\n  ON o.order_id = p.order_id\n  AND p.pay_ts {{b3}} o.order_ts AND o.order_ts + INTERVAL '10' MINUTE\nGROUP BY window_start, window_end, o.region;",
    "orderMatters": true,
    "hints": [
      "Palabra clave para definir la marca de agua: En Flink SQL la cláusula en el DDL que define la tolerancia al desorden es `WATERMARK FOR col AS ...`.",
      "Función de ventana fija sin solapamiento: Usa la Table-Valued Function (TVF) `TUMBLE` para dividir el tiempo en cubetas fijas de 1 minuto.",
      "Operador de rango temporal acotado: Usa `BETWEEN` para transformar un Join infinito en un Interval Join con limpieza automática de estado."
    ],
    "solution": "CREATE TABLE orders_stream (\n  order_id STRING,\n  region STRING,\n  order_ts TIMESTAMP(3),\n  {{b1}} FOR order_ts AS order_ts - INTERVAL '20' SECOND\n) WITH ('connector' = 'kafka', 'topic' = 'commerce.orders');\n\nSELECT\n  window_start,\n  window_end,\n  o.region,\n  COUNT(o.order_id) AS total_orders,\n  COUNT(p.payment_id) AS paid_within_10m\nFROM TABLE(\n  {{b2}}(TABLE orders_stream, DESCRIPTOR(order_ts), INTERVAL '1' MINUTE)\n) o\nLEFT JOIN payments_stream p\n  ON o.order_id = p.order_id\n  AND p.pay_ts {{b3}} o.order_ts AND o.order_ts + INTERVAL '10' MINUTE\nGROUP BY window_start, window_end, o.region;",
    "solutionExplanation": "Declara explícitamente la estrategia `WATERMARK FOR ...` basada en la marca de tiempo real del suceso (`Event Time`). Utiliza sintaxis moderna de Table-Valued Functions (`TABLE(TUMBLE(...))`) para agrupaciones de ventana. Acota los Joins entre flujos con predicados `BETWEEN` para permitir el descarte automático de estado antiguo en RocksDB.",
    "blanks": [
      {
        "id": "b1",
        "placeholder": "Palabra clave para definir la marca de agua",
        "acceptedAnswers": [
          "WATERMARK",
          "watermark"
        ],
        "hint": "En Flink SQL la cláusula en el DDL que define la tolerancia al desorden es `WATERMARK FOR col AS ...`."
      },
      {
        "id": "b2",
        "placeholder": "Función de ventana fija sin solapamiento",
        "acceptedAnswers": [
          "TUMBLE",
          "tumble"
        ],
        "hint": "Usa la Table-Valued Function (TVF) `TUMBLE` para dividir el tiempo en cubetas fijas de 1 minuto."
      },
      {
        "id": "b3",
        "placeholder": "Operador de rango temporal acotado",
        "acceptedAnswers": [
          "BETWEEN",
          "between"
        ],
        "hint": "Usa `BETWEEN` para transformar un Join infinito en un Interval Join con limpieza automática de estado."
      }
    ],
    "expectedOutputTable": [
      {
        "window_start": "2026-10-28 12:00:00",
        "window_end": "2026-10-28 12:01:00",
        "region": "LATAM",
        "total_orders": 412,
        "paid_within_10m": 398
      },
      {
        "window_start": "2026-10-28 12:00:00",
        "window_end": "2026-10-28 12:01:00",
        "region": "EMEA",
        "total_orders": 285,
        "paid_within_10m": 279
      }
    ],
    "rubricCriteria": [
      "Declara explícitamente la estrategia `WATERMARK FOR ...` basada en la marca de tiempo real del suceso (`Event Time`).",
      "Utiliza sintaxis moderna de Table-Valued Functions (`TABLE(TUMBLE(...))`) para agrupaciones de ventana.",
      "Acota los Joins entre flujos con predicados `BETWEEN` para permitir el descarte automático de estado antiguo en RocksDB."
    ]
  },
  "roleNotes": {
    "de": "Enfoca los pipelines de Flink/Arroyo en garantías `Exactly-Once` extremo a extremo mediante Checkpoints asíncronos (Chandy-Lamport) y estado desagregado en S3. Prohíbe en revisión de código cualquier `Regular Join` o agregación sin ventana en streaming a menos que tenga un `Interval Join` explícito o un `State TTL` configurado. Configura `table.exec.source.idle-timeout` para que una partición de Kafka silenciosa no congele el avance global del Watermark de todo el trabajo.",
    "da": "Estudia empíricamente el histograma de `ingested_at - event_time` (distribución de retraso por país y versión de app) para elegir el percentil p99.5 como umbral óptimo del Watermark. Diseña ventanas de sesión (`SESSION`) para modelar el comportamiento real de navegación del usuario sin depender de cortes arbitrarios a medianoche. Reconcilia diariamente las métricas emitidas en baja latencia contra el cierre completo en Apache Iceberg para medir el % de eventos ultra-tardíos.",
    "bi": "Consume vistas materializadas incrementales desde **Materialize** o **ClickHouse** usando el protocolo estándar de PostgreSQL sin lanzar consultas pesadas que recalculen desde cero. Distingue visualmente en las gráficas de líneas los minutos ya **cerrados por el Watermark** (línea sólida) del minuto **en curso aún abierto** (línea punteada), evitando que el usuario piense que el último minuto se desplomó."
  },
  "summary": [
    "El tiempo de evento mide cuándo ocurrió el hecho; el tiempo de procesamiento mide cuándo llegó al servidor.",
    "Un watermark W(t) declara que el motor asume haber recibido los eventos con marca menor o igual a t.",
    "Una partición inactiva detiene el avance del watermark global si no se configura detección de inactividad.",
    "Todo JOIN o agregación en streaming sin cota temporal acumula estado indefinidamente hasta agotar el disco."
  ],
  "flashcards": [
    {
      "id": "fc-de4-flk-01",
      "front": "¿Cómo calcula Flink el watermark de un operador que consume de 16 particiones de Kafka en paralelo?",
      "back": "Toma el MÍNIMO de los watermarks de las 16 particiones de entrada, porque el reloj global solo puede avanzar al ritmo de la fuente más atrasada."
    },
    {
      "id": "fc-de4-flk-02",
      "front": "¿Por qué un `LEFT JOIN` estándar sin ventana temporal en Flink termina agotando el disco de estado (RocksDB)?",
      "back": "Porque para saber si algún día futuro llegará una pareja para una fila izquierda, Flink tendría que conservar todas las filas en estado para siempre."
    },
    {
      "id": "fc-de4-flk-03",
      "front": "¿Qué ocurre con un evento cuyo timestamp es anterior al watermark actual cuando ya expiró también el `allowedLateness`?",
      "back": "No se descarta en silencio si configuras un Side Output (salida lateral): se envía a un flujo separado para conciliación o alerta."
    }
  ],
  "glossaryTerms": [
    "c27-cdc-flink-watermarks",
    "c26-bi-as-code"
  ],
  "sources": [
    {
      "title": "Apache Flink Official Documentation — Event Time and Generating Watermarks",
      "url": "https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/time/",
      "publisher": "Apache Software Foundation",
      "accessed": "2026-10-29",
      "supports": "Semántica de Event Time, propagación de watermarks entre particiones y manejo de fuentes inactivas."
    },
    {
      "title": "Apache Flink Documentation — Streaming SQL Joins and Interval Joins",
      "url": "https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/table/sql/queries/joins/",
      "publisher": "Apache Software Foundation",
      "accessed": "2026-10-29",
      "supports": "Control del tamaño del estado en cruces de flujos mediante Interval Joins y State TTL."
    },
    {
      "title": "Akidau et al. (VLDB 2015) — The Dataflow Model: A Practical Approach to Balancing Correctness, Latency, and Cost",
      "url": "https://research.google/pubs/the-dataflow-model-a-practical-approach-to-balancing-correctness-latency-and-cost-in-massive-scale-unbounded-out-of-order-data-processing/",
      "publisher": "Google Research / VLDB",
      "accessed": "2026-10-29",
      "supports": "Modelo formal de ventanas, watermarks, disparadores y acumulación sobre datos no acotados."
    }
  ],
  "aiNotes": "El concepto que más cuesta visualizar es por qué una sola partición silenciosa congela todo el trabajo de Flink (regla del mínimo watermark). Usa el ejemplo de 16 filas de espera donde el reloj común marca la hora del más atrasado.",
  "needsReview": true,
  "legacyId": "l17-flink-watermarks-mv",
  "legacyOrder": 17,
  "stageId": "stage-6",
  "subtitle": "Manejo de eventos desordenados, ventanas temporales con estado acotado y vistas materializadas.",
  "goal": "Aplicar semántica de Event Time y Watermarks en Apache Flink / Arroyo, dimensionar ventanas temporales y Joins de intervalo con State TTL acotado, y servir vistas materializadas en streaming (Materialize / RisingWave / ClickHouse) hacia tableros BI operativos.",
  "pipelineChallenge": {
    "title": "Flujo de baja latencia con watermarks",
    "scenario": "Secuencia los 5 pasos para construir un sistema de detección y monitoreo operativo en vivo que tolere retrasos de conectividad móvil sin generar alertas falsas ni agotar la memoria del clúster.",
    "steps": [
      {
        "id": "flk-1",
        "label": "1. Análisis estadístico de la distribución de retraso (lateness p99)",
        "role": "DA",
        "detail": "DA mide la diferencia `ingested_at - event_time` en datos históricos y determina que el 99.4% de los eventos llegan en menos de 25 segundos."
      },
      {
        "id": "flk-2",
        "label": "2. Asignación de tiempo de evento, watermark e idle-timeout en Flink",
        "role": "DE",
        "detail": "DE configura el Watermark basado en el análisis de DA y activa `source.idle-timeout` para que particiones con poco tráfico no detengan el reloj."
      },
      {
        "id": "flk-3",
        "label": "3. Ejecución de ventanas y joins acotados con estado en RocksDB",
        "role": "DE",
        "detail": "El motor agrega los flujos garantizando semántica Exactly-Once y expira automáticamente el estado una vez superado el Watermark."
      },
      {
        "id": "flk-4",
        "label": "4. Doble salida hacia vista materializada caliente y archivo en Iceberg v3",
        "role": "DE",
        "detail": "Las métricas de segundos alimentan la capa de baja latencia mientras el flujo completo y los eventos tardíos se archivan en Apache Iceberg."
      },
      {
        "id": "flk-5",
        "label": "5. Visualización operativa diferenciando ventanas cerradas frente a ventanas en curso",
        "role": "BI",
        "detail": "BI grafica en línea sólida hasta el último Watermark confirmado y en línea punteada el minuto abierto para evitar falsas alarmas de caída."
      }
    ],
    "explanation": "Un pipeline de streaming exitoso comienza con DA calibrando matemáticamente el retraso real de red, continúa con DE acotando el estado y los Watermarks en Flink/Arroyo, y culmina con BI presentando con honestidad visual qué ventanas ya están cerradas."
  },
  "relatedLessons": [
    {
      "id": "l16-cdc-kafka-streaming",
      "reason": "Revisa cómo Debezium y Kafka/WarpStream alimentan de eventos con baja latencia a Flink y Materialize."
    },
    {
      "id": "l2-window-functions",
      "reason": "Compara las Window Functions analíticas sobre tablas estáticas con las ventanas Tumbling y Hopping sobre flujos infinitos."
    }
  ]
};

export default lesson;
