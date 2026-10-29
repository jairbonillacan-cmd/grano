// Lección migrada al esquema v2 mediante scripts/migrate-legacy.mjs
const lesson = {
  "id": "da3-producto-02-cohorts-retention-ltv",
  "moduleId": "da3-producto",
  "tracks": [
    "da"
  ],
  "level": 3,
  "order": 2,
  "title": "Cohortes de retención, supervivencia y LTV con margen",
  "minutes": 30,
  "prerequisites": [
    "da3-producto-01"
  ],
  "contentVersion": 1,
  "hook": "En Mercado Brisa (empresa ficticia), la dirección celebra que el total de clientes activos crece un 12 % mensual. Sin embargo, al separar a los clientes según su mes de primera compra (cohorte de adquisición), descubres que quienes entraron hace un año seguían comprando al tercer mes en un 68 %, mientras que las cohortes recientes caen al 39 % al tercer mes. El gasto publicitario estaba ocultando un deterioro del producto. ¿Cómo construyes una matriz de retención sin sesgo por censura y calculas el LTV con margen bruto?",
  "objectives": [
    "Construir una tabla triangular de retención por cohorte de adquisición en SQL usando DATE_TRUNC y DATE_DIFF.",
    "Excluir las celdas con censura por la derecha (cohortes recientes que aún no cumplen N meses de vida).",
    "Calcular la razón LTV:CAC y el mes de recuperación (payback) multiplicando ingresos por el margen bruto real."
  ],
  "sections": [
    {
      "id": "sesgo-de-los-promedios-globales-y-definicion-de-",
      "heading": "Sesgo de los promedios globales y definición de una cohorte",
      "body": "Analizar la base total de usuarios como una masa uniforme mezcla clientes veteranos de hace 3 años (que ya superaron la curva de aprendizaje y rara vez cancelan) con miles de usuarios recién llegados hoy (donde ocurre el 70% de la deserción temprana). Cuando el marketing acelera, el influjo masivo de usuarios nuevos en el Mes 0 oculta el deterioro del producto.\nUna cohorte agrupa usuarios que comparten un evento fundacional en la misma ventana temporal (por ejemplo, el mes de su primera compra o activación: `cohort_month = DATE_TRUNC('month', MIN(event_ts))`). A partir de ese instante, medimos su ciclo de vida relativo en períodos `M0, M1, M2, ..., Mn` usando `DATE_DIFF('month', cohort_month, activity_month)`.",
      "interactive": {
        "component": "cohort-retention-sim",
        "caption": "Simulador interactivo: Cohortes de retención, supervivencia y LTV con margen"
      }
    },
    {
      "id": "retencion-de-clientes-frente-a-retencion-neta-de",
      "heading": "Retención de clientes frente a retención neta de ingresos (NRR)",
      "body": "En negocios de suscripción, pagos o comercio recurrente, debes separar dos curvas complementarias en cada cohorte:\n- Retención de Usuarios (Logo Retention): porcentaje de clientes originales de la cohorte que siguen activos en el mes `k` (`active_users_k / cohort_size_m0`). Nunca puede superar el 100%.\n- Retención Neta de Dólares (Net Revenue Retention - NRR): porcentaje de los ingresos iniciales de la cohorte que se conservan en el mes `k`, incluyendo expansiones (upgrades, cross-sell) y restando contracciones (downgrades) y cancelaciones (`revenue_k / revenue_m0`).\nCuando una plataforma logra que los clientes que permanecen expandan su consumo más rápido que lo perdido por quienes se van, la curva de NRR supera el 100% (ej. 115%) y dibuja una \"Curva de la Sonrisa\" (Flattening & Smiling Curve), señal inequívoca de Product-Market Fit.",
      "example": {
        "language": "sql",
        "code": "WITH user_cohort AS (\n  SELECT\n    customer_id,\n    DATE_TRUNC('month', MIN(activity_month)) AS cohort_month\n  FROM gold.fct_monthly_subscriptions\n  GROUP BY customer_id\n),\ncohort_activity AS (\n  SELECT\n    c.cohort_month,\n    DATE_DIFF('month', c.cohort_month, s.activity_month) AS month_number,\n    COUNT(DISTINCT s.customer_id) AS active_users,\n    SUM(s.mrr_usd) AS cohort_mrr_usd,\n    SUM(s.mrr_usd * s.gross_margin_pct) AS cohort_gross_profit_usd\n  FROM user_cohort c\n  JOIN gold.fct_monthly_subscriptions s ON c.customer_id = s.customer_id\n  GROUP BY c.cohort_month, month_number\n)\nSELECT\n  cohort_month,\n  month_number,\n  active_users,\n  ROUND(100.0 * active_users / FIRST_VALUE(active_users) OVER (\n    PARTITION BY cohort_month ORDER BY month_number\n  ), 1) AS logo_retention_pct,\n  ROUND(100.0 * cohort_mrr_usd / FIRST_VALUE(cohort_mrr_usd) OVER (\n    PARTITION BY cohort_month ORDER BY month_number\n  ), 1) AS nrr_pct,\n  ROUND(SUM(cohort_gross_profit_usd) OVER (\n    PARTITION BY cohort_month ORDER BY month_number\n  ) / FIRST_VALUE(active_users) OVER (\n    PARTITION BY cohort_month ORDER BY month_number\n  ), 2) AS cumulative_ltv_margin_usd\nFROM cohort_activity\nORDER BY cohort_month, month_number;",
        "expectedOutput": [
          {
            "cohort_month": "2026-07-01",
            "month_number": 0,
            "active_users": 1000,
            "logo_retention_pct": "100.0%",
            "nrr_pct": "100.0%",
            "cumulative_ltv_margin_usd": "$38.00"
          },
          {
            "cohort_month": "2026-07-01",
            "month_number": 1,
            "active_users": 820,
            "logo_retention_pct": "82.0%",
            "nrr_pct": "96.4%",
            "cumulative_ltv_margin_usd": "$74.63"
          },
          {
            "cohort_month": "2026-07-01",
            "month_number": 3,
            "active_users": 710,
            "logo_retention_pct": "71.0%",
            "nrr_pct": "108.5% (Expansión)",
            "cumulative_ltv_margin_usd": "$152.40"
          }
        ]
      }
    },
    {
      "id": "analisis-de-supervivencia-y-datos-censurados-por",
      "heading": "Análisis de supervivencia y datos censurados por la derecha",
      "body": "Un error clásico al calcular la vida media de un cliente en SQL es ejecutar `AVG(dias_activo) WHERE status = 'CANCELLED'`. Ese filtro comete sesgo de selección severo porque ignora precisamente a tus mejores clientes: los que siguen vivos hoy.\nEn estadística aplicada (estimador de Kaplan-Meier), los clientes que entraron hace 2 meses y siguen activos son observaciones \"censuradas por la derecha\" (Right-Censored): sabemos que sobrevivieron al menos 60 días, pero aún no conocemos su duración final. Por eso en la matriz triangular de cohortes nunca debes rellenar con `0%` los meses futuros que una cohorte joven aún no ha vivido; deben quedar como `NULL` para no hundir artificialmente el promedio de `M6` o `M12`."
    },
    {
      "id": "calculo-de-ltv-con-margen-bruto-cac-y-recuperaci",
      "heading": "Cálculo de LTV con margen bruto, CAC y recuperación",
      "body": "Un error financiero frecuente en BI y marketing es calcular el Valor de Vida del Cliente (LTV) sobre ingresos brutos (`ARPU / Churn`). Si un cliente genera $100 de ingresos pero atenderlo cuesta $40 en servidores, pasarelas de pago y soporte (Margen Bruto = 60%), el dinero real que contribuye a recuperar su Costo de Adquisición (CAC) es solo $60.\nLa fórmula honesta integra el margen bruto (`Gross Margin %`) sobre el área bajo la curva de retención acumulada en un horizonte acotado (ej. LTV a 12 o 24 meses) y vigila el CAC Payback Period (cuántos meses tarda el margen bruto acumulado de la cohorte en igualar el CAC invertido). Un ratio `LTV:CAC >= 3.0x` con un `Payback < 12 meses` distingue el crecimiento rentable del crecimiento subsidiado."
    }
  ],
  "workedExample": {
    "title": "Ejemplo guiado: Cohortes de retención, supervivencia y LTV con margen",
    "description": "Compara el cálculo erróneo de vida media (que sufre sesgo de supervivencia y olvida el margen bruto) frente a una matriz SQL de cohortes y LTV acumulado real:",
    "audit": "",
    "steps": [
      {
        "label": "Antipatrón: deserción global y LTV sobre usuarios cancelados",
        "explanation": "Compara el cálculo erróneo de vida media (que sufre sesgo de supervivencia y olvida el margen bruto) frente a una matriz SQL de cohortes y LTV acumulado real:",
        "code": "-- ERROR COMÚN:\n-- 1) Calcula vida media solo sobre usuarios que YA cancelaron (ignora a los mejores clientes activos)\n-- 2) Usa ingreso bruto sin descontar costo de ventas (COGS / Margen Bruto)\n-- 3) Mezcla todas las cohortes en un único promedio engañoso\nSELECT\n  AVG(DATE_DIFF('month', signup_date, cancelled_date)) AS meses_vida_sesgados,\n  AVG(monthly_revenue_usd) * AVG(DATE_DIFF('month', signup_date, cancelled_date)) AS ltv_bruto_falso\nFROM subscriptions\nWHERE status = 'CANCELLED';",
        "expectedOutput": [
          {
            "meses_vida_sesgados": "2.4 meses (Subestimado: ignora clientes activos de 24+ meses)",
            "ltv_bruto_falso": "$120.00 (Sin descontar 35% de costos directos ni censura)"
          }
        ]
      },
      {
        "label": "Solución óptima: matriz de cohortes y LTV con margen bruto",
        "explanation": "Compara ahora la consulta corregida y verifica cómo las filas y totales coinciden con la auditoría.",
        "code": "WITH user_cohort AS (\n  SELECT\n    customer_id,\n    DATE_TRUNC('month', MIN(activity_month)) AS cohort_month\n  FROM gold.fct_monthly_subscriptions\n  GROUP BY customer_id\n),\ncohort_activity AS (\n  SELECT\n    c.cohort_month,\n    DATE_DIFF('month', c.cohort_month, s.activity_month) AS month_number,\n    COUNT(DISTINCT s.customer_id) AS active_users,\n    SUM(s.mrr_usd) AS cohort_mrr_usd,\n    SUM(s.mrr_usd * s.gross_margin_pct) AS cohort_gross_profit_usd\n  FROM user_cohort c\n  JOIN gold.fct_monthly_subscriptions s ON c.customer_id = s.customer_id\n  GROUP BY c.cohort_month, month_number\n)\nSELECT\n  cohort_month,\n  month_number,\n  active_users,\n  ROUND(100.0 * active_users / FIRST_VALUE(active_users) OVER (\n    PARTITION BY cohort_month ORDER BY month_number\n  ), 1) AS logo_retention_pct,\n  ROUND(100.0 * cohort_mrr_usd / FIRST_VALUE(cohort_mrr_usd) OVER (\n    PARTITION BY cohort_month ORDER BY month_number\n  ), 1) AS nrr_pct,\n  ROUND(SUM(cohort_gross_profit_usd) OVER (\n    PARTITION BY cohort_month ORDER BY month_number\n  ) / FIRST_VALUE(active_users) OVER (\n    PARTITION BY cohort_month ORDER BY month_number\n  ), 2) AS cumulative_ltv_margin_usd\nFROM cohort_activity\nORDER BY cohort_month, month_number;",
        "expectedOutput": [
          {
            "cohort_month": "2026-07-01",
            "month_number": 0,
            "active_users": 1000,
            "logo_retention_pct": "100.0%",
            "nrr_pct": "100.0%",
            "cumulative_ltv_margin_usd": "$38.00"
          },
          {
            "cohort_month": "2026-07-01",
            "month_number": 1,
            "active_users": 820,
            "logo_retention_pct": "82.0%",
            "nrr_pct": "96.4%",
            "cumulative_ltv_margin_usd": "$74.63"
          },
          {
            "cohort_month": "2026-07-01",
            "month_number": 3,
            "active_users": 710,
            "logo_retention_pct": "71.0%",
            "nrr_pct": "108.5% (Expansión)",
            "cumulative_ltv_margin_usd": "$152.40"
          }
        ]
      }
    ]
  },
  "checks": [
    {
      "id": "c1",
      "type": "mcq",
      "prompt": "Al construir una tabla de retención de cohortes en producción, un analista rellena con `0%` los meses `M3`, `M4` y `M5` de la cohorte adquirida en septiembre de 2026 (que solo lleva 1 mes de vida) y luego calcula el promedio de retención `M3` de todo el año. ¿Qué error estadístico acaba de cometer?",
      "options": [
        {
          "id": "a",
          "text": "Ignoró la censura por la derecha (Right-Censoring): trató períodos futuros que la cohorte de septiembre aún no ha vivido como si el 100% de sus usuarios hubieran cancelado, desplomando artificialmente el promedio de M3.",
          "correct": true,
          "feedback": "Exacto. Una cohorte nacida hace 1 mes está censurada por la derecha a partir de M2: aún no ha llegado al tercer mes. Esas celdas deben ser `NULL` (nunca `0%`) para que `AVG()` solo promedie cohortes que realmente cumplieron 3 meses de antigüedad."
        },
        {
          "id": "b",
          "text": "Ninguno; en SQL siempre hay que reemplazar todos los `NULL` por `0` en cualquier tabla.",
          "correct": false,
          "feedback": "Reemplazar un `NULL` que significa \"evento futuro aún no observado\" por `0` destruye la media estadística de las columnas derechas de la matriz triangular."
        },
        {
          "id": "c",
          "text": "Debería haber rellenado los meses futuros con `100%` en lugar de `0%`.",
          "correct": false,
          "feedback": "Rellenar con `100%` inflaría falsamente la retención; la única representación matemáticamente honesta de un período futuro no transcurrido es `NULL`."
        }
      ],
      "explanation": "Exacto. Una cohorte nacida hace 1 mes está censurada por la derecha a partir de M2: aún no ha llegado al tercer mes. Esas celdas deben ser `NULL` (nunca `0%`) para que `AVG()` solo promedie cohortes que realmente cumplieron 3 meses de antigüedad."
    },
    {
      "id": "c2",
      "type": "mcq",
      "prompt": "Hoy es `2026-10-15`. Quieres calcular en SQL la retención media al mes 3 (`period_n = 3`) de todas las cohortes mensuales del año. ¿Qué condición `WHERE` evita el sesgo por censura de las cohortes de agosto, septiembre y octubre?",
      "options": [
        {
          "id": "a",
          "text": "WHERE cohort_month + INTERVAL '3 months' <= DATE_TRUNC('month', CURRENT_DATE)",
          "correct": true,
          "feedback": "Correcto: evalúa únicamente las cohortes que ya tuvieron al menos 3 meses completos de calendario para demostrar si retenían o no."
        },
        {
          "id": "b",
          "text": "Usar COALESCE(retained_users, 0) para todas las cohortes hasta octubre incluido.",
          "correct": false,
          "feedback": "Incorrecto: imputar 0 a meses que todavía no han ocurrido en el calendario distorsiona la media hacia abajo."
        },
        {
          "id": "c",
          "text": "Multiplicar por 2 las cohortes recientes para compensar.",
          "correct": false,
          "feedback": "Incorrecto: un factor arbitrario carece de validez estadística."
        }
      ],
      "explanation": "En análisis de cohortes y supervivencia, una cohorte solo entra en el denominador del periodo k si ha transcurrido al menos el tiempo k desde su inicio."
    },
    {
      "id": "c3",
      "type": "predict-output",
      "prompt": "En Mercado Brisa, un cliente promedio genera 200 USD de compras acumuladas en 24 meses, el margen bruto después de costo de mercancía y reparto es del 30 %, y el costo de adquisición (CAC) fue de 30 USD. ¿Cuál es la razón `LTV / CAC` real?",
      "options": [
        {
          "id": "a",
          "text": "2.0x (LTV con margen = 200 × 0.30 = 60 USD; dividido entre CAC de 30 USD = 2.0).",
          "correct": true,
          "feedback": "Correcto: el LTV económico es el margen bruto acumulado (60 USD), lo que arroja una relación de 2.0 veces el CAC."
        },
        {
          "id": "b",
          "text": "6.67x (dividiendo los 200 USD de venta bruta entre los 30 USD de CAC).",
          "correct": false,
          "feedback": "Incorrecto: ignora que el 70 % de los 200 USD se destina a pagar los productos y la logística."
        },
        {
          "id": "c",
          "text": "0.5x (dividiendo CAC entre LTV).",
          "correct": false,
          "feedback": "Incorrecto: invierte el numerador y el denominador de la razón LTV:CAC."
        }
      ],
      "explanation": "El costo de adquisición se paga con el margen de contribución que deja el cliente tras cubrir el costo de los bienes vendidos y el envío."
    }
  ],
  "practice": {
    "type": "fill-blanks",
    "title": "Matriz de cohortes y retención neta",
    "language": "sql",
    "prompt": "Completa la consulta analítica para calcular el índice de mes relativo (`month_number`), la retención porcentual de usuarios (`logo_retention_pct`) y la retención neta de ingresos (`nrr_pct`) tomando siempre el valor del Mes 0 (`month_number = 0`) de cada cohorte como denominador.",
    "starterCode": "WITH cohort_base AS (\n  SELECT\n    cohort_month,\n    {{b1}}('month', cohort_month, activity_month) AS month_number,\n    COUNT(DISTINCT customer_id) AS active_users,\n    SUM(net_mrr_usd) AS cohort_mrr\n  FROM gold.cohort_monthly_ledger\n  GROUP BY cohort_month, month_number\n)\nSELECT\n  cohort_month,\n  month_number,\n  active_users,\n  ROUND(\n    100.0 * active_users / {{b2}}(active_users) OVER (\n      PARTITION BY {{b3}} ORDER BY month_number\n    ),\n    1\n  ) AS logo_retention_pct,\n  ROUND(\n    100.0 * cohort_mrr / FIRST_VALUE(cohort_mrr) OVER (\n      PARTITION BY cohort_month ORDER BY month_number\n    ),\n    1\n  ) AS nrr_pct\nFROM cohort_base\nORDER BY cohort_month, month_number;",
    "expected": "WITH cohort_base AS (\n  SELECT\n    cohort_month,\n    {{b1}}('month', cohort_month, activity_month) AS month_number,\n    COUNT(DISTINCT customer_id) AS active_users,\n    SUM(net_mrr_usd) AS cohort_mrr\n  FROM gold.cohort_monthly_ledger\n  GROUP BY cohort_month, month_number\n)\nSELECT\n  cohort_month,\n  month_number,\n  active_users,\n  ROUND(\n    100.0 * active_users / {{b2}}(active_users) OVER (\n      PARTITION BY {{b3}} ORDER BY month_number\n    ),\n    1\n  ) AS logo_retention_pct,\n  ROUND(\n    100.0 * cohort_mrr / FIRST_VALUE(cohort_mrr) OVER (\n      PARTITION BY cohort_month ORDER BY month_number\n    ),\n    1\n  ) AS nrr_pct\nFROM cohort_base\nORDER BY cohort_month, month_number;",
    "orderMatters": true,
    "hints": [
      "Función de diferencia de fechas: Necesitas calcular cuántos meses han transcurrido entre `cohort_month` y `activity_month`.",
      "Función de ventana para el valor inicial M0: Al ordenar por `month_number` ascendente, el primer valor de la ventana corresponde exactamente al Mes 0.",
      "Columna de partición de la cohorte: Cada cohorte debe dividirse por su propio tamaño inicial en `M0`, sin mezclar meses de adquisición distintos."
    ],
    "solution": "WITH cohort_base AS (\n  SELECT\n    cohort_month,\n    {{b1}}('month', cohort_month, activity_month) AS month_number,\n    COUNT(DISTINCT customer_id) AS active_users,\n    SUM(net_mrr_usd) AS cohort_mrr\n  FROM gold.cohort_monthly_ledger\n  GROUP BY cohort_month, month_number\n)\nSELECT\n  cohort_month,\n  month_number,\n  active_users,\n  ROUND(\n    100.0 * active_users / {{b2}}(active_users) OVER (\n      PARTITION BY {{b3}} ORDER BY month_number\n    ),\n    1\n  ) AS logo_retention_pct,\n  ROUND(\n    100.0 * cohort_mrr / FIRST_VALUE(cohort_mrr) OVER (\n      PARTITION BY cohort_month ORDER BY month_number\n    ),\n    1\n  ) AS nrr_pct\nFROM cohort_base\nORDER BY cohort_month, month_number;",
    "solutionExplanation": "Calcula la edad relativa de la cohorte (`month_number`) con `DATE_DIFF` respecto al mes de alta inmutable. Ancla el denominador al tamaño original de la cohorte en M0 mediante `FIRST_VALUE(...) OVER (PARTITION BY cohort_month ORDER BY month_number)`. Separa la retención de clientes (`active_users`) de la retención neta de ingresos (`cohort_mrr`).",
    "blanks": [
      {
        "id": "b1",
        "placeholder": "Función de diferencia de fechas",
        "acceptedAnswers": [
          "DATE_DIFF",
          "DATEDIFF"
        ],
        "hint": "Necesitas calcular cuántos meses han transcurrido entre `cohort_month` y `activity_month`."
      },
      {
        "id": "b2",
        "placeholder": "Función de ventana para el valor inicial M0",
        "acceptedAnswers": [
          "FIRST_VALUE"
        ],
        "hint": "Al ordenar por `month_number` ascendente, el primer valor de la ventana corresponde exactamente al Mes 0."
      },
      {
        "id": "b3",
        "placeholder": "Columna de partición de la cohorte",
        "acceptedAnswers": [
          "cohort_month"
        ],
        "hint": "Cada cohorte debe dividirse por su propio tamaño inicial en `M0`, sin mezclar meses de adquisición distintos."
      }
    ],
    "expectedOutputTable": [
      {
        "cohort_month": "2026-08-01",
        "month_number": 0,
        "active_users": 500,
        "logo_retention_pct": "100.0",
        "nrr_pct": "100.0"
      },
      {
        "cohort_month": "2026-08-01",
        "month_number": 1,
        "active_users": 410,
        "logo_retention_pct": "82.0",
        "nrr_pct": "98.5"
      },
      {
        "cohort_month": "2026-08-01",
        "month_number": 2,
        "active_users": 380,
        "logo_retention_pct": "76.0",
        "nrr_pct": "112.4"
      }
    ],
    "rubricCriteria": [
      "Calcula la edad relativa de la cohorte (`month_number`) con `DATE_DIFF` respecto al mes de alta inmutable.",
      "Ancla el denominador al tamaño original de la cohorte en M0 mediante `FIRST_VALUE(...) OVER (PARTITION BY cohort_month ORDER BY month_number)`.",
      "Separa la retención de clientes (`active_users`) de la retención neta de ingresos (`cohort_mrr`)."
    ]
  },
  "roleNotes": {
    "de": "Materializa la fecha inmutable de primera activación (`first_active_date`) en `dim_customers` y construye un calendario denso (Date Spine) en la capa Silver para detectar meses de inactividad sin huecos. Particiona las tablas de actividad mensual por `activity_month` y ordena por `cohort_month` para que los escaneos históricos de 36 meses sean instantáneos. Garantiza que los eventos tardíos o reactivaciones no sobrescriban el `cohort_month` original del usuario.",
    "da": "Construye matrices triangulares de retención usando `FIRST_VALUE(active_users) OVER (PARTITION BY cohort_month ORDER BY month_number)` y audita la censura por la derecha. Estima curvas de supervivencia Kaplan-Meier y descompone cambios en LTV por canal de adquisición, dispositivo y cohorte de producto. Detecta cuándo el aplanamiento de la curva (asíntota de retención) se desplaza tras un cambio en el flujo de onboarding.",
    "bi": "Publica mapas de calor (Heatmaps) triangulares de cohortes donde cada fila muestra el tamaño inicial (`N`) y las celdas futuras no vividas se ocultan en blanco en lugar de mostrar `0%`. Estandariza en la Capa Semántica las definiciones de `Logo Retention`, `Gross Revenue Retention (GRR, máx 100%)` y `Net Revenue Retention (NRR)` junto al `CAC Payback` ajustado por margen bruto."
  },
  "summary": [
    "Una cohorte agrupa usuarios que comparten la fecha de un evento fundador (primera compra o registro).",
    "El crecimiento bruto de usuarios activos puede ocultar una caída severa en la retención de nuevas cohortes.",
    "Promediar el mes N sin filtrar cohortes que aún no cumplieron N meses introduce sesgo por censura.",
    "El LTV debe calcularse sobre margen de contribución neto de costos directos, nunca sobre ingreso bruto."
  ],
  "flashcards": [
    {
      "id": "fc-da3-coh-01",
      "front": "¿Qué es la censura por la derecha (right censoring) en una matriz de retención por cohortes?",
      "back": "Es el hecho de que las cohortes recientes aún no han vivido los meses futuros (M3, M6); incluirlas como 0 en el promedio hunde artificialmente la retención."
    },
    {
      "id": "fc-da3-coh-02",
      "front": "¿Por qué es peligroso calcular LTV usando ingreso bruto en lugar de margen bruto en un supermercado en línea?",
      "back": "Porque si el margen bruto es del 25 %, usar ingreso bruto infla 4 veces el LTV y lleva a aprobar costos de adquisición (CAC) que generan pérdidas por cada cliente."
    },
    {
      "id": "fc-da3-coh-03",
      "front": "¿Qué diferencia hay entre retención de usuarios (Logo Retention) y retención neta de ingresos (NRR)?",
      "back": "Logo Retention mide el porcentaje de clientes que siguen activos (<= 100 %); NRR mide el ingreso retenido más expansiones de la cohorte (puede superar el 100 %)."
    }
  ],
  "glossaryTerms": [
    "c22-cohort-retention-ltv",
    "c09-kpi-trees-guardrails"
  ],
  "sources": [
    {
      "title": "Statsig Documentation — Retention and Cohort Analysis Methodology",
      "url": "https://docs.statsig.com/pulse/retention/",
      "publisher": "Statsig",
      "accessed": "2026-10-29",
      "supports": "Cálculo de curvas de retención por cohorte y manejo de ventanas completas de observación."
    },
    {
      "title": "lifelines Documentation — Survival Analysis and Right-Censored Data (Kaplan-Meier)",
      "url": "https://lifelines.readthedocs.io/en/latest/Survival%20analysis%20with%20lifelines.html",
      "publisher": "Cam Davidson-Pilon",
      "accessed": "2026-10-29",
      "supports": "Tratamiento estadístico de observaciones censuradas por la derecha en tiempos de vida."
    },
    {
      "title": "DuckDB Documentation — Date Functions (date_trunc, date_diff, intervals)",
      "url": "https://duckdb.org/docs/sql/functions/date.html",
      "publisher": "DuckDB Foundation",
      "accessed": "2026-10-29",
      "supports": "Funciones de truncamiento y diferencia de fechas para construir matrices de cohortes en SQL."
    }
  ],
  "aiNotes": "Los dos errores más comunes son incluir cohortes incompletas como ceros en el promedio del mes k y calcular el LTV con ingresos brutos sin descontar el costo de ventas.",
  "needsReview": true,
  "legacyId": "l13-cohorts-retention-ltv",
  "legacyOrder": 13,
  "stageId": "stage-5",
  "subtitle": "Matrices triangulares sin sesgo de censura y cálculo del valor de vida ajustado por margen.",
  "goal": "Construir matrices de retención por cohorte (Logo vs. Net Dollar Retention), manejar datos censurados por la derecha en análisis de supervivencia y calcular LTV/CAC ajustado por margen bruto.",
  "pipelineChallenge": {
    "title": "Economía unitaria y matriz de cohortes",
    "scenario": "Ordena los pasos entre Ingeniería (DE), Análisis (DA) y BI para construir un sistema de retención de cohortes y LTV/CAC libre de sesgo de supervivencia y de falsos ceros en meses futuros.",
    "steps": [
      {
        "id": "step-1",
        "label": "1. Materializar la fecha fundacional inmutable y el calendario mensual",
        "role": "DE",
        "detail": "Persistir `first_paid_month` en `dim_customer` y cruzar con un calendario mensual acotado hasta la fecha actual de corte (`CURRENT_DATE`)."
      },
      {
        "id": "step-2",
        "label": "2. Consolidar ingresos recurrentes netos y costos directos en silver",
        "role": "DE",
        "detail": "Unir facturación neta de reembolsos con costos de servidor y pasarela para exponer el margen bruto real por usuario y mes."
      },
      {
        "id": "step-3",
        "label": "3. Modelar matrices de retención, supervivencia y LTV acumulado en gold",
        "role": "DA",
        "detail": "Calcular `logo_retention_pct`, `nrr_pct` y el LTV de margen acumulado con funciones de ventana, manteniendo `NULL` en períodos futuros censurados."
      },
      {
        "id": "step-4",
        "label": "4. Publicar el mapa triangular y recuperación de CAC en BI",
        "role": "BI",
        "detail": "Exponer la matriz triangular con formato condicional y el indicador de meses de recuperación del CAC por cohorte y canal."
      }
    ],
    "explanation": "Cuando DE fija el mes de alta inmutable y acota el Date Spine al presente, DA calcula la retención y el margen acumulado respetando la censura por la derecha, y BI presenta la matriz triangular sin promediar meses futuros inexistentes."
  },
  "relatedLessons": [
    {
      "id": "l2-window-functions",
      "reason": "Las matrices de cohortes dependen directamente de `FIRST_VALUE` y `SUM() OVER` para fijar el denominador del Mes 0 y acumular el LTV."
    },
    {
      "id": "l6-metrics-simpson",
      "reason": "El Churn global sufre la Paradoja de Simpson cuando cambia el peso entre cohortes nuevas (alto churn inicial) y cohortes maduras."
    },
    {
      "id": "l14-ab-testing-cuped",
      "reason": "Cuando detectas una caída en la retención M1 de una cohorte, diseñas un experimento A/B controlado para probar mejoras en el onboarding."
    }
  ]
};

export default lesson;
