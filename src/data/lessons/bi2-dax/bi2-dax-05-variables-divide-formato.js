const lesson = {
  id: 'bi2-dax-05-variables-divide-formato',
  moduleId: 'bi2-dax',
  tracks: ['bi'],
  level: 2,
  order: 5,
  title: 'Variables (VAR / RETURN), DIVIDE y formato limpio en DAX',
  subtitle: 'Variables (VAR / RETURN), manejo de divisiones con DIVIDE y formato limpio',
  minutes: 20,
  prerequisites: ['bi2-dax-04-funciones-iteradoras'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), un analista quiere calcular la participación de cada región usando variables y escribe: `VAR _Ventas = [Ventas Completadas USD] RETURN DIVIDE(_Ventas, CALCULATE(_Ventas, REMOVEFILTERS(\'stores\'[region])))`. Para su sorpresa, las cuatro regiones muestran exactamente `100.00 %` (`1.00`) en lugar de `32.85 %`, `31.75 %`, `21.51 %` y `13.89 %`. ¿Por qué `CALCULATE` no pudo cambiar el valor de la variable `_Ventas` y cómo ayudan `VAR` y `DIVIDE` a escribir medidas más rápidas y legibles?',

  objectives: [
    'Estructurar medidas complejas con bloques VAR y RETURN para evaluar cada subexpresión una sola vez.',
    'Explicar por qué una variable DAX es una constante inmutable evaluada en el contexto donde se declara.',
    'Utilizar DIVIDE y las convenciones de citación de tablas y medidas para prevenir errores de división por cero y ambigüedad.'
  ],

  sections: [
    {
      id: 'variables-var-return-evaluacion-unica',
      heading: 'Variables VAR / RETURN: evaluar una vez y leer con claridad',
      body: 'Sin variables, una medida de margen porcentual repite la misma subexpresión dos o tres veces: `IF([Ingreso Neto USD] = 0, BLANK(), ([Ingreso Neto USD] - [Costo Directo USD]) / [Ingreso Neto USD])`. Eso obliga al motor a evaluar `[Ingreso Neto USD]` múltiples veces y dificulta la lectura.\n\nCon **VAR** y **RETURN**, declaras cada paso con un nombre descriptivo. El motor lo calcula una única vez y reutiliza el resultado almacenado en memoria. Además, depurar una fórmula larga resulta inmediato. Basta con cambiar temporalmente la línea después de `RETURN` por cualquiera de las variables intermedias (`RETURN _CostoDirecto`) para comprobar su valor en el visual.',
      example: {
        language: 'sql',
        code: '-- Equivalente SQL modular (CTEs) de una medida con VAR _Brutas, VAR _Reembolsos y DIVIDE:\nWITH reembolsos_pedido AS (\n  SELECT order_id, SUM(refund_amount_usd) AS reembolsado_usd\n  FROM refunds\n  WHERE status = \'processed\'\n  GROUP BY order_id\n),\nmetricas_region AS (\n  SELECT\n    s.region,\n    ROUND(SUM(o.total_usd), 2) AS ventas_brutas_usd,\n    ROUND(SUM(COALESCE(r.reembolsado_usd, 0)), 2) AS reembolsos_usd,\n    ROUND(SUM(o.total_usd) - SUM(COALESCE(r.reembolsado_usd, 0)), 2) AS ventas_netas_usd\n  FROM orders o\n  INNER JOIN stores s ON o.store_id = s.store_id\n  LEFT JOIN reembolsos_pedido r ON o.order_id = r.order_id\n  WHERE o.status = \'completed\'\n  GROUP BY s.region\n)\nSELECT\n  region,\n  ventas_brutas_usd,\n  reembolsos_usd,\n  ventas_netas_usd,\n  ROUND(100.0 * reembolsos_usd / NULLIF(ventas_brutas_usd, 0), 2) AS tasa_reembolso_pct,\n  ROUND(100.0 * ventas_netas_usd / NULLIF(ventas_brutas_usd, 0), 2) AS retencion_ingresos_pct\nFROM metricas_region\nORDER BY ventas_netas_usd DESC;',
        expectedOutput: [
          {
            region: 'Cono Sur',
            ventas_brutas_usd: 2059786.39,
            reembolsos_usd: 77991.82,
            ventas_netas_usd: 1981794.57,
            tasa_reembolso_pct: 3.79,
            retencion_ingresos_pct: 96.21
          },
          {
            region: 'Andina',
            ventas_brutas_usd: 1990554.12,
            reembolsos_usd: 115379.23,
            ventas_netas_usd: 1875174.89,
            tasa_reembolso_pct: 5.8,
            retencion_ingresos_pct: 94.2
          },
          {
            region: 'Iberia',
            ventas_brutas_usd: 1348369.68,
            reembolsos_usd: 43170.94,
            ventas_netas_usd: 1305198.74,
            tasa_reembolso_pct: 3.2,
            retencion_ingresos_pct: 96.8
          },
          {
            region: 'Norteamérica',
            ventas_brutas_usd: 870752.23,
            reembolsos_usd: 37992.53,
            ventas_netas_usd: 832759.7,
            tasa_reembolso_pct: 4.36,
            retencion_ingresos_pct: 95.64
          }
        ]
      }
    },
    {
      id: 'inmutabilidad-contexto-variables',
      heading: 'Por qué CALCULATE no puede modificar una variable ya declarada',
      body: 'El error más frecuente con `VAR` es creer que guarda una fórmula que se reevaluará más adelante. En DAX, una variable se evalúa en el contexto de filtro exacto donde se define. A partir de ese instante es una **constante inmutable**.\n\nEn la fila `Cono Sur`, cuando escribes `VAR _Ventas = [Ventas Completadas USD]`, la variable `_Ventas` toma el número fijo `2059786.39`. Si debajo escribes `CALCULATE(_Ventas, REMOVEFILTERS(\'stores\'[region]))`, equivale a evaluar `CALCULATE(2059786.39, REMOVEFILTERS(\'stores\'[region]))`. Un número constante no cambia aunque modifiques los filtros, por lo que el cociente devuelve `2059786.39 / 2059786.39 = 100 %`. Debes definir dos variables separadas: `VAR _VentasRegion = [Ventas Completadas USD]` y `VAR _VentasTotales = CALCULATE([Ventas Completadas USD], REMOVEFILTERS(\'stores\'[region]))`.'
    },
    {
      id: 'funcion-divide-y-convenciones-formato',
      heading: 'DIVIDE frente a / y convención para citar columnas y medidas',
      body: 'El operador de barra (`/`) devuelve `Infinity` o `NaN` cuando el denominador es cero, rompiendo los visuales. La función **DIVIDE** (`DIVIDE(numerador, denominador, [alternativo])`) verifica si el denominador es cero o `BLANK` y devuelve `BLANK()` por defecto. De este modo, Power BI oculta automáticamente las filas sin actividad. Solo pasa `0` como tercer argumento si deseas forzar que aparezcan todas las categorías vacías con `0.00 %`.\n\nPor último, aplica sin excepción la convención de formato de DAX para distinguir columnas de medidas:\n- **Columnas:** incluyen siempre el nombre de su tabla antes del corchete (`\'orders\'[total_usd]`).\n- **Medidas:** nunca llevan el nombre de la tabla (`[Ingreso Neto USD]`). Así recuerdas al instante que una medida ejecuta un `CALCULATE` implícito.'
    }
  ],

  workedExample: {
    title: 'Trampa de inmutabilidad de VAR dentro de CALCULATE frente a declaración en contextos separados',
    description: 'En Mercado Brisa, compara qué devuelve la medida de participación regional cuando envuelves una variable constante en `CALCULATE` frente a declarar `_VentasRegion` y `_VentasTotales` en dos variables independientes:',
    steps: [
      {
        label: 'Paso 1 — Error frecuente: pasar una variable ya evaluada dentro de CALCULATE',
        explanation: 'Como `VAR _Ventas` ya fijó el importe de la región actual, `CALCULATE(_Ventas, REMOVEFILTERS(stores[region]))` devuelve exactamente el mismo importe de la región y el cociente da 100 % en todas las filas.',
        code: '-- Antipatrón en DAX: VAR _Ventas = [Ventas] RETURN DIVIDE(_Ventas, CALCULATE(_Ventas, REMOVEFILTERS(stores[region])))\nWITH ventas_region AS (\n  SELECT\n    s.region,\n    ROUND(SUM(o.total_usd), 2) AS var_ventas_constante_usd\n  FROM orders o\n  INNER JOIN stores s ON o.store_id = s.store_id\n  WHERE o.status = \'completed\'\n  GROUP BY s.region\n)\nSELECT\n  region,\n  var_ventas_constante_usd,\n  var_ventas_constante_usd AS calculate_sobre_var_usd,\n  ROUND(100.0 * var_ventas_constante_usd / NULLIF(var_ventas_constante_usd, 0), 2) AS participacion_erronea_pct\nFROM ventas_region\nORDER BY var_ventas_constante_usd DESC;',
        expectedOutput: [
          {
            region: 'Cono Sur',
            var_ventas_constante_usd: 2059786.39,
            calculate_sobre_var_usd: 2059786.39,
            participacion_erronea_pct: 100
          },
          {
            region: 'Andina',
            var_ventas_constante_usd: 1990554.12,
            calculate_sobre_var_usd: 1990554.12,
            participacion_erronea_pct: 100
          },
          {
            region: 'Iberia',
            var_ventas_constante_usd: 1348369.68,
            calculate_sobre_var_usd: 1348369.68,
            participacion_erronea_pct: 100
          },
          {
            region: 'Norteamérica',
            var_ventas_constante_usd: 870752.23,
            calculate_sobre_var_usd: 870752.23,
            participacion_erronea_pct: 100
          }
        ]
      },
      {
        label: 'Paso 2 — Solución limpia: evaluar CALCULATE al definir la segunda variable',
        explanation: 'Al escribir `VAR _VentasRegion = [Ventas Completadas USD]` y `VAR _VentasTotales = CALCULATE([Ventas Completadas USD], REMOVEFILTERS(\'stores\'[region]))`, cada variable captura su propio contexto antes de ejecutar `RETURN DIVIDE(_VentasRegion, _VentasTotales)`.',
        code: '-- Medida DAX correcta con dos variables evaluadas en sus respectivos contextos:\nWITH ventas_region AS (\n  SELECT\n    s.region,\n    ROUND(SUM(o.total_usd), 2) AS var_ventas_region_usd,\n    ROUND(SUM(SUM(o.total_usd)) OVER (), 2) AS var_ventas_totales_usd\n  FROM orders o\n  INNER JOIN stores s ON o.store_id = s.store_id\n  WHERE o.status = \'completed\'\n  GROUP BY s.region\n)\nSELECT\n  region,\n  var_ventas_region_usd,\n  var_ventas_totales_usd,\n  ROUND(100.0 * var_ventas_region_usd / NULLIF(var_ventas_totales_usd, 0), 2) AS participacion_correcta_pct\nFROM ventas_region\nORDER BY var_ventas_region_usd DESC;',
        expectedOutput: [
          {
            region: 'Cono Sur',
            var_ventas_region_usd: 2059786.39,
            var_ventas_totales_usd: 6269462.42,
            participacion_correcta_pct: 32.85
          },
          {
            region: 'Andina',
            var_ventas_region_usd: 1990554.12,
            var_ventas_totales_usd: 6269462.42,
            participacion_correcta_pct: 31.75
          },
          {
            region: 'Iberia',
            var_ventas_region_usd: 1348369.68,
            var_ventas_totales_usd: 6269462.42,
            participacion_correcta_pct: 21.51
          },
          {
            region: 'Norteamérica',
            var_ventas_region_usd: 870752.23,
            var_ventas_totales_usd: 6269462.42,
            participacion_correcta_pct: 13.89
          }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: '¿Qué ocurre cuando escribes `VAR _Actual = [Ventas USD] RETURN CALCULATE(_Actual, SAMEPERIODLASTYEAR(\'calendar\'[calendar_date]))`?',
      options: [
        {
          id: 'a',
          text: 'Devuelve las ventas del periodo actual (no las del año pasado), porque _Actual ya se evaluó como un valor constante antes de entrar en CALCULATE.',
          correct: true,
          feedback: 'Exacto. Las variables en DAX se evalúan en el contexto donde se declaran y su valor no cambia dentro de un CALCULATE posterior.'
        },
        {
          id: 'b',
          text: 'Devuelve las ventas del año pasado ahorrando memoria.',
          correct: false,
          feedback: 'Incorrecto. Para obtener el año pasado, CALCULATE([Ventas USD], SAMEPERIODLASTYEAR(...)) debe invocarse al definir la variable.'
        },
        {
          id: 'c',
          text: 'Arroja un error de sintaxis porque CALCULATE no acepta variables como primer argumento.',
          correct: false,
          feedback: 'Incorrecto. Es sintácticamente válido, lo que lo convierte en un error lógico silencioso muy común.'
        }
      ],
      explanation: 'En DAX las variables tienen alcance léxico y evaluación inmediata en el contexto de su declaración; no son macros de texto que se reevalúen después.'
    },
    {
      id: 'c2',
      type: 'mcq',
      prompt: '¿Cuál es la convención estándar en DAX para distinguir una referencia a una columna de una referencia a una medida?',
      options: [
        {
          id: 'a',
          text: 'Incluir siempre el nombre de la tabla en las columnas (\'orders\'[total_usd]) y omitirlo siempre en las medidas ([Ingreso Neto USD]).',
          correct: true,
          feedback: 'Correcto. Como una columna requiere contexto de fila y una medida incluye un CALCULATE implícito, esta regla evita confundir su comportamiento.'
        },
        {
          id: 'b',
          text: 'Incluir el nombre de la tabla en las medidas y omitirlo en las columnas.',
          correct: false,
          feedback: 'Incorrecto. Es exactamente al revés: dos tablas pueden tener una columna [status], mientras que los nombres de medidas son únicos en todo el modelo.'
        },
        {
          id: 'c',
          text: 'Escribir las columnas en mayúsculas y las medidas en minúsculas.',
          correct: false,
          feedback: 'Incorrecto. La distinción oficial se hace calificando las columnas con su tabla y dejando las medidas solo entre corchetes.'
        }
      ],
      explanation: 'Calificar siempre las columnas con su tabla (\'tabla\'[columna]) y escribir las medidas sin tabla ([Medida]) permite distinguir al instante qué expresión ejecutará transición de contexto automática.'
    },
    {
      id: 'c3',
      type: 'fill-code',
      prompt: 'Completa la medida DAX que calcula el porcentaje de margen neto usando variables `VAR` / `RETURN` y división segura:',
      template: 'Margen Neto % =\n{{b1}} _IngresoNeto = [Ingreso Neto USD]\nVAR _CostoDirecto = [Costo Directo USD]\nRETURN\n    {{b2}} ( _IngresoNeto - _CostoDirecto, _IngresoNeto )',
      blanks: [
        { id: 'b1', accepted: ['VAR', 'var'] },
        { id: 'b2', accepted: ['DIVIDE', 'divide'] }
      ],
      explanation: 'VAR evalúa [Ingreso Neto USD] una sola vez para usarlo tanto en la resta del numerador como en el denominador de DIVIDE.'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Conciliación de Ingreso Neto, Costo Directo y Margen Neto % con variables por segmento',
    language: 'sql',
    prompt: 'En Mercado Brisa, concilia por cada `segment` de `customers` (sobre pedidos con `status = \'completed\'`) las medidas DAX estructuradas con `VAR` y `DIVIDE`. Usando los CTEs `reembolsos_pedido` (`status = \'processed\'`) y `costo_pedido`, calcula por `segment`: `subtotal_usd` (`ROUND(SUM(o.subtotal_usd), 2)`), `descuento_usd` (`ROUND(SUM(o.discount_usd), 2)`), `ingreso_neto_usd` (`ROUND(SUM(o.total_usd) - SUM(COALESCE(r.reembolsado_usd, 0)), 2)`), `costo_directo_usd` (`ROUND(SUM(COALESCE(cp.costo_usd, 0)), 2)`) y `margen_neto_pct` (`ROUND(100.0 * (ingreso_neto - costo_directo) / NULLIF(ingreso_neto, 0), 2)`). Ordena por `ingreso_neto_usd DESC`.',
    starterCode: 'WITH reembolsos_pedido AS (\n  SELECT order_id, SUM(refund_amount_usd) AS reembolsado_usd\n  FROM refunds\n  WHERE status = \'processed\'\n  GROUP BY order_id\n),\ncosto_pedido AS (\n  SELECT oi.order_id, SUM(oi.qty * p.unit_cost_usd) AS costo_usd\n  FROM order_items oi\n  INNER JOIN products p ON oi.product_id = p.product_id\n  GROUP BY oi.order_id\n)\nSELECT\n  c.segment,\n  ROUND(SUM(o.subtotal_usd), 2) AS subtotal_usd,\n  ROUND(SUM(o.discount_usd), 2) AS descuento_usd,\n  ROUND(SUM(o.total_usd) - SUM(COALESCE(r.reembolsado_usd, 0)), 2) AS ingreso_neto_usd,\n  ROUND(SUM(COALESCE(cp.costo_usd, 0)), 2) AS costo_directo_usd,\n  -- TODO: Calcula margen_neto_pct equivaliendo a DIVIDE(_IngresoNeto - _CostoDirecto, _IngresoNeto) en porcentaje (2 decimales)\n  0.0 AS margen_neto_pct\nFROM orders o\nINNER JOIN customers c ON o.customer_id = c.customer_id\nLEFT JOIN reembolsos_pedido r ON o.order_id = r.order_id\nLEFT JOIN costo_pedido cp ON o.order_id = cp.order_id\nWHERE o.status = \'completed\'\nGROUP BY c.segment\nORDER BY ingreso_neto_usd DESC;',
    expected: 'WITH reembolsos_pedido AS (\n  SELECT order_id, SUM(refund_amount_usd) AS reembolsado_usd\n  FROM refunds\n  WHERE status = \'processed\'\n  GROUP BY order_id\n),\ncosto_pedido AS (\n  SELECT oi.order_id, SUM(oi.qty * p.unit_cost_usd) AS costo_usd\n  FROM order_items oi\n  INNER JOIN products p ON oi.product_id = p.product_id\n  GROUP BY oi.order_id\n)\nSELECT\n  c.segment,\n  ROUND(SUM(o.subtotal_usd), 2) AS subtotal_usd,\n  ROUND(SUM(o.discount_usd), 2) AS descuento_usd,\n  ROUND(SUM(o.total_usd) - SUM(COALESCE(r.reembolsado_usd, 0)), 2) AS ingreso_neto_usd,\n  ROUND(SUM(COALESCE(cp.costo_usd, 0)), 2) AS costo_directo_usd,\n  ROUND(100.0 * (SUM(o.total_usd) - SUM(COALESCE(r.reembolsado_usd, 0)) - SUM(COALESCE(cp.costo_usd, 0))) / NULLIF(SUM(o.total_usd) - SUM(COALESCE(r.reembolsado_usd, 0)), 0), 2) AS margen_neto_pct\nFROM orders o\nINNER JOIN customers c ON o.customer_id = c.customer_id\nLEFT JOIN reembolsos_pedido r ON o.order_id = r.order_id\nLEFT JOIN costo_pedido cp ON o.order_id = cp.order_id\nWHERE o.status = \'completed\'\nGROUP BY c.segment\nORDER BY ingreso_neto_usd DESC;',
    orderMatters: true,
    hints: [
      'Los CTEs reembolsos_pedido y costo_pedido preagregan al grano de order_id antes del LEFT JOIN para evitar fan-out.',
      'El numerador del porcentaje es (SUM(o.total_usd) - SUM(COALESCE(r.reembolsado_usd, 0)) - SUM(COALESCE(cp.costo_usd, 0))).',
      'Divide 100.0 * numerador entre NULLIF(SUM(o.total_usd) - SUM(COALESCE(r.reembolsado_usd, 0)), 0) y redondea a 2 decimales.'
    ],
    solution: 'WITH reembolsos_pedido AS (\n  SELECT order_id, SUM(refund_amount_usd) AS reembolsado_usd\n  FROM refunds\n  WHERE status = \'processed\'\n  GROUP BY order_id\n),\ncosto_pedido AS (\n  SELECT oi.order_id, SUM(oi.qty * p.unit_cost_usd) AS costo_usd\n  FROM order_items oi\n  INNER JOIN products p ON oi.product_id = p.product_id\n  GROUP BY oi.order_id\n)\nSELECT\n  c.segment,\n  ROUND(SUM(o.subtotal_usd), 2) AS subtotal_usd,\n  ROUND(SUM(o.discount_usd), 2) AS descuento_usd,\n  ROUND(SUM(o.total_usd) - SUM(COALESCE(r.reembolsado_usd, 0)), 2) AS ingreso_neto_usd,\n  ROUND(SUM(COALESCE(cp.costo_usd, 0)), 2) AS costo_directo_usd,\n  ROUND(100.0 * (SUM(o.total_usd) - SUM(COALESCE(r.reembolsado_usd, 0)) - SUM(COALESCE(cp.costo_usd, 0))) / NULLIF(SUM(o.total_usd) - SUM(COALESCE(r.reembolsado_usd, 0)), 0), 2) AS margen_neto_pct\nFROM orders o\nINNER JOIN customers c ON o.customer_id = c.customer_id\nLEFT JOIN reembolsos_pedido r ON o.order_id = r.order_id\nLEFT JOIN costo_pedido cp ON o.order_id = cp.order_id\nWHERE o.status = \'completed\'\nGROUP BY c.segment\nORDER BY ingreso_neto_usd DESC;',
    solutionExplanation: 'Concilia exactamente la medida DAX `Margen Neto % = VAR _Neto = [Ingreso Neto USD] VAR _Costo = [Costo Directo USD] RETURN DIVIDE(_Neto - _Costo, _Neto)` para los tres segmentos (`52.32 %`, `52.50 %` y `52.87 %`).',
    expectedOutputTable: [
      {
        segment: 'pro_barista',
        subtotal_usd: 2189795.58,
        descuento_usd: 23630.99,
        ingreso_neto_usd: 2392842.76,
        costo_directo_usd: 1141004.09,
        margen_neto_pct: 52.32
      },
      {
        segment: 'retail',
        subtotal_usd: 2123739.67,
        descuento_usd: 23087.62,
        ingreso_neto_usd: 2330962.33,
        costo_directo_usd: 1107112.16,
        margen_neto_pct: 52.5
      },
      {
        segment: 'cafeteria_b2b',
        subtotal_usd: 1150615.93,
        descuento_usd: 13042.8,
        ingreso_neto_usd: 1271122.81,
        costo_directo_usd: 599046.06,
        margen_neto_pct: 52.87
      }
    ]
  },

  roleNotes: {
    de: 'Las vistas y CTEs en SQL juegan el mismo papel de descomposición legible que las variables `VAR` en DAX; mantén los mismos nombres de pasos intermedios (`ingreso_bruto`, `reembolsos_procesados`, `ingreso_neto`) en ambas capas.',
    da: 'En SQL usa `NULLIF(denominador, 0)` para replicar el comportamiento por defecto de `DIVIDE(numerador, denominador)` en DAX, que devuelve `BLANK` (equivalente a `NULL`) cuando el denominador es cero.',
    bi: 'Formatea cada medida DAX con sangría de 4 espacios, una variable por concepto intermedio, tablas citadas en columnas (`\'orders\'[total_usd]`) y medidas sin nombre de tabla (`[Ingreso Neto USD]`).'
  },

  summary: [
    'Las variables VAR evalúan su expresión una sola vez y evitan recalcular la misma medida varias veces.',
    'Una variable DAX es inmutable tras declararse: CALCULATE no puede alterar el contexto de una variable ya calculada.',
    'DIVIDE resuelve divisiones entre cero o BLANK devolviendo BLANK por defecto sin evaluar dos veces el denominador.',
    'Califica siempre las columnas con su tabla (\'tabla\'[columna]) y nunca califiques las medidas ([Medida]).'
  ],

  flashcards: [
    {
      id: 'fc-bi2-dax-05-a',
      front: '¿En qué momento se evalúa el contexto de filtro de una variable `VAR` en DAX?',
      back: 'En el momento y ámbito exactos en que se define el `VAR`; después su resultado es una constante que no cambia aunque se pase dentro de `CALCULATE`.'
    },
    {
      id: 'fc-bi2-dax-05-b',
      front: '¿Por qué es preferible `DIVIDE(A, B)` frente a `IF(B = 0, BLANK(), A / B)`?',
      back: 'Porque `DIVIDE` evalúa la expresión `B` una sola vez y maneja automáticamente tanto el cero como `BLANK` en el denominador.'
    },
    {
      id: 'fc-bi2-dax-05-c',
      front: '¿Por qué nunca debes escribir el nombre de la tabla delante de una medida (`\'orders\'[Ventas USD]`)?',
      back: 'Para distinguirla visualmente de una columna física y recordar que toda medida incluye un `CALCULATE` implícito con transición de contexto.'
    }
  ],

  glossaryTerms: [
    'bi2-dax-variables-divide',
    'bi2-dax-calculate-transicion'
  ],

  sources: [
    {
      title: 'Microsoft Learn — Use variables to improve your DAX formulas',
      url: 'https://learn.microsoft.com/en-us/dax/best-practices/dax-variables',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Mejora de rendimiento y legibilidad mediante evaluación única en bloques VAR / RETURN.'
    },
    {
      title: 'Microsoft Learn — DIVIDE function vs. divide operator (/) in DAX',
      url: 'https://learn.microsoft.com/en-us/dax/best-practices/dax-divide-function-operator',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Manejo seguro de divisiones entre cero y BLANK con DIVIDE frente al operador /.'
    },
    {
      title: 'SQLBI DAX Guide — DIVIDE Function Reference',
      url: 'https://dax.guide/divide/',
      publisher: 'SQLBI',
      accessed: '2026-10-29',
      supports: 'Comportamiento del tercer argumento opcional (alternateResult) y propagación de BLANK en visuales.'
    }
  ],

  aiNotes: 'El malentendido más habitual es declarar `VAR _X = [Medida]` y luego pasar `_X` dentro de `CALCULATE(_X, ...)` esperando que cambie de contexto. Recuerda siempre a la persona que `VAR` guarda el resultado ya evaluado, no la expresión.'
};

export default lesson;
