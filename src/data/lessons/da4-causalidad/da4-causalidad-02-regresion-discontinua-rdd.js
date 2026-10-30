export default {
  id: 'da4-causalidad-02-regresion-discontinua-rdd',
  moduleId: 'da4-causalidad',
  title: 'Regresión discontinua (RDD) alrededor de un umbral',
  subtitle:
    'Regresión discontinua (RDD): estimar el impacto causal alrededor de un umbral de elegibilidad',
  tracks: ['da'],
  level: 4,
  order: 2,
  minutes: 25,
  prerequisites: [
    'da4-causalidad-01-diferencias-en-diferencias-did',
    'c0-numeros-05-correlacion-causalidad',
  ],
  contentVersion: 1,
  hook: 'En Mercado Brisa, los carritos cuyo subtotal alcanza o supera 80.00 USD acceden a un descuento promocional del 5 %, mientras que un pedido de 79.90 USD recibe cero descuento. Si comparas todos los pedidos desde 80 USD contra los menores de 80 USD en Tienda Reforma Norte, la factura media sube +30.65 USD en el grupo con descuento. ¿Cómo separas el salto causal real producido al cruzar el umbral de 80 USD del hecho mecánico de que las canastas más grandes siempre facturan más?',
  objectives: [
    'Estimar el efecto causal local (LATE en el umbral) centrando la variable de asignación en el punto de corte y ajustando rectas locales con REGR_INTERCEPT y REGR_SLOPE.',
    'Distinguir entre regresión discontinua nítida (Sharp RDD) y difusa (Fuzzy RDD) según el salto en la probabilidad de recibir el tratamiento.',
    'Auditar la validez interna en el punto de corte evaluando el ancho de banda y el conteo de densidad para detectar manipulación de carritos.',
  ],
  sections: [
    {
      id: 'anatomia-rdd-variable-asignacion',
      heading: 'Variable de asignación, punto de corte y sesgo global',
      body: 'Muchas reglas de negocio asignan incentivos mediante una fórmula determinista. Por ejemplo, Mercado Brisa aplica envío sin cargo a partir de `60.00 USD` en almacenes logísticos. También otorga un descuento promocional del `5 %` cuando el subtotal del pedido (`subtotal_usd`) alcanza el umbral $c = 80.00\\text{ USD}$. En la literatura causal, la métrica continua que determina la elegibilidad se denomina **variable de asignación** ($X_i$).\n\nEn este escenario, la superposición global se rompe por diseño. Ningún pedido con $X_i < 80$ recibe el descuento promocional y todos los elegibles tienen $X_i \\ge 80$. Si restamos de forma ingenua la media de `total_usd` de los pedidos con `subtotal_usd >= 80` frente a los de `subtotal_usd < 80`, confundimos el efecto del descuento con la propia variable de asignación. El subtotal impulsa de manera directa el importe final.\n\nEl diseño de **regresión discontinua (RDD)** aprovecha lo que sucede justo en la frontera del corte. Un cliente con un carrito de `79.80 USD` y otro con `80.20 USD` son casi equivalentes en preferencias y poder de compra. Mientras la relación entre el subtotal y el resultado potencial sin descuento sea continua en $c = 80$, cualquier salto vertical abrupto justo en el punto de corte identifica el efecto causal local.',
    },
    {
      id: 'centrado-umbral-regresion-local',
      heading: 'Centrado en el umbral y estimación lineal local en SQL',
      body: 'Promediar `total_usd` dentro de una ventana moderada tampoco elimina el arrastre del tamaño de canasta. En Tienda Reforma Norte (`store_id = 1`), dentro de la ventana `[50, 110] USD`, los pedidos a la derecha del corte tienen un subtotal medio de `97.63 USD`. A la izquierda del corte, el subtotal medio es de `66.33 USD`. Esa pendiente positiva genera una diferencia de medias ingenua de `107.59 - 76.94 = +30.65 USD`.\n\nPara eliminar el arrastre de la pendiente sin salir de SQL, aplicamos el **centrado de la variable de asignación**. Definimos la distancia al corte como $X_{c,i} = \\text{subtotal\\_usd}_i - 80$. Luego ajustamos una regresión lineal de `total_usd` sobre $X_{c,i}$ por separado a cada lado del umbral. La ordenada en el origen (`REGR_INTERCEPT(total_usd, subtotal_usd - 80)`) estima el valor esperado de `total_usd` cuando $X_{c,i} = 0$, es decir, exactamente en $X_i = 80\\text{ USD}$.\n\nEn Tienda Reforma Norte, el intercepto por la izquierda en $X_i = 80$ es `92.80 USD` ($80 \\times 1.16$ con el `16 %` de impuesto). El intercepto por la derecha cae a `88.16 USD` ($80 \\times 0.95 \\times 1.16$). La resta de ambos interceptos revela el impacto exacto en el umbral: $88.16 - 92.80 = -4.64\\text{ USD}$ por pedido.',
      example: {
        language: 'sql',
        code: `SELECT
  CASE WHEN subtotal_usd < 80 THEN '1_control_bajo_80' ELSE '2_tratado_sobre_80' END AS grupo_umbral,
  COUNT(*) AS n_pedidos,
  ROUND(AVG(total_usd), 2) AS media_ingenua_total_usd,
  ROUND(REGR_SLOPE(total_usd, subtotal_usd - 80), 4) AS pendiente_local,
  ROUND(REGR_INTERCEPT(total_usd, subtotal_usd - 80), 2) AS intercepto_en_80_usd
FROM orders
WHERE status = 'completed'
  AND store_id = 1
  AND subtotal_usd BETWEEN 50 AND 110
GROUP BY 1
ORDER BY 1;`,
        expectedOutput: [
          {
            grupo_umbral: '1_control_bajo_80',
            n_pedidos: 49,
            media_ingenua_total_usd: 76.94,
            pendiente_local: 1.16,
            intercepto_en_80_usd: 92.8,
          },
          {
            grupo_umbral: '2_tratado_sobre_80',
            n_pedidos: 28,
            media_ingenua_total_usd: 107.59,
            pendiente_local: 1.102,
            intercepto_en_80_usd: 88.16,
          },
        ],
      },
    },
    {
      id: 'sharp-vs-fuzzy-rdd',
      heading: 'Diseño nítido (Sharp RDD) frente a diseño difuso (Fuzzy RDD)',
      body: 'No todas las reglas de elegibilidad se aplican al `100 %` de los pedidos que cruzan el umbral. Esta diferencia divide al método en dos variantes.\n\nEn un **RDD nítido** (*Sharp RDD*), la probabilidad de recibir el tratamiento salta de `0` a `1` en el punto de corte $c$. Es lo que ocurre en Tienda Reforma Norte (`store_id = 1`). Debajo de `80 USD`, ningún pedido recibe descuento (`0.0000`). A partir de `80 USD`, el `100 %` recibe el `5 %` de descuento (`1.0000`). Allí el salto de interceptos (`-4.64 USD`) estima directamente el efecto causal en $c = 80$.\n\nEn un **RDD difuso** (*Fuzzy RDD*), cruzar el umbral incrementa la probabilidad de tratamiento en menos de uno ($0 < \\Delta P < 1$). Esto sucede cuando el beneficio requiere además pertenecer a una campaña activa (`CMP-BARISTA` o `CMP-VERANO`). Al agregar todas las tiendas de Mercado Brisa en la ventana `[60, 100] USD`, la tasa de descuento salta de `0.0000` a `0.2843` (`28.43 %`). A su vez, el intercepto de `total_usd` pasa de `92.80 USD` a `91.73 USD` (`-1.07 USD`). El efecto local para quienes reciben el descuento se obtiene dividiendo el salto de resultado entre el salto de cumplimiento: $\\hat{\\tau}_{\\text{Fuzzy}} = \\Delta Y_c / \\Delta D_c$.',
    },
    {
      id: 'ancho-banda-densidad-mccrary',
      heading: 'Ancho de banda y prueba de manipulación en el umbral',
      body: 'Dos decisiones metodológicas gobiernan la credibilidad de cualquier estudio RDD. La primera es la elección del **ancho de banda** ($h$), que restringe la muestra al intervalo $[c - h,\\, c + h]$. Un ancho de banda muy amplio, como $h = 60\\text{ USD}$, incluye más observaciones y reduce la varianza muestral. Sin embargo, introduce sesgo si la relación real entre $X$ e $Y$ es curva lejos del umbral. Una ventana estrecha ($h = 15$ o $20\\text{ USD}$) reduce el sesgo de especificación a cambio de mayor error estándar.\n\nLa segunda verificación obligatoria es la **prueba de continuidad de densidad** (inspirada en el test de McCrary). Si los clientes o cajeros conocen el umbral de `80.00 USD`, podrían agregar artículos pequeños para pasar de `78 USD` a `81 USD`. Eso produciría un apilamiento artificial justo por encima de `80 USD` y un hueco justo por debajo.\n\nEn SQL auditamos esta amenaza contando los pedidos en cubetas simétricas de `5 USD` pegadas al corte: `[75, 80)` frente a `[80, 85)`. En Mercado Brisa hay `181` pedidos en `[75, 80)` y `122` en `[80, 85)`. Esto descarta un apilamiento oportunista por encima de `80 USD`. Además, recuerda que el RDD estima un **LATE en el umbral**: vale para canastas cercanas a `80 USD` y no debe extrapolarse a pedidos corporativos de `500 USD`.',
      example: {
        language: 'sql',
        code: `SELECT
  CAST(FLOOR(subtotal_usd / 5) * 5 AS INTEGER) AS cubeta_5usd,
  COUNT(*) AS n_pedidos,
  ROUND(AVG(CASE WHEN discount_usd > 0 THEN 1.0 ELSE 0.0 END), 4) AS tasa_descuento
FROM orders
WHERE status = 'completed'
  AND subtotal_usd >= 70
  AND subtotal_usd < 90
GROUP BY 1
ORDER BY 1;`,
        expectedOutput: [
          { cubeta_5usd: 70, n_pedidos: 179, tasa_descuento: 0 },
          { cubeta_5usd: 75, n_pedidos: 181, tasa_descuento: 0 },
          { cubeta_5usd: 80, n_pedidos: 122, tasa_descuento: 0.2787 },
          { cubeta_5usd: 85, n_pedidos: 111, tasa_descuento: 0.2252 },
        ],
      },
    },
  ],
  workedExample: {
    title: 'Estimación de RDD nítido en Tienda Reforma Norte (store_id = 1) en c = 80 USD',
    description:
      'En Tienda Reforma Norte (`store_id = 1`), todo pedido completado con `subtotal_usd >= 80` recibe automáticamente un `5 %` de descuento. Comparamos la diferencia ingenua de medias en la ventana `[50, 110] USD` (`+30.65 USD`) frente a la regresión lineal local centrada en `subtotal_usd - 80`, que recupera el salto exacto en el umbral (`-4.64 USD`).',
    steps: [
      {
        label: 'Paso 1 — Verificación de cumplimiento nítido y media ingenua por lado',
        explanation:
          'Filtramos los pedidos completados de `store_id = 1` dentro del ancho de banda $h = 30\\text{ USD}$ alrededor del corte (`subtotal_usd BETWEEN 50 AND 110`). Comprobamos que la proporción con descuento salta de `0` a `1` en `80 USD`, pero la media ingenua de `total_usd` es mayor a la derecha (`107.59` frente a `76.94 USD`) porque el subtotal medio es más alto (`97.63` frente a `66.33 USD`).',
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
        expectedOutput: [
          {
            grupo_umbral: '1_control_bajo_80',
            n_pedidos: 49,
            prop_descuento: 0,
            media_subtotal_usd: 66.33,
            media_ingenua_total_usd: 76.94,
          },
          {
            grupo_umbral: '2_tratado_sobre_80',
            n_pedidos: 28,
            prop_descuento: 1,
            media_subtotal_usd: 97.63,
            media_ingenua_total_usd: 107.59,
          },
        ],
      },
      {
        label: 'Paso 2 — Ajuste de rectas locales centradas en subtotal_usd - 80',
        explanation:
          'Centramos la variable de asignación como `subtotal_usd - 80` y estimamos la pendiente y el intercepto local en $X = 80\\text{ USD}$ a cada lado del umbral usando `REGR_SLOPE` y `REGR_INTERCEPT`. La resta de interceptos (`88.16 - 92.80 = -4.64 USD`) aísla el impacto exacto del descuento en el corte.',
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
        expectedOutput: [
          {
            grupo_umbral: '1_control_bajo_80',
            n_pedidos: 49,
            pendiente_local: 1.16,
            intercepto_en_80_usd: 92.8,
          },
          {
            grupo_umbral: '2_tratado_sobre_80',
            n_pedidos: 28,
            pendiente_local: 1.102,
            intercepto_en_80_usd: 88.16,
          },
        ],
      },
    ],
  },
  checks: [
    {
      id: 'chk-da4-02-1',
      type: 'mcq',
      prompt:
        '¿Por qué calculamos `REGR_INTERCEPT(total_usd, subtotal_usd - 80)` en lugar de `REGR_INTERCEPT(total_usd, subtotal_usd)` al estimar un diseño RDD con umbral en 80 USD?',
      options: [
        {
          id: 'a',
          text: 'Porque sin restar 80 el intercepto evalúa la recta en subtotal_usd = 0 USD, lejos del punto de corte donde ocurre la discontinuidad',
          correct: true,
          feedback:
            'Exacto: al centrar en subtotal_usd - 80, el valor cero del regresor coincide exactamente con el umbral de 80 USD.',
        },
        {
          id: 'b',
          text: 'Porque DuckDB exige que el segundo argumento de REGR_INTERCEPT tenga media muestral igual a cero para no devolver NULL',
          correct: false,
          feedback:
            'DuckDB acepta cualquier regresor numérico con varianza positiva; el centrado es un requisito estadístico de evaluación en el corte.',
        },
        {
          id: 'c',
          text: 'Porque restar 80 convierte un diseño difuso (Fuzzy RDD) en un diseño nítido (Sharp RDD) sin cambiar los datos',
          correct: false,
          feedback:
            'Centrar la variable explicativa no modifica la fracción de pedidos que reciben el descuento a cada lado del corte.',
        },
      ],
      explanation:
        'El intercepto de una regresión lineal mide el valor esperado de Y cuando el regresor vale 0. Al usar X_c = subtotal_usd - 80, el punto X_c = 0 evalúa ambas rectas locales exactamente en el umbral subtotal_usd = 80 USD.',
    },
    {
      id: 'chk-da4-02-2',
      type: 'mcq',
      prompt:
        'Al reducir el ancho de banda h alrededor del umbral de 80 USD (por ejemplo, pasando de [40, 120] a [72, 88]), ¿cómo cambia el compromiso entre sesgo y varianza del estimador RDD?',
      options: [
        {
          id: 'a',
          text: 'Disminuye el sesgo por curvatura lejos del corte, pero aumenta la varianza muestral al quedar menos pedidos en la ventana',
          correct: true,
          feedback:
            'Correcto: cerca del umbral la aproximación lineal es más precisa (menor sesgo), pero el menor tamaño muestral incrementa la varianza.',
        },
        {
          id: 'b',
          text: 'Disminuye tanto el sesgo de especificación como la varianza muestral porque se eliminan valores extremos',
          correct: false,
          feedback:
            'Reducir el número de observaciones en la ventana eleva el error estándar del intercepto estimado.',
        },
        {
          id: 'c',
          text: 'Aumenta el sesgo de especificación funcional, pero se reduce el error estándar al concentrar los datos',
          correct: false,
          feedback:
            'Esta opción invierte ambos efectos: en ventanas más estrechas el sesgo funcional baja y el error estándar sube.',
        },
      ],
      explanation:
        'La selección del ancho de banda en regresión discontinua equilibra precisión local y tamaño muestral: ventanas más estrechas reducen el sesgo por no linealidades lejanas, pero incrementan la varianza por tener menos observaciones.',
    },
    {
      id: 'chk-da4-02-3',
      type: 'predict-output',
      prompt:
        'En la red completa de tiendas dentro de [60, 100] USD, el intercepto de total_usd en c = 80 pasa de 92.80 USD (izquierda) a 91.73 USD (derecha, salto ITT de -1.07 USD), mientras la proporción con descuento salta de 0.0000 a 0.2843. ¿Qué devuelve `SELECT ROUND((91.73 - 92.80) / 0.2843, 2)`?',
      options: [
        {
          id: 'a',
          text: '-3.76; escala el salto de intención de tratar (-1.07 USD) entre la fracción que realmente recibió el descuento (0.2843)',
          correct: true,
          feedback:
            'Exacto: en un RDD difuso el estimador de Wald divide el salto del resultado entre el salto de la probabilidad de tratamiento.',
        },
        {
          id: 'b',
          text: '-1.07; en un diseño difuso el denominador de cumplimiento no modifica el salto observado',
          correct: false,
          feedback:
            '-1.07 USD es el salto promedio diluido entre quienes recibieron y no recibieron descuento; al dividir por 0.2843 da -3.76 USD.',
        },
        {
          id: 'c',
          text: '-0.30; multiplica el salto de -1.07 USD por la tasa de descuento de 0.2843',
          correct: false,
          feedback:
            'El estimador Fuzzy RDD divide por el salto de primera etapa (0.2843), no multiplica.',
        },
      ],
      explanation:
        'En un RDD difuso, dividir el salto del intercepto de resultado (-1.07 USD) entre el salto en la probabilidad de tratamiento (0.2843) arroja -3.76 USD, que estima el efecto local para los pedidos cumplidores.',
    },
    {
      id: 'chk-da4-02-4',
      type: 'mcq',
      prompt:
        'Un analista estima el efecto en el umbral promediando `AVG(total_usd)` entre [60, 80) y [80, 100] sin usar `REGR_INTERCEPT`, obteniendo +21.05 USD. ¿Por qué es erróneo ese cálculo?',
      options: [
        {
          id: 'a',
          text: 'Porque compara canastas con subtotal medio cercano a 70 USD contra canastas cercanas a 90 USD sin descontar la pendiente respecto a subtotal_usd - 80',
          correct: true,
          feedback:
            'Exacto: incluso dentro de una ventana de +/-20 USD, la diferencia de medias sigue dominada por el crecimiento de subtotal_usd.',
        },
        {
          id: 'b',
          text: 'Porque el operador BETWEEN en DuckDB excluye los valores extremos 60 y 100 del cálculo',
          correct: false,
          feedback:
            'BETWEEN en SQL es inclusivo en ambos extremos; el error es estadístico por omitir el ajuste lineal hasta el corte.',
        },
        {
          id: 'c',
          text: 'Porque la función AVG() convierte automáticamente los descuentos en valores positivos',
          correct: false,
          feedback:
            'AVG() promedia los valores tal cual están registrados; el sesgo proviene de no proyectar la recta hasta X = 80.',
        },
      ],
      explanation:
        'Promediar en toda la semiventana [60, 80) frente a [80, 100] mezcla una diferencia de ~20 USD en el subtotal de compra; para aislar el salto en c = 80 debe evaluarse REGR_INTERCEPT(total_usd, subtotal_usd - 80).',
    },
  ],
  practice: {
    type: 'sql',
    title: 'Estimar el diseño RDD y auditar densidad alrededor de 80 USD',
    language: 'sql',
    prompt:
      'Evalúa el corte `c = 80 USD` en pedidos completados (`status = \'completed\'`) dentro de `subtotal_usd >= 60 AND subtotal_usd <= 100`. Agrupa por `lado_umbral` (`\'1_control_bajo_80\'` si `subtotal_usd < 80`, si no `\'2_tratado_sobre_80\'`) y calcula: `n_pedidos`, `n_ventana_5usd` (`subtotal_usd >= 75 AND subtotal_usd < 85`), `tasa_descuento` (fracción con `discount_usd > 0`, 4 decimales), `media_ingenua_usd` (`AVG(total_usd)`, 2 decimales), `pendiente_local` (`REGR_SLOPE(total_usd, subtotal_usd - 80)`, 4 decimales) e `intercepto_en_80_usd` (`REGR_INTERCEPT(total_usd, subtotal_usd - 80)`, 2 decimales). Ordena por `lado_umbral ASC`.',
    starterCode: `SELECT
  CASE
    WHEN subtotal_usd < 80 THEN '1_control_bajo_80'
    ELSE '2_tratado_sobre_80'
  END AS lado_umbral,
  COUNT(*) AS n_pedidos,
  COUNT(*) FILTER (WHERE subtotal_usd >= 75 AND subtotal_usd < 85) AS n_ventana_5usd,
  ROUND(AVG(CASE WHEN discount_usd > 0 THEN 1.0 ELSE 0.0 END), 4) AS tasa_descuento,
  ROUND(AVG(total_usd), 2) AS media_ingenua_usd,
  -- Reemplaza los ceros por pendiente_local (4 decimales) e intercepto_en_80_usd (2 decimales):
  0.0 AS pendiente_local,
  0.0 AS intercepto_en_80_usd
FROM orders
WHERE status = 'completed'
  AND subtotal_usd >= 60
  AND subtotal_usd <= 100
GROUP BY 1
ORDER BY 1 ASC;`,
    expected: `SELECT
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
    orderMatters: true,
    hints: [
      'En DuckDB las funciones de regresión lineal reciben primero la variable dependiente Y (total_usd) y como segundo argumento la variable explicativa X centrada (subtotal_usd - 80).',
      'Usa ROUND(REGR_SLOPE(total_usd, subtotal_usd - 80), 4) AS pendiente_local.',
      'Usa ROUND(REGR_INTERCEPT(total_usd, subtotal_usd - 80), 2) AS intercepto_en_80_usd.',
    ],
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
    solutionExplanation:
      'Mientras la diferencia ingenua de medias aparenta +21.05 USD (102.93 vs 81.88 USD) por el mayor tamaño de carrito a la derecha, los interceptos evaluados en subtotal_usd = 80 revelan el salto de intención de tratar de -1.07 USD (91.73 vs 92.80 USD) con una tasa de descuento del 28.43 %.',
    expectedOutputTable: [
      {
        lado_umbral: '1_control_bajo_80',
        n_pedidos: 661,
        n_ventana_5usd: 181,
        tasa_descuento: 0,
        media_ingenua_usd: 81.88,
        pendiente_local: 1.16,
        intercepto_en_80_usd: 92.8,
      },
      {
        lado_umbral: '2_tratado_sobre_80',
        n_pedidos: 489,
        n_ventana_5usd: 122,
        tasa_descuento: 0.2843,
        media_ingenua_usd: 102.93,
        pendiente_local: 1.1176,
        intercepto_en_80_usd: 91.73,
      },
    ],
  },
  roleNotes: {
    da: 'Siempre acompaña tu estimación RDD con el conteo de pedidos en cubetas estrechas alrededor del corte y reporta al menos dos anchos de banda (por ejemplo, +/-15 y +/-20 USD) para demostrar estabilidad.',
    bi: 'Al visualizar un umbral de elegibilidad en un dashboard, grafica la media por cubetas de 2 o 5 USD junto con las dos rectas locales ajustadas a cada lado; nunca muestres una sola barra global antes vs. después del corte.',
    de: 'Registra en la tabla de pedidos el subtotal bruto previo a promociones (subtotal_usd) separado de discount_usd; si solo almacenas el importe neto posdescuento, la variable de asignación queda mecánicamente distorsionada.',
  },
  summary: [
    'La regresión discontinua (RDD) identifica el efecto causal local comparando observaciones justo debajo y encima de un umbral.',
    'Centrar la variable en X - c permite estimar con REGR_INTERCEPT el valor esperado exactamente en el corte.',
    'En un diseño nítido la probabilidad salta de 0 a 1; en uno difuso se divide entre el cumplimiento.',
    'La validez interna exige verificar que no exista manipulación o apilamiento artificial de observaciones en el umbral.',
  ],
  flashcards: [
    {
      id: 'fc-da4-02-1',
      front: '¿Qué es la variable de asignación (running variable) en un diseño RDD?',
      back: 'Es la métrica continua observable (como subtotal_usd en orders) cuyo cruce por un umbral fijo c determina si una unidad es elegible para el tratamiento.',
    },
    {
      id: 'fc-da4-02-2',
      front: '¿Por qué es indispensable centrar la variable de asignación como X - c antes de usar REGR_INTERCEPT?',
      back: 'Porque REGR_INTERCEPT evalúa la recta donde la variable explicativa vale cero; al usar X - c, el cero corresponde exactamente al punto de corte X = c.',
    },
    {
      id: 'fc-da4-02-3',
      front: '¿Qué diferencia a un RDD nítido (Sharp) de un RDD difuso (Fuzzy)?',
      back: 'En el RDD nítido la probabilidad de tratamiento salta de 0 a 1 en el corte; en el RDD difuso salta en menos de 1 y el salto del resultado se divide entre el salto de cumplimiento.',
    },
    {
      id: 'fc-da4-02-4',
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
