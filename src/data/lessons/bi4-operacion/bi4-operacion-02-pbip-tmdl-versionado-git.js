export const lesson = {
  id: 'bi4-operacion-02-pbip-tmdl-versionado-git',
  moduleId: 'bi4-operacion',
  tracks: ['bi'],
  level: 4,
  order: 2,
  title: 'Proyectos Power BI (PBIP) y lenguaje TMDL en Git',
  subtitle: 'Proyectos Power BI (PBIP) y lenguaje TMDL: revisión de modelos y medidas en Git',
  minutes: 25,
  prerequisites: [
    'bi4-operacion-01-bi-como-codigo-evidence-observable-rill',
    'bi2-dax-01-contexto-fila-filtro',
  ],
  contentVersion: 1,

  hook: 'En Mercado Brisa aparece en una carpeta compartida el archivo `Ventas_Regionales_v9_FINAL_corregido2.pbix` de 185 MB. Cuando el margen bruto de la categoría Molinos cae repentinamente en el reporte ejecutivo, nadie sabe si alguien editó la medida DAX, cambió una relación a bidireccional o alteró una consulta Power Query, porque Git trata el archivo `.pbix` como un bloque binario opaco. ¿Cómo descomponer el modelo y el reporte en archivos de texto TMDL y PBIR para auditar cada línea de DAX en un Pull Request antes de fusionar a producción?',

  objectives: [
    'Descomponer un artefacto Power BI en un proyecto PBIP separando la definición visual (.Report / PBIR) del modelo tabular (.SemanticModel / TMDL).',
    'Configurar el archivo .gitignore para excluir cachés binarias de VertiPaq (cache.abf) y ajustes locales (localSettings.json) del repositorio.',
    'Auditar cambios en medidas DAX dentro de archivos tables/*.tmdl durante un Pull Request contrastando su lógica contra consultas SQL de verificación.',
  ],

  sections: [
    {
      id: 'de-pbix-binario-a-pbip-texto-plano',
      heading: 'De archivos binarios .pbix a carpetas de proyecto PBIP',
      body: 'Un archivo `.pbix` tradicional es un contenedor ZIP comprimido. Adentro empaqueta los metadatos del modelo, el diseño visual y los datos en memoria de VertiPaq (`DataModel`). Para Git, ese archivo es un bloque binario indivisible. Cualquier cambio visual obliga a subir cientos de megabytes otra vez e impide comparar dos ramas.\n\nEl formato **Power BI Project** (`.pbip`) resuelve este límite guardando el proyecto como un árbol de archivos en texto plano. El proyecto se divide en dos carpetas hermanas. La carpeta `*.Report/definition/` emplea el formato **PBIR** para guardar páginas, objetos visuales y marcadores en archivos JSON modulares. La carpeta `*.SemanticModel/definition/` almacena el modelo tabular usando **TMDL** (*Tabular Model Definition Language*). Para mantener el repositorio liviano, el archivo `.gitignore` debe excluir siempre `**/.pbi/localSettings.json` y `**/.pbi/cache.abf`.',
      example: {
        language: 'sql',
        code: `WITH refunds_by_order AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS refund_usd
  FROM refunds
  WHERE status = 'processed'
  GROUP BY order_id
)
SELECT
  s.store_type,
  COUNT(o.order_id) AS completed_orders,
  ROUND(SUM(o.subtotal_usd - o.discount_usd), 2) AS gross_sales_usd,
  ROUND(COALESCE(SUM(r.refund_usd), 0), 2) AS refunds_usd,
  ROUND(SUM(o.subtotal_usd - o.discount_usd) - COALESCE(SUM(r.refund_usd), 0), 2) AS net_sales_usd
FROM stores s
JOIN orders o ON o.store_id = s.store_id
LEFT JOIN refunds_by_order r ON r.order_id = o.order_id
WHERE o.status = 'completed'
  AND EXTRACT(YEAR FROM o.order_date) = 2024
GROUP BY s.store_type
ORDER BY net_sales_usd DESC;`,
        expectedOutput: [
          {
            store_type: 'retail',
            completed_orders: 3707,
            gross_sales_usd: 1309489.29,
            refunds_usd: 52142.69,
            net_sales_usd: 1257346.6,
          },
          {
            store_type: 'warehouse',
            completed_orders: 1132,
            gross_sales_usd: 508678.6,
            refunds_usd: 3637.59,
            net_sales_usd: 505041.01,
          },
          {
            store_type: 'flagship',
            completed_orders: 1658,
            gross_sales_usd: 536458.82,
            refunds_usd: 60781.98,
            net_sales_usd: 475676.84,
          },
        ],
      },
    },
    {
      id: 'anatomia-tmdl-modularidad-sin-conflictos',
      heading: 'Anatomía de TMDL: modularidad para evitar conflictos en Git',
      body: 'Antes de TMDL, el modelo tabular se guardaba en un único fichero JSON llamado `model.bim`. Ese archivo solía superar las decenas de miles de líneas. Si una persona añadía una medida en `orders` y otra editaba `stores`, ambas tocaban el mismo fichero. Eso causaba frecuentes conflictos de llaves JSON al ejecutar `git merge`.\n\n**TMDL** sustituye el monolito JSON por una sintaxis declarativa con sangría similar a YAML. Además, divide el directorio `definition/` en ficheros independientes: `database.tmdl`, `model.tmdl`, `relationships.tmdl` y una carpeta `tables/` con un archivo `.tmdl` por tabla. Dentro de `tables/orders.tmdl`, cada medida DAX se declara con su expresión multilínea, su `formatString`, su carpeta `displayFolder` y su `lineageTag`. Asimismo, las claves foráneas como `store_id` deben declarar `summarizeBy: none` e `isHidden` para impedir sumas accidentales.',
      example: {
        language: 'yaml',
        code: `# Archivo: .gitignore
**/.pbi/localSettings.json
**/.pbi/cache.abf

# Archivo: Comite.SemanticModel/definition/tables/orders.tmdl
table orders
\tlineageTag: 8a1f4c20-91b2-4d3a-8e11-001928374655

\tmeasure 'Ventas Brutas Completadas USD' =
\t\t\tCALCULATE (
\t\t\t    SUMX ( orders, orders[subtotal_usd] - orders[discount_usd] ),
\t\t\t    orders[status] = "completed"
\t\t\t)
\t\tformatString: "\\$#,0.00;(\\$#,0.00);\\$#,0.00"
\t\tdisplayFolder: "01. Ingresos"
\t\tdescription: "Subtotal menos descuento de cabecera en pedidos con estado completed."

\tcolumn store_id
\t\tdataType: int64
\t\tisHidden
\t\tsummarizeBy: none
\t\tsourceColumn: store_id`,
      },
    },
    {
      id: 'revision-pull-requests-tmdl-auditoria-sql',
      heading: 'Lista de control al revisar un Pull Request de TMDL',
      body: 'Cuando alguien abre un Pull Request que modifica archivos `.tmdl`, quien revisa no necesita abrir Power BI Desktop. El diff de Git muestra exactamente qué líneas cambiaron en `relationships.tmdl` o en `tables/order_items.tmdl`.\n\nUna revisión técnica verifica cuatro puntos en el diff. Primero, ninguna relación debe cambiar a `crossFilteringBehavior: bothDirections` sin justificación documental. Segundo, ninguna clave numérica (`order_id`, `product_id`, `store_id`) debe tener `summarizeBy: sum`. Tercero, las medidas nuevas deben incluir `formatString` y `description`. Cuarto, las fórmulas DAX con iteraciones (`SUMX`, `CALCULATE`, `DIVIDE`) deben arrojar las mismas cifras que una consulta SQL de reconciliación sobre las tablas Parquet.',
    },
  ],

  workedExample: {
    title: 'Detección de un error de agregación DAX en un Pull Request de TMDL',
    description: 'Un analista envía un Pull Request modificando `tables/order_items.tmdl` para añadir la medida `Margen Bruto Lineas USD` del año 2024 por categoría de producto (`products.category`). En el diff de Git, el revisor observa la fórmula: `SUM(order_items[line_total_usd]) - SUM(order_items[qty]) * AVERAGE(products[unit_cost_usd])`.',
    steps: [
      {
        label: 'Paso 1 — Antipatrón detectado en el diff: multiplicar suma de unidades por promedio de coste',
        explanation: 'La fórmula propuesta en el PR multiplica el total de unidades vendidas de la categoría por el promedio simple de `unit_cost_usd` de las filas vendidas (`SUM(qty) * AVG(unit_cost_usd)`). Al simular en SQL lo que haría esa medida defectuosa en 2024, el coste en `Cafeteras` resulta `378,688.19 USD` y en `Suscripciones` `140,674.28 USD`, sesgando el margen porque no pondera el coste por la cantidad `qty` de cada línea individual.',
        code: `SELECT
  p.category,
  SUM(oi.qty) AS total_units,
  ROUND(SUM(oi.line_total_usd), 2) AS revenue_usd,
  ROUND(SUM(oi.qty) * AVG(p.unit_cost_usd), 2) AS wrong_cogs_usd,
  ROUND(SUM(oi.line_total_usd) - SUM(oi.qty) * AVG(p.unit_cost_usd), 2) AS wrong_margin_usd
FROM orders o
JOIN order_items oi ON oi.order_id = o.order_id
JOIN products p ON p.product_id = oi.product_id
WHERE o.status = 'completed'
  AND EXTRACT(YEAR FROM o.order_date) = 2024
GROUP BY p.category
ORDER BY p.category ASC;`,
        expectedOutput: [
          {
            category: 'Accesorios',
            total_units: 6342,
            revenue_usd: 259781.78,
            wrong_cogs_usd: 109315.65,
            wrong_margin_usd: 150466.13,
          },
          {
            category: 'Cafeteras',
            total_units: 6240,
            revenue_usd: 720880.21,
            wrong_cogs_usd: 378688.19,
            wrong_margin_usd: 342192.02,
          },
          {
            category: 'Café en grano',
            total_units: 6179,
            revenue_usd: 179481.7,
            wrong_cogs_usd: 80287.62,
            wrong_margin_usd: 99194.08,
          },
          {
            category: 'Molinos',
            total_units: 6201,
            revenue_usd: 930695.19,
            wrong_cogs_usd: 531056.87,
            wrong_margin_usd: 399638.32,
          },
          {
            category: 'Suscripciones',
            total_units: 6125,
            revenue_usd: 290644.76,
            wrong_cogs_usd: 140674.28,
            wrong_margin_usd: 149970.48,
          },
        ],
      },
      {
        label: 'Paso 2 — Solución en TMDL: iterador fila a fila SUMX(order_items, qty * RELATED(products[unit_cost_usd]))',
        explanation: 'El revisor solicita en el PR cambiar la medida en `tables/order_items.tmdl` a un iterador fila a fila `SUMX(order_items, order_items[line_total_usd] - order_items[qty] * RELATED(products[unit_cost_usd]))`. La consulta SQL equivalente demuestra los valores exactos que debe arrojar el modelo en 2024: en `Cafeteras` el coste real es `378,018.24 USD` (`669.95 USD` menos que el cálculo erróneo) y el margen exacto es `342,861.97 USD`.',
        code: `SELECT
  p.category,
  SUM(oi.qty) AS total_units,
  ROUND(SUM(oi.line_total_usd), 2) AS revenue_usd,
  ROUND(SUM(oi.qty * p.unit_cost_usd), 2) AS exact_cogs_usd,
  ROUND(SUM(oi.line_total_usd - oi.qty * p.unit_cost_usd), 2) AS exact_margin_usd
FROM orders o
JOIN order_items oi ON oi.order_id = o.order_id
JOIN products p ON p.product_id = oi.product_id
WHERE o.status = 'completed'
  AND EXTRACT(YEAR FROM o.order_date) = 2024
GROUP BY p.category
ORDER BY p.category ASC;`,
        expectedOutput: [
          {
            category: 'Accesorios',
            total_units: 6342,
            revenue_usd: 259781.78,
            exact_cogs_usd: 109157.26,
            exact_margin_usd: 150624.52,
          },
          {
            category: 'Cafeteras',
            total_units: 6240,
            revenue_usd: 720880.21,
            exact_cogs_usd: 378018.24,
            exact_margin_usd: 342861.97,
          },
          {
            category: 'Café en grano',
            total_units: 6179,
            revenue_usd: 179481.7,
            exact_cogs_usd: 80279.49,
            exact_margin_usd: 99202.21,
          },
          {
            category: 'Molinos',
            total_units: 6201,
            revenue_usd: 930695.19,
            exact_cogs_usd: 531306.37,
            exact_margin_usd: 399388.82,
          },
          {
            category: 'Suscripciones',
            total_units: 6125,
            revenue_usd: 290644.76,
            exact_cogs_usd: 141152.72,
            exact_margin_usd: 149492.04,
          },
        ],
      },
    ],
  },

  checks: [
    {
      id: 'chk-bi4-02-gitignore-pbip',
      type: 'mcq',
      prompt: 'Al inicializar un repositorio Git para un proyecto Power BI (PBIP), ¿por qué es obligatorio incluir **/.pbi/cache.abf y **/.pbi/localSettings.json en el archivo .gitignore?',
      options: [
        {
          id: 'a',
          text: 'Porque cache.abf contiene la caché binaria pesada de datos en memoria de VertiPaq y localSettings.json guarda ajustes locales de la máquina del desarrollador, los cuales causarían conflictos y expondrían datos en Git.',
          correct: true,
          feedback: 'Correcto. cache.abf almacena la base en memoria comprimida y localSettings.json guarda preferencias del entorno local.',
        },
        {
          id: 'b',
          text: 'Porque ambos archivos contienen el código fuente de las medidas DAX y Git no soporta archivos con texto en español.',
          correct: false,
          feedback: 'Incorrecto. Las medidas DAX residen en definition/tables/*.tmdl en UTF-8 y sí se versionan en Git.',
        },
        {
          id: 'c',
          text: 'Porque si se suben a Git, Power BI Desktop borra automáticamente la carpeta tables/ del modelo semántico.',
          correct: false,
          feedback: 'Incorrecto. Power BI Desktop no borra tables/, pero subir cache.abf infla el repositorio con binarios de cientos de megabytes.',
        },
      ],
      explanation: 'El archivo `cache.abf` almacena los datos comprimidos localmente por VertiPaq y `localSettings.json` contiene ajustes personales del usuario; solo los metadatos en `definition/` deben versionarse en Git.',
    },
    {
      id: 'chk-bi4-02-tmdl-vs-bim',
      type: 'mcq',
      prompt: '¿Qué problema de colaboración en Git resuelve el formato TMDL frente al archivo clásico model.bim en JSON?',
      options: [
        {
          id: 'a',
          text: 'Divide la definición del modelo en archivos independientes por tabla (tables/*.tmdl) y relaciones (relationships.tmdl) con sintaxis limpia sin llaves JSON anidadas, permitiendo editar distintas tablas en ramas paralelas sin conflictos de fusión.',
          correct: true,
          feedback: 'Correcto. La modularidad por tabla y relación en TMDL permite que varios analistas trabajen en paralelo sin colisionar en un único archivo.',
        },
        {
          id: 'b',
          text: 'Encripta las fórmulas DAX en código máquina hexadecimal para que ningún revisor pueda leer las medidas en un Pull Request.',
          correct: false,
          feedback: 'Incorrecto. TMDL está diseñado precisamente para ser legible por humanos en texto plano con sangría.',
        },
        {
          id: 'c',
          text: 'Funde todas las páginas visuales y los datos crudos de Parquet dentro de un único archivo XML de una sola línea.',
          correct: false,
          feedback: 'Incorrecto. Las páginas visuales viven en .Report (PBIR) y los datos nunca se guardan dentro de los archivos .tmdl.',
        },
      ],
      explanation: 'TMDL modulariza el modelo tabular en ficheros independientes por entidad con sangría limpia, eliminando los cuellos de botella de fusión del archivo monolítico `model.bim`.',
    },
    {
      id: 'chk-bi4-02-pr-review',
      type: 'fill-code',
      prompt: 'Completa la definición TMDL de la clave foránea `store_id` dentro de `tables/orders.tmdl` para ocultarla del panel de campos y desactivar cualquier suma implícita:',
      template: `column store_id
\tdataType: int64
\t{{b1}}
\tsummarizeBy: {{b2}}
\tsourceColumn: store_id`,
      blanks: [
        { id: 'b1', accepted: ['isHidden'] },
        { id: 'b2', accepted: ['none'] },
      ],
      explanation: 'En TMDL, toda clave foránea en una tabla de hechos debe incluir la propiedad booleana `isHidden` y declarar `summarizeBy: none` para impedir agregaciones numéricas accidentales.',
    },
  ],

  practice: {
    type: 'sql',
    title: 'Reconciliación SQL de la medida TMDL Cumplimiento Anual 2024 %',
    language: 'sql',
    prompt: 'Estás auditando un Pull Request en `tables/stores.tmdl` que agrega la medida `Cumplimiento Anual 2024 %` (`DIVIDE([Ventas Brutas 2024 USD], SUMX(stores, stores[monthly_target_usd] * 12))`). Escribe la consulta SQL de reconciliación para las 14 ubicaciones de `stores` con órdenes completadas (`o.status = \'completed\'`) en `2024`. Devuelve `store_code`, `store_name`, `region`, `gross_sales_2024_usd` (`ROUND(SUM(o.subtotal_usd - o.discount_usd), 2)`), `annual_target_usd` (`ROUND(s.monthly_target_usd * 12, 2)`) y `attainment_pct` (`ROUND(100.0 * SUM(o.subtotal_usd - o.discount_usd) / NULLIF(s.monthly_target_usd * 12, 0), 2)`). Ordena por `attainment_pct DESC, store_code ASC`.',
    starterCode: `-- Reconciliación SQL de la medida TMDL 'Cumplimiento Anual 2024 %'
SELECT
  s.store_code,
  s.store_name,
  s.region,
  ROUND(SUM(o.subtotal_usd), 2) AS gross_sales_2024_usd,
  ROUND(s.monthly_target_usd, 2) AS annual_target_usd,
  ROUND(100.0 * SUM(o.subtotal_usd) / NULLIF(s.monthly_target_usd, 0), 2) AS attainment_pct
FROM stores s
JOIN orders o ON o.store_id = s.store_id
WHERE EXTRACT(YEAR FROM o.order_date) = 2024
GROUP BY s.store_code, s.store_name, s.region, s.monthly_target_usd
ORDER BY attainment_pct DESC, s.store_code ASC;`,
    expected: `SELECT
  s.store_code,
  s.store_name,
  s.region,
  ROUND(SUM(o.subtotal_usd - o.discount_usd), 2) AS gross_sales_2024_usd,
  ROUND(s.monthly_target_usd * 12, 2) AS annual_target_usd,
  ROUND(100.0 * SUM(o.subtotal_usd - o.discount_usd) / NULLIF(s.monthly_target_usd * 12, 0), 2) AS attainment_pct
FROM stores s
JOIN orders o ON o.store_id = s.store_id
WHERE o.status = 'completed'
  AND EXTRACT(YEAR FROM o.order_date) = 2024
GROUP BY s.store_code, s.store_name, s.region, s.monthly_target_usd
ORDER BY attainment_pct DESC, s.store_code ASC;`,
    orderMatters: true,
    hints: [
      'Agrega la condición `o.status = \'completed\'` en la cláusula `WHERE` para igualar el filtro del `CALCULATE` en la medida DAX.',
      'Resta el descuento de cabecera en la suma de ventas brutas: `SUM(o.subtotal_usd - o.discount_usd)`.',
      'La meta en `stores` es mensual (`monthly_target_usd`); multiplícala por `12` tanto en `annual_target_usd` como en el denominador de `attainment_pct`.',
    ],
    solution: `SELECT
  s.store_code,
  s.store_name,
  s.region,
  ROUND(SUM(o.subtotal_usd - o.discount_usd), 2) AS gross_sales_2024_usd,
  ROUND(s.monthly_target_usd * 12, 2) AS annual_target_usd,
  ROUND(100.0 * SUM(o.subtotal_usd - o.discount_usd) / NULLIF(s.monthly_target_usd * 12, 0), 2) AS attainment_pct
FROM stores s
JOIN orders o ON o.store_id = s.store_id
WHERE o.status = 'completed'
  AND EXTRACT(YEAR FROM o.order_date) = 2024
GROUP BY s.store_code, s.store_name, s.region, s.monthly_target_usd
ORDER BY attainment_pct DESC, s.store_code ASC;`,
    solutionExplanation: 'La consulta aplica el filtro de estado `completed`, deduce `discount_usd` de `subtotal_usd` y anualiza la meta mensual multiplicando por `12`, verificando el `77.33 %` de cumplimiento en `STR-AR-01`.',
    expectedOutputTable: [
      {
        store_code: 'STR-AR-01',
        store_name: 'Tienda Palermo Soho',
        region: 'Cono Sur',
        gross_sales_2024_usd: 426872.11,
        annual_target_usd: 552000,
        attainment_pct: 77.33,
      },
      {
        store_code: 'STR-PE-01',
        store_name: 'Tienda Miraflores',
        region: 'Andina',
        gross_sales_2024_usd: 334334.36,
        annual_target_usd: 528000,
        attainment_pct: 63.32,
      },
      {
        store_code: 'STR-CL-02',
        store_name: 'Tienda Las Condes',
        region: 'Cono Sur',
        gross_sales_2024_usd: 195609.15,
        annual_target_usd: 648000,
        attainment_pct: 30.19,
      },
      {
        store_code: 'WH-ES-01',
        store_name: 'Almacén Logístico Coslada',
        region: 'Iberia',
        gross_sales_2024_usd: 285253.67,
        annual_target_usd: 984000,
        attainment_pct: 28.99,
      },
      {
        store_code: 'STR-CL-01',
        store_name: 'Tienda Providencia',
        region: 'Cono Sur',
        gross_sales_2024_usd: 169782.81,
        annual_target_usd: 816000,
        attainment_pct: 20.81,
      },
      {
        store_code: 'STR-CO-01',
        store_name: 'Tienda Chapinero Alto',
        region: 'Andina',
        gross_sales_2024_usd: 176434.67,
        annual_target_usd: 852000,
        attainment_pct: 20.71,
      },
      {
        store_code: 'STR-CO-02',
        store_name: 'Tienda El Poblado',
        region: 'Andina',
        gross_sales_2024_usd: 95113.34,
        annual_target_usd: 588000,
        attainment_pct: 16.18,
      },
      {
        store_code: 'WH-CO-01',
        store_name: 'Almacén Logístico Sabana',
        region: 'Andina',
        gross_sales_2024_usd: 134052.67,
        annual_target_usd: 912000,
        attainment_pct: 14.7,
      },
      {
        store_code: 'STR-ES-02',
        store_name: 'Tienda Eixample',
        region: 'Iberia',
        gross_sales_2024_usd: 105569.33,
        annual_target_usd: 732000,
        attainment_pct: 14.42,
      },
      {
        store_code: 'STR-ES-01',
        store_name: 'Tienda Salamanca',
        region: 'Iberia',
        gross_sales_2024_usd: 118176.55,
        annual_target_usd: 936000,
        attainment_pct: 12.63,
      },
      {
        store_code: 'STR-MX-02',
        store_name: 'Tienda Polanco Sur',
        region: 'Norteamérica',
        gross_sales_2024_usd: 87436.75,
        annual_target_usd: 768000,
        attainment_pct: 11.38,
      },
      {
        store_code: 'STR-MX-03',
        store_name: 'Tienda Chapultepec',
        region: 'Norteamérica',
        gross_sales_2024_usd: 64554.25,
        annual_target_usd: 624000,
        attainment_pct: 10.35,
      },
      {
        store_code: 'WH-MX-01',
        store_name: 'Almacén Central Vallejo',
        region: 'Norteamérica',
        gross_sales_2024_usd: 89372.26,
        annual_target_usd: 1140000,
        attainment_pct: 7.84,
      },
      {
        store_code: 'STR-MX-01',
        store_name: 'Tienda Reforma Norte',
        region: 'Norteamérica',
        gross_sales_2024_usd: 72064.79,
        annual_target_usd: 1020000,
        attainment_pct: 7.07,
      },
    ],
  },

  roleNotes: {
    de: 'Cuando cambies el nombre o tipo de una columna en el almacén o en archivos Parquet, coordina el Pull Request con el equipo de BI para actualizar en el mismo flujo la propiedad `sourceColumn` en el archivo `tables/*.tmdl` correspondiente.',
    da: 'Al proponer una medida nueva en un modelo compartido, edita su archivo `.tmdl` en una rama dedicada y adjunta en la descripción del Pull Request la tabla de reconciliación SQL que demuestra el resultado esperado.',
    bi: 'Estandariza la estructura de `tables/*.tmdl`: exige `displayFolder`, `formatString` y `description` en cada medida, y bloquea en revisión cualquier clave foránea sin `isHidden` ni `summarizeBy: none`.',
  },

  summary: [
    'El formato PBIP sustituye el archivo binario .pbix por carpetas en texto plano (.SemanticModel y .Report) versionables en Git.',
    'TMDL divide el antiguo model.bim en archivos modulares por tabla y relación con sintaxis legible basada en sangría.',
    'El archivo .gitignore debe excluir siempre cache.abf y localSettings.json para evitar subir datos binarios y ajustes locales.',
    'La revisión de código en Pull Requests combina la inspección de propiedades TMDL con consultas SQL que verifican las medidas DAX.',
  ],

  flashcards: [
    {
      id: 'fc-bi4-02-a',
      front: '¿Qué dos carpetas principales genera al guardarse un proyecto Power BI (PBIP)?',
      back: '`<Nombre>.SemanticModel` (que contiene la definición del modelo tabular en TMDL) y `<Nombre>.Report` (que contiene la definición visual en formato PBIR).',
    },
    {
      id: 'fc-bi4-02-b',
      front: '¿Qué archivo dentro de un proyecto PBIP contiene la caché en memoria de VertiPaq y nunca debe subirse a Git?',
      back: 'El archivo `.pbi/cache.abf` (junto con `.pbi/localSettings.json`), que debe excluirse siempre en `.gitignore`.',
    },
    {
      id: 'fc-bi4-02-c',
      front: '¿Dónde se almacenan las medidas DAX cuando un modelo semántico utiliza el formato TMDL?',
      back: 'Dentro del archivo `.tmdl` de la tabla anfitriona, bajo la ruta `*.SemanticModel/definition/tables/<nombre_tabla>.tmdl`.',
    },
    {
      id: 'fc-bi4-02-d',
      front: '¿Qué función cumple la propiedad lineageTag en un archivo TMDL?',
      back: 'Identifica de forma inmutable cada objeto del modelo (tabla, columna o medida) para que renombrarlo no rompa los objetos visuales que lo referencian en `.Report`.',
    },
  ],

  glossaryTerms: [
    'pbip-project',
    'tmdl-language',
    'pbir-format',
    'c26-bi-as-code',
  ],

  sources: [
    {
      title: 'Microsoft Learn — Power BI Desktop projects (PBIP)',
      url: 'https://learn.microsoft.com/en-us/power-bi/developer/projects/projects-overview',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Arquitectura del formato PBIP y separación entre .SemanticModel y .Report.',
    },
    {
      title: 'Microsoft Learn — Tabular Model Definition Language (TMDL) overview',
      url: 'https://learn.microsoft.com/en-us/analysis-services/tmdl/tmdl-overview',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Sintaxis declarativa basada en sangría y estructura modular por tabla de TMDL.',
    },
    {
      title: 'Microsoft Learn — Power BI Desktop projects Git integration',
      url: 'https://learn.microsoft.com/en-us/power-bi/developer/projects/projects-git',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Exclusión de cache.abf y localSettings.json en .gitignore y flujo de trabajo en ramas.',
    },
    {
      title: 'Microsoft Learn — Power BI Desktop project semantic model folder',
      url: 'https://learn.microsoft.com/en-us/power-bi/developer/projects/projects-dataset',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Organización de definition.pbism y de la carpeta definition/ del modelo semántico.',
    },
  ],

  aiNotes: 'En esta lección muestra cómo leer un archivo `tables/*.tmdl` en un Pull Request y por qué `SUM(qty) * AVG(unit_cost_usd)` falla frente al iterador `SUMX` (en `Cafeteras` 2024 desvía el coste en `669.95 USD`). En la práctica SQL, guía al estudiante para filtrar `o.status = \'completed\'`, restar `o.discount_usd` y multiplicar `monthly_target_usd * 12`.',
};

export default lesson;
