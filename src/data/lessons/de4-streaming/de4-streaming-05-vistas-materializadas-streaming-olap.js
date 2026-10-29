export const lesson = {
  "id": "de4-streaming-05-vistas-materializadas-streaming-olap",
  "moduleId": "de4-streaming",
  "order": 5,
  "title": "Vistas materializadas en streaming y OLAP en vivo",
  "subtitle": "Vistas materializadas en streaming (Materialize, RisingWave) y OLAP en vivo (ClickHouse)",
  "tracks": [
    "de"
  ],
  "level": 4,
  "minutes": 25,
  "prerequisites": [
    "de4-streaming-04-entrega-at-least-once-exactly-once"
  ],
  "contentVersion": 2,
  "needsReview": false,
  "dataset": "Mercado Brisa (empresa ficticia) — tablas stores, orders, payments y refunds",
  "block": "Bloque 4 · Flujos en tiempo real y CDC",
  "badge": "Streaming MV & OLAP",
  "HookType": "Decisión de arquitectura",
  "hook": "La dirección operativa de Mercado Brisa (empresa ficticia) requiere un monitor en vivo con el flujo de caja neto por formato de tienda, descontando al instante cada reembolso procesado. Hoy ejecutan un REFRESH MATERIALIZED VIEW en PostgreSQL cada diez minutos que recalcula desde cero 18 000 pedidos, 19 200 pagos y 1 450 devoluciones, bloqueando las lecturas. ¿Cuándo elegir una vista materializada en streaming como Materialize o RisingWave frente a un motor OLAP como ClickHouse?",
  "objectives": [
    "Explicar cómo el mantenimiento incremental de vistas (IVM) en Materialize y RisingWave propaga deltas de inserción (+1) y retracción (-1) sin reescanear las tablas base.",
    "Contrastar las vistas materializadas de un motor de streaming con las tablas ReplacingMergeTree y AggregatingMergeTree de ClickHouse y sus fusiones asíncronas.",
    "Prevenir la explosión de filas (fan-out) en agregaciones continuas preagregando reembolsos y deduplicando pagos antes del cruce con dimensiones.",
    "Integrar en SQL los flujos de stores, orders, payments y refunds de Mercado Brisa como entregable del proyecto de módulo de4-streaming."
  ],
  "sections": [
    {
      "heading": "Mantenimiento incremental de vistas (IVM) en Materialize y RisingWave",
      "body": "En una base relacional clásica o en un almacén por lotes, una vista materializada se refresca ejecutando `REFRESH MATERIALIZED VIEW`. Esa operación vuelve a escanear las tablas base desde cero. En cambio, motores como **Materialize** (basado en *Differential Dataflow*) y **RisingWave** (con estado sobre almacenamiento de objetos Hummock/S3) compilan `CREATE MATERIALIZED VIEW` en un grafo de flujo continuo.\n\nAmbos sistemas aplican **mantenimiento incremental de vistas** (*Incremental View Maintenance*, IVM). Cada evento proveniente de Debezium o Kafka viaja como una tupla con signo `(fila, timestamp_lógico, diff)`. El signo `diff = +1` representa una inserción y `diff = -1` representa una **retracción** (la anulación del estado previo). Cuando un pedido de Mercado Brisa recibe un reembolso, el motor emite una retracción `-1` del acumulado anterior y una adición `+1` con el nuevo neto. Así actualiza joins y agregaciones en milisegundos sin recalcular el historial.",
      "interactive": {
        "component": "streaming-watermark-lab",
        "caption": "Propagación incremental de eventos y cierre de estados en motores de flujo continuo."
      },
      "example": {
        "language": "sql",
        "code": "-- Volumen de devoluciones procesadas en la tabla refunds de Mercado Brisa\nSELECT status,\n       COUNT(*) AS refund_rows,\n       COUNT(DISTINCT order_id) AS affected_orders,\n       ROUND(SUM(refund_amount_usd), 2) AS total_refund_usd\nFROM refunds\nGROUP BY status\nORDER BY total_refund_usd DESC;",
        "expectedOutput": [
          {
            "status": "processed",
            "refund_rows": 1450,
            "affected_orders": 1150,
            "total_refund_usd": 321097.25
          }
        ]
      },
      "id": "de4-streaming-05-vistas-materializadas-streaming-olap-sec-1"
    },
    {
      "heading": "OLAP en vivo en ClickHouse: ReplacingMergeTree y AggregatingMergeTree",
      "body": "**ClickHouse** resuelve la analítica en vivo mediante almacenamiento columnar de inserción rápida. A diferencia de RisingWave o Materialize, una vista materializada incremental en ClickHouse no mantiene un grafo relacional con retracciones automáticas. Funciona como un **disparador en tiempo de inserción** (*insert trigger*). Evalúa su consulta `SELECT` únicamente sobre el bloque de filas recién insertado en la tabla origen y vuelca el resultado en una tabla destino.\n\nPara absorber flujos CDC con actualizaciones o duplicados, ClickHouse ofrece dos motores especializados en la familia MergeTree. Primero, **`ReplacingMergeTree(version_col)`** elimina filas repetidas que comparten la misma clave `ORDER BY`. Sin embargo, ejecuta esa limpieza de forma **asíncrona** durante las fusiones de partes en segundo plano (*background merges*). Por ello, una consulta `SELECT` inmediata puede ver dos versiones de una fila salvo que se deduplique en la consulta o se use `FINAL`. Segundo, **`AggregatingMergeTree`** guarda estados binarios parciales (`sumState`, `countState`) que luego se combinan al leer mediante `sumMerge` y `countMerge`.",
      "example": {
        "language": "sql",
        "code": "-- Vista regional consolidada de pagos capturados netos de reembolsos en Mercado Brisa\nWITH dedup_payments AS (\n  SELECT order_id, amount_usd\n  FROM payments\n  WHERE status = 'captured'\n  QUALIFY ROW_NUMBER() OVER (PARTITION BY idempotency_key ORDER BY payment_ts ASC, payment_id ASC) = 1\n),\norder_refunds AS (\n  SELECT order_id, SUM(refund_amount_usd) AS refunded_usd\n  FROM refunds\n  WHERE status = 'processed'\n  GROUP BY order_id\n)\nSELECT s.region,\n       COUNT(DISTINCT s.store_id) AS stores_count,\n       COUNT(o.order_id) AS captured_orders,\n       ROUND(SUM(p.amount_usd), 2) AS gross_captured_usd,\n       ROUND(COALESCE(SUM(r.refunded_usd), 0), 2) AS processed_refunds_usd,\n       ROUND(SUM(p.amount_usd) - COALESCE(SUM(r.refunded_usd), 0), 2) AS net_revenue_usd\nFROM stores s\nJOIN orders o ON o.store_id = s.store_id\nJOIN dedup_payments p ON p.order_id = o.order_id\nLEFT JOIN order_refunds r ON r.order_id = o.order_id\nGROUP BY s.region\nORDER BY net_revenue_usd DESC;",
        "expectedOutput": [
          {
            "region": "Cono Sur",
            "stores_count": 3,
            "captured_orders": 5401,
            "gross_captured_usd": 2256477.18,
            "processed_refunds_usd": 77991.82,
            "net_revenue_usd": 2178485.36
          },
          {
            "region": "Andina",
            "stores_count": 4,
            "captured_orders": 5400,
            "gross_captured_usd": 2180511.86,
            "processed_refunds_usd": 115379.23,
            "net_revenue_usd": 2065132.63
          },
          {
            "region": "Iberia",
            "stores_count": 3,
            "captured_orders": 3085,
            "gross_captured_usd": 1482611.35,
            "processed_refunds_usd": 43170.94,
            "net_revenue_usd": 1439440.41
          },
          {
            "region": "Norteamérica",
            "stores_count": 4,
            "captured_orders": 2314,
            "gross_captured_usd": 954887.61,
            "processed_refunds_usd": 37992.53,
            "net_revenue_usd": 916895.08
          }
        ]
      },
      "id": "de4-streaming-05-vistas-materializadas-streaming-olap-sec-2"
    },
    {
      "heading": "Prevención de fan-out y arquitectura conjunta Streaming MV + OLAP",
      "body": "Al construir una vista que une pedidos (`orders`), pagos (`payments`) y reembolsos (`refunds`), hacer un `JOIN` plano entre las tres tablas provoca una **explosión de filas** (*fan-out*). En Mercado Brisa existen 1 450 filas de reembolso distribuidas en 1 150 pedidos afectados. Es decir, 300 filas corresponden a segundos reembolsos parciales sobre el mismo pedido. Si unimos `payments` con `refunds` sin preagregar antes `refunds` por `order_id`, el importe pagado `p.amount_usd` se sumará dos veces en esos pedidos.\n\nEn plataformas de datos modernas, los motores IVM y los motores OLAP columnares trabajan juntos. **RisingWave** o **Materialize** se colocan detrás de Kafka para ejecutar la deduplicación por `idempotency_key`, los `Interval Joins` y la preagregación por `order_id`. Después, el flujo limpio se envía hacia **ClickHouse** (`ReplacingMergeTree` o `AggregatingMergeTree`). Allí, los paneles operativos consultan años de historial comprimido con latencias de milisegundos.",
      "example": {
        "language": "sql",
        "code": "-- Vista materializada por tipo de tienda (store_type) sin explosión de filas\nWITH dedup_payments AS (\n  SELECT order_id, amount_usd,\n         ROW_NUMBER() OVER (PARTITION BY idempotency_key ORDER BY payment_ts ASC, payment_id ASC) AS rn\n  FROM payments\n  WHERE status = 'captured'\n),\norder_refunds AS (\n  SELECT order_id, SUM(refund_amount_usd) AS refunded_usd\n  FROM refunds\n  WHERE status = 'processed'\n  GROUP BY order_id\n)\nSELECT s.store_type,\n       COUNT(DISTINCT s.store_id) AS active_stores,\n       COUNT(o.order_id) AS captured_orders,\n       ROUND(SUM(p.amount_usd), 2) AS gross_captured_usd,\n       ROUND(COALESCE(SUM(r.refunded_usd), 0), 2) AS processed_refunds_usd,\n       ROUND(SUM(p.amount_usd) - COALESCE(SUM(r.refunded_usd), 0), 2) AS net_revenue_usd\nFROM stores s\nJOIN orders o ON o.store_id = s.store_id\nJOIN dedup_payments p ON p.order_id = o.order_id AND p.rn = 1\nLEFT JOIN order_refunds r ON r.order_id = o.order_id\nGROUP BY s.store_type\nORDER BY net_revenue_usd DESC;",
        "expectedOutput": [
          {
            "store_type": "retail",
            "active_stores": 7,
            "captured_orders": 9229,
            "gross_captured_usd": 3820898.97,
            "processed_refunds_usd": 123960.63,
            "net_revenue_usd": 3696938.34
          },
          {
            "store_type": "warehouse",
            "active_stores": 3,
            "captured_orders": 2880,
            "gross_captured_usd": 1531827.09,
            "processed_refunds_usd": 13396.57,
            "net_revenue_usd": 1518430.52
          },
          {
            "store_type": "flagship",
            "active_stores": 4,
            "captured_orders": 4091,
            "gross_captured_usd": 1521761.94,
            "processed_refunds_usd": 137177.32,
            "net_revenue_usd": 1384584.62
          }
        ]
      },
      "id": "de4-streaming-05-vistas-materializadas-streaming-olap-sec-3"
    },
    {
      "heading": "Proyecto del módulo: arquitectura CDC y monitor financiero en vivo",
      "body": "Con esta lección completas las cinco etapas del módulo `de4-streaming`. En el **proyecto integrador del módulo**, diseñarás la arquitectura en tiempo real de Mercado Brisa y sus consultas de conciliación. Primero, especificarás la extracción CDC desde el WAL de PostgreSQL con Debezium y `max_slot_wal_keep_size`. Segundo, definirás el particionamiento en Apache Kafka 4.x bajo consenso KRaft evitando particiones calientes por claves nulas. Tercero, justificarás un `Interval Join` de `120 segundos` en Apache Flink para capturar los 675 reintentos bancarios (`$288 589,29 USD`). Cuarto, aplicarás deduplicación por `idempotency_key` para descartar los 405 cobros repetidos (`$168 674,63 USD`).\n\nLa práctica SQL de esta lección construye la consulta final del entregable del módulo. En ella consolidarás los ingresos brutos capturados, las devoluciones procesadas y el flujo de caja neto por formato de tienda (`retail`, `warehouse` y `flagship`). Esta vista es la que alimenta en vivo el monitor operativo de Mercado Brisa.",
      "example": {
        "language": "sql",
        "code": "-- Resumen global del flujo de caja neto verificado para el entregable del módulo\nWITH dedup_payments AS (\n  SELECT order_id, amount_usd\n  FROM payments\n  WHERE status = 'captured'\n  QUALIFY ROW_NUMBER() OVER (PARTITION BY idempotency_key ORDER BY payment_ts ASC, payment_id ASC) = 1\n),\norder_refunds AS (\n  SELECT order_id, SUM(refund_amount_usd) AS refunded_usd\n  FROM refunds\n  WHERE status = 'processed'\n  GROUP BY order_id\n)\nSELECT COUNT(o.order_id) AS total_captured_orders,\n       ROUND(SUM(p.amount_usd), 2) AS total_gross_usd,\n       ROUND(COALESCE(SUM(r.refunded_usd), 0), 2) AS total_refunded_usd,\n       ROUND(SUM(p.amount_usd) - COALESCE(SUM(r.refunded_usd), 0), 2) AS total_net_usd\nFROM orders o\nJOIN dedup_payments p ON p.order_id = o.order_id\nLEFT JOIN order_refunds r ON r.order_id = o.order_id;",
        "expectedOutput": [
          {
            "total_captured_orders": 16200,
            "total_gross_usd": 6874488,
            "total_refunded_usd": 274534.52,
            "total_net_usd": 6599953.48
          }
        ]
      },
      "id": "de4-streaming-05-vistas-materializadas-streaming-olap-sec-4"
    }
  ],
  "workedExample": {
    "title": "Diseño sin fan-out de la vista materializada de ingresos netos en Mercado Brisa",
    "description": "Construimos paso a paso la vista operativa de flujo de caja neto sobre stores, orders, payments y refunds de Mercado Brisa (empresa ficticia), verificando cómo evitar duplicados tanto por webhooks repetidos como por múltiples reembolsos parciales.",
    "audit": "Verificado con DuckDB sobre public/datasets/stores.parquet, orders.parquet, payments.parquet y refunds.parquet.",
    "steps": [
      {
        "label": "Paso 1 · Comprobar la multiplicidad de reembolsos por pedido en refunds",
        "explanation": "En `refunds` existen 1 450 filas con `status = 'processed'`, pero corresponden a 1 150 `order_id` distintos (300 filas son segundos reembolsos parciales sobre el mismo pedido). Unir `refunds` sin preagregar por `order_id` duplicaría el importe del pago en esos pedidos.",
        "code": "SELECT COUNT(*) AS total_refund_rows,\n       COUNT(DISTINCT order_id) AS distinct_refunded_orders,\n       COUNT(*) - COUNT(DISTINCT order_id) AS multi_refund_rows,\n       ROUND(SUM(refund_amount_usd), 2) AS total_refund_amount_usd\nFROM refunds\nWHERE status = 'processed';",
        "expectedOutput": [
          {
            "total_refund_rows": 1450,
            "distinct_refunded_orders": 1150,
            "multi_refund_rows": 300,
            "total_refund_amount_usd": 321097.25
          }
        ]
      },
      {
        "label": "Paso 2 · Aislar las dos CTEs de grano order_id (dedup_payments y order_refunds)",
        "explanation": "Definimos `dedup_payments` reteniendo `rn = 1` por `idempotency_key` sobre pagos `captured`, y `order_refunds` agrupando `refunds` por `order_id`. Así ambas CTEs garantizan a lo sumo una fila por pedido pagado.",
        "code": "WITH dedup_payments AS (\n  SELECT order_id, amount_usd,\n         ROW_NUMBER() OVER (PARTITION BY idempotency_key ORDER BY payment_ts ASC, payment_id ASC) AS rn\n  FROM payments\n  WHERE status = 'captured'\n),\norder_refunds AS (\n  SELECT order_id, SUM(refund_amount_usd) AS refunded_usd\n  FROM refunds\n  WHERE status = 'processed'\n  GROUP BY order_id\n)\nSELECT COUNT(*) AS captured_orders,\n       ROUND(SUM(p.amount_usd), 2) AS gross_usd,\n       ROUND(COALESCE(SUM(r.refunded_usd), 0), 2) AS refunded_on_captured_usd\nFROM dedup_payments p\nLEFT JOIN order_refunds r ON r.order_id = p.order_id\nWHERE p.rn = 1;",
        "expectedOutput": [
          {
            "captured_orders": 16200,
            "gross_usd": 6874488,
            "refunded_on_captured_usd": 274534.52
          }
        ]
      },
      {
        "label": "Paso 3 · Cruzar con orders y stores para materializar el monitor por store_type",
        "explanation": "Unimos nuestras CTEs limpias con `orders` y `stores`, agrupando por `s.store_type` para obtener el número de tiendas activas, pedidos capturados, ingresos brutos, devoluciones procesadas e ingresos netos.",
        "code": "WITH dedup_payments AS (\n  SELECT order_id, amount_usd,\n         ROW_NUMBER() OVER (PARTITION BY idempotency_key ORDER BY payment_ts ASC, payment_id ASC) AS rn\n  FROM payments\n  WHERE status = 'captured'\n),\norder_refunds AS (\n  SELECT order_id, SUM(refund_amount_usd) AS refunded_usd\n  FROM refunds\n  WHERE status = 'processed'\n  GROUP BY order_id\n)\nSELECT s.store_type,\n       COUNT(DISTINCT s.store_id) AS active_stores,\n       COUNT(o.order_id) AS captured_orders,\n       ROUND(SUM(p.amount_usd), 2) AS gross_captured_usd,\n       ROUND(COALESCE(SUM(r.refunded_usd), 0), 2) AS processed_refunds_usd,\n       ROUND(SUM(p.amount_usd) - COALESCE(SUM(r.refunded_usd), 0), 2) AS net_revenue_usd\nFROM stores s\nJOIN orders o ON o.store_id = s.store_id\nJOIN dedup_payments p ON p.order_id = o.order_id AND p.rn = 1\nLEFT JOIN order_refunds r ON r.order_id = o.order_id\nGROUP BY s.store_type\nORDER BY net_revenue_usd DESC;",
        "expectedOutput": [
          {
            "store_type": "retail",
            "active_stores": 7,
            "captured_orders": 9229,
            "gross_captured_usd": 3820898.97,
            "processed_refunds_usd": 123960.63,
            "net_revenue_usd": 3696938.34
          },
          {
            "store_type": "warehouse",
            "active_stores": 3,
            "captured_orders": 2880,
            "gross_captured_usd": 1531827.09,
            "processed_refunds_usd": 13396.57,
            "net_revenue_usd": 1518430.52
          },
          {
            "store_type": "flagship",
            "active_stores": 4,
            "captured_orders": 4091,
            "gross_captured_usd": 1521761.94,
            "processed_refunds_usd": 137177.32,
            "net_revenue_usd": 1384584.62
          }
        ]
      }
    ]
  },
  "checks": [
    {
      "id": "chk-de4-05-ivm",
      "type": "mcq",
      "prompt": "¿Cómo actualiza una base de datos de streaming como Materialize o RisingWave una vista materializada con SUM(amount_usd) cuando una fila existente en la fuente cambia su valor de 100 a 140?",
      "options": [
        {
          "id": "a",
          "text": "Bloquea la vista, borra toda la tabla destino y vuelve a escanear desde el primer registro histórico.",
          "correct": false,
          "feedback": "Ese comportamiento corresponde a un REFRESH MATERIALIZED VIEW completo por lotes, no a mantenimiento incremental (IVM)."
        },
        {
          "id": "b",
          "text": "Propaga por el grafo de flujo un par de deltas: una retracción (-1) por valor de 100 y una inserción (+1) por valor de 140, sumando +40 al acumulado.",
          "correct": true,
          "feedback": "Exacto. Mediante pares de retracción (-1) e inserción (+1), el motor actualiza el estado incrementalmente en milisegundos."
        },
        {
          "id": "c",
          "text": "Ignora las actualizaciones porque las vistas materializadas en streaming solo admiten sentencias INSERT.",
          "correct": false,
          "feedback": "Materialize y RisingWave soportan de forma nativa flujos CDC con INSERT, UPDATE y DELETE."
        }
      ],
      "explanation": "El mantenimiento incremental de vistas (IVM) codifica cada actualización como la retracción del estado previo (-1) seguida de la adición del estado nuevo (+1)."
    },
    {
      "id": "chk-de4-05-clickhouse-rmt",
      "type": "mcq",
      "prompt": "En ClickHouse, insertas dos versiones del mismo pedido (con igual clave ORDER BY) en una tabla con motor ReplacingMergeTree(version) e inmediatamente ejecutas SELECT COUNT(*) FROM tabla sin modificadores. ¿Qué puedes observar?",
      "options": [
        {
          "id": "a",
          "text": "ClickHouse garantiza que la primera versión se borra síncronamente antes de devolver el INSERT, por lo que siempre verás 1 fila.",
          "correct": false,
          "feedback": "ClickHouse no realiza deduplicación síncrona en tiempo de inserción para no penalizar el rendimiento de escritura."
        },
        {
          "id": "b",
          "text": "Puedes ver ambas filas hasta que se ejecute una fusión de partes en segundo plano (background merge), salvo que deduplicas en la consulta o uses FINAL.",
          "correct": true,
          "feedback": "Correcto. ReplacingMergeTree colapsa duplicados de forma asíncrona al compactar partes de datos en segundo plano."
        },
        {
          "id": "c",
          "text": "La consulta falla con un error de violación de clave primaria única.",
          "correct": false,
          "feedback": "En ClickHouse la clave de ordenación indexa bloques dispersos pero no impone una restricción bloqueante de unicidad en inserción."
        }
      ],
      "explanation": "En ReplacingMergeTree, la deduplicación ocurre de manera eventual durante las fusiones de partes en segundo plano; para lecturas exactas inmediatas debe deduplicarse en la consulta o usar FINAL."
    },
    {
      "id": "chk-de4-05-mv-trigger",
      "type": "mcq",
      "prompt": "¿Cuál es la diferencia estructural entre una vista materializada en RisingWave/Materialize y una vista materializada incremental en ClickHouse?",
      "options": [
        {
          "id": "a",
          "text": "En ClickHouse la vista materializada actúa como un disparador en inserción que solo ve el lote recién insertado en la tabla origen, mientras que RisingWave/Materialize mantienen el estado completo de joins y retracciones.",
          "correct": true,
          "feedback": "Exacto. En ClickHouse el SELECT de la vista materializada se ejecuta únicamente sobre el bloque insertado y vuelca estados parciales hacia una tabla AggregatingMergeTree o SummingMergeTree."
        },
        {
          "id": "b",
          "text": "ClickHouse no soporta funciones de agregación como SUM o COUNT en sus vistas materializadas.",
          "correct": false,
          "feedback": "ClickHouse soporta agregaciones de alta velocidad mediante combinadores sumState/sumMerge sobre AggregatingMergeTree."
        },
        {
          "id": "c",
          "text": "RisingWave solo puede actualizar sus vistas una vez cada hora mediante un cron externo.",
          "correct": false,
          "feedback": "RisingWave actualiza sus vistas materializadas de forma continua conforme fluyen las barreras del stream."
        }
      ],
      "explanation": "Las vistas materializadas en ClickHouse son disparadores sobre bloques de inserción (append-only triggers), mientras que Materialize y RisingWave son motores de flujo con estado relacional completo."
    },
    {
      "id": "chk-de4-05-fanout",
      "type": "predict-output",
      "prompt": "Un pedido en Mercado Brisa tiene 1 pago capturado de $200 USD en payments y 2 reembolsos parciales procesados de $30 USD cada uno en refunds. Si haces JOIN directo entre orders, payments y refunds sin agrupar antes refunds por order_id, ¿qué devolverá SUM(p.amount_usd) para ese pedido?",
      "options": [
        {
          "id": "a",
          "text": "$200 USD, porque SQL detecta automáticamente que ambas filas pertenecen al mismo pago.",
          "correct": false,
          "feedback": "Un JOIN relacional genera tantas filas como combinaciones coincidan (1 pago x 2 reembolsos = 2 filas)."
        },
        {
          "id": "b",
          "text": "$400 USD, porque las 2 filas de refunds duplican la fila del pago en el resultado del JOIN (fan-out).",
          "correct": true,
          "feedback": "Correcto. Al existir 2 reembolsos para el mismo order_id, el pago de $200 aparece dos veces y SUM(p.amount_usd) se duplica a $400."
        },
        {
          "id": "c",
          "text": "$140 USD, porque SUM(p.amount_usd) resta automáticamente las columnas de la tabla derecha.",
          "correct": false,
          "feedback": "SUM(p.amount_usd) solo suma la columna indicada; además, sin preagregar refunds la suma bruta queda multiplicada."
        }
      ],
      "explanation": "Unir una relación 1:1 (pago deduplicado por pedido) con una relación 1:N (múltiples reembolsos por pedido) sin preagregar el lado N duplica las métricas del lado 1."
    }
  ],
  "practice": {
    "type": "sql",
    "title": "Vista materializada de ingresos netos por formato de tienda (entregable del módulo)",
    "language": "sql",
    "prompt": "Construye la consulta SQL final del módulo sobre el almacén de Mercado Brisa combinando `stores`, `orders`, `payments` y `refunds`. Define dos CTEs: (1) `dedup_payments`, que filtre `status = 'captured'` y asigne `ROW_NUMBER() OVER (PARTITION BY idempotency_key ORDER BY payment_ts ASC, payment_id ASC) AS rn`; y (2) `order_refunds`, que filtre `status = 'processed'` en `refunds` y agrupe por `order_id` calculando `SUM(refund_amount_usd) AS refunded_usd`. En la consulta principal, une `stores` con `orders`, une con `dedup_payments` (`p.rn = 1`) y haz `LEFT JOIN` con `order_refunds`. Agrupa por `s.store_type` y calcula: `active_stores` (`COUNT(DISTINCT s.store_id)`), `captured_orders` (`COUNT(o.order_id)`), `gross_captured_usd` (`ROUND(SUM(p.amount_usd), 2)`), `processed_refunds_usd` (`ROUND(COALESCE(SUM(r.refunded_usd), 0), 2)`) y `net_revenue_usd` (`ROUND(SUM(p.amount_usd) - COALESCE(SUM(r.refunded_usd), 0), 2)`). Ordena por `net_revenue_usd DESC`.",
    "starterCode": "WITH dedup_payments AS (\n  SELECT order_id,\n         amount_usd,\n         -- TODO: asigna ROW_NUMBER() particionando por idempotency_key y ordenando por payment_ts ASC, payment_id ASC\n         1 AS rn\n  FROM payments\n  WHERE status = 'captured'\n),\norder_refunds AS (\n  SELECT order_id,\n         -- TODO: suma refund_amount_usd por pedido para evitar explosión de filas (fan-out)\n         0.0 AS refunded_usd\n  FROM refunds\n  WHERE status = 'processed'\n  GROUP BY order_id\n)\nSELECT s.store_type,\n       COUNT(DISTINCT s.store_id) AS active_stores,\n       COUNT(o.order_id) AS captured_orders,\n       ROUND(SUM(p.amount_usd), 2) AS gross_captured_usd,\n       ROUND(COALESCE(SUM(r.refunded_usd), 0), 2) AS processed_refunds_usd,\n       -- TODO: calcula el ingreso neto restando los reembolsos al ingreso bruto, redondeado a 2 decimales\n       0.0 AS net_revenue_usd\nFROM stores s\nJOIN orders o ON o.store_id = s.store_id\nJOIN dedup_payments p ON p.order_id = o.order_id AND p.rn = 1\nLEFT JOIN order_refunds r ON r.order_id = o.order_id\nGROUP BY s.store_type\nORDER BY net_revenue_usd DESC;",
    "solution": "WITH dedup_payments AS (\n  SELECT order_id,\n         amount_usd,\n         ROW_NUMBER() OVER (\n           PARTITION BY idempotency_key\n           ORDER BY payment_ts ASC, payment_id ASC\n         ) AS rn\n  FROM payments\n  WHERE status = 'captured'\n),\norder_refunds AS (\n  SELECT order_id,\n         SUM(refund_amount_usd) AS refunded_usd\n  FROM refunds\n  WHERE status = 'processed'\n  GROUP BY order_id\n)\nSELECT s.store_type,\n       COUNT(DISTINCT s.store_id) AS active_stores,\n       COUNT(o.order_id) AS captured_orders,\n       ROUND(SUM(p.amount_usd), 2) AS gross_captured_usd,\n       ROUND(COALESCE(SUM(r.refunded_usd), 0), 2) AS processed_refunds_usd,\n       ROUND(SUM(p.amount_usd) - COALESCE(SUM(r.refunded_usd), 0), 2) AS net_revenue_usd\nFROM stores s\nJOIN orders o ON o.store_id = s.store_id\nJOIN dedup_payments p ON p.order_id = o.order_id AND p.rn = 1\nLEFT JOIN order_refunds r ON r.order_id = o.order_id\nGROUP BY s.store_type\nORDER BY net_revenue_usd DESC;",
    "solutionExplanation": "Al separar la deduplicación de pagos (dedup_payments con rn = 1 por idempotency_key) y la preagregación de devoluciones por pedido (order_refunds agrupado por order_id), ambas CTEs quedan a grano 1:1 con orders. El cruce final con stores entrega el flujo de caja neto exacto por formato de tienda ($3 696 938,34 en retail, $1 518 430,52 en warehouse y $1 384 584,62 en flagship).",
    "orderMatters": true,
    "hints": [
      "En dedup_payments usa ROW_NUMBER() OVER (PARTITION BY idempotency_key ORDER BY payment_ts ASC, payment_id ASC) AS rn.",
      "En order_refunds calcula SUM(refund_amount_usd) AS refunded_usd agrupando por order_id.",
      "Para net_revenue_usd escribe ROUND(SUM(p.amount_usd) - COALESCE(SUM(r.refunded_usd), 0), 2)."
    ],
    "expected": "3 filas (store_type, active_stores, captured_orders, gross_captured_usd, processed_refunds_usd, net_revenue_usd)",
    "expectedOutputTable": [
      {
        "store_type": "retail",
        "active_stores": 7,
        "captured_orders": 9229,
        "gross_captured_usd": 3820898.97,
        "processed_refunds_usd": 123960.63,
        "net_revenue_usd": 3696938.34
      },
      {
        "store_type": "warehouse",
        "active_stores": 3,
        "captured_orders": 2880,
        "gross_captured_usd": 1531827.09,
        "processed_refunds_usd": 13396.57,
        "net_revenue_usd": 1518430.52
      },
      {
        "store_type": "flagship",
        "active_stores": 4,
        "captured_orders": 4091,
        "gross_captured_usd": 1521761.94,
        "processed_refunds_usd": 137177.32,
        "net_revenue_usd": 1384584.62
      }
    ],
    "expectedOutput": {
      "columns": [
        "store_type",
        "active_stores",
        "captured_orders",
        "gross_captured_usd",
        "processed_refunds_usd",
        "net_revenue_usd"
      ],
      "rows": [
        [
          "retail",
          7,
          9229,
          3820898.97,
          123960.63,
          3696938.34
        ],
        [
          "warehouse",
          3,
          2880,
          1531827.09,
          13396.57,
          1518430.52
        ],
        [
          "flagship",
          4,
          4091,
          1521761.94,
          137177.32,
          1384584.62
        ]
      ]
    }
  },
  "pipelineChallenge": {
    "title": "Arquitectura híbrida: de eventos CDC a vistas materializadas en streaming y ClickHouse",
    "description": "Ordena las capas de procesamiento para mantener un monitor financiero en tiempo real libre de duplicados y de explosión de filas.",
    "steps": [
      {
        "id": "step-cdc-ingest",
        "label": "1. Ingesta de flujos CDC de orders, payments y refunds desde Kafka 4.x",
        "text": "1. Ingesta de flujos CDC de orders, payments y refunds desde Kafka 4.x",
        "role": "Fuentes de Streaming",
        "detail": "Los tópicos entregan inserciones y actualizaciones particionadas por clave de entidad."
      },
      {
        "id": "step-ivm-dedup-preagg",
        "label": "2. Deduplicación por idempotency_key y preagregación de refunds por order_id",
        "text": "2. Deduplicación por idempotency_key y preagregación de refunds por order_id",
        "role": "Motor IVM (RisingWave / Materialize)",
        "detail": "Elimina webhooks repetidos y colapsa múltiples reembolsos parciales a grano 1:1 con el pedido."
      },
      {
        "id": "step-ivm-join-delta",
        "label": "3. Mantenimiento incremental del join con stores mediante pares de retracción (+1 / -1)",
        "text": "3. Mantenimiento incremental del join con stores mediante pares de retracción (+1 / -1)",
        "role": "Vista Materializada en Streaming",
        "detail": "Actualiza el flujo de caja neto al instante cada vez que se confirma un cobro o una devolución."
      },
      {
        "id": "step-olap-serving",
        "label": "4. Volcado hacia ClickHouse (ReplacingMergeTree / AggregatingMergeTree) para consultas OLAP",
        "text": "4. Volcado hacia ClickHouse (ReplacingMergeTree / AggregatingMergeTree) para consultas OLAP",
        "role": "Almacén OLAP en Tiempo Real",
        "detail": "Sirve paneles analíticos de alta concurrencia y exploraciones históricas sobre almacenamiento columnar."
      }
    ],
    "correctOrder": [
      "step-cdc-ingest",
      "step-ivm-dedup-preagg",
      "step-ivm-join-delta",
      "step-olap-serving"
    ],
    "hint": "Primero ingresan los flujos desde Kafka, luego se deduplican y preagregan a grano de pedido, después se mantiene el join incremental con retracciones y finalmente se sirve en el motor OLAP."
  },
  "roleNotes": {
    "de": "Elige Materialize o RisingWave cuando necesites joins complejos entre múltiples flujos cambiantes con consistencia inmediata, y usa ClickHouse cuando la prioridad sea comprimir billones de eventos y responder agregaciones analíticas a gran escala.",
    "da": "Cuando consultes una tabla ReplacingMergeTree en ClickHouse, recuerda que las partes recién insertadas pueden no haberse fusionado aún. Usa argMax(valor, version) o ROW_NUMBER() si necesitas exactitud estricta sin pagar el coste de FINAL.",
    "bi": "Antes de cruzar pagos y devoluciones en cualquier vista materializada, verifica que ambas tablas estén preagregadas a nivel de order_id; de lo contrario, los pedidos con dos devoluciones parciales duplicarán el ingreso bruto."
  },
  "summary": [
    "Materialize y RisingWave mantienen vistas materializadas en streaming propagando deltas de inserción (+1) y retracción (-1) sin recalcular tablas completas.",
    "En ClickHouse, las vistas materializadas actúan como disparadores sobre el bloque insertado y se apoyan en motores como ReplacingMergeTree y AggregatingMergeTree.",
    "ReplacingMergeTree deduplica filas con la misma clave de ordenación de forma asíncrona durante las fusiones en segundo plano (background merges).",
    "Preagregar refunds por order_id y deduplicar payments por idempotency_key evita la explosión de filas al calcular el ingreso neto por tienda."
  ],
  "flashcards": [
    {
      "id": "fc-de4-05-ivm-retraction",
      "front": "¿Qué es una retracción (diff = -1) en un motor de vistas materializadas en streaming como Materialize o RisingWave?",
      "back": "Es un registro interno que resta o anula el estado anterior de una tupla antes de sumar la nueva versión (diff = +1), permitiendo actualizar agregados y joins de forma incremental."
    },
    {
      "id": "fc-de4-05-replacingmergetree",
      "front": "¿Cuándo elimina las filas duplicadas una tabla con motor ReplacingMergeTree en ClickHouse?",
      "back": "De forma asíncrona durante las fusiones de partes de datos en segundo plano (background merges), no en el instante de la inserción."
    },
    {
      "id": "fc-de4-05-ch-mv",
      "front": "¿Qué datos observa el SELECT de una vista materializada incremental en ClickHouse cuando se ejecuta?",
      "back": "Observa únicamente el lote o bloque de filas recién insertado en la tabla origen, actuando como un disparador en tiempo de inserción."
    },
    {
      "id": "fc-de4-05-fanout",
      "front": "¿Por qué es obligatorio agrupar refunds por order_id antes de unirlo con payments al calcular ingresos netos?",
      "back": "Porque un pedido puede tener múltiples reembolsos parciales (relación 1:N), y unirlo directamente multiplicaría el importe del pago por cada fila de reembolso."
    }
  ],
  "glossaryTerms": [
    "vista-materializada-incremental-streaming",
    "join-intervalo-temporal",
    "entrega-exactamente-una-vez-2pc"
  ],
  "sources": [
    {
      "title": "Materialize Documentation — CREATE MATERIALIZED VIEW",
      "url": "https://materialize.com/docs/sql/create-materialized-view/",
      "publisher": "Materialize Inc.",
      "accessed": "2026-10-29",
      "supports": "Mantenimiento incremental de vistas (IVM) mediante Differential Dataflow y manejo de retracciones."
    },
    {
      "title": "RisingWave Documentation — What is RisingWave?",
      "url": "https://docs.risingwave.com/get-started/intro",
      "publisher": "RisingWave Labs",
      "accessed": "2026-10-29",
      "supports": "Arquitectura de vistas materializadas en cascada sobre almacenamiento de objetos y sumideros hacia almacenes OLAP."
    },
    {
      "title": "ClickHouse Documentation — ReplacingMergeTree Table Engine",
      "url": "https://clickhouse.com/docs/en/engines/table-engines/mergetree-family/replacingmergetree",
      "publisher": "ClickHouse Inc.",
      "accessed": "2026-10-29",
      "supports": "Deduplicación asíncrona durante fusiones en segundo plano por clave de ordenación y columna de versión."
    },
    {
      "title": "ClickHouse Documentation — Incremental Materialized Views",
      "url": "https://clickhouse.com/docs/en/materialized-view/incremental-materialized-view",
      "publisher": "ClickHouse Inc.",
      "accessed": "2026-10-29",
      "supports": "Funcionamiento como disparador sobre bloques insertados y combinación con AggregatingMergeTree."
    }
  ],
  "aiNotes": "Orienta al estudiante en esta práctica integradora del módulo de4-streaming: si su consulta arroja un ingreso bruto mayor a $3 820 898,97 en retail, verifica primero si olvidó deduplicar payments por idempotency_key (rn = 1) o si no agrupó refunds por order_id antes del LEFT JOIN."
};

export default lesson;
