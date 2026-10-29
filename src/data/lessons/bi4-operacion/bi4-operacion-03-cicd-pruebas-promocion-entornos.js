export const lesson = {
  id: 'bi4-operacion-03-cicd-pruebas-promocion-entornos',
  moduleId: 'bi4-operacion',
  tracks: ['bi'],
  level: 4,
  order: 3,
  title: 'CI/CD en BI: pruebas de consultas y promoción de entornos',
  subtitle: 'Integración y despliegue continuo (CI/CD): pruebas automáticas de consultas y promoción de entornos',
  minutes: 25,
  prerequisites: [
    'bi4-operacion-02-pbip-tmdl-versionado-git',
    'de3-transformacion-03-contracts-semantic-layer',
  ],
  contentVersion: 1,

  hook: 'Un viernes por la tarde, un desarrollador fusiona una rama en el repositorio de BI de Mercado Brisa y publica el modelo en el espacio de trabajo de producción. El lunes, finanzas detecta que el importe cobrado (`payments`) supera en más de 73,000 USD al total facturado (`orders`) de 2024 porque alguien unió la tabla de pagos sin deduplicar reintentos capturados; además, una medida quedó apuntando al esquema de pruebas. ¿Cómo construir un pipeline CI/CD que bloquee errores de metadatos, ejecute pruebas automáticas de reconciliación numérica y promueva entre entornos con reglas parametrizadas?',

  objectives: [
    'Diseñar las tres puertas de un pipeline de integración continua (CI) para BI: validación sintáctica TMDL, análisis estático con Best Practice Analyzer (BPA) y pruebas de reconciliación SQL.',
    'Escribir consultas de reconciliación semántica que detecten discrepancias de grano entre cabeceras de pedido, líneas de detalle e intentos de cobro.',
    'Configurar la promoción continua (CD) entre los entornos Dev, Test y Prod mediante reglas de despliegue y parámetros de conexión.',
  ],

  sections: [
    {
      id: 'puertas-calidad-ci-bpa-reconciliacion',
      heading: 'Las tres puertas de calidad en un pipeline de integración continua',
      body: 'Guardar archivos `.tmdl` o páginas Markdown en Git es solo el primer paso. Sin verificaciones automáticas en cada Pull Request, los errores humanos llegan hasta el comité ejecutivo. Un pipeline de **integración continua (CI)** para BI ejecuta tres puertas secuenciales antes de fusionar a la rama principal.\n\nLa primera puerta valida la sintaxis y las referencias del modelo semántico y del reporte PBIR. Así comprueba que ningún gráfico apunte a una medida o columna borrada. La segunda puerta ejecuta el **Best Practice Analyzer (BPA)** desde línea de comandos (`TabularEditor.exe ... -A bpa-rules.json -V`). El build falla si existen claves foráneas visibles, sumas implícitas activas o medidas sin formato. La tercera puerta corre **pruebas de reconciliación semántica** sobre datos deterministas en DuckDB para confirmar que los totales cuadran al centavo.',
      example: {
        language: 'sql',
        code: `WITH lines_by_order AS (
  SELECT
    order_id,
    SUM(line_total_usd) AS lines_usd
  FROM order_items
  GROUP BY order_id
)
SELECT
  c.year,
  COUNT(o.order_id) AS completed_orders,
  ROUND(SUM(o.subtotal_usd), 2) AS header_subtotal_usd,
  ROUND(SUM(l.lines_usd), 2) AS lines_subtotal_usd,
  ROUND(SUM(o.subtotal_usd) - SUM(l.lines_usd), 2) AS drift_usd
FROM orders o
JOIN calendar c ON c.calendar_date = o.order_date
JOIN lines_by_order l ON l.order_id = o.order_id
WHERE o.status = 'completed'
GROUP BY c.year
ORDER BY c.year ASC;`,
        expectedOutput: [
          {
            year: 2023,
            completed_orders: 1981,
            header_subtotal_usd: 741978.25,
            lines_subtotal_usd: 741978.25,
            drift_usd: 0,
          },
          {
            year: 2024,
            completed_orders: 6497,
            header_subtotal_usd: 2381483.64,
            lines_subtotal_usd: 2381483.64,
            drift_usd: 0,
          },
          {
            year: 2025,
            completed_orders: 6282,
            header_subtotal_usd: 2340689.29,
            lines_subtotal_usd: 2340689.29,
            drift_usd: 0,
          },
        ],
      },
    },
    {
      id: 'reglas-estaticas-bpa-linea-comandos',
      heading: 'Automatización de reglas estáticas BPA en GitHub Actions o Azure DevOps',
      body: 'Revisar a mano cientos de columnas e indicadores en cada Pull Request consume horas y deja pasar descuidos. El archivo `bpa-rules.json` codifica los estándares del equipo como expresiones dinámicas. Estas reglas inspeccionan el árbol de metadatos del modelo tabular en segundos.\n\nPor ejemplo, una regla de severidad alta (`Error`) comprueba que toda columna terminada en `_id` tenga `IsHidden == true` y `SummarizeBy == "None"`. Otra regla exige que toda medida visible posea `FormatString` y `Description` no vacíos. En el flujo de CI, el ejecutor carga la carpeta `*.SemanticModel/definition` y evalúa el lote de reglas. Si aparece al menos una infracción de nivel error, la fusión se bloquea y el autor recibe el listado de objetos por corregir.',
      example: {
        language: 'yaml',
        code: `name: bi-ci-validation
on:
  pull_request:
    paths:
      - 'Comite.SemanticModel/**'
      - 'pages/**'
      - 'ci/**'

jobs:
  validate-semantic-model:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Ejecutar reglas estáticas BPA sobre TMDL
        run: |
          tabular-editor "Comite.SemanticModel/definition" -A ci/bpa-rules.json -V -W
      - name: Ejecutar aserciones SQL de reconciliación sobre Mercado Brisa
        run: |
          node ci/run-reconciliation-tests.mjs`,
      },
    },
    {
      id: 'promocion-entornos-reglas-despliegue',
      heading: 'Promoción entre entornos (Dev, Test, Prod) con parámetros de conexión',
      body: 'Cuando el Pull Request supera las puertas de CI y se fusiona en `main`, se activa el **despliegue continuo (CD)**. La regla principal en la promoción entre entornos es la inmutabilidad del artefacto. Jamás se abre un reporte para cambiar a mano la ruta del almacén antes de publicar a producción.\n\nEn plataformas como Microsoft Fabric Deployment Pipelines o flujos con Git, el modelo define **parámetros de expresión** (`ServerEndpoint`, `DatabaseName` o `StorageAccountUrl`) en `expressions.tmdl`. Al promover el artefacto desde `Development` hacia `Test` y luego a `Production`, las **reglas de despliegue** (*deployment rules*) inyectan el valor de cada etapa. De este modo se dispara un refresco controlado sin alterar el código fuente en Git.',
    },
  ],

  workedExample: {
    title: 'Detección en CI de cobros duplicados al cruzar orders con payments',
    description: 'Un analista añade al modelo semántico la tabla `payments` (filtrada por `status = \'captured\'`) para reportar la recaudación efectiva frente a `orders.total_usd` en pedidos completados (`o.status = \'completed\'`). Antes de promover el cambio de `Dev` a `Test`, ejecutamos una prueba de reconciliación en CI.',
    steps: [
      {
        label: 'Paso 1 — Antipatrón: prueba ingenua que une orders y payments sin verificar multiplicidad',
        explanation: 'Si la prueba une directamente `orders` y `payments` (`status = \'captured\'`) y compara `SUM(o.total_usd)` contra `SUM(p.amount_usd)` dentro de la misma consulta unida, ambas columnas se duplican en los pedidos que tuvieron un segundo intento capturado (`attempt_number = 2`). En 2024 aparecen `6,669` filas en lugar de `6,497` órdenes, y la diferencia aparente da `0`, ocultando que el total facturado se infló de `2,731,516.50 USD` a `2,805,466.48 USD`.',
        code: `SELECT
  c.year,
  COUNT(o.order_id) AS rows_joined,
  ROUND(SUM(o.total_usd), 2) AS inflated_order_total_usd,
  ROUND(SUM(p.amount_usd), 2) AS captured_payments_usd,
  ROUND(SUM(p.amount_usd) - SUM(o.total_usd), 2) AS apparent_diff_usd
FROM orders o
JOIN calendar c ON c.calendar_date = o.order_date
JOIN payments p ON p.order_id = o.order_id
WHERE o.status = 'completed'
  AND p.status = 'captured'
GROUP BY c.year
ORDER BY c.year ASC;`,
        expectedOutput: [
          {
            year: 2023,
            rows_joined: 2016,
            inflated_order_total_usd: 868308.43,
            captured_payments_usd: 868308.43,
            apparent_diff_usd: 0,
          },
          {
            year: 2024,
            rows_joined: 6669,
            inflated_order_total_usd: 2805466.48,
            captured_payments_usd: 2805466.48,
            apparent_diff_usd: 0,
          },
          {
            year: 2025,
            rows_joined: 6444,
            inflated_order_total_usd: 2749741.43,
            captured_payments_usd: 2749741.43,
            apparent_diff_usd: 0,
          },
        ],
      },
      {
        label: 'Paso 2 — Solución: preagregar payments por order_id para exponer los cobros duplicados en CI',
        explanation: 'Al preagregar `payments` (`status = \'captured\'`) al grano de `order_id` antes de comparar con `orders`, la prueba de CI revela que en 2024 existen `172` órdenes completadas con doble cobro capturado (`capture_count > 1`), generando un exceso real de `73,949.98 USD` (`2,805,466.48 USD` cobrados frente a `2,731,516.50 USD` facturados).',
        code: `WITH captured_by_order AS (
  SELECT
    order_id,
    COUNT(*) AS capture_count,
    SUM(amount_usd) AS captured_usd
  FROM payments
  WHERE status = 'captured'
  GROUP BY order_id
)
SELECT
  c.year,
  COUNT(o.order_id) AS completed_orders,
  SUM(CASE WHEN p.capture_count > 1 THEN 1 ELSE 0 END) AS duplicate_capture_orders,
  ROUND(SUM(o.total_usd), 2) AS expected_total_usd,
  ROUND(SUM(p.captured_usd), 2) AS actual_captured_usd,
  ROUND(SUM(p.captured_usd) - SUM(o.total_usd), 2) AS overcaptured_diff_usd
FROM orders o
JOIN calendar c ON c.calendar_date = o.order_date
JOIN captured_by_order p ON p.order_id = o.order_id
WHERE o.status = 'completed'
GROUP BY c.year
ORDER BY c.year ASC;`,
        expectedOutput: [
          {
            year: 2023,
            completed_orders: 1981,
            duplicate_capture_orders: 35,
            expected_total_usd: 851117.35,
            actual_captured_usd: 868308.43,
            overcaptured_diff_usd: 17191.08,
          },
          {
            year: 2024,
            completed_orders: 6497,
            duplicate_capture_orders: 172,
            expected_total_usd: 2731516.5,
            actual_captured_usd: 2805466.48,
            overcaptured_diff_usd: 73949.98,
          },
          {
            year: 2025,
            completed_orders: 6282,
            duplicate_capture_orders: 162,
            expected_total_usd: 2686828.57,
            actual_captured_usd: 2749741.43,
            overcaptured_diff_usd: 62912.86,
          },
        ],
      },
    ],
  },

  checks: [
    {
      id: 'chk-bi4-03-bpa-role',
      type: 'mcq',
      prompt: '¿Qué tipo de defectos detecta automáticamente el Best Practice Analyzer (BPA) al ejecutarse sobre la carpeta .SemanticModel/definition en un pipeline de integración continua?',
      options: [
        {
          id: 'a',
          text: 'Defectos estructurales y de metadatos en el modelo tabular, como claves foráneas sin ocultar con suma implícita activa, medidas sin cadena de formato o relaciones bidireccionales riesgosas.',
          correct: true,
          feedback: 'Correcto. BPA inspecciona el modelo de objetos tabulares (TMDL/TOM) en busca de violaciones de reglas estáticas.',
        },
        {
          id: 'b',
          text: 'Errores ortográficos en los correos electrónicos enviados por el equipo de soporte al cliente.',
          correct: false,
          feedback: 'Incorrecto. BPA solo analiza los metadatos del modelo semántico tabular.',
        },
        {
          id: 'c',
          text: 'La latencia de red Wi-Fi del teléfono móvil de cada usuario final.',
          correct: false,
          feedback: 'Incorrecto. La evaluación de BPA es estática en tiempo de compilación/CI, no un monitor de red del cliente.',
        },
      ],
      explanation: 'El motor Best Practice Analyzer evalúa reglas declarativas sobre los metadatos del modelo tabular (TMDL) en segundos durante el pipeline de integración continua.',
    },
    {
      id: 'chk-bi4-03-deployment-rules',
      type: 'mcq',
      prompt: 'Al promover un modelo semántico desde el entorno Test hacia Production en un pipeline de despliegue continuo, ¿cómo debe cambiarse el origen de datos para apuntar al almacén productivo?',
      options: [
        {
          id: 'a',
          text: 'Mediante parámetros de expresión y reglas de despliegue (deployment rules) del pipeline, sin editar manualmente los archivos fuente versionados en Git.',
          correct: true,
          feedback: 'Correcto. Los parámetros y reglas de despliegue inyectan el origen correspondiente a cada etapa sin mutar el código fuente.',
        },
        {
          id: 'b',
          text: 'Abriendo el archivo en Power BI Desktop, cambiando la cadena de conexión a mano y subiendo un archivo .pbix nuevo directamente a producción sin pasar por Git.',
          correct: false,
          feedback: 'Incorrecto. Editar a mano antes de publicar a producción rompe la inmutabilidad del artefacto y la trazabilidad en Git.',
        },
        {
          id: 'c',
          text: 'Usando la misma base de datos de desarrollo para producción con el fin de ahorrar configuraciones.',
          correct: false,
          feedback: 'Incorrecto. Mezclar datos de pruebas con producción viola el aislamiento entre entornos.',
        },
      ],
      explanation: 'Las reglas de despliegue reasignan los parámetros de conexión por etapa (`Dev -> Test -> Prod`) preservando la inmutabilidad del código revisado en Git.',
    },
    {
      id: 'chk-bi4-03-reconciliation-grain',
      type: 'predict-output',
      prompt: 'En Mercado Brisa, para los `6,497` pedidos completados de 2024, `SUM(orders.subtotal_usd)` vale `2,381,483.64 USD`. Si preagregas `order_items` por `order_id` calculando `SUM(line_total_usd)`, ¿cuánto vale la diferencia `header_subtotal_usd - lines_subtotal_usd`?',
      options: [
        {
          id: 'a',
          text: 'Vale exactamente 0.00 USD porque en Mercado Brisa el subtotal_usd de cabecera coincide al centavo con la suma de line_total_usd de sus líneas.',
          correct: true,
          feedback: 'Exacto. La invariante contable de subtotal entre cabecera y líneas se cumple con deriva 0.00 USD.',
        },
        {
          id: 'b',
          text: 'Vale -26,856.93 USD porque line_total_usd incluye el impuesto al valor agregado.',
          correct: false,
          feedback: 'Incorrecto. Los -26,856.93 USD aparecen solo si restas erróneamente orders.discount_usd de un lado sin considerar que line_total_usd equivale a subtotal_usd.',
        },
        {
          id: 'c',
          text: 'Da un error de división por cero porque 2024 no tiene líneas de pedido.',
          correct: false,
          feedback: 'Incorrecto. El año 2024 cuenta con 6,497 pedidos completados y todas sus líneas cuadran con subtotal_usd.',
        },
      ],
      explanation: 'En el esquema de Mercado Brisa, `orders.subtotal_usd` es idéntico a la suma de `order_items.line_total_usd` (`2,381,483.64 USD` en 2024), mientras que `orders.discount_usd` registra cupones adicionales de cabecera.',
    },
  ],

  practice: {
    type: 'sql',
    title: 'Prueba de reconciliación CI entre cabecera y líneas de pedido por región',
    language: 'sql',
    prompt: 'Escribe la consulta de auditoría de reconciliación para el pipeline de CI (`ci/reconcile_2024.sql`) sobre los pedidos completados (`o.status = \'completed\'`) en `2024` desglosados por `region` (`stores.region`). Preagrega primero `order_items` por `order_id` para obtener `lines_subtotal_usd` (`SUM(line_total_usd)`) y `lines_discount_usd` (`SUM(discount_usd)`). Luego únelo con `orders` y `stores` para devolver por `region`: `completed_orders` (`COUNT(o.order_id)`), `header_subtotal_usd` (`ROUND(SUM(o.subtotal_usd), 2)`), `lines_subtotal_usd` (`ROUND(SUM(l.lines_subtotal_usd), 2)`), `header_discount_usd` (`ROUND(SUM(o.discount_usd), 2)`), `lines_discount_usd` (`ROUND(SUM(l.lines_discount_usd), 2)`) y `discount_drift_usd` (`ROUND(SUM(o.discount_usd) - SUM(l.lines_discount_usd), 2)`). Ordena por `region ASC`.',
    starterCode: `-- Prueba de reconciliación CI entre orders y order_items en 2024 por región
WITH lines_by_order AS (
  SELECT
    order_id,
    SUM(line_total_usd) AS lines_subtotal_usd,
    SUM(discount_usd) AS lines_discount_usd
  FROM order_items
  GROUP BY order_id
)
SELECT
  s.region,
  COUNT(o.order_id) AS completed_orders,
  ROUND(SUM(o.subtotal_usd), 2) AS header_subtotal_usd,
  ROUND(SUM(l.lines_subtotal_usd), 2) AS lines_subtotal_usd,
  ROUND(SUM(o.discount_usd), 2) AS header_discount_usd,
  ROUND(SUM(l.lines_discount_usd), 2) AS lines_discount_usd,
  ROUND(SUM(o.subtotal_usd) - SUM(l.lines_subtotal_usd), 2) AS discount_drift_usd
FROM orders o
JOIN stores s ON s.store_id = o.store_id
JOIN lines_by_order l ON l.order_id = o.order_id
WHERE EXTRACT(YEAR FROM o.order_date) = 2024
GROUP BY s.region
ORDER BY s.region ASC;`,
    expected: `WITH lines_by_order AS (
  SELECT
    order_id,
    SUM(line_total_usd) AS lines_subtotal_usd,
    SUM(discount_usd) AS lines_discount_usd
  FROM order_items
  GROUP BY order_id
)
SELECT
  s.region,
  COUNT(o.order_id) AS completed_orders,
  ROUND(SUM(o.subtotal_usd), 2) AS header_subtotal_usd,
  ROUND(SUM(l.lines_subtotal_usd), 2) AS lines_subtotal_usd,
  ROUND(SUM(o.discount_usd), 2) AS header_discount_usd,
  ROUND(SUM(l.lines_discount_usd), 2) AS lines_discount_usd,
  ROUND(SUM(o.discount_usd) - SUM(l.lines_discount_usd), 2) AS discount_drift_usd
FROM orders o
JOIN stores s ON s.store_id = o.store_id
JOIN lines_by_order l ON l.order_id = o.order_id
WHERE o.status = 'completed'
  AND EXTRACT(YEAR FROM o.order_date) = 2024
GROUP BY s.region
ORDER BY s.region ASC;`,
    orderMatters: true,
    hints: [
      'En el `WHERE` falta filtrar únicamente los pedidos con `o.status = \'completed\'`.',
      'Observa que `header_subtotal_usd` y `lines_subtotal_usd` coinciden al centavo (`747,325.56` en Andina), porque `line_total_usd` ya tiene descontado el descuento de línea.',
      'Calcula la última columna `discount_drift_usd` como la diferencia entre los descuentos: `ROUND(SUM(o.discount_usd) - SUM(l.lines_discount_usd), 2)`.',
    ],
    solution: `WITH lines_by_order AS (
  SELECT
    order_id,
    SUM(line_total_usd) AS lines_subtotal_usd,
    SUM(discount_usd) AS lines_discount_usd
  FROM order_items
  GROUP BY order_id
)
SELECT
  s.region,
  COUNT(o.order_id) AS completed_orders,
  ROUND(SUM(o.subtotal_usd), 2) AS header_subtotal_usd,
  ROUND(SUM(l.lines_subtotal_usd), 2) AS lines_subtotal_usd,
  ROUND(SUM(o.discount_usd), 2) AS header_discount_usd,
  ROUND(SUM(l.lines_discount_usd), 2) AS lines_discount_usd,
  ROUND(SUM(o.discount_usd) - SUM(l.lines_discount_usd), 2) AS discount_drift_usd
FROM orders o
JOIN stores s ON s.store_id = o.store_id
JOIN lines_by_order l ON l.order_id = o.order_id
WHERE o.status = 'completed'
  AND EXTRACT(YEAR FROM o.order_date) = 2024
GROUP BY s.region
ORDER BY s.region ASC;`,
    solutionExplanation: 'La consulta preagrega `order_items` por `order_id`, filtra pedidos completados de 2024 y demuestra que mientras los subtotales cuadran exactamente (`747,325.56 = 747,325.56` en `Andina`), los descuentos de cabecera y de línea difieren en cada región.',
    expectedOutputTable: [
      {
        region: 'Andina',
        completed_orders: 2154,
        header_subtotal_usd: 747325.56,
        lines_subtotal_usd: 747325.56,
        header_discount_usd: 7390.52,
        lines_discount_usd: 7636.41,
        discount_drift_usd: -245.89,
      },
      {
        region: 'Cono Sur',
        completed_orders: 2199,
        header_subtotal_usd: 802885.68,
        lines_subtotal_usd: 802885.68,
        header_discount_usd: 10621.61,
        lines_discount_usd: 7735.78,
        discount_drift_usd: 2885.83,
      },
      {
        region: 'Iberia',
        completed_orders: 1232,
        header_subtotal_usd: 514157.46,
        lines_subtotal_usd: 514157.46,
        header_discount_usd: 5157.91,
        lines_discount_usd: 5165.7,
        discount_drift_usd: -7.79,
      },
      {
        region: 'Norteamérica',
        completed_orders: 912,
        header_subtotal_usd: 317114.94,
        lines_subtotal_usd: 317114.94,
        header_discount_usd: 3686.89,
        lines_discount_usd: 3066.6,
        discount_drift_usd: 620.29,
      },
    ],
  },

  roleNotes: {
    de: 'Mantén un conjunto de datos semilla determinista y liviano en Parquet para que el pipeline de CI de BI ejecute sus pruebas de reconciliación en menos de 10 segundos sin conectarse al almacén productivo.',
    da: 'Cuando diseñes una prueba de reconciliación entre dos tablas de distinto grano, preagrega siempre la tabla detallada en una CTE por la clave de negocio antes de restar las métricas.',
    bi: 'Integra el Best Practice Analyzer (BPA) como requisito bloqueante en tus Pull Requests y utiliza parámetros en `expressions.tmdl` junto con reglas de despliegue para promover entre `Dev`, `Test` y `Prod`.',
  },

  summary: [
    'Un pipeline de CI en BI combina validación sintáctica, análisis estático de metadatos (BPA) y pruebas de reconciliación SQL.',
    'El motor Best Practice Analyzer bloquea automáticamente claves foráneas sin ocultar, sumas implícitas y medidas sin formato.',
    'Las pruebas de reconciliación semántica deben preagregar cada tabla de hechos a un grano común antes de evaluar diferencias.',
    'La promoción continua entre Dev, Test y Prod inyecta parámetros de conexión mediante reglas de despliegue sin tocar el código fuente.',
  ],

  flashcards: [
    {
      id: 'fc-bi4-03-a',
      front: '¿Qué tres validaciones componen un pipeline de integración continua (CI) para un proyecto BI como código?',
      back: '1) Validación sintáctica y de referencias PBIR/TMDL, 2) análisis estático de metadatos con reglas BPA, y 3) pruebas automatizadas de reconciliación numérica en SQL.',
    },
    {
      id: 'fc-bi4-03-b',
      front: '¿Por qué una prueba CI que compara SUM(orders.total_usd) contra SUM(payments.amount_usd) en un JOIN directo puede dar un falso positivo?',
      back: 'Porque los pedidos con más de un cobro capturado duplican la fila de `orders` en el `JOIN`, inflando `SUM(orders.total_usd)` al mismo ritmo que `payments`.',
    },
    {
      id: 'fc-bi4-03-c',
      front: '¿Cómo se evita editar archivos .tmdl manualmente al promover un modelo de Test a Production?',
      back: 'Declarando parámetros de conexión en `expressions.tmdl` y aplicando reglas de despliegue (deployment rules) en el pipeline de promoción.',
    },
    {
      id: 'fc-bi4-03-d',
      front: 'En Mercado Brisa, ¿por qué difieren orders.discount_usd y SUM(order_items.discount_usd) aunque orders.subtotal_usd coincide exactamente con SUM(order_items.line_total_usd)?',
      back: 'Porque `order_items.line_total_usd` ya deduce el descuento de línea (`order_items.discount_usd`), mientras que `orders.discount_usd` registra cupones o descuentos adicionales aplicados a la cabecera del pedido.',
    },
  ],

  glossaryTerms: [
    'bpa-static-analysis',
    'deployment-pipeline-bi',
    'semantic-reconciliation-test',
    'c19-data-contracts-odcs',
  ],

  sources: [
    {
      title: 'Microsoft Learn — CI/CD best practices in Microsoft Fabric',
      url: 'https://learn.microsoft.com/en-us/fabric/cicd/best-practices-cicd',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Separación de entornos Dev, Test y Prod, parametrización y puertas de calidad automatizadas.',
    },
    {
      title: 'Microsoft Learn — Power BI Desktop projects Azure DevOps build pipelines',
      url: 'https://learn.microsoft.com/en-us/power-bi/developer/projects/projects-azdo',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Ejecución de Tabular Editor CLI y reglas de validación estática sobre proyectos PBIP en CI.',
    },
    {
      title: 'Tabular Editor Documentation — Best Practice Analyzer',
      url: 'https://docs.tabulareditor.com/te2/Best-Practice-Analyzer.html',
      publisher: 'Tabular Editor',
      accessed: '2026-10-29',
      supports: 'Evaluación automatizada de reglas sobre metadatos tabulares.',
    },
    {
      title: 'Microsoft Learn — Introduction to deployment pipelines in Microsoft Fabric',
      url: 'https://learn.microsoft.com/en-us/fabric/cicd/deployment-pipelines/intro-to-deployment-pipelines',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Promoción entre etapas y reglas de despliegue para reasignar orígenes de datos.',
    },
  ],

  aiNotes: 'Resalta la diferencia entre el falso positivo del Paso 1 (`apparent_diff_usd = 0` por duplicar `orders` al unir con `payments`) y la preagregación del Paso 2 que destapa las `172` órdenes con doble captura en 2024 (`73,949.98 USD`). En la práctica SQL, verifica que filtren `o.status = \'completed\'` y calculen `discount_drift_usd` restando `SUM(l.lines_discount_usd)` de `SUM(o.discount_usd)`.',
};

export default lesson;
