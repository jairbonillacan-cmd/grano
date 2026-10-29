const lesson = {
  id: 'c1-sql-base-06-fechas-date-trunc',
  moduleId: 'c1-sql-base',
  tracks: ['core'],
  level: 1,
  order: 6,
  title: 'Funciones de fecha y tiempo: DATE_TRUNC y DATE_DIFF',
  minutes: 20,
  prerequisites: ['c1-sql-base-05-case-when-filter'],
  contentVersion: 1,
  hook: 'Para el cierre trimestral de Mercado Brisa, dirección pide la serie mensual de ventas de los últimos tres años. Alguien agrupa por `EXTRACT(MONTH FROM order_date)` y entrega una tabla de solo 12 filas donde enero de 2023, enero de 2024 y enero de 2025 aparecen sumados como si fueran un único mes. Además, filtra una columna `TIMESTAMP` con `BETWEEN \'2025-01-01\' AND \'2025-03-31\'` y pierde todas las ventas del 31 de marzo después de medianoche. ¿Cómo truncas y filtras el tiempo sin distorsionar los cortes?',
  objectives: [
    'Truncar fechas y marcas de tiempo al inicio de su semana, mes o trimestre con DATE_TRUNC diferenciándolo de EXTRACT.',
    'Calcular el tiempo transcurrido entre dos fechas con DATE_DIFF y desplazar fechas con INTERVAL.',
    'Filtrar columnas TIMESTAMP mediante intervalos semiabiertos (>= inicio AND < fin) sin perder horas del último día.'
  ],
  sections: [
    {
      id: 'date-trunc-frente-a-extract',
      heading: 'Por qué agrupar series temporales exige DATE_TRUNC y no EXTRACT',
      body: 'En la tabla `orders` de Mercado Brisa conviven dos columnas temporales: `order_date` (tipo `DATE`, como `2025-03-18`) y `order_ts` (tipo `TIMESTAMP`, como `2025-03-18 14:25:00`). Para resumir ventas por mes o trimestre existen dos funciones con propósitos distintos: `EXTRACT` (o `DATE_PART`) y **DATE_TRUNC**.\n\n`EXTRACT(MONTH FROM order_date)` extrae solo el número entero del mes (`1` a `12`) y descarta el año. Si tu tabla abarca de 2023 a 2025 y agrupas por ese número, mezclas tres eneros distintos en la misma fila. En cambio, `DATE_TRUNC(\'month\', order_date)` redondea la fecha hacia atrás al primer día del mes conservando el año (`2025-03-18` pasa a `2025-03-01`). Así cada mes mantiene su propia cubeta cronológica (`week`, `month`, `quarter`, `year`).',
      example: {
        language: 'sql',
        code: `SELECT
  store_code,
  opened_date,
  DATE_DIFF('month', opened_date, DATE '2025-12-01') AS months_open
FROM stores
WHERE store_type = 'flagship'
ORDER BY months_open DESC;`,
        expectedOutput: [
          {
            store_code: 'STR-MX-01',
            opened_date: '2021-03-15',
            months_open: 57
          },
          {
            store_code: 'STR-CO-01',
            opened_date: '2021-05-20',
            months_open: 55
          },
          {
            store_code: 'STR-CL-01',
            opened_date: '2021-09-01',
            months_open: 51
          },
          {
            store_code: 'STR-ES-01',
            opened_date: '2021-11-05',
            months_open: 49
          }
        ]
      }
    },
    {
      id: 'diferencias-con-date-diff-e-interval',
      heading: 'Cómo medir distancias temporales con DATE_DIFF y sumar INTERVAL',
      body: 'Para calcular cuántos días, meses o años separan dos fechas en DuckDB se utiliza **DATE_DIFF** con la sintaxis `DATE_DIFF(unidad, fecha_inicio, fecha_fin)`. El primer argumento es la unidad entre comillas simples (`\'day\'`, `\'month\'`, `\'year\'`). El segundo es la fecha inicial y el tercero es la fecha final. Cuando `fecha_fin` es posterior a `fecha_inicio`, devuelve un entero positivo con las fronteras cruzadas.\n\nSi en lugar de restar dos fechas quieres desplazar una fecha, suma o resta un literal `INTERVAL`. Por ejemplo, `DATE \'2025-01-01\' + INTERVAL \'3 months\'` devuelve `2025-04-01`. Del mismo modo, `order_ts - INTERVAL \'24 hours\'` retrocede un día completo respetando años bisiestos y longitudes de mes.'
    },
    {
      id: 'peligro-de-between-en-timestamps',
      heading: 'La trampa de BETWEEN sobre TIMESTAMP y el intervalo semiabierto',
      body: 'Supón que filtras los pedidos del primer trimestre de 2025 usando `order_ts` y escribes `WHERE order_ts BETWEEN \'2025-01-01\' AND \'2025-03-31\'`. Al comparar un `TIMESTAMP` contra una fecha sin hora (`\'2025-03-31\'`), SQL la completa a medianoche: `2025-03-31 00:00:00`. Un pedido del 31 de marzo a las `09:15:00` es mayor que medianoche y queda fuera del reporte.\n\nTampoco conviene escribir `2025-03-31 23:59:59`, porque los motores actuales guardan microsegundos (`23:59:59.500000` quedaría fuera). El patrón seguro para cualquier columna `TIMESTAMP` es el **intervalo semiabierto** `[inicio, fin)`. Incluye el inicio exacto con `>=` y excluye el inicio del periodo siguiente con `<` (`WHERE order_ts >= TIMESTAMP \'2025-01-01 00:00:00\' AND order_ts < TIMESTAMP \'2025-04-01 00:00:00\'`).'
    },
    {
      id: 'cuando-usar-extract-con-sentido',
      heading: 'Cuándo sí tiene sentido usar EXTRACT o DATE_PART',
      body: 'Si `DATE_TRUNC` es la función indicada para series cronológicas, ¿cuándo conviene usar `EXTRACT(parte FROM fecha)`? Conviene cuando buscas estudiar estacionalidad cíclica reuniendo distintos periodos entre sí.\n\nPor ejemplo, si Operaciones quiere saber a qué hora del día (`0` a `23`) ocurren más compras web, agrupar por `EXTRACT(HOUR FROM order_ts)` suma las compras de las 14:00 horas de todos los días del año. Igualmente, `EXTRACT(ISODOW FROM order_date)` (donde `1` es lunes y `7` es domingo) permite comparar los sábados frente a los martes. La regla es simple: usa `DATE_TRUNC` para líneas de tiempo continuas y `EXTRACT` para ciclos horarios o semanales.'
    }
  ],
  workedExample: {
    title: 'Ventas mensuales del primer trimestre: EXTRACT(MONTH) frente a DATE_TRUNC e intervalo semiabierto',
    description: 'Compara el error de agrupar `orders` por `EXTRACT(MONTH FROM order_date)` sin acotar el año frente a truncar con `DATE_TRUNC(\'month\', order_date)` filtrando el primer trimestre de 2025 con un intervalo semiabierto.',
    steps: [
      {
        label: 'Antipatrón: EXTRACT(MONTH) mezcla pedidos de 2023, 2024 y 2025 en la misma fila',
        explanation: 'Al agrupar por `EXTRACT(MONTH FROM order_date)`, el grupo `month_num = 1` suma pedidos desde el `2023-01-07` hasta el `2025-01-31`, inflando casi al triple el volumen de cada mes.',
        code: `SELECT
  EXTRACT(MONTH FROM order_date) AS month_num,
  COUNT(*) AS total_orders,
  MIN(order_date) AS first_date_in_bucket,
  MAX(order_date) AS last_date_in_bucket
FROM orders
WHERE EXTRACT(MONTH FROM order_date) <= 3
GROUP BY month_num
ORDER BY month_num ASC;`,
        expectedOutput: [
          {
            month_num: 1,
            total_orders: 1251,
            first_date_in_bucket: '2023-01-07',
            last_date_in_bucket: '2025-01-31'
          },
          {
            month_num: 2,
            total_orders: 1223,
            first_date_in_bucket: '2023-02-03',
            last_date_in_bucket: '2025-02-28'
          },
          {
            month_num: 3,
            total_orders: 1444,
            first_date_in_bucket: '2023-03-01',
            last_date_in_bucket: '2025-03-31'
          }
        ]
      },
      {
        label: 'Solución verificada: DATE_TRUNC(\'month\', ...) con filtro semiabierto [inicio, fin)',
        explanation: 'Truncar con `DATE_TRUNC(\'month\', order_date)::DATE` preserva año y mes (`2025-01-01`, `2025-02-01`, `2025-03-01`), y el filtro `< TIMESTAMP \'2025-04-01 00:00:00\'` incluye hasta el último segundo del 31 de marzo.',
        code: `SELECT
  DATE_TRUNC('month', order_date)::DATE AS order_month,
  COUNT(*) AS total_orders,
  ROUND(SUM(total_usd), 2) AS gross_sales_usd
FROM orders
WHERE order_ts >= TIMESTAMP '2025-01-01 00:00:00'
  AND order_ts < TIMESTAMP '2025-04-01 00:00:00'
GROUP BY order_month
ORDER BY order_month ASC;`,
        expectedOutput: [
          {
            order_month: '2025-01-01',
            total_orders: 684,
            gross_sales_usd: 314278.72
          },
          {
            order_month: '2025-02-01',
            total_orders: 679,
            gross_sales_usd: 290316.1
          },
          {
            order_month: '2025-03-01',
            total_orders: 733,
            gross_sales_usd: 322996.38
          }
        ]
      }
    ]
  },
  checks: [
    {
      id: 'chk-c1-sql-06-date-trunc',
      type: 'predict-output',
      prompt: '¿Qué valor devuelve `DATE_TRUNC(\'quarter\', DATE \'2025-08-19\')::DATE` en DuckDB o PostgreSQL?',
      options: [
        {
          id: 'a',
          text: '\'2025-07-01\', porque agosto pertenece al tercer trimestre (julio–septiembre) y DATE_TRUNC devuelve el primer día del trimestre.',
          correct: true,
          feedback: 'Exacto. Los cuatro trimestres del año natural empiezan el 1 de enero, 1 de abril, 1 de julio y 1 de octubre.'
        },
        {
          id: 'b',
          text: '3, porque agosto cae en el trimestre número 3 del año.',
          correct: false,
          feedback: 'Incorrecto. Devolver el entero 3 es lo que hace EXTRACT(QUARTER FROM ...), no DATE_TRUNC.'
        },
        {
          id: 'c',
          text: '\'2025-08-01\', porque trunca únicamente el día al inicio del mes de agosto.',
          correct: false,
          feedback: 'Incorrecto. \'2025-08-01\' es el resultado de DATE_TRUNC(\'month\', ...), no de \'quarter\'.'
        }
      ],
      explanation: 'DATE_TRUNC(\'quarter\', fecha) conserva el año y lleva el mes y el día al inicio exacto del trimestre correspondiente (`01-01`, `04-01`, `07-01` o `10-01`).'
    },
    {
      id: 'chk-c1-sql-06-between-ts',
      type: 'mcq',
      prompt: 'Tienes la columna `event_ts` (tipo `TIMESTAMP`) y quieres contar todos los eventos ocurridos durante enero de 2025. ¿Qué condición `WHERE` evita perder eventos del día 31 de enero?',
      options: [
        {
          id: 'a',
          text: 'WHERE event_ts >= TIMESTAMP \'2025-01-01 00:00:00\' AND event_ts < TIMESTAMP \'2025-02-01 00:00:00\'',
          correct: true,
          feedback: 'Correcto. El intervalo semiabierto `[2025-01-01, 2025-02-01)` cubre todo el día 31 de enero hasta el último microsegundo antes de febrero.'
        },
        {
          id: 'b',
          text: 'WHERE event_ts BETWEEN \'2025-01-01\' AND \'2025-01-31\'',
          correct: false,
          feedback: 'Incorrecto. \'2025-01-31\' se interpreta como \'2025-01-31 00:00:00\' y deja fuera las 24 horas del día 31.'
        },
        {
          id: 'c',
          text: 'WHERE EXTRACT(MONTH FROM event_ts) = 1',
          correct: false,
          feedback: 'Incorrecto. Sin filtrar el año, incluirías también los eventos de enero de 2023 y enero de 2024.'
        }
      ],
      explanation: 'Usar `>= inicio_periodo AND < inicio_periodo_siguiente` es el patrón estándar para filtrar marcas de tiempo sin depender de la resolución de segundos o microsegundos.'
    },
    {
      id: 'chk-c1-sql-06-datediff',
      type: 'predict-output',
      prompt: 'En un pedido entregado, `order_date` es `DATE \'2025-05-10\'` y `refund_date` es `DATE \'2025-05-18\'`. ¿Qué devuelve `DATE_DIFF(\'day\', order_date, refund_date)` en DuckDB?',
      options: [
        {
          id: 'a',
          text: '8, porque transcurrieron 8 días desde la fecha de compra (inicio) hasta la fecha de reembolso (fin).',
          correct: true,
          feedback: 'Exacto. En DuckDB, DATE_DIFF(unidad, fecha_inicio, fecha_fin) resta fecha_fin menos fecha_inicio en la unidad indicada.'
        },
        {
          id: 'b',
          text: '-8, porque el primer argumento de fecha siempre se resta del segundo al revés.',
          correct: false,
          feedback: 'Incorrecto. En DuckDB el orden de los parámetros es (unidad, fecha_inicio, fecha_fin), por lo que cuando fin > inicio el resultado es positivo.'
        },
        {
          id: 'c',
          text: '\'2025-05-08\', porque DATE_DIFF devuelve una nueva fecha en lugar de un número entero.',
          correct: false,
          feedback: 'Incorrecto. DATE_DIFF devuelve siempre un número entero (BIGINT) con la cantidad de unidades transcurridas.'
        }
      ],
      explanation: 'En DuckDB, la función `DATE_DIFF(part, startdate, enddate)` cuenta las fronteras de unidad entre la fecha inicial y la final, devolviendo un entero positivo cuando `enddate > startdate`.'
    }
  ],
  practice: {
    type: 'sql',
    title: 'Ingresos y pedidos completados por trimestre en 2025',
    language: 'sql',
    prompt: 'Agrupa los pedidos completados (`status = \'completed\'`) del año 2025 (`order_date >= DATE \'2025-01-01\' AND order_date < DATE \'2026-01-01\'`) en la tabla `orders` de Mercado Brisa por inicio de trimestre usando `DATE_TRUNC(\'quarter\', order_date)::DATE AS quarter_start`. Devuelve `quarter_start`, `COUNT(*) AS completed_orders` y `ROUND(SUM(total_usd), 2) AS revenue_usd`, ordenados cronológicamente por `quarter_start ASC`.',
    starterCode: `SELECT
  DATE_TRUNC('month', order_date)::DATE AS quarter_start,
  COUNT(*) AS completed_orders,
  ROUND(SUM(total_usd), 2) AS revenue_usd
FROM orders
WHERE status = 'completed'
  AND order_date >= DATE '2025-01-01'
GROUP BY quarter_start
ORDER BY quarter_start ASC;`,
    expected: `SELECT
  DATE_TRUNC('quarter', order_date)::DATE AS quarter_start,
  COUNT(*) AS completed_orders,
  ROUND(SUM(total_usd), 2) AS revenue_usd
FROM orders
WHERE status = 'completed'
  AND order_date >= DATE '2025-01-01'
  AND order_date < DATE '2026-01-01'
GROUP BY quarter_start
ORDER BY quarter_start ASC;`,
    orderMatters: true,
    hints: [
      'Cambia el primer argumento de `DATE_TRUNC` de `\'month\'` a `\'quarter\'` para truncar al primer día de cada trimestre.',
      'En el `WHERE`, asegúrate de acotar el límite superior del año con `AND order_date < DATE \'2026-01-01\'`.',
      'Mantén `GROUP BY quarter_start` y `ORDER BY quarter_start ASC` para obtener los 4 trimestres de 2025 en orden.'
    ],
    solution: `SELECT
  DATE_TRUNC('quarter', order_date)::DATE AS quarter_start,
  COUNT(*) AS completed_orders,
  ROUND(SUM(total_usd), 2) AS revenue_usd
FROM orders
WHERE status = 'completed'
  AND order_date >= DATE '2025-01-01'
  AND order_date < DATE '2026-01-01'
GROUP BY quarter_start
ORDER BY quarter_start ASC;`,
    solutionExplanation: 'Trunca `order_date` con `DATE_TRUNC(\'quarter\', order_date)::DATE AS quarter_start`, filtra los pedidos completados dentro del intervalo `[2025-01-01, 2026-01-01)` y agrupa por `quarter_start`.',
    expectedOutputTable: [
      {
        quarter_start: '2025-01-01',
        completed_orders: 1739,
        revenue_usd: 775823.98
      },
      {
        quarter_start: '2025-04-01',
        completed_orders: 1769,
        revenue_usd: 751550.42
      },
      {
        quarter_start: '2025-07-01',
        completed_orders: 1750,
        revenue_usd: 731146.29
      },
      {
        quarter_start: '2025-10-01',
        completed_orders: 1024,
        revenue_usd: 428307.88
      }
    ]
  },
  roleNotes: {
    de: 'En tablas particionadas por fecha, escribe siempre filtros directos sobre la columna sin envolverla en funciones (`order_ts >= \'2025-01-01\' AND order_ts < \'2026-01-01\'` en vez de `EXTRACT(YEAR FROM order_ts) = 2025`) para que el motor aproveche los metadatos de Parquet.',
    da: 'Al comparar el último trimestre o el último mes en una serie temporal, verifica con `MAX(order_date)` hasta qué fecha llegan los datos (en Mercado Brisa llegan al `2025-11-26`) para no interpretar un trimestre aún incompleto como una caída de ventas.',
    bi: 'En el modelo semántico, vincula las fechas truncadas o diarias con la tabla `calendar` oficial de la empresa para incorporar festivos, semanas ISO y trimestres fiscales sin repetir lógica en cada reporte.'
  },
  summary: [
    'DATE_TRUNC redondea una fecha hacia atrás al primer día u hora de la unidad elegida conservando el año.',
    'EXTRACT devuelve solo el número de la parte (mes 1..12, hora 0..23) y mezcla años distintos si agrupas por él en solitario.',
    'DATE_DIFF(unidad, inicio, fin) calcula cuántas fronteras de esa unidad separan dos fechas.',
    'Filtra columnas TIMESTAMP con intervalos semiabiertos (`>= inicio AND < fin_siguiente`) en lugar de BETWEEN con fechas.'
  ],
  flashcards: [
    {
      id: 'fc-c1-sql-06-a',
      front: '¿Por qué debes usar `DATE_TRUNC(\'month\', fecha)` en lugar de `EXTRACT(MONTH FROM fecha)` para construir una serie mensual de varios años?',
      back: 'Porque `DATE_TRUNC` conserva el año (`2025-01-01`), mientras que `EXTRACT(MONTH ...)` devuelve solo `1..12` y suma juntos los mismos meses de años diferentes.'
    },
    {
      id: 'fc-c1-sql-06-b',
      front: '¿Qué problema causa filtrar una columna `TIMESTAMP` con `WHERE order_ts BETWEEN \'2025-01-01\' AND \'2025-01-31\'`?',
      back: 'El límite superior se evalúa como `2025-01-31 00:00:00` y descarta todos los registros ocurridos durante el día 31 de enero después de la medianoche.'
    },
    {
      id: 'fc-c1-sql-06-c',
      front: '¿Cómo se escribe en SQL el intervalo semiabierto para filtrar todo el mes de marzo de 2025 sobre una columna `TIMESTAMP`?',
      back: '`WHERE col >= TIMESTAMP \'2025-03-01 00:00:00\' AND col < TIMESTAMP \'2025-04-01 00:00:00\'`.'
    }
  ],
  glossaryTerms: ['truncado-temporal-date-trunc', 'agregacion-group-by', 'predicado-where'],
  sources: [
    {
      title: 'DuckDB SQL Reference — Date Functions (date_trunc, date_diff, extract)',
      url: 'https://duckdb.org/docs/stable/sql/functions/date',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Definición, argumentos y ejemplos de date_trunc, date_diff y extract sobre tipo DATE.'
    },
    {
      title: 'DuckDB SQL Reference — Timestamp Functions',
      url: 'https://duckdb.org/docs/stable/sql/functions/timestamp',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Operaciones con TIMESTAMP, INTERVAL y truncado temporal.'
    },
    {
      title: 'PostgreSQL 17 Documentation — Section 9.9: Date/Time Functions and Operators',
      url: 'https://www.postgresql.org/docs/17/functions-datetime.html',
      publisher: 'PostgreSQL Global Development Group',
      accessed: '2026-10-29',
      supports: 'Comportamiento estándar de date_trunc frente a EXTRACT y comparación de marcas de tiempo.'
    }
  ],
  aiNotes: 'El alumno suele tropezar en dos puntos: 1) usar `EXTRACT(MONTH FROM order_date)` para graficar ventas mensuales sin notar que está sumando 2023, 2024 y 2025; 2) invertir el orden de fechas en `DATE_DIFF(\'day\', inicio, fin)` (recuérdale que en DuckDB va primero la fecha inicial y luego la final, al revés que en BigQuery).'
};

export default lesson;
