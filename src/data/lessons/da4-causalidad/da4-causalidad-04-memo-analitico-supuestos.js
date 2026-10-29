export default {
  id: 'da4-causalidad-04-memo-analitico-supuestos',
  moduleId: 'da4-causalidad',
  track: 'da',
  level: 4,
  order: 4,
  title: 'El memo analítico: estructura, supuestos y límites',
  subtitle:
    'El memo analítico: estructura narrativa, supuestos explícitos y límites del estudio',
  durationMinutes: 20,
  prerequisites: [
    'da4-causalidad-02-regresion-discontinua-rdd',
    'da4-causalidad-03-control-sintetico-emparejamiento',
  ],
  datasets: [
    'orders',
    'stores',
    'calendar',
    'marketing_spend',
    'experiments',
    'experiment_assignments',
  ],
  hook: {
    question:
      'Tras dos semanas auditando las promociones de envío y descuentos de Mercado Brisa, llevas al comité un documento de ocho páginas que narra en orden cronológico cómo limpiaste las tablas, probaste cinco filtros y ejecutaste regresiones. Al minuto tres, la directora de operaciones interrumpe: "¿Cuál es la decisión, qué rango de dinero está en juego y qué tendría que fallar para que tu número sea falso?". ¿Cómo estructuras un memo analítico de una sola página que responda primero y blinde sus supuestos?',
    context:
      'Redacción de memos ejecutivos con estructura SCQA y tablas de evidencia sobre experiments, orders y marketing_spend.',
  },
  objectives: [
    'Estructurar un memo analítico de una página aplicando el principio de la pirámide (SCQA) con la tesis gobernante en el primer párrafo.',
    'Construir en SQL una tabla de evidencia autosuficiente que integre validez interna, balance preintervención, estimación ajustada e intervalo de confianza del 95 %.',
    'Formular explícitamente los supuestos de identificación y distinguir amenazas de validez interna frente a límites de validez externa.',
  ],
  sections: [
    {
      id: 'relato-cronologico-vs-piramide-scqa',
      heading: 'Del relato cronológico al principio de la pirámide (SCQA)',
      body: 'El error de comunicación más frecuente en ciencia y análisis de datos consiste en escribir informes con la estructura de una novela de detectives: contar paso a paso qué tablas se consultaron, qué cruces fallaron y dejar la conclusión para el último párrafo. Quien investiga descubre de abajo hacia arriba, pero quien toma decisiones lee de arriba hacia abajo.\n\nEl **principio de la pirámide**, formulado por Barbara Minto, invierte ese orden mediante la apertura **SCQA** (*Situación, Complicación, Pregunta y Respuesta*):\n\n1. **Situación (S):** Hecho operativo conocido y aceptado (`Mercado Brisa probó en mayo el umbral de envío sin cargo a 45 USD en 1 600 clientes`).\n2. **Complicación (C):** Tensión o riesgo que obliga a decidir (`Aunque el gasto bruto cayó por estacionalidad, el subsidio logístico cuesta 5.80 USD por usuario`).\n3. **Pregunta (Q):** Dilema ejecutivo (`¿Supera el efecto causal neto el umbral de costo para desplegar la regla a toda la red?`).\n4. **Respuesta / Tesis gobernante (A):** Recomendación directa con magnitud e intervalo (`Recomendamos acotar a un piloto segmentado: el efecto causal DiD es +6.22 USD, con IC 95 % de [5.19, 7.24] USD, cuyo extremo inferior no cubre los 5.80 USD de costo`).',
      callout: {
        type: 'KeyIdea',
        title: 'La conclusión gobernante abre el documento',
        body: 'Si un directivo solo dispone de 60 segundos para leer las primeras cinco líneas de tu memo, debe llevarse la recomendación, el estimador puntual, su intervalo del 95 % y la condición de validez.',
      },
      visual: {
        type: 'mermaid',
        spec: 'flowchart TD\n  TOP["1. Tesis Gobernante (SCQA)\\nRecomendación + Efecto (+6.22 USD) + IC 95% [5.19, 7.24]"] --> ARG1["2A. Evidencia Causal\\nTabla autosuficiente (Muestra, Pre-balance, DiD, IC 95%)"]\n  TOP --> ARG2["2B. Supuestos de Identificación\\nTendencias paralelas, ausencia de SRM y choques de marketing"]\n  TOP --> ARG3["2C. Límites y Alcance\\nValidez interna vs. transporte externo (LATE / ATT)"]',
        caption:
          'Arquitectura jerárquica de un memo analítico de una página bajo el principio de la pirámide.',
      },
    },
    {
      id: 'tabla-evidencia-autosuficiente',
      heading: 'Anatomía de una tabla de evidencia autosuficiente en SQL',
      body: 'Debajo de la tesis gobernante, el cuerpo del memo no debe apilar capturas de código ni diez cuadros dispersos. Un memo ejecutivo riguroso descansa en una **tabla de evidencia autosuficiente** generada por una única consulta reproducible en SQL.\n\nPara que la tabla se defienda por sí sola ante cualquier auditoría técnica o financiera, cada fila (correspondiente a un experimento o intervención regional) debe reportar cinco bloques de columnas en orden lógico:\n\n1. **Estado de validez interna:** Por ejemplo, verificar `srm_p_value >= 0.01` para descartar de inmediato pruebas rotas como `EXP-PUSH-CART` (`srm_p_value = 0.0001`).\n2. **Balance preintervención:** La diferencia basal antes del cambio (`brecha_pre_usd`), que en los experimentos válidos de Mercado Brisa oscila apenas entre `-0.26` y `+0.15 USD`.\n3. **Estimación bruta frente a ajustada:** Contrastar la resta simple postintervención (`efecto_bruto_usd`) contra el estimador de diferencias en diferencias (`efecto_did_usd`), mostrando cómo el ajuste corrige desbalances iniciales (como en `EXP-UPSELL-MOLINO`, donde pasa de `+6.46` a `+6.72 USD`).\n4. **Intervalo de confianza del 95 %:** Los límites `ic95_inf_usd` e `ic95_sup_usd` calculados con el error estándar de las diferencias individuales.',
      formula: {
        latex:
          '\\text{IC}_{95\\%} = \\hat{\\tau}_{\\text{DiD}} \\pm 1.96 \\sqrt{\\frac{s^2_{D,T}}{n_T} + \\frac{s^2_{D,C}}{n_C}}, \\quad D_i = Y_{i,\\text{post}} - Y_{i,\\text{pre}}',
        explanation:
          'El error estándar del estimador DiD en datos de panel a nivel usuario se obtiene a partir de la varianza muestral del cambio individual D_i en cada grupo.',
      },
      codeExample: {
        language: 'sql',
        code: `SELECT
  e.experiment_code,
  CASE WHEN e.srm_p_value < 0.01 THEN 'invalido_srm' ELSE 'valido' END AS validez_interna,
  ROUND(
    AVG(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'treatment')
    - AVG(ea.post_experiment_spend_usd - ea.pre_experiment_spend_usd) FILTER (WHERE ea.variant = 'control'),
    2
  ) AS efecto_did_usd
FROM experiments e
JOIN experiment_assignments ea ON e.experiment_id = ea.experiment_id
GROUP BY e.experiment_id, e.experiment_code, e.srm_p_value
ORDER BY e.experiment_id;`,
        caption:
          'Extracción conjunta del diagnóstico SRM y del estimador DiD para el cuadro resumen del memo.',
      },
    },
    {
      id: 'supuestos-identificacion-lenguaje-ejecutivo',
      heading: 'Declarar supuestos de identificación en lenguaje de negocio',
      body: 'Todo número causal en datos observacionales o cuasiexperimentales es condicional a un supuesto no verificable al 100 %. Ocultar esos supuestos en una nota al pie destruye la confianza cuando otro equipo descubre una anomalía; enunciarlos en jerga econométrica críptica (*"asumimos ortogonalidad del término de error idiosincrático"*) desconecta a la audiencia ejecutiva.\n\nLa regla en un memo analítico de nivel 4 es traducir cada supuesto técnico a **una condición operativa concreta** acompañada de **la prueba empírica realizada para auditarla**:\n\n- **En Diferencias en Diferencias:** En vez de escribir solo *"asumimos tendencias paralelas"*, redacta: *"El efecto de +70.57 USD en Tienda Salamanca asume que, sin piloto, su ticket habría crecido al mismo ritmo que Las Condes y Polanco (+0.71 USD). Respaldamos este supuesto verificando que en el trimestre previo la brecha entre ambos grupos fue de apenas +0.05 USD y que el gasto de marketing en Iberia no subió (-2.24 USD/día)"*.\n- **En Regresión Discontinua:** Traduce la continuidad local indicando: *"El salto en 80 USD asume que los clientes no manipulan artificialmente el subtotal justo antes de pagar; auditamos la ventana [75, 85) USD sin hallar apilamiento sobre 80 USD"*.',
      visual: {
        type: 'table',
        spec: {
          headers: [
            'Método utilizado',
            'Jerga técnica opaca (evitar)',
            'Traducción operativa en el memo + Prueba ejecutada',
          ],
          rows: [
            [
              'DiD en tiendas',
              'Exogeneidad estricta y paralelismo asintótico.',
              'Sin piloto, la tienda tratada habría seguido el cambio estacional del control. Auditado con placebo Q1-Q2 (+0.05 USD) y cruce con marketing_spend.',
            ],
            [
              'RDD en 80 USD',
              'Continuidad de Lipshitz en las densidades condicionales.',
              'Los compradores de 79 USD y 81 USD son comparables y no fuerzan el carrito. Auditado con conteo en ventana de +/-5 USD e interceptos centrados.',
            ],
            [
              'Control sintético',
              'Invarianza de pesos en el símplex unitario.',
              'La mezcla 55% AR-01, 35% CO-02 y 10% CL-02 reproduce a Salamanca antes del cambio con error medio de 5.50 USD (<1.5 % del ticket).',
            ],
          ],
        },
        caption:
          'Guía de traducción de supuestos econométricos a enunciados ejecutivos verificables.',
      },
    },
    {
      id: 'limites-validez-interna-vs-externa',
      heading: 'Límites del estudio: validez interna frente a validez externa',
      body: 'El último bloque del memo separa con precisión dos familias de límites que determinan qué decisiones puede respaldar el estudio y cuáles no:\n\nLa **validez interna** responde a si el efecto estimado es creíble *dentro* de la muestra analizada. Amenazas de validez interna incluyen el desbalance de asignación en `EXP-PUSH-CART` (`980` controles contra `620` tratados, `srm_p_value = 0.0001`), la divergencia previa de `+27.88 USD` en Tienda Miraflores (`STR-PE-01`), o el incremento concurrente de gasto publicitario en la región `Andina` (`+7.48 USD/día` entre `FY24-Q2` y `FY24-Q3`). Cuando falla la validez interna, el número no debe usarse para decidir.\n\nLa **validez externa** (o *transportabilidad*) responde a si un estimador internamente impecable puede extrapolarse a otra población, canal o umbral. Un RDD en $c = 80\\text{ USD}$ identifica un **LATE** para canastas de `80 USD`, no el efecto de regalar descuentos a carritos de `25 USD`. Del mismo modo, el **ATT** de `+70.57 USD` en la tienda insignia de Madrid (`STR-ES-01`) no garantiza el mismo retorno en almacenes mayoristas (`warehouse`). Declarar este límite protege a la empresa de despliegues sobredimensionados.',
      codeExample: {
        language: 'sql',
        code: `WITH ventas AS (
  SELECT
    s.region,
    ROUND(
      AVG(o.total_usd) FILTER (WHERE c.fiscal_quarter = 'FY24-Q3')
      - AVG(o.total_usd) FILTER (WHERE c.fiscal_quarter = 'FY24-Q2'),
      2
    ) AS delta_ticket_usd
  FROM orders o
  JOIN stores s ON o.store_id = s.store_id
  JOIN calendar c ON o.order_date = c.calendar_date
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
  FROM marketing_spend m
  JOIN calendar c ON m.spend_date = c.calendar_date
  WHERE c.fiscal_quarter IN ('FY24-Q2', 'FY24-Q3')
  GROUP BY m.region
)
SELECT v.region, v.delta_ticket_usd, m.delta_mkt_usd
FROM ventas v
JOIN mkt m ON v.region = m.region
ORDER BY v.region;`,
        caption:
          'Cruce de orders y marketing_spend para documentar amenazas de validez interna por región en el memo.',
      },
      callout: {
        type: 'tip',
        title: 'Declara tus límites antes de que te los objeten',
        body: 'Incluir una sección breve de alcance y amenazas al final del memo demuestra rigor senior y evita que una objeción sobre validez externa derribe toda tu recomendación.',
      },
    },
  ],
  workedExample: {
    title:
      'Auditoría regional cruzada (orders + marketing_spend) para la sección de supuestos del memo',
    scenario:
      'Antes de firmar el memo trimestral que compara el cambio de ticket medio entre FY24-Q2 y FY24-Q3 en las cuatro regiones de Mercado Brisa, construimos una tabla que une la variación de ventas completadas (orders) con la variación del gasto publicitario diario (marketing_spend) para detectar en qué región hubo un confusor variante en el tiempo.',
    datasets: ['orders', 'stores', 'calendar', 'marketing_spend'],
    steps: [
      {
        order: 1,
        explanation:
          'Calculamos en la CTE ventas_reg el ticket medio de pedidos completados por región en FY24-Q2 y FY24-Q3, así como su diferencia trimestral delta_ticket_usd.',
        code: `SELECT
  s.region,
  ROUND(AVG(o.total_usd) FILTER (WHERE c.fiscal_quarter = 'FY24-Q2'), 2) AS ticket_q2_usd,
  ROUND(AVG(o.total_usd) FILTER (WHERE c.fiscal_quarter = 'FY24-Q3'), 2) AS ticket_q3_usd,
  ROUND(
    AVG(o.total_usd) FILTER (WHERE c.fiscal_quarter = 'FY24-Q3')
    - AVG(o.total_usd) FILTER (WHERE c.fiscal_quarter = 'FY24-Q2'),
    2
  ) AS delta_ticket_usd
FROM orders o
JOIN stores s ON o.store_id = s.store_id
JOIN calendar c ON o.order_date = c.calendar_date
WHERE o.status = 'completed'
  AND c.fiscal_quarter IN ('FY24-Q2', 'FY24-Q3')
GROUP BY s.region
ORDER BY s.region;`,
        output: `region       | ticket_q2_usd | ticket_q3_usd | delta_ticket_usd
-------------+---------------+---------------+-----------------
Andina       | 398.98        | 405.51        | 6.53
Cono Sur     | 413.59        | 405.23        | -8.35
Iberia       | 474.76        | 469.42        | -5.33
Norteamérica | 410.32        | 397.00        | -13.32`,
      },
      {
        order: 2,
        explanation:
          'Calculamos en paralelo la evolución del gasto publicitario diario medio en marketing_spend para los mismos dos trimestres y unimos ambas CTE por region.',
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
  FROM orders o
  JOIN stores s ON o.store_id = s.store_id
  JOIN calendar c ON o.order_date = c.calendar_date
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
  FROM marketing_spend m
  JOIN calendar c ON m.spend_date = c.calendar_date
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
FROM ventas_reg v
JOIN mkt_reg m ON v.region = m.region
ORDER BY v.region;`,
        output: `region       | ticket_q2_usd | ticket_q3_usd | delta_ticket_usd | gasto_mkt_q2_usd | gasto_mkt_q3_usd | delta_mkt_usd
-------------+---------------+---------------+------------------+------------------+------------------+--------------
Andina       | 398.98        | 405.51        | 6.53             | 180.49           | 187.97           | 7.48
Cono Sur     | 413.59        | 405.23        | -8.35            | 95.99            | 96.12            | 0.13
Iberia       | 474.76        | 469.42        | -5.33            | 153.17           | 150.93           | -2.24
Norteamérica | 410.32        | 397.00        | -13.32           | 379.68           | 381.60           | 1.93`,
      },
      {
        order: 3,
        explanation:
          'Redactamos el hallazgo para el memo: Andina es la única región cuyo ticket subió (+6.53 USD), pero también la única donde el presupuesto diario de marketing creció de forma marcada (+7.48 USD/día), lo que obliga a declarar confusión por inversión publicitaria concurrente.',
        code: `SELECT
  'Andina' AS region_auditada,
  6.53 - (-8.35) AS did_bruto_andina_vs_cono_sur_usd,
  7.48 - 0.13 AS exceso_marketing_diario_usd;`,
        output: `region_auditada | did_bruto_andina_vs_cono_sur_usd | exceso_marketing_diario_usd
----------------+----------------------------------+----------------------------
Andina          | 14.88                            | 7.35`,
      },
    ],
    takeaway:
      'Integrar la tabla de resultados con las covariables operativas (marketing_spend) en un solo cuadro permite documentar con cifras exactas por qué el aparente efecto regional de +14.88 USD en Andina está contaminado por +7.35 USD/día de gasto publicitario diferencial.',
  },
  checks: [
    {
      id: 'check-memo-scqa',
      type: 'multiple-choice',
      prompt:
        'Según el principio de la pirámide y el marco SCQA, ¿qué elemento debe aparecer en el primer párrafo de un memo analítico dirigido a dirección?',
      options: [
        {
          id: 'a',
          label:
            'La tesis gobernante con la recomendación de acción, el efecto causal estimado, su intervalo del 95 % y la condición principal de validez.',
        },
        {
          id: 'b',
          label:
            'La lista cronológica de todas las consultas SQL intermedias y limpiezas de nulos realizadas durante la primera semana.',
        },
        {
          id: 'c',
          label:
            'La demostración algebraica completa de la varianza asintótica del estimador antes de mencionar cualquier métrica de negocio.',
        },
        {
          id: 'd',
          label:
            'Únicamente el contexto histórico de la empresa, reservando la recomendación para el último renglón de los anexos.',
        },
      ],
      correctOptionId: 'a',
      explanation:
        'El principio de la pirámide abre con la respuesta gobernante (recomendación cuantificada con incertidumbre y alcance) inmediatamente después de situar contexto, complicación y pregunta. Las opciones b y d describen el relato cronológico ascendente que pierde al lector ejecutivo, y la c coloca detalles de anexo en el encabezado.',
    },
    {
      id: 'check-memo-validez-interna-externa',
      type: 'multiple-choice',
      prompt:
        'Un estudio RDD nítido en Tienda Reforma Norte demuestra sin manipulación ni sesgos que el descuento a partir de 80 USD reduce el cobro neto en -4.64 USD en el umbral. Si marketing afirma que ocurrirá exactamente lo mismo al ofrecer el descuento desde 25 USD en almacenes mayoristas, ¿qué tipo de límite está ignorando?',
      options: [
        {
          id: 'a',
          label:
            'Un límite de validez externa (transportabilidad), porque un LATE local en 80 USD dentro de una tienda insignia no se generaliza automáticamente a otro umbral ni a almacenes.',
        },
        {
          id: 'b',
          label:
            'Un fallo de validez interna por desbalance de razones muestrales (SRM) dentro de Tienda Reforma Norte.',
        },
        {
          id: 'c',
          label:
            'Un error de sintaxis SQL en el cálculo de la pendiente dentro del ancho de banda [50, 110] USD.',
        },
      ],
      correctOptionId: 'a',
      explanation:
        'Cuando el estimador es creíble dentro de la muestra analizada pero se intenta aplicar a otra subpoblación (carritos de 25 USD) u otro formato comercial (almacenes), el problema es de validez externa o transportabilidad. Las opciones b y c se refieren a errores internos que ya fueron descartados en el estudio original.',
    },
    {
      id: 'check-memo-predict-up-sell',
      type: 'predict-output',
      prompt:
        'En el experimento EXP-UPSELL-MOLINO, la brecha preintervención (tratamiento menos control) fue de -0.26 USD y la diferencia bruta postintervención fue de +6.46 USD. ¿Qué valor arroja el estimador ajustado por diferencias en diferencias (efecto_did_usd)?',
      code: `SELECT
  ROUND(6.46 - (-0.26), 2) AS efecto_did_usd;`,
      options: [
        {
          id: 'a',
          label:
            '6.72 USD; al descontar que el grupo tratado partía 0.26 USD por debajo antes del experimento, el efecto ajustado sube a +6.72 USD.',
        },
        {
          id: 'b',
          label:
            '6.20 USD; se resta el valor absoluto del desbalance previo a la diferencia postintervención.',
        },
        {
          id: 'c',
          label:
            '6.46 USD; en un experimento las diferencias preintervención nunca modifican la estimación en diferencias.',
        },
      ],
      correctOptionId: 'a',
      explanation:
        'Como el grupo tratado empezó 0.26 USD por debajo del control antes del experimento (-0.26 USD) y terminó 6.46 USD por encima después, su avance neto respecto al control fue 6.46 - (-0.26) = +6.72 USD. La opción b invierte el signo y la c ignora la corrección basal.',
    },
    {
      id: 'check-memo-spot-bug',
      type: 'spot-the-bug',
      prompt:
        'Al construir la tabla de evidencia del memo, un analista calcula el error estándar del estimador DiD dividiendo la desviación estándar entre la suma total de usuarios en vez de sumar las varianzas de cada grupo divididas por su respectivo tamaño muestral. ¿Cuál es el error en la fórmula?',
      code: `SELECT
  STDDEV_SAMP(post_experiment_spend_usd - pre_experiment_spend_usd)
  / SQRT(COUNT(*)) AS se_did_incorrecto
FROM experiment_assignments
WHERE experiment_id = 2;`,
      options: [
        {
          id: 'a',
          label:
            'Calcula el error estándar de una sola media global en vez de la raíz de VAR_SAMP(tratamiento)/n_T + VAR_SAMP(control)/n_C para la diferencia de dos medias.',
        },
        {
          id: 'b',
          label:
            'En DuckDB la función SQRT() no puede aplicarse al resultado de COUNT(*).',
        },
        {
          id: 'c',
          label:
            'La función STDDEV_SAMP() devuelve la varianza al cuadrado en lugar de la desviación estándar.',
        },
      ],
      correctOptionId: 'a',
      explanation:
        'El error estándar de la diferencia entre dos grupos independientes es SQRT(s_T^2 / n_T + s_C^2 / n_C), que es aproximadamente el doble del error estándar de la muestra combinada. Las opciones b y c son falsas: SQRT(COUNT(*)) es sintaxis válida y STDDEV_SAMP devuelve la desviación estándar muestral.',
    },
  ],
  practice: {
    id: 'practice-da4-causalidad-04-tabla-evidencia-memo',
    title:
      'Construir la tabla de evidencia autosuficiente del memo ejecutivo para los 6 experimentos',
    prompt:
      'Genera la tabla maestra de evidencia que respaldará el memo analítico del comité de experimentación uniendo experiments y experiment_assignments. La CTE stats ya calcula para cada experimento: srm_p_value, brecha_pre (media pre de treatment menos control), efecto_post_bruto (media post de treatment menos control), efecto_did (media del cambio post - pre en treatment menos control) y se_did (error estándar del estimador DiD). Completa el SELECT final para devolver: experiment_code, validez_interna (\'invalido_srm\' cuando srm_p_value < 0.01 y \'valido\' en caso contrario), brecha_pre_usd, efecto_bruto_usd, efecto_did_usd, ic95_inf_usd (efecto_did - 1.96 * se_did) e ic95_sup_usd (efecto_did + 1.96 * se_did), redondeando las 5 métricas numéricas a 2 decimales y ordenando por experiment_id ASC.',
    engine: 'duckdb',
    datasets: ['experiments', 'experiment_assignments'],
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
  FROM experiments e
  JOIN experiment_assignments ea ON e.experiment_id = ea.experiment_id
  GROUP BY 1, 2, 3
)
SELECT
  experiment_code,
  CASE WHEN srm_p_value < 0.01 THEN 'invalido_srm' ELSE 'valido' END AS validez_interna,
  ROUND(brecha_pre, 2) AS brecha_pre_usd,
  ROUND(efecto_post_bruto, 2) AS efecto_bruto_usd
  -- TODO: agrega efecto_did_usd, ic95_inf_usd e ic95_sup_usd redondeados a 2 decimales
FROM stats
ORDER BY experiment_id ASC;`,
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
  FROM experiments e
  JOIN experiment_assignments ea ON e.experiment_id = ea.experiment_id
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
    hints: [
      'Aplica ROUND(efecto_did, 2) AS efecto_did_usd para la estimación central ajustada por diferencias.',
      'El límite inferior del intervalo del 95 % se calcula como ROUND(efecto_did - 1.96 * se_did, 2) AS ic95_inf_usd.',
      'El límite superior se calcula como ROUND(efecto_did + 1.96 * se_did, 2) AS ic95_sup_usd.',
    ],
    assertions: [
      { type: 'row-count', expected: 6 },
      {
        type: 'column-names',
        expected: [
          'experiment_code',
          'validez_interna',
          'brecha_pre_usd',
          'efecto_bruto_usd',
          'efecto_did_usd',
          'ic95_inf_usd',
          'ic95_sup_usd',
        ],
      },
      {
        type: 'cell-value',
        row: 1,
        column: 'efecto_did_usd',
        expected: 6.22,
      },
      {
        type: 'cell-value',
        row: 1,
        column: 'ic95_inf_usd',
        expected: 5.19,
      },
      {
        type: 'cell-value',
        row: 5,
        column: 'validez_interna',
        expected: 'invalido_srm',
      },
    ],
    expectedOutputTable: {
      columns: [
        'experiment_code',
        'validez_interna',
        'brecha_pre_usd',
        'efecto_bruto_usd',
        'efecto_did_usd',
        'ic95_inf_usd',
        'ic95_sup_usd',
      ],
      rows: [
        ['EXP-CHECKOUT-1STEP', 'valido', 0.04, 6.91, 6.87, 5.85, 7.89],
        ['EXP-FREE-SHIP-45', 'valido', 0.15, 6.37, 6.22, 5.19, 7.24],
        ['EXP-SUB-BUNDLE', 'valido', 0.07, 6.61, 6.55, 5.5, 7.6],
        ['EXP-QUIZ-ORIGEN', 'valido', 0.07, 6.57, 6.51, 5.47, 7.55],
        ['EXP-UPSELL-MOLINO', 'valido', -0.26, 6.46, 6.72, 5.67, 7.77],
        ['EXP-PUSH-CART', 'invalido_srm', 0.17, 5.94, 5.77, 4.72, 6.82],
      ],
    },
  },
  roleNotes: {
    da: 'Guarda la consulta que genera la tabla de evidencia del memo en el repositorio con fecha y semilla; si un vicepresidente cuestiona una cifra tres meses después, debes poder regenerar la tabla idéntica en cinco segundos.',
    bi: 'Diseña las vistas de reporte de experimentos para que cualquier fila con validez_interna = invalido_srm aparezca marcada con alerta visual antes de mostrar los intervalos de confianza.',
    de: 'Expón como columnas estándar en la capa semántica tanto el gasto preasignación (pre_experiment_spend_usd) como el p-valor de SRM para que ningún analista tenga que recalcularlos manualmente desde eventos crudos.',
    ds: 'En tus memos técnicos distingue siempre el parámetro identificado por el diseño (ATE en experimentos aleatorizados, ATT en DiD/control sintético, LATE en RDD) para acotar qué decisiones de negocio soporta.',
  },
  summary: [
    'Un memo analítico ejecutivo aplica el principio de la pirámide (SCQA), abriendo con la recomendación gobernante, la magnitud del efecto y su intervalo del 95 %.',
    'La tabla de evidencia autosuficiente consolida en una sola vista el estado de validez interna, el balance preintervención, el estimador ajustado y los límites de incertidumbre.',
    'Los supuestos de identificación deben redactarse como condiciones operativas de negocio acompañadas de la prueba de falsación ejecutada.',
    'Separar las amenazas de validez interna de los límites de validez externa protege la credibilidad técnica del análisis ante dirección.',
  ],
  flashcards: [
    {
      id: 'fc-memo-01',
      front: '¿Qué significan las siglas SCQA en la apertura de un memo analítico?',
      back: 'Situación (hecho estable acordado), Complicación (cambio o riesgo que exige actuar), Pregunta (dilema central) y Respuesta (tesis gobernante y recomendación cuantificada).',
    },
    {
      id: 'fc-memo-02',
      front: '¿Por qué la tabla de evidencia de un memo debe incluir una columna de validez interna junto al intervalo de confianza?',
      back: 'Porque un intervalo de confianza estrecho (como [4.72, 6.82] USD en EXP-PUSH-CART) carece de valor causal si el experimento sufrió un fallo de asignación como SRM.',
    },
    {
      id: 'fc-memo-03',
      front: '¿Qué diferencia existe entre una amenaza de validez interna y un límite de validez externa?',
      back: 'La validez interna evalúa si el efecto es cierto dentro de la muestra estudiada; la validez externa evalúa si ese efecto puede transportarse a otras tiendas, canales o umbrales.',
    },
    {
      id: 'fc-memo-04',
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
