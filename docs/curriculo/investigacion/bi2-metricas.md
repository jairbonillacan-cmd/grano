# Investigación y Diseño Curricular — Módulo `bi2-metricas`

**Título del módulo:** Diseño de métricas y árboles de KPIs  
**Track:** Analista BI / Analytics Engineer (`bi`) — Nivel 2 (Intermedio)  
**Prerrequisitos:** `c0-negocio` (Pensamiento analítico y contexto de negocio) y `c2-dimensional` (Modelado dimensional y calidad de datos)  
**Autor:** Agente `W-bi2-metricas` (`accessed: '2026-10-29'`)

---

## Paso 1 — Investigación de fuentes y referencias verificadas

Todas las URLs incluidas en este documento y en las cuatro lecciones del módulo fueron verificadas empíricamente mediante peticiones HTTP reales con código de respuesta `200 OK` (`accessed: '2026-10-29'`). Cada lección cuenta con al menos tres fuentes verificadas y un mínimo de dos fuentes primarias oficiales.

### Lección 1: `bi2-metricas-01-anatomia-metrica`
*Anatomía de una métrica sin ambigüedad: fórmula, grano, filtros canónicos y responsable*

1. **dbt Labs — MetricFlow & Metrics Overview (Documentación oficial, fuente primaria)**
   - URL: https://docs.getdbt.com/docs/build/metrics-overview (`accessed: '2026-10-29'`)
   - Conceptos clave extraídos: separación entre medidas físicas (`measures`) y métricas de negocio (`metrics`), declaración explícita de filtros canónicos en la definición semántica y prevención de divergencia de cálculo entre herramientas de consumo.
2. **Kimball Group — Declaring the Grain (Documentación técnica, fuente primaria)**
   - URL: https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/grain/ (`accessed: '2026-10-29'`)
   - Conceptos clave extraídos: toda métrica y tabla de hechos exige declarar primero su grano atómico; mezclar granos en una misma consulta sin preagregación produce duplicación por fan-out.
3. **Cube.dev — Measures Reference & Semantic Data Modeling (Documentación oficial, fuente primaria)**
   - URL: https://cube.dev/docs/product/data-modeling/reference/measures (`accessed: '2026-10-29'`)
   - Conceptos clave extraídos: gobernanza de medidas agregadas, filtros declarativos adjuntos a la medida y propietario de negocio responsable de revisar cambios en la regla de cálculo.
4. **DuckDB Documentation — Aggregate Functions & FILTER Clause (Documentación oficial, fuente primaria)**
   - URL: https://duckdb.org/docs/sql/query_syntax/filter.html (`accessed: '2026-10-29'`)
   - Conceptos clave extraídos: sintaxis estándar SQL `FILTER (WHERE ...)` para aislar filtros canónicos por métrica dentro de una misma consulta sin alterar el universo de otras medidas.

### Lección 2: `bi2-metricas-02-arboles-kpis-palancas`
*Construcción de árboles de KPIs: descomponer resultados en palancas operativas*

1. **dbt Labs — Semantic Layer & Metric Composition (Documentación oficial, fuente primaria)**
   - URL: https://docs.getdbt.com/docs/use-dbt-semantic-layer/dbt-sl (`accessed: '2026-10-29'`)
   - Conceptos clave extraídos: composición jerárquica de métricas derivadas y de razón a partir de medidas base auditables en la capa semántica.
2. **Cube.dev — Data Modeling Concepts (Documentación oficial, fuente primaria)**
   - URL: https://cube.dev/docs/product/data-modeling/concepts (`accessed: '2026-10-29'`)
   - Conceptos clave extraídos: descomposición aditiva (suma de segmentos o regiones) y descomposición multiplicativa (clientes por frecuencia por ticket promedio) manteniendo consistencia dimensional.
3. **Kimball Group — Conformed Dimensions (Documentación técnica, fuente primaria)**
   - URL: https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/conformed-dimension/ (`accessed: '2026-10-29'`)
   - Conceptos clave extraídos: uso de dimensiones conformadas (`customers.segment`, `customers.region`, `stores.store_type`) para desglosar árboles de KPIs sin perder comparabilidad entre áreas.
4. **Stanford Encyclopedia of Philosophy — Simpson's Paradox (Artículo académico de referencia, fuente secundaria)**
   - URL: https://plato.stanford.edu/entries/paradox-simpson/ (`accessed: '2026-10-29'`)
   - Conceptos clave extraídos: cómo un indicador agregado de primer nivel oculta movimientos opuestos en las palancas operativas por cambios en la mezcla de segmentos (efecto de composición).

### Lección 3: `bi2-metricas-03-metricas-guardia`
*Métricas guardia (guardrails): evitar que optimizar un indicador dañe otro*

1. **Kohavi, Tang & Xu — Trustworthy Online Controlled Experiments (Sitio oficial del libro de referencia, fuente primaria)**
   - URL: https://experimentguide.com/ (`accessed: '2026-10-29'`)
   - Conceptos clave extraídos: taxonomía de métricas en evaluación de iniciativas y experimentos: métrica objetivo (OEC), métricas guardia organizacionales (margen, devoluciones, cancelaciones) y métricas guardia de confiabilidad del dato como Sample Ratio Mismatch (SRM).
2. **dbt Labs — Measures & Semantic Constraints (Documentación oficial, fuente primaria)**
   - URL: https://docs.getdbt.com/docs/build/measures (`accessed: '2026-10-29'`)
   - Conceptos clave extraídos: codificación de medidas emparejadas (volumen primario junto con tasa de devolución y margen neto) para impedir reportes parciales.
3. **DuckDB Documentation — Aggregate Functions (Documentación oficial, fuente primaria)**
   - URL: https://duckdb.org/docs/sql/functions/aggregates.html (`accessed: '2026-10-29'`)
   - Conceptos clave extraídos: evaluación simultánea de métricas primarias y umbrales de guardia mediante agregaciones condicionales y expresiones `CASE WHEN`.

### Lección 4: `bi2-metricas-04-north-star-goodhart`
*Métrica estrella polar (North Star): usos legítimos, límites y ley de Goodhart*

1. **Amplitude — Funnel & Product Analytics Documentation (Documentación técnica oficial, fuente primaria)**
   - URL: https://amplitude.com/docs/analytics/charts/funnel-analysis/funnel-analysis-interpret (`accessed: '2026-10-29'`)
   - Conceptos clave extraídos: diseño de una métrica estrella polar centrada en valor entregado al cliente y articulación con métricas de entrada (inputs) que los equipos pueden accionar.
2. **dbt Labs — Semantic Models & Governance (Documentación oficial, fuente primaria)**
   - URL: https://docs.getdbt.com/docs/build/semantic-models (`accessed: '2026-10-29'`)
   - Conceptos clave extraídos: formalización de métricas compuestas que integran calidad y retención dentro del modelo semántico para evitar incentivos distorsionados.
3. **Kimball Group — Dimensional Modeling Techniques (Documentación técnica, fuente primaria)**
   - URL: https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/ (`accessed: '2026-10-29'`)
   - Conceptos clave extraídos: integración de hechos de pedidos, líneas y devoluciones para auditar si el crecimiento de volumen refleja valor neto real o volumen inflado.
4. **Goodhart's Law — Formulación de Charles Goodhart y Marilyn Strathern (Referencia enciclopédica, fuente secundaria)**
   - URL: https://en.wikipedia.org/wiki/Goodhart%27s_law (`accessed: '2026-10-29'`)
   - Conceptos clave extraídos: cuando una medida se convierte en una meta aislada deja de ser una buena medida porque los agentes optimizan el número sacrificando el propósito del sistema.

---

## Paso 2 — Mapa conceptual y encaje curricular

### Conexión con prerrequisitos (`c0-negocio` y `c2-dimensional`)
- En `c0-negocio` el estudiante aprendió a distinguir ingresos brutos, descuentos, devoluciones y costo de ventas (`c0-negocio-01`), embudos (`c0-negocio-02`), la diferencia entre KPI accionable, métrica de vanidad y métrica guardia (`c0-negocio-03`), y cómo traducir una pregunta ambigua en una decisión con umbral (`c0-negocio-04`).
- En `c2-dimensional` aprendió a modelar esquemas estrella (`c2-dimensional-02`), rastrear cambios históricos con SCD Tipo 2 (`c2-dimensional-03`) y clasificar métricas aditivas, semi-aditivas y no aditivas junto con la paradoja de Simpson (`c2-dimensional-04`).
- El módulo `bi2-metricas` une ambos mundos: toma el rigor dimensional de `c2-dimensional` y el criterio comercial de `c0-negocio` para enseñar a diseñar **contratos de métricas auditables**, descomponer resultados en **árboles de KPIs** que aíslan palancas operativas, proteger el sistema con **umbrales de guardia** comerciales y estadísticos, y gobernar una **Métrica Estrella Polar** inmune a la **Ley de Goodhart**.

### Flujo pedagógico del módulo (`bi2-metricas`)

```
[L1: Anatomía de una métrica canónica]
  Fórmula exacta + Grano declarado + Filtro canónico + Ventana temporal + Responsable (Owner)
         │
         ▼
[L2: Árboles de KPIs y palancas operativas]
  Descomposición multiplicativa: Ingreso Neto = Clientes Activos × Frecuencia × Unidades/Pedido × Precio Neto/Unidad
  Descomposición aditiva: Suma de segmentos o regiones + separación entre métrica rezagada y palanca adelantada
         │
         ▼
[L3: Métricas guardia y umbrales de veto]
  Guardias de negocio (tasa de devolución, erosión de margen) + Guardias de validez experimental (SRM p-value < 0.001)
         │
         ▼
[L4: Métrica Estrella Polar y Ley de Goodhart]
  Diseño de North Star centrada en valor neto entregado + diagnóstico de manipulación de metas de volumen bruto
```

### Términos nuevos aportados al glosario (`bi2-metricas-glossary.json`)
1. `metrica-canonica` (L1)
2. `filtro-canonico` (L1)
3. `arbol-de-kpis` (L2)
4. `palanca-operativa` (L2)
5. `metrica-rezagada-vs-adelantada` (L2)
6. `umbral-de-guardia` (L3)
7. `metrica-estrella-polar` (L4)
8. `ley-de-goodhart` (L4)

---

## Paso 4 — Verificación empírica en DuckDB sobre Mercado Brisa

Todas las cifras utilizadas en la narrativa, los ejemplos trabajados (`workedExample`), las preguntas de comprobación (`checks`) y los ejercicios prácticos (`practice`) fueron verificadas ejecutando DuckDB sobre los archivos Parquet reales de `public/datasets/`.

### Lección 1 (`bi2-metricas-01-anatomia-metrica`): Divergencia por falta de contrato vs métrica canónica
- **Conflicto entre tres áreas sobre los mismos 18,000 pedidos de `orders.parquet`:**
  - Marketing (`SUM(total_usd)` sin filtrar estado e incluyendo impuestos): `7,669,817.77` USD sobre `18,000` pedidos.
  - Operaciones (`SUM(subtotal_usd - discount_usd)` solo en `status = 'completed'`, ignorando `refunds`): `5,404,389.77` USD sobre `14,680` pedidos.
  - Finanzas (Contrato canónico de Ingreso Neto Realizado: `SUM(subtotal_usd - discount_usd - COALESCE(devuelto_usd, 0))` sobre `status IN ('completed', 'refunded')`, preagregando `refunds` por `order_id` antes del `LEFT JOIN` para evitar fan-out en los 300 pedidos con múltiples devoluciones parciales): `5,651,389.86` USD sobre `16,200` pedidos realizados (`348.85` USD de ticket neto promedio).
- **Resultado del ejercicio práctico (`practice`) por `store_type` (`status IN ('completed', 'refunded')`):**
  - `retail`: `9,229` pedidos realizados | `3,169,917.82` USD ingreso neto canónico | `343.47` USD ticket neto canónico.
  - `warehouse`: `2,880` pedidos realizados | `1,306,785.46` USD ingreso neto canónico | `453.74` USD ticket neto canónico.
  - `flagship`: `4,091` pedidos realizados | `1,174,686.58` USD ingreso neto canónico | `287.14` USD ticket neto canónico.

### Lección 2 (`bi2-metricas-02-arboles-kpis-palancas`): Árbol multiplicativo y aditivo de KPIs
- **Descomposición multiplicativa en pedidos completados (`status = 'completed'`) por `segment` (preagregando `order_items` por `order_id`):**
  - `pro_barista`: `936` clientes activos | `6,229` pedidos (`6.65` pedidos/cliente) | `28,510` unidades (`4.58` unidades/pedido) | `75.98` USD precio neto/unidad | `347.75` USD ticket neto | `2,166,164.59` USD ingreso neto.
  - `retail`: `924` clientes activos | `5,940` pedidos (`6.43` pedidos/cliente) | `27,637` unidades (`4.65` unidades/pedido) | `76.01` USD precio neto/unidad | `353.65` USD ticket neto | `2,100,652.05` USD ingreso neto.
  - `cafeteria_b2b`: `432` clientes activos | `2,591` pedidos (`6.00` pedidos/cliente) | `14,908` unidades (`5.75` unidades/pedido) | `76.31` USD precio neto/unidad | `439.05` USD ticket neto | `1,137,573.13` USD ingreso neto.
- **Descomposición por región de tienda (`stores.region`) en el ejemplo trabajado (`workedExample`):**
  - `Cono Sur`: `764` clientes | `4,920` pedidos (`6.44` pedidos/cliente) | `360.91` USD ticket neto | `1,775,677.77` USD ingreso neto | `839,893.87` USD margen bruto.
  - `Andina`: `764` clientes | `4,921` pedidos (`6.44` pedidos/cliente) | `348.70` USD ticket neto | `1,715,972.64` USD ingreso neto | `811,972.07` USD margen bruto.
  - `Iberia`: `400` clientes | `2,811` pedidos (`7.03` pedidos/cliente) | `413.50` USD ticket neto | `1,162,354.24` USD ingreso neto | `550,570.06` USD margen bruto.
  - `Norteamérica`: `364` clientes | `2,108` pedidos (`5.79` pedidos/cliente) | `355.97` USD ticket neto | `750,385.12` USD ingreso neto | `354,791.46` USD margen bruto.

### Lección 3 (`bi2-metricas-03-metricas-guardia`): Guardias de negocio en campañas y SRM en experimentos
- **Auditoría de campañas sobre pedidos capturados (`status IN ('completed', 'refunded')`, uniendo `orders`, `order_items` + `products` y `refunds`):**
  - `ORG-DIRECTO`: `5,400` pedidos | `2,929,572.03` USD venta previa a devolución | `0.00 %` tasa de devolución | `47.30 %` margen neto (`OK`).
  - `CMP-RETENCION`: `2,640` pedidos | `1,245,953.68` USD venta previa a devolución | `192,354.10` USD devueltos (`15.44 %` tasa de devolución) | `32.47 %` margen neto (`ALERTA_DEVOLUCION`).
  - `CMP-BARISTA`: `2,760` pedidos | `876,764.57` USD venta previa a devolución | `0.00 %` tasa de devolución | `46.51 %` margen neto (`OK`).
  - `CMP-VERANO`: `2,760` pedidos | `445,241.17` USD venta previa a devolución | `82,180.42` USD devueltos (`18.46 %` tasa de devolución) | `28.12 %` margen neto (`ALERTA_DEVOLUCION`).
  - `CMP-ORIGEN`: `2,640` pedidos | `428,392.93` USD venta previa a devolución | `0.00 %` tasa de devolución | `47.99 %` margen neto (`OK`).
- **Auditoría de experimentos en `experiments` + `experiment_assignments` (`workedExample`):**
  - `EXP-CHECKOUT-1STEP`, `EXP-FREE-SHIP-45`, `EXP-QUIZ-ORIGEN`, `EXP-SUB-BUNDLE` y `EXP-UPSELL-MOLINO`: `1,600` sujetos (`800` control vs `800` treatment), `srm_p_value > 0.48`, mejoras de `+6.37` a `+6.91` USD en `post_experiment_spend_usd` -> `LANZAR`.
  - `EXP-PUSH-CART`: `1,600` sujetos (`980` control vs `620` treatment), `srm_p_value = 0.0001 < 0.001`, diferencia aparente `+5.94` USD -> `BLOQUEADO_SRM` por violación del umbral de guardia estadístico.

### Lección 4 (`bi2-metricas-04-north-star-goodhart`): Ley de Goodhart y Métrica Estrella Polar
- **Evidencia de la Ley de Goodhart en `orders.parquet`:**
  - Las 4 campañas pagadas (`CMP-RETENCION`, `CMP-BARISTA`, `CMP-ORIGEN`, `CMP-VERANO`) registran exactamente `3,000` pedidos brutos cada una (`COUNT(order_id)` sin filtrar estado ni devoluciones).
  - Evaluadas por volumen bruto (`SUM(total_usd)`), `CMP-RETENCION` parece la campaña número uno (`1,648,915.21` USD) seguida de `CMP-BARISTA` (`1,109,051.51` USD), mientras `CMP-ORIGEN` (`565,542.84` USD) y `CMP-VERANO` (`561,465.69` USD) lucen casi empatadas.
  - Al aplicar la **Métrica Estrella Polar** de Mercado Brisa (`nsm_pedidos_valor_entregado`: pedidos en `status = 'completed'` con `0` USD devueltos) y el margen bruto neto tras devoluciones:
    - `CMP-BARISTA`: `2,520` pedidos NSM (`84.00 %` de sus pedidos brutos) y `407,823.94` USD de margen bruto neto (supera a `CMP-RETENCION`).
    - `CMP-RETENCION`: `1,940` pedidos NSM (`64.67 %` de sus pedidos brutos) y `404,620.44` USD de margen bruto neto (`700` pedidos tenían devolución total o parcial y `360` fueron cancelados o pendientes).
    - `CMP-ORIGEN`: `2,400` pedidos NSM (`80.00 %` de sus pedidos brutos) y `205,572.39` USD de margen bruto neto.
    - `CMP-VERANO`: `1,945` pedidos NSM (`64.83 %` de sus pedidos brutos) y `125,198.65` USD de margen bruto neto (`815` pedidos con devolución y `240` cancelados o pendientes).

---

## Paso 6 — Proyecto integrador del módulo `bi2-metricas`

### Enunciado del proyecto: Matriz de Gobernanza y Árbol de KPIs para el Comité Ejecutivo de Mercado Brisa
El directorio de Mercado Brisa debe decidir cómo reasignar el presupuesto comercial del próximo trimestre entre sus canales de adquisición (`campaigns`) y formatos de tienda (`stores.store_type`). Hasta hoy, Marketing premiaba a los líderes de campaña por alcanzar `3,000` pedidos brutos y por maximizar el GMV con impuestos (`total_usd`).

El estudiante debe entregar una consulta SQL reproducible en DuckDB y un memorando técnico de cuatro bloques que:
1. Defina el contrato canónico de **Ingreso Neto Realizado** y **Margen Bruto Neto** (fórmula, grano, filtros canónicos, ventana y propietario).
2. Descomponga el desempeño por segmento (`customers.segment`) en sus cuatro palancas operativas multiplicativas (clientes activos, frecuencia, unidades por pedido y precio neto por unidad).
3. Audite las campañas pagadas con dos umbrales de guardia explícitos: tasa de devolución sobre ingreso capturado (`<= 10 %`) y margen bruto neto (`>= 42 %`).
4. Proponga y calcule la **Métrica Estrella Polar** (`nsm_pedidos_valor_entregado`) junto con su par de métricas guardia para reemplazar la meta bruta de `3,000` pedidos que disparó la Ley de Goodhart.

### Rúbrica de evaluación del proyecto (4 criterios, escala 0 a 4)

| Criterio | 0 — No entregado | 1 — Insuficiente | 2 — Básico | 3 — Competente | 4 — Sobresaliente |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Contrato de métrica canónica y prevención de fan-out** | No define la métrica ni entrega consulta SQL. | Usa `total_usd` o no filtra estados `cancelled` y `pending`. | Filtra estados válidos pero une `order_items` y `refunds` en el mismo paso multiplicando filas. | Preagrega `order_items` (con `products`) y `refunds` en CTEs al grano `order_id` antes de unir y calcula el ingreso neto exacto. | Además documenta los 5 componentes del contrato (fórmula, grano, filtros canónicos, ventana y propietario) sin ambigüedad. |
| **2. Descomposición en árbol de KPIs y palancas operativas** | Reporta solo el ingreso total sin desglose. | Desglosa por segmento pero mezcla métricas aditivas y razones sin ponderar. | Calcula clientes activos, frecuencia y ticket promedio, pero no separa unidades por pedido de precio unitario. | Construye el árbol multiplicativo completo (`Clientes × Frecuencia × Unidades/Pedido × Precio/Unidad`) y verifica que el producto cuadra con el ingreso neto. | Identifica qué palanca adelantada explica la ventaja de `cafeteria_b2b` en ticket (`5.75` unidades/pedido) frente a `pro_barista` en frecuencia (`6.65` pedidos/cliente). |
| **3. Codificación de métricas guardia y umbrales de veto** | No incluye métricas guardia. | Menciona devoluciones en texto pero no las calcula en SQL ni define umbral. | Calcula la tasa de devolución pero usa denominadores inconsistentes entre pedidos y devoluciones. | Calcula tasa de devolución y margen neto sobre el mismo universo (`completed`, `refunded`) y etiqueta `ALERTA_DEVOLUCION` en `CMP-RETENCION` (`15.44 %`) y `CMP-VERANO` (`18.46 %`). | Integra también la verificación de confiabilidad experimental (`srm_p_value < 0.001`) explicando por qué `EXP-PUSH-CART` debe bloquearse antes de mirar su ingreso. |
| **4. Diseño de Estrella Polar y diagnóstico de Goodhart** | Propone volumen bruto de pedidos o GMV como Estrella Polar. | Propone ingreso neto sin conectarlo con entrega de valor recurrente al cliente ni guardias. | Identifica que las 4 campañas empataron en `3,000` pedidos brutos pero no cuantifica la caída en calidad entregada. | Cuantifica `nsm_pedidos_valor_entregado` (pedidos completados sin devolución) demostrando que `CMP-BARISTA` (`2,520` pedidos NSM, `407,823.94` USD margen) supera a `CMP-RETENCION` (`1,940` pedidos NSM). | Diseña un sistema completo de incentivos (Estrella Polar + palancas de entrada + umbrales de guardia) que neutraliza la manipulación por descuentos o envíos incompletos. |
