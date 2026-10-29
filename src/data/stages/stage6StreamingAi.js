export const STAGE_6_LESSONS = [
  {
    id: 'l16-cdc-kafka-streaming',
    stageId: 'stage-6',
    order: 16,
    title: 'Captura CDC con Debezium y Kafka',
    subtitle: 'Lectura del registro transaccional, patrón outbox y criterios para elegir entre lotes y flujo continuo.',
    duration: '30 min',
    level: 'Avanzado',
    bloomLevel: 'evaluate',
    coreFocus: ['DE', 'DA', 'BI'],
    goal: 'Evaluar cuándo un caso de negocio justifica la complejidad del streaming frente a micro-batches sobre Iceberg, implementar Change Data Capture (CDC) leyendo el WAL/Binlog con Debezium y diseñar arquitecturas Kafka Zero-Disk (WarpStream / Tiered Storage) con el patrón Transactional Outbox.',
    visualType: 'streaming-watermark-lab',
    storyContext:
      'Caso real en PagoFlash LATAM: Un equipo de datos configuró un script que ejecutaba `SELECT * FROM orders WHERE updated_at >= NOW() - INTERVAL \'1 minute\'` cada 30 segundos contra la base PostgreSQL primaria de pagos. Durante el Cyber Monday, la consulta saturó el I/O de Postgres provocando caídas en el checkout; además, 1,400 órdenes fraudulentas que fueron eliminadas con `DELETE` físico jamás desaparecieron del Data Lakehouse, inflando el reporte de ventas en $210,000 USD. ¿Cómo se ingieren datos en vivo en 2026 sin tocar el motor SQL de producción ni perder borrados?',
    sections: [
      {
        heading: 'Criterios técnicos y económicos para elegir entre flujo continuo y micro-lotes',
        body: 'El error arquitectónico más caro en ingeniería de datos es construir un pipeline de streaming con estado complejo para alimentar un dashboard que el comité ejecutivo solo mira los lunes a las 9:00 AM.\nEn producción aplicamos la **Regla del Accionador (Human-in-the-loop vs. Machine-in-the-loop)**:\n- **Latencia > 5 minutos (Humano decide)**: Usa ingesta incremental o micro-batch cada 5–15 minutos hacia **Apache Iceberg v3** con **DuckDB / SQLMesh / dbt**. Es 5 veces más barato, fácil de reprocesar (backfill) y suficiente para el 85% del BI corporativo.\n- **Latencia < 5 segundos (Máquina u Operación Crítica decide)**: Usa **Streaming Real-Time (CDC + Kafka/WarpStream + Flink/Arroyo)** cuando una acción automatizada depende del evento: bloqueo de tarjeta por fraude en 150 ms, precios dinámicos (surge pricing), alerta operativa de caída de pasarela de pago o inventario en vivo.',
      },
      {
        heading: 'Extracción por consulta frente a captura del registro transaccional con Debezium',
        body: 'Consultar una base de datos OLTP periódicamente con `WHERE updated_at > ...` (*Query-Based Polling*) sufre cuatro defectos fatales en producción:\n1) Sobrecarga el CPU y los índices de la base transaccional que atiende a tus clientes.\n2) Es completamente ciego a los `DELETE` físicos (la fila ya no existe para el `SELECT`).\n3) Pierde estados intermedios: si un pedido pasa de `PENDING → AUTHORIZED → SHIPPED` en 10 segundos y consultas cada 5 minutos, solo ves `SHIPPED`, destruyendo el análisis de tiempos de embudo para DA.\n4) Depende de que ningún desarrollador olvide actualizar el campo `updated_at`.\n**Log-Based CDC (Debezium)** conecta un lector de replicación al registro binario interno de la base de datos (**Write-Ahead Log — WAL** en PostgreSQL o **Binlog** en MySQL). Cada `INSERT` (`op: "c"`), `UPDATE` (`op: "u"`) y `DELETE` (`op: "d"`) ya fue escrito secuencialmente en el WAL por el motor para su propia durabilidad ACID; Debezium simplemente lee ese flujo secuencial con impacto cercano a cero y publica el estado anterior (`before`) y posterior (`after`) en milisegundos.',
      },
      {
        heading: 'Patrón transactional outbox para evitar escrituras dobles inconsistentes',
        body: 'Cuando un microservicio guarda un pedido en PostgreSQL y en la línea siguiente de código intenta publicar un evento en Kafka (`producer.send()`), existe una condición de carrera letal conocida como **Dual-Write**: si la base de datos hace `COMMIT` pero la red hacia Kafka parpadea un milisegundo después, el pedido existe en la base pero el evento jamás llega a analítica ni a los sistemas downstream.\nEl **Patrón Transactional Outbox** resuelve esto con elegancia: el microservicio inserta el pedido en `orders` y el evento de dominio estructurado en una tabla `outbox_events` **dentro de la misma transacción ACID local de Postgres**. Luego, **Debezium** lee el WAL de `outbox_events` y lo entrega a Kafka con garantía *At-Least-Once*, respetando el Contrato de Datos (ODCS) sin acoplar el CDC a las tablas internas privadas del microservicio.',
      },
      {
        heading: 'Almacenamiento por niveles en Kafka y arquitecturas sobre almacenamiento de objetos',
        body: 'Hasta 2023, operar Apache Kafka en la nube era ruinoso por dos motivos: los brokers acoplaban cómputo con discos SSD locales caros (replicados 3x) y las transferencias entre zonas de disponibilidad (Cross-AZ networking) representaban hasta el 65% de la factura.\nEn producción dominan dos evoluciones:\n1) **Kafka Tiered Storage (KIP-405)** y **Redpanda**: mantienen solo las últimas horas en NVMe local y descargan automáticamente los segmentos históricos a almacenamiento de objetos barato (S3/GCS).\n2) **Arquitecturas Zero-Disk / BYOC como WarpStream**: eliminan por completo los discos locales en los brokers y escriben directamente sobre S3 con agentes sin estado (*stateless*) alineados por zona de disponibilidad, eliminando el 100% del costo de red Cross-AZ y permitiendo retención infinita a precio de S3 (~$0.023/GB-mes). Además, **Tableflow** materializa automáticamente cualquier tópico Kafka como tabla **Apache Iceberg v3** lista para consultar.',
      },
    ],
    triadPerspectives: {
      DE: {
        title: 'Qué construye y opera ingeniería (DE)',
        points: [
          'Despliega conectores Debezium sobre slots de replicación PostgreSQL con monitoreo estricto de `replication_slot_lag` para evitar que un conector detenido llene el disco WAL de producción (configurando `max_slot_wal_keep_size`).',
          'Implementa el patrón Transactional Outbox junto a ingeniería de software y registra esquemas Avro/Protobuf en Schema Registry con compatibilidad `BACKWARD_TRANSITIVE`.',
          'Adopta colas Zero-Disk (WarpStream) o Kafka Tiered Storage con compactación automática hacia Apache Iceberg v3 (Deletion Vectors para eventos `op = "d"`).',
        ],
      },
      DA: {
        title: 'Qué analiza y modela análisis (DA)',
        points: [
          'Aprovecha los payloads `before` y `after` del flujo CDC para reconstruir cada transición de estado (`PENDING → PAID → REFUNDED`) y medir tiempos exactos de ciclo operativo.',
          'Audita que los eventos de borrado (`op = "d"`) y los tombstones se reflejen como bajas lógicas o ajustes contables en Silver, evitando que pedidos cancelados inflen el LTV.',
          'Cuantifica el valor económico real de la latencia (ej. cuánto fraude adicional se detiene al bajar de 15 minutos a 500 ms) antes de aprobar un proyecto de streaming.',
        ],
      },
      BI: {
        title: 'Qué gobierna y visualiza BI',
        points: [
          'Separa claramente los **Tableros Operativos en Vivo** (monitoreo de pasarelas, inventario minuto a minuto) de los **Tableros Financieros Auditados** (que consumen snapshots cerrados de Iceberg).',
          'Muestra en la cabecera del dashboard un indicador explícito de frescura y salud del pipeline CDC (`Latencia extremo a extremo: 1.8 s · Último evento WAL recibido`).',
          'Garantiza que las métricas de la Capa Semántica excluyan registros marcados como eliminados (`_cdc_deleted = true`) en las tablas Merge-on-Read.',
        ],
      },
    },
    relatedLessons: [
      { id: 'l17-flink-watermarks-mv', reason: 'Una vez que los eventos CDC están en Kafka/WarpStream, aprende a procesarlos en ventanas temporales con Flink y Watermarks.' },
      { id: 'l10-iceberg-v3-medallion', reason: 'Descubre cómo los eventos de cambio CDC aterrizan en tablas Apache Iceberg v3 usando Deletion Vectors.' },
    ],
    playground: {
      description: 'Compara el antipatrón de hacer polling SQL por `updated_at` contra el procesamiento idempotente de un flujo CDC de Debezium (con soporte de `INSERT`, `UPDATE` y `DELETE`):',
      badQueryLabel: 'Antipatrón: consulta periódica por updated_at ciega a borrados',
      badQuery: `-- MAL: Consulta repetitiva cada 30s sobre la base OLTP de producción.
-- 1) No detecta filas borradas con DELETE FROM orders WHERE order_id = 'ORD-88'
-- 2) Pierde todas las transiciones intermedias de estado
SELECT
  order_id,
  customer_id,
  order_status,
  amount_usd,
  updated_at
FROM prod_oltp.public.orders
WHERE updated_at >= NOW() - INTERVAL '30 seconds';`,
      badResult: [
        {
          impacto_oltp: 'CPU Postgres al 92% en hora pico',
          ordenes_borradas: 'Ignoradas ($210K fantasma en BI)',
          estados_intermedios: 'Perdidos (Solo ve el último estado)',
        },
      ],
      goodQueryLabel: 'Solución óptima: flujo CDC de Debezium hacia Iceberg v3',
      goodQuery: `-- EXCELENTE: Consumir el log CDC de Debezium (op: 'c'=create, 'u'=update, 'd'=delete)
-- y aplicar MERGE idempotente en Apache Iceberg v3 usando el LSN (Log Sequence Number)
WITH latest_cdc_per_key AS (
  SELECT
    COALESCE(after.order_id, before.order_id) AS order_id,
    after.customer_id,
    after.order_status,
    after.amount_usd,
    op AS cdc_operation,
    source.lsn AS wal_lsn
  FROM bronze.debezium_orders_cdc
  WHERE ingested_date = CURRENT_DATE
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY COALESCE(after.order_id, before.order_id)
    ORDER BY source.lsn DESC
  ) = 1
)
MERGE INTO silver.orders_current t
USING latest_cdc_per_key s ON t.order_id = s.order_id
WHEN MATCHED AND s.cdc_operation = 'd' THEN DELETE
WHEN MATCHED THEN UPDATE SET
  order_status = s.order_status, amount_usd = s.amount_usd, last_wal_lsn = s.wal_lsn
WHEN NOT MATCHED AND s.cdc_operation <> 'd' THEN INSERT
  (order_id, customer_id, order_status, amount_usd, last_wal_lsn)
  VALUES (s.order_id, s.customer_id, s.order_status, s.amount_usd, s.wal_lsn);`,
      goodResult: [
        {
          impacto_oltp: '<1% CPU (Lectura secuencial WAL)',
          ordenes_borradas: 'Eliminadas al instante vía Deletion Vector',
          exactitud_financiera: '100% Reconciliada con base primaria',
        },
      ],
    },
    codeChallenge: {
      title: 'Consolidación de eventos CDC con Debezium',
      instruction:
        'Completa la consulta que consolida un lote de eventos CDC de Debezium (`op` en `"c"`, `"u"`, `"d"`). Cuando un registro se borra (`op = "d"`), el objeto `after` viene en `NULL` y la clave primaria solo existe en `before.order_id`. Debes extraer la clave de forma segura, ordenar por el número de secuencia del log (`source_lsn DESC`) y filtrar los registros eliminados en la vista activa.',
      templateCode: `WITH ranked_cdc AS (
  SELECT
    {{b1}} AS order_id,
    after_customer_id AS customer_id,
    after_amount_usd AS amount_usd,
    op,
    source_lsn
  FROM bronze.orders_cdc_stream
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY COALESCE(after_order_id, before_order_id)
    ORDER BY {{b2}}
  ) = 1
)
SELECT
  order_id,
  customer_id,
  amount_usd,
  source_lsn
FROM ranked_cdc
WHERE {{b3}};`,
      blanks: [
        {
          id: 'b1',
          placeholder: 'Extraer order_id incluso en eventos DELETE',
          acceptedAnswers: [
            'COALESCE(after_order_id, before_order_id)',
            'IFNULL(after_order_id, before_order_id)',
          ],
          hint: 'En un `DELETE` (`op = "d"`), `after_order_id` es `NULL`, por lo que debes usar `COALESCE` con `before_order_id`.',
        },
        {
          id: 'b2',
          placeholder: 'Ordenar por secuencia exacta del WAL',
          acceptedAnswers: ['source_lsn DESC', 'source_lsn desc'],
          hint: 'El `source_lsn` (Log Sequence Number de Postgres) garantiza el orden estricto de confirmación transaccional; quédate con el más reciente (`DESC`).',
        },
        {
          id: 'b3',
          placeholder: 'Excluir órdenes eliminadas en el origen',
          acceptedAnswers: ["op <> 'd'", "op IN ('c', 'u', 'r')"],
          hint: 'Filtra las filas cuya última operación en el log no fue un borrado (`op <> \'d\'`).',
        },
      ],
      expectedOutputTable: [
        {
          order_id: 'ORD-501',
          customer_id: 'CUST-19',
          amount_usd: '$180.00',
          source_lsn: 94810244,
        },
        {
          order_id: 'ORD-503',
          customer_id: 'CUST-42',
          amount_usd: '$450.00',
          source_lsn: 94810299,
        },
      ],
      rubricCriteria: [
        'Extrae la clave primaria usando `COALESCE(after_id, before_id)` para no perder el identificador en eventos `DELETE`.',
        'Ordena por el número de secuencia transaccional del log (`source_lsn DESC`) en lugar de relojes de ingesta inexactos.',
        'Filtra o aplica correctamente los eventos `op = "d"` para evitar registros fantasma en Analytics y BI.',
      ],
    },
    pipelineChallenge: {
      title: 'Captura CDC con patrón outbox e Iceberg',
      scenario:
        'Ordena los 5 pasos arquitectónicos para capturar transacciones de un microservicio de pagos hacia analítica en tiempo real sin golpear la base de datos con queries pesados ni sufrir pérdida de mensajes por Dual-Write.',
      steps: [
        {
          id: 'cdc-1',
          label: '1. Escritura atómica en tabla de negocio y tabla transactional outbox en Postgres',
          role: 'DE',
          detail: 'El microservicio inserta la orden y el evento tipado dentro de la misma transacción ACID local, evitando el antipatrón Dual-Write.',
        },
        {
          id: 'cdc-2',
          label: '2. Captura secuencial del WAL con conector Debezium y registro de esquemas',
          role: 'DE',
          detail: 'Debezium lee el Write-Ahead Log binario sin ejecutar SELECTs costosos y valida el esquema contra el contrato ODCS.',
        },
        {
          id: 'cdc-3',
          label: '3. Transporte en tópico particionado por clave en WarpStream o Kafka',
          role: 'DE',
          detail: 'Los eventos viajan particionados por `order_id` garantizando el orden estricto de estados sobre almacenamiento S3 Zero-Disk.',
        },
        {
          id: 'cdc-4',
          label: '4. Compactación MERGE y vectores de borrado en Apache Iceberg v3 (Silver)',
          role: 'DA',
          detail: 'Se deduplica por LSN preservando la tabla de historial completo de transiciones (`order_state_transitions`) y la tabla de estado actual.',
        },
        {
          id: 'cdc-5',
          label: '5. Exposición de métricas reconciliadas e indicador de latencia en BI',
          role: 'BI',
          detail: 'El dashboard financiero consume la Capa Semántica libre de órdenes borradas y muestra el SLA de frescura del flujo CDC.',
        },
      ],
      explanation:
        'El patrón Transactional Outbox + Debezium WAL + Kafka/WarpStream + Iceberg v3 garantiza que cada transacción comprometida en producción llegue exactamente en orden al Lakehouse y a BI, incluyendo borrados físicos y sin degradar el checkout.',
    },
    checkpoint: {
      question:
        'Un equipo de ingeniería de datos usa Debezium sobre PostgreSQL en producción, pero un viernes detienen el consumidor de Kafka durante 48 horas por mantenimiento sin borrar ni monitorear el Replication Slot de Postgres. ¿Cuál es el riesgo crítico en producción y cómo se previene?',
      options: [
        {
          id: 'a',
          text: 'PostgreSQL retendrá todos los archivos WAL en disco esperando a que el slot de replicación de Debezium los confirme, llenando el disco del servidor primario hasta causar una caída total de la base de datos; se previene configurando alertas de `replication_slot_lag` y el parámetro `max_slot_wal_keep_size`.',
          correct: true,
          feedback:
            'Exacto. Este es el incidente #1 de producción con CDC en PostgreSQL: un slot de replicación inactivo impide que Postgres recicle los segmentos WAL. Configurar `max_slot_wal_keep_size` y alertas de lag protege la disponibilidad del sistema OLTP.',
        },
        {
          id: 'b',
          text: 'No ocurre absolutamente nada; PostgreSQL guarda los archivos WAL en la memoria RAM del navegador del analista de BI.',
          correct: false,
          feedback:
            'Los segmentos WAL se almacenan en el disco del servidor primario de PostgreSQL hasta que todos los slots de replicación activos los consumen.',
        },
        {
          id: 'c',
          text: 'Debezium borrará automáticamente todas las tablas de clientes en PostgreSQL si pasa más de 1 hora desconectado.',
          correct: false,
          feedback:
            'Debezium solo tiene permisos de lectura de replicación; nunca borra tablas en el origen, pero su slot inactivo sí bloquea la limpieza del WAL si no se limita.',
        },
      ],
    },
  },
  {
    id: 'l17-flink-watermarks-mv',
    stageId: 'stage-6',
    order: 17,
    title: 'Tiempo de evento y watermarks en Flink',
    subtitle: 'Manejo de eventos desordenados, ventanas temporales con estado acotado y vistas materializadas.',
    duration: '30 min',
    level: 'Avanzado',
    bloomLevel: 'apply',
    coreFocus: ['DE', 'DA', 'BI'],
    goal: 'Aplicar semántica de Event Time y Watermarks en Apache Flink / Arroyo, dimensionar ventanas temporales y Joins de intervalo con State TTL acotado, y servir vistas materializadas en streaming (Materialize / RisingWave / ClickHouse) hacia tableros BI operativos.',
    visualType: 'streaming-watermark-lab',
    storyContext:
      'Caso real en AeroMobility: Un pasajero compra un pase en la app móvil a las **11:59:42** justo cuando su tren entra en un túnel subterráneo sin cobertura 5G. A las **12:03:10** el tren sale a la superficie y el teléfono sincroniza el evento con el servidor. El tablero en tiempo real que agrupaba por hora de llegada al servidor (**Processing Time**) reportó una caída falsa del 18% a las 11:59 y disparó una alerta de PagerDuty. Además, el trabajo de Flink que hacía un `LEFT JOIN` entre impresiones de anuncios y clics sin límite de tiempo agotó los 64 GB de disco RocksDB y colapsó a los 4 días.',
    sections: [
      {
        heading: 'Tiempo de evento frente a tiempo de procesamiento: completitud y latencia',
        body: 'En cualquier sistema distribuido existen dos relojes fundamentalmente distintos:\n- **Event Time**: el instante exacto en que ocurrió el hecho físico en el dispositivo o pasarela de origen (grabado dentro del payload JSON/Protobuf, ej. `event_ts = 11:59:42`).\n- **Processing Time**: el instante según el reloj de pared de la máquina que ejecuta el motor de streaming cuando procesa el mensaje (`proc_ts = 12:03:10`).\nAgrupar por **Processing Time** es trivial pero analíticamente falso: cualquier congestión de red, lote móvil offline o reintento de un microservicio deforma las series temporales. Agrupar por **Event Time** garantiza que los resultados sean **deterministas y reproducibles** (incluso si reprocesas un mes histórico de Kafka a 10x de velocidad, cada minuto tendrá exactamente las mismas ventas).',
      },
      {
        heading: 'Funcionamiento de watermarks, tolerancia de retraso y salidas laterales',
        body: 'Si agrupas por `Event Time` en ventanas de 1 minuto (`11:59:00` a `12:00:00`) y los eventos llegan desordenados, ¿cuándo sabe **Apache Flink** o **Arroyo (motor de streaming en Rust)** que ya puede cerrar la ventana de las `11:59` y emitir el resultado?\nMediante un **Watermark (Marca de Agua)**: un reloj lógico monotónicamente creciente que fluye dentro del stream declarando `W(t) = max(event_time_observado) - tolerancia`. Si defines `WATERMARK FOR event_time AS event_time - INTERVAL \'30\' SECOND`, cuando llega un evento con hora `12:00:30`, el Watermark avanza a `12:00:00` y cierra la ventana `11:59–12:00`.\n¿Y si un evento llega con 4 minutos de retraso cuando la ventana ya cerró? Tienes dos mecanismos:\n1) **Allowed Lateness**: mantiene el estado de la ventana vivo un margen extra y emite una actualización de retracción/refinamiento (`upsert`).\n2) **Side Output / Dead-Letter Stream**: desvía los eventos extremadamente tardíos a una tabla de auditoría en Iceberg para reconciliación al cierre del día.',
      },
      {
        heading: 'Ventanas temporales y control del tamaño del estado mediante TTL en RocksDB',
        body: 'En streaming SQL operamos tres tipos principales de ventanas:\n- **Tumbling (Fijas sin solapamiento)**: ej. cada 1 minuto exacto (`12:00-12:01`, `12:01-12:02`). Cada evento pertenece a una sola ventana.\n- **Hopping / Sliding (Deslizantes con solapamiento)**: ej. ventana de 10 minutos que se actualiza cada 1 minuto (ideal para medias móviles suaves de detección de anomalías).\n- **Session (Por inactividad del usuario)**: se cierra cuando pasan *N* minutos sin eventos del mismo `user_id`.\n**Peligro crítico en producción**: Si escribes un `JOIN` normal entre dos streams (`FROM ad_impressions i JOIN ad_clicks c ON i.imp_id = c.imp_id`) sin acotar el tiempo, Flink debe guardar cada impresión en su backend de estado (**RocksDB / SlateDB**) **por completo** por si el clic llega dentro de 3 años. El estado crecerá sin límite hasta reventar el disco. **Solución obligatoria**: usa siempre **Interval Joins** (`AND c.click_ts BETWEEN i.imp_ts AND i.imp_ts + INTERVAL \'30\' MINUTE`) o configura `table.exec.state.ttl` para purgar automáticamente el estado antiguo.',
      },
      {
        heading: 'Mantenimiento incremental de vistas materializadas en Materialize y RisingWave',
        body: 'Tradicionalmente, para mostrar un dashboard en vivo había que escribir complejo código Java/Scala en Flink y volcar los resultados a Redis o PostgreSQL. En producción han madurado dos patrones mucho más ágiles para conectar DE, DA y BI:\n1) **Motores de Vistas Materializadas en Streaming (Materialize — basado en Timely/Differential Dataflow — y RisingWave)**: Te permiten escribir una consulta SQL estándar con joins complejos y funciones de ventana (`CREATE MATERIALIZED VIEW mv_live_funnel AS SELECT ...`). El motor mantiene el resultado incrementalmente en memoria a medida que llegan cambios por CDC desde Kafka, actualizando el dashboard en `<50 ms`.\n2) **OLAP en Tiempo Real (ClickHouse / Apache Pinot) + Rill**: Ingesta directa desde Kafka hacia tablas columnares ultra-rápidas para exploración interactiva sub-segundo.',
      },
    ],
    triadPerspectives: {
      DE: {
        title: 'Qué diseña y protege ingeniería (DE)',
        points: [
          'Enfoca los pipelines de Flink/Arroyo en garantías `Exactly-Once` extremo a extremo mediante Checkpoints asíncronos (Chandy-Lamport) y estado desagregado en S3.',
          'Prohíbe en revisión de código cualquier `Regular Join` o agregación sin ventana en streaming a menos que tenga un `Interval Join` explícito o un `State TTL` configurado.',
          'Configura `table.exec.source.idle-timeout` para que una partición de Kafka silenciosa no congele el avance global del Watermark de todo el trabajo.',
        ],
      },
      DA: {
        title: 'Qué investiga y calibra análisis (DA)',
        points: [
          'Estudia empíricamente el histograma de `ingested_at - event_time` (distribución de retraso por país y versión de app) para elegir el percentil p99.5 como umbral óptimo del Watermark.',
          'Diseña ventanas de sesión (`SESSION`) para modelar el comportamiento real de navegación del usuario sin depender de cortes arbitrarios a medianoche.',
          'Reconcilia diariamente las métricas emitidas en baja latencia contra el cierre completo en Apache Iceberg para medir el % de eventos ultra-tardíos.',
        ],
      },
      BI: {
        title: 'Qué construye y comunica BI',
        points: [
          'Consume vistas materializadas incrementales desde **Materialize** o **ClickHouse** usando el protocolo estándar de PostgreSQL sin lanzar consultas pesadas que recalculen desde cero.',
          'Distingue visualmente en las gráficas de líneas los minutos ya **cerrados por el Watermark** (línea sólida) del minuto **en curso aún abierto** (línea punteada), evitando que el usuario piense que el último minuto se desplomó.',
          'Implementa alertas operativas automáticas basadas en ventanas deslizantes (Hopping Windows) libres de falsos positivos por retrasos de red.',
        ],
      },
    },
    relatedLessons: [
      { id: 'l16-cdc-kafka-streaming', reason: 'Revisa cómo Debezium y Kafka/WarpStream alimentan de eventos con baja latencia a Flink y Materialize.' },
      { id: 'l2-window-functions', reason: 'Compara las Window Functions analíticas sobre tablas estáticas con las ventanas Tumbling y Hopping sobre flujos infinitos.' },
    ],
    playground: {
      description: 'Compara un Join y agrupación en streaming mal diseñados (reloj de servidor + estado infinito que explota la RAM/Disco) frente a Flink SQL con Event Time, Watermark e Interval Join acotado:',
      badQueryLabel: 'Antipatrón: tiempo de procesamiento y join sin límite temporal',
      badQuery: `-- PELIGRO EN PRODUCCIÓN:
-- 1) Usa PROCTIME() (distorsiona métricas cuando la red móvil se retrasa)
-- 2) Hace un JOIN abierto entre impresiones y clics sin rango de tiempo:
--    Flink guardará cada impresión en RocksDB por completo hasta agotar el disco (OOM).
SELECT
  TUMBLE_START(i.proc_time, INTERVAL '5' MINUTE) AS window_start,
  i.campaign_id,
  COUNT(DISTINCT i.impression_id) AS impressions,
  COUNT(DISTINCT c.click_id) AS clicks
FROM ad_impressions i
LEFT JOIN ad_clicks c ON i.impression_id = c.impression_id
GROUP BY TUMBLE(i.proc_time, INTERVAL '5' MINUTE), i.campaign_id;`,
      badResult: [
        {
          estado_rocksdb: 'Crece +40 GB/día sin límite → Crash en día 4',
          precision_temporal: 'Sesgada por retrasos de red móvil',
          alerta_pagerduty: 'Falsos positivos en cada micro-corte',
        },
      ],
      goodQueryLabel: 'Solución óptima: tiempo de evento, watermark y join acotado',
      goodQuery: `-- EXCELENTE: Define Watermarks por Event Time y acota el JOIN a una ventana de 15 min
-- para que Flink/Arroyo limpie automáticamente el estado de RocksDB tras vencer el intervalo.
CREATE TABLE ad_impressions (
  impression_id STRING,
  campaign_id STRING,
  imp_ts TIMESTAMP(3),
  WATERMARK FOR imp_ts AS imp_ts - INTERVAL '30' SECOND
) WITH ('connector' = 'kafka', 'topic' = 'ads.impressions');

CREATE TABLE ad_clicks (
  click_id STRING,
  impression_id STRING,
  click_ts TIMESTAMP(3),
  WATERMARK FOR click_ts AS click_ts - INTERVAL '30' SECOND
) WITH ('connector' = 'kafka', 'topic' = 'ads.clicks');

SELECT
  window_start,
  window_end,
  i.campaign_id,
  COUNT(i.impression_id) AS impressions,
  COUNT(c.click_id) AS attributed_clicks_15m
FROM TABLE(
  TUMBLE(TABLE ad_impressions, DESCRIPTOR(imp_ts), INTERVAL '5' MINUTE)
) i
LEFT JOIN ad_clicks c
  ON i.impression_id = c.impression_id
  AND c.click_ts BETWEEN i.imp_ts AND i.imp_ts + INTERVAL '15' MINUTE
GROUP BY window_start, window_end, i.campaign_id;`,
      goodResult: [
        {
          estado_rocksdb: 'Estable en 1.8 GB (Purgado automático a los 15m30s)',
          precision_temporal: '100% Determinista por Event Time',
          latencia_emision: 'Sub-segundo tras cierre de Watermark',
        },
      ],
    },
    codeChallenge: {
      title: 'Ventanas por tiempo de evento en Flink',
      instruction:
        'Completa la definición en Flink SQL para procesar órdenes (`orders_stream`) y pagos (`payments_stream`) en tiempo real: 1) Declara un Watermark con tolerancia de 20 segundos de retraso sobre `order_ts`; 2) Aplica una ventana fija (`TUMBLE`) de 1 minuto sobre `order_ts`; 3) Acota el `LEFT JOIN` para que el pago ocurra entre `order_ts` y `order_ts + INTERVAL \'10\' MINUTE`, evitando que el estado crezca infinitamente.',
      templateCode: `CREATE TABLE orders_stream (
  order_id STRING,
  region STRING,
  order_ts TIMESTAMP(3),
  {{b1}} FOR order_ts AS order_ts - INTERVAL '20' SECOND
) WITH ('connector' = 'kafka', 'topic' = 'commerce.orders');

SELECT
  window_start,
  window_end,
  o.region,
  COUNT(o.order_id) AS total_orders,
  COUNT(p.payment_id) AS paid_within_10m
FROM TABLE(
  {{b2}}(TABLE orders_stream, DESCRIPTOR(order_ts), INTERVAL '1' MINUTE)
) o
LEFT JOIN payments_stream p
  ON o.order_id = p.order_id
  AND p.pay_ts {{b3}} o.order_ts AND o.order_ts + INTERVAL '10' MINUTE
GROUP BY window_start, window_end, o.region;`,
      blanks: [
        {
          id: 'b1',
          placeholder: 'Palabra clave para definir la marca de agua',
          acceptedAnswers: ['WATERMARK', 'watermark'],
          hint: 'En Flink SQL la cláusula en el DDL que define la tolerancia al desorden es `WATERMARK FOR col AS ...`.',
        },
        {
          id: 'b2',
          placeholder: 'Función de ventana fija sin solapamiento',
          acceptedAnswers: ['TUMBLE', 'tumble'],
          hint: 'Usa la Table-Valued Function (TVF) `TUMBLE` para dividir el tiempo en cubetas fijas de 1 minuto.',
        },
        {
          id: 'b3',
          placeholder: 'Operador de rango temporal acotado',
          acceptedAnswers: ['BETWEEN', 'between'],
          hint: 'Usa `BETWEEN` para transformar un Join infinito en un Interval Join con limpieza automática de estado.',
        },
      ],
      expectedOutputTable: [
        {
          window_start: '2026-10-28 12:00:00',
          window_end: '2026-10-28 12:01:00',
          region: 'LATAM',
          total_orders: 412,
          paid_within_10m: 398,
        },
        {
          window_start: '2026-10-28 12:00:00',
          window_end: '2026-10-28 12:01:00',
          region: 'EMEA',
          total_orders: 285,
          paid_within_10m: 279,
        },
      ],
      rubricCriteria: [
        'Declara explícitamente la estrategia `WATERMARK FOR ...` basada en la marca de tiempo real del suceso (`Event Time`).',
        'Utiliza sintaxis moderna de Table-Valued Functions (`TABLE(TUMBLE(...))`) para agrupaciones de ventana.',
        'Acota los Joins entre flujos con predicados `BETWEEN` para permitir el descarte automático de estado antiguo en RocksDB.',
      ],
    },
    pipelineChallenge: {
      title: 'Flujo de baja latencia con watermarks',
      scenario:
        'Secuencia los 5 pasos para construir un sistema de detección y monitoreo operativo en vivo que tolere retrasos de conectividad móvil sin generar alertas falsas ni agotar la memoria del clúster.',
      steps: [
        {
          id: 'flk-1',
          label: '1. Análisis estadístico de la distribución de retraso (lateness p99)',
          role: 'DA',
          detail: 'DA mide la diferencia `ingested_at - event_time` en datos históricos y determina que el 99.4% de los eventos llegan en menos de 25 segundos.',
        },
        {
          id: 'flk-2',
          label: '2. Asignación de tiempo de evento, watermark e idle-timeout en Flink',
          role: 'DE',
          detail: 'DE configura el Watermark basado en el análisis de DA y activa `source.idle-timeout` para que particiones con poco tráfico no detengan el reloj.',
        },
        {
          id: 'flk-3',
          label: '3. Ejecución de ventanas y joins acotados con estado en RocksDB',
          role: 'DE',
          detail: 'El motor agrega los flujos garantizando semántica Exactly-Once y expira automáticamente el estado una vez superado el Watermark.',
        },
        {
          id: 'flk-4',
          label: '4. Doble salida hacia vista materializada caliente y archivo en Iceberg v3',
          role: 'DE',
          detail: 'Las métricas de segundos alimentan la capa de baja latencia mientras el flujo completo y los eventos tardíos se archivan en Apache Iceberg.',
        },
        {
          id: 'flk-5',
          label: '5. Visualización operativa diferenciando ventanas cerradas frente a ventanas en curso',
          role: 'BI',
          detail: 'BI grafica en línea sólida hasta el último Watermark confirmado y en línea punteada el minuto abierto para evitar falsas alarmas de caída.',
        },
      ],
      explanation:
        'Un pipeline de streaming exitoso comienza con DA calibrando matemáticamente el retraso real de red, continúa con DE acotando el estado y los Watermarks en Flink/Arroyo, y culmina con BI presentando con honestidad visual qué ventanas ya están cerradas.',
    },
    checkpoint: {
      question:
        'Tu trabajo de Apache Flink lee un tópico de Kafka con 16 particiones (1 partición por país) y usa `Event Time` con Watermarks. A las 03:00 AM, una isla pequeña en la partición #14 no registra ninguna compra durante 20 minutos, y notas que Flink deja de emitir resultados para los otros 15 países que sí tienen miles de ventas por minuto. ¿Por qué ocurre esto y cuál es la solución técnica?',
      options: [
        {
          id: 'a',
          text: 'En Flink, el Watermark de un operador downstream avanza al MÍNIMO de los Watermarks de todas sus particiones de entrada (`min(W_0, ..., W_15)`). Si la partición #14 está inactiva, su Watermark se queda congelado en el pasado y frena a todo el trabajo; se soluciona activando `withIdleness()` / `table.exec.source.idle-timeout` para excluir temporalmente particiones silenciosas.',
          correct: true,
          feedback:
            'Brillante. El progreso del Watermark sigue al canal más lento para garantizar completitud. Marcar una fuente como `Idle` tras unos segundos sin tráfico permite que las otras 15 particiones sigan cerrando ventanas con normalidad.',
        },
        {
          id: 'b',
          text: 'Flink avanza el Watermark usando el MÁXIMO de las particiones, por lo que una partición vacía acelera el reloj al infinito.',
          correct: false,
          feedback:
            'Es al revés: Flink toma el mínimo de los canales de entrada para no cerrar ventanas antes de que una partición rezagada termine de entregar sus datos.',
        },
        {
          id: 'c',
          text: 'Es un límite físico de Kafka: si una partición no recibe mensajes, los brokers borran las otras 15 particiones.',
          correct: false,
          feedback:
            'Kafka mantiene cada partición de forma independiente; el bloqueo ocurre en el reloj lógico de Watermarks del motor de procesamiento si no se configura detección de inactividad.',
        },
      ],
    },
  },
  {
    id: 'l18-mcp-semantic-ai-rag',
    stageId: 'stage-6',
    order: 18,
    title: 'Servidores MCP, capa semántica y RAG híbrido',
    subtitle: 'Conexión de agentes de lenguaje a métricas gobernadas, búsqueda léxico-vectorial y evaluación sistemática.',
    duration: '35 min',
    level: 'Frontera 2026',
    bloomLevel: 'create',
    coreFocus: ['DE', 'DA', 'BI'],
    goal: 'Diseñar una arquitectura de Agentes de Datos en producción usando Model Context Protocol (MCP) conectado a la Capa Semántica, implementar búsqueda híbrida (BM25 + Vectores HNSW con Reciprocal Rank Fusion) sobre esquemas y documentos, aplicar guardrails de seguridad SQLGlot AST y certificar la precisión con un conjunto de Golden Evals.',
    visualType: 'mcp-semantic-vs-raw-sql',
    storyContext:
      'Caso real en Finanzas Globales 2026: En 2024, la empresa conectó un LLM directamente a las 450 tablas crudas de su almacén de datos ("Text-to-SQL ingenuo"). Cuando la CFO preguntó *"¿Cuál fue la Retención Neta de Ingresos (NRR) del segmento Enterprise en Q3?"*, el modelo escribió un `JOIN` directo entre `raw.users` y `raw.invoices` sin filtrar facturas anuladas ni cuentas de prueba, provocando un Fan-Out y respondiendo con total seguridad: **184.2%** (el valor real auditado era **116.4%**). En producción, el equipo rediseñó la arquitectura usando un **Servidor MCP conectado a la Capa Semántica** y un arnés de **Golden Evals**, llevando la exactitud matemática al **99.4%**.',
    sections: [
      {
        heading: 'Limitaciones de la generación directa de SQL frente al uso de una capa semántica',
        body: 'Pedirle a un LLM que escriba SQL desde cero sobre cientos de tablas físicas crudas falla en producción por tres razones estructurales:\n1) **Ambigüedad de Esquema**: En una empresa real existen tablas llamadas `orders`, `orders_v2`, `OrdersFinal` y `stg_orders_clean`. Sin gobernanza, el modelo elige al azar.\n2) **Reglas de Negocio Implícitas**: Saber que para calcular ingresos netos hay que filtrar `status NOT IN (\'CANCELLED\', \'TEST\')`, excluir empleados internos y usar la tasa de cambio `ASOF JOIN` del momento del cobro no está escrito en los tipos de columna `VARCHAR/NUMERIC`.\n3) **Joins Asimétricos (Fan-Out)**: Un LLM tiende a encadenar `LEFT JOIN` entre tablas de diferente granularidad multiplicando sumas.\nLa solución en 2026 es **Text-to-Semantic-Layer**: el agente IA no inventa `JOINs` ni fórmulas matemáticas; traduce la pregunta del usuario a una llamada estructurada contra la **Capa Semántica (MetricFlow / Cube)** indicando `metrics: ["net_revenue_retention_pct"]`, `dimensions: ["customer__segment"]`, y el compilador determinista de la Capa Semántica genera el SQL garantizado.',
      },
      {
        heading: 'Arquitectura de un servidor MCP conectado al catálogo y al motor semántico',
        body: 'El **Model Context Protocol (MCP)** es el estándar abierto universal que conecta clientes de IA (Google AI Ultra, Gemini CLI, Antigravity, IDEs y aplicaciones corporativas) con servidores de contexto y herramientas.\nUn **Servidor MCP de Datos** bien diseñado por DE, DA y BI expone tres primitivas limpias:\n- **Resources (Recursos de solo lectura)**: el catálogo de contratos ODCS, el glosario de métricas certificadas y el linaje de OpenLineage.\n- **Tools (Herramientas ejecutables con esquema JSON estricto)**:\n  1) `search_catalog_hybrid(query)`: busca tablas, columnas y métricas relevantes.\n  2) `query_semantic_metrics(metrics, group_by, where, limit)`: consulta la Capa Semántica con validación determinista.\n  3) `execute_guarded_sql(sql)`: para exploración ad-hoc de DA sobre la capa Silver, protegido por un **parser AST (`SQLGlot`)** que rechaza cualquier sentencia que no sea `SELECT`, inyecta un `LIMIT` máximo, prohíbe acceder a columnas PII y verifica el presupuesto de bytes escaneados antes de tocar el motor.',
      },
      {
        heading: 'Recuperación híbrida de contexto: búsqueda léxica BM25, vectorial HNSW y fusión RRF',
        body: 'Cuando una organización tiene 2,500 métricas, 800 modelos en dbt/SQLMesh y miles de documentos de reglas de negocio, no caben ni deben meterse todos en cada prompt. Necesitas recuperar solo los 5–10 elementos relevantes (**Retrieval-Augmented Generation — RAG**).\nSin embargo, usar **únicamente búsqueda vectorial por embeddings** falla estrepitosamente en ingeniería de datos: un embedding denso entiende que *"cancelación de clientes"* se parece a *"churn"*, pero confunde códigos exactos como `SKU-9941-B`, nombres técnicos de columnas como `fct_mrr_net_v3` o siglas internas.\nLa arquitectura estándar en producción (ejecutable directamente en **DuckDB** con `fts` + `vss` o en formato columnar **Lance**) es la **Búsqueda Híbrida con Reciprocal Rank Fusion (RRF)**:\n$$\\text{RRF\\_Score}(d) = \\frac{1}{k + \\text{rank}_{\\text{BM25}}(d)} + \\frac{1}{k + \\text{rank}_{\\text{Vector}}(d)}$$\nDonde $k = 60$. Así combinas la precisión quirúrgica de palabras clave (**BM25**) con la comprensión conceptual de vectores (**HNSW**).',
      },
      {
        heading: 'Conjuntos de evaluación deterministas y validación sintáctica de consultas',
        body: 'En 2026, ningún equipo serio despliega un Agente de Datos a producción diciendo *"lo probé con 3 preguntas y se veía bien"*. DA y BI construyen un **Golden Evaluation Dataset (Golden Evals)**: una tabla versionada con 100 a 300 preguntas reales de negocio emparejadas con:\n1) Las métricas y dimensiones semánticas esperadas.\n2) El resultado numérico exacto sobre un snapshot fijo de Apache Iceberg (`FOR SYSTEM_TIME AS OF ...`).\nEn cada Pull Request donde se modifica el prompt del agente, las descripciones de la Capa Semántica o el servidor MCP, el pipeline de CI/CD ejecuta los 200 casos y exige **>98% de Execution Accuracy** y **0 violaciones de seguridad** (incluyendo pruebas de *Indirect Prompt Injection* donde un texto malicioso dentro de una columna de comentarios de clientes intenta engañar al LLM para exfiltrar datos).',
      },
    ],
    triadPerspectives: {
      DE: {
        title: 'Qué construye y blinda Ingeniería de Datos (DE)',
        points: [
          'Construye el Servidor MCP con credenciales de base de datos estrictamente `READ ONLY`, timeouts de 10 segundos y validación sintáctica AST mediante `SQLGlot` (bloqueando `DROP`, `GRANT`, `COPY` o tablas fuera de la lista blanca).',
          'Indexa los metadatos del catálogo, contratos ODCS y documentación en tablas **Lance / DuckDB** con índices híbridos BM25 + HNSW actualizados en cada despliegue de CI/CD.',
          'Aplica políticas de seguridad a nivel de fila (RLS) y enmascaramiento dinámico de PII pasando la identidad del usuario autenticado hasta el motor de consulta.',
        ],
      },
      DA: {
        title: 'Qué diseña y audita Análisis de Datos (DA)',
        points: [
          'Crea y mantiene el benchmark de **Golden Evals** estratificado por dificultad (agregaciones simples, comparativas temporales YoY, cohortes, casos ambiguos que requieren pedir aclaración).',
          'Programa herramientas MCP de verificación estadística para que el agente calcule intervalos de confianza y chequeos de Paradoja de Simpson antes de afirmar por qué subió o bajó un KPI.',
          'Analiza los registros de fallos del agente (*error taxonomy*) para detectar si el fallo vino de una mala recuperación RAG o de una métrica mal documentada.',
        ],
      },
      BI: {
        title: 'Qué gobierna y enriquece Business Intelligence (BI)',
        points: [
          'Enriquece cada métrica y dimensión en la Capa Semántica YAML con `description`, `synonyms` (ej. *"facturación recurrente", "ARR mensual", "MRR"*) y ejemplos de uso: **en 2026, documentar BI es programar el contexto del Agente IA**.',
          'Diseña experiencias de **GenBI Auditable**: cada respuesta del asistente IA en el portal incluye obligatoriamente el badge de la métrica oficial, el bloque SQL compilado desplegable y el enlace al dashboard certificado.',
          'Define barreras semánticas para que el agente nunca sume métricas no aditivas ni mezcle monedas sin conversión oficial.',
        ],
      },
    },
    relatedLessons: [
      { id: 'l12-contracts-semantic-layer', reason: 'La Capa Semántica y los Data Contracts de la Etapa 4 son el cimiento que impide que el Agente MCP alucine métricas.' },
      { id: 'l14-ab-testing-cuped', reason: 'Aplica el mismo rigor estadístico de la Etapa 5 para evaluar cambios en tu agente mediante Golden Evals.' },
    ],
    playground: {
      description: 'Compara el peligro de dejar que un LLM escriba SQL libre sobre tablas crudas frente a un Servidor MCP con validación AST, Búsqueda Híbrida RRF y Capa Semántica:',
      badQueryLabel: 'Peligroso: Text-to-SQL Crudo sin Gobernanza ni Validación AST',
      badQuery: `-- SQL generado a ciegas por un LLM conectado directo al esquema crudo:
-- 1) Une orders con invoices por user_id provocando un Fan-Out masivo (N:M)
-- 2) Olvida excluir cuentas de prueba (is_internal_test = false)
-- 3) Expone emails personales (PII) sin filtro de seguridad
SELECT
  u.email,
  SUM(i.invoice_amount_usd) / SUM(o.order_total_usd) AS nrr_inventado
FROM raw.users u
JOIN raw.orders o ON u.user_id = o.user_id
JOIN raw.invoices i ON u.user_id = i.user_id
WHERE o.created_at >= '2026-07-01'
GROUP BY u.email;`,
      badResult: [
        {
          nrr_reportado: '184.2% (Alucinación grave por Fan-Out N:M)',
          fuga_pii: 'Expuso 14,200 emails sin enmascarar',
          auditabilidad: 'Nula (Cada ejecución inventa un SQL distinto)',
        },
      ],
      goodQueryLabel: 'Estándar Actual: Servidor MCP + Búsqueda Híbrida RRF + Capa Semántica',
      goodQuery: `// 1. El Agente IA consulta el Servidor MCP usando la herramienta gobernada:
const response = await mcpServer.callTool("query_semantic_metrics", {
  metrics: ["net_revenue_retention_pct", "active_paying_customers"],
  dimensions: ["customer__segment"],
  where: "metric_time >= '2026-07-01' AND metric_time < '2026-10-01'",
  order_by: ["-net_revenue_retention_pct"]
});

/* 2. El Servidor MCP valida permisos RLS, invoca MetricFlow/Cube y ejecuta
      el SQL determinista certificado sobre el Snapshot de Apache Iceberg v3: */
-- SQL Compilado y Auditado por SQLGlot AST (Solo Lectura, Cero Fan-Out):
SELECT
  dim_c.segment AS customer__segment,
  ROUND(100.0 * SUM(fct.retained_mrr_usd) / NULLIF(SUM(fct.starting_mrr_usd), 0), 2)
    AS net_revenue_retention_pct,
  COUNT(DISTINCT fct.customer_id) AS active_paying_customers
FROM gold.fct_mrr_retention_monthly fct
JOIN gold.dim_customer_scd2 dim_c
  ON fct.customer_sk = dim_c.customer_sk
WHERE fct.metric_month BETWEEN DATE '2026-07-01' AND DATE '2026-09-01'
  AND dim_c.is_test_account = FALSE
GROUP BY 1;`,
      goodResult: [
        {
          customer__segment: 'Enterprise',
          net_revenue_retention_pct: '116.40% (100% Exacto y Reconciliado)',
          active_paying_customers: 1240,
          linaje_mcp: 'Verificado · Contrato ODCS v3 · Snapshot #814',
        },
      ],
    },
    codeChallenge: {
      title: 'Reto Hybrid RAG en SQL: Reciprocal Rank Fusion (BM25 + Vectores HNSW) para Catálogo MCP',
      instruction:
        'Completa la consulta en DuckDB que implementa el buscador híbrido del Servidor MCP para encontrar las métricas más relevantes del catálogo: combina el ranking léxico exacto (`bm25_rank`) con el ranking semántico vectorial (`vec_rank`) usando la fórmula estándar de **Reciprocal Rank Fusion (RRF)** con constante `60`, une ambos resultados con `FULL OUTER JOIN` para no perder candidatos que aparezcan en un solo índice y ordena por `rrf_score DESC`.',
      templateCode: `WITH lexical_bm25 AS (
  SELECT
    metric_name,
    ROW_NUMBER() OVER (ORDER BY bm25_score DESC) AS bm25_rank
  FROM catalog.metrics_fts_search('nrr retencion neta enterprise')
  LIMIT 25
),
semantic_vector AS (
  SELECT
    metric_name,
    ROW_NUMBER() OVER (ORDER BY array_cosine_distance(embedding, $query_vec) ASC) AS vec_rank
  FROM catalog.metrics_embeddings
  LIMIT 25
)
SELECT
  COALESCE(l.metric_name, s.metric_name) AS metric_name,
  l.bm25_rank,
  s.vec_rank,
  ROUND(
    COALESCE(1.0 / ({{b1}} + l.bm25_rank), 0.0) +
    COALESCE(1.0 / (60 + s.vec_rank), 0.0),
    5
  ) AS rrf_score
FROM lexical_bm25 l
{{b2}} semantic_vector s
  ON l.metric_name = s.metric_name
ORDER BY {{b3}}
LIMIT 5;`,
      blanks: [
        {
          id: 'b1',
          placeholder: 'Constante de suavizado RRF estándar',
          acceptedAnswers: ['60', '60.0'],
          hint: 'En Reciprocal Rank Fusion (`1 / (k + rank)`), la constante estándar `k` que evita que un único #1 domine desproporcionadamente es `60`.',
        },
        {
          id: 'b2',
          placeholder: 'Tipo de JOIN para conservar hallazgos de ambos buscadores',
          acceptedAnswers: ['FULL OUTER JOIN', 'FULL JOIN'],
          hint: 'Una métrica puede aparecer en el top 25 de BM25 (por sigla exacta) o solo en el top 25 vectorial (por sinónimo); usa `FULL OUTER JOIN` para unir ambas listas.',
        },
        {
          id: 'b3',
          placeholder: 'Criterio de ordenamiento final',
          acceptedAnswers: ['rrf_score DESC', 'rrf_score desc', '4 DESC'],
          hint: 'Ordena de mayor a menor puntaje fusionado (`rrf_score DESC`).',
        },
      ],
      expectedOutputTable: [
        {
          metric_name: 'net_revenue_retention_pct',
          bm25_rank: 1,
          vec_rank: 1,
          rrf_score: 0.03279,
        },
        {
          metric_name: 'enterprise_gross_retention_pct',
          bm25_rank: 2,
          vec_rank: 3,
          rrf_score: 0.03200,
        },
        {
          metric_name: 'expansion_mrr_net_usd',
          bm25_rank: 5,
          vec_rank: 2,
          rrf_score: 0.03151,
        },
      ],
      rubricCriteria: [
        'Combina búsqueda léxica (BM25) y búsqueda vectorial (distancia coseno / HNSW) mediante Reciprocal Rank Fusion (`1 / (60 + rank)`).',
        'Utiliza `FULL OUTER JOIN` junto con `COALESCE` para puntuar correctamente documentos presentes en uno o en ambos índices.',
        'Prioriza los resultados con mayor `rrf_score` antes de inyectar las definiciones semánticas en el contexto del Servidor MCP.',
      ],
    },
    pipelineChallenge: {
      title: 'Arquitectura Agente IA + Datos 2026: De la Pregunta en Lenguaje Natural al KPI Certificado',
      scenario:
        'Ordena el flujo de ejecución seguro cuando un directivo o analista realiza una pregunta de negocio al Agente conectado por Model Context Protocol (MCP).',
      steps: [
        {
          id: 'mcp-1',
          label: '1. Recuperación de Contexto con Búsqueda Híbrida (BM25 + HNSW + RRF) vía MCP',
          role: 'DE',
          detail: 'El servidor MCP busca en el catálogo de métricas y contratos ODCS los términos exactos y sinónimos semánticos sin saturar la ventana de contexto.',
        },
        {
          id: 'mcp-2',
          label: '2. Resolución Semántica de Métricas, Dimensiones y Filtros Certificados',
          role: 'BI',
          detail: 'El agente selecciona la métrica gobernada (`net_revenue_retention_pct`) en la Capa Semántica en lugar de adivinar joins sobre tablas crudas.',
        },
        {
          id: 'mcp-3',
          label: '3. Compilación Determinista y Guardrail de Seguridad AST (SQLGlot + RLS)',
          role: 'DE',
          detail: 'El servidor compila el SQL, verifica con SQLGlot que sea estrictamente `SELECT` sin acceso a columnas PII y aplica los permisos del usuario.',
        },
        {
          id: 'mcp-4',
          label: '4. Ejecución sobre Snapshot Reproducible (Iceberg v3) y Chequeo Estadístico',
          role: 'DA',
          detail: 'La consulta corre sobre el Lakehouse devolviendo el resultado exacto junto con el ID de Snapshot y validaciones de tamaño muestral.',
        },
        {
          id: 'mcp-5',
          label: '5. Respuesta Auditable con Linaje y Validación Continua contra Golden Evals',
          role: 'BI',
          detail: 'El usuario recibe el KPI exacto con el código SQL transparente y el sistema registra la traza para el benchmark de Golden Evals.',
        },
      ],
      explanation:
        'Al combinar Búsqueda Híbrida RRF, Capa Semántica, validación AST con SQLGlot y Golden Evals sobre snapshots de Iceberg v3, transformas un LLM probabilístico en un sistema analítico determinista, seguro y 100% auditable.',
    },
    checkpoint: {
      question:
        'Un equipo de seguridad audita tu Servidor MCP de Datos. Notas que el servidor incluye una herramienta `execute_sql(query)` para preguntas exploratorias y que alguien intentó protegerla usando únicamente una expresión regular `if (!query.startsWith("SELECT")) throw Error()` además de escribir en el System Prompt: *"Por favor nunca leas la tabla de salarios ni borres nada"*. ¿Por qué esta defensa es vulnerable y cómo debe implementarse en producción?',
      options: [
        {
          id: 'a',
          text: 'Las instrucciones en el prompt son vulnerables a Prompt Injection y una regex simple puede evadirse con comentarios, CTEs o funciones laterales; en producción se exige defensa en profundidad: credenciales de base de datos nativas de solo lectura con permisos restringidos a vistas autorizadas, Row-Level Security (RLS) y validación del Árbol Sintáctico Abstracto (AST con SQLGlot) que inspeccione cada tabla y columna referenciada.',
          correct: true,
          feedback:
            'Exacto. Un System Prompt jamás es una frontera de seguridad. La seguridad de un Servidor MCP reside en permisos reales de motor (Read-Only + vistas gobernadas + RLS), parseo AST estricto con SQLGlot y límites de recursos.',
        },
        {
          id: 'b',
          text: 'Escribir "POR FAVOR NUNCA BORRES NADA" en mayúsculas dentro del System Prompt garantiza matemáticamente el 100% de seguridad en cualquier motor SQL.',
          correct: false,
          feedback:
            'Un modelo de lenguaje siempre puede ser manipulado mediante Prompt Injection directo o indirecto; la seguridad debe aplicarse de forma determinista fuera del LLM.',
        },
        {
          id: 'c',
          text: 'Basta con ocultar los nombres de las tablas porque ningún LLM puede ejecutar `SELECT * FROM information_schema.tables`.',
          correct: false,
          feedback:
            'La seguridad por oscuridad no protege los datos; una cuenta con permisos excesivos puede listar el catálogo del sistema si no está restringida a nivel de motor y AST.',
        },
      ],
    },
  },
];
