export default {
  id: 'bi3-gobierno-03-certificacion-metricas-obsolescencia',
  moduleId: 'bi3-gobierno',
  tracks: ['bi'],
  level: 3,
  order: 3,
  title: 'Certificación de métricas, propiedad y obsolescencia',
  subtitle: 'Proceso de certificación de métricas, propiedad funcional y control de obsolescencia',
  minutes: 20,
  contentVersion: 1,
  prerequisites: [
    'bi3-gobierno-02-rls-estatica-dinamica-columnas'
  ],
  hook: 'En la junta mensual de Mercado Brisa, el área de Marketing presenta ingresos en la región Andina por 2 434 901.41 USD usando la métrica heredada `v1_gross_revenue`. Sin embargo, Finanzas reporta 1 875 174.89 USD con la métrica auditada `v2_certified_net_revenue`: una sobreestimación de 559 726.52 USD (29.85 %) causada por incluir pedidos cancelados, pendientes y devueltos. ¿Cómo se estructura un proceso formal de certificación, propiedad funcional y retiro controlado (`deprecation`) para erradicar métricas contradictorias sin romper los paneles en producción?',
  objectives: [
    'Distinguir los niveles de respaldo institucional (`Promoted` frente a `Certified`) y separar las responsabilidades del propietario funcional (*Data Steward*) y del propietario técnico.',
    'Aplicar contratos de versionado semántico (`v1` a `v2`), fechas de obsolescencia (`deprecation_date`) y registro de dependencias (`exposures`) para evolucionar métricas sin rupturas silenciosas.',
    'Cuantificar en SQL sobre Mercado Brisa la deriva porcentual (`drift_pct`) entre una métrica heredada no certificada y la métrica certificada de ingreso neto por región.'
  ],
  sections: [
    {
      id: 'respaldo-promoted-vs-certified-propiedad',
      heading: 'Niveles de respaldo (Promoted vs Certified) y propiedad dual',
      body: 'Cuando decenas de analistas publican modelos en un catálogo compartido, los directivos no pueden distinguir qué cifra es un borrador departamental y cuál es el indicador oficial. Las plataformas modernas de BI, como Microsoft Fabric, Power BI y dbt, resuelven esta ambigüedad mediante un esquema de respaldo (`endorsement`) de dos niveles.\n\nEl nivel **Promoted** (promocionado) es autodeclarado por el autor del modelo para indicar que el activo está listo para compartirse con su equipo. En cambio, el nivel **Certified** (certificado) está restringido por el administrador a un comité revisor autorizado. Obtener este sello exige superar una auditoría técnica y funcional.\n\nPara alcanzar el estado `Certified`, toda métrica requiere **propiedad dual**. El **propietario funcional** (*Data Steward*, como la Dirección de Contabilidad en Mercado Brisa) define y firma la regla de negocio. Es quien decide qué estados de `orders.status` computan como venta real y cómo se restan las devoluciones de `refunds`. Por su parte, el **propietario técnico** (*Analytics Engineer* o *BI Specialist*) codifica la fórmula en la capa semántica, automatiza las pruebas de integridad y mantiene el acuerdo de nivel de servicio (SLA).',
      example: {
        language: 'sql',
        code: `SELECT
  status,
  COUNT(order_id) AS order_count,
  ROUND(SUM(total_usd), 2) AS gross_amount_usd
FROM orders
GROUP BY status
ORDER BY gross_amount_usd DESC;`,
        expectedOutput: [
          { status: 'completed', order_count: 14760, gross_amount_usd: 6269462.42 },
          { status: 'refunded', order_count: 1440, gross_amount_usd: 605025.58 },
          { status: 'cancelled', order_count: 1080, gross_amount_usd: 489003.49 },
          { status: 'pending', order_count: 720, gross_amount_usd: 306326.28 }
        ]
      }
    },
    {
      id: 'versionado-contratos-deprecation',
      heading: 'Control de obsolescencia: versionado, deprecation_date y exposures',
      body: '¿Qué sucede cuando el comité de gobierno detecta que una métrica utilizada en veinte informes (`v1_gross_revenue`) tiene una definición defectuosa? Modificar en caliente su fórmula o borrarla de inmediato rompe los paneles en producción. También altera retroactivamente las cifras que otros departamentos comparaban semana tras semana.\n\nEl control de obsolescencia aplica **versionado explícito** (`v1` y `v2`) con una ventana de coexistencia. En `dbt` y capas semánticas declarativas, el equipo publica la versión certificada (`v2`) con `access: public`. Al mismo tiempo, asigna a la versión antigua (`v1`) una fecha de retiro (`deprecation_date`) y registra los tableros consumidores como artefactos `exposures`.\n\nDurante la ventana de migración, ambas versiones coexisten en el catálogo. El sistema emite alertas automáticas en cada compilación para los responsables listados en los bloques `exposures` que aún dependen de `v1`. Solo cuando el linaje confirma cero consultas activas hacia `v1` después de la `deprecation_date`, la métrica obsoleta se elimina definitivamente.',
      example: {
        language: 'yaml',
        code: `models:
  - name: fct_regional_revenue
    latest_version: 2
    access: public
    config:
      contract: { enforced: true }
    versions:
      - v: 1
        deprecation_date: 2026-12-01 00:00:00.00+00:00
      - v: 2

exposures:
  - name: dashboard_comite_ejecutivo
    type: dashboard
    maturity: high
    owner:
      name: Dirección de Finanzas
      email: finanzas@mercadobrisa.com
    depends_on:
      - ref('fct_regional_revenue', v=2)
      - metric('certified_v2_net_usd')`
      }
    },
    {
      id: 'auditoria-deriva-metrica',
      heading: 'Auditoría cuantitativa de deriva entre métrica heredada y certificada',
      body: 'Para migrar los tableros desde la métrica obsoleta (`v1`) hacia la métrica certificada (`v2`), el especialista de BI debe presentar una **auditoría de deriva (`metric drift`)**. Este informe cuantifica exactamente cuánto dinero se estaba reportando de más o de menos.\n\nEn Mercado Brisa, la métrica heredada `legacy_v1_revenue_usd` sumaba `orders.total_usd` sobre todos los registros de `orders` sin filtrar el estado ni restar devoluciones. En cambio, el contrato certificado `certified_v2_net_usd` exige dos reglas estrictas. Primero, incluir únicamente pedidos con `o.status = \'completed\'`. Segundo, descontar el monto de las devoluciones procesadas (`r.status = \'processed\'`) preagregadas por `order_id` usando `COALESCE(pr.refund_usd, 0)`.\n\nAl comparar ambas definiciones por `stores.region`, comprobamos que la versión no certificada sobreestima los ingresos entre un 26.52 % en Iberia y un 29.85 % en Andina. En Andina, la brecha alcanza los 559 726.52 USD. Documentar esta discrepancia justifica el retiro de `v1` y protege la toma de decisiones financieras.',
      example: {
        language: 'sql',
        code: `WITH processed_refunds AS (
  SELECT order_id, SUM(refund_amount_usd) AS refund_usd
  FROM refunds
  WHERE status = 'processed'
  GROUP BY order_id
)
SELECT
  COUNT(o.order_id) AS total_orders_all_status,
  ROUND(SUM(o.total_usd), 2) AS legacy_v1_revenue_usd,
  ROUND(SUM(CASE WHEN o.status = 'completed' THEN o.total_usd - COALESCE(pr.refund_usd, 0) ELSE 0 END), 2) AS certified_v2_net_usd
FROM orders o
LEFT JOIN processed_refunds pr ON o.order_id = pr.order_id;`
      }
    }
  ],
  workedExample: {
    title: 'Auditoría de deriva regional para la migración de v1 a v2 en Mercado Brisa',
    description: 'El Comité de Gobierno de Datos solicita el informe oficial de discrepancia regional entre `legacy_v1_revenue_usd` y `certified_v2_net_usd` antes de desactivar la versión 1 del modelo semántico.',
    steps: [
      {
        label: 'Paso 1: Preagregación de devoluciones procesadas por pedido',
        explanation: 'Preagregamos las devoluciones con `status = \'processed\'` al grano de `order_id` en la CTE `processed_refunds` para garantizar una relación 1:1 al cruzar con `orders`.',
        code: `SELECT
  COUNT(*) AS refund_rows,
  COUNT(DISTINCT order_id) AS refunded_orders,
  ROUND(SUM(refund_amount_usd), 2) AS total_processed_refunds_usd
FROM refunds
WHERE status = 'processed';`,
        expectedOutput: [
          {
            refund_rows: 1450,
            refunded_orders: 1150,
            total_processed_refunds_usd: 321097.25
          }
        ]
      },
      {
        label: 'Paso 2: Cálculo de discrepancia en USD y porcentaje de deriva por región',
        explanation: 'Unimos `stores` con `orders` y hacemos `LEFT JOIN` hacia `processed_refunds`. Calculamos por región ambas versiones, la diferencia absoluta (`discrepancy_usd`) y el porcentaje de deriva (`drift_pct`) respecto a la métrica certificada.',
        code: `WITH processed_refunds AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS refund_usd
  FROM refunds
  WHERE status = 'processed'
  GROUP BY order_id
),
metric_audit AS (
  SELECT
    s.region,
    ROUND(SUM(o.total_usd), 2) AS legacy_v1_revenue_usd,
    ROUND(SUM(CASE WHEN o.status = 'completed' THEN o.total_usd - COALESCE(pr.refund_usd, 0) ELSE 0 END), 2) AS certified_v2_net_usd
  FROM stores s
  JOIN orders o ON s.store_id = o.store_id
  LEFT JOIN processed_refunds pr ON o.order_id = pr.order_id
  GROUP BY s.region
)
SELECT
  region,
  legacy_v1_revenue_usd,
  certified_v2_net_usd,
  ROUND(legacy_v1_revenue_usd - certified_v2_net_usd, 2) AS discrepancy_usd,
  ROUND(100.0 * (legacy_v1_revenue_usd - certified_v2_net_usd) / certified_v2_net_usd, 2) AS drift_pct
FROM metric_audit
ORDER BY drift_pct DESC;`,
        expectedOutput: [
          {
            region: 'Andina',
            legacy_v1_revenue_usd: 2434901.41,
            certified_v2_net_usd: 1875174.89,
            discrepancy_usd: 559726.52,
            drift_pct: 29.85
          },
          {
            region: 'Norteamérica',
            legacy_v1_revenue_usd: 1066582.42,
            certified_v2_net_usd: 832759.7,
            discrepancy_usd: 233822.72,
            drift_pct: 28.08
          },
          {
            region: 'Cono Sur',
            legacy_v1_revenue_usd: 2517001.37,
            certified_v2_net_usd: 1981794.57,
            discrepancy_usd: 535206.8,
            drift_pct: 27.01
          },
          {
            region: 'Iberia',
            legacy_v1_revenue_usd: 1651332.57,
            certified_v2_net_usd: 1305198.74,
            discrepancy_usd: 346133.83,
            drift_pct: 26.52
          }
        ]
      }
    ],
    audit: 'La auditoría cuantitativa demuestra que mantener activa la métrica no certificada distorsiona el ingreso regional en más de un 26 %, justificando técnicamente la migración obligatoria hacia la versión 2.'
  },
  checks: [
    {
      id: 'chk-bi3-gob-03-endorsement',
      type: 'mcq',
      prompt: 'En el marco de gobierno de Microsoft Fabric / Power BI, ¿cuál es la diferencia entre el sello `Promoted` y el sello `Certified` sobre un modelo semántico?',
      options: [
        {
          id: 'a',
          text: '`Promoted` habilita el modo Direct Lake automáticamente, mientras que `Certified` obliga a usar modo Import.',
          correct: false,
          feedback: 'Incorrecto. Los niveles de respaldo (`endorsement`) son metadatos de gobierno y confianza; no alteran el modo técnico de almacenamiento.'
        },
        {
          id: 'b',
          text: '`Promoted` puede asignarlo cualquier autor con permisos de escritura para destacar su trabajo, mientras que `Certified` requiere aprobación de revisores designados por el administrador tras auditar calidad y propiedad.',
          correct: true,
          feedback: 'Correcto. La certificación está restringida a un grupo autorizado de custodios de gobierno e implica estándares auditados de definición, pruebas y propietario.'
        },
        {
          id: 'c',
          text: '`Certified` impide agregar nuevas medidas al modelo semántico de forma permanente.',
          correct: false,
          feedback: 'Incorrecto. Un modelo certificado puede evolucionar manteniendo su proceso de revisión y control de versiones.'
        }
      ],
      explanation: 'El nivel `Promoted` es autogestionado por los creadores, mientras que `Certified` es un sello institucional restringido a revisores autorizados tras verificar la calidad del activo.'
    },
    {
      id: 'chk-bi3-gob-03-steward',
      type: 'mcq',
      prompt: 'Durante la certificación de la métrica `certified_v2_net_usd` en Mercado Brisa surge la duda de si los gastos de envío (`shipping_usd`) deben incluirse o excluirse del ingreso neto. ¿A qué rol corresponde tomar y firmar esa decisión?',
      options: [
        {
          id: 'a',
          text: 'Al administrador de infraestructura cloud que gestiona los permisos del almacén.',
          correct: false,
          feedback: 'Incorrecto. El administrador de infraestructura gestiona cómputo y red, no la semántica contable del negocio.'
        },
        {
          id: 'b',
          text: 'Al propietario funcional (Data Steward del dominio de Finanzas), en coordinación con el propietario técnico que la codifica en la capa semántica.',
          correct: true,
          feedback: 'Correcto. El propietario funcional del dominio posee la autoridad sobre la definición de negocio, mientras que el propietario técnico garantiza su implementación exacta.'
        },
        {
          id: 'c',
          text: 'A cada diseñador de informes de forma independiente según la preferencia de su departamento.',
          correct: false,
          feedback: 'Incorrecto. Permitir que cada informe decida su propia regla destruye la fuente única de verdad y reintroduce métricas contradictorias.'
        }
      ],
      explanation: 'La definición semántica de una métrica corporativa es responsabilidad del propietario funcional (*Data Steward*) del dominio correspondiente, y su codificación verificada recae en el propietario técnico.'
    },
    {
      id: 'chk-bi3-gob-03-lifecycle',
      type: 'fill-code',
      prompt: 'Completa el flujo de retiro controlado de una métrica en dbt cuando su definición cambia de forma incompatible.',
      template: 'Para retirar una métrica sin causar fallos inmediatos, se publica una nueva versión (`v: 2`), se asigna una fecha límite en la propiedad `{{blank1}}` de la versión anterior (`v: 1`) y se auditan los tableros afectados declarados como `{{blank2}}` verificando el contacto de su `{{blank3}}`.',
      blanks: [
        {
          id: 'blank1',
          accepted: ['deprecation_date']
        },
        {
          id: 'blank2',
          accepted: ['exposures', 'exposure']
        },
        {
          id: 'blank3',
          accepted: ['owner', 'propietario']
        }
      ],
      explanation: 'En dbt, `deprecation_date` establece el fin de soporte de una versión y los bloques `exposures` con su `owner` permiten rastrear y avisar a los paneles dependientes antes de eliminar `v1`.'
    }
  ],
  practice: {
    type: 'sql',
    title: 'Auditoría de deriva entre métrica heredada (v1) y métrica certificada (v2)',
    prompt: 'El código inicial calcula únicamente la métrica heredada `legacy_v1_revenue_usd` (`SUM(o.total_usd)` sobre todos los pedidos) y asigna `0` a la métrica certificada. Completa la consulta para auditar por `region`: 1) `legacy_v1_revenue_usd`, 2) `certified_v2_net_usd` (suma de `o.total_usd - COALESCE(pr.refund_usd, 0)` exclusivamente para pedidos con `o.status = \'completed\'`, donde `pr.refund_usd` suma las devoluciones con `status = \'processed\'` por `order_id`), 3) `discrepancy_usd` (`legacy_v1_revenue_usd - certified_v2_net_usd`, redondeado a 2 decimales) y 4) `drift_pct` (`100.0 * (legacy_v1_revenue_usd - certified_v2_net_usd) / certified_v2_net_usd`, redondeado a 2 decimales). Ordena el resultado por `drift_pct DESC`.',
    starterCode: `-- Completa la CTE de devoluciones procesadas y el cálculo de certified_v2_net_usd, discrepancy_usd y drift_pct
SELECT
  s.region,
  ROUND(SUM(o.total_usd), 2) AS legacy_v1_revenue_usd,
  0.00 AS certified_v2_net_usd,
  0.00 AS discrepancy_usd,
  0.00 AS drift_pct
FROM stores s
JOIN orders o ON s.store_id = o.store_id
GROUP BY s.region
ORDER BY drift_pct DESC;`,
    solution: `WITH processed_refunds AS (
  SELECT
    order_id,
    SUM(refund_amount_usd) AS refund_usd
  FROM refunds
  WHERE status = 'processed'
  GROUP BY order_id
),
metric_audit AS (
  SELECT
    s.region,
    ROUND(SUM(o.total_usd), 2) AS legacy_v1_revenue_usd,
    ROUND(SUM(CASE WHEN o.status = 'completed' THEN o.total_usd - COALESCE(pr.refund_usd, 0) ELSE 0 END), 2) AS certified_v2_net_usd
  FROM stores s
  JOIN orders o ON s.store_id = o.store_id
  LEFT JOIN processed_refunds pr ON o.order_id = pr.order_id
  GROUP BY s.region
)
SELECT
  region,
  legacy_v1_revenue_usd,
  certified_v2_net_usd,
  ROUND(legacy_v1_revenue_usd - certified_v2_net_usd, 2) AS discrepancy_usd,
  ROUND(100.0 * (legacy_v1_revenue_usd - certified_v2_net_usd) / certified_v2_net_usd, 2) AS drift_pct
FROM metric_audit
ORDER BY drift_pct DESC;`,
    solutionExplanation: 'Se preagregan las devoluciones procesadas por order_id en processed_refunds y se evalúa en paralelo la suma total sin filtro (v1) frente a la suma condicional de pedidos completados netos de devolución (v2), calculando la brecha en USD y el porcentaje de deriva sobre la base certificada.',
    expectedOutputTable: [
      {
        region: 'Andina',
        legacy_v1_revenue_usd: 2434901.41,
        certified_v2_net_usd: 1875174.89,
        discrepancy_usd: 559726.52,
        drift_pct: 29.85
      },
      {
        region: 'Norteamérica',
        legacy_v1_revenue_usd: 1066582.42,
        certified_v2_net_usd: 832759.7,
        discrepancy_usd: 233822.72,
        drift_pct: 28.08
      },
      {
        region: 'Cono Sur',
        legacy_v1_revenue_usd: 2517001.37,
        certified_v2_net_usd: 1981794.57,
        discrepancy_usd: 535206.8,
        drift_pct: 27.01
      },
      {
        region: 'Iberia',
        legacy_v1_revenue_usd: 1651332.57,
        certified_v2_net_usd: 1305198.74,
        discrepancy_usd: 346133.83,
        drift_pct: 26.52
      }
    ],
    hints: [
      'Crea una CTE `processed_refunds` que agrupe `refunds` por `order_id` filtrando `WHERE status = \'processed\'` y sumando `refund_amount_usd AS refund_usd`.',
      'Haz `LEFT JOIN processed_refunds pr ON o.order_id = pr.order_id` y calcula `certified_v2_net_usd` con `ROUND(SUM(CASE WHEN o.status = \'completed\' THEN o.total_usd - COALESCE(pr.refund_usd, 0) ELSE 0 END), 2)`.',
      'Calcula `drift_pct` dividiendo `(legacy_v1_revenue_usd - certified_v2_net_usd)` entre `certified_v2_net_usd` (no entre `legacy_v1_revenue_usd`), multiplicando por `100.0` y redondeando a 2 decimales.'
    ]
  },
  roleNotes: {
    de: 'Como Data Engineer, automatiza en CI/CD la validación de contratos (`contract: { enforced: true }`) y bloquea la eliminación física de columnas o modelos cuya `deprecation_date` aún no se haya cumplido o que mantengan `exposures` activas.',
    da: 'Como Data Analyst, prioriza siempre el uso de conjuntos de datos y métricas con el distintivo `Certified` para informes interdepartamentales, y actualiza tus consultas tan pronto como aparezca un aviso de obsolescencia (`deprecation_date`) en el catálogo.',
    bi: 'Como BI Specialist, lidera el comité de certificación documentando la matriz de propiedad funcional y técnica de cada KPI y publicando tablas de reconciliación cuando una métrica evoluciona de `v1` a `v2`.'
  },
  summary: [
    'El respaldo `Promoted` es autodeclarado por el autor, mientras que `Certified` exige una auditoría formal por revisores autorizados.',
    'Toda métrica certificada requiere un propietario funcional (*Data Steward*) y un propietario técnico responsable del pipeline.',
    'Los cambios incompatibles se gestionan mediante versionado (`v1` a `v2`), `deprecation_date` y trazabilidad de `exposures`.',
    'Auditar cuantitativamente la deriva (`drift_pct`) entre versiones demuestra el impacto financiero de las definiciones obsoletas.'
  ],
  flashcards: [
    {
      id: 'fc-bi3-gob-03-01',
      front: '¿Qué diferencia de responsabilidades existe entre el propietario funcional (*Data Steward*) y el propietario técnico de una métrica certificada?',
      back: 'El propietario funcional define y aprueba la regla de negocio (qué eventos e importes entran o salen de la fórmula), mientras que el propietario técnico codifica el modelo semántico, automatiza los tests de calidad y mantiene el SLA de actualización.'
    },
    {
      id: 'fc-bi3-gob-03-02',
      front: '¿Por qué no se debe sobrescribir en caliente la fórmula de una métrica pública cuando cambia una regla contable?',
      back: 'Porque altera sin previo aviso las cifras históricas de los paneles existentes y rompe la comparabilidad; debe publicarse una versión `v2` y fijar una `deprecation_date` sobre `v1`.'
    },
    {
      id: 'fc-bi3-gob-03-03',
      front: '¿Para qué sirve declarar recursos `exposures` en dbt dentro del gobierno de métricas?',
      back: 'Permite registrar en el grafo de linaje qué paneles ejecutivos, informes o aplicaciones dependen de cada métrica y quién es su propietario (`owner`) para notificarles antes de retirar una versión obsoleta.'
    }
  ],
  glossaryTerms: [
    'certificacion-metricas-endorsement',
    'deprecacion-versionado-metricas'
  ],
  sources: [
    {
      title: 'Microsoft Learn — Endorsement: Promoting and certifying Fabric and Power BI content',
      url: 'https://learn.microsoft.com/en-us/fabric/governance/endorsement-overview',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Diferencia institucional entre activos Promoted y Certified y requisitos de autorización en el catálogo.'
    },
    {
      title: 'dbt Documentation — About model governance',
      url: 'https://docs.getdbt.com/docs/mesh/govern/about-model-governance',
      publisher: 'dbt Labs',
      accessed: '2026-10-29',
      supports: 'Contratos de modelos, niveles de acceso y gobernanza de activos analíticos compartidos.'
    },
    {
      title: 'dbt Documentation — Model versions and deprecation',
      url: 'https://docs.getdbt.com/docs/mesh/govern/model-versions',
      publisher: 'dbt Labs',
      accessed: '2026-10-29',
      supports: 'Versionado v1/v2 y configuración de deprecation_date para gestionar el ciclo de vida sin rupturas.'
    },
    {
      title: 'dbt Documentation — Exposures',
      url: 'https://docs.getdbt.com/docs/build/exposures',
      publisher: 'dbt Labs',
      accessed: '2026-10-29',
      supports: 'Declaración de paneles aguas abajo, nivel de madurez (maturity) y propietario (owner) para análisis de impacto.'
    }
  ],
  aiNotes: 'Presta atención a dos errores clásicos del estudiante en la práctica SQL: 1) poner `WHERE o.status = \'completed\'` en la cláusula `WHERE` global de `metric_audit`, lo cual filtraría también `legacy_v1_revenue_usd` e impediría medir la deriva real, y 2) dividir entre `legacy_v1_revenue_usd` en lugar de `certified_v2_net_usd` al calcular `drift_pct` o restar `pr.refund_usd` sin `COALESCE`.'
};
