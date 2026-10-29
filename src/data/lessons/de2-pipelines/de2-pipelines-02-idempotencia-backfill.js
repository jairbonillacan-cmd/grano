const lesson = {
  id: 'de2-pipelines-02-idempotencia-backfill',
  moduleId: 'de2-pipelines',
  tracks: ['de'],
  level: 2,
  order: 2,
  title: 'Idempotencia, determinismo y reprocesamiento (backfill)',
  subtitle: 'Idempotencia, determinismo y diseño para reprocesamiento histórico (backfill)',
  minutes: 25,
  prerequisites: ['de2-pipelines-01-etl-vs-elt'],
  contentVersion: 2,

  hook: 'Durante una caída de red un domingo por la noche, el orquestador de Mercado Brisa reintentó tres veces la tarea que cargaba las confirmaciones bancarias. A la mañana siguiente, tesorería descubrió 450 filas duplicadas en `payments` que inflaban la recaudación capturada en 168.674,63 USD. Peor aún: al intentar corregir el tercer trimestre ejecutando un reprocesamiento histórico, el script usó `CURRENT_DATE` y sobreescribió octubre en vez de julio. ¿Cómo diseñas un pipeline que entregue el mismo resultado aunque corra diez veces seguidas?',

  objectives: [
    'Aplicar el principio de idempotencia matemática en pipelines de datos mediante sobreescritura atómica de particiones y deduplicación por llave.',
    'Eliminar fuentes de no determinismo como funciones de reloj (`NOW()`, `CURRENT_DATE`) parametrizando cada corrida con su ventana lógica.',
    'Construir consultas de reprocesamiento histórico (backfill) sobre `payments` en Mercado Brisa utilizando `QUALIFY ROW_NUMBER()` y cotas semiabiertas.'
  ],

  sections: [
    {
      id: 'anatomia-idempotencia-pipelines',
      heading: 'Qué hace que un pipeline sea idempotente ante reintentos',
      body: 'Una operación es **idempotente** cuando ejecutarla una o varias veces sobre la misma entrada produce idéntico estado en la tabla destino. En sistemas distribuidos, los fallos transitorios son inevitables. Las pasarelas de pago reenvían notificaciones (*webhooks*) cuando no reciben respuesta rápida. Asimismo, los orquestadores relanzan tareas tras un corte de red.\n\nEl error más frecuente consiste en programar inserciones ciegas (`INSERT INTO tabla SELECT ...`) sin limpiar antes la ventana ni deduplicar el lote. Si una tarea inserta la mitad de un archivo, falla y se reintenta desde cero, todas esas filas quedan duplicadas.\n\nEn Mercado Brisa, la tabla `payments` almacena **19.200 registros crudos**, pero sólo existen **18.750 llaves únicas** de `(order_id, attempt_number)`. Los 450 registros restantes son reenvíos exactos repartidos entre `adyen_iberia` (113), `conekta` (112), `mercadopago` (113) y `stripe_latam` (112). Para lograr idempotencia al promover a Plata, deduplicamos por `(order_id, attempt_number)` conservando una única fila por intento.',
      interactive: {
        component: 'window-function-stepper',
        caption: 'Simulador interactivo: Deduplicación determinista por partición con ROW_NUMBER() OVER (PARTITION BY ...).'
      },
      example: {
        language: 'sql',
        code: `SELECT
  provider,
  COUNT(*) AS raw_rows,
  COUNT(DISTINCT idempotency_key) AS unique_keys,
  COUNT(*) - COUNT(DISTINCT idempotency_key) AS duplicate_webhook_rows
FROM payments
GROUP BY provider
ORDER BY provider;`,
        expectedOutput: [
          { provider: 'adyen_iberia', raw_rows: 4800, unique_keys: 4687, duplicate_webhook_rows: 113 },
          { provider: 'conekta', raw_rows: 4800, unique_keys: 4688, duplicate_webhook_rows: 112 },
          { provider: 'mercadopago', raw_rows: 4800, unique_keys: 4687, duplicate_webhook_rows: 113 },
          { provider: 'stripe_latam', raw_rows: 4800, unique_keys: 4688, duplicate_webhook_rows: 112 }
        ]
      }
    },
    {
      id: 'determinismo-reloj-logico',
      heading: 'Determinismo y parametrización del tiempo de ejecución',
      body: 'La idempotencia exige que la transformación sea una **función determinista** de sus parámetros de entrada. Si el resultado cambia según la hora en que el servidor ejecuta el script, el pipeline no es determinista. Resultará imposible auditar o reconstruir meses pasados.\n\nTres hábitos destruyen el determinismo en SQL y Python. El primero es usar el **reloj físico del servidor** (`WHERE processed_at >= CURRENT_DATE - INTERVAL \'1 day\'`). Si reprocesas un fallo del viernes el lunes siguiente, leerás datos del domingo. El segundo hábito es desempatar con `ROW_NUMBER()` sin una cláusula `ORDER BY` completa. El motor elegirá una fila distinta en cada corrida. El tercero es escribir archivos sueltos en una carpeta compartida sin limpiar la partición previa.\n\nLa solución consiste en inyectar siempre el **intervalo lógico** (`start_ts`, `end_ts`) desde el orquestador. Usa intervalos semiabiertos (`processed_at >= inicio AND processed_at < fin`) en lugar de `BETWEEN` para no duplicar eventos en la medianoche exacta, y reemplaza la partición completa de forma atómica.',
      example: {
        language: 'python',
        code: `from pathlib import Path
import duckdb

def materialize_payment_partition(
    bronze_path: Path, output_dir: Path, start_ts: str, end_ts: str
) -> Path:
    """Materializa una ventana temporal [start_ts, end_ts) de forma determinista."""
    partition_dir = output_dir / f"window_start={start_ts[:10]}"
    partition_dir.mkdir(parents=True, exist_ok=True)
    tmp_file = partition_dir / "part-0.parquet.tmp"
    final_file = partition_dir / "part-0.parquet"

    with duckdb.connect() as con:
        con.execute(
            """
            COPY (
                SELECT *
                FROM read_parquet(?)
                WHERE processed_at >= CAST(? AS TIMESTAMP)
                  AND processed_at < CAST(? AS TIMESTAMP)
                QUALIFY ROW_NUMBER() OVER (
                    PARTITION BY order_id, attempt_number
                    ORDER BY processed_at DESC, payment_id ASC
                ) = 1
            ) TO ? (FORMAT PARQUET, COMPRESSION ZSTD);
            """,
            [str(bronze_path), start_ts, end_ts, str(tmp_file)],
        )
    tmp_file.replace(final_file)
    return final_file`
      }
    },
    {
      id: 'diseno-reprocesamiento-backfill',
      heading: 'Estrategias seguras para el reprocesamiento histórico (backfill)',
      body: 'Incluso en equipos disciplinados, tarde o temprano necesitarás ejecutar un **reprocesamiento histórico** (*backfill*). Esto implica recalcular semanas o trimestres pasados porque se corrigió una regla impositiva o llegó un lote atrasado de una tienda.\n\nCuando un pipeline se diseña con particiones aisladas y consultas deterministas con cotas semiabiertas, el backfill deja de ser riesgoso. Se convierte en una simple invocación parametrizada para cada ventana histórica afectada.\n\nEn DuckDB y motores modernos, la cláusula `QUALIFY` combinada con `ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...)` expresa la deduplicación idempotente en un solo bloque legible antes de agrupar. En Mercado Brisa, durante el tercer trimestre de 2025 (`2025-07-01` a `2025-10-01`), podemos reprocesar los pagos deduplicando por `(order_id, attempt_number)`. Obtenemos exactamente **2.201 intentos únicos** y **1.922 cobros capturados**, sin importar cuántas veces relancemos la consulta sobre el archivo crudo.',
      example: {
        language: 'sql',
        code: `WITH deduplicated_payments AS (
  SELECT
    payment_id,
    order_id,
    attempt_number,
    provider,
    status,
    amount_usd,
    payment_ts,
    idempotency_key
  FROM payments
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY idempotency_key
    ORDER BY payment_ts ASC, payment_id ASC
  ) = 1
)
SELECT
  provider,
  COUNT(*) FILTER (WHERE status = 'captured') AS clean_captured_rows,
  ROUND(SUM(amount_usd) FILTER (WHERE status = 'captured'), 2) AS idempotent_captured_usd
FROM deduplicated_payments
GROUP BY provider
ORDER BY idempotent_captured_usd DESC;`,
        expectedOutput: [
          { provider: 'conekta', clean_captured_rows: 3960, idempotent_captured_usd: 1935173.03 },
          { provider: 'adyen_iberia', clean_captured_rows: 3960, idempotent_captured_usd: 1927080.27 },
          { provider: 'mercadopago', clean_captured_rows: 4140, idempotent_captured_usd: 1539322.85 },
          { provider: 'stripe_latam', clean_captured_rows: 4140, idempotent_captured_usd: 1472911.85 }
        ]
      }
    }
  ],

  workedExample: {
    title: 'Conciliación de pasarelas en Mercado Brisa: webhooks duplicados frente a deduplicación QUALIFY',
    description: 'Tesorería detecta que el reporte acumulado de cobros capturados por pasarela (`provider`) difiere del extracto bancario porque el pipeline sumó directamente la tabla `payments` sin eliminar los reintentos duplicados.',
    audit: 'Al deduplicar por idempotency_key con QUALIFY ROW_NUMBER(), se eliminan los 405 cobros capturados repetidos y la recaudación se corrige en 168.674,63 USD.',
    steps: [
      {
        label: 'Paso 1 — Agregación no idempotente que suma reenvíos de webhooks',
        explanation: 'Al no deduplicar por `idempotency_key`, cada reintento de red suma dos veces el mismo cobro y sobreestima la recaudación.',
        code: `SELECT
  provider,
  COUNT(*) FILTER (WHERE status = 'captured') AS raw_captured_rows,
  ROUND(SUM(amount_usd) FILTER (WHERE status = 'captured'), 2) AS inflated_captured_usd
FROM payments
GROUP BY provider
ORDER BY inflated_captured_usd DESC;`,
        expectedOutput: [
          { provider: 'conekta', raw_captured_rows: 4059, inflated_captured_usd: 1985280.48 },
          { provider: 'adyen_iberia', raw_captured_rows: 4059, inflated_captured_usd: 1973684.17 },
          { provider: 'mercadopago', raw_captured_rows: 4244, inflated_captured_usd: 1576444.15 },
          { provider: 'stripe_latam', raw_captured_rows: 4243, inflated_captured_usd: 1507753.83 }
        ]
      },
      {
        label: 'Paso 2 — Deduplicación determinista por llave de idempotencia antes de agregar',
        explanation: 'Aplicar `QUALIFY ROW_NUMBER()` sobre `idempotency_key` con criterio de desempate determinista garantiza exactamente 16.200 cobros capturados únicos.',
        code: `WITH deduplicated_payments AS (
  SELECT
    payment_id,
    order_id,
    attempt_number,
    provider,
    status,
    amount_usd,
    payment_ts,
    idempotency_key
  FROM payments
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY idempotency_key
    ORDER BY payment_ts ASC, payment_id ASC
  ) = 1
)
SELECT
  provider,
  COUNT(*) FILTER (WHERE status = 'captured') AS clean_captured_rows,
  ROUND(SUM(amount_usd) FILTER (WHERE status = 'captured'), 2) AS idempotent_captured_usd
FROM deduplicated_payments
GROUP BY provider
ORDER BY idempotent_captured_usd DESC;`,
        expectedOutput: [
          { provider: 'conekta', clean_captured_rows: 3960, idempotent_captured_usd: 1935173.03 },
          { provider: 'adyen_iberia', clean_captured_rows: 3960, idempotent_captured_usd: 1927080.27 },
          { provider: 'mercadopago', clean_captured_rows: 4140, idempotent_captured_usd: 1539322.85 },
          { provider: 'stripe_latam', clean_captured_rows: 4140, idempotent_captured_usd: 1472911.85 }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: 'Un trabajo nocturno falla a mitad de camino tras insertar 3.000 filas en la tabla de ventas diarias. Cuando el orquestador lo reintenta automáticamente, la tabla termina con 3.000 filas duplicadas. ¿Qué principio de diseño se incumplió?',
      options: [
        {
          id: 'a',
          text: 'Idempotencia: el trabajo usó inserción acumulativa sin limpiar ni reemplazar de forma atómica la partición de la fecha.',
          correct: true,
          feedback: 'Correcto. Un pipeline idempotente reemplaza la partición completa o aplica deduplicación por llave para que reintentar no duplique registros.'
        },
        {
          id: 'b',
          text: 'Compresión columnar: la tabla debía guardarse en formato CSV en lugar de Parquet.',
          correct: false,
          feedback: 'Incorrecto. El formato de archivo no evita que una sentencia INSERT acumulativa duplique datos ante un reintento.'
        },
        {
          id: 'c',
          text: 'Escalado vertical: el servidor necesitaba el doble de memoria RAM para evitar reintentos.',
          correct: false,
          feedback: 'Incorrecto. Los reintentos por red o mantenimiento ocurrirán siempre; el código debe ser seguro ante cualquier reejecución.'
        }
      ],
      explanation: 'Cuando un pipeline escribe mediante `INSERT INTO` sin limpiar previamente la partición de la ventana lógica ni usar reemplazo atómico (`INSERT OVERWRITE` o archivo temporal reemplazado), cada reintento agrega filas repetidas y rompe la idempotencia.'
    },
    {
      id: 'c2',
      type: 'mcq',
      prompt: '¿Por qué usar `WHERE DATE(ordered_at) = CURRENT_DATE - 1` dentro de un script impide ejecutar un reprocesamiento histórico (backfill) del mes pasado?',
      options: [
        {
          id: 'a',
          text: 'Porque `CURRENT_DATE` toma la fecha física del reloj del servidor en el instante de ejecución en vez de la ventana lógica que se desea reconstruir.',
          correct: true,
          feedback: 'Correcto. Sin un parámetro explícito de ventana temporal, cualquier corrida siempre leerá el día anterior al reloj actual.'
        },
        {
          id: 'b',
          text: 'Porque los motores SQL no permiten restar números enteros a una columna de tipo fecha.',
          correct: false,
          feedback: 'Incorrecto. La aritmética de fechas es válida en SQL; el defecto está en acoplar la consulta al reloj del sistema.'
        },
        {
          id: 'c',
          text: 'Porque las funciones de fecha desactivan los índices de los archivos Parquet.',
          correct: false,
          feedback: 'Incorrecto. El problema principal de `CURRENT_DATE` en un backfill es la pérdida de determinismo respecto al periodo histórico.'
        }
      ],
      explanation: 'Para que un pipeline sea determinista y permita reprocesar cualquier periodo histórico, las cotas de tiempo (`start_date`, `end_date`) deben recibirse como parámetros externos asociados a la fecha lógica de la corrida, nunca leerse del reloj físico.'
    },
    {
      id: 'c3',
      type: 'mcq',
      prompt: 'Al particionar un backfill diario por marcas de tiempo (`TIMESTAMP`), ¿cuál es la ventaja de usar `processed_at >= \'2025-07-01 00:00:00\' AND processed_at < \'2025-07-02 00:00:00\'` frente a `BETWEEN`?',
      options: [
        {
          id: 'a',
          text: 'Evita que un registro con marca exacta en la frontera `2025-07-02 00:00:00` se incluya tanto en el lote del 1 de julio como en el del 2 de julio.',
          correct: true,
          feedback: 'Correcto. Como `BETWEEN` es inclusivo en ambos extremos, las marcas exactas de medianoche se duplicarían entre particiones adyacentes.'
        },
        {
          id: 'b',
          text: 'Hace que el motor convierta automáticamente las zonas horarias a UTC sin especificarlas.',
          correct: false,
          feedback: 'Incorrecto. El operador de comparación no altera la zona horaria almacenada en el tipo de dato.'
        },
        {
          id: 'c',
          text: 'Permite omitir la cláusula `ORDER BY` dentro de `ROW_NUMBER()`.',
          correct: false,
          feedback: 'Incorrecto. El filtro de la ventana temporal y el orden de desempate cumplen propósitos distintos e independientes.'
        }
      ],
      explanation: 'El operador `BETWEEN a AND b` evalúa `>= a AND <= b`. En particiones contiguas, el límite superior de un día coincide con el límite inferior del día siguiente. Usar intervalos semiabiertos `[inicio, fin)` garantiza que cada instante pertenezca a una única partición.'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Backfill determinista del tercer trimestre sobre payments',
    language: 'sql',
    prompt: 'Ejecuta el reprocesamiento histórico (backfill) del tercer trimestre de 2025 sobre `payments` usando la ventana semiabierta `payment_ts >= TIMESTAMP \'2025-07-01 00:00:00\' AND payment_ts < TIMESTAMP \'2025-10-01 00:00:00\'`. Primero deduplica los registros de ese trimestre por `idempotency_key` conservando la fila con `ORDER BY payment_ts ASC, payment_id ASC`. Luego agrupa por `payment_method` y calcula: `unique_attempts` (total de intentos únicos), `captured_count` (intentos únicos con `status = \'captured\'`) y `captured_revenue_usd` (`ROUND(SUM(amount_usd) FILTER (WHERE status = \'captured\'), 2)`). Ordena por `captured_revenue_usd DESC`.',
    starterCode: `-- Backfill determinista de pagos del Q3 2025 [2025-07-01, 2025-10-01)
-- El código inicial agrupa directamente la tabla payments sin deduplicar por idempotency_key.
-- Añade una CTE con QUALIFY ROW_NUMBER() para eliminar los webhooks duplicados antes de agregar.
SELECT
  payment_method,
  COUNT(*) AS unique_attempts,
  COUNT(*) FILTER (WHERE status = 'captured') AS captured_count,
  ROUND(SUM(amount_usd) FILTER (WHERE status = 'captured'), 2) AS captured_revenue_usd
FROM payments
WHERE payment_ts >= TIMESTAMP '2025-07-01 00:00:00'
  AND payment_ts < TIMESTAMP '2025-10-01 00:00:00'
GROUP BY payment_method
ORDER BY captured_revenue_usd DESC;`,
    expected: `WITH q3_dedup AS (
  SELECT
    payment_id,
    payment_method,
    status,
    amount_usd,
    payment_ts,
    idempotency_key
  FROM payments
  WHERE payment_ts >= TIMESTAMP '2025-07-01 00:00:00'
    AND payment_ts < TIMESTAMP '2025-10-01 00:00:00'
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY idempotency_key
    ORDER BY payment_ts ASC, payment_id ASC
  ) = 1
)
SELECT
  payment_method,
  COUNT(*) AS unique_attempts,
  COUNT(*) FILTER (WHERE status = 'captured') AS captured_count,
  ROUND(SUM(amount_usd) FILTER (WHERE status = 'captured'), 2) AS captured_revenue_usd
FROM q3_dedup
GROUP BY payment_method
ORDER BY captured_revenue_usd DESC;`,
    orderMatters: true,
    hints: [
      'Crea una CTE llamada q3_dedup que filtre primero la ventana [2025-07-01 00:00:00, 2025-10-01 00:00:00) sobre payment_ts en payments.',
      'Dentro de la CTE, usa QUALIFY ROW_NUMBER() OVER (PARTITION BY idempotency_key ORDER BY payment_ts ASC, payment_id ASC) = 1.',
      'En el SELECT externo, agrupa q3_dedup por payment_method y calcula unique_attempts, captured_count y captured_revenue_usd.'
    ],
    solution: `WITH q3_dedup AS (
  SELECT
    payment_id,
    payment_method,
    status,
    amount_usd,
    payment_ts,
    idempotency_key
  FROM payments
  WHERE payment_ts >= TIMESTAMP '2025-07-01 00:00:00'
    AND payment_ts < TIMESTAMP '2025-10-01 00:00:00'
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY idempotency_key
    ORDER BY payment_ts ASC, payment_id ASC
  ) = 1
)
SELECT
  payment_method,
  COUNT(*) AS unique_attempts,
  COUNT(*) FILTER (WHERE status = 'captured') AS captured_count,
  ROUND(SUM(amount_usd) FILTER (WHERE status = 'captured'), 2) AS captured_revenue_usd
FROM q3_dedup
GROUP BY payment_method
ORDER BY captured_revenue_usd DESC;`,
    solutionExplanation: 'Acota primero el intervalo semiabierto del tercer trimestre y aplica `QUALIFY ROW_NUMBER()` por `(order_id, attempt_number)` con orden determinista antes de sumar los importes por método de pago.',
    expectedOutputTable: [
      { payment_method: 'transferencia_spei', unique_attempts: 569, captured_count: 492, captured_revenue_usd: 245887.57 },
      { payment_method: 'efectivo_tienda', unique_attempts: 547, captured_count: 469, captured_revenue_usd: 219342.74 },
      { payment_method: 'billetera_digital', unique_attempts: 522, captured_count: 460, captured_revenue_usd: 175722.1 },
      { payment_method: 'card', unique_attempts: 563, captured_count: 501, captured_revenue_usd: 172168.55 }
    ]
  },

  roleNotes: {
    de: 'Como Ingeniero de Datos, parametriza siempre `start_ts` y `end_ts` en tus scripts y exige un criterio de desempate determinista (`ORDER BY processed_at DESC, payment_id ASC`) en cada deduplicación.',
    da: 'Como Analista de Datos, cuando audites tablas con eventos de pasarelas o webhooks, verifica primero si el grano real coincide con la llave de negocio antes de sumar importes.',
    bi: 'Como especialista en BI, asegúrate de saber cómo y cuándo el equipo de ingeniería ejecuta backfills históricos para refrescar las cachés o extractos incrementales de tus tableros de esos meses.'
  },

  summary: [
    'Un pipeline idempotente produce exactamente el mismo estado en destino aunque se ejecute una o diez veces sobre el mismo lote.',
    'Las funciones de reloj físico como CURRENT_DATE destruyen el determinismo; usa siempre parámetros explícitos de ventana lógica.',
    'Los intervalos semiabiertos [inicio, fin) impiden duplicar registros situados en la medianoche exacta entre dos particiones.',
    'La cláusula QUALIFY ROW_NUMBER() con orden de desempate total elimina reenvíos de webhooks de forma reproducible.'
  ],

  flashcards: [
    {
      id: 'fc-de2-pip-02-a',
      front: '¿Qué significa que una tarea de un pipeline de datos sea idempotente?',
      back: 'Que ejecutarla una vez o múltiples veces con los mismos parámetros de entrada deja la tabla destino exactamente con las mismas filas y valores.'
    },
    {
      id: 'fc-de2-pip-02-b',
      front: '¿Por qué debe evitarse CURRENT_DATE o NOW() en las cláusulas WHERE de un pipeline por lotes?',
      back: 'Porque acoplan el resultado al reloj físico del servidor e impiden reprocesar ventanas históricas (backfill) de forma determinista.'
    },
    {
      id: 'fc-de2-pip-02-c',
      front: '¿Qué cláusula de DuckDB permite filtrar directamente el resultado de ROW_NUMBER() sin envolver la consulta en otra subconsulta?',
      back: 'La cláusula QUALIFY, por ejemplo QUALIFY ROW_NUMBER() OVER (PARTITION BY order_id, attempt_number ORDER BY processed_at DESC, payment_id ASC) = 1.'
    }
  ],

  glossaryTerms: ['idempotencia-pipeline', 'reprocesamiento-historico-backfill'],

  sources: [
    {
      title: 'Maxime Beauchemin — Functional Data Engineering: a modern paradigm for batch data processing',
      url: 'https://maximebeauchemin.medium.com/functional-data-engineering-a-modern-paradigm-for-batch-data-processing-2327ec32c42a',
      publisher: 'Medium Engineering',
      accessed: '2026-10-29',
      supports: 'Paradigma de particiones inmutables, tareas puras deterministas e idempotencia en ingeniería de datos.'
    },
    {
      title: 'DuckDB Documentation — QUALIFY Clause',
      url: 'https://duckdb.org/docs/stable/sql/query_syntax/qualify',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Filtrado declarativo sobre funciones de ventana ROW_NUMBER() para deduplicación determinista.'
    },
    {
      title: 'Apache Airflow Documentation — Dag Runs & Backfill',
      url: 'https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/dag-run.html',
      publisher: 'Apache Software Foundation',
      accessed: '2026-10-29',
      supports: 'Concepto de intervalo lógico de datos y ejecución de reprocesamientos históricos (backfills).'
    }
  ],

  aiNotes: 'Si el estudiante obtiene montos ligeramente superiores en la práctica del Q3 2025, señálale que está sumando directamente la tabla `payments` sin filtrar los webhooks repetidos. Guíalo para construir primero la CTE con `QUALIFY ROW_NUMBER() OVER (PARTITION BY order_id, attempt_number ORDER BY processed_at DESC, payment_id ASC) = 1`.',

  pipelineChallenge: {
    title: 'Protocolo de reprocesamiento histórico (backfill) sin duplicados',
    scenario: 'Ordena los 4 pasos entre Ingeniería (DE), Análisis (DA) y BI para ejecutar un backfill del tercer trimestre en `payments` sin duplicar cobros ni pisar meses incorrectos.',
    steps: [
      {
        id: 'step-1',
        label: '1. Parametrizar la ventana lógica con intervalo semiabierto [inicio, fin)',
        role: 'DE',
        detail: 'Sustituir `CURRENT_DATE` por parámetros explícitos `2025-07-01` y `2025-10-01` evaluados con `>=` y `<`.'
      },
      {
        id: 'step-2',
        label: '2. Deduplicar determinísticamente y reemplazar la partición de forma atómica',
        role: 'DE',
        detail: 'Aplicar `QUALIFY ROW_NUMBER()` sobre `(order_id, attempt_number)` con orden total y sobreescribir el archivo Parquet de la partición.'
      },
      {
        id: 'step-3',
        label: '3. Verificar que el conteo único de llaves coincida con el total de filas',
        role: 'DA',
        detail: 'Comprobar en la capa Plata que `COUNT(*)` sea igual a `18.750` intentos únicos en el historial completo.'
      },
      {
        id: 'step-4',
        label: '4. Refrescar las vistas del trimestre reprocesado en el modelo de BI',
        role: 'BI',
        detail: 'Actualizar las agregaciones de métodos de pago del Q3 2025 para reflejar la recaudación corregida sin duplicados.'
      }
    ],
    explanation: 'Al parametrizar el intervalo (Paso 1) y reemplazar la partición con deduplicación determinista (Paso 2), DA confirma la unicidad (Paso 3) y BI actualiza el trimestre con seguridad (Paso 4).'
  }
};

export default lesson;
