const lesson = {
  id: 'c0-numeros-05-correlacion-causalidad',
  moduleId: 'c0-numeros',
  tracks: ['core'],
  level: 0,
  order: 5,
  title: 'Por qué correlación no implica causalidad y confusores',
  minutes: 20,
  prerequisites: ['c0-numeros-04-proporciones-tasas-bps'],
  contentVersion: 1,

  hook: 'Al cruzar las 730 filas de `marketing_spend` en Mercado Brisa, el coeficiente de correlación entre el gasto diario (`spend_usd`) y las conversiones (`attributed_conversions`) da `0.912`. Además, en la tabla `orders`, los pedidos que llevan descuento (`discount_usd > 0`) tienen un subtotal medio de `365.16` USD, mientras que muchos pedidos sin descuento rondan los `50` USD. ¿Significa eso que regalar cupones hace que la gente compre carritos de 365 USD, o hay una tercera variable moviendo ambos números?',

  objectives: [
    'Calcular e interpretar el coeficiente de correlación lineal de Pearson entre -1 y +1 con CORR(y, x) en SQL.',
    'Identificar cuándo una variable de confusión o la causalidad inversa explican una asociación sin que exista efecto causal.',
    'Estratificar una consulta con GROUP BY sobre la variable de confusión para aislar la relación real dentro de cada grupo.'
  ],

  sections: [
    {
      id: 'que-mide-la-correlacion-lineal',
      heading: 'Qué mide (y qué no mide) el coeficiente de correlación CORR',
      body: 'Cuando dos columnas numéricas se mueven juntas, medimos su asociación lineal con el **coeficiente de correlación de Pearson** ($r$). En DuckDB se calcula con `CORR(y, x)` y vive siempre entre `-1` y `+1`.\n\nUn valor cercano a `+1` indica asociación lineal positiva: cuando `x` sube, `y` tiende a subir. Un valor cercano a `-1` indica asociación lineal negativa: cuando `x` sube, `y` tiende a bajar. Un valor cercano a `0` indica ausencia de relación lineal.\n\nEn las 730 filas de `marketing_spend`, `CORR(spend_usd, attributed_conversions)` devuelve `0.912`. Las filas con más gasto tienen más conversiones. Sin embargo, ese número no prueba qué pasaría al duplicar mañana el presupuesto de un canal.',
      example: {
        language: 'sql',
        code: 'SELECT\n  COUNT(*) AS total_filas,\n  ROUND(AVG(spend_usd), 2) AS gasto_medio_usd,\n  ROUND(AVG(attributed_conversions), 2) AS conversiones_medias,\n  ROUND(CORR(spend_usd, attributed_conversions), 3) AS corr_global_inflada\nFROM marketing_spend;',
        expectedOutput: [
          {
            total_filas: 730,
            gasto_medio_usd: 236.92,
            conversiones_medias: 17.07,
            corr_global_inflada: 0.912
          }
        ]
      }
    },
    {
      id: 'tres-razones-por-las-que-dos-variables-se-mueven-juntas',
      heading: 'Tres motivos por los que dos variables correlacionan sin causarse',
      body: 'Antes de afirmar que `A` causa `B` porque suben juntas, debes descartar tres explicaciones alternativas.\n\nLa primera es la **variable de confusión** (confusor): una tercera variable `C` que causa tanto `A` como `B`. En `marketing_spend`, el canal (`channel`) fija la escala: `paid_social` gasta `432` USD diarios con `31` conversiones, mientras `email_campaign` gasta `96` USD con `7` conversiones. Mezclar los cinco canales infla la correlación a `0.912`, pero dentro de cada canal baja a `0.506`–`0.585`.\n\nLa segunda es la **causalidad inversa** (`B` causa `A`). En `orders`, el descuento de cabecera solo se activa cuando `subtotal_usd > 80` USD. El carrito grande activa el cupón, no al revés. La tercera es el azar.'
    },
    {
      id: 'estratificar-para-bloquear-el-confusor',
      heading: 'Cómo bloquear un confusor estratificando con GROUP BY',
      body: 'Cuando sospechas que una variable `C` confunde la relación entre `A` y `B`, la solución en SQL es **estratificar**. Agrupas o filtras por `C` para comparar solo observaciones del mismo grupo.\n\nEn `orders`, comparar pedidos con y sin descuento en toda la tabla mezcla carritos menores de `80` USD (inelegibles) con carritos mayores de `80` USD. Al estratificar por el tramo `subtotal_usd > 80`, aparece la realidad. Dentro de los pedidos mayores de `80` USD, los que llevan descuento tienen un total medio menor (`402.41` USD) que los sin descuento (`505.88` USD). Cuando el peso de los segmentos invierte el signo de una comparación global, ocurre la paradoja de Simpson.',
      interactive: {
        component: 'simpsons-paradox-explorer',
        caption: 'Simulador interactivo: explora cómo una variable de confusión invierte o distorsiona la relación global al mezclar segmentos.'
      }
    }
  ],

  workedExample: {
    title: 'Auditoría de descuentos en orders: asociación ingenua frente a estratificación por umbral',
    description: 'Observa cómo cambia la conclusión sobre los descuentos en `orders` cuando controlas la regla operativa que exige `subtotal_usd > 80` USD para aplicar el descuento.',
    steps: [
      {
        label: 'Antipatrón: comparar con y sin descuento mezclando todos los tamaños de pedido',
        explanation: 'Al comparar toda la tabla `orders` sin controlar la regla de elegibilidad (`subtotal_usd > 80`), parece que el grupo con descuento tiene carritos casi iguales a los de sin descuento y correlación perfecta (`1.0`) entre descuento y total.',
        code: 'SELECT\n  CASE WHEN discount_usd > 0 THEN \'Con descuento\' ELSE \'Sin descuento\' END AS grupo_pedido,\n  COUNT(*) AS pedidos,\n  ROUND(AVG(discount_usd), 2) AS descuento_medio_usd,\n  ROUND(AVG(subtotal_usd), 2) AS subtotal_medio_usd,\n  ROUND(AVG(total_usd), 2) AS total_medio_usd,\n  ROUND(CORR(discount_usd, total_usd), 3) AS corr_descuento_total\nFROM orders\nGROUP BY 1\nORDER BY 1;',
        expectedOutput: [
          {
            grupo_pedido: 'Con descuento',
            pedidos: 3885,
            descuento_medio_usd: 18.26,
            subtotal_medio_usd: 365.16,
            total_medio_usd: 402.41,
            corr_descuento_total: 1
          },
          {
            grupo_pedido: 'Sin descuento',
            pedidos: 14115,
            descuento_medio_usd: 0,
            subtotal_medio_usd: 372.92,
            total_medio_usd: 432.62,
            corr_descuento_total: null
          }
        ]
      },
      {
        label: 'Solución verificada: estratificar por el umbral confusor (subtotal_usd <= 80 vs > 80)',
        explanation: 'Al separar el tramo `<= 80` USD (donde hay 0 pedidos con descuento) del tramo `> 80` USD, vemos que a igualdad de elegibilidad los pedidos con descuento facturan 103.47 USD menos de media (`402.41` frente a `505.88` USD).',
        code: 'SELECT\n  CASE WHEN subtotal_usd <= 80 THEN \'1. Subtotal <= 80 USD\' ELSE \'2. Subtotal > 80 USD\' END AS tramo_subtotal,\n  CASE WHEN discount_usd > 0 THEN \'Con descuento\' ELSE \'Sin descuento\' END AS grupo_pedido,\n  COUNT(*) AS pedidos,\n  ROUND(AVG(subtotal_usd), 2) AS subtotal_medio_usd,\n  ROUND(AVG(total_usd), 2) AS total_medio_usd\nFROM orders\nGROUP BY 1, 2\nORDER BY 1, 2;',
        expectedOutput: [
          {
            tramo_subtotal: '1. Subtotal <= 80 USD',
            grupo_pedido: 'Sin descuento',
            pedidos: 2313,
            subtotal_medio_usd: 50.55,
            total_medio_usd: 58.83
          },
          {
            tramo_subtotal: '2. Subtotal > 80 USD',
            grupo_pedido: 'Con descuento',
            pedidos: 3885,
            subtotal_medio_usd: 365.16,
            total_medio_usd: 402.41
          },
          {
            tramo_subtotal: '2. Subtotal > 80 USD',
            grupo_pedido: 'Sin descuento',
            pedidos: 11802,
            subtotal_medio_usd: 436.1,
            total_medio_usd: 505.88
          }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: 'En `marketing_spend`, la correlación global `CORR(spend_usd, attributed_conversions)` es `0.912`, pero al agrupar por `channel` baja a valores entre `0.506` y `0.585`. ¿Por qué ocurre esa diferencia?',
      options: [
        {
          id: 'a',
          text: 'Porque `channel` es una variable de confusión que fija simultáneamente la escala del presupuesto diario y el volumen base de conversiones.',
          correct: true,
          feedback: 'Exacto. Mezclar canales grandes (`paid_social`) con canales pequeños (`email_campaign`) alinea artificialmente los puntos y eleva la correlación global.'
        },
        {
          id: 'b',
          text: 'Porque la función CORR en SQL divide el resultado entre el número de grupos cuando se usa GROUP BY.',
          correct: false,
          feedback: 'Incorrecto. CORR calcula la correlación estandarizada dentro de cada grupo entre -1 y +1 sin dividir entre el número de canales.'
        },
        {
          id: 'c',
          text: 'Porque una correlación de 0.912 indica una relación negativa y 0.585 indica una relación positiva.',
          correct: false,
          feedback: 'Incorrecto. Ambos valores tienen signo positivo; la diferencia está en que el 0.912 global está inflado por la diferencia de escala entre canales.'
        }
      ],
      explanation: 'Cuando una variable categórica como `channel` determina tanto el nivel de gasto como el nivel de conversiones, mezclar todos los canales sin estratificar infla la correlación aparente.'
    },
    {
      id: 'c2',
      type: 'mcq',
      prompt: 'Observas en `orders` que cuanto mayor es `discount_usd`, mayor es `subtotal_usd`. Al revisar las reglas de la tienda ves que el descuento es del 5 % y solo se activa si el carrito supera los 80 USD. ¿Qué fenómeno explica esa asociación?',
      options: [
        {
          id: 'a',
          text: 'Causalidad inversa por regla de negocio: es el tamaño del subtotal el que activa y escala el monto en dólares del descuento, no al revés.',
          correct: true,
          feedback: 'Correcto. Como el descuento se calcula como el 5 % del subtotal en compras mayores a 80 USD, el subtotal determina mecánicamente a `discount_usd`.'
        },
        {
          id: 'b',
          text: 'El descuento causa que cada cliente agregue más productos después de pagar.',
          correct: false,
          feedback: 'Incorrecto. El monto del descuento es consecuencia matemática del subtotal acumulado en el carrito.'
        },
        {
          id: 'c',
          text: 'Un error de cálculo de la función AVG en DuckDB.',
          correct: false,
          feedback: 'Incorrecto. El cálculo aritmético es exacto; lo que debe corregirse es la interpretación causal.'
        }
      ],
      explanation: 'La correlación es simétrica (`CORR(A, B) = CORR(B, A)`): que dos columnas suban juntas no dice si `A` causa `B`, si `B` causa `A` (causalidad inversa) o si ambas dependen de una regla común.'
    },
    {
      id: 'c3',
      type: 'mcq',
      prompt: '¿Qué paso técnico te permite comprobar si el descuento en envío realmente causa que los clientes compren más, eliminando las variables de confusión no observadas?',
      options: [
        {
          id: 'a',
          text: 'Un experimento controlado aleatorio (prueba A/B), como `EXP-FREE-SHIP-45` en la tabla `experiments`, donde el azar reparte a los clientes en control y tratamiento.',
          correct: true,
          feedback: 'Exacto. La asignación aleatoria equilibra las variables previas entre ambos grupos y permite medir el efecto causal del cambio.'
        },
        {
          id: 'b',
          text: 'Calcular la correlación con 6 decimales en lugar de 3 sobre los datos históricos.',
          correct: false,
          feedback: 'Incorrecto. Añadir decimales no elimina el sesgo de selección ni las variables de confusión de los datos observacionales.'
        },
        {
          id: 'c',
          text: 'Cambiar `CORR` por `AVG` en la misma consulta sin agrupar.',
          correct: false,
          feedback: 'Incorrecto. Ninguna función agregada sobre datos históricos sin control experimental convierte por sí sola una asociación en causalidad.'
        }
      ],
      explanation: 'Con datos históricos observacionales podemos estratificar por confusores conocidos (`GROUP BY`), pero para aislar también los confusores no medidos se requiere un experimento controlado aleatorio (A/B).'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Estratificar la correlación entre gasto y conversiones por canal en marketing_spend',
    language: 'sql',
    prompt: 'Escribe una consulta sobre `marketing_spend` agrupada por `channel` que calcule: el número de días registrados (`dias_registrados`), el gasto medio redondeado a 2 decimales (`gasto_medio_usd`), los clics medios redondeados a 1 decimal (`clics_medios`), las conversiones medias redondeadas a 2 decimales (`conversiones_medias`) y la correlación entre gasto y conversiones redondeada a 3 decimales (`corr_gasto_conversiones` usando `CORR(spend_usd, attributed_conversions)`). Ordena de mayor a menor por `gasto_medio_usd`.',
    starterCode: 'SELECT\n  channel,\n  COUNT(*) AS dias_registrados,\n  ROUND(AVG(spend_usd), 2) AS gasto_medio_usd,\n  ROUND(AVG(clicks), 1) AS clics_medios,\n  ROUND(AVG(attributed_conversions), 2) AS conversiones_medias,\n  -- Calcula corr_gasto_conversiones con CORR(spend_usd, attributed_conversions) redondeado a 3 decimales\nFROM marketing_spend\nGROUP BY channel\nORDER BY gasto_medio_usd DESC;',
    expected: 'SELECT\n  channel,\n  COUNT(*) AS dias_registrados,\n  ROUND(AVG(spend_usd), 2) AS gasto_medio_usd,\n  ROUND(AVG(clicks), 1) AS clics_medios,\n  ROUND(AVG(attributed_conversions), 2) AS conversiones_medias,\n  ROUND(CORR(spend_usd, attributed_conversions), 3) AS corr_gasto_conversiones\nFROM marketing_spend\nGROUP BY channel\nORDER BY gasto_medio_usd DESC;',
    orderMatters: true,
    hints: [
      'Usa `ROUND(CORR(spend_usd, attributed_conversions), 3) AS corr_gasto_conversiones` como sexta columna del `SELECT`.',
      'Mantén `GROUP BY channel` para estratificar por la variable de confusión (`channel`).',
      'Ordena el resultado con `ORDER BY gasto_medio_usd DESC`.'
    ],
    solution: 'SELECT\n  channel,\n  COUNT(*) AS dias_registrados,\n  ROUND(AVG(spend_usd), 2) AS gasto_medio_usd,\n  ROUND(AVG(clicks), 1) AS clics_medios,\n  ROUND(AVG(attributed_conversions), 2) AS conversiones_medias,\n  ROUND(CORR(spend_usd, attributed_conversions), 3) AS corr_gasto_conversiones\nFROM marketing_spend\nGROUP BY channel\nORDER BY gasto_medio_usd DESC;',
    solutionExplanation: 'Al estratificar por `channel` con `GROUP BY channel`, bloqueamos el efecto de escala entre canales y comprobamos que la correlación interna (`0.506` a `0.585`) es mucho menor que el `0.912` global.',
    expectedOutputTable: [
      {
        channel: 'paid_social',
        dias_registrados: 146,
        gasto_medio_usd: 432.06,
        clics_medios: 547.4,
        conversiones_medias: 31.03,
        corr_gasto_conversiones: 0.585
      },
      {
        channel: 'display_video',
        dias_registrados: 146,
        gasto_medio_usd: 320.27,
        clics_medios: 402.1,
        conversiones_medias: 22.98,
        corr_gasto_conversiones: 0.567
      },
      {
        channel: 'organic_search',
        dias_registrados: 146,
        gasto_medio_usd: 182.9,
        clics_medios: 231.4,
        conversiones_medias: 13.18,
        corr_gasto_conversiones: 0.545
      },
      {
        channel: 'referral',
        dias_registrados: 146,
        gasto_medio_usd: 152.78,
        clics_medios: 195.3,
        conversiones_medias: 11.24,
        corr_gasto_conversiones: 0.506
      },
      {
        channel: 'email_campaign',
        dias_registrados: 146,
        gasto_medio_usd: 96.59,
        clics_medios: 120.9,
        conversiones_medias: 6.94,
        corr_gasto_conversiones: 0.545
      }
    ]
  },

  roleNotes: {
    de: 'Preserva siempre en las tablas analíticas las dimensiones que actúan como posibles confusores (`channel`, `region`, `segment`, `device_type`) y las marcas de tiempo exactas (`order_ts`, `assigned_ts`). Si colapsas esas columnas demasiado pronto, nadie podrá estratificar ni verificar el orden temporal de los eventos.',
    da: 'Ante cualquier correlación alta en datos históricos, formula por escrito al menos dos hipótesis de confusión o causalidad inversa y compruébalas estratificando en SQL. Cuando la decisión implique presupuesto o cambios de producto, recomienda validar la hipótesis con un experimento controlado en `experiments`.',
    bi: 'Evita colocar dos series en un mismo gráfico sugeriendo que una mueve a la otra sin desglosar por canal o temporada. Añade selectores o desgloses por segmento para que quien consulte el tablero vea si la asociación se mantiene dentro de cada grupo.'
  },

  summary: [
    'El coeficiente `CORR(y, x)` mide la asociación lineal entre -1 y +1, pero es simétrico y no indica dirección causal.',
    'Una variable de confusión es una causa común que mueve ambas variables y fabrica o infla su correlación.',
    'La causalidad inversa ocurre cuando el resultado observado es el que activa o escala la supuesta causa.',
    'Estratificar con `GROUP BY` sobre el confusor corrige la distorsión entre grupos observables; los experimentos A/B aíslan también los no observados.'
  ],

  flashcards: [
    {
      id: 'fc-c0-num-05-a',
      front: '¿Qué es una variable de confusión (confusor) entre una variable `X` y un resultado `Y`?',
      back: 'Es una tercera variable `C` que influye simultáneamente sobre `X` y sobre `Y`, haciendo que parezcan asociadas o distorsionando su relación real.'
    },
    {
      id: 'fc-c0-num-05-b',
      front: '¿Por qué `CORR(spend_usd, attributed_conversions)` baja de `0.912` a `~0.55` cuando agrupas `marketing_spend` por `channel`?',
      back: 'Porque `channel` confunde la relación global: al mezclar canales de alto presupuesto y alto volumen con canales pequeños, los grupos extremos crean una línea artificialmente recta.'
    },
    {
      id: 'fc-c0-num-05-c',
      front: '¿Cómo bloqueas en SQL el efecto de una variable de confusión conocida y medida en la tabla?',
      back: 'Estratificando la consulta mediante `GROUP BY` (o filtrando con `WHERE`) sobre la variable de confusión para comparar observaciones dentro del mismo estrato.'
    }
  ],

  glossaryTerms: [
    'correlacion-pearson',
    'variable-confusion'
  ],

  sources: [
    {
      title: 'Causal Inference: What If — Part I: Causal Inference Without Models (Confounding and Causal Diagrams)',
      url: 'https://miguelhernan.org/whatifbook',
      publisher: 'Harvard T.H. Chan School of Public Health / CRC Press (Miguel A. Hernán & James M. Robins)',
      accessed: '2026-10-29',
      supports: 'Definición formal de confusor como causa común, bloqueo por estratificación y diferencia con experimentos aleatorios.'
    },
    {
      title: 'Stanford Encyclopedia of Philosophy — Simpson’s Paradox',
      url: 'https://plato.stanford.edu/entries/paradox-simpson/',
      publisher: 'Stanford University',
      accessed: '2026-10-29',
      supports: 'Distorsión e inversión de asociaciones al agregar grupos heterogéneos sin condicionar por la variable de confusión.'
    },
    {
      title: 'DuckDB Documentation — Correlation and Regression Aggregates (corr)',
      url: 'https://duckdb.org/docs/sql/functions/aggregates',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Cálculo del coeficiente de correlación lineal de Pearson CORR(y, x) global y por estrato en SQL.'
    }
  ],

  aiNotes: 'El error principal es creer que un CORR alto (como 0.912 en marketing_spend) prueba que subir el gasto multiplicará las conversiones en esa proporción, o no detectar la regla operativa (`subtotal_usd > 80`) que explica por qué los pedidos con descuento son grandes. Guía siempre a preguntar: "¿qué tercera variable afecta a ambas?".'
};

export default lesson;
