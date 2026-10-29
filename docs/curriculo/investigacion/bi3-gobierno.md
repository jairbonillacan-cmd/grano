# Investigación curricular y diseño instruccional — Módulo `bi3-gobierno`

- **Título del módulo**: Capa semántica, seguridad y gobierno (`bi3-gobierno`)
- **Área (`track`)**: `bi` (Business Intelligence y Analítica Visual)
- **Nivel**: 3 (Avanzado — Arquitectura semántica, gobierno corporativo y rendimiento híbrido)
- **Prerrequisitos del módulo**: `bi3-dashboards` (y base técnica consolidada en `bi2-modelo-semantico`, `bi2-dax`, `bi2-metricas` y `de3-transformacion`)
- **Duración total estimada**: 115 minutos (`[25, 25, 20, 25, 20]`)
- **Dataset compartido**: Mercado Brisa (`public/datasets/*.parquet`, semilla determinista `19870315`)

---

## Paso 1 — Investigación de fuentes primarias y secundarias (verificadas HTTP 200)

Todas las fuentes citadas a continuación fueron consultadas y verificadas mediante peticiones HTTP reales (`status === 200`) el `2026-10-29`. Cada lección cuenta con al menos cuatro fuentes verificadas (mínimo tres fuentes exigidas por esquema, con al menos dos primarias de fabricante o estándar).

### Lección 1: `bi3-gobierno-01-capa-semantica-metricflow-cube`
*Capa semántica declarativa con MetricFlow y Cube: entidades, medidas y agregaciones simétricas*

| Tipo | Título | URL verificada (`200 OK`) | Editorial / Autor | Fecha de acceso | Qué respalda en la lección |
|---|---|---|---|---|---|
| Primaria | dbt Documentation — About MetricFlow | https://docs.getdbt.com/docs/build/about-metricflow | dbt Labs | 2026-10-29 | Motor de grafo semántico de MetricFlow, generación de planes SQL multi-hop y prevención de multiplicación de filas al cruzar múltiples tablas de hechos. |
| Primaria | dbt Documentation — Semantic models, entities, and measures | https://docs.getdbt.com/docs/build/semantic-models | dbt Labs | 2026-10-29 | Especificación declarativa en YAML de `semantic_models`, claves `entities` (`primary`, `foreign`, `unique`), `measures` y dimensión temporal por defecto (`agg_time_dimension`). |
| Primaria | dbt Documentation — Metrics overview | https://docs.getdbt.com/docs/build/metrics-overview | dbt Labs | 2026-10-29 | Tipología oficial de métricas en MetricFlow (`simple`, `ratio`, `cumulative`, `derived`, `conversion`) construidas sobre medidas base. |
| Primaria | Cube Documentation — Data Modeling Overview | https://docs.cube.dev/docs/data-modeling/overview | Cube Dev | 2026-10-29 | Estructura declarativa de `cubes` y `views`, separación entre medidas cuantitativas y dimensiones de corte, y exposición unificada mediante APIs SQL/REST/GraphQL. |
| Primaria | Cube Documentation — Working with Joins | https://docs.cube.dev/docs/data-modeling/joins | Cube Dev | 2026-10-29 | Relaciones dirigidas (`has_many`, `belongs_to`, `has_one`) entre cubos y resolución de trampas de abismo (chasm traps) mediante subconsultas preagregadas por grano común. |

### Lección 2: `bi3-gobierno-02-rls-estatica-dinamica-columnas`
*Seguridad a nivel de fila (RLS) estática y dinámica y protección de columnas sensibles*

| Tipo | Título | URL verificada (`200 OK`) | Editorial / Autor | Fecha de acceso | Qué respalda en la lección |
|---|---|---|---|---|---|
| Primaria | Microsoft Learn — Row-level security (RLS) with Power BI | https://learn.microsoft.com/en-us/fabric/security/service-admin-row-level-security | Microsoft Learn | 2026-10-29 | Definición de roles de seguridad a nivel de fila, diferencia entre reglas estáticas y reglas dinámicas basadas en identidad, y alcance sobre permisos de visor (`Viewer`). |
| Primaria | Microsoft Learn — Row-level security (RLS) guidance in Power BI Desktop | https://learn.microsoft.com/en-us/power-bi/guidance/rls-guidance | Microsoft Learn | 2026-10-29 | Diseño de tablas de permisos (entitlements), propagación de filtros por relaciones 1:N y riesgos de seguridad al combinar RLS con filtros bidireccionales. |
| Primaria | Microsoft Learn — Object-level security (OLS) | https://learn.microsoft.com/en-us/fabric/security/service-admin-object-level-security | Microsoft Learn | 2026-10-29 | Restricción de acceso a columnas y tablas sensibles (PII o costes unitarios) ocultando tanto los datos como los metadatos del objeto ante usuarios no autorizados. |
| Primaria | Microsoft Learn — USERPRINCIPALNAME function (DAX) | https://learn.microsoft.com/en-us/dax/userprincipalname-function-dax | Microsoft Learn | 2026-10-29 | Función DAX que devuelve el correo principal (UPN) del usuario autenticado en el servicio para cruzarlo contra la tabla de asignaciones en RLS dinámica. |

### Lección 3: `bi3-gobierno-03-certificacion-metricas-obsolescencia`
*Proceso de certificación de métricas, propiedad funcional y control de obsolescencia*

| Tipo | Título | URL verificada (`200 OK`) | Editorial / Autor | Fecha de acceso | Qué respalda en la lección |
|---|---|---|---|---|---|
| Primaria | Microsoft Learn — Endorsement: Promoting and certifying Fabric and Power BI content | https://learn.microsoft.com/en-us/fabric/governance/endorsement-overview | Microsoft Learn | 2026-10-29 | Diferencia operativa y de gobierno entre contenido promocionado (`Promoted`, autodeclarado por el equipo) y certificado (`Certified`, auditado por revisores autorizados). |
| Primaria | dbt Documentation — About model governance | https://docs.getdbt.com/docs/mesh/govern/about-model-governance | dbt Labs | 2026-10-29 | Controles de acceso (`private`, `protected`, `public`), contratos de esquema y responsabilidades del propietario funcional y técnico. |
| Primaria | dbt Documentation — Model versions and deprecation | https://docs.getdbt.com/docs/mesh/govern/model-versions | dbt Labs | 2026-10-29 | Ciclo de vida de versiones de modelos y métricas (`v1` a `v2`), ventanas de migración con `deprecation_date` y prevención de rupturas silenciosas en paneles. |
| Primaria | dbt Documentation — Exposures | https://docs.getdbt.com/docs/build/exposures | dbt Labs | 2026-10-29 | Declaración de artefactos aguas abajo (paneles, informes ejecutivos, cuadernos) con propietario (`owner.name`, `owner.email`) y nivel de madurez para análisis de impacto antes de retirar una métrica. |

### Lección 4: `bi3-gobierno-04-import-directquery-direct-lake`
*Arquitectura de rendimiento: Import, DirectQuery, modelos compuestos y Direct Lake sobre Parquet*

| Tipo | Título | URL verificada (`200 OK`) | Editorial / Autor | Fecha de acceso | Qué respalda en la lección |
|---|---|---|---|---|---|
| Primaria | Microsoft Learn — Semantic model modes in the Power BI service | https://learn.microsoft.com/en-us/power-bi/connect-data/service-dataset-modes-understand | Microsoft Learn | 2026-10-29 | Comparativa técnica entre modo Import (caché columnar VertiPaq en RAM), DirectQuery (traducción SQL en vivo al almacén) y modelos compuestos. |
| Primaria | Microsoft Learn — Use composite models in Power BI Desktop | https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-composite-models | Microsoft Learn | 2026-10-29 | Combinación de tablas Import y DirectQuery en un mismo modelo, modo de almacenamiento `Dual` para dimensiones compartidas y relaciones entre islas de origen (`source groups`). |
| Primaria | Microsoft Learn — Direct Lake overview | https://learn.microsoft.com/en-us/fabric/fundamentals/direct-lake-overview | Microsoft Learn | 2026-10-29 | Lectura directa de columnas desde archivos Parquet/Delta hacia la memoria de VertiPaq (transcodificación bajo demanda) y condiciones de repliegue (`fallback`) a DirectQuery. |
| Primaria | Cube Documentation — Using Pre-Aggregations | https://docs.cube.dev/docs/pre-aggregations/using-pre-aggregations | Cube Dev | 2026-10-29 | Tablas de resumen (`rollup`) materializadas por dimensiones y granularidad temporal que aceleran consultas en capas semánticas desacopladas. |

### Lección 5: `bi3-gobierno-05-equivalencia-lookml-tableau-pbi`
*Equivalencia de conceptos en la industria: Looker (LookML), Tableau y Power BI*

| Tipo | Título | URL verificada (`200 OK`) | Editorial / Autor | Fecha de acceso | Qué respalda en la lección |
|---|---|---|---|---|---|
| Primaria | Google Cloud Looker — What is LookML? | https://docs.cloud.google.com/looker/docs/what-is-lookml | Google Cloud | 2026-10-29 | Jerarquía declarativa de proyectos LookML: archivos `view` (dimensiones y medidas sobre tablas), `explore` (grafos de joins expuestos al usuario) y `model`. |
| Primaria | Google Cloud Looker — symmetric_aggregates parameter | https://docs.cloud.google.com/looker/docs/reference/param-explore-symmetric-aggregates | Google Cloud | 2026-10-29 | Mecanismo matemático de agregaciones simétricas en Looker basado en claves primarias (`primary_key: yes`) y funciones hash para calcular sumas y promedios exactos ante joins `1:N`. |
| Primaria | Tableau Help — How Relationships Differ from Joins (The Tableau Data Model) | https://help.tableau.com/current/pro/desktop/en-us/datasource_multitable_normalized.htm | Salesforce / Tableau | 2026-10-29 | Separación entre la capa lógica (`Relationships` contextuales que conservan el grano nativo de cada tabla) y la capa física (`Joins` estáticos que aplanan filas). |
| Primaria | Tableau Help — Overview: Level of Detail (LOD) Expressions | https://help.tableau.com/current/pro/desktop/en-us/calculations_calculatedfields_lod.htm | Salesforce / Tableau | 2026-10-29 | Semántica de evaluación de expresiones `FIXED`, `INCLUDE` y `EXCLUDE` respecto al grano visual y al orden de operaciones de filtros en Tableau. |

---

## Paso 2 — Mapa de conceptos y progresión entre las 5 lecciones

El módulo `bi3-gobierno` cierra la brecha entre construir un modelo tabular individual (`bi2-modelo-semantico`, `bi2-dax`) y operar una arquitectura corporativa de métricas donde múltiples herramientas, regiones y perfiles de usuario consumen los mismos datos sin contradicciones ni fugas de información.

```
[L1: Capa semántica declarativa (MetricFlow y Cube)]
  ├── Entidades (primary/foreign), medidas atómicas y métricas (simple, ratio, derived)
  └── Prevención de chasm traps (orders + order_items + refunds) mediante CTEs por grano
          │
          ▼
[L2: Seguridad a nivel de fila (RLS) y columna (OLS / Masking)]
  ├── RLS estática vs dinámica (USERPRINCIPALNAME() + tabla de permisos / entitlements)
  └── OLS (ocultación de metadatos de costes/PII) y enmascaramiento de atributos sensibles
          │
          ▼
[L3: Certificación de métricas, propiedad funcional y obsolescencia]
  ├── Promoted vs Certified, propietario funcional (steward) vs técnico y contratos
  └── Auditoría de deriva (drift) entre métrica heredada (v1) y certificada (v2) + deprecation_date
          │
          ▼
[L4: Arquitectura de rendimiento: Import, DirectQuery, Compuestos y Direct Lake]
  ├── Compromiso latencia vs frescura vs coste de cómputo en el almacén SQL
  └── Dimensiones Dual, tablas de agregación (rollups) y lectura directa de Parquet (Direct Lake)
          │
          ▼
[L5: Equivalencia de conceptos: Looker (LookML), Tableau y Power BI]
  ├── Traducción estructural: Semantic Model / Cube ↔ View+Explore ↔ Logical Layer ↔ Star Schema
  └── Equivalencia de grano y seguridad: Symmetric Aggregates ↔ FIXED LOD / Relationships ↔ CALCULATE + ALLEXCEPT
```

### Relación detallada por lección y conexión con prerrequisitos

1. **`bi3-gobierno-01-capa-semantica-metricflow-cube` (25 min)**:
   - **Qué retoma**: La anatomía de métricas aditivas y no aditivas (`bi2-metricas-01-anatomia-metrica`), la separación entre tabla de hechos y dimensiones (`bi2-modelo-semantico-01-estrella-vertipaq`) y la introducción a contratos de datos (`de3-transformacion-03-contracts-semantic-layer`).
   - **Qué aporta sin solapamiento**: Mientras `de3-transformacion-03` introdujo contratos ODCS v3 desde la tubería de ingeniería de datos, esta lección profundiza en el **motor de planificación de consultas de la capa semántica** (`dbt MetricFlow` y `Cube`): cómo las entidades (`primary`, `foreign`) permiten al motor construir subconsultas preagregadas por cada tabla de hechos (`orders`, `order_items`, `refunds`) antes de unirlas por la dimensión común (`stores.region`), erradicando la multiplicación artificial de filas (trampa de abismo o *chasm trap*).
   - **Tablas de Mercado Brisa**: `stores` (14 tiendas en 4 regiones), `orders` (18 000 filas; 14 760 `'completed'`), `order_items` (42 000 líneas) y `refunds` (1 450 devoluciones `'processed'`).

2. **`bi3-gobierno-02-rls-estatica-dinamica-columnas` (25 min)**:
   - **Qué retoma**: La propagación de filtros por relaciones `1:N` y los riesgos de la dirección bidireccional (`bi2-modelo-semantico-03-direccion-filtro-cruzado`).
   - **Qué aporta**: Cómo gobernar quién ve qué filas y qué columnas dentro del mismo modelo semántico. Contrasta la **RLS estática** (un rol manual por cada región) con la **RLS dinámica** basada en una tabla de permisos (`entitlements`) cruzada con `USERPRINCIPALNAME()` (o `securityContext` en Cube), incluyendo el patrón de comodín `'ALL'` para auditores corporativos. Incorpora además **Object-Level Security (OLS)** para bloquear columnas de coste (`products.unit_cost_usd`) y el **enmascaramiento de PII** (`customers.full_name`, `customers.email`).
   - **Tablas de Mercado Brisa**: `stores`, `orders`, `customers`, `products` más una tabla lógica de permisos (`rls_policy` / `rls_entitlements`).

3. **`bi3-gobierno-03-certificacion-metricas-obsolescencia` (20 min)**:
   - **Qué retoma**: El diseño de paneles ejecutivos (`bi3-dashboards-01-bi-tufte-code`) y la definición de métricas del capítulo 1.
   - **Qué aporta**: El flujo formal de gobierno corporativo: diferencia entre activos promocionados (`Promoted`) y certificados (`Certified`), separación de responsabilidades entre el **propietario funcional** (*Data Steward* de Finanzas/Operaciones, que aprueba la fórmula de negocio) y el **propietario técnico** (*Analytics Engineer*, que garantiza pruebas, linaje y SLA), y el ciclo de retiro controlado (`deprecation_date`, versionado `v1` -> `v2` y análisis de impacto mediante `exposures`). En SQL, cuantifica la **deriva de métrica (`metric drift`)** entre la definición heredada no certificada (`v1`) y la definición certificada (`v2`) por región en Mercado Brisa.
   - **Tablas de Mercado Brisa**: `stores`, `orders`, `refunds`.

4. **`bi3-gobierno-04-import-directquery-direct-lake` (25 min)**:
   - **Qué retoma**: El almacenamiento columnar en memoria VertiPaq (`bi2-modelo-semantico-01-estrella-vertipaq`) y los cuellos de botella de evaluación en DAX (`bi2-dax-06-antipatrones-rendimiento-dax`).
   - **Qué aporta**: La arquitectura física e híbrida de consulta: **Import** (baja latencia en RAM con latencia de refresco), **DirectQuery** (consulta SQL en vivo con coste de concurrencia), **Modelos compuestos** con tablas de agregación en memoria, hechos de detalle en DirectQuery y dimensiones en modo **`Dual`**, y la arquitectura **Direct Lake** sobre archivos Parquet/Delta (carga de columnas bajo demanda sin duplicar almacén ni traducir a SQL, más diagnóstico de condiciones de repliegue o *fallback* a DirectQuery). En SQL, modela una tabla de preagregación mensual por tienda y mide el factor de reducción de escaneo frente al grano crudo de `order_items`.
   - **Tablas de Mercado Brisa**: `stores`, `orders`, `order_items`, `calendar`.

5. **`bi3-gobierno-05-equivalencia-lookml-tableau-pbi` (20 min)**:
   - **Qué retoma**: Las cuatro lecciones anteriores de `bi3-gobierno`, además de `CALCULATE` y modificadores de contexto (`bi2-dax-02-calculate-modificadores`).
   - **Qué aporta**: Un marco riguroso de traducción conceptual entre **Looker (LookML)**, **Tableau** y **Power BI** (junto con MetricFlow/Cube). Demuestra que los problemas de grano mixto, fan-out, seguridad por usuario y caché de agregaciones son universales y enseña la correspondencia exacta: `explore` + `symmetric_aggregates` en LookML ↔ `Relationships` (capa lógica) + expresiones `FIXED` LOD en Tableau ↔ esquema en estrella + `CALCULATE` / `ALLEXCEPT` en Power BI. En SQL, traduce una expresión `FIXED` LOD / `ALLEXCEPT` por región y tipo de tienda para calcular cuotas regionales libres de distorsión de filtro.
   - **Tablas de Mercado Brisa**: `stores`, `orders`, `order_items`.

---

## Paso 6 — Proyecto integrador del módulo `bi3-gobierno` y rúbrica de evaluación

### Especificación del proyecto del módulo: Auditoría de gobierno, capa semántica y seguridad para el Comité Ejecutivo de Mercado Brisa

- **Contexto de negocio**: Mercado Brisa opera 14 tiendas y almacenes en 4 regiones (`Andina`, `Cono Sur`, `Iberia` y `Norteamérica`). El Comité Ejecutivo detectó tres incidentes graves antes del cierre trimestral:
  1. Un informe que unía `orders`, `order_items` y `refunds` en una sola consulta SQL infló los ingresos brutos de la región `Andina` a `5 696 401.57 USD` (cuando el valor real de pedidos completados es `1 990 554.12 USD`) y duplicó las devoluciones hasta `279 106.05 USD` (frente a `115 379.23 USD` reales).
  2. Los gerentes regionales tenían acceso en abierto a los pedidos de otras regiones y a los correos personales (`customers.email`) de los clientes.
  3. Dos paneles comerciales seguían reportando la métrica heredada `v1_gross_revenue` (que incluye pedidos `cancelled`, `pending` y `refunded` sin descontar devoluciones), generando una sobreestimación de entre `26.52 %` y `29.85 %` frente a la métrica certificada `v2_certified_net_revenue`.
- **Entregables técnicos del estudiante**:
  1. **Consulta semántica multi-hecho libre de fan-out (Lección 1 y Lección 5)**: Consulta SQL estructurada en CTEs por entidad/grano (`orders_sem`, `items_sem`, `refunds_sem`) que reproduzca el plan de MetricFlow/Cube para obtener por cada `region`: `completed_orders`, `units_sold`, `gross_revenue_usd`, `refunded_usd`, `net_revenue_usd` y `net_aov_usd`, más la cuota de ingreso de cada `store_type` dentro de su región (`FIXED` LOD / `ALLEXCEPT`).
  2. **Vista gobernada con RLS dinámica y enmascaramiento de PII (Lección 2)**: Consulta parametrizada por tabla de permisos (`rls_entitlements`) que filtre automáticamente las filas autorizadas según el `user_email` activo (respetando el comodín `'ALL'` para auditoría global) y enmascare `full_name` y `email` de `customers`.
  3. **Informe de deriva de certificación y plan de preagregación (Lección 3 y Lección 4)**: Tabla de reconciliación entre `legacy_v1_revenue_usd` y `certified_v2_net_usd` con cálculo de `discrepancy_usd` y `drift_pct`, acompañada de una tabla de rollup mensual por tienda que cuantifique el factor de compresión de filas (`compression_factor_x`) para alimentar un modelo compuesto o Direct Lake.

### Rúbrica de evaluación (4 criterios en escala 0–4)

| Criterio | 0 — No entregado / Incorrecto | 1 — Insuficiente | 2 — Básico / Funcional parcial | 3 — Competente | 4 — Excelente (Estándar de producción) |
|---|---|---|---|---|---|
| **1. Modelado semántico y prevención de fan-out (MetricFlow / Cube / LookML)** | No entrega consulta o une `orders`, `order_items` y `refunds` en un único `FROM` sin preagregar, inflando `SUM(total_usd)` y `SUM(refund_amount_usd)`. | Intenta usar `DISTINCT` sobre el importe (`SUM(DISTINCT total_usd)`), lo que elimina importes legítimamente iguales entre pedidos distintos. | Preagrega `order_items` pero une `refunds` directamente sin agrupar por `order_id` o `region`, o viceversa. | Preagrega cada tabla de hechos a su grano correcto en CTEs separadas antes de cruzar por `region`, obteniendo totales exactos de pedidos, unidades y devoluciones. | Preagrega limpiamente cada entidad semántica, documenta la equivalencia declarativa en YAML (MetricFlow/Cube) y calcula métricas derivadas (`net_revenue_usd`) y de razón (`net_aov_usd`) con redondeo a 2 decimales. |
| **2. Seguridad a nivel de fila (RLS dinámica) y protección de columnas (OLS / PII)** | No aplica filtro por usuario ni oculta columnas sensibles; expone todas las regiones y el correo completo de los clientes. | Aplica un filtro estático (`WHERE region = 'Andina'`) codificado a fuego sin tabla de permisos ni soporte para múltiples roles. | Usa tabla de permisos por `user_email`, pero no contempla el rol corporativo `'ALL'` o deja `full_name` / `email` en texto plano. | Implementa RLS dinámica mediante `JOIN` con tabla de permisos (`allowed_region = 'ALL' OR allowed_region = s.region`) y enmascara `full_name` y `email`. | Implementa RLS dinámica completa, enmascara PII conservando solo la inicial y el dominio para trazabilidad, y justifica por qué la relación entre permisos y dimensiones debe mantener filtro unidireccional (`1:N`) y qué columnas requieren OLS (`unit_cost_usd`). |
| **3. Certificación de métricas, propiedad funcional y auditoría de obsolescencia** | No distingue entre métrica heredada y certificada ni calcula la discrepancia entre ambas. | Calcula solo una de las dos versiones o filtra erróneamente `refunds` sin considerar el estado `'processed'` ni los pedidos `'completed'`. | Calcula ambas versiones pero omite `COALESCE` en pedidos sin devoluciones (generando `NULL` en ingresos netos) o no calcula el porcentaje de deriva (`drift_pct`). | Cuantifica con exactitud `legacy_v1_revenue_usd`, `certified_v2_net_usd`, `discrepancy_usd` y `drift_pct` por región, identificando la sobreestimación del `26.52 %` al `29.85 %`. | Cuantifica la deriva exacta por región y canal, asigna propietario funcional (*Data Steward*) y técnico, y define el contrato de migración de `v1` a `v2` con `deprecation_date` y registro de `exposures` afectadas. |
| **4. Arquitectura de almacenamiento (Import / DirectQuery / Direct Lake) y equivalencia multi-herramienta** | Confunde los modos de almacenamiento y no calcula ni la compresión del rollup ni la cuota regional por tipo de tienda. | Describe verbalmente Import y DirectQuery sin métricas cuantitativas de cardinalidad ni consulta de cuota regional. | Calcula el conteo de filas crudas (`42 000`) frente al agregado mensual por tienda, pero falla al calcular el denominador fijo por región (`FIXED` LOD / `ALLEXCEPT`). | Calcula el factor de compresión de filas por región (`43.5x` a `131.9x`) conservando el total exacto de ventas, y resuelve la cuota de `store_type` sobre su `region` con CTE o función de ventana. | Resuelve con precisión el análisis de compresión y la cuota regional, especifica qué tablas van en `Import`, `DirectQuery`, `Dual` o `Direct Lake` (incluyendo causas de *fallback*), y traduce el cálculo de cuota entre LookML, Tableau (`FIXED`) y Power BI (`CALCULATE` + `ALLEXCEPT`). |
