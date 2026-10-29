export const lesson = {
  id: 'da3-experimentos-05-efectos-red-interferencia-switchback',
  v2Id: 'da3-experimentos-05-efectos-red-interferencia-switchback',
  moduleId: 'da3-experimentos',
  track: 'da',
  level: 3,
  order: 5,
  title: 'Interferencia de red, conglomerados y pruebas switchback',
  subtitle: 'Cuándo no se puede hacer un A/B: efectos de red, interferencia y pruebas switchback',
  minutes: 20,
  needsReview: false,
  prerequisites: [
    'da2-inferencia-04-hipotesis-t-welch-pvalor',
    'da3-experimentos-01-ab-testing-cuped',
    'da3-experimentos-02-comparaciones-multiples-bh',
  ],
  learningObjectives: [
    'Identificar violaciones al supuesto SUTVA cuando el tratamiento de un usuario afecta la oferta, el inventario o los tiempos de entrega del grupo control.',
    'Calcular el error estándar al grano del conglomerado (cluster randomization) para evitar la pseudorreplicación por correlación intraclase.',
    'Diseñar y agregar experimentos de alternancia temporal (switchback) por bloques tienda-semana en SQL.',
  ],
  hook: 'Si Mercado Brisa prueba un algoritmo de despacho prioritario asignando al azar el 50 % de los pedidos de un mismo almacén a tratamiento y el 50 % a control, los pedidos tratados acaparan a los repartidores disponibles y retrasan artificialmente al grupo control: ¿por qué esta interferencia duplica de forma ilusoria el efecto estimado y cómo permiten los diseños por conglomerados y las pruebas switchback recuperar la validez causal?',
  objectives: [
    'Diagnosticar derrames de red y canibalización que violan el supuesto SUTVA.',
    'Cuantificar la inflación del error estándar por correlación intraclase en conglomerados.',
    'Construir el estimador de alternancia temporal (switchback) por bloque tienda-semana.',
  ],
  sections: [
    {
      id: 'sutva-interferencia-red',
      heading: 'El supuesto SUTVA y el sesgo por interferencia en recursos compartidos',
      body: `Toda prueba A/B clásica a nivel de usuario descansa sobre el supuesto **SUTVA** (*Stable Unit Treatment Value Assumption*, Rubin, 1980). Este principio exige que el resultado potencial $Y_i$ de la unidad $i$ dependa exclusivamente de su propia asignación $Z_i \\in \\{0, 1\\}$ y no del vector de asignaciones $\\mathbf{Z}_{-i}$ del resto de las unidades:

$$Y_i(\\mathbf{Z}) = Y_i(Z_i)$$

En **Mercado Brisa**, el supuesto SUTVA se rompe en tres escenarios operativos frecuentes:
- **Inventario compartido**: si una promoción agresiva en el grupo tratado agota un lote de café de origen limitado en el almacén central, los clientes del grupo control encuentran quiebres de stock y compran menos.
- **Capacidad logística finita**: si los pedidos tratados reciben prioridad de empaque en las tiendas \`flagship\` o \`warehouse\`, la fila de espera de los pedidos control se alarga.
- **Efectos de red bilaterales**: en mercados con oferta compartida, el beneficio capturado por el brazo tratado se logra canibalizando directamente al brazo control ($\bar{Y}_C$ cae artificialmente), lo que infla la diferencia $\\bar{Y}_T - \\bar{Y}_C$ hasta el doble del efecto real si la innovación se desplegara al $100\\%$ del mercado.`,
    },
    {
      id: 'conglomerados-deff',
      heading: 'Aleatorización por conglomerados y falacia de pseudorreplicación',
      body: `Cuando los usuarios dentro de una misma tienda o ciudad comparten inventario y personal, la primera solución estructural es la **aleatorización por conglomerados** (*cluster randomization*, Ugander et al., 2013): asignar tiendas o ciudades completas a tratamiento o control.

Sin embargo, cambiar la unidad de aleatorización impone una regla estadística estricta: **la unidad de análisis debe coincidir con la unidad de aleatorización**. Si asignamos $K = 14$ tiendas ($7$ a tratamiento y $7$ a control) pero ejecutamos una prueba $t$ sobre las $N = 14{,}760$ órdenes completadas como si fueran independientes, cometemos **pseudorreplicación**.

Las órdenes de una misma tienda presentan **correlación intraclase** ($\\rho_{\\text{ICC}} > 0$), lo que multiplica la varianza verdadera por el **efecto de diseño** (*Design Effect*, DEFF):

$$\\text{DEFF} = 1 + (\\bar{m} - 1)\\,\\rho_{\\text{ICC}}$$

donde $\\bar{m}$ es el número medio de órdenes por tienda. Aunque $\\rho_{\\text{ICC}}$ sea apenas $0.05$, con $\\bar{m} = 1{,}054$ órdenes por tienda resulta $\\text{DEFF} \\approx 53.7$, inflando el error estándar real más de siete veces ($\sqrt{53.7} \\approx 7.3\\times$).`,
      example: {
        language: 'sql',
        title: 'Inflación del error estándar al comparar grano de orden vs. grano de tienda',
        code: `WITH por_tienda AS (
  SELECT
    s.store_id,
    CASE WHEN s.store_id % 2 = 0 THEN 'treatment' ELSE 'control' END AS brazo_cluster,
    COUNT(o.order_id) AS n_ordenes,
    AVG(o.total_usd) AS media_tienda_usd
  FROM stores s
  JOIN orders o USING (store_id)
  WHERE o.status = 'completed'
  GROUP BY 1, 2
),
resumen_cluster AS (
  SELECT
    brazo_cluster,
    COUNT(*) AS k_tiendas,
    SUM(n_ordenes) AS total_ordenes,
    ROUND(AVG(media_tienda_usd), 2) AS media_cluster_usd,
    ROUND(STDDEV_SAMP(media_tienda_usd) / SQRT(COUNT(*)), 2) AS ee_cluster_correcto
  FROM por_tienda
  GROUP BY 1
),
resumen_ingenuo AS (
  SELECT
    CASE WHEN o.store_id % 2 = 0 THEN 'treatment' ELSE 'control' END AS brazo_cluster,
    ROUND(STDDEV_SAMP(o.total_usd) / SQRT(COUNT(*)), 2) AS ee_orden_ingenuo
  FROM orders o
  WHERE o.status = 'completed'
  GROUP BY 1
)
SELECT
  c.brazo_cluster,
  c.k_tiendas,
  c.total_ordenes,
  c.media_cluster_usd,
  i.ee_orden_ingenuo,
  c.ee_cluster_correcto,
  ROUND(c.ee_cluster_correcto / i.ee_orden_ingenuo, 2) AS factor_inflacion_ee
FROM resumen_cluster c
JOIN resumen_ingenuo i USING (brazo_cluster)
ORDER BY 1;`,
        expectedOutput: {
          columns: ['brazo_cluster', 'k_tiendas', 'total_ordenes', 'media_cluster_usd', 'ee_orden_ingenuo', 'ee_cluster_correcto', 'factor_inflacion_ee'],
          rows: [
            ['control', '7', '6327', '414.36', '4', '28.48', '7.12'],
            ['treatment', '7', '8433', '437.31', '3.47', '27.44', '7.91'],
          ],
        },
        annotation: 'Analizar a nivel de orden subestima el error estándar entre 7.12 y 7.91 veces (4.00 vs 28.48 USD), convirtiendo ruido entre tiendas en un falso positivo masivo.',
      },
    },
    {
      id: 'diseno-switchback-temporal',
      heading: 'Experimentos de alternancia temporal (Switchback) y efectos de arrastre',
      body: `Cuando el número de conglomerados físicos es pequeño (como las $14$ tiendas de **Mercado Brisa**), una asignación puramente espacial entre tiendas tiene baja potencia estadística. Los **experimentos switchback** (Bojinov, Simchi-Levi & Zhao, 2022) resuelven esta limitación alternando cada tienda entre régimen de tratamiento y régimen de control a lo largo de bloques temporales discretos $t \\in \\{1, \\dots, T\\}$ (por ejemplo horas, días o semanas ISO).

El estimador causal *switchback* agrega primero las órdenes dentro de cada **bloque tienda-tiempo** $(i, t)$ y luego contrasta los bloques asignados a tratamiento frente a los bloques asignados a control:

$$\\hat{\\Delta}_{\\text{SB}} = \\frac{1}{|\\mathcal{B}_T|}\\sum_{(i,t) \\in \\mathcal{B}_T} Y_{i,t} - \\frac{1}{|\\mathcal{B}_C|}\\sum_{(i,t) \\in \\mathcal{B}_C} Y_{i,t}$$

El principal riesgo operativo de un diseño *switchback* es el **efecto de arrastre** (*carryover effect*): si el tratamiento aplicado en el bloque $t$ altera el estado del inventario o la cola de pedidos al inicio del bloque $t+1$, contamina el periodo siguiente. Para neutralizarlo, la longitud del bloque debe superar la memoria del sistema y suele descartarse una ventana inicial de lavado (*burn-in* o *washout*) en cada cambio de régimen.`,
    },
  ],
  workedExample: {
    problem: 'Diseña la evaluación logística para las 14 tiendas de Mercado Brisa (stores + orders + calendar). Primero cuantifica la dispersión estructural entre tiendas según su formato (store_type); luego construye la agregación switchback por bloque (store_id, iso_week) durante el año 2024.',
    steps: [
      {
        title: 'Paso 1: Diagnóstico de heterogeneidad entre tiendas por formato operativo',
        rationale: 'Agregamos primero por store_id y luego por store_type para observar la variabilidad estructural entre tiendas antes de diseñar bloques switchback.',
        code: `WITH por_tienda AS (
  SELECT
    s.store_type,
    s.store_id,
    COUNT(o.order_id) AS ordenes_tienda,
    AVG(o.total_usd) AS ticket_tienda
  FROM stores s
  JOIN orders o USING (store_id)
  WHERE o.status = 'completed'
  GROUP BY 1, 2
)
SELECT
  store_type,
  COUNT(*) AS k_tiendas,
  SUM(ordenes_tienda) AS total_ordenes,
  ROUND(AVG(ticket_tienda), 2) AS media_entre_tiendas,
  ROUND(STDDEV_SAMP(ticket_tienda), 2) AS sd_entre_tiendas
FROM por_tienda
GROUP BY 1
ORDER BY 1;`,
        output: `store_type | k_tiendas | total_ordenes | media_entre_tiendas | sd_entre_tiendas
-----------+-----------+---------------+---------------------+-----------------
flagship   | 4         | 3730          | 373.25              | 28.56
retail     | 7         | 8404          | 416.47              | 63.00
warehouse  | 3         | 2626          | 517.80              | 45.88`,
        takeaway: 'Con solo 3 a 7 tiendas por formato y desviaciones entre tiendas de 28.56 a 63.00 USD, un corte fijo por tienda carece de grados de libertad suficientes; necesitamos bloques switchback.',
      },
      {
        title: 'Paso 2: Agregación switchback al grano de bloque (store_id, iso_week) en 2024',
        rationale: 'Unimos orders, stores y calendar en 2024, asignamos el régimen alternante (store_id + iso_week) % 2 y calculamos la media y el error estándar sobre los bloques tienda-semana.',
        code: `WITH bloques AS (
  SELECT
    s.store_id,
    s.store_type,
    c.year,
    c.iso_week,
    CASE WHEN (s.store_id + c.iso_week) % 2 = 0 THEN 'treatment' ELSE 'control' END AS regimen_switchback,
    COUNT(o.order_id) AS ordenes_bloque,
    SUM(o.total_usd) AS ingreso_bloque_usd,
    AVG(o.total_usd) AS ticket_medio_bloque
  FROM orders o
  JOIN stores s USING (store_id)
  JOIN calendar c ON o.order_date = c.calendar_date
  WHERE o.status = 'completed'
    AND c.year = 2024
  GROUP BY 1, 2, 3, 4, 5
)
SELECT
  store_type,
  regimen_switchback,
  COUNT(*) AS n_bloques_tienda_semana,
  SUM(ordenes_bloque) AS total_ordenes,
  ROUND(AVG(ingreso_bloque_usd), 2) AS media_ingreso_bloque,
  ROUND(STDDEV_SAMP(ingreso_bloque_usd) / SQRT(COUNT(*)), 2) AS ee_ingreso_bloque,
  ROUND(AVG(ticket_medio_bloque), 2) AS media_ticket_bloque
FROM bloques
GROUP BY 1, 2
ORDER BY 1, 2;`,
        output: `store_type | regimen_switchback | n_bloques_tienda_semana | total_ordenes | media_ingreso_bloque | ee_ingreso_bloque | media_ticket_bloque
-----------+--------------------+-------------------------+---------------+----------------------+-------------------+--------------------
flagship   | control            | 106                     | 845           | 3056.31              | 166.91            | 387.09
flagship   | treatment          | 104                     | 813           | 2868.50              | 149.80            | 371.42
retail     | control            | 180                     | 1886          | 4234.21              | 245.36            | 400.86
retail     | treatment          | 184                     | 1821          | 4113.32              | 251.06            | 413.79
warehouse  | control            | 80                      | 565           | 3663.69              | 289.11            | 482.71
warehouse  | treatment          | 78                      | 567           | 3809.25              | 286.30            | 503.55`,
        takeaway: 'Al alternar por semana ISO cada tienda actúa como su propio control a lo largo del año, multiplicando los grados de libertad de 14 tiendas a 732 bloques tienda-semana.',
      },
    ],
  },
  checks: [
    {
      id: 'c1',
      type: 'multiple-choice',
      prompt: 'En una prueba de precios dinámicos dentro de una misma ciudad, los usuarios tratados reciben descuentos que agotan a los repartidores disponibles, provocando cancelaciones en los usuarios control de esa ciudad. ¿Qué supuesto fundamental se violó?',
      options: [
        {
          id: 'a',
          text: 'El teorema del límite central, porque los precios no siguen una distribución uniforme.',
          feedback: 'Incorrecto. El teorema del límite central se refiere a la distribución asintótica de las medias muestrales, no a la interferencia entre unidades.',
        },
        {
          id: 'b',
          text: 'El supuesto SUTVA (Stable Unit Treatment Value Assumption), porque el resultado de los usuarios control fue alterado por la asignación de los usuarios tratados.',
          feedback: 'Correcto. Cuando ambos brazos compiten por una oferta o logística compartida, el grupo control sufre canibalización y deja de representar el contrafactual puro.',
        },
        {
          id: 'c',
          text: 'La propiedad de conjugación Beta-Binomial, porque hay más de dos variantes.',
          feedback: 'Incorrecto. La interferencia operativa ocurre en el mecanismo físico del experimento independientemente de si el análisis posterior es frecuentista o bayesiano.',
        },
        {
          id: 'd',
          text: 'El supuesto de homocedasticidad de Bonferroni, que exige igual número de repartidores por hora.',
          feedback: 'Incorrecto. Bonferroni es una cota para comparaciones múltiples y no tiene relación con la interferencia de recursos compartidos.',
        },
      ],
      correctOptionId: 'b',
      explanation: 'SUTVA exige ausencia de interferencia entre unidades; cuando el tratamiento acapara capacidad compartida y degrada al control, el estimador ingenuo sobreestima el efecto causal.',
    },
    {
      id: 'c2',
      type: 'multiple-choice',
      prompt: 'Asignas 14 tiendas a tratamiento o control (7 por brazo) y recolectas 14,760 órdenes completadas. Si calculas el error estándar dividiendo entre SQRT(14,760) en lugar de agregar primero por tienda, ¿qué error cometes?',
      options: [
        {
          id: 'a',
          text: 'Pseudorreplicación: tratas órdenes correlacionadas de la misma tienda como si fueran asignaciones independientes, subestimando el error estándar más de 7 veces.',
          feedback: 'Correcto. Cuando la aleatorización ocurre a nivel de tienda, la correlación intraclase infla la varianza verdadera según el factor DEFF = 1 + (m - 1) * rho.',
        },
        {
          id: 'b',
          text: 'Sesgo de atenuación post-tratamiento, porque el número de tiendas es par.',
          feedback: 'Incorrecto. El problema no es que 14 sea par, sino ignorar la estructura de conglomerado en el denominador del error estándar.',
        },
        {
          id: 'c',
          text: 'Subestimación de la media muestral, porque AVG(total_usd) cambia de signo al agrupar.',
          feedback: 'Incorrecto. El problema principal de la pseudorreplicación no es el signo de la media sino el colapso artificial del error estándar.',
        },
        {
          id: 'd',
          text: 'Inflación del error Tipo II, haciendo imposible rechazar cualquier hipótesis nula.',
          feedback: 'Incorrecto. Al subestimar el error estándar 7 veces, el estadístico t se multiplica por 7 y dispara los falsos positivos (error Tipo I), no el error Tipo II.',
        },
      ],
      correctOptionId: 'a',
      explanation: 'La unidad de análisis debe respetar el grano de aleatorización; ignorar el conglomerado equivale a asumir rho_ICC = 0 y produce intervalos de confianza falsamente estrechos.',
    },
    {
      id: 'c3',
      type: 'multiple-choice',
      prompt: 'En un experimento switchback donde cada almacén alterna entre tratamiento y control cada 2 horas, ¿qué es el efecto de arrastre (carryover) y cómo se mitiga?',
      options: [
        {
          id: 'a',
          text: 'Es la persistencia del estado operativo de un bloque temporal sobre el bloque siguiente; se mitiga ampliando la ventana del bloque e introduciendo periodos de lavado (washout).',
          feedback: 'Correcto. Si un bloque de tratamiento deja pedidos atrasados al iniciar el bloque de control, descartar la transición inicial (washout) evita contaminar la medición.',
        },
        {
          id: 'b',
          text: 'Es la diferencia de huso horario entre países; se corrige eliminando la tabla calendar.',
          feedback: 'Incorrecto. El carryover es una dependencia dinámica entre bloques consecutivos de una misma unidad, no un problema de huso horario.',
        },
        {
          id: 'c',
          text: 'Es el aumento de precisión por usar funciones de ventana; se maximiza reduciendo los bloques a 1 segundo.',
          feedback: 'Incorrecto. Reducir los bloques a segundos destruye por completo la validez del switchback porque el sistema no alcanza su estado estacionario bajo ningún régimen.',
        },
        {
          id: 'd',
          text: 'Es un sinónimo de Sample Ratio Mismatch exclusivo de tiendas minoristas.',
          feedback: 'Incorrecto. El carryover mide interferencia temporal entre regímenes sucesivos, mientras SRM mide desbalance en el conteo de unidades asignadas.',
        },
      ],
      correctOptionId: 'a',
      explanation: 'Bojinov et al. (2022) demuestran que cuando el tratamiento tiene memoria de orden m en el tiempo, insertar periodos de lavado (burn-in/washout) entre cambios de régimen restablece la insesgadez.',
    },
  ],
  practice: {
    type: 'sql',
    title: 'Práctica: Análisis de experimento switchback por bloque tienda-semana en 2024',
    prompt: 'Evalúa un diseño switchback sobre las órdenes completadas (status = \'completed\') del año 2024 (year = 2024 en calendar) uniendo orders, stores y calendar (o.order_date = c.calendar_date). Agrega primero al grano del bloque (store_id, store_type, year, iso_week) definiendo regimen_switchback = \'treatment\' cuando (store_id + iso_week) % 2 = 0 y \'control\' en caso contrario. Luego resume por store_type y regimen_switchback devolviendo exactamente las columnas: store_type, regimen_switchback, n_bloques_tienda_semana, total_ordenes, media_ingreso_bloque, ee_ingreso_bloque y media_ticket_bloque, ordenadas por store_type y regimen_switchback.',
    starterCode: `WITH bloques AS (
  SELECT
    s.store_id,
    s.store_type,
    c.year,
    c.iso_week,
    CASE WHEN (s.store_id + c.iso_week) % 2 = 0 THEN 'treatment' ELSE 'control' END AS regimen_switchback,
    COUNT(o.order_id) AS ordenes_bloque,
    SUM(o.total_usd) AS ingreso_bloque_usd,
    AVG(o.total_usd) AS ticket_medio_bloque
  FROM orders o
  JOIN stores s USING (store_id)
  JOIN calendar c ON o.order_date = c.calendar_date
  WHERE o.status = 'completed'
    AND c.year = 2024
  GROUP BY 1, 2, 3, 4, 5
)
-- Agrega sobre la CTE bloques por store_type y regimen_switchback
SELECT
  store_type,
  regimen_switchback,
  COUNT(*) AS n_bloques_tienda_semana
FROM bloques
GROUP BY 1, 2
ORDER BY 1, 2;`,
    hints: [
      'La CTE bloques ya está agregada correctamente al grano de la unidad de aleatorización (store_id, iso_week) con ordenes_bloque, ingreso_bloque_usd y ticket_medio_bloque.',
      'En el SELECT final agrupa por store_type y regimen_switchback y calcula COUNT(*) AS n_bloques_tienda_semana y SUM(ordenes_bloque) AS total_ordenes.',
      'Añade ROUND(AVG(ingreso_bloque_usd), 2) AS media_ingreso_bloque, ROUND(STDDEV_SAMP(ingreso_bloque_usd) / SQRT(COUNT(*)), 2) AS ee_ingreso_bloque y ROUND(AVG(ticket_medio_bloque), 2) AS media_ticket_bloque.',
    ],
    solution: `WITH bloques AS (
  SELECT
    s.store_id,
    s.store_type,
    c.year,
    c.iso_week,
    CASE WHEN (s.store_id + c.iso_week) % 2 = 0 THEN 'treatment' ELSE 'control' END AS regimen_switchback,
    COUNT(o.order_id) AS ordenes_bloque,
    SUM(o.total_usd) AS ingreso_bloque_usd,
    AVG(o.total_usd) AS ticket_medio_bloque
  FROM orders o
  JOIN stores s USING (store_id)
  JOIN calendar c ON o.order_date = c.calendar_date
  WHERE o.status = 'completed'
    AND c.year = 2024
  GROUP BY 1, 2, 3, 4, 5
)
SELECT
  store_type,
  regimen_switchback,
  COUNT(*) AS n_bloques_tienda_semana,
  SUM(ordenes_bloque) AS total_ordenes,
  ROUND(AVG(ingreso_bloque_usd), 2) AS media_ingreso_bloque,
  ROUND(STDDEV_SAMP(ingreso_bloque_usd) / SQRT(COUNT(*)), 2) AS ee_ingreso_bloque,
  ROUND(AVG(ticket_medio_bloque), 2) AS media_ticket_bloque
FROM bloques
GROUP BY 1, 2
ORDER BY 1, 2;`,
    solutionExplanation: 'Al agregar primero en la CTE bloques por (store_id, iso_week) y calcular el error estándar en el SELECT externo dividiendo entre SQRT(COUNT(*)) de los bloques —y no de las órdenes individuales—, respetamos la unidad de aleatorización temporal-espacial del diseño switchback.',
    expectedOutput: {
      columns: ['store_type', 'regimen_switchback', 'n_bloques_tienda_semana', 'total_ordenes', 'media_ingreso_bloque', 'ee_ingreso_bloque', 'media_ticket_bloque'],
      rows: [
        ['flagship', 'control', '106', '845', '3056.31', '166.91', '387.09'],
        ['flagship', 'treatment', '104', '813', '2868.5', '149.8', '371.42'],
        ['retail', 'control', '180', '1886', '4234.21', '245.36', '400.86'],
        ['retail', 'treatment', '184', '1821', '4113.32', '251.06', '413.79'],
        ['warehouse', 'control', '80', '565', '3663.69', '289.11', '482.71'],
        ['warehouse', 'treatment', '78', '567', '3809.25', '286.3', '503.55'],
      ],
    },
    expectedOutputTable: {
      columns: ['store_type', 'regimen_switchback', 'n_bloques_tienda_semana', 'total_ordenes', 'media_ingreso_bloque', 'ee_ingreso_bloque', 'media_ticket_bloque'],
      rows: [
        { store_type: 'flagship', regimen_switchback: 'control', n_bloques_tienda_semana: 106, total_ordenes: 845, media_ingreso_bloque: 3056.31, ee_ingreso_bloque: 166.91, media_ticket_bloque: 387.09 },
        { store_type: 'flagship', regimen_switchback: 'treatment', n_bloques_tienda_semana: 104, total_ordenes: 813, media_ingreso_bloque: 2868.5, ee_ingreso_bloque: 149.8, media_ticket_bloque: 371.42 },
        { store_type: 'retail', regimen_switchback: 'control', n_bloques_tienda_semana: 180, total_ordenes: 1886, media_ingreso_bloque: 4234.21, ee_ingreso_bloque: 245.36, media_ticket_bloque: 400.86 },
        { store_type: 'retail', regimen_switchback: 'treatment', n_bloques_tienda_semana: 184, total_ordenes: 1821, media_ingreso_bloque: 4113.32, ee_ingreso_bloque: 251.06, media_ticket_bloque: 413.79 },
        { store_type: 'warehouse', regimen_switchback: 'control', n_bloques_tienda_semana: 80, total_ordenes: 565, media_ingreso_bloque: 3663.69, ee_ingreso_bloque: 289.11, media_ticket_bloque: 482.71 },
        { store_type: 'warehouse', regimen_switchback: 'treatment', n_bloques_tienda_semana: 78, total_ordenes: 567, media_ingreso_bloque: 3809.25, ee_ingreso_bloque: 286.3, media_ticket_bloque: 503.55 },
      ],
    },
  },
  roleNotes: {
    da: 'Como analista de datos, verifica siempre cuál fue el grano físico o temporal de asignación antes de escribir el GROUP BY: si el experimento se asignó por tienda o por bloque horario, nunca reportes errores estándar a nivel de transacción.',
    ds: 'Desde ciencia de datos, puedes combinar bloques switchback con controles sintéticos o efectos fijos bidireccionales (tienda + semana ISO) y errores estándar agrupados (cluster-robust) para absorber choques estacionales.',
    de: 'Como ingeniero de datos, registra en la tabla de eventos de asignación el identificador explícito del bloque (store_id, window_start_ts, window_end_ts) y marca las órdenes ocurridas durante la ventana de lavado (washout).',
  },
  summary: [
    'El supuesto SUTVA se rompe cuando las unidades de tratamiento y control compiten por inventario, capacidad logística o atención en el mismo mercado.',
    'La aleatorización por conglomerados aisla la interferencia asignando tiendas o ciudades enteras, pero introduce correlación intraclase entre órdenes.',
    'Ignorar el conglomerado en el análisis comete pseudorreplicación y subestima el error estándar en un factor de SQRT(1 + (m - 1) * rho_ICC).',
    'Las pruebas switchback alternan regímenes en el tiempo dentro de cada tienda y exigen agregar las métricas al grano del bloque tienda-tiempo.',
  ],
  flashcards: [
    {
      id: 'f1',
      front: '¿Qué establece el supuesto SUTVA en inferencia causal y experimentación?',
      back: 'Que el resultado potencial de cualquier unidad depende únicamente de su propia asignación a variante y no de la asignación recibida por otras unidades.',
    },
    {
      id: 'f2',
      front: '¿Por qué un experimento con interferencia de oferta compartida suele sobrestimar el efecto real?',
      back: 'Porque el grupo tratado captura recursos a expensas del grupo control, subiendo la media tratada y deprimiendo simultáneamente la media control.',
    },
    {
      id: 'f3',
      front: '¿Cuál es la fórmula del efecto de diseño (DEFF) en aleatorización por conglomerados?',
      back: 'DEFF = 1 + (m_barra - 1) * rho_ICC, donde m_barra es el tamaño medio del conglomerado y rho_ICC es la correlación intraclase.',
    },
    {
      id: 'f4',
      front: '¿Cuál debe ser el grano de la primera CTE al analizar en SQL un experimento switchback por tienda y semana?',
      back: 'El bloque (store_id, iso_week), de modo que el conteo y la desviación estándar posteriores se calculen sobre bloques tienda-semana y no sobre órdenes individuales.',
    },
  ],
  glossaryTerms: [
    'supuesto-sutva-interferencia',
    'aleatorizacion-por-conglomerados',
    'experimento-switchback',
    'error-estandar',
  ],
  relatedLessons: [
    'da3-experimentos-01-ab-testing-cuped',
    'da3-experimentos-02-comparaciones-multiples-bh',
    'da3-experimentos-04-enfoque-bayesiano-ab',
  ],
  sources: [
    {
      title: 'Design and Analysis of Switchback Experiments (Management Science 2022)',
      url: 'https://arxiv.org/abs/2009.00148',
      publisher: 'INFORMS Management Science / arXiv',
      accessed: '2026-10-29',
      supports: 'Teoría formal de experimentos switchback, orden de efectos de arrastre (carryover) y diseño óptimo de bloques temporales.',
    },
    {
      title: 'Graph Cluster Randomization: Network Exposure to Multiple Universes (ACM KDD 2013)',
      url: 'https://arxiv.org/abs/1305.5565',
      publisher: 'ACM KDD / arXiv',
      accessed: '2026-10-29',
      supports: 'Violación del supuesto SUTVA bajo interferencia de red y aleatorización por conglomerados.',
    },
    {
      title: 'Trustworthy Online Controlled Experiments (Capítulo 22: Leakage and Interference)',
      url: 'https://experimentguide.com/',
      publisher: 'Cambridge University Press',
      accessed: '2026-10-29',
      supports: 'Mecanismos de interferencia en mercados bilaterales, aleatorización por clústeres y pruebas switchback.',
    },
  ],
  aiNotes: 'Insiste en la regla de oro de esta lección: la unidad de análisis debe coincidir con la unidad de aleatorización. Si el estudiante calcula STDDEV_SAMP(total_usd) / SQRT(COUNT(order_id)) directamente sobre orders, explícale por qué eso comete pseudorreplicación (subestimando el error estándar ~7.5 veces) y guíalo para agrupar primero en la CTE bloques por (store_id, iso_week).',
};

export default lesson;
