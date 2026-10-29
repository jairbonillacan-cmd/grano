const lesson = {
  id: 'c1-viz-01-geometria-grafico',
  moduleId: 'c1-viz',
  tracks: ['core'],
  level: 1,
  order: 1,
  title: 'Elegir la geometría según la pregunta y la variable',
  minutes: 20,
  prerequisites: ['c0-numeros-05'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), la gerencia comercial presenta un gráfico circular en tres dimensiones para comparar el ingreso de las cinco categorías de productos y decidir cuál recibirá más inventario el próximo trimestre. Tres de las rebanadas representan entre el 10 % y el 39 % de las ventas, pero la inclinación del círculo hace que una categoría menor parezca mayor que las demás. ¿Qué geometría permite comparar esas magnitudes sin obligar al ojo a adivinar ángulos?',

  objectives: [
    'Relacionar la pregunta analítica y el tipo de variable con la geometría gráfica que minimiza el error de lectura.',
    'Aplicar la jerarquía de precisión perceptual de Cleveland y McGill para preferir posición alineada sobre ángulos o áreas.',
    'Preparar en SQL tablas agregadas con orden jerárquico y participación porcentual listas para alimentar un gráfico de barras.'
  ],

  sections: [
    {
      id: 'pregunta-y-tipo-de-variable',
      heading: 'La pregunta y el tipo de variable dictan la forma del gráfico',
      body: 'Un gráfico no se elige por variedad visual. Se elige por la pregunta que responde y por la naturaleza de sus columnas. Antes de graficar, identifica qué tipos de datos tienes en la consulta. Pueden ser categorías sin orden (`region`, `category`), categorías ordenadas (`tier`), fechas (`order_date`) o cantidades (`total_usd`, `qty`). Esa combinación define la **codificación visual**, que asigna cada columna a una marca geométrica y a un canal perceptual.\n\nSi quieres comparar magnitudes entre categorías, usa barras horizontales ordenadas de mayor a menor. Así lees etiquetas largas sin girar el cuello. Si buscas seguir la evolución en el tiempo, traza líneas continuas con la fecha en el eje horizontal. Para examinar la distribución de una variable numérica, emplea un histograma o un diagrama de caja. Finalmente, para evaluar la relación entre dos variables numéricas, dibuja un diagrama de dispersión con un punto por entidad.',
      interactive: {
        component: 'tufte-data-ink',
        caption: 'Compara cómo un gráfico circular sin referencia dificulta ordenar regiones frente a una vista alineada de alta señal.'
      }
    },
    {
      id: 'jerarquia-perceptual-cleveland-mcgill',
      heading: 'Por qué el ojo mide mejor longitudes alineadas que ángulos',
      body: 'En 1984, William Cleveland y Robert McGill midieron cuánto se equivocan las personas al estimar valores en distintos gráficos. Sus experimentos establecieron la **jerarquía de precisión perceptual**, que ordena los canales visuales desde el más exacto hasta el más impreciso.\n\n1. Posición sobre una escala común alineada. Incluye las barras simples y los gráficos de puntos sobre el mismo eje. Es el juicio más exacto del ojo humano.\n2. Longitud no alineada y pendiente. Ocurre en los segmentos interiores de barras apiladas o al comparar la inclinación de dos líneas.\n3. Área y volumen. Aparece en gráficos de burbujas, mapas de árbol o cubos tridimensionales. El ojo subestima las diferencias grandes de superficie.\n4. Ángulo, curvatura y saturación de color. Es el caso de los gráficos circulares, donas y velocímetros. Estos formatos duplican el error de estimación frente a las barras alineadas.',
      example: {
        language: 'sql',
        code: `SELECT
  s.region,
  COUNT(o.order_id) AS pedidos_completados,
  ROUND(SUM(o.total_usd), 2) AS ingreso_usd,
  ROUND(
    100.0 * SUM(o.total_usd) / SUM(SUM(o.total_usd)) OVER (),
    1
  ) AS pct_total
FROM orders o
JOIN stores s ON o.store_id = s.store_id
WHERE o.status = 'completed'
  AND o.order_date BETWEEN DATE '2024-01-01' AND DATE '2024-12-31'
GROUP BY s.region
ORDER BY ingreso_usd DESC;`,
        expectedOutput: [
          {
            region: 'Cono Sur',
            pedidos_completados: 2199,
            ingreso_usd: 919026.32,
            pct_total: 33.6
          },
          {
            region: 'Andina',
            pedidos_completados: 2154,
            ingreso_usd: 858331.08,
            pct_total: 31.4
          },
          {
            region: 'Iberia',
            pedidos_completados: 1232,
            ingreso_usd: 590458.99,
            pct_total: 21.6
          },
          {
            region: 'Norteamérica',
            pedidos_completados: 912,
            ingreso_usd: 363700.11,
            pct_total: 13.3
          }
        ]
      }
    },
    {
      id: 'cuando-falla-el-grafico-circular',
      heading: 'Cuándo falla un gráfico circular y cómo sustituirlo',
      body: 'En Mercado Brisa (empresa ficticia), las regiones `Cono Sur` (`33.6 %`) y `Andina` (`31.4 %`) difieren en solo `2.2` puntos porcentuales durante 2024. En un gráfico circular o de dona, esa diferencia equivale a menos de 8 grados de arco. Además, cada tajada está rotada en una orientación distinta. Sin números escritos encima, nadie distingue qué región vendió más.\n\nEl problema se repite en las barras apiladas cuando comparas segmentos intermedios. Solo la primera serie descansa sobre el eje cero. Todas las demás flotan a distintas alturas y carecen de base común. Cuando necesites mostrar tanto el importe como la cuota del total para más de dos categorías, usa un **gráfico de barras horizontales**. Ordénalo por la métrica principal y añade el porcentaje como etiqueta directa al final de cada barra.'
    },
    {
      id: 'preparar-el-orden-desde-sql',
      heading: 'Ordenar por magnitud o por secuencia natural desde la consulta',
      body: 'Muchas herramientas visuales ordenan las categorías alfabéticamente por defecto (`Accesorios`, `Cafeteras`, `Café en grano`, `Molinos`, `Suscripciones`). El orden alfabético obliga al lector a saltar con la vista para encontrar el primer y el segundo lugar. La regla para ordenar el eje depende del tipo de variable.\n\nSi la categoría es nominal y no tiene orden propio (regiones, tiendas, categorías, canales), ordénala de mayor a menor valor (`ORDER BY ingreso_usd DESC`). En cambio, si la variable es ordinal o temporal (meses del año, tramos de edad, niveles de membresía), conserva su secuencia lógica (`ORDER BY mes ASC`). Nunca desordenes una línea temporal por altura de barra. Al incluir `ORDER BY` y el porcentaje con ventana (`SUM(SUM(x)) OVER ()`) desde SQL, entregas una tabla lista para graficar sin pasos manuales.'
    }
  ],

  workedExample: {
    title: 'De categorías desordenadas para un pastel al ranking listo para barras horizontales',
    description: 'Compara una consulta que entrega las categorías de Mercado Brisa en orden alfabético sin peso relativo frente a una consulta que ordena por magnitud y calcula el porcentaje exacto del total en 2024.',
    audit: 'En 2024, Molinos (39.1 %) y Cafeteras (30.3 %) concentran el 69.4 % del ingreso de líneas completadas; el orden descendente expone esta jerarquía desde la primera fila.',
    steps: [
      {
        label: 'Antipatrón: orden alfabético sin denominador porcentual',
        explanation: 'Agrupar por categoría y ordenar alfabéticamente mezcla categorías grandes y pequeñas (`259781.78`, `720880.21`, `179481.70`) y omite qué fracción del negocio representa cada una.',
        code: `SELECT
  p.category,
  ROUND(SUM(oi.line_total_usd), 2) AS ingreso_bruto_usd
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
JOIN products p ON oi.product_id = p.product_id
WHERE o.status = 'completed'
  AND o.order_date BETWEEN DATE '2024-01-01' AND DATE '2024-12-31'
GROUP BY p.category
ORDER BY p.category ASC;`,
        expectedOutput: [
          {
            category: 'Accesorios',
            ingreso_bruto_usd: 259781.78
          },
          {
            category: 'Cafeteras',
            ingreso_bruto_usd: 720880.21
          },
          {
            category: 'Café en grano',
            ingreso_bruto_usd: 179481.7
          },
          {
            category: 'Molinos',
            ingreso_bruto_usd: 930695.19
          },
          {
            category: 'Suscripciones',
            ingreso_bruto_usd: 290644.76
          }
        ]
      },
      {
        label: 'Solución verificada: ranking descendente con cuota porcentual',
        explanation: 'Ordenamos por `ingreso_categoria_usd DESC` y calculamos `pct_ingreso` con una ventana `SUM(SUM(oi.line_total_usd)) OVER ()` para alimentar directamente un gráfico de barras horizontales.',
        code: `SELECT
  p.category,
  SUM(oi.qty) AS unidades_vendidas,
  ROUND(SUM(oi.line_total_usd), 2) AS ingreso_categoria_usd,
  ROUND(
    100.0 * SUM(oi.line_total_usd) / SUM(SUM(oi.line_total_usd)) OVER (),
    1
  ) AS pct_ingreso
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
JOIN products p ON oi.product_id = p.product_id
WHERE o.status = 'completed'
  AND o.order_date BETWEEN DATE '2024-01-01' AND DATE '2024-12-31'
GROUP BY p.category
ORDER BY ingreso_categoria_usd DESC;`,
        expectedOutput: [
          {
            category: 'Molinos',
            unidades_vendidas: 6201,
            ingreso_categoria_usd: 930695.19,
            pct_ingreso: 39.1
          },
          {
            category: 'Cafeteras',
            unidades_vendidas: 6240,
            ingreso_categoria_usd: 720880.21,
            pct_ingreso: 30.3
          },
          {
            category: 'Suscripciones',
            unidades_vendidas: 6125,
            ingreso_categoria_usd: 290644.76,
            pct_ingreso: 12.2
          },
          {
            category: 'Accesorios',
            unidades_vendidas: 6342,
            ingreso_categoria_usd: 259781.78,
            pct_ingreso: 10.9
          },
          {
            category: 'Café en grano',
            unidades_vendidas: 6179,
            ingreso_categoria_usd: 179481.7,
            pct_ingreso: 7.5
          }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'chk-c1-viz-01-1',
      type: 'mcq',
      prompt: 'Necesitas comparar el ingreso anual de las 14 tiendas de Mercado Brisa, cuyos nombres completos tienen entre 18 y 28 caracteres. Según la jerarquía de Cleveland y McGill, ¿qué geometría debes elegir?',
      options: [
        {
          id: 'a',
          text: 'Un gráfico de barras horizontales ordenado de mayor a menor ingreso, con todas las barras alineadas en el eje cero.',
          correct: true,
          feedback: 'Correcto: codifica el ingreso mediante posición en una escala común alineada y permite leer los 14 nombres horizontales sin inclinar el texto.'
        },
        {
          id: 'b',
          text: 'Un gráfico circular con 14 sectores de colores distintos y una leyenda lateral.',
          correct: false,
          feedback: 'Incorrecto: comparar 14 ángulos en distintas orientaciones supera la capacidad perceptual humana y obliga a saltar entre el círculo y la leyenda.'
        },
        {
          id: 'c',
          text: 'Un gráfico de burbujas donde el área de cada círculo represente el ingreso de la tienda.',
          correct: false,
          feedback: 'Incorrecto: el ojo humano subestima las diferencias de área circular y no puede ordenar con exactitud valores cercanos sin etiquetas.'
        }
      ],
      explanation: 'Las barras horizontales aprovechan el canal perceptual de mayor exactitud (posición sobre una base común) y acomodan etiquetas de texto largas en orientación natural de lectura.'
    },
    {
      id: 'chk-c1-viz-01-2',
      type: 'order',
      prompt: 'Ordena los siguientes canales visuales desde el MÁS preciso (1) hasta el MENOS preciso (4) para comparar magnitudes cuantitativas según los experimentos de Cleveland y McGill (1984):',
      items: [
        'Posición a lo largo de una escala común alineada (barras simples)',
        'Longitud no alineada (segmentos interiores de barras apiladas)',
        'Área bidimensional (gráficos de burbujas o mapas de árbol)',
        'Ángulo y saturación de color (gráficos circulares y mapas de calor)'
      ],
      correctOrder: [
        'Posición a lo largo de una escala común alineada (barras simples)',
        'Longitud no alineada (segmentos interiores de barras apiladas)',
        'Área bidimensional (gráficos de burbujas o mapas de árbol)',
        'Ángulo y saturación de color (gráficos circulares y mapas de calor)'
      ],
      explanation: 'La precisión disminuye cuando pasamos de comparar posiciones sobre un mismo eje a comparar segmentos sin base común, áreas bidimensionales y, finalmente, ángulos o intensidades de color.'
    },
    {
      id: 'chk-c1-viz-01-3',
      type: 'mcq',
      prompt: 'Quieres analizar si las tiendas con mayor superficie en metros cuadrados (`area_sqm`) también generan un mayor ingreso por pedido (`ticket_medio_usd`). ¿Qué geometría responde directamente a esta pregunta bivariada?',
      options: [
        {
          id: 'a',
          text: 'Un diagrama de dispersión con `area_sqm` en el eje horizontal, `ticket_medio_usd` en el eje vertical y un punto por tienda.',
          correct: true,
          feedback: 'Correcto: al cruzar dos variables numéricas continuas sobre ejes ortogonales, cada tienda conserva su posición conjunta y revela si existe asociación o valores atípicos.'
        },
        {
          id: 'b',
          text: 'Un histograma que sume los metros cuadrados y los dólares en las mismas barras.',
          correct: false,
          feedback: 'Incorrecto: un histograma agrupa la distribución de una sola variable numérica en intervalos y no permite sumar metros cuadrados con dólares.'
        },
        {
          id: 'c',
          text: 'Un gráfico de dona con dos anillos concéntricos para las 14 tiendas.',
          correct: false,
          feedback: 'Incorrecto: dos anillos circulares de 14 sectores impiden evaluar la relación par a par entre superficie y ticket medio.'
        }
      ],
      explanation: 'El diagrama de dispersión asigna cada variable cuantitativa a un eje de posición ortogonal, permitiendo inspeccionar la forma, dirección y dispersión de la relación entre ambas.'
    },
    {
      id: 'chk-c1-viz-01-4',
      type: 'predict-output',
      prompt: 'En los pedidos completados de 2024 en Mercado Brisa, `Molinos` suma `930695.19` USD y `Cafeteras` suma `720880.21` USD sobre un total de líneas de `2381483.64` USD. ¿Qué porcentaje aproximado del ingreso conjunto representan estas dos categorías líderes?',
      options: [
        {
          id: 'a',
          text: '69.4 % (39.1 % de Molinos más 30.3 % de Cafeteras).',
          correct: true,
          feedback: 'Correcto: al ordenar de mayor a menor y calcular el peso sobre el total con ventana SQL, se observa de inmediato que dos de las cinco categorías aportan casi siete de cada diez dólares.'
        },
        {
          id: 'b',
          text: '40.0 % exacto porque son 2 categorías de un total de 5.',
          correct: false,
          feedback: 'Incorrecto: 2 de 5 es el 40 % del número de categorías, pero sus importes en dólares concentran el 69.4 % de la facturación.'
        },
        {
          id: 'c',
          text: '18.4 % porque Accesorios y Café en grano van primero en orden alfabético.',
          correct: false,
          feedback: 'Incorrecto: 18.4 % es la suma de las dos categorías de menor facturación (Accesorios 10.9 % + Café en grano 7.5 %).'
        }
      ],
      explanation: 'Ordenar las categorías por ingreso descendente y adjuntar su cuota porcentual permite identificar al instante que Molinos (39.1 %) y Cafeteras (30.3 %) suman el 69.4 % del total.'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Preparar ranking y participación porcentual por categoría para barras horizontales',
    language: 'sql',
    prompt: 'Construye la consulta sobre el histórico completo de pedidos completados (`o.status = \'completed\'`) en Mercado Brisa que devuelva por cada categoría de producto (`p.category`): `unidades_vendidas` (`SUM(oi.qty)`), `ingreso_categoria_usd` (`ROUND(SUM(oi.line_total_usd), 2)`) y `pct_ingreso` (`ROUND(100.0 * SUM(oi.line_total_usd) / SUM(SUM(oi.line_total_usd)) OVER (), 1)`), ordenado de mayor a menor ingreso (`ORDER BY ingreso_categoria_usd DESC`).',
    starterCode: `SELECT
  p.category,
  SUM(oi.qty) AS unidades_vendidas,
  ROUND(SUM(oi.line_total_usd), 2) AS ingreso_categoria_usd,
  -- Calcula pct_ingreso redondeado a 1 decimal usando SUM(SUM(oi.line_total_usd)) OVER ()
  0.0 AS pct_ingreso
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
JOIN products p ON oi.product_id = p.product_id
WHERE o.status = 'completed'
GROUP BY p.category
-- Ordena de mayor a menor por ingreso_categoria_usd
ORDER BY p.category ASC;`,
    expected: `SELECT
  p.category,
  SUM(oi.qty) AS unidades_vendidas,
  ROUND(SUM(oi.line_total_usd), 2) AS ingreso_categoria_usd,
  ROUND(
    100.0 * SUM(oi.line_total_usd) / SUM(SUM(oi.line_total_usd)) OVER (),
    1
  ) AS pct_ingreso
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
JOIN products p ON oi.product_id = p.product_id
WHERE o.status = 'completed'
GROUP BY p.category
ORDER BY ingreso_categoria_usd DESC;`,
    orderMatters: true,
    hints: [
      'Para obtener el porcentaje sobre el total en una sola pasada tras el GROUP BY, divide `SUM(oi.line_total_usd)` entre la ventana total `SUM(SUM(oi.line_total_usd)) OVER ()` y multiplica por `100.0`.',
      'Envuelve el cálculo porcentual en `ROUND(100.0 * SUM(oi.line_total_usd) / SUM(SUM(oi.line_total_usd)) OVER (), 1) AS pct_ingreso`.',
      'Cambia la cláusula final a `ORDER BY ingreso_categoria_usd DESC` para que la categoría líder encabece el gráfico de barras.'
    ],
    solution: `SELECT
  p.category,
  SUM(oi.qty) AS unidades_vendidas,
  ROUND(SUM(oi.line_total_usd), 2) AS ingreso_categoria_usd,
  ROUND(
    100.0 * SUM(oi.line_total_usd) / SUM(SUM(oi.line_total_usd)) OVER (),
    1
  ) AS pct_ingreso
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
JOIN products p ON oi.product_id = p.product_id
WHERE o.status = 'completed'
GROUP BY p.category
ORDER BY ingreso_categoria_usd DESC;`,
    solutionExplanation: 'Agrupa las líneas de pedidos completados por `p.category`, calcula el peso relativo sobre el total general mediante la función de ventana `SUM(SUM(oi.line_total_usd)) OVER ()` y ordena de mayor a menor por `ingreso_categoria_usd`.',
    blanks: [
      {
        id: 'b1',
        answer: 'ORDER BY ingreso_categoria_usd DESC'
      }
    ],
    expectedOutput: [
      {
        category: 'Molinos',
        unidades_vendidas: 14314,
        ingreso_categoria_usd: 2163162.27,
        pct_ingreso: 39.6
      },
      {
        category: 'Cafeteras',
        unidades_vendidas: 14270,
        ingreso_categoria_usd: 1643366.45,
        pct_ingreso: 30.1
      },
      {
        category: 'Suscripciones',
        unidades_vendidas: 13857,
        ingreso_categoria_usd: 657384.31,
        pct_ingreso: 12.0
      },
      {
        category: 'Accesorios',
        unidades_vendidas: 14366,
        ingreso_categoria_usd: 586859.56,
        pct_ingreso: 10.7
      },
      {
        category: 'Café en grano',
        unidades_vendidas: 14243,
        ingreso_categoria_usd: 413378.59,
        pct_ingreso: 7.6
      }
    ],
    expectedOutputTable: [
      {
        category: 'Molinos',
        unidades_vendidas: 14314,
        ingreso_categoria_usd: 2163162.27,
        pct_ingreso: 39.6
      },
      {
        category: 'Cafeteras',
        unidades_vendidas: 14270,
        ingreso_categoria_usd: 1643366.45,
        pct_ingreso: 30.1
      },
      {
        category: 'Suscripciones',
        unidades_vendidas: 13857,
        ingreso_categoria_usd: 657384.31,
        pct_ingreso: 12.0
      },
      {
        category: 'Accesorios',
        unidades_vendidas: 14366,
        ingreso_categoria_usd: 586859.56,
        pct_ingreso: 10.7
      },
      {
        category: 'Café en grano',
        unidades_vendidas: 14243,
        ingreso_categoria_usd: 413378.59,
        pct_ingreso: 7.6
      }
    ]
  },

  roleNotes: {
    de: 'Cuando materialices vistas agregadas en la capa Gold para consumo visual, incluye claves de ordenamiento explícitas (`sort_order`) para categorías ordinales como tramos de antigüedad o escalas de servicio. Así evitas que las herramientas de consulta las reordenen alfabéticamente al graficar.',
    da: 'En la exploración inicial, nunca resumas una variable numérica solo con una barra de promedio si desconoces su forma. Inspecciona primero su distribución con un histograma o un diagrama de caja por categoría antes de presentar comparaciones agregadas.',
    bi: 'Sustituye los gráficos circulares y de dona con más de tres categorías por barras horizontales ordenadas que incluyan tanto el valor absoluto como el porcentaje sobre el total. Etiqueta los valores directamente junto a cada barra para eliminar leyendas separadas.'
  },

  summary: [
    'La geometría del gráfico depende de la pregunta analítica y del tipo de variable involucrada.',
    'El ojo humano compara posiciones en una escala común con mayor exactitud que ángulos o áreas.',
    'Evita gráficos circulares cuando compares más de tres categorías o valores con porcentajes cercanos.',
    'Ordena las categorías nominales por magnitud descendente y conserva el orden natural en variables ordinales o fechas.'
  ],

  flashcards: [
    {
      id: 'fc-c1-viz-01-1',
      front: 'Según Cleveland y McGill (1984), ¿cuál es el canal visual más preciso para comparar cantidades numéricas?',
      back: 'La posición a lo largo de una escala común alineada, como en un gráfico de barras simples o de puntos sobre el mismo eje.'
    },
    {
      id: 'fc-c1-viz-01-2',
      front: '¿Por qué un gráfico de barras apiladas dificulta comparar las series intermedias a lo largo del tiempo?',
      back: 'Porque solo la serie inferior descansa sobre la línea base común; las series superiores cambian de punto de partida en cada columna.'
    },
    {
      id: 'fc-c1-viz-01-3',
      front: '¿Qué criterio de ordenamiento debe aplicarse en el eje de un gráfico de barras según el tipo de categoría?',
      back: 'Ordenar de mayor a menor magnitud si la categoría es nominal (tiendas, productos) y mantener la secuencia natural si es ordinal o temporal.'
    },
    {
      id: 'fc-c1-viz-01-4',
      front: '¿Qué expresión SQL permite calcular en la misma consulta agregada el porcentaje de cada categoría sobre el total general?',
      back: '100.0 * SUM(metrica) / SUM(SUM(metrica)) OVER (), combinando la agregación de grupo con una función de ventana sobre el conjunto completo.'
    }
  ],

  glossaryTerms: [
    'codificacion-visual',
    'jerarquia-perceptual',
    'c25-tufte-visual-perception'
  ],

  sources: [
    {
      title: 'Cleveland & McGill (1984) — Graphical Perception: Theory, Experimentation, and Application to the Development of Graphical Methods',
      url: 'https://www.jstor.org/stable/2288400',
      publisher: 'Journal of the American Statistical Association (JASA)',
      accessed: '2026-10-29',
      supports: 'Jerarquía experimental de exactitud perceptual entre posición en escala común, longitud, área y ángulo.'
    },
    {
      title: 'Fundamentals of Data Visualization — Chapter 5: Directory of Visualizations & Chapter 6: Visualizing Amounts',
      url: 'https://clauswilke.com/dataviz/directory-of-visualizations.html',
      publisher: 'Claus O. Wilke / O\'Reilly Media',
      accessed: '2026-10-29',
      supports: 'Selección de geometrías según el tipo de variable y ventajas de las barras horizontales ordenadas frente a gráficos circulares.'
    },
    {
      title: 'Visualization Analysis and Design — Chapter 5: Marks and Channels',
      url: 'https://www.cs.ubc.ca/~tmm/vadbook/',
      publisher: 'Tamara Munzner / A K Peters (CRC Press)',
      accessed: '2026-10-29',
      supports: 'Clasificación de canales visuales de magnitud para datos ordenados y canales de identidad para datos categóricos.'
    },
    {
      title: 'DuckDB SQL Reference — GROUP BY and Aggregate Expressions',
      url: 'https://duckdb.org/docs/sql/query_syntax/groupby.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Sintaxis de agrupación por categoría y cálculo de proporciones con funciones de ventana en SQL.'
    }
  ],

  aiNotes: 'Las confusiones más comunes son creer que un gráfico de pastel siempre es incorrecto sólo por estética (explica que falla por la imprecisión humana al comparar ángulos cercanos) o intentar reordenar por altura variables que tienen orden cronológico. En la práctica SQL, verifica que el estudiante divida entre `SUM(SUM(oi.line_total_usd)) OVER ()` y ordene en forma descendente.'
};

export default lesson;
