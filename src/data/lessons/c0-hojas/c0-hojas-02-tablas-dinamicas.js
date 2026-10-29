const lesson = {
  id: 'c0-hojas-02-tablas-dinamicas',
  moduleId: 'c0-hojas',
  tracks: ['core'],
  level: 0,
  order: 2,
  title: 'Tablas dinámicas para resumir ventas sin alterar datos',
  minutes: 20,
  prerequisites: ['c0-hojas-01-tablas-referencias'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), gerencia pide un resumen de ingresos por región y tipo de tienda. Una persona inserta filas de "Subtotal región" en medio de la tabla `orders` y al final aplica `=SUMA()` sobre toda la columna, duplicando las ventas de 6,27 a 12,54 millones de dólares. Otra persona crea una tabla dinámica pero olvida filtrar los pedidos cancelados y reembolsados. ¿Cómo se resume una tabla en una vista separada sin tocar los registros originales?',

  objectives: [
    'Separar la hoja de datos crudos de la hoja de resumen mediante una tabla dinámica para no insertar filas de subtotales manuales.',
    'Relacionar los cuatro cuadrantes de una tabla dinámica (`Filtros`, `Filas`, `Columnas` y `Valores`) con sus cláusulas equivalentes en SQL (`WHERE`, `GROUP BY`, `CASE WHEN` y `SUM`).',
    'Detectar cuándo una tabla dinámica cambia de `SUMA` a `CUENTA` por celdas vacías o de texto y cómo extraer celdas con `IMPORTARDATOSDINAMICOS`.'
  ],

  sections: [
    {
      id: 'separar-datos-crudos-de-reportes',
      heading: 'Por qué no debes insertar subtotales manuales en los datos crudos',
      body: 'En la tabla `orders` de Mercado Brisa, el grano es estricto: cada fila representa un pedido único (`18.000` filas). Si insertas una fila manual llamada `"Subtotal Andina"` en la fila 4500, rompes ese contrato. Ahora la tabla mezcla pedidos individuales con resúmenes regionales. Cualquier suma general posterior sumará los pedidos y volverá a sumar el subtotal, duplicando el ingreso real.\n\nUna **tabla dinámica** (*PivotTable*) resuelve este problema separando el almacenamiento de la presentación. La tabla estructurada de origen permanece intacta en su propia pestaña. El cuadro de resumen vive en una hoja aparte y se recalcula con un clic cuando entran pedidos nuevos.'
    },
    {
      id: 'cuatro-cuadrantes-y-equivalencia-sql',
      heading: 'Los cuatro cuadrantes de una tabla dinámica traducidos a SQL',
      body: 'Una tabla dinámica se construye arrastrando nombres de columna hacia cuatro áreas. Cada una tiene traducción exacta a una consulta SQL en DuckDB:\n\n1. `Filtros` (`WHERE`): acota qué filas entran al cálculo antes de agrupar, como `status = "completed"` o `is_active = true`.\n\n2. `Filas` (`GROUP BY`): crea una fila de resumen por cada valor distinto de la columna, como `category` o `region`.\n\n3. `Columnas` (`CASE WHEN` / `PIVOT`): despliega los valores de otra categoría hacia la derecha, como `store_type` (`flagship`, `retail`, `warehouse`).\n\n4. `Valores` (`SUM`, `COUNT`, `AVG`): define la operación matemática que rellena las celdas numéricas del cruce.',
      example: {
        language: 'sql',
        code: `SELECT
  category,
  COUNT(product_id) AS skus_activos,
  ROUND(AVG(list_price_usd), 2) AS precio_lista_promedio_usd
FROM products
WHERE is_active = true
  AND list_price_usd > 0
GROUP BY category
ORDER BY precio_lista_promedio_usd DESC;`,
        expectedOutput: [
          {
            category: 'Molinos',
            skus_activos: 34,
            precio_lista_promedio_usd: 152.83
          },
          {
            category: 'Cafeteras',
            skus_activos: 34,
            precio_lista_promedio_usd: 116.48
          },
          {
            category: 'Suscripciones',
            skus_activos: 34,
            precio_lista_promedio_usd: 47.94
          },
          {
            category: 'Accesorios',
            skus_activos: 34,
            precio_lista_promedio_usd: 40.97
          },
          {
            category: 'Café en grano',
            skus_activos: 34,
            precio_lista_promedio_usd: 29.32
          }
        ]
      }
    },
    {
      id: 'trampas-cuenta-vs-suma-y-getpivotdata',
      heading: 'Dos trampas habituales: cambio silencioso a CUENTA y referencias fijas',
      body: 'Al arrastrar una columna de importes al área de `Valores`, comprueba siempre el encabezado generado. Si la columna contiene una sola celda vacía o un texto accidental (como un guion `"-"`), la hoja de cálculo cambia la operación por defecto de `Suma de total_usd` a `Cuenta de total_usd`. En lugar de sumar dólares, estarás contando cuántos pedidos hubo.\n\nAdemás, si necesitas citar un número de la tabla dinámica en otra celda, no escribas `=C5`. Si mañana aparece una categoría nueva, el valor que estaba en `C5` bajará a `C6` y tu fórmula apuntará al renglón equivocado. Usa `IMPORTARDATOSDINAMICOS` (`GETPIVOTDATA`), que busca el dato por nombre de campo y etiqueta (`"region"; "Andina"`) sin importar en qué fila se dibuje.'
    }
  ],

  workedExample: {
    title: 'Tabla dinámica por canal sin filtro de estado frente a resumen depurado',
    description: 'Observa cómo cambia el resumen de ventas por canal (`device_type`) en Mercado Brisa cuando olvidas colocar `status = \'completed\'` en el cuadrante `Filtros` de la tabla dinámica:',
    steps: [
      {
        label: 'Enfoque con error: tabla dinámica sin filtro de estado (incluye cancelados)',
        explanation: 'Si arrastras `device_type` a `Filas` y `total_usd` a `Valores` dejando vacío el área de `Filtros`, la tabla dinámica suma también los pedidos cancelados, reembolsados y pendientes (`18.000` filas).',
        code: `SELECT
  device_type,
  COUNT(order_id) AS todos_los_pedidos,
  ROUND(SUM(total_usd), 2) AS suma_bruta_con_cancelados_usd
FROM orders
GROUP BY device_type
ORDER BY suma_bruta_con_cancelados_usd DESC;`,
        expectedOutput: [
          {
            device_type: 'desktop',
            todos_los_pedidos: 7716,
            suma_bruta_con_cancelados_usd: 3519600.78
          },
          {
            device_type: 'mobile',
            todos_los_pedidos: 6857,
            suma_bruta_con_cancelados_usd: 2677778.45
          },
          {
            device_type: 'pos_tienda',
            todos_los_pedidos: 3427,
            suma_bruta_con_cancelados_usd: 1472438.54
          }
        ]
      },
      {
        label: 'Solución verificada: cuadrante Filtros en completed y métricas en Valores',
        explanation: 'Al fijar `status = \'completed\'` en `Filtros` (`WHERE`), `device_type` en `Filas` (`GROUP BY`) y pedir conteo, suma y promedio en `Valores`, obtenemos las ventas reales de los 14.760 pedidos completados.',
        code: `SELECT
  device_type,
  COUNT(order_id) AS pedidos_completados,
  ROUND(SUM(total_usd), 2) AS ventas_completadas_usd,
  ROUND(AVG(total_usd), 2) AS ticket_promedio_usd
FROM orders
WHERE status = 'completed'
GROUP BY device_type
ORDER BY ventas_completadas_usd DESC;`,
        expectedOutput: [
          {
            device_type: 'desktop',
            pedidos_completados: 6327,
            ventas_completadas_usd: 2867799,
            ticket_promedio_usd: 453.26
          },
          {
            device_type: 'mobile',
            pedidos_completados: 5624,
            ventas_completadas_usd: 2199394.23,
            ticket_promedio_usd: 391.07
          },
          {
            device_type: 'pos_tienda',
            pedidos_completados: 2809,
            ventas_completadas_usd: 1202269.19,
            ticket_promedio_usd: 428.01
          }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'chk-c0-hojas-02-cuadrantes',
      type: 'mcq',
      prompt: 'Quieres construir una tabla dinámica que muestre una fila por cada `region`, una columna por cada `store_type` y la suma de `total_usd` solo para pedidos con `status = "completed"`. ¿Cómo traduces esa configuración a SQL?',
      options: [
        {
          id: 'a',
          text: '`WHERE status = \'completed\'`, `GROUP BY region` y expresiones `SUM(CASE WHEN store_type = ... THEN total_usd ELSE 0 END)`.',
          correct: true,
          feedback: 'Exacto. `Filtros` se traduce a `WHERE`, `Filas` a `GROUP BY`, `Columnas` a columnas condicionales o `PIVOT`, y `Valores` a `SUM()`.'
        },
        {
          id: 'b',
          text: '`ORDER BY region, store_type` sin usar `GROUP BY` ni `WHERE`.',
          correct: false,
          feedback: 'Incorrecto. `ORDER BY` solo ordena las 18.000 filas individuales sin resumirlas ni filtrar estados.'
        },
        {
          id: 'c',
          text: '`GROUP BY total_usd` y `WHERE region = store_type`.',
          correct: false,
          feedback: 'Incorrecto. Agrupar por el importe numérico crea miles de filas sin sentido y comparar `region` con `store_type` devuelve cero registros.'
        }
      ],
      explanation: 'Cada área de una tabla dinámica corresponde a una operación relacional: `Filtros` filtra antes de agrupar (`WHERE`), `Filas` define las claves de agrupación (`GROUP BY`) y `Valores` aplica funciones de agregación (`SUM`, `COUNT`, `AVG`).'
    },
    {
      id: 'chk-c0-hojas-02-cuenta',
      type: 'mcq',
      prompt: 'Arrastras la columna `subtotal_usd` al área de `Valores` de una tabla dinámica y notas que el resultado muestra `14.760` en lugar de millones de dólares. ¿Cuál es la causa más probable?',
      options: [
        {
          id: 'a',
          text: 'Existen celdas vacías o con texto en `subtotal_usd` y la tabla dinámica eligió la operación `CUENTA` en lugar de `SUMA`.',
          correct: true,
          feedback: 'Correcto. Cuando una columna tiene aunque sea una celda vacía o de texto, Excel resume por defecto con `CUENTA` en vez de `SUMA`.'
        },
        {
          id: 'b',
          text: 'Las tablas dinámicas no permiten sumar números con decimales, solo números enteros.',
          correct: false,
          feedback: 'Incorrecto. Las tablas dinámicas suman decimales sin restricción cuando la operación seleccionada es `SUMA`.'
        },
        {
          id: 'c',
          text: 'El área de `Valores` dividió automáticamente los dólares entre mil.',
          correct: false,
          feedback: 'Incorrecto. `14.760` coincide con el conteo de filas de pedidos completados porque la función activa es `CUENTA`.'
        }
      ],
      explanation: 'En las hojas de cálculo, si una columna contiene celdas en blanco o texto, la tabla dinámica asigna `CUENTA` por defecto al arrastrarla a `Valores`. Siempre debes verificar el nombre del campo (`Suma de...` frente a `Cuenta de...`).'
    },
    {
      id: 'chk-c0-hojas-02-subtotales-manuales',
      type: 'predict-output',
      prompt: 'Una tabla tiene 4 pedidos de `$100` cada uno (`$400` reales). Alguien inserta en la fila 6 una fila manual de `"Subtotal"` con `=SUMA(B2:B5)` (`$400`) y luego crea una tabla dinámica sobre las filas 2 a 6. ¿Qué total general mostrará la tabla dinámica?',
      options: [
        {
          id: 'a',
          text: '`$800`, porque suma los 4 pedidos (`$400`) más la fila de subtotal (`$400`) como si fuera un quinto pedido.',
          correct: true,
          feedback: 'Exacto. La tabla dinámica trata cada fila de la tabla de origen como un registro más y duplica el resultado.'
        },
        {
          id: 'b',
          text: '`$400`, porque detecta la palabra `"Subtotal"` y salta esa fila automáticamente.',
          correct: false,
          feedback: 'Incorrecto. Ni las tablas dinámicas ni SQL adivinan que una fila intermedia es un subtotal manual.'
        },
        {
          id: 'c',
          text: '`$0`, porque las fórmulas `=SUMA()` dentro del origen anulan el cálculo.',
          correct: false,
          feedback: 'Incorrecto. La tabla dinámica lee el valor calculado (`$400`) de esa celda y lo suma al resto.'
        }
      ],
      explanation: 'Mezclar filas de datos individuales con filas de subtotales manuales rompe el grano de la tabla y duplica cualquier suma posterior. Los subtotales pertenecen a la tabla dinámica, nunca a la tabla de datos crudos.'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Reproducir una tabla dinámica de ventas por región y tipo de tienda',
    language: 'sql',
    prompt: 'Construye en SQL la misma matriz que generaría una tabla dinámica sobre `orders` unida con `stores`: filtra únicamente los pedidos con `o.status = \'completed\'`, agrupa por `s.region` y calcula `pedidos_completados`, las ventas en tiendas `flagship` (`flagship_usd`), `retail` (`retail_usd`), `warehouse` (`warehouse_usd`) y el total regional (`total_region_usd`), redondeando los importes a 2 decimales y ordenando por `total_region_usd DESC`.',
    starterCode: `SELECT
  s.region,
  COUNT(o.order_id) AS pedidos_completados,
  ROUND(SUM(CASE WHEN s.store_type = 'flagship'
    THEN o.total_usd ELSE 0 END), 2) AS flagship_usd,
  ROUND(SUM(CASE WHEN s.store_type = 'retail'
    THEN o.total_usd ELSE 0 END), 2) AS retail_usd,
  -- Completa la columna pivotada para 'warehouse'
  0.0 AS warehouse_usd,
  ROUND(SUM(o.total_usd), 2) AS total_region_usd
FROM orders o
JOIN stores s ON o.store_id = s.store_id
-- Filtra únicamente los pedidos con estado 'completed'
GROUP BY s.region
ORDER BY total_region_usd DESC;`,
    expected: `SELECT
  s.region,
  COUNT(o.order_id) AS pedidos_completados,
  ROUND(SUM(CASE WHEN s.store_type = 'flagship' THEN o.total_usd ELSE 0 END), 2) AS flagship_usd,
  ROUND(SUM(CASE WHEN s.store_type = 'retail' THEN o.total_usd ELSE 0 END), 2) AS retail_usd,
  ROUND(SUM(CASE WHEN s.store_type = 'warehouse' THEN o.total_usd ELSE 0 END), 2) AS warehouse_usd,
  ROUND(SUM(o.total_usd), 2) AS total_region_usd
FROM orders o
JOIN stores s ON o.store_id = s.store_id
WHERE o.status = 'completed'
GROUP BY s.region
ORDER BY total_region_usd DESC;`,
    orderMatters: true,
    hints: [
      'Reemplaza `0.0 AS warehouse_usd` por `ROUND(SUM(CASE WHEN s.store_type = \'warehouse\' THEN o.total_usd ELSE 0 END), 2) AS warehouse_usd`.',
      'Añade `WHERE o.status = \'completed\'` antes de `GROUP BY s.region` (equivalente al área `Filtros` de la tabla dinámica).',
      'Verifica que la suma de `flagship_usd + retail_usd + warehouse_usd` coincida con `total_region_usd` en cada región.'
    ],
    solution: `SELECT
  s.region,
  COUNT(o.order_id) AS pedidos_completados,
  ROUND(SUM(CASE WHEN s.store_type = 'flagship' THEN o.total_usd ELSE 0 END), 2) AS flagship_usd,
  ROUND(SUM(CASE WHEN s.store_type = 'retail' THEN o.total_usd ELSE 0 END), 2) AS retail_usd,
  ROUND(SUM(CASE WHEN s.store_type = 'warehouse' THEN o.total_usd ELSE 0 END), 2) AS warehouse_usd,
  ROUND(SUM(o.total_usd), 2) AS total_region_usd
FROM orders o
JOIN stores s ON o.store_id = s.store_id
WHERE o.status = 'completed'
GROUP BY s.region
ORDER BY total_region_usd DESC;`,
    solutionExplanation: 'En esta consulta, `WHERE o.status = \'completed\'` actúa como el área `Filtros` de la tabla dinámica, `GROUP BY s.region` actúa como `Filas`, cada `SUM(CASE WHEN s.store_type = ...)` actúa como `Columnas`, y `SUM(o.total_usd)` calcula el total general de cada fila.',
    expectedOutputTable: [
      {
        region: 'Cono Sur',
        pedidos_completados: 4920,
        flagship_usd: 428162.82,
        retail_usd: 1631623.57,
        warehouse_usd: 0,
        total_region_usd: 2059786.39
      },
      {
        region: 'Andina',
        pedidos_completados: 4921,
        flagship_usd: 492586.11,
        retail_usd: 1129304.49,
        warehouse_usd: 368663.52,
        total_region_usd: 1990554.12
      },
      {
        region: 'Iberia',
        pedidos_completados: 2811,
        flagship_usd: 280783.01,
        retail_usd: 280755.47,
        warehouse_usd: 786831.2,
        total_region_usd: 1348369.68
      },
      {
        region: 'Norteamérica',
        pedidos_completados: 2108,
        flagship_usd: 187614.32,
        retail_usd: 440210.39,
        warehouse_usd: 242927.52,
        total_region_usd: 870752.23
      }
    ]
  },

  roleNotes: {
    de: 'Las tablas dinámicas con columnas desplegadas hacia la derecha son vistas de consumo humano; cuando una hoja así deba entrar a un pipeline, despivótala primero a formato largo (`region`, `store_type`, `ventas_usd`).',
    da: 'Construye siempre tus tablas dinámicas a partir de una tabla estructurada en otra hoja y reconcilia el Gran Total contra una consulta `SELECT SUM(total_usd) FROM orders WHERE status = \'completed\'`.',
    bi: 'Una matriz visual en Power BI es el equivalente directo de una tabla dinámica: evita importar hojas ya pivotadas por meses o tipos de tienda porque impiden filtrar por fecha en el modelo semántico.'
  },

  summary: [
    'Nunca insertes filas de subtotales manuales dentro de la tabla de datos crudos.',
    'En una tabla dinámica, `Filtros` equivale a `WHERE`, `Filas` a `GROUP BY` y `Valores` a `SUM` o `COUNT`.',
    'Una sola celda vacía o de texto hace que `Valores` cambie de `SUMA` a `CUENTA` por defecto.',
    'Usa `IMPORTARDATOSDINAMICOS` en lugar de coordenadas fijas como `=C5` para extraer métricas del resumen.'
  ],

  flashcards: [
    {
      id: 'fc-c0-hojas-02-a',
      front: '¿A qué cláusulas de SQL corresponden los cuadrantes `Filtros`, `Filas` y `Valores` de una tabla dinámica?',
      back: '`Filtros` corresponde a `WHERE`, `Filas` corresponde a `GROUP BY` y `Valores` corresponde a funciones de agregación como `SUM()`, `COUNT()` o `AVG()`.'
    },
    {
      id: 'fc-c0-hojas-02-b',
      front: '¿Por qué una tabla dinámica a veces aplica `CUENTA` en vez de `SUMA` al arrastrar una columna de importes?',
      back: 'Porque si la columna contiene al menos una celda vacía o con texto, la hoja no la reconoce como 100 % numérica y elige contar celdas por defecto.'
    },
    {
      id: 'fc-c0-hojas-02-c',
      front: '¿Por qué es peligroso apuntar con `=C5` a una celda dentro de una tabla dinámica?',
      back: 'Porque al actualizar datos o añadir categorías nuevas la posición de las filas se desplaza; debe usarse `IMPORTARDATOSDINAMICOS` (`GETPIVOTDATA`).'
    }
  ],

  glossaryTerms: [
    'c0-hojas-tabla-dinamica',
    'c0-hojas-tabla-estructurada'
  ],

  sources: [
    {
      title: 'Create a PivotTable to analyze worksheet data',
      url: 'https://support.microsoft.com/en-us/office/create-a-pivottable-to-analyze-worksheet-data-a9a84538-bfe9-40a9-a8e9-f99134456576',
      publisher: 'Microsoft Support',
      accessed: '2026-10-29',
      supports: 'Diseño de tablas dinámicas en hojas separadas y uso de los cuatro cuadrantes (Filtros, Filas, Columnas y Valores).'
    },
    {
      title: 'GETPIVOTDATA function',
      url: 'https://support.microsoft.com/en-us/office/getpivotdata-function-8c083b99-a922-4ca0-af5e-3af55960761f',
      publisher: 'Microsoft Support',
      accessed: '2026-10-29',
      supports: 'Consulta estable de valores de una tabla dinámica por nombre de campo y elemento frente a referencias de celda fijas.'
    },
    {
      title: 'DuckDB SQL Reference — PIVOT and GROUP BY Statements',
      url: 'https://duckdb.org/docs/sql/statements/pivot.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports: 'Equivalencia entre tablas dinámicas de hojas de cálculo y agrupaciones condicionales o PIVOT en SQL.'
    }
  ],

  aiNotes: 'Las dos confusiones más habituales son insertar filas de subtotales en la misma tabla de origen (duplicando el total general) y no notar que la tabla dinámica está contando pedidos (`CUENTA`) en lugar de sumar dólares (`SUMA`). Pide siempre a la persona traducir mentalmente la tabla dinámica a `WHERE` + `GROUP BY` + `SUM()`.'
};

export default lesson;
