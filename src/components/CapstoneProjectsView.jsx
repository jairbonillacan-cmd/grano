import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  Callout,
  Card,
  Chip,
  Illustration,
  ProgressBar,
  getStageNumber,
  getStageTheme,
} from './ui/index.js';

export const CAPSTONE_PROJECTS = [
  {
    id: 'capstone-1',
    number: 1,
    title:
      'Proyecto 1: arquitectura de suscripciones, SCD tipo 2 y retención por cohortes',
    subtitle:
      'Resuelve la discrepancia de ingresos recurrentes (MRR) entre Finanzas y Producto construyendo un modelo dimensional histórico y un análisis de retención neta libre de fan-out.',
    estimatedTime: '6 a 8 horas',
    difficulty: 'Nivel Fundacional Integrado',
    stackTags: ['PostgreSQL / DuckDB', 'Star Schema SCD2', 'Cohortes y NDR', 'Dashboard Ejecutivo'],
    requiredLessons: [
      { id: 'l1-joins-fanout', order: 1, title: 'Granularidad y el fan-out en JOINs' },
      { id: 'l2-window-functions', order: 2, title: 'Window functions, particiones y cláusula QUALIFY' },
      { id: 'l5-scd2-history', order: 5, title: 'Dimensiones cambiantes SCD tipo 2' },
      { id: 'l13-cohorts-retention-ltv', order: 13, title: 'Cohortes de retención, supervivencia y LTV' },
    ],
    businessBrief: {
      company: 'FinPulse Cloud (SaaS B2B de Facturación y Pagos)',
      problem:
        'El Comité de Dirección detectó una discrepancia del 18.4% en el MRR (Monthly Recurring Revenue) reportado por Finanzas frente al equipo de Producto. Al auditar las consultas actuales, descubres tres fallos estructurales: (1) un JOIN directo entre subscriptions (1 fila por suscripción) e invoice_line_items (N ítems por factura) que triplica el monto de los clientes con complementos; (2) cuando un cliente hace upgrade de Plan Básico ($99) a Enterprise ($499), la tabla de suscripciones sobrescribe el plan anterior, atribuyendo erróneamente los pagos históricos de hace un año al plan Enterprise; y (3) la tasa de retención se calcula dividiendo usuarios activos totales entre registros acumulados, ocultando una caída severa en la cohorte del último trimestre.',
      objective:
        'Diseñar e implementar la tubería analítica completa: desde la pre-agregación SQL al grano exacto y la dimensión histórica SCD Tipo 2, hasta la matriz de retención neta de dólares (NDR) por cohorte de adquisición y la especificación del tablero ejecutivo.',
      deliverables: [
        'Modelo físico Star Schema con tabla de hechos mensual (fct_mrr_monthly) y dimensión histórica de clientes/planes (dim_subscription_scd2).',
        'Consulta SQL analítica que calcula New MRR, Expansion, Contraction, Churn y Net Dollar Retention (NDR) por cohorte sin fan-out.',
        'Especificación de jerarquía visual para el Dashboard de Cohortes y Cascada de MRR.',
      ],
    },
    architectureFlow: [
      {
        stage: 'Fuentes Transaccionales (OLTP)',
        tech: 'raw.subscriptions · raw.invoices · raw.invoice_items',
        detail: 'Eventos de cobro, descuentos y cambios de plan con diferentes granos.',
        role: 'DE',
      },
      {
        stage: 'Modelo Dimensional Star Schema',
        tech: 'dim_subscription_scd2 + fct_subscription_mrr',
        detail: 'Grano 1 fila por suscripción-mes cruzado por vigencia temporal exacta.',
        role: 'DE',
      },
      {
        stage: 'Motor Analítico de Cohortes',
        tech: 'Funciones de Ventana (FIRST_VALUE, LAG)',
        detail: 'Matriz de supervivencia y descomposición de NDR (Expansión vs. Churn).',
        role: 'DA',
      },
      {
        stage: 'Tablero Ejecutivo de Retención',
        tech: 'Heatmap Triangular + Cascada MRR',
        detail: 'Lectura en 5 segundos con metas explícitas y alertas por cohorte.',
        role: 'BI',
      },
    ],
    triadBreakdown: {
      DE: {
        title: 'Ingeniería de Datos (DE): Control de Grano e Historización SCD2',
        responsibilities: [
          'Aislar y pre-agregar raw.invoice_items en una CTE al grano (invoice_id, billing_month) antes de unir con suscripciones para eliminar el fan-out 1:N.',
          'Construir dim_subscription_scd2 con claves subrogadas (subscription_sk), marcas valid_from, valid_to e is_current para preservar cada cambio de plan y precio.',
          'Garantizar idempotencia en la carga mensual de fct_subscription_mrr validando que SUM(net_mrr_usd) cuadre al centavo con el libro mayor contable.',
        ],
      },
      DA: {
        title: 'Análisis y Estadística (DA): Cohortes Reales y Descomposición de MRR',
        responsibilities: [
          'Asignar a cada cliente su cohorte inmutable de primera factura pagada usando MIN(billing_month) OVER (PARTITION BY customer_id).',
          'Clasificar la variación mensual de cada cliente con LAG(net_mrr_usd) en cuatro estados mutuamente excluyentes: Nuevo, Expansión, Contracción y Churn.',
          'Separar cohortes maduras (con al menos 6 meses de ventana de observación) de cohortes recientes para evitar sesgo de censura por la derecha.',
        ],
      },
      BI: {
        title: 'Business Intelligence (BI): Diseño Ejecutivo Anti-Slop',
        responsibilities: [
          'Presentar en el nivel superior el NDR global (ej. 108.4% vs. meta 105.0%) acompañado de un gráfico de cascada (Waterfall) que explique el flujo neto del mes.',
          'Representar la retención por cohorte mediante una matriz triangular con escala secuencial sobria, destacando en color semántico únicamente las celdas bajo el umbral crítico.',
          'Documentar en el catálogo semántico la diferencia entre Gross Revenue Retention (tope 100%) y Net Dollar Retention (incluye upgrades).',
        ],
      },
    },
    rubric: [
      {
        id: 'c1-grain',
        role: 'DE',
        title: 'Control de grano y prevención de Fan-Out en SQL',
        description:
          'Las tablas de ítems de factura y pagos se pre-agregan en CTEs al grano exacto (subscription_id, billing_month) antes de cualquier JOIN con la cabecera de suscripciones.',
      },
      {
        id: 'c1-scd2',
        role: 'DE',
        title: 'Unión temporal exacta con Dimensión SCD Tipo 2',
        description:
          "Los cobros se cruzan con dim_subscription_scd2 usando el predicado temporal billing_ts >= valid_from AND billing_ts < COALESCE(valid_to, '9999-12-31') para atribuir el plan histórico correcto.",
      },
      {
        id: 'c1-cohorts',
        role: 'DA',
        title: 'Cálculo riguroso de Cohortes y Net Dollar Retention (NDR)',
        description:
          'La consulta calcula el índice relativo de mes (months_since_acquisition) y desglosa Expansión, Contracción y Churn mediante funciones de ventana sin duplicar clientes.',
      },
      {
        id: 'c1-bi',
        role: 'BI',
        title: 'Jerarquía visual ejecutiva libre de ruido',
        description:
          'La propuesta de visualización reemplaza gráficos circulares o acumulados engañosos por una matriz triangular de retención y una cascada de movimientos de MRR con umbrales accionables.',
      },
    ],
    defaultDraft: `-- Borrador de Arquitectura y Solución SQL: Proyecto Integrador 1
-- 1. Pre-agregación de ítems de factura para evitar Fan-Out (Grano: 1 fila por suscripción y mes)
WITH invoice_monthly AS (
  SELECT
    i.subscription_id,
    i.customer_id,
    DATE_TRUNC('month', i.paid_at)::DATE AS billing_month,
    MAX(i.paid_at) AS last_paid_ts,
    SUM(li.net_amount_usd) AS mrr_usd
  FROM raw.invoices i
  INNER JOIN raw.invoice_line_items li
    ON i.invoice_id = li.invoice_id
  WHERE i.status = 'paid'
  GROUP BY 1, 2, 3
),

-- 2. Cruce temporal con Dimensión SCD Tipo 2 para recuperar el plan vigente al momento del cobro
fact_mrr_enriched AS (
  SELECT
    im.customer_id,
    im.subscription_id,
    im.billing_month,
    im.mrr_usd,
    scd.subscription_sk,
    scd.plan_tier AS historical_plan_tier
  FROM invoice_monthly im
  INNER JOIN analytics.dim_subscription_scd2 scd
    ON im.subscription_id = scd.subscription_id
   AND im.last_paid_ts >= scd.valid_from
   AND im.last_paid_ts < COALESCE(scd.valid_to, TIMESTAMP '9999-12-31 23:59:59')
),

-- 3. Asignación de cohorte y cálculo de retención neta (NDR)
customer_cohorts AS (
  SELECT
    customer_id,
    billing_month,
    mrr_usd,
    MIN(billing_month) OVER (PARTITION BY customer_id) AS cohort_month,
    LAG(mrr_usd) OVER (PARTITION BY customer_id ORDER BY billing_month) AS prev_mrr_usd
  FROM fact_mrr_enriched
)
SELECT
  cohort_month,
  billing_month,
  COUNT(DISTINCT customer_id) AS active_customers,
  SUM(mrr_usd) AS cohort_mrr_usd,
  ROUND(
    100.0 * SUM(mrr_usd) / NULLIF(FIRST_VALUE(SUM(mrr_usd)) OVER (
      PARTITION BY cohort_month ORDER BY billing_month
    ), 0),
    2
  ) AS ndr_pct
FROM customer_cohorts
GROUP BY 1, 2
ORDER BY 1, 2;

-- Notas de diseño BI:
-- Nivel 1: KPI de NDR Global (meta >= 105%) y Cascada Mensual (New + Expansion - Contraction - Churn).
-- Nivel 2: Heatmap triangular de cohortes filtrado por historical_plan_tier.`,
  },
  {
    id: 'capstone-2',
    number: 2,
    title:
      'Proyecto 2: Open Lakehouse en producción (Apache Iceberg v3 + SQLMesh + A/B con CUPED)',
    subtitle:
      'Construye una arquitectura Lakehouse sobre almacenamiento de objetos con particionamiento oculto, entornos virtuales incrementales en SQLMesh y evaluación estadística A/B con reducción de varianza CUPED.',
    estimatedTime: '8 a 10 horas',
    difficulty: 'Nivel Avanzado de Producción',
    stackTags: ['Apache Iceberg v3', 'SQLMesh', 'Estadística A/B + CUPED', 'Tablero de Decisión'],
    requiredLessons: [
      { id: 'l7-columnar-parquet', order: 7, title: 'Formato físico Parquet y zone maps' },
      { id: 'l10-iceberg-v3-medallion', order: 10, title: 'Tablas abiertas con Apache Iceberg' },
      { id: 'l11-dbt-sqlmesh-dag', order: 11, title: 'Transformación declarativa con dbt y SQLMesh' },
      { id: 'l14-ab-testing-cuped', order: 14, title: 'Pruebas A/B, diagnóstico SRM y ajuste CUPED' },
    ],
    businessBrief: {
      company: 'RápidoMarket (Marketplace Regional de Entregas en 15 Minutos)',
      problem:
        'RápidoMarket ingesta 120 millones de eventos diarios de navegación y órdenes. El pipeline actual recrea tablas completas cada noche en el Data Warehouse, generando facturas de cómputo insostenibles y retrasos de 9 horas. Además, el equipo de Producto lanzó un experimento A/B para probar un nuevo motor de paquetes sugeridos en el checkout, pero debido a la alta varianza natural del gasto por usuario (clientes ocasionales vs. compradores frecuentes), las pruebas tradicionales tardan 6 semanas en alcanzar significancia estadística y sufren de miradas repetidas (peeking) diarias en el dashboard.',
      objective:
        'Implementar el almacenamiento en Apache Iceberg v3 con particionamiento oculto, orquestar la transformación incremental con auditorías automáticas en SQLMesh y aplicar el estimador CUPED usando los 28 días previos al experimento para recortar el tiempo de decisión en un 50% sin inflar los falsos positivos.',
      deliverables: [
        'DDL de tabla Apache Iceberg v3 con particionamiento oculto, deletion vectors y política de compactación.',
        'Modelo incremental en SQLMesh con declaración de grano, ventana de lookback para eventos tardíos y auditorías de calidad.',
        'Consulta de inferencia estadística A/B con ajuste de covariable CUPED, prueba de Sample Ratio Mismatch (SRM) y criterios de parada para BI.',
      ],
    },
    architectureFlow: [
      {
        stage: 'Almacenamiento Open Lakehouse',
        tech: 'Apache Iceberg v3 (Parquet + Puffin)',
        detail: 'Hidden partitioning por día y bucket de usuario con vectores de borrado.',
        role: 'DE',
      },
      {
        stage: 'Transformación Consciente de Estado',
        tech: 'SQLMesh (INCREMENTAL_BY_TIME_RANGE)',
        detail: 'Entornos virtuales sin copia física y auditorías automáticas en pre-producción.',
        role: 'DE',
      },
      {
        stage: 'Inferencia Causal y Reducción de Varianza',
        tech: 'Estimador CUPED + Test SRM',
        detail: 'Ajuste con gasto pre-experimento de 28 días para reducir el error estándar.',
        role: 'DA',
      },
      {
        stage: 'Cockpit de Decisión Experimental',
        tech: 'Intervalos de Confianza 95% + Guardrails',
        detail: 'Semáforo de despliegue basado en MDE, potencia estadística y margen neto.',
        role: 'BI',
      },
    ],
    triadBreakdown: {
      DE: {
        title: 'Ingeniería de Datos (DE): Apache Iceberg v3 y Entornos Virtuales SQLMesh',
        responsibilities: [
          'Definir la tabla física en formato Iceberg v3 con particionamiento oculto days(event_ts) y bucket(16, user_id), evitando que los analistas dependan de columnas artificiales de partición.',
          'Configurar el modelo en SQLMesh como INCREMENTAL_BY_TIME_RANGE con lookback de 48 horas para absorber eventos móviles llegados con retraso.',
          'Activar auditorías declarativas (assert_unique_assignment, not_null) que bloqueen la promoción del puntero de producción si un usuario aparece en ambos grupos del experimento.',
        ],
      },
      DA: {
        title: 'Análisis y Estadística (DA): Reducción de Varianza con CUPED y Control SRM',
        responsibilities: [
          'Ejecutar primero el diagnóstico de Sample Ratio Mismatch (SRM) comparando la proporción observada Control/Tratamiento contra 50/50 mediante prueba Chi-cuadrado.',
          'Calcular la covariable pre-experimento X (GMV del usuario en los 28 días previos a la asignación) y el coeficiente óptimo theta = Cov(Y, X) / Var(X).',
          'Obtener la métrica ajustada Y_cuped = Y - theta * (X - media_global_X) para estrechar el intervalo de confianza sin sesgar el efecto promedio del tratamiento (ATE).',
        ],
      },
      BI: {
        title: 'Business Intelligence (BI): Gobernanza de Decisiones y Guardrails',
        responsibilities: [
          'Diseñar el tablero de experimentación mostrando el intervalo de confianza del lift ajustado por CUPED frente al Efecto Mínimo Detectable (MDE = +1.8%).',
          'Bloquear visualmente las conclusiones prematuras cuando aún no se alcanza el tamaño muestral requerido (evitar p-hacking por peeking diario).',
          'Monitorear en paralelo las métricas guardrail (tasa de cancelación de pedidos y latencia de checkout p95) para autorizar el rollout al 100%.',
        ],
      },
    },
    rubric: [
      {
        id: 'c2-iceberg',
        role: 'DE',
        title: 'Diseño físico en Apache Iceberg v3 con Particionamiento Oculto',
        description:
          'La tabla especifica format-version = 3, particionamiento oculto sobre marcas de tiempo y ordenamiento local para maximizar el pruning de row groups en Parquet.',
      },
      {
        id: 'c2-sqlmesh',
        role: 'DE',
        title: 'Modelo Incremental en SQLMesh con Auditorías y Lookback',
        description:
          'El bloque MODEL define kind INCREMENTAL_BY_TIME_RANGE, grain explícito, lookback para datos tardíos y audits que impiden contaminación entre variantes.',
      },
      {
        id: 'c2-cuped',
        role: 'DA',
        title: 'Implementación matemática de CUPED y verificación de SRM',
        description:
          'El cálculo utiliza únicamente datos previos al timestamp de exposición para la covariable X, estima theta con covarianza/varianza y reporta el error estándar reducido.',
      },
      {
        id: 'c2-guardrails',
        role: 'BI',
        title: 'Regla de decisión ejecutiva con Intervalos de Confianza y Guardrails',
        description:
          'El diseño del reporte presenta el intervalo de confianza al 95% junto con métricas guardrail (margen y cancelaciones) y estado de madurez muestral.',
      },
    ],
    defaultDraft: `-- Borrador de Arquitectura y Solución SQL: Proyecto Integrador 2
-- 1. Definición de Tabla en Apache Iceberg v3 con Particionamiento Oculto
CREATE TABLE lakehouse.exp_checkout_events (
  event_id STRING,
  user_id STRING,
  experiment_id STRING,
  variant STRING,
  event_ts TIMESTAMP,
  order_gmv_usd DOUBLE,
  is_cancelled BOOLEAN
)
USING iceberg
PARTITIONED BY (days(event_ts), bucket(16, user_id))
TBLPROPERTIES (
  'format-version' = '3',
  'write.delete.mode' = 'merge-on-read',
  'write.target-file-size-bytes' = '134217728'
);

-- 2. Modelo SQLMesh Incremental con Auditorías
/*
MODEL (
  name exp.user_experiment_metrics,
  kind INCREMENTAL_BY_TIME_RANGE (
    time_column first_exposure_date,
    lookback 2
  ),
  grain (user_id, experiment_id),
  audits (
    not_null(columns := (user_id, variant, post_gmv_usd)),
    unique_Combination_of_columns(columns := (user_id, experiment_id))
  )
);
*/

-- 3. Evaluación Estadística A/B con Reducción de Varianza CUPED
WITH user_metrics AS (
  SELECT
    user_id,
    variant,
    pre_28d_gmv_usd AS x_pre,
    post_14d_gmv_usd AS y_post
  FROM exp.user_experiment_metrics
  WHERE experiment_id = 'exp_cart_bundles_2026_q4'
),
global_params AS (
  SELECT
    AVG(x_pre) AS mean_x,
    COVAR_SAMP(y_post, x_pre) / NULLIF(VAR_SAMP(x_pre), 0) AS theta
  FROM user_metrics
),
cuped_adjusted AS (
  SELECT
    u.user_id,
    u.variant,
    u.y_post,
    u.y_post - g.theta * (u.x_pre - g.mean_x) AS y_cuped
  FROM user_metrics u
  CROSS JOIN global_params g
)
SELECT
  variant,
  COUNT(*) AS users_n,
  ROUND(AVG(y_post), 4) AS raw_mean_gmv,
  ROUND(STDDEV_SAMP(y_post) / SQRT(COUNT(*)), 4) AS raw_std_error,
  ROUND(AVG(y_cuped), 4) AS cuped_mean_gmv,
  ROUND(STDDEV_SAMP(y_cuped) / SQRT(COUNT(*)), 4) AS cuped_std_error
FROM cuped_adjusted
GROUP BY variant;`,
  },
  {
    id: 'capstone-3',
    number: 3,
    title:
      'Proyecto 3: Plataforma GenBI gobernada (Data Contract ODCS + MetricFlow + Servidor MCP)',
    subtitle:
      'Diseña una arquitectura de Inteligencia de Negocios Generativa a prueba de alucinaciones conectando contratos de datos ejecutables, métricas declarativas y herramientas MCP deterministas.',
    estimatedTime: '8 a 10 horas',
    difficulty: 'Nivel Arquitecto Principal',
    stackTags: ['Data Contract ODCS v3', 'MetricFlow YAML', 'Model Context Protocol (MCP)', 'BI-as-Code'],
    requiredLessons: [
      { id: 'l6-metrics-simpson', order: 6, title: 'Métricas no aditivas y paradoja de Simpson' },
      { id: 'l12-contracts-semantic-layer', order: 12, title: 'Contratos de datos y capa semántica' },
      { id: 'l15-bi-tufte-code', order: 15, title: 'Percepción visual y reportes como código' },
      { id: 'l18-mcp-semantic-ai-rag', order: 18, title: 'Servidores MCP, capa semántica y RAG híbrido' },
    ],
    businessBrief: {
      company: 'Vértice Pay (Fintech Regulada de Pagos Transfronterizos)',
      problem:
        'Vértice Pay intentó desplegar un asistente de IA conectado directamente a las tablas del Data Warehouse para responder preguntas de los directores regionales. En la primera semana, un director preguntó "¿Cuál fue el volumen neto procesado en México ayer?" y el modelo generó un SELECT SUM(amount) sobre la tabla cruda sin excluir transacciones fallidas, contracargos ni cuentas de prueba (sandbox), inflando la cifra en $4.2M USD. Auditoría Interna suspendió el proyecto hasta que exista una arquitectura gobernada donde ni los humanos ni los agentes de IA puedan inventar fórmulas de negocio.',
      objective:
        'Establecer una cadena de confianza de extremo a extremo: un Contrato de Datos ODCS v3 en la ingesta, una Capa Semántica declarativa en MetricFlow como única fuente de verdad estadística, un Servidor MCP que exponga herramientas semánticas tipadas (prohibiendo el SQL libre del LLM) y un reporte ejecutivo versionado como código (BI-as-Code).',
      deliverables: [
        'Contrato de Datos en formato Open Data Contract Standard (ODCS v3) con reglas de calidad bloqueantes.',
        'Definición de modelo semántico y métrica gobernada (net_payment_volume_usd) en MetricFlow.',
        'Especificación de herramienta del Servidor MCP y consulta de auditoría estadística para BI-as-Code.',
      ],
    },
    architectureFlow: [
      {
        stage: 'Contrato de Datos en Origen',
        tech: 'ODCS v3.0 (YAML + Circuit Breaker)',
        detail: 'Garantiza esquema, SLA de frescura (<15 min) y filtrado de cuentas sandbox.',
        role: 'DE',
      },
      {
        stage: 'Capa Semántica Centralizada',
        tech: 'dbt Semantic Layer / MetricFlow',
        detail: 'Define net_payment_volume_usd y take_rate_pct una sola vez en código.',
        role: 'BI',
      },
      {
        stage: 'Auditoría de Sesgos y Anomalías',
        tech: 'Control de Paradoja de Simpson y Outliers',
        detail: 'Desglose obligatorio por segmento empresarial vs. PYME en las respuestas.',
        role: 'DA',
      },
      {
        stage: 'Consumo Gobernado MCP + BI-as-Code',
        tech: 'Servidor MCP + Reportes en Git',
        detail: 'El agente de IA invoca herramientas tipadas; los tableros pasan por CI/CD.',
        role: 'BI',
      },
    ],
    triadBreakdown: {
      DE: {
        title: 'Ingeniería de Datos (DE): Contratos ODCS v3 y Aislamiento de Seguridad',
        responsibilities: [
          'Formalizar el contrato ODCS v3 sobre la tabla payments_settled exigiendo validación de tipos, enmascaramiento de PII y rechazo automático si llegan registros con status nulo.',
          'Desplegar el Servidor MCP con credenciales de solo lectura restringidas exclusivamente al endpoint de la Capa Semántica, sin acceso directo a tablas crudas.',
          'Registrar cada invocación de herramienta del agente (parámetros, consulta compilada, latencia y usuario) en una tabla inmutable de auditoría.',
        ],
      },
      DA: {
        title: 'Análisis y Estadística (DA): Prevención de Paradoja de Simpson en GenBI',
        responsibilities: [
          'Configurar en los metadatos analíticos las dimensiones de control obligatorias (country_code, merchant_tier) para que las comparaciones de conversión no oculten cambios de mix.',
          'Definir umbrales estadísticos de anomalías (Z-score robusto basado en mediana y MAD) que se adjuntan automáticamente a la respuesta del servidor MCP.',
          'Validar mediante pruebas de regresión que el motor semántico maneje correctamente métricas no aditivas como tasas de aprobación y usuarios únicos.',
        ],
      },
      BI: {
        title: 'Business Intelligence (BI): MetricFlow y Flujo BI-as-Code en Git',
        responsibilities: [
          "Codificar la métrica oficial net_payment_volume_usd en MetricFlow aplicando los filtros canónicos: is_sandbox = FALSE, settlement_status = 'settled' y deducción de contracargos.",
          'Diseñar la firma de la herramienta MCP query_governed_metric(metric_name, group_by, time_grain) devolviendo tanto el resultado tabular como el linaje certificado.',
          'Versionar el tablero ejecutivo en Markdown/SQL bajo control de versiones (BI-as-Code) para que cualquier cambio de fórmula requiera Pull Request y aprobación de Finanzas.',
        ],
      },
    },
    rubric: [
      {
        id: 'c3-contract',
        role: 'DE',
        title: 'Contrato de Datos ejecutable bajo estándar ODCS v3',
        description:
          'El contrato define propietario, SLA de frescura, esquema estricto y reglas de calidad que detienen la publicación si aparecen transacciones sin estado válido o datos de prueba sin marcar.',
      },
      {
        id: 'c3-semantic',
        role: 'BI',
        title: 'Definición declarativa en Capa Semántica (MetricFlow)',
        description:
          'Las métricas financieras y razones no aditivas se declaran sobre un semantic_model con filtros gobernados (is_sandbox = false), evitando duplicar lógica en cada reporte.',
      },
      {
        id: 'c3-mcp',
        role: 'DE',
        title: 'Diseño de Herramienta MCP determinista sin SQL libre',
        description:
          'El servidor MCP expone únicamente un catálogo cerrado de métricas y dimensiones validadas, eliminando el riesgo de alucinación de JOINs o filtros omitidos por el LLM.',
      },
      {
        id: 'c3-bicode',
        role: 'DA',
        title: 'Verificación anti-Paradoja de Simpson y BI-as-Code',
        description:
          'La salida combina la métrica global con su desagregación por segmento (merchant_tier) en un artefacto versionado en Git reproducible por CI/CD.',
      },
    ],
    defaultDraft: `# Borrador de Arquitectura y Solución Gobernada: Proyecto Integrador 3
# 1. Data Contract (ODCS v3.0) — payments_settled_contract.yaml
apiVersion: v3.0.0
kind: DataContract
id: urn:datacontract:verticepay:payments_settled
info:
  title: Transacciones Liquidadas Certificadas
  owner: equipo-core-pagos@verticepay.io
  slaFreshnessMinutes: 15
schema:
  table: fct_payments_settled
  primaryKey: [payment_id]
  fields:
    - name: payment_id
      type: string
      required: true
    - name: merchant_tier
      type: string
      enum: [enterprise, mid_market, smb]
    - name: is_sandbox
      type: boolean
      required: true
    - name: settled_amount_usd
      type: decimal(18,2)
    - name: chargeback_amount_usd
      type: decimal(18,2)
qualityRules:
  - name: zero_unflagged_sandbox_in_prod
    sql: "SELECT COUNT(*) FROM fct_payments_settled WHERE is_sandbox IS NULL"
    mustEqual: 0

---
# 2. Capa Semántica MetricFlow — semantic_metrics.yaml
semantic_models:
  - name: payments_settled
    model: ref('fct_payments_settled')
    defaults:
      agg_time_dimension: settled_at
    entities:
      - name: payment
        type: primary
        expr: payment_id
    dimensions:
      - name: settled_at
        type: time
        type_params:
          time_granularity: day
      - name: country_code
        type: categorical
      - name: merchant_tier
        type: categorical
    measures:
      - name: gross_settled_usd
        agg: sum
        expr: settled_amount_usd
      - name: chargebacks_usd
        agg: sum
        expr: chargeback_amount_usd

metrics:
  - name: net_payment_volume_usd
    type: derived
    label: "Volumen Neto Procesado (USD)"
    type_params:
      expr: gross_settled_usd - chargebacks_usd
      metrics:
        - name: gross_settled_usd
          filter: "{{ Dimension('payment__is_sandbox') }} = false"
        - name: chargebacks_usd
          filter: "{{ Dimension('payment__is_sandbox') }} = false"

---
# 3. Contrato de Herramienta del Servidor MCP (JSON Schema)
# Tool: query_governed_metric
# Input permitido al Agente IA:
# {
#   "metric": "net_payment_volume_usd",
#   "group_by": ["country_code", "merchant_tier"],
#   "time_grain": "day"
# }`,
  },
];

function getProjectRequiredStages(proj) {
  const seen = new Set();
  const list = [];
  (proj.requiredLessons || []).forEach((req) => {
    const sNum = getStageNumber(req);
    if (!seen.has(sNum)) {
      seen.add(sNum);
      list.push(sNum);
    }
  });
  return list.sort((a, b) => a - b);
}

export function CapstoneProjectsView({
  completedCapstoneIds = [],
  completedIds,
  onToggleCompleteCapstone = () => {},
  onAskAiTutor = () => {},
}) {
  const detailRef = useRef(null);

  const completedLessonIds = React.useMemo(() => {
    if (Array.isArray(completedIds)) return completedIds;
    try {
      const saved = localStorage.getItem('ruta_datos_2026_completed');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, [completedIds]);

  const [rubricState, setRubricState] = useState(() => {
    try {
      const saved = localStorage.getItem('ruta_datos_2026_capstone_rubric');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [drafts, setDrafts] = useState(() => {
    const initial = {};
    CAPSTONE_PROJECTS.forEach((p) => {
      initial[p.id] = p.defaultDraft;
    });
    try {
      const saved = localStorage.getItem('ruta_datos_2026_capstone_drafts');
      if (saved) {
        return { ...initial, ...JSON.parse(saved) };
      }
    } catch {}
    return initial;
  });

  const [activeProjectId, setActiveProjectId] = useState(CAPSTONE_PROJECTS[0].id);

  useEffect(() => {
    try {
      localStorage.setItem('ruta_datos_2026_capstone_rubric', JSON.stringify(rubricState));
    } catch {}
  }, [rubricState]);

  useEffect(() => {
    try {
      localStorage.setItem('ruta_datos_2026_capstone_drafts', JSON.stringify(drafts));
    } catch {}
  }, [drafts]);

  const project =
    CAPSTONE_PROJECTS.find((p) => p.id === activeProjectId) || CAPSTONE_PROJECTS[0];

  const toggleCriterion = (criterionId) => {
    setRubricState((prev) => {
      const nextStatus = prev[criterionId] === 'completed' ? 'in_progress' : 'completed';
      const next = { ...prev, [criterionId]: nextStatus };
      const allCompleted = project.rubric.every((c) => next[c.id] === 'completed');
      if (allCompleted && !completedCapstoneIds.includes(project.id)) {
        onToggleCompleteCapstone(project.id);
      }
      return next;
    });
  };

  const handleOpenProjectDetail = (projId) => {
    setActiveProjectId(projId);
    if (detailRef.current && typeof detailRef.current.scrollIntoView === 'function') {
      detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleReviewWithAi = () => {
    const studentDraft = (drafts[project.id] || '').trim();
    const completedCriteriaCount = project.rubric.filter(
      (c) => rubricState[c.id] === 'completed'
    ).length;

    const prompt = `Revisa mi diseño de arquitectura y solución para "${project.title}" (${project.businessBrief.company}). He marcado ${completedCriteriaCount} de ${project.rubric.length} criterios en la rúbrica. Evalúa fortalezas, posibles errores silenciosos en DE, DA y BI, y mejoras concretas sobre mi borrador:\n\n${studentDraft}`;

    onAskAiTutor(prompt, project);
  };

  const metCount = project.rubric.filter((c) => rubricState[c.id] === 'completed').length;
  const isProjectCompleted = completedCapstoneIds.includes(project.id);
  const activeProjectCompletedReqs = (project.requiredLessons || []).filter((req) =>
    completedLessonIds.includes(req.id)
  ).length;
  const activeProjectStatus = isProjectCompleted
    ? 'Completado ✓'
    : activeProjectCompletedReqs >= project.requiredLessons.length
      ? 'Disponible'
      : 'Bloqueado';
  const activeProjectStatusVariant = isProjectCompleted
    ? 'success'
    : activeProjectCompletedReqs >= project.requiredLessons.length
      ? 'primary'
      : 'warning';

  return (
    <div className="sec-view">
      <header className="sec-header">
        <div>
          <div className="sec-header__eyebrow tabular">
            Integración DE · DA · BI
          </div>
          <h1 className="sec-header__title">Proyectos integradores</h1>
          <p className="sec-header__lead">
            Tres casos de arquitectura donde resuelves un problema de extremo a
            extremo: modelado físico e ingesta (DE), inferencia estadística (DA)
            y gobernanza semántica (BI).
          </p>
        </div>
      </header>

      {/* Grilla de tarjetas grandes con Illustration, chips de etapa y requisitos verificados */}
      <section aria-label="Catálogo de proyectos integradores">
        <div className="cap-grid">
          {CAPSTONE_PROJECTS.map((proj, idx) => {
            const isDone = completedCapstoneIds.includes(proj.id);
            const isSelected = activeProjectId === proj.id;
            const projMetCount = proj.rubric.filter(
              (c) => rubricState[c.id] === 'completed'
            ).length;
            const rubricPct = Math.round((projMetCount / proj.rubric.length) * 100);
            const completedReqs = (proj.requiredLessons || []).filter((req) =>
              completedLessonIds.includes(req.id)
            ).length;
            const isUnlocked = completedReqs >= proj.requiredLessons.length;
            const statusText = isDone
              ? 'Completado ✓'
              : isUnlocked
                ? 'Disponible'
                : 'Bloqueado';
            const statusVariant = isDone
              ? 'success'
              : isUnlocked
                ? 'primary'
                : 'warning';
            const reqStages = getProjectRequiredStages(proj);
            const primaryStageNum = idx * 2 + 2;

            return (
              <Card
                key={proj.id}
                stage={primaryStageNum}
                accentTop
                className={`cap-card ${isSelected ? 'cap-card--selected' : ''}`.trim()}
              >
                <div className="cap-card__body">
                  <div className="cap-card__top">
                    <div className="cap-card__roles">
                      <span className="cap-card__num tabular">
                        PROYECTO {proj.number}
                      </span>
                      <Chip variant="role" role="DE" />
                      <Chip variant="role" role="DA" />
                      <Chip variant="role" role="BI" />
                    </div>
                    <Chip variant={statusVariant}>{statusText}</Chip>
                  </div>

                  <div className="cap-card__hero">
                    <div className="cap-card__illus">
                      <Illustration name={`stage-${idx * 2 + 2}`} size="sm" />
                    </div>
                    <div>
                      <h2 className="cap-card__title">{proj.title}</h2>
                      <div className="cap-card__meta tabular">
                        {proj.businessBrief.company} · {proj.estimatedTime}
                      </div>
                    </div>
                  </div>

                  <p className="cap-card__subtitle">{proj.subtitle}</p>

                  {/* Etapas requeridas como chips de color (data-stage) */}
                  <div className="cap-card__stages" aria-label="Etapas requeridas">
                    {reqStages.map((sNum) => {
                      const stTheme = getStageTheme(sNum);
                      return (
                        <Chip key={sNum} variant="stage" stage={sNum}>
                          Etapa {sNum} · {stTheme.shortName}
                        </Chip>
                      );
                    })}
                  </div>

                  {/* Lista de requisitos con checks reales verificados contra completedIds */}
                  <div className="cap-reqs">
                    <div className="cap-reqs__title tabular">
                      Requisitos de lecciones ({completedReqs}/{proj.requiredLessons.length}{' '}
                      completadas):
                    </div>
                    <ul className="cap-reqs__list">
                      {proj.requiredLessons.map((req) => {
                        const reqDone = completedLessonIds.includes(req.id);
                        const reqStageNum = getStageNumber(req);
                        return (
                          <li
                            key={req.id}
                            data-stage={reqStageNum}
                            className={`cap-reqs__item tabular ${
                              reqDone ? 'cap-reqs__item--done' : ''
                            }`.trim()}
                          >
                            <span className="cap-reqs__lesson">
                              <span className="cap-reqs__dot" aria-hidden="true" />
                              <span>
                                L{String(req.order).padStart(2, '0')} · {req.title}
                              </span>
                            </span>
                            <span className="cap-reqs__status">
                              {reqDone ? '✓' : 'Pendiente'}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                <div className="cap-card__footer">
                  <div>
                    <div className="cap-card__rubric-row tabular">
                      <span>Rúbrica verificada</span>
                      <span>
                        {projMetCount} de {proj.rubric.length} criterios
                      </span>
                    </div>
                    <ProgressBar
                      value={rubricPct}
                      tone={isDone || rubricPct === 100 ? 'success' : 'stage'}
                      stage={primaryStageNum}
                      label={`Rúbrica Proyecto ${proj.number}`}
                    />
                  </div>

                  <Button
                    variant={isSelected ? 'primary' : 'secondary'}
                    size="md"
                    onClick={() => handleOpenProjectDetail(proj.id)}
                  >
                    {isSelected
                      ? 'Abierto en el editor y rúbrica'
                      : 'Abrir detalle y comprobar rúbrica'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Panel de Detalle, Rúbrica y Editor del Proyecto Activo */}
      <div ref={detailRef}>
        <Card className="cap-detail">
          <div className="cap-detail__header">
            <div>
              <div className="cap-detail__chips">
                <Chip variant="primary">Proyecto {project.number}</Chip>
                <Chip variant={activeProjectStatusVariant}>
                  {activeProjectStatus}
                </Chip>
                <span className="cap-detail__company tabular">
                  {project.businessBrief.company} · {project.difficulty}
                </span>
              </div>
              <h2 className="cap-detail__title">{project.title}</h2>
              <p className="cap-detail__subtitle">{project.subtitle}</p>
            </div>

            <Button
              variant={isProjectCompleted ? 'secondary' : 'primary'}
              size="md"
              onClick={() => onToggleCompleteCapstone(project.id)}
            >
              {isProjectCompleted
                ? 'Completado ✓ (marcar pendiente)'
                : 'Marcar como Completado ✓'}
            </Button>
          </div>

          <Callout variant="info" title="Contexto de producción y objetivo">
            <p className="cap-callout-p">
              <strong>Problema detectado:</strong> {project.businessBrief.problem}
            </p>
            <p className="cap-callout-p">
              <strong>Objetivo técnico:</strong> {project.businessBrief.objective}
            </p>
          </Callout>

          {/* Responsabilidades DE / DA / BI */}
          <section>
            <h3 className="cap-sub-title">
              Responsabilidades integradas por disciplina
            </h3>
            <div className="cap-triad-grid">
              {['DE', 'DA', 'BI'].map((roleKey) => {
                const roleBlock = project.triadBreakdown[roleKey];
                return (
                  <div key={roleKey} className="cap-triad-card">
                    <div className="cap-triad-card__head">
                      <Chip variant="role" role={roleKey} />
                      <strong className="cap-triad-card__title">
                        {roleBlock.title}
                      </strong>
                    </div>
                    <ul className="cap-triad-card__list">
                      {roleBlock.responsibilities.map((resp, i) => (
                        <li key={i}>{resp}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Rúbrica interactiva */}
          <section className="cap-section">
            <div className="cap-section__head">
              <h3 className="cap-sub-title">
                Rúbrica de autoevaluación ({metCount} de {project.rubric.length}{' '}
                criterios)
              </h3>
              <span className="cap-section__hint tabular">
                Marca cada criterio tras verificarlo en tu solución
              </span>
            </div>

            <div className="pipeline-steps-table">
              {project.rubric.map((criterion, cIdx) => {
                const isMet = rubricState[criterion.id] === 'completed';
                return (
                  <div
                    key={criterion.id}
                    className={`pipeline-step-row ${isMet ? 'is-ok' : ''}`}
                  >
                    <span className="pipeline-step-num tabular">{cIdx + 1}.</span>
                    <div className="pipeline-step-body">
                      <div className="pipeline-step-title">
                        <strong>{criterion.title}</strong>
                        <Chip variant="role" role={criterion.role} />
                      </div>
                      <p className="pipeline-step-detail">{criterion.description}</p>
                    </div>
                    <div>
                      <Button
                        variant={isMet ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => toggleCriterion(criterion.id)}
                      >
                        {isMet ? 'Cumplido ✓' : 'Marcar cumplido'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Editor de código del proyecto */}
          <section className="cap-section">
            <div className="cap-section__head">
              <div>
                <h3 className="cap-sub-title">
                  Editor del proyecto (SQL / YAML)
                </h3>
                <p className="cap-section__sub">
                  Edita la solución de referencia y solicita retroalimentación al Tutor IA.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setDrafts((prev) => ({ ...prev, [project.id]: project.defaultDraft }))
                }
              >
                Restaurar código base
              </Button>
            </div>

            <textarea
              className="code-block-dark tabular cap-editor-textarea"
              value={drafts[project.id] || ''}
              onChange={(e) =>
                setDrafts((prev) => ({ ...prev, [project.id]: e.target.value }))
              }
              rows={15}
              spellCheck={false}
              aria-label={`Editor de código para ${project.title}`}
            />

            <div className="cap-editor-actions">
              <Button variant="primary" size="md" onClick={handleReviewWithAi}>
                Revisar solución con Tutor IA
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => onToggleCompleteCapstone(project.id)}
              >
                {isProjectCompleted
                  ? 'Proyecto Completado ✓'
                  : 'Marcar proyecto como Completado ✓'}
              </Button>
            </div>
          </section>
        </Card>
      </div>
    </div>
  );
}

export default CapstoneProjectsView;
