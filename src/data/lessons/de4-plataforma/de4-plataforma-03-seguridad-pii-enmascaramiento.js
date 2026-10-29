const lesson = {
  id: 'de4-plataforma-03-seguridad-pii-enmascaramiento',
  moduleId: 'de4-plataforma',
  tracks: ['de'],
  level: 4,
  order: 3,
  title: 'Seguridad, clasificación PII, enmascaramiento y auditoría',
  subtitle: 'Seguridad de datos, clasificación PII, enmascaramiento dinámico y auditoría',
  minutes: 20,
  prerequisites: [
    'de3-transformacion-03-contracts-semantic-layer',
    'de4-plataforma-02-arquitectura-integral-plataforma',
  ],
  contentVersion: 2,

  hook: 'Un analista exporta una vista de la tabla customers de Mercado Brisa donde los nombres y correos fueron sustituidos por resúmenes criptográficos. Sin embargo, la vista conserva sin cambios el país, la ciudad, el código postal, el segmento y el nivel de fidelidad. En México y Perú existen grupos de apenas 33 clientes que comparten esa combinación exacta, y customer_changes guarda 4 100 versiones pasadas. ¿Cómo diseñas políticas de clasificación PII, enmascaramiento dinámico y filtrado por fila que impidan la reidentificación?',

  objectives: [
    'Clasificar los atributos de un esquema en identificadores directos y cuasi-identificadores vinculables aplicando los criterios de la guía NIST SP 800-122.',
    'Implementar enmascaramiento dinámico de datos (DDM) a nivel de columna y políticas de seguridad a nivel de fila (RLS) según el rol del consumidor.',
    'Auditar el riesgo de reidentificación mediante el umbral de k-anonimato y rastrear la propagación de atributos sensibles en tablas históricas SCD Tipo 2.',
  ],

  sections: [
    {
      id: 'clasificacion-pii-nist-800-122',
      heading: 'Identificadores directos y cuasi-identificadores (NIST SP 800-122)',
      body: 'La publicación especial **NIST SP 800-122** divide la información de identificación personal en dos categorías que exigen controles distintos. Los **identificadores directos** señalan a una persona sin ayuda de ningún otro dato. En la tabla `customers` de Mercado Brisa (2 400 filas), `full_name` y `email` pertenecen a este grupo. Esas columnas nunca deben exponerse en texto plano fuera de los sistemas operativos autorizados.\n\nPor su parte, los **cuasi-identificadores** (*linkable information*) son atributos que por sí solos parecen anónimos. Ejemplos claros son `country_code`, `city`, `postal_code`, `segment` o `current_tier`. Sin embargo, al combinarse reducen el conjunto de candidatos hasta aislar a pocos individuos. Una vista satisface **$k$-anonimato** cuando cada combinación única de cuasi-identificadores aparece en al menos $k$ registros. Si en Mercado Brisa un grupo de `country_code + city + segment + current_tier` tiene solo 33 personas y la norma interna exige $k \\ge 50$, la plataforma debe generalizar atributos antes de liberar la vista.',
      example: {
        language: 'sql',
        code: `WITH quasi_groups AS (
  SELECT country_code, city, segment, current_tier, COUNT(*) AS group_size
  FROM customers
  GROUP BY 1, 2, 3, 4
)
SELECT country_code,
       COUNT(*) AS total_combinations,
       COUNT(*) FILTER (WHERE group_size < 50) AS groups_under_k50,
       MIN(group_size) AS min_group_size
FROM quasi_groups
GROUP BY country_code
ORDER BY min_group_size ASC, country_code ASC;`,
        expectedOutput: [
          { country_code: 'MX', total_combinations: 4, groups_under_k50: 2, min_group_size: 33 },
          { country_code: 'PE', total_combinations: 4, groups_under_k50: 2, min_group_size: 33 },
          { country_code: 'CL', total_combinations: 3, groups_under_k50: 1, min_group_size: 34 },
          { country_code: 'ES', total_combinations: 3, groups_under_k50: 0, min_group_size: 66 },
          { country_code: 'AR', total_combinations: 3, groups_under_k50: 0, min_group_size: 67 },
          { country_code: 'CO', total_combinations: 3, groups_under_k50: 0, min_group_size: 67 },
        ],
      },
    },
    {
      id: 'enmascaramiento-ddm-y-rls',
      heading: 'Enmascaramiento dinámico (DDM) y seguridad a nivel de fila (RLS)',
      body: 'Duplicar tablas físicas para mantener una copia con PII y otra sin PII multiplica el costo de almacenamiento. Además, provoca desincronización entre copias. En su lugar, las plataformas actuales aplican dos mecanismos declarativos en el motor o catálogo de consultas.\n\nEl **enmascaramiento dinámico de datos (DDM)** transforma el valor de una columna en el instante de lectura según el rol del usuario. Mientras un proceso de auditoría autorizado lee el correo completo, el rol analítico recibe un resumen determinista de doce caracteres (`LEFT(SHA256(LOWER(TRIM(email))), 12)`). Ese resumen permite contar usuarios únicos y cruzar tablas sin revelar la dirección real. De igual modo, el código postal se trunca a sus dos primeros caracteres (`\'11***\'`). A su vez, la **seguridad a nivel de fila (RLS)** adjunta un predicado automático (como `USING (country_code = current_setting(\'app.country\'))` en PostgreSQL) que filtra las filas visibles sin depender de cláusulas `WHERE` manuales.',
      example: {
        language: 'sql',
        code: `SELECT customer_id,
       LEFT(SHA256(LOWER(TRIM(COALESCE(email, 'sin_correo')))), 12) AS email_hash_12,
       COALESCE(NULLIF(SPLIT_PART(email, '@', 2), ''), 'dominio_oculto') AS email_domain,
       LEFT(COALESCE(postal_code, '00000'), 2) || '***' AS postal_masked,
       country_code,
       segment
FROM customers
ORDER BY customer_id ASC
LIMIT 3;`,
        expectedOutput: [
          { customer_id: 1, email_hash_12: 'c7e615a502d5', email_domain: 'mercadobrisa.example', postal_masked: '11***', country_code: 'CO', segment: 'pro_barista' },
          { customer_id: 2, email_hash_12: '482f7ac62d97', email_domain: 'mercadobrisa.example', postal_masked: '75***', country_code: 'CL', segment: 'pro_barista' },
          { customer_id: 3, email_hash_12: '4c9a044e8dd0', email_domain: 'mercadobrisa.example', postal_masked: 'C1***', country_code: 'AR', segment: 'pro_barista' },
        ],
      },
    },
    {
      id: 'auditoria-scd2-derecho-olvido',
      heading: 'Auditoría de accesos y propagación de borrado en historial SCD2',
      body: 'Cumplir normativas de privacidad como el **artículo 32 del GDPR** exige dos capacidades técnicas adicionales. Primero, registrar en una bitácora inmutable quién consultó qué tabla sensible y en qué fecha. Segundo, garantizar que las solicitudes de supresión (*derecho al olvido*) eliminen los rastros del titular en todas las capas del almacén.\n\nUn punto ciego habitual son las dimensiones lentamente cambiantes de **Tipo 2 (SCD2)**. En Mercado Brisa, aunque la tabla `customers` tiene 2 400 filas activas (400 por país), la tabla `customer_changes` almacena 4 100 registros. Esos registros incluyen 1 700 versiones históricas cerradas (`is_current = false`). Si un cliente solicita la baja y el ingeniero solo anonimiza su fila actual en `customers`, las versiones cerradas en `customer_changes` y las instantáneas pasadas de Apache Iceberg conservan su historial. Por ello, debes programar procedimientos de purga y ejecutar `expire_snapshots` para retirar los archivos antiguos dentro del plazo legal.',
      example: {
        language: 'sql',
        code: `SELECT country_code,
       COUNT(*) AS total_scd2_rows,
       COUNT(DISTINCT customer_id) AS distinct_customers,
       COUNT(*) FILTER (WHERE is_current = false) AS historical_versions
FROM customer_changes
GROUP BY country_code
ORDER BY total_scd2_rows DESC;`,
        expectedOutput: [
          { country_code: 'PE', total_scd2_rows: 684, distinct_customers: 400, historical_versions: 284 },
          { country_code: 'CO', total_scd2_rows: 684, distinct_customers: 400, historical_versions: 284 },
          { country_code: 'CL', total_scd2_rows: 684, distinct_customers: 400, historical_versions: 284 },
          { country_code: 'AR', total_scd2_rows: 684, distinct_customers: 400, historical_versions: 284 },
          { country_code: 'MX', total_scd2_rows: 682, distinct_customers: 400, historical_versions: 282 },
          { country_code: 'ES', total_scd2_rows: 682, distinct_customers: 400, historical_versions: 282 },
        ],
      },
    },
  ],

  workedExample: {
    title: 'Vista enmascarada, auditoría k-50 y alcance SCD2 en Mercado Brisa',
    description: 'El oficial de seguridad de Mercado Brisa te pide construir una vista enmascarada de customers, evaluar qué países tienen grupos de cuasi-identificadores (country_code, city, segment, current_tier) por debajo del umbral de k-anonimato (k=50) y cuantificar cuántas filas históricas en customer_changes están sujetas a políticas de purga.',
    audit: 'Enmascarar el correo no basta si los cuasi-identificadores forman grupos pequeños (k=33 en MX y PE frente al umbral k=50) o si las 1 700 versiones históricas cerradas en customer_changes quedan fuera del alcance de las políticas de borrado.',
    steps: [
      {
        label: 'Paso 1: Aplicar enmascaramiento dinámico sobre identificadores directos y código postal',
        explanation: 'Sustituimos el correo por su hash SHA-256 normalizado de 12 caracteres, extraemos el dominio con SPLIT_PART y truncamos el código postal a dos caracteres seguidos de asteriscos.',
        code: `SELECT customer_id,
       LEFT(SHA256(LOWER(TRIM(COALESCE(email, 'sin_correo')))), 12) AS email_hash_12,
       COALESCE(NULLIF(SPLIT_PART(email, '@', 2), ''), 'dominio_oculto') AS email_domain,
       LEFT(COALESCE(postal_code, '00000'), 2) || '***' AS postal_masked,
       country_code,
       segment
FROM customers
ORDER BY customer_id ASC
LIMIT 5;`,
        expectedOutput: [
          { customer_id: 1, email_hash_12: 'c7e615a502d5', email_domain: 'mercadobrisa.example', postal_masked: '11***', country_code: 'CO', segment: 'pro_barista' },
          { customer_id: 2, email_hash_12: '482f7ac62d97', email_domain: 'mercadobrisa.example', postal_masked: '75***', country_code: 'CL', segment: 'pro_barista' },
          { customer_id: 3, email_hash_12: '4c9a044e8dd0', email_domain: 'mercadobrisa.example', postal_masked: 'C1***', country_code: 'AR', segment: 'pro_barista' },
          { customer_id: 4, email_hash_12: '5f78da276b30', email_domain: 'mercadobrisa.example', postal_masked: '15***', country_code: 'PE', segment: 'cafeteria_b2b' },
          { customer_id: 5, email_hash_12: '3ff4858e44a2', email_domain: 'mercadobrisa.example', postal_masked: '28***', country_code: 'ES', segment: 'pro_barista' },
        ],
      },
      {
        label: 'Paso 2: Auditar el tamaño mínimo de grupo (k-anonimato) sobre cuasi-identificadores',
        explanation: 'Agrupamos por la combinación (country_code, city, segment, current_tier) y verificamos por país cuántas combinaciones existen y cuál es el grupo más pequeño (min_group_size).',
        code: `WITH quasi_groups AS (
  SELECT country_code, city, segment, current_tier, COUNT(*) AS group_size
  FROM customers
  GROUP BY 1, 2, 3, 4
)
SELECT country_code,
       COUNT(*) AS total_combinations,
       COUNT(*) FILTER (WHERE group_size < 50) AS groups_under_k50,
       MIN(group_size) AS min_group_size
FROM quasi_groups
GROUP BY country_code
ORDER BY min_group_size ASC, country_code ASC;`,
        expectedOutput: [
          { country_code: 'MX', total_combinations: 4, groups_under_k50: 2, min_group_size: 33 },
          { country_code: 'PE', total_combinations: 4, groups_under_k50: 2, min_group_size: 33 },
          { country_code: 'CL', total_combinations: 3, groups_under_k50: 1, min_group_size: 34 },
          { country_code: 'ES', total_combinations: 3, groups_under_k50: 0, min_group_size: 66 },
          { country_code: 'AR', total_combinations: 3, groups_under_k50: 0, min_group_size: 67 },
          { country_code: 'CO', total_combinations: 3, groups_under_k50: 0, min_group_size: 67 },
        ],
      },
      {
        label: 'Paso 3: Cuantificar la huella histórica en customer_changes para auditoría GDPR',
        explanation: 'Contamos por país el total de filas SCD2, los clientes únicos y cuántas versiones históricas cerradas (is_current = false) deben actualizarse cuando se ejecuta una orden de supresión.',
        code: `SELECT country_code,
       COUNT(*) AS total_scd2_rows,
       COUNT(DISTINCT customer_id) AS distinct_customers,
       COUNT(*) FILTER (WHERE is_current = false) AS historical_versions
FROM customer_changes
GROUP BY country_code
ORDER BY total_scd2_rows DESC;`,
        expectedOutput: [
          { country_code: 'PE', total_scd2_rows: 684, distinct_customers: 400, historical_versions: 284 },
          { country_code: 'CO', total_scd2_rows: 684, distinct_customers: 400, historical_versions: 284 },
          { country_code: 'CL', total_scd2_rows: 684, distinct_customers: 400, historical_versions: 284 },
          { country_code: 'AR', total_scd2_rows: 684, distinct_customers: 400, historical_versions: 284 },
          { country_code: 'MX', total_scd2_rows: 682, distinct_customers: 400, historical_versions: 282 },
          { country_code: 'ES', total_scd2_rows: 682, distinct_customers: 400, historical_versions: 282 },
        ],
      },
    ],
  },

  checks: [
    {
      id: 'de4-p03-check-1',
      type: 'mcq',
      prompt: 'Según la guía NIST SP 800-122, ¿por qué la combinación de columnas (city, postal_code, segment, current_tier) debe tratarse como información sujeta a controles de privacidad aunque la vista no incluya full_name ni email?',
      options: [
        {
          id: 'a',
          text: 'Porque los tipos de texto consumen más espacio en Parquet que los enteros.',
          correct: false,
          feedback: 'Incorrecto. La clasificación NIST SP 800-122 se basa en el riesgo de identificación de personas, no en la compresión física de tipos.',
        },
        {
          id: 'b',
          text: 'Porque actúan como cuasi-identificadores vinculables que, combinados en grupos pequeños (bajo k-anonimato), permiten reidentificar a individuos específicos.',
          correct: true,
          feedback: 'Correcto. Cuando pocos registros comparten la misma combinación de atributos indirectos, es posible deducir la identidad de la persona.',
        },
        {
          id: 'c',
          text: 'Porque PostgreSQL y Apache Iceberg prohíben crear índices o particiones sobre columnas de ciudad o segmento.',
          correct: false,
          feedback: 'Incorrecto. Los motores permiten particionar por esas columnas sin restricción técnica; el límite es de privacidad y gobierno.',
        },
        {
          id: 'd',
          text: 'Porque el modo ANSI convierte automáticamente cualquier código postal en un identificador fiscal.',
          correct: false,
          feedback: 'Incorrecto. El modo ANSI regula coerción de tipos y errores aritméticos, no la naturaleza legal de los datos.',
        },
      ],
      explanation: 'NIST SP 800-122 distingue entre identificadores directos y datos vinculables (cuasi-identificadores). La intersección de ubicación geográfica, segmento y nivel puede aislar grupos pequeños y permitir la reidentificación.',
    },
    {
      id: 'de4-p03-check-2',
      type: 'mcq',
      prompt: 'En PostgreSQL o un catálogo Lakehouse con Row-Level Security (RLS) activo, ¿qué detalle de configuración debes cuidar respecto al rol propietario (owner) de la tabla?',
      options: [
        {
          id: 'a',
          text: 'El propietario de la tabla y el superusuario omiten las políticas RLS por defecto salvo que se declare FORCE ROW LEVEL SECURITY y las aplicaciones usen roles restringidos.',
          correct: true,
          feedback: 'Correcto. Nunca debes conectar herramientas de BI o servicios web usando la cuenta propietaria de la tabla o superusuario.',
        },
        {
          id: 'b',
          text: 'Las políticas RLS solo funcionan sobre columnas de tipo entero y fallan en columnas VARCHAR como country_code.',
          correct: false,
          feedback: 'Incorrecto. RLS evalúa cualquier expresión booleana válida en SQL, incluyendo comparaciones sobre cadenas de texto.',
        },
        {
          id: 'c',
          text: 'Activar RLS cifra automáticamente los nombres de las columnas en el esquema del catálogo.',
          correct: false,
          feedback: 'Incorrecto. RLS filtra filas devueltas por las consultas; no oculta ni cifra los nombres de columnas del catálogo.',
        },
      ],
      explanation: 'Por diseño en PostgreSQL, el dueño de la tabla ignora las políticas RLS a menos que se ejecute ALTER TABLE ... FORCE ROW LEVEL SECURITY. Los consumidores deben autenticarse siempre con roles dedicados de mínimo privilegio.',
    },
    {
      id: 'de4-p03-check-3',
      type: 'fill-code',
      prompt: 'Escribe el nombre de la función criptográfica en DuckDB que genera el resumen hexadecimal de 256 bits a partir de un correo normalizado:',
      code: `SELECT LEFT(__________(LOWER(TRIM(email))), 12) AS email_hash
FROM customers;`,
      template: `SELECT LEFT({{b1}}(LOWER(TRIM(email))), 12) AS email_hash FROM customers;`,
      placeholder: 'Escribe el nombre de la función (ej. SHA256)',
      acceptedAnswers: ['SHA256', 'sha256'],
      blanks: [
        {
          id: 'b1',
          accepted: ['SHA256', 'sha256'],
        },
      ],
      explanation: 'SHA256 calcula el resumen criptográfico de 256 bits sobre la cadena normalizada en minúsculas y sin espacios laterales, permitiendo seudonimizar el correo de forma determinista.',
    },
  ],

  practice: {
    type: 'sql',
    title: 'Auditoría de k-anonimato (k >= 50) por país sobre cuasi-identificadores',
    language: 'sql',
    prompt: 'Evalúa el cumplimiento de la política de k-anonimato (k >= 50) en la tabla customers de Mercado Brisa. Primero agrupa los cuasi-identificadores (country_code, city, segment, current_tier) para contar el tamaño de cada grupo. Luego resume por country_code: el total de clientes del país (total_customers), el tamaño del grupo más pequeño en ese país (min_k_group), cuántos grupos tienen menos de 50 clientes (groups_under_k50) y la columna politica_ddm con el valor \'REQUIERE_GENERALIZACION\' cuando min_k_group < 50 o \'K50_CUMPLIDO\' en caso contrario. Ordena por min_k_group ascendente y luego por country_code ascendente.',
    starterCode: `WITH quasi_groups AS (
  SELECT country_code, city, segment, current_tier, COUNT(*) AS group_size
  FROM customers
  GROUP BY 1, 2, 3, 4
),
country_risk AS (
  SELECT country_code,
         MIN(group_size) AS min_k_group,
         -- Cuenta cuántos grupos tienen group_size < 50
         0 AS groups_under_k50
  FROM quasi_groups
  GROUP BY country_code
)
SELECT c.country_code,
       COUNT(c.customer_id) AS total_customers,
       r.min_k_group,
       r.groups_under_k50,
       -- Clasifica en 'REQUIERE_GENERALIZACION' si min_k_group < 50, sino 'K50_CUMPLIDO'
       'PENDIENTE' AS politica_ddm
FROM customers c
JOIN country_risk r ON c.country_code = r.country_code
GROUP BY c.country_code, r.min_k_group, r.groups_under_k50
ORDER BY r.min_k_group ASC, c.country_code ASC;`,
    expected: `WITH quasi_groups AS (
  SELECT country_code, city, segment, current_tier, COUNT(*) AS group_size
  FROM customers
  GROUP BY 1, 2, 3, 4
),
country_risk AS (
  SELECT country_code,
         MIN(group_size) AS min_k_group,
         COUNT(*) FILTER (WHERE group_size < 50) AS groups_under_k50
  FROM quasi_groups
  GROUP BY country_code
)
SELECT c.country_code,
       COUNT(c.customer_id) AS total_customers,
       r.min_k_group,
       r.groups_under_k50,
       CASE WHEN r.min_k_group < 50 THEN 'REQUIERE_GENERALIZACION' ELSE 'K50_CUMPLIDO' END AS politica_ddm
FROM customers c
JOIN country_risk r ON c.country_code = r.country_code
GROUP BY c.country_code, r.min_k_group, r.groups_under_k50
ORDER BY r.min_k_group ASC, c.country_code ASC;`,
    orderMatters: true,
    hints: [
      'En el CTE country_risk calcula COUNT(*) FILTER (WHERE group_size < 50) AS groups_under_k50.',
      'En el SELECT principal usa CASE WHEN r.min_k_group < 50 THEN \'REQUIERE_GENERALIZACION\' ELSE \'K50_CUMPLIDO\' END AS politica_ddm.',
      'Conserva el GROUP BY y el ORDER BY r.min_k_group ASC, c.country_code ASC.',
    ],
    solution: `WITH quasi_groups AS (
  SELECT country_code, city, segment, current_tier, COUNT(*) AS group_size
  FROM customers
  GROUP BY 1, 2, 3, 4
),
country_risk AS (
  SELECT country_code,
         MIN(group_size) AS min_k_group,
         COUNT(*) FILTER (WHERE group_size < 50) AS groups_under_k50
  FROM quasi_groups
  GROUP BY country_code
)
SELECT c.country_code,
       COUNT(c.customer_id) AS total_customers,
       r.min_k_group,
       r.groups_under_k50,
       CASE WHEN r.min_k_group < 50 THEN 'REQUIERE_GENERALIZACION' ELSE 'K50_CUMPLIDO' END AS politica_ddm
FROM customers c
JOIN country_risk r ON c.country_code = r.country_code
GROUP BY c.country_code, r.min_k_group, r.groups_under_k50
ORDER BY r.min_k_group ASC, c.country_code ASC;`,
    solutionExplanation: 'El primer CTE mide la cardinalidad de cada combinación de cuasi-identificadores y el segundo evalúa el riesgo por país. El resultado demuestra que MX, PE y CL tienen subgrupos de 33 y 34 clientes (inferiores al umbral k=50), por lo que requieren generalizar atributos antes de exponer la vista a roles analíticos.',
    expectedOutputTable: [
      { country_code: 'MX', total_customers: 400, min_k_group: 33, groups_under_k50: 2, politica_ddm: 'REQUIERE_GENERALIZACION' },
      { country_code: 'PE', total_customers: 400, min_k_group: 33, groups_under_k50: 2, politica_ddm: 'REQUIERE_GENERALIZACION' },
      { country_code: 'CL', total_customers: 400, min_k_group: 34, groups_under_k50: 1, politica_ddm: 'REQUIERE_GENERALIZACION' },
      { country_code: 'ES', total_customers: 400, min_k_group: 66, groups_under_k50: 0, politica_ddm: 'K50_CUMPLIDO' },
      { country_code: 'AR', total_customers: 400, min_k_group: 67, groups_under_k50: 0, politica_ddm: 'K50_CUMPLIDO' },
      { country_code: 'CO', total_customers: 400, min_k_group: 67, groups_under_k50: 0, politica_ddm: 'K50_CUMPLIDO' },
    ],
  },

  roleNotes: {
    de: 'Automatiza el etiquetado de columnas PII en el catálogo y aplica políticas de enmascaramiento dinámico (DDM) y seguridad por fila (RLS) en las vistas Silver y Gold. Asegura que los flujos de baja por derecho al olvido limpien también customer_changes y expiren las instantáneas antiguas de Iceberg.',
    da: 'Realiza tus análisis de cohortes y retención utilizando customer_id o resúmenes criptográficos normalizados. Nunca descargues archivos CSV locales con nombres, correos o códigos postales completos en tu equipo.',
    bi: 'Configura la conexión de tus tableros utilizando credenciales sujetas a RLS por región o país y verifica que ninguna visualización permita desagregar cuasi-identificadores por debajo del umbral de k-anonimato de la organización.',
  },

  summary: [
    'NIST SP 800-122 clasifica la PII en identificadores directos (nombre, correo) y cuasi-identificadores vinculables (ciudad, código postal, segmento, nivel).',
    'El enmascaramiento dinámico (DDM) oculta o resume columnas sensibles en tiempo de consulta según el rol sin duplicar tablas físicas.',
    'La seguridad a nivel de fila (RLS) restringe automáticamente qué registros puede leer cada consumidor en función de su contexto o región.',
    'La auditoría de privacidad debe verificar el umbral de k-anonimato y propagar las bajas legales hacia tablas históricas SCD2 e instantáneas de Iceberg.',
  ],

  flashcards: [
    {
      id: 'de4-plataforma-03-seguridad-pii-enmascaramiento-fc-1',
      front: '¿Cuál es la diferencia entre un identificador directo y un cuasi-identificador según NIST SP 800-122?',
      back: 'Un identificador directo identifica a una persona por sí solo (como email o documento fiscal), mientras que un cuasi-identificador (ciudad, código postal, segmento) parece anónimo aislado pero permite reidentificar personas al combinarse con otros atributos.',
    },
    {
      id: 'de4-plataforma-03-seguridad-pii-enmascaramiento-fc-2',
      front: '¿Qué garantiza que una vista analítica cumpla con k-anonimato para k = 50?',
      back: 'Que cada combinación distinta de cuasi-identificadores presente en la vista aparezca en al menos 50 registros individuales.',
    },
    {
      id: 'de4-plataforma-03-seguridad-pii-enmascaramiento-fc-3',
      front: '¿En qué se diferencian el enmascaramiento dinámico de datos (DDM) y la seguridad a nivel de fila (RLS)?',
      back: 'DDM actúa sobre columnas transformando u ocultando valores sensibles en tiempo de lectura según el rol; RLS actúa sobre filas filtrando qué registros devuelve la tabla según el usuario o sesión.',
    },
    {
      id: 'de4-plataforma-03-seguridad-pii-enmascaramiento-fc-4',
      front: '¿Por qué las tablas SCD Tipo 2 y los formatos como Apache Iceberg requieren atención especial ante el derecho al olvido (GDPR)?',
      back: 'Porque las filas históricas cerradas (is_current = false) y las instantáneas pasadas conservan versiones anteriores del cliente que también deben purgarse y expirarse físicamente.',
    },
  ],

  glossaryTerms: [
    'clasificacion-pii-nist',
    'enmascaramiento-dinamico-ddm',
    'seguridad-nivel-fila-rls',
  ],

  sources: [
    {
      title: 'NIST SP 800-122: Guide to Protecting the Confidentiality of Personally Identifiable Information (PII)',
      url: 'https://csrc.nist.gov/pubs/sp/800/122/final',
      publisher: 'National Institute of Standards and Technology (NIST)',
      accessed: '2026-10-29',
      supports: 'Clasificación de identificadores directos y cuasi-identificadores vinculables y controles de anonimización.',
    },
    {
      title: 'PostgreSQL Documentation — Chapter 5.9 Row Security Policies',
      url: 'https://www.postgresql.org/docs/current/ddl-rowsecurity.html',
      publisher: 'The PostgreSQL Global Development Group',
      accessed: '2026-10-29',
      supports: 'Implementación de políticas declarativas de seguridad a nivel de fila (RLS) y uso de FORCE ROW LEVEL SECURITY.',
    },
    {
      title: 'PostgreSQL Documentation — Chapter 5.8 Privileges',
      url: 'https://www.postgresql.org/docs/current/ddl-priv.html',
      publisher: 'The PostgreSQL Global Development Group',
      accessed: '2026-10-29',
      supports: 'Control de privilegios de mínimo acceso a nivel de tabla y columna.',
    },
    {
      title: 'General Data Protection Regulation (GDPR) — Article 32: Security of processing',
      url: 'https://gdpr-info.eu/art-32-gdpr/',
      publisher: 'Official Journal of the European Union / Intersoft Consulting',
      accessed: '2026-10-29',
      supports: 'Requisitos técnicos de seudonimización, confidencialidad y auditoría sobre datos personales.',
    },
  ],

  aiNotes: 'Explica con claridad por qué enmascarar email con SHA256 no impide reidentificar usuarios si las combinaciones de (country_code, city, segment, current_tier) forman grupos pequeños en MX, PE y CL (k=33 y k=34). En la práctica SQL, orienta al estudiante en el uso de COUNT(*) FILTER (WHERE group_size < 50) y CASE WHEN.',
};

export default lesson;
