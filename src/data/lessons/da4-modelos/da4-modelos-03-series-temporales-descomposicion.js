export const lesson = {
  "id": "da4-modelos-03-series-temporales-descomposicion",
  "moduleId": "da4-modelos",
  "tracks": [
    "da"
  ],
  "level": 4,
  "order": 3,
  "title": "Series temporales: tendencia, estacionalidad y residuo",
  "subtitle": "Series temporales: descomposición en tendencia, estacionalidad semanal y residuo",
  "minutes": 25,
  "prerequisites": [
    "da4-modelos-02-regresion-logistica-calibracion",
    "c2-sql-analitico-01-window-functions"
  ],
  "contentVersion": 2,
  "hook": "Cada miércoles por la mañana, el comité comercial de Mercado Brisa se alarma porque la facturación cae más de trescientos dólares respecto al sábado anterior y sospecha que la pasarela de pagos falló. Sin embargo, al descontar el ciclo semanal y la tendencia de mediano plazo, muchos miércoles resultan completamente normales mientras que un jueves aparentemente tranquilo esconde una anomalía real. ¿Cómo descompones una serie diaria en tendencia, estacionalidad semanal y residuo usando SQL para distinguir el calendario de un choque genuino?",
  "objectives": [
    "Construir una serie temporal diaria continua mediante LEFT JOIN contra la tabla calendar para evitar huecos que distorsionen los marcos de ventana.",
    "Estimar la tendencia-ciclo con medias móviles centradas de 7 días y extraer el efecto estacional aditivo propio de cada día de la semana.",
    "Aislar el componente residual (R_t = Y_t - T_t - S_t) para detectar anomalías operativas sin falsas alarmas provocadas por el calendario."
  ],
  "sections": [
    {
      "id": "continuidad-temporal-y-componentes",
      "heading": "Anatomía de una serie temporal y columna vertebral de fechas",
      "body": "Una serie temporal observada `Y_t` combina tres fuerzas distintas. La **tendencia-ciclo** (`T_t`) recoge la evolución suave de mediano plazo. La **estacionalidad** (`S_t`) refleja oscilaciones periódicas de longitud fija, como los siete días de la semana. El **residuo** (`R_t`) concentra las perturbaciones puntuales no explicadas por el calendario.\n\nEn una **descomposición aditiva** escribimos `Y_t = T_t + S_t + R_t`. Este esquema es apropiado cuando la amplitud de la oscilación semanal se mantiene estable en dólares a lo largo del año. Si la variación porcentual crece de forma proporcional al nivel de ventas, empleamos una descomposición multiplicativa (`Y_t = T_t × S_t × R_t`) o transformamos la serie con logaritmos.\n\nAntes de aplicar funciones de ventana en SQL es indispensable garantizar la continuidad del eje temporal. Siempre partimos de la tabla `calendar` con un `LEFT JOIN` hacia `orders` y rellenamos con `COALESCE(SUM(total_usd), 0)` para que un día sin ventas no desplace los marcos `ROWS BETWEEN`.",
      "example": {
        "language": "sql",
        "code": "SELECT\n  c.calendar_date,\n  c.day_of_week,\n  c.day_name,\n  COUNT(o.order_id) AS pedidos,\n  ROUND(COALESCE(SUM(o.total_usd), 0.0), 2) AS ingresos_usd\nFROM calendar c\nLEFT JOIN orders o\n  ON c.calendar_date = o.order_date\n  AND o.status = 'completed'\nWHERE c.year = 2024\nGROUP BY c.calendar_date, c.day_of_week, c.day_name\nORDER BY c.calendar_date\nLIMIT 5;",
        "expectedOutput": [
          {
            "calendar_date": "2024-01-01",
            "day_of_week": 1,
            "day_name": "Lunes",
            "pedidos": 14,
            "ingresos_usd": 7350.06
          },
          {
            "calendar_date": "2024-01-02",
            "day_of_week": 2,
            "day_name": "Martes",
            "pedidos": 15,
            "ingresos_usd": 4966.21
          },
          {
            "calendar_date": "2024-01-03",
            "day_of_week": 3,
            "day_name": "Miércoles",
            "pedidos": 12,
            "ingresos_usd": 5787.59
          },
          {
            "calendar_date": "2024-01-04",
            "day_of_week": 4,
            "day_name": "Jueves",
            "pedidos": 15,
            "ingresos_usd": 5113.58
          },
          {
            "calendar_date": "2024-01-05",
            "day_of_week": 5,
            "day_name": "Viernes",
            "pedidos": 15,
            "ingresos_usd": 5417.34
          }
        ]
      }
    },
    {
      "id": "extraccion-de-tendencia-con-media-movil",
      "heading": "Suavizado de tendencia mediante media móvil de siete días",
      "body": "Para aislar la tendencia `T_t` frente al ciclo de siete días, aplicamos una **media móvil centrada de orden 7**. En cada fecha `t` promediamos los tres días anteriores, el día actual y los tres días siguientes: `T̂_t = 1 / 7 Σ_(j=-3..3) Y_t+j`.\n\nEn DuckDB esta operación se expresa con `AVG(ingresos_usd) OVER (ORDER BY calendar_date ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING)`. Como toda ventana de siete días consecutivos contiene exactamente un lunes, un martes y así hasta el domingo, el efecto propio del día de la semana se cancela dentro del promedio.\n\nEs importante distinguir el propósito de la ventana centrada frente a la ventana causal. La ventana centrada mira tres días hacia adelante (`t+1, t+2, t+3`), por lo que resulta ideal para diagnosticar la historia sin desfase temporal. Para pronosticar el futuro sin fuga de datos utilizaremos ventanas hacia atrás en la siguiente lección."
    },
    {
      "id": "indice-estacional-por-dia-de-semana",
      "heading": "Estimación del efecto estacional por día de la semana",
      "body": "Una vez estimada la tendencia `T̂_t`, restamos dicho nivel a la serie original para obtener la serie sin tendencia (*detrended*): `D_t = Y_t - T̂_t`. Esta diferencia contiene la pauta estacional más el ruido diario.\n\nPara estimar el **índice estacional** `Ŝ_d` de cada día de la semana `d ∈ {1, ..., 7}`, promediamos las desviaciones `D_t` agrupando por `day_of_week`: `Ŝ_d = AVG(Y_t - T̂_t | día(t) = d)`.\n\nSi queremos calcular el componente estacional en línea para cada fila sin colapsar la tabla, encadenamos una segunda función de ventana particionada por el día de la semana: `AVG(ingresos_usd - tendencia_7d) OVER (PARTITION BY day_of_week)`.\n\nEn un modelo aditivo bien equilibrado, la suma de los siete índices estacionales se aproxima a cero. Los días pico muestran valores positivos en dólares y los días valle presentan valores negativos."
    },
    {
      "id": "aislamiento-del-residuo-y-deteccion-de-anomalias",
      "heading": "Aislamiento del residuo e identificación de choques reales",
      "body": "El último paso consiste en despejar el **residuo** restando tanto la tendencia como la estacionalidad: `R_t = Y_t - T̂_t - Ŝ_t`. Un residuo cercano a cero indica que el día se comportó según lo esperado para esa época del año y ese día de la semana.\n\nEn Mercado Brisa durante 2024, los sábados suman de media `+314.83 USD` sobre la tendencia semanal y los miércoles restan `-322.27 USD`. Si un sistema de alertas vigilara la serie bruta `Y_t`, dispararía falsos positivos cada sábado y omitiría caídas ocurridas en fin de semana.\n\nAl vigilar la magnitud absoluta del residuo `|R_t|` o estandarizarlo por su desviación estándar, detectamos promociones extraordinarias, caídas de pasarela o roturas de inventario. Así aislamos choques genuinos sin importar en qué día de la semana ocurran."
    }
  ],
  "workedExample": {
    "title": "Descomposición aditiva de ventas diarias en 2024 y detección de choques",
    "description": "El equipo de operaciones de Mercado Brisa analiza los ingresos diarios completados durante todo el año 2024 (c.year = 2024). Queremos cuantificar primero el patrón estacional de cada día de la semana y después identificar los 10 días con mayor choque residual absoluto.",
    "audit": "El miércoles 2024-11-20 facturó 12,393.81 USD (menos que varios sábados del año), pero al descontar su tendencia (7,034.69 USD) y el efecto estacional de los miércoles (-322.27 USD) emerge como el tercer mayor choque positivo del año (+5,681.39 USD).",
    "steps": [
      {
        "label": "Paso 1: Perfil estacional aditivo por día de la semana",
        "explanation": "Unimos calendar con orders (status = 'completed') para los 366 días de 2024, calculamos la tendencia centrada de 7 días y promediamos ingresos_usd - tendencia_7d por day_of_week.",
        "code": "WITH serie_diaria AS (\n  SELECT\n    c.calendar_date,\n    c.day_of_week,\n    c.day_name,\n    COALESCE(SUM(o.total_usd), 0.0) AS ingresos_usd\n  FROM calendar c\n  LEFT JOIN orders o\n    ON c.calendar_date = o.order_date\n    AND o.status = 'completed'\n  WHERE c.year = 2024\n  GROUP BY c.calendar_date, c.day_of_week, c.day_name\n),\ncon_tendencia AS (\n  SELECT\n    calendar_date,\n    day_of_week,\n    day_name,\n    ingresos_usd,\n    AVG(ingresos_usd) OVER (\n      ORDER BY calendar_date\n      ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING\n    ) AS tendencia_7d\n  FROM serie_diaria\n)\nSELECT\n  day_of_week,\n  day_name,\n  COUNT(*) AS n_dias,\n  ROUND(AVG(ingresos_usd), 2) AS media_ingresos,\n  ROUND(AVG(ingresos_usd - tendencia_7d), 2) AS estacionalidad_dia\nFROM con_tendencia\nGROUP BY day_of_week, day_name\nORDER BY day_of_week;",
        "expectedOutput": [
          {
            "day_of_week": 1,
            "day_name": "Lunes",
            "n_dias": 53,
            "media_ingresos": 7438.35,
            "estacionalidad_dia": -6.05
          },
          {
            "day_of_week": 2,
            "day_name": "Martes",
            "n_dias": 53,
            "media_ingresos": 7528.61,
            "estacionalidad_dia": 91.3
          },
          {
            "day_of_week": 3,
            "day_name": "Miércoles",
            "n_dias": 52,
            "media_ingresos": 7150.82,
            "estacionalidad_dia": -322.27
          },
          {
            "day_of_week": 4,
            "day_name": "Jueves",
            "n_dias": 52,
            "media_ingresos": 7386.58,
            "estacionalidad_dia": -85.37
          },
          {
            "day_of_week": 5,
            "day_name": "Viernes",
            "n_dias": 52,
            "media_ingresos": 7524.35,
            "estacionalidad_dia": 55.52
          },
          {
            "day_of_week": 6,
            "day_name": "Sábado",
            "n_dias": 52,
            "media_ingresos": 7785.16,
            "estacionalidad_dia": 314.83
          },
          {
            "day_of_week": 7,
            "day_name": "Domingo",
            "n_dias": 52,
            "media_ingresos": 7427.46,
            "estacionalidad_dia": -45.69
          }
        ]
      },
      {
        "label": "Paso 2: Aislamiento del residuo y top 10 anomalías de 2024",
        "explanation": "Propagamos el efecto estacional de cada día con AVG(ingresos_usd - tendencia_7d) OVER (PARTITION BY day_of_week) y ordenamos por el valor absoluto del residuo para encontrar los 10 choques más intensos de 2024.",
        "code": "WITH serie_diaria AS (\n  SELECT\n    c.calendar_date,\n    c.day_of_week,\n    c.day_name,\n    COALESCE(SUM(o.total_usd), 0.0) AS ingresos_usd\n  FROM calendar c\n  LEFT JOIN orders o\n    ON c.calendar_date = o.order_date\n    AND o.status = 'completed'\n  WHERE c.year = 2024\n  GROUP BY c.calendar_date, c.day_of_week, c.day_name\n),\ncon_tendencia AS (\n  SELECT\n    calendar_date,\n    day_of_week,\n    day_name,\n    ingresos_usd,\n    AVG(ingresos_usd) OVER (\n      ORDER BY calendar_date\n      ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING\n    ) AS tendencia_7d\n  FROM serie_diaria\n),\ncon_estacionalidad AS (\n  SELECT\n    calendar_date,\n    day_name,\n    ingresos_usd,\n    tendencia_7d,\n    AVG(ingresos_usd - tendencia_7d) OVER (PARTITION BY day_of_week) AS estacionalidad_dia\n  FROM con_tendencia\n)\nSELECT\n  calendar_date,\n  day_name,\n  ROUND(ingresos_usd, 2) AS ingresos_usd,\n  ROUND(tendencia_7d, 2) AS tendencia_7d,\n  ROUND(estacionalidad_dia, 2) AS estacionalidad_dia,\n  ROUND(ingresos_usd - tendencia_7d - estacionalidad_dia, 2) AS residuo_usd\nFROM con_estacionalidad\nORDER BY ABS(ingresos_usd - tendencia_7d - estacionalidad_dia) DESC\nLIMIT 10;",
        "expectedOutput": [
          {
            "calendar_date": "2024-08-29",
            "day_name": "Jueves",
            "ingresos_usd": 14717.06,
            "tendencia_7d": 8569.45,
            "estacionalidad_dia": -85.37,
            "residuo_usd": 6232.98
          },
          {
            "calendar_date": "2024-05-12",
            "day_name": "Domingo",
            "ingresos_usd": 14099.15,
            "tendencia_7d": 8067.33,
            "estacionalidad_dia": -45.69,
            "residuo_usd": 6077.51
          },
          {
            "calendar_date": "2024-11-20",
            "day_name": "Miércoles",
            "ingresos_usd": 12393.81,
            "tendencia_7d": 7034.69,
            "estacionalidad_dia": -322.27,
            "residuo_usd": 5681.39
          },
          {
            "calendar_date": "2024-11-14",
            "day_name": "Jueves",
            "ingresos_usd": 13280.63,
            "tendencia_7d": 7960.51,
            "estacionalidad_dia": -85.37,
            "residuo_usd": 5405.48
          },
          {
            "calendar_date": "2024-09-03",
            "day_name": "Martes",
            "ingresos_usd": 13040.56,
            "tendencia_7d": 7773.79,
            "estacionalidad_dia": 91.3,
            "residuo_usd": 5175.47
          },
          {
            "calendar_date": "2024-05-18",
            "day_name": "Sábado",
            "ingresos_usd": 13067.04,
            "tendencia_7d": 7586.96,
            "estacionalidad_dia": 314.83,
            "residuo_usd": 5165.25
          },
          {
            "calendar_date": "2024-04-17",
            "day_name": "Miércoles",
            "ingresos_usd": 11516.52,
            "tendencia_7d": 6722.6,
            "estacionalidad_dia": -322.27,
            "residuo_usd": 5116.19
          },
          {
            "calendar_date": "2024-08-06",
            "day_name": "Martes",
            "ingresos_usd": 12363.56,
            "tendencia_7d": 7418.49,
            "estacionalidad_dia": 91.3,
            "residuo_usd": 4853.77
          },
          {
            "calendar_date": "2024-10-21",
            "day_name": "Lunes",
            "ingresos_usd": 13180.56,
            "tendencia_7d": 8579.73,
            "estacionalidad_dia": -6.05,
            "residuo_usd": 4606.88
          },
          {
            "calendar_date": "2024-07-17",
            "day_name": "Miércoles",
            "ingresos_usd": 11912.49,
            "tendencia_7d": 7821.1,
            "estacionalidad_dia": -322.27,
            "residuo_usd": 4413.66
          }
        ]
      }
    ]
  },
  "checks": [
    {
      "id": "check-da4-03-date-spine",
      "type": "mcq",
      "prompt": "Calculas una media móvil de 7 días con ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING directamente sobre una agrupación de orders sin hacer LEFT JOIN con calendar. Si el 1 de enero no hubo pedidos, ¿qué error ocurre?",
      "options": [
        {
          "id": "a",
          "text": "El marco físico ROWS BETWEEN cuenta filas presentes y no días naturales, por lo que las ventanas alrededor del 1 de enero abarcarán 8 días del calendario y sesgarán la tendencia.",
          "correct": true,
          "feedback": "Correcto. ROWS BETWEEN se desplaza por posición de fila; si falta una fecha en la serie, la ventana absorbe un día extra más lejano."
        },
        {
          "id": "b",
          "text": "DuckDB lanza automáticamente una excepción de clave temporal faltante al ejecutar AVG OVER.",
          "correct": false,
          "feedback": "Incorrecto. El motor SQL ejecuta el promedio sobre las filas existentes sin advertir que faltan fechas intermedias."
        },
        {
          "id": "c",
          "text": "La media móvil asigna automáticamente cero a las fechas inexistentes sin necesidad de la tabla calendar.",
          "correct": false,
          "feedback": "Incorrecto. SQL no inventa filas para fechas ausentes a menos que hagas LEFT JOIN contra una secuencia de fechas."
        },
        {
          "id": "d",
          "text": "Solo se ve afectado el cálculo del residuo del 1 de enero, pero los días del 2 al 4 de enero quedan intactos.",
          "correct": false,
          "feedback": "Incorrecto. Los días 29, 30 y 31 de diciembre y 2, 3 y 4 de enero incluyen al 1 de enero en su ventana de +/- 3 días y quedan todos distorsionados."
        }
      ],
      "explanation": "Para que ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING equivalga exactamente a una semana natural de 7 días, cada fecha del calendario debe existir como una fila explícita."
    },
    {
      "id": "check-da4-03-aditiva-vs-multiplicativa",
      "type": "mcq",
      "prompt": "En una serie de demanda mensual observas que cada diciembre las ventas suben aproximadamente un 40% respecto a la tendencia anual: cuando la empresa vendía 10,000 unidades subían en 4,000, y ahora que vende 50,000 suben en 20,000. ¿Qué esquema de descomposición corresponde?",
      "options": [
        {
          "id": "a",
          "text": "Descomposición multiplicativa (o aditiva sobre el logaritmo de las ventas), porque la amplitud estacional escala proporcionalmente con el nivel de la tendencia.",
          "correct": true,
          "feedback": "Correcto. Cuando el efecto estacional es un porcentaje constante de la tendencia, el modelo apropiado es Y_t = T_t * S_t * R_t."
        },
        {
          "id": "b",
          "text": "Descomposición aditiva directa en unidades brutas, porque el porcentaje de subida (40%) es constante.",
          "correct": false,
          "feedback": "Incorrecto. En una descomposición aditiva se suma una cantidad fija de unidades (+S_t), no un porcentaje constante."
        },
        {
          "id": "c",
          "text": "Ninguna descomposición sirve cuando la tendencia crece; primero hay que eliminar diciembre de la base de datos.",
          "correct": false,
          "feedback": "Incorrecto. Borrar el mes pico destruye la información más valiosa para planificación de inventario."
        },
        {
          "id": "d",
          "text": "Una media móvil de orden 5 para que diciembre se mezcle únicamente con otoño.",
          "correct": false,
          "feedback": "Incorrecto. La longitud de la media móvil debe coincidir con el ciclo estacional completo (12 meses en series mensuales)."
        }
      ],
      "explanation": "La descomposición aditiva asume oscilaciones de magnitud absoluta constante; cuando la amplitud crece con la tendencia, se requiere descomposición multiplicativa o transformación logarítmica."
    },
    {
      "id": "check-da4-03-interpretacion-residuo",
      "type": "mcq",
      "prompt": "En Mercado Brisa un miércoles registra ingresos de 7,100 USD. La tendencia de esa semana es de 7,400 USD y el efecto estacional de los miércoles es -320 USD. ¿Cuál es el residuo aditivo de ese día y cómo lo interpretas?",
      "options": [
        {
          "id": "a",
          "text": "Residuo = +20 USD (7,100 - 7,400 - (-320)); el día estuvo 20 USD por encima de lo esperado para un miércoles normal.",
          "correct": true,
          "feedback": "Correcto. El valor esperado para ese miércoles era 7,400 + (-320) = 7,080 USD; haber vendido 7,100 USD deja un residuo positivo de +20 USD."
        },
        {
          "id": "b",
          "text": "Residuo = -300 USD; el día sufrió una caída anómala de 300 USD respecto a la tendencia.",
          "correct": false,
          "feedback": "Incorrecto. Esos -300 USD respecto a la tendencia se explican casi por completo por el comportamiento habitual de los miércoles (-320 USD)."
        },
        {
          "id": "c",
          "text": "Residuo = -620 USD (7,100 - 7,400 - 320); se produjo un desplome severo de ventas.",
          "correct": false,
          "feedback": "Incorrecto. Al restar un efecto estacional negativo (-320), el signo se vuelve positivo: - (-320) = +320."
        },
        {
          "id": "d",
          "text": "Residuo = 0 USD, porque todos los miércoles tienen por definición residuo nulo.",
          "correct": false,
          "feedback": "Incorrecto. El promedio de los residuos de todos los miércoles del año es cero, pero cada miércoles individual tiene su propio residuo."
        }
      ],
      "explanation": "Como Y_t = T_t + S_t + R_t, despejamos R_t = 7100 - 7400 - (-320) = +20 USD. Lo que parecía una caída frente a la tendencia (7,400) era simplemente el valle normal de mitad de semana."
    }
  ],
  "practice": {
    "type": "sql",
    "title": "Descomposición aditiva de ingresos diarios en 2024 y detección de choques residuales",
    "language": "sql",
    "prompt": "Realiza la descomposición aditiva de los ingresos diarios completados (`orders.status = 'completed'`) durante el año `2024` (`calendar.year = 2024`) asegurando continuidad con `LEFT JOIN` desde `calendar`. Calcula: (1) `tendencia_7d` como la media móvil centrada de 7 días (`ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING` ordenada por `calendar_date`), (2) `estacionalidad_dia` como el promedio de `ingresos_usd - tendencia_7d` particionado por `day_of_week`, y (3) `residuo_usd` como `ingresos_usd - tendencia_7d - estacionalidad_dia`. Devuelve las 10 fechas con mayor residuo absoluto (`ABS(residuo_usd)`) mostrando `calendar_date`, `day_name`, `ingresos_usd`, `tendencia_7d`, `estacionalidad_dia` y `residuo_usd` (las cuatro métricas numéricas redondeadas a 2 decimales), ordenadas por `ABS(ingresos_usd - tendencia_7d - estacionalidad_dia)` de mayor a menor.",
    "starterCode": "-- Descomposición aditiva de ingresos diarios en 2024 (top 10 anomalías residuales)\nWITH serie_diaria AS (\n  SELECT\n    c.calendar_date,\n    c.day_of_week,\n    c.day_name,\n    COALESCE(SUM(o.total_usd), 0.0) AS ingresos_usd\n  FROM calendar c\n  LEFT JOIN orders o\n    ON c.calendar_date = o.order_date\n    AND o.status = 'completed'\n  WHERE c.year = 2024\n  GROUP BY c.calendar_date, c.day_of_week, c.day_name\n),\ncon_tendencia AS (\n  SELECT\n    calendar_date,\n    day_of_week,\n    day_name,\n    ingresos_usd,\n    -- Ajusta el marco de ventana para que sea centrada de 7 días (3 antes y 3 después):\n    AVG(ingresos_usd) OVER (\n      ORDER BY calendar_date\n      ROWS BETWEEN 6 PRECEDING AND CURRENT ROW\n    ) AS tendencia_7d\n  FROM serie_diaria\n)\nSELECT\n  calendar_date,\n  day_name,\n  ROUND(ingresos_usd, 2) AS ingresos_usd,\n  ROUND(tendencia_7d, 2) AS tendencia_7d\n  -- Agrega estacionalidad_dia y residuo_usd y ordena por ABS(residuo) DESC\nFROM con_tendencia\nORDER BY ingresos_usd DESC\nLIMIT 10;",
    "expected": "WITH serie_diaria AS (\n  SELECT\n    c.calendar_date,\n    c.day_of_week,\n    c.day_name,\n    COALESCE(SUM(o.total_usd), 0.0) AS ingresos_usd\n  FROM calendar c\n  LEFT JOIN orders o\n    ON c.calendar_date = o.order_date\n    AND o.status = 'completed'\n  WHERE c.year = 2024\n  GROUP BY c.calendar_date, c.day_of_week, c.day_name\n),\ncon_tendencia AS (\n  SELECT\n    calendar_date,\n    day_of_week,\n    day_name,\n    ingresos_usd,\n    AVG(ingresos_usd) OVER (\n      ORDER BY calendar_date\n      ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING\n    ) AS tendencia_7d\n  FROM serie_diaria\n),\ncon_estacionalidad AS (\n  SELECT\n    calendar_date,\n    day_of_week,\n    day_name,\n    ingresos_usd,\n    tendencia_7d,\n    AVG(ingresos_usd - tendencia_7d) OVER (PARTITION BY day_of_week) AS estacionalidad_dia\n  FROM con_tendencia\n)\nSELECT\n  calendar_date,\n  day_name,\n  ROUND(ingresos_usd, 2) AS ingresos_usd,\n  ROUND(tendencia_7d, 2) AS tendencia_7d,\n  ROUND(estacionalidad_dia, 2) AS estacionalidad_dia,\n  ROUND(ingresos_usd - tendencia_7d - estacionalidad_dia, 2) AS residuo_usd\nFROM con_estacionalidad\nORDER BY ABS(ingresos_usd - tendencia_7d - estacionalidad_dia) DESC\nLIMIT 10;",
    "orderMatters": true,
    "hints": [
      "En el CTE con_tendencia cambia el marco de la ventana a ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING para obtener la media móvil centrada de 7 días.",
      "Añade un tercer CTE con_estacionalidad que calcule AVG(ingresos_usd - tendencia_7d) OVER (PARTITION BY day_of_week) AS estacionalidad_dia.",
      "En el SELECT final calcula ROUND(ingresos_usd - tendencia_7d - estacionalidad_dia, 2) AS residuo_usd y ordena con ORDER BY ABS(ingresos_usd - tendencia_7d - estacionalidad_dia) DESC LIMIT 10."
    ],
    "solution": "WITH serie_diaria AS (\n  SELECT\n    c.calendar_date,\n    c.day_of_week,\n    c.day_name,\n    COALESCE(SUM(o.total_usd), 0.0) AS ingresos_usd\n  FROM calendar c\n  LEFT JOIN orders o\n    ON c.calendar_date = o.order_date\n    AND o.status = 'completed'\n  WHERE c.year = 2024\n  GROUP BY c.calendar_date, c.day_of_week, c.day_name\n),\ncon_tendencia AS (\n  SELECT\n    calendar_date,\n    day_of_week,\n    day_name,\n    ingresos_usd,\n    AVG(ingresos_usd) OVER (\n      ORDER BY calendar_date\n      ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING\n    ) AS tendencia_7d\n  FROM serie_diaria\n),\ncon_estacionalidad AS (\n  SELECT\n    calendar_date,\n    day_of_week,\n    day_name,\n    ingresos_usd,\n    tendencia_7d,\n    AVG(ingresos_usd - tendencia_7d) OVER (PARTITION BY day_of_week) AS estacionalidad_dia\n  FROM con_tendencia\n)\nSELECT\n  calendar_date,\n  day_name,\n  ROUND(ingresos_usd, 2) AS ingresos_usd,\n  ROUND(tendencia_7d, 2) AS tendencia_7d,\n  ROUND(estacionalidad_dia, 2) AS estacionalidad_dia,\n  ROUND(ingresos_usd - tendencia_7d - estacionalidad_dia, 2) AS residuo_usd\nFROM con_estacionalidad\nORDER BY ABS(ingresos_usd - tendencia_7d - estacionalidad_dia) DESC\nLIMIT 10;",
    "solutionExplanation": "Garantizamos primero los 366 días de 2024 partiendo de calendar con LEFT JOIN. Después extraemos la tendencia semanal con una ventana centrada de 7 filas (-3 a +3), obtenemos el efecto medio de cada día de la semana sobre la serie sin tendencia y finalmente aislamos el residuo para ordenar los 10 mayores choques del año.",
    "expectedOutputTable": [
      {
        "calendar_date": "2024-08-29",
        "day_name": "Jueves",
        "ingresos_usd": 14717.06,
        "tendencia_7d": 8569.45,
        "estacionalidad_dia": -85.37,
        "residuo_usd": 6232.98
      },
      {
        "calendar_date": "2024-05-12",
        "day_name": "Domingo",
        "ingresos_usd": 14099.15,
        "tendencia_7d": 8067.33,
        "estacionalidad_dia": -45.69,
        "residuo_usd": 6077.51
      },
      {
        "calendar_date": "2024-11-20",
        "day_name": "Miércoles",
        "ingresos_usd": 12393.81,
        "tendencia_7d": 7034.69,
        "estacionalidad_dia": -322.27,
        "residuo_usd": 5681.39
      },
      {
        "calendar_date": "2024-11-14",
        "day_name": "Jueves",
        "ingresos_usd": 13280.63,
        "tendencia_7d": 7960.51,
        "estacionalidad_dia": -85.37,
        "residuo_usd": 5405.48
      },
      {
        "calendar_date": "2024-09-03",
        "day_name": "Martes",
        "ingresos_usd": 13040.56,
        "tendencia_7d": 7773.79,
        "estacionalidad_dia": 91.3,
        "residuo_usd": 5175.47
      },
      {
        "calendar_date": "2024-05-18",
        "day_name": "Sábado",
        "ingresos_usd": 13067.04,
        "tendencia_7d": 7586.96,
        "estacionalidad_dia": 314.83,
        "residuo_usd": 5165.25
      },
      {
        "calendar_date": "2024-04-17",
        "day_name": "Miércoles",
        "ingresos_usd": 11516.52,
        "tendencia_7d": 6722.6,
        "estacionalidad_dia": -322.27,
        "residuo_usd": 5116.19
      },
      {
        "calendar_date": "2024-08-06",
        "day_name": "Martes",
        "ingresos_usd": 12363.56,
        "tendencia_7d": 7418.49,
        "estacionalidad_dia": 91.3,
        "residuo_usd": 4853.77
      },
      {
        "calendar_date": "2024-10-21",
        "day_name": "Lunes",
        "ingresos_usd": 13180.56,
        "tendencia_7d": 8579.73,
        "estacionalidad_dia": -6.05,
        "residuo_usd": 4606.88
      },
      {
        "calendar_date": "2024-07-17",
        "day_name": "Miércoles",
        "ingresos_usd": 11912.49,
        "tendencia_7d": 7821.1,
        "estacionalidad_dia": -322.27,
        "residuo_usd": 4413.66
      }
    ]
  },
  "roleNotes": {
    "de": "Mantén una dimensión calendar materializada y sin huecos hasta al menos dos años en el futuro para que las vistas de series temporales nunca pierdan continuidad en festivos o cierres.",
    "da": "Descompón siempre la serie antes de investigar picos o caídas: auditar el residuo R_t evita perseguir fluctuaciones que solo reflejan el ciclo normal del día de la semana.",
    "bi": "Presenta en los gráficos diarios la línea de tendencia móvil de 7 días superpuesta a las barras diarias para que dirección distinga de un vistazo la señal del ruido semanal."
  },
  "summary": [
    "Toda descomposición temporal en SQL comienza con un LEFT JOIN desde una tabla calendario continua para impedir saltos de fecha.",
    "La media móvil centrada de 7 días filtra el ciclo semanal porque cada ventana incluye exactamente un día de cada nombre.",
    "El componente estacional diario se estima promediando la diferencia (Y_t - T_t) particionada por día de la semana.",
    "El residuo R_t = Y_t - T_t - S_t aísla las anomalías genuinas de negocio una vez descontados tendencia y calendario."
  ],
  "flashcards": [
    {
      "id": "fc-da4-03-01",
      "front": "¿Cuáles son los tres componentes de una descomposición aditiva de series temporales?",
      "back": "Tendencia-ciclo (T_t), estacionalidad periódica (S_t) y residuo irregular (R_t), relacionados mediante Y_t = T_t + S_t + R_t."
    },
    {
      "id": "fc-da4-03-02",
      "front": "¿Por qué se elige una ventana de exactamente 7 días para suavizar una serie diaria comercial?",
      "back": "Porque el ciclo estacional principal es semanal; al promediar 7 días consecutivos se incluye un día de cada tipo y el efecto estacional se cancela."
    },
    {
      "id": "fc-da4-03-03",
      "front": "¿Cuándo se debe usar ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING y cuándo está prohibido?",
      "back": "Se usa en descomposición histórica descriptiva para no desfasar la tendencia; está prohibido al predecir hacia el futuro porque lee datos posteriores (FOLLOWING)."
    },
    {
      "id": "fc-da4-03-04",
      "front": "¿Por qué es mejor disparar alertas operativas sobre el residuo R_t que sobre la venta bruta Y_t?",
      "back": "Porque R_t ya descontó la tendencia y el día de la semana, evitando falsas alarmas en días valle y detectando caídas reales en días pico."
    }
  ],
  "glossaryTerms": [
    "descomposicion-serie-temporal",
    "media-movil-centrada",
    "c2-sql-date-spine",
    "c2-sql-marco-ventana"
  ],
  "sources": [
    {
      "title": "Hyndman & Athanasopoulos — Forecasting: Principles and Practice (fpp3, Ch. 3 Time Series Decomposition)",
      "url": "https://otexts.com/fpp3/decomposition.html",
      "publisher": "OTexts",
      "accessed": "2026-04-20",
      "supports": "Componentes de tendencia-ciclo, estacionalidad y residuo en descomposiciones aditivas y multiplicativas."
    },
    {
      "title": "Hyndman & Athanasopoulos — STL Decomposition (Seasonal and Trend decomposition using Loess)",
      "url": "https://otexts.com/fpp3/stl.html",
      "publisher": "OTexts",
      "accessed": "2026-04-20",
      "supports": "Método STL para extracción flexible de estacionalidad y resistencia a valores atípicos."
    },
    {
      "title": "DuckDB Documentation — Window Functions and Framing (ROWS BETWEEN)",
      "url": "https://duckdb.org/docs/stable/sql/functions/window_functions.html",
      "publisher": "DuckDB Foundation",
      "accessed": "2026-04-20",
      "supports": "Especificación de marcos deslizantes centrados y retrospectivos mediante ROWS BETWEEN."
    },
    {
      "title": "statsmodels — Time Series Analysis (tsa, seasonal_decompose, STL)",
      "url": "https://www.statsmodels.org/stable/tsa.html",
      "publisher": "statsmodels Developers",
      "accessed": "2026-04-20",
      "supports": "Implementación de descomposición clásica por medias móviles y descomposición STL en Python."
    }
  ],
  "aiNotes": "Verifica que el estudiante distinga entre media móvil retrospectiva (6 PRECEDING AND CURRENT ROW) y media móvil centrada (3 PRECEDING AND 3 FOLLOWING). Si el resultado no coincide, revisa que haya filtrado c.year = 2024 y o.status = 'completed' dentro de la condición del LEFT JOIN."
};

export default lesson;
