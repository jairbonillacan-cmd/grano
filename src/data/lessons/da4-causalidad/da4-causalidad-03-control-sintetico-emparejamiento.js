export default {
  id: 'da4-causalidad-03-control-sintetico-emparejamiento',
  moduleId: 'da4-causalidad',
  title: 'Control sintético y emparejamiento (matching) en tiendas',
  subtitle:
    'Control sintético y emparejamiento (matching) para intervenciones en pocas tiendas o regiones',
  tracks: ['da'],
  level: 4,
  order: 3,
  minutes: 25,
  prerequisites: [
    'da4-causalidad-01-diferencias-en-diferencias-did',
    'da4-causalidad-02-regresion-discontinua-rdd',
  ],
  contentVersion: 1,
  hook: 'Operaciones despliega una remodelación de cafetería y envío exprés únicamente en Tienda Salamanca (STR-ES-01) durante FY24-Q3. Al buscar un grupo de control entre las tiendas de América Latina, observas que el promedio simple de las sucursales donantes supera a Salamanca entre 20 y 42 USD en todos los trimestres previos. ¿Cómo construyes un contrafactual creíble cuando solo una tienda fue tratada o cuando la composición de canales difiere drásticamente entre regiones?',
  objectives: [
    'Aplicar emparejamiento exacto por celdas (matching) para eliminar confusión por mezcla de canales y auditar la condición de soporte común.',
    'Construir un control sintético como combinación lineal convexa de tiendas donantes que minimice el error de ajuste preintervención.',
    'Evaluar la brecha causal postintervención frente al error cuadrático medio previo (RMSPE) y las pruebas de placebo en el espacio.',
  ],
  sections: [
    {
      id: 'emparejamiento-celdas-soporte-comun',
      heading: 'Emparejamiento exacto por estratos y condición de soporte común',
      body: 'Cuando comparamos dos regiones con distinta mezcla de formatos (`store_type`) y dispositivos (`device_type`), la media global mezcla poblaciones heterogéneas. El **emparejamiento exacto por celdas** divide la muestra en estratos discretos idénticos de las covariables previas. Calcula la diferencia interna dentro de cada celda y luego promedia ponderando por el peso de los tratados ($w_s = N_{T,s} / N_T$). Así estima el **efecto medio sobre los tratados (ATT)**.\n\nEsta técnica hace visible un requisito que las regresiones lineales suelen ocultar: la **condición de soporte común**. Para estimar el efecto sobre los tratados, toda celda que contenga unidades tratadas ($N_{T,s} > 0$) debe contar también con unidades de control ($N_{C,s} > 0$).\n\nAnalicemos el cruce de `store_type` y `device_type` entre las regiones `Andina` y `Cono Sur` en el segundo semestre de 2024. En `Andina`, la tienda insignia (`flagship`) registra `344` pedidos en `desktop`, pero `0` en `mobile` y `0` en `pos_tienda`. En cambio, en `Cono Sur` sí existen pedidos en las tres celdas (`78`, `79` y `87`). Sin auditar la tabla de celdas, una comparación agregada incluiría controles de estratos donde la región tratada ni siquiera opera.',
    },
    {
      id: 'cuando-hay-una-sola-unidad-tratada',
      heading: 'Del emparejamiento al control sintético para una sola tienda',
      body: '¿Qué ocurre cuando la intervención se ejecuta en **una única tienda**, como Tienda Salamanca (`STR-ES-01`, `store_id = 10`) en `FY24-Q3`? Ninguna sucursal individual comparte su nivel ni su trayectoria previa. Si tomamos tres tiendas donantes no tratadas (`STR-AR-01`, `STR-CO-02` y `STR-CL-02`), su promedio simple trimestral queda en `435.75 USD` en `FY23-Q4`, `399.55 USD` en `FY24-Q1` y `420.49 USD` en `FY24-Q2`. Esas cifras superan ampliamente los valores reales de Salamanca (`393.72`, `380.35` y `390.00 USD`).\n\nPropuesto por Abadie, Diamond y Hainmueller, el método de **control sintético** construye una tienda gemela sintética mediante un promedio ponderado del **grupo donante**. A diferencia de una regresión ordinaria, los pesos $w_j$ cumplen dos restricciones de combinación convexa. Primero, ningún peso puede ser negativo ($w_j \\ge 0$). Segundo, todos los pesos deben sumar exactamente uno ($\\sum_{j=2}^{J+1} w_j = 1$).\n\nEstas dos restricciones evitan la extrapolación fuera del rango de los datos y aportan una interpretación transparente. El gemelo sintético de Tienda Salamanca se compone de un `55 %` de `STR-AR-01` (Palermo Soho), un `35 %` de `STR-CO-02` (El Poblado) y un `10 %` de `STR-CL-02` (Las Condes).',
      example: {
        language: 'sql',
        code: `WITH trimestral AS (
  SELECT
    c.fiscal_quarter,
    AVG(o.total_usd) FILTER (WHERE o.store_id = 10) AS real_es01,
    AVG(o.total_usd) FILTER (WHERE o.store_id = 8) AS ar01,
    AVG(o.total_usd) FILTER (WHERE o.store_id = 5) AS co02,
    AVG(o.total_usd) FILTER (WHERE o.store_id = 7) AS cl02
  FROM orders AS o
  INNER JOIN calendar AS c ON o.order_date = c.calendar_date
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
        expectedOutput: [
          { fiscal_quarter: 'FY23-Q4', real_es01_usd: 393.72, sintetico_usd: 399.34 },
          { fiscal_quarter: 'FY24-Q1', real_es01_usd: 380.35, sintetico_usd: 377.1 },
          { fiscal_quarter: 'FY24-Q2', real_es01_usd: 390, sintetico_usd: 396.98 },
          { fiscal_quarter: 'FY24-Q3', real_es01_usd: 461.29, sintetico_usd: 377.42 },
        ],
      },
    },
    {
      id: 'ajuste-preintervencion-rmspe',
      heading: 'Calidad de ajuste preintervención (RMSPE) y brecha causal',
      body: 'En un estudio de control sintético, la credibilidad del efecto estimado después del cambio depende de cuán bien replica el gemelo sintético a la tienda tratada **antes** de la intervención. La métrica estándar para cuantificar esa fidelidad es la raíz del error cuadrático medio de predicción preintervención (**RMSPE preintervención**).\n\nRevisemos el ajuste de la combinación convexa $0.55 \\times \\text{AR-01} + 0.35 \\times \\text{CO-02} + 0.10 \\times \\text{CL-02}$ para Tienda Salamanca en los tres trimestres previos. En `FY23-Q4`, el valor real es `393.72 USD` y el sintético `399.34 USD` (brecha de `-5.62 USD`). En `FY24-Q1`, el real es `380.35 USD` y el sintético `377.10 USD` (brecha de `+3.25 USD`). En `FY24-Q2`, el real es `390.00 USD` y el sintético `396.98 USD` (brecha de `-6.97 USD`). El RMSPE preintervención resulta en $\\sqrt{(5.62^2 + 3.25^2 + 6.97^2)/3} = 5.50\\text{ USD}$, menos del `1.5 %` del ticket basal.\n\nCuando el piloto temporal se activa en `FY24-Q3`, la brecha entre Salamanca (`461.29 USD`) y su control sintético (`377.42 USD`) salta a `+83.87 USD`. Ese impacto equivale a más de `15` veces el RMSPE previo. Además, al concluir la campaña temporal en `FY24-Q4`, la brecha regresa a `-5.55 USD` (`392.26` frente a `397.82 USD`).',
    },
    {
      id: 'inferencia-placebos-espacio-requisitos',
      heading: 'Inferencia por placebos en el espacio y reglas del grupo donante',
      body: 'Con una sola tienda tratada ($N_T = 1$), las fórmulas clásicas de error estándar asintótico no aplican. En su lugar, el método de control sintético realiza inferencia mediante **pruebas de placebo en el espacio**. Este procedimiento reasigna ficticiamente el tratamiento a cada una de las tiendas del grupo donante y construye su propio control sintético. Luego calcula la razón entre su RMSPE postintervención y su RMSPE preintervención. Si la razón de Tienda Salamanca supera claramente la de las tiendas donantes no tratadas, concluimos que el efecto no proviene del azar.\n\nPara que el grupo donante sea válido, debes verificar tres reglas de higiene antes de ponderar. Primero, **ausencia de derrame**: ninguna tienda donante debe haber recibido una versión parcial del programa ni perder clientes hacia la tienda tratada. Segundo, **envoltura convexa**: los valores preintervención de la tienda tratada no deben ser los más altos ni los más bajos absolutos de toda la red. De lo contrario, ninguna suma de pesos positivos que sume `1` podrá igualar su nivel. Tercero, **parsimonia**: emplea pocas tiendas donantes con fundamentos comerciales comparables para evitar sobreajustar ruido aleatorio.',
      example: {
        language: 'sql',
        code: `WITH brechas AS (
  SELECT 'FY23-Q4' AS q, -5.62 AS gap UNION ALL
  SELECT 'FY24-Q1', 3.25 UNION ALL
  SELECT 'FY24-Q2', -6.97
)
SELECT
  ROUND(SQRT(AVG(POWER(gap, 2))), 2) AS rmspe_pre_usd,
  ROUND(83.87 / SQRT(AVG(POWER(gap, 2))), 2) AS razon_efecto_sobre_rmspe
FROM brechas;`,
        expectedOutput: [
          {
            rmspe_pre_usd: 5.5,
            razon_efecto_sobre_rmspe: 15.25,
          },
        ],
      },
    },
  ],
  workedExample: {
    title: 'Auditoría de soporte común y emparejamiento por celdas entre Andina y Cono Sur',
    description:
      'Comparamos el ticket medio del segundo semestre de 2024 (`2024-07-01` a `2024-12-31`) entre las tiendas físicas (`flagship` y `retail`) de la región `Andina` (tratada) y `Cono Sur` (control) emparejando exactamente por formato de tienda (`store_type`) y dispositivo de compra (`device_type`). Auditamos la tabla de celdas en SQL para verificar si existe soporte común y calcular los pesos ATT.',
    steps: [
      {
        label: 'Paso 1 — Conteo de unidades tratadas y de control por celda exacta',
        explanation:
          'Agrupamos los pedidos completados del segundo semestre de 2024 por la celda exacta `(store_type, device_type)`. Observamos que en `flagship x mobile` y `flagship x pos_tienda` la región `Andina` tiene `0` pedidos tratados (`n_tratados = 0`), mientras que `Cono Sur` sí tiene `79` y `87` pedidos.',
        code: `SELECT
  s.store_type,
  o.device_type,
  COUNT(*) FILTER (WHERE s.region = 'Andina') AS n_tratados,
  COUNT(*) FILTER (WHERE s.region = 'Cono Sur') AS n_controles,
  ROUND(AVG(o.total_usd) FILTER (WHERE s.region = 'Andina'), 2) AS media_tratados_usd,
  ROUND(AVG(o.total_usd) FILTER (WHERE s.region = 'Cono Sur'), 2) AS media_controles_usd
FROM orders AS o
INNER JOIN stores AS s ON o.store_id = s.store_id
WHERE o.status = 'completed'
  AND s.region IN ('Andina', 'Cono Sur')
  AND s.store_type IN ('flagship', 'retail')
  AND o.order_date >= '2024-07-01'
  AND o.order_date < '2025-01-01'
GROUP BY 1, 2
ORDER BY 1, 2;`,
        expectedOutput: [
          {
            store_type: 'flagship',
            device_type: 'desktop',
            n_tratados: 344,
            n_controles: 78,
            media_tratados_usd: 334.58,
            media_controles_usd: 587.29,
          },
          {
            store_type: 'flagship',
            device_type: 'mobile',
            n_tratados: 0,
            n_controles: 79,
            media_tratados_usd: null,
            media_controles_usd: 240.69,
          },
          {
            store_type: 'flagship',
            device_type: 'pos_tienda',
            n_tratados: 0,
            n_controles: 87,
            media_tratados_usd: null,
            media_controles_usd: 435.43,
          },
          {
            store_type: 'retail',
            device_type: 'desktop',
            n_tratados: 171,
            n_controles: 263,
            media_tratados_usd: 345.57,
            media_controles_usd: 531.22,
          },
          {
            store_type: 'retail',
            device_type: 'mobile',
            n_tratados: 318,
            n_controles: 387,
            media_tratados_usd: 379.22,
            media_controles_usd: 433.58,
          },
          {
            store_type: 'retail',
            device_type: 'pos_tienda',
            n_tratados: 179,
            n_controles: 272,
            media_tratados_usd: 542.4,
            media_controles_usd: 287.68,
          },
        ],
      },
      {
        label: 'Paso 2 — Filtrado de soporte común y ponderación ATT con función de ventana',
        explanation:
          'Restringimos a las celdas con soporte común (`n_tratados > 0 AND n_controles > 0`) y calculamos el peso de cada celda en la población tratada mediante `n_tratados * 1.0 / SUM(n_tratados) OVER ()`. Esto expone tanto los pesos ATT como la heterogeneidad del efecto por canal.',
        code: `WITH celdas AS (
  SELECT
    s.store_type,
    o.device_type,
    COUNT(*) FILTER (WHERE s.region = 'Andina') AS n_tratados,
    COUNT(*) FILTER (WHERE s.region = 'Cono Sur') AS n_controles,
    AVG(o.total_usd) FILTER (WHERE s.region = 'Andina') AS media_tratados,
    AVG(o.total_usd) FILTER (WHERE s.region = 'Cono Sur') AS media_controles
  FROM orders AS o
  INNER JOIN stores AS s ON o.store_id = s.store_id
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
        expectedOutput: [
          {
            store_type: 'flagship',
            device_type: 'desktop',
            n_tratados: 344,
            n_controles: 78,
            efecto_celda_usd: -252.71,
            peso_att: 0.3399,
          },
          {
            store_type: 'retail',
            device_type: 'desktop',
            n_tratados: 171,
            n_controles: 263,
            efecto_celda_usd: -185.65,
            peso_att: 0.169,
          },
          {
            store_type: 'retail',
            device_type: 'mobile',
            n_tratados: 318,
            n_controles: 387,
            efecto_celda_usd: -54.37,
            peso_att: 0.3142,
          },
          {
            store_type: 'retail',
            device_type: 'pos_tienda',
            n_tratados: 179,
            n_controles: 272,
            efecto_celda_usd: 254.72,
            peso_att: 0.1769,
          },
        ],
      },
    ],
  },
  checks: [
    {
      id: 'chk-da4-03-1',
      type: 'mcq',
      prompt:
        '¿Por qué el método de control sintético restringe los pesos de las tiendas donantes a ser no negativos (w_j >= 0) y a sumar exactamente uno (suma de w_j = 1)?',
      options: [
        {
          id: 'a',
          text: 'Para evitar extrapolaciones fuera del rango de las tiendas donantes y asegurar que el contrafactual sea un promedio ponderado interpretable',
          correct: true,
          feedback:
            'Exacto: esas dos condiciones mantienen al gemelo sintético dentro de la envoltura convexa del grupo donante.',
        },
        {
          id: 'b',
          text: 'Porque en SQL es imposible multiplicar columnas por coeficientes negativos o mayores que uno dentro de SELECT',
          correct: false,
          feedback:
            'SQL admite cualquier coeficiente real; la restricción es metodológica para impedir extrapolaciones artificiales.',
        },
        {
          id: 'c',
          text: 'Para forzar a que todas las tiendas del catálogo reciban exactamente el mismo peso uniforme 1/J',
          correct: false,
          feedback:
            'El control sintético asigna pesos distintos (como 0.55, 0.35 y 0.10) para minimizar el error preintervención.',
        },
      ],
      explanation:
        'Las restricciones de no negatividad (w_j >= 0) y suma unitaria garantizan que el control sintético sea una combinación convexa dentro del soporte de las unidades donantes observadas.',
    },
    {
      id: 'chk-da4-03-2',
      type: 'mcq',
      prompt:
        'Al realizar emparejamiento exacto por celdas para estimar el efecto medio sobre los tratados (ATT), encuentras una celda con 120 pedidos tratados pero 0 pedidos de control. ¿Qué ocurre en esa celda?',
      options: [
        {
          id: 'a',
          text: 'Se viola la condición de soporte común para esos 120 pedidos tratados y no puede estimarse su contrafactual en esa celda',
          correct: true,
          feedback:
            'Correcto: sin controles observados en ese estrato, la media contrafactual de la celda es NULL.',
        },
        {
          id: 'b',
          text: 'El efecto causal de esa celda es exactamente igual a la media de los 120 pedidos tratados porque la media de control vale 0 USD',
          correct: false,
          feedback:
            'Ausencia de controles significa dato faltante (NULL), no gasto igual a 0 USD.',
        },
        {
          id: 'c',
          text: 'La celda aporta información válida sin sesgo siempre que el número total de controles en otras celdas supere 500',
          correct: false,
          feedback:
            'Tener abundantes controles en otras celdas distintas no resuelve la falta de comparador dentro del estrato vacío.',
        },
      ],
      explanation:
        'El estimador ATT por emparejamiento requiere que en todo estrato con unidades tratadas exista al menos una unidad de control; cuando n_controles = 0 falla la condición de soporte común.',
    },
    {
      id: 'chk-da4-03-3',
      type: 'predict-output',
      prompt:
        'En FY24-Q3, Tienda Salamanca registró un ticket medio real de 461.29 USD. Sus tres donantes registraron 363.58 USD (AR-01, peso 0.55), 364.81 USD (CO-02, peso 0.35) y 497.63 USD (CL-02, peso 0.10). ¿Qué devuelve `ROUND(461.29 - (0.55*363.58 + 0.35*364.81 + 0.10*497.63), 2)`?',
      options: [
        {
          id: 'a',
          text: '83.87; resulta de restar el control sintético (377.42 USD) al ticket real de Salamanca (461.29 USD)',
          correct: true,
          feedback:
            'Correcto: 0.55*363.58 + 0.35*364.81 + 0.10*497.63 = 377.42 USD, y 461.29 - 377.42 = 83.87 USD.',
        },
        {
          id: 'b',
          text: '52.62; resulta de restar el promedio simple no ponderado de los tres donantes (408.67 USD)',
          correct: false,
          feedback:
            '52.62 USD corresponde al promedio simple con pesos iguales 1/3, no a la combinación sintética (0.55, 0.35, 0.10).',
        },
        {
          id: 'c',
          text: '-6.97; replica la brecha observada en el trimestre previo FY24-Q2',
          correct: false,
          feedback:
            '-6.97 USD fue la brecha preintervención en FY24-Q2; en FY24-Q3 la brecha sube a +83.87 USD.',
        },
      ],
      explanation:
        'El control sintético en FY24-Q3 vale 199.969 + 127.6835 + 49.763 = 377.42 USD. Al restarlo del valor real de Tienda Salamanca (461.29 USD), la brecha causal estimada es +83.87 USD.',
    },
    {
      id: 'chk-da4-03-4',
      type: 'mcq',
      prompt:
        'Un analista agrega las diferencias por celda usando `SUM((media_tratados - media_controles) * (n_tratados + n_controles)) / SUM(n_tratados + n_controles)`. ¿Qué parámetro está calculando en vez del ATT?',
      options: [
        {
          id: 'a',
          text: 'Está ponderando por el tamaño total de la muestra combinada (ATE muestral) en lugar de ponderar exclusivamente por n_tratados / SUM(n_tratados)',
          correct: true,
          feedback:
            'Exacto: para el ATT cada celda debe pesarse por la proporción de unidades tratadas que caen en ella.',
        },
        {
          id: 'b',
          text: 'Está calculando el error cuadrático medio preintervención (RMSPE) del grupo de control',
          correct: false,
          feedback:
            'La expresión no eleva al cuadrado ni toma raíz; simplemente usa pesos de la muestra combinada en vez de pesos de tratados.',
        },
        {
          id: 'c',
          text: 'Está forzando a que todas las celdas tengan peso cero cuando n_controles es mayor que n_tratados',
          correct: false,
          feedback:
            'Sumar n_tratados + n_controles asigna más peso a las celdas con muchos controles, distorsionando la distribución de los tratados.',
        },
      ],
      explanation:
        'El efecto medio sobre los tratados (ATT) requiere ponderar cada estrato por su frecuencia dentro de la población tratada: n_tratados / SUM(n_tratados). Incluir n_controles en el peso cambia la población objetivo.',
    },
  ],
  practice: {
    type: 'sql',
    title: 'Construir el control sintético trimestral de Tienda Salamanca (STR-ES-01)',
    language: 'sql',
    prompt:
      'Evalúa la intervención ejecutada en Tienda Salamanca (`store_id = 10`) durante `FY24-Q3` comparándola desde `FY23-Q4` hasta `FY24-Q4` contra su control sintético formado por tres tiendas donantes: `STR-AR-01` (`store_id = 8`, peso `0.55`), `STR-CO-02` (`store_id = 5`, peso `0.35`) y `STR-CL-02` (`store_id = 7`, peso `0.10`). A partir de la CTE `panel_trimestral`, devuelve: `fiscal_quarter`, `real_es01_usd` (media de `store_id = 10` a 2 decimales), `media_donantes_simple` (promedio simple de las 3 tiendas donantes a 2 decimales), `control_sintetico_usd` (`0.55 * donante_ar01 + 0.35 * donante_co02 + 0.10 * donante_cl02` a 2 decimales) y `brecha_causal_usd` (`real_es01` menos la combinación sintética sin redondear previamente, redondeada a 2 decimales). Ordena por `fiscal_quarter ASC`.',
    starterCode: `WITH panel_trimestral AS (
  SELECT
    c.fiscal_quarter,
    AVG(o.total_usd) FILTER (WHERE o.store_id = 10) AS real_es01,
    AVG(o.total_usd) FILTER (WHERE o.store_id = 8) AS donante_ar01,
    AVG(o.total_usd) FILTER (WHERE o.store_id = 5) AS donante_co02,
    AVG(o.total_usd) FILTER (WHERE o.store_id = 7) AS donante_cl02
  FROM orders AS o
  INNER JOIN calendar AS c ON o.order_date = c.calendar_date
  WHERE o.status = 'completed'
    AND o.store_id IN (5, 7, 8, 10)
    AND c.fiscal_quarter IN ('FY23-Q4', 'FY24-Q1', 'FY24-Q2', 'FY24-Q3', 'FY24-Q4')
  GROUP BY c.fiscal_quarter
)
SELECT
  fiscal_quarter,
  ROUND(real_es01, 2) AS real_es01_usd,
  ROUND((donante_ar01 + donante_co02 + donante_cl02) / 3.0, 2) AS media_donantes_simple,
  -- Reemplaza los ceros por control_sintetico_usd y brecha_causal_usd redondeados a 2 decimales:
  0.0 AS control_sintetico_usd,
  0.0 AS brecha_causal_usd
FROM panel_trimestral
ORDER BY fiscal_quarter ASC;`,
    expected: `WITH panel_trimestral AS (
  SELECT
    c.fiscal_quarter,
    AVG(o.total_usd) FILTER (WHERE o.store_id = 10) AS real_es01,
    AVG(o.total_usd) FILTER (WHERE o.store_id = 8) AS donante_ar01,
    AVG(o.total_usd) FILTER (WHERE o.store_id = 5) AS donante_co02,
    AVG(o.total_usd) FILTER (WHERE o.store_id = 7) AS donante_cl02
  FROM orders AS o
  INNER JOIN calendar AS c ON o.order_date = c.calendar_date
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
    orderMatters: true,
    hints: [
      'El control sintético pondera cada donante por su peso convexo: 0.55 * donante_ar01 + 0.35 * donante_co02 + 0.10 * donante_cl02.',
      'Envuelve esa expresión en ROUND(..., 2) y nómbrala control_sintetico_usd.',
      'Para brecha_causal_usd, escribe ROUND(real_es01 - (0.55 * donante_ar01 + 0.35 * donante_co02 + 0.10 * donante_cl02), 2).',
    ],
    solution: `WITH panel_trimestral AS (
  SELECT
    c.fiscal_quarter,
    AVG(o.total_usd) FILTER (WHERE o.store_id = 10) AS real_es01,
    AVG(o.total_usd) FILTER (WHERE o.store_id = 8) AS donante_ar01,
    AVG(o.total_usd) FILTER (WHERE o.store_id = 5) AS donante_co02,
    AVG(o.total_usd) FILTER (WHERE o.store_id = 7) AS donante_cl02
  FROM orders AS o
  INNER JOIN calendar AS c ON o.order_date = c.calendar_date
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
    solutionExplanation:
      'Mientras el promedio simple de donantes sobrestima a Salamanca entre 20 y 42 USD en el preperiodo, la combinación convexa (0.55, 0.35, 0.10) mantiene la brecha previa entre -6.97 y +3.25 USD y revela un salto de +83.87 USD durante el piloto de FY24-Q3.',
    expectedOutputTable: [
      {
        fiscal_quarter: 'FY23-Q4',
        real_es01_usd: 393.72,
        media_donantes_simple: 435.75,
        control_sintetico_usd: 399.34,
        brecha_causal_usd: -5.62,
      },
      {
        fiscal_quarter: 'FY24-Q1',
        real_es01_usd: 380.35,
        media_donantes_simple: 399.55,
        control_sintetico_usd: 377.1,
        brecha_causal_usd: 3.25,
      },
      {
        fiscal_quarter: 'FY24-Q2',
        real_es01_usd: 390,
        media_donantes_simple: 420.49,
        control_sintetico_usd: 396.98,
        brecha_causal_usd: -6.97,
      },
      {
        fiscal_quarter: 'FY24-Q3',
        real_es01_usd: 461.29,
        media_donantes_simple: 408.67,
        control_sintetico_usd: 377.42,
        brecha_causal_usd: 83.87,
      },
      {
        fiscal_quarter: 'FY24-Q4',
        real_es01_usd: 392.26,
        media_donantes_simple: 428.89,
        control_sintetico_usd: 397.82,
        brecha_causal_usd: -5.55,
      },
    ],
  },
  roleNotes: {
    da: 'Cuando evalúes un piloto lanzado en una sola ciudad o sucursal, incluye siempre en tu tabla la columna del promedio simple de donantes junto al control sintético para demostrar visualmente cuánto sesgo preintervención corrigió la ponderación.',
    bi: 'En gráficos de control sintético, dibuja tanto la serie real frente a la sintética como el gráfico inferior de brechas (gap plot) con una línea vertical punteada en el trimestre de inicio de la intervención.',
    de: 'Mantén catálogos históricos inmutables de apertura y cierre de tiendas (opened_date en stores) para garantizar que el grupo donante sea un panel balanceado durante todos los trimestres pre y postintervención.',
  },
  summary: [
    'El emparejamiento exacto por celdas elimina la confusión por variables observables agrupando en estratos equivalentes y ponderando por la distribución del grupo tratado (ATT).',
    'La condición de soporte común exige que todo estrato con unidades tratadas contenga también unidades de control comparables.',
    'Cuando una intervención ocurre en una sola tienda o región, el control sintético construye un contrafactual como combinación convexa de unidades donantes no tratadas.',
    'Un control sintético creíble debe exhibir un error preintervención (RMSPE) reducido antes de atribuir valor causal a la brecha posterior.',
  ],
  flashcards: [
    {
      id: 'fc-da4-03-1',
      front: '¿Qué es la condición de soporte común en el emparejamiento por celdas?',
      back: 'Es el requisito de que en cada estrato o celda de covariables donde existan unidades tratadas haya también al menos una unidad de control para poder calcular la diferencia.',
    },
    {
      id: 'fc-da4-03-2',
      front: '¿Cómo se ponderan las diferencias de cada celda para obtener el efecto medio sobre los tratados (ATT)?',
      back: 'Cada celda con soporte común se pondera por la proporción de unidades tratadas que caen en ella respecto al total de unidades tratadas (N_{T,s} / N_T).',
    },
    {
      id: 'fc-da4-03-3',
      front: '¿Qué dos restricciones matemáticas cumplen los pesos de un control sintético?',
      back: 'Todos los pesos de las unidades donantes son mayores o iguales a cero (w_j >= 0) y la suma de todos los pesos es exactamente igual a uno.',
    },
    {
      id: 'fc-da4-03-4',
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
