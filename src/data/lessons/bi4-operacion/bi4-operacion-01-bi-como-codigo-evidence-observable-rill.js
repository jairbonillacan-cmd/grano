export const lesson = {
  id: 'bi4-operacion-01-bi-como-codigo-evidence-observable-rill',
  moduleId: 'bi4-operacion',
  tracks: ['bi'],
  level: 4,
  order: 1,
  title: 'BI como código con Evidence, Observable y Rill',
  subtitle: 'BI como código declarativo con Evidence, Observable Framework y Rill sobre DuckDB-Wasm',
  minutes: 25,
  prerequisites: ['bi3-gobierno-05', 'bi3-dashboards-01-bi-tufte-code'],
  contentVersion: 1,

  hook: 'El lunes a las 07:45, antes del comité de dirección de Mercado Brisa, dos analistas editan en paralelo el tablero trimestral en una herramienta visual de arrastrar y soltar. Uno pisa el archivo del otro y nadie logra identificar qué filtro cambió en la tarjeta de ventas netas de Cono Sur. Además, cada apertura del reporte lanza doce consultas contra el almacén en la nube. ¿Cómo definir tableros en archivos de texto revisables en Git que respondan en milisegundos sobre DuckDB-Wasm sin consultar el almacén en cada clic?',

  objectives: [
    'Distinguir la arquitectura declarativa de Evidence (Markdown + SQL encadenado), Observable Framework (cargadores en compilación) y Rill (modelos SQL + vistas YAML de métricas).',
    'Diseñar cargadores de datos (data loaders) que preagreguen tablas de hechos a su grano exacto en instantáneas Parquet consumidas en el navegador mediante DuckDB-Wasm.',
    'Prevenir el abanico (fan-out) cruzado entre líneas de pedido y devoluciones al escribir consultas declarativas para componentes visuales.',
  ],

  sections: [
    {
      id: 'arquitectura-declarativa-evidence-observable-rill',
      heading: 'Tres enfoques de BI declarativo sobre archivos en texto plano',
      body: 'El paradigma **BI como código** reemplaza los archivos binarios opacos por código fuente en texto plano. En lugar de esconder filtros tras menús emergentes, cada consulta SQL, métrica y gráfico vive en un archivo versionado en Git. Esto permite revisar cambios en Pull Requests y ejecutar pruebas automáticas en integración continua. Si una entrega introduce un fallo, basta con ejecutar `git revert` para restaurar el estado previo.\n\nTres herramientas lideran esta arquitectura sobre **DuckDB-Wasm**. Evidence combina páginas Markdown (`.md`) con bloques SQL con nombre y componentes visuales como `<BarChart>` o `<DataTable>`. Una consulta puede referenciar a otra mediante `${nombre_consulta}` usando Universal SQL. Observable Framework separa la extracción en **cargadores de datos** (*data loaders* en SQL o Python) que corren al compilar el sitio. Estos cargadores emiten instantáneas Parquet consumidas en el navegador con SQL local. Rill organiza el proyecto en tres carpetas: `sources/` (conectores YAML), `models/` (SQL sobre DuckDB) y `metrics_views/` (métricas en YAML).',
      example: {
        language: 'sql',
        code: `WITH store_quarterly_target AS (
  SELECT
    region,
    SUM(monthly_target_usd * 3) AS quarterly_target_usd
  FROM stores
  GROUP BY region
),
regional_sales_q4 AS (
  SELECT
    s.region,
    c.fiscal_quarter,
    COUNT(DISTINCT o.order_id) AS completed_orders,
    ROUND(SUM(o.subtotal_usd - o.discount_usd), 2) AS gross_sales_usd
  FROM orders o
  JOIN calendar c ON c.calendar_date = o.order_date
  JOIN stores s ON s.store_id = o.store_id
  WHERE c.year = 2024
    AND c.quarter = 4
    AND o.status = 'completed'
  GROUP BY s.region, c.fiscal_quarter
)
SELECT
  r.region,
  r.fiscal_quarter,
  r.completed_orders,
  r.gross_sales_usd,
  ROUND(t.quarterly_target_usd, 2) AS quarterly_target_usd,
  ROUND(100.0 * r.gross_sales_usd / t.quarterly_target_usd, 2) AS attainment_pct
FROM regional_sales_q4 r
JOIN store_quarterly_target t ON t.region = r.region
ORDER BY attainment_pct DESC, r.region ASC;`,
        expectedOutput: [
          {
            region: 'Cono Sur',
            fiscal_quarter: 'FY24-Q4',
            completed_orders: 570,
            gross_sales_usd: 212882.02,
            quarterly_target_usd: 504000,
            attainment_pct: 42.24,
          },
          {
            region: 'Andina',
            fiscal_quarter: 'FY24-Q4',
            completed_orders: 592,
            gross_sales_usd: 206408.45,
            quarterly_target_usd: 720000,
            attainment_pct: 28.67,
          },
          {
            region: 'Iberia',
            fiscal_quarter: 'FY24-Q4',
            completed_orders: 333,
            gross_sales_usd: 140846.75,
            quarterly_target_usd: 663000,
            attainment_pct: 21.24,
          },
          {
            region: 'Norteamérica',
            fiscal_quarter: 'FY24-Q4',
            completed_orders: 234,
            gross_sales_usd: 78287.5,
            quarterly_target_usd: 888000,
            attainment_pct: 8.82,
          },
        ],
      },
    },
    {
      id: 'data-loaders-instantaneas-parquet-duckdb-wasm',
      heading: 'Cargadores en compilación e instantáneas Parquet en el navegador',
      body: 'Conectar un tablero ejecutivo en vivo al almacén analítico encarece el cómputo. Cada apertura repite las mismas agregaciones históricas y añade varios segundos de espera. En Observable Framework y Evidence, el diseño desacopla la extracción pesada de la lectura interactiva. Esta separación se logra mediante **cargadores en tiempo de compilación** (*build-time data loaders*).\n\nDurante la ejecución del pipeline CI/CD cada mañana, el cargador consulta el almacén una sola vez. Allí aplica las reglas de limpieza y genera un archivo Parquet compacto y tipado. Ese artefacto estático se publica junto con el tablero en una red CDN. Cuando alguien abre el reporte, **DuckDB-Wasm** arranca dentro del navegador web. El motor descarga solo las columnas requeridas del archivo Parquet. Así resuelve filtros interactivos en menos de 20 milisegundos sin tocar el almacén.',
      example: {
        language: 'markdown',
        code: `---
title: Desempeño Comercial Q4 2024 — Mercado Brisa
---

\`\`\`sql resumen_q4
SELECT
  region,
  completed_orders,
  gross_sales_usd,
  quarterly_target_usd,
  attainment_pct
FROM \${regional_q4_loader}
ORDER BY attainment_pct DESC
\`\`\`

<BarChart
  data={resumen_q4}
  x="region"
  y="gross_sales_usd"
  title="Ventas brutas completadas (USD) por región en FY24-Q4"
/>`,
      },
    },
    {
      id: 'control-grano-modelos-rill-evidence',
      heading: 'Control del grano antes de exponer tablas al cliente WebAssembly',
      body: 'Escribir SQL dentro de una página Markdown conlleva un riesgo frecuente. Es fácil olvidar las relaciones `1:N` que antes protegía el modelo semántico. En Mercado Brisa, un pedido (`orders`) tiene múltiples líneas en `order_items` (`42,000` filas para `18,000` órdenes). Ese mismo pedido también puede registrar varias filas en `refunds` (`1,305` devoluciones procesadas en `1,035` órdenes completadas).\n\nSi un bloque SQL une `orders`, `order_items` y `refunds` sin preagregar por `order_id`, ocurre una **trampa de abismo** (*chasm trap*). Las devoluciones se multiplican por cada línea de producto del pedido. Al mismo tiempo, las líneas de producto se duplican en los pedidos con más de un reembolso parcial. La regla de diseño es estricta: todo cargador o modelo intermedio debe colapsar cada tabla de hechos a un grano común en CTEs separadas antes de unirlas.',
    },
  ],

  workedExample: {
    title: 'Corrección de trampa de abismo en un bloque SQL declarativo de Evidence',
    description: 'El equipo de BI de Mercado Brisa redacta el bloque SQL `ingresos_netos_2024` en `pages/ingresos.md` para mostrar las ventas de líneas (`order_items.line_total_usd`), las devoluciones procesadas (`refunds.refund_amount_usd`) y el ingreso neto de órdenes completadas en 2024 por región.',
    steps: [
      {
        label: 'Paso 1 — Antipatrón: unión directa de orders, order_items y refunds en un solo bloque',
        explanation: 'Unir directamente `orders` con `order_items` (1:N) y `refunds` (1:M) multiplica ambos lados. En `Andina`, las devoluciones procesadas reales de 2024 (`43,155.37 USD`) se inflan a `97,960.53 USD` porque cada reembolso se repite por cada SKU del pedido; además, `line_total_usd` sube de `747,325.56 USD` a `760,804.98 USD` en los pedidos con múltiples devoluciones parciales.',
        code: `SELECT
  s.region,
  ROUND(SUM(oi.line_total_usd), 2) AS inflated_lines_usd,
  ROUND(COALESCE(SUM(r.refund_amount_usd), 0), 2) AS inflated_refunds_usd
FROM orders o
JOIN stores s ON s.store_id = o.store_id
JOIN order_items oi ON oi.order_id = o.order_id
LEFT JOIN refunds r ON r.order_id = o.order_id AND r.status = 'processed'
WHERE o.status = 'completed'
  AND EXTRACT(YEAR FROM o.order_date) = 2024
GROUP BY s.region
ORDER BY s.region ASC;`,
        expectedOutput: [
          { region: 'Andina', inflated_lines_usd: 760804.98, inflated_refunds_usd: 97960.53 },
          { region: 'Cono Sur', inflated_lines_usd: 813938.92, inflated_refunds_usd: 83219.55 },
          { region: 'Iberia', inflated_lines_usd: 522629.97, inflated_refunds_usd: 53504.41 },
          { region: 'Norteamérica', inflated_lines_usd: 322382.62, inflated_refunds_usd: 33874.97 },
        ],
      },
      {
        label: 'Paso 2 — Solución: preagregación al grano de order_id antes de exponer al componente',
        explanation: 'Al colapsar `order_items` y `refunds` al grano exacto de `order_id` en CTEs separadas (o en modelos intermedios de Rill/Evidence), eliminamos el abanico cruzado. En `Andina`, el subtotal de líneas vuelve a su valor real (`747,325.56 USD`), las devoluciones quedan en `43,155.37 USD` y el ingreso neto de líneas resulta `704,170.19 USD`.',
        code: `WITH lines_by_order AS (
  SELECT
    order_id,
    SUM(line_total_usd) AS lines_usd
  FROM order_items
  GROUP BY order_id
),
refunds_by_order AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS refunds_usd
  FROM refunds
  WHERE status = 'processed'
  GROUP BY order_id
)
SELECT
  s.region,
  ROUND(SUM(l.lines_usd), 2) AS clean_lines_usd,
  ROUND(COALESCE(SUM(r.refunds_usd), 0), 2) AS clean_refunds_usd,
  ROUND(SUM(l.lines_usd) - COALESCE(SUM(r.refunds_usd), 0), 2) AS net_revenue_usd
FROM orders o
JOIN stores s ON s.store_id = o.store_id
JOIN lines_by_order l ON l.order_id = o.order_id
LEFT JOIN refunds_by_order r ON r.order_id = o.order_id
WHERE o.status = 'completed'
  AND EXTRACT(YEAR FROM o.order_date) = 2024
GROUP BY s.region
ORDER BY s.region ASC;`,
        expectedOutput: [
          {
            region: 'Andina',
            clean_lines_usd: 747325.56,
            clean_refunds_usd: 43155.37,
            net_revenue_usd: 704170.19,
          },
          {
            region: 'Cono Sur',
            clean_lines_usd: 802885.68,
            clean_refunds_usd: 36387.51,
            net_revenue_usd: 766498.17,
          },
          {
            region: 'Iberia',
            clean_lines_usd: 514157.46,
            clean_refunds_usd: 22608.55,
            net_revenue_usd: 491548.91,
          },
          {
            region: 'Norteamérica',
            clean_lines_usd: 317114.94,
            clean_refunds_usd: 14410.83,
            net_revenue_usd: 302704.11,
          },
        ],
      },
    ],
  },

  checks: [
    {
      id: 'chk-bi4-01-dataloader',
      type: 'mcq',
      prompt: '¿Qué ventaja operativa aporta un cargador de datos en tiempo de compilación (data loader en Observable Framework o Evidence) frente a una conexión DirectQuery viva por cada lector?',
      options: [
        {
          id: 'a',
          text: 'Ejecuta la consulta pesada una sola vez al compilar el sitio, materializa una instantánea Parquet estática y delega el filtrado interactivo a DuckDB-Wasm en el navegador sin coste por clic.',
          correct: true,
          feedback: 'Correcto. El data loader desacopla la extracción del almacén en build-time de la exploración sub-segundo en el navegador.',
        },
        {
          id: 'b',
          text: 'Reemplaza el motor SQL por hojas de cálculo locales que el usuario debe actualizar manualmente desde su escritorio antes de abrir el navegador.',
          correct: false,
          feedback: 'Incorrecto. Los cargadores se ejecutan de forma automatizada en el servidor de compilación (CI/CD), sin intervención manual del lector.',
        },
        {
          id: 'c',
          text: 'Obliga a descargar la base de datos transaccional íntegra sin comprimir en formato JSON en cada teléfono móvil.',
          correct: false,
          feedback: 'Incorrecto. Los data loaders preagregan al grano necesario y emiten Parquet columnar comprimido, no JSON transaccional crudo.',
        },
        {
          id: 'd',
          text: 'Desactiva el control de versiones en Git porque los archivos Parquet sustituyen a los archivos de código fuente.',
          correct: false,
          feedback: 'Incorrecto. El código fuente del cargador y las páginas Markdown siguen versionados en Git; el Parquet es solo el artefacto compilado.',
        },
      ],
      explanation: 'Los data loaders corren en tiempo de compilación, generan artefactos Parquet comprimidos y permiten que DuckDB-Wasm resuelva filtros localmente en milisegundos sin golpear el almacén en cada clic.',
    },
    {
      id: 'chk-bi4-01-rill-capas',
      type: 'mcq',
      prompt: 'En un proyecto declarativo de Rill Data, ¿cuál es la responsabilidad específica de los archivos dentro de la carpeta metrics_views/ frente a models/?',
      options: [
        {
          id: 'a',
          text: 'models/ define las transformaciones y preagregaciones en SQL, mientras que metrics_views/ declara en YAML la serie temporal, las dimensiones y las medidas agregadas para el explorador interactivo.',
          correct: true,
          feedback: 'Correcto. Rill separa la preparación tabular en SQL (models/) de la capa semántica declarativa en YAML (metrics_views/).',
        },
        {
          id: 'b',
          text: 'metrics_views/ almacena las credenciales de producción en texto plano y models/ guarda las capturas de pantalla en PNG.',
          correct: false,
          feedback: 'Incorrecto. Las credenciales nunca se guardan en vistas YAML; se inyectan por variables de entorno.',
        },
        {
          id: 'c',
          text: 'Ambos directorios cumplen exactamente la misma función y solo existen por compatibilidad con versiones antiguas de hojas de cálculo.',
          correct: false,
          feedback: 'Incorrecto. Cada carpeta cumple una etapa distinta del grafo declarativo (transformación SQL frente a definición semántica YAML).',
        },
      ],
      explanation: 'Rill estructura el flujo BI-as-code en tres capas explícitas: conectores (`sources/*.yaml`), transformaciones SQL sobre DuckDB (`models/*.sql`) y vistas de métricas semánticas (`metrics_views/*.yaml`).',
    },
    {
      id: 'chk-bi4-01-chasm-trap',
      type: 'predict-output',
      prompt: 'Un pedido (`order_id = 100`) tiene 3 líneas en `order_items` que suman `300 USD` y 2 devoluciones parciales en `refunds` que suman `40 USD`. Si unes `orders`, `order_items` y `refunds` directamente sin preagregar, ¿qué devuelven `SUM(line_total_usd)` y `SUM(refund_amount_usd)`?',
      options: [
        {
          id: 'a',
          text: 'SUM(line_total_usd) devuelve 600 USD (300 × 2 devoluciones) y SUM(refund_amount_usd) devuelve 120 USD (40 × 3 líneas).',
          correct: true,
          feedback: 'Exacto. La relación 1:3 cruzada con 1:2 genera 6 filas (producto cartesiano por pedido), duplicando las líneas y triplicando las devoluciones.',
        },
        {
          id: 'b',
          text: 'SUM(line_total_usd) devuelve 300 USD y SUM(refund_amount_usd) devuelve 40 USD porque el JOIN detecta automáticamente las claves primarias.',
          correct: false,
          feedback: 'Incorrecto. SQL materializa las 6 combinaciones del JOIN antes de evaluar SUM, inflando ambos importes.',
        },
        {
          id: 'c',
          text: 'Ambas sumas devuelven NULL porque DuckDB bloquea dos JOIN consecutivos en la misma consulta.',
          correct: false,
          feedback: 'Incorrecto. La consulta se ejecuta sin error sintáctico, produciendo una inflación silenciosa de datos.',
        },
      ],
      explanation: 'Cruzar dos tablas detalle (1:N y 1:M) contra la misma cabecera sin preagregar antes por `order_id` produce una trampa de abismo que multiplica los importes de cada lado por la cardinalidad del otro.',
    },
  ],

  practice: {
    type: 'sql',
    title: 'Cargador de datos de ingresos netos por tienda física en 2024',
    language: 'sql',
    prompt: 'Construye la consulta del cargador de datos (`ventas_tiendas_fisicas_2024.sql`) para un tablero de Observable Framework de Mercado Brisa. Para cada tienda física (`store_type IN (\'flagship\', \'retail\')`) con órdenes completadas (`o.status = \'completed\'`) durante el año `2024`, devuelve: `store_code`, `store_name`, `region`, `completed_orders` (conteo de órdenes completadas), `gross_revenue_usd` (`ROUND(SUM(o.subtotal_usd - o.discount_usd), 2)`), `refunded_usd` (`ROUND(COALESCE(SUM(r.refund_usd), 0), 2)` a partir de las devoluciones con `status = \'processed\'` preagregadas por `order_id`) y `net_revenue_usd` (`ROUND(gross_revenue_usd - refunded_usd, 2)`). Ordena por `net_revenue_usd DESC, store_code ASC`.',
    starterCode: `-- Preagrega refunds por order_id antes de unir con orders y stores
WITH refunds_by_order AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS refund_usd
  FROM refunds
  -- Falta filtrar solo devoluciones procesadas
  GROUP BY order_id
)
SELECT
  s.store_code,
  s.store_name,
  s.region,
  COUNT(o.order_id) AS completed_orders,
  ROUND(SUM(o.total_usd), 2) AS gross_revenue_usd,
  ROUND(SUM(r.refund_usd), 2) AS refunded_usd,
  ROUND(SUM(o.total_usd) - SUM(r.refund_usd), 2) AS net_revenue_usd
FROM stores s
JOIN orders o ON o.store_id = s.store_id
LEFT JOIN refunds_by_order r ON r.order_id = o.order_id
WHERE o.status = 'completed'
  AND EXTRACT(YEAR FROM o.order_date) = 2024
GROUP BY s.store_code, s.store_name, s.region
ORDER BY net_revenue_usd DESC, s.store_code ASC;`,
    expected: `WITH refunds_by_order AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS refund_usd
  FROM refunds
  WHERE status = 'processed'
  GROUP BY order_id
)
SELECT
  s.store_code,
  s.store_name,
  s.region,
  COUNT(o.order_id) AS completed_orders,
  ROUND(SUM(o.subtotal_usd - o.discount_usd), 2) AS gross_revenue_usd,
  ROUND(COALESCE(SUM(r.refund_usd), 0), 2) AS refunded_usd,
  ROUND(SUM(o.subtotal_usd - o.discount_usd) - COALESCE(SUM(r.refund_usd), 0), 2) AS net_revenue_usd
FROM stores s
JOIN orders o ON o.store_id = s.store_id
LEFT JOIN refunds_by_order r ON r.order_id = o.order_id
WHERE s.store_type IN ('flagship', 'retail')
  AND o.status = 'completed'
  AND EXTRACT(YEAR FROM o.order_date) = 2024
GROUP BY s.store_code, s.store_name, s.region
ORDER BY net_revenue_usd DESC, s.store_code ASC;`,
    orderMatters: true,
    hints: [
      'Filtra en la CTE `refunds_by_order` únicamente las devoluciones con `status = \'processed\'` y en la consulta principal filtra `s.store_type IN (\'flagship\', \'retail\')` para excluir los 3 almacenes (`warehouse`).',
      'La venta bruta comercial se calcula como `o.subtotal_usd - o.discount_usd` (no `o.total_usd`, que incluye impuestos y envío).',
      'Tiendas como `STR-ES-02` y `STR-CO-02` no tuvieron devoluciones en 2024; envuelve la suma de `r.refund_usd` con `COALESCE(..., 0)` tanto en `refunded_usd` como en la resta de `net_revenue_usd`.',
    ],
    solution: `WITH refunds_by_order AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS refund_usd
  FROM refunds
  WHERE status = 'processed'
  GROUP BY order_id
)
SELECT
  s.store_code,
  s.store_name,
  s.region,
  COUNT(o.order_id) AS completed_orders,
  ROUND(SUM(o.subtotal_usd - o.discount_usd), 2) AS gross_revenue_usd,
  ROUND(COALESCE(SUM(r.refund_usd), 0), 2) AS refunded_usd,
  ROUND(SUM(o.subtotal_usd - o.discount_usd) - COALESCE(SUM(r.refund_usd), 0), 2) AS net_revenue_usd
FROM stores s
JOIN orders o ON o.store_id = s.store_id
LEFT JOIN refunds_by_order r ON r.order_id = o.order_id
WHERE s.store_type IN ('flagship', 'retail')
  AND o.status = 'completed'
  AND EXTRACT(YEAR FROM o.order_date) = 2024
GROUP BY s.store_code, s.store_name, s.region
ORDER BY net_revenue_usd DESC, s.store_code ASC;`,
    solutionExplanation: 'La CTE preagrega las devoluciones procesadas al grano de `order_id` para evitar duplicar pedidos con más de un reembolso parcial, y `COALESCE` garantiza que tiendas sin devoluciones en 2024 (`STR-ES-02` y `STR-CO-02`) conserven su ingreso neto intacto.',
    expectedOutputTable: [
      {
        store_code: 'STR-AR-01',
        store_name: 'Tienda Palermo Soho',
        region: 'Cono Sur',
        completed_orders: 1271,
        gross_revenue_usd: 426872.11,
        refunded_usd: 18483.68,
        net_revenue_usd: 408388.43,
      },
      {
        store_code: 'STR-PE-01',
        store_name: 'Tienda Miraflores',
        region: 'Andina',
        completed_orders: 919,
        gross_revenue_usd: 334334.36,
        refunded_usd: 15225.68,
        net_revenue_usd: 319108.68,
      },
      {
        store_code: 'STR-CL-02',
        store_name: 'Tienda Las Condes',
        region: 'Cono Sur',
        completed_orders: 451,
        gross_revenue_usd: 195609.15,
        refunded_usd: 10676.73,
        net_revenue_usd: 184932.42,
      },
      {
        store_code: 'STR-CL-01',
        store_name: 'Tienda Providencia',
        region: 'Cono Sur',
        completed_orders: 477,
        gross_revenue_usd: 169782.81,
        refunded_usd: 7227.1,
        net_revenue_usd: 162555.71,
      },
      {
        store_code: 'STR-CO-01',
        store_name: 'Tienda Chapinero Alto',
        region: 'Andina',
        completed_orders: 608,
        gross_revenue_usd: 176434.67,
        refunded_usd: 27929.69,
        net_revenue_usd: 148504.98,
      },
      {
        store_code: 'STR-ES-02',
        store_name: 'Tienda Eixample',
        region: 'Iberia',
        completed_orders: 311,
        gross_revenue_usd: 105569.33,
        refunded_usd: 0,
        net_revenue_usd: 105569.33,
      },
      {
        store_code: 'STR-ES-01',
        store_name: 'Tienda Salamanca',
        region: 'Iberia',
        completed_orders: 336,
        gross_revenue_usd: 118176.55,
        refunded_usd: 22608.55,
        net_revenue_usd: 95568,
      },
      {
        store_code: 'STR-CO-02',
        store_name: 'Tienda El Poblado',
        region: 'Andina',
        completed_orders: 314,
        gross_revenue_usd: 95113.34,
        refunded_usd: 0,
        net_revenue_usd: 95113.34,
      },
      {
        store_code: 'STR-MX-02',
        store_name: 'Tienda Polanco Sur',
        region: 'Norteamérica',
        completed_orders: 211,
        gross_revenue_usd: 87436.75,
        refunded_usd: 6094.48,
        net_revenue_usd: 81342.27,
      },
      {
        store_code: 'STR-MX-01',
        store_name: 'Tienda Reforma Norte',
        region: 'Norteamérica',
        completed_orders: 237,
        gross_revenue_usd: 72064.79,
        refunded_usd: 3016.64,
        net_revenue_usd: 69048.15,
      },
      {
        store_code: 'STR-MX-03',
        store_name: 'Tienda Chapultepec',
        region: 'Norteamérica',
        completed_orders: 230,
        gross_revenue_usd: 64554.25,
        refunded_usd: 1662.12,
        net_revenue_usd: 62892.13,
      },
    ],
  },

  roleNotes: {
    de: 'Expón vistas o tablas Oro particionadas y con contrato de esquema estable para que los data loaders de Evidence y Observable Framework extraigan instantáneas Parquet en compilación sin escanear tablas crudas.',
    da: 'En páginas Markdown de Evidence, define una consulta base limpia al grano requerido y encadénala en los componentes visuales mediante `${consulta_base}` en lugar de duplicar lógica SQL en cada gráfico.',
    bi: 'Aplica las mismas reglas de grano del modelo en estrella al escribir SQL declarativo: preagrega cada tabla de hechos a la clave común antes de unirla para impedir abanicos entre líneas y reembolsos.',
  },

  summary: [
    'Evidence, Observable Framework y Rill reemplazan archivos binarios por definiciones en Markdown, SQL y YAML versionadas en Git.',
    'Los cargadores de datos (data loaders) materializan instantáneas Parquet en compilación para que DuckDB-Wasm responda en milisegundos en el navegador.',
    'Cruzar múltiples tablas de hechos en un bloque SQL sin preagregar por clave común provoca trampas de abismo y duplica importes.',
    'Preagregar devoluciones y líneas por order_id en CTEs separadas garantiza métricas exactas antes de renderizar componentes visuales.',
  ],

  flashcards: [
    {
      id: 'fc-bi4-01-a',
      front: '¿Qué es un data loader en Observable Framework?',
      back: 'Es un script o consulta que se ejecuta en tiempo de compilación (build-time) para generar una instantánea estática (como un archivo Parquet) que el navegador consulta localmente con DuckDB-Wasm.',
    },
    {
      id: 'fc-bi4-01-b',
      front: '¿Cómo funciona el encadenamiento de consultas (Universal SQL) en Evidence?',
      back: 'Permite que un bloque SQL dentro de una página Markdown consulte el resultado de otro bloque SQL previo referenciándolo como `${nombre_bloque}` sobre DuckDB-Wasm.',
    },
    {
      id: 'fc-bi4-01-c',
      front: '¿Qué tres carpetas estructuran un proyecto declarativo en Rill Data?',
      back: '`sources/` (conectores de ingesta en YAML), `models/` (transformaciones SQL en DuckDB) y `metrics_views/` (definición YAML de dimensiones y medidas).',
    },
    {
      id: 'fc-bi4-01-d',
      front: '¿Por qué ocurre una trampa de abismo al unir orders, order_items y refunds en un solo SELECT?',
      back: 'Porque `order_items` (1:N) y `refunds` (1:M) son relaciones independientes hacia `orders`; unirlas sin preagregar por `order_id` multiplica las filas de ambas tablas entre sí.',
    },
  ],

  glossaryTerms: [
    'c26-bi-as-code',
    'c16-duckdb-wasm-bi',
    'bi-data-loader',
    'c01-grain-fanout',
  ],

  sources: [
    {
      title: 'Evidence Documentation — Core Concepts: SQL Queries',
      url: 'https://docs.evidence.dev/core-concepts/queries/',
      publisher: 'Evidence',
      accessed: '2026-10-29',
      supports: 'Sintaxis de bloques SQL en Markdown, encadenamiento de consultas y ejecución en el cliente sobre DuckDB-Wasm.',
    },
    {
      title: 'Observable Framework — Static site generator for data apps',
      url: 'https://github.com/observablehq/framework',
      publisher: 'Observable',
      accessed: '2026-10-29',
      supports: 'Arquitectura de data loaders en tiempo de compilación e instantáneas estáticas en Parquet y Arrow.',
    },
    {
      title: 'Rill Data Documentation — Rill Developer & Metrics Views',
      url: 'https://docs.rilldata.com/',
      publisher: 'Rill Data',
      accessed: '2026-10-29',
      supports: 'Modelado declarativo con fuentes YAML, modelos SQL y vistas de métricas sobre DuckDB.',
    },
    {
      title: 'DuckDB Documentation — DuckDB-Wasm Client Overview',
      url: 'https://duckdb.org/docs/stable/clients/wasm/overview.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Ejecución analítica vectorizada en WebAssembly dentro del navegador sobre archivos Parquet.',
    },
  ],

  aiNotes: 'Al guiar esta lección en Mercado Brisa, enfatiza por qué unir `orders`, `order_items` y `refunds` sin preagregar infla `Andina` en 2024 (`97,960.53 USD` vs `43,155.37 USD` reales en devoluciones). En la práctica SQL, verifica que filtren `store_type IN (\'flagship\', \'retail\')`, usen `subtotal_usd - discount_usd` y apliquen `COALESCE` para tiendas sin devoluciones (`STR-ES-02` y `STR-CO-02`).',
};

export default lesson;
