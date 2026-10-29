export default {
  id: 'da4-causalidad-02-regresion-discontinua-rdd',
  moduleId: 'da4-causalidad',
  track: 'da',
  level: 4,
  order: 2,
  title: 'Regresión discontinua (RDD) alrededor de un umbral',
  subtitle:
    'Regresión discontinua (RDD): estimar el impacto causal alrededor de un umbral de elegibilidad',
  durationMinutes: 25,
  prerequisites: [
    'da4-causalidad-01-diferencias-en-diferencias-did',
    'c0-numeros-05-correlacion-causalidad',
  ],
  datasets: ['orders', 'stores'],
  hook: {
    question:
      'En Mercado Brisa, los carritos cuyo subtotal alcanza o supera 80.00 USD acceden a un descuento promocional del 5 %, mientras que un pedido de 79.90 USD recibe cero descuento. Si comparas todos los pedidos desde 80 USD contra los menores de 80 USD en Tienda Reforma Norte, la factura media sube +30.65 USD en el grupo con descuento. ¿Cómo separas el salto causal real producido al cruzar el umbral de 80 USD del hecho mecánico de que las canastas más grandes siempre facturan más?',
    context:
      'Estimación del efecto causal local en reglas comerciales por corte de elegibilidad sobre la tabla orders.',
  },
  objectives: [
    'Estimar el efecto causal local (LATE en el umbral) centrando la variable de asignación en el punto de corte y ajustando rectas locales con REGR_INTERCEPT y REGR_SLOPE.',
    'Distinguir entre regresión discontinua nítida (Sharp RDD) y difusa (Fuzzy RDD) según el salto en la probabilidad de recibir el tratamiento.',
    'Auditar la validez interna en el punto de corte evaluando el ancho de banda y el conteo de densidad para detectar manipulación de carritos.',
  ],
  sections: [
    {
      id: 'anatomia-rdd-variable-asignacion',
      heading: 'Variable de asignación, punto de corte y sesgo de comparación global',
      body: 'Muchas reglas de negocio asignan incentivos mediante una fórmula determinista: envío sin cargo a partir de `60.00 USD` en almacenes logísticos o un descuento promocional del `5 %` cuando el subtotal del pedido (`subtotal_usd`) alcanza el umbral $c = 80.00\\text{ USD}$. En la literatura causal, la métrica continua que determina la elegibilidad se denomina **variable de asignación** (*running variable* o *forcing variable*, $X_i$).\n\nEn este escenario, la condición de superposición global se rompe por diseño: ningún pedido con $X_i < 80$ recibe el descuento promocional y todos los elegibles tienen $X_i \\ge 80$. Si restamos de forma ingenua la media de `total_usd` de los pedidos con `subtotal_usd >= 80` frente a los de `subtotal_usd < 80`, confundimos el efecto del descuento con la propia variable de asignación, ya que `subtotal_usd` impulsa directamente `total_usd`.\n\nEl diseño de **regresión discontinua (RDD)** explota el hecho de que un cliente con un carrito de `79.80 USD` y otro con `80.20 USD` son prácticamente equivalentes en preferencias y poder de compra. Mientras la relación entre el subtotal y el resultado potencial sin descuento sea continua en $c = 80$, cualquier salto vertical abrupto justo en el punto de corte identifica el efecto causal local.',
      callout: {
        type: 'KeyIdea',
        title: 'Aleatorización local en el borde del umbral',
        body: 'Lejos del corte las unidades son incomparables, pero en una vecindad infinitesimal alrededor de c = 80 USD quedar justo a la izquierda o a la derecha actúa como un cuasiexperimento local.',
      },
      visual: {
        type: 'mermaid',
        spec: 'flowchart LR\n  A["Variable de asignación X\\n(subtotal_usd)"] --> B{"¿Cruza el umbral\\nc = 80 USD?"}\n  B -->|"X < 80 (Control)"| C["Recta local izquierda\\nIntercepto en X - 80 = 0"]\n  B -->|"X >= 80 (Elegible)"| D["Recta local derecha\\nIntercepto en X - 80 = 0"]\n  C --> E["Salto discontinuo en c = 80\\nEfecto causal local (LATE)"]\n  D --> E',
        caption:
          'Identificación del salto causal en el límite del umbral c = 80 USD mediante rectas locales.',
      },
    },
    {
      id: 'centrado-umbral-regresion-local',
      heading: 'Centrado en el umbral y estimación lineal local en SQL',
      body: 'Si promediamos `total_usd` incluso dentro de una ventana moderada, como `[50, 110] USD` en Tienda Reforma Norte (`store_id = 1`), los pedidos a la derecha del corte tienen un subtotal medio de `97.63 USD` frente a `66.33 USD` a la izquierda. Esa pendiente positiva genera una diferencia de medias ingenua de `107.59 - 76.94 = +30.65 USD` que oculta por completo la rebaja del descuento.\n\nPara eliminar el arrastre de la pendiente sin salir de SQL, aplicamos el **centrado de la variable de asignación**: definimos $X_{c,i} = \\text{subtotal\\_usd}_i - 80$. Al evaluar una regresión lineal de `total_usd` sobre $X_{c,i}$ por separado a cada lado del corte, la ordenada en el origen (`REGR_INTERCEPT(total_usd, subtotal_usd - 80)`) estima exactamente el valor esperado de `total_usd` cuando $X_{c,i} = 0$, es decir, en el límite $X_i = 80\\text{ USD}$.\n\nEn Tienda Reforma Norte, el intercepto por la izquierda en $X_i = 80$ es `92.80 USD` ($80 \\times 1.16$ con el `16 %` de impuesto), mientras que el intercepto por la derecha cae a `88.16 USD` ($80 \\times 0.95 \\times 1.16$). La diferencia de interceptos en el umbral revela el impacto mecánico exacto: $88.16 - 92.80 = -4.64\\text{ USD}$ por pedido.',
      formula: {
        latex:
          '\\hat{\\tau}_{\\text{RDD}} = \\hat{\\alpha}_{+} - \\hat{\\alpha}_{-}, \\quad Y_i = \\alpha_{\\pm} + \\beta_{\\pm}(X_i - c) + \\varepsilon_i',
        explanation:
          'Al centrar la variable explicativa en X_i - c, la diferencia entre el intercepto derecho y el izquierdo mide el salto vertical exactamente en X_i = c.',
      },
      codeExample: {
        language: 'sql',
        code: `SELECT
  CASE WHEN subtotal_usd < 80 THEN '1_izquierda' ELSE '2_derecha' END AS lado,
  COUNT(*) AS n_pedidos,
  ROUND(AVG(total_usd), 2) AS media_ingenua_usd,
  ROUND(REGR_SLOPE(total_usd, subtotal_usd - 80), 4) AS pendiente_local,
  ROUND(REGR_INTERCEPT(total_usd, subtotal_usd - 80), 2) AS intercepto_en_80_usd
FROM orders
WHERE status = 'completed'
  AND store_id = 1
  AND subtotal_usd BETWEEN 50 AND 110
GROUP BY 1
ORDER BY 1;`,
        caption:
          'Estimación de pendientes e interceptos locales en c = 80 USD con funciones agregadas de DuckDB.',
      },
    },
    {
      id: 'sharp-vs-fuzzy-rdd',
      heading: 'Diseño nítido (Sharp RDD) frente a diseño difuso (Fuzzy RDD)',
      body: 'No todas las reglas de elegibilidad se aplican al `100 %` de los pedidos que cruzan el umbral. Esto distingue dos variantes del diseño:\n\nEn un **RDD nítido** (*Sharp RDD*), la probabilidad de recibir el tratamiento salta de `0` a `1` en el punto de corte $c$. Es lo que ocurre en Tienda Reforma Norte (`store_id = 1`): debajo de `80 USD` ningún pedido recibe descuento (`0.0000`) y a partir de `80 USD` el `100 %` recibe el `5 %` de descuento (`1.0000`). Allí el salto de interceptos (`-4.64 USD`) estima directamente el efecto causal en $c = 80$.\n\nEn un **RDD difuso** (*Fuzzy RDD*), cruzar el umbral incrementa la probabilidad de tratamiento en una magnitud menor que la unidad ($0 < \\Delta P < 1$), porque el beneficio depende además de tener un cupón activo (`CMP-BARISTA` o `CMP-VERANO`). Al agregar todas las tiendas de Mercado Brisa en la ventana `[60, 100] USD`, la tasa de descuento salta de `0.0000` a `0.2843` (`28.43 %`), y el intercepto de `total_usd` pasa de `92.80 USD` a `91.73 USD` (`-1.07 USD`). El efecto local para quienes efectivamente reciben el descuento se obtiene dividiendo el salto de resultado entre el salto de cumplimiento: $\\hat{\\tau}_{\\text{Fuzzy}} = \\Delta Y_c / \\Delta D_c$.',
      visual: {
        type: 'table',
        spec: {
          headers: [
            'Muestra en ventana local',
            'Tasa descuento (X < 80)',
            'Tasa descuento (X >= 80)',
            'Salto en 80 USD (Delta Y)',
            'Tipo de diseño RDD',
          ],
          rows: [
            [
              'Tienda Reforma Norte (store_id = 1)',
              '0.0000 (0 %)',
              '1.0000 (100 %)',
              '-4.64 USD',
              'Nítido (Sharp RDD)',
            ],
            [
              'Red completa de tiendas ([60, 100] USD)',
              '0.0000 (0 %)',
              '0.2843 (28.43 %)',
              '-1.07 USD (ITT)',
              'Difuso (Fuzzy RDD)',
            ],
          ],
        },
        caption:
          'Comparación entre RDD nítido en una sucursal con aplicación universal y RDD difuso en toda la red comercial.',
      },
    },
    {
      id: 'ancho-banda-densidad-mccrary',
      heading: 'Ancho de banda y prueba de manipulación en el umbral',
      body: 'Dos decisiones metodológicas gobiernan la credibilidad de cualquier estudio RDD. La primera es la elección del **ancho de banda** (*bandwidth*, $h$), que restringe la muestra al intervalo $[c - h,\\, c + h]$. Un ancho de banda muy amplio (por ejemplo, $h = 60\\text{ USD}$) incluye más observaciones y reduce la varianza muestral, pero introduce sesgo si la relación real entre $X$ e $Y$ es curva lejos del umbral. Una ventana más estrecha ($h = 15$ o $20\\text{ USD}$) reduce el sesgo de especificación a cambio de mayor error estándar.\n\nLa segunda verificación obligatoria es la **prueba de continuidad de densidad** (inspirada en el test de McCrary). Si los clientes o cajeros conocen el umbral de `80.00 USD` y agregan artículos pequeños para pasar de `78 USD` a `81 USD`, observaremos un apilamiento artificial (*bunching*) justo por encima de `80 USD` y un hueco justo por debajo.\n\nEn SQL auditamos esta amenaza contando los pedidos en cubetas simétricas de `5 USD` pegadas al corte: `[75, 80)` frente a `[80, 85)`. En Mercado Brisa hay `181` pedidos en `[75, 80)` y `122` en `[80, 85)`, lo que descarta un apilamiento oportunista por encima de `80 USD`. Además, el efecto estimado es un **LATE en el umbral**: vale para carritos cercanos a `80 USD` y no debe extrapolarse a pedidos corporativos de `500 USD`.',
      codeExample: {
        language: 'sql',
        code: `SELECT
  FLOOR(subtotal_usd / 5) * 5 AS cubeta_5usd,
  COUNT(*) AS n_pedidos,
  ROUND(AVG(CASE WHEN discount_usd > 0 THEN 1.0 ELSE 0.0 END), 4) AS tasa_descuento
FROM orders
WHERE status = 'completed'
  AND subtotal_usd >= 70
  AND subtotal_usd < 90
GROUP BY 1
ORDER BY 1;`,
        caption:
          'Inspección de densidad de pedidos en cubetas de 5 USD alrededor del corte de 80 USD.',
      },
      callout: {
        type: 'warning',
        title: 'Validez local del estimador RDD',
        body: 'El estimador RDD solo identifica el impacto causal para canastas situadas en la frontera de c = 80 USD; asumir que ese mismo efecto aplica a carritos de 25 USD o de 400 USD es un error de extrapolación.',
      },
    },
  ],
  workedExample: {
    title:
      'Estimación de RDD nítido en Tienda Reforma Norte (store_id = 1) en c = 80 USD',
    scenario:
      'En Tienda Reforma Norte (store_id = 1), todo pedido completado con subtotal_usd >= 80 recibe automáticamente un 5 % de descuento. Queremos demostrar por qué la diferencia ingenua de medias en la ventana [50, 110] USD da un signo engañoso (+30.65 USD) y cómo la regresión lineal local centrada en subtotal_usd - 80 recupera el salto exacto en el umbral (-4.64 USD).',
    datasets: ['orders'],
    steps: [
      {
        order: 1,
        explanation:
          'Filtramos los pedidos completados de store_id = 1 dentro del ancho de banda h = 30 USD alrededor del corte (subtotal_usd BETWEEN 50 AND 110) y verificamos que la proporción con descuento salta de 0 a 1 en 80 USD.',
        code: `SELECT
  CASE WHEN subtotal_usd < 80 THEN '1_control_bajo_80' ELSE '2_tratado_sobre_80' END AS grupo_umbral,
  COUNT(*) AS n_pedidos,
  ROUND(AVG(CASE WHEN discount_usd > 0 THEN 1.0 ELSE 0.0 END), 4) AS prop_descuento,
  ROUND(AVG(subtotal_usd), 2) AS media_subtotal_usd,
  ROUND(AVG(total_usd), 2) AS media_ingenua_total_usd
FROM orders
WHERE status = 'completed'
  AND store_id = 1
  AND subtotal_usd BETWEEN 50 AND 110
GROUP BY 1
ORDER BY 1;`,
        output: `grupo_umbral       | n_pedidos | prop_descuento | media_subtotal_usd | media_ingenua_total_usd
-------------------+-----------+----------------+--------------------+------------------------
1_control_bajo_80  | 49        | 0.0000         | 66.33              | 76.94
2_tratado_sobre_80 | 28        | 1.0000         | 97.63              | 107.59`,
      },
      {
        order: 2,
        explanation:
          'Centramos la variable de asignación como subtotal_usd - 80 y estimamos la pendiente y el intercepto local en X = 80 USD a cada lado del umbral usando REGR_SLOPE y REGR_INTERCEPT.',
        code: `SELECT
  CASE WHEN subtotal_usd < 80 THEN '1_control_bajo_80' ELSE '2_tratado_sobre_80' END AS grupo_umbral,
  COUNT(*) AS n_pedidos,
  ROUND(REGR_SLOPE(total_usd, subtotal_usd - 80), 4) AS pendiente_local,
  ROUND(REGR_INTERCEPT(total_usd, subtotal_usd - 80), 2) AS intercepto_en_80_usd
FROM orders
WHERE status = 'completed'
  AND store_id = 1
  AND subtotal_usd BETWEEN 50 AND 110
GROUP BY 1
ORDER BY 1;`,
        output: `grupo_umbral       | n_pedidos | pendiente_local | intercepto_en_80_usd
-------------------+-----------+-----------------+---------------------
1_control_bajo_80  | 49        | 1.1600          | 92.80
2_tratado_sobre_80 | 28        | 1.1020          | 88.16`,
      },
      {
        order: 3,
        explanation:
          'Contrastamos la diferencia ingenua de medias (+30.65 USD, contaminada por el mayor subtotal a la derecha) con la discontinuidad en el umbral x = 80 USD (88.16 - 92.80 = -4.64 USD).',
        code: `SELECT
  ROUND(107.59 - 76.94, 2) AS diferencia_ingenua_usd,
  ROUND(88.16 - 92.80, 2) AS salto_rdd_en_80_usd;`,
        output: `diferencia_ingenua_usd | salto_rdd_en_80_usd
-----------------------+--------------------
30.65                  | -4.64`,
      },
    ],
    takeaway:
      'Centrar la variable de asignación en subtotal_usd - 80 elimina el sesgo de tamaño de canasta (+30.65 USD) y aísla en el intercepto el salto exacto de -4.64 USD provocado por el descuento del 5 % más impuestos en el umbral.',
  },
  checks: [
    {
      id: 'check-rdd-centrado',
      type: 'multiple-choice',
      prompt:
        '¿Por qué calculamos REGR_INTERCEPT(total_usd, subtotal_usd - 80) en lugar de REGR_INTERCEPT(total_usd, subtotal_usd) al estimar un diseño RDD con umbral en 80 USD?',
      options: [
        {
          id: 'a',
          label:
            'Porque sin restar 80 el intercepto evalúa la recta en subtotal_usd = 0 USD, lejos del punto de corte donde ocurre la discontinuidad.',
        },
        {
          id: 'b',
          label:
            'Porque DuckDB exige que el segundo argumento de REGR_INTERCEPT tenga media muestral igual a cero para no devolver NULL.',
        },
        {
          id: 'c',
          label:
            'Porque restar 80 convierte un diseño difuso (Fuzzy RDD) en un diseño nítido (Sharp RDD) sin cambiar los datos.',
        },
        {
          id: 'd',
          label:
            'Porque al restar 80 las pendientes de ambos lados se fuerzan automáticamente a valer 1.00.',
        },
      ],
      correctOptionId: 'a',
      explanation:
        'El intercepto de una regresión lineal es el valor predicho de Y cuando el regresor vale 0. Al usar X_c = subtotal_usd - 80, el punto X_c = 0 coincide exactamente con el umbral subtotal_usd = 80 USD. Las opciones b, c y d son falsas: DuckDB acepta cualquier regresor numérico, el centrado no altera la tasa de cumplimiento ni iguala las pendientes a 1.',
    },
    {
      id: 'check-rdd-ancho-banda',
      type: 'multiple-choice',
      prompt:
        'Al reducir el ancho de banda h alrededor del umbral de 80 USD (por ejemplo, pasando de [40, 120] a [72, 88]), ¿cómo cambia el compromiso entre sesgo y varianza del estimador RDD?',
      options: [
        {
          id: 'a',
          label:
            'Disminuye el sesgo por curvatura lejos del corte, pero aumenta la varianza muestral al quedar menos pedidos en la ventana.',
        },
        {
          id: 'b',
          label:
            'Disminuye tanto el sesgo de especificación como la varianza muestral porque se eliminan valores extremos.',
        },
        {
          id: 'c',
          label:
            'Aumenta el sesgo de especificación funcional, pero se reduce el error estándar al concentrar los datos.',
        },
        {
          id: 'd',
          label:
            'El ancho de banda no afecta ni al sesgo ni a la varianza cuando se utiliza una regresión lineal.',
        },
      ],
      correctOptionId: 'a',
      explanation:
        'En una vecindad más estrecha alrededor de c = 80 USD la aproximación lineal es más fiel (menor sesgo de especificación), pero el número de observaciones N cae, elevando la varianza y el error estándar. Las opciones b, c y d invierten o niegan esta relación fundamental.',
    },
    {
      id: 'check-rdd-predict-fuzzy',
      type: 'predict-output',
      prompt:
        'En la red completa de tiendas dentro de [60, 100] USD, el intercepto de total_usd en c = 80 pasa de 92.80 USD (izquierda) a 91.73 USD (derecha, salto ITT de -1.07 USD), mientras la proporción con descuento salta de 0.0000 a 0.2843. ¿Qué devuelve la razón del estimador Fuzzy RDD?',
      code: `SELECT
  ROUND((91.73 - 92.80) / (0.2843 - 0.0000), 2) AS efecto_fuzzy_compliers_usd;`,
      options: [
        {
          id: 'a',
          label:
            '-3.76 USD; escala el salto promedio de intención de tratar (-1.07 USD) por la fracción que realmente recibió el descuento (0.2843).',
        },
        {
          id: 'b',
          label:
            '-1.07 USD; en un diseño difuso el denominador de cumplimiento no modifica el salto observado.',
        },
        {
          id: 'c',
          label:
            '-0.30 USD; multiplica el salto de -1.07 USD por la tasa de descuento de 0.2843.',
        },
      ],
      correctOptionId: 'a',
      explanation:
        'En un RDD difuso, el estimador de Wald divide el salto en el resultado (-1.07 USD) entre el salto en la probabilidad de tratamiento (0.2843), dando -1.07 / 0.2843 = -3.76 USD por pedido elegible con descuento. La opción b ignora la primera etapa y la c multiplica en vez de dividir.',
    },
    {
      id: 'check-rdd-spot-bug',
      type: 'spot-the-bug',
      prompt:
        'Este bloque SQL intenta comparar las medias de total_usd alrededor del umbral de 80 USD, pero arroja una diferencia positiva de +21.05 USD en vez del salto en el corte. ¿Qué error metodológico contiene?',
      code: `SELECT
  CASE WHEN subtotal_usd < 80 THEN 'control' ELSE 'tratado' END AS grupo,
  ROUND(AVG(total_usd), 2) AS estimacion_rdd_usd
FROM orders
WHERE status = 'completed'
  AND subtotal_usd BETWEEN 60 AND 100
GROUP BY 1;`,
      options: [
        {
          id: 'a',
          label:
            'Promedia total_usd en toda la semiventana [60, 80) y [80, 100] sin ajustar por la pendiente de subtotal_usd - 80 hasta el corte.',
        },
        {
          id: 'b',
          label:
            'El operador BETWEEN en SQL excluye los extremos 60 y 100, sesgando el conteo de pedidos.',
        },
        {
          id: 'c',
          label:
            'La condición subtotal_usd < 80 incluye pedidos con subtotal igual a 80 USD dentro del grupo de control.',
        },
      ],
      correctOptionId: 'a',
      explanation:
        'Promediar directamente en una ventana de +/-20 USD compara carritos con subtotal medio cercano a 70 USD contra carritos cercanos a 90 USD; falta proyectar hasta el umbral con REGR_INTERCEPT(total_usd, subtotal_usd - 80). Las opciones b y c son falsas: BETWEEN es inclusivo y < 80 envía el valor 80.00 al grupo tratado.',
    },
  ],
  practice: {
    id: 'practice-da4-causalidad-02-rdd-umbral-80',
    title:
      'Estimar el diseño RDD y auditar densidad alrededor de 80 USD en toda la red de tiendas',
    prompt:
      'Evalúa la regla de descuento en c = 80 USD sobre todos los pedidos completados (status = \'completed\') dentro del ancho de banda h = 20 USD (subtotal_usd >= 60 AND subtotal_usd <= 100). Agrupa por lado_umbral (\'1_control_bajo_80\' cuando subtotal_usd < 80 y \'2_tratado_sobre_80\' en caso contrario) y calcula: n_pedidos (conteo total en la semiventana), n_ventana_5usd (conteo de pedidos con subtotal_usd >= 75 AND subtotal_usd < 85 para auditar densidad pegada al corte), tasa_descuento (proporción con discount_usd > 0 redondeada a 4 decimales), media_ingenua_usd (media de total_usd a 2 decimales), pendiente_local (REGR_SLOPE de total_usd respecto a subtotal_usd - 80 a 4 decimales) e intercepto_en_80_usd (REGR_INTERCEPT de total_usd respecto a subtotal_usd - 80 a 2 decimales). Ordena por lado_umbral ASC.',
    engine: 'duckdb',
    datasets: ['orders'],
    starterCode: `SELECT
  CASE
    WHEN subtotal_usd < 80 THEN '1_control_bajo_80'
    ELSE '2_tratado_sobre_80'
  END AS lado_umbral,
  COUNT(*) AS n_pedidos,
  COUNT(*) FILTER (WHERE subtotal_usd >= 75 AND subtotal_usd < 85) AS n_ventana_5usd,
  ROUND(AVG(CASE WHEN discount_usd > 0 THEN 1.0 ELSE 0.0 END), 4) AS tasa_descuento,
  ROUND(AVG(total_usd), 2) AS media_ingenua_usd
  -- TODO: agrega pendiente_local (4 decimales) e intercepto_en_80_usd (2 decimales) centrando en subtotal_usd - 80
FROM orders
WHERE status = 'completed'
  AND subtotal_usd >= 60
  AND subtotal_usd <= 100
GROUP BY 1
ORDER BY 1 ASC;`,
    solution: `SELECT
  CASE
    WHEN subtotal_usd < 80 THEN '1_control_bajo_80'
    ELSE '2_tratado_sobre_80'
  END AS lado_umbral,
  COUNT(*) AS n_pedidos,
  COUNT(*) FILTER (WHERE subtotal_usd >= 75 AND subtotal_usd < 85) AS n_ventana_5usd,
  ROUND(AVG(CASE WHEN discount_usd > 0 THEN 1.0 ELSE 0.0 END), 4) AS tasa_descuento,
  ROUND(AVG(total_usd), 2) AS media_ingenua_usd,
  ROUND(REGR_SLOPE(total_usd, subtotal_usd - 80), 4) AS pendiente_local,
  ROUND(REGR_INTERCEPT(total_usd, subtotal_usd - 80), 2) AS intercepto_en_80_usd
FROM orders
WHERE status = 'completed'
  AND subtotal_usd >= 60
  AND subtotal_usd <= 100
GROUP BY 1
ORDER BY 1 ASC;`,
    hints: [
      'En DuckDB las funciones de regresión lineal reciben primero la variable dependiente Y (total_usd) y como segundo argumento la variable explicativa X centrada (subtotal_usd - 80).',
      'Usa REGR_SLOPE(total_usd, subtotal_usd - 80) envuelto en ROUND(..., 4) para pendiente_local.',
      'Usa ROUND(REGR_INTERCEPT(total_usd, subtotal_usd - 80), 2) AS intercepto_en_80_usd como última columna del SELECT.',
    ],
    assertions: [
      { type: 'row-count', expected: 2 },
      {
        type: 'column-names',
        expected: [
          'lado_umbral',
          'n_pedidos',
          'n_ventana_5usd',
          'tasa_descuento',
          'media_ingenua_usd',
          'pendiente_local',
          'intercepto_en_80_usd',
        ],
      },
      {
        type: 'cell-value',
        row: 0,
        column: 'intercepto_en_80_usd',
        expected: 92.8,
      },
      {
        type: 'cell-value',
        row: 1,
        column: 'tasa_descuento',
        expected: 0.2843,
      },
      {
        type: 'cell-value',
        row: 1,
        column: 'intercepto_en_80_usd',
        expected: 91.73,
      },
    ],
    expectedOutputTable: {
      columns: [
        'lado_umbral',
        'n_pedidos',
        'n_ventana_5usd',
        'tasa_descuento',
        'media_ingenua_usd',
        'pendiente_local',
        'intercepto_en_80_usd',
      ],
      rows: [
        ['1_control_bajo_80', 661, 181, 0, 81.88, 1.16, 92.8],
        ['2_tratado_sobre_80', 489, 122, 0.2843, 102.93, 1.1176, 91.73],
      ],
    },
  },
  roleNotes: {
    da: 'Siempre acompaña tu estimación RDD con el conteo de pedidos en cubetas estrechas alrededor del corte y reporta al menos dos anchos de banda (por ejemplo, +/-15 y +/-20 USD) para demostrar estabilidad.',
    bi: 'Al visualizar un umbral de elegibilidad en un dashboard, grafica la media por cubetas de 2 o 5 USD junto con las dos rectas locales ajustadas a cada lado; nunca muestres una sola barra global antes vs. después del corte.',
    de: 'Registra en la tabla de pedidos el subtotal bruto previo a promociones (subtotal_usd) separado de discount_usd; si solo almacenas el importe neto posdescuento, la variable de asignación queda mecánicamente distorsionada.',
    ds: 'Cuando el cumplimiento salta menos del 100 % en el corte (como el 28.43 % observado en toda la red), interpreta el salto de interceptos como efecto de intención de tratar (ITT) y divídelo por el salto de primera etapa para obtener el LATE de cumplidores.',
  },
  summary: [
    'La regresión discontinua (RDD) identifica el efecto causal local comparando observaciones situadas inmediatamente debajo y encima de un umbral de elegibilidad.',
    'Centrar la variable de asignación en X - c permite estimar con REGR_INTERCEPT el valor esperado exactamente en el punto de corte sin sesgo por tamaño de canasta.',
    'En un diseño nítido la probabilidad de tratamiento salta de 0 a 1 en el umbral, mientras que en un diseño difuso salta en una fracción menor y requiere escalar por el cumplimiento.',
    'La validez interna exige verificar que no exista manipulación o apilamiento artificial de observaciones justo del lado elegible del umbral.',
  ],
  flashcards: [
    {
      id: 'fc-rdd-01',
      front: '¿Qué es la variable de asignación (running variable) en un diseño RDD?',
      back: 'Es la métrica continua observable (como subtotal_usd en orders) cuyo cruce por un umbral fijo c determina si una unidad es elegible para el tratamiento.',
    },
    {
      id: 'fc-rdd-02',
      front: '¿Por qué es indispensable centrar la variable de asignación como X - c antes de usar REGR_INTERCEPT?',
      back: 'Porque REGR_INTERCEPT evalúa la recta donde la variable explicativa vale cero; al usar X - c, el cero corresponde exactamente al punto de corte X = c.',
    },
    {
      id: 'fc-rdd-03',
      front: '¿Qué diferencia a un RDD nítido (Sharp) de un RDD difuso (Fuzzy)?',
      back: 'En el RDD nítido la probabilidad de tratamiento salta de 0 a 1 en el corte; en el RDD difuso salta en menos de 1 y el salto del resultado se divide entre el salto de cumplimiento.',
    },
    {
      id: 'fc-rdd-04',
      front: '¿Qué busca detectar el chequeo de densidad alrededor del umbral en un estudio RDD?',
      back: 'Busca detectar manipulación estratégica (bunching), es decir, si los usuarios o agentes fuerzan sus valores justo por encima del umbral y rompen la comparabilidad local.',
    },
  ],
  glossaryTerms: [
    'regresion-discontinua',
    'variable-de-asignacion',
    'ancho-de-banda-rdd',
  ],
  sources: [
    {
      title: 'Causal Inference: The Mixtape — Chapter 6: Regression Discontinuity',
      url: 'https://mixtape.scunning.com/06-Regression_Discontinuity.html',
      publisher: 'Yale University Press / Scott Cunningham',
      accessed: '2026-10-29',
      supports:
        'Fundamentos de Sharp y Fuzzy RDD, continuidad de resultados potenciales y test de densidad de McCrary.',
    },
    {
      title: 'The Effect — Chapter 20: Regression Discontinuity',
      url: 'https://theeffectbook.net/ch-RegressionDiscontinuity.html',
      publisher: 'Chapman & Hall / Nick Huntington-Klein',
      accessed: '2026-10-29',
      supports:
        'Centrado de la variable de asignación en el umbral, ajuste lineal local y selección de ancho de banda.',
    },
    {
      title:
        'RD Packages — A Practical Introduction to Regression Discontinuity Designs',
      url: 'https://rdpackages.github.io/',
      publisher: 'Cattaneo, Idrobo & Titiunik',
      accessed: '2026-10-29',
      supports:
        'Compromiso sesgo-varianza en ventanas locales y pruebas empíricas de falsación.',
    },
    {
      title: 'DuckDB Statistical Aggregate Functions (REGR_SLOPE, REGR_INTERCEPT)',
      url: 'https://duckdb.org/docs/stable/sql/functions/aggregates',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports:
        'Cálculo de pendientes e interceptos de regresión lineal por grupo en SQL.',
    },
  ],
  aiNotes:
    'Enfatiza por qué la media simple en la ventana [60, 100] USD engaña (+21.05 USD) debido a que subtotal_usd sigue creciendo dentro de cada semiventana. Si el estudiante olvida el orden de argumentos en DuckDB, recuérdale que REGR_SLOPE(y, x) y REGR_INTERCEPT(y, x) reciben primero total_usd y segundo subtotal_usd - 80.',
};
