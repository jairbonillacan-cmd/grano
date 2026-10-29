const lesson = {
  id: 'bi2-metricas-03-metricas-guardia',
  moduleId: 'bi2-metricas',
  tracks: ['bi'],
  level: 2,
  order: 3,
  title: 'Métricas guardia: evitar que un indicador dañe otro',
  subtitle:
    'Métricas guardia (guardrails): evitar que optimizar un indicador dañe otro',
  minutes: 20,
  datasets: [
    'orders',
    'order_items',
    'products',
    'refunds',
    'experiments',
    'experiment_assignments',
  ],
  prerequisites: ['bi2-metricas-02-arboles-kpis-palancas'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), crecimiento celebra dos supuestas victorias: `CMP-RETENCION` capturó 1,245,953.68 USD en ventas antes de devoluciones y el experimento `EXP-PUSH-CART` subió el gasto post-experimento de 59.63 USD a 65.57 USD. Sin embargo, al auditar los daños colaterales, `CMP-RETENCION` sufrió 192,386.62 USD en reembolsos (15.44 % de devolución) y `EXP-PUSH-CART` asignó 980 usuarios a control frente a 620 a tratamiento (`srm_p_value = 0.0001`). ¿Cómo diseñas métricas guardia con umbrales de veto para impedir que optimizar un número destruya margen o apruebe experimentos sesgados?',

  objectives: [
    'Emparejar toda métrica primaria de optimización con métricas guardia de negocio (tasa de devolución, margen bruto neto) y de confiabilidad experimental (Sample Ratio Mismatch).',
    'Definir umbrales de guardia numéricos y codificarlos en SQL mediante expresiones condicionales CASE WHEN para automatizar alertas y bloqueos.',
    'Auditar campañas comerciales sobre el universo canónico realizado garantizando consistencia entre el numerador de reembolsos y el denominador de ventas.',
  ],

  sections: [
    {
      id: 'anatomia-metrica-guardia',
      heading: 'Por qué ninguna métrica primaria debe viajar sola',
      body: 'Optimizar un indicador aislado sin límites laterales deteriora cualquier negocio. Si premias a un equipo solo por el volumen de ventas capturadas en el checkout, aparecerán incentivos perversos. El equipo puede prometer entregas irreales o repartir cupones a compradores oportunistas que luego devuelven el producto.\n\nUna **métrica guardia** (*guardrail metric*) no es el indicador que buscas maximizar. Es una restricción de seguridad que protege la salud del sistema mientras empujas la palanca principal. Para que funcione como regla de gobierno, toda métrica guardia necesita un **umbral de guardia** explícito fijado antes de lanzar la campaña.\n\nEn Mercado Brisa, el comité comercial exige dos umbrales sobre pedidos realizados (`status IN (\'completed\', \'refunded\')`). La tasa de devolución no puede superar el `10.0 %`, y el margen bruto neto tras reembolsos debe ser al menos `42.0 %`. Mientras `CMP-BARISTA` y `CMP-ORIGEN` mantienen `0.00 %` de devolución y más de `46.5 %` de margen, `CMP-RETENCION` (`15.44 %` devolución, `32.47 %` margen) y `CMP-VERANO` (`18.46 %` devolución, `28.12 %` margen) violan ambos límites.',
      example: {
        language: 'sql',
        code: `WITH dev_por_pedido AS (
  SELECT order_id, SUM(refund_amount_usd) AS devuelto_usd
  FROM refunds
  GROUP BY order_id
),
costo_por_pedido AS (
  SELECT
    oi.order_id,
    SUM(oi.qty * p.unit_cost_usd) AS costo_usd
  FROM order_items oi
  JOIN products p ON oi.product_id = p.product_id
  GROUP BY oi.order_id
)
SELECT
  COALESCE(o.campaign_id, 'ORG-DIRECTO') AS campaign_id,
  COUNT(o.order_id) AS pedidos_realizados,
  ROUND(SUM(o.subtotal_usd - o.discount_usd), 2) AS venta_previa_dev_usd,
  ROUND(SUM(COALESCE(d.devuelto_usd, 0)), 2) AS devuelto_usd,
  ROUND(
    100.0 * SUM(COALESCE(d.devuelto_usd, 0)) / SUM(o.subtotal_usd - o.discount_usd),
    2
  ) AS pct_devolucion_guardia,
  ROUND(
    100.0 * SUM(o.subtotal_usd - o.discount_usd - COALESCE(d.devuelto_usd, 0) - cp.costo_usd)
    / SUM(o.subtotal_usd - o.discount_usd),
    2
  ) AS pct_margen_neto_guardia
FROM orders o
JOIN costo_por_pedido cp ON o.order_id = cp.order_id
LEFT JOIN dev_por_pedido d ON o.order_id = d.order_id
WHERE o.status IN ('completed', 'refunded')
GROUP BY 1
ORDER BY venta_previa_dev_usd DESC;`,
        expectedOutput: [
          {
            campaign_id: 'ORG-DIRECTO',
            pedidos_realizados: 5400,
            venta_previa_dev_usd: 2929572.03,
            devuelto_usd: 0.0,
            pct_devolucion_guardia: 0.0,
            pct_margen_neto_guardia: 47.3,
          },
          {
            campaign_id: 'CMP-RETENCION',
            pedidos_realizados: 2640,
            venta_previa_dev_usd: 1245953.68,
            devuelto_usd: 192354.1,
            pct_devolucion_guardia: 15.44,
            pct_margen_neto_guardia: 32.47,
          },
          {
            campaign_id: 'CMP-BARISTA',
            pedidos_realizados: 2760,
            venta_previa_dev_usd: 876764.57,
            devuelto_usd: 0.0,
            pct_devolucion_guardia: 0.0,
            pct_margen_neto_guardia: 46.51,
          },
          {
            campaign_id: 'CMP-VERANO',
            pedidos_realizados: 2760,
            venta_previa_dev_usd: 445241.17,
            devuelto_usd: 82180.42,
            pct_devolucion_guardia: 18.46,
            pct_margen_neto_guardia: 28.12,
          },
          {
            campaign_id: 'CMP-ORIGEN',
            pedidos_realizados: 2640,
            venta_previa_dev_usd: 428392.93,
            devuelto_usd: 0.0,
            pct_devolucion_guardia: 0.0,
            pct_margen_neto_guardia: 47.99,
          },
        ],
      },
    },
    {
      id: 'dos-familias-guardias-negocio-y-srm',
      heading: 'Guardias de negocio frente a guardias de validez experimental (SRM)',
      body: 'En la literatura de experimentación controlada (Kohavi, Tang & Xu), las métricas guardia se dividen en dos familias. La primera son las guardias organizacionales de negocio. La segunda son las guardias de confiabilidad del dato.\n\nLas guardias de negocio protegen invariantes económicos y de experiencia: tasa de reembolso, cancelaciones, latencia web o margen unitario. Si una campaña sube la conversión un `5 %` pero dispara las devoluciones por encima del `10 %`, el efecto financiero neto resulta negativo.\n\nLas guardias de confiabilidad auditan si el instrumento de medición es válido antes de mirar el ingreso. En pruebas A/B, la guardia crítica es **Sample Ratio Mismatch (SRM)**. Si diseñaste un reparto `50 % / 50 %` entre control y tratamiento, ambos grupos deben recibir casi la misma cantidad de usuarios. Cuando `srm_p_value < 0.001`, existe un sesgo de asignación o pérdida de telemetría. En `EXP-PUSH-CART` (`980` control vs `620` tratamiento, `srm_p_value = 0.0001`), la ganancia de `+5.94` USD es inválida y el lanzamiento se bloquea.',
    },
    {
      id: 'consistencia-denominadores-guardia',
      heading: 'Consistencia entre numerador y denominador en tasas guardia',
      body: 'Un error frecuente al programar una tasa guardia en SQL es aplicar el **filtro canónico** al denominador pero olvidarlo en el numerador. En Mercado Brisa, esto sucede si filtras `status IN (\'completed\', \'refunded\')` en la venta pero sumas `d.devuelto_usd` sin filtrar el estado del pedido padre. Hacerlo mete en el numerador los reembolsos de pedidos `cancelled`.\n\nEsa asimetría infla por error la tasa de devolución de `CMP-RETENCION` del `15.44 %` real al `19.18 %`. En `CMP-VERANO` la distorsiona del `18.46 %` al `23.51 %`. Aunque ambas campañas siguen en alerta, publicar una tasa mal calculada resta credibilidad al equipo de BI cuando Marketing revisa los pedidos.\n\nPara garantizar consistencia matemática, el filtro `WHERE o.status IN (\'completed\', \'refunded\')` debe gobernar toda la consulta o aplicarse por igual al numerador y al denominador. Luego, una expresión `CASE WHEN` traduce el **umbral de guardia** en un estado operativo claro (`OK` frente a `ALERTA_DEVOLUCION`).',
    },
  ],

  workedExample: {
    title:
      'Auditoría de experimentos A/B en Mercado Brisa: del entusiasmo ingenuo al bloqueo por SRM',
    description:
      'Contrasta una tabla que ordena experimentos únicamente por el diferencial de gasto medio post-experimento frente al dictamen que incorpora la guardia estadística de SRM.',
    steps: [
      {
        label:
          'Paso 1 — Evaluación ingenua: ordenar experimentos solo por ganancia en gasto medio',
        explanation:
          'Si unimos experiments con experiment_assignments y comparamos el gasto medio post-experimento (post_experiment_spend_usd) sin revisar el equilibrio muestral ni el srm_p_value, los seis experimentos parecen exitosos y EXP-PUSH-CART muestra +5.94 USD por usuario.',
        code: `SELECT
  e.experiment_code,
  ROUND(AVG(ea.post_experiment_spend_usd) FILTER (WHERE ea.variant = 'control'), 2) AS rev_control_usd,
  ROUND(AVG(ea.post_experiment_spend_usd) FILTER (WHERE ea.variant = 'treatment'), 2) AS rev_treatment_usd,
  ROUND(
    AVG(ea.post_experiment_spend_usd) FILTER (WHERE ea.variant = 'treatment')
    - AVG(ea.post_experiment_spend_usd) FILTER (WHERE ea.variant = 'control'),
    2
  ) AS diff_ingreso_usd
FROM experiments e
JOIN experiment_assignments ea ON e.experiment_id = ea.experiment_id
GROUP BY e.experiment_code
ORDER BY diff_ingreso_usd DESC;`,
        expectedOutput: [
          {
            experiment_code: 'EXP-CHECKOUT-1STEP',
            rev_control_usd: 61.49,
            rev_treatment_usd: 68.4,
            diff_ingreso_usd: 6.91,
          },
          {
            experiment_code: 'EXP-SUB-BUNDLE',
            rev_control_usd: 58.06,
            rev_treatment_usd: 64.67,
            diff_ingreso_usd: 6.61,
          },
          {
            experiment_code: 'EXP-QUIZ-ORIGEN',
            rev_control_usd: 62.52,
            rev_treatment_usd: 69.09,
            diff_ingreso_usd: 6.57,
          },
          {
            experiment_code: 'EXP-UPSELL-MOLINO',
            rev_control_usd: 67.29,
            rev_treatment_usd: 73.75,
            diff_ingreso_usd: 6.46,
          },
          {
            experiment_code: 'EXP-FREE-SHIP-45',
            rev_control_usd: 66.08,
            rev_treatment_usd: 72.45,
            diff_ingreso_usd: 6.37,
          },
          {
            experiment_code: 'EXP-PUSH-CART',
            rev_control_usd: 59.63,
            rev_treatment_usd: 65.57,
            diff_ingreso_usd: 5.94,
          },
        ],
      },
      {
        label:
          'Paso 2 — Evaluación con umbral de guardia SRM y dictamen automatizado',
        explanation:
          'Incorporamos el conteo de sujetos por variante, el srm_p_value y una regla de decisión en SQL: primero verificamos el umbral de guardia estadístico (srm_p_value < 0.001 bloquea con BLOQUEADO_SRM); esto detiene de inmediato EXP-PUSH-CART (980 en control frente a 620 en tratamiento).',
        code: `SELECT
  e.experiment_code,
  COUNT(*) FILTER (WHERE ea.variant = 'control') AS n_control,
  COUNT(*) FILTER (WHERE ea.variant = 'treatment') AS n_treatment,
  MIN(e.srm_p_value) AS srm_p_value,
  ROUND(AVG(ea.post_experiment_spend_usd) FILTER (WHERE ea.variant = 'control'), 2) AS rev_control_usd,
  ROUND(AVG(ea.post_experiment_spend_usd) FILTER (WHERE ea.variant = 'treatment'), 2) AS rev_treatment_usd,
  CASE
    WHEN MIN(e.srm_p_value) < 0.001 THEN 'BLOQUEADO_SRM'
    WHEN AVG(ea.post_experiment_spend_usd) FILTER (WHERE ea.variant = 'treatment')
       - AVG(ea.post_experiment_spend_usd) FILTER (WHERE ea.variant = 'control') >= 3.0 THEN 'LANZAR'
    ELSE 'ITERAR'
  END AS decision_comite
FROM experiments e
JOIN experiment_assignments ea ON e.experiment_id = ea.experiment_id
GROUP BY e.experiment_code
ORDER BY e.experiment_code;`,
        expectedOutput: [
          {
            experiment_code: 'EXP-CHECKOUT-1STEP',
            n_control: 800,
            n_treatment: 800,
            srm_p_value: 0.8421,
            rev_control_usd: 61.49,
            rev_treatment_usd: 68.4,
            decision_comite: 'LANZAR',
          },
          {
            experiment_code: 'EXP-FREE-SHIP-45',
            n_control: 800,
            n_treatment: 800,
            srm_p_value: 0.6194,
            rev_control_usd: 66.08,
            rev_treatment_usd: 72.45,
            decision_comite: 'LANZAR',
          },
          {
            experiment_code: 'EXP-PUSH-CART',
            n_control: 980,
            n_treatment: 620,
            srm_p_value: 0.0001,
            rev_control_usd: 59.63,
            rev_treatment_usd: 65.57,
            decision_comite: 'BLOQUEADO_SRM',
          },
          {
            experiment_code: 'EXP-QUIZ-ORIGEN',
            n_control: 800,
            n_treatment: 800,
            srm_p_value: 0.7315,
            rev_control_usd: 62.52,
            rev_treatment_usd: 69.09,
            decision_comite: 'LANZAR',
          },
          {
            experiment_code: 'EXP-SUB-BUNDLE',
            n_control: 800,
            n_treatment: 800,
            srm_p_value: 0.5102,
            rev_control_usd: 58.06,
            rev_treatment_usd: 64.67,
            decision_comite: 'LANZAR',
          },
          {
            experiment_code: 'EXP-UPSELL-MOLINO',
            n_control: 800,
            n_treatment: 800,
            srm_p_value: 0.4889,
            rev_control_usd: 67.29,
            rev_treatment_usd: 73.75,
            decision_comite: 'LANZAR',
          },
        ],
      },
    ],
  },

  checks: [
    {
      id: 'chk-bi2-03-srm',
      type: 'mcq',
      prompt:
        'En el experimento EXP-PUSH-CART, la variante treatment muestra +5.94 USD más de gasto medio por sujeto que control, pero n_control = 980, n_treatment = 620 y srm_p_value = 0.0001. ¿Qué decisión debe tomar el analista BI?',
      options: [
        {
          id: 'a',
          text: 'Lanzar el cambio a producción porque 620 usuarios es un tamaño de muestra suficiente para calcular un promedio.',
          correct: false,
          feedback:
            'Incorrecto. Un SRM severo indica sesgo de selección o pérdida de telemetría; el promedio observado está contaminado.',
        },
        {
          id: 'b',
          text: 'Bloquear el despliegue (BLOQUEADO_SRM) y auditar el pipeline de asignación o instrumentación antes de confiar en cualquier métrica de negocio.',
          correct: true,
          feedback:
            'Correcto. Cuando srm_p_value < 0.001, los grupos dejaron de ser comparables y el efecto causal estimado carece de validez.',
        },
        {
          id: 'c',
          text: 'Multiplicar el ingreso de treatment por 980/620 para compensar los usuarios faltantes.',
          correct: false,
          feedback:
            'Incorrecto. Reponderar linealmente no corrige el sesgo de supervivencia de los usuarios que sí quedaron registrados.',
        },
      ],
      explanation:
        'Un Sample Ratio Mismatch (srm_p_value < 0.001) demuestra que el mecanismo de aleatorización o captura de eventos falló de forma asimétrica entre variantes. Cuando falla esta guardia de datos, la comparación entre tratamiento y control queda invalidada.',
    },
    {
      id: 'chk-bi2-03-denominador',
      type: 'mcq',
      prompt:
        "Al calcular la tasa de devolución guardia por campaña sobre pedidos realizados (status IN ('completed', 'refunded')), ¿qué ocurre si filtras esos estados en el denominador de ventas pero sumas todos los registros de refunds sin filtrar el estado del pedido?",
      options: [
        {
          id: 'a',
          text: 'El numerador incluye reembolsos de pedidos cancelados, sobreestimando artificialmente el porcentaje de devolución de la campaña.',
          correct: true,
          feedback:
            'Correcto. En CMP-RETENCION esto infla la tasa de devolución del 15.44 % real al 19.18 % por mezclar universos distintos.',
        },
        {
          id: 'b',
          text: 'El porcentaje disminuye porque los pedidos cancelados tienen reembolsos negativos en la base de datos.',
          correct: false,
          feedback:
            'Incorrecto. Los montos en refunds son positivos y sumarlos sin filtro agranda el numerador.',
        },
        {
          id: 'c',
          text: 'No ocurre ningún cambio porque la tabla refunds solo contiene pedidos con estado refunded.',
          correct: false,
          feedback:
            'Incorrecto. En Mercado Brisa existen reembolsos en pedidos con estado completed (parciales), refunded y también cancelled.',
        },
      ],
      explanation:
        'En cualquier métrica de razón o porcentaje guardia, el numerador y el denominador deben compartir exactamente el mismo filtro canónico de población. Si el denominador evalúa pedidos realizados, el numerador solo debe sumar reembolsos de esos mismos pedidos.',
    },
    {
      id: 'chk-bi2-03-fill-case',
      type: 'fill-code',
      prompt:
        "Completa la expresión condicional que asigna 'ALERTA_DEVOLUCION' cuando la tasa de devolución supera el umbral de guardia de 10.0 % y 'OK' en caso contrario:",
      template:
        "CASE {{b1}} pct_devolucion > 10.0 THEN 'ALERTA_DEVOLUCION' ELSE 'OK' END",
      blanks: [
        {
          id: 'b1',
          accepted: ['WHEN', 'when'],
        },
      ],
      explanation:
        'La estructura CASE WHEN condición THEN resultado ELSE alternativa END permite codificar umbrales de guardia directamente en la capa SQL para automatizar semáforos y reglas de veto en los reportes.',
    },
  ],

  practice: {
    type: 'sql',
    title: 'Auditoría de campañas con métricas guardia de devolución y margen',
    language: 'sql',
    prompt:
      "Construye el reporte de auditoría de campañas con métricas guardia sobre los pedidos realizados (`status IN ('completed', 'refunded')`). Preagrega `refunds` (`SUM(refund_amount_usd) AS devuelto_usd`) y el costo directo de líneas (`order_items oi JOIN products p ON oi.product_id = p.product_id`, sumando `oi.qty * p.unit_cost_usd AS costo_usd`) por `order_id` en CTEs antes de unir con `orders`. Devuelve seis columnas exactas: `campaign_id` (`COALESCE(o.campaign_id, 'ORG-DIRECTO')`), `pedidos_capturados` (conteo de pedidos realizados), `venta_previa_devolucion_usd` (`SUM(subtotal_usd - discount_usd)` redondeado a 2 decimales), `pct_devolucion_guardia` (`100.0 * SUM(COALESCE(devuelto_usd, 0)) / SUM(subtotal_usd - discount_usd)` redondeado a 2 decimales), `pct_margen_neto_guardia` (`100.0 * SUM(subtotal_usd - discount_usd - COALESCE(devuelto_usd, 0) - costo_usd) / SUM(subtotal_usd - discount_usd)` redondeado a 2 decimales) y `estado_guardia` (`'ALERTA_DEVOLUCION'` si la tasa de devolución supera `10.0`, o `'OK'` en caso contrario). Ordena de mayor a menor por `venta_previa_devolucion_usd`.",
    starterCode: `WITH dev_por_pedido AS (
  SELECT order_id, SUM(refund_amount_usd) AS devuelto_usd
  FROM refunds
  GROUP BY order_id
),
costo_por_pedido AS (
  SELECT
    oi.order_id,
    SUM(oi.qty * p.unit_cost_usd) AS costo_usd
  FROM order_items oi
  JOIN products p ON oi.product_id = p.product_id
  GROUP BY oi.order_id
)
SELECT
  COALESCE(o.campaign_id, 'ORG-DIRECTO') AS campaign_id,
  COUNT(o.order_id) AS pedidos_capturados,
  ROUND(SUM(o.subtotal_usd - o.discount_usd), 2) AS venta_previa_devolucion_usd,
  -- Completa las dos métricas guardia y el semáforo CASE WHEN:
  0.0 AS pct_devolucion_guardia,
  0.0 AS pct_margen_neto_guardia,
  'PENDIENTE' AS estado_guardia
FROM orders o
JOIN costo_por_pedido cp ON o.order_id = cp.order_id
LEFT JOIN dev_por_pedido d ON o.order_id = d.order_id
WHERE o.status IN ('completed', 'refunded')
GROUP BY 1
ORDER BY venta_previa_devolucion_usd DESC;`,
    expected: `WITH dev_por_pedido AS (
  SELECT order_id, SUM(refund_amount_usd) AS devuelto_usd
  FROM refunds
  GROUP BY order_id
),
costo_por_pedido AS (
  SELECT
    oi.order_id,
    SUM(oi.qty * p.unit_cost_usd) AS costo_usd
  FROM order_items oi
  JOIN products p ON oi.product_id = p.product_id
  GROUP BY oi.order_id
)
SELECT
  COALESCE(o.campaign_id, 'ORG-DIRECTO') AS campaign_id,
  COUNT(o.order_id) AS pedidos_capturados,
  ROUND(SUM(o.subtotal_usd - o.discount_usd), 2) AS venta_previa_devolucion_usd,
  ROUND(
    100.0 * SUM(COALESCE(d.devuelto_usd, 0)) / SUM(o.subtotal_usd - o.discount_usd),
    2
  ) AS pct_devolucion_guardia,
  ROUND(
    100.0 * SUM(o.subtotal_usd - o.discount_usd - COALESCE(d.devuelto_usd, 0) - cp.costo_usd)
    / SUM(o.subtotal_usd - o.discount_usd),
    2
  ) AS pct_margen_neto_guardia,
  CASE
    WHEN 100.0 * SUM(COALESCE(d.devuelto_usd, 0)) / SUM(o.subtotal_usd - o.discount_usd) > 10.0
      THEN 'ALERTA_DEVOLUCION'
    ELSE 'OK'
  END AS estado_guardia
FROM orders o
JOIN costo_por_pedido cp ON o.order_id = cp.order_id
LEFT JOIN dev_por_pedido d ON o.order_id = d.order_id
WHERE o.status IN ('completed', 'refunded')
GROUP BY 1
ORDER BY venta_previa_devolucion_usd DESC;`,
    orderMatters: true,
    hints: [
      'Calcula pct_devolucion_guardia con ROUND(100.0 * SUM(COALESCE(d.devuelto_usd, 0)) / SUM(o.subtotal_usd - o.discount_usd), 2).',
      'Calcula pct_margen_neto_guardia con ROUND(100.0 * SUM(o.subtotal_usd - o.discount_usd - COALESCE(d.devuelto_usd, 0) - cp.costo_usd) / SUM(o.subtotal_usd - o.discount_usd), 2).',
      "Para estado_guardia usa CASE WHEN 100.0 * SUM(COALESCE(d.devuelto_usd, 0)) / SUM(o.subtotal_usd - o.discount_usd) > 10.0 THEN 'ALERTA_DEVOLUCION' ELSE 'OK' END.",
    ],
    solution: `WITH dev_por_pedido AS (
  SELECT order_id, SUM(refund_amount_usd) AS devuelto_usd
  FROM refunds
  GROUP BY order_id
),
costo_por_pedido AS (
  SELECT
    oi.order_id,
    SUM(oi.qty * p.unit_cost_usd) AS costo_usd
  FROM order_items oi
  JOIN products p ON oi.product_id = p.product_id
  GROUP BY oi.order_id
)
SELECT
  COALESCE(o.campaign_id, 'ORG-DIRECTO') AS campaign_id,
  COUNT(o.order_id) AS pedidos_capturados,
  ROUND(SUM(o.subtotal_usd - o.discount_usd), 2) AS venta_previa_devolucion_usd,
  ROUND(
    100.0 * SUM(COALESCE(d.devuelto_usd, 0)) / SUM(o.subtotal_usd - o.discount_usd),
    2
  ) AS pct_devolucion_guardia,
  ROUND(
    100.0 * SUM(o.subtotal_usd - o.discount_usd - COALESCE(d.devuelto_usd, 0) - cp.costo_usd)
    / SUM(o.subtotal_usd - o.discount_usd),
    2
  ) AS pct_margen_neto_guardia,
  CASE
    WHEN 100.0 * SUM(COALESCE(d.devuelto_usd, 0)) / SUM(o.subtotal_usd - o.discount_usd) > 10.0
      THEN 'ALERTA_DEVOLUCION'
    ELSE 'OK'
  END AS estado_guardia
FROM orders o
JOIN costo_por_pedido cp ON o.order_id = cp.order_id
LEFT JOIN dev_por_pedido d ON o.order_id = d.order_id
WHERE o.status IN ('completed', 'refunded')
GROUP BY 1
ORDER BY venta_previa_devolucion_usd DESC;`,
    solutionExplanation:
      'El reporte con métricas guardia desenmascara a CMP-RETENCION y CMP-VERANO: aunque capturan alto volumen previo a devoluciones, sus tasas de reembolso (15.44 % y 18.46 %) hunden el margen bruto neto a 32.47 % y 28.12 %, disparando la alerta.',
    expectedOutputTable: [
      {
        campaign_id: 'ORG-DIRECTO',
        pedidos_capturados: 5400,
        venta_previa_devolucion_usd: 2929572.03,
        pct_devolucion_guardia: 0.0,
        pct_margen_neto_guardia: 47.3,
        estado_guardia: 'OK',
      },
      {
        campaign_id: 'CMP-RETENCION',
        pedidos_capturados: 2640,
        venta_previa_devolucion_usd: 1245953.68,
        pct_devolucion_guardia: 15.44,
        pct_margen_neto_guardia: 32.47,
        estado_guardia: 'ALERTA_DEVOLUCION',
      },
      {
        campaign_id: 'CMP-BARISTA',
        pedidos_capturados: 2760,
        venta_previa_devolucion_usd: 876764.57,
        pct_devolucion_guardia: 0.0,
        pct_margen_neto_guardia: 46.51,
        estado_guardia: 'OK',
      },
      {
        campaign_id: 'CMP-VERANO',
        pedidos_capturados: 2760,
        venta_previa_devolucion_usd: 445241.17,
        pct_devolucion_guardia: 18.46,
        pct_margen_neto_guardia: 28.12,
        estado_guardia: 'ALERTA_DEVOLUCION',
      },
      {
        campaign_id: 'CMP-ORIGEN',
        pedidos_capturados: 2640,
        venta_previa_devolucion_usd: 428392.93,
        pct_devolucion_guardia: 0.0,
        pct_margen_neto_guardia: 47.99,
        estado_guardia: 'OK',
      },
    ],
  },

  roleNotes: {
    de: 'Como Ingeniero de Datos, automatiza pruebas de calidad que verifiquen el balance muestral (SRM) y las tasas de nulidad antes de publicar las tablas de experimentación.',
    da: 'Como Analista de Datos, nunca entregues la evaluación de una campaña o prueba A/B reportando solo el indicador primario; incluye siempre la columna de métrica guardia y su umbral.',
    bi: 'Como Analista BI, diseña tus tableros de campañas de modo que el estado de guardia (OK vs ALERTA) sea visible junto al ingreso para evitar decisiones sesgadas.',
  },

  summary: [
    'Una métrica guardia protege invariantes del negocio o la validez estadística mientras un equipo optimiza un indicador primario.',
    'Todo indicador guardia requiere un umbral numérico explícito de veto definido antes de ejecutar la campaña o el experimento.',
    'En Mercado Brisa, la guardia de devolución (> 10 %) detecta que CMP-RETENCION (15.44 %) y CMP-VERANO (18.46 %) hunden el margen.',
    'En pruebas A/B, un Sample Ratio Mismatch (srm_p_value < 0.001 como en EXP-PUSH-CART) invalida resultados y bloquea el lanzamiento.',
  ],

  flashcards: [
    {
      id: 'fc-bi2-03-01',
      front:
        '¿Qué es un umbral de guardia (guardrail threshold) y por qué debe fijarse ex ante?',
      back: 'Es el límite numérico máximo o mínimo tolerable en una métrica guardia que actúa como condición de veto. Se fija antes de medir para evitar racionalizar daños colaterales cuando la métrica primaria sube.',
    },
    {
      id: 'fc-bi2-03-02',
      front:
        '¿Cuáles son las dos familias principales de métricas guardia en analítica y experimentación?',
      back: '1) Guardias organizacionales de negocio (margen neto, tasa de devolución, latencia) y 2) Guardias de confiabilidad del dato o validez experimental (como Sample Ratio Mismatch, SRM).',
    },
    {
      id: 'fc-bi2-03-03',
      front:
        '¿Qué indica un srm_p_value < 0.001 en una tabla de experimentos como EXP-PUSH-CART?',
      back: 'Indica un Sample Ratio Mismatch severo: la proporción de usuarios entre control (980) y tratamiento (620) viola el diseño aleatorio, señalando un sesgo de instrumentación que invalida los resultados.',
    },
    {
      id: 'fc-bi2-03-04',
      front:
        '¿Qué requisito deben cumplir el numerador y el denominador de una tasa guardia en SQL?',
      back: "Ambos deben evaluarse exactamente sobre el mismo universo y filtro canónico (por ejemplo, status IN ('completed', 'refunded')) para no mezclar poblaciones incompatibles.",
    },
  ],

  glossaryTerms: [
    'umbral-de-guardia',
    'filtro-canonico',
    'margen-bruto',
    'c02-cte-preagg',
  ],

  sources: [
    {
      title: 'Kohavi, Tang & Xu — Trustworthy Online Controlled Experiments',
      url: 'https://experimentguide.com/',
      publisher: 'Cambridge University Press',
      accessed: '2026-10-29',
      supports:
        'Taxonomía de métricas objetivo, métricas guardia de negocio y diagnóstico de Sample Ratio Mismatch (SRM).',
    },
    {
      title: 'dbt Labs — Measures & Semantic Constraints Documentation',
      url: 'https://docs.getdbt.com/docs/build/measures',
      publisher: 'dbt Labs',
      accessed: '2026-10-29',
      supports:
        'Definición semántica de medidas emparejadas para impedir reportes parciales sin control de calidad.',
    },
    {
      title: 'DuckDB Documentation — Aggregate Functions',
      url: 'https://duckdb.org/docs/sql/functions/aggregates.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports:
        'Cálculo simultáneo de métricas primarias y razones guardia con funciones de agregación en SQL.',
    },
  ],

  aiNotes:
    "El estudiante suele olvidar restar COALESCE(d.devuelto_usd, 0) además de cp.costo_usd al calcular el numerador de pct_margen_neto_guardia, o filtra status IN ('completed', 'refunded') usando FILTER en unas columnas y no en otras. Recuérdale que WHERE o.status IN ('completed', 'refunded') al nivel de la consulta alinea numerador y denominador.",
};

export default lesson;
