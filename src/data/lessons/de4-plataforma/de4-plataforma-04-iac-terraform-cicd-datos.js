const lesson = {
  id: 'de4-plataforma-04-iac-terraform-cicd-datos',
  moduleId: 'de4-plataforma',
  tracks: ['de'],
  level: 4,
  order: 4,
  title: 'Infraestructura como código (Terraform) y CI/CD en datos',
  subtitle: 'Infraestructura como código (Terraform) y CI/CD para recursos de datos',
  minutes: 20,
  prerequisites: [
    'de2-pipelines-06-contenedores-docker-compose',
    'de3-transformacion-01-dbt-sqlmesh-dag',
    'de4-plataforma-03-seguridad-pii-enmascaramiento',
  ],
  contentVersion: 2,

  hook: 'Un viernes por la tarde, un ingeniero modifica a mano en la consola los permisos del almacén de objetos de Mercado Brisa y despliega una tabla sin pruebas automatizadas. Dos horas después, el trabajo de facturación falla por falta de privilegios IAM. Además, los reportes incorporan 405 cobros capturados duplicados y 1 450 reembolsos cuyas órdenes siguen marcadas como completadas o canceladas. ¿Cómo gobiernas la infraestructura con Terraform y bloqueas anomalías mediante compuertas de CI/CD?',

  objectives: [
    'Gestionar cubetas de almacenamiento, catálogos Iceberg y roles de acceso mediante configuración declarativa en Terraform con estado remoto bloqueado y módulos por entorno.',
    'Prevenir la deriva de configuración (infrastructure drift) y la destrucción accidental de tablas con estado aplicando reglas de ciclo de vida como prevent_destroy.',
    'Diseñar compuertas automatizadas de integración y entrega continua (CI/CD) que validen unicidad, integridad referencial y contratos de negocio antes de promover cambios.',
  ],

  sections: [
    {
      id: 'terraform-recursos-estado-modulos',
      heading: 'Terraform para recursos de datos: estado remoto, bloqueo y módulos',
      body: 'Crear cubetas de objetos, bases de catálogo o políticas IAM mediante clics manuales impide reproducir el entorno de pruebas en producción. Tampoco permite auditar quién autorizó cada cambio. **Terraform** resuelve este problema con archivos declarativos en lenguaje HCL donde defines el estado final deseado de cada recurso (`resource`). Esos recursos se parametrizan con variables de entrada (`variable`) y se agrupan en **módulos** reutilizables para desplegar entornos idénticos (`dev`, `staging`, `prod`).\n\nPara saber qué recursos existen y cuáles deben crearse o modificarse durante `terraform plan` y `terraform apply`, la herramienta mantiene un archivo de **estado** (`terraform.tfstate`). En un equipo de datos, este archivo nunca se guarda en una computadora local. Se aloja en un **backend remoto** cifrado con bloqueo de estado (*state locking*) para evitar escrituras simultáneas. Cuando alguien altera un permiso manualmente en la consola web, ocurre una **deriva de infraestructura (drift)**. El siguiente `terraform plan` detecta esa diferencia y restaura el código versionado en Git. Además, toda cubeta con datos históricos debe incluir `lifecycle { prevent_destroy = true }` para abortar cualquier plan que intente eliminarla.',
      example: {
        language: 'sql',
        code: `SELECT 'orders_pk' AS check_name,
       COUNT(*) AS total_rows,
       COUNT(DISTINCT order_id) AS unique_keys,
       COUNT(*) - COUNT(DISTINCT order_id) AS violations
FROM orders
UNION ALL
SELECT 'captured_payments_by_order',
       COUNT(*),
       COUNT(DISTINCT order_id),
       COUNT(*) - COUNT(DISTINCT order_id)
FROM payments
WHERE status = 'captured';`,
        expectedOutput: [
          { check_name: 'orders_pk', total_rows: 18000, unique_keys: 18000, violations: 0 },
          { check_name: 'captured_payments_by_order', total_rows: 16605, unique_keys: 16200, violations: 405 },
        ],
      },
    },
    {
      id: 'compuertas-cicd-contratos-datos',
      heading: 'Compuertas de calidad en CI/CD para tuberías de datos',
      body: 'Validar que la sintaxis HCL o SQL compile sin errores no garantiza que las tablas resultantes sean confiables. En ingeniería de datos, la tubería de **integración continua (CI)** ejecutada en plataformas como GitHub Actions debe evaluar compuertas cuantitativas antes de fusionar el código. Este patrón se conoce como escribir, auditar y publicar (*Write-Audit-Publish*).\n\nAl auditar las tablas transaccionales de Mercado Brisa encontramos las anomalías que una compuerta de CI debe interceptar. Aunque `orders` conserva 18 000 identificadores únicos sin duplicados, la tabla `payments` contiene 19 200 registros para 18 000 órdenes. Incluso filtrando solo cobros exitosos (`status = \'captured\'`), aparecen 16 605 filas para 16 200 órdenes distintas. Es decir, existen **405 cobros capturados duplicados**. Una compuerta SQL declarada en el repositorio mide estas violaciones y asigna un veredicto automático: aprobar el despliegue (`PASS`), enviar a cuarentena (`WARN_QUARANTINE`) o bloquear la promoción (`BLOCK_DEPLOY`).',
      example: {
        language: 'sql',
        code: `SELECT 'payments_by_order' AS check_name, COUNT(*) AS total_rows, COUNT(DISTINCT order_id) AS unique_keys, COUNT(*) - COUNT(DISTINCT order_id) AS violations FROM payments
UNION ALL
SELECT 'captured_payments_by_order', COUNT(*), COUNT(DISTINCT order_id), COUNT(*) - COUNT(DISTINCT order_id) FROM payments WHERE status = 'captured'
UNION ALL
SELECT 'refunds_by_order', COUNT(*), COUNT(DISTINCT order_id), COUNT(*) - COUNT(DISTINCT order_id) FROM refunds
UNION ALL
SELECT 'orders_pk', COUNT(*), COUNT(DISTINCT order_id), COUNT(*) - COUNT(DISTINCT order_id) FROM orders
ORDER BY violations DESC;`,
        expectedOutput: [
          { check_name: 'payments_by_order', total_rows: 19200, unique_keys: 18000, violations: 1200 },
          { check_name: 'captured_payments_by_order', total_rows: 16605, unique_keys: 16200, violations: 405 },
          { check_name: 'refunds_by_order', total_rows: 1450, unique_keys: 1150, violations: 300 },
          { check_name: 'orders_pk', total_rows: 18000, unique_keys: 18000, violations: 0 },
        ],
      },
    },
    {
      id: 'integridad-semantica-entre-tablas',
      heading: 'Validación de invariantes de negocio entre entidades',
      body: 'Las pruebas unitarias de esquema suelen revisar una tabla a la vez. Sin embargo, los defectos más costosos en producción surgen cuando dos tablas rompen una regla de negocio conjunta. En Mercado Brisa, la tabla `refunds` almacena 1 450 reembolsos procesados por un total de `$321 097.25`. Al cruzar `refunds` con `orders` en una prueba inter-tabla, aparece una inconsistencia severa.\n\nDe esos reembolsos, **1 305 registros** pertenecen a órdenes cuyo estado sigue siendo `\'completed\'` y otros **145 registros** apuntan a órdenes en estado `\'cancelled\'`. Ninguna de esas órdenes actualizó su estado a `\'refunded\'`. Incorporar estas consultas de conciliación cruzada dentro del flujo de CI/CD impide publicar vistas incoherentes. Así, la infraestructura declarada en Terraform garantiza que los recursos y permisos existan con la configuración exacta. Al mismo tiempo, las compuertas SQL aseguran que los datos alojados en esos recursos cumplan los contratos del negocio.',
      example: {
        language: 'sql',
        code: `SELECT o.status AS order_status,
       COUNT(r.refund_id) AS refund_records,
       ROUND(SUM(r.refund_amount_usd), 2) AS total_refund_usd
FROM refunds r
JOIN orders o ON r.order_id = o.order_id
GROUP BY o.status
ORDER BY refund_records DESC;`,
        expectedOutput: [
          { order_status: 'completed', refund_records: 1305, total_refund_usd: 274534.52 },
          { order_status: 'cancelled', refund_records: 145, total_refund_usd: 46562.73 },
        ],
      },
    },
  ],

  workedExample: {
    title: 'Batería de compuertas SQL de CI/CD previa a terraform apply en Mercado Brisa',
    description: 'Antes de ejecutar terraform apply y promover los modelos de Mercado Brisa a producción, debes construir el conjunto de pruebas SQL de la tubería CI/CD que audite la unicidad de llaves en órdenes y pagos, verifique la consistencia de estado entre reembolsos y órdenes, y emita el dictamen automático de despliegue.',
    audit: 'Automatizar el plan de Terraform junto con compuertas SQL de CI/CD permite distinguir entre contratos que pasan limpios (orders_pk), anomalías acotadas que van a cuarentena (405 cobros duplicados) y defectos estructurales que bloquean el despliegue (1 450 reembolsos inconsistentes).',
    steps: [
      {
        label: 'Paso 1: Auditar unicidad de llaves primarias y de negocio en orders y payments',
        explanation: 'Comprobamos cuántas filas violan la relación 1:1 por order_id en la tabla orders, en todos los intentos de payments, en los cobros capturados y en refunds.',
        code: `SELECT 'payments_by_order' AS check_name, COUNT(*) AS total_rows, COUNT(DISTINCT order_id) AS unique_keys, COUNT(*) - COUNT(DISTINCT order_id) AS violations FROM payments
UNION ALL
SELECT 'captured_payments_by_order', COUNT(*), COUNT(DISTINCT order_id), COUNT(*) - COUNT(DISTINCT order_id) FROM payments WHERE status = 'captured'
UNION ALL
SELECT 'refunds_by_order', COUNT(*), COUNT(DISTINCT order_id), COUNT(*) - COUNT(DISTINCT order_id) FROM refunds
UNION ALL
SELECT 'orders_pk', COUNT(*), COUNT(DISTINCT order_id), COUNT(*) - COUNT(DISTINCT order_id) FROM orders
ORDER BY violations DESC;`,
        expectedOutput: [
          { check_name: 'payments_by_order', total_rows: 19200, unique_keys: 18000, violations: 1200 },
          { check_name: 'captured_payments_by_order', total_rows: 16605, unique_keys: 16200, violations: 405 },
          { check_name: 'refunds_by_order', total_rows: 1450, unique_keys: 1150, violations: 300 },
          { check_name: 'orders_pk', total_rows: 18000, unique_keys: 18000, violations: 0 },
        ],
      },
      {
        label: 'Paso 2: Verificar consistencia de estado entre refunds y orders',
        explanation: 'Cruzamos refunds con orders para comprobar si las órdenes con reembolsos procesados reflejan el estado refunded o si presentan desincronización de estado.',
        code: `SELECT o.status AS order_status,
       COUNT(r.refund_id) AS refund_records,
       ROUND(SUM(r.refund_amount_usd), 2) AS total_refund_usd
FROM refunds r
JOIN orders o ON r.order_id = o.order_id
GROUP BY o.status
ORDER BY refund_records DESC;`,
        expectedOutput: [
          { order_status: 'completed', refund_records: 1305, total_refund_usd: 274534.52 },
          { order_status: 'cancelled', refund_records: 145, total_refund_usd: 46562.73 },
        ],
      },
      {
        label: 'Paso 3: Consolidar el veredicto de la compuerta CI/CD por umbral de severidad',
        explanation: 'Unificamos cuatro controles automáticos y asignamos PASS cuando hay 0 violaciones, WARN_QUARANTINE cuando hay menos de 500 filas afectadas y BLOCK_DEPLOY cuando alcanzan o superan las 500 violaciones.',
        code: `WITH ci_checks AS (
  SELECT '1_unicidad_orders_pk' AS gate_name,
         COUNT(*) - COUNT(DISTINCT order_id) AS violating_rows
  FROM orders
  UNION ALL
  SELECT '2_cobros_capturados_duplicados',
         COUNT(*) - COUNT(DISTINCT order_id)
  FROM payments
  WHERE status = 'captured'
  UNION ALL
  SELECT '3_reembolsos_estado_inconsistente',
         COUNT(*)
  FROM refunds r
  JOIN orders o ON r.order_id = o.order_id
  WHERE o.status <> 'refunded'
  UNION ALL
  SELECT '4_eventos_sin_customer_id',
         COUNT(*)
  FROM events
  WHERE customer_id IS NULL
)
SELECT gate_name,
       violating_rows,
       CASE
         WHEN violating_rows = 0 THEN 'PASS'
         WHEN violating_rows < 500 THEN 'WARN_QUARANTINE'
         ELSE 'BLOCK_DEPLOY'
       END AS ci_action
FROM ci_checks
ORDER BY gate_name ASC;`,
        expectedOutput: [
          { gate_name: '1_unicidad_orders_pk', violating_rows: 0, ci_action: 'PASS' },
          { gate_name: '2_cobros_capturados_duplicados', violating_rows: 405, ci_action: 'WARN_QUARANTINE' },
          { gate_name: '3_reembolsos_estado_inconsistente', violating_rows: 1450, ci_action: 'BLOCK_DEPLOY' },
          { gate_name: '4_eventos_sin_customer_id', violating_rows: 6715, ci_action: 'BLOCK_DEPLOY' },
        ],
      },
    ],
  },

  checks: [
    {
      id: 'de4-p04-check-1',
      type: 'mcq',
      prompt: '¿Qué problema evita configurar un backend remoto con bloqueo de estado (state locking) en Terraform cuando varios ingenieros de datos trabajan sobre la misma plataforma?',
      options: [
        {
          id: 'a',
          text: 'Impide que dos ejecuciones concurrentes de terraform apply sobrescriban el archivo de estado al mismo tiempo y corrompan el inventario de recursos.',
          correct: true,
          feedback: 'Correcto. El bloqueo remoto garantiza acceso mutuamente excluyente al estado mientras dura una operación de escritura.',
        },
        {
          id: 'b',
          text: 'Comprime automáticamente los archivos Parquet de las tablas Bronze a la mitad de su tamaño.',
          correct: false,
          feedback: 'Incorrecto. El estado de Terraform gestiona metadatos de recursos de infraestructura, no la compresión interna de datos en Parquet.',
        },
        {
          id: 'c',
          text: 'Reemplaza las consultas SQL por archivos HCL dentro de los tableros de BI.',
          correct: false,
          feedback: 'Incorrecto. HCL define infraestructura; las transformaciones y consultas analíticas siguen escribiéndose en SQL o Python.',
        },
        {
          id: 'd',
          text: 'Elimina la necesidad de ejecutar terraform plan antes de aplicar cambios en producción.',
          correct: false,
          feedback: 'Incorrecto. Revisar el resultado de terraform plan en integración continua sigue siendo obligatorio para auditar qué recursos cambiarán.',
        },
      ],
      explanation: 'El archivo terraform.tfstate mapea el código con los recursos reales desplegados. Almacenarlo en un backend remoto con bloqueo impide condiciones de carrera cuando dos personas o tuberías ejecutan cambios simultáneos.',
    },
    {
      id: 'de4-p04-check-2',
      type: 'mcq',
      prompt: 'En Terraform, si un ingeniero cambia el nombre identificador de una cubeta de almacenamiento con datos históricos sin usar bloques de migración ni protección, ¿qué acción propondrá terraform plan?',
      options: [
        {
          id: 'a',
          text: 'Ignorar el cambio de nombre para proteger los archivos Parquet existentes.',
          correct: false,
          feedback: 'Incorrecto. Terraform no ignora cambios en identificadores de recursos; trata el nuevo nombre como un recurso nuevo y el anterior como obsoleto.',
        },
        {
          id: 'b',
          text: 'Destruir la cubeta existente y crear una nueva vacía, razón por la cual las cubetas de datos deben incluir lifecycle { prevent_destroy = true }.',
          correct: true,
          feedback: 'Correcto. Los recursos con estado requieren prevent_destroy = true para bloquear planes que impliquen su eliminación física.',
        },
        {
          id: 'c',
          text: 'Activar automáticamente el modo ANSI SQL en todas las bases de datos del proyecto.',
          correct: false,
          feedback: 'Incorrecto. El ciclo de vida de recursos en Terraform es independiente de las propiedades de sesión de Spark SQL.',
        },
      ],
      explanation: 'Cambiar el identificador o atributo inmutable de una cubeta fuerza su reemplazo (destroy y create). La regla lifecycle { prevent_destroy = true } hace que Terraform rechace el plan antes de borrar datos en producción.',
    },
    {
      id: 'de4-p04-check-3',
      type: 'order',
      prompt: 'Ordena las etapas de una tubería de CI/CD al proponer un cambio en la infraestructura y contratos de datos mediante un Pull Request:',
      items: [
        'Verificar formato y sintaxis declarativa con terraform fmt -check y terraform validate.',
        'Generar terraform plan contra el estado remoto bloqueado y verificar que no se destruyan recursos con estado.',
        'Ejecutar las compuertas SQL de calidad sobre el entorno de prueba para descartar duplicados o estados inconsistentes.',
        'Aprobar la fusión a la rama principal y ejecutar terraform apply junto con la publicación atómica en producción.',
      ],
      correctOrder: ['it-0', 'it-1', 'it-2', 'it-3'],
      explanation: 'Primero se valida la sintaxis estática, luego se calcula el plan de infraestructura sin aplicarlo, después se ejecutan las compuertas de calidad de datos y solo tras superar todos los controles se aplica en producción.',
    },
  ],

  practice: {
    type: 'sql',
    title: 'Compuerta automatizada CI/CD de contratos e invariantes de datos',
    language: 'sql',
    prompt: 'Construye la consulta de compuerta CI/CD que evalúa 4 reglas sobre Mercado Brisa usando UNION ALL en el CTE ci_checks: (1) \'1_unicidad_orders_pk\': filas duplicadas en orders por order_id (COUNT(*) - COUNT(DISTINCT order_id)), (2) \'2_cobros_capturados_duplicados\': filas duplicadas por order_id en payments donde status = \'captured\', (3) \'3_reembolsos_estado_inconsistente\': conteo de filas en refunds r unidas con orders o (ON r.order_id = o.order_id) donde o.status <> \'refunded\', y (4) \'4_eventos_sin_customer_id\': conteo de filas en events donde customer_id IS NULL. En la consulta final devuelve gate_name, violating_rows y ci_action (\'PASS\' si violating_rows = 0, \'WARN_QUARANTINE\' si violating_rows < 500, y \'BLOCK_DEPLOY\' en caso contrario), ordenado por gate_name ascendente.',
    starterCode: `WITH ci_checks AS (
  SELECT '1_unicidad_orders_pk' AS gate_name,
         COUNT(*) - COUNT(DISTINCT order_id) AS violating_rows
  FROM orders
  UNION ALL
  SELECT '2_cobros_capturados_duplicados',
         COUNT(*) - COUNT(DISTINCT order_id)
  FROM payments
  WHERE status = 'captured'
  UNION ALL
  -- Completa las reglas 3 y 4 con UNION ALL
  SELECT '3_reembolsos_estado_inconsistente',
         0
  UNION ALL
  SELECT '4_eventos_sin_customer_id',
         0
)
SELECT gate_name,
       violating_rows,
       -- Clasifica en 'PASS' (= 0), 'WARN_QUARANTINE' (< 500) o 'BLOCK_DEPLOY' (>= 500)
       'PENDIENTE' AS ci_action
FROM ci_checks
ORDER BY gate_name ASC;`,
    expected: `WITH ci_checks AS (
  SELECT '1_unicidad_orders_pk' AS gate_name,
         COUNT(*) - COUNT(DISTINCT order_id) AS violating_rows
  FROM orders
  UNION ALL
  SELECT '2_cobros_capturados_duplicados',
         COUNT(*) - COUNT(DISTINCT order_id)
  FROM payments
  WHERE status = 'captured'
  UNION ALL
  SELECT '3_reembolsos_estado_inconsistente',
         COUNT(*)
  FROM refunds r
  JOIN orders o ON r.order_id = o.order_id
  WHERE o.status <> 'refunded'
  UNION ALL
  SELECT '4_eventos_sin_customer_id',
         COUNT(*)
  FROM events
  WHERE customer_id IS NULL
)
SELECT gate_name,
       violating_rows,
       CASE
         WHEN violating_rows = 0 THEN 'PASS'
         WHEN violating_rows < 500 THEN 'WARN_QUARANTINE'
         ELSE 'BLOCK_DEPLOY'
       END AS ci_action
FROM ci_checks
ORDER BY gate_name ASC;`,
    orderMatters: true,
    hints: [
      'Para la regla 3 escribe: SELECT \'3_reembolsos_estado_inconsistente\', COUNT(*) FROM refunds r JOIN orders o ON r.order_id = o.order_id WHERE o.status <> \'refunded\'.',
      'Para la regla 4 escribe: SELECT \'4_eventos_sin_customer_id\', COUNT(*) FROM events WHERE customer_id IS NULL.',
      'En el SELECT externo usa CASE WHEN violating_rows = 0 THEN \'PASS\' WHEN violating_rows < 500 THEN \'WARN_QUARANTINE\' ELSE \'BLOCK_DEPLOY\' END AS ci_action.',
    ],
    solution: `WITH ci_checks AS (
  SELECT '1_unicidad_orders_pk' AS gate_name,
         COUNT(*) - COUNT(DISTINCT order_id) AS violating_rows
  FROM orders
  UNION ALL
  SELECT '2_cobros_capturados_duplicados',
         COUNT(*) - COUNT(DISTINCT order_id)
  FROM payments
  WHERE status = 'captured'
  UNION ALL
  SELECT '3_reembolsos_estado_inconsistente',
         COUNT(*)
  FROM refunds r
  JOIN orders o ON r.order_id = o.order_id
  WHERE o.status <> 'refunded'
  UNION ALL
  SELECT '4_eventos_sin_customer_id',
         COUNT(*)
  FROM events
  WHERE customer_id IS NULL
)
SELECT gate_name,
       violating_rows,
       CASE
         WHEN violating_rows = 0 THEN 'PASS'
         WHEN violating_rows < 500 THEN 'WARN_QUARANTINE'
         ELSE 'BLOCK_DEPLOY'
       END AS ci_action
FROM ci_checks
ORDER BY gate_name ASC;`,
    solutionExplanation: 'La consulta consolida cuatro contratos de datos en una sola tabla de decisión para el ejecutor de CI/CD: aprueba la unicidad de orders (0 fallos), envía a cuarentena los 405 cobros capturados duplicados y bloquea la promoción directa a Gold de los 1 450 reembolsos desincronizados y de los 6 715 eventos sin cliente hasta que la capa Silver los procese explícitamente.',
    expectedOutputTable: [
      { gate_name: '1_unicidad_orders_pk', violating_rows: 0, ci_action: 'PASS' },
      { gate_name: '2_cobros_capturados_duplicados', violating_rows: 405, ci_action: 'WARN_QUARANTINE' },
      { gate_name: '3_reembolsos_estado_inconsistente', violating_rows: 1450, ci_action: 'BLOCK_DEPLOY' },
      { gate_name: '4_eventos_sin_customer_id', violating_rows: 6715, ci_action: 'BLOCK_DEPLOY' },
    ],
  },

  roleNotes: {
    de: 'Prohíbe los cambios manuales en consola sobre entornos productivos. Versiona todos los recursos en módulos de Terraform con estado remoto bloqueado y exige que cada Pull Request supere tanto terraform plan como las compuertas SQL de contratos.',
    da: 'Traduce tus hallazgos de anomalías (como reembolsos sobre órdenes marcadas como completadas) en consultas de aserción SQL dentro del repositorio para que la tubería de CI/CD impida que el problema reaparezca en el futuro.',
    bi: 'Cuando una métrica cambie de definición o requiera nuevas columnas en Gold, coordina el cambio mediante un Pull Request que actualice de forma sincronizada el contrato SQL y la capa semántica tras superar las pruebas de CI.',
  },

  summary: [
    'Terraform gestiona la infraestructura de datos de forma declarativa mediante recursos, módulos por entorno y un archivo de estado remoto con bloqueo concurrente.',
    'La deriva de infraestructura (drift) ocurre cuando cambios manuales en consola desincronizan la nube respecto al código versionado en Git.',
    'Las cubetas y tablas con datos históricos requieren la regla lifecycle { prevent_destroy = true } para evitar borrados accidentales durante un reemplazo.',
    'Las tuberías CI/CD para datos combinan validación de infraestructura con compuertas SQL que bloquean despliegues ante duplicidades o invariantes rotos.',
  ],

  flashcards: [
    {
      id: 'de4-plataforma-04-iac-terraform-cicd-datos-fc-1',
      front: '¿Qué es la deriva de infraestructura (infrastructure drift) y cómo se detecta en Terraform?',
      back: 'Es la diferencia entre la configuración real en la nube (alterada manualmente o por fallos externos) y el código declarativo en Git; se detecta al ejecutar terraform plan y comparar el estado remoto con la infraestructura real.',
    },
    {
      id: 'de4-plataforma-04-iac-terraform-cicd-datos-fc-2',
      front: '¿Por qué es crítico incluir prevent_destroy = true en los recursos de almacenamiento de datos en Terraform?',
      back: 'Porque ciertos cambios de configuración obligan a reemplazar el recurso (destruirlo y crearlo de nuevo), lo que borraría irreversiblemente las tablas Parquet e Iceberg si no existe esa salvaguarda.',
    },
    {
      id: 'de4-plataforma-04-iac-terraform-cicd-datos-fc-3',
      front: '¿Para qué sirven los módulos en Terraform dentro de una plataforma de datos?',
      back: 'Para encapsular un conjunto coherente de recursos (cubeta, catálogo, roles IAM) y reutilizarlo con distintos parámetros en los entornos dev, staging y prod sin copiar ni pegar código.',
    },
    {
      id: 'de4-plataforma-04-iac-terraform-cicd-datos-fc-4',
      front: '¿Qué diferencia existe entre una prueba de esquema estática y una compuerta de invariante de negocio en CI/CD de datos?',
      back: 'La prueba estática solo revisa nombres y tipos de columna, mientras que la compuerta de invariante ejecuta consultas sobre los datos (por ejemplo, verificar que toda orden con reembolso tenga estado refunded) antes de publicar.',
    },
  ],

  glossaryTerms: [
    'estado-remoto-iac-drift',
    'planos-arquitectura-datos',
    'c19-data-contracts-odcs',
  ],

  sources: [
    {
      title: 'Terraform Language Documentation — Resources Overview',
      url: 'https://developer.hashicorp.com/terraform/language/resources',
      publisher: 'HashiCorp',
      accessed: '2026-10-29',
      supports: 'Declaración de recursos en HCL, ciclo plan/apply y meta-argumento lifecycle prevent_destroy.',
    },
    {
      title: 'Terraform Language Documentation — State',
      url: 'https://developer.hashicorp.com/terraform/language/state',
      publisher: 'HashiCorp',
      accessed: '2026-10-29',
      supports: 'Funcionamiento del archivo de estado, backends remotos, bloqueo de estado (locking) y deriva.',
    },
    {
      title: 'Terraform Language Documentation — Modules Overview',
      url: 'https://developer.hashicorp.com/terraform/language/modules',
      publisher: 'HashiCorp',
      accessed: '2026-10-29',
      supports: 'Diseño de módulos reutilizables para promover infraestructura entre entornos dev, staging y prod.',
    },
    {
      title: 'GitHub Actions Documentation — Understanding GitHub Actions',
      url: 'https://docs.github.com/en/actions/about-github-actions/understanding-github-actions',
      publisher: 'GitHub',
      accessed: '2026-10-29',
      supports: 'Automatización de flujos de integración y entrega continua disparados por Pull Requests.',
    },
  ],

  aiNotes: 'Destaca la diferencia entre gestionar infraestructura sin estado y proteger recursos de datos con estado usando prevent_destroy y state locking en Terraform. En la práctica SQL, guía al alumno para construir las reglas 3 y 4 del CTE ci_checks y clasificar la severidad con CASE WHEN.',
};

export default lesson;
