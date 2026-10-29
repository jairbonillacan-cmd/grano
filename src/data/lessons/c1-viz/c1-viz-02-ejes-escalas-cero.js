const lesson = {
  id: 'c1-viz-02-ejes-escalas-cero',
  moduleId: 'c1-viz',
  tracks: ['core'],
  level: 1,
  order: 2,
  title: 'Ejes, escalas, cuándo exigir el cero y ejes dobles',
  minutes: 20,
  prerequisites: ['c1-viz-01-geometria-grafico'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), un informe trimestral muestra un gráfico de barras donde el ticket medio del cuarto trimestre (`428.34` USD) parece cuatro veces más alto que el del tercer trimestre (`415.49` USD) porque el eje vertical comienza en `410` USD. En la página siguiente, un gráfico de doble eje superpone el gasto de marketing en dólares con las impresiones en millones y sugiere un cruce alarmante. ¿Cómo decides cuándo un eje debe empezar en cero y cómo comparas dos unidades distintas sin distorsionar la escala?',

  objectives: [
    'Aplicar el principio de tinta proporcional para exigir el origen en cero en todo gráfico de barras o de área sombreada.',
    'Distinguir cuándo un gráfico de líneas o de puntos puede acotar su eje cuantitativo para mostrar variaciones relativas.',
    'Reemplazar los gráficos de doble eje vertical por paneles apilados o series indexadas a base 100 en SQL.'
  ],

  sections: [
    {
      id: 'principio-tinta-proporcional-y-cero',
      heading: 'Por qué todo gráfico de barras debe empezar en cero',
      body: 'En un gráfico de barras o de área rellena, el lector no solo mira el borde superior. Compara la superficie total coloreada de una barra contra la de su vecina. Claus Wilke, Carl Bergstrom y Jevin West llaman a esta regla el **principio de tinta proporcional**. Cuando una zona sombreada representa un número, el área de tinta debe ser proporcional a esa cantidad.\n\nEn Mercado Brisa (empresa ficticia), el ticket medio trimestral de 2024 subió de `415.49` USD en el tercer trimestre a `428.34` USD en el cuarto trimestre. Ese aumento real es de solo un `3.1 %`. Si recortas el eje vertical para que empiece en `410` USD, la primera barra mide `5.49` unidades y la segunda mide `18.34` unidades. La segunda barra aparenta ser `3.34` veces mayor (`+234 %`) cuando el dato subió un `3.1 %`. Por eso, los gráficos de barras nunca deben truncar el cero.'
    },
    {
      id: 'cuando-acotar-el-eje-en-lineas',
      heading: 'Cuándo es válido acotar el eje en gráficos de líneas y puntos',
      body: 'Un gráfico de líneas sin área rellena o un gráfico de puntos funciona de forma distinta a una barra. Codifica los valores solo mediante la **posición** y la pendiente entre nodos, sin usar una columna de tinta sólida. A veces analizas una métrica que se mueve dentro de una banda estrecha lejos del cero, como el ticket medio trimestral alrededor de `420` USD. Si obligas al gráfico de líneas a partir de cero, la curva queda aplastada cerca del borde superior.\n\nEn un gráfico de líneas es válido acotar el eje vertical si cumples tres reglas. Primero, nunca rellenes con color ni sombra el área bajo la línea cuando el eje no parte de cero. Segundo, rotula con claridad el mínimo y el máximo del eje y traza una línea de referencia con el promedio. Tercero, incluye en la consulta la variación porcentual respecto a la media (`var_vs_media_anual_pct`) para dimensionar el cambio.',
      example: {
        language: 'sql',
        code: `SELECT
  c.fiscal_quarter,
  COUNT(o.order_id) AS pedidos,
  ROUND(AVG(o.total_usd), 2) AS ticket_medio_usd,
  ROUND(
    100.0 * (AVG(o.total_usd) - AVG(AVG(o.total_usd)) OVER ())
      / NULLIF(AVG(AVG(o.total_usd)) OVER (), 0),
    1
  ) AS var_vs_media_anual_pct
FROM orders o
JOIN calendar c ON o.order_date = c.calendar_date
WHERE o.status = 'completed'
  AND c.year = 2024
GROUP BY c.fiscal_quarter
ORDER BY c.fiscal_quarter ASC;`,
        expectedOutput: [
          {
            fiscal_quarter: 'FY24-Q1',
            pedidos: 1400,
            ticket_medio_usd: 418.26,
            var_vs_media_anual_pct: -0.5
          },
          {
            fiscal_quarter: 'FY24-Q2',
            pedidos: 1613,
            ticket_medio_usd: 419.19,
            var_vs_media_anual_pct: -0.3
          },
          {
            fiscal_quarter: 'FY24-Q3',
            pedidos: 1755,
            ticket_medio_usd: 415.49,
            var_vs_media_anual_pct: -1.1
          },
          {
            fiscal_quarter: 'FY24-Q4',
            pedidos: 1729,
            ticket_medio_usd: 428.34,
            var_vs_media_anual_pct: 1.9
          }
        ]
      }
    },
    {
      id: 'escalas-lineales-vs-logaritmicas',
      heading: 'Escalas lineales frente a escalas logarítmicas',
      body: 'En una escala lineal estándar, la misma distancia en píxeles representa siempre la misma suma aritmética. De `0` a `100` USD hay el mismo espacio que de `100` a `200` USD. Esta escala es la opción directa para la mayoría de los reportes diarios.\n\nSin embargo, algunas variables abarcan varios órdenes de magnitud o crecen de forma multiplicativa. Por ejemplo, las ubicaciones de Mercado Brisa van desde tiendas de `320` m² hasta almacenes de `4200` m². En una distribución tan asimétrica, una escala lineal comprime el `90 %` de los puntos en una esquina. Una **escala logarítmica** asigna la misma distancia física a cada multiplicación por un factor constante (`10`, `100`, `1000`). Si empleas una escala logarítmica, escribe en las marcas del eje los números originales (`100`, `1000`, `10000`) en lugar de exponentes y advierte del cambio en el subtítulo.'
    },
    {
      id: 'trampa-ejes-dobles-e-indice-100',
      heading: 'El peligro de los ejes dobles y la normalización a base 100',
      body: 'Un gráfico de eje doble coloca una escala vertical a la izquierda (`spend_usd`) y otra distinta a la derecha (`impressions` o `conversions`). Como demostró Stephen Few, el eje doble es engañoso por diseño. Quien configura el gráfico puede alterar el mínimo o el máximo de cualquiera de los dos ejes hasta lograr que las líneas se crucen en el mes que prefiera.\n\nPara comparar dos series de unidades distintas en el tiempo sin engañar al lector, aplica una de dos alternativas. La primera consiste en dibujar dos paneles separados, uno encima del otro, compartiendo el mismo eje horizontal de fechas. La segunda consiste en calcular un **índice base 100** en SQL. Divides cada valor de ambas series entre su valor inicial (`FIRST_VALUE`) y multiplicas por `100.0`. Así las dos series parten de `100.0` en la primera fecha y comparten un único eje vertical honesto.'
    }
  ],

  workedExample: {
    title: 'Sustituir un eje doble engañoso por dos series indexadas a base 100',
    description: 'Compara los valores crudos de gasto e impresiones trimestrales de marketing en 2024 frente a la transformación en SQL a un índice base 100 que permite graficar gasto y conversiones en una sola escala vertical.',
    audit: 'Al indexar a 100.0 en el primer trimestre de 2024, se comprueba que gasto (99.1, 102.1, 19.2) y conversiones (98.3, 102.5, 18.4) evolucionan casi en paralelo sin necesidad de un segundo eje.',
    steps: [
      {
        label: 'Antipatrón: magnitudes crudas en escalas incompatibles para un eje doble',
        explanation: 'Mezclar dólares (`53979.12`), millones de impresiones (`2767289`) y miles de conversiones (`3905`) tienta a crear un gráfico con doble eje donde la posición relativa de las curvas es arbitraria.',
        code: `SELECT
  CAST(DATE_TRUNC('quarter', spend_date) AS DATE)::VARCHAR AS trimestre,
  ROUND(SUM(spend_usd), 2) AS gasto_marketing_usd,
  SUM(impressions) AS impresiones_totales,
  SUM(attributed_conversions) AS conversiones
FROM marketing_spend
WHERE spend_date BETWEEN DATE '2024-01-01' AND DATE '2024-12-31'
GROUP BY 1
ORDER BY 1 ASC;`,
        expectedOutput: [
          {
            trimestre: '2024-01-01',
            gasto_marketing_usd: 53979.12,
            impresiones_totales: 2767289,
            conversiones: 3905
          },
          {
            trimestre: '2024-04-01',
            gasto_marketing_usd: 53505.08,
            impresiones_totales: 2669976,
            conversiones: 3838
          },
          {
            trimestre: '2024-07-01',
            gasto_marketing_usd: 55118.58,
            impresiones_totales: 2817442,
            conversiones: 4003
          },
          {
            trimestre: '2024-10-01',
            gasto_marketing_usd: 10348.42,
            impresiones_totales: 508261,
            conversiones: 718
          }
        ]
      },
      {
        label: 'Solución verificada: series indexadas a base 100 con FIRST_VALUE',
        explanation: 'Usamos `FIRST_VALUE(...) OVER (ORDER BY trimestre)` para expresar tanto el gasto como las conversiones respecto al primer trimestre (`100.0`), unificando ambas series en una sola escala.',
        code: `WITH q_agg AS (
  SELECT
    CAST(DATE_TRUNC('quarter', spend_date) AS DATE)::VARCHAR AS trimestre,
    SUM(spend_usd) AS gasto_usd,
    SUM(attributed_conversions) AS conversiones
  FROM marketing_spend
  WHERE spend_date BETWEEN DATE '2024-01-01' AND DATE '2024-12-31'
  GROUP BY 1
)
SELECT
  trimestre,
  ROUND(gasto_usd, 2) AS gasto_usd,
  ROUND(100.0 * gasto_usd / FIRST_VALUE(gasto_usd) OVER (ORDER BY trimestre), 1) AS indice_gasto_100,
  ROUND(100.0 * conversiones / FIRST_VALUE(conversiones) OVER (ORDER BY trimestre), 1) AS indice_conv_100
FROM q_agg
ORDER BY trimestre ASC;`,
        expectedOutput: [
          {
            trimestre: '2024-01-01',
            gasto_usd: 53979.12,
            indice_gasto_100: 100,
            indice_conv_100: 100
          },
          {
            trimestre: '2024-04-01',
            gasto_usd: 53505.08,
            indice_gasto_100: 99.1,
            indice_conv_100: 98.3
          },
          {
            trimestre: '2024-07-01',
            gasto_usd: 55118.58,
            indice_gasto_100: 102.1,
            indice_conv_100: 102.5
          },
          {
            trimestre: '2024-10-01',
            gasto_usd: 10348.42,
            indice_gasto_100: 19.2,
            indice_conv_100: 18.4
          }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'chk-c1-viz-02-1',
      type: 'mcq',
      prompt: 'Dos almacenes registran `95000` USD y `98000` USD de meta mensual. Si dibujas un gráfico de barras cuyo eje vertical empieza en `94000` USD, ¿qué distorsión visual produces?',
      options: [
        {
          id: 'a',
          text: 'La segunda barra tiene cuatro veces la longitud de la primera (4000 frente a 1000 píxeles de escala), exagerando una diferencia real del 3.2 %.',
          correct: true,
          feedback: 'Correcto: al restar 94000 de ambos valores, las alturas visibles pasan a ser 1000 y 4000, violando el principio de tinta proporcional.'
        },
        {
          id: 'b',
          text: 'Ninguna distorsión, siempre que las etiquetas de datos estén escritas encima de las barras.',
          correct: false,
          feedback: 'Incorrecto: el sistema visual procesa la proporción geométrica de las barras antes de leer el texto, por lo que las etiquetas no corrigen el sesgo perceptual.'
        },
        {
          id: 'c',
          text: 'Las barras se vuelven equivalentes a una escala logarítmica.',
          correct: false,
          feedback: 'Incorrecto: recortar el origen es un desplazamiento aditivo arbitrario, no una transformación logarítmica.'
        }
      ],
      explanation: 'En los gráficos de barras la magnitud se juzga por la longitud del rectángulo relleno; truncar el eje en 94000 convierte un cambio del 3.2 % en una razón de alturas de 4 a 1.'
    },
    {
      id: 'chk-c1-viz-02-2',
      type: 'mcq',
      prompt: '¿En cuál de los siguientes escenarios es metodológicamente correcto que el eje vertical NO comience en cero?',
      options: [
        {
          id: 'a',
          text: 'En un gráfico de líneas sin área rellena que monitorea el ticket medio diario entre 405 USD y 435 USD, con límites claramente rotulados y una línea de media anual.',
          correct: true,
          feedback: 'Correcto: el gráfico de líneas codifica posición y cambio marginal; sin área sombreada bajo la curva, no viola el principio de tinta proporcional.'
        },
        {
          id: 'b',
          text: 'En un gráfico de barras verticales que compara el ingreso trimestral de cuatro regiones.',
          correct: false,
          feedback: 'Incorrecto: las barras rellenas codifican magnitud mediante longitud y superficie desde la base, por lo que exigen partir de cero.'
        },
        {
          id: 'c',
          text: 'En un gráfico de área sombreada donde se quiere resaltar una subida del 1 % en las ventas del último mes.',
          correct: false,
          feedback: 'Incorrecto: el área coloreada bajo la curva induce al ojo a comparar superficies totales, lo cual exige que la base sea cero.'
        }
      ],
      explanation: 'Cuando se codifica únicamente la posición de los puntos o de una línea sin relleno inferior, el eje puede acotarse al rango observado si se informa con claridad al lector.'
    },
    {
      id: 'chk-c1-viz-02-3',
      type: 'mcq',
      prompt: 'Un colega propone un gráfico con eje izquierdo en dólares (`spend_usd`) y eje derecho en número de pedidos (`orders`) para demostrar que en mayo las líneas "se cruzaron". ¿Por qué ese cruce carece de validez analítica?',
      options: [
        {
          id: 'a',
          text: 'Porque el punto de cruce entre dos ejes con unidades distintas depende por completo de los límites mínimo y máximo elegidos para cada eje.',
          correct: true,
          feedback: 'Correcto: basta con cambiar el máximo del eje derecho de 600 a 1000 pedidos para que el cruce cambie de mes o desaparezca por completo.'
        },
        {
          id: 'b',
          text: 'Porque SQL no permite consultar dólares y conteos de pedidos en la misma sentencia SELECT.',
          correct: false,
          feedback: 'Incorrecto: SQL calcula ambas métricas sin problema; el defecto ocurre al superponer dos escalas arbitrarias en el mismo plano visual.'
        },
        {
          id: 'c',
          text: 'Porque los gráficos de líneas solo admiten datos anuales y nunca mensuales.',
          correct: false,
          feedback: 'Incorrecto: los gráficos de líneas funcionan en cualquier granularidad temporal (diaria, semanal, mensual o anual).'
        }
      ],
      explanation: 'En un gráfico de doble eje no existe una relación geométrica única entre ambas escalas; cualquier intersección visual entre las dos curvas es un artefacto de configuración.'
    },
    {
      id: 'chk-c1-viz-02-4',
      type: 'fill-code',
      prompt: 'Completa la expresión de ventana SQL para convertir el ingreso mensual `ingreso_usd` en un índice base 100 respecto al primer mes de la serie (`ORDER BY mes ASC`):',
      template: 'ROUND(100.0 * ingreso_usd / ___(ingreso_usd) OVER (ORDER BY mes ASC), 1) AS indice_base_100',
      blanks: [
        {
          id: 'b1',
          accepted: ['FIRST_VALUE', 'first_value']
        }
      ],
      explanation: 'La función de ventana FIRST_VALUE(ingreso_usd) OVER (ORDER BY mes ASC) recupera el valor del primer período para dividir cada fila y expresar toda la serie en base 100.'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Serie mensual indexada a base 100 en el primer semestre de 2024',
    language: 'sql',
    prompt: 'Construye una consulta sobre los pedidos completados (`status = \'completed\'`) del primer semestre de 2024 (`order_date BETWEEN DATE \'2024-01-01\' AND DATE \'2024-06-30\'`) en Mercado Brisa que devuelva por cada mes (`CAST(DATE_TRUNC(\'month\', order_date) AS DATE) AS mes`): `pedidos`, `ingreso_mensual_usd` (`ROUND(ingreso_usd, 2)`) y `indice_base_100` (`ROUND(100.0 * ingreso_usd / FIRST_VALUE(ingreso_usd) OVER (ORDER BY mes ASC), 1)`), ordenado cronológicamente (`ORDER BY mes ASC`).',
    starterCode: `WITH ventas_mensuales AS (
  SELECT
    CAST(DATE_TRUNC('month', order_date) AS DATE) AS mes,
    COUNT(order_id) AS pedidos,
    SUM(total_usd) AS ingreso_usd
  FROM orders
  WHERE status = 'completed'
    AND order_date BETWEEN DATE '2024-01-01' AND DATE '2024-06-30'
  GROUP BY 1
)
SELECT
  mes,
  pedidos,
  ROUND(ingreso_usd, 2) AS ingreso_mensual_usd,
  -- Calcula indice_base_100 redondeado a 1 decimal respecto al primer mes con FIRST_VALUE
  100.0 AS indice_base_100
FROM ventas_mensuales
ORDER BY mes ASC;`,
    expected: `WITH ventas_mensuales AS (
  SELECT
    CAST(DATE_TRUNC('month', order_date) AS DATE) AS mes,
    COUNT(order_id) AS pedidos,
    SUM(total_usd) AS ingreso_usd
  FROM orders
  WHERE status = 'completed'
    AND order_date BETWEEN DATE '2024-01-01' AND DATE '2024-06-30'
  GROUP BY 1
)
SELECT
  mes,
  pedidos,
  ROUND(ingreso_usd, 2) AS ingreso_mensual_usd,
  ROUND(
    100.0 * ingreso_usd / FIRST_VALUE(ingreso_usd) OVER (ORDER BY mes ASC),
    1
  ) AS indice_base_100
FROM ventas_mensuales
ORDER BY mes ASC;`,
    orderMatters: true,
    hints: [
      'En la consulta externa, `FIRST_VALUE(ingreso_usd) OVER (ORDER BY mes ASC)` obtiene el ingreso de enero de 2024 (`193381.96`) como denominador común.',
      'Multiplica por `100.0` antes de dividir y redondea a 1 decimal: `ROUND(100.0 * ingreso_usd / FIRST_VALUE(ingreso_usd) OVER (ORDER BY mes ASC), 1) AS indice_base_100`.',
      'Mantén `ORDER BY mes ASC` al final para preservar el orden cronológico del eje horizontal.'
    ],
    solution: `WITH ventas_mensuales AS (
  SELECT
    CAST(DATE_TRUNC('month', order_date) AS DATE) AS mes,
    COUNT(order_id) AS pedidos,
    SUM(total_usd) AS ingreso_usd
  FROM orders
  WHERE status = 'completed'
    AND order_date BETWEEN DATE '2024-01-01' AND DATE '2024-06-30'
  GROUP BY 1
)
SELECT
  mes,
  pedidos,
  ROUND(ingreso_usd, 2) AS ingreso_mensual_usd,
  ROUND(
    100.0 * ingreso_usd / FIRST_VALUE(ingreso_usd) OVER (ORDER BY mes ASC),
    1
  ) AS indice_base_100
FROM ventas_mensuales
ORDER BY mes ASC;`,
    solutionExplanation: 'Agrupa primero los pedidos completados por mes en la CTE `ventas_mensuales` y luego divide cada `ingreso_usd` entre el valor de enero (`FIRST_VALUE(ingreso_usd) OVER (ORDER BY mes ASC)`) multiplicado por 100, mostrando que junio cerró un 24.7 % por encima de enero (`124.7`).',
    blanks: [
      {
        id: 'b1',
        answer: 'FIRST_VALUE(ingreso_usd) OVER (ORDER BY mes ASC)'
      }
    ],
    expectedOutput: [
      {
        mes: '2024-01-01',
        pedidos: 455,
        ingreso_mensual_usd: 193381.96,
        indice_base_100: 100
      },
      {
        mes: '2024-02-01',
        pedidos: 418,
        ingreso_mensual_usd: 179253.26,
        indice_base_100: 92.7
      },
      {
        mes: '2024-03-01',
        pedidos: 527,
        ingreso_mensual_usd: 212934.94,
        indice_base_100: 110.1
      },
      {
        mes: '2024-04-01',
        pedidos: 488,
        ingreso_mensual_usd: 195623.91,
        indice_base_100: 101.2
      },
      {
        mes: '2024-05-01',
        pedidos: 570,
        ingreso_mensual_usd: 239318.64,
        indice_base_100: 123.8
      },
      {
        mes: '2024-06-01',
        pedidos: 555,
        ingreso_mensual_usd: 241217.82,
        indice_base_100: 124.7
      }
    ],
    expectedOutputTable: [
      {
        mes: '2024-01-01',
        pedidos: 455,
        ingreso_mensual_usd: 193381.96,
        indice_base_100: 100
      },
      {
        mes: '2024-02-01',
        pedidos: 418,
        ingreso_mensual_usd: 179253.26,
        indice_base_100: 92.7
      },
      {
        mes: '2024-03-01',
        pedidos: 527,
        ingreso_mensual_usd: 212934.94,
        indice_base_100: 110.1
      },
      {
        mes: '2024-04-01',
        pedidos: 488,
        ingreso_mensual_usd: 195623.91,
        indice_base_100: 101.2
      },
      {
        mes: '2024-05-01',
        pedidos: 570,
        ingreso_mensual_usd: 239318.64,
        indice_base_100: 123.8
      },
      {
        mes: '2024-06-01',
        pedidos: 555,
        ingreso_mensual_usd: 241217.82,
        indice_base_100: 124.7
      }
    ]
  },

  roleNotes: {
    de: 'Al construir vistas de series temporales en el almacén, cruza contra la tabla `calendar` antes de calcular `FIRST_VALUE` o medias móviles. Si el primer período tuviera cero ventas o faltara en la tabla de hechos, `NULLIF` evita errores de división por cero.',
    da: 'Cuando explores dos variables con escalas distantes en el tiempo, grafica primero sus series indexadas a base 100 o calcula su tasa de variación porcentual período a período. Así evalúas co-movimientos reales sin depender del ajuste visual de dos ejes.',
    bi: 'Bloquea en las plantillas de tus tableros el truncamiento del eje vertical en todos los gráficos de barras y columnas. Cuando dirección pida ver ingresos y unidades en el mismo bloque temporal, entrégalo como dos paneles apilados verticalmente que compartan el eje de fechas.'
  },

  summary: [
    'El principio de tinta proporcional exige que todo gráfico de barras o de área rellena comience en cero.',
    'Un gráfico de líneas sin relleno puede acotar su eje vertical si etiqueta el rango y muestra una línea de referencia.',
    'Usa escalas logarítmicas cuando los datos abarquen varios órdenes de magnitud o sigan cambios multiplicativos.',
    'Sustituye los ejes dobles por paneles separados con eje temporal común o por series indexadas a base 100.'
  ],

  flashcards: [
    {
      id: 'fc-c1-viz-02-1',
      front: '¿Qué establece el principio de tinta proporcional de Claus Wilke?',
      back: 'Cuando una zona rellena (como una barra o un área sombreada) representa una magnitud numérica, su superficie visual debe ser proporcional al valor y partir de cero.'
    },
    {
      id: 'fc-c1-viz-02-2',
      front: '¿Por qué un gráfico de líneas puede no incluir el cero en el eje vertical sin distorsionar la lectura?',
      back: 'Porque codifica los datos mediante posición y pendiente entre puntos, sin usar el área rellena bajo la curva como medida de magnitud.'
    },
    {
      id: 'fc-c1-viz-02-3',
      front: '¿Por qué los gráficos con doble eje vertical (dual-scaled axes) inducen conclusiones falsas?',
      back: 'Porque al cambiar de forma independiente el mínimo o el máximo de cualquiera de los dos ejes se fabrican cruces y pendientes aparentes.'
    },
    {
      id: 'fc-c1-viz-02-4',
      front: '¿Cómo se transforma una serie temporal a índice base 100 en SQL?',
      back: 'Dividiendo cada valor entre el valor del primer período con FIRST_VALUE(metrica) OVER (ORDER BY fecha) y multiplicando por 100.0.'
    }
  ],

  glossaryTerms: [
    'tinta-proporcional',
    'indice-base-100',
    'codificacion-visual'
  ],

  sources: [
    {
      title: 'Fundamentals of Data Visualization — Chapter 17: The Principle of Proportional Ink',
      url: 'https://clauswilke.com/dataviz/proportional-ink.html',
      publisher: 'Claus O. Wilke / O\'Reilly Media',
      accessed: '2026-10-29',
      supports: 'Demostración del principio de tinta proporcional y obligatoriedad del origen en cero para gráficos de barras y áreas.'
    },
    {
      title: 'Calling Bullshit: Tools — The Principle of Proportional Ink',
      url: 'https://www.callingbullshit.org/tools/tools_proportional_ink.html',
      publisher: 'Carl T. Bergstrom & Jevin D. West (University of Washington)',
      accessed: '2026-10-29',
      supports: 'Criterio para distinguir entre barras rellenas (que exigen cero) y gráficos de líneas (que pueden acotar el eje según el contexto).'
    },
    {
      title: 'Dual-Scaled Axes in Graphs: Are They Ever the Best Solution?',
      url: 'https://www.perceptualedge.com/articles/visual_business_intelligence/dual-scaled_axes.pdf',
      publisher: 'Stephen Few / Perceptual Edge',
      accessed: '2026-10-29',
      supports: 'Análisis de las distorsiones provocadas por los ejes dobles y su reemplazo por paneles separados o series indexadas.'
    },
    {
      title: 'DuckDB SQL Reference — Window Functions (FIRST_VALUE)',
      url: 'https://duckdb.org/docs/sql/functions/window_functions.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Cálculo de series indexadas a base 100 mediante la función de ventana FIRST_VALUE ordenada por fecha.'
    }
  ],

  aiNotes: 'El estudiante suele memorizar como dogma absoluto que "todo gráfico debe empezar en cero" o, al revés, aceptar ejes truncados en barras. Ayúdale a distinguir la geometría: las barras codifican longitud/área rellena (exigen cero), mientras que las líneas codifican posición. Si pregunta por ejes dobles, guíalo a usar `FIRST_VALUE` para indexar a base 100.'
};

export default lesson;
