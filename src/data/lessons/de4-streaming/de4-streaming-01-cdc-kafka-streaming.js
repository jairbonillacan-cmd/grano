// Lección migrada al esquema v2 mediante scripts/migrate-legacy.mjs
const lesson = {
  "id": "de4-streaming-01-cdc-kafka-streaming",
  "moduleId": "de4-streaming",
  "tracks": [
    "de"
  ],
  "level": 4,
  "order": 1,
  "title": "Captura de cambios (CDC) con Debezium y Kafka",
  "minutes": 30,
  "prerequisites": [
    "de3-lakehouse-01-iceberg-v3-medallion"
  ],
  "contentVersion": 1,
  "hook": "En Mercado Brisa (empresa ficticia), un script extraía pedidos ejecutando `SELECT * FROM orders WHERE updated_at >= NOW() - INTERVAL '1 minute'` cada 30 segundos contra la base PostgreSQL primaria. Durante un día de ofertas, esa consulta saturó el disco de producción y además 1 400 pedidos fraudulentos eliminados con `DELETE` físico nunca desaparecieron del almacén analítico, inflando las ventas en 210 000 USD. ¿Cómo capturas inserciones, actualizaciones y borrados sin consultar las tablas de producción?",
  "objectives": [
    "Reemplazar la extracción por consulta (query-based polling) por captura de cambios basada en el log transaccional (WAL) con Debezium.",
    "Interpretar la estructura de un evento CDC (`op: c, u, d, r`, estados `before` y `after`) para propagar borrados físicos.",
    "Evitar el problema de escrituras dobles (dual writes) aplicando el patrón Transactional Outbox."
  ],
  "sections": [
    {
      "id": "criterios-tecnicos-y-de-costo-entre-streaming-y-",
      "heading": "Criterios técnicos y de costo entre streaming y micro-lotes",
      "body": "El error arquitectónico más caro en ingeniería de datos es construir un pipeline de streaming con estado complejo para alimentar un dashboard que el comité ejecutivo solo mira los lunes a las 9:00 AM.\nEn producción aplicamos la **Regla del Accionador (Human-in-the-loop vs. Machine-in-the-loop)**:\n- **Latencia > 5 minutos (Humano decide)**: Usa ingesta incremental o micro-batch cada 5–15 minutos hacia **Apache Iceberg v3** con **DuckDB / SQLMesh / dbt**. Es 5 veces más barato, fácil de reprocesar (backfill) y suficiente para el 85% del BI corporativo.\n- **Latencia < 5 segundos (Máquina u Operación Crítica decide)**: Usa **Streaming Real-Time (CDC + Kafka/WarpStream + Flink/Arroyo)** cuando una acción automatizada depende del evento: bloqueo de tarjeta por fraude en 150 ms, precios dinámicos (surge pricing), alerta operativa de caída de pasarela de pago o inventario en vivo.",
      "interactive": {
        "component": "streaming-watermark-lab",
        "caption": "Simulador interactivo: Captura de cambios (CDC) con Debezium y Kafka"
      }
    },
    {
      "id": "extraccion-por-consulta-frente-a-captura-del-log",
      "heading": "Extracción por consulta frente a captura del log con Debezium",
      "body": "Consultar una base de datos OLTP periódicamente con `WHERE updated_at > ...` (*Query-Based Polling*) sufre cuatro defectos fatales en producción:\n1) Sobrecarga el CPU y los índices de la base transaccional que atiende a tus clientes.\n2) Es completamente ciego a los `DELETE` físicos (la fila ya no existe para el `SELECT`).\n3) Pierde estados intermedios: si un pedido pasa de `PENDING → AUTHORIZED → SHIPPED` en 10 segundos y consultas cada 5 minutos, solo ves `SHIPPED`, destruyendo el análisis de tiempos de embudo para DA.\n4) Depende de que ningún desarrollador olvide actualizar el campo `updated_at`.\n**Log-Based CDC (Debezium)** conecta un lector de replicación al registro binario interno de la base de datos (**Write-Ahead Log — WAL** en PostgreSQL o **Binlog** en MySQL). Cada `INSERT` (`op: \"c\"`), `UPDATE` (`op: \"u\"`) y `DELETE` (`op: \"d\"`) ya fue escrito secuencialmente en el WAL por el motor para su propia durabilidad ACID; Debezium simplemente lee ese flujo secuencial con impacto cercano a cero y publica el estado anterior (`before`) y posterior (`after`) en milisegundos.",
      "example": {
        "language": "sql",
        "code": "-- EXCELENTE: Consumir el log CDC de Debezium (op: 'c'=create, 'u'=update, 'd'=delete)\n-- y aplicar MERGE idempotente en Apache Iceberg v3 usando el LSN (Log Sequence Number)\nWITH latest_cdc_per_key AS (\n  SELECT\n    COALESCE(after.order_id, before.order_id) AS order_id,\n    after.customer_id,\n    after.order_status,\n    after.amount_usd,\n    op AS cdc_operation,\n    source.lsn AS wal_lsn\n  FROM bronze.debezium_orders_cdc\n  WHERE ingested_date = CURRENT_DATE\n  QUALIFY ROW_NUMBER() OVER (\n    PARTITION BY COALESCE(after.order_id, before.order_id)\n    ORDER BY source.lsn DESC\n  ) = 1\n)\nMERGE INTO silver.orders_current t\nUSING latest_cdc_per_key s ON t.order_id = s.order_id\nWHEN MATCHED AND s.cdc_operation = 'd' THEN DELETE\nWHEN MATCHED THEN UPDATE SET\n  order_status = s.order_status, amount_usd = s.amount_usd, last_wal_lsn = s.wal_lsn\nWHEN NOT MATCHED AND s.cdc_operation <> 'd' THEN INSERT\n  (order_id, customer_id, order_status, amount_usd, last_wal_lsn)\n  VALUES (s.order_id, s.customer_id, s.order_status, s.amount_usd, s.wal_lsn);",
        "expectedOutput": [
          {
            "impacto_oltp": "<1% CPU (Lectura secuencial WAL)",
            "ordenes_borradas": "Eliminadas al instante vía Deletion Vector",
            "exactitud_financiera": "100% Reconciliada con base primaria"
          }
        ]
      }
    },
    {
      "id": "patron-transactional-outbox-contra-escrituras-do",
      "heading": "Patrón transactional outbox contra escrituras dobles",
      "body": "Cuando un microservicio guarda un pedido en PostgreSQL y en la línea siguiente de código intenta publicar un evento en Kafka (`producer.send()`), existe una condición de carrera letal conocida como **Dual-Write**: si la base de datos hace `COMMIT` pero la red hacia Kafka parpadea un milisegundo después, el pedido existe en la base pero el evento jamás llega a analítica ni a los sistemas downstream.\nEl **Patrón Transactional Outbox** resuelve esto con elegancia: el microservicio inserta el pedido en `orders` y el evento de dominio estructurado en una tabla `outbox_events` **dentro de la misma transacción ACID local de Postgres**. Luego, **Debezium** lee el WAL de `outbox_events` y lo entrega a Kafka con garantía *At-Least-Once*, respetando el Contrato de Datos (ODCS) sin acoplar el CDC a las tablas internas privadas del microservicio."
    },
    {
      "id": "almacenamiento-por-niveles-en-kafka-sobre-almace",
      "heading": "Almacenamiento por niveles en Kafka sobre almacenamiento S3",
      "body": "Hasta 2023, operar Apache Kafka en la nube era ruinoso por dos motivos: los brokers acoplaban cómputo con discos SSD locales caros (replicados 3x) y las transferencias entre zonas de disponibilidad (Cross-AZ networking) representaban hasta el 65% de la factura.\nEn producción dominan dos evoluciones:\n1) **Kafka Tiered Storage (KIP-405)** y **Redpanda**: mantienen solo las últimas horas en NVMe local y descargan automáticamente los segmentos históricos a almacenamiento de objetos barato (S3/GCS).\n2) **Arquitecturas Zero-Disk / BYOC como WarpStream**: eliminan por completo los discos locales en los brokers y escriben directamente sobre S3 con agentes sin estado (*stateless*) alineados por zona de disponibilidad, eliminando el 100% del costo de red Cross-AZ y permitiendo retención infinita a precio de S3 (~$0.023/GB-mes). Además, **Tableflow** materializa automáticamente cualquier tópico Kafka como tabla **Apache Iceberg v3** lista para consultar."
    }
  ],
  "workedExample": {
    "title": "Ejemplo guiado: Captura de cambios (CDC) con Debezium y Kafka",
    "description": "Compara el antipatrón de hacer polling SQL por `updated_at` contra el procesamiento idempotente de un flujo CDC de Debezium (con soporte de `INSERT`, `UPDATE` y `DELETE`):",
    "audit": "",
    "steps": [
      {
        "label": "Antipatrón: consulta periódica por updated_at ciega a borrados",
        "explanation": "Compara el antipatrón de hacer polling SQL por `updated_at` contra el procesamiento idempotente de un flujo CDC de Debezium (con soporte de `INSERT`, `UPDATE` y `DELETE`):",
        "code": "-- MAL: Consulta repetitiva cada 30s sobre la base OLTP de producción.\n-- 1) No detecta filas borradas con DELETE FROM orders WHERE order_id = 'ORD-88'\n-- 2) Pierde todas las transiciones intermedias de estado\nSELECT\n  order_id,\n  customer_id,\n  order_status,\n  amount_usd,\n  updated_at\nFROM prod_oltp.public.orders\nWHERE updated_at >= NOW() - INTERVAL '30 seconds';",
        "expectedOutput": [
          {
            "impacto_oltp": "CPU Postgres al 92% en hora pico",
            "ordenes_borradas": "Ignoradas ($210K fantasma en BI)",
            "estados_intermedios": "Perdidos (Solo ve el último estado)"
          }
        ]
      },
      {
        "label": "Solución óptima: flujo CDC de Debezium hacia Iceberg v3",
        "explanation": "Compara ahora la consulta corregida y verifica cómo las filas y totales coinciden con la auditoría.",
        "code": "-- EXCELENTE: Consumir el log CDC de Debezium (op: 'c'=create, 'u'=update, 'd'=delete)\n-- y aplicar MERGE idempotente en Apache Iceberg v3 usando el LSN (Log Sequence Number)\nWITH latest_cdc_per_key AS (\n  SELECT\n    COALESCE(after.order_id, before.order_id) AS order_id,\n    after.customer_id,\n    after.order_status,\n    after.amount_usd,\n    op AS cdc_operation,\n    source.lsn AS wal_lsn\n  FROM bronze.debezium_orders_cdc\n  WHERE ingested_date = CURRENT_DATE\n  QUALIFY ROW_NUMBER() OVER (\n    PARTITION BY COALESCE(after.order_id, before.order_id)\n    ORDER BY source.lsn DESC\n  ) = 1\n)\nMERGE INTO silver.orders_current t\nUSING latest_cdc_per_key s ON t.order_id = s.order_id\nWHEN MATCHED AND s.cdc_operation = 'd' THEN DELETE\nWHEN MATCHED THEN UPDATE SET\n  order_status = s.order_status, amount_usd = s.amount_usd, last_wal_lsn = s.wal_lsn\nWHEN NOT MATCHED AND s.cdc_operation <> 'd' THEN INSERT\n  (order_id, customer_id, order_status, amount_usd, last_wal_lsn)\n  VALUES (s.order_id, s.customer_id, s.order_status, s.amount_usd, s.wal_lsn);",
        "expectedOutput": [
          {
            "impacto_oltp": "<1% CPU (Lectura secuencial WAL)",
            "ordenes_borradas": "Eliminadas al instante vía Deletion Vector",
            "exactitud_financiera": "100% Reconciliada con base primaria"
          }
        ]
      }
    ]
  },
  "checks": [
    {
      "id": "c1",
      "type": "mcq",
      "prompt": "Un equipo de ingeniería de datos usa Debezium sobre PostgreSQL en producción, pero un viernes detienen el consumidor de Kafka durante 48 horas por mantenimiento sin borrar ni monitorear el Replication Slot de Postgres. ¿Cuál es el riesgo crítico en producción y cómo se previene?",
      "options": [
        {
          "id": "a",
          "text": "PostgreSQL retendrá todos los archivos WAL en disco esperando a que el slot de replicación de Debezium los confirme, llenando el disco del servidor primario hasta causar una caída total de la base de datos; se previene configurando alertas de `replication_slot_lag` y el parámetro `max_slot_wal_keep_size`.",
          "correct": true,
          "feedback": "Exacto. Este es el incidente #1 de producción con CDC en PostgreSQL: un slot de replicación inactivo impide que Postgres recicle los segmentos WAL. Configurar `max_slot_wal_keep_size` y alertas de lag protege la disponibilidad del sistema OLTP."
        },
        {
          "id": "b",
          "text": "No ocurre absolutamente nada; PostgreSQL guarda los archivos WAL en la memoria RAM del navegador del analista de BI.",
          "correct": false,
          "feedback": "Los segmentos WAL se almacenan en el disco del servidor primario de PostgreSQL hasta que todos los slots de replicación activos los consumen."
        },
        {
          "id": "c",
          "text": "Debezium borrará automáticamente todas las tablas de clientes en PostgreSQL si pasa más de 1 hora desconectado.",
          "correct": false,
          "feedback": "Debezium solo tiene permisos de lectura de replicación; nunca borra tablas en el origen, pero su slot inactivo sí bloquea la limpieza del WAL si no se limita."
        }
      ],
      "explanation": "Exacto. Este es el incidente #1 de producción con CDC en PostgreSQL: un slot de replicación inactivo impide que Postgres recicle los segmentos WAL. Configurar `max_slot_wal_keep_size` y alertas de lag protege la disponibilidad del sistema OLTP."
    },
    {
      "id": "c2",
      "type": "mcq",
      "prompt": "Un microservicio de pagos ejecuta `db.save(payment)` y en la línea siguiente `kafka.send(event)`. Si la base de datos confirma el commit pero el proceso muere por un corte de red un milisegundo antes de `kafka.send()`, ¿qué ocurre?",
      "options": [
        {
          "id": "a",
          "text": "El pago queda cobrado en la base de datos pero el evento jamás llega a Kafka, dejando inconsistentes a todos los sistemas aguas abajo.",
          "correct": true,
          "feedback": "Correcto: dos sistemas externos no comparten una transacción atómica sin un patrón como Transactional Outbox."
        },
        {
          "id": "b",
          "text": "PostgreSQL hace rollback automático cuando nota que Kafka no recibió el mensaje.",
          "correct": false,
          "feedback": "Incorrecto: una vez ejecutado el COMMIT en PostgreSQL, la base de datos desconoce qué haga la aplicación con la red."
        },
        {
          "id": "c",
          "text": "Kafka adivina el pago leyendo la memoria del contenedor caído.",
          "correct": false,
          "feedback": "Incorrecto: Kafka solo almacena los mensajes que el productor logró enviar y confirmar por red."
        }
      ],
      "explanation": "El problema de la escritura doble se elimina insertando el registro de negocio y el mensaje en una tabla `outbox` dentro del mismo `BEGIN ... COMMIT` y dejando que Debezium lea el WAL."
    },
    {
      "id": "c3",
      "type": "mcq",
      "prompt": "Al aplicar un flujo CDC sobre una tabla destino en el almacén mediante `MERGE INTO`, ¿qué acción debe disparar un registro cuyo campo `op` es `\"d\"`?",
      "options": [
        {
          "id": "a",
          "text": "Eliminar la fila en el destino (WHEN MATCHED AND src.op = 'd' THEN DELETE) o marcarla como borrada usando la clave de `before`.",
          "correct": true,
          "feedback": "Correcto: en un evento de borrado, `after` es nulo y la clave primaria que debe eliminarse viaja en el objeto `before` o en la key del mensaje."
        },
        {
          "id": "b",
          "text": "Ignorar el mensaje porque `after` viene en NULL.",
          "correct": false,
          "feedback": "Incorrecto: ignorar los eventos op = \"d\" deja filas fantasma en el almacén que ya fueron borradas en producción."
        },
        {
          "id": "c",
          "text": "Insertar una fila con todas las columnas en NULL.",
          "correct": false,
          "feedback": "Incorrecto: ensuciaría la tabla destino con registros vacíos en lugar de retirar la entidad eliminada."
        }
      ],
      "explanation": "En Debezium, los eventos de borrado (`op = \"d\"`) llevan `after: null` y conservan en `before` (y en la clave del mensaje Kafka) el identificador necesario para propagar la baja."
    }
  ],
  "practice": {
    "type": "fill-blanks",
    "title": "Consolidación de eventos CDC con Debezium",
    "language": "sql",
    "prompt": "Completa la consulta que consolida un lote de eventos CDC de Debezium (`op` en `\"c\"`, `\"u\"`, `\"d\"`). Cuando un registro se borra (`op = \"d\"`), el objeto `after` viene en `NULL` y la clave primaria solo existe en `before.order_id`. Debes extraer la clave de forma segura, ordenar por el número de secuencia del log (`source_lsn DESC`) y filtrar los registros eliminados en la vista activa.",
    "starterCode": "WITH ranked_cdc AS (\n  SELECT\n    {{b1}} AS order_id,\n    after_customer_id AS customer_id,\n    after_amount_usd AS amount_usd,\n    op,\n    source_lsn\n  FROM bronze.orders_cdc_stream\n  QUALIFY ROW_NUMBER() OVER (\n    PARTITION BY COALESCE(after_order_id, before_order_id)\n    ORDER BY {{b2}}\n  ) = 1\n)\nSELECT\n  order_id,\n  customer_id,\n  amount_usd,\n  source_lsn\nFROM ranked_cdc\nWHERE {{b3}};",
    "expected": "WITH ranked_cdc AS (\n  SELECT\n    {{b1}} AS order_id,\n    after_customer_id AS customer_id,\n    after_amount_usd AS amount_usd,\n    op,\n    source_lsn\n  FROM bronze.orders_cdc_stream\n  QUALIFY ROW_NUMBER() OVER (\n    PARTITION BY COALESCE(after_order_id, before_order_id)\n    ORDER BY {{b2}}\n  ) = 1\n)\nSELECT\n  order_id,\n  customer_id,\n  amount_usd,\n  source_lsn\nFROM ranked_cdc\nWHERE {{b3}};",
    "orderMatters": true,
    "hints": [
      "Extraer order_id incluso en eventos DELETE: En un `DELETE` (`op = \"d\"`), `after_order_id` es `NULL`, por lo que debes usar `COALESCE` con `before_order_id`.",
      "Ordenar por secuencia exacta del WAL: El `source_lsn` (Log Sequence Number de Postgres) garantiza el orden estricto de confirmación transaccional; quédate con el más reciente (`DESC`).",
      "Excluir órdenes eliminadas en el origen: Filtra las filas cuya última operación en el log no fue un borrado (`op <> 'd'`)."
    ],
    "solution": "WITH ranked_cdc AS (\n  SELECT\n    {{b1}} AS order_id,\n    after_customer_id AS customer_id,\n    after_amount_usd AS amount_usd,\n    op,\n    source_lsn\n  FROM bronze.orders_cdc_stream\n  QUALIFY ROW_NUMBER() OVER (\n    PARTITION BY COALESCE(after_order_id, before_order_id)\n    ORDER BY {{b2}}\n  ) = 1\n)\nSELECT\n  order_id,\n  customer_id,\n  amount_usd,\n  source_lsn\nFROM ranked_cdc\nWHERE {{b3}};",
    "solutionExplanation": "Extrae la clave primaria usando `COALESCE(after_id, before_id)` para no perder el identificador en eventos `DELETE`. Ordena por el número de secuencia transaccional del log (`source_lsn DESC`) en lugar de relojes de ingesta inexactos. Filtra o aplica correctamente los eventos `op = \"d\"` para evitar registros fantasma en Analytics y BI.",
    "blanks": [
      {
        "id": "b1",
        "placeholder": "Extraer order_id incluso en eventos DELETE",
        "acceptedAnswers": [
          "COALESCE(after_order_id, before_order_id)",
          "IFNULL(after_order_id, before_order_id)"
        ],
        "hint": "En un `DELETE` (`op = \"d\"`), `after_order_id` es `NULL`, por lo que debes usar `COALESCE` con `before_order_id`."
      },
      {
        "id": "b2",
        "placeholder": "Ordenar por secuencia exacta del WAL",
        "acceptedAnswers": [
          "source_lsn DESC",
          "source_lsn desc"
        ],
        "hint": "El `source_lsn` (Log Sequence Number de Postgres) garantiza el orden estricto de confirmación transaccional; quédate con el más reciente (`DESC`)."
      },
      {
        "id": "b3",
        "placeholder": "Excluir órdenes eliminadas en el origen",
        "acceptedAnswers": [
          "op <> 'd'",
          "op IN ('c', 'u', 'r')"
        ],
        "hint": "Filtra las filas cuya última operación en el log no fue un borrado (`op <> 'd'`)."
      }
    ],
    "expectedOutputTable": [
      {
        "order_id": "ORD-501",
        "customer_id": "CUST-19",
        "amount_usd": "$180.00",
        "source_lsn": 94810244
      },
      {
        "order_id": "ORD-503",
        "customer_id": "CUST-42",
        "amount_usd": "$450.00",
        "source_lsn": 94810299
      }
    ],
    "rubricCriteria": [
      "Extrae la clave primaria usando `COALESCE(after_id, before_id)` para no perder el identificador en eventos `DELETE`.",
      "Ordena por el número de secuencia transaccional del log (`source_lsn DESC`) en lugar de relojes de ingesta inexactos.",
      "Filtra o aplica correctamente los eventos `op = \"d\"` para evitar registros fantasma en Analytics y BI."
    ]
  },
  "roleNotes": {
    "de": "Despliega conectores Debezium sobre slots de replicación PostgreSQL con monitoreo estricto de `replication_slot_lag` para evitar que un conector detenido llene el disco WAL de producción (configurando `max_slot_wal_keep_size`). Implementa el patrón Transactional Outbox junto a ingeniería de software y registra esquemas Avro/Protobuf en Schema Registry con compatibilidad `BACKWARD_TRANSITIVE`. Adopta colas Zero-Disk (WarpStream) o Kafka Tiered Storage con compactación automática hacia Apache Iceberg v3 (Deletion Vectors para eventos `op = \"d\"`).",
    "da": "Aprovecha los payloads `before` y `after` del flujo CDC para reconstruir cada transición de estado (`PENDING → PAID → REFUNDED`) y medir tiempos exactos de ciclo operativo. Audita que los eventos de borrado (`op = \"d\"`) y los tombstones se reflejen como bajas lógicas o ajustes contables en Silver, evitando que pedidos cancelados inflen el LTV.",
    "bi": "Separa claramente los **Tableros Operativos en Vivo** (monitoreo de pasarelas, inventario minuto a minuto) de los **Tableros Financieros Auditados** (que consumen snapshots cerrados de Iceberg). Muestra en la cabecera del dashboard un indicador explícito de frescura y salud del pipeline CDC (`Latencia extremo a extremo: 1.8 s · Último evento WAL recibido`)."
  },
  "summary": [
    "El polling por updated_at sobrecarga la base primaria y es ciego ante borrados físicos (DELETE).",
    "Debezium lee el registro transaccional (WAL/binlog) de forma secuencial sin bloquear las tablas.",
    "El patrón Transactional Outbox guarda el cambio y el evento en la misma transacción ACID local.",
    "El almacenamiento por niveles en Kafka separa el cómputo de los brokers del historial en S3."
  ],
  "flashcards": [
    {
      "id": "fc-de4-cdc-01",
      "front": "¿Cuáles son las dos fallas técnicas del polling por `WHERE updated_at > ...` frente al CDC basado en el WAL?",
      "back": "1) Impone carga de lectura repetida sobre el motor OLTP y 2) no detecta filas eliminadas con DELETE físico (no dejan updated_at)."
    },
    {
      "id": "fc-de4-cdc-02",
      "front": "¿Qué resuelve el patrón Transactional Outbox en un microservicio?",
      "back": "Evita la escritura doble inconsistente (guardar en Postgres y publicar en Kafka por separado); escribe ambos en la misma transacción de base de datos y CDC publica la tabla outbox."
    },
    {
      "id": "fc-de4-cdc-03",
      "front": "¿Qué representan los códigos `op` = `c`, `u`, `d`, `r` en un mensaje de Debezium?",
      "back": "c = create (INSERT), u = update (UPDATE con before y after), d = delete (DELETE con los datos previos en before), r = read (snapshot inicial)."
    }
  ],
  "glossaryTerms": [
    "c26-bi-as-code",
    "c18-iceberg-v3"
  ],
  "sources": [
    {
      "title": "Debezium Official Documentation — Architecture and PostgreSQL Connector (WAL Logical Decoding)",
      "url": "https://debezium.io/documentation/reference/stable/architecture.html",
      "publisher": "Debezium / Red Hat",
      "accessed": "2026-10-29",
      "supports": "Lectura del registro de transacciones y estructura de sobres de eventos CDC (before, after, op)."
    },
    {
      "title": "Debezium Documentation — Outbox Event Router Pattern",
      "url": "https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html",
      "publisher": "Debezium / Red Hat",
      "accessed": "2026-10-29",
      "supports": "Implementación del patrón Transactional Outbox para evitar escrituras dobles."
    },
    {
      "title": "Apache Kafka Documentation — Tiered Storage and Log Compaction",
      "url": "https://kafka.apache.org/documentation/#tiered_storage",
      "publisher": "Apache Software Foundation",
      "accessed": "2026-10-29",
      "supports": "Separación de almacenamiento local en brokers y retención histórica en almacenamiento de objetos."
    }
  ],
  "aiNotes": "Asegúrate de que el alumno distinga por qué en un evento `op = \"d\"` el bloque `after` viene en `null` (por lo que en SQL debe tomarse el ID con `COALESCE(after.id, before.id)`).",
  "needsReview": true,
  "legacyId": "l16-cdc-kafka-streaming",
  "legacyOrder": 16,
  "stageId": "stage-6",
  "subtitle": "Lectura del registro transaccional, patrón outbox y criterios para elegir entre lotes y flujo continuo.",
  "goal": "Evaluar cuándo un caso de negocio justifica la complejidad del streaming frente a micro-batches sobre Iceberg, implementar Change Data Capture (CDC) leyendo el WAL/Binlog con Debezium y diseñar arquitecturas Kafka Zero-Disk (WarpStream / Tiered Storage) con el patrón Transactional Outbox.",
  "pipelineChallenge": {
    "title": "Captura CDC con patrón outbox e Iceberg",
    "scenario": "Ordena los 5 pasos arquitectónicos para capturar transacciones de un microservicio de pagos hacia analítica en tiempo real sin golpear la base de datos con queries pesados ni sufrir pérdida de mensajes por Dual-Write.",
    "steps": [
      {
        "id": "cdc-1",
        "label": "1. Escritura atómica en tabla de negocio y tabla transactional outbox en Postgres",
        "role": "DE",
        "detail": "El microservicio inserta la orden y el evento tipado dentro de la misma transacción ACID local, evitando el antipatrón Dual-Write."
      },
      {
        "id": "cdc-2",
        "label": "2. Captura secuencial del WAL con conector Debezium y registro de esquemas",
        "role": "DE",
        "detail": "Debezium lee el Write-Ahead Log binario sin ejecutar SELECTs costosos y valida el esquema contra el contrato ODCS."
      },
      {
        "id": "cdc-3",
        "label": "3. Transporte en tópico particionado por clave en WarpStream o Kafka",
        "role": "DE",
        "detail": "Los eventos viajan particionados por `order_id` garantizando el orden estricto de estados sobre almacenamiento S3 Zero-Disk."
      },
      {
        "id": "cdc-4",
        "label": "4. Compactación MERGE y vectores de borrado en Apache Iceberg v3 (Silver)",
        "role": "DA",
        "detail": "Se deduplica por LSN preservando la tabla de historial completo de transiciones (`order_state_transitions`) y la tabla de estado actual."
      },
      {
        "id": "cdc-5",
        "label": "5. Exposición de métricas reconciliadas e indicador de latencia en BI",
        "role": "BI",
        "detail": "El dashboard financiero consume la Capa Semántica libre de órdenes borradas y muestra el SLA de frescura del flujo CDC."
      }
    ],
    "explanation": "El patrón Transactional Outbox + Debezium WAL + Kafka/WarpStream + Iceberg v3 garantiza que cada transacción comprometida en producción llegue exactamente en orden al Lakehouse y a BI, incluyendo borrados físicos y sin degradar el checkout."
  },
  "relatedLessons": [
    {
      "id": "l17-flink-watermarks-mv",
      "reason": "Una vez que los eventos CDC están en Kafka/WarpStream, aprende a procesarlos en ventanas temporales con Flink y Watermarks."
    },
    {
      "id": "l10-iceberg-v3-medallion",
      "reason": "Descubre cómo los eventos de cambio CDC aterrizan en tablas Apache Iceberg v3 usando Deletion Vectors."
    }
  ]
};

export default lesson;
