export const lesson = {
  "id": "da3-producto-01-embudos-conversion-ventana",
  "moduleId": "da3-producto",
  "tracks": [
    "da"
  ],
  "level": 3,
  "order": 1,
  "minutes": 25,
  "contentVersion": 2,
  "needsReview": false,
  "prerequisites": [
    "da2-eda-04-diario-analisis-reproducible",
    "c2-sql-analitico-01-window-functions"
  ],
  "title": "Embudos de conversión por ventana y cuellos de botella",
  "subtitle": "Embudos de conversión por ventana temporal: caída por paso y cuellos de botella",
  "hook": "El panel comercial de Mercado Brisa celebra que el 95 % de los clientes registrados realiza al menos un pedido histórico. Sin embargo, finanzas alerta de que cuatro de cada cinco nuevos registros no compran nada durante sus primeros 60 días y el flujo de caja trimestral cae. ¿Cómo puede una tasa de conversión global parecer excelente mientras la activación real fracasa, y cómo diseñar un embudo con ventana temporal que aísle el cuello de botella exacto?",
  "objectives": [
    "Deduplicar eventos de telemetría y definir el grano de usuario antes de calcular pasos de conversión.",
    "Prevenir el sesgo por asociación retroactiva de identidad filtrando eventos ocurridos a partir del registro.",
    "Construir en DuckDB un embudo secuencial estricto con ventana temporal mediante cláusulas FILTER y DATEDIFF.",
    "Identificar cuellos de botella comparando tasas de conversión paso a paso entre segmentos de negocio."
  ],
  "sections": [
    {
      "id": "sec-grano-deduplicacion-embudo",
      "heading": "Higiene del grano: de eventos duplicados a usuarios únicos",
      "body": "Un embudo de conversión mide qué proporción de usuarios avanza por una serie de hitos hacia un objetivo comercial. El primer error al construirlo consiste en contar filas crudas de telemetría en lugar de entidades únicas.\n\nEn la tabla `events` de **Mercado Brisa** (`65.000` registros), las aplicaciones móviles reintentan envíos cuando la red falla. Las primeras `1.200` sesiones web emitieron filas idénticas con el mismo `event_id` (`240` duplicados exactos en cada uno de los cinco tipos de evento). Además, un mismo comprador puede añadir diez productos al carrito en una tarde.\n\nSi divides el total de eventos `checkout_completed` entre los eventos `add_to_cart`, obtendrás una razón de actividad distorsionada por usuarios hiperactivos y reintentos técnicos. Todo embudo exige deduplicar primero por `event_id` y agregar después al grano de `customer_id` (o `session_id` en flujos anónimos).",
      "example": {
        "language": "sql",
        "code": "SELECT\n  event_type,\n  COUNT(*) AS raw_events,\n  COUNT(DISTINCT event_id) AS unique_events,\n  COUNT(*) - COUNT(DISTINCT event_id) AS duplicate_retries,\n  COUNT(DISTINCT customer_id) AS unique_customers\nFROM events\nGROUP BY event_type\nORDER BY raw_events DESC, 1 ASC;",
        "expectedOutput": [
          {
            "event_type": "add_to_cart",
            "raw_events": 15400,
            "unique_events": 15160,
            "duplicate_retries": 240,
            "unique_customers": 1600
          },
          {
            "event_type": "checkout_completed",
            "raw_events": 15400,
            "unique_events": 15160,
            "duplicate_retries": 240,
            "unique_customers": 1600
          },
          {
            "event_type": "checkout_started",
            "raw_events": 15400,
            "unique_events": 15160,
            "duplicate_retries": 240,
            "unique_customers": 1600
          },
          {
            "event_type": "page_view",
            "raw_events": 9400,
            "unique_events": 9160,
            "duplicate_retries": 240,
            "unique_customers": 480
          },
          {
            "event_type": "product_view",
            "raw_events": 9400,
            "unique_events": 9160,
            "duplicate_retries": 240,
            "unique_customers": 480
          }
        ]
      }
    },
    {
      "id": "sec-orden-ventana-identidad",
      "heading": "Orden secuencial, ventana temporal y asociación retroactiva",
      "body": "Agrupar por cliente no basta. Un embudo abierto sin límite de tiempo otorga el mismo valor a quien compra el primer día que a quien tarda dos años, ocultando el deterioro de las campañas recientes.\n\nPara medir la velocidad de activación definimos un **embudo de conversión por ventana** con dos reglas estrictas:\n\n1. **Orden cronológico**: el paso $k$ debe ocurrir en o después del paso $k-1$ ($t_1 \\le t_2 \\le \\dots \\le t_k$).\n\n2. **Ventana máxima ($W$)**: el tiempo entre el hito inicial y el paso $k$ no puede superar el umbral fijado ($t_k - t_1 \\le W$).\n\nAl aplicar esta regla en **Mercado Brisa** surge una trampa clásica de analítica de producto: la **asociación retroactiva de identidad**. Cuando un visitante anónimo se registra, el sistema vincula sus eventos pasados con su nuevo `customer_id`. Si calculas `MIN(event_date)` sobre todo el historial sin exigir `event_date >= signup_date`, el primer evento cae antes del alta y la diferencia `DATEDIFF('day', signup_date, first_event_date)` resulta negativa, descartando erróneamente a más del `88 %` de los usuarios activados.",
      "example": {
        "language": "sql",
        "code": "WITH dedup_events AS (\n  SELECT DISTINCT\n    event_id,\n    customer_id,\n    CAST(event_ts AS DATE) AS event_date\n  FROM events\n  WHERE customer_id IS NOT NULL\n),\ncustomer_first_touch AS (\n  SELECT\n    c.customer_id,\n    c.segment,\n    c.signup_date,\n    MIN(e.event_date) AS naive_first_event_date,\n    MIN(e.event_date) FILTER (WHERE e.event_date >= c.signup_date) AS post_signup_first_event_date\n  FROM customers c\n  LEFT JOIN dedup_events e ON c.customer_id = e.customer_id\n  GROUP BY c.customer_id, c.segment, c.signup_date\n)\nSELECT\n  segment,\n  COUNT(*) AS signups,\n  COUNT(*) FILTER (\n    WHERE DATEDIFF('day', signup_date, naive_first_event_date) BETWEEN 0 AND 30\n  ) AS naive_activated_30d,\n  COUNT(*) FILTER (\n    WHERE DATEDIFF('day', signup_date, post_signup_first_event_date) BETWEEN 0 AND 30\n  ) AS valid_activated_30d\nFROM customer_first_touch\nGROUP BY segment\nORDER BY signups DESC, 1 ASC;",
        "expectedOutput": [
          {
            "segment": "retail",
            "signups": 967,
            "naive_activated_30d": 58,
            "valid_activated_30d": 499
          },
          {
            "segment": "pro_barista",
            "signups": 966,
            "naive_activated_30d": 56,
            "valid_activated_30d": 514
          },
          {
            "segment": "cafeteria_b2b",
            "signups": 467,
            "naive_activated_30d": 31,
            "valid_activated_30d": 255
          }
        ]
      }
    },
    {
      "id": "sec-cuellos-botella-segmento",
      "heading": "Tasas de paso, caída relativa y detección de cuellos de botella",
      "body": "Una vez calculados los conteos acumulados $N_1 \\ge N_2 \\ge N_3 \\ge N_4$, distinguimos dos familias de métricas complementarias.\n\nLa **tasa de conversión global** ($N_k / N_1$) resume la eficiencia de extremo a extremo del flujo. Por su parte, la **tasa de conversión por paso** ($r_{k-1 \\to k} = N_k / N_{k-1}$) y su inverso, la tasa de abandono del paso ($1 - r_{k-1 \\to k}$), aíslan en qué transición exacta se pierde el usuario.\n\nAl desglosar el embudo de **Mercado Brisa** por `segment` (`retail`, `pro_barista` y `cafeteria_b2b`), observamos que los tres segmentos avanzan de la activación (`s2_active_30d`) a la intención de compra (`s3_intent_60d`) con tasas similares de entre el `63,13 %` y el `65,95 %`.\n\nSin embargo, en el cierre entre la intención y el primer pedido completado (`conv_s3_to_s4_pct`), `pro_barista` convierte el `62,54 %`, mientras `cafeteria_b2b` cae al `52,41 %` (`47,59 %` de abandono). El problema del segmento B2B no está en el interés por el catálogo, sino en la fricción de pago y facturación del checkout."
    }
  ],
  "workedExample": {
    "title": "Diagnóstico del embudo post-registro por segmento en Mercado Brisa",
    "description": "Construimos paso a paso el embudo post-registro de Mercado Brisa por segmento, verificando el volumen de usuarios en cada etapa y localizando dónde se produce la mayor caída.",
    "audit": "Cada paso del embudo encadena las condiciones de todos los pasos previos. Así garantizamos que ningún usuario aparezca en el paso 4 sin haber cumplido en orden los pasos 2 y 3 dentro de sus ventanas.",
    "steps": [
      {
        "label": "Paso 1: Aislar eventos post-registro deduplicados y fechas de hito por cliente",
        "explanation": "Unimos events con customers exigiendo CAST(e.event_ts AS DATE) >= c.signup_date, deduplicamos por event_id y extraemos la primera fecha de actividad general y la primera fecha de intención comercial (add_to_cart o checkout_started).",
        "code": "WITH post_signup_events AS (\n  SELECT DISTINCT\n    e.event_id,\n    e.customer_id,\n    CAST(e.event_ts AS DATE) AS event_date,\n    e.event_type\n  FROM events e\n  JOIN customers c ON e.customer_id = c.customer_id\n  WHERE CAST(e.event_ts AS DATE) >= c.signup_date\n)\nSELECT\n  COUNT(DISTINCT customer_id) AS customers_with_post_events,\n  COUNT(DISTINCT customer_id) FILTER (\n    WHERE event_type IN ('add_to_cart', 'checkout_started')\n  ) AS customers_with_intent\nFROM post_signup_events;",
        "expectedOutput": [
          {
            "customers_with_post_events": 2400,
            "customers_with_intent": 2280
          }
        ]
      },
      {
        "label": "Paso 2: Cruzar hitos de eventos con el primer pedido completado bajo ventanas de 30 y 60 días",
        "explanation": "Obtenemos la primera compra con status = 'completed' de cada cliente en orders y contamos cuántos usuarios cumplen el orden cronológico estricto (signup <= active <= intent <= order) dentro de las ventanas definidas.",
        "code": "WITH post_signup_events AS (\n  SELECT DISTINCT\n    e.event_id,\n    e.customer_id,\n    CAST(e.event_ts AS DATE) AS event_date,\n    e.event_type\n  FROM events e\n  JOIN customers c ON e.customer_id = c.customer_id\n  WHERE CAST(e.event_ts AS DATE) >= c.signup_date\n),\ncust_events AS (\n  SELECT\n    customer_id,\n    MIN(event_date) AS first_active_date,\n    MIN(event_date) FILTER (\n      WHERE event_type IN ('add_to_cart', 'checkout_started')\n    ) AS first_intent_date\n  FROM post_signup_events\n  GROUP BY customer_id\n),\ncust_orders AS (\n  SELECT\n    customer_id,\n    MIN(order_date) AS first_order_date\n  FROM orders\n  WHERE status = 'completed'\n  GROUP BY customer_id\n)\nSELECT\n  c.segment,\n  COUNT(*) AS s1_signups,\n  COUNT(*) FILTER (\n    WHERE ce.first_active_date IS NOT NULL\n      AND DATEDIFF('day', c.signup_date, ce.first_active_date) <= 30\n  ) AS s2_active_30d,\n  COUNT(*) FILTER (\n    WHERE ce.first_active_date IS NOT NULL\n      AND DATEDIFF('day', c.signup_date, ce.first_active_date) <= 30\n      AND ce.first_intent_date >= ce.first_active_date\n      AND DATEDIFF('day', c.signup_date, ce.first_intent_date) <= 60\n  ) AS s3_intent_60d,\n  COUNT(*) FILTER (\n    WHERE ce.first_active_date IS NOT NULL\n      AND DATEDIFF('day', c.signup_date, ce.first_active_date) <= 30\n      AND ce.first_intent_date >= ce.first_active_date\n      AND DATEDIFF('day', c.signup_date, ce.first_intent_date) <= 60\n      AND co.first_order_date >= ce.first_intent_date\n      AND DATEDIFF('day', c.signup_date, co.first_order_date) <= 60\n  ) AS s4_ordered_60d\nFROM customers c\nLEFT JOIN cust_events ce ON c.customer_id = ce.customer_id\nLEFT JOIN cust_orders co ON c.customer_id = co.customer_id\nGROUP BY c.segment\nORDER BY s1_signups DESC, 1 ASC;",
        "expectedOutput": [
          {
            "segment": "retail",
            "s1_signups": 967,
            "s2_active_30d": 499,
            "s3_intent_60d": 315,
            "s4_ordered_60d": 176
          },
          {
            "segment": "pro_barista",
            "s1_signups": 966,
            "s2_active_30d": 514,
            "s3_intent_60d": 339,
            "s4_ordered_60d": 212
          },
          {
            "segment": "cafeteria_b2b",
            "s1_signups": 467,
            "s2_active_30d": 255,
            "s3_intent_60d": 166,
            "s4_ordered_60d": 87
          }
        ]
      }
    ]
  },
  "checks": [
    {
      "id": "chk-da3-prod-01-dedup",
      "type": "mcq",
      "prompt": "¿Qué ocurre si calculas la conversión de un embudo dividiendo el conteo de filas crudas de checkout_completed entre el conteo de filas crudas de add_to_cart en la tabla events?",
      "options": [
        {
          "id": "a",
          "text": "Obtienes la tasa exacta de conversión por cliente si el volumen de eventos supera las 50.000 filas.",
          "correct": false,
          "feedback": "Incorrecto. El tamaño muestral no corrige el cambio de grano entre filas de eventos y usuarios únicos."
        },
        {
          "id": "b",
          "text": "Mezclas el grano de evento con el de usuario e inflas o distorsionas la métrica por reintentos de red y carritos múltiples.",
          "correct": true,
          "feedback": "Correcto. Un usuario puede disparar varios add_to_cart y existen 1.200 filas duplicadas por reintento; el embudo debe evaluarse sobre clientes o sesiones únicas."
        },
        {
          "id": "c",
          "text": "DuckDB lanza un error sintáctico porque COUNT(*) no puede aplicarse sobre columnas de texto.",
          "correct": false,
          "feedback": "Incorrecto. La consulta es sintácticamente válida en SQL, pero produce una métrica conceptualmente errónea."
        }
      ],
      "explanation": "En analítica de producto el denominador y el numerador de un paso del embudo deben compartir el mismo grano de entidad (usuario o sesión), previa deduplicación de eventos técnicos."
    },
    {
      "id": "chk-da3-prod-01-retro",
      "type": "predict-output",
      "prompt": "Un cliente se registra el 2024-05-10, pero tiene un evento anónimo previo vinculado del 2024-05-02 y su primera visita post-registro el 2024-05-12. Si calculas MIN(event_date) sin filtrar event_date >= signup_date, ¿cuánto vale DATEDIFF('day', signup_date, min_event_date)?",
      "options": [
        {
          "id": "a",
          "text": "-8 (y el cliente queda excluido erróneamente de la ventana BETWEEN 0 AND 30)",
          "correct": true,
          "feedback": "Correcto. Entre 2024-05-10 y 2024-05-02 hay -8 días; al caer fuera del rango 0..30, el cliente activo se pierde del embudo."
        },
        {
          "id": "b",
          "text": "2 (porque MIN() ignora automáticamente fechas anteriores a la clave foránea)",
          "correct": false,
          "feedback": "Incorrecto. MIN() no conoce la semántica de signup_date a menos que incluyas un filtro explícito."
        },
        {
          "id": "c",
          "text": "NULL (porque DATEDIFF devuelve NULL cuando la segunda fecha es menor)",
          "correct": false,
          "feedback": "Incorrecto. En DuckDB DATEDIFF devuelve un entero negativo cuando la fecha final es anterior a la inicial."
        }
      ],
      "explanation": "La función MIN(event_date) selecciona el 2024-05-02. Al evaluar DATEDIFF('day', DATE '2024-05-10', DATE '2024-05-02') el resultado es -8, lo que exige filtrar event_date >= signup_date antes de agregar."
    },
    {
      "id": "chk-da3-prod-01-order",
      "type": "order",
      "prompt": "Ordena la secuencia lógica para construir en SQL un embudo de conversión estricto por cliente sin fugas de grano:",
      "items": [
        "Deduplicar eventos por event_id y filtrar interacciones ocurridas en o después de signup_date.",
        "Agregar al grano de customer_id obteniendo el primer timestamp de cada paso con MIN() FILTER.",
        "Verificar orden cronológico (t_k >= t_{k-1}) y ventana máxima con DATEDIFF respecto al alta.",
        "Agregar por segmento y calcular tasas de conversión paso a paso y global."
      ],
      "correctOrder": [
        "Deduplicar eventos por event_id y filtrar interacciones ocurridas en o después de signup_date.",
        "Agregar al grano de customer_id obteniendo el primer timestamp de cada paso con MIN() FILTER.",
        "Verificar orden cronológico (t_k >= t_{k-1}) y ventana máxima con DATEDIFF respecto al alta.",
        "Agregar por segmento y calcular tasas de conversión paso a paso y global."
      ],
      "explanation": "Primero limpiamos duplicados y eventos pre-registro, luego colapsamos al grano de un registro por cliente, aplicamos las reglas de secuencia y ventana, y finalmente calculamos los porcentajes por segmento."
    }
  ],
  "practice": {
    "type": "sql",
    "title": "Embudo estricto de 4 pasos por segmento en Mercado Brisa",
    "language": "sql",
    "prompt": "Completa la consulta para obtener el embudo estricto de 4 pasos por `segment` en **Mercado Brisa**: `s1_signups`, `s2_active_30d` (primer evento post-registro en <= 30 días), `s3_intent_60d` (cumple el paso 2 y registra `add_to_cart` o `checkout_started` en o después de `first_active_date` y en <= 60 días desde `signup_date`) y `s4_ordered_60d` (cumple el paso 3 y completa un pedido `status = 'completed'` en o después de `first_intent_date` y en <= 60 días desde `signup_date`). Calcula además `conv_s2_to_s3_pct`, `conv_s3_to_s4_pct` y `overall_conv_pct` redondeados a 2 decimales, ordenando por `s1_signups DESC`.",
    "starterCode": "WITH post_signup_events AS (\n  SELECT DISTINCT\n    e.event_id,\n    e.customer_id,\n    CAST(e.event_ts AS DATE) AS event_date,\n    e.event_type\n  FROM events e\n  JOIN customers c ON e.customer_id = c.customer_id\n  -- TODO 1: Filtra solo eventos ocurridos en o después de c.signup_date\n),\ncust_events AS (\n  SELECT\n    customer_id,\n    MIN(event_date) AS first_active_date,\n    MIN(event_date) FILTER (\n      WHERE event_type IN ('add_to_cart', 'checkout_started')\n    ) AS first_intent_date\n  FROM post_signup_events\n  GROUP BY customer_id\n),\ncust_orders AS (\n  SELECT\n    customer_id,\n    MIN(order_date) AS first_order_date\n  FROM orders\n  WHERE status = 'completed'\n  GROUP BY customer_id\n),\nfunnel_counts AS (\n  SELECT\n    c.segment,\n    COUNT(*) AS s1_signups,\n    COUNT(*) FILTER (\n      WHERE ce.first_active_date IS NOT NULL\n        AND DATEDIFF('day', c.signup_date, ce.first_active_date) <= 30\n    ) AS s2_active_30d,\n    -- TODO 2: Calcula s3_intent_60d y s4_ordered_60d exigiendo orden secuencial y ventana <= 60 días\n    0 AS s3_intent_60d,\n    0 AS s4_ordered_60d\n  FROM customers c\n  LEFT JOIN cust_events ce ON c.customer_id = ce.customer_id\n  LEFT JOIN cust_orders co ON c.customer_id = co.customer_id\n  GROUP BY c.segment\n)\nSELECT\n  segment,\n  s1_signups,\n  s2_active_30d,\n  s3_intent_60d,\n  s4_ordered_60d,\n  ROUND(100.0 * s3_intent_60d / s2_active_30d, 2) AS conv_s2_to_s3_pct,\n  ROUND(100.0 * s4_ordered_60d / NULLIF(s3_intent_60d, 0), 2) AS conv_s3_to_s4_pct,\n  ROUND(100.0 * s4_ordered_60d / s1_signups, 2) AS overall_conv_pct\nFROM funnel_counts\nORDER BY s1_signups DESC;",
    "expected": "WITH post_signup_events AS (\n  SELECT DISTINCT\n    e.event_id,\n    e.customer_id,\n    CAST(e.event_ts AS DATE) AS event_date,\n    e.event_type\n  FROM events e\n  JOIN customers c ON e.customer_id = c.customer_id\n  WHERE CAST(e.event_ts AS DATE) >= c.signup_date\n),\ncust_events AS (\n  SELECT\n    customer_id,\n    MIN(event_date) AS first_active_date,\n    MIN(event_date) FILTER (\n      WHERE event_type IN ('add_to_cart', 'checkout_started')\n    ) AS first_intent_date\n  FROM post_signup_events\n  GROUP BY customer_id\n),\ncust_orders AS (\n  SELECT\n    customer_id,\n    MIN(order_date) AS first_order_date\n  FROM orders\n  WHERE status = 'completed'\n  GROUP BY customer_id\n),\nfunnel_counts AS (\n  SELECT\n    c.segment,\n    COUNT(*) AS s1_signups,\n    COUNT(*) FILTER (\n      WHERE ce.first_active_date IS NOT NULL\n        AND DATEDIFF('day', c.signup_date, ce.first_active_date) <= 30\n    ) AS s2_active_30d,\n    COUNT(*) FILTER (\n      WHERE ce.first_active_date IS NOT NULL\n        AND DATEDIFF('day', c.signup_date, ce.first_active_date) <= 30\n        AND ce.first_intent_date >= ce.first_active_date\n        AND DATEDIFF('day', c.signup_date, ce.first_intent_date) <= 60\n    ) AS s3_intent_60d,\n    COUNT(*) FILTER (\n      WHERE ce.first_active_date IS NOT NULL\n        AND DATEDIFF('day', c.signup_date, ce.first_active_date) <= 30\n        AND ce.first_intent_date >= ce.first_active_date\n        AND DATEDIFF('day', c.signup_date, ce.first_intent_date) <= 60\n        AND co.first_order_date >= ce.first_intent_date\n        AND DATEDIFF('day', c.signup_date, co.first_order_date) <= 60\n    ) AS s4_ordered_60d\n  FROM customers c\n  LEFT JOIN cust_events ce ON c.customer_id = ce.customer_id\n  LEFT JOIN cust_orders co ON c.customer_id = co.customer_id\n  GROUP BY c.segment\n)\nSELECT\n  segment,\n  s1_signups,\n  s2_active_30d,\n  s3_intent_60d,\n  s4_ordered_60d,\n  ROUND(100.0 * s3_intent_60d / s2_active_30d, 2) AS conv_s2_to_s3_pct,\n  ROUND(100.0 * s4_ordered_60d / s3_intent_60d, 2) AS conv_s3_to_s4_pct,\n  ROUND(100.0 * s4_ordered_60d / s1_signups, 2) AS overall_conv_pct\nFROM funnel_counts\nORDER BY s1_signups DESC;",
    "expectedOutputTable": [
      {
        "segment": "retail",
        "s1_signups": 967,
        "s2_active_30d": 499,
        "s3_intent_60d": 315,
        "s4_ordered_60d": 176,
        "conv_s2_to_s3_pct": 63.13,
        "conv_s3_to_s4_pct": 55.87,
        "overall_conv_pct": 18.2
      },
      {
        "segment": "pro_barista",
        "s1_signups": 966,
        "s2_active_30d": 514,
        "s3_intent_60d": 339,
        "s4_ordered_60d": 212,
        "conv_s2_to_s3_pct": 65.95,
        "conv_s3_to_s4_pct": 62.54,
        "overall_conv_pct": 21.95
      },
      {
        "segment": "cafeteria_b2b",
        "s1_signups": 467,
        "s2_active_30d": 255,
        "s3_intent_60d": 166,
        "s4_ordered_60d": 87,
        "conv_s2_to_s3_pct": 65.1,
        "conv_s3_to_s4_pct": 52.41,
        "overall_conv_pct": 18.63
      }
    ],
    "orderMatters": true,
    "hints": [
      "En post_signup_events añade WHERE CAST(e.event_ts AS DATE) >= c.signup_date para excluir eventos anónimos previos al registro.",
      "Para s3_intent_60d incluye todas las condiciones de s2_active_30d y añade AND ce.first_intent_date >= ce.first_active_date AND DATEDIFF('day', c.signup_date, ce.first_intent_date) <= 60.",
      "Para s4_ordered_60d encadena las condiciones de s3_intent_60d y añade AND co.first_order_date >= ce.first_intent_date AND DATEDIFF('day', c.signup_date, co.first_order_date) <= 60."
    ],
    "solution": "WITH post_signup_events AS (\n  SELECT DISTINCT\n    e.event_id,\n    e.customer_id,\n    CAST(e.event_ts AS DATE) AS event_date,\n    e.event_type\n  FROM events e\n  JOIN customers c ON e.customer_id = c.customer_id\n  WHERE CAST(e.event_ts AS DATE) >= c.signup_date\n),\ncust_events AS (\n  SELECT\n    customer_id,\n    MIN(event_date) AS first_active_date,\n    MIN(event_date) FILTER (\n      WHERE event_type IN ('add_to_cart', 'checkout_started')\n    ) AS first_intent_date\n  FROM post_signup_events\n  GROUP BY customer_id\n),\ncust_orders AS (\n  SELECT\n    customer_id,\n    MIN(order_date) AS first_order_date\n  FROM orders\n  WHERE status = 'completed'\n  GROUP BY customer_id\n),\nfunnel_counts AS (\n  SELECT\n    c.segment,\n    COUNT(*) AS s1_signups,\n    COUNT(*) FILTER (\n      WHERE ce.first_active_date IS NOT NULL\n        AND DATEDIFF('day', c.signup_date, ce.first_active_date) <= 30\n    ) AS s2_active_30d,\n    COUNT(*) FILTER (\n      WHERE ce.first_active_date IS NOT NULL\n        AND DATEDIFF('day', c.signup_date, ce.first_active_date) <= 30\n        AND ce.first_intent_date >= ce.first_active_date\n        AND DATEDIFF('day', c.signup_date, ce.first_intent_date) <= 60\n    ) AS s3_intent_60d,\n    COUNT(*) FILTER (\n      WHERE ce.first_active_date IS NOT NULL\n        AND DATEDIFF('day', c.signup_date, ce.first_active_date) <= 30\n        AND ce.first_intent_date >= ce.first_active_date\n        AND DATEDIFF('day', c.signup_date, ce.first_intent_date) <= 60\n        AND co.first_order_date >= ce.first_intent_date\n        AND DATEDIFF('day', c.signup_date, co.first_order_date) <= 60\n    ) AS s4_ordered_60d\n  FROM customers c\n  LEFT JOIN cust_events ce ON c.customer_id = ce.customer_id\n  LEFT JOIN cust_orders co ON c.customer_id = co.customer_id\n  GROUP BY c.segment\n)\nSELECT\n  segment,\n  s1_signups,\n  s2_active_30d,\n  s3_intent_60d,\n  s4_ordered_60d,\n  ROUND(100.0 * s3_intent_60d / s2_active_30d, 2) AS conv_s2_to_s3_pct,\n  ROUND(100.0 * s4_ordered_60d / s3_intent_60d, 2) AS conv_s3_to_s4_pct,\n  ROUND(100.0 * s4_ordered_60d / s1_signups, 2) AS overall_conv_pct\nFROM funnel_counts\nORDER BY s1_signups DESC;",
    "solutionExplanation": "La consulta filtra eventos posteriores al alta, colapsa fechas mínimas al grano de cliente y encadena condiciones crecientes en cada FILTER. Así revela que pro_barista logra el mayor cierre global (21,95 %) mientras cafeteria_b2b sufre la caída más pronunciada entre intención y compra (conv_s3_to_s4_pct = 52,41 %)."
  },
  "roleNotes": {
    "de": "Garantiza que el pipeline de ingesta preserve el identificador event_id para deduplicar reintentos de red móvil y mantenga separados los timestamps crudos de las tablas de identidad retroactiva en el almacén analítico.",
    "da": "Exige siempre una ventana temporal explícita en cada paso del embudo y verifica que el filtro event_date >= signup_date preceda al cálculo de MIN() para no descartar usuarios con navegación previa al alta.",
    "bi": "En los tableros ejecutivos presenta juntas la tasa global acumulada y las tasas de transición paso a paso desglosadas por segmento comercial para visibilizar los cuellos de botella operativos ante el equipo de producto."
  },
  "summary": [
    "Un embudo de conversión mide el avance de clientes o sesiones únicas, nunca el volumen bruto de eventos sin deduplicar.",
    "La asociación retroactiva exige filtrar eventos ocurridos desde signup_date antes de evaluar el primer hito post-registro.",
    "Un embudo secuencial por ventana impone tanto el orden cronológico entre etapas como un plazo máximo desde el alta.",
    "Las tasas paso a paso aíslan cuellos de botella específicos, como la caída de checkout del segmento B2B en Mercado Brisa."
  ],
  "flashcards": [
    {
      "id": "fc-da3-prod-01-01",
      "front": "¿Por qué debe filtrarse event_date >= signup_date antes de aplicar MIN(event_date) en un embudo de activación post-registro?",
      "back": "Porque los eventos anónimos previos al alta se vinculan retroactivamente al customer_id; sin ese filtro, MIN() devuelve una fecha anterior al registro y rompe el cálculo de la ventana."
    },
    {
      "id": "fc-da3-prod-01-02",
      "front": "¿Qué diferencia existe entre la tasa de conversión global y la tasa de conversión por paso en un embudo?",
      "back": "La tasa global divide el paso k entre el paso 1 inicial (N_k / N_1), mientras la tasa por paso divide el paso k entre el paso inmediato anterior (N_k / N_{k-1}) para localizar el cuello de botella."
    },
    {
      "id": "fc-da3-prod-01-03",
      "front": "¿Por qué cada paso k de un embudo estricto en SQL debe repetir las condiciones booleanas de los pasos 1 a k-1?",
      "back": "Para garantizar monotonicidad (N_1 >= N_2 >= ... >= N_k) y asegurar que solo cuenten en el paso k quienes completaron todos los pasos previos en orden y en plazo."
    }
  ],
  "glossaryTerms": [
    "embudo-conversion-ventana",
    "tasa-conversion-paso",
    "identidad-retroactiva-eventos"
  ],
  "sources": [
    {
      "title": "Funnels — Product Analytics Documentation",
      "url": "https://posthog.com/docs/product-analytics/funnels",
      "publisher": "PostHog",
      "accessed": "2026-10-29",
      "supports": "Orden secuencial estricto, ventanas temporales de conversión y cálculo de tasas de paso y abandono por usuario único."
    },
    {
      "title": "FILTER Clause — DuckDB SQL Query Syntax",
      "url": "https://duckdb.org/docs/sql/query_syntax/filter.html",
      "publisher": "DuckDB Foundation",
      "accessed": "2026-10-29",
      "supports": "Agregación condicional con COUNT(*) FILTER y MIN() FILTER para construir embudos en una sola pasada."
    },
    {
      "title": "Date Functions — DuckDB SQL Documentation",
      "url": "https://duckdb.org/docs/sql/functions/date.html",
      "publisher": "DuckDB Foundation",
      "accessed": "2026-10-29",
      "supports": "Cálculo de diferencias temporales entre hitos del embudo mediante DATEDIFF."
    },
    {
      "title": "Lifecycle Insights — Product Analytics Documentation",
      "url": "https://posthog.com/docs/product-analytics/lifecycle",
      "publisher": "PostHog",
      "accessed": "2026-10-29",
      "supports": "Separación entre eventos previos al registro y activación efectiva de nuevos usuarios."
    }
  ],
  "aiNotes": "Guía al estudiante para distinguir el grano de evento del grano de cliente en events. Si su consulta devuelve muy pocos activados (58 en retail), pídele verificar si filtró CAST(e.event_ts AS DATE) >= c.signup_date antes de aplicar MIN(event_date)."
};

export default lesson;
