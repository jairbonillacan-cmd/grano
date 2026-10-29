const lesson = {
  id: 'de2-pipelines-01-etl-vs-elt',
  moduleId: 'de2-pipelines',
  tracks: ['de'],
  level: 2,
  order: 1,
  title: 'Patrones ETL frente a ELT y almacenamiento desacoplado',
  subtitle: 'Patrones ETL frente a ELT: dónde transformar y cómo desacoplar el almacenamiento',
  minutes: 20,
  prerequisites: ['de2-formatos-01', 'c1-python-02'],
  contentVersion: 2,

  hook: 'El lunes por la mañana, contabilidad de Mercado Brisa reclama una diferencia de 601.442,83 USD en la categoría Molinos frente al tablero comercial. El script nocturno modificaba los pedidos en memoria antes de guardarlos y descartaba filas con precios negativos o estados cancelados sin conservar el archivo original. Cuando la regla fiscal cambió a mitad de trimestre, nadie pudo reconstruir las ventas históricas. ¿Cómo diseñas el flujo para preservar la evidencia intacta y recalcular las reglas cuantas veces sea necesario?',

  objectives: [
    'Distinguir cuándo transformar antes de cargar (ETL) y cuándo aterrizar el dato crudo antes de transformar en SQL (ELT).',
    'Diseñar el desacoplamiento entre almacenamiento de objetos en Parquet y cómputo analítico mediante las capas Bronce, Plata y Oro.',
    'Auditar en SQL la diferencia exacta entre registros crudos de aterrizaje y modelos limpios de la capa Plata en Mercado Brisa.'
  ],

  sections: [
    {
      id: 'etl-clasico-vs-elt-moderno',
      heading: 'Dónde ocurre la transformación: ETL frente a ELT',
      body: 'En un flujo **ETL tradicional** (*Extract, Transform, Load*), un servidor intermedio extrae registros del sistema origen y aplica filtros en memoria. Luego carga únicamente el resultado depurado en el almacén analítico. Este esquema ahorraba disco cuando almacenamiento y procesador compartían un mismo servidor físico. Sin embargo, entraña un riesgo severo. Si el script contiene un error lógico o cambia una regla contable, el dato crudo ya no existe para auditar ni recalcular el pasado.\n\nEl patrón **ELT desacoplado** (*Extract, Load, Transform*) invierte las dos últimas fases. Primero extrae y aterriza una copia fiel del origen en almacenamiento de objetos económico. Después delega las transformaciones al motor columnar como DuckDB, Snowflake o BigQuery. En Mercado Brisa, la tabla `products` llega con **180 productos**, incluyendo 10 SKUs inactivos y un accesorio con precio `-9,99 USD`. Aterrizar todo en crudo y filtrar en una etapa posterior preserva la trazabilidad completa.',
      interactive: {
        component: 'row-vs-columnar-storage',
        caption: 'Simulador interactivo: Almacenamiento columnar Parquet en el patrón ELT desacoplado.'
      },
      example: {
        language: 'sql',
        code: `SELECT
  category,
  COUNT(*) AS raw_skus,
  ROUND(MIN(list_price_usd), 2) AS raw_min_price_usd,
  COUNT(*) FILTER (WHERE is_active = true AND list_price_usd > 0) AS silver_active_skus,
  ROUND(MIN(list_price_usd) FILTER (WHERE is_active = true AND list_price_usd > 0), 2) AS silver_min_price_usd
FROM products
GROUP BY category
ORDER BY category;`,
        expectedOutput: [
          { category: 'Accesorios', raw_skus: 37, raw_min_price_usd: -9.99, silver_active_skus: 34, silver_min_price_usd: 11.92 },
          { category: 'Cafeteras', raw_skus: 36, raw_min_price_usd: 38.9, silver_active_skus: 34, silver_min_price_usd: 38.9 },
          { category: 'Café en grano', raw_skus: 36, raw_min_price_usd: 15.25, silver_active_skus: 34, silver_min_price_usd: 15.25 },
          { category: 'Molinos', raw_skus: 36, raw_min_price_usd: 69.7, silver_active_skus: 34, silver_min_price_usd: 69.7 },
          { category: 'Suscripciones', raw_skus: 35, raw_min_price_usd: 24.62, silver_active_skus: 34, silver_min_price_usd: 24.62 }
        ]
      }
    },
    {
      id: 'desacoplamiento-almacenamiento-computo',
      heading: 'Desacoplar almacenamiento y cómputo en arquitecturas de capas',
      body: 'En los almacenes monolíticos antiguos, ampliar el disco obligaba a pagar también por más núcleos de procesador todo el día. Las arquitecturas actuales separan ambos recursos. El **almacenamiento de objetos** (Amazon S3, Google Cloud Storage o Azure Blob) conserva terabytes en Parquet a bajo costo mensual. Por su parte, el **cómputo analítico** se enciende bajo demanda sólo durante los minutos que dura la transformación.\n\nPara organizar ese almacenamiento sin crear un pantano de archivos, dividimos el flujo en tres niveles llamados arquitectura Medallion. La **capa Bronce** guarda cada lote recibido en su estructura original junto con metadatos de ingesta (`_ingested_at`, `_source_file`) y nunca se edita a mano. La **capa Plata** convierte tipos, elimina duplicados técnicos y filtra pruebas o precios inválidos. Finalmente, la **capa Oro** publica tablas agregadas por día, tienda o categoría listas para reportes ejecutivos. Sólo usamos ETL previo a Bronce cuando una ley obliga a enmascarar datos personales o tarjetas PCI-DSS antes de tocar el disco.',
      example: {
        language: 'python',
        code: `from pathlib import Path
import duckdb

def promote_products_to_silver(bronze_parquet: Path, silver_parquet: Path) -> int:
    """Lee el archivo Parquet crudo de Bronce y materializa la capa Plata limpia."""
    silver_parquet.parent.mkdir(parents=True, exist_ok=True)
    with duckdb.connect() as con:
        con.execute(
            """
            COPY (
                SELECT
                    product_id,
                    TRIM(sku) AS sku,
                    TRIM(name) AS product_name,
                    category,
                    ROUND(price_usd, 2) AS price_usd,
                    ROUND(cost_usd, 2) AS cost_usd
                FROM read_parquet(?)
                WHERE is_active = true
                  AND price_usd > 0
                  AND cost_usd > 0
            ) TO ? (FORMAT PARQUET, COMPRESSION ZSTD);
            """,
            [str(bronze_parquet), str(silver_parquet)],
        )
        return con.execute("SELECT COUNT(*) FROM read_parquet(?)", [str(silver_parquet)]).fetchone()[0]`
      }
    },
    {
      id: 'trazabilidad-reconciliacion-capas',
      heading: 'Trazabilidad y reconciliación cuantitativa entre Bronce y Plata',
      body: 'Separar la carga cruda de la transformación permite responder con exactitud a cualquier auditoría financiera. Cuando dirección pregunta por qué el ingreso reportado en la capa Oro difiere del volcado bruto del sistema de cajas, podemos consultar Bronce y Plata a la vez. Todo ocurre dentro del mismo motor SQL.\n\nEn Mercado Brisa, la tabla `order_items` contiene **42.000 líneas de detalle** que suman `6.682.464,31 USD` en bruto. Sin embargo, ese volumen crudo mezcla pedidos en estado `cancelled`, `refunded` y `pending`. También incluye líneas asociadas a los 10 productos inactivos o con precio negativo en `products`. Al aplicar las reglas de promoción hacia la **capa Plata**, conservamos sólo pedidos con `status = \'completed\'`, cantidades positivas y productos activos con `price_usd > 0`. El volumen válido se reduce así a **32.596 líneas** y `5.183.516,09 USD`.\n\nConstruir consultas que midan lado a lado las métricas crudas (`raw_lines`, `raw_revenue_usd`) y las métricas depuradas (`silver_lines`, `silver_revenue_usd`) convierte una discusión subjetiva en una conciliación verificable.',
      example: {
        language: 'sql',
        code: `SELECT
  o.status,
  COUNT(DISTINCT o.order_id) AS orders_count,
  SUM(oi.qty) AS total_units,
  ROUND(SUM(oi.line_total_usd), 2) AS raw_line_revenue_usd
FROM orders o
INNER JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY o.status
ORDER BY raw_line_revenue_usd DESC;`,
        expectedOutput: [
          { status: 'completed', orders_count: 14760, total_units: 71050, raw_line_revenue_usd: 5464151.18 },
          { status: 'refunded', orders_count: 1440, total_units: 6885, raw_line_revenue_usd: 527078.6 },
          { status: 'cancelled', orders_count: 1080, total_units: 5463, raw_line_revenue_usd: 424380.27 },
          { status: 'pending', orders_count: 720, total_units: 3514, raw_line_revenue_usd: 266854.26 }
        ]
      }
    }
  ],

  workedExample: {
    title: 'Auditoría ELT en Mercado Brisa: volcado crudo frente a capa Plata por categoría',
    description: 'El equipo comercial sumó directamente todas las líneas de `order_items` para reportar ventas por categoría, inflando los ingresos con pedidos no completados y SKUs inválidos.',
    audit: 'Al promover de Bronce a Plata con las reglas de negocio en SQL, el ingreso de las 5 categorías pasa de 6.682.464,31 USD (42.000 líneas) a 5.183.516,09 USD (32.596 líneas).',
    steps: [
      {
        label: 'Paso 1 — Diagnóstico del agregado crudo sin reglas de capa Plata',
        explanation: 'Agrupar el volcado crudo por estado de pedido revela que más de 1,21 millones de dólares provienen de pedidos reembolsados, cancelados o pendientes.',
        code: `SELECT
  o.status,
  COUNT(DISTINCT o.order_id) AS orders_count,
  SUM(oi.qty) AS total_units,
  ROUND(SUM(oi.line_total_usd), 2) AS raw_line_revenue_usd
FROM orders o
INNER JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY o.status
ORDER BY raw_line_revenue_usd DESC;`,
        expectedOutput: [
          { status: 'completed', orders_count: 14760, total_units: 71050, raw_line_revenue_usd: 5464151.18 },
          { status: 'refunded', orders_count: 1440, total_units: 6885, raw_line_revenue_usd: 527078.6 },
          { status: 'cancelled', orders_count: 1080, total_units: 5463, raw_line_revenue_usd: 424380.27 },
          { status: 'pending', orders_count: 720, total_units: 3514, raw_line_revenue_usd: 266854.26 }
        ]
      },
      {
        label: 'Paso 2 — Transformación ELT hacia la capa Plata filtrando pedidos y SKUs válidos',
        explanation: 'Sin modificar los archivos Parquet de Bronce, la consulta aplica las condiciones de calidad y entrega el ingreso limpio por categoría.',
        code: `SELECT
  p.category,
  COUNT(DISTINCT o.order_id) AS completed_orders,
  SUM(oi.qty) AS valid_units,
  ROUND(SUM(oi.line_total_usd), 2) AS silver_revenue_usd
FROM orders o
INNER JOIN order_items oi ON o.order_id = oi.order_id
INNER JOIN products p ON oi.product_id = p.product_id
WHERE o.status = 'completed'
  AND p.is_active = true
  AND p.list_price_usd > 0
GROUP BY p.category
ORDER BY silver_revenue_usd DESC;`,
        expectedOutput: [
          { category: 'Molinos', completed_orders: 5971, valid_units: 13544, silver_revenue_usd: 2050139.35 },
          { category: 'Cafeteras', completed_orders: 5868, valid_units: 13471, silver_revenue_usd: 1553853.63 },
          { category: 'Suscripciones', completed_orders: 5974, valid_units: 13469, silver_revenue_usd: 640433.31 },
          { category: 'Accesorios', completed_orders: 5973, valid_units: 13532, silver_revenue_usd: 548837.68 },
          { category: 'Café en grano', completed_orders: 5972, valid_units: 13451, silver_revenue_usd: 390252.12 }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: 'En Mercado Brisa cambia la regla fiscal y ahora los pedidos con estado "refunded" deben reportarse en una columna separada desde el inicio del año. ¿Por qué el diseño ELT con capa Bronce permite resolverlo sin volver a consultar el ERP?',
      options: [
        {
          id: 'a',
          text: 'Porque la capa Bronce conserva los archivos Parquet crudos con todos los estados originales listos para reejecutar la vista SQL.',
          correct: true,
          feedback: 'Correcto. Al no haber eliminado filas durante la extracción, basta con ajustar la consulta SQL que construye las capas Plata y Oro.'
        },
        {
          id: 'b',
          text: 'Porque los archivos Parquet actualizan automáticamente sus fórmulas internas cuando cambia el esquema del ERP.',
          correct: false,
          feedback: 'Incorrecto. Parquet es un formato de almacenamiento columnar estático; no ejecuta lógica ni se sincroniza solo con el sistema origen.'
        },
        {
          id: 'c',
          text: 'Porque en ELT no existen filtros ni validaciones de calidad en ninguna etapa del flujo de datos.',
          correct: false,
          feedback: 'Incorrecto. En ELT sí se aplican validaciones estrictas, pero ocurren al promover los datos de Bronce a Plata y Oro dentro del motor.'
        }
      ],
      explanation: 'Almacenar el lote crudo inmutable en la capa Bronce desacopla la captura del dato de las reglas de negocio vigentes en ese instante. Si una definición contable cambia meses después, el equipo modifica la transformación SQL hacia Plata sin depender del historial del ERP.'
    },
    {
      id: 'c2',
      type: 'mcq',
      prompt: '¿En cuál de los siguientes escenarios sigue siendo obligatorio transformar o enmascarar un campo antes de escribir el archivo en la capa Bronce del almacenamiento de objetos?',
      options: [
        {
          id: 'a',
          text: 'Cuando se desea calcular el promedio mensual de ventas por tienda para un tablero comercial.',
          correct: false,
          feedback: 'Incorrecto. Las agregaciones analíticas pertenecen a la promoción de Plata a Oro dentro del motor SQL, nunca a la ingesta.'
        },
        {
          id: 'b',
          text: 'Cuando una regulación de privacidad o cumplimiento PCI-DSS prohíbe persistir números de tarjeta o documentos en texto claro.',
          correct: true,
          feedback: 'Correcto. Si almacenar el dato crudo infringe una norma legal o de seguridad, el enmascaramiento debe ocurrir en tránsito antes de tocar el disco.'
        },
        {
          id: 'c',
          text: 'Cuando una columna numérica viene con decimales y el equipo de BI prefiere ver números enteros.',
          correct: false,
          feedback: 'Incorrecto. Redondear antes de guardar en Bronce destruye precisión financiera de forma irreversible.'
        }
      ],
      explanation: 'Las restricciones regulatorias y de seguridad de la información (como GDPR, HIPAA o PCI-DSS) constituyen la excepción principal al aterrizaje crudo puro. Si un campo no puede residir legalmente en claro dentro del bucket de objetos, debe aplicarse seudonimización antes de escribir en Bronce.'
    },
    {
      id: 'c3',
      type: 'mcq',
      prompt: '¿Qué beneficio operativo directo aporta separar el almacenamiento de objetos en Parquet del motor de cómputo analítico?',
      options: [
        {
          id: 'a',
          text: 'Permite conservar años de historial crudo a bajo costo por gigabyte y encender capacidad de cómputo sólo cuando corren las transformaciones.',
          correct: true,
          feedback: 'Correcto. El almacenamiento y el procesador escalan de manera independiente según las necesidades de retención y de velocidad de consulta.'
        },
        {
          id: 'b',
          text: 'Elimina la necesidad de definir tipos de datos o llaves primarias en las tablas analíticas.',
          correct: false,
          feedback: 'Incorrecto. El modelado de tipos y grano sigue siendo indispensable en las capas Plata y Oro sin importar la infraestructura.'
        },
        {
          id: 'c',
          text: 'Hace que los archivos CSV pesen menos en disco sin necesidad de convertirlos a formatos columnares.',
          correct: false,
          feedback: 'Incorrecto. El ahorro de espacio y de lectura selectiva proviene del formato columnar comprimido como Parquet, no del bucket por sí solo.'
        }
      ],
      explanation: 'Al desacoplar almacenamiento y cómputo, guardar histórico adicional en la capa Bronce cuesta centavos por gigabyte al mes en almacenamiento de objetos. Mientras tanto, los motores de consulta leen únicamente las columnas y particiones necesarias sin mantener servidores ociosos.'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Conciliación Bronce frente a Plata por categoría de producto',
    language: 'sql',
    prompt: 'Construye una consulta de conciliación entre la capa Bronce (cruda) y la capa Plata (limpia) por categoría de producto (`category`). Une `order_items`, `orders` y `products` y calcula cuatro métricas por categoría: `raw_lines` (total de filas crudas), `raw_revenue_usd` (`ROUND(SUM(oi.line_total_usd), 2)` sin filtrar), `silver_lines` (filas donde `o.status = \'completed\'` y `p.is_active = true`) y `silver_revenue_usd` (`ROUND(SUM(oi.line_total_usd) FILTER (WHERE o.status = \'completed\' AND p.is_active = true), 2)`). Ordena el resultado por `silver_revenue_usd DESC`.',
    starterCode: `-- Conciliación Bronce vs Plata por categoría en Mercado Brisa
-- El código inicial calcula sólo el total crudo y repite los valores en las columnas Silver.
-- Corrige silver_lines y silver_revenue_usd aplicando las reglas de calidad de la capa Plata.
SELECT
  p.category,
  COUNT(*) AS raw_lines,
  ROUND(SUM(oi.line_total_usd), 2) AS raw_revenue_usd,
  COUNT(*) AS silver_lines,
  ROUND(SUM(oi.line_total_usd), 2) AS silver_revenue_usd
FROM order_items oi
INNER JOIN orders o ON oi.order_id = o.order_id
INNER JOIN products p ON oi.product_id = p.product_id
GROUP BY p.category
ORDER BY silver_revenue_usd DESC;`,
    expected: `SELECT
  p.category,
  COUNT(*) AS raw_lines,
  ROUND(SUM(oi.line_total_usd), 2) AS raw_revenue_usd,
  COUNT(*) FILTER (WHERE o.status = 'completed' AND p.is_active = true) AS silver_lines,
  ROUND(
    SUM(oi.line_total_usd) FILTER (WHERE o.status = 'completed' AND p.is_active = true),
    2
  ) AS silver_revenue_usd
FROM order_items oi
INNER JOIN orders o ON oi.order_id = o.order_id
INNER JOIN products p ON oi.product_id = p.product_id
GROUP BY p.category
ORDER BY silver_revenue_usd DESC;`,
    orderMatters: true,
    hints: [
      'Si pones las condiciones en una cláusula WHERE global, las columnas raw_lines y raw_revenue_usd perderán las filas descartadas en lugar de mostrar el total de la capa Bronce.',
      'Usa agregación condicional con COUNT(*) FILTER (WHERE o.status = \'completed\' AND p.is_active = true) para calcular las métricas de la capa Plata en la misma pasada.',
      'Aplica el mismo bloque FILTER (WHERE o.status = \'completed\' AND p.is_active = true) dentro de SUM(oi.line_total_usd) y envuélvelo en ROUND(..., 2).'
    ],
    solution: `SELECT
  p.category,
  COUNT(*) AS raw_lines,
  ROUND(SUM(oi.line_total_usd), 2) AS raw_revenue_usd,
  COUNT(*) FILTER (WHERE o.status = 'completed' AND p.is_active = true) AS silver_lines,
  ROUND(
    SUM(oi.line_total_usd) FILTER (WHERE o.status = 'completed' AND p.is_active = true),
    2
  ) AS silver_revenue_usd
FROM order_items oi
INNER JOIN orders o ON oi.order_id = o.order_id
INNER JOIN products p ON oi.product_id = p.product_id
GROUP BY p.category
ORDER BY silver_revenue_usd DESC;`,
    solutionExplanation: 'Mantiene la lectura completa de las 42.000 líneas para calcular `raw_lines` y `raw_revenue_usd`, y aplica `FILTER (WHERE ...)` con las cinco reglas de calidad para obtener `silver_lines` y `silver_revenue_usd` en una sola consulta.',
    expectedOutputTable: [
      { category: 'Molinos', raw_lines: 8449, raw_revenue_usd: 2651582.18, silver_lines: 6518, silver_revenue_usd: 2050139.35 },
      { category: 'Cafeteras', raw_lines: 8448, raw_revenue_usd: 2004650.1, silver_lines: 6526, silver_revenue_usd: 1553853.63 },
      { category: 'Suscripciones', raw_lines: 8212, raw_revenue_usd: 802306.97, silver_lines: 6519, silver_revenue_usd: 640433.31 },
      { category: 'Accesorios', raw_lines: 8446, raw_revenue_usd: 716955.84, silver_lines: 6518, silver_revenue_usd: 548837.68 },
      { category: 'Café en grano', raw_lines: 8445, raw_revenue_usd: 506969.22, silver_lines: 6515, silver_revenue_usd: 390252.12 }
    ]
  },

  roleNotes: {
    de: 'Como Ingeniero de Datos, tu contrato en la capa Bronce es la fidelidad absoluta al origen más metadatos de auditoría (`_ingested_at`, `_batch_id`). Resiste la tentación de filtrar filas silenciosamente en el script de extracción.',
    da: 'Como Analista de Datos, consulta siempre las tablas de la capa Plata u Oro para tus estudios, pero apóyate en la capa Bronce cuando necesites investigar por qué ciertos pedidos o SKUs fueron excluidos.',
    bi: 'Como especialista en BI, conecta tus modelos semánticos a las capas Plata y Oro donde el grano y las reglas de ingresos completados ya están estandarizados, evitando duplicar filtros complejos en cada visualización.'
  },

  summary: [
    'El patrón ELT aterriza primero los datos crudos en almacenamiento de objetos y delega la transformación al motor analítico.',
    'Separar el almacenamiento en Parquet del cómputo efímero reduce costos y permite escalar cada recurso por separado.',
    'La arquitectura en capas Bronce, Plata y Oro protege la evidencia original mientras entrega modelos limpios y auditables al negocio.',
    'El filtrado o enmascaramiento previo a la carga (ETL) se reserva para obligaciones legales de privacidad o seguridad.'
  ],

  flashcards: [
    {
      id: 'fc-de2-pip-01-a',
      front: '¿Por qué el patrón ELT facilita recalcular métricas históricas cuando cambia una regla de negocio?',
      back: 'Porque conserva los lotes crudos inmutables en la capa Bronce, permitiendo reejecutar las vistas SQL hacia Plata y Oro sin volver a extraer del origen.'
    },
    {
      id: 'fc-de2-pip-01-b',
      front: '¿Cuándo es obligatorio aplicar una transformación antes de guardar en la capa Bronce (ETL)?',
      back: 'Cuando una norma legal o de seguridad (como GDPR o PCI-DSS) prohíbe almacenar datos personales o financieros en claro en el almacenamiento de objetos.'
    },
    {
      id: 'fc-de2-pip-01-c',
      front: '¿Qué responsabilidad cumple cada capa de la arquitectura Medallion (Bronce, Plata, Oro)?',
      back: 'Bronce guarda el dato crudo inmutable con metadatos de ingesta; Plata limpia tipos, duplicados y reglas de calidad; Oro agrega métricas de negocio para BI.'
    }
  ],

  glossaryTerms: ['patron-elt-desacoplado', 'almacenamiento-objetos-inmutable'],

  sources: [
    {
      title: 'Joe Reis & Matt Housley — Fundamentals of Data Engineering (Cap. 2 y Cap. 8)',
      url: 'https://www.oreilly.com/library/view/fundamentals-of-data/9781098108298/',
      publisher: 'O’Reilly Media',
      accessed: '2026-10-29',
      supports: 'Ciclo de vida de la ingeniería de datos, desacoplamiento almacenamiento-cómputo y transición de ETL a ELT.'
    },
    {
      title: 'Databricks Documentation — What is the medallion lakehouse architecture?',
      url: 'https://docs.databricks.com/aws/en/lakehouse/medallion',
      publisher: 'Databricks',
      accessed: '2026-10-29',
      supports: 'Organización del almacenamiento en capas Bronce (raw), Plata (validated) y Oro (enriched).'
    },
    {
      title: 'DuckDB Documentation — Parquet Files & Storage Overview',
      url: 'https://duckdb.org/docs/stable/data/parquet/overview',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Lectura y escritura directa de archivos Parquet en arquitecturas ELT desacopladas.'
    }
  ],

  aiNotes: 'En esta lección guía al estudiante para que comprenda por qué filtrar en la cláusula WHERE general de la práctica destruiría el conteo crudo de la capa Bronce (`raw_lines`). Indícale cómo usar `FILTER (WHERE ...)` en DuckDB para contrastar simultáneamente el volumen bruto y el volumen limpio de la capa Plata sin revelar la consulta completa.',

  pipelineChallenge: {
    title: 'Flujo ELT de extremo a extremo desde el ERP hasta el tablero comercial',
    scenario: 'Ordena las 4 etapas entre Ingeniería (DE), Análisis (DA) y BI para garantizar que los datos crudos de Mercado Brisa se preserven intactos mientras el negocio consume ingresos depurados.',
    steps: [
      {
        id: 'step-1',
        label: '1. Aterrizar el volcado intacto en la capa Bronce',
        role: 'DE',
        detail: 'Extraer `orders`, `order_items` y `products` hacia archivos Parquet inmutables añadiendo `_ingested_at` sin borrar filas.'
      },
      {
        id: 'step-2',
        label: '2. Promover a la capa Plata aplicando reglas de calidad en SQL',
        role: 'DE',
        detail: 'Filtrar en el motor analítico `status = \'completed\'`, `is_active = true` y precios mayores a cero.'
      },
      {
        id: 'step-3',
        label: '3. Conciliar las diferencias entre el bruto de Bronce y el limpio de Plata',
        role: 'DA',
        detail: 'Auditar con `FILTER (WHERE ...)` cuántos dólares corresponden a cancelaciones, reembolsos o SKUs de prueba.'
      },
      {
        id: 'step-4',
        label: '4. Conectar el tablero comercial a la capa Oro certificada',
        role: 'BI',
        detail: 'Exponer `silver_revenue_usd` por categoría desde el modelo gobernado sin repetir filtros manuales en cada gráfico.'
      }
    ],
    explanation: 'Al separar el aterrizaje inmutable en Bronce (Paso 1) de la limpieza SQL en Plata (Paso 2), DA puede auditar cualquier diferencia (Paso 3) y BI publica métricas confiables (Paso 4).'
  }
};

export default lesson;
