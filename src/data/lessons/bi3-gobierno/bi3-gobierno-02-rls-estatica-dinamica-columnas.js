export default {
  id: 'bi3-gobierno-02-rls-estatica-dinamica-columnas',
  moduleId: 'bi3-gobierno',
  tracks: ['bi'],
  level: 3,
  order: 2,
  title: 'Seguridad de filas (RLS) y protección de columnas (OLS)',
  subtitle: 'Seguridad a nivel de fila (RLS) estática y dinámica y protección de columnas sensibles',
  minutes: 25,
  contentVersion: 1,
  prerequisites: [
    'bi3-gobierno-01-capa-semantica-metricflow-cube'
  ],
  hook: 'El Comité de Auditoría de Mercado Brisa detecta que el gerente comercial de la región Andina (`carlos.andina@mercadobrisa.com`) puede abrir el modelo corporativo y consultar los 2 059 786.39 USD de ventas de Cono Sur. Además, puede exportar el nombre completo (`full_name`), el correo personal (`email`) de los 2 400 clientes y el coste unitario (`products.unit_cost_usd`). ¿Cómo diseñarías un único modelo semántico que filtre filas según la identidad del usuario y bloquee o enmascare las columnas confidenciales?',
  objectives: [
    'Diferenciar entre seguridad a nivel de fila (RLS) estática y RLS dinámica gobernada por una tabla de permisos (entitlements) y la identidad del usuario (`USERPRINCIPALNAME()`).',
    'Prevenir fugas de datos al propagar filtros RLS a través de relaciones 1:N, incluyendo el patrón de comodín corporativo (`ALL`) y los riesgos del filtrado bidireccional.',
    'Combinar seguridad a nivel de objeto (OLS) para ocultar columnas confidenciales de costes con técnicas de enmascaramiento dinámico de datos personales (PII) en SQL.'
  ],
  sections: [
    {
      id: 'rls-estatica-vs-dinamica',
      heading: 'Seguridad a nivel de fila (RLS): reglas estáticas frente a dinámicas',
      body: 'La **seguridad a nivel de fila (RLS)** restringe qué registros puede consultar un usuario dentro de un mismo modelo semántico. Así se evita duplicar informes o conjuntos de datos por cada departamento. Existen dos enfoques arquitectónicos para implementarla.\n\nEn la **RLS estática**, el autor del modelo crea un rol distinto por cada segmento. Dentro de cada rol escribe un predicado fijo, como `stores[region] = "Andina"`. Este enfoque es sencillo cuando existen tres o cuatro grupos fijos. Sin embargo, no escala cuando Mercado Brisa necesita restringir el acceso por cada una de sus 14 tiendas o gestionar suplencias semanales.\n\nLa **RLS dinámica** resuelve este problema utilizando un único rol respaldado por una tabla de permisos (`rls_entitlements`). Dicha tabla vincula el correo del usuario (`user_email`) con las regiones o tiendas autorizadas (`allowed_region`). En tiempo de consulta, el motor captura la identidad autenticada mediante `USERPRINCIPALNAME()` en Power BI, `_user_attributes` en Looker o `securityContext` en Cube. Con ese valor filtra la tabla de permisos y propaga la restricción hacia las tablas de hechos.',
      example: {
        language: 'dax',
        code: `-- 1) Regla de RLS estática (requiere crear y mantener un rol distinto por cada región):
stores[region] = "Andina"

-- 2) Regla de RLS dinámica en la tabla stores (un único rol para toda la organización):
VAR _UsuarioActual = USERPRINCIPALNAME()
VAR _RegionesAutorizadas =
    CALCULATETABLE(
        VALUES(rls_entitlements[allowed_region]),
        rls_entitlements[user_email] = _UsuarioActual
    )
RETURN
    "ALL" IN _RegionesAutorizadas
    || stores[region] IN _RegionesAutorizadas`
      }
    },
    {
      id: 'propagacion-entitlements-riesgos-bidireccionales',
      heading: 'Tablas de permisos, comodín ALL y riesgos del filtro bidireccional',
      body: 'En un esquema en estrella bien modelado, la regla de RLS se aplica sobre la dimensión `stores`. Luego, el filtro se propaga automáticamente por la relación `1:N` hacia las tablas de hechos `orders` y `order_items`. Si un usuario tiene varias regiones asignadas en `rls_entitlements`, la tabla de permisos actúa como tabla puente.\n\nPara los perfiles de auditoría global como `elena.corp@mercadobrisa.com`, se registra una fila con `allowed_region = \'ALL\'`. La condición lógica `(e.allowed_region = \'ALL\' OR e.allowed_region = s.region)` permite que la auditora inspeccione las 14 tiendas y los 14 760 pedidos completados (6 269 462.42 USD). Al mismo tiempo, `carlos.andina@mercadobrisa.com` solo visualiza las 4 tiendas y los 4 921 pedidos de Andina (1 990 554.12 USD).\n\nUn error frecuente consiste en activar filtros cruzados bidireccionales (`Both`) entre hechos y dimensiones de clientes para propagar la seguridad. Además de penalizar el rendimiento, un filtro bidireccional mal diseñado puede causar fugas de información o bloquear usuarios si no se aísla mediante predicados unidireccionales.',
      example: {
        language: 'sql',
        code: `WITH rls_entitlements AS (
  SELECT 'ana.norte@mercadobrisa.com' AS user_email, 'Norteamérica' AS allowed_region, 'regional_manager' AS role_name
  UNION ALL
  SELECT 'carlos.andina@mercadobrisa.com', 'Andina', 'regional_manager'
  UNION ALL
  SELECT 'sofia.conosur@mercadobrisa.com', 'Cono Sur', 'regional_manager'
  UNION ALL
  SELECT 'elena.corp@mercadobrisa.com', 'ALL', 'global_auditor'
)
SELECT
  e.user_email,
  e.role_name,
  COUNT(DISTINCT s.store_id) AS visible_stores,
  COUNT(o.order_id) AS visible_orders,
  ROUND(SUM(o.total_usd), 2) AS visible_revenue_usd
FROM rls_entitlements e
JOIN stores s ON (e.allowed_region = 'ALL' OR e.allowed_region = s.region)
JOIN orders o ON s.store_id = o.store_id
WHERE o.status = 'completed'
GROUP BY e.user_email, e.role_name
ORDER BY visible_revenue_usd DESC;`,
        expectedOutput: [
          {
            user_email: 'elena.corp@mercadobrisa.com',
            role_name: 'global_auditor',
            visible_stores: 14,
            visible_orders: 14760,
            visible_revenue_usd: 6269462.42
          },
          {
            user_email: 'sofia.conosur@mercadobrisa.com',
            role_name: 'regional_manager',
            visible_stores: 3,
            visible_orders: 4920,
            visible_revenue_usd: 2059786.39
          },
          {
            user_email: 'carlos.andina@mercadobrisa.com',
            role_name: 'regional_manager',
            visible_stores: 4,
            visible_orders: 4921,
            visible_revenue_usd: 1990554.12
          },
          {
            user_email: 'ana.norte@mercadobrisa.com',
            role_name: 'regional_manager',
            visible_stores: 4,
            visible_orders: 2108,
            visible_revenue_usd: 870752.23
          }
        ]
      }
    },
    {
      id: 'ols-y-enmascaramiento-pii',
      heading: 'Seguridad a nivel de objeto (OLS) y enmascaramiento de PII',
      body: 'Restringir las filas no basta cuando una misma fila contiene columnas con distinto nivel de confidencialidad. Un gerente regional necesita ver el precio de lista (`products.list_price_usd`), pero no debe conocer el coste de fábrica (`products.unit_cost_usd`). Del mismo modo, necesita analizar la recurrencia por `customer_id`, pero la normativa de privacidad prohíbe mostrar en texto plano `customers.full_name` y `customers.email`.\n\nPara proteger atributos financieros críticos se emplea **Object-Level Security (OLS)**. Configurada en los roles del modelo tabular fijando `metadataPermission: none`, la OLS oculta tanto los datos como los metadatos de la columna. Para un rol sin permiso, la columna `unit_cost_usd` no existe en el catálogo ni puede consultarse desde DAX o Excel. Marcar `IsHidden = true` solo la oculta visualmente y no equivale a OLS.\n\nCuando el usuario sí necesita ver la columna para auditoría operativa sin exponer la identidad personal, aplicamos **enmascaramiento dinámico de datos (DDM)** en SQL. Sustituimos el nombre por su inicial seguida de asteriscos (`CONCAT(LEFT(full_name, 1), \'***\')`) y conservamos solo el dominio del correo (`CONCAT(\'***@\', SPLIT_PART(email, \'@\', 2))`).',
      example: {
        language: 'sql',
        code: `SELECT
  c.customer_id,
  CONCAT(LEFT(c.full_name, 1), '***') AS masked_name,
  CONCAT('***@', SPLIT_PART(c.email, '@', 2)) AS email_domain,
  c.segment,
  c.current_tier
FROM customers c
ORDER BY c.customer_id ASC
LIMIT 5;`
      }
    }
  ],
  workedExample: {
    title: 'Construcción de una consulta gobernada con RLS dinámica y enmascaramiento PII',
    description: 'El gerente regional de Andina (`carlos.andina@mercadobrisa.com`) solicita identificar a los 5 clientes con mayor facturación en pedidos completados dentro de sus tiendas autorizadas, cumpliendo con la política corporativa que exige filtrar filas por `rls_entitlements` y enmascarar `full_name` y `email`.',
    steps: [
      {
        label: 'Paso 1: Filtrado dinámico de tiendas y pedidos por identidad',
        explanation: 'Definimos la tabla de permisos `rls_entitlements` y filtramos las tiendas y pedidos completados que corresponden exclusivamente a la identidad autenticada `carlos.andina@mercadobrisa.com`.',
        code: `WITH rls_entitlements AS (
  SELECT 'carlos.andina@mercadobrisa.com' AS user_email, 'Andina' AS allowed_region
  UNION ALL
  SELECT 'ana.norte@mercadobrisa.com', 'Norteamérica'
  UNION ALL
  SELECT 'sofia.conosur@mercadobrisa.com', 'Cono Sur'
)
SELECT
  s.region,
  COUNT(DISTINCT s.store_id) AS authorized_stores,
  COUNT(o.order_id) AS completed_orders,
  ROUND(SUM(o.total_usd), 2) AS authorized_revenue_usd
FROM orders o
JOIN stores s ON o.store_id = s.store_id
JOIN rls_entitlements e ON s.region = e.allowed_region
WHERE e.user_email = 'carlos.andina@mercadobrisa.com'
  AND o.status = 'completed'
GROUP BY s.region;`,
        expectedOutput: [
          {
            region: 'Andina',
            authorized_stores: 4,
            completed_orders: 4921,
            authorized_revenue_usd: 1990554.12
          }
        ]
      },
      {
        label: 'Paso 2: Enmascaramiento de PII y ranking de clientes en Andina',
        explanation: 'Cruzamos los pedidos autorizados con `customers`, aplicamos las funciones de enmascaramiento sobre `full_name` y `email`, y ordenamos por gasto total descendente para obtener el top 5.',
        code: `WITH rls_entitlements AS (
  SELECT 'carlos.andina@mercadobrisa.com' AS user_email, 'Andina' AS allowed_region
  UNION ALL
  SELECT 'ana.norte@mercadobrisa.com', 'Norteamérica'
  UNION ALL
  SELECT 'sofia.conosur@mercadobrisa.com', 'Cono Sur'
),
authorized_orders AS (
  SELECT o.order_id, o.customer_id, s.region, o.total_usd
  FROM orders o
  JOIN stores s ON o.store_id = s.store_id
  JOIN rls_entitlements e ON s.region = e.allowed_region
  WHERE e.user_email = 'carlos.andina@mercadobrisa.com'
    AND o.status = 'completed'
)
SELECT
  c.customer_id,
  CONCAT(LEFT(c.full_name, 1), '***') AS masked_name,
  CONCAT('***@', SPLIT_PART(c.email, '@', 2)) AS email_domain,
  ao.region,
  COUNT(ao.order_id) AS completed_orders,
  ROUND(SUM(ao.total_usd), 2) AS total_spend_usd
FROM authorized_orders ao
JOIN customers c ON ao.customer_id = c.customer_id
GROUP BY c.customer_id, c.full_name, c.email, ao.region
ORDER BY total_spend_usd DESC, c.customer_id ASC
LIMIT 5;`,
        expectedOutput: [
          {
            customer_id: 886,
            masked_name: 'T***',
            email_domain: '***@mercadobrisa.example',
            region: 'Andina',
            completed_orders: 10,
            total_spend_usd: 7427.56
          },
          {
            customer_id: 2206,
            masked_name: 'T***',
            email_domain: '***@mercadobrisa.example',
            region: 'Andina',
            completed_orders: 9,
            total_spend_usd: 7126.84
          },
          {
            customer_id: 334,
            masked_name: 'T***',
            email_domain: '***@mercadobrisa.example',
            region: 'Andina',
            completed_orders: 10,
            total_spend_usd: 6783.42
          },
          {
            customer_id: 715,
            masked_name: 'C***',
            email_domain: '***@mercadobrisa.example',
            region: 'Andina',
            completed_orders: 10,
            total_spend_usd: 6484.72
          },
          {
            customer_id: 1510,
            masked_name: 'T***',
            email_domain: '***@mercadobrisa.example',
            region: 'Andina',
            completed_orders: 8,
            total_spend_usd: 6422.11
          }
        ]
      }
    ],
    audit: 'La combinación de RLS dinámica por tabla de permisos y enmascaramiento de columnas en la vista semántica permite exponer análisis granulares por cliente sin vulnerar fronteras regionales ni datos personales.'
  },
  checks: [
    {
      id: 'chk-bi3-gob-02-rls-dynamic',
      type: 'mcq',
      prompt: 'Mercado Brisa incorpora 35 supervisores zonales que rotan de tienda cada mes. ¿Por qué es preferible implementar RLS dinámica con `USERPRINCIPALNAME()` y una tabla de permisos en lugar de RLS estática?',
      options: [
        {
          id: 'a',
          text: 'Porque la RLS estática no funciona sobre tablas en modo Import dentro de Power BI.',
          correct: false,
          feedback: 'Incorrecto. La RLS estática sí funciona sobre tablas Import, pero exige crear y mantener manualmente decenas de roles en el archivo del modelo.'
        },
        {
          id: 'b',
          text: 'Porque un único rol dinámico evalúa las asignaciones vigentes en la tabla de datos sin necesidad de modificar ni republicar el modelo semántico cuando rotan los supervisores.',
          correct: true,
          feedback: 'Correcto. Al separar la lógica del rol de los datos de asignación, las altas, bajas y rotaciones se actualizan en la tabla de permisos sin tocar el código del modelo.'
        },
        {
          id: 'c',
          text: 'Porque `USERPRINCIPALNAME()` cifra automáticamente en disco los archivos Parquet del almacén.',
          correct: false,
          feedback: 'Incorrecto. `USERPRINCIPALNAME()` devuelve el identificador de sesión del usuario para filtrar filas en memoria o en SQL; no cifra archivos en disco.'
        },
        {
          id: 'd',
          text: 'Porque la RLS dinámica se aplica incluso a los administradores (`Admin`) del área de trabajo.',
          correct: false,
          feedback: 'Incorrecto. Tanto la RLS estática como la dinámica se aplican únicamente a usuarios con permisos de visualización (`Viewer`).'
        }
      ],
      explanation: 'La RLS dinámica centraliza la lógica en un solo rol y delega los permisos a una tabla de datos, permitiendo actualizar asignaciones sin reeditar el modelo.'
    },
    {
      id: 'chk-bi3-gob-02-ols-vs-hidden',
      type: 'mcq',
      prompt: '¿Qué ocurre en Power BI cuando un rol tiene configurada Object-Level Security (OLS) con `metadataPermission: none` sobre la columna `products[unit_cost_usd]` y un usuario de ese rol abre un visual que referencia una medida dependiente de dicha columna?',
      options: [
        {
          id: 'a',
          text: 'El visual muestra el resultado numérico normalmente pero oculta el nombre de la columna en la leyenda.',
          correct: false,
          feedback: 'Incorrecto. Eso ocurriría si la columna solo tuviera `IsHidden = true`; con OLS el acceso a la columna y a sus medidas dependientes queda bloqueado.'
        },
        {
          id: 'b',
          text: 'El motor reemplaza automáticamente `unit_cost_usd` por ceros para que el visual no falle.',
          correct: false,
          feedback: 'Incorrecto. OLS no sustituye valores por cero; restringe por completo el objeto y sus metadatos.'
        },
        {
          id: 'c',
          text: 'El objeto se comporta como si no existiera en los metadatos para ese usuario y cualquier visual que dependa de `unit_cost_usd` devuelve un error de permiso o referencia inexistente.',
          correct: true,
          feedback: 'Correcto. OLS elimina la columna de los metadatos visibles para el rol restringido e impide evaluar cualquier medida que dependa directa o indirectamente de ella.'
        }
      ],
      explanation: 'Con OLS (`metadataPermission: none`), tanto los datos como los metadatos de la columna desaparecen para el rol restringido, bloqueando también las medidas que la referencian.'
    },
    {
      id: 'chk-bi3-gob-02-masking',
      type: 'predict-output',
      prompt: 'Si una fila de `customers` contiene `full_name = \'Lucía Mendoza\'` y `email = \'lucia@mercadobrisa.example\'`, ¿qué valores producen `CONCAT(LEFT(full_name, 1), \'***\')` y `CONCAT(\'***@\', SPLIT_PART(email, \'@\', 2))`?',
      options: [
        {
          id: 'a',
          text: 'L*** y ***@mercadobrisa.example',
          correct: true,
          feedback: 'Correcto. `LEFT(full_name, 1)` extrae la inicial `L` y `SPLIT_PART(email, \'@\', 2)` extrae la segunda parte tras la arroba (`mercadobrisa.example`).'
        },
        {
          id: 'b',
          text: 'Lucía*** y lucia@***',
          correct: false,
          feedback: 'Incorrecto. `LEFT(full_name, 1)` toma únicamente el primer carácter (`L`) y `SPLIT_PART(..., \'@\', 2)` devuelve el dominio, no el usuario local.'
        },
        {
          id: 'c',
          text: '***a y ***@lucia',
          correct: false,
          feedback: 'Incorrecto. `LEFT` toma desde la izquierda y la posición 2 de `SPLIT_PART` corresponde al dominio.'
        }
      ],
      explanation: '`LEFT(full_name, 1)` obtiene el primer carácter (`L`) y `SPLIT_PART(email, \'@\', 2)` obtiene el texto posterior al símbolo `@`, produciendo `L***` y `***@mercadobrisa.example`.'
    }
  ],
  practice: {
    type: 'sql',
    title: 'Implementación de RLS dinámica y enmascaramiento PII para gerencia regional',
    prompt: 'El código inicial expone en texto plano el nombre y el correo electrónico de los clientes de todas las regiones sin aplicar la tabla de permisos `rls_entitlements`. Modifica la consulta para que filtre exclusivamente los pedidos completados (`o.status = \'completed\'`) de las regiones autorizadas para el usuario `\'carlos.andina@mercadobrisa.com\'` mediante `rls_entitlements`, y enmascare las columnas sensibles produciendo exactamente: `customer_id`, `masked_name` (`CONCAT(LEFT(c.full_name, 1), \'***\')`), `email_domain` (`CONCAT(\'***@\', SPLIT_PART(c.email, \'@\', 2))`), `region`, `completed_orders` y `total_spend_usd` (redondeado a 2 decimales). Devuelve el top 5 ordenado por `total_spend_usd DESC, customer_id ASC`.',
    starterCode: `WITH rls_entitlements AS (
  SELECT 'carlos.andina@mercadobrisa.com' AS user_email, 'Andina' AS allowed_region
  UNION ALL
  SELECT 'ana.norte@mercadobrisa.com', 'Norteamérica'
  UNION ALL
  SELECT 'sofia.conosur@mercadobrisa.com', 'Cono Sur'
)
-- Corrige la consulta para aplicar el filtro de rls_entitlements para 'carlos.andina@mercadobrisa.com'
-- sobre pedidos con status = 'completed' y enmascarar full_name y email:
SELECT
  c.customer_id,
  c.full_name AS masked_name,
  c.email AS email_domain,
  s.region,
  COUNT(o.order_id) AS completed_orders,
  ROUND(SUM(o.total_usd), 2) AS total_spend_usd
FROM orders o
JOIN stores s ON o.store_id = s.store_id
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.status = 'completed'
GROUP BY c.customer_id, c.full_name, c.email, s.region
ORDER BY total_spend_usd DESC, c.customer_id ASC
LIMIT 5;`,
    solution: `WITH rls_entitlements AS (
  SELECT 'carlos.andina@mercadobrisa.com' AS user_email, 'Andina' AS allowed_region
  UNION ALL
  SELECT 'ana.norte@mercadobrisa.com', 'Norteamérica'
  UNION ALL
  SELECT 'sofia.conosur@mercadobrisa.com', 'Cono Sur'
),
authorized_orders AS (
  SELECT
    o.order_id,
    o.customer_id,
    s.region,
    o.total_usd
  FROM orders o
  JOIN stores s ON o.store_id = s.store_id
  JOIN rls_entitlements e ON s.region = e.allowed_region
  WHERE e.user_email = 'carlos.andina@mercadobrisa.com'
    AND o.status = 'completed'
)
SELECT
  c.customer_id,
  CONCAT(LEFT(c.full_name, 1), '***') AS masked_name,
  CONCAT('***@', SPLIT_PART(c.email, '@', 2)) AS email_domain,
  ao.region,
  COUNT(ao.order_id) AS completed_orders,
  ROUND(SUM(ao.total_usd), 2) AS total_spend_usd
FROM authorized_orders ao
JOIN customers c ON ao.customer_id = c.customer_id
GROUP BY c.customer_id, c.full_name, c.email, ao.region
ORDER BY total_spend_usd DESC, c.customer_id ASC
LIMIT 5;`,
    solutionExplanation: 'La CTE authorized_orders aplica la RLS dinámica uniendo stores con rls_entitlements para el correo carlos.andina@mercadobrisa.com sobre pedidos completados, y el SELECT externo enmascara full_name y email antes de agrupar y ordenar el top 5.',
    expectedOutputTable: [
      {
        customer_id: 886,
        masked_name: 'T***',
        email_domain: '***@mercadobrisa.example',
        region: 'Andina',
        completed_orders: 10,
        total_spend_usd: 7427.56
      },
      {
        customer_id: 2206,
        masked_name: 'T***',
        email_domain: '***@mercadobrisa.example',
        region: 'Andina',
        completed_orders: 9,
        total_spend_usd: 7126.84
      },
      {
        customer_id: 334,
        masked_name: 'T***',
        email_domain: '***@mercadobrisa.example',
        region: 'Andina',
        completed_orders: 10,
        total_spend_usd: 6783.42
      },
      {
        customer_id: 715,
        masked_name: 'C***',
        email_domain: '***@mercadobrisa.example',
        region: 'Andina',
        completed_orders: 10,
        total_spend_usd: 6484.72
      },
      {
        customer_id: 1510,
        masked_name: 'T***',
        email_domain: '***@mercadobrisa.example',
        region: 'Andina',
        completed_orders: 8,
        total_spend_usd: 6422.11
      }
    ],
    hints: [
      'Une `stores` con `rls_entitlements` mediante `ON s.region = e.allowed_region` y filtra `WHERE e.user_email = \'carlos.andina@mercadobrisa.com\' AND o.status = \'completed\'`.',
      'Usa `CONCAT(LEFT(c.full_name, 1), \'***\') AS masked_name` para conservar solo la primera letra del nombre del cliente.',
      'Usa `CONCAT(\'***@\', SPLIT_PART(c.email, \'@\', 2)) AS email_domain` y ordena por `total_spend_usd DESC, c.customer_id ASC LIMIT 5`.'
    ]
  },
  roleNotes: {
    de: 'Como Data Engineer, materializa y audita la tabla de asignaciones (`rls_entitlements`) sincronizándola desde el directorio corporativo (IdP / Active Directory) y aplica políticas de enmascaramiento de PII desde la capa de vistas del almacén para que ninguna consulta ad-hoc filtre correos en claro.',
    da: 'Como Data Analyst, recuerda que al validar tus propios informes con una cuenta de desarrollador (`Contributor` o `Member`) no estás sujeto a las reglas de RLS; utiliza siempre la función "View as role" especificando tanto el rol como el correo de un usuario de prueba antes de dar por bueno un tablero.',
    bi: 'Como BI Specialist, aplica las reglas de RLS sobre las dimensiones pequeñas (`stores`) en lugar de las tablas de hechos masivas (`order_items`), y utiliza OLS (`metadataPermission: none`) cuando debas proteger columnas de coste (`unit_cost_usd`) frente a usuarios con permiso de creación de informes.'
  },
  summary: [
    'La RLS estática usa predicados fijos por rol; la RLS dinámica cruza `USERPRINCIPALNAME()` con una tabla de permisos.',
    'Las reglas de RLS deben aplicarse en las dimensiones para que el filtro se propague por las relaciones 1:N.',
    'La OLS oculta los datos y metadatos de columnas confidenciales (`unit_cost_usd`), a diferencia de la propiedad visual `IsHidden`.',
    'El enmascaramiento dinámico de columnas permite analizar métricas por `customer_id` ocultando `full_name` y `email`.'
  ],
  flashcards: [
    {
      id: 'fc-bi3-gob-02-01',
      front: '¿Qué ventaja aporta la RLS dinámica con `USERPRINCIPALNAME()` frente a la RLS estática?',
      back: 'Permite mantener un único rol de seguridad cuya cobertura se actualiza automáticamente al modificar las filas de la tabla de permisos (`entitlements`), sin reeditar ni republicar el modelo semántico.'
    },
    {
      id: 'fc-bi3-gob-02-02',
      front: '¿Por qué un usuario con permiso `Contributor` o `Member` en un área de trabajo de Power BI ve todas las filas aunque exista un rol de RLS activo?',
      back: 'Porque en Power BI y Microsoft Fabric las reglas de RLS y OLS solo restringen a los usuarios con permiso de solo lectura (`Viewer`); los roles con capacidad de edición tienen acceso completo al modelo subyacente.'
    },
    {
      id: 'fc-bi3-gob-02-03',
      front: '¿Cuál es la diferencia de seguridad entre marcar una columna como `IsHidden = true` y aplicar Object-Level Security (OLS)?',
      back: '`IsHidden = true` solo oculta la columna en la interfaz visual pero permite consultarla mediante DAX o Excel; OLS (`metadataPermission: none`) bloquea el acceso a los datos y elimina la columna de los metadatos para el rol restringido.'
    }
  ],
  glossaryTerms: [
    'seguridad-nivel-fila-rls',
    'seguridad-nivel-objeto-ols'
  ],
  sources: [
    {
      title: 'Microsoft Learn — Row-level security (RLS) with Power BI',
      url: 'https://learn.microsoft.com/en-us/fabric/security/service-admin-row-level-security',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Configuración de roles RLS estáticos y dinámicos y comportamiento según permisos del área de trabajo (Viewer vs Admin/Member/Contributor).'
    },
    {
      title: 'Microsoft Learn — Row-level security (RLS) guidance in Power BI Desktop',
      url: 'https://learn.microsoft.com/en-us/power-bi/guidance/rls-guidance',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Mejores prácticas de modelado de tablas de permisos (entitlements), propagación 1:N y precauciones con filtros bidireccionales.'
    },
    {
      title: 'Microsoft Learn — Object-level security (OLS)',
      url: 'https://learn.microsoft.com/en-us/fabric/security/service-admin-object-level-security',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Ocultación de tablas, columnas y metadatos sensibles mediante permisos de objeto en modelos semánticos.'
    },
    {
      title: 'Microsoft Learn — USERPRINCIPALNAME function (DAX)',
      url: 'https://learn.microsoft.com/en-us/dax/userprincipalname-function-dax',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Semántica de USERPRINCIPALNAME() para recuperar el UPN (correo electrónico) del usuario autenticado en RLS dinámica.'
    }
  ],
  aiNotes: 'Si el estudiante olvida unir con `rls_entitlements` o filtra directamente `WHERE s.region = \'Andina\'` sin consultar la tabla de permisos por `user_email`, recuérdale que la práctica evalúa RLS dinámica gobernada por la identidad `carlos.andina@mercadobrisa.com`. Verifica también que enmascare tanto `full_name` (`LEFT(c.full_name, 1)`) como `email` (`SPLIT_PART(c.email, \'@\', 2)`) y que filtre `o.status = \'completed\'`.'
};
