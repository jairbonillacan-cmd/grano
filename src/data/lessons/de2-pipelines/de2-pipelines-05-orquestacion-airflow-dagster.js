const lesson = {
  id: 'de2-pipelines-05-orquestacion-airflow-dagster',
  moduleId: 'de2-pipelines',
  tracks: ['de'],
  level: 2,
  order: 5,
  title: 'Orquestación moderna: Airflow 3, Dagster y Prefect 3',
  subtitle: 'Orquestación moderna: Airflow 3 (Data Assets), Dagster y Prefect 3 comparados',
  minutes: 25,
  prerequisites: ['de2-pipelines-03-cargas-incrementales-merge', 'de2-pipelines-04-ingesta-apis-http'],
  contentVersion: 2,

  hook: 'Durante años, los pipelines de Mercado Brisa corrían mediante seis entradas independientes en `crontab`: las ventas a las 02:00, las devoluciones a las 02:15 y el reporte de ingreso neto a las 02:30. Un martes, la carga de devoluciones tardó veinte minutos más de lo previsto. El reporte de las 02:30 corrió con datos incompletos y además cruzó `orders` con `refunds` sin preagregar por activo mensual, multiplicando los pedidos con devoluciones parciales. ¿Cómo reemplazas horarios ciegos por un grafo dirigido acíclico (DAG) orientado a activos?',

  objectives: [
    'Explicar por qué un programador por reloj (`cron`) carece de estado, linaje de dependencias, reintentos por nodo y gestión de backfills.',
    'Comparar el modelo mental y el código declarativo de Apache Airflow 3 (`@dag`, `@task`, `Asset`), Dagster (`@dg.asset`) y Prefect 3 (`@flow`, `@task`).',
    'Materializar activos mensuales preagregados de pedidos (`orders`) y devoluciones (`refunds`) en Mercado Brisa evitando el fan-out al conciliar el ingreso neto.'
  ],

  sections: [
    {
      id: 'de-cron-a-grafos-y-activos',
      heading: 'Por qué cron no basta: grafos de tareas y activos de datos',
      body: 'Programar scripts sueltos con `cron` funciona cuando tienes una sola tarea aislada. Sin embargo, falla en cuanto el producto de una extracción alimenta a tres transformaciones aguas abajo. Un reloj de sistema ignora si el paso anterior terminó con éxito. Tampoco reintenta sólo el nodo fallido ni guarda registro de qué particiones históricas están desactualizadas.\n\nUn **orquestador de datos** modela el flujo como un **Grafo Dirigido Acíclico (DAG)**. Es una red donde los nodos representan unidades de cómputo o tablas y las aristas expresan dependencias sin ciclos cerrados.\n\nEn los orquestadores actuales conviven dos enfoques complementarios. La **orquestación centrada en tareas** (*task-centric*) define qué función ejecutar y en qué orden (`extraer_pagos >> transformar_plata`). En cambio, la **orquestación orientada a activos** (*asset-centric*) declara qué tabla o archivo Parquet debe existir y de qué otros activos depende. El orquestador coordina el grafo, pero el procesamiento pesado ocurre en el motor SQL sin pasar gigabytes por memoria.',
      interactive: {
        component: 'dbt-sqlmesh-dag-explorer',
        caption: 'Simulador interactivo: Explorador de grafos dirigidos acíclicos (DAG), linaje de activos y backfills.'
      },
      example: {
        language: 'sql',
        code: `SELECT
  STRFTIME(DATE_TRUNC('month', order_date), '%Y-%m-%d') AS asset_month,
  COUNT(*) AS total_orders,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed_orders,
  ROUND(SUM(total_usd) FILTER (WHERE status = 'completed'), 2) AS completed_revenue_usd
FROM orders
WHERE order_date >= DATE '2025-07-01'
  AND order_date < DATE '2025-12-01'
GROUP BY 1
ORDER BY 1;`,
        expectedOutput: [
          { asset_month: '2025-07-01', total_orders: 711, completed_orders: 581, completed_revenue_usd: 247621.49 },
          { asset_month: '2025-08-01', total_orders: 696, completed_orders: 596, completed_revenue_usd: 233316.49 },
          { asset_month: '2025-09-01', total_orders: 709, completed_orders: 573, completed_revenue_usd: 250208.31 },
          { asset_month: '2025-10-01', total_orders: 672, completed_orders: 536, completed_revenue_usd: 226514.96 },
          { asset_month: '2025-11-01', total_orders: 586, completed_orders: 488, completed_revenue_usd: 201792.92 }
        ]
      }
    },
    {
      id: 'airflow3-dagster-prefect3-comparados',
      heading: 'Airflow 3, Dagster y Prefect 3: anatomía y criterios de elección',
      body: 'Conocer cómo expresan un mismo activo de datos los tres orquestadores principales de Python permite elegir la herramienta adecuada para cada equipo.\n\n**Apache Airflow 3 (`airflow.sdk`)** unifica la definición de grafos (`@dag`, `@task`) con la programación orientada a activos mediante `Asset` y `@asset`. Usa el parámetro `schedule` (no `schedule_interval`) y lee `logical_date` en lugar de la variable obsoleta `execution_date`. Permite además disparar un flujo apenas se actualiza un activo aguas arriba.\n\n**Dagster (`dagster`)** nació diseñado alrededor de *Software-Defined Assets* (`@dg.asset`). Cada función decorada declara en sus argumentos de qué activos depende. Incluye soporte nativo de particiones (`MonthlyPartitionsDefinition`) y pruebas unitarias sobre activos.\n\n**Prefect 3 (`prefect`)** prioriza la ergonomía en Python puro mediante `@flow` y `@task` sin exigir un grafo estático previo. Destaca en flujos dinámicos y reintentos configurables con pocas líneas de código.',
      example: {
        language: 'python',
        code: `# 1) Apache Airflow 3 (airflow.sdk) — Activo declarativo con @asset
from airflow.sdk import Asset, asset

silver_orders_asset = Asset("s3://mercado-brisa/silver/monthly_orders.parquet")
silver_refunds_asset = Asset("s3://mercado-brisa/silver/monthly_refunds.parquet")

@asset(schedule=[silver_orders_asset, silver_refunds_asset], uri="s3://mercado-brisa/gold/net_revenue.parquet")
def gold_monthly_net_revenue() -> str:
    return "s3://mercado-brisa/gold/net_revenue.parquet"

# 2) Dagster — Software-Defined Asset particionado por mes
import dagster as dg

monthly_def = dg.MonthlyPartitionsDefinition(start_date="2025-07-01")

@dg.asset(partitions_def=monthly_def, deps=["silver_monthly_orders", "silver_monthly_refunds"])
def dagster_gold_net_revenue(context: dg.AssetExecutionContext) -> dg.MaterializeResult:
    month_key = context.partition_key
    return dg.MaterializeResult(metadata={"partition_month": month_key})

# 3) Prefect 3 — Flujo y tareas con reintentos declarativos
from prefect import flow, task

@task(retries=3, retry_delay_seconds=[5, 15, 45])
def compute_net_month(month_start: str) -> dict:
    return {"asset_month": month_start, "status": "materialized"}

@flow(name="mercado-brisa-monthly-close")
def run_monthly_close(month_start: str = "2025-07-01") -> dict:
    return compute_net_month(month_start)`
      }
    },
    {
      id: 'contrato-grano-entre-activos-upstream',
      heading: 'Contratos de grano entre activos: preagregar antes de unir',
      body: 'El enfoque orientado a activos no sólo ordena la ejecución en el tiempo. También obliga a definir con precisión el **grano de cada activo** antes de cruzarlo con otro.\n\nEn Mercado Brisa queremos publicar el activo `gold_monthly_net_revenue` para el tercer trimestre de 2025 (`2025-07-01`, `2025-08-01` y `2025-09-01`). Este activo combina los ingresos brutos de pedidos completados en `orders` con los montos devueltos en `refunds` según el mes del pedido original.\n\nUn pedido en `orders` puede tener **múltiples devoluciones parciales** en `refunds`. Si unimos directamente `orders LEFT JOIN refunds ON o.order_id = r.order_id` y sumamos `SUM(o.total_usd)`, los pedidos con dos devoluciones duplican su `total_usd`. En julio de 2025 las 581 órdenes completadas se expanden a **590 filas unidas**, inflando el ingreso bruto de `247.621,49 USD` a `251.578,37 USD`.\n\nEn cambio, si materializamos primero dos activos independientes al grano mensual (`monthly_orders` y `monthly_refunds`) y luego los unimos por `asset_month`, el cruce es `1:1` y el cálculo de `net_revenue_usd` cuadra al centavo.',
      example: {
        language: 'sql',
        code: `WITH monthly_orders AS (
  SELECT
    STRFTIME(DATE_TRUNC('month', order_date), '%Y-%m-%d') AS asset_month,
    COUNT(*) AS completed_orders,
    ROUND(SUM(total_usd), 2) AS gross_revenue_usd
  FROM orders
  WHERE status = 'completed'
    AND order_date >= DATE '2025-07-01'
    AND order_date < DATE '2025-10-01'
  GROUP BY 1
),
monthly_refunds AS (
  SELECT
    STRFTIME(DATE_TRUNC('month', o.order_date), '%Y-%m-%d') AS asset_month,
    ROUND(SUM(r.refund_amount_usd), 2) AS refunded_usd
  FROM refunds r
  JOIN orders o ON r.order_id = o.order_id
  WHERE o.status = 'completed'
    AND o.order_date >= DATE '2025-07-01'
    AND o.order_date < DATE '2025-10-01'
  GROUP BY 1
)
SELECT
  mo.asset_month,
  mo.completed_orders,
  mo.gross_revenue_usd,
  COALESCE(mr.refunded_usd, 0) AS refunded_usd,
  ROUND(mo.gross_revenue_usd - COALESCE(mr.refunded_usd, 0), 2) AS net_revenue_usd
FROM monthly_orders mo
LEFT JOIN monthly_refunds mr ON mo.asset_month = mr.asset_month
ORDER BY mo.asset_month;`,
        expectedOutput: [
          { asset_month: '2025-07-01', completed_orders: 581, gross_revenue_usd: 247621.49, refunded_usd: 9072.82, net_revenue_usd: 238548.67 },
          { asset_month: '2025-08-01', completed_orders: 596, gross_revenue_usd: 233316.49, refunded_usd: 8099.15, net_revenue_usd: 225217.34 },
          { asset_month: '2025-09-01', completed_orders: 573, gross_revenue_usd: 250208.31, refunded_usd: 10090.81, net_revenue_usd: 240117.5 }
        ]
      }
    }
  ],

  workedExample: {
    title: 'Materialización de activos mensuales en Q3 2025: JOIN directo frente a activos preagregados',
    description: 'En el cierre del Q3 2025 de Mercado Brisa, una tarea calculó el ingreso neto uniendo `orders` directamente con `refunds` sin preagregar cada activo por mes.',
    audit: 'Preagregar monthly_orders y monthly_refunds al grano asset_month corrige las 29 filas extra de fan-out en el trimestre y evita sobreestimar el ingreso bruto en 10.830,48 USD.',
    steps: [
      {
        label: 'Paso 1 — Unión directa de orders con refunds que duplica el total del pedido',
        explanation: 'Como un pedido puede tener múltiples filas en `refunds`, el `LEFT JOIN` genera 590 filas en julio en lugar de 581 y suma dos veces `o.total_usd` en esos pedidos.',
        code: `SELECT
  STRFTIME(DATE_TRUNC('month', o.order_date), '%Y-%m-%d') AS asset_month,
  COUNT(*) AS joined_rows,
  ROUND(SUM(o.total_usd), 2) AS inflated_orders_usd,
  ROUND(SUM(COALESCE(r.refund_amount_usd, 0)), 2) AS refunded_usd
FROM orders o
LEFT JOIN refunds r ON o.order_id = r.order_id
WHERE o.status = 'completed'
  AND o.order_date >= DATE '2025-07-01'
  AND o.order_date < DATE '2025-10-01'
GROUP BY 1
ORDER BY 1;`,
        expectedOutput: [
          { asset_month: '2025-07-01', joined_rows: 590, inflated_orders_usd: 251578.37, refunded_usd: 9072.82 },
          { asset_month: '2025-08-01', joined_rows: 607, inflated_orders_usd: 236175.2, refunded_usd: 8099.15 },
          { asset_month: '2025-09-01', joined_rows: 582, inflated_orders_usd: 254223.2, refunded_usd: 10090.81 }
        ]
      },
      {
        label: 'Paso 2 — Materialización de activos mensuales preagregados antes del JOIN 1:1',
        explanation: 'Separar los dos activos aguas arriba al grano `asset_month` preserva los 581, 596 y 573 pedidos completados y entrega el ingreso neto real.',
        code: `WITH monthly_orders AS (
  SELECT
    STRFTIME(DATE_TRUNC('month', order_date), '%Y-%m-%d') AS asset_month,
    COUNT(*) AS completed_orders,
    ROUND(SUM(total_usd), 2) AS gross_revenue_usd
  FROM orders
  WHERE status = 'completed'
    AND order_date >= DATE '2025-07-01'
    AND order_date < DATE '2025-10-01'
  GROUP BY 1
),
monthly_refunds AS (
  SELECT
    STRFTIME(DATE_TRUNC('month', o.order_date), '%Y-%m-%d') AS asset_month,
    ROUND(SUM(r.refund_amount_usd), 2) AS refunded_usd
  FROM refunds r
  JOIN orders o ON r.order_id = o.order_id
  WHERE o.status = 'completed'
    AND o.order_date >= DATE '2025-07-01'
    AND o.order_date < DATE '2025-10-01'
  GROUP BY 1
)
SELECT
  mo.asset_month,
  mo.completed_orders,
  mo.gross_revenue_usd,
  COALESCE(mr.refunded_usd, 0) AS refunded_usd,
  ROUND(mo.gross_revenue_usd - COALESCE(mr.refunded_usd, 0), 2) AS net_revenue_usd
FROM monthly_orders mo
LEFT JOIN monthly_refunds mr ON mo.asset_month = mr.asset_month
ORDER BY mo.asset_month;`,
        expectedOutput: [
          { asset_month: '2025-07-01', completed_orders: 581, gross_revenue_usd: 247621.49, refunded_usd: 9072.82, net_revenue_usd: 238548.67 },
          { asset_month: '2025-08-01', completed_orders: 596, gross_revenue_usd: 233316.49, refunded_usd: 8099.15, net_revenue_usd: 225217.34 },
          { asset_month: '2025-09-01', completed_orders: 573, gross_revenue_usd: 250208.31, refunded_usd: 10090.81, net_revenue_usd: 240117.5 }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: '¿Por qué los orquestadores de datos exigen que las dependencias entre tareas o activos formen un Grafo Dirigido Acíclico (DAG)?',
      options: [
        {
          id: 'a',
          text: 'Porque si existiera un ciclo (A depende de B y B depende de A), el planificador entraría en un bloqueo mutuo o bucle infinito sin un orden topológico válido.',
          correct: true,
          feedback: 'Correcto. La ausencia de ciclos garantiza que siempre exista un orden de ejecución con principio y fin.'
        },
        {
          id: 'b',
          text: 'Porque un grafo acíclico impide ejecutar dos tareas en paralelo aunque no dependan entre sí.',
          correct: false,
          feedback: 'Incorrecto. Precisamente una ventaja central de un DAG es ejecutar en paralelo todas las ramas que no tienen dependencia mutua.'
        },
        {
          id: 'c',
          text: 'Porque sólo los grafos acíclicos permiten conectarse a bases de datos relacionales.',
          correct: false,
          feedback: 'Incorrecto. La topología del grafo gobierna el orden de ejecución de las tareas, no el protocolo de red de las bases de datos.'
        }
      ],
      explanation: 'Para determinar qué tarea puede ejecutarse primero y cuáles deben esperar, el planificador realiza un ordenamiento topológico del grafo. Si un nodo dependiera directa o indirectamente de sí mismo, ningún nodo del ciclo podría iniciar legalmente.'
    },
    {
      id: 'c2',
      type: 'mcq',
      prompt: '¿Qué diferencia principal aporta la programación orientada a activos (`Asset` en Airflow 3 o `@dg.asset` en Dagster) frente a encadenar únicamente tareas por horario?',
      options: [
        {
          id: 'a',
          text: 'El orquestador conoce el catálogo de tablas/archivos producidos, su linaje y qué particiones están actualizadas o pendientes de materializar.',
          correct: true,
          feedback: 'Correcto. El foco pasa de "corrió el script" a "la partición 2025-09-01 de la tabla gold_net_revenue está actualizada y validada".'
        },
        {
          id: 'b',
          text: 'Elimina la necesidad de escribir consultas SQL o scripts Python para transformar los datos.',
          correct: false,
          feedback: 'Incorrecto. La lógica de transformación sigue escribiéndose en SQL o Python; cambia el modo en que se declara y rastrea el producto.'
        },
        {
          id: 'c',
          text: 'Obliga a almacenar todos los archivos de datos dentro de la base de datos interna de metadatos del orquestador.',
          correct: false,
          feedback: 'Incorrecto. Los datos siguen residiendo en el almacenamiento de objetos o almacén analítico; el orquestador sólo registra los metadatos.'
        }
      ],
      explanation: 'En un modelo centrado sólo en tareas, el orquestador sabe que la función `run_script` devolvió código 0, pero ignora qué tablas modificó. En el modelo orientado a activos, las tablas y particiones son ciudadanos de primera clase con linaje y estado de frescura.'
    },
    {
      id: 'c3',
      type: 'mcq',
      prompt: 'Un desarrollador devuelve un DataFrame de 4 millones de filas como valor de retorno de una tarea `@task` en Airflow para que la siguiente tarea lo reciba por XCom. ¿Por qué es un antipatrón severo?',
      options: [
        {
          id: 'a',
          text: 'Porque XCom está diseñado para metadatos livianos (rutas, marcas de agua, conteos) y serializar gigabytes satura la base de metadatos y la memoria del trabajador.',
          correct: true,
          feedback: 'Correcto. Las tareas deben escribir el lote en almacenamiento de objetos (Parquet en S3/GCS) y pasarse únicamente la URI o ruta del archivo.'
        },
        {
          id: 'b',
          text: 'Porque Python no permite que una función decorada tenga sentencia return.',
          correct: false,
          feedback: 'Incorrecto. TaskFlow API usa `return` de forma nativa, pero debe retornar diccionarios pequeños o cadenas con la URI del activo.'
        },
        {
          id: 'c',
          text: 'Porque los archivos Parquet no pueden leerse desde una segunda tarea del mismo grafo.',
          correct: false,
          feedback: 'Incorrecto. Pasar la URI de un archivo Parquet en almacenamiento de objetos es el patrón recomendado entre tareas.'
        }
      ],
      explanation: 'El orquestador es el director de orquesta, no el camión de carga. Los datos voluminosos deben fluir entre el almacenamiento de objetos y el motor analítico, mientras que por el canal de control del orquestador sólo viajan punteros, fechas lógicas y métricas de auditoría.'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Materialización del activo gold_monthly_net_revenue para el Q3 2025',
    language: 'sql',
    prompt: 'Materializa la consulta del activo `gold_monthly_net_revenue` para el tercer trimestre de 2025 (`o.order_date >= DATE \'2025-07-01\' AND o.order_date < DATE \'2025-10-01\'` y `o.status = \'completed\'`). Define dos CTEs preagregadas por `STRFTIME(DATE_TRUNC(\'month\', order_date), \'%Y-%m-%d\') AS asset_month`: la primera (`monthly_orders`) con `completed_orders` y `gross_revenue_usd`, y la segunda (`monthly_refunds`) uniendo `refunds` con `orders` para sumar `refunded_usd` según el mes del pedido. Únelas por `asset_month` y devuelve `asset_month`, `completed_orders`, `gross_revenue_usd`, `refunded_usd` y `net_revenue_usd` (`ROUND(gross_revenue_usd - COALESCE(refunded_usd, 0), 2)`), ordenando por `asset_month ASC`.',
    starterCode: `-- Activo gold_monthly_net_revenue del Q3 2025 [2025-07-01, 2025-10-01)
-- El código inicial une orders y refunds directamente y sufre de fan-out en gross_revenue_usd.
-- Separa el cálculo en dos CTEs preagregadas por asset_month antes de unirlas.
SELECT
  STRFTIME(DATE_TRUNC('month', o.order_date), '%Y-%m-%d') AS asset_month,
  COUNT(DISTINCT o.order_id) AS completed_orders,
  ROUND(SUM(o.total_usd), 2) AS gross_revenue_usd,
  ROUND(SUM(COALESCE(r.refund_amount_usd, 0)), 2) AS refunded_usd,
  ROUND(SUM(o.total_usd) - SUM(COALESCE(r.refund_amount_usd, 0)), 2) AS net_revenue_usd
FROM orders o
LEFT JOIN refunds r ON o.order_id = r.order_id
WHERE o.status = 'completed'
  AND o.order_date >= DATE '2025-07-01'
  AND o.order_date < DATE '2025-10-01'
GROUP BY 1
ORDER BY 1;`,
    expected: `WITH monthly_orders AS (
  SELECT
    STRFTIME(DATE_TRUNC('month', order_date), '%Y-%m-%d') AS asset_month,
    COUNT(*) AS completed_orders,
    ROUND(SUM(total_usd), 2) AS gross_revenue_usd
  FROM orders
  WHERE status = 'completed'
    AND order_date >= DATE '2025-07-01'
    AND order_date < DATE '2025-10-01'
  GROUP BY 1
),
monthly_refunds AS (
  SELECT
    STRFTIME(DATE_TRUNC('month', o.order_date), '%Y-%m-%d') AS asset_month,
    ROUND(SUM(r.refund_amount_usd), 2) AS refunded_usd
  FROM refunds r
  JOIN orders o ON r.order_id = o.order_id
  WHERE o.status = 'completed'
    AND o.order_date >= DATE '2025-07-01'
    AND o.order_date < DATE '2025-10-01'
  GROUP BY 1
)
SELECT
  mo.asset_month,
  mo.completed_orders,
  mo.gross_revenue_usd,
  COALESCE(mr.refunded_usd, 0) AS refunded_usd,
  ROUND(mo.gross_revenue_usd - COALESCE(mr.refunded_usd, 0), 2) AS net_revenue_usd
FROM monthly_orders mo
LEFT JOIN monthly_refunds mr ON mo.asset_month = mr.asset_month
ORDER BY mo.asset_month;`,
    orderMatters: true,
    hints: [
      'En el código inicial, SUM(o.total_usd) se evalúa después del LEFT JOIN con refunds, duplicando el total de cualquier pedido que tenga dos reembolsos parciales.',
      'Crea la CTE monthly_orders agrupando únicamente la tabla orders para obtener completed_orders y gross_revenue_usd por asset_month.',
      'Crea la CTE monthly_refunds uniendo refunds con orders (para filtrar pedidos completados del Q3 2025 y agrupar por el mes de o.order_date) y luego haz LEFT JOIN entre ambas CTEs.'
    ],
    solution: `WITH monthly_orders AS (
  SELECT
    STRFTIME(DATE_TRUNC('month', order_date), '%Y-%m-%d') AS asset_month,
    COUNT(*) AS completed_orders,
    ROUND(SUM(total_usd), 2) AS gross_revenue_usd
  FROM orders
  WHERE status = 'completed'
    AND order_date >= DATE '2025-07-01'
    AND order_date < DATE '2025-10-01'
  GROUP BY 1
),
monthly_refunds AS (
  SELECT
    STRFTIME(DATE_TRUNC('month', o.order_date), '%Y-%m-%d') AS asset_month,
    ROUND(SUM(r.refund_amount_usd), 2) AS refunded_usd
  FROM refunds r
  JOIN orders o ON r.order_id = o.order_id
  WHERE o.status = 'completed'
    AND o.order_date >= DATE '2025-07-01'
    AND o.order_date < DATE '2025-10-01'
  GROUP BY 1
)
SELECT
  mo.asset_month,
  mo.completed_orders,
  mo.gross_revenue_usd,
  COALESCE(mr.refunded_usd, 0) AS refunded_usd,
  ROUND(mo.gross_revenue_usd - COALESCE(mr.refunded_usd, 0), 2) AS net_revenue_usd
FROM monthly_orders mo
LEFT JOIN monthly_refunds mr ON mo.asset_month = mr.asset_month
ORDER BY mo.asset_month;`,
    solutionExplanation: 'Materializa lógicamente los dos activos intermedios (`monthly_orders` y `monthly_refunds`) al mismo grano mensual antes de unirlos `1:1`, eliminando el fan-out sobre `gross_revenue_usd`.',
    expectedOutputTable: [
      { asset_month: '2025-07-01', completed_orders: 581, gross_revenue_usd: 247621.49, refunded_usd: 9072.82, net_revenue_usd: 238548.67 },
      { asset_month: '2025-08-01', completed_orders: 596, gross_revenue_usd: 233316.49, refunded_usd: 8099.15, net_revenue_usd: 225217.34 },
      { asset_month: '2025-09-01', completed_orders: 573, gross_revenue_usd: 250208.31, refunded_usd: 10090.81, net_revenue_usd: 240117.5 }
    ]
  },

  roleNotes: {
    de: 'Como Ingeniero de Datos, diseña tareas atómicas que intercambien rutas inmutables de Parquet y métricas de control; adopta la sintaxis de activos de Airflow 3 (`airflow.sdk`) o Dagster para exponer linaje claro.',
    da: 'Como Analista de Datos, consulta el grafo de activos del orquestador para verificar si las tablas fuente de tu informe ya completaron la materialización del día antes de publicar conclusiones.',
    bi: 'Como especialista en BI, vincula la actualización de tus extractos o cubos al evento de materialización del activo de la capa Oro en lugar de programar una hora fija que puede adelantarse a la carga.'
  },

  summary: [
    'Un orquestador reemplaza los horarios ciegos de cron por un Grafo Dirigido Acíclico (DAG) con dependencias, reintentos y backfills.',
    'La orquestación orientada a activos modela cada tabla o archivo Parquet y sus particiones como nodos con linaje explícito.',
    'Airflow 3 (@asset en airflow.sdk), Dagster (@dg.asset) y Prefect 3 (@flow/@task) ofrecen abstracciones declarativas en Python.',
    'Preagregar cada activo intermedio a su grano objetivo antes de unirlos impide errores de fan-out en las métricas de la capa Oro.'
  ],

  flashcards: [
    {
      id: 'fc-de2-pip-05-a',
      front: '¿Qué ventaja ofrece disparar un pipeline por actualización de un Data Asset frente a un horario cron fijo?',
      back: 'Evita que el reporte o transformación aguas abajo corra con datos incompletos si la ingesta previa se retrasa unos minutos.'
    },
    {
      id: 'fc-de2-pip-05-b',
      front: 'En Apache Airflow 3, ¿desde qué módulo se importan @dag, @task y Asset, y qué variable reemplaza a execution_date?',
      back: 'Se importan desde airflow.sdk y se utiliza logical_date (junto al parámetro schedule en lugar de schedule_interval).'
    },
    {
      id: 'fc-de2-pip-05-c',
      front: '¿Por qué no deben enviarse tablas de millones de filas a través de XCom entre tareas de un orquestador?',
      back: 'Porque XCom almacena metadatos en la base del orquestador; pasar datos pesados agota la RAM y debe reemplazarse por URIs en almacenamiento de objetos.'
    }
  ],

  glossaryTerms: ['orquestacion-orientada-activos', 'reprocesamiento-historico-backfill'],

  sources: [
    {
      title: 'Apache Airflow 3 Documentation — Asset-Aware Scheduling',
      url: 'https://airflow.apache.org/docs/apache-airflow/stable/authoring-and-scheduling/asset-scheduling.html',
      publisher: 'Apache Software Foundation',
      accessed: '2026-10-29',
      supports: 'Definición declarativa de activos con Asset y @asset en Airflow 3 y disparo por eventos de datos.'
    },
    {
      title: 'Dagster Documentation — Defining Assets (@dg.asset)',
      url: 'https://docs.dagster.io/guides/build/assets/defining-assets',
      publisher: 'Dagster Labs',
      accessed: '2026-10-29',
      supports: 'Modelo de Software-Defined Assets, grafo de linaje automático y particiones declarativas.'
    },
    {
      title: 'Prefect 3 Documentation — Write and run flows',
      url: 'https://docs.prefect.io/v3/develop/write-flows',
      publisher: 'Prefect Technologies',
      accessed: '2026-10-29',
      supports: 'Decoradores @flow y @task, políticas de reintentos y manejo transaccional de tareas en Python.'
    }
  ],

  aiNotes: 'En la práctica, el starterCode ya usa `COUNT(DISTINCT o.order_id)` por lo que `completed_orders` da `581, 596, 573`, pero `SUM(o.total_usd)` sigue inflado por las órdenes que tienen más de una fila en `refunds`. Orienta al estudiante a separar `monthly_orders` y `monthly_refunds` en dos CTEs independientes antes del `LEFT JOIN`.',

  pipelineChallenge: {
    title: 'Diseño de un grafo orientado a activos para el cierre mensual',
    scenario: 'Ordena los 4 pasos entre Ingeniería (DE), Análisis (DA) y BI para reemplazar un cron frágil por un grafo de activos confiable en Mercado Brisa.',
    steps: [
      {
        id: 'step-1',
        label: '1. Declarar los activos Plata preagregados (monthly_orders y monthly_refunds)',
        role: 'DE',
        detail: 'Materializar cada activo con grano `asset_month` pasando únicamente URIs de Parquet entre nodos del orquestador.'
      },
      {
        id: 'step-2',
        label: '2. Configurar el activo Oro dependiente de la actualización de ambos activos Plata',
        role: 'DE',
        detail: 'Programar `@asset(schedule=[silver_orders_asset, silver_refunds_asset])` para que sólo corra cuando ambos padres terminen.'
      },
      {
        id: 'step-3',
        label: '3. Auditar que la unión 1:1 por mes conserve los 1.750 pedidos del trimestre',
        role: 'DA',
        detail: 'Verificar que julio (581), agosto (596) y septiembre (573) sumen el ingreso bruto real antes de restar devoluciones.'
      },
      {
        id: 'step-4',
        label: '4. Disparar el refresco del tablero financiero al materializarse el activo Oro',
        role: 'BI',
        detail: 'Actualizar las tarjetas ejecutivas de ingreso neto (`net_revenue_usd`) por evento de finalización del DAG.'
      }
    ],
    explanation: 'Al modelar activos preagregados (Paso 1) con disparo por dependencias reales (Paso 2), DA valida la ausencia de fan-out (Paso 3) y BI publica siempre a tiempo (Paso 4).'
  }
};

export default lesson;
