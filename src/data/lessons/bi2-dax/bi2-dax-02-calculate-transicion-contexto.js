const lesson = {
  id: 'bi2-dax-02-calculate-transicion-contexto',
  moduleId: 'bi2-dax',
  tracks: ['bi'],
  level: 2,
  order: 2,
  title: 'CALCULATE, modificadores de filtro y transición de contexto',
  subtitle: 'CALCULATE, modificadores de filtro (ALL, REMOVEFILTERS, KEEPFILTERS) y transición de contexto',
  minutes: 30,
  prerequisites: ['bi2-dax-01-contexto-fila-filtro'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), un especialista en BI construye una tabla por tipo de dispositivo (`desktop`, `mobile`, `pos_tienda`) y añade la medida `Ventas Mobile = CALCULATE([Ventas Completadas USD], \'orders\'[device_type] = "mobile")`. En lugar de mostrar datos solo en la fila `mobile`, las tres filas repiten exactamente `$2 199 394.23`. Además, al contar clientes con compras acumuladas de al menos `$5 000` mediante `FILTER(\'customers\', SUM(\'orders\'[total_usd]) >= 5000)`, obtiene los `2 400` clientes completos. ¿Por qué `CALCULATE` sobrescribió la fila del visual y por qué faltó la transición de contexto?',

  objectives: [
    'Trazar el orden exacto de ejecución de CALCULATE al modificar, agregar o limpiar filtros del modelo.',
    'Elegir entre REMOVEFILTERS (o ALL) para calcular denominadores globales y KEEPFILTERS para intersectar filtros sin sobrescribir el visual.',
    'Aplicar la transición de contexto al invocar CALCULATE o una medida dentro de un contexto de fila.'
  ],

  sections: [
    {
      id: 'anatomia-calculate-y-keepfilters',
      heading: 'Cómo CALCULATE sobrescribe filtros y cómo lo evita KEEPFILTERS',
      body: '**CALCULATE** es la única función en DAX capaz de alterar el contexto de filtro. Cuando escribes `CALCULATE([Ventas Completadas USD], \'orders\'[device_type] = "mobile")`, ese predicado booleano es azúcar sintáctico de `FILTER(ALL(\'orders\'[device_type]), \'orders\'[device_type] = "mobile")`. Por defecto, `ALL` borra cualquier filtro previo sobre `device_type` que venga de las filas del visual y lo reemplaza por `"mobile"`.\n\nPor eso, en una tabla desglosada por `device_type`, las filas `desktop` (`$2 867 799.00`) y `pos_tienda` (`$1 202 269.19`) ven su filtro reemplazado y muestran `$2 199 394.23`. Si envuelves el argumento en **KEEPFILTERS** (`CALCULATE([Ventas Completadas USD], KEEPFILTERS(\'orders\'[device_type] = "mobile"))`), DAX intersecta el filtro de la fila con `"mobile"` y devuelve `BLANK` (o `NULL` en SQL) cuando no coinciden.',
      example: {
        language: 'sql',
        code: '-- Comparación en Mercado Brisa entre sobrescritura de CALCULATE y KEEPFILTERS:\nSELECT\n  device_type,\n  ROUND(SUM(total_usd), 2) AS ventas_contexto_actual_usd,\n  ROUND((SELECT SUM(total_usd) FROM orders WHERE status = \'completed\' AND device_type = \'mobile\'), 2) AS calculate_sin_keepfilters_usd,\n  ROUND(SUM(total_usd) FILTER (WHERE device_type = \'mobile\'), 2) AS calculate_con_keepfilters_usd\nFROM orders\nWHERE status = \'completed\'\nGROUP BY device_type\nORDER BY ventas_contexto_actual_usd DESC;',
        expectedOutput: [
          {
            device_type: 'desktop',
            ventas_contexto_actual_usd: 2867799,
            calculate_sin_keepfilters_usd: 2199394.23,
            calculate_con_keepfilters_usd: null
          },
          {
            device_type: 'mobile',
            ventas_contexto_actual_usd: 2199394.23,
            calculate_sin_keepfilters_usd: 2199394.23,
            calculate_con_keepfilters_usd: 2199394.23
          },
          {
            device_type: 'pos_tienda',
            ventas_contexto_actual_usd: 1202269.19,
            calculate_sin_keepfilters_usd: 2199394.23,
            calculate_con_keepfilters_usd: null
          }
        ]
      }
    },
    {
      id: 'removefilters-y-all-porcentaje-total',
      heading: 'REMOVEFILTERS y ALL: limpiar filtros para porcentajes sobre el total',
      body: 'Para calcular qué porcentaje representa cada región sobre las ventas totales de Mercado Brisa (`$6 269 462.42`), necesitas que el denominador ignore el filtro de `stores[region]` pero respete otros filtros del reporte (como el año o `status = "completed"`).\n\nEn DAX moderno se utiliza **REMOVEFILTERS**: `Ventas Todas Regiones = CALCULATE([Ventas Completadas USD], REMOVEFILTERS(\'stores\'[region]))`. Cuando se usa como modificador directo dentro de `CALCULATE`, `REMOVEFILTERS` se comporta igual que **ALL**, pero expresa con claridad que su único propósito es quitar filtros y no devolver una tabla. En SQL, ese denominador equivale a la función de ventana `SUM(SUM(o.total_usd)) OVER ()`.',
      example: {
        language: 'sql',
        code: '-- Equivalente en DuckDB de REMOVEFILTERS(stores[region]) para participación (% del total):\nSELECT\n  s.region,\n  ROUND(SUM(o.total_usd), 2) AS ventas_region_usd,\n  ROUND(SUM(SUM(o.total_usd)) OVER (), 2) AS ventas_todas_regiones_usd,\n  ROUND(100.0 * SUM(o.total_usd) / SUM(SUM(o.total_usd)) OVER (), 2) AS participacion_pct\nFROM orders o\nINNER JOIN stores s ON o.store_id = s.store_id\nWHERE o.status = \'completed\'\nGROUP BY s.region\nORDER BY ventas_region_usd DESC;',
        expectedOutput: [
          {
            region: 'Cono Sur',
            ventas_region_usd: 2059786.39,
            ventas_todas_regiones_usd: 6269462.42,
            participacion_pct: 32.85
          },
          {
            region: 'Andina',
            ventas_region_usd: 1990554.12,
            ventas_todas_regiones_usd: 6269462.42,
            participacion_pct: 31.75
          },
          {
            region: 'Iberia',
            ventas_region_usd: 1348369.68,
            ventas_todas_regiones_usd: 6269462.42,
            participacion_pct: 21.51
          },
          {
            region: 'Norteamérica',
            ventas_region_usd: 870752.23,
            ventas_todas_regiones_usd: 6269462.42,
            participacion_pct: 13.89
          }
        ]
      }
    },
    {
      id: 'transicion-de-contexto',
      heading: 'Transición de contexto: de contexto de fila a contexto de filtro',
      body: 'Cuando `CALCULATE` se ejecuta dentro de un contexto de fila, realiza la **transición de contexto**: toma los valores de todas las columnas de la fila actual y los convierte en un filtro en el contexto de filtro. Además, toda referencia a una medida como `[Ventas Completadas USD]` lleva un `CALCULATE(...)` implícito alrededor.\n\nPor eso, al recorrer `customers` con `FILTER(\'customers\', SUM(\'orders\'[total_usd]) >= 5000)`, no ocurre transición de contexto: `SUM(\'orders\'[total_usd])` evalúa el total de la empresa (`$6.27M` o el total del segmento) para cada cliente, que siempre supera `5 000`. En cambio, al escribir `FILTER(\'customers\', [Ventas Completadas USD] >= 5000)`, el `CALCULATE` implícito de la medida transforma el `customer_id` actual en un filtro que viaja a `orders`.'
    },
    {
      id: 'orden-evaluacion-calculate',
      heading: 'Los cuatro pasos internos de evaluación de CALCULATE',
      body: 'Para depurar una medida con varios filtros, sigue la secuencia exacta en que el motor evalúa `CALCULATE(Expresion, Filtro1, Filtro2)`:\n\n1. Evalúa todos los argumentos de filtro (`Filtro1`, `Filtro2`) de forma independiente dentro del contexto de filtro **original** exterior.\n2. Si existe un contexto de fila activo, ejecuta la transición de contexto agregando un filtro por la fila actual.\n3. Aplica los modificadores `REMOVEFILTERS` o `ALL` para limpiar las columnas indicadas.\n4. Aplica los nuevos filtros calculados en el paso 1 (sobrescribiendo o intersectando con `KEEPFILTERS`) y finalmente evalúa `Expresion`.'
    }
  ],

  workedExample: {
    title: 'Transición de contexto: conteo e ingresos de clientes con compras de al menos 5 000 USD',
    description: 'En Mercado Brisa (`customers` y `orders`), compara el error de evaluar `SUM(orders[total_usd])` sin transición de contexto frente a filtrar por cliente usando la medida `[Ventas Completadas USD]` (que envuelve `CALCULATE`):',
    steps: [
      {
        label: 'Paso 1 — Error frecuente: evaluar SUM sin transición de contexto por cliente',
        explanation: 'Si evalúas la suma del segmento sin convertir cada fila de `customers` en un filtro individual (`customer_id`), el motor compara el total del segmento contra 5 000 y devuelve todos los clientes (966, 967 y 467).',
        code: '-- Antipatrón en DAX: COUNTROWS(FILTER(\'customers\', SUM(\'orders\'[total_usd]) >= 5000))\nWITH ventas_segmento AS (\n  SELECT\n    c.segment,\n    COUNT(DISTINCT c.customer_id) AS clientes_totales,\n    ROUND(SUM(o.total_usd) FILTER (WHERE o.status = \'completed\'), 2) AS suma_segmento_sin_transicion_usd\n  FROM customers c\n  LEFT JOIN orders o ON c.customer_id = o.customer_id\n  GROUP BY c.segment\n)\nSELECT\n  segment,\n  clientes_totales,\n  suma_segmento_sin_transicion_usd,\n  CASE WHEN suma_segmento_sin_transicion_usd >= 5000 THEN clientes_totales ELSE 0 END AS clientes_contados_erroneo\nFROM ventas_segmento\nORDER BY suma_segmento_sin_transicion_usd DESC;',
        expectedOutput: [
          {
            segment: 'pro_barista',
            clientes_totales: 966,
            suma_segmento_sin_transicion_usd: 2512933.23,
            clientes_contados_erroneo: 966
          },
          {
            segment: 'retail',
            clientes_totales: 967,
            suma_segmento_sin_transicion_usd: 2436924.93,
            clientes_contados_erroneo: 967
          },
          {
            segment: 'cafeteria_b2b',
            clientes_totales: 467,
            suma_segmento_sin_transicion_usd: 1319604.26,
            clientes_contados_erroneo: 467
          }
        ]
      },
      {
        label: 'Paso 2 — Solución con transición de contexto por customer_id',
        explanation: 'Al usar `CALCULATE` (o invocar `[Ventas Completadas USD]`) dentro de la iteración de `customers`, DAX filtra `orders` por cada `customer_id`, identificando exactamente a los 81, 71 y 55 clientes con compras acumuladas >= 5 000 USD.',
        code: '-- Medida DAX: CALCULATE([Ventas Completadas USD], FILTER(\'customers\', [Ventas Completadas USD] >= 5000))\nWITH gasto_cliente AS (\n  SELECT\n    c.customer_id,\n    c.segment,\n    COALESCE(SUM(o.total_usd) FILTER (WHERE o.status = \'completed\'), 0) AS ventas_cliente_usd\n  FROM customers c\n  LEFT JOIN orders o ON c.customer_id = o.customer_id\n  GROUP BY c.customer_id, c.segment\n)\nSELECT\n  segment,\n  COUNT(*) AS clientes_totales,\n  COUNT(*) FILTER (WHERE ventas_cliente_usd >= 5000) AS clientes_vip_transicion,\n  ROUND(SUM(ventas_cliente_usd) FILTER (WHERE ventas_cliente_usd >= 5000), 2) AS ventas_clientes_vip_usd\nFROM gasto_cliente\nGROUP BY segment\nORDER BY ventas_clientes_vip_usd DESC;',
        expectedOutput: [
          {
            segment: 'pro_barista',
            clientes_totales: 966,
            clientes_vip_transicion: 81,
            ventas_clientes_vip_usd: 458206.09
          },
          {
            segment: 'retail',
            clientes_totales: 967,
            clientes_vip_transicion: 71,
            ventas_clientes_vip_usd: 405404.59
          },
          {
            segment: 'cafeteria_b2b',
            clientes_totales: 467,
            clientes_vip_transicion: 55,
            ventas_clientes_vip_usd: 316169.83
          }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: 'En un visual con `orders[device_type]` en las filas, evalúas `CALCULATE([Ventas USD], \'orders\'[device_type] = "mobile")`. ¿Por qué la fila `desktop` muestra el importe de `mobile` en lugar de quedar en blanco?',
      options: [
        {
          id: 'a',
          text: 'Porque el predicado directo en CALCULATE equivale a FILTER(ALL(orders[device_type]), ...) y sobrescribe el filtro "desktop" del visual.',
          correct: true,
          feedback: 'Exacto. El filtro de columna en CALCULATE reemplaza cualquier filtro externo sobre esa misma columna a menos que se envuelva en KEEPFILTERS.'
        },
        {
          id: 'b',
          text: 'Porque la relación entre orders y device_type es inactiva.',
          correct: false,
          feedback: 'Incorrecto. device_type es una columna de la misma tabla orders; el comportamiento se debe a que CALCULATE reemplaza el filtro de esa columna.'
        },
        {
          id: 'c',
          text: 'Porque CALCULATE ignora todos los filtros de todas las tablas del reporte por defecto.',
          correct: false,
          feedback: 'Incorrecto. CALCULATE conserva los filtros de las demás columnas y tablas que no han sido mencionadas en sus argumentos.'
        }
      ],
      explanation: 'Un argumento booleano en CALCULATE reemplaza el filtro activo de esa columna. Si deseas conservar la intersección con el filtro de la fila del visual, debes usar KEEPFILTERS.'
    },
    {
      id: 'c2',
      type: 'mcq',
      prompt: '¿Por qué `FILTER(\'customers\', [Ventas USD] >= 5000)` filtra por el gasto de cada cliente individual mientras que `FILTER(\'customers\', SUM(\'orders\'[total_usd]) >= 5000)` no lo hace?',
      options: [
        {
          id: 'a',
          text: 'Porque toda invocación a una medida como [Ventas USD] incluye un CALCULATE implícito que ejecuta la transición de contexto desde la fila de customers.',
          correct: true,
          feedback: 'Correcto. El CALCULATE implícito convierte la fila actual de customers en un filtro sobre customer_id que viaja hacia orders.'
        },
        {
          id: 'b',
          text: 'Porque SUM no puede leer columnas de tablas de hechos dentro de FILTER.',
          correct: false,
          feedback: 'Incorrecto. SUM sí lee orders[total_usd], pero sin CALCULATE evalúa el contexto de filtro global en lugar de filtrar por el cliente actual.'
        },
        {
          id: 'c',
          text: 'Porque las medidas se precalculan como columnas físicas dentro de customers.',
          correct: false,
          feedback: 'Incorrecto. Las medidas no se almacenan en customers; se evalúan dinámicamente activando la transición de contexto.'
        }
      ],
      explanation: 'Invocar una medida dentro de un contexto de fila dispara un CALCULATE implícito, transformando el cliente actual en un filtro en el contexto de filtro.'
    },
    {
      id: 'c3',
      type: 'fill-code',
      prompt: 'Completa la medida DAX para calcular el denominador de ventas de todas las regiones limpiando el filtro de `stores[region]`:',
      template: 'Ventas Todas Regiones USD =\n{{b1}} (\n    [Ventas Completadas USD],\n    {{b2}} ( \'stores\'[region] )\n)',
      blanks: [
        { id: 'b1', accepted: ['CALCULATE', 'calculate'] },
        { id: 'b2', accepted: ['REMOVEFILTERS', 'ALL', 'removefilters', 'all'] }
      ],
      explanation: 'CALCULATE combinado con REMOVEFILTERS (o ALL) elimina el filtro activo sobre la columna stores[region], permitiendo obtener el importe total de todas las regiones como denominador.'
    },
    {
      id: 'c4',
      type: 'predict-output',
      prompt: 'En Mercado Brisa, las ventas completadas de `Cono Sur` son `$2 059 786.39` y el total de todas las regiones es `$6 269 462.42`. En la fila `Cono Sur`, ¿qué devuelve `DIVIDE([Ventas Completadas USD], CALCULATE([Ventas Completadas USD], REMOVEFILTERS(\'stores\'[region])))`?',
      options: [
        {
          id: 'a',
          text: '0.3285 (32.85 %), la participación de Cono Sur sobre el total de las cuatro regiones.',
          correct: true,
          feedback: 'Exacto. El numerador evalúa Cono Sur ($2.06M) y el denominador con REMOVEFILTERS evalúa el total ($6.27M).'
        },
        {
          id: 'b',
          text: '1.00 (100 %), porque numerador y denominador devuelven el mismo valor.',
          correct: false,
          feedback: 'Incorrecto. Daría 100 % si olvidaras REMOVEFILTERS(stores[region]) en el denominador.'
        },
        {
          id: 'c',
          text: 'BLANK, porque REMOVEFILTERS vacía la tabla de hechos.',
          correct: false,
          feedback: 'Incorrecto. REMOVEFILTERS quita la restricción de región, ampliando el conjunto a las cuatro regiones.'
        }
      ],
      explanation: 'REMOVEFILTERS elimina el filtro de la fila actual (Cono Sur) en el denominador, permitiendo dividir $2 059 786.39 entre $6 269 462.42 (32.85 %).'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Reconciliación de CALCULATE, REMOVEFILTERS y transición de contexto por segmento',
    language: 'sql',
    prompt: 'En Mercado Brisa, concilia por cada `segment` de `customers` las medidas DAX de transición de contexto y participación sobre el total (considerando solo pedidos con `status = \'completed\'`). Calcula en un CTE el gasto completado por cliente y devuelve por `segment`: `clientes_totales`, `clientes_vip` (clientes con gasto `>= 5000`), `ventas_segmento_usd` (`ROUND(SUM(ventas_cliente_usd), 2)`), `ventas_totales_usd` (usando ventana `ROUND(SUM(SUM(ventas_cliente_usd)) OVER (), 2)`, equivalente a `REMOVEFILTERS(customers[segment])`) y `participacion_segmento_pct` (`ROUND(100.0 * SUM(ventas_cliente_usd) / SUM(SUM(ventas_cliente_usd)) OVER (), 2)`). Ordena por `ventas_segmento_usd DESC`.',
    starterCode: 'WITH gasto_cliente AS (\n  SELECT\n    c.customer_id,\n    c.segment,\n    COALESCE(SUM(o.total_usd) FILTER (WHERE o.status = \'completed\'), 0) AS ventas_cliente_usd\n  FROM customers c\n  LEFT JOIN orders o ON c.customer_id = o.customer_id\n  GROUP BY c.customer_id, c.segment\n)\nSELECT\n  segment,\n  COUNT(*) AS clientes_totales,\n  COUNT(*) FILTER (WHERE ventas_cliente_usd >= 5000) AS clientes_vip,\n  ROUND(SUM(ventas_cliente_usd), 2) AS ventas_segmento_usd,\n  -- TODO: Calcula ventas_totales_usd (equivalente a REMOVEFILTERS) y participacion_segmento_pct\n  0.0 AS ventas_totales_usd,\n  0.0 AS participacion_segmento_pct\nFROM gasto_cliente\nGROUP BY segment\nORDER BY ventas_segmento_usd DESC;',
    expected: 'WITH gasto_cliente AS (\n  SELECT\n    c.customer_id,\n    c.segment,\n    COALESCE(SUM(o.total_usd) FILTER (WHERE o.status = \'completed\'), 0) AS ventas_cliente_usd\n  FROM customers c\n  LEFT JOIN orders o ON c.customer_id = o.customer_id\n  GROUP BY c.customer_id, c.segment\n)\nSELECT\n  segment,\n  COUNT(*) AS clientes_totales,\n  COUNT(*) FILTER (WHERE ventas_cliente_usd >= 5000) AS clientes_vip,\n  ROUND(SUM(ventas_cliente_usd), 2) AS ventas_segmento_usd,\n  ROUND(SUM(SUM(ventas_cliente_usd)) OVER (), 2) AS ventas_totales_usd,\n  ROUND(100.0 * SUM(ventas_cliente_usd) / SUM(SUM(ventas_cliente_usd)) OVER (), 2) AS participacion_segmento_pct\nFROM gasto_cliente\nGROUP BY segment\nORDER BY ventas_segmento_usd DESC;',
    orderMatters: true,
    hints: [
      'El CTE gasto_cliente ya resuelve la transición de contexto al agrupar las ventas completadas por cada customer_id.',
      'Para obtener el total sin el filtro de segment (equivalente a CALCULATE(..., REMOVEFILTERS(customers[segment]))), usa SUM(SUM(ventas_cliente_usd)) OVER ().',
      'Divide 100.0 * SUM(ventas_cliente_usd) entre SUM(SUM(ventas_cliente_usd)) OVER () y redondea a 2 decimales.'
    ],
    solution: 'WITH gasto_cliente AS (\n  SELECT\n    c.customer_id,\n    c.segment,\n    COALESCE(SUM(o.total_usd) FILTER (WHERE o.status = \'completed\'), 0) AS ventas_cliente_usd\n  FROM customers c\n  LEFT JOIN orders o ON c.customer_id = o.customer_id\n  GROUP BY c.customer_id, c.segment\n)\nSELECT\n  segment,\n  COUNT(*) AS clientes_totales,\n  COUNT(*) FILTER (WHERE ventas_cliente_usd >= 5000) AS clientes_vip,\n  ROUND(SUM(ventas_cliente_usd), 2) AS ventas_segmento_usd,\n  ROUND(SUM(SUM(ventas_cliente_usd)) OVER (), 2) AS ventas_totales_usd,\n  ROUND(100.0 * SUM(ventas_cliente_usd) / SUM(SUM(ventas_cliente_usd)) OVER (), 2) AS participacion_segmento_pct\nFROM gasto_cliente\nGROUP BY segment\nORDER BY ventas_segmento_usd DESC;',
    solutionExplanation: 'El CTE calcula el gasto individual por cliente (transición de contexto) y la consulta exterior combina el agregado por segmento con la ventana global `OVER ()` (equivalente a `REMOVEFILTERS(customers[segment])`).',
    expectedOutputTable: [
      {
        segment: 'pro_barista',
        clientes_totales: 966,
        clientes_vip: 81,
        ventas_segmento_usd: 2512933.23,
        ventas_totales_usd: 6269462.42,
        participacion_segmento_pct: 40.08
      },
      {
        segment: 'retail',
        clientes_totales: 967,
        clientes_vip: 71,
        ventas_segmento_usd: 2436924.93,
        ventas_totales_usd: 6269462.42,
        participacion_segmento_pct: 38.87
      },
      {
        segment: 'cafeteria_b2b',
        clientes_totales: 467,
        clientes_vip: 55,
        ventas_segmento_usd: 1319604.26,
        ventas_totales_usd: 6269462.42,
        participacion_segmento_pct: 21.05
      }
    ]
  },

  roleNotes: {
    de: 'Garantiza que la clave primaria de las dimensiones (`customer_id`, `product_id`, `store_id`) no contenga duplicados ni nulos; si una dimensión no tiene clave única, la transición de contexto en DAX puede agrupar varias filas bajo valores idénticos.',
    da: 'Cuando audites reportes de Power BI en SQL, traduce `CALCULATE([Medida], REMOVEFILTERS(dim[col]))` a una función de ventana `SUM(...) OVER ()` para verificar con exactitud los denominadores de participación sobre el total de la tabla.',
    bi: 'Usa `REMOVEFILTERS` en lugar de `ALL` cuando solo quieras limpiar filtros dentro de `CALCULATE`, y envuelve los predicados de columna en `KEEPFILTERS` cuando no quieras sobrescribir la selección del usuario.'
  },

  summary: [
    'CALCULATE es la función de DAX que modifica el contexto de filtro evaluando sus argumentos antes de la expresión.',
    'Un filtro de columna directo en CALCULATE sobrescribe el filtro externo; KEEPFILTERS conserva la intersección de ambos.',
    'REMOVEFILTERS y ALL limpian los filtros de una tabla o columna para construir denominadores sobre el total.',
    'Invocar CALCULATE o una medida dentro de un contexto de fila dispara la transición de contexto hacia un filtro.'
  ],

  flashcards: [
    {
      id: 'fc-bi2-dax-02-a',
      front: '¿Qué diferencia hay entre `CALCULATE([Ventas], products[category] = "Molinos")` y la misma fórmula con `KEEPFILTERS`?',
      back: 'Sin `KEEPFILTERS` sobrescribe cualquier categoría de la fila del visual mostrando siempre Molinos; con `KEEPFILTERS` intersecta ambos filtros y devuelve `BLANK` en las demás categorías.'
    },
    {
      id: 'fc-bi2-dax-02-b',
      front: '¿Qué es la transición de contexto en DAX y qué la activa?',
      back: 'Es la transformación del contexto de fila actual en un contexto de filtro equivalente; la activa `CALCULATE` (explícito o implícito al llamar a una medida).'
    },
    {
      id: 'fc-bi2-dax-02-c',
      front: '¿Por qué se prefiere `REMOVEFILTERS` frente a `ALL` como modificador directo de `CALCULATE`?',
      back: 'Ambos generan el mismo plan de consulta al quitar filtros, pero `REMOVEFILTERS` comunica sin ambigüedad que se limpia un filtro y no que se materializa una tabla.'
    }
  ],

  glossaryTerms: [
    'bi2-dax-calculate-transicion',
    'bi2-dax-modificadores-filtro'
  ],

  sources: [
    {
      title: 'Microsoft Learn — CALCULATE Function (DAX)',
      url: 'https://learn.microsoft.com/en-us/dax/calculate-function-dax',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Reglas de evaluación de CALCULATE, predicados booleanos y transición de contexto.'
    },
    {
      title: 'Microsoft Learn — REMOVEFILTERS Function (DAX)',
      url: 'https://learn.microsoft.com/en-us/dax/removefilters-function-dax',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Limpieza de filtros en tablas o columnas específicas dentro de CALCULATE.'
    },
    {
      title: 'Microsoft Learn — KEEPFILTERS Function (DAX)',
      url: 'https://learn.microsoft.com/en-us/dax/keepfilters-function-dax',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Preservación de filtros externos mediante intersección en lugar de sobrescritura.'
    }
  ],

  aiNotes: 'Las dos confusiones habituales son olvidar que los predicados en CALCULATE sobrescriben el filtro de la columna en el visual (necesitando KEEPFILTERS) y olvidar que toda medida tiene un CALCULATE implícito que provoca transición de contexto al iterar.'
};

export default lesson;
