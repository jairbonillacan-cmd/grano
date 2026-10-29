const lesson = {
  id: 'da2-eda-03-outliers-errores-extremos',
  moduleId: 'da2-eda',
  tracks: ['da'],
  level: 2,
  order: 3,
  title: 'Valores atípicos: error de captura frente a cliente extremo',
  subtitle: 'Valores atípicos (outliers): cómo distinguir un error de captura de un cliente real extremo',
  minutes: 25,
  prerequisites: ['da2-eda-02-perfilado-tablas'],
  contentVersion: 1,

  hook: 'En Mercado Brisa conviven dos observaciones extremas muy distintas: en `products`, el artículo `SKU-TEST-NEG` aparece con un precio de lista de `-9.99 USD`; en `orders`, existen 213 pedidos completados que superan la cerca superior de Tukey (`1 300.08 USD`). Si aplicas un filtro automático para eliminar todo valor atípico de tus consultas, limpiarás el catálogo pero mutilarás `306 122.18 USD` de compras reales. ¿Cómo distingues un error de captura imposible de un cliente corporativo legítimo sin destruir los ingresos del negocio?',

  objectives: [
    'Detectar valores atípicos combinando reglas de dominio físico, cercas de Tukey y puntaje Z modificado con MAD.',
    'Distinguir un error de captura o registro de prueba frente a una transacción real de cola larga.',
    'Aplicar winsorización por percentiles y medianas resistentes en DuckDB sin eliminar clientes reales.',
  ],

  sections: [
    {
      id: 'sec-deteccion-resistente',
      heading: 'Por qué falla la desviación estándar y cómo medir con MAD y Tukey',
      body: 'Muchos tutoriales buscan valores atípicos (*outliers*) filtrando todo dato que se aleje más de tres desviaciones estándar de la media ($|x_i - \\bar{x}| / s > 3$). Ese criterio fracasa en colas asimétricas. Como la media $\\bar{x}$ y la desviación estándar $s$ elevan distancias al cuadrado, un solo valor extremo hincha el denominador $s$ y se oculta a sí mismo.\n\nLa estadística exploratoria reemplaza la desviación estándar por dos detectores resistentes:\n\n1. **Cercas de Tukey:** marcan un intervalo entre la cerca inferior $Q_1 - 1.5 \\times \\text{IQR}$ y la cerca superior $Q_3 + 1.5 \\times \\text{IQR}$, donde $\\text{IQR} = Q_3 - Q_1$.\n\n2. **Puntaje Z modificado de Iglewicz y Hoaglin ($M_i$):** sustituye la media por la mediana $\\tilde{x}$ y la desviación estándar por la **desviación absoluta mediana** ($\\text{MAD} = \\text{mediana}(|x_i - \\tilde{x}|)$, disponible en DuckDB como `MAD(columna)`):\n\n$$M_i = \\frac{0.6745 \\cdot |x_i - \\tilde{x}|}{\\text{MAD}}$$\n\nEl factor constante `0.6745` ajusta la escala de la MAD para igualar a $\\sigma$ bajo normalidad. Según la guía de NIST, toda fila con $|M_i| > 3.5$ merece inspección.',
    },
    {
      id: 'sec-regla-dominio-vs-estadistica',
      heading: 'Reglas de dominio físico frente a umbrales estadísticos',
      body: 'Ningún umbral estadístico sustituye al conocimiento del dominio físico. Observa qué ocurre al auditar la tabla `products` (`180` artículos) buscando precios anómalos.\n\nEn la categoría `Accesorios`, el primer cuartil (`Q1`) es `16.10 USD`, el tercer cuartil (`Q3`) es `34.00 USD` y el rango intercuartílico (`IQR`) mide `17.90 USD`. Si calculas la cerca inferior de Tukey para `Accesorios` ($16.0975 - 1.5 \\times 17.90$), obtienes `-10.76 USD`. Por eso, el artículo `product_id = 180` (`SKU-TEST-NEG`, con `list_price_usd = -9.99 USD`) queda `77` centavos por encima de la cerca de Tukey. Su puntaje Z modificado dentro de la categoría apenas llega a `2.38`.\n\nUn filtro ciego basado solo en Tukey o en $|M_i| > 3.5$ dejaría pasar un precio negativo en producción. En cambio, una **regla de dominio físico** (`list_price_usd <= 0`) lo atrapa con certeza absoluta. Ningún producto del catálogo comercial puede tener precio cero o negativo.',
      example: {
        language: 'sql',
        code: `WITH metricas_catalogo AS (
  SELECT
    product_id,
    sku,
    category,
    list_price_usd,
    is_active,
    QUANTILE_CONT(list_price_usd, 0.25) OVER (PARTITION BY category) AS q1_cat,
    QUANTILE_CONT(list_price_usd, 0.75) OVER (PARTITION BY category) AS q3_cat,
    MEDIAN(list_price_usd) OVER (PARTITION BY category) AS mediana_cat,
    MAD(list_price_usd) OVER (PARTITION BY category) AS mad_cat
  FROM products
)
SELECT
  product_id,
  sku,
  category,
  list_price_usd,
  is_active,
  ROUND(q1_cat - 1.5 * (q3_cat - q1_cat), 2) AS cerca_inf_tukey_usd,
  ROUND(0.6745 * ABS(list_price_usd - mediana_cat) / mad_cat, 2) AS z_modificado_mad,
  CASE
    WHEN list_price_usd <= 0 THEN 'ERROR_CAPTURA_DOMINIO'
    ELSE 'RANGO_VALIDO'
  END AS diagnostico
FROM metricas_catalogo
WHERE list_price_usd <= 0
   OR list_price_usd < q1_cat - 1.5 * (q3_cat - q1_cat);`,
        expectedOutput: [
          {
            product_id: 180,
            sku: 'SKU-TEST-NEG',
            category: 'Accesorios',
            list_price_usd: -9.99,
            is_active: false,
            cerca_inf_tukey_usd: -10.76,
            z_modificado_mad: 2.38,
            diagnostico: 'ERROR_CAPTURA_DOMINIO',
          },
        ],
      },
    },
    {
      id: 'sec-error-vs-cliente-extremo',
      heading: 'Árbol de decisión: error de captura frente a cliente extremo',
      body: 'Cuando una observación supera una cerca estadística —como los `213` pedidos completados de `orders` cuyo `total_usd` rebasa la cerca superior de Tukey (`1 300.08 USD`, llegando a `1 925.73 USD`)—, borrar la fila sin investigar es un error grave. Antes de tocar el registro, aplica tres preguntas en orden:\n\n1. **¿Viola una ley física o es un registro de prueba?** Si el valor es imposible (`list_price_usd <= 0` o `sku LIKE \'SKU-TEST%\'`), se excluye del análisis y se reporta en la tabla de descartes.\n\n2. **¿Está respaldado por entidades y cobros reales?** Al cruzar esos `213` pedidos altos con `customers` y `payments`, comprobamos que tienen cobros `captured` válidos. Son **clientes reales extremos** de la cola derecha que sostienen el margen de Mercado Brisa.\n\n3. **¿Qué métrica responde con honestidad a la pregunta?** Si reportas facturación contable, debes sumar el `100 %` de los pedidos reales. Si resumes el pedido típico por tienda o segmento, usa la mediana o acota la cola con winsorización.',
    },
    {
      id: 'sec-winsorizacion-vs-recorte',
      heading: 'Winsorización (p99) frente a recorte: acotar sin borrar filas',
      body: 'Cuando necesitas calcular un promedio operativo pero quieres evitar que el `1 %` de pedidos más altos desplace la media, existen dos técnicas opuestas:\n\n- **Recorte (*trimming*):** elimina con un `WHERE` las filas que superan el umbral. Esto encoge la muestra y borra del mapa a los mejores clientes corporativos (`306 122.18 USD` perdidos en `orders`).\n\n- **Winsorización (*Winsorization*):** conserva las `14 760` filas de pedidos completados. En lugar de borrar, sustituye todo valor que supere un percentil alto (`p99 = 1 343.24 USD`) por el valor exacto de ese percentil mediante `LEAST(total_usd, p99)`.\n\nAsí, un pedido real de `1 925.73 USD` sigue contando como un pedido completado de su tienda y segmento, pero aporta `1 343.24 USD` al promedio winsorizado. Nunca apliques winsorización en cierres contables de facturación total (`SUM(total_usd)`). Úsala solo como estimador de centro junto a la media original y la mediana.',
    },
  ],

  workedExample: {
    title: 'Impacto de borrar valores extremos frente a winsorizar al p99 por segmento',
    description:
      'Cuantifica cuántos dólares reales pierde cada segmento de clientes si se borran los 213 pedidos sobre la cerca de Tukey (1 300.08 USD), y compáralo con conservar toda la muestra usando media winsorizada al p99 (1 343.24 USD) y mediana.',
    steps: [
      {
        label: 'Paso 1: Medir el ingreso real destruido al borrar pedidos sobre la cerca de Tukey',
        explanation:
          'Eliminar las 213 filas que superan `1 300.08 USD` borra `306 122.18 USD` de ventas reales y amputa el `8.03 %` de toda la facturación del segmento corporativo `cafeteria_b2b`.',
        code: `WITH cerca_global AS (
  SELECT
    QUANTILE_CONT(total_usd, 0.75)
      + 1.5 * (QUANTILE_CONT(total_usd, 0.75) - QUANTILE_CONT(total_usd, 0.25)) AS limite_tukey
  FROM orders
  WHERE status = 'completed'
)
SELECT
  c.segment,
  COUNT(*) FILTER (WHERE o.total_usd > g.limite_tukey) AS pedidos_borrados,
  ROUND(SUM(o.total_usd) FILTER (WHERE o.total_usd > g.limite_tukey), 2) AS ingreso_mutilado_usd,
  ROUND(
    SUM(o.total_usd) FILTER (WHERE o.total_usd > g.limite_tukey) * 100.0 / SUM(o.total_usd),
    2
  ) AS pct_ingreso_perdido
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
CROSS JOIN cerca_global g
WHERE o.status = 'completed'
GROUP BY c.segment
ORDER BY pct_ingreso_perdido DESC;`,
        expectedOutput: [
          {
            segment: 'cafeteria_b2b',
            pedidos_borrados: 73,
            ingreso_mutilado_usd: 105901.3,
            pct_ingreso_perdido: 8.03,
          },
          {
            segment: 'retail',
            pedidos_borrados: 73,
            ingreso_mutilado_usd: 103943.94,
            pct_ingreso_perdido: 4.27,
          },
          {
            segment: 'pro_barista',
            pedidos_borrados: 67,
            ingreso_mutilado_usd: 96276.94,
            pct_ingreso_perdido: 3.83,
          },
        ],
      },
      {
        label: 'Paso 2: Conservar las 14 760 filas y reportar media original, winsorizada al p99 y mediana',
        explanation:
          'Sin borrar un solo pedido, el reporte muestra la distribución real: en `cafeteria_b2b`, la mediana es `444.51 USD`, la media winsorizada al `p99` es `506.14 USD` y la media contable es `509.30 USD`.',
        code: `WITH percentil_99 AS (
  SELECT QUANTILE_CONT(total_usd, 0.99) AS p99_usd
  FROM orders
  WHERE status = 'completed'
)
SELECT
  c.segment,
  COUNT(*) AS pedidos_completados,
  ROUND(AVG(o.total_usd), 2) AS media_original_usd,
  ROUND(AVG(LEAST(o.total_usd, p.p99_usd)), 2) AS media_winsorizada_p99_usd,
  ROUND(MEDIAN(o.total_usd), 2) AS mediana_usd
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
CROSS JOIN percentil_99 p
WHERE o.status = 'completed'
GROUP BY c.segment
ORDER BY media_original_usd DESC;`,
        expectedOutput: [
          {
            segment: 'cafeteria_b2b',
            pedidos_completados: 2591,
            media_original_usd: 509.3,
            media_winsorizada_p99_usd: 506.14,
            mediana_usd: 444.51,
          },
          {
            segment: 'retail',
            pedidos_completados: 5940,
            media_original_usd: 410.26,
            media_winsorizada_p99_usd: 409.18,
            mediana_usd: 332.62,
          },
          {
            segment: 'pro_barista',
            pedidos_completados: 6229,
            media_original_usd: 403.42,
            media_winsorizada_p99_usd: 402.36,
            mediana_usd: 327.26,
          },
        ],
      },
    ],
  },

  checks: [
    {
      id: 'chk-da2-eda-03-mad',
      type: 'mcq',
      prompt:
        '¿Por qué el puntaje Z modificado de Iglewicz y Hoaglin ($0.6745 \\cdot |x_i - \\tilde{x}| / \\text{MAD}$) supera al puntaje Z clásico al buscar valores atípicos en colas asimétricas?',
      options: [
        {
          id: 'a',
          text: 'Porque elimina automáticamente las filas con valores nulos antes de calcular el promedio.',
          correct: false,
          feedback:
            'Incorrecto. Tanto AVG/STDDEV como MEDIAN/MAD ignoran nulos por defecto en SQL; la diferencia radica en su resistencia a colas largas.',
        },
        {
          id: 'b',
          text: 'Porque tanto la mediana como la MAD son estadísticos resistentes que no se hinchan por la presencia del propio valor extremo.',
          correct: true,
          feedback:
            'Exacto. Mientras la desviación estándar se dispara ante un valor extremo y lo enmascara, la mediana y la MAD permanecen estables.',
        },
        {
          id: 'c',
          text: 'Porque multiplica todos los importes negativos por cero para evitar errores.',
          correct: false,
          feedback:
            'Incorrecto. La fórmula toma el valor absoluto de la distancia respecto a la mediana, sin anular importes negativos.',
        },
      ],
      explanation:
        'En el puntaje Z clásico, un valor extremo eleva drásticamente la desviación estándar s y reduce su propio puntaje Z; la mediana y la MAD resisten hasta un 50 % de datos extremos sin deformarse.',
    },
    {
      id: 'chk-da2-eda-03-sku-neg',
      type: 'predict-output',
      prompt:
        'En `products`, `SKU-TEST-NEG` tiene `list_price_usd = -9.99 USD`, pero la cerca inferior de Tukey de su categoría (`Accesorios`) es `-10.76 USD`. ¿Qué demuestra este hecho?',
      options: [
        {
          id: 'a',
          text: 'Que -9.99 USD es un precio comercial válido y debe mantenerse en el catálogo activo.',
          correct: false,
          feedback:
            'Incorrecto. Es un SKU de prueba de calibración POS con precio negativo imposible en ventas reales.',
        },
        {
          id: 'b',
          text: 'Que las reglas de dominio físico (list_price_usd <= 0) son indispensables porque una dispersión amplia puede dejar un valor imposible dentro de las cercas de Tukey.',
          correct: true,
          feedback:
            'Correcto. Con Q1 = 16.10 USD e IQR = 17.90 USD, Q1 - 1.5 * IQR baja hasta -10.76 USD; solo la regla de dominio atrapa el -9.99 USD.',
        },
        {
          id: 'c',
          text: 'Que la función QUANTILE_CONT de DuckDB calcula mal los cuartiles cuando hay menos de mil filas.',
          correct: false,
          feedback:
            'Incorrecto. El cálculo aritmético de los cuartiles es exacto; es una propiedad matemática de la cerca de Tukey.',
        },
      ],
      explanation:
        'Cuando una categoría tiene un IQR amplio respecto a su primer cuartil, Q1 - 1.5 * IQR puede resultar menor que un valor negativo pequeño. La regla de negocio list_price_usd <= 0 detecta el error sin ambigüedad.',
    },
    {
      id: 'chk-da2-eda-03-fill-winsor',
      type: 'fill-code',
      prompt:
        'Completa la expresión para calcular la media winsorizada al percentil 99 (`p.p99_usd`) sin filtrar filas de `orders`:',
      template: `SELECT
  ROUND({{b1}}({{b2}}(o.total_usd, p.p99_usd)), 2) AS media_winsorizada_p99_usd
FROM orders o
CROSS JOIN percentil_99 p
WHERE o.status = 'completed';`,
      blanks: [
        { id: 'b1', accepted: ['AVG', 'avg'] },
        { id: 'b2', accepted: ['LEAST', 'least'] },
      ],
      explanation:
        'La combinación `AVG(LEAST(o.total_usd, p.p99_usd))` conserva todas las filas de pedidos completados pero acota cualquier monto mayor al percentil 99 exactamente al valor de `p.p99_usd`.',
    },
    {
      id: 'chk-da2-eda-03-b2b-loss',
      type: 'mcq',
      prompt:
        'Según la auditoría sobre `orders` (`status = \'completed\'`), ¿qué ocurre en el segmento `cafeteria_b2b` si se eliminan los pedidos que superan la cerca global de Tukey (`1 300.08 USD`)?',
      options: [
        {
          id: 'a',
          text: 'No se pierde ningún pedido porque las cafeterías solo realizan compras pequeñas.',
          correct: false,
          feedback:
            'Incorrecto. Las cafeterías B2B realizan pedidos mayoristas que frecuentemente superan los 1 300.08 USD.',
        },
        {
          id: 'b',
          text: 'Se eliminan 73 pedidos legítimos que representan 105 901.30 USD, es decir, el 8.03 % del ingreso total del segmento.',
          correct: true,
          feedback:
            'Exacto. Esos 73 pedidos corporativos equivalen a más del 8 % de toda la facturación B2B.',
        },
        {
          id: 'c',
          text: 'Solo se eliminan pedidos cancelados y reembolsados.',
          correct: false,
          feedback:
            'Incorrecto. La consulta ya filtraba `status = \'completed\'`, por lo que todos los pedidos borrados eran ventas reales cobradas.',
        },
      ],
      explanation:
        'El segmento corporativo cafeteria_b2b concentra pedidos mayoristas de alto valor; borrar los 73 pedidos por encima de 1 300.08 USD amputa 105 901.30 USD (8.03 % de su facturación real).',
    },
  ],

  practice: {
    type: 'sql',
    title: 'Comparación de media original, media winsorizada al p99 y mediana por formato de tienda',
    language: 'sql',
    prompt:
      'El director de operaciones quiere comparar el ticket de los pedidos completados (`status = \'completed\'`) según el formato de tienda (`stores.store_type`: `warehouse`, `retail`, `flagship`) sin borrar los pedidos corporativos altos. En una CTE `umbrales`, calcula sobre los pedidos completados la cerca superior de Tukey (`cerca_sup = Q3 + 1.5 * IQR`) y el percentil 99 (`p99 = QUANTILE_CONT(total_usd, 0.99)`). Luego cruza `orders` con `stores` y `umbrales` para devolver por `store_type`: `store_type`, `pedidos_completados`, `extremos_tukey` (conteo de pedidos con `total_usd > cerca_sup`), `media_original_usd`, `media_winsorizada_p99_usd` (usando `LEAST(o.total_usd, u.p99)`) y `mediana_usd` (todas las métricas monetarias a 2 decimales). Ordena por `media_original_usd DESC`.',
    starterCode: `WITH umbrales AS (
  SELECT
    QUANTILE_CONT(total_usd, 0.75)
      + 1.5 * (QUANTILE_CONT(total_usd, 0.75) - QUANTILE_CONT(total_usd, 0.25)) AS cerca_sup,
    QUANTILE_CONT(total_usd, 0.99) AS p99
  FROM orders
  WHERE status = 'completed'
)
SELECT
  s.store_type,
  COUNT(*) AS pedidos_completados,
  -- Calcula extremos_tukey, media_original_usd, media_winsorizada_p99_usd y mediana_usd
  0 AS extremos_tukey,
  0.0 AS media_original_usd,
  0.0 AS media_winsorizada_p99_usd,
  0.0 AS mediana_usd
FROM orders o
JOIN stores s ON o.store_id = s.store_id
CROSS JOIN umbrales u
WHERE o.status = 'completed'
GROUP BY s.store_type
ORDER BY media_original_usd DESC;`,
    expected: `WITH umbrales AS (
  SELECT
    QUANTILE_CONT(total_usd, 0.75)
      + 1.5 * (QUANTILE_CONT(total_usd, 0.75) - QUANTILE_CONT(total_usd, 0.25)) AS cerca_sup,
    QUANTILE_CONT(total_usd, 0.99) AS p99
  FROM orders
  WHERE status = 'completed'
)
SELECT
  s.store_type,
  COUNT(*) AS pedidos_completados,
  COUNT(*) FILTER (WHERE o.total_usd > u.cerca_sup) AS extremos_tukey,
  ROUND(AVG(o.total_usd), 2) AS media_original_usd,
  ROUND(AVG(LEAST(o.total_usd, u.p99)), 2) AS media_winsorizada_p99_usd,
  ROUND(MEDIAN(o.total_usd), 2) AS mediana_usd
FROM orders o
JOIN stores s ON o.store_id = s.store_id
CROSS JOIN umbrales u
WHERE o.status = 'completed'
GROUP BY s.store_type
ORDER BY media_original_usd DESC;`,
    orderMatters: true,
    hints: [
      'Para extremos_tukey, utiliza COUNT(*) FILTER (WHERE o.total_usd > u.cerca_sup).',
      'Calcula media_original_usd con ROUND(AVG(o.total_usd), 2) y media_winsorizada_p99_usd con ROUND(AVG(LEAST(o.total_usd, u.p99)), 2).',
      'Obtén mediana_usd con ROUND(MEDIAN(o.total_usd), 2) y mantén ORDER BY media_original_usd DESC.',
    ],
    solution: `WITH umbrales AS (
  SELECT
    QUANTILE_CONT(total_usd, 0.75)
      + 1.5 * (QUANTILE_CONT(total_usd, 0.75) - QUANTILE_CONT(total_usd, 0.25)) AS cerca_sup,
    QUANTILE_CONT(total_usd, 0.99) AS p99
  FROM orders
  WHERE status = 'completed'
)
SELECT
  s.store_type,
  COUNT(*) AS pedidos_completados,
  COUNT(*) FILTER (WHERE o.total_usd > u.cerca_sup) AS extremos_tukey,
  ROUND(AVG(o.total_usd), 2) AS media_original_usd,
  ROUND(AVG(LEAST(o.total_usd, u.p99)), 2) AS media_winsorizada_p99_usd,
  ROUND(MEDIAN(o.total_usd), 2) AS mediana_usd
FROM orders o
JOIN stores s ON o.store_id = s.store_id
CROSS JOIN umbrales u
WHERE o.status = 'completed'
GROUP BY s.store_type
ORDER BY media_original_usd DESC;`,
    solutionExplanation:
      'El formato `warehouse` concentra proporcionalmente más pedidos por encima de la cerca de Tukey (`65` de `2 626`) y lidera tanto en mediana (`480.75 USD`) como en media winsorizada (`529.81 USD`) y media contable (`532.53 USD`), seguido por `retail` (`339.43 USD` de mediana) y `flagship` (`294.75 USD` de mediana).',
    expectedOutputTable: [
      {
        store_type: 'warehouse',
        pedidos_completados: 2626,
        extremos_tukey: 65,
        media_original_usd: 532.53,
        media_winsorizada_p99_usd: 529.81,
        mediana_usd: 480.75,
      },
      {
        store_type: 'retail',
        pedidos_completados: 8404,
        extremos_tukey: 106,
        media_original_usd: 414.31,
        media_winsorizada_p99_usd: 413.11,
        mediana_usd: 339.43,
      },
      {
        store_type: 'flagship',
        pedidos_completados: 3730,
        extremos_tukey: 42,
        media_original_usd: 372.43,
        media_winsorizada_p99_usd: 371.36,
        mediana_usd: 294.75,
      },
    ],
  },

  roleNotes: {
    da: 'Como analista de datos, nunca elimines filas con un `WHERE` solo porque superan `Q3 + 1.5 * IQR`. Separa primero los errores imposibles de dominio (`SKU-TEST-NEG`) y conserva los clientes extremos presentando en paralelo la media original, la media winsorizada y la mediana.',
    de: 'Para ingeniería de datos, los errores de dominio físico (`list_price_usd <= 0`) deben rechazarse en la validación bloqueante de ingesta, mientras que los pedidos reales de alto valor jamás deben truncarse ni filtrarse en las tablas de hechos.',
    bi: 'En inteligencia de negocios, cuando muestres el ticket por formato de tienda (`warehouse` con mediana de `480.75 USD` frente a `flagship` con `294.75 USD`), incluye un indicador del conteo de pedidos sobre la cerca de Tukey para visibilizar dónde se concentran las compras mayoristas.',
  },

  summary: [
    'La desviación estándar se hincha con los propios extremos; la detección exploratoria usa cercas de Tukey y puntaje Z modificado con MAD.',
    'Las reglas deterministas de dominio físico (`list_price_usd <= 0`) van antes que cualquier umbral estadístico y atrapan errores negativos.',
    'Borrar los 213 pedidos completados sobre la cerca de Tukey en `orders` destruye 306 122.18 USD de ingresos reales.',
    'La winsorización (`AVG(LEAST(col, p99))`) acota el peso del 1 % superior sin borrar filas y complementa a la mediana.',
  ],

  flashcards: [
    {
      id: 'fc-da2-eda-03-01',
      front: '¿Cómo se calcula el puntaje Z modificado de Iglewicz y Hoaglin y qué umbral sugiere inspección?',
      back: 'Se calcula como M_i = 0.6745 * |x_i - mediana| / MAD, donde MAD es la desviación absoluta mediana. Un valor |M_i| > 3.5 señala una observación candidata a revisión.',
    },
    {
      id: 'fc-da2-eda-03-02',
      front: '¿Por qué la cerca inferior de Tukey no detecta el precio -9.99 USD de SKU-TEST-NEG en la categoría Accesorios?',
      back: 'Porque el rango intercuartílico de Accesorios (17.90 USD) ubica la cerca inferior en -10.76 USD; solo la regla de dominio físico list_price_usd <= 0 identifica que -9.99 USD es imposible.',
    },
    {
      id: 'fc-da2-eda-03-03',
      front: '¿Qué diferencia existe entre recortar (trimming) y winsorizar al percentil 99?',
      back: 'El recorte elimina las filas mayores al p99 reduciendo la muestra; la winsorización conserva todas las filas pero reemplaza los valores superiores al p99 por el valor exacto del p99 (LEAST(x, p99)).',
    },
    {
      id: 'fc-da2-eda-03-04',
      front: 'En Mercado Brisa, ¿qué formato de tienda presenta la mayor mediana y mayor proporción de pedidos sobre la cerca de Tukey?',
      back: 'El formato warehouse, con una mediana de 480.75 USD, media original de 532.53 USD y 65 pedidos de 2 626 por encima de la cerca superior de Tukey.',
    },
  ],

  glossaryTerms: [
    'puntaje-z-modificado-mad',
    'winsorizacion',
    'perfilado-datos',
  ],

  sources: [
    {
      title: 'NIST/SEMATECH e-Handbook of Statistical Methods — Section 1.3.5.17: Detection of Outliers',
      url: 'https://www.itl.nist.gov/div898/handbook/eda/section3/eda35h.htm',
      publisher: 'National Institute of Standards and Technology (NIST)',
      accessed: '2026-10-29',
      supports:
        'Definición del puntaje Z modificado de Iglewicz y Hoaglin basado en la mediana y la MAD.',
    },
    {
      title: 'NIST/SEMATECH e-Handbook of Statistical Methods — Section 1.3.3.7: Box Plot and Tukey Fences',
      url: 'https://www.itl.nist.gov/div898/handbook/eda/section3/eda337.htm',
      publisher: 'National Institute of Standards and Technology (NIST)',
      accessed: '2026-10-29',
      supports:
        'Cercas internas (1.5 * IQR) y externas (3.0 * IQR) de John W. Tukey para identificar candidatos a inspección.',
    },
    {
      title: 'NIST/SEMATECH e-Handbook of Statistical Methods — Section 1.3.5.6: Measures of Scale (MAD)',
      url: 'https://www.itl.nist.gov/div898/handbook/eda/section3/eda356.htm',
      publisher: 'National Institute of Standards and Technology (NIST)',
      accessed: '2026-10-29',
      supports:
        'Resistencia de la desviación absoluta mediana frente a valores extremos en colas pesadas.',
    },
    {
      title: 'DuckDB Documentation — Statistical Aggregate Functions (MAD, MEDIAN, QUANTILE_CONT)',
      url: 'https://duckdb.org/docs/sql/functions/aggregates.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports:
        'Implementación nativa de MAD, MEDIAN y QUANTILE_CONT para detección y winsorización en SQL.',
    },
  ],

  aiNotes:
    'Insiste en la diferencia entre un error de dominio (`SKU-TEST-NEG` con `-9.99 USD`, que viola una restricción física y sí se descarta) y un cliente real extremo (los `213` pedidos `> 1 300.08 USD` en `orders`, que nunca deben borrarse). En la práctica sobre `orders` y `stores`, verifica que el estudiante use `LEAST(o.total_usd, u.p99)` dentro de `AVG(...)` sin filtrar filas en el `WHERE`.',
};

export default lesson;
