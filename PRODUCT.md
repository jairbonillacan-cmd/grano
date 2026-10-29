# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
delegated: React + Vite + Servidor Local Node.js (Express) con puente directo a la suscripción Google AI Ultra vía Antigravity (`agy`) / Gemini CLI (`gemini`).

## Users
Ingenieros de software, ingenieros de datos, analistas de datos, especialistas en Business Intelligence (BI) y estudiantes hispanohablantes que buscan dominar **Ingeniería de Datos (DE) + Análisis de Datos (DA) + Business Intelligence (BI)** de forma integrada (Ruta 0 a Experto, actualizada al 28 de octubre de 2026), comprendiendo cómo cada decisión de arquitectura técnica impacta el análisis estadístico y las métricas de negocio.

## Product Purpose
Una plataforma interactiva de aprendizaje 3-en-1 (Ingeniería de Datos, Análisis de Datos y Business Intelligence) actualizada al 28 de octubre de 2026. Cada lección cuenta con un sistema de **Lentes Tri-Perspectiva (DE ↔ DA ↔ BI)** y **Nodos Relacionados Interactivos**, permitiendo ver cómo un mismo fenómeno de datos se construye en el pipeline (DE), se explora estadísticamente y con código SQL/Polars (DA), y se modela en la Capa Semántica y dashboards ejecutivos (BI). Incluye simuladores interactivos, gráficos vivos, diagramas de arquitectura y un Copiloto IA conectado directamente a la suscripción Google AI Ultra del usuario.

## Positioning
Rompe los silos tradicionales entre Ingeniería de Datos, Análisis de Datos y BI: en cada lección y simulador el usuario puede alternar o cruzar en tiempo real las tres disciplinas sobre el mismo conjunto de datos (desde el archivo físico Parquet/Iceberg v3 hasta el test A/B bayesiano, la métrica en dbt Semantic Layer y el dashboard BI-as-Code), asistido por su suscripción local de Google AI Ultra sin necesidad de pagar claves API externas.

## Operating Context
Se ejecuta localmente en el navegador (escritorio, tablet y móvil) conectado a un servidor Node.js que invoca la sesión autenticada de Google AI Ultra (`agy` / `gemini` CLI). El estudiante navega por el currículo, activa las pestañas de conexión transversal **Ingeniería (DE) · Análisis (DA) · BI & Métricas**, manipula simuladores y gráficos interactivos, ejecuta pruebas SQL/analíticas y consulta al tutor IA contextualizado.

## Capabilities and Constraints
- **Sistema de Aprendizaje Cruzado DE + DA + BI ("Tríada de Datos 2026"):**
  - En cada lección, el usuario ve tanto el contenido central como **Tarjetas de Conexión Relacionada** y un **Conmutador de Perspectiva (DE / DA / BI / Flujo Completo)** que muestra cómo ese tema específico se conecta con las otras dos disciplinas, con enlaces directos de un clic entre lecciones relacionadas.
- **Currículo Completo actualizado al 28 de octubre de 2026:**
  1. **Fundamentos Unificados, SQL Analítico & Modelado Dimensional (DE + DA + BI):** Modelo relacional, Star Schema vs. Copo de Nieve vs. One Big Table (OBT), SCD Tipo 2, Window Functions avanzadas (`QUALIFY`, `ASOF JOIN`, frames móviles), paradoja de Simpson y errores clásicos de agregación en BI.
  2. **Motores Columnar In-Process & Notebooks Reactivos (DE + DA):** Apache Arrow, Parquet v2/Lance/Vortex, DuckDB 1.x+ (en servidor y DuckDB-Wasm en el navegador), Polars vs. Pandas, cuadernos reactivos con Marimo, ejecución vectorizada SIMD.
  3. **Open Lakehouse 2026 & Almacenamiento Moderno (DE → BI Directo):** Apache Iceberg v3 (deletion vectors, row-level lineage, variant type), Delta Lake UniForm, catálogos REST unificados (Polaris, Unity, Gravitino) y cómo BI moderno consulta el Lakehouse sin copias (Direct Lake / Zero-Copy BI).
  4. **Transformación, Calidad, Contratos y Capa Semántica (DE ↔ BI):** dbt y SQLMesh (entornos virtuales y diff semántico), Data Contracts (ODCS), OpenLineage y **Capas Semánticas Unificadas** (dbt Semantic Layer / MetricFlow, Cube, LookML) como puente único de verdad entre Ingeniería, Análisis y BI.
  5. **Streaming Real-Time, CDC y Analítica Operativa en Vivo (DE + BI Real-Time):** Kafka con Tiered Storage / WarpStream, CDC con Debezium, Apache Flink, Arroyo (Rust), bases de datos de vistas materializadas en streaming (Materialize / RisingWave) y tableros BI de baja latencia (Rill, Apache Superset, Pinot/ClickHouse).
  6. **Análisis de Datos Avanzado, Estadística Práctica & Experimentación (DA Core):** Análisis Exploratorio de Datos (EDA) riguroso, análisis de cohortes y retención, embudos de conversión, descomposición de series temporales, pruebas A/B frecuentistas y bayesianas, inferencia causal (Diff-in-Diff) y detección de anomalías.
  7. **Business Intelligence Moderno, BI-as-Code & Visualización sin Slop (BI Core):** Diseño de métricas (North Star Metric, árboles de KPIs, métricas guardia), principios de percepción visual (Tufte, Few, cero chartjunk), BI-as-Code (Evidence.dev, Observable Framework, Rill), Power BI Direct Lake / Tableau y storytelling ejecutivo con datos.
  8. **IA + Datos 2026: Agentes MCP, Text-to-SQL Semántico & GenBI (DE + DA + BI + IA):** Model Context Protocol (MCP) para conectar LLMs a bases de datos y capas semánticas, por qué el Text-to-SQL crudo falla y cómo el Text-to-Semantic-Layer triunfa, RAG Híbrido y GraphRAG sobre el Lakehouse, Agentes de Análisis Autónomo (AI Data Analysts) y evaluación de calidad (evals) para pipelines IA.
- **Puente IA Google AI Ultra (`/api/ai/query` y `/api/ai/status`):** Conecta con `agy --print` y `gemini --prompt` localmente, inyectando el contexto de la lección activa, la perspectiva seleccionada (DE, DA o BI) y el estado del simulador.

## Evidence on Hand
- Suscripción Google AI Ultra activa localmente mediante `agy.exe` y `gemini.ps1` en la máquina del usuario.
- Los datasets de los simuladores (ventas, retención de cohortes, telemetría de particiones, tests A/B y métricas de streaming) están etiquetados como simulaciones sintéticas deterministas diseñadas para enseñanza práctica.

## Product Principles
1. **Un solo fenómeno, tres lentes (DE · DA · BI):** Nunca enseñar una tabla, consulta o pipeline de forma aislada; mostrar siempre cómo se ingiere y optimiza (DE), cómo se analiza e interpreta estadísticamente (DA) y cómo se gobierna y visualiza para tomar decisiones (BI).
2. **Simulación Interactiva antes que Teoría Pasiva:** Cada módulo incluye controles interactivos, gráficos dinámicos y laboratorios donde cambiar un parámetro actualiza al instante las métricas técnicas y de negocio.
3. **Rigor Técnico Octubre 2026 (Cero Slop):** Contenido profundo, directo y honesto sobre herramientas reales de 2026 (Iceberg v3, DuckDB, Polars, SQLMesh, MetricFlow, BI-as-Code, MCP).
4. **Copiloto IA Ultra con Contexto Cruzado:** El asistente IA entiende en qué lección y bajo qué lente (DE, DA o BI) está trabajando el estudiante.
