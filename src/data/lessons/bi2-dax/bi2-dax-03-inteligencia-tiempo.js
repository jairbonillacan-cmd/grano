const lesson = {
  id: 'bi2-dax-03-inteligencia-tiempo',
  moduleId: 'bi2-dax',
  tracks: ['bi'],
  level: 2,
  order: 3,
  title: 'Inteligencia de tiempo: YTD, YoY y medias móviles en DAX',
  subtitle: 'Inteligencia de tiempo: YTD, YoY, medias móviles y comparativas a días equivalentes',
  minutes: 25,
  prerequisites: ['bi2-dax-02-calculate-transicion-contexto'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), los datos de pedidos completados de 2025 llegan hasta el `2025-11-26` (`$2 686 828.57`). El director comercial abre el tablero anual y ve una alerta roja de caída interanual (`YoY = -1.64 %`) porque la medida `SAMEPERIODLASTYEAR(\'calendar\'[calendar_date])` sumó los 12 meses completos de 2024 hasta el `2024-12-31` (`$2 731 516.50`). Si comparas hasta el `2024-11-26` (`$2 463 052.33`), las ventas crecieron `+9.09 %`. ¿Cómo funcionan las medidas de tiempo en DAX y cómo evitas comparar un año incompleto contra un año cerrado?',

  objectives: [
    'Construir medidas acumuladas anuales (TOTALYTD / DATESYTD) y comparativas interanuales (SAMEPERIODLASTYEAR) sobre una tabla de calendario continua.',
    'Corregir el sesgo de periodos incompletos implementando comparativas a días equivalentes hasta la última fecha con ventas.',
    'Calcular medias móviles de N días mediante DATESINPERIOD y AVERAGEX conciliando su resultado en SQL.'
  ],

  sections: [
    {
      id: 'requisitos-calendario-y-ytd',
      heading: 'Por qué la inteligencia de tiempo exige una tabla calendar continua',
      body: 'Las funciones de **inteligencia de tiempo** en DAX (`TOTALYTD`, `DATESYTD`, `SAMEPERIODLASTYEAR`, `DATEADD`) leen la columna de fechas de una dimensión calendario marcada. Estas funciones desplazan ese conjunto de fechas en memoria y lo pasan como filtro a `CALCULATE`. Para no perder días ni fallar en años bisiestos, la tabla `calendar` debe cubrir del 1 de enero al 31 de diciembre de cada año sin huecos.\n\nEn Mercado Brisa (empresa ficticia), `calendar` tiene `1 095` días continuos (`2023-01-01` a `2025-12-31`). La medida `Ventas YTD USD = TOTALYTD([Ventas Completadas USD], \'calendar\'[calendar_date])` equivale a `CALCULATE([Ventas Completadas USD], DATESYTD(\'calendar\'[calendar_date]))`. Su resultado acumula las ventas desde el inicio del año hasta el último día visible en el contexto de filtro.',
      example: {
        language: 'sql',
        code: '-- Reconciliación en DuckDB de Ventas Trimestrales, YTD y Año Previo (PY) en 2024:\nWITH ventas_trimestre AS (\n  SELECT\n    cal.year AS anio,\n    cal.quarter AS trimestre,\n    ROUND(SUM(o.total_usd), 2) AS ventas_trimestre_usd\n  FROM orders o\n  INNER JOIN calendar cal ON o.order_date = cal.calendar_date\n  WHERE o.status = \'completed\'\n  GROUP BY cal.year, cal.quarter\n),\ncon_ytd_py AS (\n  SELECT\n    anio,\n    trimestre,\n    ventas_trimestre_usd,\n    ROUND(SUM(ventas_trimestre_usd) OVER (PARTITION BY anio ORDER BY trimestre ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW), 2) AS ventas_ytd_usd,\n    LAG(ventas_trimestre_usd) OVER (PARTITION BY trimestre ORDER BY anio) AS ventas_py_usd\n  FROM ventas_trimestre\n)\nSELECT\n  anio,\n  trimestre,\n  ventas_trimestre_usd,\n  ventas_ytd_usd,\n  ventas_py_usd,\n  ROUND(100.0 * (ventas_trimestre_usd - ventas_py_usd) / NULLIF(ventas_py_usd, 0), 2) AS crecimiento_yoy_pct\nFROM con_ytd_py\nWHERE anio = 2024\nORDER BY trimestre;',
        expectedOutput: [
          {
            anio: 2024,
            trimestre: 1,
            ventas_trimestre_usd: 585570.16,
            ventas_ytd_usd: 585570.16,
            ventas_py_usd: 41207.44,
            crecimiento_yoy_pct: 1321.03
          },
          {
            anio: 2024,
            trimestre: 2,
            ventas_trimestre_usd: 676160.37,
            ventas_ytd_usd: 1261730.53,
            ventas_py_usd: 148350.17,
            crecimiento_yoy_pct: 355.79
          },
          {
            anio: 2024,
            trimestre: 3,
            ventas_trimestre_usd: 729187.45,
            ventas_ytd_usd: 1990917.98,
            ventas_py_usd: 279928.53,
            crecimiento_yoy_pct: 160.49
          },
          {
            anio: 2024,
            trimestre: 4,
            ventas_trimestre_usd: 740598.52,
            ventas_ytd_usd: 2731516.5,
            ventas_py_usd: 381631.21,
            crecimiento_yoy_pct: 94.06
          }
        ]
      }
    },
    {
      id: 'yoy-y-comparativa-dias-equivalentes',
      heading: 'Comparativas YoY a días equivalentes en periodos abiertos',
      body: 'Cuando el usuario selecciona el año `2025` en un segmentador, el filtro de `calendar[calendar_date]` abarca del `2025-01-01` al `2025-12-31`. Sin embargo, en `orders` solo existen pedidos hasta el `2025-11-26`. Por eso, `SAMEPERIODLASTYEAR(\'calendar\'[calendar_date])` devuelve todo el año `2024` hasta el `31 de diciembre`. El reporte termina comparando 330 días de 2025 contra 366 días de 2024.\n\nPara comparar a días equivalentes, creas en `calendar` una columna booleana `ConVentas = \'calendar\'[calendar_date] <= MAX(\'orders\'[order_date])`. Luego acotas la medida del año anterior con `CALCULATE([Ventas Completadas USD], SAMEPERIODLASTYEAR(\'calendar\'[calendar_date]), \'calendar\'[ConVentas] = TRUE())`. Así limitas 2024 exactamente hasta el `2024-11-26` (`$2 463 052.33`).'
    },
    {
      id: 'medias-moviles-datesinperiod',
      heading: 'Medias móviles con DATESINPERIOD y AVERAGEX sobre el calendario',
      body: 'Las ventas diarias presentan picos y valles según el día de la semana. Para suavizar la serie con una media móvil de 7 días calendario, usas **DATESINPERIOD**: `Media Movil 7D = CALCULATE(AVERAGEX(VALUES(\'calendar\'[calendar_date]), [Ventas Completadas USD]), DATESINPERIOD(\'calendar\'[calendar_date], MAX(\'calendar\'[calendar_date]), -7, DAY))`.\n\nObserva por qué se itera sobre `VALUES(\'calendar\'[calendar_date])`. Si un domingo tuviese cero ventas, la fila sigue existiendo en `calendar` y entra en el denominador de los 7 días. En SQL esto equivale a hacer `LEFT JOIN` desde `calendar` hacia `orders` y aplicar `AVG(...) OVER (ORDER BY fecha ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)`.',
      example: {
        language: 'sql',
        code: '-- Media móvil de 7 días calendario en noviembre de 2024 sobre calendar:\nWITH ventas_dia AS (\n  SELECT\n    cal.calendar_date::VARCHAR AS fecha,\n    COALESCE(SUM(o.total_usd) FILTER (WHERE o.status = \'completed\'), 0) AS ventas_dia_usd\n  FROM calendar cal\n  LEFT JOIN orders o ON cal.calendar_date = o.order_date\n  WHERE cal.calendar_date BETWEEN DATE \'2024-11-01\' AND DATE \'2024-11-15\'\n  GROUP BY cal.calendar_date\n),\ncon_ventana AS (\n  SELECT\n    fecha,\n    ROUND(ventas_dia_usd, 2) AS ventas_dia_usd,\n    ROUND(AVG(ventas_dia_usd) OVER (ORDER BY fecha ROWS BETWEEN 6 PRECEDING AND CURRENT ROW), 2) AS media_movil_7d_usd\n  FROM ventas_dia\n)\nSELECT * FROM con_ventana\nWHERE fecha >= \'2024-11-11\'\nORDER BY fecha;',
        expectedOutput: [
          {
            fecha: '2024-11-11',
            ventas_dia_usd: 10554.32,
            media_movil_7d_usd: 8675.03
          },
          {
            fecha: '2024-11-12',
            ventas_dia_usd: 6358.78,
            media_movil_7d_usd: 8639.88
          },
          {
            fecha: '2024-11-13',
            ventas_dia_usd: 3469.71,
            media_movil_7d_usd: 8026.84
          },
          {
            fecha: '2024-11-14',
            ventas_dia_usd: 13280.63,
            media_movil_7d_usd: 8844.5
          },
          {
            fecha: '2024-11-15',
            ventas_dia_usd: 6747.43,
            media_movil_7d_usd: 8562.2
          }
        ]
      }
    }
  ],

  workedExample: {
    title: 'Auditoría de crecimiento interanual (2025 vs 2024): año completo frente a días equivalentes',
    description: 'En Mercado Brisa, el último pedido completado de 2025 ocurre el `2025-11-26`. Compara el error de evaluar `SAMEPERIODLASTYEAR` sobre todo 2024 frente al corte a días equivalentes (`2024-01-01` al `2024-11-26`):',
    steps: [
      {
        label: 'Paso 1 — Error frecuente: comparar 2025 (hasta el 26-nov) contra los 12 meses de 2024',
        explanation: 'Al incluir del 27 de noviembre al 31 de diciembre de 2024 ($268 464.17 adicionales), la medida muestra una caída aparente del -1.64 % en 2025.',
        code: '-- Antipatrón cuando el año actual no ha terminado:\nSELECT\n  ROUND(SUM(total_usd) FILTER (WHERE order_date BETWEEN DATE \'2025-01-01\' AND DATE \'2025-11-26\'), 2) AS ventas_2025_ytd_usd,\n  ROUND(SUM(total_usd) FILTER (WHERE order_date BETWEEN DATE \'2024-01-01\' AND DATE \'2024-12-31\'), 2) AS py_2024_completo_usd,\n  ROUND(100.0 * (\n    SUM(total_usd) FILTER (WHERE order_date BETWEEN DATE \'2025-01-01\' AND DATE \'2025-11-26\') -\n    SUM(total_usd) FILTER (WHERE order_date BETWEEN DATE \'2024-01-01\' AND DATE \'2024-12-31\')\n  ) / SUM(total_usd) FILTER (WHERE order_date BETWEEN DATE \'2024-01-01\' AND DATE \'2024-12-31\'), 2) AS yoy_falso_pct\nFROM orders\nWHERE status = \'completed\';',
        expectedOutput: [
          {
            ventas_2025_ytd_usd: 2686828.57,
            py_2024_completo_usd: 2731516.5,
            yoy_falso_pct: -1.64
          }
        ]
      },
      {
        label: 'Paso 2 — Solución exacta: comparativa a días equivalentes (1-ene al 26-nov)',
        explanation: 'Al restringir ambos años al mismo intervalo calendario (`01-01` al `11-26`), se revela que las ventas completadas crecieron un +9.09 % ($2 686 828.57 frente a $2 463 052.33).',
        code: '-- Medida DAX con filtro de fechas equivalentes hasta el último día con ventas (26-nov):\nSELECT\n  ROUND(SUM(total_usd) FILTER (WHERE order_date BETWEEN DATE \'2025-01-01\' AND DATE \'2025-11-26\'), 2) AS ventas_2025_ytd_usd,\n  ROUND(SUM(total_usd) FILTER (WHERE order_date BETWEEN DATE \'2024-01-01\' AND DATE \'2024-11-26\'), 2) AS py_2024_equivalente_usd,\n  ROUND(100.0 * (\n    SUM(total_usd) FILTER (WHERE order_date BETWEEN DATE \'2025-01-01\' AND DATE \'2025-11-26\') -\n    SUM(total_usd) FILTER (WHERE order_date BETWEEN DATE \'2024-01-01\' AND DATE \'2024-11-26\')\n  ) / SUM(total_usd) FILTER (WHERE order_date BETWEEN DATE \'2024-01-01\' AND DATE \'2024-11-26\'), 2) AS yoy_equivalente_pct\nFROM orders\nWHERE status = \'completed\';',
        expectedOutput: [
          {
            ventas_2025_ytd_usd: 2686828.57,
            py_2024_equivalente_usd: 2463052.33,
            yoy_equivalente_pct: 9.09
          }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: '¿Por qué nunca debes pasar la columna `orders[order_date]` como argumento de fechas en `TOTALYTD` o `SAMEPERIODLASTYEAR`?',
      options: [
        {
          id: 'a',
          text: 'Porque las funciones de inteligencia de tiempo requieren una tabla de calendario dedicada con todas las fechas del año contiguas y sin huecos.',
          correct: true,
          feedback: 'Exacto. La tabla de hechos puede no tener pedidos en ciertos días festivos o domingos, rompiendo el desplazamiento de intervalos.'
        },
        {
          id: 'b',
          text: 'Porque DAX no permite aplicar funciones de fecha sobre tablas de más de 10 000 filas.',
          correct: false,
          feedback: 'Incorrecto. El límite no es de filas, sino el requisito de continuidad y unicidad de fechas en una dimensión calendario.'
        },
        {
          id: 'c',
          text: 'Porque orders[order_date] siempre incluye la hora y minuto del pedido.',
          correct: false,
          feedback: 'Incorrecto. En Mercado Brisa order_date es de tipo DATE; aun así, debe usarse siempre calendar[calendar_date].'
        }
      ],
      explanation: 'Las funciones de inteligencia de tiempo de DAX operan como filtros de tabla sobre una columna de fechas continua desde el 1 de enero hasta el 31 de diciembre.'
    },
    {
      id: 'c2',
      type: 'predict-output',
      prompt: 'En Mercado Brisa, las ventas completadas por trimestre de 2024 son: T1 = `$585 570.16`, T2 = `$676 160.37`, T3 = `$729 187.45` y T4 = `$740 598.52`. ¿Qué valor muestra `TOTALYTD([Ventas Completadas USD], \'calendar\'[calendar_date])` en la fila del T3 de 2024?',
      options: [
        {
          id: 'a',
          text: '$1 990 917.98 (la suma acumulada de T1 + T2 + T3 de 2024).',
          correct: true,
          feedback: 'Correcto. TOTALYTD suma desde el 1 de enero de 2024 hasta el cierre del tercer trimestre (585 570.16 + 676 160.37 + 729 187.45).'
        },
        {
          id: 'b',
          text: '$729 187.45 (únicamente las ventas del T3 de 2024).',
          correct: false,
          feedback: 'Incorrecto. Ese es el valor trimestral sin acumular.'
        },
        {
          id: 'c',
          text: '$2 731 516.50 (el total de los cuatro trimestres de 2024).',
          correct: false,
          feedback: 'Incorrecto. En la fila de T3 el contexto de filtro llega hasta el 30 de septiembre, por lo que no incluye T4.'
        }
      ],
      explanation: 'TOTALYTD acumula los valores desde el primer día del año hasta la fecha máxima presente en el contexto de filtro de esa celda (fin del T3).'
    },
    {
      id: 'c3',
      type: 'fill-code',
      prompt: 'Completa la medida DAX que obtiene las ventas del mismo periodo del año anterior usando la columna `calendar_date` de `calendar`:',
      template: 'Ventas PY USD =\n{{b1}} (\n    [Ventas Completadas USD],\n    {{b2}} ( \'calendar\'[calendar_date] )\n)',
      blanks: [
        { id: 'b1', accepted: ['CALCULATE', 'calculate'] },
        { id: 'b2', accepted: ['SAMEPERIODLASTYEAR', 'sameperiodlastyear'] }
      ],
      explanation: 'CALCULATE modifica el contexto de fechas reemplazando el rango actual de calendar[calendar_date] por el rango desplazado un año atrás con SAMEPERIODLASTYEAR.'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Conciliación trimestral de YTD, PY y YoY % en 2024 sobre calendar',
    language: 'sql',
    prompt: 'En Mercado Brisa, concilia las medidas DAX `[Ventas Trimestre USD]`, `[Ventas YTD USD]`, `[Ventas PY USD]` y `[Crecimiento YoY %]` para los 4 trimestres de `2024` (solo pedidos con `status = \'completed\'`). En el CTE `con_ytd_py`, calcula `ventas_ytd_usd` (suma acumulada por `anio` ordenada por `trimestre`) y `ventas_py_usd` (`LAG(ventas_trimestre_usd) OVER (PARTITION BY trimestre ORDER BY anio)`). Finalmente, selecciona para `anio = 2024`: `anio`, `trimestre`, `ventas_trimestre_usd`, `ventas_ytd_usd`, `ventas_py_usd` y `crecimiento_yoy_pct` (`ROUND(100.0 * (ventas_trimestre_usd - ventas_py_usd) / NULLIF(ventas_py_usd, 0), 2)`), ordenado por `trimestre ASC`.',
    starterCode: 'WITH ventas_trimestre AS (\n  SELECT\n    cal.year AS anio,\n    cal.quarter AS trimestre,\n    ROUND(SUM(o.total_usd), 2) AS ventas_trimestre_usd\n  FROM orders o\n  INNER JOIN calendar cal ON o.order_date = cal.calendar_date\n  WHERE o.status = \'completed\'\n  GROUP BY cal.year, cal.quarter\n),\ncon_ytd_py AS (\n  SELECT\n    anio,\n    trimestre,\n    ventas_trimestre_usd,\n    ROUND(SUM(ventas_trimestre_usd) OVER (PARTITION BY anio ORDER BY trimestre ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW), 2) AS ventas_ytd_usd,\n    -- TODO: Calcula ventas_py_usd del mismo trimestre en el año anterior con LAG\n    0.0 AS ventas_py_usd\n  FROM ventas_trimestre\n)\nSELECT\n  anio,\n  trimestre,\n  ventas_trimestre_usd,\n  ventas_ytd_usd,\n  ventas_py_usd,\n  -- TODO: Calcula crecimiento_yoy_pct redondeado a 2 decimales\n  0.0 AS crecimiento_yoy_pct\nFROM con_ytd_py\nWHERE anio = 2024\nORDER BY trimestre ASC;',
    expected: 'WITH ventas_trimestre AS (\n  SELECT\n    cal.year AS anio,\n    cal.quarter AS trimestre,\n    ROUND(SUM(o.total_usd), 2) AS ventas_trimestre_usd\n  FROM orders o\n  INNER JOIN calendar cal ON o.order_date = cal.calendar_date\n  WHERE o.status = \'completed\'\n  GROUP BY cal.year, cal.quarter\n),\ncon_ytd_py AS (\n  SELECT\n    anio,\n    trimestre,\n    ventas_trimestre_usd,\n    ROUND(SUM(ventas_trimestre_usd) OVER (PARTITION BY anio ORDER BY trimestre ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW), 2) AS ventas_ytd_usd,\n    LAG(ventas_trimestre_usd) OVER (PARTITION BY trimestre ORDER BY anio) AS ventas_py_usd\n  FROM ventas_trimestre\n)\nSELECT\n  anio,\n  trimestre,\n  ventas_trimestre_usd,\n  ventas_ytd_usd,\n  ventas_py_usd,\n  ROUND(100.0 * (ventas_trimestre_usd - ventas_py_usd) / NULLIF(ventas_py_usd, 0), 2) AS crecimiento_yoy_pct\nFROM con_ytd_py\nWHERE anio = 2024\nORDER BY trimestre ASC;',
    orderMatters: true,
    hints: [
      'Para emparejar el mismo trimestre del año previo (equivalente a SAMEPERIODLASTYEAR), usa LAG(ventas_trimestre_usd) OVER (PARTITION BY trimestre ORDER BY anio).',
      'En el SELECT exterior, calcula ROUND(100.0 * (ventas_trimestre_usd - ventas_py_usd) / NULLIF(ventas_py_usd, 0), 2) AS crecimiento_yoy_pct.',
      'Mantén el filtro WHERE anio = 2024 en la consulta exterior para que LAG pueda leer las filas de 2023 dentro del CTE.'
    ],
    solution: 'WITH ventas_trimestre AS (\n  SELECT\n    cal.year AS anio,\n    cal.quarter AS trimestre,\n    ROUND(SUM(o.total_usd), 2) AS ventas_trimestre_usd\n  FROM orders o\n  INNER JOIN calendar cal ON o.order_date = cal.calendar_date\n  WHERE o.status = \'completed\'\n  GROUP BY cal.year, cal.quarter\n),\ncon_ytd_py AS (\n  SELECT\n    anio,\n    trimestre,\n    ventas_trimestre_usd,\n    ROUND(SUM(ventas_trimestre_usd) OVER (PARTITION BY anio ORDER BY trimestre ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW), 2) AS ventas_ytd_usd,\n    LAG(ventas_trimestre_usd) OVER (PARTITION BY trimestre ORDER BY anio) AS ventas_py_usd\n  FROM ventas_trimestre\n)\nSELECT\n  anio,\n  trimestre,\n  ventas_trimestre_usd,\n  ventas_ytd_usd,\n  ventas_py_usd,\n  ROUND(100.0 * (ventas_trimestre_usd - ventas_py_usd) / NULLIF(ventas_py_usd, 0), 2) AS crecimiento_yoy_pct\nFROM con_ytd_py\nWHERE anio = 2024\nORDER BY trimestre ASC;',
    solutionExplanation: 'El CTE calcula tanto el acumulado anual `ventas_ytd_usd` (que cierra T4 en `$2,731,516.50`) como el trimestre equivalente de 2023 con `LAG`, conciliando el crecimiento interanual de cada trimestre.',
    expectedOutputTable: [
      {
        anio: 2024,
        trimestre: 1,
        ventas_trimestre_usd: 585570.16,
        ventas_ytd_usd: 585570.16,
        ventas_py_usd: 41207.44,
        crecimiento_yoy_pct: 1321.03
      },
      {
        anio: 2024,
        trimestre: 2,
        ventas_trimestre_usd: 676160.37,
        ventas_ytd_usd: 1261730.53,
        ventas_py_usd: 148350.17,
        crecimiento_yoy_pct: 355.79
      },
      {
        anio: 2024,
        trimestre: 3,
        ventas_trimestre_usd: 729187.45,
        ventas_ytd_usd: 1990917.98,
        ventas_py_usd: 279928.53,
        crecimiento_yoy_pct: 160.49
      },
      {
        anio: 2024,
        trimestre: 4,
        ventas_trimestre_usd: 740598.52,
        ventas_ytd_usd: 2731516.5,
        ventas_py_usd: 381631.21,
        crecimiento_yoy_pct: 94.06
      }
    ]
  },

  roleNotes: {
    de: 'Publica en el almacén una tabla `calendar` generada por código (Date Spine) sin huecos y añade una bandera `has_completed_sales` actualizada en cada lote para facilitar las comparativas a días equivalentes en BI.',
    da: 'Cuando compares métricas interanuales a mitad de mes o de año, verifica siempre la fecha máxima de corte en ambos periodos para no confundir un periodo incompleto con una contracción real.',
    bi: 'Desactiva la opción Auto date/time en Power BI, marca `calendar` como tabla de fechas oficial y usa siempre `\'calendar\'[calendar_date]` dentro de `TOTALYTD`, `SAMEPERIODLASTYEAR` y `DATESINPERIOD`.'
  },

  summary: [
    'Toda función de inteligencia de tiempo en DAX exige una dimensión calendar con fechas contiguas sin huecos.',
    'TOTALYTD y DATESYTD acumulan la medida desde el inicio del año hasta la fecha máxima del contexto actual.',
    'SAMEPERIODLASTYEAR desplaza el filtro de fechas un año atrás; en años abiertos debe acotarse a días equivalentes.',
    'DATESINPERIOD combinado con AVERAGEX sobre los días del calendario construye medias móviles que incluyen días con cero ventas.'
  ],

  flashcards: [
    {
      id: 'fc-bi2-dax-03-a',
      front: '¿Qué requisito debe cumplir la tabla `calendar` para que `SAMEPERIODLASTYEAR` y `TOTALYTD` funcionen bien?',
      back: 'Debe tener una fila por cada día natural desde el 1 de enero hasta el 31 de diciembre, sin fechas duplicadas ni días faltantes.'
    },
    {
      id: 'fc-bi2-dax-03-b',
      front: '¿Por qué `SAMEPERIODLASTYEAR` puede mostrar una caída falsa en el año en curso si se selecciona el año entero?',
      back: 'Porque desplaza todo el año calendario (hasta el 31 de diciembre del año previo) aunque el año actual solo tenga ventas hasta la fecha de hoy.'
    },
    {
      id: 'fc-bi2-dax-03-c',
      front: '¿Cómo se construye una media móvil de 7 días en DAX respetando los días sin ventas?',
      back: 'Con `CALCULATE(AVERAGEX(VALUES(\'calendar\'[calendar_date]), [Ventas]), DATESINPERIOD(\'calendar\'[calendar_date], MAX(\'calendar\'[calendar_date]), -7, DAY))`.'
    }
  ],

  glossaryTerms: [
    'bi2-dax-inteligencia-tiempo',
    'bi2-dax-calculate-transicion'
  ],

  sources: [
    {
      title: 'Microsoft Learn — Time Intelligence Functions (DAX)',
      url: 'https://learn.microsoft.com/en-us/dax/time-intelligence-functions-dax',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Requisitos de tabla de calendario continua y catálogo de funciones de inteligencia de tiempo en DAX.'
    },
    {
      title: 'Microsoft Learn — SAMEPERIODLASTYEAR Function (DAX)',
      url: 'https://learn.microsoft.com/en-us/dax/sameperiodlastyear-function-dax',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Desplazamiento de un año atrás sobre la columna de fechas en el contexto de filtro.'
    },
    {
      title: 'Microsoft Learn — DATESINPERIOD Function (DAX)',
      url: 'https://learn.microsoft.com/en-us/dax/datesinperiod-function-dax',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Definición de ventanas móviles de N días, meses o trimestres hacia atrás.'
    }
  ],

  aiNotes: 'Las dos trampas más frecuentes son pasar la fecha de la tabla de hechos (`orders[order_date]`) a funciones de tiempo en vez de `calendar[calendar_date]`, y comparar el año actual incompleto contra los 12 meses del año pasado sin filtrar hasta la última fecha con datos.'
};

export default lesson;
