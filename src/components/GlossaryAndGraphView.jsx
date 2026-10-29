import React, { useState, useMemo, useEffect } from 'react';
import { LESSONS } from '../data/learningPath2026.js';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Illustration,
  Sheet,
  STAGE_THEMES,
  getStageNumber,
  getStageTheme,
} from './ui/index.js';

export const DISCIPLINE_FILTERS = [
  { id: 'Todos', label: 'Todos (A–Z)', roleKey: 'ALL' },
  { id: 'Ingeniería DE', label: 'DE', roleKey: 'DE' },
  { id: 'Análisis DA', label: 'DA', roleKey: 'DA' },
  { id: 'Business Intelligence BI', label: 'BI', roleKey: 'BI' },
];

export const ROLE_STYLES = {
  DE: {
    code: 'DE',
    disciplineFilter: 'Ingeniería DE',
    name: 'Ingeniería de Datos (DE)',
    shortName: 'Ingeniería DE',
    color: 'var(--role-de)',
    bg: 'var(--surface-2)',
    border: 'var(--border)',
  },
  DA: {
    code: 'DA',
    disciplineFilter: 'Análisis DA',
    name: 'Análisis de Datos (DA)',
    shortName: 'Análisis DA',
    color: 'var(--role-da)',
    bg: 'var(--surface-2)',
    border: 'var(--border)',
  },
  BI: {
    code: 'BI',
    disciplineFilter: 'Business Intelligence BI',
    name: 'Business Intelligence (BI)',
    shortName: 'Business Intelligence BI',
    color: 'var(--role-bi)',
    bg: 'var(--surface-2)',
    border: 'var(--border)',
  },
};

export const STAGE_LAYERS = [
  {
    id: 'stage-1',
    number: 1,
    title: 'Capa 1: SQL Analítico y Control de Granularidad',
    summary: 'Prevención de multiplicación de filas, funciones de ventana y cruces temporales.',
  },
  {
    id: 'stage-2',
    number: 2,
    title: 'Capa 2: Modelado Dimensional e Integridad de Métricas',
    summary: 'Historia auditable con SCD Tipo 2, esquemas estrella/OBT y árboles de KPIs.',
  },
  {
    id: 'stage-3',
    number: 3,
    title: 'Capa 3: Almacenamiento Columnar y Motores Vectorizados',
    summary: 'Física de Parquet, memoria Zero-Copy en Apache Arrow, DuckDB y Polars.',
  },
  {
    id: 'stage-4',
    number: 4,
    title: 'Capa 4: Open Lakehouse, Contratos y Capa Semántica',
    summary: 'Apache Iceberg v3, grafos deterministas en SQLMesh/dbt y métricas gobernadas.',
  },
  {
    id: 'stage-5',
    number: 5,
    title: 'Capa 5: Inferencia Causal, Experimentación y BI-as-Code',
    summary: 'Cohortes, pruebas A/B con reducción de varianza CUPED y visualización de alta densidad.',
  },
  {
    id: 'stage-6',
    number: 6,
    title: 'Capa 6: Streaming con Watermarks y Agentes MCP (Actual)',
    summary: 'CDC en tiempo real con Flink y agentes de IA conectados a la Capa Semántica vía MCP.',
  },
];

export const GLOSSARY_CONCEPTS_2026 = [
  // ==========================================
  // CAPA 1: SQL ANALÍTICO Y GRANULARIDAD (L1 - L3)
  // ==========================================
  {
    id: 'c01-grain-fanout',
    number: 1,
    term: 'Granularidad (Grain) y Trampa del Fan-Out',
    discipline: 'Análisis DA',
    primaryRole: 'DA',
    stageId: 'stage-1',
    lessonId: 'l1-joins-fanout',
    fallbackLessonId: 'l1-joins-fanout',
    lessonNumber: 1,
    lessonTitle: 'El peligro oculto de los JOINs: Granularidad y el Fan-Out Trap',
    plainDefinition:
      'La granularidad define qué representa exactamente una fila en una tabla (por ejemplo, un pedido completo frente a un producto dentro del pedido). La trampa del Fan-Out ocurre cuando unes una tabla maestra con una tabla de detalle 1-a-muchos y sumas importes de la cabecera: las filas se multiplican silenciosamente e inflan los ingresos sin arrojar ningún error de sintaxis.',
    crossRoleConnections: {
      DE: 'Separa físicamente cabeceras y líneas de detalle en la capa Silver o prorratea los importes al nivel más atómico con tests de reconciliación financiera.',
      BI: 'Declara relaciones de cardinalidad exacta y medidas asimétricas en la Capa Semántica para impedir que un usuario sume importes duplicados en un tablero.',
    },
    tool2026: 'DuckDB 1.2 / SQL Estándar (Auditoría de cardinalidad previa al JOIN)',
    syntaxExample: `-- Verificar si la clave es única antes de cruzar tablas:
SELECT
  COUNT(*) AS total_filas,
  COUNT(DISTINCT order_id) AS pedidos_unicos,
  COUNT(*) - COUNT(DISTINCT order_id) AS filas_duplicadas_potenciales
FROM silver.order_items;`,
    connectedIds: ['c02-cte-preagg', 'c06-star-vs-obt', 'c21-semantic-layer'],
  },
  {
    id: 'c02-cte-preagg',
    number: 2,
    term: 'Pre-agregación Simétrica en CTEs',
    discipline: 'Ingeniería DE',
    primaryRole: 'DE',
    stageId: 'stage-1',
    lessonId: 'l1-joins-fanout',
    fallbackLessonId: 'l1-joins-fanout',
    lessonNumber: 1,
    lessonTitle: 'El peligro oculto de los JOINs: Granularidad y el Fan-Out Trap',
    plainDefinition:
      'Patrón de diseño SQL que consiste en agrupar cada tabla hija dentro de una expresión de tabla común (CTE) hasta igualar la clave primaria exacta de la tabla principal antes de realizar el JOIN. Así garantizas una relación 1-a-1 donde ningún importe monetario se multiplica.',
    crossRoleConnections: {
      DA: 'Utiliza CTEs pre-agregadas al construir datasets de entrenamiento o embudos de usuario que cruzan sesiones, pagos y tickets de soporte.',
      BI: 'Aprovecha modelos intermedios ya consolidados al mismo grano para que las vistas ejecutivas respondan en milisegundos sin recalcular subconsultas.',
    },
    tool2026: 'dbt Core / SQLMesh (CTEs modulares por grano de entidad)',
    syntaxExample: `WITH items_por_pedido AS (
  SELECT order_id, SUM(quantity) AS total_unidades
  FROM silver.order_items
  GROUP BY order_id
)
SELECT o.order_id, o.order_total_usd, COALESCE(i.total_unidades, 0) AS unidades
FROM silver.orders o
LEFT JOIN items_por_pedido i ON o.order_id = i.order_id;`,
    connectedIds: ['c01-grain-fanout', 'c20-sqlmesh-dbt-dag'],
  },
  {
    id: 'c03-window-qualify',
    number: 3,
    term: 'Funciones de Ventana y Cláusula QUALIFY',
    discipline: 'Ingeniería DE',
    primaryRole: 'DE',
    stageId: 'stage-1',
    lessonId: 'l2-window-functions',
    fallbackLessonId: 'l2-window-functions',
    lessonNumber: 2,
    lessonTitle: 'Window Functions, QUALIFY y ASOF JOIN: SQL Analítico sin Subconsultas',
    plainDefinition:
      'Las funciones de ventana calculan rankings, acumulados o diferencias entre filas vecinas sin colapsar la tabla como hace GROUP BY. La cláusula QUALIFY actúa como el filtro directo de las funciones de ventana, permitiendo quedarse con la versión más reciente de cada evento sin escribir subconsultas anidadas.',
    crossRoleConnections: {
      DA: 'Emplea LAG, LEAD y ROW_NUMBER con QUALIFY para aislar la primera compra de cada cliente o calcular el cambio de gasto entre meses consecutivos.',
      BI: 'Alimenta tablas limpias de duplicados donde cada transacción aparece una única vez, garantizando cuadres contables exactos.',
    },
    tool2026: 'DuckDB / Snowflake / BigQuery / Databricks SQL',
    syntaxExample: `-- Deduplicación idempotente de eventos recibidos por webhook:
SELECT event_id, customer_id, mrr_usd, updated_at
FROM raw.subscription_events
QUALIFY ROW_NUMBER() OVER (
  PARTITION BY customer_id, DATE_TRUNC('month', updated_at)
  ORDER BY updated_at DESC
) = 1;`,
    connectedIds: ['c04-asof-join', 'c05-window-frames', 'c17-medallion-architecture'],
  },
  {
    id: 'c04-asof-join',
    number: 4,
    term: 'Cruce Temporal de Precisión (ASOF JOIN y LATERAL)',
    discipline: 'Análisis DA',
    primaryRole: 'DA',
    stageId: 'stage-1',
    lessonId: 'l3-asof-lateral-ctes',
    fallbackLessonId: 'l2-window-functions',
    lessonNumber: 3,
    lessonTitle: 'Cruces Temporales Exactos con ASOF JOIN y CTEs Modulares',
    plainDefinition:
      'Operador especializado para unir dos series de tiempo cuyos relojes no coinciden al milisegundo exacto. Para cada evento de la izquierda (como una venta a las 10:14:22), busca automáticamente el registro válido inmediatamente anterior o igual en la tabla derecha (como la cotización de divisa vigente a las 10:12:05).',
    crossRoleConnections: {
      DE: 'Sustituye costosos joins de desigualdad (BETWEEN con producto cartesiano parcial) por el algoritmo lineal de ASOF JOIN en pipelines financieros.',
      BI: 'Permite convertir ventas multimoneda al tipo de cambio oficial del minuto exacto de cada operación sin distorsiones cambiarias.',
    },
    tool2026: 'DuckDB 1.x / Polars (`join_asof`) / ClickHouse',
    syntaxExample: `SELECT
  p.payment_id,
  p.amount_local,
  ROUND(p.amount_local * fx.usd_rate, 2) AS amount_usd_exacto
FROM silver.payments p
ASOF JOIN silver.fx_rates fx
  ON p.currency = fx.currency
  AND p.payment_ts >= fx.rate_timestamp;`,
    connectedIds: ['c03-window-qualify', 'c07-scd-type-2', 'c08-point-in-time'],
  },
  {
    id: 'c05-window-frames',
    number: 5,
    term: 'Marcos de Ventana Temporal (RANGE vs. ROWS)',
    discipline: 'Business Intelligence BI',
    primaryRole: 'BI',
    stageId: 'stage-1',
    lessonId: 'l2-window-functions',
    fallbackLessonId: 'l2-window-functions',
    lessonNumber: 2,
    lessonTitle: 'Window Functions y QUALIFY: Particiones, Rankings y Marcos Móviles',
    plainDefinition:
      'Al calcular una media móvil de 7 días en SQL, ROWS cuenta 6 filas físicas hacia atrás (lo que distorsiona el promedio si el domingo no hubo ventas y falta esa fila), mientras que RANGE con INTERVAL mira exactamente los últimos 6 días del calendario, respetando los huecos temporales.',
    crossRoleConnections: {
      DE: 'Genera tablas de calendario continuo (Date Spine) en el Lakehouse para que las series temporales no tengan fechas ausentes.',
      DA: 'Utiliza marcos RANGE para suavizar la estacionalidad semanal antes de detectar anomalías estadísticas en métricas operativas.',
    },
    tool2026: 'SQL Estándar 2026 en DuckDB / PostgreSQL / Trino',
    syntaxExample: `SELECT
  sale_date,
  daily_revenue_usd,
  AVG(daily_revenue_usd) OVER (
    ORDER BY sale_date
    RANGE BETWEEN INTERVAL 6 DAYS PRECEDING AND CURRENT ROW
  ) AS media_movil_7d_calendario
FROM gold.daily_store_sales;`,
    connectedIds: ['c03-window-qualify', 'c22-cohort-retention-ltv', 'c25-tufte-visual-perception'],
  },

  // ==========================================
  // CAPA 2: MODELADO Y MÉTRICAS (L4 - L6)
  // ==========================================
  {
    id: 'c06-star-vs-obt',
    number: 6,
    term: 'Esquema en Estrella (Star Schema) vs. One Big Table (OBT)',
    discipline: 'Business Intelligence BI',
    primaryRole: 'BI',
    stageId: 'stage-2',
    lessonId: 'l4-star-schema-obt',
    fallbackLessonId: 'l3-dimensional-modeling',
    lessonNumber: 4,
    lessonTitle: 'OLTP vs. OLAP: Star Schema de Kimball y One Big Table (OBT)',
    plainDefinition:
      'El Esquema en Estrella separa los eventos numéricos (Tablas de Hechos) de los atributos descriptivos (Tablas de Dimensión) para facilitar el gobierno y el historial. One Big Table (OBT) pre-une todo en una sola tabla ancha para acelerar lecturas columnares. En 2026 se combinan: Estrella en capa Silver y OBT en capa Gold.',
    crossRoleConnections: {
      DE: 'Mantiene la integridad referencial y las claves subrogadas en el esquema en estrella de Silver, y materializa OBT en Parquet donde Dictionary Encoding comprime las cadenas repetidas.',
      DA: 'Consulta la OBT de Gold para exploraciones rápidas en Polars o notebooks sin tener que escribir cinco JOINs repetitivos en cada análisis.',
    },
    tool2026: 'Arquitectura Híbrida Kimball Silver + OBT Gold sobre Parquet',
    syntaxExample: `-- Materialización de OBT en capa Gold desde Star Schema en Silver:
CREATE OR REPLACE TABLE gold.obt_orders AS
SELECT
  f.order_id, f.order_ts, f.net_amount_usd,
  c.customer_segment, c.country_code,
  p.product_category, p.brand_name
FROM silver.fct_orders f
JOIN silver.dim_customer_scd2 c ON f.customer_sk = c.customer_sk
JOIN silver.dim_product p ON f.product_sk = p.product_sk;`,
    connectedIds: ['c01-grain-fanout', 'c07-scd-type-2', 'c12-parquet-columnar'],
  },
  {
    id: 'c07-scd-type-2',
    number: 7,
    term: 'Dimensión Lentamente Cambiante Tipo 2 (SCD Tipo 2)',
    discipline: 'Ingeniería DE',
    primaryRole: 'DE',
    stageId: 'stage-2',
    lessonId: 'l5-scd2-history',
    fallbackLessonId: 'l3-dimensional-modeling',
    lessonNumber: 5,
    lessonTitle: 'Historia Auditable con SCD Tipo 2 y Prevención de Data Leakage',
    plainDefinition:
      'Técnica de modelado que evita sobrescribir el pasado cuando un atributo cambia (por ejemplo, cuando un cliente pasa del plan Pyme al plan Enterprise). En vez de borrar el valor anterior, cierra la fila vieja con una fecha de fin (valid_to) y abre una fila nueva con fecha de inicio (valid_from) y una nueva clave subrogada.',
    crossRoleConnections: {
      DA: 'Cruza los eventos con la versión exacta de la dimensión vigente en esa fecha para reconstruir cohortes históricas sin contaminar los datos con cambios futuros.',
      BI: 'Permite responder en el comité ejecutivo tanto "qué vendió cada segmento según la clasificación de aquel mes" como "qué vendió según la clasificación actual".',
    },
    tool2026: 'SQLMesh (`SCD_TYPE_2_BY_TIME`) / dbt Snapshots',
    syntaxExample: `MODEL (
  name silver.dim_customer_scd2,
  kind SCD_TYPE_2_BY_TIME (
    unique_key customer_id,
    updated_at_name updated_at,
    valid_from_name valid_from,
    valid_to_name valid_to
  )
);
SELECT customer_id, segment, country_code, updated_at FROM staging.customers;`,
    connectedIds: ['c04-asof-join', 'c06-star-vs-obt', 'c08-point-in-time'],
  },
  {
    id: 'c08-point-in-time',
    number: 8,
    term: 'Integridad Point-in-Time y Prevención de Data Leakage',
    discipline: 'Análisis DA',
    primaryRole: 'DA',
    stageId: 'stage-2',
    lessonId: 'l5-scd2-history',
    fallbackLessonId: 'l3-dimensional-modeling',
    lessonNumber: 5,
    lessonTitle: 'Historia Auditable con SCD Tipo 2 y Prevención de Data Leakage',
    plainDefinition:
      'Garantía de que, al analizar una decisión pasada o entrenar un modelo predictivo de bajas (Churn), solo utilizas la información que existía en ese segundo exacto del pasado. Usar una tabla sobrescrita con el estado de hoy introduce "fuga del futuro" (Data Leakage) y hace que los modelos fracasen en producción.',
    crossRoleConnections: {
      DE: 'Proporciona tablas SCD Tipo 2 e instantáneas inmutables en Iceberg para que cualquier estado pasado sea reproducible al 100%.',
      BI: 'Garantiza que los cierres financieros de trimestres anteriores no cambien retroactivamente cuando un cliente actualiza su perfil meses después.',
    },
    tool2026: 'Unión por intervalo de validez SCD2 / Feature Store Point-in-Time',
    syntaxExample: `SELECT f.order_id, f.order_ts, d.segment AS segmento_en_el_momento_de_compra
FROM silver.fct_orders f
JOIN silver.dim_customer_scd2 d
  ON f.customer_id = d.customer_id
  AND f.order_ts >= d.valid_from
  AND f.order_ts < COALESCE(d.valid_to, TIMESTAMP '9999-12-31');`,
    connectedIds: ['c04-asof-join', 'c07-scd-type-2', 'c18-iceberg-v3'],
  },
  {
    id: 'c09-kpi-trees-guardrails',
    number: 9,
    term: 'Árboles de KPIs, Métrica North Star y Guardrails',
    discipline: 'Business Intelligence BI',
    primaryRole: 'BI',
    stageId: 'stage-2',
    lessonId: 'l6-metrics-simpson',
    fallbackLessonId: 'l4-metrics-simpson',
    lessonNumber: 6,
    lessonTitle: 'Diseño de Métricas, Árboles de KPIs y la Paradoja de Simpson',
    plainDefinition:
      'Estructura jerárquica que descompone la métrica principal del negocio (North Star) en sus palancas operativas mediante una fórmula matemática (por ejemplo, Ingresos = Tráfico x Conversión x Ticket Medio), acompañada siempre de Métricas Guardia (Guardrails) que vigilan que optimizar una palanca no destruya otra (como el margen o las devoluciones).',
    crossRoleConnections: {
      DE: 'Modela las tablas Gold para que todos los componentes del árbol de métricas compartan dimensiones conformadas (tiempo, región, canal, segmento).',
      DA: 'Cuantifica la sensibilidad de cada rama del árbol y define los umbrales estadísticos de alerta para las métricas guardia en experimentos A/B.',
    },
    tool2026: 'MetricFlow / Cube Semantic Layer (Grafo de métricas derivadas)',
    syntaxExample: `metrics:
  - name: net_new_mrr_usd
    type: derived
    label: "MRR Neto Nuevo (North Star)"
    type_params:
      expr: new_mrr + expansion_mrr - churned_mrr
      metrics:
        - name: new_mrr
        - name: expansion_mrr
        - name: churned_mrr`,
    connectedIds: ['c10-simpsons-paradox', 'c11-additivity-hll', 'c21-semantic-layer'],
  },
  {
    id: 'c10-simpsons-paradox',
    number: 10,
    term: 'Paradoja de Simpson y Descomposición Mix vs. Tasa',
    discipline: 'Análisis DA',
    primaryRole: 'DA',
    stageId: 'stage-2',
    lessonId: 'l6-metrics-simpson',
    fallbackLessonId: 'l4-metrics-simpson',
    lessonNumber: 6,
    lessonTitle: 'Diseño de Métricas, Árboles de KPIs y la Paradoja de Simpson',
    plainDefinition:
      'Fenómeno estadístico donde una métrica mejora en absolutamente todos los segmentos por separado (por ejemplo, sube la conversión tanto en Web como en App Móvil), pero el promedio global cae porque creció mucho el volumen de tráfico del segmento con menor tasa base. La descomposición de Kitagawa separa el efecto rendimiento real del efecto cambio de mix.',
    crossRoleConnections: {
      DE: 'Persiste tanto numeradores como denominadores desglosados por las dimensiones clave de confusión (canal, país, dispositivo) para permitir el cálculo a mix constante.',
      BI: 'Incorpora en los tableros ejecutivos el indicador de "Conversión a Mix Constante" junto al promedio observado para evitar falsas alarmas en dirección.',
    },
    tool2026: 'SQL Analítico (Descomposición de Kitagawa / Oaxaca-Blinder)',
    syntaxExample: `SELECT
  ROUND(100.0 * SUM(orders_oct) / SUM(sessions_oct), 2) AS conv_observada_oct_pct,
  ROUND(100.0 * SUM((1.0 * orders_oct / sessions_oct) * weight_sep), 2) AS conv_mix_fijo_sep_pct
FROM gold.channel_mix_comparison;`,
    connectedIds: ['c09-kpi-trees-guardrails', 'c11-additivity-hll', 'c23-srm-ab-testing'],
  },
  {
    id: 'c11-additivity-hll',
    number: 11,
    term: 'Aditividad de Métricas y Sketches HyperLogLog',
    discipline: 'Business Intelligence BI',
    primaryRole: 'BI',
    stageId: 'stage-2',
    lessonId: 'l6-metrics-simpson',
    fallbackLessonId: 'l4-metrics-simpson',
    lessonNumber: 6,
    lessonTitle: 'Diseño de Métricas, Árboles de KPIs y la Paradoja de Simpson',
    plainDefinition:
      'Clasificación que determina cómo se puede resumir un número: las métricas aditivas (ventas) se suman en cualquier eje; las semi-aditivas (saldo bancario, inventario) se suman entre sucursales pero jamás entre días; y las no aditivas (tasas, conteos únicos de usuarios) requieren recalcularse desde sus componentes o mediante estructuras HyperLogLog.',
    crossRoleConnections: {
      DE: 'Almacena estructuras binarias HyperLogLog (HLL) o Theta Sketches en las tablas agregadas para poder unir conteos de usuarios únicos en milisegundos sin reescanear eventos crudos.',
      DA: 'Evita el error matemático de promediar porcentajes o sumar usuarios únicos diarios para estimar usuarios mensuales.',
    },
    tool2026: 'DuckDB / Snowflake / Apache DataSketches (`approx_count_distinct`)',
    syntaxExample: `-- Incorrecto: AVG(conversion_diaria). Correcto: razón de sumas aditivas
SELECT
  region,
  SUM(orders_count) * 1.0 / NULLIF(SUM(sessions_count), 0) AS conversion_ponderada_real,
  APPROX_COUNT_DISTINCT(user_id) AS usuarios_unicos_hll
FROM gold.fct_daily_funnel
GROUP BY region;`,
    connectedIds: ['c09-kpi-trees-guardrails', 'c10-simpsons-paradox', 'c21-semantic-layer'],
  },

  // ==========================================
  // CAPA 3: MOTORES COLUMNAR Y MEMORIA (L7 - L9)
  // ==========================================
  {
    id: 'c12-parquet-columnar',
    number: 12,
    term: 'Almacenamiento Columnar Apache Parquet y Row Groups',
    discipline: 'Ingeniería DE',
    primaryRole: 'DE',
    stageId: 'stage-3',
    lessonId: 'l7-columnar-parquet',
    fallbackLessonId: 'l5-columnar-parquet',
    lessonNumber: 7,
    lessonTitle: 'Almacenamiento por Filas vs. por Columnas: Parquet, Row Groups y Zone Maps',
    plainDefinition:
      'A diferencia de las bases transaccionales que guardan todos los campos de una fila juntos, Parquet divide la tabla en bloques horizontales (Row Groups de ~128 MB) y dentro de ellos guarda cada columna por separado (Column Chunks). Esto permite leer únicamente las 3 columnas que pide tu consulta e ignorar las otras 80 columnas en disco.',
    crossRoleConnections: {
      DA: 'Selecciona explícitamente solo las columnas necesarias en sus scripts (Projection Pushdown) para reducir el uso de RAM y multiplicar la velocidad por 20x.',
      BI: 'Obtiene respuestas sub-segundo sobre cientos de millones de registros gracias a la compresión por diccionarios (Dictionary Encoding) de columnas categóricas.',
    },
    tool2026: 'Apache Parquet con compresión ZSTD y Dictionary Encoding',
    syntaxExample: `COPY (
  SELECT event_date, country_code, customer_id, net_revenue_usd
  FROM silver.events
  ORDER BY event_date, country_code
) TO 's3://lakehouse/gold/events_sorted.parquet'
(FORMAT PARQUET, COMPRESSION ZSTD, ROW_GROUP_SIZE 1000000);`,
    connectedIds: ['c06-star-vs-obt', 'c13-zone-maps-skipping', 'c18-iceberg-v3'],
  },
  {
    id: 'c13-zone-maps-skipping',
    number: 13,
    term: 'Zone Maps (Min/Max), Bloom Filters y Data Skipping',
    discipline: 'Ingeniería DE',
    primaryRole: 'DE',
    stageId: 'stage-3',
    lessonId: 'l7-columnar-parquet',
    fallbackLessonId: 'l5-columnar-parquet',
    lessonNumber: 7,
    lessonTitle: 'Almacenamiento por Filas vs. por Columnas: Parquet, Row Groups y Zone Maps',
    plainDefinition:
      'Metadatos guardados en el pie de cada archivo Parquet que registran el valor mínimo y máximo de cada columna por bloque. Si los datos se escribieron ordenados por fecha y filtras por hoy, el motor revisa esos límites y salta el 98% de los bloques sin siquiera abrirlos (Data Skipping).',
    crossRoleConnections: {
      DA: 'Escribe filtros limpios sobre columnas crudas (predicados SARGables como `event_ts >= ...`) en vez de envolver la columna en funciones de texto que anulan los Zone Maps.',
      BI: 'Diseña selectores de fecha por defecto en cada tablero para activar el podado automático de bloques y reducir la factura de cómputo en la nube.',
    },
    tool2026: 'Parquet Page Index + Bloom Filters para alta cardinalidad',
    syntaxExample: `-- Predicado SARGable que aprovecha Zone Maps al 100%:
SELECT country_code, SUM(net_revenue_usd) AS ingresos
FROM read_parquet('s3://lakehouse/gold/events_sorted.parquet')
WHERE event_date >= DATE '2026-10-01'
  AND event_date <  DATE '2026-11-01'
GROUP BY country_code;`,
    connectedIds: ['c12-parquet-columnar', 'c15-duckdb-polars-lazy', 'c18-iceberg-v3'],
  },
  {
    id: 'c14-apache-arrow-zerocopy',
    number: 14,
    term: 'Apache Arrow Zero-Copy, SIMD y Formatos Lance / Vortex',
    discipline: 'Ingeniería DE',
    primaryRole: 'DE',
    stageId: 'stage-3',
    lessonId: 'l8-arrow-lance-vortex',
    fallbackLessonId: 'l6-duckdb-polars-arrow',
    lessonNumber: 8,
    lessonTitle: 'Apache Arrow Zero-Copy, Ejecución Vectorizada SIMD y Formatos Lance / Vortex',
    plainDefinition:
      'Apache Arrow define cómo se representan tablas columnares en memoria RAM para que DuckDB, Polars y PyArrow compartan el mismo puntero sin copiar bytes (Zero-Copy) y procesen lotes en la caché L1/L2 con instrucciones SIMD. Los formatos modernos Lance y Vortex extienden Arrow hacia acceso aleatorio O(1) e índices vectoriales.',
    crossRoleConnections: {
      DA: 'Alterna libremente entre SQL en DuckDB y expresiones en Polars o modelos en Python dentro del mismo flujo sin sufrir cuellos de botella de memoria.',
      BI: 'Conecta servidores de datos con clientes visuales mediante Arrow Flight SQL y ADBC a velocidades de gigabytes por segundo.',
    },
    tool2026: 'Apache Arrow / ADBC / Formatos Columnar Lance y Vortex',
    syntaxExample: `import polars as pl
import duckdb

# 1. Polars expone el flujo columnar en formato Arrow
lf_clientes = pl.scan_parquet("silver/customers.parquet")

# 2. DuckDB consulta lf_clientes directamente con Zero-Copy (0 copias en RAM)
tabla_arrow = duckdb.sql("SELECT segment, COUNT(*) AS n FROM lf_clientes GROUP BY 1").arrow()`,
    connectedIds: ['c12-parquet-columnar', 'c15-duckdb-polars-lazy', 'c28-mcp-semantic-rag-evals'],
  },
  {
    id: 'c15-duckdb-polars-lazy',
    number: 15,
    term: 'Polars Lazy API, DuckDB Out-of-Core y Cuadernos Marimo',
    discipline: 'Análisis DA',
    primaryRole: 'DA',
    stageId: 'stage-3',
    lessonId: 'l9-duckdb-polars-marimo',
    fallbackLessonId: 'l6-duckdb-polars-arrow',
    lessonNumber: 9,
    lessonTitle: 'DuckDB 1.x, Polars Lazy API y Notebooks Reactivos con Marimo',
    plainDefinition:
      'En lugar de cargar archivos enteros en memoria o sufrir el estado oculto de los notebooks clásicos, Polars Lazy construye un plan lógico con Predicate/Projection Pushdown, DuckDB 1.x ejecuta en paralelo con volcado a disco Out-of-Core y Marimo garantiza reactividad determinista en archivos Python puros.',
    crossRoleConnections: {
      DE: 'Reemplaza clústeres pesados y costosos por contenedores ligeros en un solo nodo para el 90% de los pipelines que procesan menos de 500 GB.',
      BI: 'Usa DuckDB-Wasm en el navegador y aplicaciones Marimo versionadas en Git para ofrecer simuladores ejecutivos instantáneos.',
    },
    tool2026: 'Polars 1.x LazyFrame (`scan_parquet`) + DuckDB 1.x + Marimo `.py`',
    syntaxExample: `import polars as pl

q = (
    pl.scan_parquet("s3://lakehouse/silver/orders/*.parquet")
    .filter(pl.col("order_date") >= pl.date(2026, 10, 1))
    .group_by("region")
    .agg(
        pl.len().alias("pedidos"),
        pl.col("net_amount_usd").sum().alias("ingresos_usd"),
    )
)
df_resultado = q.collect(engine="streaming")`,
    connectedIds: ['c13-zone-maps-skipping', 'c14-apache-arrow-zerocopy', 'c26-bi-as-code'],
  },
  {
    id: 'c16-duckdb-wasm-bi',
    number: 16,
    term: 'Analítica en el Navegador con DuckDB-Wasm',
    discipline: 'Business Intelligence BI',
    primaryRole: 'BI',
    stageId: 'stage-3',
    lessonId: 'l9-duckdb-polars-marimo',
    fallbackLessonId: 'l6-duckdb-polars-arrow',
    lessonNumber: 9,
    lessonTitle: 'DuckDB 1.x, Polars Lazy API y Notebooks Reactivos con Marimo',
    plainDefinition:
      'Versión del motor analítico DuckDB compilada a WebAssembly que se ejecuta directamente dentro de la pestaña del navegador del usuario. Permite que un dashboard interactivo filtre, agrupe y cruce millones de filas desde archivos Parquet estáticos a 60 cuadros por segundo sin latencia de red ni servidores costosos.',
    crossRoleConnections: {
      DE: 'Publica extractos Parquet optimizados y particionados en un CDN seguro con cabeceras HTTP Range Requests para que el navegador descargue solo los bloques necesarios.',
      DA: 'Comparte cuadernos interactivos reproducibles que se ejecutan en el navegador del lector sin requerir instalación de Python.',
    },
    tool2026: 'DuckDB-Wasm + Mosaic / Observable Framework / Evidence',
    syntaxExample: `// Consulta analítica ejecutada en el navegador vía DuckDB-Wasm:
const conn = await db.connect();
await conn.query(\`
  CREATE VIEW ventas_oct AS
  SELECT * FROM read_parquet('https://cdn.empresa.com/gold/ventas_2026_10.parquet');
\`);
const arrowResult = await conn.query("SELECT region, SUM(mrr) FROM ventas_oct GROUP BY 1");`,
    connectedIds: ['c14-apache-arrow-zerocopy', 'c15-duckdb-polars-lazy', 'c26-bi-as-code'],
  },

  // ==========================================
  // CAPA 4: OPEN LAKEHOUSE, CONTRATOS Y SEMÁNTICA (L10 - L12)
  // ==========================================
  {
    id: 'c17-medallion-architecture',
    number: 17,
    term: 'Arquitectura Medallion (Capas Bronze, Silver y Gold)',
    discipline: 'Ingeniería DE',
    primaryRole: 'DE',
    stageId: 'stage-4',
    lessonId: 'l10-iceberg-v3-medallion',
    fallbackLessonId: 'l7-iceberg-lakehouse',
    lessonNumber: 10,
    lessonTitle: 'Arquitectura Medallion y Apache Iceberg v3: Snapshots, Deletion Vectors y Tipo Variant',
    plainDefinition:
      'Patrón de organización del Lakehouse en tres niveles de madurez: Bronze guarda el dato crudo e inmutable tal como llegó de la fuente para poder reprocesar ante cualquier fallo; Silver limpia, deduplica, tipa y modela entidades conformadas; Gold entrega tablas agregadas y gobernadas listas para decisiones ejecutivas.',
    crossRoleConnections: {
      DA: 'Trabaja principalmente sobre la capa Silver (datos limpios al nivel más granular y con historia SCD2) para explorar hipótesis y entrenar modelos.',
      BI: 'Conecta los reportes y la Capa Semántica exclusivamente a la capa Gold, donde las reglas de negocio y SLAs están certificados.',
    },
    tool2026: 'Open Lakehouse sobre S3 / GCS con catálogo REST (Apache Polaris / Unity)',
    syntaxExample: `-- Promoción de Bronze (crudo) a Silver (tipado, validado y deduplicado):
INSERT INTO lakehouse.silver.orders
SELECT
  CAST(payload.order_id AS VARCHAR) AS order_id,
  CAST(payload.amount_cents AS DECIMAL(12,2)) / 100.0 AS amount_usd,
  CAST(payload.created_at AS TIMESTAMP) AS order_ts
FROM lakehouse.bronze.raw_webhooks
WHERE payload.order_id IS NOT NULL
QUALIFY ROW_NUMBER() OVER (PARTITION BY payload.order_id ORDER BY _ingested_at DESC) = 1;`,
    connectedIds: ['c03-window-qualify', 'c18-iceberg-v3', 'c20-sqlmesh-dbt-dag'],
  },
  {
    id: 'c18-iceberg-v3',
    number: 18,
    term: 'Apache Iceberg v3: Snapshots, Deletion Vectors, Tipo VARIANT y Patrón WAP',
    discipline: 'Ingeniería DE',
    primaryRole: 'DE',
    stageId: 'stage-4',
    lessonId: 'l10-iceberg-v3-medallion',
    fallbackLessonId: 'l7-iceberg-lakehouse',
    lessonNumber: 10,
    lessonTitle: 'Arquitectura Medallion y Apache Iceberg v3: Snapshots, Deletion Vectors y Tipo Variant',
    plainDefinition:
      'Formato abierto de tablas que añade transacciones ACID, evolución de particiones y viajes en el tiempo encima de archivos Parquet. En su especificación v3 (2026), incorpora Deletion Vectors binarios en archivos Puffin, el tipo VARIANT para datos semi-estructurados y el patrón Write-Audit-Publish (WAP).',
    crossRoleConnections: {
      DA: 'Utiliza consultas Time Travel (`FOR SYSTEM_TIME AS OF`) para reproducir exactamente el estado de los datos de cualquier fecha pasada.',
      BI: 'Lee las tablas Gold en modo Direct Lake sin sufrir nunca lecturas a medias ni bloqueos mientras ingeniería actualiza los pipelines.',
    },
    tool2026: 'Apache Iceberg v3 + Catálogo REST Apache Polaris / Nessie',
    syntaxExample: `-- Viaje en el tiempo exacto en Apache Iceberg v3:
SELECT
  region,
  SUM(net_revenue_usd) AS ingresos_snapshot_cierre
FROM lakehouse.gold.fct_orders
FOR SYSTEM_TIME AS OF TIMESTAMP '2026-10-01 00:00:00'
GROUP BY region;`,
    connectedIds: ['c08-point-in-time', 'c12-parquet-columnar', 'c17-medallion-architecture'],
  },
  {
    id: 'c19-data-contracts-odcs',
    number: 19,
    term: 'Contratos de Datos Ejecutables (Estándar ODCS v3)',
    discipline: 'Ingeniería DE',
    primaryRole: 'DE',
    stageId: 'stage-4',
    lessonId: 'l12-contracts-semantic-layer',
    fallbackLessonId: 'l8-semantic-contracts',
    lessonNumber: 12,
    lessonTitle: 'Data Contracts (ODCS v3) y Capa Semántica Unificada con MetricFlow y Cube',
    plainDefinition:
      'Acuerdo formal escrito en código YAML bajo el estándar Open Data Contract Standard (ODCS v3.0) entre el equipo de software que produce un evento y el equipo de datos que lo consume. Define columnas obligatorias, tipos, reglas de calidad y SLAs, validándose en el CI/CD antes de que un cambio rompa los pipelines.',
    crossRoleConnections: {
      DA: 'Confía en que las variables críticas de sus modelos no cambiarán de significado ni empezarán a llegar con valores nulos silenciosos tras un despliegue de backend.',
      BI: 'Elimina las mañanas de lunes con dashboards rotos por columnas renombradas sin aviso en las bases de producción.',
    },
    tool2026: 'Open Data Contract Standard (ODCS v3.0) en CI/CD',
    syntaxExample: `apiVersion: v3.0.0
kind: DataContract
id: urn:datacontract:checkout:orders_v2
schema:
  - name: order_id
    type: string
    required: true
    unique: true
  - name: net_amount_usd
    type: decimal(12,2)
    quality:
      - type: sql
        query: "SELECT COUNT(*) FROM orders WHERE net_amount_usd < 0"
        mustBe: 0`,
    connectedIds: ['c17-medallion-architecture', 'c20-sqlmesh-dbt-dag', 'c21-semantic-layer'],
  },
  {
    id: 'c20-sqlmesh-dbt-dag',
    number: 20,
    term: 'Grafos de Transformación (DAGs), AST SQLGlot y Entornos Virtuales en SQLMesh / dbt',
    discipline: 'Ingeniería DE',
    primaryRole: 'DE',
    stageId: 'stage-4',
    lessonId: 'l11-dbt-sqlmesh-dag',
    fallbackLessonId: 'l8-semantic-contracts',
    lessonNumber: 11,
    lessonTitle: 'Transformación Moderna con dbt y SQLMesh: AST SQL y Entornos Virtuales',
    plainDefinition:
      'Herramientas que convierten tus consultas SQL en un grafo ordenado de dependencias (DAG) con pruebas automáticas y linaje por columna. SQLMesh analiza el árbol sintáctico (AST vía SQLGlot) de tus consultas y crea entornos virtuales de desarrollo que solo recalculan los intervalos afectados y promueven cambios mediante punteros de vistas.',
    crossRoleConnections: {
      DA: 'Promueve sus hallazgos y nuevas variables analíticas directamente al repositorio compartido con control de versiones Git y tests unitarios.',
      BI: 'Rastrea el linaje completo de cualquier columna del dashboard hasta su tabla origen para auditar de dónde sale cada cifra.',
    },
    tool2026: 'SQLMesh + SQLGlot / dbt Core 1.9+',
    syntaxExample: `MODEL (
  name gold.fct_monthly_retention,
  kind INCREMENTAL_BY_TIME_RANGE (
    time_column cohort_month
  ),
  audits (
    not_null(columns := (cohort_month, active_customers)),
    positive_values(column := active_customers)
  )
);`,
    connectedIds: ['c02-cte-preagg', 'c19-data-contracts-odcs', 'c21-semantic-layer'],
  },
  {
    id: 'c21-semantic-layer',
    number: 21,
    term: 'Capa Semántica Gobernada (MetricFlow / Cube)',
    discipline: 'Business Intelligence BI',
    primaryRole: 'BI',
    stageId: 'stage-4',
    lessonId: 'l12-contracts-semantic-layer',
    fallbackLessonId: 'l8-semantic-contracts',
    lessonNumber: 12,
    lessonTitle: 'Data Contracts (ODCS v3) y Capa Semántica Unificada con MetricFlow y Cube',
    plainDefinition:
      'Traductor centralizado que vive encima de las tablas Gold donde se define una única vez en código la fórmula oficial de cada métrica (como MRR, Churn o Clientes Activos) y sus entidades primarias/foráneas. Cualquier herramienta (tableros BI, cuadernos Python de DA o agentes IA) consulta la Capa Semántica y recibe exactamente el mismo resultado sin riesgo de Fan-Out.',
    crossRoleConnections: {
      DE: 'Integra la validación de la Capa Semántica con el grafo de transformación para garantizar que ninguna tabla cambie sin actualizar sus métricas.',
      DA: 'Importa las métricas oficiales desde Python mediante el SDK semántico en lugar de reescribir filtros de negocio a mano en cada notebook.',
    },
    tool2026: 'dbt MetricFlow / Cube Cloud / Malloy',
    syntaxExample: `semantic_models:
  - name: subscriptions
    model: ref('fct_subscriptions')
    entities:
      - name: subscription_id
        type: primary
      - name: customer_id
        type: foreign
    measures:
      - name: active_mrr_usd
        agg: sum
        expr: CASE WHEN status = 'ACTIVE' THEN mrr_usd ELSE 0 END`,
    connectedIds: ['c01-grain-fanout', 'c09-kpi-trees-guardrails', 'c28-mcp-semantic-rag-evals'],
  },

  // ==========================================
  // CAPA 5: ESTADÍSTICA CAUSAL Y BI-AS-CODE (L13 - L15)
  // ==========================================
  {
    id: 'c22-cohort-retention-ltv',
    number: 22,
    term: 'Análisis de Cohortes, Censura por la Derecha y LTV:CAC con Margen Bruto',
    discipline: 'Análisis DA',
    primaryRole: 'DA',
    stageId: 'stage-5',
    lessonId: 'l13-cohorts-retention-ltv',
    fallbackLessonId: 'l9-ab-testing-cuped',
    lessonNumber: 13,
    lessonTitle: 'Análisis de Cohortes, Curvas de Retención, Supervivencia y LTV/CAC',
    plainDefinition:
      'Agrupación de usuarios según su mes de primera activación (cohorte) para medir qué porcentaje sigue activo (Logo Retention) y cuánto ingreso neto conserva (NRR) tras M1, M3 o M12, respetando la censura por la derecha (manteniendo NULL en meses futuros aún no vividos) y ajustando el LTV por el margen bruto real.',
    crossRoleConnections: {
      DE: 'Materializa tablas de actividad mensual por cliente con su fecha de primera activación inmutable y un Date Spine acotado a la fecha actual.',
      BI: 'Visualiza la matriz triangular de retención de logos y de ingresos netos (NRR > 100%) junto al periodo de recuperación del CAC (Payback).',
    },
    tool2026: 'SQL Analítico (Matriz triangular con `FIRST_VALUE` y `DATE_DIFF`)',
    syntaxExample: `SELECT
  c.cohort_month,
  DATE_DIFF('month', c.cohort_month, a.activity_month) AS mes_relativo,
  COUNT(DISTINCT a.customer_id) AS clientes_activos,
  SUM(a.mrr_usd * a.gross_margin_pct) AS margen_bruto_cohorte_usd
FROM silver.user_cohorts c
JOIN silver.monthly_activity a ON c.customer_id = a.customer_id
GROUP BY 1, 2;`,
    connectedIds: ['c05-window-frames', 'c09-kpi-trees-guardrails', 'c25-tufte-visual-perception'],
  },
  {
    id: 'c23-srm-ab-testing',
    number: 23,
    term: 'Sample Ratio Mismatch (SRM) y Pruebas Secuenciales en A/B Testing',
    discipline: 'Análisis DA',
    primaryRole: 'DA',
    stageId: 'stage-5',
    lessonId: 'l14-ab-testing-cuped',
    fallbackLessonId: 'l9-ab-testing-cuped',
    lessonNumber: 14,
    lessonTitle: 'Experimentación A/B Científica: Sample Ratio Mismatch (SRM), Potencia y Ajuste CUPED',
    plainDefinition:
      'El Sample Ratio Mismatch (SRM) ocurre cuando diseñas un experimento 50%/50%, pero la proporción real de usuarios asignados se desvía significativamente (por ejemplo, 51.7% vs 48.3%). Es la señal inequívoca de un fallo técnico o sesgo de supervivencia en la instrumentación que invalida por completo el experimento antes de mirar cualquier métrica.',
    crossRoleConnections: {
      DE: 'Implementa asignación determinista mediante MurmurHash3(`user_id + experiment_salt`) y audita pérdidas de telemetría en el pipeline de eventos.',
      BI: 'Bloquea automáticamente la visualización de ganadores en el dashboard de experimentación si el p-valor del test Chi-cuadrado de SRM es menor a 0.001.',
    },
    tool2026: 'Test Chi-cuadrado de SRM + Pruebas Secuenciales mSPRT en SQL / Python',
    syntaxExample: `-- Verificación automática de Sample Ratio Mismatch (SRM) 50/50:
SELECT
  COUNT_IF(variant = 'control') AS n_control,
  COUNT_IF(variant = 'treatment') AS n_treatment,
  POWER(COUNT_IF(variant = 'control') - COUNT_IF(variant = 'treatment'), 2)
    / NULLIF(COUNT(*)::DOUBLE, 0) AS chi_square_stat
FROM gold.experiment_exposures
WHERE experiment_id = 'exp_checkout_2026_10';`,
    connectedIds: ['c10-simpsons-paradox', 'c24-cuped-variance'],
  },
  {
    id: 'c24-cuped-variance',
    number: 24,
    term: 'Reducción de Varianza Pre-Experimental (CUPED)',
    discipline: 'Análisis DA',
    primaryRole: 'DA',
    stageId: 'stage-5',
    lessonId: 'l14-ab-testing-cuped',
    fallbackLessonId: 'l9-ab-testing-cuped',
    lessonNumber: 14,
    lessonTitle: 'Experimentación A/B Científica: Sample Ratio Mismatch (SRM), Potencia y Ajuste CUPED',
    plainDefinition:
      'Técnica estadística (Controlled-experiment Using Pre-Experiment Data) que utiliza el comportamiento de cada usuario durante las dos semanas previas al inicio del experimento para descontar la varianza natural entre clientes. Permite detectar impactos reales con hasta un 50% menos de tráfico y en la mitad de tiempo sin introducir sesgo.',
    crossRoleConnections: {
      DE: 'Construye el pipeline automatizado que congela las covariables pre-experimento de cada usuario en el segundo exacto previo a su primera exposición.',
      BI: 'Muestra los intervalos de confianza al 95% ajustados por CUPED junto a la estimación puntual para acelerar la toma de decisiones de producto.',
    },
    tool2026: 'Ajuste lineal por covariable en SQL (`COVAR_SAMP / VAR_SAMP`)',
    syntaxExample: `WITH theta_calc AS (
  SELECT
    COVAR_SAMP(post_rev, pre_rev_14d) / NULLIF(VAR_SAMP(pre_rev_14d), 0) AS theta,
    AVG(pre_rev_14d) AS mean_pre
  FROM gold.experiment_users
)
SELECT
  u.variant,
  AVG(u.post_rev - t.theta * (u.pre_rev_14d - t.mean_pre)) AS media_cuped_usd
FROM gold.experiment_users u CROSS JOIN theta_calc t
GROUP BY u.variant;`,
    connectedIds: ['c08-point-in-time', 'c23-srm-ab-testing', 'c25-tufte-visual-perception'],
  },
  {
    id: 'c25-tufte-visual-perception',
    number: 25,
    term: 'Percepción Visual (Tufte / Few), Small Multiples y BI-as-Code',
    discipline: 'Business Intelligence BI',
    primaryRole: 'BI',
    stageId: 'stage-5',
    lessonId: 'l15-bi-tufte-code',
    fallbackLessonId: 'l10-bi-viz-code',
    lessonNumber: 15,
    lessonTitle: 'Business Intelligence de Alto Impacto: Percepción Visual (Tufte/Few) y BI-as-Code',
    plainDefinition:
      'Principios de diseño cuantitativo basados en cómo el ojo humano decodifica longitudes alineadas con diez veces más precisión que ángulos en gráficos circulares, combinados con BI-as-Code (Evidence, Observable, Rill) para versionar reportes en Markdown + SQL dentro de Git con validación en CI/CD.',
    crossRoleConnections: {
      DA: 'Aporta bandas de incertidumbre, metas explícitas y narrativa activa (Pirámide de Minto) para que cada visualización comunique magnitud y significancia.',
      DE: 'Ejecuta la compilación del proyecto BI-as-Code en el pipeline de CI/CD para impedir que cambios de esquema rompan reportes ejecutivos.',
    },
    tool2026: 'Evidence.dev / Observable Framework / Rill + Jerarquía de Cleveland & McGill',
    syntaxExample: `<!-- reports/resumen-ejecutivo.md (BI-as-Code versionado en Git) -->
## La retención neta en LATAM subió al 114.8% (+320 bps vs meta)

\`\`\`sql kpi_latam
SELECT country, mrr_actual_usd, nrr_pct, vs_target_bps
FROM gold.fct_executive_summary
WHERE region = 'LATAM' ORDER BY mrr_actual_usd DESC
\`\`\`

<DataTable data={kpi_latam} rows=10 />`,
    connectedIds: ['c05-window-frames', 'c16-duckdb-wasm-bi', 'c24-cuped-variance'],
  },

  // ==========================================
  // CAPA 6: STREAMING REAL-TIME E IA CON MCP (L16 - L18)
  // ==========================================
  {
    id: 'c26-bi-as-code',
    number: 26,
    term: 'CDC Basado en Logs (Debezium), Transactional Outbox y WarpStream',
    discipline: 'Ingeniería DE',
    primaryRole: 'DE',
    stageId: 'stage-6',
    lessonId: 'l16-cdc-kafka-streaming',
    fallbackLessonId: 'l11-streaming-watermarks',
    lessonNumber: 16,
    lessonTitle: 'Ingesta CDC Basada en Logs (Debezium), Kafka Tiered Storage / WarpStream y Cuándo Usar Streaming',
    plainDefinition:
      'Change Data Capture (CDC) lee directamente el registro binario de transacciones (WAL en Postgres o Binlog en MySQL) para capturar inserciones, cambios y borrados físicos en milisegundos sin sobrecargar la base OLTP, apoyándose en el patrón Transactional Outbox y colas Zero-Disk sobre S3 como WarpStream.',
    crossRoleConnections: {
      DA: 'Aprovecha los estados anterior y posterior (`before` y `after`) del flujo CDC para medir tiempos exactos de transición de embudo y filtrar órdenes eliminadas (`op = "d"`).',
      BI: 'Distingue entre tableros operativos en vivo y tableros financieros auditados mostrando el indicador de latencia extremo a extremo del flujo CDC.',
    },
    tool2026: 'Debezium CDC + Patrón Outbox + Kafka Tiered Storage / WarpStream',
    syntaxExample: `WITH latest_cdc AS (
  SELECT
    COALESCE(after_order_id, before_order_id) AS order_id,
    after_amount_usd AS amount_usd,
    op,
    source_lsn
  FROM bronze.orders_cdc_stream
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY COALESCE(after_order_id, before_order_id)
    ORDER BY source_lsn DESC
  ) = 1
)
SELECT * FROM latest_cdc WHERE op != 'd';`,
    connectedIds: ['c03-window-qualify', 'c18-iceberg-v3', 'c27-cdc-flink-watermarks'],
  },
  {
    id: 'c27-cdc-flink-watermarks',
    number: 27,
    term: 'Event Time, Watermarks, Interval Joins y Vistas Materializadas en Flink',
    discipline: 'Ingeniería DE',
    primaryRole: 'DE',
    stageId: 'stage-6',
    lessonId: 'l17-flink-watermarks-mv',
    fallbackLessonId: 'l11-streaming-watermarks',
    lessonNumber: 17,
    lessonTitle: 'Apache Flink, Arroyo y Vistas Materializadas: Event Time, Watermarks y Estado Acotado',
    plainDefinition:
      'Al procesar flujos en tiempo real cuyos eventos llegan desordenados por la red móvil, Apache Flink y Arroyo agrupan por la hora real del suceso (Event Time) mediante un Watermark (reloj con holgura que indica hasta qué segundo ya no se esperan retrasos) y acotan el estado en RocksDB mediante Interval Joins.',
    crossRoleConnections: {
      DA: 'Estudia la distribución estadística del retraso de red (lateness p99) para definir cuántos segundos debe esperar el Watermark sin perder precisión ni frescura.',
      BI: 'Conecta tableros operativos en vivo a vistas materializadas incrementales (Materialize / ClickHouse) diferenciando ventanas ya cerradas de minutos en curso.',
    },
    tool2026: 'Apache Flink SQL / Arroyo + Materialize / ClickHouse',
    syntaxExample: `CREATE TABLE payments_stream (
  payment_id STRING,
  amount_usd DECIMAL(10, 2),
  event_time TIMESTAMP(3),
  WATERMARK FOR event_time AS event_time - INTERVAL '30' SECOND
) WITH ('connector' = 'kafka', 'topic' = 'prod.payments.cdc');`,
    connectedIds: ['c03-window-qualify', 'c26-bi-as-code', 'c28-mcp-semantic-rag-evals'],
  },
  {
    id: 'c28-mcp-semantic-rag-evals',
    number: 28,
    term: 'Servidores MCP, Text-to-Semantic-Layer, RAG Híbrido (BM25 + HNSW) y Golden Evals',
    discipline: 'Business Intelligence BI',
    primaryRole: 'BI',
    stageId: 'stage-6',
    lessonId: 'l18-mcp-semantic-ai-rag',
    fallbackLessonId: 'l12-mcp-ai-agents',
    lessonNumber: 18,
    lessonTitle: 'IA + Datos en Actual: Servidores MCP, Text-to-Semantic-Layer, RAG Híbrido (BM25 + HNSW) y Golden Evals',
    plainDefinition:
      'Arquitectura estándar en producción para conectar agentes de IA a los datos de la empresa sin alucinaciones. En lugar de dejar que el LLM invente SQL crudo con JOINs peligrosos, el modelo invoca herramientas gobernadas mediante Model Context Protocol (MCP) sobre la Capa Semántica, recupera contexto con búsqueda híbrida (BM25 léxico + vectores HNSW) y se audita continuamente contra un conjunto de preguntas verificadas (Golden Evals).',
    crossRoleConnections: {
      DE: 'Desarrolla el Servidor MCP en modo solo lectura con límites de costo, enmascaramiento de PII, validación sintáctica en SQLGlot e índices híbridos en DuckDB/Lance.',
      DA: 'Diseña el benchmark de Golden Evals y equipa al agente con herramientas de verificación estadística para que no confunda ruido aleatorio con hallazgos causales.',
    },
    tool2026: 'Model Context Protocol (MCP) + MetricFlow + RAG Híbrido (BM25 + RRF)',
    syntaxExample: `// Invocación gobernada desde un Agente IA hacia el Servidor MCP Semántico:
const respuesta = await mcpClient.callTool("query_governed_metrics", {
  metrics: ["net_revenue_retention_pct", "active_paying_customers"],
  dimensions: ["customer__segment", "region"],
  time_grain: "month",
  where: "metric_time >= '2026-07-01' AND metric_time < '2026-10-01'"
});`,
    connectedIds: ['c19-data-contracts-odcs', 'c21-semantic-layer', 'c27-cdc-flink-watermarks'],
  },
];

function resolveLessonTarget(concept, lessonsArray) {
  if (Array.isArray(lessonsArray) && lessonsArray.length > 0) {
    const exactMatch = lessonsArray.find((l) => l.id === concept.lessonId);
    if (exactMatch) {
      return {
        id: exactMatch.id,
        canonicalId: concept.lessonId,
        order: exactMatch.order,
        title: exactMatch.title,
        stageId: exactMatch.stageId || concept.stageId,
      };
    }
    const fallbackMatch = lessonsArray.find((l) => l.id === concept.fallbackLessonId);
    if (fallbackMatch) {
      return {
        id: fallbackMatch.id,
        canonicalId: concept.lessonId,
        order: fallbackMatch.order,
        title: fallbackMatch.title,
        stageId: fallbackMatch.stageId || concept.stageId,
      };
    }
  }
  return {
    id: concept.lessonId,
    canonicalId: concept.lessonId,
    order: concept.lessonNumber,
    title: concept.lessonTitle,
    stageId: concept.stageId,
  };
}

function getAppearingLessons(concept, allConcepts, lessonsArray) {
  if (!concept) return [];
  const seen = new Set();
  const result = [];

  const primary = resolveLessonTarget(concept, lessonsArray);
  if (primary?.id) {
    seen.add(primary.id);
    result.push(primary);
  }

  const connected = allConcepts.filter((c) => concept.connectedIds?.includes(c.id));
  for (const conn of connected) {
    const resolved = resolveLessonTarget(conn, lessonsArray);
    if (resolved?.id && !seen.has(resolved.id)) {
      seen.add(resolved.id);
      result.push(resolved);
    }
    if (result.length >= 3) break;
  }

  return result.sort((a, b) => (a.order || 0) - (b.order || 0));
}

export function GlossaryAndGraphView({ onOpenLesson }) {
  const [selectedDiscipline, setSelectedDiscipline] = useState('Todos');
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [selectedLetter, setSelectedLetter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileViewport(mobile);
      if (!mobile) {
        setMobileSheetOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const availableLetters = useMemo(() => {
    const letters = new Set();
    GLOSSARY_CONCEPTS_2026.forEach((c) => {
      const ch = c.term.charAt(0).toUpperCase();
      if (ch) letters.add(ch);
    });
    return Array.from(letters).sort((a, b) => a.localeCompare(b, 'es'));
  }, []);

  const filteredConcepts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return GLOSSARY_CONCEPTS_2026.filter((concept) => {
      const matchRole =
        selectedDiscipline === 'Todos' || concept.discipline === selectedDiscipline;
      if (!matchRole) return false;
      const matchStage =
        selectedStage === 'ALL' || concept.stageId === selectedStage;
      if (!matchStage) return false;
      const initial = concept.term.charAt(0).toUpperCase();
      const matchLetter = selectedLetter === 'ALL' || initial === selectedLetter;
      if (!matchLetter) return false;
      if (!q) return true;
      const blob = [
        concept.term,
        concept.plainDefinition,
        concept.tool2026,
        concept.syntaxExample,
      ]
        .join(' ')
        .toLowerCase();
      return blob.includes(q);
    }).sort((a, b) => a.term.localeCompare(b.term, 'es', { sensitivity: 'base' }));
  }, [selectedDiscipline, selectedStage, selectedLetter, searchQuery]);

  const [activeConceptId, setActiveConceptId] = useState(
    () =>
      [...GLOSSARY_CONCEPTS_2026].sort((a, b) =>
        a.term.localeCompare(b.term, 'es', { sensitivity: 'base' })
      )[0]?.id || GLOSSARY_CONCEPTS_2026[0].id
  );

  const activeConcept = useMemo(
    () =>
      filteredConcepts.find((c) => c.id === activeConceptId) ||
      filteredConcepts[0] ||
      GLOSSARY_CONCEPTS_2026[0],
    [filteredConcepts, activeConceptId]
  );

  const appearingLessons = useMemo(
    () => getAppearingLessons(activeConcept, GLOSSARY_CONCEPTS_2026, LESSONS),
    [activeConcept]
  );

  const handleOpenLessonTarget = (lessonTarget) => {
    setMobileSheetOpen(false);
    if (typeof onOpenLesson === 'function' && lessonTarget?.id) {
      onOpenLesson(lessonTarget.id, lessonTarget.canonicalId || lessonTarget.id);
    }
  };

  const handleSelectConcept = (conceptId) => {
    setActiveConceptId(conceptId);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobileSheetOpen(true);
    }
  };

  const otherRoles = ['DE', 'DA', 'BI'].filter((r) => r !== activeConcept?.primaryRole);
  const connectedNodes = GLOSSARY_CONCEPTS_2026.filter((c) =>
    activeConcept?.connectedIds?.includes(c.id)
  );
  const activeStageNum = activeConcept ? getStageNumber(activeConcept.stageId) : 1;
  const activeStageTheme = getStageTheme(activeStageNum);

  const renderDetailContent = () => {
    if (!activeConcept) return null;
    return (
      <div className="glos-detail-card" data-stage={activeStageNum}>
        <div className="glos-detail__meta">
          <div className="glos-detail__chips">
            <Chip variant="role" role={activeConcept.primaryRole}>
              {activeConcept.primaryRole}
            </Chip>
            <Chip variant="stage" stage={activeStageNum}>
              Etapa {activeStageNum} · {activeStageTheme.shortName}
            </Chip>
          </div>
          <span className="glos-detail__tool tabular">
            Estándar: {activeConcept.tool2026}
          </span>
        </div>

        <div>
          <h2 className="glos-detail__title">{activeConcept.term}</h2>

          {/* Aparece en: enlaces a lecciones coloreados por etapa (data-stage) */}
          <div className="glos-appears-box">
            <span className="glos-appears-box__label">Aparece en:</span>
            {appearingLessons.map((les) => {
              const lesStageNum = getStageNumber(
                les.stageId || les.id || les.order
              );
              return (
                <button
                  key={les.id}
                  type="button"
                  data-stage={lesStageNum}
                  className="glos-lesson-link"
                  onClick={() => handleOpenLessonTarget(les)}
                >
                  <span>
                    Lección {les.order}: {les.title}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="glos-definition">{activeConcept.plainDefinition}</p>
        </div>

        {/* Impacto en los roles con <Chip variant="role" role={r} /> */}
        <section className="glos-detail__sec">
          <h3 className="glos-detail__sec-title">
            Impacto cruzado en las otras disciplinas
          </h3>
          <div className="glos-roles-grid">
            {otherRoles.map((roleKey) => (
              <div key={roleKey} className="glos-role-card">
                <div className="glos-role-card__head">
                  <Chip variant="role" role={roleKey} />
                  <strong className="glos-role-card__title">
                    Conexión con {roleKey}
                  </strong>
                </div>
                <p className="glos-role-card__text">
                  {activeConcept.crossRoleConnections?.[roleKey]}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Ejemplo de código */}
        <section className="glos-detail__sec">
          <h3 className="glos-detail__sec-title">Ejemplo de código</h3>
          <pre className="code-block-dark tabular glos-code">
            <code>{activeConcept.syntaxExample}</code>
          </pre>
        </section>

        {/* Conceptos relacionados */}
        {connectedNodes.length > 0 && (
          <section className="glos-detail__sec">
            <div className="glos-related-label">
              Conceptos relacionados en el glosario:
            </div>
            <div className="glos-related-chips">
              {connectedNodes.map((node) => (
                <Chip
                  key={node.id}
                  variant="stage"
                  stage={getStageNumber(node.stageId)}
                  onClick={() => handleSelectConcept(node.id)}
                >
                  {node.term} ({node.primaryRole})
                </Chip>
              ))}
            </div>
          </section>
        )}

        <div className="glos-detail__footer">
          <Button
            variant="stage"
            stage={activeStageNum}
            size="md"
            onClick={() =>
              handleOpenLessonTarget(
                appearingLessons[0] || resolveLessonTarget(activeConcept, LESSONS)
              )
            }
          >
            Abrir lección {activeConcept.lessonNumber} →
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="sec-view">
      <header className="sec-header sec-header--stack">
        <div>
          <div className="sec-header__eyebrow tabular">
            Índice alfabético A–Z · {GLOSSARY_CONCEPTS_2026.length} términos
          </div>
          <h1 className="sec-header__title">Glosario técnico</h1>
          <p className="sec-header__lead">
            Definiciones directas con impacto cruzado entre Ingeniería (DE),
            Análisis (DA) y Business Intelligence (BI), junto a las lecciones
            donde se aplican.
          </p>
        </div>
      </header>

      {/* Buscador sticky + filtro por etapa (6 chips con color + Todas) + índice A-Z */}
      <div className="glos-sticky-controls" role="region" aria-label="Filtros del glosario">
        <div className="glos-search-row">
          <input
            type="search"
            className="lab-code-input glos-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar término (ej. Apache Arrow, ASOF JOIN, CUPED, Iceberg, MCP)..."
            aria-label="Buscar concepto en el glosario"
          />
          <div className="glos-role-filters">
            {DISCIPLINE_FILTERS.map((f) => (
              <Chip
                key={f.id}
                variant={f.roleKey === 'ALL' ? 'neutral' : 'role'}
                role={f.roleKey === 'ALL' ? undefined : f.roleKey}
                active={selectedDiscipline === f.id}
                onClick={() => setSelectedDiscipline(f.id)}
              >
                {f.label}
              </Chip>
            ))}
          </div>
        </div>

        {/* Filtro por etapa: Todas + 6 chips con color de cada etapa */}
        <div className="glos-stage-filters" aria-label="Filtrar por etapa">
          <Chip
            variant="neutral"
            active={selectedStage === 'ALL'}
            onClick={() => setSelectedStage('ALL')}
          >
            Todas
          </Chip>
          {STAGE_THEMES.map((st) => (
            <Chip
              key={st.id}
              variant="stage"
              stage={st.number}
              active={selectedStage === st.id}
              onClick={() =>
                setSelectedStage((prev) => (prev === st.id ? 'ALL' : st.id))
              }
            >
              Etapa {st.number} · {st.shortName}
            </Chip>
          ))}
        </div>

        {/* Índice A–Z */}
        <div className="glos-az-bar" aria-label="Índice alfabético A–Z">
          <button
            type="button"
            className={`glos-az-btn ${
              selectedLetter === 'ALL' ? 'glos-az-btn--active' : ''
            }`.trim()}
            onClick={() => setSelectedLetter('ALL')}
          >
            A–Z
          </button>
          {availableLetters.map((letter) => (
            <button
              key={letter}
              type="button"
              className={`glos-az-btn ${
                selectedLetter === letter ? 'glos-az-btn--active' : ''
              }`.trim()}
              onClick={() =>
                setSelectedLetter((prev) => (prev === letter ? 'ALL' : letter))
              }
              aria-label={`Filtrar por letra ${letter}`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {filteredConcepts.length === 0 ? (
        <EmptyState
          illustration={<Illustration name="empty-search" />}
          title="Sin coincidencias en el glosario"
          description={`No encontramos conceptos para "${searchQuery || selectedLetter}". Prueba otro término o limpia los filtros activos.`}
          action={{
            label: 'Restablecer búsqueda',
            variant: 'secondary',
            onClick: () => {
              setSearchQuery('');
              setSelectedDiscipline('Todos');
              setSelectedStage('ALL');
              setSelectedLetter('ALL');
            },
          }}
        />
      ) : (
        <div className="glos-layout">
          {/* Lista ordenada A–Z a la izquierda */}
          <aside
            className="glos-list-aside"
            aria-label="Lista alfabética de conceptos A–Z"
          >
            <div className="glos-list-head tabular">
              <span>Orden A–Z</span>
              <span>
                {filteredConcepts.length} de {GLOSSARY_CONCEPTS_2026.length}
              </span>
            </div>

            <div className="glos-list-items">
              {filteredConcepts.map((c) => {
                const isSelected = c.id === activeConcept?.id;
                const initialLetter = c.term.charAt(0).toUpperCase();
                const cStageNum = getStageNumber(c.stageId);
                return (
                  <button
                    key={c.id}
                    type="button"
                    data-stage={cStageNum}
                    className={`glos-term-btn ${
                      isSelected ? 'glos-term-btn--active' : ''
                    }`.trim()}
                    onClick={() => handleSelectConcept(c.id)}
                  >
                    <span className="glos-term-btn__left">
                      <span className="glos-term-btn__letter tabular">
                        {initialLetter}
                      </span>
                      <span className="glos-term-btn__label">{c.term}</span>
                    </span>
                    <Chip variant="role" role={c.primaryRole} />
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Detalle del concepto a la derecha en escritorio */}
          {activeConcept && (
            <div className="glos-detail-col">
              <Card stage={activeStageNum} accentTop>
                {renderDetailContent()}
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Sheet inferior en móvil (< 768px) al seleccionar un término */}
      <Sheet
        open={isMobileViewport && mobileSheetOpen && Boolean(activeConcept)}
        onClose={() => setMobileSheetOpen(false)}
        side="bottom"
        title={activeConcept?.term}
        subtitle={`Etapa ${activeStageNum} · ${activeConcept?.tool2026 || ''}`}
      >
        {renderDetailContent()}
      </Sheet>
    </div>
  );
}

export default GlossaryAndGraphView;
