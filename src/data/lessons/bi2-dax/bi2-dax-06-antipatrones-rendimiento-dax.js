const lesson = {
  id: 'bi2-dax-06-antipatrones-rendimiento-dax',
  moduleId: 'bi2-dax',
  tracks: ['bi'],
  level: 2,
  order: 6,
  title: 'Antipatrones en DAX que degradan el rendimiento del reporte',
  subtitle: 'Antipatrones y errores frecuentes en DAX que degradan el reporte',
  minutes: 20,
  prerequisites: ['bi2-dax-05-variables-divide-formato'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), un tablero tarda varios segundos en actualizarse porque cada medida filtra la tabla de hechos completa con `CALCULATE(SUM(\'orders\'[total_usd]), FILTER(\'orders\', \'orders\'[status] = "completed"))`. Además, en el resumen anual de 2024 alguien creó la medida `Clientes Anuales = SUMX(VALUES(\'calendar\'[month]), DISTINCTCOUNT(\'orders\'[customer_id]))`, reportando `1 918` clientes activos en Cono Sur cuando solo compraron `724` clientes distintos. ¿Por qué `FILTER(orders, ...)` frena al motor VertiPaq y por qué sumar conteos únicos o promediar porcentajes distorsiona las cifras?',

  objectives: [
    'Reemplazar el antipatrón FILTER(tabla_hechos, ...) por predicados de columna directos ejecutados en el Storage Engine.',
    'Prevenir la inflación de métricas no aditivas como DISTINCTCOUNT y porcentajes al agregar periodos o categorías.',
    'Conciliar en DuckDB las 10 medidas financieras y de retención del proyecto del módulo al céntimo.'
  ],

  sections: [
    {
      id: 'storage-engine-vs-formula-engine-filter',
      heading: 'Por qué FILTER(orders, ...) es lento frente a un predicado de columna',
      body: 'El motor de DAX divide cada consulta entre dos componentes internos. El **Storage Engine** (VertiPaq en modo Import o Direct Lake) es multihilo y escanea columnas comprimidas a gran velocidad. El **Formula Engine**, en cambio, ejecuta en un solo hilo la lógica compleja que el motor de almacenamiento no resuelve directamente.\n\nCuando escribes `CALCULATE(SUM(\'orders\'[total_usd]), \'orders\'[status] = "completed")`, DAX lo traduce internamente a `FILTER(ALL(\'orders\'[status]), \'orders\'[status] = "completed")`. Esa consulta solo revisa los 3 valores únicos del diccionario de `status` en el Storage Engine. En cambio, si escribes `CALCULATE(SUM(\'orders\'[total_usd]), FILTER(\'orders\', \'orders\'[status] = "completed"))`, obligas al motor a materializar y recorrer la tabla `orders` completa (`18 000` filas).'
    },
    {
      id: 'antipatron-sumar-distinctcount-y-promediar-ratios',
      heading: 'Dos errores numéricos graves: sumar DISTINCTCOUNT y promediar ratios',
      body: 'Un antipatrón frecuente ocurre en las filas de total de las matrices. Si un cliente compra en enero, marzo y julio de 2024, cuenta como `1` cliente activo en cada mes. Sin embargo, en el acumulado anual sigue siendo `1` único cliente. Si envuelves `DISTINCTCOUNT` en un `SUMX(VALUES(\'calendar\'[month]), ...)` para forzar la suma de los 12 meses, en Cono Sur reportas `1 918` clientes en vez de los `724` reales (`1 194` duplicados).\n\nLo mismo ocurre al promediar porcentajes con `AVERAGEX(VALUES(\'products\'[product_id]), [Margen %])`. Ese promedio simple le da el mismo peso a un SKU que vendió 10 unidades que a uno que vendió 5 000. Todo porcentaje debe calcularse siempre como `DIVIDE([Numerador Aditivo], [Denominador Aditivo])`.',
      example: {
        language: 'sql',
        code: '-- Auditoría en 2024: suma falsa de clientes mensuales frente a DISTINCTCOUNT anual real:\nWITH clientes_mes AS (\n  SELECT\n    s.region,\n    cal.month,\n    COUNT(DISTINCT o.customer_id) AS clientes_mes_unicos\n  FROM orders o\n  INNER JOIN stores s ON o.store_id = s.store_id\n  INNER JOIN calendar cal ON o.order_date = cal.calendar_date\n  WHERE o.status = \'completed\' AND cal.year = 2024\n  GROUP BY s.region, cal.month\n),\nsuma_mensual AS (\n  SELECT region, SUM(clientes_mes_unicos) AS suma_falsa_mensual\n  FROM clientes_mes\n  GROUP BY region\n),\nanual_real AS (\n  SELECT\n    s.region,\n    COUNT(DISTINCT o.customer_id) AS distinctcount_anual_real,\n    ROUND(SUM(o.total_usd) / NULLIF(COUNT(DISTINCT o.customer_id), 0), 2) AS ingreso_por_cliente_activo_usd\n  FROM orders o\n  INNER JOIN stores s ON o.store_id = s.store_id\n  INNER JOIN calendar cal ON o.order_date = cal.calendar_date\n  WHERE o.status = \'completed\' AND cal.year = 2024\n  GROUP BY s.region\n)\nSELECT\n  a.region,\n  sm.suma_falsa_mensual,\n  a.distinctcount_anual_real,\n  sm.suma_falsa_mensual - a.distinctcount_anual_real AS clientes_duplicados_error,\n  a.ingreso_por_cliente_activo_usd\nFROM anual_real a\nINNER JOIN suma_mensual sm ON a.region = sm.region\nORDER BY a.distinctcount_anual_real DESC;',
        expectedOutput: [
          {
            region: 'Cono Sur',
            suma_falsa_mensual: 1918,
            distinctcount_anual_real: 724,
            clientes_duplicados_error: 1194,
            ingreso_por_cliente_activo_usd: 1269.37
          },
          {
            region: 'Andina',
            suma_falsa_mensual: 1894,
            distinctcount_anual_real: 721,
            clientes_duplicados_error: 1173,
            ingreso_por_cliente_activo_usd: 1190.47
          },
          {
            region: 'Iberia',
            suma_falsa_mensual: 1087,
            distinctcount_anual_real: 376,
            clientes_duplicados_error: 711,
            ingreso_por_cliente_activo_usd: 1570.37
          },
          {
            region: 'Norteamérica',
            suma_falsa_mensual: 822,
            distinctcount_anual_real: 343,
            clientes_duplicados_error: 479,
            ingreso_por_cliente_activo_usd: 1060.35
          }
        ]
      }
    },
    {
      id: 'evitar-iferror-y-format-en-medidas',
      heading: 'Por qué evitar IFERROR, ISERROR y FORMAT en medidas numéricas',
      body: 'Otros dos antipatrones degradan tanto la velocidad como el comportamiento de los gráficos:\n\n1. **Envolver medidas en `IFERROR` o `ISERROR`:** como un error puede ocurrir en cualquier fila, el Storage Engine no puede usar ejecución vectorizada. En consecuencia, delega el cálculo fila por fila al Formula Engine. Si el riesgo es dividir por cero, usa `DIVIDE`.\n2. **Convertir números a texto con `FORMAT([Ventas USD], "$#,##0")`:** al devolver una cadena (`STRING`), la medida deja de graficarse en ejes continuos y pierde el ordenamiento numérico. Usa siempre la propiedad de cadena de formato de la medida.'
    }
  ],

  workedExample: {
    title: 'Conciliación integral de las 10 medidas DAX del modelo semántico en 2024',
    description: 'Para cerrar el módulo, compara el error de promediar porcentajes por producto frente a la consulta de auditoría que concilia al céntimo las 10 medidas DAX de Mercado Brisa en el año 2024:',
    steps: [
      {
        label: 'Paso 1 — Antipatrón: promediar los porcentajes de margen por SKU con AVERAGEX',
        explanation: 'Calcular `AVERAGEX(VALUES(products[product_id]), [Margen %])` desvía el margen de cada categoría porque ignora el volumen vendido de cada producto frente a `DIVIDE([Margen USD], [Ingresos USD])`.',
        code: '-- Comparación por categoría entre DIVIDE(SUM, SUM) y el promedio simple de ratios por SKU:\nWITH margen_producto AS (\n  SELECT\n    p.category,\n    p.product_id,\n    SUM(oi.line_total_usd) AS ingreso_prod_usd,\n    SUM(oi.qty * p.unit_cost_usd) AS costo_prod_usd,\n    (SUM(oi.line_total_usd) - SUM(oi.qty * p.unit_cost_usd)) / NULLIF(SUM(oi.line_total_usd), 0) AS margen_ratio_prod\n  FROM order_items oi\n  INNER JOIN orders o ON oi.order_id = o.order_id\n  INNER JOIN products p ON oi.product_id = p.product_id\n  WHERE o.status = \'completed\'\n  GROUP BY p.category, p.product_id\n)\nSELECT\n  category,\n  COUNT(product_id) AS skus_vendidos,\n  ROUND(SUM(ingreso_prod_usd), 2) AS ingresos_usd,\n  ROUND(SUM(ingreso_prod_usd - costo_prod_usd), 2) AS margen_usd,\n  ROUND(100.0 * (SUM(ingreso_prod_usd) - SUM(costo_prod_usd)) / NULLIF(SUM(ingreso_prod_usd), 0), 2) AS margen_correcto_divide_pct,\n  ROUND(100.0 * AVG(margen_ratio_prod), 2) AS margen_falso_avg_pct\nFROM margen_producto\nGROUP BY category\nORDER BY ingresos_usd DESC;',
        expectedOutput: [
          {
            category: 'Molinos',
            skus_vendidos: 36,
            ingresos_usd: 2163162.27,
            margen_usd: 928073.23,
            margen_correcto_divide_pct: 42.9,
            margen_falso_avg_pct: 42.97
          },
          {
            category: 'Cafeteras',
            skus_vendidos: 36,
            ingresos_usd: 1643366.45,
            margen_usd: 781890.35,
            margen_correcto_divide_pct: 47.58,
            margen_falso_avg_pct: 47.62
          },
          {
            category: 'Suscripciones',
            skus_vendidos: 35,
            ingresos_usd: 657384.31,
            margen_usd: 338217.74,
            margen_correcto_divide_pct: 51.45,
            margen_falso_avg_pct: 51.43
          },
          {
            category: 'Accesorios',
            skus_vendidos: 36,
            ingresos_usd: 586859.56,
            margen_usd: 340331.54,
            margen_correcto_divide_pct: 57.99,
            margen_falso_avg_pct: 57.91
          },
          {
            category: 'Café en grano',
            skus_vendidos: 36,
            ingresos_usd: 413378.59,
            margen_usd: 228476.01,
            margen_correcto_divide_pct: 55.27,
            margen_falso_avg_pct: 55.28
          }
        ]
      },
      {
        label: 'Paso 2 — Solución de referencia: las 10 medidas DAX de 2024 reconciliadas al céntimo',
        explanation: 'Esta consulta en DuckDB concilia exactamente las 10 medidas certificadas de `bi2-dax` para el cierre de 2024: Ingreso Bruto, Reembolsos, Ingreso Neto, Costo Directo, Margen Neto USD, Margen Neto %, Clientes Activos, Ticket Medio Neto, Ingreso Neto PY (2023) y Crecimiento YoY Neto %.',
        code: '-- Reconciliación oficial en DuckDB de las 10 medidas DAX en 2024:\nWITH reembolsos_pedido AS (\n  SELECT order_id, SUM(refund_amount_usd) AS reembolsado_usd\n  FROM refunds\n  WHERE status = \'processed\'\n  GROUP BY order_id\n),\ncostos_pedido AS (\n  SELECT oi.order_id, SUM(oi.qty * p.unit_cost_usd) AS costo_usd\n  FROM order_items oi\n  INNER JOIN products p ON oi.product_id = p.product_id\n  GROUP BY oi.order_id\n),\nbase_anual AS (\n  SELECT\n    cal.year AS anio,\n    COUNT(o.order_id) AS pedidos_completados,\n    COUNT(DISTINCT o.customer_id) AS clientes_activos,\n    ROUND(SUM(o.total_usd), 2) AS ingreso_bruto_usd,\n    ROUND(SUM(COALESCE(r.reembolsado_usd, 0)), 2) AS reembolsos_usd,\n    ROUND(SUM(o.total_usd) - SUM(COALESCE(r.reembolsado_usd, 0)), 2) AS ingreso_neto_usd,\n    ROUND(SUM(COALESCE(cp.costo_usd, 0)), 2) AS costo_directo_usd\n  FROM orders o\n  INNER JOIN calendar cal ON o.order_date = cal.calendar_date\n  LEFT JOIN reembolsos_pedido r ON o.order_id = r.order_id\n  LEFT JOIN costos_pedido cp ON o.order_id = cp.order_id\n  WHERE o.status = \'completed\' AND cal.year IN (2023, 2024)\n  GROUP BY cal.year\n)\nSELECT\n  b24.ingreso_bruto_usd AS m01_ingreso_bruto_2024_usd,\n  b24.reembolsos_usd AS m02_reembolsos_2024_usd,\n  b24.ingreso_neto_usd AS m03_ingreso_neto_2024_usd,\n  b24.costo_directo_usd AS m04_costo_directo_2024_usd,\n  ROUND(b24.ingreso_neto_usd - b24.costo_directo_usd, 2) AS m05_margen_neto_2024_usd,\n  ROUND(100.0 * (b24.ingreso_neto_usd - b24.costo_directo_usd) / NULLIF(b24.ingreso_neto_usd, 0), 2) AS m06_margen_neto_pct,\n  b24.clientes_activos AS m07_clientes_activos_2024,\n  ROUND(b24.ingreso_neto_usd / NULLIF(b24.pedidos_completados, 0), 2) AS m08_ticket_medio_neto_usd,\n  b23.ingreso_neto_usd AS m09_ingreso_neto_py_2023_usd,\n  ROUND(100.0 * (b24.ingreso_neto_usd - b23.ingreso_neto_usd) / NULLIF(b23.ingreso_neto_usd, 0), 2) AS m10_crecimiento_yoy_neto_pct\nFROM base_anual b24\nCROSS JOIN base_anual b23\nWHERE b24.anio = 2024 AND b23.anio = 2023;',
        expectedOutput: [
          {
            m01_ingreso_bruto_2024_usd: 2731516.5,
            m02_reembolsos_2024_usd: 116562.26,
            m03_ingreso_neto_2024_usd: 2614954.24,
            m04_costo_directo_2024_usd: 1239914.08,
            m05_margen_neto_2024_usd: 1375040.16,
            m06_margen_neto_pct: 52.58,
            m07_clientes_activos_2024: 2164,
            m08_ticket_medio_neto_usd: 402.49,
            m09_ingreso_neto_py_2023_usd: 813811.87,
            m10_crecimiento_yoy_neto_pct: 221.32
          }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: '¿Por qué debes escribir `CALCULATE(SUM(\'orders\'[total_usd]), \'orders\'[status] = "completed")` en lugar de `CALCULATE(SUM(\'orders\'[total_usd]), FILTER(\'orders\', \'orders\'[status] = "completed"))`?',
      options: [
        {
          id: 'a',
          text: 'Porque el predicado directo filtra únicamente los valores únicos de la columna status en el Storage Engine, mientras que FILTER(\'orders\', ...) escanea la tabla de hechos completa.',
          correct: true,
          feedback: 'Exacto. Filtrar la columna directamente opera sobre el diccionario de 3 estados en lugar de materializar las 18 000 filas de orders.'
        },
        {
          id: 'b',
          text: 'Porque FILTER no es una función válida dentro de CALCULATE.',
          correct: false,
          feedback: 'Incorrecto. Es sintácticamente válida, pero pasar la tabla de hechos entera degrada gravemente el tiempo de respuesta.'
        },
        {
          id: 'c',
          text: 'Porque ambas devuelven números distintos cuando hay pedidos cancelados.',
          correct: false,
          feedback: 'Incorrecto. El resultado numérico es idéntico; la diferencia está en el costo de memoria y CPU del plan de consulta.'
        }
      ],
      explanation: 'Pasar una tabla de hechos completa a FILTER obliga al motor a iterar fila por fila la tabla expandida; los predicados de columna operan solo sobre el diccionario de esa columna.'
    },
    {
      id: 'c2',
      type: 'predict-output',
      prompt: 'En una matriz con los 12 meses de 2024 en las filas y la medida `Clientes Activos = DISTINCTCOUNT(\'orders\'[customer_id])`, la suma aritmética de las 12 filas mensuales en Cono Sur es `1 918`, pero la fila de Total Anual muestra `724`. ¿Por qué?',
      options: [
        {
          id: 'a',
          text: 'Porque DISTINCTCOUNT es una medida no aditiva: en la fila de Total Anual no suma los meses, sino que cuenta los clientes únicos de todo 2024 sin repetir a quienes compraron en varios meses.',
          correct: true,
          feedback: 'Correcto. En DAX cada celda (incluida la fila de Total) se evalúa en su propio contexto de filtro sin sumar las celdas de arriba.'
        },
        {
          id: 'b',
          text: 'Porque Power BI descarta los clientes con más de un pedido al calcular los totales.',
          correct: false,
          feedback: 'Incorrecto. No los descarta: los cuenta una sola vez en el año en lugar de contarlos una vez por cada mes en que compraron.'
        },
        {
          id: 'c',
          text: 'Porque falta envolver DISTINCTCOUNT en un SUMX sobre los meses.',
          correct: false,
          feedback: 'Incorrecto. Envolver DISTINCTCOUNT en SUMX por mes es un antipatrón que infla el total anual contando varias veces al mismo cliente.'
        }
      ],
      explanation: 'En DAX los totales de fila y columna no suman visualmente las celdas superiores: reevalúan la fórmula en el contexto del año completo, dando el conteo único real (724).'
    },
    {
      id: 'c3',
      type: 'mcq',
      prompt: '¿Qué problema provoca usar `FORMAT([Margen Neto %], "0.00%")` dentro de la expresión DAX de una medida?',
      options: [
        {
          id: 'a',
          text: 'Convierte el resultado en tipo texto (STRING), impidiendo graficar la medida en ejes numéricos y ordenándola alfabéticamente.',
          correct: true,
          feedback: 'Exacto. El formato visual debe definirse en la propiedad Format String de la medida, manteniendo el valor numérico subyacente.'
        },
        {
          id: 'b',
          text: 'Redondea todos los decimales a cero antes de dividir.',
          correct: false,
          feedback: 'Incorrecto. No trunca a cero antes de dividir, pero transforma el resultado numérico en una cadena de texto.'
        },
        {
          id: 'c',
          text: 'Borra la relación con la tabla de calendario.',
          correct: false,
          feedback: 'Incorrecto. No altera las relaciones del modelo, pero inutiliza la medida para gráficos y cálculos posteriores.'
        }
      ],
      explanation: 'La función FORMAT devuelve un valor de tipo texto (STRING). Para aplicar símbolos de moneda o porcentaje sin perder el tipo numérico, se configura la propiedad de formato de la medida.'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Auditoría de Clientes Activos no aditivos e Ingreso por Cliente Activo en 2024',
    language: 'sql',
    prompt: 'En Mercado Brisa, audita para el año `2024` (pedidos con `status = \'completed\'`) por cada `region` el error de sumar los conteos únicos mensuales (`suma_falsa_mensual`) frente al `DISTINCTCOUNT` anual real (`distinctcount_anual_real`). En el CTE `anual_real`, calcula `distinctcount_anual_real` (`COUNT(DISTINCT o.customer_id)`) e `ingreso_por_cliente_activo_usd` (`ROUND(SUM(o.total_usd) / NULLIF(COUNT(DISTINCT o.customer_id), 0), 2)`). Finalmente devuelve: `region`, `suma_falsa_mensual`, `distinctcount_anual_real`, `clientes_duplicados_error` (`sm.suma_falsa_mensual - a.distinctcount_anual_real`) e `ingreso_por_cliente_activo_usd`, ordenando por `distinctcount_anual_real DESC`.',
    starterCode: 'WITH clientes_mes AS (\n  SELECT\n    s.region,\n    cal.month,\n    COUNT(DISTINCT o.customer_id) AS clientes_mes_unicos\n  FROM orders o\n  INNER JOIN stores s ON o.store_id = s.store_id\n  INNER JOIN calendar cal ON o.order_date = cal.calendar_date\n  WHERE o.status = \'completed\' AND cal.year = 2024\n  GROUP BY s.region, cal.month\n),\nsuma_mensual AS (\n  SELECT region, SUM(clientes_mes_unicos) AS suma_falsa_mensual\n  FROM clientes_mes\n  GROUP BY region\n),\nanual_real AS (\n  SELECT\n    s.region,\n    -- TODO: Calcula distinctcount_anual_real y el ingreso_por_cliente_activo_usd\n    COUNT(o.order_id) AS distinctcount_anual_real,\n    0.0 AS ingreso_por_cliente_activo_usd\n  FROM orders o\n  INNER JOIN stores s ON o.store_id = s.store_id\n  INNER JOIN calendar cal ON o.order_date = cal.calendar_date\n  WHERE o.status = \'completed\' AND cal.year = 2024\n  GROUP BY s.region\n)\nSELECT\n  a.region,\n  sm.suma_falsa_mensual,\n  a.distinctcount_anual_real,\n  sm.suma_falsa_mensual - a.distinctcount_anual_real AS clientes_duplicados_error,\n  a.ingreso_por_cliente_activo_usd\nFROM anual_real a\nINNER JOIN suma_mensual sm ON a.region = sm.region\nORDER BY a.distinctcount_anual_real DESC;',
    expected: 'WITH clientes_mes AS (\n  SELECT\n    s.region,\n    cal.month,\n    COUNT(DISTINCT o.customer_id) AS clientes_mes_unicos\n  FROM orders o\n  INNER JOIN stores s ON o.store_id = s.store_id\n  INNER JOIN calendar cal ON o.order_date = cal.calendar_date\n  WHERE o.status = \'completed\' AND cal.year = 2024\n  GROUP BY s.region, cal.month\n),\nsuma_mensual AS (\n  SELECT region, SUM(clientes_mes_unicos) AS suma_falsa_mensual\n  FROM clientes_mes\n  GROUP BY region\n),\nanual_real AS (\n  SELECT\n    s.region,\n    COUNT(DISTINCT o.customer_id) AS distinctcount_anual_real,\n    ROUND(SUM(o.total_usd) / NULLIF(COUNT(DISTINCT o.customer_id), 0), 2) AS ingreso_por_cliente_activo_usd\n  FROM orders o\n  INNER JOIN stores s ON o.store_id = s.store_id\n  INNER JOIN calendar cal ON o.order_date = cal.calendar_date\n  WHERE o.status = \'completed\' AND cal.year = 2024\n  GROUP BY s.region\n)\nSELECT\n  a.region,\n  sm.suma_falsa_mensual,\n  a.distinctcount_anual_real,\n  sm.suma_falsa_mensual - a.distinctcount_anual_real AS clientes_duplicados_error,\n  a.ingreso_por_cliente_activo_usd\nFROM anual_real a\nINNER JOIN suma_mensual sm ON a.region = sm.region\nORDER BY a.distinctcount_anual_real DESC;',
    orderMatters: true,
    hints: [
      'En anual_real usa COUNT(DISTINCT o.customer_id) AS distinctcount_anual_real para contar cada cliente una sola vez en todo 2024.',
      'Calcula ROUND(SUM(o.total_usd) / NULLIF(COUNT(DISTINCT o.customer_id), 0), 2) AS ingreso_por_cliente_activo_usd.',
      'En el SELECT final, clientes_duplicados_error muestra cuántas veces se contaron de más los clientes recurrentes al sumar los meses.'
    ],
    solution: 'WITH clientes_mes AS (\n  SELECT\n    s.region,\n    cal.month,\n    COUNT(DISTINCT o.customer_id) AS clientes_mes_unicos\n  FROM orders o\n  INNER JOIN stores s ON o.store_id = s.store_id\n  INNER JOIN calendar cal ON o.order_date = cal.calendar_date\n  WHERE o.status = \'completed\' AND cal.year = 2024\n  GROUP BY s.region, cal.month\n),\nsuma_mensual AS (\n  SELECT region, SUM(clientes_mes_unicos) AS suma_falsa_mensual\n  FROM clientes_mes\n  GROUP BY region\n),\nanual_real AS (\n  SELECT\n    s.region,\n    COUNT(DISTINCT o.customer_id) AS distinctcount_anual_real,\n    ROUND(SUM(o.total_usd) / NULLIF(COUNT(DISTINCT o.customer_id), 0), 2) AS ingreso_por_cliente_activo_usd\n  FROM orders o\n  INNER JOIN stores s ON o.store_id = s.store_id\n  INNER JOIN calendar cal ON o.order_date = cal.calendar_date\n  WHERE o.status = \'completed\' AND cal.year = 2024\n  GROUP BY s.region\n)\nSELECT\n  a.region,\n  sm.suma_falsa_mensual,\n  a.distinctcount_anual_real,\n  sm.suma_falsa_mensual - a.distinctcount_anual_real AS clientes_duplicados_error,\n  a.ingreso_por_cliente_activo_usd\nFROM anual_real a\nINNER JOIN suma_mensual sm ON a.region = sm.region\nORDER BY a.distinctcount_anual_real DESC;',
    solutionExplanation: 'Demuestra por qué `DISTINCTCOUNT` en DAX no suma los meses en el total anual: en Cono Sur hubo `724` clientes únicos en 2024 (`$1,269.37` por cliente activo), mientras que sumar los 12 meses arroja `1 918` (`1 194` conteos repetidos).',
    expectedOutputTable: [
      {
        region: 'Cono Sur',
        suma_falsa_mensual: 1918,
        distinctcount_anual_real: 724,
        clientes_duplicados_error: 1194,
        ingreso_por_cliente_activo_usd: 1269.37
      },
      {
        region: 'Andina',
        suma_falsa_mensual: 1894,
        distinctcount_anual_real: 721,
        clientes_duplicados_error: 1173,
        ingreso_por_cliente_activo_usd: 1190.47
      },
      {
        region: 'Iberia',
        suma_falsa_mensual: 1087,
        distinctcount_anual_real: 376,
        clientes_duplicados_error: 711,
        ingreso_por_cliente_activo_usd: 1570.37
      },
      {
        region: 'Norteamérica',
        suma_falsa_mensual: 822,
        distinctcount_anual_real: 343,
        clientes_duplicados_error: 479,
        ingreso_por_cliente_activo_usd: 1060.35
      }
    ]
  },

  roleNotes: {
    de: 'No entregues tablas preagregadas por mes que solo contengan `unique_customers_count` como entero si el reporte necesita mostrar totales trimestrales o anuales; entrega el grano atómico o estructuras HyperLogLog.',
    da: 'Cuando alguien cuestione por qué la fila Total de una tabla en Power BI no coincide con la suma de las filas de arriba en una métrica de clientes o de porcentaje, explica la diferencia entre métricas aditivas y no aditivas.',
    bi: 'Usa Performance Analyzer y DAX Studio (Server Timings) para verificar que tus medidas pasen más del 80 % del tiempo en el Storage Engine y no generen materializaciones masivas por usar `FILTER` sobre tablas de hechos.'
  },

  summary: [
    'Nunca pases una tabla de hechos completa a FILTER dentro de CALCULATE; usa predicados de columna directos.',
    'En DAX la fila de Total reevalúa la medida en el contexto global; por eso DISTINCTCOUNT y los porcentajes no suman las filas.',
    'Nunca promedies porcentajes con AVERAGEX ni sumes conteos únicos mensuales para obtener el total anual.',
    'Evita IFERROR para proteger divisiones (usa DIVIDE) y evita FORMAT en medidas que deban conservar tipo numérico.'
  ],

  flashcards: [
    {
      id: 'fc-bi2-dax-06-a',
      front: '¿Por qué `CALCULATE([Ventas], FILTER(\'orders\', \'orders\'[status] = "completed"))` es un antipatrón de rendimiento?',
      back: 'Porque obliga a iterar toda la tabla de hechos `orders` expandida en lugar de filtrar únicamente los valores únicos de la columna `\'orders\'[status]` en el Storage Engine.'
    },
    {
      id: 'fc-bi2-dax-06-b',
      front: '¿Por qué la fila Total de una matriz en Power BI muestra menos clientes que la suma de los 12 meses cuando usas `DISTINCTCOUNT`?',
      back: 'Porque un cliente que compró en varios meses cuenta una vez en cada mes, pero en el contexto del Total Anual se cuenta una sola vez.'
    },
    {
      id: 'fc-bi2-dax-06-c',
      front: '¿Por qué no debes usar `FORMAT([Medida], "$#,##0")` dentro del código DAX de una medida?',
      back: 'Porque transforma el número en texto (`STRING`), rompiendo el ordenamiento numérico y los gráficos de ejes continuos.'
    }
  ],

  glossaryTerms: [
    'bi2-dax-variables-divide',
    'bi2-dax-funciones-iteradoras',
    'c11-additivity-hll'
  ],

  sources: [
    {
      title: 'Microsoft Learn — Avoid using FILTER as a filter argument in DAX',
      url: 'https://learn.microsoft.com/en-us/power-bi/guidance/dax-avoid-avoid-filter-as-filter-argument',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Impacto en el motor VertiPaq al pasar tablas completas a FILTER en lugar de predicados de columna.'
    },
    {
      title: 'Microsoft Learn — Appropriate use of error functions in DAX',
      url: 'https://learn.microsoft.com/en-us/power-bi/guidance/dax-error-functions',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Penalización del Formula Engine al usar IFERROR o ISERROR frente a funciones defensivas como DIVIDE.'
    },
    {
      title: 'SQLBI DAX Guide — FILTER Function Reference and Performance Notes',
      url: 'https://dax.guide/filter/',
      publisher: 'SQLBI',
      accessed: '2026-10-29',
      supports: 'Costo de materialización al iterar tablas de hechos con FILTER frente a filtros de columna.'
    }
  ],

  aiNotes: 'Los dos aspectos centrales aquí son explicar por qué `FILTER(orders, ...)` es lento comparado con un predicado de columna en el Storage Engine, y por qué es correcto que en una matriz de Power BI la fila Total de `DISTINCTCOUNT` o de un porcentaje no sea la suma de las filas superiores.'
};

export default lesson;
