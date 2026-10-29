const lesson = {
  id: 'bi2-modelo-semantico-05-medidas-vs-columnas-calculadas',
  moduleId: 'bi2-modelo-semantico',
  tracks: ['bi'],
  level: 2,
  order: 5,
  title: 'Medidas frente a columnas calculadas en memoria y refresco',
  subtitle: 'Medidas frente a columnas calculadas: impacto en memoria RAM y tiempo de refresco',
  minutes: 20,
  prerequisites: ['bi2-modelo-semantico-04-tablas-fechas-userelationship'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), un analista creó en la tabla `orders` una columna calculada `tasa_descuento_fila = discount_usd / subtotal_usd` y la arrastró a una tabla por tienda configurando la agregación en Promedio. El tablero reportó que el Almacén Logístico Coslada tenía una tasa de descuento del 1,23 %, pero cuando Finanzas dividió el descuento total cobrado (6 148,59 USD) entre el subtotal vendido (684 417,83 USD), la tasa real resultó ser del 0,90 %. ¿Cuándo debes escribir una medida dinámica en lugar de una columna calculada?',

  objectives: [
    'Distinguir el momento de evaluación y el costo en memoria RAM de una columna calculada frente a una medida DAX.',
    'Demostrar con SQL por qué promediar o sumar porcentajes precalculados por fila distorsiona las métricas de razón.',
    'Decidir qué atributos discretos de baja cardinalidad justifican una columna física y por qué conviene crearlos en el origen SQL.',
  ],

  sections: [
    {
      id: 'tiempo-de-refresco-frente-a-tiempo-de-consulta',
      heading: 'Qué se evalúa durante el refresco y qué se evalúa en la consulta',
      body: 'Aunque las columnas calculadas y las medidas se escriben con DAX en Power BI, se ejecutan en momentos distintos. También tienen un impacto opuesto sobre los recursos del servidor.\n\nUna **columna calculada** (*Calculated Column*) se evalúa fila por fila durante el refresco de datos. Su resultado se guarda físicamente en memoria RAM como una columna más dentro de VertiPaq. Aumenta la duración del refresco y el tamaño del archivo `.pbix`. Además, nunca recalcula sus valores cuando el usuario cambia los filtros del reporte.\n\nUna **medida** (*Measure*) no guarda valores por fila ni ocupa memoria RAM en reposo. Su fórmula se evalúa en tiempo de consulta, en pocos milisegundos de CPU, sobre las filas que deja pasar el contexto de filtro de cada gráfico.\n\nEn las 42 000 filas de `order_items`, una columna calculada con el margen continuo por línea obliga a VertiPaq a guardar un diccionario con 1 333 valores decimales distintos. En cambio, un atributo discreto de solo 3 tramos (`Sin descuento`, `Descuento moderado`, `Descuento alto`) necesita apenas 3 entradas en el diccionario.',
      interactive: {
        component: 'row-vs-columnar-storage',
        caption: 'Simulador interactivo: observa el impacto de materializar columnas adicionales frente a proyectar y agregar en consulta.',
      },
      example: {
        language: 'sql',
        code: `SELECT
  COUNT(*) AS filas_order_items,
  COUNT(DISTINCT ROUND(line_total_usd - qty * 4.5, 4)) AS cardinalidad_columna_margen_continuo,
  COUNT(DISTINCT CASE
    WHEN discount_usd = 0 THEN 'Sin descuento'
    WHEN discount_usd <= 5 THEN 'Descuento moderado'
    ELSE 'Descuento alto'
  END) AS cardinalidad_tramo_descuento
FROM order_items;`,
        expectedOutput: [
          {
            filas_order_items: '42000',
            cardinalidad_columna_margen_continuo: '1333',
            cardinalidad_tramo_descuento: '3',
          },
        ],
      },
    },
    {
      id: 'error-matematico-de-promediar-porcentajes-por-fila',
      heading: 'Por qué los porcentajes y razones nunca deben ser columnas calculadas',
      body: 'El mayor problema de usar una columna calculada donde corresponde una medida no es solo la memoria RAM. Es el error matemático que introduce en cualquier métrica de razón, como el porcentaje de margen bruto, la tasa de descuento o el ticket medio.\n\nRecuerda que una columna calculada se congela durante el refresco. Si defines en `order_items` la columna `margen_pct_fila = (line_total_usd - qty * unit_cost_usd) / line_total_usd`, cada fila guarda su propio porcentaje aislado. Cuando alguien arrastra esa columna a un visual por categoría ocurren dos fallos:\n\nSi deja la agregación por defecto en `SUM`, el gráfico suma porcentajes y muestra cifras sin sentido como `399 640 %`. Si la cambia a `AVERAGE`, el gráfico calcula el **promedio simple de los porcentajes**. Así da el mismo peso a un accesorio de 8 dólares que a un pedido corporativo de cuatro cafeteras de 1 800 dólares.\n\nLa única forma correcta de calcular una razón es mediante una medida dinámica que sume primero el numerador, sume después el denominador y divida ambos totales en tiempo de consulta: `DIVIDE( SUM(margen_usd), SUM(ingreso_usd) )`.',
    },
    {
      id: 'cuando-crear-una-columna-y-donde-ubicarla',
      heading: 'Cuándo sí necesitas una columna y por qué empujarla hacia SQL',
      body: '¿Cuándo es legítimo crear una columna adicional en lugar de una medida? Solo cuando necesitas usar su valor como filtro, eje o clave en el modelo.\n\n1. En un segmentador (*slicer*), filtro de página o eje de filas de un visual. Por ejemplo, para agrupar pedidos por `Tramo de descuento` o clientes por `Antigüedad en años`. Las medidas no pueden colocarse como categorías de un eje.\n2. Como columna de enlace para una relación `1:N` o como columna entera de ordenamiento (`Sort by column`).\n3. En una regla estática de seguridad a nivel de fila (RLS).\n\nIncluso en esos tres casos, la recomendación de SQLBI y Microsoft Learn (conocida como la **máxima de Roche**) es clara. Transforma los datos tan arriba hacia el origen como sea posible y tan abajo como sea necesario. Una columna creada en una vista SQL del almacén o en Power Query se comprime de forma óptima durante la carga de VertiPaq. En cambio, una columna calculada en DAX se evalúa después de comprimir la tabla y suele comprimir peor.',
    },
  ],

  workedExample: {
    title: 'Porcentaje de margen por categoría: medida dinámica frente a promedio de columna calculada',
    description: 'Compara el porcentaje de margen bruto en las 5 categorías de Mercado Brisa calculado como razón de sumas (medida) frente al promedio de la columna fila a fila.',
    steps: [
      {
        label: 'Paso 1 — Antipatrón: promediar una columna calculada de porcentaje fila a fila',
        explanation: 'Al calcular el porcentaje de margen en cada una de las líneas de `order_items` y aplicar `AVG`, todas las líneas pesan igual sin importar su importe. En `Accesorios` el promedio simple baja a 57,90 % y en `Molinos` sube artificialmente a 42,94 %.',
        code: `SELECT
  p.category,
  COUNT(oi.order_item_id) AS lineas_pedido,
  ROUND(AVG((oi.line_total_usd - oi.qty * p.unit_cost_usd) * 100.0 / oi.line_total_usd), 2) AS promedio_columna_calculada_pct
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
JOIN products p ON oi.product_id = p.product_id
WHERE o.status = 'completed'
GROUP BY p.category
ORDER BY promedio_columna_calculada_pct DESC;`,
        expectedOutput: [
          {
            category: 'Accesorios',
            lineas_pedido: '6902',
            promedio_columna_calculada_pct: 57.9,
          },
          {
            category: 'Café en grano',
            lineas_pedido: '6899',
            promedio_columna_calculada_pct: 55.26,
          },
          {
            category: 'Suscripciones',
            lineas_pedido: '6712',
            promedio_columna_calculada_pct: 51.41,
          },
          {
            category: 'Cafeteras',
            lineas_pedido: '6908',
            promedio_columna_calculada_pct: 47.59,
          },
          {
            category: 'Molinos',
            lineas_pedido: '6899',
            promedio_columna_calculada_pct: 42.94,
          },
        ],
      },
      {
        label: 'Paso 2 — Solución: medida dinámica que divide la suma del margen entre la suma del ingreso',
        explanation: 'Al evaluar `SUM(margen) * 100.0 / SUM(ingreso)` en el contexto de cada categoría, cada dólar vendido pondera correctamente: `Accesorios` tiene un margen real del 57,99 % (`340 331,54 / 586 859,56`) y `Molinos` del 42,90 %.',
        code: `SELECT
  p.category,
  ROUND(SUM(oi.line_total_usd), 2) AS ingreso_total_usd,
  ROUND(SUM(oi.line_total_usd - oi.qty * p.unit_cost_usd), 2) AS margen_bruto_usd,
  ROUND(SUM(oi.line_total_usd - oi.qty * p.unit_cost_usd) * 100.0 / SUM(oi.line_total_usd), 2) AS margen_medida_correcta_pct,
  ROUND(AVG((oi.line_total_usd - oi.qty * p.unit_cost_usd) * 100.0 / oi.line_total_usd), 2) AS promedio_columna_erroneo_pct
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
JOIN products p ON oi.product_id = p.product_id
WHERE o.status = 'completed'
GROUP BY p.category
ORDER BY margen_bruto_usd DESC;`,
        expectedOutput: [
          {
            category: 'Molinos',
            ingreso_total_usd: 2163162.27,
            margen_bruto_usd: 928073.23,
            margen_medida_correcta_pct: 42.9,
            promedio_columna_erroneo_pct: 42.94,
          },
          {
            category: 'Cafeteras',
            ingreso_total_usd: 1643366.45,
            margen_bruto_usd: 781890.35,
            margen_medida_correcta_pct: 47.58,
            promedio_columna_erroneo_pct: 47.59,
          },
          {
            category: 'Accesorios',
            ingreso_total_usd: 586859.56,
            margen_bruto_usd: 340331.54,
            margen_medida_correcta_pct: 57.99,
            promedio_columna_erroneo_pct: 57.9,
          },
          {
            category: 'Suscripciones',
            ingreso_total_usd: 657384.31,
            margen_bruto_usd: 338217.74,
            margen_medida_correcta_pct: 51.45,
            promedio_columna_erroneo_pct: 51.41,
          },
          {
            category: 'Café en grano',
            ingreso_total_usd: 413378.59,
            margen_bruto_usd: 228476.01,
            margen_medida_correcta_pct: 55.27,
            promedio_columna_erroneo_pct: 55.26,
          },
        ],
      },
    ],
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: '¿Qué diferencia existe entre una columna calculada y una medida DAX respecto al uso de memoria RAM y CPU en Power BI?',
      options: [
        {
          id: 'a',
          text: 'La columna calculada se procesa en el refresco y consume memoria RAM de forma permanente; la medida no ocupa RAM en el modelo y usa CPU solo al abrir o filtrar un visual.',
          correct: true,
          feedback: 'Exacto. Las columnas calculadas se materializan en VertiPaq; las medidas son fórmulas dinámicas evaluadas bajo demanda.',
        },
        {
          id: 'b',
          text: 'Las medidas duplican el tamaño del archivo `.pbix` porque guardan una copia del resultado por cada filtro posible.',
          correct: false,
          feedback: 'Incorrecto. Una medida solo almacena unas pocas líneas de código de texto en los metadatos del modelo.',
        },
        {
          id: 'c',
          text: 'Las columnas calculadas se recalculan cada vez que el usuario cambia un segmentador en el informe.',
          correct: false,
          feedback: 'Incorrecto. Las columnas calculadas ignoran los segmentadores del reporte; solo se recalculan al refrescar la tabla.',
        },
      ],
      explanation: 'Las columnas calculadas aumentan el tiempo de refresco y el tamaño en memoria RAM; las medidas se evalúan en tiempo de consulta respetando los filtros del usuario.',
    },
    {
      id: 'c2',
      type: 'mcq',
      prompt: 'Necesitas clasificar los pedidos en tres grupos (`Pedido pequeño`, `Pedido mediano`, `Pedido grande`) según su importe para poner ese grupo en las filas de una matriz y en un segmentador. ¿Qué debes crear?',
      options: [
        {
          id: 'a',
          text: 'Una columna derivada (idealmente en la vista SQL o en Power Query, o como columna calculada de baja cardinalidad), porque las medidas no pueden colocarse como eje ni segmentador directo.',
          correct: true,
          feedback: 'Correcto. Para agrupar o filtrar en un eje necesitas un atributo de columna, y como solo tiene 3 valores distintos, su impacto en VertiPaq es mínimo.',
        },
        {
          id: 'b',
          text: 'Una medida con `SUM(orders[total_usd])` arrastrada directamente dentro del segmentador de categorías.',
          correct: false,
          feedback: 'Incorrecto. Una medida devuelve un valor escalar según el contexto y no genera filas de categorías en un eje por sí sola.',
        },
        {
          id: 'c',
          text: 'Una columna calculada con el porcentaje de participación de cada pedido sobre el total anual con 8 decimales.',
          correct: false,
          feedback: 'Incorrecto. Eso crearía miles de valores únicos innecesarios y no resolvería los tres tramos discretos.',
        },
      ],
      explanation: 'Los atributos discretos de baja cardinalidad que sirven como ejes o filtros de segmentación son el caso de uso válido para crear una columna (preferiblemente en SQL o Power Query).',
    },
    {
      id: 'c3',
      type: 'predict-output',
      prompt: 'En el Almacén Logístico Coslada, los pedidos completados suman `subtotal_total_usd = 684 417,83` y `descuento_total_usd = 6 148,59`. Si una columna calculada promedia las tasas fila por fila da `1,23 %`. ¿Cuál es la tasa de descuento real calculada como medida (`6 148,59 * 100 / 684 417,83`)?',
      options: [
        {
          id: 'a',
          text: '0,90 %, porque los descuentos se concentraron en pedidos de menor importe y la medida pondera por el subtotal total.',
          correct: true,
          feedback: 'Exacto. `6 148,59 / 684 417,83 = 0,00898` (0,90 %), 33 puntos base por debajo del promedio simple de la columna.',
        },
        {
          id: 'b',
          text: '1,23 %, porque el promedio de los cocientes siempre es igual al cociente de las sumas.',
          correct: false,
          feedback: 'Incorrecto. El promedio de razones (`AVG(a/b)`) no coincide con la razón de las sumas (`SUM(a)/SUM(b)`) salvo que todos los denominadores sean idénticos.',
        },
        {
          id: 'c',
          text: '0,00 %, porque las medidas ignoran los pedidos con descuento cero.',
          correct: false,
          feedback: 'Incorrecto. `SUM(subtotal_usd)` incluye todos los pedidos completados en el denominador.',
        },
      ],
      explanation: 'Dividir la suma de los descuentos entre la suma de los subtotales (`0,90 %`) evita el sesgo de dar el mismo peso a pedidos pequeños y grandes.',
    },
  ],

  practice: {
    type: 'sql',
    title: 'Tasa de descuento como medida agregada frente a promedio de columna por tienda',
    language: 'sql',
    prompt: 'Para las 5 tiendas con mayor subtotal en pedidos completados (`o.status = \'completed\'`), une `orders` con `stores` y calcula por `s.store_name` y `s.region`: `subtotal_total_usd` (`ROUND(SUM(o.subtotal_usd), 2)`), `descuento_total_usd` (`ROUND(SUM(o.discount_usd), 2)`), la medida correcta `tasa_descuento_medida_pct` (`ROUND(SUM(o.discount_usd) * 100.0 / SUM(o.subtotal_usd), 2)`) y el promedio de columna fila a fila `promedio_columna_pct` (`ROUND(AVG(o.discount_usd * 100.0 / o.subtotal_usd), 2)`), ordenado por `subtotal_total_usd DESC` con `LIMIT 5`.',
    starterCode: `SELECT
  s.store_name,
  s.region,
  ROUND(SUM(o.subtotal_usd), 2) AS subtotal_total_usd,
  ROUND(SUM(o.discount_usd), 2) AS descuento_total_usd,
  -- TODO: Calcula la medida correcta SUM(discount_usd) * 100.0 / SUM(subtotal_usd) redondeada a 2 decimales AS tasa_descuento_medida_pct
  0.0 AS tasa_descuento_medida_pct,
  -- TODO: Calcula el promedio fila a fila AVG(discount_usd * 100.0 / subtotal_usd) redondeado a 2 decimales AS promedio_columna_pct
  0.0 AS promedio_columna_pct
FROM orders o
JOIN stores s ON o.store_id = s.store_id
WHERE o.status = 'completed'
GROUP BY s.store_name, s.region
ORDER BY subtotal_total_usd DESC
LIMIT 5;`,
    expected: `SELECT
  s.store_name,
  s.region,
  ROUND(SUM(o.subtotal_usd), 2) AS subtotal_total_usd,
  ROUND(SUM(o.discount_usd), 2) AS descuento_total_usd,
  ROUND(SUM(o.discount_usd) * 100.0 / SUM(o.subtotal_usd), 2) AS tasa_descuento_medida_pct,
  ROUND(AVG(o.discount_usd * 100.0 / o.subtotal_usd), 2) AS promedio_columna_pct
FROM orders o
JOIN stores s ON o.store_id = s.store_id
WHERE o.status = 'completed'
GROUP BY s.store_name, s.region
ORDER BY subtotal_total_usd DESC
LIMIT 5;`,
    orderMatters: true,
    hints: [
      'La medida correcta divide las sumas: `ROUND(SUM(o.discount_usd) * 100.0 / SUM(o.subtotal_usd), 2) AS tasa_descuento_medida_pct`.',
      'El antipatrón promedia la división fila por fila: `ROUND(AVG(o.discount_usd * 100.0 / o.subtotal_usd), 2) AS promedio_columna_pct`.',
      'Mantén el filtro `WHERE o.status = \'completed\'`, `ORDER BY subtotal_total_usd DESC` y `LIMIT 5`.',
    ],
    solution: `SELECT
  s.store_name,
  s.region,
  ROUND(SUM(o.subtotal_usd), 2) AS subtotal_total_usd,
  ROUND(SUM(o.discount_usd), 2) AS descuento_total_usd,
  ROUND(SUM(o.discount_usd) * 100.0 / SUM(o.subtotal_usd), 2) AS tasa_descuento_medida_pct,
  ROUND(AVG(o.discount_usd * 100.0 / o.subtotal_usd), 2) AS promedio_columna_pct
FROM orders o
JOIN stores s ON o.store_id = s.store_id
WHERE o.status = 'completed'
GROUP BY s.store_name, s.region
ORDER BY subtotal_total_usd DESC
LIMIT 5;`,
    solutionExplanation: 'La consulta contrasta directamente la medida dinámica (`SUM(discount_usd) / SUM(subtotal_usd)`) frente al promedio de una columna calculada por fila: en Tienda Palermo Soho la medida real es 1,27 % frente a 1,15 %, y en Almacén Logístico Coslada es 0,90 % frente a 1,23 %.',
    expectedOutputTable: [
      {
        store_name: 'Tienda Palermo Soho',
        region: 'Cono Sur',
        subtotal_total_usd: 966754.24,
        descuento_total_usd: 12263.9,
        tasa_descuento_medida_pct: 1.27,
        promedio_columna_pct: 1.15,
      },
      {
        store_name: 'Tienda Miraflores',
        region: 'Andina',
        subtotal_total_usd: 769447.66,
        descuento_total_usd: 8380.23,
        tasa_descuento_medida_pct: 1.09,
        promedio_columna_pct: 1.11,
      },
      {
        store_name: 'Almacén Logístico Coslada',
        region: 'Iberia',
        subtotal_total_usd: 684417.83,
        descuento_total_usd: 6148.59,
        tasa_descuento_medida_pct: 0.9,
        promedio_columna_pct: 1.23,
      },
      {
        store_name: 'Tienda Las Condes',
        region: 'Cono Sur',
        subtotal_total_usd: 452081.54,
        descuento_total_usd: 0,
        tasa_descuento_medida_pct: 0,
        promedio_columna_pct: 0,
      },
      {
        store_name: 'Tienda Chapinero Alto',
        region: 'Andina',
        subtotal_total_usd: 426853.75,
        descuento_total_usd: 2210.41,
        tasa_descuento_medida_pct: 0.52,
        promedio_columna_pct: 0.72,
      },
    ],
  },

  roleNotes: {
    bi: 'Desactiva el resumen implícito (`Summarize by: Don\'t summarize`) en las columnas numéricas de la tabla de hechos y escribe medidas explícitas para todas las sumas y razones del modelo.',
    de: 'Si varias áreas necesitan un atributo derivado de segmentación (como `tramo_descuento`), incorpóralo en la transformación SQL del almacén para que VertiPaq lo reciba ya tipado y ordenado.',
    da: 'Verifica siempre cómo están definidas las métricas porcentuales en los tableros existentes: un `AVERAGE` sobre una columna de porcentaje oculta sesgos de tamaño entre pedidos.',
  },

  summary: [
    'Las columnas calculadas se evalúan en el refresco y ocupan RAM; las medidas se evalúan en consulta sin ocupar RAM.',
    'Nunca almacenes porcentajes ni razones como columnas calculadas: promediarlas o sumarlas produce resultados erróneos.',
    'Las razones deben escribirse siempre como medidas que dividen sumas: `DIVIDE(SUM(numerador), SUM(denominador))`.',
    'Crea columnas solo para ejes, segmentadores o claves de baja cardinalidad, preferiblemente en SQL o Power Query.',
  ],

  flashcards: [
    {
      id: 'fc-bi2-ms-05-a',
      front: '¿Cuándo se calcula una columna calculada frente a una medida en Power BI?',
      back: 'La columna calculada se evalúa durante el refresco de datos y se guarda en RAM; la medida se evalúa en tiempo de consulta según los filtros activos.',
    },
    {
      id: 'fc-bi2-ms-05-b',
      front: '¿Por qué es un error crear una columna calculada `margen / ingreso` y promediarla en un visual?',
      back: 'Porque el promedio de los porcentajes por fila otorga el mismo peso a ventas minúsculas y grandes; debe usarse una medida `DIVIDE(SUM(margen), SUM(ingreso))`.',
    },
    {
      id: 'fc-bi2-ms-05-c',
      front: '¿Qué dice la máxima de Roche sobre dónde crear una columna necesaria para un segmentador?',
      back: 'Transformar los datos tan arriba hacia el origen (SQL / almacén) como sea posible, porque las columnas de origen comprimen mejor en VertiPaq que las columnas DAX.',
    },
  ],

  glossaryTerms: [
    'medida-vs-columna-calculada',
    'motor-vertipaq',
  ],

  sources: [
    {
      title: 'Microsoft Learn — Tutorial: Create your own measures in Power BI Desktop',
      url: 'https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-measures',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Evaluación en tiempo de consulta de las medidas DAX según el contexto de filtro.',
    },
    {
      title: 'Microsoft Learn — Tutorial: Create calculated columns in Power BI Desktop',
      url: 'https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-calculated-columns',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Evaluación fila por fila en tiempo de refresco y almacenamiento en memoria de las columnas calculadas.',
    },
    {
      title: 'SQLBI — Calculated Columns and Measures in DAX',
      url: 'https://www.sqlbi.com/articles/calculated-columns-and-measures-in-dax/',
      publisher: 'SQLBI',
      accessed: '2026-10-29',
      supports: 'Criterios técnicos para elegir medidas frente a columnas calculadas y error de agregar porcentajes precalculados.',
    },
  ],

  aiNotes: 'Si el alumno pregunta por qué Power BI permite arrastrar una columna numérica sin escribir una medida (medidas implícitas), explícale que las medidas implícitas solo aplican agregaciones simples (`SUM`, `AVERAGE`) sobre una columna física y fallan en cuanto necesitas una razón ponderada como `SUM(discount_usd) / SUM(subtotal_usd)`.',
};

export default lesson;
