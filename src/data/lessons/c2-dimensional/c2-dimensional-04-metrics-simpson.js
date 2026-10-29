// Lección migrada al esquema v2 mediante scripts/migrate-legacy.mjs
const lesson = {
  "id": "c2-dimensional-04-metrics-simpson",
  "moduleId": "c2-dimensional",
  "tracks": [
    "core"
  ],
  "level": 2,
  "order": 4,
  "title": "Métricas no aditivas y paradoja de Simpson",
  "minutes": 30,
  "prerequisites": [
    "c2-dimensional-03-scd2-history"
  ],
  "contentVersion": 1,
  "hook": "En Mercado Brisa (empresa ficticia), la dirección revisa el tablero mensual y observa que la tasa de conversión total cayó del 6.57 % en septiembre al 6.00 % en octubre (-57 puntos básicos). Sin embargo, al desglosar por plataforma, la conversión en Web subió del 8.00 % al 8.50 % y en App Móvil también subió del 3.00 % al 3.50 %. ¿Hay un error en el pipeline de datos o cómo puede bajar el total cuando todos los canales mejoran?",
  "objectives": [
    "Distinguir métricas aditivas, semi-aditivas (saldos de inventario) y no aditivas (ratios y usuarios únicos).",
    "Explicar la paradoja de Simpson separando el efecto tasa intrínseca del efecto mezcla (mix shift).",
    "Aplicar la descomposición de Kitagawa-Oaxaca en SQL para cuantificar cuántos puntos básicos aporta cada efecto."
  ],
  "sections": [
    {
      "id": "clasificacion-de-metricas-aditivas-semiaditivas-",
      "heading": "Clasificación de métricas: aditivas, semiaditivas y no aditivas",
      "body": "El primer error en el diseño de cubos y dashboards es creer que todas las columnas numéricas se pueden sumar o promediar libremente. En modelado analítico existen tres clases estrictas de medidas:\n- **Métricas Aditivas** (ej. `ingresos_brutos_usd`, `unidades_vendidas`, `comision_pasarela`): se pueden sumar con `SUM()` a través de **cualquier dimensión** (tiempo, geografía, producto, canal).\n- **Métricas Semi-Aditivas** (ej. `saldo_en_cuenta_usd`, `inventario_almacen`, `headcount_empleados`): representan fotografías de balance (*Point-in-Time Snapshots*). Se pueden sumar entre distintas sucursales o clientes en una fecha dada, pero **jamás se suman a lo largo del tiempo** (si tenías $1,000 el lunes, $1,000 el martes y $1,000 el miércoles, tu saldo no es $3,000). A lo largo del tiempo se toma el valor al cierre del periodo (`LAST_VALUE`) o el promedio diario.\n- **Métricas No Aditivas** (ej. `tasa_conversion_pct`, `ticket_promedio_aov`, `margen_porcentual`, `usuarios_activos_unicos`): **nunca se suman ni se promedian directamente con `AVG()`**. Un ratio siempre debe recalcularse desde la suma de sus componentes aditivos (`SUM(numerador) / NULLIF(SUM(denominador), 0)`), y un conteo único (`COUNT DISTINCT`) requiere re-evaluar los IDs crudos o fusionar estructuras probabilísticas aditivas como **HyperLogLog / Theta Sketches**.",
      "interactive": {
        "component": "simpsons-paradox-explorer",
        "caption": "Simulador interactivo: Métricas no aditivas y paradoja de Simpson"
      }
    },
    {
      "id": "arboles-de-indicadores-metrica-guia-palancas-y-g",
      "heading": "Árboles de indicadores: métrica guía, palancas y guardias",
      "body": "Un dashboard con 40 métricas inconexas no sirve para dirigir una empresa. Un **Árbol de KPIs** descompone la creación de valor en una identidad matemática causal:\n`MRR Neto = Usuarios Activos × Tasa de Conversión a Pago × Ticket Promedio (ARPU) - Churn USD`\nCada nodo del árbol cumple uno de tres roles:\n1) **North Star Metric (Métrica Estrella Polar)**: captura el valor duradero entregado al cliente y al negocio (ej. *Ingresos Recurrentes Netos* o *Pedidos Entregados a Tiempo*).\n2) **Input Metrics (Palancas Accionables)**: variables específicas que un equipo de producto puede mover directamente (ej. *% de usuarios que completan el onboarding en <3 min*, *latencia del checkout*).\n3) **Guardrail Metrics (Métricas Guardia o Contrapeso)**: límites de seguridad que impiden optimizar una palanca destruyendo otra parte del negocio (ej. si el equipo de crecimiento sube la conversión un 10% con descuentos agresivos, pero el **Guardrail de Margen Neto** o **Retención a 30 días** cae un 15%, la iniciativa se frena).",
      "example": {
        "language": "sql",
        "code": "-- CORRECTO: Recalcular ratios con SUM(numerador)/SUM(denominador) y separar Efecto Tasa vs Efecto Mix\nWITH weights AS (\n  SELECT\n    channel,\n    sessions_sep, orders_sep,\n    1.0 * orders_sep / sessions_sep AS rate_sep,\n    1.0 * sessions_sep / SUM(sessions_sep) OVER () AS w_sep,\n    sessions_oct, orders_oct,\n    1.0 * orders_oct / sessions_oct AS rate_oct,\n    1.0 * sessions_oct / SUM(sessions_oct) OVER () AS w_oct\n  FROM gold.channel_funnel_comparison\n)\nSELECT\n  ROUND(100.0 * SUM(orders_sep) / SUM(sessions_sep), 2) AS conv_sep_pct,\n  ROUND(100.0 * SUM(orders_oct) / SUM(sessions_oct), 2) AS conv_oct_observada_pct,\n  ROUND(100.0 * SUM(w_sep * rate_oct), 2) AS conv_oct_mix_constante_pct,\n  ROUND(100.0 * SUM(0.5 * (w_sep + w_oct) * (rate_oct - rate_sep)), 2) AS efecto_tasa_puro_pct,\n  ROUND(100.0 * SUM(0.5 * (rate_sep + rate_oct) * (w_oct - w_sep)), 2) AS efecto_cambio_mix_pct\nFROM weights;",
        "expectedOutput": [
          {
            "conv_sep_pct": "6.57%",
            "conv_oct_observada_pct": "6.00% (-0.57% global)",
            "conv_oct_mix_constante_pct": "7.07% (Subió a mix constante.)",
            "efecto_tasa_puro_pct": "+0.50% (Mejora real de Web y App)",
            "efecto_cambio_mix_pct": "-1.07% (Impacto del nuevo tráfico móvil)"
          }
        ]
      }
    },
    {
      "id": "paradoja-de-simpson-cuando-los-segmentos-suben-p",
      "heading": "Paradoja de Simpson: cuando los segmentos suben pero el agregado cae",
      "body": "Volvamos al misterio del lunes por la mañana: ¿cómo pueden mejorar Web (`8.0% -> 8.5%`) y App Móvil (`3.0% -> 3.5%`) al mismo tiempo que el total cae (`6.57% -> 6.00%`)? La respuesta es la **Paradoja de Simpson**, causada por un cambio drástico en el **Mix (pesos de volumen)** de una variable de confusión:\n- En **Septiembre**, tenías 2,500 sesiones en Web (71.4% del tráfico total, convirtiendo al 8.0% = 200 pedidos) y 1,000 sesiones en App Móvil (28.6% del tráfico, convirtiendo al 3.0% = 30 pedidos). Total Septiembre: `230 / 3,500 = 6.57%`.\n- En **Octubre**, Marketing lanzó una campaña masiva en TikTok que atrajo una avalancha de usuarios a la **App Móvil**: Web tuvo 3,000 sesiones (50% del tráfico, convirtiendo mejor al 8.5% = 255 pedidos) y App Móvil subió a 3,000 sesiones (50% del tráfico, convirtiendo mejor al 3.5% = 105 pedidos). Total Octubre: `360 / 6,000 = 6.00%`.\nComo el canal con menor conversión natural (App Móvil) pasó de representar el 28.6% al 50.0% de la mezcla total, tiró hacia abajo el promedio ponderado global a pesar de que ambos equipos hicieron un trabajo excelente."
    },
    {
      "id": "descomposicion-kitagawa-oaxaca-efecto-tasa-vs-co",
      "heading": "Descomposición Kitagawa-Oaxaca: efecto tasa vs composición",
      "body": "Para que la dirección no castigue por error a los equipos de producto ni tome decisiones ciegas, el analista y el especialista en BI aplican la **Descomposición de Kitagawa** (o reportan la **Métrica a Mix Constante**):\n- **Efecto Tasa Puro (Rendimiento intrínseco)**: mantiene fijos los pesos de tráfico del periodo base ($w_{\\text{sep}}$) y evalúa las nuevas tasas de octubre: $\\sum w_{i,\\text{sep}} \\cdot (r_{i,\\text{oct}} - r_{i,\\text{sep}}) = +0.50\\%$ (+50 bps de mejora real del producto).\n- **Efecto Cambio de Mix (Composición de tráfico)**: mide cuánto cambió la métrica global exclusivamente por el desplazamiento de pesos entre canales: $-1.07\\%$ (-107 bps por el influjo de tráfico móvil).\n- **Cambio Global Observado**: $+0.50\\% \\text{ (Efecto Tasa)} - 1.07\\% \\text{ (Efecto Mix)} = -0.57\\%$ (`6.57% -> 6.00%`)."
    }
  ],
  "workedExample": {
    "title": "Ejemplo guiado: Métricas no aditivas y paradoja de Simpson",
    "description": "Compara el error clásico de promediar porcentajes con `AVG()` frente a la consulta analítica que calcula la conversión real ponderada, la conversión a mix constante y la descomposición Efecto Tasa vs. Efecto Mix:",
    "audit": "",
    "steps": [
      {
        "label": "Error grave: promediar porcentajes con AVG() o sumar usuarios diarios",
        "explanation": "Compara el error clásico de promediar porcentajes con `AVG()` frente a la consulta analítica que calcula la conversión real ponderada, la conversión a mix constante y la descomposición Efecto Tasa vs. Efecto Mix:",
        "code": "-- ERROR DOBLE MUY COMÚN EN REPORTES MAL DISEÑADOS:\n-- 1) Hacer AVG(conversion_rate_pct) trata igual un canal con 100 visitas que uno con 1 millón\n-- 2) Hacer SUM(daily_unique_users) suma al mismo usuario 30 veces si entró todos los días del mes\nSELECT\n  month,\n  ROUND(AVG(channel_conversion_pct), 2) AS conversion_falsa_no_ponderada,\n  SUM(daily_active_users) AS mau_inflado_incorrecto\nFROM gold.channel_monthly_rollup\nGROUP BY month;",
        "expectedOutput": [
          {
            "month": "2026-09",
            "conversion_falsa_no_ponderada": "5.50% (Falso: ignora que Web tenía el 71.4% del tráfico; real = 6.57%)",
            "mau_inflado_incorrecto": "420,000 (Falso: suma DAU de 30 días en vez de usuarios únicos mensuales)"
          },
          {
            "month": "2026-10",
            "conversion_falsa_no_ponderada": "6.00% (Coincidencia casual solo porque el mix fue 50/50)",
            "mau_inflado_incorrecto": "510,000 (Inutilizable para calcular retención o ARPU)"
          }
        ]
      },
      {
        "label": "Solución avanzada: descomposición de Kitagawa a mix constante",
        "explanation": "Compara ahora la consulta corregida y verifica cómo las filas y totales coinciden con la auditoría.",
        "code": "-- CORRECTO: Recalcular ratios con SUM(numerador)/SUM(denominador) y separar Efecto Tasa vs Efecto Mix\nWITH weights AS (\n  SELECT\n    channel,\n    sessions_sep, orders_sep,\n    1.0 * orders_sep / sessions_sep AS rate_sep,\n    1.0 * sessions_sep / SUM(sessions_sep) OVER () AS w_sep,\n    sessions_oct, orders_oct,\n    1.0 * orders_oct / sessions_oct AS rate_oct,\n    1.0 * sessions_oct / SUM(sessions_oct) OVER () AS w_oct\n  FROM gold.channel_funnel_comparison\n)\nSELECT\n  ROUND(100.0 * SUM(orders_sep) / SUM(sessions_sep), 2) AS conv_sep_pct,\n  ROUND(100.0 * SUM(orders_oct) / SUM(sessions_oct), 2) AS conv_oct_observada_pct,\n  ROUND(100.0 * SUM(w_sep * rate_oct), 2) AS conv_oct_mix_constante_pct,\n  ROUND(100.0 * SUM(0.5 * (w_sep + w_oct) * (rate_oct - rate_sep)), 2) AS efecto_tasa_puro_pct,\n  ROUND(100.0 * SUM(0.5 * (rate_sep + rate_oct) * (w_oct - w_sep)), 2) AS efecto_cambio_mix_pct\nFROM weights;",
        "expectedOutput": [
          {
            "conv_sep_pct": "6.57%",
            "conv_oct_observada_pct": "6.00% (-0.57% global)",
            "conv_oct_mix_constante_pct": "7.07% (Subió a mix constante.)",
            "efecto_tasa_puro_pct": "+0.50% (Mejora real de Web y App)",
            "efecto_cambio_mix_pct": "-1.07% (Impacto del nuevo tráfico móvil)"
          }
        ]
      }
    ]
  },
  "checks": [
    {
      "id": "c1",
      "type": "mcq",
      "prompt": "Tienes una tabla `fact_daily_inventory` con el stock al cierre de cada día por almacén (`date`, `warehouse_id`, `ending_units`) y otra columna con las ventas del día (`sold_units`). Para mostrar en el reporte trimestral el inventario y las ventas totales de la empresa, ¿cómo debes agregar ambas métricas?",
      "options": [
        {
          "id": "a",
          "text": "`sold_units` es aditiva (se suma con `SUM` a través de almacenes y de los 90 días), mientras que `ending_units` es semi-aditiva (se suma con `SUM` entre almacenes en una fecha dada, pero NO se suma a través de los 90 días; se toma el cierre del último día del trimestre o el promedio diario).",
          "correct": true,
          "feedback": "Exacto. El inventario y el saldo bancario son métricas semi-aditivas: se suman entre entidades (almacenes/cuentas) en un mismo instante, pero nunca se suman a lo largo del eje temporal."
        },
        {
          "id": "b",
          "text": "Ambas se suman con `SUM(sold_units)` y `SUM(ending_units)` agrupando por trimestre.",
          "correct": false,
          "feedback": "Si tienes 1,000 camisas en el almacén durante los 90 días del trimestre, hacer `SUM(ending_units)` reportaría que tienes 90,000 camisas en stock."
        },
        {
          "id": "c",
          "text": "Ninguna de las dos se puede sumar entre almacenes.",
          "correct": false,
          "feedback": "En un mismo día de corte (por ejemplo, el 31 de octubre), sí puedes y debes sumar el stock del Almacén Norte + Almacén Sur para conocer el inventario total de la compañía en esa fecha."
        }
      ],
      "explanation": "Exacto. El inventario y el saldo bancario son métricas semi-aditivas: se suman entre entidades (almacenes/cuentas) en un mismo instante, pero nunca se suman a lo largo del eje temporal."
    },
    {
      "id": "c2",
      "type": "mcq",
      "prompt": "Tienes una tabla diaria con `date`, `store_id`, `orders` y `revenue`. Quieres obtener el ticket promedio (`AOV`) del trimestre completo en SQL. ¿Cuál es la expresión correcta?",
      "options": [
        {
          "id": "a",
          "text": "SUM(revenue) / NULLIF(SUM(orders), 0)",
          "correct": true,
          "feedback": "Correcto: los ratios se agregan sumando el numerador atómico y dividiendo entre la suma del denominador atómico."
        },
        {
          "id": "b",
          "text": "AVG(revenue / orders)",
          "correct": false,
          "feedback": "Incorrecto: promediar los promedios diarios asigna el mismo peso a días con pocas ventas que a días pico."
        },
        {
          "id": "c",
          "text": "SUM(revenue / orders)",
          "correct": false,
          "feedback": "Incorrecto: sumar tickets promedios diarios multiplica el resultado por el número de días del trimestre."
        }
      ],
      "explanation": "Las métricas de razón (AOV, tasa de conversión, margen porcentual) son no aditivas: siempre debes almacenar y sumar sus componentes base antes de dividir."
    },
    {
      "id": "c3",
      "type": "mcq",
      "prompt": "En Mercado Brisa, el lunes entraron 10 000 usuarios únicos y el martes entraron 12 000 usuarios únicos. ¿Cuántos usuarios únicos entraron en el acumulado de ambos días?",
      "options": [
        {
          "id": "a",
          "text": "Un número entre 12 000 y 22 000; hay que ejecutar COUNT(DISTINCT user_id) o combinar sketches HyperLogLog sobre el rango completo.",
          "correct": true,
          "feedback": "Correcto: los usuarios que visitaron ambos días se contarían dos veces si sumaras 10 000 + 12 000."
        },
        {
          "id": "b",
          "text": "Exactamente 22 000 usuarios únicos (la suma de lunes y martes).",
          "correct": false,
          "feedback": "Incorrecto: COUNT(DISTINCT) no es aditivo; sumar conteos diarios duplica a todos los clientes recurrentes."
        },
        {
          "id": "c",
          "text": "11 000 usuarios únicos (el promedio de ambos días).",
          "correct": false,
          "feedback": "Incorrecto: el promedio de usuarios diarios (DAU promedio) no equivale al alcance acumulado de usuarios únicos del periodo."
        }
      ],
      "explanation": "La cardinalidad de conjuntos (COUNT DISTINCT) no es aditiva porque la unión de conjuntos con intersección no vacía es menor que la suma de sus tamaños individuales."
    }
  ],
  "practice": {
    "type": "fill-blanks",
    "title": "Métricas de razón y mix constante",
    "language": "sql",
    "prompt": "Completa la consulta SQL para calcular correctamente el Ticket Promedio Global (`aov_global_usd`), la Conversión Global Observada (`conv_observada_pct`) desde sus medidas aditivas base, y la Conversión Normalizada usando el peso de sesiones del periodo base (`weight_base`).",
    "starterCode": "SELECT\n  -- 1. Ticket Promedio (AOV) Global real (Métrica No Aditiva: Ingresos / Pedidos)\n  ROUND({{b1}} / NULLIF(SUM(orders_count), 0), 2) AS aov_global_usd,\n  -- 2. Conversión Global Observada (%: Pedidos Totales / Sesiones Totales)\n  ROUND(100.0 * SUM(orders_count) / NULLIF({{b2}}, 0), 2) AS conv_observada_pct,\n  -- 3. Conversión a Mix Constante (%: Suma ponderada por el peso base de cada canal)\n  ROUND(100.0 * SUM({{b3}}), 2) AS conv_mix_constante_pct\nFROM gold.channel_performance;",
    "expected": "SELECT\n  -- 1. Ticket Promedio (AOV) Global real (Métrica No Aditiva: Ingresos / Pedidos)\n  ROUND({{b1}} / NULLIF(SUM(orders_count), 0), 2) AS aov_global_usd,\n  -- 2. Conversión Global Observada (%: Pedidos Totales / Sesiones Totales)\n  ROUND(100.0 * SUM(orders_count) / NULLIF({{b2}}, 0), 2) AS conv_observada_pct,\n  -- 3. Conversión a Mix Constante (%: Suma ponderada por el peso base de cada canal)\n  ROUND(100.0 * SUM({{b3}}), 2) AS conv_mix_constante_pct\nFROM gold.channel_performance;",
    "orderMatters": true,
    "hints": [
      "Numerador aditivo de ingresos: Suma la columna aditiva `gross_revenue_usd` antes de dividir por `SUM(orders_count)`.",
      "Denominador aditivo de sesiones: Divide el total de pedidos entre la suma total de sesiones (`SUM(sessions_count)`).",
      "Tasa ponderada por peso base: Multiplica la tasa del canal (`conversion_rate`) por su peso en el periodo base (`weight_base`)."
    ],
    "solution": "SELECT\n  -- 1. Ticket Promedio (AOV) Global real (Métrica No Aditiva: Ingresos / Pedidos)\n  ROUND({{b1}} / NULLIF(SUM(orders_count), 0), 2) AS aov_global_usd,\n  -- 2. Conversión Global Observada (%: Pedidos Totales / Sesiones Totales)\n  ROUND(100.0 * SUM(orders_count) / NULLIF({{b2}}, 0), 2) AS conv_observada_pct,\n  -- 3. Conversión a Mix Constante (%: Suma ponderada por el peso base de cada canal)\n  ROUND(100.0 * SUM({{b3}}), 2) AS conv_mix_constante_pct\nFROM gold.channel_performance;",
    "solutionExplanation": "Recalcula todos los ratios no aditivos mediante `SUM(numerador) / NULLIF(SUM(denominador), 0)` sin usar `AVG()` sobre porcentajes. Protege las divisiones con `NULLIF(..., 0)` para prevenir errores de división por cero. Calcula la métrica normalizada a mix constante ponderando las tasas actuales por los pesos del periodo base (`weight_base`).",
    "blanks": [
      {
        "id": "b1",
        "placeholder": "Numerador aditivo de ingresos",
        "acceptedAnswers": [
          "SUM(gross_revenue_usd)"
        ],
        "hint": "Suma la columna aditiva `gross_revenue_usd` antes de dividir por `SUM(orders_count)`."
      },
      {
        "id": "b2",
        "placeholder": "Denominador aditivo de sesiones",
        "acceptedAnswers": [
          "SUM(sessions_count)"
        ],
        "hint": "Divide el total de pedidos entre la suma total de sesiones (`SUM(sessions_count)`)."
      },
      {
        "id": "b3",
        "placeholder": "Tasa ponderada por peso base",
        "acceptedAnswers": [
          "conversion_rate * weight_base",
          "weight_base * conversion_rate"
        ],
        "hint": "Multiplica la tasa del canal (`conversion_rate`) por su peso en el periodo base (`weight_base`)."
      }
    ],
    "expectedOutputTable": [
      {
        "aov_global_usd": "$58.40",
        "conv_observada_pct": "6.00%",
        "conv_mix_constante_pct": "7.07%"
      }
    ],
    "rubricCriteria": [
      "Recalcula todos los ratios no aditivos mediante `SUM(numerador) / NULLIF(SUM(denominador), 0)` sin usar `AVG()` sobre porcentajes.",
      "Protege las divisiones con `NULLIF(..., 0)` para prevenir errores de división por cero.",
      "Calcula la métrica normalizada a mix constante ponderando las tasas actuales por los pesos del periodo base (`weight_base`)."
    ]
  },
  "roleNotes": {
    "de": "En todas las tablas agregadas (Rollups / Cubos Gold), almacena **siempre el numerador y el denominador aditivos por separado** (`orders_count`, `sessions_count`, `gross_revenue_usd`) además de sketches HyperLogLog para usuarios únicos. Garantiza que las dimensiones de segmentación clave (`channel`, `device_type`, `country`, `customer_tier`) tengan un 0% de valores `NULL` para que las descomposiciones de mix cuadren al 100%.",
    "da": "Automatiza el análisis de atribución de varianza mediante la **Descomposición de Kitagawa**, entregando al comité ejecutivo cuántos puntos base (bps) provienen de mejoras reales de tasa y cuántos provienen de cambios en la mezcla de adquisición. Audita que ningún experimento A/B ni reporte mensual sufra sesgos de composición ocultos por país, plataforma o cohorte.",
    "bi": "Declara las métricas no aditivas como `type: ratio` en la Capa Semántica (MetricFlow / Cube) bloqueando cualquier intento de hacer `AVG(conversion_rate)`. Muestra en el dashboard ejecutivo la **Conversión Normalizada a Mix Constante** junto a la Conversión Observada y añade un indicador automático de *\"Alerta de Cambio de Mix\"* cuando ambos signos divergen."
  },
  "summary": [
    "Un ratio global nunca es el promedio de los ratios; suma numeradores y divide entre la suma de denominadores.",
    "Los conteos de usuarios únicos (COUNT DISTINCT) no son aditivos entre días ni entre canales.",
    "La paradoja de Simpson ocurre cuando cambia el peso relativo de segmentos con distinta tasa base.",
    "La descomposición de Kitagawa-Oaxaca separa el cambio real de rendimiento del cambio de mezcla."
  ],
  "flashcards": [
    {
      "id": "fc-c2-simp-01",
      "front": "¿Por qué es un error calcular la conversión mensual como AVG(daily_conversion_rate)?",
      "back": "Porque pondera igual un martes de 500 visitas que un sábado de 50 000 visitas; debe calcularse como SUM(orders) / SUM(sessions)."
    },
    {
      "id": "fc-c2-simp-02",
      "front": "¿Cómo se explica que la conversión suba en Web y suba en App pero baje en el total de la empresa?",
      "back": "Por un cambio de mezcla (mix shift): creció mucho el peso de tráfico en el canal con menor conversión base (App), arrastrando la media ponderada."
    },
    {
      "id": "fc-c2-simp-03",
      "front": "¿Por qué una métrica de inventario (stock_on_hand) se clasifica como semi-aditiva?",
      "back": "Se puede sumar entre productos y almacenes en una fecha fija, pero no se puede sumar a lo largo del tiempo (se promedia o se toma el cierre)."
    }
  ],
  "glossaryTerms": [
    "c09-kpi-trees-guardrails",
    "c10-simpsons-paradox",
    "c11-additivity-hll"
  ],
  "sources": [
    {
      "title": "Stanford Encyclopedia of Philosophy — Simpson’s Paradox",
      "url": "https://plato.stanford.edu/entries/paradox-simpson/",
      "publisher": "Stanford University",
      "accessed": "2026-10-29",
      "supports": "Fundamento matemático de la inversión de asociaciones al agregar subpoblaciones con pesos cambiantes."
    },
    {
      "title": "Kimball Group — Additive, Semi-Additive, and Non-Additive Facts",
      "url": "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/additive-semi-additive-non-additive-facts/",
      "publisher": "Kimball Group",
      "accessed": "2026-10-29",
      "supports": "Clasificación de medidas según las dimensiones sobre las que pueden sumarse válidamente."
    },
    {
      "title": "DuckDB Documentation — Approximate Aggregate Functions (approx_count_distinct / HyperLogLog)",
      "url": "https://duckdb.org/docs/sql/functions/aggregates.html",
      "publisher": "DuckDB Foundation",
      "accessed": "2026-10-29",
      "supports": "Estimación de cardinalidades no aditivas a gran escala mediante sketches HyperLogLog."
    }
  ],
  "aiNotes": "El error más habitual es promediar porcentajes o sumar usuarios únicos diarios para obtener usuarios mensuales. Pide siempre a la persona que escriba primero el numerador y el denominador por separado y que compruebe si los pesos por segmento cambiaron entre dos periodos.",
  "needsReview": true,
  "legacyId": "l6-metrics-simpson",
  "legacyOrder": 6,
  "stageId": "stage-2",
  "subtitle": "Cómo descomponer indicadores de negocio y evitar conclusiones opuestas al agregar segmentos.",
  "goal": "Analizar y descomponer métricas de negocio mediante Árboles de KPIs (North Star, Input Metrics y Guardrails), diseñar agregaciones seguras para métricas semi-aditivas y no aditivas, y diagnosticar matemáticamente la Paradoja de Simpson separando el Efecto Tasa del Efecto Mix.",
  "pipelineChallenge": {
    "title": "Sistema de métricas ante paradoja de Simpson",
    "scenario": "Diseña el flujo de extremo a extremo entre DE, DA y BI para que ningún cambio de mix ni agregación de ratios induzca a error al Comité Ejecutivo:",
    "description": "Ordena las 4 capas de ingeniería y análisis necesarias para construir un sistema de KPIs blindado contra errores de aditividad y sesgos de composición:",
    "prompt": "Ordena los pasos para construir un sistema de métricas empresariales inmune a la Paradoja de Simpson:",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "label": "1. Almacenar medidas atómicas aditivas y sketches en rollups (DE)",
        "title": "Rollup con componentes atómicos aditivos",
        "role": "DE",
        "layer": "Silver → Gold",
        "detail": "Materializar las tablas agregadas guardando explícitamente numeradores (`orders_count`, `net_revenue_usd`), denominadores (`sessions_count`) y sketches HyperLogLog, prohibiendo guardar solo porcentajes pre-divididos.",
        "description": "Materializar las tablas agregadas guardando explícitamente numeradores (`orders_count`, `net_revenue_usd`), denominadores (`sessions_count`) y sketches HyperLogLog, prohibiendo guardar solo porcentajes pre-divididos."
      },
      {
        "id": "step-2",
        "order": 2,
        "label": "2. Declarar árbol de indicadores, razones y controles en capa semántica (BI)",
        "title": "Definición semántica de razones y controles",
        "role": "BI",
        "layer": "Semantic Layer",
        "detail": "Definir en MetricFlow/Cube las métricas no aditivas como `SUM(numerador) / SUM(denominador)` y vincular cada métrica de crecimiento con su métrica Guardia (ej. Conversión ↔ Tasa de Reembolso).",
        "description": "Definir en MetricFlow/Cube las métricas no aditivas como `SUM(numerador) / SUM(denominador)` y vincular cada métrica de crecimiento con su métrica Guardia (ej. Conversión ↔ Tasa de Reembolso)."
      },
      {
        "id": "step-3",
        "order": 3,
        "label": "3. Ejecutar descomposición de Kitagawa entre efecto tasa y mix (DA)",
        "title": "Descomposición de efecto tasa y mix",
        "role": "DA",
        "layer": "Analytics Engine",
        "detail": "Cruzar los pesos del periodo base ($w_{t-1}$) con las tasas actuales ($r_t$) por canal, país y dispositivo para aislar cuántos puntos base se deben al producto y cuántos al cambio de mix.",
        "description": "Cruzar los pesos del periodo base ($w_{t-1}$) con las tasas actuales ($r_t$) por canal, país y dispositivo para aislar cuántos puntos base se deben al producto y cuántos al cambio de mix."
      },
      {
        "id": "step-4",
        "order": 4,
        "label": "4. Exponer alerta de paradoja de Simpson en el tablero ejecutivo (BI)",
        "title": "Visualización observada frente a mix constante",
        "role": "BI",
        "layer": "Executive BI",
        "detail": "Mostrar en la tarjeta de KPI tanto la tasa global observada como la tasa normalizada a mix constante, destacando automáticamente cuando el efecto mix invierte el signo de la tendencia.",
        "description": "Mostrar en la tarjeta de KPI tanto la tasa global observada como la tasa normalizada a mix constante, destacando automáticamente cuando el efecto mix invierte el signo de la tendencia."
      }
    ],
    "correctOrder": [
      "step-1",
      "step-2",
      "step-3",
      "step-4"
    ],
    "options": [
      {
        "id": "simp-pipe-ok",
        "text": "1) Guardar numeradores/denominadores atómicos en Gold → 2) Declarar ratios y Guardrails en Capa Semántica → 3) Descomponer Efecto Tasa vs. Mix (Kitagawa) → 4) Mostrar métrica Observada + Mix Constante en BI",
        "correct": true,
        "feedback": "Flujo de clase mundial. Así DE provee los bloques aditivos exactos, BI gobierna las fórmulas y DA descompone la causalidad real para la toma de decisiones."
      },
      {
        "id": "simp-pipe-bad1",
        "text": "1) Guardar solo la columna `conversion_pct` en la tabla Gold borrando `sessions` y `orders` → 2) Hacer `AVG(conversion_pct)` en el dashboard",
        "correct": false,
        "feedback": "Si borras el numerador y el denominador al crear el rollup, jamás podrás volver a agregar el ratio correctamente a otro nivel."
      },
      {
        "id": "simp-pipe-bad2",
        "text": "1) Ocultar el canal de App Móvil del reporte para que el promedio global no baje",
        "correct": false,
        "feedback": "Ocultar datos reales es una mala práctica ética y analítica; la solución técnica es mostrar la realidad completa descomponiendo el efecto mix."
      }
    ],
    "explanation": "El Comité Ejecutivo comprende en segundos que ambos equipos de producto mejoraron +50 bps y que la caída del promedio global (-57 bps) se debe al nuevo mix de adquisición móvil.",
    "expectedOutcome": "El Comité Ejecutivo comprende en 10 segundos que ambos equipos de producto mejoraron +50 bps y que la caída del promedio global (-57 bps) se debe al nuevo mix de adquisición móvil."
  },
  "relatedLessons": [
    {
      "id": "l4-star-schema-obt",
      "reason": "Las dimensiones conformadas de tu Star Schema son los ejes sobre los cuales auditas los cambios de mix."
    },
    {
      "id": "l5-scd2-history",
      "reason": "Usa dimensiones SCD Tipo 2 para que los cambios históricos de segmento no distorsionen tus tasas por cohorte."
    },
    {
      "id": "l1-joins-fanout",
      "reason": "Combina la protección contra Fan-Out con el cálculo correcto de ratios (`SUM/SUM`) para lograr métricas blindadas."
    }
  ]
};

export default lesson;
