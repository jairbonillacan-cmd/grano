import { STAGE_1_LESSONS } from './stages/stage1Sql.js';
import { STAGE_2_LESSONS } from './stages/stage2Modeling.js';
import { STAGE_3_LESSONS } from './stages/stage3Columnar.js';
import { STAGE_4_LESSONS } from './stages/stage4Lakehouse.js';
import { STAGE_5_LESSONS } from './stages/stage5AnalyticsBi.js';
import { STAGE_6_LESSONS } from './stages/stage6StreamingAi.js';

export const ROLE_META = {
  DE: {
    id: 'DE',
    label: 'Ingeniería de datos',
    short: 'DE',
    badge: 'DE',
    description:
      'Diseña tuberías de datos, almacenamiento columnar, contratos de esquema y motores de cómputo.',
  },
  DA: {
    id: 'DA',
    label: 'Análisis de datos',
    short: 'DA',
    badge: 'DA',
    description:
      'Evalúa hipótesis, aplica estadística causal, analiza cohortes de supervivencia y diseña experimentos A/B.',
  },
  BI: {
    id: 'BI',
    label: 'Business intelligence',
    short: 'BI',
    badge: 'BI',
    description:
      'Gobierna la capa semántica, estructura árboles de indicadores y publica reportes versionados.',
  },
};

export const LEARNING_STAGES = [
  {
    id: 'stage-1',
    number: 1,
    title: 'Fundamentos y SQL analítico',
    subtitle: 'El lenguaje compartido entre ingeniería, análisis y negocio',
    description:
      'Definición del grano de una tabla, control de cardinalidad en JOINs, funciones de ventana con QUALIFY y ASOF JOIN.',
    estimatedHours: '6 h',
    skills: ['Grano y fan-out', 'Window functions', 'ASOF JOIN', 'CTEs modulares'],
  },
  {
    id: 'stage-2',
    number: 2,
    title: 'Modelado dimensional y diseño de métricas',
    subtitle: 'Estructura de tablas analíticas y consistencia de indicadores',
    description:
      'Compensaciones entre esquema en estrella y tablas OBT, historial con SCD tipo 2 y descomposición de indicadores.',
    estimatedHours: '6.5 h',
    skills: ['Star schema vs OBT', 'SCD tipo 2', 'Métricas no aditivas', 'Paradoja de Simpson'],
  },
  {
    id: 'stage-3',
    number: 3,
    title: 'Motores columnares y formatos físicos',
    subtitle: 'Cómo operan el disco y la memoria en consultas analíticas',
    description:
      'Estructura interna de Parquet, memoria compartida con Apache Arrow, formatos Lance y ejecución vectorizada con DuckDB y Polars.',
    estimatedHours: '6.5 h',
    skills: ['Parquet y zone maps', 'Apache Arrow', 'Formatos Lance y Vortex', 'DuckDB y Polars'],
  },
  {
    id: 'stage-4',
    number: 4,
    title: 'Lakehouse abierto, transformación y capa semántica',
    subtitle: 'Arquitectura de almacenamiento, transformación y gobernanza',
    description:
      'Tablas transaccionales con Apache Iceberg, orquestación SQL en dbt y SQLMesh, contratos de datos y métricas centralizadas.',
    estimatedHours: '7.5 h',
    skills: ['Apache Iceberg', 'dbt y SQLMesh', 'Contratos ODCS', 'MetricFlow y Cube'],
  },
  {
    id: 'stage-5',
    number: 5,
    title: 'Estadística aplicada, experimentación y visualización',
    subtitle: 'Inferencia causal sobre datos de producto y comunicación cuantitativa',
    description:
      'Análisis de retención por cohortes, diseño de experimentos A/B con reducción CUPED, percepción visual y reportes como código.',
    estimatedHours: '7 h',
    skills: ['Cohortes y LTV', 'Pruebas A/B y CUPED', 'Percepción visual Tufte', 'BI como código'],
  },
  {
    id: 'stage-6',
    number: 6,
    title: 'Flujos en tiempo real y agentes MCP',
    subtitle: 'Captura de cambios, procesamiento continuo y protocolo MCP',
    description:
      'Replicación basada en registros con Debezium y Kafka, procesamiento con watermarks en Apache Flink y acceso mediante servidores MCP.',
    estimatedHours: '7.5 h',
    skills: ['CDC con Debezium', 'Watermarks en Flink', 'Servidores MCP', 'RAG híbrido'],
  },
];

export const LESSONS = [
  ...STAGE_1_LESSONS,
  ...STAGE_2_LESSONS,
  ...STAGE_3_LESSONS,
  ...STAGE_4_LESSONS,
  ...STAGE_5_LESSONS,
  ...STAGE_6_LESSONS,
].sort((a, b) => a.order - b.order);
