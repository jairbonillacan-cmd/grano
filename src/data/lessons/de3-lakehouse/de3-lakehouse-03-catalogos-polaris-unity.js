export const lesson = {
  id: 'de3-lakehouse-03-catalogos-polaris-unity',
  moduleId: 'de3-lakehouse',
  tracks: ['de'],
  level: 3,
  order: 3,
  title: 'Catálogos abiertos: Apache Polaris y Unity Catalog',
  subtitle: 'Catálogos abiertos y gobierno de metadatos: Apache Polaris (REST) y Unity Catalog',
  minutes: 25,
  contentVersion: 1,
  needsReview: false,
  prerequisites: ['de3-lakehouse-02-delta-lake-uniform'],
  hook: 'En Mercado Brisa conviven motores de procesamiento en Spark, consultas interactivas en Trino y laboratorios locales en DuckDB sobre los mismos archivos Parquet en la nube. Si cada motor utiliza su propio catálogo aislado o almacena llaves estáticas de lectura hacia S3, basta una credencial filtrada para exponer los correos y códigos postales de los 2.400 clientes en seis países. ¿Cómo desacoplan Apache Polaris y Unity Catalog el control de permisos, la entrega de credenciales temporales y el enmascaramiento de datos sensibles sin duplicar las tablas físicas?',
  objectives: [
    'Comprender la arquitectura del estándar Iceberg REST Catalog en Apache Polaris y el mecanismo de credenciales temporales delegadas (vended credentials).',
    'Diseñar la jerarquía de tres niveles (catálogo.esquema.tabla) y el gobierno unificado de activos tabulares y no estructurados en Unity Catalog.',
    'Implementar políticas de filtrado de filas (RLS), enmascaramiento de columnas (CLS) y auditorías de calidad mediante SQL sobre las tablas de Mercado Brisa.'
  ],
  sections: [
    {
      id: 'iceberg-rest-catalog-apache-polaris',
      heading: 'El estándar Iceberg REST Catalog y Apache Polaris',
      body: 'Durante años, los lagos de datos dependieron de Hive Metastore. Ese servicio fue pensado para sistemas de archivos locales y acoplaba los motores a llamadas RPC pesadas. Además, obligaba a distribuir llaves maestras de S3 o GCS en cada nodo de cómputo.\n\nEl estándar **Iceberg REST Catalog** reemplaza esa arquitectura mediante una especificación OpenAPI independiente del lenguaje. Cualquier motor compatible consulta endpoints HTTP como `GET /v1/{prefix}/namespaces/{ns}/tables/{table}` para obtener la ubicación del `metadata.json` activo. Luego envía sus commits mediante `POST` para que el servidor ejecute el intercambio atómico (*Compare-And-Swap*).\n\n**Apache Polaris** implementa este protocolo REST en código abierto y añade dos pilares de seguridad. Primero, ofrece control de acceso basado en roles (RBAC) sobre el árbol de catálogos. Segundo, entrega **credenciales delegadas temporales (*vended credentials*)**: cuando un motor solicita leer `customers`, Polaris valida su permiso y devuelve un token STS efímero limitado al prefijo de esa tabla.',
      interactive: {
        component: 'medallion-flow',
        caption: 'Plano de gobierno REST en Apache Polaris y Unity Catalog sobre las capas del Lakehouse.'
      },
      example: {
        language: 'sql',
        code: `SELECT
  country_code,
  COUNT(*) AS total_customers,
  COUNT(*) FILTER (WHERE is_active = true) AS active_customers,
  COUNT(*) FILTER (WHERE postal_code IS NULL) AS missing_postal
FROM customers
GROUP BY country_code
ORDER BY country_code;`,
        expectedOutput: [
          { country_code: 'AR', total_customers: 400, active_customers: 320, missing_postal: 36 },
          { country_code: 'CL', total_customers: 400, active_customers: 400, missing_postal: 36 },
          { country_code: 'CO', total_customers: 400, active_customers: 400, missing_postal: 36 },
          { country_code: 'ES', total_customers: 400, active_customers: 400, missing_postal: 37 },
          { country_code: 'MX', total_customers: 400, active_customers: 320, missing_postal: 36 },
          { country_code: 'PE', total_customers: 400, active_customers: 400, missing_postal: 37 }
        ]
      }
    },
    {
      id: 'espacio-nombres-tres-niveles-unity',
      heading: 'Espacio de nombres de tres niveles y gobierno en Unity Catalog',
      body: '**Unity Catalog** establece un plano de gobierno unificado para tablas Delta Lake y tablas Iceberg. Su estructura organiza todos los activos en un **espacio de nombres de tres niveles**: `catalogo.esquema.tabla` (por ejemplo, `brisa_prod.silver.customers`).\n\nDentro de un esquema coexisten tres tipos de activos bajo el mismo modelo de privilegios ANSI SQL (`GRANT SELECT ON TABLE ... TO group`). Primero, en las **tablas gestionadas (*Managed Tables*)**, el catálogo administra tanto los metadatos como la ubicación física de los archivos Parquet. Segundo, en las **tablas externas (*External Tables*)**, el catálogo gobierna el acceso sobre rutas en la nube preexistentes. Tercero, los **volúmenes (*Volumes*) y modelos** gobiernan archivos no estructurados (PDF, imágenes) y artefactos de inteligencia artificial.\n\nEn **Mercado Brisa**, etiquetar la tabla `brisa_prod.silver.customers` con atributos como `pii = true` permite heredar políticas hacia todas las vistas de ventas.',
      example: {
        language: 'sql',
        code: `SELECT
  segment,
  COUNT(*) AS customer_count,
  COUNT(*) FILTER (WHERE is_active = true) AS active_count
FROM customers
GROUP BY segment
ORDER BY customer_count DESC;`,
        expectedOutput: [
          { segment: 'retail', customer_count: 967, active_count: 893 },
          { segment: 'pro_barista', customer_count: 966, active_count: 886 },
          { segment: 'cafeteria_b2b', customer_count: 467, active_count: 461 }
        ]
      }
    },
    {
      id: 'filtros-fila-mascaras-columna-linaje',
      heading: 'Filtros de fila (RLS), máscaras de columna (CLS) y linaje',
      body: 'Cuando distintos países o áreas de negocio requieren vistas parciales de una tabla, el antipatrón más costoso consiste en duplicar archivos físicos. Crear tablas separadas como `customers_es` o `customers_sin_email` multiplica el almacenamiento y rompe la fuente única de verdad.\n\nLos catálogos modernos resuelven esto adjuntando funciones SQL dinámicas directamente sobre la definición de la tabla. Con **Row-Level Security (RLS / Row Filters)**, la sentencia `SET ROW FILTER fn_country_filter ON (country_code)` inyecta un predicado transparente. Así restringe las filas según el grupo del usuario que consulta. Por su parte, **Column-Level Security (CLS / Column Masks)** usa `ALTER COLUMN email SET MASK fn_mask_email` para redactar al vuelo los datos personales (`email`, `postal_code`).\n\nAdicionalmente, el catálogo analiza el árbol sintáctico de cada consulta para construir el **linaje automático a nivel de columna**. De este modo traza qué reportes de la capa Oro dependen de cada campo de Plata.',
      example: {
        language: 'sql',
        code: `SELECT
  c.country_code,
  COUNT(DISTINCT c.customer_id) AS b2b_active_customers,
  COUNT(o.order_id) AS b2b_completed_orders,
  ROUND(SUM(o.total_usd), 2) AS b2b_revenue_usd
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
WHERE c.segment = 'cafeteria_b2b'
  AND c.is_active = true
  AND o.status = 'completed'
GROUP BY c.country_code
ORDER BY b2b_revenue_usd DESC;`,
        expectedOutput: [
          { country_code: 'ES', b2b_active_customers: 184, b2b_completed_orders: 1288, b2b_revenue_usd: 667722.37 },
          { country_code: 'CL', b2b_active_customers: 193, b2b_completed_orders: 1066, b2b_revenue_usd: 545567.53 },
          { country_code: 'PE', b2b_active_customers: 29, b2b_completed_orders: 125, b2b_revenue_usd: 56843.71 },
          { country_code: 'MX', b2b_active_customers: 21, b2b_completed_orders: 90, b2b_revenue_usd: 39717.11 }
        ]
      }
    }
  ],
  workedExample: {
    title: 'Simulación de vista gobernada con filtro regional y máscara de PII en España',
    description: 'El equipo comercial de España necesita analizar el padrón de clientes de su país en brisa_prod.silver.customers sin exponer correos ni domicilios exactos.',
    audit: 'La política oculta el correo real y trunca el código postal a sus dos primeros dígitos provinciales (28*** para Madrid, 08*** para Barcelona) o asigna MASKED_NULL en los 59 casos sin código postal.',
    steps: [
      {
        label: 'Paso 1 — Aplicar el predicado Row Filter (country_code = ES) y las expresiones Column Mask',
        explanation: 'Proyectamos customer_id, country_code y segment intactos, pero reemplazamos email por un patrón enmascarado y truncamos postal_code a sus dos primeros caracteres para preservar la provincia sin revelar el domicilio exacto.',
        code: `SELECT
  customer_id,
  country_code,
  segment,
  '***@brisa.masked' AS masked_email,
  CASE
    WHEN postal_code IS NULL THEN 'MASKED_NULL'
    ELSE SUBSTR(postal_code, 1, 2) || '***'
  END AS masked_postal_code,
  is_active
FROM customers
WHERE country_code = 'ES'
ORDER BY customer_id
LIMIT 5;`,
        expectedOutput: [
          { customer_id: 5, country_code: 'ES', segment: 'pro_barista', masked_email: '***@brisa.masked', masked_postal_code: '28***', is_active: true },
          { customer_id: 11, country_code: 'ES', segment: 'pro_barista', masked_email: '***@brisa.masked', masked_postal_code: 'MASKED_NULL', is_active: true },
          { customer_id: 17, country_code: 'ES', segment: 'pro_barista', masked_email: '***@brisa.masked', masked_postal_code: '28***', is_active: true },
          { customer_id: 23, country_code: 'ES', segment: 'pro_barista', masked_email: '***@brisa.masked', masked_postal_code: '28***', is_active: true },
          { customer_id: 29, country_code: 'ES', segment: 'pro_barista', masked_email: '***@brisa.masked', masked_postal_code: '28***', is_active: true }
        ]
      },
      {
        label: 'Paso 2 — Analizar el comportamiento sobre valores nulos e identificadores provinciales',
        explanation: 'Los clientes 5, 17, 23 y 29 conservan el prefijo 28*** (Madrid), lo que permite agrupar ventas por zona postal en BI sin exponer información personal ni fallar ante el valor nulo del cliente 11.'
      },
      {
        label: 'Paso 3 — Registrar la política en el catálogo central',
        explanation: 'Al declarar esta lógica como ROW FILTER y COLUMN MASK en Unity Catalog o mediante vistas gobernadas sobre Polaris, cualquier consulta contra brisa_prod.silver.customers ejecuta automáticamente el enmascaramiento según el rol del usuario.'
      }
    ]
  },
  checks: [
    {
      id: 'chk-1',
      type: 'mcq',
      prompt: '¿Qué problema de seguridad resuelven las credenciales delegadas temporales (*vended credentials*) emitidas por un catálogo Iceberg REST como Apache Polaris?',
      options: [
        {
          id: 'a',
          text: 'Obligan a copiar todos los archivos Parquet dentro de la base de datos interna del catálogo.',
          correct: false,
          feedback: 'Incorrecto. El catálogo solo gestiona metadatos y punteros; los archivos Parquet permanecen en el almacenamiento de objetos.'
        },
        {
          id: 'b',
          text: 'Eliminan la necesidad de configurar llaves estáticas de S3/GCS en los motores de cómputo al emitir tokens STS efímeros restringidos al prefijo de la tabla autorizada.',
          correct: true,
          feedback: 'Correcto. El motor recibe una credencial temporal de mínimo privilegio solo después de que el catálogo valida los permisos RBAC.'
        },
        {
          id: 'c',
          text: 'Cifran los nombres de las columnas en las consultas SQL para que los analistas usen números en lugar de nombres.',
          correct: false,
          feedback: 'Incorrecto. Las credenciales delegadas operan en la capa de autenticación hacia el almacenamiento de objetos, no alteran la sintaxis SQL.'
        },
        {
          id: 'd',
          text: 'Desactivan el control de concurrencia optimista para permitir que dos motores sobrescriban metadata.json al mismo tiempo.',
          correct: false,
          feedback: 'Incorrecto. El catálogo REST mantiene estrictamente la atomicidad de los commits mediante intercambios atómicos.'
        }
      ],
      explanation: 'Las vended credentials entregan al motor de consulta un token temporal limitado a la ruta física de la tabla tras verificar la autorización en el catálogo REST.'
    },
    {
      id: 'chk-2',
      type: 'mcq',
      prompt: 'En el espacio de nombres de tres niveles de Unity Catalog (`brisa_prod.silver.customers`), ¿qué representa cada componente de izquierda a derecha?',
      options: [
        {
          id: 'a',
          text: 'Servidor físico, carpeta de S3 y nombre del archivo Parquet.',
          correct: false,
          feedback: 'Incorrecto. Unity Catalog abstrae las rutas físicas de S3 detrás de entidades lógicas de gobierno.'
        },
        {
          id: 'b',
          text: 'Catálogo (`brisa_prod`), esquema o base de datos (`silver`) y tabla, vista o volumen (`customers`).',
          correct: true,
          feedback: 'Correcto. La jerarquía estándar de tres niveles se compone de catálogo, esquema y objeto (tabla, vista o volumen).'
        },
        {
          id: 'c',
          text: 'Región geográfica, rol de usuario y columna primaria.',
          correct: false,
          feedback: 'Incorrecto. Los roles y columnas se administran mediante permisos y esquemas de tabla, no como niveles del identificador.'
        },
        {
          id: 'd',
          text: 'Rama de Git, instantánea de Iceberg y vector de borrado.',
          correct: false,
          feedback: 'Incorrecto. Las instantáneas y ramas pertenecen a los metadatos de la tabla, no a la ruta jerárquica de tres niveles.'
        }
      ],
      explanation: 'La nomenclatura de tres niveles organiza los activos en catálogo (primer nivel), esquema (segundo nivel) y tabla, vista o volumen (tercer nivel).'
    },
    {
      id: 'chk-3',
      type: 'mcq',
      prompt: 'Si el área legal exige que los analistas de marketing consulten la tabla `customers` sin ver el correo electrónico real de los usuarios, ¿cuál es el diseño recomendado en el catálogo?',
      options: [
        {
          id: 'a',
          text: 'Duplicar la tabla física cada hora creando `customers_marketing` sin la columna `email`.',
          correct: false,
          feedback: 'Incorrecto. Clonar tablas físicas multiplica costos de almacenamiento y cómputo y genera riesgos de desincronización.'
        },
        {
          id: 'b',
          text: 'Borrar permanentemente la columna `email` de la capa Bronce y Plata para toda la empresa.',
          correct: false,
          feedback: 'Incorrecto. Los sistemas transaccionales y de facturación autorizados aún necesitan la columna en la fuente.'
        },
        {
          id: 'c',
          text: 'Definir una política de Column Mask (`SET MASK`) sobre la columna `email` en el catálogo que enmascare el valor cuando el usuario no pertenezca al rol autorizado.',
          correct: true,
          feedback: 'Correcto. Una máscara de columna aplica la redacción dinámicamente en tiempo de consulta sobre una única tabla física.'
        },
        {
          id: 'd',
          text: 'Pedir a los analistas que prometan no incluir la columna `email` en su cláusula SELECT.',
          correct: false,
          feedback: 'Incorrecto. Un control de cumplimiento legal debe aplicarse técnicamente en el plano de gobierno, no depender de acuerdos manuales.'
        }
      ],
      explanation: 'Las políticas de Column Mask (CLS) en el catálogo evalúan el rol del lector al vuelo y devuelven el valor enmascarado sin duplicar los archivos Parquet.'
    }
  ],
  practice: {
    type: 'sql',
    title: 'Auditoría de vista gobernada sobre clientes y ventas por país',
    language: 'sql',
    prompt: 'Construye un reporte de auditoría de gobierno sobre `customers` y `orders` por país (`country_code`). Primero preagrega en una CTE las órdenes con `status = \'completed\'` por `customer_id` para obtener el gasto de cada cliente (`customer_spend_usd`). Luego une `customers` con esa CTE y devuelve por `country_code`: el total de clientes (`total_customers`), cuántos requieren máscara por código postal nulo o menor a 4 caracteres (`incomplete_postal_customers`, usando `c.postal_code IS NULL OR LENGTH(c.postal_code) < 4`), cuántos pertenecen al segmento `\'cafeteria_b2b\'` (`b2b_customers`) y la suma de ingresos completados redondeada a 2 decimales (`governed_revenue_usd`). Ordena por `governed_revenue_usd DESC`.',
    starterCode: `-- Reporte de gobierno en Unity Catalog / Polaris por país
-- Corrige incomplete_postal_customers, b2b_customers y governed_revenue_usd usando agregaciones condicionales.
WITH completed_by_customer AS (
  SELECT
    customer_id,
    SUM(total_usd) AS customer_spend_usd
  FROM orders
  WHERE status = 'completed'
  GROUP BY customer_id
)
SELECT
  c.country_code,
  COUNT(*) AS total_customers,
  0 AS incomplete_postal_customers,
  0 AS b2b_customers,
  0.0 AS governed_revenue_usd
FROM customers c
LEFT JOIN completed_by_customer cbc ON c.customer_id = cbc.customer_id
GROUP BY c.country_code
ORDER BY governed_revenue_usd DESC;`,
    expected: `WITH completed_by_customer AS (
  SELECT
    customer_id,
    SUM(total_usd) AS customer_spend_usd
  FROM orders
  WHERE status = 'completed'
  GROUP BY customer_id
)
SELECT
  c.country_code,
  COUNT(*) AS total_customers,
  COUNT(*) FILTER (WHERE c.postal_code IS NULL OR LENGTH(c.postal_code) < 4) AS incomplete_postal_customers,
  COUNT(*) FILTER (WHERE c.segment = 'cafeteria_b2b') AS b2b_customers,
  ROUND(COALESCE(SUM(cbc.customer_spend_usd), 0), 2) AS governed_revenue_usd
FROM customers c
LEFT JOIN completed_by_customer cbc ON c.customer_id = cbc.customer_id
GROUP BY c.country_code
ORDER BY governed_revenue_usd DESC;`,
    orderMatters: true,
    hints: [
      'Usa COUNT(*) FILTER (WHERE c.postal_code IS NULL OR LENGTH(c.postal_code) < 4) para contar incomplete_postal_customers.',
      'Usa COUNT(*) FILTER (WHERE c.segment = \'cafeteria_b2b\') para obtener b2b_customers.',
      'Calcula governed_revenue_usd con ROUND(COALESCE(SUM(cbc.customer_spend_usd), 0), 2) y ordena de mayor a menor.'
    ],
    solution: `WITH completed_by_customer AS (
  SELECT
    customer_id,
    SUM(total_usd) AS customer_spend_usd
  FROM orders
  WHERE status = 'completed'
  GROUP BY customer_id
)
SELECT
  c.country_code,
  COUNT(*) AS total_customers,
  COUNT(*) FILTER (WHERE c.postal_code IS NULL OR LENGTH(c.postal_code) < 4) AS incomplete_postal_customers,
  COUNT(*) FILTER (WHERE c.segment = 'cafeteria_b2b') AS b2b_customers,
  ROUND(COALESCE(SUM(cbc.customer_spend_usd), 0), 2) AS governed_revenue_usd
FROM customers c
LEFT JOIN completed_by_customer cbc ON c.customer_id = cbc.customer_id
GROUP BY c.country_code
ORDER BY governed_revenue_usd DESC;`,
    solutionExplanation: 'El LEFT JOIN conserva los 400 clientes de cada país incluso si no tienen pedidos completados ni clientes cafeteria_b2b (como en CO y AR), permitiendo auditar en una sola vista gobernada los códigos postales incompletos y los ingresos netos.',
    expectedOutputTable: [
      { country_code: 'ES', total_customers: 400, incomplete_postal_customers: 59, b2b_customers: 184, governed_revenue_usd: 1348369.68 },
      { country_code: 'CO', total_customers: 400, incomplete_postal_customers: 57, b2b_customers: 0, governed_revenue_usd: 1107715.87 },
      { country_code: 'AR', total_customers: 400, incomplete_postal_customers: 58, b2b_customers: 0, governed_revenue_usd: 1107208.91 },
      { country_code: 'CL', total_customers: 400, incomplete_postal_customers: 57, b2b_customers: 216, governed_revenue_usd: 952577.48 },
      { country_code: 'PE', total_customers: 400, incomplete_postal_customers: 59, b2b_customers: 34, governed_revenue_usd: 882838.25 },
      { country_code: 'MX', total_customers: 400, incomplete_postal_customers: 57, b2b_customers: 33, governed_revenue_usd: 870752.23 }
    ]
  },
  roleNotes: {
    de: 'Despliega un catálogo Iceberg REST como Apache Polaris o Unity Catalog con credenciales delegadas (vended credentials) para revocar las llaves IAM estáticas de los clústeres de procesamiento.',
    da: 'Consulta el grafo de linaje de columnas en el catálogo antes de proponer cambios en métricas de negocio y apoya tus análisis en tablas con filtros RLS/CLS en vez de exportar CSV locales.',
    bi: 'Configura las conexiones de tus tableros utilizando identidades de servicio gobernadas en el catálogo para que los filtros regionales (Row Filters) se apliquen automáticamente por país.'
  },
  summary: [
    'El estándar Iceberg REST Catalog desacopla los motores de consulta del almacenamiento mediante una API OpenAPI que coordina commits atómicos.',
    'Apache Polaris emite credenciales temporales delegadas (vended credentials) con alcance restringido al prefijo de la tabla solicitada.',
    'Unity Catalog organiza los datos bajo el espacio de nombres de tres niveles (catálogo.esquema.tabla) unificando tablas y volúmenes.',
    'Los filtros de fila (RLS), máscaras de columna (CLS) y el linaje automático permiten gobernar datos sensibles sobre una única copia física.'
  ],
  flashcards: [
    {
      id: 'fc-1',
      front: '¿En qué consisten las credenciales temporales delegadas (vended credentials) de Apache Polaris?',
      back: 'Son tokens STS de corta duración que el catálogo entrega al motor de consulta tras validar permisos RBAC, restringidos únicamente a la ruta de almacenamiento de la tabla solicitada.'
    },
    {
      id: 'fc-2',
      front: '¿Cuáles son los tres niveles jerárquicos de identificación en Unity Catalog?',
      back: 'Catálogo (primer nivel), Esquema (segundo nivel) y Tabla, Vista o Volumen (tercer nivel), expresados como catalogo.esquema.tabla.'
    },
    {
      id: 'fc-3',
      front: '¿Qué diferencia operativa existe entre un Row Filter (RLS) y una Column Mask (CLS)?',
      back: 'El Row Filter oculta filas completas que no cumplen el predicado de autorización del usuario, mientras la Column Mask mantiene la fila pero sustituye el valor de la columna sensible.'
    },
    {
      id: 'fc-4',
      front: '¿Por qué el catálogo REST evita las condiciones de carrera cuando Spark y Trino escriben en la misma tabla Iceberg?',
      back: 'Porque centraliza la actualización del puntero hacia el nuevo archivo metadata.json mediante una operación atómica Compare-And-Swap en el servidor del catálogo.'
    }
  ],
  glossaryTerms: [
    'iceberg-rest-catalog',
    'unity-catalog-governance',
    'delta-uniform',
    'c18-iceberg-v3'
  ],
  sources: [
    {
      title: 'Apache Polaris: Open Source REST Catalog for Apache Iceberg',
      url: 'https://polaris.apache.org/',
      publisher: 'Apache Software Foundation',
      accessed: '2026-10-29',
      supports: 'Implementación del estándar OpenAPI Iceberg REST Catalog, RBAC y emisión de vended credentials.'
    },
    {
      title: 'Unity Catalog Open Source Documentation',
      url: 'https://unitycatalog.io/',
      publisher: 'Linux Foundation AI & Data',
      accessed: '2026-10-29',
      supports: 'Jerarquía de tres niveles (catálogo.esquema.tabla) y gobierno abierto de tablas, volúmenes y modelos.'
    },
    {
      title: 'Databricks Unity Catalog Data Governance and Access Control',
      url: 'https://docs.databricks.com/aws/en/data-governance/unity-catalog/',
      publisher: 'Databricks',
      accessed: '2026-10-29',
      supports: 'Políticas dinámicas Row Filters (RLS), Column Masks (CLS) y linaje automático a nivel de columna.'
    }
  ],
  aiNotes: 'Orienta al estudiante para entender cómo Polaris y Unity Catalog actúan como plano de control por encima de Iceberg y Delta UniForm. En la práctica SQL, haz notar que CO y AR tienen 0 clientes en el segmento cafeteria_b2b pero más de 1,1 millones USD en ventas retail y pro_barista, por lo que usar LEFT JOIN desde customers preserva todos los países y clientes.'
};

export default lesson;
