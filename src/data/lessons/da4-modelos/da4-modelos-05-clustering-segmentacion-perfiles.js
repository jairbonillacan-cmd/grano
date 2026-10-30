export const lesson = {
  "id": "da4-modelos-05-clustering-segmentacion-perfiles",
  "moduleId": "da4-modelos",
  "tracks": [
    "da"
  ],
  "level": 4,
  "order": 5,
  "title": "Agrupamiento (clustering) e interpretación de perfiles",
  "subtitle": "Agrupamiento (clustering) e interpretación de perfiles sin sobreajustar",
  "minutes": 20,
  "prerequisites": [
    "da4-modelos-04-pronostico-backtesting-mae-mase",
    "da3-producto-02-cohorts-retention-ltv"
  ],
  "contentVersion": 2,
  "hook": "Fidelización de Mercado Brisa ejecuta k-medias directamente sobre recencia en días, frecuencia de pedidos y gasto en dólares para crear diez segmentos de clientes. Al inspeccionar los grupos descubren que la frecuencia fue ignorada porque un desvío estándar en gasto supera mil quinientos dólares mientras la frecuencia varía en dos pedidos, y además nadie sabe qué campaña enviar al grupo siete. ¿Cómo estandarizas variables con puntaje z en SQL, eliges el número de grupos con el coeficiente de silueta y traduces los centroides en perfiles accionables?",
  "objectives": [
    "Explicar por qué la distancia euclidiana sin escalar queda sesgada hacia el atributo de mayor varianza numérica y corregirla mediante estandarización por puntaje z.",
    "Evaluar la cohesión y separación de un agrupamiento con el coeficiente de silueta evitando fragmentar la muestra en demasiados microgrupos.",
    "Construir y resumir perfiles de clientes en SQL combinando coordenadas estandarizadas (z-score) con promedios en las unidades originales del negocio."
  ],
  "sections": [
    {
      "id": "distancia-euclidiana-y-sesgo-de-escala",
      "heading": "Distancia euclidiana y el sesgo por disparidad de escala",
      "body": "Los algoritmos de agrupamiento geométrico como **k-medias** (*k-means*) asignan cada observación al centroide más cercano. Su objetivo es minimizar la suma de distancias euclidianas al cuadrado. Para dos clientes `i` y `j` descritos por `p` atributos, la distancia euclidiana es `d(i, j) = \\sqrt{Σ_(m=1)^p (x_im - x_jm)²}`.\n\nSi introducimos variables con unidades heterogéneas sin escalar, el atributo con mayor varianza numérica acapara la suma de cuadrados. En Mercado Brisa, el gasto acumulado por cliente tiene una desviación estándar de `1,529.42 USD`. En contraste, la recencia tiene `115.36 días` y la frecuencia apenas `2.21 pedidos`.\n\nUna diferencia de una desviación estándar en gasto aporta `1,529.42² ≈ 2.34 × 10^6` a la distancia al cuadrado. En cambio, una desviación estándar en frecuencia aporta solo `2.21² ≈ 4.88`. Sin estandarización previa, cualquier agrupamiento sobre estas tres columnas se reduce a cortar tramos de gasto total.",
      "example": {
        "language": "sql",
        "code": "WITH metricas_cliente AS (\n  SELECT\n    c.customer_id,\n    DATE_DIFF('day', MAX(o.order_date), DATE '2025-12-31') AS recencia_dias,\n    CAST(COUNT(o.order_id) AS DOUBLE) AS frecuencia_pedidos,\n    SUM(o.total_usd) AS gasto_total_usd\n  FROM customers c\n  JOIN orders o ON c.customer_id = o.customer_id\n  WHERE o.status = 'completed'\n  GROUP BY c.customer_id\n)\nSELECT\n  COUNT(*) AS n_clientes,\n  ROUND(STDDEV_SAMP(recencia_dias), 2) AS sd_recencia,\n  ROUND(STDDEV_SAMP(frecuencia_pedidos), 2) AS sd_frecuencia,\n  ROUND(STDDEV_SAMP(gasto_total_usd), 2) AS sd_gasto\nFROM metricas_cliente;",
        "expectedOutput": [
          {
            "n_clientes": 2292,
            "sd_recencia": 115.36,
            "sd_frecuencia": 2.21,
            "sd_gasto": 1529.42
          }
        ]
      }
    },
    {
      "id": "estandarizacion-puntaje-z-en-sql",
      "heading": "Estandarización por puntaje z con funciones de ventana",
      "body": "Para que todas las dimensiones contribuyan en igualdad de condiciones a la geometría del espacio, aplicamos la **estandarización por puntaje z** (*z-score*): `z_im = \\frac{x_im - x̄_m}{s_m}`, donde `x̄_m` es la media muestral y `s_m` la desviación estándar muestral del atributo `m`.\n\nTras esta transformación, cada variable queda centrada en media `0` y varianza `1`. Un valor `z_gasto = +1.44` significa que el cliente gasta `1.44` desviaciones estándar por encima del comprador promedio.\n\nEn DuckDB podemos estandarizar múltiples columnas en una sola pasada usando funciones de ventana con marco global vacío `OVER ()`:\n`(gasto - AVG(gasto) OVER ()) / STDDEV_SAMP(gasto) OVER () AS z_gasto`.\n\nCuando una variable monetaria presenta valores extremos muy asimétricos, conviene transformar primero con `ln(1 + x)` o escalar mediante la mediana y el rango intercuartílico antes de calcular distancias."
    },
    {
      "id": "seleccion-de-k-inercia-y-silueta",
      "heading": "Elección del número de grupos: inercia y coeficiente de silueta",
      "body": "En el agrupamiento no supervisado no existe una etiqueta `Y` verdadera para medir el error. Tampoco podemos elegir el número de grupos `k` buscando solo minimizar la **inercia intra-grupo** (`W_k = Σ_(c=1)^k Σ_(i ∈ C_c) ||z_i - μ_c||²`). Caeríamos en el sobreajuste. La inercia siempre disminuye al aumentar `k` y llega a cero cuando cada cliente forma su propio grupo.\n\nPara evaluar la calidad estructural de la partición usamos el **coeficiente de silueta** `s(i) = \\frac{b(i) - a(i)}{max{a(i), b(i)}} ∈ [-1, 1]`. Aquí `a(i)` mide la distancia media del punto `i` a su mismo grupo (cohesión). Por su parte, `b(i)` mide la distancia media al grupo vecino más próximo (separación).\n\nUn promedio global de silueta cercano a `+1` indica grupos compactos y bien diferenciados. Valores cercanos a `0` revelan solapamiento entre fronteras y aconsejan reducir `k` a menos perfiles accionables."
    },
    {
      "id": "traduccion-a-perfiles-operativos-sin-sobreajuste",
      "heading": "Interpretación de centroides y perfiles accionables",
      "body": "Un agrupamiento solo genera valor cuando cada segmento se traduce en una política clara de producto o marketing. Si entregamos diez grupos cuyas diferencias son matices estadísticos difíciles de explicar al equipo comercial, la segmentación quedará abandonada.\n\nUna práctica fiable consiste en resumir cada perfil reportando dos vistas simultáneas en la tabla de salida. Primero, los promedios en las **unidades originales** del negocio (`media_recencia_dias`, `media_frecuencia`, `media_gasto_usd`) para dimensionar presupuestos. Segundo, las coordenadas medias en **escala z** (`media_z_gasto`) para identificar qué rasgo distingue a cada grupo frente al promedio global.\n\nDe este modo distinguimos con nitidez tres perfiles operativos en Mercado Brisa: clientes de **alto valor activo** (`z_gasto ≥ 0.8` y compras recientes), clientes **en riesgo de inactividad** (`z_recencia > 0.8`) y el bloque de **comprador regular**."
    }
  ],
  "workedExample": {
    "title": "Estandarización RFM en escala z y construcción de perfiles en Mercado Brisa",
    "description": "Fidelización de Mercado Brisa quiere segmentar a los 2,292 clientes con pedidos completados al cierre de 2025-12-31 combinando recencia, frecuencia y gasto total estandarizados en escala z para cuantificar el tamaño y valor de tres perfiles operativos.",
    "audit": "Al trabajar en escala z identificamos 404 clientes de alto valor activo (+1.44 desviaciones estándar en gasto y recencia de 82.9 días) y 399 clientes en riesgo de inactividad (más de 361 días sin comprar a pesar de un gasto histórico de 2,355 USD).",
    "steps": [
      {
        "label": "Paso 1: Diagnóstico de escala bruta en recencia, frecuencia y gasto",
        "explanation": "Calculamos las métricas RFM brutas por cliente al corte 2025-12-31 y verificamos la disparidad de escalas entre las desviaciones estándar de recencia, frecuencia y gasto.",
        "code": "WITH metricas_cliente AS (\n  SELECT\n    c.customer_id,\n    DATE_DIFF('day', MAX(o.order_date), DATE '2025-12-31') AS recencia_dias,\n    CAST(COUNT(o.order_id) AS DOUBLE) AS frecuencia_pedidos,\n    SUM(o.total_usd) AS gasto_total_usd\n  FROM customers c\n  JOIN orders o ON c.customer_id = o.customer_id\n  WHERE o.status = 'completed'\n  GROUP BY c.customer_id\n)\nSELECT\n  COUNT(*) AS n_clientes,\n  ROUND(AVG(recencia_dias), 2) AS media_recencia,\n  ROUND(STDDEV_SAMP(recencia_dias), 2) AS sd_recencia,\n  ROUND(AVG(frecuencia_pedidos), 2) AS media_frecuencia,\n  ROUND(STDDEV_SAMP(frecuencia_pedidos), 2) AS sd_frecuencia,\n  ROUND(AVG(gasto_total_usd), 2) AS media_gasto,\n  ROUND(STDDEV_SAMP(gasto_total_usd), 2) AS sd_gasto\nFROM metricas_cliente;",
        "expectedOutput": [
          {
            "n_clientes": 2292,
            "media_recencia": 156.88,
            "sd_recencia": 115.36,
            "media_frecuencia": 6.44,
            "sd_frecuencia": 2.21,
            "media_gasto": 2735.37,
            "sd_gasto": 1529.42
          }
        ]
      },
      {
        "label": "Paso 2: Estandarización z-score y tabla de centroides por perfil",
        "explanation": "Estandarizamos las tres variables mediante puntaje z con funciones de ventana, asignamos cada cliente a su perfil conductual y resumimos los centroides tanto en unidades originales como en escala z.",
        "code": "WITH metricas_cliente AS (\n  SELECT\n    c.customer_id,\n    DATE_DIFF('day', MAX(o.order_date), DATE '2025-12-31') AS recencia_dias,\n    CAST(COUNT(o.order_id) AS DOUBLE) AS frecuencia_pedidos,\n    SUM(o.total_usd) AS gasto_total_usd\n  FROM customers c\n  JOIN orders o ON c.customer_id = o.customer_id\n  WHERE o.status = 'completed'\n  GROUP BY c.customer_id\n),\nestandarizadas AS (\n  SELECT\n    customer_id,\n    recencia_dias,\n    frecuencia_pedidos,\n    gasto_total_usd,\n    (recencia_dias - AVG(recencia_dias) OVER ()) / STDDEV_SAMP(recencia_dias) OVER () AS z_recencia,\n    (frecuencia_pedidos - AVG(frecuencia_pedidos) OVER ()) / STDDEV_SAMP(frecuencia_pedidos) OVER () AS z_frecuencia,\n    (gasto_total_usd - AVG(gasto_total_usd) OVER ()) / STDDEV_SAMP(gasto_total_usd) OVER () AS z_gasto\n  FROM metricas_cliente\n),\nperfiles AS (\n  SELECT\n    *,\n    CASE\n      WHEN z_gasto >= 0.8 AND z_recencia <= 0.0 THEN 'alto_valor_activo'\n      WHEN z_recencia > 0.8 THEN 'en_riesgo_inactividad'\n      ELSE 'comprador_regular'\n    END AS perfil_segmento\n  FROM estandarizadas\n)\nSELECT\n  perfil_segmento,\n  COUNT(*) AS n_clientes,\n  ROUND(AVG(recencia_dias), 2) AS media_recencia_dias,\n  ROUND(AVG(frecuencia_pedidos), 2) AS media_frecuencia,\n  ROUND(AVG(gasto_total_usd), 2) AS media_gasto_usd,\n  ROUND(AVG(z_gasto), 4) AS media_z_gasto\nFROM perfiles\nGROUP BY perfil_segmento\nORDER BY media_gasto_usd DESC;",
        "expectedOutput": [
          {
            "perfil_segmento": "alto_valor_activo",
            "n_clientes": 404,
            "media_recencia_dias": 82.9,
            "media_frecuencia": 8.56,
            "media_gasto_usd": 4935,
            "media_z_gasto": 1.4382
          },
          {
            "perfil_segmento": "en_riesgo_inactividad",
            "n_clientes": 399,
            "media_recencia_dias": 361.32,
            "media_frecuencia": 5.35,
            "media_gasto_usd": 2355.38,
            "media_z_gasto": -0.2485
          },
          {
            "perfil_segmento": "comprador_regular",
            "n_clientes": 1489,
            "media_recencia_dias": 122.16,
            "media_frecuencia": 6.16,
            "media_gasto_usd": 2240.38,
            "media_z_gasto": -0.3236
          }
        ]
      }
    ]
  },
  "checks": [
    {
      "id": "check-da4-05-dominancia-escala",
      "type": "mcq",
      "prompt": "Ejecutas k-medias con distancia euclidiana sobre dos variables sin escalar: ingreso_anual_usd (desviación estándar de 20,000 USD) y numero_visitas (desviación estándar de 4 visitas). ¿Qué ocurre con los grupos resultantes?",
      "options": [
        {
          "id": "a",
          "text": "Los grupos quedan determinados casi exclusivamente por ingreso_anual_usd, porque su varianza numérica es 25 millones de veces mayor que la de numero_visitas.",
          "correct": true,
          "feedback": "Correcto. En la suma de diferencias al cuadrado, 20,000^2 = 400,000,000 eclipsa por completo a 4^2 = 16."
        },
        {
          "id": "b",
          "text": "El algoritmo k-medias divide automáticamente cada columna por su desviación estándar antes de calcular centroides.",
          "correct": false,
          "feedback": "Incorrecto. K-medias opera sobre las coordenadas tal como se le entregan; el escalado previo es responsabilidad del analista."
        },
        {
          "id": "c",
          "text": "La variable numero_visitas acapara el agrupamiento porque tiene menos valores distintos.",
          "correct": false,
          "feedback": "Incorrecto. La contribución a la distancia euclidiana depende de la magnitud de las diferencias al cuadrado, no del número de valores únicos."
        },
        {
          "id": "d",
          "text": "El coeficiente de silueta se vuelve automáticamente negativo siempre que las variables tienen distintas unidades.",
          "correct": false,
          "feedback": "Incorrecto. La silueta en datos sin escalar puede parecer alta simplemente porque el algoritmo partió una sola variable en tramos."
        }
      ],
      "explanation": "Sin estandarización previa, cualquier algoritmo basado en distancia euclidiana actúa como una partición univariante encubierta de la variable con mayor escala numérica."
    },
    {
      "id": "check-da4-05-silueta-sobreajuste",
      "type": "mcq",
      "prompt": "Al probar distintos valores de k en k-medias obtienes los siguientes coeficientes medios de silueta: k=3 (0.54), k=4 (0.52), k=8 (0.28) y k=15 (0.14), aunque la inercia sigue bajando hasta k=15. ¿Qué número de grupos es más defendible?",
      "options": [
        {
          "id": "a",
          "text": "k = 3 o k = 4, donde el coeficiente de silueta alcanza su máximo (> 0.50) y los perfiles mantienen separación clara y tamaño accionable.",
          "correct": true,
          "feedback": "Correcto. Una silueta superior a 0.50 junto con pocos grupos interpretables evita fragmentar artificialmente la base de clientes."
        },
        {
          "id": "b",
          "text": "k = 15, porque siempre debemos elegir el valor de k que minimice la inercia intra-grupo.",
          "correct": false,
          "feedback": "Incorrecto. La inercia baja monótonamente con k; minimizarla sin penalización conduce a sobreajuste extremo."
        },
        {
          "id": "c",
          "text": "k = 15, porque en el coeficiente de silueta los valores más cercanos a cero indican mejor separación.",
          "correct": false,
          "feedback": "Incorrecto. En el coeficiente de silueta +1 es la mejor separación posible y valores cercanos a 0 indican grupos solapados."
        },
        {
          "id": "d",
          "text": "k = 8, porque es el punto medio aritmético entre 3 y 15.",
          "correct": false,
          "feedback": "Incorrecto. En k = 8 la silueta ya cayó a 0.28, señal de que estamos dividiendo grupos internamente homogéneos."
        }
      ],
      "explanation": "La inercia siempre disminuye al agregar centroides. El coeficiente de silueta penaliza la pérdida de separación entre grupos vecinos y señala cuándo aumentar k solo fragmenta la muestra."
    },
    {
      "id": "check-da4-05-puntaje-z",
      "type": "mcq",
      "prompt": "En la base estandarizada de clientes, el segmento A tiene media_z_gasto = +1.44 y media_z_recencia = -0.64. Sabiendo que la recencia mide los días transcurridos desde la última compra, ¿cómo interpretas este perfil?",
      "options": [
        {
          "id": "a",
          "text": "Son clientes que gastan 1.44 desviaciones estándar por encima del promedio y compraron más recientemente que la media (menos días desde su último pedido).",
          "correct": true,
          "feedback": "Correcto. En recencia (días sin comprar), un puntaje z negativo significa menos días de inactividad, es decir, compra más reciente."
        },
        {
          "id": "b",
          "text": "Son clientes inactivos porque su recencia tiene signo negativo (-0.64).",
          "correct": false,
          "feedback": "Incorrecto. Como la recencia se mide en días desde el último pedido, menos días (z < 0) significa mayor actividad reciente."
        },
        {
          "id": "c",
          "text": "Son clientes cuyo gasto total es exactamente 1.44 USD y compraron hace 64 días.",
          "correct": false,
          "feedback": "Incorrecto. Los puntajes z son adimensionales y expresan desviaciones estándar respecto a la media, no dólares ni días."
        },
        {
          "id": "d",
          "text": "El cálculo es erróneo porque un puntaje z nunca puede ser mayor que 1.0 ni menor que 0.0.",
          "correct": false,
          "feedback": "Incorrecto. Los puntajes z tienen media 0 y desviación estándar 1, por lo que toman valores positivos y negativos y superan 1.0 con normalidad."
        }
      ],
      "explanation": "En escala z, el cero representa la media global. Un z_gasto de +1.44 indica gasto muy superior a la media y un z_recencia de -0.64 indica menos días transcurridos desde la última compra."
    }
  ],
  "practice": {
    "type": "sql",
    "title": "Segmentación RFM estandarizada con puntaje z en Mercado Brisa",
    "language": "sql",
    "prompt": "Construye en DuckDB la segmentación conductual de clientes sobre `customers` y `orders` (filtrando `o.status = 'completed'`). Calcula primero por `customer_id`: `recencia_dias` (`DATE_DIFF('day', MAX(o.order_date), DATE '2025-12-31')`), `frecuencia_pedidos` (`CAST(COUNT(o.order_id) AS DOUBLE)`) y `gasto_total_usd` (`SUM(o.total_usd)`). Estandariza las tres métricas en escala z usando `AVG(...) OVER ()` y `STDDEV_SAMP(...) OVER ()`. Clasifica cada cliente en `perfil_segmento` con las reglas: `'alto_valor_activo'` cuando `z_gasto >= 0.8 AND z_recencia <= 0.0`, `'en_riesgo_inactividad'` cuando `z_recencia > 0.8`, y `'comprador_regular'` en el resto de casos. Devuelve `perfil_segmento`, `n_clientes`, `media_recencia_dias` (2 decimales), `media_frecuencia` (2 decimales), `media_gasto_usd` (2 decimales) y `media_z_gasto` (4 decimales), ordenado por `media_gasto_usd` de mayor a menor.",
    "starterCode": "-- Estandariza recencia, frecuencia y gasto con puntaje z y resume los 3 perfiles\nWITH metricas_cliente AS (\n  SELECT\n    c.customer_id,\n    DATE_DIFF('day', MAX(o.order_date), DATE '2025-12-31') AS recencia_dias,\n    CAST(COUNT(o.order_id) AS DOUBLE) AS frecuencia_pedidos,\n    SUM(o.total_usd) AS gasto_total_usd\n  FROM customers c\n  JOIN orders o ON c.customer_id = o.customer_id\n  WHERE o.status = 'completed'\n  GROUP BY c.customer_id\n),\nestandarizadas AS (\n  SELECT\n    customer_id,\n    recencia_dias,\n    frecuencia_pedidos,\n    gasto_total_usd,\n    -- Completa la división por STDDEV_SAMP(...) OVER () para estandarizar en escala z:\n    (recencia_dias - AVG(recencia_dias) OVER ()) AS z_recencia,\n    (frecuencia_pedidos - AVG(frecuencia_pedidos) OVER ()) AS z_frecuencia,\n    (gasto_total_usd - AVG(gasto_total_usd) OVER ()) AS z_gasto\n  FROM metricas_cliente\n)\nSELECT\n  COUNT(*) AS n_clientes,\n  ROUND(AVG(recencia_dias), 2) AS media_recencia_dias,\n  ROUND(AVG(frecuencia_pedidos), 2) AS media_frecuencia,\n  ROUND(AVG(gasto_total_usd), 2) AS media_gasto_usd\nFROM estandarizadas;",
    "expected": "WITH metricas_cliente AS (\n  SELECT\n    c.customer_id,\n    DATE_DIFF('day', MAX(o.order_date), DATE '2025-12-31') AS recencia_dias,\n    CAST(COUNT(o.order_id) AS DOUBLE) AS frecuencia_pedidos,\n    SUM(o.total_usd) AS gasto_total_usd\n  FROM customers c\n  JOIN orders o ON c.customer_id = o.customer_id\n  WHERE o.status = 'completed'\n  GROUP BY c.customer_id\n),\nestandarizadas AS (\n  SELECT\n    customer_id,\n    recencia_dias,\n    frecuencia_pedidos,\n    gasto_total_usd,\n    (recencia_dias - AVG(recencia_dias) OVER ()) / STDDEV_SAMP(recencia_dias) OVER () AS z_recencia,\n    (frecuencia_pedidos - AVG(frecuencia_pedidos) OVER ()) / STDDEV_SAMP(frecuencia_pedidos) OVER () AS z_frecuencia,\n    (gasto_total_usd - AVG(gasto_total_usd) OVER ()) / STDDEV_SAMP(gasto_total_usd) OVER () AS z_gasto\n  FROM metricas_cliente\n),\nperfiles AS (\n  SELECT\n    *,\n    CASE\n      WHEN z_gasto >= 0.8 AND z_recencia <= 0.0 THEN 'alto_valor_activo'\n      WHEN z_recencia > 0.8 THEN 'en_riesgo_inactividad'\n      ELSE 'comprador_regular'\n    END AS perfil_segmento\n  FROM estandarizadas\n)\nSELECT\n  perfil_segmento,\n  COUNT(*) AS n_clientes,\n  ROUND(AVG(recencia_dias), 2) AS media_recencia_dias,\n  ROUND(AVG(frecuencia_pedidos), 2) AS media_frecuencia,\n  ROUND(AVG(gasto_total_usd), 2) AS media_gasto_usd,\n  ROUND(AVG(z_gasto), 4) AS media_z_gasto\nFROM perfiles\nGROUP BY perfil_segmento\nORDER BY media_gasto_usd DESC;",
    "orderMatters": true,
    "hints": [
      "En el CTE estandarizadas divide cada diferencia respecto a la media entre su desviación estándar muestral: / STDDEV_SAMP(columna) OVER ().",
      "Agrega un tercer CTE perfiles con la expresión CASE WHEN z_gasto >= 0.8 AND z_recencia <= 0.0 THEN 'alto_valor_activo' WHEN z_recencia > 0.8 THEN 'en_riesgo_inactividad' ELSE 'comprador_regular' END AS perfil_segmento.",
      "En el SELECT final agrupa por perfil_segmento, incluye ROUND(AVG(z_gasto), 4) AS media_z_gasto y ordena con ORDER BY media_gasto_usd DESC."
    ],
    "solution": "WITH metricas_cliente AS (\n  SELECT\n    c.customer_id,\n    DATE_DIFF('day', MAX(o.order_date), DATE '2025-12-31') AS recencia_dias,\n    CAST(COUNT(o.order_id) AS DOUBLE) AS frecuencia_pedidos,\n    SUM(o.total_usd) AS gasto_total_usd\n  FROM customers c\n  JOIN orders o ON c.customer_id = o.customer_id\n  WHERE o.status = 'completed'\n  GROUP BY c.customer_id\n),\nestandarizadas AS (\n  SELECT\n    customer_id,\n    recencia_dias,\n    frecuencia_pedidos,\n    gasto_total_usd,\n    (recencia_dias - AVG(recencia_dias) OVER ()) / STDDEV_SAMP(recencia_dias) OVER () AS z_recencia,\n    (frecuencia_pedidos - AVG(frecuencia_pedidos) OVER ()) / STDDEV_SAMP(frecuencia_pedidos) OVER () AS z_frecuencia,\n    (gasto_total_usd - AVG(gasto_total_usd) OVER ()) / STDDEV_SAMP(gasto_total_usd) OVER () AS z_gasto\n  FROM metricas_cliente\n),\nperfiles AS (\n  SELECT\n    *,\n    CASE\n      WHEN z_gasto >= 0.8 AND z_recencia <= 0.0 THEN 'alto_valor_activo'\n      WHEN z_recencia > 0.8 THEN 'en_riesgo_inactividad'\n      ELSE 'comprador_regular'\n    END AS perfil_segmento\n  FROM estandarizadas\n)\nSELECT\n  perfil_segmento,\n  COUNT(*) AS n_clientes,\n  ROUND(AVG(recencia_dias), 2) AS media_recencia_dias,\n  ROUND(AVG(frecuencia_pedidos), 2) AS media_frecuencia,\n  ROUND(AVG(gasto_total_usd), 2) AS media_gasto_usd,\n  ROUND(AVG(z_gasto), 4) AS media_z_gasto\nFROM perfiles\nGROUP BY perfil_segmento\nORDER BY media_gasto_usd DESC;",
    "solutionExplanation": "Calculamos primero las métricas RFM por cliente al cierre de 2025. Luego estandarizamos cada columna con su media y desviación estándar muestral mediante funciones de ventana, clasificamos cada cliente según sus coordenadas z y resumimos los tres perfiles tanto en unidades de negocio como en escala estandarizada.",
    "expectedOutputTable": [
      {
        "perfil_segmento": "alto_valor_activo",
        "n_clientes": 404,
        "media_recencia_dias": 82.9,
        "media_frecuencia": 8.56,
        "media_gasto_usd": 4935,
        "media_z_gasto": 1.4382
      },
      {
        "perfil_segmento": "en_riesgo_inactividad",
        "n_clientes": 399,
        "media_recencia_dias": 361.32,
        "media_frecuencia": 5.35,
        "media_gasto_usd": 2355.38,
        "media_z_gasto": -0.2485
      },
      {
        "perfil_segmento": "comprador_regular",
        "n_clientes": 1489,
        "media_recencia_dias": 122.16,
        "media_frecuencia": 6.16,
        "media_gasto_usd": 2240.38,
        "media_z_gasto": -0.3236
      }
    ]
  },
  "roleNotes": {
    "de": "Publica las características de cliente a una fecha de corte explícita (como 2025-12-31) en lugar de usar CURRENT_DATE para que los segmentos sean 100% reproducibles en auditorías.",
    "da": "Estandariza siempre los atributos antes de medir distancias, verifica la calidad con el coeficiente de silueta y presenta los centroides tanto en unidades originales como en puntaje z.",
    "bi": "En los tableros de segmentación, muestra la evolución del tamaño de cada perfil mes a mes para medir cuántos clientes de alto valor migran hacia riesgo de inactividad."
  },
  "summary": [
    "En algoritmos basados en distancia euclidiana como k-medias, las variables de mayor magnitud numérica absorben la distancia si no se escalan.",
    "La estandarización por puntaje z resta la media y divide por la desviación estándar, dejando cada atributo con media cero y varianza uno.",
    "El coeficiente de silueta evalúa cohesión interna frente a separación entre grupos vecinos y previene sobreajustar el número de grupos k.",
    "Un perfil de segmentación útil combina coordenadas z para comparar rasgos y promedios en unidades originales para ejecutar acciones."
  ],
  "flashcards": [
    {
      "id": "fc-da4-05-01",
      "front": "¿Por qué es obligatorio estandarizar las variables antes de aplicar k-medias?",
      "back": "Porque k-medias minimiza distancias euclidianas al cuadrado; sin escalar, las columnas con unidades grandes (como dólares) anulan a las de unidades pequeñas (como conteos)."
    },
    {
      "id": "fc-da4-05-02",
      "front": "¿Cómo se calcula el puntaje z de una columna en DuckDB usando funciones de ventana?",
      "back": "Restando el promedio global y dividiendo por la desviación estándar muestral: (x - AVG(x) OVER ()) / STDDEV_SAMP(x) OVER ()."
    },
    {
      "id": "fc-da4-05-03",
      "front": "¿Por qué no debemos elegir el número de grupos k buscando simplemente la menor inercia?",
      "back": "Porque la inercia siempre disminuye al aumentar k y llega a cero cuando cada observación es su propio grupo, produciendo sobreajuste sin valor operativo."
    },
    {
      "id": "fc-da4-05-04",
      "front": "¿Qué indica un coeficiente de silueta cercano a +1 frente a uno cercano a 0?",
      "back": "Un valor cercano a +1 indica que las observaciones están muy cohesionadas dentro de su grupo y lejos del grupo vecino; cerca de 0 indica solapamiento en la frontera."
    }
  ],
  "glossaryTerms": [
    "estandarizacion-puntaje-z",
    "coeficiente-silueta",
    "c22-cohort-retention-ltv",
    "puntaje-z-modificado-mad"
  ],
  "sources": [
    {
      "title": "scikit-learn User Guide — Clustering (KMeans and Silhouette Coefficient)",
      "url": "https://scikit-learn.org/stable/modules/clustering.html",
      "publisher": "scikit-learn Developers",
      "accessed": "2025-10-15",
      "supports": "Algoritmo k-medias, inercia intra-grupo y evaluación mediante el coeficiente de silueta."
    },
    {
      "title": "scikit-learn User Guide — Preprocessing Data (StandardScaler and Standardization)",
      "url": "https://scikit-learn.org/stable/modules/preprocessing.html",
      "publisher": "scikit-learn Developers",
      "accessed": "2025-10-15",
      "supports": "Escalado de variables a media cero y varianza unitaria antes de aplicar métodos geométricos."
    },
    {
      "title": "James, Witten, Hastie, Tibshirani & Taylor — An Introduction to Statistical Learning (ISLP, Ch. 12 Unsupervised Learning)",
      "url": "https://www.statlearning.com/",
      "publisher": "Springer",
      "accessed": "2025-10-15",
      "supports": "Impacto de las unidades de medida en la distancia euclidiana e interpretación práctica de grupos."
    }
  ],
  "aiNotes": "Asegúrate de que el estudiante utilice STDDEV_SAMP(...) OVER () al calcular z_recencia, z_frecuencia y z_gasto, y que respete el orden de las condiciones del CASE WHEN para clasificar los 2,292 clientes con pedidos completados."
};

export default lesson;
