export default {
  id: 'da4-causalidad-03-control-sintetico-emparejamiento',
  moduleId: 'da4-causalidad',
  track: 'da',
  level: 4,
  order: 3,
  title: 'Control sintético y emparejamiento (matching) en tiendas',
  subtitle:
    'Control sintético y emparejamiento (matching) para intervenciones en pocas tiendas o regiones',
  durationMinutes: 25,
  prerequisites: [
    'da4-causalidad-01-diferencias-en-diferencias-did',
    'da4-causalidad-02-regresion-discontinua-rdd',
  ],
  datasets: ['orders', 'stores', 'calendar'],
  hook: {
    question:
      'Operaciones despliega una remodelación de cafetería y envío exprés únicamente en Tienda Salamanca (STR-ES-01) durante FY24-Q3. Al buscar un grupo de control entre las tiendas de América Latina, descubres que el promedio simple de las sucursales donantes supera a Salamanca entre 20 y 42 USD en todos los trimestres previos. ¿Cómo construyes un contrafactual creíble cuando solo una tienda fue tratada o cuando la composición de canales difiere drásticamente entre regiones?',
    context:
      'Construcción de contrafactuales mediante emparejamiento por celdas y control sintético en orders, stores y calendar.',
  },
  objectives: [
    'Aplicar emparejamiento exacto por celdas (matching) para eliminar confusión por mezcla de canales y auditar la condición de soporte común.',
    'Construir un control sintético como combinación lineal convexa de tiendas donantes que minimice el error de ajuste preintervención.',
    'Evaluar la brecha causal postintervención frente al error cuadrático medio previo (RMSPE) y las pruebas de placebo en el espacio.',
  ],
  sections: [
    {
      id: 'emparejamiento-celdas-soporte-comun',
      heading: 'Emparejamiento exacto por estratos y condición de soporte común',
      body: 'Cuando comparamos dos regiones cuyas tiendas tienen distinta mezcla de formatos (`store_type`) y dispositivos de compra (`device_type`), la media global mezcla manzanas con peras. El **emparejamiento exacto o por celdas** (*coarsened exact matching*) divide la muestra en estratos discretos idénticos de las covariables previas (por ejemplo, `store_type = \'retail\'` y `device_type = \'mobile\'`), calcula la diferencia dentro de cada celda y luego promedia ponderando por el peso de los tratados ($w_s = N_{T,s} / N_T$) para estimar el **ATT**.\n\nEsta técnica hace visible un requisito que las regresiones lineales suelen ocultar: la **condición de soporte común** (*common support* o *positivity*). Para estimar el efecto sobre los tratados, toda celda que contenga unidades tratadas ($N_{T,s} > 0$) debe contar también con unidades de control ($N_{C,s} > 0$).\n\nAl cruzar `store_type` y `device_type` entre las regiones `Andina` y `Cono Sur` durante el segundo semestre de 2024, descubrimos que en `Andina` la tienda insignia (`flagship`) registra `344` pedidos en `desktop`, pero `0` en `mobile` y `0` en `pos_tienda`, mientras que en `Cono Sur` sí existen pedidos en las tres celdas (`78`, `79` y `87`). Sin auditar la tabla de celdas, una comparación agregada incluiría controles de celdas donde la región tratada ni siquiera opera.',
      formula: {
        latex:
          '\\hat{\\tau}_{\\text{ATT}} = \\sum_{s \\in \\mathcal{S}} \\left(\\frac{N_{T,s}}{N_T}\\right) \\left(\\bar{Y}_{T,s} - \\bar{Y}_{C,s}\\right)',
        explanation:
          'Cada estrato s con soporte común aporta su diferencia interna de medias ponderada por la fracción de unidades tratadas que caen en ese estrato.',
      },
      callout: {
        type: 'KeyIdea',
        title: 'Emparejar impide extrapolar en silencio',
        body: 'Mientras una regresión lineal proyecta una recta sobre celdas vacías sin avisar, el emparejamiento por celdas expone de inmediato cualquier estrato con cero controles o cero tratados.',
      },
    },
    {
      id: 'cuando-hay-una-sola-unidad-tratada',
      heading: 'Del emparejamiento al control sintético para una sola tienda',
      body: '¿Qué ocurre cuando la intervención se ejecuta en **una única tienda** —como Tienda Salamanca (`STR-ES-01`, `store_id = 10`) en `FY24-Q3`— y ninguna sucursal individual comparte su nivel ni su trayectoria previa? Si tomamos tres tiendas donantes no tratadas (`STR-AR-01`, `STR-CO-02` y `STR-CL-02`) y calculamos su promedio simple trimestral, el comparador queda en `435.75 USD` en `FY23-Q4`, `399.55 USD` en `FY24-Q1` y `420.49 USD` en `FY24-Q2`, muy por encima de los valores reales de Salamanca (`393.72`, `380.35` y `390.00 USD`).\n\nPropuesto por Abadie, Diamond y Hainmueller, el método de **control sintético** resuelve este problema construyendo una tienda "gemela sintética" mediante un promedio ponderado de las $J$ tiendas del **grupo donante** (*donor pool*). A diferencia de una regresión ordinaria, los pesos $w_j$ deben cumplir dos restricciones de combinación convexa: no ser negativos ($w_j \\ge 0$) y sumar exactamente uno ($\\sum_{j=2}^{J+1} w_j = 1$).\n\nEstas dos restricciones evitan la extrapolación fuera del rango de los datos y garantizan una interpretación transparente: el gemelo sintético de Tienda Salamanca se compone de un `55 %` de `STR-AR-01` (Palermo Soho), un `35 %` de `STR-CO-02` (El Poblado) y un `10 %` de `STR-CL-02` (Las Condes).',
      visual: {
        type: 'mermaid',
        spec: 'flowchart LR\n  D1["Donante STR-AR-01\\nPeso w_1 = 0.55"] --> SC["Tienda Salamanca Sintética\\n0.55*AR01 + 0.35*CO02 + 0.10*CL02"]\n  D2["Donante STR-CO-02\\nPeso w_2 = 0.35"] --> SC\n  D3["Donante STR-CL-02\\nPeso w_3 = 0.10"] --> SC\n  SC --> GAP["Brecha causal en FY24-Q3\\nReal (461.29) - Sintético (377.42) = +83.87 USD"]\n  REAL["Tienda Salamanca Real\\n(store_id = 10)"] --> GAP',
        caption:
          'Construcción del gemelo sintético convexo de Tienda Salamanca a partir de tres tiendas donantes.',
      },
      codeExample: {
        language: 'sql',
        code: `WITH trimestral AS (
  SELECT
    c.fiscal_quarter,
    AVG(o.total_usd) FILTER (WHERE o.store_id = 10) AS real_es01,
    AVG(o.total_usd) FILTER (WHERE o.store_id = 8) AS ar01,
    AVG(o.total_usd) FILTER (WHERE o.store_id = 5) AS co02,
    AVG(o.total_usd) FILTER (WHERE o.store_id = 7) AS cl02
  FROM orders o
  JOIN calendar c ON o.order_date = c.calendar_date
  WHERE o.status = 'completed'
    AND o.store_id IN (5, 7, 8, 10)
    AND c.fiscal_quarter IN ('FY23-Q4', 'FY24-Q1', 'FY24-Q2', 'FY24-Q3')
  GROUP BY 1
)
SELECT
  fiscal_quarter,
  ROUND(real_es01, 2) AS real_es01_usd,
  ROUND(0.55 * ar01 + 0.35 * co02 + 0.10 * cl02, 2) AS sintetico_usd
FROM trimestral
ORDER BY 1;`,
        caption:
          'Evaluación en SQL de una combinación convexa de tiendas donantes trimestre a trimestre.',
      },
    },
    {
      id: 'ajuste-preintervencion-rmspe',
      heading: 'Calidad de ajuste preintervención (RMSPE) y brecha causal',
      body: 'En un estudio de control sintético, la credibilidad del efecto estimado en el periodo postintervención depende por completo de cuán bien replica el gemelo sintético a la tienda tratada **antes** de la intervención. La métrica estándar para cuantificar esa fidelidad es la raíz del error cuadrático medio de predicción preintervención (**RMSPE preintervención**).\n\nVeamos qué logra la combinación convexa $0.55 \\times \\text{AR-01} + 0.35 \\times \\text{CO-02} + 0.10 \\times \\text{CL-02}$ para Tienda Salamanca en los tres trimestres previos al piloto:\n\nEn `FY23-Q4`, el valor real es `393.72 USD` y el sintético `399.34 USD` (brecha de `-5.62 USD`). En `FY24-Q1`, el real es `380.35 USD` y el sintético `377.10 USD` (brecha de `+3.25 USD`). En `FY24-Q2`, el real es `390.00 USD` y el sintético `396.98 USD` (brecha de `-6.97 USD`). El RMSPE preintervención es $\\sqrt{(5.62^2 + 3.25^2 + 6.97^2)/3} = 5.50\\text{ USD}$, menos del `1.5 %` del ticket basal.\n\nCuando el piloto temporal se activa en `FY24-Q3`, la brecha entre Salamanca (`461.29 USD`) y su control sintético (`377.42 USD`) se dispara a `+83.87 USD` (más de `15` veces el RMSPE previo). Y al concluir la campaña temporal en `FY24-Q4`, la brecha regresa a `-5.55 USD` (`392.26` frente a `397.82 USD`), confirmando que el salto estuvo acotado al trimestre de la intervención.',
      visual: {
        type: 'table',
        spec: {
          headers: [
            'Trimestre',
            'Salamanca Real (USD)',
            'Promedio Simple Donantes',
            'Control Sintético (USD)',
            'Brecha Causal (USD)',
          ],
          rows: [
            ['FY23-Q4 (Pre)', '393.72', '435.75', '399.34', '-5.62'],
            ['FY24-Q1 (Pre)', '380.35', '399.55', '377.10', '+3.25'],
            ['FY24-Q2 (Pre)', '390.00', '420.49', '396.98', '-6.97'],
            ['FY24-Q3 (Piloto)', '461.29', '408.67', '377.42', '+83.87'],
            ['FY24-Q4 (Post-piloto)', '392.26', '428.89', '397.82', '-5.55'],
          ],
        },
        caption:
          'Evolución trimestral de Tienda Salamanca frente al promedio simple de donantes y al control sintético convexo.',
      },
    },
    {
      id: 'inferencia-placebos-espacio-requisitos',
      heading: 'Inferencia por placebos en el espacio y reglas del grupo donante',
      body: 'Con una sola tienda tratada ($N_T = 1$), las fórmulas clásicas de error estándar asintótico no aplican. En su lugar, el método de control sintético realiza inferencia mediante **pruebas de placebo en el espacio** (*in-space placebos*): reasignamos ficticiamente el tratamiento a cada una de las tiendas del grupo donante, construimos su propio control sintético y calculamos la razón entre su RMSPE postintervención y su RMSPE preintervención. Si el salto de Tienda Salamanca es extremo frente a la distribución de placebos de las tiendas no tratadas, concluimos que el efecto no se debe al azar.\n\nPara que el grupo donante sea válido, debes verificar tres reglas de higiene antes de ponderar:\n\n1. **Ausencia de tratamiento y de derrame (*no spillover*):** Ninguna tienda donante debe haber recibido una versión parcial del programa ni perder clientes que viajen a la tienda tratada.\n2. **Envoltura convexa (*convex hull*):** Los valores preintervención de la tienda tratada no deben ser los más altos ni los más bajos absolutos de toda la red; de lo contrario, ninguna suma de pesos positivos que sume `1` podrá igualar su nivel.\n3. **Sin sobreajuste en horizontes cortos:** Utiliza pocas tiendas donantes con fundamentos comerciales comparables para no ajustar ruido aleatorio.',
      callout: {
        type: 'warning',
        title: 'Cuidado con unidades fuera de la envoltura convexa',
        body: 'Si la tienda tratada es la número uno en ticket de toda la compañía en todos los trimestres previos, ningún promedio con pesos entre 0 y 1 de tiendas menores logrará reproducir su nivel sin sesgo.',
      },
      codeExample: {
        language: 'sql',
        code: `WITH brechas AS (
  SELECT
    'FY23-Q4' AS q, -5.62 AS gap UNION ALL
  SELECT 'FY24-Q1', 3.25 UNION ALL
  SELECT 'FY24-Q2', -6.97
)
SELECT
  ROUND(SQRT(AVG(POWER(gap, 2))), 2) AS rmspe_pre_usd,
  ROUND(83.87 / SQRT(AVG(POWER(gap, 2))), 2) AS razon_efecto_sobre_rmspe
FROM brechas;`,
        caption:
          'Cálculo del RMSPE preintervención y de la razón señal/ruido del salto en FY24-Q3.',
      },
    },
  ],
  workedExample: {
    title:
      'Auditoría de soporte común y emparejamiento por celdas entre Andina y Cono Sur',
    scenario:
      'Un analista desea comparar el ticket medio del segundo semestre de 2024 (2024-07-01 a 2024-12-31) entre las tiendas físicas (flagship y retail) de la región Andina (tratada) y Cono Sur (control) emparejando exactamente por formato de tienda (store_type) y dispositivo de compra (device_type). Auditaremos la tabla de celdas en SQL para verificar si existe soporte común y calcular los pesos ATT.',
    datasets: ['orders', 'stores'],
    steps: [
      {
        order: 1,
        explanation:
          'Agrupamos los pedidos completados del segundo semestre de 2024 por la celda exacta (store_type, device_type) y contamos cuántos pedidos tratados (Andina) y controles (Cono Sur) caen en cada combinación.',
        code: `SELECT
  s.store_type,
  o.device_type,
  COUNT(*) FILTER (WHERE s.region = 'Andina') AS n_tratados,
  COUNT(*) FILTER (WHERE s.region = 'Cono Sur') AS n_controles,
  ROUND(AVG(o.total_usd) FILTER (WHERE s.region = 'Andina'), 2) AS media_tratados_usd,
  ROUND(AVG(o.total_usd) FILTER (WHERE s.region = 'Cono Sur'), 2) AS media_controles_usd
FROM orders o
JOIN stores s ON o.store_id = s.store_id
WHERE o.status = 'completed'
  AND s.region IN ('Andina', 'Cono Sur')
  AND s.store_type IN ('flagship', 'retail')
  AND o.order_date >= '2024-07-01'
  AND o.order_date < '2025-01-01'
GROUP BY 1, 2
ORDER BY 1, 2;`,
        output: `store_type | device_type | n_tratados | n_controles | media_tratados_usd | media_controles_usd
-----------+-------------+------------+-------------+--------------------+--------------------
flagship   | desktop     | 344        | 78          | 334.58             | 587.29
flagship   | mobile      | 0          | 79          | NULL               | 240.69
flagship   | pos_tienda  | 0          | 87          | NULL               | 435.43
retail     | desktop     | 171        | 263         | 345.57             | 531.22
retail     | mobile      | 318        | 387         | 379.22             | 433.58
retail     | pos_tienda  | 179        | 272         | 542.40             | 287.68`,
      },
      {
        order: 2,
        explanation:
          'Observamos que en flagship x mobile y flagship x pos_tienda no hay unidades tratadas (n_tratados = 0). Al ponderar por el peso de los tratados (peso_att = n_tratados / total_tratados), esas dos celdas reciben peso 0 automáticamente, mientras las 4 celdas con soporte común suman peso 1.0000.',
        code: `WITH celdas AS (
  SELECT
    s.store_type,
    o.device_type,
    COUNT(*) FILTER (WHERE s.region = 'Andina') AS n_tratados,
    COUNT(*) FILTER (WHERE s.region = 'Cono Sur') AS n_controles,
    AVG(o.total_usd) FILTER (WHERE s.region = 'Andina') AS media_tratados,
    AVG(o.total_usd) FILTER (WHERE s.region = 'Cono Sur') AS media_controles
  FROM orders o
  JOIN stores s ON o.store_id = s.store_id
  WHERE o.status = 'completed'
    AND s.region IN ('Andina', 'Cono Sur')
    AND s.store_type IN ('flagship', 'retail')
    AND o.order_date >= '2024-07-01'
    AND o.order_date < '2025-01-01'
  GROUP BY 1, 2
)
SELECT
  store_type,
  device_type,
  n_tratados,
  n_controles,
  ROUND(media_tratados - media_controles, 2) AS efecto_celda_usd,
  ROUND(n_tratados * 1.0 / SUM(n_tratados) OVER (), 4) AS peso_att
FROM celdas
WHERE n_tratados > 0 AND n_controles > 0
ORDER BY store_type, device_type;`,
        output: `store_type | device_type | n_tratados | n_controles | efecto_celda_usd | peso_att
-----------+-------------+------------+-------------+------------------+---------
flagship   | desktop     | 344        | 78          | -252.71          | 0.3399
retail     | desktop     | 171        | 263         | -185.65          | 0.1690
retail     | mobile      | 318        | 387         | -54.37           | 0.3142
retail     | pos_tienda  | 179        | 272         | 254.72           | 0.1769`,
      },
      {
        order: 3,
        explanation:
          'Multiplicamos el efecto de cada celda por su peso_att y sumamos para obtener el ATT emparejado (-89.30 USD), contrastándolo con la heterogeneidad extrema entre canales (+254.72 USD en pos_tienda frente a -252.71 USD en flagship desktop).',
        code: `SELECT
  ROUND(
    (-252.71 * 344 + -185.65 * 171 + -54.37 * 318 + 254.72 * 179) / 1012.0,
    2
  ) AS att_emparejado_usd;`,
        output: `att_emparejado_usd
------------------
-89.29`,
      },
    ],
    takeaway:
      'El emparejamiento por celdas descarta automáticamente los estratos de control donde el grupo tratado no tiene presencia (flagship mobile y pos_tienda) y revela que el signo del efecto se invierte según el canal de venta.',
  },
  checks: [
    {
      id: 'check-sc-pesos-convexos',
      type: 'multiple-choice',
      prompt:
        '¿Por qué el método de control sintético restringe los pesos de las tiendas donantes a ser no negativos (w_j >= 0) y a sumar exactamente uno (suma de w_j = 1)?',
      options: [
        {
          id: 'a',
          label:
            'Para evitar extrapolaciones fuera del rango de las tiendas donantes y asegurar que el contrafactual sea un promedio ponderado interpretable.',
        },
        {
          id: 'b',
          label:
            'Porque en SQL es imposible multiplicar columnas por coeficientes negativos o mayores que uno dentro de SELECT.',
        },
        {
          id: 'c',
          label:
            'Para forzar a que todas las tiendas del catálogo reciban exactamente el mismo peso 1/J.',
        },
        {
          id: 'd',
          label:
            'Porque con pesos entre 0 y 1 ya no es necesario verificar el ajuste en los trimestres previos a la intervención.',
        },
      ],
      correctOptionId: 'a',
      explanation:
        'Las restricciones w_j >= 0 y suma = 1 mantienen al control sintético dentro de la envoltura convexa del grupo donante, impidiendo que pesos negativos o mayores a 1 fabriquen ajustes artificiales por extrapolación. La opción b es falsa en SQL, la c describe la media simple y la d es incorrecta porque el ajuste preintervención siempre debe validarse.',
    },
    {
      id: 'check-sc-soporte-comun',
      type: 'multiple-choice',
      prompt:
        'Al realizar emparejamiento exacto por celdas para estimar el efecto medio sobre los tratados (ATT), encuentras una celda con 120 pedidos tratados pero 0 pedidos en el grupo de control. ¿Qué ocurre en esa celda?',
      options: [
        {
          id: 'a',
          label:
            'Se viola la condición de soporte común para esos 120 pedidos tratados y no puede estimarse su contrafactual sin supuestos adicionales.',
        },
        {
          id: 'b',
          label:
            'El efecto causal de esa celda es exactamente igual a la media de los 120 pedidos tratados porque la media de control vale 0 USD.',
        },
        {
          id: 'c',
          label:
            'La celda aporta información válida sin sesgo siempre que el número total de controles en otras celdas supere 500.',
        },
      ],
      correctOptionId: 'a',
      explanation:
        'Para estimar el ATT se requiere observar controles en cada estrato donde existan unidades tratadas. Si n_controles = 0, la media de control es NULL (no 0 USD, como afirma erróneamente la opción b) y tener controles en otros estratos distintos no resuelve la falta de soporte en esa celda (opción c).',
    },
    {
      id: 'check-sc-predict-brecha',
      type: 'predict-output',
      prompt:
        'En FY24-Q3, Tienda Salamanca registró un ticket medio real de 461.29 USD. Sus tres donantes registraron 363.58 USD (AR-01, peso 0.55), 364.81 USD (CO-02, peso 0.35) y 497.63 USD (CL-02, peso 0.10). ¿Qué valor sintético y qué brecha causal devuelve la consulta?',
      code: `SELECT
  ROUND(0.55 * 363.58 + 0.35 * 364.81 + 0.10 * 497.63, 2) AS control_sintetico_usd,
  ROUND(461.29 - (0.55 * 363.58 + 0.35 * 364.81 + 0.10 * 497.63), 2) AS brecha_causal_usd;`,
      options: [
        {
          id: 'a',
          label:
            'control_sintetico_usd = 377.42 y brecha_causal_usd = 83.87 USD.',
        },
        {
          id: 'b',
          label:
            'control_sintetico_usd = 408.67 y brecha_causal_usd = 52.62 USD.',
        },
        {
          id: 'c',
          label:
            'control_sintetico_usd = 461.29 y brecha_causal_usd = 0.00 USD.',
        },
      ],
      correctOptionId: 'a',
      explanation:
        'El promedio ponderado convexo es 199.969 + 127.6835 + 49.763 = 377.42 USD, y al restarlo de 461.29 USD obtenemos una brecha causal de +83.87 USD. La opción b usa por error el promedio simple no ponderado (408.67 USD) y la opción c asume brecha nula.',
    },
    {
      id: 'check-sc-spot-bug',
      type: 'spot-the-bug',
      prompt:
        'Un analista intenta calcular el efecto global sobre los tratados (ATT) a partir de las diferencias por celda, pero pondera cada estrato por el total de pedidos (tratados más controles) en vez de usar exclusivamente los tratados. ¿Dónde está el error?',
      code: `SELECT
  SUM((media_tratados - media_controles) * (n_tratados + n_controles))
  / SUM(n_tratados + n_controles) AS att_estimado
FROM resumen_celdas
WHERE n_tratados > 0 AND n_controles > 0;`,
      options: [
        {
          id: 'a',
          label:
            'Para estimar el ATT debe ponderarse por n_tratados / SUM(n_tratados), no por la suma n_tratados + n_controles.',
        },
        {
          id: 'b',
          label:
            'Falta multiplicar media_controles por cero en las celdas donde n_controles supera a n_tratados.',
        },
        {
          id: 'c',
          label:
            'En SQL no se permite dividir dos funciones agregadas SUM() dentro de la misma expresión.',
        },
      ],
      correctOptionId: 'a',
      explanation:
        'El parámetro ATT representa el efecto medio en la distribución de características de la población tratada, por lo que cada celda debe ponderarse por n_tratados / SUM(n_tratados). Ponderar por n_tratados + n_controles estima el ATE de la muestra combinada; las opciones b y c son falsas.',
    },
  ],
  practice: {
    id: 'practice-da4-causalidad-03-control-sintetico',
    title:
      'Construir el control sintético trimestral de Tienda Salamanca (STR-ES-01)',
    prompt:
      'Evalúa la intervención ejecutada en Tienda Salamanca (store_id = 10) durante FY24-Q3 comparándola desde FY23-Q4 hasta FY24-Q4 contra su control sintético formado por tres tiendas donantes: STR-AR-01 (store_id = 8, peso 0.55), STR-CO-02 (store_id = 5, peso 0.35) y STR-CL-02 (store_id = 7, peso 0.10). A partir de la CTE panel_trimestral (que ya filtra o.status = \'completed\', o.store_id IN (5, 7, 8, 10) y los 5 trimestres), devuelve: fiscal_quarter, real_es01_usd (media de store_id = 10 a 2 decimales), media_donantes_simple (promedio simple de las 3 tiendas donantes a 2 decimales), control_sintetico_usd (0.55 * donante_ar01 + 0.35 * donante_co02 + 0.10 * donante_cl02 a 2 decimales) y brecha_causal_usd (real_es01 menos la combinación sintética sin redondear previamente, redondeada a 2 decimales). Ordena por fiscal_quarter ASC.',
    engine: 'duckdb',
    datasets: ['orders', 'calendar'],
    starterCode: `WITH panel_trimestral AS (
  SELECT
    c.fiscal_quarter,
    AVG(o.total_usd) FILTER (WHERE o.store_id = 10) AS real_es01,
    AVG(o.total_usd) FILTER (WHERE o.store_id = 8) AS donante_ar01,
    AVG(o.total_usd) FILTER (WHERE o.store_id = 5) AS donante_co02,
    AVG(o.total_usd) FILTER (WHERE o.store_id = 7) AS donante_cl02
  FROM orders o
  JOIN calendar c ON o.order_date = c.calendar_date
  WHERE o.status = 'completed'
    AND o.store_id IN (5, 7, 8, 10)
    AND c.fiscal_quarter IN ('FY23-Q4', 'FY24-Q1', 'FY24-Q2', 'FY24-Q3', 'FY24-Q4')
  GROUP BY c.fiscal_quarter
)
SELECT
  fiscal_quarter,
  ROUND(real_es01, 2) AS real_es01_usd,
  ROUND((donante_ar01 + donante_co02 + donante_cl02) / 3.0, 2) AS media_donantes_simple
  -- TODO: agrega control_sintetico_usd y brecha_causal_usd redondeados a 2 decimales
FROM panel_trimestral
ORDER BY fiscal_quarter ASC;`,
    solution: `WITH panel_trimestral AS (
  SELECT
    c.fiscal_quarter,
    AVG(o.total_usd) FILTER (WHERE o.store_id = 10) AS real_es01,
    AVG(o.total_usd) FILTER (WHERE o.store_id = 8) AS donante_ar01,
    AVG(o.total_usd) FILTER (WHERE o.store_id = 5) AS donante_co02,
    AVG(o.total_usd) FILTER (WHERE o.store_id = 7) AS donante_cl02
  FROM orders o
  JOIN calendar c ON o.order_date = c.calendar_date
  WHERE o.status = 'completed'
    AND o.store_id IN (5, 7, 8, 10)
    AND c.fiscal_quarter IN ('FY23-Q4', 'FY24-Q1', 'FY24-Q2', 'FY24-Q3', 'FY24-Q4')
  GROUP BY c.fiscal_quarter
)
SELECT
  fiscal_quarter,
  ROUND(real_es01, 2) AS real_es01_usd,
  ROUND((donante_ar01 + donante_co02 + donante_cl02) / 3.0, 2) AS media_donantes_simple,
  ROUND(0.55 * donante_ar01 + 0.35 * donante_co02 + 0.10 * donante_cl02, 2) AS control_sintetico_usd,
  ROUND(
    real_es01 - (0.55 * donante_ar01 + 0.35 * donante_co02 + 0.10 * donante_cl02),
    2
  ) AS brecha_causal_usd
FROM panel_trimestral
ORDER BY fiscal_quarter ASC;`,
    hints: [
      'El control sintético pondera cada donante por su peso convexo: 0.55 * donante_ar01 + 0.35 * donante_co02 + 0.10 * donante_cl02.',
      'Envuelve esa expresión en ROUND(..., 2) y nómbrala control_sintetico_usd.',
      'Para brecha_causal_usd, calcula ROUND(real_es01 - (0.55 * donante_ar01 + 0.35 * donante_co02 + 0.10 * donante_cl02), 2).',
    ],
    assertions: [
      { type: 'row-count', expected: 5 },
      {
        type: 'column-names',
        expected: [
          'fiscal_quarter',
          'real_es01_usd',
          'media_donantes_simple',
          'control_sintetico_usd',
          'brecha_causal_usd',
        ],
      },
      {
        type: 'cell-value',
        row: 0,
        column: 'control_sintetico_usd',
        expected: 399.34,
      },
      {
        type: 'cell-value',
        row: 3,
        column: 'control_sintetico_usd',
        expected: 377.42,
      },
      {
        type: 'cell-value',
        row: 3,
        column: 'brecha_causal_usd',
        expected: 83.87,
      },
    ],
    expectedOutputTable: {
      columns: [
        'fiscal_quarter',
        'real_es01_usd',
        'media_donantes_simple',
        'control_sintetico_usd',
        'brecha_causal_usd',
      ],
      rows: [
        ['FY23-Q4', 393.72, 435.75, 399.34, -5.62],
        ['FY24-Q1', 380.35, 399.55, 377.1, 3.25],
        ['FY24-Q2', 390, 420.49, 396.98, -6.97],
        ['FY24-Q3', 461.29, 408.67, 377.42, 83.87],
        ['FY24-Q4', 392.26, 428.89, 397.82, -5.55],
      ],
    },
  },
  roleNotes: {
    da: 'Cuando evalúes un piloto lanzado en una sola ciudad o sucursal, incluye siempre en tu tabla la columna del promedio simple de donantes junto al control sintético para demostrar visualmente cuánto sesgo preintervención corrigió la ponderación.',
    bi: 'En gráficos de control sintético, dibuja tanto la serie real frente a la sintética como el gráfico inferior de brechas (gap plot) con una línea vertical punteada en el trimestre de inicio de la intervención.',
    de: 'Mantén catálogos históricos inmutables de apertura y cierre de tiendas (opened_date en stores) para garantizar que el grupo donante sea un panel balanceado durante todos los trimestres pre y postintervención.',
    ds: 'En proyectos con decenas de tiendas donantes y múltiples covariables, estima los pesos óptimos w_j mediante programación cuadrática restringida en Python o R y exporta el vector de pesos a DuckDB para el monitoreo reproducible.',
  },
  summary: [
    'El emparejamiento exacto por celdas elimina la confusión por variables observables agrupando en estratos equivalentes y ponderando por la distribución del grupo tratado (ATT).',
    'La condición de soporte común exige que todo estrato con unidades tratadas contenga también unidades de control comparables.',
    'Cuando una intervención ocurre en una sola tienda o región, el control sintético construye un contrafactual como combinación convexa de unidades donantes no tratadas.',
    'Un control sintético creíble debe exhibir un error preintervención (RMSPE) reducido antes de atribuir valor causal a la brecha posterior.',
  ],
  flashcards: [
    {
      id: 'fc-sc-01',
      front: '¿Qué es la condición de soporte común en el emparejamiento por celdas?',
      back: 'Es el requisito de que en cada estrato o celda de covariables donde existan unidades tratadas haya también al menos una unidad de control para poder calcular la diferencia.',
    },
    {
      id: 'fc-sc-02',
      front: '¿Cómo se ponderan las diferencias de cada celda para obtener el efecto medio sobre los tratados (ATT)?',
      back: 'Cada celda con soporte común se pondera por la proporción de unidades tratadas que caen en ella respecto al total de unidades tratadas (N_{T,s} / N_T).',
    },
    {
      id: 'fc-sc-03',
      front: '¿Qué dos restricciones matemáticas cumplen los pesos de un control sintético?',
      back: 'Todos los pesos de las unidades donantes son mayores o iguales a cero (w_j >= 0) y la suma de todos los pesos es exactamente igual a uno.',
    },
    {
      id: 'fc-sc-04',
      front: '¿Qué mide el RMSPE preintervención en un estudio de control sintético?',
      back: 'Mide la raíz del error cuadrático medio entre la serie real de la unidad tratada y su gemelo sintético antes del tratamiento; si es grande, el contrafactual no es fiable.',
    },
  ],
  glossaryTerms: [
    'emparejamiento-exacto',
    'control-sintetico',
    'prueba-de-placebo',
  ],
  sources: [
    {
      title: 'Causal Inference: The Mixtape — Chapter 11: Synthetic Control',
      url: 'https://mixtape.scunning.com/11-Synthetic_Control.html',
      publisher: 'Yale University Press / Scott Cunningham',
      accessed: '2026-10-29',
      supports:
        'Formulación del estimador de control sintético de Abadie, Diamond y Hainmueller, pesos convexos y placebos.',
    },
    {
      title: 'The Effect — Chapter 14: Matching',
      url: 'https://theeffectbook.net/ch-Matching.html',
      publisher: 'Chapman & Hall / Nick Huntington-Klein',
      accessed: '2026-10-29',
      supports:
        'Emparejamiento exacto por celdas, condición de soporte común y ponderación del estimador ATT.',
    },
    {
      title:
        'Causal Inference for the Brave and True — Chapter 15: Synthetic Control',
      url: 'https://matheusfacure.github.io/python-causality-handbook/15-Synthetic-Control.html',
      publisher: 'Matheus Facure',
      accessed: '2026-10-29',
      supports:
        'Geometría de la envoltura convexa y prevención de extrapolación en paneles de pocas unidades.',
    },
    {
      title: 'DuckDB Window Functions (OVER Clause)',
      url: 'https://duckdb.org/docs/stable/sql/functions/window_functions',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports:
        'Cálculo de pesos de estrato mediante SUM(n_tratados) OVER () en consultas analíticas.',
    },
  ],
  aiNotes:
    'Destaca la diferencia entre la media simple de donantes (que queda entre 20 y 42 USD por encima de Tienda Salamanca antes del piloto) y la combinación convexa (0.55, 0.35, 0.10), que reduce las brechas previas a menos de 7 USD. En la práctica, cuida que el estudiante reste la expresión ponderada completa sin redondear antes de aplicar ROUND(..., 2).',
};
