const lesson = {
  id: 'c1-viz-04-tablas-numericas',
  moduleId: 'c1-viz',
  tracks: ['core'],
  level: 1,
  order: 4,
  title: 'Diseño de tablas numéricas: alineación y cifras tabulares',
  minutes: 20,
  prerequisites: ['c1-viz-03-color-accesibilidad'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), el cierre semanal de tiendas se envía como una tabla donde todas las columnas están centradas, los importes muestran entre uno y ocho decimales de coma flotante (`336.61876644` junto a `401.3`), una cuadrícula negra gruesa encierra cada celda y las filas aparecen sin orden ni porcentaje sobre el total. Quien revisa el documento tarda varios minutos en encontrar la tienda de mayor facturación. ¿Qué reglas tipográficas y de consulta convierten una tabla confusa en un instrumento de lectura rápida?',

  objectives: [
    'Decidir cuándo una tabla numérica estructurada supera a un gráfico para consultar cifras exactas y múltiples unidades.',
    'Aplicar alineación por tipo de dato, redondeo uniforme y cifras tabulares (`tabular-nums`) para facilitar el escaneo vertical.',
    'Construir consultas SQL que entreguen tablas ordenadas por magnitud con métricas de densidad y porcentaje sobre el total.'
  ],

  sections: [
    {
      id: 'cuando-preferir-una-tabla',
      heading: 'Cuándo una tabla bien diseñada supera a un gráfico',
      body: 'Los gráficos de barras y de líneas son excelentes para percibir formas generales, pendientes o valores extremos de un vistazo. Sin embargo, existen tres situaciones de trabajo donde una tabla numérica es la herramienta correcta (como documenta Stephen Few en *Show Me the Numbers*).\n\n1. **Búsqueda de valores exactos**: finanzas, auditoría o el gerente de una sucursal necesitan leer la cifra al centavo (`204664.21` USD) para conciliar presupuestos.\n2. **Comparación simultánea de múltiples unidades**: una misma entidad requiere mostrar lado a lado conteo de tiendas, pedidos completados, ingreso total en dólares, ticket medio y porcentaje de participación.\n3. Combinación de detalle y resumen: necesitas inspeccionar tanto las filas individuales como los subtotales o la cuota que cada grupo aporta al total general.',
      interactive: {
        component: 'bi-anti-slop-comparator',
        caption: 'Inspecciona cómo la tabla de alta densidad alinea las columnas numéricas a la derecha e integra barras de progreso y desviación contra el plan.'
      }
    },
    {
      id: 'alineacion-y-cifras-tabulares',
      heading: 'Alineación por tipo de dato y cifras tabulares',
      body: 'El defecto más común en hojas de cálculo y tableros web es centrar todas las columnas. Cuando centras números de distinta longitud (`1519007.30` encima de `83595.24`), las unidades se desplazan respecto a las decenas. Los puntos decimales quedan en zigzag y resulta imposible comparar órdenes de magnitud al recorrer la columna con la vista. Aplica estas cuatro reglas de alineación y tipografía.\n\n- Alinea el texto y los nombres categóricos (`region`, `store_name`, `category`) siempre a la **izquierda**, donde empieza el barrido de lectura.\n- Alinea las cantidades, importes y porcentajes a la derecha con el mismo número de decimales en toda la columna (`ROUND(valor, 2)` o `ROUND(pct, 1)`).\n- Los códigos cortos de longitud idéntica (`country_code` como `MX`, `CO`, `CL`, `ES` o fechas ISO `YYYY-MM-DD`) pueden ir a la izquierda o al centro, porque todas las filas miden lo mismo.\n- Activa las **cifras tabulares** (`font-variant-numeric: tabular-nums`) para que el dígito `1` ocupe exactamente el mismo ancho horizontal que el `8`. Además, alinea cada encabezado de columna igual que sus celdas.',
      example: {
        language: 'sql',
        code: `SELECT
  s.region,
  COUNT(DISTINCT s.store_id) AS tiendas,
  COUNT(o.order_id) AS pedidos_completados,
  ROUND(SUM(o.total_usd), 2) AS ingreso_total_usd,
  ROUND(AVG(o.total_usd), 2) AS ticket_medio_usd,
  ROUND(
    100.0 * SUM(o.total_usd) / SUM(SUM(o.total_usd)) OVER (),
    1
  ) AS pct_ingreso_total
FROM stores s
JOIN orders o ON s.store_id = o.store_id
WHERE o.status = 'completed'
  AND o.order_date BETWEEN DATE '2024-01-01' AND DATE '2024-12-31'
GROUP BY s.region
ORDER BY ingreso_total_usd DESC;`,
        expectedOutput: [
          {
            region: 'Cono Sur',
            tiendas: 3,
            pedidos_completados: 2199,
            ingreso_total_usd: 919026.32,
            ticket_medio_usd: 417.93,
            pct_ingreso_total: 33.6
          },
          {
            region: 'Andina',
            tiendas: 4,
            pedidos_completados: 2154,
            ingreso_total_usd: 858331.08,
            ticket_medio_usd: 398.48,
            pct_ingreso_total: 31.4
          },
          {
            region: 'Iberia',
            tiendas: 3,
            pedidos_completados: 1232,
            ingreso_total_usd: 590458.99,
            ticket_medio_usd: 479.27,
            pct_ingreso_total: 21.6
          },
          {
            region: 'Norteamérica',
            tiendas: 4,
            pedidos_completados: 912,
            ingreso_total_usd: 363700.11,
            ticket_medio_usd: 398.79,
            pct_ingreso_total: 13.3
          }
        ]
      }
    },
    {
      id: 'precision-util-y-ruido-decimal',
      heading: 'Controlar la falsa precisión desde SQL',
      body: 'Cuando ejecutas `AVG(o.total_usd)` o divides el ingreso entre los metros cuadrados (`SUM(o.total_usd) / s.area_sqm`), SQL devuelve números en coma flotante como `336.6187664473684`. Mostrar ocho decimales en un reporte de negocio produce **falsa precisión**. Esos dígitos adicionales no aportan información operativa y añaden ruido visual que dificulta leer la parte entera.\n\nDefine la precisión en tu consulta SQL según la decisión que respalda la tabla.\n\n- En resúmenes ejecutivos de miles o millones de dólares, redondea a enteros (`ROUND(x, 0)`) o a `2` decimales si se requiere conciliación contable.\n- En tasas porcentuales y variaciones, `1` decimal (`33.6 %`) basta para distinguir tendencias sin saturar la celda.\n- Declara la unidad en el encabezado (`Ingreso (USD)`, `Ticket medio (USD)`, `Cuota (%)`) para no repetir símbolos en cada fila.'
    },
    {
      id: 'estructura-espacio-y-contexto',
      heading: 'Jerarquía de filas, separación visual y columnas de contexto',
      body: 'Edward Tufte demostró que las rejillas de bordes negros verticales y horizontales alrededor de cada celda actúan como jaulas visuales. Esos bordes compiten con los dígitos y cansan la vista. Aplica estas cuatro pautas para estructurar una tabla limpia.\n\n- Elimina las líneas verticales entre columnas. Deja que la alineación izquierda del texto y derecha de los números cree carriles visuales limpios mediante **espacio en blanco**.\n- Usa únicamente líneas horizontales finas debajo del encabezado y encima de la fila de totales.\n- Ordena las filas por la métrica principal de negocio (`ORDER BY ingreso_total_usd DESC`) en lugar de dejarlas en orden alfabético.\n- Añade siempre columnas de normalización y contexto. Un ingreso bruto alto en una región con 4 tiendas (`Andina` con `858331.08` USD) se interpreta mejor cuando muestras al lado el número de tiendas, el ticket medio (`398.48` USD) o el ingreso por metro cuadrado (`ingreso_m2_usd`).'
    }
  ],

  workedExample: {
    title: 'Transformar una salida cruda en coma flotante en una tabla ejecutiva de tiendas insignia',
    description: 'Compara el resultado crudo de promedios y divisiones sin redondear para las tiendas flagship de Mercado Brisa en 2024 frente a una tabla con precisión uniforme, código de país, volumen de pedidos y orden por facturación.',
    audit: 'En 2024, Tienda Chapinero Alto (CO) lidera el ingreso total entre las tiendas flagship (204,664.21 USD), pero Tienda Providencia (CL) registra la mayor productividad por superficie (428.15 USD/m²).',
    steps: [
      {
        label: 'Antipatrón: decimales de coma flotante sin control, orden alfabético y sin volumen',
        explanation: 'Devolver `AVG` y divisiones sin `ROUND` genera hasta 14 decimales (`336.6187664473684`), oculta cuántos pedidos respaldan el promedio y ordena por nombre.',
        code: `SELECT
  s.store_name,
  AVG(o.total_usd) AS ticket_promedio_crudo,
  SUM(o.total_usd) / s.area_sqm AS ingreso_por_m2_crudo
FROM stores s
JOIN orders o ON s.store_id = o.store_id
WHERE o.status = 'completed'
  AND o.order_date BETWEEN DATE '2024-01-01' AND DATE '2024-12-31'
  AND s.store_type = 'flagship'
GROUP BY s.store_name, s.area_sqm
ORDER BY s.store_name ASC;`,
        expectedOutput: [
          {
            store_name: 'Tienda Chapinero Alto',
            ticket_promedio_crudo: 336.6187664473684,
            ingreso_por_m2_crudo: 401.3023725490196
          },
          {
            store_name: 'Tienda Providencia',
            ticket_promedio_crudo: 412.88911949685536,
            ingreso_por_m2_crudo: 428.1480652173913
          },
          {
            store_name: 'Tienda Reforma Norte',
            ticket_promedio_crudo: 352.7225316455696,
            ingreso_por_m2_crudo: 134.8310322580645
          },
          {
            store_name: 'Tienda Salamanca',
            ticket_promedio_crudo: 407.99077380952343,
            ingreso_por_m2_crudo: 253.8609259259257
          }
        ]
      },
      {
        label: 'Solución verificada: precisión uniforme a 2 decimales, contexto y orden por ingreso',
        explanation: 'Añadimos `country_code` (2 caracteres fijos), `pedidos`, `ingreso_usd`, `ticket_medio_usd` e `ingreso_m2_usd` redondeados a 2 decimales y ordenados de mayor a menor ingreso.',
        code: `SELECT
  s.store_name,
  s.country_code,
  COUNT(o.order_id) AS pedidos,
  ROUND(SUM(o.total_usd), 2) AS ingreso_usd,
  ROUND(AVG(o.total_usd), 2) AS ticket_medio_usd,
  ROUND(SUM(o.total_usd) / NULLIF(s.area_sqm, 0), 2) AS ingreso_m2_usd
FROM stores s
JOIN orders o ON s.store_id = o.store_id
WHERE o.status = 'completed'
  AND o.order_date BETWEEN DATE '2024-01-01' AND DATE '2024-12-31'
  AND s.store_type = 'flagship'
GROUP BY s.store_name, s.country_code, s.area_sqm
ORDER BY ingreso_usd DESC;`,
        expectedOutput: [
          {
            store_name: 'Tienda Chapinero Alto',
            country_code: 'CO',
            pedidos: 608,
            ingreso_usd: 204664.21,
            ticket_medio_usd: 336.62,
            ingreso_m2_usd: 401.3
          },
          {
            store_name: 'Tienda Providencia',
            country_code: 'CL',
            pedidos: 477,
            ingreso_usd: 196948.11,
            ticket_medio_usd: 412.89,
            ingreso_m2_usd: 428.15
          },
          {
            store_name: 'Tienda Salamanca',
            country_code: 'ES',
            pedidos: 336,
            ingreso_usd: 137084.9,
            ticket_medio_usd: 407.99,
            ingreso_m2_usd: 253.86
          },
          {
            store_name: 'Tienda Reforma Norte',
            country_code: 'MX',
            pedidos: 237,
            ingreso_usd: 83595.24,
            ticket_medio_usd: 352.72,
            ingreso_m2_usd: 134.83
          }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'chk-c1-viz-04-1',
      type: 'mcq',
      prompt: 'En una tabla que muestra `store_name` (texto), `country_code` (código ISO de 2 letras), `pedidos` (entero) e `ingreso_usd` (importe con 2 decimales), ¿qué alineación horizontal debe tener cada columna?',
      options: [
        {
          id: 'a',
          text: '`store_name` a la izquierda, `country_code` al centro o izquierda, y tanto `pedidos` como `ingreso_usd` a la derecha con cifras tabulares.',
          correct: true,
          feedback: 'Correcto: el texto se lee desde su margen izquierdo, los códigos de longitud idéntica admiten centrado y las cantidades numéricas se alinean a la derecha por orden de magnitud.'
        },
        {
          id: 'b',
          text: 'Todas las columnas centradas para que la tabla se vea simétrica.',
          correct: false,
          feedback: 'Incorrecto: centrar importes de distinta longitud desalinea las unidades y los separadores decimales, impidiendo comparar cifras verticalmente.'
        },
        {
          id: 'c',
          text: '`store_name` a la derecha y `pedidos` e `ingreso_usd` a la izquierda.',
          correct: false,
          feedback: 'Incorrecto: alinear números de distinta longitud a la izquierda coloca las centenas debajo de los millones.'
        }
      ],
      explanation: 'Alinear el texto a la izquierda y los números a la derecha con cifras tabulares garantiza que cada posición decimal (unidades, decenas, miles) caiga en la misma vertical.'
    },
    {
      id: 'chk-c1-viz-04-2',
      type: 'mcq',
      prompt: '¿Qué efecto técnico produce aplicar la propiedad CSS `font-variant-numeric: tabular-nums` en las celdas numéricas de una tabla?',
      options: [
        {
          id: 'a',
          text: 'Hace que todos los dígitos del 0 al 9 ocupen exactamente el mismo ancho horizontal, manteniendo alineadas las columnas de cifras de fila en fila.',
          correct: true,
          feedback: 'Correcto: evita que números con muchos unos (`111.11`) ocupen menos ancho que números con ochos (`888.88`) dentro de una fuente proporcional.'
        },
        {
          id: 'b',
          text: 'Redondea automáticamente los números de la base de datos a dos decimales sin usar SQL.',
          correct: false,
          feedback: 'Incorrecto: CSS controla la representación tipográfica de los glifos, no el redondeo matemático de los valores devueltos por SQL.'
        },
        {
          id: 'c',
          text: 'Ordena las filas de la tabla de mayor a menor al hacer clic.',
          correct: false,
          feedback: 'Incorrecto: el orden de las filas depende de la cláusula ORDER BY o de la lógica de la interfaz, no de la propiedad tipográfica.'
        }
      ],
      explanation: 'Con `tabular-nums`, cada carácter numérico tiene una caja de ancho idéntico (como en una fuente monoespaciada), lo que permite comparar columnas de cifras sin desplazamientos horizontales.'
    },
    {
      id: 'chk-c1-viz-04-3',
      type: 'mcq',
      prompt: 'El comité financiero necesita consultar en una sola vista para las 14 tiendas: código de sucursal, ciudad, área en m², pedidos completados, ingreso exacto al centavo, ticket medio y porcentaje de cumplimiento de meta. ¿Qué formato debes elegir?',
      options: [
        {
          id: 'a',
          text: 'Una tabla numérica ordenada por ingreso descendente, con decimales uniformes, sin rejillas verticales pesadas y con una barra o etiqueta de excepción en la columna de meta.',
          correct: true,
          feedback: 'Correcto: cuando se requiere precisión exacta al centavo y cruzar cuatro unidades distintas (m², conteos, dólares y porcentajes), una tabla estructurada supera a cualquier gráfico aislado.'
        },
        {
          id: 'b',
          text: 'Un gráfico de líneas con 7 ejes verticales superpuestos para incluir todas las unidades.',
          correct: false,
          feedback: 'Incorrecto: 7 ejes verticales sobre categorías discretas (tiendas) carecen de sentido geométrico y resultan ilegibles.'
        },
        {
          id: 'c',
          text: 'Cuatro gráficos de pastel separados, uno para los metros cuadrados, otro para los pedidos y dos para los dólares.',
          correct: false,
          feedback: 'Incorrecto: los gráficos circulares no permiten leer valores exactos al centavo ni cruzar 5 métricas de una misma tienda.'
        }
      ],
      explanation: 'Las tablas son el medio idóneo cuando el usuario necesita buscar valores exactos por fila y comparar simultáneamente métricas expresadas en unidades distintas.'
    },
    {
      id: 'chk-c1-viz-04-4',
      type: 'predict-output',
      prompt: 'En los pedidos completados de 2024 de Mercado Brisa agrupados por `store_type`, las 7 tiendas `retail` suman `1519007.30` USD, las 4 tiendas `flagship` suman `622292.46` USD y los 3 almacenes `warehouse` suman `590216.74` USD. ¿Cuál formato tiene el ticket medio por pedido más alto?',
      options: [
        {
          id: 'a',
          text: '`warehouse` con 521.39 USD por pedido (1132 pedidos), frente a 409.77 USD en `retail` y 375.33 USD en `flagship`.',
          correct: true,
          feedback: 'Correcto: aunque `retail` genera el 55.6 % del ingreso total por tener más tiendas y pedidos, `warehouse` presenta el mayor importe medio por pedido.'
        },
        {
          id: 'b',
          text: '`retail` porque tiene el ingreso total más alto.',
          correct: false,
          feedback: 'Incorrecto: el ingreso total de `retail` es mayor por volumen (3707 pedidos en 7 tiendas), pero su ticket medio (409.77 USD) es menor que el de `warehouse` (521.39 USD).'
        },
        {
          id: 'c',
          text: 'Los tres formatos tienen exactamente el mismo ticket medio.',
          correct: false,
          feedback: 'Incorrecto: al incluir la columna de contexto `ticket_medio_usd` se observa una diferencia de más de 146 USD por pedido entre `warehouse` y `flagship`.'
        }
      ],
      explanation: 'Por eso una buena tabla numérica acompaña el ingreso total con el número de tiendas, el conteo de pedidos y el ticket medio: el volumen total y el valor unitario cuentan historias complementarias.'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Tabla ejecutiva de resumen por formato de tienda en 2024',
    language: 'sql',
    prompt: 'Construye la consulta para la tabla resumen de 2024 (`o.order_date BETWEEN DATE \'2024-01-01\' AND DATE \'2024-12-31\'` y `o.status = \'completed\'`) agrupada por `s.store_type` cruzando `stores s` y `orders o`. Devuelve: `store_type`, `tiendas_activas` (`COUNT(DISTINCT s.store_id)`), `pedidos_completados` (`COUNT(o.order_id)`), `ingreso_total_usd` (`ROUND(SUM(o.total_usd), 2)`), `ticket_medio_usd` (`ROUND(AVG(o.total_usd), 2)`) y `pct_ingreso_total` (`ROUND(100.0 * SUM(o.total_usd) / SUM(SUM(o.total_usd)) OVER (), 1)`), ordenada por `ingreso_total_usd DESC`.',
    starterCode: `SELECT
  s.store_type,
  COUNT(DISTINCT s.store_id) AS tiendas_activas,
  COUNT(o.order_id) AS pedidos_completados,
  ROUND(SUM(o.total_usd), 2) AS ingreso_total_usd,
  -- Calcula ticket_medio_usd redondeado a 2 decimales y pct_ingreso_total redondeado a 1 decimal
  0.0 AS ticket_medio_usd,
  0.0 AS pct_ingreso_total
FROM stores s
JOIN orders o ON s.store_id = o.store_id
WHERE o.status = 'completed'
  AND o.order_date BETWEEN DATE '2024-01-01' AND DATE '2024-12-31'
GROUP BY s.store_type
ORDER BY ingreso_total_usd DESC;`,
    expected: `SELECT
  s.store_type,
  COUNT(DISTINCT s.store_id) AS tiendas_activas,
  COUNT(o.order_id) AS pedidos_completados,
  ROUND(SUM(o.total_usd), 2) AS ingreso_total_usd,
  ROUND(AVG(o.total_usd), 2) AS ticket_medio_usd,
  ROUND(
    100.0 * SUM(o.total_usd) / SUM(SUM(o.total_usd)) OVER (),
    1
  ) AS pct_ingreso_total
FROM stores s
JOIN orders o ON s.store_id = o.store_id
WHERE o.status = 'completed'
  AND o.order_date BETWEEN DATE '2024-01-01' AND DATE '2024-12-31'
GROUP BY s.store_type
ORDER BY ingreso_total_usd DESC;`,
    orderMatters: true,
    hints: [
      'Para el ticket medio con precisión uniforme de 2 decimales, usa `ROUND(AVG(o.total_usd), 2) AS ticket_medio_usd`.',
      'Para el porcentaje sobre el ingreso total de 2024, usa `ROUND(100.0 * SUM(o.total_usd) / SUM(SUM(o.total_usd)) OVER (), 1) AS pct_ingreso_total`.',
      'Verifica que la consulta mantenga el filtro `o.status = \'completed\'` en el año 2024 y ordene por `ingreso_total_usd DESC`.'
    ],
    solution: `SELECT
  s.store_type,
  COUNT(DISTINCT s.store_id) AS tiendas_activas,
  COUNT(o.order_id) AS pedidos_completados,
  ROUND(SUM(o.total_usd), 2) AS ingreso_total_usd,
  ROUND(AVG(o.total_usd), 2) AS ticket_medio_usd,
  ROUND(
    100.0 * SUM(o.total_usd) / SUM(SUM(o.total_usd)) OVER (),
    1
  ) AS pct_ingreso_total
FROM stores s
JOIN orders o ON s.store_id = o.store_id
WHERE o.status = 'completed'
  AND o.order_date BETWEEN DATE '2024-01-01' AND DATE '2024-12-31'
GROUP BY s.store_type
ORDER BY ingreso_total_usd DESC;`,
    solutionExplanation: 'Combina en una tabla limpia el conteo de tiendas (`COUNT(DISTINCT s.store_id)`), el volumen de pedidos, el importe total redondeado a 2 decimales, el ticket medio a 2 decimales y la cuota porcentual a 1 decimal, ordenando de mayor a menor facturación.',
    blanks: [
      {
        id: 'b1',
        answer: 'ROUND(AVG(o.total_usd), 2)'
      }
    ],
    expectedOutput: [
      {
        store_type: 'retail',
        tiendas_activas: 7,
        pedidos_completados: 3707,
        ingreso_total_usd: 1519007.3,
        ticket_medio_usd: 409.77,
        pct_ingreso_total: 55.6
      },
      {
        store_type: 'flagship',
        tiendas_activas: 4,
        pedidos_completados: 1658,
        ingreso_total_usd: 622292.46,
        ticket_medio_usd: 375.33,
        pct_ingreso_total: 22.8
      },
      {
        store_type: 'warehouse',
        tiendas_activas: 3,
        pedidos_completados: 1132,
        ingreso_total_usd: 590216.74,
        ticket_medio_usd: 521.39,
        pct_ingreso_total: 21.6
      }
    ],
    expectedOutputTable: [
      {
        store_type: 'retail',
        tiendas_activas: 7,
        pedidos_completados: 3707,
        ingreso_total_usd: 1519007.3,
        ticket_medio_usd: 409.77,
        pct_ingreso_total: 55.6
      },
      {
        store_type: 'flagship',
        tiendas_activas: 4,
        pedidos_completados: 1658,
        ingreso_total_usd: 622292.46,
        ticket_medio_usd: 375.33,
        pct_ingreso_total: 22.8
      },
      {
        store_type: 'warehouse',
        tiendas_activas: 3,
        pedidos_completados: 1132,
        ingreso_total_usd: 590216.74,
        ticket_medio_usd: 521.39,
        pct_ingreso_total: 21.6
      }
    ]
  },

  roleNotes: {
    de: 'Al definir tablas en la capa Gold, almacena los importes monetarios en tipos exactos (`DECIMAL(12, 2)`) o aplica `ROUND` explícito en las vistas de consumo para evitar residuos binarios de coma flotante como `409.77000000000004`.',
    da: 'Cuando entregues una tabla resumen en un informe o cuaderno, acompaña siempre las sumas totales con el tamaño de muestra (`n` de tiendas o pedidos) y una métrica unitaria (ticket medio o mediana) para evitar conclusiones sesgadas por el tamaño del grupo.',
    bi: 'Configura en todas las tablas de tus tableros la alineación derecha para columnas numéricas, activa la fuente tabular, fija el número de decimales por medida y desactiva las líneas de cuadrícula verticales.'
  },

  summary: [
    'Elige una tabla numérica cuando el lector necesite consultar valores exactos o comparar múltiples unidades a la vez.',
    'Alinea el texto a la izquierda y los números a la derecha usando cifras tabulares (`tabular-nums`).',
    'Aplica un número uniforme de decimales por columna con `ROUND` para evitar la falsa precisión.',
    'Elimina rejillas verticales pesadas, ordena por la métrica principal y añade columnas de contexto como ticket medio y cuota porcentual.'
  ],

  flashcards: [
    {
      id: 'fc-c1-viz-04-1',
      front: '¿Cuándo es preferible presentar los datos en una tabla numérica en lugar de un gráfico?',
      back: 'Cuando se necesita buscar cifras exactas al centavo o comparar simultáneamente varias métricas con unidades distintas (tiendas, pedidos, dólares, porcentajes).'
    },
    {
      id: 'fc-c1-viz-04-2',
      front: '¿Por qué nunca deben centrarse las columnas de importes o cantidades en una tabla?',
      back: 'Porque los números de distinta longitud quedan con sus unidades, decenas y puntos decimales desalineados, impidiendo comparar órdenes de magnitud al escanear verticalmente.'
    },
    {
      id: 'fc-c1-viz-04-3',
      front: '¿Qué resuelve la propiedad tipográfica `font-variant-numeric: tabular-nums`?',
      back: 'Asigna exactamente el mismo ancho horizontal a cada dígito (0–9) para que las cifras de distintas filas se alineen dígito a dígito como en una fuente monoespaciada.'
    },
    {
      id: 'fc-c1-viz-04-4',
      front: '¿Qué es la "falsa precisión" en una tabla de datos y cómo se previene en SQL?',
      back: 'Es mostrar muchos decimales irrelevantes producto de divisiones en coma flotante (p. ej. 336.61876644); se previene aplicando ROUND(expresion, decimales) según la escala de decisión.'
    }
  ],

  glossaryTerms: [
    'cifras-tabulares',
    'codificacion-visual',
    'c25-tufte-visual-perception'
  ],

  sources: [
    {
      title: 'Show Me the Numbers: Designing Tables and Graphs to Enlighten (2nd Edition) — Table Design Principles',
      url: 'https://www.perceptualedge.com/library.php',
      publisher: 'Stephen Few / Analytics Press (Perceptual Edge)',
      accessed: '2026-10-29',
      supports: 'Criterios de elección entre tablas y gráficos, alineación por tipo de dato, control de decimales y eliminación de ruido en rejillas.'
    },
    {
      title: 'CSS Fonts Module Level 4 — Section 6.6: Numeric Formatting (font-variant-numeric: tabular-nums)',
      url: 'https://www.w3.org/TR/css-fonts-4/#font-variant-numeric-prop',
      publisher: 'World Wide Web Consortium (W3C)',
      accessed: '2026-10-29',
      supports: 'Definición técnica de cifras tabulares de ancho uniforme para alineación vertical en tablas numéricas.'
    },
    {
      title: 'The Visual Display of Quantitative Information (2nd Edition) — Data-Ink Ratio in Tables',
      url: 'https://www.edwardtufte.com/bboard/q-and-a-fetch-msg?msg_id=0001OR',
      publisher: 'Edward R. Tufte / Graphics Press',
      accessed: '2026-10-29',
      supports: 'Separación estructural mediante espacio en blanco y reglas horizontales ligeras sin encerrar celdas en cajas pesadas.'
    },
    {
      title: 'DuckDB SQL Reference — Numeric Functions (ROUND, NULLIF)',
      url: 'https://duckdb.org/docs/sql/functions/numeric.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Formateo de precisión decimal uniforme y divisiones seguras en consultas SQL analíticas.'
    }
  ],

  aiNotes: 'El estudiante suele pasar por alto la diferencia entre `COUNT(s.store_id)` (que contaría el número de pedidos debido al JOIN con `orders`) y `COUNT(DISTINCT s.store_id)` (que cuenta cuántas tiendas distintas operan en ese formato). Explícale por qué después del JOIN con `orders` una fila representa un pedido y por qué `COUNT(DISTINCT s.store_id)` es indispensable en la tabla resumen.'
};

export default lesson;
