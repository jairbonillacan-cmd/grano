const lesson = {
  id: 'c0-numeros-03-asimetria-sesgo',
  moduleId: 'c0-numeros',
  tracks: ['core'],
  level: 0,
  order: 3,
  title: 'Distribuciones asimétricas y sesgo en importes y entregas',
  minutes: 20,
  prerequisites: ['c0-numeros-02-dispersion-iqr-percentiles'],
  contentVersion: 1,

  hook: 'El área de finanzas de Mercado Brisa quiere detectar reembolsos anómalos en la tabla `refunds` (`1450` filas) usando la regla clásica de una curva simétrica: marcar todo lo que salga del intervalo `media ± 2 desviaciones estándar`. Al calcularlo en SQL obtienen una media de `221.45` USD, una desviación de `215.22` USD y un límite inferior de `-209.00` USD. ¿Por qué esa fórmula da un importe negativo imposible y cómo se analiza una variable con cola hacia la derecha?',

  objectives: [
    'Diagnosticar la asimetría positiva o negativa de una variable comparando media, mediana y SKEWNESS en SQL.',
    'Explicar por qué los importes monetarios y tiempos de espera presentan cola derecha al tener cota inferior en cero.',
    'Distinguir la asimetría geométrica de una distribución frente al sesgo estadístico de muestreo o medición.'
  ],

  sections: [
    {
      id: 'forma-de-la-distribucion-y-cola-derecha',
      heading: 'Por qué los importes y tiempos casi nunca son simétricos',
      body: 'En una distribución simétrica, la mitad izquierda es el espejo de la derecha. Allí la media, la mediana y la moda coinciden. En cambio, en comercio electrónico casi ninguna métrica operativa es simétrica.\n\nPiensa en el importe de un reembolso (`refund_amount_usd` en `refunds`) o en los minutos de entrega. Ambas variables tienen un tope físico a la izquierda: no existen reembolsos legítimos de `-50` USD ni entregas de `-15` minutos. Hacia la derecha no hay tope cercano: una cafetería puede devolver `1200` USD y un envío puede tardar doce días.\n\nEse tope en cero combinado con casos altos abiertos produce **asimetría positiva** (cola derecha). La mayoría de las filas se concentra en valores bajos y unos pocos valores altos estiran la cola hacia la derecha.'
    },
    {
      id: 'diagnosticar-asimetria-en-sql',
      heading: 'Cómo medir la asimetría con la brecha media-mediana y SKEWNESS',
      body: 'Existen dos señales directas en SQL para diagnosticar la inclinación de una columna numérica.\n\nLa primera es comparar media y mediana. Con cola derecha, los valores altos jalan el promedio hacia arriba y se cumple `media > mediana`. En `refunds`, la mediana es `150.04` USD y la media sube a `221.45` USD (`+71.41` USD de brecha). Cuando la cola va hacia la izquierda (asimetría negativa), ocurre lo opuesto: `media < mediana`.\n\nLa segunda señal es la función `SKEWNESS(columna)` de DuckDB. Un valor cercano a `0` indica simetría. Un valor mayor que `0` confirma cola derecha: en `orders.total_usd` vale `0.98` y en `refunds.refund_amount_usd` llega a `1.63`.',
      example: {
        language: 'sql',
        code: 'SELECT\n  reason,\n  COUNT(*) AS devoluciones,\n  ROUND(MEDIAN(refund_amount_usd), 2) AS mediana_usd,\n  ROUND(AVG(refund_amount_usd), 2) AS media_usd,\n  ROUND(QUANTILE_CONT(refund_amount_usd, 0.90), 2) AS p90_usd,\n  ROUND(SKEWNESS(refund_amount_usd), 2) AS coef_asimetria\nFROM refunds\nGROUP BY reason\nORDER BY devoluciones DESC, reason ASC;',
        expectedOutput: [
          {
            reason: 'cambio_opinion',
            devoluciones: 290,
            mediana_usd: 144.48,
            media_usd: 218.16,
            p90_usd: 491.31,
            coef_asimetria: 1.59
          },
          {
            reason: 'defecto_molino',
            devoluciones: 290,
            mediana_usd: 155.34,
            media_usd: 220.87,
            p90_usd: 514.31,
            coef_asimetria: 1.54
          },
          {
            reason: 'empaque_danado',
            devoluciones: 290,
            mediana_usd: 144.4,
            media_usd: 220.59,
            p90_usd: 506.87,
            coef_asimetria: 1.76
          },
          {
            reason: 'retraso_envio',
            devoluciones: 290,
            mediana_usd: 154.89,
            media_usd: 220.33,
            p90_usd: 512.84,
            coef_asimetria: 1.62
          },
          {
            reason: 'tueste_incorrecto',
            devoluciones: 290,
            mediana_usd: 148.49,
            media_usd: 227.27,
            p90_usd: 578.05,
            coef_asimetria: 1.64
          }
        ]
      }
    },
    {
      id: 'asimetria-frente-a-sesgo-estadistico',
      heading: 'No confundir asimetría de los datos con sesgo estadístico',
      body: 'En español suele traducirse *skewness* como "sesgo". Sin embargo, conviene separar dos conceptos muy distintos (*skewness* frente a *bias*).\n\nLa **asimetría de una distribución** (*skewness*) es una propiedad geométrica natural de los datos. Que `refund_amount_usd` tenga `SKEWNESS = 1.63` no es un error: refleja que abundan los reembolsos pequeños y escasean los grandes.\n\nEn cambio, el **sesgo estadístico** (*bias*) es un error sistemático al muestrear o medir la población. Si encuestas sobre tiempos de reparto solo a quienes volvieron a comprar, introduces sesgo de selección porque excluyes a los clientes insatisfechos que se fueron. La asimetría se describe con percentiles (`p50`, `p90`); el sesgo de captura exige corregir cómo se recogen los datos.'
    }
  ],

  workedExample: {
    title: 'Umbrales de auditoría en reembolsos: intervalo simétrico fallido frente a percentiles',
    description: 'Compara qué ocurre al aplicar la regla simétrica `media ± 2 desviaciones estándar` sobre `refunds` frente a construir umbrales basados en cuantiles.',
    steps: [
      {
        label: 'Antipatrón: asumir simetría y calcular media ± 2 desviaciones estándar',
        explanation: 'Como `refund_amount_usd` tiene fuerte cola derecha (`media = 221.45`, `desvio = 215.22`), restar dos desviaciones estándar arroja una cota inferior de `-209.00` USD, un valor imposible para una devolución.',
        code: 'SELECT\n  COUNT(*) AS total_reembolsos,\n  ROUND(AVG(refund_amount_usd), 2) AS media_usd,\n  ROUND(STDDEV_SAMP(refund_amount_usd), 2) AS desvio_usd,\n  ROUND(AVG(refund_amount_usd) - 2 * STDDEV_SAMP(refund_amount_usd), 2) AS cota_inferior_imposible,\n  ROUND(AVG(refund_amount_usd) + 2 * STDDEV_SAMP(refund_amount_usd), 2) AS cota_superior_usd\nFROM refunds;',
        expectedOutput: [
          {
            total_reembolsos: 1450,
            media_usd: 221.45,
            desvio_usd: 215.22,
            cota_inferior_imposible: -209,
            cota_superior_usd: 651.89
          }
        ]
      },
      {
        label: 'Solución verificada: fijar umbrales operativos con p50, p90 y asimetría por motivo',
        explanation: 'Al usar `MEDIAN` (`p50`) y `QUANTILE_CONT(..., 0.90)` (`p90`) por motivo de devolución, defines cotas positivas reales y detectas que `tueste_incorrecto` tiene el `p90` más alto (`578.05` USD).',
        code: 'SELECT\n  reason,\n  COUNT(*) AS devoluciones,\n  ROUND(MEDIAN(refund_amount_usd), 2) AS p50_usd,\n  ROUND(AVG(refund_amount_usd), 2) AS media_usd,\n  ROUND(QUANTILE_CONT(refund_amount_usd, 0.90), 2) AS p90_usd,\n  ROUND(SKEWNESS(refund_amount_usd), 2) AS asimetria\nFROM refunds\nGROUP BY reason\nORDER BY p90_usd DESC;',
        expectedOutput: [
          {
            reason: 'tueste_incorrecto',
            devoluciones: 290,
            p50_usd: 148.49,
            media_usd: 227.27,
            p90_usd: 578.05,
            asimetria: 1.64
          },
          {
            reason: 'defecto_molino',
            devoluciones: 290,
            p50_usd: 155.34,
            media_usd: 220.87,
            p90_usd: 514.31,
            asimetria: 1.54
          },
          {
            reason: 'retraso_envio',
            devoluciones: 290,
            p50_usd: 154.89,
            media_usd: 220.33,
            p90_usd: 512.84,
            asimetria: 1.62
          },
          {
            reason: 'empaque_danado',
            devoluciones: 290,
            p50_usd: 144.4,
            media_usd: 220.59,
            p90_usd: 506.87,
            asimetria: 1.76
          },
          {
            reason: 'cambio_opinion',
            devoluciones: 290,
            p50_usd: 144.48,
            media_usd: 218.16,
            p90_usd: 491.31,
            asimetria: 1.59
          }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: 'Analizas el tiempo de respuesta de una pasarela de cobros y observas que la mediana es `180` ms, la media es `410` ms y `SKEWNESS` vale `+2.4`. ¿Qué forma tiene esa distribución?',
      options: [
        {
          id: 'a',
          text: 'Asimetría positiva (cola hacia la derecha): la mayoría de los cobros responde rápido, pero una cola de respuestas lentas eleva la media.',
          correct: true,
          feedback: 'Exacto. Cuando la media supera ampliamente a la mediana y SKEWNESS es positivo, existe una cola derecha de valores altos.'
        },
        {
          id: 'b',
          text: 'Asimetría negativa (cola hacia la izquierda): la mayoría de los cobros tarda más de 410 ms.',
          correct: false,
          feedback: 'Incorrecto. En la asimetría negativa la cola apunta a los valores bajos y la media queda por debajo de la mediana.'
        },
        {
          id: 'c',
          text: 'Simétrica perfecta, porque tanto la media como la mediana son números positivos.',
          correct: false,
          feedback: 'Incorrecto. En una distribución simétrica la media y la mediana coinciden y SKEWNESS es cercano a 0.'
        }
      ],
      explanation: 'Una brecha positiva `media > mediana` combinada con `SKEWNESS > 0` es la huella característica de una distribución con asimetría positiva (cola derecha).'
    },
    {
      id: 'c2',
      type: 'mcq',
      prompt: '¿Por qué fracasa el intervalo `media ± 2 desviaciones estándar` para describir el rango habitual de `refunds.refund_amount_usd`?',
      options: [
        {
          id: 'a',
          text: 'Porque asume que la dispersión se reparte por igual a ambos lados de la media, ignorando el tope en cero y la cola derecha.',
          correct: true,
          feedback: 'Correcto. La cola derecha infla la desviación estándar a 215.22 USD y al restar 2 desvíos a la media (221.45) cruza el cero hasta -209 USD.'
        },
        {
          id: 'b',
          text: 'Porque la función STDDEV_SAMP en SQL devuelve valores negativos cuando hay reembolsos.',
          correct: false,
          feedback: 'Incorrecto. La desviación estándar es una raíz cuadrada y nunca puede ser negativa.'
        },
        {
          id: 'c',
          text: 'Porque la tabla `refunds` tiene menos de 10 000 filas.',
          correct: false,
          feedback: 'Incorrecto. Aunque tuvieras diez millones de filas con la misma forma asimétrica, `media - 2 * desvio` seguiría dando negativo.'
        }
      ],
      explanation: 'El intervalo simétrico `media ± 2 * desvio` solo describe bien distribuciones acampanadas y simétricas; en variables acotadas en cero con cola derecha produce límites inferiores absurdos.'
    },
    {
      id: 'c3',
      type: 'mcq',
      prompt: 'Para medir la satisfacción con el empaque de café, el equipo envía un formulario únicamente a los clientes del nivel `platino` y obtiene un promedio de 9.6 sobre 10. ¿Qué problema presenta ese número?',
      options: [
        {
          id: 'a',
          text: 'Sesgo estadístico de selección: la muestra excluye sistemáticamente a los clientes bronce, plata y oro.',
          correct: true,
          feedback: 'Exacto. Encuestar solo al segmento más fiel introduce un error sistemático de muestreo (sesgo de selección) que no representa al total de clientes.'
        },
        {
          id: 'b',
          text: 'Únicamente asimetría positiva, que se resuelve cambiando la media por el percentil 90 de esa misma encuesta.',
          correct: false,
          feedback: 'Incorrecto. Ningún percentil calculado sobre una muestra sesgada puede recuperar la opinión de los segmentos que nunca fueron encuestados.'
        },
        {
          id: 'c',
          text: 'Un error de redondeo de coma flotante en SQL.',
          correct: false,
          feedback: 'Incorrecto. El defecto no es numérico ni de tipo de dato, sino de cómo se seleccionó a quién medir.'
        }
      ],
      explanation: 'El sesgo estadístico (*bias*) ocurre cuando el procedimiento de selección o medición favorece sistemáticamente a una parte de la población; no debe confundirse con la asimetría (*skewness*).'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Diagnosticar el sesgo derecha (media vs mediana y SKEWNESS) en las primeras 5 tiendas',
    language: 'sql',
    prompt: 'Consulta la tabla `orders` filtrando las primeras 5 tiendas (`WHERE store_id <= 5`) y calcula por cada `store_id`: el total de pedidos (`pedidos`), la mediana redondeada a 2 decimales (`mediana_usd`), la media redondeada a 2 decimales (`media_usd`), la diferencia redondeada a 2 decimales entre media y mediana (`sesgo_media_mediana_usd`) y el coeficiente de asimetría redondeado a 2 decimales (`coef_asimetria` con `SKEWNESS(total_usd)`). Ordena por `store_id ASC`.',
    starterCode: 'SELECT\n  store_id,\n  COUNT(*) AS pedidos,\n  ROUND(MEDIAN(total_usd), 2) AS mediana_usd,\n  ROUND(AVG(total_usd), 2) AS media_usd,\n  -- Calcula sesgo_media_mediana_usd como ROUND(AVG(total_usd) - MEDIAN(total_usd), 2)\n  -- Calcula coef_asimetria como ROUND(SKEWNESS(total_usd), 2)\nFROM orders\nWHERE store_id <= 5\nGROUP BY store_id\nORDER BY store_id ASC;',
    expected: 'SELECT\n  store_id,\n  COUNT(*) AS pedidos,\n  ROUND(MEDIAN(total_usd), 2) AS mediana_usd,\n  ROUND(AVG(total_usd), 2) AS media_usd,\n  ROUND(AVG(total_usd) - MEDIAN(total_usd), 2) AS sesgo_media_mediana_usd,\n  ROUND(SKEWNESS(total_usd), 2) AS coef_asimetria\nFROM orders\nWHERE store_id <= 5\nGROUP BY store_id\nORDER BY store_id ASC;',
    orderMatters: true,
    hints: [
      'Para `sesgo_media_mediana_usd`, resta `MEDIAN(total_usd)` a `AVG(total_usd)` dentro de `ROUND(..., 2)`.',
      'Para `coef_asimetria`, utiliza `ROUND(SKEWNESS(total_usd), 2) AS coef_asimetria`.',
      'Conserva `WHERE store_id <= 5`, `GROUP BY store_id` y `ORDER BY store_id ASC`.'
    ],
    solution: 'SELECT\n  store_id,\n  COUNT(*) AS pedidos,\n  ROUND(MEDIAN(total_usd), 2) AS mediana_usd,\n  ROUND(AVG(total_usd), 2) AS media_usd,\n  ROUND(AVG(total_usd) - MEDIAN(total_usd), 2) AS sesgo_media_mediana_usd,\n  ROUND(SKEWNESS(total_usd), 2) AS coef_asimetria\nFROM orders\nWHERE store_id <= 5\nGROUP BY store_id\nORDER BY store_id ASC;',
    solutionExplanation: 'Calculamos en paralelo `MEDIAN(total_usd)`, `AVG(total_usd)`, su diferencia y `SKEWNESS(total_usd)`. En las 5 tiendas la diferencia es positiva (+68 a +83 USD) y el coeficiente supera 0.78, confirmando cola derecha.',
    expectedOutputTable: [
      {
        store_id: 1,
        pedidos: 642,
        mediana_usd: 264.63,
        media_usd: 346.13,
        sesgo_media_mediana_usd: 81.5,
        coef_asimetria: 1.28
      },
      {
        store_id: 2,
        pedidos: 643,
        mediana_usd: 425.58,
        media_usd: 495.73,
        sesgo_media_mediana_usd: 70.15,
        coef_asimetria: 0.78
      },
      {
        store_id: 3,
        pedidos: 643,
        mediana_usd: 281.59,
        media_usd: 350.45,
        sesgo_media_mediana_usd: 68.86,
        coef_asimetria: 1.17
      },
      {
        store_id: 4,
        pedidos: 1715,
        mediana_usd: 282.49,
        media_usd: 356.29,
        sesgo_media_mediana_usd: 73.8,
        coef_asimetria: 1.25
      },
      {
        store_id: 5,
        pedidos: 857,
        mediana_usd: 262.8,
        media_usd: 346.07,
        sesgo_media_mediana_usd: 83.27,
        coef_asimetria: 1.13
      }
    ]
  },

  roleNotes: {
    de: 'En reglas automáticas de detección de anomalías sobre volúmenes de filas o tiempos de carga, evita umbrales simétricos fijos como `media ± 2 desvíos` cuando la métrica tiene asimetría positiva; usa cotas basadas en percentiles históricos (`p10` y `p90`) por día de la semana.',
    da: 'Antes de aplicar pruebas estadísticas o construir segmentos de gasto, revisa el coeficiente `SKEWNESS` y la distancia entre media y mediana. Además, verifica siempre cómo se capturó la muestra (por ejemplo, el 15 % de sesiones anónimas en `events`) para no confundir asimetría con sesgo de selección.',
    bi: 'Cuando diseñes un gráfico de distribución de ventas o tiempos de espera, agrupa los valores en tramos (histograma) o muestra `p50` y `p90` lado a lado. Así evitas que la dirección tome decisiones pensando que la mitad de los pedidos se parece al promedio.'
  },

  summary: [
    'Los importes y tiempos tienen cota inferior en cero y casos altos abiertos, lo que genera asimetría positiva (cola derecha).',
    'En una distribución con asimetría positiva se cumple que la media supera a la mediana y `SKEWNESS` es mayor que cero.',
    'Aplicar intervalos simétricos (`media ± 2 desvíos`) sobre datos con cola derecha produce cotas inferiores negativas irreales.',
    'La asimetría (*skewness*) describe la forma de los datos; el sesgo estadístico (*bias*) es un error sistemático de muestreo o medición.'
  ],

  flashcards: [
    {
      id: 'fc-c0-num-03-a',
      front: '¿Por qué los importes de compra y los tiempos de entrega suelen tener asimetría positiva (cola derecha)?',
      back: 'Porque están acotados por debajo en cero (no hay precios ni tiempos negativos), pero abiertos por arriba a pedidos mayoristas o demoras largas.'
    },
    {
      id: 'fc-c0-num-03-b',
      front: 'Si en una columna numérica observas que `AVG(x) > MEDIAN(x)` y `SKEWNESS(x) > 0`, ¿hacia qué lado se estira la cola?',
      back: 'Hacia la derecha (valores altos): un grupo de observaciones grandes arrastra la media por encima de la mediana.'
    },
    {
      id: 'fc-c0-num-03-c',
      front: '¿Cuál es la diferencia entre asimetría (*skewness*) y sesgo estadístico (*bias*)?',
      back: 'La asimetría es la forma geométrica no simétrica de una distribución real; el sesgo estadístico es un error sistemático al muestrear o medir la población.'
    }
  ],

  glossaryTerms: [
    'asimetria-distribucion',
    'sesgo-estadistico'
  ],

  sources: [
    {
      title: 'NIST/SEMATECH e-Handbook of Statistical Methods — Section 1.3.5.11: Measures of Skewness and Kurtosis',
      url: 'https://www.itl.nist.gov/div898/handbook/eda/section3/eda35b.htm',
      publisher: 'National Institute of Standards and Technology (NIST)',
      accessed: '2026-10-29',
      supports: 'Definición del coeficiente de asimetría de Fisher-Pearson e interpretación de colas derecha e izquierda.'
    },
    {
      title: 'DuckDB Documentation — Statistical Aggregate Functions (skewness)',
      url: 'https://duckdb.org/docs/sql/functions/aggregates',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Cálculo directo del coeficiente de asimetría muestral con SKEWNESS(x) en consultas SQL.'
    },
    {
      title: 'SciPy Reference Guide — Statistical Functions (scipy.stats.skew)',
      url: 'https://docs.scipy.org/doc/scipy/reference/stats.html',
      publisher: 'SciPy Community',
      accessed: '2026-10-29',
      supports: 'Propiedades de distribuciones asimétricas acotadas en cero y relación entre media, mediana y cola derecha.'
    }
  ],

  aiNotes: 'Las personas suelen usar la palabra "sesgo" para referirse tanto a la cola derecha de un histograma (skewness) como a una muestra mal elegida (bias). Ayúdales a distinguir ambos conceptos y muéstrales con el ejemplo de `refunds` (`221.45 - 2 * 215.22 = -209`) por qué la regla empírica simétrica falla.'
};

export default lesson;
