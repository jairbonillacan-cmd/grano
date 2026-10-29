const lesson = {
  id: 'c0-numeros-01-media-mediana-moda',
  moduleId: 'c0-numeros',
  tracks: ['core'],
  level: 0,
  order: 1,
  title: 'Media, mediana y moda: cuándo el promedio miente',
  minutes: 15,
  prerequisites: ['c0-datos-05'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), el equipo comercial celebra que el importe promedio por pedido es de 426.10 USD y propone subir el umbral de envío gratis a 400 USD. Al revisar la tabla `orders` de 18 000 pedidos, notas que 10 470 clientes (el 58.2 %) gastan menos de ese promedio y que la mitad de los pedidos no supera los 350.16 USD. ¿Por qué el promedio se aleja tanto del pedido típico y qué medida deberías usar para tomar esa decisión?',

  objectives: [
    'Calcular la media aritmética, la mediana y la moda de una columna en SQL con AVG, MEDIAN y MODE.',
    'Distinguir cuándo un puñado de pedidos altos arrastra la media lejos del valor central real.',
    'Explicar cómo afectan los valores NULL frente a los ceros al calcular un promedio en una tabla.'
  ],

  sections: [
    {
      id: 'tres-formas-de-resumir-el-centro',
      heading: 'Tres formas distintas de definir qué es un valor típico',
      body: 'Cuando alguien pregunta cuánto gasta un cliente en Mercado Brisa (empresa ficticia), busca resumir 18 000 filas de `orders` en un solo número. Existen tres medidas de centro y cada una responde una pregunta diferente.\n\nLa **media aritmética** (`AVG`) suma todos los importes y divide el total entre el número de pedidos. Es el punto de equilibrio del dinero total. Si repartieras la facturación en partes iguales entre todos los pedidos, cada uno valdría 426.10 USD.\n\nLa **mediana** (`MEDIAN`) ordena los 18 000 pedidos de menor a mayor y toma el valor central: 350.16 USD. Exactamente la mitad cuesta 350.16 USD o menos, y la otra mitad cuesta 350.16 USD o más.\n\nLa **moda** (`MODE`) identifica el valor más frecuente. En `orders`, la moda de `device_type` es `desktop` y la de `status` es `completed`.'
    },
    {
      id: 'por-que-los-extremos-arrastran-la-media',
      heading: 'Por qué unos pocos pedidos grandes arrastran la media',
      body: 'Imagina cinco compras en una tienda: cuatro clientes compran café de 20 USD y una cafetería compra un molino de 920 USD. Los tickets son `20, 20, 20, 20, 920`. La media suma `1000 / 5 = 200` USD. Decir que el cliente típico gasta 200 USD engaña: cuatro de cada cinco personas gastaron diez veces menos.\n\nEn cambio, al ordenar las cinco compras, la posición central sigue siendo 20 USD. La mediana tiene un **punto de ruptura** del 50 %: aunque el mayor pedido subiera a 50 000 USD, la mediana no cambiaría.\n\nEn `orders` pasa lo mismo: las compras mayoristas de `cafeteria_b2b` llegan a 1925.73 USD y elevan la media a 426.10 USD, mientras la mediana queda en 350.16 USD.',
      example: {
        language: 'sql',
        code: 'SELECT\n  COUNT(*) AS total_pedidos,\n  ROUND(AVG(total_usd), 2) AS media_usd,\n  ROUND(MEDIAN(total_usd), 2) AS mediana_usd,\n  MODE(device_type) AS dispositivo_mas_frecuente\nFROM orders;',
        expectedOutput: [
          {
            total_pedidos: 18000,
            media_usd: 426.1,
            mediana_usd: 350.16,
            dispositivo_mas_frecuente: 'desktop'
          }
        ]
      }
    },
    {
      id: 'trampa-de-nulos-y-ceros-en-avg',
      heading: 'Cómo trata AVG a los valores NULL frente a los ceros',
      body: 'Un error habitual en SQL es olvidar qué hace `AVG` ante celdas vacías (`NULL`) o ceros. En SQL estándar y en DuckDB, `AVG`, `MEDIAN` y `MODE` ignoran las filas con `NULL`. No entran en el numerador ni en el denominador.\n\nEn cambio, un `0.0` sí es un número válido: suma cero al numerador pero añade uno al denominador y reduce la media. En `orders`, los pedidos sin promoción tienen `discount_usd = 0.0` en vez de `NULL`. Por eso `AVG(discount_usd)` en toda la tabla da 3.94 USD, pero entre los 3885 pedidos con cupón (`WHERE discount_usd > 0`) el descuento medio es 18.26 USD. Declara siempre qué filas entran en tu denominador.'
    }
  ],

  workedExample: {
    title: 'Auditoría del ticket de compra en Mercado Brisa: media global frente a mediana por estado',
    description: 'Compara el reporte basado solo en la media global contra el desglose que contrasta media y mediana en los 18 000 pedidos de `orders`.',
    steps: [
      {
        label: 'Antipatrón: reportar solo la media global de 426.10 USD',
        explanation: 'Si tomas 426.10 USD como si fuera el pedido de la mitad de los clientes, ocultas que 10 470 de los 18 000 pedidos (el 58.2 %) están por debajo de esa cifra.',
        code: 'SELECT\n  ROUND(AVG(total_usd), 2) AS ticket_promedio_reportado,\n  COUNT(*) AS total_pedidos,\n  SUM(CASE WHEN total_usd < 426.10 THEN 1 ELSE 0 END) AS pedidos_bajo_la_media,\n  ROUND(100.0 * SUM(CASE WHEN total_usd < 426.10 THEN 1 ELSE 0 END) / COUNT(*), 1) AS pct_bajo_la_media\nFROM orders;',
        expectedOutput: [
          {
            ticket_promedio_reportado: 426.1,
            total_pedidos: 18000,
            pedidos_bajo_la_media: 10470,
            pct_bajo_la_media: 58.2
          }
        ]
      },
      {
        label: 'Solución verificada: reportar media y mediana juntas por estado del pedido',
        explanation: 'Al mostrar `AVG(total_usd)` junto a `MEDIAN(total_usd)` y su brecha, queda claro que en todos los estados la media supera a la mediana en más de 66 USD por el efecto de los pedidos grandes.',
        code: 'SELECT\n  status,\n  COUNT(*) AS pedidos,\n  ROUND(AVG(total_usd), 2) AS media_usd,\n  ROUND(MEDIAN(total_usd), 2) AS mediana_usd,\n  ROUND(AVG(total_usd) - MEDIAN(total_usd), 2) AS brecha_media_mediana\nFROM orders\nGROUP BY status\nORDER BY pedidos DESC;',
        expectedOutput: [
          {
            status: 'completed',
            pedidos: 14760,
            media_usd: 424.76,
            mediana_usd: 348.28,
            brecha_media_mediana: 76.49
          },
          {
            status: 'refunded',
            pedidos: 1440,
            media_usd: 420.16,
            mediana_usd: 335.29,
            brecha_media_mediana: 84.86
          },
          {
            status: 'cancelled',
            pedidos: 1080,
            media_usd: 452.78,
            mediana_usd: 386.42,
            brecha_media_mediana: 66.36
          },
          {
            status: 'pending',
            pedidos: 720,
            media_usd: 425.45,
            mediana_usd: 351.9,
            brecha_media_mediana: 73.56
          }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: 'En los 18 000 pedidos de `orders`, la media de `total_usd` es 426.10 USD y la mediana es 350.16 USD. ¿Qué ocurrirá si mañana entra un pedido corporativo extraordinario de 50 000 USD?',
      options: [
        {
          id: 'a',
          text: 'La media subirá de forma notable, mientras que la mediana apenas cambiará por desplazarse una sola posición en la fila ordenada.',
          correct: true,
          feedback: 'Exacto. La media reparte los 50 000 USD entre todos los pedidos, pero la mediana solo avanza medio peldaño en el centro de las 18 001 filas.'
        },
        {
          id: 'b',
          text: 'Tanto la media como la mediana subirán en la misma proporción porque ambas usan todos los valores.',
          correct: false,
          feedback: 'Incorrecto. La mediana depende del orden de las posiciones centrales, no de la magnitud extrema del último valor.'
        },
        {
          id: 'c',
          text: 'La mediana subirá más que la media porque el nuevo valor cambia el máximo de la tabla.',
          correct: false,
          feedback: 'Incorrecto. Cambiar el máximo altera la media y el rango, pero deja prácticamente intacta la posición 50 %.'
        }
      ],
      explanation: 'La media aritmética incorpora la magnitud exacta de cada extremo en su suma total, mientras que la mediana solo atiende al orden central de las observaciones.'
    },
    {
      id: 'c2',
      type: 'predict-output',
      prompt: 'Una tabla temporal de 4 pedidos tiene los valores de `discount_usd`: `10`, `20`, `0` y `NULL`. ¿Qué devuelven respectivamente `AVG(discount_usd)` y `SUM(discount_usd) / COUNT(*)`?',
      options: [
        {
          id: 'a',
          text: 'AVG devuelve 10.0 (divide 30 entre las 3 filas no nulas) y SUM / COUNT(*) devuelve 7.5 (divide 30 entre las 4 filas totales).',
          correct: true,
          feedback: 'Correcto. AVG ignora la fila con NULL tanto en la suma como en el conteo (30 / 3 = 10), mientras que COUNT(*) cuenta las 4 filas (30 / 4 = 7.5).'
        },
        {
          id: 'b',
          text: 'Ambas expresiones devuelven 7.5 porque SQL trata NULL como cero dentro de AVG.',
          correct: false,
          feedback: 'Incorrecto. SQL nunca convierte NULL en cero dentro de AVG; simplemente excluye esa fila del denominador.'
        },
        {
          id: 'c',
          text: 'AVG devuelve 15.0 porque ignora tanto el NULL como el 0.',
          correct: false,
          feedback: 'Incorrecto. El cero sí es un número válido y entra en el denominador de AVG; solo NULL se excluye.'
        }
      ],
      explanation: 'En SQL, `AVG(col)` equivale a `SUM(col) / COUNT(col)`: el valor `0` cuenta como observación válida, pero el valor `NULL` se excluye del denominador.'
    },
    {
      id: 'c3',
      type: 'mcq',
      prompt: 'Quieres identificar qué método de pago (`payment_method`: `card`, `transferencia_spei`, `billetera_digital`, `efectivo_tienda`) se utiliza con mayor frecuencia en la tabla `payments`. ¿Qué medida de centro corresponde a esa pregunta?',
      options: [
        {
          id: 'a',
          text: 'La moda (`MODE(payment_method)`), porque busca la categoría con mayor frecuencia de aparición.',
          correct: true,
          feedback: 'Exacto. Para variables de texto o categorías nominales no existe suma ni orden numérico, pero sí frecuencia máxima (la moda).'
        },
        {
          id: 'b',
          text: 'La mediana (`MEDIAN(payment_method)`), porque ordena los métodos de pago de menor a mayor uso.',
          correct: false,
          feedback: 'Incorrecto. Ordenar texto alfabéticamente para tomar la mitad no indica qué categoría ocurre más veces.'
        },
        {
          id: 'c',
          text: 'La media (`AVG(payment_method)`), convirtiendo primero cada método en un código del 1 al 4.',
          correct: false,
          feedback: 'Incorrecto. Asignar números arbitrarios a categorías y promediarlos carece de significado matemático.'
        }
      ],
      explanation: 'La moda es la única medida de tendencia central aplicable a variables categóricas nominales, pues identifica el valor con mayor conteo de filas.'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Comparar media, mediana y marca más frecuente en el catálogo de productos',
    language: 'sql',
    prompt: 'Escribe una consulta sobre la tabla `products` que excluya el producto de prueba con precio negativo (`WHERE list_price_usd > 0`) y calcule por cada `category`: el total de productos (`total_skus`), la media redondeada a 2 decimales (`media_precio_usd`), la mediana redondeada a 2 decimales (`mediana_precio_usd`) y la marca más frecuente (`marca_moda`). Ordena de mayor a menor por `mediana_precio_usd`.',
    starterCode: 'SELECT\n  category,\n  COUNT(*) AS total_skus,\n  ROUND(AVG(list_price_usd), 2) AS media_precio_usd,\n  -- Calcula la mediana de list_price_usd redondeada a 2 decimales AS mediana_precio_usd\n  -- Calcula la moda de brand AS marca_moda\nFROM products\nWHERE list_price_usd > 0\nGROUP BY category\nORDER BY mediana_precio_usd DESC;',
    expected: 'SELECT\n  category,\n  COUNT(*) AS total_skus,\n  ROUND(AVG(list_price_usd), 2) AS media_precio_usd,\n  ROUND(MEDIAN(list_price_usd), 2) AS mediana_precio_usd,\n  MODE(brand) AS marca_moda\nFROM products\nWHERE list_price_usd > 0\nGROUP BY category\nORDER BY mediana_precio_usd DESC;',
    orderMatters: true,
    hints: [
      'Usa la función agregada `MEDIAN(list_price_usd)` dentro de `ROUND(..., 2)` para obtener `mediana_precio_usd`.',
      'Usa `MODE(brand) AS marca_moda` para obtener la marca que más se repite en cada categoría.',
      'Mantén el filtro `WHERE list_price_usd > 0` para excluir el SKU de calibración `-9.99` de la categoría Accesorios.'
    ],
    solution: 'SELECT\n  category,\n  COUNT(*) AS total_skus,\n  ROUND(AVG(list_price_usd), 2) AS media_precio_usd,\n  ROUND(MEDIAN(list_price_usd), 2) AS mediana_precio_usd,\n  MODE(brand) AS marca_moda\nFROM products\nWHERE list_price_usd > 0\nGROUP BY category\nORDER BY mediana_precio_usd DESC;',
    solutionExplanation: 'Filtramos primero el registro de calibración (`list_price_usd > 0`) y luego agrupamos por `category` combinando `AVG` y `MEDIAN` para precios numéricos con `MODE(brand)` para la marca más frecuente.',
    expectedOutputTable: [
      {
        category: 'Molinos',
        total_skus: 36,
        media_precio_usd: 152.57,
        mediana_precio_usd: 158.58,
        marca_moda: 'Brisa Taller'
      },
      {
        category: 'Cafeteras',
        total_skus: 36,
        media_precio_usd: 116.36,
        mediana_precio_usd: 115.02,
        marca_moda: 'Viento Sur'
      },
      {
        category: 'Suscripciones',
        total_skus: 35,
        media_precio_usd: 47.83,
        mediana_precio_usd: 47.61,
        marca_moda: 'Brisa Origen'
      },
      {
        category: 'Accesorios',
        total_skus: 36,
        media_precio_usd: 41.26,
        mediana_precio_usd: 42.34,
        marca_moda: 'Andes Roast'
      },
      {
        category: 'Café en grano',
        total_skus: 36,
        media_precio_usd: 29.34,
        mediana_precio_usd: 30.31,
        marca_moda: 'Kona Lab'
      }
    ]
  },

  roleNotes: {
    de: 'Al construir tablas de resumen diarias, recuerda que la media y la mediana no se pueden recalcular promediando días. Si necesitas la media mensual exacta, almacena en tu tabla agregada `SUM(total_usd)` y `COUNT(total_usd)` por separado; para la mediana, consulta las filas originales o usa estructuras de cuantiles.',
    da: 'Nunca entregues un promedio de importes, ingresos o tiempos de respuesta sin acompañarlo de la mediana. Si observas una brecha grande entre ambos (como 426.10 USD frente a 350.16 USD en `orders`), desglosa por segmento de cliente antes de recomendar un umbral comercial.',
    bi: 'En los tableros ejecutivos, etiqueta con precisión si una tarjeta muestra "Ticket promedio (media)" o "Ticket mediano (p50)". Usa la media cuando la tarjeta deba cuadrar al multiplicarla por el volumen de pedidos (`media * N = ingreso total`) y la mediana para describir al comprador habitual.'
  },

  summary: [
    'La media (`AVG`) reparte la suma total en partes iguales, pero es muy sensible a valores extremos.',
    'La mediana (`MEDIAN`) divide las filas ordenadas en dos mitades iguales y resiste pedidos atípicos.',
    'La moda (`MODE`) devuelve el valor o categoría más frecuente de una columna.',
    'En SQL, `AVG` ignora las filas con `NULL`, mientras que el número `0` sí reduce el promedio.'
  ],

  flashcards: [
    {
      id: 'fc-c0-num-01-a',
      front: '¿Qué diferencia hay entre lo que mide la media (`AVG`) y lo que mide la mediana (`MEDIAN`) en `orders.total_usd`?',
      back: 'La media (426.10 USD) es el punto de equilibrio del dinero total (`SUM / COUNT`); la mediana (350.16 USD) es el importe central que deja al 50 % de los pedidos por debajo y al 50 % por encima.'
    },
    {
      id: 'fc-c0-num-01-b',
      front: '¿Cómo afectan un valor `NULL` y un valor `0` al resultado de `AVG(discount_usd)` en SQL?',
      back: '`AVG` ignora por completo las filas con `NULL` (no entran ni al numerador ni al denominador), mientras que el `0` suma cero pero incrementa el denominador, reduciendo la media.'
    },
    {
      id: 'fc-c0-num-01-c',
      front: '¿Cuándo debes preferir la media sobre la mediana en un reporte financiero?',
      back: 'Cuando necesitas que el indicador multiplicado por el total de pedidos reconstruya exactamente la facturación total (`media × N = SUM(total_usd)`).'
    }
  ],

  glossaryTerms: [
    'media-aritmetica',
    'mediana'
  ],

  sources: [
    {
      title: 'NIST/SEMATECH e-Handbook of Statistical Methods — Section 1.3.5.1: Measures of Location',
      url: 'https://www.itl.nist.gov/div898/handbook/eda/section3/eda351.htm',
      publisher: 'National Institute of Standards and Technology (NIST)',
      accessed: '2026-10-29',
      supports: 'Definición matemática de media aritmética, mediana y moda, y resistencia de la mediana ante valores extremos.'
    },
    {
      title: 'DuckDB Documentation — Statistical Aggregate Functions (avg, median, mode)',
      url: 'https://duckdb.org/docs/sql/functions/aggregates',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Comportamiento de AVG, MEDIAN y MODE sobre columnas numéricas y de texto e ignorancia de valores NULL.'
    },
    {
      title: 'PostgreSQL 17 Documentation — Section 9.21: Aggregate Functions (percentile_cont, mode)',
      url: 'https://www.postgresql.org/docs/current/functions-aggregate.html',
      publisher: 'PostgreSQL Global Development Group',
      accessed: '2026-10-29',
      supports: 'Estándar SQL de funciones de conjunto ordenado para calcular la mediana interpolada y la moda.'
    }
  ],

  aiNotes: 'El error más común es creer que la mitad de los clientes gasta más que la media (confundiendo media con mediana) o asumir que AVG convierte los NULL en cero. Si la persona duda, pídele comparar qué pasa con la media y la mediana de 5 pedidos cuando el mayor pasa de 100 a 10 000 USD.'
};

export default lesson;
