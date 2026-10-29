export default {
  id: 'da4-causalidad-01-diferencias-en-diferencias-did',
  moduleId: 'da4-causalidad',
  track: 'da',
  level: 4,
  order: 1,
  title: 'Diferencias en diferencias (DiD) y tendencias paralelas',
  subtitle:
    'Diferencias en diferencias (DiD): supuesto de tendencias paralelas y pruebas de placebo',
  durationMinutes: 25,
  prerequisites: [
    'da4-modelos-01',
    'da2-inferencia-05-pruebas-hipotesis-valor-p',
    'c0-numeros-05-correlacion-causalidad',
  ],
  datasets: ['orders', 'stores', 'calendar', 'marketing_spend'],
  hook: {
    question:
      'En el tercer trimestre fiscal de 2024, Tienda Salamanca activó un programa piloto de envío prioritario y asesoría de grano en tienda. Su ticket medio subió de 390.00 USD en FY24-Q2 a 461.29 USD en FY24-Q3 (+71.28 USD). La gerencia regional afirma que los 71.28 USD completos provienen del piloto, mientras finanzas sospecha de un alza estacional. ¿Cómo separas el efecto causal del programa de la tendencia temporal y de las diferencias permanentes entre sucursales cuando no hubo asignación aleatoria?',
    context:
      'Evaluación cuasiexperimental de pilotos comerciales por sucursal en Mercado Brisa combinando orders, stores y calendar.',
  },
  objectives: [
    'Estimar el efecto causal en un diseño de diferencias en diferencias (DiD) 2x2 restando la evolución del grupo de control al cambio del grupo tratado.',
    'Auditar el supuesto de tendencias paralelas mediante pruebas de placebo preintervención entre trimestres previos al tratamiento.',
    'Diagnosticar amenazas por choques concurrentes variantes en el tiempo cruzando resultados operativos con gasto de marketing regional.',
  ],
  sections: [
    {
      id: 'limites-comparaciones-ingenuas',
      heading: 'Por qué fallan el antes contra después y el corte transversal',
      body: 'Cuando una intervención comercial se despliega en una tienda o región sin sorteo aleatorio, dos comparaciones habituales inducen a error. La primera es comparar la misma unidad antes y después del cambio: si el ticket de Tienda Salamanca (`STR-ES-01`) sube `+71.28 USD` entre `FY24-Q2` y `FY24-Q3`, ese salto mezcla el impacto del programa con cualquier choque macroeconómico, inflación o campaña estacional ocurrida en ese trimestre.\n\nLa segunda trampa consiste en comparar en `FY24-Q3` la tienda tratada contra otras sucursales no intervenidas, como Tienda Las Condes (`STR-CL-02`, media de `497.63 USD`) o Tienda Polanco Sur (`STR-MX-02`, media de `503.62 USD`). Como esas sucursales operan en mercados con un poder adquisitivo basal más alto desde antes de la intervención, una resta transversal simple daría un efecto negativo espurio de `-38.24 USD`.\n\nEl diseño de **diferencias en diferencias (DiD)** resuelve ambos problemas simultáneamente al seguir un panel de unidades tratadas y de control a través del tiempo. La primera diferencia (dentro de cada grupo, después menos antes) elimina las brechas estructurales fijas en el tiempo entre tiendas. La segunda diferencia (cambio del tratado menos cambio del control) descuenta el choque temporal común compartido por ambas cohortes.',
      callout: {
        type: 'KeyIdea',
        title: 'Doble eliminación de sesgos en DiD',
        body: 'Restar el periodo preintervención dentro de cada tienda purga la heterogeneidad fija entre sucursales; restar la evolución del grupo de control purga la estacionalidad común entre periodos.',
      },
      visual: {
        type: 'mermaid',
        spec: 'flowchart LR\n  A["Cambio bruto en tratado\\n(Y_T,post - Y_T,pre)"] --> C["Estimador DiD\\nEfecto causal ATT"]\n  B["Tendencia común en control\\n(Y_C,post - Y_C,pre)"] -->|"Se descuenta"| C\n  D["Brecha basal fija\\n(Y_T,pre - Y_C,pre)"] -->|"Eliminada por la 1.ª resta"| C',
        caption:
          'Descomposición del estimador de diferencias en diferencias frente a sesgos fijos y temporales.',
      },
    },
    {
      id: 'estimador-did-contrafactual',
      heading: 'El estimador DiD 2x2 y la construcción del contrafactual',
      body: 'Sea $D_i \\in \\{0, 1\\}$ el indicador de pertenencia al grupo tratado y $t \\in \\{\\text{pre}, \\text{post}\\}$ el periodo de observación. El parámetro de interés en diferencias en diferencias es el **efecto medio del tratamiento sobre los tratados (ATT)** en el periodo posterior: cuánto vendió la tienda intervenida en comparación con lo que habría vendido esa misma tienda si no hubiera recibido el programa.\n\nComo el resultado potencial sin tratamiento después del cambio, $E[Y_{i,\\text{post}}(0) \\mid D_i = 1]$, no es observable, el método DiD lo reconstruye sumando al nivel preintervención del grupo tratado la variación temporal observada en el grupo de control. En el caso de Tienda Salamanca (`STR-ES-01`, tratada en `FY24-Q3`) frente al comparador (`STR-MX-02` y `STR-CL-02`), el ticket preintervención en `FY24-Q2` fue de `390.00 USD` en Salamanca y `498.83 USD` en el control.\n\nEn `FY24-Q3`, el control avanzó apenas `+0.71 USD` (hasta `499.53 USD`), por lo que el contrafactual proyectado para Salamanca sin programa es $390.00 + 0.71 = 390.71\\text{ USD}$. Al contrastar el valor observado de `461.29 USD` contra ese contrafactual de `390.71 USD`, obtenemos un efecto DiD de `+70.57 USD` por pedido.',
      formula: {
        latex:
          '\\hat{\\tau}_{\\text{DiD}} = \\left(\\bar{Y}_{T,\\text{post}} - \\bar{Y}_{T,\\text{pre}}\\right) - \\left(\\bar{Y}_{C,\\text{post}} - \\bar{Y}_{C,\\text{pre}}\\right)',
        explanation:
          'Donde Y_T y Y_C representan las medias muestrales del grupo tratado y del grupo de control antes y después de la intervención.',
      },
      codeExample: {
        language: 'sql',
        code: `WITH medias AS (
  SELECT
    CASE WHEN o.store_id = 10 THEN 'tratado' ELSE 'control' END AS grupo,
    AVG(o.total_usd) FILTER (WHERE c.fiscal_quarter = 'FY24-Q2') AS pre_q2,
    AVG(o.total_usd) FILTER (WHERE c.fiscal_quarter = 'FY24-Q3') AS post_q3
  FROM orders o
  JOIN calendar c ON o.order_date = c.calendar_date
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
        caption:
          'Cálculo declarativo de medias pre/post con cláusula FILTER en DuckDB.',
      },
    },
    {
      id: 'supuesto-tendencias-paralelas-placebo',
      heading: 'Supuesto de tendencias paralelas y pruebas de placebo',
      body: 'El estimador DiD no exige que el grupo tratado y el de control tengan el mismo nivel inicial de ventas: Tienda Salamanca partía más de `108 USD` por debajo de sus tiendas comparadoras. Lo que exige de forma estricta es el **supuesto de tendencias paralelas**: en ausencia de la intervención, el ticket medio del grupo tratado habría cambiado entre `FY24-Q2` y `FY24-Q3` al mismo ritmo que el grupo de control.\n\nComo la trayectoria contrafactual en `FY24-Q3` nunca se observa, el supuesto no puede demostrarse de manera directa en el periodo posterior. Sin embargo, podemos someterlo a una **prueba de falsación o placebo temporal** (*pre-trend placebo test*) en los periodos previos al tratamiento. Si aplicamos exactamente la misma fórmula DiD entre `FY24-Q1` y `FY24-Q2`, cuando ninguna tienda había recibido el piloto, el efecto estimado debe ser cercano a cero.\n\nEn el caso de Salamanca (`+9.66 USD` de `Q1` a `Q2`) frente al comparador (`+9.61 USD` de `Q1` a `Q2`), la diferencia preintervención es de apenas `+0.05 USD`. Por el contrario, cuando analizamos Tienda Miraflores en Perú (`STR-PE-01`) frente al resto de tiendas minoristas de Sudamérica, la brecha entre `FY24-Q1` y `FY24-Q2` ya era de `+27.88 USD` antes de iniciar `FY24-Q3`, señal inequívoca de que las tendencias previas divergían.',
      callout: {
        type: 'warning',
        title: 'Placebo fallido invalida el estimador',
        body: 'Si la prueba de placebo entre t-2 y t-1 arroja una divergencia sustancial antes del lanzamiento, la diferencia postintervención absorberá la inercia previa y sesgará la conclusión causal.',
      },
      visual: {
        type: 'table',
        spec: {
          headers: [
            'Caso evaluado',
            'Cambio Q1 a Q2 (Tratado)',
            'Cambio Q1 a Q2 (Control)',
            'Placebo Pre (USD)',
            'Diagnóstico de tendencias',
          ],
          rows: [
            [
              'Salamanca (STR-ES-01) vs. MX-02 / CL-02',
              '+9.66 USD',
              '+9.61 USD',
              '+0.05 USD',
              'Paralelismo respaldado en preperiodo',
            ],
            [
              'Miraflores (STR-PE-01) vs. Retail Sur/Andina',
              '+38.57 USD',
              '+10.69 USD',
              '+27.88 USD',
              'Tendencias divergentes antes del piloto',
            ],
          ],
        },
        caption:
          'Contraste de la prueba de placebo preintervención (FY24-Q1 a FY24-Q2) en dos análisis de tiendas de Mercado Brisa.',
      },
    },
    {
      id: 'choques-concurrentes-sql',
      heading: 'Amenazas por choques concurrentes y auditoría en SQL',
      body: 'Superar la prueba de placebo preintervención es necesario, pero no suficiente. El supuesto de tendencias paralelas también se quiebra si, justo en el trimestre del tratamiento (`FY24-Q3`), ocurre un **choque concurrente específico del grupo** (*confusor variante en el tiempo*): por ejemplo, que el equipo de adquisición digital duplique el gasto publicitario únicamente en la región tratada.\n\nPara blindar un estudio DiD en Mercado Brisa, siempre auditamos la tabla `marketing_spend` cruzada con `calendar` en los mismos trimestres. Durante el paso de `FY24-Q2` a `FY24-Q3`, el gasto diario medio de marketing en la región `Iberia` bajó levemente de `153.17 USD` a `150.93 USD` (`-2.24 USD/día`), lo que descarta que el salto de `+70.57 USD` en Tienda Salamanca provenga de una inyección publicitaria.\n\nEn cambio, en la región `Andina` el gasto diario en campañas subió de `180.49 USD` en `FY24-Q2` a `187.97 USD` en `FY24-Q3` (`+7.48 USD/día`), mientras en `Cono Sur` permaneció estancado (`+0.13 USD/día`). Un analista senior reporta juntas la tabla de resultados, el placebo preintervención y la verificación de covariables variantes en el tiempo.',
      codeExample: {
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
FROM marketing_spend m
JOIN calendar c ON m.spend_date = c.calendar_date
WHERE c.fiscal_quarter IN ('FY24-Q2', 'FY24-Q3')
GROUP BY m.region
ORDER BY m.region;`,
        caption:
          'Auditoría de choques publicitarios concurrentes en marketing_spend entre FY24-Q2 y FY24-Q3.',
      },
      callout: {
        type: 'tip',
        title: 'Regla práctica con cláusulas FILTER',
        body: 'Agrupar por cohorte y calcular cada trimestre con AVG(metrica) FILTER (WHERE fiscal_quarter = ...) evita auto-joins costosos y mantiene en una sola fila el placebo y el efecto post.',
      },
    },
  ],
  workedExample: {
    title:
      'Evaluación DiD y prueba de placebo del piloto en Tienda Salamanca (STR-ES-01)',
    scenario:
      'Dirección comercial solicita estimar el impacto causal del piloto desplegado en Tienda Salamanca (store_id = 10) durante FY24-Q3 sobre el ticket medio de pedidos completados (total_usd), empleando como grupo de control las tiendas comparadoras STR-MX-02 y STR-CL-02 (store_id IN (2, 7)) y auditando la tendencia previa entre FY24-Q1 y FY24-Q2.',
    datasets: ['orders', 'calendar'],
    steps: [
      {
        order: 1,
        explanation:
          'Construimos una CTE base que filtra únicamente los pedidos con estado completed en las tres tiendas del estudio durante los trimestres FY24-Q1, FY24-Q2 y FY24-Q3, etiquetando a store_id = 10 como 1_tratado_salamanca y a las sucursales 2 y 7 como 2_control_comparador.',
        code: `WITH base AS (
  SELECT
    CASE WHEN o.store_id = 10 THEN '1_tratado_salamanca' ELSE '2_control_comparador' END AS grupo,
    c.fiscal_quarter,
    o.total_usd
  FROM orders o
  JOIN calendar c ON o.order_date = c.calendar_date
  WHERE o.status = 'completed'
    AND o.store_id IN (2, 7, 10)
    AND c.fiscal_quarter IN ('FY24-Q1', 'FY24-Q2', 'FY24-Q3')
)
SELECT grupo, COUNT(*) AS n_pedidos
FROM base
GROUP BY grupo
ORDER BY grupo;`,
        output: `grupo                 | n_pedidos
----------------------+----------
1_tratado_salamanca   | 256
2_control_comparador  | 499`,
      },
      {
        order: 2,
        explanation:
          'Calculamos las medias trimestrales de total_usd en FY24-Q1, FY24-Q2 y FY24-Q3 para cada grupo, junto con la variación preintervención (delta_pre_q2_q1) y la variación postintervención (delta_post_q3_q2).',
        code: `WITH base AS (
  SELECT
    CASE WHEN o.store_id = 10 THEN '1_tratado_salamanca' ELSE '2_control_comparador' END AS grupo,
    c.fiscal_quarter,
    o.total_usd
  FROM orders o
  JOIN calendar c ON o.order_date = c.calendar_date
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
        output: `grupo                 | n_pedidos | media_q1 | media_q2 | media_q3 | delta_pre_q2_q1 | delta_post_q3_q2
----------------------+-----------+----------+----------+----------+-----------------+-----------------
1_tratado_salamanca   | 256       | 380.35   | 390.00   | 461.29   | 9.66            | 71.28
2_control_comparador  | 499       | 489.22   | 498.83   | 499.53   | 9.61            | 0.71`,
      },
      {
        order: 3,
        explanation:
          'Verificamos la prueba de placebo preintervención restando los cambios de Q1 a Q2: 9.66 - 9.61 = +0.05 USD, confirmando paralelismo previo. Luego estimamos el efecto causal DiD en Q3 restando los cambios de Q2 a Q3: 71.28 - 0.71 = +70.57 USD por pedido.',
        code: `SELECT
  ROUND(9.66 - 9.61, 2) AS placebo_pre_did_usd,
  ROUND(390.00 + 0.71, 2) AS contrafactual_salamanca_q3_usd,
  ROUND(71.28 - 0.71, 2) AS efecto_causal_did_usd;`,
        output: `placebo_pre_did_usd | contrafactual_salamanca_q3_usd | efecto_causal_did_usd
--------------------+--------------------------------+----------------------
0.05                | 390.71                         | 70.57`,
      },
    ],
    takeaway:
      'El piloto de Tienda Salamanca generó un efecto causal estimado de +70.57 USD por pedido: el grupo de control evolucionó de forma casi idéntica antes del cambio (placebo de +0.05 USD) y aportó apenas +0.71 USD de deriva estacional en FY24-Q3.',
  },
  checks: [
    {
      id: 'check-did-contrafactual',
      type: 'multiple-choice',
      prompt:
        'En el experimento EXP-FREE-SHIP-45 de Mercado Brisa, el gasto medio del grupo tratado pasó de 80.13 USD antes del cambio a 72.45 USD después (-7.68 USD), mientras que el grupo de control pasó de 79.98 USD a 66.08 USD (-13.90 USD). ¿Cuál es el estimador de diferencias en diferencias?',
      options: [
        {
          id: 'a',
          label:
            '-7.68 USD, porque el gasto medio de los usuarios tratados disminuyó tras el lanzamiento.',
        },
        {
          id: 'b',
          label:
            '+6.22 USD, porque el grupo tratado cayó 6.22 USD menos que la contracción estacional sufrida por el control.',
        },
        {
          id: 'c',
          label:
            '+6.37 USD, que corresponde exclusivamente a la resta postintervención 72.45 - 66.08 USD.',
        },
        {
          id: 'd',
          label:
            '-21.58 USD, obtenido al sumar las caídas temporales de ambos grupos.',
        },
      ],
      correctOptionId: 'b',
      explanation:
        'El estimador DiD resta el cambio del control (-13.90 USD) al cambio del grupo tratado (-7.68 USD), dando (-7.68) - (-13.90) = +6.22 USD. La opción a comete el error antes/después ignorando la caída estacional general; la c ignora la brecha basal previa (+0.15 USD) y la d suma en vez de restar.',
    },
    {
      id: 'check-did-tendencias-paralelas',
      type: 'multiple-choice',
      prompt:
        '¿Qué exige exactamente el supuesto de tendencias paralelas para que un análisis DiD entre tiendas tratadas y de control identifique el efecto causal?',
      options: [
        {
          id: 'a',
          label:
            'Que el ticket medio inicial sea estadísticamente idéntico entre las tiendas tratadas y las de control en el periodo previo.',
        },
        {
          id: 'b',
          label:
            'Que sin la intervención el cambio medio temporal del grupo tratado habría sido igual al cambio medio temporal del grupo de control.',
        },
        {
          id: 'c',
          label:
            'Que las ventas del grupo de control permanezcan constantes con variación igual a cero entre el preperiodo y el postperiodo.',
        },
        {
          id: 'd',
          label:
            'Que los clientes se asignen mediante sorteo aleatorio diario entre las tiendas físicas de ambas regiones.',
        },
      ],
      correctOptionId: 'b',
      explanation:
        'El supuesto de tendencias paralelas permite niveles basales distintos (la opción a es falsa, pues la primera diferencia los cancela) y permite que el control suba o baje en el tiempo (la opción c es falsa). Tampoco requiere aleatorización (opción d), sino que la pendiente contrafactual sin tratamiento coincida entre ambos grupos.',
    },
    {
      id: 'check-did-predict-placebo',
      type: 'predict-output',
      prompt:
        'Analiza el resultado de la consulta para Tienda Miraflores (tratado_pe, cambio Q1->Q2 de +38.57 USD) y el control (control_sur_andina, cambio Q1->Q2 de +10.69 USD). ¿Qué valor devuelve la prueba de placebo antes de la intervención de FY24-Q3 y qué implica?',
      code: `SELECT
  ROUND(38.57 - 10.69, 2) AS brecha_placebo_pre_usd;`,
      options: [
        {
          id: 'a',
          label:
            'Devuelve 27.88 USD; indica que tratado_pe ya crecía mucho más rápido antes del piloto y las tendencias paralelas fallan.',
        },
        {
          id: 'b',
          label:
            'Devuelve 27.88 USD; demuestra que el piloto de FY24-Q3 tuvo un impacto causal altamente significativo.',
        },
        {
          id: 'c',
          label:
            'Devuelve 0.00 USD; confirma que ambos grupos evolucionaban en paralelo durante el primer semestre.',
        },
      ],
      correctOptionId: 'a',
      explanation:
        'La resta 38.57 - 10.69 produce 27.88 USD entre FY24-Q1 y FY24-Q2, cuando el programa de FY24-Q3 aún no existía. La opción b confunde una divergencia preexistente con el efecto del tratamiento, y la opción c realiza un cálculo aritmético incorrecto.',
    },
    {
      id: 'check-did-spot-bug',
      type: 'spot-the-bug',
      prompt:
        'Un analista escribió esta consulta para estimar el cambio entre FY24-Q2 y FY24-Q3 en pedidos completados, pero incluye pedidos cancelados y mezcla todos los trimestres del calendario en el denominador. ¿Cuál es el defecto principal?',
      code: `SELECT
  s.region,
  AVG(CASE WHEN c.fiscal_quarter = 'FY24-Q3' THEN o.total_usd ELSE 0 END)
  - AVG(CASE WHEN c.fiscal_quarter = 'FY24-Q2' THEN o.total_usd ELSE 0 END) AS delta_q3_q2
FROM orders o
JOIN stores s ON o.store_id = s.store_id
JOIN calendar c ON o.order_date = c.calendar_date
GROUP BY s.region;`,
      options: [
        {
          id: 'a',
          label:
            'Usar ELSE 0 dentro de AVG() introduce ceros de otros trimestres en la media y además falta filtrar o.status = completed.',
        },
        {
          id: 'b',
          label:
            'En DuckDB la función AVG() no acepta expresiones condicionales CASE WHEN y lanza un error de sintaxis.',
        },
        {
          id: 'c',
          label:
            'La cláusula GROUP BY s.region impide restar dos agregaciones dentro de la misma lista SELECT.',
        },
      ],
      correctOptionId: 'a',
      explanation:
        'Escribir AVG(CASE WHEN ... THEN total_usd ELSE 0 END) promedia ceros para todas las filas fuera de ese trimestre, hundiendo artificialmente la media; debe usarse FILTER (WHERE ...) o ELSE NULL junto con WHERE o.status = completed. Las opciones b y c son falsas porque DuckDB admite tanto CASE dentro de AVG como restas entre agregados.',
    },
  ],
  practice: {
    id: 'practice-da4-causalidad-01-did-placebo',
    title:
      'Auditar con DiD y prueba de placebo el reclamo comercial de Tienda Miraflores (Perú)',
    prompt:
      'La gerencia de operaciones sostiene que una promoción lanzada en FY24-Q3 en la tienda minorista de Perú (s.country_code = \'PE\') elevó el ticket medio frente al resto de tiendas minoristas de las regiones Andina y Cono Sur. Construye una consulta sobre orders, stores y calendar (filtrando o.status = \'completed\', s.store_type = \'retail\', s.region IN (\'Andina\', \'Cono Sur\') y c.fiscal_quarter IN (\'FY24-Q1\', \'FY24-Q2\', \'FY24-Q3\')) que agrupe por grupo (\'tratado_pe\' cuando s.country_code = \'PE\', y \'control_sur_andina\' en caso contrario) y devuelva: grupo, media_q1, media_q2, media_q3, cambio_placebo_q2_q1 (media de Q2 menos media de Q1, redondeada a 2 decimales) y cambio_post_q3_q2 (media de Q3 menos media de Q2, redondeada a 2 decimales). Ordena por grupo ASC.',
    engine: 'duckdb',
    datasets: ['orders', 'stores', 'calendar'],
    starterCode: `WITH panel_tiendas AS (
  SELECT
    CASE
      WHEN s.country_code = 'PE' THEN 'tratado_pe'
      ELSE 'control_sur_andina'
    END AS grupo,
    c.fiscal_quarter,
    o.total_usd
  FROM orders o
  JOIN stores s ON o.store_id = s.store_id
  JOIN calendar c ON o.order_date = c.calendar_date
  WHERE o.status = 'completed'
    AND s.store_type = 'retail'
    AND s.region IN ('Andina', 'Cono Sur')
    AND c.fiscal_quarter IN ('FY24-Q1', 'FY24-Q2', 'FY24-Q3')
)
SELECT
  grupo,
  ROUND(AVG(total_usd) FILTER (WHERE fiscal_quarter = 'FY24-Q1'), 2) AS media_q1,
  ROUND(AVG(total_usd) FILTER (WHERE fiscal_quarter = 'FY24-Q2'), 2) AS media_q2,
  ROUND(AVG(total_usd) FILTER (WHERE fiscal_quarter = 'FY24-Q3'), 2) AS media_q3
  -- TODO: agrega cambio_placebo_q2_q1 (Q2 - Q1) y cambio_post_q3_q2 (Q3 - Q2) redondeados a 2 decimales
FROM panel_tiendas
GROUP BY grupo
ORDER BY grupo ASC;`,
    solution: `WITH panel_tiendas AS (
  SELECT
    CASE
      WHEN s.country_code = 'PE' THEN 'tratado_pe'
      ELSE 'control_sur_andina'
    END AS grupo,
    c.fiscal_quarter,
    o.total_usd
  FROM orders o
  JOIN stores s ON o.store_id = s.store_id
  JOIN calendar c ON o.order_date = c.calendar_date
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
    hints: [
      'Recuerda que la prueba de placebo compara los dos trimestres previos a la intervención: resta la media no redondeada de FY24-Q1 a la de FY24-Q2 y aplica ROUND(..., 2) al resultado.',
      'De igual forma, calcula cambio_post_q3_q2 restando AVG(total_usd) FILTER (WHERE fiscal_quarter = \'FY24-Q2\') a AVG(total_usd) FILTER (WHERE fiscal_quarter = \'FY24-Q3\').',
      'Escribe ROUND(AVG(total_usd) FILTER (WHERE fiscal_quarter = \'FY24-Q2\') - AVG(total_usd) FILTER (WHERE fiscal_quarter = \'FY24-Q1\'), 2) AS cambio_placebo_q2_q1.',
    ],
    assertions: [
      { type: 'row-count', expected: 2 },
      {
        type: 'column-names',
        expected: [
          'grupo',
          'media_q1',
          'media_q2',
          'media_q3',
          'cambio_placebo_q2_q1',
          'cambio_post_q3_q2',
        ],
      },
      {
        type: 'cell-value',
        row: 0,
        column: 'cambio_placebo_q2_q1',
        expected: 10.69,
      },
      {
        type: 'cell-value',
        row: 1,
        column: 'cambio_placebo_q2_q1',
        expected: 38.57,
      },
      {
        type: 'cell-value',
        row: 1,
        column: 'cambio_post_q3_q2',
        expected: 10.86,
      },
    ],
    expectedOutputTable: {
      columns: [
        'grupo',
        'media_q1',
        'media_q2',
        'media_q3',
        'cambio_placebo_q2_q1',
        'cambio_post_q3_q2',
      ],
      rows: [
        ['control_sur_andina', 402.72, 413.41, 397.16, 10.69, -16.25],
        ['tratado_pe', 387.12, 425.68, 436.54, 38.57, 10.86],
      ],
    },
  },
  roleNotes: {
    da: 'Como analista de datos, nunca entregues un DiD de dos periodos sin adjuntar al menos un corte preintervención adicional (t-2 a t-1); esa columna de placebo es tu seguro contra falsos positivos por tendencias previas divergentes.',
    bi: 'En tableros de seguimiento de pilotos regionales, grafica las series indexadas al periodo inmediatamente anterior al cambio (t-1 = 0) para que dirección visualice al instante si las curvas caminaban juntas antes de la intervención.',
    de: 'Garantiza que las asignaciones de tienda (store_id) y fechas contables (order_date) no sufran reescrituras retroactivas al cambiar de trimestre; un cambio de definición contable en una sola región fabrica un efecto DiD artificial.',
    ds: 'Cuando las tendencias previas divergen como en Tienda Miraflores (+27.88 USD en el placebo), sustituye el DiD simple por control sintético o diferencias en diferencias sintéticas que reponderen el grupo donante.',
  },
  summary: [
    'El estimador de diferencias en diferencias (DiD) resta la variación temporal del grupo de control al cambio temporal observado en el grupo tratado.',
    'La primera resta dentro de cada grupo elimina diferencias basales fijas entre tiendas y la segunda resta descuenta choques estacionales comunes.',
    'La validez causal del diseño descansa en el supuesto de tendencias paralelas, que auditamos con pruebas de placebo en trimestres previos al tratamiento.',
    'Un placebo preintervención lejano de cero o un choque publicitario concurrente en marketing_spend invalida la atribución causal directa.',
  ],
  flashcards: [
    {
      id: 'fc-did-01',
      front: '¿Qué dos fuentes de sesgo elimina el estimador DiD 2x2?',
      back: 'Elimina las diferencias permanentes de nivel entre el grupo tratado y el de control (mediante la resta pre/post) y los choques temporales comunes a ambos grupos (mediante la resta entre cohortes).',
    },
    {
      id: 'fc-did-02',
      front: '¿En qué consiste una prueba de placebo temporal en un estudio DiD?',
      back: 'Consiste en calcular el estimador DiD entre dos periodos anteriores a la intervención (por ejemplo, FY24-Q1 y FY24-Q2) donde ninguna unidad estaba tratada y el efecto debe ser cercano a cero.',
    },
    {
      id: 'fc-did-03',
      front: '¿Cómo se construye el valor contrafactual postintervención del grupo tratado en DiD?',
      back: 'Sumando a la media preintervención del grupo tratado la variación temporal media experimentada por el grupo de control entre el preperiodo y el postperiodo.',
    },
    {
      id: 'fc-did-04',
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
    'Guía al estudiante a distinguir entre igualdad de niveles iniciales (no requerida en DiD) e igualdad de pendientes contrafactuales (tendencias paralelas). En la práctica con Tienda Miraflores (Perú), si pide ayuda con el SQL, oriéntalo a restar las medias de FY24-Q2 y FY24-Q1 con cláusulas FILTER sin entregarle el bloque completo, y pregúntale qué significa que el placebo preintervención sea +38.57 frente a +10.69 USD.',
};
