export const lesson = {
  id: 'da3-experimentos-02-comparaciones-multiples-bh',
  v2Id: 'da3-experimentos-02-comparaciones-multiples-bh',
  moduleId: 'da3-experimentos',
  track: 'da',
  tracks: ['da', 'ds'],
  level: 3,
  order: 2,
  contentVersion: 2,
  title: 'Comparaciones múltiples y método de Benjamini-Hochberg',
  subtitle: 'Comparaciones múltiples y control de la tasa de descubrimientos falsos (Benjamini-Hochberg)',
  minutes: 25,
  needsReview: false,
  prerequisites: [
    'da2-inferencia',
    'da3-experimentos-01-ab-testing-cuped',
  ],
  learningObjectives: [
    'Cuantificar la inflación de la tasa de error por familia (FWER) al segmentar un experimento en múltiples cohortes o métricas.',
    'Distinguir cuándo controlar la probabilidad de al menos un falso positivo (FWER) frente a la tasa esperada de descubrimientos falsos (FDR).',
    'Implementar el procedimiento escalonado de Benjamini-Hochberg en SQL mediante funciones de ventana y rangos ordenados.',
  ],
  hook: 'Tras correr una prueba A/B en Mercado Brisa, un gerente pide desglosar el resultado por las 15 cohortes diarias de asignación y encuentra un día con p = 0.0052 incluso antes de activar el cambio (en el gasto pre-experimento): ¿por qué buscar ganadores por subgrupo dispara los falsos positivos a más del 53 % y cómo logra el algoritmo de Benjamini-Hochberg filtrar el ruido sin destruir la potencia estadística como hace Bonferroni?',
  objectives: [
    'Calcular la inflación exacta de FWER bajo pruebas múltiples independientes.',
    'Contrastar la severidad del ajuste de Bonferroni frente al control de FDR.',
    'Programar la regla escalonada de Benjamini-Hochberg en DuckDB con ROW_NUMBER().',
  ],
  sections: [
    {
      id: 'inflacion-fwer-subgrupos',
      heading: 'La trampa del desglose por subgrupos y la explosión de la FWER',
      body: `Cuando un experimento no muestra el resultado esperado, surge la tentación de cruzar la métrica por país, segmento o cohorte diaria. Si cada corte se evalúa con el umbral clásico $\\alpha = 0.05$, la probabilidad de declarar erróneamente un efecto inexistente deja de ser del $5\\%$.

Llamamos **tasa de error por familia** (*Family-Wise Error Rate*, FWER) a la probabilidad de cometer al menos un error Tipo I ($V \\ge 1$) al ejecutar $m$ pruebas nulas independientes.

$$\\text{FWER} = \\Pr(V \\ge 1) = 1 - (1 - \\alpha)^m.$$

Con $m = 15$ cohortes diarias evaluadas a $\\alpha = 0.05$, la probabilidad de encontrar al menos un falso positivo sube a $1 - 0.95^{15} = 0.5367$ ($53.67\\%$). En **Mercado Brisa**, analizamos el gasto *pre-experimento* (\`pre_experiment_spend_usd\`) en las $15$ cohortes diarias completas de \`EXP-CHECKOUT-1STEP\`. Allí el efecto real es cero porque aún no ocurría el cambio. Pese a ello, el día \`2024-02-06\` arroja $|z| = 2.780$ y $p = 0.00516$.

La **corrección de Bonferroni** controla la FWER dividiendo el umbral entre el total de pruebas ($\\alpha / m = 0.05 / 15 = 0.00333$). Aunque impide el falso positivo ($0.00516 > 0.00333$), castiga severamente la potencia estadística cuando $m$ crece.`,
    },
    {
      id: 'fdr-benjamini-hochberg',
      heading: 'Tasa de descubrimientos falsos (FDR) y método de Benjamini-Hochberg',
      body: `En analítica de producto rara vez necesitamos garantizar cero falsos positivos absolutos a costa de perder casi todos los efectos reales. En 1995, Yoav Benjamini y Yosef Hochberg propusieron controlar la **tasa de descubrimientos falsos** (*False Discovery Rate*, FDR). Esta métrica define la proporción esperada de falsos positivos ($V$) entre el total de hipótesis rechazadas ($R$).

$$\\text{FDR} = \\mathbb{E}\\!\\left[\\frac{V}{\\max(R, 1)}\\right] \\le q.$$

El **procedimiento escalonado de Benjamini-Hochberg (BH)** fija un nivel objetivo $q$ (por ejemplo $q = 0.05$) y ejecuta tres pasos sobre las $m$ hipótesis. Primero ordena los valores $p$ en forma ascendente: $p_{(1)} \\le p_{(2)} \\le \\dots \\le p_{(m)}$, asignando a cada prueba su rango $k \\in \\{1, \\dots, m\\}$. Segundo, asigna a cada rango $k$ una cota crítica creciente $c_k = \\frac{k}{m}\\,q$. Tercero, busca el **mayor rango** $k^*$ que cumple $p_{(k^*)} \\le \\frac{k^*}{m}\\,q$ y rechaza todas las hipótesis desde el rango $1$ hasta $k^*$.

Para la primera hipótesis más extrema ($k = 1$), el umbral BH es $\\frac{1}{m}q$, idéntico al de Bonferroni. Pero si existen varios efectos verdaderos, a medida que $k$ avanza la cota se relaja linealmente. Así conserva mucha mayor potencia estadística.`,
      example: {
        language: 'sql',
        title: 'Control negativo A/A sobre gasto pre-experimento en las 15 cohortes diarias',
        code: `WITH diario AS (
  SELECT
    CAST(DATE_TRUNC('day', assigned_ts) AS DATE)::VARCHAR AS cohorte_dia,
    COUNT(CASE WHEN variant = 'control' THEN 1 END) AS n_c,
    COUNT(CASE WHEN variant = 'treatment' THEN 1 END) AS n_t,
    AVG(CASE WHEN variant = 'control' THEN pre_experiment_spend_usd END) AS m_c,
    AVG(CASE WHEN variant = 'treatment' THEN pre_experiment_spend_usd END) AS m_t,
    VAR_SAMP(CASE WHEN variant = 'control' THEN pre_experiment_spend_usd END) AS v_c,
    VAR_SAMP(CASE WHEN variant = 'treatment' THEN pre_experiment_spend_usd END) AS v_t
  FROM experiment_assignments
  WHERE experiment_id = 1
  GROUP BY 1
  HAVING COUNT(CASE WHEN variant = 'control' THEN 1 END) >= 30
),
estadisticos AS (
  SELECT
    cohorte_dia,
    ROUND(m_t - m_c, 2) AS diff_pre_usd,
    ABS(m_t - m_c) / SQRT(v_c / n_c + v_t / n_t) AS z_abs
  FROM diario
),
pvalores AS (
  SELECT
    cohorte_dia,
    diff_pre_usd,
    ROUND(z_abs, 3) AS z_abs,
    ROUND(2.0 / (1.0 + EXP(0.07056 * POWER(z_abs, 3) + 1.5976 * z_abs)), 5) AS p_valor,
    ROW_NUMBER() OVER (ORDER BY z_abs DESC) AS rango_k,
    COUNT(*) OVER () AS m_total
  FROM estadisticos
)
SELECT
  rango_k,
  cohorte_dia,
  diff_pre_usd,
  z_abs,
  p_valor,
  ROUND(0.05 * rango_k / m_total, 5) AS umbral_bh,
  CASE WHEN p_valor <= 0.05 THEN 'FALSO_POSITIVO' ELSE 'OK' END AS decision_ingenua,
  CASE WHEN p_valor <= 0.05 * rango_k / m_total THEN 'RECHAZAR' ELSE 'RETENER_H0' END AS decision_bh
FROM pvalores
ORDER BY rango_k
LIMIT 5;`,
        expectedOutput: [
          { rango_k: 1, cohorte_dia: '2024-02-06', diff_pre_usd: 14.34, z_abs: 2.78, p_valor: 0.00516, umbral_bh: 0.00333, decision_ingenua: 'FALSO_POSITIVO', decision_bh: 'RETENER_H0' },
          { rango_k: 2, cohorte_dia: '2024-02-02', diff_pre_usd: 7.84, z_abs: 1.609, p_valor: 0.10792, umbral_bh: 0.00667, decision_ingenua: 'OK', decision_bh: 'RETENER_H0' },
          { rango_k: 3, cohorte_dia: '2024-02-13', diff_pre_usd: -8.08, z_abs: 1.553, p_valor: 0.12073, umbral_bh: 0.01, decision_ingenua: 'OK', decision_bh: 'RETENER_H0' },
          { rango_k: 4, cohorte_dia: '2024-02-07', diff_pre_usd: 7.45, z_abs: 1.349, p_valor: 0.17774, umbral_bh: 0.01333, decision_ingenua: 'OK', decision_bh: 'RETENER_H0' },
          { rango_k: 5, cohorte_dia: '2024-02-12', diff_pre_usd: -7.17, z_abs: 1.272, p_valor: 0.20371, umbral_bh: 0.01667, decision_ingenua: 'OK', decision_bh: 'RETENER_H0' },
        ],
        annotation: 'En el gasto pre-experimento (donde H0 es verdadera en todos los días), la cohorte 2024-02-06 engaña al umbral ingenuo (p = 0.00516 <= 0.05), pero el umbral BH en rango 1 (0.00333) bloquea el falso positivo.',
      },
    },
    {
      id: 'implementacion-sql-bh',
      heading: 'Implementación en SQL y elección operativa entre FWER y FDR',
      body: `Para implementar Benjamini-Hochberg en DuckDB, calculamos primero el estadístico de Welch $|z|$ de cada subgrupo. Luego obtenemos el valor $p$ bilateral mediante la aproximación logística de alta precisión de Bowling et al.

$$p \\approx \\frac{2}{1 + \\exp(0.07056\\,|z|^3 + 1.5976\\,|z|)}.$$

En una segunda CTE aplicamos dos funciones de ventana sobre la colección de pruebas. Usamos \`ROW_NUMBER() OVER (ORDER BY z_abs DESC) AS rango_k\` para ordenar de menor a mayor valor $p$, y \`COUNT(*) OVER () AS m_total\` para contar el total de hipótesis. Con ambas columnas disponibles en cada fila, la cota de Bonferroni es \`0.05 / m_total\` y la cota escalonada de Benjamini-Hochberg es \`0.05 * rango_k / m_total\`.

En la práctica empresarial debemos elegir el criterio según el costo del error. Conviene usar **FWER (Bonferroni o Holm)** al evaluar pocas métricas de decisión final o *guardrails* críticos donde un falso positivo causaría pérdidas severas. En cambio, conviene usar **FDR (Benjamini-Hochberg)** al explorar decenas de segmentos, cohortes o tiendas buscando maximizar descubrimientos reales con una proporción acotada de falsas alarmas.`,
    },
  ],
  workedExample: {
    title: 'Bonferroni vs. Benjamini-Hochberg en cohortes de EXP-CHECKOUT-1STEP',
    problem: 'Compara el impacto de evaluar m = 15 cohortes diarias en EXP-CHECKOUT-1STEP sobre la métrica primaria post_experiment_spend_usd: primero cuantifica cómo explota la FWER según el número de comparaciones m, y luego contrasta cuántas cohortes superan Bonferroni frente a Benjamini-Hochberg (q = 0.05).',
    steps: [
      {
        title: 'Paso 1: Cuantificación de la inflación de FWER y del umbral de Bonferroni',
        explanation: 'Verificamos en SQL cómo crece la probabilidad de al menos un falso positivo 1 - (1 - 0.05)^m cuando aumentamos el número de cortes evaluados.',
        rationale: 'Verificamos en SQL cómo crece la probabilidad de al menos un falso positivo 1 - (1 - 0.05)^m cuando aumentamos el número de cortes evaluados.',
        code: `SELECT
  m AS num_hipotesis,
  ROUND(1.0 - POWER(1.0 - 0.05, m), 4) AS fwer_sin_ajuste,
  ROUND(0.05 / m, 5) AS alpha_bonferroni
FROM UNNEST([1, 5, 10, 15, 20, 50]) AS t(m)
ORDER BY m;`,
        output: `num_hipotesis | fwer_sin_ajuste | alpha_bonferroni
--------------+-----------------+-----------------
1             | 0.05            | 0.05
5             | 0.2262          | 0.01
10            | 0.4013          | 0.005
15            | 0.5367          | 0.00333
20            | 0.6415          | 0.0025
50            | 0.9231          | 0.001`,
        takeaway: 'Con m = 15 cohortes el riesgo de al menos un falso positivo sin ajuste supera el 53.67 %, y con m = 50 alcanza el 92.31 %.',
      },
      {
        title: 'Paso 2: Comparación de potencia entre Bonferroni y Benjamini-Hochberg en post_experiment_spend_usd',
        explanation: 'Al evaluar las 15 cohortes diarias post-experimento, Bonferroni exige p <= 0.00333 para todas, mientras que BH relaja el umbral linealmente según el rango k.',
        rationale: 'Al evaluar las 15 cohortes diarias post-experimento, Bonferroni exige p <= 0.00333 para todas, mientras que BH relaja el umbral linealmente según el rango k.',
        code: `WITH diario AS (
  SELECT
    CAST(DATE_TRUNC('day', assigned_ts) AS DATE)::VARCHAR AS cohorte_dia,
    COUNT(CASE WHEN variant = 'control' THEN 1 END) AS n_c,
    COUNT(CASE WHEN variant = 'treatment' THEN 1 END) AS n_t,
    AVG(CASE WHEN variant = 'control' THEN post_experiment_spend_usd END) AS m_c,
    AVG(CASE WHEN variant = 'treatment' THEN post_experiment_spend_usd END) AS m_t,
    VAR_SAMP(CASE WHEN variant = 'control' THEN post_experiment_spend_usd END) AS v_c,
    VAR_SAMP(CASE WHEN variant = 'treatment' THEN post_experiment_spend_usd END) AS v_t
  FROM experiment_assignments
  WHERE experiment_id = 1
  GROUP BY 1
  HAVING COUNT(CASE WHEN variant = 'control' THEN 1 END) >= 30
),
pvalores AS (
  SELECT
    cohorte_dia,
    ROUND(m_t - m_c, 2) AS lift_usd,
    ROUND(ABS(m_t - m_c) / SQRT(v_c / n_c + v_t / n_t), 3) AS z_abs,
    ROUND(2.0 / (1.0 + EXP(0.07056 * POWER(ABS(m_t - m_c) / SQRT(v_c / n_c + v_t / n_t), 3) + 1.5976 * (ABS(m_t - m_c) / SQRT(v_c / n_c + v_t / n_t)))), 5) AS p_valor,
    ROW_NUMBER() OVER (ORDER BY ABS(m_t - m_c) / SQRT(v_c / n_c + v_t / n_t) DESC) AS rango_k,
    COUNT(*) OVER () AS m_total
  FROM diario
)
SELECT
  rango_k,
  cohorte_dia,
  lift_usd,
  p_valor,
  ROUND(0.05 / m_total, 5) AS umbral_bonferroni,
  ROUND(0.05 * rango_k / m_total, 5) AS umbral_bh,
  CASE WHEN p_valor <= 0.05 / m_total THEN 'SI' ELSE 'NO' END AS sig_bonferroni,
  CASE WHEN p_valor <= 0.05 * rango_k / m_total THEN 'SI' ELSE 'NO' END AS sig_bh
FROM pvalores
WHERE rango_k <= 8
ORDER BY rango_k;`,
        output: `rango_k | cohorte_dia | lift_usd | p_valor | umbral_bonferroni | umbral_bh | sig_bonferroni | sig_bh
--------+-------------+----------+---------+-------------------+-----------+----------------+-------
1       | 2024-02-06  | 16.26    | 0.00000 | 0.00333           | 0.00333   | SI             | SI
2       | 2024-02-02  | 10.18    | 0.00186 | 0.00333           | 0.00667   | SI             | SI
3       | 2024-02-07  | 11.78    | 0.00200 | 0.00333           | 0.01000   | SI             | SI
4       | 2024-02-05  | 10.65    | 0.00296 | 0.00333           | 0.01333   | SI             | SI
5       | 2024-02-14  | 9.37     | 0.00705 | 0.00333           | 0.01667   | NO             | SI
6       | 2024-02-01  | 9.23     | 0.01335 | 0.00333           | 0.02000   | NO             | SI
7       | 2024-02-15  | 8.29     | 0.01699 | 0.00333           | 0.02333   | NO             | SI
8       | 2024-02-11  | 6.31     | 0.05897 | 0.00333           | 0.02667   | NO             | NO`,
        takeaway: 'Bonferroni descarta los rangos 5, 6 y 7 pese a tener lifts de +8.29 a +9.37 USD, mientras que Benjamini-Hochberg detecta las 7 cohortes con señal real y frena en el rango 8.',
      },
    ],
  },
  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: 'Un analista evalúa m = 20 segmentos independientes en un experimento donde ningún segmento tiene efecto real (H0 verdadera en todos) usando alfa = 0.05 sin ajuste. ¿Cuál es la probabilidad de encontrar al menos un segmento "significativo" por azar?',
      options: [
        {
          id: 'a',
          text: 'Exactamente 5.0 %, porque el nivel de significancia alfa se mantiene constante en cada prueba.',
          correct: false,
          feedback: 'Incorrecto. El 5 % es el riesgo individual de cada prueba aislada, pero el riesgo acumulado sobre la familia de 20 pruebas se compone multiplicativamente.',
        },
        {
          id: 'b',
          text: 'Alrededor del 64.15 %, dado que FWER = 1 - (1 - 0.05)^20 = 1 - 0.3585 = 0.6415.',
          correct: true,
          feedback: 'Correcto. Al realizar 20 comparaciones independientes a nivel 0.05, es más probable obtener al menos un falso positivo (64.15 %) que no obtener ninguno (35.85 %).',
        },
        {
          id: 'c',
          text: 'Exactamente 100 %, porque 20 * 0.05 = 1.00.',
          correct: false,
          feedback: 'Incorrecto. La suma m * alfa es la cota superior de la unión de Boole (y el número esperado de falsos positivos), no la probabilidad exacta de eventos independientes.',
        },
        {
          id: 'd',
          text: 'Menos del 1 %, porque al dividir la muestra en 20 segmentos disminuye el tamaño muestral de cada corte.',
          correct: false,
          feedback: 'Incorrecto. Menor tamaño muestral reduce la potencia ante efectos reales, pero bajo H0 un test válido sigue rechazando el 5 % de las veces en cada segmento.',
        },
      ],
      correctOptionId: 'b',
      explanation: 'Bajo independencia, la probabilidad de no cometer ningún error en m = 20 pruebas es 0.95^20 ≈ 0.3585, por lo que la tasa de error familiar FWER es 1 - 0.3585 = 64.15 %.',
    },
    {
      id: 'c2',
      type: 'mcq',
      prompt: 'En una familia de m = 10 hipótesis ordenadas de menor a mayor valor p, ¿cuál es el umbral crítico de Benjamini-Hochberg para la hipótesis que ocupa el rango k = 4 cuando se fija q = 0.05?',
      options: [
        {
          id: 'a',
          text: '0.005, porque todas las hipótesis deben compararse contra q / m = 0.05 / 10.',
          correct: false,
          feedback: 'Incorrecto. Ese es el umbral uniforme de Bonferroni (q / m), que corresponde únicamente al rango k = 1 en Benjamini-Hochberg.',
        },
        {
          id: 'b',
          text: '0.020, porque el umbral escalonado para el rango k = 4 es (4 / 10) * 0.05 = 0.020.',
          correct: true,
          feedback: 'Correcto. En Benjamini-Hochberg cada posición ordenada k tiene cota (k / m) * q; para k = 4 y m = 10 resulta 0.4 * 0.05 = 0.020.',
        },
        {
          id: 'c',
          text: '0.050, porque Benjamini-Hochberg no ajusta los primeros cinco rangos de la tabla.',
          correct: false,
          feedback: 'Incorrecto. Solo el último rango k = m tiene cota igual a q = 0.050; todos los rangos previos tienen cotas estrictamente menores.',
        },
        {
          id: 'd',
          text: '0.0071, calculado como 0.05 / (10 - 4 + 1) = 0.05 / 7.',
          correct: false,
          feedback: 'Incorrecto. La fórmula q / (m - k + 1) pertenece al procedimiento step-down de Holm-Bonferroni para controlar FWER, no a Benjamini-Hochberg.',
        },
      ],
      correctOptionId: 'b',
      explanation: 'El procedimiento de Benjamini-Hochberg asigna al rango ordenado k la cota lineal (k / m) * q; con k = 4, m = 10 y q = 0.05 se obtiene (4 / 10) * 0.05 = 0.020.',
    },
    {
      id: 'c3',
      type: 'mcq',
      prompt: '¿Qué diferencia conceptual distingue el control de FWER (Bonferroni) frente al control de FDR (Benjamini-Hochberg)?',
      options: [
        {
          id: 'a',
          text: 'FWER controla la probabilidad de cometer al menos un falso positivo en toda la familia; FDR controla la proporción esperada de falsos positivos entre los rechazos.',
          correct: true,
          feedback: 'Correcto. FWER acota Pr(V >= 1), mientras que FDR acota E[V / max(R, 1)], permitiendo mayor potencia cuando existen múltiples efectos verdaderos.',
        },
        {
          id: 'b',
          text: 'FWER solo funciona con muestras mayores a 1,000 usuarios y FDR solo funciona con muestras pequeñas.',
          correct: false,
          feedback: 'Incorrecto. Ambos métodos operan sobre la colección de valores p con independencia del tamaño muestral que los generó.',
        },
        {
          id: 'c',
          text: 'FDR garantiza que nunca ocurrirá ningún falso positivo, mientras que FWER acepta hasta un 5 % de descubrimientos falsos.',
          correct: false,
          feedback: 'Incorrecto. Es exactamente al revés: FWER es más estricto porque penaliza cualquier falso positivo aislado.',
        },
        {
          id: 'd',
          text: 'Bonferroni requiere ordenar los valores p de menor a mayor y Benjamini-Hochberg aplica un corte fijo sin ordenar.',
          correct: false,
          feedback: 'Incorrecto. Bonferroni aplica la cota fija alfa / m sin necesidad de ordenar, mientras que Benjamini-Hochberg depende del rango ordenado k.',
        },
      ],
      correctOptionId: 'a',
      explanation: 'Controlar FWER protege contra la ocurrencia de incluso un solo error Tipo I, mientras que controlar FDR garantiza que, en promedio, a lo sumo una fracción q de los hallazgos declarados sean falsas alarmas.',
    },
  ],
  practice: {
    type: 'sql',
    title: 'Práctica: Auditoría Benjamini-Hochberg vs. Bonferroni en cohortes de EXP-CHECKOUT-1STEP',
    prompt: 'Evalúa las 15 cohortes diarias completas (HAVING COUNT de control >= 30) del experimento experiment_id = 1 sobre post_experiment_spend_usd. Ordena por z_abs descendente para asignar rango_k (1 a 15) y devuelve únicamente las primeras 8 filas (WHERE rango_k <= 8) con las columnas exactas: rango_k, cohorte_dia, lift_usd, z_abs, p_valor, umbral_bonferroni, umbral_bh, sig_bonferroni y sig_bh, ordenadas por rango_k ascendente.',
    starterCode: `WITH diario AS (
  SELECT
    CAST(DATE_TRUNC('day', assigned_ts) AS DATE)::VARCHAR AS cohorte_dia,
    COUNT(CASE WHEN variant = 'control' THEN 1 END) AS n_c,
    COUNT(CASE WHEN variant = 'treatment' THEN 1 END) AS n_t,
    AVG(CASE WHEN variant = 'control' THEN post_experiment_spend_usd END) AS m_c,
    AVG(CASE WHEN variant = 'treatment' THEN post_experiment_spend_usd END) AS m_t,
    VAR_SAMP(CASE WHEN variant = 'control' THEN post_experiment_spend_usd END) AS v_c,
    VAR_SAMP(CASE WHEN variant = 'treatment' THEN post_experiment_spend_usd END) AS v_t
  FROM experiment_assignments
  WHERE experiment_id = 1
  GROUP BY 1
  HAVING COUNT(CASE WHEN variant = 'control' THEN 1 END) >= 30
)
-- Calcula estadisticos, p_valor, rango_k y compara contra umbral_bonferroni y umbral_bh
SELECT
  1 AS rango_k,
  cohorte_dia,
  ROUND(m_t - m_c, 2) AS lift_usd
FROM diario
ORDER BY cohorte_dia
LIMIT 8;`,
    hints: [
      'Crea una CTE estadisticos que calcule lift_usd = ROUND(m_t - m_c, 2) y el estadístico sin redondear z_raw = ABS(m_t - m_c) / SQRT(v_c / n_c + v_t / n_t).',
      'En una CTE pvalores calcula ROUND(z_raw, 3) AS z_abs, ROUND(2.0 / (1.0 + EXP(0.07056 * POWER(z_raw, 3) + 1.5976 * z_raw)), 5) AS p_valor, ROW_NUMBER() OVER (ORDER BY z_raw DESC) AS rango_k y COUNT(*) OVER () AS m_total.',
      'En el SELECT final filtra WHERE rango_k <= 8, proyecta ROUND(0.05 / m_total, 5) AS umbral_bonferroni, ROUND(0.05 * rango_k / m_total, 5) AS umbral_bh y evalúa CASE WHEN p_valor <= ... THEN \'SI\' ELSE \'NO\' END para sig_bonferroni y sig_bh.',
    ],
    solution: `WITH diario AS (
  SELECT
    CAST(DATE_TRUNC('day', assigned_ts) AS DATE)::VARCHAR AS cohorte_dia,
    COUNT(CASE WHEN variant = 'control' THEN 1 END) AS n_c,
    COUNT(CASE WHEN variant = 'treatment' THEN 1 END) AS n_t,
    AVG(CASE WHEN variant = 'control' THEN post_experiment_spend_usd END) AS m_c,
    AVG(CASE WHEN variant = 'treatment' THEN post_experiment_spend_usd END) AS m_t,
    VAR_SAMP(CASE WHEN variant = 'control' THEN post_experiment_spend_usd END) AS v_c,
    VAR_SAMP(CASE WHEN variant = 'treatment' THEN post_experiment_spend_usd END) AS v_t
  FROM experiment_assignments
  WHERE experiment_id = 1
  GROUP BY 1
  HAVING COUNT(CASE WHEN variant = 'control' THEN 1 END) >= 30
),
estadisticos AS (
  SELECT
    cohorte_dia,
    ROUND(m_t - m_c, 2) AS lift_usd,
    ABS(m_t - m_c) / SQRT(v_c / n_c + v_t / n_t) AS z_raw
  FROM diario
),
pvalores AS (
  SELECT
    cohorte_dia,
    lift_usd,
    ROUND(z_raw, 3) AS z_abs,
    ROUND(2.0 / (1.0 + EXP(0.07056 * POWER(z_raw, 3) + 1.5976 * z_raw)), 5) AS p_valor,
    ROW_NUMBER() OVER (ORDER BY z_raw DESC) AS rango_k,
    COUNT(*) OVER () AS m_total
  FROM estadisticos
)
SELECT
  rango_k,
  cohorte_dia,
  lift_usd,
  z_abs,
  p_valor,
  ROUND(0.05 / m_total, 5) AS umbral_bonferroni,
  ROUND(0.05 * rango_k / m_total, 5) AS umbral_bh,
  CASE WHEN p_valor <= 0.05 / m_total THEN 'SI' ELSE 'NO' END AS sig_bonferroni,
  CASE WHEN p_valor <= 0.05 * rango_k / m_total THEN 'SI' ELSE 'NO' END AS sig_bh
FROM pvalores
WHERE rango_k <= 8
ORDER BY rango_k;`,
    solutionExplanation: 'Al ordenar las 15 cohortes por significancia con ROW_NUMBER(), comprobamos que el umbral escalonado BH (0.05 * k / 15) rescata los rangos 5, 6 y 7 que Bonferroni descartaba por exceso de severidad, deteniéndose limpiamente antes del rango 8 (p = 0.05897 > 0.02667).',
    expectedOutputTable: [
      { rango_k: 1, cohorte_dia: '2024-02-06', lift_usd: 16.26, z_abs: 4.627, p_valor: 0, umbral_bonferroni: 0.00333, umbral_bh: 0.00333, sig_bonferroni: 'SI', sig_bh: 'SI' },
      { rango_k: 2, cohorte_dia: '2024-02-02', lift_usd: 10.18, z_abs: 3.079, p_valor: 0.00186, umbral_bonferroni: 0.00333, umbral_bh: 0.00667, sig_bonferroni: 'SI', sig_bh: 'SI' },
      { rango_k: 3, cohorte_dia: '2024-02-07', lift_usd: 11.78, z_abs: 3.058, p_valor: 0.002, umbral_bonferroni: 0.00333, umbral_bh: 0.01, sig_bonferroni: 'SI', sig_bh: 'SI' },
      { rango_k: 4, cohorte_dia: '2024-02-05', lift_usd: 10.65, z_abs: 2.947, p_valor: 0.00296, umbral_bonferroni: 0.00333, umbral_bh: 0.01333, sig_bonferroni: 'SI', sig_bh: 'SI' },
      { rango_k: 5, cohorte_dia: '2024-02-14', lift_usd: 9.37, z_abs: 2.681, p_valor: 0.00705, umbral_bonferroni: 0.00333, umbral_bh: 0.01667, sig_bonferroni: 'NO', sig_bh: 'SI' },
      { rango_k: 6, cohorte_dia: '2024-02-01', lift_usd: 9.23, z_abs: 2.468, p_valor: 0.01335, umbral_bonferroni: 0.00333, umbral_bh: 0.02, sig_bonferroni: 'NO', sig_bh: 'SI' },
      { rango_k: 7, cohorte_dia: '2024-02-15', lift_usd: 8.29, z_abs: 2.382, p_valor: 0.01699, umbral_bonferroni: 0.00333, umbral_bh: 0.02333, sig_bonferroni: 'NO', sig_bh: 'SI' },
      { rango_k: 8, cohorte_dia: '2024-02-11', lift_usd: 6.31, z_abs: 1.889, p_valor: 0.05897, umbral_bonferroni: 0.00333, umbral_bh: 0.02667, sig_bonferroni: 'NO', sig_bh: 'NO' },
    ],
  },
  roleNotes: {
    da: 'Como analista de datos, cada vez que un tablero de experimentación desglose resultados por país, categoría o cohorte, debes mostrar la columna de decisión ajustada por Benjamini-Hochberg para evitar cazar ruido.',
    ds: 'Desde ciencia de datos, cuando las pruebas múltiples presentan correlación negativa arbitraria entre métricas, puedes sustituir la cota de Benjamini-Hochberg por el ajuste de Benjamini-Yekutieli dividiendo entre el número armónico H(m).',
    de: 'Como ingeniero de datos, centraliza el cálculo de rangos y umbrales q * k / m en la vista semántica del motor de experimentos para que todas las herramientas de BI consuman la misma bandera de significancia ajustada.',
  },
  summary: [
    'Evaluar m pruebas independientes con umbral fijo alfa eleva el riesgo familiar a FWER = 1 - (1 - alfa)^m.',
    'La corrección de Bonferroni divide alfa entre m para acotar la FWER, pero sacrifica potencia estadística cuando m crece.',
    'La tasa de descubrimientos falsos (FDR) mide la fracción esperada de falsas alarmas entre todas las hipótesis rechazadas.',
    'Benjamini-Hochberg ordena los valores p de menor a mayor y compara cada rango k contra la cota (k / m) * q.',
  ],
  flashcards: [
    {
      id: 'f1',
      front: '¿Qué mide exactamente la tasa de error por familia (FWER)?',
      back: 'La probabilidad de cometer al menos un error Tipo I (falso positivo, V >= 1) dentro de una colección simultánea de m pruebas de hipótesis.',
    },
    {
      id: 'f2',
      front: '¿Qué mide la tasa de descubrimientos falsos (FDR)?',
      back: 'El valor esperado del cociente V / max(R, 1), es decir, la proporción promedio de falsos positivos entre todas las hipótesis rechazadas.',
    },
    {
      id: 'f3',
      front: '¿Cuál es la regla de rechazo del procedimiento escalonado de Benjamini-Hochberg?',
      back: 'Ordenar los valores p de menor a mayor (rango k = 1..m), identificar el mayor rango k* que cumple p_(k*) <= (k* / m) * q y rechazar todas las hipótesis con rango 1 <= k <= k*.',
    },
    {
      id: 'f4',
      front: '¿Por qué el rango k = 1 de Benjamini-Hochberg coincide con el umbral de Bonferroni?',
      back: 'Porque al sustituir k = 1 en la cota (k / m) * q se obtiene q / m; si ni siquiera el valor p más pequeño supera q / m, ninguna hipótesis puede rechazarse bajo independencia.',
    },
  ],
  glossaryTerms: [
    'tasa-error-familiar-fwer',
    'procedimiento-benjamini-hochberg',
  ],
  relatedLessons: [
    'da3-experimentos-01-ab-testing-cuped',
    'da3-experimentos-03-pruebas-secuenciales-msprt',
    'da3-experimentos-05-efectos-red-interferencia-switchback',
  ],
  sources: [
    {
      title: 'Controlling the False Discovery Rate: A Practical and Powerful Approach to Multiple Testing (JRSS-B 1995)',
      url: 'https://www.math.tau.ac.il/~ybenja/MyPapers/benjamini_hochberg1995.pdf',
      publisher: 'Royal Statistical Society',
      accessed: '2026-10-29',
      supports: 'Artículo fundacional de Benjamini y Hochberg que introduce la FDR y demuestra el algoritmo escalonado.',
    },
    {
      title: 'statsmodels.stats.multitest.multipletests Official Documentation',
      url: 'https://www.statsmodels.org/stable/generated/statsmodels.stats.multitest.multipletests.html',
      publisher: 'Statsmodels Developers',
      accessed: '2026-10-29',
      supports: 'Comparación técnica entre métodos FWER (Bonferroni, Holm) y métodos FDR (fdr_bh, fdr_by).',
    },
    {
      title: 'scipy.stats.false_discovery_control Reference Guide',
      url: 'https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.false_discovery_control.html',
      publisher: 'SciPy Community',
      accessed: '2026-10-29',
      supports: 'Ajuste de valores p bajo el procedimiento de Benjamini-Hochberg y condiciones de dependencia.',
    },
  ],
  aiNotes: 'Ayuda al estudiante a distinguir entre el riesgo por familia FWER (donde un solo error cuenta como fallo total) y el control de FDR con Benjamini-Hochberg. Recuérdale que en SQL el ordenamiento ROW_NUMBER() OVER (ORDER BY z_raw DESC) equivale a ordenar por p_valor ascendente y que m_total se obtiene con COUNT(*) OVER () antes de aplicar cualquier filtro WHERE rango_k <= 8.',
};

export default lesson;
