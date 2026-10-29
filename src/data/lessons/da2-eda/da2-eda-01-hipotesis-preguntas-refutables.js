const lesson = {
  id: 'da2-eda-01-hipotesis-preguntas-refutables',
  moduleId: 'da2-eda',
  tracks: ['da'],
  level: 2,
  order: 1,
  title: 'Formular hipótesis y preguntas refutables antes de graficar',
  subtitle: 'Formular hipótesis y preguntas refutables antes de abrir un gráfico',
  minutes: 20,
  prerequisites: ['c1-viz-04', 'c1-modelo-05'],
  contentVersion: 1,

  hook: 'En Mercado Brisa, el equipo comercial sostiene que ofrecer cupones de descuento motiva a los compradores a armar cestas de mayor valor bruto antes de aplicar la rebaja. Si abres una herramienta visual y pruebas veinte gráficos hasta hallar un segmento donde los cupones parezcan ganar, habrás fabricado una ilusión estadística. En los 14 760 pedidos completados de `orders`, el subtotal mediano con descuento es 294.72 USD frente a 308.43 USD sin descuento. ¿Cómo redactas una afirmación cuantitativa que los datos puedan desmentir antes de trazar la primera barra?',

  objectives: [
    'Transformar preguntas abiertas de negocio en hipótesis cuantitativas refutables con población, métrica y umbral explícitos.',
    'Distinguir la generación exploratoria de conjeturas de la pesca de correlaciones por comparaciones múltiples.',
    'Contrastar hipótesis en DuckDB estratificando por variables de confusión antes de agregar métricas resistentes.',
  ],

  sections: [
    {
      id: 'sec-anatomia-hipotesis',
      heading: 'De la pregunta abierta a la hipótesis analítica refutable',
      body: 'Iniciar un análisis diciendo «vamos a ver cómo funcionan los descuentos» produce informes ambiguos. Una pregunta abierta carece de criterio de parada. Cualquier tabla parecerá interesante y terminarás acomodando la historia al primer número llamativo.\n\nEn el método de **Análisis Exploratorio de Datos** sistematizado por John Tukey y el manual de NIST, explorar exige formular antes una **hipótesis analítica refutable**. Una afirmación solo es refutable si defines de antemano qué resultado numérico demostraría que tu idea es falsa.\n\nToda hipótesis operativa requiere cuatro componentes explícitos antes de escribir SQL:\n\n1. **Población válida:** qué filas entran en el cálculo, como `orders` con `status = \'completed\'`.\n\n2. **Variable comparada:** qué grupos se contrastan, como `discount_usd > 0` frente a `discount_usd = 0`.\n\n3. **Métrica resistente:** qué estadístico resume el centro y la dispersión, como `MEDIAN(subtotal_usd)` y el rango intercuartílico.\n\n4. **Condición de refutación:** la dirección y magnitud mínima esperada. Si no puedes nombrar qué cifra descartaría tu idea inicial, todavía no tienes una hipótesis.',
    },
    {
      id: 'sec-contraste-sql',
      heading: 'Contraste directo en SQL: el mito del cupón en Mercado Brisa',
      body: 'Apliquemos los cuatro componentes a la creencia comercial de Mercado Brisa. La hipótesis $H_1$ plantea que, entre los pedidos completados, quienes usan cupón (`discount_usd > 0`) arman cestas con un subtotal bruto (`subtotal_usd`) cuya mediana supera al grupo sin cupón.\n\nLa condición de refutación es clara. Si `MEDIAN(subtotal_usd)` con descuento es igual o menor que sin descuento, la hipótesis queda refutada en el agregado. También medimos la mediana del cobro final (`total_usd`) y su rango intercuartílico.\n\nAl ejecutar la consulta en DuckDB sobre los `14 760` pedidos completados, los datos refutan $H_1$. Los `3 264` pedidos con descuento tienen una mediana de subtotal bruto de `294.72 USD` (media de `366.18 USD`). En cambio, los `11 496` pedidos sin descuento alcanzan una mediana de `308.43 USD` (media de `371.34 USD`). Tras restar el cupón y sumar envío e impuestos, la mediana de `total_usd` baja a `324.78 USD` con descuento frente a `357.78 USD` sin él.',
      example: {
        language: 'sql',
        code: `SELECT
  CASE
    WHEN discount_usd > 0 THEN 'con_descuento'
    ELSE 'sin_descuento'
  END AS grupo_descuento,
  COUNT(*) AS pedidos_completados,
  ROUND(MEDIAN(subtotal_usd), 2) AS mediana_subtotal_usd,
  ROUND(AVG(subtotal_usd), 2) AS media_subtotal_usd,
  ROUND(MEDIAN(total_usd), 2) AS mediana_total_usd,
  ROUND(
    QUANTILE_CONT(total_usd, 0.75) - QUANTILE_CONT(total_usd, 0.25),
    2
  ) AS iqr_total_usd
FROM orders
WHERE status = 'completed'
GROUP BY grupo_descuento
ORDER BY grupo_descuento;`,
        expectedOutput: [
          {
            grupo_descuento: 'con_descuento',
            pedidos_completados: 3264,
            mediana_subtotal_usd: 294.72,
            media_subtotal_usd: 366.18,
            mediana_total_usd: 324.78,
            iqr_total_usd: 360.75,
          },
          {
            grupo_descuento: 'sin_descuento',
            pedidos_completados: 11496,
            mediana_subtotal_usd: 308.43,
            media_subtotal_usd: 371.34,
            mediana_total_usd: 357.78,
            iqr_total_usd: 489.43,
          },
        ],
      },
    },
    {
      id: 'sec-pesca-correlaciones',
      heading: 'Pesca de correlaciones y falacia del francotirador de Texas',
      body: 'Cuando una hipótesis inicial cae, surge una tentación peligrosa. El analista cruza la tabla por país, método de pago, día y categoría hasta hallar un rincón donde los cupones parezcan ganar. Esta práctica se llama **pesca de correlaciones** (*data dredging* o *p-hacking*). Equivale a la falacia del francotirador de Texas: disparar primero contra un granero y pintar la diana alrededor del agujero más conveniente.\n\nEl motivo es probabilístico. Si evalúas $k = 20$ cortes independientes buscando diferencias con un nivel de falsos positivos del $5\\%$ ($\\alpha = 0.05$), la probabilidad de hallar al menos un salto aparente por puro azar es:\n\n$$P(\\text{al menos 1 falso positivo}) = 1 - (1 - 0.05)^{20} \\approx 64.15\\%$$\n\nComo explican Hadley Wickham en *R for Data Science* y la guía de NIST, explorar permite detectar patrones imprevistos. Sin embargo, una anomalía hallada mientras inspeccionas una tabla no es una hipótesis confirmada. Es una **conjetura generada** que debes contrastar en un periodo posterior o en datos nuevos.',
    },
    {
      id: 'sec-variables-confusion',
      heading: 'Variables de confusión: por qué estratificar antes de concluir',
      body: 'Que una hipótesis se cumpla o se refute en el total de una tabla tampoco basta si interviene una **variable de confusión** (*confounder*). En comercio electrónico y mayorista, el segmento del cliente (`customers.segment`: `cafeteria_b2b`, `pro_barista` o `retail`) altera al mismo tiempo qué canal elige el comprador y cuánto gasta por pedido.\n\nPor eso, toda hipótesis bien diseñada exige un segundo paso. Debes verificar si la dirección observada en el agregado se mantiene dentro de cada estrato relevante. En lugar de ejecutar tres consultas sueltas, DuckDB permite contrastar subgrupos en una sola lectura usando la cláusula `FILTER (WHERE ...)` dentro de `MEDIAN` o `COUNT`.\n\nDe esta forma colocas en cada fila el estrato de control (el segmento del cliente) y en columnas paralelas las medianas de cada canal (`desktop` frente a `pos_tienda`). Así calculas en una misma tabla la brecha exacta en dólares sin sesgo de composición.',
    },
  ],

  workedExample: {
    title: 'Contraste estratificado de canales (desktop frente a pos_tienda) por segmento',
    description:
      'Evalúa la hipótesis del equipo digital: «En pedidos completados, el canal desktop obtiene una mediana de total_usd superior a pos_tienda en todos los segmentos de clientes».',
    steps: [
      {
        label: 'Paso 1: Evaluar la mediana de total_usd por dispositivo sin estratificar',
        explanation:
          'En el agregado global de 14 760 pedidos completados, `desktop` supera a `pos_tienda` por `25.19 USD` en la mediana (`382.56 USD` frente a `357.37 USD`). Sin embargo, este corte mezcla cafeterías B2B con compradores individuales.',
        code: `SELECT
  device_type,
  COUNT(*) AS pedidos,
  ROUND(AVG(total_usd), 2) AS media_usd,
  ROUND(MEDIAN(total_usd), 2) AS mediana_usd
FROM orders
WHERE status = 'completed'
GROUP BY device_type
ORDER BY mediana_usd DESC;`,
        expectedOutput: [
          { device_type: 'desktop', pedidos: 6327, media_usd: 453.26, mediana_usd: 382.56 },
          { device_type: 'pos_tienda', pedidos: 2809, media_usd: 428.01, mediana_usd: 357.37 },
          { device_type: 'mobile', pedidos: 5624, media_usd: 391.07, mediana_usd: 312.28 },
        ],
      },
      {
        label: 'Paso 2: Estratificar por customers.segment usando MEDIAN(...) FILTER (WHERE ...)',
        explanation:
          'Al abrir por segmento, la hipótesis universal queda refutada: en `pro_barista`, el canal físico `pos_tienda` (`393.01 USD`) supera a `desktop` (`332.62 USD`) en `60.39 USD` (`brecha_desktop_vs_pos_usd = -60.39`). El agregado global favorecía a `desktop` solo porque concentra 1 328 pedidos de `cafeteria_b2b` con mediana de `507.08 USD`.',
        code: `SELECT
  c.segment,
  COUNT(*) FILTER (WHERE o.device_type = 'desktop') AS pedidos_desktop,
  COUNT(*) FILTER (WHERE o.device_type = 'pos_tienda') AS pedidos_pos,
  ROUND(MEDIAN(o.total_usd) FILTER (WHERE o.device_type = 'desktop'), 2) AS mediana_desktop_usd,
  ROUND(MEDIAN(o.total_usd) FILTER (WHERE o.device_type = 'pos_tienda'), 2) AS mediana_pos_usd,
  ROUND(
    MEDIAN(o.total_usd) FILTER (WHERE o.device_type = 'desktop')
    - MEDIAN(o.total_usd) FILTER (WHERE o.device_type = 'pos_tienda'),
    2
  ) AS brecha_desktop_vs_pos_usd
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.status = 'completed'
GROUP BY c.segment
ORDER BY c.segment;`,
        expectedOutput: [
          {
            segment: 'cafeteria_b2b',
            pedidos_desktop: 1328,
            pedidos_pos: 404,
            mediana_desktop_usd: 507.08,
            mediana_pos_usd: 318.24,
            brecha_desktop_vs_pos_usd: 188.84,
          },
          {
            segment: 'pro_barista',
            pedidos_desktop: 2502,
            pedidos_pos: 1233,
            mediana_desktop_usd: 332.62,
            mediana_pos_usd: 393.01,
            brecha_desktop_vs_pos_usd: -60.39,
          },
          {
            segment: 'retail',
            pedidos_desktop: 2497,
            pedidos_pos: 1172,
            mediana_desktop_usd: 369.03,
            mediana_pos_usd: 334.91,
            brecha_desktop_vs_pos_usd: 34.12,
          },
        ],
      },
    ],
  },

  checks: [
    {
      id: 'chk-da2-eda-01-refutable',
      type: 'mcq',
      prompt:
        '¿Cuál de los siguientes enunciados constituye una hipótesis analítica refutable antes de consultar la base de datos de Mercado Brisa?',
      options: [
        {
          id: 'a',
          text: 'Explorar cómo varían los ingresos de las tiendas según el método de pago utilizado.',
          correct: false,
          feedback:
            'Incorrecto. Es un objetivo temático abierto: cualquier tabla de resultados cumpliría el encargo sin poder refutar nada.',
        },
        {
          id: 'b',
          text: 'En pedidos completados, la mediana de total_usd pagada con transferencia_b2b supera al menos en 50 USD a la de tarjeta_credito.',
          correct: true,
          feedback:
            'Exacto. Especifica población (pedidos completados), grupos comparados, métrica resistente (mediana) y umbral numérico refutable (50 USD).',
        },
        {
          id: 'c',
          text: 'Revisar si existen relaciones interesantes entre la antigüedad del cliente y las devoluciones.',
          correct: false,
          feedback:
            'Incorrecto. «Relaciones interesantes» no define métrica ni dirección, lo que invita a pescar correlaciones al azar.',
        },
        {
          id: 'd',
          text: 'Graficar las ventas mensuales por país para entender dónde conviene invertir el presupuesto.',
          correct: false,
          feedback:
            'Incorrecto. Trazar un gráfico descriptivo sin expectativa cuantitativa previa no constituye una hipótesis refutable.',
        },
      ],
      explanation:
        'Solo la opción b define población válida (pedidos completados), variable de corte (método de pago), métrica resistente (mediana de total_usd) y un umbral numérico exacto (50 USD) que una consulta SQL puede falsar.',
    },
    {
      id: 'chk-da2-eda-01-dredging',
      type: 'predict-output',
      prompt:
        'Un analista ejecuta 20 cruces independientes sin hipótesis previa buscando diferencias al umbral del 5 % y halla un único cruce llamativo en una tienda. ¿Cómo debe reportar ese resultado?',
      options: [
        {
          id: 'a',
          text: 'Como hallazgo confirmado listo para reasignar el presupuesto comercial de inmediato.',
          correct: false,
          feedback:
            'Incorrecto. Con 20 comparaciones sin hipótesis previa, lo más probable es que ese único salto sea ruido muestral.',
        },
        {
          id: 'b',
          text: 'Como conjetura exploratoria pendiente de validación en datos nuevos, dado el 64.15 % de riesgo de falso positivo acumulado.',
          correct: true,
          feedback:
            'Correcto. Al realizar 20 pruebas al 5 %, la probabilidad de al menos un falso positivo sube a 1 - (0.95)^20 = 64.15 %.',
        },
        {
          id: 'c',
          text: 'Como prueba causal directa porque el resultado provino de datos transaccionales completos.',
          correct: false,
          feedback:
            'Incorrecto. Tener muchas filas no elimina el sesgo de selección por comparaciones múltiples post-hoc.',
        },
      ],
      explanation:
        'Al evaluar 20 cortes independientes al 5 %, la probabilidad de obtener al menos una diferencia por azar es 1 - (0.95)^20 = 64.15 %. En EDA, todo patrón emergente se registra como conjetura para contrastar en otra muestra.',
    },
    {
      id: 'chk-da2-eda-01-fill-filter',
      type: 'fill-code',
      prompt:
        'Completa la consulta para calcular en una sola pasada la mediana de `total_usd` únicamente de los pedidos hechos desde `desktop` por cada segmento:',
      template: `SELECT
  c.segment,
  ROUND(MEDIAN(o.total_usd) {{b1}} (WHERE o.device_type = {{b2}}), 2) AS mediana_desktop_usd
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.status = 'completed'
GROUP BY c.segment;`,
      blanks: [
        { id: 'b1', accepted: ['FILTER', 'filter'] },
        { id: 'b2', accepted: ["'desktop'", '"desktop"'] },
      ],
      explanation:
        'La cláusula `FILTER (WHERE o.device_type = \'desktop\')` aplica la condición únicamente a la función de agregación `MEDIAN` sin filtrar el resto de las filas del grupo.',
    },
    {
      id: 'chk-da2-eda-01-confounder',
      type: 'mcq',
      prompt:
        'En el ejemplo guiado, ¿por qué `desktop` parecía superar a `pos_tienda` en general pero perdía por `60.39 USD` dentro del segmento `pro_barista`?',
      options: [
        {
          id: 'a',
          text: 'Porque la función MEDIAN de DuckDB ignora los decimales cuando se combina con FILTER.',
          correct: false,
          feedback:
            'Incorrecto. MEDIAN calcula el valor exacto en coma flotante tanto con FILTER como sin él.',
        },
        {
          id: 'b',
          text: 'Por efecto de composición: desktop concentra 1 328 pedidos de cafeteria_b2b con mediana de 507.08 USD frente a solo 404 en pos_tienda.',
          correct: true,
          feedback:
            'Exacto. El peso desproporcionado de las cafeterías B2B en desktop arrastraba hacia arriba la mediana global sin estratificar.',
        },
        {
          id: 'c',
          text: 'Porque pos_tienda incluye pedidos cancelados y pendientes de pago.',
          correct: false,
          feedback:
            'Incorrecto. Ambas consultas filtraron estrictamente `o.status = \'completed\'`.',
        },
      ],
      explanation:
        'El segmento del cliente actúa como variable de confusión: cafeteria_b2b tiene el ticket mediano más alto (507.08 USD en desktop) y más del triple de volumen en desktop que en pos_tienda, inflando la mediana global del canal web.',
    },
  ],

  practice: {
    type: 'sql',
    title: 'Contraste de hipótesis sobre niveles de lealtad e ingresos netos de reembolso',
    language: 'sql',
    prompt:
      'El equipo de fidelización plantea una hipótesis doble sobre los pedidos cerrados (`status IN (\'completed\', \'refunded\')`): afirma que la mediana del ingreso neto por pedido (`total_usd` menos el total reembolsado en `refunds`) crece estrictamente en el orden `platino > oro > plata > bronce`, y que `platino` tiene la menor tasa de pedidos reembolsados. Contrasta esta hipótesis uniendo `orders`, `customers` y una CTE `reembolsos_por_pedido` que sume `refund_amount_usd` por `order_id`. Devuelve `nivel_lealtad` (`c.current_tier`), `pedidos_evaluados`, `mediana_bruta_usd` (`MEDIAN(o.total_usd)` a 2 decimales), `tasa_pedidos_reembolsados_pct` (porcentaje de pedidos con reembolso `> 0`, a 2 decimales) y `mediana_neta_usd` (mediana de `o.total_usd - COALESCE(r.total_reembolsado_usd, 0)`, a 2 decimales). Ordena por `mediana_neta_usd DESC`.',
    starterCode: `WITH reembolsos_por_pedido AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS total_reembolsado_usd
  FROM refunds
  GROUP BY order_id
)
SELECT
  c.current_tier AS nivel_lealtad,
  COUNT(*) AS pedidos_evaluados,
  -- Calcula mediana_bruta_usd, tasa_pedidos_reembolsados_pct y mediana_neta_usd
  0.0 AS mediana_bruta_usd,
  0.0 AS tasa_pedidos_reembolsados_pct,
  0.0 AS mediana_neta_usd
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
LEFT JOIN reembolsos_por_pedido r ON o.order_id = r.order_id
WHERE o.status IN ('completed', 'refunded')
GROUP BY c.current_tier
ORDER BY mediana_neta_usd DESC;`,
    expected: `WITH reembolsos_por_pedido AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS total_reembolsado_usd
  FROM refunds
  GROUP BY order_id
)
SELECT
  c.current_tier AS nivel_lealtad,
  COUNT(*) AS pedidos_evaluados,
  ROUND(MEDIAN(o.total_usd), 2) AS mediana_bruta_usd,
  ROUND(
    COUNT(*) FILTER (WHERE COALESCE(r.total_reembolsado_usd, 0) > 0) * 100.0 / COUNT(*),
    2
  ) AS tasa_pedidos_reembolsados_pct,
  ROUND(MEDIAN(o.total_usd - COALESCE(r.total_reembolsado_usd, 0)), 2) AS mediana_neta_usd
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
LEFT JOIN reembolsos_por_pedido r ON o.order_id = r.order_id
WHERE o.status IN ('completed', 'refunded')
GROUP BY c.current_tier
ORDER BY mediana_neta_usd DESC;`,
    orderMatters: true,
    hints: [
      'Usa ROUND(MEDIAN(o.total_usd), 2) para mediana_bruta_usd y recuerda envolver r.total_reembolsado_usd en COALESCE(..., 0) para los pedidos sin reembolso.',
      'Para tasa_pedidos_reembolsados_pct, emplea COUNT(*) FILTER (WHERE COALESCE(r.total_reembolsado_usd, 0) > 0) * 100.0 / COUNT(*) redondeado a 2 decimales.',
      'Calcula mediana_neta_usd con ROUND(MEDIAN(o.total_usd - COALESCE(r.total_reembolsado_usd, 0)), 2) y ordena el resultado por mediana_neta_usd DESC.',
    ],
    solution: `WITH reembolsos_por_pedido AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS total_reembolsado_usd
  FROM refunds
  GROUP BY order_id
)
SELECT
  c.current_tier AS nivel_lealtad,
  COUNT(*) AS pedidos_evaluados,
  ROUND(MEDIAN(o.total_usd), 2) AS mediana_bruta_usd,
  ROUND(
    COUNT(*) FILTER (WHERE COALESCE(r.total_reembolsado_usd, 0) > 0) * 100.0 / COUNT(*),
    2
  ) AS tasa_pedidos_reembolsados_pct,
  ROUND(MEDIAN(o.total_usd - COALESCE(r.total_reembolsado_usd, 0)), 2) AS mediana_neta_usd
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
LEFT JOIN reembolsos_por_pedido r ON o.order_id = r.order_id
WHERE o.status IN ('completed', 'refunded')
GROUP BY c.current_tier
ORDER BY mediana_neta_usd DESC;`,
    solutionExplanation:
      'El resultado refuta ambas partes de la hipótesis: el nivel `oro` lidera la mediana neta (`347.99 USD` frente a `326.08 USD` en `platino`), y el nivel `bronce` supera a `plata` en mediana neta (`308.55 USD` frente a `299.93 USD`) además de registrar la menor tasa de reembolsos (`5.47 %` frente a `7.18 %` en `plata`).',
    expectedOutputTable: [
      {
        nivel_lealtad: 'oro',
        pedidos_evaluados: 7100,
        mediana_bruta_usd: 374.34,
        tasa_pedidos_reembolsados_pct: 6.13,
        mediana_neta_usd: 347.99,
      },
      {
        nivel_lealtad: 'platino',
        pedidos_evaluados: 1552,
        mediana_bruta_usd: 350.22,
        tasa_pedidos_reembolsados_pct: 6.44,
        mediana_neta_usd: 326.08,
      },
      {
        nivel_lealtad: 'bronce',
        pedidos_evaluados: 2467,
        mediana_bruta_usd: 326.38,
        tasa_pedidos_reembolsados_pct: 5.47,
        mediana_neta_usd: 308.55,
      },
      {
        nivel_lealtad: 'plata',
        pedidos_evaluados: 5081,
        mediana_bruta_usd: 327.7,
        tasa_pedidos_reembolsados_pct: 7.18,
        mediana_neta_usd: 299.93,
      },
    ],
  },

  roleNotes: {
    da: 'Como analista de datos, tu primera defensa contra los pedidos ad-hoc interminables es redactar la condición de refutación antes de abrir SQL. Si los datos desmienten la creencia inicial (como ocurre con `oro` superando a `platino`), ese hallazgo documentado ahorra semanas de campañas mal enfocadas.',
    de: 'Para ingeniería de datos, saber qué hipótesis contrasta el equipo analítico permite exponer tablas con el grano correcto y claves limpias, evitando que consultas exploratorias mal unidas (como cruzar `orders` y `refunds` sin preagregar por `order_id`) dupliquen importes.',
    bi: 'En inteligencia de negocios, evita construir tableros con veinte filtros cruzados para que el usuario «busque qué subió hoy». Diseña vistas ancladas a preguntas explícitas e incluye siempre el conteo de muestra junto a cada mediana para impedir lecturas engañosas.',
  },

  summary: [
    'Una hipótesis analítica refutable define población, grupos comparados, métrica resistente y el umbral numérico que demostraría que es falsa.',
    'Cruzar veinte dimensiones sin hipótesis previa eleva al 64.15 % la probabilidad de encontrar al menos un falso positivo por azar.',
    'Todo patrón inesperado hallado durante la exploración debe registrarse como conjetura candidata y validarse en datos independientes.',
    'Estratificar por el segmento del cliente con `FILTER (WHERE ...)` evita que el peso de un estrato distorsione el signo global.',
  ],

  flashcards: [
    {
      id: 'fc-da2-eda-01-01',
      front: '¿Qué cuatro elementos distinguen a una hipótesis analítica refutable de una pregunta abierta?',
      back: '1) Población y estado válido, 2) variable o grupos comparados, 3) métrica estadística resistente (como mediana e IQR) y 4) umbral o dirección numérica que refutaría la afirmación.',
    },
    {
      id: 'fc-da2-eda-01-02',
      front: '¿Por qué probar 20 cortes independientes sin hipótesis previa al 5 % de significancia invalida un hallazgo casual?',
      back: 'Porque la probabilidad de obtener al menos una diferencia aparente por puro azar muestral sube a 1 - (0.95)^20 = 64.15 % (pesca de correlaciones o falacia del francotirador).',
    },
    {
      id: 'fc-da2-eda-01-03',
      front: '¿Cómo permite la cláusula FILTER (WHERE ...) de DuckDB auditar variables de confusión en una sola consulta?',
      back: 'Calcula métricas condicionales (como MEDIAN(total_usd) FILTER (WHERE device_type = \'desktop\')) en columnas paralelas para cada estrato del GROUP BY sin alterar el grano.',
    },
    {
      id: 'fc-da2-eda-01-04',
      front: 'En Mercado Brisa, ¿qué ocurre al contrastar la hipótesis de que el nivel platino lidera la mediana neta por pedido?',
      back: 'Queda refutada: el nivel oro lidera la mediana neta (347.99 USD frente a 326.08 USD en platino), y bronce supera a plata en mediana neta (308.55 USD frente a 299.93 USD) por menor tasa de reembolso.',
    },
  ],

  glossaryTerms: [
    'hipotesis-refutable',
    'pesca-correlaciones',
    'perfilado-datos',
  ],

  sources: [
    {
      title: 'NIST/SEMATECH e-Handbook of Statistical Methods — Section 1.1.1: What is Exploratory Data Analysis?',
      url: 'https://www.itl.nist.gov/div898/handbook/eda/section1/eda11.htm',
      publisher: 'National Institute of Standards and Technology (NIST)',
      accessed: '2026-10-29',
      supports:
        'Distinción metodológica entre generación exploratoria de hipótesis y evaluación confirmatoria.',
    },
    {
      title: 'R for Data Science (2nd Edition) — Chapter 10: Exploratory Data Analysis',
      url: 'https://r4ds.hadley.nz/EDA.html',
      publisher: "O'Reilly Media",
      accessed: '2026-10-29',
      supports:
        'Ciclo iterativo de preguntas sobre variación y covariación y control de variables de confusión.',
    },
    {
      title: 'DuckDB Documentation — FILTER Clause in Aggregate Functions',
      url: 'https://duckdb.org/docs/sql/query_syntax/filter.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports:
        'Cálculo de medianas y conteos condicionales por estrato en una sola pasada con FILTER (WHERE ...).',
    },
    {
      title: 'Statsmodels User Guide — Statistical Models and Hypothesis Testing',
      url: 'https://www.statsmodels.org/stable/user-guide.html',
      publisher: 'Statsmodels Developers',
      accessed: '2026-10-29',
      supports:
        'Riesgo de inflación de falsos positivos cuando se realizan comparaciones múltiples sin hipótesis previa.',
    },
  ],

  aiNotes:
    'Guía al estudiante para que identifique siempre los cuatro componentes de una hipótesis refutable antes de escribir SQL. En la práctica sobre `orders`, `customers` y `refunds`, verifica que preagregue `refunds` por `order_id` en la CTE y use `COALESCE(r.total_reembolsado_usd, 0)` tanto en el filtro de tasa de reembolso como al restar el reembolso a `o.total_usd`.',
};

export default lesson;
