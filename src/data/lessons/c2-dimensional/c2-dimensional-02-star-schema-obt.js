// Lección migrada al esquema v2 mediante scripts/migrate-legacy.mjs
const lesson = {
  "id": "c2-dimensional-02-star-schema-obt",
  "moduleId": "c2-dimensional",
  "tracks": [
    "core"
  ],
  "level": 2,
  "order": 2,
  "title": "Esquema en estrella frente a tabla ancha (OBT)",
  "minutes": 25,
  "prerequisites": [
    "c2-dimensional-01"
  ],
  "contentVersion": 1,
  "hook": "En Mercado Brisa (empresa ficticia), los tableros de ventas consultaban directamente la base PostgreSQL transaccional normalizada en 14 tablas (`orders`, `payments`, `customers`, `addresses`, `stores`). Durante el cierre mensual, una consulta que unía 11 tablas bloqueó el cobro en caja durante cuatro minutos. Al separar el almacén analítico, el equipo debate dos diseños: un esquema en estrella (`fact_orders` con dimensiones conformadas) o una tabla ancha desnormalizada (`obt_orders`). ¿Cuándo conviene cada uno?",
  "objectives": [
    "Separar cargas transaccionales (OLTP en 3FN) de modelos analíticos (OLAP dimensional).",
    "Diseñar una tabla de hechos con claves sustitutas y dimensiones conformadas en esquema en estrella.",
    "Evaluar el costo de almacenamiento, actualización y cómputo entre esquema en estrella y OBT."
  ],
  "sections": [
    {
      "id": "oltp-en-tercera-forma-normal-frente-a-olap-anali",
      "heading": "OLTP en tercera forma normal frente a OLAP analítico",
      "body": "Los sistemas **OLTP (Online Transaction Processing)** como PostgreSQL o MySQL de producción están diseñados para procesar miles de lecturas y escrituras puntuales por segundo (`INSERT INTO orders`, `UPDATE accounts SET balance = ... WHERE id = 99`). Para evitar anomalías de escritura y no repetir datos, utilizan la **Tercera Forma Normal (3NF)**: la ciudad vive en `cities`, el país en `countries` y el segmento en `account_tiers`.\nEn cambio, los sistemas **OLAP (Online Analytical Processing)** están diseñados para responder preguntas agregadas leyendo millones de filas pero solo unas pocas columnas (`SELECT country, SUM(net_amount) FROM ... GROUP BY country`). Ejecutar cargas OLAP sobre una base OLTP en 3NF obliga a realizar docenas de `JOINs` costosos en tiempo real y compite por CPU, memoria y bloqueos (locks) con los clientes que intentan pagar en tu aplicación.",
      "interactive": {
        "component": "star-vs-obt-sim",
        "caption": "Simulador interactivo: Esquema en estrella frente a tabla ancha (OBT)"
      }
    },
    {
      "id": "esquema-en-estrella-de-kimball-hechos-dimensione",
      "heading": "Esquema en estrella de Kimball: hechos, dimensiones y matriz de bus",
      "body": "El **Modelado Dimensional de Kimball** reorganiza el caos de 3NF en una estructura en forma de estrella pensada para ser entendida por humanos y optimizada para consultas:\n- **Tablas de Hechos (Fact Tables, prefijo `fct_`)**: están en el centro de la estrella. Guardan mediciones cuantitativas de eventos de negocio (`net_amount_usd`, `quantity`, `discount_usd`) y claves foráneas (`customer_sk`, `product_sk`, `date_key`). Crecen rápidamente en filas pero son estrechas en columnas. Pueden ser *Transaccionales* (1 fila por evento), *Periodic Snapshots* (1 fila por cuenta al cierre de cada mes) o *Accumulating Snapshots* (1 fila por el ciclo de vida de un pedido desde compra hasta entrega).\n- **Tablas de Dimensión (Dimension Tables, prefijo `dim_`)**: son las puntas de la estrella. Contienen los atributos descriptivos (`quién`, `qué`, `dónde`, `cuándo`) que usamos en las cláusulas `WHERE` y `GROUP BY`. Desnormalizan las jerarquías de 3NF (por ejemplo, `dim_customer` ya incluye `city_name`, `country_name` y `region_name` en la misma tabla).\n- **Dimensiones Conformadas (Conformed Dimensions) y Bus Matrix**: cuando Finanzas, Producto y Marketing comparten exactamente la misma tabla `dim_customer` y `dim_calendar`, sus reportes son 100% compatibles entre sí.",
      "example": {
        "language": "sql",
        "code": "-- 1. En Capa Silver mantenemos el Star Schema limpio (fct_orders + dim_customer + dim_merchant)\n-- 2. En Capa Gold exponemos obt_orders_analytics (Parquet columnar comprimido con RLE/Dictionary):\nSELECT\n  customer_country_name,\n  merchant_industry_label,\n  customer_plan_tier_at_order,\n  COUNT(order_id) AS total_orders,\n  SUM(net_revenue_usd) AS net_revenue_usd\nFROM gold.obt_orders_analytics\nWHERE order_date >= DATE '2026-10-01'\n  AND order_date <  DATE '2026-11-01'\nGROUP BY ALL;",
        "expectedOutput": [
          {
            "tablas_unidas": "1 tabla Gold OBT (0 Joins en lectura)",
            "riesgo_operativo": "Cero (Desacoplado de OLTP, compresión Dictionary 7.2x)",
            "latencia_p95": "0.06 segundos (60 ms)"
          }
        ]
      }
    },
    {
      "id": "cuando-usar-una-tabla-ancha-obt-en-motores-colum",
      "heading": "Cuándo usar una tabla ancha (OBT) en motores columnares con RLE",
      "body": "Cuando Kimball formuló el Star Schema en los años 90, el almacenamiento en disco era carísimo y las bases de datos guardaban datos por filas: repetir `\"Estados Unidos\"` o `\"Enterprise\"` 100 millones de veces en la tabla de hechos habría desperdiciado terabytes. Pero en 2026 almacenamos datos en formatos columnares como **Apache Parquet** dentro de tablas **Apache Iceberg**.\nGracias a las técnicas **Dictionary Encoding** (que reemplaza `\"Enterprise\"` por el entero `1` en un diccionario local) y **Run-Length Encoding (RLE)** (que guarda `\"el valor 1 se repite 80,000 veces seguidas\"`), incrustar todos los atributos dimensionales directamente dentro de una **One Big Table (OBT)** apenas añade un 8%–12% de espacio en disco, a cambio de eliminar por completo los costosos *Shuffle Joins* en tiempo de consulta."
    },
    {
      "id": "arquitectura-hibrida-esquema-en-estrella-en-silv",
      "heading": "Arquitectura híbrida: esquema en estrella en silver y OBT en gold",
      "body": "En lugar de tratar Star Schema y OBT como religiones opuestas, los equipos modernos combinan ambos en su arquitectura Medallion:\n- **En la capa Silver (Core / Gobernanza)**: mantenemos un **Star Schema disciplinado** (`fct_orders`, `dim_customer_scd2`, `dim_product`). ¿Por qué? Porque si un producto cambia de categoría o necesitamos corregir un atributo para 5 millones de clientes, actualizar solo `dim_product` (50,000 filas) es instantáneo, mientras que reescribir 10,000 millones de filas históricas en una OBT sería carísimo.\n- **En la capa Gold (Consumo / Marts)**: materializamos tablas **OBT desnormalizadas** (`obt_orders_enriched`) o vistas semánticas para los datasets de mayor concurrencia en BI y para exploración ultrarrápida en DuckDB y Polars."
    }
  ],
  "workedExample": {
    "title": "Ejemplo guiado: Esquema en estrella frente a tabla ancha (OBT)",
    "description": "Compara el dolor de consultar un modelo transaccional OLTP en 3NF (9 tablas unidas en cadena) frente a construir y consultar una tabla analítica desnormalizada (OBT) alimentada desde tu Star Schema:",
    "audit": "",
    "steps": [
      {
        "label": "Antipatrón: consulta analítica directa sobre OLTP en 3NF",
        "explanation": "Compara el dolor de consultar un modelo transaccional OLTP en 3NF (9 tablas unidas en cadena) frente a construir y consultar una tabla analítica desnormalizada (OBT) alimentada desde tu Star Schema:",
        "code": "-- MAL: Consultar directamente la base OLTP en 3NF requiere unir 9 tablas en cadena,\n-- escanea índices por filas y acopla los reportes de BI al esquema interno del backend\nSELECT\n  co.country_name,\n  ind.industry_label,\n  pl.plan_tier_name,\n  COUNT(o.id) AS total_orders,\n  SUM(o.subtotal_cents - COALESCE(o.discount_cents, 0)) / 100.0 AS net_revenue_usd\nFROM oltp_prod.orders o\nJOIN oltp_prod.users u ON o.user_id = u.id\nJOIN oltp_prod.addresses a ON u.billing_address_id = a.id\nJOIN oltp_prod.cities ci ON a.city_id = ci.id\nJOIN oltp_prod.countries co ON ci.country_id = co.id\nJOIN oltp_prod.merchants m ON o.merchant_id = m.id\nJOIN oltp_prod.industries ind ON m.industry_id = ind.id\nJOIN oltp_prod.subscriptions s ON u.id = s.user_id\nJOIN oltp_prod.plans pl ON s.plan_id = pl.id\nWHERE o.status = 'COMPLETED'\n  AND o.created_at >= '2026-10-01'\nGROUP BY 1, 2, 3;",
        "expectedOutput": [
          {
            "tablas_unidas": "9 tablas OLTP (Cadena 3NF)",
            "riesgo_operativo": "Alto (Lock contention en base de pagos + Fan-out por subscriptions)",
            "latencia_p95": "18.4 segundos"
          }
        ]
      },
      {
        "label": "Arquitectura híbrida: esquema en estrella en silver y OBT en gold",
        "explanation": "Compara ahora la consulta corregida y verifica cómo las filas y totales coinciden con la auditoría.",
        "code": "-- 1. En Capa Silver mantenemos el Star Schema limpio (fct_orders + dim_customer + dim_merchant)\n-- 2. En Capa Gold exponemos obt_orders_analytics (Parquet columnar comprimido con RLE/Dictionary):\nSELECT\n  customer_country_name,\n  merchant_industry_label,\n  customer_plan_tier_at_order,\n  COUNT(order_id) AS total_orders,\n  SUM(net_revenue_usd) AS net_revenue_usd\nFROM gold.obt_orders_analytics\nWHERE order_date >= DATE '2026-10-01'\n  AND order_date <  DATE '2026-11-01'\nGROUP BY ALL;",
        "expectedOutput": [
          {
            "tablas_unidas": "1 tabla Gold OBT (0 Joins en lectura)",
            "riesgo_operativo": "Cero (Desacoplado de OLTP, compresión Dictionary 7.2x)",
            "latencia_p95": "0.06 segundos (60 ms)"
          }
        ]
      }
    ]
  },
  "checks": [
    {
      "id": "c1",
      "type": "mcq",
      "prompt": "En una arquitectura moderna sobre Parquet/Iceberg, ¿por qué los equipos mantienen un Star Schema en la capa Silver en lugar de usar exclusivamente una única One Big Table (OBT) para todo el almacén?",
      "options": [
        {
          "id": "a",
          "text": "Porque el Star Schema en Silver permite gobernar Dimensiones Conformadas reutilizables entre múltiples procesos de negocio (ventas, soporte, marketing) y actualizar atributos dimensionales sin tener que reescribir miles de millones de filas de hechos.",
          "correct": true,
          "feedback": "Exacto. Si tienes 5 tablas de hechos distintas y un atributo de producto se corrige, en Star Schema actualizas una sola tabla pequeña (`dim_product`); la OBT se materializa en Gold solo donde el rendimiento de lectura sin joins lo justifica."
        },
        {
          "id": "b",
          "text": "Porque los archivos Parquet prohíben tener más de 10 columnas en una misma tabla.",
          "correct": false,
          "feedback": "Parquet soporta cientos o miles de columnas sin problema y de hecho brilla con Projection Pushdown en tablas anchas."
        },
        {
          "id": "c",
          "text": "Porque las consultas con 8 JOINs siempre son más rápidas que leer una sola tabla pre-unida.",
          "correct": false,
          "feedback": "Al contrario: en tiempo de lectura pura sobre una única tabla de hechos, una OBT evita el costo de los joins; la ventaja del Star Schema está en el mantenimiento, la historia SCD2 y el cruce multi-hecho."
        }
      ],
      "explanation": "Exacto. Si tienes 5 tablas de hechos distintas y un atributo de producto se corrige, en Star Schema actualizas una sola tabla pequeña (`dim_product`); la OBT se materializa en Gold solo donde el rendimiento de lectura sin joins lo justifica."
    },
    {
      "id": "c2",
      "type": "mcq",
      "prompt": "En Mercado Brisa necesitas cruzar en un mismo reporte las compras (`fact_orders`), las devoluciones (`fact_refunds`) y los tickets de soporte (`fact_tickets`) por mes y segmento de cliente. ¿Qué patrón evita el fan-out entre los tres hechos?",
      "options": [
        {
          "id": "a",
          "text": "Drill-across: agregar cada tabla de hechos por separado por mes y cliente_sk y unir los resultados contra dim_date y dim_customer.",
          "correct": true,
          "feedback": "Correcto: cada hecho se agrega primero a la granularidad común de las dimensiones conformadas antes de combinar las métricas."
        },
        {
          "id": "b",
          "text": "Unir fact_orders, fact_refunds y fact_tickets directamente con INNER JOIN por customer_sk.",
          "correct": false,
          "feedback": "Incorrecto: unir múltiples tablas de hechos por cliente produce una trampa de abismo (N×M×K filas) y corrompe las sumas."
        },
        {
          "id": "c",
          "text": "Meter pedidos, devoluciones y tickets como columnas repetidas en una sola OBT sin grano fijo.",
          "correct": false,
          "feedback": "Incorrecto: mezclar tres procesos con distinta granularidad temporal en una sola tabla rompe el contrato de grano."
        }
      ],
      "explanation": "Las dimensiones conformadas actúan como ejes comunes: agregas cada proceso de negocio a las claves de dimensión requeridas y luego combinas los subtotales sin multiplicar filas."
    },
    {
      "id": "c3",
      "type": "mcq",
      "prompt": "¿En qué escenario resulta razonable materializar una One Big Table (OBT) a partir de tu esquema en estrella?",
      "options": [
        {
          "id": "a",
          "text": "Como capa final de lectura para un único flujo de eventos inmutables donde un motor columnar filtra pocas columnas.",
          "correct": true,
          "feedback": "Correcto: sobre eventos append-only que no requieren actualizaciones frecuentes, una OBT evita el costo de JOIN en consultas exploratorias."
        },
        {
          "id": "b",
          "text": "Como única capa de almacenamiento reemplazando todas las dimensiones en una empresa con 12 áreas de negocio.",
          "correct": false,
          "feedback": "Incorrecto: eliminar las dimensiones compartidas provoca divergencia de definiciones y reescrituras masivas ante cambios de catálogo."
        },
        {
          "id": "c",
          "text": "En la base de datos PostgreSQL transaccional del carrito de compras.",
          "correct": false,
          "feedback": "Incorrecto: desnormalizar la base OLTP introduce anomalías de actualización y bloqueos en escrituras concurrentes."
        }
      ],
      "explanation": "En arquitecturas modernas, el esquema en estrella en la capa intermedia asegura consistencia y gobernanza, mientras que una OBT puede materializarse en el borde si una carga puntual lo justifica."
    }
  ],
  "practice": {
    "type": "sql",
    "title": "Margen bruto sobre esquema estrella",
    "language": "sql",
    "prompt": "Une la tabla de hechos `order_items` con `orders` (`status = 'completed'`) y las dimensiones conformadas `products` y `stores` para obtener por `region` y `category`: `total_units`, `revenue_usd` y `gross_margin_usd` (`SUM(line_total_usd - qty * unit_cost_usd)`), ordenado por `revenue_usd DESC`.",
    "starterCode": "SELECT\n  s.region,\n  p.category,\n  SUM(oi.qty) AS total_units,\n  ROUND(SUM(oi.line_total_usd), 2) AS revenue_usd,\n  -- TODO: Calcula el margen bruto redondeado a 2 decimales AS gross_margin_usd\n  0.0 AS gross_margin_usd\nFROM order_items oi\nJOIN orders o ON oi.order_id = o.order_id\nJOIN products p ON oi.product_id = p.product_id\n-- TODO: Une la dimensión stores s usando store_id\nWHERE o.status = 'completed'\nGROUP BY s.region, p.category\nORDER BY revenue_usd DESC;",
    "expected": "SELECT\n  s.region,\n  p.category,\n  SUM(oi.qty) AS total_units,\n  ROUND(SUM(oi.line_total_usd), 2) AS revenue_usd,\n  ROUND(SUM(oi.line_total_usd - oi.qty * p.unit_cost_usd), 2) AS gross_margin_usd\nFROM order_items oi\nJOIN orders o ON oi.order_id = o.order_id\nJOIN products p ON oi.product_id = p.product_id\nJOIN stores s ON o.store_id = s.store_id\nWHERE o.status = 'completed'\nGROUP BY s.region, p.category\nORDER BY revenue_usd DESC;",
    "orderMatters": true,
    "hints": [
      "Añade `JOIN stores s ON o.store_id = s.store_id` después del join con `products`.",
      "El margen bruto de cada línea es `oi.line_total_usd - oi.qty * p.unit_cost_usd`.",
      "Envuelve la suma en `ROUND(SUM(oi.line_total_usd - oi.qty * p.unit_cost_usd), 2) AS gross_margin_usd`."
    ],
    "solution": "SELECT\n  s.region,\n  p.category,\n  SUM(oi.qty) AS total_units,\n  ROUND(SUM(oi.line_total_usd), 2) AS revenue_usd,\n  ROUND(SUM(oi.line_total_usd - oi.qty * p.unit_cost_usd), 2) AS gross_margin_usd\nFROM order_items oi\nJOIN orders o ON oi.order_id = o.order_id\nJOIN products p ON oi.product_id = p.product_id\nJOIN stores s ON o.store_id = s.store_id\nWHERE o.status = 'completed'\nGROUP BY s.region, p.category\nORDER BY revenue_usd DESC;",
    "solutionExplanation": "Enlaza la tabla de hechos `order_items` con `orders` y las dimensiones conformadas `products` y `stores`. Como las dimensiones tienen relación `1:N` hacia los hechos, el cruce preserva el grano de línea de pedido."
  },
  "roleNotes": {
    "de": "Extrae cambios de la base OLTP mediante CDC (sin impactar producción), construye el Star Schema gobernado en la capa Silver con claves subrogadas (`_sk`) y materializa tablas OBT ordenadas en la capa Gold para lecturas críticas. Evalúa el trade-off de cómputo: mantiene en Star Schema las dimensiones muy volátiles y aplana en OBT los atributos estables o ya cruzados temporalmente (Point-in-Time).",
    "da": "Aprovecha las tablas OBT de la capa Gold para realizar análisis exploratorio de cohortes, regresiones y feature engineering en DuckDB o Polars sin tener que escribir 8 `LEFT JOIN` repetitivos en cada notebook. Acude al Star Schema de Silver cuando necesita cruzar múltiples tablas de hechos (ej. `fct_orders` + `fct_support_tickets` + `fct_marketing_touches`) a través de dimensiones conformadas.",
    "bi": "Diseña la **Enterprise Bus Matrix** junto a DE para garantizar que todos los departamentos filtren por las mismas Dimensiones Conformadas (`dim_date`, `dim_customer`, `dim_merchant`). Conecta motores en memoria o Direct Lake sobre el Star Schema / OBT logrando tiempos de respuesta sub-segundo en filtros cruzados."
  },
  "summary": [
    "OLTP optimiza escrituras sin redundancia (3FN); OLAP optimiza lecturas agregadas masivas.",
    "El esquema en estrella separa medidas numéricas en hechos y contexto descriptivo en dimensiones.",
    "Las dimensiones conformadas permiten cruzar múltiples procesos de negocio con definiciones consistentes.",
    "Una OBT acelera consultas sobre un único proceso pero encarece actualizaciones de atributos."
  ],
  "flashcards": [
    {
      "id": "fc-c2-star-01",
      "front": "¿Por qué se usan claves sustitutas (surrogate keys) en lugar de IDs de producción en dimensiones?",
      "back": "Aíslan el almacén de cambios en sistemas origen, integran múltiples fuentes y permiten versionar filas históricas en SCD Tipo 2."
    },
    {
      "id": "fc-c2-star-02",
      "front": "¿Qué ventaja aporta una dimensión conformada (`dim_customer`) frente a varias OBT aisladas?",
      "back": "Garantiza que Ventas, Soporte y Logística filtren y agrupen por los mismos atributos de cliente y permite cruzar hechos mediante drill-across."
    },
    {
      "id": "fc-c2-star-03",
      "front": "¿Qué ocurre en una OBT de 2 000 millones de filas cuando cambia el nombre de una categoría de producto?",
      "back": "Obliga a reescribir todos los archivos Parquet donde aparece esa categoría, mientras que en estrella solo se actualiza `dim_product`."
    }
  ],
  "glossaryTerms": [
    "c06-star-vs-obt",
    "c01-grain-fanout"
  ],
  "sources": [
    {
      "title": "The Data Warehouse Toolkit (3rd Edition) — Star Schemas and OLAP Cubes",
      "url": "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/star-schema-olap-cube/",
      "publisher": "Kimball Group",
      "accessed": "2026-10-29",
      "supports": "Separación entre tablas de hechos y dimensiones y uso de dimensiones conformadas."
    },
    {
      "title": "Kimball Group — Conformed Dimensions and Drill-Across Queries",
      "url": "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/conformed-dimension/",
      "publisher": "Kimball Group",
      "accessed": "2026-10-29",
      "supports": "Integración de múltiples tablas de hechos mediante dimensiones compartidas y drill-across."
    },
    {
      "title": "DuckDB Documentation — Parquet Storage and Columnar Projection Pushdown",
      "url": "https://duckdb.org/docs/data/parquet/overview.html",
      "publisher": "DuckDB Foundation",
      "accessed": "2026-10-29",
      "supports": "Comportamiento de motores columnares al proyectar subconjuntos de columnas en tablas anchas."
    }
  ],
  "aiNotes": "Muchos estudiantes creen que el esquema en estrella está obsoleto porque Parquet comprime columnas repetidas. Explícales que el problema de una OBT pura no es solo el espacio en disco, sino mantener dimensiones cambiantes y cruzar múltiples hechos sin fan-out.",
  "needsReview": true,
  "legacyId": "l4-star-schema-obt",
  "legacyOrder": 4,
  "stageId": "stage-2",
  "subtitle": "Cuándo modelar hechos y dimensiones separadas y cuándo desnormalizar en una sola tabla ancha.",
  "goal": "Comprender las diferencias estructurales entre sistemas transaccionales (OLTP en 3NF) y analíticos (OLAP), diseñar un Star Schema de Kimball (Hechos, Dimensiones Conformadas y Bus Matrix) y decidir cuándo desnormalizar hacia una One Big Table (OBT) en la capa Gold.",
  "pipelineChallenge": {
    "title": "Tubería híbrida de OLTP a OBT",
    "scenario": "El equipo de NovaPay necesita migrar sus reportes desde la base PostgreSQL en 3NF hacia el Lakehouse sin perder gobernanza dimensional ni velocidad de lectura. Ordena las 4 etapas del pipeline:",
    "description": "Ordena correctamente las 4 etapas del flujo de modelado moderno para desacoplar la base de datos transaccional (OLTP) de los dashboards ejecutivos de alta concurrencia:",
    "prompt": "Establece el orden correcto del pipeline desde la base transaccional en 3NF hasta el consumo en BI y ciencia de datos:",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "label": "1. Captura CDC desde OLTP (3NF) hacia bronze",
        "title": "Ingesta cruda desacoplada en bronze",
        "role": "DE",
        "layer": "Bronze",
        "detail": "Replicar los eventos de `orders`, `users`, `addresses` y `countries` desde el log WAL de PostgreSQL hacia tablas crudas Iceberg sin ejecutar joins pesados sobre producción.",
        "description": "Replicar los eventos de `orders`, `users`, `addresses` y `countries` desde el log WAL de PostgreSQL hacia tablas crudas Iceberg sin ejecutar joins pesados sobre producción."
      },
      {
        "id": "step-2",
        "order": 2,
        "label": "2. Desnormalizar jerarquías 3NF en dimensiones conformadas (silver)",
        "title": "Construcción de dimensiones conformadas en silver",
        "role": "DE",
        "layer": "Silver",
        "detail": "Aplanar las cadenas `users -> addresses -> cities -> countries` en una única dimensión `silver.dim_customer` con clave subrogada (`customer_sk`).",
        "description": "Aplanar las cadenas `users -> addresses -> cities -> countries` en una única dimensión `silver.dim_customer` con clave subrogada (`customer_sk`)."
      },
      {
        "id": "step-3",
        "order": 3,
        "label": "3. Modelar tabla de hechos con grano explícito en silver",
        "title": "Construcción de tabla de hechos",
        "role": "DA",
        "layer": "Silver",
        "detail": "Crear `silver.fct_orders` declarando el grain exacto (1 fila por pedido), calculando medidas aditivas limpias (`net_amount_usd`) y enlazando claves foráneas (`customer_sk`, `merchant_sk`).",
        "description": "Crear `silver.fct_orders` declarando el grain exacto (1 fila por pedido), calculando medidas aditivas limpias (`net_amount_usd`) y enlazando claves foráneas (`customer_sk`, `merchant_sk`)."
      },
      {
        "id": "step-4",
        "order": 4,
        "label": "4. Materializar OBT columnar y capa semántica en gold",
        "title": "Materialización de OBT en Parquet ordenado",
        "role": "BI",
        "layer": "Gold",
        "detail": "Pre-unir `fct_orders` con sus dimensiones en `gold.obt_orders_analytics` (aprovechando Dictionary Encoding en Parquet) para consultas de 0 joins en BI y notebooks.",
        "description": "Pre-unir `fct_orders` con sus dimensiones en `gold.obt_orders_analytics` (aprovechando Dictionary Encoding en Parquet) para consultas de 0 joins en BI y notebooks."
      }
    ],
    "correctOrder": [
      "step-1",
      "step-2",
      "step-3",
      "step-4"
    ],
    "options": [
      {
        "id": "pipe-hybrid",
        "text": "1) Captura CDC a Bronze → 2) Dimensiones Conformadas en Silver → 3) Tabla de Hechos en Silver → 4) OBT Columnar en Gold",
        "correct": true,
        "feedback": "Arquitectura impecable. Desacoplas el OLTP en Bronze, gobiernas el negocio con Star Schema en Silver y aceleras las lecturas masivas con OBT en Gold."
      },
      {
        "id": "pipe-direct-oltp",
        "text": "1) Conectar Power BI / Tableau en vivo a las 14 tablas 3NF de PostgreSQL → 2) Hacer los joins en el navegador del CEO",
        "correct": false,
        "feedback": "Peligroso: acopla el esquema interno de la aplicación a los reportes y degrada el rendimiento de la base transaccional."
      },
      {
        "id": "pipe-obt-only",
        "text": "1) Borrar todas las dimensiones → 2) Guardar únicamente una OBT gigante en Bronze sin claves ni tablas de dimensión en Silver",
        "correct": false,
        "feedback": "Sin dimensiones conformadas en Silver, cualquier corrección de un atributo descriptivo o cruce entre múltiples tablas de hechos se vuelve inmanejable."
      }
    ],
    "explanation": "El Star Schema en Silver actúa como columna vertebral gobernada (fácil de mantener, auditar y compartir entre procesos), mientras que la OBT en Gold ofrece velocidad extrema sin joins en motores columnares.",
    "expectedOutcome": "El Star Schema en Silver actúa como columna vertebral gobernada (fácil de mantener y auditar), mientras que la OBT en Gold ofrece velocidad extrema sin joins en motores columnares."
  },
  "relatedLessons": [
    {
      "id": "l1-joins-fanout",
      "reason": "Repasa cómo la definición estricta del Grain en la tabla de hechos previene el Fan-Out Trap al diseñar tu Star Schema."
    },
    {
      "id": "l5-scd2-history",
      "reason": "Aprende cómo versionar los cambios históricos en tus tablas de dimensión (`dim_customer_scd2`) antes de construir una OBT."
    },
    {
      "id": "l6-metrics-simpson",
      "reason": "Descubre cómo definir métricas aditivas y no aditivas encima de tu modelo dimensional."
    }
  ]
};

export default lesson;
