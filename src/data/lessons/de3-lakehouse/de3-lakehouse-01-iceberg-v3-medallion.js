// Lección migrada al esquema v2 mediante scripts/migrate-legacy.mjs
const lesson = {
  "id": "de3-lakehouse-01-iceberg-v3-medallion",
  "moduleId": "de3-lakehouse",
  "tracks": [
    "de"
  ],
  "level": 3,
  "order": 1,
  "title": "Tablas abiertas con Apache Iceberg v3",
  "minutes": 30,
  "prerequisites": [
    "de2-formatos-01-columnar-parquet"
  ],
  "contentVersion": 1,
  "hook": "En Mercado Brisa (empresa ficticia), el lago de datos guardaba carpetas sueltas de archivos Parquet en almacenamiento de objetos. Cuando un proceso falló a mitad de escritura y otro trabajo intentó borrar los datos de 400 clientes por solicitud legal, los reportes leyeron archivos incompletos y reescribir 18 TB de Parquet costó horas de cómputo. Al migrar a Apache Iceberg con catálogo transaccional, vectores de borrado y patrón Write-Audit-Publish, las actualizaciones quedaron aisladas y atómicas. ¿Cómo convierte Iceberg archivos inmutables en tablas ACID?",
  "objectives": [
    "Trazar la jerarquía de metadatos de Apache Iceberg: catálogo, metadata.json, manifest list, manifest files y archivos Parquet.",
    "Diferenciar borrados Copy-on-Write frente a Merge-on-Read con vectores de borrado (deletion vectors) en Iceberg v3.",
    "Aplicar la arquitectura Medallion (Bronze, Silver, Gold) junto al patrón Write-Audit-Publish (WAP) antes de exponer datos."
  ],
  "sections": [
    {
      "id": "capas-bronze-silver-y-gold-responsabilidades-tec",
      "heading": "Capas bronze, silver y gold: responsabilidades técnicas y semánticas",
      "body": "Organizar un Open Lakehouse no consiste en copiar tablas sin criterio, sino en establecer contratos de confianza progresivos a través de tres capas:\n• Capa Bronze (Cruda e Inmutable): Aterriza los eventos exactamente como llegaron desde CDC (Debezium), Kafka o APIs externas, añadiendo metadatos técnicos (`_ingested_at`, `_source_file`, `_cdc_op`). Nunca se borra ni se sobrescribe la historia cruda; si descubrimos un error de lógica seis meses después, podemos reprocesar Silver desde Bronze sin pedir datos de nuevo al equipo de backend.\n• Capa Silver (Limpia, Tipada, Deduplicada y Conformada): Aquí Ingeniería de Datos (DE) aplica deduplicación determinista (`QUALIFY ROW_NUMBER()`), estandariza zonas horarias a UTC, valida tipos y modela entidades de negocio claras (Tablas de Hechos y Dimensiones SCD Tipo 2). Es el entorno de trabajo principal de Análisis de Datos (DA) y Ciencia de Datos.\n• Capa Gold (Gobernada y Optimizada para Decisión): Contiene modelos dimensionales listos para consumo, tablas pre-agregadas y métricas certificadas con reglas de negocio aplicadas. Es la capa que alimenta la Capa Semántica y los tableros de Business Intelligence (BI) en modo Direct Lake / Zero-Copy.",
      "interactive": {
        "component": "iceberg-v3-snapshot-explorer",
        "caption": "Simulador interactivo: Tablas abiertas con Apache Iceberg v3"
      }
    },
    {
      "id": "metadatos-en-apache-iceberg-del-catalogo-al-arch",
      "heading": "Metadatos en Apache Iceberg: del catálogo al archivo de datos",
      "body": "Un conjunto de archivos Parquet por sí solo no sabe qué archivos pertenecen a una transacción válida ni cuáles están siendo escritos en este instante. Apache Iceberg resuelve esto introduciendo una jerarquía de metadatos inmutable en tres niveles:\n1) Catálogo REST (Apache Polaris, Unity Catalog, Nessie o Gravitino): Mantiene la referencia atómica (puntero CAS — Compare-And-Swap) hacia el archivo `metadata.json` vigente de cada tabla.\n2) Metadata File (`v42.metadata.json`) y Manifest List (`snap-8912.avro`): El archivo de metadatos registra el esquema de la tabla, la especificación de particionado y el historial de Snapshots. Cada Snapshot apunta a una *Manifest List*, la cual contiene estadísticas de rango por partición que permiten descartar directorios enteros en milisegundos.\n3) Manifest Files y Data Files: Cada *Manifest File* lista los archivos físicos de datos (`.parquet`, `.vortex` o `.lance`) junto con los límites mínimos y máximos (`lower_bounds` / `upper_bounds`) y conteos de nulos de cada columna. Así, el motor analítico (DuckDB, Spark, Trino) poda el 95%+ de los archivos leyendo solo metadatos antes de abrir un solo archivo Parquet.",
      "example": {
        "language": "sql",
        "code": "-- 1. Creación de tabla Apache Iceberg v3 con Hidden Partitioning y tipo VARIANT\nCREATE TABLE polaris_cat.silver.orders_v3 (\n  order_id STRING NOT NULL,\n  customer_id BIGINT NOT NULL,\n  event_ts TIMESTAMPTZ NOT NULL,\n  order_status STRING,\n  net_amount_usd DECIMAL(12, 2),\n  telemetry_payload VARIANT\n)\nUSING iceberg\nPARTITIONED BY (days(event_ts), bucket(16, customer_id))\nTBLPROPERTIES (\n  'format-version' = '3',\n  'write.delete.mode' = 'merge-on-read',\n  'write.update.mode' = 'merge-on-read'\n);\n\n-- 2. Actualización atómica instantánea (escribe un Deletion Vector en archivo .puffin)\nUPDATE polaris_cat.silver.orders_v3\nSET order_status = 'REFUNDED', net_amount_usd = 0.00\nWHERE order_id = 'ORD-88410';\n\n-- 3. Consulta analítica combinando extracción VARIANT y Time Travel reproducible\nSELECT\n  telemetry_payload:device.os::STRING AS device_os,\n  SUM(net_amount_usd) AS revenue_actual_usd,\n  (SELECT SUM(net_amount_usd)\n   FROM polaris_cat.silver.orders_v3\n   FOR SYSTEM_TIME AS OF CURRENT_TIMESTAMP - INTERVAL '24' HOUR) AS revenue_hace_24h_usd\nFROM polaris_cat.silver.orders_v3\nWHERE event_ts >= TIMESTAMP '2026-10-01 00:00:00Z'\nGROUP BY 1;",
        "expectedOutput": [
          {
            "device_os": "iOS 19.1",
            "revenue_actual_usd": "$842,190.00 (Snapshot #104 atómico)",
            "revenue_hace_24h_usd": "$842,540.00 (Snapshot #98 vía Time Travel)"
          }
        ]
      }
    },
    {
      "id": "vectores-de-borrado-linaje-de-filas-y-tipo-varia",
      "heading": "Vectores de borrado, linaje de filas y tipo VARIANT en Iceberg",
      "body": "La especificación v3 de Apache Iceberg (`format-version = 3`) consolida tres avances fundamentales para cargas modernas de baja latencia:\n• Deletion Vectors (DVs) en Archivos Puffin: En versiones antiguas, borrar o actualizar filas en modo *Merge-on-Read* generaba múltiples archivos pequeños de borrado posicional que degradaban las lecturas. En Iceberg v3 se emplean **Deletion Vectors**: mapas de bits comprimidos (*Roaring Bitmaps*) almacenados dentro de archivos laterales `.puffin`. Iceberg v3 garantiza que exista como máximo un Deletion Vector activo por cada archivo de datos Parquet, reduciendo drásticamente el costo de unir borrados en tiempo de lectura.\n• Tipo de Dato Nativo `VARIANT`: Permite almacenar payloads semi-estructurados (JSON de eventos móviles, telemetría IoT o respuestas de LLMs) descomponiendo automáticamente (*shredding*) las sub-columnas frecuentes en formato columnar tipado. Obtienes la flexibilidad de un documento sin esquema con la velocidad de escaneo y compresión de Parquet.\n• Row-Level Lineage Nativo (`_row_id` y `_last_updated_sequence_number`): Cada fila recibe un identificador estable y número de secuencia que permite a motores como SQLMesh, Spark o Flink calcular exactamente qué filas cambiaron entre dos snapshots sin hacer costosos `FULL OUTER JOIN`."
    },
    {
      "id": "particionado-oculto-evolucion-de-esquema-y-patro",
      "heading": "Particionado oculto, evolución de esquema y patrón WAP",
      "body": "En los antiguos Data Lakes estilo Hive, si particionabas por día tenías que crear una columna física `event_day_str = \"2026-10-28\"` y rezar para que ningún analista olvidara incluirla en su `WHERE` (si filtraban solo por `event_ts`, el motor escaneaba toda la tabla). Con **Hidden Partitioning** en Iceberg, declaras `PARTITIONED BY (days(event_ts), bucket(16, customer_id))`: el usuario filtra naturalmente por `WHERE event_ts >= TIMESTAMP '2026-10-01'` e Iceberg calcula y poda las particiones automáticamente.\nAdemás, con **Partition Evolution**, puedes cambiar la estrategia de particionado de mensual (`months(event_ts)`) a diaria (`days(event_ts)`) con una operación de metadatos instantánea: los terabytes antiguos permanecen intactos con el layout mensual y los nuevos se escriben por día.\nFinalmente, el soporte de ramas a nivel de catálogo permite el patrón **Write-Audit-Publish (WAP)**: el pipeline escribe el nuevo lote en una rama aislada (`audit_branch`), ejecuta validaciones estadísticas y de contratos, y solo ejecuta un `fast-forward merge` hacia la rama `main` cuando el 100% de las pruebas pasan."
    }
  ],
  "workedExample": {
    "title": "Ejemplo guiado: Tablas abiertas con Apache Iceberg v3",
    "description": "Compara el antipatrón de sobrescribir archivos Parquet sueltos en S3 frente a operar una tabla transaccional Apache Iceberg v3 con Deletion Vectors, VARIANT y Time Travel:",
    "audit": "",
    "steps": [
      {
        "label": "Antipatrón: sobrescritura de Parquet sueltos sin catálogo",
        "explanation": "Compara el antipatrón de sobrescribir archivos Parquet sueltos en S3 frente a operar una tabla transaccional Apache Iceberg v3 con Deletion Vectors, VARIANT y Time Travel:",
        "code": "-- PELIGRO: Sobrescribir archivos en S3 sin capa transaccional ACID.\n-- 1) Los dashboards de BI que consulten durante la escritura fallan o ven datos duplicados/incompletos.\n-- 2) Borrar 1 pedido obliga a reescribir todo el archivo Parquet completo.\n-- 3) El campo JSON 'raw_payload' guardado como VARCHAR obliga a parsear texto fila por fila.\nCOPY (\n  SELECT * FROM raw_orders WHERE order_id <> 'ORD-88410'\n) TO 's3://novapay-lake/silver/orders/*.parquet' (FORMAT PARQUET, OVERWRITE true);",
        "expectedOutput": [
          {
            "lecturas_concurrentes_bi": "ERROR FileNotFound / Datos a mitad de carga",
            "costo_borrar_1_fila": "Reescritura de 512 MB en S3 (6.8 seg)",
            "time_travel_auditoria": "Imposible (archivos anteriores destruidos)"
          }
        ]
      },
      {
        "label": "Solución óptima: tabla Apache Iceberg v3 con vectores de borrado",
        "explanation": "Compara ahora la consulta corregida y verifica cómo las filas y totales coinciden con la auditoría.",
        "code": "-- 1. Creación de tabla Apache Iceberg v3 con Hidden Partitioning y tipo VARIANT\nCREATE TABLE polaris_cat.silver.orders_v3 (\n  order_id STRING NOT NULL,\n  customer_id BIGINT NOT NULL,\n  event_ts TIMESTAMPTZ NOT NULL,\n  order_status STRING,\n  net_amount_usd DECIMAL(12, 2),\n  telemetry_payload VARIANT\n)\nUSING iceberg\nPARTITIONED BY (days(event_ts), bucket(16, customer_id))\nTBLPROPERTIES (\n  'format-version' = '3',\n  'write.delete.mode' = 'merge-on-read',\n  'write.update.mode' = 'merge-on-read'\n);\n\n-- 2. Actualización atómica instantánea (escribe un Deletion Vector en archivo .puffin)\nUPDATE polaris_cat.silver.orders_v3\nSET order_status = 'REFUNDED', net_amount_usd = 0.00\nWHERE order_id = 'ORD-88410';\n\n-- 3. Consulta analítica combinando extracción VARIANT y Time Travel reproducible\nSELECT\n  telemetry_payload:device.os::STRING AS device_os,\n  SUM(net_amount_usd) AS revenue_actual_usd,\n  (SELECT SUM(net_amount_usd)\n   FROM polaris_cat.silver.orders_v3\n   FOR SYSTEM_TIME AS OF CURRENT_TIMESTAMP - INTERVAL '24' HOUR) AS revenue_hace_24h_usd\nFROM polaris_cat.silver.orders_v3\nWHERE event_ts >= TIMESTAMP '2026-10-01 00:00:00Z'\nGROUP BY 1;",
        "expectedOutput": [
          {
            "device_os": "iOS 19.1",
            "revenue_actual_usd": "$842,190.00 (Snapshot #104 atómico)",
            "revenue_hace_24h_usd": "$842,540.00 (Snapshot #98 vía Time Travel)"
          }
        ]
      }
    ]
  },
  "checks": [
    {
      "id": "c1",
      "type": "mcq",
      "prompt": "En una tabla Apache Iceberg v3 de 50 TB con modo Merge-on-Read activado, llega una solicitud para actualizar el estado de 2,500 pedidos repartidos en 80 archivos Parquet. ¿Qué hace exactamente Iceberg v3 en el momento del UPDATE?",
      "options": [
        {
          "id": "a",
          "text": "Escribe los 2,500 registros actualizados en un nuevo archivo Parquet pequeño y genera/actualiza un Deletion Vector (bitmap Roaring en un archivo Puffin) por cada archivo afectado para marcar las posiciones antiguas como borradas, publicando un nuevo Snapshot sin reescribir los 80 archivos Parquet.",
          "correct": true,
          "feedback": "Exacto. Los Deletion Vectors en archivos Puffin de Iceberg v3 marcan mediante un bitmap las posiciones de fila invalidadas en milisegundos, delegando la reescritura física a un trabajo de compactación en segundo plano."
        },
        {
          "id": "b",
          "text": "Bloquea todas las consultas de BI durante 45 minutos mientras descarga, descomprime, modifica y vuelve a subir los 80 archivos Parquet completos a S3.",
          "correct": false,
          "feedback": "Eso describiría una estrategia Copy-on-Write mal optimizada y sin aislamiento de snapshots. Con Merge-on-Read y Deletion Vectors v3 la operación es casi instantánea y no bloquea a los lectores."
        },
        {
          "id": "c",
          "text": "Modifica directamente los bytes internos en mitad de los archivos Parquet existentes en S3 usando edición in-place.",
          "correct": false,
          "feedback": "El almacenamiento de objetos (S3/GCS/ADLS) y los archivos Parquet son estrictamente inmutables: nunca se editan bytes in-place."
        }
      ],
      "explanation": "Exacto. Los Deletion Vectors en archivos Puffin de Iceberg v3 marcan mediante un bitmap las posiciones de fila invalidadas en milisegundos, delegando la reescritura física a un trabajo de compactación en segundo plano."
    },
    {
      "id": "c2",
      "type": "mcq",
      "prompt": "Necesitas eliminar 150 filas por derecho al olvido (GDPR) repartidas en 80 archivos Parquet de 512 MB cada uno en una tabla Apache Iceberg con baja latencia de escritura. ¿Qué estrategia minimiza los bytes escritos en el momento del DELETE?",
      "options": [
        {
          "id": "a",
          "text": "Merge-on-Read con vectores de borrado (deletion vectors) y compactación asíncrona posterior.",
          "correct": true,
          "feedback": "Correcto: escribe únicamente mapas de bits indicando las posiciones borradas y programa la reescritura física fuera de la ruta crítica."
        },
        {
          "id": "b",
          "text": "Copy-on-Write reescribiendo los 80 archivos Parquet de 512 MB en el acto.",
          "correct": false,
          "feedback": "Incorrecto: Copy-on-Write obligaría a leer y reescribir ~40 GB de datos solo para quitar 150 filas."
        },
        {
          "id": "c",
          "text": "Renombrar manualmente los archivos Parquet en el bucket S3.",
          "correct": false,
          "feedback": "Incorrecto: modificar archivos fuera del catálogo de Iceberg corrompe las referencias de los manifest files."
        }
      ],
      "explanation": "Merge-on-Read desacopla el costo de escritura inmediata del costo de mantenimiento físico, que luego se resuelve mediante trabajos periódicos de compactación."
    },
    {
      "id": "c3",
      "type": "mcq",
      "prompt": "¿Qué protege el patrón Write-Audit-Publish (WAP) al actualizar la tabla `gold.daily_revenue` en Iceberg?",
      "options": [
        {
          "id": "a",
          "text": "Escribe los datos nuevos en una rama o snapshot no publicado, valida reconciliación y nulos, y solo entonces hace fast-forward de main.",
          "correct": true,
          "feedback": "Correcto: si alguna prueba de calidad falla, los lectores de main jamás llegan a ver los datos defectuosos."
        },
        {
          "id": "b",
          "text": "Publica los datos primero en producción y envía un correo si un test falla una hora después.",
          "correct": false,
          "feedback": "Incorrecto: auditar después de publicar expone métricas erróneas en los tableros durante el intervalo de fallo."
        },
        {
          "id": "c",
          "text": "Bloquea todas las lecturas de BI mientras dura la carga.",
          "correct": false,
          "feedback": "Incorrecto: gracias al aislamiento por instantáneas, los lectores siguen consultando la versión previa sin bloqueos."
        }
      ],
      "explanation": "Al separar la escritura física del cambio atómico de referencia en el catálogo, WAP impide que datos sin auditar lleguen a los consumidores."
    }
  ],
  "practice": {
    "type": "fill-blanks",
    "title": "Esquema Iceberg v3 y viaje temporal",
    "language": "sql",
    "prompt": "Completa las 3 piezas clave de esta sentencia SQL sobre el catálogo Apache Iceberg v3 para: 1) declarar la columna semi-estructurada con el tipo nativo de Iceberg v3, 2) activar la versión 3 de la especificación en `TBLPROPERTIES`, y 3) consultar el estado histórico exacto de la tabla con la cláusula estándar de Time Travel.",
    "starterCode": "CREATE TABLE polaris.silver.checkout_events (\n  event_id UUID NOT NULL,\n  customer_id BIGINT NOT NULL,\n  event_ts TIMESTAMPTZ NOT NULL,\n  gateway_metadata {{blank_1}},\n  amount_usd DECIMAL(10,2)\n)\nUSING iceberg\nPARTITIONED BY (days(event_ts))\nTBLPROPERTIES (\n  'format-version' = '{{blank_2}}',\n  'write.update.mode' = 'merge-on-read'\n);\n\n-- Auditar los ingresos exactos registrados al cierre del 20 de producción:\nSELECT SUM(amount_usd) AS audited_revenue_usd\nFROM polaris.silver.checkout_events\n{{blank_3}} TIMESTAMP '2026-10-20 23:59:59Z';",
    "expected": "CREATE TABLE polaris.silver.checkout_events (\n  event_id UUID NOT NULL,\n  customer_id BIGINT NOT NULL,\n  event_ts TIMESTAMPTZ NOT NULL,\n  gateway_metadata {{blank_1}},\n  amount_usd DECIMAL(10,2)\n)\nUSING iceberg\nPARTITIONED BY (days(event_ts))\nTBLPROPERTIES (\n  'format-version' = '{{blank_2}}',\n  'write.update.mode' = 'merge-on-read'\n);\n\n-- Auditar los ingresos exactos registrados al cierre del 20 de producción:\nSELECT SUM(amount_usd) AS audited_revenue_usd\nFROM polaris.silver.checkout_events\n{{blank_3}} TIMESTAMP '2026-10-20 23:59:59Z';",
    "orderMatters": true,
    "hints": [
      "TIPO_SEMI_ESTRUCTURADO: En Iceberg v3 (2026), ¿qué tipo de dato nativo reemplaza a los strings JSON planos permitiendo sub-columnarización automática?",
      "VERSION: ¿Qué número de versión de formato de tabla habilita los Deletion Vectors en archivos Puffin, Row-Level Lineage y el tipo VARIANT?",
      "CLAUSULA_TIME_TRAVEL: Escribe la cláusula SQL estándar de 4 palabras para viajar en el tiempo a una marca temporal pasada."
    ],
    "solution": "CREATE TABLE polaris.silver.checkout_events (\n  event_id UUID NOT NULL,\n  customer_id BIGINT NOT NULL,\n  event_ts TIMESTAMPTZ NOT NULL,\n  gateway_metadata {{blank_1}},\n  amount_usd DECIMAL(10,2)\n)\nUSING iceberg\nPARTITIONED BY (days(event_ts))\nTBLPROPERTIES (\n  'format-version' = '{{blank_2}}',\n  'write.update.mode' = 'merge-on-read'\n);\n\n-- Auditar los ingresos exactos registrados al cierre del 20 de producción:\nSELECT SUM(amount_usd) AS audited_revenue_usd\nFROM polaris.silver.checkout_events\n{{blank_3}} TIMESTAMP '2026-10-20 23:59:59Z';",
    "solutionExplanation": "Uso del tipo VARIANT en Iceberg Configuración de versión 3 en tabla Reproducibilidad analítica mediante viaje temporal",
    "blanks": [
      {
        "id": "blank_1",
        "placeholder": "TIPO_SEMI_ESTRUCTURADO",
        "acceptedAnswers": [
          "VARIANT",
          "variant"
        ],
        "hint": "En Iceberg v3 (2026), ¿qué tipo de dato nativo reemplaza a los strings JSON planos permitiendo sub-columnarización automática?",
        "hints": [
          "Nivel 1 (Concepto): Es el nuevo tipo de dato de la especificación Apache Iceberg v3 diseñado para almacenar JSON semi-estructurado con shredding columnar.",
          "Nivel 2 (Sintaxis): Empieza con V y tiene 7 letras.",
          "Nivel 3 (Solución): Escribe VARIANT"
        ]
      },
      {
        "id": "blank_2",
        "placeholder": "VERSION",
        "acceptedAnswers": [
          "3",
          "v3"
        ],
        "hint": "¿Qué número de versión de formato de tabla habilita los Deletion Vectors en archivos Puffin, Row-Level Lineage y el tipo VARIANT?",
        "hints": [
          "Nivel 1 (Concepto): Corresponde a la tercera generación de la especificación de tablas Apache Iceberg.",
          "Nivel 2 (Sintaxis): Es un único dígito numérico entero.",
          "Nivel 3 (Solución): Escribe 3"
        ]
      },
      {
        "id": "blank_3",
        "placeholder": "CLAUSULA_TIME_TRAVEL",
        "acceptedAnswers": [
          "FOR SYSTEM_TIME AS OF",
          "for system_time as of",
          "TIMESTAMP AS OF"
        ],
        "hint": "Escribe la cláusula SQL estándar de 4 palabras para viajar en el tiempo a una marca temporal pasada.",
        "hints": [
          "Nivel 1 (Concepto): Es la cláusula SQL:2011 / Iceberg que indica al motor que resuelva el Snapshot vigente en ese instante del tiempo del sistema.",
          "Nivel 2 (Sintaxis): Estructura: FOR SYSTEM_TIME ... ...",
          "Nivel 3 (Solución): Escribe FOR SYSTEM_TIME AS OF"
        ]
      }
    ],
    "expectedOutputTable": [
      {
        "snapshot_id": "88492019482",
        "format_version": "v3 (Deletion Vectors + VARIANT)",
        "audited_revenue_usd": "$1,294,810.50",
        "isolation_status": "100% Reproducible"
      }
    ],
    "rubricCriteria": [
      {
        "criterion": "Uso del tipo VARIANT en Iceberg",
        "title": "Uso del tipo VARIANT en Iceberg",
        "description": "Declara correctamente columnas semi-estructuradas con VARIANT para habilitar sub-columnarización y evitar el parseo lento de strings JSON.",
        "points": 35,
        "role": "DE"
      },
      {
        "criterion": "Configuración de versión 3 en tabla",
        "title": "Configuración de versión 3 en tabla",
        "description": "Configura format-version = 3 con merge-on-read para que las actualizaciones generen Deletion Vectors binarios en archivos Puffin.",
        "points": 35,
        "role": "DE"
      },
      {
        "criterion": "Reproducibilidad analítica mediante viaje temporal",
        "title": "Reproducibilidad analítica mediante viaje temporal",
        "description": "Emplea FOR SYSTEM_TIME AS OF para auditar estados pasados de la tabla sin alterar las vistas de BI en producción.",
        "points": 30,
        "role": "DA"
      }
    ]
  },
  "roleNotes": {
    "de": "Define tablas con `format-version = 3`, configura `write.delete.mode = merge-on-read` con Deletion Vectors para upserts rápidos desde CDC/Flink y programa trabajos asíncronos de compactación (`rewrite_data_files`) y expiración de snapshots. Implementa el flujo Write-Audit-Publish (WAP) sobre ramas del Catálogo REST (Polaris / Unity) y utiliza credenciales efímeras (*Vended Credentials*) para controlar el acceso al almacenamiento de objetos.",
    "da": "Utiliza `FOR SYSTEM_TIME AS OF` y `FOR SYSTEM_VERSION AS OF` (Time Travel) para reproducir al 100% los datos exactos con los que se presentó un informe ejecutivo o se entrenó un modelo predictivo. Extrae atributos anidados desde columnas `VARIANT` (`payload:checkout.payment_method::STRING`) con velocidad columnar y crea ramas ligeras (*Zero-Copy branches*) para experimentar limpiezas sin duplicar almacenamiento.",
    "bi": "Conecta los tableros ejecutivos directamente a las tablas Gold de Apache Iceberg mediante arquitecturas **Direct Lake / Zero-Copy**, eliminando los extractos propietarios desactualizados. Confía en que ningún comité ejecutivo verá tablas a medio cargar gracias al aislamiento transaccional de los Snapshots y la publicación atómica WAP."
  },
  "summary": [
    "Apache Iceberg aporta transacciones ACID y aislamiento de instantáneas sobre archivos Parquet inmutables.",
    "El catálogo mantiene el puntero atómico al archivo metadata.json vigente de cada tabla.",
    "Los vectores de borrado marcan filas eliminadas en mapas de bits sin reescribir archivos de datos.",
    "El patrón Write-Audit-Publish escribe en una rama aislada, ejecuta pruebas y avanza el puntero principal."
  ],
  "flashcards": [
    {
      "id": "fc-de3-ice-01",
      "front": "¿Por qué nunca debes listar directorios en S3 (`ls s3://...`) para descubrir qué archivos pertenecen a una tabla Iceberg?",
      "back": "Porque en S3 pueden coexistir archivos de instantáneas pasadas o escrituras en curso; solo el árbol que cuelga del metadata.json actual define la tabla."
    },
    {
      "id": "fc-de3-ice-02",
      "front": "¿Qué ventaja aportan los vectores de borrado (Merge-on-Read) frente a Copy-on-Write ante borrados frecuentes?",
      "back": "Evitan reescribir archivos Parquet de cientos de megabytes por borrar unas pocas filas; escriben un bitmap ligero y difieren la reescritura a la compactación."
    },
    {
      "id": "fc-de3-ice-03",
      "front": "¿Qué es el particionado oculto (hidden partitioning) en Apache Iceberg?",
      "back": "Iceberg calcula internamente la partición (mes, día, bucket) a partir de la columna timestamp sin exigir que el usuario añada columnas artificiales en el WHERE."
    }
  ],
  "glossaryTerms": [
    "c17-medallion-architecture",
    "c18-iceberg-v3"
  ],
  "sources": [
    {
      "title": "Apache Iceberg Official Specification — Table Format v2 and v3",
      "url": "https://iceberg.apache.org/spec/",
      "publisher": "Apache Software Foundation",
      "accessed": "2026-10-29",
      "supports": "Jerarquía de metadatos, aislamiento de instantáneas, vectores de borrado y evolución de esquema."
    },
    {
      "title": "Apache Iceberg Documentation — Partitioning and Hidden Partitioning",
      "url": "https://iceberg.apache.org/docs/latest/partitioning/",
      "publisher": "Apache Software Foundation",
      "accessed": "2026-10-29",
      "supports": "Transformaciones de partición declarativas y evolución de diseño de partición sin reescribir historia."
    },
    {
      "title": "Apache Iceberg Documentation — Branching and Tagging (Write-Audit-Publish)",
      "url": "https://iceberg.apache.org/docs/latest/branching/",
      "publisher": "Apache Software Foundation",
      "accessed": "2026-10-29",
      "supports": "Uso de ramas a nivel de metadatos para validar calidad antes de publicar cambios."
    }
  ],
  "aiNotes": "Las confusiones frecuentes son pensar que Iceberg es un motor de consultas (es un formato de tabla abierto leído por DuckDB, Spark, Trino o Snowflake) o creer que Bronze debe transformar y borrar campos crudos.",
  "needsReview": true,
  "legacyId": "l10-iceberg-v3-medallion",
  "legacyOrder": 10,
  "stageId": "stage-4",
  "subtitle": "Metadatos transaccionales sobre almacenamiento de objetos, vectores de borrado y particionamiento oculto.",
  "goal": "Aplicar una arquitectura Medallion (Bronze, Silver, Gold) sobre Apache Iceberg v3 utilizando Deletion Vectors en archivos Puffin, el tipo nativo VARIANT para datos semi-estructurados, Hidden Partitioning y el patrón Write-Audit-Publish (WAP).",
  "pipelineChallenge": {
    "title": "Ciclo de escritura, auditoría y publicación",
    "scenario": "Ordena los 5 pasos arquitectónicos para ingerir, transformar, auditar y publicar un nuevo lote de pedidos en el Lakehouse garantizando que ningún dashboard de BI lea datos corruptos o incompletos:",
    "steps": [
      {
        "id": "step-1-bronze-append",
        "label": "1. Ingesta inmutable de eventos crudos CDC en la tabla Bronze de Iceberg con metadatos _ingested_at",
        "role": "DE",
        "detail": "Preserva la evidencia original exacta recibida desde Kafka/Debezium para permitir reprocesamiento histórico."
      },
      {
        "id": "step-2-wap-branch",
        "label": "2. Creación de rama aislada Zero-Copy (audit_branch) en el Catálogo REST y escritura del cambio Silver con Deletion Vectors",
        "role": "DE",
        "detail": "Escribe los nuevos archivos Parquet y bitmaps Puffin en una rama separada sin tocar el puntero main que lee BI."
      },
      {
        "id": "step-3-quality-audit",
        "label": "3. Ejecución de auditorías automáticas de calidad (0% nulos en claves, reconciliación de sumas y Z-score de volumen) sobre audit_branch",
        "role": "DA",
        "detail": "Verifica tanto reglas deterministas de esquema como ausencia de anomalías estadísticas antes de exponer los datos."
      },
      {
        "id": "step-4-atomic-publish",
        "label": "4. Fast-Forward Merge atómico de audit_branch hacia la rama main en el Catálogo REST Apache Polaris",
        "role": "DE",
        "detail": "Intercambia el puntero del Snapshot actual en milisegundos mediante una operación Compare-And-Swap (CAS)."
      },
      {
        "id": "step-5-direct-lake-bi",
        "label": "5. Lectura Zero-Copy desde los dashboards de BI y notebooks de DA apuntando al nuevo Snapshot certificado en main",
        "role": "BI",
        "detail": "Los consumidores ven la actualización completa de forma instantánea sin caídas ni estados intermedios."
      }
    ],
    "explanation": "En el patrón Write-Audit-Publish (WAP), la clave es que los datos crudos primero se aseguran en Bronze (1), luego las transformaciones hacia Silver/Gold se escriben en una rama aislada (2), se validan rigurosamente con pruebas deterministas y estadísticas (3), se promueven atómicamente cambiando el puntero en el catálogo REST (4) y finalmente son consumidas por BI y DA sin riesgo de lecturas sucias (5)."
  },
  "relatedLessons": [
    {
      "id": "l7-columnar-parquet",
      "reason": "Comprende cómo los archivos Parquet físicos y sus Zone Maps operan debajo del árbol de metadatos de Apache Iceberg v3."
    },
    {
      "id": "l11-dbt-sqlmesh-dag",
      "reason": "Descubre cómo orquestar las transformaciones de Bronze a Silver y Gold sobre tablas Iceberg usando dbt y SQLMesh."
    },
    {
      "id": "l16-cdc-kafka-streaming",
      "reason": "Aprende cómo los flujos CDC en tiempo real aterrizan continuamente en tablas Iceberg v3 usando Deletion Vectors."
    }
  ]
};

export default lesson;
