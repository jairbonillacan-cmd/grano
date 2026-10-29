# Perfil de egreso · Business Intelligence (`bi`)

**Área:** `bi` — Business Intelligence (6 módulos de especialidad + 14 módulos de tronco común = 20 módulos, 95 lecciones, 34.4 horas estimadas)  
**Propósito:** formar especialistas en Business Intelligence e ingeniería analítica capaces de diseñar catálogos de métricas y árboles de KPIs sin ambigüedad, construir modelos semánticos en estrella sobre motores columnares (VertiPaq / Direct Lake), escribir medidas DAX con rigor y alto rendimiento, diseñar tableros ejecutivos y operativos con máxima razón dato-tinta, gobernar capas semánticas con seguridad por filas (RLS) y operar plataformas de BI como código versionadas en Git.

---

## Niveles 0, 1 y 2 (Tronco común `core`)
Antes de cursar la especialización de BI, la persona completa el tronco común (`c0-datos`, `c0-hojas`, `c0-numeros`, `c0-negocio`, `c0-herramientas`, `c1-sql-base`, `c1-sql-joins`, `c1-modelo`, `c1-python`, `c1-viz`, `c2-sql-analitico`, `c2-dimensional`), dominando SQL relacional y analítico, esquemas en estrella de Kimball, dimensiones cambiantes SCD Tipo 2, métricas no aditivas y principios de visualización honesta (ver `docs/curriculo/perfil-core.md`).

---

## Nivel 2 · Intermedio BI (`bi2-metricas`, `bi2-modelo-semantico`, `bi2-dax`)

### Qué sabe hacer la persona al terminar el Nivel 2 BI
- Definir indicadores de negocio sin ambigüedad (fórmula matemática, grano, filtros canónicos, propietario y cadencia), estructurarlos en **árboles de KPIs** que conecten la métrica *North Star* con palancas operativas e indicadores guardia (*guardrails*), y prevenir distorsiones por la ley de Goodhart.
- Construir un **modelo semántico en estrella dentro de Power BI (motor VertiPaq)**: configurar relaciones `1:N` con dirección de filtro cruzado única, evitar relaciones muchos-a-muchos directas o filtros bidireccionales peligrosos, marcar la tabla de fechas oficial, activar relaciones secundarias con `USERELATIONSHIP` y separar medidas de columnas calculadas para proteger la memoria RAM.
- Escribir medidas **DAX** legibles, exactas y rápidas dominando el contexto de fila y el contexto de filtro, la transición de contexto con `CALCULATE` y sus modificadores (`ALL`, `REMOVEFILTERS`, `KEEPFILTERS`), inteligencia de tiempo (`YTD`, `YoY`, medias móviles), funciones iteradoras (`SUMX`, `AVERAGEX`, `RANKX`), variables (`VAR` / `RETURN`) y manejo seguro de divisiones con `DIVIDE`.

### Tareas laborales reales que puede ejecutar
1. Conciliar entre finanzas, comercial y operaciones el catálogo oficial de 10 métricas de la compañía para eliminar discrepancias entre reportes departamentales.
2. Diseñar desde cero el modelo semántico en estrella en Power BI sobre las tablas del almacén y programar las medidas DAX financieras y de retención cuadradas al céntimo contra SQL.

### Entregables verificables del nivel (sobre Mercado Brisa)
- **`bi2-metricas`:** Catálogo de 10 métricas certificadas de Mercado Brisa (`orders`, `order_items`, `payments`, `refunds`, `customers`) con árbol de KPIs y consultas SQL de referencia.
- **`bi2-modelo-semantico`:** Diagrama relacional del modelo semántico en estrella, especificación de relaciones `1:N` y tabla de fechas marcada sobre `orders`, `order_items`, `products`, `customers`, `stores`, `refunds` y `calendar`.
- **`bi2-dax`:** Archivo con 10 medidas DAX (`Ingreso Neto`, `Margen %`, `YoY %`, `YTD`, `Clientes Activos`, `Ticket Medio`, entre otras) reconciliadas exactamente con DuckDB.

---

## Nivel 3 · Avanzado BI (`bi3-dashboards`, `bi3-gobierno`)

### Qué sabe hacer la persona al terminar el Nivel 3 BI
- Diseñar tableros ejecutivos y operativos aplicando la jerarquía perceptual de Cleveland y McGill, la maximización de la **razón dato-tinta** de Edward Tufte y los gráficos de bala de Stephen Few (`l15-bi-tufte-code`), estructurando la retícula para responder en 10 segundos con títulos activos (Pirámide de Minto), contraste accesible WCAG, *drill-through* y estados vacíos informativos.
- Gobernar una **capa semántica declarativa** en **MetricFlow (dbt)** o **Cube** (entidades, dimensiones, medidas y agregaciones simétricas sin *fan-out*), configurar **seguridad a nivel de fila (RLS)** estática y dinámica y protección de columnas sensibles, establecer procesos de certificación de métricas y elegir técnicamente entre modos **Import, DirectQuery, modelos compuestos y Direct Lake** sobre Parquet/Iceberg (así como sus equivalencias en LookML y Tableau).

### Tareas laborales reales que puede ejecutar
1. Rediseñar el tablero semanal del comité de dirección eliminando todo ruido gráfico e implementando perforación (*drill-through*) desde el resumen nacional hasta el detalle por tienda y producto.
2. Configurar la capa semántica gobernada y las reglas RLS para que cada gerente regional consulte únicamente los datos de sus tiendas mientras dirección general visualiza el consolidado completo.

### Entregables verificables del nivel (sobre Mercado Brisa)
- **`bi3-dashboards`:** Prototipo funcional del tablero directivo y operativo de Mercado Brisa (`orders`, `order_items`, `refunds`, `stores`, `calendar`) con títulos activos, gráficos de bala, tabla con *sparklines* y guía de uso por rol.
- **`bi3-gobierno`:** Archivo YAML de capa semántica (MetricFlow/Cube) con 5 métricas certificadas, reglas RLS por tienda y matriz de permisos sobre `orders`, `order_items`, `stores`, `customers` y `refunds`.

---

## Nivel 4 · Experto BI (`bi4-operacion`, `x4-ia-datos`, `x4-carrera`)

### Qué sabe hacer la persona al terminar el Nivel 4 BI
- Operar reportes y modelos semánticos bajo prácticas de **BI como código**: desarrollar reportes declarativos en Markdown + SQL con **Evidence**, **Observable Framework** y **Rill** sobre DuckDB-Wasm, gestionar proyectos de **Power BI (`PBIP`) y definiciones `TMDL`** en Git con revisión por Pull Request, automatizar pruebas de reconciliación en CI/CD, auditar telemetría de adopción para retirar tableros obsoletos y preparar metadatos semánticos auditables (*GenBI*) para asistentes conectados vía **MCP**.

### Entregables verificables del nivel (sobre Mercado Brisa)
- **`bi4-operacion`:** Proyecto BI-as-Code en Git (estructura `PBIP`/`TMDL` o Markdown+SQL) sobre `orders`, `order_items`, `stores`, `refunds` y `calendar` con script de validación CI y diccionario de sinónimos MCP.
- **`x4-ia-datos` y `x4-carrera`:** Servidor MCP de solo lectura evaluado con 20 *Golden Evals* y portafolio público con 3 proyectos completos de BI.
