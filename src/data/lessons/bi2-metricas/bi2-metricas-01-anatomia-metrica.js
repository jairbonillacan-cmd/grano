const lesson = {
  id: 'bi2-metricas-01-anatomia-metrica',
  moduleId: 'bi2-metricas',
  tracks: ['bi'],
  level: 2,
  order: 1,
  title: 'Anatomía de una métrica: fórmula, grano, filtro y dueño',
  subtitle:
    'Anatomía de una métrica sin ambigüedad: fórmula, grano, filtros canónicos y responsable',
  minutes: 20,
  datasets: ['orders', 'refunds', 'stores'],
  prerequisites: [],
  contentVersion: 1,

  hook: 'En el cierre trimestral de Mercado Brisa (empresa ficticia), tres gerencias presentan el ingreso sobre los mismos 18,000 pedidos. Marketing anuncia 7,669,817.77 USD, Operaciones reporta 5,404,389.77 USD y Finanzas certifica 5,651,389.86 USD. Ningún equipo cometió errores de sintaxis SQL. Cada área programó su propia interpretación de qué significa vender. Cuando tres tableros difieren en dos millones de dólares, la reunión deja de tratar sobre estrategia. ¿Qué elementos convierten un cálculo suelto en una métrica canónica sin ambigüedad?',

  objectives: [
    'Especificar los cinco componentes del contrato de una métrica canónica: fórmula exacta, grano atómico, filtros canónicos, ventana temporal y propietario de negocio.',
    'Prevenir la inflación por fan-out al combinar pedidos con devoluciones múltiples preagregando al grano de order_id antes de calcular el ingreso neto realizado.',
    'Auditar por formato de tienda (store_type) el ingreso neto canónico y el ticket promedio neto aplicando filtros de estado y deducción de reembolsos en DuckDB.',
  ],

  sections: [
    {
      id: 'cinco-componentes-contrato',
      heading: 'Los cinco pilares de una métrica canónica',
      body: 'Nombrar un indicador como **ingreso neto** no basta para que dos analistas escriban la misma consulta. Una **métrica canónica** exige un contrato técnico y de negocio compuesto por cinco piezas explícitas. Si falta cualquiera de ellas, cada área inventará sus propios supuestos. Eso provoca divergencia de cifras entre tableros ejecutivos.\n\nEl primer pilar es la fórmula matemática exacta: qué columnas se suman, cuáles se restan y cómo se tratan los nulos con `COALESCE`. El segundo pilar es el grano atómico de evaluación, como una fila por `order_id`. El tercer pilar son los **filtros canónicos** que acotan el universo válido. En ventas realizadas incluimos `completed` y `refunded`, pero descartamos `cancelled` y `pending`.\n\nEl cuarto pilar fija la ventana temporal y la columna de fecha que rige la atribución. En comercio electrónico, la fecha del pedido (`order_date`) no siempre coincide con la fecha del reembolso (`refund_date`). El quinto pilar asigna un propietario de negocio, como Contraloría Financiera, quien aprueba cualquier cambio al contrato.',
      example: {
        language: 'sql',
        code: `WITH dev_por_pedido AS (
  SELECT order_id, SUM(refund_amount_usd) AS devuelto_usd
  FROM refunds
  GROUP BY order_id
)
SELECT
  ROUND(SUM(o.total_usd), 2) AS mkt_bruto_con_impuestos_usd,
  ROUND(SUM(o.subtotal_usd - o.discount_usd)
    FILTER (WHERE o.status = 'completed'), 2) AS ops_solo_completados_usd,
  ROUND(SUM(o.subtotal_usd - o.discount_usd - COALESCE(d.devuelto_usd, 0))
    FILTER (WHERE o.status IN ('completed', 'refunded')), 2) AS fin_ingreso_neto_canonico_usd
FROM orders o
LEFT JOIN dev_por_pedido d ON o.order_id = d.order_id;`,
        expectedOutput: [
          {
            mkt_bruto_con_impuestos_usd: 7669817.77,
            ops_solo_completados_usd: 5404389.77,
            fin_ingreso_neto_canonico_usd: 5651389.86,
          },
        ],
      },
      interactive: {
        component: 'semantic-contract-sim',
        caption:
          'Simulador de contrato semántico: explora cómo cambian los ingresos reportados al activar o desactivar filtros canónicos y deducciones.',
      },
    },
    {
      id: 'grano-y-fanout-devoluciones',
      heading: 'Alineación de grano antes de restar devoluciones',
      body: 'Declarar la fórmula en papel no evita errores si la consulta SQL viola el **grano** de las tablas. En Mercado Brisa, la tabla `orders` tiene grano de un registro por pedido (`18,000` filas). En cambio, `refunds` registra cada evento de devolución (`1,450` filas repartidas en `1,150` pedidos únicos).\n\nExisten `300` pedidos que sufrieron dos reembolsos parciales en fechas distintas. Si ejecutas un `LEFT JOIN` directo entre `orders` y `refunds` y sumas `subtotal_usd - discount_usd`, esos `300` pedidos duplicarán su subtotal. Esta multiplicación silenciosa de filas se llama **fan-out**. Distorsiona tanto el ingreso como el conteo de pedidos.\n\nLa regla de ingeniería analítica es estricta. Antes de unir una tabla de hechos principal con un detalle de eventos, debes colapsar la tabla secundaria al grano de la clave de unión. Agrupar `refunds` por `order_id` dentro de una CTE garantiza una relación uno a uno y preserva la aditividad.',
      example: {
        language: 'sql',
        code: `SELECT
  COUNT(*) AS filas_en_refunds,
  COUNT(DISTINCT order_id) AS pedidos_con_reembolso,
  COUNT(*) - COUNT(DISTINCT order_id) AS pedidos_con_multiples_reembolsos,
  ROUND(SUM(refund_amount_usd), 2) AS total_reembolsado_todos_estados_usd
FROM refunds;`,
        expectedOutput: [
          {
            filas_en_refunds: 1450,
            pedidos_con_reembolso: 1150,
            pedidos_con_multiples_reembolsos: 300,
            total_reembolsado_todos_estados_usd: 321097.25,
          },
        ],
      },
    },
    {
      id: 'filtros-canonicos-y-clausula-filter',
      heading: 'Filtros canónicos y aislamiento con FILTER (WHERE)',
      body: 'Un **filtro canónico** define qué filas representan transacciones legítimas para una métrica. En Mercado Brisa, los pedidos `pending` (`720` filas) aún no se han cobrado en firme. Los pedidos `cancelled` (`1,080` filas) fueron anulados antes de consolidar venta. Por ello, el universo canónico realizado comprende solo `completed` (`14,760` filas) y `refunded` (`1,440` filas), sumando `16,200` pedidos.\n\n¿Por qué incluimos el estado `refunded` dentro del universo realizado? Porque muchos de esos pedidos tuvieron devoluciones parciales y conservan ingreso neto positivo. Además, excluirlos del denominador inflaría artificialmente el **ticket promedio neto** al esconder las ventas que sufrieron reclamos.\n\nA veces necesitas reportar en una misma consulta métricas con distintos universos. Un `WHERE` global contamina todas las columnas de la tabla. En DuckDB, la cláusula `FILTER (WHERE ...)` adjunta a cada agregación encapsula el filtro canónico dentro de cada medida sin alterar el resto del reporte.',
    },
  ],

  workedExample: {
    title:
      'De una consulta ambigua con fan-out al contrato canónico de Ingreso Neto',
    description:
      'Compara el efecto de unir orders y refunds sin alinear el grano ni filtrar estados frente a la implementación exacta del contrato de Finanzas.',
    steps: [
      {
        label:
          'Paso 1 — Consulta defectuosa: unión directa sin grano ni filtro canónico',
        explanation:
          'Un analista une directamente orders y refunds sin preagregar devoluciones ni excluir pedidos pendientes o cancelados. Los 300 pedidos con dos reembolsos duplican su subtotal_usd y los pedidos no realizados inflan la cifra en más de un millón de dólares.',
        code: `SELECT
  COUNT(o.order_id) AS filas_evaluadas,
  ROUND(SUM(o.subtotal_usd - o.discount_usd - COALESCE(r.refund_amount_usd, 0)), 2) AS ingreso_distorsionado_usd
FROM orders o
LEFT JOIN refunds r ON o.order_id = r.order_id;`,
        expectedOutput: [
          {
            filas_evaluadas: 18300,
            ingreso_distorsionado_usd: 6386345.41,
          },
        ],
      },
      {
        label:
          'Paso 2 — Consulta canónica: CTE al grano de pedido y filtro explícito',
        explanation:
          'Aplicamos el contrato aprobado por Finanzas: colapsamos refunds al grano de order_id en una CTE, filtramos los 16,200 pedidos realizados (completed y refunded) y obtenemos los 5,651,389.86 USD de ingreso neto canónico con un ticket neto promedio de 348.85 USD.',
        code: `WITH dev_por_pedido AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS devuelto_usd
  FROM refunds
  GROUP BY order_id
)
SELECT
  COUNT(o.order_id) AS pedidos_realizados,
  ROUND(SUM(o.subtotal_usd), 2) AS subtotal_bruto_usd,
  ROUND(SUM(o.discount_usd), 2) AS descuentos_usd,
  ROUND(SUM(COALESCE(d.devuelto_usd, 0)), 2) AS devoluciones_usd,
  ROUND(SUM(o.subtotal_usd - o.discount_usd - COALESCE(d.devuelto_usd, 0)), 2) AS ingreso_neto_canonico_usd,
  ROUND(
    SUM(o.subtotal_usd - o.discount_usd - COALESCE(d.devuelto_usd, 0)) / COUNT(o.order_id),
    2
  ) AS ticket_neto_promedio_usd
FROM orders o
LEFT JOIN dev_por_pedido d ON o.order_id = d.order_id
WHERE o.status IN ('completed', 'refunded');`,
        expectedOutput: [
          {
            pedidos_realizados: 16200,
            subtotal_bruto_usd: 5991229.78,
            descuentos_usd: 65305.4,
            devoluciones_usd: 274534.52,
            ingreso_neto_canonico_usd: 5651389.86,
            ticket_neto_promedio_usd: 348.85,
          },
        ],
      },
    ],
  },

  checks: [
    {
      id: 'chk-bi2-01-fanout',
      type: 'mcq',
      prompt:
        'En Mercado Brisa, 300 pedidos tienen dos filas en la tabla refunds. ¿Qué ocurre si ejecutas SELECT SUM(o.subtotal_usd - COALESCE(r.refund_amount_usd, 0)) FROM orders o LEFT JOIN refunds r ON o.order_id = r.order_id?',
      options: [
        {
          id: 'a',
          text: 'El resultado es exacto porque LEFT JOIN conserva todos los pedidos y resta cada reembolso una sola vez.',
          correct: false,
          feedback:
            'Incorrecto. Aunque cada reembolso se resta una vez, el subtotal_usd de los 300 pedidos con dos reembolsos se suma dos veces.',
        },
        {
          id: 'b',
          text: 'Se produce un fan-out que suma dos veces el subtotal_usd de esos 300 pedidos, inflando el ingreso calculado.',
          correct: true,
          feedback:
            'Correcto. Al unir una tabla de grano pedido (1:1) con una de grano evento de reembolso (1:N) sin preagregar, las medidas de la cabecera se duplican.',
        },
        {
          id: 'c',
          text: 'DuckDB lanza un error en tiempo de ejecución porque no permite funciones de agregación tras un LEFT JOIN uno a muchos.',
          correct: false,
          feedback:
            'Incorrecto. El motor SQL ejecuta la consulta sin errores; el defecto es semántico y silencioso.',
        },
        {
          id: 'd',
          text: 'Los pedidos sin reembolsos desaparecen del cálculo porque COALESCE convierte los nulos en cero antes del filtro.',
          correct: false,
          feedback:
            'Incorrecto. El LEFT JOIN preserva los pedidos sin reembolsos y COALESCE transforma el nulo en 0 sin eliminar filas.',
        },
      ],
      explanation:
        'Unir orders (1 fila por pedido) con refunds (hasta 2 filas por pedido) multiplica las filas de los 300 pedidos con doble reembolso. Para evitar este fan-out, refunds debe agruparse por order_id en una CTE antes del LEFT JOIN.',
    },
    {
      id: 'chk-bi2-01-componentes',
      type: 'mcq',
      prompt:
        'Dos analistas usan la misma fórmula y el mismo filtro de estado para calcular el ingreso neto mensual, pero obtienen cifras distintas en cada cierre de mes. ¿Qué componente del contrato de métrica quedó sin definir?',
      options: [
        {
          id: 'a',
          text: 'La ventana temporal y el campo de fecha rector (por ejemplo, atribuir por order_date frente a refund_date).',
          correct: true,
          feedback:
            'Correcto. Si un analista agrupa por la fecha del pedido y otro descuenta reembolsos según la fecha en que se procesó la devolución, los cortes mensuales divergirán.',
        },
        {
          id: 'b',
          text: 'El tipo de compresión del archivo Parquet donde se almacenan los pedidos históricos.',
          correct: false,
          feedback:
            'Incorrecto. El formato físico de almacenamiento no altera el resultado lógico de una consulta SQL.',
        },
        {
          id: 'c',
          text: 'El alias visual de la columna en la cláusula SELECT final del reporte.',
          correct: false,
          feedback:
            'Incorrecto. El alias cambia el encabezado de la tabla pero no modifica los valores numéricos.',
        },
      ],
      explanation:
        'El contrato de una métrica canónica requiere fijar qué columna temporal gobierna el corte (como order_date para cohortes de venta o refund_date para flujo de caja contable). Sin esa regla, los cierres periódicos nunca coinciden.',
    },
    {
      id: 'chk-bi2-01-filter-clause',
      type: 'fill-code',
      prompt:
        'Completa la palabra clave estándar de SQL en DuckDB que aplica un filtro canónico exclusivo a una función de agregación sin filtrar el resto de las columnas de la consulta:',
      template:
        "SUM(subtotal_usd - discount_usd) {{b1}} (WHERE status IN ('completed', 'refunded'))",
      blanks: [
        {
          id: 'b1',
          accepted: ['FILTER', 'filter'],
        },
      ],
      explanation:
        'La cláusula FILTER (WHERE condición) evalúa el predicado únicamente para la función de agregación a la que acompaña. Esto permite calcular en un mismo SELECT métricas con distintos filtros canónicos sin que interfieran entre sí.',
    },
  ],

  practice: {
    type: 'sql',
    title: 'Auditoría del contrato de Ingreso Neto por formato de tienda',
    language: 'sql',
    prompt:
      'Audita el contrato canónico de Ingreso Neto por formato de tienda (`store_type`). Preagrega `refunds` por `order_id` para evitar fan-out, une `orders` con `stores` y filtra únicamente los pedidos realizados (`status IN (\'completed\', \'refunded\')`). Devuelve cuatro columnas exactas: `store_type`, `pedidos_realizados` (conteo de pedidos), `ingreso_neto_canonico_usd` (`SUM(subtotal_usd - discount_usd - COALESCE(devuelto_usd, 0))` redondeado a 2 decimales) y `ticket_neto_canonico_usd` (ingreso neto dividido entre `pedidos_realizados`, redondeado a 2 decimales). Ordena de mayor a menor por `ingreso_neto_canonico_usd`.',
    starterCode: `WITH dev_por_pedido AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS devuelto_usd
  FROM refunds
  GROUP BY order_id
)
SELECT
  s.store_type,
  COUNT(o.order_id) AS pedidos_realizados,
  -- Corrige la fórmula: usa subtotal_usd - discount_usd - COALESCE(d.devuelto_usd, 0)
  ROUND(SUM(o.total_usd), 2) AS ingreso_neto_canonico_usd,
  ROUND(SUM(o.total_usd) / COUNT(o.order_id), 2) AS ticket_neto_canonico_usd
FROM orders o
JOIN stores s ON o.store_id = s.store_id
LEFT JOIN dev_por_pedido d ON o.order_id = d.order_id
-- Agrega el filtro canónico: WHERE o.status IN ('completed', 'refunded')
GROUP BY s.store_type
ORDER BY ingreso_neto_canonico_usd DESC;`,
    expected: `WITH dev_por_pedido AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS devuelto_usd
  FROM refunds
  GROUP BY order_id
)
SELECT
  s.store_type,
  COUNT(o.order_id) AS pedidos_realizados,
  ROUND(SUM(o.subtotal_usd - o.discount_usd - COALESCE(d.devuelto_usd, 0)), 2) AS ingreso_neto_canonico_usd,
  ROUND(
    SUM(o.subtotal_usd - o.discount_usd - COALESCE(d.devuelto_usd, 0)) / COUNT(o.order_id),
    2
  ) AS ticket_neto_canonico_usd
FROM orders o
JOIN stores s ON o.store_id = s.store_id
LEFT JOIN dev_por_pedido d ON o.order_id = d.order_id
WHERE o.status IN ('completed', 'refunded')
GROUP BY s.store_type
ORDER BY ingreso_neto_canonico_usd DESC;`,
    orderMatters: true,
    hints: [
      "Asegúrate de incluir la cláusula WHERE o.status IN ('completed', 'refunded') antes del GROUP BY para descartar pedidos cancelados y pendientes.",
      'Reemplaza o.total_usd por (o.subtotal_usd - o.discount_usd - COALESCE(d.devuelto_usd, 0)) tanto en ingreso_neto_canonico_usd como en el numerador de ticket_neto_canonico_usd.',
      'Recuerda redondear ambas medidas monetarias con ROUND(..., 2) y ordenar con ORDER BY ingreso_neto_canonico_usd DESC.',
    ],
    solution: `WITH dev_por_pedido AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS devuelto_usd
  FROM refunds
  GROUP BY order_id
)
SELECT
  s.store_type,
  COUNT(o.order_id) AS pedidos_realizados,
  ROUND(SUM(o.subtotal_usd - o.discount_usd - COALESCE(d.devuelto_usd, 0)), 2) AS ingreso_neto_canonico_usd,
  ROUND(
    SUM(o.subtotal_usd - o.discount_usd - COALESCE(d.devuelto_usd, 0)) / COUNT(o.order_id),
    2
  ) AS ticket_neto_canonico_usd
FROM orders o
JOIN stores s ON o.store_id = s.store_id
LEFT JOIN dev_por_pedido d ON o.order_id = d.order_id
WHERE o.status IN ('completed', 'refunded')
GROUP BY s.store_type
ORDER BY ingreso_neto_canonico_usd DESC;`,
    solutionExplanation:
      'Al preagregar refunds por order_id y filtrar los 16,200 pedidos realizados, comprobamos que las tiendas retail lideran el volumen con 3,169,917.82 USD, mientras que el formato warehouse registra el mayor ticket neto promedio (453.74 USD por pedido).',
    expectedOutputTable: [
      {
        store_type: 'retail',
        pedidos_realizados: 9229,
        ingreso_neto_canonico_usd: 3169917.82,
        ticket_neto_canonico_usd: 343.47,
      },
      {
        store_type: 'warehouse',
        pedidos_realizados: 2880,
        ingreso_neto_canonico_usd: 1306785.46,
        ticket_neto_canonico_usd: 453.74,
      },
      {
        store_type: 'flagship',
        pedidos_realizados: 4091,
        ingreso_neto_canonico_usd: 1174686.58,
        ticket_neto_canonico_usd: 287.14,
      },
    ],
  },

  roleNotes: {
    de: 'Como Ingeniero de Datos, materializa tablas intermedias donde las devoluciones y líneas de pedido ya estén agregadas al grano de order_id. Así evitas que los consumidores produzcan fan-out al consultar el almacén.',
    da: 'Como Analista de Datos, nunca presentes una cifra en un comité ejecutivo sin documentar al pie de la tabla qué estados de pedido filtraste y qué columna de fecha usaste para el corte temporal.',
    bi: 'Como Analista BI o Analytics Engineer, codifica la fórmula, el grano y los filtros canónicos en la capa semántica para que ningún tablero reescriba por su cuenta la lógica de ingreso neto.',
  },

  summary: [
    'Una métrica canónica requiere cinco elementos explícitos: fórmula matemática, grano atómico, filtros canónicos, ventana temporal y propietario de negocio.',
    'Omitir los filtros canónicos o incluir impuestos convierte el ingreso neto real (5,651,389.86 USD) en cifras infladas que dañan la confianza.',
    'Unir pedidos con reembolsos sin preagregar refunds al grano de order_id duplica filas en los 300 pedidos con devoluciones múltiples.',
    'La cláusula FILTER (WHERE ...) de DuckDB encapsula filtros canónicos específicos por medida dentro de una misma consulta analítica.',
  ],

  flashcards: [
    {
      id: 'fc-bi2-01-01',
      front:
        '¿Cuáles son los 5 componentes obligatorios del contrato de una métrica canónica?',
      back: '1) Fórmula matemática exacta, 2) Grano atómico de evaluación, 3) Filtros canónicos de inclusión/exclusión, 4) Ventana y columna temporal rectora, y 5) Propietario o responsable de negocio.',
    },
    {
      id: 'fc-bi2-01-02',
      front:
        '¿Por qué ocurre fan-out al unir orders directamente con refunds en Mercado Brisa?',
      back: 'Porque orders tiene grano de 1 fila por pedido (18,000 filas) y refunds tiene grano de evento de reembolso (1,450 filas en 1,150 pedidos), duplicando el subtotal de los 300 pedidos con dos devoluciones.',
    },
    {
      id: 'fc-bi2-01-03',
      front:
        "¿Por qué el filtro canónico de Ingreso Neto Realizado incluye status IN ('completed', 'refunded') y excluye 'cancelled' y 'pending'?",
      back: 'Porque los pedidos pendientes o cancelados no consolidaron venta contable, mientras que los pedidos con estado refunded son transacciones realizadas cuyos reembolsos parciales o totales deben restarse explícitamente.',
    },
    {
      id: 'fc-bi2-01-04',
      front:
        '¿Para qué sirve la cláusula FILTER (WHERE ...) dentro de una función de agregación en SQL?',
      back: 'Permite aplicar el filtro canónico específico de una métrica dentro de SUM, COUNT o AVG sin filtrar las demás métricas calculadas en el mismo SELECT.',
    },
  ],

  glossaryTerms: [
    'metrica-canonica',
    'filtro-canonico',
    'c01-grain-fanout',
    'c02-cte-preagg',
    'ingreso-neto',
  ],

  sources: [
    {
      title: 'dbt Labs — Creating Metrics Overview (MetricFlow)',
      url: 'https://docs.getdbt.com/docs/build/metrics-overview',
      publisher: 'dbt Labs',
      accessed: '2026-10-29',
      supports:
        'Separación entre medidas físicas y contratos de métricas con filtros declarativos en la capa semántica.',
    },
    {
      title: 'Kimball Group — Declaring the Grain in Dimensional Modeling',
      url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/grain/',
      publisher: 'Kimball Group',
      accessed: '2026-10-29',
      supports:
        'Declaración obligatoria del grano atómico de hechos para impedir errores de fan-out al unir tablas.',
    },
    {
      title: 'Cube.dev — Measures Reference & Semantic Modeling',
      url: 'https://cube.dev/docs/product/data-modeling/reference/measures',
      publisher: 'Cube Dev, Inc.',
      accessed: '2026-10-29',
      supports:
        'Gobernanza de medidas agregadas, filtros canónicos asociados y propietario responsable del modelo.',
    },
    {
      title: 'DuckDB Documentation — FILTER Clause in Aggregate Functions',
      url: 'https://duckdb.org/docs/sql/query_syntax/filter.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports:
        'Uso de la cláusula estándar FILTER (WHERE ...) para aislar predicados por métrica en SQL.',
    },
  ],

  aiNotes:
    'El error más frecuente del estudiante es hacer LEFT JOIN directo entre orders y refunds sin preagregar refunds por order_id, lo que duplica 300 pedidos con doble reembolso. El segundo error es usar total_usd (que incluye tax_usd) en vez de subtotal_usd - discount_usd - COALESCE(devuelto_usd, 0), o filtrar solo status = completed olvidando que status = refunded también forma parte del denominador realizado (16,200 pedidos).',
};

export default lesson;
