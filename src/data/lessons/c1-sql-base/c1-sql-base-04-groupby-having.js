const lesson = {
  id: 'c1-sql-base-04-groupby-having',
  moduleId: 'c1-sql-base',
  tracks: ['core'],
  level: 1,
  order: 4,
  title: 'GROUP BY y HAVING: agregar filas y filtrar grupos',
  minutes: 25,
  prerequisites: ['c1-sql-base-03-null-logica-coalesce'],
  contentVersion: 1,
  hook: 'En Mercado Brisa, operaciones quiere saber qué tiendas han superado los 1.100 pedidos completados y cuál es su ingreso y ticket promedio. Un analista agrupa toda la tabla `orders` sin filtrar antes los pedidos cancelados o reembolsados, inflando los ingresos de todas las tiendas. Otro intenta escribir `WHERE COUNT(*) >= 1100` y el motor rechaza la consulta. ¿Cómo cambias el grano de una tabla con `GROUP BY` y cuándo debes filtrar en `WHERE` frente a `HAVING`?',
  objectives: [
    'Agrupar filas con GROUP BY comprendiendo cómo cambia el grano de la tabla de salida y qué exige la regla de agrupación.',
    'Resumir datos numéricos con SUM, AVG, MIN, MAX y COUNT explicando cómo tratan los valores NULL.',
    'Combinar WHERE (antes de agrupar) y HAVING (después de agrupar) según la fase del orden lógico.'
  ],
  sections: [
    {
      id: 'cambio-de-grano-con-group-by',
      heading: 'Cómo GROUP BY colapsa filas y redefine el grano del resultado',
      body: 'Hasta ahora cada fila de tu resultado correspondía a una fila de la tabla original. La cláusula **GROUP BY** cambia el grano: reúne todas las filas que comparten el mismo valor en las columnas de agrupación y las colapsa en una única fila resumen por grupo. Si la tabla `products` tiene 180 filas (1 fila = 1 SKU) y ejecutas `GROUP BY category`, la salida pasa a tener solo 5 filas (1 fila = 1 categoría de producto).\n\nPara resumir las filas que caen dentro de cada grupo utilizas funciones de agregación: `COUNT(*)` cuenta filas, `SUM(col)` suma valores, `AVG(col)` calcula el promedio aritmético, `MIN(col)` devuelve el mínimo y `MAX(col)` el máximo. Salvo `COUNT(*)`, todas las funciones de agregación ignoran silenciosamente los valores `NULL`. Además, `GROUP BY` trata `NULL` como un grupo propio: si agrupas `orders` por `campaign_id`, los 6.000 pedidos con `NULL` formarán una fila de grupo adicional.',
      example: {
        language: 'sql',
        code: `SELECT
  category,
  COUNT(*) AS total_skus,
  ROUND(AVG(list_price_usd), 2) AS avg_price_usd,
  ROUND(MAX(list_price_usd), 2) AS max_price_usd
FROM products
WHERE list_price_usd > 0
GROUP BY category
ORDER BY avg_price_usd DESC;`,
        expectedOutput: [
          {
            category: 'Molinos',
            total_skus: 36,
            avg_price_usd: 152.57,
            max_price_usd: 237.01
          },
          {
            category: 'Cafeteras',
            total_skus: 36,
            avg_price_usd: 116.36,
            max_price_usd: 191.62
          },
          {
            category: 'Suscripciones',
            total_skus: 35,
            avg_price_usd: 47.83,
            max_price_usd: 74.47
          },
          {
            category: 'Accesorios',
            total_skus: 36,
            avg_price_usd: 41.26,
            max_price_usd: 66.28
          },
          {
            category: 'Café en grano',
            total_skus: 36,
            avg_price_usd: 29.34,
            max_price_usd: 41.35
          }
        ]
      }
    },
    {
      id: 'regla-de-agrupacion-y-group-by-all',
      heading: 'La regla de las columnas en SELECT y el atajo GROUP BY ALL',
      body: 'Cuando una consulta incluye `GROUP BY`, toda columna escrita en `SELECT` debe cumplir una de dos condiciones: o bien aparece en la lista de `GROUP BY`, o bien está envuelta dentro de una función de agregación como `SUM` o `MAX`. Si escribes `SELECT category, product_name, COUNT(*) FROM products GROUP BY category`, el motor arroja un error de agrupación porque dentro de una categoría hay 36 nombres de producto distintos y SQL no sabe cuál de ellos mostrar en la única fila del grupo.\n\nEn consultas exploratorias con tres o cuatro columnas descriptivas, repetir todas las columnas en `GROUP BY` resulta verboso. DuckDB ofrece la extensión `GROUP BY ALL`, que detecta automáticamente qué columnas del `SELECT` no tienen función de agregación y agrupa por ellas. En motores tradicionales como PostgreSQL 17 debes listar explícitamente cada columna en `GROUP BY`, por lo que conviene practicar siempre la forma explícita.'
    },
    {
      id: 'diferencia-entre-where-y-having',
      heading: 'WHERE filtra filas previas y HAVING filtra grupos calculados',
      body: 'El error más común al empezar a agrupar es intentar escribir `WHERE COUNT(*) >= 1100` o `WHERE SUM(total_usd) > 500000`. Como vimos en el orden lógico, `WHERE` se evalúa fila por fila antes de `GROUP BY`: en ese instante los grupos todavía no existen y ninguna función agregada ha sido calculada.\n\nPara filtrar grupos según el resultado de una agregación existe la cláusula **HAVING**, que se evalúa inmediatamente después de `GROUP BY`. La regla para elegir entre ambas es directa:\n\n- Usa `WHERE` para descartar filas individuales que no deben entrar al cálculo (por ejemplo, `WHERE status = \'completed\'`).\n- Usa `HAVING` para conservar solo los grupos cuyo total, promedio o conteo supere un umbral (por ejemplo, `HAVING COUNT(*) >= 1100`).'
    },
    {
      id: 'orden-logico-con-agregacion',
      heading: 'Cómo fluyen las filas desde FROM hasta LIMIT con GROUP BY y HAVING',
      body: 'Ampliando nuestro mapa del orden lógico, una consulta analítica completa recorre estas etapas en estricto orden:\n\n1. `FROM`: lee la tabla base (`18.000` filas en `orders`).\n2. `WHERE`: conserva solo las filas válidas (`14.760` filas con `status = \'completed\'`).\n3. `GROUP BY`: colapsa las filas en un registro por cada `store_id` (`14` grupos).\n4. `HAVING`: descarta los grupos que no alcanzan el umbral (`4` tiendas con `COUNT(*) >= 1100`).\n5. `SELECT`: proyecta las claves del grupo y los agregados redondeados.\n6. `ORDER BY` y `LIMIT`: ordenan los grupos sobrevivientes y acotan la tabla final.\n\nObserva por qué no debes retrasar un filtro de fila hacia `HAVING`: si no filtras `status = \'completed\'` en `WHERE`, las órdenes canceladas y reembolsadas se suman dentro de cada tienda durante el paso 3 y contaminan el resultado sin remedio.'
    }
  ],
  workedExample: {
    title: 'Tiendas de alto volumen: agrupar sin WHERE previo frente a filtrar filas y luego grupos',
    description: 'Queremos identificar las tiendas con mayor volumen de pedidos completados en Mercado Brisa y conocer su ingreso real y ticket promedio. Compara qué pasa si omites el filtro previo en `WHERE`.',
    steps: [
      {
        label: 'Antipatrón: agrupar todos los pedidos sin descartar cancelados ni reembolsados en WHERE',
        explanation: 'Sin `WHERE status = \'completed\'`, `SUM(total_usd)` y `COUNT(*)` mezclan pedidos completados con cancelados, pendientes y reembolsados. La tienda 8 aparenta haber facturado 1,34 millones de USD cuando 240.000 USD nunca se completaron.',
        code: `SELECT
  store_id,
  COUNT(*) AS orders_count,
  ROUND(SUM(total_usd), 2) AS revenue_usd,
  ROUND(AVG(total_usd), 2) AS avg_ticket_usd
FROM orders
GROUP BY store_id
HAVING COUNT(*) >= 1350
ORDER BY revenue_usd DESC;`,
        expectedOutput: [
          {
            store_id: 8,
            orders_count: 3429,
            revenue_usd: 1347578.23,
            avg_ticket_usd: 392.99
          },
          {
            store_id: 9,
            orders_count: 2571,
            revenue_usd: 1074174.89,
            avg_ticket_usd: 417.8
          },
          {
            store_id: 14,
            orders_count: 1714,
            revenue_usd: 965688.93,
            avg_ticket_usd: 563.41
          },
          {
            store_id: 4,
            orders_count: 1715,
            revenue_usd: 611040.83,
            avg_ticket_usd: 356.29
          }
        ]
      },
      {
        label: 'Solución verificada: WHERE filtra filas antes de GROUP BY y HAVING filtra los grupos',
        explanation: 'Primero `WHERE status = \'completed\'` deja únicamente las 14.760 ventas reales; luego `GROUP BY store_id` calcula métricas limpias por tienda; finalmente `HAVING COUNT(*) >= 1100` conserva las 4 tiendas de mayor volumen.',
        code: `SELECT
  store_id,
  COUNT(*) AS completed_orders,
  ROUND(SUM(total_usd), 2) AS revenue_usd,
  ROUND(AVG(total_usd), 2) AS avg_ticket_usd
FROM orders
WHERE status = 'completed'
GROUP BY store_id
HAVING COUNT(*) >= 1100
ORDER BY revenue_usd DESC;`,
        expectedOutput: [
          {
            store_id: 8,
            completed_orders: 2811,
            revenue_usd: 1107208.91,
            avg_ticket_usd: 393.88
          },
          {
            store_id: 9,
            completed_orders: 2109,
            revenue_usd: 882838.25,
            avg_ticket_usd: 418.61
          },
          {
            store_id: 14,
            completed_orders: 1405,
            revenue_usd: 786831.2,
            avg_ticket_usd: 560.02
          },
          {
            store_id: 4,
            completed_orders: 1406,
            revenue_usd: 492586.11,
            avg_ticket_usd: 350.35
          }
        ]
      }
    ]
  },
  checks: [
    {
      id: 'chk-c1-sql-04-regla-groupby',
      type: 'mcq',
      prompt: '¿Por qué falla la consulta `SELECT store_id, status, SUM(total_usd) FROM orders GROUP BY store_id;` en SQL estándar y en DuckDB?',
      options: [
        {
          id: 'a',
          text: 'Porque `status` está en el SELECT sin función de agregación y no fue incluida en el GROUP BY.',
          correct: true,
          feedback: 'Exacto. Cada tienda tiene pedidos en varios estados; si no agrupas también por status, el motor no sabe qué estado mostrar en la fila de la tienda.'
        },
        {
          id: 'b',
          text: 'Porque no se permite agrupar por una columna numérica como `store_id`.',
          correct: false,
          feedback: 'Incorrecto. Puedes agrupar por columnas de cualquier tipo de dato (enteros, textos o fechas).'
        },
        {
          id: 'c',
          text: 'Porque falta una cláusula HAVING obligatoria después de GROUP BY.',
          correct: false,
          feedback: 'Incorrecto. La cláusula HAVING es completamente opcional y solo se usa cuando necesitas filtrar los grupos resultantes.'
        }
      ],
      explanation: 'Toda columna proyectada en SELECT junto a un GROUP BY debe formar parte de las claves de agrupación o estar dentro de una función agregada.'
    },
    {
      id: 'chk-c1-sql-04-where-vs-having',
      type: 'mcq',
      prompt: 'Quieres calcular el gasto total por cliente contando solo pedidos de 2025, y mostrar únicamente a los clientes cuya suma supere los 2.000 USD. ¿Dónde va cada condición?',
      options: [
        {
          id: 'a',
          text: 'El filtro del año 2025 va en WHERE (filtra pedidos antes de sumar) y `SUM(total_usd) > 2000` va en HAVING (filtra clientes ya agregados).',
          correct: true,
          feedback: 'Correcto. Primero descartas en WHERE los pedidos de otros años y, tras agrupar por cliente, filtras la suma acumulada en HAVING.'
        },
        {
          id: 'b',
          text: 'Ambas condiciones van en WHERE separadas por AND.',
          correct: false,
          feedback: 'Incorrecto. WHERE no admite funciones de agregación como SUM(total_usd) porque se ejecuta antes de formar los grupos.'
        },
        {
          id: 'c',
          text: 'Ambas condiciones van en HAVING porque la consulta contiene un GROUP BY.',
          correct: false,
          feedback: 'Incorrecto. En HAVING ya se perdieron las fechas individuales de cada pedido porque las filas fueron colapsadas por customer_id.'
        }
      ],
      explanation: 'WHERE filtra filas individuales usando columnas de la tabla base antes del GROUP BY; HAVING filtra grupos usando agregaciones después del GROUP BY.'
    },
    {
      id: 'chk-c1-sql-04-null-group',
      type: 'predict-output',
      prompt: 'En `orders`, la columna `campaign_id` tiene 4 nombres de campaña distintos y además 6.000 filas con `NULL`. ¿Cuántas filas devuelve `SELECT campaign_id, COUNT(*) FROM orders GROUP BY campaign_id;`?',
      options: [
        {
          id: 'a',
          text: '5 filas: una por cada una de las 4 campañas y una quinta fila para el grupo donde `campaign_id` es NULL.',
          correct: true,
          feedback: 'Exacto. GROUP BY agrupa todos los registros con NULL en una fila resumen propia en lugar de descartarlos.'
        },
        {
          id: 'b',
          text: '4 filas, porque GROUP BY elimina automáticamente cualquier fila que tenga NULL en la columna de agrupación.',
          correct: false,
          feedback: 'Incorrecto. GROUP BY nunca descarta los nulos; para excluirlos deberías añadir WHERE campaign_id IS NOT NULL.'
        },
        {
          id: 'c',
          text: '6.004 filas, porque cada NULL es distinto de otro NULL y forma un grupo de 1 fila.',
          correct: false,
          feedback: 'Incorrecto. Aunque `NULL = NULL` es UNKNOWN en WHERE, tanto GROUP BY como DISTINCT tratan todos los NULL como miembros del mismo grupo.'
        }
      ],
      explanation: 'A diferencia de WHERE, la cláusula GROUP BY reúne todos los valores NULL de la clave de agrupación dentro de un único grupo.'
    }
  ],
  practice: {
    type: 'sql',
    title: 'Tiendas con al menos 1.100 pedidos completados e ingresos netos',
    language: 'sql',
    prompt: 'Agrupa la tabla `orders` de Mercado Brisa por `store_id` considerando únicamente los pedidos con `status = \'completed\'`. Devuelve `store_id`, `COUNT(*) AS completed_orders`, `ROUND(SUM(total_usd), 2) AS revenue_usd` y `ROUND(AVG(total_usd), 2) AS avg_ticket_usd`. Filtra los grupos para conservar solo las tiendas con `COUNT(*) >= 1100` y ordena el resultado por `revenue_usd DESC`.',
    starterCode: `SELECT
  store_id,
  COUNT(*) AS completed_orders,
  ROUND(SUM(total_usd), 2) AS revenue_usd,
  ROUND(AVG(total_usd), 2) AS avg_ticket_usd
FROM orders
WHERE status = 'completed'
GROUP BY store_id
ORDER BY revenue_usd DESC;`,
    expected: `SELECT
  store_id,
  COUNT(*) AS completed_orders,
  ROUND(SUM(total_usd), 2) AS revenue_usd,
  ROUND(AVG(total_usd), 2) AS avg_ticket_usd
FROM orders
WHERE status = 'completed'
GROUP BY store_id
HAVING COUNT(*) >= 1100
ORDER BY revenue_usd DESC;`,
    orderMatters: true,
    hints: [
      'La consulta inicial ya filtra `status = \'completed\'` en `WHERE` y agrupa por `store_id`, pero devuelve las 14 tiendas.',
      'Añade una cláusula `HAVING` justo después de `GROUP BY store_id` y antes de `ORDER BY`.',
      'En el `HAVING`, escribe `HAVING COUNT(*) >= 1100` para quedarte solo con las 4 tiendas que superan ese volumen.'
    ],
    solution: `SELECT
  store_id,
  COUNT(*) AS completed_orders,
  ROUND(SUM(total_usd), 2) AS revenue_usd,
  ROUND(AVG(total_usd), 2) AS avg_ticket_usd
FROM orders
WHERE status = 'completed'
GROUP BY store_id
HAVING COUNT(*) >= 1100
ORDER BY revenue_usd DESC;`,
    solutionExplanation: 'Descarta primero los pedidos no completados con `WHERE status = \'completed\'`, colapsa por tienda con `GROUP BY store_id`, filtra los grupos con `HAVING COUNT(*) >= 1100` y ordena de mayor a menor ingreso con `ORDER BY revenue_usd DESC`.',
    expectedOutputTable: [
      {
        store_id: 8,
        completed_orders: 2811,
        revenue_usd: 1107208.91,
        avg_ticket_usd: 393.88
      },
      {
        store_id: 9,
        completed_orders: 2109,
        revenue_usd: 882838.25,
        avg_ticket_usd: 418.61
      },
      {
        store_id: 14,
        completed_orders: 1405,
        revenue_usd: 786831.2,
        avg_ticket_usd: 560.02
      },
      {
        store_id: 4,
        completed_orders: 1406,
        revenue_usd: 492586.11,
        avg_ticket_usd: 350.35
      }
    ]
  },
  roleNotes: {
    de: 'Filtra siempre la mayor cantidad posible de filas e intervalos de partición en `WHERE` antes de llegar al `GROUP BY`: construir tablas hash de agrupación en memoria sobre millones de filas descartables multiplica el consumo de RAM y CPU.',
    da: 'Declara en voz alta el nuevo grano después de cada `GROUP BY` ("ahora 1 fila es 1 tienda, no 1 pedido"). Eso te impedirá promediar promedios o confundir el conteo de grupos con el conteo de transacciones.',
    bi: 'En herramientas como Power BI o Looker, cada visual de barras o matriz genera internamente un `GROUP BY` por las dimensiones arrastradas al eje; aplica los filtros de estado transaccional a nivel de medida o de filtro de consulta, no después de agregar.'
  },
  summary: [
    'GROUP BY colapsa múltiples filas en una sola fila por cada combinación única de las columnas de agrupación.',
    'Toda columna en SELECT debe estar en el GROUP BY o dentro de una función de agregación (SUM, AVG, MIN, MAX, COUNT).',
    'WHERE filtra filas individuales antes de agrupar; HAVING filtra grupos ya calculados después de GROUP BY.',
    'GROUP BY agrupa todos los valores NULL de la clave en una fila propia, mientras que SUM y AVG ignoran los NULL.'
  ],
  flashcards: [
    {
      id: 'fc-c1-sql-04-a',
      front: '¿Cuál es la diferencia exacta de orden lógico entre `WHERE` y `HAVING`?',
      back: '`WHERE` filtra filas individuales antes de `GROUP BY`; `HAVING` filtra grupos ya formados después de `GROUP BY` usando funciones agregadas.'
    },
    {
      id: 'fc-c1-sql-04-b',
      front: '¿Qué hace `GROUP BY` cuando la columna por la que agrupas contiene varios registros con `NULL`?',
      back: 'Reúne todos los registros con `NULL` en un único grupo propio dentro del resultado.'
    },
    {
      id: 'fc-c1-sql-04-c',
      front: '¿Qué hace `GROUP BY ALL` en DuckDB y qué precaución debes tener al cambiar de motor?',
      back: 'Agrupa automáticamente por todas las columnas del `SELECT` que no tengan función agregada; es una extensión de DuckDB y no existe en PostgreSQL 17.'
    }
  ],
  glossaryTerms: ['agregacion-group-by', 'filtro-grupos-having', 'orden-logico-sql'],
  sources: [
    {
      title: 'DuckDB SQL Reference — GROUP BY Clause',
      url: 'https://duckdb.org/docs/stable/sql/query_syntax/groupby',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Agrupación de filas, comportamiento con NULL y extensión GROUP BY ALL en DuckDB.'
    },
    {
      title: 'DuckDB SQL Reference — HAVING Clause',
      url: 'https://duckdb.org/docs/stable/sql/query_syntax/having',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Filtrado de grupos agregados tras la ejecución de GROUP BY.'
    },
    {
      title: 'PostgreSQL 17 Documentation — Section 7.2.3: GROUP BY and HAVING Clauses',
      url: 'https://www.postgresql.org/docs/17/queries-table-expressions.html',
      publisher: 'PostgreSQL Global Development Group',
      accessed: '2026-10-29',
      supports: 'Separación entre condiciones de fila en WHERE y condiciones de grupo en HAVING, y regla de columnas no agregadas.'
    }
  ],
  aiNotes: 'Los dos tropiezos clásicos en esta lección son: 1) poner `WHERE COUNT(*) > N` en lugar de `HAVING COUNT(*) > N`; 2) olvidar filtrar los pedidos cancelados/reembolsados en `WHERE` antes de agrupar y creer que pueden quitarse después en `HAVING` cuando las filas ya se sumaron.'
};

export default lesson;
