export default {
  id: 'da4-causalidad-01-diferencias-en-diferencias-did',
  moduleId: 'da4-causalidad',
  title: 'Diferencias en diferencias (DiD) y tendencias paralelas',
  subtitle:
    'Diferencias en diferencias (DiD): supuesto de tendencias paralelas y pruebas de placebo',
  tracks: ['da'],
  level: 4,
  order: 1,
  minutes: 25,
  prerequisites: [
    'da4-modelos-01',
    'da2-inferencia-05-pruebas-hipotesis-valor-p',
    'c0-numeros-05-correlacion-causalidad',
  ],
  contentVersion: 1,
  hook: 'En el tercer trimestre fiscal de 2024, Tienda Salamanca activó un programa piloto de envío prioritario y asesoría de grano en tienda. Su ticket medio subió de 390.00 USD en FY24-Q2 a 461.29 USD en FY24-Q3 (+71.28 USD). La gerencia regional afirma que los 71.28 USD completos provienen del piloto, mientras finanzas sospecha de un alza estacional. ¿Cómo separas el efecto causal del programa de la tendencia temporal y de las diferencias permanentes entre sucursales cuando no hubo asignación aleatoria?',
  objectives: [
    'Estimar el efecto causal en un diseño de diferencias en diferencias (DiD) 2x2 restando la evolución del grupo de control al cambio del grupo tratado.',
    'Auditar el supuesto de tendencias paralelas mediante pruebas de placebo preintervención entre trimestres previos al tratamiento.',
    'Diagnosticar amenazas por choques concurrentes variantes en el tiempo cruzando resultados operativos con gasto de marketing regional.',
  ],
  sections: [
    {
      id: 'limites-comparaciones-ingenuas',
      heading: 'Por qué fallan el antes contra después y el corte transversal',
      body: 'Cuando una intervención comercial se despliega en una tienda sin sorteo aleatorio, dos comparaciones habituales inducen a error. La primera consiste en comparar la misma sucursal antes y después del cambio. En Tienda Salamanca (`STR-ES-01`), el ticket medio subió `+71.28 USD` entre `FY24-Q2` y `FY24-Q3`. Sin embargo, ese salto mezcla el efecto del programa con cualquier choque macroeconómico o campaña estacional ocurrida en ese trimestre.\n\nLa segunda trampa consiste en comparar en `FY24-Q3` la tienda tratada contra otras sucursales no intervenidas. En ese trimestre, Tienda Las Condes (`STR-CL-02`) promedió `497.63 USD` y Tienda Polanco Sur (`STR-MX-02`) alcanzó `503.62 USD`. Esas sucursales operan en mercados con un poder adquisitivo basal más alto desde antes de la intervención. Una resta transversal directa daría un efecto negativo espurio de `-38.24 USD`.\n\nEl diseño de **diferencias en diferencias (DiD)** resuelve ambos problemas al seguir un panel de unidades en el tiempo. La primera diferencia resta el periodo previo dentro de cada tienda y elimina las brechas estructurales fijas entre sucursales. La segunda diferencia resta el cambio del control al cambio del tratado y descuenta el choque temporal común.',
    },
    {
      id: 'estimador-did-contrafactual',
      heading: 'El estimador DiD 2x2 y la construcción del contrafactual',
      body: 'Sea $D_i \\in \\{0, 1\\}$ el indicador de pertenencia al grupo tratado y $t \\in \\{\\text{pre}, \\text{post}\\}$ el periodo observado. El parámetro de interés en este método es el **efecto medio del tratamiento sobre los tratados (ATT)** en el periodo posterior: $\\hat{\\tau}_{\\text{DiD}} = (\\bar{Y}_{T,\\text{post}} - \\bar{Y}_{T,\\text{pre}}) - (\\bar{Y}_{C,\\text{post}} - \\bar{Y}_{C,\\text{pre}})$. Mide cuánto vendió la tienda intervenida frente a lo que habría vendido esa misma sucursal sin el programa.\n\nEl resultado potencial sin tratamiento después del cambio, $E[Y_{i,\\text{post}}(0) \\mid D_i = 1]$, nunca es observable de forma directa. El método DiD lo reconstruye sumando al nivel preintervención del grupo tratado la variación temporal observada en el grupo de control. Evaluemos Tienda Salamanca (`store_id = 10`) frente al comparador formado por `STR-MX-02` y `STR-CL-02` (`store_id IN (2, 7)`). En `FY24-Q2`, el ticket medio fue de `390.00 USD` en Salamanca y de `498.83 USD` en el control.\n\nDurante `FY24-Q3`, el control avanzó solo `+0.71 USD`, pasando de `498.83 USD` a `499.53 USD`. Por tanto, el contrafactual proyectado para Salamanca sin programa es $390.00 + 0.71 = 390.71\\text{ USD}$. Al contrastar el valor real observado de `461.29 USD` contra ese contrafactual de `390.71 USD`, aislamos un efecto causal DiD de `+70.57 USD` por pedido.',
      example: {
        language: 'sql',
        code: `WITH medias AS (
  SELECT
    CASE WHEN o.store_id = 10 THEN '1_tratado_salamanca' ELSE '2_control_comparador' END AS grupo,
    AVG(o.total_usd) FILTER (WHERE c.fiscal_quarter = 'FY24-Q2') AS pre_q2,
    AVG(o.total_usd) FILTER (WHERE c.fiscal_quarter = 'FY24-Q3') AS post_q3
  FROM orders AS o
  INNER JOIN calendar AS c ON o.order_date = c.calendar_date
  WHERE o.status = 'completed'
    AND o.store_id IN (2, 7, 10)
    AND c.fiscal_quarter IN ('FY24-Q2', 'FY24-Q3')
  GROUP BY 1
)
SELECT
  grupo,
  ROUND(pre_q2, 2) AS media_pre_usd,
  ROUND(post_q3, 2) AS media_post_usd,
  ROUND(post_q3 - pre_q2, 2) AS cambio_usd
FROM medias
ORDER BY grupo;`,
        expectedOutput: [
          {
            grupo: '1_tratado_salamanca',
            media_pre_usd: 390,
            media_post_usd: 461.29,
            cambio_usd: 71.28,
          },
          {
            grupo: '2_control_comparador',
            media_pre_usd: 498.83,
            media_post_usd: 499.53,
            cambio_usd: 0.71,
          },
        ],
      },
    },
    {
      id: 'supuesto-tendencias-paralelas-placebo',
      heading: 'Supuesto de tendencias paralelas y pruebas de placebo',
      body: 'El estimador DiD no exige que el grupo tratado y el de control partan del mismo nivel de ventas. De hecho, Tienda Salamanca partía más de `108 USD` por debajo de sus sucursales comparadoras en `FY24-Q2`. Lo que exige de manera estricta es el **supuesto de tendencias paralelas**. En ausencia del programa, el ticket medio del grupo tratado habría evolucionado entre `FY24-Q2` y `FY24-Q3` al mismo ritmo que el control.\n\nComo la trayectoria contrafactual en `FY24-Q3` no se observa, este supuesto nunca puede probarse directamente en el postperiodo. No obstante, podemos auditar su credibilidad mediante una **prueba de placebo temporal** en trimestres previos al tratamiento. Aplicamos la misma fórmula DiD entre `FY24-Q1` y `FY24-Q2`, cuando ninguna tienda había recibido el piloto comercial. Si las tendencias previas eran paralelas, el efecto placebo estimado entre `Q1` y `Q2` debe ser cercano a cero.\n\nEn Tienda Salamanca el ticket subió `+9.66 USD` de `Q1` a `Q2`, frente a `+9.61 USD` en el control. La brecha placebo es de apenas `+0.05 USD`, lo que respalda el diseño. En cambio, al evaluar Tienda Miraflores en Perú (`STR-PE-01`) frente al resto de tiendas minoristas sudamericanas, la brecha entre `Q1` y `Q2` ya era de `+27.88 USD` antes de iniciar `FY24-Q3`. Esa divergencia previa invalida el paralelismo.',
    },
    {
      id: 'choques-concurrentes-sql',
      heading: 'Amenazas por choques concurrentes y auditoría en SQL',
      body: 'Superar la prueba de placebo entre trimestres anteriores es una condición necesaria, pero no suficiente. El supuesto de tendencias paralelas también se rompe si en `FY24-Q3` ocurre un **choque concurrente específico del grupo**. Imaginemos que el equipo de adquisición digital duplica las campañas pagadas solo en la región tratada durante el trimestre del piloto. Ese confusor variante en el tiempo se mezclaría por completo con el efecto de la intervención en tienda.\n\nPara blindar cualquier estudio DiD en Mercado Brisa, auditamos la tabla `marketing_spend` unida con `calendar` en los mismos trimestres. Entre `FY24-Q2` y `FY24-Q3`, el gasto diario medio de marketing en la región `Iberia` bajó de `153.17 USD` a `150.93 USD` (`-2.24 USD` por día). Esto descarta que el salto de `+70.57 USD` en Tienda Salamanca provenga de un impulso publicitario regional.\n\nPor el contrario, en la región `Andina` el gasto diario en campañas subió de `180.49 USD` en `FY24-Q2` a `187.97 USD` en `FY24-Q3` (`+7.48 USD` por día). Mientras tanto, en `Cono Sur` permaneció casi fijo (`+0.13 USD` por día). Un analista senior reporta siempre la estimación DiD junto con su placebo temporal y la verificación de covariables operativas.',
      example: {
        language: 'sql',
        code: `SELECT
  m.region,
  ROUND(AVG(m.spend_usd) FILTER (WHERE c.fiscal_quarter = 'FY24-Q2'), 2) AS mkt_q2_usd,
  ROUND(AVG(m.spend_usd) FILTER (WHERE c.fiscal_quarter = 'FY24-Q3'), 2) AS mkt_q3_usd,
  ROUND(
    AVG(m.spend_usd) FILTER (WHERE c.fiscal_quarter = 'FY24-Q3')
    - AVG(m.spend_usd) FILTER (WHERE c.fiscal_quarter = 'FY24-Q2'),
    2
  ) AS cambio_mkt_usd
FROM marketing_spend AS m
INNER JOIN calendar AS c ON m.spend_date = c.calendar_date
WHERE c.fiscal_quarter IN ('FY24-Q2', 'FY24-Q3')
GROUP BY m.region
ORDER BY m.region;`,
        expectedOutput: [
          {
            region: 'Andina',
            mkt_q2_usd: 180.49,
            mkt_q3_usd: 187.97,
            cambio_mkt_usd: 7.48,
          },
          {
            region: 'Cono Sur',
            mkt_q2_usd: 95.99,
            mkt_q3_usd: 96.12,
            cambio_mkt_usd: 0.13,
          },
          {
            region: 'Iberia',
            mkt_q2_usd: 153.17,
            mkt_q3_usd: 150.93,
            cambio_mkt_usd: -2.24,
          },
          {
            region: 'Norteamérica',
            mkt_q2_usd: 379.68,
            mkt_q3_usd: 381.6,
            cambio_mkt_usd: 1.93,
          },
        ],
      },
    },
  ],
  workedExample: {
    title: 'Evaluación DiD y prueba de placebo del piloto en Tienda Salamanca (STR-ES-01)',
    description:
      'Dirección comercial solicita estimar el impacto causal del piloto desplegado en Tienda Salamanca (`store_id = 10`) durante `FY24-Q3` sobre el ticket medio de pedidos completados (`total_usd`), empleando como grupo de control las tiendas comparadoras `STR-MX-02` y `STR-CL-02` (`store_id IN (2, 7)`) y auditando la tendencia previa entre `FY24-Q1` y `FY24-Q2`.',
    steps: [
      {
        label: 'Paso 1 — Conteo y medias trimestrales por cohorte con cláusula FILTER',
        explanation:
          'Filtramos los pedidos con estado `completed` en las tres tiendas del estudio durante `FY24-Q1`, `FY24-Q2` y `FY24-Q3`. Etiquetamos a `store_id = 10` como `1_tratado_salamanca` y a las sucursales 2 y 7 como `2_control_comparador`, calculando las medias trimestrales y sus diferencias.',
        code: `WITH base AS (
  SELECT
    CASE WHEN o.store_id = 10 THEN '1_tratado_salamanca' ELSE '2_control_comparador' END AS grupo,
    c.fiscal_quarter,
    o.total_usd
  FROM orders AS o
  INNER JOIN calendar AS c ON o.order_date = c.calendar_date
  WHERE o.status = 'completed'
    AND o.store_id IN (2, 7, 10)
    AND c.fiscal_quarter IN ('FY24-Q1', 'FY24-Q2', 'FY24-Q3')
)
SELECT
  grupo,
  COUNT(*) AS n_pedidos,
  ROUND(AVG(total_usd) FILTER (WHERE fiscal_quarter = 'FY24-Q1'), 2) AS media_q1,
  ROUND(AVG(total_usd) FILTER (WHERE fiscal_quarter = 'FY24-Q2'), 2) AS media_q2,
  ROUND(AVG(total_usd) FILTER (WHERE fiscal_quarter = 'FY24-Q3'), 2) AS media_q3,
  ROUND(
    AVG(total_usd) FILTER (WHERE fiscal_quarter = 'FY24-Q2')
    - AVG(total_usd) FILTER (WHERE fiscal_quarter = 'FY24-Q1'),
    2
  ) AS delta_pre_q2_q1,
  ROUND(
    AVG(total_usd) FILTER (WHERE fiscal_quarter = 'FY24-Q3')
    - AVG(total_usd) FILTER (WHERE fiscal_quarter = 'FY24-Q2'),
    2
  ) AS delta_post_q3_q2
FROM base
GROUP BY grupo
ORDER BY grupo;`,
        expectedOutput: [
          {
            grupo: '1_tratado_salamanca',
            n_pedidos: 256,
            media_q1: 380.35,
            media_q2: 390,
            media_q3: 461.29,
            delta_pre_q2_q1: 9.66,
            delta_post_q3_q2: 71.28,
          },
          {
            grupo: '2_control_comparador',
            n_pedidos: 499,
            media_q1: 489.22,
            media_q2: 498.83,
            media_q3: 499.53,
            delta_pre_q2_q1: 9.61,
            delta_post_q3_q2: 0.71,
          },
        ],
      },
      {
        label: 'Paso 2 — Verificación del placebo preintervención y estimación DiD en FY24-Q3',
        explanation:
          'Al restar los cambios preintervención (`9.66 - 9.61 = +0.05 USD`), comprobamos que ambos grupos evolucionaban en paralelo antes del piloto. Al restar los cambios postintervención (`71.28 - 0.71 = +70.57 USD`), aislamos el efecto causal del piloto en Tienda Salamanca.',
        code: `SELECT
  ROUND(9.66 - 9.61, 2) AS placebo_pre_did_usd,
  ROUND(390.00 + 0.71, 2) AS contrafactual_salamanca_q3_usd,
  ROUND(71.28 - 0.71, 2) AS efecto_causal_did_usd;`,
        expectedOutput: [
          {
            placebo_pre_did_usd: 0.05,
            contrafactual_salamanca_q3_usd: 390.71,
            efecto_causal_did_usd: 70.57,
          },
        ],
      },
    ],
  },
  checks: [
    {
      id: 'chk-da4-01-1',
      type: 'mcq',
      prompt:
        'En el experimento EXP-FREE-SHIP-45 de Mercado Brisa, el gasto medio del grupo tratado pasó de 80.13 USD antes del cambio a 72.45 USD después (-7.68 USD), mientras que el control pasó de 79.98 USD a 66.08 USD (-13.90 USD). ¿Cuál es el estimador DiD?',
      options: [
        {
          id: 'a',
          text: '-7.68 USD, porque el gasto medio de los usuarios tratados disminuyó tras el lanzamiento',
          correct: false,
          feedback:
            'Esa cifra solo mira el antes contra después del grupo tratado e ignora la caída estacional general.',
        },
        {
          id: 'b',
          text: '+6.22 USD, porque el grupo tratado cayó 6.22 USD menos que la contracción sufrida por el control',
          correct: true,
          feedback:
            'Correcto: (-7.68) - (-13.90) = +6.22 USD; el tratamiento amortiguó la caída estacional en 6.22 USD por cliente.',
        },
        {
          id: 'c',
          text: '+6.37 USD, que corresponde únicamente a la resta postintervención 72.45 - 66.08 USD',
          correct: false,
          feedback:
            'Esa resta omite descontar la diferencia basal preexistente de +0.15 USD entre ambos grupos.',
        },
      ],
      explanation:
        'El estimador DiD resta el cambio temporal del grupo de control (-13.90 USD) al cambio temporal del grupo tratado (-7.68 USD), obteniendo (-7.68) - (-13.90) = +6.22 USD por usuario.',
    },
    {
      id: 'chk-da4-01-2',
      type: 'mcq',
      prompt:
        '¿Qué exige exactamente el supuesto de tendencias paralelas para que un análisis DiD entre tiendas tratadas y de control identifique el efecto causal?',
      options: [
        {
          id: 'a',
          text: 'Que el ticket medio inicial sea idéntico entre las tiendas tratadas y de control en el periodo previo',
          correct: false,
          feedback:
            'No es necesario que partan del mismo nivel inicial; la primera resta dentro de cada grupo cancela las diferencias fijas.',
        },
        {
          id: 'b',
          text: 'Que sin la intervención el cambio temporal medio del grupo tratado habría sido igual al del grupo de control',
          correct: true,
          feedback:
            'Exacto: la condición clave es que ambas cohortes habrían compartido la misma pendiente temporal en ausencia del programa.',
        },
        {
          id: 'c',
          text: 'Que las ventas del grupo de control permanezcan constantes con variación igual a cero entre periodos',
          correct: false,
          feedback:
            'El control puede subir o bajar por estacionalidad; precisamente usamos su variación para estimar el contrafactual.',
        },
      ],
      explanation:
        'El supuesto de tendencias paralelas permite niveles basales distintos y variaciones estacionales en el tiempo, siempre que en ausencia del tratamiento ambos grupos hubieran experimentado el mismo cambio medio.',
    },
    {
      id: 'chk-da4-01-3',
      type: 'predict-output',
      prompt:
        'En la auditoría previa al trimestre FY24-Q3, Tienda Miraflores (`tratado_pe`) subió +38.57 USD entre FY24-Q1 y FY24-Q2, mientras el control (`control_sur_andina`) subió +10.69 USD. ¿Qué devuelve `SELECT ROUND(38.57 - 10.69, 2)` y qué implica?',
      options: [
        {
          id: 'a',
          text: '27.88; indica que tratado_pe ya divergía al alza antes del piloto y falla el supuesto de tendencias paralelas',
          correct: true,
          feedback:
            'Correcto: una brecha placebo de +27.88 USD antes del lanzamiento demuestra que las trayectorias previas no eran paralelas.',
        },
        {
          id: 'b',
          text: '27.88; demuestra que el piloto de FY24-Q3 tuvo un impacto causal altamente rentable en Perú',
          correct: false,
          feedback:
            'En FY24-Q1 y FY24-Q2 el piloto de FY24-Q3 aún no existía; esa brecha es sesgo preexistente, no efecto del programa.',
        },
        {
          id: 'c',
          text: '0.00; confirma que ambos grupos evolucionaban al mismo ritmo durante el primer semestre',
          correct: false,
          feedback:
            'La diferencia entre 38.57 y 10.69 es 27.88 USD, muy lejos de cero.',
        },
      ],
      explanation:
        'La prueba de placebo entre FY24-Q1 y FY24-Q2 arroja 38.57 - 10.69 = +27.88 USD antes de iniciar la intervención de FY24-Q3, probando que Tienda Miraflores ya tenía una tendencia ascendente propia.',
    },
    {
      id: 'chk-da4-01-4',
      type: 'mcq',
      prompt:
        'Al calcular medias trimestrales en SQL, un analista escribe `AVG(CASE WHEN c.fiscal_quarter = \'FY24-Q3\' THEN o.total_usd ELSE 0 END)`. ¿Qué error introduce ese `ELSE 0`?',
      options: [
        {
          id: 'a',
          text: 'Introduce ceros para todos los pedidos de otros trimestres en el denominador de AVG(), hundiendo artificialmente la media',
          correct: true,
          feedback:
            'Exacto: AVG() promedia esos ceros como si fueran pedidos de 0 USD; debe usarse FILTER (WHERE ...) o ELSE NULL.',
        },
        {
          id: 'b',
          text: 'Provoca un error de compilación porque DuckDB prohíbe usar CASE WHEN dentro de AVG()',
          correct: false,
          feedback:
            'La consulta compila y ejecuta sin error de sintaxis, lo que hace al defecto silencioso y más peligroso.',
        },
        {
          id: 'c',
          text: 'Multiplica por dos el resultado de los pedidos completados en FY24-Q3',
          correct: false,
          feedback:
            'Incluir ceros en una media de importes positivos reduce el promedio hacia cero, no lo duplica.',
        },
      ],
      explanation:
        'Cuando se usa ELSE 0 dentro de AVG(), todas las filas que no pertenecen a FY24-Q3 entran al promedio con valor 0 USD. Usar AVG(o.total_usd) FILTER (WHERE c.fiscal_quarter = \'FY24-Q3\') restringe el denominador solo a ese trimestre.',
    },
  ],
  practice: {
    type: 'sql',
    title: 'Auditar con DiD y prueba de placebo el reclamo comercial de Tienda Miraflores (Perú)',
    language: 'sql',
    prompt:
      'La gerencia de operaciones sostiene que una promoción lanzada en `FY24-Q3` en la tienda minorista de Perú (`s.country_code = \'PE\'`) elevó el ticket medio frente al resto de tiendas minoristas de las regiones `Andina` y `Cono Sur`. Consulta `orders`, `stores` y `calendar` filtrando `o.status = \'completed\'`, `s.store_type = \'retail\'`, `s.region IN (\'Andina\', \'Cono Sur\')` y `c.fiscal_quarter IN (\'FY24-Q1\', \'FY24-Q2\', \'FY24-Q3\')`. Agrupa por `grupo` (`\'tratado_pe\'` cuando `s.country_code = \'PE\'` y `\'control_sur_andina\'` en caso contrario) y devuelve: `grupo`, `media_q1`, `media_q2`, `media_q3`, `cambio_placebo_q2_q1` (media de Q2 menos media de Q1, redondeada a 2 decimales) y `cambio_post_q3_q2` (media de Q3 menos media de Q2, redondeada a 2 decimales). Ordena por `grupo ASC`.',
    starterCode: `WITH panel_tiendas AS (
  SELECT
    CASE
      WHEN s.country_code = 'PE' THEN 'tratado_pe'
      ELSE 'control_sur_andina'
    END AS grupo,
    c.fiscal_quarter,
    o.total_usd
  FROM orders AS o
  INNER JOIN stores AS s ON o.store_id = s.store_id
  INNER JOIN calendar AS c ON o.order_date = c.calendar_date
  WHERE o.status = 'completed'
    AND s.store_type = 'retail'
    AND s.region IN ('Andina', 'Cono Sur')
    AND c.fiscal_quarter IN ('FY24-Q1', 'FY24-Q2', 'FY24-Q3')
)
SELECT
  grupo,
  ROUND(AVG(total_usd) FILTER (WHERE fiscal_quarter = 'FY24-Q1'), 2) AS media_q1,
  ROUND(AVG(total_usd) FILTER (WHERE fiscal_quarter = 'FY24-Q2'), 2) AS media_q2,
  ROUND(AVG(total_usd) FILTER (WHERE fiscal_quarter = 'FY24-Q3'), 2) AS media_q3,
  -- Reemplaza los ceros por el cálculo de cambio_placebo_q2_q1 y cambio_post_q3_q2:
  0.0 AS cambio_placebo_q2_q1,
  0.0 AS cambio_post_q3_q2
FROM panel_tiendas
GROUP BY grupo
ORDER BY grupo ASC;`,
    expected: `WITH panel_tiendas AS (
  SELECT
    CASE
      WHEN s.country_code = 'PE' THEN 'tratado_pe'
      ELSE 'control_sur_andina'
    END AS grupo,
    c.fiscal_quarter,
    o.total_usd
  FROM orders AS o
  INNER JOIN stores AS s ON o.store_id = s.store_id
  INNER JOIN calendar AS c ON o.order_date = c.calendar_date
  WHERE o.status = 'completed'
    AND s.store_type = 'retail'
    AND s.region IN ('Andina', 'Cono Sur')
    AND c.fiscal_quarter IN ('FY24-Q1', 'FY24-Q2', 'FY24-Q3')
)
SELECT
  grupo,
  ROUND(AVG(total_usd) FILTER (WHERE fiscal_quarter = 'FY24-Q1'), 2) AS media_q1,
  ROUND(AVG(total_usd) FILTER (WHERE fiscal_quarter = 'FY24-Q2'), 2) AS media_q2,
  ROUND(AVG(total_usd) FILTER (WHERE fiscal_quarter = 'FY24-Q3'), 2) AS media_q3,
  ROUND(
    AVG(total_usd) FILTER (WHERE fiscal_quarter = 'FY24-Q2')
    - AVG(total_usd) FILTER (WHERE fiscal_quarter = 'FY24-Q1'),
    2
  ) AS cambio_placebo_q2_q1,
  ROUND(
    AVG(total_usd) FILTER (WHERE fiscal_quarter = 'FY24-Q3')
    - AVG(total_usd) FILTER (WHERE fiscal_quarter = 'FY24-Q2'),
    2
  ) AS cambio_post_q3_q2
FROM panel_tiendas
GROUP BY grupo
ORDER BY grupo ASC;`,
    orderMatters: true,
    hints: [
      'La prueba de placebo compara los dos trimestres previos a la intervención: resta AVG(total_usd) FILTER (WHERE fiscal_quarter = \'FY24-Q1\') a la media de FY24-Q2 y aplica ROUND(..., 2).',
      'De igual forma, calcula cambio_post_q3_q2 restando la media de FY24-Q2 a la media de FY24-Q3 antes de redondear.',
      'Usa ROUND(AVG(total_usd) FILTER (WHERE fiscal_quarter = \'FY24-Q2\') - AVG(total_usd) FILTER (WHERE fiscal_quarter = \'FY24-Q1\'), 2) AS cambio_placebo_q2_q1.',
    ],
    solution: `WITH panel_tiendas AS (
  SELECT
    CASE
      WHEN s.country_code = 'PE' THEN 'tratado_pe'
      ELSE 'control_sur_andina'
    END AS grupo,
    c.fiscal_quarter,
    o.total_usd
  FROM orders AS o
  INNER JOIN stores AS s ON o.store_id = s.store_id
  INNER JOIN calendar AS c ON o.order_date = c.calendar_date
  WHERE o.status = 'completed'
    AND s.store_type = 'retail'
    AND s.region IN ('Andina', 'Cono Sur')
    AND c.fiscal_quarter IN ('FY24-Q1', 'FY24-Q2', 'FY24-Q3')
)
SELECT
  grupo,
  ROUND(AVG(total_usd) FILTER (WHERE fiscal_quarter = 'FY24-Q1'), 2) AS media_q1,
  ROUND(AVG(total_usd) FILTER (WHERE fiscal_quarter = 'FY24-Q2'), 2) AS media_q2,
  ROUND(AVG(total_usd) FILTER (WHERE fiscal_quarter = 'FY24-Q3'), 2) AS media_q3,
  ROUND(
    AVG(total_usd) FILTER (WHERE fiscal_quarter = 'FY24-Q2')
    - AVG(total_usd) FILTER (WHERE fiscal_quarter = 'FY24-Q1'),
    2
  ) AS cambio_placebo_q2_q1,
  ROUND(
    AVG(total_usd) FILTER (WHERE fiscal_quarter = 'FY24-Q3')
    - AVG(total_usd) FILTER (WHERE fiscal_quarter = 'FY24-Q2'),
    2
  ) AS cambio_post_q3_q2
FROM panel_tiendas
GROUP BY grupo
ORDER BY grupo ASC;`,
    solutionExplanation:
      'Entre FY24-Q1 y FY24-Q2 (antes de la promoción de FY24-Q3), tratado_pe ya había crecido +38.57 USD frente a +10.69 USD del grupo de control (una brecha placebo de +27.88 USD), demostrando que las tendencias previas no eran paralelas y que un DiD directo sobreestimaría el impacto.',
    expectedOutputTable: [
      {
        grupo: 'control_sur_andina',
        media_q1: 402.72,
        media_q2: 413.41,
        media_q3: 397.16,
        cambio_placebo_q2_q1: 10.69,
        cambio_post_q3_q2: -16.25,
      },
      {
        grupo: 'tratado_pe',
        media_q1: 387.12,
        media_q2: 425.68,
        media_q3: 436.54,
        cambio_placebo_q2_q1: 38.57,
        cambio_post_q3_q2: 10.86,
      },
    ],
  },
  roleNotes: {
    da: 'Como analista de datos, nunca entregues un DiD de dos periodos sin adjuntar al menos un corte preintervención adicional (t-2 a t-1); esa columna de placebo es tu seguro contra falsos positivos por tendencias previas divergentes.',
    bi: 'En tableros de seguimiento de pilotos regionales, grafica las series indexadas al periodo inmediatamente anterior al cambio (t-1 = 0) para que dirección visualice al instante si las curvas caminaban juntas antes de la intervención.',
    de: 'Garantiza que las asignaciones de tienda (store_id) y fechas contables (order_date) no sufran reescrituras retroactivas al cambiar de trimestre; un cambio de definición contable en una sola región fabrica un efecto DiD artificial.',
  },
  summary: [
    'El estimador de diferencias en diferencias (DiD) resta la variación temporal del grupo de control al cambio temporal observado en el grupo tratado.',
    'La primera resta dentro de cada grupo elimina diferencias basales fijas entre tiendas y la segunda resta descuenta choques estacionales comunes.',
    'La validez causal del diseño descansa en el supuesto de tendencias paralelas, que auditamos con pruebas de placebo en trimestres previos al tratamiento.',
    'Un placebo preintervención lejano de cero o un choque publicitario concurrente en marketing_spend invalida la atribución causal directa.',
  ],
  flashcards: [
    {
      id: 'fc-da4-01-1',
      front: '¿Qué dos fuentes de sesgo elimina el estimador DiD 2x2?',
      back: 'Elimina las diferencias permanentes de nivel entre el grupo tratado y el de control (mediante la resta pre/post) y los choques temporales comunes a ambos grupos (mediante la resta entre cohortes).',
    },
    {
      id: 'fc-da4-01-2',
      front: '¿En qué consiste una prueba de placebo temporal en un estudio DiD?',
      back: 'Consiste en calcular el estimador DiD entre dos periodos anteriores a la intervención (por ejemplo, FY24-Q1 y FY24-Q2) donde ninguna unidad estaba tratada y el efecto debe ser cercano a cero.',
    },
    {
      id: 'fc-da4-01-3',
      front: '¿Cómo se construye el valor contrafactual postintervención del grupo tratado en DiD?',
      back: 'Sumando a la media preintervención del grupo tratado la variación temporal media experimentada por el grupo de control entre el preperiodo y el postperiodo.',
    },
    {
      id: 'fc-da4-01-4',
      front: '¿Qué es un confusor variante en el tiempo en un diseño de diferencias en diferencias?',
      back: 'Es un factor externo, como un aumento regional del gasto en marketing_spend, que cambia al mismo tiempo que el tratamiento pero afecta solo a uno de los grupos.',
    },
  ],
  glossaryTerms: [
    'diferencias-en-diferencias',
    'tendencias-paralelas',
    'prueba-de-placebo',
  ],
  sources: [
    {
      title: 'Causal Inference: The Mixtape — Chapter 9: Difference-in-Differences',
      url: 'https://mixtape.scunning.com/09-Difference_in_Differences.html',
      publisher: 'Yale University Press / Scott Cunningham',
      accessed: '2026-10-29',
      supports:
        'Derivación de resultados potenciales del estimador DiD 2x2 y pruebas de tendencias previas.',
    },
    {
      title: 'The Effect — Chapter 18: Difference-in-Differences',
      url: 'https://theeffectbook.net/ch-DifferenceinDifference.html',
      publisher: 'Chapman & Hall / Nick Huntington-Klein',
      accessed: '2026-10-29',
      supports:
        'Evaluación empírica del supuesto de tendencias paralelas, placebos temporales y choques concurrentes.',
    },
    {
      title:
        'Causal Inference for the Brave and True — Chapter 13: Difference-in-Differences',
      url: 'https://matheusfacure.github.io/python-causality-handbook/13-Difference-in-Differences.html',
      publisher: 'Matheus Facure',
      accessed: '2026-10-29',
      supports:
        'Aplicación práctica de diferencias en diferencias en intervenciones comerciales por ciudad y tienda.',
    },
    {
      title: 'DuckDB SQL Aggregate Functions and FILTER Clause',
      url: 'https://duckdb.org/docs/stable/sql/functions/aggregates',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports:
        'Sintaxis de agregación condicional AVG(col) FILTER (WHERE ...) para paneles pre/post.',
    },
  ],
  aiNotes:
    'Guía al estudiante a distinguir entre igualdad de niveles iniciales (no requerida en DiD) e igualdad de pendientes contrafactuales (tendencias paralelas). En la práctica con Tienda Miraflores (Perú), oriéntalo a restar las medias de FY24-Q2 y FY24-Q1 con cláusulas FILTER sin entregarle el bloque completo, y pregúntale qué significa que el placebo preintervención sea +38.57 frente a +10.69 USD.',
};
