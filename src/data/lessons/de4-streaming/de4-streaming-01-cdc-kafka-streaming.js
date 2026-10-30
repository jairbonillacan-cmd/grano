export const lesson = {
  "id": "de4-streaming-01-cdc-kafka-streaming",
  "moduleId": "de4-streaming",
  "legacyId": "l16-cdc-kafka-streaming",
  "legacyOrder": 16,
  "order": 1,
  "title": "Captura de cambios (CDC) con Debezium y Kafka",
  "subtitle": "Lectura del registro transaccional (WAL), patrón transactional outbox y consolidación CDC",
  "tracks": [
    "de"
  ],
  "level": 4,
  "minutes": 30,
  "prerequisites": [
    "de3-lakehouse-01-iceberg-v3-medallion",
    "de3-transformacion-01-dbt-sqlmesh-dag"
  ],
  "contentVersion": 2,
  "needsReview": false,
  "dataset": "Mercado Brisa (empresa ficticia) — tablas customer_changes y customers",
  "block": "Bloque 4 · Flujos en tiempo real y CDC",
  "badge": "CDC & Kafka",
  "HookType": "Fallo de producción",
  "hook": "El motor de promociones de Mercado Brisa (empresa ficticia) consulta PostgreSQL cada cinco minutos mediante SELECT filtrando por fecha de actualización. En pleno pico de ventas, esa consulta agota las conexiones, ignora filas borradas con DELETE y aplica descuentos caducados cuando ocurren dos cambios en el mismo minuto. ¿Cómo capturar cada inserción, actualización y borrado desde el registro de transacciones (WAL) sin sobrecargar el motor operativo ni perder el orden de los eventos?",
  "objectives": [
    "Distinguir la captura de cambios basada en registro transaccional (Log-Based CDC sobre el WAL de PostgreSQL) frente al sondeo por consultas (query-based polling) y sus puntos ciegos.",
    "Interpretar la estructura de un evento Debezium (before, after, op y bloque source con lsn) y prevenir el llenado de disco por replication slots inactivos.",
    "Implementar el patrón Transactional Outbox para eliminar el problema de doble escritura entre la base de datos operativa y Apache Kafka.",
    "Consolidar un historial de eventos de cambio en SQL mediante funciones de ventana sobre customer_changes para reconstruir el estado vigente de cada cliente."
  ],
  "sections": [
    {
      "heading": "Captura basada en el registro (WAL) frente a sondeo por consultas",
      "body": "Extraer cambios de una base operativa ejecutando consultas periódicas `SELECT * FROM customers WHERE updated_at > :corte` introduce tres defectos graves. Primero, compite por CPU, memoria y bloqueos de lectura con las compras reales de los clientes. Segundo, pierde cualquier estado intermedio si una fila cambia tres veces entre dos ejecuciones del lote. Tercero, no detecta eliminaciones físicas (`DELETE`), porque la fila desaparece de la tabla antes del siguiente barrido.\n\nLa **captura de cambios basada en registro** (*Log-Based CDC*) resuelve esto leyendo directamente el **Write-Ahead Log** (`WAL`) en PostgreSQL. Para exponer los cambios por fila, el parámetro `wal_level` debe configurarse en `logical`. El conector **Debezium** abre una sesión de replicación mediante el plugin nativo `pgoutput` y se suscribe a un *replication slot*. Ese *slot* guarda el último `LSN` (*Log Sequence Number*) confirmado. Si el conector cae, PostgreSQL retiene los archivos WAL en disco. Por ello, es obligatorio configurar `max_slot_wal_keep_size` para evitar que el disco primario se llene por completo.",
      "interactive": {
        "component": "cdc-log-stream",
        "caption": "Simulador interactivo del flujo WAL de PostgreSQL hacia Debezium y particiones de Apache Kafka."
      },
      "example": {
        "language": "sql",
        "code": "-- Inspección de clientes con múltiples eventos de cambio en Mercado Brisa\nSELECT customer_id,\n       COUNT(*) AS total_cdc_events,\n       MIN(valid_from)::VARCHAR AS first_event_ts,\n       MAX(valid_from)::VARCHAR AS latest_event_ts\nFROM customer_changes\nGROUP BY customer_id\nHAVING COUNT(*) >= 3\nORDER BY total_cdc_events DESC, customer_id ASC\nLIMIT 5;",
        "expectedOutput": [
          {
            "customer_id": 1,
            "total_cdc_events": 3,
            "first_event_ts": "2023-05-12 08:00:00",
            "latest_event_ts": "2023-12-02 08:00:00"
          },
          {
            "customer_id": 2,
            "total_cdc_events": 3,
            "first_event_ts": "2024-04-30 08:00:00",
            "latest_event_ts": "2025-02-02 08:00:00"
          },
          {
            "customer_id": 3,
            "total_cdc_events": 3,
            "first_event_ts": "2024-04-13 08:00:00",
            "latest_event_ts": "2024-12-23 08:00:00"
          },
          {
            "customer_id": 4,
            "total_cdc_events": 3,
            "first_event_ts": "2023-07-26 08:00:00",
            "latest_event_ts": "2024-04-15 08:00:00"
          },
          {
            "customer_id": 5,
            "total_cdc_events": 3,
            "first_event_ts": "2024-03-24 08:00:00",
            "latest_event_ts": "2025-01-02 08:00:00"
          }
        ]
      },
      "id": "de4-streaming-01-cdc-kafka-streaming-sec-1"
    },
    {
      "heading": "Anatomía del sobre Debezium y compactación por clave en Kafka",
      "body": "Cuando Debezium decodifica una transacción confirmada en el WAL, emite un mensaje estructurado con cuatro bloques: `before`, `after`, `op` y `source`. El bloque `before` contiene el estado anterior de la fila y `after` contiene el estado nuevo. El bloque `source` aporta metadatos de auditoría como `lsn`, `txId` y `ts_ms`. El campo `op` identifica la operación: `r` para instantánea inicial (*snapshot*), `c` para inserción (`INSERT`), `u` para actualización (`UPDATE`) y `d` para borrado (`DELETE`). En un borrado `d`, el campo `before` conserva la última foto conocida y `after` viaja como `null`.\n\nJusto después del evento de borrado, Debezium emite un segundo mensaje llamado **tombstone**. Este mensaje conserva la misma clave primaria pero lleva el cuerpo nulo (`value = null`). En **Apache Kafka**, cuando un tópico usa `cleanup.policy = compact`, el compactador retiene solo la última versión de cada clave. El *tombstone* le indica a Kafka que debe borrar esa clave tras cumplirse el tiempo `delete.retention.ms`.",
      "example": {
        "language": "sql",
        "code": "-- Evolución de nivel (tier) y segmento para los clientes 2 y 8 en customer_changes\nSELECT customer_id,\n       change_id,\n       tier,\n       segment,\n       valid_from::VARCHAR AS valid_from_ts,\n       is_current\nFROM customer_changes\nWHERE customer_id IN (2, 8)\nORDER BY customer_id ASC, valid_from ASC;",
        "expectedOutput": [
          {
            "customer_id": 2,
            "change_id": 4,
            "tier": "bronce",
            "segment": "retail",
            "valid_from_ts": "2024-04-30 08:00:00",
            "is_current": false
          },
          {
            "customer_id": 2,
            "change_id": 5,
            "tier": "plata",
            "segment": "pro_barista",
            "valid_from_ts": "2024-09-24 08:00:00",
            "is_current": false
          },
          {
            "customer_id": 2,
            "change_id": 6,
            "tier": "oro",
            "segment": "pro_barista",
            "valid_from_ts": "2025-02-02 08:00:00",
            "is_current": true
          },
          {
            "customer_id": 8,
            "change_id": 22,
            "tier": "bronce",
            "segment": "retail",
            "valid_from_ts": "2023-09-20 08:00:00",
            "is_current": false
          },
          {
            "customer_id": 8,
            "change_id": 23,
            "tier": "plata",
            "segment": "pro_barista",
            "valid_from_ts": "2024-01-06 08:00:00",
            "is_current": false
          },
          {
            "customer_id": 8,
            "change_id": 24,
            "tier": "oro",
            "segment": "cafeteria_b2b",
            "valid_from_ts": "2024-07-14 08:00:00",
            "is_current": true
          }
        ]
      },
      "id": "de4-streaming-01-cdc-kafka-streaming-sec-2"
    },
    {
      "heading": "Patrón Transactional Outbox y consolidación determinista en destino",
      "body": "Un error frecuente en microservicios consiste en actualizar la base de datos local y luego publicar un mensaje en Kafka desde el código. Esta **doble escritura** (*dual write*) no es atómica. Si la red falla después del `COMMIT` en PostgreSQL pero antes de publicar en Kafka, el almacén analítico pierde el evento. El patrón **Transactional Outbox** evita esta falla escribiendo el cambio de negocio y el evento en una tabla `outbox` dentro de la misma transacción ACID.\n\nDespués, Debezium lee el WAL de la tabla `outbox` y usa la transformación `Outbox Event Router` para enviar el evento a Kafka. En el destino analítico, el consumidor puede recibir varias versiones de un mismo cliente por actualizaciones sucesivas o reintentos. Para obtener la foto actual sin duplicados, aplicamos `ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY valid_from DESC, change_id DESC)`. Al filtrar la fila con rango `1`, consolidamos el estado vigente de cada cliente.",
      "example": {
        "language": "sql",
        "code": "-- Consolidación del último estado por cliente a partir del flujo customer_changes\nWITH latest_cdc AS (\n  SELECT customer_id,\n         change_id,\n         tier AS cdc_tier,\n         segment AS cdc_segment,\n         ROW_NUMBER() OVER (\n           PARTITION BY customer_id\n           ORDER BY valid_from DESC, change_id DESC\n         ) AS rn\n  FROM customer_changes\n)\nSELECT customer_id, change_id, cdc_tier, cdc_segment\nFROM latest_cdc\nWHERE rn = 1 AND customer_id IN (2, 8)\nORDER BY customer_id ASC;",
        "expectedOutput": [
          {
            "customer_id": 2,
            "change_id": 6,
            "cdc_tier": "oro",
            "cdc_segment": "pro_barista"
          },
          {
            "customer_id": 8,
            "change_id": 24,
            "cdc_tier": "oro",
            "cdc_segment": "cafeteria_b2b"
          }
        ]
      },
      "id": "de4-streaming-01-cdc-kafka-streaming-sec-3"
    }
  ],
  "workedExample": {
    "title": "Reconstrucción y auditoría CDC de niveles de fidelidad en Mercado Brisa",
    "description": "El equipo de ingeniería de datos de Mercado Brisa (empresa ficticia) recibe el registro histórico customer_changes (4 100 eventos para 2 400 clientes) y necesita verificar paso a paso que el último evento por cliente coincida al 100 % con la tabla maestra customers.",
    "audit": "Verificado con DuckDB sobre public/datasets/customer_changes.parquet (4 100 filas) y public/datasets/customers.parquet (2 400 filas).",
    "steps": [
      {
        "label": "Paso 1 · Cuantificar el volumen de cambios frente a clientes únicos",
        "explanation": "Antes de consolidar un flujo CDC, inspeccionamos cuántos eventos totales existen en `customer_changes` y cuántos clientes distintos han sufrido transiciones de nivel o segmento.",
        "code": "SELECT COUNT(*) AS total_changes,\n       COUNT(DISTINCT customer_id) AS distinct_customers,\n       SUM(CASE WHEN is_current THEN 1 ELSE 0 END) AS flagged_current_rows\nFROM customer_changes;",
        "expectedOutput": [
          {
            "total_changes": 4100,
            "distinct_customers": 2400,
            "flagged_current_rows": 2400
          }
        ]
      },
      {
        "label": "Paso 2 · Ordenar eventos por marca temporal y secuencia de cambio",
        "explanation": "En un flujo CDC, no debemos depender únicamente de una bandera booleana si llegan eventos reenviados; ordenamos por `valid_from DESC` y desempatamos con el identificador secuencial `change_id DESC` dentro de cada `customer_id`.",
        "code": "WITH ranked_changes AS (\n  SELECT customer_id,\n         change_id,\n         tier AS cdc_tier,\n         segment AS cdc_segment,\n         ROW_NUMBER() OVER (\n           PARTITION BY customer_id\n           ORDER BY valid_from DESC, change_id DESC\n         ) AS rn\n  FROM customer_changes\n)\nSELECT customer_id, change_id, cdc_tier, cdc_segment\nFROM ranked_changes\nWHERE rn = 1 AND customer_id <= 5\nORDER BY customer_id ASC;",
        "expectedOutput": [
          {
            "customer_id": 1,
            "change_id": 3,
            "cdc_tier": "platino",
            "cdc_segment": "pro_barista"
          },
          {
            "customer_id": 2,
            "change_id": 6,
            "cdc_tier": "oro",
            "cdc_segment": "pro_barista"
          },
          {
            "customer_id": 3,
            "change_id": 9,
            "cdc_tier": "platino",
            "cdc_segment": "pro_barista"
          },
          {
            "customer_id": 4,
            "change_id": 12,
            "cdc_tier": "oro",
            "cdc_segment": "cafeteria_b2b"
          },
          {
            "customer_id": 5,
            "change_id": 15,
            "cdc_tier": "platino",
            "cdc_segment": "pro_barista"
          }
        ]
      },
      {
        "label": "Paso 3 · Cruzar la vista consolidada con la tabla operativa customers",
        "explanation": "Unimos la versión ganadora (`rn = 1`) con `customers` para comprobar que tanto `current_tier` como `segment` coinciden exactamente en los 2 400 registros activos e inactivos.",
        "code": "WITH latest_cdc AS (\n  SELECT customer_id,\n         tier AS cdc_tier,\n         segment AS cdc_segment,\n         ROW_NUMBER() OVER (\n           PARTITION BY customer_id\n           ORDER BY valid_from DESC, change_id DESC\n         ) AS rn\n  FROM customer_changes\n)\nSELECT l.cdc_tier,\n       COUNT(*) AS total_customers,\n       SUM(CASE WHEN l.cdc_tier = c.current_tier AND l.cdc_segment = c.segment THEN 1 ELSE 0 END) AS synced_customers\nFROM latest_cdc l\nJOIN customers c ON c.customer_id = l.customer_id\nWHERE l.rn = 1\nGROUP BY l.cdc_tier\nORDER BY total_customers DESC;",
        "expectedOutput": [
          {
            "cdc_tier": "oro",
            "total_customers": 1017,
            "synced_customers": 1017
          },
          {
            "cdc_tier": "plata",
            "total_customers": 816,
            "synced_customers": 816
          },
          {
            "cdc_tier": "bronce",
            "total_customers": 367,
            "synced_customers": 367
          },
          {
            "cdc_tier": "platino",
            "total_customers": 200,
            "synced_customers": 200
          }
        ]
      }
    ]
  },
  "checks": [
    {
      "id": "chk-de4-01-wal",
      "type": "mcq",
      "prompt": "¿Qué parámetro de configuración en PostgreSQL es obligatorio para que Debezium extraiga eventos de cambio por fila mediante el plugin nativo pgoutput?",
      "options": [
        {
          "id": "a",
          "text": "wal_level = replica, ya que transmite bloques físicos de disco hacia las réplicas de lectura.",
          "correct": false,
          "feedback": "El nivel replica solo transmite cambios físicos a nivel de página de disco; no permite decodificación lógica por tabla y fila."
        },
        {
          "id": "b",
          "text": "wal_level = logical, acompañado de un replication slot supervisado con max_slot_wal_keep_size.",
          "correct": true,
          "feedback": "Exacto. El nivel logical registra la información necesaria para que pgoutput reconstruya tuplas before/after, y max_slot_wal_keep_size protege el disco primario."
        },
        {
          "id": "c",
          "text": "wal_level = minimal, combinándolo con un trigger AFTER UPDATE que inserte en una tabla temporal.",
          "correct": false,
          "feedback": "El nivel minimal ni siquiera soporta replicación continua, y los triggers añaden sobrecarga síncrona a cada transacción OLTP."
        },
        {
          "id": "d",
          "text": "synchronous_commit = off, para que el conector lea transacciones antes de que se escriban en el WAL.",
          "correct": false,
          "feedback": "Debezium solo emite transacciones ya confirmadas en el WAL; desactivar synchronous_commit no habilita la decodificación lógica."
        }
      ],
      "explanation": "La decodificación lógica en PostgreSQL requiere wal_level = logical en postgresql.conf para enriquecer el Write-Ahead Log con metadatos de relación y tupla consumibles por pgoutput."
    },
    {
      "id": "chk-de4-01-tombstone",
      "type": "mcq",
      "prompt": "Cuando se ejecuta un DELETE físico en la base origen, Debezium emite un evento con op = \"d\" seguido de un mensaje tombstone (key = K, value = null). ¿Qué función cumple ese tombstone en Kafka?",
      "options": [
        {
          "id": "a",
          "text": "Reiniciar el offset de todos los grupos de consumidores suscritos a la partición.",
          "correct": false,
          "feedback": "Los mensajes con valor nulo no alteran ni reinician los offsets confirmados por los grupos de consumidores."
        },
        {
          "id": "b",
          "text": "Indicar al compactador de logs de Kafka que puede eliminar definitivamente la clave K tras cumplirse delete.retention.ms.",
          "correct": true,
          "feedback": "Correcto. Sin el mensaje tombstone, un tópico con cleanup.policy = compact retendría el evento op = \"d\" para siempre como último valor de la clave."
        },
        {
          "id": "c",
          "text": "Bloquear la partición para impedir nuevas inserciones con la misma clave primaria.",
          "correct": false,
          "feedback": "Kafka permite publicar nuevas inserciones para cualquier clave en cualquier momento sin bloquear la partición."
        },
        {
          "id": "d",
          "text": "Confirmar la transacción en PostgreSQL mediante un acuse de recibo inverso hacia el replication slot.",
          "correct": false,
          "feedback": "La confirmación del LSN hacia PostgreSQL ocurre por el protocolo de replicación de Kafka Connect, no mediante mensajes tombstone."
        }
      ],
      "explanation": "En tópicos compactados de Kafka, un registro con clave no nula y payload nulo actúa como marcador de borrado (tombstone) para que el hilo limpiador purgue la clave."
    },
    {
      "id": "chk-de4-01-outbox",
      "type": "mcq",
      "prompt": "¿Cómo resuelve el patrón Transactional Outbox el riesgo de inconsistencia por doble escritura entre un microservicio y Apache Kafka?",
      "options": [
        {
          "id": "a",
          "text": "Publicando primero en Kafka con acks=0 y ejecutando después el COMMIT en la base de datos local.",
          "correct": false,
          "feedback": "Si el COMMIT en la base de datos falla tras haber publicado en Kafka, los consumidores recibirán un evento fantasma que nunca ocurrió."
        },
        {
          "id": "b",
          "text": "Insertando el evento en una tabla outbox dentro de la misma transacción ACID local y delegando a Debezium su lectura desde el WAL.",
          "correct": true,
          "feedback": "Exacto. Al compartir la transacción local, o se confirman ambos cambios (tabla de negocio y tabla outbox) o se revierte todo atómicamente."
        },
        {
          "id": "c",
          "text": "Reemplazando la base de datos relacional por lecturas directas desde los segmentos remotos de Kafka.",
          "correct": false,
          "feedback": "El patrón Outbox mantiene la base transaccional OLTP intacta y utiliza una tabla auxiliar dentro del mismo esquema."
        }
      ],
      "explanation": "El patrón Transactional Outbox aprovecha la atomicidad ACID del motor relacional local: el cambio operativo y la fila outbox se confirman en un único COMMIT y Debezium los propaga desde el WAL."
    },
    {
      "id": "chk-de4-01-predict",
      "type": "predict-output",
      "prompt": "En Mercado Brisa, el cliente con customer_id = 2 tiene tres filas en customer_changes: change_id 4 (bronce, 2024-04-30), change_id 5 (plata, 2024-09-24) y change_id 6 (oro, 2025-02-02). Si aplicas ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY valid_from DESC, change_id DESC) y filtras rn = 1, ¿qué fila obtienes?",
      "options": [
        {
          "id": "a",
          "text": "change_id = 4, tier = bronce",
          "correct": false,
          "feedback": "Ese sería el resultado si ordenaras de forma ascendente (valid_from ASC), recuperando el primer evento histórico."
        },
        {
          "id": "b",
          "text": "change_id = 6, tier = oro",
          "correct": true,
          "feedback": "Correcto. Al ordenar descendentemente por valid_from y desempatar por change_id DESC, la fila más reciente recibe rn = 1."
        },
        {
          "id": "c",
          "text": "Las tres filas del cliente 2 numeradas del 1 al 3.",
          "correct": false,
          "feedback": "El predicado WHERE rn = 1 descarta las versiones históricas 2 y 3, dejando solo el estado vigente."
        }
      ],
      "explanation": "Ordenar por valid_from DESC, change_id DESC asigna rn = 1 al último cambio registrado para cada customer_id, colapsando el flujo de eventos en su estado actual."
    }
  ],
  "practice": {
    "type": "sql",
    "title": "Auditoría de paridad entre el flujo CDC customer_changes y la tabla customers",
    "language": "sql",
    "prompt": "Construye una consulta SQL en DuckDB que consolide el último evento de cambio por `customer_id` en la tabla `customer_changes` (ordenando por `valid_from DESC, change_id DESC`) y lo una con la tabla maestra `customers`. Agrupa el resultado por el nivel obtenido del flujo CDC (`cdc_tier`) y por el estado de actividad (`is_active`), calculando dos métricas: `total_customers` (total de clientes en ese grupo) y `synced_customers` (clientes cuyo `cdc_tier` coincide con `customers.current_tier` y cuyo `cdc_segment` coincide con `customers.segment`). Ordena por `total_customers DESC, cdc_tier ASC`.",
    "starterCode": "WITH latest_cdc AS (\n  SELECT customer_id,\n         tier AS cdc_tier,\n         segment AS cdc_segment,\n         -- COMPLETA: reemplaza 1 por ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY valid_from DESC, change_id DESC)\n         1 AS rn\n  FROM customer_changes\n)\nSELECT l.cdc_tier,\n       c.is_active,\n       COUNT(*) AS total_customers,\n       -- COMPLETA: calcula synced_customers comparando l.cdc_tier = c.current_tier AND l.cdc_segment = c.segment\n       0 AS synced_customers\nFROM latest_cdc l\nJOIN customers c ON c.customer_id = l.customer_id\nWHERE l.rn = 1\nGROUP BY l.cdc_tier, c.is_active\nORDER BY total_customers DESC, l.cdc_tier ASC;",
    "solution": "WITH latest_cdc AS (\n  SELECT customer_id,\n         tier AS cdc_tier,\n         segment AS cdc_segment,\n         ROW_NUMBER() OVER (\n           PARTITION BY customer_id\n           ORDER BY valid_from DESC, change_id DESC\n         ) AS rn\n  FROM customer_changes\n)\nSELECT l.cdc_tier,\n       c.is_active,\n       COUNT(*) AS total_customers,\n       SUM(CASE WHEN l.cdc_tier = c.current_tier AND l.cdc_segment = c.segment THEN 1 ELSE 0 END) AS synced_customers\nFROM latest_cdc l\nJOIN customers c ON c.customer_id = l.customer_id\nWHERE l.rn = 1\nGROUP BY l.cdc_tier, c.is_active\nORDER BY total_customers DESC, l.cdc_tier ASC;",
    "solutionExplanation": "La CTE latest_cdc numera las versiones de cada cliente desde la más reciente hasta la más antigua usando valid_from DESC, change_id DESC. Al filtrar WHERE l.rn = 1 pasamos de 4 100 eventos históricos a exactamente 2 400 clientes únicos y verificamos que los 2 400 registros están sincronizados con la tabla customers.",
    "orderMatters": true,
    "hints": [
      "En la CTE latest_cdc, reemplaza 1 AS rn por ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY valid_from DESC, change_id DESC) AS rn.",
      "Si no aplicas correctamente ROW_NUMBER() y el filtro WHERE l.rn = 1, el conteo sumará los 4 100 cambios históricos en lugar de los 2 400 clientes.",
      "Para synced_customers utiliza SUM(CASE WHEN l.cdc_tier = c.current_tier AND l.cdc_segment = c.segment THEN 1 ELSE 0 END)."
    ],
    "expectedOutputTable": [
      {
        "cdc_tier": "oro",
        "is_active": true,
        "total_customers": 974,
        "synced_customers": 974
      },
      {
        "cdc_tier": "plata",
        "is_active": true,
        "total_customers": 786,
        "synced_customers": 786
      },
      {
        "cdc_tier": "bronce",
        "is_active": true,
        "total_customers": 293,
        "synced_customers": 293
      },
      {
        "cdc_tier": "platino",
        "is_active": true,
        "total_customers": 187,
        "synced_customers": 187
      },
      {
        "cdc_tier": "bronce",
        "is_active": false,
        "total_customers": 74,
        "synced_customers": 74
      },
      {
        "cdc_tier": "oro",
        "is_active": false,
        "total_customers": 43,
        "synced_customers": 43
      },
      {
        "cdc_tier": "plata",
        "is_active": false,
        "total_customers": 30,
        "synced_customers": 30
      },
      {
        "cdc_tier": "platino",
        "is_active": false,
        "total_customers": 13,
        "synced_customers": 13
      }
    ],
    "expectedOutput": {
      "columns": [
        "cdc_tier",
        "is_active",
        "total_customers",
        "synced_customers"
      ],
      "rows": [
        [
          "oro",
          true,
          974,
          974
        ],
        [
          "plata",
          true,
          786,
          786
        ],
        [
          "bronce",
          true,
          293,
          293
        ],
        [
          "platino",
          true,
          187,
          187
        ],
        [
          "bronce",
          false,
          74,
          74
        ],
        [
          "oro",
          false,
          43,
          43
        ],
        [
          "plata",
          false,
          30,
          30
        ],
        [
          "platino",
          false,
          13,
          13
        ]
      ]
    }
  },
  "pipelineChallenge": {
    "title": "Secuencia de arquitectura: captura de cambios desde PostgreSQL hasta la tabla consolidada",
    "description": "Ordena los pasos técnicos que recorre una mutación de cliente desde la transacción ACID en PostgreSQL hasta su materialización analítica sin duplicados.",
    "steps": [
      {
        "id": "step-wal-commit",
        "label": "1. Escritura atómica en el WAL de PostgreSQL (wal_level = logical)",
        "text": "1. Escritura atómica en el WAL de PostgreSQL (wal_level = logical)",
        "role": "Motor OLTP",
        "detail": "La transacción confirma el cambio de negocio y escribe las tuplas en el Write-Ahead Log con un LSN monótono."
      },
      {
        "id": "step-debezium-slot",
        "label": "2. Decodificación lógica mediante pgoutput y replication slot",
        "text": "2. Decodificación lógica mediante pgoutput y replication slot",
        "role": "Conector CDC",
        "detail": "Debezium lee el flujo del replication slot y construye el sobre con before, after, op y source.lsn."
      },
      {
        "id": "step-kafka-keyed",
        "label": "3. Publicación en tópico de Kafka particionado por customer_id",
        "text": "3. Publicación en tópico de Kafka particionado por customer_id",
        "role": "Transporte de eventos",
        "detail": "Todos los cambios de un mismo cliente aterrizan en la misma partición, preservando el orden secuencial y los tombstones."
      },
      {
        "id": "step-dedup-merge",
        "label": "4. Deduplicación por ventana (ROW_NUMBER) y consolidación en destino",
        "text": "4. Deduplicación por ventana (ROW_NUMBER) y consolidación en destino",
        "role": "Almacén analítico",
        "detail": "El motor SQL ordena por valid_from DESC, change_id DESC y retiene rn = 1 para materializar la foto vigente."
      }
    ],
    "correctOrder": [
      "step-wal-commit",
      "step-debezium-slot",
      "step-kafka-keyed",
      "step-dedup-merge"
    ],
    "hint": "El flujo comienza en el registro transaccional del motor OLTP, pasa por la decodificación de Debezium, se transporta ordenado por clave en Kafka y termina deduplicándose en el almacén."
  },
  "roleNotes": {
    "de": "Supervisa el retraso de cada replication slot en pg_replication_slots y configura max_slot_wal_keep_size en PostgreSQL. Un conector Debezium detenido sin cota de retención llenará el disco del nodo primario y provocará una caída de producción.",
    "da": "Al consultar tablas alimentadas por CDC en bruto (capa Bronze), recuerda que cada UPDATE genera una nueva fila de evento. Filtra siempre la versión más reciente con ROW_NUMBER() antes de agregar clientes o pedidos.",
    "bi": "Distingue entre la tabla de dimensión actual (customers) y el registro de auditoría temporal (customer_changes). Para atribuir ventas al nivel que tenía el cliente en la fecha del pedido, cruza con los intervalos valid_from y valid_to."
  },
  "summary": [
    "La captura basada en log (Log-Based CDC) lee el WAL con wal_level = logical sin penalizar las tablas operativas y detecta borrados físicos.",
    "Un evento Debezium contiene before, after, op y source.lsn; tras un DELETE emite un tombstone nulo para compactar en Kafka.",
    "El patrón Transactional Outbox evita la doble escritura insertando el evento en una tabla local dentro de la misma transacción ACID.",
    "La consolidación en SQL con ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY valid_from DESC, change_id DESC) reconstruye el estado actual sin duplicados."
  ],
  "flashcards": [
    {
      "id": "fc-de4-01-wal",
      "front": "¿Por qué el CDC por consulta (SELECT ... WHERE updated_at > X) pierde eliminaciones físicas?",
      "back": "Porque una sentencia DELETE elimina la fila de la tabla antes del siguiente barrido; en cambio, esa eliminación sí queda registrada como evento en el WAL."
    },
    {
      "id": "fc-de4-01-slot",
      "front": "¿Qué riesgo operativo implica un replication slot de PostgreSQL cuyo conector Debezium queda detenido?",
      "back": "PostgreSQL retiene todos los segmentos WAL desde el último LSN confirmado por el slot; sin max_slot_wal_keep_size, el disco del servidor primario puede llenarse por completo."
    },
    {
      "id": "fc-de4-01-outbox",
      "front": "¿En qué consiste el patrón Transactional Outbox?",
      "back": "En insertar el evento de dominio en una tabla outbox dentro de la misma transacción ACID local que modifica la entidad de negocio, para que Debezium lo publique en Kafka desde el WAL."
    },
    {
      "id": "fc-de4-01-tombstone",
      "front": "¿Qué es un mensaje tombstone en Kafka y por qué lo emite Debezium tras un evento op = \"d\"?",
      "back": "Es un mensaje con la clave primaria del registro eliminado y payload nulo (value = null) que permite al compactador de Kafka borrar definitivamente esa clave."
    }
  ],
  "glossaryTerms": [
    "captura-cambios-log-wal",
    "patron-transactional-outbox",
    "particionamiento-hash-kafka"
  ],
  "sources": [
    {
      "title": "Debezium Connector for PostgreSQL Documentation",
      "url": "https://debezium.io/documentation/reference/stable/connectors/postgresql.html",
      "publisher": "Red Hat / Debezium Community",
      "accessed": "2026-10-29",
      "supports": "Lectura del WAL con pgoutput, estructura de eventos before/after/op/source y gestión de replication slots."
    },
    {
      "title": "Debezium Outbox Event Router SMT",
      "url": "https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html",
      "publisher": "Red Hat / Debezium Community",
      "accessed": "2026-10-29",
      "supports": "Implementación del patrón Transactional Outbox mediante Kafka Connect Single Message Transform."
    },
    {
      "title": "PostgreSQL Documentation — Chapter 47: Logical Decoding Concepts",
      "url": "https://www.postgresql.org/docs/current/logicaldecoding-explanation.html",
      "publisher": "The PostgreSQL Global Development Group",
      "accessed": "2026-10-29",
      "supports": "Fundamentos de decodificación lógica del Write-Ahead Log, orden por LSN y durabilidad de replication slots."
    }
  ],
  "aiNotes": "Guía al estudiante sobre la diferencia entre el registro de cambios customer_changes (4 100 eventos) y la tabla actual customers (2 400 clientes) de Mercado Brisa. Si su consulta duplica clientes, indícale que debe particionar por customer_id en ROW_NUMBER() ordenando por valid_from DESC, change_id DESC y filtrar rn = 1 antes de agrupar."
};

export default lesson;
