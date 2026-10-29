const lesson = {
  id: 'c0-negocio-04-pregunta-a-decision',
  moduleId: 'c0-negocio',
  tracks: ['core'],
  level: 0,
  order: 4,
  title: 'De la pregunta ambigua a la decisión respaldada por datos',
  minutes: 15,
  prerequisites: ['c0-negocio-03-kpi-metrica-vanidad'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), dirección abre la reunión del lunes con dos frases habituales: "¿Están funcionando nuestros descuentos en el carrito?" y "¿Por qué tenemos tantas devoluciones?". Si respondes volcando veinte tablas sin criterio, nadie sabrá qué cambiar al salir de la sala. ¿Cómo traduces una inquietud vaga en una hipótesis medible con un umbral claro que respalde una decisión concreta?',

  objectives: [
    'Traducir una pregunta de negocio ambigua en una hipótesis refutable con métrica, segmento y periodo explícitos.',
    'Descomponer un problema por dimensiones operativas para aislar su causa y cuantificar su impacto en dólares.',
    'Establecer un umbral de decisión previo a la consulta que conecte el resultado numérico con una acción concreta.'
  ],

  sections: [
    {
      id: 'de-la-duda-vaga-a-la-hipotesis-refutable',
      heading: 'Cómo traducir una pregunta vaga en una hipótesis refutable',
      body: 'En la metodología CRISP-DM, el primer trabajo analítico no es escribir código, sino acotar la pregunta. Frases como "¿Cómo van las ventas?" o "¿Por qué hay devoluciones?" son ambiguas. No especifican qué métrica se mide, en qué corte dimensional ni qué opción operativa está en juego.\n\nPara formular una **hipótesis refutable**, definimos cuatro piezas: la palanca que evaluamos, el segmento donde actúa, la métrica objetivo y el cambio mínimo esperado. Por ejemplo, desglosemos la tabla `refunds` de Mercado Brisa (empresa ficticia) por motivo (`reason`). Los cinco motivos empatan con 290 casos cada uno. Sin embargo, `tueste_incorrecto` lidera la pérdida monetaria con `65 909,73` USD (`227,27` USD por reembolso).',
      example: {
        language: 'sql',
        code: `SELECT
  r.reason AS motivo_devolucion,
  COUNT(r.refund_id) AS casos,
  ROUND(SUM(r.refund_amount_usd), 2) AS impacto_reembolsos_usd,
  ROUND(AVG(r.refund_amount_usd), 2) AS reembolso_medio_usd,
  ROUND(SUM(r.refund_amount_usd) * 100.0 / (SELECT SUM(refund_amount_usd) FROM refunds), 2) AS cuota_impacto_pct
FROM refunds r
GROUP BY r.reason
ORDER BY impacto_reembolsos_usd DESC;`,
        expectedOutput: [
          {
            motivo_devolucion: 'tueste_incorrecto',
            casos: 290,
            impacto_reembolsos_usd: 65909.73,
            reembolso_medio_usd: 227.27,
            cuota_impacto_pct: 20.53
          },
          {
            motivo_devolucion: 'defecto_molino',
            casos: 290,
            impacto_reembolsos_usd: 64052.75,
            reembolso_medio_usd: 220.87,
            cuota_impacto_pct: 19.95
          },
          {
            motivo_devolucion: 'empaque_danado',
            casos: 290,
            impacto_reembolsos_usd: 63971.41,
            reembolso_medio_usd: 220.59,
            cuota_impacto_pct: 19.92
          },
          {
            motivo_devolucion: 'retraso_envio',
            casos: 290,
            impacto_reembolsos_usd: 63895.66,
            reembolso_medio_usd: 220.33,
            cuota_impacto_pct: 19.9
          },
          {
            motivo_devolucion: 'cambio_opinion',
            casos: 290,
            impacto_reembolsos_usd: 63267.7,
            reembolso_medio_usd: 218.16,
            cuota_impacto_pct: 19.7
          }
        ]
      }
    },
    {
      id: 'umbrales-de-decision-antes-de-mirar-el-dato',
      heading: 'Por qué el umbral de decisión se fija antes de ejecutar la consulta',
      body: 'Un error frecuente en los equipos comerciales es mirar primero los números y luego justificar lo que ya tenían decidido. Si el descuento subió el ticket un 1 %, dicen que fue un éxito. Si lo bajó un 3 %, dicen que ayudó a posicionar la marca.\n\nPara evitar ese sesgo, se pacta un **umbral de decisión** (*decision threshold*) antes de consultar la base de datos. Por ejemplo: mantendremos el cupón del 5 % en cabecera solo si los pedidos con descuento generan un margen bruto medio igual o mayor al de los pedidos sin descuento. Si el dato queda por debajo del umbral, la regla dispara la acción acordada: retirar el cupón.'
    },
    {
      id: 'calidad-del-dato-antes-de-decidir',
      heading: 'Verificar la integridad de la muestra antes de recomendar una acción',
      body: 'Una cifra llamativa no basta para decidir si el proceso que generó los datos está sesgado. La tabla `experiments` de Mercado Brisa registra seis pruebas controladas. En `EXP-CHECKOUT-1STEP` (checkout en un paso), los grupos están equilibrados: 800 usuarios en `control` y 800 en `treatment`. Además, el gasto medio posterior sube de `61,49` USD a `68,40` USD.\n\nEn cambio, en `EXP-PUSH-CART` (recordatorio push), el grupo `treatment` parece gastar más (`65,57` USD frente a `59,63` USD). Pero al contar las filas en `experiment_assignments` aparecen 980 usuarios en `control` y solo 620 en `treatment` (`status = \'stopped_srm\'`). Ese desbalance invalida la comparación y obliga a frenar el lanzamiento.'
    }
  ],

  workedExample: {
    title: 'Evaluación de descuentos y experimentos con reglas de decisión explícitas',
    description: 'Contrasta la hipótesis del descuento de cabecera sobre el margen bruto y audita la validez muestral de dos experimentos antes de decidir.',
    steps: [
      {
        label: 'Paso 1 — Hipótesis del descuento: ¿compensa el volumen la caída de margen?',
        explanation: 'Comparamos en los pedidos completados el grupo con descuento de cabecera (`discount_usd > 0`) frente al grupo sin descuento. El descuento no eleva el subtotal medio (`366,18` USD frente a `371,34` USD) y reduce el margen bruto medio en `21,65` USD por pedido (`156,39` USD frente a `178,04` USD).',
        code: `WITH costo_pedido AS (
  SELECT
    oi.order_id,
    SUM(oi.qty * p.unit_cost_usd) AS costo_directo_usd
  FROM order_items oi
  JOIN products p ON oi.product_id = p.product_id
  GROUP BY oi.order_id
)
SELECT
  CASE WHEN o.discount_usd > 0 THEN 'con_descuento_cabecera' ELSE 'sin_descuento_cabecera' END AS grupo_descuento,
  COUNT(o.order_id) AS pedidos_completados,
  ROUND(AVG(o.subtotal_usd), 2) AS subtotal_medio_usd,
  ROUND(AVG(o.subtotal_usd - o.discount_usd), 2) AS ingreso_neto_medio_usd,
  ROUND(AVG(o.subtotal_usd - o.discount_usd - c.costo_directo_usd), 2) AS margen_bruto_medio_usd,
  ROUND(SUM(o.subtotal_usd - o.discount_usd - c.costo_directo_usd) * 100.0 / SUM(o.subtotal_usd - o.discount_usd), 2) AS margen_bruto_pct
FROM orders o
JOIN costo_pedido c ON o.order_id = c.order_id
WHERE o.status = 'completed'
GROUP BY 1
ORDER BY pedidos_completados DESC;`,
        expectedOutput: [
          {
            grupo_descuento: 'sin_descuento_cabecera',
            pedidos_completados: 11496,
            subtotal_medio_usd: 371.34,
            ingreso_neto_medio_usd: 371.34,
            margen_bruto_medio_usd: 178.04,
            margen_bruto_pct: 47.95
          },
          {
            grupo_descuento: 'con_descuento_cabecera',
            pedidos_completados: 3264,
            subtotal_medio_usd: 366.18,
            ingreso_neto_medio_usd: 347.87,
            margen_bruto_medio_usd: 156.39,
            margen_bruto_pct: 44.96
          }
        ]
      },
      {
        label: 'Paso 2 — Auditoría de integridad antes de lanzar un cambio de producto',
        explanation: 'Al evaluar `EXP-CHECKOUT-1STEP` y `EXP-PUSH-CART`, verificamos primero el conteo de `usuarios` por variante. `EXP-CHECKOUT-1STEP` cumple el reparto 800/800 y se aprueba (+6,91 USD por usuario), mientras que `EXP-PUSH-CART` se rechaza por desbalance 980/620.',
        code: `SELECT
  e.experiment_code,
  a.variant,
  COUNT(a.assignment_id) AS usuarios,
  ROUND(AVG(a.pre_experiment_spend_usd), 2) AS gasto_previo_medio_usd,
  ROUND(AVG(a.post_experiment_spend_usd), 2) AS gasto_posterior_medio_usd,
  ROUND(COUNT(*) FILTER (WHERE a.converted) * 100.0 / COUNT(*), 2) AS tasa_conversion_pct
FROM experiments e
JOIN experiment_assignments a ON e.experiment_id = a.experiment_id
WHERE e.experiment_code IN ('EXP-CHECKOUT-1STEP', 'EXP-PUSH-CART')
GROUP BY e.experiment_code, a.variant
ORDER BY e.experiment_code, a.variant;`,
        expectedOutput: [
          {
            experiment_code: 'EXP-CHECKOUT-1STEP',
            variant: 'control',
            usuarios: 800,
            gasto_previo_medio_usd: 72.93,
            gasto_posterior_medio_usd: 61.49,
            tasa_conversion_pct: 99.13
          },
          {
            experiment_code: 'EXP-CHECKOUT-1STEP',
            variant: 'treatment',
            usuarios: 800,
            gasto_previo_medio_usd: 72.97,
            gasto_posterior_medio_usd: 68.4,
            tasa_conversion_pct: 100
          },
          {
            experiment_code: 'EXP-PUSH-CART',
            variant: 'control',
            usuarios: 980,
            gasto_previo_medio_usd: 70.03,
            gasto_posterior_medio_usd: 59.63,
            tasa_conversion_pct: 97.86
          },
          {
            experiment_code: 'EXP-PUSH-CART',
            variant: 'treatment',
            usuarios: 620,
            gasto_previo_medio_usd: 70.21,
            gasto_posterior_medio_usd: 65.57,
            tasa_conversion_pct: 100
          }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: 'La gerencia pregunta: "¿Deberíamos abrir más tiendas físicas el próximo año?". ¿Cuál es la traducción correcta a una pregunta analítica con umbral de decisión?',
      options: [
        {
          id: 'a',
          text: 'Si las tiendas actuales de una región superan el 90 % de su meta mensual con un margen bruto mayor al 45 %, evaluaremos abrir una sucursal adicional en esa región.',
          correct: true,
          feedback: 'Correcto. Define las métricas exactas (cumplimiento de meta y margen bruto), el corte (región) y el umbral cuantitativo que habilita la inversión.'
        },
        {
          id: 'b',
          text: 'Consultar cuántas tiendas existen hoy en la tabla `stores` y mostrar sus nombres en una lista.',
          correct: false,
          feedback: 'Incorrecto. Listar las tiendas actuales describe el catálogo físico, pero no mide su desempeño ni establece ningún criterio para decidir.'
        },
        {
          id: 'c',
          text: 'Sumar las impresiones publicitarias del año pasado para ver si la marca es conocida.',
          correct: false,
          feedback: 'Incorrecto. Las impresiones son una métrica de vanidad publicitaria y no informan la rentabilidad operativa de las tiendas físicas.'
        }
      ],
      explanation: 'Toda decisión requiere traducir la inquietud general en una condición verificable: métrica de desempeño, métrica guardia, segmento y umbral de acción.'
    },
    {
      id: 'c2',
      type: 'predict-output',
      prompt: 'En el análisis de descuentos de Mercado Brisa, los 3 264 pedidos completados con cupón dejaron un margen bruto medio de 156,39 USD frente a los 178,04 USD de los pedidos sin cupón. ¿Cuántos dólares de margen bruto se redujeron en total en esos 3 264 pedidos respecto al promedio sin cupón?',
      options: [
        {
          id: 'a',
          text: '70 665,60 USD (3 264 pedidos multiplicados por la diferencia de 21,65 USD por pedido).',
          correct: true,
          feedback: 'Exacto. Cada pedido con cupón dejó 21,65 USD menos de margen bruto (178,04 - 156,39), lo que multiplicado por 3 264 pedidos suma 70 665,60 USD.'
        },
        {
          id: 'b',
          text: '21,65 USD en total entre todos los pedidos del año.',
          correct: false,
          feedback: 'Incorrecto. 21,65 USD es la erosión promedio en un solo pedido; para dimensionar el impacto total hay que multiplicarlo por los 3 264 pedidos afectados.'
        },
        {
          id: 'c',
          text: '0 USD, porque los descuentos de cabecera no afectan el margen bruto.',
          correct: false,
          feedback: 'Incorrecto. Un descuento reduce directamente el ingreso neto mientras que el costo directo del producto (`unit_cost_usd`) permanece constante.'
        }
      ],
      explanation: 'Cuantificar el impacto total multiplicando la diferencia unitaria (`21,65` USD) por el volumen afectado (`3 264` pedidos) permite a dirección dimensionar la decisión en términos financieros.'
    },
    {
      id: 'c3',
      type: 'mcq',
      prompt: 'Un experimento muestra que la variante nueva sube la conversión un 2 %, pero al revisar los conteos de asignación debía repartir 50 % / 50 % y repartió 980 usuarios a control y 620 a tratamiento (`srm_p_value = 0.0001`). ¿Qué decisión debes tomar?',
      options: [
        {
          id: 'a',
          text: 'Descartar el resultado y no lanzar: el desbalance muestral indica un fallo técnico que invalida la comparación.',
          correct: true,
          feedback: 'Correcto. Cuando falla la asignación aleatoria (Sample Ratio Mismatch), los dos grupos ya no son comparables y el promedio observado está sesgado.'
        },
        {
          id: 'b',
          text: 'Lanzar de inmediato porque el promedio del grupo de tratamiento es más alto.',
          correct: false,
          feedback: 'Incorrecto. Si el grupo de tratamiento perdió a los usuarios con conexiones lentas por un error técnico, su promedio subirá artificialmente.'
        },
        {
          id: 'c',
          text: 'Borrar al azar 360 filas del grupo de control para que ambos queden en 620.',
          correct: false,
          feedback: 'Incorrecto. Recortar filas a posteriori no corrige el sesgo de selección que causó la pérdida de usuarios en el grupo de tratamiento.'
        }
      ],
      explanation: 'Antes de aplicar un umbral de negocio sobre el resultado de una prueba, es obligatorio verificar que los datos de entrada no sufran sesgos de captura o muestreo.'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Priorización de segmentos de clientes por ticket neto y margen bruto',
    language: 'sql',
    prompt: 'Dirección comercial quiere decidir a qué segmento (`c.segment` en `customers`) asignar el equipo de atención personalizada. La regla acordada es priorizar el segmento que supere los 400 USD de ticket neto medio o genere el mayor margen bruto total en pedidos con `o.status = \'completed\'`. Completa la consulta para obtener `pedidos_completados`, `ticket_neto_medio_usd`, `ingreso_neto_usd`, `margen_bruto_usd` y `margen_bruto_pct`, ordenando por `margen_bruto_usd DESC`.',
    starterCode: `WITH costo_pedido AS (
  SELECT
    oi.order_id,
    SUM(oi.qty * p.unit_cost_usd) AS costo_directo_usd
  FROM order_items oi
  JOIN products p ON oi.product_id = p.product_id
  GROUP BY oi.order_id
)
SELECT
  c.segment,
  COUNT(o.order_id) AS pedidos_completados,
  ROUND(AVG(o.subtotal_usd - o.discount_usd), 2) AS ticket_neto_medio_usd,
  ROUND(SUM(o.subtotal_usd - o.discount_usd), 2) AS ingreso_neto_usd,
  -- Calcula margen_bruto_usd sumando (o.subtotal_usd - o.discount_usd - cp.costo_directo_usd) redondeado a 2 decimales
  0.0 AS margen_bruto_usd,
  ROUND(SUM(o.subtotal_usd - o.discount_usd - cp.costo_directo_usd) * 100.0 / SUM(o.subtotal_usd - o.discount_usd), 2) AS margen_bruto_pct
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
JOIN costo_pedido cp ON o.order_id = cp.order_id
WHERE o.status = 'completed'
GROUP BY c.segment
ORDER BY margen_bruto_usd DESC;`,
    expected: `WITH costo_pedido AS (
  SELECT
    oi.order_id,
    SUM(oi.qty * p.unit_cost_usd) AS costo_directo_usd
  FROM order_items oi
  JOIN products p ON oi.product_id = p.product_id
  GROUP BY oi.order_id
)
SELECT
  c.segment,
  COUNT(o.order_id) AS pedidos_completados,
  ROUND(AVG(o.subtotal_usd - o.discount_usd), 2) AS ticket_neto_medio_usd,
  ROUND(SUM(o.subtotal_usd - o.discount_usd), 2) AS ingreso_neto_usd,
  ROUND(SUM(o.subtotal_usd - o.discount_usd - cp.costo_directo_usd), 2) AS margen_bruto_usd,
  ROUND(SUM(o.subtotal_usd - o.discount_usd - cp.costo_directo_usd) * 100.0 / SUM(o.subtotal_usd - o.discount_usd), 2) AS margen_bruto_pct
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
JOIN costo_pedido cp ON o.order_id = cp.order_id
WHERE o.status = 'completed'
GROUP BY c.segment
ORDER BY margen_bruto_usd DESC;`,
    orderMatters: true,
    hints: [
      'La CTE `costo_pedido` ya entrega el costo directo (`cp.costo_directo_usd`) pre-agregado a nivel de `order_id`.',
      'El margen bruto de cada pedido es `o.subtotal_usd - o.discount_usd - cp.costo_directo_usd`.',
      'Escribe `ROUND(SUM(o.subtotal_usd - o.discount_usd - cp.costo_directo_usd), 2) AS margen_bruto_usd`.'
    ],
    solution: `WITH costo_pedido AS (
  SELECT
    oi.order_id,
    SUM(oi.qty * p.unit_cost_usd) AS costo_directo_usd
  FROM order_items oi
  JOIN products p ON oi.product_id = p.product_id
  GROUP BY oi.order_id
)
SELECT
  c.segment,
  COUNT(o.order_id) AS pedidos_completados,
  ROUND(AVG(o.subtotal_usd - o.discount_usd), 2) AS ticket_neto_medio_usd,
  ROUND(SUM(o.subtotal_usd - o.discount_usd), 2) AS ingreso_neto_usd,
  ROUND(SUM(o.subtotal_usd - o.discount_usd - cp.costo_directo_usd), 2) AS margen_bruto_usd,
  ROUND(SUM(o.subtotal_usd - o.discount_usd - cp.costo_directo_usd) * 100.0 / SUM(o.subtotal_usd - o.discount_usd), 2) AS margen_bruto_pct
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
JOIN costo_pedido cp ON o.order_id = cp.order_id
WHERE o.status = 'completed'
GROUP BY c.segment
ORDER BY margen_bruto_usd DESC;`,
    solutionExplanation: 'El resultado separa dos decisiones: `pro_barista` aporta el mayor volumen total de margen bruto (`1 025 160,50` USD en 6 229 pedidos), mientras que `cafeteria_b2b` es el único segmento que supera el umbral de 400 USD por pedido (`439,05` USD de ticket neto medio), justificando atención ejecutiva dedicada por cuenta.',
    expectedOutputTable: [
      {
        segment: 'pro_barista',
        pedidos_completados: 6229,
        ticket_neto_medio_usd: 347.75,
        ingreso_neto_usd: 2166164.59,
        margen_bruto_usd: 1025160.5,
        margen_bruto_pct: 47.33
      },
      {
        segment: 'retail',
        pedidos_completados: 5940,
        ticket_neto_medio_usd: 353.65,
        ingreso_neto_usd: 2100652.05,
        margen_bruto_usd: 993539.89,
        margen_bruto_pct: 47.3
      },
      {
        segment: 'cafeteria_b2b',
        pedidos_completados: 2591,
        ticket_neto_medio_usd: 439.05,
        ingreso_neto_usd: 1137573.13,
        margen_bruto_usd: 538527.07,
        margen_bruto_pct: 47.34
      }
    ]
  },

  roleNotes: {
    de: 'Expón en las tablas analíticas las banderas de integridad (`status`, `srm_p_value`, fecha de actualización) para que nadie tome decisiones de negocio sobre experimentos detenidos o cargas incompletas.',
    da: 'Antes de abrir el editor SQL, escribe en una línea la hipótesis y el umbral que cambiará la recomendación. Cuando entregues el resultado, traduce la diferencia porcentual a dólares totales de impacto.',
    bi: 'Organiza los tableros de arriba abajo siguiendo el flujo de decisión: primero el KPI frente a su umbral, al lado la métrica guardia de calidad y debajo el desglose dimensional que explica la variación.'
  },

  summary: [
    'Una pregunta ambigua debe traducirse en una hipótesis con métrica, corte dimensional y periodo.',
    'El umbral de decisión se acuerda antes de consultar los datos para evitar justificaciones a posteriori.',
    'Cuantificar el impacto en dólares totales dimensiona la prioridad real de cada hallazgo.',
    'Ninguna decisión es válida si la muestra presenta fallos de integridad o sesgos de asignación.'
  ],

  flashcards: [
    {
      id: 'fc-c0-negocio-04-a',
      front: '¿Qué elementos convierten una pregunta ambigua de negocio en una hipótesis refutable?',
      back: 'La palanca o causa evaluada, el segmento dimensional, la métrica objetivo con su métrica guardia y el umbral numérico esperado.'
    },
    {
      id: 'fc-c0-negocio-04-b',
      front: '¿Por qué es obligatorio fijar el umbral de decisión antes de ejecutar la consulta o el experimento?',
      back: 'Porque evita cambiar el criterio a conveniencia tras ver los resultados (sesgo de confirmación) y vincula cada resultado con una acción clara.'
    },
    {
      id: 'fc-c0-negocio-04-c',
      front: '¿Por qué no se debe aprobar un experimento con sesgo SRM (Sample Ratio Mismatch) aunque su métrica principal suba?',
      back: 'Porque la diferencia de tamaño entre control y tratamiento demuestra que los grupos no son comparables y el resultado está contaminado por sesgo de selección.'
    }
  ],

  glossaryTerms: [
    'hipotesis-refutable',
    'umbral-decision',
    'metrica-guardia'
  ],

  sources: [
    {
      title: 'CRISP-DM 1.0 Guide — Phase 1: Business Understanding',
      url: 'https://www.ibm.com/docs/en/spss-modeler/saas?topic=dm-crisp-help-overview',
      publisher: 'IBM Documentation / CRISP-DM Consortium',
      accessed: '2026-10-29',
      supports: 'Conversión de objetivos empresariales en definiciones de problemas analíticos y criterios de éxito medibles.'
    },
    {
      title: 'Trustworthy Online Controlled Experiments: A Practical Guide to A/B Testing',
      url: 'https://experimentguide.com/',
      publisher: 'Cambridge University Press (Kohavi, Tang & Xu)',
      accessed: '2026-10-29',
      supports: 'Reglas de decisión previas, validación de proporción muestral (SRM) y cuantificación de impacto.'
    },
    {
      title: 'Dimensional Modeling Techniques — Business Process, Grain & Bus Matrix',
      url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/',
      publisher: 'Kimball Group',
      accessed: '2026-10-29',
      supports: 'Descomposición de procesos de negocio por dimensiones de análisis (segmento, categoría, tienda y motivo).'
    }
  ],

  aiNotes: 'El error típico al responder a dirección es quedarse en el promedio general sin desglosar por segmento (`cafeteria_b2b` frente a `retail`), o dar por válido un resultado sin comprobar antes si la muestra está truncada o tiene sesgo SRM (`EXP-PUSH-CART`).'
};

export default lesson;
