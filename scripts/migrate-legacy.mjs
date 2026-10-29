import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LESSONS as LEGACY_LESSONS } from '../src/data/learningPath2026.js';
import { validateLesson, countWords } from '../src/data/schema/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const LESSONS_OUT_DIR = path.join(ROOT_DIR, 'src', 'data', 'lessons');

const HEADING_OVERRIDES = {
  'l1-joins-fanout:0': 'Qué es el grano de una tabla y por qué define su contrato',
  'l3-asof-lateral-ctes:3': 'CTEs modulares: importación, limpieza, preparación y salida',
  'l6-metrics-simpson:1': 'Árboles de indicadores: métrica guía, palancas y guardias',
  'l6-metrics-simpson:3': 'Descomposición Kitagawa-Oaxaca: efecto tasa vs composición',
  'l8-arrow-lance-vortex:2': 'Límites de Parquet en cargas multimodales: Lance y Vortex',
  'l9-duckdb-polars-marimo:0': 'Escalamiento vertical local: cuándo basta un solo nodo',
  'l9-duckdb-polars-marimo:1': 'Paralelismo por fragmentos (morsel-driven) en DuckDB',
  'l10-iceberg-v3-medallion:1': 'Metadatos en Apache Iceberg: del catálogo al archivo de datos',
  'l10-iceberg-v3-medallion:2': 'Vectores de borrado, linaje de filas y tipo VARIANT en Iceberg',
  'l10-iceberg-v3-medallion:3': 'Particionado oculto, evolución de esquema y patrón WAP',
  'l11-dbt-sqlmesh-dag:0': 'De procedimientos almacenados a grafos modulares (DAG)',
  'l11-dbt-sqlmesh-dag:1': 'Modelos incrementales frente al estado por intervalos',
  'l12-contracts-semantic-layer:1': 'Validación del contrato en CI y corte de circuito en ingesta',
  'l12-contracts-semantic-layer:2': 'Componentes de MetricFlow y Cube: entidades y medidas',
  'l12-contracts-semantic-layer:3': 'Prevención de fan-out en el motor semántico y consumo BI',
  'l13-cohorts-retention-ltv:2': 'Análisis de supervivencia y datos censurados por la derecha',
  'l13-cohorts-retention-ltv:3': 'Cálculo de LTV con margen bruto, CAC y recuperación',
  'l14-ab-testing-cuped:0': 'Diagnóstico previo al análisis: prueba chi-cuadrado para SRM',
  'l14-ab-testing-cuped:1': 'Potencia estadística, MDE y error por inspección prematura',
  'l15-bi-tufte-code:1': 'Razón dato-tinta de Tufte, múltiplos pequeños y color',
  'l15-bi-tufte-code:2': 'Estructura piramidal de Minto y comparación con referencias',
  'l15-bi-tufte-code:3': 'Reportes declarativos en Git con Evidence, Observable y Rill',
  'l16-cdc-kafka-streaming:0': 'Criterios técnicos y de costo entre streaming y micro-lotes',
  'l16-cdc-kafka-streaming:1': 'Extracción por consulta frente a captura del log con Debezium',
  'l16-cdc-kafka-streaming:2': 'Patrón transactional outbox contra escrituras dobles',
  'l16-cdc-kafka-streaming:3': 'Almacenamiento por niveles en Kafka sobre almacenamiento S3',
  'l17-flink-watermarks-mv:0': 'Tiempo de evento frente a tiempo de procesamiento',
  'l17-flink-watermarks-mv:1': 'Funcionamiento de watermarks, retraso y salidas laterales',
  'l17-flink-watermarks-mv:2': 'Ventanas temporales y control del estado con TTL en RocksDB',
  'l17-flink-watermarks-mv:3': 'Mantenimiento incremental de vistas en Materialize y RisingWave',
  'l18-mcp-semantic-ai-rag:0': 'Límites del text-to-SQL directo frente a la capa semántica',
  'l18-mcp-semantic-ai-rag:1': 'Arquitectura de un servidor MCP conectado al catálogo',
  'l18-mcp-semantic-ai-rag:2': 'Recuperación híbrida: búsqueda BM25, vectorial HNSW y RRF',
  'l18-mcp-semantic-ai-rag:3': 'Conjuntos de evaluación deterministas y validación de SQL',
};

const BODY_EXPANSIONS = {
  'l1-joins-fanout:3':
    ' En Mercado Brisa (empresa ficticia), esta auditoría se ejecuta como prueba automática antes de publicar cualquier tabla agregada: si la suma de `order_total_usd` tras el cruce difiere en más de 0.01 USD respecto a la tabla `orders` de origen, la ejecución se detiene y alerta al responsable del modelo para corregir la pre-agregación.',
  'l2-window-functions:3':
    ' Para evitar este sesgo de partición en Mercado Brisa (empresa ficticia), separa las filas con `session_id IS NULL` antes de aplicar la función de ventana o asigna una clave sustituta determinista basada en `COALESCE(session_id, client_ip || event_date)` para repartir la carga de forma equilibrada entre todos los nodos de cómputo.',
  'l3-asof-lateral-ctes:2':
    ' A diferencia de un cruce cartesiano filtrado a posteriori, el optimizador aprovecha un índice compuesto por `(user_id, ticket_ts DESC)` para detener la búsqueda en cuanto localiza las N filas más recientes de cada cliente.',
  'l5-scd2-history:3':
    ' Además, al combinar estas tablas históricas con tablas de hechos en Mercado Brisa (empresa ficticia), incluye siempre la condición de intervalo `f.order_ts >= d.valid_from AND f.order_ts < d.valid_to` junto a la clave natural para reconstruir el atributo exacto que tenía el cliente cuando ocurrió cada compra.',
};

const CHECK_PROMPT_OVERRIDES = {
  'l17-flink-watermarks-mv':
    'Tu trabajo de Apache Flink lee un tópico de Kafka con 16 particiones (una por país) usando tiempo de evento y watermarks. A las 03:00, la partición 14 no registra compras durante 20 minutos y Flink deja de emitir ventanas para los otros 15 países activos. ¿Por qué ocurre y cómo se corrige?',
  'l18-mcp-semantic-ai-rag':
    'En una auditoría de un servidor MCP de datos, encuentras una herramienta `execute_sql(query)` protegida solo con `if (!query.startsWith("SELECT"))` y una nota en el prompt pidiendo no leer la tabla de salarios. ¿Por qué esta defensa falla y qué control se debe aplicar?',
};

const LESSON_META = {
  'l1-joins-fanout': {
    id: 'c1-sql-joins-02-grano-fanout',
    moduleId: 'c1-sql-joins',
    tracks: ['core'],
    level: 1,
    order: 2,
    title: 'Grano de una tabla y fan-out en JOINs',
    minutes: 25,
    prerequisites: ['c1-sql-joins-01'],
    hook: 'En Mercado Brisa (empresa ficticia), tenemos dos tablas: `orders` (una fila por pedido, con el costo de envío `shipping_fee_usd` y el total `order_total_usd`) y `order_items` (una fila por cada producto dentro del pedido). Un analista las une con un `JOIN` directo para su reporte mensual y anuncia que los ingresos por envío subieron un 142 %. Al contrastar con contabilidad, ese dinero no existe en el banco. ¿Qué ocurrió dentro del motor SQL al cruzar ambas tablas?',
    objectives: [
      'Identificar el grano de una tabla verificando su clave primaria real con COUNT(*) y COUNT(DISTINCT).',
      'Detectar cuándo un JOIN uno-a-muchos o muchos-a-muchos multiplica filas y distorsiona sumas y promedios.',
      'Pre-agregar tablas de detalle en CTEs al mismo grano antes de unirlas con tablas de cabecera.',
    ],
    summary: [
      'El grano declara qué entidad física representa exactamente una fila de la tabla.',
      'Unir una tabla maestra con una de detalle (1:N) duplica las métricas de cabecera.',
      'Pre-agrega cada tabla al mismo grano en una CTE antes de hacer el JOIN.',
      'Verifica siempre que SUM(total) antes y después del cruce coincida al centavo.',
    ],
    glossaryTerms: ['c01-grain-fanout', 'c02-cte-preagg'],
    flashcards: [
      {
        id: 'fc-c1-joins-01',
        front: '¿Qué es el grano (grain) de una tabla y cómo se verifica en SQL?',
        back: 'Es lo que representa una fila física. Se verifica comprobando que COUNT(*) coincida con COUNT(DISTINCT clave_candidata).',
      },
      {
        id: 'fc-c1-joins-02',
        front: '¿Por qué un JOIN 1:N infla SUM(order_total) pero no altera COUNT(DISTINCT order_id)?',
        back: 'Porque cada fila de cabecera se repite N veces por sus hijos; SUM suma las repeticiones, mientras COUNT(DISTINCT) colapsa IDs duplicados.',
      },
      {
        id: 'fc-c1-joins-03',
        front: '¿Qué es una trampa de abismo (chasm trap) al unir dos tablas de detalle?',
        back: 'Ocurre al unir dos relaciones 1:N independientes sobre la misma entidad padre (N:1:M), generando N×M filas por entidad.',
      },
    ],
    extraChecks: [
      {
        id: 'c2',
        type: 'mcq',
        prompt: 'Antes de unir `orders` con `order_items`, quieres comprobar si `order_id` es realmente único en `orders`. ¿Qué consulta diagnóstica te confirma que no hay duplicados?',
        options: [
          {
            id: 'a',
            text: 'SELECT COUNT(*) = COUNT(DISTINCT order_id) AS is_unique FROM orders;',
            correct: true,
            feedback: 'Correcto: si el total de filas coincide con el total de order_id distintos y no hay nulos, cada fila representa un pedido único.',
          },
          {
            id: 'b',
            text: 'SELECT DISTINCT order_id FROM orders LIMIT 10;',
            correct: false,
            feedback: 'Incorrecto: DISTINCT oculta precisamente los duplicados que necesitas detectar y LIMIT 10 solo inspecciona una muestra mínima.',
          },
          {
            id: 'c',
            text: 'SELECT SUM(order_id) FROM orders GROUP BY order_id;',
            correct: false,
            feedback: 'Incorrecto: sumar un identificador carece de sentido matemático y no informa cuántas veces se repite cada clave.',
          },
        ],
        explanation: 'Comparar COUNT(*) contra COUNT(DISTINCT pk) o buscar claves con HAVING COUNT(*) > 1 es la verificación estándar de grano antes de escribir un JOIN.',
      },
      {
        id: 'c3',
        type: 'predict-output',
        prompt: 'Un pedido (`order_id = 10`) tiene `shipping_fee = 5` en `orders`, 3 filas en `order_items` y 2 filas en `refunds`. Si unes las tres tablas por `order_id` sin pre-agregar, ¿cuánto devuelve `SUM(shipping_fee)` para ese pedido?',
        options: [
          {
            id: 'a',
            text: '30 (se generan 3 × 2 = 6 filas y el envío de 5 se suma 6 veces).',
            correct: true,
            feedback: 'Correcto: el cruce 1:3 seguido de 1:2 produce el producto cartesiano de 6 filas para el pedido 10, multiplicando 5 × 6 = 30.',
          },
          {
            id: 'b',
            text: '5 (SQL detecta que shipping_fee viene de la tabla orders y lo suma una vez).',
            correct: false,
            feedback: 'Incorrecto: SUM() opera sobre las filas resultantes del FROM/JOIN sin recordar de qué tabla provino originalmente la columna.',
          },
          {
            id: 'c',
            text: '15 (solo multiplica por la primera tabla unida order_items).',
            correct: false,
            feedback: 'Incorrecto: el segundo JOIN vuelve a multiplicar cada una de las 3 filas intermedias por las 2 filas de refunds.',
          },
        ],
        explanation: 'Cuando unes dos tablas de detalle (3 ítems y 2 reembolsos) contra una misma cabecera, se producen 3 × 2 = 6 filas y cualquier métrica de cabecera se multiplica por 6.',
      },
    ],
    sources: [
      {
        title: 'The Data Warehouse Toolkit (3rd Edition), Chapter 2: Dimensional Modeling Techniques — Declare the Grain',
        url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/grain/',
        publisher: 'Kimball Group',
        accessed: '2026-10-29',
        supports: 'Declaración explícita del grano antes de diseñar tablas o escribir consultas de agregación.',
      },
      {
        title: 'PostgreSQL 17 Documentation — Section 7.2: Table Expressions and JOIN Clauses',
        url: 'https://www.postgresql.org/docs/current/queries-table-expressions.html',
        publisher: 'PostgreSQL Global Development Group',
        accessed: '2026-10-29',
        supports: 'Semántica de combinaciones INNER y LEFT JOIN y generación de filas del producto relacional.',
      },
      {
        title: 'DuckDB Documentation — Joins and Common Table Expressions (WITH Clause)',
        url: 'https://duckdb.org/docs/sql/query_syntax/with.html',
        publisher: 'DuckDB Foundation',
        accessed: '2026-10-29',
        supports: 'Uso de CTEs para pre-agregar subconsultas al grano de la entidad antes de combinarlas.',
      },
    ],
    aiNotes: 'El error más frecuente es creer que cambiar INNER JOIN por LEFT JOIN evita el fan-out, o usar DISTINCT en el SELECT final ocultando filas legítimas. Guía a la persona a comparar el grano de ambas tablas y pre-agregar en una CTE por la clave de unión.',
  },
  'l2-window-functions': {
    id: 'c2-sql-analitico-01-window-functions',
    moduleId: 'c2-sql-analitico',
    tracks: ['core'],
    level: 2,
    order: 1,
    title: 'Funciones de ventana y cláusula QUALIFY',
    minutes: 30,
    prerequisites: ['c1-sql-joins-02-grano-fanout'],
    hook: 'En Mercado Brisa (empresa ficticia), el servicio de pagos reintenta cobros cuando la red falla y deja eventos duplicados en la tabla de facturación. Además, finanzas necesita comparar el gasto mensual de cada cliente contra su propio mes anterior sin perder el detalle de cada factura. Si usas `GROUP BY`, colapsas las filas; si escribes subconsultas correlacionadas, la consulta tarda minutos. ¿Cómo resuelves ambos problemas en una sola pasada con funciones de ventana y `QUALIFY`?',
    objectives: [
      'Deduplicar registros con ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...) y filtrar con QUALIFY.',
      'Calcular variaciones periodo a periodo mediante LAG() y LEAD() sin auto-cruces (self-joins).',
      'Distinguir entre marcos ROWS BETWEEN y RANGE BETWEEN en acumulados y medias móviles.',
    ],
    summary: [
      'Una función de ventana calcula agregados o rankings conservando intacto el grano de cada fila.',
      'QUALIFY filtra el resultado de funciones de ventana en el orden lógico posterior a SELECT.',
      'ROWS cuenta filas físicas adyacentes; RANGE agrupa por valor de tiempo o número.',
      'Particionar por una columna con muchos NULL concentra los datos en un solo nodo trabajador.',
    ],
    glossaryTerms: ['c03-window-qualify', 'c05-window-frames'],
    flashcards: [
      {
        id: 'fc-c2-win-01',
        front: '¿En qué se diferencia ROW_NUMBER(), RANK() y DENSE_RANK() ante empates?',
        back: 'ROW_NUMBER asigna números únicos (1,2,3); RANK empata y salta huecos (1,1,3); DENSE_RANK empata sin dejar huecos (1,1,2).',
      },
      {
        id: 'fc-c2-win-02',
        front: '¿Por qué RANGE BETWEEN INTERVAL 6 DAYS PRECEDING es más seguro que ROWS BETWEEN 6 PRECEDING en series diarias?',
        back: 'Porque si falta un día sin ventas, ROWS retrocede 6 filas físicas (7 o más días reales), mientras RANGE respeta la ventana calendario.',
      },
      {
        id: 'fc-c2-win-03',
        front: '¿Qué problema causa PARTITION BY session_id cuando el 60 % de las filas tienen session_id IS NULL?',
        back: 'Todas las filas NULL van al mismo nodo trabajador durante el hash shuffle, causando sesgo de datos (data skew) y posible falta de memoria.',
      },
    ],
    extraChecks: [
      {
        id: 'c2',
        type: 'mcq',
        prompt: 'Quieres quedarte únicamente con la versión más reciente de cada pedido según `updated_at DESC` en DuckDB. ¿Qué cláusula filtra directamente el resultado de `ROW_NUMBER()` sin envolver la consulta en una CTE adicional?',
        options: [
          {
            id: 'a',
            text: 'QUALIFY ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY updated_at DESC) = 1',
            correct: true,
            feedback: 'Correcto: QUALIFY se evalúa después de las funciones de ventana y filtra las filas donde el ranking es 1.',
          },
          {
            id: 'b',
            text: 'WHERE ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY updated_at DESC) = 1',
            correct: false,
            feedback: 'Incorrecto: WHERE se ejecuta antes de calcular las funciones de ventana, por lo que el motor devuelve error de sintaxis.',
          },
          {
            id: 'c',
            text: 'HAVING ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY updated_at DESC) = 1',
            correct: false,
            feedback: 'Incorrecto: HAVING filtra grupos producidos por GROUP BY, no funciones de ventana sobre filas individuales.',
          },
        ],
        explanation: 'En el orden de evaluación SQL, WHERE y HAVING ocurren antes del cálculo de ventanas; QUALIFY actúa como el filtro específico posterior a las funciones OVER().',
      },
      {
        id: 'c3',
        type: 'mcq',
        prompt: 'En SQL estándar, cuando escribes `SUM(amount) OVER (PARTITION BY customer_id ORDER BY order_date)` sin especificar `ROWS` ni `RANGE`, ¿qué marco de ventana aplica el motor por defecto?',
        options: [
          {
            id: 'a',
            text: 'RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW (agrupando empates en order_date).',
            correct: true,
            feedback: 'Correcto: al añadir ORDER BY dentro de OVER(), el marco predeterminado pasa a ser RANGE desde el inicio de la partición hasta el valor actual.',
          },
          {
            id: 'b',
            text: 'ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING (toda la partición).',
            correct: false,
            feedback: 'Incorrecto: ese marco completo solo se aplica cuando NO incluyes cláusula ORDER BY dentro de OVER().',
          },
          {
            id: 'c',
            text: 'ROWS BETWEEN 1 PRECEDING AND CURRENT ROW.',
            correct: false,
            feedback: 'Incorrecto: SQL nunca limita la ventana a una sola fila previa salvo que lo declares explícitamente.',
          },
        ],
        explanation: 'Declarar explícitamente ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW evita sorpresas cuando dos filas comparten la misma marca temporal en ORDER BY.',
      },
    ],
    sources: [
      {
        title: 'PostgreSQL 17 Documentation — Section 3.5: Window Functions',
        url: 'https://www.postgresql.org/docs/current/tutorial-window.html',
        publisher: 'PostgreSQL Global Development Group',
        accessed: '2026-10-29',
        supports: 'Comportamiento de PARTITION BY, ORDER BY y marcos de ventana ROWS frente a RANGE.',
      },
      {
        title: 'DuckDB Documentation — Window Functions and QUALIFY Clause',
        url: 'https://duckdb.org/docs/sql/query_syntax/qualify.html',
        publisher: 'DuckDB Foundation',
        accessed: '2026-10-29',
        supports: 'Filtrado directo de expresiones de ventana mediante la cláusula QUALIFY.',
      },
      {
        title: 'PostgreSQL 17 Documentation — Section 4.2.8: Window Function Calls (Frame Clause)',
        url: 'https://www.postgresql.org/docs/current/sql-expressions.html#SYNTAX-WINDOW-FUNCTIONS',
        publisher: 'PostgreSQL Global Development Group',
        accessed: '2026-10-29',
        supports: 'Definición formal de marcos ROWS, RANGE y GROUPS en el estándar SQL.',
      },
    ],
    aiNotes: 'Las dudas habituales son por qué WHERE no acepta ROW_NUMBER(), por qué SUM() OVER (ORDER BY fecha) salta de golpe cuando hay fechas repetidas (marco por defecto RANGE vs ROWS) y por qué LAST_VALUE requiere declarar UNBOUNDED FOLLOWING.',
  },
  'l3-asof-lateral-ctes': {
    id: 'c2-sql-analitico-02-asof-lateral-ctes',
    moduleId: 'c2-sql-analitico',
    tracks: ['core'],
    level: 2,
    order: 2,
    title: 'Cruces temporales con ASOF JOIN y CTEs modulares',
    minutes: 30,
    prerequisites: ['c2-sql-analitico-01-window-functions'],
    hook: 'En Mercado Brisa (empresa ficticia), un cliente paga un pedido en pesos a las `10:14:22.410`, mientras la tabla de tipos de cambio `fx_rates` se actualiza en instantes irregulares (`09:58:00`, `10:12:05`, `10:19:40`). Si haces un `INNER JOIN` por igualdad de marca temporal, pierdes casi todos los pagos; si unes con `fx_ts <= payment_ts`, multiplicas cada pago por cientos de cotizaciones pasadas. ¿Cómo asignas a cada compra exactamente la cotización vigente a las `10:12:05` sin generar fan-out?',
    objectives: [
      'Cruzar eventos de distinta frecuencia temporal mediante ASOF JOIN sin multiplicar filas.',
      'Utilizar LEFT JOIN LATERAL para recuperar los N eventos previos por entidad en motores sin ASOF.',
      'Organizar consultas complejas en CTEs con capas de importación, limpieza, lógica y salida.',
    ],
    summary: [
      'ASOF JOIN empareja cada fila con la observación previa más cercana sin provocar fan-out.',
      'La condición de desigualdad temporal evita usar valores futuros que aún no existían.',
      'LEFT JOIN LATERAL permite obtener las N filas previas o siguientes por cada entidad.',
      'Estructurar consultas en CTEs cortas y nombradas facilita depurar cada paso por separado.',
    ],
    glossaryTerms: ['c04-asof-join', 'c08-point-in-time'],
    flashcards: [
      {
        id: 'fc-c2-asof-01',
        front: '¿Qué resuelve un ASOF JOIN frente a un JOIN con desigualdad (a.ts >= b.ts)?',
        back: 'Un JOIN con desigualdad devuelve todas las filas pasadas (fan-out); ASOF JOIN devuelve como máximo una fila: la inmediatamente anterior o igual.',
      },
      {
        id: 'fc-c2-asof-02',
        front: '¿Cuándo prefieres LEFT JOIN LATERAL sobre ASOF JOIN?',
        back: 'Cuando necesitas las N filas previas (LIMIT 3) en lugar de una sola, o cuando trabajas en PostgreSQL donde ASOF JOIN no es nativo.',
      },
      {
        id: 'fc-c2-asof-03',
        front: '¿Qué riesgo introduce usar a.ts <= b.ts por error en un cruce histórico para entrenamiento ML?',
        back: 'Asigna estados futuros a eventos pasados (fuga de datos del futuro o data leakage), invalidando las métricas del modelo.',
      },
    ],
    extraChecks: [
      {
        id: 'c2',
        type: 'mcq',
        prompt: 'Un pago ocurre a las 10:15 y existen tasas de cambio a las 10:00, 10:10 y 10:20. Si escribes `ASOF LEFT JOIN fx_rates ON p.currency = f.currency AND p.payment_ts >= f.fx_ts`, ¿qué fila de `fx_rates` se empareja?',
        options: [
          {
            id: 'a',
            text: 'La tasa de las 10:10, porque es la más reciente entre las que cumplen fx_ts <= 10:15.',
            correct: true,
            feedback: 'Correcto: ASOF selecciona la marca temporal más cercana que satisface la desigualdad sin usar datos posteriores al pago.',
          },
          {
            id: 'b',
            text: 'La tasa de las 10:20, porque está a solo 5 minutos de distancia.',
            correct: false,
            feedback: 'Incorrecto: las 10:20 incumplen la condición p.payment_ts >= f.fx_ts y representarían información del futuro.',
          },
          {
            id: 'c',
            text: 'Las tasas de las 10:00 y 10:10 (dos filas).',
            correct: false,
            feedback: 'Incorrecto: ASOF JOIN garantiza cardinalidad máxima de una fila emparejada por cada fila de la tabla izquierda.',
          },
        ],
        explanation: 'ASOF JOIN evalúa la condición de desigualdad temporal y conserva únicamente el registro más próximo, manteniendo intacto el grano de la tabla izquierda.',
      },
      {
        id: 'c3',
        type: 'mcq',
        prompt: 'En PostgreSQL (que no tiene sintaxis `ASOF JOIN` nativa), ¿qué construcción obtiene de forma indexada el último ticket de soporte previo a cada encuesta?',
        options: [
          {
            id: 'a',
            text: 'LEFT JOIN LATERAL (SELECT ... FROM tickets t WHERE t.user_id = s.user_id AND t.ts <= s.ts ORDER BY t.ts DESC LIMIT 1) ON TRUE',
            correct: true,
            feedback: 'Correcto: LATERAL evalúa la subconsulta correlacionada para cada fila izquierda y LIMIT 1 detiene la búsqueda usando el índice.',
          },
          {
            id: 'b',
            text: 'INNER JOIN tickets t ON t.user_id = s.user_id AND t.ts = s.ts',
            correct: false,
            feedback: 'Incorrecto: los timestamps exactos de tickets y encuestas rara vez coinciden al milisegundo.',
          },
          {
            id: 'c',
            text: 'CROSS JOIN tickets t WHERE t.ts <= s.ts',
            correct: false,
            feedback: 'Incorrecto: genera un producto cartesiano de todos los clientes y todos los tickets pasados.',
          },
        ],
        explanation: 'LEFT JOIN LATERAL con ORDER BY ... DESC LIMIT 1 es el equivalente estándar en PostgreSQL para emular un ASOF JOIN o recuperar los top-N eventos previos.',
      },
    ],
    sources: [
      {
        title: 'DuckDB Documentation — ASOF Join',
        url: 'https://duckdb.org/docs/sql/query_syntax/from.html#asof-join',
        publisher: 'DuckDB Foundation',
        accessed: '2026-10-29',
        supports: 'Sintaxis y algoritmo de emparejamiento temporal de ASOF JOIN en DuckDB.',
      },
      {
        title: 'PostgreSQL 17 Documentation — Section 7.2.1.5: LATERAL Subqueries',
        url: 'https://www.postgresql.org/docs/current/queries-table-expressions.html#QUERIES-LATERAL',
        publisher: 'PostgreSQL Global Development Group',
        accessed: '2026-10-29',
        supports: 'Uso de LEFT JOIN LATERAL para subconsultas correlacionadas ordenadas con LIMIT.',
      },
      {
        title: 'Snowflake Documentation — ASOF JOIN',
        url: 'https://docs.snowflake.com/en/sql-reference/constructs/asof-join',
        publisher: 'Snowflake Inc.',
        accessed: '2026-10-29',
        supports: 'Semántica de MATCH_CONDITION y preservación de cardinalidad en series temporales.',
      },
    ],
    aiNotes: 'El alumno suele invertir el signo de desigualdad en ASOF JOIN (usando <= en vez de >= para la tabla de eventos, trayendo datos del futuro) o escribir CTEs monolíticas de 150 líneas. Insiste en dibujar la línea temporal antes de elegir el operador.',
  },
  'l4-star-schema-obt': {
    id: 'c2-dimensional-02-star-schema-obt',
    moduleId: 'c2-dimensional',
    tracks: ['core'],
    level: 2,
    order: 2,
    title: 'Esquema en estrella frente a tabla ancha (OBT)',
    minutes: 25,
    prerequisites: ['c2-dimensional-01'],
    hook: 'En Mercado Brisa (empresa ficticia), los tableros de ventas consultaban directamente la base PostgreSQL transaccional normalizada en 14 tablas (`orders`, `payments`, `customers`, `addresses`, `stores`). Durante el cierre mensual, una consulta que unía 11 tablas bloqueó el cobro en caja durante cuatro minutos. Al separar el almacén analítico, el equipo debate dos diseños: un esquema en estrella (`fact_orders` con dimensiones conformadas) o una tabla ancha desnormalizada (`obt_orders`). ¿Cuándo conviene cada uno?',
    objectives: [
      'Separar cargas transaccionales (OLTP en 3FN) de modelos analíticos (OLAP dimensional).',
      'Diseñar una tabla de hechos con claves sustitutas y dimensiones conformadas en esquema en estrella.',
      'Evaluar el costo de almacenamiento, actualización y cómputo entre esquema en estrella y OBT.',
    ],
    summary: [
      'OLTP optimiza escrituras sin redundancia (3FN); OLAP optimiza lecturas agregadas masivas.',
      'El esquema en estrella separa medidas numéricas en hechos y contexto descriptivo en dimensiones.',
      'Las dimensiones conformadas permiten cruzar múltiples procesos de negocio con definiciones consistentes.',
      'Una OBT acelera consultas sobre un único proceso pero encarece actualizaciones de atributos.',
    ],
    glossaryTerms: ['c06-star-vs-obt', 'c01-grain-fanout'],
    flashcards: [
      {
        id: 'fc-c2-star-01',
        front: '¿Por qué se usan claves sustitutas (surrogate keys) en lugar de IDs de producción en dimensiones?',
        back: 'Aíslan el almacén de cambios en sistemas origen, integran múltiples fuentes y permiten versionar filas históricas en SCD Tipo 2.',
      },
      {
        id: 'fc-c2-star-02',
        front: '¿Qué ventaja aporta una dimensión conformada (`dim_customer`) frente a varias OBT aisladas?',
        back: 'Garantiza que Ventas, Soporte y Logística filtren y agrupen por los mismos atributos de cliente y permite cruzar hechos mediante drill-across.',
      },
      {
        id: 'fc-c2-star-03',
        front: '¿Qué ocurre en una OBT de 2 000 millones de filas cuando cambia el nombre de una categoría de producto?',
        back: 'Obliga a reescribir todos los archivos Parquet donde aparece esa categoría, mientras que en estrella solo se actualiza `dim_product`.',
      },
    ],
    extraChecks: [
      {
        id: 'c2',
        type: 'mcq',
        prompt: 'En Mercado Brisa necesitas cruzar en un mismo reporte las compras (`fact_orders`), las devoluciones (`fact_refunds`) y los tickets de soporte (`fact_tickets`) por mes y segmento de cliente. ¿Qué patrón evita el fan-out entre los tres hechos?',
        options: [
          {
            id: 'a',
            text: 'Drill-across: agregar cada tabla de hechos por separado por mes y cliente_sk y unir los resultados contra dim_date y dim_customer.',
            correct: true,
            feedback: 'Correcto: cada hecho se agrega primero a la granularidad común de las dimensiones conformadas antes de combinar las métricas.',
          },
          {
            id: 'b',
            text: 'Unir fact_orders, fact_refunds y fact_tickets directamente con INNER JOIN por customer_sk.',
            correct: false,
            feedback: 'Incorrecto: unir múltiples tablas de hechos por cliente produce una trampa de abismo (N×M×K filas) y corrompe las sumas.',
          },
          {
            id: 'c',
            text: 'Meter pedidos, devoluciones y tickets como columnas repetidas en una sola OBT sin grano fijo.',
            correct: false,
            feedback: 'Incorrecto: mezclar tres procesos con distinta granularidad temporal en una sola tabla rompe el contrato de grano.',
          },
        ],
        explanation: 'Las dimensiones conformadas actúan como ejes comunes: agregas cada proceso de negocio a las claves de dimensión requeridas y luego combinas los subtotales sin multiplicar filas.',
      },
      {
        id: 'c3',
        type: 'mcq',
        prompt: '¿En qué escenario resulta razonable materializar una One Big Table (OBT) a partir de tu esquema en estrella?',
        options: [
          {
            id: 'a',
            text: 'Como capa final de lectura para un único flujo de eventos inmutables donde un motor columnar filtra pocas columnas.',
            correct: true,
            feedback: 'Correcto: sobre eventos append-only que no requieren actualizaciones frecuentes, una OBT evita el costo de JOIN en consultas exploratorias.',
          },
          {
            id: 'b',
            text: 'Como única capa de almacenamiento reemplazando todas las dimensiones en una empresa con 12 áreas de negocio.',
            correct: false,
            feedback: 'Incorrecto: eliminar las dimensiones compartidas provoca divergencia de definiciones y reescrituras masivas ante cambios de catálogo.',
          },
          {
            id: 'c',
            text: 'En la base de datos PostgreSQL transaccional del carrito de compras.',
            correct: false,
            feedback: 'Incorrecto: desnormalizar la base OLTP introduce anomalías de actualización y bloqueos en escrituras concurrentes.',
          },
        ],
        explanation: 'En arquitecturas modernas, el esquema en estrella en la capa intermedia asegura consistencia y gobernanza, mientras que una OBT puede materializarse en el borde si una carga puntual lo justifica.',
      },
    ],
    sources: [
      {
        title: 'The Data Warehouse Toolkit (3rd Edition) — Star Schemas and OLAP Cubes',
        url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/star-schema-olap-cube/',
        publisher: 'Kimball Group',
        accessed: '2026-10-29',
        supports: 'Separación entre tablas de hechos y dimensiones y uso de dimensiones conformadas.',
      },
      {
        title: 'Kimball Group — Conformed Dimensions and Drill-Across Queries',
        url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/conformed-dimension/',
        publisher: 'Kimball Group',
        accessed: '2026-10-29',
        supports: 'Integración de múltiples tablas de hechos mediante dimensiones compartidas y drill-across.',
      },
      {
        title: 'DuckDB Documentation — Parquet Storage and Columnar Projection Pushdown',
        url: 'https://duckdb.org/docs/data/parquet/overview.html',
        publisher: 'DuckDB Foundation',
        accessed: '2026-10-29',
        supports: 'Comportamiento de motores columnares al proyectar subconjuntos de columnas en tablas anchas.',
      },
    ],
    aiNotes: 'Muchos estudiantes creen que el esquema en estrella está obsoleto porque Parquet comprime columnas repetidas. Explícales que el problema de una OBT pura no es solo el espacio en disco, sino mantener dimensiones cambiantes y cruzar múltiples hechos sin fan-out.',
  },
  'l5-scd2-history': {
    id: 'c2-dimensional-03-scd2-history',
    moduleId: 'c2-dimensional',
    tracks: ['core'],
    level: 2,
    order: 3,
    title: 'Dimensiones cambiantes: historial con SCD tipo 2',
    minutes: 30,
    prerequisites: ['c2-dimensional-02-star-schema-obt'],
    hook: 'En Mercado Brisa (empresa ficticia), el cliente `C-101` estuvo en el segmento `"Hogar"` de enero a junio y compró 1 000 USD. El 1 de julio pasó al segmento `"Mayorista"` y compró otros 1 500 USD. Como la tabla `dim_customer` sobrescribía los cambios (SCD tipo 1), el reporte anual afirma que en el primer semestre `"Hogar"` vendió 0 USD y `"Mayorista"` vendió 1 000 USD. Además, el modelo predictivo entrenado con esa tabla sufrió fuga de datos. ¿Cómo preservas la historia exacta con SCD tipo 2?',
    objectives: [
      'Diferenciar cuándo aplicar SCD tipo 1 (corrección de errores) frente a SCD tipo 2 (historial con vigencia).',
      'Modelar intervalos cerrados-abiertos [valid_from, valid_to) con clave sustituta por versión.',
      'Cruzar hechos y dimensiones históricas reconstruyendo el estado exacto en el instante del evento.',
    ],
    summary: [
      'SCD tipo 1 sobrescribe el valor anterior y destruye la trazabilidad histórica.',
      'SCD tipo 2 crea una nueva fila con su propia clave sustituta y rango [valid_from, valid_to).',
      'Usar intervalos semiabiertos (>= valid_from AND < valid_to) evita huecos y solapamientos.',
      'La fecha centinela 9999-12-31 permite filtrar vigencias sin depender de OR valid_to IS NULL.',
    ],
    glossaryTerms: ['c07-scd-type-2', 'c08-point-in-time'],
    flashcards: [
      {
        id: 'fc-c2-scd-01',
        front: '¿Por qué se prefiere el intervalo semiabierto [valid_from, valid_to) sobre BETWEEN en SCD Tipo 2?',
        back: 'Porque con BETWEEN, si el cierre de una versión coincide al segundo con el inicio de la siguiente, el JOIN empareja ambas filas y duplica el hecho.',
      },
      {
        id: 'fc-c2-scd-02',
        front: '¿Cómo provoca una dimensión SCD Tipo 1 fuga de datos (data leakage) al entrenar un modelo de abandono?',
        back: 'Inyecta en el pasado atributos o estados que el cliente adquirió meses después del evento de entrenamiento.',
      },
      {
        id: 'fc-c2-scd-03',
        front: '¿Para qué sirve almacenar valid_to = 9999-12-31 en la versión actual de una dimensión SCD Tipo 2?',
        back: 'Permite escribir condiciones de rango limpias (event_ts < valid_to) sin evaluar OR valid_to IS NULL, mejorando el uso de índices y zone maps.',
      },
    ],
    extraChecks: [
      {
        id: 'c2',
        type: 'mcq',
        prompt: 'En una tabla SCD Tipo 2, la versión 1 de un cliente cierra en `2026-07-01 00:00:00` y la versión 2 abre en ese mismo instante `2026-07-01 00:00:00`. ¿Qué condición de JOIN evita que un pedido ocurrido exactamente a medianoche se duplique?',
        options: [
          {
            id: 'a',
            text: 'o.order_ts >= d.valid_from AND o.order_ts < d.valid_to',
            correct: true,
            feedback: 'Correcto: el intervalo cerrado por la izquierda y abierto por la derecha asigna la medianoche exactamente a la versión 2.',
          },
          {
            id: 'b',
            text: 'o.order_ts BETWEEN d.valid_from AND d.valid_to',
            correct: false,
            feedback: 'Incorrecto: BETWEEN es inclusivo en ambos extremos (<= y >=), por lo que emparejaría tanto la versión 1 como la versión 2.',
          },
          {
            id: 'c',
            text: 'd.is_current = TRUE',
            correct: false,
            feedback: 'Incorrecto: filtrar por is_current ignora la historia y asigna todos los pedidos pasados al estado actual del cliente.',
          },
        ],
        explanation: 'La convención [valid_from, valid_to) garantiza una partición matemática exacta de la línea temporal: cada instante pertenece a una y solo una versión.',
      },
      {
        id: 'c3',
        type: 'mcq',
        prompt: 'Detectas que el apellido de un cliente tenía una errata tipográfica desde su registro inicial ("Gomez" sin tilde). ¿Qué tipo de actualización corresponde aplicar en la dimensión?',
        options: [
          {
            id: 'a',
            text: 'SCD Tipo 1: corregir el valor en las filas existentes porque nunca representó un cambio real en el mundo físico.',
            correct: true,
            feedback: 'Correcto: las correcciones de errores de captura se sobrescriben con SCD Tipo 1 porque el atributo real nunca cambió.',
          },
          {
            id: 'b',
            text: 'SCD Tipo 2: abrir una nueva versión desde hoy para separar las ventas con errata de las ventas corregidas.',
            correct: false,
            feedback: 'Incorrecto: crear una nueva versión por un error tipográfico fragmentaría artificialmente los reportes por nombre.',
          },
          {
            id: 'c',
            text: 'Borrar las compras históricas asociadas al cliente y recargarlas.',
            correct: false,
            feedback: 'Incorrecto: la tabla de hechos no debe borrarse por corregir un atributo descriptivo en la dimensión.',
          },
        ],
        explanation: 'SCD Tipo 2 se reserva para atributos cuyos cambios históricos tienen significado de negocio (segmento, tarifa, región), mientras que errores de captura se corrigen in-situ con Tipo 1.',
      },
    ],
    sources: [
      {
        title: 'Kimball Group — Slowly Changing Dimensions (Types 0, 1, 2, 3, 4, 6)',
        url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/type-2-slowly-changing-dimension/',
        publisher: 'Kimball Group',
        accessed: '2026-10-29',
        supports: 'Diseño de dimensiones lentamente cambiantes Tipo 2 con claves sustitutas y fechas de vigencia.',
      },
      {
        title: 'dbt Documentation — Add Snapshots to your DAG (SCD Type 2)',
        url: 'https://docs.getdbt.com/docs/build/snapshots',
        publisher: 'dbt Labs',
        accessed: '2026-10-29',
        supports: 'Generación declarativa de tablas SCD Tipo 2 mediante estrategias timestamp y check.',
      },
      {
        title: 'SQLMesh Documentation — Incremental by Time and SCD Type 2 Models',
        url: 'https://sqlmesh.readthedocs.io/en/stable/concepts/models/model_kinds/#scd_type_2_by_time',
        publisher: 'Tobiko Data',
        accessed: '2026-10-29',
        supports: 'Mantenimiento idempotente de dimensiones SCD Tipo 2 basadas en marcas de actualización.',
      },
    ],
    aiNotes: 'El fallo clásico es unir `fact_orders` con `dim_customer_scd2` solo por `customer_id` olvidando el filtro temporal, lo que multiplica cada pedido por el número de versiones históricas del cliente (fan-out). Recuérdales unir por `customer_sk` o incluir el rango `[valid_from, valid_to)`.',
  },
  'l6-metrics-simpson': {
    id: 'c2-dimensional-04-metrics-simpson',
    moduleId: 'c2-dimensional',
    tracks: ['core'],
    level: 2,
    order: 4,
    title: 'Métricas no aditivas y paradoja de Simpson',
    minutes: 30,
    prerequisites: ['c2-dimensional-03-scd2-history'],
    hook: 'En Mercado Brisa (empresa ficticia), la dirección revisa el tablero mensual y observa que la tasa de conversión total cayó del 6.57 % en septiembre al 6.00 % en octubre (-57 puntos básicos). Sin embargo, al desglosar por plataforma, la conversión en Web subió del 8.00 % al 8.50 % y en App Móvil también subió del 3.00 % al 3.50 %. ¿Hay un error en el pipeline de datos o cómo puede bajar el total cuando todos los canales mejoran?',
    objectives: [
      'Distinguir métricas aditivas, semi-aditivas (saldos de inventario) y no aditivas (ratios y usuarios únicos).',
      'Explicar la paradoja de Simpson separando el efecto tasa intrínseca del efecto mezcla (mix shift).',
      'Aplicar la descomposición de Kitagawa-Oaxaca en SQL para cuantificar cuántos puntos básicos aporta cada efecto.',
    ],
    summary: [
      'Un ratio global nunca es el promedio de los ratios; suma numeradores y divide entre la suma de denominadores.',
      'Los conteos de usuarios únicos (COUNT DISTINCT) no son aditivos entre días ni entre canales.',
      'La paradoja de Simpson ocurre cuando cambia el peso relativo de segmentos con distinta tasa base.',
      'La descomposición de Kitagawa-Oaxaca separa el cambio real de rendimiento del cambio de mezcla.',
    ],
    glossaryTerms: ['c09-kpi-trees-guardrails', 'c10-simpsons-paradox', 'c11-additivity-hll'],
    flashcards: [
      {
        id: 'fc-c2-simp-01',
        front: '¿Por qué es un error calcular la conversión mensual como AVG(daily_conversion_rate)?',
        back: 'Porque pondera igual un martes de 500 visitas que un sábado de 50 000 visitas; debe calcularse como SUM(orders) / SUM(sessions).',
      },
      {
        id: 'fc-c2-simp-02',
        front: '¿Cómo se explica que la conversión suba en Web y suba en App pero baje en el total de la empresa?',
        back: 'Por un cambio de mezcla (mix shift): creció mucho el peso de tráfico en el canal con menor conversión base (App), arrastrando la media ponderada.',
      },
      {
        id: 'fc-c2-simp-03',
        front: '¿Por qué una métrica de inventario (stock_on_hand) se clasifica como semi-aditiva?',
        back: 'Se puede sumar entre productos y almacenes en una fecha fija, pero no se puede sumar a lo largo del tiempo (se promedia o se toma el cierre).',
      },
    ],
    extraChecks: [
      {
        id: 'c2',
        type: 'mcq',
        prompt: 'Tienes una tabla diaria con `date`, `store_id`, `orders` y `revenue`. Quieres obtener el ticket promedio (`AOV`) del trimestre completo en SQL. ¿Cuál es la expresión correcta?',
        options: [
          {
            id: 'a',
            text: 'SUM(revenue) / NULLIF(SUM(orders), 0)',
            correct: true,
            feedback: 'Correcto: los ratios se agregan sumando el numerador atómico y dividiendo entre la suma del denominador atómico.',
          },
          {
            id: 'b',
            text: 'AVG(revenue / orders)',
            correct: false,
            feedback: 'Incorrecto: promediar los promedios diarios asigna el mismo peso a días con pocas ventas que a días pico.',
          },
          {
            id: 'c',
            text: 'SUM(revenue / orders)',
            correct: false,
            feedback: 'Incorrecto: sumar tickets promedios diarios multiplica el resultado por el número de días del trimestre.',
          },
        ],
        explanation: 'Las métricas de razón (AOV, tasa de conversión, margen porcentual) son no aditivas: siempre debes almacenar y sumar sus componentes base antes de dividir.',
      },
      {
        id: 'c3',
        type: 'mcq',
        prompt: 'En Mercado Brisa, el lunes entraron 10 000 usuarios únicos y el martes entraron 12 000 usuarios únicos. ¿Cuántos usuarios únicos entraron en el acumulado de ambos días?',
        options: [
          {
            id: 'a',
            text: 'Un número entre 12 000 y 22 000; hay que ejecutar COUNT(DISTINCT user_id) o combinar sketches HyperLogLog sobre el rango completo.',
            correct: true,
            feedback: 'Correcto: los usuarios que visitaron ambos días se contarían dos veces si sumaras 10 000 + 12 000.',
          },
          {
            id: 'b',
            text: 'Exactamente 22 000 usuarios únicos (la suma de lunes y martes).',
            correct: false,
            feedback: 'Incorrecto: COUNT(DISTINCT) no es aditivo; sumar conteos diarios duplica a todos los clientes recurrentes.',
          },
          {
            id: 'c',
            text: '11 000 usuarios únicos (el promedio de ambos días).',
            correct: false,
            feedback: 'Incorrecto: el promedio de usuarios diarios (DAU promedio) no equivale al alcance acumulado de usuarios únicos del periodo.',
          },
        ],
        explanation: 'La cardinalidad de conjuntos (COUNT DISTINCT) no es aditiva porque la unión de conjuntos con intersección no vacía es menor que la suma de sus tamaños individuales.',
      },
    ],
    sources: [
      {
        title: 'Stanford Encyclopedia of Philosophy — Simpson’s Paradox',
        url: 'https://plato.stanford.edu/entries/paradox-simpson/',
        publisher: 'Stanford University',
        accessed: '2026-10-29',
        supports: 'Fundamento matemático de la inversión de asociaciones al agregar subpoblaciones con pesos cambiantes.',
      },
      {
        title: 'Kimball Group — Additive, Semi-Additive, and Non-Additive Facts',
        url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/additive-semi-additive-non-additive-facts/',
        publisher: 'Kimball Group',
        accessed: '2026-10-29',
        supports: 'Clasificación de medidas según las dimensiones sobre las que pueden sumarse válidamente.',
      },
      {
        title: 'DuckDB Documentation — Approximate Aggregate Functions (approx_count_distinct / HyperLogLog)',
        url: 'https://duckdb.org/docs/sql/functions/aggregates.html',
        publisher: 'DuckDB Foundation',
        accessed: '2026-10-29',
        supports: 'Estimación de cardinalidades no aditivas a gran escala mediante sketches HyperLogLog.',
      },
    ],
    aiNotes: 'El error más habitual es promediar porcentajes o sumar usuarios únicos diarios para obtener usuarios mensuales. Pide siempre a la persona que escriba primero el numerador y el denominador por separado y que compruebe si los pesos por segmento cambiaron entre dos periodos.',
  },
  'l7-columnar-parquet': {
    id: 'de2-formatos-01-columnar-parquet',
    moduleId: 'de2-formatos',
    tracks: ['de'],
    level: 2,
    order: 1,
    title: 'Formato físico Parquet v2, zone maps y filtros de Bloom',
    minutes: 30,
    prerequisites: ['c2-dimensional-02-star-schema-obt'],
    hook: 'En Mercado Brisa (empresa ficticia), la tabla de eventos de navegación `events` tiene 60 columnas y 100 millones de filas (120 GB sin comprimir). El tablero diario solo ejecuta `SELECT store_id, SUM(amount_usd) FROM events WHERE event_date = \'2025-10-28\'`. En una réplica PostgreSQL orientada a filas, el disco lee los 120 GB completos porque las 60 columnas de cada fila están contiguas. Al pasar a archivos Parquet ordenados por fecha, la consulta lee 42 MB en 80 ms. ¿Cómo logra Parquet descartar el 99.9 % del archivo sin abrirlo?',
    objectives: [
      'Explicar la estructura interna de un archivo Apache Parquet: Row Groups, Column Chunks, Pages y Footer.',
      'Aprovechar la poda de columnas (projection pushdown) y el salto de bloques mediante zone maps (min/max).',
      'Ordenar físicamente las tablas al escribir (clustering) y añadir filtros de Bloom para claves de alta cardinalidad.',
    ],
    summary: [
      'El almacenamiento columnar guarda juntos los valores de una misma columna, leyendo solo las columnas proyectadas.',
      'Cada Row Group registra estadísticas min/max en el footer para saltar bloques completos sin descomprimirlos.',
      'Los zone maps solo descartan bloques si los datos están físicamente ordenados por la columna filtrada.',
      'Los filtros de Bloom permiten descartar Row Groups al buscar un ID puntual de alta cardinalidad.',
    ],
    glossaryTerms: ['c12-parquet-columnar', 'c13-zone-maps-skipping'],
    flashcards: [
      {
        id: 'fc-de2-parq-01',
        front: '¿Por qué los zone maps (min/max) dejan de saltar bloques cuando escribes filas en orden aleatorio?',
        back: 'Porque cada Row Group acaba conteniendo casi todo el rango de fechas o valores, solapándose el min y el max en todos los bloques.',
      },
      {
        id: 'fc-de2-parq-02',
        front: '¿Para qué sirve un filtro de Bloom en el encabezado de un Row Group de Parquet?',
        back: 'Para responder con certeza si un valor de alta cardinalidad (como un order_id o UUID) NO está en ese Row Group sin leer las páginas.',
      },
      {
        id: 'fc-de2-parq-03',
        front: '¿Qué combinación de codificación aplica Parquet sobre una columna de texto con pocos valores distintos (país)?',
        back: 'Codificación por diccionario (sustituye cadenas por enteros pequeños) seguida de Run-Length Encoding (RLE) y empaquetado de bits.',
      },
    ],
    extraChecks: [
      {
        id: 'c2',
        type: 'mcq',
        prompt: 'Tienes un archivo Parquet de 50 Row Groups con `event_date` entre enero y diciembre. Si los datos se insertaron desordenados y cada Row Group tiene `min(event_date) = 2025-01-01` y `max(event_date) = 2025-12-31`, ¿cuántos Row Groups leerá una consulta con `WHERE event_date = \'2025-06-15\'`?',
        options: [
          {
            id: 'a',
            text: 'Los 50 Row Groups completos, porque el valor buscado cae dentro del intervalo [min, max] de todos los bloques.',
            correct: true,
            feedback: 'Correcto: sin orden físico previo al escribir, los rangos min/max se solapan al 100 % y el motor no puede descartar ningún bloque.',
          },
          {
            id: 'b',
            text: 'Solo 1 Row Group, porque Parquet indexa cada fila individualmente como un árbol B-Tree.',
            correct: false,
            feedback: 'Incorrecto: Parquet no mantiene un B-Tree global por fila; depende de las estadísticas por Row Group y Page.',
          },
          {
            id: 'c',
            text: 'Ninguno, porque lee el resultado directamente del footer.',
            correct: false,
            feedback: 'Incorrecto: el footer solo guarda metadatos y estadísticas por bloque, no el detalle de las filas filtradas.',
          },
        ],
        explanation: 'La eficacia del data skipping por zone maps depende directamente de cómo ordenas las filas (ORDER BY event_date) antes de escribir el archivo Parquet.',
      },
      {
        id: 'c3',
        type: 'mcq',
        prompt: 'En una tabla Parquet ordenada por `event_date`, los analistas también hacen búsquedas frecuentes por `WHERE order_id = \'ORD-99812\'`. Como `order_id` no correlacióna con la fecha, sus rangos min/max abarcan todo el alfabeto en cada bloque. ¿Qué estructura del formato Parquet acelera este filtro puntual?',
        options: [
          {
            id: 'a',
            text: 'Un filtro de Bloom por columna (Column Bloom Filter) almacenado junto a los metadatos del Row Group.',
            correct: true,
            feedback: 'Correcto: el filtro de Bloom comprueba por hash si ORD-99812 puede existir en el bloque y descarta la mayoría de Row Groups sin descomprimirlos.',
          },
          {
            id: 'b',
            text: 'Aumentar el tamaño del Row Group a 10 GB.',
            correct: false,
            feedback: 'Incorrecto: hacer los bloques más grandes reduce la granularidad de descarte y obliga a leer más datos en memoria.',
          },
          {
            id: 'c',
            text: 'Desactivar la compresión Zstandard.',
            correct: false,
            feedback: 'Incorrecto: quitar compresión multiplica los bytes leídos desde disco o almacenamiento de objetos.',
          },
        ],
        explanation: 'Mientras que los zone maps (min/max) requieren orden físico, los filtros de Bloom funcionan por resumen de hashes y son ideales para predicados de igualdad sobre IDs.',
      },
    ],
    sources: [
      {
        title: 'Apache Parquet Official Documentation — File Format and Internal Layout',
        url: 'https://parquet.apache.org/docs/file-format/',
        publisher: 'Apache Software Foundation',
        accessed: '2026-10-29',
        supports: 'Arquitectura interna de Row Groups, Column Chunks, Pages y metadatos en el Footer.',
      },
      {
        title: 'Apache Parquet Documentation — Encodings (Dictionary, RLE, Delta) and Bloom Filters',
        url: 'https://parquet.apache.org/docs/file-format/bloomfilter/',
        publisher: 'Apache Software Foundation',
        accessed: '2026-10-29',
        supports: 'Especificación de filtros de Bloom por columna para salto de bloques en predicados de igualdad.',
      },
      {
        title: 'DuckDB Documentation — Reading and Writing Parquet Files',
        url: 'https://duckdb.org/docs/data/parquet/tips.html',
        publisher: 'DuckDB Foundation',
        accessed: '2026-10-29',
        supports: 'Recomendaciones de tamaño de Row Group, compresión ZSTD y ordenamiento previo al escribir Parquet.',
      },
    ],
    aiNotes: 'El alumno suele confundir el formato en disco (Parquet) con el formato en memoria (Arrow), o asumir que Parquet salta bloques mágicamente sin ordenar los datos al escribir. Recalca siempre que los zone maps requieren clustering previo por la columna de filtro.',
  },
  'l8-arrow-lance-vortex': {
    id: 'de2-formatos-02-arrow-lance-vortex',
    moduleId: 'de2-formatos',
    tracks: ['de'],
    level: 2,
    order: 2,
    title: 'Memoria columnar con Apache Arrow, Lance y Vortex',
    minutes: 30,
    prerequisites: ['de2-formatos-01-columnar-parquet'],
    hook: 'En Mercado Brisa (empresa ficticia), un pipeline lee 40 millones de pedidos con DuckDB, pasa el resultado a Polars en Python y alimenta el servicio de reportes. Con cursores ODBC y `pandas.DataFrame`, el 78 % del tiempo de CPU y el 65 % de la RAM se iban en serializar y copiar bytes. Al pasar a Apache Arrow en memoria, la transferencia tardó 0.2 ms sin copiar un byte. ¿Cómo funciona la memoria columnar zero-copy?',
    objectives: [
      'Explicar el diseño de búferes contiguos de Apache Arrow en RAM (mapa de bits de validez, desplazamientos y valores).',
      'Transferir tablas entre DuckDB, Polars y PyArrow mediante intercambio de punteros sin copia (zero-copy) ni serialización.',
      'Identificar por qué el acceso aleatorio por índice y los vectores de embeddings requieren formatos como Lance o Vortex frente a Parquet.',
    ],
    summary: [
      'Apache Arrow estandariza la representación columnar en RAM para compartir datos entre motores mediante punteros.',
      'Los búferes contiguos permiten procesar vectores completos por ciclo de reloj con instrucciones SIMD.',
      'ADBC y Arrow Flight sustituyen la serialización fila a fila de JDBC/ODBC por flujos columnares directos.',
      'Lance y Vortex optimizan el acceso aleatorio O(1) por fila y la búsqueda sobre vectores multimodales.',
    ],
    glossaryTerms: ['c14-apache-arrow-zerocopy', 'c12-parquet-columnar'],
    flashcards: [
      {
        id: 'fc-de2-arr-01',
        front: '¿Cuál es la diferencia de propósito entre Apache Parquet y Apache Arrow?',
        back: 'Parquet es un formato de archivo en disco orientado a alta compresión; Arrow es un formato de tablas en memoria RAM orientado a CPU SIMD e intercambio zero-copy.',
      },
      {
        id: 'fc-de2-arr-02',
        front: '¿Por qué convertir un resultado de DuckDB a pandas con `.df()` puede agotar la memoria frente a `.arrow()`?',
        back: 'Porque `.df()` materializa objetos Python y copias de memoria para textos, mientras `.arrow()` expone los búferes columnares directamente sin duplicarlos.',
      },
      {
        id: 'fc-de2-arr-03',
        front: '¿Por qué Parquet es ineficiente cuando necesitas recuperar 500 filas específicas por índice tras una búsqueda vectorial?',
        back: 'Porque obliga a descomprimir páginas o Row Groups enteros por cada fila buscada (amplificación de lectura), mientras Lance ofrece acceso directo O(1) por desplazamiento.',
      },
    ],
    extraChecks: [
      {
        id: 'c2',
        type: 'mcq',
        prompt: 'Ejecutas una consulta en DuckDB desde Python y quieres pasar el resultado a Polars sin duplicar la tabla en RAM. ¿Qué secuencia aprovecha la interfaz en memoria de Apache Arrow?',
        options: [
          {
            id: 'a',
            text: 'pl.from_arrow(con.execute(sql).fetch_arrow_table())',
            correct: true,
            feedback: 'Correcto: DuckDB produce RecordBatches de Arrow y Polars adopta directamente los punteros a esos búferes de memoria.',
          },
          {
            id: 'b',
            text: 'pl.from_pandas(con.execute(sql).fetchall())',
            correct: false,
            feedback: 'Incorrecto: fetchall() crea millones de tuplas de Python en memoria antes de volver a convertirlas.',
          },
          {
            id: 'c',
            text: 'Exportar a CSV temporal en disco y leerlo con pl.read_csv().',
            correct: false,
            feedback: 'Incorrecto: serializar a texto en disco y volver a parsear tipos es varios órdenes de magnitud más lento.',
          },
        ],
        explanation: 'Al compartir la especificación de memoria de Apache Arrow, DuckDB y Polars intercambian descriptores de búfer en microsegundos sin copiar los arrays de datos.',
      },
      {
        id: 'c3',
        type: 'mcq',
        prompt: '¿Cómo representa Apache Arrow en memoria los valores `NULL` de una columna numérica de 64 bits sin romper la alineación para instrucciones vectoriales SIMD?',
        options: [
          {
            id: 'a',
            text: 'Mediante un búfer separado de mapa de bits de validez (1 bit por fila) junto al búfer contiguo de valores de 64 bits.',
            correct: true,
            feedback: 'Correcto: separar el bitmap de validez permite que el array numérico conserve posiciones fijas de 8 bytes alineadas para SIMD.',
          },
          {
            id: 'b',
            text: 'Guardando el texto "NULL" intercalado dentro del array de números.',
            correct: false,
            feedback: 'Incorrecto: mezclar tipos rompería el ancho fijo de 64 bits por elemento y obligaría a usar punteros en caja.',
          },
          {
            id: 'c',
            text: 'Sustituyendo todos los nulos por el número -1 en el array.',
            correct: false,
            feedback: 'Incorrecto: -1 es un número válido en datos reales y corrompería cualquier suma o promedio.',
          },
        ],
        explanation: 'Arrow separa cada columna en búferes especializados: un bitmap de validez para nulos y búferes contiguos de valores (y de offsets si el tipo es de longitud variable).',
      },
    ],
    sources: [
      {
        title: 'Apache Arrow Official Specification — Columnar Format and Memory Layout',
        url: 'https://arrow.apache.org/docs/format/Columnar.html',
        publisher: 'Apache Software Foundation',
        accessed: '2026-10-29',
        supports: 'Disposición física de búferes de validez, offsets y valores en memoria RAM.',
      },
      {
        title: 'DuckDB Documentation — DuckDB and Apache Arrow Zero-Copy Integration',
        url: 'https://duckdb.org/docs/guides/python/sql_on_arrow.html',
        publisher: 'DuckDB Foundation',
        accessed: '2026-10-29',
        supports: 'Intercambio sin copia entre DuckDB, PyArrow y Polars en un mismo proceso.',
      },
      {
        title: 'Lance Format Documentation — Random Access and Vector Search on Columnar Data',
        url: 'https://lancedb.github.io/lance/format.html',
        publisher: 'LanceDB',
        accessed: '2026-10-29',
        supports: 'Diseño de formato columnar para acceso aleatorio por índice y vectores de alta dimensión.',
      },
    ],
    aiNotes: 'Aclara siempre que Arrow no reemplaza a Parquet en el almacenamiento de objetos cuando se busca máxima compresión; ambos se complementan (Parquet en reposo en S3, Arrow en tránsito y en memoria RAM).',
  },
  'l9-duckdb-polars-marimo': {
    id: 'de2-formatos-03-duckdb-polars-marimo',
    moduleId: 'de2-formatos',
    tracks: ['de'],
    level: 2,
    order: 3,
    title: 'Ejecución local con DuckDB, Polars perezoso y Marimo',
    minutes: 30,
    prerequisites: ['de2-formatos-02-arrow-lance-vortex'],
    hook: 'En Mercado Brisa (empresa ficticia), un proceso diario de 45 GB de ventas corría en un clúster de 8 nodos: tardaba 7 minutos en arrancar máquinas y 9 minutos enviando datos por red. Además, los cuadernos Jupyter fallaban cuando alguien ejecutaba celdas fuera de orden dejando estado oculto. Al pasar a DuckDB, Polars en modo perezoso (`scan_parquet`) y Marimo en una sola máquina, terminó en 19 segundos. ¿Cuándo basta un solo nodo y cómo evita la ejecución perezosa agotar la RAM?',
    objectives: [
      'Dimensionar cuándo una carga analítica cabe en un motor local multiproceso (DuckDB / Polars) sin pagar el costo de red de un clúster.',
      'Reemplazar lecturas ansiosas (`read_parquet`) por planes perezosos (`scan_parquet` + `.collect()`) con poda de predicados y columnas.',
      'Construir cuadernos reproducibles basados en un grafo reactivo acíclico (Marimo) sin estado oculto entre celdas.',
    ],
    summary: [
      'Para conjuntos de decenas de gigabytes, el costo de red de un clúster supera al cómputo local vectorizado.',
      'DuckDB procesa datos mayores que la RAM en fragmentos (morsels) volcando intermedios a disco.',
      'En Polars, scan_parquet optimiza el plan completo antes de leer disco; read_parquet carga todo de golpe.',
      'Marimo modela las celdas como un DAG reactivo y reproducible almacenado como script .py puro.',
    ],
    glossaryTerms: ['c15-duckdb-polars-lazy', 'c16-duckdb-wasm-bi'],
    flashcards: [
      {
        id: 'fc-de2-local-01',
        front: '¿Por qué `pl.scan_parquet()` consume mucha menos RAM que `pl.read_parquet()` antes de un filtro y selección?',
        back: 'Porque `scan_parquet` construye un plan lógico y empuja el filtro y las columnas al lector Parquet; `read_parquet` materializa toda la tabla primero.',
      },
      {
        id: 'fc-de2-local-02',
        front: '¿Qué es la ejecución guiada por fragmentos (morsel-driven parallelism) en DuckDB?',
        back: 'Divide las tablas en lotes de ~100 000 filas que los hilos de CPU toman dinámicamente con robo de trabajo y vuelcan a disco si superan la RAM.',
      },
      {
        id: 'fc-de2-local-03',
        front: '¿Cómo impide Marimo el problema del estado oculto que ocurre en los cuadernos Jupyter tradicionales?',
        back: 'Analiza estáticamente qué variables define y consume cada celda, prohíbe redefinir variables globales y reejecuta en orden topológico las celdas dependientes.',
      },
    ],
    extraChecks: [
      {
        id: 'c2',
        type: 'mcq',
        prompt: 'Tienes un archivo Parquet de 30 GB con 80 columnas en una portátil con 16 GB de RAM. En Polars necesitas filtrar un mes y agrupar por 2 columnas. ¿Qué patrón evita un error de memoria (`OutOfMemory`)?',
        options: [
          {
            id: 'a',
            text: 'Usar pl.scan_parquet(...).filter(...).group_by(...).agg(...).collect(streaming=True)',
            correct: true,
            feedback: 'Correcto: la API Lazy empuja los predicados y la proyección de 2 columnas al lector Parquet y procesa por lotes sin cargar los 30 GB.',
          },
          {
            id: 'b',
            text: 'Usar df = pl.read_parquet(...) y luego borrar las 78 columnas sobrantes con df.drop(...).',
            correct: false,
            feedback: 'Incorrecto: pl.read_parquet intenta cargar las 80 columnas completas en RAM antes de que se ejecute drop().',
          },
          {
            id: 'c',
            text: 'Convertir primero el archivo Parquet a un diccionario de Python.',
            correct: false,
            feedback: 'Incorrecto: los objetos nativos de Python multiplican varias veces el consumo de memoria.',
          },
        ],
        explanation: 'La evaluación perezosa permite al optimizador de consultas inspeccionar toda la cadena de transformaciones antes de tocar el disco, leyendo solo los bloques y columnas indispensables.',
      },
      {
        id: 'c3',
        type: 'mcq',
        prompt: '¿Qué ventaja aporta que un cuaderno de Marimo se guarde como un archivo `.py` estándar en lugar de un JSON `.ipynb` con salidas binarias incrustadas?',
        options: [
          {
            id: 'a',
            text: 'Permite revisar diffs limpios en Git, ejecutarlo directamente como script o test de CI y evita conflictos por imágenes base64.',
            correct: true,
            feedback: 'Correcto: al ser código Python puro sin blobs de salida ni contadores de ejecución mutables, se versiona y prueba como cualquier módulo.',
          },
          {
            id: 'b',
            text: 'Hace que las consultas SQL ignoren los tipos de datos.',
            correct: false,
            feedback: 'Incorrecto: el formato del archivo del cuaderno no desactiva la verificación de tipos de los motores SQL o DataFrame.',
          },
          {
            id: 'c',
            text: 'Reemplaza el almacenamiento en Parquet por archivos de texto.',
            correct: false,
            feedback: 'Incorrecto: Marimo es el entorno de código y reactividad; los datos siguen almacenándose en Parquet o bases analíticas.',
          },
        ],
        explanation: 'Guardar los cuadernos como scripts Python puros con dependencias declaradas por un DAG elimina la brecha entre la exploración del analista y la puesta en producción.',
      },
    ],
    sources: [
      {
        title: 'DuckDB Documentation — Why DuckDB and Out-of-Core Execution',
        url: 'https://duckdb.org/why_duckdb.html',
        publisher: 'DuckDB Foundation',
        accessed: '2026-10-29',
        supports: 'Ejecución vectorizada en proceso y gestión de memoria más allá de la RAM en un solo nodo.',
      },
      {
        title: 'Polars User Guide — Lazy API and Query Optimization',
        url: 'https://docs.pola.rs/user-guide/lazy/',
        publisher: 'Polars Project',
        accessed: '2026-10-29',
        supports: 'Diferencia entre evaluación ansiosa y perezosa, predicate pushdown y projection pushdown.',
      },
      {
        title: 'Marimo Documentation — Reactive Execution and Reproducible Python Notebooks',
        url: 'https://docs.marimo.io/guides/reactivity/',
        publisher: 'Marimo Team',
        accessed: '2026-10-29',
        supports: 'Ejecución determinista guiada por grafo acíclico dirigido (DAG) en archivos Python puros.',
      },
    ],
    aiNotes: 'El error común es mezclar `pl.read_parquet` con transformaciones pesadas o creer que cualquier tarea de 20 GB necesita Spark. Anima a verificar primero cuánto pesan las columnas realmente proyectadas tras aplicar predicate y projection pushdown.',
  },
  'l10-iceberg-v3-medallion': {
    id: 'de3-lakehouse-01-iceberg-v3-medallion',
    moduleId: 'de3-lakehouse',
    tracks: ['de'],
    level: 3,
    order: 1,
    title: 'Tablas abiertas con Apache Iceberg v3',
    minutes: 30,
    prerequisites: ['de2-formatos-01-columnar-parquet'],
    hook: 'En Mercado Brisa (empresa ficticia), el lago de datos guardaba carpetas sueltas de archivos Parquet en almacenamiento de objetos. Cuando un proceso falló a mitad de escritura y otro trabajo intentó borrar los datos de 400 clientes por solicitud legal, los reportes leyeron archivos incompletos y reescribir 18 TB de Parquet costó horas de cómputo. Al migrar a Apache Iceberg con catálogo transaccional, vectores de borrado y patrón Write-Audit-Publish, las actualizaciones quedaron aisladas y atómicas. ¿Cómo convierte Iceberg archivos inmutables en tablas ACID?',
    objectives: [
      'Trazar la jerarquía de metadatos de Apache Iceberg: catálogo, metadata.json, manifest list, manifest files y archivos Parquet.',
      'Diferenciar borrados Copy-on-Write frente a Merge-on-Read con vectores de borrado (deletion vectors) en Iceberg v3.',
      'Aplicar la arquitectura Medallion (Bronze, Silver, Gold) junto al patrón Write-Audit-Publish (WAP) antes de exponer datos.',
    ],
    summary: [
      'Apache Iceberg aporta transacciones ACID y aislamiento de instantáneas sobre archivos Parquet inmutables.',
      'El catálogo mantiene el puntero atómico al archivo metadata.json vigente de cada tabla.',
      'Los vectores de borrado marcan filas eliminadas en mapas de bits sin reescribir archivos de datos.',
      'El patrón Write-Audit-Publish escribe en una rama aislada, ejecuta pruebas y avanza el puntero principal.',
    ],
    glossaryTerms: ['c17-medallion-architecture', 'c18-iceberg-v3'],
    flashcards: [
      {
        id: 'fc-de3-ice-01',
        front: '¿Por qué nunca debes listar directorios en S3 (`ls s3://...`) para descubrir qué archivos pertenecen a una tabla Iceberg?',
        back: 'Porque en S3 pueden coexistir archivos de instantáneas pasadas o escrituras en curso; solo el árbol que cuelga del metadata.json actual define la tabla.',
      },
      {
        id: 'fc-de3-ice-02',
        front: '¿Qué ventaja aportan los vectores de borrado (Merge-on-Read) frente a Copy-on-Write ante borrados frecuentes?',
        back: 'Evitan reescribir archivos Parquet de cientos de megabytes por borrar unas pocas filas; escriben un bitmap ligero y difieren la reescritura a la compactación.',
      },
      {
        id: 'fc-de3-ice-03',
        front: '¿Qué es el particionado oculto (hidden partitioning) en Apache Iceberg?',
        back: 'Iceberg calcula internamente la partición (mes, día, bucket) a partir de la columna timestamp sin exigir que el usuario añada columnas artificiales en el WHERE.',
      },
    ],
    extraChecks: [
      {
        id: 'c2',
        type: 'mcq',
        prompt: 'Necesitas eliminar 150 filas por derecho al olvido (GDPR) repartidas en 80 archivos Parquet de 512 MB cada uno en una tabla Apache Iceberg con baja latencia de escritura. ¿Qué estrategia minimiza los bytes escritos en el momento del DELETE?',
        options: [
          {
            id: 'a',
            text: 'Merge-on-Read con vectores de borrado (deletion vectors) y compactación asíncrona posterior.',
            correct: true,
            feedback: 'Correcto: escribe únicamente mapas de bits indicando las posiciones borradas y programa la reescritura física fuera de la ruta crítica.',
          },
          {
            id: 'b',
            text: 'Copy-on-Write reescribiendo los 80 archivos Parquet de 512 MB en el acto.',
            correct: false,
            feedback: 'Incorrecto: Copy-on-Write obligaría a leer y reescribir ~40 GB de datos solo para quitar 150 filas.',
          },
          {
            id: 'c',
            text: 'Renombrar manualmente los archivos Parquet en el bucket S3.',
            correct: false,
            feedback: 'Incorrecto: modificar archivos fuera del catálogo de Iceberg corrompe las referencias de los manifest files.',
          },
        ],
        explanation: 'Merge-on-Read desacopla el costo de escritura inmediata del costo de mantenimiento físico, que luego se resuelve mediante trabajos periódicos de compactación.',
      },
      {
        id: 'c3',
        type: 'mcq',
        prompt: '¿Qué protege el patrón Write-Audit-Publish (WAP) al actualizar la tabla `gold.daily_revenue` en Iceberg?',
        options: [
          {
            id: 'a',
            text: 'Escribe los datos nuevos en una rama o snapshot no publicado, valida reconciliación y nulos, y solo entonces hace fast-forward de main.',
            correct: true,
            feedback: 'Correcto: si alguna prueba de calidad falla, los lectores de main jamás llegan a ver los datos defectuosos.',
          },
          {
            id: 'b',
            text: 'Publica los datos primero en producción y envía un correo si un test falla una hora después.',
            correct: false,
            feedback: 'Incorrecto: auditar después de publicar expone métricas erróneas en los tableros durante el intervalo de fallo.',
          },
          {
            id: 'c',
            text: 'Bloquea todas las lecturas de BI mientras dura la carga.',
            correct: false,
            feedback: 'Incorrecto: gracias al aislamiento por instantáneas, los lectores siguen consultando la versión previa sin bloqueos.',
          },
        ],
        explanation: 'Al separar la escritura física del cambio atómico de referencia en el catálogo, WAP impide que datos sin auditar lleguen a los consumidores.',
      },
    ],
    sources: [
      {
        title: 'Apache Iceberg Official Specification — Table Format v2 and v3',
        url: 'https://iceberg.apache.org/spec/',
        publisher: 'Apache Software Foundation',
        accessed: '2026-10-29',
        supports: 'Jerarquía de metadatos, aislamiento de instantáneas, vectores de borrado y evolución de esquema.',
      },
      {
        title: 'Apache Iceberg Documentation — Partitioning and Hidden Partitioning',
        url: 'https://iceberg.apache.org/docs/latest/partitioning/',
        publisher: 'Apache Software Foundation',
        accessed: '2026-10-29',
        supports: 'Transformaciones de partición declarativas y evolución de diseño de partición sin reescribir historia.',
      },
      {
        title: 'Apache Iceberg Documentation — Branching and Tagging (Write-Audit-Publish)',
        url: 'https://iceberg.apache.org/docs/latest/branching/',
        publisher: 'Apache Software Foundation',
        accessed: '2026-10-29',
        supports: 'Uso de ramas a nivel de metadatos para validar calidad antes de publicar cambios.',
      },
    ],
    aiNotes: 'Las confusiones frecuentes son pensar que Iceberg es un motor de consultas (es un formato de tabla abierto leído por DuckDB, Spark, Trino o Snowflake) o creer que Bronze debe transformar y borrar campos crudos.',
  },
  'l11-dbt-sqlmesh-dag': {
    id: 'de3-transformacion-01-dbt-sqlmesh-dag',
    moduleId: 'de3-transformacion',
    tracks: ['de'],
    level: 3,
    order: 1,
    title: 'Transformación declarativa con dbt y SQLMesh',
    minutes: 30,
    prerequisites: ['de3-lakehouse-01-iceberg-v3-medallion'],
    hook: 'En Mercado Brisa (empresa ficticia), las transformaciones analíticas vivían en 18 procedimientos almacenados de 2 000 líneas ejecutados por cron a las 03:00. Nadie sabía en qué orden corrían y un filtro incremental `WHERE event_ts > (SELECT MAX(event_ts) FROM destino)` dejó un hueco de seis horas cuando un servicio entregó pedidos con retraso. Al migrar a un grafo declarativo (staging → intermediate → marts) con seguimiento de intervalos por estado, los huecos desaparecieron. ¿Cómo garantizan dbt y SQLMesh transformaciones idempotentes?',
    objectives: [
      'Estructurar un proyecto de transformación en capas modulares: staging (1:1 con fuentes), intermediate y marts.',
      'Reemplazar cargas incrementales ingenuas (`MAX(ts)`) por ventanas con retroceso (lookback) o intervalos de estado.',
      'Utilizar análisis sintáctico SQL y entornos virtuales basados en vistas para validar cambios sin duplicar terabytes.',
    ],
    summary: [
      'Cada modelo declarativo es una sentencia SELECT pura; la herramienta gestiona el DDL y el grafo (DAG).',
      'La capa staging renombra y tipa 1:1 sin agregar ni unir; intermediate aplica reglas; marts expone al negocio.',
      'El patrón WHERE ts > MAX(ts) pierde eventos tardíos si no incluye ventana de retroceso o control por intervalos.',
      'Los entornos virtuales evitan clonar tablas no modificadas al validar un Pull Request.',
    ],
    glossaryTerms: ['c20-sqlmesh-dbt-dag', 'c17-medallion-architecture'],
    flashcards: [
      {
        id: 'fc-de3-dbt-01',
        front: '¿Qué operaciones están permitidas y cuáles deben evitarse en la capa `staging` (`stg_`)?',
        back: 'Permitidas: renombrar columnas, castear tipos, limpiar cadenas y deduplicar 1:1. Evitar: JOINs entre fuentes o agregaciones que cambien el grano.',
      },
      {
        id: 'fc-de3-dbt-02',
        front: '¿Por qué `WHERE event_ts > (SELECT MAX(event_ts) FROM destino)` pierde datos en la vida real?',
        back: 'Porque si un evento con timestamp de las 09:50 llega a las 10:05 después de que ya entró un evento de las 10:00, queda por debajo del MAX y se ignora para siempre.',
      },
      {
        id: 'fc-de3-dbt-03',
        front: '¿Para qué sirve parsear el árbol sintáctico (AST) con SQLGlot antes de ejecutar un modelo en la nube?',
        back: 'Detecta errores de sintaxis, extrae el linaje exacto de columnas y calcula una huella semántica para saber qué modelos aguas abajo se ven afectados.',
      },
    ],
    extraChecks: [
      {
        id: 'c2',
        type: 'mcq',
        prompt: 'Un modelo incremental en dbt procesa pedidos diarios, pero los pagos con tarjeta pueden tardar hasta 48 horas en confirmar su estado final. ¿Cómo configuras el filtro incremental para no perder esas actualizaciones?',
        options: [
          {
            id: 'a',
            text: 'Aplicar una ventana deslizante de retroceso (lookback de 3 días) con estrategia MERGE o DELETE+INSERT por clave única.',
            correct: true,
            feedback: 'Correcto: reprocesar los últimos 3 días con clave única actualiza los pedidos tardíos de forma idempotente.',
          },
          {
            id: 'b',
            text: 'Filtrar únicamente WHERE created_at > (SELECT MAX(created_at) FROM {{ this }}) con modo append.',
            correct: false,
            feedback: 'Incorrecto: append sin retroceso ignora cambios posteriores y si reprocesas duplica filas.',
          },
          {
            id: 'c',
            text: 'Borrar manualmente la tabla en producción cada mañana.',
            correct: false,
            feedback: 'Incorrecto: pierde las ventajas de una carga incremental sobre tablas históricas grandes.',
          },
        ],
        explanation: 'Combinar una clave única (`unique_key`) con una ventana de retroceso (`lookback`) asegura que los eventos retrasados actualicen su registro sin generar duplicados.',
      },
      {
        id: 'c3',
        type: 'mcq',
        prompt: '¿Por qué no se recomienda hacer un `JOIN` directo contra una tabla cruda `raw.orders` desde cinco modelos `mart_` distintos?',
        options: [
          {
            id: 'a',
            text: 'Porque duplica las reglas de limpieza y casteo en cinco sitios; debe existir un único modelo stg_orders como puerta de entrada.',
            correct: true,
            feedback: 'Correcto: centralizar la limpieza en stg_orders garantiza que cualquier cambio en la fuente se corrija en un solo archivo.',
          },
          {
            id: 'b',
            text: 'Porque el motor SQL prohíbe leer el esquema raw más de una vez.',
            correct: false,
            feedback: 'Incorrecto: es una regla de arquitectura y mantenibilidad del grafo, no una limitación del motor SQL.',
          },
          {
            id: 'c',
            text: 'Porque las tablas raw no tienen columnas de texto.',
            correct: false,
            feedback: 'Incorrecto: las tablas raw suelen tener texto y JSON sin tipar, razón por la cual pasan primero por staging.',
          },
        ],
        explanation: 'La relación 1:1 entre fuente cruda y modelo `stg_` aísla al resto del grafo de renombres o cambios de formato en los sistemas transaccionales.',
      },
    ],
    sources: [
      {
        title: 'dbt Labs Best Practices — How We Structure Our dbt Projects (Staging, Intermediate, Marts)',
        url: 'https://docs.getdbt.com/best-practices/how-we-structure/1-guide-overview',
        publisher: 'dbt Labs',
        accessed: '2026-10-29',
        supports: 'Organización modular del DAG en capas staging, intermediate y marts.',
      },
      {
        title: 'dbt Documentation — Configure Incremental Models and Late-Arriving Data',
        url: 'https://docs.getdbt.com/docs/build/incremental-models',
        publisher: 'dbt Labs',
        accessed: '2026-10-29',
        supports: 'Estrategias incrementales (merge, delete+insert) y ventanas de retroceso para eventos tardíos.',
      },
      {
        title: 'SQLMesh Documentation — Virtual Data Environments and Interval State Tracking',
        url: 'https://sqlmesh.readthedocs.io/en/stable/concepts/overview/',
        publisher: 'Tobiko Data',
        accessed: '2026-10-29',
        supports: 'Seguimiento de intervalos procesados y entornos virtuales sin copia de tablas.',
      },
    ],
    aiNotes: 'Insiste en que un modelo `stg_` nunca debe cambiar el grano ni hacer agregaciones, y explica con un ejemplo numérico en una línea temporal por qué `MAX(event_ts)` falla ante retrasos de red.',
  },
  'l12-contracts-semantic-layer': {
    id: 'de3-transformacion-03-contracts-semantic-layer',
    moduleId: 'de3-transformacion',
    tracks: ['de', 'bi'],
    level: 3,
    order: 3,
    title: 'Contratos de datos y capa semántica',
    minutes: 30,
    prerequisites: ['de3-transformacion-01-dbt-sqlmesh-dag'],
    hook: 'En Mercado Brisa (empresa ficticia), durante el cierre trimestral tres áreas presentaron cifras distintas de retención neta de ingresos: Marketing reportó 118 %, Finanzas 104 % y el asistente de consultas 126 %. Al investigar la discrepancia aparecieron dos causas: el microservicio de cobros había cambiado el significado de `status = 2` sin avisar, y cada área mantenía su propia fórmula SQL copiada en reportes locales con un `JOIN` que multiplicaba filas. ¿Cómo evitas ambos fallos con contratos de datos y una capa semántica?',
    objectives: [
      'Definir contratos de datos verificables (esquema, semántica de valores, grano y SLA) entre productores y consumidores.',
      'Bloquear cambios incompatibles en integración continua y desviar registros inválidos mediante corte de circuito.',
      'Centralizar entidades, dimensiones y medidas en una capa semántica que genere SQL libre de fan-out.',
    ],
    summary: [
      'Un contrato de datos formaliza tipos, grano, valores permitidos y SLA entre el productor y el almacén.',
      'Validar el contrato en CI evita que un cambio en backend rompa los pipelines a medianoche.',
      'La capa semántica define cada métrica una sola vez en código versionado para todos los consumidores.',
      'El motor semántico conoce las relaciones entre entidades y pre-agrega antes de unir para impedir fan-out.',
    ],
    glossaryTerms: ['c19-data-contracts-odcs', 'c21-semantic-layer'],
    flashcards: [
      {
        id: 'fc-de3-sem-01',
        front: '¿Qué diferencia un contrato de datos ejecutable de una página de documentación en un wiki?',
        back: 'El contrato ejecutable es un archivo YAML/JSON validado automáticamente en el CI del productor y en la ingesta; un wiki queda desactualizado sin bloquear despliegues.',
      },
      {
        id: 'fc-de3-sem-02',
        front: '¿Qué hace un patrón de corte de circuito (circuit breaker) cuando el 15 % de un lote incumple el contrato?',
        back: 'Detiene la publicación hacia las tablas Silver/Gold, desvía las filas inválidas a cuarentena (dead-letter) y mantiene visible la última versión íntegra.',
      },
      {
        id: 'fc-de3-sem-03',
        front: '¿Cómo evita MetricFlow o Cube el fan-out cuando pides métricas de dos tablas con distinto grano?',
        back: 'Usa el grafo de entidades primarias y foráneas para agregar cada medida a su nivel común en subconsultas separadas antes de combinarlas.',
      },
    ],
    extraChecks: [
      {
        id: 'c2',
        type: 'mcq',
        prompt: 'El equipo de ingeniería de software quiere renombrar la columna `total_cents` a `amount_cents` en el evento de compras que alimenta el almacén.Con un contrato de datos activo en CI, ¿cuándo se detecta este cambio incompatible?',
        options: [
          {
            id: 'a',
            text: 'En el Pull Request del repositorio del servicio productor, antes de desplegar a producción.',
            correct: true,
            feedback: 'Correcto: el chequeo de contrato en CI compara el esquema emitido contra el contrato vigente y bloquea el merge hasta pactar una migración.',
          },
          {
            id: 'b',
            text: 'Tres días después, cuando el director financiero abre el tablero y ve columnas vacías.',
            correct: false,
            feedback: 'Incorrecto: detectar errores en el tablero ejecutivo significa que no existía validación preventiva en la frontera.',
          },
          {
            id: 'c',
            text: 'Nunca, porque las columnas renombradas se corrigen solas en SQL.',
            correct: false,
            feedback: 'Incorrecto: un cambio de nombre sin mapeo explícito rompe las consultas que referencian el identificador anterior.',
          },
        ],
        explanation: 'Desplazar la validación hacia la izquierda (shift-left) en el CI del productor convierte una caída nocturna del pipeline en un aviso inmediato al autor del cambio.',
      },
      {
        id: 'c3',
        type: 'mcq',
        prompt: 'En una capa semántica, defines una métrica de razón `ticket_promedio = revenue / orders_count`. ¿Cómo la calcula el motor cuando un usuario agrupa por `region` y otro agrupa por `trimestre`?',
        options: [
          {
            id: 'a',
            text: 'Evalúa SUM(revenue) / NULLIF(SUM(orders), 0) en el nivel de agrupación solicitado en cada consulta.',
            correct: true,
            feedback: 'Correcto: al declarar numerador y denominador como medidas base, el motor recalcula la razón agregando primero al grano pedido.',
          },
          {
            id: 'b',
            text: 'Guarda un porcentaje precalculado fijo y hace AVG() de ese porcentaje.',
            correct: false,
            feedback: 'Incorrecto: promediar razones precalculadas produce errores matemáticos ante volúmenes desiguales.',
          },
          {
            id: 'c',
            text: 'Obliga a escribir una consulta SQL manual distinta en cada dashboard.',
            correct: false,
            feedback: 'Incorrecto: justamente el propósito de la capa semántica es no repetir la fórmula en cada herramienta.',
          },
        ],
        explanation: 'Declarar métricas compuestas a partir de medidas aditivas base permite que la capa semántica las proyecte en cualquier dimensión respetando la aditividad.',
      },
    ],
    sources: [
      {
        title: 'Bitol / Linux Foundation AI & Data — Open Data Contract Standard (ODCS v3)',
        url: 'https://bitol-io.github.io/open-data-contract-standard/latest/',
        publisher: 'Linux Foundation AI & Data',
        accessed: '2026-10-29',
        supports: 'Especificación abierta de contratos de datos con esquema, reglas de calidad y acuerdos de servicio.',
      },
      {
        title: 'dbt Documentation — Semantic Layer and MetricFlow Semantic Models',
        url: 'https://docs.getdbt.com/docs/build/semantic-models',
        publisher: 'dbt Labs',
        accessed: '2026-10-29',
        supports: 'Definición de entidades, dimensiones y medidas gobernadas en MetricFlow.',
      },
      {
        title: 'Cube Documentation — Data Modeling and Pre-Aggregations in a Semantic Layer',
        url: 'https://cube.dev/docs/product/data-modeling/overview',
        publisher: 'Cube Dev',
        accessed: '2026-10-29',
        supports: 'Prevención de fan-out y exposición uniforme de métricas hacia BI y aplicaciones.',
      },
    ],
    aiNotes: 'Recuerda que esta lección conecta Ingeniería de Datos (contratos en la entrada) y BI (capa semántica en la salida). Evita presentar el contrato como burocracia: es una prueba automática de esquema y rango.',
  },
  'l13-cohorts-retention-ltv': {
    id: 'da3-producto-02-cohorts-retention-ltv',
    moduleId: 'da3-producto',
    tracks: ['da'],
    level: 3,
    order: 2,
    title: 'Cohortes de retención, supervivencia y LTV con margen',
    minutes: 30,
    prerequisites: ['da3-producto-01'],
    hook: 'En Mercado Brisa (empresa ficticia), la dirección celebra que el total de clientes activos crece un 12 % mensual. Sin embargo, al separar a los clientes según su mes de primera compra (cohorte de adquisición), descubres que quienes entraron hace un año seguían comprando al tercer mes en un 68 %, mientras que las cohortes recientes caen al 39 % al tercer mes. El gasto publicitario estaba ocultando un deterioro del producto. ¿Cómo construyes una matriz de retención sin sesgo por censura y calculas el LTV con margen bruto?',
    objectives: [
      'Construir una tabla triangular de retención por cohorte de adquisición en SQL usando DATE_TRUNC y DATE_DIFF.',
      'Excluir las celdas con censura por la derecha (cohortes recientes que aún no cumplen N meses de vida).',
      'Calcular la razón LTV:CAC y el mes de recuperación (payback) multiplicando ingresos por el margen bruto real.',
    ],
    summary: [
      'Una cohorte agrupa usuarios que comparten la fecha de un evento fundador (primera compra o registro).',
      'El crecimiento bruto de usuarios activos puede ocultar una caída severa en la retención de nuevas cohortes.',
      'Promediar el mes N sin filtrar cohortes que aún no cumplieron N meses introduce sesgo por censura.',
      'El LTV debe calcularse sobre margen de contribución neto de costos directos, nunca sobre ingreso bruto.',
    ],
    glossaryTerms: ['c22-cohort-retention-ltv', 'c09-kpi-trees-guardrails'],
    flashcards: [
      {
        id: 'fc-da3-coh-01',
        front: '¿Qué es la censura por la derecha (right censoring) en una matriz de retención por cohortes?',
        back: 'Es el hecho de que las cohortes recientes aún no han vivido los meses futuros (M3, M6); incluirlas como 0 en el promedio hunde artificialmente la retención.',
      },
      {
        id: 'fc-da3-coh-02',
        front: '¿Por qué es peligroso calcular LTV usando ingreso bruto en lugar de margen bruto en un supermercado en línea?',
        back: 'Porque si el margen bruto es del 25 %, usar ingreso bruto infla 4 veces el LTV y lleva a aprobar costos de adquisición (CAC) que generan pérdidas por cada cliente.',
      },
      {
        id: 'fc-da3-coh-03',
        front: '¿Qué diferencia hay entre retención de usuarios (Logo Retention) y retención neta de ingresos (NRR)?',
        back: 'Logo Retention mide el porcentaje de clientes que siguen activos (<= 100 %); NRR mide el ingreso retenido más expansiones de la cohorte (puede superar el 100 %).',
      },
    ],
    extraChecks: [
      {
        id: 'c2',
        type: 'mcq',
        prompt: 'Hoy es `2026-10-15`. Quieres calcular en SQL la retención media al mes 3 (`period_n = 3`) de todas las cohortes mensuales del año. ¿Qué condición `WHERE` evita el sesgo por censura de las cohortes de agosto, septiembre y octubre?',
        options: [
          {
            id: 'a',
            text: "WHERE cohort_month + INTERVAL '3 months' <= DATE_TRUNC('month', CURRENT_DATE)",
            correct: true,
            feedback: 'Correcto: evalúa únicamente las cohortes que ya tuvieron al menos 3 meses completos de calendario para demostrar si retenían o no.',
          },
          {
            id: 'b',
            text: 'Usar COALESCE(retained_users, 0) para todas las cohortes hasta octubre incluido.',
            correct: false,
            feedback: 'Incorrecto: imputar 0 a meses que todavía no han ocurrido en el calendario distorsiona la media hacia abajo.',
          },
          {
            id: 'c',
            text: 'Multiplicar por 2 las cohortes recientes para compensar.',
            correct: false,
            feedback: 'Incorrecto: un factor arbitrario carece de validez estadística.',
          },
        ],
        explanation: 'En análisis de cohortes y supervivencia, una cohorte solo entra en el denominador del periodo k si ha transcurrido al menos el tiempo k desde su inicio.',
      },
      {
        id: 'c3',
        type: 'predict-output',
        prompt: 'En Mercado Brisa, un cliente promedio genera 200 USD de compras acumuladas en 24 meses, el margen bruto después de costo de mercancía y reparto es del 30 %, y el costo de adquisición (CAC) fue de 30 USD. ¿Cuál es la razón `LTV / CAC` real?',
        options: [
          {
            id: 'a',
            text: '2.0x (LTV con margen = 200 × 0.30 = 60 USD; dividido entre CAC de 30 USD = 2.0).',
            correct: true,
            feedback: 'Correcto: el LTV económico es el margen bruto acumulado (60 USD), lo que arroja una relación de 2.0 veces el CAC.',
          },
          {
            id: 'b',
            text: '6.67x (dividiendo los 200 USD de venta bruta entre los 30 USD de CAC).',
            correct: false,
            feedback: 'Incorrecto: ignora que el 70 % de los 200 USD se destina a pagar los productos y la logística.',
          },
          {
            id: 'c',
            text: '0.5x (dividiendo CAC entre LTV).',
            correct: false,
            feedback: 'Incorrecto: invierte el numerador y el denominador de la razón LTV:CAC.',
          },
        ],
        explanation: 'El costo de adquisición se paga con el margen de contribución que deja el cliente tras cubrir el costo de los bienes vendidos y el envío.',
      },
    ],
    sources: [
      {
        title: 'Statsig Documentation — Retention and Cohort Analysis Methodology',
        url: 'https://docs.statsig.com/pulse/retention/',
        publisher: 'Statsig',
        accessed: '2026-10-29',
        supports: 'Cálculo de curvas de retención por cohorte y manejo de ventanas completas de observación.',
      },
      {
        title: 'lifelines Documentation — Survival Analysis and Right-Censored Data (Kaplan-Meier)',
        url: 'https://lifelines.readthedocs.io/en/latest/Survival%20analysis%20with%20lifelines.html',
        publisher: 'Cam Davidson-Pilon',
        accessed: '2026-10-29',
        supports: 'Tratamiento estadístico de observaciones censuradas por la derecha en tiempos de vida.',
      },
      {
        title: 'DuckDB Documentation — Date Functions (date_trunc, date_diff, intervals)',
        url: 'https://duckdb.org/docs/sql/functions/date.html',
        publisher: 'DuckDB Foundation',
        accessed: '2026-10-29',
        supports: 'Funciones de truncamiento y diferencia de fechas para construir matrices de cohortes en SQL.',
      },
    ],
    aiNotes: 'Los dos errores más comunes son incluir cohortes incompletas como ceros en el promedio del mes k y calcular el LTV con ingresos brutos sin descontar el costo de ventas.',
  },
  'l14-ab-testing-cuped': {
    id: 'da3-experimentos-01-ab-testing-cuped',
    moduleId: 'da3-experimentos',
    tracks: ['da'],
    level: 3,
    order: 1,
    title: 'Pruebas A/B, diagnóstico SRM y reducción de varianza CUPED',
    minutes: 30,
    prerequisites: ['da2-inferencia-05'],
    hook: 'En Mercado Brisa (empresa ficticia), producto lanza un pago rápido (variante B) asignando 50 % a control y 50 % a tratamiento. Al tercer día ven que el gasto medio en B es 25.20 USD frente a 24.10 USD en A y piden desplegarlo ya. Al auditar encuentras 50 100 usuarios en A y 47 200 en B, sin tamaño muestral previo. ¿Por qué debes frenar el despliegue y cómo operan SRM y CUPED?',
    objectives: [
      'Ejecutar una prueba chi-cuadrado de bondad de ajuste para detectar Sample Ratio Mismatch (SRM) antes de mirar métricas.',
      'Evitar la inflación de falsos positivos por inspección repetida (peeking) calculando tamaño de muestra o fronteras secuenciales.',
      'Aplicar reducción de varianza CUPED en SQL usando el comportamiento pre-experimental como covariable.',
    ],
    summary: [
      'Si la proporción real de usuarios entre ramas difiere de la esperada (SRM), el experimento es inválido.',
      'Detener un test en cuanto p < 0.05 por primera vez multiplica la tasa de falsos positivos.',
      'CUPED resta la parte del resultado explicada por la métrica pre-experimento sin sesgar el efecto medio.',
      'Reducir la varianza con una covariable correlacionada acorta la duración necesaria del experimento.',
    ],
    glossaryTerms: ['c23-srm-ab-testing', 'c24-cuped-variance'],
    flashcards: [
      {
        id: 'fc-da3-ab-01',
        front: '¿Qué indica un p-valor < 0.001 en una prueba de Sample Ratio Mismatch (SRM)?',
        back: 'Que la asignación o el registro de telemetría entre Control y Tratamiento está sesgado; las métricas del experimento no deben interpretarse.',
      },
      {
        id: 'fc-da3-ab-02',
        front: '¿Qué requisito debe cumplir la covariable X en CUPED para no introducir sesgo en la estimación del tratamiento?',
        back: 'Debe medirse estrictamente ANTES de la asignación al experimento (o ser completamente independiente del tratamiento) para que E[X_B] = E[X_A].',
      },
      {
        id: 'fc-da3-ab-03',
        front: '¿Cuánto se reduce la varianza de Y_cuped si la correlación entre la métrica pre y post experimento es r = 0.8?',
        back: 'La varianza se multiplica por (1 - r²) = (1 - 0.64) = 0.36, es decir, una reducción del 64 % en la varianza (y en el tamaño muestral requerido).',
      },
    ],
    extraChecks: [
      {
        id: 'c2',
        type: 'mcq',
        prompt: 'Diseñas un experimento 50/50 y tras una semana observas 100 000 usuarios en Control y 96 500 en Tratamiento (p-valor de chi-cuadrado = 0.00001). Sin embargo, el ingreso por usuario en Tratamiento parece un 4 % mayor. ¿Qué decisión debes tomar?',
        options: [
          {
            id: 'a',
            text: 'Invalidar el análisis causal, declarar alerta de SRM y buscar el bug técnico (por ejemplo, fallos de carga en navegadores lentos de la rama B).',
            correct: true,
            feedback: 'Correcto: con SRM confirmado, las dos ramas ya no son comparables porque faltan selectivamente ciertos perfiles de usuarios.',
          },
          {
            id: 'b',
            text: 'Ignorar la diferencia de conteos porque el ingreso por usuario divide entre N y corrige el tamaño de muestra.',
            correct: false,
            feedback: 'Incorrecto: si los usuarios que se perdieron en B eran los de conexiones más lentas o menor gasto, el promedio de los que quedan queda sesgado al alza.',
          },
          {
            id: 'c',
            text: 'Borrar al azar 3 500 usuarios de Control para igualar los conteos.',
            correct: false,
            feedback: 'Incorrecto: eliminar usuarios al azar en Control no corrige el sesgo de selección no aleatorio que ocurrió en Tratamiento.',
          },
        ],
        explanation: 'Un fallo de SRM demuestra que el mecanismo de aleatorización o captura perdió sujetos de manera asimétrica, rompiendo el supuesto de independencia del experimento.',
      },
      {
        id: 'c3',
        type: 'mcq',
        prompt: 'Quieres aplicar CUPED sobre el gasto durante los 14 días del experimento ($Y$). ¿Cuál de las siguientes variables es una covariable $X$ válida?',
        options: [
          {
            id: 'a',
            text: 'El gasto del mismo usuario durante los 14 días inmediatamente anteriores al inicio del experimento.',
            correct: true,
            feedback: 'Correcto: al haberse registrado antes de asignar la variante, tiene alta correlación con Y y su media poblacional es idéntica entre ramas.',
          },
          {
            id: 'b',
            text: 'El número de sesiones del usuario durante la semana del experimento.',
            correct: false,
            feedback: 'Incorrecto: las sesiones durante el experimento pueden verse afectadas por la variante B; usarlas como covariable distorsiona el efecto.',
          },
          {
            id: 'c',
            text: 'Un número aleatorio generado en el momento de la consulta.',
            correct: false,
            feedback: 'Incorrecto: una variable con correlación r = 0 con Y produce (1 - r²) = 1 y no reduce nada la varianza.',
          },
        ],
        explanation: 'La eficacia de CUPED proviene de elegir la misma métrica medida en la ventana inmediata previa a la aleatorización, donde la correlación con el resultado es máxima.',
      },
    ],
    sources: [
      {
        title: 'Deng, Xu, Kohavi & Walker (WSDM 2013) — Improving the Sensitivity of Online Controlled Experiments by Utilizing Pre-Experiment Data (CUPED)',
        url: 'https://exp-platform.com/Documents/2013-02-CUPED-ImprovingSensitivityOfControlledExperiments.pdf',
        publisher: 'Microsoft Research / Experimentation Platform',
        accessed: '2026-10-29',
        supports: 'Derivación matemática del estimador CUPED y factor de reducción de varianza (1 - r²).',
      },
      {
        title: 'Fabijan et al. (KDD 2019) — Diagnosing Sample Ratio Mismatch in Online Controlled Experiments',
        url: 'https://exp-platform.com/srm/',
        publisher: 'Experimentation Platform',
        accessed: '2026-10-29',
        supports: 'Taxonomía de causas técnicas de Sample Ratio Mismatch y protocolo de diagnóstico con chi-cuadrado.',
      },
      {
        title: 'Statsig Documentation — CUPED Variance Reduction and Sequential Testing',
        url: 'https://docs.statsig.com/stats-engine/methodologies/cuped',
        publisher: 'Statsig',
        accessed: '2026-10-29',
        supports: 'Aplicación práctica de ajuste por covariables pre-experimentales y control de falsos positivos.',
      },
    ],
    aiNotes: 'Recalca los dos errores graves en pruebas A/B: mirar el p-valor cada mañana para detener el test cuando baja de 0.05 (peeking) y usar una covariable medida después del inicio del test en CUPED.',
  },
  'l15-bi-tufte-code': {
    id: 'bi3-dashboards-01-bi-tufte-code',
    moduleId: 'bi3-dashboards',
    tracks: ['bi'],
    level: 3,
    order: 1,
    title: 'Percepción visual, razón dato-tinta y reportes como código',
    minutes: 30,
    prerequisites: ['c1-viz-01'],
    hook: 'En Mercado Brisa (empresa ficticia), el tablero semanal que recibe la dirección contiene siete gráficos de pastel en 3D, velocímetros que ocupan media pantalla para mostrar una sola cifra sin contexto histórico, 14 colores saturados y títulos pasivos como `"Gráfico de ventas por tienda"`. Además, cada vez que alguien edita un filtro en la herramienta visual, nadie sabe quién lo cambió ni por qué contradice al repositorio SQL. ¿Cómo rediseñas el tablero aplicando principios perceptuales y reportes versionados en Git?',
    objectives: [
      'Seleccionar codificaciones visuales según la jerarquía de precisión perceptual de Cleveland y McGill (posición sobre ángulo o área).',
      'Maximizar la razón dato-tinta de Tufte eliminando ruido visual y aplicando color semántico de alerta con referencias explícitas.',
      'Construir reportes declarativos en código (Markdown + SQL parametrizado) versionados en Git con pruebas de CI.',
    ],
    summary: [
      'El ojo humano compara longitudes en una base común con mucha más precisión que ángulos de un pastel.',
      'Cada elemento visual debe representar datos reales; elimina bordes redundantes, fondos pesados y efectos 3D.',
      'Una cifra aislada no informa: acompáñala siempre de comparación temporal, objetivo y estado.',
      'Definir reportes como código en Git permite revisar cambios en Pull Requests y detectar consultas rotas.',
    ],
    glossaryTerms: ['c25-tufte-visual-perception', 'c21-semantic-layer'],
    flashcards: [
      {
        id: 'fc-bi3-viz-01',
        front: 'Según la jerarquía de Cleveland y McGill, ¿por qué un gráfico de barras horizontales supera a un gráfico de pastel para comparar 8 categorías?',
        back: 'Porque la posición a lo largo de una escala común se juzga con mucha menor tasa de error perceptual que los ángulos o las áreas.',
      },
      {
        id: 'fc-bi3-viz-02',
        front: '¿Qué propone la regla del uso intencional del color en un tablero operativo?',
        back: 'Mantener el 90 % de las series contextuales en tonos neutros y reservar el color de acento o semántico solo para las anomalías o metas incumplidas.',
      },
      {
        id: 'fc-bi3-viz-03',
        front: '¿Qué es un título activo (Action Title) en la parte superior de un gráfico ejecutivo?',
        back: 'Un encabezado que enuncia el hallazgo cuantitativo ("El margen cayó 180 pb en Norte por costo de flete") en vez de describir los ejes ("Margen por región").',
      },
    ],
    extraChecks: [
      {
        id: 'c2',
        type: 'mcq',
        prompt: 'Quieres mostrar la evolución mensual de ventas de las 12 categorías de supermercado durante los últimos 24 meses. Un único gráfico con 12 líneas de colores cruzándose resulta ilegible. ¿Qué diseño resuelve el problema sin ocultar datos?',
        options: [
          {
            id: 'a',
            text: 'Múltiplos pequeños (small multiples): una cuadrícula de 12 minigráficos con escalas compartidas, destacando cada categoría en primer plano contra las demás en gris suave.',
            correct: true,
            feedback: 'Correcto: separar las series en paneles alineados elimina el cruce de líneas (spaghetti chart) y permite comparar tendencias al instante.',
          },
          {
            id: 'b',
            text: 'Un gráfico de pastel 3D con 12*24 = 288 rebanadas.',
            correct: false,
            feedback: 'Incorrecto: 288 ángulos en un círculo son perceptualmente imposibles de leer.',
          },
          {
            id: 'c',
            text: 'Usar 12 ejes verticales (Y) distintos en el mismo gráfico.',
            correct: false,
            feedback: 'Incorrecto: múltiples ejes Y con distintas escalas inducen cruces falsos y confunden al lector.',
          },
        ],
        explanation: 'Los múltiplos pequeños aprovechan la constancia de diseño: el lector aprende los ejes una sola vez y escanea visualmente las diferencias entre categorías.',
      },
      {
        id: 'c3',
        type: 'mcq',
        prompt: '¿Qué ventaja operativa aporta gestionar un reporte en herramientas BI-as-Code (como Evidence o Power BI Projects `.pbip` en Git) frente a editar un archivo binario cerrado en producción?',
        options: [
          {
            id: 'a',
            text: 'Permite revisar en un Pull Request qué consulta o métrica cambió, ejecutar CI para comprobar que ninguna columna fue eliminada y revertir con git revert.',
            correct: true,
            feedback: 'Correcto: integra la capa de visualización en el mismo ciclo de control de versiones y pruebas automáticas que los modelos de datos.',
          },
          {
            id: 'b',
            text: 'Hace que las bases de datos no necesiten índices ni particiones.',
            correct: false,
            feedback: 'Incorrecto: el control de versiones del reporte no sustituye la optimización física del almacén.',
          },
          {
            id: 'c',
            text: 'Impide usar filtros interactivos en el navegador.',
            correct: false,
            feedback: 'Incorrecto: los reportes declarativos compilan componentes interactivos con parámetros y filtros en el cliente.',
          },
        ],
        explanation: 'Tratar los reportes como código fuente en texto plano cierra la brecha entre los modelos de transformación y las pantallas que consume el negocio.',
      },
    ],
    sources: [
      {
        title: 'Cleveland & McGill (JASA 1984) — Graphical Perception: Theory, Experimentation, and Application to the Development of Graphical Methods',
        url: 'https://www.jstor.org/stable/2288400',
        publisher: 'Journal of the American Statistical Association',
        accessed: '2026-10-29',
        supports: 'Jerarquía experimental de precisión en la percepción de atributos gráficos.',
      },
      {
        title: 'Evidence Documentation — BI as Code with Markdown and Parameterized SQL',
        url: 'https://docs.evidence.dev/',
        publisher: 'Evidence',
        accessed: '2026-10-29',
        supports: 'Construcción de reportes declarativos versionados en Git con consultas SQL y DuckDB.',
      },
      {
        title: 'Observable Framework Documentation — Data Loaders and Static Report Generation',
        url: 'https://observablehq.com/framework/',
        publisher: 'Observable',
        accessed: '2026-10-29',
        supports: 'Arquitectura de cargadores de datos precompilados y tableros rápidos en código.',
      },
    ],
    aiNotes: 'Evita que el alumno piense que el diseño de tableros es cuestión de gusto estético subjetivo: fundamenta cada corrección en carga cognitiva, precisión de comparación de longitudes y presencia de una referencia explícita.',
  },
  'l16-cdc-kafka-streaming': {
    id: 'de4-streaming-01-cdc-kafka-streaming',
    moduleId: 'de4-streaming',
    tracks: ['de'],
    level: 4,
    order: 1,
    title: 'Captura de cambios (CDC) con Debezium y Kafka',
    minutes: 30,
    prerequisites: ['de3-lakehouse-01-iceberg-v3-medallion'],
    hook: 'En Mercado Brisa (empresa ficticia), un script extraía pedidos ejecutando `SELECT * FROM orders WHERE updated_at >= NOW() - INTERVAL \'1 minute\'` cada 30 segundos contra la base PostgreSQL primaria. Durante un día de ofertas, esa consulta saturó el disco de producción y además 1 400 pedidos fraudulentos eliminados con `DELETE` físico nunca desaparecieron del almacén analítico, inflando las ventas en 210 000 USD. ¿Cómo capturas inserciones, actualizaciones y borrados sin consultar las tablas de producción?',
    objectives: [
      'Reemplazar la extracción por consulta (query-based polling) por captura de cambios basada en el log transaccional (WAL) con Debezium.',
      'Interpretar la estructura de un evento CDC (`op: c, u, d, r`, estados `before` y `after`) para propagar borrados físicos.',
      'Evitar el problema de escrituras dobles (dual writes) aplicando el patrón Transactional Outbox.',
    ],
    summary: [
      'El polling por updated_at sobrecarga la base primaria y es ciego ante borrados físicos (DELETE).',
      'Debezium lee el registro transaccional (WAL/binlog) de forma secuencial sin bloquear las tablas.',
      'El patrón Transactional Outbox guarda el cambio y el evento en la misma transacción ACID local.',
      'El almacenamiento por niveles en Kafka separa el cómputo de los brokers del historial en S3.',
    ],
    glossaryTerms: ['c26-bi-as-code', 'c18-iceberg-v3'],
    flashcards: [
      {
        id: 'fc-de4-cdc-01',
        front: '¿Cuáles son las dos fallas técnicas del polling por `WHERE updated_at > ...` frente al CDC basado en el WAL?',
        back: '1) Impone carga de lectura repetida sobre el motor OLTP y 2) no detecta filas eliminadas con DELETE físico (no dejan updated_at).',
      },
      {
        id: 'fc-de4-cdc-02',
        front: '¿Qué resuelve el patrón Transactional Outbox en un microservicio?',
        back: 'Evita la escritura doble inconsistente (guardar en Postgres y publicar en Kafka por separado); escribe ambos en la misma transacción de base de datos y CDC publica la tabla outbox.',
      },
      {
        id: 'fc-de4-cdc-03',
        front: '¿Qué representan los códigos `op` = `c`, `u`, `d`, `r` en un mensaje de Debezium?',
        back: 'c = create (INSERT), u = update (UPDATE con before y after), d = delete (DELETE con los datos previos en before), r = read (snapshot inicial).',
      },
    ],
    extraChecks: [
      {
        id: 'c2',
        type: 'mcq',
        prompt: 'Un microservicio de pagos ejecuta `db.save(payment)` y en la línea siguiente `kafka.send(event)`. Si la base de datos confirma el commit pero el proceso muere por un corte de red un milisegundo antes de `kafka.send()`, ¿qué ocurre?',
        options: [
          {
            id: 'a',
            text: 'El pago queda cobrado en la base de datos pero el evento jamás llega a Kafka, dejando inconsistentes a todos los sistemas aguas abajo.',
            correct: true,
            feedback: 'Correcto: dos sistemas externos no comparten una transacción atómica sin un patrón como Transactional Outbox.',
          },
          {
            id: 'b',
            text: 'PostgreSQL hace rollback automático cuando nota que Kafka no recibió el mensaje.',
            correct: false,
            feedback: 'Incorrecto: una vez ejecutado el COMMIT en PostgreSQL, la base de datos desconoce qué haga la aplicación con la red.',
          },
          {
            id: 'c',
            text: 'Kafka adivina el pago leyendo la memoria del contenedor caído.',
            correct: false,
            feedback: 'Incorrecto: Kafka solo almacena los mensajes que el productor logró enviar y confirmar por red.',
          },
        ],
        explanation: 'El problema de la escritura doble se elimina insertando el registro de negocio y el mensaje en una tabla `outbox` dentro del mismo `BEGIN ... COMMIT` y dejando que Debezium lea el WAL.',
      },
      {
        id: 'c3',
        type: 'mcq',
        prompt: 'Al aplicar un flujo CDC sobre una tabla destino en el almacén mediante `MERGE INTO`, ¿qué acción debe disparar un registro cuyo campo `op` es `"d"`?',
        options: [
          {
            id: 'a',
            text: 'Eliminar la fila en el destino (WHEN MATCHED AND src.op = \'d\' THEN DELETE) o marcarla como borrada usando la clave de `before`.',
            correct: true,
            feedback: 'Correcto: en un evento de borrado, `after` es nulo y la clave primaria que debe eliminarse viaja en el objeto `before` o en la key del mensaje.',
          },
          {
            id: 'b',
            text: 'Ignorar el mensaje porque `after` viene en NULL.',
            correct: false,
            feedback: 'Incorrecto: ignorar los eventos op = "d" deja filas fantasma en el almacén que ya fueron borradas en producción.',
          },
          {
            id: 'c',
            text: 'Insertar una fila con todas las columnas en NULL.',
            correct: false,
            feedback: 'Incorrecto: ensuciaría la tabla destino con registros vacíos en lugar de retirar la entidad eliminada.',
          },
        ],
        explanation: 'En Debezium, los eventos de borrado (`op = "d"`) llevan `after: null` y conservan en `before` (y en la clave del mensaje Kafka) el identificador necesario para propagar la baja.',
      },
    ],
    sources: [
      {
        title: 'Debezium Official Documentation — Architecture and PostgreSQL Connector (WAL Logical Decoding)',
        url: 'https://debezium.io/documentation/reference/stable/architecture.html',
        publisher: 'Debezium / Red Hat',
        accessed: '2026-10-29',
        supports: 'Lectura del registro de transacciones y estructura de sobres de eventos CDC (before, after, op).',
      },
      {
        title: 'Debezium Documentation — Outbox Event Router Pattern',
        url: 'https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html',
        publisher: 'Debezium / Red Hat',
        accessed: '2026-10-29',
        supports: 'Implementación del patrón Transactional Outbox para evitar escrituras dobles.',
      },
      {
        title: 'Apache Kafka Documentation — Tiered Storage and Log Compaction',
        url: 'https://kafka.apache.org/documentation/#tiered_storage',
        publisher: 'Apache Software Foundation',
        accessed: '2026-10-29',
        supports: 'Separación de almacenamiento local en brokers y retención histórica en almacenamiento de objetos.',
      },
    ],
    aiNotes: 'Asegúrate de que el alumno distinga por qué en un evento `op = "d"` el bloque `after` viene en `null` (por lo que en SQL debe tomarse el ID con `COALESCE(after.id, before.id)`).',
  },
  'l17-flink-watermarks-mv': {
    id: 'de4-streaming-03-flink-watermarks-mv',
    moduleId: 'de4-streaming',
    tracks: ['de'],
    level: 4,
    order: 3,
    title: 'Tiempo de evento y watermarks en Apache Flink',
    minutes: 30,
    prerequisites: ['de4-streaming-01-cdc-kafka-streaming'],
    hook: 'En Mercado Brisa (empresa ficticia), un repartidor confirma una entrega en la app a las `11:59:42` en un túnel sin señal. A las `12:03:10` recupera cobertura y el teléfono sincroniza el evento. El tablero que agrupaba por hora de recepción (`Processing Time`) reportó una caída falsa a las 11:59. Además, un trabajo de Flink que unía pedidos y entregas sin límite temporal agotó los 64 GB de disco en cuatro días. ¿Cómo gobiernas el desorden y el estado?',
    objectives: [
      'Distinguir entre tiempo de evento (Event Time) y tiempo de procesamiento (Processing Time) ante retrasos de red.',
      'Configurar watermarks de desorden acotado (bounded out-of-orderness), tolerancia de retraso y salidas laterales.',
      'Acotar el estado en RocksDB mediante Interval Joins o tiempo de vida (State TTL) para evitar fugas de memoria.',
    ],
    summary: [
      'El tiempo de evento mide cuándo ocurrió el hecho; el tiempo de procesamiento mide cuándo llegó al servidor.',
      'Un watermark W(t) declara que el motor asume haber recibido los eventos con marca menor o igual a t.',
      'Una partición inactiva detiene el avance del watermark global si no se configura detección de inactividad.',
      'Todo JOIN o agregación en streaming sin cota temporal acumula estado indefinidamente hasta agotar el disco.',
    ],
    glossaryTerms: ['c27-cdc-flink-watermarks', 'c26-bi-as-code'],
    flashcards: [
      {
        id: 'fc-de4-flk-01',
        front: '¿Cómo calcula Flink el watermark de un operador que consume de 16 particiones de Kafka en paralelo?',
        back: 'Toma el MÍNIMO de los watermarks de las 16 particiones de entrada, porque el reloj global solo puede avanzar al ritmo de la fuente más atrasada.',
      },
      {
        id: 'fc-de4-flk-02',
        front: '¿Por qué un `LEFT JOIN` estándar sin ventana temporal en Flink termina agotando el disco de estado (RocksDB)?',
        back: 'Porque para saber si algún día futuro llegará una pareja para una fila izquierda, Flink tendría que conservar todas las filas en estado para siempre.',
      },
      {
        id: 'fc-de4-flk-03',
        front: '¿Qué ocurre con un evento cuyo timestamp es anterior al watermark actual cuando ya expiró también el `allowedLateness`?',
        back: 'No se descarta en silencio si configuras un Side Output (salida lateral): se envía a un flujo separado para conciliación o alerta.',
      },
    ],
    extraChecks: [
      {
        id: 'c2',
        type: 'mcq',
        prompt: 'Configuras un watermark con retraso máximo de 2 minutos (`maxOutOfOrderness = 2 min`). Si el evento más reciente observado en la partición tiene timestamp `14:10:00`, ¿qué valor tiene el watermark emitido y qué ventanas horarias pueden cerrarse?',
        options: [
          {
            id: 'a',
            text: 'El watermark vale 14:08:00; puede cerrarse cualquier ventana cuyo fin sea menor o igual a 14:08:00 (por ejemplo, la de 13:00 a 14:00).',
            correct: true,
            feedback: 'Correcto: W(t) = max(event_time) - 2 minutos = 14:08:00, lo que garantiza el cierre de toda ventana anterior a esa marca.',
          },
          {
            id: 'b',
            text: 'El watermark vale 14:12:00 (suma 2 minutos al reloj).',
            correct: false,
            feedback: 'Incorrecto: el watermark retrocede respecto al máximo observado para dar margen a los eventos rezagados.',
          },
          {
            id: 'c',
            text: 'El watermark toma la hora del reloj de la máquina del servidor.',
            correct: false,
            feedback: 'Incorrecto: en modo Event Time el watermark depende de los timestamps contenidos en los datos, no del reloj del sistema.',
          },
        ],
        explanation: 'Restar un margen de tolerancia al timestamp máximo observado ofrece una espera controlada para absorber el desorden de red antes de emitir el cierre de la ventana.',
      },
      {
        id: 'c3',
        type: 'mcq',
        prompt: 'En Flink SQL necesitas unir cada pedido con su pago correspondiente sabiendo que el pago ocurre como máximo hasta 30 minutos después del pedido. ¿Qué construcción evita que el estado crezca sin límite?',
        options: [
          {
            id: 'a',
            text: 'Un Interval Join añadiendo en el ON: p.pay_ts BETWEEN o.order_ts AND o.order_ts + INTERVAL \'30\' MINUTE.',
            correct: true,
            feedback: 'Correcto: con cotas inferior y superior de tiempo de evento, Flink purga automáticamente de RocksDB los pedidos cuando el watermark supera los 30 minutos.',
          },
          {
            id: 'b',
            text: 'Un JOIN sin condición temporal y reiniciar el clúster cada sábado.',
            correct: false,
            feedback: 'Incorrecto: reiniciar borrando estado pierde los cruces en vuelo y no resuelve el crecimiento ilimitado.',
          },
          {
            id: 'c',
            text: 'Desactivar los checkpoints de tolerancia a fallos.',
            correct: false,
            feedback: 'Incorrecto: el estado local sigue creciendo en memoria y disco aunque no se copien snapshots a almacenamiento remoto.',
          },
        ],
        explanation: 'Los Interval Joins permiten a Flink calcular exactamente hasta qué marca de watermark debe retener cada fila en RocksDB antes de descartarla con seguridad.',
      },
    ],
    sources: [
      {
        title: 'Apache Flink Official Documentation — Event Time and Generating Watermarks',
        url: 'https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/time/',
        publisher: 'Apache Software Foundation',
        accessed: '2026-10-29',
        supports: 'Semántica de Event Time, propagación de watermarks entre particiones y manejo de fuentes inactivas.',
      },
      {
        title: 'Apache Flink Documentation — Streaming SQL Joins and Interval Joins',
        url: 'https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/table/sql/queries/joins/',
        publisher: 'Apache Software Foundation',
        accessed: '2026-10-29',
        supports: 'Control del tamaño del estado en cruces de flujos mediante Interval Joins y State TTL.',
      },
      {
        title: 'Akidau et al. (VLDB 2015) — The Dataflow Model: A Practical Approach to Balancing Correctness, Latency, and Cost',
        url: 'https://research.google/pubs/the-dataflow-model-a-practical-approach-to-balancing-correctness-latency-and-cost-in-massive-scale-unbounded-out-of-order-data-processing/',
        publisher: 'Google Research / VLDB',
        accessed: '2026-10-29',
        supports: 'Modelo formal de ventanas, watermarks, disparadores y acumulación sobre datos no acotados.',
      },
    ],
    aiNotes: 'El concepto que más cuesta visualizar es por qué una sola partición silenciosa congela todo el trabajo de Flink (regla del mínimo watermark). Usa el ejemplo de 16 filas de espera donde el reloj común marca la hora del más atrasado.',
  },
  'l18-mcp-semantic-ai-rag': {
    id: 'x4-ia-datos-01-mcp-semantic-ai-rag',
    moduleId: 'x4-ia-datos',
    tracks: ['core'],
    level: 4,
    order: 1,
    title: 'Servidores MCP, capa semántica y RAG híbrido',
    minutes: 30,
    prerequisites: ['de3-transformacion-03-contracts-semantic-layer'],
    hook: 'En Mercado Brisa (empresa ficticia), un equipo conectó un modelo de lenguaje directamente a las 450 tablas crudas del almacén para responder preguntas en lenguaje natural. Cuando finanzas preguntó por la retención neta del segmento mayorista en el tercer trimestre, el modelo escribió un `JOIN` directo entre `raw.customers` y `raw.invoices` sin filtrar facturas anuladas ni cuentas de prueba, provocando un fan-out y respondiendo `184.2 %` cuando el valor real era `116.4 %`. ¿Cómo diseñas un sistema de IA sobre datos usando servidores MCP, capa semántica y evaluaciones deterministas?',
    objectives: [
      'Sustituir la generación libre de SQL sobre tablas crudas por llamadas gobernadas a la capa semántica a través de un servidor MCP.',
      'Combinar búsqueda léxica (BM25) y vectorial (HNSW) mediante Reciprocal Rank Fusion (RRF) para recuperar definiciones y esquemas.',
      'Construir un conjunto de evaluación (evals) que compare el resultado numérico devuelto contra consultas SQL de referencia.',
    ],
    summary: [
      'Pedir a un LLM que escriba JOINs sobre tablas crudas sin contexto semántico produce errores de grano y filtros.',
      'El protocolo MCP expone herramientas tipadas de solo lectura hacia el catálogo y la capa semántica.',
      'La recuperación híbrida (BM25 + vectores con fusión RRF) localiza tanto nombres exactos de columnas como conceptos.',
      'Un sistema de IA de datos se audita con un conjunto de preguntas y resultados de referencia antes de cada despliegue.',
    ],
    glossaryTerms: ['c28-mcp-semantic-rag-evals', 'c21-semantic-layer'],
    flashcards: [
      {
        id: 'fc-x4-mcp-01',
        front: '¿Por qué es más fiable que un agente invoque `query_semantic_layer(metrics, dimensions)` en vez de generar SQL libre sobre tablas crudas?',
        back: 'Porque el motor semántico ya tiene codificadas las fórmulas auditadas, los filtros de exclusión y las pre-agregaciones contra fan-out.',
      },
      {
        id: 'fc-x4-mcp-02',
        front: '¿Por qué la búsqueda híbrida (BM25 + Embeddings con RRF) supera a la búsqueda vectorial pura al buscar metadatos de tablas?',
        back: 'Porque los embeddings capturan sinónimos conceptuales, pero BM25 es exacto para identificadores técnicos literales como `sku_id_v2` o códigos de error.',
      },
      {
        id: 'fc-x4-mcp-03',
        front: '¿Por qué una instrucción en el prompt del sistema ("No leas la tabla de salarios") NO es un control de seguridad válido?',
        back: 'Porque es vulnerable a inyección de prompts; la seguridad real exige credenciales de base de datos de solo lectura, RLS y vistas restringidas en el servidor.',
      },
    ],
    extraChecks: [
      {
        id: 'c2',
        type: 'mcq',
        prompt: 'Un usuario busca en el catálogo la columna exacta `cust_tax_id_mx`. La búsqueda solo por embeddings vectoriales devuelve columnas genéricas de clientes pero no acierta el identificador exacto. ¿Qué componente soluciona este fallo?',
        options: [
          {
            id: 'a',
            text: 'Combinar búsqueda léxica BM25 con búsqueda vectorial mediante Reciprocal Rank Fusion (RRF).',
            correct: true,
            feedback: 'Correcto: BM25 puntúa alto las coincidencias exactas de tokens raros como cust_tax_id_mx y RRF fusiona ambos rankings.',
          },
          {
            id: 'b',
            text: 'Subir la temperatura del modelo generativo a 1.5.',
            correct: false,
            feedback: 'Incorrecto: aumentar la temperatura incrementa la aleatoriedad de la respuesta, no la precisión del recuperador.',
          },
          {
            id: 'c',
            text: 'Eliminar los nombres de columnas de la base de datos.',
            correct: false,
            feedback: 'Incorrecto: empeoraría tanto la recuperación como la generación de consultas.',
          },
        ],
        explanation: 'En catálogos de datos coexisten preguntas conceptuales ("abandono de clientes") y términos literales ("col_churn_30d"), por lo que la fusión híbrida BM25 + HNSW es el estándar.',
      },
      {
        id: 'c3',
        type: 'mcq',
        prompt: 'Antes de actualizar el modelo o el prompt de tu agente de consultas, ejecutas tu suite de 100 preguntas de referencia (evals). ¿Qué criterio verifica realmente que la respuesta del agente es matemáticamente correcta?',
        options: [
          {
            id: 'a',
            text: 'Ejecutar la consulta generada en un entorno de prueba y comparar el DataFrame resultante (filas y valores con tolerancia numérica) contra la consulta de referencia.',
            correct: true,
            feedback: 'Correcto: dos consultas SQL escritas de forma distinta son equivalentes si producen exactamente el mismo resultado sobre el dataset de prueba.',
          },
          {
            id: 'b',
            text: 'Comprobar únicamente con `===` si el texto SQL generado es idéntico carácter por carácter al SQL de referencia.',
            correct: false,
            feedback: 'Incorrecto: una consulta puede usar un alias distinto o una CTE equivalente y dar el resultado exacto aunque el string difiera.',
          },
          {
            id: 'c',
            text: 'Preguntarle al mismo modelo si cree que su respuesta suena convincente.',
            correct: false,
            feedback: 'Incorrecto: un LLM puede validar como "convincente" un número que proviene de un JOIN con fan-out.',
          },
        ],
        explanation: 'La evaluación por ejecución (execution accuracy) sobre datos controlados verifica la exactitud del resultado final sin penalizar variaciones sintácticas válidas.',
      },
    ],
    sources: [
      {
        title: 'Model Context Protocol (MCP) Official Specification — Architecture, Resources, and Tools',
        url: 'https://modelcontextprotocol.io/specification/2025-03-26',
        publisher: 'Model Context Protocol Project',
        accessed: '2026-10-29',
        supports: 'Arquitectura cliente-servidor MCP y exposición segura de herramientas tipadas hacia modelos.',
      },
      {
        title: 'Cormack, Clarke & Buettcher (SIGIR 2009) — Reciprocal Rank Fusion Outperforms Condorcet and Individual Rank Learning Methods',
        url: 'https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf',
        publisher: 'ACM SIGIR',
        accessed: '2026-10-29',
        supports: 'Fórmula de fusión de rankings RRF para combinar recuperadores léxicos y vectoriales.',
      },
      {
        title: 'Yu et al. / Yale LILY Lab — Spider & BIRD Text-to-SQL Execution Accuracy Benchmarks',
        url: 'https://bird-bench.github.io/',
        publisher: 'HKU / DAMO Academy',
        accessed: '2026-10-29',
        supports: 'Metodología de evaluación de agentes SQL mediante exactitud de ejecución frente a consultas de referencia.',
      },
    ],
    aiNotes: 'Insiste en dos principios: un LLM nunca debe conectarse con permisos de escritura o sin capa semántica a tablas crudas, y el prompt del sistema no sustituye a los permisos del motor de base de datos.',
  },
};

function slugifyHeading(text, fallbackIndex) {
  const base = String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return base || `seccion-${fallbackIndex + 1}`;
}

function buildRoleNoteString(roleBlock) {
  if (!roleBlock || !Array.isArray(roleBlock.points)) return undefined;
  let joined = roleBlock.points.join(' ').trim();
  if (countWords(joined) > 70) {
    // Tomamos los dos primeros puntos si los tres superan 70 palabras
    joined = roleBlock.points.slice(0, 2).join(' ').trim();
  }
  return joined;
}

function transformLesson(legacy) {
  const meta = LESSON_META[legacy.id];
  if (!meta) {
    throw new Error(`No se encontró configuración de migración para "${legacy.id}"`);
  }

  const sections = (legacy.sections || []).map((sec, idx) => {
    const rawHeading = String(sec.heading || '').replace(/^\d+\.\s*/, '').trim();
    const overrideKey = `${legacy.id}:${idx}`;
    const heading = HEADING_OVERRIDES[overrideKey] || rawHeading;
    const rawBody = String(sec.body || '').trim();
    const body = BODY_EXPANSIONS[overrideKey] ? `${rawBody}${BODY_EXPANSIONS[overrideKey]}` : rawBody;

    const sectionObj = {
      id: slugifyHeading(heading, idx),
      heading,
      body,
    };

    if (idx === 0 && legacy.visualType) {
      sectionObj.interactive = {
        component: legacy.visualType,
        caption: `Simulador interactivo: ${meta.title}`,
      };
    }

    if (idx === 1 && legacy.playground?.goodQuery) {
      sectionObj.example = {
        language: 'sql',
        code: legacy.playground.goodQuery,
        expectedOutput: Array.isArray(legacy.playground.goodResult)
          ? legacy.playground.goodResult
          : [],
      };
    }

    return sectionObj;
  });

  const pg = legacy.playground || {};
  const workedExample = {
    title: pg.title || `Ejemplo guiado: ${meta.title}`,
    description: pg.description || '',
    audit: pg.audit || '',
    steps: [
      {
        label: pg.badQueryLabel || 'Enfoque con fallo común',
        explanation:
          pg.description ||
          'Observa primero qué ocurre cuando se ejecuta la consulta o diseño sin controlar el grano ni los invariantes.',
        code: pg.badQuery || '',
        expectedOutput: Array.isArray(pg.badResult) ? pg.badResult : [],
      },
      {
        label: pg.goodQueryLabel || 'Solución verificada',
        explanation:
          pg.audit ||
          'Compara ahora la consulta corregida y verifica cómo las filas y totales coinciden con la auditoría.',
        code: pg.goodQuery || '',
        expectedOutput: Array.isArray(pg.goodResult) ? pg.goodResult : [],
      },
    ],
  };

  const cp = legacy.checkpoint || {};
  const correctOpt = (cp.options || []).find((o) => o.correct) || (cp.options || [])[0];
  let cpExplanation = String(correctOpt?.feedback || '').trim();
  if (countWords(cpExplanation) < 20) {
    cpExplanation +=
      ' Verifica siempre los supuestos de grano, cardinalidad y orden de evaluación antes de dar por válida la consulta.';
  }

  const firstCheck = {
    id: 'c1',
    type: 'mcq',
    prompt: CHECK_PROMPT_OVERRIDES[legacy.id] || String(cp.question || '').trim(),
    options: (cp.options || []).map((opt) => ({
      id: opt.id,
      text: opt.text,
      correct: Boolean(opt.correct),
      feedback: opt.feedback,
    })),
    explanation: cpExplanation,
  };

  const checks = [firstCheck, ...(meta.extraChecks || [])];

  const cc = legacy.codeChallenge || {};
  const starterCode = String(cc.templateCode || cc.template || '').trim();
  const hints = (cc.blanks || [])
    .slice(0, 3)
    .map((b) => {
      const ans = Array.isArray(b.acceptedAnswers) ? b.acceptedAnswers[0] : b.answer;
      return `${b.placeholder || b.label || b.id}: ${b.hint || `Completa con ${ans}`}`;
    });
  if (hints.length === 0) {
    hints.push('Revisa el ejemplo guiado de la lección para verificar la sintaxis exacta.');
  }

  const solutionCode = (cc.blanks || []).reduce((acc, b) => {
    const ans = Array.isArray(b.acceptedAnswers) ? b.acceptedAnswers[0] : b.answer || '';
    return acc.replace(new RegExp(`\\\\{\\\\{${b.id}\\\\}\\\\}`, 'g'), ans);
  }, starterCode);

  const rawExpOut = cc.expectedOutput;
  const solutionExplanationText =
    typeof rawExpOut === 'string' && rawExpOut.trim()
      ? rawExpOut.trim()
      : Array.isArray(cc.rubricCriteria) && cc.rubricCriteria.length > 0
      ? cc.rubricCriteria.map((r) => (typeof r === 'string' ? r : r.criterion || r.title || '')).filter(Boolean).join(' ')
      : 'La solución completa los bloques clave manteniendo la granularidad y las restricciones del esquema.';

  const practice = {
    type: 'fill-blanks',
    title: cc.title || `Práctica: ${meta.title}`,
    language: cc.language || 'sql',
    prompt: cc.instruction || cc.description || `Completa el código para resolver el caso de ${meta.title}.`,
    starterCode,
    expected: solutionCode || starterCode,
    orderMatters: true,
    hints,
    solution: solutionCode || starterCode,
    solutionExplanation: solutionExplanationText,
    blanks: cc.blanks || [],
    expectedOutputTable: Array.isArray(cc.expectedOutputTable)
      ? cc.expectedOutputTable
      : Array.isArray(rawExpOut)
      ? rawExpOut
      : [],
    rubricCriteria: cc.rubricCriteria || [],
  };

  const tp = legacy.triadPerspectives || {};
  const roleNotes = {
    de: buildRoleNoteString(tp.DE),
    da: buildRoleNoteString(tp.DA),
    bi: buildRoleNoteString(tp.BI),
  };

  const v2Lesson = {
    id: meta.id,
    moduleId: meta.moduleId,
    tracks: meta.tracks,
    level: meta.level,
    order: meta.order,
    title: meta.title,
    minutes: meta.minutes,
    prerequisites: meta.prerequisites,
    contentVersion: 1,
    hook: meta.hook,
    objectives: meta.objectives,
    sections,
    workedExample,
    checks,
    practice,
    roleNotes,
    summary: meta.summary,
    flashcards: meta.flashcards,
    glossaryTerms: meta.glossaryTerms,
    sources: meta.sources,
    aiNotes: meta.aiNotes,
    needsReview: true,
    legacyId: legacy.id,
    legacyOrder: legacy.order,
    stageId: legacy.stageId,
    subtitle: legacy.subtitle,
    goal: legacy.goal,
    pipelineChallenge: legacy.pipelineChallenge,
    relatedLessons: legacy.relatedLessons || [],
  };

  return v2Lesson;
}

export function runMigration() {
  const results = [];
  for (const legacy of LEGACY_LESSONS) {
    const v2 = transformLesson(legacy);
    const validation = validateLesson(v2);
    if (!validation.success) {
      console.error(`Error validando ${v2.id} (${legacy.id}):`, validation.error.issues);
      process.exitCode = 1;
      continue;
    }

    const moduleDir = path.join(LESSONS_OUT_DIR, v2.moduleId);
    fs.mkdirSync(moduleDir, { recursive: true });
    const outPath = path.join(moduleDir, `${v2.id}.js`);
    const fileContent = `// Lección migrada al esquema v2 mediante scripts/migrate-legacy.mjs\nconst lesson = ${JSON.stringify(
      v2,
      null,
      2
    )};\n\nexport default lesson;\n`;
    fs.writeFileSync(outPath, fileContent, 'utf8');
    results.push({ legacyId: legacy.id, id: v2.id, moduleId: v2.moduleId, outPath });
  }
  return results;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const migrated = runMigration();
  console.log(`Migradas ${migrated.length} lecciones a src/data/lessons/<moduleId>/<lessonId>.js`);
  for (const item of migrated) {
    console.log(`  - ${item.legacyId} -> ${item.moduleId}/${item.id}.js`);
  }
}

