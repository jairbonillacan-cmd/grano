export default {
  id: 'bi3-gobierno-05-equivalencia-lookml-tableau-pbi',
  moduleId: 'bi3-gobierno',
  tracks: ['bi'],
  level: 3,
  order: 5,
  title: 'Equivalencia: Looker (LookML), Tableau y Power BI',
  subtitle: 'Equivalencia de conceptos en la industria: Looker (LookML), Tableau y Power BI',
  minutes: 20,
  contentVersion: 1,
  prerequisites: [
    'bi3-gobierno-04-import-directquery-direct-lake'
  ],
  hook: 'Tras adquirir una distribuidora en Iberia que utiliza Looker (`LookML`) y un equipo comercial en Cono Sur que trabaja con `Tableau`, Mercado Brisa necesita unificar sus indicadores con la matriz que opera en `Power BI`. Cada equipo usa términos distintos (`symmetric_aggregates`, `FIXED LOD`, `ALLEXCEPT`), pero todos deben calcular la cuota de ingresos de cada formato de tienda (`store_type`) sobre el total de su región sin distorsiones de grano. ¿Cómo se traducen con exactitud estos conceptos entre las tres plataformas y SQL?',
  objectives: [
    'Mapear la equivalencia arquitectónica entre Looker (LookML `view`, `explore`, `symmetric_aggregates`), Tableau (`Relationships` de capa lógica y `LOD`) y Power BI (`Star Schema`, `CALCULATE` y `ALLEXCEPT`).',
    'Explicar cómo resuelve cada herramienta el problema de agregación en relaciones uno a muchos y el cálculo de métricas a un grano fijo distinto del visual.',
    'Implementar en SQL sobre Mercado Brisa el cálculo de cuota regional por formato de tienda (`store_type` sobre `region`) equivalente a una expresión `FIXED` LOD de Tableau y a `CALCULATE` + `ALLEXCEPT` en DAX.'
  ],
  sections: [
    {
      id: 'mapa-estructural-tres-plataformas',
      heading: 'Mapa estructural: de las tablas físicas al modelo de exploración',
      body: 'Aunque **Looker**, **Tableau** y **Power BI** nacieron con arquitecturas distintas, las tres herramientas convergen en los mismos bloques conceptuales de modelado semántico.\n\nEn **Google Cloud Looker**, el modelo se escribe en código declarativo **LookML** versionado en Git. Cada tabla o consulta derivada se define en un archivo `view` con bloques `dimension`, `dimension_group` y `measure`. Los grafos de unión expuestos al usuario final se declaran como bloques `explore` dentro de un archivo `model`, indicando la cardinalidad en `relationship` (`many_to_one`, `one_to_many`, `one_to_one`).\n\nEn **Tableau**, el lienzo de fuente de datos se divide en dos niveles. La capa física combina tablas mediante `Joins` y `Unions` estáticos que producen una sola tabla plana. En cambio, la capa lógica enlaza las tablas mediante **Relationships** contextuales que conservan el grano nativo de cada tabla. En **Power BI**, el equivalente es el esquema en estrella sobre el motor tabular (definible visualmente o en código `TMDL`), donde las dimensiones filtran a los hechos mediante relaciones `1:N` y la lógica reside en medidas DAX.',
      example: {
        language: 'sql',
        code: `SELECT
  s.store_type,
  COUNT(DISTINCT s.store_id) AS stores_count,
  COUNT(o.order_id) AS completed_orders,
  ROUND(SUM(o.total_usd), 2) AS completed_revenue_usd
FROM stores s
JOIN orders o ON s.store_id = o.store_id
WHERE o.status = 'completed'
GROUP BY s.store_type
ORDER BY completed_revenue_usd DESC;`,
        expectedOutput: [
          {
            store_type: 'retail',
            stores_count: 7,
            completed_orders: 8404,
            completed_revenue_usd: 3481893.92
          },
          {
            store_type: 'warehouse',
            stores_count: 3,
            completed_orders: 2626,
            completed_revenue_usd: 1398422.24
          },
          {
            store_type: 'flagship',
            stores_count: 4,
            completed_orders: 3730,
            completed_revenue_usd: 1389146.26
          }
        ]
      }
    },
    {
      id: 'resolucion-grano-lod-allexcept-symmetric',
      heading: 'Control de grano: Symmetric Aggregates, expresiones LOD y ALLEXCEPT',
      body: 'Al migrar entre herramientas de BI debemos resolver dos problemas clásicos. El primero es evitar que un join `1:N` infle una suma. El segundo es fijar el denominador de un porcentaje a un grano superior al de la visualización.\n\nPara evitar el fan-out cuando un `explore` une `orders` (`1`) con `order_items` (`N`), **Looker** activa por defecto `symmetric_aggregates: yes`. Siempre que la vista `orders` declare su llave única con `primary_key: yes`, Looker reescribe `SUM(orders.total_usd)` combinando el hash de `order_id` dentro de un `SUM(DISTINCT ...)`. Así suma cada pedido una sola vez sin importar cuántas líneas tenga.\n\nPor otro lado, imagina un visual desglosado por `(region, store_type)` donde queremos dividir el ingreso de cada formato entre el total de su `region`. Cada plataforma usa su propio operador de grano fijo. **Tableau** evalúa una expresión **`{ FIXED [region] : SUM([total_usd]) }`**. **Power BI** modifica el contexto con `CALCULATE(SUM(orders[total_usd]), ALLEXCEPT(stores, stores[region]))`. En SQL y LookML, el patrón equivalente emplea una CTE agrupada por `region` o una función de ventana `OVER (PARTITION BY region)`.',
      example: {
        language: 'dax',
        code: `-- 1) Tableau (Expresión Level of Detail FIXED al grano de region):
-- Denominador regional:
{ FIXED [region] : SUM(IF [status] = "completed" THEN [total_usd] END) }

-- 2) Power BI / DAX (CALCULATE + ALLEXCEPT conservando solo el filtro de region):
Region Revenue USD =
CALCULATE(
    SUM(orders[total_usd]),
    orders[status] = "completed",
    ALLEXCEPT(stores, stores[region])
)

-- 3) LookML (Looker — view con primary_key obligatoria para symmetric_aggregates):
view: orders {
  sql_table_name: public.orders ;;
  dimension: order_id {
    primary_key: yes
    type: number
    sql: \${TABLE}.order_id ;;
  }
  measure: completed_revenue_usd {
    type: sum
    sql: \${TABLE}.total_usd ;;
    filters: [status: "completed"]
  }
}`
      }
    },
    {
      id: 'equivalencia-seguridad-cache-gobierno',
      heading: 'Equivalencia de seguridad, aceleración en caché y certificación',
      body: 'Los mecanismos de seguridad, rendimiento y gobierno estudiados en este módulo también guardan una correspondencia directa entre los tres fabricantes.\n\nEn **seguridad a nivel de fila (RLS)**, Power BI evalúa roles DAX con `USERPRINCIPALNAME()`. Looker vincula atributos de usuario mediante `access_filter: { field: stores.region, user_attribute: allowed_region }` dentro del bloque `explore`. Por su parte, Tableau aplica filtros de fuente de datos con funciones de sesión como `USERNAME()` o `ISMEMBEROF()` cruzadas contra una tabla de permisos. Para proteger columnas (**OLS**), Power BI configura `metadataPermission: none`, mientras que Looker restringe campos con `required_access_grants`.\n\nEn **arquitectura de caché y preagregación**, el modo `Import` y las tablas de agregación de Power BI equivalen a los extractos columnares `.hyper` de Tableau. En Looker y Cube corresponden a las tablas agregadas declarativas (`aggregate_table` con `aggregate_awareness` y `pre_aggregations`). Finalmente, en **certificación**, el sello `Certified` de Microsoft Fabric equivale a los `Published Data Sources` certificados en Tableau Catalog y a los `Explores` auditados por Pull Request en LookML.',
      example: {
        language: 'sql',
        code: `WITH store_segment AS (
  SELECT
    s.region,
    s.store_type,
    COUNT(DISTINCT s.store_id) AS stores_count,
    COUNT(o.order_id) AS completed_orders,
    ROUND(SUM(o.total_usd), 2) AS segment_revenue_usd
  FROM stores s
  JOIN orders o ON s.store_id = o.store_id
  WHERE o.status = 'completed'
  GROUP BY s.region, s.store_type
),
region_lod AS (
  SELECT
    region,
    ROUND(SUM(segment_revenue_usd), 2) AS region_revenue_usd
  FROM store_segment
  GROUP BY region
)
SELECT
  ss.region,
  ss.store_type,
  ss.stores_count,
  ss.completed_orders,
  ss.segment_revenue_usd,
  rl.region_revenue_usd,
  ROUND(100.0 * ss.segment_revenue_usd / rl.region_revenue_usd, 2) AS region_share_pct
FROM store_segment ss
JOIN region_lod rl ON ss.region = rl.region
ORDER BY ss.region ASC, ss.segment_revenue_usd DESC;`
      }
    }
  ],
  workedExample: {
    title: 'Traducción a SQL de un cálculo FIXED LOD / ALLEXCEPT por región y formato de tienda',
    description: 'El equipo corporativo de Mercado Brisa necesita auditar qué porcentaje de los ingresos completados de cada región proviene de tiendas `retail`, `flagship` y `warehouse`, replicando exactamente el resultado que obtienen Tableau (`FIXED [region]`) y Power BI (`ALLEXCEPT(stores, stores[region])`).',
    steps: [
      {
        label: 'Paso 1: Ingresos al grano visual (region, store_type)',
        explanation: 'Calculamos en la CTE `store_segment` las métricas al grano del visual `(region, store_type)` sobre pedidos completados (`o.status = \'completed\'`).',
        code: `SELECT
  s.region,
  s.store_type,
  COUNT(DISTINCT s.store_id) AS stores_count,
  COUNT(o.order_id) AS completed_orders,
  ROUND(SUM(o.total_usd), 2) AS segment_revenue_usd
FROM stores s
JOIN orders o ON s.store_id = o.store_id
WHERE o.status = 'completed'
GROUP BY s.region, s.store_type
ORDER BY s.region ASC, segment_revenue_usd DESC;`,
        expectedOutput: [
          {
            region: 'Andina',
            store_type: 'retail',
            stores_count: 2,
            completed_orders: 2812,
            segment_revenue_usd: 1129304.49
          },
          {
            region: 'Andina',
            store_type: 'flagship',
            stores_count: 1,
            completed_orders: 1406,
            segment_revenue_usd: 492586.11
          },
          {
            region: 'Andina',
            store_type: 'warehouse',
            stores_count: 1,
            completed_orders: 703,
            segment_revenue_usd: 368663.52
          },
          {
            region: 'Cono Sur',
            store_type: 'retail',
            stores_count: 2,
            completed_orders: 3840,
            segment_revenue_usd: 1631623.57
          },
          {
            region: 'Cono Sur',
            store_type: 'flagship',
            stores_count: 1,
            completed_orders: 1080,
            segment_revenue_usd: 428162.82
          },
          {
            region: 'Iberia',
            store_type: 'warehouse',
            stores_count: 1,
            completed_orders: 1405,
            segment_revenue_usd: 786831.2
          },
          {
            region: 'Iberia',
            store_type: 'flagship',
            stores_count: 1,
            completed_orders: 703,
            segment_revenue_usd: 280783.01
          },
          {
            region: 'Iberia',
            store_type: 'retail',
            stores_count: 1,
            completed_orders: 703,
            segment_revenue_usd: 280755.47
          },
          {
            region: 'Norteamérica',
            store_type: 'retail',
            stores_count: 2,
            completed_orders: 1049,
            segment_revenue_usd: 440210.39
          },
          {
            region: 'Norteamérica',
            store_type: 'warehouse',
            stores_count: 1,
            completed_orders: 518,
            segment_revenue_usd: 242927.52
          },
          {
            region: 'Norteamérica',
            store_type: 'flagship',
            stores_count: 1,
            completed_orders: 541,
            segment_revenue_usd: 187614.32
          }
        ]
      },
      {
        label: 'Paso 2: Denominador regional fijo (FIXED LOD / ALLEXCEPT) y cálculo de cuota',
        explanation: 'Calculamos en la CTE `region_lod` el denominador fijo al grano `region` (equivalente a `{ FIXED [region] : SUM(...) }` o `ALLEXCEPT(stores, stores[region])`) y unimos ambas CTEs para obtener `region_share_pct`.',
        code: `WITH store_segment AS (
  SELECT
    s.region,
    s.store_type,
    COUNT(DISTINCT s.store_id) AS stores_count,
    COUNT(o.order_id) AS completed_orders,
    ROUND(SUM(o.total_usd), 2) AS segment_revenue_usd
  FROM stores s
  JOIN orders o ON s.store_id = o.store_id
  WHERE o.status = 'completed'
  GROUP BY s.region, s.store_type
),
region_lod AS (
  SELECT
    region,
    ROUND(SUM(segment_revenue_usd), 2) AS region_revenue_usd
  FROM store_segment
  GROUP BY region
)
SELECT
  ss.region,
  ss.store_type,
  ss.stores_count,
  ss.completed_orders,
  ss.segment_revenue_usd,
  rl.region_revenue_usd,
  ROUND(100.0 * ss.segment_revenue_usd / rl.region_revenue_usd, 2) AS region_share_pct
FROM store_segment ss
JOIN region_lod rl ON ss.region = rl.region
ORDER BY ss.region ASC, ss.segment_revenue_usd DESC;`,
        expectedOutput: [
          {
            region: 'Andina',
            store_type: 'retail',
            stores_count: 2,
            completed_orders: 2812,
            segment_revenue_usd: 1129304.49,
            region_revenue_usd: 1990554.12,
            region_share_pct: 56.73
          },
          {
            region: 'Andina',
            store_type: 'flagship',
            stores_count: 1,
            completed_orders: 1406,
            segment_revenue_usd: 492586.11,
            region_revenue_usd: 1990554.12,
            region_share_pct: 24.75
          },
          {
            region: 'Andina',
            store_type: 'warehouse',
            stores_count: 1,
            completed_orders: 703,
            segment_revenue_usd: 368663.52,
            region_revenue_usd: 1990554.12,
            region_share_pct: 18.52
          },
          {
            region: 'Cono Sur',
            store_type: 'retail',
            stores_count: 2,
            completed_orders: 3840,
            segment_revenue_usd: 1631623.57,
            region_revenue_usd: 2059786.39,
            region_share_pct: 79.21
          },
          {
            region: 'Cono Sur',
            store_type: 'flagship',
            stores_count: 1,
            completed_orders: 1080,
            segment_revenue_usd: 428162.82,
            region_revenue_usd: 2059786.39,
            region_share_pct: 20.79
          },
          {
            region: 'Iberia',
            store_type: 'warehouse',
            stores_count: 1,
            completed_orders: 1405,
            segment_revenue_usd: 786831.2,
            region_revenue_usd: 1348369.68,
            region_share_pct: 58.35
          },
          {
            region: 'Iberia',
            store_type: 'flagship',
            stores_count: 1,
            completed_orders: 703,
            segment_revenue_usd: 280783.01,
            region_revenue_usd: 1348369.68,
            region_share_pct: 20.82
          },
          {
            region: 'Iberia',
            store_type: 'retail',
            stores_count: 1,
            completed_orders: 703,
            segment_revenue_usd: 280755.47,
            region_revenue_usd: 1348369.68,
            region_share_pct: 20.82
          },
          {
            region: 'Norteamérica',
            store_type: 'retail',
            stores_count: 2,
            completed_orders: 1049,
            segment_revenue_usd: 440210.39,
            region_revenue_usd: 870752.23,
            region_share_pct: 50.56
          },
          {
            region: 'Norteamérica',
            store_type: 'warehouse',
            stores_count: 1,
            completed_orders: 518,
            segment_revenue_usd: 242927.52,
            region_revenue_usd: 870752.23,
            region_share_pct: 27.9
          },
          {
            region: 'Norteamérica',
            store_type: 'flagship',
            stores_count: 1,
            completed_orders: 541,
            segment_revenue_usd: 187614.32,
            region_revenue_usd: 870752.23,
            region_share_pct: 21.55
          }
        ]
      }
    ],
    audit: 'Ya sea mediante `{ FIXED [region] }` en Tableau, `CALCULATE(..., ALLEXCEPT(stores, stores[region]))` en Power BI o una CTE/ventana particionada por `region` en LookML y SQL, fijar explícitamente el grano del denominador garantiza cuotas regionales consistentes en todas las herramientas.'
  },
  checks: [
    {
      id: 'chk-bi3-gob-05-lookml-pk',
      type: 'mcq',
      prompt: 'En Google Cloud Looker, un `explore` une la vista `orders` con `order_items` mediante `relationship: one_to_many`. ¿Qué requisito debe cumplir la definición LookML de `orders` para que `symmetric_aggregates: yes` calcule `SUM(orders.total_usd)` sin duplicar importes?',
      options: [
        {
          id: 'a',
          text: 'La vista `orders` debe tener declarada su dimensión de clave única (`order_id`) con el parámetro `primary_key: yes`.',
          correct: true,
          feedback: 'Correcto. Looker necesita conocer la clave primaria exacta de la tabla padre para construir el hash único por fila que alimenta la agregación simétrica.'
        },
        {
          id: 'b',
          text: 'Todas las dimensiones de texto de `orders` deben convertirse a tipo `tier`.',
          correct: false,
          feedback: 'Incorrecto. El tipo `tier` crea rangos o cubetas numéricas; no interviene en la prevención del fan-out.'
        },
        {
          id: 'c',
          text: 'Es obligatorio desactivar los filtros de fecha en el bloque `explore`.',
          correct: false,
          feedback: 'Incorrecto. Las agregaciones simétricas funcionan con cualquier combinación de filtros siempre que exista una `primary_key: yes` válida.'
        }
      ],
      explanation: 'Para que Looker aplique agregaciones simétricas sobre una vista que sufre fan-out en un join `one_to_many`, dicha vista debe declarar explícitamente `primary_key: yes` en su columna de clave única.'
    },
    {
      id: 'chk-bi3-gob-05-tableau-layers',
      type: 'mcq',
      prompt: 'En el modelo de datos de Tableau, ¿cuál es la ventaja principal de enlazar `orders` y `order_items` mediante `Relationships` en la capa lógica en lugar de usar un `Join` fijo en la capa física?',
      options: [
        {
          id: 'a',
          text: 'Las `Relationships` conservan el grano nativo de cada tabla y generan joins contextuales solo con las tablas requeridas por cada visual, evitando duplicar `orders.total_usd` cuando no se usan campos de `order_items`.',
          correct: true,
          feedback: 'Correcto. La capa lógica mantiene las tablas separadas a su nivel de detalle original y agrega cada medida a su grano antes de combinarlas en la visualización.'
        },
        {
          id: 'b',
          text: 'La capa lógica elimina la necesidad de conectar Tableau a una base de datos o archivo.',
          correct: false,
          feedback: 'Incorrecto. Tanto la capa lógica como la física leen de las conexiones de datos configuradas.'
        },
        {
          id: 'c',
          text: 'Los `Joins` de la capa física no permiten unir tablas por columnas de tipo entero (`INTEGER`).',
          correct: false,
          feedback: 'Incorrecto. Los joins físicos sí unen columnas enteras, pero aplanan previamente el resultado al grano más fino y provocan fan-out.'
        }
      ],
      explanation: 'Las `Relationships` de la capa lógica de Tableau preservan la granularidad nativa de cada tabla y previenen la multiplicación prematura de filas típica de los joins físicos estáticos.'
    },
    {
      id: 'chk-bi3-gob-05-lod-dax',
      type: 'fill-code',
      prompt: 'Completa la tabla de equivalencias entre Tableau, Power BI (DAX) y Looker (LookML).',
      template: 'En Tableau, para calcular el ingreso total de una región ignorando el desglose visual por `store_type` se escribe `{ {{blank1}} [region] : SUM([total_usd]) }`; en Power BI (DAX) el patrón equivalente dentro de `CALCULATE` para conservar solo el filtro de `stores[region]` es `{{blank2}}(stores, stores[region])`; y en LookML el control de seguridad por fila que cruza un campo con el perfil del usuario se declara con `{{blank3}}`.',
      blanks: [
        {
          id: 'blank1',
          accepted: ['FIXED', 'fixed']
        },
        {
          id: 'blank2',
          accepted: ['ALLEXCEPT', 'allexcept']
        },
        {
          id: 'blank3',
          accepted: ['access_filter']
        }
      ],
      explanation: '`FIXED` fija las dimensiones de agrupación en Tableau, `ALLEXCEPT(stores, stores[region])` limpia los demás filtros de `stores` en DAX y `access_filter` aplica RLS basada en atributos de usuario en LookML.'
    }
  ],
  practice: {
    type: 'sql',
    title: 'Cuota regional por formato de tienda (equivalencia FIXED LOD / ALLEXCEPT en SQL)',
    prompt: 'El código inicial calcula el ingreso de pedidos completados (`o.status = \'completed\'`) por `(region, store_type)`, pero asigna el propio ingreso del segmento como total regional y devuelve siempre `100.0` en `region_share_pct`. Corrige la consulta (usando una segunda CTE `region_lod` agrupada por `region` o una función de ventana) para devolver exactamente: `region`, `store_type`, `stores_count`, `completed_orders`, `segment_revenue_usd`, `region_revenue_usd` (suma total de ingresos completados de toda la región, redondeada a 2 decimales) y `region_share_pct` (`ROUND(100.0 * segment_revenue_usd / region_revenue_usd, 2)`). Ordena por `region ASC, segment_revenue_usd DESC`.',
    starterCode: `-- Calcula el denominador regional fijo (region_revenue_usd) y el porcentaje de cuota (region_share_pct):
WITH store_segment AS (
  SELECT
    s.region,
    s.store_type,
    COUNT(DISTINCT s.store_id) AS stores_count,
    COUNT(o.order_id) AS completed_orders,
    ROUND(SUM(o.total_usd), 2) AS segment_revenue_usd
  FROM stores s
  JOIN orders o ON s.store_id = o.store_id
  WHERE o.status = 'completed'
  GROUP BY s.region, s.store_type
)
SELECT
  ss.region,
  ss.store_type,
  ss.stores_count,
  ss.completed_orders,
  ss.segment_revenue_usd,
  ss.segment_revenue_usd AS region_revenue_usd,
  100.0 AS region_share_pct
FROM store_segment ss
ORDER BY ss.region ASC, ss.segment_revenue_usd DESC;`,
    solution: `WITH store_segment AS (
  SELECT
    s.region,
    s.store_type,
    COUNT(DISTINCT s.store_id) AS stores_count,
    COUNT(o.order_id) AS completed_orders,
    ROUND(SUM(o.total_usd), 2) AS segment_revenue_usd
  FROM stores s
  JOIN orders o ON s.store_id = o.store_id
  WHERE o.status = 'completed'
  GROUP BY s.region, s.store_type
),
region_lod AS (
  SELECT
    region,
    ROUND(SUM(segment_revenue_usd), 2) AS region_revenue_usd
  FROM store_segment
  GROUP BY region
)
SELECT
  ss.region,
  ss.store_type,
  ss.stores_count,
  ss.completed_orders,
  ss.segment_revenue_usd,
  rl.region_revenue_usd,
  ROUND(100.0 * ss.segment_revenue_usd / rl.region_revenue_usd, 2) AS region_share_pct
FROM store_segment ss
JOIN region_lod rl ON ss.region = rl.region
ORDER BY ss.region ASC, ss.segment_revenue_usd DESC;`,
    solutionExplanation: 'La CTE store_segment agrega los pedidos completados al grano (region, store_type) y la CTE region_lod agrega al grano superior (region), replicando el comportamiento de { FIXED [region] : SUM(...) } en Tableau y CALCULATE(..., ALLEXCEPT(stores, stores[region])) en DAX.',
    expectedOutputTable: [
      {
        region: 'Andina',
        store_type: 'retail',
        stores_count: 2,
        completed_orders: 2812,
        segment_revenue_usd: 1129304.49,
        region_revenue_usd: 1990554.12,
        region_share_pct: 56.73
      },
      {
        region: 'Andina',
        store_type: 'flagship',
        stores_count: 1,
        completed_orders: 1406,
        segment_revenue_usd: 492586.11,
        region_revenue_usd: 1990554.12,
        region_share_pct: 24.75
      },
      {
        region: 'Andina',
        store_type: 'warehouse',
        stores_count: 1,
        completed_orders: 703,
        segment_revenue_usd: 368663.52,
        region_revenue_usd: 1990554.12,
        region_share_pct: 18.52
      },
      {
        region: 'Cono Sur',
        store_type: 'retail',
        stores_count: 2,
        completed_orders: 3840,
        segment_revenue_usd: 1631623.57,
        region_revenue_usd: 2059786.39,
        region_share_pct: 79.21
      },
      {
        region: 'Cono Sur',
        store_type: 'flagship',
        stores_count: 1,
        completed_orders: 1080,
        segment_revenue_usd: 428162.82,
        region_revenue_usd: 2059786.39,
        region_share_pct: 20.79
      },
      {
        region: 'Iberia',
        store_type: 'warehouse',
        stores_count: 1,
        completed_orders: 1405,
        segment_revenue_usd: 786831.2,
        region_revenue_usd: 1348369.68,
        region_share_pct: 58.35
      },
      {
        region: 'Iberia',
        store_type: 'flagship',
        stores_count: 1,
        completed_orders: 703,
        segment_revenue_usd: 280783.01,
        region_revenue_usd: 1348369.68,
        region_share_pct: 20.82
      },
      {
        region: 'Iberia',
        store_type: 'retail',
        stores_count: 1,
        completed_orders: 703,
        segment_revenue_usd: 280755.47,
        region_revenue_usd: 1348369.68,
        region_share_pct: 20.82
      },
      {
        region: 'Norteamérica',
        store_type: 'retail',
        stores_count: 2,
        completed_orders: 1049,
        segment_revenue_usd: 440210.39,
        region_revenue_usd: 870752.23,
        region_share_pct: 50.56
      },
      {
        region: 'Norteamérica',
        store_type: 'warehouse',
        stores_count: 1,
        completed_orders: 518,
        segment_revenue_usd: 242927.52,
        region_revenue_usd: 870752.23,
        region_share_pct: 27.9
      },
      {
        region: 'Norteamérica',
        store_type: 'flagship',
        stores_count: 1,
        completed_orders: 541,
        segment_revenue_usd: 187614.32,
        region_revenue_usd: 870752.23,
        region_share_pct: 21.55
      }
    ],
    hints: [
      'Añade una segunda CTE `region_lod` que agrupe `store_segment` únicamente por `region` y calcule `ROUND(SUM(segment_revenue_usd), 2) AS region_revenue_usd`.',
      'Une `store_segment ss` con `region_lod rl ON ss.region = rl.region`.',
      'Calcula `ROUND(100.0 * ss.segment_revenue_usd / rl.region_revenue_usd, 2) AS region_share_pct` y mantén el orden `ORDER BY ss.region ASC, ss.segment_revenue_usd DESC`.'
    ]
  },
  roleNotes: {
    de: 'Como Data Engineer, cuando la empresa opera simultáneamente Power BI, Tableau y Looker, centralizar las métricas críticas en una capa semántica independiente o vistas gobernadas del almacén evita tener que mantener tres implementaciones paralelas en DAX, LOD y LookML.',
    da: 'Como Data Analyst, antes de migrar un cálculo de cuota desde Tableau (`FIXED`) hacia Power BI (`ALLEXCEPT` o `REMOVEFILTERS`), verifica qué filtros de página o contexto estaban activos en el libro original, ya que el orden de evaluación de filtros difiere entre ambas herramientas.',
    bi: 'Como BI Specialist, utiliza la tabla de traducción entre LookML, Tableau y Power BI: saber que `symmetric_aggregates`, `Relationships` y las CTEs por grano resuelven el mismo problema matemático te permite auditar y migrar modelos entre plataformas con rigor.'
  },
  summary: [
    'Looker modela en LookML (`view` y `explore`), Tableau usa `Relationships` en su capa lógica y Power BI emplea esquemas en estrella con DAX.',
    'Frente al fan-out 1:N, Looker aplica `symmetric_aggregates`, Tableau conserva el grano nativo por tabla y MetricFlow genera CTEs independientes.',
    'Un denominador regional fijo equivale a `FIXED [region]` en Tableau, `ALLEXCEPT(stores, stores[region])` en DAX y una CTE por `region` en SQL.',
    'Los patrones de RLS dinámica (`USERPRINCIPALNAME()`, `access_filter`, `USERNAME()`), preagregación y certificación se traducen directamente entre las tres plataformas.'
  ],
  flashcards: [
    {
      id: 'fc-bi3-gob-05-01',
      front: '¿Cuál es el equivalente en Power BI (DAX) y en SQL de la expresión de Tableau `{ FIXED [region] : SUM([total_usd]) }` cuando el visual está desglosado por `region` y `store_type`?',
      back: 'En DAX equivale a `CALCULATE(SUM(orders[total_usd]), ALLEXCEPT(stores, stores[region]))` (o `REMOVEFILTERS(stores[store_type])`), y en SQL a una CTE agrupada por `region` o a la función de ventana `SUM(SUM(total_usd)) OVER (PARTITION BY region)`.'
    },
    {
      id: 'fc-bi3-gob-05-02',
      front: '¿Cómo evita Looker que una medida `type: sum` se multiplique al cruzar una vista padre con una vista hija en una relación `one_to_many`?',
      back: 'Utiliza `symmetric_aggregates: yes`, apoyándose en la dimensión marcada con `primary_key: yes` para generar una expresión `SUM(DISTINCT ...)` con desplazamiento hash por clave primaria.'
    },
    {
      id: 'fc-bi3-gob-05-03',
      front: '¿Cómo se implementa la seguridad a nivel de fila (RLS) dinámica por atributo de usuario en LookML, Tableau y Power BI?',
      back: 'En LookML mediante `access_filter` vinculado a un `user_attribute`; en Tableau cruzando una tabla de permisos con `USERNAME()` o `ISMEMBEROF()`; y en Power BI filtrando la tabla de permisos con `USERPRINCIPALNAME()`.'
    }
  ],
  glossaryTerms: [
    'expresion-lod-tableau',
    'agregacion-simetrica',
    'capa-semantica-declarativa'
  ],
  sources: [
    {
      title: 'Google Cloud Looker — What is LookML?',
      url: 'https://docs.cloud.google.com/looker/docs/what-is-lookml',
      publisher: 'Google Cloud',
      accessed: '2026-10-29',
      supports: 'Estructura de proyectos LookML: modelos, explores, views, dimensiones y medidas declarativas.'
    },
    {
      title: 'Google Cloud Looker — symmetric_aggregates parameter',
      url: 'https://docs.cloud.google.com/looker/docs/reference/param-explore-symmetric-aggregates',
      publisher: 'Google Cloud',
      accessed: '2026-10-29',
      supports: 'Funcionamiento de agregaciones simétricas y requisito de primary_key: yes para evitar fan-out en joins 1:N.'
    },
    {
      title: 'Tableau Help — How Relationships Differ from Joins (The Tableau Data Model)',
      url: 'https://help.tableau.com/current/pro/desktop/en-us/datasource_multitable_normalized.htm',
      publisher: 'Salesforce / Tableau',
      accessed: '2026-10-29',
      supports: 'Diferencia entre la capa lógica (Relationships contextuales con preservación de grano) y la capa física (Joins estáticos).'
    },
    {
      title: 'Tableau Help — Overview: Level of Detail (LOD) Expressions',
      url: 'https://help.tableau.com/current/pro/desktop/en-us/calculations_calculatedfields_lod.htm',
      publisher: 'Salesforce / Tableau',
      accessed: '2026-10-29',
      supports: 'Semántica de expresiones FIXED, INCLUDE y EXCLUDE y su interacción con la jerarquía de filtros en Tableau.'
    }
  ],
  aiNotes: 'Si el estudiante intenta calcular el total general de todas las regiones (`SUM(segment_revenue_usd) OVER ()` sin `PARTITION BY region`) en lugar del total de cada región, explícale que `{ FIXED [region] : ... }` y `ALLEXCEPT(stores, stores[region])` conservan la partición por `region` y solo eliminan el corte por `store_type`.'
};
