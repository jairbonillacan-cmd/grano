const lesson = {
  id: 'bi2-modelo-semantico-04-tablas-fechas-userelationship',
  moduleId: 'bi2-modelo-semantico',
  tracks: ['bi'],
  level: 2,
  order: 4,
  title: 'Tablas de fechas marcadas y relaciones USERELATIONSHIP',
  subtitle: 'Tablas de fechas marcadas, jerarquías fiscales y relaciones inactivas (USERELATIONSHIP)',
  minutes: 20,
  prerequisites: ['bi2-modelo-semantico-03-direccion-filtro-cruzado'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), Finanzas cierra sus trimestres fiscales en `calendar.fiscal_quarter` y exige restar los reembolsos en el trimestre en que se devolvió el dinero (`refunds.refund_date`), mientras Comercial mide los pedidos según la fecha de compra (`orders.order_date`). Al enlazar `calendar` con ambas fechas, el reporte trimestral de 2024 descuadró en 1 254,46 USD en el primer trimestre porque la relación por fecha de devolución quedó inactiva. ¿Cómo gobiernas una tabla de fechas oficial y activas relaciones secundarias con `USERELATIONSHIP`?',

  objectives: [
    'Auditar con SQL si una dimensión de calendario cumple los cuatro requisitos para marcarse como tabla de fechas en Power BI.',
    'Explicar por qué debe desactivarse la opción Auto date/time y cómo funcionan las jerarquías fiscales en una tabla de calendario.',
    'Conciliar métricas por fecha de pedido (relación activa) frente a fecha de reembolso (relación inactiva con USERELATIONSHIP).',
  ],

  sections: [
    {
      id: 'requisitos-tabla-fechas-marcada-y-auto-datetime',
      heading: 'Requisitos de una tabla de fechas marcada y el costo de Auto date/time',
      body: 'Las funciones de inteligencia de tiempo de DAX (`TOTALYTD`, `SAMEPERIODLASTYEAR`, `DATEADD`) requieren una **tabla de fechas marcada** (*Mark as date table*). Según Microsoft Learn, la columna de fecha elegida debe cumplir cuatro reglas estrictas:\n\n1. Tipo de dato `Date` (o `Date/Time` con la hora siempre a medianoche `00:00:00`).\n2. Valores únicos (`COUNT(*) = COUNT(DISTINCT calendar_date)`).\n3. Ningún valor nulo (`IS NULL = 0`).\n4. Continuidad diaria sin huecos desde el 1 de enero del primer año hasta el 31 de diciembre del último año.\n\nSi no creas tu propia tabla `calendar`, Power BI usa **Auto date/time**. Esa opción genera en segundo plano una tabla oculta `LocalDateTable_...` por cada columna de fecha de cada tabla del modelo. Eso infla el archivo en memoria e impide filtrar dos tablas de hechos con un mismo selector de fecha.\n\nAl auditar la tabla `calendar` de Mercado Brisa (1 095 filas entre 2023 y 2025) con SQL encontramos un detalle real. Quien generó 1 095 días (`365 × 3`) olvidó que 2024 fue bisiesto (`366` días). Por eso 2025 termina el `2025-12-30` y le falta el `2025-12-31`. Auditar el calendario antes de publicar evita fallos en los cierres de diciembre.',
      example: {
        language: 'sql',
        code: `SELECT
  year,
  COUNT(*) AS dias_registrados,
  CAST(MIN(calendar_date) AS VARCHAR) AS primer_dia,
  CAST(MAX(calendar_date) AS VARCHAR) AS ultimo_dia,
  CASE
    WHEN MIN(calendar_date) = MAKE_DATE(year, 1, 1)
     AND MAX(calendar_date) = MAKE_DATE(year, 12, 31)
    THEN 'Anio completo'
    ELSE 'Incompleto (falta 31-dic por bisiesto 2024)'
  END AS auditoria_calendario
FROM calendar
GROUP BY year
ORDER BY year ASC;`,
        expectedOutput: [
          {
            year: 2023,
            dias_registrados: '365',
            primer_dia: '2023-01-01',
            ultimo_dia: '2023-12-31',
            auditoria_calendario: 'Anio completo',
          },
          {
            year: 2024,
            dias_registrados: '366',
            primer_dia: '2024-01-01',
            ultimo_dia: '2024-12-31',
            auditoria_calendario: 'Anio completo',
          },
          {
            year: 2025,
            dias_registrados: '364',
            primer_dia: '2025-01-01',
            ultimo_dia: '2025-12-30',
            auditoria_calendario: 'Incompleto (falta 31-dic por bisiesto 2024)',
          },
        ],
      },
    },
    {
      id: 'jerarquias-fiscales-y-ordenamiento-cronologico',
      heading: 'Jerarquías fiscales, semanas ISO y ordenamiento por columna numérica',
      body: 'Las funciones estándar de calendario solo conocen el año natural del 1 de enero al 31 de diciembre. Sin embargo, finanzas y operaciones trabajan con **jerarquías fiscales** (`fiscal_quarter`, como `FY24-Q1` a `FY24-Q4`), semanas ISO (`iso_week`, de 1 a 52) y banderas operativas (`is_weekend`, `is_holiday`, `season`). Todos esos atributos viven precalculados como columnas en la tabla `calendar`.\n\nAl exponer columnas de texto como `month_name` (`Enero`, `Febrero`, `Marzo`) o `day_name` (`Lunes`, `Martes`) en Power BI, los gráficos las ordenan alfabéticamente por defecto (`Abril`, `Agosto`, `Diciembre`…). Para corregirlo en el modelo semántico, debes configurar la propiedad **Ordenar por columna** (*Sort by column*).\n\nSeleccionas `month_name` y le indicas que se ordene según la columna entera `month` (`1..12`). Del mismo modo, seleccionas `day_name` para que se ordene según `day_of_week` (`1..7`). Esta propiedad exige siempre una correspondencia `1:1` entre cada etiqueta de texto y su número de orden.',
    },
    {
      id: 'relaciones-inactivas-y-userelationship',
      heading: 'Dimensiones de rol y relaciones inactivas con USERELATIONSHIP',
      body: 'En el modelado dimensional de Kimball, una misma dimensión física (`calendar`) puede filtrar los hechos por distintas fechas del negocio (`order_date`, `refund_date`, `payment_ts`). Cuando cumple esa función, actúa como una **dimensión de rol** (*role-playing dimension*).\n\nComo vimos antes, el motor tabular prohíbe tener dos relaciones activas simultáneas entre las mismas tablas porque el filtro sería ambiguo. ¿Un filtro en `FY24-Q1` debería buscar pedidos comprados en `FY24-Q1` o pedidos devueltos en `FY24-Q1`? Por eso se define una única **relación activa** (línea continua, `calendar[calendar_date] -> orders[order_date]`) y relaciones inactivas (línea punteada) para las fechas secundarias.\n\nPara evaluar una métrica por la fecha secundaria sin duplicar la tabla `calendar`, envuelves el cálculo en `CALCULATE` y llamas a **`USERELATIONSHIP`**:\n\n`Reembolsos Fecha Devolución = CALCULATE( SUM(refunds[refund_amount_usd]), USERELATIONSHIP(calendar[calendar_date], refunds[refund_date]) )`\n\nDurante esa medida, DAX apaga temporalmente el camino por fecha de pedido y propaga el filtro de `calendar` hacia `refunds[refund_date]`.',
    },
  ],

  workedExample: {
    title: 'Reembolsos atribuidos por fecha de pedido (order_date) frente a fecha de devolución (USERELATIONSHIP)',
    description: 'Compara los reembolsos de 2024 en Mercado Brisa cuando se agrupan por la fecha del pedido original frente a cuando se activa la relación por `refund_date`.',
    steps: [
      {
        label: 'Paso 1 — Relación por fecha de compra: atribuir el reembolso al trimestre del pedido original',
        explanation: 'Si `calendar` filtra a través de `orders.order_date`, los reembolsos de compras hechas al final de `FY24-Q1` pero devueltas en abril (`FY24-Q2`) se imputan hacia atrás en `FY24-Q1` (27 154,01 USD).',
        code: `SELECT
  c.fiscal_quarter,
  COUNT(r.refund_id) AS devoluciones_por_fecha_pedido,
  ROUND(SUM(r.refund_amount_usd), 2) AS reembolsos_fecha_pedido_usd
FROM refunds r
JOIN orders o ON r.order_id = o.order_id
JOIN calendar c ON o.order_date = c.calendar_date
WHERE c.year = 2024
GROUP BY c.fiscal_quarter
ORDER BY c.fiscal_quarter ASC;`,
        expectedOutput: [
          {
            fiscal_quarter: 'FY24-Q1',
            devoluciones_por_fecha_pedido: '137',
            reembolsos_fecha_pedido_usd: 27154.01,
          },
          {
            fiscal_quarter: 'FY24-Q2',
            devoluciones_por_fecha_pedido: '153',
            reembolsos_fecha_pedido_usd: 31454.67,
          },
          {
            fiscal_quarter: 'FY24-Q3',
            devoluciones_por_fecha_pedido: '171',
            reembolsos_fecha_pedido_usd: 42715.5,
          },
          {
            fiscal_quarter: 'FY24-Q4',
            devoluciones_por_fecha_pedido: '206',
            reembolsos_fecha_pedido_usd: 40312.45,
          },
        ],
      },
      {
        label: 'Paso 2 — Activación de USERELATIONSHIP sobre refunds.refund_date y conciliación contable',
        explanation: 'Al enlazar `calendar.calendar_date` directamente con `refunds.refund_date` (equivalente a `USERELATIONSHIP`), vemos que en `FY24-Q1` salieron realmente 25 899,55 USD (`-1 254,46 USD` de diferencia) y en `FY24-Q4` salieron 40 774,88 USD (`+462,43 USD`).',
        code: `WITH reembolsos_fecha_pedido AS (
  SELECT
    c.fiscal_quarter,
    SUM(r.refund_amount_usd) AS reembolsos_segun_order_date_usd
  FROM refunds r
  JOIN orders o ON r.order_id = o.order_id
  JOIN calendar c ON o.order_date = c.calendar_date
  WHERE c.year = 2024
  GROUP BY c.fiscal_quarter
),
reembolsos_fecha_devolucion AS (
  SELECT
    c.fiscal_quarter,
    SUM(r.refund_amount_usd) AS reembolsos_userelationship_refund_date_usd
  FROM refunds r
  JOIN calendar c ON r.refund_date = c.calendar_date
  WHERE c.year = 2024
  GROUP BY c.fiscal_quarter
)
SELECT
  p.fiscal_quarter,
  ROUND(p.reembolsos_segun_order_date_usd, 2) AS segun_order_date_usd,
  ROUND(d.reembolsos_userelationship_refund_date_usd, 2) AS con_userelationship_refund_date_usd,
  ROUND(d.reembolsos_userelationship_refund_date_usd - p.reembolsos_segun_order_date_usd, 2) AS diferencia_contable_usd
FROM reembolsos_fecha_pedido p
JOIN reembolsos_fecha_devolucion d ON p.fiscal_quarter = d.fiscal_quarter
ORDER BY p.fiscal_quarter ASC;`,
        expectedOutput: [
          {
            fiscal_quarter: 'FY24-Q1',
            segun_order_date_usd: 27154.01,
            con_userelationship_refund_date_usd: 25899.55,
            diferencia_contable_usd: -1254.46,
          },
          {
            fiscal_quarter: 'FY24-Q2',
            segun_order_date_usd: 31454.67,
            con_userelationship_refund_date_usd: 31227.19,
            diferencia_contable_usd: -227.48,
          },
          {
            fiscal_quarter: 'FY24-Q3',
            segun_order_date_usd: 42715.5,
            con_userelationship_refund_date_usd: 42326.55,
            diferencia_contable_usd: -388.95,
          },
          {
            fiscal_quarter: 'FY24-Q4',
            segun_order_date_usd: 40312.45,
            con_userelationship_refund_date_usd: 40774.88,
            diferencia_contable_usd: 462.43,
          },
        ],
      },
    ],
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: '¿Por qué recomienda Microsoft Learn desactivar la opción `Auto date/time` en cuanto incorporas una tabla `calendar` oficial en tu modelo de Power BI?',
      options: [
        {
          id: 'a',
          text: 'Porque `Auto date/time` crea una tabla de calendario oculta en memoria por cada columna de fecha del modelo, inflando el tamaño del archivo e impidiendo compartir un mismo filtro de tiempo entre tablas.',
          correct: true,
          feedback: 'Correcto. Esas tablas ocultas (`LocalDateTable_...`) consumen RAM y no actúan como dimensión conformada entre hechos.',
        },
        {
          id: 'b',
          text: 'Porque `Auto date/time` borra las columnas `order_date` y `refund_date` de las tablas de hechos.',
          correct: false,
          feedback: 'Incorrecto. No borra las columnas; genera tablas ocultas vinculadas a cada una de ellas.',
        },
        {
          id: 'c',
          text: 'Porque con `Auto date/time` activado no se permite escribir medidas con `SUM` ni `COUNT`.',
          correct: false,
          feedback: 'Incorrecto. Las medidas básicas funcionan, pero proliferan jerarquías de fecha aisladas y redundantes.',
        },
      ],
      explanation: 'Una única tabla `calendar` marcada como tabla de fechas sustituye con ventaja a todas las tablas automáticas ocultas y permite cruzar múltiples tablas de hechos por los mismos periodos.',
    },
    {
      id: 'c2',
      type: 'fill-code',
      prompt: 'Completa la medida DAX que calcula la suma de `refunds[refund_amount_usd]` activando la relación inactiva entre `calendar[calendar_date]` y `refunds[refund_date]`:',
      template: 'Reembolsos Por Fecha Devolucion = {{b1}}( SUM( refunds[refund_amount_usd] ), {{b2}}( calendar[calendar_date], refunds[refund_date] ) )',
      blanks: [
        {
          id: 'b1',
          accepted: ['CALCULATE', 'calculate'],
        },
        {
          id: 'b2',
          accepted: ['USERELATIONSHIP', 'userelationship'],
        },
      ],
      explanation: '`USERELATIONSHIP` se pasa como modificador de filtro dentro de `CALCULATE` indicando las dos columnas que forman los extremos de la relación inactiva.',
    },
    {
      id: 'c3',
      type: 'mcq',
      prompt: '¿En qué caso resulta preferible duplicar la tabla `calendar` como dos dimensiones de rol separadas (`Calendario Pedido` y `Calendario Reembolso`) en lugar de usar una relación inactiva con `USERELATIONSHIP`?',
      options: [
        {
          id: 'a',
          text: 'Cuando el usuario necesita filtrar simultáneamente en dos segmentadores independientes (por ejemplo: pedidos comprados en enero que fueron reembolsados en marzo).',
          correct: true,
          feedback: 'Exacto. Si necesitas dos selectores de fecha independientes actuando a la vez sobre el mismo visual, requieres dos dimensiones de rol separadas.',
        },
        {
          id: 'b',
          text: 'Cuando quieres mostrar en una misma tabla visual las ventas y los reembolsos a lo largo de un único eje de trimestres (`fiscal_quarter`).',
          correct: false,
          feedback: 'Incorrecto. Para compartir el mismo eje temporal en un gráfico o tabla, necesitas una sola tabla `calendar` y activar la segunda fecha con `USERELATIONSHIP`.',
        },
        {
          id: 'c',
          text: 'Cuando la tabla de calendario tiene menos de 365 filas.',
          correct: false,
          feedback: 'Incorrecto. Una tabla de calendario nunca debe tener años truncados, independientemente del número de relaciones.',
        },
      ],
      explanation: 'Una sola tabla `calendar` con `USERELATIONSHIP` sirve para comparar medidas bajo un mismo eje de tiempo; dos tablas de rol sirven cuando el usuario necesita dos filtros de fecha independientes a la vez.',
    },
  ],

  practice: {
    type: 'sql',
    title: 'Ventas por fecha de pedido y reembolsos por fecha de devolución en cada trimestre fiscal de 2024',
    language: 'sql',
    prompt: 'Combina sobre el mismo eje `fiscal_quarter` de la tabla `calendar` en el año `2024` (`c.year = 2024`) dos CTEs: `ventas_trimestre` (uniendo `orders` por `o.order_date = c.calendar_date` con `o.status = \'completed\'`) y `reembolsos_trimestre` (uniendo `refunds` por `r.refund_date = c.calendar_date`, como hace `USERELATIONSHIP`). Devuelve `fiscal_quarter`, `pedidos_completados`, `ventas_completadas_usd` (`ROUND(..., 2)`) y `reembolsos_en_trimestre_usd` (`ROUND(..., 2)`), ordenado por `fiscal_quarter ASC`.',
    starterCode: `WITH ventas_trimestre AS (
  SELECT
    c.fiscal_quarter,
    COUNT(o.order_id) AS pedidos_completados,
    SUM(o.total_usd) AS ventas_completadas_usd
  FROM calendar c
  JOIN orders o ON c.calendar_date = o.order_date
  WHERE c.year = 2024
    AND o.status = 'completed'
  GROUP BY c.fiscal_quarter
),
reembolsos_trimestre AS (
  SELECT
    c.fiscal_quarter,
    -- TODO: Suma r.refund_amount_usd AS reembolsos_en_trimestre_usd uniendo calendar con refunds por refund_date en c.year = 2024
    0.0 AS reembolsos_en_trimestre_usd
  FROM calendar c
  GROUP BY c.fiscal_quarter
)
SELECT
  v.fiscal_quarter,
  v.pedidos_completados,
  ROUND(v.ventas_completadas_usd, 2) AS ventas_completadas_usd,
  ROUND(r.reembolsos_en_trimestre_usd, 2) AS reembolsos_en_trimestre_usd
FROM ventas_trimestre v
JOIN reembolsos_trimestre r ON v.fiscal_quarter = r.fiscal_quarter
ORDER BY v.fiscal_quarter ASC;`,
    expected: `WITH ventas_trimestre AS (
  SELECT
    c.fiscal_quarter,
    COUNT(o.order_id) AS pedidos_completados,
    SUM(o.total_usd) AS ventas_completadas_usd
  FROM calendar c
  JOIN orders o ON c.calendar_date = o.order_date
  WHERE c.year = 2024
    AND o.status = 'completed'
  GROUP BY c.fiscal_quarter
),
reembolsos_trimestre AS (
  SELECT
    c.fiscal_quarter,
    SUM(r.refund_amount_usd) AS reembolsos_en_trimestre_usd
  FROM calendar c
  JOIN refunds r ON c.calendar_date = r.refund_date
  WHERE c.year = 2024
  GROUP BY c.fiscal_quarter
)
SELECT
  v.fiscal_quarter,
  v.pedidos_completados,
  ROUND(v.ventas_completadas_usd, 2) AS ventas_completadas_usd,
  ROUND(r.reembolsos_en_trimestre_usd, 2) AS reembolsos_en_trimestre_usd
FROM ventas_trimestre v
JOIN reembolsos_trimestre r ON v.fiscal_quarter = r.fiscal_quarter
ORDER BY v.fiscal_quarter ASC;`,
    orderMatters: true,
    hints: [
      'En la CTE `reembolsos_trimestre`, une `JOIN refunds r ON c.calendar_date = r.refund_date`.',
      'Añade `WHERE c.year = 2024` dentro de `reembolsos_trimestre`.',
      'Calcula `SUM(r.refund_amount_usd) AS reembolsos_en_trimestre_usd` en esa segunda CTE.',
    ],
    solution: `WITH ventas_trimestre AS (
  SELECT
    c.fiscal_quarter,
    COUNT(o.order_id) AS pedidos_completados,
    SUM(o.total_usd) AS ventas_completadas_usd
  FROM calendar c
  JOIN orders o ON c.calendar_date = o.order_date
  WHERE c.year = 2024
    AND o.status = 'completed'
  GROUP BY c.fiscal_quarter
),
reembolsos_trimestre AS (
  SELECT
    c.fiscal_quarter,
    SUM(r.refund_amount_usd) AS reembolsos_en_trimestre_usd
  FROM calendar c
  JOIN refunds r ON c.calendar_date = r.refund_date
  WHERE c.year = 2024
  GROUP BY c.fiscal_quarter
)
SELECT
  v.fiscal_quarter,
  v.pedidos_completados,
  ROUND(v.ventas_completadas_usd, 2) AS ventas_completadas_usd,
  ROUND(r.reembolsos_en_trimestre_usd, 2) AS reembolsos_en_trimestre_usd
FROM ventas_trimestre v
JOIN reembolsos_trimestre r ON v.fiscal_quarter = r.fiscal_quarter
ORDER BY v.fiscal_quarter ASC;`,
    solutionExplanation: 'Cada CTE aplica el filtro de `calendar` sobre su propia columna de fecha (`order_date` para ventas y `refund_date` para devoluciones) antes de combinar ambos resultados por `fiscal_quarter`, reproduciendo exactamente el comportamiento de dos medidas DAX donde la segunda invoca `USERELATIONSHIP`.',
    expectedOutputTable: [
      {
        fiscal_quarter: 'FY24-Q1',
        pedidos_completados: 1400,
        ventas_completadas_usd: 585570.16,
        reembolsos_en_trimestre_usd: 25899.55,
      },
      {
        fiscal_quarter: 'FY24-Q2',
        pedidos_completados: 1613,
        ventas_completadas_usd: 676160.37,
        reembolsos_en_trimestre_usd: 31227.19,
      },
      {
        fiscal_quarter: 'FY24-Q3',
        pedidos_completados: 1755,
        ventas_completadas_usd: 729187.45,
        reembolsos_en_trimestre_usd: 42326.55,
      },
      {
        fiscal_quarter: 'FY24-Q4',
        pedidos_completados: 1729,
        ventas_completadas_usd: 740598.52,
        reembolsos_en_trimestre_usd: 40774.88,
      },
    ],
  },

  roleNotes: {
    bi: 'Marca siempre `calendar` como tabla de fechas (`Mark as date table`), desactiva `Auto date/time` en las opciones del archivo y configura `Sort by column` en `month_name` (por `month`) y `day_name` (por `day_of_week`).',
    de: 'Genera la espina de calendario (`dim_calendar`) usando límites explícitos de fecha (`GENERATE_SERIES(DATE \'2023-01-01\', DATE \'2025-12-31\', INTERVAL 1 DAY)`) en lugar de sumar múltiplos fijos de 365 días que fallan en años bisiestos.',
    da: 'Documenta siempre en las notas del tablero si la tasa de reembolso del mes mide devoluciones ocurridas en el mes (`refund_date`) o devoluciones de cohortes compradas en ese mes (`order_date`).',
  },

  summary: [
    'Una tabla de fechas marcada exige tipo Date, valores únicos, cero nulos y continuidad diaria de enero a diciembre.',
    'Desactivar Auto date/time evita que Power BI cree decenas de tablas de calendario ocultas en memoria.',
    'Las etiquetas de texto como `month_name` deben ordenarse por su columna numérica (`month`) con Sort by column.',
    'USERELATIONSHIP activa en tiempo de cálculo una relación secundaria de fecha sin duplicar la tabla `calendar`.',
  ],

  flashcards: [
    {
      id: 'fc-bi2-ms-04-a',
      front: '¿Cuáles son las cuatro condiciones que exige Power BI en la columna de fecha para marcar una tabla como tabla de fechas oficial?',
      back: 'Tipo de dato Date, valores únicos, ausencia de nulos y continuidad de fechas sin días faltantes cubriendo años completos.',
    },
    {
      id: 'fc-bi2-ms-04-b',
      front: '¿Para qué sirve la función `USERELATIONSHIP(calendar[calendar_date], refunds[refund_date])` dentro de `CALCULATE`?',
      back: 'Activa temporalmente una relación inactiva durante la evaluación de esa medida y desactiva la relación activa entre ambas tablas.',
    },
    {
      id: 'fc-bi2-ms-04-c',
      front: '¿Cómo evitas que un gráfico en Power BI ordene los meses alfabéticamente (Abril, Agosto, Diciembre...)?',
      back: 'Seleccionando la columna `month_name` y asignándole la columna numérica `month` (1 a 12) en la propiedad Ordenar por columna (Sort by column).',
    },
  ],

  glossaryTerms: [
    'tabla-fechas-marcada',
    'relacion-inactiva-userelationship',
  ],

  sources: [
    {
      title: 'Microsoft Learn — Model date tables in Power BI Desktop',
      url: 'https://learn.microsoft.com/en-us/power-bi/guidance/model-date-tables',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Reglas de validación para marcar una tabla de fechas y desactivación de Auto date/time.',
    },
    {
      title: 'Microsoft Learn — Active vs inactive relationship guidance',
      url: 'https://learn.microsoft.com/en-us/power-bi/guidance/relationships-active-inactive',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Criterios para elegir entre relaciones inactivas con medidas y dimensiones de rol duplicadas.',
    },
    {
      title: 'Microsoft Learn — USERELATIONSHIP function (DAX)',
      url: 'https://learn.microsoft.com/en-us/dax/userelationship-function-dax',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Sintaxis y restricciones de la función USERELATIONSHIP en DAX.',
    },
    {
      title: 'Kimball Group — Dimensional Modeling Techniques: Role-Playing Dimensions',
      url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/role-playing-dimension/',
      publisher: 'Kimball Group',
      accessed: '2026-10-29',
      supports: 'Diseño de dimensiones de calendario que cumplen múltiples roles temporales sobre los hechos.',
    },
  ],

  aiNotes: 'Insiste en dos errores clásicos: (1) creer que `USERELATIONSHIP` puede usarse fuera de `CALCULATE` (solo funciona como modificador de filtro de `CALCULATE` o `CALCULATETABLE`), y (2) confundir el análisis de cohorte por fecha de pedido (`order_date`) con el cierre contable por fecha de reembolso (`refund_date`).',
};

export default lesson;
