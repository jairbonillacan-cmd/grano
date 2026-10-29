const lesson = {
  id: 'bi2-dax-04-funciones-iteradoras',
  moduleId: 'bi2-dax',
  tracks: ['bi'],
  level: 2,
  order: 4,
  title: 'Funciones iteradoras en DAX: SUMX, AVERAGEX y RANKX',
  subtitle: 'Funciones iteradoras (SUMX, AVERAGEX, RANKX) y cuándo son necesarias',
  minutes: 25,
  prerequisites: ['bi2-dax-03-inteligencia-tiempo'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), la gerencia pide el promedio de ingresos mensuales de 2024 por región. Un analista escribe `AVERAGE(\'orders\'[total_usd])` y reporta que Cono Sur factura en promedio `$417.93` al mes, cuando en realidad ese número es el ticket medio por pedido (`2 199` pedidos) y el promedio mensual real sobre los 12 meses es `$76 585.53`. Luego escribe `RANKX(ALL(\'stores\'[store_code]), SUM(\'orders\'[total_usd]))` y todas las tiendas reciben el puesto `1`. ¿Cuándo debes usar un iterador sobre una tabla virtual y por qué falló `RANKX`?',

  objectives: [
    'Decidir cuándo basta una agregación simple (SUM, AVERAGE) y cuándo es indispensable un iterador (SUMX, AVERAGEX).',
    'Calcular promedios sobre granularidades virtuales mediante AVERAGEX(VALUES(...), [Medida]).',
    'Construir clasificaciones dinámicas con RANKX(ALL(...), [Medida], , DESC, Dense) evitando el empate en rango 1.'
  ],

  sections: [
    {
      id: 'cuando-usar-sumx-frente-a-sum',
      heading: 'Cuándo usar SUMX y cuándo basta con una agregación simple SUM',
      body: 'En DAX, `SUM(\'orders\'[total_usd])` es internamente una versión abreviada de `SUMX(\'orders\', \'orders\'[total_usd])`. Si solo vas a sumar los valores de una única columna física que ya existe en la tabla, escribe siempre `SUM`: es más corto de leer y el motor de almacenamiento VertiPaq lo resuelve en un único barrido.\n\nLas **funciones iteradoras** (`SUMX`, `AVERAGEX`, `MINX`, `MAXX`) son necesarias en dos casos concretos. Primero, cuando operas con más de una columna en cada fila (como `\'order_items\'[qty] * RELATED(\'products\'[unit_cost_usd])`). Segundo, cuando necesitas agregar a un grano distinto al de la tabla de hechos (como promediar los totales mensuales o clasificar tiendas).'
    },
    {
      id: 'averagex-sobre-granularidades-virtuales',
      heading: 'AVERAGEX con VALUES: promediar meses o clientes en lugar de filas',
      body: '`AVERAGE(\'orders\'[total_usd])` suma la columna `total_usd` y la divide entre el número de filas de `orders`. En Cono Sur durante 2024 hubo `2 199` pedidos completados por un total de `$919 026.32`, por lo que `AVERAGE` devuelve `$417.93` por pedido.\n\nSi la pregunta de negocio es cuál fue el ingreso promedio por mes en 2024, el grano de la iteración no es `orders`, sino los 12 meses de `calendar`. En DAX escribes `Promedio Mensual USD = AVERAGEX(VALUES(\'calendar\'[month]), [Ventas Completadas USD])`. `VALUES(\'calendar\'[month])` genera la tabla virtual de los 12 meses visibles; para cada mes, la medida `[Ventas Completadas USD]` hace transición de contexto y finalmente `AVERAGEX` divide `$919 026.32` entre `12` (`$76 585.53`).',
      example: {
        language: 'sql',
        code: '-- Comparación en 2024 entre promedio por pedido (AVERAGE) y promedio mensual (AVERAGEX sobre meses):\nWITH ventas_mes_region AS (\n  SELECT\n    s.region,\n    cal.month,\n    SUM(o.total_usd) AS ventas_mes_usd,\n    COUNT(o.order_id) AS pedidos_mes\n  FROM orders o\n  INNER JOIN stores s ON o.store_id = s.store_id\n  INNER JOIN calendar cal ON o.order_date = cal.calendar_date\n  WHERE o.status = \'completed\' AND cal.year = 2024\n  GROUP BY s.region, cal.month\n)\nSELECT\n  region,\n  SUM(pedidos_mes) AS pedidos_2024,\n  ROUND(SUM(ventas_mes_usd), 2) AS ventas_2024_usd,\n  ROUND(SUM(ventas_mes_usd) / SUM(pedidos_mes), 2) AS promedio_por_pedido_usd,\n  ROUND(AVG(ventas_mes_usd), 2) AS averagex_mensual_usd\nFROM ventas_mes_region\nGROUP BY region\nORDER BY averagex_mensual_usd DESC;',
        expectedOutput: [
          {
            region: 'Cono Sur',
            pedidos_2024: 2199,
            ventas_2024_usd: 919026.32,
            promedio_por_pedido_usd: 417.93,
            averagex_mensual_usd: 76585.53
          },
          {
            region: 'Andina',
            pedidos_2024: 2154,
            ventas_2024_usd: 858331.08,
            promedio_por_pedido_usd: 398.48,
            averagex_mensual_usd: 71527.59
          },
          {
            region: 'Iberia',
            pedidos_2024: 1232,
            ventas_2024_usd: 590458.99,
            promedio_por_pedido_usd: 479.27,
            averagex_mensual_usd: 49204.92
          },
          {
            region: 'Norteamérica',
            pedidos_2024: 912,
            ventas_2024_usd: 363700.11,
            promedio_por_pedido_usd: 398.79,
            averagex_mensual_usd: 30308.34
          }
        ]
      }
    },
    {
      id: 'rankx-all-y-transicion-contexto',
      heading: 'RANKX: por qué exige ALL en la tabla y transición en la expresión',
      body: '**RANKX** clasifica el elemento actual comparándolo contra una tabla de candidatos: `Ranking Tienda = RANKX(ALL(\'stores\'[store_code]), [Ventas Completadas USD], , DESC, Dense)`. Tiene dos reglas estrictas:\n\n1. El primer argumento debe usar `ALL(\'stores\'[store_code])` (o `ALLSELECTED`) para ignorar el filtro de la fila actual y ver las 14 tiendas. Si pasas `VALUES(\'stores\'[store_code])`, en cada fila solo existe 1 tienda y todas reciben el puesto `1`.\n2. El segundo argumento debe ser una **medida** (`[Ventas Completadas USD]`) o estar envuelto en `CALCULATE`. Si escribes `SUM(\'orders\'[total_usd])` sin `CALCULATE`, no hay transición de contexto al iterar las 14 tiendas, todas empatan con el mismo valor y todas devuelven `1`.',
      example: {
        language: 'sql',
        code: '-- Equivalente en DuckDB de RANKX nacional y regional sobre las 6 primeras tiendas:\nWITH ventas_tienda AS (\n  SELECT\n    s.store_code,\n    s.region,\n    COUNT(o.order_id) AS pedidos_completados,\n    ROUND(SUM(o.total_usd), 2) AS ventas_usd,\n    ROUND(AVG(o.total_usd), 2) AS ticket_medio_pedido_usd\n  FROM stores s\n  INNER JOIN orders o ON s.store_id = o.store_id\n  WHERE o.status = \'completed\'\n  GROUP BY s.store_code, s.region\n)\nSELECT\n  store_code,\n  region,\n  pedidos_completados,\n  ventas_usd,\n  ticket_medio_pedido_usd,\n  DENSE_RANK() OVER (ORDER BY ventas_usd DESC) AS rank_nacional,\n  DENSE_RANK() OVER (PARTITION BY region ORDER BY ventas_usd DESC) AS rank_regional\nFROM ventas_tienda\nORDER BY rank_nacional ASC\nLIMIT 6;',
        expectedOutput: [
          {
            store_code: 'STR-AR-01',
            region: 'Cono Sur',
            pedidos_completados: 2811,
            ventas_usd: 1107208.91,
            ticket_medio_pedido_usd: 393.88,
            rank_nacional: 1,
            rank_regional: 1
          },
          {
            store_code: 'STR-PE-01',
            region: 'Andina',
            pedidos_completados: 2109,
            ventas_usd: 882838.25,
            ticket_medio_pedido_usd: 418.61,
            rank_nacional: 2,
            rank_regional: 1
          },
          {
            store_code: 'WH-ES-01',
            region: 'Iberia',
            pedidos_completados: 1405,
            ventas_usd: 786831.2,
            ticket_medio_pedido_usd: 560.02,
            rank_nacional: 3,
            rank_regional: 1
          },
          {
            store_code: 'STR-CL-02',
            region: 'Cono Sur',
            pedidos_completados: 1029,
            ventas_usd: 524414.66,
            ticket_medio_pedido_usd: 509.64,
            rank_nacional: 4,
            rank_regional: 2
          },
          {
            store_code: 'STR-CO-01',
            region: 'Andina',
            pedidos_completados: 1406,
            ventas_usd: 492586.11,
            ticket_medio_pedido_usd: 350.35,
            rank_nacional: 5,
            rank_regional: 2
          },
          {
            store_code: 'STR-CL-01',
            region: 'Cono Sur',
            pedidos_completados: 1080,
            ventas_usd: 428162.82,
            ticket_medio_pedido_usd: 396.45,
            rank_nacional: 6,
            rank_regional: 3
          }
        ]
      }
    }
  ],

  workedExample: {
    title: 'Diagnóstico del error clásico en RANKX: rango 1 en todas las filas vs ranking real',
    description: 'Compara en las tiendas de la región `Cono Sur` qué ocurre cuando en `RANKX` olvidas la transición de contexto (o el `ALL`) frente a evaluar la medida por cada `store_code`:',
    steps: [
      {
        label: 'Paso 1 — Error frecuente: RANKX sin transición de contexto devuelve 1 en todas las tiendas',
        explanation: 'Escribir `RANKX(ALL(\'stores\'[store_code]), SUM(\'orders\'[total_usd]))` evalúa la misma suma para las 4 tiendas de Cono Sur durante la iteración, provocando un cuádruple empate en el puesto 1.',
        code: '-- Simulación del error cuando la expresión dentro de RANKX no filtra por cada tienda:\nWITH ventas_cono_sur AS (\n  SELECT\n    s.store_code,\n    ROUND(SUM(o.total_usd), 2) AS ventas_tienda_usd,\n    ROUND(SUM(SUM(o.total_usd)) OVER (), 2) AS expresion_sin_transicion_usd\n  FROM stores s\n  INNER JOIN orders o ON s.store_id = o.store_id\n  WHERE o.status = \'completed\' AND s.region = \'Cono Sur\'\n  GROUP BY s.store_code\n)\nSELECT\n  store_code,\n  ventas_tienda_usd,\n  expresion_sin_transicion_usd,\n  DENSE_RANK() OVER (ORDER BY expresion_sin_transicion_usd DESC) AS rankx_erroneo\nFROM ventas_cono_sur\nORDER BY ventas_tienda_usd DESC;',
        expectedOutput: [
          {
            store_code: 'STR-AR-01',
            ventas_tienda_usd: 1107208.91,
            expresion_sin_transicion_usd: 2059786.39,
            rankx_erroneo: 1
          },
          {
            store_code: 'STR-CL-02',
            ventas_tienda_usd: 524414.66,
            expresion_sin_transicion_usd: 2059786.39,
            rankx_erroneo: 1
          },
          {
            store_code: 'STR-CL-01',
            ventas_tienda_usd: 428162.82,
            expresion_sin_transicion_usd: 2059786.39,
            rankx_erroneo: 1
          }
        ]
      },
      {
        label: 'Paso 2 — Solución verificada: RANKX(ALL(stores[store_code]), [Ventas Completadas USD], , DESC, Dense)',
        explanation: 'Al pasar la medida `[Ventas Completadas USD]` como segundo argumento, cada fila de `ALL(\'stores\'[store_code])` hace transición de contexto y obtiene su importe propio, ordenando las tres tiendas de Cono Sur con puestos 1, 2 y 3.',
        code: '-- Medida DAX correcta: RANKX(ALL(\'stores\'[store_code]), [Ventas Completadas USD], , DESC, Dense)\nWITH ventas_cono_sur AS (\n  SELECT\n    s.store_code,\n    COUNT(o.order_id) AS pedidos,\n    ROUND(SUM(o.total_usd), 2) AS ventas_tienda_usd\n  FROM stores s\n  INNER JOIN orders o ON s.store_id = o.store_id\n  WHERE o.status = \'completed\' AND s.region = \'Cono Sur\'\n  GROUP BY s.store_code\n)\nSELECT\n  store_code,\n  pedidos,\n  ventas_tienda_usd,\n  DENSE_RANK() OVER (ORDER BY ventas_tienda_usd DESC) AS rankx_correcto\nFROM ventas_cono_sur\nORDER BY rankx_correcto ASC;',
        expectedOutput: [
          {
            store_code: 'STR-AR-01',
            pedidos: 2811,
            ventas_tienda_usd: 1107208.91,
            rankx_correcto: 1
          },
          {
            store_code: 'STR-CL-02',
            pedidos: 1029,
            ventas_tienda_usd: 524414.66,
            rankx_correcto: 2
          },
          {
            store_code: 'STR-CL-01',
            pedidos: 1080,
            ventas_tienda_usd: 428162.82,
            rankx_correcto: 3
          }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: '¿Por qué `RANKX(ALL(\'stores\'[store_code]), SUM(\'orders\'[total_usd]))` devuelve el puesto `1` para todas las tiendas de la tabla?',
      options: [
        {
          id: 'a',
          text: 'Porque SUM(orders[total_usd]) no tiene CALCULATE implícito; al iterar ALL(stores[store_code]) no hay transición de contexto y todas las tiendas evalúan el mismo valor.',
          correct: true,
          feedback: 'Exacto. Sin una medida o CALCULATE en el segundo argumento, el contexto de fila de RANKX no filtra la tabla orders.'
        },
        {
          id: 'b',
          text: 'Porque RANKX ordena de forma ascendente por defecto y asigna 1 a los valores positivos.',
          correct: false,
          feedback: 'Incorrecto. Por defecto RANKX ordena DESC; el empate en 1 ocurre porque el segundo argumento devuelve el mismo número para cada tienda.'
        },
        {
          id: 'c',
          text: 'Porque ALL(stores[store_code]) borra las ventas de la tabla orders.',
          correct: false,
          feedback: 'Incorrecto. ALL(stores[store_code]) es obligatorio en el primer argumento para poder comparar la tienda actual contra todas las demás.'
        }
      ],
      explanation: 'El segundo argumento de RANKX se evalúa en un contexto de fila por cada tienda de la tabla del primer argumento; requiere una medida ([Ventas USD]) o CALCULATE para activar la transición de contexto.'
    },
    {
      id: 'c2',
      type: 'mcq',
      prompt: 'En Mercado Brisa quieres mostrar en una tarjeta por región el promedio de ventas mensuales de los 12 meses de 2024. ¿Qué medida DAX debes escribir?',
      options: [
        {
          id: 'a',
          text: 'AVERAGEX(VALUES(\'calendar\'[month]), [Ventas Completadas USD])',
          correct: true,
          feedback: 'Correcto. VALUES(\'calendar\'[month]) crea la lista de los 12 meses, calcula las ventas de cada mes y luego promedia esos 12 valores.'
        },
        {
          id: 'b',
          text: 'AVERAGE(\'orders\'[total_usd])',
          correct: false,
          feedback: 'Incorrecto. AVERAGE sobre la tabla orders calcula el importe promedio por pedido individual, no el promedio por mes.'
        },
        {
          id: 'c',
          text: 'SUMX(\'calendar\', \'orders\'[total_usd]) / 365',
          correct: false,
          feedback: 'Incorrecto. Dentro de un contexto de fila en calendar no puedes leer orders[total_usd] directamente sin agregación ni transición.'
        }
      ],
      explanation: 'Cuando el grano del promedio deseado (mes) es más alto que el grano de la tabla de hechos (pedido), debes iterar sobre la columna de dimensión con AVERAGEX(VALUES(...), [Medida]).'
    },
    {
      id: 'c3',
      type: 'fill-code',
      prompt: 'Completa la medida DAX para clasificar cada código de tienda (`store_code`) según `[Ventas Completadas USD]` de mayor a menor sin dejar huecos tras un empate:',
      template: 'Ranking Tienda =\n{{b1}} (\n    {{b2}} ( \'stores\'[store_code] ),\n    [Ventas Completadas USD],\n    ,\n    DESC,\n    Dense\n)',
      blanks: [
        { id: 'b1', accepted: ['RANKX', 'rankx'] },
        { id: 'b2', accepted: ['ALL', 'ALLSELECTED', 'all', 'allselected'] }
      ],
      explanation: 'RANKX recorre la tabla completa de tiendas devuelta por ALL(\'stores\'[store_code]) y evalúa la medida [Ventas Completadas USD] con desempate Dense.'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Conciliación de AVERAGEX mensual y RANKX sobre regiones en 2024',
    language: 'sql',
    prompt: 'En Mercado Brisa, concilia para el año `2024` (pedidos con `status = \'completed\'`) la diferencia entre `AVERAGE` por pedido y `AVERAGEX` mensual por `region`, junto con su `RANKX` (`DENSE_RANK`). A partir del CTE `ventas_mes_region`, devuelve por `region`: `pedidos_2024` (`SUM(pedidos_mes)`), `ventas_2024_usd` (`ROUND(SUM(ventas_mes_usd), 2)`), `promedio_por_pedido_usd` (`ROUND(SUM(ventas_mes_usd) / SUM(pedidos_mes), 2)`), `averagex_mensual_usd` (`ROUND(AVG(ventas_mes_usd), 2)`) y `ranking_region` (`DENSE_RANK() OVER (ORDER BY SUM(ventas_mes_usd) DESC)`). Ordena por `ranking_region ASC`.',
    starterCode: 'WITH ventas_mes_region AS (\n  SELECT\n    s.region,\n    cal.month,\n    SUM(o.total_usd) AS ventas_mes_usd,\n    COUNT(o.order_id) AS pedidos_mes\n  FROM orders o\n  INNER JOIN stores s ON o.store_id = s.store_id\n  INNER JOIN calendar cal ON o.order_date = cal.calendar_date\n  WHERE o.status = \'completed\' AND cal.year = 2024\n  GROUP BY s.region, cal.month\n)\nSELECT\n  region,\n  SUM(pedidos_mes) AS pedidos_2024,\n  ROUND(SUM(ventas_mes_usd), 2) AS ventas_2024_usd,\n  ROUND(SUM(ventas_mes_usd) / SUM(pedidos_mes), 2) AS promedio_por_pedido_usd,\n  -- TODO: Calcula averagex_mensual_usd (promedio de los 12 meses) y ranking_region con DENSE_RANK()\n  0.0 AS averagex_mensual_usd,\n  1 AS ranking_region\nFROM ventas_mes_region\nGROUP BY region\nORDER BY ranking_region ASC;',
    expected: 'WITH ventas_mes_region AS (\n  SELECT\n    s.region,\n    cal.month,\n    SUM(o.total_usd) AS ventas_mes_usd,\n    COUNT(o.order_id) AS pedidos_mes\n  FROM orders o\n  INNER JOIN stores s ON o.store_id = s.store_id\n  INNER JOIN calendar cal ON o.order_date = cal.calendar_date\n  WHERE o.status = \'completed\' AND cal.year = 2024\n  GROUP BY s.region, cal.month\n)\nSELECT\n  region,\n  SUM(pedidos_mes) AS pedidos_2024,\n  ROUND(SUM(ventas_mes_usd), 2) AS ventas_2024_usd,\n  ROUND(SUM(ventas_mes_usd) / SUM(pedidos_mes), 2) AS promedio_por_pedido_usd,\n  ROUND(AVG(ventas_mes_usd), 2) AS averagex_mensual_usd,\n  DENSE_RANK() OVER (ORDER BY SUM(ventas_mes_usd) DESC) AS ranking_region\nFROM ventas_mes_region\nGROUP BY region\nORDER BY ranking_region ASC;',
    orderMatters: true,
    hints: [
      'En ventas_mes_region cada fila ya representa un mes de esa región; por tanto, AVG(ventas_mes_usd) equivale a AVERAGEX(VALUES(\'calendar\'[month]), [Ventas USD]).',
      'Redondea AVG(ventas_mes_usd) con ROUND(AVG(ventas_mes_usd), 2) AS averagex_mensual_usd.',
      'Para el ranking usa DENSE_RANK() OVER (ORDER BY SUM(ventas_mes_usd) DESC) AS ranking_region.'
    ],
    solution: 'WITH ventas_mes_region AS (\n  SELECT\n    s.region,\n    cal.month,\n    SUM(o.total_usd) AS ventas_mes_usd,\n    COUNT(o.order_id) AS pedidos_mes\n  FROM orders o\n  INNER JOIN stores s ON o.store_id = s.store_id\n  INNER JOIN calendar cal ON o.order_date = cal.calendar_date\n  WHERE o.status = \'completed\' AND cal.year = 2024\n  GROUP BY s.region, cal.month\n)\nSELECT\n  region,\n  SUM(pedidos_mes) AS pedidos_2024,\n  ROUND(SUM(ventas_mes_usd), 2) AS ventas_2024_usd,\n  ROUND(SUM(ventas_mes_usd) / SUM(pedidos_mes), 2) AS promedio_por_pedido_usd,\n  ROUND(AVG(ventas_mes_usd), 2) AS averagex_mensual_usd,\n  DENSE_RANK() OVER (ORDER BY SUM(ventas_mes_usd) DESC) AS ranking_region\nFROM ventas_mes_region\nGROUP BY region\nORDER BY ranking_region ASC;',
    solutionExplanation: 'El CTE agrupa primero al grano `region × month` (12 filas por región) y la consulta externa aplica `AVG(ventas_mes_usd)` para obtener el promedio mensual exacto y `DENSE_RANK()` para clasificar las cuatro regiones.',
    expectedOutputTable: [
      {
        region: 'Cono Sur',
        pedidos_2024: 2199,
        ventas_2024_usd: 919026.32,
        promedio_por_pedido_usd: 417.93,
        averagex_mensual_usd: 76585.53,
        ranking_region: 1
      },
      {
        region: 'Andina',
        pedidos_2024: 2154,
        ventas_2024_usd: 858331.08,
        promedio_por_pedido_usd: 398.48,
        averagex_mensual_usd: 71527.59,
        ranking_region: 2
      },
      {
        region: 'Iberia',
        pedidos_2024: 1232,
        ventas_2024_usd: 590458.99,
        promedio_por_pedido_usd: 479.27,
        averagex_mensual_usd: 49204.92,
        ranking_region: 3
      },
      {
        region: 'Norteamérica',
        pedidos_2024: 912,
        ventas_2024_usd: 363700.11,
        promedio_por_pedido_usd: 398.79,
        averagex_mensual_usd: 30308.34,
        ranking_region: 4
      }
    ]
  },

  roleNotes: {
    de: 'Si una expresión iteradora pesada (como calcular comisiones escalonadas o impuestos por línea) se consulta miles de veces al día, materialízala en la tabla de hechos del almacén para ahorrar CPU en el motor BI.',
    da: 'Distingue siempre en los requerimientos si "promedio de ventas" significa ticket medio por transacción (`AVG` sobre `orders`) o facturación media mensual/diaria (`AVG` sobre un CTE preagregado por fecha).',
    bi: 'En `RANKX`, pasa como primer argumento la columna específica (`ALL(\'stores\'[store_code])`) y nunca la tabla entera (`ALL(\'stores\')`), para evitar que otras columnas ocultas de la dimensión alteren el corte del visual.'
  },

  summary: [
    'Usa SUM o AVERAGE para agregar una sola columna física; usa SUMX o AVERAGEX para expresiones de varias columnas.',
    'AVERAGEX(VALUES(tabla[columna]), [Medida]) calcula el promedio sobre una granularidad virtual como meses o clientes.',
    'RANKX necesita ALL o ALLSELECTED en su primer argumento para comparar la fila actual contra todos los candidatos.',
    'El segundo argumento de RANKX debe ser una medida o incluir CALCULATE para activar la transición de contexto.'
  ],

  flashcards: [
    {
      id: 'fc-bi2-dax-04-a',
      front: '¿Cuándo debes escribir `SUM(tabla[col])` en lugar de `SUMX(tabla, tabla[col])`?',
      back: 'Siempre que sumes una única columna física sin operaciones adicionales; ambas son equivalentes pero `SUM` es más clara.'
    },
    {
      id: 'fc-bi2-dax-04-b',
      front: '¿Qué diferencia hay entre `AVERAGE(orders[total_usd])` y `AVERAGEX(VALUES(\'calendar\'[month]), [Ventas USD])`?',
      back: 'La primera calcula el ticket promedio por pedido individual; la segunda calcula el promedio de facturación mensual.'
    },
    {
      id: 'fc-bi2-dax-04-c',
      front: '¿Cuáles son las dos causas por las que `RANKX` devuelve `1` en todas las filas de un visual?',
      back: 'No remover el filtro en el primer argumento (usar `VALUES` en vez de `ALL`) o pasar en el segundo argumento un `SUM(...)` sin transición de contexto.'
    }
  ],

  glossaryTerms: [
    'bi2-dax-funciones-iteradoras',
    'bi2-dax-calculate-transicion'
  ],

  sources: [
    {
      title: 'Microsoft Learn — SUMX Function (DAX)',
      url: 'https://learn.microsoft.com/en-us/dax/sumx-function-dax',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Sintaxis y comportamiento de iteración fila a fila en SUMX.'
    },
    {
      title: 'Microsoft Learn — AVERAGEX Function (DAX)',
      url: 'https://learn.microsoft.com/en-us/dax/averagex-function-dax',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Promedios aritméticos evaluados sobre tablas físicas o virtuales generadas con VALUES.'
    },
    {
      title: 'Microsoft Learn — RANKX Function (DAX)',
      url: 'https://learn.microsoft.com/en-us/dax/rankx-function-dax',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Clasificación de entidades, orden DESC/ASC y modo de desempate Skip frente a Dense.'
    }
  ],

  aiNotes: 'El punto crítico en esta lección es por qué RANKX devuelve 1 cuando falta ALL en el primer argumento o cuando falta transición de contexto en el segundo argumento, y la diferencia de grano entre AVERAGE(orders[total_usd]) y AVERAGEX(VALUES(calendar[month]), [Ventas]).'
};

export default lesson;
