export const lesson = {
  "id": "de4-plataforma-02-arquitectura-integral-plataforma",
  "moduleId": "de4-plataforma",
  "tracks": [
    "de"
  ],
  "level": 4,
  "order": 2,
  "title": "Diseño integral de una plataforma de datos moderna",
  "subtitle": "Diseño integral de una plataforma de datos: ingesta, almacenamiento, cómputo y consumo",
  "minutes": 25,
  "prerequisites": [
    "de4-streaming-01-cdc-kafka-streaming",
    "de3-lakehouse-01-iceberg-v3-medallion",
    "de4-plataforma-01-spark-4-shuffles-skew-ansi"
  ],
  "contentVersion": 2,
  "hook": "En Mercado Brisa conviven cuatro flujos con ritmos opuestos: 65 000 eventos de navegación, 42 000 líneas transaccionales, 4 100 cambios de clientes y 730 cortes de marketing. Cuando finanzas compara las órdenes completadas ($6 269 462.42) contra los pagos capturados ($6 423 516.34), detecta un descuadre de $154 053.92 porque los reintentos de cobro aterrizan directo en los reportes. ¿Cómo desacoplas los planos de ingesta, almacenamiento, cómputo y consumo para conciliar cada cifra?",
  "objectives": [
    "Estructurar una plataforma de datos en cuatro planos desacoplados (ingesta, almacenamiento abierto, cómputo poliglota y consumo) evitando el acoplamiento a un único motor propietario.",
    "Establecer criterios objetivos de enrutamiento de cargas entre procesamiento de flujo con estado (Apache Flink), procesamiento distribuido por lotes (Apache Spark 4.0) y ejecución analítica en nodo único (DuckDB).",
    "Implementar auditorías de conciliación financiera entre las capas Bronze, Silver y Gold para aislar duplicidades de ingesta antes de publicar tablas de consumo."
  ],
  "sections": [
    {
      "id": "cuatro-planos-plataforma",
      "heading": "Los cuatro planos desacoplados de la arquitectura Lakehouse",
      "body": "Una plataforma monolítica donde el motor de consultas es dueño exclusivo del formato en disco obliga a duplicar tablas cuando otro equipo necesita un motor distinto. El diseño moderno resuelve este problema separando la arquitectura en cuatro planos independientes conectados por estándares abiertos.\n\nEl **plano de ingesta** captura cambios de bases transaccionales mediante registros CDC hacia Apache Kafka y extrae archivos de APIs externas con conectores idempotentes. Luego, el **plano de almacenamiento** deposita los datos en almacenamiento de objetos usando archivos Apache Parquet gobernados por Apache Iceberg. Este almacenamiento se organiza en tres capas: Bronze (aterrizaje crudo e inmutable), Silver (entidades deduplicadas y conformadas) y Gold (modelos agregados para negocio). Sobre ese almacenamiento único opera el **plano de cómputo**, donde múltiples motores leen y escriben las mismas tablas mediante el catálogo transaccional sin bloquearse. Finalmente, el plano de consumo expone vistas gobernadas hacia herramientas de BI, cuadernos de experimentación y servicios operacionales.",
      "example": {
        "language": "sql",
        "code": "SELECT 'clickstream_events' AS dominio, COUNT(*) AS total_registros FROM events\nUNION ALL\nSELECT 'lineas_transaccionales', COUNT(*) FROM order_items\nUNION ALL\nSELECT 'cambios_scd2_clientes', COUNT(*) FROM customer_changes\nUNION ALL\nSELECT 'gasto_marketing_api', COUNT(*) FROM marketing_spend\nORDER BY total_registros DESC;",
        "expectedOutput": [
          {
            "dominio": "clickstream_events",
            "total_registros": 65000
          },
          {
            "dominio": "lineas_transaccionales",
            "total_registros": 42000
          },
          {
            "dominio": "cambios_scd2_clientes",
            "total_registros": 4100
          },
          {
            "dominio": "gasto_marketing_api",
            "total_registros": 730
          }
        ]
      }
    },
    {
      "id": "enrutamiento-computo-hibrido",
      "heading": "Cómputo poliglota: cuándo usar Flink, Spark 4.0 o DuckDB",
      "body": "Mantener un clúster distribuido encendido todo el día para ejecutar consultas sobre pocos gigabytes desperdicia presupuesto. Además, añade latencia innecesaria al planificar tareas remotas. En una plataforma bien dimensionada, el plano de cómputo asigna cada carga al motor adecuado según su acuerdo de nivel de servicio (SLO) y su volumen de datos.\n\nLas tuberías que exigen latencia inferior al minuto y manejo de estado por evento se ejecutan en **Apache Flink**. Un ejemplo es detectar anomalías en la pasarela de pagos sobre el flujo continuo de `events` y `payments`. Las transformaciones pesadas por lotes que cruzan cientos de gigabytes o terabytes de historial se delegan a clústeres efímeros de **Apache Spark 4.0** con ejecución adaptativa (AQE). En cambio, las transformaciones sobre conjuntos de datos activos que caben en la memoria y discos NVMe de una máquina moderna se procesan en **DuckDB**. Así evitas el sobrecosto de red y el tiempo de arranque de nodos trabajadores.",
      "example": {
        "language": "sql",
        "code": "SELECT status,\n       COUNT(*) AS total_attempts,\n       COUNT(DISTINCT order_id) AS distinct_orders,\n       ROUND(SUM(amount_usd), 2) AS total_amount_usd\nFROM payments\nGROUP BY status\nORDER BY total_attempts DESC;",
        "expectedOutput": [
          {
            "status": "captured",
            "total_attempts": 16605,
            "distinct_orders": 16200,
            "total_amount_usd": 7043162.63
          },
          {
            "status": "failed",
            "total_attempts": 1857,
            "distinct_orders": 1785,
            "total_amount_usd": 820890.69
          },
          {
            "status": "pending",
            "total_attempts": 738,
            "distinct_orders": 720,
            "total_amount_usd": 314046.86
          }
        ]
      }
    },
    {
      "id": "reconciliacion-entre-capas",
      "heading": "Contratos de conciliación entre Bronze, Silver y Gold",
      "body": "Desacoplar los planos exige verificar matemáticamente que ninguna fila se pierda ni se multiplique al pasar de Bronze a Gold. En los sistemas de comercio electrónico, la pasarela de cobros reintenta cargos cuando ocurre un tiempo de espera en red. En Mercado Brisa existen 14 760 órdenes con estado `'completed'` cuyo importe facturado suma `$6 269 462.42`. Sin embargo, al cruzar con `payments`, los cobros con estado `'captured'` asociados a esas órdenes suman `$6 423 516.34`.\n\nSi el plano de consumo consulta una unión directa entre órdenes, pagos y reembolsos sin pre-agregar, ocurre un **abanico multiplicativo** (*chasm trap*). Cada orden con dos intentos capturados duplica su ingreso en los reportes regionales. La arquitectura resuelve esta discrepancia conservando todos los intentos en Bronze para auditoría operativa. Luego, la **capa Silver** pre-agrega `payments` y `refunds` al grano exacto de `order_id` en CTEs separados. Finalmente, la **capa Gold** expone lado a lado el monto facturado, el monto capturado y el monto reembolsado.",
      "example": {
        "language": "sql",
        "code": "WITH order_dedup AS (\n  SELECT order_id, ANY_VALUE(total_usd) AS total_usd\n  FROM orders\n  WHERE status = 'completed'\n  GROUP BY order_id\n),\npaid_by_order AS (\n  SELECT order_id, SUM(amount_usd) AS paid_usd\n  FROM payments\n  WHERE status = 'captured'\n  GROUP BY order_id\n)\nSELECT COUNT(*) AS completed_orders,\n       COUNT(p.order_id) AS orders_with_payment,\n       ROUND(SUM(o.total_usd), 2) AS total_facturado_usd,\n       ROUND(SUM(COALESCE(p.paid_usd, 0)), 2) AS total_cobrado_usd\nFROM order_dedup o\nLEFT JOIN paid_by_order p ON o.order_id = p.order_id;",
        "expectedOutput": [
          {
            "completed_orders": 14760,
            "orders_with_payment": 14760,
            "total_facturado_usd": 6269462.42,
            "total_cobrado_usd": 6423516.34
          }
        ]
      }
    }
  ],
  "workedExample": {
    "title": "Conciliación de los cuatro planos entre órdenes, pagos y reembolsos en Mercado Brisa",
    "description": "Para redactar el documento de arquitectura de Mercado Brisa, necesitas perfilar el volumen de los cuatro dominios de ingesta, demostrar el descuadre contable entre órdenes completadas y cobros capturados en la transición Bronze-Silver, y construir la tabla conciliada de nivel Gold por región.",
    "audit": "Pre-agregar payments y refunds al grano de order_id evita el abanico multiplicativo y hace visible la brecha de $154 053.92 entre lo facturado ($6 269 462.42) y lo capturado ($6 423 516.34).",
    "steps": [
      {
        "label": "Paso 1: Inventariar el volumen por dominio en el plano de ingesta",
        "explanation": "Unificamos los conteos de las cuatro fuentes principales (eventos de clickstream, líneas de pedido OLTP, historial SCD2 de clientes y gasto de marketing por lotes) para dimensionar la frecuencia y volumen de cada conector.",
        "code": "SELECT 'clickstream_events' AS dominio, COUNT(*) AS total_registros FROM events\nUNION ALL\nSELECT 'lineas_transaccionales', COUNT(*) FROM order_items\nUNION ALL\nSELECT 'cambios_scd2_clientes', COUNT(*) FROM customer_changes\nUNION ALL\nSELECT 'gasto_marketing_api', COUNT(*) FROM marketing_spend\nORDER BY total_registros DESC;",
        "expectedOutput": [
          {
            "dominio": "clickstream_events",
            "total_registros": 65000
          },
          {
            "dominio": "lineas_transaccionales",
            "total_registros": 42000
          },
          {
            "dominio": "cambios_scd2_clientes",
            "total_registros": 4100
          },
          {
            "dominio": "gasto_marketing_api",
            "total_registros": 730
          }
        ]
      },
      {
        "label": "Paso 2: Auditar la brecha entre órdenes completadas y pagos capturados en Silver",
        "explanation": "Pre-agregamos órdenes completadas y pagos capturados al grano de order_id para comparar el total facturado ($6 269 462.42) frente al total cobrado bruto ($6 423 516.34) sin distorsión por abanico de filas.",
        "code": "WITH order_dedup AS (\n  SELECT order_id, ANY_VALUE(total_usd) AS total_usd\n  FROM orders\n  WHERE status = 'completed'\n  GROUP BY order_id\n),\npaid_by_order AS (\n  SELECT order_id, SUM(amount_usd) AS paid_usd\n  FROM payments\n  WHERE status = 'captured'\n  GROUP BY order_id\n)\nSELECT COUNT(*) AS completed_orders,\n       COUNT(p.order_id) AS orders_with_payment,\n       ROUND(SUM(o.total_usd), 2) AS total_facturado_usd,\n       ROUND(SUM(COALESCE(p.paid_usd, 0)), 2) AS total_cobrado_usd\nFROM order_dedup o\nLEFT JOIN paid_by_order p ON o.order_id = p.order_id;",
        "expectedOutput": [
          {
            "completed_orders": 14760,
            "orders_with_payment": 14760,
            "total_facturado_usd": 6269462.42,
            "total_cobrado_usd": 6423516.34
          }
        ]
      },
      {
        "label": "Paso 3: Publicar el resumen conciliado Gold por región comercial",
        "explanation": "Cruzamos stores con las órdenes completadas y los CTEs pre-agregados de pagos capturados y reembolsos procesados para entregar al plano de consumo las métricas regionales listas para auditoría y BI.",
        "code": "WITH order_dedup AS (\n  SELECT order_id, ANY_VALUE(store_id) AS store_id, ANY_VALUE(total_usd) AS total_usd\n  FROM orders\n  WHERE status = 'completed'\n  GROUP BY order_id\n),\npaid_by_order AS (\n  SELECT order_id, SUM(amount_usd) AS paid_usd\n  FROM payments\n  WHERE status = 'captured'\n  GROUP BY order_id\n),\nrefund_by_order AS (\n  SELECT order_id, SUM(refund_amount_usd) AS refund_usd\n  FROM refunds\n  WHERE status = 'processed'\n  GROUP BY order_id\n)\nSELECT s.region,\n       COUNT(o.order_id) AS completed_orders,\n       ROUND(SUM(o.total_usd), 2) AS gross_order_usd,\n       ROUND(SUM(COALESCE(p.paid_usd, 0)), 2) AS captured_payment_usd,\n       ROUND(SUM(COALESCE(r.refund_usd, 0)), 2) AS processed_refund_usd\nFROM stores s\nJOIN order_dedup o ON s.store_id = o.store_id\nLEFT JOIN paid_by_order p ON o.order_id = p.order_id\nLEFT JOIN refund_by_order r ON o.order_id = r.order_id\nGROUP BY s.region\nORDER BY gross_order_usd DESC;",
        "expectedOutput": [
          {
            "region": "Cono Sur",
            "completed_orders": 4920,
            "gross_order_usd": 2059786.39,
            "captured_payment_usd": 2105831.43,
            "processed_refund_usd": 77991.82
          },
          {
            "region": "Andina",
            "completed_orders": 4921,
            "gross_order_usd": 1990554.12,
            "captured_payment_usd": 2042272.88,
            "processed_refund_usd": 115379.23
          },
          {
            "region": "Iberia",
            "completed_orders": 2811,
            "gross_order_usd": 1348369.68,
            "captured_payment_usd": 1381944.69,
            "processed_refund_usd": 43170.94
          },
          {
            "region": "Norteamérica",
            "completed_orders": 2108,
            "gross_order_usd": 870752.23,
            "captured_payment_usd": 893467.34,
            "processed_refund_usd": 37992.53
          }
        ]
      }
    ]
  },
  "checks": [
    {
      "id": "de4-p02-check-1",
      "type": "mcq",
      "prompt": "¿Cuál es la ventaja arquitectónica principal de almacenar las capas Bronze, Silver y Gold en tablas Apache Iceberg sobre almacenamiento de objetos en lugar de dentro del almacenamiento propietario de un único motor?",
      "options": [
        {
          "id": "a",
          "text": "Elimina la necesidad de definir esquemas o tipos de datos en las tablas analíticas.",
          "correct": false,
          "feedback": "Incorrecto. Apache Iceberg exige un esquema tipado estricto y gestiona su evolución mediante identificadores de columna únicos."
        },
        {
          "id": "b",
          "text": "Permite que distintos motores del plano de cómputo (Flink, Spark, DuckDB) lean y escriban sobre los mismos archivos Parquet con aislamiento transaccional sin duplicar datos.",
          "correct": true,
          "feedback": "Correcto. El catálogo y los metadatos abiertos de Iceberg desacoplan el plano de almacenamiento del plano de cómputo."
        },
        {
          "id": "c",
          "text": "Garantiza que las consultas SQL nunca requieran memoria RAM ni CPU en el plano de cómputo.",
          "correct": false,
          "feedback": "Incorrecto. Los motores siguen necesitando CPU y RAM para procesar los archivos Parquet; lo que se evita es copiar y encerrar los datos en silos propietarios."
        },
        {
          "id": "d",
          "text": "Reemplaza automáticamente a Apache Kafka como bus de mensajería de baja latencia en el plano de ingesta.",
          "correct": false,
          "feedback": "Incorrecto. Iceberg es un formato de tabla sobre almacenamiento de objetos, no un registro de mensajería de milisegundos como Kafka."
        }
      ],
      "explanation": "Al estandarizar el plano de almacenamiento sobre Apache Iceberg y Parquet, la plataforma evita copiar datos entre motores: Flink puede escribir en flujo, Spark procesar lotes masivos y DuckDB consultar directamente la misma tabla."
    },
    {
      "id": "de4-p02-check-2",
      "type": "predict-output",
      "prompt": "Si una orden completada de $100 tiene 2 registros en payments y 2 registros en refunds, ¿qué total de orden reportará SELECT SUM(o.total_usd) FROM orders o JOIN payments p ON o.order_id = p.order_id JOIN refunds r ON o.order_id = r.order_id?",
      "options": [
        {
          "id": "a",
          "text": "$100, porque SQL deduplica automáticamente la tabla izquierda en un INNER JOIN.",
          "correct": false,
          "feedback": "Incorrecto. SQL no deduplica la tabla izquierda; cada combinación de filas coincidentes en las tablas derechas multiplica la fila de orders."
        },
        {
          "id": "b",
          "text": "$200, porque solo el primer JOIN multiplica las filas de la orden.",
          "correct": false,
          "feedback": "Incorrecto. Ambos JOINs multiplican las filas: 2 filas de payments por 2 filas de refunds producen 4 filas en el resultado."
        },
        {
          "id": "c",
          "text": "$400, porque el cruce 1:N con dos tablas independientes genera 2 × 2 = 4 filas para esa misma orden.",
          "correct": true,
          "feedback": "Correcto. Este abanico multiplicativo (chasm trap) obliga a pre-agregar payments y refunds por order_id antes de unirlos con orders."
        }
      ],
      "explanation": "Cruzar dos relaciones uno-a-muchos independientes en el mismo SELECT produce el producto cartesiano de las ramas por cada llave (2 pagos × 2 reembolsos = 4 filas), cuadruplicando SUM(o.total_usd) a $400."
    },
    {
      "id": "de4-p02-check-3",
      "type": "order",
      "prompt": "Ordena el flujo de extremo a extremo de un registro transaccional a través de los cuatro planos de la plataforma de datos de Mercado Brisa:",
      "items": [
        "Plano de ingesta: captura del evento CDC de la base transaccional y publicación en el tópico particionado de Apache Kafka.",
        "Plano de almacenamiento (Bronze): escritura inmutable de los lotes de eventos crudos en tablas Apache Iceberg.",
        "Plano de cómputo (Silver/Gold): deduplicación por llave de idempotencia, pre-agregación al grano correcto y conciliación contable.",
        "Plano de consumo: exposición de la tabla Gold certificada hacia tableros ejecutivos de BI y consultas analíticas."
      ],
      "correctOrder": [
        "it-0",
        "it-1",
        "it-2",
        "it-3"
      ],
      "explanation": "El dato nace en la captura CDC del plano de ingesta, se persiste de forma inmutable en Bronze, es transformado y conciliado por el plano de cómputo hacia Silver y Gold, y finalmente abastece al plano de consumo."
    }
  ],
  "practice": {
    "type": "sql",
    "title": "Conciliación regional Gold de órdenes, pagos y reembolsos",
    "language": "sql",
    "prompt": "Construye la tabla de conciliación regional de la capa Gold para las órdenes con status = 'completed'. Cruza stores con las órdenes completadas (deduplicadas por order_id), los pagos con status = 'captured' pre-agregados por order_id y los reembolsos con status = 'processed' pre-agregados por order_id. Devuelve por cada region: completed_orders, gross_order_usd, captured_payment_usd y processed_refund_usd (redondeados a 2 decimales). Ordena por gross_order_usd de mayor a menor.",
    "starterCode": "WITH order_dedup AS (\n  SELECT order_id,\n         ANY_VALUE(store_id) AS store_id,\n         ANY_VALUE(total_usd) AS total_usd\n  FROM orders\n  WHERE status = 'completed'\n  GROUP BY order_id\n),\npaid_by_order AS (\n  -- Pre-agrega payments (status = 'captured') por order_id\n  SELECT order_id, 0.0 AS paid_usd\n  FROM payments\n  GROUP BY order_id\n),\nrefund_by_order AS (\n  -- Pre-agrega refunds (status = 'processed') por order_id\n  SELECT order_id, 0.0 AS refund_usd\n  FROM refunds\n  GROUP BY order_id\n)\nSELECT s.region,\n       COUNT(o.order_id) AS completed_orders,\n       ROUND(SUM(o.total_usd), 2) AS gross_order_usd,\n       ROUND(SUM(COALESCE(p.paid_usd, 0)), 2) AS captured_payment_usd,\n       ROUND(SUM(COALESCE(r.refund_usd, 0)), 2) AS processed_refund_usd\nFROM stores s\nJOIN order_dedup o ON s.store_id = o.store_id\nLEFT JOIN paid_by_order p ON o.order_id = p.order_id\nLEFT JOIN refund_by_order r ON o.order_id = r.order_id\nGROUP BY s.region\nORDER BY gross_order_usd DESC;",
    "expected": "WITH order_dedup AS (\n  SELECT order_id,\n         ANY_VALUE(store_id) AS store_id,\n         ANY_VALUE(total_usd) AS total_usd\n  FROM orders\n  WHERE status = 'completed'\n  GROUP BY order_id\n),\npaid_by_order AS (\n  SELECT order_id, SUM(amount_usd) AS paid_usd\n  FROM payments\n  WHERE status = 'captured'\n  GROUP BY order_id\n),\nrefund_by_order AS (\n  SELECT order_id, SUM(refund_amount_usd) AS refund_usd\n  FROM refunds\n  WHERE status = 'processed'\n  GROUP BY order_id\n)\nSELECT s.region,\n       COUNT(o.order_id) AS completed_orders,\n       ROUND(SUM(o.total_usd), 2) AS gross_order_usd,\n       ROUND(SUM(COALESCE(p.paid_usd, 0)), 2) AS captured_payment_usd,\n       ROUND(SUM(COALESCE(r.refund_usd, 0)), 2) AS processed_refund_usd\nFROM stores s\nJOIN order_dedup o ON s.store_id = o.store_id\nLEFT JOIN paid_by_order p ON o.order_id = p.order_id\nLEFT JOIN refund_by_order r ON o.order_id = r.order_id\nGROUP BY s.region\nORDER BY gross_order_usd DESC;",
    "orderMatters": true,
    "hints": [
      "En el CTE paid_by_order filtra WHERE status = 'captured' y calcula SUM(amount_usd) AS paid_usd agrupando por order_id.",
      "En el CTE refund_by_order filtra WHERE status = 'processed' y calcula SUM(refund_amount_usd) AS refund_usd agrupando por order_id.",
      "Mantén los LEFT JOIN desde order_dedup hacia paid_by_order y refund_by_order para no perder órdenes sin pago o sin reembolso."
    ],
    "solution": "WITH order_dedup AS (\n  SELECT order_id,\n         ANY_VALUE(store_id) AS store_id,\n         ANY_VALUE(total_usd) AS total_usd\n  FROM orders\n  WHERE status = 'completed'\n  GROUP BY order_id\n),\npaid_by_order AS (\n  SELECT order_id, SUM(amount_usd) AS paid_usd\n  FROM payments\n  WHERE status = 'captured'\n  GROUP BY order_id\n),\nrefund_by_order AS (\n  SELECT order_id, SUM(refund_amount_usd) AS refund_usd\n  FROM refunds\n  WHERE status = 'processed'\n  GROUP BY order_id\n)\nSELECT s.region,\n       COUNT(o.order_id) AS completed_orders,\n       ROUND(SUM(o.total_usd), 2) AS gross_order_usd,\n       ROUND(SUM(COALESCE(p.paid_usd, 0)), 2) AS captured_payment_usd,\n       ROUND(SUM(COALESCE(r.refund_usd, 0)), 2) AS processed_refund_usd\nFROM stores s\nJOIN order_dedup o ON s.store_id = o.store_id\nLEFT JOIN paid_by_order p ON o.order_id = p.order_id\nLEFT JOIN refund_by_order r ON o.order_id = r.order_id\nGROUP BY s.region\nORDER BY gross_order_usd DESC;",
    "solutionExplanation": "Al pre-agregar payments y refunds al grano exacto de order_id antes de unirlos con las órdenes completadas y las tiendas, evitamos la multiplicación de filas y exponemos con precisión el monto facturado, el cobrado y el reembolsado en las cuatro regiones de Mercado Brisa.",
    "expectedOutputTable": [
      {
        "region": "Cono Sur",
        "completed_orders": 4920,
        "gross_order_usd": 2059786.39,
        "captured_payment_usd": 2105831.43,
        "processed_refund_usd": 77991.82
      },
      {
        "region": "Andina",
        "completed_orders": 4921,
        "gross_order_usd": 1990554.12,
        "captured_payment_usd": 2042272.88,
        "processed_refund_usd": 115379.23
      },
      {
        "region": "Iberia",
        "completed_orders": 2811,
        "gross_order_usd": 1348369.68,
        "captured_payment_usd": 1381944.69,
        "processed_refund_usd": 43170.94
      },
      {
        "region": "Norteamérica",
        "completed_orders": 2108,
        "gross_order_usd": 870752.23,
        "captured_payment_usd": 893467.34,
        "processed_refund_usd": 37992.53
      }
    ]
  },
  "roleNotes": {
    "de": "Diseña la plataforma asegurando que ningún motor de cómputo sea dueño exclusivo del almacenamiento. Mantén las tablas en Apache Iceberg sobre almacenamiento de objetos y exige que las transformaciones Silver garanticen la unicidad del grano antes de publicar en Gold.",
    "da": "Cuando explores discrepancias entre ventas y tesorería, consulta las tablas Silver por separado o pre-agrega en CTEs al grano de order_id. Nunca sumes importes de órdenes después de un JOIN directo con tablas de eventos o intentos de pago.",
    "bi": "Conecta tus modelos semánticos únicamente al plano de consumo (capa Gold), donde las brechas entre facturación, cobros capturados y reembolsos ya están expuestas como columnas explícitas en el mismo grano."
  },
  "summary": [
    "Una plataforma moderna desacopla cuatro planos: ingesta, almacenamiento abierto (Parquet e Iceberg), cómputo poliglota y consumo gobernado.",
    "El catálogo de Apache Iceberg permite que Flink, Spark 4.0 y DuckDB operen sobre las mismas tablas con aislamiento de instantáneas.",
    "El enrutamiento de cómputo asigna flujo continuo a Flink, lotes masivos a Spark 4.0 y cargas analíticas de decenas de gigabytes a DuckDB.",
    "La transición de Bronze a Silver y Gold debe pre-agregar relaciones uno-a-muchos al grano común para evitar abanicos multiplicativos y conciliar importes."
  ],
  "flashcards": [
    {
      "id": "de4-plataforma-02-arquitectura-integral-plataforma-fc-1",
      "front": "¿Cuáles son los cuatro planos independientes en el diseño integral de una plataforma de datos?",
      "back": "Plano de ingesta (captura CDC, eventos y lotes), plano de almacenamiento abierto (Parquet/Iceberg en capas Bronze, Silver, Gold), plano de cómputo efímero (Flink, Spark, DuckDB) y plano de consumo (BI, analítica y servicios)."
    },
    {
      "id": "de4-plataforma-02-arquitectura-integral-plataforma-fc-2",
      "front": "¿Bajo qué criterios se elige entre Apache Flink, Apache Spark 4.0 y DuckDB dentro del plano de cómputo?",
      "back": "Flink para latencias sub-minuto y procesamiento de flujo con estado; Spark 4.0 para trabajos por lotes que redistribuyen cientos de gigabytes o terabytes; DuckDB para cargas por lotes que caben en la RAM y NVMe de un nodo único."
    },
    {
      "id": "de4-plataforma-02-arquitectura-integral-plataforma-fc-3",
      "front": "¿Por qué el total de pagos capturados ($6 423 516.34) supera al total de órdenes completadas ($6 269 462.42) en Mercado Brisa?",
      "back": "Porque la tabla payments registra múltiples intentos de cobro por orden y contiene 405 cobros capturados duplicados producto de reintentos de pasarela."
    },
    {
      "id": "de4-plataforma-02-arquitectura-integral-plataforma-fc-4",
      "front": "¿Cómo se previene un chasm trap al construir una tabla Gold que combina orders, payments y refunds?",
      "back": "Pre-agregando payments y refunds en CTEs independientes hasta el grano exacto de order_id antes de realizar los LEFT JOIN con orders."
    }
  ],
  "glossaryTerms": [
    "planos-arquitectura-datos",
    "c17-medallion-architecture",
    "c18-iceberg-v3"
  ],
  "sources": [
    {
      "title": "Apache Iceberg Table Specification",
      "url": "https://iceberg.apache.org/spec/",
      "publisher": "Apache Software Foundation",
      "accessed": "2026-10-29",
      "supports": "Arquitectura del plano de almacenamiento abierto, aislamiento de instantáneas y concurrencia multi-motor."
    },
    {
      "title": "Apache Kafka Documentation — Design and Architecture",
      "url": "https://kafka.apache.org/documentation/",
      "publisher": "Apache Software Foundation",
      "accessed": "2026-10-29",
      "supports": "Diseño del plano de ingesta desacoplado mediante registros de eventos particionados."
    },
    {
      "title": "DuckDB Documentation — SQL Introduction",
      "url": "https://duckdb.org/docs/stable/sql/introduction",
      "publisher": "DuckDB Foundation",
      "accessed": "2026-10-29",
      "supports": "Ejecución analítica vectorizada en nodo único sobre archivos Parquet como alternativa a clústeres distribuidos para volúmenes moderados."
    },
    {
      "title": "Apache Parquet File Format Documentation",
      "url": "https://parquet.apache.org/docs/file-format/",
      "publisher": "Apache Software Foundation",
      "accessed": "2026-10-29",
      "supports": "Estandarización de almacenamiento columnar interoperable entre los planos de la plataforma."
    }
  ],
  "aiNotes": "Ayuda al estudiante a razonar sobre el desacoplamiento de los cuatro planos y el peligro de unir orders con payments y refunds sin pre-agregar al grano de order_id. En la práctica SQL, verifica que el alumno filtre status = 'captured' en payments y status = 'processed' en refunds dentro de sus respectivos CTEs."
};

export default lesson;
