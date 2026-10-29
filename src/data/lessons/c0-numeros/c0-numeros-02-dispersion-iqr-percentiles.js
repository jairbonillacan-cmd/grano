const lesson = {
  id: 'c0-numeros-02-dispersion-iqr-percentiles',
  moduleId: 'c0-numeros',
  tracks: ['core'],
  level: 0,
  order: 2,
  title: 'Dispersión, rango intercuartílico y percentiles (p50, p90)',
  minutes: 20,
  prerequisites: ['c0-numeros-01-media-mediana-moda'],
  contentVersion: 1,

  hook: 'Dos almacenes de Mercado Brisa tienen exactamente la misma mediana de preparación de pedidos: 25 minutos. Sin embargo, los clientes del segundo almacén abren el triple de reclamos por demora porque el 10 % de sus envíos tarda más de 90 minutos. Si el centro de ambas distribuciones coincide, ¿cómo mides cuán dispersos están los datos y dónde empieza la cola de peores casos?',

  objectives: [
    'Calcular cuantiles y percentiles en SQL (p25, p50, p75, p90) mediante QUANTILE_CONT.',
    'Medir la dispersión central con el rango intercuartílico (IQR) frente al rango total y la desviación estándar.',
    'Aplicar la regla de cercas de Tukey (1.5 × IQR) para aislar valores atípicos o registros corruptos.'
  ],

  sections: [
    {
      id: 'por-que-el-centro-no-basta',
      heading: 'Por qué dos grupos con el mismo promedio pueden ser opuestos',
      body: 'Conocer la media o la mediana indica dónde está el centro, pero oculta cuánto se separan las filas individuales. Imagina dos rutas de reparto con tiempos `[24, 25, 25, 25, 26]` y `[5, 10, 25, 40, 95]`. Ambas tienen mediana de 25 minutos. Sin embargo, la primera es estable y la segunda es impredecible.\n\nLa medida más simple de apertura es el **rango total** (`MAX(x) - MIN(x)`). Su debilidad es depender de los dos valores más extremos: un solo dato corrupto lo arruina.\n\nLa **desviación estándar** (`STDDEV_SAMP`) mide la distancia típica respecto a la media elevando las diferencias al cuadrado antes de sacar raíz cuadrada. En `orders`, la desviación estándar de `total_usd` es 319.67 USD. Como eleva cada distancia al cuadrado, un precio erróneo también infla la desviación estándar.'
    },
    {
      id: 'percentiles-y-rango-intercuartilico',
      heading: 'Percentiles (p25, p50, p90) y el rango intercuartílico (IQR)',
      body: 'Para medir la dispersión sin distorsión por extremos, ordenamos la columna de menor a mayor y la cortamos mediante **percentiles**. En DuckDB usamos `QUANTILE_CONT(columna, fraccion)`.\n\nEl percentil 25 (`p25` o $Q_1$) deja por debajo al 25 % de las filas (166.71 USD en `orders`). El percentil 50 (`p50`) es la mediana (350.16 USD). El percentil 75 (`p75` o $Q_3$) deja por debajo al 75 % (621.35 USD). La resta $\\text{IQR} = Q_3 - Q_1$ se llama **rango intercuartílico**. Mide cuánto abarca el 50 % central de los pedidos: 454.65 USD.\n\nPara vigilar casos extremos sin usar el máximo, en operaciones se usa el percentil 90 (`p90 = 876.17` USD) o el percentil 99 (`p99 = 1347.39` USD). Indican el umbral bajo el cual queda el 90 % o el 99 % de los pedidos.',
      example: {
        language: 'sql',
        code: 'SELECT\n  ROUND(MIN(total_usd), 2) AS min_usd,\n  ROUND(QUANTILE_CONT(total_usd, 0.25), 2) AS p25_usd,\n  ROUND(MEDIAN(total_usd), 2) AS p50_usd,\n  ROUND(QUANTILE_CONT(total_usd, 0.75), 2) AS p75_usd,\n  ROUND(QUANTILE_CONT(total_usd, 0.75) - QUANTILE_CONT(total_usd, 0.25), 2) AS iqr_usd,\n  ROUND(QUANTILE_CONT(total_usd, 0.90), 2) AS p90_usd,\n  ROUND(MAX(total_usd), 2) AS max_usd\nFROM orders;',
        expectedOutput: [
          {
            min_usd: 13.13,
            p25_usd: 166.71,
            p50_usd: 350.16,
            p75_usd: 621.35,
            iqr_usd: 454.65,
            p90_usd: 876.17,
            max_usd: 1925.73
          }
        ]
      }
    },
    {
      id: 'cercas-de-tukey-y-valores-atipicos',
      heading: 'Cómo detectar valores atípicos con las cercas de Tukey',
      body: 'John W. Tukey propuso resumir una distribución con cinco números (`MIN`, `p25`, `p50`, `p75`, `MAX`) y trazar dos cercas con el **rango intercuartílico**. La cerca inferior es $Q_1 - 1.5 \\times \\text{IQR}$ y la superior es $Q_3 + 1.5 \\times \\text{IQR}$.\n\nToda fila fuera de esas cercas debe auditarse, pero nunca borrarse a ciegas. En Mercado Brisa hay dos casos opuestos. En `products`, el artículo `SKU-TEST-NEG` vale `-9.99` USD y cae bajo la cerca inferior de `Accesorios` ($-10.77$ USD). Es un registro de prueba que sí debe filtrarse. En cambio, en `orders`, un pedido de 1900 USD supera la cerca superior ($1303.33$ USD), pero es una compra mayorista real.'
    }
  ],

  workedExample: {
    title: 'Auditoría de dispersión en el catálogo de productos: rango total frente a IQR',
    description: 'Observa cómo el SKU de prueba `SKU-TEST-NEG` (`-9.99` USD) distorsiona el mínimo y el rango de `Accesorios`, mientras que los cuartiles y el IQR reflejan la dispersión real.',
    steps: [
      {
        label: 'Antipatrón: resumir la dispersión solo con MIN, MAX y desviación estándar',
        explanation: 'En la categoría `Accesorios` (`37` SKUs), el producto de prueba con precio `-9.99` USD estira artificialmente el rango total hasta `76.27` USD e infla la desviación estándar.',
        code: 'SELECT\n  category,\n  COUNT(*) AS skus,\n  ROUND(MIN(list_price_usd), 2) AS min_usd,\n  ROUND(MAX(list_price_usd), 2) AS max_usd,\n  ROUND(MAX(list_price_usd) - MIN(list_price_usd), 2) AS rango_total_usd,\n  ROUND(STDDEV_SAMP(list_price_usd), 2) AS desvio_estandar_usd\nFROM products\nGROUP BY category\nORDER BY category;',
        expectedOutput: [
          {
            category: 'Accesorios',
            skus: 37,
            min_usd: -9.99,
            max_usd: 66.28,
            rango_total_usd: 76.27,
            desvio_estandar_usd: 17.99
          },
          {
            category: 'Cafeteras',
            skus: 36,
            min_usd: 38.9,
            max_usd: 191.62,
            rango_total_usd: 152.72,
            desvio_estandar_usd: 46.61
          },
          {
            category: 'Café en grano',
            skus: 36,
            min_usd: 15.25,
            max_usd: 41.35,
            rango_total_usd: 26.1,
            desvio_estandar_usd: 8.4
          },
          {
            category: 'Molinos',
            skus: 36,
            min_usd: 69.7,
            max_usd: 237.01,
            rango_total_usd: 167.31,
            desvio_estandar_usd: 48.49
          },
          {
            category: 'Suscripciones',
            skus: 35,
            min_usd: 24.62,
            max_usd: 74.47,
            rango_total_usd: 49.85,
            desvio_estandar_usd: 14.89
          }
        ]
      },
      {
        label: 'Solución verificada: describir cada categoría con p25, p50, p75, IQR y p90',
        explanation: 'Al usar cuantiles con `QUANTILE_CONT`, el 50 % central de `Accesorios` se ubica entre `28.64` y `54.91` USD (`iqr_usd = 26.27`), sin dejarse arrastrar por el valor negativo aislado.',
        code: 'SELECT\n  category,\n  ROUND(QUANTILE_CONT(list_price_usd, 0.25), 2) AS p25_usd,\n  ROUND(QUANTILE_CONT(list_price_usd, 0.50), 2) AS p50_usd,\n  ROUND(QUANTILE_CONT(list_price_usd, 0.75), 2) AS p75_usd,\n  ROUND(QUANTILE_CONT(list_price_usd, 0.75) - QUANTILE_CONT(list_price_usd, 0.25), 2) AS iqr_usd,\n  ROUND(QUANTILE_CONT(list_price_usd, 0.90), 2) AS p90_usd\nFROM products\nGROUP BY category\nORDER BY category;',
        expectedOutput: [
          {
            category: 'Accesorios',
            p25_usd: 28.64,
            p50_usd: 40.6,
            p75_usd: 54.91,
            iqr_usd: 26.27,
            p90_usd: 59.05
          },
          {
            category: 'Cafeteras',
            p25_usd: 75.74,
            p50_usd: 115.02,
            p75_usd: 164.2,
            iqr_usd: 88.46,
            p90_usd: 176.12
          },
          {
            category: 'Café en grano',
            p25_usd: 23.31,
            p50_usd: 30.31,
            p75_usd: 35.82,
            iqr_usd: 12.5,
            p90_usd: 39.73
          },
          {
            category: 'Molinos',
            p25_usd: 111.17,
            p50_usd: 158.58,
            p75_usd: 187.07,
            iqr_usd: 75.9,
            p90_usd: 212.42
          },
          {
            category: 'Suscripciones',
            p25_usd: 36.94,
            p50_usd: 47.61,
            p75_usd: 59.05,
            iqr_usd: 22.11,
            p90_usd: 70.1
          }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: 'En la tabla `orders`, el percentil 90 (`p90`) de `total_usd` es `876.17` USD. ¿Qué significa exactamente ese número?',
      options: [
        {
          id: 'a',
          text: 'Que el 90 % de los pedidos tiene un importe igual o menor a 876.17 USD, y el 10 % restante supera ese importe.',
          correct: true,
          feedback: 'Exacto. El percentil 90 marca la frontera de posición que deja al 90 % de las filas ordenadas por debajo y al 10 % por encima.'
        },
        {
          id: 'b',
          text: 'Que el 90 % de los ingresos totales en dólares proviene de pedidos de 876.17 USD.',
          correct: false,
          feedback: 'Incorrecto. El percentil corta el conteo de filas ordenadas, no el porcentaje acumulado de la suma de dólares.'
        },
        {
          id: 'c',
          text: 'Que el pedido promedio equivale al 90 % de 876.17 USD.',
          correct: false,
          feedback: 'Incorrecto. `p90` es un cuantil de posición (`QUANTILE_CONT(x, 0.90)`), sin relación multiplicativa con la media.'
        }
      ],
      explanation: 'Un percentil `pk` divide las observaciones ordenadas de modo que el `k %` de las filas tiene un valor menor o igual a esa cota y el `(100 - k) %` la supera.'
    },
    {
      id: 'c2',
      type: 'predict-output',
      prompt: 'En `orders`, el primer cuartil (`p25`) de `total_usd` es `166.71` USD y el tercer cuartil (`p75`) es `621.35` USD. ¿Cuánto vale el rango intercuartílico (`IQR`) y qué porcentaje de los pedidos contiene?',
      options: [
        {
          id: 'a',
          text: 'Vale 454.64 USD (621.35 - 166.71) y contiene exactamente el 50 % central de los pedidos.',
          correct: true,
          feedback: 'Correcto. El IQR es la diferencia entre Q3 (p75) y Q1 (p25), abarcando el tramo central entre el 25 % y el 75 % de los datos.'
        },
        {
          id: 'b',
          text: 'Vale 788.06 USD (621.35 + 166.71) y contiene el 75 % de los pedidos.',
          correct: false,
          feedback: 'Incorrecto. El rango intercuartílico resta Q3 menos Q1; no suma ambos cuartiles.'
        },
        {
          id: 'c',
          text: 'Vale 394.03 USD ((621.35 + 166.71) / 2) y representa la mediana de los pedidos.',
          correct: false,
          feedback: 'Incorrecto. Promediar Q1 y Q3 es el rango medio intercuartílico (midhinge), no la amplitud IQR ni la mediana.'
        }
      ],
      explanation: 'El rango intercuartílico se define como `IQR = p75 - p25` y mide la anchura del intervalo donde se concentra la mitad central (del 25 % al 75 %) de las filas.'
    },
    {
      id: 'c3',
      type: 'mcq',
      prompt: 'Al calcular la cerca superior de Tukey (`p75 + 1.5 * IQR`) sobre `orders.total_usd`, encuentras pedidos de 1850 USD que superan la cerca de 1303.33 USD. ¿Qué acción técnica corresponde?',
      options: [
        {
          id: 'a',
          text: 'Inspeccionar a qué segmento pertenecen: al ver que son compras válidas de `cafeteria_b2b`, se conservan y se reportan medidas resistentes como mediana e IQR.',
          correct: true,
          feedback: 'Exacto. Superar la cerca de 1.5 × IQR señala un valor extremo para auditar; solo se filtra si es un error de captura o un registro de prueba.'
        },
        {
          id: 'b',
          text: 'Borrar de inmediato de la tabla `orders` todas las filas que superen `p75 + 1.5 * IQR` para limpiar el dataset.',
          correct: false,
          feedback: 'Incorrecto. Eliminar ventas reales de clientes corporativos mutila la facturación y falsea los reportes financieros.'
        },
        {
          id: 'c',
          text: 'Reemplazar todos los valores mayores a 1303.33 USD por `NULL` antes de hacer cualquier consulta.',
          correct: false,
          feedback: 'Incorrecto. Sustituir compras reales por `NULL` destruye precisamente la información de los clientes de mayor valor.'
        }
      ],
      explanation: 'Las cercas de Tukey (`Q1 - 1.5 × IQR` y `Q3 + 1.5 × IQR`) son alarmas de inspección para distinguir errores de datos (`-9.99` en `products`) frente a extremos legítimos del negocio.'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Dispersión y percentil 90 del importe por tipo de dispositivo',
    language: 'sql',
    prompt: 'Calcula sobre la tabla `orders` para cada `device_type`: el número de pedidos (`pedidos`), la mediana redondeada a 2 decimales (`p50_usd`), el rango intercuartílico redondeado a 2 decimales (`iqr_usd`, como `QUANTILE_CONT(total_usd, 0.75) - QUANTILE_CONT(total_usd, 0.25)`) y el percentil 90 redondeado a 2 decimales (`p90_usd`). Ordena de mayor a menor por `p90_usd`.',
    starterCode: 'SELECT\n  device_type,\n  COUNT(*) AS pedidos,\n  ROUND(QUANTILE_CONT(total_usd, 0.50), 2) AS p50_usd,\n  -- Calcula iqr_usd restando QUANTILE_CONT 0.25 a QUANTILE_CONT 0.75 y redondeando a 2 decimales\n  -- Calcula p90_usd con QUANTILE_CONT(total_usd, 0.90) redondeado a 2 decimales\nFROM orders\nGROUP BY device_type\nORDER BY p90_usd DESC;',
    expected: 'SELECT\n  device_type,\n  COUNT(*) AS pedidos,\n  ROUND(QUANTILE_CONT(total_usd, 0.50), 2) AS p50_usd,\n  ROUND(QUANTILE_CONT(total_usd, 0.75) - QUANTILE_CONT(total_usd, 0.25), 2) AS iqr_usd,\n  ROUND(QUANTILE_CONT(total_usd, 0.90), 2) AS p90_usd\nFROM orders\nGROUP BY device_type\nORDER BY p90_usd DESC;',
    orderMatters: true,
    hints: [
      'Para `iqr_usd`, escribe `ROUND(QUANTILE_CONT(total_usd, 0.75) - QUANTILE_CONT(total_usd, 0.25), 2) AS iqr_usd`.',
      'Para `p90_usd`, escribe `ROUND(QUANTILE_CONT(total_usd, 0.90), 2) AS p90_usd`.',
      'Asegúrate de mantener `GROUP BY device_type` y `ORDER BY p90_usd DESC`.'
    ],
    solution: 'SELECT\n  device_type,\n  COUNT(*) AS pedidos,\n  ROUND(QUANTILE_CONT(total_usd, 0.50), 2) AS p50_usd,\n  ROUND(QUANTILE_CONT(total_usd, 0.75) - QUANTILE_CONT(total_usd, 0.25), 2) AS iqr_usd,\n  ROUND(QUANTILE_CONT(total_usd, 0.90), 2) AS p90_usd\nFROM orders\nGROUP BY device_type\nORDER BY p90_usd DESC;',
    solutionExplanation: 'Usamos `QUANTILE_CONT` con las fracciones `0.50`, `0.75 - 0.25` y `0.90` agrupando por `device_type` para comparar tanto el centro (`p50`) como la amplitud central (`IQR`) y el tramo alto (`p90`).',
    expectedOutputTable: [
      {
        device_type: 'desktop',
        pedidos: 7716,
        p50_usd: 386.39,
        iqr_usd: 473.09,
        p90_usd: 917.84
      },
      {
        device_type: 'pos_tienda',
        pedidos: 3427,
        p50_usd: 357.37,
        iqr_usd: 445.79,
        p90_usd: 876.34
      },
      {
        device_type: 'mobile',
        pedidos: 6857,
        p50_usd: 309.13,
        iqr_usd: 434.35,
        p90_usd: 824.31
      }
    ]
  },

  roleNotes: {
    de: 'Para monitorear latencias de pipelines e ingesta de archivos, nunca fijes alertas sobre el tiempo medio: vigila conjuntamente `p50`, `p90` y `p99`. Además, añade pruebas de rango en tus cargas (`CHECK (list_price_usd > 0)`) para bloquear en origen registros de calibración como `SKU-TEST-NEG`.',
    da: 'En todo análisis exploratorio, acompaña la mediana con el rango intercuartílico (`IQR`) y revisa los cinco números de Tukey (`MIN`, `p25`, `p50`, `p75`, `MAX`). Cuando detectes valores fuera de `1.5 × IQR`, documenta si son errores de captura o clientes mayoristas antes de decidir si filtrarlos.',
    bi: 'En tableros operativos de logística y atención al cliente, reemplaza la tarjeta única de "Tiempo promedio" por bandas de percentiles (`p50` como experiencia habitual y `p90` como compromiso de nivel de servicio o SLA). Así el equipo detecta cuellos de botella en la cola alta.'
  },

  summary: [
    'Dos grupos con idéntica media o mediana pueden tener dispersiones completamente distintas.',
    'El rango total y la desviación estándar son muy sensibles a errores de captura y valores extremos.',
    'El rango intercuartílico (`IQR = p75 - p25`) mide la amplitud del 50 % central sin contaminarse por las colas.',
    'Los percentiles `p90` y `p99` y las cercas de Tukey (`1.5 × IQR`) permiten vigilar colas y auditar anomalías.'
  ],

  flashcards: [
    {
      id: 'fc-c0-num-02-a',
      front: '¿Cómo se calcula el rango intercuartílico (`IQR`) en SQL y qué fracción de los datos abarca?',
      back: 'Se calcula como `QUANTILE_CONT(x, 0.75) - QUANTILE_CONT(x, 0.25)` (`p75 - p25`) y abarca exactamente el 50 % central de las observaciones ordenadas.'
    },
    {
      id: 'fc-c0-num-02-b',
      front: '¿Por qué el `IQR` de `products.list_price_usd` en Accesorios no se altera por el SKU con precio `-9.99` USD y el rango total sí?',
      back: 'Porque el rango total usa `MAX - MIN` (afectado por el mínimo `-9.99`), mientras que el `IQR` solo mira las posiciones 25 % y 75 %, ignorando el 25 % más bajo y el 25 % más alto.'
    },
    {
      id: 'fc-c0-num-02-c',
      front: '¿Dónde se ubican las cercas de Tukey para señalar posibles valores atípicos?',
      back: 'La cerca inferior está en `Q1 - 1.5 × IQR` y la cerca superior en `Q3 + 1.5 × IQR`. Los valores fuera de ellas se auditan, nunca se borran sin investigar su origen.'
    }
  ],

  glossaryTerms: [
    'rango-intercuartilico',
    'percentil'
  ],

  sources: [
    {
      title: 'NIST/SEMATECH e-Handbook of Statistical Methods — Section 1.3.5.6: Measures of Scale',
      url: 'https://www.itl.nist.gov/div898/handbook/eda/section3/eda356.htm',
      publisher: 'National Institute of Standards and Technology (NIST)',
      accessed: '2026-10-29',
      supports: 'Definición de rango, varianza muestral y desviación estándar, y sensibilidad cuadrática a valores extremos.'
    },
    {
      title: 'NIST/SEMATECH e-Handbook of Statistical Methods — Section 1.3.3.7: Box Plot',
      url: 'https://www.itl.nist.gov/div898/handbook/eda/section3/eda337.htm',
      publisher: 'National Institute of Standards and Technology (NIST)',
      accessed: '2026-10-29',
      supports: 'Resumen de cinco números de Tukey, rango intercuartílico (IQR) y cercas 1.5 × IQR para auditar valores atípicos.'
    },
    {
      title: 'DuckDB Documentation — Quantile and Dispersion Aggregates (quantile_cont, stddev_samp)',
      url: 'https://duckdb.org/docs/sql/functions/aggregates',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Cálculo de cuantiles continuos interpolados (p25, p50, p75, p90) y desviación estándar muestral en SQL.'
    }
  ],

  aiNotes: 'Las dos confusiones habituales son pensar que p90 significa el 90 % del dinero total (en vez del valor bajo el cual está el 90 % de las filas) y creer que todo punto fuera de 1.5 × IQR debe borrarse. Recalca la diferencia entre un error de captura (`-9.99` en `products`) y un cliente B2B real.'
};

export default lesson;
