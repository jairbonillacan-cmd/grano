export default {
  id: 'da4-causalidad-04-memo-analitico-supuestos',
  moduleId: 'da4-causalidad',
  title: 'El memo analítico: estructura, supuestos y límites',
  subtitle:
    'El memo analítico: estructura narrativa, supuestos explícitos y límites del estudio',
  tracks: ['da'],
  level: 4,
  order: 4,
  minutes: 20,
  prerequisites: [
    'da4-causalidad-02-regresion-discontinua-rdd',
    'da4-causalidad-03-control-sintetico-emparejamiento',
  ],
  contentVersion: 1,
  hook: 'Tras dos semanas auditando las promociones de envío y descuentos de Mercado Brisa, llevas al comité un documento de ocho páginas que narra en orden cronológico cómo limpiaste las tablas, probaste cinco filtros y ejecutaste regresiones. Al minuto tres, la directora de operaciones interrumpe: "¿Cuál es la decisión, qué rango de dinero está en juego y qué tendría que fallar para que tu número sea falso?". ¿Cómo estructuras un memo analítico de una sola página que responda primero y blinde sus supuestos?',
  objectives: [
    'Estructurar un memo analítico de una página aplicando el principio de la pirámide (SCQA) con la tesis gobernante en el primer párrafo.',
    'Construir en SQL una tabla de evidencia autosuficiente que integre validez interna, balance preintervención, estimación ajustada e intervalo de confianza del 95 %.',
    'Formular explícitamente los supuestos de identificación y distinguir amenazas de validez interna frente a límites de validez externa.',
  ],
  sections: [
    {
      id: 'relato-cronologico-vs-piramide-scqa',
      heading: 'Del relato cronológico al principio de la pirámide (SCQA)',
      body: 'Un error frecuente en el análisis de datos consiste en escribir informes con estructura de novela policial. El autor cuenta paso a paso qué tablas consultó, qué cruces fallaron y deja la conclusión para el último párrafo. Quien analiza investiga de abajo hacia arriba, pero quien toma decisiones lee de arriba hacia abajo.\n\nEl **principio de la pirámide**, formulado por Barbara Minto, invierte ese orden mediante la apertura **SCQA** (*Situación, Complicación, Pregunta y Respuesta*). Primero presenta la Situación estable conocida por el comité (`Mercado Brisa probó en mayo el umbral de envío sin cargo a 45 USD en 1 600 clientes`). Luego introduce la Complicación que exige decidir (`Aunque el gasto bruto cayó por estacionalidad, el subsidio logístico cuesta 5.80 USD por usuario`).\n\nEsa tensión abre la Pregunta ejecutiva (`¿Supera el efecto causal neto el umbral de costo para desplegar la regla a toda la red?`). Inmediatamente aparece la **tesis gobernante** o Respuesta (`Recomendamos acotar a un piloto segmentado: el efecto causal DiD es +6.22 USD, con IC 95 % de [5.19, 7.24] USD, cuyo extremo inferior no cubre los 5.80 USD de costo`).',
    },
    {
      id: 'tabla-evidencia-autosuficiente',
      heading: 'Anatomía de una tabla de evidencia autosuficiente en SQL',
      body: 'Debajo de la tesis gobernante, el cuerpo del memo no debe apilar capturas de código ni diez cuadros dispersos. Un memo ejecutivo riguroso descansa en una **tabla de evidencia autosuficiente** generada por una única consulta reproducible en SQL.\n\nPara que la tabla se defienda por sí sola ante una auditoría financiera, cada fila debe reportar cuatro bloques de columnas en orden lógico. Primero, el **estado de validez interna**: verificar `srm_p_value >= 0.01` permite descartar de entrada pruebas rotas como `EXP-PUSH-CART` (`srm_p_value = 0.0001`). Segundo, el balance preintervención (`brecha_pre_usd`), que en los experimentos válidos de Mercado Brisa oscila apenas entre `-0.26` y `+0.15 USD`.\n\nTercero, la estimación bruta postintervención (`efecto_bruto_usd`) junto al estimador de diferencias en diferencias (`efecto_did_usd`). Esto muestra cómo el ajuste corrige desbalances iniciales: en `EXP-UPSELL-MOLINO`, el efecto pasa de `+6.46` a `+6.72 USD`. Cuarto, el **intervalo de confianza del 95 %** (`ic95_inf_usd` e `ic95_sup_usd`) calculado con el error estándar de las diferencias individuales $D_i = Y_{i,\\text{post}} - Y_{i,\\text{pre}}$.',
      example: {
        language: 'sql',
        code: `SELECT
  e.experiment_code,
  CASE WHEN e.srm_p_value < 0.01 THEN 'invalido_srm' ELSE 'valido' END AS validez_interna,
  ROUND(
    AVG(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'treatment')
    - AVG(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'control'),
    2
  ) AS efecto_did_usd
FROM experiments AS e
INNER JOIN experiment_assignments AS ea ON e.experiment_id = ea.experiment_id
GROUP BY e.experiment_id, e.experiment_code, e.srm_p_value
ORDER BY e.experiment_id;`,
        expectedOutput: [
          { experiment_code: 'EXP-CHECKOUT-1STEP', validez_interna: 'valido', efecto_did_usd: 6.87 },
          { experiment_code: 'EXP-FREE-SHIP-45', validez_interna: 'valido', efecto_did_usd: 6.22 },
          { experiment_code: 'EXP-SUB-BUNDLE', validez_interna: 'valido', efecto_did_usd: 6.55 },
          { experiment_code: 'EXP-QUIZ-ORIGEN', validez_interna: 'valido', efecto_did_usd: 6.51 },
          { experiment_code: 'EXP-UPSELL-MOLINO', validez_interna: 'valido', efecto_did_usd: 6.72 },
          { experiment_code: 'EXP-PUSH-CART', validez_interna: 'invalido_srm', efecto_did_usd: 5.77 },
        ],
      },
    },
    {
      id: 'supuestos-identificacion-lenguaje-ejecutivo',
      heading: 'Declarar supuestos de identificación en lenguaje de negocio',
      body: 'Todo número causal en datos observacionales o cuasiexperimentales depende de un supuesto no verificable al cien por ciento. Ocultar esos supuestos en una nota al pie destruye la confianza cuando otro equipo detecta una anomalía. Sin embargo, escribirlos en jerga econométrica opaca desconecta a la audiencia ejecutiva.\n\nLa regla en un memo analítico de nivel 4 consiste en traducir cada supuesto técnico a **una condición operativa concreta**. Junto a esa condición, debes reportar **la prueba empírica ejecutada para auditarla**.\n\nEn un estudio de diferencias en diferencias, evita escribir únicamente *"asumimos tendencias paralelas"*. En su lugar, redacta: *"El efecto de +70.57 USD en Tienda Salamanca asume que, sin piloto, su ticket habría crecido al mismo ritmo que Las Condes y Polanco (+0.71 USD). Respaldamos este supuesto verificando que en el trimestre previo la brecha entre ambos grupos fue de apenas +0.05 USD y que el gasto de marketing en Iberia no subió (-2.24 USD/día)"*. En regresión discontinua, traduce la continuidad indicando que los compradores de `79 USD` y `81 USD` no fuerzan el carrito y cita el conteo en `[75, 85) USD`.',
    },
    {
      id: 'limites-validez-interna-vs-externa',
      heading: 'Límites del estudio: validez interna frente a validez externa',
      body: 'El último bloque del memo separa con precisión dos familias de límites. Esta distinción determina qué decisiones puede respaldar el estudio y cuáles no.\n\nLa **validez interna** evalúa si el efecto estimado es creíble dentro de la muestra analizada. Amenazas de validez interna incluyen el desbalance de asignación en `EXP-PUSH-CART` (`980` controles contra `620` tratados, `srm_p_value = 0.0001`). También incluyen la divergencia previa de `+27.88 USD` en Tienda Miraflores (`STR-PE-01`), o el incremento concurrente de gasto publicitario en la región `Andina` (`+7.48 USD/día` entre `FY24-Q2` y `FY24-Q3`). Cuando falla la validez interna, el número no debe usarse para decidir.\n\nLa **validez externa** evalúa si un estimador internamente sano puede transportarse a otra población, canal o umbral. Un RDD en $c = 80\\text{ USD}$ identifica un efecto local (**LATE**) para canastas de `80 USD`, no el efecto de otorgar descuentos a carritos de `25 USD`. Del mismo modo, el **ATT** de `+70.57 USD` en la tienda insignia de Madrid (`STR-ES-01`) no garantiza el mismo retorno en almacenes mayoristas (`warehouse`).',
      example: {
        language: 'sql',
        code: `WITH ventas AS (
  SELECT
    s.region,
    ROUND(
      AVG(o.total_usd) FILTER (WHERE c.fiscal_quarter = 'FY24-Q3')
      - AVG(o.total_usd) FILTER (WHERE c.fiscal_quarter = 'FY24-Q2'),
      2
    ) AS delta_ticket_usd
  FROM orders AS o
  INNER JOIN stores AS s ON o.store_id = s.store_id
  INNER JOIN calendar AS c ON o.order_date = c.calendar_date
  WHERE o.status = 'completed'
    AND c.fiscal_quarter IN ('FY24-Q2', 'FY24-Q3')
  GROUP BY s.region
),
mkt AS (
  SELECT
    m.region,
    ROUND(
      AVG(m.spend_usd) FILTER (WHERE c.fiscal_quarter = 'FY24-Q3')
      - AVG(m.spend_usd) FILTER (WHERE c.fiscal_quarter = 'FY24-Q2'),
      2
    ) AS delta_mkt_usd
  FROM marketing_spend AS m
  INNER JOIN calendar AS c ON m.spend_date = c.calendar_date
  WHERE c.fiscal_quarter IN ('FY24-Q2', 'FY24-Q3')
  GROUP BY m.region
)
SELECT v.region, v.delta_ticket_usd, m.delta_mkt_usd
FROM ventas AS v
INNER JOIN mkt AS m ON v.region = m.region
ORDER BY v.region;`,
        expectedOutput: [
          { region: 'Andina', delta_ticket_usd: 6.53, delta_mkt_usd: 7.48 },
          { region: 'Cono Sur', delta_ticket_usd: -8.35, delta_mkt_usd: 0.13 },
          { region: 'Iberia', delta_ticket_usd: -5.33, delta_mkt_usd: -2.24 },
          { region: 'Norteamérica', delta_ticket_usd: -13.32, delta_mkt_usd: 1.93 },
        ],
      },
    },
  ],
  workedExample: {
    title: 'Auditoría regional cruzada (orders + marketing_spend) para la sección de supuestos del memo',
    description:
      'Antes de firmar el memo trimestral que compara el cambio de ticket medio entre `FY24-Q2` y `FY24-Q3` en las cuatro regiones de Mercado Brisa, construimos una tabla que une la variación de ventas completadas (`orders`) con la variación del gasto publicitario diario (`marketing_spend`) para detectar en qué región hubo un confusor variante en el tiempo.',
    steps: [
      {
        label: 'Paso 1 — Variación trimestral del ticket medio por región en orders',
        explanation:
          'Calculamos en `orders` el ticket medio de pedidos completados por región en `FY24-Q2` y `FY24-Q3`, así como su diferencia trimestral `delta_ticket_usd`. Observamos que `Andina` es la única región cuyo ticket medio crece (`+6.53 USD`).',
        code: `SELECT
  s.region,
  ROUND(AVG(o.total_usd) FILTER (WHERE c.fiscal_quarter = 'FY24-Q2'), 2) AS ticket_q2_usd,
  ROUND(AVG(o.total_usd) FILTER (WHERE c.fiscal_quarter = 'FY24-Q3'), 2) AS ticket_q3_usd,
  ROUND(
    AVG(o.total_usd) FILTER (WHERE c.fiscal_quarter = 'FY24-Q3')
    - AVG(o.total_usd) FILTER (WHERE c.fiscal_quarter = 'FY24-Q2'),
    2
  ) AS delta_ticket_usd
FROM orders AS o
INNER JOIN stores AS s ON o.store_id = s.store_id
INNER JOIN calendar AS c ON o.order_date = c.calendar_date
WHERE o.status = 'completed'
  AND c.fiscal_quarter IN ('FY24-Q2', 'FY24-Q3')
GROUP BY s.region
ORDER BY s.region;`,
        expectedOutput: [
          { region: 'Andina', ticket_q2_usd: 398.98, ticket_q3_usd: 405.51, delta_ticket_usd: 6.53 },
          { region: 'Cono Sur', ticket_q2_usd: 413.59, ticket_q3_usd: 405.23, delta_ticket_usd: -8.35 },
          { region: 'Iberia', ticket_q2_usd: 474.76, ticket_q3_usd: 469.42, delta_ticket_usd: -5.33 },
          { region: 'Norteamérica', ticket_q2_usd: 410.32, ticket_q3_usd: 397, delta_ticket_usd: -13.32 },
        ],
      },
      {
        label: 'Paso 2 — Unión con gasto publicitario regional en marketing_spend',
        explanation:
          'Unimos la variación del ticket con la variación del gasto diario en `marketing_spend` durante los mismos dos trimestres. La tabla evidencia que `Andina` también fue la única región donde el presupuesto diario de marketing dio un salto marcado (`+7.48 USD/día`), contaminando el comparación directa contra `Cono Sur`.',
        code: `WITH ventas_reg AS (
  SELECT
    s.region,
    ROUND(AVG(o.total_usd) FILTER (WHERE c.fiscal_quarter = 'FY24-Q2'), 2) AS ticket_q2_usd,
    ROUND(AVG(o.total_usd) FILTER (WHERE c.fiscal_quarter = 'FY24-Q3'), 2) AS ticket_q3_usd,
    ROUND(
      AVG(o.total_usd) FILTER (WHERE c.fiscal_quarter = 'FY24-Q3')
      - AVG(o.total_usd) FILTER (WHERE c.fiscal_quarter = 'FY24-Q2'),
      2
    ) AS delta_ticket_usd
  FROM orders AS o
  INNER JOIN stores AS s ON o.store_id = s.store_id
  INNER JOIN calendar AS c ON o.order_date = c.calendar_date
  WHERE o.status = 'completed'
    AND c.fiscal_quarter IN ('FY24-Q2', 'FY24-Q3')
  GROUP BY s.region
),
mkt_reg AS (
  SELECT
    m.region,
    ROUND(AVG(m.spend_usd) FILTER (WHERE c.fiscal_quarter = 'FY24-Q2'), 2) AS gasto_mkt_q2_usd,
    ROUND(AVG(m.spend_usd) FILTER (WHERE c.fiscal_quarter = 'FY24-Q3'), 2) AS gasto_mkt_q3_usd,
    ROUND(
      AVG(m.spend_usd) FILTER (WHERE c.fiscal_quarter = 'FY24-Q3')
      - AVG(m.spend_usd) FILTER (WHERE c.fiscal_quarter = 'FY24-Q2'),
      2
    ) AS delta_mkt_usd
  FROM marketing_spend AS m
  INNER JOIN calendar AS c ON m.spend_date = c.calendar_date
  WHERE c.fiscal_quarter IN ('FY24-Q2', 'FY24-Q3')
  GROUP BY m.region
)
SELECT
  v.region,
  v.ticket_q2_usd,
  v.ticket_q3_usd,
  v.delta_ticket_usd,
  m.gasto_mkt_q2_usd,
  m.gasto_mkt_q3_usd,
  m.delta_mkt_usd
FROM ventas_reg AS v
INNER JOIN mkt_reg AS m ON v.region = m.region
ORDER BY v.region;`,
        expectedOutput: [
          {
            region: 'Andina',
            ticket_q2_usd: 398.98,
            ticket_q3_usd: 405.51,
            delta_ticket_usd: 6.53,
            gasto_mkt_q2_usd: 180.49,
            gasto_mkt_q3_usd: 187.97,
            delta_mkt_usd: 7.48,
          },
          {
            region: 'Cono Sur',
            ticket_q2_usd: 413.59,
            ticket_q3_usd: 405.23,
            delta_ticket_usd: -8.35,
            gasto_mkt_q2_usd: 95.99,
            gasto_mkt_q3_usd: 96.12,
            delta_mkt_usd: 0.13,
          },
          {
            region: 'Iberia',
            ticket_q2_usd: 474.76,
            ticket_q3_usd: 469.42,
            delta_ticket_usd: -5.33,
            gasto_mkt_q2_usd: 153.17,
            gasto_mkt_q3_usd: 150.93,
            delta_mkt_usd: -2.24,
          },
          {
            region: 'Norteamérica',
            ticket_q2_usd: 410.32,
            ticket_q3_usd: 397,
            delta_ticket_usd: -13.32,
            gasto_mkt_q2_usd: 379.68,
            gasto_mkt_q3_usd: 381.6,
            delta_mkt_usd: 1.93,
          },
        ],
      },
    ],
  },
  checks: [
    {
      id: 'chk-da4-04-1',
      type: 'mcq',
      prompt:
        'Según el principio de la pirámide y el marco SCQA, ¿qué elemento debe aparecer en el primer párrafo de un memo analítico dirigido a dirección?',
      options: [
        {
          id: 'a',
          text: 'La tesis gobernante con la recomendación de acción, el efecto causal estimado, su intervalo del 95 % y la condición principal de validez',
          correct: true,
          feedback:
            'Exacto: abrir con la respuesta cuantificada permite a dirección captar la decisión y su rango de incertidumbre desde el inicio.',
        },
        {
          id: 'b',
          text: 'La lista cronológica de todas las consultas SQL intermedias y limpiezas de nulos realizadas durante la primera semana',
          correct: false,
          feedback:
            'El historial de depuración técnica pertenece al repositorio o a un anexo, nunca al primer párrafo ejecutivo.',
        },
        {
          id: 'c',
          text: 'Únicamente el contexto histórico de la empresa, reservando la recomendación para el último renglón del documento',
          correct: false,
          feedback:
            'Esconder la recomendación al final obliga al lector ejecutivo a rastrear todo el texto para saber qué se propone.',
        },
      ],
      explanation:
        'El principio de la pirámide coloca la conclusión gobernante (recomendación, magnitud del efecto, intervalo de confianza y alcance) en la cima del documento, respaldada luego por argumentos y evidencia.',
    },
    {
      id: 'chk-da4-04-2',
      type: 'mcq',
      prompt:
        'Un estudio RDD nítido en Tienda Reforma Norte demuestra sin sesgos que el descuento desde 80 USD reduce el cobro neto en -4.64 USD en el umbral. Si marketing afirma que ocurrirá lo mismo al dar el descuento desde 25 USD en almacenes mayoristas, ¿qué límite ignora?',
      options: [
        {
          id: 'a',
          text: 'Un límite de validez externa (transportabilidad), porque un LATE local en 80 USD en una tienda insignia no se extrapola sin más a otro umbral ni formato',
          correct: true,
          feedback:
            'Correcto: el estimador es internamente válido en 80 USD, pero no se transporta automáticamente a canastas de 25 USD ni a almacenes.',
        },
        {
          id: 'b',
          text: 'Un fallo de validez interna por desbalance de razones muestrales (SRM) dentro de Tienda Reforma Norte',
          correct: false,
          feedback:
            'El estudio en Reforma Norte no tuvo fallo interno; el error radica en generalizar fuera del umbral y formato estudiados.',
        },
        {
          id: 'c',
          text: 'Un error de sintaxis SQL en el cálculo de la pendiente dentro del ancho de banda [50, 110] USD',
          correct: false,
          feedback:
            'El cálculo de REGR_INTERCEPT es exacto; la limitación es de alcance externo sobre otras subpoblaciones.',
        },
      ],
      explanation:
        'La validez interna garantiza que la estimación es correcta dentro de la muestra y umbral analizados; pretender aplicarla a carritos de 25 USD o a almacenes mayoristas viola los límites de validez externa.',
    },
    {
      id: 'chk-da4-04-3',
      type: 'predict-output',
      prompt:
        'En el experimento EXP-UPSELL-MOLINO, la brecha preintervención (tratamiento menos control) fue de -0.26 USD y la diferencia bruta postintervención fue de +6.46 USD. ¿Qué devuelve `SELECT ROUND(6.46 - (-0.26), 2) AS efecto_did_usd`?',
      options: [
        {
          id: 'a',
          text: '6.72; al descontar que el grupo tratado partía 0.26 USD por debajo antes del experimento, el efecto ajustado sube a +6.72 USD',
          correct: true,
          feedback:
            'Exacto: restar un desbalance inicial negativo (-0.26 USD) suma 0.26 USD a la diferencia bruta postintervención.',
        },
        {
          id: 'b',
          text: '6.20; resta el valor absoluto del desbalance previo a la diferencia postintervención',
          correct: false,
          feedback:
            '6.46 - (-0.26) es 6.46 + 0.26 = 6.72 USD, no 6.20 USD.',
        },
        {
          id: 'c',
          text: '6.46; en un experimento las diferencias preintervención no modifican la estimación en diferencias',
          correct: false,
          feedback:
            'El estimador DiD descuenta explícitamente cualquier brecha basal observada antes de la asignación.',
        },
      ],
      explanation:
        'Como el grupo tratado partía 0.26 USD por debajo del control en el preperiodo (-0.26 USD) y finalizó 6.46 USD por encima en el postperiodo, su ganancia neta fue 6.46 - (-0.26) = +6.72 USD.',
    },
    {
      id: 'chk-da4-04-4',
      type: 'mcq',
      prompt:
        'Al construir la tabla del memo para un experimento de 1 600 usuarios (800 por brazo), un analista calcula el error estándar como `STDDEV_SAMP(diff) / SQRT(1600)`. ¿Por qué subestima la incertidumbre del efecto?',
      options: [
        {
          id: 'a',
          text: 'Porque calcula el error estándar de una sola media global en vez de SQRT(VAR_SAMP(T)/800 + VAR_SAMP(C)/800) para la resta de dos medias',
          correct: true,
          feedback:
            'Exacto: la varianza de la diferencia de dos medias independientes es la suma de las varianzas de cada media.',
        },
        {
          id: 'b',
          text: 'Porque la función STDDEV_SAMP() en DuckDB devuelve la varianza al cuadrado en lugar de la desviación estándar',
          correct: false,
          feedback:
            'STDDEV_SAMP() sí devuelve la desviación estándar; el error está en no sumar las varianzas muestrales de ambos grupos.',
        },
        {
          id: 'c',
          text: 'Porque en SQL no se puede usar SQRT() en el denominador de una división',
          correct: false,
          feedback:
            'SQRT() en el denominador es sintaxis SQL válida; el problema es la fórmula estadística utilizada.',
        },
      ],
      explanation:
        'El error estándar de la diferencia entre el grupo tratado y el de control es SQRT(s_T^2 / n_T + s_C^2 / n_C). Dividir una desviación global entre SQRT(n_T + n_C) produce un intervalo artificialmente estrecho.',
    },
  ],
  practice: {
    type: 'sql',
    title: 'Construir la tabla de evidencia autosuficiente del memo ejecutivo para los 6 experimentos',
    language: 'sql',
    prompt:
      'Genera la tabla maestra de evidencia que respaldará el memo analítico del comité de experimentación uniendo `experiments` y `experiment_assignments`. La CTE `stats` ya calcula para cada experimento: `srm_p_value`, `brecha_pre`, `efecto_post_bruto`, `efecto_did` y `se_did`. Completa el `SELECT` final para devolver: `experiment_code`, `validez_interna` (`\'invalido_srm\'` cuando `srm_p_value < 0.01` y `\'valido\'` en caso contrario), `brecha_pre_usd`, `efecto_bruto_usd`, `efecto_did_usd`, `ic95_inf_usd` (`efecto_did - 1.96 * se_did`) e `ic95_sup_usd` (`efecto_did + 1.96 * se_did`), redondeando las 5 métricas numéricas a 2 decimales y ordenando por `experiment_id ASC`.',
    starterCode: `WITH stats AS (
  SELECT
    e.experiment_id,
    e.experiment_code,
    e.srm_p_value,
    AVG(ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'treatment')
      - AVG(ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'control') AS brecha_pre,
    AVG(ea.post_experiment_spend_usd) FILTER (WHERE ea.variant = 'treatment')
      - AVG(ea.post_experiment_spend_usd) FILTER (WHERE ea.variant = 'control') AS efecto_post_bruto,
    AVG(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'treatment')
      - AVG(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'control') AS efecto_did,
    SQRT(
      VAR_SAMP(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'treatment')
        / COUNT(*) FILTER (WHERE ea.variant = 'treatment')
      + VAR_SAMP(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'control')
        / COUNT(*) FILTER (WHERE ea.variant = 'control')
    ) AS se_did
  FROM experiments AS e
  INNER JOIN experiment_assignments AS ea ON e.experiment_id = ea.experiment_id
  GROUP BY 1, 2, 3
)
SELECT
  experiment_code,
  CASE WHEN srm_p_value < 0.01 THEN 'invalido_srm' ELSE 'valido' END AS validez_interna,
  ROUND(brecha_pre, 2) AS brecha_pre_usd,
  ROUND(efecto_post_bruto, 2) AS efecto_bruto_usd,
  -- Reemplaza los ceros por efecto_did_usd, ic95_inf_usd e ic95_sup_usd redondeados a 2 decimales:
  0.0 AS efecto_did_usd,
  0.0 AS ic95_inf_usd,
  0.0 AS ic95_sup_usd
FROM stats
ORDER BY experiment_id ASC;`,
    expected: `WITH stats AS (
  SELECT
    e.experiment_id,
    e.experiment_code,
    e.srm_p_value,
    AVG(ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'treatment')
      - AVG(ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'control') AS brecha_pre,
    AVG(ea.post_experiment_spend_usd) FILTER (WHERE ea.variant = 'treatment')
      - AVG(ea.post_experiment_spend_usd) FILTER (WHERE ea.variant = 'control') AS efecto_post_bruto,
    AVG(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'treatment')
      - AVG(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'control') AS efecto_did,
    SQRT(
      VAR_SAMP(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'treatment')
        / COUNT(*) FILTER (WHERE ea.variant = 'treatment')
      + VAR_SAMP(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'control')
        / COUNT(*) FILTER (WHERE ea.variant = 'control')
    ) AS se_did
  FROM experiments AS e
  INNER JOIN experiment_assignments AS ea ON e.experiment_id = ea.experiment_id
  GROUP BY 1, 2, 3
)
SELECT
  experiment_code,
  CASE WHEN srm_p_value < 0.01 THEN 'invalido_srm' ELSE 'valido' END AS validez_interna,
  ROUND(brecha_pre, 2) AS brecha_pre_usd,
  ROUND(efecto_post_bruto, 2) AS efecto_bruto_usd,
  ROUND(efecto_did, 2) AS efecto_did_usd,
  ROUND(efecto_did - 1.96 * se_did, 2) AS ic95_inf_usd,
  ROUND(efecto_did + 1.96 * se_did, 2) AS ic95_sup_usd
FROM stats
ORDER BY experiment_id ASC;`,
    orderMatters: true,
    hints: [
      'Aplica ROUND(efecto_did, 2) AS efecto_did_usd para la estimación central ajustada por diferencias.',
      'El límite inferior del intervalo del 95 % se calcula como ROUND(efecto_did - 1.96 * se_did, 2) AS ic95_inf_usd.',
      'El límite superior se calcula como ROUND(efecto_did + 1.96 * se_did, 2) AS ic95_sup_usd.',
    ],
    solution: `WITH stats AS (
  SELECT
    e.experiment_id,
    e.experiment_code,
    e.srm_p_value,
    AVG(ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'treatment')
      - AVG(ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'control') AS brecha_pre,
    AVG(ea.post_experiment_spend_usd) FILTER (WHERE ea.variant = 'treatment')
      - AVG(ea.post_experiment_spend_usd) FILTER (WHERE ea.variant = 'control') AS efecto_post_bruto,
    AVG(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'treatment')
      - AVG(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'control') AS efecto_did,
    SQRT(
      VAR_SAMP(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'treatment')
        / COUNT(*) FILTER (WHERE ea.variant = 'treatment')
      + VAR_SAMP(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'control')
        / COUNT(*) FILTER (WHERE ea.variant = 'control')
    ) AS se_did
  FROM experiments AS e
  INNER JOIN experiment_assignments AS ea ON e.experiment_id = ea.experiment_id
  GROUP BY 1, 2, 3
)
SELECT
  experiment_code,
  CASE WHEN srm_p_value < 0.01 THEN 'invalido_srm' ELSE 'valido' END AS validez_interna,
  ROUND(brecha_pre, 2) AS brecha_pre_usd,
  ROUND(efecto_post_bruto, 2) AS efecto_bruto_usd,
  ROUND(efecto_did, 2) AS efecto_did_usd,
  ROUND(efecto_did - 1.96 * se_did, 2) AS ic95_inf_usd,
  ROUND(efecto_did + 1.96 * se_did, 2) AS ic95_sup_usd
FROM stats
ORDER BY experiment_id ASC;`,
    solutionExplanation:
      'La tabla consolida en una sola vista la alerta de validez interna (EXP-PUSH-CART queda marcado como invalido_srm), el ajuste por diferencias pre/post y el intervalo de confianza del 95 % para cada experimento.',
    expectedOutputTable: [
      {
        experiment_code: 'EXP-CHECKOUT-1STEP',
        validez_interna: 'valido',
        brecha_pre_usd: 0.04,
        efecto_bruto_usd: 6.91,
        efecto_did_usd: 6.87,
        ic95_inf_usd: 5.85,
        ic95_sup_usd: 7.89,
      },
      {
        experiment_code: 'EXP-FREE-SHIP-45',
        validez_interna: 'valido',
        brecha_pre_usd: 0.15,
        efecto_bruto_usd: 6.37,
        efecto_did_usd: 6.22,
        ic95_inf_usd: 5.19,
        ic95_sup_usd: 7.24,
      },
      {
        experiment_code: 'EXP-SUB-BUNDLE',
        validez_interna: 'valido',
        brecha_pre_usd: 0.07,
        efecto_bruto_usd: 6.61,
        efecto_did_usd: 6.55,
        ic95_inf_usd: 5.5,
        ic95_sup_usd: 7.6,
      },
      {
        experiment_code: 'EXP-QUIZ-ORIGEN',
        validez_interna: 'valido',
        brecha_pre_usd: 0.07,
        efecto_bruto_usd: 6.57,
        efecto_did_usd: 6.51,
        ic95_inf_usd: 5.47,
        ic95_sup_usd: 7.55,
      },
      {
        experiment_code: 'EXP-UPSELL-MOLINO',
        validez_interna: 'valido',
        brecha_pre_usd: -0.26,
        efecto_bruto_usd: 6.46,
        efecto_did_usd: 6.72,
        ic95_inf_usd: 5.67,
        ic95_sup_usd: 7.77,
      },
      {
        experiment_code: 'EXP-PUSH-CART',
        validez_interna: 'invalido_srm',
        brecha_pre_usd: 0.17,
        efecto_bruto_usd: 5.94,
        efecto_did_usd: 5.77,
        ic95_inf_usd: 4.72,
        ic95_sup_usd: 6.82,
      },
    ],
  },
  roleNotes: {
    da: 'Guarda la consulta que genera la tabla de evidencia del memo en el repositorio con fecha y semilla; si un vicepresidente cuestiona una cifra tres meses después, debes poder regenerar la tabla idéntica en cinco segundos.',
    bi: 'Diseña las vistas de reporte de experimentos para que cualquier fila con validez_interna = invalido_srm aparezca marcada con alerta visual antes de mostrar los intervalos de confianza.',
    de: 'Expón como columnas estándar en la capa semántica tanto el gasto preasignación (pre_experiment_spend_usd) como el p-valor de SRM para que ningún analista tenga que recalcularlos manualmente desde eventos crudos.',
  },
  summary: [
    'Un memo ejecutivo aplica el principio de la pirámide (SCQA), abriendo con la recomendación gobernante y su intervalo del 95 %.',
    'La tabla de evidencia consolida validez interna, balance preintervención, estimador ajustado y límites de incertidumbre en una sola vista.',
    'Los supuestos de identificación deben redactarse como condiciones operativas de negocio acompañadas de la prueba de falsación ejecutada.',
    'Separar las amenazas de validez interna de los límites de validez externa protege la credibilidad técnica del análisis ante dirección.',
  ],
  flashcards: [
    {
      id: 'fc-da4-04-1',
      front: '¿Qué significan las siglas SCQA en la apertura de un memo analítico?',
      back: 'Situación (hecho estable acordado), Complicación (cambio o riesgo que exige actuar), Pregunta (dilema central) y Respuesta (tesis gobernante y recomendación cuantificada).',
    },
    {
      id: 'fc-da4-04-2',
      front: '¿Por qué la tabla de evidencia de un memo debe incluir una columna de validez interna junto al intervalo de confianza?',
      back: 'Porque un intervalo de confianza estrecho (como [4.72, 6.82] USD en EXP-PUSH-CART) carece de valor causal si el experimento sufrió un fallo de asignación como SRM.',
    },
    {
      id: 'fc-da4-04-3',
      front: '¿Qué diferencia existe entre una amenaza de validez interna y un límite de validez externa?',
      back: 'La validez interna evalúa si el efecto es cierto dentro de la muestra estudiada; la validez externa evalúa si ese efecto puede transportarse a otras tiendas, canales o umbrales.',
    },
    {
      id: 'fc-da4-04-4',
      front: '¿Cómo debe presentarse un supuesto de identificación en un memo dirigido a dirección?',
      back: 'Traducido a una condición comercial concreta y acompañado del resultado numérico de la prueba de falsación (por ejemplo, el placebo temporal o el cruce con marketing_spend).',
    },
  ],
  glossaryTerms: [
    'principio-de-la-piramide',
    'diferencias-en-diferencias',
    'regresion-discontinua',
  ],
  sources: [
    {
      title: 'Causal Inference: What If — Target Trial Emulation and Identification',
      url: 'https://miguelhernan.org/whatifbook',
      publisher: 'Chapman & Hall/CRC / Miguel A. Hernán & James M. Robins',
      accessed: '2026-10-29',
      supports:
        'Articulación explícita de supuestos causales, protocolo de análisis y distinción entre validez interna y transporte.',
    },
    {
      title: 'The Effect — Chapter 5: Identification',
      url: 'https://theeffectbook.net/ch-Identification.html',
      publisher: 'Chapman & Hall / Nick Huntington-Klein',
      accessed: '2026-10-29',
      supports:
        'Comunicación transparente de supuestos de diseño y pruebas de falsación en estudios empíricos.',
    },
    {
      title:
        'STROBE Statement — Strengthening the Reporting of Observational Studies',
      url: 'https://www.strobe-statement.org/',
      publisher: 'STROBE Initiative',
      accessed: '2026-10-29',
      supports:
        'Estructura estandarizada para reportar diseño, sesgos potenciales, precisión y generalización en estudios observacionales.',
    },
    {
      title: 'DuckDB WITH Clause (Common Table Expressions)',
      url: 'https://duckdb.org/docs/stable/sql/query_syntax/with',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports:
        'Organización modular de consultas que consolidan métricas e intervalos de confianza en una tabla de evidencia.',
    },
  ],
  aiNotes:
    'Recuérdale al estudiante que un memo ejecutivo empieza por la recomendación respaldada por el IC del 95 % y el estado de validez interna. En la práctica, oriéntalo a usar las columnas efecto_did y se_did ya calculadas en la CTE stats para construir efecto_did_usd, ic95_inf_usd e ic95_sup_usd.',
};
