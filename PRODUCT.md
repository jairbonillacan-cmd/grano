# Product — Grano

<!-- impeccable:product-schema 1 -->

## Platform

Aplicación web local de escritorio y móvil.

## Stack

React 19 + Vite 6 + servidor HTTP local en Node.js con conexión a la suscripción Google AI Ultra del estudiante mediante el CLI `agy` (Antigravity) y laboratorio SQL en el navegador con DuckDB-Wasm.

## Users

Personas hispanohablantes que estudian por su cuenta (normalmente desde un portátil de 13–14 pulgadas o un monitor externo) para formarse desde cero hasta nivel avanzado en tres especialidades de datos: **Ingeniería de Datos (`de`)**, **Análisis de Datos (`da`)** y **Business Intelligence (`bi`)**.

## Product Purpose

**Grano** (*Escuela de datos* — *De la primera fila al tablero*) enseña a trabajar con datos mediante lectura concisa, práctica real y consulta asistida:
1. Un **tronco común** que construye la base desde cero antes de especializarse.
2. Tres **áreas profesionales** elegibles y cambiables en cualquier momento sin perder el progreso.
3. Cinco **niveles progresivos** (0 a 4) organizados en módulos con objetivos medibles y un proyecto corto por módulo.
4. Práctica sobre un único conjunto de datos ficticio coherente (**Mercado Brisa**), simuladores interactivos, repaso espaciado con FSRS y un tutor IA que responde con contexto real de la lección activa.

## Positioning

A diferencia de cursos fragmentados por herramienta o de plataformas centradas en vídeo pasivo, Grano integra lectura técnica breve, ejecución de consultas SQL reales en el navegador, simuladores visuales de conceptos internos (grano, *fan-out*, ventanas, formatos columnares, pruebas A/B, modelado dimensional) y un tutor local conectado a `agy` sin requerir claves de API externas.

## Operating Context

Funciona en `127.0.0.1` sin depender de servicios externos para su interfaz ni para sus fuentes tipográficas (IBM Plex Sans, IBM Plex Mono y Newsreader autoalojadas). El servidor local invoca `agy` en un directorio temporal aislado (`--sandbox`) únicamente cuando el estudiante consulta al tutor o solicita revisión de ejercicios.

## Arquitectura curricular: áreas y niveles

### Áreas (`tracks`)

- **`core` — Tronco común:** base compartida por todas las rutas en los niveles 0, 1 y 2 inicial, más los módulos finales de IA aplicada a datos y preparación profesional.
- **`de` — Ingeniería de Datos:** formatos columnares y motores locales (Parquet, Arrow, DuckDB, Polars), construcción de pipelines e ingesta, arquitecturas *lakehouse* (Iceberg, Delta, catálogos), transformación y calidad con dbt/SQLMesh, contratos de datos, tiempo real (CDC, Kafka, *watermarks*) y operación de plataforma.
- **`da` — Análisis de Datos:** probabilidad e inferencia estadística, exploración sistemática de datos (EDA), analítica de producto (embudos, cohortes, retención), diseño y análisis de experimentos A/B (SRM, CUPED, enfoque secuencial y bayesiano), modelos analíticos (regresión, series temporales, segmentación) e inferencia causal.
- **`bi` — Business Intelligence:** diseño de métricas y árboles de KPIs, modelado semántico en herramienta (esquema estrella, relaciones, cardinalidad), lenguaje DAX (contexto de fila y filtro, `CALCULATE`, inteligencia de tiempo), diseño visual de tableros, gobierno y seguridad por filas (RLS), y BI como código (PBIP, control de versiones, despliegue).

### Niveles (`levels`)

| Nivel | Nombre | Objetivo de aprendizaje |
| :--- | :--- | :--- |
| **Nivel 0** | Cimientos | Comprender qué es una tabla, tipos de dato, `NULL`, codificación UTF-8, hojas de cálculo estructuradas, estadística descriptiva, métricas básicas de negocio y uso inicial de terminal, Git y Python. |
| **Nivel 1** | Fundamentos | Escribir consultas SQL desde `SELECT` hasta agregaciones y funciones de fecha, combinar tablas identificando el grano y evitando *fan-out*, diseñar modelos relacionales con controles de calidad, manipular tablas en Python y elegir gráficos adecuados. |
| **Nivel 2** | Intermedio | Resolver problemas con funciones de ventana (`QUALIFY`, `ASOF JOIN`), construir modelos dimensionales (hechos, dimensiones, SCD Tipo 2, métricas no aditivas) y abordar los primeros módulos propios del área elegida. |
| **Nivel 3** | Avanzado | Profundizar en la especialidad seleccionada: *lakehouse*, transformación y contratos en DE; analítica de producto y experimentación en DA; diseño de tableros, capa semántica y gobierno en BI. |
| **Nivel 4** | Experto | Construir y operar sistemas en tiempo real y diseño de plataforma en DE; modelos predictivos e inferencia causal en DA; operación de BI como código en BI; junto con integración de datos con IA (servidores MCP, evaluación) y preparación de portafolio y entrevistas. |

## Dataset común: Mercado Brisa

Todas las lecciones prácticas utilizan **Mercado Brisa**, una empresa ficticia de supermercado en línea con tablas relacionadas (`customers`, `customer_changes`, `products`, `orders`, `order_items`, `payments`, `refunds`, `events`, `marketing_spend`, `experiments`, `experiment_assignments`, `stores`, `calendar`). Incluye anomalías documentadas (duplicados, nulos, husos horarios mezclados, precios negativos) para practicar detección y limpieza de calidad de datos.

## Principios del producto

1. **Empezar por el grano:** enseñar a identificar qué representa una fila antes de agregar, unir o graficar.
2. **Práctica verificable:** cada lección combina explicación breve, comprobaciones con retroalimentación por opción y práctica evaluada.
3. **Transparencia en la IA:** el tutor usa `agy` en tiempo real y muestra su estado real (modelo activo, tiempo de respuesta o diagnóstico claro con pasos de solución si `agy` no está disponible), sin fingir respuestas con textos pregrabados.
4. **Adaptabilidad ergonómica:** interfaz pensada para portátiles de 1280×720 y monitores grandes, con modo claro y oscuro, ajuste de escala y densidad compacta.
