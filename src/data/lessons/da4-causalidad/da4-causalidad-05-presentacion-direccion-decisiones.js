export default {
  id: 'da4-causalidad-05-presentacion-direccion-decisiones',
  moduleId: 'da4-causalidad',
  track: 'da',
  level: 4,
  order: 5,
  title: 'Presentar a dirección: objeciones y opciones de acción',
  subtitle:
    'Presentar a dirección: responder objeciones y traducir incertidumbre en opciones de acción',
  durationMinutes: 20,
  prerequisites: [
    'da4-causalidad-04-memo-analitico-supuestos',
    'da2-inferencia-05-pruebas-hipotesis-valor-p',
  ],
  datasets: [
    'orders',
    'stores',
    'refunds',
    'experiments',
    'experiment_assignments',
  ],
  hook: {
    question:
      'Presentas al comité directivo el resultado del experimento EXP-FREE-SHIP-45: bajar el umbral de envío gratuito a 45 USD eleva el gasto por usuario en +6.22 USD (IC 95 %: [5.19, 7.24] USD, p < 0.001). El director comercial pide desplegarlo hoy a todas las tiendas porque es estadísticamente significativo, pero el director financiero señala que el subsidio logístico cuesta 5.80 USD por usuario. ¿Cómo traduces el intervalo de confianza en escenarios de margen neto y opciones de acción concretas?',
    context:
      'Traducción de intervalos de confianza y métricas guardarraíl en matrices de decisión ejecutiva sobre experiments, orders y refunds.',
  },
  objectives: [
    'Traducir los límites del intervalo de confianza del 95 % en escenarios financieros conservador, central y optimista netos del costo de equilibrio.',
    'Auditar métricas guardarraíl (como tasas de reembolso, estado de ejecución y validez SRM) junto a la métrica primaria de ingresos.',
    'Diseñar una matriz de decisión con reglas explícitas que asignen cada iniciativa a despliegue general, piloto acotado o descarte.',
  ],
  sections: [
    {
      id: 'significancia-estadistica-vs-rentabilidad',
      heading: 'Por qué p < 0.05 no basta para aprobar un despliegue comercial',
      body: 'En una sala de dirección, afirmar que un efecto es *"estadísticamente significativo con $p < 0.001$"* solo responde a una pregunta estrecha: si el cambio observado es distinto de `0.00 USD`. Sin embargo, casi ningún programa comercial tiene costo cero. En `EXP-FREE-SHIP-45`, absorber el envío desde `45 USD` e incrementar el empaque representa un **costo umbral de equilibrio** (*break-even cost*, $C_{\\text{umbral}}$) de `5.80 USD` por cliente.\n\nPara conectar la inferencia estadística con la cuenta de resultados, restamos ese costo unitario a los tres puntos clave del intervalo de confianza del `95 %` ($[\\text{IC}_{\\text{inf}},\\, \\hat{\\tau},\\, \\text{IC}_{\\text{sup}}]$), transformándolos en **tres escenarios financieros de margen neto**:\n\n- **Escenario conservador ($\\text{IC}_{\\text{inf}} - C_{\\text{umbral}}$):** En `EXP-FREE-SHIP-45`, $5.19 - 5.80 = -0.61\\text{ USD}$ por usuario (pérdida neta en el extremo inferior plausible).\n- **Escenario central ($\\hat{\\tau} - C_{\\text{umbral}}$):** $6.22 - 5.80 = +0.42\\text{ USD}$ por usuario.\n- **Escenario optimista ($\\text{IC}_{\\text{sup}} - C_{\\text{umbral}}$):** $7.24 - 5.80 = +1.44\\text{ USD}$ por usuario.\n\nEn contraste, en `EXP-CHECKOUT-1STEP` (costo operativo de `4.50 USD` e IC del `95 %` de `[5.85, 7.89] USD`), incluso el escenario conservador deja una ganancia neta de $5.85 - 4.50 = +1.35\\text{ USD}$ por cliente.',
      formula: {
        latex:
          'M_{\\text{conservador}} = \\text{IC}_{95\\%,\\text{inf}} - C_{\\text{umbral}}, \\quad M_{\\text{central}} = \\hat{\\tau} - C_{\\text{umbral}}, \\quad M_{\\text{optimista}} = \\text{IC}_{95\\%,\\text{sup}} - C_{\\text{umbral}}',
        explanation:
          'La regla de decisión compara el extremo inferior del intervalo de confianza contra el costo incremental por unidad antes de autorizar un despliegue general.',
      },
      callout: {
        type: 'KeyIdea',
        title: 'El límite inferior gobierna el riesgo financiero',
        body: 'Si la estimación central supera el costo pero el límite inferior del IC 95 % da margen negativo, un despliegue masivo expone a la empresa a pérdidas; la acción racional es un piloto acotado a segmentos de mayor margen.',
      },
    },
    {
      id: 'metricas-guardarrail-reembolsos',
      heading: 'Auditoría de métricas guardarraíl: devoluciones e ingreso neto',
      body: 'Ninguna presentación a dirección está completa si solo muestra la métrica primaria de facturación bruta (`total_usd`). Una promoción agresiva o un cuestionario mal calibrado puede inflar las compras iniciales a costa de disparar las devoluciones semanas después. Por ello, todo comité de decisión evalúa **métricas guardarraíl** (*guardrail metrics*): indicadores de salud operativa, calidad y riesgo que la intervención no debe deteriorar.\n\nEn Mercado Brisa, la tabla `refunds` registra los reembolsos procesados (`status = \'processed\'`). Si comparamos las regiones en 2024 mirando únicamente el ticket bruto de `orders`, la región `Andina` (`398.48 USD`) parece empatada con `Norteamérica` (`398.79 USD`).\n\nSin embargo, al cruzar con el guardarraíl de devoluciones en `refunds`, descubrimos que `Andina` sufre una tasa de reembolso del `8.31 %` con una pérdida media de `20.03 USD` por pedido (frente a `6.41 %` y `16.55 USD` en `Cono Sur`), reduciendo su ingreso neto real a `378.45 USD`. Mostrar el ingreso neto posreembolso anticipa la objeción de operaciones y finanzas.',
      codeExample: {
        language: 'sql',
        code: `WITH reembolsos AS (
  SELECT order_id, SUM(refund_amount_usd) AS monto_reembolso
  FROM refunds
  WHERE status = 'processed'
  GROUP BY order_id
)
SELECT
  s.region,
  ROUND(AVG(o.total_usd), 2) AS ticket_bruto_usd,
  ROUND(AVG(CASE WHEN r.order_id IS NOT NULL THEN 100.0 ELSE 0.0 END), 2) AS tasa_reembolso_pct,
  ROUND(AVG(o.total_usd - COALESCE(r.monto_reembolso, 0)), 2) AS ingreso_neto_usd
FROM orders o
JOIN stores s ON o.store_id = s.store_id
LEFT JOIN reembolsos r ON o.order_id = r.order_id
WHERE o.status = 'completed'
  AND o.order_date >= '2024-01-01' AND o.order_date < '2025-01-01'
GROUP BY s.region
ORDER BY s.region;`,
        caption:
          'Cálculo conjunto de métrica primaria (ticket bruto) y guardarraíl de reembolsos por región en 2024.',
      },
    },
    {
      id: 'matriz-opciones-accion',
      heading: 'Matriz de decisión bajo incertidumbre: tres opciones operativas',
      body: 'Los ejecutivos no buscan que el analista responda *"faltan datos, sigamos investigando"*; necesitan una **matriz de opciones de acción** gobernada por reglas acordadas de antemano. Al combinar el estado de validez técnica (`srm_p_value` y `status`), el margen neto conservador y el margen neto central, clasificamos cada iniciativa en una de tres rutas:\n\n1. **Opción 1 — Desplegar a toda la red (`1_desplegar_general`):** Se activa cuando el estudio finalizó (`status = \'completed\'`), no presenta sesgo SRM (`srm_p_value >= 0.01`) y el **escenario conservador es positivo o cero** ($\\text{IC}_{95\\%,\\text{inf}} \\ge C_{\\text{umbral}}$). Cumplen esta regla `EXP-CHECKOUT-1STEP`, `EXP-SUB-BUNDLE` y `EXP-QUIZ-ORIGEN`.\n2. **Opción 2 — Piloto acotado o iteración segmentada (`2_piloto_acotado`):** Se activa cuando el estudio es válido y el **escenario central supera el costo** ($\\hat{\\tau} \\ge C_{\\text{umbral}}$), pero el **escenario conservador es negativo** ($\\text{IC}_{95\\%,\\text{inf}} < C_{\\text{umbral}}$). Es el caso exacto de `EXP-FREE-SHIP-45` (`margen_neto_central = +0.42 USD`, pero `margen_neto_conservador = -0.61 USD`).\n3. **Opción 3 — Descartar o esperar cierre (`3_descartar_o_esperar`):** Se aplica si el estimado central no cubre el costo, si el experimento sigue en curso (`EXP-UPSELL-MOLINO`, `status = \'running\'`) o si falló el guardarraíl de validez (`EXP-PUSH-CART`, `srm_p_value = 0.0001`).',
      visual: {
        type: 'mermaid',
        spec: 'flowchart TD\n  START["Evaluar Iniciativa / Experimento"] --> G1{"¿status = completed y\\nsrm_p_value >= 0.01?"}\n  G1 -->|"No (En curso o SRM roto)"| OPT3["3. Descartar o esperar cierre\\n(Ej. EXP-PUSH-CART, EXP-UPSELL-MOLINO)"]\n  G1 -->|"Sí (Válido y completo)"| G2{"¿IC 95% inferior >=\ncosto_umbral_usd?"}\n  G2 -->|"Sí (Margen conservador >= 0)"| OPT1["1. Desplegar general\\n(Ej. EXP-CHECKOUT-1STEP)"]\n  G2 -->|"No"| G3{"¿Estimación central >=\ncosto_umbral_usd?"}\n  G3 -->|"Sí (Central >= 0, Conservador < 0)"| OPT2["2. Piloto acotado / segmentar\\n(Ej. EXP-FREE-SHIP-45)"]\n  G3 -->|"No"| OPT3',
        caption:
          'Árbol de decisión ejecutiva que traduce intervalos de confianza y guardarraíles en tres opciones de acción.',
      },
    },
    {
      id: 'responder-objeciones-ejecutivas',
      heading: 'Cómo responder a las tres objeciones clásicas del comité',
      body: 'Al presentar frente a dirección, anticipa y responde con datos de tu tabla de evidencia las tres objeciones recurrentes:\n\n- **Objeción 1 (Finanzas): *"¿Cómo sabemos que el salto de +70.57 USD en Tienda Salamanca no fue simplemente el verano europeo o más publicidad?"***\n  Respuesta con datos: Muestra el placebo preintervención (`+0.05 USD` entre `Q1` y `Q2`), la comparación con el control sintético (`+83.87 USD` en `Q3` que vuelve a `-5.55 USD` al apagar el piloto en `Q4`) y el registro de `marketing_spend` en `Iberia` (`-2.24 USD/día`).\n- **Objeción 2 (Comercial): *"Si el descuento en el umbral de 80 USD funciona, ¿por qué no lo bajamos a 20 USD para todos los pedidos?"***\n  Respuesta con datos: Explica que el RDD estima un **LATE** en `80 USD`; bajar el umbral a `20 USD` subsidia de forma inframarginal a miles de clientes que ya compraban entre `40` y `79 USD` sin incentivo, erosionando `-4.64 USD` de margen por pedido.\n- **Objeción 3 (Producto): *"EXP-PUSH-CART tiene un efecto positivo de +5.77 USD; ¿por qué lo descartas?"***\n  Respuesta con datos: Porque el guardarraíl de asignación falló en Android (`980` controles frente a `620` tratados, `srm_p_value = 0.0001`), por lo que el `+5.77 USD` está contaminado por sesgo de supervivencia.',
      visual: {
        type: 'table',
        spec: {
          headers: [
            'Objeción en comité',
            'Riesgo si se cede sin evidencia',
            'Respuesta cuantitativa respaldada en SQL',
          ],
          rows: [
            [
              '"Es pura estacionalidad o inversión en anuncios"',
              'Descartar un piloto rentable por escepticismo no verificado.',
              'Placebo Q1-Q2 = +0.05 USD y gasto de marketing en Iberia varió -2.24 USD/día.',
            ],
            [
              '"Bajemos el umbral de descuento a todos los carritos"',
              'Canibalizar margen en compras inframarginales.',
              'El RDD mide un LATE en c = 80 USD (-4.64 USD en el corte); no es un ATE global.',
            ],
            [
              '"Lanza EXP-PUSH-CART, su IC 95 % es positivo"',
              'Desplegar una funcionalidad rota guiados por sesgo de selección.',
              'Guardarraíl SRM fallido (980 vs. 620 usuarios, p = 0.0001); requiere corregir telemetría.',
            ],
          ],
        },
        caption:
          'Guía de respuesta ejecutiva ante objeciones de finanzas, comercial y producto.',
      },
      callout: {
        type: 'tip',
        title: 'Nunca defiendas un número cuyo guardarraíl falló',
        body: 'Tu autoridad técnica ante el comité crece cuando eres el primero en vetar una métrica primaria atractiva (como EXP-PUSH-CART) porque su diagnóstico de validez interna se rompió.',
      },
    },
  ],
  workedExample: {
    title:
      'Auditoría de ingreso neto posreembolso por región para responder objeciones de calidad',
    scenario:
      'Durante la presentación anual, la gerencia regional de Andina pide el mismo presupuesto de expansión que Cono Sur e Iberia argumentando que su ticket bruto completado (~398.48 USD) supera los 395 USD. Cruzamos orders, stores y refunds en 2024 para mostrar en el comité cómo cambia la evaluación al descontar la métrica guardarraíl de reembolsos procesados.',
    datasets: ['orders', 'stores', 'refunds'],
    steps: [
      {
        order: 1,
        explanation:
          'Agregamos primero en una CTE los reembolsos con status = processed por order_id para evitar duplicar filas de orders en caso de múltiples eventos de devolución.',
        code: `WITH reembolsos_por_pedido AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS monto_reembolsado_usd
  FROM refunds
  WHERE status = 'processed'
  GROUP BY order_id
)
SELECT COUNT(*) AS pedidos_con_reembolso, ROUND(AVG(monto_reembolsado_usd), 2) AS media_reembolso_usd
FROM reembolsos_por_pedido;`,
        output: `pedidos_con_reembolso | media_reembolso_usd
----------------------+--------------------
950                   | 253.68`,
      },
      {
        order: 2,
        explanation:
          'Unimos orders (filtrando pedidos completados de 2024) con stores y hacemos LEFT JOIN con reembolsos_por_pedido para obtener por región el ticket bruto, el reembolso medio prorrateado entre todos los pedidos, la tasa porcentual de pedidos reembolsados y el ingreso neto.',
        code: `WITH reembolsos_por_pedido AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS monto_reembolsado_usd
  FROM refunds
  WHERE status = 'processed'
  GROUP BY order_id
)
SELECT
  s.region,
  COUNT(*) AS n_pedidos,
  ROUND(AVG(o.total_usd), 2) AS ticket_bruto_usd,
  ROUND(AVG(COALESCE(r.monto_reembolsado_usd, 0)), 2) AS reembolso_medio_usd,
  ROUND(AVG(CASE WHEN r.order_id IS NOT NULL THEN 100.0 ELSE 0.0 END), 2) AS tasa_reembolso_pct,
  ROUND(AVG(o.total_usd - COALESCE(r.monto_reembolsado_usd, 0)), 2) AS ingreso_neto_usd
FROM orders o
JOIN stores s ON o.store_id = s.store_id
LEFT JOIN reembolsos_por_pedido r ON o.order_id = r.order_id
WHERE o.status = 'completed'
  AND o.order_date >= '2024-01-01'
  AND o.order_date < '2025-01-01'
GROUP BY s.region
ORDER BY s.region;`,
        output: `region       | n_pedidos | ticket_bruto_usd | reembolso_medio_usd | tasa_reembolso_pct | ingreso_neto_usd
-------------+-----------+------------------+---------------------+--------------------+-----------------
Andina       | 2154      | 398.48           | 20.03               | 8.31               | 378.45
Cono Sur     | 2199      | 417.93           | 16.55               | 6.41               | 401.38
Iberia       | 1232      | 479.27           | 18.35               | 6.09               | 460.92
Norteamérica | 912       | 398.79           | 15.80               | 7.13               | 382.99`,
      },
      {
        order: 3,
        explanation:
          'Formulamos la recomendación para dirección: Andina presenta la mayor tasa de reembolsos de la compañía (8.31 %, perdiendo 20.03 USD por pedido), por lo que antes de expandir promociones comerciales debe condicionarse el presupuesto a bajar su tasa de devolución al estándar de Cono Sur (6.41 %).',
        code: `SELECT
  ROUND(398.48 - 378.45, 2) AS merma_por_reembolso_andina_usd,
  ROUND(8.31 - 6.41, 2) AS exceso_tasa_reembolso_pp;`,
        output: `merma_por_reembolso_andina_usd | exceso_tasa_reembolso_pp
-------------------------------+-------------------------
20.03                          | 1.90`,
      },
    ],
    takeaway:
      'Cruzar la métrica primaria con el guardarraíl de reembolsos transforma una discusión subjetiva en una condición operativa medible: corregir el exceso de 1.90 puntos porcentuales de devoluciones en Andina antes de escalar el gasto promocional.',
  },
  checks: [
    {
      id: 'check-dir-escenario-conservador',
      type: 'multiple-choice',
      prompt:
        'En el experimento EXP-FREE-SHIP-45, el efecto causal estimado es +6.22 USD con IC del 95 % de [5.19, 7.24] USD, y el costo logístico de equilibrio es 5.80 USD por usuario. ¿Por qué la matriz de decisión recomienda un piloto acotado en vez de un despliegue general?',
      options: [
        {
          id: 'a',
          label:
            'Porque aunque el escenario central es rentable (+0.42 USD), el escenario conservador (5.19 - 5.80 = -0.61 USD) aún incluye pérdidas netas plausibles.',
        },
        {
          id: 'b',
          label:
            'Porque el experimento sufrió un fallo de asignación muestral (SRM) con p-valor menor a 0.01.',
        },
        {
          id: 'c',
          label:
            'Porque el límite superior del intervalo de confianza (7.24 USD) queda por debajo del costo de 5.80 USD.',
        },
        {
          id: 'd',
          label:
            'Porque un intervalo de confianza que no cruza el 0.00 USD carece de significancia estadística.',
        },
      ],
      correctOptionId: 'a',
      explanation:
        'El límite inferior del IC 95 % (5.19 USD) está por debajo del costo umbral (5.80 USD), arrojando un margen conservador de -0.61 USD; por tanto, conviene acotar a segmentos donde el margen supere el costo. Las opciones b, c y d son falsas: el SRM de EXP-FREE-SHIP-45 es válido (p = 0.6194), 7.24 supera 5.80 y el intervalo sí es estadísticamente distinto de cero.',
    },
    {
      id: 'check-dir-objecion-late',
      type: 'multiple-choice',
      prompt:
        'Un directivo propone extender a todos los carritos desde 10 USD el descuento que fue evaluado mediante regresión discontinua en el umbral de 80 USD. ¿Cuál es la respuesta técnica y financiera correcta?',
      options: [
        {
          id: 'a',
          label:
            'El RDD solo identifica el efecto local (LATE) en carritos cercanos a 80 USD; aplicarlo desde 10 USD regala margen de forma inframarginal a quienes ya compraban sin descuento.',
        },
        {
          id: 'b',
          label:
            'El estimador RDD garantiza matemáticamente el mismo incremento porcentual en cualquier punto entre 10 USD y 500 USD.',
        },
        {
          id: 'c',
          label:
            'No puede responderse porque DuckDB no permite filtrar pedidos con subtotal menor a 80 USD.',
        },
      ],
      correctOptionId: 'a',
      explanation:
        'Un diseño RDD identifica el efecto local en el punto de corte (c = 80 USD); extrapolarlo hacia abajo convierte en subsidio inframarginal todas las compras que ya superaban el nuevo umbral sin necesidad de promoción. Las opciones b y c son falsas.',
    },
    {
      id: 'check-dir-predict-upsell',
      type: 'predict-output',
      prompt:
        'El experimento EXP-UPSELL-MOLINO tiene un margen neto conservador positivo (+0.17 USD) y srm_p_value = 0.4889, pero su columna status en la tabla experiments vale \'running\'. Según la regla CASE WHEN de la matriz de decisión, ¿qué opción devuelve la consulta?',
      code: `SELECT
  CASE
    WHEN 0.4889 < 0.01 OR 'running' <> 'completed' THEN '3_descartar_o_esperar'
    WHEN 0.17 >= 0 THEN '1_desplegar_general'
    ELSE '2_piloto_acotado'
  END AS decision_recomendada;`,
      options: [
        {
          id: 'a',
          label:
            'Devuelve 3_descartar_o_esperar, porque tomar decisiones definitivas sobre un experimento aún en curso (running) expone a sesgo de parada temprana (peeking).',
        },
        {
          id: 'b',
          label:
            'Devuelve 1_desplegar_general, porque la rama WHEN 0.17 >= 0 se evalúa antes que la primera condición.',
        },
        {
          id: 'c',
          label:
            'Devuelve NULL, porque el operador OR no puede combinar una comparación numérica con una de texto.',
        },
      ],
      correctOptionId: 'a',
      explanation:
        'En SQL las cláusulas CASE WHEN se evalúan en orden secuencial: como status = running es distinto de completed, la primera condición es verdadera y devuelve 3_descartar_o_esperar, previniendo cierres prematuros. Las opciones b y c son falsas.',
    },
    {
      id: 'check-dir-spot-bug',
      type: 'spot-the-bug',
      prompt:
        'Al calcular el ingreso neto tras reembolsos para la presentación ejecutiva, un analista resta directamente r.monto_reembolsado_usd sin usar COALESCE tras un LEFT JOIN con refunds. ¿Qué defecto provoca en el promedio?',
      code: `SELECT
  s.region,
  ROUND(AVG(o.total_usd - r.monto_reembolsado_usd), 2) AS ingreso_neto_usd
FROM orders o
JOIN stores s ON o.store_id = s.store_id
LEFT JOIN reembolsos_por_pedido r ON o.order_id = r.order_id
WHERE o.status = 'completed'
GROUP BY s.region;`,
      options: [
        {
          id: 'a',
          label:
            'En los pedidos sin reembolso, r.monto_reembolsado_usd es NULL, por lo que la resta da NULL y AVG() excluye más del 90 % de los pedidos sanos.',
        },
        {
          id: 'b',
          label:
            'En DuckDB un LEFT JOIN convierte automáticamente todos los valores NULL en ceros, por lo que el código duplica los ingresos.',
        },
        {
          id: 'c',
          label:
            'La cláusula WHERE o.status = completed elimina las filas de la tabla stores antes de agrupar.',
        },
      ],
      correctOptionId: 'a',
      explanation:
        'Cualquier operación aritmética con NULL produce NULL (`total_usd - NULL = NULL`), haciendo que `AVG()` calcule el promedio únicamente sobre el ~7 % de pedidos que sufrieron devolución y subestime drásticamente el ingreso neto. Debe usarse `COALESCE(r.monto_reembolsado_usd, 0)`. Las opciones b y c son falsas.',
    },
  ],
  practice: {
    id: 'practice-da4-causalidad-05-matriz-decision',
    title:
      'Construir la matriz ejecutiva de decisión bajo incertidumbre para los 6 experimentos',
    prompt:
      'Construye la tabla final para el comité de dirección cruzando experiments y experiment_assignments. La CTE estimaciones ya calcula para cada experimento: status, srm_p_value, costo_umbral_usd, efecto_did y se_did. Completa el SELECT final para devolver: experiment_code, costo_umbral_usd, margen_neto_conservador (efecto_did - 1.96 * se_did - costo_umbral_usd a 2 decimales), margen_neto_central (efecto_did - costo_umbral_usd a 2 decimales), margen_neto_optimista (efecto_did + 1.96 * se_did - costo_umbral_usd a 2 decimales) y decision_recomendada usando CASE: cuando srm_p_value < 0.01 OR status <> \'completed\' devuelve \'3_descartar_o_esperar\'; cuando (efecto_did - 1.96 * se_did) >= costo_umbral_usd devuelve \'1_desplegar_general\'; cuando efecto_did >= costo_umbral_usd devuelve \'2_piloto_acotado\'; en otro caso \'3_descartar_o_esperar\'. Ordena por experiment_id ASC.',
    engine: 'duckdb',
    datasets: ['experiments', 'experiment_assignments'],
    starterCode: `WITH estimaciones AS (
  SELECT
    e.experiment_id,
    e.experiment_code,
    e.status,
    e.srm_p_value,
    CASE
      WHEN e.experiment_code = 'EXP-CHECKOUT-1STEP' THEN 4.50::DOUBLE
      WHEN e.experiment_code = 'EXP-FREE-SHIP-45' THEN 5.80::DOUBLE
      WHEN e.experiment_code = 'EXP-SUB-BUNDLE' THEN 5.00::DOUBLE
      WHEN e.experiment_code = 'EXP-QUIZ-ORIGEN' THEN 5.20::DOUBLE
      WHEN e.experiment_code = 'EXP-UPSELL-MOLINO' THEN 5.50::DOUBLE
      ELSE 4.00::DOUBLE
    END AS costo_umbral_usd,
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
  GROUP BY 1, 2, 3, 4
)
SELECT
  experiment_code,
  costo_umbral_usd,
  ROUND(efecto_did - 1.96 * se_did - costo_umbral_usd, 2) AS margen_neto_conservador,
  ROUND(efecto_did - costo_umbral_usd, 2) AS margen_neto_central
  -- TODO: agrega margen_neto_optimista y decision_recomendada según las reglas del enunciado
FROM estimaciones
ORDER BY experiment_id ASC;`,
    solution: `WITH estimaciones AS (
  SELECT
    e.experiment_id,
    e.experiment_code,
    e.status,
    e.srm_p_value,
    CASE
      WHEN e.experiment_code = 'EXP-CHECKOUT-1STEP' THEN 4.50::DOUBLE
      WHEN e.experiment_code = 'EXP-FREE-SHIP-45' THEN 5.80::DOUBLE
      WHEN e.experiment_code = 'EXP-SUB-BUNDLE' THEN 5.00::DOUBLE
      WHEN e.experiment_code = 'EXP-QUIZ-ORIGEN' THEN 5.20::DOUBLE
      WHEN e.experiment_code = 'EXP-UPSELL-MOLINO' THEN 5.50::DOUBLE
      ELSE 4.00::DOUBLE
    END AS costo_umbral_usd,
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
  GROUP BY 1, 2, 3, 4
)
SELECT
  experiment_code,
  costo_umbral_usd,
  ROUND(efecto_did - 1.96 * se_did - costo_umbral_usd, 2) AS margen_neto_conservador,
  ROUND(efecto_did - costo_umbral_usd, 2) AS margen_neto_central,
  ROUND(efecto_did + 1.96 * se_did - costo_umbral_usd, 2) AS margen_neto_optimista,
  CASE
    WHEN srm_p_value < 0.01 OR status <> 'completed' THEN '3_descartar_o_esperar'
    WHEN (efecto_did - 1.96 * se_did) >= costo_umbral_usd THEN '1_desplegar_general'
    WHEN efecto_did >= costo_umbral_usd THEN '2_piloto_acotado'
    ELSE '3_descartar_o_esperar'
  END AS decision_recomendada
FROM estimaciones
ORDER BY experiment_id ASC;`,
    hints: [
      'Calcula margen_neto_optimista como ROUND(efecto_did + 1.96 * se_did - costo_umbral_usd, 2).',
      'En el bloque CASE de decision_recomendada, evalúa primero el guardarraíl: WHEN srm_p_value < 0.01 OR status <> \'completed\' THEN \'3_descartar_o_esperar\'.',
      'Continúa el CASE con WHEN (efecto_did - 1.96 * se_did) >= costo_umbral_usd THEN \'1_desplegar_general\' WHEN efecto_did >= costo_umbral_usd THEN \'2_piloto_acotado\' ELSE \'3_descartar_o_esperar\' END AS decision_recomendada.',
    ],
    assertions: [
      { type: 'row-count', expected: 6 },
      {
        type: 'column-names',
        expected: [
          'experiment_code',
          'costo_umbral_usd',
          'margen_neto_conservador',
          'margen_neto_central',
          'margen_neto_optimista',
          'decision_recomendada',
        ],
      },
      {
        type: 'cell-value',
        row: 0,
        column: 'decision_recomendada',
        expected: '1_desplegar_general',
      },
      {
        type: 'cell-value',
        row: 1,
        column: 'margen_neto_conservador',
        expected: -0.61,
      },
      {
        type: 'cell-value',
        row: 1,
        column: 'decision_recomendada',
        expected: '2_piloto_acotado',
      },
    ],
    expectedOutputTable: {
      columns: [
        'experiment_code',
        'costo_umbral_usd',
        'margen_neto_conservador',
        'margen_neto_central',
        'margen_neto_optimista',
        'decision_recomendada',
      ],
      rows: [
        ['EXP-CHECKOUT-1STEP', 4.5, 1.35, 2.37, 3.39, '1_desplegar_general'],
        ['EXP-FREE-SHIP-45', 5.8, -0.61, 0.42, 1.44, '2_piloto_acotado'],
        ['EXP-SUB-BUNDLE', 5, 0.5, 1.55, 2.6, '1_desplegar_general'],
        ['EXP-QUIZ-ORIGEN', 5.2, 0.27, 1.31, 2.35, '1_desplegar_general'],
        ['EXP-UPSELL-MOLINO', 5.5, 0.17, 1.22, 2.27, '3_descartar_o_esperar'],
        ['EXP-PUSH-CART', 4, 0.72, 1.77, 2.82, '3_descartar_o_esperar'],
      ],
    },
  },
  roleNotes: {
    da: 'Acuerda el costo umbral de equilibrio (costo_umbral_usd) con finanzas antes de mirar los resultados del experimento; fijar la barra después de conocer el intervalo de confianza invita a racionalizaciones oportunistas.',
    bi: 'En los tableros ejecutivos de decisiones, sustituye las columnas de estadístico t y valor p por las tres columnas de margen neto (conservador, central y optimista) expresadas en dólares por pedido o por usuario.',
    de: 'Automatiza la unión entre asignaciones experimentales, pedidos y reembolsos procesados para que las métricas guardarraíl de devoluciones se actualicen con la misma latencia que la facturación bruta.',
    ds: 'Cuando una iniciativa cae en 2_piloto_acotado (como EXP-FREE-SHIP-45), estima efectos heterogéneos por segmento o región para identificar en qué subpoblación el límite inferior del IC 95 % sí supera el costo logístico.',
  },
  summary: [
    'Un resultado estadísticamente significativo no justifica por sí solo un lanzamiento si el intervalo de confianza no supera el costo unitario del programa.',
    'Restar el costo de equilibrio a los límites del IC del 95 % traduce la incertidumbre estadística en escenarios financieros conservador, central y optimista.',
    'Las métricas guardarraíl, como la tasa de reembolsos en refunds o el chequeo SRM, actúan como candados de seguridad antes de autorizar cualquier despliegue.',
    'Una matriz de decisión explícita clasifica cada iniciativa en desplegar, acotar a piloto o descartar, blindando al comité frente a objeciones e impulsos.',
  ],
  flashcards: [
    {
      id: 'fc-dir-01',
      front: '¿Cómo se calcula el escenario financiero conservador de una intervención comercial?',
      back: 'Restando el costo unitario de equilibrio (break-even cost) al límite inferior del intervalo de confianza del 95 % del efecto causal estimado.',
    },
    {
      id: 'fc-dir-02',
      front: '¿Cuándo recomienda la matriz de decisión un piloto acotado en lugar de un despliegue general?',
      back: 'Cuando el experimento es internamente válido y su estimación central supera el costo umbral, pero el límite inferior del IC del 95 % aún arroja margen neto negativo.',
    },
    {
      id: 'fc-dir-03',
      front: '¿Qué función cumplen las métricas guardarraíl (como la tasa de reembolso) en una presentación a dirección?',
      back: 'Garantizan que el aumento en la métrica primaria de ingresos no se haya obtenido degradando la satisfacción del cliente, el margen neto o la calidad operativa.',
    },
    {
      id: 'fc-dir-04',
      front: '¿Por qué no debe aprobarse el despliegue de un experimento cuyo status es running aunque su IC 95 % actual sea positivo?',
      back: 'Porque detener o decidir sobre una prueba antes de la fecha de cierre acordada introduce sesgo por inspección repetida (peeking) e infla la tasa de falsos positivos.',
    },
  ],
  glossaryTerms: [
    'matriz-de-decision',
    'principio-de-la-piramide',
    'diferencias-en-diferencias',
  ],
  sources: [
    {
      title:
        'Trustworthy Online Controlled Experiments — Companion Guide and Decision Rules',
      url: 'https://experimentguide.com/',
      publisher: 'Cambridge University Press / Ron Kohavi, Diane Tang & Ya Xu',
      accessed: '2026-10-29',
      supports:
        'Criterios de lanzamiento en comité, métricas guardarraíl y prevención de decisiones sobre experimentos inválidos o inconclusos.',
    },
    {
      title: 'The Effect — Chapter 10: Treatment Effects (ATE, ATT, LATE)',
      url: 'https://theeffectbook.net/ch-TreatmentEffects.html',
      publisher: 'Chapman & Hall / Nick Huntington-Klein',
      accessed: '2026-10-29',
      supports:
        'Distinción entre efectos locales en el umbral (LATE) y efectos promedio al responder objeciones de escalamiento comercial.',
    },
    {
      title:
        'Causal Inference: The Mixtape — Chapter 4: Potential Outcomes and Heterogeneity',
      url: 'https://mixtape.scunning.com/04-Potential_Outcomes_and_Randomization.html',
      publisher: 'Yale University Press / Scott Cunningham',
      accessed: '2026-10-29',
      supports:
        'Efectos heterogéneos de tratamiento y análisis costo-beneficio por subpoblación.',
    },
    {
      title: 'DuckDB CASE Statement and Conditional Expressions',
      url: 'https://duckdb.org/docs/stable/sql/expressions/case',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports:
        'Codificación secuencial de reglas de decisión ejecutiva mediante bloques CASE WHEN en SQL.',
    },
  ],
  aiNotes:
    'Ayuda al estudiante a comprender por qué EXP-FREE-SHIP-45 cae en 2_piloto_acotado (su efecto central +6.22 supera el costo de 5.80 USD, pero su límite inferior 5.19 queda por debajo, dando -0.61 USD) y por qué EXP-UPSELL-MOLINO y EXP-PUSH-CART caen en 3_descartar_o_esperar por el guardarraíl inicial del CASE.',
};
