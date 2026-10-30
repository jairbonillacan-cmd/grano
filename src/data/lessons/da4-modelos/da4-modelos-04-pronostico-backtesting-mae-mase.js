export const lesson = {
  "id": "da4-modelos-04-pronostico-backtesting-mae-mase",
  "moduleId": "da4-modelos",
  "tracks": [
    "da"
  ],
  "level": 4,
  "order": 4,
  "title": "Pronóstico con ventana rodante y métricas MAE y MASE",
  "subtitle": "Pronóstico con validación por ventana rodante (backtesting) y métricas MAE, RMSE y MASE",
  "minutes": 25,
  "prerequisites": [
    "da4-modelos-03-series-temporales-descomposicion",
    "c2-sql-analitico-01-window-functions"
  ],
  "contentVersion": 2,
  "hook": "El responsable de abastecimiento de Mercado Brisa celebra que su pronóstico semanal tiene apenas un dos por ciento de error, pero al revisarlo descubres que promedió cuatro semanas incluyendo la propia semana que intentaba adivinar y además validó mezclando semanas de 2025 para predecir 2023. Cuando corrigen la fuga temporal, nadie sabe si un error absoluto de quince bolsas supera o empeora la regla actual de repetir la última semana. ¿Cómo ejecutas un backtesting por ventana rodante en SQL y evalúas tus pronósticos con MAE, RMSE y MASE?",
  "objectives": [
    "Implementar esquemas de validación por ventana rodante (backtesting) en SQL usando marcos ROWS BETWEEN k PRECEDING AND 1 PRECEDING sin fuga del futuro.",
    "Contrastar todo modelo de pronóstico contra la referencia ingenua (naive, LAG de un paso) y la referencia ingenua estacional.",
    "Calcular e interpretar las métricas fuera de muestra MAE, RMSE y MASE para comparar precisión entre categorías de distinta escala."
  ],
  "sections": [
    {
      "id": "validacion-temporal-y-fuga-del-futuro",
      "heading": "Validación por ventana rodante y prevención de fuga temporal",
      "body": "En problemas de series temporales no podemos dividir las filas al azar entre entrenamiento y prueba. El tiempo posee un orden causal estricto. Usar datos de abril para estimar parámetros que predicen marzo introduce **fuga temporal** (*data leakage*) y produce métricas de error artificialmente bajas.\n\nEl estándar para evaluar pronósticos es el **backtesting por ventana rodante** (*rolling-origin evaluation*). Para cada corte histórico `t`, el modelo calcula el pronóstico `Ŷ_t+1 | t` empleando solo observaciones disponibles hasta el instante `t`.\n\nEn SQL esto exige que todo marco de ventana termine en `1 PRECEDING`. Por ejemplo, una media móvil de cuatro semanas que pronostica la semana actual debe escribirse como `AVG(unidades) OVER (ORDER BY semana ROWS BETWEEN 4 PRECEDING AND 1 PRECEDING)`.\n\nSi omitimos `AND 1 PRECEDING`, SQL aplica por defecto `AND CURRENT ROW`. Eso contamina el pronóstico con el dato real que intentamos predecir.",
      "example": {
        "language": "sql",
        "code": "WITH demanda_semanal AS (\n  SELECT\n    DATE_TRUNC('week', o.order_date) AS semana,\n    CAST(SUM(oi.qty) AS DOUBLE) AS unidades\n  FROM orders o\n  JOIN order_items oi ON o.order_id = oi.order_id\n  JOIN products p ON oi.product_id = p.product_id\n  WHERE o.status = 'completed'\n    AND p.list_price_usd > 0\n    AND p.category = 'Café en grano'\n  GROUP BY DATE_TRUNC('week', o.order_date)\n)\nSELECT\n  semana,\n  unidades,\n  LAG(unidades, 1) OVER (ORDER BY semana) AS pronostico_ingenuo,\n  ROUND(\n    AVG(unidades) OVER (\n      ORDER BY semana\n      ROWS BETWEEN 4 PRECEDING AND 1 PRECEDING\n    ),\n    2\n  ) AS pronostico_media_4s\nFROM demanda_semanal\nORDER BY semana\nLIMIT 5 OFFSET 4;",
        "expectedOutput": [
          {
            "semana": "2023-02-13",
            "unidades": 7,
            "pronostico_ingenuo": 9,
            "pronostico_media_4s": 6.75
          },
          {
            "semana": "2023-02-20",
            "unidades": 8,
            "pronostico_ingenuo": 7,
            "pronostico_media_4s": 7.5
          },
          {
            "semana": "2023-02-27",
            "unidades": 3,
            "pronostico_ingenuo": 8,
            "pronostico_media_4s": 8
          },
          {
            "semana": "2023-03-06",
            "unidades": 11,
            "pronostico_ingenuo": 3,
            "pronostico_media_4s": 6.75
          },
          {
            "semana": "2023-03-13",
            "unidades": 7,
            "pronostico_ingenuo": 11,
            "pronostico_media_4s": 7.25
          }
        ]
      }
    },
    {
      "id": "modelos-base-ingenuo-y-media-movil",
      "heading": "Líneas base obligatorias: pronóstico ingenuo e ingenuo estacional",
      "body": "Antes de desplegar un modelo complejo, toda serie debe contrastarse contra dos referencias obligatorias (*baselines*): el **pronóstico ingenuo** (*naive*) y el **ingenuo estacional** (*seasonal naive*).\n\nEl método ingenuo postula que la mejor predicción para el próximo periodo es el último valor observado: `Ŷ_t^(ingenuo) = Y_t-1`. En SQL se obtiene con `LAG(unidades, 1) OVER (PARTITION BY category ORDER BY semana)`. Por su parte, el ingenuo estacional repite el valor observado hace un ciclo completo (`Ŷ_t = Y_t-m`).\n\nFrente a estas líneas base evaluamos suavizados como la **media móvil de `k` pasos previos**: `Ŷ_t^((k)) = 1 / k Σ_(j=1..k) Y_t-j`. Cuando una serie presenta mucho ruido transitorio de una semana a otra, promediar las últimas cuatro semanas filtra las oscilaciones aleatorias y reduce el error fuera de muestra respecto al método ingenuo."
    },
    {
      "id": "metricas-de-error-mae-y-rmse",
      "heading": "Métricas dependientes de escala: MAE frente a RMSE",
      "body": "Definido el error de pronóstico a un paso como `e_t = Y_t - Ŷ_t`, resumimos el desempeño fuera de muestra sobre `n` periodos de validación mediante dos métricas en las unidades originales de la variable.\n\nEl **error absoluto medio** (`MAE = 1 / n Σ_(t=1)^n |e_t|`) mide la desviación típica en unidades físicas y pondera todos los errores de forma lineal. Es la métrica adecuada cuando el coste económico de equivocarse crece proporcionalmente al número de unidades.\n\nLa **raíz del error cuadrático medio** (`RMSE = \\sqrt{1 / n Σ_(t=1)^n e_t²}`) eleva cada error al cuadrado antes de promediar. Por ello castiga con mayor severidad los desvíos grandes puntuales, como una rotura de inventario masiva en campaña.\n\nEn un mismo conjunto de validación siempre se cumple que `RMSE ≥ MAE`. Cuanto mayor es la brecha entre ambos, más concentrado está el error en unas pocas semanas extremas."
    },
    {
      "id": "error-absoluto-escalado-medio-mase",
      "heading": "Comparación adimensional entre categorías mediante MASE",
      "body": "Si una categoría vende miles de unidades semanales y otra vende decenas, comparar sus MAE en unidades brutas no indica en cuál funciona mejor el modelo. Muchos equipos intentan usar el error porcentual absoluto medio (MAPE), pero el MAPE se indefine cuando una semana registra cero ventas y penaliza de forma asimétrica los errores por exceso.\n\nRob Hyndman y Anne Koehler propusieron el **error absoluto escalado medio** (`MASE = \\frac{MAE_modelo}{MAE_ingenuo}`). Esta métrica divide el MAE del modelo evaluado entre el MAE que obtiene el pronóstico ingenuo a un paso sobre la misma serie.\n\nEl MASE es adimensional, evita dividir por cero salvo que toda la serie sea constante y tiene una lectura directa. Un `MASE < 1.0` certifica que el modelo reduce el error respecto a repetir la última semana; por ejemplo, `MASE = 0.815` representa un `18.5%` menos de error absoluto que el método ingenuo."
    }
  ],
  "workedExample": {
    "title": "Backtesting de demanda semanal por categoría con MAE, RMSE y MASE",
    "description": "El equipo de abastecimiento de Mercado Brisa quiere evaluar si una media móvil rodante de 4 semanas supera al pronóstico ingenuo en las cinco categorías de producto (orders completados y products.list_price_usd > 0 para excluir el SKU de prueba negativo).",
    "audit": "En las cinco categorías la media móvil de 4 semanas consigue un MASE entre 0.8144 y 0.8583, reduciendo entre un 14% y un 18.5% el error absoluto del método ingenuo sin incurrir en fuga temporal.",
    "steps": [
      {
        "label": "Paso 1: Ventana rodante sin fuga temporal en Café en grano",
        "explanation": "Construimos la serie semanal de unidades vendidas para Café en grano y verificamos que en cada semana el pronóstico ingenuo tome t-1 y la media móvil promedie de t-4 a t-1 sin tocar la fila actual.",
        "code": "WITH demanda_semanal AS (\n  SELECT\n    p.category,\n    DATE_TRUNC('week', o.order_date) AS semana,\n    CAST(SUM(oi.qty) AS DOUBLE) AS unidades\n  FROM orders o\n  JOIN order_items oi ON o.order_id = oi.order_id\n  JOIN products p ON oi.product_id = p.product_id\n  WHERE o.status = 'completed'\n    AND p.list_price_usd > 0\n    AND p.category = 'Café en grano'\n  GROUP BY p.category, DATE_TRUNC('week', o.order_date)\n)\nSELECT\n  semana,\n  unidades,\n  LAG(unidades, 1) OVER (ORDER BY semana) AS pronostico_ingenuo,\n  ROUND(\n    AVG(unidades) OVER (\n      ORDER BY semana\n      ROWS BETWEEN 4 PRECEDING AND 1 PRECEDING\n    ),\n    2\n  ) AS pronostico_media_4s\nFROM demanda_semanal\nORDER BY semana\nLIMIT 6 OFFSET 4;",
        "expectedOutput": [
          {
            "semana": "2023-02-13",
            "unidades": 7,
            "pronostico_ingenuo": 9,
            "pronostico_media_4s": 6.75
          },
          {
            "semana": "2023-02-20",
            "unidades": 8,
            "pronostico_ingenuo": 7,
            "pronostico_media_4s": 7.5
          },
          {
            "semana": "2023-02-27",
            "unidades": 3,
            "pronostico_ingenuo": 8,
            "pronostico_media_4s": 8
          },
          {
            "semana": "2023-03-06",
            "unidades": 11,
            "pronostico_ingenuo": 3,
            "pronostico_media_4s": 6.75
          },
          {
            "semana": "2023-03-13",
            "unidades": 7,
            "pronostico_ingenuo": 11,
            "pronostico_media_4s": 7.25
          },
          {
            "semana": "2023-03-20",
            "unidades": 13,
            "pronostico_ingenuo": 7,
            "pronostico_media_4s": 7.25
          }
        ]
      },
      {
        "label": "Paso 2: Resumen de MAE, RMSE y MASE en las cinco categorías",
        "explanation": "Extendemos el backtesting a las cinco categorías exigiendo 4 semanas previas completas (semanas_previas = 4) y calculamos mae_ingenuo, mae_media_4s, rmse_media_4s y mase_media_4s.",
        "code": "WITH demanda_semanal AS (\n  SELECT\n    p.category,\n    DATE_TRUNC('week', o.order_date) AS semana,\n    CAST(SUM(oi.qty) AS DOUBLE) AS unidades\n  FROM orders o\n  JOIN order_items oi ON o.order_id = oi.order_id\n  JOIN products p ON oi.product_id = p.product_id\n  WHERE o.status = 'completed'\n    AND p.list_price_usd > 0\n  GROUP BY p.category, DATE_TRUNC('week', o.order_date)\n),\nventanas AS (\n  SELECT\n    category,\n    semana,\n    unidades,\n    LAG(unidades, 1) OVER (PARTITION BY category ORDER BY semana) AS pronostico_ingenuo,\n    AVG(unidades) OVER (\n      PARTITION BY category\n      ORDER BY semana\n      ROWS BETWEEN 4 PRECEDING AND 1 PRECEDING\n    ) AS pronostico_media_4s,\n    COUNT(unidades) OVER (\n      PARTITION BY category\n      ORDER BY semana\n      ROWS BETWEEN 4 PRECEDING AND 1 PRECEDING\n    ) AS semanas_previas\n  FROM demanda_semanal\n)\nSELECT\n  category,\n  COUNT(*) AS semanas_evaluadas,\n  ROUND(AVG(ABS(unidades - pronostico_ingenuo)), 2) AS mae_ingenuo,\n  ROUND(AVG(ABS(unidades - pronostico_media_4s)), 2) AS mae_media_4s,\n  ROUND(SQRT(AVG(POWER(unidades - pronostico_media_4s, 2))), 2) AS rmse_media_4s,\n  ROUND(\n    AVG(ABS(unidades - pronostico_media_4s))\n    / NULLIF(AVG(ABS(unidades - pronostico_ingenuo)), 0),\n    4\n  ) AS mase_media_4s\nFROM ventanas\nWHERE semanas_previas = 4\nGROUP BY category\nORDER BY mase_media_4s ASC;",
        "expectedOutput": [
          {
            "category": "Suscripciones",
            "semanas_evaluadas": 148,
            "mae_ingenuo": 17.51,
            "mae_media_4s": 14.26,
            "rmse_media_4s": 18.81,
            "mase_media_4s": 0.8144
          },
          {
            "category": "Café en grano",
            "semanas_evaluadas": 146,
            "mae_ingenuo": 18.31,
            "mae_media_4s": 14.93,
            "rmse_media_4s": 20.29,
            "mase_media_4s": 0.8156
          },
          {
            "category": "Molinos",
            "semanas_evaluadas": 146,
            "mae_ingenuo": 15.47,
            "mae_media_4s": 12.9,
            "rmse_media_4s": 18.22,
            "mase_media_4s": 0.8339
          },
          {
            "category": "Cafeteras",
            "semanas_evaluadas": 147,
            "mae_ingenuo": 19,
            "mae_media_4s": 15.86,
            "rmse_media_4s": 20.98,
            "mase_media_4s": 0.8349
          },
          {
            "category": "Accesorios",
            "semanas_evaluadas": 147,
            "mae_ingenuo": 17.97,
            "mae_media_4s": 15.42,
            "rmse_media_4s": 20.91,
            "mase_media_4s": 0.8583
          }
        ]
      }
    ]
  },
  "checks": [
    {
      "id": "check-da4-04-marco-sin-fuga",
      "type": "mcq",
      "prompt": "Estás evaluando en DuckDB un pronóstico semanal a un paso basado en el promedio de las 4 semanas anteriores. ¿Qué cláusula de ventana evita cualquier fuga de datos de la semana actual o futura?",
      "options": [
        {
          "id": "a",
          "text": "AVG(unidades) OVER (PARTITION BY category ORDER BY semana ROWS BETWEEN 4 PRECEDING AND 1 PRECEDING)",
          "correct": true,
          "feedback": "Correcto. Al cerrar el marco en 1 PRECEDING se promedian exclusivamente las semanas t-4, t-3, t-2 y t-1."
        },
        {
          "id": "b",
          "text": "AVG(unidades) OVER (PARTITION BY category ORDER BY semana ROWS BETWEEN 3 PRECEDING AND CURRENT ROW)",
          "correct": false,
          "feedback": "Incorrecto. Incluir CURRENT ROW mete el dato real de la semana t dentro del pronóstico de la propia semana t (25% de fuga directa)."
        },
        {
          "id": "c",
          "text": "AVG(unidades) OVER (PARTITION BY category ORDER BY semana ROWS BETWEEN 2 PRECEDING AND 2 FOLLOWING)",
          "correct": false,
          "feedback": "Incorrecto. Usar FOLLOWING introduce observaciones futuras t+1 y t+2 que no existen en el momento de emitir el pronóstico."
        },
        {
          "id": "d",
          "text": "AVG(unidades) OVER (PARTITION BY category)",
          "correct": false,
          "feedback": "Incorrecto. Sin ORDER BY ni ROWS BETWEEN, calcula el promedio global de toda la historia incluyendo todas las semanas futuras."
        }
      ],
      "explanation": "Para que un backtesting sea honesto, la predicción para el período t solo puede usar información disponible en t-1 o antes, lo que exige terminar el marco en 1 PRECEDING."
    },
    {
      "id": "check-da4-04-interpretacion-mase",
      "type": "mcq",
      "prompt": "Un modelo de pronóstico de demanda obtiene en backtesting un MAE de 24 unidades y el pronóstico ingenuo (repetir la última semana) obtiene un MAE de 20 unidades sobre las mismas semanas. ¿Cuál es el MASE y qué decisión debes tomar?",
      "options": [
        {
          "id": "a",
          "text": "MASE = 24 / 20 = 1.20; como es mayor que 1.0, el modelo comete un 20% más de error que repetir el último dato y debe descartarse.",
          "correct": true,
          "feedback": "Correcto. Un MASE superior a 1.0 demuestra que el modelo propuesto empeora la línea base ingenua."
        },
        {
          "id": "b",
          "text": "MASE = 20 / 24 = 0.833; el modelo mejora un 16.7% respecto a la línea base.",
          "correct": false,
          "feedback": "Incorrecto. Invertiste la fracción: en el numerador va el MAE del modelo evaluado y en el denominador el MAE del pronóstico ingenuo."
        },
        {
          "id": "c",
          "text": "MASE = 24 - 20 = 4.0; es aceptable siempre que sea menor que 5.",
          "correct": false,
          "feedback": "Incorrecto. El MASE es un cociente adimensional, no una resta de unidades."
        },
        {
          "id": "d",
          "text": "MASE = 1.20; indica un excelente ajuste porque supera el umbral de 1.0.",
          "correct": false,
          "feedback": "Incorrecto. En métricas de error menor es mejor: el umbral máximo aceptable frente al método ingenuo es 1.0."
        }
      ],
      "explanation": "MASE = MAE_modelo / MAE_ingenuo = 24 / 20 = 1.20. Cualquier valor por encima de 1.0 significa que el modelo añade ruido en vez de precisión."
    },
    {
      "id": "check-da4-04-mae-vs-rmse",
      "type": "mcq",
      "prompt": "Dos modelos tienen exactamente el mismo MAE de 15 unidades por semana, pero el Modelo X tiene un RMSE de 18 unidades y el Modelo Z tiene un RMSE de 34 unidades. ¿Qué revela esta diferencia?",
      "options": [
        {
          "id": "a",
          "text": "El Modelo Z sufre algunos errores extremos muy grandes en semanas puntuales, ya que el RMSE eleva los residuos al cuadrado antes de promediar.",
          "correct": true,
          "feedback": "Correcto. A igual MAE, un RMSE mucho mayor delata la presencia de fallos severos en la cola que pueden causar quiebres graves de stock."
        },
        {
          "id": "b",
          "text": "El Modelo X tiene errores más dispersos y volátiles que el Modelo Z.",
          "correct": false,
          "feedback": "Incorrecto. Cuanto más cercano está el RMSE al MAE, más uniformes y acotados son los errores semanales."
        },
        {
          "id": "c",
          "text": "Es matemáticamente imposible que el RMSE sea mayor que el MAE en la misma muestra.",
          "correct": false,
          "feedback": "Incorrecto. Por la desigualdad de Cauchy-Schwarz / Jensen, el RMSE es siempre mayor o igual que el MAE."
        },
        {
          "id": "d",
          "text": "El Modelo Z está sesgado positivamente mientras que el Modelo X está sesgado negativamente.",
          "correct": false,
          "feedback": "Incorrecto. Tanto MAE como RMSE eliminan el signo de los errores individuales; la diferencia entre ambos responde a la varianza de las magnitudes de error."
        }
      ],
      "explanation": "Como el RMSE penaliza cuadráticamente las desviaciones, una brecha amplia entre RMSE y MAE alerta de que el modelo falla de forma aguda en semanas pico."
    }
  ],
  "practice": {
    "type": "sql",
    "title": "Backtesting de demanda semanal por categoría con MAE, RMSE y MASE",
    "language": "sql",
    "prompt": "Ejecuta el backtesting semanal por categoría de producto sobre `orders`, `order_items` y `products` filtrando pedidos con `o.status = 'completed'` y productos con `p.list_price_usd > 0`. Agrupa las unidades semanales (`CAST(SUM(oi.qty) AS DOUBLE) AS unidades`) por `p.category` y `DATE_TRUNC('week', o.order_date) AS semana`. Evalúa únicamente las semanas que disponen de 4 semanas previas completas (`semanas_previas = 4`) y devuelve `category`, `semanas_evaluadas`, `mae_ingenuo` (redondeado a 2 decimales), `mae_media_4s` (redondeado a 2 decimales), `rmse_media_4s` (redondeado a 2 decimales) y `mase_media_4s` (cociente entre el MAE sin redondear de la media móvil de 4 semanas y el MAE del pronóstico ingenuo, redondeado a 4 decimales). Ordena por `mase_media_4s` ascendente.",
    "starterCode": "-- Backtesting por ventana rodante de 4 semanas vs pronóstico ingenuo por categoría\nWITH demanda_semanal AS (\n  SELECT\n    p.category,\n    DATE_TRUNC('week', o.order_date) AS semana,\n    CAST(SUM(oi.qty) AS DOUBLE) AS unidades\n  FROM orders o\n  JOIN order_items oi ON o.order_id = oi.order_id\n  JOIN products p ON oi.product_id = p.product_id\n  WHERE o.status = 'completed'\n    AND p.list_price_usd > 0\n  GROUP BY p.category, DATE_TRUNC('week', o.order_date)\n),\nventanas AS (\n  SELECT\n    category,\n    semana,\n    unidades,\n    LAG(unidades, 1) OVER (PARTITION BY category ORDER BY semana) AS pronostico_ingenuo,\n    -- Corrige el marco para evitar incluir CURRENT ROW (fuga temporal):\n    AVG(unidades) OVER (\n      PARTITION BY category\n      ORDER BY semana\n      ROWS BETWEEN 3 PRECEDING AND CURRENT ROW\n    ) AS pronostico_media_4s,\n    COUNT(unidades) OVER (\n      PARTITION BY category\n      ORDER BY semana\n      ROWS BETWEEN 4 PRECEDING AND 1 PRECEDING\n    ) AS semanas_previas\n  FROM demanda_semanal\n)\nSELECT\n  category,\n  COUNT(*) AS semanas_evaluadas,\n  ROUND(AVG(ABS(unidades - pronostico_ingenuo)), 2) AS mae_ingenuo,\n  ROUND(AVG(ABS(unidades - pronostico_media_4s)), 2) AS mae_media_4s\n  -- Añade rmse_media_4s y mase_media_4s y filtra semanas_previas = 4\nFROM ventanas\nGROUP BY category\nORDER BY category;",
    "expected": "WITH demanda_semanal AS (\n  SELECT\n    p.category,\n    DATE_TRUNC('week', o.order_date) AS semana,\n    CAST(SUM(oi.qty) AS DOUBLE) AS unidades\n  FROM orders o\n  JOIN order_items oi ON o.order_id = oi.order_id\n  JOIN products p ON oi.product_id = p.product_id\n  WHERE o.status = 'completed'\n    AND p.list_price_usd > 0\n  GROUP BY p.category, DATE_TRUNC('week', o.order_date)\n),\nventanas AS (\n  SELECT\n    category,\n    semana,\n    unidades,\n    LAG(unidades, 1) OVER (PARTITION BY category ORDER BY semana) AS pronostico_ingenuo,\n    AVG(unidades) OVER (\n      PARTITION BY category\n      ORDER BY semana\n      ROWS BETWEEN 4 PRECEDING AND 1 PRECEDING\n    ) AS pronostico_media_4s,\n    COUNT(unidades) OVER (\n      PARTITION BY category\n      ORDER BY semana\n      ROWS BETWEEN 4 PRECEDING AND 1 PRECEDING\n    ) AS semanas_previas\n  FROM demanda_semanal\n)\nSELECT\n  category,\n  COUNT(*) AS semanas_evaluadas,\n  ROUND(AVG(ABS(unidades - pronostico_ingenuo)), 2) AS mae_ingenuo,\n  ROUND(AVG(ABS(unidades - pronostico_media_4s)), 2) AS mae_media_4s,\n  ROUND(SQRT(AVG(POWER(unidades - pronostico_media_4s, 2))), 2) AS rmse_media_4s,\n  ROUND(\n    AVG(ABS(unidades - pronostico_media_4s))\n    / NULLIF(AVG(ABS(unidades - pronostico_ingenuo)), 0),\n    4\n  ) AS mase_media_4s\nFROM ventanas\nWHERE semanas_previas = 4\nGROUP BY category\nORDER BY mase_media_4s ASC;",
    "orderMatters": true,
    "hints": [
      "En el CTE ventanas corrige el marco de pronostico_media_4s a ROWS BETWEEN 4 PRECEDING AND 1 PRECEDING para eliminar la fuga de datos de la semana actual.",
      "Agrega WHERE semanas_previas = 4 antes del GROUP BY category para evaluar solo las semanas que cuentan con las 4 semanas previas completas.",
      "En el SELECT final añade ROUND(SQRT(AVG(POWER(unidades - pronostico_media_4s, 2))), 2) AS rmse_media_4s y ROUND(AVG(ABS(unidades - pronostico_media_4s)) / NULLIF(AVG(ABS(unidades - pronostico_ingenuo)), 0), 4) AS mase_media_4s, ordenando por mase_media_4s ASC."
    ],
    "solution": "WITH demanda_semanal AS (\n  SELECT\n    p.category,\n    DATE_TRUNC('week', o.order_date) AS semana,\n    CAST(SUM(oi.qty) AS DOUBLE) AS unidades\n  FROM orders o\n  JOIN order_items oi ON o.order_id = oi.order_id\n  JOIN products p ON oi.product_id = p.product_id\n  WHERE o.status = 'completed'\n    AND p.list_price_usd > 0\n  GROUP BY p.category, DATE_TRUNC('week', o.order_date)\n),\nventanas AS (\n  SELECT\n    category,\n    semana,\n    unidades,\n    LAG(unidades, 1) OVER (PARTITION BY category ORDER BY semana) AS pronostico_ingenuo,\n    AVG(unidades) OVER (\n      PARTITION BY category\n      ORDER BY semana\n      ROWS BETWEEN 4 PRECEDING AND 1 PRECEDING\n    ) AS pronostico_media_4s,\n    COUNT(unidades) OVER (\n      PARTITION BY category\n      ORDER BY semana\n      ROWS BETWEEN 4 PRECEDING AND 1 PRECEDING\n    ) AS semanas_previas\n  FROM demanda_semanal\n)\nSELECT\n  category,\n  COUNT(*) AS semanas_evaluadas,\n  ROUND(AVG(ABS(unidades - pronostico_ingenuo)), 2) AS mae_ingenuo,\n  ROUND(AVG(ABS(unidades - pronostico_media_4s)), 2) AS mae_media_4s,\n  ROUND(SQRT(AVG(POWER(unidades - pronostico_media_4s, 2))), 2) AS rmse_media_4s,\n  ROUND(\n    AVG(ABS(unidades - pronostico_media_4s))\n    / NULLIF(AVG(ABS(unidades - pronostico_ingenuo)), 0),\n    4\n  ) AS mase_media_4s\nFROM ventanas\nWHERE semanas_previas = 4\nGROUP BY category\nORDER BY mase_media_4s ASC;",
    "solutionExplanation": "Agregamos primero las unidades semanales excluyendo pedidos no completados y productos de prueba negativos. Después construimos los pronósticos a un paso usando LAG(unidades, 1) y el promedio estricto de las 4 filas anteriores (4 PRECEDING AND 1 PRECEDING), filtramos ventanas completas y resumimos MAE, RMSE y MASE por categoría.",
    "expectedOutputTable": [
      {
        "category": "Suscripciones",
        "semanas_evaluadas": 148,
        "mae_ingenuo": 17.51,
        "mae_media_4s": 14.26,
        "rmse_media_4s": 18.81,
        "mase_media_4s": 0.8144
      },
      {
        "category": "Café en grano",
        "semanas_evaluadas": 146,
        "mae_ingenuo": 18.31,
        "mae_media_4s": 14.93,
        "rmse_media_4s": 20.29,
        "mase_media_4s": 0.8156
      },
      {
        "category": "Molinos",
        "semanas_evaluadas": 146,
        "mae_ingenuo": 15.47,
        "mae_media_4s": 12.9,
        "rmse_media_4s": 18.22,
        "mase_media_4s": 0.8339
      },
      {
        "category": "Cafeteras",
        "semanas_evaluadas": 147,
        "mae_ingenuo": 19,
        "mae_media_4s": 15.86,
        "rmse_media_4s": 20.98,
        "mase_media_4s": 0.8349
      },
      {
        "category": "Accesorios",
        "semanas_evaluadas": 147,
        "mae_ingenuo": 17.97,
        "mae_media_4s": 15.42,
        "rmse_media_4s": 20.91,
        "mase_media_4s": 0.8583
      }
    ]
  },
  "roleNotes": {
    "de": "Asegura que los pipelines de entrenamiento y validación de pronósticos materialicen vistas corte por fecha (point-in-time) y bloqueen cualquier referencia accidental a la fila actual CURRENT ROW o a filas futuras FOLLOWING.",
    "da": "Nunca reportes el error de un modelo de pronóstico sin incluir a su lado el MAE de la referencia ingenua y el cociente MASE evaluado exactamente en la misma ventana temporal.",
    "bi": "En tableros ejecutivos de seguimiento de demanda, acompaña siempre el pronóstico puntual de una banda de incertidumbre proporcional al RMSE histórico fuera de muestra y destaca qué categorías mantienen un MASE menor que uno."
  },
  "summary": [
    "La validación por ventana rodante evalúa el pronóstico avanzando el corte cronológico paso a paso sin mezclar datos futuros.",
    "En SQL, el marco ROWS BETWEEN k PRECEDING AND 1 PRECEDING garantiza que la predicción para t solo lea hasta t-1.",
    "El MAE mide el error absoluto típico en unidades físicas, mientras que el RMSE penaliza cuadráticamente los picos de error.",
    "El MASE divide el MAE del modelo entre el MAE del pronóstico ingenuo; un valor menor que uno confirma ganancia real de precisión."
  ],
  "flashcards": [
    {
      "id": "fc-da4-04-01",
      "front": "¿Por qué no se debe usar validación cruzada aleatoria en series temporales?",
      "back": "Porque mezcla observaciones futuras en el conjunto de entrenamiento para predecir el pasado, provocando fuga temporal y subestimando el error real."
    },
    {
      "id": "fc-da4-04-02",
      "front": "¿Qué es el pronóstico ingenuo (naive) a un paso y cómo se escribe en SQL?",
      "back": "Consiste en usar como predicción para el período t el último valor observado en t-1; en SQL se calcula con LAG(y, 1) OVER (ORDER BY fecha)."
    },
    {
      "id": "fc-da4-04-03",
      "front": "¿Cómo se define el MASE y qué significa obtener MASE = 0.82?",
      "back": "Es el cociente MAE_modelo / MAE_ingenuo. Un MASE de 0.82 indica que el modelo reduce el error absoluto medio en un 18% frente al pronóstico ingenuo."
    },
    {
      "id": "fc-da4-04-04",
      "front": "¿Por qué se prefiere MASE frente a MAPE al evaluar demanda de productos?",
      "back": "Porque el MAPE divide entre la venta real de cada período y explota cuando hay ceros, mientras que el MASE escala con el error medio ingenuo y es simétrico."
    }
  ],
  "glossaryTerms": [
    "validacion-ventana-rodante",
    "error-absoluto-escalado-medio",
    "c2-sql-marco-ventana",
    "media-aritmetica"
  ],
  "sources": [
    {
      "title": "Hyndman & Athanasopoulos — Forecasting: Principles and Practice (fpp3, Sec. 5.8 Evaluating Point Forecast Accuracy)",
      "url": "https://otexts.com/fpp3/accuracy.html",
      "publisher": "OTexts",
      "accessed": "2025-10-15",
      "supports": "Definición matemática y propiedades de MAE, RMSE y MASE frente a pronósticos ingenuos."
    },
    {
      "title": "Hyndman & Athanasopoulos — Forecasting: Principles and Practice (fpp3, Sec. 5.10 Time Series Cross-Validation)",
      "url": "https://otexts.com/fpp3/tscv.html",
      "publisher": "OTexts",
      "accessed": "2025-10-15",
      "supports": "Esquema de evaluación fuera de muestra con origen de pronóstico móvil (backtesting)."
    },
    {
      "title": "scikit-learn User Guide — TimeSeriesSplit Cross-Validation",
      "url": "https://scikit-learn.org/stable/modules/cross_validation.html",
      "publisher": "scikit-learn Developers",
      "accessed": "2025-10-15",
      "supports": "Particionado cronológico sin barajado aleatorio para evitar fuga del futuro en series temporales."
    },
    {
      "title": "DuckDB Documentation — Window Functions (LAG, AVG OVER, Framing)",
      "url": "https://duckdb.org/docs/stable/sql/functions/window_functions.html",
      "publisher": "DuckDB Foundation",
      "accessed": "2025-10-15",
      "supports": "Cálculo de rezagos con LAG y ventanas deslizantes estrictas con ROWS BETWEEN k PRECEDING AND 1 PRECEDING."
    }
  ],
  "aiNotes": "Revisa con especial cuidado que el estudiante use ROWS BETWEEN 4 PRECEDING AND 1 PRECEDING en el promedio móvil y que filtre WHERE semanas_previas = 4 antes de agrupar. Recuérdale excluir el SKU de prueba negativo con p.list_price_usd > 0."
};

export default lesson;
