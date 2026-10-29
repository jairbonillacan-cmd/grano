const lesson = {
  id: 'c0-numeros-04-proporciones-tasas-bps',
  moduleId: 'c0-numeros',
  tracks: ['core'],
  level: 0,
  order: 4,
  title: 'Proporciones, tasas, puntos porcentuales y puntos base',
  minutes: 15,
  prerequisites: ['c0-numeros-03-asimetria-sesgo'],
  contentVersion: 1,

  hook: 'En la tabla `payments` de Mercado Brisa, los cobros rechazados con `billetera_digital` representan el `7.73 %` de los intentos, mientras que en `transferencia_spei` llegan al `11.60 %`. En la reunión semanal, una persona dice que los rechazos subieron un `3.87 %` entre ambos métodos y otra asegura que subieron un `50.1 %`. ¿Por qué ambas cifras nacen de los mismos datos y cómo evitas ese malentendido usando puntos porcentuales y puntos base?',

  objectives: [
    'Distinguir entre una proporción, una razón general y una tasa definida en un periodo de tiempo.',
    'Expresar diferencias entre porcentajes en puntos porcentuales (pp) y puntos base (bps) sin confundirlas con la variación relativa.',
    'Calcular proporciones agregadas en SQL mediante SUM(numerador) / SUM(denominador) evitando promediar porcentajes fila por fila.'
  ],

  sections: [
    {
      id: 'razon-proporcion-y-tasa',
      heading: 'Qué separa a una proporción de una razón y de una tasa',
      body: 'Cuando divides un número entre otro para comparar tamaños, conviene distinguir tres indicadores.\n\nUna **razón** (*ratio*) divide dos cantidades cualesquiera, aunque el numerador no sea parte del denominador. Por ejemplo, dividir `42 000` líneas de `order_items` entre `18 000` pedidos de `orders` da `2.33` artículos por pedido.\n\nUna **proporción** es una fracción donde el numerador sí es un subconjunto del denominador: $\\frac{A}{A + B}$. Por eso vive siempre entre `0` y `1` (`0 %` a `100 %`). En `orders`, los `1440` pedidos con `status = \'refunded\'` entre los `18 000` pedidos forman una proporción de `0.08` (`8.00 %`).\n\nUna **tasa** incorpora el tiempo o la exposición en el denominador, como devoluciones mensuales por cada mil pedidos.'
    },
    {
      id: 'puntos-porcentuales-y-puntos-base',
      heading: 'Variación relativa frente a puntos porcentuales y puntos base',
      body: 'Comparar dos porcentajes diciendo que algo "subió un X %" provoca malentendidos constantes. En `payments`, `billetera_digital` falla el `7.73 %` de las veces y `transferencia_spei` falla el `11.60 %`.\n\nSi restas ambos porcentajes (`11.60 - 7.73 = 3.87`), esa diferencia aritmética es de `3.87` **puntos porcentuales** (`pp`). En cambio, si divides esa diferencia entre la base inicial (`3.87 / 7.73 = +0.5006`), obtienes una variación relativa del `+50.1 %`. La tasa de fallo es un cincuenta por ciento mayor que la original.\n\nEn pagos y conversión web, donde las tasas cambian en centésimas, se usa el **punto base** (`bps`). Un punto porcentual equivale a `100` puntos base (`1 % = 100 bps` y `0.01 % = 1 bps`). Pasar de `7.73 %` (`773 bps`) a `11.60 %` (`1160 bps`) es un salto exacto de `+387 bps`.',
      example: {
        language: 'sql',
        code: 'SELECT\n  payment_method,\n  COUNT(*) AS intentos,\n  SUM(CASE WHEN status = \'failed\' THEN 1 ELSE 0 END) AS fallidos,\n  ROUND(100.0 * SUM(CASE WHEN status = \'failed\' THEN 1 ELSE 0 END) / COUNT(*), 2) AS tasa_fallo_pct,\n  ROUND(10000.0 * SUM(CASE WHEN status = \'failed\' THEN 1 ELSE 0 END) / COUNT(*), 0) AS tasa_fallo_bps\nFROM payments\nGROUP BY payment_method\nORDER BY tasa_fallo_bps DESC;',
        expectedOutput: [
          {
            payment_method: 'transferencia_spei',
            intentos: 4800,
            fallidos: 557,
            tasa_fallo_pct: 11.6,
            tasa_fallo_bps: 1160
          },
          {
            payment_method: 'efectivo_tienda',
            intentos: 4800,
            fallidos: 556,
            tasa_fallo_pct: 11.58,
            tasa_fallo_bps: 1158
          },
          {
            payment_method: 'card',
            intentos: 4800,
            fallidos: 373,
            tasa_fallo_pct: 7.77,
            tasa_fallo_bps: 777
          },
          {
            payment_method: 'billetera_digital',
            intentos: 4800,
            fallidos: 371,
            tasa_fallo_pct: 7.73,
            tasa_fallo_bps: 773
          }
        ]
      }
    },
    {
      id: 'por-que-nunca-se-promedian-porcentajes',
      heading: 'Por qué nunca debes promediar porcentajes con AVG(a / b)',
      body: 'Las proporciones y tasas no son aditivas. El porcentaje global de un grupo nunca es el promedio simple de los porcentajes de sus filas. Si calculas `AVG(numerador / denominador)` en SQL, un pedido de `20` USD pesa igual que uno de `1800` USD.\n\nEn los tres almacenes (`store_id >= 12` en `orders`), solo los pedidos pequeños (`subtotal_usd < 60`) pagan `6.50` USD de envío. El resto tiene envío gratis (`0.0` USD). Si promedias fila por fila `AVG(100.0 * shipping_usd / total_usd)` en `desktop`, obtienes `0.45 %` (`45 bps`). Pero al dividir el envío total (`409.50` USD) entre la facturación total (`1 006 882.10` USD), el peso real es `0.04 %` (`4 bps`). Suma siempre primero: `SUM(a) / SUM(b)`.'
    }
  ],

  workedExample: {
    title: 'Peso del costo de envío sobre las ventas en almacenes: AVG(a/b) frente a SUM(a)/SUM(b)',
    description: 'Compara el error de promediar el porcentaje de envío fila por fila frente a dividir la suma total de envíos entre la suma total facturada en los almacenes (`store_id >= 12`).',
    steps: [
      {
        label: 'Antipatrón: promediar los porcentajes individuales de cada fila con AVG',
        explanation: 'Al evaluar `AVG(100.0 * shipping_usd / total_usd)`, los pedidos pequeños con envío de 6.50 USD pesan igual que los pedidos grandes sin costo de envío, inflando el indicador en `desktop` a `0.45 %` (`45 bps`) frente al `0.04 %` (`4 bps`) real.',
        code: 'SELECT\n  device_type,\n  COUNT(*) AS pedidos,\n  ROUND(AVG(100.0 * shipping_usd / total_usd), 2) AS promedio_simple_filas_pct,\n  ROUND(100.0 * SUM(shipping_usd) / SUM(total_usd), 2) AS proporcion_real_ponderada_pct,\n  ROUND(10000.0 * SUM(shipping_usd) / SUM(total_usd), 0) AS proporcion_real_bps\nFROM orders\nWHERE store_id >= 12\nGROUP BY device_type\nORDER BY device_type;',
        expectedOutput: [
          {
            device_type: 'desktop',
            pedidos: 1928,
            promedio_simple_filas_pct: 0.45,
            proporcion_real_ponderada_pct: 0.04,
            proporcion_real_bps: 4
          },
          {
            device_type: 'mobile',
            pedidos: 1072,
            promedio_simple_filas_pct: 0.04,
            proporcion_real_ponderada_pct: 0.01,
            proporcion_real_bps: 1
          },
          {
            device_type: 'pos_tienda',
            pedidos: 214,
            promedio_simple_filas_pct: 0,
            proporcion_real_ponderada_pct: 0,
            proporcion_real_bps: 0
          }
        ]
      },
      {
        label: 'Solución verificada: agregar SUM(shipping_usd) y SUM(total_usd) antes de dividir',
        explanation: 'Exponiendo el numerador (`envio_total_usd`) y el denominador (`facturacion_total_usd`) junto con el porcentaje y los puntos base (`bps`), el cálculo queda auditado y libre de distorsión por tamaño de pedido.',
        code: 'SELECT\n  device_type,\n  ROUND(SUM(shipping_usd), 2) AS envio_total_usd,\n  ROUND(SUM(total_usd), 2) AS facturacion_total_usd,\n  ROUND(100.0 * SUM(shipping_usd) / SUM(total_usd), 2) AS peso_envio_pct,\n  ROUND(10000.0 * SUM(shipping_usd) / SUM(total_usd), 0) AS peso_envio_bps\nFROM orders\nWHERE store_id >= 12\nGROUP BY device_type\nORDER BY device_type;',
        expectedOutput: [
          {
            device_type: 'desktop',
            envio_total_usd: 409.5,
            facturacion_total_usd: 1006882.1,
            peso_envio_pct: 0.04,
            peso_envio_bps: 4
          },
          {
            device_type: 'mobile',
            envio_total_usd: 32.5,
            facturacion_total_usd: 563435.44,
            peso_envio_pct: 0.01,
            peso_envio_bps: 1
          },
          {
            device_type: 'pos_tienda',
            envio_total_usd: 0,
            facturacion_total_usd: 148746.06,
            peso_envio_pct: 0,
            peso_envio_bps: 0
          }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'predict-output',
      prompt: 'La tasa de conversión de un embudo pasa del `2.00 %` en enero al `2.50 %` en febrero. ¿Cuáles son el cambio en puntos porcentuales (`pp`), en puntos base (`bps`) y la variación relativa (`%`)?',
      options: [
        {
          id: 'a',
          text: '+0.50 puntos porcentuales (pp), +50 puntos base (bps) y +25.0 % de variación relativa.',
          correct: true,
          feedback: 'Exacto. La resta aritmética es 2.50 - 2.00 = +0.50 pp (+50 bps), y respecto a la base de 2.00 % representa un crecimiento relativo de 0.50 / 2.00 = +25 %.'
        },
        {
          id: 'b',
          text: '+25.0 puntos porcentuales (pp), +2500 puntos base (bps) y +0.50 % de variación relativa.',
          correct: false,
          feedback: 'Incorrecto. Has invertido la diferencia aritmética (pp) con la tasa de variación relativa (%).'
        },
        {
          id: 'c',
          text: '+0.50 puntos porcentuales (pp), +5 puntos base (bps) y +50.0 % de variación relativa.',
          correct: false,
          feedback: 'Incorrecto. Un punto porcentual equivale a 100 puntos base, por lo que 0.50 pp son 50 bps (no 5 bps).'
        }
      ],
      explanation: 'Restar dos porcentajes (`2.50 - 2.00 = 0.50`) da puntos porcentuales (`0.50 pp = 50 bps`), mientras que dividir el cambio entre el valor inicial (`0.50 / 2.00`) da la variación relativa (`+25 %`).'
    },
    {
      id: 'c2',
      type: 'mcq',
      prompt: 'En la tabla `marketing_spend`, cada fila es un día y canal con `clicks` e `impressions`. ¿Qué expresión SQL calcula correctamente el CTR (`clics / impresiones`) de cada canal en el año?',
      options: [
        {
          id: 'a',
          text: '100.0 * SUM(clicks) / SUM(impressions)',
          correct: true,
          feedback: 'Correcto. Sumar primero todos los clics y dividirlos entre todas las impresiones pondera cada día según su tráfico real.'
        },
        {
          id: 'b',
          text: 'AVG(100.0 * clicks / impressions)',
          correct: false,
          feedback: 'Incorrecto. Promediar los porcentajes diarios asigna el mismo peso a un martes con pocas impresiones que a un viernes de campaña masiva.'
        },
        {
          id: 'c',
          text: 'SUM(100.0 * clicks / impressions)',
          correct: false,
          feedback: 'Incorrecto. Sumar porcentajes diarios de 146 días arroja un número acumulado superior a 300 % sin sentido de proporción.'
        }
      ],
      explanation: 'Como las proporciones y tasas no son aditivas entre filas de distinto denominador, siempre deben agregarse como `SUM(numerador) / SUM(denominador)`.'
    },
    {
      id: 'c3',
      type: 'mcq',
      prompt: '¿Cuál de los siguientes indicadores de Mercado Brisa es estrictamente una proporción (y no una razón general que pueda superar el 100 %)?',
      options: [
        {
          id: 'a',
          text: 'Pedidos con `status = \'refunded\'` divididos entre el total de pedidos de la tabla `orders`.',
          correct: true,
          feedback: 'Exacto. Los pedidos reembolsados son un subconjunto del total de pedidos de la misma tabla, por lo que el cociente vive siempre entre 0 y 1.'
        },
        {
          id: 'b',
          text: 'Total de unidades vendidas (`SUM(qty)`) dividido entre el total de pedidos (`COUNT(order_id)`).',
          correct: false,
          feedback: 'Incorrecto. Ese cociente es una razón (unidades por pedido) cuyo valor supera 1 porque un pedido suele incluir varios productos.'
        },
        {
          id: 'c',
          text: 'Ingresos totales en dólares (`SUM(total_usd)`) divididos entre el número de tiendas físicas (`14`).',
          correct: false,
          feedback: 'Incorrecto. Dividir dólares entre tiendas compara dos magnitudes con unidades distintas (razón o promedio de facturación por tienda).'
        }
      ],
      explanation: 'En una proporción el numerador está contenido dentro del denominador (`A / (A + B)`), no tiene unidades físicas y está acotado entre `0` y `1` (`0 %` a `100 %`).'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Proporción de pedidos reembolsados en porcentaje y puntos base por dispositivo',
    language: 'sql',
    prompt: 'Calcula sobre la tabla `orders` para cada `device_type`: el total de pedidos (`total_pedidos`), el conteo de pedidos con `status = \'refunded\'` (`pedidos_reembolsados`), la proporción de reembolso en porcentaje redondeada a 2 decimales (`proporcion_reembolso_pct`) y en puntos base redondeada a 0 decimales (`proporcion_reembolso_bps`). Ordena por `device_type ASC`.',
    starterCode: 'SELECT\n  device_type,\n  COUNT(*) AS total_pedidos,\n  SUM(CASE WHEN status = \'refunded\' THEN 1 ELSE 0 END) AS pedidos_reembolsados,\n  -- Calcula proporcion_reembolso_pct multiplicando por 100.0 y redondeando a 2 decimales\n  -- Calcula proporcion_reembolso_bps multiplicando por 10000.0 y redondeando a 0 decimales\nFROM orders\nGROUP BY device_type\nORDER BY device_type ASC;',
    expected: 'SELECT\n  device_type,\n  COUNT(*) AS total_pedidos,\n  SUM(CASE WHEN status = \'refunded\' THEN 1 ELSE 0 END) AS pedidos_reembolsados,\n  ROUND(100.0 * SUM(CASE WHEN status = \'refunded\' THEN 1 ELSE 0 END) / COUNT(*), 2) AS proporcion_reembolso_pct,\n  ROUND(10000.0 * SUM(CASE WHEN status = \'refunded\' THEN 1 ELSE 0 END) / COUNT(*), 0) AS proporcion_reembolso_bps\nFROM orders\nGROUP BY device_type\nORDER BY device_type ASC;',
    orderMatters: true,
    hints: [
      'Para `proporcion_reembolso_pct`, divide `100.0 * SUM(CASE WHEN status = \'refunded\' THEN 1 ELSE 0 END)` entre `COUNT(*)` dentro de `ROUND(..., 2)`.',
      'Para `proporcion_reembolso_bps`, usa la misma división pero multiplicando por `10000.0` y redondeando con `ROUND(..., 0)`.',
      'Verifica que el resultado esté agrupado por `device_type` y ordenado con `ORDER BY device_type ASC`.'
    ],
    solution: 'SELECT\n  device_type,\n  COUNT(*) AS total_pedidos,\n  SUM(CASE WHEN status = \'refunded\' THEN 1 ELSE 0 END) AS pedidos_reembolsados,\n  ROUND(100.0 * SUM(CASE WHEN status = \'refunded\' THEN 1 ELSE 0 END) / COUNT(*), 2) AS proporcion_reembolso_pct,\n  ROUND(10000.0 * SUM(CASE WHEN status = \'refunded\' THEN 1 ELSE 0 END) / COUNT(*), 0) AS proporcion_reembolso_bps\nFROM orders\nGROUP BY device_type\nORDER BY device_type ASC;',
    solutionExplanation: 'Sumamos los pedidos reembolsados en el numerador y dividimos entre el conteo total de pedidos por dispositivo, escalando por `100.0` para porcentaje (`~8.00 %`) y por `10000.0` para puntos base (`~800 bps`).',
    expectedOutputTable: [
      {
        device_type: 'desktop',
        total_pedidos: 7716,
        pedidos_reembolsados: 617,
        proporcion_reembolso_pct: 8,
        proporcion_reembolso_bps: 800
      },
      {
        device_type: 'mobile',
        total_pedidos: 6857,
        pedidos_reembolsados: 547,
        proporcion_reembolso_pct: 7.98,
        proporcion_reembolso_bps: 798
      },
      {
        device_type: 'pos_tienda',
        total_pedidos: 3427,
        pedidos_reembolsados: 276,
        proporcion_reembolso_pct: 8.05,
        proporcion_reembolso_bps: 805
      }
    ]
  },

  roleNotes: {
    de: 'Nunca guardes únicamente una columna `conversion_rate_pct` precalculada en una tabla de resumen diario. Almacena siempre las columnas aditivas de numerador y denominador (`converted_orders`, `total_sessions`) para que cualquier consulta posterior pueda agregar cualquier rango de fechas sin promediar porcentajes.',
    da: 'Cuando presentes el resultado de un cambio operativo o de un experimento A/B, escribe ambas magnitudes en la misma frase: la diferencia absoluta en puntos porcentuales o puntos base (`+363 bps`) y la variación relativa (`+3.76 %` sobre la base). Así nadie confunde el tamaño del efecto.',
    bi: 'En las tarjetas de variación de tus tableros, distingue visualmente las métricas expresadas en dinero o unidades (donde la variación se muestra en `%`) de las métricas que ya son porcentajes (donde la variación contra el mes anterior debe etiquetarse en `pp` o `bps`).'
  },

  summary: [
    'En una proporción el numerador es subconjunto del denominador y el resultado vive entre 0 % y 100 %.',
    'La resta directa entre dos porcentajes se mide en puntos porcentuales (`pp`), no en porcentaje relativo (`%`).',
    'Un punto porcentual equivale a 100 puntos base (`1 pp = 100 bps` y `0.01 % = 1 bps`).',
    'Las tasas y proporciones nunca se promedian con `AVG(a / b)`; se calculan como `SUM(a) / SUM(b)`.'
  ],

  flashcards: [
    {
      id: 'fc-c0-num-04-a',
      front: 'Si la tasa de rechazo de pagos baja del `10.0 %` al `8.0 %`, ¿cuánto bajó en puntos porcentuales (`pp`), en puntos base (`bps`) y en porcentaje relativo (`%`)?',
      back: 'Bajó `2.0` puntos porcentuales (`-2.0 pp`), equivalentes a `-200` puntos base (`-200 bps`), lo que representa una reducción relativa del `-20.0 %` (`-2 / 10`).'
    },
    {
      id: 'fc-c0-num-04-b',
      front: '¿Por qué es incorrecto calcular el porcentaje de descuento global de una tienda como `AVG(discount_usd / subtotal_usd)`?',
      back: 'Porque promediar razones fila por fila asigna el mismo peso a un pedido de 15 USD que a uno de 1500 USD; debe calcularse como `SUM(discount_usd) / SUM(subtotal_usd)`.'
    },
    {
      id: 'fc-c0-num-04-c',
      front: '¿A cuántos puntos porcentuales y a qué fracción decimal equivalen `75` puntos base (`75 bps`)?',
      back: 'Equivalen a `0.75` puntos porcentuales (`0.75 %`) y a la fracción decimal `0.0075`.'
    }
  ],

  glossaryTerms: [
    'punto-porcentual',
    'punto-base'
  ],

  sources: [
    {
      title: 'Principles of Epidemiology in Public Health Practice — Lesson 3, Section 1: Frequency Measures (Ratios, Proportions, and Rates)',
      url: 'https://archive.cdc.gov/www_cdc_gov/csels/dsepd/ss1978/lesson3/section1.html',
      publisher: 'Centers for Disease Control and Prevention (CDC)',
      accessed: '2026-10-29',
      supports: 'Definición matemática y diferencias entre razón, proporción y tasa.'
    },
    {
      title: 'Eurostat Statistics Explained — Beginners: Statistical Concept — Percentage Change and Percentage Points',
      url: 'https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Beginners:Statistical_concept_-_Percentage_change_and_percentage_points',
      publisher: 'European Commission / Eurostat',
      accessed: '2026-10-29',
      supports: 'Diferencia entre variación relativa porcentual y diferencia aritmética en puntos porcentuales (pp) y puntos base (bps).'
    },
    {
      title: 'Kimball Group — Additive, Semi-Additive, and Non-Additive Facts',
      url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/additive-semi-additive-non-additive-fact/',
      publisher: 'Kimball Group',
      accessed: '2026-10-29',
      supports: 'No aditividad de razones y proporciones y regla de agregar numerador y denominador por separado.'
    }
  ],

  aiNotes: 'Vigila dos errores frecuentes: llamar "subida del 3 %" a un cambio del 10 % al 13 % (son 3 puntos porcentuales o +30 % relativo) y usar AVG(a / b) en SQL en lugar de SUM(a) / SUM(b). Pide siempre a la persona escribir primero el numerador y el denominador.'
};

export default lesson;
