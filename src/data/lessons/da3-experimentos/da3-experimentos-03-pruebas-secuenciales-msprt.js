export const lesson = {
  id: 'da3-experimentos-03-pruebas-secuenciales-msprt',
  v2Id: 'da3-experimentos-03-pruebas-secuenciales-msprt',
  moduleId: 'da3-experimentos',
  track: 'da',
  level: 3,
  order: 3,
  title: 'Pruebas secuenciales (mSPRT) y monitoreo continuo',
  subtitle: 'Pruebas secuenciales (mSPRT) y reglas de parada válidas para monitoreo continuo',
  minutes: 25,
  needsReview: false,
  prerequisites: [
    'da2-inferencia-04-hipotesis-t-welch-pvalor',
    'da2-inferencia-06-errores-potencia-tamano-muestra',
    'da3-experimentos-01-ab-testing-cuped',
  ],
  learningObjectives: [
    'Explicar por qué el monitoreo continuo con parada opcional (peeking) infla severamente el error Tipo I en pruebas de horizonte fijo.',
    'Calcular la razón de verosimilitud mezclada (mSPRT) y su valor p siempre válido sobre series acumuladas diarias en SQL.',
    'Construir secuencias de confianza uniformes en el tiempo para decidir cuándo detener un experimento con garantías estadísticas.',
  ],
  hook: 'En el primer día del experimento EXP-SUB-BUNDLE de Mercado Brisa (con apenas 82 usuarios), incluso la métrica pre-experimento muestra una diferencia de +13.35 USD con |z| = 2.112 > 1.96, pero al quinto día esa diferencia se desploma a -0.01 USD: ¿por qué mirar el tablero cada mañana y detener la prueba apenas cruza p < 0.05 fabrica falsos ganadores y cómo permite la prueba secuencial mSPRT monitorear en tiempo real sin inflar el error Tipo I?',
  objectives: [
    'Demostrar la inflación de falsos positivos causada por parada opcional (data peeking).',
    'Evaluar la razón de verosimilitud mezclada mSPRT y el umbral 1 / alfa en DuckDB.',
    'Comparar intervalos de horizonte fijo frente a secuencias de confianza siempre válidas.',
  ],
  sections: [
    {
      id: 'peeking-parada-opcional',
      heading: 'El pecado de mirar el tablero y detener antes: Data Peeking',
      body: `Una prueba $t$ de Welch o $z$ clásica es una prueba de **horizonte fijo**. Su garantía de cometer a lo sumo un $5\\%$ de falsos positivos ($\\alpha = 0.05$) exige fijar de antemano el tamaño muestral $N$ y consultar el estadístico **una única vez** al alcanzar $N$.

Sin embargo, en los tableros modernos de experimentación los equipos revisan las métricas acumuladas todos los días. Si aplicamos una regla de **parada opcional** (*data peeking*) que detiene el experimento el primer día $t$ en que $|Z_t| > 1.96$, la trayectoria acumulada se comporta como una caminata aleatoria browniana que tiene múltiples oportunidades de cruzar las bandas fijas por puro azar:

$$\\Pr\\!\\left(\\max_{1 \\le t \\le T} |Z_t| > 1.96 \\;\\middle|\\; H_0\\right) \\gg 0.05$$

Con $15$ revisiones diarias, la tasa real de falsos positivos supera el $22\\%$; si se inspecciona hora tras hora, rebasa el $40\\%$. En **Mercado Brisa**, al acumular día a día el gasto *pre-experimento* de \`EXP-SUB-BUNDLE\` (\`experiment_id = 3\`, donde el efecto real es cero), el día 1 ($n = 82$) arroja $|z| = 2.112$ y el día 2 ($n = 195$) arroja $|z| = 2.015$. Al día 5 ($n = 498$), la media regresa a $-0.01$ USD ($|z| = 0.006$). Detener la prueba el día 1 o 2 habría proclamado un efecto inexistente.`,
    },
    {
      id: 'msprt-razon-verosimilitud',
      heading: 'Prueba secuencial de razón de verosimilitud mezclada (mSPRT)',
      body: `Para permitir que los equipos monitoreen sus experimentos en cualquier momento sin inflar los falsos positivos, Ramesh Johari, Pete Koomen, Leonid Pekelis y David Walsh (2017) formularon la **prueba secuencial de razón de verosimilitud mezclada** (*Mixture Sequential Probability Ratio Test*, mSPRT).

En cada corte temporal $t$, sean $\\hat{\\Delta}_t = \\bar{Y}_{T,t} - \\bar{Y}_{C,t}$ la diferencia acumulada, $V_t = s_{C,t}^2 / n_{C,t} + s_{T,t}^2 / n_{T,t}$ la varianza muestral del estimador y $z_t = \\hat{\\Delta}_t / \\sqrt{V_t}$. En lugar de probar una única alternativa puntual, mSPRT integra la razón de verosimilitud sobre una distribución normal a priori de tamaños de efecto $\\Delta \\sim \\mathcal{N}(0, \\tau^2)$, obteniendo una expresión cerrada:

$$\\Lambda_t(\\tau^2) = \\sqrt{\\frac{V_t}{V_t + \\tau^2}}\\,\\exp\\!\\left(\\frac{z_t^2}{2}\\cdot\\frac{\\tau^2}{V_t + \\tau^2}\\right)$$

Bajo la hipótesis nula $H_0: \\Delta = 0$, el proceso $\\{\\Lambda_t\\}_{t \\ge 1}$ es una **martingala no negativa** con valor esperado $\\mathbb{E}[\\Lambda_t] = 1$. Por la desigualdad de Ville, la probabilidad de que $\\Lambda_t$ supere el umbral $1 / \\alpha$ en *cualquier* instante $t \\ge 1$ está acotada por $\\alpha$:

$$\\Pr\\!\\left(\\exists t \\ge 1:\\; \\Lambda_t \\ge \\frac{1}{\\alpha} \\;\\middle|\\; H_0\\right) \\le \\alpha$$

Para $\\alpha = 0.05$, basta exigir $\\Lambda_t \\ge 20$ (o equivalentemente un **valor $p$ siempre válido** $p_t^{\\text{seq}} = \\min(1, 1 / \\Lambda_t) \\le 0.05$) para detener la prueba con plena validez estadística.`,
      example: {
        language: 'sql',
        title: 'Protección de mSPRT frente a falsas alarmas tempranas en la serie A/A de EXP-SUB-BUNDLE',
        code: `WITH diario AS (
  SELECT
    CAST(DATE_TRUNC('day', assigned_ts) AS DATE)::VARCHAR AS dia,
    COUNT(CASE WHEN variant = 'control' THEN 1 END) AS d_nc,
    COUNT(CASE WHEN variant = 'treatment' THEN 1 END) AS d_nt,
    SUM(CASE WHEN variant = 'control' THEN pre_experiment_spend_usd ELSE 0 END) AS d_sum_c,
    SUM(CASE WHEN variant = 'treatment' THEN pre_experiment_spend_usd ELSE 0 END) AS d_sum_t,
    SUM(CASE WHEN variant = 'control' THEN POWER(pre_experiment_spend_usd, 2) ELSE 0 END) AS d_sq_c,
    SUM(CASE WHEN variant = 'treatment' THEN POWER(pre_experiment_spend_usd, 2) ELSE 0 END) AS d_sq_t
  FROM experiment_assignments
  WHERE experiment_id = 3
  GROUP BY 1
),
acumulado AS (
  SELECT
    dia,
    SUM(d_nc) OVER (ORDER BY dia) AS n_c,
    SUM(d_nt) OVER (ORDER BY dia) AS n_t,
    SUM(d_sum_c) OVER (ORDER BY dia) AS sum_c,
    SUM(d_sum_t) OVER (ORDER BY dia) AS sum_t,
    SUM(d_sq_c) OVER (ORDER BY dia) AS sq_c,
    SUM(d_sq_t) OVER (ORDER BY dia) AS sq_t
  FROM diario
),
estadisticos AS (
  SELECT
    dia,
    n_c + n_t AS n_acum,
    (sum_t / n_t) - (sum_c / n_c) AS diff_pre,
    ((sq_c - POWER(sum_c, 2) / n_c) / (n_c - 1)) / n_c
      + ((sq_t - POWER(sum_t, 2) / n_t) / (n_t - 1)) / n_t AS v_t,
    25.0 AS tau_sq
  FROM acumulado
)
SELECT
  dia,
  n_acum,
  ROUND(diff_pre, 2) AS diff_pre_usd,
  ROUND(ABS(diff_pre) / SQRT(v_t), 3) AS z_fijo_abs,
  ROUND(
    SQRT(v_t / (v_t + tau_sq)) * EXP(0.5 * POWER(diff_pre / SQRT(v_t), 2) * (tau_sq / (v_t + tau_sq))),
    3
  ) AS lambda_msprt,
  CASE WHEN ABS(diff_pre) / SQRT(v_t) > 1.96 THEN 'FALSA_ALARMA' ELSE 'RETENER_H0' END AS decision_fija,
  CASE WHEN SQRT(v_t / (v_t + tau_sq)) * EXP(0.5 * POWER(diff_pre / SQRT(v_t), 2) * (tau_sq / (v_t + tau_sq))) >= 20.0 THEN 'PARAR' ELSE 'CONTINUAR' END AS decision_msprt
FROM estadisticos
ORDER BY dia
LIMIT 5;`,
        expectedOutput: {
          columns: ['dia', 'n_acum', 'diff_pre_usd', 'z_fijo_abs', 'lambda_msprt', 'decision_fija', 'decision_msprt'],
          rows: [
            ['2024-06-01', '82', '13.35', '2.112', '1.85', 'FALSA_ALARMA', 'CONTINUAR'],
            ['2024-06-02', '195', '7.84', '2.015', '2.173', 'FALSA_ALARMA', 'CONTINUAR'],
            ['2024-06-03', '304', '2.86', '0.907', '0.716', 'RETENER_H0', 'CONTINUAR'],
            ['2024-06-04', '393', '-0.68', '0.247', '0.491', 'RETENER_H0', 'CONTINUAR'],
            ['2024-06-05', '498', '-0.01', '0.006', '0.433', 'RETENER_H0', 'CONTINUAR'],
          ],
        },
        annotation: 'En los días 1 y 2 el test fijo cae en falsa alarma (|z| > 1.96), pero lambda_msprt apenas llega a 1.850 y 2.173 (<< 20), protegiendo el experimento hasta que el ruido se disipa en el día 5.',
      },
    },
    {
      id: 'secuencias-confianza-sql',
      heading: 'Secuencias de confianza siempre válidas y agregación acumulada en SQL',
      body: `Al invertir la desigualdad $\\Lambda_t(\\tau^2) < 1 / \\alpha$, obtenemos la **secuencia de confianza siempre válida** (*Always-Valid Confidence Sequence*, Howard et al., 2021): una banda $\\hat{\\Delta}_t \\pm r_t(\\alpha, \\tau^2)$ cuyo radio en el corte $t$ es:

$$r_t(\\alpha, \\tau^2) = \\sqrt{V_t\\,\\frac{V_t + \\tau^2}{\\tau^2}\\!\\left(2\\ln\\frac{1}{\\alpha} + \\ln\\frac{V_t + \\tau^2}{V_t}\\right)}$$

Observa cómo opera la penalización secuencial cuando la muestra es pequeña ($V_t$ grande frente a $\\tau^2$): el factor $\\sqrt{V_t / (V_t + \\tau^2)}$ en $\\Lambda_t$ amortigua los picos tempranos de $z_t$ y ensancha el radio $r_t$ mucho más allá del intervalo fijo $1.96\\sqrt{V_t}$.

Para calcular la serie acumulada día a día en SQL sin re-escanear la tabla por cada fecha, descomponemos la varianza muestral acumulada usando tres sumas acumuladas con funciones de ventana (\`SUM(...) OVER (ORDER BY dia)\`): el conteo $n_t$, la suma lineal $S_t = \\sum Y_i$ y la suma de cuadrados $Q_t = \\sum Y_i^2$. A partir de ellas, la varianza muestral en el corte $t$ se obtiene de forma exacta como:

$$s_t^2 = \\frac{Q_t - S_t^2 / n_t}{n_t - 1}$$`,
    },
  ],
  workedExample: {
    problem: 'Monitorea los primeros 5 días de EXP-CHECKOUT-1STEP (experiment_id = 1) sobre post_experiment_spend_usd. Primero calcula las sumas acumuladas y el intervalo de confianza fijo (1.96 * EE); luego evalúa el radio de la secuencia de confianza mSPRT (tau^2 = 25, alfa = 0.05) y determina en qué día exacto es válido detener la prueba.',
    steps: [
      {
        title: 'Paso 1: Trayectoria acumulada e intervalo de horizonte fijo en los primeros 5 días',
        rationale: 'Usamos funciones de ventana sobre agregados diarios para obtener el lift acumulado y el radio de confianza clásico 1.96 * SQRT(V_t).',
        code: `WITH diario AS (
  SELECT
    CAST(DATE_TRUNC('day', assigned_ts) AS DATE)::VARCHAR AS dia,
    COUNT(CASE WHEN variant = 'control' THEN 1 END) AS d_nc,
    COUNT(CASE WHEN variant = 'treatment' THEN 1 END) AS d_nt,
    SUM(CASE WHEN variant = 'control' THEN post_experiment_spend_usd ELSE 0 END) AS d_sum_c,
    SUM(CASE WHEN variant = 'treatment' THEN post_experiment_spend_usd ELSE 0 END) AS d_sum_t,
    SUM(CASE WHEN variant = 'control' THEN POWER(post_experiment_spend_usd, 2) ELSE 0 END) AS d_sq_c,
    SUM(CASE WHEN variant = 'treatment' THEN POWER(post_experiment_spend_usd, 2) ELSE 0 END) AS d_sq_t
  FROM experiment_assignments
  WHERE experiment_id = 1
  GROUP BY 1
),
acumulado AS (
  SELECT
    dia,
    SUM(d_nc) OVER (ORDER BY dia) AS n_c,
    SUM(d_nt) OVER (ORDER BY dia) AS n_t,
    SUM(d_sum_c) OVER (ORDER BY dia) AS sum_c,
    SUM(d_sum_t) OVER (ORDER BY dia) AS sum_t,
    SUM(d_sq_c) OVER (ORDER BY dia) AS sq_c,
    SUM(d_sq_t) OVER (ORDER BY dia) AS sq_t
  FROM diario
)
SELECT
  dia,
  n_c + n_t AS n_acum,
  ROUND((sum_t / n_t) - (sum_c / n_c), 2) AS lift_acum_usd,
  ROUND(
    SQRT(
      ((sq_c - POWER(sum_c, 2) / n_c) / (n_c - 1)) / n_c
      + ((sq_t - POWER(sum_t, 2) / n_t) / (n_t - 1)) / n_t
    ),
    3
  ) AS ee_acum,
  ROUND(
    1.96 * SQRT(
      ((sq_c - POWER(sum_c, 2) / n_c) / (n_c - 1)) / n_c
      + ((sq_t - POWER(sum_t, 2) / n_t) / (n_t - 1)) / n_t
    ),
    2
  ) AS radio_ic_fijo
FROM acumulado
ORDER BY dia
LIMIT 5;`,
        output: `dia        | n_acum | lift_acum_usd | ee_acum | radio_ic_fijo
-----------+--------+---------------+---------+--------------
2024-02-01 | 85     | 9.23          | 3.739   | 7.33
2024-02-02 | 202    | 9.94          | 2.479   | 4.86
2024-02-03 | 305    | 7.16          | 2.138   | 4.19
2024-02-04 | 431    | 6.27          | 1.772   | 3.47
2024-02-05 | 536    | 7.07          | 1.588   | 3.11`,
        takeaway: 'En el día 1 (n = 85), el intervalo fijo [9.23 - 7.33, 9.23 + 7.33] = [1.90, 16.56] ya excluye el cero, tentando al analista a detener con apenas 85 usuarios.',
      },
      {
        title: 'Paso 2: Secuencia de confianza mSPRT y regla de parada válida (lambda >= 20)',
        rationale: 'Contrastamos el radio secuencial mSPRT y la razón de verosimilitud lambda_msprt para identificar cuándo cruza válidamente el umbral 1 / 0.05 = 20.',
        code: `WITH diario AS (
  SELECT
    CAST(DATE_TRUNC('day', assigned_ts) AS DATE)::VARCHAR AS dia,
    COUNT(CASE WHEN variant = 'control' THEN 1 END) AS d_nc,
    COUNT(CASE WHEN variant = 'treatment' THEN 1 END) AS d_nt,
    SUM(CASE WHEN variant = 'control' THEN post_experiment_spend_usd ELSE 0 END) AS d_sum_c,
    SUM(CASE WHEN variant = 'treatment' THEN post_experiment_spend_usd ELSE 0 END) AS d_sum_t,
    SUM(CASE WHEN variant = 'control' THEN POWER(post_experiment_spend_usd, 2) ELSE 0 END) AS d_sq_c,
    SUM(CASE WHEN variant = 'treatment' THEN POWER(post_experiment_spend_usd, 2) ELSE 0 END) AS d_sq_t
  FROM experiment_assignments
  WHERE experiment_id = 1
  GROUP BY 1
),
acumulado AS (
  SELECT
    dia,
    SUM(d_nc) OVER (ORDER BY dia) AS n_c,
    SUM(d_nt) OVER (ORDER BY dia) AS n_t,
    SUM(d_sum_c) OVER (ORDER BY dia) AS sum_c,
    SUM(d_sum_t) OVER (ORDER BY dia) AS sum_t,
    SUM(d_sq_c) OVER (ORDER BY dia) AS sq_c,
    SUM(d_sq_t) OVER (ORDER BY dia) AS sq_t
  FROM diario
),
estadisticos AS (
  SELECT
    dia,
    n_c + n_t AS n_acum,
    (sum_t / n_t) - (sum_c / n_c) AS lift,
    ((sq_c - POWER(sum_c, 2) / n_c) / (n_c - 1)) / n_c
      + ((sq_t - POWER(sum_t, 2) / n_t) / (n_t - 1)) / n_t AS v_t,
    25.0 AS tau_sq
  FROM acumulado
)
SELECT
  dia,
  n_acum,
  ROUND(lift, 2) AS lift_acum_usd,
  ROUND(1.96 * SQRT(v_t), 2) AS radio_ic_fijo,
  ROUND(
    SQRT(v_t * ((v_t + tau_sq) / tau_sq) * (2.0 * LN(20.0) + LN((v_t + tau_sq) / v_t))),
    2
  ) AS radio_cs_msprt,
  ROUND(
    SQRT(v_t / (v_t + tau_sq)) * EXP(0.5 * POWER(lift / SQRT(v_t), 2) * (tau_sq / (v_t + tau_sq))),
    2
  ) AS lambda_msprt
FROM estadisticos
ORDER BY dia
LIMIT 5;`,
        output: `dia        | n_acum | lift_acum_usd | radio_ic_fijo | radio_cs_msprt | lambda_msprt
-----------+--------+---------------+---------------+----------------+-------------
2024-02-01 | 85     | 9.23          | 7.33          | 12.37          | 4.22
2024-02-02 | 202    | 9.94          | 4.86          | 7.64           | 281.56
2024-02-03 | 305    | 7.16          | 4.19          | 6.52           | 44.73
2024-02-04 | 431    | 6.27          | 3.47          | 5.38           | 86.50
2024-02-05 | 536    | 7.07          | 3.11          | 4.82           | 2430.59`,
        takeaway: 'En el día 1 mSPRT impide parar (lambda = 4.22 < 20 y el intervalo secuencial [9.23 - 12.37, 9.23 + 12.37] incluye el cero). En el día 2 (n = 202), lambda = 281.56 >= 20 autoriza una parada temprana válida.',
      },
    ],
  },
  checks: [
    {
      id: 'c1',
      type: 'multiple-choice',
      prompt: '¿Por qué inspeccionar diariamente una prueba t de horizonte fijo y detenerla el primer día en que p < 0.05 invalida el nivel de significancia nominal del 5 %?',
      options: [
        {
          id: 'a',
          text: 'Porque la distribución t de Student solo es válida los fines de semana cuando el tráfico es homogéneo.',
          feedback: 'Incorrecto. El problema no depende del día de la semana sino de las múltiples oportunidades de cruzar un umbral fijo.',
        },
        {
          id: 'b',
          text: 'Porque la parada opcional acumula probabilidades de cruce en cada inspección, haciendo que Pr(max_t |Z_t| > 1.96 | H0) supere ampliamente el 5 %.',
          feedback: 'Correcto. Al dar múltiples oportunidades de parada a una caminata aleatoria bajo H0, la tasa acumulada de falsos positivos se infla drásticamente.',
        },
        {
          id: 'c',
          text: 'Porque al agregar más usuarios cada día la varianza muestral crece hacia infinito.',
          feedback: 'Incorrecto. A medida que crece el tamaño muestral acumulado, la varianza de la media disminuye hacia cero.',
        },
        {
          id: 'd',
          text: 'Porque DuckDB recalcula los identificadores de usuario en cada consulta diaria.',
          feedback: 'Incorrecto. La inflación del error Tipo I es una propiedad estadística de la regla de parada, no del motor de base de datos.',
        },
      ],
      correctOptionId: 'b',
      explanation: 'El umbral |z| > 1.96 solo garantiza un 5 % de falsos positivos en un único punto fijo; al evaluar el máximo sobre múltiples días, los cruces aleatorios se acumulan.',
    },
    {
      id: 'c2',
      type: 'multiple-choice',
      prompt: 'En una prueba secuencial mSPRT configurada con nivel alfa = 0.05, ¿qué condición debe cumplir la razón de verosimilitud mezclada Lambda_t para rechazar H0 en el día t?',
      options: [
        {
          id: 'a',
          text: 'Lambda_t >= 1.96, igual que el cuantil crítico de la distribución normal estándar.',
          feedback: 'Incorrecto. 1.96 es el umbral para el estadístico z fijo, no para la razón de verosimilitud Lambda_t.',
        },
        {
          id: 'b',
          text: 'Lambda_t >= 20, dado que por la desigualdad de martingalas de Ville el umbral válido es 1 / alfa = 1 / 0.05 = 20.',
          feedback: 'Correcto. Como E[Lambda_t | H0] = 1, exigir Lambda_t >= 1 / alfa = 20 garantiza que la probabilidad de cruce bajo H0 en cualquier t sea a lo sumo 0.05.',
        },
        {
          id: 'c',
          text: 'Lambda_t <= 0.05, porque Lambda_t es sinónimo directo del valor p.',
          feedback: 'Incorrecto. El valor p secuencial es el recíproco 1 / Lambda_t; por tanto, p_seq <= 0.05 equivale a Lambda_t >= 20.',
        },
        {
          id: 'd',
          text: 'Lambda_t >= 1.00, que indica que la alternativa es al menos tan verosímil como la hipótesis nula.',
          feedback: 'Incorrecto. Un umbral de 1.00 produciría una tasa altísima de falsos positivos bajo monitoreo continuo.',
        },
      ],
      correctOptionId: 'b',
      explanation: 'Bajo H0, Lambda_t es una martingala no negativa con media 1; por la desigualdad de Ville, Pr(max_t Lambda_t >= 1/alfa) <= alfa, lo que fija el umbral en 1 / 0.05 = 20.',
    },
    {
      id: 'c3',
      type: 'multiple-choice',
      prompt: 'En el día 1 de EXP-CHECKOUT-1STEP (n = 85), el lift acumulado es +9.23 USD, el radio del intervalo fijo es 7.33 USD y el radio de la secuencia de confianza mSPRT es 12.37 USD. ¿Qué significa esta discrepancia?',
      options: [
        {
          id: 'a',
          text: 'Que el intervalo fijo [1.90, 16.56] subestima la incertidumbre bajo monitoreo continuo, mientras la secuencia de confianza [-3.14, 21.60] aún incluye el cero y exige esperar.',
          feedback: 'Correcto. La secuencia de confianza ensancha el radio en muestras pequeñas para proteger la cobertura del 95 % a lo largo de todo el horizonte temporal.',
        },
        {
          id: 'b',
          text: 'Que mSPRT tiene un error de cálculo porque ningún intervalo de confianza puede ser más ancho que 1.96 veces el error estándar.',
          feedback: 'Incorrecto. Para mantener cobertura uniforme en todos los tiempos t >= 1, una secuencia de confianza debe ser estrictamente más ancha que el intervalo puntual fijo.',
        },
        {
          id: 'c',
          text: 'Que el experimento debe abortarse por Sample Ratio Mismatch en el primer día.',
          feedback: 'Incorrecto. El ancho mayor del intervalo secuencial refleja el ajuste por monitoreo continuo, no un desbalance SRM.',
        },
        {
          id: 'd',
          text: 'Que el efecto real del tratamiento es negativo (-3.14 USD) y nunca llegará a ser significativo.',
          feedback: 'Incorrecto. Que la cota inferior inicial sea -3.14 USD solo indica que con n = 85 aún no hay evidencia suficiente; en el día 2 (n = 202) la cota inferior sube a +2.30 USD.',
        },
      ],
      correctOptionId: 'a',
      explanation: 'Al inicio del experimento, cuando V_t es grande, la secuencia de confianza mSPRT penaliza la incertidumbre temprana (radio 12.37 vs 7.33 USD) evitando paradas prematuras.',
    },
  ],
  practice: {
    type: 'sql',
    title: 'Práctica: Monitoreo secuencial mSPRT durante los primeros 6 días de EXP-CHECKOUT-1STEP',
    prompt: 'Construye la serie acumulada diaria de experiment_id = 1 sobre post_experiment_spend_usd para sus primeros 6 días (LIMIT 6 ordenado por dia ascendente). Usando tau_sq = 25.0 y alfa = 0.05, devuelve exactamente las columnas: dia, n_acum, lift_acum_usd, radio_ic_fijo, radio_cs_msprt, lambda_msprt y decision_msprt (\'PARAR_SIGNIFICATIVO\' cuando lambda_msprt >= 20.0, de lo contrario \'CONTINUAR_CAPTURA\').',
    starterCode: `WITH diario AS (
  SELECT
    CAST(DATE_TRUNC('day', assigned_ts) AS DATE)::VARCHAR AS dia,
    COUNT(CASE WHEN variant = 'control' THEN 1 END) AS d_nc,
    COUNT(CASE WHEN variant = 'treatment' THEN 1 END) AS d_nt,
    SUM(CASE WHEN variant = 'control' THEN post_experiment_spend_usd ELSE 0 END) AS d_sum_c,
    SUM(CASE WHEN variant = 'treatment' THEN post_experiment_spend_usd ELSE 0 END) AS d_sum_t,
    SUM(CASE WHEN variant = 'control' THEN POWER(post_experiment_spend_usd, 2) ELSE 0 END) AS d_sq_c,
    SUM(CASE WHEN variant = 'treatment' THEN POWER(post_experiment_spend_usd, 2) ELSE 0 END) AS d_sq_t
  FROM experiment_assignments
  WHERE experiment_id = 1
  GROUP BY 1
)
-- Acumula con SUM(...) OVER (ORDER BY dia) y calcula los estadísticos mSPRT
SELECT
  dia,
  d_nc + d_nt AS n_acum
FROM diario
ORDER BY dia
LIMIT 6;`,
    hints: [
      'Crea una CTE acumulado con SUM(d_nc) OVER (ORDER BY dia) AS n_c, SUM(d_nt) OVER (ORDER BY dia) AS n_t y las sumas acumuladas sum_c, sum_t, sq_c y sq_t.',
      'Crea una CTE estadisticos que calcule lift = (sum_t / n_t) - (sum_c / n_c), la varianza combinada v_t = ((sq_c - POWER(sum_c, 2) / n_c) / (n_c - 1)) / n_c + ((sq_t - POWER(sum_t, 2) / n_t) / (n_t - 1)) / n_t y defina 25.0 AS tau_sq.',
      'En el SELECT final proyecta ROUND(lift, 2) AS lift_acum_usd, ROUND(1.96 * SQRT(v_t), 2) AS radio_ic_fijo, ROUND(SQRT(v_t * ((v_t + tau_sq) / tau_sq) * (2.0 * LN(20.0) + LN((v_t + tau_sq) / v_t))), 2) AS radio_cs_msprt, ROUND(SQRT(v_t / (v_t + tau_sq)) * EXP(0.5 * POWER(lift / SQRT(v_t), 2) * (tau_sq / (v_t + tau_sq))), 2) AS lambda_msprt y el CASE para decision_msprt.',
    ],
    solution: `WITH diario AS (
  SELECT
    CAST(DATE_TRUNC('day', assigned_ts) AS DATE)::VARCHAR AS dia,
    COUNT(CASE WHEN variant = 'control' THEN 1 END) AS d_nc,
    COUNT(CASE WHEN variant = 'treatment' THEN 1 END) AS d_nt,
    SUM(CASE WHEN variant = 'control' THEN post_experiment_spend_usd ELSE 0 END) AS d_sum_c,
    SUM(CASE WHEN variant = 'treatment' THEN post_experiment_spend_usd ELSE 0 END) AS d_sum_t,
    SUM(CASE WHEN variant = 'control' THEN POWER(post_experiment_spend_usd, 2) ELSE 0 END) AS d_sq_c,
    SUM(CASE WHEN variant = 'treatment' THEN POWER(post_experiment_spend_usd, 2) ELSE 0 END) AS d_sq_t
  FROM experiment_assignments
  WHERE experiment_id = 1
  GROUP BY 1
),
acumulado AS (
  SELECT
    dia,
    SUM(d_nc) OVER (ORDER BY dia) AS n_c,
    SUM(d_nt) OVER (ORDER BY dia) AS n_t,
    SUM(d_sum_c) OVER (ORDER BY dia) AS sum_c,
    SUM(d_sum_t) OVER (ORDER BY dia) AS sum_t,
    SUM(d_sq_c) OVER (ORDER BY dia) AS sq_c,
    SUM(d_sq_t) OVER (ORDER BY dia) AS sq_t
  FROM diario
),
estadisticos AS (
  SELECT
    dia,
    n_c + n_t AS n_acum,
    (sum_t / n_t) - (sum_c / n_c) AS lift,
    ((sq_c - POWER(sum_c, 2) / n_c) / (n_c - 1)) / n_c
      + ((sq_t - POWER(sum_t, 2) / n_t) / (n_t - 1)) / n_t AS v_t,
    25.0 AS tau_sq
  FROM acumulado
)
SELECT
  dia,
  n_acum,
  ROUND(lift, 2) AS lift_acum_usd,
  ROUND(1.96 * SQRT(v_t), 2) AS radio_ic_fijo,
  ROUND(
    SQRT(v_t * ((v_t + tau_sq) / tau_sq) * (2.0 * LN(20.0) + LN((v_t + tau_sq) / v_t))),
    2
  ) AS radio_cs_msprt,
  ROUND(
    SQRT(v_t / (v_t + tau_sq)) * EXP(0.5 * POWER(lift / SQRT(v_t), 2) * (tau_sq / (v_t + tau_sq))),
    2
  ) AS lambda_msprt,
  CASE
    WHEN SQRT(v_t / (v_t + tau_sq)) * EXP(0.5 * POWER(lift / SQRT(v_t), 2) * (tau_sq / (v_t + tau_sq))) >= 20.0
    THEN 'PARAR_SIGNIFICATIVO'
    ELSE 'CONTINUAR_CAPTURA'
  END AS decision_msprt
FROM estadisticos
ORDER BY dia
LIMIT 6;`,
    solutionExplanation: 'La consulta construye las sumas suficientes acumuladas por día y evalúa la martingala mSPRT: el día 2024-02-01 exige continuar captura (lambda = 4.22 < 20), mientras que desde el 2024-02-02 (lambda = 281.56 >= 20) el experimento cruza válidamente el umbral secuencial.',
    expectedOutput: {
      columns: ['dia', 'n_acum', 'lift_acum_usd', 'radio_ic_fijo', 'radio_cs_msprt', 'lambda_msprt', 'decision_msprt'],
      rows: [
        ['2024-02-01', '85', '9.23', '7.33', '12.37', '4.22', 'CONTINUAR_CAPTURA'],
        ['2024-02-02', '202', '9.94', '4.86', '7.64', '281.56', 'PARAR_SIGNIFICATIVO'],
        ['2024-02-03', '305', '7.16', '4.19', '6.52', '44.73', 'PARAR_SIGNIFICATIVO'],
        ['2024-02-04', '431', '6.27', '3.47', '5.38', '86.5', 'PARAR_SIGNIFICATIVO'],
        ['2024-02-05', '536', '7.07', '3.11', '4.82', '2430.59', 'PARAR_SIGNIFICATIVO'],
        ['2024-02-06', '640', '8.56', '2.84', '4.42', '2573859.6', 'PARAR_SIGNIFICATIVO'],
      ],
    },
    expectedOutputTable: {
      columns: ['dia', 'n_acum', 'lift_acum_usd', 'radio_ic_fijo', 'radio_cs_msprt', 'lambda_msprt', 'decision_msprt'],
      rows: [
        { dia: '2024-02-01', n_acum: 85, lift_acum_usd: 9.23, radio_ic_fijo: 7.33, radio_cs_msprt: 12.37, lambda_msprt: 4.22, decision_msprt: 'CONTINUAR_CAPTURA' },
        { dia: '2024-02-02', n_acum: 202, lift_acum_usd: 9.94, radio_ic_fijo: 4.86, radio_cs_msprt: 7.64, lambda_msprt: 281.56, decision_msprt: 'PARAR_SIGNIFICATIVO' },
        { dia: '2024-02-03', n_acum: 305, lift_acum_usd: 7.16, radio_ic_fijo: 4.19, radio_cs_msprt: 6.52, lambda_msprt: 44.73, decision_msprt: 'PARAR_SIGNIFICATIVO' },
        { dia: '2024-02-04', n_acum: 431, lift_acum_usd: 6.27, radio_ic_fijo: 3.47, radio_cs_msprt: 5.38, lambda_msprt: 86.5, decision_msprt: 'PARAR_SIGNIFICATIVO' },
        { dia: '2024-02-05', n_acum: 536, lift_acum_usd: 7.07, radio_ic_fijo: 3.11, radio_cs_msprt: 4.82, lambda_msprt: 2430.59, decision_msprt: 'PARAR_SIGNIFICATIVO' },
        { dia: '2024-02-06', n_acum: 640, lift_acum_usd: 8.56, radio_ic_fijo: 2.84, radio_cs_msprt: 4.42, lambda_msprt: 2573859.6, decision_msprt: 'PARAR_SIGNIFICATIVO' },
      ],
    },
  },
  roleNotes: {
    da: 'Como analista de datos, sustituye las bandas fijas 1.96 * EE en los tableros de seguimiento diario por secuencias de confianza mSPRT para que los gerentes puedan consultar el avance sin disparar falsas alarmas.',
    ds: 'Desde ciencia de datos, calibra la varianza de mezcla tau^2 en función del tamaño de efecto mínimo esperado (MDE^2) o combina mSPRT con métricas ya ajustadas por CUPED para acelerar aún más la parada válida.',
    de: 'Como ingeniero de datos, almacena por experimento y día los tres estadísticos suficientes aditivos (conteo n, suma lineal SUM(y) y suma cuadrática SUM(y^2)) para calcular varianzas acumuladas en milisegundos con funciones de ventana.',
  },
  summary: [
    'Monitorear continuamente una prueba de horizonte fijo y detenerla cuando p < 0.05 (data peeking) infla de forma grave la tasa de falsos positivos.',
    'La prueba mSPRT integra la razón de verosimilitud sobre una distribución normal de efectos con varianza de mezcla tau^2.',
    'Bajo la hipótesis nula, el estadístico Lambda_t es una martingala con media 1 y permite detener la prueba en cualquier instante t en que Lambda_t >= 1 / alfa.',
    'Las secuencias de confianza siempre válidas son más anchas al inicio del experimento y garantizan cobertura conjunta (1 - alfa) en toda la trayectoria.',
  ],
  flashcards: [
    {
      id: 'f1',
      front: '¿Por qué el data peeking infla el error Tipo I en una prueba A/B clásica?',
      back: 'Porque evaluar repetidamente |Z_t| > 1.96 en cada día t acumula las probabilidades de que la caminata aleatoria cruce la barrera fija por azar bajo H0.',
    },
    {
      id: 'f2',
      front: '¿Cuál es el umbral de parada de la razón de verosimilitud mezclada Lambda_t para un nivel alfa = 0.05?',
      back: 'Lambda_t >= 1 / alfa = 20 (equivalente a un valor p siempre válido p_seq = min(1, 1 / Lambda_t) <= 0.05).',
    },
    {
      id: 'f3',
      front: '¿Qué propiedad probabilística garantiza que Lambda_t controle el error Tipo I en todo tiempo t >= 1?',
      back: 'Bajo H0, Lambda_t es una supermartingala (o martingala) no negativa con valor esperado inicial 1, a la cual se aplica la desigualdad maximal de Ville.',
    },
    {
      id: 'f4',
      front: '¿Qué tres agregados diarios bastan para reconstruir la varianza muestral acumulada en SQL con funciones de ventana?',
      back: 'El conteo acumulado n_t, la suma lineal acumulada SUM(Y) y la suma acumulada de cuadrados SUM(Y^2).',
    },
  ],
  glossaryTerms: [
    'monitoreo-continuo-peeking',
    'prueba-secuencial-msprt',
    'secuencia-confianza-siempre-valida',
    'error-tipo-i',
  ],
  relatedLessons: [
    'da2-inferencia-06-errores-potencia-tamano-muestra',
    'da3-experimentos-02-comparaciones-multiples-bh',
    'da3-experimentos-04-enfoque-bayesiano-ab',
  ],
  sources: [
    {
      title: 'Peeking at A/B Tests: Why It Matters, and What to Do About It (KDD 2017 / Operations Research 2022)',
      url: 'https://arxiv.org/abs/1512.04922',
      publisher: 'arXiv / Operations Research',
      accessed: '2026-10-29',
      supports: 'Derivación del estadístico mSPRT, valores p siempre válidos y monitoreo continuo en plataformas A/B.',
    },
    {
      title: 'Time-uniform, nonparametric, nonasymptotic confidence sequences (Annals of Statistics 2021)',
      url: 'https://arxiv.org/abs/1810.08240',
      publisher: 'Institute of Mathematical Statistics / arXiv',
      accessed: '2026-10-29',
      supports: 'Construcción general de secuencias de confianza uniformes en el tiempo basadas en martingalas.',
    },
    {
      title: 'Statsig Documentation — Sequential Testing and mSPRT Confidence Intervals',
      url: 'https://docs.statsig.com/experiments-plus/sequential-testing',
      publisher: 'Statsig',
      accessed: '2026-10-29',
      supports: 'Aplicación práctica de mSPRT y ajuste de bandas de confianza secuenciales en experimentos de producto.',
    },
    {
      title: 'How Not To Run an A/B Test',
      url: 'https://www.evanmiller.org/how-not-to-run-an-ab-test.html',
      publisher: 'Evan Miller Statistical Guides',
      accessed: '2026-10-29',
      supports: 'Demostración clásica del sesgo de parada opcional cuando se monitorean pruebas de horizonte fijo.',
    },
  ],
  aiNotes: 'Enfatiza por qué en el día 1 de EXP-CHECKOUT-1STEP (n = 85) el intervalo fijo [1.90, 16.56] engaña al analista mientras la secuencia de confianza mSPRT [-3.14, 21.60] exige esperar hasta el día 2 (lambda = 281.56 >= 20). Guía en el uso de SUM(...) OVER (ORDER BY dia) para calcular la varianza acumulada sin subconsultas correlacionadas.',
};

export default lesson;
