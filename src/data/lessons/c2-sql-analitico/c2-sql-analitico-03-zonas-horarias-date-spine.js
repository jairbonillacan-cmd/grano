const lesson = {
  id: 'c2-sql-analitico-03-zonas-horarias-date-spine',
  moduleId: 'c2-sql-analitico',
  tracks: ['core'],
  level: 2,
  order: 3,
  title: 'Zonas horarias y espinas de calendario (Date Spine)',
  minutes: 25,
  prerequisites: ['c2-sql-analitico-01-window-functions', 'c1-sql-joins-01'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), `events` registra 13 000 sesiones desde Ciudad de México (`-06:00`), pero `event_ts` se guarda en UTC. Al agrupar por día con `CAST(event_ts AS DATE)`, 3 586 eventos nocturnos saltan al día siguiente. Además, la tienda `store_id = 14` no tuvo ventas el 3 de enero de 2025: promediar enero directo en `orders` divide entre 25 días en vez de 31 e infla la media de $1,181.75 a $1,465.38 USD. ¿Cómo corriges el huso horario y rellenas los días vacíos con una espina de calendario?',

  objectives: [
    'Convertir marcas temporales UTC a fechas locales antes de truncar por día o semana para evitar sesgos de corte nocturno.',
    'Construir una espina de calendario (Date Spine) mediante LEFT JOIN y COALESCE para materializar días con cero actividad.',
    'Calcular promedios diarios y medias móviles exactas sobre series temporales continuas sin huecos de calendario.'
  ],

  sections: [
    {
      id: 'almacenar-en-utc-agregar-en-hora-local',
      heading: 'Almacenar en UTC, agregar en la zona horaria del negocio',
      body: 'En ingeniería de datos existe una regla clara: los eventos se almacenan en tiempo universal coordinado (`UTC`). Sin embargo, los reportes diarios se agregan en la zona horaria donde opera el negocio.\n\nSi truncas `event_ts` directamente en UTC con `CAST(event_ts AS DATE)` o `DATE_TRUNC(\'day\', event_ts)`, las compras de Ciudad de México (`-06:00`) posteriores a las 18:00 horas cruzan las 00:00 UTC. Como consecuencia, esas ventas se contabilizan en el día calendario siguiente.\n\nEste desfase nocturno distorsiona cierres contables y atribuciones de campañas que vencen a medianoche. También altera las comparativas contra metas diarias de tienda física. Antes de agrupar por fecha calendario, debes desplazar el instante UTC al huso horario local con `AT TIME ZONE` o sumando el intervalo correspondiente. Recién después debes extraer la fecha (`DATE`).'
    },
    {
      id: 'medir-el-sesgo-de-truncar-en-utc',
      heading: 'Medir el sesgo de truncar en UTC en Mercado Brisa',
      body: 'La tabla `events` de Mercado Brisa almacena `65 000` eventos con su instante en UTC (`event_ts`) y el desplazamiento horario de la sesión en `timezone_offset` (`-06:00`, `-05:00`, `-03:00`, `Z` y `+01:00`).\n\n¿Cuántos eventos cambian de fecha calendario si olvidamos aplicar el desplazamiento local antes de extraer el día? En una distribución uniforme de actividad a lo largo de 24 horas, un huso de `-06:00` desplaza cerca de una cuarta parte (`6 / 24 = 25 %`) de las sesiones al día siguiente en UTC.\n\nPodemos comprobarlo en DuckDB comparando `CAST(event_ts AS DATE)` frente a la fecha obtenida tras aplicar el intervalo de `timezone_offset`. En el segmento `-06:00`, `3 586` de los `13 000` eventos (`27,58 %`) caen en un día calendario distinto al real.',
      example: {
        language: 'sql',
        code: `WITH eventos_locales AS (
  SELECT
    timezone_offset,
    CAST(event_ts AS DATE) AS fecha_utc,
    CAST(
      CASE timezone_offset
        WHEN '-06:00' THEN event_ts - INTERVAL 6 HOURS
        WHEN '-05:00' THEN event_ts - INTERVAL 5 HOURS
        WHEN '-03:00' THEN event_ts - INTERVAL 3 HOURS
        WHEN '+01:00' THEN event_ts + INTERVAL 1 HOUR
        ELSE event_ts
      END AS DATE
    ) AS fecha_local
  FROM events
)
SELECT
  timezone_offset,
  COUNT(*) AS total_eventos,
  SUM(CASE WHEN fecha_utc <> fecha_local THEN 1 ELSE 0 END) AS eventos_dia_distinto,
  ROUND(
    100.0 * SUM(CASE WHEN fecha_utc <> fecha_local THEN 1 ELSE 0 END) / COUNT(*),
    2
  ) AS pct_desfase_diario
FROM eventos_locales
GROUP BY timezone_offset
ORDER BY timezone_offset;`,
        expectedOutput: [
          {
            timezone_offset: '+01:00',
            total_eventos: 13000,
            eventos_dia_distinto: 653,
            pct_desfase_diario: 5.02
          },
          {
            timezone_offset: '-03:00',
            total_eventos: 13000,
            eventos_dia_distinto: 1874,
            pct_desfase_diario: 14.42
          },
          {
            timezone_offset: '-05:00',
            total_eventos: 13000,
            eventos_dia_distinto: 3106,
            pct_desfase_diario: 23.89
          },
          {
            timezone_offset: '-06:00',
            total_eventos: 13000,
            eventos_dia_distinto: 3586,
            pct_desfase_diario: 27.58
          },
          {
            timezone_offset: 'Z',
            total_eventos: 13000,
            eventos_dia_distinto: 0,
            pct_desfase_diario: 0
          }
        ]
      }
    },
    {
      id: 'dias-invisibles-y-espina-de-calendario',
      heading: 'Días invisibles y la espina de calendario (Date Spine)',
      body: 'Las tablas de hechos como `orders` solo registran filas cuando ocurre un evento. Si una sucursal no registra ventas el viernes 3 de enero, esa fecha no existe en `orders`.\n\nOmitir los días sin actividad provoca dos errores analíticos:\n- **Sesgo de denominador en `AVG()`:** Si una tienda vende en `25` de los `31` días de enero, calcular `AVG(ventas_diarias)` sobre la tabla agregada divide el ingreso mensual entre `25` en lugar de `31`. Eso infla el promedio diario en un `24 %`.\n- **Desfase en ventanas `ROWS BETWEEN`:** Una media móvil de 7 días con `ROWS BETWEEN 6 PRECEDING AND CURRENT ROW` cuenta 6 filas físicas hacia atrás. Si faltan 2 días sin ventas en medio, la ventana abarca en realidad 9 días calendario.\n\nPara corregirlo se utiliza una **espina de calendario** (*Date Spine*): una tabla con una fila por cada día natural (`calendar` en Mercado Brisa, o generada con `GENERATE_SERIES`). La espina actúa como tabla izquierda en un `LEFT JOIN` y `COALESCE(ventas_usd, 0)` convierte las ausencias en ceros explícitos.',
      interactive: {
        component: 'window-frames',
        caption: 'Simulador interactivo: observa cómo los huecos de calendario afectan el promedio en marcos de ventana cuando no se materializan los días sin actividad.'
      }
    },
    {
      id: 'promedio-diario-real-frente-a-sin-espina',
      heading: 'Promedio diario real frente a promedio sin espina',
      body: 'Para construir una serie temporal sin eliminar los días vacíos, el patrón seguro en SQL consta de dos etapas. Primero, en una CTE (`ventas_enero_tienda_14`), filtras `orders` por tienda y estado (`store_id = 14 AND status = \'completed\'`) y agrupas por `order_date`. Segundo, en la consulta principal partes de `calendar c`, acotas el rango en `c.calendar_date` y aplicas `LEFT JOIN ventas_enero_tienda_14 v ON c.calendar_date = v.order_date`.\n\nSi pusieras `WHERE v.store_id = 14` fuera de la CTE en la consulta externa, eliminarías las filas donde el `LEFT JOIN` produjo `NULL` y perderías los días sin ventas.\n\nComparemos ambos enfoques para la tienda `14` en enero de 2025 (`31` días naturales). La tienda facturó `$36,634.39` USD en `25` días activos y tuvo `6` días sin pedidos completados. Sin espina de calendario, el promedio diario aparenta ser `$1,465.38` USD; con la espina completa de `31` días, el promedio real es `$1,181.75` USD.',
      example: {
        language: 'sql',
        code: `WITH ventas_enero_tienda_14 AS (
  SELECT
    order_date,
    SUM(total_usd) AS ventas_dia_usd
  FROM orders
  WHERE status = 'completed'
    AND store_id = 14
    AND order_date BETWEEN DATE '2025-01-01' AND DATE '2025-01-31'
  GROUP BY order_date
)
SELECT
  COUNT(c.calendar_date) AS dias_calendario,
  COUNT(v.order_date) AS dias_con_ventas,
  COUNT(c.calendar_date) - COUNT(v.order_date) AS dias_sin_ventas,
  ROUND(SUM(COALESCE(v.ventas_dia_usd, 0)), 2) AS ingresos_enero_usd,
  ROUND(AVG(v.ventas_dia_usd), 2) AS promedio_solo_dias_activos,
  ROUND(AVG(COALESCE(v.ventas_dia_usd, 0)), 2) AS promedio_real_con_spine
FROM calendar c
LEFT JOIN ventas_enero_tienda_14 v
  ON c.calendar_date = v.order_date
WHERE c.calendar_date BETWEEN DATE '2025-01-01' AND DATE '2025-01-31';`,
        expectedOutput: [
          {
            dias_calendario: 31,
            dias_con_ventas: 25,
            dias_sin_ventas: 6,
            ingresos_enero_usd: 36634.39,
            promedio_solo_dias_activos: 1465.38,
            promedio_real_con_spine: 1181.75
          }
        ]
      }
    }
  ],

  workedExample: {
    title: 'Serie diaria continua y media móvil sobre espina de calendario en store_id = 14',
    description: 'El equipo de operaciones monitorea el arranque de año de la sucursal `store_id = 14` durante la primera semana de enero de 2025 (`2025-01-01` al `2025-01-07`). Construye la serie diaria garantizando que aparezcan los 7 días calendario, rellena con 0 el viernes `2025-01-03` sin ventas y calcula la media móvil de 3 y 7 días.',
    audit: 'Al anclar la consulta en calendar con LEFT JOIN y COALESCE, el viernes 2025-01-03 aparece con 0.00 USD y la media móvil de 3 días cae de 411.37 a 274.24 USD en lugar de saltar directamente al sábado 4 de enero.',
    steps: [
      {
        label: 'Paso 1 — Agrupar orders directamente (omite el viernes 2025-01-03)',
        explanation: 'Si agrupamos `orders` para `store_id = 14` entre el 1 y el 7 de enero de 2025, obtenemos solo 6 filas porque el viernes `2025-01-03` no hubo pedidos completados.',
        code: `SELECT
  order_date,
  COUNT(order_id) AS pedidos,
  ROUND(SUM(total_usd), 2) AS ventas_usd
FROM orders
WHERE status = 'completed'
  AND store_id = 14
  AND order_date BETWEEN DATE '2025-01-01' AND DATE '2025-01-07'
GROUP BY order_date
ORDER BY order_date;`,
        expectedOutput: [
          { order_date: '2025-01-01', pedidos: 1, ventas_usd: 575.88 },
          { order_date: '2025-01-02', pedidos: 1, ventas_usd: 246.85 },
          { order_date: '2025-01-04', pedidos: 5, ventas_usd: 2858.63 },
          { order_date: '2025-01-05', pedidos: 4, ventas_usd: 2850.8 },
          { order_date: '2025-01-06', pedidos: 3, ventas_usd: 2156.73 },
          { order_date: '2025-01-07', pedidos: 4, ventas_usd: 2326.74 }
        ]
      },
      {
        label: 'Paso 2 — Anclar en calendar con LEFT JOIN, COALESCE y medias móviles',
        explanation: 'Unimos `calendar` como tabla izquierda contra la CTE de ventas diarias y aplicamos las ventanas `ROWS BETWEEN 2 PRECEDING` y `ROWS BETWEEN 6 PRECEDING` sobre `COALESCE(v.ventas_usd, 0.0)`.',
        code: `WITH ventas_diarias AS (
  SELECT
    order_date,
    COUNT(order_id) AS pedidos,
    ROUND(SUM(total_usd), 2) AS ventas_usd
  FROM orders
  WHERE status = 'completed'
    AND store_id = 14
    AND order_date BETWEEN DATE '2025-01-01' AND DATE '2025-01-07'
  GROUP BY order_date
)
SELECT
  c.calendar_date,
  c.day_name,
  COALESCE(v.pedidos, 0) AS pedidos,
  COALESCE(v.ventas_usd, 0.0) AS ventas_usd,
  ROUND(
    AVG(COALESCE(v.ventas_usd, 0.0)) OVER (
      ORDER BY c.calendar_date
      ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ),
    2
  ) AS media_movil_3d_usd,
  ROUND(
    AVG(COALESCE(v.ventas_usd, 0.0)) OVER (
      ORDER BY c.calendar_date
      ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ),
    2
  ) AS media_movil_7d_usd
FROM calendar c
LEFT JOIN ventas_diarias v
  ON c.calendar_date = v.order_date
WHERE c.calendar_date BETWEEN DATE '2025-01-01' AND DATE '2025-01-07'
ORDER BY c.calendar_date;`,
        expectedOutput: [
          {
            calendar_date: '2025-01-01',
            day_name: 'Miércoles',
            pedidos: 1,
            ventas_usd: 575.88,
            media_movil_3d_usd: 575.88,
            media_movil_7d_usd: 575.88
          },
          {
            calendar_date: '2025-01-02',
            day_name: 'Jueves',
            pedidos: 1,
            ventas_usd: 246.85,
            media_movil_3d_usd: 411.37,
            media_movil_7d_usd: 411.37
          },
          {
            calendar_date: '2025-01-03',
            day_name: 'Viernes',
            pedidos: 0,
            ventas_usd: 0,
            media_movil_3d_usd: 274.24,
            media_movil_7d_usd: 274.24
          },
          {
            calendar_date: '2025-01-04',
            day_name: 'Sábado',
            pedidos: 5,
            ventas_usd: 2858.63,
            media_movil_3d_usd: 1035.16,
            media_movil_7d_usd: 920.34
          },
          {
            calendar_date: '2025-01-05',
            day_name: 'Domingo',
            pedidos: 4,
            ventas_usd: 2850.8,
            media_movil_3d_usd: 1903.14,
            media_movil_7d_usd: 1306.43
          },
          {
            calendar_date: '2025-01-06',
            day_name: 'Lunes',
            pedidos: 3,
            ventas_usd: 2156.73,
            media_movil_3d_usd: 2622.05,
            media_movil_7d_usd: 1448.15
          },
          {
            calendar_date: '2025-01-07',
            day_name: 'Martes',
            pedidos: 4,
            ventas_usd: 2326.74,
            media_movil_3d_usd: 2444.76,
            media_movil_7d_usd: 1573.66
          }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'chk-c2-03-1',
      type: 'mcq',
      prompt: 'Una tienda en Ciudad de México (`UTC-06:00`) registra una venta a las `21:30` hora local del 15 de enero. El servidor guarda `event_ts = 2025-01-16 03:30:00` en UTC. ¿Qué ocurre si agrupas las ventas diarias usando `DATE_TRUNC(\'day\', event_ts)` sin convertir antes a la zona horaria local?',
      options: [
        {
          id: 'a',
          text: 'La venta se asigna al 16 de enero porque en UTC ya cruzó la medianoche, desplazando los ingresos vespertinos al día siguiente.',
          correct: true,
          feedback: 'Exacto. A las 21:30 en UTC-06:00 el reloj UTC marca las 03:30 del día 16. Truncar directamente en UTC asigna las últimas 6 horas de cada día al día posterior.'
        },
        {
          id: 'b',
          text: 'El motor convierte automáticamente el timestamp al huso horario del navegador de quien ejecuta la consulta.',
          correct: false,
          feedback: 'Incorrecto. DATE_TRUNC sobre una marca UTC trunca respecto a las 00:00 UTC a menos que conviertas explícitamente la zona horaria antes.'
        },
        {
          id: 'c',
          text: 'DATE_TRUNC elimina la hora pero conserva el desplazamiento local de la tienda original.',
          correct: false,
          feedback: 'Incorrecto. Si la fecha ya cambió de día en UTC, truncar a medianoche fija el día equivocado.'
        }
      ],
      explanation: 'Siempre debes convertir el instante UTC a la zona horaria operativa del negocio antes de aplicar DATE_TRUNC o CAST(... AS DATE).'
    },
    {
      id: 'chk-c2-03-2',
      type: 'mcq',
      prompt: 'Construyes una espina con `FROM calendar c LEFT JOIN orders o ON c.calendar_date = o.order_date`, pero escribes `WHERE o.store_id = 14 AND o.status = \'completed\'` al final de la consulta. ¿Qué sucede con los días en que la tienda 14 tuvo cero ventas?',
      options: [
        {
          id: 'a',
          text: 'Desaparecen del resultado porque en esos días o.store_id y o.status son NULL, convirtiendo el LEFT JOIN en un INNER JOIN.',
          correct: true,
          feedback: 'Exacto. Filtrar columnas de la tabla derecha en el WHERE externo descarta las filas donde el LEFT JOIN generó NULL.'
        },
        {
          id: 'b',
          text: 'Se conservan con valores NULL porque el LEFT JOIN tiene prioridad sobre la cláusula WHERE.',
          correct: false,
          feedback: 'Incorrecto. En el orden lógico de SQL, WHERE se evalúa después de FROM/JOIN y elimina cualquier fila donde la condición sea UNKNOWN (NULL).'
        },
        {
          id: 'c',
          text: 'DuckDB rellena automáticamente o.store_id = 14 en los días vacíos del calendario.',
          correct: false,
          feedback: 'Incorrecto. Debes filtrar y preagregar orders en una CTE previa antes de hacer el LEFT JOIN desde calendar.'
        }
      ],
      explanation: 'Para preservar todos los días de la espina calendar, filtra store_id y status dentro de una CTE previa o en la condición ON del LEFT JOIN, nunca en el WHERE externo.'
    },
    {
      id: 'chk-c2-03-3',
      type: 'mcq',
      prompt: 'Si calculas `AVG(COALESCE(v.ventas_usd, 0.0)) OVER (ORDER BY c.calendar_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)` sobre una espina continua, ¿por qué debes envolver `v.ventas_usd` con `COALESCE(..., 0.0)` dentro de `AVG()`?',
      options: [
        {
          id: 'a',
          text: 'Porque AVG() ignora los valores NULL: sin COALESCE dividiría la suma entre solo los días con ventas de esa semana en lugar de dividir entre 7 días.',
          correct: true,
          feedback: 'Correcto. En SQL todas las funciones de agregación ignoran NULL salvo COUNT(*). Sin COALESCE, un día sin ventas no aportaría un cero al denominador.'
        },
        {
          id: 'b',
          text: 'Porque AVG() devuelve NULL para toda la ventana si al menos una fila dentro del marco es NULL.',
          correct: false,
          feedback: 'Incorrecto. AVG() no devuelve NULL por encontrar un nulo; simplemente lo salta y reduce el denominador, sobreestimando la media móvil.'
        },
        {
          id: 'c',
          text: 'Porque ROWS BETWEEN no acepta columnas anulables en la cláusula OVER.',
          correct: false,
          feedback: 'Incorrecto. La sintaxis es válida sin COALESCE, lo que convierte este sesgo en un error silencioso de negocio.'
        }
      ],
      explanation: 'AVG(columna) omite los NULL tanto en el numerador como en el denominador. Transformar los NULL en 0.0 con COALESCE garantiza que los días sin actividad pesen en el promedio móvil.'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Espina de calendario y media móvil de 7 días en la tienda 14',
    language: 'sql',
    prompt: 'Construye la serie diaria de ventas completadas (`status = \'completed\'`) para la sucursal `store_id = 14` entre el `2025-01-01` y el `2025-01-10` inclusive, usando `calendar` como espina de fechas (`LEFT JOIN`). Devuelve `calendar_date`, `ventas_usd` (rellenando días sin ventas con `0.0` y redondeando a 2 decimales) y `media_movil_7d_usd` (promedio móvil de 7 días con `ORDER BY c.calendar_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW`, redondeado a 2 decimales). Ordena por `calendar_date` ascendente.',
    starterCode: `-- La consulta inicial agrupa orders sin espina de calendario (omite el viernes 2025-01-03)
SELECT
  order_date AS calendar_date,
  ROUND(SUM(total_usd), 2) AS ventas_usd,
  ROUND(
    AVG(SUM(total_usd)) OVER (
      ORDER BY order_date
      ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ),
    2
  ) AS media_movil_7d_usd
FROM orders
WHERE status = 'completed'
  AND store_id = 14
  AND order_date BETWEEN DATE '2025-01-01' AND DATE '2025-01-10'
GROUP BY order_date
ORDER BY calendar_date;`,
    expected: `WITH ventas_diarias AS (
  SELECT
    order_date,
    ROUND(SUM(total_usd), 2) AS ventas_usd
  FROM orders
  WHERE status = 'completed'
    AND store_id = 14
    AND order_date BETWEEN DATE '2025-01-01' AND DATE '2025-01-10'
  GROUP BY order_date
)
SELECT
  c.calendar_date,
  COALESCE(v.ventas_usd, 0.0) AS ventas_usd,
  ROUND(
    AVG(COALESCE(v.ventas_usd, 0.0)) OVER (
      ORDER BY c.calendar_date
      ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ),
    2
  ) AS media_movil_7d_usd
FROM calendar c
LEFT JOIN ventas_diarias v
  ON c.calendar_date = v.order_date
WHERE c.calendar_date BETWEEN DATE '2025-01-01' AND DATE '2025-01-10'
ORDER BY c.calendar_date;`,
    orderMatters: true,
    hints: [
      'Crea primero una CTE `ventas_diarias` que filtre `orders` por `status = \'completed\'`, `store_id = 14` y `order_date BETWEEN DATE \'2025-01-01\' AND DATE \'2025-01-10\'`, agrupando por `order_date`.',
      'En la consulta principal selecciona desde `calendar c` y haz `LEFT JOIN ventas_diarias v ON c.calendar_date = v.order_date` filtrando `c.calendar_date BETWEEN DATE \'2025-01-01\' AND DATE \'2025-01-10\'`.',
      'Usa `COALESCE(v.ventas_usd, 0.0)` tanto en `ventas_usd` como dentro de `AVG(COALESCE(v.ventas_usd, 0.0)) OVER (ORDER BY c.calendar_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)`.'
    ],
    solution: `WITH ventas_diarias AS (
  SELECT
    order_date,
    ROUND(SUM(total_usd), 2) AS ventas_usd
  FROM orders
  WHERE status = 'completed'
    AND store_id = 14
    AND order_date BETWEEN DATE '2025-01-01' AND DATE '2025-01-10'
  GROUP BY order_date
)
SELECT
  c.calendar_date,
  COALESCE(v.ventas_usd, 0.0) AS ventas_usd,
  ROUND(
    AVG(COALESCE(v.ventas_usd, 0.0)) OVER (
      ORDER BY c.calendar_date
      ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ),
    2
  ) AS media_movil_7d_usd
FROM calendar c
LEFT JOIN ventas_diarias v
  ON c.calendar_date = v.order_date
WHERE c.calendar_date BETWEEN DATE '2025-01-01' AND DATE '2025-01-10'
ORDER BY c.calendar_date;`,
    solutionExplanation: 'Preagrega las ventas de la tienda 14 en una CTE, une desde `calendar` mediante `LEFT JOIN` para materializar los 10 días (incluido el `2025-01-03` con `0.0`) y calcula la media móvil de 7 días sobre `COALESCE(v.ventas_usd, 0.0)`.'
  },

  roleNotes: {
    de: 'Ingiere y almacena todas las marcas de tiempo en UTC (`TIMESTAMPTZ`), pero conserva el identificador IANA o el desplazamiento horario original del evento si se requiere reconstruir la hora local del usuario. Materializa una tabla dimensional `calendar` corporativa con atributos fiscales, festivos y semanas ISO para evitar recalcular `GENERATE_SERIES` en cada consulta.',
    da: 'Antes de calcular retención diaria, rachas de uso o medias móviles con `ROWS BETWEEN`, verifica siempre que la serie no tenga huecos de fechas. Si analizas una cohorte pequeña o una tienda individual, cruza primero contra `calendar` y envuelve la métrica en `COALESCE(..., 0)` antes de aplicar `AVG()`.',
    bi: 'Documenta explícitamente en cada tablero en qué zona horaria se cierra el día contable (por ejemplo, `America/Mexico_City` frente a `UTC`). Un corte en UTC hace que las ventas nocturnas de Latinoamérica aparezcan en el día siguiente y descuadra los cierres de tienda física.'
  },

  summary: [
    'Almacena las marcas temporales en UTC, pero convierte a la zona horaria del negocio antes de truncar por día.',
    'Truncar directamente en UTC desplaza al día siguiente los eventos nocturnos de zonas como UTC-06:00.',
    'Una espina de calendario (Date Spine) garantiza una fila por cada fecha natural antes de agregar o promediar.',
    'Usa LEFT JOIN desde calendar y COALESCE(metrica, 0) para que AVG() y ROWS BETWEEN incluyan los días sin ventas.'
  ],

  flashcards: [
    {
      id: 'fc-c2-03-01',
      front: '¿Por qué no debes aplicar DATE_TRUNC(\'day\', event_ts) directamente sobre un timestamp en UTC para reportes de tiendas en Latinoamérica?',
      back: 'Porque las ventas ocurridas después de las 18:00 (en UTC-06:00) ya cruzaron las 00:00 UTC y se contabilizan en el día calendario siguiente.'
    },
    {
      id: 'fc-c2-03-02',
      front: '¿Qué es una espina de calendario (Date Spine) y qué problema resuelve?',
      back: 'Es una tabla o serie continua con una fila por cada unidad de tiempo que, unida con LEFT JOIN y COALESCE, materializa los días con cero eventos.'
    },
    {
      id: 'fc-c2-03-03',
      front: '¿Qué error ocurre si calculas AVG(v.ventas_usd) en lugar de AVG(COALESCE(v.ventas_usd, 0)) tras hacer LEFT JOIN con calendar?',
      back: 'AVG() ignora los valores NULL, por lo que divide solo entre los días con ventas activas y sobreestima el promedio diario.'
    }
  ],

  glossaryTerms: [
    'c2-sql-date-spine',
    'c2-sql-marco-ventana'
  ],

  sources: [
    {
      title: 'DuckDB SQL Reference — Timestamp Data Types and ICU Time Zones',
      url: 'https://duckdb.org/docs/sql/data_types/timestamp.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Almacenamiento de marcas temporales en UTC y conversión a zonas horarias mediante la extensión ICU.'
    },
    {
      title: 'DuckDB SQL Reference — Timestamp Functions (date_trunc, AT TIME ZONE)',
      url: 'https://duckdb.org/docs/sql/functions/timestamp.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Truncamiento de fechas y aritmética de intervalos temporales sobre columnas TIMESTAMP.'
    },
    {
      title: 'DuckDB SQL Reference — Timestamp with Time Zone Functions and Series',
      url: 'https://duckdb.org/docs/sql/functions/timestamptz.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Conversión explícita de husos horarios con AT TIME ZONE y generación de series temporales.'
    },
    {
      title: 'PostgreSQL 17 Documentation — Section 9.9: Date/Time Functions and Operators',
      url: 'https://www.postgresql.org/docs/current/functions-datetime.html',
      publisher: 'PostgreSQL Global Development Group',
      accessed: '2026-10-29',
      supports: 'Semántica estándar SQL de AT TIME ZONE, DATE_TRUNC y generación de espinas con generate_series.'
    }
  ],

  aiNotes: 'El error más frecuente en esta lección es filtrar store_id = 14 o status = \'completed\' en el WHERE externo después del LEFT JOIN con calendar (lo cual elimina el viernes 2025-01-03 sin ventas), u olvidar COALESCE(..., 0.0) dentro de AVG(). Guía al estudiante para preagregar orders en una CTE antes del LEFT JOIN.',
  subtitle: 'Zonas horarias (UTC frente a hora local) y espinas de calendario (Date Spine)',
  goal: 'Convertir marcas temporales UTC a fechas locales antes de truncar y construir espinas de calendario continuas con LEFT JOIN y COALESCE.'
};

export default lesson;
