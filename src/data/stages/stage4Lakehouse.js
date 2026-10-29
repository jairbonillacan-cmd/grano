export const STAGE_4_LESSONS = [
  // ==========================================================================
  // LECCIÓN 10: ARQUITECTURA MEDALLION Y APACHE ICEBERG V3
  // ==========================================================================
  {
    id: 'l10-iceberg-v3-medallion',
    stageId: 'stage-4',
    order: 10,
    title: 'Tablas abiertas con Apache Iceberg',
    subtitle: 'Metadatos transaccionales sobre almacenamiento de objetos, vectores de borrado y particionamiento oculto.',
    duration: '30 min',
    level: 'Intermedio',
    bloomLevel: 'apply',
    coreFocus: ['DE', 'DA', 'BI'],
    goal: 'Aplicar una arquitectura Medallion (Bronze, Silver, Gold) sobre Apache Iceberg v3 utilizando Deletion Vectors en archivos Puffin, el tipo nativo VARIANT para datos semi-estructurados, Hidden Partitioning y el patrón Write-Audit-Publish (WAP).',
    visualType: 'iceberg-v3-snapshot-explorer',
    storyContext:
      'En NovaPay almacenábamos 18,000 archivos Parquet sueltos en carpetas de Amazon S3 (`s3://novapay-data/orders/`). Esa arquitectura sufría tres fallos críticos en producción: 1) Cuando un job de ingesta fallaba a mitad de camino, los dashboards ejecutivos de BI leían datos parcialmente escritos y mostraban caídas falsas del 60% en ventas; 2) Cuando por normativa GDPR o contracargos debíamos actualizar o borrar 400 pedidos del último año, teníamos que reescribir archivos Parquet enteros de 512 MB; 3) Los webhooks móviles enviaban payloads JSON cambiantes que rompían el esquema cada semana. Al migrar a Apache Iceberg v3 con un Catálogo REST (Apache Polaris), las lecturas sucias desaparecieron, las actualizaciones pasaron a tardar milisegundos con Deletion Vectors y el JSON se consulta a velocidad columnar con el tipo VARIANT.',
    sections: [
      {
        heading: 'Capas bronze, silver y gold: responsabilidades técnicas y semánticas',
        body: 'Organizar un Open Lakehouse no consiste en copiar tablas sin criterio, sino en establecer contratos de confianza progresivos a través de tres capas:\n• Capa Bronze (Cruda e Inmutable): Aterriza los eventos exactamente como llegaron desde CDC (Debezium), Kafka o APIs externas, añadiendo metadatos técnicos (`_ingested_at`, `_source_file`, `_cdc_op`). Nunca se borra ni se sobrescribe la historia cruda; si descubrimos un error de lógica seis meses después, podemos reprocesar Silver desde Bronze sin pedir datos de nuevo al equipo de backend.\n• Capa Silver (Limpia, Tipada, Deduplicada y Conformada): Aquí Ingeniería de Datos (DE) aplica deduplicación determinista (`QUALIFY ROW_NUMBER()`), estandariza zonas horarias a UTC, valida tipos y modela entidades de negocio claras (Tablas de Hechos y Dimensiones SCD Tipo 2). Es el entorno de trabajo principal de Análisis de Datos (DA) y Ciencia de Datos.\n• Capa Gold (Gobernada y Optimizada para Decisión): Contiene modelos dimensionales listos para consumo, tablas pre-agregadas y métricas certificadas con reglas de negocio aplicadas. Es la capa que alimenta la Capa Semántica y los tableros de Business Intelligence (BI) en modo Direct Lake / Zero-Copy.',
      },
      {
        heading: 'Estructura de metadatos en Apache Iceberg: del catálogo REST al archivo de datos',
        body: 'Un conjunto de archivos Parquet por sí solo no sabe qué archivos pertenecen a una transacción válida ni cuáles están siendo escritos en este instante. Apache Iceberg resuelve esto introduciendo una jerarquía de metadatos inmutable en tres niveles:\n1) Catálogo REST (Apache Polaris, Unity Catalog, Nessie o Gravitino): Mantiene la referencia atómica (puntero CAS — Compare-And-Swap) hacia el archivo `metadata.json` vigente de cada tabla.\n2) Metadata File (`v42.metadata.json`) y Manifest List (`snap-8912.avro`): El archivo de metadatos registra el esquema de la tabla, la especificación de particionado y el historial de Snapshots. Cada Snapshot apunta a una *Manifest List*, la cual contiene estadísticas de rango por partición que permiten descartar directorios enteros en milisegundos.\n3) Manifest Files y Data Files: Cada *Manifest File* lista los archivos físicos de datos (`.parquet`, `.vortex` o `.lance`) junto con los límites mínimos y máximos (`lower_bounds` / `upper_bounds`) y conteos de nulos de cada columna. Así, el motor analítico (DuckDB, Spark, Trino) poda el 95%+ de los archivos leyendo solo metadatos antes de abrir un solo archivo Parquet.',
      },
      {
        heading: 'Vectores de borrado, linaje de filas y tipo semiestructurado VARIANT en Iceberg v3',
        body: 'La especificación v3 de Apache Iceberg (`format-version = 3`) consolida tres avances fundamentales para cargas modernas de baja latencia:\n• Deletion Vectors (DVs) en Archivos Puffin: En versiones antiguas, borrar o actualizar filas en modo *Merge-on-Read* generaba múltiples archivos pequeños de borrado posicional que degradaban las lecturas. En Iceberg v3 se emplean **Deletion Vectors**: mapas de bits comprimidos (*Roaring Bitmaps*) almacenados dentro de archivos laterales `.puffin`. Iceberg v3 garantiza que exista como máximo un Deletion Vector activo por cada archivo de datos Parquet, reduciendo drásticamente el costo de unir borrados en tiempo de lectura.\n• Tipo de Dato Nativo `VARIANT`: Permite almacenar payloads semi-estructurados (JSON de eventos móviles, telemetría IoT o respuestas de LLMs) descomponiendo automáticamente (*shredding*) las sub-columnas frecuentes en formato columnar tipado. Obtienes la flexibilidad de un documento sin esquema con la velocidad de escaneo y compresión de Parquet.\n• Row-Level Lineage Nativo (`_row_id` y `_last_updated_sequence_number`): Cada fila recibe un identificador estable y número de secuencia que permite a motores como SQLMesh, Spark o Flink calcular exactamente qué filas cambiaron entre dos snapshots sin hacer costosos `FULL OUTER JOIN`.',
      },
      {
        heading: 'Particionamiento oculto, evolución de esquema y patrón write-audit-publish',
        body: 'En los antiguos Data Lakes estilo Hive, si particionabas por día tenías que crear una columna física `event_day_str = "2026-10-28"` y rezar para que ningún analista olvidara incluirla en su `WHERE` (si filtraban solo por `event_ts`, el motor escaneaba toda la tabla). Con **Hidden Partitioning** en Iceberg, declaras `PARTITIONED BY (days(event_ts), bucket(16, customer_id))`: el usuario filtra naturalmente por `WHERE event_ts >= TIMESTAMP \'2026-10-01\'` e Iceberg calcula y poda las particiones automáticamente.\nAdemás, con **Partition Evolution**, puedes cambiar la estrategia de particionado de mensual (`months(event_ts)`) a diaria (`days(event_ts)`) con una operación de metadatos instantánea: los terabytes antiguos permanecen intactos con el layout mensual y los nuevos se escriben por día.\nFinalmente, el soporte de ramas a nivel de catálogo permite el patrón **Write-Audit-Publish (WAP)**: el pipeline escribe el nuevo lote en una rama aislada (`audit_branch`), ejecuta validaciones estadísticas y de contratos, y solo ejecuta un `fast-forward merge` hacia la rama `main` cuando el 100% de las pruebas pasan.',
      },
    ],
    triadPerspectives: {
      DE: {
        title: 'Qué construye ingeniería de datos (DE)',
        points: [
          'Define tablas con `format-version = 3`, configura `write.delete.mode = merge-on-read` con Deletion Vectors para upserts rápidos desde CDC/Flink y programa trabajos asíncronos de compactación (`rewrite_data_files`) y expiración de snapshots.',
          'Implementa el flujo Write-Audit-Publish (WAP) sobre ramas del Catálogo REST (Polaris / Unity) y utiliza credenciales efímeras (*Vended Credentials*) para controlar el acceso al almacenamiento de objetos.',
        ],
      },
      DA: {
        title: 'Qué explora análisis de datos (DA)',
        points: [
          'Utiliza `FOR SYSTEM_TIME AS OF` y `FOR SYSTEM_VERSION AS OF` (Time Travel) para reproducir al 100% los datos exactos con los que se presentó un informe ejecutivo o se entrenó un modelo predictivo.',
          'Extrae atributos anidados desde columnas `VARIANT` (`payload:checkout.payment_method::STRING`) con velocidad columnar y crea ramas ligeras (*Zero-Copy branches*) para experimentar limpiezas sin duplicar almacenamiento.',
        ],
      },
      BI: {
        title: 'Qué gobierna business intelligence (BI)',
        points: [
          'Conecta los tableros ejecutivos directamente a las tablas Gold de Apache Iceberg mediante arquitecturas **Direct Lake / Zero-Copy**, eliminando los extractos propietarios desactualizados.',
          'Confía en que ningún comité ejecutivo verá tablas a medio cargar gracias al aislamiento transaccional de los Snapshots y la publicación atómica WAP.',
        ],
      },
    },
    relatedLessons: [
      {
        id: 'l7-columnar-parquet',
        reason: 'Comprende cómo los archivos Parquet físicos y sus Zone Maps operan debajo del árbol de metadatos de Apache Iceberg v3.',
      },
      {
        id: 'l11-dbt-sqlmesh-dag',
        reason: 'Descubre cómo orquestar las transformaciones de Bronze a Silver y Gold sobre tablas Iceberg usando dbt y SQLMesh.',
      },
      {
        id: 'l16-cdc-kafka-streaming',
        reason: 'Aprende cómo los flujos CDC en tiempo real aterrizan continuamente en tablas Iceberg v3 usando Deletion Vectors.',
      },
    ],
    playground: {
      description:
        'Compara el antipatrón de sobrescribir archivos Parquet sueltos en S3 frente a operar una tabla transaccional Apache Iceberg v3 con Deletion Vectors, VARIANT y Time Travel:',
      badQueryLabel: 'Antipatrón: sobrescritura de Parquet sueltos sin catálogo',
      badQuery: `-- PELIGRO: Sobrescribir archivos en S3 sin capa transaccional ACID.
-- 1) Los dashboards de BI que consulten durante la escritura fallan o ven datos duplicados/incompletos.
-- 2) Borrar 1 pedido obliga a reescribir todo el archivo Parquet completo.
-- 3) El campo JSON 'raw_payload' guardado como VARCHAR obliga a parsear texto fila por fila.
COPY (
  SELECT * FROM raw_orders WHERE order_id <> 'ORD-88410'
) TO 's3://novapay-lake/silver/orders/*.parquet' (FORMAT PARQUET, OVERWRITE true);`,
      badResult: [
        {
          lecturas_concurrentes_bi: 'ERROR FileNotFound / Datos a mitad de carga',
          costo_borrar_1_fila: 'Reescritura de 512 MB en S3 (6.8 seg)',
          time_travel_auditoria: 'Imposible (archivos anteriores destruidos)',
        },
      ],
      goodQueryLabel: 'Solución óptima: tabla Apache Iceberg v3 con vectores de borrado',
      goodQuery: `-- 1. Creación de tabla Apache Iceberg v3 con Hidden Partitioning y tipo VARIANT
CREATE TABLE polaris_cat.silver.orders_v3 (
  order_id STRING NOT NULL,
  customer_id BIGINT NOT NULL,
  event_ts TIMESTAMPTZ NOT NULL,
  order_status STRING,
  net_amount_usd DECIMAL(12, 2),
  telemetry_payload VARIANT
)
USING iceberg
PARTITIONED BY (days(event_ts), bucket(16, customer_id))
TBLPROPERTIES (
  'format-version' = '3',
  'write.delete.mode' = 'merge-on-read',
  'write.update.mode' = 'merge-on-read'
);

-- 2. Actualización atómica instantánea (escribe un Deletion Vector en archivo .puffin)
UPDATE polaris_cat.silver.orders_v3
SET order_status = 'REFUNDED', net_amount_usd = 0.00
WHERE order_id = 'ORD-88410';

-- 3. Consulta analítica combinando extracción VARIANT y Time Travel reproducible
SELECT
  telemetry_payload:device.os::STRING AS device_os,
  SUM(net_amount_usd) AS revenue_actual_usd,
  (SELECT SUM(net_amount_usd)
   FROM polaris_cat.silver.orders_v3
   FOR SYSTEM_TIME AS OF CURRENT_TIMESTAMP - INTERVAL '24' HOUR) AS revenue_hace_24h_usd
FROM polaris_cat.silver.orders_v3
WHERE event_ts >= TIMESTAMP '2026-10-01 00:00:00Z'
GROUP BY 1;`,
      goodResult: [
        {
          device_os: 'iOS 19.1',
          revenue_actual_usd: '$842,190.00 (Snapshot #104 atómico)',
          revenue_hace_24h_usd: '$842,540.00 (Snapshot #98 vía Time Travel)',
        },
      ],
    },
    codeChallenge: {
      title: 'Esquema Iceberg v3 y viaje temporal',
      instruction:
        'Completa las 3 piezas clave de esta sentencia SQL sobre el catálogo Apache Iceberg v3 para: 1) declarar la columna semi-estructurada con el tipo nativo de Iceberg v3, 2) activar la versión 3 de la especificación en `TBLPROPERTIES`, y 3) consultar el estado histórico exacto de la tabla con la cláusula estándar de Time Travel.',
      templateCode: `CREATE TABLE polaris.silver.checkout_events (
  event_id UUID NOT NULL,
  customer_id BIGINT NOT NULL,
  event_ts TIMESTAMPTZ NOT NULL,
  gateway_metadata {{blank_1}},
  amount_usd DECIMAL(10,2)
)
USING iceberg
PARTITIONED BY (days(event_ts))
TBLPROPERTIES (
  'format-version' = '{{blank_2}}',
  'write.update.mode' = 'merge-on-read'
);

-- Auditar los ingresos exactos registrados al cierre del 20 de producción:
SELECT SUM(amount_usd) AS audited_revenue_usd
FROM polaris.silver.checkout_events
{{blank_3}} TIMESTAMP '2026-10-20 23:59:59Z';`,
      blanks: [
        {
          id: 'blank_1',
          placeholder: 'TIPO_SEMI_ESTRUCTURADO',
          acceptedAnswers: ['VARIANT', 'variant'],
          hint: 'En Iceberg v3 (2026), ¿qué tipo de dato nativo reemplaza a los strings JSON planos permitiendo sub-columnarización automática?',
          hints: [
            'Nivel 1 (Concepto): Es el nuevo tipo de dato de la especificación Apache Iceberg v3 diseñado para almacenar JSON semi-estructurado con shredding columnar.',
            'Nivel 2 (Sintaxis): Empieza con V y tiene 7 letras.',
            'Nivel 3 (Solución): Escribe VARIANT',
          ],
        },
        {
          id: 'blank_2',
          placeholder: 'VERSION',
          acceptedAnswers: ['3', 'v3'],
          hint: '¿Qué número de versión de formato de tabla habilita los Deletion Vectors en archivos Puffin, Row-Level Lineage y el tipo VARIANT?',
          hints: [
            'Nivel 1 (Concepto): Corresponde a la tercera generación de la especificación de tablas Apache Iceberg.',
            'Nivel 2 (Sintaxis): Es un único dígito numérico entero.',
            'Nivel 3 (Solución): Escribe 3',
          ],
        },
        {
          id: 'blank_3',
          placeholder: 'CLAUSULA_TIME_TRAVEL',
          acceptedAnswers: ['FOR SYSTEM_TIME AS OF', 'for system_time as of', 'TIMESTAMP AS OF'],
          hint: 'Escribe la cláusula SQL estándar de 4 palabras para viajar en el tiempo a una marca temporal pasada.',
          hints: [
            'Nivel 1 (Concepto): Es la cláusula SQL:2011 / Iceberg que indica al motor que resuelva el Snapshot vigente en ese instante del tiempo del sistema.',
            'Nivel 2 (Sintaxis): Estructura: FOR SYSTEM_TIME ... ...',
            'Nivel 3 (Solución): Escribe FOR SYSTEM_TIME AS OF',
          ],
        },
      ],
      expectedOutputTable: [
        {
          snapshot_id: '88492019482',
          format_version: 'v3 (Deletion Vectors + VARIANT)',
          audited_revenue_usd: '$1,294,810.50',
          isolation_status: '100% Reproducible',
        },
      ],
      rubricCriteria: [
        {
          criterion: 'Uso del tipo VARIANT en Iceberg',
          title: 'Uso del tipo VARIANT en Iceberg',
          description: 'Declara correctamente columnas semi-estructuradas con VARIANT para habilitar sub-columnarización y evitar el parseo lento de strings JSON.',
          points: 35,
          role: 'DE',
        },
        {
          criterion: 'Configuración de versión 3 en tabla',
          title: 'Configuración de versión 3 en tabla',
          description: 'Configura format-version = 3 con merge-on-read para que las actualizaciones generen Deletion Vectors binarios en archivos Puffin.',
          points: 35,
          role: 'DE',
        },
        {
          criterion: 'Reproducibilidad analítica mediante viaje temporal',
          title: 'Reproducibilidad analítica mediante viaje temporal',
          description: 'Emplea FOR SYSTEM_TIME AS OF para auditar estados pasados de la tabla sin alterar las vistas de BI en producción.',
          points: 30,
          role: 'DA',
        },
      ],
    },
    pipelineChallenge: {
      title: 'Ciclo de escritura, auditoría y publicación',
      scenario:
        'Ordena los 5 pasos arquitectónicos para ingerir, transformar, auditar y publicar un nuevo lote de pedidos en el Lakehouse garantizando que ningún dashboard de BI lea datos corruptos o incompletos:',
      steps: [
        {
          id: 'step-1-bronze-append',
          label: '1. Ingesta inmutable de eventos crudos CDC en la tabla Bronze de Iceberg con metadatos _ingested_at',
          role: 'DE',
          detail: 'Preserva la evidencia original exacta recibida desde Kafka/Debezium para permitir reprocesamiento histórico.',
        },
        {
          id: 'step-2-wap-branch',
          label: '2. Creación de rama aislada Zero-Copy (audit_branch) en el Catálogo REST y escritura del cambio Silver con Deletion Vectors',
          role: 'DE',
          detail: 'Escribe los nuevos archivos Parquet y bitmaps Puffin en una rama separada sin tocar el puntero main que lee BI.',
        },
        {
          id: 'step-3-quality-audit',
          label: '3. Ejecución de auditorías automáticas de calidad (0% nulos en claves, reconciliación de sumas y Z-score de volumen) sobre audit_branch',
          role: 'DA',
          detail: 'Verifica tanto reglas deterministas de esquema como ausencia de anomalías estadísticas antes de exponer los datos.',
        },
        {
          id: 'step-4-atomic-publish',
          label: '4. Fast-Forward Merge atómico de audit_branch hacia la rama main en el Catálogo REST Apache Polaris',
          role: 'DE',
          detail: 'Intercambia el puntero del Snapshot actual en milisegundos mediante una operación Compare-And-Swap (CAS).',
        },
        {
          id: 'step-5-direct-lake-bi',
          label: '5. Lectura Zero-Copy desde los dashboards de BI y notebooks de DA apuntando al nuevo Snapshot certificado en main',
          role: 'BI',
          detail: 'Los consumidores ven la actualización completa de forma instantánea sin caídas ni estados intermedios.',
        },
      ],
      explanation:
        'En el patrón Write-Audit-Publish (WAP), la clave es que los datos crudos primero se aseguran en Bronze (1), luego las transformaciones hacia Silver/Gold se escriben en una rama aislada (2), se validan rigurosamente con pruebas deterministas y estadísticas (3), se promueven atómicamente cambiando el puntero en el catálogo REST (4) y finalmente son consumidas por BI y DA sin riesgo de lecturas sucias (5).',
    },
    checkpoint: {
      question:
        'En una tabla Apache Iceberg v3 de 50 TB con modo Merge-on-Read activado, llega una solicitud para actualizar el estado de 2,500 pedidos repartidos en 80 archivos Parquet. ¿Qué hace exactamente Iceberg v3 en el momento del UPDATE?',
      options: [
        {
          id: 'a',
          text: 'Escribe los 2,500 registros actualizados en un nuevo archivo Parquet pequeño y genera/actualiza un Deletion Vector (bitmap Roaring en un archivo Puffin) por cada archivo afectado para marcar las posiciones antiguas como borradas, publicando un nuevo Snapshot sin reescribir los 80 archivos Parquet.',
          correct: true,
          feedback:
            'Exacto. Los Deletion Vectors en archivos Puffin de Iceberg v3 marcan mediante un bitmap las posiciones de fila invalidadas en milisegundos, delegando la reescritura física a un trabajo de compactación en segundo plano.',
        },
        {
          id: 'b',
          text: 'Bloquea todas las consultas de BI durante 45 minutos mientras descarga, descomprime, modifica y vuelve a subir los 80 archivos Parquet completos a S3.',
          correct: false,
          feedback:
            'Eso describiría una estrategia Copy-on-Write mal optimizada y sin aislamiento de snapshots. Con Merge-on-Read y Deletion Vectors v3 la operación es casi instantánea y no bloquea a los lectores.',
        },
        {
          id: 'c',
          text: 'Modifica directamente los bytes internos en mitad de los archivos Parquet existentes en S3 usando edición in-place.',
          correct: false,
          feedback:
            'El almacenamiento de objetos (S3/GCS/ADLS) y los archivos Parquet son estrictamente inmutables: nunca se editan bytes in-place.',
        },
      ],
    },
  },

  // ==========================================================================
  // LECCIÓN 11: TRANSFORMACIÓN MODERNA CON DBT Y SQLMESH
  // ==========================================================================
  {
    id: 'l11-dbt-sqlmesh-dag',
    stageId: 'stage-4',
    order: 11,
    title: 'Transformación declarativa con dbt y SQLMesh',
    subtitle: 'Grafos de dependencias SQL, análisis sintáctico de consultas y entornos virtuales sobre vistas.',
    duration: '35 min',
    level: 'Avanzado',
    bloomLevel: 'evaluate',
    coreFocus: ['DE', 'DA', 'BI'],
    goal: 'Evaluar arquitecturas de transformación de datos comparando el enfoque basado en plantillas Jinja (dbt) frente al análisis de Árbol Sintáctico Abstracto (AST con SQLGlot) y Entornos Virtuales de Datos (SQLMesh), diseñando cargas incrementales idempotentes por rangos temporales.',
    visualType: 'dbt-sqlmesh-dag-explorer',
    storyContext:
      'En una fintech con 240 modelos SQL y 15 ingenieros y analistas haciendo cambios diarios, cada vez que alguien abría un Pull Request para añadir una columna en un modelo intermedio (`int_customer_payments`), su entorno de desarrollo recalculaba desde cero 30 tablas aguas abajo (8 TB en total). La factura cloud de entornos `dev` superaba los $14,000 al mes y probar un cambio tardaba 75 minutos. Peor aún: un modelo incremental configurado con `WHERE event_ts > (SELECT MAX(event_ts) FROM this)` dejó un hueco silencioso de 6 horas cuando un microservicio entregó eventos atrasados. Al adoptar análisis AST con SQLGlot y Entornos Virtuales de Datos por intervalos en SQLMesh junto a una estructura modular Staging → Intermediate → Marts, el tiempo de validación en PR bajó a 40 segundos y los huecos de datos desaparecieron.',
    sections: [
      {
        heading: 'De procedimientos almacenados a grafos modulares (staging, intermediate y marts)',
        body: 'El principio central de la ingeniería de transformación moderna (popularizado por **dbt** y evolucionado por **SQLMesh**) es que toda transformación debe ser una sentencia `SELECT` declarativa, pura, idempotente y versionada en Git. El motor construye automáticamente el **DAG (Grafo Acíclico Dirigido)** de dependencias y lo organiza en tres capas disciplinadas:\n• **Staging (`stg_`)**: Relación 1:1 con las tablas fuente de Bronze. Solo renombra columnas al estándar de la empresa, aplica conversiones de tipos (`CAST`), limpia strings vacíos y deduplica por clave primaria. Cero joins complejos ni agregaciones.\n• **Intermediate (`int_`)**: Piezas modulares de lógica de negocio que unen múltiples modelos de Staging, resuelven intervalos temporales SCD2 o prorratean importes antes de exponerlos.\n• **Marts / Gold (`fct_` y `dim_`)**: Tablas de Hechos y Dimensiones listas para las áreas de negocio (`finance`, `product`, `growth`) y conectadas a la Capa Semántica.',
      },
      {
        heading: 'Modelos incrementales clásicos frente al seguimiento de estado por intervalos',
        body: 'El patrón incremental tradicional en SQL (`WHERE event_date > (SELECT MAX(event_date) FROM {{ this }})`) tiene tres defectos graves en producción:\n1) Si llegan datos tardíos de hace 2 días mientras ya entró un evento de hoy, `MAX(event_date)` es hoy y los datos de hace 2 días se ignoran por completo.\n2) Si el trabajo de ayer miércoles falló pero el de hoy jueves corrió, queda un hueco ("data gap") permanente el miércoles que nadie detecta.\n3) Si necesitas reprocesar solo el mes de agosto porque hubo un error en una tarifa, tienes que ejecutar un `--full-refresh` de los últimos 5 años o escribir parches manuales peligrosos.\n**SQLMesh** resuelve esto mediante **State-Based Interval Tracking** (`INCREMENTAL_BY_TIME_RANGE`): divide la línea del tiempo en intervalos discretos (horas o días) y registra en su base de estado exactamente qué intervalos han sido calculados para cada versión de cada modelo. Si falta el miércoles 14 de octubre, recalcula únicamente ese intervalo usando las variables inyectadas `@start_ts` y `@end_ts`.',
      },
      {
        heading: 'Análisis sintáctico de SQL mediante AST (SQLGlot) y linaje de columnas',
        body: 'Una plantilla Jinja tradicional trata tu consulta SQL como texto plano: no sabe si cambiaste un comentario, añadiste una columna nueva o alteraste la fórmula de un `WHERE`. En cambio, **SQLMesh** incorpora **SQLGlot**, un parser y transpilador que convierte cada consulta SQL en un **Árbol Sintáctico Abstracto (AST)** antes de enviarla a la base de datos.\nGracias al AST, la plataforma:\n• Detecta errores de sintaxis, tipos incompatibles y referencias a columnas inexistentes en milisegundos localmente, antes de gastar un centavo en el almacén cloud.\n• Construye **Linaje a Nivel de Columna (Column-Level Lineage)** automático a través de decenas de tablas.\n• Clasifica semánticamente cada cambio en tu Pull Request como **Breaking** (modificaste la lógica de un filtro o de una columna usada por 10 tablas hijas) vs. **Non-Breaking / Forward-Only** (solo añadiste una columna nueva al final que ninguna tabla hija usa todavía, por lo que no hace falta recalcular las 10 tablas hijas).',
      },
      {
        heading: 'Entornos virtuales de datos mediante vistas y promoción sin recálculo',
        body: '¿Cómo probar cambios sin duplicar terabytes entre `dev`, `staging` y `prod`? Mediante **Entornos Virtuales de Datos**:\n• Cada vez que modificas un modelo SQL, se calcula una huella criptográfica (*fingerprint*) de su AST y sus dependencias, creando una tabla física versionada en la capa interna (ej. `sqlmesh__silver__fct_orders__398a1f`).\n• Los entornos (`prod`, `dev_ana`, `pr_412`) son simplemente esquemas de **Vistas Ligeras** que apuntan a las tablas físicas correspondientes.\n• Si en tu rama `pr_412` solo modificaste 1 de los 240 modelos y el cambio es *Non-Breaking*, SQLMesh ejecuta el cálculo de ese único modelo para un rango de muestra y apunta las otras 239 vistas directamente a las tablas físicas ya calculadas en `prod` (Zero-Copy).\n• Cuando haces merge a `main`, **promover a producción no recalcula nada**: simplemente actualiza el puntero de la vista `prod.fct_orders` hacia la tabla física ya validada en el PR. Y si hay una alerta en BI, hacer rollback al estado anterior tarda menos de 1 segundo.',
      },
    ],
    triadPerspectives: {
      DE: {
        title: 'Qué construye ingeniería de datos (DE)',
        points: [
          'Diseña modelos `INCREMENTAL_BY_TIME_RANGE` con `batch_size` y `lookback` configurados para absorber eventos tardíos de forma idempotente sin hacer full-refresh.',
          'Utiliza la transpilación de SQLGlot para ejecutar tests unitarios SQL en memoria con DuckDB en el servidor de CI/CD en menos de 3 segundos antes de desplegar sobre Iceberg / Snowflake / Databricks.',
        ],
      },
      DA: {
        title: 'Qué evalúa análisis de datos (DA)',
        points: [
          'Inspecciona el Linaje a Nivel de Columna antes de alterar una regla de atribución o limpieza para verificar qué modelos de Machine Learning y qué métricas de BI se verán afectados.',
          'Define `audits` estadísticos y pruebas unitarias con datos semilla (`seeds`) que validan casos borde (reembolsos parciales, años bisiestos, clientes con múltiples monedas).',
        ],
      },
      BI: {
        title: 'Qué garantiza business intelligence (BI)',
        points: [
          'Se beneficia de despliegues Blue-Green atómicos (intercambio de punteros de vistas en el entorno `prod`), eliminando las ventanas de mantenimiento donde los dashboards mostraban tablas vacías mientras se reconstruían.',
          'Compara en el Pull Request el diff automático de métricas de negocio (`prod` vs `dev`) antes de aprobar cambios en el DAG.',
        ],
      },
    },
    relatedLessons: [
      {
        id: 'l10-iceberg-v3-medallion',
        reason: 'Las tablas físicas versionadas que gestionan dbt y SQLMesh se almacenan sobre Apache Iceberg v3.',
      },
      {
        id: 'l12-contracts-semantic-layer',
        reason: 'Conecta los modelos Marts/Gold del DAG directamente con Data Contracts (ODCS) y la Capa Semántica.',
      },
      {
        id: 'l5-scd2-history',
        reason: 'Automatiza la generación de dimensiones históricas SCD Tipo 2 dentro de tu DAG de transformación.',
      },
    ],
    playground: {
      description:
        'Compara el peligroso patrón incremental basado en `MAX(timestamp)` frente a un modelo declarativo por intervalos temporales con auditorías integradas y AST validado:',
      badQueryLabel: 'Antipatrón: modelo incremental con MAX(event_ts) sin auditoría',
      badQuery: `-- FRÁGIL: Si un día falla en un 50% o llegan eventos con 2 horas de retraso,
-- el filtro MAX(event_ts) salta esos registros por completo y corrompe los totales financieros.
{{ config(materialized='incremental', unique_key='payment_id') }}

SELECT
  payment_id,
  customer_id,
  CAST(event_ts AS DATE) AS payment_date,
  amount_cents / 100.0 AS amount_usd
FROM {{ source('bronze', 'raw_payments') }}
{% if is_incremental() %}
  WHERE event_ts > (SELECT MAX(event_ts) FROM {{ this }})
{% endif %};`,
      badResult: [
        {
          eventos_tardios_2h: 'Perdidos silenciosamente (No recarga ventana de lookback)',
          fallo_dia_intermedio: 'Deja hueco permanente en la serie temporal',
          costo_deploy_pr_a_prod: 'Recalcula en Dev y vuelve a recalcular en Prod (Doble gasto)',
        },
      ],
      goodQueryLabel: 'Solución óptima: modelo incremental por intervalo con auditoría',
      goodQuery: `MODEL (
  name silver.fct_payments,
  kind INCREMENTAL_BY_TIME_RANGE (
    time_column payment_date,
    batch_size 30,
    lookback 2
  ),
  owner 'revenue-analytics@novapay.io',
  cron '@hourly',
  grain (payment_id),
  audits (
    not_null(columns := (payment_id, customer_id, payment_date, amount_usd)),
    unique_values(columns := (payment_id)),
    accepted_range(column := amount_usd, min_v := 0.0, max_v := 500000.0)
  )
);

SELECT
  payment_id,
  customer_id,
  CAST(event_ts AS DATE) AS payment_date,
  ROUND(amount_cents / 100.0, 2) AS amount_usd
FROM bronze.raw_payments
WHERE event_ts BETWEEN @start_ts AND @end_ts
QUALIFY ROW_NUMBER() OVER (PARTITION BY payment_id ORDER BY ingested_at DESC) = 1;`,
      goodResult: [
        {
          eventos_tardios_2h: 'Capturados al 100% gracias a lookback = 2 e idempotencia por rango',
          fallo_dia_intermedio: 'Detectado y rellenado automáticamente por el registro de intervalos',
          costo_deploy_pr_a_prod: '0 seg en Prod (Promoción instantánea de puntero de vista)',
        },
      ],
    },
    codeChallenge: {
      title: 'Modelo incremental por rango en SQLMesh',
      instruction:
        'Completa la definición de este modelo SQLMesh en la capa Silver para que: 1) utilice la estrategia incremental por rango de tiempo (`INCREMENTAL_BY_TIME_RANGE`), 2) valide automáticamente que no existan valores nulos con el bloque de auditoría (`audits`), y 3) acote el escaneo de la tabla origen usando las macros de intervalo inyectadas (`@start_ts` y `@end_ts`).',
      templateCode: `MODEL (
  name silver.fct_daily_subscriptions,
  kind {{blank_1}} (
    time_column event_date,
    batch_size 14,
    lookback 2
  ),
  grain (subscription_id, event_date),
  {{blank_2}} (
    not_null(columns := (subscription_id, customer_id, mrr_usd)),
    positive_values(column := mrr_usd)
  )
);

SELECT
  subscription_id,
  customer_id,
  CAST(event_ts AS DATE) AS event_date,
  mrr_usd
FROM bronze.subscription_events
WHERE event_ts BETWEEN @start_ts AND {{blank_3}};`,
      blanks: [
        {
          id: 'blank_1',
          placeholder: 'TIPO_MODELO_INCREMENTAL',
          acceptedAnswers: ['INCREMENTAL_BY_TIME_RANGE', 'incremental_by_time_range'],
          hint: 'En SQLMesh, ¿cómo se llama el `kind` de modelo que rastrea intervalos de tiempo discretos y evita brechas de datos?',
          hints: [
            'Nivel 1 (Concepto): Indica que el modelo es incremental basado en un rango de tiempo (Time Range).',
            'Nivel 2 (Sintaxis): Cuatro palabras unidas por guiones bajos: INCREMENTAL_BY_..._...',
            'Nivel 3 (Solución): Escribe INCREMENTAL_BY_TIME_RANGE',
          ],
        },
        {
          id: 'blank_2',
          placeholder: 'BLOQUE_CALIDAD',
          acceptedAnswers: ['audits', 'AUDITS'],
          hint: '¿Qué propiedad del encabezado `MODEL (...)` ejecuta aserciones de calidad bloqueantes (WAP) inmediatamente después de calcular cada lote?',
          hints: [
            'Nivel 1 (Concepto): Es el bloque donde declaras validaciones como `not_null` y `positive_values`.',
            'Nivel 2 (Sintaxis): Palabra en plural en inglés para "auditorías".',
            'Nivel 3 (Solución): Escribe audits',
          ],
        },
        {
          id: 'blank_3',
          placeholder: 'MACRO_FIN_INTERVALO',
          acceptedAnswers: ['@end_ts', '@end_date'],
          hint: 'Junto con `@start_ts`, ¿cuál es la variable macro que acota el límite superior del intervalo temporal procesado?',
          hints: [
            'Nivel 1 (Concepto): Representa el timestamp final del intervalo que el planificador está rellenando.',
            'Nivel 2 (Sintaxis): Empieza con `@` igual que `@start_ts`.',
            'Nivel 3 (Solución): Escribe @end_ts',
          ],
        },
      ],
      expectedOutputTable: [
        {
          model_name: 'silver.fct_daily_subscriptions',
          ast_change_class: 'Non-Breaking (Validated via SQLGlot)',
          intervals_backfilled: '2026-10-14 .. 2026-10-28 (100% Complete)',
          audits_status: '2 / 2 Passed (0 nulls, all positive)',
        },
      ],
      rubricCriteria: [
        {
          criterion: 'Idempotencia por intervalos de tiempo',
          title: 'Idempotencia por intervalos de tiempo',
          description: 'Configura INCREMENTAL_BY_TIME_RANGE con lookback para absorber eventos retrasados y rellenar huecos sin duplicar ni perder filas.',
          points: 40,
          role: 'DE',
        },
        {
          criterion: 'Auditorías bloqueantes en el flujo',
          title: 'Auditorías bloqueantes en el flujo',
          description: 'Integra audits declarativos dentro del propio modelo para impedir que datos corruptos promuevan el puntero de producción.',
          points: 30,
          role: 'DA',
        },
        {
          criterion: 'Podado eficiente con variables de intervalo',
          title: 'Podado eficiente con variables de intervalo',
          description: 'Filtra el origen con BETWEEN @start_ts AND @end_ts para habilitar partition pruning sobre el Lakehouse.',
          points: 30,
          role: 'BI',
        },
      ],
    },
    pipelineChallenge: {
      title: 'Entorno virtual de datos en SQLMesh',
      scenario:
        'Un analista añade una nueva columna calculada `net_expansion_usd` en un modelo intermedio. Ordena los 5 pasos exactos que ejecuta el motor moderno de transformación desde el cambio en código hasta su publicación en producción:',
      steps: [
        {
          id: 'step-1-ast-parse',
          label: '1. Parseo del SQL a un Árbol Sintáctico Abstracto (AST) con SQLGlot y cálculo de huella digital (Fingerprint)',
          role: 'DE',
          detail: 'Valida tipos, sintaxis y linaje a nivel de columna localmente sin ejecutar consultas pesadas en la nube.',
        },
        {
          id: 'step-2-change-classification',
          label: '2. Clasificación semántica del cambio (Breaking vs. Non-Breaking) comparando el AST nuevo contra producción',
          role: 'DE',
          detail: 'Detecta que añadir `net_expansion_usd` no altera las columnas existentes que consumen los otros 20 modelos hijos.',
        },
        {
          id: 'step-3-virtual-env-backfill',
          label: '3. Creación del Entorno Virtual Dev (`dev_pr`): materializa solo el modelo modificado y reutiliza vía vistas las 20 tablas hijas de Prod',
          role: 'DA',
          detail: 'Evita clonar o recalcular terabytes innecesarios; el entorno completo queda listo en segundos.',
        },
        {
          id: 'step-4-unit-and-audit-tests',
          label: '4. Ejecución de Unit Tests SQL en DuckDB y Audits estadísticos sobre los intervalos calculados en el entorno virtual',
          role: 'DA',
          detail: 'Comprueba que la fórmula de expansión neta cumple todos los casos borde y conciliaciones financieras.',
        },
        {
          id: 'step-5-pointer-swap-prod',
          label: '5. Promoción Virtual a Producción (Plan Apply): intercambia el puntero de la vista `prod` hacia la tabla física ya validada en 0 segundos',
          role: 'BI',
          detail: 'Cero doble cómputo al hacer merge a main y capacidad de rollback instantáneo si negocio lo solicita.',
        },
      ],
      explanation:
        'La ventaja competitiva de los Entornos Virtuales de Datos radica en analizar primero el AST con SQLGlot (1), clasificar el radio de impacto real por columna (2), calcular los intervalos afectados una única vez en el entorno virtual reutilizando el resto en Zero-Copy (3), auditar los resultados (4) y promover a producción intercambiando punteros de vistas sin volver a pagar cómputo (5).',
    },
    checkpoint: {
      question:
        'Modificas un modelo intermedio `int_orders` que alimenta a 15 tablas Gold de 1 TB cada una. El único cambio que hiciste fue agregar una columna nueva `discount_coupon_code` que solo será usada por 1 de las 15 tablas Gold. ¿Cómo actúa SQLMesh al crear tu entorno de desarrollo?',
      options: [
        {
          id: 'a',
          text: 'Al analizar el AST y el linaje por columna, clasifica el cambio como Non-Breaking (aditivo): recalcula únicamente `int_orders` y la única tabla Gold que usa la nueva columna, mientras que las otras 14 tablas Gold en tu entorno dev apuntan directamente a las tablas físicas de producción sin recalcularse.',
          correct: true,
          feedback:
            'Exacto. El análisis semántico del AST con SQLGlot junto a los Entornos Virtuales evita recalcular los otros 14 TB que no sufrieron ningún cambio lógico.',
        },
        {
          id: 'b',
          text: 'Clona físicamente los 15 TB completos de producción en tu esquema `dev_usuario` antes de dejarte ejecutar una sola consulta.',
          correct: false,
          feedback:
            'Clonar todas las tablas hijas sin distinguir cambios aditivos es el antipatrón costoso que los Entornos Virtuales de Datos eliminan.',
        },
        {
          id: 'c',
          text: 'Ignora el cambio y no crea la columna `discount_coupon_code` hasta que borres manualmente toda la base de datos de producción.',
          correct: false,
          feedback:
            'El motor sí materializa la nueva versión de `int_orders` con la nueva columna y la expone de inmediato en tu entorno virtual.',
        },
      ],
    },
  },

  // ==========================================================================
  // LECCIÓN 12: DATA CONTRACTS (ODCS V3) Y CAPA SEMÁNTICA UNIFICADA
  // ==========================================================================
  {
    id: 'l12-contracts-semantic-layer',
    stageId: 'stage-4',
    order: 12,
    title: 'Contratos de datos y capa semántica',
    subtitle: 'Validación de esquemas en el origen y definición centralizada de métricas en MetricFlow y Cube.',
    duration: '35 min',
    level: 'Avanzado',
    bloomLevel: 'create',
    coreFocus: ['BI', 'DE', 'DA'],
    goal: 'Crear Contratos de Datos ejecutables bajo el estándar abierto ODCS v3.0 y diseñar modelos en la Capa Semántica (MetricFlow / Cube) con entidades primarias/foráneas, medidas aditivas/no-aditivas y prevención automática de joins con fan-out.',
    visualType: 'dbt-sqlmesh-dag-explorer',
    storyContext:
      'En el comité directivo del tercer trimestre ocurrió el desastre clásico: el VP de Marketing presentó un Net Revenue Retention (NRR) del 118%, Finanzas reportó un 104% y el asistente de IA consultado en vivo respondió un 126%. Al auditar por qué, descubrimos dos fallas estructurales: primero, el equipo de backend del microservicio de facturación había cambiado el significado de `status = 2` (de "Pagado" a "En disputa") sin avisar a nadie; segundo, cada departamento tenía su propia fórmula SQL de NRR copiada dentro de archivos locales de Power BI, Tableau y scripts de Python, incluyendo un JOIN con fan-out en el reporte de Marketing. Implementar Data Contracts ODCS v3 en la frontera de entrada y centralizar las métricas en la Capa Semántica (MetricFlow) alineó a toda la compañía en un único número certificado.',
    sections: [
      {
        heading: 'Estructura de un contrato de datos bajo el estándar ODCS',
        body: 'Durante años, los equipos de Ingeniería de Datos funcionaron como "bomberos a las 3:00 AM": un desarrollador de backend renombraba un campo en PostgreSQL o en un evento de Kafka, se iba a dormir tranquilo porque sus tests de aplicación pasaban, y cuatro horas después explotaban 50 modelos de dbt y los tableros del CEO.\nLos **Data Contracts** aplican el principio **Shift-Left** (mover la calidad hacia el origen). Bajo el estándar abierto de la industria **ODCS v3.0 (Open Data Contract Standard)** de Bitol / Linux Foundation, un contrato es un archivo YAML versionado en Git que firma tres garantías entre el productor del microservicio y los consumidores de datos:\n1) **Esquema y Semántica**: Nombres de columnas, tipos lógicos/físicos, claves primarias, clasificación PII (datos personales) y descripción exacta de negocio.\n2) **Reglas de Calidad de Datos (Quality Checks)**: Invariantes ejecutables (ej. `mrr_cents >= 0`, `null_count(customer_id) = 0`, valores permitidos en enumeraciones).\n3) **Acuerdos de Nivel de Servicio (SLAs)**: Frescura máxima permitida (*latency: 15 minutes*), disponibilidad, ventana de retención y propietario responsable (`owner`) con canal de alerta.',
      },
      {
        heading: 'Validación del contrato en integración continua y corte de circuito en ingesta',
        body: 'Un Data Contract que vive en un PDF o en una wiki que nadie lee es inútil. En una arquitectura moderna 2026, el archivo ODCS v3 se ejecuta automáticamente en dos puntos de control:\n• **En el CI/CD del Productor (GitHub Actions / GitLab CI)**: Cuando un ingeniero de software abre un Pull Request que modifica el esquema de base de datos o el protobuf/JSON del evento emitido, el linter de contratos compara el cambio contra `contract_billing_v3.yaml`. Si elimina una columna requerida o viola la compatibilidad hacia atrás sin incrementar la versión mayor y notificar a los consumidores en el grafo OpenLineage, el chequeo de CI bloquea el merge antes de llegar a producción.\n• **En la Frontera de Ingesta (Circuit Breaker / Dead-Letter Queue)**: Durante la ingesta hacia el Lakehouse Iceberg, las filas o lotes que violen las aserciones críticas del contrato se desvían a una tabla de cuarentena (*quarantine / DLQ*) o detienen la publicación de la rama WAP, protegiendo al 100% las tablas Silver y Gold.',
      },
      {
        heading: 'Componentes de la capa semántica en MetricFlow y Cube: entidades, dimensiones y medidas',
        body: 'Si los Data Contracts protegen la entrada al Lakehouse, la **Capa Semántica Unificada** (implementada con **dbt Semantic Layer / MetricFlow** o **Cube**) protege la salida hacia las decisiones de negocio. En lugar de escribir SQL manual en cada herramienta de visualización, declaras un grafo semántico compuesto por cuatro bloques:\n• **Semantic Models**: Conectan un modelo Gold/Silver (`ref(\'fct_orders\')`) con su dimensión de tiempo predeterminada (`agg_time_dimension: order_date`).\n• **Entities (Claves del Grafo)**: Declaran cuál es la entidad `primary` de la tabla (ej. `order_id`), cuáles son `unique` y cuáles son `foreign` (ej. `customer_id`). Así el motor conoce la cardinalidad exacta (`1:1`, `1:N`) de toda tu empresa.\n• **Dimensions**: Atributos por los cuales se filtra o agrupa (`categorical` como `country_code`, `plan_tier`; o `time` con granularidades día/semana/mes/trimestre).\n• **Measures y Metrics**: Las *Measures* son agregaciones base sobre una tabla (`sum`, `count_distinct`), mientras que las *Metrics* son los KPIs de negocio expuestos al usuario final: métricas `simple`, `ratio` (`numerador / denominador` calculados por separado), `cumulative` (MTD, YTD, ventanas móviles) o `derived` (fórmulas compuestas como `NRR` o `LTV / CAC`).',
      },
      {
        heading: 'Prevención de fan-out en el motor semántico y consumo desde BI, código y agentes',
        body: '¿Qué ocurre cuando un usuario en BI o un Agente de IA pide cruzar una métrica de `fct_orders` (nivel pedido) con una dimensión de otra tabla o con una métrica de `fct_marketing_spend` (nivel campaña diaria)?\nSi un humano escribe ese SQL a prisa, suele hacer un `JOIN` directo que multiplica el presupuesto de marketing por el número de pedidos (**Fan-Out Trap**). En cambio, el compilador de **MetricFlow / Cube** inspecciona los tipos de entidad (`primary` vs `foreign`): agrega primero cada tabla a su granularidad segura en subconsultas/CTEs separadas y recién después une los resultados por las dimensiones solicitadas. Si el usuario pide un cruce matemáticamente inválido, la Capa Semántica lo rechaza con una explicación clara en lugar de inventar un número falso.\nAdemás, en 2026 la Capa Semántica expone interfaces nativas para todos los consumidores: **JDBC / Arrow Flight SQL** para Power BI, Tableau y Evidence.dev; **SDK de Python** para que los analistas (DA) partan de las métricas oficiales en Polars/Marimo; y **Servidor MCP (Model Context Protocol)** para que agentes como Google AI Ultra consulten métricas certificadas con precisión determinista.',
      },
    ],
    triadPerspectives: {
      DE: {
        title: 'Qué construye ingeniería de datos (DE)',
        points: [
          'Automatiza la validación de contratos ODCS v3 en los pipelines de CI/CD y configura pre-agregaciones declarativas (*Rollups / Caching* en Cube o tablas materializadas en Iceberg) para que la Capa Semántica responda en menos de 100 ms.',
          'Emite eventos **OpenLineage** que conectan cada contrato de entrada con los modelos SQLMesh/dbt y las métricas semánticas finales.',
        ],
      },
      DA: {
        title: 'Qué diseña análisis de datos (DA)',
        points: [
          'Define las métricas `ratio`, `cumulative` y `derived` en el repositorio de la Capa Semántica, asegurando que ratios como `ARPU` o `Tasa de Conversión` siempre sumen el numerador y dividan entre la suma del denominador.',
          'Importa las métricas gobernadas directamente en sus notebooks con el cliente Python de MetricFlow/Cube para evitar discrepancias entre estudios ad-hoc y reportes ejecutivos.',
        ],
      },
      BI: {
        title: 'Qué lidera business intelligence (BI)',
        points: [
          'Es el guardián funcional del catálogo de métricas certificadas: elimina medidas DAX/calculadas duplicadas en tableros aislados y las migra al código versionado de la Capa Semántica.',
          'Expone metadatos de confianza en cada dashboard (definición matemática, propietario del contrato ODCS y estado del SLA en tiempo real).',
        ],
      },
    },
    relatedLessons: [
      {
        id: 'l1-joins-fanout',
        reason: 'Comprende cómo las entidades primary y foreign de la Capa Semántica eliminan automáticamente el Fan-Out Trap visto en la Lección 1.',
      },
      {
        id: 'l6-metrics-simpson',
        reason: 'Conecta el diseño conceptual de árboles de KPIs y métricas no aditivas con su implementación en código YAML de MetricFlow.',
      },
      {
        id: 'l18-mcp-semantic-ai-rag',
        reason: 'Descubre cómo exponer esta misma Capa Semántica a agentes de IA mediante un Servidor MCP para lograr Text-to-Semantic-Layer sin alucinaciones.',
      },
    ],
    playground: {
      description:
        'Compara el caos de tener fórmulas SQL dispersas y sin contrato de entrada frente a un Contrato ODCS v3 acoplado a una Capa Semántica declarativa en MetricFlow:',
      badQueryLabel: 'Antipatrón: sin contrato y promedio de razones en BI',
      badQuery: `-- CAOS MÉTRICO:
-- 1) Nadie validó que 'mrr_cents' en origen ahora trae reembolsos negativos sin filtrar.
-- 2) Unir 'subscriptions' (1 fila por cliente) con 'support_tickets' (N filas por cliente)
--    provoca un Fan-Out que multiplica el MRR de los clientes que abrieron varios tickets.
-- 3) Promediar ratios con AVG() distorsiona el ARPU real.
SELECT
  s.plan_tier,
  SUM(s.mrr_cents) / 100.0 AS mrr_inflado_por_tickets_usd,
  AVG(s.mrr_cents / 100.0) AS arpu_distorsionado_usd
FROM gold.subscriptions s
LEFT JOIN gold.support_tickets t ON s.customer_id = t.customer_id
GROUP BY s.plan_tier;`,
      badResult: [
        {
          plan_tier: 'Enterprise',
          mrr_inflado_por_tickets_usd: '$1,890,000 (Inflado +210% por Fan-Out con tickets.)',
          arpu_distorsionado_usd: '$2,450 (Incorrecto: pondera por ticket, no por cliente)',
          confianza_comite: 'Baja (Finanzas y Producto muestran cifras distintas)',
        },
      ],
      goodQueryLabel: 'Solución óptima: contrato ODCS v3 y métrica en MetricFlow',
      goodQuery: `# 1. Contrato de Datos Ejecutable (ODCS v3.0) — billing_subscriptions_contract.yaml
apiVersion: v3.0.0
kind: DataContract
id: urn:datacontract:novapay:billing_subscriptions
info:
  title: Suscripciones activas e ingreso recurrente
  version: 3.1.0
  owner: finops-data@novapay.io
slaProperties:
  - property: latency
    value: 15
    unit: minutes
schema:
  - name: subscription_id
    logicalType: string
    primaryKey: true
    required: true
  - name: mrr_usd
    logicalType: number
    quality:
      - type: sql
        query: "SELECT COUNT(*) FROM {table} WHERE mrr_usd < 0"
        mustBe: 0

---
# 2. Capa Semántica Unificada (dbt Semantic Layer / MetricFlow) — semantic_mrr.yaml
semantic_models:
  - name: subscriptions_model
    model: ref('fct_subscriptions')
    defaults:
      agg_time_dimension: metric_date
    entities:
      - name: subscription
        type: primary
        expr: subscription_id
      - name: customer
        type: foreign
        expr: customer_id
    dimensions:
      - name: plan_tier
        type: categorical
    measures:
      - name: total_mrr_usd
        agg: sum
        expr: mrr_usd
      - name: active_paying_customers
        agg: count_distinct
        expr: customer_id

metrics:
  - name: net_arpu_usd
    label: "ARPU Neto Certificado (USD)"
    type: ratio
    type_params:
      numerator: total_mrr_usd
      denominator: active_paying_customers`,
      goodResult: [
        {
          plan_tier: 'Enterprise',
          total_mrr_usd: '$610,000.00 (Sin Fan-Out: agregado al grain primario)',
          net_arpu_usd: '$1,220.00 (SUM(mrr_usd) / COUNT(DISTINCT customer_id))',
          consumidores_sincronizados: 'Power BI + Polars DA + Agente MCP (100% Idéntico)',
        },
      ],
    },
    codeChallenge: {
      title: 'Contrato ODCS y métrica en MetricFlow',
      instruction:
        'Completa este archivo de gobernanza unificada para: 1) establecer en el Data Contract ODCS v3 que el conteo de valores negativos debe ser exactamente `0` (`mustBe: 0`), 2) declarar `order_id` como la entidad primaria (`primary`) del modelo semántico para impedir joins con fan-out, y 3) definir el ticket promedio (`aov_usd`) como una métrica de tipo `ratio` que divide `net_revenue_usd` entre `completed_orders`.',
      templateCode: `# Parte A: Regla de Calidad en Data Contract (ODCS v3.0)
schema:
  - name: order_net_usd
    logicalType: number
    quality:
      - type: sql
        query: "SELECT COUNT(*) FROM {table} WHERE order_net_usd < 0"
        {{blank_1}}: 0

---
# Parte B: Modelo y Métrica en Capa Semántica (MetricFlow)
semantic_models:
  - name: orders_semantic
    model: ref('fct_orders')
    defaults:
      agg_time_dimension: order_date
    entities:
      - name: order
        type: {{blank_2}}
        expr: order_id
      - name: customer
        type: foreign
        expr: customer_id
    measures:
      - name: net_revenue_usd
        agg: sum
        expr: order_net_usd
      - name: completed_orders
        agg: count_distinct
        expr: order_id

metrics:
  - name: average_order_value_usd
    label: "Ticket Promedio Neto (AOV)"
    type: {{blank_3}}
    type_params:
      numerator: net_revenue_usd
      denominator: completed_orders`,
      blanks: [
        {
          id: 'blank_1',
          placeholder: 'ASERCION_ODCS',
          acceptedAnswers: ['mustBe', 'must_be'],
          hint: 'En la especificación ODCS v3.0, ¿qué clave de la regla de calidad indica que el resultado de la consulta SQL debe ser igual a 0?',
          hints: [
            'Nivel 1 (Concepto): Expresa la condición "debe ser igual a" en camelCase dentro del bloque `quality` de ODCS.',
            'Nivel 2 (Sintaxis): Dos palabras en camelCase: must...',
            'Nivel 3 (Solución): Escribe mustBe',
          ],
        },
        {
          id: 'blank_2',
          placeholder: 'TIPO_ENTIDAD',
          acceptedAnswers: ['primary', 'PRIMARY'],
          hint: 'Si cada fila de `fct_orders` representa un pedido único (`order_id`), ¿qué tipo de entidad es `order` en MetricFlow?',
          hints: [
            'Nivel 1 (Concepto): Define la clave principal que identifica la granularidad (grain) de esta tabla.',
            'Nivel 2 (Sintaxis): En inglés, opuesto a `foreign`.',
            'Nivel 3 (Solución): Escribe primary',
          ],
        },
        {
          id: 'blank_3',
          placeholder: 'TIPO_METRICA',
          acceptedAnswers: ['ratio', 'RATIO'],
          hint: '¿Qué tipo de métrica en MetricFlow calcula de forma segura `SUM(numerador) / COUNT_DISTINCT(denominador)` en cualquier nivel de agrupación?',
          hints: [
            'Nivel 1 (Concepto): Es el tipo de métrica no aditiva compuesta por un numerador y un denominador.',
            'Nivel 2 (Sintaxis): Palabra de 5 letras en inglés para "proporción / razón".',
            'Nivel 3 (Solución): Escribe ratio',
          ],
        },
      ],
      expectedOutputTable: [
        {
          contract_id: 'urn:datacontract:novapay:orders',
          odcs_quality_gate: 'PASS (0 negative rows)',
          semantic_metric: 'average_order_value_usd (ratio)',
          fanout_protection: 'Active (Primary entity: order_id)',
        },
      ],
      rubricCriteria: [
        {
          criterion: 'Aserciones ejecutables en contrato ODCS',
          title: 'Aserciones ejecutables en contrato ODCS',
          description: 'Define reglas de calidad verificables automáticamente (mustBe: 0) en el contrato de datos antes de permitir el paso a las capas analíticas.',
          points: 30,
          role: 'DE',
        },
        {
          criterion: 'Declaración de entidades en grafo semántico',
          title: 'Declaración de entidades en grafo semántico',
          description: 'Distingue correctamente entre entidades primary y foreign para que el motor semántico prevenga joins con multiplicación de filas (Fan-Out).',
          points: 35,
          role: 'BI',
        },
        {
          criterion: 'Modelado de métricas de razón',
          title: 'Modelado de métricas de razón',
          description: 'Modela KPIs de razón (como AOV o ARPU) mediante numerator y denominator separados en lugar de promediar porcentajes o ratios precalculados.',
          points: 35,
          role: 'DA',
        },
      ],
    },
    pipelineChallenge: {
      title: 'Cadena gobernada del microservicio a BI',
      scenario:
        'Ordena en todas sus etapas los 5 eslabones de una arquitectura gobernada en 2026 cuando el equipo de producto lanza una nueva funcionalidad de suscripciones y quiere analizarla en BI y en el Agente IA:',
      steps: [
        {
          id: 'step-1-odcs-contract-ci',
          label: '1. Definición y validación del Data Contract (ODCS v3.0) en el CI/CD del microservicio productor antes de fusionar el código',
          role: 'DE',
          detail: 'Garantiza que el esquema, tipos, semántica y reglas de no-negatividad se cumplan desde el origen (Shift-Left).',
        },
        {
          id: 'step-2-iceberg-wap-ingest',
          label: '2. Ingesta hacia Apache Iceberg v3 y transformación incremental en SQLMesh/dbt validando los audits del contrato en una rama WAP',
          role: 'DE',
          detail: 'Construye las tablas limpias `dim_customer_scd2` y `fct_subscriptions` en Silver/Gold con trazabilidad OpenLineage.',
        },
        {
          id: 'step-3-semantic-model-entities',
          label: '3. Declaración del Semantic Model en MetricFlow / Cube especificando entidades primarias/foráneas y dimensión temporal',
          role: 'BI',
          detail: 'Registra la granularidad exacta de cada tabla para que el motor bloquee cualquier intento de join con fan-out.',
        },
        {
          id: 'step-4-governed-kpi-definitions',
          label: '4. Creación de las métricas certificadas (MRR, NRR, ARPU como ratio) en el repositorio Git de la Capa Semántica',
          role: 'DA',
          detail: 'Establece una única fórmula matemática auditada por Finanzas, Producto y Análisis.',
        },
        {
          id: 'step-5-universal-consumption',
          label: '5. Consumo unificado desde dashboards BI-as-Code, notebooks Polars y Agentes IA (vía Servidor MCP) contra la Capa Semántica',
          role: 'BI',
          detail: 'Todos los canales Ejecutivos, Analíticos y Conversacionales devuelven exactamente el mismo número en milisegundos.',
        },
      ],
      explanation:
        'La gobernanza moderna empieza en el borde izquierdo con el Data Contract ODCS en el CI/CD del microservicio (1), continúa con la materialización atómica en Iceberg v3 mediante SQLMesh/dbt (2), define las relaciones de entidad en el modelo semántico para impedir errores de fan-out (3), formaliza las métricas aditivas y de ratio en código (4) y finalmente sirve ese único cálculo a BI, Python y Agentes MCP (5).',
    },
    checkpoint: {
      question:
        'Un ejecutivo pide en un dashboard (o a un Agente IA) ver en una misma tabla el `Presupuesto Mensual de Campaña` (almacenado en `fct_campaigns`, 1 fila por campaña) junto con los `Ingresos por Pedidos` (almacenado en `fct_orders`, miles de pedidos por campaña) desglosados por canal. ¿Cómo resuelve la Capa Semántica (MetricFlow / Cube) esta consulta sin inflar el presupuesto?',
      options: [
        {
          id: 'a',
          text: 'Al conocer las entidades primarias y foráneas de ambos modelos semánticos, compila una consulta multi-hop (CTEs separadas) que agrega primero `fct_campaigns` por canal y agrega por separado `fct_orders` por canal al mismo nivel de granularidad antes de unir ambos resultados mediante un FULL/LEFT JOIN.',
          correct: true,
          feedback:
            'Exacto. Esta capacidad (conocida como Symmetric Aggregates / Multi-fact CTE Join planning) es la razón principal por la que la Capa Semántica impide los errores de Fan-Out al cruzar tablas de distinta granularidad.',
        },
        {
          id: 'b',
          text: 'Hace un INNER JOIN directo fila por fila entre `fct_campaigns` y `fct_orders` y luego divide el resultado entre un número aleatorio para compensar.',
          correct: false,
          feedback:
            'Unir tablas de distinta granularidad antes de agregar provoca el Fan-Out Trap; la Capa Semántica nunca hace eso.',
        },
        {
          id: 'c',
          text: 'Obliga al ingeniero de datos a copiar manualmente los datos en una hoja de cálculo de Excel cada mañana.',
          correct: false,
          feedback:
            'La Capa Semántica automatiza en tiempo real la generación del SQL seguro directamente sobre el Lakehouse.',
        },
      ],
    },
  },
];

export default STAGE_4_LESSONS;
