export const STAGE_5_LESSONS = [
  {
    id: 'l13-cohorts-retention-ltv',
    stageId: 'stage-5',
    order: 13,
    title: 'Cohortes de retención, supervivencia y LTV',
    subtitle: 'Matrices triangulares sin sesgo de censura y cálculo del valor de vida ajustado por margen.',
    duration: '30 min',
    level: 'Avanzado',
    bloomLevel: 'analyze',
    coreFocus: ['DA', 'BI', 'DE'],
    goal: 'Construir matrices de retención por cohorte (Logo vs. Net Dollar Retention), manejar datos censurados por la derecha en análisis de supervivencia y calcular LTV/CAC ajustado por margen bruto.',
    visualType: 'cohort-retention-sim',
    storyContext:
      'Caso real en CloudPulse SaaS: El CEO celebra que los usuarios activos totales crecen un 12% cada mes y que el "Churn mensual global" parece estable en 3.5%. Sin embargo, al separar a los usuarios según su mes de registro (Cohorte de Adquisición), descubres algo alarmante: las cohortes de hace un año retenían al 68% de los clientes al tercer mes (M3), mientras que las cohortes adquiridas en los últimos dos trimestres caen al 39% en M3. El fuerte gasto en anuncios estaba llenando un balde cada vez más agujereado.',
    sections: [
      {
        heading: 'Sesgo de los promedios globales y definición de una cohorte',
        body: 'Analizar la base total de usuarios como una masa uniforme mezcla clientes veteranos de hace 3 años (que ya superaron la curva de aprendizaje y rara vez cancelan) con miles de usuarios recién llegados hoy (donde ocurre el 70% de la deserción temprana). Cuando el marketing acelera, el influjo masivo de usuarios nuevos en el Mes 0 oculta el deterioro del producto.\nUna cohorte agrupa usuarios que comparten un evento fundacional en la misma ventana temporal (por ejemplo, el mes de su primera compra o activación: `cohort_month = DATE_TRUNC(\'month\', MIN(event_ts))`). A partir de ese instante, medimos su ciclo de vida relativo en períodos `M0, M1, M2, ..., Mn` usando `DATE_DIFF(\'month\', cohort_month, activity_month)`.',
      },
      {
        heading: 'Retención de clientes frente a retención neta de ingresos (NRR)',
        body: 'En negocios de suscripción, pagos o comercio recurrente, debes separar dos curvas complementarias en cada cohorte:\n- Retención de Usuarios (Logo Retention): porcentaje de clientes originales de la cohorte que siguen activos en el mes `k` (`active_users_k / cohort_size_m0`). Nunca puede superar el 100%.\n- Retención Neta de Dólares (Net Revenue Retention - NRR): porcentaje de los ingresos iniciales de la cohorte que se conservan en el mes `k`, incluyendo expansiones (upgrades, cross-sell) y restando contracciones (downgrades) y cancelaciones (`revenue_k / revenue_m0`).\nCuando una plataforma logra que los clientes que permanecen expandan su consumo más rápido que lo perdido por quienes se van, la curva de NRR supera el 100% (ej. 115%) y dibuja una "Curva de la Sonrisa" (Flattening & Smiling Curve), señal inequívoca de Product-Market Fit.',
      },
      {
        heading: 'Análisis de supervivencia y tratamiento de datos censurados por la derecha',
        body: 'Un error clásico al calcular la vida media de un cliente en SQL es ejecutar `AVG(dias_activo) WHERE status = \'CANCELLED\'`. Ese filtro comete sesgo de selección severo porque ignora precisamente a tus mejores clientes: los que siguen vivos hoy.\nEn estadística aplicada (estimador de Kaplan-Meier), los clientes que entraron hace 2 meses y siguen activos son observaciones "censuradas por la derecha" (Right-Censored): sabemos que sobrevivieron al menos 60 días, pero aún no conocemos su duración final. Por eso en la matriz triangular de cohortes nunca debes rellenar con `0%` los meses futuros que una cohorte joven aún no ha vivido; deben quedar como `NULL` para no hundir artificialmente el promedio de `M6` o `M12`.',
      },
      {
        heading: 'Cálculo de valor de vida ajustado por margen bruto, CAC y periodo de recuperación',
        body: 'Un error financiero frecuente en BI y marketing es calcular el Valor de Vida del Cliente (LTV) sobre ingresos brutos (`ARPU / Churn`). Si un cliente genera $100 de ingresos pero atenderlo cuesta $40 en servidores, pasarelas de pago y soporte (Margen Bruto = 60%), el dinero real que contribuye a recuperar su Costo de Adquisición (CAC) es solo $60.\nLa fórmula honesta integra el margen bruto (`Gross Margin %`) sobre el área bajo la curva de retención acumulada en un horizonte acotado (ej. LTV a 12 o 24 meses) y vigila el CAC Payback Period (cuántos meses tarda el margen bruto acumulado de la cohorte en igualar el CAC invertido). Un ratio `LTV:CAC >= 3.0x` con un `Payback < 12 meses` distingue el crecimiento rentable del crecimiento subsidiado.',
      },
    ],
    triadPerspectives: {
      DE: {
        title: 'Qué construye y optimiza ingeniería (DE)',
        points: [
          'Materializa la fecha inmutable de primera activación (`first_active_date`) en `dim_customers` y construye un calendario denso (Date Spine) en la capa Silver para detectar meses de inactividad sin huecos.',
          'Particiona las tablas de actividad mensual por `activity_month` y ordena por `cohort_month` para que los escaneos históricos de 36 meses sean instantáneos.',
          'Garantiza que los eventos tardíos o reactivaciones no sobrescriban el `cohort_month` original del usuario.',
        ],
      },
      DA: {
        title: 'Qué analiza y modela análisis (DA)',
        points: [
          'Construye matrices triangulares de retención usando `FIRST_VALUE(active_users) OVER (PARTITION BY cohort_month ORDER BY month_number)` y audita la censura por la derecha.',
          'Estima curvas de supervivencia Kaplan-Meier y descompone cambios en LTV por canal de adquisición, dispositivo y cohorte de producto.',
          'Detecta cuándo el aplanamiento de la curva (asíntota de retención) se desplaza tras un cambio en el flujo de onboarding.',
        ],
      },
      BI: {
        title: 'Qué gobierna y visualiza BI',
        points: [
          'Publica mapas de calor (Heatmaps) triangulares de cohortes donde cada fila muestra el tamaño inicial (`N`) y las celdas futuras no vividas se ocultan en blanco en lugar de mostrar `0%`.',
          'Estandariza en la Capa Semántica las definiciones de `Logo Retention`, `Gross Revenue Retention (GRR, máx 100%)` y `Net Revenue Retention (NRR)` junto al `CAC Payback` ajustado por margen bruto.',
          'Cruza las curvas de retención M1/M3 con alertas ejecutivas para detectar degradaciones de calidad de tráfico antes de que impacten el balance anual.',
        ],
      },
    },
    relatedLessons: [
      {
        id: 'l2-window-functions',
        reason: 'Las matrices de cohortes dependen directamente de `FIRST_VALUE` y `SUM() OVER` para fijar el denominador del Mes 0 y acumular el LTV.',
      },
      {
        id: 'l6-metrics-simpson',
        reason: 'El Churn global sufre la Paradoja de Simpson cuando cambia el peso entre cohortes nuevas (alto churn inicial) y cohortes maduras.',
      },
      {
        id: 'l14-ab-testing-cuped',
        reason: 'Cuando detectas una caída en la retención M1 de una cohorte, diseñas un experimento A/B controlado para probar mejoras en el onboarding.',
      },
    ],
    playground: {
      description: 'Compara el cálculo erróneo de vida media (que sufre sesgo de supervivencia y olvida el margen bruto) frente a una matriz SQL de cohortes y LTV acumulado real:',
      badQueryLabel: 'Antipatrón: deserción global y LTV sobre usuarios cancelados',
      badQuery: `-- ERROR COMÚN:
-- 1) Calcula vida media solo sobre usuarios que YA cancelaron (ignora a los mejores clientes activos)
-- 2) Usa ingreso bruto sin descontar costo de ventas (COGS / Margen Bruto)
-- 3) Mezcla todas las cohortes en un único promedio engañoso
SELECT
  AVG(DATE_DIFF('month', signup_date, cancelled_date)) AS meses_vida_sesgados,
  AVG(monthly_revenue_usd) * AVG(DATE_DIFF('month', signup_date, cancelled_date)) AS ltv_bruto_falso
FROM subscriptions
WHERE status = 'CANCELLED';`,
      badResult: [
        {
          meses_vida_sesgados: '2.4 meses (Subestimado: ignora clientes activos de 24+ meses)',
          ltv_bruto_falso: '$120.00 (Sin descontar 35% de costos directos ni censura)',
        },
      ],
      goodQueryLabel: 'Solución óptima: matriz de cohortes y LTV con margen bruto',
      goodQuery: `WITH user_cohort AS (
  SELECT
    customer_id,
    DATE_TRUNC('month', MIN(activity_month)) AS cohort_month
  FROM gold.fct_monthly_subscriptions
  GROUP BY customer_id
),
cohort_activity AS (
  SELECT
    c.cohort_month,
    DATE_DIFF('month', c.cohort_month, s.activity_month) AS month_number,
    COUNT(DISTINCT s.customer_id) AS active_users,
    SUM(s.mrr_usd) AS cohort_mrr_usd,
    SUM(s.mrr_usd * s.gross_margin_pct) AS cohort_gross_profit_usd
  FROM user_cohort c
  JOIN gold.fct_monthly_subscriptions s ON c.customer_id = s.customer_id
  GROUP BY c.cohort_month, month_number
)
SELECT
  cohort_month,
  month_number,
  active_users,
  ROUND(100.0 * active_users / FIRST_VALUE(active_users) OVER (
    PARTITION BY cohort_month ORDER BY month_number
  ), 1) AS logo_retention_pct,
  ROUND(100.0 * cohort_mrr_usd / FIRST_VALUE(cohort_mrr_usd) OVER (
    PARTITION BY cohort_month ORDER BY month_number
  ), 1) AS nrr_pct,
  ROUND(SUM(cohort_gross_profit_usd) OVER (
    PARTITION BY cohort_month ORDER BY month_number
  ) / FIRST_VALUE(active_users) OVER (
    PARTITION BY cohort_month ORDER BY month_number
  ), 2) AS cumulative_ltv_margin_usd
FROM cohort_activity
ORDER BY cohort_month, month_number;`,
      goodResult: [
        {
          cohort_month: '2026-07-01',
          month_number: 0,
          active_users: 1000,
          logo_retention_pct: '100.0%',
          nrr_pct: '100.0%',
          cumulative_ltv_margin_usd: '$38.00',
        },
        {
          cohort_month: '2026-07-01',
          month_number: 1,
          active_users: 820,
          logo_retention_pct: '82.0%',
          nrr_pct: '96.4%',
          cumulative_ltv_margin_usd: '$74.63',
        },
        {
          cohort_month: '2026-07-01',
          month_number: 3,
          active_users: 710,
          logo_retention_pct: '71.0%',
          nrr_pct: '108.5% (Expansión)',
          cumulative_ltv_margin_usd: '$152.40',
        },
      ],
    },
    codeChallenge: {
      title: 'Matriz de cohortes y retención neta',
      instruction:
        'Completa la consulta analítica para calcular el índice de mes relativo (`month_number`), la retención porcentual de usuarios (`logo_retention_pct`) y la retención neta de ingresos (`nrr_pct`) tomando siempre el valor del Mes 0 (`month_number = 0`) de cada cohorte como denominador.',
      templateCode: `WITH cohort_base AS (
  SELECT
    cohort_month,
    {{b1}}('month', cohort_month, activity_month) AS month_number,
    COUNT(DISTINCT customer_id) AS active_users,
    SUM(net_mrr_usd) AS cohort_mrr
  FROM gold.cohort_monthly_ledger
  GROUP BY cohort_month, month_number
)
SELECT
  cohort_month,
  month_number,
  active_users,
  ROUND(
    100.0 * active_users / {{b2}}(active_users) OVER (
      PARTITION BY {{b3}} ORDER BY month_number
    ),
    1
  ) AS logo_retention_pct,
  ROUND(
    100.0 * cohort_mrr / FIRST_VALUE(cohort_mrr) OVER (
      PARTITION BY cohort_month ORDER BY month_number
    ),
    1
  ) AS nrr_pct
FROM cohort_base
ORDER BY cohort_month, month_number;`,
      blanks: [
        {
          id: 'b1',
          placeholder: 'Función de diferencia de fechas',
          acceptedAnswers: ['DATE_DIFF', 'DATEDIFF'],
          hint: 'Necesitas calcular cuántos meses han transcurrido entre `cohort_month` y `activity_month`.',
        },
        {
          id: 'b2',
          placeholder: 'Función de ventana para el valor inicial M0',
          acceptedAnswers: ['FIRST_VALUE'],
          hint: 'Al ordenar por `month_number` ascendente, el primer valor de la ventana corresponde exactamente al Mes 0.',
        },
        {
          id: 'b3',
          placeholder: 'Columna de partición de la cohorte',
          acceptedAnswers: ['cohort_month'],
          hint: 'Cada cohorte debe dividirse por su propio tamaño inicial en `M0`, sin mezclar meses de adquisición distintos.',
        },
      ],
      expectedOutputTable: [
        {
          cohort_month: '2026-08-01',
          month_number: 0,
          active_users: 500,
          logo_retention_pct: '100.0',
          nrr_pct: '100.0',
        },
        {
          cohort_month: '2026-08-01',
          month_number: 1,
          active_users: 410,
          logo_retention_pct: '82.0',
          nrr_pct: '98.5',
        },
        {
          cohort_month: '2026-08-01',
          month_number: 2,
          active_users: 380,
          logo_retention_pct: '76.0',
          nrr_pct: '112.4',
        },
      ],
      rubricCriteria: [
        'Calcula la edad relativa de la cohorte (`month_number`) con `DATE_DIFF` respecto al mes de alta inmutable.',
        'Ancla el denominador al tamaño original de la cohorte en M0 mediante `FIRST_VALUE(...) OVER (PARTITION BY cohort_month ORDER BY month_number)`.',
        'Separa la retención de clientes (`active_users`) de la retención neta de ingresos (`cohort_mrr`).',
      ],
    },
    pipelineChallenge: {
      title: 'Economía unitaria y matriz de cohortes',
      scenario:
        'Ordena los pasos entre Ingeniería (DE), Análisis (DA) y BI para construir un sistema de retención de cohortes y LTV/CAC libre de sesgo de supervivencia y de falsos ceros en meses futuros.',
      steps: [
        {
          id: 'step-1',
          label: '1. Materializar la fecha fundacional inmutable y el calendario mensual',
          role: 'DE',
          detail: 'Persistir `first_paid_month` en `dim_customer` y cruzar con un calendario mensual acotado hasta la fecha actual de corte (`CURRENT_DATE`).',
        },
        {
          id: 'step-2',
          label: '2. Consolidar ingresos recurrentes netos y costos directos en silver',
          role: 'DE',
          detail: 'Unir facturación neta de reembolsos con costos de servidor y pasarela para exponer el margen bruto real por usuario y mes.',
        },
        {
          id: 'step-3',
          label: '3. Modelar matrices de retención, supervivencia y LTV acumulado en gold',
          role: 'DA',
          detail: 'Calcular `logo_retention_pct`, `nrr_pct` y el LTV de margen acumulado con funciones de ventana, manteniendo `NULL` en períodos futuros censurados.',
        },
        {
          id: 'step-4',
          label: '4. Publicar el mapa triangular y recuperación de CAC en BI',
          role: 'BI',
          detail: 'Exponer la matriz triangular con formato condicional y el indicador de meses de recuperación del CAC por cohorte y canal.',
        },
      ],
      explanation:
        'Cuando DE fija el mes de alta inmutable y acota el Date Spine al presente, DA calcula la retención y el margen acumulado respetando la censura por la derecha, y BI presenta la matriz triangular sin promediar meses futuros inexistentes.',
    },
    checkpoint: {
      question:
        'Al construir una tabla de retención de cohortes en producción, un analista rellena con `0%` los meses `M3`, `M4` y `M5` de la cohorte adquirida en septiembre de 2026 (que solo lleva 1 mes de vida) y luego calcula el promedio de retención `M3` de todo el año. ¿Qué error estadístico acaba de cometer?',
      options: [
        {
          id: 'a',
          text: 'Ignoró la censura por la derecha (Right-Censoring): trató períodos futuros que la cohorte de septiembre aún no ha vivido como si el 100% de sus usuarios hubieran cancelado, desplomando artificialmente el promedio de M3.',
          correct: true,
          feedback:
            'Exacto. Una cohorte nacida hace 1 mes está censurada por la derecha a partir de M2: aún no ha llegado al tercer mes. Esas celdas deben ser `NULL` (nunca `0%`) para que `AVG()` solo promedie cohortes que realmente cumplieron 3 meses de antigüedad.',
        },
        {
          id: 'b',
          text: 'Ninguno; en SQL siempre hay que reemplazar todos los `NULL` por `0` en cualquier tabla.',
          correct: false,
          feedback:
            'Reemplazar un `NULL` que significa "evento futuro aún no observado" por `0` destruye la media estadística de las columnas derechas de la matriz triangular.',
        },
        {
          id: 'c',
          text: 'Debería haber rellenado los meses futuros con `100%` en lugar de `0%`.',
          correct: false,
          feedback:
            'Rellenar con `100%` inflaría falsamente la retención; la única representación matemáticamente honesta de un período futuro no transcurrido es `NULL`.',
        },
      ],
    },
  },
  {
    id: 'l14-ab-testing-cuped',
    stageId: 'stage-5',
    order: 14,
    title: 'Pruebas A/B, diagnóstico SRM y ajuste CUPED',
    subtitle: 'Control de sesgos de asignación y uso de covariables previas para reducir la varianza experimental.',
    duration: '35 min',
    level: 'Avanzado',
    bloomLevel: 'evaluate',
    coreFocus: ['DA', 'DE', 'BI'],
    goal: 'Auditar la validez de un test A/B mediante Sample Ratio Mismatch (SRM), evitar falsos positivos por Peeking, proteger métricas guardia y aplicar reducción de varianza CUPED en SQL.',
    visualType: 'ab-test-cuped-simulator',
    storyContext:
      'Caso real en NovaPay Checkout: El equipo de Producto lanza un nuevo flujo de pago con un clic (Variante B) asignando 50% de tráfico a Control y 50% a Tratamiento. Al tercer día ven que el ingreso medio en B es $25.20 vs. $24.10 en A y piden lanzarlo al 100% inmediatamente. Antes de aprobarlo, ejecutas dos diagnósticos: 1) Verificas si hay Sample Ratio Mismatch (SRM) y 2) Calculas el intervalo de confianza al 95% aplicando ajuste de varianza CUPED con los datos de los 14 días previos al experimento.',
    sections: [
      {
        heading: 'Verificación previa al análisis: prueba chi-cuadrado para Sample Ratio Mismatch',
        body: 'Antes de mirar si la conversión o los ingresos subieron, debes auditar si el tráfico se repartió exactamente como fue diseñado. Si configuraste una división **50% / 50%** sobre `100,000` usuarios expuestos, la fluctuación normal del azar permite ver `50,150` vs. `49,850`. Pero si observas `51,850` en Control y `48,150` en Tratamiento, una prueba Chi-cuadrado de bondad de ajuste arrojará un valor `p < 0.0001`.\nEso se denomina **Sample Ratio Mismatch (SRM)** y significa que existe un fallo técnico grave que invalida el experimento: por ejemplo, el nuevo código de la Variante B crashea en teléfonos Android antiguos antes de disparar el evento de exposición, o una redirección lenta hace que los usuarios impacientes cierren la pestaña. Como los usuarios que se pierden en B no son aleatorios, cualquier comparación de métricas está irremediablemente sesgada. **Regla de oro: si hay SRM (`p_srm < 0.001`), se descarta el análisis y DE corrige la instrumentación.**',
      },
      {
        heading: 'Potencia estadística, efecto mínimo detectable y error por inspección prematura',
        body: 'Diseñar un experimento requiere fijar de antemano tres parámetros:\n1) Nivel de significancia (`α = 0.05`, probabilidad máxima de Falso Positivo o Error Tipo I).\n2) Potencia estadística (`1 - β = 0.80`, probabilidad de detectar un efecto real si existe, evitando el Error Tipo II).\n3) Efecto Mínimo Detectable (`MDE`, el cambio más pequeño que vale la pena para el negocio, ej. `+0.4%` en conversión).\nEl error más destructivo en equipos sin disciplina estadística es el **Peeking** (mirar el p-valor todos los días y detener el test en cuanto cruza `p < 0.05`). Con un test frecuentista de horizonte fijo, revisar diariamente durante 14 días infla tu tasa de falsos positivos del **5% a más del 26%**. Si necesitas monitorear resultados continuamente para abortar caídas graves, debes utilizar **Tests Secuenciales Siempre Válidos (mSPRT)** con fronteras ajustadas.',
      },
      {
        heading: 'Reducción de varianza mediante covariables preexperimentales (CUPED)',
        body: 'En métricas continuas como `ingreso_por_usuario`, la varianza natural entre usuarios (clientes que gastan $500 vs. usuarios que gastan $5) es enorme y ensancha el Intervalo de Confianza, obligándote a esperar semanas para acumular millones de usuarios.\n**CUPED (Controlled-experiment Using Pre-Experiment Data)** aprovecha un hecho brillante: el gasto de un usuario en los **14 días previos al experimento (`X_pre`)** está fuertemente correlacionado con su gasto durante el experimento (`Y`), pero es **100% independiente del tratamiento** porque ocurrió antes de la asignación.\nCalculamos la métrica ajustada para cada usuario:\n`Y_cuped = Y - θ * (X_pre - media_global(X_pre))`, donde `θ = Cov(Y, X_pre) / Var(X_pre)`.\nComo `media(X_pre)` es estadísticamente idéntica en Control y Tratamiento gracias a la aleatorización, el estimador del efecto (`Lift`) permanece **completamente insesgado**, pero su varianza se reduce en una proporción `1 - r²` (donde `r` es la correlación entre `X_pre` e `Y`). Con `r = 0.75`, CUPED reduce la varianza un **56%**, lo que equivale a **más que duplicar el tráfico de tu empresa gratis**.',
      },
      {
        heading: 'Métricas de control, efecto novedad y linealización de razones',
        body: 'Ningún experimento se aprueba mirando una sola métrica aislada. Si un botón gigante aumenta los clics un `+4%` (Métrica Primaria / OEC), pero aumenta los reembolsos o la latencia del servidor un `+30%`, el cambio destruye valor. Por eso definimos **Métricas Guardia (Guardrails)**: latencia p95, tasa de errores, cancelaciones y tickets de soporte que no deben deteriorarse.\nAdemás, cuando la métrica es un ratio donde la unidad de aleatorización es el `usuario` pero el denominador son las `sesiones` (ej. ingreso por sesión), las sesiones de un mismo usuario no son independientes: DE y DA deben agregar primero a nivel de `user_id` o aplicar el **Método Delta / Linearización** para no subestimar el error estándar.',
      },
    ],
    triadPerspectives: {
      DE: {
        title: 'Qué construye y garantiza ingeniería (DE)',
        points: [
          'Implementa asignación determinista sin estado mediante hashing rápido (`MurmurHash3(user_id || experiment_salt) % 10000`) para que el usuario vea siempre la misma variante en web y móvil.',
          'Registra el evento inmutable de primera exposición (`first_exposed_at`) y construye un pipeline automatizado que congela las covariables pre-experimento (`pre_14d_revenue`, `pre_14d_sessions`) estrictamente antes de ese milisegundo.',
          'Ejecuta un detector automático de Sample Ratio Mismatch (Chi-Square SRM check) cada hora y alerta al canal de ingeniería si el p-valor de proporción cae por debajo de `0.001`.',
        ],
      },
      DA: {
        title: 'Qué diseña y evalúa análisis (DA)',
        points: [
          'Calcula el tamaño muestral requerido según la varianza histórica y el MDE antes de encender el experimento.',
          'Aplica el ajuste CUPED (`Y - θ(X - μ_X)`), calcula intervalos de confianza al 95% y aplica correcciones de pruebas múltiples (Benjamini-Hochberg / Holm) cuando hay varias ramas.',
          'Audita efectos heterogéneos por segmento (nuevos vs. recurrentes, iOS vs. Android) para descartar efectos de novedad o regresiones ocultas.',
        ],
      },
      BI: {
        title: 'Qué gobierna y presenta BI',
        points: [
          'Diseña el Scorecard Oficial de Experimentación mostrando siempre el Intervalo de Confianza al 95% (`[LI, LS]`) en lugar de porcentajes puntuales engañosos.',
          'Bloquea visualmente las conclusiones en el dashboard si el experimento aún no ha alcanzado el tamaño muestral comprometido o si la alerta de SRM está activa.',
          'Presenta las Métricas Primarias junto al panel semafórico de Métricas Guardia (latencia, reembolsos, churn) para decisiones ejecutivas Go / No-Go.',
        ],
      },
    },
    relatedLessons: [
      {
        id: 'l6-metrics-simpson',
        reason: 'Si un experimento no está estratificado o sufre SRM en un dispositivo, la Paradoja de Simpson puede invertir el ganador aparente.',
      },
      {
        id: 'l13-cohorts-retention-ltv',
        reason: 'Las pruebas A/B sobre onboarding y precios se evalúan midiendo el impacto causal sobre las curvas de retención M1/M3 de la cohorte expuesta.',
      },
      {
        id: 'l15-bi-tufte-code',
        reason: 'Aprende a representar intervalos de confianza, metas y métricas guardia con máxima claridad visual sin ruido gráfico.',
      },
    ],
    playground: {
      description: 'Compara el análisis ingenuo de un test A/B (que ignora SRM, error estándar y varianza pre-existente) frente al pipeline SQL con ajuste CUPED:',
      badQueryLabel: 'Antipatrón: comparar promedios crudos con inspección temprana',
      badQuery: `-- PELIGROSO:
-- 1) No revisa si los tamaños muestrales sufren Sample Ratio Mismatch (SRM)
-- 2) No calcula el Error Estándar ni el Intervalo de Confianza al 95%
-- 3) No ajusta por la varianza pre-experimento (ballenas desbalanceadas entre ramas)
SELECT
  variant,
  AVG(post_revenue_usd) AS ingreso_promedio_crudo
FROM exp_checkout_users
GROUP BY variant;`,
      badResult: [
        {
          variant: 'Control (A)',
          ingreso_promedio_crudo: '$24.10 (Sin intervalo de confianza ni validación SRM)',
        },
        {
          variant: 'Tratamiento (B)',
          ingreso_promedio_crudo: '$25.20 (Peligro. Sin CUPED el IC 95% es [-$0.18, +$1.72], cruza cero)',
        },
      ],
      goodQueryLabel: 'Solución óptima: auditoría de muestra y ajuste CUPED en SQL',
      goodQuery: `WITH cuped_theta AS (
  SELECT
    COVAR_SAMP(post_revenue_usd, pre_revenue_14d_usd)
      / NULLIF(VAR_SAMP(pre_revenue_14d_usd), 0) AS theta,
    AVG(pre_revenue_14d_usd) AS mean_pre_global
  FROM exp_checkout_users
),
user_adjusted AS (
  SELECT
    u.variant,
    u.post_revenue_usd AS y_raw,
    u.post_revenue_usd - t.theta * (u.pre_revenue_14d_usd - t.mean_pre_global) AS y_cuped
  FROM exp_checkout_users u
  CROSS JOIN cuped_theta t
)
SELECT
  variant,
  COUNT(*) AS n_exposed_users,
  ROUND(AVG(y_cuped), 2) AS mean_cuped_usd,
  ROUND(STDDEV_SAMP(y_raw) / SQRT(COUNT(*)), 3) AS se_raw_usd,
  ROUND(STDDEV_SAMP(y_cuped) / SQRT(COUNT(*)), 3) AS se_cuped_usd
FROM user_adjusted
GROUP BY variant
ORDER BY variant;`,
      goodResult: [
        {
          variant: 'Control (A)',
          n_exposed_users: '50,042 (SRM p = 0.79 OK)',
          mean_cuped_usd: '$24.35',
          se_raw_usd: '±$0.480',
          se_cuped_usd: '±$0.265 (-45% Error Estándar)',
        },
        {
          variant: 'Tratamiento (B)',
          n_exposed_users: '49,958 (SRM p = 0.79 OK)',
          mean_cuped_usd: '$25.12 (+$0.77 Lift)',
          se_raw_usd: '±$0.492',
          se_cuped_usd: '±$0.270 (IC 95%: [+$0.24, +$1.30] · p = 0.004)',
        },
      ],
    },
    codeChallenge: {
      title: 'Reducción de varianza experimental con CUPED',
      instruction:
        'Completa la consulta para calcular el coeficiente óptimo `theta` (covarianza muestral entre post y pre dividida por la varianza pre), aplicar la fórmula de ajuste `y_cuped` por usuario y obtener el error estándar reducido por cada variante.',
      templateCode: `WITH stats_global AS (
  SELECT
    {{b1}}(post_revenue_usd, pre_revenue_14d_usd)
      / NULLIF(VAR_SAMP(pre_revenue_14d_usd), 0) AS theta,
    AVG(pre_revenue_14d_usd) AS mean_pre
  FROM exp_checkout_users
),
cuped_users AS (
  SELECT
    u.variant,
    u.post_revenue_usd - s.theta * (u.{{b2}} - s.mean_pre) AS y_cuped
  FROM exp_checkout_users u
  CROSS JOIN stats_global s
)
SELECT
  variant,
  COUNT(*) AS usuarios,
  ROUND(AVG(y_cuped), 2) AS media_ajustada_usd,
  ROUND(STDDEV_SAMP(y_cuped) / {{b3}}(COUNT(*)), 3) AS error_estandar_cuped
FROM cuped_users
GROUP BY variant;`,
      blanks: [
        {
          id: 'b1',
          placeholder: 'Función de covarianza muestral',
          acceptedAnswers: ['COVAR_SAMP', 'COVAR_POP'],
          hint: 'El numerador de `theta` en CUPED es la covarianza entre la métrica post-experimento y la covariable pre-experimento.',
        },
        {
          id: 'b2',
          placeholder: 'Columna de la covariable pre-experimento',
          acceptedAnswers: ['pre_revenue_14d_usd'],
          hint: 'Debes centrar la covariable individual de los 14 días previos restándole la media global `s.mean_pre`.',
        },
        {
          id: 'b3',
          placeholder: 'Raíz cuadrada del tamaño muestral',
          acceptedAnswers: ['SQRT'],
          hint: 'El Error Estándar de la media es la desviación estándar dividida entre la raíz cuadrada de `N` (`SQRT(COUNT(*))`).',
        },
      ],
      expectedOutputTable: [
        {
          variant: 'Control (A)',
          usuarios: 50042,
          media_ajustada_usd: '$24.35',
          error_estandar_cuped: '0.265',
        },
        {
          variant: 'Tratamiento (B)',
          usuarios: 49958,
          media_ajustada_usd: '$25.12',
          error_estandar_cuped: '0.270',
        },
      ],
      rubricCriteria: [
        'Estima `theta` globalmente como `COVAR_SAMP(Y, X_pre) / VAR_SAMP(X_pre)`.',
        'Garantiza que la covariable `pre_revenue_14d_usd` provenga de una ventana estrictamente anterior a la primera exposición al experimento.',
        'Calcula el Error Estándar dividiendo `STDDEV_SAMP(y_cuped)` entre `SQRT(COUNT(*))`.',
      ],
    },
    pipelineChallenge: {
      title: 'Flujo de experimentación A/B con CUPED',
      scenario:
        'Ordena la secuencia correcta de pasos técnicos y estadísticos entre DE, DA y BI para ejecutar y evaluar un experimento A/B sin sesgos post-tratamiento ni falsos positivos.',
      steps: [
        {
          id: 'step-1',
          label: '1. Asignación determinista con MurmurHash3 y congelamiento de covariables preexperimento',
          role: 'DE',
          detail: 'Asignar variantes sin estado con `hash(user_id + salt)` y guardar la foto inmutable de métricas de los 14 días previos al primer evento de exposición.',
        },
        {
          id: 'step-2',
          label: '2. Auditoría automática de proporción muestral (SRM chi-cuadrado)',
          role: 'DE',
          detail: 'Verificar que la proporción real de usuarios expuestos en Control vs. Tratamiento no se desvíe significativamente del 50/50 esperado (`p_srm >= 0.001`).',
        },
        {
          id: 'step-3',
          label: '3. Reducción de varianza CUPED y evaluación de intervalos de confianza',
          role: 'DA',
          detail: 'Aplicar `Y_cuped = Y - θ(X_pre - μ_X)` una vez alcanzado el tamaño muestral y evaluar significancia en la métrica primaria y en los Guardrails.',
        },
        {
          id: 'step-4',
          label: '4. Publicación en el tablero de experimentación para decisión ejecutiva',
          role: 'BI',
          detail: 'Exponer el Lift ajustado con su barra de Intervalo de Confianza al 95%, el estado verde de SRM y el cumplimiento de todas las métricas guardia.',
        },
      ],
      explanation:
        'Si se salta el congelamiento pre-exposición o el chequeo de SRM antes de calcular el Lift, se corre el riesgo de aprobar cambios rotos técnicamente o sesgados por variables afectadas por el propio tratamiento.',
    },
    checkpoint: {
      question:
        'Lanzas un experimento A/B con asignación teórica 50% Control / 50% Tratamiento sobre 200,000 usuarios. Al revisar la tabla de exposiciones observas 103,400 usuarios en Control (51.7%) y 96,600 en Tratamiento (48.3%), con un p-valor de SRM de `0.000001`. Sin embargo, la conversión de los usuarios en Tratamiento parece un +6% mayor. ¿Qué decisión debes tomar?',
      options: [
        {
          id: 'a',
          text: 'Declarar el experimento inválido de inmediato por Sample Ratio Mismatch (SRM) y pedir a Ingeniería (DE) investigar qué bug técnico está perdiendo el 3.4% de los usuarios en Tratamiento antes de mirar cualquier métrica de conversión.',
          correct: true,
          feedback:
            'Exacto. Un SRM severo demuestra que faltan miles de usuarios en una rama de forma no aleatoria (por ejemplo, usuarios con conexiones lentas donde el nuevo código falló al cargar). Como solo sobrevivieron los usuarios con mejores dispositivos en Tratamiento, el +6% de conversión es un espejismo por sesgo de supervivencia.',
        },
        {
          id: 'b',
          text: 'Lanzar la variante de Tratamiento a producción porque +6% es un aumento muy grande y 96,600 usuarios ya son suficientes.',
          correct: false,
          feedback:
            'Cuando hay SRM, los dos grupos dejaron de ser comparables. Tener muchos usuarios no corrige un sesgo de selección en la asignación.',
        },
        {
          id: 'c',
          text: 'Borrar al azar 6,800 usuarios del grupo Control en SQL para que ambos grupos queden en 96,600 y dar por válido el experimento.',
          correct: false,
          feedback:
            'Borrar usuarios aleatorios de Control no recupera a los usuarios específicos (ej. móviles lentos o un navegador concreto) que se perdieron sistemáticamente en Tratamiento.',
        },
      ],
    },
  },
  {
    id: 'l15-bi-tufte-code',
    stageId: 'stage-5',
    order: 15,
    title: 'Percepción visual y reportes como código',
    subtitle: 'Jerarquía gráfica de Cleveland y Tufte combinada con tableros declarativos versionados en Git.',
    duration: '30 min',
    level: 'Avanzado',
    bloomLevel: 'create',
    coreFocus: ['BI', 'DA', 'DE'],
    goal: 'Diseñar tableros ejecutivos basados en la relación Dato-Tinta de Tufte y Stephen Few, estructurar narrativas con la Pirámide de Minto y construir reportes reproducibles mediante BI-as-Code.',
    visualType: 'bi-anti-slop-comparator',
    storyContext:
      'Caso real en el Comité Ejecutivo de Actual: El equipo de datos invirtió tres meses construyendo un Lakehouse impecable sobre Apache Iceberg v3, pero el dashboard que ve el Comité Directivo tiene 7 gráficos de pastel en 3D, velocímetros gigantes que ocupan media pantalla para mostrar un único número sin historia, 14 colores neón y títulos pasivos como "Gráfico de Ingresos por País". Además, cuando alguien edita una métrica en el dashboard, nadie sabe quién la cambió ni por qué contradice el repositorio dbt. Es hora de rediseñar la última milla con ciencia perceptual y BI-as-Code.',
    sections: [
      {
        heading: 'Jerarquía de precisión perceptual según Cleveland y McGill',
        body: 'El sistema visual humano no procesa todas las formas geométricas con la misma exactitud. Los experimentos psicofísicos de William Cleveland y Robert McGill demostraron un orden estricto de precisión al comparar magnitudes cuantitativas:\n1) **Posición a lo largo de una escala común alineada** (gráficos de barras horizontales, puntos en un eje común): máxima precisión.\n2) **Longitud no alineada y pendiente** (barras apiladas, gráficos de líneas).\n3) **Área y Volumen** (gráficos de burbujas, treemaps): el ojo humano subestima sistemáticamente las diferencias de área.\n4) **Ángulo, Curvatura y Saturación de color** (gráficos de pastel, donas, velocímetros radiales): mínima precisión.\nCuando usas un gráfico de pastel con 6 regiones (`19%, 18%, 17%, 16%...`), obligas al cerebro del ejecutivo a resolver geometría angular para la cual es torpe; una tabla ordenada con barras integradas o un **Bullet Graph** de Stephen Few transmite el ranking, el valor exacto y la distancia contra la meta en menos de 400 milisegundos.',
      },
      {
        heading: 'Razón dato-tinta de Tufte, múltiplos pequeños y uso restringido del color',
        body: 'Edward Tufte formuló en *The Visual Display of Quantitative Information* la ley central del diseño analítico: **Maximizar la Relación Dato-Tinta (Data-Ink Ratio)** eliminando toda tinta que no represente información nueva (*Chartjunk*).\n- **Poda el ruido visual**: elimina bordes dobles, fondos oscuros decorativos, efectos 3D, rejillas gruesas y leyendas flotantes que obligan al ojo a viajar de un extremo al otro (*eye-ping-pong*). Etiqueta las líneas directamente al final de su serie.\n- **Rompe el "gráfico saturado" con Small Multiples**: si tienes que comparar la tendencia temporal de 8 países o 10 productos, nunca superpongas 10 líneas de colores en un solo eje. Crea una cuadrícula de pequeños gráficos idénticos (**Small Multiples**) o una tabla de alta densidad con **Sparklines**, donde cada fila tiene su propia pista limpia.\n- **Usa el color como señal de excepción, no como decoración**: pinta el histórico, el plan y las categorías normales en tonos neutros/grises serenos, y reserva el color saturado (rojo diagnóstico o esmeralda) exclusivamente para los puntos que rompen el umbral y requieren decisión.',
      },
      {
        heading: 'Estructura piramidal de Minto y comparación contra referencias explícitas',
        body: 'Un número aislado en una tarjeta (`"$1.54M"`) es mudo: el director general inmediatamente preguntará *"¿Eso es bueno o malo? ¿Cómo íbamos el mes pasado? ¿Cuál era el presupuesto?"*.\nTodo indicador ejecutivo bien diseñado incluye su **Tríada de Contexto**:\n1) El valor real observado (`$1.54M`).\n2) La comparación contra la Meta / Plan (`+$120K / +8.4% vs. Plan`) y contra el período anterior ajustado por estacionalidad (`+14.2% YoY`).\n3) Un **Título Activo (Principio de la Pirámide de Bárbara Minto)**: empieza siempre por la conclusión gobernante. Sustituye el título pasivo *"Ventas por Región Q3"* por *"LATAM y EMEA superaron el plan en +$180K (+14.2%), compensando la desaceleración de NORAM (-9.3%)"*.',
      },
      {
        heading: 'Reportes declarativos versionados en Git con Evidence, Observable Framework y Rill',
        body: 'El talón de Aquiles del BI tradicional de clic-y-arrastrar (Point-and-Click BI) es que la lógica visual y los filtros terminan encerrados en archivos binarios opacos fuera del control de versiones. Si Ingeniería de Datos renombra una columna en dbt/SQLMesh, nadie se entera de que el dashboard del CEO se rompió hasta el lunes a las 8:00 AM.\nCon **BI-as-Code** (herramientas como **Evidence.dev, Observable Framework y Rill**), los reportes ejecutivos se escriben en archivos `.md` o `.js` que combinan narrativa Markdown, bloques SQL parametrizados contra la Capa Semántica y componentes visuales declarativos (`<DataTable>`, `<BarChart>`, `<BulletChart>`) potenciados en el navegador por **DuckDB-Wasm**.\nEsto desbloquea tres superpoderes:\n1) **Gobernanza en Git y Pull Requests**: un cambio en un reporte se revisa en el mismo PR que el modelo SQL.\n2) **Continuous Integration (CI) para BI**: el pipeline de GitHub Actions compila todas las consultas del reporte en cada commit; si falta una columna o falla un contrato, el despliegue se bloquea automáticamente.\n3) **Interactividad sub-50ms**: DuckDB-Wasm filtra cubos Parquet pre-compilados directamente en la memoria del navegador del usuario sin latencia de red ni costos por consulta en el Data Warehouse.',
      },
    ],
    triadPerspectives: {
      DE: {
        title: 'Qué construye y automatiza ingeniería (DE)',
        points: [
          'Integra el paso `npm run build:reports` del proyecto BI-as-Code dentro del pipeline CI/CD de dbt/SQLMesh para garantizar cero dashboards rotos tras cambios de esquema.',
          'Materializa extractos Parquet compactos y ordenados desde la capa Gold para que DuckDB-Wasm los sirva desde CDN con latencia inferior a 50ms.',
          'Audita que ningún reporte ejecute consultas pesadas directas contra tablas Bronze/Silver saltándose la Capa Semántica.',
        ],
      },
      DA: {
        title: 'Qué aporta y contextualiza análisis (DA)',
        points: [
          'Enriquece las tablas ejecutivas con bandas de variación esperada (intervalos de confianza o desviaciones estándar) para evitar que la dirección sobrerreaccione al ruido normal.',
          'Escribe documentos analíticos reproducibles (Data Memos en Evidence / Marimo) donde el texto explicativo se alimenta dinámicamente de variables SQL en vivo.',
          'Descompone las variaciones contra el Plan en efectos de volumen, precio y mix antes de presentarlas en el comité.',
        ],
      },
      BI: {
        title: 'Qué diseña y lidera BI',
        points: [
          'Reemplaza gráficos circulares, donas y velocímetros por tablas de alta densidad con barras integradas, Bullet Graphs y Small Multiples.',
          'Aplica títulos activos basados en la Pirámide de Minto y reserva el color semántico exclusivamente para desvíos accionables.',
          'Versiona los dashboards y árboles de KPIs en Git mediante BI-as-Code conectado a las métricas certificadas de MetricFlow / Cube.',
        ],
      },
    },
    relatedLessons: [
      {
        id: 'l12-contracts-semantic-layer',
        reason: 'Los reportes BI-as-Code consumen las métricas certificadas de la Capa Semántica para garantizar que Finanzas y Marketing vean exactamente la misma cifra.',
      },
      {
        id: 'l9-duckdb-polars-marimo',
        reason: 'Las plataformas modernas de BI-as-Code utilizan DuckDB-Wasm y archivos Parquet columnares para lograr filtrado instantáneo en el navegador.',
      },
      {
        id: 'l18-mcp-semantic-ai-rag',
        reason: 'Tanto tu dashboard BI-as-Code como los Agentes IA vía MCP leen el mismo catálogo semántico gobernado.',
      },
    ],
    playground: {
      description: 'Compara un flujo manual frágil con gráficos circulares de baja señal frente a un reporte declarativo BI-as-Code con alta densidad Dato-Tinta:',
      badQueryLabel: 'Antipatrón: exportación CSV manual y gráfico de pastel 3D sin meta',
      badQuery: `# FLUJO MANUAL FRÁGIL Y CON CHARTJUNK:
# 1) Descargar manualmente "ventas_octubre_v4_final_2.csv" cada lunes a las 7am
# 2) Pegar en hoja de cálculo local sin tests ni control de versiones Git
# 3) Insertar Gráfico de Pastel 3D con 8 regiones y colores arcoíris
# 4) Título pasivo: "Gráfico de Ventas" (sin mostrar Meta/Plan ni variación YoY)`,
      badResult: [
        {
          claridad_perceptual: 'Baja (El ojo no distingue ángulos de 16% vs 18% en un pastel 3D)',
          contexto_ejecutivo: 'Nulo (Muestra $640K sin decir si la meta era $500K o $800K)',
          gobernanza_git: '0% (Archivo local desconectado de dbt/SQLMesh)',
        },
      ],
      goodQueryLabel: 'Solución óptima: reportes como código en Git y tabla de alta densidad',
      goodQuery: `# Reporte mensual del comité ejecutivo (Evidence.dev / BI-as-Code en Git)
## LATAM y EMEA superaron el plan de octubre en +$130K (+12.7%), compensando a NORAM

\`\`\`sql regional_performance
SELECT
  region,
  SUM(net_revenue_usd) AS actual_rev_usd,
  SUM(plan_revenue_usd) AS plan_rev_usd,
  ROUND(100.0 * (SUM(net_revenue_usd) - SUM(plan_revenue_usd)) / NULLIF(SUM(plan_revenue_usd), 0), 1) AS vs_plan_pct,
  ROUND(100.0 * (SUM(net_revenue_usd) - SUM(prev_year_revenue_usd)) / NULLIF(SUM(prev_year_revenue_usd), 0), 1) AS yoy_pct
FROM gold.fct_regional_revenue
WHERE fiscal_month = '2026-10-01'
GROUP BY region
ORDER BY actual_rev_usd DESC;
\`\`\`

<DataTable data={regional_performance} rows=all>
  <Column id=region title="Región" />
  <Column id=actual_rev_usd title="Ingreso Neto Real" fmt=usd0 contentType=bar barColor=#cbd5e1 />
  <Column id=plan_rev_usd title="Meta (Plan)" fmt=usd0 />
  <Column id=vs_plan_pct title="vs. Plan (%)" fmt=pct1 contentType=delta />
  <Column id=yoy_pct title="Crecimiento YoY" fmt=pct1 contentType=delta />
</DataTable>`,
      goodResult: [
        {
          region: 'LATAM',
          actual_rev_usd: '$640,000',
          plan_rev_usd: '$540,000',
          vs_plan_pct: '+18.5% (Supera Plan)',
          yoy_pct: '+24.1%',
        },
        {
          region: 'EMEA',
          actual_rev_usd: '$510,000',
          plan_rev_usd: '$480,000',
          vs_plan_pct: '+6.3% (Supera Plan)',
          yoy_pct: '+11.8%',
        },
        {
          region: 'NORAM',
          actual_rev_usd: '$390,000',
          plan_rev_usd: '$430,000',
          vs_plan_pct: '-9.3% (Requiere Acción)',
          yoy_pct: '+2.4%',
        },
      ],
    },
    codeChallenge: {
      title: 'Bloque declarativo con contexto frente a meta',
      instruction:
        'Completa el bloque declarativo de BI-as-Code (SQL + componente `<DataTable>`) para calcular la desviación porcentual contra la meta (`vs_plan_pct`), ordenar las regiones de mayor a menor ingreso real y renderizar la variación con formato semántico `delta`.',
      templateCode: `\`\`\`sql kpi_regional
SELECT
  region,
  SUM(net_revenue_usd) AS actual_rev_usd,
  SUM(plan_revenue_usd) AS plan_rev_usd,
  ROUND(
    100.0 * (SUM(net_revenue_usd) - SUM(plan_revenue_usd))
      / {{b1}}(SUM(plan_revenue_usd), 0),
    1
  ) AS vs_plan_pct
FROM gold.fct_regional_revenue
WHERE fiscal_month = '2026-10-01'
GROUP BY region
{{b2}} actual_rev_usd DESC;
\`\`\`

<DataTable data={kpi_regional}>
  <Column id=region title="Región" />
  <Column id=actual_rev_usd title="Ingreso Real" fmt=usd0 contentType=bar />
  <Column id=plan_rev_usd title="Meta (Plan)" fmt=usd0 />
  <Column id=vs_plan_pct title="vs. Plan (%)" fmt=pct1 contentType={{b3}} />
</DataTable>`,
      blanks: [
        {
          id: 'b1',
          placeholder: 'Protección contra división por cero',
          acceptedAnswers: ['NULLIF'],
          hint: 'En SQL de producción, protege siempre el denominador de un porcentaje con `NULLIF(denominador, 0)`.',
        },
        {
          id: 'b2',
          placeholder: 'Cláusula de ordenamiento jerárquico',
          acceptedAnswers: ['ORDER BY'],
          hint: 'Una tabla ejecutiva nunca se deja en orden aleatorio; ordena de mayor a menor impacto con `ORDER BY`.',
        },
        {
          id: 'b3',
          placeholder: 'Tipo de contenido para variación +/-',
          acceptedAnswers: ['delta', '"delta"'],
          hint: 'En Evidence / BI-as-Code, el `contentType` que muestra flechas y color semántico positivo/negativo para desviaciones es `delta`.',
        },
      ],
      expectedOutputTable: [
        {
          region: 'LATAM',
          actual_rev_usd: '$640,000',
          plan_rev_usd: '$540,000',
          vs_plan_pct: '+18.5%',
        },
        {
          region: 'EMEA',
          actual_rev_usd: '$510,000',
          plan_rev_usd: '$480,000',
          vs_plan_pct: '+6.3%',
        },
        {
          region: 'NORAM',
          actual_rev_usd: '$390,000',
          plan_rev_usd: '$430,000',
          vs_plan_pct: '-9.3%',
        },
      ],
      rubricCriteria: [
        'Protege el cálculo del porcentaje contra el Plan usando `NULLIF(SUM(plan_revenue_usd), 0)`.',
        'Ordena explícitamente las categorías por magnitud (`ORDER BY actual_rev_usd DESC`) para facilitar el escaneo visual inmediato.',
        'Integra barras alineadas (`contentType=bar`) y deltas semánticos (`contentType=delta`) en lugar de gráficos circulares.',
      ],
    },
    pipelineChallenge: {
      title: 'Publicación de reportes declarativos como código',
      scenario:
        'Ordena el ciclo de vida moderno de un reporte ejecutivo cuando Ingeniería (DE), Análisis (DA) y BI trabajan bajo un flujo BI-as-Code versionado en Git.',
      steps: [
        {
          id: 'step-1',
          label: '1. Exponer la métrica y la meta en la capa semántica Gold',
          role: 'DE',
          detail: 'Materializar `gold.fct_regional_revenue` con tests de contrato y exponer las medidas certificadas de ingreso real y presupuesto.',
        },
        {
          id: 'step-2',
          label: '2. Incorporar bandas de varianza y descomposición analítica en SQL',
          role: 'DA',
          detail: 'Escribir la consulta parametrizada que calcula deltas YoY, cumplimiento vs. Plan y significancia de las desviaciones.',
        },
        {
          id: 'step-3',
          label: '3. Diseñar la vista con alta relación dato-tinta y título activo en Markdown',
          role: 'BI',
          detail: 'Estructurar el reporte con titular ejecutivo (Pirámide de Minto), Small Multiples y tablas con barras alineadas y color solo por excepción.',
        },
        {
          id: 'step-4',
          label: '4. Compilar consultas en CI/CD y publicar cubo Parquet a DuckDB-Wasm',
          role: 'DE',
          detail: 'Validar automáticamente en GitHub Actions que ninguna consulta SQL del reporte falle y desplegar los artefactos Parquet para lectura en <50ms.',
        },
      ],
      explanation:
        'BI-as-Code cierra la brecha entre ingeniería y negocio: las métricas nacen gobernadas en Gold, se contextualizan estadísticamente, se presentan siguiendo los principios visuales de Tufte/Few y se validan en CI/CD antes de llegar al comité.',
    },
    checkpoint: {
      question:
        'En la revisión trimestral tienes que mostrar en una sola pantalla: 1) la evolución semanal de ingresos de 9 líneas de producto durante las últimas 52 semanas y 2) cómo cerró cada línea en el trimestre respecto a su meta en dólares y porcentaje. Según los principios de Cleveland & McGill, Edward Tufte y Stephen Few, ¿qué diseño debes construir?',
      options: [
        {
          id: 'a',
          text: 'Una tabla ejecutiva ordenada de mayor a menor ingreso que integre por cada fila un Sparkline de las 52 semanas, una barra horizontal / Bullet Graph del ingreso real frente a la meta en tonos neutros, y una columna de variación % vs. Plan destacando en color únicamente las líneas fuera de umbral.',
          correct: true,
          feedback:
            'Exacto. Combinar una tabla estructurada con Sparklines (o una cuadrícula de Small Multiples) y Bullet Graphs aprovecha la comparación de longitudes alineadas, evita el caos de cruzar 9 líneas en un mismo eje y maximiza la relación Dato-Tinta.',
        },
        {
          id: 'b',
          text: 'Un único gráfico de líneas con las 9 series reales más las 9 líneas de meta (18 líneas superpuestas en total) con una leyenda de 18 colores a la derecha y un gráfico de dona 3D al lado.',
          correct: false,
          feedback:
            'Superponer 18 líneas crea un "gráfico saturado" ilegible donde el ojo no puede seguir ninguna serie individual, y la dona 3D distorsiona las proporciones.',
        },
        {
          id: 'c',
          text: 'Nueve velocímetros tipo tablero de automóvil a todo color que muestren solo el porcentaje final sin la serie semanal ni el monto en dólares.',
          correct: false,
          feedback:
            'Los velocímetros radiales tienen una pésima relación Dato-Tinta: desperdician el 80% de los píxeles de la pantalla para mostrar un único número y ocultan la tendencia de las 52 semanas y el volumen absoluto en dólares.',
        },
      ],
    },
  },
];
