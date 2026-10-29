export const STAGE_2_LESSONS = [
  // ==========================================================================
  // LECCIÓN 4: OLTP vs. OLAP, STAR SCHEMA DE KIMBALL Y ONE BIG TABLE (OBT)
  // ==========================================================================
  {
    id: 'l4-star-schema-obt',
    stageId: 'stage-2',
    order: 4,
    title: 'Esquema en estrella frente a OBT',
    subtitle: 'Cuándo modelar hechos y dimensiones separadas y cuándo desnormalizar en una sola tabla ancha.',
    duration: '25 min',
    level: 'Fundamentos',
    bloomLevel: 'understand',
    coreFocus: ['DE', 'DA', 'BI'],
    goal: 'Comprender las diferencias estructurales entre sistemas transaccionales (OLTP en 3NF) y analíticos (OLAP), diseñar un Star Schema de Kimball (Hechos, Dimensiones Conformadas y Bus Matrix) y decidir cuándo desnormalizar hacia una One Big Table (OBT) en la capa Gold.',
    visualType: 'star-vs-obt-sim',
    storyContext:
      'Caso práctico: En NovaPay, el equipo de BI conectó sus tableros ejecutivos directamente a la base de datos PostgreSQL de producción (diseñada en Tercera Forma Normal con 14 tablas separadas para `orders`, `payments`, `users`, `addresses`, `cities`, `countries`, `merchants` y `plans`). A las 10:00 AM del cierre mensual, una consulta que unía 11 tablas para calcular ingresos por país e industria bloqueó las transacciones del checkout durante 4 minutos. El CTO exige separar el mundo transaccional del analítico hoy mismo. ¿Debemos construir un Star Schema clásico de Kimball o una One Big Table (OBT)?',
    sections: [
      {
        heading: 'OLTP en tercera forma normal frente a OLAP analítico',
        body: 'Los sistemas **OLTP (Online Transaction Processing)** como PostgreSQL o MySQL de producción están diseñados para procesar miles de lecturas y escrituras puntuales por segundo (`INSERT INTO orders`, `UPDATE accounts SET balance = ... WHERE id = 99`). Para evitar anomalías de escritura y no repetir datos, utilizan la **Tercera Forma Normal (3NF)**: la ciudad vive en `cities`, el país en `countries` y el segmento en `account_tiers`.\nEn cambio, los sistemas **OLAP (Online Analytical Processing)** están diseñados para responder preguntas agregadas leyendo millones de filas pero solo unas pocas columnas (`SELECT country, SUM(net_amount) FROM ... GROUP BY country`). Ejecutar cargas OLAP sobre una base OLTP en 3NF obliga a realizar docenas de `JOINs` costosos en tiempo real y compite por CPU, memoria y bloqueos (locks) con los clientes que intentan pagar en tu aplicación.',
      },
      {
        heading: 'Esquema en estrella de Kimball: hechos, dimensiones y matriz de bus',
        body: 'El **Modelado Dimensional de Kimball** reorganiza el caos de 3NF en una estructura en forma de estrella pensada para ser entendida por humanos y optimizada para consultas:\n- **Tablas de Hechos (Fact Tables, prefijo `fct_`)**: están en el centro de la estrella. Guardan mediciones cuantitativas de eventos de negocio (`net_amount_usd`, `quantity`, `discount_usd`) y claves foráneas (`customer_sk`, `product_sk`, `date_key`). Crecen rápidamente en filas pero son estrechas en columnas. Pueden ser *Transaccionales* (1 fila por evento), *Periodic Snapshots* (1 fila por cuenta al cierre de cada mes) o *Accumulating Snapshots* (1 fila por el ciclo de vida de un pedido desde compra hasta entrega).\n- **Tablas de Dimensión (Dimension Tables, prefijo `dim_`)**: son las puntas de la estrella. Contienen los atributos descriptivos (`quién`, `qué`, `dónde`, `cuándo`) que usamos en las cláusulas `WHERE` y `GROUP BY`. Desnormalizan las jerarquías de 3NF (por ejemplo, `dim_customer` ya incluye `city_name`, `country_name` y `region_name` en la misma tabla).\n- **Dimensiones Conformadas (Conformed Dimensions) y Bus Matrix**: cuando Finanzas, Producto y Marketing comparten exactamente la misma tabla `dim_customer` y `dim_calendar`, sus reportes son 100% compatibles entre sí.',
      },
      {
        heading: 'Cuándo usar una tabla ancha (OBT) en motores columnares con RLE',
        body: 'Cuando Kimball formuló el Star Schema en los años 90, el almacenamiento en disco era carísimo y las bases de datos guardaban datos por filas: repetir `"Estados Unidos"` o `"Enterprise"` 100 millones de veces en la tabla de hechos habría desperdiciado terabytes. Pero en 2026 almacenamos datos en formatos columnares como **Apache Parquet** dentro de tablas **Apache Iceberg**.\nGracias a las técnicas **Dictionary Encoding** (que reemplaza `"Enterprise"` por el entero `1` en un diccionario local) y **Run-Length Encoding (RLE)** (que guarda `"el valor 1 se repite 80,000 veces seguidas"`), incrustar todos los atributos dimensionales directamente dentro de una **One Big Table (OBT)** apenas añade un 8%–12% de espacio en disco, a cambio de eliminar por completo los costosos *Shuffle Joins* en tiempo de consulta.',
      },
      {
        heading: 'Arquitectura híbrida: esquema en estrella en silver y OBT en gold',
        body: 'En lugar de tratar Star Schema y OBT como religiones opuestas, los equipos modernos combinan ambos en su arquitectura Medallion:\n- **En la capa Silver (Core / Gobernanza)**: mantenemos un **Star Schema disciplinado** (`fct_orders`, `dim_customer_scd2`, `dim_product`). ¿Por qué? Porque si un producto cambia de categoría o necesitamos corregir un atributo para 5 millones de clientes, actualizar solo `dim_product` (50,000 filas) es instantáneo, mientras que reescribir 10,000 millones de filas históricas en una OBT sería carísimo.\n- **En la capa Gold (Consumo / Marts)**: materializamos tablas **OBT desnormalizadas** (`obt_orders_enriched`) o vistas semánticas para los datasets de mayor concurrencia en BI y para exploración ultrarrápida en DuckDB y Polars.',
      },
    ],
    triadPerspectives: {
      DE: {
        title: 'Qué hace ingeniería de datos (DE)',
        points: [
          'Extrae cambios de la base OLTP mediante CDC (sin impactar producción), construye el Star Schema gobernado en la capa Silver con claves subrogadas (`_sk`) y materializa tablas OBT ordenadas en la capa Gold para lecturas críticas.',
          'Evalúa el trade-off de cómputo: mantiene en Star Schema las dimensiones muy volátiles y aplana en OBT los atributos estables o ya cruzados temporalmente (Point-in-Time).',
        ],
      },
      DA: {
        title: 'Qué hace análisis de datos (DA)',
        points: [
          'Aprovecha las tablas OBT de la capa Gold para realizar análisis exploratorio de cohortes, regresiones y feature engineering en DuckDB o Polars sin tener que escribir 8 `LEFT JOIN` repetitivos en cada notebook.',
          'Acude al Star Schema de Silver cuando necesita cruzar múltiples tablas de hechos (ej. `fct_orders` + `fct_support_tickets` + `fct_marketing_touches`) a través de dimensiones conformadas.',
        ],
      },
      BI: {
        title: 'Qué hace business intelligence (BI)',
        points: [
          'Diseña la **Enterprise Bus Matrix** junto a DE para garantizar que todos los departamentos filtren por las mismas Dimensiones Conformadas (`dim_date`, `dim_customer`, `dim_merchant`).',
          'Conecta motores en memoria o Direct Lake sobre el Star Schema / OBT logrando tiempos de respuesta sub-segundo en filtros cruzados.',
        ],
      },
    },
    relatedLessons: [
      {
        id: 'l1-joins-fanout',
        reason: 'Repasa cómo la definición estricta del Grain en la tabla de hechos previene el Fan-Out Trap al diseñar tu Star Schema.',
      },
      {
        id: 'l5-scd2-history',
        reason: 'Aprende cómo versionar los cambios históricos en tus tablas de dimensión (`dim_customer_scd2`) antes de construir una OBT.',
      },
      {
        id: 'l6-metrics-simpson',
        reason: 'Descubre cómo definir métricas aditivas y no aditivas encima de tu modelo dimensional.',
      },
    ],
    playground: {
      description:
        'Compara el dolor de consultar un modelo transaccional OLTP en 3NF (9 tablas unidas en cadena) frente a construir y consultar una tabla analítica desnormalizada (OBT) alimentada desde tu Star Schema:',
      badQueryLabel: 'Antipatrón: consulta analítica directa sobre OLTP en 3NF',
      badQuery: `-- MAL: Consultar directamente la base OLTP en 3NF requiere unir 9 tablas en cadena,
-- escanea índices por filas y acopla los reportes de BI al esquema interno del backend
SELECT
  co.country_name,
  ind.industry_label,
  pl.plan_tier_name,
  COUNT(o.id) AS total_orders,
  SUM(o.subtotal_cents - COALESCE(o.discount_cents, 0)) / 100.0 AS net_revenue_usd
FROM oltp_prod.orders o
JOIN oltp_prod.users u ON o.user_id = u.id
JOIN oltp_prod.addresses a ON u.billing_address_id = a.id
JOIN oltp_prod.cities ci ON a.city_id = ci.id
JOIN oltp_prod.countries co ON ci.country_id = co.id
JOIN oltp_prod.merchants m ON o.merchant_id = m.id
JOIN oltp_prod.industries ind ON m.industry_id = ind.id
JOIN oltp_prod.subscriptions s ON u.id = s.user_id
JOIN oltp_prod.plans pl ON s.plan_id = pl.id
WHERE o.status = 'COMPLETED'
  AND o.created_at >= '2026-10-01'
GROUP BY 1, 2, 3;`,
      badResult: [
        {
          tablas_unidas: '9 tablas OLTP (Cadena 3NF)',
          riesgo_operativo: 'Alto (Lock contention en base de pagos + Fan-out por subscriptions)',
          latencia_p95: '18.4 segundos',
        },
      ],
      goodQueryLabel: 'Arquitectura híbrida: esquema en estrella en silver y OBT en gold',
      goodQuery: `-- 1. En Capa Silver mantenemos el Star Schema limpio (fct_orders + dim_customer + dim_merchant)
-- 2. En Capa Gold exponemos obt_orders_analytics (Parquet columnar comprimido con RLE/Dictionary):
SELECT
  customer_country_name,
  merchant_industry_label,
  customer_plan_tier_at_order,
  COUNT(order_id) AS total_orders,
  SUM(net_revenue_usd) AS net_revenue_usd
FROM gold.obt_orders_analytics
WHERE order_date >= DATE '2026-10-01'
  AND order_date <  DATE '2026-11-01'
GROUP BY ALL;`,
      goodResult: [
        {
          tablas_unidas: '1 tabla Gold OBT (0 Joins en lectura)',
          riesgo_operativo: 'Cero (Desacoplado de OLTP, compresión Dictionary 7.2x)',
          latencia_p95: '0.06 segundos (60 ms)',
        },
      ],
    },
    codeChallenge: {
      title: 'Materialización de tabla OBT desde esquema estrella',
      instruction:
        'Completa la consulta de transformación que une la tabla de hechos `silver.fct_orders` con las dimensiones conformadas `silver.dim_customer` y `silver.dim_product` mediante sus claves subrogadas (`customer_sk`, `product_sk`) y ordena físicamente la tabla resultante para optimizar la compresión RLE en Parquet.',
      description:
        'Completa la consulta de transformación que une la tabla de hechos `silver.fct_orders` con las dimensiones conformadas `silver.dim_customer` y `silver.dim_product` mediante sus claves subrogadas (`_sk`) para materializar `gold.obt_sales_wide`.',
      prompt:
        'En la capa Silver tienes `fct_orders` (1 fila por línea de pedido con `customer_sk`, `product_sk`, `date_key`, `net_amount_usd`) y las dimensiones `dim_customer` y `dim_product`. Completa los espacios para materializar la tabla OBT en Gold.',
      language: 'sql',
      templateCode: `CREATE OR REPLACE TABLE gold.obt_sales_wide AS
SELECT
  f.order_id,
  f.order_date,
  c.customer_id,
  c.country_name AS customer_country,
  c.segment_name AS customer_segment,
  p.category_name AS product_category,
  f.quantity,
  f.net_amount_usd
FROM silver.fct_orders f
LEFT JOIN silver.dim_customer c
  ON {{b1}}
LEFT JOIN silver.dim_product p
  ON {{b2}}
ORDER BY {{b3}};`,
      starterCode: `CREATE OR REPLACE TABLE gold.obt_sales_wide AS
SELECT
  f.order_id,
  f.order_date,
  c.customer_id,
  c.country_name AS customer_country,
  c.segment_name AS customer_segment,
  p.category_name AS product_category,
  f.quantity,
  f.net_amount_usd
FROM silver.fct_orders f
LEFT JOIN silver.dim_customer c
  ON f.customer_sk = c.customer_sk
LEFT JOIN silver.dim_product p
  ON f.product_sk = p.product_sk
ORDER BY f.order_date, c.country_name;`,
      solutionCode: `CREATE OR REPLACE TABLE gold.obt_sales_wide AS
SELECT
  f.order_id,
  f.order_date,
  c.customer_id,
  c.country_name AS customer_country,
  c.segment_name AS customer_segment,
  p.category_name AS product_category,
  f.quantity,
  f.net_amount_usd
FROM silver.fct_orders f
LEFT JOIN silver.dim_customer c
  ON f.customer_sk = c.customer_sk
LEFT JOIN silver.dim_product p
  ON f.product_sk = p.product_sk
ORDER BY f.order_date, c.country_name;`,
      blanks: [
        {
          id: 'b1',
          placeholder: 'Condición de join por clave subrogada de cliente',
          acceptedAnswers: ['f.customer_sk = c.customer_sk', 'c.customer_sk = f.customer_sk'],
          hint: 'En un Star Schema, une la tabla de hechos con `dim_customer` usando la clave subrogada `customer_sk`.',
        },
        {
          id: 'b2',
          placeholder: 'Condición de join por clave subrogada de producto',
          acceptedAnswers: ['f.product_sk = p.product_sk', 'p.product_sk = f.product_sk'],
          hint: 'Une `fct_orders` con `dim_product` mediante la clave subrogada `product_sk`.',
        },
        {
          id: 'b3',
          placeholder: 'Columnas de ordenamiento para Run-Length Encoding',
          acceptedAnswers: ['f.order_date, c.country_name', 'f.order_date, customer_country', 'order_date, customer_country'],
          hint: 'Ordenar por `f.order_date, c.country_name` agrupa valores repetidos contiguos potenciando la compresión RLE y los Zone Maps.',
        },
      ],
      expectedOutputTable: [
        {
          order_id: 'ORD-801',
          order_date: '2026-10-12',
          customer_country: 'México',
          customer_segment: 'Enterprise',
          product_category: 'Pagos QR',
          net_amount_usd: '$1,240.00',
        },
        {
          order_id: 'ORD-802',
          order_date: '2026-10-12',
          customer_country: 'Colombia',
          customer_segment: 'Pyme',
          product_category: 'Link de Pago',
          net_amount_usd: '$310.00',
        },
      ],
      expectedOutput: [
        {
          order_id: 'ORD-801',
          order_date: '2026-10-12',
          customer_country: 'México',
          customer_segment: 'Enterprise',
          product_category: 'Pagos QR',
          net_amount_usd: '$1,240.00',
        },
        {
          order_id: 'ORD-802',
          order_date: '2026-10-12',
          customer_country: 'Colombia',
          customer_segment: 'Pyme',
          product_category: 'Link de Pago',
          net_amount_usd: '$310.00',
        },
      ],
      rubricCriteria: [
        'Enlaza hechos y dimensiones mediante claves subrogadas (`customer_sk`, `product_sk`) en lugar de nombres o textos descriptivos.',
        'Utiliza `LEFT JOIN` desde la tabla de hechos para garantizar que ninguna transacción financiera se pierda.',
        'Ordena físicamente la OBT por fecha y dimensión de baja cardinalidad para maximizar Run-Length Encoding (RLE) en Parquet.',
      ],
      validationKeywords: ['customer_sk', 'product_sk', 'LEFT JOIN', 'silver.dim_customer', 'silver.dim_product'],
      hints: [
        'Pista 1: En un Star Schema de Kimball, las tablas de hechos se unen a las dimensiones mediante claves subrogadas (`_sk`), no mediante claves naturales del sistema OLTP.',
        'Pista 2: Reemplaza `{{b1}}` con `f.customer_sk = c.customer_sk` y `{{b2}}` con `f.product_sk = p.product_sk`.',
        'Pista 3: Reemplaza `{{b3}}` con `f.order_date, c.country_name`.',
      ],
      options: [
        {
          id: 'opt-sk',
          text: 'Unir mediante claves subrogadas (`ON f.customer_sk = c.customer_sk` y `ON f.product_sk = p.product_sk`) y ordenar por fecha/país',
          correct: true,
          feedback:
            'Exacto. Las claves subrogadas garantizan integridad referencial rápida y el ordenamiento físico multiplica la compresión RLE en Parquet.',
        },
        {
          id: 'opt-natural',
          text: 'Unir por el nombre del cliente (`ON f.customer_name = c.customer_name`)',
          correct: false,
          feedback:
            'Nunca unas tablas de hechos por nombres o textos descriptivos: pueden contener homónimos, cambiar con el tiempo y son lentos de comparar.',
        },
        {
          id: 'opt-cross',
          text: 'Hacer un `CROSS JOIN` entre hechos y dimensiones sin cláusula `ON`',
          correct: false,
          feedback:
            'Un `CROSS JOIN` generaría un producto cartesiano multiplicando cada pedido por todos los clientes y productos existentes.',
        },
      ],
      successMessage:
        'Excelente. Has conectado la tabla de hechos con sus dimensiones conformadas usando claves subrogadas para materializar una OBT lista para compresión columnar.',
    },
    pipelineChallenge: {
      title: 'Tubería híbrida de OLTP a OBT',
      scenario:
        'El equipo de NovaPay necesita migrar sus reportes desde la base PostgreSQL en 3NF hacia el Lakehouse sin perder gobernanza dimensional ni velocidad de lectura. Ordena las 4 etapas del pipeline:',
      description:
        'Ordena correctamente las 4 etapas del flujo de modelado moderno para desacoplar la base de datos transaccional (OLTP) de los dashboards ejecutivos de alta concurrencia:',
      prompt:
        'Establece el orden correcto del pipeline desde la base transaccional en 3NF hasta el consumo en BI y ciencia de datos:',
      steps: [
        {
          id: 'step-1',
          order: 1,
          label: '1. Captura CDC desde OLTP (3NF) hacia bronze',
          title: 'Ingesta cruda desacoplada en bronze',
          role: 'DE',
          layer: 'Bronze',
          detail:
            'Replicar los eventos de `orders`, `users`, `addresses` y `countries` desde el log WAL de PostgreSQL hacia tablas crudas Iceberg sin ejecutar joins pesados sobre producción.',
          description:
            'Replicar los eventos de `orders`, `users`, `addresses` y `countries` desde el log WAL de PostgreSQL hacia tablas crudas Iceberg sin ejecutar joins pesados sobre producción.',
        },
        {
          id: 'step-2',
          order: 2,
          label: '2. Desnormalizar jerarquías 3NF en dimensiones conformadas (silver)',
          title: 'Construcción de dimensiones conformadas en silver',
          role: 'DE',
          layer: 'Silver',
          detail:
            'Aplanar las cadenas `users -> addresses -> cities -> countries` en una única dimensión `silver.dim_customer` con clave subrogada (`customer_sk`).',
          description:
            'Aplanar las cadenas `users -> addresses -> cities -> countries` en una única dimensión `silver.dim_customer` con clave subrogada (`customer_sk`).',
        },
        {
          id: 'step-3',
          order: 3,
          label: '3. Modelar tabla de hechos con grano explícito en silver',
          title: 'Construcción de tabla de hechos',
          role: 'DA',
          layer: 'Silver',
          detail:
            'Crear `silver.fct_orders` declarando el grain exacto (1 fila por pedido), calculando medidas aditivas limpias (`net_amount_usd`) y enlazando claves foráneas (`customer_sk`, `merchant_sk`).',
          description:
            'Crear `silver.fct_orders` declarando el grain exacto (1 fila por pedido), calculando medidas aditivas limpias (`net_amount_usd`) y enlazando claves foráneas (`customer_sk`, `merchant_sk`).',
        },
        {
          id: 'step-4',
          order: 4,
          label: '4. Materializar OBT columnar y capa semántica en gold',
          title: 'Materialización de OBT en Parquet ordenado',
          role: 'BI',
          layer: 'Gold',
          detail:
            'Pre-unir `fct_orders` con sus dimensiones en `gold.obt_orders_analytics` (aprovechando Dictionary Encoding en Parquet) para consultas de 0 joins en BI y notebooks.',
          description:
            'Pre-unir `fct_orders` con sus dimensiones en `gold.obt_orders_analytics` (aprovechando Dictionary Encoding en Parquet) para consultas de 0 joins en BI y notebooks.',
        },
      ],
      correctOrder: ['step-1', 'step-2', 'step-3', 'step-4'],
      options: [
        {
          id: 'pipe-hybrid',
          text: '1) Captura CDC a Bronze → 2) Dimensiones Conformadas en Silver → 3) Tabla de Hechos en Silver → 4) OBT Columnar en Gold',
          correct: true,
          feedback:
            'Arquitectura impecable. Desacoplas el OLTP en Bronze, gobiernas el negocio con Star Schema en Silver y aceleras las lecturas masivas con OBT en Gold.',
        },
        {
          id: 'pipe-direct-oltp',
          text: '1) Conectar Power BI / Tableau en vivo a las 14 tablas 3NF de PostgreSQL → 2) Hacer los joins en el navegador del CEO',
          correct: false,
          feedback:
            'Peligroso: acopla el esquema interno de la aplicación a los reportes y degrada el rendimiento de la base transaccional.',
        },
        {
          id: 'pipe-obt-only',
          text: '1) Borrar todas las dimensiones → 2) Guardar únicamente una OBT gigante en Bronze sin claves ni tablas de dimensión en Silver',
          correct: false,
          feedback:
            'Sin dimensiones conformadas en Silver, cualquier corrección de un atributo descriptivo o cruce entre múltiples tablas de hechos se vuelve inmanejable.',
        },
      ],
      explanation:
        'El Star Schema en Silver actúa como columna vertebral gobernada (fácil de mantener, auditar y compartir entre procesos), mientras que la OBT en Gold ofrece velocidad extrema sin joins en motores columnares.',
      expectedOutcome:
        'El Star Schema en Silver actúa como columna vertebral gobernada (fácil de mantener y auditar), mientras que la OBT en Gold ofrece velocidad extrema sin joins en motores columnares.',
    },
    checkpoint: {
      question:
        'En una arquitectura moderna sobre Parquet/Iceberg, ¿por qué los equipos mantienen un Star Schema en la capa Silver en lugar de usar exclusivamente una única One Big Table (OBT) para todo el almacén?',
      options: [
        {
          id: 'a',
          text: 'Porque el Star Schema en Silver permite gobernar Dimensiones Conformadas reutilizables entre múltiples procesos de negocio (ventas, soporte, marketing) y actualizar atributos dimensionales sin tener que reescribir miles de millones de filas de hechos.',
          correct: true,
          feedback:
            'Exacto. Si tienes 5 tablas de hechos distintas y un atributo de producto se corrige, en Star Schema actualizas una sola tabla pequeña (`dim_product`); la OBT se materializa en Gold solo donde el rendimiento de lectura sin joins lo justifica.',
        },
        {
          id: 'b',
          text: 'Porque los archivos Parquet prohíben tener más de 10 columnas en una misma tabla.',
          correct: false,
          feedback:
            'Parquet soporta cientos o miles de columnas sin problema y de hecho brilla con Projection Pushdown en tablas anchas.',
        },
        {
          id: 'c',
          text: 'Porque las consultas con 8 JOINs siempre son más rápidas que leer una sola tabla pre-unida.',
          correct: false,
          feedback:
            'Al contrario: en tiempo de lectura pura sobre una única tabla de hechos, una OBT evita el costo de los joins; la ventaja del Star Schema está en el mantenimiento, la historia SCD2 y el cruce multi-hecho.',
        },
      ],
    },
  },

  // ==========================================================================
  // LECCIÓN 5: DIMENSIONES LENTAMENTE CAMBIANTES (SCD TIPO 2) Y POINT-IN-TIME
  // ==========================================================================
  {
    id: 'l5-scd2-history',
    stageId: 'stage-2',
    order: 5,
    title: 'Dimensiones cambiantes SCD tipo 2',
    subtitle: 'Preservar el historial de atributos con intervalos de vigencia para auditorías y modelos predictivos.',
    duration: '30 min',
    level: 'Intermedio',
    bloomLevel: 'apply',
    coreFocus: ['DE', 'DA', 'BI'],
    goal: 'Implementar y consultar Dimensiones Lentamente Cambiantes (SCD Tipo 1, Tipo 2 y Tipo 3/6), generar claves subrogadas deterministas y ejecutar joins Point-in-Time (rango de validez y ASOF JOIN) para preservar la historia en BI y evitar Data Leakage en Machine Learning.',
    visualType: 'scd2-timeline-builder',
    storyContext:
      'Caso práctico: El cliente `U-101` (AceroNorte) estuvo en el segmento `"Pyme"` desde enero hasta junio y compró $1,000 USD. El 1 de julio su empresa creció, contrató el plan corporativo y fue reclasificada a `"Enterprise"`, comprando otros $1,500 USD en el segundo semestre. Como la tabla `dim_customer` sobreescribía los cambios (SCD Tipo 1), el reporte anual presentado al Comité de Auditoría afirma que en enero `"Pyme"` vendió $0 y `"Enterprise"` vendió $1,000. Peor aún: el científico de datos entrenó un modelo de predicción de Churn en enero usando esa misma tabla, filtrando sin querer quién sería Enterprise en julio (Data Leakage).',
    sections: [
      {
        heading: 'El problema de sobrescribir el historial: tipos de dimensiones SCD',
        body: 'El mundo real muta: los clientes cambian de plan, los vendedores cambian de región y los productos cambian de categoría. Ralph Kimball clasificó cómo reaccionar ante estos cambios mediante las **Slowly Changing Dimensions (SCD)**:\n- **SCD Tipo 0 (Retain Original)**: nunca cambia (ej. `fecha_nacimiento`, `canal_primer_registro`).\n- **SCD Tipo 1 (Overwrite)**: sobrescribe el valor antiguo con el nuevo. Útil solo para corregir errores tipográficos (ej. cambiar `"Mèxico"` por `"México"`), pero **destruye la historia** si se usa en atributos de negocio.\n- **SCD Tipo 2 (Add New Row / Versionado Temporal)**: el estándar de oro analítico. Cada vez que un atributo vigilado cambia, se cierra la fila anterior y se inserta una nueva fila con su propio rango de fechas de validez.\n- **SCD Tipo 3 (Add New Attribute)**: añade una columna `previous_segment` (solo recuerda 1 cambio previo).\n- **SCD Tipo 6 (Hybrid 1+2+3)**: combina filas históricas Tipo 2 con una columna `current_segment` actualizada en todas las filas del cliente para facilitar comparaciones *"As-Was vs. As-Is"*.',
      },
      {
        heading: 'Estructura técnica de una tabla SCD tipo 2 en producción',
        body: 'Una dimensión SCD Tipo 2 técnica (`dim_customer_scd2`) contiene cinco elementos estructurales obligatorios:\n1) **Clave Subrogada de Versión (`customer_sk`)**: clave primaria única de esa fila específica, generada de forma determinista con un hash (`SHA-256` o `xxHash64` de `customer_id || valid_from`).\n2) **Clave Natural o Durable (`customer_id`)**: el identificador del cliente en el sistema transaccional (que ahora se repite en varias filas a medida que el cliente evoluciona).\n3) **Intervalo Semicerrado `[valid_from, valid_to)`**: `valid_from` marca el instante exacto en que entró en vigor esa versión y `valid_to` el instante en que dejó de ser válida. Usar la convención **`f.order_ts >= d.valid_from AND f.order_ts < d.valid_to`** (intervalo cerrado por la izquierda y abierto por la derecha) evita ambigüedades o duplicados en los bordes de medianoche que ocurren al usar `BETWEEN`.\n4) **Centinela de Futuro (`9999-12-31` o `NULL`)**: el registro vigente actual tiene `valid_to = TIMESTAMP \'9999-12-31 23:59:59\'` para que los filtros de rango funcionen sin requerir `OR valid_to IS NULL`.\n5) **Bandera `is_current` (`BOOLEAN`)**: permite consultar rápidamente el estado actual con `WHERE is_current = true`.',
      },
      {
        heading: 'Consultas punto en el tiempo y prevención de fuga de datos en modelos',
        body: 'El error más frecuente al consultar una tabla SCD Tipo 2 es hacer `JOIN dim_customer_scd2 d ON f.customer_id = d.customer_id` olvidando la condición temporal: si el cliente cambió 4 veces de plan, **multiplicarás sus ventas por 4 (Fan-Out)**. Tienes dos formas limpias de hacer el cruce Point-in-Time:\n- **Rango de Validez Explícito**: `ON f.customer_id = d.customer_id AND f.order_ts >= d.valid_from AND f.order_ts < d.valid_to` (o unir directamente por `customer_sk` si el pipeline de DE ya estampó la clave subrogada en el hecho).\n- **`ASOF JOIN` (SQL Moderno en DuckDB / Snowflake)**: `ASOF JOIN dim_customer_scd2 d ON f.customer_id = d.customer_id AND f.order_ts >= d.valid_from`, que empareja cada evento con la versión inmediatamente anterior o igual en el tiempo.\nEn **Machine Learning y Análisis de Cohortes**, reconstruir las variables explicativas (*features*) usando cortes Point-in-Time sobre tablas SCD Tipo 2 es la única garantía matemática contra el **Data Leakage (fuga de información del futuro)**.',
      },
      {
        heading: 'Automatización de SCD tipo 2 con snapshots en dbt y SQLMesh',
        body: 'En 2026 ningún ingeniero de datos escribe a mano complejos cursores para mantener tablas SCD Tipo 2. Herramientas declarativas como **dbt Snapshots** (`strategy=\'timestamp\'` o `strategy=\'check\'` comparando el hash de columnas) y **SQLMesh (`SCD_TYPE_2_BY_TIME` / `SCD_TYPE_2_BY_COLUMN`)** calculan automáticamente qué registros cambiaron en el lote incremental, cierran el `valid_to` de las filas modificadas e insertan las nuevas versiones de forma idempotente.',
      },
    ],
    triadPerspectives: {
      DE: {
        title: 'Qué hace ingeniería de datos (DE)',
        points: [
          'Automatiza la generación de dimensiones SCD Tipo 2 mediante `dbt snapshot` o modelos `SCD_TYPE_2` en SQLMesh usando intervalos semicerrados `[valid_from, valid_to)` y centinela `9999-12-31`.',
          'Durante la carga de `fct_orders`, resuelve y estampa la clave subrogada histórica (`customer_sk`) en la tabla de hechos para que las consultas posteriores en BI sean un join entero directo `1:1` ultrarrápido.',
        ],
      },
      DA: {
        title: 'Qué hace análisis de datos (DA)',
        points: [
          'Construye datasets de entrenamiento (Feature Stores Point-in-Time) cruzando la fecha de observación de cada cohorte contra `dim_customer_scd2` para eliminar el *Target/Data Leakage*.',
          'Analiza matrices de transición (ej. qué porcentaje de clientes `"Pyme"` migran a `"Enterprise"` en menos de 6 meses) consultando las filas consecutivas de `dim_customer_scd2` con `LEAD(segment) OVER (PARTITION BY customer_id ORDER BY valid_from)`.',
        ],
      },
      BI: {
        title: 'Qué hace business intelligence (BI)',
        points: [
          'Implementa el patrón **SCD Tipo 6** o doble clave en la Capa Semántica para ofrecer dos vistas claras al negocio: *"Ingresos por Segmento Histórico (Al momento de la venta / As-Was)"* vs. *"Ingresos por Segmento Actual (Re-expresado hoy / As-Is)"*.',
          'Audita que ningún reporte general haga join por `customer_id` contra una tabla SCD2 sin filtrar `is_current = true` o acotar el intervalo temporal.',
        ],
      },
    },
    relatedLessons: [
      {
        id: 'l4-star-schema-obt',
        reason: 'Entiende cómo las dimensiones SCD Tipo 2 se integran en el Star Schema de la capa Silver.',
      },
      {
        id: 'l3-asof-lateral-ctes',
        reason: 'Usa `ASOF JOIN` para cruzar hechos de alta frecuencia con dimensiones SCD Tipo 2 sin solapamientos.',
      },
      {
        id: 'l6-metrics-simpson',
        reason: 'Analiza cómo las migraciones de clientes entre segmentos afectan el mix de tus métricas.',
      },
    ],
    playground: {
      description:
        'Observa qué ocurre cuando unes ventas con una tabla SCD Tipo 2 olvidando el predicado temporal (Fan-Out) frente a un Join Point-in-Time exacto que además compara el segmento histórico (As-Was) contra el actual (As-Is):',
      badQueryLabel: 'Error crítico: unión por clave natural sin acotar rango SCD2',
      badQuery: `-- ERROR GRAVE: Unir por customer_id natural sin filtrar valid_from / valid_to
-- Como U-101 tiene 2 filas en dim_customer_scd2 (Pyme y Enterprise),
-- ambas compras ($1,000 + $1,500) se duplican en AMBOS segmentos.
SELECT
  d.segment,
  COUNT(f.order_id) AS orders_count,
  SUM(f.amount_usd) AS reported_revenue_usd
FROM silver.fct_orders f
JOIN silver.dim_customer_scd2 d
  ON f.customer_id = d.customer_id
GROUP BY d.segment;`,
      badResult: [
        {
          segment: 'Pyme',
          orders_count: '2 (Falso: incluye orden de Julio)',
          reported_revenue_usd: '$2,500.00 (Inflado. Real era $1,000)',
        },
        {
          segment: 'Enterprise',
          orders_count: '2 (Falso: incluye orden de Enero)',
          reported_revenue_usd: '$2,500.00 (Inflado. Total suma $5,000 en vez de $2,500)',
        },
      ],
      goodQueryLabel: 'Solución correcta: cruce temporal con intervalo semicerrado',
      goodQuery: `-- CORRECTO: Acotar con intervalo semicerrado (>= valid_from AND < valid_to)
-- Cada compra se atribuye exactamente a la versión vigente en ese segundo
SELECT
  d.segment AS segment_at_purchase_as_was,
  d.current_segment AS segment_today_as_is,
  COUNT(f.order_id) AS orders_count,
  SUM(f.amount_usd) AS exact_revenue_usd
FROM silver.fct_orders f
JOIN silver.dim_customer_scd2 d
  ON f.customer_id = d.customer_id
  AND f.order_ts >= d.valid_from
  AND f.order_ts <  d.valid_to
GROUP BY 1, 2
ORDER BY 1;`,
      goodResult: [
        {
          segment_at_purchase_as_was: 'Pyme (Ene-Jun)',
          segment_today_as_is: 'Enterprise',
          orders_count: 1,
          exact_revenue_usd: '$1,000.00 (Exacto)',
        },
        {
          segment_at_purchase_as_was: 'Enterprise (Jul-Dic)',
          segment_today_as_is: 'Enterprise',
          orders_count: 1,
          exact_revenue_usd: '$1,500.00 (Exacto)',
        },
      ],
    },
    codeChallenge: {
      title: 'Cruce punto en el tiempo con SCD2',
      instruction:
        'Completa la consulta para atribuir cada pago de `silver.fct_payments` al nivel de riesgo (`risk_tier`) que tenía el comercio en `silver.dim_merchant_scd2` en el instante exacto de la transacción (`payment_ts`) usando un intervalo semicerrado `[valid_from, valid_to)`.',
      description:
        'Escribe las condiciones de unión (`ON`) necesarias para atribuir cada pago de `silver.fct_payments` al nivel de riesgo (`risk_tier`) que tenía el comercio en `silver.dim_merchant_scd2` en el instante exacto de la transacción (`payment_ts`).',
      prompt:
        'Necesitas auditar el volumen procesado según el nivel de riesgo (`risk_tier`) que tenía cada comercio en el momento exacto del pago (`payment_ts`). Completa el `JOIN` usando la convención de intervalo semicerrado `[valid_from, valid_to)`.',
      language: 'sql',
      templateCode: `SELECT
  m.risk_tier AS risk_tier_at_payment,
  COUNT(p.payment_id) AS total_payments,
  SUM(p.amount_usd) AS total_volume_usd
FROM silver.fct_payments p
JOIN silver.dim_merchant_scd2 m
  ON {{b1}}
  AND p.payment_ts {{b2}}
  AND p.payment_ts {{b3}}
GROUP BY m.risk_tier;`,
      starterCode: `SELECT
  m.risk_tier AS risk_tier_at_payment,
  COUNT(p.payment_id) AS total_payments,
  SUM(p.amount_usd) AS total_volume_usd
FROM silver.fct_payments p
JOIN silver.dim_merchant_scd2 m
  ON p.merchant_id = m.merchant_id
  AND p.payment_ts >= m.valid_from
  AND p.payment_ts < m.valid_to
GROUP BY m.risk_tier;`,
      solutionCode: `SELECT
  m.risk_tier AS risk_tier_at_payment,
  COUNT(p.payment_id) AS total_payments,
  SUM(p.amount_usd) AS total_volume_usd
FROM silver.fct_payments p
JOIN silver.dim_merchant_scd2 m
  ON p.merchant_id = m.merchant_id
  AND p.payment_ts >= m.valid_from
  AND p.payment_ts < m.valid_to
GROUP BY m.risk_tier;`,
      blanks: [
        {
          id: 'b1',
          placeholder: 'Igualdad de clave natural del comercio',
          acceptedAnswers: ['p.merchant_id = m.merchant_id', 'm.merchant_id = p.merchant_id'],
          hint: 'Empareja primero el identificador del comercio entre hechos y dimensión (`p.merchant_id = m.merchant_id`).',
        },
        {
          id: 'b2',
          placeholder: 'Límite inferior cerrado (valid_from)',
          acceptedAnswers: ['>= m.valid_from'],
          hint: 'El inicio de vigencia es inclusivo: usa `>= m.valid_from`.',
        },
        {
          id: 'b3',
          placeholder: 'Límite superior abierto (valid_to)',
          acceptedAnswers: ['< m.valid_to'],
          hint: 'El fin de vigencia es exclusivo para evitar solapamientos en bordes exactos: usa `< m.valid_to`.',
        },
      ],
      expectedOutputTable: [
        { risk_tier_at_payment: 'LOW_RISK', total_payments: 1420, total_volume_usd: '$284,000.00' },
        { risk_tier_at_payment: 'MEDIUM_RISK', total_payments: 310, total_volume_usd: '$62,000.00' },
      ],
      expectedOutput: [
        { risk_tier_at_payment: 'LOW_RISK', total_payments: 1420, total_volume_usd: '$284,000.00' },
        { risk_tier_at_payment: 'MEDIUM_RISK', total_payments: 310, total_volume_usd: '$62,000.00' },
      ],
      rubricCriteria: [
        'Empareja la clave natural (`merchant_id`) combinada obligatoriamente con el filtro temporal.',
        'Aplica intervalo semicerrado (`>= valid_from` y `< valid_to`) en lugar de `BETWEEN` para evitar duplicar eventos en el milisegundo exacto de transición.',
        'Evita filtrar por `is_current = true` cuando el objetivo es auditar el estado histórico Point-in-Time.',
      ],
      validationKeywords: ['>=', '<', 'valid_from', 'valid_to', 'payment_ts'],
      hints: [
        'Pista 1: Un intervalo semicerrado `[valid_from, valid_to)` incluye el límite inferior y excluye el límite superior.',
        'Pista 2: Si un registro termina exactamente a las `2026-07-01 00:00:00` y el nuevo empieza a las `2026-07-01 00:00:00`, usar `<=` en ambos lados duplicaría un pago ocurrido justo a medianoche.',
        'Pista 3: Usa `p.merchant_id = m.merchant_id`, `>= m.valid_from` y `< m.valid_to`.',
      ],
      options: [
        {
          id: 'opt-half-open',
          text: '`ON p.merchant_id = m.merchant_id AND p.payment_ts >= m.valid_from AND p.payment_ts < m.valid_to`',
          correct: true,
          feedback:
            'Exacto. El intervalo semicerrado `[valid_from, valid_to)` garantiza matemáticamente que cualquier timestamp caiga en una y solo una versión de la dimensión.',
        },
        {
          id: 'opt-is-current',
          text: '`ON p.merchant_id = m.merchant_id AND m.is_current = true`',
          correct: false,
          feedback:
            'Filtrar `is_current = true` asigna el nivel de riesgo de hoy a todos los pagos del año pasado, destruyendo la trazabilidad Point-in-Time.',
        },
        {
          id: 'opt-or-valid',
          text: '`ON p.merchant_id = m.merchant_id AND (p.payment_ts >= m.valid_from OR p.payment_ts <= m.valid_to)`',
          correct: false,
          feedback:
            'Usar `OR` hace que la condición sea verdadera para casi todas las versiones históricas, provocando un fan-out masivo.',
        },
      ],
      successMessage:
        'Dominado. Usar `>= valid_from AND < valid_to` es la práctica estándar en ingeniería y ciencia de datos para cruces Point-in-Time libres de duplicados y sin Data Leakage.',
    },
    pipelineChallenge: {
      title: 'Ejecución de snapshot SCD tipo 2',
      scenario:
        'El cliente `U-101` cambia de `"Pyme"` a `"Enterprise"` el `2026-07-01 00:00:00`. Ordena los pasos que ejecuta el motor de transformación (dbt Snapshot / SQLMesh) para actualizar `silver.dim_customer_scd2` y enlazar los hechos:',
      description:
        'Ordena la secuencia exacta de operaciones que ocurren en el pipeline cuando llega un cambio de atributo en una dimensión vigilada por SCD Tipo 2:',
      prompt:
        'Establece el orden correcto de actualización SCD Tipo 2 y consumo Point-in-Time:',
      steps: [
        {
          id: 'step-1',
          order: 1,
          label: '1. Detectar cambio por diferencia de hash en columnas vigiladas',
          title: 'Detección de cambio por hash',
          role: 'DE',
          layer: 'Staging → Silver',
          detail:
            'Comparar el hash de los atributos entrantes (`segment`, `country`, `account_manager`) contra el registro activo (`is_current = true`) de `U-101` y detectar que `segment` cambió de `"Pyme"` a `"Enterprise"`.',
          description:
            'Comparar el hash de los atributos entrantes (`segment`, `country`, `account_manager`) contra el registro activo (`is_current = true`) de `U-101` y detectar que `segment` cambió de `"Pyme"` a `"Enterprise"`.',
        },
        {
          id: 'step-2',
          order: 2,
          label: '2. Expirar la versión anterior (`valid_to` e `is_current = false`)',
          title: 'Cierre del registro histórico previo',
          role: 'DE',
          layer: 'Silver SCD2',
          detail:
            'Actualizar la fila anterior (`customer_sk = SK_901`) cambiando su `valid_to` de `9999-12-31` a `2026-07-01 00:00:00` y marcando `is_current = false`.',
          description:
            'Actualizar la fila anterior (`customer_sk = SK_901`) cambiando su `valid_to` de `9999-12-31` a `2026-07-01 00:00:00` y marcando `is_current = false`.',
        },
        {
          id: 'step-3',
          order: 3,
          label: '3. Insertar nueva versión vigente con nueva clave subrogada',
          title: 'Inserción de nueva versión vigente',
          role: 'DE',
          layer: 'Silver SCD2',
          detail:
            'Insertar una nueva fila para `U-101` con `customer_sk = xxHash64(U-101 || 2026-07-01)`, `segment = Enterprise`, `valid_from = 2026-07-01`, `valid_to = 9999-12-31` e `is_current = true`.',
          description:
            'Insertar una nueva fila para `U-101` con `customer_sk = xxHash64(U-101 || 2026-07-01)`, `segment = Enterprise`, `valid_from = 2026-07-01`, `valid_to = 9999-12-31` e `is_current = true`.',
        },
        {
          id: 'step-4',
          order: 4,
          label: '4. Resolver cruce punto en el tiempo en hechos y modelos',
          title: 'Atribución temporal en tablas de hechos',
          role: 'DA',
          layer: 'Silver → Gold',
          detail:
            'Unir las órdenes de enero con `SK_901 (Pyme)` y las órdenes de julio con `SK_988 (Enterprise)` usando `[valid_from, valid_to)`, preservando la verdad histórica.',
          description:
            'Unir las órdenes de enero con `SK_901 (Pyme)` y las órdenes de julio con `SK_988 (Enterprise)` usando `[valid_from, valid_to)`, preservando la verdad histórica.',
        },
      ],
      correctOrder: ['step-1', 'step-2', 'step-3', 'step-4'],
      options: [
        {
          id: 'scd-opt-ok',
          text: '1) Detectar cambio por Hash-Diff → 2) Cerrar fila anterior (`valid_to = 2026-07-01`, `is_current = false`) → 3) Insertar nueva fila (`customer_sk` nuevo, `valid_to = 9999-12-31`) → 4) Cruzar hechos por rango `[valid_from, valid_to)`',
          correct: true,
          feedback:
            'Perfecto. Así conservas la trazabilidad completa: ningún reporte pasado cambia retroactivamente y los modelos de ML entrenan sin fugas del futuro.',
        },
        {
          id: 'scd-opt-overwrite',
          text: '1) Ejecutar `UPDATE dim_customer SET segment = \'Enterprise\' WHERE customer_id = \'U-101\'` → 2) Borrar el registro de que alguna vez fue Pyme',
          correct: false,
          feedback:
            'Eso es SCD Tipo 1: destruye la historia del cliente y altera retroactivamente los reportes financieros del primer semestre.',
        },
        {
          id: 'scd-opt-open-both',
          text: '1) Insertar una fila nueva dejando la fila anterior también con `valid_to = 9999-12-31` e `is_current = true`',
          correct: false,
          feedback:
            'Si no cierras la vigencia de la fila anterior, los intervalos se solaparán y todas las ventas futuras del cliente se duplicarán al hacer join.',
        },
      ],
      explanation:
        'La tabla `dim_customer_scd2` mantiene una línea de tiempo continua y sin solapamientos para cada cliente, habilitando auditorías financieras exactas y ciencia de datos libre de sesgos.',
      expectedOutcome:
        'La tabla `dim_customer_scd2` mantiene una línea de tiempo continua y sin solapamientos para cada cliente, habilitando auditorías financieras y ciencia de datos libre de sesgos.',
    },
    checkpoint: {
      question:
        'Un equipo de Ciencia de Datos entrena un modelo en octubre para predecir qué usuarios cancelarán su suscripción tras su primer mes (usando cohortes de enero a agosto). Si unen los eventos del mes 1 con una tabla `dim_customer` tipo SCD 1 (que solo guarda el estado de octubre), ¿qué fenómeno ocurrirá?',
      options: [
        {
          id: 'a',
          text: 'Data Leakage (fuga de información del futuro): el modelo observará en enero atributos o downgrades que en realidad ocurrieron meses después, inflando artificialmente el AUC en validación y fallando al predecir clientes nuevos en producción.',
          correct: true,
          feedback:
            'Exacto. Entrenar modelos predictivos sobre tablas SCD Tipo 1 sin reconstrucción Point-in-Time (SCD Tipo 2) es la causa número uno de Data Leakage en la industria.',
        },
        {
          id: 'b',
          text: 'El modelo será más preciso en producción porque utiliza información más reciente.',
          correct: false,
          feedback:
            'En producción real, cuando un cliente lleva solo 30 días, no conoces su futuro a 8 meses. Entrenar con datos del futuro engaña a la validación.',
        },
        {
          id: 'c',
          text: 'Ninguno; los algoritmos de árboles de decisión ignoran automáticamente las columnas sobrescritas.',
          correct: false,
          feedback:
            'Al contrario: un árbol (XGBoost/LightGBM) explotará ávidamente cualquier variable con fuga temporal porque correlaciona artificialmente con el objetivo.',
        },
      ],
    },
  },

  // ==========================================================================
  // LECCIÓN 6: ÁRBOLES DE KPIS, MÉTRICAS NO ADITIVAS Y PARADOJA DE SIMPSON
  // ==========================================================================
  {
    id: 'l6-metrics-simpson',
    stageId: 'stage-2',
    order: 6,
    title: 'Métricas no aditivas y paradoja de Simpson',
    subtitle: 'Cómo descomponer indicadores de negocio y evitar conclusiones opuestas al agregar segmentos.',
    duration: '30 min',
    level: 'Avanzado',
    bloomLevel: 'analyze',
    coreFocus: ['DA', 'BI', 'DE'],
    goal: 'Analizar y descomponer métricas de negocio mediante Árboles de KPIs (North Star, Input Metrics y Guardrails), diseñar agregaciones seguras para métricas semi-aditivas y no aditivas, y diagnosticar matemáticamente la Paradoja de Simpson separando el Efecto Tasa del Efecto Mix.',
    visualType: 'simpsons-paradox-explorer',
    storyContext:
      'Caso práctico: Lunes 9:00 AM en el Comité Ejecutivo. El CEO abre el tablero principal y ve que la conversión global cayó del **6.57% en septiembre al 6.00% en octubre (-57 bps)**. Pide explicaciones urgentes a los líderes de producto de Web y de App Móvil. Pero cuando el analista filtra el dashboard por canal, descubre algo desconcertante: en **Web** la conversión subió del **8.00% al 8.50%** (+50 bps) y en **App Móvil** también subió del **3.00% al 3.50%** (+50 bps). ¿Está roto el pipeline de Ingeniería de Datos o estamos ante un fenómeno matemático real?',
    sections: [
      {
        heading: 'Clasificación de métricas: aditivas, semiaditivas y no aditivas',
        body: 'El primer error en el diseño de cubos y dashboards es creer que todas las columnas numéricas se pueden sumar o promediar libremente. En modelado analítico existen tres clases estrictas de medidas:\n- **Métricas Aditivas** (ej. `ingresos_brutos_usd`, `unidades_vendidas`, `comision_pasarela`): se pueden sumar con `SUM()` a través de **cualquier dimensión** (tiempo, geografía, producto, canal).\n- **Métricas Semi-Aditivas** (ej. `saldo_en_cuenta_usd`, `inventario_almacen`, `headcount_empleados`): representan fotografías de balance (*Point-in-Time Snapshots*). Se pueden sumar entre distintas sucursales o clientes en una fecha dada, pero **jamás se suman a lo largo del tiempo** (si tenías $1,000 el lunes, $1,000 el martes y $1,000 el miércoles, tu saldo no es $3,000). A lo largo del tiempo se toma el valor al cierre del periodo (`LAST_VALUE`) o el promedio diario.\n- **Métricas No Aditivas** (ej. `tasa_conversion_pct`, `ticket_promedio_aov`, `margen_porcentual`, `usuarios_activos_unicos`): **nunca se suman ni se promedian directamente con `AVG()`**. Un ratio siempre debe recalcularse desde la suma de sus componentes aditivos (`SUM(numerador) / NULLIF(SUM(denominador), 0)`), y un conteo único (`COUNT DISTINCT`) requiere re-evaluar los IDs crudos o fusionar estructuras probabilísticas aditivas como **HyperLogLog / Theta Sketches**.',
      },
      {
        heading: 'Árboles de indicadores: métrica principal, palancas y métricas de control',
        body: 'Un dashboard con 40 métricas inconexas no sirve para dirigir una empresa. Un **Árbol de KPIs** descompone la creación de valor en una identidad matemática causal:\n`MRR Neto = Usuarios Activos × Tasa de Conversión a Pago × Ticket Promedio (ARPU) - Churn USD`\nCada nodo del árbol cumple uno de tres roles:\n1) **North Star Metric (Métrica Estrella Polar)**: captura el valor duradero entregado al cliente y al negocio (ej. *Ingresos Recurrentes Netos* o *Pedidos Entregados a Tiempo*).\n2) **Input Metrics (Palancas Accionables)**: variables específicas que un equipo de producto puede mover directamente (ej. *% de usuarios que completan el onboarding en <3 min*, *latencia del checkout*).\n3) **Guardrail Metrics (Métricas Guardia o Contrapeso)**: límites de seguridad que impiden optimizar una palanca destruyendo otra parte del negocio (ej. si el equipo de crecimiento sube la conversión un 10% con descuentos agresivos, pero el **Guardrail de Margen Neto** o **Retención a 30 días** cae un 15%, la iniciativa se frena).',
      },
      {
        heading: 'Paradoja de Simpson: cuando los segmentos suben pero el agregado cae',
        body: 'Volvamos al misterio del lunes por la mañana: ¿cómo pueden mejorar Web (`8.0% -> 8.5%`) y App Móvil (`3.0% -> 3.5%`) al mismo tiempo que el total cae (`6.57% -> 6.00%`)? La respuesta es la **Paradoja de Simpson**, causada por un cambio drástico en el **Mix (pesos de volumen)** de una variable de confusión:\n- En **Septiembre**, tenías 2,500 sesiones en Web (71.4% del tráfico total, convirtiendo al 8.0% = 200 pedidos) y 1,000 sesiones en App Móvil (28.6% del tráfico, convirtiendo al 3.0% = 30 pedidos). Total Septiembre: `230 / 3,500 = 6.57%`.\n- En **Octubre**, Marketing lanzó una campaña masiva en TikTok que atrajo una avalancha de usuarios a la **App Móvil**: Web tuvo 3,000 sesiones (50% del tráfico, convirtiendo mejor al 8.5% = 255 pedidos) y App Móvil subió a 3,000 sesiones (50% del tráfico, convirtiendo mejor al 3.5% = 105 pedidos). Total Octubre: `360 / 6,000 = 6.00%`.\nComo el canal con menor conversión natural (App Móvil) pasó de representar el 28.6% al 50.0% de la mezcla total, tiró hacia abajo el promedio ponderado global a pesar de que ambos equipos hicieron un trabajo excelente.',
      },
      {
        heading: 'Descomposición de Kitagawa-Oaxaca: efecto tasa frente a efecto composición',
        body: 'Para que la dirección no castigue por error a los equipos de producto ni tome decisiones ciegas, el analista y el especialista en BI aplican la **Descomposición de Kitagawa** (o reportan la **Métrica a Mix Constante**):\n- **Efecto Tasa Puro (Rendimiento intrínseco)**: mantiene fijos los pesos de tráfico del periodo base ($w_{\\text{sep}}$) y evalúa las nuevas tasas de octubre: $\\sum w_{i,\\text{sep}} \\cdot (r_{i,\\text{oct}} - r_{i,\\text{sep}}) = +0.50\\%$ (+50 bps de mejora real del producto).\n- **Efecto Cambio de Mix (Composición de tráfico)**: mide cuánto cambió la métrica global exclusivamente por el desplazamiento de pesos entre canales: $-1.07\\%$ (-107 bps por el influjo de tráfico móvil).\n- **Cambio Global Observado**: $+0.50\\% \\text{ (Efecto Tasa)} - 1.07\\% \\text{ (Efecto Mix)} = -0.57\\%$ (`6.57% -> 6.00%`).',
      },
    ],
    triadPerspectives: {
      DE: {
        title: 'Qué hace ingeniería de datos (DE)',
        points: [
          'En todas las tablas agregadas (Rollups / Cubos Gold), almacena **siempre el numerador y el denominador aditivos por separado** (`orders_count`, `sessions_count`, `gross_revenue_usd`) además de sketches HyperLogLog para usuarios únicos.',
          'Garantiza que las dimensiones de segmentación clave (`channel`, `device_type`, `country`, `customer_tier`) tengan un 0% de valores `NULL` para que las descomposiciones de mix cuadren al 100%.',
        ],
      },
      DA: {
        title: 'Qué hace análisis de datos (DA)',
        points: [
          'Automatiza el análisis de atribución de varianza mediante la **Descomposición de Kitagawa**, entregando al comité ejecutivo cuántos puntos base (bps) provienen de mejoras reales de tasa y cuántos provienen de cambios en la mezcla de adquisición.',
          'Audita que ningún experimento A/B ni reporte mensual sufra sesgos de composición ocultos por país, plataforma o cohorte.',
        ],
      },
      BI: {
        title: 'Qué hace business intelligence (BI)',
        points: [
          'Declara las métricas no aditivas como `type: ratio` en la Capa Semántica (MetricFlow / Cube) bloqueando cualquier intento de hacer `AVG(conversion_rate)`.',
          'Muestra en el dashboard ejecutivo la **Conversión Normalizada a Mix Constante** junto a la Conversión Observada y añade un indicador automático de *"Alerta de Cambio de Mix"* cuando ambos signos divergen.',
        ],
      },
    },
    relatedLessons: [
      {
        id: 'l4-star-schema-obt',
        reason: 'Las dimensiones conformadas de tu Star Schema son los ejes sobre los cuales auditas los cambios de mix.',
      },
      {
        id: 'l5-scd2-history',
        reason: 'Usa dimensiones SCD Tipo 2 para que los cambios históricos de segmento no distorsionen tus tasas por cohorte.',
      },
      {
        id: 'l1-joins-fanout',
        reason: 'Combina la protección contra Fan-Out con el cálculo correcto de ratios (`SUM/SUM`) para lograr métricas blindadas.',
      },
    ],
    playground: {
      description:
        'Compara el error clásico de promediar porcentajes con `AVG()` frente a la consulta analítica que calcula la conversión real ponderada, la conversión a mix constante y la descomposición Efecto Tasa vs. Efecto Mix:',
      badQueryLabel: 'Error grave: promediar porcentajes con AVG() o sumar usuarios diarios',
      badQuery: `-- ERROR DOBLE MUY COMÚN EN REPORTES MAL DISEÑADOS:
-- 1) Hacer AVG(conversion_rate_pct) trata igual un canal con 100 visitas que uno con 1 millón
-- 2) Hacer SUM(daily_unique_users) suma al mismo usuario 30 veces si entró todos los días del mes
SELECT
  month,
  ROUND(AVG(channel_conversion_pct), 2) AS conversion_falsa_no_ponderada,
  SUM(daily_active_users) AS mau_inflado_incorrecto
FROM gold.channel_monthly_rollup
GROUP BY month;`,
      badResult: [
        {
          month: '2026-09',
          conversion_falsa_no_ponderada: '5.50% (Falso: ignora que Web tenía el 71.4% del tráfico; real = 6.57%)',
          mau_inflado_incorrecto: '420,000 (Falso: suma DAU de 30 días en vez de usuarios únicos mensuales)',
        },
        {
          month: '2026-10',
          conversion_falsa_no_ponderada: '6.00% (Coincidencia casual solo porque el mix fue 50/50)',
          mau_inflado_incorrecto: '510,000 (Inutilizable para calcular retención o ARPU)',
        },
      ],
      goodQueryLabel: 'Solución avanzada: descomposición de Kitagawa a mix constante',
      goodQuery: `-- CORRECTO: Recalcular ratios con SUM(numerador)/SUM(denominador) y separar Efecto Tasa vs Efecto Mix
WITH weights AS (
  SELECT
    channel,
    sessions_sep, orders_sep,
    1.0 * orders_sep / sessions_sep AS rate_sep,
    1.0 * sessions_sep / SUM(sessions_sep) OVER () AS w_sep,
    sessions_oct, orders_oct,
    1.0 * orders_oct / sessions_oct AS rate_oct,
    1.0 * sessions_oct / SUM(sessions_oct) OVER () AS w_oct
  FROM gold.channel_funnel_comparison
)
SELECT
  ROUND(100.0 * SUM(orders_sep) / SUM(sessions_sep), 2) AS conv_sep_pct,
  ROUND(100.0 * SUM(orders_oct) / SUM(sessions_oct), 2) AS conv_oct_observada_pct,
  ROUND(100.0 * SUM(w_sep * rate_oct), 2) AS conv_oct_mix_constante_pct,
  ROUND(100.0 * SUM(0.5 * (w_sep + w_oct) * (rate_oct - rate_sep)), 2) AS efecto_tasa_puro_pct,
  ROUND(100.0 * SUM(0.5 * (rate_sep + rate_oct) * (w_oct - w_sep)), 2) AS efecto_cambio_mix_pct
FROM weights;`,
      goodResult: [
        {
          conv_sep_pct: '6.57%',
          conv_oct_observada_pct: '6.00% (-0.57% global)',
          conv_oct_mix_constante_pct: '7.07% (Subió a mix constante.)',
          efecto_tasa_puro_pct: '+0.50% (Mejora real de Web y App)',
          efecto_cambio_mix_pct: '-1.07% (Impacto del nuevo tráfico móvil)',
        },
      ],
    },
    codeChallenge: {
      title: 'Métricas de razón y mix constante',
      instruction:
        'Completa la consulta SQL para calcular correctamente el Ticket Promedio Global (`aov_global_usd`), la Conversión Global Observada (`conv_observada_pct`) desde sus medidas aditivas base, y la Conversión Normalizada usando el peso de sesiones del periodo base (`weight_base`).',
      description:
        'Completa la consulta SQL para calcular correctamente el Ticket Promedio Global (`aov_global_usd`) como una métrica no aditiva y la Conversión Normalizada usando el peso de sesiones del periodo base (`weight_base`).',
      prompt:
        'Tienes la tabla `gold.channel_performance` con `orders_count`, `sessions_count`, `gross_revenue_usd`, `conversion_rate` y `weight_base` (el peso porcentual que tenía cada canal en el mes base). Completa las expresiones para evitar promediar promedios:',
      language: 'sql',
      templateCode: `SELECT
  -- 1. Ticket Promedio (AOV) Global real (Métrica No Aditiva: Ingresos / Pedidos)
  ROUND({{b1}} / NULLIF(SUM(orders_count), 0), 2) AS aov_global_usd,
  -- 2. Conversión Global Observada (%: Pedidos Totales / Sesiones Totales)
  ROUND(100.0 * SUM(orders_count) / NULLIF({{b2}}, 0), 2) AS conv_observada_pct,
  -- 3. Conversión a Mix Constante (%: Suma ponderada por el peso base de cada canal)
  ROUND(100.0 * SUM({{b3}}), 2) AS conv_mix_constante_pct
FROM gold.channel_performance;`,
      starterCode: `SELECT
  -- 1. Ticket Promedio (AOV) Global real (Métrica No Aditiva: Ingresos / Pedidos)
  ROUND(SUM(gross_revenue_usd) / NULLIF(SUM(orders_count), 0), 2) AS aov_global_usd,
  -- 2. Conversión Global Observada (%: Pedidos Totales / Sesiones Totales)
  ROUND(100.0 * SUM(orders_count) / NULLIF(SUM(sessions_count), 0), 2) AS conv_observada_pct,
  -- 3. Conversión a Mix Constante (%: Suma ponderada por el peso base de cada canal)
  ROUND(100.0 * SUM(conversion_rate * weight_base), 2) AS conv_mix_constante_pct
FROM gold.channel_performance;`,
      solutionCode: `SELECT
  -- 1. Ticket Promedio (AOV) Global real (Métrica No Aditiva: Ingresos / Pedidos)
  ROUND(SUM(gross_revenue_usd) / NULLIF(SUM(orders_count), 0), 2) AS aov_global_usd,
  -- 2. Conversión Global Observada (%: Pedidos Totales / Sesiones Totales)
  ROUND(100.0 * SUM(orders_count) / NULLIF(SUM(sessions_count), 0), 2) AS conv_observada_pct,
  -- 3. Conversión a Mix Constante (%: Suma ponderada por el peso base de cada canal)
  ROUND(100.0 * SUM(conversion_rate * weight_base), 2) AS conv_mix_constante_pct
FROM gold.channel_performance;`,
      blanks: [
        {
          id: 'b1',
          placeholder: 'Numerador aditivo de ingresos',
          acceptedAnswers: ['SUM(gross_revenue_usd)'],
          hint: 'Suma la columna aditiva `gross_revenue_usd` antes de dividir por `SUM(orders_count)`.',
        },
        {
          id: 'b2',
          placeholder: 'Denominador aditivo de sesiones',
          acceptedAnswers: ['SUM(sessions_count)'],
          hint: 'Divide el total de pedidos entre la suma total de sesiones (`SUM(sessions_count)`).',
        },
        {
          id: 'b3',
          placeholder: 'Tasa ponderada por peso base',
          acceptedAnswers: ['conversion_rate * weight_base', 'weight_base * conversion_rate'],
          hint: 'Multiplica la tasa del canal (`conversion_rate`) por su peso en el periodo base (`weight_base`).',
        },
      ],
      expectedOutputTable: [
        {
          aov_global_usd: '$58.40',
          conv_observada_pct: '6.00%',
          conv_mix_constante_pct: '7.07%',
        },
      ],
      expectedOutput: [
        {
          aov_global_usd: '$58.40',
          conv_observada_pct: '6.00%',
          conv_mix_constante_pct: '7.07%',
        },
      ],
      rubricCriteria: [
        'Recalcula todos los ratios no aditivos mediante `SUM(numerador) / NULLIF(SUM(denominador), 0)` sin usar `AVG()` sobre porcentajes.',
        'Protege las divisiones con `NULLIF(..., 0)` para prevenir errores de división por cero.',
        'Calcula la métrica normalizada a mix constante ponderando las tasas actuales por los pesos del periodo base (`weight_base`).',
      ],
      validationKeywords: ['SUM(gross_revenue_usd)', 'SUM(orders_count)', 'SUM(sessions_count)', 'weight_base'],
      hints: [
        'Pista 1: Para cualquier métrica no aditiva de tipo ratio (como AOV o Conversión), nunca uses `AVG()`; debes dividir la suma total del numerador (`SUM(...)`) entre la suma total del denominador (`SUM(...)`).',
        'Pista 2: Completa `{{b1}}` con `SUM(gross_revenue_usd)` y `{{b2}}` con `SUM(sessions_count)`.',
        'Pista 3: En `{{b3}}`, multiplica `conversion_rate * weight_base` para obtener la tasa ponderada a mix constante.',
      ],
      options: [
        {
          id: 'opt-sum-ratio',
          text: 'Usar `SUM(numerador) / NULLIF(SUM(denominador), 0)` y ponderar por `weight_base`',
          correct: true,
          feedback:
            'Exacto. Las métricas no aditivas siempre se agregan sumando primero sus componentes aditivos base antes de dividir.',
        },
        {
          id: 'opt-avg-ratio',
          text: 'Usar `AVG(aov_channel)` y `AVG(conversion_rate)` directamente',
          correct: false,
          feedback:
            'Promediar ratios con `AVG()` ignora el volumen de cada canal y produce números falsos en el tablero ejecutivo.',
        },
        {
          id: 'opt-sum-pct',
          text: 'Usar `SUM(conversion_rate)` sumando los porcentajes de todos los canales',
          correct: false,
          feedback:
            'Sumar porcentajes de distintos canales no tiene sentido estadístico.',
        },
      ],
      successMessage:
        'Excelente análisis. Has calculado las métricas no aditivas desde sus componentes atómicos y expuesto la tasa a mix constante para neutralizar la Paradoja de Simpson.',
    },
    pipelineChallenge: {
      title: 'Sistema de métricas ante paradoja de Simpson',
      scenario:
        'Diseña el flujo de extremo a extremo entre DE, DA y BI para que ningún cambio de mix ni agregación de ratios induzca a error al Comité Ejecutivo:',
      description:
        'Ordena las 4 capas de ingeniería y análisis necesarias para construir un sistema de KPIs blindado contra errores de aditividad y sesgos de composición:',
      prompt:
        'Ordena los pasos para construir un sistema de métricas empresariales inmune a la Paradoja de Simpson:',
      steps: [
        {
          id: 'step-1',
          order: 1,
          label: '1. Almacenar medidas atómicas aditivas y sketches en rollups (DE)',
          title: 'Rollup con componentes atómicos aditivos',
          role: 'DE',
          layer: 'Silver → Gold',
          detail:
            'Materializar las tablas agregadas guardando explícitamente numeradores (`orders_count`, `net_revenue_usd`), denominadores (`sessions_count`) y sketches HyperLogLog, prohibiendo guardar solo porcentajes pre-divididos.',
          description:
            'Materializar las tablas agregadas guardando explícitamente numeradores (`orders_count`, `net_revenue_usd`), denominadores (`sessions_count`) y sketches HyperLogLog, prohibiendo guardar solo porcentajes pre-divididos.',
        },
        {
          id: 'step-2',
          order: 2,
          label: '2. Declarar árbol de indicadores, razones y controles en capa semántica (BI)',
          title: 'Definición semántica de razones y controles',
          role: 'BI',
          layer: 'Semantic Layer',
          detail:
            'Definir en MetricFlow/Cube las métricas no aditivas como `SUM(numerador) / SUM(denominador)` y vincular cada métrica de crecimiento con su métrica Guardia (ej. Conversión ↔ Tasa de Reembolso).',
          description:
            'Definir en MetricFlow/Cube las métricas no aditivas como `SUM(numerador) / SUM(denominador)` y vincular cada métrica de crecimiento con su métrica Guardia (ej. Conversión ↔ Tasa de Reembolso).',
        },
        {
          id: 'step-3',
          order: 3,
          label: '3. Ejecutar descomposición de Kitagawa entre efecto tasa y mix (DA)',
          title: 'Descomposición de efecto tasa y mix',
          role: 'DA',
          layer: 'Analytics Engine',
          detail:
            'Cruzar los pesos del periodo base ($w_{t-1}$) con las tasas actuales ($r_t$) por canal, país y dispositivo para aislar cuántos puntos base se deben al producto y cuántos al cambio de mix.',
          description:
            'Cruzar los pesos del periodo base ($w_{t-1}$) con las tasas actuales ($r_t$) por canal, país y dispositivo para aislar cuántos puntos base se deben al producto y cuántos al cambio de mix.',
        },
        {
          id: 'step-4',
          order: 4,
          label: '4. Exponer alerta de paradoja de Simpson en el tablero ejecutivo (BI)',
          title: 'Visualización observada frente a mix constante',
          role: 'BI',
          layer: 'Executive BI',
          detail:
            'Mostrar en la tarjeta de KPI tanto la tasa global observada como la tasa normalizada a mix constante, destacando automáticamente cuando el efecto mix invierte el signo de la tendencia.',
          description:
            'Mostrar en la tarjeta de KPI tanto la tasa global observada como la tasa normalizada a mix constante, destacando automáticamente cuando el efecto mix invierte el signo de la tendencia.',
        },
      ],
      correctOrder: ['step-1', 'step-2', 'step-3', 'step-4'],
      options: [
        {
          id: 'simp-pipe-ok',
          text: '1) Guardar numeradores/denominadores atómicos en Gold → 2) Declarar ratios y Guardrails en Capa Semántica → 3) Descomponer Efecto Tasa vs. Mix (Kitagawa) → 4) Mostrar métrica Observada + Mix Constante en BI',
          correct: true,
          feedback:
            'Flujo de clase mundial. Así DE provee los bloques aditivos exactos, BI gobierna las fórmulas y DA descompone la causalidad real para la toma de decisiones.',
        },
        {
          id: 'simp-pipe-bad1',
          text: '1) Guardar solo la columna `conversion_pct` en la tabla Gold borrando `sessions` y `orders` → 2) Hacer `AVG(conversion_pct)` en el dashboard',
          correct: false,
          feedback:
            'Si borras el numerador y el denominador al crear el rollup, jamás podrás volver a agregar el ratio correctamente a otro nivel.',
        },
        {
          id: 'simp-pipe-bad2',
          text: '1) Ocultar el canal de App Móvil del reporte para que el promedio global no baje',
          correct: false,
          feedback:
            'Ocultar datos reales es una mala práctica ética y analítica; la solución técnica es mostrar la realidad completa descomponiendo el efecto mix.',
        },
      ],
      explanation:
        'El Comité Ejecutivo comprende en segundos que ambos equipos de producto mejoraron +50 bps y que la caída del promedio global (-57 bps) se debe al nuevo mix de adquisición móvil.',
      expectedOutcome:
        'El Comité Ejecutivo comprende en 10 segundos que ambos equipos de producto mejoraron +50 bps y que la caída del promedio global (-57 bps) se debe al nuevo mix de adquisición móvil.',
    },
    checkpoint: {
      question:
        'Tienes una tabla `fact_daily_inventory` con el stock al cierre de cada día por almacén (`date`, `warehouse_id`, `ending_units`) y otra columna con las ventas del día (`sold_units`). Para mostrar en el reporte trimestral el inventario y las ventas totales de la empresa, ¿cómo debes agregar ambas métricas?',
      options: [
        {
          id: 'a',
          text: '`sold_units` es aditiva (se suma con `SUM` a través de almacenes y de los 90 días), mientras que `ending_units` es semi-aditiva (se suma con `SUM` entre almacenes en una fecha dada, pero NO se suma a través de los 90 días; se toma el cierre del último día del trimestre o el promedio diario).',
          correct: true,
          feedback:
            'Exacto. El inventario y el saldo bancario son métricas semi-aditivas: se suman entre entidades (almacenes/cuentas) en un mismo instante, pero nunca se suman a lo largo del eje temporal.',
        },
        {
          id: 'b',
          text: 'Ambas se suman con `SUM(sold_units)` y `SUM(ending_units)` agrupando por trimestre.',
          correct: false,
          feedback:
            'Si tienes 1,000 camisas en el almacén durante los 90 días del trimestre, hacer `SUM(ending_units)` reportaría que tienes 90,000 camisas en stock.',
        },
        {
          id: 'c',
          text: 'Ninguna de las dos se puede sumar entre almacenes.',
          correct: false,
          feedback:
            'En un mismo día de corte (por ejemplo, el 31 de octubre), sí puedes y debes sumar el stock del Almacén Norte + Almacén Sur para conocer el inventario total de la compañía en esa fecha.',
        },
      ],
    },
  },
];
